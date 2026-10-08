# SDD: Camada de sincronização (EPIC-01.6)

## Problem

Toda a leitura da UI vem do SQLite local (offline-first, 01.4). O Supabase (01.5) tem o mesmo
schema com RLS por `auth.uid()`. Falta a ponte: o que o viajante faz offline (guardar um local,
terminar um percurso, eventos do percurso) tem de chegar ao servidor sem duplicados, e o que muda
no servidor (catálogo, dados do utilizador vindos de outro dispositivo) tem de chegar ao SQLite.

Factos em 2026-09-28:

- Nada escreve ainda na `outbox` local; os ecrãs são placeholders.
- No Postgres só `routes` tem `updated_at`. Sem ele não há pull incremental.
- Apagar no servidor é `delete`: um pull por `updated_at` nunca vê a linha apagada.
- Os ids do seed de demonstração não são UUID (`route-demo-lisboa`); o servidor recusa-os.
- `sources`/`payload` são texto JSON no SQLite e `jsonb` no Postgres.

## Goals

- Escritas locais chegam ao servidor quando houver rede, na ordem em que foram feitas.
- Reenviar (retry, crash a meio, "reenvio forçado") nunca duplica linhas.
- Alterações do servidor chegam ao SQLite de forma incremental, incluindo remoções.
- Estado de sync visível globalmente (offline, a sincronizar, pendentes, erro).
- Trocar de utilizador ou sair apaga os dados do utilizador anterior do dispositivo.

Não objetivos: sync em background com a app fechada; realtime; resolução de conflitos com
relógio do cliente; apagar conteúdo do catálogo no dispositivo (ver Risks).

## Scope

Dentro:

- Migração Postgres: `updated_at` (trigger, relógio do servidor) em todas as tabelas
  sincronizadas; `deleted_at` (tombstone) em `saved_items`, `journeys`, `downloads`; índices para o
  pull.
- Migração SQLite: colunas de controlo na `outbox` (`attempts`, `last_error`, `failed_at`).
- `src/lib/sync/`: outbox, push, pull, motor com backoff, NetInfo/AppState, limpeza por utilizador.
- Repositório de `saved_items` (guardar/remover/listar) a escrever local + outbox numa transação:
  é o que a aceitação exercita. Os outros repositórios chegam com as features (EPIC-07+), usando o
  mesmo `enqueue`.
- Indicador global de estado (`useSyncStatus` + componente discreto).
- Seed de demonstração com UUIDs.

Fora: ecrãs de guardados (EPIC-16), downloads de áudio (EPIC-18), UI final do indicador (design).

## Architecture

### Decisões

1. **Conflitos: última a sincronizar, por campo** (decisão do utilizador, 2026-09-28). A outbox
   guarda só os campos alterados; o push aplica esse patch. Campos diferentes editados em dois
   dispositivos juntam-se; no mesmo campo ganha quem sincroniza por último. Não depende do relógio
   do telemóvel. `journey_events` é append-only: só insert, nunca update.
2. **Cursor de pull = `updated_at` do servidor**, posto por trigger com `now()`. Como `now()` é a
   hora de início da transação, uma transação lenta pode fazer commit com um `updated_at` anterior
   ao cursor já lido. O pull relê uma janela de sobreposição (`cursor - 5 min`); aplicar linhas é
   idempotente, por isso reler não custa correção.
3. **Remoções = tombstones.** `saved_items`, `journeys` e `downloads` ganham `deleted_at`. O
   cliente nunca faz `delete` no servidor: faz `update deleted_at = now()`. O pull, ao ver
   `deleted_at`, apaga a linha local.
4. **Idempotência pela chave da linha.** Todas as linhas têm UUID gerado no cliente. Insert =
   `upsert` (`on conflict (id)`); em `saved_items`/`downloads` o conflito é na chave natural
   `(user_id, item_type, item_id)`, para que o mesmo local guardado em dois dispositivos seja uma
   só linha (ganha o id de quem sincroniza por último; o pull reconcilia o id local pela mesma
   chave). `journey_events`: `insert … on conflict do nothing`. Patch e tombstone são
   idempotentes por natureza. Replay de qualquer entrada da outbox dá o mesmo resultado.
5. **PostgREST, não RPC.** Push e pull usam `supabase-js` com a sessão do utilizador, logo com as
   policies de 01.5. Sem service role e sem funções novas expostas.

### Fluxo

```
UI → repositório → transação SQLite { linha local + entrada na outbox } → requestSync()

Ciclo de sync (um de cada vez; pedidos durante um ciclo marcam "correr outra vez"):
  1. sem sessão ou offline → termina
  2. push: entradas com synced_at null e failed_at null, por created_at
       ok                  → synced_at = agora
       erro de rede / 5xx  → pára o ciclo, agenda retry com backoff
       erro permanente 4xx → failed_at + last_error (dead letter), continua
  3. pull por tabela (pais primeiro): routes, places, stops, stories, story_audio,
     journeys, journey_events, saved_items, downloads
       select * where updated_at > cursor - 5 min order by updated_at, id (páginas de 500)
       linhas com entradas pendentes na outbox são ignoradas (vão no próximo push e voltam)
       deleted_at → apaga local; senão upsert local (JSON: jsonb ↔ texto)
       cursor (tabela meta) = maior updated_at visto
  4. sync store: pendingCount, lastSyncedAt, isSyncing, lastError
```

Gatilhos: arranque com sessão, rede de volta (NetInfo), app em foreground (AppState), escrita
local (debounce 1 s). Backoff: 2 s × 2^n com jitter, máx. 5 min; reinicia com rede nova ou sucesso.

Utilizador: as linhas locais levam `user_id` da session store. Sair ou mudar de utilizador apaga
`saved_items`, `journeys`, `journey_events`, `downloads`, a `outbox` e os cursores dessas tabelas.
O catálogo fica (não é pessoal).

### Contratos

```ts
// src/lib/sync/remote.ts — implementado com supabase-js; nos testes, um fake em memória.
type SyncRemote = {
  upsert(
    table,
    rows,
    options: { onConflict: string; ignoreDuplicates?: boolean },
  ): Promise<void>;
  // match = { id } ou a chave natural (saved_items, downloads)
  update(table, match, patch): Promise<void>;
  // keyset: linhas depois de (updatedAt, id), por updated_at, id
  pull(
    table,
    after: { updatedAt: string; id: string } | null,
    limit: number,
  ): Promise<Row[]>;
};
```

Erros: `SyncRemoteError.retryable` é verdadeiro para rede (status 0), 401, 408, 429 e 5xx; o
resto é recusa definitiva (dead letter).

Outbox (`payload` JSON): `insert` = linha completa; `update` = só os campos alterados;
`delete` = `{}` (vira `deleted_at` no push). Em `saved_items`/`downloads`, `update` e `delete`
levam também a chave natural, porque o servidor pode conhecer a linha por outro id.

### Migrações

- Postgres `…_sync.sql`: `updated_at timestamptz not null default now()` + trigger
  `private.set_updated_at` nas 9 tabelas; `deleted_at timestamptz` nas 3 tabelas com tombstone;
  índices `(user_id, updated_at)` e `(updated_at)`. Aditiva.
- SQLite (drizzle `0001`): `outbox.user_id text`, `attempts integer not null default 0`,
  `last_error text`, `failed_at text` e um índice `(entity_type, entity_id)`. Aditiva. O push só
  envia entradas do utilizador com sessão.

## Rollout

1. Migração Postgres + testes PGlite; o utilizador corre `supabase db push`.
2. Migração SQLite + motor + repositório + testes.
3. Gatilhos (NetInfo, AppState) e indicador.
4. Validação completa; aceitação por teste automático com o fake remoto e as regras de conflito
   reais do Postgres (PGlite).

Rollback: as colunas são aditivas e o cliente antigo ignora-as; o trigger pode ser removido sem
perder dados. Desligar a sync = não montar o hook no layout.

## Risks

- **Relógio do servidor e transações longas:** coberto pela janela de 5 min.
- **Remoções do catálogo** não chegam ao dispositivo (o catálogo não tem tombstones). Aceitável
  enquanto o catálogo só cresce; rever com o EPIC-18 (downloads).
- **Dead letters:** uma entrada recusada (ex. item que já não existe) fica em `failed_at` e é
  contada no estado; não bloqueia as seguintes. Sem UI para as rever nesta fase.
- **Sem background sync:** o que ficou por enviar vai no próximo arranque/foreground.
- **Volume:** pull paginado a 500; o catálogo completo no primeiro arranque pode demorar.

## Verification

- PGlite (`supabase/tests/sync.test.ts`): trigger atualiza `updated_at`; tombstone por update
  respeita RLS; upsert pela chave natural não duplica; `journey_events` com `on conflict do
nothing` é idempotente.
- Jest (`src/lib/sync/__tests__`): SQLite real (`node:sqlite`, como em 01.4) + remoto em memória.
  Aceitação: guardar 3 locais offline → online → 3 linhas no remoto; reenvio forçado (outbox
  reposta a não sincronizada) → continuam 3. Também: patch por campo, tombstone, retry/backoff,
  dead letter, troca de utilizador, pull incremental com sobreposição.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `expo export --platform all`.

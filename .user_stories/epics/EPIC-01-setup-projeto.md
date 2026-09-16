# EPIC-01 — Setup do projeto

**Objetivo:** ter um repositório Expo funcional, offline-first, com estado, persistência local, backend, testes e documentação de componentes — pronto para receber features sem decisões de arquitetura pendentes.

**Estimativa:** 13 pts · **Telas:** nenhuma (fundação)

## Stack

| Camada | Escolha |
|---|---|
| Runtime | React Native + **Expo** (SDK managed, dev client) |
| Navegação | **expo-router** (file-based, typed routes) |
| Estado | **Zustand** (stores por domínio + middleware persist) |
| Base local | **SQLite** (`expo-sqlite`) com Drizzle ORM e migrações versionadas |
| Backend | **Supabase** (Postgres, Auth, Storage, Edge Functions, RLS) |
| Sync | Offline-first: escrita local → outbox → push/pull para Supabase |
| Testes de UI | **React Native Testing Library** + Jest |
| Testes E2E | **Maestro** (fluxos em YAML) |
| Documentação | **Storybook** (react-native + web para revisão de design) |

## Histórias

### 01.1 — Bootstrap do repositório
Como dev, quero um projeto Expo com TypeScript estrito e lint/format automáticos, para começar sem discutir configuração.

- `npx create-expo-app` com template TypeScript; `tsconfig` `strict: true`, paths `@/*`.
- ESLint + Prettier + import/order; Husky + lint-staged no pre-commit.
- Estrutura de pastas:
```
app/                 rotas (expo-router)
src/features/<dom>/  ui, hooks, store, queries, schema
src/components/      design system (EPIC-02)
src/db/              schema drizzle, migrações, seeds
src/lib/             supabase, sync, audio, location, analytics
src/stores/          zustand stores globais
tests/               helpers, factories
.maestro/            fluxos E2E
```
- **Aceitação:** `yarn ios`, `yarn android` e `yarn web` arrancam; `yarn lint`, `yarn typecheck`, `yarn test` passam em CI.

### 01.2 — Navegação com expo-router
Como dev, quero rotas por ficheiro com grupos de layout, para mapear os fluxos do design 1:1.

- Grupos: `(auth)`, `(onboarding)`, `(tabs)`, `(journey)`, modais.
- Guarda de sessão no layout raiz: sem sessão → `(auth)`; sessão sem onboarding → `(onboarding)`; caso contrário `(tabs)`.
- Deep links (`waytale://route/:id`) e `expo-linking` configurados.
- **Aceitação:** navegação profunda restaura o ecrã correto após cold start; voltar do OTP não reentra em estado inválido.

### 01.3 — Estado com Zustand
Como dev, quero stores previsíveis e persistidas, para o estado sobreviver a reinícios.

- Stores: `sessionStore`, `preferencesStore`, `journeyStore` (percurso ativo), `playerStore` (áudio), `syncStore` (fila e conectividade).
- `persist` com storage MMKV/AsyncStorage; `partialize` para nunca persistir tokens em claro (tokens → SecureStore).
- Selectors memoizados; proibido consumir a store inteira num componente.
- **Aceitação:** matar a app durante um percurso e reabrir retoma paragem e posição do áudio.

### 01.4 — SQLite local como fonte de verdade
Como utilizador, quero que a app funcione sem rede, porque ando na rua e no estrangeiro.

- Tabelas: `routes`, `stops`, `stories`, `story_audio`, `places`, `saved_items`, `journeys`, `journey_events`, `downloads`, `outbox`, `meta`.
- Migrações Drizzle versionadas + seed de demonstração para dev e Storybook.
- Toda a leitura da UI vem do SQLite; a rede apenas alimenta o SQLite.
- **Aceitação:** em modo avião, home, rotas descarregadas, guardados e player funcionam sem ecrã de erro.

### 01.5 — Supabase e autenticação
Como dev, quero backend com RLS e sessão persistida, para dados de utilizador seguros.

- Cliente Supabase com refresh automático e sessão em SecureStore.
- Auth por telefone (OTP) + password; RLS por `auth.uid()` em todas as tabelas de utilizador.
- Storage para áudio e imagens com URLs assinados; Edge Function para geração de rota.
- **Aceitação:** teste de RLS prova que o utilizador A não lê dados de B.

### 01.6 — Camada de sincronização
Como utilizador, quero que o que fiz offline apareça depois, sem duplicados.

- Pull incremental por `updated_at`; push da `outbox` com idempotency key.
- Resolução de conflitos: last-write-wins por campo, exceto `journeys` (append-only).
- Retry com backoff exponencial; escuta de `NetInfo`; indicador global de estado de sync.
- **Aceitação:** guardar 3 locais offline, voltar online → 3 registos no servidor, zero duplicados após reenvio forçado.

### 01.7 — Storybook
Como designer, quero ver os componentes isolados, para validar o design system sem correr a app.

- Storybook RN no dev client + build web publicado em preview por PR.
- Decorators com tokens, safe-area e mocks de store.
- **Aceitação:** PR que toca um componente publica link de preview.

### 01.8 — Testes
Como equipa, queremos rede de segurança antes das features.

- RNTL: render helper com providers, factories de dados, `msw` para rede.
- Maestro: fluxos `onboarding.yaml`, `auth.yaml`, `journey.yaml`; `testID` obrigatório em elementos interativos.
- CI: lint → typecheck → unit → build EAS preview → Maestro no emulador.
- **Aceitação:** pipeline verde e bloqueante no merge; cobertura mínima 60% em `src/features`.

## Riscos

- Áudio em background e localização contínua exigem dev client (não Expo Go) — assumir desde o dia 1.
- Consumo de bateria da localização: definir orçamento e medir já nesta fase.

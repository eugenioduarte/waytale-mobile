# Estratégia de Testes — Waytale

## Pirâmide de Testes

```
          ▲
         / \
        / E2E \         Maestro (mobile)
       /────────\
      /Integration\     Jest + MSW — fluxos completos com API mockada
     /────────────\
    /  Unit Tests  \    Jest + Testing Library — lógica isolada
   /________________\
```

## O que testar em cada camada

### Unit (Jest + React Native Testing Library)

- **Models**: tipos e validações (zod schemas)
- **Services**: cada função pública com mocks locais
- **Hooks**: comportamento isolado (`renderHook`)
- **Stores**: Zustand stores (setState, persist)
- **Normalizers**: transformação DTO → Model
- **Helpers/Utils**: funções puras (ex.: cálculo de desvio de rota, formatação de duração)

### Integration (Jest + MSW)

- **Fluxos de tela**: onboarding, auth (código por email), descoberta de rota, journey completo
- **Estados**: loading, empty, error, success — incluindo "sem histórias por aqui" e offline
- **Navegação**: transições entre telas (grupos `(auth)`, `(onboarding)`, `(tabs)`, `(journey)`)
- **Formulários**: validação, submissão, feedback

### E2E (Maestro)

- **Fluxos críticos**: `onboarding.yaml`, `auth.yaml`, `journey.yaml` (ver EPIC-01.8)
- **Apenas happy path + 1 variação crítica por fluxo**
- **Sem mock de API** — usa ambiente dev/staging real

## Cobertura

| Alvo                                   | Mínimo |
| -------------------------------------- | ------ |
| Global                                 | ≥ 80%  |
| Hooks e Services                       | ≥ 90%  |
| Screens                                | ≥ 70%  |
| `src/features` (gate de CI, EPIC-01.8) | ≥ 60%  |

## Como rodar

```bash
pnpm test                          # turbo run test — todas as camadas, todo o monorepo
pnpm --filter mobile test          # apenas apps/mobile
pnpm --filter mobile test:cov      # com cobertura — falha abaixo de 60% em src/features (gate do CI)
pnpm --filter mobile e2e           # todos os fluxos Maestro (.maestro/)
pnpm --filter mobile e2e:smoke     # só os marcados `smoke`
```

Node ≥ 22.13 (`.nvmrc`: 24): os testes de sync usam `node:sqlite` e são saltados em Node mais
antigo.

## Infraestrutura (EPIC-01.8)

Tudo em `apps/mobile/tests/`, importado com o alias `@tests/...` (só existe no Jest e no
`tsconfig`, não vai para o bundle):

| Ficheiro                | Para quê                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/render.tsx`      | `renderWithProviders(ui, { stores })` — providers + stores repostos; `renderApp(url, { stores })` — o router real de `src/app` (guardas incluídas) |
| `tests/factories.ts`    | `buildUser`, `buildSession`, `buildSavedItem`, `uuid()`, `isoAt()` — dados válidos, ids determinísticos                                            |
| `tests/msw/handlers.ts` | handlers do Supabase Auth (caminho feliz) + `authError(status, code)`; URL de teste fixa                                                           |
| `tests/msw/server.ts`   | `server` — cada ficheiro faz `listen({ onUnhandledRequest: 'error' })` / `resetHandlers` / `close`                                                 |
| `tests/helpers/sync.ts` | SQLite em memória com as migrações reais + `FakeRemote` (01.6)                                                                                     |

- **Rede**: MSW intercepta o `fetch` do supabase-js real — o teste cria o seu cliente apontado para
  `SUPABASE_TEST_URL` e passa-o ao serviço (`createAuthApi(() => client)`). Um pedido sem handler
  falha o teste.
- **Ecrãs e navegação**: `renderApp` monta o root layout real; o teste faz mock local de
  `@/db/client`, `@/lib/sync/use-sync` e `@/features/auth/use-supabase-auth-sync`
  (exemplo: `src/features/auth/__tests__/auth.flow.integration.test.tsx`).
- **`testID` obrigatório** em elementos interativos — regra ESLint `waytale/require-testid`
  (`tooling/eslint/rules/`): `Pressable`, `Touchable*`, `TextInput`, `Switch`, `Button` e o
  `Action` da app. Formato `<ecrã>-<ação>` (`login-continue`); ecrãs têm `screen-<rota>` e
  separadores `tab-<nome>`. Testes e Maestro selecionam por eles, não pela copy.

### E2E (Maestro)

- Fluxos em `apps/mobile/.maestro/`: `auth.yaml`, `onboarding.yaml`, `journey.yaml` — por `testID`.
- Instalar: Java 17+ e `curl -fsSL "https://get.maestro.mobile.dev" | bash` (Windows: WSL ou o zip
  do release); correr com um emulador/simulador aberto e a app instalada.
- Por agora usam o **login de pré-visualização** dos ecrãs provisórios: correm contra um build **sem**
  env do Supabase (`canUsePreviewAuth`). Com o ecrã real de código (EPIC-04), o `auth.yaml` passa
  a ler o código do email de teste (Supabase local: Mailpit).
- No CI entram com 01.13 (build EAS de preview + emulador).

## Estrutura de arquivos

```
apps/mobile/
  src/features/auth/__tests__/
    api.test.ts                          ← Unit (mock no boundary)
    auth.integration.test.ts             ← Integration (supabase-js real + MSW)
    auth.flow.integration.test.tsx       ← Integration (router real: guardas, onboarding, logout)
  src/features/saved/__tests__/
    saved.test.ts                        ← Unit (SQLite em memória)
  tests/                                 ← render, factories, msw, helpers
  .maestro/
    onboarding.yaml                      ← E2E
    auth.yaml                            ← E2E
    journey.yaml                         ← E2E
```

Nunca pôr testes dentro de `src/app/` — o expo-router tomaria os ficheiros por rotas.

## Regras

1. **Mocks locais e explícitos** — sem mocks globais compartilhados
2. **Sem chamadas de API reais em unit tests** — mock no service boundary
3. **Um assertion por cenário lógico** — agrupar com `describe`
4. **Testar comportamento, não implementação**
5. **SDD como fonte de cenários** — ler o épico/SDD da feature antes de escrever testes
6. **Criar testes no mesmo PR do código** — não adiar

# Estratégia de Testes — Waytale

## Pirâmide de Testes

```
          ▲
         / \
        / E2E \         Maestro (mobile)
       /────────\
      /Integration\     Jest + Mockoon — fluxos completos contra o mock partilhado
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

### Integration (Jest + Mockoon)

- **Fluxos de tela**: onboarding, auth (código por email), descoberta de rota, journey completo
- **Estados**: loading, empty, error, success — incluindo "sem histórias por aqui" e offline
- **Navegação**: transições entre telas (grupos `(auth)`, `(onboarding)`, `(tabs)`, `(journey)`)
- **Formulários**: validação, submissão, feedback

### E2E (Maestro)

- **Fluxos críticos**: `onboarding.yaml`, `auth.yaml`, `journey.yaml` (ver EPIC-01.8)
- **Apenas happy path + 1 variação crítica por fluxo**
- **EPIC-01:** smoke de navegação em APK preview sem backend. Integração de rede usa Mockoon
  nos testes Jest; OTP/backend real nos E2E depende dos formulários do EPIC-04.

## Cobertura

| Grupo (gate EPIC-01.13)                                                | Mínimo nas quatro métricas |
| ---------------------------------------------------------------------- | -------------------------- |
| Telas `src/app`                                                        | 60%                        |
| Componentes `src/components`                                           | 60%                        |
| Features `src/features`                                                | 60%                        |
| Restante código da app (`global` do Jest após retirar os grupos acima) | 60%                        |

Stories, suporte do Storybook, declarações e migrações geradas não entram no denominador.
Os testes de stories e migrações continuam obrigatórios. Metas maiores serão decididas nos
épicos funcionais; o limite vigente é 60%, conforme decisão do utilizador.

## Como rodar

```bash
pnpm test                          # turbo run test — todas as camadas, todo o monorepo
pnpm --filter mobile test          # apenas apps/mobile
pnpm --filter mobile test:cov      # com cobertura — falha abaixo de 60% em qualquer grupo/métrica
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
| `tests/mockoon.ts`      | `startMockServer()` (Mockoon real, um processo por ficheiro), `scenarios`, `mockFetch`, `UNREACHABLE_URL` (EPIC-01.11)                             |
| `tests/helpers/sync.ts` | SQLite em memória com as migrações reais + `FakeRemote` (01.6)                                                                                     |

- **Rede**: o mesmo Mockoon do dev (`tooling/mockoon/`; ver `mock-data.md` e a skill `mock-data`).
  - O teste arranca-o no `beforeAll`.
  - Cria o seu cliente real (supabase-js ou `createHttpClient`) apontado para `mock.url`, com
    `global: { fetch: mockFetch }`.
  - O cenário escolhe-se pelo input (`scenarios.auth.email.rateLimited`); nenhum teste redefine
    respostas.
  - `await mock.requests()` mostra o que chegou ao mock.
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
  backend Supabase (`EXPO_PUBLIC_BACKEND_DISABLED=true` no perfil preview, `canUsePreviewAuth`). Com o ecrã real de código (EPIC-04), o `auth.yaml` passa
  a ler o código do email de teste (Supabase local: Mailpit).
- `.github/workflows/ci.yml` liga EAS preview ao Maestro num emulador Android API 36.
  A execução remota depende da configuração em EPIC-01/PENDENCIAS.md.
- `pnpm verify` é o comando comum ao CI e aos dois hooks Husky.
- O arranque do Mockoon tem limite interno de 25 s e hooks `beforeAll` de 30 s; falhas
  encerram o processo filho, evitando que um timeout deixe Jest pendurado.

## Estrutura de arquivos

```
apps/mobile/
  src/features/auth/__tests__/
    api.test.ts                          ← Unit (mock no boundary)
    auth.integration.test.ts             ← Integration (supabase-js real + Mockoon)
    auth.flow.integration.test.tsx       ← Integration (router real: guardas, onboarding, logout)
  src/features/saved/__tests__/
    saved.test.ts                        ← Unit (SQLite em memória)
  src/lib/__tests__/
    http.integration.test.ts             ← Integration (axios real + Mockoon)
  src/lib/sync/__tests__/
    sync.mockoon.integration.test.ts     ← Integration (pull real + Mockoon → SQLite)
  tests/                                 ← render, factories, mockoon, helpers
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

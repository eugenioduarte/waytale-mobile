# Waytale — Stack Técnico

Fonte formal do plano: `../.user_stories/EPIC-01-setup-projeto/EPIC-01-setup-projeto.md`. Este ficheiro reflete o
que já está montado no repositório vs. o que ainda falta instalar/configurar.

## App Mobile

| Item                        | Escolha                                                                                        | Estado                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Runtime                     | Expo SDK ~57 · React Native 0.86 · TypeScript strict                                           | ✅ scaffolded                                                                                    |
| Navegação                   | `expo-router` (file-based, typed routes)                                                       | ✅ scaffolded                                                                                    |
| Estado cliente              | Zustand (5 stores globais) + AsyncStorage                                                      | ✅ montado (EPIC-01.3)                                                                           |
| Base local                  | SQLite (`expo-sqlite`) + Drizzle ORM (11 tabelas, migrações, seed)                             | ✅ montado (EPIC-01.4)                                                                           |
| Backend                     | Supabase (Postgres, Auth, Storage, Edge Functions, RLS)                                        | 🟡 schema/RLS/storage/Edge Function + cliente prontos (EPIC-01.5); falta email/SMTP no dashboard |
| Sync                        | Offline-first: escrita local → outbox → push/pull para Supabase                                | ✅ montado (EPIC-01.6)                                                                           |
| Estilo                      | NativeWind 4 (Tailwind CSS 3) com o tema gerado dos tokens do EPIC-02                          | ✅ montado (EPIC-01.10)                                                                          |
| i18n                        | i18next + `react-i18next` + `expo-localization` — pt, en, es                                   | ✅ montado (EPIC-01.9)                                                                           |
| HTTP client                 | Axios — instância única em `src/lib/http.ts` (Edge Functions)                                  | ✅ montado (EPIC-01.11)                                                                          |
| Datas                       | date-fns — tudo em `src/lib/date.ts` (lint proíbe `Date`/`Intl` fora dele)                     | ✅ montado (EPIC-01.11)                                                                          |
| Mock de API                 | Mockoon — fonte única de dados mock, com os caminhos do Supabase; dev e testes                 | ✅ montado (EPIC-01.11): `pnpm mockoon`, `start:mock`, testes contra ele                         |
| Crash / Push / Analytics    | Firebase — Crashlytics, Cloud Messaging, Analytics (`@react-native-firebase/*` 26)             | ✅ montado (EPIC-01.12) para Android; validação no dispositivo com os testes de UI               |
| Testes de UI/lógica         | React Native Testing Library + Jest                                                            | ✅ montado (EPIC-01.8): RNTL, Mockoon (01.11), `tests/`, gate 60% em `src/features`              |
| Testes E2E                  | Maestro (fluxos em YAML)                                                                       | 🟡 fluxos em `.maestro/` (EPIC-01.8); correm no CI com 01.13                                     |
| Documentação de componentes | Storybook (react-native + web)                                                                 | ✅ montado (EPIC-01.7); preview por PR no GitHub Pages                                           |
| CI                          | GitHub Actions — lint/typecheck/testes bloqueantes, SonarQube, Dependabot                      | 🟡 lint/typecheck/testes + cobertura (EPIC-01.8); EAS, Maestro e Sonar em 01.13                  |
| CD                          | EAS Build + EAS Submit — Android apenas por agora                                              | ⬜ a configurar                                                                                  |
| Monorepo                    | pnpm workspaces + Turborepo                                                                    | ✅ montado                                                                                       |
| Gestor de pacotes           | pnpm                                                                                           | ✅ em uso                                                                                        |
| Lint / format               | ESLint flat config (Expo + `import-x/order`) + Prettier; `husky` + `lint-staged` no pre-commit | ✅ montado (EPIC-01.1)                                                                           |

## Estrutura atual do repositório (monorepo)

```
apps/
  mobile/            app Expo — src/ (app/, components/, constants/, features/, db/, hooks/, i18n/, lib/, stores/),
                     tests/ (helpers, factories) e .maestro/ (fluxos E2E) na raiz do pacote Expo
packages/
  ui/                @waytale/ui — scaffold vazio, por preencher em EPIC-02
tooling/
  eslint/            @waytale/eslint-config — base.js + expo-app.js (eslint flat config)
  jest/              @waytale/jest-config — preset expo-app.js
  mockoon/           @waytale/mockoon-config — waytale.json + data/ (dados mock centralizados) + startMockServer
  prettier/           @waytale/prettier-config
  tailwind/          @waytale/tailwind-config — tokens.json (tokens do EPIC-02, fonte única) + preset Tailwind gerado dele
  typescript/        @waytale/typescript-config — base.json, expo-app.json, react-library.json
```

Validado: `pnpm install`, `pnpm lint`/`pnpm typecheck` (via turbo, com cache), e
`expo export` dentro de `apps/mobile` para as três plataformas (web, iOS e Android) — o Metro
resolve o workspace (`metro.config.js` com `watchFolders`/`disableHierarchicalLookup`) e produz
bundle sem erros. O pre-commit (`husky` + `lint-staged`) foi validado com um ficheiro descartável.

## Estrutura dentro de `apps/mobile/` (criada em EPIC-01.1)

```
src/app/         rotas expo-router — grupos (auth), (onboarding), (tabs), (journey) e (modals) (EPIC-01.2)
src/features/<dom>/  ui, hooks, store, queries, schema — por domínio (auth, onboarding, journey, ...)
src/components/  primitivos locais — o design system partilhado vive em packages/ui (EPIC-02)
src/constants/   tokens.ts — valores crus dos tokens do design system, para props sem className (EPIC-01.10)
src/hooks/       hooks transversais
src/db/          schema drizzle, migrações, seeds (EPIC-01.4)
src/lib/         supabase, sync, audio, location, analytics, http (axios), date, i18n
src/stores/      zustand stores globais (EPIC-01.3)
src/i18n/        copy por idioma: pt.json (fonte das chaves), en.json, es.json (EPIC-01.9)
tests/           render (providers, `renderApp`), factories, mockoon.ts — import `@tests/...` (EPIC-01.8/01.11)
.maestro/        fluxos E2E auth/onboarding/journey por `testID` (EPIC-01.8)
```

`src/stores/session.store.ts` é a sessão global (Zustand, 01.3), consumida pela guarda de rotas;
a sessão Supabase fica cifrada (01.5, `src/lib/supabase/`).

## Firebase — decisões (EPIC-01.12)

- **Só Android por agora nos testes:** o package Android e o `bundleIdentifier` iOS são ambos
  `com.waytale.app`, e as duas apps estão registadas no Firebase. O prebuild iOS precisa de macOS
  ou do EAS.
- **Ficheiros de config:** `google-services.json` e `GoogleService-Info.plist` ficam em
  `apps/mobile/` e estão no `.gitignore`. O `app.config.js` lê-os do disco ou das env vars de
  ficheiro do EAS (`GOOGLE_SERVICES_JSON`, `GOOGLE_SERVICE_INFO_PLIST`, 01.13). Sem o plist, só o
  prebuild iOS falha.
- **Precisa de dev client:** o Expo Go não tem Firebase.
  - Está instalado o `expo-dev-client`, e os scripts `android`/`ios` são `expo run:*`.
  - As pastas `android/` e `ios/` são geradas (CNG) e estão no `.gitignore`.
  - O iOS usa `useFrameworks: static` (`expo-build-properties`).
- **Consentimento (RGPD, opt-in):**
  - O `firebase.json` arranca com a recolha do Analytics e do Crashlytics desligada, e sem IDs de
    publicidade.
  - O `useFirebase()` (layout raiz) liga-a com `preferencesStore.dataCollection` (o interruptor
    no Perfil), e sempre em `__DEV__`.
  - Com consentimento, os eventos levam o id Supabase (pseudónimo), nunca o email.
- **`src/lib/firebase`:**
  - `index.native.ts` carrega o RNFB de forma preguiçosa (`require` dentro de `try`) e nunca
    lança erro. Sem módulo nativo (Jest, Expo Go), tudo é no-op.
  - `index.ts` é o no-op do web.
  - Importar sempre de `@/lib/firebase`, nunca diretamente de `@react-native-firebase/*`.
- **Eventos (`events.ts`, tipados):**
  - `route_started` e `journey_completed` na store da jornada;
  - `story_played` na store do player;
  - `place_saved` no `saveItem`.

  O screen view é registado por caminho do expo-router; o automático está desligado.

- **Push:**
  - A permissão pede-se no passo "Permissões" do onboarding, nunca no arranque.
  - `registerThisDevice` guarda o token FCM em `public.push_tokens` através de
    `rpc('register_push_token')`. A função é `security definer`, e o token muda de dono quando
    outra pessoa entra no mesmo telemóvel.
  - O token regista-se no arranque, ao entrar e quando o FCM o roda, e sai ao terminar sessão.
  - Em dev, o token aparece nos logs do Metro (`[push] FCM token`).
  - O background handler é registado em `index.ts`, a entrada da app.
- **Ícone de notificação:** o plugin local `plugins/with-notification-icon.js` cria-o a partir das
  opções do plugin de messaging. O Expo 57 já não o cria, e o `expo-notifications` entraria em
  conflito com o serviço FCM do RNFB. O ícone ainda é o do template; a marca vem do EPIC-02.

## HTTP, datas e mocks — decisões (EPIC-01.11)

- **Um só backend configurável:** o Supabase e o mock Mockoon respondem nos mesmos caminhos
  (`/auth/v1`, `/rest/v1`, `/functions/v1`). Trocar `EXPO_PUBLIC_SUPABASE_URL` move o Auth, o
  sync e o HTTP juntos (`pnpm mockoon` + `pnpm --filter mobile start:mock`). Detalhes em
  `sdd/mock-data.md`.
- **HTTP:** `src/lib/http.ts` tem a instância Axios única (`getHttp()`), com base
  `<SUPABASE_URL>/functions/v1`.
  - Interceptor de auth: `apikey` e, com sessão, `Authorization: Bearer <jwt>`.
  - Interceptor de erro: tudo passa a `HttpError` (`kind`: network, timeout, unauthorized,
    client ou server, com `retryable`).
  - O lint proíbe `fetch`, `XMLHttpRequest` e `import axios` fora dele. O supabase-js continua
    para Auth e PostgREST.
- **Datas:** `src/lib/date.ts` tem o relógio (`now`, `nowIso`, `nowMs`), o formato de fio (ISO UTC:
  `parseIso`, `shiftIso`, `isAfterIso`) e a formatação por idioma com date-fns (`formatDuration`,
  `formatRelative`, `formatDate`; locales pt, en-GB e es). O lint proíbe `new Date`, `Date.*`,
  `Intl.*` e `toLocale*String` fora dele (testes e scripts ficam de fora).
- **Mocks centralizados:** `tooling/mockoon/` (environment + `data/` + `scenarios.json`) é a única
  fonte. O seed de demonstração lê `data/rest/` e os testes arrancam o mesmo mock. O MSW saiu.
- No Jest, o `fetch` global é o do Expo, sem rede, e o axios resolveria o build `browser`. Por
  isso o `jest.config.js` aponta o axios para o build Node, e os testes passam `mockFetch` aos
  clientes.

## Estilo (NativeWind) — decisões

- **Tokens, fonte única:** `tooling/tailwind/tokens.json` guarda os valores do EPIC-02 (cor,
  espaço, raio, tipo, movimento). A partir dele, `tooling/tailwind/base.js` gera o preset
  Tailwind, e `src/constants/tokens.ts` expõe os valores crus. Para mudar um valor, muda-se o
  JSON; nunca se estende o tema na app.
- O tema **substitui** as escalas do Tailwind:
  - cores: `ink`, `ink-muted`, `ink-faint`, `accent`, `surface`, `canvas`, `border`,
    `border-soft`;
  - espaço: `1`–`10` = 4…80px;
  - raio: `sm`, `md`, `lg`, `pill` e `full`;
  - tipo: `text-display`, `text-title`, `text-section`, `text-body`, `text-label`,
    `text-caption` e `text-mono`, com line-height e letter-spacing já em px.

  Por isso `bg-red-500`, `p-11` e `text-xl` não existem. Os valores arbitrários (`p-[13px]`)
  ainda compilam; a regra de lint do EPIC-02.1 é que os proíbe nas features.

- Com NativeWind, um `border` sozinho não tem cor, porque o Tailwind a põe num seletor `*` que
  não existe em nativo. Escreve-se `border border-border`.
- **Fronteira:** as classes NativeWind servem para layout, espaçamento, cor e tipografia das
  telas e composições. A semântica de marca (variantes de botão, estados, inputs, cartões) vive
  nos componentes do design system (EPIC-02, `@waytale/ui`) e não se reinventa com classes soltas
  numa feature. Se uma combinação de classes se repete, deve passar a componente.
- Os valores crus (`color.ink`, …) vêm de `@/constants/tokens` e só servem em props que não
  aceitam `className`: opções de navegação, `tintColor` e animações.
- Componentes de terceiros precisam de `cssInterop(Componente, { className: 'style' })`, como o
  `SafeAreaView` em `src/components/screen.tsx`.
- Tailwind só gera as classes que encontra escritas como string literal. `text-${nome}` não
  funciona; usa-se um mapa com as classes inteiras.
- Onde funciona:
  - Metro: `withNativeWind` em `metro.config.js`, `babel.config.js` com
    `jsxImportSource: 'nativewind'`, e `src/global.css` importado no layout raiz.
  - Storybook web: o mesmo JSX e o Tailwind via PostCSS em `.storybook/main.ts`.
  - Jest: o `.css` é um módulo vazio. `nativewind/test` compila as classes a sério, como em
    `src/constants/__tests__/nativewind.test.tsx`.

## i18n — decisões

- Idiomas: `pt`, `en` e `es` (`SUPPORTED_LANGUAGES` em `src/lib/i18n/languages.ts`). Um idioma
  novo entra aí, num `src/i18n/<código>.json` e no `supportedLocales` do plugin
  `expo-localization` em `app.json`.
- Idioma no ecrã: a escolha em Perfil (`preferencesStore.language`). Com `'system'`, o padrão, é
  o primeiro idioma do dispositivo que suportamos; se não houver nenhum, inglês.
- `useLanguageSync()` no layout raiz segue o dispositivo em runtime (`useLocales`), sem reiniciar.
  No Android o plugin mantém a activity viva quando o idioma muda. O iOS termina a app quando o
  idioma do sistema muda, por isso aí a mudança só se vê ao reabrir.
- `t()` vem de `useTranslation` importado de `@/lib/i18n`: importar esse módulo é o que
  inicializa o i18next. As chaves são tipadas a partir de `pt.json`, e `locales.test.ts` exige as
  mesmas chaves e placeholders nos outros idiomas.
- Lint: `waytale/no-literal-ui-string` (`tooling/eslint/rules/`) falha com texto de UI inline em
  JSX, nas props de copy (`title`, `label`, `accessibilityLabel`, …) e no `Alert.alert`. Testes e
  stories ficam de fora.

## Estado (Zustand) — decisões e convenções

- **Storage**: `@react-native-async-storage/async-storage` (não MMKV) — funciona em Expo Go e no
  web (`expo export --platform web`); MMKV é nativo e quebraria o export web. Reavaliar MMKV só se
  a leitura síncrona for medida como necessária depois de existir dev client.
- **Tokens**: nunca entram num store persistido — `sessionStore` usa `partialize` (whitelist);
  tokens vivem em SecureStore (01.5).
- **Selectors**: consumir sempre hooks granulares (`useIsAuthenticated()`, `useActiveJourney()`, …)
  e ações via `useXActions()` (com `useShallow`) — nunca a store inteira num componente.

## Base local (SQLite) — decisões

- `expo-sqlite@~57` + `drizzle-orm@0.45`; schema em `src/db/schema.ts` (11 tabelas). Migrações
  versionadas por `drizzle-kit generate` + `scripts/bundle-migrations.mjs` (empacota o `.sql` num
  `src/db/migrations/index.ts`, porque o Metro não importa `.sql`). `pnpm db:generate` regera.
- As chaves das migrações empacotadas têm de ser `m0000`, `m0001`, … (é assim que o
  `drizzle-orm/expo-sqlite/migrator` as procura); o teste `src/db/__tests__/migrations.test.ts`
  guarda este contrato.
- Offline-first: `src/db/client.ts` (`getDatabase`/`migrateDatabase`) é a única porta de leitura da
  UI; a rede (01.6/01.11) só escreve no SQLite, nunca alimenta a UI diretamente.
- Cada ligação corre `PRAGMA foreign_keys = ON` (sem isso o SQLite ignora os `onDelete: cascade`)
  e `journal_mode = WAL`.
- O layout raiz só monta as rotas depois de `useDatabaseReady()` (migração + seed); o seed de
  demonstração corre só em `__DEV__`.
- `expo-sqlite` no web usa wa-sqlite (`.wasm`) — `metro.config.js` adiciona `wasm` a `assetExts`.

## Notas / decisões pendentes

- **TanStack Query**: mencionado nas notas iniciais do backlog (hoje absorvidas pelos épicos em
  `.user_stories/`) mas fora do stack formal do EPIC-01, que só define Zustand para estado.
  Confirmar se entra antes de decidir a camada de dados.
- **Supabase** (EPIC-01.5): `supabase/` é um pacote do workspace (`@waytale/supabase`) com
  `config.toml`, migrações (schema espelhado do SQLite, RLS em todas as tabelas, grants explícitos,
  buckets privados `audio`/`images`) e a Edge Function `generate-route`. O cliente
  (`apps/mobile/src/lib/supabase/`) guarda a sessão cifrada: chave AES-256 no SecureStore, sessão
  AES-GCM no AsyncStorage. Login só por email (código de 6 dígitos, sem senha); sem
  telefone e, por agora, sem Google. Migrações aplicadas no projeto `iqmnbzgsqmmalqzdyxjg`; falta
  no dashboard: SMTP próprio, ligar o email e os templates com código, e autenticar o MCP. Ver
  `agentic.md` › Backend / Supabase.
- **iOS**: CD (EAS Submit) cobre só Android no MVP (EPIC-01.13); iOS fica para quando houver conta
  de developer Apple — não assumir distribuição iOS em nenhum outro épico entretanto.

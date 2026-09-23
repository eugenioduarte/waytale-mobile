# Waytale — Stack Técnico

Fonte formal do plano: `../.user_stories/EPIC-01-setup-projeto/EPIC-01-setup-projeto.md`. Este ficheiro reflete o
que já está montado no repositório vs. o que ainda falta instalar/configurar.

## App Mobile

| Item                        | Escolha                                                                                        | Estado                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Runtime                     | Expo SDK ~57 · React Native 0.86 · TypeScript strict                                           | ✅ scaffolded                                                                                       |
| Navegação                   | `expo-router` (file-based, typed routes)                                                       | ✅ scaffolded                                                                                       |
| Estado cliente              | Zustand — stores por domínio + `persist`                                                       | ⬜ a instalar                                                                                       |
| Base local                  | SQLite (`expo-sqlite`) com Drizzle ORM e migrações versionadas                                 | ⬜ a instalar                                                                                       |
| Backend                     | Supabase (Postgres, Auth, Storage, Edge Functions, RLS)                                        | 🟡 projeto criado (`iqmnbzgsqmmalqzdyxjg`), MCP ligado; schema/auth/RLS por implementar (EPIC-01.5) |
| Sync                        | Offline-first: escrita local → outbox → push/pull para Supabase                                | ⬜ a implementar (EPIC-01.6)                                                                        |
| Estilo                      | NativeWind (Tailwind CSS para React Native)                                                    | ⬜ a instalar                                                                                       |
| i18n                        | i18next + `react-i18next` + `expo-localization`                                                | ⬜ a instalar                                                                                       |
| HTTP client                 | Axios                                                                                          | ⬜ a instalar                                                                                       |
| Datas                       | date-fns                                                                                       | ⬜ a instalar                                                                                       |
| Mock de API                 | Mockoon (`tooling/mockoon/waytale.json`)                                                       | 🟡 environment starter criado, `mockoon-cli` não instalado                                          |
| Crash / Push / Analytics    | Firebase — Crashlytics, Cloud Messaging, Analytics (`@react-native-firebase/*`)                | ⬜ a instalar                                                                                       |
| Testes de UI/lógica         | React Native Testing Library + Jest                                                            | 🟡 preset em `tooling/jest/` criado, dependências não instaladas ainda                              |
| Testes E2E                  | Maestro (fluxos em YAML)                                                                       | ⬜ a instalar                                                                                       |
| Documentação de componentes | Storybook (react-native + web)                                                                 | ⬜ a instalar                                                                                       |
| CI                          | GitHub Actions — lint/typecheck/testes bloqueantes, SonarQube, Dependabot                      | ⬜ a configurar                                                                                     |
| CD                          | EAS Build + EAS Submit — Android apenas por agora                                              | ⬜ a configurar                                                                                     |
| Monorepo                    | pnpm workspaces + Turborepo                                                                    | ✅ montado                                                                                          |
| Gestor de pacotes           | pnpm                                                                                           | ✅ em uso                                                                                           |
| Lint / format               | ESLint flat config (Expo + `import-x/order`) + Prettier; `husky` + `lint-staged` no pre-commit | ✅ montado (EPIC-01.1)                                                                              |

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
  mockoon/           @waytale/mockoon-config — waytale.json (2 rotas placeholder)
  prettier/           @waytale/prettier-config
  tailwind/          @waytale/tailwind-config — tokens navy/off-white/card-border confirmados; accent por definir (EPIC-02)
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
src/constants/   tokens locais (paleta, tema)
src/hooks/       hooks transversais
src/db/          schema drizzle, migrações, seeds (EPIC-01.4)
src/lib/         supabase, sync, audio, location, analytics, http (axios), date, i18n
src/stores/      zustand stores globais (EPIC-01.3)
src/i18n/        locales i18next (pt, en, ...) (EPIC-01.9)
tests/           helpers, factories (EPIC-01.8)
.maestro/        fluxos E2E (EPIC-01.8)
```

`src/features/auth/session.tsx` é a sessão provisória da guarda (01.2) — substituída por
`sessionStore` (01.3) e Supabase auth (01.5). `src/locales/pt.json` é a copy provisória (01.2),
sem i18next ainda: 01.9 deve consolidá-la em `src/i18n/`.

## Notas / decisões pendentes

- **TanStack Query**: mencionado nas notas iniciais do backlog (hoje absorvidas pelos épicos em
  `.user_stories/`) mas fora do stack formal do EPIC-01, que só define Zustand para estado.
  Confirmar se entra antes de decidir a camada de dados.
- **Supabase**: projeto criado, MCP (`.mcp.json`, `.codex/config.toml`) já aponta para
  `iqmnbzgsqmmalqzdyxjg`. Falta autenticar o MCP por máquina (`claude /mcp` num terminal normal)
  e implementar schema/auth/RLS (EPIC-01.5). Ver `agentic.md` › Backend / Supabase.
- **iOS**: CD (EAS Submit) cobre só Android no MVP (EPIC-01.13); iOS fica para quando houver conta
  de developer Apple — não assumir distribuição iOS em nenhum outro épico entretanto.

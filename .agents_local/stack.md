# Waytale — Stack Técnico

Fonte formal do plano: `../.user_stories/epics/EPIC-01-setup-projeto.md`. Este ficheiro reflete o
que já está montado no repositório vs. o que ainda falta instalar/configurar.

## App Mobile

| Item | Escolha | Estado |
|---|---|---|
| Runtime | Expo SDK ~57 · React Native 0.86 · TypeScript strict | ✅ scaffolded |
| Navegação | `expo-router` (file-based, typed routes) | ✅ scaffolded |
| Estado cliente | Zustand — stores por domínio + `persist` | ⬜ a instalar |
| Base local | SQLite (`expo-sqlite`) com Drizzle ORM e migrações versionadas | ⬜ a instalar |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions, RLS) | ⬜ a configurar (sem projeto Supabase ainda) |
| Sync | Offline-first: escrita local → outbox → push/pull para Supabase | ⬜ a implementar (EPIC-01.6) |
| Estilo | NativeWind (Tailwind CSS para React Native) | ⬜ a instalar |
| i18n | i18next + `react-i18next` + `expo-localization` | ⬜ a instalar |
| HTTP client | Axios | ⬜ a instalar |
| Datas | date-fns | ⬜ a instalar |
| Mock de API | Mockoon (`infra/mockoon/waytale.json`) | ⬜ a instalar |
| Crash / Push / Analytics | Firebase — Crashlytics, Cloud Messaging, Analytics (`@react-native-firebase/*`) | ⬜ a instalar |
| Testes de UI/lógica | React Native Testing Library + Jest | ⬜ a instalar |
| Testes E2E | Maestro (fluxos em YAML) | ⬜ a instalar |
| Documentação de componentes | Storybook (react-native + web) | ⬜ a instalar |
| CI | GitHub Actions — lint/typecheck/testes bloqueantes, SonarQube, Dependabot | ⬜ a configurar |
| CD | EAS Build + EAS Submit — Android apenas por agora | ⬜ a configurar |
| Gestor de pacotes | npm | ✅ em uso (ver nota abaixo) |

## Estrutura atual do repositório

```
src/app/            rotas (expo-router; root já é src/app neste template)
src/components/     primitivos do scaffold Expo (a substituir por EPIC-02)
src/constants/       theme.ts (tokens do template Expo — a substituir pelo design system Waytale)
src/hooks/
assets/
```

## Estrutura alvo (EPIC-01.1)

```
src/features/<dom>/  ui, hooks, store, queries, schema — por domínio (auth, onboarding, journey, ...)
src/components/      design system Waytale (EPIC-02)
src/db/              schema drizzle, migrações, seeds
src/lib/             supabase, sync, audio, location, analytics
src/stores/          zustand stores globais
tests/               helpers, factories
.maestro/            fluxos E2E
```

`src/app/` mantém-se para as rotas do expo-router; os grupos de layout (`(auth)`, `(onboarding)`,
`(tabs)`, `(journey)`, modais) entram em EPIC-01.2.

## Notas / decisões pendentes

- **Package manager**: o scaffold atual foi criado com `npm` (`package-lock.json`). O EPIC-01.1
  assume `yarn` nos comandos de aceitação (`yarn ios`, `yarn lint`, ...) — decidir e alinhar antes
  de fechar EPIC-01, ou reescrever os comandos do épico para `npm run <script>`.
- **TanStack Query**: mencionado nas notas iniciais do backlog (hoje absorvidas pelos épicos em
  `.user_stories/epics/`) mas fora do stack formal do EPIC-01, que só define Zustand para estado.
  Confirmar se entra antes de decidir a camada de dados.
- **Supabase**: sem projeto criado ainda. Não referenciar nenhum `project_ref` real até existir —
  ver `agentic.md` e `.codex/config.toml`.
- **iOS**: CD (EAS Submit) cobre só Android no MVP (EPIC-01.13); iOS fica para quando houver conta
  de developer Apple — não assumir distribuição iOS em nenhum outro épico entretanto.

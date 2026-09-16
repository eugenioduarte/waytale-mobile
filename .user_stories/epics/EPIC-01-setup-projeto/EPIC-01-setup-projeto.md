# EPIC-01 — Setup do projeto

**Objetivo:** ter um repositório Expo funcional, offline-first, com estado, persistência local, backend, testes e documentação de componentes — pronto para receber features sem decisões de arquitetura pendentes.

**Estimativa:** 21 pts · **Telas:** nenhuma (fundação)

## Stack

| Camada | Escolha |
|---|---|
| Runtime | React Native + **Expo** (SDK managed, dev client) |
| Navegação | **expo-router** (file-based, typed routes) |
| Estado | **Zustand** (stores por domínio + middleware persist) |
| Base local | **SQLite** (`expo-sqlite`) com Drizzle ORM e migrações versionadas |
| Backend | **Supabase** (Postgres, Auth, Storage, Edge Functions, RLS) |
| Sync | Offline-first: escrita local → outbox → push/pull para Supabase |
| Estilo | **NativeWind** (Tailwind CSS para React Native) |
| i18n | **i18next** + `react-i18next` + `expo-localization` |
| HTTP client | **Axios** |
| Datas | **date-fns** |
| Mock de API | **Mockoon** (`infra/mockoon/waytale.json`) |
| Crash / Push / Analytics | **Firebase** — Crashlytics, Cloud Messaging, Analytics (`@react-native-firebase/*`) |
| Testes de UI | **React Native Testing Library** + Jest |
| Testes E2E | **Maestro** (fluxos em YAML) |
| Documentação | **Storybook** (react-native + web para revisão de design) |
| CI | **GitHub Actions** — lint/typecheck/testes bloqueantes, SonarQube, Dependabot |
| CD | **EAS Build** + **EAS Submit** — apenas Android por agora |

## Histórias

### 01.1 — Bootstrap do repositório
Como dev, quero um projeto Expo com TypeScript estrito e lint/format automáticos, para começar sem discutir configuração.

- Monorepo **pnpm workspaces + Turborepo**; `npx create-expo-app` dentro de `apps/mobile`.
  `tsconfig` `strict: true` (via `tooling/typescript`), paths `@/*`.
- ESLint + Prettier (via `tooling/eslint`/`tooling/prettier`) + import/order; Husky + lint-staged
  no pre-commit.
- Estrutura de pastas:
```
apps/mobile/
  src/app/             rotas (expo-router)
  src/features/<dom>/  ui, hooks, store, queries, schema
  src/components/      primitivos locais (o design system partilhado vive em packages/ui)
  src/db/              schema drizzle, migrações, seeds
  src/lib/             supabase, sync, audio, location, analytics, http (axios), date, i18n
  src/stores/          zustand stores globais
  src/i18n/            locales i18next (pt, en, ...)
  tests/               helpers, factories
  .maestro/            fluxos E2E
packages/ui/           design system partilhado (EPIC-02)
tooling/                eslint, jest, mockoon, prettier, tailwind, typescript — configs partilhadas
```
- **Aceitação:** `pnpm --filter mobile ios`, `pnpm --filter mobile android` e
  `pnpm --filter mobile web` arrancam; `pnpm lint`, `pnpm typecheck`, `pnpm test` (via turbo)
  passam em CI.

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

### 01.9 — Internacionalização (i18n)
Como utilizador, quero a app e a narração no meu idioma, porque viajo em cidades onde não falo a língua local (ver `description.md`: "Idioma da narração e da interface").

- `i18next` + `react-i18next` + `expo-localization` (deteção do idioma do dispositivo, override manual em Perfil).
- Estrutura `src/i18n/<locale>.json`; chaves por feature, nenhuma string solta no código de UI.
- Idiomas de lançamento: pt e en (mínimo); estrutura pronta para adicionar mais sem refactor.
- **Aceitação:** mudar o idioma do dispositivo reflete-se na interface sem reiniciar a app; lint falha se detetar string de UI fora do i18n.

### 01.10 — Estilo com NativeWind (Tailwind)
Como dev, quero utilitários de estilo consistentes, para implementar o design system mais depressa sem perder os tokens do EPIC-02.

- NativeWind; `tailwind.config.js` com os tokens de cor/tipografia do design system (navy `#14203d`, laranja de acento único, off-white `#faf8f3` — ver `.agents_local/project.md`).
- Coexiste com os componentes do design system (EPIC-02): NativeWind para layout/spacing, componentes para semântica de marca — não reinventar variantes de botão em classes soltas.
- **Aceitação:** uma tela nova consegue ser estilizada só com classes NativeWind, sem `StyleSheet` manual para os casos comuns (spacing, cor, tipografia).

### 01.11 — Cliente HTTP, mocks e datas
Como dev, quero um cliente HTTP e mocks locais previsíveis, para desenvolver sem depender do backend estar sempre disponível.

- `axios` como cliente HTTP único (instância com interceptors de auth e erro; nunca `fetch` direto em features).
- `Mockoon` (`tooling/mockoon/waytale.json`) para mocks locais de endpoints ainda sem Edge Function no Supabase.
- `date-fns` para toda a manipulação/formatação de datas (duração de rota, "há 2 dias", etc.) — proibido `Date` manual fora de `src/lib/date.ts`.
- **Aceitação:** a app corre contra o Mockoon só trocando uma env var, sem tocar em código de produção; nenhuma função de data usa `Date`/`Intl` diretamente fora de `src/lib/date.ts`.

### 01.12 — Firebase: Crashlytics, Push, Analytics
Como equipa, quero crashes, notificações e analytics de produto desde o dia 1, para não navegar às cegas em produção.

- `@react-native-firebase/app` + `crashlytics` + `messaging` + `analytics` (requer dev client — já assumido, ver Riscos).
- Push: token FCM registado no Supabase por utilizador; casos de uso iniciais alinhados com `description.md` (alerta de segurança, "rota sugerida para o momento").
- Eventos mínimos de analytics: `route_started`, `story_played`, `journey_completed`, `place_saved`.
- **Aceitação:** um crash forçado em dev aparece no Crashlytics em minutos; um evento de analytics fica visível no dashboard Firebase; uma notificação de teste chega ao dispositivo.

### 01.13 — Pipeline CI/CD
Como equipa, quero um pipeline que bloqueia merges quebrados e distribui builds sem passos manuais.

- **CI** (GitHub Actions, em PR): lint → typecheck → testes unitários/integração (bloqueante — nenhum PR passa com testes vermelhos) → SonarQube (qualidade/segurança de código) → Dependabot (PRs automáticos de dependências).
- **CD** (EAS Build + EAS Submit): build automático ao mergear em `main`; distribuição **apenas Android** por agora (internal track / EAS Update — decidir em EPIC-20); iOS fica para quando houver conta de developer Apple.
- Ligar o required status check ao branch protection de `main` (já configurado sem check obrigatório — ver `AGENTS.md` › Workflow) assim que o workflow de CI existir.
- **Aceitação:** um PR com teste a falhar não pode ser mergeado; merge em `main` dispara build EAS e disponibiliza o artefacto Android sem passo manual.

## Riscos

- Áudio em background e localização contínua exigem dev client (não Expo Go) — assumir desde o dia 1.
- Consumo de bateria da localização: definir orçamento e medir já nesta fase.
- NativeWind + design system próprio (EPIC-02): definir cedo onde termina um e começa o outro, para não duplicar tokens.
- Distribuição só-Android no MVP: validar que nenhuma decisão de EPIC-01–20 fica presa a APIs iOS-only.

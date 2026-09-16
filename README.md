# Waytale

App móvel de passeios a pé guiados por áudio. Ver `description.md` para o produto e
`.agents_local/project.md` para o contexto orientado a agentes.

## Estrutura (monorepo)

```
apps/
  mobile/            app Expo (React Native) — ver apps/mobile/README.md
packages/
  ui/                design system partilhado (@waytale/ui) — EPIC-02
tooling/
  eslint/            config partilhada de lint (@waytale/eslint-config)
  jest/              preset de testes (@waytale/jest-config)
  mockoon/           mocks locais de API (@waytale/mockoon-config)
  prettier/          config de formatação (@waytale/prettier-config)
  tailwind/          tokens NativeWind/Tailwind (@waytale/tailwind-config)
  typescript/        tsconfigs partilhados (@waytale/typescript-config)
```

Gestor de pacotes: **pnpm** workspaces + **Turborepo**. Ver `.agents_local/stack.md` para o
estado detalhado (o que já está montado vs. o que falta) e `.user_stories/` para o backlog.

## Comandos

```bash
pnpm install       # instala tudo (raiz + apps/* + packages/* + tooling/*)
pnpm dev           # turbo run dev — arranca o(s) app(s) com task "dev"
pnpm lint          # turbo run lint em todo o workspace
pnpm typecheck     # turbo run typecheck em todo o workspace
pnpm test          # turbo run test em todo o workspace
pnpm --filter mobile start   # só o app mobile (equivalente a expo start)
```

## Onde começar

1. `AGENTS.md` — instruções e princípios do repositório.
2. `.agents_local/` — produto, stack e estado atual.
3. `.user_stories/` — backlog, um ficheiro por épico.

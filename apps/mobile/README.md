# Waytale — app mobile

App Expo (React Native) do Waytale, dentro do monorepo. Estado do stack, estrutura de pastas e o
que ainda falta montar: `.agents_local/stack.md`. Instruções para agentes e princípios do
repositório: `AGENTS.md` na raiz.

## Correr

```bash
pnpm install            # na raiz do monorepo — liga também os hooks de pre-commit
pnpm run:android        # expo start --android (atalho da raiz)
pnpm run:ios            # expo start --ios (atalho da raiz)
pnpm --filter mobile web
```

Todos os scripts deste pacote (`start`, `android`, `ios`, `web`, `lint`, `typecheck`, `test`)
correm com `pnpm --filter mobile <script>` a partir da raiz.

## Notas

- `metro.config.js` é obrigatório: faz o Metro ver a raiz do monorepo (`watchFolders`) e resolve
  `packages/*` com o `node-linker=hoisted` do `.npmrc` da raiz. Não remover.
- `src/app/` é a raiz de rotas do expo-router; a estrutura completa de `src/`, `tests/` e
  `.maestro/` está documentada em `.agents_local/stack.md`.

# Dados mock — Waytale

Uma só fonte de dados mock para dev e testes (EPIC-01.11): `tooling/mockoon/`
(`@waytale/mockoon-config`). O fluxo de trabalho está na skill `mock-data`
(`.agents/skills/mock-data/`). Este ficheiro guarda os factos do projeto.

## Onde está

| Caminho                        | O quê                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `waytale.json`                 | Environment Mockoon: rotas, regras e cenários. Editável na app desktop do Mockoon.            |
| `data/auth/`                   | `session.json` (sessão com template: o email vem do pedido) e `user.json`                     |
| `data/rest/<tabela>.json`      | Linhas por tabela sincronizada, no formato do Supabase (catálogo de demo; do utilizador `[]`) |
| `data/functions/<função>.json` | Respostas das Edge Functions (`generate-route`)                                               |
| `scenarios.json`               | Inputs que escolhem cada cenário (emails, códigos), lidos pelos testes                        |
| `server.js`                    | Arranque em processo (usado pelo filho e pelos testes do pacote)                              |
| `index.js` / `child.js`        | `startMockServer()` para os testes da app: um processo Node por ficheiro de teste, via IPC    |

## Rotas (caminhos do Supabase)

O mock responde nos mesmos caminhos do Supabase. Por isso, trocar `EXPO_PUBLIC_SUPABASE_URL` move
o Auth, o sync e o cliente HTTP para o mock de uma vez.

| Rota                                | Resposta                                                            |
| ----------------------------------- | ------------------------------------------------------------------- |
| `POST /auth/v1/otp`                 | `{}`; erros por email (cenários abaixo)                             |
| `POST /auth/v1/verify`              | sessão para o email pedido; `403 otp_expired` com o código expirado |
| `POST /auth/v1/token`               | sessão (refresh)                                                    |
| `GET /auth/v1/user`                 | utilizador                                                          |
| `POST /auth/v1/logout`              | `204`                                                               |
| `GET /rest/v1/:table`               | `data/rest/<table>.json`; tabela desconhecida → `404`               |
| `POST` / `PATCH /rest/v1/:table`    | `201` / `204` (aceita, não guarda)                                  |
| `POST /functions/v1/generate-route` | `data/functions/generate-route.json`                                |

O pull ignora filtros e paginação. Recebe a tabela inteira numa página curta e pára.

## Cenários (`scenarios.json`)

| Input                                    | Resultado                                     |
| ---------------------------------------- | --------------------------------------------- |
| email `rate-limited@waytale.test`        | `429 over_email_send_rate_limit`              |
| email `not-authorized@waytale.test`      | `400 email_address_not_authorized`            |
| email `server-error@waytale.test`        | `503 unexpected_failure`                      |
| código `000000`                          | `403 otp_expired`                             |
| qualquer outro email / código (`123456`) | caminho feliz                                 |
| `UNREACHABLE_URL` (`127.0.0.1:9`)        | sem rede, com a ligação recusada (nos testes) |

`tooling/mockoon/server.test.js` falha se um valor de regra do environment e o `scenarios.json`
deixarem de coincidir.

## Como correr

- **Dev:** `pnpm mockoon` serve em `:3001`, e `pnpm --filter mobile start:mock` arranca a app
  apontada para ele. Em alternativa, basta pôr `EXPO_PUBLIC_SUPABASE_URL=http://localhost:3001` no
  `.env.local` (a chave publicável pode ser qualquer). No emulador Android usa-se
  `http://10.0.2.2:3001`; num telemóvel real, o IP da máquina na rede local.
- **Testes:** o `startMockServer()` de `@tests/mockoon` dá a cada ficheiro o seu servidor numa
  porta livre. `await mock.requests()` devolve o que chegou, e `mockFetch` é o fetch a passar aos
  clientes. O `fetch` global do jest-expo é o do Expo e não tem rede no Jest; o axios usa o build
  Node (`jest.config.js`).
- **Pacote:** `pnpm --filter @waytale/mockoon-config test`.

## Consumidores dos mesmos dados

- `apps/mobile/src/db/seed.ts` usa as linhas de `data/rest/` como seed de demonstração (só em
  `__DEV__`).
- Os testes de integração de Auth, HTTP e sync (pull) correm contra o mock.
- Ainda não usam o mock: os fluxos Maestro, que usam o login de pré-visualização (a ligar em 01.13
  se se quiser E2E com dados), e as factories de `tests/factories.ts`, que constroem objetos para
  testes de unidade e não são respostas de rede.

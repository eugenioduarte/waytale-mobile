# EPIC-01 — Checklist de encerramento

Atualizado em 2026-10-08. Implementação da fundação entregue; ativação de serviços e aceitação
externa permanecem em [PENDENCIAS.md](PENDENCIAS.md). Os ficheiros `.done.md` conservam os
registros históricos; não representam evidência nova de execução em dispositivo.

## Por subtask

- [x] **01.1 — Bootstrap:** workspace, Expo/TypeScript strict, lint/format e hooks. Gates locais
      e CI usam `pnpm verify`. Arranque Android em validação; iOS adiado em 01.14.
- [x] **01.2 — Navegação:** guardas, onboarding, retorno do OTP, rotas profundas e percurso
      provisório cobertos por testes do router real. Cold start nativo permanece em validação.
- [x] **01.3 — Zustand:** persistência, sessão sem tokens em claro e stores verificadas pelos
      testes existentes. Retoma de áudio na UI depende do player dos épicos seguintes.
- [x] **01.4 — SQLite:** schema, migrações, seed e persistência local testados. Home/player/downloads
      completos em modo avião pertencem aos épicos funcionais.
- [x] **01.5 — Supabase:** testes locais de RLS/isolamento e sessão cifrada. SMTP já configurado;
      teste real de código/email atribuído ao EPIC-04.
- [x] **01.6 — Sync:** testes de pull/push, idempotência e persistência offline. Integração com
      Mockoon corrigida para tolerar arranque lento sem deixar processo filho aberto.
- [x] **01.7 — Storybook:** stories renderizadas pela suite; rota desligada redireciona à Home.
      Preview web já registrado no PR #1 pela subtask; inspeção on-device continua pendente.
- [x] **01.8 — Testes:** Jest/RNTL, Mockoon, factories e três fluxos Maestro. Gate de cobertura
      ampliado para telas, componentes, features e restante código, todas as métricas ≥60%.
- [x] **01.9 — i18n:** pt/en/es e lint sem copy inline; testes de idioma e preferência.
- [x] **01.10 — NativeWind:** tokens e estilos verificados por testes e bundle Android.
- [x] **01.11 — HTTP/mocks/datas:** testes de HTTP, datas e rede usando Mockoon partilhado.
- [x] **01.12 — Firebase:** integração e testes locais existentes; crash/push/DebugView reais
      permanecem pendentes de dispositivo/console.
- [x] **01.13 — Implementação CI/CD:** hooks, gates, Dependabot, EAS, Maestro e Firebase
      App Distribution exclusivamente Android. `main` e `develop` com jobs de distribuição.
- [ ] **01.13 — Ativação/aceitação externa:** credenciais, branch protection, CI remoto verde
      e recebimento do APK por tester. Instruções em PENDENCIAS.md.
- [ ] **01.14 — iOS:** adiado explicitamente; sem jobs iOS no pipeline.

## Validação desta entrega

- [x] Revisão de `.agents`, `.agents_local` e de todas as subtasks.
- [x] Preservado o escopo da alteração existente do utilizador em 01.13.
- [x] Lint e typecheck do workspace passaram.
- [x] Testes dos pacotes fora da app passaram, incluindo RLS e Mockoon.
- [x] Testes de configuração de produção, projeto EAS e rejeição de artefactos inválidos: 3 passaram.
- [x] Novos testes de navegação: 16 cenários do router passaram.
- [x] `pnpm verify` passou: 30 suites / 218 testes na app, sem testes saltados; demais pacotes
      e os 3 testes do pipeline passaram.
- [x] Workflow validado por actionlint 1.7.12 e YAML parseado.
- [x] Bundle Android e prebuild gerados localmente; configuração Expo resolvida.
- [x] `pnpm --filter mobile storybook:build` passou (build web do Storybook).
- [ ] Build nativo/execução Maestro Android: em validação.
- [x] Checkpoint read-only por validation-agent: sem defeito bloqueante no pipeline; limitação
      de login do APK production documentada (formulários reais são EPIC-04).
- [x] Revisão final de diff, formatação, segredos e estado Git (checkpoint read-only em 2026-10-08).
- [ ] Commit final do EPIC-01 sem co-author.

## Cobertura final (statements / branches / functions / lines)

| Grupo           | Statements | Branches | Functions | Lines  |
| --------------- | ---------- | -------- | --------- | ------ |
| Telas           | 92,47%     | 66,66%   | 91,30%    | 94,44% |
| Componentes     | 88,23%     | 77,77%   | 100%      | 100%   |
| Features        | 90,78%     | 88,54%   | 86,95%    | 94,73% |
| Restante código | 70,04%     | 61,29%   | 62,67%    | 71,64% |

Todos os grupos cumprem o mínimo de 60% nas quatro métricas.

## Ativação — 2026-10-08

- Login Expo concluído; projeto EAS criado e vinculado em `app.json`.
- Variáveis EAS cadastradas nos três ambientes; produção recebe as duas variáveis públicas do
  Supabase. Preview desativa explicitamente o backend porque EAS rejeita env com valores vazios.
- Validação após correção: lint e typecheck passaram, 4 testes do pipeline e 31 suites / 220 testes
  da app com gate de cobertura aprovado. Dois testes verificam isolamento do preview com
  credenciais presentes; produção rejeita backend desativado.
- GitHub: proteção de main/develop com quatro checks e branches atualizadas, admins incluídos,
  sem force-push/deletion; environments main/develop criados sem aprovação; alertas Dependabot
  ativados. Configurações confirmadas pela API, não apenas por inspeção dos ficheiros.
- Firebase: App Distribution/grupo/tester existentes confirmados; service account limitada ao
  projeto e secret GitHub criados. Distribuição e instalação ainda não verificadas.
- Builds EAS preview e production enviados; conclusão e evidência runtime ainda em validação.
- `EXPO_TOKEN` aguarda cadastro pelo responsável. SonarQube removido por decisão do utilizador.

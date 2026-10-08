# EPIC-01 — Pendências para o responsável do projeto

Atualizado em 2026-10-08. A implementação versionada pode ser validada localmente; o encerramento
operacional depende das configurações e evidências abaixo. Não colocar tokens, JSON de service
account ou chaves neste documento nem no chat.

## 1. Expo / EAS — Android

- [x] Entrar na conta Expo responsável pelo Waytale. Na pasta `apps/mobile`, executar
      `pnpm dlx eas-cli@24.11.0 login` e `pnpm dlx eas-cli@24.11.0 init` para vincular o projeto.
      O ID real deve estar em `extra.eas.projectId` ou na variável `EAS_PROJECT_ID`.
- [ ] Criar secret GitHub `EXPO_TOKEN` (pendente). Variable GitHub `EAS_PROJECT_ID` cadastrada.
- [x] Nos ambientes EAS `development`, `preview` e `production`, cadastrar `EAS_PROJECT_ID`
      (texto) e `GOOGLE_SERVICES_JSON` (ficheiro) com o config Android já existente localmente.
      O ficheiro real continua ignorado pelo Git.
- [x] Em EAS `production`, cadastrar `EXPO_PUBLIC_SUPABASE_URL` e
      `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Só a chave publicável entra na app.
      Nunca usar service role/secret key. O perfil production recusa backend ausente.
- [x] Manter preview sem backend: o perfil fixa `EXPO_PUBLIC_BACKEND_DISABLED=true`, para os
      fluxos provisórios do Maestro. Não distribuir esse perfil como app de produção.
- [ ] Executar o primeiro build interativo Android (`pnpm dlx eas-cli@24.11.0 build --platform
android --profile preview`) e criar/selecionar o keystore. Depois validar production.
      Isso provisiona o que o CI não consegue criar de forma não interativa.

Referência: [EAS em CI](https://docs.expo.dev/build/building-on-ci/) e
[configuração eas.json](https://docs.expo.dev/eas/json/).

## 2. SonarQube

- [ ] Criar/importar o projeto no SonarQube Cloud ou Server e ligar ao repositório.
- [ ] GitHub secret `SONAR_TOKEN`; variables `SONAR_HOST_URL`, `SONAR_PROJECT_KEY` e, para
      Cloud, `SONAR_ORGANIZATION` (pode ficar vazia no Server).
- [ ] Configurar quality gate e suporte de análise a PRs/branches `main` e `develop` no plano
      escolhido. Desligar análise automática do Cloud se estiver ativa: o CI envia LCOV.
- [ ] Confirmar check `SonarQube` verde e bloqueante; corrigir eventuais findings reais do primeiro
      scan. O job espera o resultado do quality gate e não ignora falhas.

Referência: [ação oficial SonarQube](https://github.com/SonarSource/sonarqube-scan-action).

## 3. Firebase App Distribution — Android

- [x] Ativar App Distribution no projeto `waytale-36b9f`, criar grupos de testers e aceitar os
      convites com uma conta de teste.
- [x] Criar service account com papel **Firebase App Distribution Admin**, limitado ao projeto.
      Guardar o JSON como secret GitHub `FIREBASE_SERVICE_ACCOUNT`.
- [x] Cadastrar variables `FIREBASE_APP_ID` (Firebase app ID Android, não o package name nem o
      project ID) e `FIREBASE_TESTER_GROUPS` (aliases separados por vírgula).
- [x] Criar environments GitHub `main` e `develop`; os grupos podem ser diferentes por environment.
      Para distribuição totalmente automática, não ativar aprovação manual nesses environments.
- [ ] Após merge com CI verde, confirmar que um tester recebe e instala o APK de `develop` e de
      `main`. Guardar URL do workflow, build EAS e release Firebase como evidência.

Referência: [autenticação por service account](https://firebase.google.com/docs/app-distribution/authenticate-service-account?platform=android).

## 4. GitHub — proteção e ativação

- [ ] Publicar este commit num branch e abrir/atualizar PR. Nenhum push ou merge é feito como
      parte deste encerramento local.
- [x] Em **Settings → Branches / Rulesets**, proteger **main** e **develop**: PR obrigatório,
      checks atualizados, regras aplicadas a admins, sem force-push nem deletion.
- [x] Exigir os checks `Lint, typecheck, test`, `SonarQube`, `EAS preview`, `Maestro Android` e
      `EPIC-01 gate`. O gate agregado falha também se uma dependência for saltada/cancelada.
      Configuração de ambas as branches aplicada e confirmada pela API GitHub em 2026-10-08.
- [ ] Verificar em PR descartável que um teste falhando bloqueia merge; reverter a falha em seguida.
- [x] Confirmar permissões GitHub Actions e Dependabot. Atualizações de npm/actions visam develop.
      Actions habilitado, token padrão somente leitura; alertas de dependências ativados pela API.
- [ ] Para PRs do Dependabot/forks: revisar o diff e transportar para branch confiável do repo
      antes da execução que usa secrets. Não liberar secrets a código não revisado.

## 5. Evidência de runtime Android

- [ ] Executar e guardar resultado dos três fluxos Maestro no APK preview (`auth`, `onboarding`,
      `journey`). Esses fluxos validam navegação provisória, não OTP ou backend reais.
- [ ] Abrir deep link `waytale://route/<id>` autenticado após cold start e verificar voltar do OTP.
- [ ] Validar NativeWind, Storybook on-device e troca de idioma em Android.
- [ ] Em dev client, provocar crash no Perfil, reabrir e confirmar evento no Crashlytics.
- [ ] Ativar DebugView com `adb shell setprop debug.firebase.analytics.app com.waytale.app` e
      confirmar analytics. Desativar depois com `adb shell setprop debug.firebase.analytics.app .none.`
- [ ] Aceitar notificações no onboarding, usar o token dos logs Metro para enviar push de teste
      na consola Firebase e confirmar recebimento com app em background.

## 6. Pendências já transferidas para épicos funcionais

- O APK `production` de `main` é um artefacto da fundação: com Supabase configurado, esconde
  os atalhos de demonstração. Um tester novo só poderá autenticar-se quando os formulários
  reais do EPIC-04 existirem. O smoke Maestro cobre o APK `preview`, não esse login de produção.
- [ ] EPIC-04: smoke real de email/código e RLS com duas contas; SMTP Resend e templates já foram
      configurados pelo utilizador em 28/09. Não é necessário refazer essa configuração sem falha
      concreta. Ligar captcha somente quando os formulários enviarem o token.
- [ ] EPIC-07/10/11/12/16/18: Home, rotas, player e guardados em modo avião; retoma de jornada e
      posição de áudio na UI. A fundação de stores/SQLite/sync está coberta por testes; essas telas
      funcionais ainda não pertencem ao EPIC-01.
- [ ] MCP Supabase: autenticar apenas quando precisar de operar o backend via MCP. Não bloqueia
      a compilação nem os testes locais.
- [ ] iOS: seguir `subtasks/01.14-pendencias-ios.md`; todo CI/CD atual fica Android.

## Evidências desta sessão

A preencher em `CHECKLIST.md` após a validação final. Não marcar build EAS, scan Sonar, distribuição
Firebase ou proteção de branches como concluídos sem executar/verificar nos serviços externos.

- Expo: `@eugenioduarte/waytale`, project ID `3c24ec4a-df76-40d7-b270-c3da7069e19a`.
- Primeiro preview: [build EAS](https://expo.dev/accounts/eugenioduarte/projects/waytale/builds/7e4fbe09-6770-4652-ba7d-28c0f821c1b2), em execução; keystore criado.
- EAS: presença das quatro variáveis de production confirmada por `env:list`; os valores não
  foram copiados para este documento. Project ID e ficheiro Android aplicados aos três ambientes.
- Firebase: grupo existente `waytale_pp`, com tester `eugenioduartesilva@gmail.com` e atividade
  registrada. Service account `waytale-github-distribution@waytale-36b9f.iam.gserviceaccount.com`;
  chave transferida diretamente ao secret GitHub, sem ficheiro local com a chave privada.
- GitHub: proteção de `main`/`develop` confirmada por GET após PUT; environments sem regras de
  aprovação; variables EAS/Firebase e secret Firebase cadastrados. `EXPO_TOKEN` e Sonar pendentes.

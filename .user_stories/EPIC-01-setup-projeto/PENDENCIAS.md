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
- [x] Executar o primeiro build interativo Android (`pnpm dlx eas-cli@24.11.0 build --platform
android --profile preview`) e criar/selecionar o keystore. Depois validar production.
      Isso provisiona o que o CI não consegue criar de forma não interativa.

Referência: [EAS em CI](https://docs.expo.dev/build/building-on-ci/) e
[configuração eas.json](https://docs.expo.dev/eas/json/).

## 2. SonarQube — removido do escopo

Por decisão do utilizador em 2026-10-08, o projeto não usa SonarQube. Job, configuração e check
obrigatório removidos. Não há credenciais ou ativação Sonar pendentes.

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

- [x] Publicar os commits no branch `0.1-setup` e atualizar o [PR #1](https://github.com/eugenioduarte/waytale-mobile/pull/1), direcionado a `develop`.
- [x] Em **Settings → Branches / Rulesets**, proteger **main** e **develop**: PR obrigatório,
      checks atualizados, regras aplicadas a admins, sem force-push nem deletion.
- [x] Exigir os checks `Lint, typecheck, test`, `EAS preview`, `Maestro Android` e
      `EPIC-01 gate`. O gate agregado falha também se uma dependência for saltada/cancelada.
      Configuração de ambas as branches aplicada e confirmada pela API GitHub em 2026-10-08.
- [x] Verificar em PR descartável que um teste falhando bloqueia merge; reverter a falha em seguida.
      [PR #2](https://github.com/eugenioduarte/waytale-mobile/pull/2): falha real, merge BLOCKED;
      falha revertida, PR fechado e branch temporário eliminado.
- [x] Confirmar permissões GitHub Actions e Dependabot. Atualizações de npm/actions visam develop.
      Actions habilitado, token padrão somente leitura; alertas de dependências ativados pela API.
- [ ] Para PRs do Dependabot/forks: revisar o diff e transportar para branch confiável do repo
      antes da execução que usa secrets. Não liberar secrets a código não revisado.

## 5. Evidência de runtime Android

- [x] Executar e guardar resultado dos três fluxos Maestro no APK preview (`auth`, `onboarding`,
      `journey`). Esses fluxos validam navegação provisória, não OTP ou backend reais.
- [x] Abrir deep link `waytale://route/<id>` autenticado após cold start e verificar voltar do OTP.
- [x] Validar NativeWind, Storybook on-device e troca de idioma em Android.
- [x] Confirmar evento fatal no Crashlytics, provocar crash e reabrir a app.
      Botão do Perfil executado e `RuntimeException: Crash Test` registrado; app reaberta.
      O dev client intercepta crashes nativos e impede este teste de reporting, segundo a
      [documentação React Native Firebase](https://rnfirebase.io/). A validação foi concluída com
      `adb shell am crash com.waytale.app`, que força uma exceção Android fora do handler React Native.
      API topIssues confirmou o evento FATAL `CrashedByAdbException`, issue
      `60b276352ba43b1763298aa997723cd1`, em 2026-10-08. Preview também testado com consentimento ativo.
      Evidências: `dev-crash.xml`, `native-crash.log`, `crashlytics-report.json`, `crashlytics-upload.log`.
- [ ] Ativar DebugView com `adb shell setprop debug.firebase.analytics.app com.waytale.app` e
      confirmar analytics. Desativar depois com `adb shell setprop debug.firebase.analytics.app .none.`
- [x] Aceitar notificações no onboarding, usar o token dos logs Metro para enviar push de teste
      pela API FCM e confirmar recebimento com app em background.
      Screenshot `arquivos_temp/runtime-evidence/push-received.png`; token mantido localmente.

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

A preencher em `CHECKLIST.md` após a validação final. Não marcar build EAS, distribuição
Firebase ou proteção de branches como concluídos sem executar/verificar nos serviços externos.

- Expo: `@eugenioduarte/waytale`, project ID `3c24ec4a-df76-40d7-b270-c3da7069e19a`.
- Primeiro preview: [build EAS](https://expo.dev/accounts/eugenioduarte/projects/waytale/builds/7e4fbe09-6770-4652-ba7d-28c0f821c1b2), concluído; keystore criado.
- [Production](https://expo.dev/accounts/eugenioduarte/projects/waytale/builds/53180d88-cf46-4cee-b99f-77af3300c956) e [development](https://expo.dev/accounts/eugenioduarte/projects/waytale/builds/c58a731a-e05c-4ac2-9741-39496f8e794a): concluídos.
- Distribuição manual ao grupo `waytale_pp`: [preview](https://appdistribution.firebase.google.com/testerapps/1:205523884817:android:0892b4349dece258b6cab0/releases/189qk8b42f7f0) e [production](https://appdistribution.firebase.google.com/testerapps/1:205523884817:android:0892b4349dece258b6cab0/releases/7jam25g36rbl0).
  Recebimento em dispositivo do tester e distribuição automática após merge continuam pendentes.
- Runtime no emulador Android API 36: Maestro 3/3, cold start/OTP/idiomas 1/1 e smoke
  production 1/1 passaram. NativeWind, troca pt/en/es e persistência de es após reinício inspecionados.
  Relatórios locais em `arquivos_temp/runtime-evidence/`: `maestro-final.xml`,
  `runtime-extra-final.xml` e `production-smoke-final.xml` (pasta ignorada pelo Git).
- Storybook on-device inspecionado, story `App/Screen/With Actions`; captura final `storybook-fixed.png`.
  Corrigida atualização dos stores durante render no decorator: mocks aplicados após commit,
  antes da pintura. Regressão comprovada (teste falha no código antigo e passa no corrigido).
  Logcat final sem erro React; aviso de reduced motion corresponde às animações desativadas no emulador.
- Analytics: eventos `screen_view` e upload HTTP 204 confirmados em logcat.
  Inspeção do painel DebugView continua pendente; evidência em `analytics-upload.log`.
  Propriedade `debug.firebase.analytics.app` desativada (`.none.`) após o teste.
- EAS: presença das quatro variáveis de production confirmada por `env:list`; os valores não
  foram copiados para este documento. Project ID e ficheiro Android aplicados aos três ambientes.
- Firebase: grupo existente `waytale_pp`, com tester `eugenioduartesilva@gmail.com` e atividade
  registrada. Service account `waytale-github-distribution@waytale-36b9f.iam.gserviceaccount.com`;
  chave transferida diretamente ao secret GitHub, sem ficheiro local com a chave privada.
- GitHub: proteção de `main`/`develop` confirmada por GET após PUT; environments sem regras de
  aprovação; variables EAS/Firebase e secret Firebase cadastrados. `EXPO_TOKEN` pendente.

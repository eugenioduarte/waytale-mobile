# EPIC-04 — Autenticação

**Objetivo:** entrar (e criar conta) com um código de 6 dígitos enviado por email, sem senhas. Conta nova e conta existente usam o mesmo fluxo; não há senha para recuperar. Logins sociais (Google, Apple) ficam fora desta fase.

**Estimativa:** 5 pts · **Telas:** 01B2 Login (email) · 01C Verificação do código · **Depende de:** EPIC-01, EPIC-02

> **Decisão 2026-09-28:** o login passou de telemóvel + senha para email + código; Google fica
> para uma fase seguinte. As telas 01B Registro, 01B3 Recuperar senha e 01B4 Nova senha do design
> deixam de existir, a 01B2 perde os campos de senha e a 01C passa a falar de email. O design tem
> de ser revisto antes de importar estes ecrãs.

## Histórias

### 04.1 — Entrar com email

Como utilizador, quero entrar só com o meu email, sem inventar mais uma senha.

- Campo email (teclado de email, sem autocorreção), CTA "Enviar código →"
- Um só fluxo: se a conta não existe, é criada ao verificar o código

**Aceitação:** email inválido bloqueia o CTA com mensagem sob o campo; email válido envia o código e navega para a verificação com o email visível.

### 04.2 — Verificação do código

Como utilizador, quero confirmar o código que recebi, para entrar com segurança.

- 6 caixas, auto-advance, colar do email, autofill do código (Android/iOS)
- Reenviar código com contagem de 60s; "Trocar email" volta ao ecrã anterior
- O código expira em 10 minutos

**Aceitação:** código correto autentica e segue para onboarding (conta nova) ou para a Home; errado ou expirado mostra erro sem limpar o campo; tentativas em excesso mostram "Tente novamente daqui a pouco" (limite do Supabase).

### 04.3 — Sessão e logout

Como utilizador, quero manter-me ligado e poder sair.

- Login uma vez só: cada arranque abre direto no dashboard (tabs), também offline
- No dispositivo fica só o refresh token, cifrado (chave no SecureStore); o access token vive em memória e é renovado em silêncio (já feito em 01.5)
- Biometria opcional para reabrir
- Logout limpa stores e apaga os dados e downloads do utilizador

**Aceitação:** cold start com sessão válida (online ou offline) abre o dashboard sem ecrãs de auth; logout devolve ao Welcome.

## Estados e casos-limite

- Offline no login: CTA desativado com banner "Sem ligação — precisamos de rede para entrar".
- Email não chega: "Reenviar" e dica para ver o spam; o remetente é um domínio próprio (SMTP configurado, não o do Supabase).

## Notas técnicas

- Supabase Auth: `signInWithOtp({ email })` + `verifyOtp({ type: 'email' })`. Serviço já pronto em `apps/mobile/src/features/auth/api.ts` (01.5).
- Os templates de email mostram o código (`{{ .Token }}`), não um link.
- Captcha (Turnstile/hCaptcha) quando houver abuso: o serviço aceita o token.
- Nunca registar o email completo em logs/analytics (hash).
- Google, quando entrar: nativo (`@react-native-google-signin/google-signin` + `signInWithIdToken`, development build). No iOS, a App Store exige "Sign in with Apple" quando há login Google.

## Herdado de 01.5 (obrigatório antes do lançamento)

- **Teste de login real:** `cd apps/mobile && node --env-file=.env.local scripts/auth-smoke.mjs <email>` passa todas as verificações: definições de auth, código recebido pelo Resend, sessão aberta, tabelas lidas como `authenticated`, `generate-route` a recusar pedidos sem JWT e a aceitar o do utilizador. Fecha também o teste A/B de RLS com dois utilizadores reais.
- **Senhas bloqueadas no projeto real:** com a migração `20260928120000_no_passwords.sql` aplicada, `signInWithPassword` falha sempre, mesmo para uma conta criada com `signUp({ email, password })`.
- **Sync contra o projeto real (01.6):** com login real, guardar um local offline, voltar online e confirmar a linha no Supabase; remover e confirmar o `deleted_at`. Até aqui a sync só foi testada com o servidor em memória e as regras SQL no PGlite.
- **Captcha** (Turnstile ou hCaptcha) ligado no dashboard **depois** de os formulários enviarem o token (`requestEmailCode(email, captchaToken)`).

## Métricas

- Taxa de conclusão email → código verificado

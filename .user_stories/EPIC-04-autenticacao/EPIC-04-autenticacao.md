# EPIC-04 — Autenticação

**Objetivo:** criar conta e entrar com telemóvel + senha, com verificação por código e recuperação de acesso. Logins sociais ficam fora do escopo desta fase.

**Estimativa:** 13 pts · **Telas:** 01B Registro · 01B2 Login · 01B3 Recuperar senha · 01B4 Nova senha · 01C Verificação OTP · **Depende de:** EPIC-01, EPIC-02

## Histórias

### 04.1 — Registo por telemóvel
Como novo utilizador, quero criar conta com nome e telemóvel, para começar rápido.

- Campos: Nome, Telemóvel (com seletor de indicativo e máscara por região)
- CTA "Enviar código →" à direita; link "Já tem conta? Entrar"
- Validação inline: nome ≥ 2 caracteres, número válido para o país escolhido

**Aceitação:** número inválido bloqueia o CTA com mensagem sob o campo; número válido cria utilizador pendente e navega para OTP.

### 04.2 — Verificação OTP
Como utilizador, quero confirmar o meu número, para proteger a conta.

- 6 caixas, auto-advance, colar do SMS, autofill iOS
- Reenviar código com contagem de 30s; trocar número volta ao registo

**Aceitação:** código correto autentica e segue para onboarding; errado mostra erro sem limpar o campo; 5 tentativas erradas → bloqueio de 15 min.

### 04.3 — Definir senha
Como utilizador, quero uma senha, para entrar sem depender de SMS.

- Mínimo 8 caracteres; indicador de força; campo de confirmação
- Pode ser definida no fim do registo ou mais tarde no perfil

**Aceitação:** senha aceite conclui a sessão; regras não cumpridas explicam o que falta.

### 04.4 — Login
Como utilizador com conta, quero entrar com telemóvel e senha.

- Campos telemóvel + senha com toggle "Ver"
- Link "Esqueceu a senha?" e "Não tem conta? Criar conta"
- Opção de entrar por OTP quando a senha não existe

**Aceitação:** credenciais válidas abrem a Home; inválidas mostram erro genérico (sem revelar se o número existe).

### 04.5 — Recuperar senha
Como utilizador que perdeu a senha, quero recuperar o acesso por código.

- Ecrã 01B3: número associado → "Enviar código"
- Reutiliza o ecrã de OTP
- Ecrã 01B4: nova senha + confirmação com feedback "As senhas coincidem"

**Aceitação:** ao guardar, a sessão é iniciada e as outras sessões do dispositivo são invalidadas.

### 04.6 — Sessão e logout
Como utilizador, quero manter-me ligado e poder sair.

- Tokens em SecureStore, refresh silencioso, biometria opcional para reabrir
- Logout limpa stores, apaga dados sensíveis e mantém downloads anónimos? → não: apaga downloads do utilizador

**Aceitação:** cold start com sessão válida não mostra ecrãs de auth; logout devolve ao Welcome.

## Estados e casos-limite

- Offline no registo: CTA desativado com banner "Sem ligação — precisamos de rede para enviar o código".
- SMS não chega: caminho alternativo por chamada de voz (fase 2) documentado, não implementado.
- Conta já existente no registo: mensagem que propõe ir para login com o número preenchido.

## Notas técnicas

- Supabase Auth com `signInWithOtp` para telefone e `signInWithPassword` para senha.
- Rate limiting por número na Edge Function; captcha invisível se abuso detetado.
- Nunca registar número completo em logs/analytics (hash).

## Métricas

- Taxa de conclusão registo → OTP verificado
- Pedidos de recuperação por 1 000 sessões

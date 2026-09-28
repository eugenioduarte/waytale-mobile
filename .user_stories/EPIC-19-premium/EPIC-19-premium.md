# EPIC-19 — Premium

**Objetivo:** monetização honesta: o plano pago acrescenta profundidade, não desbloqueia o básico.

**Estimativa:** 8 pts · **Telas:** 22 Upgrade / Premium · **Depende de:** EPIC-17

## Histórias

### 19.1 — Ecrã de upgrade
Como utilizador interessado, quero entender o que ganho.

- Benefícios: rotas de autor exclusivas, downloads ilimitados, vozes e idiomas extra, sem limite diário de histórias
- Preços mensal/anual com poupança indicada; sem contagens regressivas nem pressão

**Aceitação:** preços vindos da loja (não hardcoded); estado de subscrição visível no perfil.

### 19.2 — Pontos de entrada contextuais
Como utilizador, quero ver a oferta quando ela é relevante.

- Ao tocar numa rota Premium, ao exceder o limite diário, ao pedir voz/idioma exclusivo

**Aceitação:** no máximo um prompt de upgrade por sessão fora destes contextos.

### 19.3 — Compra e restauro
Como utilizador, quero comprar e recuperar a compra noutro dispositivo.

- IAP via loja; validação de recibo no servidor; "Restaurar compra"

**Aceitação:** subscrição ativa desbloqueia conteúdo em ≤5 s e persiste offline.

### 19.4 — Limites do plano free
Como utilizador free, quero limites previsíveis.

- Limite diário de histórias e de downloads explicitado nas preferências

**Aceitação:** ao atingir o limite a app explica quando reinicia (e não apenas que acabou.)


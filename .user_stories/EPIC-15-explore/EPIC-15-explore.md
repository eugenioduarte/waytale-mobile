# EPIC-15 — Explore / Surprise me

**Objetivo:** para quem não quer decidir: gerar uma rota inesperada a partir da posição e do tempo disponível.

**Estimativa:** 5 pts · **Telas:** 12 Explore / Surprise me · **Depende de:** EPIC-07

## Histórias

### 15.1 — Gerar rota surpresa
Como utilizador indeciso, quero uma rota agora.

- Inputs mínimos: tempo disponível (15/30/60 min) e nada mais
- Animação de geração curta e honesta (sem falso progresso)

**Aceitação:** gera em <3 s com rede; offline usa rotas descarregadas e explica a limitação.

### 15.2 — Rejeitar e voltar a gerar
Como utilizador, quero outra opção sem penalização.

**Aceitação:** "Outra" nunca repete a rota anterior na mesma sessão.

### 15.3 — Explorar por tema
Como utilizador, quero navegar por temas de forma visual.

**Aceitação:** cada tema abre lista filtrada (reutiliza EPIC-08).


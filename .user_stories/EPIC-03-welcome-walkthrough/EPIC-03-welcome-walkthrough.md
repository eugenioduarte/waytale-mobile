# EPIC-03 — Welcome e walkthrough

**Objetivo:** primeiro contacto que explica a proposta em três ecrãs minimalistas antes de pedir qualquer dado.

**Estimativa:** 5 pts · **Telas:** 01 Welcome · 01A1–01A3 Walkthrough · **Depende de:** EPIC-02

## Histórias

### 03.1 — Ecrã de boas-vindas
Como visitante, quero entender o que é o Waytale em segundos, para decidir se continuo.

- Logo centrado, wordmark, tagline "Every street has a story."
- Linha de rota desenhada em fundo com o ponto laranja como pin, animada na entrada (desenho do traço, 900ms, uma só vez)
- CTA "Get started →" e link secundário "Já tem conta? Entrar"

**Aceitação:** "Get started" abre o walkthrough; "Entrar" abre login direto; a animação não repete em navegações seguintes.

### 03.2 — Walkthrough de 3 passos
Como visitante, quero saber o que a app faz antes de criar conta, para não abandonar no registo.

- Passo 1 — Rotas que contam histórias (visual: linha de rota com pin)
- Passo 2 — Narração no momento certo (visual: barras de áudio, barra central laranja)
- Passo 3 — Desvios, se quiseres (visual: percurso com bifurcação laranja tracejada)
- Visual centrado horizontalmente, texto alinhado à esquerda, ProgressDots em baixo à esquerda, CTA à direita
- "Saltar" visível nos passos 1 e 2; último passo mostra "Criar conta →"

**Aceitação:** swipe horizontal e CTA avançam o passo; "Saltar" leva a registo; o walkthrough não reaparece depois de concluído ou saltado.

### 03.3 — Persistência de primeira execução
Como utilizador recorrente, não quero repetir o walkthrough.

- Flag `hasSeenWalkthrough` no `preferencesStore` (persistida) e sincronizada no perfil

**Aceitação:** reinstalar não é necessário para testar: limpar a flag em dev reexibe o fluxo.

## Estados e casos-limite

- Sem rede: ecrãs totalmente locais, nenhum pedido de rede neste épico.
- Leitor de ecrã: cada passo anuncia "passo N de 3".

## Notas técnicas

- Animações com Reanimated, respeitando `prefers-reduced-motion` / "Reduce Motion" do sistema.
- Assets SVG via `react-native-svg`, sem imagens rasterizadas.

## Métricas

- % que conclui o walkthrough vs. salta
- Conversão walkthrough → conta criada

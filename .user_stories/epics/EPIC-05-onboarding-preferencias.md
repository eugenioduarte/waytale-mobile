# EPIC-05 — Onboarding de preferências

**Objetivo:** recolher os três inputs que personalizam as rotas — interesses, tolerância a desvios e voz do narrador — em passos curtos e saltáveis.

**Estimativa:** 8 pts · **Telas:** 02 Interests · 03 Desvios · 04 Voz · **Depende de:** EPIC-04

## Histórias

### 05.1 — Interesses
Como utilizador, quero escolher temas, para receber histórias que me interessam.

- Chips multi-seleção: história, arte, gastronomia, arquitetura, vida local, música, curiosidades
- Mínimo 1, sem máximo; CTA à direita; ProgressDots

**Aceitação:** seleção guardada localmente e sincronizada; com 0 escolhas o CTA está desativado.

### 05.2 — Tolerância a desvios
Como utilizador, quero dizer quanto tempo extra aceito, para as sugestões respeitarem o meu ritmo.

- Slider de 4 passos: Direto · Pouco · Curioso · Sem pressa, com descrição do passo ativo
- Valor mapeado para orçamento de desvio (0 / +5 / +15 / +30 min)

**Aceitação:** o valor escolhido altera o número de paragens sugeridas na Home.

### 05.3 — Voz do narrador
Como utilizador, quero ouvir e escolher a voz, porque vou passar tempo com ela.

- Lista de vozes com pré-escuta de 5s e AudioWave animado durante a reprodução
- Marca vozes exclusivas de Premium com etiqueta discreta

**Aceitação:** pré-escuta funciona com áudio empacotado (sem rede); a seleção aplica-se ao próximo percurso.

### 05.4 — Saltar e editar depois
Como utilizador apressado, quero saltar e ajustar depois.

- Defaults: interesses = história + vida local, desvios = Curioso, voz = padrão

**Aceitação:** saltar leva a Permissões com defaults aplicados e sem estados vazios na Home.

## Estados e casos-limite

- Offline: tudo gravado em SQLite e enviado pela outbox.
- Editar mais tarde é coberto pelo EPIC-17 (ecrãs 18, 19, 20) reutilizando estes componentes.

## Notas técnicas

- Um único `preferencesStore` serve onboarding e definições — sem duplicação de lógica.
- Amostras de voz pré-carregadas no bundle para não depender de rede.


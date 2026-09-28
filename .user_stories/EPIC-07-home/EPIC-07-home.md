# EPIC-07 — Home

**Objetivo:** um ecrã inicial que propõe a rota certa para agora, com entrada para busca e coleções.

**Estimativa:** 8 pts · **Telas:** 05 Home · **Depende de:** EPIC-06

## Histórias

### 07.1 — Sugestão do momento
Como utilizador, quero uma rota pronta para começar agora, sem escolher nada.

- Contexto: hora do dia, tempo estimado disponível, localização, interesses
- Cartão destacado com título, duração, distância, nº de paragens e CTA "Começar"

**Aceitação:** a sugestão muda entre manhã/tarde/noite e respeita a tolerância a desvios.

### 07.2 — Barra de busca
Como utilizador, quero procurar cidade, bairro ou tema.

**Aceitação:** toque abre o ecrã de busca com o teclado já aberto (EPIC-08).

### 07.3 — Carrosséis de coleções
Como utilizador, quero ver rotas curadas por perto.

- Secções: "Perto de ti", "Curtas (<30 min)", "Recomendadas"

**Aceitação:** listas vindas de SQLite; scroll horizontal com snap e sem jank (60 fps).

### 07.4 — Retomar percurso
Como utilizador que interrompeu, quero voltar onde estava.

- Faixa "Continuar percurso" quando existe journey ativo

**Aceitação:** retomar restaura paragem e posição do áudio.

### 07.5 — Carregamento e falha
Como utilizador, quero um ecrã que nunca pisca nem quebra.

- Skeletons com a mesma métrica dos cartões finais
- Banner offline discreto quando os dados são de cache

**Aceitação:** em modo avião a Home mostra conteúdo em cache com faixa "A mostrar conteúdo guardado".

## Métricas

- % de sessões que começam um percurso a partir da Home
- Tempo até primeiro toque

# EPIC-08 — Busca

**Objetivo:** encontrar rotas, locais e temas com resultados rápidos e um estado vazio útil.

**Estimativa:** 5 pts · **Telas:** 06 Search results · 14 Empty state · **Depende de:** EPIC-07

## Histórias

### 08.1 — Busca com resultados progressivos
Como utilizador, quero resultados enquanto escrevo.

- Debounce 250ms; busca local (SQLite FTS) primeiro, remota a seguir e mesclada
- Agrupado por Rotas · Locais · Temas

**Aceitação:** resultados locais aparecem em <100 ms; os remotos não reordenam bruscamente o que já está visível.

### 08.2 — Recentes e sugestões
Como utilizador, quero repetir buscas anteriores.

**Aceitação:** até 5 buscas recentes, removíveis individualmente.

### 08.3 — Estado vazio
Como utilizador sem resultados, quero uma saída, não um beco.

- Mensagem curta + 3 sugestões alternativas + CTA "Surprise me"

**Aceitação:** nunca se mostra uma lista vazia sem alternativa.

### 08.4 — Filtros
Como utilizador, quero afinar por duração e tema.

- Chips de duração (<30, 30–60, 60+) e tema; combináveis

**Aceitação:** filtros refletidos no URL da rota (deep link partilhável).


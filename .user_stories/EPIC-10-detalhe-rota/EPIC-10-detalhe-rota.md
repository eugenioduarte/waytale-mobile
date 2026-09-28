# EPIC-10 — Preview e detalhe da rota

**Objetivo:** dar confiança para começar: percurso no mapa, paragens, duração e prova de qualidade do áudio.

**Estimativa:** 8 pts · **Telas:** 07 Route preview · 09 Detalhe da rota · **Depende de:** EPIC-07

## Histórias

### 10.1 — Mapa do percurso
Como utilizador, quero ver por onde vou passar.

- MapCanvas minimal com polyline navy e pins laranja nas paragens
- Enquadramento automático do percurso; toque num pin foca a paragem na lista

**Aceitação:** mapa renderiza em <1 s com tiles em cache quando disponíveis.

### 10.2 — Lista de paragens
Como utilizador, quero saber quantas paragens e o que são.

- Linha temporal vertical com nome, distância desde a anterior e duração de áudio

**Aceitação:** lista e mapa mantêm-se sincronizados em ambos os sentidos.

### 10.3 — Pré-escuta da história
Como utilizador, quero ouvir 20 s antes de me comprometer.

**Aceitação:** a pré-escuta não conta para o limite diário de histórias do plano free.

### 10.4 — Iniciar percurso
Como utilizador, quero começar com um toque.

- Verificação prévia: permissões, bateria <15% avisa, áudio disponível offline

**Aceitação:** iniciar cria um `journey` local e navega para a navegação ao vivo.

### 10.5 — Guardar e descarregar
Como utilizador, quero guardar para depois ou levar offline.

**Aceitação:** guardar funciona offline (outbox); descarregar delega no EPIC-18.


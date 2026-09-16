# EPIC-18 — Offline e downloads

**Objetivo:** levar rotas, áudio e mapa para o bolso — a app tem de ser útil sem dados no estrangeiro.

**Estimativa:** 8 pts · **Telas:** 23 Download offline · **Depende de:** EPIC-10

## Histórias

### 18.1 — Descarregar uma rota
Como viajante, quero a rota completa antes de sair do hotel.

- Descarrega metadados, áudio das histórias e tiles do mapa da área
- Mostra tamanho estimado antes de começar

**Aceitação:** progresso por rota, pausável e retomável; falha parcial retoma sem começar de novo.

### 18.2 — Gestão de armazenamento
Como utilizador, quero saber e controlar o espaço usado.

- Lista de downloads com tamanho e data; remover individual ou tudo
- Aviso quando o espaço livre é insuficiente

**Aceitação:** espaço reportado coincide com o real (±5%).

### 18.3 — Modo offline
Como utilizador sem rede, quero saber o que funciona.

- Banner global discreto; conteúdo não disponível aparece esbatido com explicação

**Aceitação:** nenhum ecrã lança erro de rede não tratado em modo avião.

### 18.4 — Sync ao voltar online
Como utilizador, quero que tudo se acerte sozinho.

**Aceitação:** percursos, guardados e reportes criados offline sincronizam sem duplicar (ver EPIC-01.6).

### 18.5 — Limites do plano
Como utilizador free, quero saber o meu limite de downloads.

**Aceitação:** limite claro antes de iniciar o download, não depois.


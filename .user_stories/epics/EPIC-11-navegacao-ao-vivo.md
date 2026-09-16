# EPIC-11 — Navegação ao vivo

**Objetivo:** conduzir o utilizador pela rota com o mínimo de ecrã: próxima indicação, gatilhos de chegada e segurança.

**Estimativa:** 13 pts · **Telas:** 08 Live navigation · 24 Alerta de segurança · 26 Sem histórias por aqui · **Depende de:** EPIC-10

## Histórias

### 11.1 — Mapa e próxima indicação
Como caminhante, quero saber para onde ir sem ler muito.

- Mapa a ocupar o ecrã, cartão inferior com próxima ação e distância
- Orientação da câmara segue o percurso; recentrar manual

**Aceitação:** atualização de posição a cada 2–5 s sem salto visual; funciona com tiles offline.

### 11.2 — Gatilho de chegada
Como caminhante, quero que a história comece sozinha ao chegar.

- Geofence por paragem (raio ajustado ao GPS disponível)
- Se em background: notificação + arranque do áudio

**Aceitação:** história correta arranca em ≤5 s após entrar no raio; nunca duas vezes para a mesma paragem.

### 11.3 — Desvio sugerido
Como caminhante curioso, quero aceitar um desvio pelo caminho.

- Sheet com o que é, quanto acrescenta, aceitar/ignorar; respeita o orçamento de desvio

**Aceitação:** aceitar recalcula a rota localmente; ignorar não volta a sugerir a mesma paragem no percurso.

### 11.4 — Alerta de segurança
Como caminhante, quero ser avisado em travessias.

- Banner sobre o mapa + áudio pausado em travessias marcadas

**Aceitação:** áudio retoma sozinho após a travessia; o alerta nunca sobrepõe a indicação de direção.

### 11.5 — Sem histórias por aqui
Como caminhante fora de cobertura, quero saber o que fazer.

- Estado dedicado com o ponto interessante mais próximo e distância

**Aceitação:** aparece após 300 m sem conteúdo; oferece rota alternativa.

### 11.6 — Pausar, saltar e terminar
Como caminhante, quero controlar o percurso.

**Aceitação:** terminar a qualquer momento leva ao Journey Summary com os dados parciais.

### 11.7 — Perda de GPS
Como caminhante num túnel ou rua estreita, não quero ficar preso.

- Após 30 s sem fix: modo manual com botão "Cheguei a esta paragem"

**Aceitação:** o percurso pode ser concluído inteiramente em modo manual.

## Notas técnicas

- Tarefa de localização em background + `expo-av` com modo de áudio de fundo e controlos no ecrã de bloqueio.
- Eventos do percurso gravados append-only em `journey_events` para permitir retomar e reconstruir o resumo.

## Métricas

- % de percursos concluídos
- Histórias disparadas automaticamente vs. manualmente

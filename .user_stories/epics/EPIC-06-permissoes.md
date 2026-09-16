# EPIC-06 — Permissões

**Objetivo:** pedir localização em segundo plano e notificações explicando o porquê, com degradação elegante quando negadas.

**Estimativa:** 5 pts · **Telas:** 13 Permissões · **Depende de:** EPIC-05

## Histórias

### 06.1 — Ecrã de explicação prévia
Como utilizador, quero saber porque precisam da minha localização, antes do pedido do sistema.

- Texto curto: "Para saber quando chegas a um lugar com história."
- Um CTA "Permitir" e um "Agora não"

**Aceitação:** o diálogo nativo só aparece depois deste ecrã.

### 06.2 — Localização em segundo plano
Como utilizador, quero ouvir histórias com o telefone no bolso.

- Pedido em duas fases: foreground primeiro, background quando o primeiro percurso começa
- Texto de justificação nos ficheiros da plataforma alinhado com o ecrã

**Aceitação:** com permissão concedida, os gatilhos de chegada funcionam com a app em background e ecrã bloqueado.

### 06.3 — Notificações
Como utilizador, quero ser avisado da próxima história, sem olhar o ecrã.

- Opcional; se negada, o percurso continua só com áudio

**Aceitação:** negar notificações não bloqueia nenhum fluxo.

### 06.4 — Permissão negada
Como utilizador que negou, quero entender o que perco e como reverter.

- Banner persistente no topo da Home com atalho para as definições do sistema
- Modo degradado: rotas navegáveis manualmente, histórias tocadas por toque

**Aceitação:** com localização negada a app não mostra ecrã de erro e permite percorrer uma rota em modo manual.

## Notas técnicas

- `expo-location` com `startLocationUpdatesAsync` + task manager; geofencing para gatilhos de paragem.
- Orçamento de bateria: ≤ 6%/hora em navegação ativa — medir em CI de performance.


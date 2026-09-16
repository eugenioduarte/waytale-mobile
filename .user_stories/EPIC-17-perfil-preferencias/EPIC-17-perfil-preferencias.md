# EPIC-17 — Perfil e preferências

**Objetivo:** centro de controlo da conta: histórico, preferências de narração e idioma, gestão de dados.

**Estimativa:** 8 pts · **Telas:** 16 Profile · 17 Preferências · 18 Editar interesses · 19 Editar desvios · 20 Editar voz · 21 Language · **Depende de:** EPIC-05

## Histórias

### 17.1 — Perfil e histórico
Como utilizador, quero ver os meus percursos e estatísticas.

- Cabeçalho com nome e totais (percursos, distância, histórias)
- Lista de percursos com acesso ao resumo

**Aceitação:** histórico disponível offline a partir de SQLite.

### 17.2 — Preferências (hub)
Como utilizador, quero encontrar rapidamente o que mudar.

- SettingsRows com valor atual visível: Interesses, Desvios, Voz, Idioma, Offline, Premium, Conta

**Aceitação:** cada linha mostra o valor atual sem abrir o subecrã.

### 17.3 — Editar interesses, desvios e voz
Como utilizador, quero mudar o que definí no onboarding.

- Reutiliza os componentes do EPIC-05 com gravação imediata (sem CTA de guardar)

**Aceitação:** alteração reflete-se na próxima sugestão da Home; sem ecrã de confirmação.

### 17.4 — Idioma
Como utilizador, quero escolher a língua da narração e da interface.

- Lista de idiomas com disponibilidade de narração por idioma marcada
- Alguns idiomas só em Premium

**Aceitação:** mudar idioma da interface não requer reiniciar a app.

### 17.5 — Conta e dados
Como utilizador, quero controlar a minha conta.

- Alterar número, definir/alterar senha, exportar dados, apagar conta (com confirmação por OTP)
- Logout

**Aceitação:** apagar conta remove dados do servidor e limpa o dispositivo; ação irreversível e explicada.


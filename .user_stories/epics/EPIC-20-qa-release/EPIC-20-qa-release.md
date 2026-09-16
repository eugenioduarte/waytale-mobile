# EPIC-20 — QA, observabilidade e release

**Objetivo:** garantir que cada entrega é medível, testada nos fluxos críticos e publicável sem drama.

**Estimativa:** 8 pts · **Telas:** — · **Depende de:** todos os épicos

## Histórias

### 20.1 — Fluxos E2E em Maestro
Como equipa, queremos os caminhos críticos protegidos.

- `auth.yaml`, `onboarding.yaml`, `journey.yaml`, `offline.yaml`, `premium.yaml`
- Mocks de GPS por injeção de localização no emulador

**Aceitação:** suite corre em CI em <12 min e bloqueia merge em falha.

### 20.2 — Testes de componente e integração
Como dev, quero refatorar sem medo.

**Aceitação:** cobertura ≥60% em `src/features`; todos os componentes do EPIC-02 com teste de estados e a11y.

### 20.3 — Observabilidade
Como equipa, queremos saber o que falha no terreno.

- Sentry (crashes + erros de sync), logs de bateria e de gatilhos de geofence
- Analytics de produto com eventos nomeados por épico; nenhum PII

**Aceitação:** painel com: conclusão de onboarding, início e conclusão de percursos, falhas de sync, conversão Premium.

### 20.4 — Acessibilidade e performance
Como utilizador, quero uma app rápida e utilizável por todos.

- Alvos ≥44px, contraste ≥4.5:1, suporte a escala de fonte e Reduce Motion
- TTI <2 s em dispositivo médio; 60 fps em listas

**Aceitação:** auditoria por épico registada antes do release.

### 20.5 — Pipeline de release
Como equipa, queremos publicar com previsibilidade.

- EAS Build + Submit; canais dev/preview/prod; OTA updates para correções de JS
- Checklist de loja: textos de permissões, privacidade, screenshots

**Aceitação:** release candidate gerado por tag e testado em TestFlight/Internal Testing antes de produção.


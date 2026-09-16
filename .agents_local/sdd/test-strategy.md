# Estratégia de Testes — Waytale

## Pirâmide de Testes

```
          ▲
         / \
        / E2E \         Maestro (mobile)
       /────────\
      /Integration\     Jest + MSW — fluxos completos com API mockada
     /────────────\
    /  Unit Tests  \    Jest + Testing Library — lógica isolada
   /________________\
```

## O que testar em cada camada

### Unit (Jest + React Native Testing Library)
- **Models**: tipos e validações (zod schemas)
- **Services**: cada função pública com mocks locais
- **Hooks**: comportamento isolado (`renderHook`)
- **Stores**: Zustand stores (setState, persist)
- **Normalizers**: transformação DTO → Model
- **Helpers/Utils**: funções puras (ex.: cálculo de desvio de rota, formatação de duração)

### Integration (Jest + MSW)
- **Fluxos de tela**: onboarding, auth (OTP), descoberta de rota, journey completo
- **Estados**: loading, empty, error, success — incluindo "sem histórias por aqui" e offline
- **Navegação**: transições entre telas (grupos `(auth)`, `(onboarding)`, `(tabs)`, `(journey)`)
- **Formulários**: validação, submissão, feedback

### E2E (Maestro)
- **Fluxos críticos**: `onboarding.yaml`, `auth.yaml`, `journey.yaml` (ver EPIC-01.8)
- **Apenas happy path + 1 variação crítica por fluxo**
- **Sem mock de API** — usa ambiente dev/staging real

## Cobertura

| Alvo | Mínimo |
|------|--------|
| Global | ≥ 80% |
| Hooks e Services | ≥ 90% |
| Screens | ≥ 70% |
| `src/features` (gate de CI, EPIC-01.8) | ≥ 60% |

## Como rodar

```bash
npm test              # todas as camadas
npm run test:unit     # apenas unit (quando os scripts existirem — ver stack.md)
npm run test:cov      # com cobertura
npx maestro test .maestro/journey.yaml
```

Os scripts `test`, `test:unit`, `test:cov` ainda não existem em `package.json` — criar em
EPIC-01.8 junto com a instalação de Jest/RNTL/Maestro.

## Estrutura de arquivos

```
src/features/auth/
  __tests__/
    auth.hook.unit.test.ts             ← Unit
    auth.flow.integration.test.tsx     ← Integration
src/features/journey/
  __tests__/
    journey.store.unit.test.ts         ← Unit
    journey.flow.integration.test.tsx  ← Integration
.maestro/
  onboarding.yaml                      ← E2E
  auth.yaml                            ← E2E
  journey.yaml                         ← E2E
```

## Regras

1. **Mocks locais e explícitos** — sem mocks globais compartilhados
2. **Sem chamadas de API reais em unit tests** — mock no service boundary
3. **Um assertion por cenário lógico** — agrupar com `describe`
4. **Testar comportamento, não implementação**
5. **SDD como fonte de cenários** — ler o épico/SDD da feature antes de escrever testes
6. **Criar testes no mesmo PR do código** — não adiar

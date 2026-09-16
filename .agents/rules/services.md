---
paths:
  - "src/services/**"
  - "src/lib/**"
  - "src/api/**"
  - "lib/**"
  - "services/**"
---

# Service Rules

- Services own transport, DTO parsing, and response normalization
- Query orchestration belongs in the query layer, not inside services
- DTOs are API contracts, not UI contracts — keep them separate from models
- External payloads must be validated (zod) before crossing into the domain
- Service APIs must be deterministic and mockable in tests
- No side effects that aren't explicitly documented in the function signature

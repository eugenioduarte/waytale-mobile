---
name: project-architecture
description: Design or review Tá na Mão boundaries and the model, service, query, hook, and screen layer contract. Use for new features, multi-layer refactors, DTO leakage, feature placement, offline persistence, or cross-cutting consistency; not for isolated styling changes.
---

# Project Architecture

Preserve the default contract:

`Model -> Service -> Query -> Hook -> Screen`

- Validate external input before creating domain models.
- Keep transport and normalization in services.
- Keep cache orchestration in query modules.
- Keep screen behavior and handlers in hooks.
- Keep screens and reusable components presentation-focused.
- Keep offline repositories explicit and synchronize through service boundaries.

Describe any intentional exception in the active SDD. Prefer feature co-location and explicit contracts over convenience abstractions.

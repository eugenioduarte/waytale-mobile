---
name: api-integration
description: Build or review React Native API integrations with validated DTO boundaries, transport services, TanStack Query orchestration, normalization, error mapping, and testable adapters. Use for requests, API clients, DTOs, query hooks, mutations, and service-layer changes; not for purely local UI work.
---

# API Integration

1. Identify the external trust boundary and expected domain contract.
2. Validate unknown payloads before normalization.
3. Keep DTOs at the edge and return domain models from services.
4. Keep transport, headers, and error mapping inside services.
5. Keep cache keys, retries, invalidation, and mutations inside the query layer.
6. Expose intent-centric APIs to screen hooks; never import transport services from screens.
7. Test normalization, errors, cancellation or concurrency, and cache behavior as applicable.

Use `assets/service-template.ts` and `assets/query-template.ts` only for a new module.

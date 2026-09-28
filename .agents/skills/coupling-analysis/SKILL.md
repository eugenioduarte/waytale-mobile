---
name: coupling-analysis
description: Analyze imports, fan-in, fan-out, cycles, layering violations, and cross-feature coupling before or after a structural refactor. Use for migrations, module moves, shared-package extraction, or architecture drift; return evidence and do not edit code unless separately requested.
---

# Coupling Analysis

1. Define the target subtree and intended boundary.
2. Run `scripts/analyze-deps.sh <target>` for a summarized import scan.
3. Inspect high fan-in or fan-out modules, cycles, screen-to-service shortcuts, and cross-feature imports.
4. Distinguish stable shared contracts from convenience coupling.
5. Report evidence, desired boundary, migration sequence, and verification.

Read `references/coupling-theory.md` only when terminology or trade-offs need deeper explanation.

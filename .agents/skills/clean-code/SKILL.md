---
name: clean-code
description: Implement or review maintainable TypeScript and React Native code with clear intent, cohesive functions, low nesting, controlled duplication, and lightweight JSX. Use for refactors, implementation quality, or code review; not for architecture or product-scope decisions.
---

# Clean Code

- Prefer small cohesive functions and early returns.
- Keep JSX declarative; move orchestration and transformations out of render.
- Name by domain intent, not implementation mechanism.
- Remove dead paths and meaningful duplication without inventing abstractions.
- Keep side effects explicit and dependencies mockable.
- Stop when behavior is clear, tested, and no simpler design is evident.

---
name: security-code
description: Audit React Native dependency risk, production build posture, input validation, secret exposure, and code-level exploitability. Use for dependency, build, validation, or vulnerability reviews; prioritize exploitable release impact over style concerns.
---

# Security Code

Review:

- outdated or vulnerable dependencies and missing dependency scanning
- debug configuration or secrets leaking into production artifacts
- bundle exposure, obfuscation posture, and release build protections
- SQL injection, path traversal, eval, deserialization, and unsafe native execution
- schema validation on untrusted data boundaries

Focus on exploitability and affected release surface, not only on code smell.

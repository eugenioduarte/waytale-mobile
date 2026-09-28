---
name: owasp-security
description: Orchestrate an OWASP MAS-aligned React Native security review across storage, crypto, network, auth, platform, code, and resilience. Use for broad mobile security audits or threat-surface reviews; delegate only the relevant domain skills and remain read-only unless remediation is requested.
---

# OWASP Security

Use this skill as the coordinator for a broad React Native security review.

Operating model:

- establish scope first: source code, manifests, binaries, or mixed review
- classify app sensitivity: low, medium, high, critical
- review each domain with the dedicated security skill
- map findings to MASVS controls whenever possible
- report by severity, affected surface, exploitability, and remediation priority

Domain pack:

- `security-storage`
- `security-crypto`
- `security-network`
- `security-auth`
- `security-platform`
- `security-code`
- `security-resilience`

Prefer concrete findings with evidence, platform scope, and React Native-specific remediation guidance. Do not load every domain skill when the requested surface is narrow.

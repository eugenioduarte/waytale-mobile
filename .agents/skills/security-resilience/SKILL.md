---
name: security-resilience
description: Audit React Native anti-tampering, root or jailbreak detection, anti-debugging, attestation, integrity checks, and obfuscation maturity. Use for release hardening or high-sensitivity threat models; calibrate severity to app sensitivity.
---

# Security Resilience

Review:

- root and jailbreak detection depth
- debugger, emulator, Frida, and hooking detection
- bundle or binary integrity validation
- signing posture and attestation
- JS/native obfuscation and runtime self-protection

Severity must reflect app sensitivity. For low-sensitivity apps, missing resilience may be a warning; for critical apps, it can be high severity.

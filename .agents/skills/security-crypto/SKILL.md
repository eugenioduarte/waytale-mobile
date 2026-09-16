---
name: security-crypto
description: Audit React Native cryptographic algorithms, randomness, key handling, platform keystores, and secret placement. Use for encryption, signing, hashing, token, or sensitive-storage changes; separate checksums from security controls.
---

# Security Crypto

Review:

- weak or prohibited algorithms
- insecure cipher modes, IV handling, and padding
- `Math.random()` or predictable entropy in security contexts
- hardcoded keys, secrets, salts, or IVs
- platform key management through Keychain, Keystore, or Secure Enclave

Prefer findings that separate checksum use from real security use and identify whether the issue is critical, high, or hardening-only.

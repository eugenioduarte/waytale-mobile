---
name: security-network
description: Audit React Native transport security, TLS posture, certificate validation, cleartext policy, and sensitive network flows. Use for API, deep transport, native network configuration, or security review; distinguish baseline failures from optional pinning.
---

# Security Network

Review:

- cleartext traffic, ATS exceptions, and Android network security config
- TLS versions, weak ciphers, and trust bypasses
- certificate pinning and hostname verification
- sensitive data in URLs, logs, headers, or insecure metadata
- bridge, debug, and production transport differences

Always distinguish baseline failures from risk-based hardening items such as pinning.

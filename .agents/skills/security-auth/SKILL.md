---
name: security-auth
description: Audit React Native authentication, authorization, session handling, token lifecycle, OAuth, OTP, PIN, and biometric flows. Use for auth changes or security review; distinguish client-only findings from backend remediation and remain read-only unless fixes are requested.
---

# Security Auth

Review:

- token issuance, storage, rotation, revocation, and session expiry
- OAuth and OIDC flows, PKCE, redirect URI validation, and client-secret misuse
- client-side-only authorization checks
- credential handling in code, env, and local storage
- biometrics, PIN, and hardware-backed authentication

Call out whether the problem is local-only, server-coupled, or requires coordinated backend remediation.

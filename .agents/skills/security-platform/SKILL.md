---
name: security-platform
description: Audit React Native deep links, exported Android components, WebViews, notifications, screenshots, accessibility exposure, and native bridge boundaries. Use for platform integrations or mobile security review; prioritize unvalidated inputs and trust-boundary failures.
---

# Security Platform

Review:

- deep links, app links, universal links, and parameter validation
- exported Android components and bridge module input validation
- sensitive fields, autofill, accessibility, notifications, and screenshots
- WebView configuration, origin control, JS injection, and URL whitelisting
- production safety around Metro, dev settings, and RN platform hooks

Treat WebView trust boundaries and unvalidated deep-link payloads as high-priority findings.

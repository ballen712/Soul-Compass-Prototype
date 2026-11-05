---
name: Onboarding-gated visual checks
description: Safe way to inspect routes hidden behind local onboarding in browser previews.
---

For browser-only visual checks of onboarding-gated screens, use a temporary isolated browser profile seeded with synthetic local storage and keep external-data consent revoked. This can reveal the screen without altering a user's saved profile or authorizing API calls. Browser viewport emulation does not verify native safe-area behavior, device cutouts, or platform scroll behavior.

**Why:** the normal preview browser may have no saved profile, while changing persistent user data or granting birth-data consent just to reach a screen is inappropriate.

**How to apply:** use an isolated browser session, seed only valid synthetic local state, leave consent withdrawn, and report viewport screenshots as web emulation rather than native-device evidence.

---
name: Expo TestFlight builds in Replit
description: Supported path for creating iOS distribution builds from Expo projects hosted on Replit.
---

Use Replit's Publishing → Launch flow for iOS App Store Connect and TestFlight builds. Replit's official guidance says EAS CLI/cloud builds and external EAS project linking are not supported in this environment; do not add an `eas.json` or run EAS commands unless Replit changes that support.

**Why:** Replit Launch handles the native build, signing, and upload flow that standalone EAS CLI would otherwise provide.

**How to apply:** Preserve the app's existing Bundle ID. The developer completes Apple sign-in, team selection, agreements, and any credential approvals inside Replit's Launch UI; never request passwords or 2FA codes in chat.

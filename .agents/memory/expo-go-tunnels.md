---
name: Expo Go tunnel setup
description: Replit cloud connection requirements for opening Soul Compass from Expo Go.
---

Use Expo CLI tunnel mode and its required `@expo/ngrok` dependency for physical-device testing from Replit. Do not force `REACT_NATIVE_PACKAGER_HOSTNAME` or `EXPO_PACKAGER_PROXY_URL` to a Replit development hostname for the Expo connection. Preserve the Replit Expo session login step and app API environment variables.

**Why:** a cloud-hosted Metro server must be reachable through a public hostname; the Replit development hostname previously printed in the Expo QR could not be resolved by the user's iPhone.

**How to apply:** inspect the current `dev` script and workflow logs. Each workflow restart creates a new `on.expo.app` hostname; don't reuse an older QR. Confirm the current host resolves and `/status` responds with `packager-status:running`.

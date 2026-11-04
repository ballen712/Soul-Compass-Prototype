---
name: Workspace dependency links
description: Local pnpm dependency-link gaps that affect Soul Compass test and typecheck commands.
---

The workspace may contain package manifests and pnpm-store packages without the direct `node_modules` links expected by the Soul Compass package. An offline frozen relink was rejected because the current catalog configuration differs from the lockfile.

**Why:** On 2026-11-04, the profile Vitest suite ran, but the separate TypeScript astrology test could not resolve `tsx`; typechecking could not resolve Node types or `astronomy-engine`. A filtered offline frozen install reported a catalog mismatch.

**How to apply:** Before changing application code or updating the lockfile in response to missing-module errors, inspect the actual workspace links and compare the current pnpm catalog configuration with the lockfile. Do not use an unfrozen install during unrelated feature work.

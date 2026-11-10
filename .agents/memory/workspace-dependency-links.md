---
name: Workspace dependency links
description: Local pnpm dependency-link gaps that affect Soul Compass test and typecheck commands.
---

The workspace may contain package manifests and pnpm-store packages without the direct `node_modules` links expected by the Soul Compass package. An offline frozen relink was rejected because the current catalog configuration differs from the lockfile.

**Why:** On 2026-11-04, the profile Vitest suite ran, but the separate TypeScript astrology test could not resolve `tsx`; typechecking could not resolve Node types or `astronomy-engine`. A filtered offline frozen install reported a catalog mismatch.

**How to apply:** Before changing application code or updating the lockfile in response to missing-module errors, inspect the actual workspace links and compare the current pnpm catalog configuration with the lockfile. Do not use an unfrozen install during unrelated feature work. For Expo compatibility validation, run `pnpm install --frozen-lockfile` first: `expo install --check` alone can pass when the manifest differs from the lockfile because it checks the installed dependency graph.

Expo Launch may run pnpm 11 while the Replit development workspace uses pnpm 10. Their dependency build-script allowlists differ: pnpm 11 uses `allowBuilds`, while pnpm 10 uses `onlyBuiltDependencies`. When both majors must work, keep equivalent, explicit package approvals in both formats; do not enable all dependency scripts.

**Why:** An iOS Launch install used the pnpm 11 store generation and ignored the existing pnpm 10 allowlist, blocking esbuild even though the package was explicitly approved locally.

**How to apply:** If Launch reports ignored build scripts despite an existing workspace allowlist, inspect its pnpm major from the build logs and validate the matching config format with a frozen install before changing dependency versions.

Treat Expo Launch's staged app manifest as a separate validation input: a local frozen-lockfile pass does not prove that the staged manifest and lockfile importer have matching dependency groups. Keep Expo, React, and React Native as app runtime dependencies and regenerate the importer when their groups change.

**Why:** An iOS export run listed those framework packages under `dependencies` while its lockfile importer listed them under `devDependencies`, so frozen installation stopped before bundling.

**How to apply:** For `ERR_PNPM_OUTDATED_LOCKFILE`, compare the failing Launch log's dependency group with the app manifest and lockfile, then run a frozen-lockfile check using the pnpm major shown in that run before retrying.

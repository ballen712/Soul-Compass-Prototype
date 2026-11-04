---
name: Operational quota storage approval
description: Approved Replit PostgreSQL scope, production billing boundary and shared-counter testing requirements.
---

The user explicitly approved usage-based PostgreSQL for shared Geoapify quota counters. This is operational storage, not approval for cloud profiles, Supabase changes, other paid services or automatic publication.

**Why:** process-local limits cannot protect the Free-plan budget across restarts/Autoscale instances; the owner approved the disclosed production database cost boundary.

**How to apply:** use the managed Replit database only for minimal operational counters and daily keyed source hashes. Fail closed when unavailable. Keep personal profiles local. Distinguish tested multi-process development behavior from still-unverified production secret/database/runtime configuration. Separate environment budgets do not automatically enforce provider-account-wide quotas.

Persistent integration tests must own isolated quota namespaces and source digests and clean up both.

**Why:** reused test-only source digests survived a test run and correctly triggered the real limiter on a later run.

**How to apply:** use unique fixtures, never live quota namespaces, and verify final-credit races/global rate limits with separate processes and distinct test sources rather than accidentally testing only a source cap.

---
name: Operational quota storage approval
description: Approved Replit PostgreSQL scope, production billing boundary and shared-counter testing requirements.
---

The user explicitly approved usage-based PostgreSQL for shared Geoapify quota counters and a global astrology calculation limit. This is operational storage, not approval for cloud profiles, Supabase changes, other paid services or automatic publication.

**Why:** process-local limits cannot protect shared provider/capacity budgets across restarts or Autoscale instances; the owner approved this operational counter use after the ongoing database-cost tradeoff was disclosed.

**How to apply:** use the managed Replit database only for minimal operational counters and daily keyed source hashes; the aggregate astrology cap must not store client identity or personal data. Fail closed when unavailable. Keep personal profiles local. Distinguish tested multi-process development behavior from production runtime verification. Separate environment budgets do not automatically enforce provider-account-wide quotas, and code changes are not live until separately approved for publishing.

Production logs on 8 November 2026 emitted a PostgreSQL connection-string advisory that SSL-mode alias behavior changes in a future major driver release. The live API requests and quota reservation succeeded; no connection settings were changed.

**Why:** the actual connection URL is secret-managed, and changing TLS parameters without the owner’s approval could break production connectivity.

**How to apply:** before a PostgreSQL driver major upgrade, confirm explicit TLS verification via Replit Secrets; never print or request the connection URL in chat.

Expired city-search source digests are now pruned at API startup and every six hours while an API process is running, in addition to request-path cleanup. If Autoscale has no running instance, stale rows remain until the next instance starts; this is not a hard wall-clock expiry guarantee.

**Why:** a strict cleanup deadline needs a scheduler that runs while the API is scaled to zero, which was not authorized or configured.

**How to apply:** describe the cleanup as periodic/best-effort, not a guaranteed maximum retention duration. Do not add a paid scheduler or change database configuration without owner approval.

Persistent integration tests must own isolated quota namespaces and source digests and clean up both.

**Why:** reused test-only source digests survived a test run and correctly triggered the real limiter on a later run.

**How to apply:** use unique fixtures, never live quota namespaces, and verify final-credit races/global rate limits with separate processes and distinct test sources rather than accidentally testing only a source cap.

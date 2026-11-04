---
name: Post-merge runtime verification
description: Setup success does not by itself establish healthy workflow startup.
---

Treat a successful post-merge setup/reconciliation callback as completion of installation and reconciliation, not proof that every application service subsequently started successfully.

**Why:** reconciliation reported success while a managed workflow later failed with a port already occupied by an older process. Both API and Expo startup were affected during the same reconciliation.

**How to apply:** check actual workflow status and fresh startup logs before reporting that services are healthy. Diagnose a conflicting listener's identity before stopping it; never add indiscriminate port-killing to the automatic setup script.

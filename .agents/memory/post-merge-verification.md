---
name: Post-merge runtime verification
description: Setup success does not by itself establish healthy workflow startup.
---

Treat a successful post-merge setup/reconciliation callback as completion of installation and reconciliation, not proof that every application service subsequently started successfully.

**Why:** reconciliation reported success while a managed workflow later failed with a port already occupied by an older process. Both API and Expo startup were affected during the same reconciliation.

**How to apply:** check actual workflow status and fresh startup logs before reporting that services are healthy. Diagnose a conflicting listener's identity before stopping it; never add indiscriminate port-killing to the automatic setup script.

An Expo artifact restart can leave an old Metro process or stale port claim. The new CLI may pause at an interactive “use the next port?” prompt even though the preview was previously working. Accepting the next port can break artifact routing because the service expects its configured port.

**Why:** a preview served by an older process concealed that the managed Expo workflow had stalled and the configured port was not listening.

**How to apply:** inspect workflow output and the configured port's `/status`; stop only the identified stale Expo process, restart the managed artifact workflow once, and verify the configured port and preview before reporting success.

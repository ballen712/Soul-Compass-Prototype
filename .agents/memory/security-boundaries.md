---
name: Security boundaries
description: User constraints for Soul Compass security and birth-data privacy work.
---

Do not introduce paid security products or commercial dependencies while remediating Soul Compass. Do not introduce third-party services that receive personal birth information unnecessarily. Do not weaken security settings or suppress warnings instead of fixing their causes.

Keep authentication and cloud profiles compatible with Supabase Free for early development. Do not upgrade to a paid plan or incur charges without the user's explicit approval.

**Why:** the user explicitly required these limits in the security remediation and Phase 3 authentication briefs.

**How to apply:** preserve these constraints in future security changes; distinguish a clean automated scan from actual production-ready account security.

Do not unnecessarily reproduce personal birth details in reports, logs or messages.

**Why:** the user explicitly required this privacy boundary in the consolidated testing brief.

**How to apply:** report only the minimum request metadata needed for verification; never include profile values or request bodies.

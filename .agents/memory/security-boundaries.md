---
name: Security boundaries
description: User constraints for Soul Compass security and birth-data privacy work.
---

Do not introduce paid security products or commercial dependencies while remediating Soul Compass. Do not introduce third-party services that receive personal birth information unnecessarily. Do not weaken security settings or suppress warnings instead of fixing their causes.

The user approved removing unused Supabase authentication and cloud-profile code from the active app and backend. Preserve the Supabase project, existing data, migrations, RLS policies and account-level secrets unless the user separately requests changes.

**Why:** the product is local-first; the newer cleanup instruction supersedes earlier plans to retain protected profile routes, while explicitly forbidding live database or secret changes.

**How to apply:** remove only unused code/dependencies and obsolete active setup instructions. Do not delete account data, SQL history or secrets; do not publish the code cleanup without separate approval. Keep the public calculation API's validation, CORS and shared rate limits.

Do not unnecessarily reproduce personal birth details in reports, logs or messages.

**Why:** the user explicitly required this privacy boundary in the consolidated testing brief.

**How to apply:** report only the minimum request metadata needed for verification; never include profile values or request bodies.

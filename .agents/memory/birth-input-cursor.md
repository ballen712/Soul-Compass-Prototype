---
name: Birth input cursor behavior
description: Preserve cursor position in automatically formatted birth date and time fields.
---

Keep birth date and time inputs digit-first: add the date separators and time colon automatically, without moving the cursor unexpectedly during typing, editing, backspace, or paste.

**Why:** The user repeated this requirement after rapid entry still reversed digits around an inserted separator.

**How to apply:** Preserve native cursor movement when changing these fields, and test delayed selection events around automatically inserted separators.

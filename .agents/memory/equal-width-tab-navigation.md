---
name: Equal-width tab navigation
description: User-approved navigation tradeoff for consistent tab widths across languages and devices.
---

Use the same four-slot Classic Tabs layout across platforms so every localized tab has equal width and a fixed label area.

**Why:** The user chose consistent button dimensions across languages over the iOS 26 Liquid Glass appearance, which does not expose per-tab width controls.

**How to apply:** Keep tab item flex values equal, keep labels centered in the same-height area, and do not restore NativeTabs on iOS without revisiting this tradeoff with the user.

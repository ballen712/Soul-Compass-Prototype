---
name: Equal-width tab navigation
description: User-approved navigation tradeoff for consistent tab widths across languages and devices.
---

Use the native Liquid Glass tab bar on iOS when `isLiquidGlassAvailable()` reports support. Keep the equal-width Classic Tabs fallback on older iOS, Android, and Web, and reuse the same tab symbols in both layouts.

**Why:** The user approved automatic Liquid Glass on compatible iPhones, but found generic system icons unclear and wants the established app symbols to remain consistent.

**How to apply:** Check Liquid Glass availability only on iOS, leave native bar backgrounds to the system, and keep all four localized routes in the native layout. Reuse the Classic Tabs symbols; preserve equal-width slots and centered labels in the fallback.

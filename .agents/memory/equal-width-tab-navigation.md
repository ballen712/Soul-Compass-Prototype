---
name: Equal-width tab navigation
description: User-approved navigation tradeoff for consistent tab widths across languages and devices.
---

Use the native Liquid Glass tab bar on iOS when `isLiquidGlassAvailable()` reports support. Keep the equal-width Classic Tabs fallback on older iOS, Android, and Web.

**Why:** The user later approved automatic Liquid Glass on compatible iPhones while asking that unsupported devices and platforms retain the ordinary navigation bar.

**How to apply:** Check Liquid Glass availability only on iOS, leave native bar backgrounds to the system, and keep all four localized routes in the native layout. Preserve equal-width slots and centered labels in the Classic Tabs fallback.

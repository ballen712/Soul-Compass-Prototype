---
name: Crystal catalog return position
description: Preserve the crystal list's measured rows while a stone detail is open so return-to-item centering remains reliable.
---

**Rule:** Keep the catalog list mounted beneath the detail view and center the selected row before revealing the list again. Do not depend on a remounted list's content-size callback to restore a distant index.

**Why:** The user tested the catalog on a device and found that index restoration after unmounting did not reliably return to the stone they had opened. Virtualized lists can lose row measurements when remounted, so an early `scrollToIndex` may leave the viewport elsewhere.

**How to apply:** When changing catalog navigation, preserve the existing list instance and verify both the back button and edge-swipe return with stones from different positions.

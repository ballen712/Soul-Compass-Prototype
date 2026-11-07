---
name: Localization dictionary precedence
description: How to extend seven-language copy without regressing established translations.
---

Prefer established localization maps for overlapping source strings; keep supplemental screen, Natal Chart, and daily-reading dictionaries as fallbacks. If a key already exists in an audited catalog or screen map, update that source or intentionally reconcile the wording instead of silently overriding it.

**Why:** A shared feeling label and astrology term already had established translations with tested wording. Giving new supplemental dictionaries higher precedence caused localization tests to fail and would have changed Crystals copy.

**How to apply:** Before changing translation lookup order, check exact-key overlaps across existing maps and run the Crystal, Cosmos, and screen localization tests. Add new copy as a fallback unless consolidating the original translations deliberately. For interpolated copy, keep the full source template exactly aligned with the string passed to translation; a near-match can leave English sentence framing around translated values. Also review placeholder grammar (case, gender, and word order), not just whether a translation exists.

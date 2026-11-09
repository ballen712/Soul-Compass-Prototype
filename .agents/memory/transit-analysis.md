---
name: Transit analysis boundaries
description: Approved approach for ranked daily transit context and duration reliability.
---

Keep transit analysis on the existing Astronomy Engine. Applying/separating status must come from observed positions on both sides of the current time, not from orb size alone. Use transparent lexicographic ranking rather than an undocumented weighted score. Approximate durations must be sampled from actual positions; when a bounded search does not observe an exit, report a lower bound instead of inventing a precise end date. Unknown birth times remain limited-confidence.

**Why:** the approved technical specification explicitly forbids replacing the ephemeris, arbitrary ranking weights, orb-only motion guesses, and unsupported duration claims.

**How to apply:** later reading and crystal phases should consume the structured transit analysis, preserve its uncertainty, and avoid presenting the sampled estimate as a prediction.

---
name: Crystal image zoom
description: Required pinch-and-pan behavior for crystal artwork wherever it appears.
---

**Rule:** When the user pinches a crystal image, enlarge and move only the image with the continuing finger gesture, allowing it to travel beyond its original image frame across the visible screen. Keep surrounding text and controls at their original size and position. Return the image to its exact original scale and position when the gesture ends.

**Why:** The user clarified that zoom confined to the image frame is not the desired behavior. They want to inspect a chosen part of the stone by moving the enlarged image while holding the gesture, without zooming the rest of the screen.

**How to apply:** Keep the gesture attached to the image layer, elevate it over neighboring content while active, avoid clipping at the original artwork frame, and reset both scale and translation on release/cancel. Verify feature, companion, guide, and catalog image contexts.

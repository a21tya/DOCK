# DOCK intent evaluations

`seed-prompts.json` contains development examples used while shaping the local object and colour rules. `held-out-prompts.json` is a separate set of prompts for checking later rule changes. Keep it out of any classifier's training data.

Run `node scripts/evaluate-local.mjs` and `node scripts/evaluate-heldout.mjs` after local routing changes. The held-out runner checks only pure local handlers for objects, emoji subjects, timers, relative reminders, and natural lists. A `model` result means the local handlers should decline the prompt; it does not mean Gemini returned a correct answer. Browser routing, absolute dates, safety behavior, and hosted model output still need their own evaluations.

Teach DOCK corrections remain in the user's browser. They are not collected by these scripts and must not be added to training without an explicit opt-in and review step.

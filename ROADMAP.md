# DOCK work plan

DOCK is a local-first visual canvas with a hosted Gemini interpreter for unfamiliar prompts. We will work through these milestones in order. A milestone is done only after its examples work on the production URL and the fallback still works without the model.

## 1. Response speed and reliability

- [x] Show local scenes, tools, and search links without waiting for Gemini.
- [x] Start model requests as soon as a prompt is submitted; overlap the typing debounce with the local preview.
- [x] Reuse successful interpretations during the current session and show a clear progress state.
- [ ] Measure first result and final scene time for 30 familiar and 30 unfamiliar prompts on mobile and desktop.
- [ ] Add a bounded retry for temporary model failures and useful error reporting without exposing the API key.
- [ ] Keep a fast local intent path for the most common requests found in that test set.

## 2. Learning from corrections

- [x] Save explicit phrase corrections in the current browser and use them before the hosted model.
- [x] Seed an intent evaluation set from real DOCK examples and record local coverage before adding more rules (`node scripts/evaluate-local.mjs`).
- [ ] Add an export and delete control for the user's saved corrections.
- [ ] Collect an opt-in, reviewed training set of prompt → expected intent and visual result; exclude private prompts by default.
- [ ] Expand the evaluation set to cover dates, lists, safety boundaries, and model responses; keep separate training and held-out examples.
- [ ] Compare a small local classifier with the current rules and Gemini on the same held-out set. Train only if it improves accuracy and latency.
- [ ] Version the trained model, record its dataset and scores, and add a rollback path.

## 3. Make scenes more expressive

- [ ] Define a reusable scene plan for objects, colour palettes, motion, and layout.
- [ ] Expand custom illustrations and animations beyond the Minecraft diamond, with readable foreground content.
- [ ] Add scene controls so users can refine colour, intensity, and object placement.
- [ ] Check contrast, motion settings, mobile layout, and keyboard access for every scene.

## 4. Personal tools

- [ ] Make calendar, appointments, trips, timers, lists, and reminders share one consistent saved data model.
- [ ] Add an optional notification path that works when the tab is closed, with explicit permission.
- [ ] Add import/export and backup so browser-only plans can be moved between devices.
- [ ] Add search across saved plans and reliable date/time handling for India Standard Time and other zones.

## 5. Search and live information

- [ ] Define when DOCK answers directly and when it shows web results, with sources and freshness labels.
- [ ] Improve weather and map failure states; never invent current conditions or political boundaries.
- [ ] Refresh the India district dataset and label its date and source clearly.
- [ ] Add licensed maps, music, and media integrations only after the data source and permissions are chosen.

## 6. Files and launch quality

- [ ] Bring the preserved CSV/PDF workspace into the new canvas with charts and document-specific layouts.
- [ ] Add end-to-end checks for core commands, saved plans, learning, model fallback, and mobile viewport.
- [ ] Add rate limits and usage monitoring for the hosted model route.
- [ ] Polish onboarding, examples, accessibility, and the public project description.

### What “training” means here

The current Gemini model is not trained on your prompts. DOCK has a browser memory for corrections and a hosted model that interprets novel requests. The planned training step is a small, evaluated intent model using reviewed examples. It should be attempted after we have enough labeled data and a clear accuracy target; changing prompt text alone does not train weights.

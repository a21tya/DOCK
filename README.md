# DOCK — a living canvas

A centered input that reshapes the entire page as you type or speak. This is the new front page for DOCK. The earlier CSV and PDF workspace code is preserved in `src/legacy-workspace.js`, `src/legacy-workspace.css`, and `src/pdf-analysis.js` for integration later.

The live app is at [do-ck.vercel.app](https://do-ck.vercel.app/). See [ROADMAP.md](ROADMAP.md) for the ordered work plan and how we will evaluate a future local intent model.

## Run

```bash
npm install
npm run dev
```

Open the local address printed by Vite. `npm run build` checks the production bundle.

## Try it

- `a warm orange sunset` changes the whole page into a warm horizon with a colour palette.
- `a black sky` creates a dark, starry sky instead of matching a sky emoji.
- `a pink sky` creates a pink sky; `northern lights` creates an animated aurora.
- `red`, another CSS colour name, or a hex code opens a shade mixer automatically. The mixer also appears for coloured skies and `minecraft diamond`. Copy a palette to get three hex colours; paste those colours into DOCK to bring the palette back.
- `minecraft diamond` creates a pixel-art gem scene.
- `eggs everywhere` creates a full-page egg pattern.
- `rabbit in a meadow` creates a rabbit scene; animal names create matching emoji scenes.
- `milk everywhere` fills the page with milk glasses. The offline emoji library contains 1,914 searchable emoji entries; you can also enter any emoji supported by your browser directly to create an animated scene.
- `25 min focus timer` opens a working timer.
- The DOCK header stays at the top, and the unboxed analog clock sits beneath it on the left. Drag any hand to play; it returns to India Standard Time after three seconds without interaction.
- `calendar` opens a built-in month view from the search field. Use the arrows to move between months; saved events appear on their dates. Appointments also show their calendar.
- `dinner at 9 on Sunday` proposes the next Sunday at 9 pm IST. Save it to add it to the calendar and receive an in-page alert while the site is open. `dinner at 9 with @harsh` also works.
- `square of 12`, `cube root of 27`, `sqrt 81`, `2^8`, `25% of 200`, `5!`, and arithmetic expressions show local answers.
- `split 2400 between 3` calculates each share.
- `buy eggs, milk and bread` creates a checklist while you type. You can check off, add, and remove items. Checked words are also crossed out in the search field and return to normal when unchecked.
- Lists are saved in this browser. Use **MY LIST** to restore the last one after a reload.
- An unfamiliar prompt offers exact Google Search, Images, and YouTube links.

The background and matching objects react while you type. The microphone uses the browser's Web Speech API when supported and needs microphone permission. Lists and reminders use browser local storage. The reminder alert requires the site to be open; this draft does not provide system-level or push notifications.

Emoji patterns size to the viewport so the wallpaper covers tall and wide screens.

## Open-ended prompts with Gemini

DOCK now has a shared intent plan for object and colour requests. For example, `a red car` and `the colour of the car is red` both become `{action:"show_object",subject:"car",colour:"red",emoji:"🚗"}` and render the same scene without an API call. It currently recognizes a small set of common objects and one colour per request. Ambiguous requests fall through to the existing handlers or the optional model route. The model route now returns a validated `show_object`, `show_atmosphere`, or `answer` plan; it does not execute arbitrary model instructions. This is the first interpretation layer, not a trained or self-learning model.

For an unfamiliar phrase, use **Teach DOCK** to enter an equivalent prompt that DOCK already understands. For a result that looks wrong, choose **Correct this** under the search bar. Corrections can point to scenes, lists, timers, maps, trips, the calendar, the clock, and local games. The exact phrase association is saved in browser local storage and reused on later visits. A remembered result has a **Forget** control. The correction dialog can export all saved corrections as JSON or delete them from this browser. DOCK also recognizes close rewordings that keep at least two meaningful words; unrelated topics do not inherit a correction. This is a small example-based learning layer, not foundation-model retraining, and it stays in this browser.

The local Vite server and a production Vercel Function share `/api/interpret`. When configured, unfamiliar prompts become a validated scene or brief answer. The Gemini key is read on the server and is never placed in the browser bundle. GitHub Pages remains a static preview: it can use the local learning layer, but it cannot run the Gemini function. Deploy the repository to Vercel for live model interpretation.

### Set up live AI safely

1. Open [Google AI Studio API keys](https://aistudio.google.com/api-keys), sign in, and create a key. Do not paste it into the DOCK search bar, GitHub, or a chat.
2. In Vercel, choose **Add New → Project**, import `a21tya/DOCK`, and keep the Vite defaults (`npm run build`, output directory `dist`). Deploy once.
3. In that Vercel project, open **Settings → Environment Variables**. Add **Name:** `GEMINI_API_KEY`; **Value:** your key. Select **Production** (and **Preview** if you want preview deployments to use AI). Do not prefix the name with `VITE_`.
4. Redeploy from **Deployments**. Environment variable changes only apply to new deployments. Open the resulting Vercel URL and try an unfamiliar prompt such as `a violet castle floating over the sea`.

For local development only, create `.env.local` in the project directory with `GEMINI_API_KEY=your_key_here`, then restart `npm run dev`. `.env.local` is ignored by Git. `GEMINI_MODEL` is optional and defaults to `gemini-3.1-flash-lite`.

The API is not active on GitHub Pages. The Vercel deployment has been tested with Gemini on an unfamiliar visual prompt. It interprets prompts; it does not create image files or train Gemini's weights. The browser learning layer stores only the corrections you explicitly teach. Successful model interpretations are reused in memory during the current tab session so repeated prompts appear immediately; they are not saved to disk. Temporary upstream errors are retried once; if the model still fails, DOCK keeps the search links available and shows whether it was busy, timed out, or unavailable.

## Atlas, weather, and everyday prompts

- `hey`, `how are u`, `good morning`, and `thank you` get a direct greeting.
- `red` shows a matching emoji with gradients. `a red car` and `the colour of the car is red` produce the same coloured object scene.
- `Indian map` opens 36 state/union-territory shapes and names. Select a region to explore historical district boundaries. Drag anywhere on the map to pan; use the wheel, +/−, or arrow controls. The region list also supports small islands that are difficult to click.
- `world map` highlights 13 countries and their capitals. Select one to zoom; RESET returns to the world. `map of France`, `map of Japan`, and equivalent supported country names open that country directly.
- `Indian flag` (or any flag request) offers exact Google Search and Images links.
- `weather in Jaipur` fetches current model-estimated weather from Open-Meteo, with rain/wind backgrounds and temperature, feels-like temperature, wind, and precipitation. It requires internet access; a failed request displays an error rather than invented conditions.
- `time in London` finds the location's timezone and displays its live local time. The corner clock continues to show IST.

The matching of familiar phrases is local. These changes do not train a model, remember corrections, or play artist music. The optional model endpoint described above remains available for broader interpretation.

### Map and weather sources

- India states/UTs: [geoBoundaries ADM1](https://www.geoboundaries.org/api/current/gbOpen/IND/ADM1/), sourced from DataMeet/Election Commission; [CC BY 2.5 India](https://creativecommons.org/licenses/by/2.5/in/). The source contains 36 administrative regions. Its metadata represents 2011 with later updates, so it is not a guarantee of current boundaries.
- Districts: [geoBoundaries ADM2](https://www.geoboundaries.org/api/current/gbOpen/IND/ADM2/), Pathways Data/LG Directory; [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The derived `public/data/india-map.json` district database retains this license. **These are historical 2021 boundaries, including 33 Rajasthan districts, not the current 41.** See [Rajasthan's official portal](https://rajasthan.gov.in/) for current information.
- World outlines: [Natural Earth](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/), public domain. The simplified display follows the source's de facto boundaries and is not a statement about sovereignty.
- Weather/timezone lookup: [Open-Meteo weather](https://open-meteo.com/en/docs) and [geocoding](https://open-meteo.com/en/docs/geocoding-api), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The public endpoint is intended for noncommercial use under its service terms.

`python3 scripts/prepare_maps.py STATES.geojson DISTRICTS.geojson WORLD.geojson` regenerates the compact map files from those sources. Geometry is simplified for display; district-to-state assignment uses point containment with a Lakshadweep island correction.

### Globe controls

`world map` or `globe` now opens a shaded, rotatable globe. Drag to rotate, select one of the 13 countries to face its capital, and RESET to return to the initial view. Zoom is proportional to wheel movement and capped per event; globe magnification is limited to 0.8–2.8×. India map zoom uses the same gentler wheel handling. Atlas layouts reserve space for the clock: a left rail on desktop and a separate row on narrow screens.

## Your queue and quick tools

- **Your Plans** keeps active timers, appointments, and upcoming saved trips in this browser; game results and search history stay out of it. The **My List** shortcut lives here too. On narrow screens it becomes a compact strip along the bottom. A timer resumes its countdown after a reload.
- Type `/` to see 24 available tools, including maps, weather, calendar, trips, lists, games, and timers. Scroll the menu, type to filter, click a command, or press Enter for the first match. The search hint and example prompts rotate every 6.5 seconds.
- `trip to Jaipur` opens day/month/year selectors with the range highlighted on a calendar. Dates before today, years before 2026, and returns before departure are blocked. Select a state, district, or country in the atlas to see a place name and current estimated temperature, then use **Plan a trip** to open the trip card. Saved trips appear under Your Plans.
- `rock paper scissors`, `blackjack`, `roll 2d6`, and `games` open local games. They use no accounts, real money, or wagers.
- Each word in the home heading can be dragged separately and returns after three seconds. The larger clock has no digital time label beneath it, and its hands return to IST after three seconds of inactivity.
- The top-right GitHub button opens [a21tya](https://github.com/a21tya).

Queue items and trips are stored in this browser's local storage. Weather and place temperatures require a network connection to Open-Meteo. Trip planning here saves dates; it does not book travel or send external calendar invitations.

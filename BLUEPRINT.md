# Iosandros App — Full Blueprint

A complete reference for any AI assistant working on this project. Verified against the live repo on **April 26, 2026** (commit `9f6f830`).

---

## 1. What the app is

**Iosandros** is an iterative D&D player-guide PWA for **Caeto Antulken** (L4 Monk, Way of the Intelligent Hand), played by **Brady**. It's designed to be referenced **mid-game on an iPad**, so every UI decision favors fast lookup over exploration.

- **Live site:** https://iosandros-app.pages.dev
- **GitHub repo:** https://github.com/Hbl41/Iosandros-App (public, `main` branch)
- **Hosting:** Cloudflare Pages — auto-deploys on push to `main`
- **Installed as:** PWA on Brady's iPad Home Screen
- **Optional sync:** Firebase Firestore, project `iosandros`, sync code `caeto-e6xwrx`

---

## 2. Architecture (frontend + backend)

### Frontend
Pure static site. **No build step. No framework. No bundler.**

- **HTML/CSS/JS** — vanilla
- **Service Worker** (`sw.js`) — offline caching with a strict version model
- **Web App Manifest** (`manifest.webmanifest`) — installable PWA
- **Firebase Firestore** (lazy-loaded ES modules from gstatic CDN at runtime) — optional cross-device sync
- **Google Fonts** — Cinzel, Crimson Pro, Inter (CDN)

### Backend
There is **no application backend that we own**. The "backend" is composed of three managed services:

1. **GitHub** — source of truth for code. Pushes to `main` trigger Cloudflare deploys.
2. **Cloudflare Pages** — static hosting + CDN. Auto-deploys from `main` in ~30–60s. Reads `_headers` for response headers config. No Workers, no Functions, no KV in use today.
3. **Firebase Firestore** — single-document state sync per user. Collection `iosandros_sync`, document keyed by sync code (e.g. `caeto-e6xwrx`). Document shape `{ state, version, updatedAt }`. SDK loaded on-demand from `https://www.gstatic.com/firebasejs/10.14.1/`. Free tier is comfortably sufficient.

Local persistence uses `localStorage` with an in-memory fallback for sandboxed iframes:
- `iosandros-caeto-v1` — the user's full game state (HP, FP, ring, advantage picks, notes, party, etc.)
- `iosandros-sync-meta-v1` — sync code + last version pulled
- `iosandros-firebase-config-v1` — Firebase config object (entered once by user)

Save flow: `save()` writes to localStorage AND schedules a debounced Firestore push via `scheduleSyncPush()`. Pulls happen via `onSnapshot` listener when sync is active.

---

## 3. Service worker behavior (read carefully — this bites often)

`sw.js` implements **network-first for HTML, cache-first for static assets, same-origin only**.

- **HTML requests** → fetch from network, update cache on success, fall back to cache only if offline. (This is why deploys eventually become visible without a cache bump — but only for `index.html`.)
- **CSS/JS/images/JSON** → cache-first. Once cached at version `iosandros-vN`, the SW serves the cached copy until `CACHE_NAME` changes.
- **Cross-origin requests** (Firebase, Google Fonts, gstatic) → ignored by SW, handled by the browser directly.
- **Activate step** — deletes any cache whose key is not the current `CACHE_NAME`, then `clients.claim()`.

**The critical rule:** changing `css/style.css`, `js/app.js`, `data/data.js`, `data/playbook.js`, or any image **without** bumping `CACHE_NAME` means iPads with the PWA installed will keep serving stale files indefinitely.

`_headers` sets `Cache-Control: no-cache` on `/sw.js` itself so the new SW is detected on each visit. That's how a `CACHE_NAME` bump propagates.

The in-app **Hard Refresh button** (added v15) unregisters the SW, deletes all caches, and reloads with `?v=<timestamp>` as a manual nuclear option.

---

## 4. File structure (verified)

```
iosandros-app/
├── index.html              # Single-page shell, all tabs/sections live here
├── manifest.webmanifest    # PWA install manifest
├── sw.js                   # Service worker — bump CACHE_NAME on every code change
├── _headers                # Cloudflare Pages response headers
├── BLUEPRINT.md            # This file
├── WORKFLOW.md             # Tight rules + push commands
├── css/
│   └── style.css           # ~2,300 lines — all styling
├── js/
│   └── app.js              # ~2,200 lines — all behavior (incl. Firestore sync)
├── data/
│   ├── data.js             # Character + lore data (window.CHARACTER, KINGDOMS, etc.)
│   ├── playbook.js         # Turn Coach playbook content
│   └── regions.json        # Map polygons (16 regions, percentage coords)
├── assets/
│   ├── map.jpg             # Parchment map (default visual)
│   ├── map_blueprint.jpg   # Blueprint version (toggle option)
│   └── map_colorfill.jpg   # AI-generated color-fill (used to extract polygons)
└── icons/                  # PWA icons (192, 512, 1024, maskable, favicons)
```

### Data exports in `data/data.js`
- `window.CHARACTER` — Caeto's full sheet (stats, skills, attacks, features)
- `window.KINGDOM_DIRECTIONS` — directional groupings on the map
- `window.KINGDOMS` — 13 kingdom entries
- `window.TERRITORIES` — 3 territory entries
- `window.HISTORY` — campaign timeline
- `window.PROPHECIES` — prophecy text
- `window.CALENDAR` — in-world calendar
- `window.CONNECTIONS` — NPC relationships

### Key sections in `js/app.js`
- DOM helpers `el()`, `$()`, `$$()` (top of file)
- State + storage: `STORAGE_KEY`, `DEFAULT_STATE`, `_store`, `load()`, `save()`
- Sync metadata: `SYNC_META_KEY`, `loadSyncMeta()`, `saveSyncMeta()`
- Theme: `applyTheme()`
- Tabs: `activateTab()`, `activateSubTab()`
- Tooltips: `showTip()`, `hideTip()`, `makeExplainable()`
- Glossary auto-linking: `TERM_ALIASES`, `linkTerms()`
- Map pan/zoom: around line 1195
- Cloud sync (Firestore): around line 1438 — `ensureFirebase()`, `scheduleSyncPush()`, `onSnapshot` listener. SDK lazy-loaded from gstatic.

### Default `state` shape (from `DEFAULT_STATE()`)
```
{
  theme: 'dark',
  tab: 'character',
  hp, fp, ring, metabolismUsed,
  advantagePicks: [...],
  advantageLocked: true,
  date: { monthIdx, day, year },
  budgetKingdom, budgetSpent,
  notes, sessionHpDelta, kingdomFilter,
  tweaks: [], party: [], campaignEvents: []
}
```
This is the schema that Firestore mirrors.

---

## 5. The two-editor reality

The repo has **two editors** that both push to `main`:

1. **AI assistant in a sandbox** (Computer, ChatGPT with code interpreter, etc.) — edits files in a workspace, pushes via git CLI
2. **Brady from his iPad** — edits files via a git client app, pushes directly

Cloudflare deploys whichever push lands first. **Always `git fetch` before pushing** to detect work coming from the other side. Don't trust memory about which iPad client is in use — verify with `git log` if it matters.

---

## 6. Brady's working agreement (verbatim — non-negotiable)

1. **Staged-edit workflow.** Accumulate changes across multiple turns. Push only on explicit signal: "push", "deploy", "ship it", or end of session.
2. **PWA caching.** Every CSS/JS/data change requires bumping `CACHE_NAME` in `sw.js`. After a push, the iPad PWA needs a relaunch (or the in-app hard-refresh button) to see changes.
3. **Pre-push testing.** "You should always test for stuff like this before pushing!!" — verify the **live deployed site** renders correctly before considering the push done.
4. **Character sheet fidelity.** "For the one-liners, try to paraphrase the character sheet, not make stuff up." Lore and mechanics come from `Brady-s-Character-Progression-Iosandros.pdf` or existing data — never invent.
5. **Mid-game design principle.** "The goal is to be able to reference this while mid-game." Dense cheat-sheet UI beats exploratory UI. Minimize taps.
6. **Confirm before deletions.** "Ask before deleting anything." Files, data entries, features, or large code blocks.
7. **Do NOT push until explicitly told.**

---

## 7. The push workflow (exact commands)

```bash
cd <repo-path>

# 1. Detect any iPad-side commits first
git fetch origin main
git rebase origin/main          # or merge — rebase keeps history linear

# 2. Bump the timestamp shown in the UI footer
TS=$(TZ=America/Chicago date "+%b %-d, %Y %-I:%M%p %Z")
sed -i -E "s|Updated [A-Z][a-z]+ [0-9]+, [0-9]+ [0-9]+:[0-9]+[AP]M [A-Z]+|Updated $TS|" index.html

# 3. Bump service worker cache version (find current N in sw.js, increment)
sed -i "s|iosandros-v15|iosandros-v16|g" sw.js

# 4. Commit and push
git -c user.email="brady4sears@gmail.com" -c user.name="Hbl41" \
    commit -am "v16: <one-line summary>"
git push origin main
```

Cloudflare Pages takes ~30–60 seconds. Then verify the live site.

### Verification

```bash
curl -s "https://iosandros-app.pages.dev/?v=$(date +%s)" | grep -o 'Updated [^<]*' | head -1
```

Confirm:
- Footer timestamp matches what was just pushed
- New `CACHE_NAME` is in deployed `sw.js`
- No console errors on load
- The specific feature changed actually behaves as expected

---

## 8. Versioning conventions

Version tag appears in three places that **must move together**:
- `sw.js` `CACHE_NAME` — `iosandros-vN`
- Commit subject — `vN: <summary>`
- Footer timestamp — auto-updated by the `sed` line above

Recent versions:
- **v15** — Hard-refresh button (`9f6f830`)
- **v14** — Turn Coach refocus (`1f894ae`)
- **v13** — Playbook redesign (`556b3e4`)
- **v12** — Playbook skim restructure (`53b9b0c`)

---

## 9. Active work-in-progress

_None active. The live app's Map page is the simple parchment view with pan/zoom only._

---

## 9a. Shelved / reserved (not in live code)

### Map page — clickable regions (SHELVED Apr 26, 2026)

Brady decided to keep the Map page as parchment-only with pan/zoom. The clickable-regions feature was scoped, polygons were extracted, but the SVG overlay / bottom sheet / map toggle were never wired into `index.html`, `js/app.js`, or `css/style.css`. The live app has never shipped this feature.

**Status:** Indefinitely shelved. May be revisited later. Until then, an assistant should NOT touch these artifacts unless Brady explicitly reopens the feature.

**Artifacts preserved in the repo for future use:**
- `data/regions.json` — finalized v8 polygons (16 regions, 50–80 points each, percentage coords). Color-fill extracted from an AI-generated solid-color map. Snaps precisely to the AI map's borders, with minor geographic drift vs the parchment map (Pendant Coast longer, Osmere different shape) — acceptable for click-targets.
- `assets/map_blueprint.jpg` — blueprint variant (intended toggle option)
- `assets/map_colorfill.jpg` — AI-generated solid-color map used as the polygon source

**If reopened, the original next steps were:**
1. Add `<svg>` overlay inside `#mapFrame` with polygons from `regions.json` (convert pct → viewBox)
2. CSS: invisible fill by default, highlighted on hover/active
3. Tap handler → open bottom sheet, populate from name lookup
4. Bottom sheet: 40% screen height, iOS-native feel, close button + tap-outside-to-dismiss
5. "Open full entry" link → 13 Kingdoms tab scrolled to that kingdom
6. Map toggle button: parchment ↔ blueprint
7. Bump `sw.js`, commit, push, verify live

**Reference points if reopened:**
- `data/regions.json` — polygon data
- `assets/map.jpg`, `assets/map_blueprint.jpg`
- `index.html` — `<section id="panel-map">`
- `js/app.js` ~line 1195 — existing pan/zoom logic
- `data/data.js` — `window.KINGDOMS` and `window.TERRITORIES`

---

## 10. Things that have bitten this project

- Forgetting to bump `CACHE_NAME` → iPad shows stale code after deploy
- Pushing without `git fetch` → potential conflicts with iPad-side commits
- Relying on memory for facts that change across versions — always verify against the repo
- Inventing lore instead of paraphrasing the character sheet
- Hand-tracing map polygons (failed) — color-fill extraction from a solid-color AI map worked
- Flood-fill on the blueprint map — borders had gaps, text/icons interfered
- iOS landscape header crowding — needed dedicated `@media` rules
- Trying SPA rewrites via `_redirects` — broke on Cloudflare, was unnecessary

---

*Last verified: April 26, 2026 against commit `9f6f830` (v15).*

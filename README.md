# Iosandros

An iterative D&D player-guide PWA for **Caeto Antulken** (L4 Monk, Way of the Intelligent Hand). Designed to be referenced **mid-game on an iPad** — dense cheat-sheet UI over exploratory navigation.

**Live:** https://iosandros-app.pages.dev

---

## How this app is built and deployed

**Stack:** Pure static site — vanilla HTML/CSS/JS, no build step, no framework, no bundler.

**Backend (managed services, none owned):**
- **GitHub** (this repo) — source of truth. Pushes to `main` trigger Cloudflare deploys.
- **Cloudflare Pages** — static hosting + CDN at `iosandros-app.pages.dev`. Deploys auto-trigger on push to `main` (~30–60s). `_headers` configures response headers; `Cache-Control: no-cache` is set on `/sw.js` so updated service workers are detected immediately.
- **Firebase Firestore** (optional, lazy-loaded) — single-document state sync per user. Collection `iosandros_sync`, document keyed by sync code. Document shape: `{ state, version, updatedAt }`. SDK loaded on-demand from `gstatic.com`. Free tier suffices.

**Local persistence:** `localStorage` keys —
- `iosandros-caeto-v1` — user's full game state
- `iosandros-sync-meta-v1` — sync code + last version pulled
- `iosandros-firebase-config-v1` — user's Firebase config

`save()` writes to localStorage and schedules a debounced Firestore push. Pulls happen via `onSnapshot`.

**Service worker (`sw.js`) — important:**
- Network-first for HTML, cache-first for CSS/JS/data/images, same-origin only.
- Cross-origin requests (Firebase, Google Fonts, gstatic) bypass the SW.
- **Any change to CSS/JS/data/images requires bumping `CACHE_NAME` (`iosandros-vN` → `iosandros-v(N+1)`).** Otherwise installed PWAs serve stale files indefinitely. The in-app Hard Refresh button is the nuclear escape hatch.

**Two-editor reality:** This repo accepts pushes from both an AI assistant (sandbox) and Brady (iPad git client). Always `git fetch origin main && git rebase` before pushing.

---

## For AI assistants working on this repo

1. **Read [`WORKFLOW.md`](./WORKFLOW.md) first** — the operating contract (rules, push procedure, common mistakes).
2. **Then [`BLUEPRINT.md`](./BLUEPRINT.md)** — full architecture, file map, data schema, version history, shelved features.
3. Follow `WORKFLOW.md` strictly. If conflict, `WORKFLOW.md` wins. Re-verify both against the repo when in doubt.

---

## Quick links

- [`WORKFLOW.md`](./WORKFLOW.md) — operating rules
- [`BLUEPRINT.md`](./BLUEPRINT.md) — architecture reference
- [`index.html`](./index.html) — single-page shell
- [`js/app.js`](./js/app.js) — all behavior (incl. Firestore sync)
- [`css/style.css`](./css/style.css) — all styling
- [`data/data.js`](./data/data.js) — character + lore data
- [`data/playbook.js`](./data/playbook.js) — Turn Coach playbook
- [`sw.js`](./sw.js) — service worker (bump `CACHE_NAME` on every code change)

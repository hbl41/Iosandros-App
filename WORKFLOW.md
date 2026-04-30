# Iosandros — Workflow Rules (read first, every session)

You are an AI assistant collaborating with **Brady** on the Iosandros D&D PWA. Read `BLUEPRINT.md` for the full architecture. This file is the operating contract — keep it in your context for every working session.

---

## What you're touching

- **Repo:** `Hbl41/Iosandros-App` on GitHub, branch `main`
- **Live:** `iosandros-app.pages.dev` — Cloudflare Pages auto-deploys on push
- **Stack:** vanilla HTML/CSS/JS PWA, no build step
- **Sync backend:** Firebase Firestore (lazy-loaded), collection `iosandros_sync`

There are **two editors** pushing to `main`: you (sandbox) and Brady (iPad git client). Always `git fetch` before pushing.

---

## The 7 rules (verbatim, non-negotiable)

1. **Staged edits.** Don't push until Brady says **"push"**, **"deploy"**, or **"ship it"**. Accumulate changes across turns.
2. **Bump `CACHE_NAME`.** Any change to CSS/JS/data/images requires incrementing `iosandros-vN` in `sw.js`. Otherwise installed PWAs serve stale files forever.
3. **Test live before claiming done.** After pushing, hit `https://iosandros-app.pages.dev/?v=<timestamp>` and confirm the change is actually live and working. "You should always test for stuff like this before pushing!!"
4. **Character-sheet fidelity.** Paraphrase from `Brady-s-Character-Progression-Iosandros.pdf` and existing data. Never invent lore or mechanics.
5. **Design for mid-game.** Brady is referencing this at the table. Dense cheat-sheets > exploratory UIs. Minimize taps, maximize scan-ability.
6. **Confirm before deleting.** Files, data entries, features, large code blocks — ask first.
7. **Verify, don't recall.** Don't trust memory about workflow facts that may have changed across versions. Check the repo.

---

## Push procedure (exact)

When Brady says push/deploy/ship:

```bash
cd <repo-path>

# 1. Pull any iPad-side commits first
git fetch origin main
git rebase origin/main

# 2. Update the footer timestamp shown in the UI
TS=$(TZ=America/Chicago date "+%b %-d, %Y %-I:%M%p %Z")
sed -i -E "s|Updated [A-Z][a-z]+ [0-9]+, [0-9]+ [0-9]+:[0-9]+[AP]M [A-Z]+|Updated $TS|" index.html

# 3. Bump service worker cache version (read current N from sw.js first, then increment)
sed -i "s|iosandros-vN|iosandros-v(N+1)|g" sw.js

# 4. Commit and push (use Brady's identity)
git -c user.email="brady4sears@gmail.com" -c user.name="Hbl41" \
    commit -am "v(N+1): <one-line summary>"
git push origin main
```

Wait ~30–60s for Cloudflare to deploy.

### Verify live

```bash
curl -s "https://iosandros-app.pages.dev/?v=$(date +%s)" | grep -o 'Updated [^<]*' | head -1
```

Confirm: footer timestamp updated, new `CACHE_NAME` in deployed `sw.js`, no console errors, target feature actually works. If you can't visually verify, say so explicitly — don't claim success.

---

## Service worker quick model

`sw.js` is **network-first for HTML, cache-first for everything else, same-origin only**. Translation:

- `index.html` updates roughly automatically once a deploy lands and the page is reloaded online
- CSS/JS/data/images are pinned to whatever `CACHE_NAME` they were cached under — they only refresh when `CACHE_NAME` changes
- Firebase, Google Fonts, gstatic CDN are cross-origin → SW ignores them

`_headers` sets `Cache-Control: no-cache` on `/sw.js` so the new SW is always detected. The in-app **Hard Refresh** button (v15) is the nuclear escape hatch: unregisters SW, clears caches, reloads with cache-buster.

---

## Common mistakes to avoid

- Pushing CSS/JS without bumping `CACHE_NAME` → invisible on iPad
- Pushing without `git fetch` → potential conflict with iPad-side commits
- Saying "deployed and verified" when you only verified locally → not the same as the live site
- Inventing lore, NPCs, or mechanics → must come from sources
- Deleting files or data without asking first
- Pushing when Brady hasn't said to push

---

*If anything in this file conflicts with `BLUEPRINT.md`, this file wins. Re-verify both against the repo when in doubt.*

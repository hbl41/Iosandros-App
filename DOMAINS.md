# Iosandros Domains and Access

This file documents the domain and privacy setup for the Iosandros project.

Last updated: April 30, 2026

---

## Domain model

The intended public structure is:

- `iosandros.com`: public wiki home for the Iosandros setting.
- `<character>.iosandros.com`: character-specific player helper apps.
- `caeto.iosandros.com`: Caeto Antulken's player helper app.
- `iosandros-app.pages.dev`: Cloudflare Pages default URL for the existing Caeto PWA.

The current app repo is still the Caeto player helper tool. The wiki home can be a separate static site or a separate Cloudflare Pages project later.

---

## Current hosting setup

- GitHub is the source of truth for the app code.
- Cloudflare Pages deploys from the `main` branch.
- The app is a static PWA with no custom backend.
- Firebase Firestore is optional and only used for cross-device sync.

There is no reason to add Workers, Functions, KV, or paid infrastructure unless a future feature clearly needs it.

---

## Cloudflare Access setup for Caeto

The Caeto helper app is intended to be private.

Current working approach:

- Protect `caeto.iosandros.com` with Cloudflare Zero Trust Access.
- Use an Access application for the Caeto subdomain.
- Use an allow policy based on the Emails selector only.
- Add each allowed player email directly to that rule.
- Cloudflare sends a one-time code to allowed emails.

Known test result:

- An allowed email received the code.
- A different email in a private browser window did not receive a code.
- The working rule used only the Emails selector.

Avoid mixing extra selectors into the policy unless there is a clear reason. Earlier testing suggested the extra selector setup prevented the code from sending.

---

## Access behavior notes

Cloudflare Access can feel confusing because a browser that already passed access may stay recognized. To test access cleanly:

- Use a private browsing window.
- Try an email that is not on the allowed list.
- Confirm that no code is sent.
- Then try an allowed email.
- Confirm that a code is sent and the site opens.

The email code flow is acceptable for this project. It avoids setting up a separate identity provider.

---

## Future wiki setup

When building the wiki home for `iosandros.com`, keep it separate from the Caeto helper unless there is a strong reason to combine them.

Recommended simple setup:

- Create a separate static Cloudflare Pages project for the wiki.
- Point `iosandros.com` to that wiki project.
- Keep `caeto.iosandros.com` pointed to the Caeto helper project.
- Keep Access enabled only where privacy is needed.

This preserves a clean split:

- Public setting wiki at the root domain.
- Private character tools on character subdomains.

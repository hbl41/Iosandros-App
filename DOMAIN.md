# Iosandros domain setup

Goal:

- `iosandros.com` opens the wiki home.
- `www.iosandros.com` opens the same wiki home.
- `caeto.iosandros.com` opens Caeto's existing player guide.
- `iosandros.com/caeto` redirects to `caeto.iosandros.com`.

## How the repo handles it

Domain routing lives in `functions/_middleware.js`.

Cloudflare Pages Functions middleware runs before static files. The middleware checks the request hostname:

- `iosandros.com` and `www.iosandros.com` return the inline wiki home page.
- `caeto.iosandros.com` falls through to the existing static app.
- `iosandros.com/caeto` redirects to `https://caeto.iosandros.com/`.
- Unknown character subdomains return a small "guide not found" page, but only if that subdomain has already been pointed to this Pages project.

The Caeto app itself stays unchanged.

## Cloudflare dashboard steps

In Cloudflare, go to:

`Workers & Pages` > `iosandros-app` > `Custom domains`

Add these custom domains to the existing Pages project:

1. `iosandros.com`
2. `www.iosandros.com`
3. `caeto.iosandros.com`

Cloudflare should create the DNS records automatically if `iosandros.com` is managed in the same Cloudflare account.

If Cloudflare asks for manual DNS records, use CNAME records pointing to:

`iosandros-app.pages.dev`

Examples:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | `www` | `iosandros-app.pages.dev` |
| CNAME | `caeto` | `iosandros-app.pages.dev` |

For the apex/root domain, use Cloudflare's Pages custom domain flow rather than manually guessing records.

## Future characters

For each new character:

1. Add the new subdomain in Cloudflare Pages Custom domains.
2. Add that host to `CHARACTER_HOSTS` in `functions/_middleware.js`.
3. Add routing/content for that character.

Cloudflare Pages does not support wildcard custom domains for Pages projects, so `*.iosandros.com` will not automatically work through Pages alone. If every possible character subdomain needs to work without adding each one, that requires a Worker route. Avoid that unless it becomes necessary.

## Deployment notes

This change adds a Pages Function. It does not modify cached static assets such as CSS, JS, data, or images.

Before shipping to `main`:

1. Fetch and rebase on `origin/main`.
2. Update the footer timestamp in `index.html` as usual.
3. Bump `CACHE_NAME` in `sw.js` only if static assets changed in the same release.
4. Commit and push.
5. Verify the live custom domains after Cloudflare finishes deploying.

Suggested verification:

- `https://iosandros.com/` shows the wiki home.
- `https://www.iosandros.com/` shows the wiki home.
- `https://iosandros.com/caeto` redirects to `https://caeto.iosandros.com/`.
- `https://caeto.iosandros.com/` opens the existing Caeto app.
- `https://caeto.iosandros.com/sw.js` still shows the expected `CACHE_NAME`.

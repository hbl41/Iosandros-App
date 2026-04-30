const ROOT_HOSTS = new Set(['iosandros.com', 'www.iosandros.com']);
const CHARACTER_HOSTS = new Map([
  ['caeto.iosandros.com', {
    slug: 'caeto',
    name: 'Caeto Antulken',
    subtitle: 'Level 4 Monk, Way of the Intelligent Hand',
    status: 'Active player guide',
  }],
]);

function htmlResponse(body, init = {}) {
  return new Response(body, {
    ...init,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      ...(init.headers || {}),
    },
  });
}

function renderHome() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Iosandros Wiki</title>
<meta name="description" content="Home for Iosandros campaign wiki pages and character guides." />
<meta name="theme-color" content="#13110d" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap" />
<style>
:root {
  color-scheme: dark;
  --bg: #11100d;
  --panel: rgba(28, 24, 18, 0.82);
  --panel-strong: rgba(39, 33, 24, 0.92);
  --text: #f6eddc;
  --muted: #b7ab97;
  --line: rgba(209, 177, 111, 0.22);
  --gold: #d1b16f;
  --gold-strong: #f1d58f;
  --danger: #d98a73;
}
* { box-sizing: border-box; }
body {
  min-height: 100vh;
  margin: 0;
  color: var(--text);
  background:
    radial-gradient(circle at 18% 8%, rgba(209, 177, 111, 0.16), transparent 32rem),
    radial-gradient(circle at 80% 10%, rgba(93, 75, 42, 0.24), transparent 28rem),
    linear-gradient(135deg, #11100d 0%, #17130f 48%, #0d0c0a 100%);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
a { color: inherit; }
.page {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 40px 0 56px;
}
.topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0 28px;
  border-bottom: 1px solid var(--line);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--gold-strong);
  font-family: Cinzel, serif;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--gold);
  border-radius: 50%;
}
.status-pill {
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  padding: 8px 12px;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.22fr) minmax(280px, 0.78fr);
  gap: 24px;
  padding: 52px 0 34px;
  align-items: stretch;
}
.hero-card,
.panel {
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 24px;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.32);
}
.hero-card {
  padding: clamp(28px, 5vw, 56px);
}
.eyebrow {
  margin: 0 0 14px;
  color: var(--gold);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
h1,
h2,
h3 {
  font-family: Cinzel, serif;
  margin: 0;
  line-height: 1.08;
}
h1 {
  max-width: 760px;
  font-size: clamp(2.7rem, 8vw, 6.4rem);
  letter-spacing: 0.015em;
}
.lede {
  max-width: 680px;
  margin: 22px 0 0;
  color: var(--muted);
  font-family: "Crimson Pro", serif;
  font-size: clamp(1.18rem, 2.2vw, 1.5rem);
  line-height: 1.45;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0 18px;
  background: rgba(209, 177, 111, 0.12);
  color: var(--gold-strong);
  font-weight: 700;
  text-decoration: none;
}
.button.primary {
  background: var(--gold);
  color: #18130d;
  border-color: transparent;
}
.side-card {
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100%;
}
.side-card h2 {
  font-size: 1.5rem;
}
.domain-list {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}
.domain-row {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.12);
}
.domain-row strong {
  display: block;
  margin-bottom: 4px;
  color: var(--gold-strong);
  font-family: Cinzel, serif;
}
.domain-row span {
  color: var(--muted);
  font-size: 0.9rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.panel {
  padding: 22px;
}
.panel h2 {
  margin-bottom: 12px;
  font-size: 1.22rem;
}
.panel p,
.panel li {
  color: var(--muted);
  line-height: 1.5;
}
.panel ul {
  margin: 0;
  padding-left: 1.1rem;
}
.character-card {
  display: grid;
  gap: 12px;
}
.character-card h3 {
  color: var(--gold-strong);
  font-size: 1.45rem;
}
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag {
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  padding: 5px 9px;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.footer {
  margin-top: 30px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.82rem;
}
.missing {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 28px;
}
.missing .panel {
  max-width: 620px;
}
@media (max-width: 820px) {
  .page { width: min(100% - 24px, 1120px); padding-top: 20px; }
  .topline { align-items: flex-start; flex-direction: column; }
  .hero { grid-template-columns: 1fr; padding-top: 30px; }
  .grid { grid-template-columns: 1fr; }
  .hero-card, .side-card, .panel { border-radius: 18px; }
}
</style>
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    registrations.forEach(function(registration) { registration.unregister(); });
  }).catch(function() {});
}
if ('caches' in window) {
  caches.keys().then(function(keys) {
    keys.filter(function(key) { return key.indexOf('iosandros-') === 0; })
      .forEach(function(key) { caches.delete(key); });
  }).catch(function() {});
}
</script>
</head>
<body>
  <div class="page">
    <header class="topline">
      <div class="brand"><span class="brand-mark">✦</span><span>Iosandros</span></div>
      <div class="status-pill">Campaign wiki home</div>
    </header>

    <main>
      <section class="hero">
        <div class="hero-card">
          <p class="eyebrow">The Realm of Iosandros</p>
          <h1>Wiki home and character guide index.</h1>
          <p class="lede">Use this page as the front door for campaign reference. Character tools live on their own subdomains so each sheet can stay fast, focused, and table-ready.</p>
          <div class="hero-actions">
            <a class="button primary" href="https://caeto.iosandros.com/">Open Caeto guide</a>
            <a class="button" href="https://iosandros-app.pages.dev/">Open current Pages app</a>
          </div>
        </div>

        <aside class="panel side-card" aria-label="Domain structure">
          <div>
            <p class="eyebrow">Domain plan</p>
            <h2>Simple routing</h2>
            <div class="domain-list">
              <div class="domain-row"><strong>iosandros.com</strong><span>This wiki home.</span></div>
              <div class="domain-row"><strong>&lt;character&gt;.iosandros.com</strong><span>Character-specific guide or sheet.</span></div>
              <div class="domain-row"><strong>caeto.iosandros.com</strong><span>Caeto Antulken’s current player guide.</span></div>
            </div>
          </div>
        </aside>
      </section>

      <section class="grid" aria-label="Wiki sections">
        <article class="panel character-card">
          <p class="eyebrow">Active character</p>
          <h3>Caeto Antulken</h3>
          <p>Level 4 Monk, Way of the Intelligent Hand. This is the existing iPad-focused PWA with trackers, playbook, kingdoms, history, people, calendar, and map reference.</p>
          <div class="tag-row">
            <span class="tag">PWA</span>
            <span class="tag">Mid-game</span>
            <span class="tag">Local save</span>
          </div>
          <a class="button primary" href="https://caeto.iosandros.com/">Open guide</a>
        </article>

        <article class="panel">
          <p class="eyebrow">Wiki shelves</p>
          <h2>Reference areas</h2>
          <ul>
            <li>Character guides</li>
            <li>Kingdom and territory reference</li>
            <li>History and calendar notes</li>
            <li>People and campaign contacts</li>
          </ul>
        </article>

        <article class="panel">
          <p class="eyebrow">Build rule</p>
          <h2>One purpose per page</h2>
          <p>The home page stays broad. Character subdomains stay dense and practical for game night. That keeps the app fast while leaving room for more sheets later.</p>
        </article>
      </section>
    </main>

    <footer class="footer">Iosandros wiki routing shell. Character content remains source-controlled in GitHub and deployed through Cloudflare Pages.</footer>
  </div>
</body>
</html>`;
}

function renderMissingCharacter(hostname) {
  const character = hostname.replace('.iosandros.com', '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Character Guide Not Found</title>
<meta name="robots" content="noindex" />
<style>
body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; color: #f6eddc; background: #11100d; font-family: system-ui, sans-serif; }
main { max-width: 620px; border: 1px solid rgba(209, 177, 111, 0.28); border-radius: 20px; padding: 28px; background: rgba(28, 24, 18, 0.9); }
h1 { margin: 0 0 12px; font-family: Georgia, serif; }
p { color: #b7ab97; line-height: 1.5; }
a { color: #f1d58f; font-weight: 700; }
code { color: #f1d58f; }
</style>
</head>
<body>
<main>
  <h1>No guide for <code>${character}</code> yet.</h1>
  <p>This subdomain reached the Iosandros Pages project, but no character guide is registered for it.</p>
  <p><a href="https://iosandros.com/">Return to iosandros.com</a></p>
</main>
</body>
</html>`;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (ROOT_HOSTS.has(hostname)) {
    if (pathname === '/caeto') {
      return Response.redirect('https://caeto.iosandros.com/', 302);
    }

    if (pathname === '/' || pathname === '/index.html') {
      return htmlResponse(renderHome());
    }
  }

  if (hostname.endsWith('.iosandros.com') && !ROOT_HOSTS.has(hostname) && !CHARACTER_HOSTS.has(hostname)) {
    if (pathname === '/' || pathname === '/index.html') {
      return htmlResponse(renderMissingCharacter(hostname), { status: 404 });
    }
  }

  return context.next();
}

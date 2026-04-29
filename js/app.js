// ========================================================
//  Caeto's Player Guide — app.js
// ========================================================

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const el = (tag, opts = {}, ...children) => {
  const e = document.createElement(tag);
  if (opts.class) e.className = opts.class;
  if (opts.html != null) e.innerHTML = opts.html;
  else if (opts.text != null) e.textContent = opts.text;
  for (const [k, v] of Object.entries(opts)) {
    if (['class', 'html', 'text'].includes(k)) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
};
const fmtMod = n => (n >= 0 ? `+${n}` : `${n}`);

// ========================================================
//  State — persisted to browser storage
// ========================================================
const STORAGE_KEY = 'iosandros-caeto-v1';
const DEFAULT_STATE = () => ({
  theme: 'dark',
  tab: 'character',
  hp: CHARACTER.hpMax,
  fp: 4,
  ring: 3,
  metabolismUsed: false,
  advantagePicks: ['The Pendant Coast'],
  advantageLocked: true,  // Locked by default — advantage picks are set at character creation

  date: { monthIdx: 0, day: 1, year: 1224 },
  budgetKingdom: 'Lorenthar',
  budgetSpent: {}, // { kingdomName: [spent0, spent1, spent2] }
  notes: '',
  sessionHpDelta: 1,
  kingdomFilter: 'All',
  tweaks: [], // [{ id, text, done, createdAt }]
  party: [],  // [{ id, name, role, category, tags, notes, createdAt, updatedAt }]
  campaignEvents: [], // [{ id, year, monthIdx, day, text, createdAt }]
  // (playbook reorder + collapsible state removed in v13 — everything visible by default)
});

// Storage — prefer browser persistence; fall back to memory when blocked
// (e.g. sandboxed preview iframes). Access via bracket notation to keep
// the code portable across those environments.
const _memStore = {};
const _store = (() => {
  try {
    const k = ['local', 'Storage'].join('');
    const s = window[k];
    if (!s) throw 0;
    const test = '__t' + Math.random();
    s.setItem(test, '1'); s.removeItem(test);
    return {
      get: key => s.getItem(key),
      set: (key, val) => s.setItem(key, val),
    };
  } catch {
    return {
      get: key => _memStore[key] || null,
      set: (key, val) => { _memStore[key] = val; },
    };
  }
})();

const SYNC_META_KEY = 'iosandros-sync-meta-v1';
let syncMeta = loadSyncMeta();
let state = load();

function load() {
  try {
    const raw = _store.get(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE();
    return { ...DEFAULT_STATE(), ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE();
  }
}
function save() {
  try { _store.set(STORAGE_KEY, JSON.stringify(state)); } catch {}
  scheduleSyncPush();
}
function loadSyncMeta() {
  try {
    const raw = _store.get(SYNC_META_KEY);
    if (!raw) return { code: null, version: 0 };
    return JSON.parse(raw);
  } catch {
    return { code: null, version: 0 };
  }
}
function saveSyncMeta() {
  try { _store.set(SYNC_META_KEY, JSON.stringify(syncMeta)); } catch {}
}

// ========================================================
//  Theme
// ========================================================
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const btn = $('#themeToggle');
  btn.innerHTML = state.theme === 'dark'
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
}
$('#themeToggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(); save();
});

// ========================================================
//  Hard Refresh — unregister SW, clear caches, reload fresh
// ========================================================
(function setupHardRefresh() {
  const btn = document.getElementById('hardRefresh');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';
    btn.classList.add('is-spinning');
    const svg = btn.querySelector('svg');
    if (svg) svg.style.transition = 'transform 0.6s linear';
    try {
      // 1. Unregister all service workers so the new one installs next load.
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      // 2. Purge all caches (CacheStorage).
      if (typeof caches !== 'undefined' && caches.keys) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (e) {
      console.warn('Hard refresh cleanup warning:', e);
    }
    // 3. Cache-buster reload so iOS fetches fresh HTML even if the PWA
    //    tried to serve a stale shell.
    const url = new URL(window.location.href);
    url.searchParams.set('_r', Date.now().toString());
    window.location.replace(url.toString());
  });
})();

// ========================================================
//  Tabs
// ========================================================
function activateTab(name) {
  // Legacy routing: 'connections' and 'party' both now live inside the 'people' tab.
  let sub = null;
  if (name === 'connections') { sub = 'connections'; name = 'people'; }
  else if (name === 'party')  { sub = 'party';       name = 'people'; }
  // Legacy routing: 'prophecies' is now a section inside the 'other-info' tab.
  else if (name === 'prophecies') { name = 'other-info'; }
  state.tab = name;
  $$('.tab').forEach(t => {
    const isActive = t.dataset.tab === name;
    t.setAttribute('aria-selected', isActive);
  });
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'map' && typeof window._fitMap === 'function') window._fitMap();
  if (name === 'tweaks') renderTweaks();
  if (name === 'people') activateSubTab(sub || state.peopleSubtab || 'party');
  save();
}
$$('.tab').forEach(t => t.addEventListener('click', () => activateTab(t.dataset.tab)));

// Sub-tabs inside the 'People' panel
function activateSubTab(name) {
  $$('.subtab').forEach(t => t.setAttribute('aria-selected', t.dataset.subtab === name));
  $$('.subpanel').forEach(p => p.classList.toggle('active', p.id === `subpanel-${name}`));
  state.peopleSubtab = name;
  save();
}
$$('.subtab').forEach(t => t.addEventListener('click', () => activateSubTab(t.dataset.subtab)));

// ========================================================
//  TOOLTIP (inline ability explanations)
// ========================================================
const tip = document.createElement('div');
tip.className = 'floating-tooltip';
tip.hidden = true;
document.body.appendChild(tip);

function showTip(target, name) {
  const d = (PLAYBOOK.abilityDetails || {})[name];
  if (!d) return;
  tip.innerHTML = `
    <div class="tt-name">${name}</div>
    <div class="tt-section"><span class="tt-label">What it does</span> ${escapeHtml(d.plain)}</div>
    <div class="tt-section"><span class="tt-label">When it matters</span> ${escapeHtml(d.whenItMatters)}</div>
    <div class="tt-foot">See Playbook → Turn Coach for more</div>
  `;
  tip.hidden = false;
  const r = target.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  tip.style.visibility = 'hidden';
  tip.style.left = '0px';
  tip.style.top = '0px';
  const tr = tip.getBoundingClientRect();
  let left = r.left + (r.width / 2) - (tr.width / 2);
  left = Math.max(8, Math.min(vw - tr.width - 8, left));
  let top = r.bottom + 8;
  if (top + tr.height > vh - 8) top = r.top - tr.height - 8;
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
  tip.style.visibility = 'visible';
}
function hideTip() { tip.hidden = true; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function makeExplainable(elem, name) {
  if (!(PLAYBOOK.abilityDetails || {})[name]) return elem;
  elem.classList.add('explainable');
  elem.setAttribute('tabindex', '0');
  elem.setAttribute('role', 'button');
  elem.setAttribute('aria-label', name + ' — click for plain-English explanation');
  elem.addEventListener('mouseenter', () => showTip(elem, name));
  elem.addEventListener('mouseleave', hideTip);
  elem.addEventListener('focus', () => showTip(elem, name));
  elem.addEventListener('blur', hideTip);
  elem.addEventListener('click', e => { e.stopPropagation(); tip.hidden ? showTip(elem, name) : hideTip(); });
  return elem;
}

// ========================================================
//  AUTO-LINKER — wrap known terms in prose with tooltips
// ========================================================
// Maps a prose phrase (case-insensitive, whole-word) to the abilityDetails key it should resolve to.
// Rule: tooltip ONLY for terms Caeto would have to look up to execute the sentence.
// No skills (his modifiers are on the character sheet), no lore/people/places, no his-own-gear.
const TERM_ALIASES = [
  // Class mechanics (the things that cost FP or have their own rules)
  ['Flurry of Blows', 'Flurry of Blows'],
  ['Patient Defense', 'Patient Defense'],
  ['Step of the Wind', 'Step of the Wind'],
  ['Deflect Attacks', 'Deflect Attacks'],
  ['Slow Fall', 'Slow Fall'],
  ['Unarmored Movement', 'Unarmored Movement'],
  ['Uncanny Metabolism', 'Uncanny Metabolism'],
  ['Ring of Discernment', 'Ring of Discernment'],
  ['Ring', 'Ring of Discernment'],
  ['ring', 'Ring of Discernment'],
  ['Open Hand Technique', 'Open Hand Technique'],
  ['Open Hand', 'Open Hand Technique'],

  // Resource math
  ['AC', 'AC'],
  ['HP', 'HP'],
  ['Focus Points', 'Focus Points'],
  ['Focus Point', 'Focus Points'],
  ['FP', 'Focus Points'],
  ['DC', 'DC'],
  ['Initiative', 'Initiative'],

  // Turn slots
  ['Attack action', 'Attack action'],
  ['Bonus Action', 'Bonus Action'],
  ['Reaction', 'Reaction'],
  ['Action', 'Action'],

  // Standard actions (anything that's telling you to do a named action)
  ['Dash', 'Dash'],
  ['Disengage', 'Disengage'],
  ['Disengaging', 'Disengage'],
  ['Dodge', 'Dodge'],
  ['Help', 'Help'],
  ['Hide', 'Hide'],
  ['Ready', 'Ready'],
  ['Search', 'Search'],
  ['Opportunity Attack', 'Opportunity Attack'],
  ['opportunity attack', 'Opportunity Attack'],
  ['opportunity-attack', 'Opportunity Attack'],

  // Rolls, saves, conditions that change the math
  ['Advantage', 'Advantage'],
  ['Disadvantage', 'Disadvantage'],
  ['ability check', 'ability check'],
  ['skill check', 'skill check'],
  ['saving throw', 'saving throw'],
  ['DEX save', 'DEX save'],
  ['STR save', 'STR save'],
  ['INT save', 'INT save'],
  ['CON save', 'CON save'],
  ['Prone', 'Prone'],
  ['prone', 'Prone'],
  ['cover', 'cover'],

  // Rest mechanics (what actually gets restored)
  ['Long Rest', 'Long Rest'],
  ['Short Rest', 'Short Rest'],
  ['Martial Arts die', 'Martial Arts die'],
];

// Pre-build the combined regex: longest aliases first (so "Open Hand Technique" wins over "Open Hand")
const TERM_REGEX = (() => {
  const sorted = [...TERM_ALIASES].sort((a, b) => b[0].length - a[0].length);
  const pattern = sorted
    .map(([phrase]) => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  return new RegExp('(' + pattern + ')', 'g');
})();

// Case-insensitive alias lookup
const ALIAS_MAP = new Map();
TERM_ALIASES.forEach(([phrase, key]) => ALIAS_MAP.set(phrase.toLowerCase(), key));

// Wrap recognized terms in a string into explainable spans.
// Returns a DocumentFragment. Each match becomes its OWN tooltip-wrapped span.
function linkTerms(text) {
  const frag = document.createDocumentFragment();
  if (!text) return frag;
  let lastIndex = 0;
  const re = new RegExp(TERM_REGEX.source, 'g');
  let m;
  while ((m = re.exec(text)) !== null) {
    const match = m[0];
    const idx = m.index;
    // Whole-word boundary check: char before must not be alphanumeric for alpha-starting terms
    const before = idx > 0 ? text[idx - 1] : ' ';
    const after = idx + match.length < text.length ? text[idx + match.length] : ' ';
    const firstIsAlpha = /[A-Za-z]/.test(match[0]);
    const lastIsAlpha = /[A-Za-z]/.test(match[match.length - 1]);
    const boundOk =
      (!firstIsAlpha || !/[A-Za-z0-9]/.test(before)) &&
      (!lastIsAlpha || !/[A-Za-z0-9]/.test(after));
    if (!boundOk) continue;
    const key = ALIAS_MAP.get(match.toLowerCase());
    if (!key || !(PLAYBOOK.abilityDetails || {})[key]) continue;
    // Append preceding text
    if (idx > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, idx)));
    const span = el('span', { text: match });
    makeExplainable(span, key);
    frag.appendChild(span);
    lastIndex = idx + match.length;
  }
  if (lastIndex < text.length) {
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
  return frag;
}
document.addEventListener('click', e => { if (!e.target.closest('.floating-tooltip') && !e.target.closest('.explainable')) hideTip(); });
window.addEventListener('scroll', hideTip, true);
window.addEventListener('resize', hideTip);

// ========================================================
//  CHARACTER SHEET render
// ========================================================
function renderCharacter() {
  // Attributes
  const attrGrid = $('#attrGrid');
  attrGrid.innerHTML = '';
  CHARACTER.attributes.forEach(a => {
    attrGrid.appendChild(
      el('div', { class: 'attr' },
        el('div', { class: 'abbr', text: a.abbr }),
        el('div', { class: 'full-name', text: a.name }),
        el('div', { class: 'score', text: a.score }),
        el('div', { class: 'mod', text: fmtMod(a.mod) + ' mod' }),
        el('div', { class: 'save' + (a.profSave ? ' prof' : ''), text: `Save ${fmtMod(a.save)}` })
      )
    );
  });

  // Skills
  const groupRender = (key, targetId) => {
    const host = $(targetId);
    host.innerHTML = '';
    (CHARACTER.skills[key] || []).forEach(s => {
      const row = el('div', { class: 'skill-row' + (s.prof ? ' prof' : '') });
      row.appendChild(el('span', { class: 'name', text: s.name }));
      if (s.note) row.appendChild(el('span', { class: 'note', text: s.note }));
      row.appendChild(el('span', { class: 'bonus', text: fmtMod(s.bonus) }));
      host.appendChild(row);
    });
  };
  groupRender('DEX', '#skillsDEX');
  groupRender('INT', '#skillsINT');
  groupRender('WIS', '#skillsWIS');
  groupRender('STR', '#skillsSTR');
  groupRender('CHA', '#skillsCHA');

  // Weapons
  const wt = $('#weaponsTbody');
  wt.innerHTML = '';
  CHARACTER.weapons.forEach(w => {
    const nameCell = el('td', {});
    const nameSpan = el('span', { text: w.name });
    makeExplainable(nameSpan, w.name);
    nameCell.appendChild(nameSpan);
    wt.appendChild(
      el('tr', {},
        nameCell,
        el('td', { text: w.bonus }),
        el('td', { class: 'damage', text: w.damage })
      )
    );
    if (w.notes) {
      wt.appendChild(el('tr', {}, el('td', { class: 'note', colspan: 3, text: w.notes })));
    }
  });

  // Spells
  const st = $('#spellsTbody');
  st.innerHTML = '';
  CHARACTER.spells.forEach(s => {
    const nameCell = el('td', {});
    const nameSpan = el('span', { text: s.name });
    makeExplainable(nameSpan, s.name);
    nameCell.appendChild(nameSpan);
    st.appendChild(
      el('tr', {},
        nameCell,
        el('td', { text: s.cost }),
        el('td', { text: s.effect })
      )
    );
  });

  // Traits
  const tl = $('#traitsList');
  tl.innerHTML = '';
  CHARACTER.traits.forEach(t => {
    const labelSpan = el('span', { class: 'label', text: t.name });
    makeExplainable(labelSpan, t.name);
    tl.appendChild(
      el('li', {},
        labelSpan,
        el('span', { text: t.text })
      )
    );
  });

  // Equipment
  const eq = $('#equipmentList');
  eq.innerHTML = '';
  CHARACTER.equipment.forEach(item => eq.appendChild(el('li', { text: item })));

  // Benefits
  const bl = $('#benefitsList');
  bl.innerHTML = '';
  CHARACTER.backstoryBenefits.forEach(b => bl.appendChild(el('li', { text: b })));

  $('#jeffText').textContent = CHARACTER.jeff;
  $('#disciplineText').textContent = CHARACTER.discipline;
}

// ========================================================
//  TRACKERS
// ========================================================
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function renderTrackers() {
  // HP
  $('#hpCurrent').textContent = state.hp;
  $('#hpMax').textContent = CHARACTER.hpMax;
  $('#heroHP').textContent = `${state.hp} / ${CHARACTER.hpMax}`;
  $('#topHp').textContent = `${state.hp} / ${CHARACTER.hpMax}`;
  const hpDisplay = $('#hpDisplay');
  const low = state.hp <= Math.floor(CHARACTER.hpMax * 0.3);
  hpDisplay.classList.toggle('low', low);
  $('#topHp').classList.toggle('low', low);

  // FP
  $('#fpCurrent').textContent = state.fp;
  $('#topFp').textContent = `${state.fp} / 4`;
  const pips = $('#fpPips');
  pips.innerHTML = '';
  for (let i = 1; i <= 4; i++) {
    const pip = el('button', {
      class: 'pip' + (i <= state.fp ? ' filled' : ''),
      'aria-label': `Focus point ${i}`,
      onclick: () => { state.fp = i <= state.fp ? i - 1 : i; save(); renderTrackers(); }
    }, String(i));
    pips.appendChild(pip);
  }
  $('#metaLabel').textContent = state.metabolismUsed
    ? 'Uncanny Metabolism used — recharges on Long Rest.'
    : 'Uncanny Metabolism available this long rest.';

  // Ring
  $('#ringCurrent').textContent = state.ring;
  $('#topRing').textContent = `${state.ring} / 3`;
  const rd = $('#ringDots');
  rd.innerHTML = '';
  for (let i = 1; i <= 3; i++) {
    const available = i <= state.ring;
    rd.appendChild(el('button', {
      class: 'ring-dot' + (available ? ' available' : ' used'),
      'aria-label': `Ring use ${i} ${available ? 'available' : 'used'}`,
      onclick: () => {
        if (available) state.ring = Math.max(0, state.ring - 1);
        else state.ring = Math.min(3, state.ring + 1);
        save(); renderTrackers();
      }
    }));
  }

  // Budget
  renderBudget();
}

// HP buttons
$('#hpDelta').value = state.sessionHpDelta;
$('#hpDelta').addEventListener('change', e => {
  state.sessionHpDelta = Math.max(1, parseInt(e.target.value) || 1);
  save();
});
$$('[data-hp]').forEach(btn => {
  btn.addEventListener('click', () => {
    const amt = parseInt(btn.dataset.hp);
    state.hp = clamp(state.hp + amt, 0, CHARACTER.hpMax);
    save(); renderTrackers();
  });
});
$('#hpDamage').addEventListener('click', () => {
  state.hp = clamp(state.hp - state.sessionHpDelta, 0, CHARACTER.hpMax);
  save(); renderTrackers();
});
$('#hpHeal').addEventListener('click', () => {
  state.hp = clamp(state.hp + state.sessionHpDelta, 0, CHARACTER.hpMax);
  save(); renderTrackers();
});
$('#hpFull').addEventListener('click', () => {
  state.hp = CHARACTER.hpMax; save(); renderTrackers();
});

// Focus
$('#fpSpend').addEventListener('click', () => {
  state.fp = Math.max(0, state.fp - 1); save(); renderTrackers();
});
$('#fpInit').addEventListener('click', () => {
  if (state.metabolismUsed) {
    alert('Uncanny Metabolism already used this Long Rest.');
    return;
  }
  state.fp = 4;
  state.metabolismUsed = true;
  // roll martial arts die d6 + 4
  const roll = 1 + Math.floor(Math.random() * 6);
  const heal = roll + CHARACTER.level;
  state.hp = clamp(state.hp + heal, 0, CHARACTER.hpMax);
  save(); renderTrackers();
  alert(`Uncanny Metabolism: rolled a ${roll} on d6 → healed ${heal} HP and regained all Focus.`);
});

// Ring
$('#ringUse').addEventListener('click', () => {
  if (state.ring <= 0) { alert('No Ring uses remaining. Rest to reset.'); return; }
  state.ring -= 1;
  state.hp = clamp(state.hp - 7, 0, CHARACTER.hpMax);
  save(); renderTrackers();
});
$('#ringReset').addEventListener('click', () => {
  state.ring = 3; save(); renderTrackers();
});

// Rests
$('#shortRest').addEventListener('click', () => {
  state.fp = 4;
  save(); renderTrackers();
});
$('#longRest').addEventListener('click', () => {
  state.hp = CHARACTER.hpMax;
  state.fp = 4;
  state.ring = 3;
  state.metabolismUsed = false;
  save(); renderTrackers();
});

// Advantage picks lock toggle
const advLockBtnEl = $('#advLockBtn');
if (advLockBtnEl) advLockBtnEl.addEventListener('click', toggleAdvantageLock);

// Reset all
$('#resetAll').addEventListener('click', () => {
  if (!confirm('Reset HP, FP, Ring, budget, and notes to defaults? Advantage picks, date, and the tweaks list are kept.')) return;
  const keep = {
    theme: state.theme,
    tab: state.tab,
    advantagePicks: state.advantagePicks,
    date: state.date,
    tweaks: state.tweaks,
    kingdomFilter: state.kingdomFilter,
  };
  state = { ...DEFAULT_STATE(), ...keep };
  save();
  renderAll();
});

// Notes
$('#sessionNotes').value = state.notes || '';
$('#sessionNotes').addEventListener('input', e => {
  state.notes = e.target.value; save();
});

// ========================================================
//  TWEAKS
// ========================================================
function renderTweaks() {
  const list = Array.isArray(state.tweaks) ? state.tweaks : [];
  const pending = list.filter(t => !t.done);
  const done = list.filter(t => t.done);

  const pendUl = $('#tweakPendingList');
  const doneUl = $('#tweakDoneList');
  if (!pendUl || !doneUl) return;

  pendUl.innerHTML = '';
  doneUl.innerHTML = '';

  pending.forEach(t => pendUl.appendChild(tweakRow(t)));
  done.forEach(t => doneUl.appendChild(tweakRow(t)));

  $('#tweakPendingCount').textContent = pending.length;
  $('#tweakDoneCount').textContent = done.length;
  $('#tweakPendingEmpty').hidden = pending.length > 0;
  $('#tweakDoneEmpty').hidden = done.length > 0;
}

function tweakRow(t) {
  const li = el('li', { class: 'tweak-item' + (t.done ? ' done' : '') });

  const checkbox = el('button', {
    class: 'tweak-check',
    'aria-label': t.done ? 'Mark as not done' : 'Mark as done',
    title: t.done ? 'Mark as not done' : 'Mark as done',
    onclick: () => {
      t.done = !t.done;
      t.doneAt = t.done ? Date.now() : null;
      save(); renderTweaks();
    },
    html: t.done
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
      : ''
  });

  const textWrap = el('div', { class: 'tweak-text' });
  const textEl = el('div', { class: 'tweak-body', text: t.text });
  const meta = el('div', { class: 'tweak-meta small muted', text: formatTweakDate(t.createdAt) });
  textWrap.appendChild(textEl);
  textWrap.appendChild(meta);

  const actions = el('div', { class: 'tweak-actions' });
  actions.appendChild(el('button', {
    class: 'icon-btn small',
    'aria-label': 'Edit tweak',
    title: 'Edit',
    html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    onclick: () => {
      const next = prompt('Edit tweak:', t.text);
      if (next != null && next.trim()) { t.text = next.trim(); save(); renderTweaks(); }
    }
  }));
  actions.appendChild(el('button', {
    class: 'icon-btn small',
    'aria-label': 'Delete tweak',
    title: 'Delete',
    html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
    onclick: () => {
      if (confirm('Delete this tweak?')) {
        state.tweaks = state.tweaks.filter(x => x.id !== t.id);
        save(); renderTweaks();
      }
    }
  }));

  li.appendChild(checkbox);
  li.appendChild(textWrap);
  li.appendChild(actions);
  return li;
}

function formatTweakDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return 'today · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

$('#tweakAdd')?.addEventListener('click', () => {
  const input = $('#tweakInput');
  const text = (input.value || '').trim();
  if (!text) return;
  if (!Array.isArray(state.tweaks)) state.tweaks = [];
  state.tweaks.push({
    id: 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    text,
    done: false,
    createdAt: Date.now(),
  });
  input.value = '';
  save(); renderTweaks();
});

$('#tweakInput')?.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); $('#tweakAdd').click(); }
});

$('#tweakClearDone')?.addEventListener('click', () => {
  const done = (state.tweaks || []).filter(t => t.done);
  if (!done.length) return;
  if (confirm('Clear ' + done.length + ' completed tweak' + (done.length === 1 ? '' : 's') + '?')) {
    state.tweaks = (state.tweaks || []).filter(t => !t.done);
    save(); renderTweaks();
  }
});

// ========================================================
//  BUDGET
// ========================================================
const BUDGET_MAX = [500000, 500000, 500000];

function renderBudget() {
  // populate kingdom select (only once)
  const sel = $('#budgetKingdom');
  if (!sel.options.length) {
    KINGDOMS.forEach(k => sel.appendChild(el('option', { value: k.name, text: k.name })));
    sel.value = state.budgetKingdom;
    sel.addEventListener('change', () => {
      state.budgetKingdom = sel.value;
      save(); renderBudget();
    });
  } else {
    sel.value = state.budgetKingdom;
  }
  if (!state.budgetSpent[state.budgetKingdom]) {
    state.budgetSpent[state.budgetKingdom] = [0, 0, 0];
  }
  const spent = state.budgetSpent[state.budgetKingdom];
  const list = $('#budgetList');
  list.innerHTML = '';
  CHARACTER.currency.startingBudget.forEach((b, i) => {
    const remaining = BUDGET_MAX[i] - spent[i];
    const pct = Math.max(0, (remaining / BUDGET_MAX[i]) * 100);
    const row = el('div', { class: 'budget-row' });
    row.appendChild(el('div', {},
      el('div', { class: 'label', text: b.item }),
      el('span', { class: 'unit', text: b.amount + ' starting' })
    ));
    const stepper = el('div', { class: 'step-input' });
    stepper.appendChild(el('button', { onclick: () => spendBudget(i, +10000), 'aria-label': 'Spend 10k', title: 'Spend 10k', text: '−10k' }));
    stepper.appendChild(el('button', { onclick: () => spendBudget(i, +1000), 'aria-label': 'Spend 1k', title: 'Spend 1k', text: '−1k' }));
    stepper.appendChild(el('button', { onclick: () => spendBudget(i, -1000), 'aria-label': 'Refund 1k', title: 'Refund 1k', text: '+1k' }));
    stepper.appendChild(el('button', { onclick: () => spendBudget(i, -10000), 'aria-label': 'Refund 10k', title: 'Refund 10k', text: '+10k' }));
    row.appendChild(stepper);
    row.appendChild(el('div', { class: 'amount', text: formatK(remaining) }));
    row.appendChild(el('div', { class: 'budget-bar' }, el('span', { style: `width: ${pct}%` })));
    list.appendChild(row);
  });
}
function formatK(n) {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
  return String(n);
}
function spendBudget(i, amount) {
  // amount > 0 = spend (remaining goes down); amount < 0 = refund
  const arr = state.budgetSpent[state.budgetKingdom];
  arr[i] = clamp(arr[i] + amount, 0, BUDGET_MAX[i]);
  save(); renderBudget();
}
$('#budgetReset').addEventListener('click', () => {
  state.budgetSpent[state.budgetKingdom] = [0, 0, 0];
  save(); renderBudget();
});

// ========================================================
//  KINGDOMS + ADVANTAGE PICKER
// ========================================================
function renderKingdoms() {
  // Filters
  const allTags = new Set(['All']);
  KINGDOMS.forEach(k => k.tags.forEach(t => allTags.add(t)));
  const filterRow = $('#kingdomFilters');
  filterRow.innerHTML = '';
  allTags.forEach(tag => {
    filterRow.appendChild(el('button', {
      class: 'chip' + (state.kingdomFilter === tag ? ' active' : ''),
      onclick: () => { state.kingdomFilter = tag; save(); renderKingdoms(); },
      text: tag,
    }));
  });

  const grid = $('#kingdomGrid');
  grid.innerHTML = '';
  KINGDOMS.filter(k => state.kingdomFilter === 'All' || k.tags.includes(state.kingdomFilter))
    .forEach(k => grid.appendChild(kingdomCard(k)));

  const tGrid = $('#territoryGrid');
  tGrid.innerHTML = '';
  TERRITORIES.forEach(t => tGrid.appendChild(kingdomCard(t, true)));

  $('#advCount').textContent = state.advantagePicks.length;
  updateAdvantageLockUI();
}

function updateAdvantageLockUI() {
  const btn = $('#advLockBtn');
  if (!btn) return;
  const locked = state.advantageLocked !== false; // default true
  btn.textContent = locked ? '🔒 Locked' : '🔓 Lock picks';
  btn.classList.toggle('locked', locked);
  btn.setAttribute('aria-pressed', locked ? 'true' : 'false');
  // Gray out kingdom cards visually so it's obvious they're not interactive right now
  const grid = $('#kingdomGrid');
  if (grid) grid.classList.toggle('picks-locked', locked);
}

function toggleAdvantageLock() {
  const currentlyLocked = state.advantageLocked !== false;
  if (currentlyLocked) {
    // Unlocking — confirm
    if (!confirm("Unlock your advantage picks? You shouldn't normally be able to change these.")) return;
    state.advantageLocked = false;
  } else {
    state.advantageLocked = true;
  }
  save();
  updateAdvantageLockUI();
}
function kingdomCard(k, isTerritory = false) {
  const isAdvantage = state.advantagePicks.includes(k.name);
  const isHome = k.name === CHARACTER.base;
  const card = el('div', {
    class: 'kingdom-card' + (isAdvantage ? ' advantage' : '') + (isHome && !isTerritory ? ' home' : ''),
    role: 'button',
    tabindex: '0',
    onclick: () => toggleAdvantage(k.name, isTerritory),
    onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAdvantage(k.name, isTerritory); } }
  });
  if (isAdvantage && !isHome) {
    card.appendChild(el('div', { class: 'k-advantage-badge', text: '✦ Advantage' }));
  }
  card.appendChild(el('div', { class: 'k-name', text: k.name }));
  card.appendChild(el('div', { class: 'k-house', text: 'House ' + (k.house || '—') }));
  const meta = el('dl', { class: 'k-meta' });
  const dir = (window.KINGDOM_DIRECTIONS || {})[k.name];
  if (dir) {
    meta.appendChild(el('dt', { text: 'Region' })); meta.appendChild(el('dd', { class: 'k-dir', text: dir }));
  }
  meta.appendChild(el('dt', { text: 'Population' })); meta.appendChild(el('dd', { text: k.pop }));
  meta.appendChild(el('dt', { text: 'Capital' }));    meta.appendChild(el('dd', { text: k.capital }));
  if (k.capitalPop) {
    meta.appendChild(el('dt', { text: 'Cap. Pop' })); meta.appendChild(el('dd', { text: k.capitalPop }));
  }
  card.appendChild(meta);
  card.appendChild(el('div', { class: 'k-desc', text: k.desc }));
  if (k.tags && k.tags.length) {
    const tags = el('div', { class: 'k-tags' });
    k.tags.forEach(t => tags.appendChild(el('span', { class: 'k-tag', text: t })));
    card.appendChild(tags);
  }
  return card;
}
function toggleAdvantage(name, isTerritory) {
  if (isTerritory) return; // only the 13 Kingdoms
  if (state.advantageLocked !== false) return; // Locked — ignore taps
  const idx = state.advantagePicks.indexOf(name);
  if (idx >= 0) {
    state.advantagePicks.splice(idx, 1);
  } else {
    if (state.advantagePicks.length >= 6) {
      alert('You may only pick 6 Kingdoms for History/Culture advantage. Unselect one first.');
      return;
    }
    state.advantagePicks.push(name);
  }
  save(); renderKingdoms();
}

// ========================================================
//  HISTORY
// ========================================================
function renderHistory(filter = '') {
  const tl = $('#timeline');
  tl.innerHTML = '';
  const f = filter.toLowerCase().trim();
  HISTORY.forEach(h => {
    const match = !f || [h.year, h.title, h.body, ...(h.tags || [])].join(' ').toLowerCase().includes(f);
    const isNow = (h.tags || []).includes('Now');
    const ev = el('div', { class: 'event' + (isNow ? ' now' : '') + (match ? '' : ' hidden') });
    ev.appendChild(el('div', { class: 'year', text: h.year }));
    const body = el('div', { class: 'body' });
    body.appendChild(el('div', { class: 'title', text: h.title }));
    body.appendChild(el('div', { class: 'text', text: h.body }));
    if (h.tags && h.tags.length) {
      const tags = el('div', { class: 'tags' });
      h.tags.forEach(t => {
        const cls = 'e-tag ' +
          (t === 'Now' || t === 'Campaign' ? 'now' :
           t === 'War' || t === 'Terror' ? 'war' :
           t === 'Magic' || t === 'Blood Magic' || t === 'Blood Knights' ? 'magic' : '');
        tags.appendChild(el('span', { class: cls, text: t }));
      });
      body.appendChild(tags);
    }
    ev.appendChild(body);
    tl.appendChild(ev);
  });
}
$('#historyFilter').addEventListener('input', e => renderHistory(e.target.value));

// ========================================================
//  CALENDAR
// ========================================================
function renderCalendar() {
  const wheel = $('#monthWheel');
  wheel.innerHTML = '';
  CALENDAR.forEach((m, i) => {
    const node = el('button', {
      class: 'month' + (i === state.date.monthIdx ? ' current' : ''),
      onclick: () => { state.date.monthIdx = i; state.date.day = Math.min(state.date.day, m.days); save(); renderCalendar(); },
    });
    node.appendChild(el('div', { class: 'm-name', text: m.name }));
    node.appendChild(el('div', { class: 'm-days', text: m.days + ' days' }));
    if (m.marker) node.appendChild(el('div', { class: 'm-marker', text: m.marker }));
    wheel.appendChild(node);
  });

  const current = CALENDAR[state.date.monthIdx];
  $('#daysMonthName').textContent = current.namennerHTML = '';
  for (let d = 1; d <= current.days; d++) {
    dayGrid.appendChild(el('button', {
      class: 'day' + (d === state.date.day ? ' current' : ''),
      onclick: () => { state.date.day = d; save(); renderCalendar(); },
      text: d
    }));
  }

  $('#currentDate').textContent = `${state.date.day} ${current.name}, ${state.date.year} SE`;
  // Seasons derived from markers
  const season = computeSeason(state.date.monthIdx);
  $('#currentSeason').textContent = season;
  $('#currentYear').value = state.date.year;
}
function computeSeason(monthIdx) {
  // Indices: 1 Ferdax (Harvest), 4 Zintar (Freeze), 7 Deltan (Thaw), 10 Ordecan (Sunmer)
  if (monthIdx >= 1 && monthIdx <= 3) return 'Harvest Season';
  if (monthIdx >= 4 && monthIdx <= 6) return 'The Freeze';
  if (monthIdx >= 7 && monthIdx <= 9) return 'The Thaw';
  if (monthIdx >= 10 && monthIdx <= 12) return 'The Sunmer';
  return 'Year-Turn'; // Primar straddles; mark as transition
}
$('#dateBack').addEventListener('click', () => shiftDay(-1));
$('#dateFwd').addEventListener('click', () => shiftDay(+1));
function shiftDay(delta) {
  let m = state.date.monthIdx, d = state.date.day + delta, y = state.date.year;
  while (d < 1) {
    m -= 1;
    if (m < 0) { m = CALENDAR.length - 1; y -= 1; }
    d += CALENDAR[m].days;
  }
  while (d > CALENDAR[m].days) {
    d -= CALENDAR[m].days;
    m += 1;
    if (m >= CALENDAR.length) { m = 0; y += 1; }
  }
  state.date = { monthIdx: m, day: d, year: y };
  save(); renderCalendar();
}
$('#currentYear').addEventListener('change', e => {
  const y = parseInt(e.target.value);
  if (!isNaN(y)) { state.date.year = y; save(); renderCalendar(); }
});

// ========================================================
//  CONNECTIONS + EMPLOYEES (editable, state-backed)
// ========================================================
let _connEditId = null;

// Seed state.connections from the hard-coded CONNECTIONS array on first run.
// Once seeded, state is the source of truth so edits persist + sync.
function ensureConnectionsSeeded() {
  if (!Array.isArray(state.connections)) state.connections = [];
  if (state.connections.length === 0 && Array.isArray(CONNECTIONS)) {
    state.connections = CONNECTIONS.map((c, i) => ({
      id: 'c_seed_' + i + '_' + Math.random().toString(36).slice(2, 7),
      name: c.name || '',
      role: c.role || '',
      notes: c.notes || '',
      tags: Array.isArray(c.tags) ? c.tags.slice() : [],
      // Derive section from the legacy tag so existing entries land in the right grid
      section: (c.tags || []).includes('Employee') ? 'Employee' : 'Connection',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    save();
  }
}

function renderConnections(filter = '') {
  ensureConnectionsSeeded();
  const f = filter.toLowerCase().trim();
  const connGrid = $('#connGrid'); if (connGrid) connGrid.innerHTML = '';
  const empGrid = $('#empGrid'); if (empGrid) empGrid.innerHTML = '';

  const list = (state.connections || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Dynamic tag filter chips (skip the Connection/Employee section tags — those are the grid split)
  const filterRow = $('#connFilters');
  if (filterRow) {
    const allTags = new Set(['All']);
    list.forEach(c => (c.tags || []).forEach(t => {
      if (t && t !== 'Connection' && t !== 'Employee') allTags.add(t);
    }));
    if (!state.connTagFilter || !allTags.has(state.connTagFilter)) state.connTagFilter = 'All';
    filterRow.innerHTML = '';
    if (allTags.size > 1) {
      [...allTags].forEach(tag => {
        filterRow.appendChild(el('button', {
          class: 'chip' + (state.connTagFilter === tag ? ' active' : ''),
          onclick: () => { state.connTagFilter = tag; save(); renderConnections($('#connFilter').value); },
          text: tag,
        }));
      });
    }
  }
  const activeTag = state.connTagFilter || 'All';

  list.forEach(c => {
    const matchText = !f || [c.name, c.role, c.notes, ...(c.tags || [])].join(' ').toLowerCase().includes(f);
    const matchTag = activeTag === 'All' || (c.tags || []).includes(activeTag);
    if (!matchText || !matchTag) return;
    const card = el('div', { class: 'conn-card', role: 'button', tabindex: '0',
      onclick: () => openConnDialog(c.id),
      onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openConnDialog(c.id); } },
    });
    if (c.name) card.appendChild(el('div', { class: 'c-name', text: c.name }));
    if (c.role) card.appendChild(el('div', { class: 'c-role', text: c.role }));
    if (c.notes) card.appendChild(el('div', { class: 'c-notes', text: c.notes }));
    const displayTags = (c.tags || []).filter(t => t !== 'Connection' && t !== 'Employee');
    if (displayTags.length) {
      const tags = el('div', { class: 'k-tags' });
      displayTags.forEach(t => tags.appendChild(el('span', { class: 'k-tag', text: t })));
      card.appendChild(tags);
    }
    const section = c.section || ((c.tags || []).includes('Employee') ? 'Employee' : 'Connection');
    if (section === 'Employee' && empGrid) empGrid.appendChild(card);
    else if (connGrid) connGrid.appendChild(card);
  });
}

function openConnDialog(id) {
  _connEditId = id || null;
  const overlay = $('#connOverlay'); if (!overlay) return;
  const existing = id ? (state.connections || []).find(c => c.id === id) : null;
  $('#connDialogTitle').textContent = existing ? 'Edit — ' + (existing.name || '(unnamed)') : 'Add connection / employee';
  $('#connName').value = existing ? (existing.name || '') : '';
  $('#connRole').value = existing ? (existing.role || '') : '';
  $('#connSection').value = existing ? (existing.section || 'Connection') : 'Connection';
  $('#connTags').value = existing && existing.tags
    ? existing.tags.filter(t => t !== 'Connection' && t !== 'Employee').join(', ')
    : '';
  $('#connNotes').value = existing ? (existing.notes || '') : '';
  $('#connDelete').hidden = !existing;
  overlay.hidden = false;
  setTimeout(() => $('#connName').focus(), 50);
}

function closeConnDialog() {
  const overlay = $('#connOverlay'); if (overlay) overlay.hidden = true;
  _connEditId = null;
}

function saveConnFromDialog() {
  if (!Array.isArray(state.connections)) state.connections = [];
  const name = $('#connName').value.trim();
  if (!name) { alert('Name required.'); return; }
  const role = $('#connRole').value.trim();
  const section = $('#connSection').value || 'Connection';
  const tags = $('#connTags').value.split(',').map(s => s.trim()).filter(Boolean);
  const notes = $('#connNotes').value.trim();
  if (_connEditId) {
    const c = state.connections.find(x => x.id === _connEditId);
    if (c) {
      c.name = name; c.role = role; c.section = section; c.tags = tags; c.notes = notes;
      c.updatedAt = Date.now();
    }
  } else {
    state.connections.push({
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name, role, section, tags, notes,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
  }
  save();
  closeConnDialog();
  renderConnections($('#connFilter').value);
}

function deleteConnFromDialog() {
  if (!_connEditId) return;
  if (!confirm('Delete this entry?')) return;
  state.connections = (state.connections || []).filter(c => c.id !== _connEditId);
  save();
  closeConnDialog();
  renderConnections($('#connFilter').value);
}

$('#connFilter').addEventListener('input', e => renderConnections(e.target.value));
$('#connAdd').addEventListener('click', () => openConnDialog(null));
$('#connClose').addEventListener('click', closeConnDialog);
$('#connSave').addEventListener('click', saveConnFromDialog);
$('#connDelete').addEventListener('click', deleteConnFromDialog);
$('#connOverlay').addEventListener('click', e => { if (e.target.id === 'connOverlay') closeConnDialog(); });

// ========================================================
//  GLOBAL SEARCH
// ========================================================
function normalizeSearchText(value) {
  return String(value || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function fuzzyScore(query, haystack) {
  const q = normalizeSearchText(query);
  const h = normalizeSearchText(haystack);
  if (!q || !h) return 0;
  if (h.includes(q)) {
    // Strong score for exact substring, with slight reward for earlier matches.
    return 600 - Math.min(h.indexOf(q), 200);
  }
  // Token contains score (good for partial words / small typos)
  const qTokens = q.split(' ').filter(Boolean);
  const hTokens = h.split(' ').filter(Boolean);
  let tokenHits = 0;
  qTokens.forEach(t => {
    if (hTokens.some(ht => ht.includes(t) || levenshtein(t, ht) <= 1)) tokenHits += 1;
  });
  // Subsequence score (for rough fuzzy typing).
  let qi = 0;
  let chain = 0;
  let maxChain = 0;
  for (let i = 0; i < h.length && qi < q.length; i++) {
    if (h[i] === q[qi]) { qi += 1; chain += 1; maxChain = Math.max(maxChain, chain); }
    else chain = 0;
  }
  const subseq = qi / q.length;
  if (subseq < 0.72 && tokenHits === 0) return 0;
  return Math.round(tokenHits * 120 + subseq * 180 + maxChain * 3);
}
function levenshtein(a, b) {
  if (a === b) return 0;
  const al = a.length, bl = b.length;
  if (!al) return bl;
  if (!bl) return al;
  const prev = Array(bl + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= al; i++) {
    let diag = i - 1;
    prev[0] = i;
    for (let j = 1; j <= bl; j++) {
      const old = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + cost);
      diag = old;
    }
  }
  return prev[bl];
}
function jumpToTab(tab, opts = {}) {
  if (opts.historyTitle) _historyHighlight = opts.historyTitle;
  activateTab(tab);
  if (tab === 'history') renderHistory($('#historyFilter').value);
}
function searchCorpus() {
  const corpus = [];
  KINGDOMS.concat(TERRITORIES).forEach(k => {
    corpus.push({
      kind: 'Kingdom',
      title: k.name,
      snippet: `${k.capital || '—'} · House ${k.house || '—'}`,
      text: [k.name, k.house, k.capital, k.desc, ...(k.tags || [])].filter(Boolean).join(' '),
      run: () => jumpToTab('kingdoms'),
    });
  });
  HISTORY.forEach(h => {
    corpus.push({
      kind: h.year,
      title: h.title,
      snippet: (h.body || '').slice(0, 100) + '…',
      text: [h.year, h.title, h.body, ...(h.tags || [])].filter(Boolean).join(' '),
      run: () => jumpToTab('history', { historyTitle: h.title }),
    });
  });
  const connSource = (Array.isArray(state.connections) && state.connections.length)
    ? state.connections
    : (Array.isArray(CONNECTIONS) ? CONNECTIONS : []);
  connSource.forEach(c => {
    corpus.push({
      kind: 'Contact',
      title: c.name || 'Unnamed',
      snippet: c.role || 'Connection',
      text: [c.name, c.role, c.notes, ...(c.tags || [])].filter(Boolean).join(' '),
      run: () => jumpToTab('connections'),
    });
  });
  CHARACTER.traits.forEach(t => {
    corpus.push({
      kind: 'Trait',
      title: t.name,
      snippet: (t.text || '').slice(0, 100) + '…',
      text: [t.name, t.text].join(' '),
      run: () => jumpToTab('character'),
    });
  });
  return corpus;
}
function getSearchHits(query, limit = 30) {
  const q = query.trim();
  if (!q) return [];
  return searchCorpus()
    .map(item => ({ ...item, _score: fuzzyScore(q, `${item.title} ${item.text}`) }))
    .filter(item => item._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}
function renderSearchResults(listEl, hits, emptyText, onPick) {
  listEl.innerHTML = '';
  if (!hits.length) {
    listEl.appendChild(el('div', { class: 'search-result', text: emptyText || 'No results.' }));
    return;
  }
  hits.forEach((h, idx) => {
    listEl.appendChild(el('button', {
      class: 'search-result',
      role: 'option',
      'aria-selected': idx === 0 ? 'true' : 'false',
      onclick: () => onPick(h),
    },
      el('div', { class: 'r-kind', text: h.kind }),
      el('div', { class: 'r-title', text: h.title }),
      el('div', { class: 'r-snippet', text: h.snippet })
    ));
  });
}
function globalSearch(query) {
  const results = $('#searchResults');
  const hits = getSearchHits(query, 30);
  if (!query.trim()) { results.classList.remove('open'); results.innerHTML = ''; return; }
  renderSearchResults(results, hits, 'No results.', hit => {
    hit.run();
    $('#globalSearch').value = '';
    results.classList.remove('open');
  });
  results.classList.add('open');
}
$('#globalSearch').addEventListener('input', e => globalSearch(e.target.value));
$('#globalSearch').addEventListener('focus', e => { if (e.target.value) globalSearch(e.target.value); });
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) $('#searchResults').classList.remove('open');
});

// ========================================================
//  COMMAND PALETTE (Cmd/Ctrl+K)
// ========================================================
const CMD_ACTIONS = [
  { kind: 'Go to', title: 'Character', snippet: 'Open Character tab', text: 'character sheet stats traits', run: () => jumpToTab('character') },
  { kind: 'Go to', title: 'Playbook', snippet: 'Open Playbook tab', text: 'playbook turn coach glossary', run: () => jumpToTab('playbook') },
  { kind: 'Go to', title: 'Play Trackers', snippet: 'Open Trackers tab', text: 'trackers hp fp ring notes', run: () => jumpToTab('trackers') },
  { kind: 'Go to', title: '13 Kingdoms', snippet: 'Open Kingdoms tab', text: 'kingdoms territories houses map realm', run: () => jumpToTab('kingdoms') },
  { kind: 'Go to', title: 'History', snippet: 'Open History timeline', text: 'history timeline events eras wars', run: () => jumpToTab('history') },
  { kind: 'Go to', title: 'Calendar', snippet: 'Open Calendar tab', text: 'calendar date campaign events', run: () => jumpToTab('calendar') },
  { kind: 'Go to', title: 'People', snippet: 'Open Party & Connections tab', text: 'people party npcs connections', run: () => jumpToTab('people') },
  { kind: 'Go to', title: 'Map', snippet: 'Open map tab', text: 'map zoom pan travel', run: () => jumpToTab('map') },
  { kind: 'Go to', title: 'Tweaks', snippet: 'Open Tweaks tab', text: 'tweaks backlog todo', run: () => jumpToTab('tweaks') },
  { kind: 'Action', title: 'Add Calendar Event', snippet: 'Jump to Calendar and focus new event input', text: 'new event add event calendar log', run: () => { jumpToTab('calendar'); setTimeout(() => $('#eventInput')?.focus(), 80); } },
  { kind: 'Action', title: 'Add Party / NPC', snippet: 'Jump to People and open Add Party dialog', text: 'add party npc person people', run: () => { jumpToTab('people'); activateSubTab('party'); setTimeout(() => openPartyDialog(null), 80); } },
  { kind: 'Action', title: 'Add Connection', snippet: 'Jump to People and open Add Connection dialog', text: 'add connection contact employee', run: () => { jumpToTab('people'); activateSubTab('connections'); setTimeout(() => openConnDialog(null), 80); } },
  { kind: 'Action', title: 'Open Cloud Sync', snippet: 'Open cloud sync dialog', text: 'sync cloud backup firebase', run: () => { $('#syncOverlay').hidden = false; updateSyncUI(); setSyncMsg(''); } },
  { kind: 'Action', title: 'Download Backup', snippet: 'Export current state as JSON', text: 'download backup export json save', run: () => downloadBackup() },
];
let _cmdIndex = 0;
let _cmdHits = [];
function closeCommandPalette() {
  $('#cmdOverlay').hidden = true;
  _cmdHits = [];
  _cmdIndex = 0;
}
function openCommandPalette() {
  $('#cmdOverlay').hidden = false;
  const input = $('#cmdInput');
  input.value = '';
  renderCommandPalette('');
  setTimeout(() => input.focus(), 20);
}
function commandHits(query) {
  const combined = [...CMD_ACTIONS, ...getSearchHits(query, 16)];
  if (!query.trim()) return CMD_ACTIONS.slice(0, 10);
  return combined
    .map(item => ({ ...item, _score: fuzzyScore(query, `${item.title} ${item.snippet || ''} ${item.text || ''}`) }))
    .filter(item => item._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 20);
}
function updateCmdActiveVisual() {
  $$('#cmdResults .search-result').forEach((row, idx) => {
    row.classList.toggle('is-active', idx === _cmdIndex);
    row.setAttribute('aria-selected', idx === _cmdIndex ? 'true' : 'false');
  });
}
function renderCommandPalette(query) {
  _cmdHits = commandHits(query);
  _cmdIndex = 0;
  renderSearchResults($('#cmdResults'), _cmdHits, 'No commands or matches.', hit => {
    closeCommandPalette();
    hit.run?.();
  });
  updateCmdActiveVisual();
}
$('#cmdInput')?.addEventListener('input', e => renderCommandPalette(e.target.value));
$('#cmdClose')?.addEventListener('click', closeCommandPalette);
$('#cmdOverlay')?.addEventListener('click', e => { if (e.target.id === 'cmdOverlay') closeCommandPalette(); });
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if ($('#cmdOverlay').hidden) openCommandPalette();
    else closeCommandPalette();
    return;
  }
  if ($('#cmdOverlay').hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); closeCommandPalette(); return; }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!_cmdHits.length) return;
    _cmdIndex = (_cmdIndex + 1) % _cmdHits.length;
    updateCmdActiveVisual();
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (!_cmdHits.length) return;
    _cmdIndex = (_cmdIndex - 1 + _cmdHits.length) % _cmdHits.length;
    updateCmdActiveVisual();
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    const hit = _cmdHits[_cmdIndex];
    if (!hit) return;
    closeCommandPalette();
    hit.run?.();
  }
});

// ========================================================
//  MAP zoom/pan
// ========================================================
(function mapSetup() {
  const frame = $('#mapFrame');
  const img = $('#mapImg');
  let zoom = 1, panX = 0, panY = 0;
  let baseZoom = 1;
  let isDown = false, startX = 0, startY = 0, origX = 0, origY = 0;

  function apply() {
    img.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`;
  }
  function fit() {
    const fr = frame.getBoundingClientRect();
    const iw = img.naturalWidth || 2048;
    const ih = img.naturalHeight || 1536;
    baseZoom = Math.min(fr.width / iw, fr.height / ih);
    zoom = baseZoom;
    panX = 0; panY = 0;
    apply();
  }
  window._fitMap = fit;
  if (img.complete && img.naturalWidth) fit();
  else img.addEventListener('load', fit);
  window.addEventListener('resize', fit);

  frame.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    zoom = clamp(zoom * factor, baseZoom * 0.5, baseZoom * 10);
    apply();
  }, { passive: false });

  img.addEventListener('mousedown', e => {
    isDown = true; startX = e.clientX; startY = e.clientY;
    origX = panX; origY = panY;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!isDown) return;
    panX = origX + (e.clientX - startX);
    panY = origY + (e.clientY - startY);
    apply();
  });
  document.addEventListener('mouseup', () => { isDown = false; });

  // Touch
  let touchStart = null;
  img.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX, panY };
    }
  }, { passive: true });
  img.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && touchStart) {
      panX = touchStart.panX + (e.touches[0].clientX - touchStart.x);
      panY = touchStart.panY + (e.touches[0].clientY - touchStart.y);
      apply();
    }
  }, { passive: true });

  $('#mapZoomIn').addEventListener('click', () => { zoom = clamp(zoom * 1.25, baseZoom * 0.5, baseZoom * 10); apply(); });
  $('#mapZoomOut').addEventListener('click', () => { zoom = clamp(zoom * 0.8, baseZoom * 0.5, baseZoom * 10); apply(); });
  $('#mapReset').addEventListener('click', () => { fit(); });
})();

// ========================================================
//  PLAYBOOK
// ========================================================
function renderPlaybook() {
  const pb = window.PLAYBOOK;
  if (!pb) return;

  const intro = $('#pbTurnIntro'); intro.innerHTML = ''; intro.appendChild(linkTerms(pb.turnCoach.intro));

  const actList = $('#pbActions');
  const bonusList = $('#pbBonus');
  actList.innerHTML = '';
  bonusList.innerHTML = '';

  const actionsOnly = pb.turnCoach.actions.filter(a => a.slot !== 'Bonus Action');
  const bonusOnly = pb.turnCoach.actions.filter(a => a.slot === 'Bonus Action');

  actionsOnly.forEach(a => actList.appendChild(renderTurnCard(a)));
  bonusOnly.forEach(a => bonusList.appendChild(renderTurnCard(a)));

  // Reactions
  const reactList = $('#pbReactions');
  reactList.innerHTML = '';
  pb.turnCoach.reactions.forEach(r => reactList.appendChild(renderTurnCard(r, true)));

  // Movement: build the same kind of dense card list using movement-related options
  renderMovementSection(pb);

  // Situations
  const sitGrid = $('#sitGrid');
  sitGrid.innerHTML = '';
  pb.situations.forEach(s => {
    const card = el('details', { class: 'sit-card' });
    const sum = el('summary', {},
      el('span', { class: 's-emoji', text: s.emoji }),
      el('span', { class: 's-label', text: s.label })
    );
    card.appendChild(sum);
    if (s.headline) {
      const hl = el('div', { class: 's-headline' });
      hl.appendChild(linkTerms(s.headline));
      card.appendChild(hl);
    }
    const plays = el('ol', { class: 's-plays' });
    s.plays.forEach(p => {
      const li = el('li');
      li.appendChild(linkTerms(p));
      plays.appendChild(li);
    });
    card.appendChild(plays);
    sitGrid.appendChild(card);
  });

  renderGlossary();
}

// Dense flat card — name + cost on one row, TL;DR on next line, What/When/Tip inline underneath.
function renderTurnCard(a, isReaction = false) {
  const slotKey = isReaction ? 'Reaction' : (a.slot || 'Action');
  const card = el('article', {
    class: 'turn-card' + (a.source === 'universal' ? ' is-universal' : ' is-yours'),
    'data-card-name': a.name,
    'data-slot': slotKey,
    'data-source': a.source || 'yours',
  });

  // Header row: name + cost
  const head = el('div', { class: 't-head' });
  const titleSpan = el('span', { class: 't-name', text: a.name });
  const titleKey = ALIAS_MAP.get(a.name.toLowerCase())
    || (Object.prototype.hasOwnProperty.call(PLAYBOOK.abilityDetails || {}, a.name) ? a.name : null);
  if (titleKey) makeExplainable(titleSpan, titleKey);
  head.appendChild(titleSpan);
  if (a.cost) head.appendChild(el('span', { class: 't-cost', text: a.cost }));
  card.appendChild(head);

  // TL;DR line (primary info)
  if (a.tldr) {
    const tldr = el('div', { class: 't-tldr' });
    tldr.appendChild(linkTerms(a.tldr));
    card.appendChild(tldr);
  }

  // Inline mechanics — all visible, no toggle
  const withLinks = (cls, labelText, str) => {
    const wrap = el('span', { class: 't-text' });
    wrap.appendChild(linkTerms(str));
    return el('div', { class: cls }, el('span', { class: 't-l', text: labelText }), wrap);
  };
  if (a.what) card.appendChild(withLinks('t-what', 'What', a.what));
  if (a.max)  card.appendChild(withLinks('t-max',  'Max',  a.max));

  return card;
}

// Movement section: speed + stand-up + vertical-climb rules, then cross-referenced movement-related cards.
function renderMovementSection(pb) {
  const list = $('#pbMovement');
  if (!list) return;
  list.innerHTML = '';

  // Stat line — always-visible summary of movement rules
  const facts = el('div', { class: 't-facts' });
  facts.appendChild(linkTerms(pb.turnCoach.movementNote));
  list.appendChild(facts);

  // Cross-reference cards: Dash, Disengage (universal), Step of the Wind (bonus)
  const actions = pb.turnCoach.actions;
  const byName = new Map(actions.map(a => [a.name, a]));
  const refs = ['Dash', 'Disengage', 'Step of the Wind'];
  refs.forEach(name => {
    const src = byName.get(name);
    if (!src) return;
    const xref = Object.assign({}, src);
    // Tag with parent slot so user knows where to spend it (Action vs Bonus Action)
    const slotTag = el('span', { class: 'mv-slot-tag', text: (src.slot || 'Action').toUpperCase() });
    const card = renderTurnCard(xref);
    const head = card.querySelector('.t-head');
    if (head) head.insertBefore(slotTag, head.firstChild.nextSibling);
    list.appendChild(card);
  });

  // Monk bonus-strike note (kept as dense rule box)
  const monkBox = el('div', { class: 't-rule-box' });
  const label = el('div', { class: 't-rule-label', text: 'MONK RULE' });
  const body = el('div', { class: 't-rule-body' });
  body.appendChild(linkTerms(pb.turnCoach.bonusActionNote));
  monkBox.appendChild(label);
  monkBox.appendChild(body);
  list.appendChild(monkBox);
}

function renderGlossary() {
  const filter = ($('#glossFilter').value || '').toLowerCase().trim();
  const active = document.querySelector('.gloss-tabs .chip.active');
  const dom = active ? active.dataset.gloss : 'all';
  const list = $('#glossList');
  list.innerHTML = '';
  const entries = PLAYBOOK.glossary
    .filter(g => dom === 'all' || g.domain.includes(dom))
    .filter(g => !filter || (g.term + ' ' + g.def).toLowerCase().includes(filter))
    .sort((a, b) => a.term.localeCompare(b.term));
  if (!entries.length) {
    list.appendChild(el('p', { class: 'muted', text: 'No matching terms.' }));
    return;
  }
  entries.forEach(g => {
    const item = el('div', { class: 'gloss-item' });
    const head = el('div', { class: 'g-head' });
    head.appendChild(el('span', { class: 'g-term', text: g.term }));
    head.appendChild(el('span', { class: 'g-dom ' + (g.domain.includes('Iosandros') ? 'io' : 'dnd'), text: g.domain }));
    item.appendChild(head);
    item.appendChild(el('p', { class: 'g-def', text: g.def }));
    list.appendChild(item);
  });
}

// Playbook subtabs
$$('.pb-subtab').forEach(btn => {
  btn.addEventListener('click', () => {
    const sub = btn.dataset.sub;
    $$('.pb-subtab').forEach(b => {
      const is = b === btn;
      b.classList.toggle('active', is);
      b.setAttribute('aria-selected', is);
    });
    $$('.pb-panel').forEach(p => p.classList.toggle('active', p.id === `pb-${sub}`));
  });
});

// Glossary filter / tabs
$('#glossFilter').addEventListener('input', renderGlossary);
$$('.gloss-tabs .chip').forEach(c => {
  c.addEventListener('click', () => {
    $$('.gloss-tabs .chip').forEach(x => x.classList.toggle('active', x === c));
    renderGlossary();
  });
});

// ========================================================
//  CLOUD SYNC (Firebase Firestore)
// ========================================================
// Uses Firestore to store { state, version, updatedAt } at a single document
// keyed by a short "caeto-xxxxxx" code. Config is provided by the user at
// runtime and saved to localStorage; the Firebase SDK is lazy-loaded.
//
// Security model: Firestore rules should allow read/write on collection
// "iosandros_sync" with no auth for simplicity. Codes are hard-to-guess
// (6 lowercase chars). The user is the only one with their code.

const FIREBASE_CONFIG_KEY = 'iosandros-firebase-config-v1';
const FIREBASE_SDK_VERSION = '10.14.1';
const SYNC_COLLECTION = 'iosandros_sync';

let firebaseConfig = loadFirebaseConfig();
let fbApp = null, fbDb = null;
let fbOps = null; // { doc, getDoc, setDoc, onSnapshot }
let syncPushTimer = null;
let syncPushInFlight = false;
let pendingPush = false;
let liveUnsub = null;
let applyingRemote = false;

function loadFirebaseConfig() {
  try {
    const raw = _store.get(FIREBASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveFirebaseConfig(cfg) {
  try { _store.set(FIREBASE_CONFIG_KEY, JSON.stringify(cfg)); } catch {}
  firebaseConfig = cfg;
}
function clearFirebaseConfig() {
  try { _store.set(FIREBASE_CONFIG_KEY, ''); } catch {}
  firebaseConfig = null;
}

async function ensureFirebase() {
  if (!firebaseConfig) throw new Error('no-config');
  if (fbDb && fbOps) return;
  // Lazy-load the modular SDK from gstatic CDN.
  const [{ initializeApp, getApp, getApps }, firestore] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`),
  ]);
  fbApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  fbDb = firestore.getFirestore(fbApp);
  fbOps = {
    doc: firestore.doc,
    getDoc: firestore.getDoc,
    setDoc: firestore.setDoc,
    onSnapshot: firestore.onSnapshot,
    serverTimestamp: firestore.serverTimestamp,
  };
}

function syncConfigPanelUpdate() {
  const hasCfg = !!firebaseConfig;
  const missing = $('#syncConfigMissing');
  const ready = $('#syncConfigReady');
  if (missing) missing.hidden = hasCfg;
  if (ready) ready.hidden = !hasCfg;
}

function setSyncStatus(kind, label) {
  // kind: 'off' | 'ok' | 'saving' | 'error'
  const dot = $('#syncDot');
  const lbl = $('#syncStatusLabel');
  if (dot) {
    dot.classList.toggle('on', kind === 'ok');
    dot.classList.toggle('saving', kind === 'saving');
    dot.classList.toggle('error', kind === 'error');
  }
  if (lbl) {
    lbl.textContent = label || (kind === 'ok' ? 'Saved' : kind === 'saving' ? 'Saving…' : kind === 'error' ? 'Offline' : 'Local');
    lbl.classList.remove('ok', 'saving', 'error');
    if (kind === 'ok') lbl.classList.add('ok');
    else if (kind === 'saving') lbl.classList.add('saving');
    else if (kind === 'error') lbl.classList.add('error');
  }
}
function updateSyncUI() {
  const active = !!syncMeta.code;
  $('#syncActiveSection').hidden = !active;
  $('#syncInactiveSection').hidden = active;
  if (!active) setSyncStatus('off', 'Local');
  else setSyncStatus('ok', 'Saved');
  if (active) {
    $('#syncStatusText').textContent = `Syncing — code ${syncMeta.code}`;
    $('#syncCodeBox').textContent = syncMeta.code;
    if (syncMeta.lastPush) {
      $('#syncLastUpdate').textContent = `Last saved ${timeAgo(syncMeta.lastPush)}.`;
    } else {
      $('#syncLastUpdate').textContent = '';
    }
  } else {
    $('#syncStatusText').textContent = firebaseConfig
      ? 'Local only (cloud sync not enabled on this device)'
      : 'Local only (no Firebase connected yet)';
  }
  syncConfigPanelUpdate();
}
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function setSyncMsg(t, kind) {
  const el = $('#syncMsg');
  el.textContent = t || '';
  el.className = 'muted small sync-msg ' + (kind || '');
}

function newSyncCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // no confusable chars
  let out = 'caeto-';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function syncEnable() {
  if (!firebaseConfig) { setSyncMsg('Connect a Firebase project first.', 'err'); syncConfigPanelUpdate(); return; }
  setSyncMsg('Creating sync code…');
  try {
    await ensureFirebase();
    const code = newSyncCode();
    const ref = fbOps.doc(fbDb, SYNC_COLLECTION, code);
    const version = 1;
    await fbOps.setDoc(ref, { state, version, updatedAt: fbOps.serverTimestamp() });
    syncMeta = { code, version, lastPush: Date.now() };
    saveSyncMeta();
    setSyncMsg(`Sync enabled. Your code: ${code}`, 'ok');
    updateSyncUI();
    startSyncLive();
  } catch (e) {
    console.error(e);
    setSyncMsg('Could not enable sync. Check your Firebase config and Firestore rules.', 'err');
  }
}

async function syncJoin(code) {
  if (!firebaseConfig) { setSyncMsg('Connect a Firebase project first.', 'err'); syncConfigPanelUpdate(); return; }
  code = (code || '').trim().toLowerCase();
  if (!code) { setSyncMsg('Enter a sync code.', 'err'); return; }
  setSyncMsg('Loading state from code…');
  try {
    await ensureFirebase();
    const ref = fbOps.doc(fbDb, SYNC_COLLECTION, code);
    const snap = await fbOps.getDoc(ref);
    if (!snap.exists()) { setSyncMsg('Code not found in this Firebase project.', 'err'); return; }
    const data = snap.data();
    const incoming = data.state || {};
    state = { ...DEFAULT_STATE(), ...incoming };
    try { _store.set(STORAGE_KEY, JSON.stringify(state)); } catch {}
    syncMeta = { code, version: data.version || 1, lastPush: Date.now() };
    saveSyncMeta();
    setSyncMsg(`Joined sync code ${code}. State loaded.`, 'ok');
    renderAll();
    updateSyncUI();
    startSyncLive();
  } catch (e) {
    console.error(e);
    setSyncMsg('Could not reach Firebase. Check config and network.', 'err');
  }
}

function syncDisconnect() {
  stopSyncLive();
  syncMeta = { code: null, version: 0 };
  saveSyncMeta();
  setSyncMsg('This device is no longer syncing. Local state is kept.', 'ok');
  updateSyncUI();
}

function scheduleSyncPush() {
  if (!syncMeta.code || !firebaseConfig) return;
  if (applyingRemote) return;
  if (syncPushTimer) clearTimeout(syncPushTimer);
  syncPushTimer = setTimeout(pushSync, 800);
}
async function pushSync() {
  if (!syncMeta.code || !firebaseConfig) return;
  if (syncPushInFlight) { pendingPush = true; return; }
  syncPushInFlight = true;
  setSyncStatus('saving', 'Saving…');
  try {
    await ensureFirebase();
    const ref = fbOps.doc(fbDb, SYNC_COLLECTION, syncMeta.code);
    const nextVersion = (syncMeta.version || 0) + 1;
    await fbOps.setDoc(ref, { state, version: nextVersion, updatedAt: fbOps.serverTimestamp() });
    syncMeta.version = nextVersion;
    syncMeta.lastPush = Date.now();
    saveSyncMeta();
    setSyncStatus('ok', 'Saved');
    if ($('#syncOverlay') && !$('#syncOverlay').hidden) updateSyncUI();
  } catch (e) {
    // Offline / bad config — will retry on next save().
    setSyncStatus('error', 'Offline');
  } finally {
    syncPushInFlight = false;
    if (pendingPush) { pendingPush = false; scheduleSyncPush(); }
  }
}

// Live listener via onSnapshot — replaces polling
async function startSyncLive() {
  stopSyncLive();
  if (!syncMeta.code || !firebaseConfig) return;
  try {
    await ensureFirebase();
    const ref = fbOps.doc(fbDb, SYNC_COLLECTION, syncMeta.code);
    liveUnsub = fbOps.onSnapshot(ref, snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      const v = data.version || 0;
      if (v > (syncMeta.version || 0) && !syncPushInFlight) {
        applyingRemote = true;
        state = { ...DEFAULT_STATE(), ...(data.state || {}) };
        try { _store.set(STORAGE_KEY, JSON.stringify(state)); } catch {}
        syncMeta.version = v;
        syncMeta.lastPush = Date.now();
        saveSyncMeta();
        renderAllExceptSync();
        applyingRemote = false;
        if ($('#syncOverlay') && !$('#syncOverlay').hidden) updateSyncUI();
      }
    }, err => {
      // Permission / network error
      console.error(err);
    });
  } catch (e) {
    console.error(e);
  }
}
function stopSyncLive() {
  if (liveUnsub) { try { liveUnsub(); } catch {} liveUnsub = null; }
}
function renderAllExceptSync() {
  applyTheme();
  renderCharacter();
  renderTrackers();
  renderKingdoms();
  renderHistory($('#historyFilter').value);
  renderCalendar();
  renderConnections($('#connFilter').value);
  $('#sessionNotes').value = state.notes || '';
  $('#hpDelta').value = state.sessionHpDelta;
}

// Backup (download / upload)
function downloadBackup() {
  const blob = new Blob([JSON.stringify({ iosandros: true, exportedAt: new Date().toISOString(), state }, null, 2)],
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const d = new Date();
  a.download = `caeto-backup-${d.toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setSyncMsg('Backup downloaded.', 'ok');
}
function uploadBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const incoming = parsed.state || parsed;
      if (!incoming || typeof incoming !== 'object') throw 0;
      if (!confirm('Replace current state with the uploaded backup? This cannot be undone.')) return;
      state = { ...DEFAULT_STATE(), ...incoming };
      save();
      renderAll();
      setSyncMsg('Backup restored.', 'ok');
    } catch {
      setSyncMsg('That file doesn\'t look like a Caeto backup.', 'err');
    }
  };
  reader.readAsText(file);
}

// Sync UI wiring
$('#syncToggle').addEventListener('click', () => {
  $('#syncOverlay').hidden = false;
  updateSyncUI();
  setSyncMsg('');
});
$('#syncClose').addEventListener('click', () => { $('#syncOverlay').hidden = true; });
$('#syncOverlay').addEventListener('click', e => {
  if (e.target.id === 'syncOverlay') $('#syncOverlay').hidden = true;
});
$('#syncEnable')?.addEventListener('click', syncEnable);
$('#syncJoin')?.addEventListener('click', () => syncJoin($('#syncJoinInput').value));
$('#syncJoinInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') syncJoin(e.target.value); });
$('#syncDisconnect')?.addEventListener('click', () => {
  if (confirm('Stop syncing on this device? Other devices with the same code will keep going.')) syncDisconnect();
});

// Firebase config paste flow
function tryParseFirebaseConfig(raw) {
  raw = (raw || '').trim();
  if (!raw) return null;
  // Accept JSON, a JS object literal (convert keys to strings, strip trailing commas),
  // or a full "const firebaseConfig = { ... };" snippet.
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let body = match[0];
  try { return JSON.parse(body); } catch {}
  try {
    // tolerate single quotes and unquoted keys
    const normalized = body
      .replace(/([{,]\s*)([A-Za-z_][\w$]*)\s*:/g, '$1"$2":')
      .replace(/'([^']*)'/g, '"$1"')
      .replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(normalized);
  } catch {}
  return null;
}
$('#firebaseConfigSave')?.addEventListener('click', () => {
  const raw = $('#firebaseConfigInput').value;
  const cfg = tryParseFirebaseConfig(raw);
  if (!cfg || !cfg.apiKey || !cfg.projectId) {
    setSyncMsg('That doesn\'t look like a Firebase config. It needs at least apiKey and projectId.', 'err');
    return;
  }
  saveFirebaseConfig(cfg);
  fbApp = null; fbDb = null; fbOps = null; // force re-init with new config
  setSyncMsg('Firebase connected. Now enable sync below.', 'ok');
  updateSyncUI();
});
$('#firebaseConfigEdit')?.addEventListener('click', () => {
  if (syncMeta.code) {
    if (!confirm('Changing Firebase projects will disconnect this device from its current sync code. Continue?')) return;
    syncDisconnect();
  }
  clearFirebaseConfig();
  fbApp = null; fbDb = null; fbOps = null;
  const input = $('#firebaseConfigInput');
  if (input) input.value = '';
  setSyncMsg('Paste a new Firebase config below.', '');
  updateSyncUI();
});
$('#syncCopy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(syncMeta.code);
    setSyncMsg('Code copied to clipboard.', 'ok');
  } catch { setSyncMsg('Copy failed — select and copy manually.', 'err'); }
});
$('#syncDownload').addEventListener('click', downloadBackup);
$('#syncUpload').addEventListener('change', e => { if (e.target.files[0]) uploadBackup(e.target.files[0]); e.target.value = ''; });

// ========================================================
//  PROPHECIES
// ========================================================
function renderProphecies() {
  const data = window.PROPHECIES;
  if (!data) return;
  const doc = $('#prophDoctrine');
  if (doc) doc.textContent = data.doctrine;
  const over = $('#prophOverarching');
  if (over) over.textContent = '“' + data.overarching + '”';
  const ord = $('#prophOrderNote');
  if (ord) ord.textContent = data.orderNote;

  const grid = $('#prophGrid');
  if (!grid) return;
  grid.innerHTML = '';
  data.list.forEach(p => {
    const card = el('article', { class: 'proph-card' });
    card.appendChild(el('div', { class: 'p-n', text: String(p.n).padStart(2, '0') }));
    card.appendChild(el('h3', { class: 'p-title', text: p.title }));
    card.appendChild(el('p', { class: 'p-quote', text: '“' + p.text + '”' }));
    grid.appendChild(card);
  });
}

// ========================================================
//  PARTY & CAMPAIGN NPCs
// ========================================================
let _partyEditId = null;
const PARTY_CATEGORIES = ['Party', 'Ally', 'NPC', 'Enemy', 'Unknown'];
const PARTY_SEEDS = [
  {
    name: 'Galith',
    role: "Justin's character",
    category: 'Party',
    tags: ['Party', "Justin"],
    notes: 'Details TBD — add class, kingdom, build as you learn.',
  },
  {
    name: 'Attican',
    role: "Trent's character — Falcon-man",
    category: 'Party',
    tags: ['Party', 'Trent', 'Falcon', 'Inuit', 'Wingsuit'],
    notes: 'Falcon-man with Inuit-style clothing and woven feather-metal armor. His coat functions as a wingsuit — he can glide/fly with it.',
  },
  {
    name: 'Blood Knight (TBD)',
    role: 'Blood Knight — identity unknown',
    category: 'NPC',
    tags: ['Blood Knight', 'Lorenthar', 'TBD'],
    notes: 'Placeholder — ask the DM for more info when appropriate. Update name, demeanor, and role as revealed.',
  },
];

function ensurePartySeeded() {
  if (!Array.isArray(state.party)) state.party = [];
  if (state.party.length === 0) {
    PARTY_SEEDS.forEach(s => state.party.push({
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: s.name,
      role: s.role,
      category: s.category,
      tags: s.tags.slice(),
      notes: s.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    save();
  }
}

function renderParty(filter = '') {
  const groups = $('#partyGroups');
  if (!groups) return;
  groups.innerHTML = '';
  const f = filter.toLowerCase().trim();
  const list = (state.party || []).slice().sort((a, b) => a.name.localeCompare(b.name));

  // Build dynamic tag filter chips (like the 13 Kingdoms page)
  const filterRow = $('#partyFilters');
  if (filterRow) {
    const allTags = new Set(['All']);
    list.forEach(p => (p.tags || []).forEach(t => { if (t) allTags.add(t); }));
    if (!state.partyTagFilter || !allTags.has(state.partyTagFilter)) state.partyTagFilter = 'All';
    filterRow.innerHTML = '';
    // Only show the chip row if there's at least one user-defined tag
    if (allTags.size > 1) {
      [...allTags].forEach(tag => {
        filterRow.appendChild(el('button', {
          class: 'chip' + (state.partyTagFilter === tag ? ' active' : ''),
          onclick: () => { state.partyTagFilter = tag; save(); renderParty($('#partyFilter').value); },
          text: tag,
        }));
      });
    }
  }
  const activeTag = state.partyTagFilter || 'All';

  if (!list.length) {
    groups.appendChild(el('p', { class: 'muted', text: 'No party members or NPCs yet. Click + Add to start.' }));
    return;
  }
  PARTY_CATEGORIES.forEach(cat => {
    const inGroup = list.filter(p => (p.category || 'NPC') === cat
      && (activeTag === 'All' || (p.tags || []).includes(activeTag))
      && (!f || [p.name, p.role, p.notes, ...(p.tags || [])].join(' ').toLowerCase().includes(f)));
    if (!inGroup.length) return;
    const section = el('section', { class: 'party-group' });
    section.appendChild(el('h2', { class: 'card-title', text: cat + (cat === 'Party' ? ' — Your fellow adventurers' : cat === 'NPC' ? 's — People you\'ve met' : cat === 'Ally' ? 'ies — On your side' : cat === 'Enemy' ? ' — Opposed to you' : ' — Category TBD') }));
    const grid = el('div', { class: 'connection-grid' });
    inGroup.forEach(p => grid.appendChild(partyCard(p)));
    section.appendChild(grid);
    groups.appendChild(section);
  });
}

function partyCard(p) {
  const card = el('div', { class: 'conn-card party-card', role: 'button', tabindex: '0',
    onclick: () => openPartyDialog(p.id),
    onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPartyDialog(p.id); } },
  });
  card.appendChild(el('div', { class: 'c-name', text: p.name || '(unnamed)' }));
  if (p.role) card.appendChild(el('div', { class: 'c-role', text: p.role }));
  if (p.notes) card.appendChild(el('div', { class: 'c-notes', text: p.notes }));
  if (p.tags && p.tags.length) {
    const tags = el('div', { class: 'k-tags' });
    p.tags.forEach(t => tags.appendChild(el('span', { class: 'k-tag', text: t })));
    card.appendChild(tags);
  }
  return card;
}

function openPartyDialog(id) {
  _partyEditId = id || null;
  const overlay = $('#partyOverlay');
  const existing = id ? (state.party || []).find(p => p.id === id) : null;
  $('#partyDialogTitle').textContent = existing ? 'Edit — ' + (existing.name || '(unnamed)') : 'Add party / NPC';
  $('#partyName').value = existing ? (existing.name || '') : '';
  $('#partyRole').value = existing ? (existing.role || '') : '';
  $('#partyCategory').value = existing ? (existing.category || 'NPC') : 'NPC';
  $('#partyTags').value = existing && existing.tags ? existing.tags.join(', ') : '';
  $('#partyNotes').value = existing ? (existing.notes || '') : '';
  $('#partyDelete').hidden = !existing;
  overlay.hidden = false;
  setTimeout(() => $('#partyName').focus(), 50);
}

function closePartyDialog() {
  $('#partyOverlay').hidden = true;
  _partyEditId = null;
}

function savePartyFromDialog() {
  if (!Array.isArray(state.party)) state.party = [];
  const name = $('#partyName').value.trim();
  if (!name) { alert('Name required.'); return; }
  const role = $('#partyRole').value.trim();
  const category = $('#partyCategory').value;
  const tags = $('#partyTags').value.split(',').map(s => s.trim()).filter(Boolean);
  const notes = $('#partyNotes').value.trim();
  if (_partyEditId) {
    const p = state.party.find(x => x.id === _partyEditId);
    if (p) {
      p.name = name; p.role = role; p.category = category; p.tags = tags; p.notes = notes;
      p.updatedAt = Date.now();
    }
  } else {
    state.party.push({
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name, role, category, tags, notes,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
  }
  save();
  closePartyDialog();
  renderParty($('#partyFilter').value);
}

function deletePartyFromDialog() {
  if (!_partyEditId) return;
  const p = (state.party || []).find(x => x.id === _partyEditId);
  if (!confirm('Delete ' + (p && p.name ? p.name : 'this entry') + '?')) return;
  state.party = (state.party || []).filter(x => x.id !== _partyEditId);
  save();
  closePartyDialog();
  renderParty($('#partyFilter').value);
}

$('#partyAdd').addEventListener('click', () => openPartyDialog(null));
$('#partyClose').addEventListener('click', closePartyDialog);
$('#partySave').addEventListener('click', savePartyFromDialog);
$('#partyDelete').addEventListener('click', deletePartyFromDialog);
$('#partyFilter').addEventListener('input', e => renderParty(e.target.value));
$('#partyOverlay').addEventListener('click', e => { if (e.target.id === 'partyOverlay') closePartyDialog(); });

// ========================================================
//  CAMPAIGN EVENTS (calendar)
// ========================================================
function renderCampaignEvents() {
  if (!Array.isArray(state.campaignEvents)) state.campaignEvents = [];
  const current = CALENDAR[state.date.monthIdx];
  const dateLabel = `${state.date.day} ${current.name}, ${state.date.year} SE`;
  const de = $('#eventsDate'); if (de) de.textContent = dateLabel;

  // Events on selected day
  const list = $('#eventList'); if (!list) return;
  list.innerHTML = '';
  const todays = state.campaignEvents.filter(e =>
    e.year === state.date.year && e.monthIdx === state.date.monthIdx && e.day === state.date.day);
  const emptyNote = $('#eventEmpty');
  if (emptyNote) emptyNote.hidden = todays.length > 0;
  todays.forEach(e => list.appendChild(eventRow(e, true)));

  // All events sorted
  const all = $('#eventAllList'); if (!all) return;
  all.innerHTML = '';
  const sorted = state.campaignEvents.slice().sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.monthIdx !== b.monthIdx) return a.monthIdx - b.monthIdx;
    return a.day - b.day;
  });
  sorted.forEach(e => all.appendChild(eventRow(e, false)));
}

function eventRow(e, compact) {
  const li = el('li', { class: 'event-row' });
  if (!compact) {
    const m = CALENDAR[e.monthIdx] ? CALENDAR[e.monthIdx].name : '?';
    li.appendChild(el('span', { class: 'ev-date',
      text: `${e.day} ${m}, ${e.year} SE`,
      role: 'button', tabindex: '0',
      onclick: () => {
        state.date = { year: e.year, monthIdx: e.monthIdx, day: e.day };
        save(); renderCalendar(); renderCampaignEvents();
      },
    }));
  }
  li.appendChild(el('span', { class: 'ev-text', text: e.text }));
  li.appendChild(el('button', {
    class: 'btn small danger ev-del', text: '×', 'aria-label': 'Delete event',
    onclick: ev => {
      ev.stopPropagation();
      if (!confirm('Delete this event?')) return;
      state.campaignEvents = state.campaignEvents.filter(x => x.id !== e.id);
      save(); renderCampaignEvents();
    },
  }));
  return li;
}

function formatEventDate(e) {
  const m = CALENDAR[e.monthIdx] ? CALENDAR[e.monthIdx].name : '?';
  return `${e.day} ${m}, ${e.year} SE`;
}

function compareCampaignEvents(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.monthIdx !== b.monthIdx) return a.monthIdx - b.monthIdx;
  return a.day - b.day;
}

function generateSessionPrepText() {
  if (!Array.isArray(state.campaignEvents)) state.campaignEvents = [];
  const sorted = state.campaignEvents.slice().sort(compareCampaignEvents);
  const selectedDayKey = `${state.date.year}-${state.date.monthIdx}-${state.date.day}`;
  const currentLabel = `${state.date.day} ${CALENDAR[state.date.monthIdx].name}, ${state.date.year} SE`;
  const nowIndex = sorted.findIndex(e => `${e.year}-${e.monthIdx}-${e.day}` >= selectedDayKey);
  const split = nowIndex === -1 ? sorted.length : nowIndex;
  const recent = sorted.slice(Math.max(0, split - 3), split);
  const upcoming = sorted.slice(split, split + 3);

  const notes = (state.notes || '').trim();
  const notesLine = notes
    ? notes.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 2).join(' | ')
    : 'No session notes yet.';

  const lines = [
    `SESSION PREP — ${currentLabel}`,
    '',
    'Recent events:',
    ...(recent.length
      ? recent.map((e, i) => `${i + 1}. ${formatEventDate(e)} — ${e.text}`)
      : ['- None logged yet.']),
    '',
    'Upcoming / active threads:',
    ...(upcoming.length
      ? upcoming.map((e, i) => `${i + 1}. ${formatEventDate(e)} — ${e.text}`)
      : ['- None scheduled yet.']),
    '',
    'Session notes snapshot:',
    notesLine,
    '',
    'Carryover checklist:',
    '- [ ] Confirm immediate objective',
    '- [ ] Check key NPCs / alliances',
    '- [ ] Decide where to travel next',
  ];
  return lines.join('\n');
}

$('#eventAdd').addEventListener('click', () => {
  const input = $('#eventInput');
  const text = (input.value || '').trim();
  if (!text) return;
  if (!Array.isArray(state.campaignEvents)) state.campaignEvents = [];
  state.campaignEvents.push({
    id: 'e_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    year: state.date.year, monthIdx: state.date.monthIdx, day: state.date.day,
    text, createdAt: Date.now(),
  });
  input.value = '';
  save(); renderCampaignEvents();
});
$('#eventInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); $('#eventAdd').click(); }
});
$('#sessionPrepGenerate').addEventListener('click', () => {
  $('#sessionPrepOutput').value = generateSessionPrepText();
});
$('#sessionPrepCopy').addEventListener('click', async () => {
  const output = $('#sessionPrepOutput');
  if (!output.value.trim()) output.value = generateSessionPrepText();
  try {
    await navigator.clipboard.writeText(output.value);
    alert('Session prep copied to clipboard.');
  } catch {
    output.focus();
    output.select();
    alert('Copy failed — selected text so you can copy manually.');
  }
});

// Patch renderCalendar to also refresh events when the date changes.
const _origRenderCalendar = renderCalendar;
renderCalendar = function () {
  _origRenderCalendar();
  renderCampaignEvents();
};

// ========================================================
//  HISTORY — scroll-to-match when arriving from global search
// ========================================================
let _historyHighlight = null;
const _origRenderHistory = renderHistory;
renderHistory = function (filter = '') {
  _origRenderHistory(filter);
  if (_historyHighlight) {
    // Find the first event whose text contains the highlight substring
    const q = _historyHighlight.toLowerCase();
    const nodes = $$('#timeline .event');
    const match = nodes.find(n => !n.classList.contains('hidden') &&
      n.textContent.toLowerCase().includes(q));
    if (match) {
      match.classList.add('flash');
      match.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => match.classList.remove('flash'), 2500);
    }
    _historyHighlight = null;
  }
};

// ========================================================
//  BOOT
// ========================================================
// ========================================================
//  EDITABLE PAGE CAPTIONS
// ========================================================
// Minimal inline markdown -> HTML: **bold**, *italic*, <b>/<i> already allowed
function captionMarkdown(s) {
  // Escape HTML except <b>, <i>, <em>, <strong>
  let out = String(s || '').replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]);
  // Restore whitelisted tags
  out = out.replace(/&lt;(\/?)(b|i|em|strong)&gt;/gi, '<$1$2>');
  // Markdown bold and italic
  out = out.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
  return out;
}

// Convert existing HTML inside a caption back to the markdown-ish source for editing
function captionHtmlToSource(html) {
  let s = String(html || '');
  s = s.replace(/<\s*b\s*>/gi, '**').replace(/<\s*\/\s*b\s*>/gi, '**');
  s = s.replace(/<\s*strong\s*>/gi, '**').replace(/<\s*\/\s*strong\s*>/gi, '**');
  s = s.replace(/<\s*i\s*>/gi, '*').replace(/<\s*\/\s*i\s*>/gi, '*');
  s = s.replace(/<\s*em\s*>/gi, '*').replace(/<\s*\/\s*em\s*>/gi, '*');
  // Decode the handful of entities we produced
  s = s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return s.trim();
}

function applyCaptionOverrides() {
  if (!state.captionOverrides) state.captionOverrides = {};
  $$('.page-caption').forEach(p => {
    const id = p.getAttribute('data-caption-id');
    if (!id) return;
    // Cache the default HTML once so we can restore if the user clears their override
    if (!p.dataset.defaultHtml) p.dataset.defaultHtml = p.innerHTML.replace(/<button class="caption-edit-btn"[\s\S]*?<\/button>/, '').trim();
    const override = state.captionOverrides[id];
    const html = (override != null && override !== '') ? captionMarkdown(override) : p.dataset.defaultHtml;
    // Rebuild inner structure: rendered text + pencil button
    p.innerHTML = html + ' <button class="caption-edit-btn" type="button" aria-label="Edit caption" title="Edit caption">✎</button>';
    const btn = p.querySelector('.caption-edit-btn');
    if (btn) btn.addEventListener('click', () => openCaptionEditor(p, id));
  });
}

function openCaptionEditor(paragraph, id) {
  // Avoid stacking editors
  if (paragraph.nextElementSibling && paragraph.nextElementSibling.classList.contains('caption-editor')) return;
  const currentSource = (state.captionOverrides && state.captionOverrides[id] != null && state.captionOverrides[id] !== '')
    ? state.captionOverrides[id]
    : captionHtmlToSource(paragraph.dataset.defaultHtml || paragraph.innerHTML);

  const editor = el('div', { class: 'caption-editor' });
  const textarea = el('textarea', { id: 'captionEdit_' + id });
  textarea.value = currentSource;
  const actions = el('div', { class: 'caption-editor-actions' });
  const saveBtn = el('button', { class: 'btn primary', text: 'Save' });
  const cancelBtn = el('button', { class: 'btn small', text: 'Cancel' });
  const resetBtn = el('button', { class: 'btn small', text: 'Reset to default' });
  const hint = el('span', { class: 'caption-editor-hint', text: '**bold**  *italic*' });
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  actions.appendChild(resetBtn);
  actions.appendChild(hint);
  editor.appendChild(textarea);
  editor.appendChild(actions);
  paragraph.insertAdjacentElement('afterend', editor);
  paragraph.hidden = true;
  setTimeout(() => textarea.focus(), 30);

  const close = () => { editor.remove(); paragraph.hidden = false; };
  cancelBtn.addEventListener('click', close);
  saveBtn.addEventListener('click', () => {
    if (!state.captionOverrides) state.captionOverrides = {};
    state.captionOverrides[id] = textarea.value;
    save();
    applyCaptionOverrides();
    close();
  });
  resetBtn.addEventListener('click', () => {
    if (state.captionOverrides && id in state.captionOverrides) {
      delete state.captionOverrides[id];
      save();
    }
    applyCaptionOverrides();
    close();
  });
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveBtn.click(); }
  });
}

function renderAll() {
  applyTheme();
  renderCharacter();
  renderTrackers();
  renderKingdoms();
  renderHistory($('#historyFilter').value);
  renderCalendar();
  renderConnections($('#connFilter').value);
  renderPlaybook();
  renderProphecies();
  ensurePartySeeded();
  renderParty($('#partyFilter').value);
  renderCampaignEvents();
  renderTweaks();
  activateTab(state.tab);
  updateSyncUI();
  applyCaptionOverrides();
}
renderAll();
if (syncMeta.code && firebaseConfig) startSyncLive();

import { h, clear } from './ui/h.js';
import { icon, BRAND_MARK } from './ui/icons.js';
import { route, fallback, start, onBeforeRender, parse } from './router.js';
import { applyPrefs } from './store/prefs.js';
import * as db from './store/db.js';
import { addActivity } from './engine/progress.js';
import { dueCount } from './engine/cards.js';
import { toast } from './ui/components.js';

import home from './views/home.js';
import learn from './views/learn.js';
import lesson from './views/lesson.js';
import review from './views/review.js';
import exam from './views/exam.js';
import progress from './views/progress.js';
import settings from './views/settings.js';
import welcome from './views/welcome.js';
import resources from './views/resources.js';
import vocabulary from './views/vocabulary.js';

const NAV = [
  { path: '/', label: 'Home', icon: 'home', match: p => p === '/' },
  { path: '/learn', label: 'Learn', icon: 'learn', match: p => p.startsWith('/learn') || p.startsWith('/lesson') },
  { path: '/review', label: 'Review', icon: 'review', match: p => p.startsWith('/review'), count: true },
  { path: '/exam', label: 'Exam Lab', short: 'Exam', icon: 'exam', match: p => p.startsWith('/exam') },
  { path: '/progress', label: 'Progress', short: 'Me', icon: 'progress', match: p => p.startsWith('/progress') || (/^\/(settings|resources|vocabulary)/.test(p) && innerWidth < 960) },
  { path: '/vocabulary', label: 'Vocabulary', icon: 'book', match: p => p.startsWith('/vocabulary'), desktopOnly: true },
  { path: '/resources', label: 'Resources', icon: 'map', match: p => p.startsWith('/resources'), desktopOnly: true },
  { path: '/settings', label: 'Settings', icon: 'settings', match: p => p.startsWith('/settings'), desktopOnly: true },
];

function buildNav() {
  document.querySelector('.brand').innerHTML = `${BRAND_MARK}<span class="brand-name">FrenchQuest</span>`;
  const nav = document.getElementById('nav');
  const tab = document.getElementById('tabbar');
  clear(nav); clear(tab);
  for (const n of NAV) {
    nav.append(h('a', { href: `#${n.path}`, dataset: { path: n.path } }, icon(n.icon), h('span', n.label), n.count && h('span', { class: 'count', hidden: true })));
    if (!n.desktopOnly) tab.append(h('a', { href: `#${n.path}`, dataset: { path: n.path } }, icon(n.icon), h('span', n.short || n.label), n.count && h('span', { class: 'count', hidden: true })));
  }
}

function markNav() {
  const { path } = parse();
  for (const a of document.querySelectorAll('#nav a, #tabbar a')) {
    const n = NAV.find(x => x.path === a.dataset.path);
    if (n.match(path)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  document.body.classList.toggle('in-lesson', /^\/(lesson|review\/session|exam\/.+\/run)/.test(path));
}

export async function refreshCounts() {
  try {
    const n = await dueCount();
    for (const el of document.querySelectorAll('[data-path="/review"] .count')) { el.hidden = !n; el.textContent = n > 99 ? '99+' : n; }
  } catch { /* db not ready */ }
}

// ---------- Study-time tracker: counts only while visible and recently active ----------
function tracker() {
  let lastInput = Date.now();
  const bump = () => { lastInput = Date.now(); };
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(e => addEventListener(e, bump, { passive: true }));
  let acc = 0;
  setInterval(() => {
    if (document.hidden || Date.now() - lastInput > 90000) return;
    const { path } = parse();
    const focus = (location.hash.match(/focus=(\w+)/) || [])[1];
    const kind = path.startsWith('/lesson') ? 'lesson' : path.startsWith('/review') ? (focus === 'listen' ? 'listen' : focus === 'mixed' ? 'mixed' : 'review') : path.startsWith('/exam') ? 'exam' : null;
    if (!kind) return;
    acc += 5;
    if (acc >= 15) { addActivity(kind, acc); acc = 0; }
  }, 5000);
}

route('/', home);
route('/welcome', welcome);
route('/learn', learn);
route('/learn/:level', learn);
route('/lesson/:id', lesson);
route('/review', review);
route('/review/session', review);
route('/exam', exam);
route('/exam/:exam', exam);
route('/exam/:exam/:ability', exam);
route('/exam/:exam/:ability/run/:taskId', exam);
route('/progress', progress);
route('/progress/:tab', progress);
route('/settings', settings);
route('/resources', resources);
route('/vocabulary', vocabulary);
fallback((p, root) => {
  root.append(h('div', { class: 'view narrow' }, h('h1', 'Page not found'), h('p', 'That address does not match any page.'), h('a', { class: 'btn primary', href: '#/' }, 'Go to Home')));
});

onBeforeRender(async (path) => {
  markNav();
  refreshCounts();
  if (path !== '/welcome' && !path.startsWith('/settings')) {
    const onboarded = await db.getMeta('onboarded');
    if (!onboarded) return '/welcome';
  }
  return null;
});

async function boot() {
  applyPrefs();
  buildNav();
  try {
    await db.openDB();
  } catch (e) {
    document.getElementById('main').replaceChildren(h('div', { class: 'view narrow' }, h('h1', 'Storage is unavailable'),
      h('p', 'FrenchQuest saves your progress in this browser, but storage is blocked. This happens in some private windows. Open the site in a normal window to continue.'),
      h('p', { class: 'small muted' }, String(e.message || e))));
    return;
  }
  db.persistStorage();
  window.addEventListener('hashchange', markNav);
  window.addEventListener('fq-progress', refreshCounts);
  tracker();
  await start();
  // Offline support on the deployed (HTTPS) site; skipped during local development.
  if (location.protocol === 'https:') registerSW();
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          toast('A new version of FrenchQuest is ready.', { action: 'Reload', ms: 15000, onAction: () => { nw.postMessage('skip-waiting'); } });
        }
      });
    });
  }).catch(() => { /* offline support unavailable */ });
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
}

window.addEventListener('unhandledrejection', e => {
  console.error(e.reason);
  toast(`Something went wrong: ${e.reason?.message || e.reason}`);
});

boot();

// Settings live in localStorage so they apply before first paint. Included in backups.
const KEY = 'fq.prefs';

export const DEFAULTS = {
  theme: 'system',          // system | light | dark
  textScale: 1,             // 1 | 1.125 | 1.25 | 1.5
  motion: 'system',         // system | reduce
  translations: 'tap',      // always | tap | never
  accentMode: 'lenient',    // lenient | strict
  dailyMinutes: 75,
  newPerDay: 15,
  reviewCap: 150,
  retention: 0.9,
  restDays: [],             // 0=Sun … 6=Sat
  voiceURI: '',
  voiceRate: 0.95,
  speechRecognition: false,
  sttLang: 'fr-FR',
  ai: { enabled: false, model: 'claude-sonnet-5-5', fastModel: 'claude-haiku-5-5', dailyCap: 50, remember: false },
};

let cache = null;

export function prefs() {
  if (cache) return cache;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { saved = {}; }
  cache = { ...DEFAULTS, ...saved, ai: { ...DEFAULTS.ai, ...(saved.ai || {}) } };
  return cache;
}

export function setPrefs(patch) {
  const next = { ...prefs(), ...patch };
  if (patch.ai) next.ai = { ...prefs().ai, ...patch.ai };
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
  applyPrefs();
  window.dispatchEvent(new CustomEvent('prefs-change', { detail: next }));
  return next;
}

export function replacePrefs(obj) {
  cache = null;
  try { localStorage.setItem(KEY, JSON.stringify(obj || {})); } catch { /* ignore */ }
  applyPrefs();
}

export function applyPrefs() {
  const p = prefs();
  const root = document.documentElement;
  if (p.theme === 'system') root.removeAttribute('data-theme'); else root.dataset.theme = p.theme;
  root.style.setProperty('--text-scale', p.textScale);
  if (p.motion === 'reduce') root.dataset.motion = 'reduce'; else root.removeAttribute('data-motion');
}

// AI provider adapter (Anthropic Messages API, called directly from the browser with the learner's own key).
import { prefs, setPrefs } from '../store/prefs.js';

let memoryKey = '';

export function getKey() { return memoryKey || prefs().ai?.key || ''; }
export function setKey(key, remember) {
  memoryKey = key;
  setPrefs({ ai: { key: remember ? key : undefined, remember: !!remember } });
}
export const hasKey = () => !!getKey();
export const aiReady = () => prefs().ai?.enabled && hasKey();

const CAP_KEY = 'fq.ai.usage';
function usage() {
  const d = new Date().toISOString().slice(0, 10);
  let u = {};
  try { u = JSON.parse(localStorage.getItem(CAP_KEY) || '{}'); } catch { /* */ }
  if (u.d !== d) u = { d, n: 0 };
  return u;
}
export const usedToday = () => usage().n;

/** complete({ system, messages, fast }) → text */
export async function complete({ system, messages, fast = false, maxTokens = 1500 }) {
  const key = getKey();
  if (!key) throw new Error('Add your API key in Settings → AI coach.');
  const u = usage();
  const cap = prefs().ai?.dailyCap || 50;
  if (u.n >= cap) throw new Error(`Daily AI limit reached (${cap}). You can raise it in Settings.`);
  if (!navigator.onLine) throw new Error('The AI coach needs an internet connection.');
  const model = fast ? prefs().ai.fastModel : prefs().ai.model;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });
  u.n++;
  try { localStorage.setItem(CAP_KEY, JSON.stringify(u)); } catch { /* */ }
  if (!res.ok) {
    let msg = `${res.status}`;
    try { const j = await res.json(); msg = j.error?.message || msg; } catch { /* */ }
    if (res.status === 401) msg = 'The API key was rejected. Check it in Settings → AI coach.';
    throw new Error(msg);
  }
  const data = await res.json();
  return (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
}

/** Ask for JSON and parse defensively. */
export async function completeJSON(opts) {
  const text = await complete(opts);
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('The AI reply was not in the expected format.');
  try { return JSON.parse(m[0]); } catch { throw new Error('The AI reply could not be read.'); }
}

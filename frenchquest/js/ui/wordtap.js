// Tap-to-hear: tapping French text speaks it.
//   - A highlighted [[phrase]] (span.hl) speaks the whole phrase.
//   - Any other word inside lang="fr" text speaks that word.
// A small bubble shows the meaning when the course teaches the word,
// except inside exercises, where a meaning would give the answer away.
import { h } from './h.js';
import { icon } from './icons.js';
import { sayOne } from './components.js';
import { say } from '../media/speech.js';
import { getData } from '../engine/content.js';

const WORD = /[\p{L}\p{M}'’-]/u;
const SKIP = 'button, a, input, textarea, select, label, .opt, .options, .tiles, .accents, [data-notap], .word-pop';
let glossary = null;
let pop = null;

const norm = s => s.normalize('NFC').toLowerCase().replace(/’/g, "'").replace(/^[-']+|[-']+$/g, '').trim();

async function meaningOf(text) {
  if (!glossary) {
    try { glossary = (await getData('glossary')).words || {}; } catch { glossary = {}; }
  }
  const k = norm(text);
  if (glossary[k]) return glossary[k];
  const bare = k.replace(/^(l'|d'|j'|m'|t'|s'|n'|c'|qu')/, '');
  return glossary[bare] || null;
}

// Exam reading and listening tests are scored: no help there.
const disabledHere = () => /^#\/exam\/[^/]+\/(co|ce)\/run\//.test(location.hash);

function wordAt(x, y) {
  let node, offset;
  if (document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(x, y);
    if (!p) return null;
    node = p.offsetNode; offset = p.offset;
  } else if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y);
    if (!r) return null;
    node = r.startContainer; offset = r.startOffset;
  } else return null;
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const t = node.data;
  let a = offset, b = offset;
  while (a > 0 && WORD.test(t[a - 1])) a--;
  while (b < t.length && WORD.test(t[b])) b++;
  // Keep inner apostrophes and hyphens (l'ami, peut-être), drop them at the edges.
  while (a < b && /['’-]/.test(t[a])) a++;
  while (b > a && /['’-]/.test(t[b - 1])) b--;
  if (b <= a || !/\p{L}/u.test(t.slice(a, b))) return null;
  const range = document.createRange();
  range.setStart(node, a); range.setEnd(node, b);
  // Make sure the tap landed on the word, not in empty space next to it.
  const rect = range.getBoundingClientRect();
  if (x < rect.left - 4 || x > rect.right + 4 || y < rect.top - 4 || y > rect.bottom + 4) return null;
  return { text: t.slice(a, b), range };
}

function closePop() {
  pop?.remove(); pop = null;
  if (window.CSS?.highlights) CSS.highlights.delete('fq-word');
}

async function showPop(text, rect, { gloss = true } = {}) {
  closePop();
  const meaning = gloss ? await meaningOf(text) : null;
  pop = h('div', { class: 'word-pop', role: 'status' },
    h('div', { class: 'row', style: { gap: '.5rem', flexWrap: 'nowrap' } },
      h('strong', { lang: 'fr', class: 'fr' }, text),
      sayOne(text), sayOne(text, { slow: true }),
      h('button', { class: 'btn icon ghost sm', type: 'button', 'aria-label': 'Close', onclick: closePop }, icon('x'))),
    meaning && h('div', { class: 'small', lang: 'en' }, meaning));
  document.body.append(pop);
  const w = pop.offsetWidth, hgt = pop.offsetHeight;
  const left = Math.max(8, Math.min(innerWidth - w - 8, rect.left + rect.width / 2 - w / 2));
  const above = rect.top - hgt - 8;
  const top = above > 8 ? above : rect.bottom + 8;
  pop.style.left = `${left + scrollX}px`;
  pop.style.top = `${top + scrollY}px`;
}

function speak(text, rect, opts) {
  say(text);
  showPop(text, rect, opts);
}

export function initWordTap() {
  document.addEventListener('click', e => {
    if (pop && !pop.contains(e.target)) closePop();
    if (disabledHere() || e.defaultPrevented) return;
    if (String(getSelection?.() || '').trim()) return; // the user is selecting text
    const hl = e.target.closest?.('.hl');
    if (hl && !hl.closest(SKIP)) {
      speak(hl.textContent.trim(), hl.getBoundingClientRect(), { gloss: !hl.closest('.ex') });
      return;
    }
    const host = e.target.closest?.('[lang="fr"]');
    if (!host || e.target.closest(SKIP)) return;
    const w = wordAt(e.clientX, e.clientY);
    if (!w) return;
    if (window.CSS?.highlights && window.Highlight) CSS.highlights.set('fq-word', new Highlight(w.range));
    speak(w.text, w.range.getBoundingClientRect(), { gloss: !host.closest('.ex') });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePop();
    const hl = e.target.closest?.('.hl');
    if (hl && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); speak(hl.textContent.trim(), hl.getBoundingClientRect(), { gloss: !hl.closest('.ex') }); }
  });
  addEventListener('hashchange', closePop);
  addEventListener('resize', closePop);
}


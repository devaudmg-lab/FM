// Sounds & alphabet: the French sound system with English and Hindi comparisons,
// lip-shape pictures, tap-to-hear everywhere, and short listening drills.
import { h, clear } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { md } from '../ui/md.js';
import { sayButton, sayOne, empty } from '../ui/components.js';
import { say, stop } from '../media/speech.js';
import { getData } from '../engine/content.js';
import { shuffle } from '../exercises/exercises.js';

const TABS = [
  ['alphabet', 'Alphabet'], ['accents', 'Accents'], ['vowels', 'Vowels'], ['nasals', 'Nasal sounds'],
  ['consonants', 'Consonants'], ['silent', 'Silent letters'], ['numbers', 'Numbers'], ['drills', 'Sound drills'],
];

// Front view of the lips for each mouth shape.
const LIPS = {
  spread: '<path d="M6 24c6-5 30-5 36 0-6 5-30 5-36 0z" class="lip"/><path d="M9 24h30" class="gap"/>',
  rounded: '<ellipse cx="24" cy="24" rx="8" ry="7.5" class="lip"/><ellipse cx="24" cy="24" rx="3.2" ry="3" class="hole"/>',
  'round-open': '<ellipse cx="24" cy="24" rx="11" ry="11" class="lip"/><ellipse cx="24" cy="24" rx="6" ry="6.5" class="hole"/>',
  open: '<ellipse cx="24" cy="25" rx="13" ry="12" class="lip"/><ellipse cx="24" cy="25.5" rx="9" ry="8" class="hole"/>',
  relaxed: '<path d="M9 24c5-4.5 25-4.5 30 0-5 5-25 5-30 0z" class="lip"/><path d="M13 24.2c4-1.6 18-1.6 22 0" class="gap"/>',
  nasal: '<path d="M24 5c-2 6-6 9-6 13a6 3 0 0 0 12 0c0-4-4-7-6-13z" class="nose"/><path d="M16 15c-3-2-4-5-3-8M32 15c3-2 4-5 3-8" class="air"/><path d="M11 33c5-4 21-4 26 0-5 4-21 4-26 0z" class="lip"/>',
};

function lips(id, label) {
  if (!LIPS[id]) return null;
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 48 48');
  s.setAttribute('class', 'lips');
  s.setAttribute('role', 'img');
  s.setAttribute('aria-label', label || id);
  s.innerHTML = LIPS[id];
  return s;
}

export default async function sounds({ section }, root) {
  let data;
  try { data = await getData('sounds'); } catch { data = null; }
  const v = h('div', { class: 'view narrow sounds' });
  root.append(v);
  v.append(h('div', { class: 'page-head' }, h('h1', 'Sounds & alphabet'),
    h('p', 'How French sounds, compared with English and Hindi, with the lip shape for each sound. Tap any French word or letter to hear it; the turtle button plays it slowly.')));
  if (!data) { v.append(empty('Coming soon', 'The sound guide is being prepared.')); return; }

  const current = TABS.some(([id]) => id === section) ? section : 'alphabet';
  v.append(h('nav', { class: 'exam-switch sound-tabs', 'aria-label': 'Sound guide sections' },
    TABS.map(([id, label]) => h('a', { href: `#/sounds/${id}`, 'aria-current': id === current ? 'page' : null }, label))));
  if (current === 'alphabet') v.append(md(data.intro || ''));

  const body = h('div', { class: 'sound-body' });
  v.append(body);
  if (current === 'drills') { renderDrills(body, data.drills || []); return () => stop(); }
  const sec = (data.sections || []).find(s => s.id === current);
  if (!sec) { body.append(empty('Not available', 'This part of the guide is missing.')); return; }
  if (sec.intro) body.append(md(sec.intro));
  if (current === 'vowels' || current === 'nasals') body.append(mouthLegend(data.mouth || []));
  const kind = { letters, cards, sounds: soundCards, numbers }[sec.kind];
  body.append(kind ? kind(sec, data) : h('p', 'Unknown section.'));
  setTimeout(() => v.querySelector('.sound-tabs [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' }), 50);
  return () => stop();
}

function hindi(it) {
  if (!it.hi && !it.hiRoman) return null;
  return h('div', { class: 'cmp' }, h('span', { class: 'cmp-k' }, 'Hindi'),
    h('span', it.hi && h('span', { lang: 'hi', class: 'deva' }, it.hi), it.hi && it.hiRoman ? ' — ' : null, it.hiRoman));
}
const english = text => text && h('div', { class: 'cmp' }, h('span', { class: 'cmp-k' }, 'English'), h('span', text));

function exampleChips(list = []) {
  if (!list.length) return null;
  return h('ul', { class: 'ex-chips' }, list.map(e => h('li',
    h('button', { class: 'chip', type: 'button', onclick: () => say(e.fr) }, h('span', { lang: 'fr', class: 'fr' }, e.fr), icon('speaker')),
    e.en && h('span', { class: 'small muted' }, e.en))));
}

// ---------- Alphabet ----------
function letters(sec) {
  const detail = h('div', { class: 'letter-detail panel', 'aria-live': 'polite', hidden: true });
  const grid = h('div', { class: 'letters' });
  let active = null;
  const show = (it, btn) => {
    say(it.say || it.name || it.ch);
    active?.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-pressed', 'true');
    active = btn;
    detail.hidden = false;
    clear(detail).append(
      h('div', { class: 'row', style: { flexWrap: 'nowrap', alignItems: 'center' } },
        h('span', { class: 'letter-big', lang: 'fr' }, it.ch),
        h('div', { style: { flex: 1, minWidth: 0 } }, h('div', { class: 'small muted' }, 'Its name in French'),
          h('div', { class: 'fr', lang: 'fr', style: { fontSize: 'var(--fs-lg)' } }, it.name)),
        sayButton(it.say || it.name)),
      english(it.en), hindi(it),
      it.example && h('div', { class: 'cmp' }, h('span', { class: 'cmp-k' }, 'Example'), exampleChips([it.example])),
      it.tip && h('p', { class: 'small tip' }, icon('bulb'), ' ', it.tip));
  };
  for (const it of sec.items || []) {
    const b = h('button', { class: 'letter', type: 'button', 'aria-pressed': 'false', 'aria-label': `${it.ch}, said ${it.name}` },
      h('span', { class: 'l', lang: 'fr' }, it.ch), h('span', { class: 'n', lang: 'fr' }, it.name));
    b.addEventListener('click', () => show(it, b));
    grid.append(b);
  }
  return h('div', grid, detail);
}

// ---------- Cards (accents, silent letters) ----------
function cards(sec) {
  return h('div', { class: 'sound-list' }, (sec.items || []).map(it => h('article', { class: 'panel sound-card' },
    h('div', { class: 'sc-head' },
      it.ch && h('span', { class: 'sc-label', lang: 'fr' }, it.ch),
      h('h3', { style: { margin: 0, flex: 1 } }, it.title),
      it.say && sayButton(it.say)),
    it.body && md(it.body),
    hindi(it),
    exampleChips(it.examples))));
}

// ---------- Sound cards (vowels, nasals, consonants) ----------
function soundCards(sec, data) {
  const mouthName = id => (data.mouth || []).find(m => m.id === id)?.name;
  return h('div', { class: 'sound-list' }, (sec.items || []).map(it => h('article', { class: 'panel sound-card' },
    h('div', { class: 'sc-head' },
      h('span', { class: 'sc-label', lang: 'fr' }, it.label),
      h('div', { style: { flex: 1, minWidth: 0 } }, it.spellings?.length ? h('div', { class: 'spellings' }, h('span', { class: 'small muted' }, 'Spelled '), it.spellings.map(s => h('span', { class: 'tag', lang: 'fr' }, s))) : null),
      it.say && sayButton(it.say)),
    h('div', { class: 'sc-grid' },
      it.mouth && h('figure', { class: 'mouth' }, lips(it.mouth, mouthName(it.mouth)), h('figcaption', mouthName(it.mouth) || '')),
      h('div', { class: 'sc-text' }, english(it.en), hindi(it),
        it.how && h('div', { class: 'cmp' }, h('span', { class: 'cmp-k' }, 'How'), h('span', it.how)),
        it.howHi && h('div', { class: 'cmp' }, h('span', { class: 'cmp-k' }, 'Hindi mein'), h('span', it.howHi)))),
    exampleChips(it.examples),
    it.trap && h('div', { class: 'notice' }, icon('alert'), h('div', md(it.trap))))));
}

function mouthLegend(list) {
  if (!list.length) return null;
  return h('details', { class: 'deep mouth-legend' }, h('summary', icon('eye'), 'Mouth guide: the lip shapes'),
    h('div', { class: 'deep-body legend-grid' }, list.map(m => h('div', { class: 'legend-item' }, lips(m.id, m.name),
      h('div', h('strong', m.name), h('div', { class: 'small' }, m.en), m.hi && h('div', { class: 'small muted' }, m.hi))))));
}

// ---------- Numbers ----------
function numbers(sec) {
  return h('div', (sec.groups || []).map(g => h('section', { class: 'num-group' },
    h('h3', g.title),
    g.note && md(g.note),
    h('div', { class: 'nums' }, (g.items || []).map(it => h('button', { class: 'num', type: 'button', onclick: () => say(it.fr), 'aria-label': `${it.n}: ${it.fr}` },
      h('span', { class: 'd' }, it.n), h('span', { class: 'w', lang: 'fr' }, it.fr)))))));
}

// ---------- Drills ----------
function renderDrills(host, drills) {
  if (!drills.length) { host.append(empty('No drills yet', '')); return; }
  host.append(h('p', { class: 'muted' }, 'Train your ear on the sound pairs that are hardest for English and Hindi speakers. You hear one word; pick which one it was. Ten rounds each.'));
  host.append(h('div', { class: 'grid grid-2' }, drills.map(d => h('div', { class: 'panel' },
    h('h3', d.title), d.explain && h('p', { class: 'small' }, d.explain),
    h('p', { class: 'small muted' }, `${d.pairs.length} word pairs`),
    h('button', { class: 'btn primary', type: 'button', onclick: () => runDrill(host, drills, d) }, icon('play'), 'Start')))));
}

function runDrill(host, drills, d) {
  const ROUNDS = Math.min(10, d.pairs.length * 2);
  const rounds = shuffle(d.pairs.flatMap(p => [[p, 0], [p, 1]]), Math.random()).slice(0, ROUNDS);
  let i = 0, right = 0;
  const misses = [];
  const next = () => {
    stop();
    if (i >= rounds.length) return done();
    const [pair, k] = rounds[i++];
    const target = pair[k];
    const order = Math.random() < 0.5 ? [0, 1] : [1, 0];
    const fb = h('div', { 'aria-live': 'polite' });
    let answered = false;
    const opts = order.map(j => {
      const w = pair[j];
      const b = h('button', { class: 'opt', type: 'button' }, h('span', { class: 'k' }, d.labels?.[j] || ''), h('span', h('span', { lang: 'fr', class: 'fr' }, w.fr), w.en && h('span', { class: 'small muted', style: { display: 'block' } }, w.en)));
      b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const ok = j === k;
        if (ok) right++; else misses.push(pair);
        b.classList.add(ok ? 'is-right' : 'is-wrong');
        if (!ok) opts[order.indexOf(k)].classList.add('is-right');
        opts.forEach(o => { o.disabled = true; });
        clear(fb).append(h('div', { class: ['notice', ok && 'info'] }, icon(ok ? 'check' : 'alert'),
          h('div', ok ? 'Right!' : `It was “${target.fr}”. Listen to both:`, ' ',
            h('span', { class: 'row', style: { display: 'inline-flex', gap: '.4rem', marginTop: '.4rem' } },
              h('button', { class: 'chip', type: 'button', onclick: () => say(pair[0].fr) }, pair[0].fr, icon('speaker')),
              h('button', { class: 'chip', type: 'button', onclick: () => say(pair[1].fr) }, pair[1].fr, icon('speaker'))))),
          h('button', { class: 'btn primary', type: 'button', style: { marginTop: '1rem' }, onclick: next }, i < rounds.length ? 'Next' : 'See score', icon('next')));
        fb.querySelector('.btn.primary')?.focus();
      });
      return b;
    });
    clear(host).append(
      h('div', { class: 'row between', style: { marginBottom: '1rem' } },
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { stop(); clear(host); renderDrills(host, drills); } }, icon('back'), 'All drills'),
        h('span', { class: 'small muted' }, `${d.title} · ${i}/${rounds.length}`)),
      h('div', { class: 'panel' },
        h('p', { class: 'ex-prompt' }, 'Which word do you hear?'),
        h('div', { class: 'row', style: { marginBottom: '1rem' } }, sayOne(target.fr, { label: 'Play again' }), sayOne(target.fr, { slow: true })),
        h('div', { class: 'options' }, opts), fb));
    setTimeout(() => say(target.fr), 250);
  };
  const done = () => {
    clear(host).append(h('div', { class: 'panel' },
      h('h2', `${right} / ${rounds.length}`),
      h('p', right === rounds.length ? 'Perfect ear!' : right >= rounds.length * 0.8 ? 'Very good. Do it again tomorrow to lock it in.' : 'These sounds take time. Replay the pairs below, then try again.'),
      misses.length > 0 && exampleChips([...new Map(misses.flat().map(w => [w.fr, w])).values()]),
      h('div', { class: 'row', style: { marginTop: '1rem' } },
        h('button', { class: 'btn primary', type: 'button', onclick: () => runDrill(host, drills, d) }, icon('refresh'), 'Again'),
        h('button', { class: 'btn', type: 'button', onclick: () => { clear(host); renderDrills(host, drills); } }, 'All drills'))));
  };
  next();
}

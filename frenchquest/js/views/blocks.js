// Renders non-exercise lesson blocks from JSON.
import { h, fr } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { md, inline } from '../ui/md.js';
import { sayButton, sayPair } from '../ui/components.js';
import { sayLines, stop } from '../media/speech.js';
import { prefs } from '../store/prefs.js';
import { canRecord, startRecording, playBlob } from '../media/recorder.js';

const DEEP_ICON = { why: 'bulb', mistakes: 'alert', pronunciation: 'ear', examples: 'book', challenge: 'star', canada: 'map', culture: 'map' };
const DEEP_TITLE = { why: 'Why does this work?', mistakes: 'Common mistakes', pronunciation: 'Pronunciation clinic', examples: 'More examples', challenge: 'Challenge', canada: 'In Canada', culture: 'Culture note' };

function enLine(text) {
  const mode = prefs().translations;
  if (!text || mode === 'never') return null;
  const el = h('span', { class: ['en', mode === 'tap' && 'reveal-able'], lang: 'en', tabindex: mode === 'tap' ? 0 : null, role: mode === 'tap' ? 'button' : null, 'aria-label': mode === 'tap' ? `Show translation: ${text}` : null }, text);
  if (mode === 'tap') {
    const show = () => el.classList.add('shown');
    el.addEventListener('click', show);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
  }
  return el;
}

export function renderBlock(b, ctx = {}) {
  const fn = R[b.type];
  if (!fn) return h('div', { class: 'notice' }, `Unknown block: ${b.type}`);
  const el = fn(b, ctx);
  el.classList.add('block');
  return el;
}

const R = {
  dialogue(b) {
    const wrap = h('div', { class: prefs().translations === 'tap' ? 'hide-en' : null });
    if (b.title) wrap.append(h('h3', b.title));
    if (b.context) wrap.append(h('p', { class: 'context' }, b.context));
    const lines = b.lines.map(l => h('div', { class: 'line' },
      h('span', { class: 'who' }, l.speaker),
      h('div', fr(l.fr, 'div'), enLine(l.en)),
      sayButton(l.fr, { audio: l.audio })));
    let playing = false;
    const playBtn = h('button', { class: 'btn sm', type: 'button', onclick: async () => {
      if (playing) { stop(); return; }
      playing = true; playBtn.lastChild.textContent = 'Stop';
      await sayLines(b.lines, { onLine: i => lines.forEach((el, k) => el.classList.toggle('playing', k === i)) });
      playing = false; playBtn.lastChild.textContent = 'Play the conversation';
    } }, icon('play'), h('span', 'Play the conversation'));
    const slowBtn = h('button', { class: 'btn sm ghost', type: 'button', onclick: () => sayLines(b.lines, { rate: 0.7, onLine: i => lines.forEach((el, k) => el.classList.toggle('playing', k === i)) }) }, 'Slowly');
    wrap.append(h('div', { class: 'row', style: { marginBottom: '1rem' } }, playBtn, slowBtn), h('div', { class: 'dialogue' }, lines));
    return wrap;
  },

  text(b) {
    const wrap = h('div', { class: prefs().translations === 'tap' ? 'hide-en' : null });
    if (b.title) wrap.append(h('h3', b.title));
    if (b.context) wrap.append(h('p', { class: 'context' }, b.context));
    wrap.append(h('div', { class: 'row', style: { alignItems: 'flex-start', flexWrap: 'nowrap' } },
      h('div', { style: { flex: 1 } }, ...String(b.fr).split('\n').map(p => h('p', { class: 'fr', lang: 'fr', style: { fontSize: '1.15rem' } }, p))),
      sayButton(b.fr.replace(/\n/g, ' '), { audio: b.audio })));
    if (b.en) wrap.append(h('p', enLine(b.en)));
    return wrap;
  },

  explain(b) {
    const wrap = h('div');
    if (b.title) wrap.append(h('h3', b.title));
    wrap.append(md(b.body));
    return wrap;
  },

  pattern(b) {
    const wrap = h('div');
    if (b.title) wrap.append(h('h3', b.title));
    wrap.append(h('div', { class: 'pattern', lang: 'fr' }, inline(b.pattern)));
    if (b.note) wrap.append(md(b.note));
    if (b.examples?.length) wrap.append(examples(b.examples));
    return wrap;
  },

  examples(b) {
    const wrap = h('div');
    if (b.title) wrap.append(h('h3', b.title));
    wrap.append(examples(b.items || b.examples));
    return wrap;
  },

  table(b) {
    const wrap = h('div');
    if (b.title) wrap.append(h('h3', b.title));
    const frCols = new Set(b.frCols || [0, 1]);
    const sayCol = b.sayCol ?? null;
    wrap.append(h('div', { class: 'table-wrap' }, h('table', { class: 'ftable' },
      b.head && h('thead', h('tr', b.head.map(c => h('th', { scope: 'col' }, c)), sayCol != null && h('th', h('span', { class: 'sr-only' }, 'Listen')))),
      h('tbody', b.rows.map(r => h('tr', r.map((c, i) => h('td', { class: frCols.has(i) ? 'fr' : null, lang: frCols.has(i) ? 'fr' : null }, inline(c))),
        sayCol != null && h('td', sayButton(r.filter((c, i) => frCols.has(i)).join(' ').replace(/\*|\[\[|\]\]/g, '')))))))));
    if (b.note) wrap.append(md(b.note));
    return wrap;
  },

  vocab(b, ctx) {
    const wrap = h('div');
    if (b.title) wrap.append(h('h3', b.title));
    const items = (b.itemIds || []).map(id => ctx.items?.get(id)).filter(Boolean);
    wrap.append(h('div', { class: 'vocab' }, items.map(it => h('div', { class: 'vcard' },
      h('div', h('span', { class: ['fr', it.gender && `g-${it.gender}`], lang: 'fr' }, displayFr(it))),
      sayButton(it.say || displayFr(it)),
      h('div', { class: 'meta' }, [it.pos, it.gender && (it.gender === 'm' ? 'masculine' : 'feminine'), it.fem && `fem. ${it.fem}`].filter(Boolean).join(', ')),
      h('div', { class: 'en', lang: 'en' }, Array.isArray(it.en) ? it.en.join(', ') : it.en),
      it.example && h('div', { class: 'ex' }, fr(it.example.fr), it.example.en && h('span', { class: 'en', style: { display: 'block' } }, it.example.en))))));
    return wrap;
  },

  repeat(b) {
    const wrap = h('div');
    wrap.append(h('h3', b.title || 'Listen and repeat'));
    if (b.note) wrap.append(md(b.note));
    const list = h('ul', { class: 'examples' });
    for (const l of b.lines) {
      list.append(h('li',
        h('div', fr(l.fr, 'div'), l.en && h('span', { class: 'en' }, l.en), l.tip && h('span', { class: 'small', style: { display: 'block', color: 'var(--violet)' } }, l.tip)),
        h('div', { class: 'row', style: { gap: '4px', flexWrap: 'nowrap' } }, sayPair(l.fr, { audio: l.audio }), canRecord() ? miniRecorder() : null)));
    }
    wrap.append(list);
    return wrap;
  },

  listen(b) { // a passage with transcript hidden until revealed
    const wrap = h('div');
    if (b.title) wrap.append(h('h3', b.title));
    if (b.context) wrap.append(h('p', { class: 'context' }, b.context));
    const tr = h('div', { hidden: true }, ...String(b.fr).split('\n').map(p => h('p', { class: 'fr', lang: 'fr' }, p)), b.en && h('p', { class: 'en small' }, b.en));
    wrap.append(h('div', { class: 'row' }, sayPair(b.fr.replace(/\n/g, ' '), { audio: b.audio }),
      h('button', { class: 'btn ghost sm', type: 'button', onclick: e => { tr.hidden = !tr.hidden; e.currentTarget.textContent = tr.hidden ? 'Show transcript' : 'Hide transcript'; } }, 'Show transcript')), tr);
    return wrap;
  },

  deepdive(b) {
    return h('details', { class: 'deep' },
      h('summary', icon(DEEP_ICON[b.kind] || 'bulb'), b.title || DEEP_TITLE[b.kind] || 'More'),
      h('div', { class: 'deep-body' }, md(b.body), b.examples?.length ? examples(b.examples) : null));
  },

  note(b) {
    return h('div', { class: ['notice', b.tone !== 'warning' && 'info'] }, icon(b.tone === 'warning' ? 'alert' : 'info'), h('div', md(b.body)));
  },
};

export function displayFr(it) {
  if (it.article && it.kind === 'vocab') {
    const art = it.article;
    return art.endsWith("'") ? `${art}${it.fr}` : `${art} ${it.fr}`;
  }
  return it.fr;
}

function examples(list) {
  return h('ul', { class: 'examples' }, list.map(e => h('li',
    h('div', h('span', { class: 'fr', lang: 'fr' }, inline(e.fr)), e.en && h('span', { class: 'en' }, e.en)),
    sayButton(String(e.fr).replace(/\*|\[\[|\]\]/g, ''), { audio: e.audio }))));
}

function miniRecorder() {
  let ctl = null, last = null;
  const btn = h('button', { class: 'say', type: 'button', 'aria-label': 'Record yourself', title: 'Record yourself' }, icon('mic'));
  const play = h('button', { class: 'say', type: 'button', 'aria-label': 'Play my recording', title: 'Play my recording', hidden: true }, icon('play'));
  btn.addEventListener('click', async () => {
    if (ctl) { last = await ctl.stop(); ctl = null; btn.classList.remove('playing'); play.hidden = false; return; }
    try { ctl = await startRecording({ maxMs: 15000 }); btn.classList.add('playing'); } catch { btn.disabled = true; btn.title = 'Microphone blocked'; }
  });
  play.addEventListener('click', () => last && playBlob(last.blob));
  return h('span', { class: 'row', style: { gap: '4px', flexWrap: 'nowrap' } }, btn, play);
}

import { h } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { bar, empty } from '../ui/components.js';
import { getData } from '../engine/content.js';
import { lessonProgressMap, isDone } from '../engine/progress.js';
import { cardStats } from '../engine/cards.js';

export default async function vocabulary(params, root) {
  let idx;
  try { idx = await getData('vocab-decks'); } catch { idx = { decks: [] }; }
  const [prog, cs] = await Promise.all([lessonProgressMap(), cardStats()]);
  const v = h('div', { class: 'view narrow' });
  root.append(v);
  v.append(h('div', { class: 'page-head' }, h('h1', 'Vocabulary'),
    h('p', 'Extra decks of high-frequency French words that the lessons do not teach, chosen by comparing the whole course with a list of the most-used words in everyday French. Study a deck once; its words then join your spaced review.')));

  const decks = idx.decks || [];
  if (!decks.length) { v.append(empty('No decks yet', 'Vocabulary decks will appear here.')); return; }
  const done = decks.filter(d => isDone(prog.get(d.id))).length;
  v.append(h('div', { class: 'panel tint', style: { marginBottom: '2rem' } },
    h('div', { class: 'row between' }, h('strong', `${done} of ${decks.length} decks studied`), h('span', { class: 'small muted' }, `${cs.itemsEstablished} words and patterns established in memory overall`)),
    h('div', { style: { marginTop: '.75rem' } }, bar((done / decks.length) * 100, 'green')),
    h('p', { class: 'small muted', style: { margin: '.75rem 0 0' } }, 'Tip: add one deck at a time, when your daily review is under control. Everyday decks go from most to least frequent; the exam-theme decks cover the topics TEF and TCF writing and speaking tasks ask about.')));

  // Group by band (e.g. "Everyday words 1–1000")
  const groups = new Map();
  for (const d of decks) { const k = d.band || 'More words'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(d); }
  for (const [band, list] of groups) {
    v.append(h('section', { class: 'section', style: { marginTop: '2rem' } }, h('h2', band),
      h('ul', { class: 'list' }, list.map(d => {
        const rec = prog.get(d.id);
        const st = isDone(rec) ? h('span', { class: 'tag green' }, icon('check'), 'Studied') : rec ? h('span', { class: 'tag blue' }, 'In progress') : null;
        return h('li', h('a', { href: `#/lesson/${d.id}`, class: 'row between', style: { padding: '.9rem 0', textDecoration: 'none', color: 'inherit', flexWrap: 'nowrap' } },
          h('div', { style: { minWidth: 0 } }, h('div', { style: { fontWeight: 700 } }, d.title), h('div', { class: 'small muted' }, [d.cefr && `about ${d.cefr.toUpperCase()}`, `${d.count} words`, d.theme].filter(Boolean).join(' · '))),
          st || h('span', { class: 'small muted nowrap' }, `${d.minutes} min`)));
      }))));
  }
}

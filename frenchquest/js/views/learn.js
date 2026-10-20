import { h } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { bar } from '../ui/components.js';
import { getCourse } from '../engine/content.js';
import { pathStatus } from '../engine/progress.js';

const DONE = new Set(['completed', 'completed-weak', 'tested-out']);

export default async function learn({ level }, root) {
  const [course, path] = await Promise.all([getCourse(), pathStatus()]);
  const byId = new Map(path.map(l => [l.id, l]));
  const current = path.find(l => !l.optional && l.status === 'in-progress') || path.find(l => !l.optional && l.status === 'available');
  const v = h('div', { class: 'view narrow' });
  root.append(v);
  v.append(h('div', { class: 'page-head' }, h('h1', 'Your course'),
    h('p', 'Four levels of twelve units. Each unit has five core lessons ending in a checkpoint, then a workshop of extra practice. Lessons open in order.')),
    h('nav', { class: 'exam-switch', 'aria-label': 'Choose a level', style: { marginBottom: '2rem' } },
      [['', 'All'], ...course.levels.map(lv => [lv.id, lv.id.toUpperCase()])].map(([id, label]) =>
        h('a', { href: id ? `#/learn/${id}` : '#/learn', 'aria-current': (level || '') === id ? 'page' : null }, label))));
  v.append(h('a', { class: 'panel tint sounds-cta', href: '#/sounds' },
    h('span', { class: 'sounds-cta-ic', 'aria-hidden': 'true' }, 'Aa'),
    h('span', { style: { flex: 1, minWidth: 0 } }, h('strong', 'Sounds & alphabet'),
      h('span', { class: 'small muted', style: { display: 'block' } }, 'Letters, accents, numbers and every French sound, with English and Hindi comparisons and listening drills.')),
    icon('next')));

  for (const lv of course.levels) {
    if (level && lv.id !== level) continue;
    const ls = lv.units.flatMap(u => u.lessons.map(l => byId.get(l.id)));
    const doneN = ls.filter(l => DONE.has(l.status)).length;
    const published = ls.filter(l => l.status !== 'soon').length;
    const sec = h('section', { class: 'level', 'aria-labelledby': `lv-${lv.id}` },
      h('div', { class: 'level-head' },
        h('span', { class: 'level-code', 'aria-hidden': 'true' }, lv.id.toUpperCase()),
        h('div', { style: { flex: '1 1 12rem' } }, h('h2', { id: `lv-${lv.id}` }, h('span', { class: 'sr-only' }, `${lv.id.toUpperCase()} `), lv.title), h('p', { class: 'small muted', style: { margin: 0 } }, lv.outcome)),
        published ? h('div', { style: { flex: '1 1 10rem', maxWidth: '16rem' } }, bar((doneN / ls.length) * 100, 'green'), h('div', { class: 'xs muted', style: { marginTop: '4px' } }, `${doneN} of ${ls.length} lessons done`)) : h('span', { class: 'tag' }, 'Coming soon')));
    v.append(sec);
    if (!published) continue;

    lv.units.forEach((u, ui) => {
      const uls = u.lessons.map(l => byId.get(l.id));
      const ud = uls.filter(l => DONE.has(l.status)).length;
      const isCurrent = current && uls.some(l => l.id === current.id);
      const mastered = ud === uls.length;
      const anyPublished = uls.some(l => l.status !== 'soon');
      const det = h('details', { class: ['unit', mastered && 'mastered', isCurrent && 'current'], open: isCurrent || null },
        h('summary',
          h('span', { class: 'unit-num', 'aria-hidden': 'true' }, String(ui + 1).padStart(2, '0')),
          h('span', h('div', { class: 'unit-title' }, h('span', { class: 'sr-only' }, `Unit ${ui + 1}: `), u.title), h('div', { class: 'unit-sub' }, u.outcome || '')),
          h('span', { class: 'small muted nowrap' }, mastered ? h('span', { class: 'tag green' }, icon('check'), 'Done') : anyPublished ? `${ud}/${uls.length}` : h('span', { class: 'tag' }, 'Soon'))),
        !mastered && anyPublished && !/-12$/.test(u.id) && uls.some(l => l.status === 'locked') && h('p', { class: 'small muted', style: { padding: '.75rem 1rem 0', margin: 0 } },
          'Already know this? ', h('a', { href: `#/lesson/${uls[4].id}` }, 'Take the unit checkpoint'), ' — 80% or more marks the unit’s lessons as done.'),
        h('ul', { class: 'lessons' }, uls.map((l, li) => {
          const cls = { completed: 'done', 'completed-weak': 'weak', 'tested-out': 'done', 'in-progress': 'now', available: current?.id === l.id ? 'now' : '', locked: 'locked', soon: 'soon' }[l.status];
          const right = l.status === 'soon' ? h('span', { class: 'xs' }, 'Coming soon')
            : l.status === 'locked' ? h('span', { class: 'xs', 'aria-label': 'Locked' }, icon('lock'))
            : l.status === 'completed-weak' ? h('span', { class: 'tag amber' }, 'Practise again')
            : l.status === 'in-progress' ? h('span', { class: 'tag blue' }, 'In progress')
            : l.optional && !DONE.has(l.status) ? h('span', { class: 'tag violet' }, 'Optional')
            : h('span', { class: 'xs muted' }, `${l.minutes || 10} min`);
          const inner = [
            h('span', { class: 'st', 'aria-hidden': 'true' }, cls === 'done' ? icon('check') : cls === 'weak' ? '!' : null),
            h('span', h('span', { class: 'sr-only' }, `Lesson ${li + 1}, ${l.status.replace('-', ' ')}: `), l.title),
            right,
          ];
          return h('li', { class: cls }, l.status === 'soon' ? h('div', { class: 'ghostrow' }, inner) : h('a', { href: `#/lesson/${l.id}` }, inner));
        })));
      sec.append(det);
    });
  }
}

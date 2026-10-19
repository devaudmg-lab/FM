import { h, clear } from '../ui/h.js';
import { icon, BRAND_MARK } from '../ui/icons.js';
import { setPrefs, prefs } from '../store/prefs.js';
import * as db from '../store/db.js';
import { today } from '../engine/progress.js';

const LEVEL_HOURS = [['A1', 60, 100], ['A2', 160, 200], ['B1', 350, 400], ['B2', 550, 650]];

export default async function welcome(params, root) {
  document.body.classList.add('in-lesson');
  const answers = { name: '', exam: 'tef', minutes: prefs().dailyMinutes, start: 'greetings', ...(await db.getMeta('goal') || {}) };
  const v = h('div', { class: 'view narrow', style: { margin: '0 auto' } });
  root.append(v);
  let step = 0;

  const radio = (name, value, title, sub) => h('label', { class: 'choice' },
    h('input', { type: 'radio', name, value, checked: answers[name] == value, onchange: () => { answers[name] = isNaN(+value) ? value : +value; } }),
    h('span', h('b', title), sub && h('span', sub)));

  const steps = [
    () => [
      h('div', { class: 'row', style: { marginBottom: '1.5rem' } }, h('span', { style: { width: '44px' }, ref: el => { el.innerHTML = BRAND_MARK; } })),
      h('h1', 'Welcome to FrenchQuest'),
      h('p', { class: 'muted', style: { fontSize: 'var(--fs-lg)' } }, 'A structured path from your first “bonjour” to B2, with spaced review so you keep what you learn, and practice for TEF Canada and TCF Canada.'),
      h('div', { class: 'field', style: { margin: '2rem 0' } },
        h('label', { for: 'nm' }, 'What should we call you? (optional)'),
        h('input', { id: 'nm', type: 'text', value: answers.name, autocomplete: 'given-name', oninput: e => { answers.name = e.target.value.trim(); } })),
      h('p', { class: 'small muted' }, 'Everything you do is saved in this browser only. No account, no tracking.'),
    ],
    () => [
      h('h1', 'Which exam are you preparing for?'),
      h('p', { class: 'muted' }, 'The course is the same for everyone; this only sets the default in the Exam Lab. You can change it any time.'),
      h('div', { class: 'choice-grid', role: 'radiogroup', style: { margin: '1.5rem 0' } },
        radio('exam', 'tef', 'TEF Canada', '4 tests · reading 40 Q, listening 40 Q, 2 writing and 2 speaking tasks'),
        radio('exam', 'tcf', 'TCF Canada', '4 tests · reading 39 Q, listening 39 Q, 3 writing and 3 speaking tasks'),
        radio('exam', 'undecided', 'Not sure yet', 'We will help you compare once you reach A2'),
        radio('exam', 'none', 'No exam', 'I just want to learn French')),
    ],
    () => [
      h('h1', 'How much time can you give each day?'),
      h('p', { class: 'muted' }, 'Consistency beats intensity. Pick what you can keep up on an ordinary day.'),
      h('div', { class: 'choice-grid', role: 'radiogroup', style: { margin: '1.5rem 0' } },
        [30, 45, 60, 75, 90].map(m => radio('minutes', String(m), `${m} minutes`, m >= 75 ? 'Intensive' : m >= 60 ? 'Strong pace' : m >= 45 ? 'Steady' : 'Light'))),
    ],
    () => [
      h('h1', 'Where are you starting from?'),
      h('div', { class: 'choice-grid', role: 'radiogroup', style: { margin: '1.5rem 0' } },
        radio('start', 'zero', 'Complete beginner', 'I know almost no French'),
        radio('start', 'greetings', 'I know greetings', 'Bonjour, merci, comment ça va…'),
        radio('start', 'a1', 'Some A1', 'I can introduce myself and use simple sentences'),
        radio('start', 'a2', 'A2 or above', 'I can handle everyday situations')),
      h('p', { class: 'small muted' }, 'Everyone starts at lesson 1 — early lessons are quick if you already know them, and they set up the sounds and spelling the rest of the course relies on. You can open any lesson from the course map.'),
    ],
    () => {
      const hpd = answers.minutes / 60;
      const rows = LEVEL_HOURS.map(([lv, lo, hi]) => {
        const mlo = lo / hpd / 30, mhi = hi / hpd / 30;
        return h('tr', h('td', h('strong', lv)), h('td', `${lo}–${hi} h`), h('td', `${fmtMonths(mlo)}–${fmtMonths(mhi)}`));
      });
      return [
        h('h1', 'An honest look at the road ahead'),
        h('p', 'Commonly published estimates of total guided study hours to reach each level, and what that means at ', h('strong', `${answers.minutes} minutes a day`), ':'),
        h('div', { class: 'table-wrap' }, h('table', { class: 'data', style: { margin: '1rem 0' } }, h('thead', h('tr', h('th', 'Level'), h('th', 'Total hours'), h('th', 'At your pace'))), h('tbody', rows))),
        h('p', { class: 'small muted' }, 'These are planning ranges, not promises — results vary a lot from person to person. Conversation practice, a tutor, and extra listening all speed things up. Canada’s NCLC 7 usually needs solid B1–B2 skills plus exam practice in all four abilities.'),
        h('p', 'FrenchQuest will forecast from your real progress after two weeks and adjust as you go.'),
      ];
    },
  ];

  const render = () => {
    clear(v);
    v.append(h('div', { class: 'steps-dots', style: { margin: '0 0 2rem' }, 'aria-hidden': 'true' }, steps.map((s, i) => h('i', { class: i < step ? 'done' : i === step ? 'now' : null }))));
    v.append(...steps[step]().flat());
    const last = step === steps.length - 1;
    v.append(h('div', { class: 'row', style: { marginTop: '2rem' } },
      step > 0 && h('button', { class: 'btn ghost', onclick: () => { step--; render(); } }, icon('back'), 'Back'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn primary lg', onclick: async () => {
        if (!last) { step++; render(); v.querySelector('h1')?.focus(); return; }
        setPrefs({ dailyMinutes: answers.minutes });
        await db.setMeta('goal', { name: answers.name, exam: answers.exam, minutes: answers.minutes, start: answers.start, target: 'NCLC 7' });
        if (!(await db.getMeta('startedOn'))) await db.setMeta('startedOn', today());
        await db.setMeta('onboarded', true);
        document.body.classList.remove('in-lesson');
        location.hash = '#/';
      } }, last ? 'Start learning' : 'Continue', icon('next'))));
    const h1 = v.querySelector('h1');
    if (h1) h1.tabIndex = -1;
  };
  render();
  return () => document.body.classList.remove('in-lesson');
}

function fmtMonths(m) {
  if (m < 1) return `${Math.max(1, Math.round(m * 4))} wk`;
  return `${Math.round(m)} mo`;
}

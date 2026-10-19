import { h, clear, fr } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { md } from '../ui/md.js';
import { toast, sayButton, feedback, bar, confirmDialog } from '../ui/components.js';
import { loadExam, abilitySummary, saveSession, sessions, recentCount, estimate, nclcFor, microSkillBreakdown, MICRO_LABEL, EXAMS, ABILITY_ORDER, ABILITY_EN } from '../engine/exam.js';
import { countWords } from '../engine/evaluate.js';
import { sayLines, stop as stopAudio } from '../media/speech.js';
import { canRecord, startRecording, saveRecording, playBlob } from '../media/recorder.js';
import { sttEnabled, listenOnce } from '../media/stt.js';
import { award } from '../engine/gamification.js';
import { accentBar } from '../ui/components.js';
import { aiReady, completeJSON } from '../ai/provider.js';
import { renderFeedback, DISCLAIMER } from '../ai/coach.js';
import * as db from '../store/db.js';

const DISCLAIM = 'Practice estimates are unofficial and approximate. They never predict an official result. Check IRCC for the requirements of your program.';

export default async function examView(params, root) {
  if (!params.exam) {
    const goal = await db.getMeta('goal');
    location.replace(`#/exam/${goal?.exam === 'tcf' ? 'tcf' : 'tef'}`);
    return;
  }
  const exam = params.exam === 'tcf' ? 'tcf' : 'tef';
  const data = await loadExam(exam);
  if (!data.format) { root.append(h('div', { class: 'view narrow' }, h('h1', 'Exam data is missing'), h('p', 'The exam format file could not be loaded.'))); return; }
  if (params.taskId) return runner(root, data, params.ability, params.taskId);
  if (params.ability) return abilityPage(root, data, params.ability);
  return hub(root, data);
}

function switcher(exam, suffix = '') {
  return h('nav', { class: 'exam-switch', 'aria-label': 'Choose exam' },
    Object.entries(EXAMS).map(([id, name]) => h('a', { href: `#/exam/${id}${suffix}`, 'aria-current': id === exam ? 'page' : null }, name)));
}

const disclaimer = () => h('p', { class: 'disclaimer' }, icon('info'), DISCLAIM);

// ---------- Hub ----------
async function hub(root, data) {
  const { exam, format, nclc, banks } = data;
  const target = (await db.getMeta(`target-${exam}`)) || 7;
  const summary = await abilitySummary(exam, nclc);
  const v = h('div', { class: 'view' });
  root.append(v);
  v.append(h('div', { class: 'page-head' },
    h('div', { class: 'row between', style: { alignItems: 'flex-end' } },
      h('div', h('h1', 'Exam Lab'), h('p', `Format-accurate practice for ${format.name}, with an honest estimate of where you stand.`)),
      switcher(exam))));

  v.append(h('div', { class: 'row', style: { marginBottom: '1.5rem' } },
    h('label', { for: 'tgt', class: 'small', style: { fontWeight: 700 } }, 'My target'),
    h('select', { id: 'tgt', style: { width: 'auto' }, onchange: async e => { await db.setMeta(`target-${exam}`, +e.target.value); toast('Target saved'); examView({ exam }, clear(root)); } },
      [4, 5, 6, 7, 8, 9, 10].map(n => h('option', { value: n, selected: n === target }, `NCLC ${n}${n === 7 ? ' (Express Entry minimum)' : ''}`))),
    h('span', { class: 'small muted' }, 'in all four abilities')));

  const grid = h('div', { class: 'grid grid-4 abilities' });
  for (const ab of ABILITY_ORDER) {
    const f = format.abilities[ab];
    const s = summary[ab];
    const count = ab === 'co' || ab === 'ce' ? (banks[ab]?.sets?.length || 0) : (banks[ab]?.tasks?.length || 0);
    const reached = s && s.lo >= target;
    grid.append(h('section', { class: 'panel ability', 'aria-labelledby': `ab-${ab}` },
      h('div', { class: 'code', 'aria-hidden': 'true' }, ab.toUpperCase()),
      h('div', h('h3', { id: `ab-${ab}`, style: { margin: 0 } }, ABILITY_EN[ab]), h('div', { class: 'small muted', lang: 'fr' }, f.name)),
      h('div', { class: 'small muted' }, f.items ? `${f.items} questions · ${f.minutes} min` : `${f.sections.length} tasks · ${f.minutes} min`),
      h('div', { class: 'est' }, s
        ? [h('strong', s.label), h('span', { class: 'muted' }, ` · ${s.confidence} confidence`), reached && h('div', h('span', { class: 'tag green' }, icon('check'), `At or above NCLC ${target}`))]
        : h('span', { class: 'muted' }, 'No practice yet')),
      h('div', { class: 'actions' }, h('a', { class: 'btn primary sm', href: `#/exam/${exam}/${ab}` }, count ? 'Practise' : 'Open'))));
  }
  v.append(grid, h('div', { style: { marginTop: '1rem' } }, disclaimer()));

  // Stages
  v.append(h('section', { class: 'section' }, h('h2', 'How to prepare'),
    h('ol', { class: 'stage-list' },
      [['Learn the format', 'Read each test’s strategy and try one set without a timer.', 'Start from A2'],
        ['Focused practice', 'Untimed sets with explanations after every answer.', 'A2 and up'],
        ['Timed sets', 'The real time pressure: no feedback until the end, audio played once.', 'From B1'],
        ['Full mocks', 'All four abilities on one day, in exam order.', 'Late B1 / B2'],
        ['Fix your errors', 'After each set, your weakest micro-skills point to the lessons to redo.', 'Always']].map(([t, d, when]) =>
        h('li', { class: 'open' }, h('div', h('strong', t), h('div', { class: 'small muted' }, d)), h('span', { class: 'tag' }, when))))));

  // Format overview
  v.append(h('section', { class: 'section' }, h('h2', `${format.name} at a glance`),
    h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
      h('thead', h('tr', h('th', 'Test'), h('th', 'Time'), h('th', 'What you do'))),
      h('tbody', ABILITY_ORDER.map(ab => { const f = format.abilities[ab]; return h('tr', h('td', h('strong', ABILITY_EN[ab]), h('div', { class: 'xs muted', lang: 'fr' }, f.name)), h('td', `${f.minutes} min`), h('td', f.items ? `${f.items} multiple-choice questions` : f.sections.map(s => `${s.id}: ${s.en}${s.minWords ? ` (${s.minWords}${s.maxWords ? `–${s.maxWords}` : '+'} words)` : ''}`).join(' · '))); })))),
    h('ul', { class: 'small muted' }, format.notes.map(n => h('li', n))),
    h('p', { class: 'xs muted' }, `Format last verified ${format.verifiedOn}. `, h('a', { href: format.sourceUrl, target: '_blank', rel: 'noopener' }, 'Official page'))));

  // NCLC table
  const det = h('details', { class: 'deep' }, h('summary', icon('target'), `${format.name} score → NCLC table (IRCC)`),
    h('div', { class: 'deep-body' },
      h('p', { class: 'small muted' }, nclc.scoreBasis),
      h('div', { class: 'table-wrap' }, h('table', { class: 'data nclc-table' },
        h('thead', h('tr', h('th', 'NCLC'), ABILITY_ORDER.map(ab => h('th', ABILITY_EN[ab])))),
        h('tbody', nclc.abilities.co.map((row, i) => h('tr', { class: row.nclc === target ? 'target' : null }, h('td', String(row.nclc)),
          ABILITY_ORDER.map(ab => { const r = nclc.abilities[ab][i]; return h('td', r.min === r.max ? String(r.min) : `${r.min}–${r.max}`); })))))),
      h('p', { class: 'xs muted' }, `Last verified ${nclc.verifiedOn}. `, h('a', { href: nclc.sourceUrl, target: '_blank', rel: 'noopener' }, 'IRCC source'))));
  v.append(h('section', { class: 'section' }, h('h2', 'Official scores'), det, await officialResults(exam, nclc, target)));
}

async function officialResults(exam, table, target) {
  const box = h('div', { class: 'panel', style: { marginTop: '1rem' } });
  const list = (await db.all('officialResults')).filter(r => r.exam === exam).sort((a, b) => b.date.localeCompare(a.date));
  box.append(h('h3', 'Your official results'));
  if (list.length) {
    box.append(h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
      h('thead', h('tr', h('th', 'Test date'), ABILITY_ORDER.map(ab => h('th', ABILITY_EN[ab])), h('th', 'Valid until'), h('th', h('span', { class: 'sr-only' }, 'Delete')))),
      h('tbody', list.map(r => {
        const expiry = new Date(new Date(r.date).getTime() + 2 * 365.25 * 86400000);
        const soon = expiry - Date.now() < 90 * 86400000;
        return h('tr',
          h('td', r.date),
          ABILITY_ORDER.map(ab => { const n = nclcFor(table, ab, r.scores[ab]); return h('td', `${r.scores[ab]} `, h('span', { class: ['tag', n >= target ? 'green' : 'amber'] }, n ? `NCLC ${n}` : '< 4')); }),
          h('td', { class: soon ? 'nowrap' : null, style: soon ? { color: 'var(--red)' } : null }, expiry.toISOString().slice(0, 10)),
          h('td', h('button', { class: 'btn ghost sm', 'aria-label': `Delete result from ${r.date}`, onclick: async () => { if (await confirmDialog({ title: 'Delete this result?', confirm: 'Delete', danger: true })) { await db.del('officialResults', r.id); box.replaceWith(await officialResults(exam, table, target)); } } }, icon('trash'))));
      })))));
  } else box.append(h('p', { class: 'small muted' }, 'When you take the real test, log your scores here to see your NCLC level per ability and when the results expire (2 years).'));
  const scale = table.scale;
  const inputs = {};
  const date = h('input', { type: 'date', id: 'or-date', required: true });
  box.append(h('details', { class: 'deep', style: { marginTop: '1rem' } }, h('summary', icon('pencil'), 'Add an official result'),
    h('div', { class: 'deep-body' },
      exam === 'tef' && h('p', { class: 'small' }, 'Enter the “équivalence ancien score” for each ability — that is the number IRCC uses, not the score out of 699.'),
      h('div', { class: 'grid grid-4', style: { gap: '.75rem' } },
        h('div', { class: 'field' }, h('label', { for: 'or-date' }, 'Test date'), date),
        ABILITY_ORDER.map(ab => h('div', { class: 'field' }, h('label', { for: `or-${ab}` }, `${ABILITY_EN[ab]} (0–${scale[ab][1]})`), inputs[ab] = h('input', { type: 'number', id: `or-${ab}`, min: 0, max: scale[ab][1] })))),
      h('button', { class: 'btn primary', style: { marginTop: '1rem' }, onclick: async () => {
        if (!date.value) { date.focus(); return; }
        const scores = {};
        for (const ab of ABILITY_ORDER) { const val = Number(inputs[ab].value); if (inputs[ab].value === '' || val < 0 || val > scale[ab][1]) { inputs[ab].focus(); toast(`Enter a ${ABILITY_EN[ab].toLowerCase()} score between 0 and ${scale[ab][1]}.`); return; } scores[ab] = val; }
        await db.put('officialResults', { id: `or-${Date.now()}`, exam, date: date.value, scores });
        toast('Result saved');
        box.replaceWith(await officialResults(exam, table, target));
      } }, 'Save result'))));
  return box;
}

// ---------- Ability page ----------
async function abilityPage(root, data, ab) {
  const { exam, format, banks } = data;
  const f = format.abilities[ab];
  if (!f) { location.replace(`#/exam/${exam}`); return; }
  const hist = await sessions(exam, ab);
  const v = h('div', { class: 'view narrow' });
  root.append(v);
  v.append(h('a', { href: `#/exam/${exam}`, class: 'btn ghost sm', style: { marginBottom: '1rem' } }, icon('back'), 'Exam Lab'),
    h('div', { class: 'page-head' }, h('h1', `${ABILITY_EN[ab]} · ${format.name}`), h('p', { lang: 'fr' }, f.name)),
    h('div', { class: 'panel tint', style: { marginBottom: '2rem' } }, h('h3', 'Strategy'), h('ul', { class: 'small', style: { margin: 0, paddingLeft: '1.2em' } }, f.strategy.map(s => h('li', s)))));

  const bank = banks[ab];
  const list = h('ul', { class: 'list' });
  const best = id => Math.max(-1, ...hist.filter(s => s.setId === id).map(s => s.p));
  if (ab === 'co' || ab === 'ce') {
    for (const s of bank?.sets || []) {
      const b = best(s.id);
      list.append(h('li', { class: 'row between', style: { padding: '1rem 0' } },
        h('div', s.mock && h('span', { class: 'tag red', style: { marginBottom: '4px' } }, 'Full mock test'), h('div', h('strong', s.title)), h('div', { class: 'small muted' }, `${s.items.length} questions · level ${s.level.toUpperCase()} · ${s.minutes || s.items.length} min`), b >= 0 && h('div', { class: 'small' }, `Best: ${Math.round(b * 100)}%`)),
        h('div', { class: 'row' },
          h('a', { class: 'btn sm', href: `#/exam/${exam}/${ab}/run/${s.id}?mode=practice` }, 'Practice'),
          h('a', { class: 'btn primary sm', href: `#/exam/${exam}/${ab}/run/${s.id}?mode=timed` }, icon('clock'), 'Timed'))));
    }
  } else {
    for (const t of bank?.tasks || []) {
      const sec = f.sections.find(x => x.id === t.section);
      list.append(h('li', { class: 'row between', style: { padding: '1rem 0' } },
        h('div', h('span', { class: 'tag blue' }, `Section ${t.section}`), ' ', h('strong', t.title), h('div', { class: 'small muted' }, `${sec?.en || ''} · ${t.minutes || sec?.minutes || ''} min${t.minWords ? ` · ${t.minWords}+ words` : ''} · level ${String(t.level || '').toUpperCase()}`)),
        h('div', { class: 'row' },
          h('a', { class: 'btn sm', href: `#/exam/${exam}/${ab}/run/${t.id}?mode=practice` }, 'Practice'),
          h('a', { class: 'btn primary sm', href: `#/exam/${exam}/${ab}/run/${t.id}?mode=timed` }, icon('clock'), 'Timed'))));
    }
  }
  v.append(h('h2', { style: { fontSize: 'var(--fs-lg)' } }, ab === 'co' || ab === 'ce' ? 'Practice sets' : 'Practice tasks'),
    list.children.length ? list : h('p', { class: 'muted' }, 'Practice material for this test is being prepared.'));
  if (hist.length) {
    v.append(h('section', { class: 'section' }, h('h2', 'Your history'), h('ul', { class: 'list small' }, hist.slice(0, 12).map(s => h('li', { class: 'row between', style: { padding: '.5rem 0' } },
      h('span', `${new Date(s.ts).toLocaleDateString()} · ${s.title}${s.mode === 'timed' ? ' · timed' : ''}`), h('span', h('strong', `${Math.round(s.p * 100)}%`), ` · ${s.estimate?.label || ''}`))))));
  }
  v.append(disclaimer());
}

// ---------- Runner ----------
function timerEl(seconds, { onEnd, paused = () => false } = {}) {
  const el = h('span', { class: 'timer', role: 'timer', 'aria-live': 'off' }, icon('clock'), h('span'));
  let left = seconds;
  const txt = el.lastChild;
  const draw = () => { txt.textContent = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`; el.classList.toggle('low', left <= 60); };
  draw();
  const iv = setInterval(() => {
    if (paused()) return;
    left--; draw();
    if (left === 60) toast('One minute left.');
    if (left <= 0) { clearInterval(iv); onEnd?.(); }
  }, 1000);
  return { el, stop: () => clearInterval(iv), left: () => left };
}

async function runner(root, data, ab, taskId) {
  document.body.classList.add('in-lesson');
  const mode = new URLSearchParams(location.hash.split('?')[1] || '').get('mode') === 'timed' ? 'timed' : 'practice';
  const cleanup = [];
  const done = () => { cleanup.forEach(f => f()); stopAudio(); document.body.classList.remove('in-lesson'); };
  if (ab === 'co' || ab === 'ce') await runMcq(root, data, ab, taskId, mode, cleanup);
  else await runTask(root, data, ab, taskId, mode, cleanup);
  return done;
}

async function runMcq(root, data, ab, setId, mode, cleanup) {
  const { exam, format, nclc, banks } = data;
  const set = banks[ab]?.sets?.find(s => s.id === setId);
  if (!set) { root.append(h('div', { class: 'view narrow' }, h('h1', 'Set not found'), h('a', { class: 'btn', href: `#/exam/${exam}/${ab}` }, 'Back'))); return; }
  const sources = new Map((set.audios || set.docs || []).map(x => [x.id, x]));
  const maxPlays = mode === 'timed' ? (format.abilities[ab].maxPlays || Infinity) : Infinity;
  const answers = new Array(set.items.length).fill(null);
  const plays = new Map();
  let i = 0;
  const top = h('header', { class: 'exam-run-top' });
  const body = h('div', { class: 'review-wrap', style: { maxWidth: '46rem' } });
  root.append(top, body);
  const t = mode === 'timed' ? timerEl((set.minutes || set.items.length) * 60, { onEnd: () => { toast('Time is up.'); finish(); } }) : null;
  if (t) cleanup.push(t.stop);
  let finished = false;

  const renderTop = () => clear(top).append(
    h('button', { class: 'btn icon ghost', 'aria-label': 'Quit', onclick: async () => { if (answers.some(a => a != null) && !finished && !(await confirmDialog({ title: 'Quit this set?', body: 'Your answers will not be saved.', confirm: 'Quit' }))) return; location.hash = `#/exam/${exam}/${ab}`; } }, icon('x')),
    h('div', h('div', { class: 'small' }, h('strong', set.title), ` · ${mode === 'timed' ? 'Timed' : 'Practice'}`), bar(((i) / set.items.length) * 100, 'thin')),
    h('div', { class: 'row' }, h('span', { class: 'small muted' }, `${Math.min(i + 1, set.items.length)} / ${set.items.length}`), t?.el));

  const show = () => {
    stopAudio();
    if (i >= set.items.length) return finish();
    renderTop();
    clear(body);
    const it = set.items[i];
    const src = sources.get(it.audioId || it.docId);
    if (ab === 'ce' && src) {
      body.append(h('article', { class: 'exam-doc' }, h('div', { class: 'xs muted' }, src.type || 'document'), src.title && h('h3', { lang: 'fr' }, src.title),
        ...String(src.fr).split('\n').map(p => h('p', { class: 'fr', lang: 'fr' }, p))));
    }
    if (ab === 'co' && src) {
      const key = src.id;
      const used = plays.get(key) || 0;
      const left = maxPlays - used;
      const playBtn = h('button', { class: 'btn primary', disabled: left <= 0, onclick: async () => {
        plays.set(key, (plays.get(key) || 0) + 1);
        playBtn.disabled = true;
        status.textContent = 'Playing…';
        await sayLines(src.lines);
        const rem = maxPlays - plays.get(key);
        status.textContent = rem <= 0 ? 'Played. Choose your answer.' : Number.isFinite(rem) ? `You can play it ${rem} more time${rem > 1 ? 's' : ''}.` : 'Play again if you need to.';
        playBtn.disabled = rem <= 0;
      } }, icon('play'), used ? 'Play again' : 'Play the recording');
      const status = h('span', { class: 'small muted' }, Number.isFinite(maxPlays) ? (left > 0 ? `Played once only, as in the exam.` : 'Already played.') : 'Practice mode: play as often as you like.');
      body.append(h('div', { class: 'exam-doc' }, src.context && h('div', { class: 'small muted', lang: 'fr', style: { marginBottom: '.75rem' } }, src.context), h('div', { class: 'row' }, playBtn, status)));
    }
    body.append(h('p', { class: 'ex-prompt', lang: 'fr' }, it.prompt));
    const opts = h('div', { class: 'options' });
    const btns = it.options.map((o, k) => h('button', { class: 'opt', type: 'button', 'aria-pressed': answers[i] === k ? 'true' : 'false', onclick: () => choose(k) }, h('span', { class: 'k' }, 'ABCD'[k]), h('span', { lang: 'fr' }, o)));
    opts.append(...btns);
    body.append(opts);
    const fbHost = h('div', { 'aria-live': 'polite' });
    body.append(fbHost);
    const nav = h('div', { class: 'row', style: { marginTop: '1.5rem' } },
      mode === 'timed' && i > 0 && h('button', { class: 'btn ghost', onclick: () => { i--; show(); } }, icon('back'), 'Previous'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: () => { i++; show(); } }, i === set.items.length - 1 ? 'Finish' : 'Next', icon('next')));
    body.append(nav);
    function choose(k) {
      if (mode === 'practice' && answers[i] != null) return;
      answers[i] = k;
      btns.forEach((b, x) => b.setAttribute('aria-pressed', x === k ? 'true' : 'false'));
      if (mode === 'practice') {
        btns.forEach((b, x) => { b.disabled = true; if (x === it.answer) b.classList.add('is-right'); else if (x === k) b.classList.add('is-wrong'); });
        const node = feedback(k === it.answer ? 'correct' : 'incorrect', { expected: k === it.answer ? null : it.options[it.answer], showDiff: false, explain: it.explain });
        if (ab === 'co' && src) node.append(h('details', h('summary', { class: 'small' }, 'Transcript'), src.lines.map(l => h('p', { class: 'small', lang: 'fr' }, h('strong', `${l.speaker} : `), l.fr))));
        fbHost.append(node);
      }
    }
    if (ab === 'co') body.querySelector('.exam-doc .btn')?.focus();
  };

  async function finish() {
    if (finished) return;
    finished = true;
    t?.stop();
    stopAudio();
    const results = set.items.map((it, k) => ({ ...it, chosen: answers[k], correct: answers[k] === it.answer }));
    const correct = results.filter(r => r.correct).length;
    const p = correct / set.items.length;
    const est = estimate(nclc, ab, p, { items: set.items.length, recentSessions: (await recentCount(exam, ab)) + 1 });
    await saveSession({ exam, ability: ab, setId: set.id, title: set.title, mode, correct, total: set.items.length, p, estimate: est, micro: microSkillBreakdown(results).map(([k, v]) => ({ k, ...v })) });
    await award('examMini', set.id);
    clear(top).append(h('a', { class: 'btn icon ghost', href: `#/exam/${exam}/${ab}`, 'aria-label': 'Close' }, icon('x')), h('strong', set.title), h('span'));
    clear(body);
    const weak = microSkillBreakdown(results).filter(([, v]) => v.wrong > 0).slice(0, 3);
    body.append(h('div', { class: 'result-hero' }, h('div', { class: 'big' }, `${correct}/${set.items.length}`),
      h('h1', { style: { marginTop: '1rem' } }, est.label),
      h('p', { class: 'muted' }, `Unofficial estimate · ${est.confidence} confidence (one ${set.items.length}-question set).`)),
      weak.length ? h('section', { class: 'panel' }, h('h3', 'Your biggest opportunities'),
        h('ol', weak.map(([k, v]) => h('li', h('strong', MICRO_LABEL[k] || k), ` — ${v.wrong} of ${v.n} wrong`))),
        h('p', { class: 'small muted', style: { margin: 0 } }, 'Practise these in your next sessions: review the explanations below, then retry a similar set in practice mode.')) : h('div', { class: 'notice info' }, icon('check'), h('div', 'No errors — try a harder set or timed mode.')),
      h('h2', { style: { fontSize: 'var(--fs-lg)', marginTop: '2rem' } }, 'Answers and explanations'),
      h('ol', { class: 'stack' }, results.map(r => {
        const src = sources.get(r.audioId || r.docId);
        return h('li', h('p', { lang: 'fr', style: { margin: 0 } }, h('strong', r.prompt)),
          h('p', { class: 'small', style: { margin: '.25rem 0' } }, r.correct ? h('span', { class: 'tag green' }, 'Correct') : h('span', { class: 'tag red' }, r.chosen == null ? 'No answer' : `You chose ${'ABCD'[r.chosen]}`), ' Answer: ', h('span', { lang: 'fr' }, `${'ABCD'[r.answer]}. ${r.options[r.answer]}`)),
          h('p', { class: 'small muted', style: { margin: 0 } }, r.explain),
          ab === 'co' && src && h('details', h('summary', { class: 'small' }, 'Transcript'), src.lines.map(l => h('p', { class: 'small', lang: 'fr' }, h('strong', `${l.speaker} : `), l.fr))));
      })),
      h('div', { class: 'row', style: { marginTop: '2rem' } }, h('a', { class: 'btn primary', href: `#/exam/${data.exam}/${ab}` }, 'Back to sets'), h('a', { class: 'btn', href: `#/exam/${data.exam}` }, 'Exam Lab')),
      h('div', { style: { marginTop: '1rem' } }, disclaimer()));
    body.querySelector('h1').focus();
  }
  show();
}

const RUBRIC = [
  ['task', 'Task completion: I did everything asked, for the right reader'],
  ['coherence', 'Organisation: clear plan, paragraphs, connectors'],
  ['vocabulary', 'Vocabulary: varied and precise'],
  ['grammar', 'Grammar: accurate tenses, agreement, complex sentences'],
  ['register', 'Register: the right level of formality'],
];

function rubricBlock(onChange) {
  const scores = {};
  return h('div', { class: 'rubric' }, RUBRIC.map(([k, label]) => {
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': label });
    [0, 1, 2, 3].forEach(n => seg.append(h('button', { type: 'button', 'aria-pressed': 'false', 'aria-label': `${label}: ${n} of 3`, onclick: e => {
      seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
      e.currentTarget.setAttribute('aria-pressed', 'true');
      scores[k] = n; onChange({ ...scores });
    } }, String(n))));
    return h('div', { class: 'rubric-row' }, h('span', label), seg);
  }));
}

async function runTask(root, data, ab, taskId, mode, cleanup) {
  const { exam, format, nclc, banks } = data;
  const task = banks[ab]?.tasks?.find(t => t.id === taskId);
  if (!task) { root.append(h('div', { class: 'view narrow' }, h('h1', 'Task not found'), h('a', { class: 'btn', href: `#/exam/${exam}/${ab}` }, 'Back'))); return; }
  const sec = format.abilities[ab].sections.find(s => s.id === task.section) || {};
  const top = h('header', { class: 'exam-run-top' });
  const body = h('div', { class: 'review-wrap', style: { maxWidth: '48rem' } });
  root.append(top, body);
  let paused = false;
  const head = h('div',
    h('div', { class: 'small muted' }, `${format.name} · ${format.abilities[ab].name} · Section ${task.section}`),
    h('h1', { style: { fontSize: 'var(--fs-xl)' } }, task.title),
    h('p', { class: 'fr', lang: 'fr', style: { fontSize: 'var(--fs-lg)' } }, task.prompt, ' ', sayButton(task.prompt)),
    task.promptEn && h('details', h('summary', { class: 'small' }, 'English translation'), h('p', { class: 'small en' }, task.promptEn)),
    task.document && h('div', { class: 'exam-doc' }, String(task.document).split('\n').map(p => h('p', { class: 'fr', lang: 'fr' }, p))));
  body.append(head);
  const after = h('div');

  if (ab === 'ee') {
    const minutes = task.minutes || sec.minutes || 30;
    const t = timerEl(minutes * 60, { onEnd: () => submit(true), paused: () => paused });
    cleanup.push(t.stop);
    clear(top).append(
      h('a', { class: 'btn icon ghost', href: `#/exam/${exam}/ee`, 'aria-label': 'Quit' }, icon('x')),
      h('strong', { class: 'small' }, mode === 'timed' ? 'Timed — no pausing' : 'Practice'),
      h('div', { class: 'row' }, t.el, mode === 'practice' && h('button', { class: 'btn sm', onclick: e => { paused = !paused; e.currentTarget.textContent = paused ? 'Resume' : 'Pause'; } }, 'Pause')));
    const ta = h('textarea', { class: 'ruled', lang: 'fr', spellcheck: 'false', rows: 12, 'aria-label': 'Your answer in French' });
    const min = task.minWords || sec.minWords || 0, max = task.maxWords || sec.maxWords || 0;
    const wc = h('span', { class: 'wordcount', 'aria-live': 'polite' });
    const upd = () => { const n = countWords(ta.value); wc.textContent = `${n} words · required ${min}${max ? `–${max}` : '+'}`; wc.className = 'wordcount' + (n >= min && (!max || n <= max) ? ' ok' : max && n > max ? ' over' : ''); };
    ta.addEventListener('input', upd); upd();
    const draftKey = `fq.draft.${task.id}`;
    try { ta.value = sessionStorage.getItem(draftKey) || ''; upd(); } catch { /* */ }
    ta.addEventListener('input', () => { try { sessionStorage.setItem(draftKey, ta.value); } catch { /* */ } });
    const checklist = task.checklist?.length ? h('ul', { class: 'checklist' }, task.checklist.map(c => h('li', h('label', h('input', { type: 'checkbox' }), c)))) : null;
    const submitBtn = h('button', { class: 'btn primary', onclick: () => submit(false) }, 'Submit');
    body.append(ta, h('div', { class: 'row between', style: { marginTop: '.5rem' } }, wc), accentBar(() => ta), mode === 'practice' && task.tips?.length && h('details', { class: 'deep', style: { marginTop: '1rem' } }, h('summary', icon('bulb'), 'Tips for this task'), h('ul', { class: 'deep-body small' }, task.tips.map(x => h('li', x)))), checklist, h('div', { class: 'ex-actions' }, submitBtn), after);
    async function submit(timeUp) {
      if (submitBtn.disabled) return;
      if (!ta.value.trim() && !timeUp) { ta.focus(); return; }
      t.stop();
      submitBtn.disabled = true;
      ta.readOnly = true;
      try { sessionStorage.removeItem(draftKey); } catch { /* */ }
      const words = countWords(ta.value);
      const entry = { id: `w-${Date.now()}`, ts: Date.now(), kind: 'writing', exam, prompt: `${format.name} ${task.section}: ${task.title}`, text: ta.value, words };
      await db.put('portfolio', entry);
      reviewProduction({ after, task, exam, ab, nclc, entry, text: ta.value, words, min, max });
    }
  } else {
    // Speaking
    const prep = task.prepSeconds || 0;
    const speak = task.speakSeconds || (sec.minutes || 5) * 60;
    clear(top).append(h('a', { class: 'btn icon ghost', href: `#/exam/${exam}/eo`, 'aria-label': 'Quit' }, icon('x')), h('strong', { class: 'small' }, mode === 'timed' ? 'Timed' : 'Practice'), h('span'));
    if (task.usefulPhrases?.length && mode === 'practice') body.append(h('details', { class: 'deep' }, h('summary', icon('book'), 'Useful phrases'), h('ul', { class: 'examples deep-body' }, task.usefulPhrases.map(u => h('li', h('div', fr(u.fr), u.en && h('span', { class: 'en' }, u.en)), sayButton(u.fr))))));
    const stage = h('div', { class: 'panel', style: { marginTop: '1rem' } });
    body.append(stage, after);
    const examiner = task.examinerLines || [];
    let ei = 0;
    const examinerBtn = () => examiner.length ? h('button', { class: 'btn', onclick: e => { const line = examiner[ei % examiner.length]; ei++; sayLines([{ fr: line, speaker: 'examinateur' }]); e.currentTarget.nextSibling.textContent = `Examiner: ${line}`; } }, icon('chat'), 'Examiner speaks') : null;
    const startPrep = () => {
      clear(stage);
      if (prep) {
        const tp = timerEl(prep, { onEnd: startSpeak });
        cleanup.push(tp.stop);
        stage.append(h('h3', 'Preparation'), h('p', { class: 'small muted' }, 'Plan your questions or arguments. Notes help, but do not write full sentences.'), h('textarea', { rows: 4, 'aria-label': 'Notes', placeholder: 'Notes…' }), h('div', { class: 'row', style: { marginTop: '.5rem' } }, tp.el, h('button', { class: 'btn primary', onclick: () => { tp.stop(); startSpeak(); } }, 'Start speaking now')));
      } else startSpeak();
    };
    let ctl = null, sttP = null;
    const startSpeak = async () => {
      clear(stage);
      if (canRecord()) {
        try { ctl = await startRecording({ maxMs: (speak + 30) * 1000 }); } catch { ctl = null; toast('The microphone is blocked; you can still practise aloud.'); }
      }
      if (sttEnabled()) sttP = listenOnce({ maxMs: speak * 1000 }).catch(() => null);
      const ts = timerEl(speak, { onEnd: finishSpeak });
      cleanup.push(ts.stop, () => ctl?.cancel());
      stage.append(h('h3', ctl ? 'Recording — speak now' : 'Speak now'), h('div', { class: 'row' }, ts.el, examinerBtn(), h('span', { class: 'small muted' })),
        h('p', { class: 'small muted' }, examiner.length ? 'Press “Examiner speaks” to hear what the examiner might say, then respond.' : ''),
        h('button', { class: 'btn primary', onclick: () => { ts.stop(); finishSpeak(); } }, icon('stop'), 'Finish'));
    };
    const finishSpeak = async () => {
      stopAudio();
      let rec = null;
      if (ctl) { rec = await ctl.stop(); ctl = null; }
      const stt = sttP ? await Promise.race([sttP, new Promise(r => setTimeout(() => r(null), 1500))]) : null;
      clear(stage).append(h('h3', 'Done'), rec && h('button', { class: 'btn', onclick: () => playBlob(rec.blob) }, icon('play'), 'Play my recording'));
      const entry = { id: `s-${Date.now()}`, ts: Date.now(), kind: 'speaking', exam, prompt: `${format.name} ${task.section}: ${task.title}`, transcript: stt?.transcript || '' };
      if (rec) { entry.recordingId = await saveRecording(rec, { portfolioId: entry.id }); entry.ms = rec.ms; }
      await db.put('portfolio', entry);
      reviewProduction({ after, task, exam, ab, nclc, entry, text: entry.transcript, spoken: true });
    };
    stage.append(h('p', prep ? `You will have ${Math.round(prep / 60)} min to prepare, then about ${Math.round(speak / 60)} min to speak.` : `You will speak for about ${Math.round(speak / 60)} min. ${canRecord() ? 'Your answer is recorded on this device so you can listen back.' : ''}`),
      h('button', { class: 'btn primary lg', onclick: startPrep }, prep ? 'Start preparation' : 'Start'));
  }
}

function reviewProduction({ after, task, exam, ab, nclc, entry, text, words, min, max, spoken = false }) {
  clear(after);
  if (!spoken && min && words < min) after.append(h('div', { class: 'notice', style: { marginTop: '1rem' } }, icon('alert'), h('div', `Your text has ${words} words; the minimum is ${min}. Short answers lose points on the real test.`)));
  if (!spoken && max && words > max) after.append(h('div', { class: 'notice', style: { marginTop: '1rem' } }, icon('alert'), h('div', `Your text has ${words} words; the range ends at ${max}.`)));
  after.append(h('h2', { style: { fontSize: 'var(--fs-lg)', marginTop: '2rem' } }, 'Compare with model answers'),
    ...(task.models || []).map(m => h('div', { class: 'model' }, h('div', { class: 'lbl' }, m.label), h('p', { class: 'fr', lang: 'fr', style: { whiteSpace: 'pre-wrap' } }, m.fr, ' ', sayButton(m.fr)), m.en && h('p', { class: 'small en' }, m.en))),
    h('h2', { style: { fontSize: 'var(--fs-lg)', marginTop: '2rem' } }, 'Rate your answer honestly'),
    h('p', { class: 'small muted' }, '0 = not yet, 1 = partly, 2 = mostly, 3 = fully. Compare with the models above.'));
  const estHost = h('div', { 'aria-live': 'polite', style: { marginTop: '1rem' } });
  let saved = null;
  after.append(rubricBlock(async scores => {
    entry.self = scores; await db.put('portfolio', entry);
    if (Object.keys(scores).length < RUBRIC.length) return;
    const p = Object.values(scores).reduce((a, b) => a + b, 0) / (RUBRIC.length * 3);
    const est = estimate(nclc, ab, p, { items: 5, recentSessions: await recentCount(exam, ab) });
    const rec = { exam, ability: ab, setId: task.id, title: task.title, mode: 'self', correct: null, total: 1, p, estimate: est, self: true };
    if (saved) { await db.put('examSessions', { ...saved, ...rec, ts: saved.ts }); } else { saved = await saveSession(rec); await award('mission', task.id); }
    clear(estHost).append(h('div', { class: 'panel tint' }, h('strong', `Self-assessed: ${est.label}`), h('p', { class: 'small muted', style: { margin: 0 } }, 'Based only on your own rating — useful for tracking, but people often rate themselves too high or too low.')));
  }), estHost);
  if (aiReady() && (text || '').trim()) {
    const host = h('div', { style: { marginTop: '1rem' } });
    const btn = h('button', { class: 'btn', onclick: async () => {
      btn.disabled = true;
      clear(host).append(h('p', { class: 'small muted', role: 'status' }, 'The AI coach is assessing your answer…'));
      try {
        const fb = await completeJSON({
          system: `You are a certified ${EXAMS[exam]} examiner. Assess this ${spoken ? 'speaking performance (from an automatic transcript: ignore punctuation, do not judge pronunciation)' : 'written answer'} against the official task demands and CEFR/NCLC descriptors. Be accurate and specific; never invent errors. Reply with ONE JSON object only: {"scores":{"task":0-3,"coherence":0-3,"vocabulary":0-3,"grammar":0-3,"register":0-3},"strengths":["…"],"fixes":[{"original":"…","corrected":"…","why":"short English"}],"corrected":"improved version keeping the candidate's ideas","levelEstimate":"e.g. NCLC 6","nextStep":"one concrete thing to practise, in English"}. Max 3 strengths and 5 fixes.`,
          messages: [{ role: 'user', content: `Task (section ${task.section}): ${task.prompt}\n${task.document ? `Document: ${task.document}\n` : ''}${task.minWords ? `Required length: ${task.minWords}–${task.maxWords || ''} words.\n` : ''}Candidate's ${spoken ? 'transcript' : 'text'}:\n"""${text}"""` }],
          maxTokens: 2000,
        });
        entry.ai = fb; await db.put('portfolio', entry);
        clear(host).append(renderFeedback(fb));
      } catch (e) { clear(host).append(h('div', { class: 'notice' }, icon('alert'), h('div', e.message)), btn); btn.disabled = false; }
    } }, icon('sparkle'), 'Get examiner-style AI feedback');
    host.append(btn, h('p', { class: 'xs muted' }, DISCLAIMER));
    after.append(host);
  }
  after.append(h('div', { class: 'row', style: { marginTop: '2rem' } }, h('a', { class: 'btn primary', href: `#/exam/${exam}/${ab}` }, 'Back to tasks'), h('a', { class: 'btn', href: '#/progress/portfolio' }, 'Open portfolio')),
    h('div', { style: { marginTop: '1rem' } }, disclaimer()));
  after.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

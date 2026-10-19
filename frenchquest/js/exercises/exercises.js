// Exercise renderers. Each returns { el, focus } and reports a result once via ctx.onResult.
// result: { status: 'correct'|'almost'|'incorrect', given, expected, latencyMs, hintUsed, production }
import { h, fr, clear } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { accentBar, feedback, sayButton, sayPair } from '../ui/components.js';
import { matchText, countWords } from '../engine/evaluate.js';
import { prefs } from '../store/prefs.js';
import { say } from '../media/speech.js';
import { canRecord, startRecording, saveRecording, playBlob } from '../media/recorder.js';
import { sttEnabled, listenOnce } from '../media/stt.js';
import * as db from '../store/db.js';

export const KIND_LABEL = {
  mcq: 'Choose the right answer',
  'listen-mcq': 'Listen and choose',
  translate: 'Translate into French',
  cloze: 'Fill in the blanks',
  reorder: 'Build the sentence',
  match: 'Match the pairs',
  dictation: 'Listen and write what you hear',
  write: 'Writing task',
  speak: 'Speaking task',
};

export const SKILL_OF = {
  mcq: 'reading', 'listen-mcq': 'listening', translate: 'writing', cloze: 'grammar',
  reorder: 'grammar', match: 'vocabulary', dictation: 'listening', write: 'writing', speak: 'speaking',
};
export const PRODUCTION = new Set(['translate', 'dictation', 'cloze', 'write', 'speak']);

export function shuffle(arr, seed = Math.random()) {
  const a = [...arr];
  let s = Math.floor(seed * 2 ** 31) || 1;
  const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const RENDER = { mcq, 'listen-mcq': listenMcq, translate, cloze, reorder, match, dictation, write, speak };

export function renderExercise(ex, ctx = {}) {
  const fn = RENDER[ex.type];
  if (!fn) return { el: h('div', { class: 'notice' }, `Unknown exercise type: ${ex.type}`), focus() {} };
  const t0 = performance.now();
  let reported = false;
  const shell = h('section', { class: 'ex', 'aria-label': KIND_LABEL[ex.type] || 'Exercise' });
  const fbHost = h('div', { 'aria-live': 'polite' });
  const state = { hintUsed: false };
  const api = {
    report(r) {
      if (reported) return;
      reported = true;
      const result = { latencyMs: Math.round(performance.now() - t0), hintUsed: state.hintUsed, production: PRODUCTION.has(ex.type), ...r };
      ctx.onResult?.(result, ex);
    },
    showFeedback(node) { clear(fbHost).append(node); if (ctx.continueLabel) fbHost.append(continueBtn()); },
    state,
  };
  const continueBtn = () => {
    const b = h('button', { class: 'btn primary', style: { marginTop: '1rem' }, onclick: () => ctx.onContinue?.() }, ctx.continueLabel, icon('next'));
    setTimeout(() => b.focus(), 30);
    return b;
  };
  if (!ctx.hideKind) shell.append(h('div', { class: 'ex-kind' }, ctx.kindLabel || KIND_LABEL[ex.type]));
  const body = fn(ex, ctx, api);
  shell.append(body.el, fbHost);
  return { el: shell, focus: body.focus || (() => shell.querySelector('input,textarea,button')?.focus()) };
}

function hintButton(ex, api, host, fallback) {
  const text = ex.hint || fallback;
  if (!text) return null;
  const b = h('button', { class: 'btn ghost sm', type: 'button', onclick: () => {
    api.state.hintUsed = true;
    b.remove();
    host.append(h('div', { class: 'hintbox' }, icon('bulb'), ' ', text));
  } }, icon('bulb'), 'Hint');
  return b;
}

function textAnswer(ex, ctx, api, { input, accepted, actions, onLocked }) {
  const check = () => {
    if (input.readOnly) return;
    const given = input.value;
    if (!given.trim()) { input.focus(); return; }
    const r = matchText(given, accepted, { accentMode: prefs().accentMode });
    input.readOnly = true;
    actions.querySelectorAll('button').forEach(b => { b.disabled = true; });
    onLocked?.();
    api.showFeedback(feedback(r.status, { expected: r.expected, given, note: r.note, explain: r.status === 'correct' ? ex.explainCorrect : (ex.explain || ex.feedback) }));
    api.report({ status: r.status, given, expected: r.expected });
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); check(); } });
  return check;
}

function dontKnow(api, ex, expected, lock) {
  return h('button', { class: 'btn ghost sm', type: 'button', onclick: () => {
    lock();
    api.showFeedback(feedback('incorrect', { expected, note: 'Here is the answer. It will come back in review.', explain: ex.explain }));
    api.report({ status: 'incorrect', given: '', expected });
  } }, 'Show answer');
}

// ---------- mcq ----------
function mcq(ex, ctx, api, { audioFirst = false } = {}) {
  const wrap = h('div');
  if (ex.prompt) wrap.append(h('p', { class: ['ex-prompt', ex.promptFr && 'fr'], lang: ex.promptFr ? 'fr' : null }, ex.prompt, ex.promptFr ? ' ' : null, ex.promptFr ? sayButton(ex.prompt) : null));
  if (audioFirst) {
    wrap.append(h('div', { class: 'row', style: { marginBottom: '1rem' } }, sayPair(ex.fr, { audio: ex.audio }), h('span', { class: 'small muted' }, ex.maxPlays ? `You can play it ${ex.maxPlays} time${ex.maxPlays > 1 ? 's' : ''}.` : 'Play as often as you need.')));
  }
  const order = shuffle(ex.options.map((o, i) => i), ctx.seed);
  const opts = h('div', { class: 'options', role: 'group' });
  const buttons = [];
  const choose = i => {
    if (buttons[0].disabled) return;
    const correct = Array.isArray(ex.answer) ? ex.answer.includes(i) : ex.answer === i;
    buttons.forEach((b, k) => {
      b.disabled = true;
      const oi = order[k];
      const isAns = Array.isArray(ex.answer) ? ex.answer.includes(oi) : ex.answer === oi;
      if (isAns) b.classList.add('is-right');
      if (oi === i && !correct) b.classList.add('is-wrong');
      if (oi === i) b.setAttribute('aria-pressed', 'true');
    });
    const expected = ex.options[Array.isArray(ex.answer) ? ex.answer[0] : ex.answer];
    const optFb = ex.optionFeedback?.[i];
    const node = feedback(correct ? 'correct' : 'incorrect', { expected: correct ? null : expected, showDiff: false, explain: optFb || (correct ? (ex.explainCorrect || ex.explain) : ex.explain) });
    if (audioFirst && ex.fr) node.append(h('div', { class: 'small' }, 'You heard: ', fr(ex.fr), ex.en ? h('span', { class: 'en' }, ` — ${ex.en}`) : null));
    api.showFeedback(node);
    api.report({ status: correct ? 'correct' : 'incorrect', given: ex.options[i], expected });
  };
  order.forEach((oi, k) => {
    const b = h('button', { class: 'opt', type: 'button', onclick: () => choose(oi) },
      h('span', { class: 'k', 'aria-hidden': 'true' }, String(k + 1)),
      h('span', { class: ex.optionsFr ? 'fr' : null, lang: ex.optionsFr ? 'fr' : null }, ex.options[oi]));
    buttons.push(b);
    opts.append(b);
  });
  wrap.addEventListener('keydown', e => {
    const n = Number(e.key);
    if (n >= 1 && n <= buttons.length && !e.target.matches('input,textarea')) { e.preventDefault(); buttons[n - 1].click(); }
  });
  wrap.append(opts);
  return { el: wrap, focus: () => (audioFirst ? wrap.querySelector('.say') : buttons[0])?.focus() };
}

function listenMcq(ex, ctx, api) {
  const r = mcq({ ...ex, prompt: ex.prompt || 'What did you hear?' }, ctx, api, { audioFirst: true });
  if (ctx.autoplay !== false) setTimeout(() => say(ex.fr, { audio: ex.audio }), 300);
  return r;
}

// ---------- translate ----------
function translate(ex, ctx, api) {
  const wrap = h('div');
  wrap.append(h('p', { class: 'ex-prompt' }, `“${ex.prompt}”`));
  const input = h('input', { type: 'text', class: 'ruled', lang: 'fr', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', 'aria-label': 'Your answer in French' });
  const hintHost = h('div');
  const actions = h('div', { class: 'ex-actions' });
  const accepted = ex.accept;
  const check = textAnswer(ex, ctx, api, { input, accepted, actions });
  actions.append(h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Check'),
    hintButton(ex, api, hintHost, firstWordHint(accepted[0])),
    dontKnow(api, ex, accepted[0], () => { input.readOnly = true; actions.querySelectorAll('button').forEach(b => { b.disabled = true; }); }));
  wrap.append(input, accentBar(() => input), hintHost, actions);
  return { el: wrap, focus: () => input.focus() };
}

const firstWordHint = s => s ? `It starts with “${s.split(/\s+/)[0]}…”` : null;

// ---------- dictation ----------
function dictation(ex, ctx, api) {
  const wrap = h('div');
  wrap.append(h('div', { class: 'row', style: { marginBottom: '1rem' } }, sayPair(ex.fr, { audio: ex.audio }), h('span', { class: 'small muted' }, ex.prompt || 'Type exactly what you hear.')));
  const input = h('input', { type: 'text', class: 'ruled', lang: 'fr', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'What you heard' });
  const actions = h('div', { class: 'ex-actions' });
  const accepted = [ex.fr, ...(ex.accept || [])];
  const check = textAnswer(ex, ctx, api, { input, accepted, actions });
  actions.append(h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Check'),
    dontKnow(api, ex, ex.fr, () => { input.readOnly = true; actions.querySelectorAll('button').forEach(b => { b.disabled = true; }); }));
  wrap.append(input, accentBar(() => input), actions);
  if (ctx.autoplay !== false) setTimeout(() => say(ex.fr, { audio: ex.audio }), 300);
  return { el: wrap, focus: () => input.focus() };
}

// ---------- cloze ----------
function cloze(ex, ctx, api) {
  const wrap = h('div');
  if (ex.prompt) wrap.append(h('p', { class: 'muted' }, ex.prompt));
  const parts = ex.text.split('___');
  const inputs = [];
  let lastFocused = null;
  const line = h('p', { class: 'cloze fr', lang: 'fr' });
  parts.forEach((p, i) => {
    line.append(p);
    if (i < parts.length - 1) {
      const ans = ex.answers[i] || [''];
      const inp = h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-label': `Blank ${i + 1}`, size: Math.max(4, ...ans.map(a => a.length)) + 1, onfocus: () => { lastFocused = inp; } });
      inputs.push(inp);
      line.append(inp);
    }
  });
  wrap.append(line);
  if (ex.en) wrap.append(h('p', { class: 'small en' }, ex.en));
  if (ex.choices) {
    wrap.append(h('div', { class: 'chips' }, shuffle(ex.choices, ctx.seed).map(c => h('button', { class: 'tile', type: 'button', onclick: () => {
      const target = inputs.find(x => !x.value) || lastFocused || inputs[0];
      if (target.readOnly) return;
      target.value = c;
      (inputs.find(x => !x.value) || target).focus();
    } }, c))));
  }
  const actions = h('div', { class: 'ex-actions' });
  const full = vals => parts.reduce((s, p, i) => s + p + (i < vals.length ? vals[i] : ''), '');
  const lock = () => { inputs.forEach(x => { x.readOnly = true; }); actions.querySelectorAll('button').forEach(b => { b.disabled = true; }); wrap.querySelectorAll('.tile').forEach(b => { b.disabled = true; }); };
  const check = () => {
    if (inputs[0].readOnly) return;
    if (inputs.some(x => !x.value.trim())) { (inputs.find(x => !x.value.trim())).focus(); return; }
    const results = inputs.map((x, i) => matchText(x.value, ex.answers[i], { accentMode: prefs().accentMode }));
    const status = results.every(r => r.status === 'correct') ? 'correct' : results.some(r => r.status === 'incorrect') ? 'incorrect' : 'almost';
    inputs.forEach((x, i) => { x.style.borderBottomColor = results[i].status === 'correct' ? 'var(--green)' : results[i].status === 'almost' ? 'var(--amber)' : 'var(--red)'; });
    lock();
    const given = full(inputs.map(x => x.value));
    const expected = full(results.map(r => r.expected));
    api.showFeedback(feedback(status, { expected, given, note: results.find(r => r.note)?.note, explain: status === 'correct' ? ex.explainCorrect : ex.explain }));
    api.report({ status, given, expected });
  };
  inputs.forEach((x, i) => x.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (i < inputs.length - 1 && !inputs[i + 1].value) inputs[i + 1].focus(); else check(); } }));
  actions.append(h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Check'),
    hintButton(ex, api, wrap, null),
    dontKnow(api, ex, full(ex.answers.map(a => a[0])), lock));
  wrap.append(accentBar(() => lastFocused || inputs[0]), actions);
  return { el: wrap, focus: () => inputs[0]?.focus() };
}

// ---------- reorder ----------
const isPunct = t => /^[.,!?;:…«»"]+$/.test(t);
export const tokensOf = s => s.split(/\s+/).map(t => t.replace(/[.,!?;:…]+$/, '')).filter(t => t && !isPunct(t));

function reorder(ex, ctx, api) {
  const wrap = h('div');
  if (ex.prompt) wrap.append(h('p', { class: 'ex-prompt' }, `“${ex.prompt}”`));
  const base = ex.tiles || tokensOf(ex.accept[0]);
  const tiles = shuffle([...base, ...(ex.extra || [])], ctx.seed);
  const target = h('div', { class: 'tiles-target', 'aria-label': 'Your sentence', role: 'list' });
  const pool = h('div', { class: 'tiles-pool', 'aria-label': 'Word tiles' });
  const picked = [];
  let locked = false;
  const render = () => {
    clear(target);
    if (!picked.length) target.append(h('span', { class: 'faint small' }, 'Tap the words in order'));
    picked.forEach((ti, k) => target.append(h('button', { class: 'tile', type: 'button', role: 'listitem', lang: 'fr', 'aria-label': `${tiles[ti]}, remove`, onclick: () => { if (locked) return; picked.splice(k, 1); poolBtns[ti].classList.remove('used'); render(); } }, tiles[ti])));
  };
  const poolBtns = tiles.map((t, i) => h('button', { class: 'tile', type: 'button', lang: 'fr', onclick: () => {
    if (locked || picked.includes(i)) return;
    picked.push(i); poolBtns[i].classList.add('used'); render();
  } }, t));
  pool.append(...poolBtns);
  render();
  const actions = h('div', { class: 'ex-actions' });
  const check = () => {
    if (locked || !picked.length) return;
    locked = true;
    const given = picked.map(i => tiles[i]).join(' ');
    const r = matchText(given, ex.accept, { accentMode: 'strict' });
    const status = r.status === 'correct' ? 'correct' : 'incorrect';
    actions.querySelectorAll('button').forEach(b => { b.disabled = true; });
    api.showFeedback(feedback(status, { expected: r.expected, given, explain: status === 'correct' ? ex.explainCorrect : ex.explain }));
    api.report({ status, given, expected: r.expected });
  };
  actions.append(h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Check'),
    h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { if (locked) return; picked.length = 0; poolBtns.forEach(b => b.classList.remove('used')); render(); } }, 'Clear'));
  wrap.append(target, pool, actions);
  return { el: wrap, focus: () => poolBtns[0]?.focus() };
}

// ---------- match ----------
function match(ex, ctx, api) {
  const wrap = h('div');
  if (ex.prompt) wrap.append(h('p', { class: 'muted' }, ex.prompt));
  const left = shuffle(ex.pairs.map((p, i) => i), ctx.seed);
  const right = shuffle(ex.pairs.map((p, i) => i), (ctx.seed || 0.5) / 2 + 0.25);
  let selL = null, selR = null, misses = 0, paired = 0;
  const lb = [], rb = [];
  const tryPair = () => {
    if (selL == null || selR == null) return;
    const L = lb[selL], R = rb[selR];
    if (selL === selR) {
      L.classList.add('paired'); R.classList.add('paired');
      L.setAttribute('aria-pressed', 'false'); R.setAttribute('aria-pressed', 'false');
      paired++;
      if (paired === ex.pairs.length) {
        const status = misses === 0 ? 'correct' : misses <= 1 ? 'almost' : 'incorrect';
        api.showFeedback(feedback(status, { note: misses ? `${misses} mismatch${misses > 1 ? 'es' : ''}` : 'All pairs matched.' }));
        api.report({ status, given: `${misses} misses`, expected: '' });
      }
    } else {
      misses++;
      [L, R].forEach(b => { b.classList.remove('miss'); void b.offsetWidth; b.classList.add('miss'); b.setAttribute('aria-pressed', 'false'); });
    }
    selL = selR = null;
  };
  const colL = h('div', { class: 'col' }), colR = h('div', { class: 'col' });
  left.forEach(i => {
    const b = h('button', { class: 'fr', lang: 'fr', type: 'button', 'aria-pressed': 'false', onclick: () => {
      lb.forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); selL = i;
      say(ex.pairs[i][0]);
      tryPair();
    } }, ex.pairs[i][0]);
    lb[i] = b; colL.append(b);
  });
  right.forEach(i => {
    const b = h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => {
      rb.forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); selR = i; tryPair();
    } }, ex.pairs[i][1]);
    rb[i] = b; colR.append(b);
  });
  wrap.append(h('div', { class: 'match' }, colL, colR));
  return { el: wrap, focus: () => lb[left[0]]?.focus() };
}

// ---------- write ----------
function modelAnswers(models = []) {
  return models.map(m => h('div', { class: 'model' },
    h('div', { class: 'lbl' }, m.label || 'Model answer'),
    h('p', { class: 'fr', lang: 'fr', style: { margin: 0 } }, m.fr, ' ', sayButton(m.fr)),
    m.en && h('p', { class: 'small en', style: { margin: 0 } }, m.en)));
}

const RUBRIC = [
  ['task', 'I did everything the task asked'],
  ['clarity', 'My ideas are clear and in a sensible order'],
  ['words', 'I used words and phrases from this lesson'],
  ['accuracy', 'My grammar and spelling are mostly right'],
];

function selfRubric(onChange) {
  const scores = {};
  return h('div', { class: 'rubric' }, RUBRIC.map(([k, label]) => {
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': label });
    ['0', '1', '2', '3'].forEach(v => seg.append(h('button', { type: 'button', 'aria-pressed': 'false', 'aria-label': `${label}: ${v} of 3`, onclick: e => {
      seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
      e.currentTarget.setAttribute('aria-pressed', 'true');
      scores[k] = Number(v); onChange({ ...scores });
    } }, v)));
    return h('div', { class: 'rubric-row' }, h('span', label), seg);
  }));
}

function write(ex, ctx, api) {
  const wrap = h('div');
  wrap.append(h('p', { class: 'ex-prompt' }, ex.prompt));
  if (ex.promptFr) wrap.append(h('p', { class: 'fr', lang: 'fr' }, ex.promptFr, ' ', sayButton(ex.promptFr)));
  const [min, max] = ex.wordRange || [ex.minWords || 0, ex.maxWords || 0];
  const ta = h('textarea', { class: 'ruled', lang: 'fr', spellcheck: 'false', 'aria-label': 'Your text in French', rows: 6 });
  const wc = h('span', { class: 'wordcount', 'aria-live': 'polite' });
  const updWc = () => {
    const n = countWords(ta.value);
    wc.textContent = `${n} word${n === 1 ? '' : 's'}${min ? ` · aim for ${min}${max ? `–${max}` : '+'}` : ''}`;
    wc.className = 'wordcount' + (min && n >= min && (!max || n <= max) ? ' ok' : max && n > max ? ' over' : '');
  };
  ta.addEventListener('input', updWc); updWc();
  const checklist = ex.checklist?.length ? h('ul', { class: 'checklist' }, ex.checklist.map(c => h('li', h('label', h('input', { type: 'checkbox' }), c)))) : null;
  const actions = h('div', { class: 'ex-actions' });
  const after = h('div');
  const submit = async () => {
    if (!ta.value.trim()) { ta.focus(); return; }
    ta.readOnly = true;
    actions.querySelectorAll('button').forEach(b => { b.disabled = true; });
    const entry = { id: `w-${Date.now()}`, ts: Date.now(), kind: 'writing', exerciseId: ex.id, lessonId: ctx.lessonId, prompt: ex.prompt, text: ta.value, words: countWords(ta.value) };
    await db.put('portfolio', entry);
    after.append(h('h4', { style: { marginTop: '1.5rem' } }, 'Compare with a model'), ...modelAnswers(ex.models),
      h('h4', { style: { marginTop: '1.5rem' } }, 'Rate your own text'),
      selfRubric(scores => { entry.self = scores; db.put('portfolio', entry); }));
    if (ctx.ai?.writing) after.append(ctx.ai.writing(ex, ta.value, entry));
    api.showFeedback(h('div', { class: 'fb correct' }, h('div', { class: 'verdict' }, icon('check'), 'Saved to your portfolio')));
    api.report({ status: 'correct', given: ta.value, expected: '', words: entry.words });
  };
  actions.append(h('button', { class: 'btn primary', type: 'button', onclick: submit }, 'Submit my text'));
  wrap.append(ta, h('div', { class: 'row between', style: { marginTop: '.5rem' } }, wc), accentBar(() => ta), checklist, actions, after);
  return { el: wrap, focus: () => ta.focus() };
}

// ---------- speak ----------
function speak(ex, ctx, api) {
  const wrap = h('div');
  wrap.append(h('p', { class: 'ex-prompt' }, ex.prompt));
  if (ex.promptFr) wrap.append(h('p', { class: 'fr', lang: 'fr' }, ex.promptFr, ' ', sayButton(ex.promptFr)));
  if (ex.seconds) wrap.append(h('p', { class: 'small muted' }, `Speak for about ${ex.seconds} seconds.`));
  const checklist = ex.checklist?.length ? h('ul', { class: 'checklist' }, ex.checklist.map(c => h('li', h('label', h('input', { type: 'checkbox' }), c)))) : null;
  if (checklist) wrap.append(checklist);
  const recHost = h('div', { class: 'rec' });
  const after = h('div');
  let last = null;
  const finish = async (recording, transcript) => {
    const entry = { id: `s-${Date.now()}`, ts: Date.now(), kind: 'speaking', exerciseId: ex.id, lessonId: ctx.lessonId, prompt: ex.prompt, transcript: transcript || '' };
    if (recording) entry.recordingId = await saveRecording(recording, { portfolioId: entry.id, exerciseId: ex.id });
    if (recording) entry.ms = recording.ms;
    await db.put('portfolio', entry);
    clear(after).append(h('h4', { style: { marginTop: '1.5rem' } }, 'Listen to a model'), ...modelAnswers(ex.models),
      h('h4', { style: { marginTop: '1.5rem' } }, 'Rate yourself'),
      selfRubric(scores => { entry.self = scores; db.put('portfolio', entry); }));
    if (ctx.ai?.speaking && transcript) after.append(ctx.ai.speaking(ex, transcript, entry));
    api.showFeedback(h('div', { class: 'fb correct' }, h('div', { class: 'verdict' }, icon('check'), recording ? 'Recording saved' : 'Done')));
    api.report({ status: 'correct', given: transcript || '(spoken)', expected: '' });
  };
  const idle = () => {
    clear(recHost);
    if (canRecord()) {
      recHost.append(h('button', { class: 'btn primary', type: 'button', onclick: begin }, icon('mic'), last ? 'Record again' : 'Start recording'));
    } else {
      recHost.append(h('span', { class: 'small muted' }, 'Recording is not available in this browser. Say your answer aloud, then continue.'));
    }
    if (last) recHost.append(h('button', { class: 'btn', type: 'button', onclick: () => playBlob(last.blob) }, icon('play'), 'Play mine'));
    if (ex.models?.[0]) recHost.append(h('button', { class: 'btn ghost', type: 'button', onclick: () => say(ex.models[0].fr) }, icon('speaker'), 'Play model'));
    if (!last) recHost.append(h('button', { class: 'btn ghost sm', type: 'button', onclick: () => finish(null, '') }, 'I said it aloud'));
    else recHost.append(h('button', { class: 'btn ghost', type: 'button', onclick: () => finish(last, last.transcript) }, 'Keep this one'));
  };
  const begin = async () => {
    let ctl;
    try { ctl = await startRecording({ maxMs: Math.max(30, (ex.seconds || 30) * 3) * 1000 }); }
    catch { clear(recHost).append(h('div', { class: 'notice' }, icon('alert'), h('div', 'The microphone is blocked. Allow microphone access for this site in your browser settings, then try again.'))); setTimeout(idle, 4000); return; }
    let sttP = null;
    if (sttEnabled()) sttP = listenOnce({ maxMs: Math.max(30, (ex.seconds || 30) * 3) * 1000 }).catch(() => null);
    const time = h('span', { class: 'time' }, '0:00');
    const meter = h('span');
    clear(recHost).append(h('span', { class: 'dot', 'aria-hidden': 'true' }), time, h('div', { class: 'level-meter', 'aria-hidden': 'true' }, meter),
      h('button', { class: 'btn primary', type: 'button', onclick: async () => {
        clearInterval(iv);
        const rec = await ctl.stop();
        const stt = sttP ? await Promise.race([sttP, new Promise(r => setTimeout(() => r(null), 1500))]) : null;
        last = { ...rec, transcript: stt?.transcript || '' };
        idle();
        if (last.transcript) recHost.append(h('p', { class: 'small', style: { width: '100%' } }, 'Speech recognition heard (experimental): ', fr(last.transcript)));
      } }, icon('stop'), 'Stop'));
    const iv = setInterval(() => {
      const s = Math.floor(ctl.elapsed() / 1000);
      time.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      meter.style.width = `${Math.round(ctl.level() * 100)}%`;
    }, 120);
  };
  idle();
  wrap.append(recHost, after);
  return { el: wrap, focus: () => recHost.querySelector('button')?.focus() };
}

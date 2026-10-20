import { h, clear } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { md } from '../ui/md.js';
import { toast } from '../ui/components.js';
import { getLesson, lessonMeta, itemsFor, lessonIndex } from '../engine/content.js';
import { getLessonProgress, saveLessonProgress, recordAttempt, pathStatus, bumpDaily, isDone } from '../engine/progress.js';
import { renderExercise, KIND_LABEL, SKILL_OF } from '../exercises/exercises.js';
import { renderBlock } from './blocks.js';
import { seedCards, buildQueue, exerciseFor, answerCard } from '../engine/cards.js';
import { award } from '../engine/gamification.js';
import { stop as stopAudio } from '../media/speech.js';
import { aiHooks } from '../ai/coach.js';
import { askButton } from '../ai/ask.js';

const STEP_TITLE = {
  discover: 'See it in use', understand: 'How it works', hear: 'Hear it, say it',
  recall: 'Your turn', apply: 'Make it yours', review: 'Mix in older material', assess: 'Show what you can do',
};
const STEP_KICKER = {
  discover: 'Discover', understand: 'Understand', hear: 'Hear', recall: 'Recall', apply: 'Apply', review: 'Review', assess: 'Assess',
};
const UNGRADED = new Set(['write', 'speak']);
const isExercise = b => b.type in KIND_LABEL;

export default async function lessonView({ id }, root) {
  document.body.classList.add('in-lesson');
  let lesson, meta;
  try {
    [lesson, meta] = await Promise.all([getLesson(id), lessonMeta(id)]);
  } catch {
    root.append(h('div', { class: 'view narrow' }, h('h1', 'This lesson is not available yet'),
      h('p', 'It is still being written. Your course map shows which lessons are ready.'), h('a', { class: 'btn primary', href: '#/learn' }, 'Open the course map')));
    return () => document.body.classList.remove('in-lesson');
  }
  const path = await pathStatus();
  const here = path.find(l => l.id === id);
  if (here?.status === 'locked' && !sessionStorage.getItem(`fq.unlock.${id}`)) {
    document.body.classList.remove('in-lesson');
    const prev = path[here.position - 1];
    root.append(h('div', { class: 'view narrow' },
      h('h1', lesson.title),
      h('p', 'This lesson builds on ', h('strong', prev?.title || 'the previous lesson'), '. Lessons open in order so that each one has the words and grammar it needs.'),
      h('div', { class: 'row' },
        prev && h('a', { class: 'btn primary', href: `#/lesson/${prev.id}` }, `Go to “${prev.title}”`),
        h('button', { class: 'btn', onclick: () => { sessionStorage.setItem(`fq.unlock.${id}`, '1'); lessonView({ id }, clear(root)); } }, 'Start anyway'))));
    return () => document.body.classList.remove('in-lesson');
  }

  const items = new Map((lesson.items || []).map(it => [it.id, { ...it, uid: `${lesson.id}.${it.id}` }]));
  const prog = await getLessonProgress(id);
  const steps = lesson.steps;
  let stepIdx = prog && !isDone(prog) && prog.currentStep < steps.length ? prog.currentStep : 0;
  const results = {}; // exId -> result
  if (!prog || isDone(prog)) await saveLessonProgress(id, { status: prog && isDone(prog) ? prog.status : 'in-progress', currentStep: 0, attempts: (prog?.attempts || 0) + 1 });

  const top = h('header', { class: 'lesson-top' });
  const page = h('div', { class: 'page' });
  const foot = h('footer', { class: 'lesson-foot' });
  root.classList.add('lesson-root');
  root.append(top, h('div', { id: 'lesson-body' }, page), foot);

  const where = lesson.level === 'vocab'
    ? `Vocabulary deck${lesson.band ? ` · ${lesson.band}` : ''}`
    : `${(meta?.level || lesson.level || '').toUpperCase()} · Unit ${String((meta?.unitIndex ?? 0) + 1).padStart(2, '0')} · ${meta?.optional ? 'Workshop' : `Lesson ${(meta?.indexInUnit ?? 0) + 1}`}`;

  function renderTop() {
    clear(top).append(
      h('a', { class: 'btn icon ghost', href: '#/learn', 'aria-label': 'Close lesson' }, icon('x')),
      h('div', { style: { minWidth: 0 } },
        h('div', { class: 'where' }, where),
        h('div', { class: 't' }, lesson.title),
        h('div', { class: 'steps-dots', 'aria-hidden': 'true' }, steps.map((s, i) => h('i', { class: i < stepIdx ? 'done' : i === stepIdx ? 'now' : null })))),
      h('div', { class: 'row', style: { flexWrap: 'nowrap', gap: '.5rem' } },
        askButton(() => ({ level: (lesson.level || '').toUpperCase(), title: lesson.title, goal: lesson.goal, step: steps[stepIdx].title || STEP_TITLE[steps[stepIdx].type], snippet: snippetOf(steps[stepIdx]) })),
        h('span', { class: 'small muted nowrap' }, `${stepIdx + 1}/${steps.length}`)));
  }

  function exCtx(ex, onAnswered, hasMore) {
    return {
      lessonId: id,
      seed: hashSeed(ex.id || ''),
      continueLabel: hasMore ? 'Continue' : null,
      onContinue: onAnswered.next,
      ai: aiHooks(),
      onRetry: (r) => {
        const first = results[ex.id];
        if (!first) return;
        first.retries = (first.retries || 0) + 1;
        if (r.status !== 'incorrect') first.fixed = true;
      },
      onResult: async (r) => {
        results[ex.id] = r;
        onAnswered.done();
        await recordAttempt({ lessonId: id, exId: ex.id, type: ex.type, skill: ex.skill || SKILL_OF[ex.type], status: r.status, latencyMs: r.latencyMs, hintUsed: r.hintUsed });
      },
    };
  }

  async function renderStep() {
    stopAudio();
    renderTop();
    clear(page);
    const step = steps[stepIdx];
    const sec = h('section', { class: 'step', 'aria-labelledby': 'step-h' },
      h('div', { class: 'step-mark', 'aria-hidden': 'true' }, String(stepIdx + 1)),
      h('div', { class: 'step-kicker' }, STEP_KICKER[step.type] || ''),
      h('h1', { id: 'step-h' }, step.title || STEP_TITLE[step.type] || 'Practice'));
    if (stepIdx === 0) page.append(h('p', { class: 'goal' }, h('small', 'Your goal'), lesson.goal));
    if (step.intro) sec.append(md(step.intro));
    page.append(sec);

    const blocks = step.blocks || [];
    const exCount = blocks.filter(b => isExercise(b) || b.type === 'review-mix').length;
    let answered = 0;
    let i = 0;
    const host = h('div');
    sec.append(host);

    const updateFoot = () => {
      const ready = answered >= exCount;
      const last = stepIdx === steps.length - 1;
      clear(foot).append(
        h('span', { class: 'note' }, exCount ? (ready ? 'Step complete' : `${answered} of ${exCount} done`) : ''),
        stepIdx > 0 && h('button', { class: 'btn ghost', onclick: () => { stepIdx--; renderStep(); } }, icon('back'), 'Back'),
        h('button', { class: 'btn primary', 'aria-disabled': ready ? null : 'true', disabled: !ready, onclick: async () => {
          if (last) return finish();
          stepIdx++;
          await saveLessonProgress(id, { currentStep: stepIdx });
          renderStep();
          document.getElementById('step-h')?.focus();
        } }, last ? 'Finish lesson' : 'Next step', icon('next')));
    };

    const advance = async (focusFirst) => {
      while (i < blocks.length) {
        const b = blocks[i++];
        if (b.type === 'review-mix') { await reviewMix(b, host, () => { answered++; updateFoot(); }); continue; }
        if (!isExercise(b)) { host.append(renderBlock(b, { items })); continue; }
        if (results[b.id]) { // already answered this visit: show compact
          host.append(h('div', { class: 'ex' }, h('div', { class: 'ex-kind' }, KIND_LABEL[b.type]), h('p', { class: 'small muted' }, results[b.id].status === 'correct' ? 'Answered correctly.' : 'Answered.')));
          continue;
        }
        const hasMore = blocks.slice(i).some(x => isExercise(x) && !results[x.id]);
        let doneCalled = false;
        const handle = renderExercise(b, exCtx(b, {
          done: () => { if (!doneCalled) { doneCalled = true; answered++; updateFoot(); if (!hasMore) advance(); } },
          next: () => advance(true),
        }, hasMore));
        host.append(handle.el);
        if (focusFirst) { handle.el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => handle.focus(), 250); }
        return;
      }
    };
    answered = blocks.filter(b => isExercise(b) && results[b.id]).length;
    updateFoot();
    await advance(false);
  }

  async function reviewMix(b, host, onOne) {
    const box = h('div', { class: 'block' });
    host.append(box);
    const { queue } = await buildQueue({ newLimit: 0 });
    const pick = queue.filter(c => !c.itemId.startsWith(`${id}.`)).slice(0, b.count || 5);
    if (!pick.length) {
      box.append(h('div', { class: 'notice info' }, icon('info'), h('div', 'Nothing from earlier lessons is due right now. As you complete more lessons, older words and patterns come back here to keep them fresh.')));
      onOne();
      return;
    }
    const pool = await itemsFor([...new Set(pick.map(c => c.itemId.split('.')[0]))]);
    let k = 0;
    const next = () => {
      if (k >= pick.length) { onOne(); return; }
      const card = pick[k++];
      const item = pool.get(card.itemId);
      const ex = item && exerciseFor(card, item, pool);
      if (!ex) return next();
      const hEx = renderExercise(ex, {
        kindLabel: `From an earlier lesson · ${KIND_LABEL[ex.type]}`,
        continueLabel: k < pick.length ? 'Next' : null,
        onContinue: next,
        onResult: async r => { await answerCard(card, r); bumpDaily('reviews'); if (k >= pick.length) onOne(); },
      });
      box.append(hEx.el);
    };
    box.append(h('p', { class: 'muted small' }, `${pick.length} quick ${pick.length === 1 ? 'question' : 'questions'} from earlier lessons.`));
    next();
  }

  async function finish() {
    stopAudio();
    const graded = steps.flatMap(s => s.blocks || []).filter(b => isExercise(b) && !UNGRADED.has(b.type) && results[b.id]);
    const correct = graded.filter(b => results[b.id].status === 'correct' || results[b.id].status === 'almost').length;
    const acc = graded.length ? correct / graded.length : 1;
    const threshold = lesson.completion?.threshold ?? 0.8;
    const strong = acc >= threshold;
    const before = await getLessonProgress(id);
    const wasDone = isDone(before);
    const status = strong ? 'completed' : (before?.status === 'completed' ? 'completed' : 'completed-weak');
    await saveLessonProgress(id, { status, currentStep: 0, completedAt: Date.now(), lastAccuracy: acc, bestAccuracy: Math.max(acc, before?.bestAccuracy || 0) });
    let added = await seedCards(lesson);
    // Passing a unit checkpoint tests you out of that unit's earlier, unfinished lessons.
    let testedOut = 0;
    if (lesson.checkpoint && strong && /-05$/.test(id) && !/-12$/.test(lesson.unit)) {
      // Only lessons 1–4 are covered by the checkpoint; the workshop (lesson 6) stays open as extra practice.
      const unitLessons = (await lessonIndex()).filter(l => l.unitId === lesson.unit && l.id < id && l.status === 'published');
      for (const l of unitLessons) {
        const rec = await getLessonProgress(l.id);
        if (isDone(rec)) continue;
        await saveLessonProgress(l.id, { status: 'tested-out', completedAt: Date.now(), currentStep: 0 });
        const full = await getLesson(l.id).catch(() => null);
        if (full) added += await seedCards(full, { asLearning: true });
        testedOut++;
      }
    }
    let xp = 0;
    if (strong) xp += await award('lesson', id);
    if (wasDone) xp += await award('lessonRetry', id);
    if (lesson.checkpoint && strong) xp += await award('checkpoint', id);
    const missions = steps.flatMap(s => s.blocks || []).filter(b => UNGRADED.has(b.type) && results[b.id]);
    for (const m of missions) xp += await award('mission', m.id);
    if (!wasDone) await bumpDaily('lessons');
    window.dispatchEvent(new Event('fq-progress'));

    const index = await lessonIndex();
    const pos = index.findIndex(l => l.id === id);
    const nextL = pos < 0 ? null : index.slice(pos + 1).find(l => l.status === 'published' && !l.optional);
    const missed = graded.filter(b => results[b.id].status === 'incorrect');
    let redoScore = null;

    const summary = () => {
    const fixed = missed.filter(b => results[b.id].fixed).length;
    clear(top).append(h('a', { class: 'btn icon ghost', href: '#/learn', 'aria-label': 'Close lesson' }, icon('x')), h('div', { class: 't' }, lesson.title), h('span'));
    clear(foot);
    clear(page).append(h('section', { class: 'step' },
      h('div', { class: ['result-hero', !strong && 'weak'] },
        h('div', { class: 'big' }, `${Math.round(acc * 100)}%`),
        h('h1', { style: { marginTop: '1rem' } }, strong ? 'Lesson complete' : 'Lesson done — worth another pass'),
        h('p', { class: 'muted' }, strong
          ? `You answered ${Math.round(acc * 100)}% correctly on the first try. These words and patterns now join your review queue, so they come back just before you would forget them.`
          : `You reached ${Math.round(acc * 100)}%; the goal is ${Math.round(threshold * 100)}%. You can move on — the tricky items will come back sooner in review — or practise this lesson again now.`)),
      h('div', { class: 'grid grid-3', style: { margin: '2rem 0' } },
        h('div', { class: 'stat' }, h('b', String(graded.length ? `${correct}/${graded.length}` : '—')), h('span', 'right on the first try')),
        h('div', { class: 'stat' }, h('b', String(added)), h('span', 'new review cards')),
        h('div', { class: 'stat' }, h('b', `+${xp}`), h('span', 'XP'))),
      missed.length > 0 && mistakesPanel(missed, fixed),
      testedOut > 0 && h('div', { class: 'notice info', style: { marginBottom: '1.5rem' } }, icon('check'), h('div', `You tested out of ${testedOut} earlier lesson${testedOut > 1 ? 's' : ''} in this unit. Their words are in your review queue, so gaps will show up there.`)),
      lesson.summary && h('div', { class: 'panel tint', style: { marginBottom: '2rem' } }, h('h3', 'What you can do now'), md(lesson.summary)),
      h('div', { class: 'row' },
        nextL && h('a', { class: ['btn', strong ? 'primary' : null, 'lg'], href: `#/lesson/${nextL.id}` }, `Next: ${nextL.title}`, icon('next')),
        h('button', { class: ['btn', !strong && 'primary', 'lg'], onclick: () => lessonView({ id }, clear(root)) }, icon('refresh'), 'Practise again'),
        lesson.level === 'vocab' ? h('a', { class: 'btn ghost', href: '#/vocabulary' }, 'Back to Vocabulary') : h('a', { class: 'btn ghost', href: '#/' }, 'Back to Home'))));
    page.querySelector('h1').focus();
    };

    const mistakesPanel = (list, fixed) => h('div', { class: 'panel', style: { marginBottom: '2rem' } },
      h('h3', { style: { marginTop: 0 } }, icon('alert'), ` Your mistakes (${list.length})`),
      h('p', { class: 'small muted' }, [
        fixed ? `You fixed ${fixed} of them on a retry.` : 'Look at the right answers, then redo just these questions.',
        redoScore && ` In your last redo you got ${redoScore.right} of ${redoScore.total} right.`,
      ].filter(Boolean).join('')),
      h('ul', { class: 'mistakes' }, list.map(b => {
        const r = results[b.id];
        const typed = ['translate', 'cloze', 'dictation', 'reorder'].includes(b.type);
        const frAnswer = typed || (b.type === 'mcq' && b.optionsFr);
        return h('li',
          h('div', { class: 'small muted' }, KIND_LABEL[b.type]),
          h('div', promptOf(b)),
          r.given && h('div', { class: 'small' }, typed ? 'You wrote: ' : 'You chose: ', h('span', { lang: frAnswer ? 'fr' : null, class: ['wrong', frAnswer && 'fr'] }, r.given)),
          r.expected && h('div', { class: 'small' }, 'Answer: ', h('strong', { lang: frAnswer ? 'fr' : null, class: frAnswer ? 'fr' : null }, r.expected)));
      })),
      h('button', { class: 'btn primary', type: 'button', onclick: () => redo(list) }, icon('refresh'), `Redo my mistakes (${list.length})`));

    // A short round of just the missed exercises. It helps memory but does not change the score.
    const redo = (list) => {
      stopAudio();
      let i = 0, right = 0;
      clear(foot);
      clear(top).append(h('a', { class: 'btn icon ghost', href: '#/learn', 'aria-label': 'Close lesson' }, icon('x')), h('div', { class: 't' }, 'Redo your mistakes'), h('span', { class: 'small muted nowrap' }));
      const host = h('div');
      clear(page).append(h('section', { class: 'step' }, h('div', { class: 'step-kicker' }, 'Practice'), h('h1', { tabindex: -1 }, 'Redo your mistakes'),
        h('p', { class: 'muted' }, 'Only the questions you missed. This round does not change your score.'), host));
      const next = () => {
        if (i >= list.length) {
          redoScore = { right, total: list.length };
          summary();
          return;
        }
        const b = list[i++];
        top.lastChild.textContent = `${i}/${list.length}`;
        const handle = renderExercise(b, {
          seed: Math.random(),
          continueLabel: i < list.length ? 'Next' : 'See results',
          onContinue: next,
          onResult: r => { if (r.status !== 'incorrect') { right++; results[b.id].fixed = true; } },
          onRetry: r => { if (r.status !== 'incorrect') results[b.id].fixed = true; },
        });
        clear(host).append(handle.el);
        setTimeout(() => handle.focus(), 60);
      };
      next();
    };

    summary();
    if (strong && !wasDone) toast('Saved. New cards are waiting in Review.');
  }

  await renderStep();
  return () => { stopAudio(); document.body.classList.remove('in-lesson'); };
}

function promptOf(b) {
  const strip = t => String(t || '').replace(/\[\[|\]\]|\*\*/g, '');
  if (b.type === 'dictation') return 'Write what you hear.';
  if (b.type === 'match') return strip(b.prompt) || 'Match the pairs.';
  if (b.type === 'listen-mcq') return `${strip(b.prompt) || 'Listening'} (audio: “${b.fr}”)`;
  if (b.type === 'cloze') return strip(b.text);
  return strip(b.prompt || b.en || b.text);
}

function snippetOf(step) {
  const parts = [];
  for (const b of step.blocks || []) {
    if (b.pattern) parts.push(b.pattern);
    if (b.lines) parts.push(b.lines.slice(0, 3).map(l => l.fr).join(' / '));
    if (b.title && b.type === 'explain') parts.push(b.title);
    if (b.prompt) parts.push(`exercise: ${b.prompt}`);
  }
  return parts.join(' · ').replace(/\*|\[\[|\]\]/g, '').slice(0, 400);
}

function hashSeed(s) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1000003;
  return (h % 997) / 997 + 0.0001;
}

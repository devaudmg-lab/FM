import { h, clear } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { bar, empty, toast } from '../ui/components.js';
import { buildQueue, exerciseFor, answerCard, cardStats } from '../engine/cards.js';
import { itemsFor, lessonIndex } from '../engine/content.js';
import { bumpDaily, lessonProgressMap, isDone } from '../engine/progress.js';
import { award } from '../engine/gamification.js';
import { renderExercise, KIND_LABEL } from '../exercises/exercises.js';
import { State } from '../engine/srs.js';
import { stop as stopAudio } from '../media/speech.js';
import * as db from '../store/db.js';

const CARD_LABEL = { recognize: 'What does it mean?', produce: 'Say it in French', listen: 'Listen', drill: 'Grammar' };

export default async function reviewView(params, root, path) {
  if (path === '/review/session') return session(root);
  const [{ queue, dueCount, newCount, backlog }, stats] = await Promise.all([buildQueue(), cardStats()]);
  const v = h('div', { class: 'view narrow' });
  root.append(v);
  v.append(h('div', { class: 'page-head' }, h('h1', 'Review'), h('p', 'Short, mixed recall that brings words and patterns back just before you would forget them.')));
  if (!stats.total) {
    v.append(empty('Nothing to review yet', 'Finish a lesson and its words and phrases appear here, ready for spaced review.', h('a', { class: 'btn primary', href: '#/learn' }, 'Start a lesson')));
    return;
  }
  const mins = Math.max(1, Math.round(queue.length * 12 / 60));
  v.append(h('div', { class: 'panel', style: { marginBottom: '1.5rem' } },
    queue.length
      ? [h('h2', { style: { fontSize: 'var(--fs-xl)' } }, `${queue.length} card${queue.length === 1 ? '' : 's'} ready`),
        h('p', { class: 'muted' }, `${dueCount} due for review${newCount ? `, ${newCount} new` : ''} · about ${mins} min`),
        backlog && h('div', { class: 'notice', style: { marginBottom: '1rem' } }, icon('alert'), h('div', 'Your review pile is larger than usual, so new cards are paused until it is back to normal. Short daily sessions clear it fastest.')),
        h('a', { class: 'btn primary lg', href: '#/review/session' }, 'Start review')]
      : [h('h2', { style: { fontSize: 'var(--fs-xl)' } }, 'All caught up'), h('p', { class: 'muted', style: { margin: 0 } }, 'Nothing is due right now. Reviewing too early does not help memory much — come back later, or learn something new.'),
        h('div', { class: 'row', style: { marginTop: '1rem' } }, h('a', { class: 'btn primary', href: '#/learn' }, 'Continue the course'))]));
  v.append(h('div', { class: 'grid grid-4' },
    h('div', { class: 'stat' }, h('b', String(stats.items)), h('span', 'words & patterns')),
    h('div', { class: 'stat' }, h('b', String(stats.itemsEstablished)), h('span', 'established in memory')),
    h('div', { class: 'stat' }, h('b', String(stats.learning)), h('span', 'cards still learning')),
    h('div', { class: 'stat' }, h('b', String(stats.new)), h('span', 'new cards waiting'))));
  v.append(h('p', { class: 'small muted', style: { marginTop: '1.5rem' } }, '“Established” means you have recalled it across several days and the next review is three or more weeks away. Clicking “I know this” never counts — only real recall does.'));
}

async function session(root) {
  document.body.classList.add('in-lesson');
  const focus = new URLSearchParams(location.hash.split('?')[1] || '').get('focus');
  let { queue } = await buildQueue();
  const allCards = await db.all('cards');
  if (focus) {
    // Focused practice: due cards of the right kind first, then the weakest studied cards.
    const want = focus === 'listen' ? c => c.kind === 'listen' : () => true;
    const dueIds = new Set(queue.map(c => c.id));
    const extra = allCards.filter(c => c.state !== State.New && want(c) && !dueIds.has(c.id))
      .sort((a, b) => (a.stability || 0) - (b.stability || 0));
    queue = [...queue.filter(want), ...extra].slice(0, 15);
    if (focus === 'mixed') queue = queue.sort(() => Math.random() - 0.5);
  }
  if (!queue.length) {
    root.append(h('div', { class: 'view narrow' }, h('h1', focus === 'listen' ? 'No listening cards yet' : 'Nothing to practise yet'),
      h('p', 'Finish a lesson first; its words and phrases become practice cards.'), h('a', { class: 'btn primary', href: '#/learn' }, 'Go to the course')));
    document.body.classList.remove('in-lesson');
    return;
  }
  const lessonIds = [...new Set(allCards.map(c => c.itemId.split('.')[0]))];
  const pool = await itemsFor(lessonIds);
  const progressMap = await lessonProgressMap();
  const titles = new Map((await lessonIndex()).map(l => [l.id, l.title]));
  const total = queue.length;
  let done = 0, right = 0;
  const t0 = Date.now();

  const top = h('header', { class: 'lesson-top' });
  const wrap = h('div', { class: 'review-wrap' });
  root.append(top, wrap);

  const renderTop = () => clear(top).append(
    h('a', { class: 'btn icon ghost', href: '#/review', 'aria-label': 'End review' }, icon('x')),
    h('div', h('div', { class: 't' }, 'Review'), bar((done / total) * 100, 'thin')),
    h('span', { class: 'small muted nowrap' }, `${done} / ${total}`));

  const next = () => {
    stopAudio();
    renderTop();
    clear(wrap);
    if (!queue.length) return summary();
    const card = queue.shift();
    const item = pool.get(card.itemId);
    if (!item || !progressMap.has(item.lessonId)) { done++; return next(); }
    const ex = exerciseFor(card, item, pool);
    if (!ex) { done++; return next(); }
    const handle = renderExercise(ex, {
      kindLabel: `${CARD_LABEL[card.kind] || KIND_LABEL[ex.type]} — from “${titles.get(item.lessonId) || item.lessonId}”`,
      continueLabel: 'Continue',
      onContinue: next,
      onResult: async r => {
        const { card: updated } = await answerCard(card, r);
        if (r.status !== 'incorrect') right++;
        await bumpDaily('reviews');
        await award('review', card.id);
        // Learning steps come back within the session
        if ((updated.state === State.Learning || updated.state === State.Relearning) && updated.due - Date.now() < 20 * 60000) {
          queue.splice(Math.min(queue.length, 4), 0, updated);
        } else done++;
      },
    });
    wrap.append(h('div', { class: 'review-card' }, handle.el));
    setTimeout(() => handle.focus(), 50);
  };

  const summary = () => {
    document.body.classList.remove('in-lesson');
    const mins = Math.max(1, Math.round((Date.now() - t0) / 60000));
    window.dispatchEvent(new Event('fq-progress'));
    clear(top).append(h('a', { class: 'btn icon ghost', href: '#/', 'aria-label': 'Close' }, icon('x')), h('div', { class: 't' }, 'Review complete'), h('span'));
    wrap.append(h('div', { class: 'result-hero' },
      h('div', { class: 'big' }, String(total)),
      h('h1', { style: { marginTop: '1rem' } }, 'Review complete'),
      h('p', { class: 'muted' }, `${right} recalled on the first try · ${mins} min. Everything is rescheduled based on how you did.`)),
      h('div', { class: 'row', style: { justifyContent: 'center' } }, h('a', { class: 'btn primary lg', href: '#/' }, 'Back to Home'), h('a', { class: 'btn lg', href: '#/learn' }, 'Continue the course')));
    wrap.querySelector('h1').focus();
    toast('Review saved.');
  };

  next();
  return () => { stopAudio(); document.body.classList.remove('in-lesson'); };
}

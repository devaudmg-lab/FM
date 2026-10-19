import { h } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { bar, minutes } from '../ui/components.js';
import { todayPlan, nextActions, forecast } from '../engine/recommend.js';
import { skillScores, dailyRange, SKILL_LABEL, pathStatus } from '../engine/progress.js';
import { streak, totalXP } from '../engine/gamification.js';
import { prefs } from '../store/prefs.js';
import * as db from '../store/db.js';

export default async function home(params, root) {
  const [{ plan, current, queueSize }, actions, fc, scores, week, st, xp, path, goal] = await Promise.all([
    todayPlan(), nextActions(), forecast(), skillScores(), dailyRange(7), streak(), totalXP(), pathStatus(), db.getMeta('goal'),
  ]);
  const hour = new Date().getHours();
  const hello = hour >= 18 || hour < 4 ? 'Bonsoir' : 'Bonjour';
  const name = goal?.name ? `, ${goal.name}` : '';
  const todaySec = week[6].seconds;
  const planMin = plan.reduce((s, p) => s + p.minutes, 0);
  const v = h('div', { class: 'view' });
  root.append(v);

  v.append(h('div', { class: 'page-head row between', style: { alignItems: 'flex-end' } },
    h('div', h('h1', { lang: 'fr' }, `${hello}${name} !`),
      h('p', st.count ? `${st.count}-day streak${st.todayDone ? '' : ' — study today to keep it going'}.` : 'Every day you study counts — rest days included.')),
    h('div', { class: 'row', style: { gap: '1.5rem' } },
      h('div', { class: 'stat' }, h('b', `${Math.round(todaySec / 60)}/${prefs().dailyMinutes}`), h('span', 'minutes today')),
      h('div', { class: 'stat' }, h('b', String(xp)), h('span', 'XP')))));

  // Continue: the single primary action
  const done = path.filter(l => ['completed', 'completed-weak', 'tested-out'].includes(l.status)).length;
  if (current) {
    const step = current.rec?.status === 'in-progress' && current.rec.currentStep ? `Resume at step ${current.rec.currentStep + 1}` : `${current.minutes || 10} min`;
    v.append(h('section', { class: 'continue', 'aria-label': 'Continue learning' },
      h('div',
        h('div', { class: 'where' }, `${current.level.toUpperCase()} · ${current.unitTitle} · lesson ${current.indexInUnit + 1} of ${current.unitSize}`),
        h('h2', current.title),
        h('p', step)),
      h('a', { class: 'btn lg', href: `#/lesson/${current.id}` }, current.rec ? 'Continue' : 'Start lesson', icon('next'))));
  } else {
    v.append(h('section', { class: 'continue' }, h('div', h('h2', 'You are up to date'), h('p', `You have finished all ${done} published lessons. New lessons appear on your course map as they are added.`)), h('a', { class: 'btn lg', href: '#/review' }, 'Review')));
  }

  const grid = h('div', { class: 'grid grid-2', style: { marginTop: '2rem' } });
  v.append(grid);

  // Today's plan
  const doneMin = plan.filter(p => p.done).reduce((s, p) => s + p.minutes, 0);
  grid.append(h('section', { class: 'panel', 'aria-labelledby': 'plan-h' },
    h('div', { class: 'row between' }, h('h3', { id: 'plan-h', style: { margin: 0 } }, `Today’s plan · ${planMin} min`), h('span', { class: 'small muted' }, `${doneMin} min done`)),
    h('ul', { class: 'list plan', style: { marginTop: '.5rem' } }, plan.map(p => h('li', { class: p.done ? 'done' : null },
      h('span', { class: 'check', 'aria-hidden': 'true' }, p.done ? icon('check') : null),
      h('a', { href: p.href, style: { flex: 1, minWidth: 0 } }, h('div', { class: 'label', style: { fontWeight: 700 } }, p.label), p.detail && h('div', { class: 'small muted', style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, p.detail)),
      h('span', { class: 'mins' }, `${p.minutes} min`), h('span', { class: 'sr-only' }, p.done ? 'done' : 'to do')))),
    h('p', { class: 'small muted', style: { margin: '.75rem 0 0' } }, 'A starting point, not a timer. The plan shifts toward whatever needs work.')));

  // Recommended + review
  grid.append(h('div', { class: 'stack' },
    h('section', { class: 'panel', 'aria-labelledby': 'rec-h' },
      h('h3', { id: 'rec-h' }, 'Recommended next'),
      actions.length ? h('ul', { class: 'list' }, actions.map(a => h('li', { style: { padding: '.6rem 0' } },
        h('a', { href: a.href, style: { fontWeight: 700 } }, a.title), h('div', { class: 'small muted' }, a.why)))) : h('p', { class: 'muted' }, 'Start your first lesson to get recommendations.')),
    h('section', { class: 'panel tint' },
      h('div', { class: 'row between' },
        h('div', h('h3', { style: { margin: 0 } }, 'Review queue'), h('p', { class: 'small muted', style: { margin: 0 } }, queueSize ? `${queueSize} cards · about ${Math.max(1, Math.round(queueSize * 12 / 60))} min` : 'Nothing due right now')),
        queueSize ? h('a', { class: 'btn primary', href: '#/review/session' }, 'Start review') : null))));

  // Skills + week
  const grid2 = h('div', { class: 'grid grid-2', style: { marginTop: '1.5rem' } });
  v.append(grid2);
  const skillOrder = ['listening', 'reading', 'speaking', 'writing', 'vocabulary', 'grammar'];
  grid2.append(h('section', { class: 'panel', 'aria-labelledby': 'sk-h' },
    h('h3', { id: 'sk-h' }, 'Skills, recent accuracy'),
    skillOrder.map(s => h('div', { class: 'skill-row' }, h('span', SKILL_LABEL[s]),
      scores[s].score == null ? h('span', { class: 'small faint' }, 'No data yet') : bar(scores[s].score, scores[s].score >= 80 ? 'green' : ''),
      h('span', { class: 'val' }, scores[s].score == null ? '' : `${scores[s].score}%`))),
    h('p', { class: 'small muted', style: { margin: '.75rem 0 0' } }, 'Speaking and writing show completed tasks with your self-rating; they are not an exam score.')));

  const maxSec = Math.max(prefs().dailyMinutes * 60, ...week.map(d => d.seconds));
  const dayNames = week.map(d => new Date(d.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'narrow' }));
  const total = week.reduce((s, d) => s + d.seconds, 0);
  grid2.append(h('section', { class: 'panel', 'aria-labelledby': 'wk-h' },
    h('div', { class: 'row between' }, h('h3', { id: 'wk-h', style: { margin: 0 } }, 'This week'), h('span', { class: 'small muted' }, minutes(total))),
    h('div', { class: 'week', style: { marginTop: '1rem' }, role: 'img', 'aria-label': `Study minutes for the last 7 days: ${week.map(d => Math.round(d.seconds / 60)).join(', ')}` },
      week.map(d => h('div', { class: ['d', d.seconds >= prefs().dailyMinutes * 60 * 0.8 && 'hit'], style: { height: `${Math.max(4, (d.seconds / maxSec) * 100)}%` }, title: `${Math.round(d.seconds / 60)} min` }))),
    h('div', { class: 'week-labels', 'aria-hidden': 'true' }, dayNames.map(n => h('span', n))),
    h('p', { class: 'small', style: { margin: '1rem 0 0' } }, h('strong', 'Forecast: '), fc.message)));
}

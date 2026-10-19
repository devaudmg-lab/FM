// Rule-based planning: today's plan, next recommendations, honest forecast.
import * as db from '../store/db.js';
import { prefs } from '../store/prefs.js';
import { pathStatus, skillScores, dailyRange, today, SKILL_LABEL } from './progress.js';
import { buildQueue } from './cards.js';

const SPLIT = [ // share of daily minutes
  { id: 'review', label: 'Review due cards', share: 10 / 75 },
  { id: 'lesson', label: 'New lesson', share: 20 / 75 },
  { id: 'listen', label: 'Listening drill', share: 15 / 75 },
  { id: 'produce', label: 'Speaking or writing', share: 15 / 75 },
  { id: 'mixed', label: 'Mixed practice', share: 10 / 75 },
  { id: 'fix', label: 'Fix weak spots', share: 5 / 75 },
];

export async function todayPlan() {
  const p = prefs();
  const [path, { queue }, [day], portfolio, scores] = await Promise.all([pathStatus(), buildQueue(), dailyRange(1), db.all('portfolio'), skillScores()]);
  const current = path.find(l => !l.optional && l.status === 'in-progress') || path.find(l => !l.optional && l.status === 'available');
  const weak = path.find(l => l.status === 'completed-weak');
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const producedToday = portfolio.some(e => e.ts >= start.getTime());
  const kinds = day.kinds || {};
  const minutes = p.dailyMinutes;
  const listenWeak = scores.listening.score != null && scores.listening.score < 60;

  const plan = SPLIT.map(s => ({ ...s, minutes: Math.max(5, Math.round((s.share * minutes) / 5) * 5) }));
  if (queue.length > 60) { plan[0].minutes += 10; plan[1].minutes = Math.max(5, plan[1].minutes - 10); }
  if (listenWeak) { plan[2].minutes += 5; plan[4].minutes = Math.max(5, plan[4].minutes - 5); }

  for (const it of plan) {
    if (it.id === 'review') { it.href = queue.length ? '#/review/session' : '#/review'; it.done = queue.length === 0 && (day.reviews > 0 || (kinds.review || 0) > 60); it.detail = queue.length ? `${queue.length} ready` : 'All caught up'; }
    if (it.id === 'lesson') { it.href = current ? `#/lesson/${current.id}` : '#/learn'; it.done = day.lessons > 0; it.detail = current?.title; }
    if (it.id === 'listen') { it.href = '#/review/session?focus=listen'; it.done = (kinds.listen || 0) >= it.minutes * 60 * 0.6; it.detail = listenWeak ? 'Your weakest skill — extra time today' : 'Audio cards and dictation'; }
    if (it.id === 'produce') { it.href = current ? `#/lesson/${current.id}` : '#/learn'; it.done = producedToday; it.detail = 'Record or write in the lesson’s Apply step'; }
    if (it.id === 'mixed') { it.href = '#/review/session?focus=mixed'; it.done = (kinds.mixed || 0) >= it.minutes * 60 * 0.6; it.detail = 'Interleaved recall across lessons'; }
    if (it.id === 'fix') { it.href = weak ? `#/lesson/${weak.id}` : '#/progress'; it.done = false; it.na = !weak; it.detail = weak ? `Redo “${weak.title}”` : ''; }
  }
  // Nothing to review yet (no cards at all): fold those minutes into the new lesson.
  const hasCards = (await db.count('cards')) > 0;
  for (const it of plan) {
    if (!hasCards && ['review', 'listen', 'mixed'].includes(it.id)) it.na = true;
    if (it.id === 'review' && hasCards && !queue.length && !day.reviews) { it.na = true; }
  }
  const lessonItem = plan.find(p => p.id === 'lesson');
  for (const it of plan) if (it.na) lessonItem.minutes += it.minutes;
  return { plan: plan.filter(p => !p.na), current, queueSize: queue.length };
}

export async function nextActions() {
  const [path, { queue, backlog }, scores, portfolio] = await Promise.all([pathStatus(), buildQueue(), skillScores(), db.all('portfolio')]);
  const out = [];
  const current = path.find(l => !l.optional && l.status === 'in-progress') || path.find(l => !l.optional && l.status === 'available');
  if (queue.length) out.push({ title: `Review ${queue.length} card${queue.length === 1 ? '' : 's'}`, why: backlog ? 'Your review pile is growing; clearing it protects what you have learned.' : 'Recall them now, just before they fade.', href: '#/review/session' });
  const weak = path.find(l => l.status === 'completed-weak');
  if (weak) out.push({ title: `Practise “${weak.title}” again`, why: 'You finished it below 80%. A second pass makes it stick.', href: `#/lesson/${weak.id}` });
  const known = Object.entries(scores).filter(([, v]) => v.n >= 10);
  if (known.length >= 3) {
    const avg = known.reduce((s, [, v]) => s + v.score, 0) / known.length;
    const [lowest, lv] = known.sort((a, b) => a[1].score - b[1].score)[0];
    if (lv.score < avg - 15) out.push({ title: `Strengthen ${SKILL_LABEL[lowest].toLowerCase()}`, why: `${SKILL_LABEL[lowest]} is ${Math.round(avg - lv.score)} points below your other skills.`, href: lowest === 'listening' ? '#/review/session?focus=listen' : current ? `#/lesson/${current.id}` : '#/learn' });
  }
  const lastSpeak = portfolio.filter(e => e.kind === 'speaking').sort((a, b) => b.ts - a.ts)[0];
  if (path.some(l => l.rec) && (!lastSpeak || Date.now() - lastSpeak.ts > 3 * 86400000)) out.push({ title: 'Speak out loud today', why: 'You have not recorded yourself in a few days. Speaking is a skill of its own.', href: current ? `#/lesson/${current.id}` : '#/learn' });
  const workshop = path.find(l => l.optional && l.status === 'available');
  if (workshop) out.push({ title: `Extra practice: ${workshop.title.replace(/^Workshop: /, '')} workshop`, why: 'Optional: more listening, reading, writing and speaking on a unit you have finished.', href: `#/lesson/${workshop.id}` });
  if (current) out.push({ title: current.status === 'in-progress' ? `Continue “${current.title}”` : `Start “${current.title}”`, why: 'The next step on your path.', href: `#/lesson/${current.id}` });
  return out.slice(0, 3);
}

/** Forecast window for finishing the current level, from the last 21 days of pace. */
export async function forecast() {
  const [path, days] = await Promise.all([pathStatus(), dailyRange(21)]);
  const active = days.filter(d => d.lessons > 0).length;
  const lessons21 = days.reduce((s, d) => s + (d.lessons || 0), 0);
  const firstDay = await db.getMeta('startedOn');
  const daysSinceStart = firstDay ? (Date.now() - new Date(firstDay).getTime()) / 86400000 : 0;
  if (daysSinceStart < 10 || lessons21 < 3) return { ready: false, message: 'Not enough data yet — a forecast appears after about two weeks of study.' };
  const perDay = lessons21 / 21;
  const current = path.find(l => l.status === 'in-progress' || l.status === 'available');
  if (!current) return { ready: false, message: 'You have finished every published lesson.' };
  const lvl = current.level;
  const remaining = path.filter(l => !l.optional && l.level === lvl && !['completed', 'completed-weak', 'tested-out'].includes(l.status)).length;
  const d = remaining / perDay;
  const fmt = t => new Date(Date.now() + t * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return { ready: true, level: lvl.toUpperCase(), low: fmt(d * 0.8), high: fmt(d * 1.3), remaining, active, message: `At your current pace, you will likely finish ${lvl.toUpperCase()} between ${fmt(d * 0.8)} and ${fmt(d * 1.3)}.` };
}

export { today };

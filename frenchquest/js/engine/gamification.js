// XP with repeat policies, gentle streaks (rest days + freezes), and earned badges.
import * as db from '../store/db.js';
import { prefs } from '../store/prefs.js';
import { today, bumpDaily, dailyRange } from './progress.js';

export const XP_RULES = {
  lesson:      { xp: 20, policy: 'once' },
  lessonRetry: { xp: 5,  policy: 'daily-once' },
  review:      { xp: 2,  policy: 'each' },
  mission:     { xp: 15, policy: 'daily-once' },
  checkpoint:  { xp: 50, policy: 'once' },
  level:       { xp: 150, policy: 'once' },
  examMini:    { xp: 20, policy: 'daily-max', max: 3 },
  mock:        { xp: 60, policy: 'daily-max', max: 1 },
};

let chain = Promise.resolve();

/** Award XP if the repeat policy allows it. Resolves to the XP granted (0 if none). */
export function award(kind, ref = '') {
  const run = async () => {
    const rule = XP_RULES[kind];
    if (!rule) return 0;
    const ledger = (await db.getMeta('xp')) || { total: 0, keys: {}, daily: {} };
    const d = today();
    let key = null;
    if (rule.policy === 'once') key = `${kind}:${ref}`;
    if (rule.policy === 'daily-once') key = `${kind}:${ref}:${d}`;
    if (key && ledger.keys[key]) return 0;
    if (rule.policy === 'daily-max') {
      const k = `${kind}:${d}`;
      if ((ledger.daily[k] || 0) >= rule.max) return 0;
      ledger.daily[k] = (ledger.daily[k] || 0) + 1;
    }
    if (key) ledger.keys[key] = Date.now();
    ledger.total += rule.xp;
    // Keep the per-day counters small
    for (const k of Object.keys(ledger.daily)) if (!k.endsWith(d)) delete ledger.daily[k];
    await db.setMeta('xp', ledger);
    await bumpDaily('xp', rule.xp);
    return rule.xp;
  };
  chain = chain.then(run, run);
  return chain;
}

export async function totalXP() {
  return ((await db.getMeta('xp')) || { total: 0 }).total;
}

export const isActiveDay = d => d.seconds >= 300 || d.reviews > 0 || d.lessons > 0;

/** Streak that forgives rest days and up to 2 missed days per month (freezes). */
export async function streak() {
  const days = await dailyRange(400);
  const rest = new Set(prefs().restDays || []);
  const freezesUsed = {};
  let count = 0, usedFreeze = 0, restUsed = 0;
  let i = days.length - 1;
  if (!isActiveDay(days[i])) i--; // today still open
  for (; i >= 0; i--) {
    const d = days[i];
    const date = new Date(d.date + 'T12:00:00');
    if (isActiveDay(d)) { count++; continue; }
    if (rest.has(date.getDay())) { restUsed++; continue; }
    const month = d.date.slice(0, 7);
    if ((freezesUsed[month] || 0) < 2 && count > 0) { freezesUsed[month] = (freezesUsed[month] || 0) + 1; usedFreeze++; continue; }
    break;
  }
  const todayDone = isActiveDay(days[days.length - 1]);
  return { count, todayDone, usedFreeze, restUsed };
}

export const BADGES = [
  { id: 'bonjour', name: 'Bonjour !', req: 'Finish your first lesson', test: s => s.lessonsDone >= 1 },
  { id: 'sound-explorer', name: 'Sound explorer', req: 'Finish Unit 1: sounds and survival', test: s => s.unitsDone.has('a1-01') },
  { id: 'conversation-starter', name: 'Conversation starter', req: 'Record your first speaking mission', test: s => s.speaking >= 1 },
  { id: 'storyteller', name: 'Storyteller', req: 'Complete 5 writing missions', test: s => s.writing >= 5 },
  { id: 'word-collector', name: 'Word collector', req: '50 words and phrases established in memory', test: s => s.established >= 50 },
  { id: 'memory-keeper', name: 'Memory keeper', req: '7 days with 90% or better review accuracy', test: s => s.goodReviewDays >= 7 },
  { id: 'steady', name: 'Steady', req: 'Study on 30 different days', test: s => s.activeDays >= 30 },
  { id: 'a1', name: 'A1 explorer', req: 'Pass the A1 mastery checkpoint', test: s => s.unitsDone.has('a1-12') },
  { id: 'a2', name: 'A2 explorer', req: 'Pass the A2 mastery checkpoint', test: s => s.unitsDone.has('a2-12') },
  { id: 'b1', name: 'B1 explorer', req: 'Pass the B1 mastery checkpoint', test: s => s.unitsDone.has('b1-12') },
  { id: 'b2', name: 'B2 explorer', req: 'Pass the B2 mastery checkpoint', test: s => s.unitsDone.has('b2-12') },
  { id: 'exam-first', name: 'First mock', req: 'Complete a timed exam practice', test: s => s.examSessions >= 1 },
];

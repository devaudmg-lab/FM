// Lesson progress, skill evidence, daily activity.
import * as db from '../store/db.js';
import { lessonIndex } from './content.js';

export const SKILLS = ['listening', 'reading', 'speaking', 'writing', 'vocabulary', 'grammar'];
export const SKILL_LABEL = { listening: 'Listening', reading: 'Reading', speaking: 'Speaking', writing: 'Writing', vocabulary: 'Vocabulary', grammar: 'Grammar' };
const DONE = new Set(['completed', 'completed-weak', 'tested-out']);

export const isDone = rec => !!rec && DONE.has(rec.status);

export function today(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function lessonProgressMap() {
  const rows = await db.all('lessons');
  return new Map(rows.map(r => [r.id, r]));
}

export const getLessonProgress = id => db.get('lessons', id);

export async function saveLessonProgress(id, patch) {
  const cur = (await db.get('lessons', id)) || { id, status: 'in-progress', startedAt: Date.now(), attempts: 0 };
  const next = { ...cur, ...patch, updatedAt: Date.now() };
  await db.put('lessons', next);
  return next;
}

/** Status for every lesson in path order, including lock state. */
export async function pathStatus() {
  const [index, prog] = await Promise.all([lessonIndex(), lessonProgressMap()]);
  let prevDone = true;
  return index.map((l, i) => {
    const rec = prog.get(l.id);
    let status = rec?.status || (prevDone ? 'available' : 'locked');
    if (l.status !== 'published') status = rec?.status && DONE.has(rec.status) ? rec.status : 'soon';
    const out = { ...l, status, rec, position: i };
    // Optional workshops open with the unit checkpoint but never gate what follows.
    if (l.status === 'published' && !l.optional) prevDone = DONE.has(status);
    return out;
  });
}

/** The core lesson the learner should continue with (workshops are suggested separately). */
export async function currentLesson() {
  const path = (await pathStatus()).filter(l => !l.optional);
  return path.find(l => l.status === 'in-progress') || path.find(l => l.status === 'available') || null;
}

export async function recordAttempt(a) {
  await db.put('attempts', { ts: Date.now(), ...a });
}

/** Exponentially weighted accuracy over the last 60 attempts per skill (0–100), plus count. */
export async function skillScores() {
  const rows = await db.all('attempts');
  const out = {};
  for (const s of SKILLS) {
    const xs = rows.filter(r => r.skill === s).slice(-60);
    if (!xs.length) { out[s] = { score: null, n: 0 }; continue; }
    let w = 0, acc = 0;
    xs.forEach((r, i) => { const wt = Math.pow(1.05, i); w += wt; acc += wt * (r.status === 'correct' ? 1 : r.status === 'almost' ? 0.6 : 0); });
    out[s] = { score: Math.round((acc / w) * 100), n: xs.length };
  }
  return out;
}

// ---------- Daily activity ----------
let chain = Promise.resolve();
const serial = fn => (chain = chain.then(fn, fn));

export function addActivity(kind, seconds) { return serial(() => _addActivity(kind, seconds)); }
export function bumpDaily(field, by = 1) { return serial(() => _bumpDaily(field, by)); }

async function _addActivity(kind, seconds) {
  if (seconds <= 0) return;
  const date = today();
  const rec = (await db.get('daily', date)) || { date, seconds: 0, kinds: {}, xp: 0, reviews: 0, lessons: 0 };
  rec.seconds += seconds;
  rec.kinds[kind] = (rec.kinds[kind] || 0) + seconds;
  await db.put('daily', rec);
}

async function _bumpDaily(field, by = 1) {
  const date = today();
  const rec = (await db.get('daily', date)) || { date, seconds: 0, kinds: {}, xp: 0, reviews: 0, lessons: 0 };
  rec[field] = (rec[field] || 0) + by;
  await db.put('daily', rec);
  return rec;
}

export async function dailyRange(days) {
  const rows = await db.all('daily');
  const map = new Map(rows.map(r => [r.date, r]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = Date.now() - i * 86400000;
    const k = today(t);
    out.push(map.get(k) || { date: k, seconds: 0, kinds: {}, xp: 0, reviews: 0, lessons: 0 });
  }
  return out;
}

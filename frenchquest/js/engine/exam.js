// Exam Lab engine: loads exam data, estimates NCLC ranges honestly, stores sessions.
import { getExamFile } from './content.js';
import * as db from '../store/db.js';

export const EXAMS = { tef: 'TEF Canada', tcf: 'TCF Canada' };
export const ABILITY_ORDER = ['co', 'ce', 'ee', 'eo'];
export const ABILITY_EN = { co: 'Listening', ce: 'Reading', ee: 'Writing', eo: 'Speaking' };

// Each bank can be split over several files (base + extra packs); they are merged in order.
const BANK_FILES = {
  co: ['items-co', 'items-co-mocks'],
  ce: ['items-ce', 'items-ce-mocks'],
  ee: ['tasks-ee', 'tasks-ee-2'],
  eo: ['tasks-eo', 'tasks-eo-2'],
};

export async function loadExam(exam) {
  const safe = f => getExamFile(exam, f).catch(() => null);
  const [format, nclc] = await Promise.all([safe('format'), safe('nclc')]);
  const banks = {};
  for (const [ab, files] of Object.entries(BANK_FILES)) {
    const parts = (await Promise.all(files.map(safe))).filter(Boolean);
    if (!parts.length) { banks[ab] = null; continue; }
    banks[ab] = ab === 'co' || ab === 'ce'
      ? { ...parts[0], sets: parts.flatMap(p => p.sets || []) }
      : { ...parts[0], tasks: parts.flatMap(p => p.tasks || []) };
  }
  return { exam, format, nclc, banks };
}

/** NCLC level for an official score, or null if below 4. */
export function nclcFor(table, ability, score) {
  // Highest band whose minimum the score reaches; this also handles fractional
  // practice scores that fall between two integer bands (e.g. 248.4).
  const rows = [...(table?.abilities?.[ability] || [])].sort((a, b) => b.min - a.min);
  const r = rows.find(x => score >= x.min);
  return r ? r.nclc : null;
}

/** Score on the official scale for a proportion, assuming a roughly linear scale (a stated approximation). */
export function scaleScore(table, ability, p) {
  const [lo, hi] = table?.scale?.[ability] || [0, 1];
  return lo + Math.max(0, Math.min(1, p)) * (hi - lo);
}

/**
 * Practice estimate as an NCLC *range* with a confidence label. Never a single precise score.
 * p = proportion correct (or rubric proportion for writing/speaking).
 */
export function estimate(table, ability, p, { items = 10, recentSessions = 0 } = {}) {
  const margin = items >= 30 ? 0.06 : items >= 15 ? 0.09 : 0.13;
  const loN = nclcFor(table, ability, scaleScore(table, ability, p - margin));
  const hiN = nclcFor(table, ability, scaleScore(table, ability, p + margin));
  const confidence = recentSessions >= 6 && items >= 15 ? 'higher' : recentSessions >= 3 ? 'medium' : 'low';
  const lo = loN ?? 0, hi = hiN ?? 0;
  let label;
  if (!hi) label = 'below NCLC 4';
  else if (!lo) label = `up to NCLC ${hi}`;
  else if (lo === hi) label = `around NCLC ${lo}`;
  else label = `NCLC ${lo}–${hi}`;
  return { lo, hi, label, confidence };
}

export async function sessions(exam, ability) {
  const all = await db.all('examSessions');
  return all.filter(s => s.exam === exam && (!ability || s.ability === ability)).sort((a, b) => b.ts - a.ts);
}

export async function recentCount(exam, ability) {
  const since = Date.now() - 30 * 86400000;
  return (await sessions(exam, ability)).filter(s => s.ts >= since).length;
}

export async function saveSession(s) {
  const rec = { id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ts: Date.now(), ...s };
  await db.put('examSessions', rec);
  return rec;
}

/** Latest estimate per ability, combining the last few sessions (weighted toward recent). */
export async function abilitySummary(exam, table) {
  const out = {};
  for (const ab of ABILITY_ORDER) {
    const list = (await sessions(exam, ab)).slice(0, 5);
    if (!list.length) { out[ab] = null; continue; }
    let w = 0, acc = 0, items = 0;
    list.forEach((s, i) => { const wt = 1 / (i + 1); w += wt; acc += wt * s.p; items += s.total || 1; });
    const p = acc / w;
    out[ab] = { p, n: list.length, last: list[0], ...estimate(table, ab, p, { items, recentSessions: await recentCount(exam, ab) }) };
  }
  return out;
}

export function microSkillBreakdown(results) {
  const by = {};
  for (const r of results) for (const m of r.microSkills || ['other']) {
    by[m] = by[m] || { n: 0, wrong: 0 };
    by[m].n++;
    if (!r.correct) by[m].wrong++;
  }
  return Object.entries(by).sort((a, b) => b[1].wrong - a[1].wrong);
}

export const MICRO_LABEL = {
  'main-idea': 'Main idea', detail: 'Specific details', 'numbers-dates': 'Numbers, dates and times', intention: 'Speaker or writer intention',
  paraphrase: 'Recognizing paraphrase', inference: 'Inference (reading between the lines)', 'document-type': 'Document type and purpose',
  'opinion-fact': 'Opinion versus fact', vocabulary: 'Vocabulary in context', other: 'Other',
};

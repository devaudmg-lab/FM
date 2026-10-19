// Turns lesson items into review cards, and cards into exercises.
import * as db from '../store/db.js';
import { newCard, grade, inferRating, State, cardRetrievability } from './srs.js';
import { prefs } from '../store/prefs.js';
import { shuffle } from '../exercises/exercises.js';
import { normalize } from './evaluate.js';
import { itemsFor } from './content.js';

const enOf = it => (Array.isArray(it.en) ? it.en[0] : it.en);

export function frOf(it) {
  if (it.kind === 'vocab' && it.article) return it.article.endsWith("'") ? `${it.article}${it.fr}` : `${it.article} ${it.fr}`;
  return it.fr;
}

const dedupeKey = it => `${it.kind}|${normalize(frOf(it))}`;

export function kindsFor(it) {
  if (it.kind === 'grammar') return it.drills?.length ? ['drill'] : [];
  if (it.kind === 'vocab' || it.kind === 'phrase') return ['recognize', 'produce', 'listen'];
  return [];
}

/** Create cards for a completed lesson. Production/listening cards start a little later. */
export async function seedCards(lesson, { asLearning = false } = {}) {
  const now = Date.now();
  const all = await db.all('cards');
  const existing = new Set(all.map(c => c.id));
  // Skip words/phrases the learner already has from another lesson (same French, same kind).
  const otherLessons = [...new Set(all.map(c => c.itemId.split('.')[0]))].filter(l => l !== lesson.id);
  const known = new Set();
  for (const it of (await itemsFor(otherLessons)).values()) if (it.kind !== 'grammar') known.add(dedupeKey(it));
  const toAdd = [];
  for (const it of lesson.items || []) {
    const uid = `${lesson.id}.${it.id}`;
    if (it.kind !== 'grammar' && known.has(dedupeKey(it))) continue;
    kindsFor(it).forEach((k, i) => {
      const id = `${uid}:${k}`;
      if (existing.has(id)) return;
      const c = newCard(id, uid, k, now + i * 3600000); // stagger siblings by an hour
      if (asLearning) c.due = now + 86400000 + i * 3600000;
      toAdd.push(c);
    });
  }
  if (toAdd.length) await db.tx(['cards'], t => toAdd.forEach(c => t.put('cards', c)));
  return toAdd.length;
}

/** Build the queue for a review session. */
export async function buildQueue({ now = Date.now(), limit = prefs().reviewCap, newLimit = prefs().newPerDay } = {}) {
  const cards = await db.all('cards');
  const due = cards.filter(c => c.state !== State.New && c.due <= now);
  const fresh = cards.filter(c => c.state === State.New && c.due <= now);
  const introducedToday = await newIntroducedToday();
  const allowNew = Math.max(0, newLimit - introducedToday);
  // Backlog protection: pause new cards when reviews pile up.
  const avg = await avgDailyReviews();
  const backlog = due.length > Math.max(30, 2 * avg);
  due.sort((a, b) => cardRetrievability(a, now) - cardRetrievability(b, now));
  fresh.sort((a, b) => a.due - b.due);
  const chosen = [];
  const seenItem = new Set();
  const pushBuried = (list, max) => {
    for (const c of list) {
      if (chosen.length >= max) break;
      if (seenItem.has(c.itemId)) continue; // one direction per item per session
      seenItem.add(c.itemId);
      chosen.push(c);
    }
  };
  pushBuried(due, limit);
  const before = chosen.length;
  if (!backlog) pushBuried(fresh, Math.min(limit, before + allowNew));
  // Interleave: avoid long runs from the same lesson
  return { queue: interleave(chosen), dueCount: due.length, newCount: chosen.length - before, backlog };
}

function interleave(cards) {
  const byLesson = new Map();
  for (const c of cards) {
    const l = c.itemId.split('.')[0];
    if (!byLesson.has(l)) byLesson.set(l, []);
    byLesson.get(l).push(c);
  }
  const lanes = [...byLesson.values()];
  const out = [];
  while (lanes.some(l => l.length)) for (const l of lanes) if (l.length) out.push(l.shift());
  return out;
}

async function newIntroducedToday() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const logs = await db.byIndex('reviewLog', 'ts', IDBKeyRange.lowerBound(start.getTime()));
  return logs.filter(l => l.wasNew).length;
}

async function avgDailyReviews() {
  const since = Date.now() - 14 * 86400000;
  const logs = await db.byIndex('reviewLog', 'ts', IDBKeyRange.lowerBound(since));
  return logs.length / 14;
}

export async function dueCount(now = Date.now()) {
  const { queue } = await buildQueue({ now });
  return queue.length;
}

/** Apply an answer to a card and persist card + log. */
export async function answerCard(card, result) {
  const rating = inferRating(result);
  const next = grade(card, rating, Date.now(), { retention: prefs().retention });
  await db.tx(['cards', 'reviewLog'], t => {
    t.put('cards', next);
    t.add('reviewLog', { cardId: card.id, rating, ts: Date.now(), wasNew: card.state === State.New, status: result.status, latencyMs: result.latencyMs });
  });
  return { card: next, rating };
}

/** Make an exercise for a card. `pool` = Map of all known items, for distractors. */
export function exerciseFor(card, item, pool, seed = Math.random()) {
  // Distractors: same part of speech first, then same kind, then anything non-grammar.
  const others = [...pool.values()].filter(x => x.uid !== item.uid && x.kind !== 'grammar');
  const tiers = [
    others.filter(x => x.kind === item.kind && x.pos && x.pos === item.pos),
    others.filter(x => x.kind === item.kind),
    others,
  ];
  const distract = (field) => {
    const target = field(item);
    const out = [];
    for (const tier of tiers) {
      for (const v of shuffle(tier, seed).map(field)) {
        if (v && v !== target && !out.includes(v)) out.push(v);
        if (out.length === 3) return out;
      }
    }
    return out;
  };
  const base = { id: card.id, itemIds: [item.uid] };
  if (card.kind === 'recognize') {
    const ds = distract(enOf);
    return { ...base, type: 'mcq', prompt: frOf(item), promptFr: true, options: [enOf(item), ...ds], answer: 0, explain: item.note };
  }
  if (card.kind === 'listen') {
    const ds = distract(enOf);
    return { ...base, type: 'listen-mcq', fr: item.say || frOf(item), en: enOf(item), prompt: 'What does it mean?', options: [enOf(item), ...ds], answer: 0 };
  }
  if (card.kind === 'produce') {
    const accept = [frOf(item), ...(item.accept || [])];
    return { ...base, type: 'translate', prompt: enOf(item), accept, hint: item.hint, explain: item.note };
  }
  if (card.kind === 'drill') {
    const d = item.drills[(card.reps || 0) % item.drills.length];
    return { ...base, ...d, id: card.id };
  }
  return null;
}

export async function cardStats() {
  const cards = await db.all('cards');
  const by = { new: 0, learning: 0, review: 0, established: 0 };
  for (const c of cards) {
    if (c.state === State.New) by.new++;
    else if (c.state === State.Review && c.stability >= 21 && c.reps >= 3) by.established++;
    else if (c.state === State.Review) by.review++;
    else by.learning++;
  }
  // Items (not cards) established: all of an item's cards established
  const byItem = new Map();
  for (const c of cards) {
    const ok = c.state === State.Review && c.stability >= 21 && c.reps >= 3;
    byItem.set(c.itemId, (byItem.get(c.itemId) ?? true) && ok);
  }
  by.itemsEstablished = [...byItem.values()].filter(Boolean).length;
  by.items = byItem.size;
  by.total = cards.length;
  return by;
}

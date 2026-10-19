// FSRS-4.5 scheduler (Free Spaced Repetition Scheduler, open-spaced-repetition project).
// Pure functions; card objects are plain JSON stored in IndexedDB.
export const Rating = { Again: 1, Hard: 2, Good: 3, Easy: 4 };
export const State = { New: 0, Learning: 1, Review: 2, Relearning: 3 };

const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const DAY = 86400000;
const MIN = 60000;

// Same-session learning steps before FSRS intervals take over.
const LEARN_STEPS = [1 * MIN, 10 * MIN];
const RELEARN_STEPS = [10 * MIN];

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function retrievability(elapsedDays, stability) {
  if (stability <= 0) return 0;
  return Math.pow(1 + FACTOR * elapsedDays / stability, DECAY);
}

export function intervalDays(stability, retention = 0.9, maxDays = 365) {
  const i = (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
  return clamp(Math.round(i), 1, maxDays);
}

const initStability = g => Math.max(W[g - 1], 0.1);
const initDifficulty = g => clamp(W[4] - (g - 3) * W[5], 1, 10);
function nextDifficulty(d, g) {
  const nd = d - W[6] * (g - 3);
  return clamp(W[7] * initDifficulty(Rating.Good) + (1 - W[7]) * nd, 1, 10);
}
function recallStability(d, s, r, g) {
  const hard = g === Rating.Hard ? W[15] : 1;
  const easy = g === Rating.Easy ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy);
}
function forgetStability(d, s, r) {
  const v = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r));
  return Math.min(v, s);
}

// Small deterministic fuzz so cards learned together spread out.
function fuzz(days, seed) {
  if (days < 3) return days;
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const f = ((h % 1000) / 1000 - 0.5) * 0.1; // ±5%
  return Math.max(1, Math.round(days * (1 + f)));
}

export function newCard(id, itemId, kind, now = Date.now()) {
  return { id, itemId, kind, state: State.New, due: now, stability: 0, difficulty: 0, reps: 0, lapses: 0, step: 0, last: 0, created: now };
}

/** Apply a rating. Returns a new card (does not mutate). */
export function grade(card, rating, now = Date.now(), { retention = 0.9, maxDays = 365 } = {}) {
  const c = { ...card };
  const elapsed = c.last ? Math.max(0, (now - c.last) / DAY) : 0;
  c.reps += 1;

  if (c.state === State.New) {
    c.stability = initStability(rating);
    c.difficulty = initDifficulty(rating);
    if (rating === Rating.Easy) return toReview(c, now, retention, maxDays);
    c.state = State.Learning;
    c.step = rating === Rating.Again ? 0 : rating === Rating.Hard ? 0 : 1;
    if (c.step >= LEARN_STEPS.length) return toReview(c, now, retention, maxDays);
    c.due = now + LEARN_STEPS[c.step];
    c.last = now;
    return c;
  }

  if (c.state === State.Learning || c.state === State.Relearning) {
    const steps = c.state === State.Learning ? LEARN_STEPS : RELEARN_STEPS;
    c.difficulty = nextDifficulty(c.difficulty, rating);
    if (rating === Rating.Again) { c.step = 0; c.due = now + steps[0]; c.last = now; return c; }
    if (rating === Rating.Easy) return toReview(c, now, retention, maxDays, 1);
    if (rating === Rating.Good) c.step += 1;
    if (c.step >= steps.length) return toReview(c, now, retention, maxDays);
    c.due = now + steps[c.step];
    c.last = now;
    return c;
  }

  // Review
  const r = retrievability(elapsed, c.stability);
  c.difficulty = nextDifficulty(c.difficulty, rating);
  if (rating === Rating.Again) {
    c.lapses += 1;
    c.stability = forgetStability(card.difficulty, c.stability, r);
    c.state = State.Relearning;
    c.step = 0;
    c.due = now + RELEARN_STEPS[0];
    c.last = now;
    return c;
  }
  c.stability = recallStability(card.difficulty, c.stability, r, rating);
  return toReview(c, now, retention, maxDays);
}

function toReview(c, now, retention, maxDays, bonus = 0) {
  c.state = State.Review;
  c.step = 0;
  const days = fuzz(intervalDays(c.stability, retention, maxDays) + bonus, c.id + c.reps);
  c.scheduledDays = days;
  c.due = startOfDay(now + days * DAY) + 4 * 3600000; // due from 4am on that day
  c.last = now;
  return c;
}

export function startOfDay(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }

/** "Established" = durable memory, shown to learners. */
export function isEstablished(card) {
  return card.state === State.Review && card.stability >= 21 && card.reps >= 3;
}

/** Map an answer outcome to a rating without asking the learner. */
export function inferRating({ status, hintUsed = false, latencyMs = 0, production = false }) {
  if (status === 'incorrect') return Rating.Again;
  if (status === 'almost' || hintUsed) return Rating.Hard;
  if (production && latencyMs > 0 && latencyMs < 6000) return Rating.Easy;
  if (!production && latencyMs > 0 && latencyMs < 2500) return Rating.Easy;
  return Rating.Good;
}

export function cardRetrievability(card, now = Date.now()) {
  if (card.state !== State.Review) return card.state === State.New ? 0 : 0.5;
  return retrievability((now - card.last) / DAY, card.stability);
}

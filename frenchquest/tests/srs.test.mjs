import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCard, grade, Rating, State, retrievability, intervalDays, inferRating, isEstablished } from '../js/engine/srs.js';

const DAY = 86400000;

test('new card goes through learning steps, then into review', () => {
  let c = newCard('x:recognize', 'x', 'recognize', 0);
  c = grade(c, Rating.Good, 0);
  assert.equal(c.state, State.Learning);
  assert.ok(c.due - 0 <= 10 * 60000);
  c = grade(c, Rating.Good, c.due);
  assert.equal(c.state, State.Review);
  assert.ok(c.scheduledDays >= 1);
});

test('Again on a review card lapses into relearning and lowers stability', () => {
  let c = newCard('y', 'y', 'produce', 0);
  c = grade(c, Rating.Easy, 0);
  const s = c.stability;
  c = grade(c, Rating.Again, c.due);
  assert.equal(c.state, State.Relearning);
  assert.equal(c.lapses, 1);
  assert.ok(c.stability <= s);
});

test('successful reviews grow the interval', () => {
  let c = newCard('z', 'z', 'listen', 0);
  c = grade(c, Rating.Easy, 0);
  const intervals = [];
  for (let i = 0; i < 4; i++) { const t = c.due; c = grade(c, Rating.Good, t); intervals.push(c.scheduledDays); }
  for (let i = 1; i < intervals.length; i++) assert.ok(intervals[i] >= intervals[i - 1], `interval ${i} should not shrink: ${intervals}`);
  assert.ok(isEstablished(c));
});

test('retrievability is 0.9 after exactly one stability period at default retention', () => {
  assert.ok(Math.abs(retrievability(10, 10) - 0.9) < 1e-9);
  assert.equal(intervalDays(10, 0.9), 10);
  assert.ok(intervalDays(10, 0.95) < intervalDays(10, 0.9));
});

test('inferRating maps answer outcomes', () => {
  assert.equal(inferRating({ status: 'incorrect' }), Rating.Again);
  assert.equal(inferRating({ status: 'almost' }), Rating.Hard);
  assert.equal(inferRating({ status: 'correct', hintUsed: true }), Rating.Hard);
  assert.equal(inferRating({ status: 'correct', latencyMs: 9000 }), Rating.Good);
  assert.equal(inferRating({ status: 'correct', latencyMs: 3000, production: true }), Rating.Easy);
});

test('grade does not mutate the input card', () => {
  const c = newCard('m', 'm', 'recognize', 0);
  const copy = { ...c };
  grade(c, Rating.Good, 0);
  assert.deepEqual(c, copy);
});

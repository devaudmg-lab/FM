import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nclcFor, estimate, scaleScore } from '../js/engine/exam.js';

const tef = JSON.parse(readFileSync(new URL('../data/exam/tef/nclc.json', import.meta.url)));
const tcf = JSON.parse(readFileSync(new URL('../data/exam/tcf/nclc.json', import.meta.url)));

test('official TEF scores map to the IRCC NCLC table', () => {
  assert.equal(nclcFor(tef, 'co', 249), 7);
  assert.equal(nclcFor(tef, 'co', 248), 6);
  assert.equal(nclcFor(tef, 'ce', 232), 7);
  assert.equal(nclcFor(tef, 'eo', 310), 7);
  assert.equal(nclcFor(tef, 'ee', 100), null);
});

test('official TCF scores map to the IRCC NCLC table', () => {
  assert.equal(nclcFor(tcf, 'co', 458), 7);
  assert.equal(nclcFor(tcf, 'ce', 453), 7);
  assert.equal(nclcFor(tcf, 'ee', 10), 7);
  assert.equal(nclcFor(tcf, 'eo', 6), 5);
  assert.equal(nclcFor(tcf, 'co', 699), 10);
});

test('practice estimates are always ranges or bands, never a raw score', () => {
  for (const p of [0, 0.3, 0.55, 0.7, 0.85, 1]) {
    const e = estimate(tef, 'co', p, { items: 10 });
    assert.ok(/NCLC|below/.test(e.label));
    assert.ok(!/\d{3}/.test(e.label), `label must not contain a raw score: ${e.label}`);
    assert.ok(['low', 'medium', 'higher'].includes(e.confidence));
  }
});

test('more items narrow the range', () => {
  const small = estimate(tef, 'ce', 0.72, { items: 10 });
  const big = estimate(tef, 'ce', 0.72, { items: 40, recentSessions: 6 });
  assert.ok(big.hi - big.lo <= small.hi - small.lo);
  assert.equal(big.confidence, 'higher');
});

test('fractional practice scores between bands map to the lower band', () => {
  assert.equal(nclcFor(tef, 'co', 248.4), 6);
  assert.equal(nclcFor(tef, 'co', 279.5), 7);
  const e = estimate(tef, 'co', 0.75, { items: 30, recentSessions: 3 });
  assert.equal(e.label, 'NCLC 6–8'); // 0.69 → 248.4 sits in band 6, 0.81 → 291.6 in band 8
});

test('scaleScore is clamped', () => {
  assert.equal(scaleScore(tef, 'co', 2), 360);
  assert.equal(scaleScore(tef, 'co', -1), 0);
});

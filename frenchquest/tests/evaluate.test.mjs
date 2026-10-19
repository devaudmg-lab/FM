import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchText, normalize, countWords, diffWords } from '../js/engine/evaluate.js';

const st = (a, acc, o) => matchText(a, acc, o).status;

test('normalization ignores case, final punctuation, French spacing and apostrophe style', () => {
  assert.equal(st("j’habite à Montréal", ["J'habite à Montréal."]), 'correct');
  assert.equal(st('Tu es de quelle nationalité?', ['Tu es de quelle nationalité ?']), 'correct');
  assert.equal(st('  NOUS   SOMMES  canadiens ', ['Nous sommes canadiens.']), 'correct');
  assert.equal(st('Je mange des oeufs', ['Je mange des œufs.']), 'correct');
});

test('accent slips are "almost" in lenient mode and wrong in strict mode', () => {
  assert.equal(st('Vous etes chinois ?', ['Vous êtes chinois ?']), 'almost');
  assert.equal(st('Vous etes chinois ?', ['Vous êtes chinois ?'], { accentMode: 'strict' }), 'incorrect');
});

test('meaning-changing accents are always wrong', () => {
  assert.equal(st('Il va a Paris', ['Il va à Paris.']), 'incorrect');
  assert.equal(st('Tu habites ou ?', ['Tu habites où ?']), 'incorrect');
});

test('missing agreement or conjugation endings are wrong, with a note', () => {
  const r = matchText('Amira est marocain', ['Amira est marocaine.']);
  assert.equal(r.status, 'incorrect');
  assert.equal(r.kind, 'ending');
  assert.equal(st('Nous sommes canadien', ['Nous sommes canadiens.']), 'incorrect');
  assert.equal(st('Ils parle français', ['Ils parlent français.']), 'incorrect');
});

test('one-letter typos in long words are "almost"', () => {
  assert.equal(st('Je suis francias', ['Je suis français.']), 'almost');
  assert.equal(st('Je suis', ['Je suis']), 'correct');
});

test('missing elision gets targeted feedback', () => {
  const r = matchText('je ai trente ans', ["J'ai trente ans."]);
  assert.equal(r.status, 'incorrect');
  assert.equal(r.kind, 'elision');
});

test('any accepted variant matches', () => {
  assert.equal(st('On est canadiens', ['Nous sommes canadiens.', 'On est canadiens.']), 'correct');
});

test('empty answer is incorrect', () => assert.equal(st('   ', ['Oui']), 'incorrect'));

test('word count: elisions count as two, hyphenated words as one', () => {
  assert.equal(countWords("J'habite à Montréal."), 4);
  assert.equal(countWords('Est-ce que tu viens ?'), 4);
  assert.equal(countWords(''), 0);
});

test('diff marks inserted and deleted words', () => {
  const d = diffWords('Je suis canadien', 'Je suis canadienne');
  assert.deepEqual(d.map(x => x.t), ['same', 'same', 'del', 'ins']);
});

test('normalize keeps hyphens and apostrophes', () => {
  assert.equal(normalize("Qu’est-ce que c’est ?"), "qu'est-ce que c'est");
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speakable } from '../js/media/speech.js';

test('times are spoken as heures', () => {
  assert.equal(speakable('Le train part à 18 h 30.'), 'Le train part à 18 heures 30.');
  assert.equal(speakable('Ouvert dès 9 h'), 'Ouvert dès 9 heures');
  assert.equal(speakable('à 1 h'), 'à 1 heure');
});

test('prices in dollars and euros, with French thousands separators', () => {
  assert.equal(speakable('Ça coûte 2,50 $.'), 'Ça coûte 2 dollars 50.');
  assert.equal(speakable('Loyer : 1 650 $'), 'Loyer : 1650 dollars');
  assert.equal(speakable('1 200 000 $'), '1200000 dollars');
  assert.equal(speakable('12 €'), '12 euros');
});

test('Canadian phone numbers are read digit by digit', () => {
  assert.equal(speakable('Appelez le 819 555-0142.'), 'Appelez le 8 1 9, 5 5 5, 0 1 4 2.');
});

test('texting abbreviations and ad shorthand become full words', () => {
  assert.equal(speakable('slt, tkt !'), "salut, t'inquiète !");
  assert.equal(speakable('Un 4 ½, n/c n/é'), 'Un 4 et demie, non chauffé non éclairé');
  assert.equal(speakable('Je suis au rdc'), 'Je suis au rez-de-chaussée');
});

test('ordinals are read as words', () => {
  assert.equal(speakable('le 1er juillet'), 'le premier juillet');
  assert.equal(speakable('la 1re fois'), 'la première fois');
  assert.equal(speakable('le 3e étage'), 'le 3ième étage');
});

test('ordinary words containing abbreviation letters are untouched', () => {
  assert.equal(speakable('Je cherche le décor'), 'Je cherche le décor');
  assert.equal(speakable('Bonjour'), 'Bonjour');
});

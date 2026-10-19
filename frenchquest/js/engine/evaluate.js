// Answer evaluation for typed French. Pure functions (unit-tested in tests/evaluate.test.mjs).

// Pairs where an accent changes the meaning: never accepted as "almost".
const MINIMAL_PAIRS = [
  ['a', 'à'], ['ou', 'où'], ['du', 'dû'], ['la', 'là'], ['sur', 'sûr'], ['mur', 'mûr'],
  ['des', 'dès'], ['jeune', 'jeûne'], ['tache', 'tâche'], ['pecher', 'pêcher'], ['pecheur', 'pêcheur'],
  ['cote', 'côte'], ['cote', 'côté'], ['cote', 'coté'], ['ma', 'mâ'], ['ere', 'ère'],
  ['mais', 'maïs'], ['eleve', 'élève'], ['ete', 'été'], ['achete', 'acheté'], ['parle', 'parlé'],
  ['mange', 'mangé'], ['habite', 'habité'], ['aime', 'aimé'], ['travaille', 'travaillé'],
  ['regarde', 'regardé'], ['ecoute', 'écouté'], ['etudie', 'étudié'], ['donne', 'donné'],
];
const PAIR_SET = new Set(MINIMAL_PAIRS.map(([a, b]) => `${a}|${b}`));

export function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

/** Normalize for comparison. Keeps accents (handled separately). */
export function normalize(s, { keepPunct = false } = {}) {
  let t = String(s ?? '').normalize('NFC');
  t = t.replace(/[   ]/g, ' ');
  t = t.replace(/[’‘ʼ´`]/g, "'").replace(/[«»“”„]/g, '"');
  t = t.replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/Æ/g, 'AE');
  t = t.replace(/[‐‑‒–—]/g, '-');
  t = t.toLowerCase();
  if (!keepPunct) t = t.replace(/[.,!?;:"…()]/g, ' ');
  t = t.replace(/\s*'\s*/g, "'");
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

export const words = s => normalize(s).split(' ').filter(Boolean);

function damerau(a, b) {
  const al = a.length, bl = b.length;
  if (Math.abs(al - bl) > 2) return 3;
  const d = Array.from({ length: al + 1 }, (_, i) => [i, ...Array(bl).fill(0)]);
  for (let j = 1; j <= bl; j++) d[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[al][bl];
}

function isMinimalPair(given, expected) {
  return PAIR_SET.has(`${given}|${expected}`) || PAIR_SET.has(`${expected}|${given}`);
}

/** Compare word arrays; classify each difference. */
function compareWords(gw, ew) {
  if (gw.length !== ew.length) return null;
  let accentOnly = 0, typos = 0;
  for (let i = 0; i < gw.length; i++) {
    const g = gw[i], e = ew[i];
    if (g === e) continue;
    if (stripAccents(g) === stripAccents(e)) {
      if (isMinimalPair(g, e)) return null;
      accentOnly++;
      continue;
    }
    const gs = stripAccents(g), es = stripAccents(e);
    // A missing or extra ending (-e, -s, -es, -nt…) is agreement/conjugation, not a typo.
    if (gs.startsWith(es) || es.startsWith(gs)) return null;
    if (e.length >= 5 && damerau(gs, es) === 1) { typos++; continue; }
    return null;
  }
  return { accentOnly, typos };
}

/**
 * @returns {{status:'correct'|'almost'|'incorrect', expected:string, note?:string, kind?:string}}
 */
export function matchText(answer, accepted, { accentMode = 'lenient' } = {}) {
  const list = (Array.isArray(accepted) ? accepted : [accepted]).filter(Boolean);
  const given = normalize(answer);
  if (!given) return { status: 'incorrect', expected: list[0] || '', note: 'No answer given.' };
  for (const a of list) if (normalize(a) === given) return { status: 'correct', expected: a };

  // Missing elision, e.g. "je ai" for "j'ai"
  const elided = given.replace(/\b(j|l|d|n|m|t|s|c|qu|jusqu|lorsqu|puisqu)e ([aeiouyhéèêàâîôû])/g, "$1'$2").replace(/\bla ([aeiouyéèêàâîôû])/g, "l'$1");
  if (elided !== given) {
    for (const a of list) if (normalize(a) === elided) return { status: 'incorrect', expected: a, kind: 'elision', note: "French drops the vowel before a vowel sound: je + ai → j'ai, le + ami → l'ami." };
  }

  const gw = given.split(' ');
  // Ending mismatch (agreement / conjugation): give a targeted note.
  for (const a of list) {
    const ew = normalize(a).split(' ');
    if (ew.length !== gw.length) continue;
    const diffs = ew.map((w, i) => [gw[i], w]).filter(([g, w]) => g !== w);
    if (diffs.length === 1) {
      const [g, w] = diffs[0].map(stripAccents);
      if (g !== w && (g.startsWith(w) || w.startsWith(g))) return { status: 'incorrect', expected: a, kind: 'ending', note: `Check the ending: “${diffs[0][1]}”, not “${diffs[0][0]}” (agreement or conjugation).` };
    }
  }
  let best = null;
  for (const a of list) {
    const r = compareWords(gw, normalize(a).split(' '));
    if (r && (!best || r.accentOnly + r.typos < best.r.accentOnly + best.r.typos)) best = { a, r };
  }
  if (best) {
    const { accentOnly, typos } = best.r;
    if (typos + accentOnly <= Math.max(1, Math.ceil(gw.length / 4))) {
      if (typos === 0 && accentMode === 'strict') return { status: 'incorrect', expected: best.a, kind: 'accent', note: 'Check the accents.' };
      return {
        status: 'almost', expected: best.a, kind: typos ? 'typo' : 'accent',
        note: typos && accentOnly ? 'Small spelling and accent slips.' : typos ? 'Nearly — one small spelling slip.' : 'Right words — check the accents.',
      };
    }
  }
  return { status: 'incorrect', expected: list[0] };
}

/** Word-level diff (LCS) for showing corrections: returns [{t:'same'|'del'|'ins', w}] */
export function diffWords(given, expected) {
  const a = String(given).trim().split(/\s+/).filter(Boolean);
  const b = String(expected).trim().split(/\s+/).filter(Boolean);
  const key = w => normalize(w);
  const m = a.length, n = b.length;
  const L = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) L[i][j] = key(a[i]) === key(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (key(a[i]) === key(b[j])) { out.push({ t: 'same', w: b[j] }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) out.push({ t: 'del', w: a[i++] });
    else out.push({ t: 'ins', w: b[j++] });
  }
  while (i < m) out.push({ t: 'del', w: a[i++] });
  while (j < n) out.push({ t: 'ins', w: b[j++] });
  return out;
}

/** French word count rule shown to learners: elided forms count as 2 (l'homme), hyphenated compounds as 1. */
export function countWords(text) {
  const t = String(text || '').replace(/[’]/g, "'").trim();
  if (!t) return 0;
  return t.split(/\s+/).reduce((n, tok) => {
    const clean = tok.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (!clean) return n;
    return n + clean.split("'").filter(Boolean).length;
  }, 0);
}

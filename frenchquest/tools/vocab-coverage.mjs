// Vocabulary check: how much of everyday French (a frequency list) does the course expose learners to?
// Usage: node tools/vocab-coverage.mjs <frequency-list.txt> [--top 5000] [--out missing.txt]
// The list format is "word count" per line, most frequent first (e.g. hermitdave/FrequencyWords fr_50k.txt,
// built from OpenSubtitles). Coverage counts surface forms seen anywhere in lessons, decks and exam data.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const listPath = args.find(a => !a.startsWith('--'));
const top = Number(args[args.indexOf('--top') + 1]) || 5000;
const outPath = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
if (!listPath) { console.error('Usage: node tools/vocab-coverage.mjs <frequency-list.txt> [--top 5000] [--out missing.txt]'); process.exit(1); }

// Collect every string in course content, split into lowercase word tokens.
const seen = new Map(); // word -> count
const walk = v => {
  if (typeof v === 'string') {
    const text = v.toLowerCase().normalize('NFC').replace(/[’‘ʼ]/g, "'").replace(/œ/g, 'oe').replace(/æ/g, 'ae');
    for (const t of text.split(/[^\p{L}'\-]+/u)) {
      if (!t) continue;
      const add = w => w && seen.set(w, (seen.get(w) || 0) + 1);
      add(t);
      for (const piece of t.split(/['-]/)) add(piece);
      // elided forms keep their apostrophe in frequency lists: "l'homme" → "l'"
      const m = t.match(/^([\p{L}]+')/u); if (m) add(m[1]);
    }
  } else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
};
const dirs = [join(root, 'data', 'lessons'), join(root, 'data', 'exam')];
let files = 0;
for (const d of dirs) {
  if (!existsSync(d)) continue;
  for (const sub of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, sub.name);
    const list = sub.isDirectory() ? readdirSync(p).map(f => join(p, f)) : [p];
    for (const f of list) if (f.endsWith('.json')) { walk(JSON.parse(readFileSync(f, 'utf8'))); files++; }
  }
}

// Elided articles and pronouns appear split by the tokenizer ("l'homme" → "l", "homme"); treat them as seen.
for (const w of ['l', 'd', 'j', 'm', 't', 's', 'n', 'c', 'qu', 'jusqu', 'lorsqu', 'puisqu']) seen.set(w, 1);

const freq = readFileSync(listPath, 'utf8').split(/\r?\n/).map(l => l.split(' ')[0].replace(/œ/g, 'oe')).filter(Boolean);
const missing = [];
const report = [];
for (const n of [500, 1000, 2000, 3000, 4000, 5000].filter(x => x <= top)) {
  const slice = freq.slice(0, n);
  const hit = slice.filter(w => seen.has(w)).length;
  report.push(`top ${String(n).padStart(4)}: ${((hit / n) * 100).toFixed(1)}% seen in the course (${n - hit} missing)`);
}
freq.slice(0, top).forEach((w, i) => { if (!seen.has(w)) missing.push(`${i + 1}\t${w}`); });

console.log(`${files} content files, ${seen.size} distinct word forms`);
console.log(report.join('\n'));
if (outPath) { writeFileSync(outPath, missing.join('\n') + '\n'); console.log(`missing list (${missing.length}) → ${outPath}`); }

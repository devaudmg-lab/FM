// Writes data/course.json from tools/course-source.mjs. A lesson is "published" when its file exists
// and its meta.reviewStatus is "ai-verified" or "reviewed" (pass --drafts to publish drafts too).
import { writeFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { LEVELS } from './course-source.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const drafts = process.argv.includes('--drafts');
let pub = 0, total = 0;

const course = {
  schemaVersion: 1,
  levels: LEVELS.map(lv => ({
    id: lv.id, title: lv.title, outcome: lv.outcome,
    units: lv.units.map(([title, outcome, lessons], ui) => {
      const uid = `${lv.id}-${String(ui + 1).padStart(2, '0')}`;
      return {
        id: uid, title, outcome,
        lessons: lessons.map(([lt, focus], li) => {
          const id = `${uid}-${String(li + 1).padStart(2, '0')}`;
          const file = join(root, 'data', 'lessons', lv.id, `${id}.json`);
          let status = 'planned', minutes = 10, title = lt;
          if (existsSync(file)) {
            try {
              const j = JSON.parse(readFileSync(file, 'utf8'));
              const ok = ['ai-verified', 'reviewed'].includes(j.meta?.reviewStatus);
              status = ok || drafts ? 'published' : 'draft';
              minutes = j.minutes || 10;
              title = j.title || lt;
            } catch { status = 'broken'; }
          }
          total++;
          if (status === 'published') pub++;
          // Lesson 6 of each unit is an optional practice workshop: it never blocks the path.
          return { id, title, focus, minutes, status, ...(li === 5 ? { optional: true } : {}) };
        }),
      };
    }),
  })),
};
writeFileSync(join(root, 'data', 'course.json'), JSON.stringify(course, null, 1) + '\n');
console.log(`course.json: ${pub}/${total} lessons published`);

// Vocabulary decks index (data/lessons/vocab/vocab-NN.json → data/vocab-decks.json)
const vdir = join(root, 'data', 'lessons', 'vocab');
const decks = [];
if (existsSync(vdir)) {
  for (const f of readdirSync(vdir).filter(x => /^vocab-\d{2}\.json$/.test(x)).sort()) {
    try {
      const j = JSON.parse(readFileSync(join(vdir, f), 'utf8'));
      const ok = ['ai-verified', 'reviewed'].includes(j.meta?.reviewStatus);
      if (!ok && !drafts) continue;
      decks.push({ id: j.id, title: j.title, band: j.band || '', cefr: j.cefr || '', theme: j.theme || '', count: (j.items || []).length, minutes: j.minutes || 15 });
    } catch { /* skip broken deck */ }
  }
}
writeFileSync(join(root, 'data', 'vocab-decks.json'), JSON.stringify({ schemaVersion: 1, decks }, null, 1) + '\n');
console.log(`vocab-decks.json: ${decks.length} decks published`);

// Glossary for tap-to-hear (data/glossary.json): French form → short English meaning,
// built from the vocabulary and phrase items of every published lesson and deck.
const published = new Set([...course.levels.flatMap(l => l.units.flatMap(u => u.lessons.filter(x => x.status === 'published').map(x => x.id))), ...decks.map(d => d.id)]);
const words = {};
const key = s => String(s).normalize('NFC').toLowerCase().replace(/’/g, "'").replace(/[.!?…,;:«»"]+/g, '').replace(/\s+/g, ' ').trim();
const ARTICLE = /^(le |la |les |l'|un |une |des |du |de la |de l')/;
for (const dir of ['a1', 'a2', 'b1', 'b2', 'vocab']) {
  const d = join(root, 'data', 'lessons', dir);
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d).filter(x => x.endsWith('.json'))) {
    let L; try { L = JSON.parse(readFileSync(join(d, f), 'utf8')); } catch { continue; }
    if (!published.has(L.id)) continue;
    for (const it of L.items || []) {
      if (it.kind !== 'vocab' && it.kind !== 'phrase') continue;
      const en = (Array.isArray(it.en) ? it.en[0] : it.en || '').trim();
      if (!en) continue;
      const forms = [it.fr, it.fem, it.article && (it.article.endsWith("'") ? it.article + it.fr : `${it.article} ${it.fr}`)].filter(Boolean).map(key);
      for (const k of forms) {
        for (const form of [k, k.replace(ARTICLE, '')]) if (form && !(form in words)) words[form] = en;
      }
    }
  }
}
writeFileSync(join(root, 'data', 'glossary.json'), JSON.stringify({ schemaVersion: 1, words }) + '\n');
console.log(`glossary.json: ${Object.keys(words).length} entries`);

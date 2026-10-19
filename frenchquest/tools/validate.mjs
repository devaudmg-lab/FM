// Validates content files against CONTENT-GUIDE.md. Zero dependencies.
// Usage: node tools/validate.mjs [lesson-id ...]   (exit code 1 on errors)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
const errors = [], warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

const BLOCKS = new Set(['dialogue', 'text', 'listen', 'explain', 'pattern', 'examples', 'table', 'vocab', 'repeat', 'deepdive', 'note', 'review-mix']);
const EXERCISES = new Set(['mcq', 'listen-mcq', 'translate', 'cloze', 'reorder', 'match', 'dictation', 'write', 'speak']);
const GRADED = new Set(['mcq', 'listen-mcq', 'translate', 'cloze', 'reorder', 'match', 'dictation']);
const STEP_TYPES = new Set(['discover', 'understand', 'hear', 'recall', 'apply', 'review', 'assess']);
const KINDS = new Set(['vocab', 'phrase', 'grammar']);
const ARTICLES = new Set(['le', 'la', "l'", 'les', 'un', 'une', 'des']);

const str = v => typeof v === 'string' && v.trim().length > 0;
const tokens = s => s.split(/\s+/).map(t => t.replace(/[.,!?;:…]+$/, '')).filter(t => t && !/^[.,!?;:…«»"]+$/.test(t));

function checkExercise(f, ex, where, { inDrill = false } = {}) {
  const w = `${where}${ex.id ? ` (${ex.id})` : ''}`;
  if (!inDrill && !str(ex.id)) err(f, `${w}: exercise needs an id`);
  switch (ex.type) {
    case 'mcq': case 'listen-mcq':
      if (!Array.isArray(ex.options) || ex.options.length < 2) err(f, `${w}: needs 2+ options`);
      else if (!Number.isInteger(ex.answer) || ex.answer < 0 || ex.answer >= ex.options.length) err(f, `${w}: answer index out of range`);
      else if (new Set(ex.options).size !== ex.options.length) err(f, `${w}: duplicate options`);
      if (ex.type === 'listen-mcq' && !str(ex.fr)) err(f, `${w}: listen-mcq needs fr (the audio text)`);
      if (ex.optionFeedback && ex.optionFeedback.length !== ex.options?.length) warn(f, `${w}: optionFeedback length differs from options`);
      break;
    case 'translate':
      if (!str(ex.prompt)) err(f, `${w}: needs prompt`);
      if (!Array.isArray(ex.accept) || !ex.accept.length || !ex.accept.every(str)) err(f, `${w}: needs accept[]`);
      else if (/\byou\b/i.test(ex.prompt) && ex.accept.length < 2 && !/\((formal|informal|to a friend|friend|plural|polite|tu|vous)/i.test(ex.prompt)) warn(f, `${w}: "you" is ambiguous — add accepted variants or clarify the prompt`);
      break;
    case 'cloze': {
      if (!str(ex.text)) { err(f, `${w}: needs text`); break; }
      const gaps = ex.text.split('___').length - 1;
      if (!gaps) err(f, `${w}: text has no ___ blank`);
      if (!Array.isArray(ex.answers) || ex.answers.length !== gaps) err(f, `${w}: answers must have one array per blank (${gaps})`);
      else if (!ex.answers.every(a => Array.isArray(a) && a.length && a.every(str))) err(f, `${w}: each answers entry must be a non-empty array of strings`);
      if (ex.choices && ex.answers && !ex.answers.every(a => a.some(x => ex.choices.includes(x)))) warn(f, `${w}: choices do not include an accepted answer`);
      break;
    }
    case 'reorder':
      if (!Array.isArray(ex.accept) || !ex.accept.length) { err(f, `${w}: needs accept[]`); break; }
      {
        const n = tokens(ex.accept[0]).length;
        if (n < 2 || n > 12) warn(f, `${w}: ${n} tiles (aim for 3–9)`);
        const base = tokens(ex.accept[0]).map(t => t.toLowerCase()).sort().join(' ');
        for (const a of ex.accept.slice(1)) if (tokens(a).map(t => t.toLowerCase()).sort().join(' ') !== base && !ex.tiles) warn(f, `${w}: alternative "${a}" uses different tiles than accept[0]`);
      }
      break;
    case 'match':
      if (!Array.isArray(ex.pairs) || ex.pairs.length < 2 || !ex.pairs.every(p => Array.isArray(p) && p.length === 2 && str(p[0]) && str(p[1]))) err(f, `${w}: needs pairs [[fr, en], …]`);
      else {
        if (new Set(ex.pairs.map(p => p[0])).size !== ex.pairs.length) err(f, `${w}: duplicate left side`);
        if (new Set(ex.pairs.map(p => p[1])).size !== ex.pairs.length) err(f, `${w}: duplicate right side`);
        if (ex.pairs.length > 6) warn(f, `${w}: more than 6 pairs`);
      }
      break;
    case 'dictation':
      if (!str(ex.fr)) err(f, `${w}: needs fr`);
      break;
    case 'write':
      if (!str(ex.prompt)) err(f, `${w}: needs prompt`);
      if (!ex.models?.length) warn(f, `${w}: no model answer`);
      break;
    case 'speak':
      if (!str(ex.prompt)) err(f, `${w}: needs prompt`);
      if (!ex.models?.length) warn(f, `${w}: no model answer`);
      break;
    default:
      err(f, `${w}: unknown exercise type "${ex.type}"`);
  }
  for (const k of ['prompt', 'text', 'fr']) if (typeof ex[k] === 'string' && ex[k] !== ex[k].normalize('NFC')) err(f, `${w}: ${k} is not NFC-normalized`);
}

function checkLesson(file, course) {
  const f = basename(file);
  let L;
  try { L = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { err(f, `invalid JSON: ${e.message}`); return; }
  const id = f.replace(/\.json$/, '');
  if (L.schemaVersion !== 1) err(f, 'schemaVersion must be 1');
  if (L.id !== id) err(f, `id "${L.id}" does not match file name`);
  if (/^vocab-\d{2}$/.test(id)) {
    // Vocabulary decks live outside the course map.
    if (L.level !== 'vocab') err(f, 'vocabulary decks need "level": "vocab"');
    if (!str(L.band)) warn(f, 'vocabulary deck has no band (e.g. "Everyday words 1–500")');
  } else {
    if (!course.has(id)) err(f, 'id is not in the course map (tools/course-source.mjs)');
    if (L.level !== id.split('-')[0]) err(f, 'level does not match id');
    if (L.unit !== id.split('-').slice(0, 2).join('-')) err(f, 'unit does not match id');
  }
  for (const k of ['title', 'goal']) if (!str(L[k])) err(f, `missing ${k}`);
  if (!Number.isFinite(L.minutes)) warn(f, 'missing minutes');
  if (!L.meta || !['ai-draft', 'ai-verified', 'reviewed'].includes(L.meta.reviewStatus)) err(f, 'meta.reviewStatus must be ai-draft | ai-verified | reviewed');

  const items = Array.isArray(L.items) ? L.items : [];
  if (!items.length) warn(f, 'no items (nothing enters review)');
  const ids = new Set();
  for (const it of items) {
    const w = `item ${it.id}`;
    if (!str(it.id)) err(f, 'item without id');
    if (ids.has(it.id)) err(f, `${w}: duplicate item id`);
    ids.add(it.id);
    if (!KINDS.has(it.kind)) err(f, `${w}: kind must be vocab | phrase | grammar`);
    if (!str(it.fr)) err(f, `${w}: missing fr`);
    if (!(str(it.en) || (Array.isArray(it.en) && it.en.length))) err(f, `${w}: missing en`);
    if (it.kind === 'vocab' && it.pos === 'noun') {
      if (!ARTICLES.has(it.article)) err(f, `${w}: noun needs article`);
      if (!['m', 'f'].includes(it.gender)) err(f, `${w}: noun needs gender m|f`);
    }
    if (it.kind === 'grammar') {
      if (!it.drills?.length) err(f, `${w}: grammar item needs drills`);
      else it.drills.forEach((d, i) => { if (!['cloze', 'translate', 'mcq'].includes(d.type)) err(f, `${w} drill ${i}: type must be cloze | translate | mcq`); checkExercise(f, d, `${w} drill ${i}`, { inDrill: true }); });
    }
  }
  const enSeen = new Map();
  for (const it of items) if (it.kind !== 'grammar') {
    const e = Array.isArray(it.en) ? it.en[0] : it.en;
    if (enSeen.has(e)) warn(f, `items ${enSeen.get(e)} and ${it.id} share the English "${e}" — EN→FR cards will be ambiguous`);
    enSeen.set(e, it.id);
  }

  if (!Array.isArray(L.steps) || L.steps.length < 3) { err(f, 'needs at least 3 steps'); return; }
  const exIds = new Set();
  let graded = 0;
  for (const [si, s] of L.steps.entries()) {
    const where = `step ${si + 1} (${s.type})`;
    if (!STEP_TYPES.has(s.type)) err(f, `${where}: unknown step type`);
    if (!Array.isArray(s.blocks) || !s.blocks.length) { err(f, `${where}: no blocks`); continue; }
    let stepGraded = 0;
    for (const [bi, b] of s.blocks.entries()) {
      const w = `${where} block ${bi + 1} (${b.type})`;
      if (EXERCISES.has(b.type)) {
        checkExercise(f, b, w);
        if (exIds.has(b.id)) err(f, `${w}: duplicate exercise id ${b.id}`);
        exIds.add(b.id);
        if (GRADED.has(b.type)) { graded++; stepGraded++; }
        continue;
      }
      if (!BLOCKS.has(b.type)) { err(f, `${w}: unknown block type`); continue; }
      if (b.type === 'dialogue' && !(b.lines?.length && b.lines.every(l => str(l.fr) && str(l.speaker)))) err(f, `${w}: lines need speaker and fr`);
      if (b.type === 'repeat' && !(b.lines?.length && b.lines.every(l => str(l.fr)))) err(f, `${w}: lines need fr`);
      if (b.type === 'vocab') for (const iid of b.itemIds || []) if (!ids.has(iid)) err(f, `${w}: unknown item ${iid}`);
      if (b.type === 'table' && !(Array.isArray(b.rows) && b.rows.every(Array.isArray))) err(f, `${w}: rows must be arrays`);
      if (b.type === 'pattern' && !str(b.pattern)) err(f, `${w}: needs pattern`);
      if (['explain', 'deepdive', 'note'].includes(b.type) && !str(b.body)) err(f, `${w}: needs body`);
      if (['text', 'listen'].includes(b.type) && !str(b.fr)) err(f, `${w}: needs fr`);
      for (const k of ['body', 'note']) if (typeof b[k] === 'string' && /<[a-z]/i.test(b[k])) err(f, `${w}: HTML is not allowed in md-lite`);
    }
    if (s.type === 'recall' && stepGraded < 6) warn(f, `${where}: recall has ${stepGraded} graded exercises (aim for 6–10)`);
  }
  if (graded < 5) warn(f, `only ${graded} graded exercises in the lesson`);
}

// Course map ids
const { LEVELS } = await import('./course-source.mjs');
const course = new Set();
for (const lv of LEVELS) lv.units.forEach((u, ui) => u[2].forEach((l, li) => course.add(`${lv.id}-${String(ui + 1).padStart(2, '0')}-${String(li + 1).padStart(2, '0')}`)));

const lessonDir = join(root, 'data', 'lessons');
let n = 0;
for (const lvl of existsSync(lessonDir) ? readdirSync(lessonDir) : []) {
  for (const file of readdirSync(join(lessonDir, lvl)).filter(x => x.endsWith('.json'))) {
    if (only.length && !only.includes(file.replace('.json', ''))) continue;
    checkLesson(join(lessonDir, lvl, file), course);
    n++;
  }
}

// Exam data
for (const exam of ['tef', 'tcf']) {
  const dir = join(root, 'data', 'exam', exam);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter(x => x.endsWith('.json'))) {
    const f = `${exam}/${file}`;
    let j;
    try { j = JSON.parse(readFileSync(join(dir, file), 'utf8')); } catch (e) { err(f, `invalid JSON: ${e.message}`); continue; }
    if (j.sets) {
      const ids = new Set();
      for (const s of j.sets) {
        const src = new Map((s.audios || s.docs || []).map(x => [x.id, x]));
        if (!s.items?.length) err(f, `${s.id}: no items`);
        for (const it of s.items || []) {
          if (ids.has(it.id)) err(f, `${it.id}: duplicate id`);
          ids.add(it.id);
          if (!src.has(it.audioId || it.docId)) err(f, `${it.id}: unknown ${it.audioId ? 'audioId' : 'docId'}`);
          if (!Array.isArray(it.options) || it.options.length < 3) err(f, `${it.id}: needs 3–4 options`);
          else if (!(Number.isInteger(it.answer) && it.answer >= 0 && it.answer < it.options.length)) err(f, `${it.id}: answer out of range`);
          else if (new Set(it.options).size !== it.options.length) err(f, `${it.id}: duplicate options`);
          if (!str(it.explain)) warn(f, `${it.id}: no explanation`);
        }
        for (const a of s.audios || []) if (!a.lines?.length || !a.lines.every(l => str(l.fr))) err(f, `${a.id}: audio needs lines with fr`);
      }
    }
    if (j.tasks) {
      for (const t of j.tasks) {
        if (!str(t.prompt)) err(f, `${t.id}: no prompt`);
        if (!t.models?.length) warn(f, `${t.id}: no model answer`);
        if (t.maxWords) for (const m of t.models || []) {
          const n = m.fr.trim().split(/\s+/).length;
          if (n > t.maxWords * 1.1) warn(f, `${t.id}: model "${m.label}" has ~${n} words (max ${t.maxWords})`);
        }
      }
    }
  }
}

for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\n${n} lesson file(s) checked · ${errors.length} error(s) · ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);

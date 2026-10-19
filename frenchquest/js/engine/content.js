// Loads and caches content JSON. All paths are relative (GitHub Pages project sites).
const cache = new Map();

async function load(path) {
  if (cache.has(path)) return cache.get(path);
  const p = fetch(path, { cache: 'no-cache' }).then(r => {
    if (!r.ok) throw new Error(`Could not load ${path} (${r.status})`);
    return r.json();
  });
  cache.set(path, p);
  p.catch(() => cache.delete(path));
  return p;
}

export const getCourse = () => load('data/course.json');

export async function getLesson(id) {
  const level = id.split('-')[0];
  const lesson = await load(`data/lessons/${level}/${id}.json`);
  return lesson;
}

export async function tryLesson(id) {
  try { return await getLesson(id); } catch { return null; }
}

export const getExamFile = (exam, file) => load(`data/exam/${exam}/${file}.json`);
export const getData = name => load(`data/${name}.json`);

/** Flat list of lessons in path order with level/unit context. */
export async function lessonIndex() {
  const course = await getCourse();
  const out = [];
  for (const lv of course.levels) {
    for (const u of lv.units) {
      u.lessons.forEach((l, i) => out.push({ ...l, level: lv.id, levelTitle: lv.title, unitId: u.id, unitTitle: u.title, unitIndex: lv.units.indexOf(u), indexInUnit: i, unitSize: u.lessons.length }));
    }
  }
  return out;
}

export async function lessonMeta(id) {
  return (await lessonIndex()).find(l => l.id === id) || null;
}

/** Items (vocab, phrases, grammar) for a set of lesson ids, keyed by item id. */
export async function itemsFor(lessonIds) {
  const map = new Map();
  await Promise.all(lessonIds.map(async lid => {
    const l = await tryLesson(lid);
    if (!l) return;
    for (const it of l.items || []) map.set(`${lid}.${it.id}`, { ...it, uid: `${lid}.${it.id}`, lessonId: lid, level: l.level });
  }));
  return map;
}

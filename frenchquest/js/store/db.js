// IndexedDB wrapper. All learner data lives here; views go through engine modules.
export const DB_NAME = 'frenchquest';
export const DB_VERSION = 1;

export const STORES = {
  meta: { keyPath: 'key' },
  lessons: { keyPath: 'id' },                       // lesson progress
  cards: { keyPath: 'id', indexes: { due: 'due', itemId: 'itemId' } },
  reviewLog: { keyPath: 'n', autoIncrement: true, indexes: { ts: 'ts' } },
  attempts: { keyPath: 'n', autoIncrement: true, indexes: { ts: 'ts', skill: 'skill' } },
  portfolio: { keyPath: 'id', indexes: { ts: 'ts' } },
  recordings: { keyPath: 'id' },
  examSessions: { keyPath: 'id', indexes: { ts: 'ts' } },
  officialResults: { keyPath: 'id' },
  daily: { keyPath: 'date' },
};

let dbp = null;

export function openDB() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    if (!('indexedDB' in self)) return reject(new Error('IndexedDB is not available in this browser.'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [name, def] of Object.entries(STORES)) {
        if (db.objectStoreNames.contains(name)) continue;
        const os = db.createObjectStore(name, { keyPath: def.keyPath, autoIncrement: !!def.autoIncrement });
        for (const [iname, path] of Object.entries(def.indexes || {})) os.createIndex(iname, path);
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Close other FrenchQuest tabs to finish updating.'));
  });
  return dbp;
}

const wrap = req => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

async function store(name, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(name, mode).objectStore(name);
}

export async function get(name, key) { return wrap((await store(name)).get(key)); }
export async function put(name, value) { return wrap((await store(name, 'readwrite')).put(value)); }
export async function del(name, key) { return wrap((await store(name, 'readwrite')).delete(key)); }
export async function all(name) { return wrap((await store(name)).getAll()); }
export async function count(name) { return wrap((await store(name)).count()); }
export async function clearStore(name) { return wrap((await store(name, 'readwrite')).clear()); }

export async function byIndex(name, index, range) {
  const os = await store(name);
  return wrap(os.index(index).getAll(range));
}

/** Run several writes atomically. fn receives { put, del, clear } bound to the transaction. */
export async function tx(names, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(names, 'readwrite');
    const api = {
      put: (n, v) => t.objectStore(n).put(v),
      add: (n, v) => t.objectStore(n).add(v),
      del: (n, k) => t.objectStore(n).delete(k),
      clear: n => t.objectStore(n).clear(),
    };
    let out;
    try { out = fn(api); } catch (e) { t.abort(); return reject(e); }
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Transaction aborted'));
  });
}

export async function getMeta(key, fallback = null) {
  const r = await get('meta', key);
  return r ? r.value : fallback;
}
export async function setMeta(key, value) { return put('meta', { key, value }); }

export async function persistStorage() {
  try {
    if (navigator.storage?.persist) {
      const already = await navigator.storage.persisted();
      return already || await navigator.storage.persist();
    }
  } catch { /* ignore */ }
  return false;
}

export async function storageEstimate() {
  try { return await navigator.storage.estimate(); } catch { return null; }
}

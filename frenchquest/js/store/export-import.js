// Backup and restore of all learner data as one JSON file.
import * as db from './db.js';
import { prefs, replacePrefs } from './prefs.js';

const APP = 'frenchquest';
export const BACKUP_VERSION = 1;
const DATA_STORES = Object.keys(db.STORES).filter(s => s !== 'recordings');

const blobToB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
const b64ToBlob = async dataUrl => (await fetch(dataUrl)).blob();

export async function exportAll({ includeRecordings = false } = {}) {
  const stores = {};
  for (const s of DATA_STORES) stores[s] = await db.all(s);
  if (includeRecordings) {
    stores.recordings = await Promise.all((await db.all('recordings')).map(async r => ({ ...r, blob: await blobToB64(r.blob) })));
  }
  const p = { ...prefs(), ai: { ...prefs().ai } };
  delete p.ai.key;
  const data = { app: APP, backupVersion: BACKUP_VERSION, schemaVersion: db.DB_VERSION, exportedAt: new Date().toISOString(), prefs: p, stores };
  await db.setMeta('lastExport', Date.now());
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
}

export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Validate a backup file. Returns { ok, error?, data?, summary? } and never writes. */
export async function readBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { return { ok: false, error: 'This file is not valid JSON.' }; }
  if (!data || data.app !== APP) return { ok: false, error: 'This is not a FrenchQuest backup file.' };
  if (typeof data.backupVersion !== 'number' || data.backupVersion > BACKUP_VERSION) return { ok: false, error: 'This backup was made by a newer version of FrenchQuest. Update the app, then try again.' };
  if (!data.stores || typeof data.stores !== 'object') return { ok: false, error: 'The backup has no data section.' };
  for (const [s, rows] of Object.entries(data.stores)) {
    if (!db.STORES[s]) return { ok: false, error: `Unknown data section “${s}”.` };
    if (!Array.isArray(rows)) return { ok: false, error: `Section “${s}” is damaged.` };
    const key = db.STORES[s].keyPath;
    if (!db.STORES[s].autoIncrement && rows.some(r => !r || typeof r !== 'object' || r[key] == null)) return { ok: false, error: `Some records in “${s}” are missing their id.` };
  }
  const st = data.stores;
  const summary = `${st.lessons?.length || 0} lessons, ${st.cards?.length || 0} review cards, ${st.portfolio?.length || 0} portfolio entries${st.recordings ? `, ${st.recordings.length} recordings` : ''} — exported ${new Date(data.exportedAt).toLocaleString()}`;
  return { ok: true, data, summary };
}

/** Replace all data with the backup, in one transaction (all or nothing). */
export async function restore(data) {
  const recs = data.stores.recordings ? await Promise.all(data.stores.recordings.map(async r => ({ ...r, blob: await b64ToBlob(r.blob) }))) : null;
  const names = Object.keys(db.STORES);
  await db.tx(names, t => {
    for (const s of names) {
      if (s === 'recordings' && !recs) continue;
      t.clear(s);
      const rows = s === 'recordings' ? recs : (data.stores[s] || []);
      for (const r of rows) t.put(s, r);
    }
  });
  if (data.prefs) {
    const key = prefs().ai?.key;
    replacePrefs({ ...data.prefs, ai: { ...data.prefs.ai, key } });
  }
}

export async function resetAll() {
  const names = Object.keys(db.STORES);
  await db.tx(names, t => names.forEach(s => t.clear(s)));
  try { localStorage.removeItem('fq.prefs'); } catch { /* ignore */ }
}

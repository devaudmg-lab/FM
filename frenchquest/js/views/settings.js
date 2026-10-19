import { h, clear } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { toast, confirmDialog } from '../ui/components.js';
import { prefs, setPrefs } from '../store/prefs.js';
import { frenchVoices, say, ttsAvailable } from '../media/speech.js';
import { sttSupported } from '../media/stt.js';
import { exportAll, download, readBackup, restore, resetAll } from '../store/export-import.js';
import * as db from '../store/db.js';
import { aiSettings } from '../ai/settings-panel.js';

function select(label, value, options, onChange, hint) {
  const id = `s-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return h('div', { class: 'field', style: { marginBottom: '1rem' } },
    h('label', { for: id }, label),
    h('select', { id, onchange: e => onChange(e.target.value) }, options.map(([v, t]) => h('option', { value: v, selected: String(v) === String(value) }, t))),
    hint && h('span', { class: 'hint' }, hint));
}

function toggle(label, checked, onChange, hint) {
  const id = `t-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return h('div', h('div', { class: 'switch' }, h('label', { for: id, style: { fontWeight: 700 } }, label), h('input', { id, type: 'checkbox', checked, onchange: e => onChange(e.target.checked) })), hint && h('p', { class: 'small muted', style: { marginTop: '-.5rem' } }, hint));
}

export default async function settings(params, root) {
  const p = prefs();
  const v = h('div', { class: 'view narrow' });
  root.append(v);
  v.append(h('div', { class: 'page-head' }, h('h1', 'Settings'), h('p', 'Changes save automatically.')));
  const saved = () => toast('Saved');

  // Appearance
  v.append(h('section', { class: 'settings-group' }, h('h2', 'Appearance'),
    select('Theme', p.theme, [['system', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']], x => { setPrefs({ theme: x }); saved(); }),
    select('Text size', p.textScale, [[1, 'Default'], [1.125, 'Large'], [1.25, 'Larger'], [1.5, 'Largest']], x => { setPrefs({ textScale: +x }); saved(); }),
    toggle('Reduce motion', p.motion === 'reduce', x => { setPrefs({ motion: x ? 'reduce' : 'system' }); saved(); }, 'Animations are also reduced automatically if your device asks for it.')));

  // Learning
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  v.append(h('section', { class: 'settings-group' }, h('h2', 'Learning'),
    select('Daily study goal', p.dailyMinutes, [30, 45, 60, 75, 90].map(m => [m, `${m} minutes`]), x => { setPrefs({ dailyMinutes: +x }); saved(); }),
    select('English translations in lessons', p.translations, [['tap', 'Hidden until I tap'], ['always', 'Always shown'], ['never', 'Never shown']], x => { setPrefs({ translations: x }); saved(); }, 'Trying to understand before peeking makes you remember more.'),
    select('Accents in typed answers', p.accentMode, [['lenient', 'Lenient — accent slips count as “almost”'], ['strict', 'Strict — accents must be exact']], x => { setPrefs({ accentMode: x }); saved(); }, 'Accent errors that change the meaning (a / à, ou / où) are always marked wrong.'),
    select('New review cards per day', p.newPerDay, [5, 10, 15, 20, 30, 40].map(n => [n, String(n)]), x => { setPrefs({ newPerDay: +x }); saved(); }),
    select('Target memory strength', p.retention, [[0.85, '85% — fewer reviews'], [0.9, '90% — recommended'], [0.95, '95% — many more reviews']], x => { setPrefs({ retention: +x }); saved(); }, 'How likely you should be to remember a card when it comes back. Higher means much more review time.'),
    h('div', { class: 'field' }, h('span', { class: 'label' }, 'Rest days'), h('span', { class: 'hint' }, 'Rest days never break your streak.'),
      h('div', { class: 'row', role: 'group', 'aria-label': 'Rest days' }, days.map((d, i) => h('label', { class: 'tag', style: { padding: '6px 12px', cursor: 'pointer' } },
        h('input', { type: 'checkbox', checked: p.restDays.includes(i), onchange: e => { const set = new Set(prefs().restDays); e.target.checked ? set.add(i) : set.delete(i); setPrefs({ restDays: [...set] }); saved(); } }), ' ', d))))));

  // Audio
  const audio = h('section', { class: 'settings-group' }, h('h2', 'Audio and speech'));
  v.append(audio);
  if (!ttsAvailable()) audio.append(h('div', { class: 'notice' }, icon('alert'), h('div', 'This browser cannot speak French aloud. Try Edge or Chrome for the best voices.')));
  else {
    const voices = await frenchVoices();
    if (!voices.length) audio.append(h('div', { class: 'notice' }, icon('alert'), h('div', 'No French voice is installed. On Windows: Settings → Time & language → Speech → Add voices → French. Edge includes natural French voices online.')));
    else {
      audio.append(select('French voice', p.voiceURI || voices[0].voiceURI, voices.map(vv => [vv.voiceURI, `${vv.name} (${vv.lang})`]), x => { setPrefs({ voiceURI: x }); say('Bonjour ! Je suis votre voix française.'); }, 'Voices marked “Natural” or “Online” sound the most human.'));
    }
    audio.append(select('Speaking speed', p.voiceRate, [[0.8, 'Slow'], [0.95, 'Natural, a little slower'], [1.05, 'Natural']], x => { setPrefs({ voiceRate: +x }); say('Je m’appelle Camille et j’habite à Montréal.'); }),
      h('button', { class: 'btn sm', onclick: () => say('Bonjour ! Comment allez-vous aujourd’hui ?') }, icon('speaker'), 'Test the voice'));
  }
  audio.append(h('p', { class: 'small muted', style: { marginTop: '1rem' } }, 'Lesson audio uses your device’s French voice until recorded audio is added. Recordings you make stay in this browser.'));
  if (sttSupported()) {
    audio.append(toggle('Speech recognition (experimental)', p.speechRecognition, x => { setPrefs({ speechRecognition: x }); saved(); }, 'Shows what the browser heard when you record. It does not judge pronunciation. Some browsers send audio to a server to transcribe it.'),
      select('Recognition accent', p.sttLang, [['fr-FR', 'French (France)'], ['fr-CA', 'French (Canada)']], x => { setPrefs({ sttLang: x }); saved(); }));
  }

  // AI coach
  v.append(aiSettings());

  // Data
  const est = await db.storageEstimate();
  const persisted = await navigator.storage?.persisted?.().catch(() => false);
  const lastExport = await db.getMeta('lastExport');
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    const r = await readBackup(f);
    if (!r.ok) { toast(r.error, { ms: 7000 }); return; }
    const ok = await confirmDialog({ title: 'Restore this backup?', body: `${r.summary}. This replaces everything currently saved in this browser.`, confirm: 'Replace my data', danger: true });
    if (!ok) return;
    try { await restore(r.data); toast('Backup restored.'); setTimeout(() => location.reload(), 600); }
    catch (err) { toast(`Restore failed; nothing was changed. ${err.message}`, { ms: 8000 }); }
  } });
  let withRec = false;
  v.append(h('section', { class: 'settings-group' }, h('h2', 'Your data'),
    h('p', { class: 'small muted' }, `Stored in this browser only${est ? ` · using ${(est.usage / 1048576).toFixed(1)} MB` : ''} · ${persisted ? 'protected from automatic clean-up' : 'the browser may clear it if space runs low'}.`),
    h('p', { class: 'small' }, lastExport ? `Last backup: ${new Date(lastExport).toLocaleDateString()}` : 'You have not made a backup yet. Back up regularly — clearing browser data deletes your progress.'),
    toggle('Include voice recordings in backups', false, x => { withRec = x; }, 'Recordings can make the file large.'),
    h('div', { class: 'row', style: { marginTop: '1rem' } },
      h('button', { class: 'btn primary', onclick: async () => { const b = await exportAll({ includeRecordings: withRec }); download(b, `frenchquest-backup-${new Date().toISOString().slice(0, 10)}.json`); toast('Backup downloaded.'); } }, icon('download'), 'Download backup'),
      h('button', { class: 'btn', onclick: () => fileInput.click() }, icon('upload'), 'Restore from file'), fileInput),
    h('div', { style: { marginTop: '2rem' } },
      h('button', { class: 'btn danger', onclick: async () => {
        const ok = await confirmDialog({ title: 'Erase all progress?', body: 'This deletes every lesson, review card, recording and setting in this browser. Download a backup first if you might want it back.', confirm: 'Erase everything', danger: true, typeToConfirm: 'RESET' });
        if (!ok) return;
        await resetAll(); location.hash = '#/welcome'; location.reload();
      } }, icon('trash'), 'Erase all progress'))));

  v.append(h('section', { class: 'settings-group' }, h('h2', 'About'),
    h('p', { class: 'small muted' }, 'FrenchQuest is a free, offline-capable course. Exam practice is unofficial and never predicts an official score. Always check current requirements on the IRCC website.'),
    h('p', { class: 'small' }, h('a', { href: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html', target: '_blank', rel: 'noopener' }, 'IRCC language test requirements'))));
}

// French audio. Recorded files (when a block provides `audio`) win; otherwise browser TTS.
import { prefs } from '../store/prefs.js';

let voices = [];
let voicesReady = null;

function loadVoices() {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);
  if (voicesReady) return voicesReady;
  voicesReady = new Promise(resolve => {
    const pick = () => {
      voices = speechSynthesis.getVoices().filter(v => /^fr(-|_|$)/i.test(v.lang));
      if (voices.length) resolve(voices);
    };
    pick();
    speechSynthesis.addEventListener?.('voiceschanged', pick);
    setTimeout(() => resolve(voices), 1500);
  });
  return voicesReady;
}

const score = v => (/natural|neural|online|premium|enhanced/i.test(v.name) ? 10 : 0) + (/fr-FR/i.test(v.lang) ? 3 : /fr-CA/i.test(v.lang) ? 2 : 0) + (v.localService ? 0 : 1);

export async function frenchVoices() {
  await loadVoices();
  return [...voices].sort((a, b) => score(b) - score(a));
}

export async function bestVoice() {
  const list = await frenchVoices();
  const uri = prefs().voiceURI;
  return list.find(v => v.voiceURI === uri) || list[0] || null;
}

export const ttsAvailable = () => 'speechSynthesis' in window;

let current = null; // { stop() }
let gen = 0;          // bumps on user-initiated stop, cancels sequences

function halt() { if (current) { const c = current; current = null; c.stop(); } }
export function stop() { gen++; halt(); }

/**
 * Speak French text (or play a recorded file).
 * @returns Promise that resolves when playback ends.
 */
export async function say(text, { rate = 1, audio = null, onstart, onend, voiceIndex = 0 } = {}) {
  halt();
  if (audio) {
    const el = new Audio(audio);
    el.playbackRate = rate;
    el.preservesPitch = true;
    return new Promise(resolve => {
      const done = () => { current = null; onend?.(); resolve(); };
      current = { stop: () => { el.pause(); done(); } };
      el.onended = done;
      el.onerror = () => { current = null; sayTTS(text, rate, onstart, onend).then(resolve); };
      el.play().then(() => onstart?.()).catch(() => { current = null; sayTTS(text, rate, onstart, onend).then(resolve); });
    });
  }
  return sayTTS(text, rate, onstart, onend, voiceIndex);
}

// Texting abbreviations, read as the full words.
const SMS = { slt: 'salut', bcp: 'beaucoup', stp: "s'il te plaît", svp: "s'il vous plaît", tkt: "t'inquiète", mdr: 'mort de rire', dsl: 'désolé', jsp: 'je sais pas', rdv: 'rendez-vous', pk: 'pourquoi', pq: 'pourquoi', qd: 'quand', bjr: 'bonjour', cc: 'coucou', mrc: 'merci', tjrs: 'toujours', auj: "aujourd'hui", lol: 'lol' };
const SMS_RE = new RegExp(`(^|[^\\p{L}])(${Object.keys(SMS).join('|')})(?=[^\\p{L}]|$)`, 'giu');

/** Make written French easier for speech engines: times, prices, symbols. */
export function speakable(text) {
  let s = String(text);
  // French thousands separators: 1 200 000 $ → 1200000 $ (repeat for millions)
  for (let i = 0; i < 3; i++) s = s.replace(/(\d)[   ](\d{3})(?![\d-])/g, '$1$2');
  return s
    .replace(SMS_RE, (m, pre, w) => pre + SMS[w.toLowerCase()])
    // Ordinals: 1er, 1re, 2e, XIXe
    .replace(/\b1er\b/g, 'premier').replace(/\b1re\b/g, 'première')
    .replace(/\b(\d+)e\b/g, '$1ième')
    // Québec housing-ad shorthand
    .replace(/(\d) ?½/g, '$1 et demie')
    .replace(/\bn\/c\b/gi, 'non chauffé').replace(/\bn\/é(?![\p{L}])/giu, 'non éclairé')
    .replace(/\brdc\b/gi, 'rez-de-chaussée').replace(/\bstat\./gi, 'stationnement')
    // Canadian phone numbers (819 555-0142): read digit by digit
    .replace(/\b(\d{3})[ .-](\d{3})-(\d{4})\b/g, (m, a, b, c) => [a, b, c].map(g => g.split('').join(' ')).join(', '))
    // French thousands separators: 1 650 $ → 1650 $
    .replace(/(\d)[   ](\d{3})(?![\d-])/g, '$1$2')
    .replace(/\b(\d{1,2}) ?h ?(\d{2})\b/g, '$1 heures $2')
    .replace(/\b(\d{1,2}) ?h\b(?!\w)/g, (m, n) => `${n} ${n === '1' ? 'heure' : 'heures'}`)
    .replace(/(\d+),(\d{2}) ?\$/g, '$1 dollars $2')
    .replace(/(\d+) ?\$/g, '$1 dollars')
    .replace(/(\d+),(\d{2}) ?€/g, '$1 euros $2')
    .replace(/(\d+) ?€/g, '$1 euros')
    .replace(/(\d+) ?%/g, '$1 pour cent')
    .replace(/\[\[|\]\]|\*\*?/g, '');
}

async function sayTTS(text, rate, onstart, onend, voiceIndex = 0) {
  if (!ttsAvailable()) { onend?.(); return; }
  text = speakable(text);
  let v = await bestVoice();
  if (voiceIndex) {
    const list = await frenchVoices();
    const others = list.filter(x => x.voiceURI !== v?.voiceURI);
    if (others.length) v = others[(voiceIndex - 1) % others.length];
  }
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = v?.lang || 'fr-FR';
    if (v) u.voice = v;
    u.rate = (prefs().voiceRate || 0.95) * rate;
    let finished = false;
    const done = () => { if (finished) return; finished = true; current = null; onend?.(); resolve(); };
    u.onstart = () => onstart?.();
    u.onend = done;
    u.onerror = done;
    current = { stop: () => { speechSynthesis.cancel(); done(); } };
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    // Chrome sometimes never fires onend for long text
    setTimeout(done, Math.max(5000, text.length * 240 / rate));
  });
}

/** Speak a sequence of lines; callback per line index. */
export async function sayLines(lines, { rate = 1, onLine } = {}) {
  stop();
  const my = gen;
  // Different speakers get different voices when the device has more than one.
  const speakers = [...new Set(lines.map(l => l.speaker || ''))];
  for (let i = 0; i < lines.length; i++) {
    if (gen !== my) break;
    onLine?.(i);
    await say(lines[i].fr, { rate, audio: lines[i].audio, voiceIndex: Math.max(0, speakers.indexOf(lines[i].speaker || '')) });
    if (gen !== my) break;
    await new Promise(r => setTimeout(r, 350));
  }
  onLine?.(-1);
}

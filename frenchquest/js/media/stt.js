// Optional, experimental speech-to-text (Web Speech API). Never judges pronunciation.
import { prefs } from '../store/prefs.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const sttSupported = () => !!SR;
export const sttEnabled = () => sttSupported() && prefs().speechRecognition;

/** Listen once; resolves with { transcript, alternatives[] } or rejects. */
export function listenOnce({ lang = prefs().sttLang || 'fr-FR', maxMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!SR) return reject(new Error('Speech recognition is not supported in this browser.'));
    const r = new SR();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 3;
    let done = false;
    const t = setTimeout(() => { try { r.stop(); } catch { /* */ } }, maxMs);
    r.onresult = e => {
      done = true;
      clearTimeout(t);
      const alts = [...e.results[0]].map(a => a.transcript);
      resolve({ transcript: alts[0] || '', alternatives: alts });
    };
    r.onerror = e => { clearTimeout(t); if (!done) reject(new Error(e.error === 'not-allowed' ? 'Microphone permission was denied.' : `Speech recognition error: ${e.error}`)); };
    r.onend = () => { clearTimeout(t); if (!done) resolve({ transcript: '', alternatives: [] }); };
    r.start();
  });
}

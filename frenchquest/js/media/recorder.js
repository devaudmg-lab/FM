// Local voice recording with MediaRecorder. Blobs are stored in IndexedDB only.
import * as db from '../store/db.js';

export const canRecord = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

function pickMime() {
  const opts = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return opts.find(m => MediaRecorder.isTypeSupported?.(m)) || '';
}

/**
 * Start recording. Returns a controller: { stop(): Promise<{blob, mime, ms}>, cancel(), level(): 0..1 }
 */
export async function startRecording({ maxMs = 180000 } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mime = pickMime();
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks = [];
  const t0 = performance.now();
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);

  let analyser = null, buf = null, ctx = null;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    buf = new Uint8Array(analyser.fftSize);
    src.connect(analyser);
  } catch { /* meter optional */ }

  const cleanup = () => { stream.getTracks().forEach(t => t.stop()); ctx?.close?.(); };
  const stopped = new Promise(resolve => {
    rec.onstop = () => {
      cleanup();
      resolve({ blob: new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' }), mime: rec.mimeType || mime, ms: Math.round(performance.now() - t0) });
    };
  });
  rec.start(250);
  const timer = setTimeout(() => rec.state !== 'inactive' && rec.stop(), maxMs);

  return {
    stop() { clearTimeout(timer); if (rec.state !== 'inactive') rec.stop(); return stopped; },
    cancel() { clearTimeout(timer); rec.onstop = cleanup; if (rec.state !== 'inactive') rec.stop(); },
    elapsed: () => performance.now() - t0,
    level() {
      if (!analyser) return 0;
      analyser.getByteTimeDomainData(buf);
      let peak = 0;
      for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
      return Math.min(1, peak / 64);
    },
  };
}

export async function saveRecording({ blob, mime, ms }, ref = {}) {
  const id = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await db.put('recordings', { id, blob, mime, ms, ts: Date.now(), ...ref });
  return id;
}

export async function deleteRecording(id) { return db.del('recordings', id); }

export function playBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = new Audio(url);
  a.onended = () => URL.revokeObjectURL(url);
  a.play();
  return a;
}

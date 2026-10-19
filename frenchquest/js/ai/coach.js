// Optional AI Coach: rubric feedback on writing and speaking transcripts.
import { h, clear } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { completeJSON, aiReady } from './provider.js';
import * as db from '../store/db.js';

export const DISCLAIMER = 'AI feedback — it can be wrong, and it is not an official score.';

const SYSTEM = `You are an experienced, encouraging French teacher (FLE) who prepares adults for TEF Canada and TCF Canada.
Assess the learner's French against CEFR expectations for their level. Be accurate and specific; never invent errors.
Reply with ONE JSON object only, no prose, using exactly this shape:
{"scores":{"task":0-3,"coherence":0-3,"vocabulary":0-3,"grammar":0-3,"register":0-3},
 "strengths":["…"],
 "fixes":[{"original":"exact learner text","corrected":"corrected French","why":"short English explanation"}],
 "corrected":"the whole text, corrected, keeping the learner's ideas",
 "levelEstimate":"e.g. A1+, A2, B1-",
 "nextStep":"one concrete thing to practise next, in English"}
Give at most 3 strengths and at most 5 fixes, most important first. Explanations in simple English.`;

function renderFeedback(fb) {
  const LABEL = { task: 'Task completion', coherence: 'Organisation', vocabulary: 'Vocabulary', grammar: 'Grammar', register: 'Register' };
  return h('div', { class: 'panel', style: { marginTop: '1rem' } },
    h('div', { class: 'row between' }, h('h3', { style: { margin: 0 } }, icon('sparkle'), ' AI coach'), fb.levelEstimate && h('span', { class: 'tag violet' }, `About ${fb.levelEstimate}`)),
    h('div', { class: 'grid grid-3', style: { margin: '1rem 0', gap: '.5rem' } }, Object.entries(fb.scores || {}).map(([k, v]) => h('div', { class: 'small' }, h('strong', `${v}/3 `), LABEL[k] || k))),
    fb.strengths?.length && [h('h4', 'What works'), h('ul', { class: 'small' }, fb.strengths.map(s => h('li', s)))],
    fb.fixes?.length && [h('h4', 'Fix these first'), h('ul', { class: 'list' }, fb.fixes.map(f => h('li', { style: { padding: '.5rem 0' } },
      h('div', { class: 'diff', lang: 'fr' }, h('del', f.original), ' → ', h('ins', f.corrected)), h('div', { class: 'small muted' }, f.why))))],
    fb.corrected && [h('h4', 'Corrected version'), h('p', { class: 'fr', lang: 'fr' }, fb.corrected)],
    fb.nextStep && h('p', { class: 'small' }, h('strong', 'Next: '), fb.nextStep),
    h('p', { class: 'xs muted', style: { margin: 0 } }, DISCLAIMER));
}

function feedbackButton(label, run) {
  const host = h('div', { style: { marginTop: '1rem' } });
  const btn = h('button', { class: 'btn', onclick: async () => {
    btn.disabled = true;
    clear(host).append(h('p', { class: 'small muted', role: 'status' }, 'The AI coach is reading your answer…'));
    try { const fb = await run(); clear(host).append(renderFeedback(fb)); }
    catch (e) { clear(host).append(h('div', { class: 'notice' }, icon('alert'), h('div', e.message)), btn); btn.disabled = false; }
  } }, icon('sparkle'), label);
  host.append(btn);
  return host;
}

export function aiHooks() {
  if (!aiReady()) return null;
  return {
    writing: (ex, text, entry) => feedbackButton('Get AI feedback', async () => {
      const fb = await completeJSON({ system: SYSTEM, messages: [{ role: 'user', content: `Level: ${ex.level || 'A1–A2'}\nTask: ${ex.prompt}${ex.promptFr ? `\n(${ex.promptFr})` : ''}\nExpected length: ${(ex.wordRange || []).join('–') || 'short'} words\nLearner's text:\n"""${text}"""` }] });
      entry.ai = fb; await db.put('portfolio', entry);
      return fb;
    }),
    speaking: (ex, transcript, entry) => feedbackButton('Get AI feedback on what you said', async () => {
      const fb = await completeJSON({ system: SYSTEM + '\nThis is an automatic speech-to-text transcript of spoken French: ignore punctuation and capitalisation, do not comment on pronunciation, and treat odd words as possible transcription errors.', messages: [{ role: 'user', content: `Level: ${ex.level || 'A1–A2'}\nSpeaking task: ${ex.prompt}\nTranscript:\n"""${transcript}"""` }] });
      entry.ai = fb; await db.put('portfolio', entry);
      return fb;
    }),
  };
}

export { renderFeedback };

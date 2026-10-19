// "Ask about this" — in-app answers with a key, or a ready-to-paste prompt for any AI assistant.
import { h, clear } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { md } from '../ui/md.js';
import { toast } from '../ui/components.js';
import { complete, aiReady } from './provider.js';
import { DISCLAIMER } from './coach.js';

const SYSTEM = `You are a patient French tutor for an English-speaking adult learner aiming for TEF/TCF Canada.
Answer in clear, simple English with short French examples. Match the learner's level; avoid grammar jargon unless you explain it.
Keep answers under 200 words unless asked for more. Format: short paragraphs; put French in [[double brackets]]; use "- " for lists; **bold** for key points.`;

export function buildPrompt(context, question) {
  return `I'm learning French (level ${context.level}). I'm on the lesson "${context.title}" — goal: ${context.goal}.\n${context.step ? `Current part: ${context.step}.\n` : ''}${context.snippet ? `The lesson shows: ${context.snippet}\n` : ''}\nMy question: ${question}\n\nPlease explain simply in English with a few short French examples.`;
}

export function askButton(getContext) {
  return h('button', { class: 'btn ghost sm', type: 'button', 'aria-label': 'Ask about this lesson', onclick: () => openAsk(getContext()) }, icon('chat'), h('span', { class: 'wide-only' }, 'Ask about this'));
}

export function openAsk(context) {
  const ta = h('textarea', { rows: 3, placeholder: 'e.g. Why is it “je suis” and not “je es”?', 'aria-label': 'Your question' });
  const out = h('div', { 'aria-live': 'polite' });
  const ready = aiReady();
  const go = async () => {
    const q = ta.value.trim();
    if (!q) { ta.focus(); return; }
    const prompt = buildPrompt(context, q);
    if (!ready) {
      try { await navigator.clipboard.writeText(prompt); toast('Question copied — paste it into your AI assistant.'); }
      catch { clear(out).append(h('p', { class: 'small' }, 'Copy this and paste it into your AI assistant:'), h('textarea', { rows: 6, readOnly: true, value: prompt })); }
      return;
    }
    clear(out).append(h('p', { class: 'small muted', role: 'status' }, 'Thinking…'));
    try {
      const text = await complete({ system: SYSTEM, messages: [{ role: 'user', content: prompt }], fast: true, maxTokens: 700 });
      clear(out).append(md(text), h('p', { class: 'xs muted' }, DISCLAIMER));
    } catch (e) { clear(out).append(h('div', { class: 'notice' }, icon('alert'), h('div', e.message))); }
  };
  const dlg = h('dialog', { 'aria-labelledby': 'ask-t', style: { width: 'min(92vw, 36rem)' } },
    h('h2', { id: 'ask-t' }, 'Ask about this lesson'),
    h('p', { class: 'small muted' }, ready ? 'Your question goes to the AI coach with the lesson details.' : 'No AI key is set up, so this builds a detailed question you can paste into any AI assistant (Claude, ChatGPT…). Add a key in Settings to get answers here.'),
    h('div', { class: 'field' }, ta),
    h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '1rem' } },
      h('button', { class: 'btn', onclick: () => dlg.close() }, 'Close'),
      h('button', { class: 'btn primary', onclick: go }, ready ? 'Ask' : 'Copy question')),
    out);
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
  ta.focus();
}

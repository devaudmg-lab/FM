import { h } from '../ui/h.js';
import { icon } from '../ui/icons.js';
import { toast } from '../ui/components.js';
import { prefs, setPrefs } from '../store/prefs.js';
import { getKey, setKey, usedToday, complete } from './provider.js';

export function aiSettings() {
  const p = prefs();
  const key = h('input', { type: 'password', id: 'ai-key', value: getKey(), autocomplete: 'off', placeholder: 'sk-ant-…' });
  const remember = h('input', { type: 'checkbox', id: 'ai-rem', checked: !!p.ai.remember });
  const model = h('input', { type: 'text', id: 'ai-model', value: p.ai.model });
  const fast = h('input', { type: 'text', id: 'ai-fast', value: p.ai.fastModel });
  const cap = h('input', { type: 'number', id: 'ai-cap', min: 1, max: 500, value: p.ai.dailyCap });
  const enabled = h('input', { type: 'checkbox', id: 'ai-on', checked: !!p.ai.enabled });
  const save = () => {
    setKey(key.value.trim(), remember.checked);
    setPrefs({ ai: { enabled: enabled.checked, model: model.value.trim() || 'claude-sonnet-5-5', fastModel: fast.value.trim() || 'claude-haiku-5-5', dailyCap: Math.max(1, +cap.value || 50) } });
    toast('AI coach settings saved');
  };
  return h('section', { class: 'settings-group' }, h('h2', 'AI coach (optional)'),
    h('p', { class: 'small muted' }, 'Everything in FrenchQuest works without AI. With your own Anthropic API key you also get feedback on writing and speaking, and answers to questions inside lessons. Only the text of your answer or question is sent — never audio — and only when you press a button.'),
    h('div', { class: 'switch' }, h('label', { for: 'ai-on', style: { fontWeight: 700 } }, 'Turn on the AI coach'), enabled),
    h('div', { class: 'field', style: { marginBottom: '1rem' } }, h('label', { for: 'ai-key' }, 'Anthropic API key'), key,
      h('label', { class: 'small', style: { fontWeight: 400, display: 'flex', gap: '.5rem', alignItems: 'center' } }, remember, 'Remember on this device'),
      h('span', { class: 'hint' }, 'If not remembered, the key is forgotten when you close the tab. A remembered key is readable by anyone using this browser profile. It is never included in backups.')),
    h('details', { class: 'deep' }, h('summary', icon('settings'), 'Advanced'),
      h('div', { class: 'deep-body stack' },
        h('div', { class: 'field' }, h('label', { for: 'ai-model' }, 'Model for feedback'), model),
        h('div', { class: 'field' }, h('label', { for: 'ai-fast' }, 'Model for quick answers'), fast),
        h('div', { class: 'field' }, h('label', { for: 'ai-cap' }, `Daily request limit (used today: ${usedToday()})`), cap))),
    h('div', { class: 'row', style: { marginTop: '1rem' } },
      h('button', { class: 'btn primary', onclick: save }, 'Save AI settings'),
      h('button', { class: 'btn', onclick: async () => {
        save();
        try { const t = await complete({ system: 'Reply with one short French sentence.', messages: [{ role: 'user', content: 'Say hello to a French learner.' }], fast: true, maxTokens: 60 }); toast(`Connected: ${t.slice(0, 80)}`, { ms: 6000 }); }
        catch (e) { toast(e.message, { ms: 7000 }); }
      } }, 'Test connection')));
}

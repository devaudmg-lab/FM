// md-lite: a safe, tiny markup for explanations in content files.
//   **bold**  *italic*  [[French text]]  `code`
//   blank line = new paragraph, "- " = bullet list
// Output is built with DOM nodes; content is never parsed as HTML.
import { h } from './h.js';

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]]+\]\]|`[^`]+`)/g;

export function inline(text) {
  const out = [];
  let last = 0;
  for (const m of String(text).matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) out.push(h('strong', inline(t.slice(2, -2))));
    else if (t.startsWith('[[')) out.push(h('span', { class: 'fr', lang: 'fr' }, t.slice(2, -2)));
    else if (t.startsWith('`')) out.push(h('code', t.slice(1, -1)));
    else out.push(h('em', inline(t.slice(1, -1))));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function md(text) {
  const wrap = h('div', { class: 'prose' });
  if (!text) return wrap;
  const paras = String(text).replace(/\r/g, '').split(/\n{2,}/);
  for (const p of paras) {
    const lines = p.split('\n');
    if (lines.every(l => /^\s*[-•]\s+/.test(l))) {
      wrap.append(h('ul', lines.map(l => h('li', inline(l.replace(/^\s*[-•]\s+/, ''))))));
    } else {
      const parts = [];
      lines.forEach((l, i) => { if (i) parts.push(h('br')); parts.push(...inline(l)); });
      wrap.append(h('p', parts));
    }
  }
  return wrap;
}

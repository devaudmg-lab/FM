import { h, clear } from './h.js';
import { icon } from './icons.js';
import { say, stop } from '../media/speech.js';
import { diffWords, normalize } from '../engine/evaluate.js';

// ---------- Toasts ----------
export function toast(message, { action, onAction, ms = 4000 } = {}) {
  const host = document.getElementById('toasts');
  const el = h('div', { class: 'toast', role: 'status' }, message,
    action && h('button', { onclick: () => { onAction?.(); el.remove(); } }, action));
  host.append(el);
  setTimeout(() => el.remove(), ms);
}

// ---------- Confirm dialog ----------
export function confirmDialog({ title, body, confirm = 'Confirm', cancel = 'Cancel', danger = false, typeToConfirm = null }) {
  return new Promise(resolve => {
    let input = null;
    const ok = h('button', { class: ['btn', danger ? 'danger' : 'primary'], value: 'ok' }, confirm);
    if (typeToConfirm) ok.disabled = true;
    const dlg = h('dialog', { 'aria-labelledby': 'dlg-t' },
      h('h2', { id: 'dlg-t' }, title),
      body && h('p', { class: 'muted' }, body),
      typeToConfirm && h('div', { class: 'field', style: { marginBottom: '1rem' } },
        h('label', { for: 'dlg-i' }, `Type ${typeToConfirm} to confirm`),
        input = h('input', { id: 'dlg-i', type: 'text', autocomplete: 'off', oninput: () => { ok.disabled = input.value.trim() !== typeToConfirm; } })),
      h('form', { method: 'dialog', class: 'row', style: { justifyContent: 'flex-end' } },
        h('button', { class: 'btn', value: 'cancel' }, cancel), ok));
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'ok'); dlg.remove(); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

// ---------- Audio button ----------
export function sayButton(text, { audio, label = 'Listen', slow = false } = {}) {
  const btn = h('button', { class: ['say', slow && 'slow'], type: 'button', 'aria-label': slow ? `${label} slowly` : label, title: slow ? 'Slower' : 'Listen' },
    slow ? '0.7×' : icon('speaker'));
  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (btn.classList.contains('playing')) { stop(); return; }
    document.querySelectorAll('.say.playing').forEach(b => b.classList.remove('playing'));
    say(text, { audio, rate: slow ? 0.7 : 1, onstart: () => btn.classList.add('playing'), onend: () => btn.classList.remove('playing') });
  });
  return btn;
}

export function sayPair(text, opts = {}) {
  return h('span', { class: 'row', style: { gap: '4px', flexWrap: 'nowrap' } }, sayButton(text, opts), sayButton(text, { ...opts, slow: true }));
}

// ---------- Accent bar ----------
const ACCENTS = ['é', 'è', 'ê', 'ë', 'à', 'â', 'î', 'ï', 'ô', 'û', 'ù', 'ü', 'ç', 'œ', '«', '»'];
export function accentBar(getInput) {
  return h('div', { class: 'accents', role: 'group', 'aria-label': 'Insert accented letters' },
    ACCENTS.map(ch => h('button', {
      type: 'button', tabindex: -1, 'aria-label': `Insert ${ch}`,
      onmousedown: e => e.preventDefault(),
      onclick: e => {
        const inp = getInput();
        if (!inp) return;
        const c = e.shiftKey ? ch.toUpperCase() : ch;
        const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? inp.value.length;
        inp.value = inp.value.slice(0, s) + c + inp.value.slice(en);
        inp.selectionStart = inp.selectionEnd = s + c.length;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.focus();
      },
    }, ch)));
}

// ---------- Feedback ----------
const VERDICT = { correct: ['check', 'Correct'], almost: ['alert', 'Almost'], incorrect: ['x', 'Not quite'] };

export function feedback(status, { expected, given, note, explain, showDiff = true } = {}) {
  const [ic, label] = VERDICT[status];
  const box = h('div', { class: ['fb', status], role: 'status' });
  box.append(h('div', { class: 'verdict' }, icon(ic), label, note && h('span', { class: 'small', style: { fontWeight: 400, color: 'var(--ink)' } }, ' — ', note)));
  if (status !== 'correct' && expected) {
    if (showDiff && given) {
      const d = diffWords(given, expected);
      box.append(h('div', { class: 'answer diff', lang: 'fr' }, d.map((p, i) => [i ? ' ' : '', p.t === 'same' ? p.w : h(p.t, p.w)])));
    } else {
      box.append(h('div', { class: 'answer', lang: 'fr' }, expected));
    }
  } else if (status === 'correct' && expected && given && normalize(expected) !== normalize(given)) {
    box.append(h('div', { class: 'small muted' }, 'Also written: ', h('span', { class: 'fr', lang: 'fr' }, expected)));
  }
  if (explain) box.append(h('div', { class: 'small' }, explain));
  return box;
}

export function bar(pct, cls = '') {
  return h('div', { class: ['bar', cls], role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(pct) }, h('span', { style: { width: `${Math.max(0, Math.min(100, pct))}%` } }));
}

export function empty(title, body, action) {
  return h('div', { class: 'empty' }, h('h2', title), body && h('p', body), action);
}

export function setLoading(el, label = 'Loading…') {
  clear(el).append(h('p', { class: 'muted', role: 'status', style: { padding: '2rem' } }, label));
}

export function minutes(sec) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

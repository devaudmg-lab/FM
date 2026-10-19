// Hash router: #/path/:param. Works on GitHub Pages without server rewrites.
const routes = [];
let current = { cleanup: null };
let notFound = null;

export function route(pattern, handler) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/\//g, '\\/').replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '\\/?$');
  routes.push({ re, keys, handler, pattern });
}
export const fallback = handler => { notFound = handler; };

export function parse(hash = location.hash) {
  const path = (hash.replace(/^#/, '') || '/').split('?')[0];
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) return { r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])), path };
  }
  return { r: null, params: {}, path };
}

export function go(path, { replace = false } = {}) {
  const h = '#' + path;
  if (replace) history.replaceState(null, '', h); else if (location.hash !== h) { location.hash = h; return; }
  render();
}

let beforeRender = null;
export const onBeforeRender = fn => { beforeRender = fn; };

export async function render() {
  const { r, params, path } = parse();
  try { current.cleanup?.(); } catch { /* ignore */ }
  current = { cleanup: null };
  const handler = r ? r.handler : notFound;
  const token = current;
  const redirect = beforeRender ? await beforeRender(path, r?.pattern) : null;
  if (token !== current) return;
  if (redirect && redirect !== path) return go(redirect, { replace: true });
  // Each render gets a fresh root; a stale async view fills a detached node harmlessly.
  const root = document.createElement('div');
  const main = document.getElementById('main');
  main.replaceChildren(root);
  window.scrollTo(0, 0);
  const out = await handler(params, root, path);
  if (token !== current) { if (typeof out === 'function') out(); return; }
  if (typeof out === 'function') current.cleanup = out;
  const h1 = root.querySelector('h1');
  if (h1 && !root.dataset.noFocus) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
}

export function start() {
  window.addEventListener('hashchange', render);
  return render();
}

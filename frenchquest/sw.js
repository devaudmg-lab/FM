// Service worker: precached app shell + stale-while-revalidate for content.
importScripts('sw-manifest.js'); // defines self.FQ_VERSION and self.FQ_SHELL

const SHELL = `fq-shell-${self.FQ_VERSION}`;
const CONTENT = 'fq-content-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(self.FQ_SHELL)));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('fq-shell-') && k !== SHELL) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'skip-waiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isContent = url.pathname.includes('/data/') || url.pathname.includes('/assets/audio/');
  if (isContent) {
    e.respondWith((async () => {
      const cache = await caches.open(CONTENT);
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const network = fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      return (await network) || new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'content-type': 'application/json' } });
    })());
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      return await fetch(e.request);
    } catch {
      if (e.request.mode === 'navigate') return caches.match('index.html');
      throw new Error('offline');
    }
  })());
});

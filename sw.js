'use strict';
/* Service worker de BrainDeck: permite abrir la app sin conexión e instalarla.
   - Archivos propios (HTML, CSS, JS, imágenes): primero la red (para recibir siempre la última versión) y, sin conexión, la copia guardada.
   - Librerías de CDN con versión fija y fuentes: primero la copia guardada (nunca cambian).
   - Todo lo demás (API de Claude, radios, modelos de IA, imágenes de Wikimedia) pasa directo sin guardarse. */
const VERSION = 'bd-v2';
const SHELL = `${VERSION}-shell`, LIBS = `${VERSION}-libs`;
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'img/logo.svg', 'img/icon.svg', 'img/favicon.svg',
  'js/boot.js', 'js/core.js', 'js/pixel.js', 'js/i18n.js', 'js/home.js', 'js/commission.js', 'js/watermark.js', 'js/notes.js',
  'js/progress.js', 'js/study.js', 'js/savings.js', 'js/convert.js', 'js/pdfmerge.js', 'js/videodl.js', 'js/subtitles.js',
  'js/creative.js', 'js/palette.js', 'js/gesture.js', 'js/challenge.js', 'js/speak.js', 'js/bgremove.js', 'js/pdftools.js',
  'js/qr.js', 'js/compress.js', 'js/shortcuts.js', 'js/games.js', 'js/findme.js', 'js/qnotes.js', 'js/dashboard.js', 'js/radio.js',
];
const LIB_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  // Solo librerías con versión fija en la URL (las que no tienen @x.y o /x.y.z/ podrían cambiar)
  const pinned = /@\d|\/\d+\.\d+/.test(url.pathname) || url.hostname.startsWith('fonts.');
  if (LIB_HOSTS.includes(url.hostname) && pinned) {
    e.respondWith(caches.open(LIBS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
  }
});

/* Politik — service worker : rend le jeu installable et jouable sans internet.
   À chaque nouvelle version du jeu, changer VERSION pour que les téléphones se mettent à jour. */
var VERSION = 'politik-v3.5.6';
var FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'css/debate-clarity.css', 'css/desktop.css',
  'js/data.js', 'js/map.js', 'js/art.js', 'js/press.js', 'js/fx.js', 'js/engine.js', 'js/perso.js', 'js/ai.js', 'js/legis.js', 'js/govern.js', 'js/cabinet.js', 'js/oppo.js', 'js/cards.js', 'js/tuto.js', 'js/ui.js', 'js/govui.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-192.png', 'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon.png',
  'fonts/anybody.woff2', 'fonts/atkinson-400.woff2', 'fonts/atkinson-400-italic.woff2', 'fonts/atkinson-700.woff2', 'fonts/archivo.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k.indexOf('politik-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // les polices sont livrées avec le jeu (dossier fonts/) : plus besoin d'internet pour elles
  if (url.origin !== location.origin) return;
  // fichiers du jeu : le réseau d'abord (pour avoir la dernière version), le cache si on est hors ligne
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || caches.match('index.html'); });
  }));
});

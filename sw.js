/* Politik — service worker : rend le jeu installable et jouable sans internet.
   À chaque nouvelle version du jeu, changer VERSION pour que les téléphones se mettent à jour. */
var VERSION = 'politik-v5.0.1';
/* LE CŒUR, précaché à l'installation. addAll est tout-ou-rien : un seul fichier absent ici et le service worker
   ne s'installe pas, donc plus de jeu hors ligne. Tout nouveau fichier du cœur s'ajoute ici, dans son groupe, sur sa ligne
   (test/check-socle.js vérifie que la liste correspond à index.html et que chaque fichier existe).
   Jamais d'art lourd dans cette liste : il va dans assets/ (voir plus bas). */
var FILES = [
  './', 'index.html', 'manifest.webmanifest',
  /* styles : même ordre que index.html */
  'css/style.css',
  'css/debate-clarity.css',
  /* styles : composants et écrans */
  'css/infobulle.css',
  /* styles : la version PC reste la dernière */
  'css/desktop.css',
  /* scripts : socle */
  'js/bus.js',
  'js/infobulle.js',
  /* scripts : données et moteurs */
  'js/data.js', 'js/people.js', 'js/map.js', 'js/engine.js', 'js/perso.js', 'js/ai.js',
  /* scripts : dessin et animations */
  'js/art.js', 'js/press.js', 'js/fx.js', 'js/tuto.js', 'js/tips.js',
  /* scripts : moteurs du quinquennat */
  'js/legis.js', 'js/economy.js', 'js/govern.js', 'js/cabinet.js', 'js/oppo.js', 'js/cards.js', 'js/mandat-save.js',
  /* scripts : son */
  /* scripts : écrans */
  'js/ui.js', 'js/govui.js',
  /* icônes et polices */
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-192.png', 'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon.png',
  'fonts/anybody.woff2', 'fonts/atkinson-400.woff2', 'fonts/atkinson-400-italic.woff2', 'fonts/atkinson-700.woff2', 'fonts/archivo.woff2'
];
/* L'ART LOURD (images, sons) vit dans assets/, hors de FILES : il se charge à la demande, puis reste en cache.
   Ce cache survit aux mises à jour du jeu, pour ne pas tout retélécharger à chaque version.
   Un fichier d'assets/ qui change doit changer de nom ; pour tout purger d'un coup, changer ART_CACHE. */
var ART_CACHE = 'politik-art-1';
var ART_PATH = new URL('assets/', location.href).pathname;
var ART_MAX = 80;   // au-delà, les fichiers les plus anciens sortent du cache
/* Repli pour une image absente : un aplat neutre plutôt qu'une image cassée (ou index.html servi à la place de l'image) */
var IMAGE_REPLI = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3" preserveAspectRatio="none"><rect width="4" height="3" fill="#D9DCD3"/></svg>';

function estImage(req, url) {
  return req.destination === 'image' || /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(url.pathname);
}
function repliImage() {
  return new Response(IMAGE_REPLI, { status: 200, headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store', 'X-Politik-Repli': '1' } });
}
/* Hors ligne et rien en cache : la page d'accueil pour une navigation, le repli pour une image, une vraie erreur pour le reste */
function secours(req, url) {
  if (req.mode === 'navigate') return caches.match('index.html');
  if (estImage(req, url)) return repliImage();
  return Response.error();
}
function allegerArt(cache) {
  return cache.keys().then(function (keys) {
    return Promise.all(keys.slice(0, Math.max(0, keys.length - ART_MAX)).map(function (k) { return cache.delete(k); }));
  });
}
/* Art : le cache d'abord (ces fichiers sont gros et ne changent pas), sinon le réseau */
function chercherArt(e, req, url) {
  return caches.open(ART_CACHE).then(function (c) {
    return c.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res.status === 200) { e.waitUntil(c.put(req, res.clone()).then(function () { return allegerArt(c); })); return res; }
        return !res.ok && estImage(req, url) ? repliImage() : res;
      });
    });
  }).catch(function () { return secours(req, url); });
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== ART_CACHE && k.indexOf('politik-') === 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // les polices sont livrées avec le jeu (dossier fonts/) : plus besoin d'internet pour elles
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf(ART_PATH) === 0) {
    // lecture par morceaux (<audio>, <video>) : le cache ne sait pas la servir, on laisse faire le navigateur
    if (req.headers.has('range')) return;
    e.respondWith(chercherArt(e, req, url));
    return;
  }
  // fichiers du jeu : le réseau d'abord (pour avoir la dernière version), le cache si on est hors ligne
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
    return !res.ok && estImage(req, url) ? repliImage() : res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || secours(req, url); });
  }));
});

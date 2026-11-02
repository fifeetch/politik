/* Vérifie le socle : balises d'index.html, liste hors ligne et comportement du service worker, contrats figés.
   Le service worker tourne ici pour de vrai, avec un faux navigateur (cache, réseau). Usage : node test/check-socle.js */
var assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
var ROOT = path.join(__dirname, '..');
function lire(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }

/* ---------- Un faux navigateur pour sw.js ---------- */
var ORIGIN = 'https://exemple.test', BASE = ORIGIN + '/politik/';
function fauxCache() {
  var map = new Map();
  return {
    map: map,
    match: function (r) { var k = cle(r); return Promise.resolve(map.has(k) ? map.get(k) : undefined); },
    put: function (r, res) { map.set(cle(r), res); return Promise.resolve(); },
    keys: function () { return Promise.resolve(Array.from(map.keys())); },
    delete: function (k) { return Promise.resolve(map.delete(cle(k))); },
    addAll: function (list) { list.forEach(function (f) { map.set(cle(f), new Rep('cœur:' + f, { status: 200 })); }); return Promise.resolve(); }
  };
}
function cle(r) { return new URL(typeof r === 'string' ? r : r.url, BASE).href; }
function Rep(corps, o) {
  o = o || {}; this.corps = corps; this.status = o.status == null ? 200 : o.status; this.ok = this.status >= 200 && this.status < 300;
  var h = o.headers || {}; this.headers = { get: function (k) { return h[k] || null; } };
  this.clone = function () { return this; };
}
Rep.error = function () { var r = new Rep('', { status: 0 }); r.erreur = true; return r; };
function monde(reseau) {
  var caches = {}, listeners = {}, appels = [];
  var api = {
    open: function (n) { return Promise.resolve(caches[n] || (caches[n] = fauxCache())); },
    keys: function () { return Promise.resolve(Object.keys(caches)); },
    delete: function (n) { delete caches[n]; return Promise.resolve(true); },
    match: function (r) {
      var noms = Object.keys(caches), i = 0;
      return (function suite() {
        if (i >= noms.length) return Promise.resolve(undefined);
        return caches[noms[i++]].match(r).then(function (hit) { return hit || suite(); });
      })();
    }
  };
  var ctx = { URL: URL, Promise: Promise, Response: Rep, caches: api, location: new URL(BASE + 'sw.js'), console: console,
    fetch: function (r) { appels.push(cle(r)); return reseau(cle(r)); },
    self: { addEventListener: function (t, f) { listeners[t] = f; }, skipWaiting: function () {}, clients: { claim: function () {} } } };
  vm.runInNewContext(lire('sw.js'), ctx);
  return { ctx: ctx, caches: caches, api: api, appels: appels,
    lancer: function (type, ev) { ev = ev || {}; var attente = []; ev.waitUntil = function (p) { attente.push(p); }; listeners[type](ev); return Promise.all(attente); },
    requete: function (chemin, o) {
      o = o || {};
      var rep = null, attente = [], ev = { request: { url: new URL(chemin, BASE).href, method: o.method || 'GET', mode: o.mode || 'cors', destination: o.destination || '', headers: { has: function (k) { return k === 'range' && !!o.range; } } },
        respondWith: function (p) { rep = p; }, waitUntil: function (p) { attente.push(p); } };
      listeners.fetch(ev);
      return Promise.resolve(rep).then(function (r) { return Promise.all(attente).then(function () { return Promise.resolve().then(function () { return Promise.resolve(); }).then(function () { return r; }); }); });
    }
  };
}
function horsLigne() { return Promise.reject(new TypeError('hors ligne')); }

/* ---------- Balises et liste hors ligne ---------- */
var html = lire('index.html');
var scripts = (html.match(/<script src="[^"]+"/g) || []).map(function (s) { return s.slice(13, -1); });
var styles = (html.match(/<link rel="stylesheet" href="[^"]+"/g) || []).map(function (s) { return s.match(/href="([^"]+)"/)[1]; });
var FILES = monde(horsLigne).ctx.FILES;
assert.ok(Array.isArray(FILES) || FILES.length, 'FILES est une liste');
scripts.concat(styles).forEach(function (f) { assert.ok(FILES.indexOf(f) >= 0, f + ' est dans index.html mais pas dans FILES de sw.js : le jeu hors ligne casserait'); });
FILES.forEach(function (f) {
  // addAll est tout-ou-rien : un seul fichier absent, et le service worker ne s'installe pas
  assert.ok(f === './' || fs.existsSync(path.join(ROOT, f)), f + ' est dans FILES mais n\'existe pas : plus aucune installation hors ligne');
  assert.ok(f.indexOf('assets/') !== 0, f + ' : l\'art lourd reste hors de FILES');
});
assert.strictEqual(new Set(FILES).size, FILES.length, 'pas de doublon dans FILES');
assert.strictEqual(styles[styles.length - 1], 'css/desktop.css', 'la version PC reste le dernier style');
assert.ok(scripts.indexOf('js/bus.js') < scripts.indexOf('js/ui.js') && scripts.indexOf('js/infobulle.js') < scripts.indexOf('js/govui.js'), 'le socle se charge avant les écrans');
assert.ok(scripts.indexOf('js/bus.js') < scripts.indexOf('js/infobulle.js'), 'le bus se charge avant l\'infobulle');

/* ---------- Contrats figés ---------- */
var ui = lire('js/ui.js');
assert.ok(/CONTRAT FIGÉ[\s\S]{0,900}function go\(name\) \{/.test(ui), 'go(name) reste documenté et de même signature');
assert.ok(/CONTRAT FIGÉ[\s\S]{0,900}function modal\(opts\) \{/.test(ui), 'modal(opts) reste documenté et de même signature');
assert.ok(/<!-- SCRIPTS[\s\S]*go\(name\)[\s\S]*modal\(opts\)/.test(html), 'index.html rappelle les contrats');

/* ---------- Jetons ---------- */
var css = lire('css/style.css');
['--paper', '--ink', '--ink-rgb', '--white', '--fs-md', '--lh-text', '--sp-2', '--radius-md', '--z-infobulle'].forEach(function (t) { assert.ok(css.indexOf(t + ':') >= 0, 'jeton ' + t); });
(lire('css/infobulle.css').match(/var\(--[a-z0-9-]+/g) || []).forEach(function (v) {
  var t = v.slice(4);
  if (t.indexOf('--ib-') !== 0) assert.ok(css.indexOf(t + ':') >= 0, 'infobulle.css utilise un jeton inconnu : ' + t);
});
assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(lire('css/infobulle.css')), 'infobulle.css ne contient aucune couleur en dur');

/* ---------- Le service worker au travail ---------- */
var IMG = 'assets/img/scene.webp';
var etapes = [
  function installe() {
    var m = monde(horsLigne);
    return m.lancer('install').then(function () {
      assert.ok(m.caches[m.ctx.VERSION].map.has(BASE + 'index.html'));
      assert.strictEqual(m.ctx.VERSION.indexOf('politik-v'), 0);
    });
  },
  function imageAbsenteHorsLigne() {
    var m = monde(horsLigne);
    return m.lancer('install').then(function () { return m.requete('icons/inconnue.png', { destination: 'image' }); }).then(function (r) {
      assert.strictEqual(r.headers.get('Content-Type'), 'image/svg+xml', 'une image absente reçoit le repli, pas index.html');
      assert.strictEqual(r.headers.get('X-Politik-Repli'), '1');
    });
  },
  function imageParFetchHorsLigne() {
    var m = monde(horsLigne);
    return m.requete('images/x.webp').then(function (r) { assert.strictEqual(r.headers.get('X-Politik-Repli'), '1'); });
  },
  function image404EnLigne() {
    var m = monde(function () { return Promise.resolve(new Rep('404', { status: 404 })); });
    return m.requete('images/x.png', { destination: 'image' }).then(function (r) { assert.strictEqual(r.headers.get('X-Politik-Repli'), '1'); });
  },
  function navigationHorsLigne() {
    var m = monde(horsLigne);
    return m.lancer('install').then(function () { return m.requete('une/page', { mode: 'navigate' }); }).then(function (r) { assert.strictEqual(r.corps, 'cœur:index.html'); });
  },
  function scriptAbsentHorsLigne() {
    var m = monde(horsLigne);
    return m.lancer('install').then(function () { return m.requete('js/nouveau.js', { destination: 'script' }); }).then(function (r) { assert.ok(r.erreur, 'un script absent est une vraie erreur, pas index.html'); });
  },
  function coeurHorsLigne() {
    var m = monde(horsLigne);
    return m.lancer('install').then(function () { return m.requete('js/ui.js'); }).then(function (r) { assert.strictEqual(r.corps, 'cœur:js/ui.js'); });
  },
  function coeurEnLigne() {
    var m = monde(function () { return Promise.resolve(new Rep('neuf')); });
    return m.requete('js/ui.js').then(function (r) { assert.strictEqual(r.corps, 'neuf'); });
  },
  function artALaDemande() {
    var n = 0, m = monde(function () { n++; return Promise.resolve(new Rep('art' + n)); });
    return m.requete(IMG, { destination: 'image' }).then(function (r) {
      assert.strictEqual(r.corps, 'art1');
      assert.ok(m.caches[m.ctx.ART_CACHE].map.has(BASE + IMG), 'l\'art chargé va dans son propre cache');
      assert.ok(!m.caches[m.ctx.VERSION], 'et pas dans le cache du cœur');
      return m.requete(IMG, { destination: 'image' });
    }).then(function (r) { assert.strictEqual(r.corps, 'art1', 'la 2e fois, il vient du cache'); assert.strictEqual(n, 1); });
  },
  function artAbsent() {
    var m = monde(function () { return Promise.resolve(new Rep('404', { status: 404 })); });
    return m.requete(IMG, { destination: 'image' }).then(function (r) {
      assert.strictEqual(r.headers.get('X-Politik-Repli'), '1');
      assert.ok(!m.caches[m.ctx.ART_CACHE].map.has(BASE + IMG), 'le repli et les 404 ne vont pas en cache');
    });
  },
  function artHorsLigne() {
    var m = monde(horsLigne);
    return m.requete(IMG, { destination: 'image' }).then(function (r) { assert.strictEqual(r.headers.get('X-Politik-Repli'), '1'); });
  },
  function sonHorsLigne() {
    var m = monde(horsLigne);
    return m.requete('assets/audio/clic.mp3').then(function (r) { assert.ok(r.erreur, 'un son absent hors ligne reste une erreur'); });
  },
  function sonParMorceaux() {
    var m = monde(horsLigne);
    return m.requete('assets/audio/theme.mp3', { range: true }).then(function (r) { assert.strictEqual(r, null, 'lecture par morceaux : laissée au navigateur'); });
  },
  function artBorne() {
    var n = 0, m = monde(function () { return Promise.resolve(new Rep('x' + (n++))); }), max = 0, chaine = Promise.resolve();
    max = m.ctx.ART_MAX;
    for (var i = 0; i < max + 5; i++) (function (i) { chaine = chaine.then(function () { return m.requete('assets/img/' + i + '.webp'); }); })(i);
    return chaine.then(function () {
      var c = m.caches[m.ctx.ART_CACHE].map;
      assert.strictEqual(c.size, max);
      assert.ok(!c.has(BASE + 'assets/img/0.webp') && c.has(BASE + 'assets/img/' + (max + 4) + '.webp'), 'les plus anciens sortent d\'abord');
    });
  },
  function miseAJourGardeLArt() {
    var m = monde(horsLigne);
    return Promise.all([m.api.open(m.ctx.VERSION), m.api.open(m.ctx.ART_CACHE), m.api.open('politik-v0.0'), m.api.open('politik-art-0'), m.api.open('autre-appli')]).then(function () {
      return m.lancer('activate');
    }).then(function () {
      assert.deepStrictEqual(Object.keys(m.caches).sort(), ['autre-appli', m.ctx.ART_CACHE, m.ctx.VERSION].sort());
    });
  },
  function horsSujet() {
    var m = monde(horsLigne);
    return Promise.all([m.requete('https://ailleurs.test/x.png'), m.requete('js/ui.js', { method: 'POST' })]).then(function (r) {
      assert.strictEqual(r[0], null, 'un autre site n\'est pas intercepté');
      assert.strictEqual(r[1], null, 'seul GET est intercepté');
    });
  }
];
etapes.reduce(function (p, f) {
  return p.then(function () { return f(); }).catch(function (er) { er.message = f.name + ' : ' + er.message; throw er; });
}, Promise.resolve()).then(function () {
  console.log('Socle (balises, cache hors ligne : ' + etapes.length + ' scénarios, contrats, jetons) : OK');
}).catch(function (er) { console.error(er); process.exit(1); });

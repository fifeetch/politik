/* Vérifie le son sans navigateur : tout passe par un faux AudioContext et un faux stockage.
   Ce test ne juge pas le rendu à l'oreille. Usage : node test/check-audio.js */
var assert = require('assert'), fs = require('fs'), path = require('path');
var Son = require('../js/audio.js');
var Bus = require('../js/bus.js');
var ROOT = path.join(__dirname, '..');
function lire(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }

/* ---------- Un faux navigateur ---------- */
var creations = 0, noeuds = [];
function Param(nom) {
  var p = { value: 1 };
  ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime'].forEach(function (m) {
    p[m] = function (v, t) {
      assert(isFinite(v) && isFinite(t) && t >= 0, nom + '.' + m + ' : valeur invalide ' + v + ' à ' + t);
      if (m === 'exponentialRampToValueAtTime') assert(v > 0, nom + ' : une rampe exponentielle ne descend pas à 0');
      p.value = v;
    };
  });
  p.cancelScheduledValues = function () {};
  return p;
}
function Noeud(extra) {
  var n = { connect: function () {}, disconnect: function () {} };
  Object.keys(extra || {}).forEach(function (k) { n[k] = extra[k]; });
  noeuds.push(n);
  return n;
}
function Source(extra) {
  var n = Noeud(extra);
  n.start = function (t) { assert(isFinite(t), 'start : instant invalide'); n.demarre = t; };
  n.stop = function (t) { assert(isFinite(t), 'stop : instant invalide'); n.arret = t; };
  return n;
}
function FauxContexte() {
  creations++;
  this.state = 'suspended'; this.currentTime = 0; this.destination = Noeud();
  this.reprises = 0;
  FauxContexte.dernier = this;
}
FauxContexte.prototype = {
  resume: function () { this.reprises++; this.state = 'running'; return Promise.resolve(); },
  suspend: function () { this.state = 'suspended'; return Promise.resolve(); },
  createGain: function () { return Noeud({ gain: Param('gain') }); },
  createDynamicsCompressor: function () { return Noeud(); },
  createBiquadFilter: function () { return Noeud({ frequency: Param('frequency'), Q: Param('Q') }); },
  createOscillator: function () { return Source({ frequency: Param('frequency'), detune: Param('detune') }); },
  createBufferSource: function () { return Source({ playbackRate: Param('playbackRate') }); },
  createBuffer: function (c, n) { var d = new Float32Array(n); return { getChannelData: function () { return d; } }; }
};
function fauxStockage(depart) {
  var m = depart || {};
  return { m: m, getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); } };
}
function fauxDocument() {
  var ecoute = {};
  return {
    hidden: false,
    addEventListener: function (nom, fn) { (ecoute[nom] || (ecoute[nom] = [])).push(fn); },
    envoyer: function (nom, e) { (ecoute[nom] || []).forEach(function (fn) { fn(e || { target: null }); }); }
  };
}
function sansAttente() {}
function moteur(o) {
  o = o || {};
  return Son.creer({ AudioContext: o.Contexte === undefined ? FauxContexte : o.Contexte, document: o.document, bus: o.bus, stockage: o.stockage || fauxStockage(), attendre: o.attendre || sansAttente });
}
function sources() { return noeuds.filter(function (n) { return n.start; }); }
var EVENEMENTS = ['nav:go', 'ui:modal-open', 'ui:modal-close', 'ui:alert', 'ui:paper', 'ui:action', 'ui:poll', 'ui:night-result'];

/* ---------- La liste demandée ---------- */
['clic', 'page', 'gain', 'perte', 'carte', 'alerte', 'cloche', 'radio', 'vingtHeures', 'foule', 'applaudissements', 'huees', 'soiree'].forEach(function (id) {
  assert(Son.SONS.indexOf(id) >= 0, 'son manquant : ' + id);
});
assert(Son.AMBIANCES.length >= 1 && Son.AMBIANCES.length <= 2);

/* ---------- Aucun son avant le premier geste, et un départ doux ---------- */
creations = 0;
var doc = fauxDocument(), a = moteur({ document: doc });
assert.strictEqual(a.jouer('clic'), false, 'un son avant le premier geste');
a.ambiance('plateau');
assert.strictEqual(creations, 0, 'un AudioContext avant le premier geste');
assert(a.etat().volume > 0 && a.etat().volume <= 0.5, 'volume de départ trop fort');
doc.envoyer('pointerdown');
assert.strictEqual(creations, 1);
assert(FauxContexte.dernier.reprises >= 1, 'le premier geste relance le contexte');
assert.strictEqual(a.etat().ambiance, 'plateau', 'l\'ambiance demandée avant le geste démarre au geste');

/* ---------- Chaque son et chaque ambiance se construisent, proprement ---------- */
Son.SONS.forEach(function (id) {
  var d = fauxDocument(), m = moteur({ document: d });
  d.envoyer('pointerdown');
  noeuds = [];
  assert.strictEqual(m.jouer(id), true, 'son non joué : ' + id);
  var s = sources();
  assert(s.length > 0 && s.length <= 30, id + ' : ' + s.length + ' voix');
  s.forEach(function (x) { assert(x.demarre != null && x.arret != null, id + ' : une source ne s\'arrête pas'); });
  assert(Math.max.apply(null, s.map(function (x) { return x.arret; })) <= 4, id + ' : plus de 4 s');
  assert.strictEqual(m.jouer(id), false, id + ' : pas d\'écart entre deux lectures');
});
Son.AMBIANCES.forEach(function (id) {
  var d = fauxDocument(), m = moteur({ document: d });
  d.envoyer('pointerdown'); m.ambiance(id);
  assert.strictEqual(m.etat().ambiance, id);
  m.ambiance(null);
  assert.strictEqual(m.etat().ambiance, null);
});
assert.strictEqual(a.jouer('inconnu'), false);
assert.strictEqual(a.jouer('constructor'), false, 'un nom hérité n\'est pas un son');
a.ambiance('constructor');
assert.strictEqual(a.etat().ambiance, null, 'un nom hérité n\'est pas une ambiance');

/* ---------- Sans AudioContext, ou s'il échoue : le silence, jamais d'erreur ---------- */
var d4 = fauxDocument(), m4 = moteur({ Contexte: null, document: d4, bus: Bus });
d4.envoyer('pointerdown'); d4.envoyer('click');
assert.strictEqual(m4.jouer('clic'), false);
assert.doesNotThrow(function () { m4.ambiance('plateau'); m4.couper(true); m4.couper(false); m4.volume(0.2); });
assert.strictEqual(m4.etat().disponible, false);
var erreur = console.error, erreurs = 0;
console.error = function () { erreurs++; };
EVENEMENTS.forEach(function (n) { Bus.emit(n, {}); Bus.emit(n); });
console.error = erreur;
assert.strictEqual(erreurs, 0, 'le bus reste sans erreur sans AudioContext');
EVENEMENTS.forEach(function (n) { Bus.off(n); });

function Casse() { throw new Error('refusé'); }
var d5 = fauxDocument(), m5 = moteur({ Contexte: Casse, document: d5 });
assert.doesNotThrow(function () { d5.envoyer('pointerdown'); m5.jouer('clic'); });
assert.strictEqual(m5.etat().disponible, false);

// un contexte dont les nœuds plantent ne remonte pas d'erreur non plus
function Fragile() { FauxContexte.call(this); this.createOscillator = function () { throw new Error('boum'); }; }
Fragile.prototype = FauxContexte.prototype;
var d6 = fauxDocument(), m6 = moteur({ Contexte: Fragile, document: d6 });
d6.envoyer('pointerdown');
assert.strictEqual(m6.jouer('gain'), false);

/* ---------- Réglages : mémorisés, relus, protégés ---------- */
var st = fauxStockage(), m7 = moteur({ stockage: st });
m7.volume(0.8); m7.couper(true);
assert.deepStrictEqual(JSON.parse(st.m.politik_son), { coupe: true, volume: 0.8 });
var relu = Son.lireReglages(st);
assert.strictEqual(relu.coupe, true); assert.strictEqual(relu.volume, 0.8);
m7.volume(5); assert.strictEqual(m7.etat().volume, 1);
m7.volume(-1); assert.strictEqual(m7.etat().volume, 0);

['{cassé', '12', 'null', '{"volume":"fort","coupe":"oui"}', '{"volume":7}'].forEach(function (v) {
  var r = Son.lireReglages(fauxStockage({ politik_son: v }));
  assert.strictEqual(r.coupe, false, v); assert(r.volume > 0 && r.volume <= 0.5, v);
});
var interdit = { getItem: function () { throw new Error('interdit'); }, setItem: function () { throw new Error('interdit'); } };
assert.doesNotThrow(function () { var x = moteur({ stockage: interdit }); x.volume(0.3); x.couper(true); });
assert.doesNotThrow(function () { Son.lireReglages(null); Son.creer({ stockage: null }).volume(0.3); });

/* ---------- Son coupé : aucun contexte, même après un geste ---------- */
creations = 0;
var d8 = fauxDocument(), m8 = moteur({ document: d8, stockage: fauxStockage({ politik_son: '{"coupe":true,"volume":0.5}' }) });
d8.envoyer('pointerdown');
assert.strictEqual(m8.jouer('clic'), false);
assert.strictEqual(creations, 0, 'son coupé : pas de contexte');
m8.couper(false);
assert.strictEqual(m8.jouer('clic'), true, 'réactivé, le son revient');
assert.strictEqual(creations, 1);
m8.ambiance('meeting');
m8.couper(true);
assert.strictEqual(m8.etat().ambiance, null, 'couper le son arrête l\'ambiance');
assert.strictEqual(m8.jouer('gain'), false);

/* ---------- Onglet caché : suspendu, puis repris ---------- */
var d9 = fauxDocument(), m9 = moteur({ document: d9 });
d9.envoyer('pointerdown');
var c9 = FauxContexte.dernier;
d9.hidden = true; d9.envoyer('visibilitychange');
assert.strictEqual(c9.state, 'suspended');
assert.strictEqual(m9.jouer('carte'), false, 'pas de son onglet caché');
d9.hidden = false; d9.envoyer('visibilitychange');
assert.strictEqual(c9.state, 'running');

/* ---------- Les moments du jeu ---------- */
function modale(kicker, title) { return Son.sonDeModale({ kicker: kicker, title: title }); }
assert.strictEqual(modale('Débat télévisé', 'Ce soir, sur le plateau !'), 'cloche');
assert.strictEqual(modale('Entre-deux-tours', 'Le grand face-à-face'), 'cloche');
assert.strictEqual(modale('📻 Matinale radio · 1 ⚡', 'Quelle radio ce matin ?'), 'radio');
assert.strictEqual(modale('Tour 3 · 20 h', 'Flash info'), 'vingtHeures');
assert.strictEqual(modale('Premier tour · 20h', 'Tu es qualifié pour le second tour !'), 'vingtHeures');
assert.strictEqual(modale('💥 Affaire', 'Ça sort dans la presse'), 'alerte');
assert.strictEqual(modale('Été · Année 2', 'L\'actualité s\'impose'), 'alerte');
assert.strictEqual(modale('Débat', 'Tu remportes le débat !'), 'applaudissements');
assert.strictEqual(modale('Débat', 'Le Parti remporte le débat'), 'huees');
assert.strictEqual(modale('Le budget', 'Budget adopté'), 'gain');
assert.strictEqual(modale('Automne · Vote du budget', 'Pas de majorité pour ton budget'), 'perte');
assert.strictEqual(modale('Résultats', 'Le détail'), null);
assert.strictEqual(Son.sonDeModale(null), null);
assert.strictEqual(Son.sonDAction('terrain'), 'foule');
assert.strictEqual(Son.sonDAction('union'), 'carte');
assert.strictEqual(Son.ambianceVoulue('night', null), 'plateau');
assert.strictEqual(Son.ambianceVoulue('game', 'tv-modal'), 'plateau');
assert.strictEqual(Son.ambianceVoulue('lcamp', null), 'meeting');
assert.strictEqual(Son.ambianceVoulue('game', 'shake'), null);

// le bus déclenche bien les sons, et l'ambiance suit l'écran
var d10 = fauxDocument(), plus = [], m10 = moteur({ document: d10, bus: Bus, attendre: function (fn, ms) { if (ms < 200) plus.push(fn); } });
function vider() { plus.splice(0).forEach(function (f) { f(); }); }
function sonne(nom, data) { noeuds = []; Bus.emit(nom, data); return sources().length > 0; }
assert.strictEqual(sonne('ui:paper', {}), false, 'avant le geste : rien');
d10.envoyer('pointerdown');
assert(sonne('ui:paper', {}), 'ui:paper');
assert(sonne('ui:alert', { n: 1 }), 'ui:alert');
assert(sonne('ui:action', { type: 'terrain' }), 'ui:action');
assert(sonne('ui:poll', { delta: 0.01 }), 'ui:poll gain');
assert(sonne('ui:poll', { delta: -0.01 }), 'ui:poll perte');
assert.strictEqual(sonne('ui:poll', { delta: 0 }), false, 'sondage stable : rien');
assert(sonne('ui:night-result', { win: true }), 'ui:night-result');
Bus.emit('nav:go', { name: 'night' }); vider();
assert.strictEqual(m10.etat().ambiance, 'plateau');
Bus.emit('nav:go', { name: 'game' }); vider();
assert.strictEqual(m10.etat().ambiance, null);
Bus.emit('ui:modal-open', { cls: 'tv-modal' }); vider();
assert.strictEqual(m10.etat().ambiance, 'plateau');
Bus.emit('ui:modal-close', {}); vider();
assert.strictEqual(m10.etat().ambiance, null);
EVENEMENTS.forEach(function (n) { Bus.off(n); });

/* ---------- Le clic : les boutons sonnent, le reste non ---------- */
var d11 = fauxDocument();
moteur({ document: d11 });
d11.envoyer('pointerdown');
noeuds = []; d11.envoyer('click', { target: { closest: function () { return null; } } });
assert.strictEqual(sources().length, 0, 'un clic dans le vide ne sonne pas');
noeuds = []; d11.envoyer('click', { target: { closest: function (s) { return /^button/.test(s) ? { disabled: true } : null; } } });
assert.strictEqual(sources().length, 0, 'un bouton désactivé ne sonne pas');
noeuds = []; d11.envoyer('click', { target: { closest: function (s) { return /^button/.test(s) ? { disabled: false } : null; } } });
assert(sources().length > 0, 'un bouton sonne');

/* ---------- Branché dans le jeu ---------- */
var html = lire('index.html'), sw = lire('sw.js'), ui = lire('js/ui.js');
assert(/<!-- scripts : son -->\s*<script src="js\/audio\.js"><\/script>/.test(html), 'audio.js dans son groupe d\'index.html');
assert(html.indexOf('src="js/audio.js"') < html.indexOf('src="js/ui.js"'), 'audio.js avant ui.js');
assert(/\/\* scripts : son \*\/\s*'js\/audio\.js'/.test(sw), 'audio.js dans son groupe de FILES');
assert(!/\bfetch\(|new Audio\(|<audio|XMLHttpRequest|https?:\/\//.test(lire('js/audio.js')), 'aucun téléchargement, aucun service extérieur');
['ui:alert', 'ui:paper', 'ui:action', 'ui:poll', 'ui:night-result'].forEach(function (n) {
  assert(ui.indexOf("Bus.emit('" + n + "'") >= 0, 'js/ui.js émet ' + n);
});
assert(!/PolitikAudio/.test(ui), 'le jeu ne connaît pas le son : il passe par le bus');
['engine.js', 'govern.js', 'economy.js'].forEach(function (f) { assert(!/PolitikAudio/.test(lire('js/' + f)), f); });

console.log('Son : tout est bon (' + Son.SONS.length + ' effets, ' + Son.AMBIANCES.length + ' ambiances).');

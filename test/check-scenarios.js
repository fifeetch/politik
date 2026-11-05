/* Les événements du mandat : chacun a une image dessinée qui existe, et des choix valides. */
var assert = require('assert'), fs = require('fs'), D = require('../js/data.js'), E = require('../js/engine.js'), G = require('../js/govern.js');
var src = fs.readFileSync(__dirname + '/../js/bd-jeu.js', 'utf8') + fs.readFileSync(__dirname + '/../js/bd-evenements.js', 'utf8');
var SEG = D.SEGMENTS.map(function (x) { return x.id; }), vus = {};
assert.ok(G.EVENTS.length >= 22);
['eboueurs', 'aeriens', 'edf', 'generale', 'medicaments', 'inondations', 'panne', 'emeutes', 'cyclone', 'lobbies', 'sommet', 'fermeture', 'fuite', 'evenement'].forEach(function (id) {
  var ev = G.EVENTS.filter(function (e) { return e.id === id; })[0];
  assert.ok(ev && ev.opts.length === 2, id + ' a deux choix');
});
G.EVENTS.forEach(function (ev) {
  assert.ok(!vus[ev.id], ev.id + ' est unique'); vus[ev.id] = true;
  assert.ok(ev.scene, ev.id + ' a une scène');
  assert.ok(new RegExp('\\b' + ev.scene + ': function').test(src), ev.id + ' : la scène ' + ev.scene + ' existe');
  assert.ok(ev.title && ev.text && ev.opts.length >= 1, ev.id + ' a un titre, un texte et des choix');
  ev.opts.forEach(function (o) {
    assert.ok(o.label, ev.id + ' : choix nommé');
    Object.keys(o.sat || {}).forEach(function (k) { assert.ok(SEG.indexOf(k) >= 0, ev.id + ' : groupe connu ' + k); });
  });
});
var CD = require('../js/cards.js');
CD.CARDS.concat(Object.keys(CD.FOLLOW || {}).map(function (k) { return CD.FOLLOW[k]; })).forEach(function (c) {
  var n = CD.sceneOf(c);
  assert.ok(new RegExp('\\b' + n + ': function').test(src), (c.id || c.who) + ' : la scène ' + n + ' existe');
});
var D2 = D.FUNDING.filter(function (m) { return m.loiSeule; });
assert.ok(D2.length >= 11, 'les grandes lois existent');
[15, 20, 30].forEach(function (n) { assert.ok(D2.some(function (m) { return m.cost === -n; }), 'une loi à ' + n + ' Md€'); });
D2.forEach(function (m) { assert.ok(m.edu && m.src && m.src.length && m.vrai, m.id + ' est expliquée et sourcée'); assert.ok(G.NEW_LAWS.recettes.concat(G.NEW_LAWS.economies).indexOf(m.id) >= 0, m.id + ' est proposable'); });
/* Tout groupe nommé dans une carte existe, et les grèves annoncées sont connues */
CD.CARDS.concat(CD.FOLLOW).forEach(function (c) { [c.left, c.right].filter(Boolean).forEach(function (o) {
  Object.keys(o.sat || {}).forEach(function (k) { assert.ok(SEG.indexOf(k) >= 0, c.id + ' : groupe connu ' + k); });
  if (o.tient) assert.ok(G.GREVES[o.tient], c.id + ' : grève connue');
}); });
G.EVENTS.forEach(function (ev) { ev.opts.forEach(function (o) { if (o.tient) assert.ok(G.GREVES[o.tient], ev.id + ' : grève connue'); }); });
Object.keys(G.GREVES).forEach(function (id) { assert.ok(new RegExp('\\b' + G.GREVES[id].scene + ': function').test(src), id + ' : sa scène existe'); });
['cheminots', 'raffineries', 'infirmieres', 'profs', 'policiers'].forEach(function (id) { assert.ok(CD.BY[id].right.tient === id, id + ' : le bouton dur peut reconduire'); });

/* Deux événements par an : dix sur un mandat, sans répétition, y compris pour une vieille sauvegarde à 8 événements */
function rng(g) { var x = g; return function () { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
function mandat(g) { var deck = G.EVENTS.map(function (e) { return e.id; }), r = rng(g); for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = deck[i]; deck[i] = deck[j]; deck[j] = x; } return { rng: r, year: 1, eventsDeck: deck, popBonus: 0 }; }
function dix(gv) { var ids = []; for (gv.year = 1; gv.year <= G.C.years; gv.year++) [0, 1].forEach(function (n) { ids.push(G.drawEvent(gv, n).id); }); return ids; }
for (var g0 = 1; g0 <= 50; g0++) {
  var ids = dix(mandat(g0));
  assert.strictEqual(ids.length, 10); assert.strictEqual(Object.keys(ids.reduce(function (m, x) { m[x] = 1; return m; }, {})).length, 10, 'dix événements différents');
}
var vieux = mandat(3); vieux.eventsDeck = vieux.eventsDeck.filter(function (id) { return ['canicule', 'marches', 'ministre', 'bleus', 'gilets', 'tracteurs', 'cour', 'innovation'].indexOf(id) >= 0; });
assert.strictEqual(Object.keys(dix(vieux).reduce(function (m, x) { m[x] = 1; return m; }, {})).length, 10, 'une vieille sauvegarde complète sa pioche');
var suivi = mandat(4); assert.strictEqual(G.eventsDone(suivi), 0); G.doneEvent(suivi); assert.strictEqual(G.eventsDone(suivi), 1); assert.strictEqual(G.drawEvent(suivi).id, G.drawEvent(suivi, 1).id, 'la reprise tire le second'); suivi.year = 2; assert.strictEqual(G.eventsDone(suivi), 0);

/* Les grèves : une chance sur deux, plus chère au tour suivant, et elle survit à la sauvegarde */
var tient = G.EVENTS.filter(function (e) { return e.id === 'eboueurs'; })[0].opts[1], recond = 0, N = 2000;
for (var t0 = 0; t0 < N; t0++) { var m = mandat(t0 + 100); m.rng = rng(t0 * 7919 + 1); m.rng(); m.rng(); var note = G.applyOpt(Object.assign(m, { sat: {}, deficit: 3, debt: 110, seed: 1 }), tient); assert.ok(note, 'ce qui arrive est écrit'); if (m.greve) { recond++; assert.ok(/reconduite/.test(note)); } else { assert.ok(/arrête/.test(note)); assert.strictEqual(m.popBonus, tient.pop + G.GREVE.credit, 'le gain de crédibilité'); } }
assert.ok(recond > N * 0.45 && recond < N * 0.55, 'une chance sur deux : ' + recond);
var gr = { rng: function () { return 0; }, year: 1, popBonus: 0, sat: {}, deficit: 3, debt: 110, seed: 1, eventsDeck: [] };
G.applyOpt(gr, tient); assert.ok(gr.greve && G.greveEnCours(gr) && !G.greveEnCours(gr).due, "annoncée pour l'an prochain"); assert.strictEqual(G.strikeEvent(gr), null);
gr = Object.assign(JSON.parse(JSON.stringify(gr)), { rng: gr.rng }); gr.year = 2;
var se1 = G.strikeEvent(gr); assert.ok(se1 && G.greveEnCours(gr).due, 'à trancher après la sauvegarde');
assert.ok(se1.opts[0].def > 0.02 && se1.opts[1].pop < tient.pop, 'plus coûteuse');
G.applyOpt(gr, se1.opts[1]); gr.year = 3; var se2 = G.strikeEvent(gr); assert.ok(se2.opts[0].def > se1.opts[0].def && se2.opts[1].pop <= se1.opts[1].pop, 'encore plus coûteuse');
var pb = gr.popBonus; assert.ok(/arrête/.test(G.applyOpt(gr, se2.opts[0]))); assert.strictEqual(gr.greve, null); assert.strictEqual(gr.popBonus, pb + G.GREVE.credit); assert.strictEqual(G.greveEnCours(gr), null);
var fin = { rng: function () { return 0; }, year: G.C.years, popBonus: 0, sat: {}, deficit: 3, debt: 110, seed: 1, eventsDeck: [] }; G.applyOpt(fin, tient); assert.ok(!fin.greve, 'pas de reconduction après le mandat');
var une = { rng: function () { return 0; }, year: 1, popBonus: 0, sat: { cad: 50 }, deficit: 3, debt: 110, seed: 1, eventsDeck: [], greve: { id: 'edf', tour: 2, year: 2 } }; assert.strictEqual(G.applyOpt(une, tient), null); assert.strictEqual(une.greve.id, 'edf', 'une seule grève à la fois');

console.log('Scénarios (' + G.EVENTS.length + ' événements, ' + CD.CARDS.length + ' cartes) : OK');

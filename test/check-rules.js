/* Politik — tests de non-régression des règles (v1.5).
   Vérifie que les règles annoncées fonctionnent vraiment : profils des régions, cartes, bonus des partis,
   objectifs secrets, départ égal du mode Simulation, prévision du Meeting = gain réel, ordre de résolution.
   Usage : node test/check-rules.js   (sort avec le code 1 si un test échoue) */
var D = require('../js/data.js');
var E = require('../js/engine.js');

var fails = 0, passes = 0;
function ok(cond, label) {
  if (cond) { passes++; return; }
  fails++; console.log('❌ ' + label);
}
function section(t) { console.log('— ' + t); }
function game(human, opts) { return E.createGame(human, Object.assign({ seed: 7 }, opts || {})); }
function setCubes(g, rid, pid, n) { g.regions[rid].cubes[pid] = n; }
function own(g, pid, rids) { rids.forEach(function (rid) { g.regions[rid].controller = pid; }); }
function clearControl(g) { Object.keys(g.regions).forEach(function (rid) { g.regions[rid].controller = null; }); }

/* ---------- 1. Données ---------- */
section('Données');
var profs = Object.keys(D.PROFILES);
ok(D.REGIONS.filter(function (r) { return profs.indexOf(r.profile) >= 0; }).length === D.REGIONS.length, '13/13 profils de région valides');
ok(D.validate().length === 0, 'D.validate() sans erreur : ' + D.validate().join(' | '));
// la validation doit refuser un profil vide, inconnu ou fait d'espaces
['', '   ', 'montagne'].forEach(function (bad) {
  var r0 = D.REGIONS[0], keep = r0.profile;
  r0.profile = bad;
  ok(D.validate().some(function (e) { return e.indexOf(r0.id) >= 0; }), 'la validation refuse le profil « ' + bad + ' »');
  r0.profile = keep;
});
profs.forEach(function (pf) { ok(D.REGIONS.some(function (r) { return r.profile === pf; }), 'au moins une région ' + pf); });

/* ---------- 2. Cartes territoriales ---------- */
section('Cartes territoriales');
D.PARTIES.forEach(function (p) {
  p.cards.forEach(function (k) {
    var def = D.CARDS[k];
    if (def.target !== 'region') return;
    var g = game(p.id, { mode: 'egal' });
    var legal = D.REGIONS.filter(function (r) { return !E.checkAction(g, p.id, { type: 'card', card: k, region: r.id }); });
    ok(legal.length > 0, 'carte ' + k + ' (' + p.id + ') : au moins une région cible');
    if (def.profiles) legal.forEach(function (r) { ok(def.profiles.indexOf(r.profile) >= 0, 'carte ' + k + ' : cible ' + r.id + ' du bon type'); });
  });
});
(function () {   // la Marche pour le climat rapporte bien ses cubes en ARA (urbaine)
  var g = game('VP', { mode: 'egal' }), before = E.cubes(g, 'ara', 'VP');
  var log = E.resolveActions(g, { VP: [{ type: 'card', card: 'climat', region: 'ara' }] });
  ok(log[0].ok && E.cubes(g, 'ara', 'VP') > before, 'carte climat jouée en Auvergne-Rhône-Alpes : ' + log[0].text);
})();
(function () {   // Appel du 18 juin : +1 dans chaque région historique, et seulement là
  var g = game('UG', { mode: 'egal' }), b = {};
  D.REGIONS.forEach(function (r) { b[r.id] = E.cubes(g, r.id, 'UG'); });
  E.resolveActions(g, { UG: [{ type: 'card', card: 'appel18' }] });
  D.REGIONS.forEach(function (r) { ok(E.cubes(g, r.id, 'UG') - b[r.id] === (r.profile === 'historique' ? 1 : 0), 'appel18 en ' + r.id); });
})();

/* ---------- 3. Bonus et faiblesses des partis liés au territoire ---------- */
section('Bonus des partis');
(function () {
  var g = game('VP', { mode: 'egal', aiParties: ['MN', 'FI', 'SM'] });
  var urb = D.REGIONS.filter(function (r) { return r.profile === 'urbaine'; })[0].id;
  var rur = D.REGIONS.filter(function (r) { return r.profile === 'rurale'; })[0].id;
  var ind = D.REGIONS.filter(function (r) { return r.profile === 'industrielle'; })[0].id;
  E.player(g, 'VP').cred.ecologie = 2; E.player(g, 'MN').cred.ecologie = 2;
  ok(E.mediaCubes(g, 'VP', urb, 'ecologie') === E.mediaCubes(g, 'VP', rur, 'ecologie') + (E.impact(g, 'VP', urb, 'ecologie') === E.impact(g, 'VP', rur, 'ecologie') ? 1 : E.mediaCubes(g, 'VP', urb, 'ecologie') - E.mediaCubes(g, 'VP', rur, 'ecologie')), 'Télé VP : +1 en région urbaine');
  ok(E.mediaCubes(g, 'VP', urb, 'ecologie') >= 2, 'Télé VP en région urbaine : bonus appliqué');
  ok(E.mediaCubes(g, 'MN', ind, 'ecologie') >= 2, 'Télé MN en région industrielle : bonus appliqué');
  var c1 = E.actionCost(g, 'FI', { type: 'terrain', region: rur, theme: 'emploi' }).money, c2 = E.actionCost(g, 'FI', { type: 'terrain', region: urb, theme: 'emploi' }).money;
  ok(c1 === c2 + 1, 'FI : Meeting plus cher en région rurale (' + c1 + ' € contre ' + c2 + ' €)');
})();

/* ---------- 4. Objectifs secrets ---------- */
section('Objectifs secrets');
var built = {
  ouest: ['bre', 'pdl', 'nor'], territoires: ['naq', 'occ', 'pdl'], industrie: ['hdf', 'ges'], patrimoine: ['nor', 'bfc', 'cvl'],
  paris: ['idf'], terrains: ['idf', 'naq', 'hdf', 'nor'], corse: ['cor']
};
D.OBJECTIVES.forEach(function (o) {
  var g = game('VP', { mode: 'egal' });
  clearControl(g);
  ok(!E.objectiveMet(g, 'VP', o.id), 'objectif ' + o.id + ' : pas réussi sans rien contrôler');
  if (o.id === 'debat') { E.player(g, 'VP').debateWins = 2; }
  else if (built[o.id]) own(g, 'VP', built[o.id]);
  else ok(false, 'objectif ' + o.id + ' sans état de test');
  ok(E.objectiveMet(g, 'VP', o.id), 'objectif ' + o.id + ' : réussi sur un état construit');
  var pr = E.objectiveProgress(g, 'VP', o.id); ok(pr.done === pr.need, 'objectif ' + o.id + ' : progression ' + pr.done + '/' + pr.need);
});
// aucun objectif ne doit être acquis dès le départ (200 parties, deux modes)
['egal', 'reel'].forEach(function (mode) {
  var trivial = 0;
  for (var s = 0; s < 200; s++) {
    var g = E.createGame('VP', { seed: s, mode: mode });
    g.players.forEach(function (p) { if (p.objective !== 'corse' && p.objective !== 'paris' && E.objectiveMet(g, p.id, p.objective)) trivial++; });
  }
  ok(trivial === 0, 'mode ' + mode + ' : aucun objectif multi-régions réussi dès la création (' + trivial + ')');
});
(function () {   // le bonus d'objectif : seulement au scrutin, pas dans le sondage
  var g = game('VP', { mode: 'egal' });
  var pid = 'VP', o = E.player(g, pid).objective;
  if (o === 'debat') E.player(g, pid).debateWins = 2; else own(g, pid, built[o]);
  var poll = E.poll(g).filter(function (x) { return x.pid === pid; })[0].pct;
  var vote = E.election(g).first.filter(function (x) { return x.pid === pid; })[0].pct;
  ok(vote > poll, 'objectif réussi : plus de voix au scrutin (' + (100 * vote).toFixed(1) + ' %) qu\'au sondage (' + (100 * poll).toFixed(1) + ' %)');
})();

/* ---------- 5. Mode Simulation : départ strictement égal (1/N) ---------- */
section('Mode Simulation');
[['VP', ['FI', 'SM', 'MN']], ['EM', ['UG', 'FI', 'MN']], [null, ['FI', 'SM', 'VP', 'MN']]].forEach(function (c) {
  var g = E.createGame(c[0], { seed: 3, mode: 'egal', aiParties: c[1] }), n = g.players.length;
  E.poll(g).forEach(function (x) { ok(Math.abs(x.pct - 1 / n) < 1e-9, 'Simulation ' + g.players.map(function (p) { return p.id; }).join('/') + ' : ' + x.pid + ' = 1/' + n + ' (' + (100 * x.pct).toFixed(2) + ' %)'); });
});

/* ---------- 6. Prévision du Meeting = gain réel (y compris au seuil de crédibilité) ---------- */
section('Prévision du Meeting');
(function () {
  for (var talk = 0; talk < D.RULES.credTalk; talk++) {
    var g = game('VP', { mode: 'egal', aiParties: ['FI', 'SM', 'MN'] });
    var pl = E.player(g, 'VP'); pl.cred.emploi = 0; pl.talk.emploi = talk; pl.money = 20; pl.forme = 4;
    var rid = 'hdf', before = E.cubes(g, rid, 'VP'), bd = E.terrainBreakdown(g, 'VP', rid, 'emploi');
    var lg = E.resolveActions(g, { VP: [{ type: 'terrain', region: rid, theme: 'emploi' }] });
    var poached = /récupère 1 électeur/.test(lg[0].text) ? 1 : 0;   // électeur pris à un parti voisin : en plus, annoncé à part
    ok(E.cubes(g, rid, 'VP') - before - poached === Math.min(bd.total, D.RULES.maxCubes - before), 'Meeting annoncé +' + bd.total + ' = gain réel (compteur de thème ' + talk + '/' + D.RULES.credTalk + ')');
  }
  var g2 = game('VP', { mode: 'egal' });
  setCubes(g2, 'idf', 'VP', 9);
  var bd2 = E.terrainBreakdown(g2, 'VP', 'idf', 'pouvoir'), sum = 0;
  bd2.parts.forEach(function (x) { sum += x.n; });
  ok(bd2.total === Math.max(1, sum), 'la décomposition du Meeting additionne ses parts');
  E.player(g2, 'VP').money = 20; E.resolveActions(g2, { VP: [{ type: 'terrain', region: 'idf', theme: 'pouvoir' }] });
  ok(E.cubes(g2, 'idf', 'VP') === 10, 'plafond de 10 cubes respecté');
})();
(function () {   // prévoir ne consomme pas le hasard
  var a = game('VP'), b = game('VP');
  for (var i = 0; i < 50; i++) { E.terrainBreakdown(a, 'VP', 'idf', 'emploi'); E.mediaRegions(a, 'VP', 'idf', 'emploi'); E.mobilizeGain(a, 'VP', 'idf'); }
  ok(a.rng() === b.rng(), 'les prévisions ne touchent pas au générateur aléatoire');
})();

/* ---------- 7. Ordre de résolution ---------- */
section('Ordre de résolution');
(function () {
  var g = game('VP', { aiParties: ['FI', 'SM', 'MN'] });
  var seen = {};
  for (var t = 1; t <= 4; t++) { g.turn = t; seen[E.turnOrder(g)[0]] = 1; }
  ok(Object.keys(seen).length === 4, 'le premier à jouer change à chaque tour');
  g.turn = 2;
  var order = E.turnOrder(g), plans = {};
  g.players.forEach(function (p) { p.money = 20; plans[p.id] = [{ type: 'fonds' }, { type: 'fonds' }]; });
  var log = E.resolveActions(g, plans);
  ok(log.map(function (l) { return l.pid; }).join() === order.concat(order).join(), 'résolution : action 1 de chacun dans l\'ordre annoncé, puis action 2');
})();

console.log('\n' + passes + ' vérifications réussies, ' + fails + ' en échec.');
process.exit(fails ? 1 : 0);

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

/* ---------- 8. v1.6 : plus de partis, pas d'alliance avant le 1er tour ---------- */
section('Partis en lice et débats');
(function () {
  var g = E.createGame('VP', { seed: 11 });
  ok(g.players.length === D.PARTIES.length, 'partie standard : les ' + D.PARTIES.length + ' partis en lice (' + g.players.length + ')');
  var g6 = E.createGame('VP', { seed: 11, mode: 'egal' });
  var N = D.PARTIES.length;
  E.poll(g6).forEach(function (x) { ok(Math.abs(x.pct - 1 / N) < 1e-9, 'Simulation à ' + N + ' : ' + x.pid + ' = 1/' + N); });
  ok(E.checkAction(g, 'VP', { type: 'alliance', target: 'SM' }) !== null, 'alliance refusée pendant la campagne du 1er tour');
  ok(E.checkAction(g, 'VP', { type: 'rupture' }) !== null, 'rupture refusée pendant la campagne du 1er tour');
  [4, 5, 6, 7, 12].forEach(function (n) {
    var ids = D.PARTIES.map(function (p) { return p.id; }).slice(0, n);
    var gd = E.createGame(null, { seed: n, aiParties: ids }); gd.turn = 3;
    var deb = E.setupDebate(gd), per = {}, pairs = {};
    deb.duels.forEach(function (d) { per[d.a] = (per[d.a] || 0) + 1; per[d.b] = (per[d.b] || 0) + 1; var k = [d.a, d.b].sort().join(); ok(!pairs[k], 'débat à ' + n + ' : pas de duel en double'); pairs[k] = 1; });
    ids.forEach(function (id) { ok((per[id] || 0) <= 3 && (per[id] || 0) >= Math.min(3, n - 1) - (n % 2), 'débat à ' + n + ' : ' + id + ' fait ' + (per[id] || 0) + ' duels'); });
  });
})();
(function () {   // une partie entière jouée par l'ordinateur : aucune alliance programmée
  var AI = require('../js/ai.js'), g = E.createGame(null, { seed: 21, aiParties: D.PARTIES.map(function (p) { return p.id; }) }), seen = 0;
  while (g.phase !== 'between' && !g.over) {
    E.startTurn(g); g.affairs.slice().forEach(function (a) { E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)); });
    if (g.dilemma) E.resolveDilemma(g, g.dilemma.pid, AI.chooseDilemma(g, g.dilemma.pid));
    var plans = {}; g.players.forEach(function (p) { plans[p.id] = AI.plan(g, p.id); p.money = Math.max(p.money, 0); });
    g.players.forEach(function (p) { plans[p.id].forEach(function (a) { if (a.type === 'alliance' || a.type === 'rupture') seen++; }); });
    E.resolveActions(g, plans);
    if (E.isDebateTurn(g)) { var deb = E.setupDebate(g); E.resolveDebate(g, {}, deb.duels.map(function (d) { return { ra: 'chiffres', rb: 'emotion' }; })); }
    E.endTurn(g);
  }
  ok(seen === 0, 'l\'ordinateur ne programme aucune alliance pendant la campagne (' + seen + ')');
})();

/* ---------- 8 bis. v1.7 : les 12 partis et leurs règles ---------- */
section('12 partis');
(function () {
  ok(D.PARTIES.length === 12, '12 partis');
  D.PARTIES.forEach(function (p) {
    ok(D.TEMPERS[p.id], p.id + ' : tempérament de débat');
    ok(p.programme.length === 5 && p.programme.every(function (m) { return E.MEAS[m]; }), p.id + ' : programme de 5 mesures valides');
    ok((p.financing || []).every(function (m) { return E.MEAS[m]; }), p.id + ' : financements valides');
    ok(p.cards.every(function (k) { return D.CARDS[k]; }), p.id + ' : cartes valides');
    ok(D.REGIONS.every(function (r) { return typeof r.start[p.id] === 'number' && typeof r.start22[p.id] === 'number'; }), p.id + ' : scores de départ dans les 13 régions');
  });
  var ids = D.PARTIES.map(function (p) { return p.id; });
  ids.forEach(function (a) { ids.forEach(function (b) { var d = E.dist(a, b); ok(a === b ? d === 0 : d >= 1 && d <= 5, 'distance ' + a + '-' + b + ' entre 1 et 5'); }); });
  var g = E.createGame('LO', { mode: 'egal' }), rur = 'naq', ind = 'hdf';
  ok(E.actionCost(g, 'LO', { type: 'militants', region: rur }).money === 2, 'LO : militants à 2 €');
  ok(E.actionCost(g, 'LO', { type: 'medias', region: rur, theme: 'emploi' }).money === 4 && E.actionCost(g, 'DL', { type: 'medias', region: rur, theme: 'emploi' }).money === 4, 'LO et DL : Télé à 4 €');
  ok(E.actionCost(g, 'HZ', { type: 'reforme', region: rur }).infl === 3, 'HZ : Promesse à 3 ★');
  ok(E.minControl('HZ') === 4, 'HZ : 4 cubes pour contrôler');
  ok(E.fundsGain('PC').money === 2 && E.fundsGain('MD').money === 2, 'PC et MD : Collecte à 2 €');
  ok(E.mobilizeGain(g, 'PC', ind).n === E.mobilizeGain(g, 'SM', ind).n + 1 || E.mobilizeGain(g, 'PC', ind).n === 4, 'PC : Mobiliser +1 en région industrielle');
  ok(E.terrainCubes(g, 'DL', rur, 'emploi') === E.terrainCubes(g, 'UG', rur, 'emploi') - (E.cred(g, 'UG', 'emploi') - E.cred(g, 'DL', 'emploi') ? 0 : 0) || E.terrainBreakdown(g, 'DL', rur, 'emploi').parts.some(function (x) { return x.label === 'France des clochers'; }), 'DL : +1 en Meeting rural');
  var ge = E.createGame('VP', { mode: 'egal', seed: 2 }); ge.turn = 8; ge.round1 = { first: ge.players.map(function (p) { return { pid: p.id, votes: 1, pct: 1 / 12 }; }), finalists: ['SM', 'UG'] }; ge.between = { deals: {}, tried: {} };
  ok(E.dealChance(ge, 'SM', 'MD', E.PARTY.MD.programme[1]) > E.dealChance(ge, 'SM', 'VP', E.PARTY.VP.programme[1]), 'MD : accords plus faciles');
  ok(E.dealChance(ge, 'UG', 'RQ', E.PARTY.RQ.programme[1]) < (D.RULES.round2.accept[E.dist('UG', 'RQ')]), 'RQ : accords plus difficiles');
})();

/* ---------- 9. v1.6 : l'entre-deux-tours ---------- */
section('Entre-deux-tours');
function toBetween(human, seed, humanLast) {
  var g = E.createGame(human, { seed: seed || 5, mode: 'egal' });
  // un 1er tour net : A et B devant, les autres derrière
  var order = g.players.map(function (p) { return p.id; });
  if (humanLast) order.push(order.shift());
  D.REGIONS.forEach(function (r) { order.forEach(function (pid, i) { g.regions[r.id].cubes[pid] = Math.max(1, 6 - i); }); });
  g.turn = D.RULES.maxTurns; var et = E.endTurn(g);
  return { g: g, et: et };
}
(function () {
  var t = toBetween('VP'), g = t.g, b = g.between;
  ok(t.et.between && g.phase === 'between' && !g.over && !g.result, 'pas de majorité : l\'entre-deux-tours s\'ouvre, rien n\'est encore voté');
  var finals = g.round1.finalists.join();
  D.REGIONS.forEach(function (r) { g.regions[r.id].cubes[b.elim[0]] = 10; });
  ok(g.round1.finalists.join() === finals && b.a + ',' + b.b === finals, 'les qualifiés sont figés une fois le 1er tour voté');
  ok(b.elim.length === g.players.length - 2, 'tous les autres partis sont éliminés et peuvent négocier');
  // un accord accepté (tirage forcé) : consigne, concession, report en hausse
  var f = b.a, e = b.elim.filter(function (x) { return !E.player(g, x).human; })[0];
  var before = E.transfersFor(g, e, false), mid = E.concessionsFor(g, f, e)[0];
  var rng = g.rng; g.rng = function () { return 0; };
  var r = E.betweenAct(g, f, { type: 'negocier', target: e, measure: mid });
  g.rng = rng;
  ok(r.outcome === 'accept' && b.deals[e] && b.deals[e].measure === mid, 'offre avec concession acceptée');
  ok(E.player(g, f).deals.some(function (d) { return d.with === e && d.measure === mid; }), 'la concession est gardée pour le mandat');
  var after = E.transfersFor(g, e, false);
  ok(after.toA > before.toA, 'l\'accord augmente les reports vers ' + f + ' (' + Math.round(100 * before.toA) + ' → ' + Math.round(100 * after.toA) + ' %)');
  ok(after.toA < 1 && after.toA + after.toB + after.blank + after.abst > 0.999 && after.toA + after.toB + after.blank + after.abst < 1.001, 'un report n\'est jamais intégral et totalise 100 %');
  ok(E.betweenError(g, b.b, { type: 'negocier', target: e, measure: E.concessionsFor(g, b.b, e)[0] }) !== null, 'un parti déjà engagé refuse les autres offres');
  ok(!E.setConsigne(g, e, 'B'), 'un accord fixe la consigne');
  // un refus (tirage forcé)
  var e2 = b.elim.filter(function (x) { return x !== e && !E.player(g, x).human; })[0];
  g.rng = function () { return 0.99; };
  var r2 = E.betweenAct(g, b.b, { type: 'negocier', target: e2, measure: E.concessionsFor(g, b.b, e2)[0] });
  g.rng = rng;
  ok(r2.outcome === 'refuse' && !b.deals[e2], 'un parti peut refuser');
  ok(b.left[f] === D.RULES.round2.actions - 1 && b.left[b.b] === D.RULES.round2.actions - 1, 'chaque action coûte 1 action sur ' + D.RULES.round2.actions);
  // estimation sans effet, puis clôture
  var snap = JSON.stringify(b.consignes), proj = E.projectSecond(g);
  ok(JSON.stringify(b.consignes) === snap && !g.result, 'l\'estimation ne change rien');
  ok(Math.abs(proj.pctA + proj.pctB - 1) < 1e-9, 'estimation : les deux finalistes font 100 % des exprimés');
  var res = E.closeBetween(g);
  ok(g.over && res.second && (res.winner === b.a || res.winner === b.b), 'le second tour est voté à la clôture seulement');
  ok(b.elim.every(function (x) { return b.consignes[x]; }), 'chaque éliminé a donné sa consigne');
  var st = res.second.stats; ok(st.votants <= st.ins && st.exprimes > 0 && st.blancs >= 0, 'participation et blancs cohérents (' + (100 * st.participation).toFixed(1) + ' %)');
  ok(E.betweenAct(g, f, { type: 'mobiliser' }).ok === false, 'plus d\'action après la clôture');
})();
(function () {   // le joueur éliminé : il reçoit une offre, peut la refuser ou l'accepter, et choisit sa consigne
  var t = toBetween('MN', 9, true), g = t.g, b = g.between;
  ok(b.elim.indexOf('MN') >= 0, 'test : le joueur (MN) est éliminé');
  var f = b.a, mid = E.concessionsFor(g, f, 'MN')[0];
  var r = E.betweenAct(g, f, { type: 'negocier', target: 'MN', measure: mid });
  ok(r.outcome === 'pending' && b.offers.length === 1, 'l\'offre au joueur éliminé attend sa réponse');
  ok(E.answerBetweenOffer(g, f, 'accept').outcome === 'accept' && b.deals.MN, 'le joueur éliminé accepte : accord conclu');
  ok(!E.setConsigne(g, 'MN', 'B'), 'sa consigne suit alors l\'accord');
})();
(function () {   // victoire directe : pas d'entre-deux-tours
  var g = E.createGame('VP', { seed: 3, mode: 'egal' });
  D.REGIONS.forEach(function (r) { g.players.forEach(function (p) { g.regions[r.id].cubes[p.id] = p.id === 'VP' ? 10 : 1; }); g.regions[r.id].controller = 'VP'; });
  g.turn = D.RULES.maxTurns; var et = E.endTurn(g);
  ok(!et.between && g.over && g.result.direct && g.winner === 'VP', 'majorité absolue au 1er tour : élu, sans négociation');
})();

console.log('\n' + passes + ' vérifications réussies, ' + fails + ' en échec.');
process.exit(fails ? 1 : 0);

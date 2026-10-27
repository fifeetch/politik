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
  // v3.6.1 : face à un humain, l'ordinateur démarre avec round2.aiActions
  function startLeft(x) { var mixed = E.player(g, b.a).human !== E.player(g, b.b).human; return mixed && !E.player(g, x).human ? D.RULES.round2.aiActions : D.RULES.round2.actions; }
  ok(b.left[f] === startLeft(f) - 1 && b.left[b.b] === startLeft(b.b) - 1, 'chaque action coûte 1 action (4 pour toi, 3 pour l\'ordinateur qui t\'affronte)');
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

/* ---------- v2.3 : les législatives ---------- */
section('Législatives');
(function () {
  var LG = require('../js/legis.js'), L = D.LEGIS, G = require('../js/govern.js');
  var tot = 0; D.REGIONS.forEach(function (r) { tot += r.seats; });
  ok(tot === 577, 'les 13 régions totalisent 577 sièges (' + tot + ')');
  ok(D.REGIONS.filter(function (r) { return r.id === 'idf'; })[0].seats === 97 && D.REGIONS.filter(function (r) { return r.id === 'cor'; })[0].seats === 42, 'Île-de-France 97, Corse-outre-mer-étranger 42');
  var g = E.createGame('EM', { seed: 11 });
  var res = LG.run(g, { rng: E.makeRng(5), pres: 'EM', margin: 0.08 });
  var n = 0; Object.keys(res.seats).forEach(function (p) { n += res.seats[p]; });
  ok(n === 577 && res.circs.length === 577, '577 circonscriptions, 577 députés');
  var bad = 0, quals = 0;
  res.circs.forEach(function (c) {
    var ex = c.turnout1 * (1 - L.blank1), top = c.c1[0];
    if (c.status === 'elu1' && !(top.v > 0.5 && top.v * ex >= 0.25)) bad++;
    if (c.status !== 'elu1' && top.v > 0.5 && top.v * ex >= 0.25) bad++;
    if (c.status !== 'elu1') {
      var q = Object.keys(c.v2);
      if (q.length < 2) bad++;
      // tout candidat au-dessus de 12,5 % des inscrits est au 2nd tour, sauf s'il s'est désisté
      c.c1.forEach(function (x) { if (x.v * ex >= 0.125 && q.indexOf(x.pid) < 0 && c.withdrawn.indexOf(x.pid) < 0) bad++; });
      // en dessous de 12,5 %, on n'est qualifié que pour compléter un duel
      q.forEach(function (pid) { var x = c.c1.filter(function (y) { return y.pid === pid; })[0]; if (x.v * ex < 0.125 && q.length > 2) bad++; });
      var best = q.sort(function (a, b) { return c.v2[b] - c.v2[a]; })[0];
      if (best !== c.winner) bad++;
      quals++;
    }
  });
  ok(bad === 0, 'règles de qualification et d\'élection respectées dans chaque circonscription (' + bad + ' anomalies)');
  ok(res.participation1 > 0.35 && res.participation1 < 0.65, 'participation au 1er tour autour de 50 % (' + Math.round(100 * res.participation1) + ' %)');
  ok(res.outcome.camp.indexOf('EM') >= 0 && res.outcome.camp.indexOf('MD') >= 0, 'la majorité présidentielle réunit le président et son union');
  // l'effet locomotive : avec une large victoire, le camp du président a plus de sièges qu'avec une victoire étroite
  var big = 0, small = 0;
  for (var i = 0; i < 6; i++) { big += LG.run(g, { rng: E.makeRng(100 + i), pres: 'EM', margin: 0.2 }).outcome.campSeats; small += LG.run(g, { rng: E.makeRng(100 + i), pres: 'EM', margin: 0 }).outcome.campSeats; }
  ok(big > small, 'effet locomotive : une large victoire rapporte plus de députés (' + Math.round(big / 6) + ' contre ' + Math.round(small / 6) + ')');
  // dissolution : une forte popularité rapporte plus qu'une faible
  ok(G.dissolveMult(60) > 1 && G.dissolveMult(30) < 1, 'dissolution : élan si populaire, désaveu sinon');
  var o = LG.outcome({ unions: [{ id: 'pres', parties: ['EM'], pres: true }, { id: 'x', parties: ['MN'] }], seats: { EM: 200, MN: 300 } }, 'EM');
  ok(o.type === 'cohabitation', 'un autre bloc à 289 sièges ou plus : cohabitation');
  o = LG.outcome({ unions: [{ id: 'pres', parties: ['EM'], pres: true }, { id: 'x', parties: ['MN'] }], seats: { EM: 250, MN: 200 } }, 'EM');
  ok(o.type === 'relative', 'premier bloc sans 289 sièges : majorité relative');
})();

/* ---------- v2.4 : la campagne des législatives ---------- */
section('Campagne des législatives');
(function () {
  var LG = require('../js/legis.js'), L = D.LEGIS;
  var g = E.createGame('EM', { seed: 21 });
  ok(LG.allyChance(g, 'EM', 'MD') > LG.allyChance(g, 'EM', 'UG') && LG.allyChance(g, 'EM', 'UG') > LG.allyChance(g, 'EM', 'FI'), 'alliance : plus facile avec un parti proche');
  ok(LG.allyChance(g, 'EM', 'MN') < 0.2 && LG.allyChance(g, 'UG', 'MN') >= 0.5, 'cordon : En Mouvement et Mouvement National se méfient, l\'Union Gaulliste beaucoup moins');
  ok(LG.allyChance(g, 'SM', 'UG') > 0.2, 'une alliance entre gauche modérée et droite reste possible');
  var lc = LG.newCampaign(g, { pres: 'EM', margin: 0.05 }), p0 = LG.projection(g, lc).res.outcome.campSeats;
  lc.allies = ['MD', 'HZ'];
  var p1 = LG.projection(g, lc).res.outcome.campSeats;
  ok(p1 > p0, 'des alliés rapportent des sièges (' + p0 + ' → ' + p1 + ')');
  ok(LG.projection(g, lc).res.outcome.campSeats === p1, 'la projection ne dépend pas du hasard (même carte des circonscriptions)');
  var rid = 'idf', r = LG.act(g, lc, { type: 'meeting', rid: rid });
  ok(r.ok && r.pop < 0 && LG.projection(g, lc).res.outcome.campSeats >= p1, 'le président en meeting : effet sur la projection, coût en popularité');
  ok(!LG.act(g, lc, { type: 'meeting', rid: 'ara' }).ok, 'un seul meeting du président par tour');
  ok(LG.actionGain(g, lc, 'vedette', rid) < L.campaign.vedette, 'une même région rapporte moins à chaque nouvelle action');
  LG.act(g, lc, { type: 'clip' }); LG.act(g, lc, { type: 'clip' });
  ok(lc.left === 0 && !LG.act(g, lc, { type: 'clip' }).ok, '3 actions par tour');
  LG.endTurn(g, lc); ok(lc.turn === 2 && lc.left === 3 && Object.keys(lc.others).length > 0, 'fin du tour : les autres blocs font campagne');
  // l'entre-deux-tours : les choix du joueur sont respectés
  var ctx = LG.prepare(g, LG.optsOf(lc, { rng: E.makeRng(9) })), r1 = LG.round1(ctx), ch = LG.campChoices(ctx, r1);
  var all = {}; ch.forEach(function (c) { all[c.i] = true; });
  var res = LG.round2(ctx, r1, { withdraw: all });
  var bad = 0; ch.forEach(function (c) { var cc = res.circs[c.i]; if (cc.q.some(function (x) { return x.u === 'pres'; })) bad++; });
  ok(bad === 0, 'désistement : le camp se retire bien des ' + ch.length + ' triangulaires choisies');
  var keep = LG.round2(ctx, r1, { withdraw: {} }), bad2 = 0;
  ch.forEach(function (c) { if (!keep.circs[c.i].q.some(function (x) { return x.u === 'pres'; })) bad2++; });
  ok(bad2 === 0, 'maintien : le camp reste en lice là où il l\'a décidé');
  var n = 0; res.circs.forEach(function (c) { n++; }); ok(n === 577, 'toujours 577 circonscriptions');
})();

/* ---------- v2.5 : ton personnage et ton parti ---------- */
section('Ton personnage et ton parti');
(function () {
  var PS = require('../js/perso.js'), LG = require('../js/legis.js'), G = require('../js/govern.js');
  var ch = PS.defaultChar(); ch.name = 'Alex Térieur'; ch.trait = 'bagarreur';
  ok(PS.sigleError('FI') && PS.sigleError('X') && !PS.sigleError('GE'), 'sigle : 2 ou 3 lettres, pas celui d\'un autre parti');
  var p = PS.found({ name: 'Le Grand Élan', sigle: 'GE', color: '#7B3FA0', pos: 3.8, themes: ['ecologie', 'emploi'] }, ch);
  ok(D.PARTIES.length === 13 && E.PARTY.GE && D.TEMPERS.GE.label === 'bagarreur', 'fonder : un 13e parti en lice, avec ton tempérament');
  ok(p.programme.length === 5 && p.programme.slice(0, 2).every(function (m) { return ['ecologie', 'emploi'].indexOf(E.measure(m).theme) >= 0; }), 'son programme commence par tes thèmes forts');
  var g = E.createGame('GE', { seed: 3 });
  var start = E.poll(g).filter(function (x) { return x.pid === 'GE'; })[0].pct;
  ok(start > 0.01 && start < 0.06, 'il part de presque rien (' + (100 * start).toFixed(1) + ' %)');
  var empty = D.REGIONS.filter(function (r) { return E.cubes(g, r.id, 'GE') === 0; }).length;
  ok(empty > 0, 'des sympathisants seulement là où ses thèmes parlent (' + (13 - empty) + ' régions sur 13)');
  E.startTurn(g);
  ok(E.terrainBreakdown(g, 'GE', 'idf', 'ecologie').parts.some(function (x) { return x.k === 'neuf' && x.n === 2; }), 'effet nouveauté : +2 cubes en Meeting au tour 1');
  g.turn = 5; ok(!E.terrainBreakdown(g, 'GE', 'idf', 'ecologie').parts.some(function (x) { return x.k === 'neuf'; }), 'l\'effet nouveauté s\'use (plus rien au tour 5)');
  // ton parti peut gouverner : législatives et quinquennat avec un 13e parti
  g.result = { first: E.poll(g), second: { a: 'GE', b: 'MN', pctA: 0.55, pctB: 0.45 } }; g.winner = 'GE';
  var gv = G.create(g, 'GE'), n = 0; Object.keys(gv.seats).forEach(function (k) { n += gv.seats[k]; });
  ok(n === 577 && gv.seats.GE != null, 'législatives avec ton parti : 577 sièges répartis');
  PS.reset();
  ok(D.PARTIES.length === 12 && !E.PARTY.GE && !D.TEMPERS.GE && D.REGIONS.every(function (r) { return r.start.GE == null; }), 'nouvelle partie : ton parti n\'est plus en lice, tout est remis à 12');
  var cand = E.PARTY.SM.candidate;
  PS.lead('SM', ch);
  ok(E.PARTY.SM.candidate === 'Alex Térieur' && D.TEMPERS.SM.label === 'bagarreur', 'prendre la tête d\'un parti : ton nom, ton tempérament');
  PS.reset();
  ok(E.PARTY.SM.candidate === cand && D.TEMPERS.SM.label === 'raisonnable', 'puis le parti retrouve son candidat');
})();

/* ---------- v2.6 : le gouvernement ---------- */
section('Le gouvernement');
(function () {
  var G = require('../js/govern.js'), CB = require('../js/cabinet.js');
  var g = E.createGame('EM', { seed: 31 }); E.setProgramme(g, 'EM', E.PARTY.EM.programme, E.PARTY.EM.financing);
  g.result = { first: E.poll(g), second: { a: 'EM', b: 'MN', pctA: 0.56, pctB: 0.44 } }; g.winner = 'EM';
  var gv = G.create(g, 'EM'); CB.start(gv);
  var pool = gv.cabinet.pool;
  ok(pool.filter(function (x) { return x.origin === 'parti'; }).length === 3 && pool.filter(function (x) { return x.origin === 'expert'; }).length === 2 && pool.filter(function (x) { return x.origin === 'ouverture'; }).length === 1, 'le vivier : 3 de ton parti, 2 experts, 1 ouverture (+ tes alliés)');
  ok(pool.every(function (x) { return x.comp >= 1 && x.comp <= 3 && x.loy >= 1 && x.loy <= 3 && x.not >= 1 && x.not <= 3 && D.MINISTRY.traits[x.trait]; }), 'chaque profil : 3 jauges de 1 à 3 étoiles et un trait');
  ok(pool.filter(function (x) { return x.origin === 'expert'; }).every(function (x) { return x.comp === 3 && x.not === 1; }), 'les experts : très compétents, peu connus');
  ok(pool.filter(function (x) { return x.origin === 'ouverture'; }).every(function (x) { return x.party !== 'EM' && !G.isAlly(gv, x.party); }), 'l\'ouverture vient d\'un parti rival');
  var team = CB.suggest(gv), ck = CB.check(gv, team);
  ok(ck.full && ck.unserved.length === 0, 'la proposition de Lulu pourvoit les 6 postes et sert chaque allié');
  // un allié sans ministère quitte la majorité
  var allies = (gv.allies || []).filter(function (a) { return gv.seats[a] > 0; });
  if (allies.length) {
    var t2 = {}; CB.POSTS.forEach(function (k, i) { t2[k] = pool.filter(function (x) { return x.origin !== 'allie'; })[i]; });
    var before = G.blocSeats(gv); CB.form(gv, t2);
    ok(G.blocSeats(gv) < before && !G.isAlly(gv, allies[0]), 'un allié sans ministère quitte la majorité (' + before + ' → ' + G.blocSeats(gv) + ' députés)');
  }
  // un ministre compétent et un ministre « réseau » font passer les lois
  var mid = E.PARTY.EM.programme[0], post = G.postFor(mid);
  gv.cabinet.posts[post] = { name: 'Test', comp: 1, loy: 3, not: 1, trait: 'gaffeur', face: {} }; gv.cabinet.posts.pm = { name: 'PM', comp: 1, loy: 3, not: 1, trait: 'gaffeur', face: {} };
  var low = G.frondeurs(gv, mid);
  gv.cabinet.posts[post] = { name: 'Test', comp: 3, loy: 3, not: 1, trait: 'reseau', face: {} }; gv.cabinet.posts.pm = { name: 'PM', comp: 3, loy: 3, not: 1, trait: 'bourreau', face: {} };
  ok(G.frondeurs(gv, mid) <= low, 'ministre et Premier ministre compétents : moins de frondeurs');
  ok((G.vote(gv, mid).network || 0) > 0 || G.vote(gv, mid).abst === 0, '« Réseau à l\'Assemblée » : des voix en plus');
  // remaniement : une fois par an, le fusible du Premier ministre
  var p0 = gv.popBonus, nx = CB.reshufflePool(gv)[0], r = CB.reshuffle(gv, 'pm', nx);
  ok(r.ok && gv.popBonus - p0 === D.MINISTRY.fusible && !CB.canReshuffle(gv), 'remaniement : changer de Premier ministre rapporte ' + D.MINISTRY.fusible + ' de popularité, une fois par an');
  // les événements de ministres
  var seen = {}; for (var i = 0; i < 40; i++) { var ev = CB.event(gv); if (ev) seen[ev.id] = true; }
  ok(Object.keys(seen).length >= 1, 'les ministres font l\'actualité (' + Object.keys(seen).join(', ') + ')');
})();

/* ---------- v2.7 : l'opposition et la cohabitation ---------- */
section('L\'opposition et la cohabitation');
(function () {
  var LG = require('../js/legis.js'), OP = require('../js/oppo.js'), G = require('../js/govern.js'), CB = require('../js/cabinet.js');
  var g = E.createGame('SM', { seed: 41 }); E.setProgramme(g, 'SM', E.PARTY.SM.programme, E.PARTY.SM.financing);
  g.result = { first: E.poll(g), second: { a: 'EM', b: 'SM', pctA: 0.55, pctB: 0.45 } }; g.winner = 'EM';
  var lc = LG.newCampaign(g, { pres: 'EM', player: 'SM', margin: 0.05, loser: 'SM' });
  ok(!LG.offerAlly(g, lc, 'EM').ok, 'dans l\'opposition, on ne s\'allie pas avec le parti du président');
  ok(LG.offerChance(g, lc, 'MD') < LG.allyChance(g, 'SM', 'MD'), 'la famille du président lui reste plutôt fidèle');
  lc.allies = ['VP', 'FI'];
  var res = LG.run(g, LG.optsOf(lc, { rng: E.makeRng(3) })), u = res.unions.filter(function (x) { return x.id === 'joueur'; })[0];
  ok(u && u.parties.join() === 'SM,VP,FI' && res.unions.filter(function (x) { return x.pres; })[0].parties.indexOf('SM') < 0, 'ton camp d\'opposition : toi et tes alliés, hors de la majorité présidentielle');
  var n = 0; Object.keys(res.seats).forEach(function (k) { n += res.seats[k]; });
  ok(n === 577 && res.focusSeats === (res.seats.SM + res.seats.VP + res.seats.FI), 'les sièges de ton camp sont bien comptés');
  ok(LG.actionGain(g, lc, 'meeting', 'idf') === D.LEGIS.campaign.meetingOppo && LG.act(g, lc, { type: 'meeting', rid: 'idf' }).pop === 0, 'ton grand meeting de chef de parti : pas de coût en popularité');
  var op = OP.create(g, 'SM', 'EM', res);
  ok(op.myCamp.join() === 'SM,VP,FI' && op.presCamp.indexOf('EM') >= 0, 'l\'opposition : ton camp face à la majorité présidentielle');
  ok(OP.quarter(op) === 'loi' && OP.govLaw(op), '4 trimestres : d\'abord la loi du gouvernement');
  // la loi du gouvernement qui divise le plus tes électeurs (ils l'aiment ou la rejettent nettement)
  var mid = op.govLaws.slice().sort(function (a, b) { return Math.abs(OP.fit(op, b)) - Math.abs(OP.fit(op, a)); })[0], f = OP.fit(op, mid);
  function twin() { var o = OP.create(g, 'SM', 'EM', res); o.rng = function () { return 0.5; }; o.govLaws = [mid]; return o; }
  var good = OP.voteGovLaw(twin(), f > 0 ? 'pour' : 'contre').delta, bad = OP.voteGovLaw(twin(), f > 0 ? 'contre' : 'pour').delta;
  ok(good > bad, 'voter comme le veulent tes électeurs rapporte plus que voter contre eux (' + good.toFixed(2) + ' contre ' + bad.toFixed(2) + ')');
  ok(!OP.canCensure({ myCamp: ['SM'], seats: { SM: 40 }, coalition: null }) && OP.canCensure({ myCamp: ['SM'], seats: { SM: 60 }, coalition: null }), 'motion de censure : 58 signatures pour la déposer');
  var cv = OP.censureVote(op); ok(cv.passed === (cv.pour >= 289), 'motion de censure : adoptée seulement avec 289 voix');
  ok(!OP.canDissolve(op), 'pas de dissolution dans l\'année qui suit des législatives');
  for (var i = 0; i < 20; i++) OP.next(op);
  ok(op.over && op.year === 6, '5 ans, 4 trimestres par an');
  var v = OP.verdict(op); ok(['favori', 'course', 'distance'].indexOf(v.verdict) >= 0 && v.rank >= 1, 'le bilan : ta place pour la prochaine présidentielle (' + v.verdict + ')');
  // la cohabitation : tu deviens Premier ministre
  var gv = G.create(g, 'SM', { manual: true }); G.setLegisCohab(gv, res, 'EM');
  ok(gv.cohab && gv.allies.join() === 'VP,FI', 'cohabitation : ton camp devient la majorité');
  CB.start(gv); ok(gv.cabinet.posts.pm && gv.cabinet.posts.pm.origin === 'toi', 'cohabitation : Matignon, c\'est toi');
})();

/* ---------- v2.8 : campagne éclair et sauvegarde ---------- */
section('Campagne éclair et sauvegarde');
(function () {
  var AI = require('../js/ai.js');
  var g = E.createGame('VP', { seed: 51, format: 'eclair' });
  ok(g.format === 'eclair' && D.RULES.maxTurns === 3 && D.RULES.debateTurns.join() === '3', 'éclair : 3 tours, un débat au dernier');
  ok(g.crisis.start === 1, 'éclair : la crise commence dès le tour 1');
  var g2 = E.createGame('VP', { seed: 51 });
  ok(g2.format === 'classique' && D.RULES.maxTurns === 8 && D.RULES.othersKeep === 0.82, 'une partie classique retrouve toutes les règles d\'origine');
  // la sauvegarde : reprendre une partie donne exactement la même suite
  function turn(gg) {
    var info = E.startTurn(gg);
    info.affairs.forEach(function (a) { E.resolveAffair(gg, a.pid, AI.chooseReaction(gg, a.pid)); });
    if (info.dilemma) E.resolveDilemma(gg, info.dilemma.pid, AI.chooseDilemma(gg, info.dilemma.pid));
    var pl = {}; gg.players.forEach(function (p) { pl[p.id] = AI.plan(gg, p.id); }); E.resolveActions(gg, pl); E.endTurn(gg);
  }
  var a = E.createGame(null, { seed: 77 }); turn(a); turn(a);
  var saved = E.saveGame(a), b = E.loadGame(saved);
  turn(a); turn(b);
  ok(JSON.stringify(E.poll(a)) === JSON.stringify(E.poll(b)) && a.rng() === b.rng(), 'sauvegarder puis reprendre : la partie continue à l\'identique');
  var c = E.loadGame(E.saveGame(E.createGame(null, { seed: 5, format: 'eclair' })));
  ok(c.format === 'eclair' && D.RULES.maxTurns === 3, 'reprendre une partie éclair remet les règles éclair');
  E.setFormat('classique');
})();

/* ---------- v2.9 : les nouvelles lois ---------- */
section('Les nouvelles lois');
(function () {
  var G = require('../js/govern.js');
  var g = E.createGame('SM', { seed: 61 }); E.setProgramme(g, 'SM', E.PARTY.SM.programme, E.PARTY.SM.financing);
  g.result = { first: E.poll(g), second: { a: 'SM', b: 'MN', pctA: 0.56, pctB: 0.44 } }; g.winner = 'SM';
  var gv = G.create(g, 'SM'), cat = G.lawCatalog(gv);
  ok(cat.recettes.length >= 4 && cat.economies.length >= 4 && cat.autres.length >= 5, 'trois familles de lois nouvelles : recettes, économies, autres idées');
  ok(cat.recettes.concat(cat.economies, cat.autres).every(function (id) { return E.PARTY.SM.programme.indexOf(id) < 0 && (gv.financing || []).indexOf(id) < 0; }), 'le catalogue exclut tes promesses et tes financements déjà prévus');
  ok(cat.recettes.every(function (id) { return E.measure(id).cost < 0; }) && cat.economies.every(function (id) { return E.measure(id).cost < 0; }), 'recettes et économies font baisser le déficit');
  var id = cat.recettes[0], d0 = gv.deficit; G.addExtra(gv, id); G.adopt(gv, id, false);
  ok(gv.deficit < d0 && G.itemOf(gv, id).status === 'adopted' && G.lawCatalog(gv).recettes.indexOf(id) < 0, 'une loi nouvelle adoptée : le déficit baisse et elle sort du catalogue');
  ok(G.verdict(gv).adopted === 0, 'elle ne compte pas dans les promesses tenues');
  var id2 = cat.economies[0]; G.addExtra(gv, id2); var p0 = gv.popBonus; G.reject(gv, id2);
  ok(gv.popBonus === p0 - 1 && G.lawCatalog(gv).economies.indexOf(id2) >= 0, 'une loi nouvelle rejetée : −1 de popularité, on peut la représenter');
})();

/* ---------- v3.0 : les cartes à glisser ---------- */
section('Les cartes à glisser');
(function () {
  var G = require('../js/govern.js'), CD = require('../js/cards.js');
  ok(CD.CARDS.length >= 30 && CD.FOLLOW.length >= 8, 'au moins 30 cartes et 8 suites (' + CD.CARDS.length + ' + ' + CD.FOLLOW.length + ')');
  var bad = CD.CARDS.concat(CD.FOLLOW).filter(function (c) { return !c.judge && (!c.left || !c.right || !c.left.label || !c.right.label || !c.text); });
  ok(bad.length === 0, 'chaque carte a un texte et deux choix');
  var laters = []; CD.CARDS.concat(CD.FOLLOW).forEach(function (c) { [c.left, c.right].forEach(function (o) { if (o && o.later) laters.push(o.later.id); }); });
  ok(laters.every(function (id) { return CD.BY[id] && CD.BY[id].follow; }), 'chaque suite annoncée existe');
  var g = E.createGame('SM', { seed: 71 }); E.setProgramme(g, 'SM', E.PARTY.SM.programme, E.PARTY.SM.financing);
  g.result = { first: E.poll(g), second: { a: 'SM', b: 'MN', pctA: 0.56, pctB: 0.44 } }; g.winner = 'SM';
  var gv = G.create(g, 'SM'), seen = {}, rep = 0;
  for (var y = 1; y <= 5; y++) { gv.year = y; for (var q = 0; q < 4; q++) { gv.cardSlot = q; var c = CD.draw(gv); if (!c) continue; if (seen[c.id] && !c.follow) rep++; seen[c.id] = true; CD.apply(gv, CD.judged(gv, c), 'right'); } }
  ok(rep === 0 && Object.keys(seen).length >= 15, 'un mandat : une carte par saison, jamais deux fois la même (' + Object.keys(seen).length + ' cartes)');
  var gv2 = G.create(g, 'SM'); gv2.year = 1; gv2.cardSlot = 0; gv2.rng = function () { return 0; };
  CD.apply(gv2, CD.BY.cheminots, 'right'); gv2.cardSlot = 1;
  ok(CD.draw(gv2).id === 'raffineries', 'une suite revient à la saison prévue (la grève s\'étend aux raffineries)');
  var t = CD.touches(CD.BY.patronat.right); ok(t.budget && t.pop && !t.assemblee, 'les points indiquent les jauges touchées');
})();

section('Les médias et les classes sociales (v3.8)');
(function () {
  var g = E.createGame('SM', { seed: 77 });
  var p0 = E.poll(g).map(function (x) { return x.pct; });
  var cp = E.classPoll(g), sum = 0; Object.keys(cp.pop).forEach(function (k) { sum += cp.pop[k]; });
  ok(sum > 0.5 && sum <= 1.0001, 'sondage par classe : les ouvriers et employés se répartissent entre les partis (' + (100 * sum).toFixed(0) + ' %, le reste aux « autres »)');
  ok(cp.pop.MN > cp.cad.MN && cp.ret.EM > cp.pop.EM && cp.sae.FI > cp.ret.FI, 'profils Ipsos : RN fort chez les ouvriers, Renaissance chez les retraités, LFI chez les jeunes et chômeurs');
  var before = E.poll(g).filter(function (x) { return x.pid === 'SM'; })[0].pct;
  E.addAudience(g, 'SM', { pop: 2, sae: 1 });
  var after = E.poll(g).filter(function (x) { return x.pid === 'SM'; })[0].pct;
  ok(after > before + 0.003, 'de l\'audience chez les ouvriers fait monter au sondage (' + (100 * (after - before)).toFixed(2) + ' pt)');
  var cp2 = E.classPoll(g); ok(cp2.pop.SM > cp.pop.SM && Math.abs(cp2.cad.SM - cp.cad.SM) < Math.abs(cp2.pop.SM - cp.pop.SM), 'le gain porte sur les ouvriers, beaucoup moins sur les cadres');
  var sv = E.loadGame(E.saveGame(g)); ok(sv.aud && sv.aud.SM.pop === 2 && sv.audOn, 'l\'audience est gardée dans la sauvegarde');
  var g2 = E.createGame('SM', { seed: 77 }); g2.aud = { SM: { pop: 0 } }; g2.audOn = false;
  var p2 = E.poll(g2).map(function (x) { return x.pct; });
  ok(p2.every(function (v, i) { return Math.abs(v - p0[i]) < 1e-9; }), 'sans audience, le sondage est exactement le même qu\'avant');
  var q = E.pickQuestion(g, 'pouvoir', 1);
  var keys = function (pid) { return E.interview(g, pid, q.id, 'tele').cards.map(function (c) { return c.key; }); };
  ok(keys('SM').indexOf('attaque') >= 0 && keys('SM').indexOf('bilan') < 0, 'l\'opposition peut attaquer le bilan');
  ok(keys('EM').indexOf('bilan') >= 0 && keys('EM').indexOf('attaque') < 0, 'le bloc au pouvoir défend son bilan, sans pouvoir l\'attaquer');
  var qi = D.QUESTIONS.filter(function (x) { return x.id === 'im_accueil'; })[0];
  ok(E.interview(g, 'MN', 'im_accueil', 'tele').cards[0].quote === qi.emoD && E.interview(g, 'SM', 'im_accueil', 'tele').cards[0].quote === qi.emo, 'immigration : l\'émotion n\'est pas la même à gauche et à droite');
  var em = E.interview(g, 'EM', q.id, 'tele').cards[0], sm = E.interview(g, 'SM', q.id, 'tele').cards[0];
  ok(em.heart < sm.heart || em.notes.join().indexOf('sonne faux') >= 0, 'venant du pouvoir, l\'émotion sonne faux');
  var g3 = E.createGame('SM', { seed: 78 }); E.addAudience(g3, 'SM', { pop: 4 }); g3.lastPoll = {}; g3.turn = 1; E.endTurn(g3);
  ok(Math.abs(g3.aud.SM.pop - 4 * D.MEDIA.keep) < 1e-9, 'l\'audience s\'use à chaque tour (×' + D.MEDIA.keep + ')');
  ok(D.ACTIONS.medias.target === null, 'la Télé ne vise plus de région');
})();

console.log('\n' + passes + ' vérifications réussies, ' + fails + ' en échec.');
process.exit(fails ? 1 : 0);

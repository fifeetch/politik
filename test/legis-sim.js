/* v2.3 : simule des présidentielles 100 % IA puis les législatives qui suivent, pour vérifier l'équilibre.
   Objectif (ordres de grandeur réels depuis 2002) : le président obtient une majorité absolue la plupart du temps,
   mais pas toujours ; triangulaires et désistements existent ; participation autour de 50 %.
   Usage : node test/legis-sim.js [nombre de parties] */
var D = require('../js/data.js'), E = require('../js/engine.js'), AI = require('../js/ai.js'), LG = require('../js/legis.js'), G = require('../js/govern.js');
var N = parseInt(process.argv[2] || '200', 10);
function play(seed) {
  var g = E.createGame(null, { seed: seed, mode: process.env.MODE, base: process.env.BASE });
  while (!g.over) {
    var info = E.startTurn(g);
    info.affairs.forEach(function (a) { E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)); });
    if (info.dilemma) E.resolveDilemma(g, info.dilemma.pid, AI.chooseDilemma(g, info.dilemma.pid));
    var plans = {}; g.players.forEach(function (p) { plans[p.id] = AI.plan(g, p.id); });
    E.resolveActions(g, plans);
    if (E.isDebateTurn(g)) { var deb = E.setupDebate(g), pr = {}; g.players.forEach(function (p) { pr[p.id] = AI.prep(g, p.id); });
      E.resolveDebate(g, pr, deb.duels.map(function (d) { return { ra: AI.chooseReply(g, d.a, d.theme, d.b), rb: AI.chooseReply(g, d.b, d.theme, d.a) }; })); }
    var t = E.spotlightTarget(g); if (t) E.applySpotlight(g, t, AI.paySpotlight(g, t));
    var et = E.endTurn(g);
    if (et.between) E.autoBetween(g);
  }
  return g;
}
var out = {}, byPres = {}, sum = { camp: 0, part: 0, elu1: 0, duel: 0, tri: 0, desist: 0, presSeats: 0 }, mnDuels = { n: 0, centreWins: 0, gaucheWins: 0, nc: 0, ng: 0 };
var diss = { n: 0, out: {} }, minCamp = 999, maxCamp = 0, errors = 0;
for (var i = 0; i < N; i++) {
  var g;
  try { g = play(7000 + i); } catch (e) { errors++; continue; }
  var gv = G.create(g, g.winner), res = gv.legis, o = res.outcome;
  out[o.type] = (out[o.type] || 0) + 1;
  var bp = byPres[g.winner] || (byPres[g.winner] = { n: 0, abs: 0, seats: 0 });
  bp.n++; bp.seats += o.campSeats; if (o.type === 'absolue') bp.abs++;
  sum.camp += o.campSeats; sum.part += res.participation1; sum.presSeats += res.seats[g.winner];
  minCamp = Math.min(minCamp, o.campSeats); maxCamp = Math.max(maxCamp, o.campSeats);
  ['elu1', 'duel', 'tri', 'desist'].forEach(function (k) { sum[k] += res.counts[k]; });
  // mélange local : part des sièges d'une région remportée par le bloc qui y gagne le plus (moyenne pondérée)
  D.REGIONS.forEach(function (r) { var bl = {}; Object.keys(res.regions[r.id].seats).forEach(function (p) { var u = LG.unionOf(res.unions, p).id; bl[u] = (bl[u] || 0) + res.regions[r.id].seats[p]; });
    var mx = 0; Object.keys(bl).forEach(function (k) { mx = Math.max(mx, bl[k]); }); sum.top = (sum.top || 0) + mx; sum.tot = (sum.tot || 0) + r.seats; });
  res.circs.forEach(function (c) {
    if (c.status !== 'duel' || !c.v2) return;
    var ks = Object.keys(c.v2); if (ks.indexOf('MN') < 0) return;
    var other = ks.filter(function (k) { return k !== 'MN'; })[0], u = LG.unionOf(res.unions, other);
    if (['EM', 'MD', 'HZ'].indexOf(other) >= 0) { mnDuels.nc++; if (c.winner !== 'MN') mnDuels.centreWins++; }
    if (['FI', 'PC', 'VP', 'SM'].indexOf(other) >= 0) { mnDuels.ng++; if (c.winner !== 'MN') mnDuels.gaucheWins++; }
  });
  // une dissolution en année 2, à 35 % puis 55 % de popularité
  [35, 55].forEach(function (pop) {
    var pm = G.dissolveMult(pop);
    var r2 = LG.run(g, { pres: g.winner, presMult: pm, dissolution: true, partners: (E.player(g, g.winner).deals || []).map(function (d) { return d.with; }) });
    var k = pop + ':' + r2.outcome.type; diss.out[k] = (diss.out[k] || 0) + 1;
  });
}
var M = N - errors;
function pc(x) { return Math.round(100 * x / M) + ' %'; }
console.log('Législatives après ' + M + ' présidentielles IA (erreurs : ' + errors + ')');
console.log('Issues :', Object.keys(out).map(function (k) { return k + ' ' + pc(out[k]); }).join(' · '));
console.log('Camp présidentiel : ' + Math.round(sum.camp / M) + ' sièges en moyenne (de ' + minCamp + ' à ' + maxCamp + ') · parti du président : ' + Math.round(sum.presSeats / M));
console.log('Bloc dominant d\'une région : ' + Math.round(100 * sum.top / sum.tot) + ' % de ses sièges en moyenne (cible : 60 à 70 %)');
console.log('Participation au 1er tour : ' + (100 * sum.part / M).toFixed(1) + ' %');
console.log('Par circonscription (moyenne) : élus au 1er tour ' + Math.round(sum.elu1 / M) + ' · duels ' + Math.round(sum.duel / M) + ' · triangulaires ' + Math.round(sum.tri / M) + ' · désistements ' + Math.round(sum.desist / M));
console.log('Duels face au MN : le centre gagne ' + (mnDuels.nc ? Math.round(100 * mnDuels.centreWins / mnDuels.nc) : '-') + ' % (' + mnDuels.nc + '), la gauche ' + (mnDuels.ng ? Math.round(100 * mnDuels.gaucheWins / mnDuels.ng) : '-') + ' % (' + mnDuels.ng + ')');
console.log('Par président :', Object.keys(byPres).sort().map(function (k) { var b = byPres[k]; return k + ' ×' + b.n + ' abs ' + Math.round(100 * b.abs / b.n) + ' % (' + Math.round(b.seats / b.n) + ')'; }).join(' · '));
console.log('Dissolution (popularité:issue) :', JSON.stringify(diss.out));

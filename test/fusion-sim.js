/* La fusion : les règles tiennent, et fusionner n'est ni une arnaque ni un coup gagnant à tous les coups.
   Compare le même parti, sur les mêmes graines, avec et sans fusion forcée après le premier débat.
   Usage : node test/fusion-sim.js [parties par cas] */
var assert = require('assert'), D = require('../js/data.js'), E = require('../js/engine.js'), AI = require('../js/ai.js');
var N = parseInt(process.argv[2] || '10', 10);

function partie(seed, plan) {
  var g = E.createGame(null, { seed: seed, aiParties: D.PARTIES.map(function (p) { return p.id; }) }), res = null, avant = null, apres = null;
  while (!g.over) {
    var info = E.startTurn(g);
    info.affairs.forEach(function (a) { E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)); });
    if (info.dilemma) E.resolveDilemma(g, info.dilemma.pid, AI.chooseDilemma(g, info.dilemma.pid));
    var plans = {}; g.players.forEach(function (p) { plans[p.id] = AI.plan(g, p.id); });
    E.resolveActions(g, plans);
    if (E.isDebateTurn(g)) {
      var deb = E.setupDebate(g), pr = {}; g.players.forEach(function (p) { pr[p.id] = AI.prep(g, p.id); });
      E.resolveDebate(g, pr, deb.duels.map(function (d) { return { ra: AI.chooseReply(g, d.a, d.theme, d.b, d), rb: AI.chooseReply(g, d.b, d.theme, d.a, d) }; }));
    }
    if (E.fusionDue(g)) {
      E.fusionStart(g);
      if (plan) {
        g.tract.force = 1;
        var rng0 = g.rng; g.rng = function () { return 0; };   // l'accord est forcé : on mesure ses effets, pas la chance de l'obtenir
        if (!E.fusionError(g, plan.pid, plan.target)) { res = E.fusionTry(g, plan.pid, plan.target, plan.k); }
        g.rng = rng0;
      }
      g.tract.iaFait = true;   // les autres partis ne bougent pas : comparaison propre
    }
    var t = E.spotlightTarget(g); if (t) E.applySpotlight(g, t, AI.paySpotlight(g, t));
    Object.keys(g.regions).forEach(function (rid) { Object.keys(g.regions[rid].cubes).forEach(function (pid) { var n = g.regions[rid].cubes[pid]; if (n < 0 || n > D.RULES.maxCubes) throw new Error('cubes hors limites'); }); });
    if (E.endTurn(g).between) E.autoBetween(g);
  }
  var pl = plan ? plan.pid : null, f = g.result && g.result.first.filter(function (x) { return x.pid === pl; })[0];
  return { g: g, res: res, score: f ? (f.pct || 0) : 0, gagne: g.winner === pl, second: !!(g.result && g.result.second && (g.result.second.a === pl || g.result.second.b === pl)) };
}

/* 1. Les interdits */
(function () {
  var g = E.createGame(null, { seed: 7, aiParties: D.PARTIES.map(function (p) { return p.id; }) });
  assert.ok(E.fusionError(g, 'SM', 'VP'), 'pas de fusion hors des tractations');
  E.fusionStart(g); g.tract.turn = g.turn;
  assert.ok(E.fusionError(g, 'SM', 'MN'), 'PS et RN ne fusionnent pas');
  assert.ok(E.fusionError(g, 'SM', 'UG'), 'le PS ne fusionne pas avec LR');
  ['rien', 'mesure', 'tandem'].forEach(function (k) { var x = E.fusionTaux('SM', 'VP', k); assert.ok(x.suit < 1 && x.suit > 0, k); });
  assert.ok(E.fusionTaux('SM', 'VP', 'tandem').suit > E.fusionTaux('SM', 'VP', 'rien').suit, 'le tandem retient mieux ses électeurs');
  assert.ok(E.fusionTaux('SM', 'VP', 'tandem').perte > E.fusionTaux('SM', 'VP', 'rien').perte, 'mais il fait fuir plus des tiens');
})();

/* 2. Les mesures, sur les mêmes graines */
var cas = [['SM', 'VP'], ['SM', 'MD'], ['EM', 'HZ'], ['UG', 'DL'], ['MN', 'DL'], ['FI', 'PC']], gains = [];
cas.forEach(function (c) {
  var s0 = 0, s1 = 0, g0 = 0, g1 = 0, q0 = 0, q1 = 0, imm = 0, sien = 0, faites = 0, gr = 0;
  for (var i = 0; i < N; i++) {
    var a = partie(9000 + i, { pid: c[0], target: 'aucun', k: 'mesure' }), b = partie(9000 + i, { pid: c[0], target: c[1], k: 'mesure' });
    s0 += a.score; s1 += b.score; g0 += a.gagne ? 1 : 0; g1 += b.gagne ? 1 : 0; q0 += a.second ? 1 : 0; q1 += b.second ? 1 : 0;
    if (b.res && b.res.ok) { faites++; imm += (b.res.apres - b.res.avant) * 100; sien += b.res.sien * 100; gr += b.res.grogne; }
    assert.ok(!(a.g.tract.log || []).some(function (l) { return l.ok; }), 'la partie témoin ne fusionne pas');
  }
  var line = { cas: c.join('+'), faites: faites, immediat: faites ? imm / faites : 0, sien: faites ? sien / faites : 0, sans: s0 / N * 100, avec: s1 / N * 100, gain0: g0, gain1: g1, q0: q0, q1: q1, grogne: faites ? gr / faites : 0 };
  gains.push(line);
  console.log(line.cas + ' : tout de suite +' + line.immediat.toFixed(1) + ' pt (il pesait ' + line.sien.toFixed(1) + ') · grogne ' + line.grogne.toFixed(1) + ' · final ' + line.sans.toFixed(1) + ' → ' + line.avec.toFixed(1) + ' % · 2e tour ' + q0 + ' → ' + q1 + ' · victoires ' + g0 + ' → ' + g1 + ' / ' + N);
});
gains.forEach(function (l) {
  if (!l.faites) return;
  assert.ok(l.immediat < l.sien, l.cas + ' : la fusion ne doit pas tout rapporter');
  assert.ok(l.immediat > 0, l.cas + ' : la fusion doit rapporter quelque chose tout de suite');
});
console.log('Fusion : OK');

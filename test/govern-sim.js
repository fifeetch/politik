/* Simule des quinquennats complets (après une campagne IA contre IA) pour vérifier les ordres de grandeur.
   Usage : node test/govern-sim.js [nombre] [stratégie : a = dépensière, b = économe] */
var D = require('../js/data.js'), E = require('../js/engine.js'), AI = require('../js/ai.js'), G = require('../js/govern.js');
var N = parseInt(process.argv[2] || '300', 10), strat = process.argv[3] || 'a';
var maj = {}, ver = {}, sum = { def: 0, debt: 0, pop: 0, adopted: 0, fell: 0, diss: 0, d493: 0 };
for (var i = 0; i < N; i++) {
  var g = E.createGame(null, { seed: 900 + i, aiParties: ['FI', 'SM', 'VP', 'EM', 'UG', 'MN'].sort(function () { return Math.random() - 0.5; }).slice(0, 4) });
  while (!g.over) {
    var info = E.startTurn(g);
    info.affairs.forEach(function (a) { E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)); });
    if (info.dilemma) E.resolveDilemma(g, info.dilemma.pid, AI.chooseDilemma(g, info.dilemma.pid));
    var plans = {}; g.players.forEach(function (p) { plans[p.id] = AI.plan(g, p.id); });
    E.resolveActions(g, plans);
    if (E.isDebateTurn(g)) { var deb = E.setupDebate(g), pr = {}; g.players.forEach(function (p) { pr[p.id] = AI.prep(g, p.id); });
      E.resolveDebate(g, pr, deb.duels.map(function (d) { return { ra: AI.chooseReply(g, d.a, d.theme, d.b), rb: AI.chooseReply(g, d.b, d.theme, d.a) }; })); }
    var t = E.spotlightTarget(g); if (t) E.applySpotlight(g, t, AI.paySpotlight(g, t));
    E.endTurn(g);
  }
  var gv = G.create(g, g.winner);
  maj[G.majorityType(gv)] = (maj[G.majorityType(gv)] || 0) + 1;
  while (!gv.over) {
    var pend = gv.measures.filter(function (m) { return m.status === 'pending'; });
    if (pend.length) {
      var mid = pend[0].id, v = G.vote(gv, mid);
      if (v.passed) G.adopt(gv, mid, false);
      else {
        var cand = v.groups.filter(function (x) { return x.stance !== 'pour' && E.dist(x.id, gv.pid) <= 3; }).sort(function (a, b) { return b.seats - a.seats; })[0];
        var v2 = cand ? G.vote(gv, mid, cand.id) : v;
        if (v2.passed) G.adopt(gv, mid, true);
        else { gv.used493 = true; sum.d493++; var c = G.censure(gv); if (c.passed) { G.reject(gv, mid); if (G.governmentFalls(gv, g) === 'dissolution') sum.diss++; } else { G.adopt(gv, mid, false); gv.survived = true; } }
      }
    }
    G.drawCards(gv).forEach(function (c) { G.applyOpt(gv, c.opts[strat === 'a' ? 0 : c.opts.length - 1]); });
    var ev = G.drawEvent(gv); G.applyOpt(gv, ev.opts[strat === 'a' ? 0 : ev.opts.length - 1]);
    G.endYear(gv);
  }
  var vd = G.verdict(gv); ver[vd.verdict] = (ver[vd.verdict] || 0) + 1;
  sum.def += gv.deficit; sum.debt += gv.debt; sum.pop += vd.pop; sum.adopted += vd.adopted; sum.fell += gv.fell;
}
console.log('Quinquennats :', N, '· stratégie', strat === 'a' ? 'dépensière' : 'économe');
console.log('Majorité après les législatives :', JSON.stringify(maj));
console.log('Fin de mandat (moyennes) : déficit ' + (sum.def / N).toFixed(2) + ' % · dette ' + (sum.debt / N).toFixed(1) + ' % · popularité ' + (sum.pop / N).toFixed(0) + ' % · mesures adoptées ' + (sum.adopted / N).toFixed(1) + ' / 5');
console.log('49.3 par mandat : ' + (sum.d493 / N).toFixed(2) + ' · gouvernements renversés : ' + (sum.fell / N).toFixed(2) + ' · dissolutions : ' + (sum.diss / N).toFixed(2));
console.log('Verdicts :', JSON.stringify(ver));

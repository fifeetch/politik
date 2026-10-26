/* v2.7 : simule le chemin de l'opposition (après une présidentielle perdue) pour vérifier l'équilibre.
   Le joueur est le finaliste battu (ou un parti éliminé) : il forme son camp, fait les législatives, puis 5 ans d'opposition.
   Usage : node test/oppo-sim.js [nombre de parties] */
var D = require('../js/data.js'), E = require('../js/engine.js'), AI = require('../js/ai.js'), LG = require('../js/legis.js'), OP = require('../js/oppo.js');
var N = parseInt(process.argv[2] || '120', 10);
function play(seed) {
  var g = E.createGame(null, { seed: seed });
  while (!g.over) {
    var info = E.startTurn(g);
    info.affairs.forEach(function (a) { E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)); });
    if (info.dilemma) E.resolveDilemma(g, info.dilemma.pid, AI.chooseDilemma(g, info.dilemma.pid));
    var plans = {}; g.players.forEach(function (p) { plans[p.id] = AI.plan(g, p.id); });
    E.resolveActions(g, plans);
    if (E.isDebateTurn(g)) { var deb = E.setupDebate(g), pr = {}; g.players.forEach(function (p) { pr[p.id] = AI.prep(g, p.id); });
      E.resolveDebate(g, pr, deb.duels.map(function (d) { return { ra: AI.chooseReply(g, d.a, d.theme, d.b), rb: AI.chooseReply(g, d.b, d.theme, d.a) }; })); }
    var t = E.spotlightTarget(g); if (t) E.applySpotlight(g, t, AI.paySpotlight(g, t));
    if (E.endTurn(g).between) E.autoBetween(g);
  }
  return g;
}
var st = { cohab: 0, n: 0, gain: 0, rank: {}, fell: 0, diss: 0, adopted: 0, laws: 0, myseats: 0, finaliste: 0 };
for (var i = 0; i < N; i++) {
  var g = play(9100 + i), pres = g.winner;
  // le joueur : le finaliste battu une fois sur deux, sinon le 3e du 1er tour
  var me = i % 2 === 0 && g.result.second ? (g.result.second.a === pres ? g.result.second.b : g.result.second.a) : g.result.first.filter(function (x) { return x.pid !== pres; })[1].pid;
  if (i % 2 === 0) st.finaliste++;
  var pct = g.result.second ? (g.result.second.a === pres ? g.result.second.pctA : g.result.second.pctB) : 0.55;
  var lc = LG.newCampaign(g, { pres: pres, player: me, margin: pct - 0.5, loser: g.result.second ? me : null, partners: (E.player(g, pres).deals || []).map(function (d) { return d.with; }) });
  var cands = g.players.map(function (p) { return p.id; }).filter(function (p) { return p !== me && p !== pres; }).sort(function (a, b) { return LG.allyChance(g, me, b) - LG.allyChance(g, me, a); });
  for (var k = 0; k < cands.length && lc.offersLeft > 0; k++) LG.offerAlly(g, lc, cands[k]);
  for (var t2 = 0; t2 < 2; t2++) {
    var cls = LG.projection(g, lc).cls, regs = D.REGIONS.slice().sort(function (a, b) { return cls.regions[b.id].open - cls.regions[a.id].open; });
    ['meeting', 'vedette', 'mobilise'].forEach(function (ty, j) { var a = { type: ty, rid: regs[j].id }; if (LG.actError(g, lc, a)) a = { type: 'clip' }; LG.act(g, lc, a); });
    LG.endTurn(g, lc);
  }
  var res = LG.run(g, LG.optsOf(lc, { rng: g.rng }));
  st.n++; st.myseats += res.focusSeats;
  if (res.focusSeats >= 289) { st.cohab++; continue; }
  var op = OP.create(g, me, pres, res);
  while (!op.over) {
    var q = OP.quarter(op);
    if (q === 'loi' && OP.govLaw(op)) { var f = OP.fit(op, OP.govLaw(op)); var r = OP.voteGovLaw(op, f > 0.2 ? 'pour' : f < -0.2 ? 'contre' : 'abst'); st.laws++; }
    if (q === 'crise') { var ev = OP.crisis(op); OP.reactCrisis(op, ev, ev.unity ? 'unite' : 'denoncer'); }
    if (q === 'niche' && OP.nicheChoices(op).length) { var nr = OP.voteNiche(op, OP.nicheChoices(op)[0].id); if (nr.vote.passed) st.adopted++; }
    if (q === 'censure') {
      var best = Object.keys(op.seats).sort(function (a, b) { return OP.coalitionChance(op, b) * op.seats[b] - OP.coalitionChance(op, a) * op.seats[a]; })[0];
      if (best && !op.coalition) OP.offerCoalition(op, best);
      if (OP.canCensure(op) && OP.censureVote(op).pour >= 260) { var c = OP.censure(op); if (c.vote.passed) { st.fell++; if (c.dissolve) { st.diss++; var r2 = LG.run(g, { pres: pres, player: me, playerAllies: op.myCamp.slice(1), presMult: Math.max(0.45, Math.min(1.6, Math.pow(op.presPop / 45, 2))), dissolution: true, rng: g.rng }); OP.afterLegis(op, r2); if (r2.focusSeats >= 289) { st.cohab++; op.over = true; } } } }
    }
    OP.next(op);
  }
  var v = OP.verdict(op); st.gain += v.gain; st.rank[v.verdict] = (st.rank[v.verdict] || 0) + 1;
}
var M = st.n;
console.log('Opposition après ' + M + ' présidentielles perdues (' + st.finaliste + ' fois finaliste battu)');
console.log('Législatives : ton camp ' + Math.round(st.myseats / M) + ' sièges en moyenne · cohabitation (tu deviens Premier ministre) ' + Math.round(100 * st.cohab / M) + ' %');
var O2 = M - st.cohab;
console.log('5 ans d\'opposition (' + O2 + ') : score ' + (st.gain >= 0 ? '+' : '') + (st.gain / Math.max(1, O2)).toFixed(1) + ' point en moyenne · ' + Object.keys(st.rank).map(function (k) { return k + ' ' + Math.round(100 * st.rank[k] / O2) + ' %'; }).join(' · '));
console.log('Par mandat : ' + (st.fell / Math.max(1, O2)).toFixed(2) + ' gouvernement renversé · ' + (st.diss / Math.max(1, O2)).toFixed(2) + ' dissolution · ' + (st.adopted / Math.max(1, O2)).toFixed(2) + ' de tes lois adoptées');

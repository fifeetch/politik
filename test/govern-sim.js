/* Simule des quinquennats complets (après une campagne IA contre IA) pour vérifier les ordres de grandeur.
   Usage : node test/govern-sim.js [nombre] [stratégie : a = dépensière, b = économe, c = équilibrée] */
var D = require('../js/data.js'), E = require('../js/engine.js'), AI = require('../js/ai.js'), G = require('../js/govern.js'), CB = require('../js/cabinet.js'), CD = require('../js/cards.js');
var useCards = process.argv[5] !== 'sanscartes';   // v3.0 : une carte à glisser par saison (choix au hasard)
var useCab = process.argv[4] !== 'sans';
var useLaws = process.argv.indexOf('sanslois') < 0;   // v3.4 : chaque année, une nouvelle loi de recettes (stratégies b et c)   // v2.6 : avec un gouvernement (proposition de Lulu), sauf « sans »
var N = parseInt(process.argv[2] || '300', 10), strat = process.argv[3] || 'a';
function val(o) { var v = -(o.def || 0) * 25 + (o.pop || 0); Object.keys(o.sat || {}).forEach(function (k) { v += o.sat[k] * E.NATPOP[k] / 100 * 3; }); return v; }
/* c : équilibrée · a : choisit toujours l'option la plus dépensière ; b : la plus économe */
function pick(opts) {
  if (strat === 'c') return opts.slice().sort(function (x, y) { return val(y) - val(x); })[0];   // c : équilibrée (1 pt de déficit ≈ 25 de satisfaction)
  return opts.slice().sort(function (x, y) { return strat === 'a' ? (y.def || 0) - (x.def || 0) : (x.def || 0) - (y.def || 0); })[0]; }
var maj = {}, ver = {}, sum = { def: 0, debt: 0, pop: 0, adopted: 0, fell: 0, diss: 0, d493: 0 };
for (var i = 0; i < N; i++) {
  var g = E.createGame(null, { seed: 900 + i, aiParties: ['FI', 'SM', 'VP', 'EM', 'UG', 'MN'].sort(function () { return Math.random() - 0.5; }).slice(0, 4), base: 'e2024' });
  while (!g.over) {
    var info = E.startTurn(g);
    info.affairs.forEach(function (a) { E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)); });
    if (info.dilemma) E.resolveDilemma(g, info.dilemma.pid, AI.chooseDilemma(g, info.dilemma.pid));
    var plans = {}; g.players.forEach(function (p) { plans[p.id] = AI.plan(g, p.id); });
    E.resolveActions(g, plans);
    if (E.isDebateTurn(g)) { var deb = E.setupDebate(g), pr = {}; g.players.forEach(function (p) { pr[p.id] = AI.prep(g, p.id); });
      E.resolveDebate(g, pr, deb.duels.map(function (d) { return { ra: AI.chooseReply(g, d.a, d.theme, d.b), rb: AI.chooseReply(g, d.b, d.theme, d.a) }; })); }
    var t = E.spotlightTarget(g); if (t) E.applySpotlight(g, t, AI.paySpotlight(g, t));
    if (E.endTurn(g).between) E.autoBetween(g);   // v2.3 : l'entre-deux-tours (sinon la boucle ne finissait jamais)
  }
  var gv = G.create(g, g.winner);
  if (useCab) { CB.start(gv); CB.form(gv, CB.suggest(gv)); }
  maj[G.majorityType(gv)] = (maj[G.majorityType(gv)] || 0) + 1;
  while (!gv.over) {
    if (useCards) for (var q = 0; q < 4; q++) { gv.cardSlot = q; var cd = CD.draw(gv); if (cd) { cd = CD.judged(gv, cd); CD.apply(gv, cd, gv.rng() < 0.5 ? 'left' : 'right'); sum.cards = (sum.cards || 0) + 1; } }
    var pend = gv.measures.filter(function (m) { return m.status === 'pending'; });
    if (pend.length) {
      var mid = pend[0].id, v = G.vote(gv, mid);
      if (v.passed) G.adopt(gv, mid, false);
      else {
        var cand = v.groups.filter(function (x) { return x.stance !== 'pour' && E.dist(x.id, gv.pid) <= 3; }).sort(function (a, b) { return b.seats - a.seats; })[0];
        var v2 = cand ? G.vote(gv, mid, cand.id) : v;
        if (v2.passed) G.adopt(gv, mid, true);
        else { gv.used493 = true; sum.d493++; var c = G.censure(gv); if (c.passed) { G.reject(gv, mid); G.governmentFalls(gv); } else { G.adopt(gv, mid, false); gv.survived = true; } }
      }
    }
    if (useLaws && strat !== 'a') {   // v3.4 : b vise le plus gros rendement, c le meilleur compromis rendement / popularité
      var cat = G.lawCatalog(gv).recettes;
      function lawVal(id) { var m = E.measure(id), v = -m.cost * (strat === 'b' ? 1 : 0.5); Object.keys(m.fans || {}).forEach(function (k) { v += strat === 'c' ? m.fans[k] * E.NATPOP[k] / 100 * 6 : 0; }); return v; }
      var lid = cat.slice().sort(function (x, y) { return lawVal(y) - lawVal(x); })[0];
      if (lid) {
        G.addExtra(gv, lid); sum.laws = (sum.laws || 0) + 1; sum.lawsBy = sum.lawsBy || {};
        var lv = G.vote(gv, lid);
        if (lv.passed) { G.adopt(gv, lid, false); sum.lawsOk = (sum.lawsOk || 0) + 1; }
        else {
          var lc = lv.groups.filter(function (x) { return x.stance !== 'pour' && E.dist(x.id, gv.pid) <= 3; }).sort(function (a, b) { return b.seats - a.seats; })[0];
          if (lc && G.vote(gv, lid, lc.id).passed) { G.adopt(gv, lid, true); sum.lawsOk = (sum.lawsOk || 0) + 1; sum.lawsAm = (sum.lawsAm || 0) + 1; }
          else G.reject(gv, lid);
        }
        sum.lawsBy[lid] = (sum.lawsBy[lid] || 0) + 1;
      }
    }
    if (G.canDissolve(gv) && G.popularity(gv) >= 50 && G.majorityType(gv) !== 'absolue') { G.dissolve(gv, g); sum.diss++; }
    if (gv.year === 1) G.applyFinancing(gv);
    G.drawCards(gv).forEach(function (c) { G.applyOpt(gv, pick(c.opts)); });
    var ev = G.drawEvent(gv); G.applyOpt(gv, pick(ev.opts));
    if (useCab) { var me2 = CB.event(gv); if (me2) { sum.minEv = (sum.minEv || 0) + 1; CB.applyEvent(gv, me2, me2.opts[0]); } }
    G.endYear(gv);
  }
  var vd = G.verdict(gv); ver[vd.verdict] = (ver[vd.verdict] || 0) + 1;
  sum.def += gv.deficit; sum.debt += gv.debt; sum.pop += vd.pop; sum.adopted += vd.adopted; sum.fell += gv.fell;
}
console.log('Quinquennats :', N, '· stratégie', strat === 'a' ? 'dépensière' : strat === 'b' ? 'économe' : 'équilibrée');
console.log('Majorité après les législatives :', JSON.stringify(maj));
console.log('Fin de mandat (moyennes) : déficit ' + (sum.def / N).toFixed(2) + ' % · dette ' + (sum.debt / N).toFixed(1) + ' % · popularité ' + (sum.pop / N).toFixed(0) + ' % · mesures adoptées ' + (sum.adopted / N).toFixed(1) + ' / 5');
console.log('49.3 par mandat : ' + (sum.d493 / N).toFixed(2) + ' · gouvernements renversés : ' + (sum.fell / N).toFixed(2) + ' · dissolutions : ' + (sum.diss / N).toFixed(2));
console.log('Verdicts :', JSON.stringify(ver));
if (useCards) console.log('Cartes jouées : ' + ((sum.cards || 0) / N).toFixed(1) + ' par mandat');
if (useLaws && strat !== 'a') console.log('Nouvelles lois de recettes : ' + ((sum.laws || 0) / N).toFixed(1) + ' présentées par mandat · ' + (100 * (sum.lawsOk || 0) / Math.max(1, sum.laws || 0)).toFixed(0) + ' % adoptées (dont ' + (100 * (sum.lawsAm || 0) / Math.max(1, sum.laws || 0)).toFixed(0) + ' % amendées) · les plus choisies : ' + Object.keys(sum.lawsBy || {}).sort(function (a, b) { return sum.lawsBy[b] - sum.lawsBy[a]; }).slice(0, 5).join(', '));
if (useCab) console.log('Gouvernement : ' + ((sum.minEv || 0) / N).toFixed(1) + ' événements de ministres par mandat');

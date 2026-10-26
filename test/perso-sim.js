/* v2.5 : simule des parties où un 13e parti, fondé par le joueur, est en lice (mené par l'ordinateur).
   Vérifie : score de départ (~3 %), effet nouveauté, chances de victoire (rares, mais possibles), aucune erreur.
   Usage : node test/perso-sim.js [nombre de parties] */
var D = require('../js/data.js'), E = require('../js/engine.js'), AI = require('../js/ai.js'), PS = require('../js/perso.js');
var N = parseInt(process.argv[2] || '200', 10);
var POS = [1.2, 2.5, 3.5, 4.6, 5.8];
var out = {}, errs = 0;
POS.forEach(function (pos) { out[pos] = { start: 0, t4: 0, final: 0, wins: 0, finals: 0, n: 0 }; });
for (var i = 0; i < N; i++) {
  var pos = POS[i % POS.length], ch = PS.defaultChar(); ch.name = 'Alex Térieur';
  PS.reset();
  var themes = pos < 3 ? ['ecologie', 'services'] : pos < 4.5 ? ['emploi', 'pouvoir'] : ['securite', 'immigration'];
  var p = PS.found({ name: 'Le Grand Élan', sigle: 'GE', color: '#7B3FA0', pos: pos, themes: themes }, ch);
  var g = E.createGame(null, { seed: 400 + i, aiParties: D.PARTIES.map(function (x) { return x.id; }), mode: process.env.MODE, base: process.env.BASE });
  var o = out[pos]; o.n++;
  try {
    o.start += E.poll(g).filter(function (x) { return x.pid === 'GE'; })[0].pct;
    while (!g.over) {
      var info = E.startTurn(g);
      info.affairs.forEach(function (a) { E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)); });
      if (info.dilemma) E.resolveDilemma(g, info.dilemma.pid, AI.chooseDilemma(g, info.dilemma.pid));
      var plans = {}; g.players.forEach(function (q) { plans[q.id] = AI.plan(g, q.id); });
      E.resolveActions(g, plans);
      if (E.isDebateTurn(g)) { var deb = E.setupDebate(g), pr = {}; g.players.forEach(function (q) { pr[q.id] = AI.prep(g, q.id); });
        E.resolveDebate(g, pr, deb.duels.map(function (d) { return { ra: AI.chooseReply(g, d.a, d.theme, d.b), rb: AI.chooseReply(g, d.b, d.theme, d.a) }; })); }
      var t = E.spotlightTarget(g); if (t) E.applySpotlight(g, t, AI.paySpotlight(g, t));
      if (g.turn === 4) o.t4 += E.poll(g).filter(function (x) { return x.pid === 'GE'; })[0].pct;
      if (E.endTurn(g).between) E.autoBetween(g);
    }
    o.final += g.result.first.filter(function (x) { return x.pid === 'GE'; })[0].pct;
    if (g.result.second && (g.result.second.a === 'GE' || g.result.second.b === 'GE')) o.finals++;
    if (g.winner === 'GE') o.wins++;
  } catch (e) { errs++; if (errs < 3) console.error(e.stack); }
}
PS.reset();
console.log('Parties avec un parti fondé : ' + N + ' · erreurs : ' + errs + ' · 13 partis en lice : ' + (D.PARTIES.length === 12 ? 'oui (remis à 12 après)' : 'NON'));
POS.forEach(function (pos) {
  var o = out[pos]; if (!o.n) return;
  console.log('Position ' + pos + ' : départ ' + (100 * o.start / o.n).toFixed(1) + ' % · tour 4 ' + (100 * o.t4 / o.n).toFixed(1) + ' % · 1er tour ' + (100 * o.final / o.n).toFixed(1) + ' % · finaliste ' + Math.round(100 * o.finals / o.n) + ' % · victoire ' + Math.round(100 * o.wins / o.n) + ' %');
});

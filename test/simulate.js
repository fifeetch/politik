/* Simule des parties 100 % IA pour vérifier les règles et l'équilibre.
   Usage : node test/simulate.js [nombre de parties] */
var D = require('../js/data.js');
var E = require('../js/engine.js');
var AI = require('../js/ai.js');

var N = parseInt(process.argv[2] || '600', 10);
var all = D.PARTIES.map(function (p) { return p.id; });
var stats = {}; all.forEach(function (id) { stats[id] = { played: 0, wins: 0, pts: 0 }; });
var firstRound = 0, turnsSum = 0, errors = 0, actionCount = {}, failed = 0, totalActs = 0;

for (var i = 0; i < N; i++) {
  var rng = E.makeRng(1000 + i);
  var parties = all.slice().sort(function () { return rng() - 0.5; }).slice(0, 4);
  var g = E.createGame(null, { seed: 5000 + i, aiParties: parties });
  try {
    while (!g.over) {
      E.startTurn(g);
      var plans = {};
      g.players.forEach(function (p) { plans[p.id] = AI.plan(g, p.id); });
      var log = E.resolveActions(g, plans);
      log.forEach(function (l) { totalActs++; if (!l.ok) failed++; actionCount[l.action] = (actionCount[l.action] || 0) + 1; });
      if (E.isDebateTurn(g)) { var bids = {}; g.players.forEach(function (p) { bids[p.id] = AI.bid(g, p.id); }); E.resolveDebate(g, bids); }
      var t = E.spotlightTarget(g); if (t) E.applySpotlight(g, t, AI.paySpotlight(g, t));
      E.endTurn(g);
      // invariants
      Object.keys(g.regions).forEach(function (rid) {
        Object.keys(g.regions[rid].cubes).forEach(function (pid) { var n = g.regions[rid].cubes[pid]; if (n < 0 || n > 10) throw new Error('cubes hors limites'); });
      });
      g.players.forEach(function (p) { if (p.money < 0 || p.infl < 0) throw new Error('ressources négatives ' + p.id); });
    }
  } catch (e) { errors++; if (errors < 3) console.error(e.stack); continue; }
  if (g.firstRound) firstRound++;
  turnsSum += g.turn;
  var fs = E.finalScores(g);
  parties.forEach(function (id) { stats[id].played++; });
  stats[g.winner].wins++;
  fs.forEach(function (s) { stats[s.pid].pts += s.total; });
}

console.log('Parties : ' + N + ' · erreurs : ' + errors);
console.log('Victoires au 1er tour : ' + (100 * firstRound / N).toFixed(1) + ' % · durée moyenne : ' + (turnsSum / N).toFixed(2) + ' tours');
console.log('Actions échouées : ' + (100 * failed / totalActs).toFixed(1) + ' %');
console.log('\nParti                 Taux de victoire (attendu 25 %)   Score moyen');
all.forEach(function (id) {
  var s = stats[id];
  console.log((D.PARTIES.filter(function (p) { return p.id === id; })[0].name + '                      ').slice(0, 22) +
    (100 * s.wins / s.played).toFixed(1).padStart(6) + ' %' + (s.pts / s.played).toFixed(1).padStart(30));
});
console.log('\nActions jouées :', JSON.stringify(actionCount));

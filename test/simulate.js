/* Simule des parties 100 % IA pour vérifier les règles et l'équilibre.
   Usage : node test/simulate.js [nombre de parties] */
var D = require('../js/data.js');
var E = require('../js/engine.js');
var AI = require('../js/ai.js');

var N = parseInt(process.argv[2] || '600', 10);
var NP = parseInt(process.env.PLAYERS || String(D.PARTIES.length), 10);   // nombre de partis en lice (par défaut : tous)
var quals = {}, dealsN = 0, dealsDist = {}, consignes = {};
var all = D.PARTIES.map(function (p) { return p.id; });
var stats = {}; all.forEach(function (id) { stats[id] = { played: 0, wins: 0, pts: 0 }; });
var affairs = 0, reac = {}, enq = 0, debWins = {}, dil = {}, scandals = 0, gaffes = 0, credUps = 0, mil = 0, casSum = 0;
var firstRound = 0, alliances = 0, finals = {}, turnsSum = 0, errors = 0, actionCount = {}, failed = 0, totalActs = 0;

for (var i = 0; i < N; i++) {
  var rng = E.makeRng(1000 + i);
  // v1.5 : vrai mélange (Fisher-Yates) avec graine, au lieu d'un tri au hasard (qui n'est pas uniforme)
  var parties = all.slice();
  for (var k = parties.length - 1; k > 0; k--) { var j = Math.floor(rng() * (k + 1)), tmp = parties[k]; parties[k] = parties[j]; parties[j] = tmp; }
  parties = parties.slice(0, NP);
  var g = E.createGame(null, { seed: 5000 + i, aiParties: parties, mode: process.env.MODE, base: process.env.BASE, format: process.env.FORMAT });
  try {
    while (!g.over) {
      var info = E.startTurn(g);
      info.affairs.forEach(function (a) { affairs++; var rc = AI.chooseReaction(g, a.pid); reac[rc] = (reac[rc] || 0) + 1; E.resolveAffair(g, a.pid, rc); });
      if (info.dilemma) { var dp = info.dilemma.pid, ch = AI.chooseDilemma(g, dp); dil[ch] = (dil[ch] || 0) + 1; E.resolveDilemma(g, dp, ch); }
      
      var plans = {};
      g.players.forEach(function (p) { plans[p.id] = AI.plan(g, p.id); });
      var log = E.resolveActions(g, plans);
      log.forEach(function (l) { totalActs++; if (l.gaffe) gaffes++; if (l.action === 'Enquêter') enq++; if (l.credUp) credUps++; if (!l.ok && !l.gaffe) failed++; actionCount[l.action] = (actionCount[l.action] || 0) + 1; });
      if (E.isDebateTurn(g)) {
        var deb = E.setupDebate(g), pr = {}; g.players.forEach(function (p) { pr[p.id] = AI.prep(g, p.id); });
        var picks = deb.duels.map(function (d) { return { ra: AI.chooseReply(g, d.a, d.theme, d.b), rb: AI.chooseReply(g, d.b, d.theme, d.a) }; });
        var dr = E.resolveDebate(g, pr, picks); if (dr.winner) debWins[dr.winner] = (debWins[dr.winner] || 0) + 1;
      }
      var t = E.spotlightTarget(g); if (t) E.applySpotlight(g, t, AI.paySpotlight(g, t));
      var et = E.endTurn(g);
      if (et.between) {   // v1.6 : l'entre-deux-tours, joué par l'ordinateur
        E.autoBetween(g);
        Object.keys(g.result.deals || {}).forEach(function (e) { dealsN++; var d = E.dist(e, g.result.deals[e].with); dealsDist[d] = (dealsDist[d] || 0) + 1; });
        g.result.second.transfers.forEach(function (t) { consignes[t.consigne] = (consignes[t.consigne] || 0) + 1; });
      }
      // invariants
      Object.keys(g.regions).forEach(function (rid) {
        Object.keys(g.regions[rid].cubes).forEach(function (pid) { var n = g.regions[rid].cubes[pid]; if (n < 0 || n > 10) throw new Error('cubes hors limites'); });
      });
      g.players.forEach(function (p) { if (p.money < 0 || p.infl < 0 || p.forme < 0) throw new Error('ressources négatives ' + p.id); });
    }
  } catch (e) { errors++; if (errors < 3) console.error(e.stack); continue; }
  g.players.forEach(function (p) { mil += p.militants; casSum += p.cas; });
  if (g.result.direct) firstRound++;
  else { var k = [g.result.second.a, g.result.second.b].sort().join('-'); finals[k] = (finals[k] || 0) + 1; quals[g.result.second.a] = (quals[g.result.second.a] || 0) + 1; quals[g.result.second.b] = (quals[g.result.second.b] || 0) + 1; }
  turnsSum += g.turn;
  parties.forEach(function (id) { stats[id].played++; });
  stats[g.winner].wins++;
  g.result.first.forEach(function (s) { stats[s.pid].pts += 100 * s.pct; });
}

console.log('Parties : ' + N + ' · erreurs : ' + errors);
console.log('Partis en lice : ' + NP + ' · élu dès le 1er tour : ' + (100 * firstRound / N).toFixed(1) + ' % · accords d\'entre-deux-tours : ' + (dealsN / N).toFixed(2) + ' par partie, par distance ' + JSON.stringify(dealsDist) + ' · consignes ' + JSON.stringify(consignes));
console.log('Par partie : ' + (affairs / N).toFixed(2) + ' affaires · ' + (enq / N).toFixed(2) + ' enquêtes · ' + (gaffes / N).toFixed(2) + ' gaffes · ' + (credUps / N).toFixed(2) + ' gains de crédibilité · ' + (mil / N).toFixed(2) + ' équipes de militants · ' + (casSum / N / NP).toFixed(2) + ' casseroles en fin de partie (par parti)');
console.log('Réactions aux affaires (nier/excuses/fusible/médias) :', JSON.stringify(reac));
console.log('Débats gagnés par parti :', JSON.stringify(debWins));
console.log('Choix aux dilemmes (option 1/2/3) :', JSON.stringify(dil));
console.log('Actions échouées : ' + (100 * failed / totalActs).toFixed(1) + ' %');
console.log('\nParti                 Victoires (repère 1/' + NP + ' = ' + (100 / NP).toFixed(1) + ' %)   Qualifié au 2nd tour   % moyen au 1er tour');
all.forEach(function (id) {
  var s = stats[id];
  console.log((D.PARTIES.filter(function (p) { return p.id === id; })[0].name + '                      ').slice(0, 22) +
    (100 * s.wins / s.played).toFixed(1).padStart(6) + ' %' + ((100 * (quals[id] || 0) / s.played).toFixed(1) + ' %').padStart(26) + (s.pts / s.played).toFixed(1).padStart(22));
});
console.log('\nActions jouées :', JSON.stringify(actionCount));
console.log('Duels de second tour les plus fréquents :', Object.keys(finals).sort(function (a, b) { return finals[b] - finals[a]; }).slice(0, 6).map(function (k) { return k + ' ' + finals[k]; }).join(' · '));

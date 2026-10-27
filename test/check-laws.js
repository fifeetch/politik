/* v3.4 : vérifie les lois de recettes proposables pendant le quinquennat.
   Usage : node test/check-laws.js
   Contrôle : identifiants uniques, présence dans FUNDING et dans NEW_LAWS.recettes, catalogue sans doublon
   (et sans mesure déjà prise au programme), vote normal, amendement, 49.3 et censure, effet sur le déficit,
   retour d'une loi rejetée l'année suivante, sources et ligne « En vrai ». */
var D = require('../js/data.js'), E = require('../js/engine.js'), AI = require('../js/ai.js'), G = require('../js/govern.js');

var NEW = ['executive_pay_tax', 'bank_balance_tax', 'large_life_insurance', 'data_tax', 'digital_ads_tax', 'crypto_tax', 'luxury_vat', 'luxury_homes_tax',
  'vacant_offices', 'concession_rent', 'flight_frequency_tax', 'carbon_imports', 'nonrecyclable_packaging', 'land_artificialisation',
  'unused_buildable_land', 'aid_clawback', 'dormant_patents', 'intragroup_debt', 'carried_interest', 'pay_gap_tax', 'cir_cut'];
var ok = 0, ko = [];
function check(cond, msg) { if (cond) ok++; else ko.push(msg); }

/* 1. Données */
var ids = D.MEASURES.concat(D.FUNDING).map(function (m) { return m.id; });
check(ids.filter(function (x, i) { return ids.indexOf(x) !== i; }).length === 0, 'identifiants en double');
NEW.forEach(function (id) {
  var m = D.FUNDING.filter(function (x) { return x.id === id; })[0];
  check(!!m, id + ' absent de FUNDING');
  if (!m) return;
  check(m.cost < 0, id + ' : une recette doit avoir un coût négatif');
  check(m.edu && m.edu.what && m.edu.pro && m.edu.con, id + ' : explication incomplète');
  check(m.src && m.src.length > 0, id + ' : pas de source');
  check(!!m.vrai, id + ' : pas de ligne « En vrai »');
  check(!!G.CAMPS[m.camp], id + ' : camp inconnu');
  check(Object.keys(m.fans).every(function (k) { return D.SEGMENTS.some(function (sg) { return sg.id === k; }); }), id + ' : groupe social inconnu');
  check(G.NEW_LAWS.recettes.indexOf(id) >= 0, id + ' absent de NEW_LAWS.recettes');
});
check(G.NEW_LAWS.recettes.filter(function (x, i) { return G.NEW_LAWS.recettes.indexOf(x) !== i; }).length === 0, 'doublon dans NEW_LAWS.recettes');

/* 2. Un quinquennat de test (campagne rapide jouée par l'ordinateur) */
function mandate(seed) {
  var g = E.createGame(null, { seed: seed, aiParties: ['FI', 'SM', 'VP', 'EM', 'UG', 'MN'], base: 'e2024' });
  while (!g.over) {
    var info = E.startTurn(g);
    info.affairs.forEach(function (a) { E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)); });
    if (info.dilemma) E.resolveDilemma(g, info.dilemma.pid, AI.chooseDilemma(g, info.dilemma.pid));
    var plans = {}; g.players.forEach(function (p) { plans[p.id] = AI.plan(g, p.id); });
    E.resolveActions(g, plans);
    if (E.isDebateTurn(g)) { var deb = E.setupDebate(g), pr = {}; g.players.forEach(function (p) { pr[p.id] = AI.prep(g, p.id); });
      E.resolveDebate(g, pr, deb.duels.map(function (d) { return { ra: AI.chooseReply(g, d.a, d.theme, d.b, d), rb: AI.chooseReply(g, d.b, d.theme, d.a, d) }; })); }
    var t = E.spotlightTarget(g); if (t) E.applySpotlight(g, t, AI.paySpotlight(g, t));
    if (E.endTurn(g).between) E.autoBetween(g);
  }
  return G.create(g, g.winner);
}
var gv = mandate(4242);

/* Catalogue : pas de doublon, rien de ce qui est déjà au programme ou au financement */
var cat = G.lawCatalog(gv), all = cat.recettes.concat(cat.economies, cat.autres);
check(all.filter(function (x, i) { return all.indexOf(x) !== i; }).length === 0, 'doublon dans lawCatalog()');
var taken = gv.measures.map(function (x) { return x.id; }).concat(gv.financing || []);
check(all.every(function (id) { return taken.indexOf(id) < 0; }), 'lawCatalog() propose une mesure déjà au programme');
NEW.forEach(function (id) { if (taken.indexOf(id) < 0) check(cat.recettes.indexOf(id) >= 0, id + ' absent du catalogue'); });

/* Vote, amendement, déficit, 49.3, censure, rejet puis retour */
var report = [];
NEW.forEach(function (id) {
  var m = E.measure(id);
  var v = G.vote(gv, id);
  check(v.pour + v.contre + v.abst === Object.keys(gv.seats).reduce(function (s, k) { return s + gv.seats[k]; }, 0), id + ' : le vote ne compte pas tous les députés');
  check(typeof v.passed === 'boolean', id + ' : vote sans résultat');
  // adoption normale : le déficit baisse de cost / mdPerPoint
  var c1 = JSON.parse(JSON.stringify(gv)); c1.rng = gv.rng;
  G.addExtra(c1, id); var d0 = c1.deficit; G.adopt(c1, id, false);
  check(Math.abs((c1.deficit - d0) - m.cost / G.C.mdPerPoint) < 1e-9, id + ' : effet sur le déficit incorrect');
  check(G.itemOf(c1, id).status === 'adopted', id + ' : pas marquée adoptée');
  check(G.lawCatalog(c1).recettes.indexOf(id) < 0, id + ' : reste au catalogue après adoption');
  // amendement : la moitié de l'effet
  var c2 = JSON.parse(JSON.stringify(gv)); c2.rng = gv.rng;
  G.addExtra(c2, id); d0 = c2.deficit; G.adopt(c2, id, true);
  check(Math.abs((c2.deficit - d0) - m.cost * G.C.amendFactor / G.C.mdPerPoint) < 1e-9, id + ' : effet amendé incorrect');
  // négociation : un groupe qui négocie vote pour
  var cand = v.groups.filter(function (x) { return x.stance !== 'pour' && x.seats > 0; })[0];
  if (cand) check(G.vote(gv, id, cand.id).groups.filter(function (x) { return x.id === cand.id; })[0].stance === 'pour', id + ' : la négociation ne change pas le vote');
  // 49.3 et censure : la fonction répond, avec 289 voix pour seuil
  var c = G.censure(gv, null);
  check(typeof c.passed === 'boolean' && c.passed === (c.pour >= G.C.majority), id + ' : censure incohérente');
  // rejet puis retour l'année suivante
  var c3 = JSON.parse(JSON.stringify(gv)); c3.rng = gv.rng;
  G.addExtra(c3, id); G.reject(c3, id);
  check(G.lawCatalog(c3).recettes.indexOf(id) >= 0, id + ' : une loi rejetée doit pouvoir revenir');
  G.addExtra(c3, id);
  check(G.itemOf(c3, id).status === 'pending' && c3.extra.filter(function (x) { return x.id === id; }).length === 1, id + ' : retour d\'une loi rejetée incorrect');
  report.push({ id: id, md: -m.cost, pour: v.pour, contre: v.contre, passed: v.passed });
});

console.log('Lois de recettes : ' + NEW.length + ' nouvelles, ' + G.NEW_LAWS.recettes.length + ' au total · président ' + E.sigle(gv.pid) + ' (' + gv.seats[gv.pid] + ' députés)');
report.forEach(function (r) { console.log('  ' + (r.id + '                          ').slice(0, 26) + (r.md + ' Md€').padStart(8) + '   pronostic ' + (r.passed ? 'adoptée' : 'rejetée') + ' (' + r.pour + ' pour, ' + r.contre + ' contre)'); });
console.log('\n' + ok + ' vérifications réussies, ' + ko.length + ' en échec.');
ko.forEach(function (x) { console.log('  ✗ ' + x); });
if (ko.length) process.exit(1);

/* b1 : vérifie le moteur économique du mandat et les règles du budget qu'aucun autre contrôle ne couvrait.
   Usage : node test/check-economy.js   (sort avec le code 1 si un test échoue)
   Contrôle : endYear, popularity, marketPenalty, taxFatigue, budgetCap, js/economy.js, champs optionnels des mesures,
   cohérence du détail (la somme des causes égale la valeur), renvois sans boucle, JSON, déterminisme, rapidité. */
var D = require('../js/data.js'), E = require('../js/engine.js'), AI = require('../js/ai.js'), G = require('../js/govern.js'), ECO = require('../js/economy.js');
var ok = 0, ko = [];
function check(cond, msg) { if (cond) ok++; else ko.push(msg); }
function near(a, b, tol) { return Math.abs(a - b) <= (tol == null ? 1e-6 : tol); }

/* Un mandat de laboratoire : pas de campagne, tous les chiffres sont maîtrisés */
function lab(seed, over) {
  var sat = {}; D.SEGMENTS.forEach(function (sg) { sat[sg.id] = 50; });
  var gv = { pid: 'EM', year: 1, deficit: 5, debt: 118, sat: sat, popBonus: 0, measures: [], extra: [], financing: [], seats: {}, history: [], oneOff: 0, seed: seed || 7, fronde: 0 };
  Object.keys(over || {}).forEach(function (k) { gv[k] = over[k]; });
  return gv;
}
function reportsOk(r, where) {
  var ids = Object.keys(r.eco.entries);
  ids.forEach(function (id) {
    var e = r.eco.entries[id], s = e.causes.reduce(function (t, c) { return t + c.value; }, 0);
    check(near(s, e.value, 1e-6), where + ' ' + id + ' : causes ' + s + ' ≠ valeur ' + e.value);
    check(e.id === id && !!e.label && !!e.unit && (e.kind === 'niveau' || e.kind === 'variation'), where + ' ' + id + ' : entrée incomplète');
    e.causes.forEach(function (c) {
      check(typeof c.label === 'string' && c.label && typeof c.value === 'number' && isFinite(c.value), where + ' ' + id + ' : cause invalide ' + JSON.stringify(c));
      if (c.ref) check(!!r.eco.entries[c.ref], where + ' ' + id + ' : renvoi cassé vers ' + c.ref);
    });
  });
  // Les renvois ne bouclent jamais : l'infobulle imbriquée finit toujours
  var seen = {};
  function walk(id, path) {
    if (path.indexOf(id) >= 0) { check(false, where + ' : boucle ' + path.concat(id).join(' > ')); return; }
    if (seen[id]) return; seen[id] = true;
    r.eco.entries[id].causes.forEach(function (c) { if (c.ref && r.eco.entries[c.ref]) walk(c.ref, path.concat(id)); });
  }
  ids.forEach(function (id) { walk(id, []); });
}

/* 1. popularity : moyenne des groupes pondérée par leur poids, plus le bonus, entre 3 et 97 */
var gv = lab();
check(G.popularity(gv) === 50, 'popularity : 50 partout doit donner 50');
gv.popBonus = 5; check(G.popularity(gv) === 55, 'popularity : le bonus s\'ajoute');
gv.popBonus = 100; check(G.popularity(gv) === 97, 'popularity : plafond 97');
gv.popBonus = -100; check(G.popularity(gv) === 3, 'popularity : plancher 3');
gv = lab(); var big = D.SEGMENTS.slice().sort(function (a, b) { return E.NATPOP[b.id] - E.NATPOP[a.id]; }), one = big[0], last = big[big.length - 1];
var g1 = lab(), g2 = lab(); g1.sat[one.id] = 90; g2.sat[last.id] = 90;
check(G.popularity(g1) > G.popularity(g2), 'popularity : un groupe plus nombreux pèse plus');

/* 2. taxFatigue : chaque nouvel impôt hors programme coûte de plus en plus ; pas ceux du programme */
gv = lab(); var laws = G.NEW_LAWS.recettes.slice(0, 3), b0 = gv.popBonus;
laws.forEach(function (id) { G.addExtra(gv, id); });
G.adopt(gv, laws[0]); check(near(gv.popBonus, b0 - G.C.taxFatigue), 'taxFatigue : −1,5 au 1er impôt');
G.adopt(gv, laws[1]); check(near(gv.popBonus, b0 - 3 * G.C.taxFatigue), 'taxFatigue : −3 de plus au 2e');
G.adopt(gv, laws[2]); check(near(gv.popBonus, b0 - 6 * G.C.taxFatigue), 'taxFatigue : −4,5 de plus au 3e');
gv = lab(7, { measures: [{ id: laws[0], status: 'pending', amended: false }] });
G.adopt(gv, laws[0]); check(gv.popBonus === 0 && !gv.newTaxes, 'taxFatigue : un impôt du programme n\'use pas');

/* 3. budgetCap : au-delà du plafond, des casseroles et une affaire ; en deçà, rien */
function programme(budget) {
  var g = E.createGame(null, { seed: 11, aiParties: ['FI', 'SM', 'VP', 'EM'], base: 'e2024' }), pl = g.players[0];
  E.setProgramme(g, pl.id, E.PARTY[pl.id].programme.filter(function (id) { return !E.measure(id).choc; }));
  pl.budget = budget; pl.cas = 0; g.pending = [];
  return { res: E.startTurn(g).programmes.filter(function (o) { return o.pid === pl.id; })[0], pl: pl, g: g };
}
check(D.RULES.budgetCap === 25, 'budgetCap : 25 Md€');
var under = programme(D.RULES.budgetCap), over = programme(D.RULES.budgetCap + D.RULES.budgetCasStep + 1);
check(under.res.over === 0 && under.res.cas === 0, 'budgetCap : pile au plafond, pas de casserole');
check(!under.g.pending.some(function (x) { return x.affair === 'budget' && x.pid === under.pl.id; }), "budgetCap : pile au plafond, pas d'affaire");
check(over.res.over === D.RULES.budgetCasStep + 1 && over.res.cas === 2, 'budgetCap : 1 casserole par tranche entamée');

/* 4. endYear : sanctions, usure, état de grâce, année qui passe, fin de mandat */
gv = lab(); var r = G.endYear(gv);
check(r.year === 1 && gv.year === 2 && !gv.over, 'endYear : l\'année passe');
check(gv.history.length === 1 && gv.history[0].deficit === r.deficit && gv.history[0].debt === r.debt && gv.history[0].pop === r.pop, 'endYear : historique');
check(near(r.target, G.C.target(1)), 'endYear : cible de l\'année');
reportsOk(r, 'endYear neutre');
check(gv.popBonus === -G.C.honeymoon - 2, 'endYear : fin de l\'état de grâce et usure la 1re année');
gv.year = 2; gv.deficit = 4; var bonus = gv.popBonus; G.endYear(gv);
check(near(gv.popBonus, bonus - 2), 'endYear : usure seule ensuite');
gv = lab(7, { year: 5 }); G.endYear(gv); check(gv.over === true && gv.year === 6, 'endYear : fin du mandat après l\'année 5');

// Bruxelles (+0,3 au-dessus de la cible) puis les marchés (+1) : marketPenalty
gv = lab(7, { year: 2, deficit: 4.05 }); r = G.endYear(gv);   // cible 4,1 : tenu
check(!r.bruxelles && !r.markets, 'sanctions : sur la trajectoire, rien (déficit ' + r.deficit + ')');
gv = lab(7, { year: 2, deficit: 7 }); bonus = gv.popBonus; r = G.endYear(gv);
check(r.bruxelles && r.markets && !!r.text, 'sanctions : déficit très au-dessus, Bruxelles et les marchés');
check(near(r.marketsPop, G.C.marketPenalty + G.C.marketSlide * (r.deficit - 0.1 - r.target - 1), 1e-6), 'marketPenalty : le prix grandit avec le dérapage');
check(near(gv.popBonus, bonus - r.marketsPop - 2), 'marketPenalty : le prix du dérapage (plus l\'usure)');
var d = r.eco.entries.deficit, dd = r.eco.entries.debt;
check(d.causes.some(function (c) { return c.label === D.ECONOMY.labels.markets && c.value === 0.1; }), 'marketPenalty : +0,1 de déficit expliqué');
check(dd.causes.some(function (c) { return c.label === D.ECONOMY.labels.bruxelles && c.value === 0.5; }), 'Bruxelles : +0,5 de dette expliqué');
check(r.eco.entries.popularity.causes.some(function (c) { return c.label === D.ECONOMY.labels.markets && near(c.value, -r.marketsPop, 0.011); }), 'marketPenalty : expliqué dans la popularité');
reportsOk(r, 'endYear sanctions');

// Les mesures ponctuelles s'arrêtent après le bilan
gv = lab(); G.applyOpt(gv, { label: 'Prime', def: 0.5, once: true }); r = G.endYear(gv);
check(near(gv.deficit, r.deficit - 0.5, 0.011), 'endYear : la mesure ponctuelle disparaît ensuite');
var r2 = G.endYear(gv);
check(r2.eco.entries.impulsion.causes.some(function (c) { return c.label === D.ECONOMY.labels.oneOffEnd && c.value === -0.5; }), 'impulsion : la fin de la mesure ponctuelle compte');
reportsOk(r2, 'année 2');

/* 5. Le détail : chaque décision a sa ligne, et ce qui échappe au registre tombe dans « autres décisions » */
gv = lab(); G.applyOpt(gv, { label: 'Serrer les dépenses', def: -0.3 }); gv.deficit += 0.1;   // comme govui après une négociation du budget
r = G.endYear(gv); d = r.eco.entries.deficit;
function cause(e, label) { return e.causes.filter(function (c) { return c.label === label; })[0]; }
check(cause(d, 'Serrer les dépenses') && cause(d, 'Serrer les dépenses').value === -0.3, 'détail : la carte a sa ligne');
check(cause(d, D.ECONOMY.labels.others) && cause(d, D.ECONOMY.labels.others).value === 0.1, 'détail : le reste est compté à part');
check(cause(d, D.ECONOMY.labels.debtCharge) && cause(d, D.ECONOMY.labels.debtCharge).ref === 'debtCharge', 'détail : la charge renvoie à sa propre entrée');
check(near(d.value, d.level - 5, 0.011), 'détail : la valeur est la variation depuis le début d\'année');
var gr = d.causes.filter(function (c) { return c.ref === 'growth'; })[0];
check(!gr || gr.label === D.ECONOMY.labels.slowdown || gr.label === D.ECONOMY.labels.recovery, 'détail : la conjoncture renvoie à la croissance');

/* 6. Le modèle : une économie freine, une dépense soutient ; les causes vont dans le bon sens */
function yearAfter(def, seed) { var v = lab(seed || 5); if (def) G.applyOpt(v, { label: 'x', def: def }); return { r: G.endYear(v), v: v }; }
var cut = yearAfter(-1), base = yearAfter(0), add = yearAfter(1);
var gN = function (x) { return x.v.eco.growth; };
check(gN(cut) < gN(base) && gN(base) < gN(add), 'modèle : −1 point freine, +1 point soutient la croissance');
check(near(gN(add) - gN(base), D.ECONOMY.multiplier * D.ECONOMY.impulseNow, 0.05), 'modèle : multiplicateur');
check(cut.v.eco.unemployment > base.v.eco.unemployment, 'modèle : le chômage monte quand l\'activité baisse');
check(cut.r.deficit > 5 - 1 + 0.2, 'modèle : une économie rapporte moins qu\'annoncé (déficit ' + cut.r.deficit + ')');
var hi = lab(5, { deficit: 9 }), lo = lab(5, { deficit: 3 }); G.endYear(hi); G.endYear(lo);
check(hi.eco.rate > lo.eco.rate, 'modèle : un déficit élevé fait monter les taux');
check(hi.eco.apparent - D.ECONOMY.start.apparent < hi.eco.rate - D.ECONOMY.start.apparent, 'modèle : le taux moyen suit lentement');
// charge : ordre de grandeur Cour des comptes (2,2 points en 2025, 3 points vers 2029), sans décision
var path = lab(9); for (var y = 0; y < 5; y++) G.endYear(path);
var ch = path.eco.history.map(function (h) { return h.debtCharge; });
check(ch[0] > 2.5 && ch[0] < 3 && ch[4] > 3 && ch[4] < 4.2, 'modèle : charge de la dette réaliste ' + ch.join(' '));
check(path.eco.history.every(function (h) { return h.growth > -1.5 && h.growth < 3.5 && h.inflation > -0.5 && h.inflation < 5 && h.unemployment > 5 && h.unemployment < 11; }), 'modèle : valeurs plausibles sans décision ' + JSON.stringify(path.eco.history));

/* 7. Champs optionnels : montée en charge et effet retour, sans rien changer à adopt */
var m = E.measure('retraites'), pts = m.cost / G.C.mdPerPoint;
gv = lab(7, { measures: [{ id: 'retraites', status: 'pending', amended: false }] });
G.adopt(gv, 'retraites'); check(near(gv.deficit, 5 + pts), 'adopt : déficit = coût / 30 tout de suite');
r = G.endYear(gv);
var ramp = cause(r.eco.entries.deficit, m.name + D.ECONOMY.labels.rampSuffix);
check(ramp && near(ramp.value, pts * (m.ramp[0] - 1), 0.011) && ramp.ref === 'montee', 'ramp : 1re année, seulement 20 % des économies');
for (y = 0; y < 3; y++) { r = G.endYear(gv); reportsOk(r, 'retraites ' + y); }
var ret = cause(r.eco.entries.deficit, m.name + D.ECONOMY.labels.retourSuffix);
check(ret && ret.ref === 'retour', 'retour : apparaît après son délai');
var it = gv.eco.items[0]; r = G.endYear(gv);
check(near(it.rampDone, 0), 'ramp : au bout de la montée, plus aucune correction');
check(near(it.retourDone, -m.retour * pts), 'retour : le total est la part annoncée du coût');
// Sans champ : aucun suivi, la mesure agit tout de suite et pour toujours. Amendée : la moitié.
gv = lab(7, { measures: [{ id: 'policiers', status: 'pending', amended: false }] }); G.adopt(gv, 'policiers'); check(gv.eco.items.length === 0, 'défaut : rien à suivre sans champ');
gv = lab(7, { measures: [{ id: 'reindus', status: 'pending', amended: false }] }); G.adopt(gv, 'reindus', true);
check(near(gv.eco.items[0].pts, 0.5 * E.measure('reindus').cost / G.C.mdPerPoint), 'amendement : la moitié des effets');
// Les données : champs bien formés, sur de vraies mesures
Object.keys(D.ECONOMY.effects).forEach(function (id) {
  var fx = D.ECONOMY.effects[id], mm = E.measure(id);
  check(!!mm, id + ' : mesure inconnue dans ECONOMY.effects');
  if (fx.ramp) { check(fx.ramp[fx.ramp.length - 1] === 1 && fx.ramp.every(function (x, i) { return x > 0 && x <= 1 && (!i || x >= fx.ramp[i - 1]); }), id + ' : ramp croissante jusqu\'à 1'); check(mm.ramp === fx.ramp, id + ' : ramp non recopiée'); }
  if (fx.retour) check(Math.abs(fx.retour) < 1, id + ' : retour trop fort');
});

/* 8. Satisfaction : plafond et plancher sont expliqués */
gv = lab(5); D.SEGMENTS.forEach(function (sg) { gv.sat[sg.id] = 0; }); gv.deficit = 12; r = G.endYear(gv);
D.SEGMENTS.forEach(function (sg) { check(r.eco.entries['sat.' + sg.id] && gv.sat[sg.id] >= 0 && gv.sat[sg.id] <= 100, 'satisfaction ' + sg.id); });
reportsOk(r, 'plancher');

/* 9. JSON et déterminisme, y compris après une sauvegarde en cours de mandat */
function run(seed, cutAt) {
  var v = lab(seed, { measures: [{ id: 'reindus', status: 'pending', amended: false }] }), out = [];
  G.adopt(v, 'reindus');
  for (var i = 0; i < 5; i++) {
    if (i === cutAt) v = JSON.parse(JSON.stringify(v));
    var o = G.endYear(v); out.push(o);
  }
  return { v: v, out: out };
}
var a = run(42), b = run(42), c = run(43), s = run(42, 2);
check(JSON.stringify(a.out) === JSON.stringify(b.out), 'déterminisme : même graine, même mandat');
check(JSON.stringify(a.out) !== JSON.stringify(c.out), 'déterminisme : autre graine, autre conjoncture');
check(JSON.stringify(a.out) === JSON.stringify(s.out), 'JSON : une sauvegarde en cours de mandat ne change rien');
var snap = JSON.parse(JSON.stringify(a.v.eco));
check(JSON.stringify(snap) === JSON.stringify(a.v.eco), 'JSON : l\'état économique se relit à l\'identique');
check(JSON.stringify(a.v.eco).length < 40000, 'JSON : l\'état reste petit (' + JSON.stringify(a.v.eco).length + ' octets)');
check(!a.v.eco.pendingClose && a.v.eco.ledger.length === 0, 'JSON : rien de provisoire ne reste');

/* 10. Un vrai mandat : création depuis une campagne, le hasard du jeu n'est pas consommé par la conjoncture */
var game = E.createGame(null, { seed: 4242, aiParties: ['FI', 'SM', 'VP', 'EM', 'UG', 'MN'], base: 'e2024' });
while (!game.over) {
  var info = E.startTurn(game);
  info.affairs.forEach(function (x) { E.resolveAffair(game, x.pid, AI.chooseReaction(game, x.pid)); });
  if (info.dilemma) E.resolveDilemma(game, info.dilemma.pid, AI.chooseDilemma(game, info.dilemma.pid));
  var plans = {}; game.players.forEach(function (p) { plans[p.id] = AI.plan(game, p.id); });
  E.resolveActions(game, plans);
  if (E.isDebateTurn(game)) { var deb = E.setupDebate(game), pr = {}; game.players.forEach(function (p) { pr[p.id] = AI.prep(game, p.id); });
    E.resolveDebate(game, pr, deb.duels.map(function (x) { return { ra: AI.chooseReply(game, x.a, x.theme, x.b, x), rb: AI.chooseReply(game, x.b, x.theme, x.a, x) }; })); }
  var t = E.spotlightTarget(game); if (t) E.applySpotlight(game, t, AI.paySpotlight(game, t));
  if (E.endTurn(game).between) E.autoBetween(game);
}
var real = G.create(game, game.winner);
check(real.eco && real.eco.open.deficit === real.deficit && real.eco.open.pop === G.popularity(real), 'create : la conjoncture part du début du mandat');
var mark = game.rng.getState ? game.rng.getState() : null;
var done = 0; while (!real.over) {
  var pend = real.measures.filter(function (x) { return x.status === 'pending'; })[0];
  if (pend) G.adopt(real, pend.id, false);
  if (real.year === 1) G.applyFinancing(real);
  G.drawCards(real).forEach(function (cd) { G.applyOpt(real, cd.opts[0]); });
  r = G.endYear(real); reportsOk(r, 'mandat réel année ' + r.year); done++;
}
check(done === G.C.years, 'mandat réel : 5 bilans');
check(['reelu', 'serre', 'battu'].indexOf(G.verdict(real).verdict) >= 0, 'verdict : valeur connue');
if (mark != null) check(game.rng.getState() === mark, 'hasard : endYear ne consomme pas le hasard du jeu');

/* b2 : l'écart entre le déficit annoncé au budget et le déficit réel */
gv = lab(7, { measures: [{ id: 'retraites', status: 'pending', amended: false }] }); G.adopt(gv, 'retraites');
var prevu = gv.deficit, attendu = ECO.pendingRamp(gv.eco, gv.year); check(near(attendu, -m.cost / G.C.mdPerPoint * (1 - m.ramp[0]), 1e-6), 'pendingRamp : la part pas encore acquise');
gv.announced = prevu; G.applyOpt(gv, { label: 'Carte de l\'hiver', def: 0.04 }); r = G.endYear(gv);
var ec = r.eco.entries.ecart; check(near(r.announced, prevu) && near(ec.value, r.deficit - prevu, 0.011) && ec.level === Math.round(prevu * 100) / 100, 'écart : déficit réel moins déficit annoncé');
check(cause(ec, D.ECONOMY.labels.montee) && near(cause(ec, D.ECONOMY.labels.montee).value, attendu, 0.011) && cause(ec, D.ECONOMY.labels.montee).ref === 'montee', 'écart : la montée en charge a sa ligne');
check(cause(ec, D.ECONOMY.labels.afterVote) && near(cause(ec, D.ECONOMY.labels.afterVote).value, 0.04, 0.011), 'écart : une décision après le vote a sa ligne');
check(gv.announced === null, 'écart : l\'annonce ne survit pas à l\'année');
gv = lab(); r = G.endYear(gv); check(near(r.eco.entries.ecart.value, r.deficit - r.announced, 0.011), 'écart : sans annonce, on part du déficit de fin d\'année');

/* b2 : le verdict pèse le bilan budgétaire ; ce n'est qu'un réglage de jeu, borné */
gv = lab(); D.SEGMENTS.forEach(function (sg) { gv.sat[sg.id] = 46; }); gv.measures = [1, 2, 3, 4, 5].map(function (i) { return { id: 'x' + i, status: 'adopted' }; });
gv.deficit = 4; check(G.verdict(gv).verdict === 'reelu' && G.verdict(gv).balance === 0, 'verdict : entre 3 et 5 %, la popularité décide');
gv.deficit = 8; var vv = G.verdict(gv); check(vv.balance === -9 && vv.verdict === 'serre', 'verdict : un déficit de 8 % pèse dans les urnes');
D.SEGMENTS.forEach(function (sg) { gv.sat[sg.id] = 40; }); check(G.verdict(gv).verdict === 'battu', 'verdict : une dette hors de contrôle peut coûter l\'élection');
gv.deficit = 3; D.SEGMENTS.forEach(function (sg) { gv.sat[sg.id] = 42; }); check(G.verdict(gv).balance === G.C.verdictSound && G.verdict(gv).verdict === 'reelu', 'verdict : revenir à 3 % finit par payer');

/* b2 : l'affichage. Chaque infobulle du rapport est valide, chaque renvoi mène à une infobulle qui existe, aucun chiffre cassé */
var IB = require('../js/infobulle.js'), fs = require('fs'), ids = ECO.infoIds(), known = {};
ids.forEach(function (id) { known[ECO.INFO_PREFIX + id] = true; });
function bulles(rep, where) {
  ids.forEach(function (id) {
    check(!!rep.entries[id], where + ' : le rapport n\'a pas ' + id);
    var b = ECO.infobulle(rep, id), err = IB.verifier(b, function (x) { return !!known[x]; });
    check(!err.length, where + ' ' + id + ' : ' + err.join(', '));
    check(!/NaN|undefined|null/.test(JSON.stringify(b).replace(/"[a-z]+":null/g, '')), where + ' ' + id + ' : chiffre cassé ' + JSON.stringify(b));
    check(rep.entries[id].causes.length === 0 ? /Rien/.test(b.texte) : b.lignes.length >= rep.entries[id].causes.length, where + ' ' + id + ' : toutes les causes sont là');
    check(IB.contenuHtml(b).indexOf('<') === 0, where + ' ' + id + ' : se dessine');
  });
  Object.keys(rep.entries).forEach(function (id) { rep.entries[id].causes.forEach(function (c) { if (c.ref) check(!!known[ECO.INFO_PREFIX + c.ref], where + ' ' + id + ' : renvoi sans infobulle vers ' + c.ref); }); });
}
gv = lab(7, { measures: [{ id: 'retraites', status: 'pending', amended: false }, { id: 'reindus', status: 'pending', amended: false }] }); G.adopt(gv, 'retraites'); G.adopt(gv, 'reindus');
for (y = 0; y < 5; y++) { r = G.endYear(gv); bulles(r.eco, 'mandat ' + y); }
gv = lab(5); gv.deficit = 9; r = G.endYear(gv); bulles(r.eco, 'crise');
var nul = ECO.infobulle(null, 'growth'); check(nul.titre === D.ECONOMY.labels.growth && !!nul.texte, 'infobulle : avant le premier bilan, un texte d\'attente');
check(!IB.verifier(ECO.infobulle(null, 'sat.ind')).length, 'infobulle : avant le premier bilan, jamais de titre vide');
// Les renvois d'infobulle permettent de remonter : de la charge au taux, du taux à l'inflation
var bc = ECO.infobulle(r.eco, 'debtCharge'), br = ECO.infobulle(r.eco, 'rate');
check(bc.lignes.some(function (l) { return l.renvoi === 'eco-rate'; }) && br.lignes.some(function (l) { return l.renvoi === 'eco-inflation'; }), 'infobulle : on remonte d\'une cause à l\'autre');
// Dans l'écran : chaque mot marqué existe, chaque constante lue existe (le chiffre « debtDrift » disparu affichait NaN)
var src = fs.readFileSync(__dirname + '/../js/govui.js', 'utf8'), defs = {};
new Function(src);   // une faute de syntaxe ici laisserait l'écran du mandat vide
(src.match(/'(gov-[a-z]+)':/g) || []).forEach(function (x) { defs[x.slice(1, -2)] = true; });
(src.match(/IB\.mot\('(gov-[a-z]+)'/g) || []).concat(src.match(/\[\[(gov-[a-z]+)/g) || []).forEach(function (x) { var id = x.match(/gov-[a-z]+/)[0]; check(defs[id], 'écran : infobulle inconnue ' + id); });
(src.match(/(?:IB\.mot\('|id: '|\[\[)eco-[A-Za-z.]+/g) || []).forEach(function (x) { var id = x.match(/eco-[A-Za-z.]+/)[0]; check(known[id], 'écran : infobulle inconnue ' + id); });
(src.match(/\bG\.C\.[A-Za-z0-9]+/g) || []).forEach(function (x) { check(G.C[x.slice(4)] != null, 'écran : constante inconnue ' + x); });
check(src.indexOf("ecoStrip()") > 0 && /id="gov-eco"/.test(fs.readFileSync(__dirname + '/../index.html', 'utf8')), 'écran : la ligne de conjoncture est branchée');
// Une mesure progressive l'annonce au moment du choix
check(/rampTxt\(M\)/.test(src) && /gapLine\(r\)/.test(src), 'écran : montée en charge au choix de la mesure, écart au bilan');

/* 11. La rapidité : la conjoncture ne doit pas ralentir govern-sim */
var t0 = Date.now(); for (var n = 0; n < 2000; n++) { var q = lab(n); for (y = 0; y < 5; y++) G.endYear(q); }
var ms = Date.now() - t0;
check(ms < 3000, 'rapidité : 10 000 fins d\'année en ' + ms + ' ms');

console.log('Économie du mandat : ' + Object.keys(D.ECONOMY.effects).length + ' mesures enrichies · 10 000 fins d\'année en ' + ms + ' ms');
console.log(ok + ' vérifications réussies, ' + ko.length + ' en échec.');
ko.forEach(function (x) { console.log('  ✗ ' + x); });
if (ko.length) process.exit(1);

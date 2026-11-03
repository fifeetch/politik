/* Vérifie la sauvegarde du mandat (js/mandat-save.js).
   1. Chaque parcours (quinquennat, dissolution, cohabitation, opposition) est joué deux fois à graine égale, par les mêmes décisions :
      une fois d'une traite, une fois en sérialisant et en rechargeant tout l'état à chaque étape. Les deux doivent finir à l'identique.
   2. Les liens entre objets survivent à l'aller-retour.
   3. Une sauvegarde abîmée ou ancienne est refusée sans planter ; la limite de place est gérée.
   Usage : node test/check-save-mandat.js [nombre de graines] */
var assert = require('assert');
var D = require('../js/data.js'), E = require('../js/engine.js'), AI = require('../js/ai.js'), G = require('../js/govern.js'), LG = require('../js/legis.js');
var CB = require('../js/cabinet.js'), CD = require('../js/cards.js'), OP = require('../js/oppo.js'), MS = require('../js/mandat-save.js');
var N = parseInt(process.argv[2] || '2', 10), SEED0 = 4100, maxSize = 0, hops = 0;

function campaign(seed) {
  var g = E.createGame(null, { seed: seed });
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
  return g;
}

/* L'aller-retour complet, comme à la fermeture du jeu : texte de stockage, contrôle, partie et état reconstruits */
function hop(S, stage) {
  var sv = MS.pack({ stage: stage, me: S.me, info: 'test', g: S.g, state: { gv: S.gv, op: S.op, keep: S.keep, lc: S.lc, lopt: S.lopt, learned: S.learned, step: S.step, lawsThisYear: 0 } });
  var txt = JSON.stringify(sv); maxSize = Math.max(maxSize, txt.length); hops++;
  var back = JSON.parse(txt);
  assert.strictEqual(MS.flaw(back), null, 'sauvegarde saine refusée à l\'étape ' + stage + ' : ' + MS.flaw(back));
  var g = E.loadGame(back.game), s = MS.decode(back.state, g);
  S.g = g; S.gv = s.gv; S.op = s.op; S.keep = s.keep; S.lc = s.lc; S.lopt = s.lopt; S.learned = s.learned; S.step = s.step;
  if (S.gv) assert.strictEqual(S.gv.rng, g.rng, 'le mandat retrouve le hasard de la partie');
  if (S.op) { assert.strictEqual(S.op.g, g, 'l\'opposition retrouve sa partie'); assert.strictEqual(S.op.rng, g.rng); }
}
/* Ce qui doit être identique en fin de parcours : tout l'état, sauf le détail des circonscriptions (jamais relu après la soirée électorale) */
function digest(S) {
  function clean(k, v) { return k === 'circs' || k === 'g' || k === '_cp' || k === '_cpTurn' || typeof v === 'function' ? undefined : v; }
  return JSON.stringify({ gv: S.gv, op: S.op, keep: S.keep, rng: S.g.rng.getState(), game: JSON.parse(E.saveGame(S.g)), learned: S.learned }, clean);
}

/* ---------- Les étapes des législatives ---------- */
function legisCampaign(S, o, save) {
  S.lc = LG.newCampaign(S.g, o); if (o.allies) S.lc.allies = o.allies.slice();
  save('lcamp');
  var cands = S.g.players.map(function (p) { return p.id; }).filter(function (p) { return p !== S.me && p !== S.lc.pres; }).sort(function (a, b) { return E.dist(a, S.me) - E.dist(b, S.me) || (a < b ? -1 : 1); });
  for (var k = 0; k < cands.length && S.lc.offersLeft > 0; k++) LG.offerAlly(S.g, S.lc, cands[k]);
  for (var t = 0; t < D.LEGIS.campaign.turns; t++) {
    var cls = LG.projection(S.g, S.lc).cls, regs = D.REGIONS.slice().sort(function (a, b) { return cls.regions[b.id].open - cls.regions[a.id].open || (a.id < b.id ? -1 : 1); });
    ['meeting', 'vedette', 'mobilise'].forEach(function (ty, j) { var a = { type: ty, rid: regs[j].id }; if (LG.actError(S.g, S.lc, a)) a = { type: 'clip', rid: null }; LG.act(S.g, S.lc, a); });
    LG.endTurn(S.g, S.lc);
    save(t === D.LEGIS.campaign.turns - 1 ? 'vote1' : 'lcamp');
  }
  var ctx = LG.prepare(S.g, LG.optsOf(S.lc, { rng: S.g.rng })), r1 = LG.round1(ctx);
  return LG.round2(ctx, r1, { withdraw: {}, pact: null, barrage: null });
}
/* ---------- Une année de mandat, saison par saison, avec une sauvegarde au début de chacune ---------- */
function pickOpt(opts, gv) { return opts[gv.deficit > G.C.target(gv.year) ? 0 : opts.length - 1]; }
function card(gv, S) {
  if (gv.cardDone === gv.year * 10 + S.step) return;
  gv.cardSlot = S.step;
  var c = CD.draw(gv);
  if (c) { c = CD.judged(gv, c); CD.apply(gv, c, gv.rng() < 0.5 ? 'left' : 'right'); }
  gv.cardDone = gv.year * 10 + S.step;
}
function year(S, save) {
  S.step = 0; save('gov');
  var gv = S.gv; card(gv, S);
  var pend = gv.measures.filter(function (m) { return m.status === 'pending'; })[0];
  if (pend) {
    var v = G.vote(gv, pend.id);
    if (v.passed) G.adopt(gv, pend.id, false);
    else if (!gv.used493y) {
      gv.used493 = true; gv.used493y = true;
      var c = G.censure(gv);
      if (c.passed) { G.reject(gv, pend.id); G.governmentFalls(gv); } else { G.adopt(gv, pend.id, false); gv.survived = true; gv.popBonus -= 2; }
    } else G.reject(gv, pend.id);
  } else {
    var cat = G.lawCatalog(gv).recettes[0];
    if (cat) { G.addExtra(gv, cat); if (G.vote(gv, cat).passed) G.adopt(gv, cat, false); else G.reject(gv, cat); }
  }
  if (CB.canReshuffle(gv) && gv.year === 2) { var pool = CB.reshufflePool(gv); if (pool.length) CB.reshuffle(gv, 'eco', pool[0]); }

  S.step = 1; save('gov'); gv = S.gv; card(gv, S);
  var sg = G.strikeEvent(gv); if (sg) G.applyOpt(gv, sg.opts[0]);
  [0, 1].forEach(function (n) { var ev = G.drawEvent(gv, n); G.applyOpt(gv, ev.opts[0]); });
  var mev = gv.cabinet ? CB.event(gv) : null; if (mev) CB.applyEvent(gv, mev, mev.opts[0]);

  S.step = 2; save('gov'); gv = S.gv; card(gv, S);
  if (gv.year === 1) G.applyFinancing(gv);
  G.drawCards(gv).forEach(function (c) { G.applyOpt(gv, pickOpt(c.opts, gv)); });
  gv.announced = gv.deficit;

  S.step = 3; save('gov'); gv = S.gv; card(gv, S);
  G.endYear(gv); gv.used493y = false;
  S.step = 0;
}

/* ---------- Les parcours ---------- */
function presidentPath(seed, save, S, dissolveAt) {
  S.me = S.g.winner; S.gv = G.create(S.g, S.me, { manual: true }); S.step = -1;
  var res = legisCampaign(S, { pres: S.me, margin: S.gv.margin, loser: S.gv.loser }, save);
  G.setLegis(S.gv, res); S.lc = null; S.lopt = null;
  save('afterLegis'); S.step = 0;
  save('cabinet');
  CB.start(S.gv); CB.form(S.gv, CB.suggest(S.gv));
  while (!S.gv.over) {
    year(S, save);
    if (S.gv.year === dissolveAt && G.canDissolve(S.gv)) { G.dissolve(S.gv, S.g); S.step = 0; save('gov'); }
  }
  save('gov');
  S.verdict = G.verdict(S.gv);
}
function opposition(S, res, pres, save, yr) {
  S.op = OP.create(S.g, S.me, pres, res); S.op.year = yr; S.op.legisYear = yr;
  S.gv = { pid: pres, rng: S.g.rng, oppo: true, legis: res, seats: res.seats };
  save('oppo');
  while (!S.op.over) {
    var op = S.op, q = OP.quarter(op);
    if (q === 'loi' && OP.govLaw(op)) OP.voteGovLaw(op, OP.fit(op, OP.govLaw(op)) > 0 ? 'pour' : 'contre');
    if (q === 'crise') { var ev = OP.crisis(op); OP.reactCrisis(op, ev, 'plan'); }
    if (q === 'niche' && OP.nicheChoices(op).length) OP.voteNiche(op, OP.nicheChoices(op)[0].id);
    if (q === 'censure' && OP.canCensure(op) && OP.censureVote(op).pour >= 289) {
      var r = OP.censure(op);
      if (r.vote.passed && r.dissolve) {
        var before = OP.mySeats(op), pr = op.pres;
        S.gv = { pid: pr, rng: S.g.rng, oppo: true };
        var res2 = legisCampaign(S, { pres: pr, player: S.me, margin: 0, dissolution: true, presMult: G.dissolveMult(op.presPop), allies: op.myCamp.slice(1) }, save);
        S.gv.legis = res2; S.gv.seats = res2.seats;
        S.lopt = { oppo: true, end: 'censure', before: before, pres: pr };
        save('afterLegis');
        if (res2.focusSeats >= 289) return;   // Matignon : couvert par le parcours de cohabitation
        OP.afterLegis(S.op, res2); S.lc = null; S.lopt = null;
      }
    }
    OP.next(S.op); save('oppo');
  }
  S.verdict = OP.verdict(S.op);
}
function oppositionPath(seed, save, S) {
  var pres = S.g.winner, sec = S.g.result.second;
  S.me = sec ? (sec.a === pres ? sec.b : sec.a) : S.g.result.first.filter(function (x) { return x.pid !== pres; })[0].pid;
  S.gv = { pid: pres, rng: S.g.rng, oppo: true };
  var res = legisCampaign(S, { pres: pres, player: S.me, margin: 0.02, loser: S.me, partners: [] }, save);
  S.gv.legis = res; S.gv.seats = res.seats; S.lopt = { oppo: true, pres: pres };
  save('afterLegis');
  S.lc = null; S.lopt = null;
  opposition(S, res, pres, save, 1);
}
/* La cohabitation : le résultat est forcé en faveur du joueur, puis le président dissout (le mandat est mis de côté dans keep) */
function cohabPath(seed, save, S) {
  var pres = S.g.winner, sec = S.g.result.second;
  S.me = sec ? (sec.a === pres ? sec.b : sec.a) : S.g.result.first.filter(function (x) { return x.pid !== pres; })[0].pid;
  S.gv = { pid: pres, rng: S.g.rng, oppo: true };
  var res = legisCampaign(S, { pres: pres, player: S.me, margin: 0.02, loser: S.me, partners: [] }, save);
  S.gv = G.create(S.g, S.me, { manual: true }); G.setLegisCohab(S.gv, res, pres); S.gv.cohab.legisYear = 1; S.lc = null; S.step = 0;
  save('cabinet');
  CB.start(S.gv); CB.form(S.gv, CB.suggest(S.gv));
  assert.ok(S.gv.cabinet.imposed, 'en cohabitation, Matignon est imposé');
  save('gov');
  assert.strictEqual(S.gv.cabinet.posts.pm, S.gv.cabinet.imposed, 'le Premier ministre reste le même objet dans posts et imposed');
  assert.strictEqual(S.gv.seats, S.gv.legis.seats, 'gv.seats reste gv.legis.seats');
  year(S, save);
  // le président dissout : le mandat est mis de côté, ton camp garde la majorité
  S.keep = S.gv; S.keep.cohab.dissolved = true;
  S.gv = { pid: pres, rng: S.g.rng, oppo: true };
  var res2 = legisCampaign(S, { pres: pres, player: S.me, margin: 0, dissolution: true, presMult: G.dissolveMult(40), allies: S.keep.allies }, save);
  S.gv.legis = res2; S.gv.seats = res2.seats; S.lopt = { oppo: true, end: 'cohab', pres: pres };
  save('afterLegis');
  S.gv = S.keep; S.keep = null; S.lc = null; S.lopt = null;
  G.setLegisCohab(S.gv, res2, pres); S.gv.cohab.dissolved = true; S.gv.cohab.legisYear = S.gv.year;
  while (!S.gv.over) year(S, save);
  save('gov');
  S.verdict = G.verdict(S.gv);
}

function both(name, path, seed, extra) {
  function run(withHops) {
    var S = { g: campaign(seed), gv: null, op: null, keep: null, lc: null, lopt: null, learned: { budget: true }, step: 0, me: null };
    function save(stage) { if (withHops) hop(S, stage); }
    path(seed, save, S, extra);
    return S;
  }
  var a = run(false), b = run(true);
  assert.strictEqual(digest(b), digest(a), name + ' (graine ' + seed + ') : le mandat repris diverge du mandat ininterrompu');
  assert.deepStrictEqual(b.verdict, a.verdict);
  assert.ok(a.verdict || a.op || a.gv, name + ' va au bout');
}
for (var i = 0; i < N; i++) {
  both('quinquennat', presidentPath, SEED0 + i, 0);
  both('dissolution', presidentPath, SEED0 + 50 + i, 3);
  both('opposition', oppositionPath, SEED0 + 100 + i);
  both('cohabitation', cohabPath, SEED0 + 150 + i);
}

/* ---------- Les liens entre objets, et les valeurs que JSON perd ---------- */
(function () {
  var g = { rng: function () { return 0; } }, shared = { a: 1 }, cyc = { name: 'x' }; cyc.self = cyc;
  var st = { p: shared, q: [shared, shared], list: [1, 2], again: null, g: g, rng: g.rng, inf: Infinity, nan: NaN, cyc: cyc, f: function () {}, un: undefined, circs: [1, 2, 3] };
  st.again = st.list;
  var o = MS.decode(JSON.parse(JSON.stringify(MS.encode(st, g))), g);
  assert.strictEqual(o.p, o.q[0]); assert.strictEqual(o.q[0], o.q[1]); assert.strictEqual(o.list, o.again); assert.deepStrictEqual(o.list, [1, 2]);
  assert.strictEqual(o.g, g); assert.strictEqual(o.rng, g.rng); assert.strictEqual(o.inf, Infinity); assert.ok(isNaN(o.nan)); assert.strictEqual(o.cyc.self, o.cyc);
  assert.ok(!('f' in o) && !('un' in o) && !('circs' in o));
})();

/* ---------- Sauvegardes abîmées ou anciennes ---------- */
function fakeStorage(limit) {
  var m = {};
  return { used: function () { return Object.keys(m).reduce(function (t, k) { return t + m[k].length; }, 0); },
    getItem: function (k) { return k in m ? m[k] : null; }, removeItem: function (k) { delete m[k]; },
    setItem: function (k, v) { if (limit != null && this.used() - (m[k] || '').length + v.length > limit) { var e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } m[k] = String(v); } };
}
(function () {
  var S = { g: campaign(SEED0), gv: null, op: null, keep: null, lc: null, lopt: null, learned: {}, step: 0, me: null };
  presidentPath(SEED0, function (stage) { if (stage === 'gov' && !S.good) S.good = MS.pack({ stage: stage, me: S.me, info: 'Année 1', g: S.g, state: { gv: S.gv, op: null, keep: null, lc: null, lopt: null, learned: {}, step: S.step } }); }, S, 0);
  var good = S.good, st = fakeStorage();
  assert.ok(MS.write(good, st).ok); var r = MS.read(st); assert.ok(r.sv, 'la sauvegarde saine se relit'); assert.strictEqual(r.sv.stage, 'gov');

  function refused(label, change) {
    var x = JSON.parse(JSON.stringify(good)), s = fakeStorage(), raw = change(x);
    s.setItem(MS.KEY, typeof raw === 'string' ? raw : JSON.stringify(x));
    var rd = MS.read(s);
    assert.ok(rd && rd.bad, label + ' : devrait être écartée');
  }
  refused('texte tronqué', function () { return JSON.stringify(good).slice(0, 500); });
  refused('pas du JSON', function () { return 'n\'importe quoi'; });
  refused('null', function () { return 'null'; });
  refused('tableau', function () { return '[]'; });
  refused('ancienne version', function (x) { x.v = 0; });
  refused('version future', function (x) { x.v = MS.V + 1; });
  refused('étape inconnue', function (x) { x.stage = 'dragons'; });
  refused('parti inconnu', function (x) { x.me = 'ZZ'; });
  refused('partie absente', function (x) { delete x.game; });
  refused('partie illisible', function (x) { x.game = '{oups'; });
  refused('état absent', function (x) { delete x.state; });
  refused('mandat absent', function (x) { delete x.state.gv; });
  refused('saison hors limites', function (x) { x.state.step = 9; });
  refused('déficit non chiffré', function (x) { x.state.gv.deficit = 'beaucoup'; });
  refused('satisfaction incomplète', function (x) { x.state.gv.sat = {}; });
  refused('mesure disparue du jeu', function (x) { x.state.gv.measures[0].id = 'mesure-supprimee'; });
  refused('conjoncture absente', function (x) { delete x.state.gv.eco; });
  refused('renvoi cassé', function (x) { x.state.gv.sat = { $r: 99999 }; });
  refused('gouvernement absent', function (x) { delete x.state.gv.cabinet; });
  assert.strictEqual(MS.read(fakeStorage()), null, 'pas de sauvegarde : rien à dire');

  /* La limite de place : l'ancienne copie reste si la nouvelle ne rentre pas, et l'ancienne ne compte pas si elle est remplacée */
  var size = JSON.stringify(good).length, tight = fakeStorage(size + 10);
  assert.ok(MS.write(good, tight).ok, 'tient juste');
  assert.ok(MS.write(good, tight).ok, 'se remplace elle-même');
  var big = JSON.parse(JSON.stringify(good)); big.info = new Array(1000).join('x');
  var w = MS.write(big, tight);
  assert.ok(!w.ok && w.full, 'trop gros : refusé, signalé');
  assert.ok(MS.read(tight).sv && MS.read(tight).sv.info === good.info, 'la sauvegarde d\'avant reste intacte');
  var huge = JSON.parse(JSON.stringify(good)); huge.info = new Array(MS.MAX_CHARS + 10).join('x');
  assert.ok(MS.write(huge, fakeStorage()).full, 'au-delà de la limite, on n\'essaie même pas');
  var broken = { getItem: function () { throw new Error('bloqué'); }, setItem: function () { throw new Error('bloqué'); }, removeItem: function () { throw new Error('bloqué'); } };
  assert.ok(!MS.write(good, broken).ok, 'un stockage bloqué ne plante pas');
  assert.strictEqual(MS.read(broken), null); MS.clear(broken);
  assert.ok(size < MS.MAX_CHARS);
})();
assert.ok(maxSize > 0 && maxSize < MS.MAX_CHARS, 'la sauvegarde tient dans la limite');
console.log('✓ Sauvegarde du mandat : ' + hops + ' allers-retours, reprises identiques sur ' + N + ' graines et 4 parcours, plus grosse sauvegarde ' + Math.round(maxSize / 1024) + ' Ko.');

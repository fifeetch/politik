/* Politik — v2.7 : l'opposition (règles sans affichage).
   Tu as perdu la présidentielle : tu deviens chef de ton parti dans l'opposition, pour 5 ans, trimestre par trimestre.
   Ce qui compte : ton score (les intentions de vote pour la prochaine présidentielle) et la popularité du président.
   Réglages dans data.js (OPPO). */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var E = node ? require('./engine.js') : root.PolitikEngine;
  var O = D.OPPO;
  var Q = ['loi', 'crise', 'niche', 'censure'];
  var QNAME = { loi: 'Printemps : la loi du gouvernement', crise: 'Été : l\'actualité', niche: 'Automne : ta proposition de loi', censure: 'Hiver : la motion de censure' };
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function gauss(rng) { var u = Math.max(1e-9, rng()), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* res : le résultat des législatives (voir legis.js), me : ton parti, pres : le parti du président */
  function create(g, me, pres, res) {
    var first = {}; (g.result.first || []).forEach(function (x) { first[x.pid] = 100 * x.pct; });
    var plP = E.player(g, pres), plM = E.player(g, me);
    var op = { g: g, rng: g.rng, me: me, pres: pres, year: 1, qi: 0, over: false, seats: res.seats, legis: res,
      presCamp: res.outcome.camp.slice(), myCamp: [me].concat((res.unions.filter(function (u) { return u.id === 'joueur'; })[0] || { parties: [me] }).parties.filter(function (p) { return p !== me; })),
      score: first[me] || 5, score0: first[me] || 5, scores: first, presPop: O.presPop0, coalition: null, coalYear: 0,
      govLaws: (plP && plP.programme ? plP.programme : E.PARTY[pres].programme).slice(), myLaws: (plM && plM.programme ? plM.programme : E.PARTY[me].programme).map(function (id) { return { id: id, status: 'pending' }; }),
      lawsDone: [], pms: 1, legisYear: 1, fell: 0, censures: 0, log: [], history: [] };
    op.ap = E.segmentAppeal(((plM && plM.programme) || E.PARTY[me].programme).concat((plM && plM.financing) || []));
    return op;
  }
  function shuffle(a, rng) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function quarter(op) { return Q[op.qi]; }
  function qname(op) { return QNAME[quarter(op)]; }
  function mySeats(op) { var s = 0; op.myCamp.forEach(function (p) { s += op.seats[p] || 0; }); return s; }
  function withCoalition(op) { return mySeats(op) + (op.coalition ? op.seats[op.coalition] || 0 : 0); }
  function presSeats(op) { var s = 0; op.presCamp.forEach(function (p) { s += op.seats[p] || 0; }); return s; }
  function inPres(op, gid) { return op.presCamp.indexOf(gid) >= 0; }
  function inMine(op, gid) { return op.myCamp.indexOf(gid) >= 0 || gid === op.coalition; }
  /* Ce que tes électeurs pensent d'une mesure : de −1 (la rejettent) à +1 (l'adorent) */
  function fit(op, mid) {
    var m = E.measure(mid), f = 0, w = 0;
    D.SEGMENTS.forEach(function (sg) { var a = Math.max(0, op.ap[sg.id] || 0) + 0.2; f += a * ((m.fans || {})[sg.id] || 0); w += a; });
    return clamp(f / Math.max(1, w) * 1.6, -1, 1);
  }
  function move(op, d) { var x = d + O.noise * gauss(op.rng) * (d ? 1 : 0.5); op.score = clamp(op.score + x, 0.5, 48); return x; }

  /* ---------- Le printemps : la loi du gouvernement ---------- */
  function govLaw(op) { return op.govLaws.length ? op.govLaws[0] : null; }
  /* Le vote d'un groupe sur un texte, vu de ton camp (stance : pour / abst / contre) */
  function groupVote(op, gid, mid, author, myStance) {
    if (inMine(op, gid)) return myStance;
    var m = E.measure(mid), P = E.PARTY[gid], inProg = P.programme.indexOf(mid) >= 0 || (P.financing || []).indexOf(mid) >= 0;
    if (author === 'gov') {
      if (inPres(op, gid)) return 'pour';
      var d = E.dist(gid, op.pres), sc = 2 - d + (inProg ? 3 : 0) + (m.theme && (P.cred[m.theme] || 0) >= 2 ? 1 : 0) - (op.presPop < 40 ? 1 : 0);
      return sc >= 1.5 ? 'pour' : sc >= 0 ? 'abst' : 'contre';
    }
    // ta proposition de loi : la majorité présidentielle la vote si c'est aussi son idée, sinon s'y oppose
    if (inPres(op, gid)) return inProg ? 'pour' : op.presPop < 35 ? 'abst' : 'contre';
    var d2 = E.dist(gid, op.me), sc2 = 2 - d2 + (inProg ? 3 : 0);
    return sc2 >= 1.5 ? 'pour' : sc2 >= 0 ? 'abst' : 'contre';
  }
  function tally(op, mid, author, myStance) {
    var r = { pour: 0, contre: 0, abst: 0, groups: [] };
    Object.keys(op.seats).forEach(function (gid) { var st = groupVote(op, gid, mid, author, myStance), n = op.seats[gid]; r[st] += n; r.groups.push({ id: gid, seats: n, stance: st }); });
    r.passed = r.pour > r.contre;
    return r;
  }
  function voteGovLaw(op, stance) {
    var mid = govLaw(op), f = fit(op, mid), v = tally(op, mid, 'gov', stance), d;
    d = stance === 'pour' ? O.lawFit * f - 0.1 : stance === 'contre' ? -O.lawFit * f + (op.presPop < 45 ? 0.15 : 0) : O.abstain;
    var real = move(op, d);
    op.presPop = clamp(op.presPop + (v.passed ? O.lawPass : O.lawFail), 5, 85);
    op.govLaws.shift(); op.lawsDone.push({ id: mid, passed: v.passed, stance: stance });
    return { mid: mid, fit: f, vote: v, delta: real };
  }
  /* ---------- L'été : l'actualité ---------- */
  var CRISES = [
    { id: 'canicule', title: 'Été caniculaire', text: 'Sécheresse, incendies, coupures d\'eau : le pays suffoque.', unity: true },
    { id: 'marches', title: 'Les marchés s\'inquiètent', text: 'Les taux d\'intérêt de la dette grimpent. Le gouvernement prépare un plan d\'économies.' },
    { id: 'ministre', title: 'L\'affaire du ministre', text: 'Un ministre du gouvernement est accusé d\'avoir menti sur son patrimoine.' },
    { id: 'bleus', title: 'Les Bleus champions !', text: 'L\'équipe de France remporte la Coupe du monde. Le pays est en liesse.', unity: true },
    { id: 'gilets', title: 'Colère des automobilistes', text: 'Des ronds-points occupés dans tout le pays contre le prix du carburant.' },
    { id: 'tracteurs', title: 'Les tracteurs sur le périph', text: 'Les agriculteurs encerclent Paris.' },
    { id: 'hopital', title: 'Les urgences craquent', text: 'Faute de soignants, des urgences ferment la nuit.' },
    { id: 'usine', title: 'Une usine ferme', text: 'Un grand site industriel annonce sa fermeture : 1 200 emplois menacés.' }
  ];
  function crisis(op) { return CRISES[((op.year - 1) * 3 + op.g.seed) % CRISES.length]; }
  function reactCrisis(op, ev, choice) {
    var d = choice === 'unite' ? (ev.unity ? O.crisisUnity : -0.1) : choice === 'denoncer' ? (ev.unity ? -0.3 : op.presPop < 50 ? O.crisisHit : 0) : O.crisisPlan * (op.score < 15 ? 1 : 0.6);
    op.presPop = clamp(op.presPop + (ev.unity ? 3 : choice === 'denoncer' ? -3 : -1), 5, 85);
    return { delta: move(op, d) };
  }
  /* ---------- L'automne : ta proposition de loi (le jour réservé à l'opposition) ---------- */
  function nicheChoices(op) { return op.myLaws.filter(function (x) { return x.status === 'pending'; }); }
  function voteNiche(op, mid) {
    var v = tally(op, mid, 'me', 'pour'), it = op.myLaws.filter(function (x) { return x.id === mid; })[0], d;
    if (v.passed) { it.status = 'adopted'; d = O.nichePass; op.presPop = clamp(op.presPop - 2, 5, 85); }
    else { it.status = 'rejected'; d = v.pour >= 0.8 * v.contre ? O.nicheClose : O.nicheLost; }
    return { mid: mid, vote: v, delta: move(op, d) };
  }
  /* ---------- L'hiver : la coalition et la motion de censure ---------- */
  function coalitionChance(op, gid) {
    if (inPres(op, gid) || op.myCamp.indexOf(gid) >= 0) return 0;
    var gap = Math.abs(E.PARTY[gid].pos - E.PARTY[op.me].pos);
    return clamp(D.LEGIS.allyAccept.filter(function (x) { return gap <= x.gap; })[0].p + (op.presPop < 40 ? 0.1 : 0), 0, 0.95);
  }
  function offerCoalition(op, gid) {
    if (op.coalYear === op.year) return { ok: false, text: 'Une seule proposition de coalition par an.' };
    op.coalYear = op.year;
    var ch = coalitionChance(op, gid), yes = op.rng() < ch;
    if (yes) { op.coalition = gid; if (E.dist(gid, op.me) >= 3) move(op, O.coalitionFar); }
    return { ok: true, accepted: yes, chance: ch };
  }
  function canCensure(op) { return withCoalition(op) >= O.signatures; }
  /* Qui vote la censure : ton camp et ta coalition, plus les groupes d'opposition assez loin du président (ou s'il est impopulaire) */
  function censureVote(op) {
    var pour = 0, groups = [];
    Object.keys(op.seats).forEach(function (gid) {
      var st;
      if (inMine(op, gid)) st = 'pour';
      else if (inPres(op, gid)) st = 'contre';
      else { var d = E.dist(gid, op.pres); st = (d >= 4 && op.presPop < 50) || (d === 3 && op.presPop < 35) || (d === 2 && op.presPop < 25) ? 'pour' : 'abst'; }
      if (st === 'pour') pour += op.seats[gid];
      groups.push({ id: gid, seats: op.seats[gid], stance: st });
    });
    return { pour: pour, passed: pour >= O.majority, groups: groups };
  }
  /* Après une censure votée : le président nomme un nouveau Premier ministre… ou dissout (pas dans l'année qui suit des législatives) */
  function canDissolve(op) { return op.year - op.legisYear >= 1; }
  function censure(op) {
    var v = censureVote(op), out = { vote: v };
    op.censures++;
    if (v.passed) {
      op.fell++; op.presPop = clamp(op.presPop + O.censurePres, 5, 85); out.delta = move(op, O.censureFall);
      out.dissolve = canDissolve(op) && op.presPop >= O.dissolveIfPop;
      if (!out.dissolve) op.pms++;
    } else out.delta = move(op, v.pour >= 250 ? O.censureClose : O.censureFlop);
    return out;
  }
  /* Après une dissolution : les nouvelles législatives (res) */
  function afterLegis(op, res) {
    op.seats = res.seats; op.legis = res; op.presCamp = res.outcome.camp.slice(); op.legisYear = op.year;
    op.myCamp = [op.me].concat((res.unions.filter(function (u) { return u.id === 'joueur'; })[0] || { parties: [op.me] }).parties.filter(function (p) { return p !== op.me; }));
    if (op.coalition && op.myCamp.indexOf(op.coalition) >= 0) op.coalition = null;
  }

  /* ---------- Le temps qui passe ---------- */
  function next(op) {
    op.qi++;
    if (op.qi >= Q.length) {
      op.qi = 0; op.presPop = clamp(op.presPop - O.presWear, 5, 85);
      // l'usure du président profite à toute l'opposition, pas seulement à toi (en proportion de chacun)
      var wear = Math.max(0, O.presPop0 - op.presPop) / 100 * O.oppoDrift;
      Object.keys(op.scores).forEach(function (pid) { if (pid !== op.pres && pid !== op.me) op.scores[pid] *= 1 + wear * (0.5 + op.rng()); });
      op.score *= 1 + wear;
      op.history.push({ year: op.year, score: Math.round(op.score * 10) / 10, presPop: op.presPop });
      op.year++; op.coalition = null;
      if (op.year > O.years) op.over = true;
    }
  }
  /* Le bilan : ta place dans les intentions de vote pour la prochaine présidentielle */
  function standings(op) {
    var out = [];
    Object.keys(op.scores).forEach(function (pid) {
      var s = pid === op.me ? op.score : pid === op.pres ? op.scores[pid] * (0.8 + 0.5 * op.presPop / 100) : op.scores[pid];
      out.push({ pid: pid, score: s });
    });
    var tot = 0; out.forEach(function (x) { tot += x.score; }); out.forEach(function (x) { x.pct = x.score / tot; });
    return out.sort(function (a, b) { return b.score - a.score; });
  }
  function verdict(op) {
    var st = standings(op), rank = 1 + st.map(function (x) { return x.pid; }).indexOf(op.me);
    var lead = rank === 1 ? (st[0].pct - st[1].pct) * 100 : 0;   // favori : en tête avec au moins 2 points d'avance
    return { standings: st, rank: rank, pct: st[rank - 1].pct, gain: op.score - op.score0, verdict: rank === 1 && lead >= 2 ? 'favori' : rank <= 3 ? 'course' : 'distance',
      adopted: op.myLaws.filter(function (x) { return x.status === 'adopted'; }).length, fell: op.fell };
  }

  var API = { Q: Q, QNAME: QNAME, CRISES: CRISES, create: create, quarter: quarter, qname: qname, mySeats: mySeats, withCoalition: withCoalition, presSeats: presSeats,
    fit: fit, govLaw: govLaw, tally: tally, voteGovLaw: voteGovLaw, crisis: crisis, reactCrisis: reactCrisis, nicheChoices: nicheChoices, voteNiche: voteNiche,
    coalitionChance: coalitionChance, offerCoalition: offerCoalition, canCensure: canCensure, censureVote: censureVote, censure: censure, canDissolve: canDissolve,
    afterLegis: afterLegis, next: next, standings: standings, verdict: verdict };
  if (node) module.exports = API; else root.PolitikOppo = API;
})(this);

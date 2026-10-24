/* Politik — moteur de jeu (règles v1.0 : poids réels, vote blanc, abstention, mobilisation, programme, affaires, enquêtes, thèmes, candidat, militants, dilemmes, casseroles, crises, alliances, élection à deux tours).
   Aucune dépendance à l'affichage : tout l'état de la partie est dans un objet « g ». */
(function (root) {
  var D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.PolitikData;
  var R = D.RULES;

  /* ---------- Outils ---------- */
  function makeRng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var REG = {}; D.REGIONS.forEach(function (r) { REG[r.id] = r; });
  var PARTY = {}; D.PARTIES.forEach(function (p) { PARTY[p.id] = p; });

  function player(g, pid) { for (var i = 0; i < g.players.length; i++) if (g.players[i].id === pid) return g.players[i]; return null; }
  function pids(g) { return g.players.map(function (p) { return p.id; }); }
  function cubes(g, rid, pid) { return g.regions[rid].cubes[pid] || 0; }
  function minControl(pid) { return pid === 'MN' ? 4 : R.minControl; }
  function dist(a, b) { return Math.abs(PARTY[a].pos - PARTY[b].pos); }
  function allyOf(g, pid) { return (g.alliances && g.alliances[pid]) || null; }

  /* ---------- Thèmes (v0.3) ---------- */
  var THEME = {}; D.THEMES.forEach(function (t) { THEME[t.id] = t; });
  /* Crédibilité d'un parti sur un thème (0 à 2). Elle monte quand on en parle souvent (v0.4). */
  function cred(g, pid, th) {
    var pl = g && player(g, pid);
    if (pl && pl.cred) return pl.cred[th] || 0;
    return (PARTY[pid].cred && PARTY[pid].cred[th]) || 0;
  }
  function isHot(g, th) { return (g.hot || []).indexOf(th) >= 0; }
  /* Un marqueur sur la carte (grève, incendie…) rend un thème « à la une » dans sa région */
  function markerAt(g, rid, th) {
    var m = (g.markers || []).filter(function (x) { return x.rid === rid && (!th || x.theme === th); });
    return m[0] || null;
  }
  function hotHere(g, rid, th) { return isHot(g, th) || !!(rid && markerAt(g, rid, th)); }
  function concerns(rid, th) { return REG[rid].concerns.indexOf(th) >= 0; }
  /* Impact d'un message de 0 à 4 : crédibilité (0-2) + préoccupation de la région (0-1) + actualité (0-1) */
  function impact(g, pid, rid, th) {
    return cred(g, pid, th) + (rid && concerns(rid, th) ? 1 : 0) + (hotHere(g, rid, th) ? 1 : 0);
  }
  /* Le meilleur thème d'un parti pour une région (sert aux choix par défaut et à l'IA) */
  function bestTheme(g, pid, rid) {
    var best = null, bv = -1;
    D.THEMES.forEach(function (t) { var v = impact(g, pid, rid, t.id); if (v > bv) { bv = v; best = t.id; } });
    return best;
  }
  /* ---------- v0.7 : le programme ---------- */
  var MEAS = {}; D.MEASURES.concat(D.FUNDING).forEach(function (m) { MEAS[m.id] = m; });
  function baseCred(pid, th) { return Math.max(0, ((PARTY[pid].cred || {})[th] || 0) - 1); }
  /* Crédibilité qu'un programme donnerait : socle du parti + 1 par mesure sur le thème (2 au plus) */
  function programmeCred(pid, ids) {
    var c = {};
    D.THEMES.forEach(function (t) { c[t.id] = baseCred(pid, t.id); });
    (ids || []).forEach(function (id) { var m = MEAS[id]; if (m && m.theme) c[m.theme] = Math.min(2, c[m.theme] + 1); });
    return c;
  }
  function programmeCost(ids) { var s = 0; (ids || []).forEach(function (id) { s += MEAS[id] ? MEAS[id].cost : 0; }); return s; }
  /* Fixe le programme d'un parti (ids[0] = mesure phare). À appeler avant le 1er tour. */
  function setProgramme(g, pid, ids, fin) {
    var pl = player(g, pid);
    pl.programme = ids.slice(0, R.programmeSize);
    pl.financing = (fin || PARTY[pid].financing || []).slice(0, R.fundingMax);
    pl.phare = pl.programme[0];
    pl.cred = programmeCred(pid, pl.programme);
    pl.budget = programmeCost(pl.programme.concat(pl.financing));
    pl.echoCache = null; pl.echoRank = null;
  }
  /* v0.8 : ce que chaque groupe de population pense d'un ensemble de mesures (somme des « fans ») */
  function segmentAppeal(ids) {
    var a = {}; D.SEGMENTS.forEach(function (sg) { a[sg.id] = 0; });
    (ids || []).forEach(function (id) { var m = MEAS[id]; if (m && m.fans) Object.keys(m.fans).forEach(function (k) { a[k] += m.fans[k]; }); });
    return a;
  }
  /* Écho d'un programme dans une région = attrait pour chaque groupe × part du groupe dans la région (Insee) */
  /* Moyenne nationale de chaque groupe (pondérée par le poids des régions) */
  var NATPOP = (function () {
    var n = {}, w = 0; D.SEGMENTS.forEach(function (sg) { n[sg.id] = 0; });
    D.REGIONS.forEach(function (r) { w += r.pts; D.SEGMENTS.forEach(function (sg) { n[sg.id] += r.pop[sg.id] * r.pts; }); });
    D.SEGMENTS.forEach(function (sg) { n[sg.id] /= w; });
    return n;
  })();
  /* Écho : le programme rapporte plus là où les groupes qu'il séduit sont plus nombreux que la moyenne nationale */
  function echoOf(ids, rid) {
    var a = segmentAppeal(ids), pop = REG[rid].pop, e = 0;
    D.SEGMENTS.forEach(function (sg) { e += a[sg.id] * (pop[sg.id] - NATPOP[sg.id]) / R.echoScale; });
    return e;
  }
  function echo(g, pid, rid) {
    var pl = player(g, pid);
    if (!pl || !pl.programme) return 0;
    if (!pl.echoCache) { pl.echoCache = {}; D.REGIONS.forEach(function (r) { pl.echoCache[r.id] = echoOf(pl.programme.concat(pl.financing || []), r.id); }); }
    return pl.echoCache[rid];
  }
  /* Chaque programme a ses régions de cœur (+1 cube en Meeting) et ses régions hostiles (−1) */
  function echoRanks(g, pid) {
    var pl = player(g, pid);
    if (!pl || !pl.programme) return null;
    if (!pl.echoRank) {
      var order = D.REGIONS.slice().sort(function (a, b) { return echo(g, pid, b.id) - echo(g, pid, a.id); }).map(function (r) { return r.id; });
      pl.echoRank = { good: order.slice(0, R.echoGoodN), bad: order.slice(-R.echoBadN) };
    }
    return pl.echoRank;
  }
  function echoBonus(g, pid, rid) {
    var k = echoRanks(g, pid); if (!k) return 0;
    return k.good.indexOf(rid) >= 0 ? 1 : k.bad.indexOf(rid) >= 0 ? -1 : 0;
  }
  /* Au 1er tour : mesures choc et budget non financé produisent leurs effets */
  function applyProgrammes(g) {
    var out = [];
    g.players.forEach(function (pl) {
      if (!pl.programme) setProgramme(g, pl.id, PARTY[pl.id].programme);
      pl.echoCache = null; pl.echoRank = null;
      var o = { pid: pl.id, budget: pl.budget, over: Math.max(0, pl.budget - R.budgetCap), cas: 0, choc: [], echo: [] };
      // le programme plaît : +1 cube dans les 3 régions où il a le plus d'écho
      D.REGIONS.slice().sort(function (a, b) { return echo(g, pl.id, b.id) - echo(g, pl.id, a.id); }).slice(0, 3).forEach(function (r) {
        if (echo(g, pl.id, r.id) > 0) { addCubes(g, r.id, pl.id, 1); o.echo.push(r.id); }
      });
      pl.programme.forEach(function (id) {
        var m = MEAS[id]; if (!m.choc) return;
        bestRegions(g, pl.id, 2, function (r) { return concerns(r.id, m.theme); }, 1).forEach(function (rid) { addCubes(g, rid, pl.id, 1); });
        pl.cas += 1; o.cas += 1; o.choc.push(m.name);
      });
      if (o.over > 0) {
        var c = Math.ceil(o.over / R.budgetCasStep); pl.cas += c; o.cas += c;
        g.pending.push({ turn: 3, pid: pl.id, chance: 1, affair: 'budget' });
      }
      pl.cas = Math.min(R.casseroleMax, pl.cas);
      out.push(o);
    });
    updateAllControl(g);
    return out;
  }
  function measure(id) { return MEAS[id]; }

  function terrainCubes(g, pid, rid, th) {
    var n = R.terrainCubes[impact(g, pid, rid, th)];
    if (pid === 'SM' && cubes(g, rid, pid) >= 5) n += 1;
    var pl = player(g, pid);
    if (pl && pl.phare && MEAS[pl.phare].theme === th) n += R.pharBonus;   // mesure phare
    if (pl && pl.programme) n += echoBonus(g, pid, rid);           // v0.8 : le programme plaît (ou déplaît) aux habitants
    if (pl && pl.momentum) n = Math.max(1, n + pl.momentum);   // dynamique : ±1 cube en Meeting
    n = Math.max(1, n);
    return n;
  }
  function mediaCubes(g, pid, rid, th) {
    var n = R.mediaCubes[impact(g, pid, rid, th)], prof = REG[rid].profile;
    if (n > 0 && pid === 'VP' && prof === 'urbaine') n++;
    if (n > 0 && pid === 'MN' && prof === 'industrielle') n++;
    return n;
  }
  /* Nouveau tour : un thème fait l'actu (celui de l'événement, sinon au hasard), plus les thèmes imposés */
  function pickNews(g, theme) {
    var th = theme || D.THEMES[Math.floor(g.rng() * D.THEMES.length)].id;
    var lines = D.HEADLINES[th];
    g.news = { theme: th, headline: lines[Math.floor(g.rng() * lines.length)], imposed: (g.nextHot || []).slice() };
    g.hot = [th];
    g.news.imposed.forEach(function (x) { if (g.hot.indexOf(x.theme) < 0) g.hot.push(x.theme); });
    g.nextHot = [];
  }

  function addCubes(g, rid, pid, n) {
    var c = g.regions[rid].cubes;
    var before = c[pid] || 0;
    var after = Math.max(0, Math.min(R.maxCubes, before + n));
    c[pid] = after;
    return after - before;
  }

  /* ---------- Contrôle des régions ---------- */
  function updateControl(g, rid) {
    var reg = g.regions[rid];
    var best = -1, leaders = [];
    pids(g).forEach(function (pid) {
      var n = cubes(g, rid, pid);
      if (n > best) { best = n; leaders = [pid]; } else if (n === best) leaders.push(pid);
    });
    var prev = reg.controller;
    if (leaders.length === 1 && best >= minControl(leaders[0])) reg.controller = leaders[0];
    else if (prev && leaders.indexOf(prev) >= 0 && best >= minControl(prev)) reg.controller = prev;
    else reg.controller = null;
    return reg.controller !== prev;
  }
  function updateAllControl(g) { D.REGIONS.forEach(function (r) { updateControl(g, r.id); }); }

  function controlledPoints(g, pid) {
    var s = 0; D.REGIONS.forEach(function (r) { if (g.regions[r.id].controller === pid) s += r.pts; }); return s;
  }
  function controlledRegions(g, pid) {
    return D.REGIONS.filter(function (r) { return g.regions[r.id].controller === pid; });
  }
  function totalCubes(g, pid) {
    var s = 0; D.REGIONS.forEach(function (r) { s += cubes(g, r.id, pid); }); return s;
  }
  function strongestRegion(g, pid, filter) {
    var best = null, bn = 0;
    D.REGIONS.forEach(function (r) {
      if (filter && !filter(r)) return;
      var n = cubes(g, r.id, pid);
      if (n > bn || (n === bn && n > 0 && best && r.pts > REG[best].pts)) { bn = n; best = r.id; }
    });
    return best;
  }
  /* ---------- Votes et sondages ----------
     Chaque région vote selon ses cubes, pondérée par ses points (sa population).
     Les cubes du parti qui contrôle la région comptent un peu plus (prime au sortant). */
  /* v1.0 : électeurs d'une région (en millions) — inscrits, votants, suffrages exprimés */
  function regionVoters(g, rid) {
    var r = REG[rid], reg = g.regions[rid] || {};
    var ins = reg.ins != null ? reg.ins : r.ins;
    var abst = reg.abst != null ? reg.abst : r.abst / 100 * R.round1Abst;
    var blank = reg.blank != null ? reg.blank : (r.blanc + r.nuls) / 100 * R.round1Blank;
    var votants = ins * (1 - abst);
    return { ins: ins, abst: abst, blank: blank, votants: votants, blancs: votants * blank, exprimes: votants * (1 - blank) };
  }
  function turnoutStats(g) {
    var t = { ins: 0, votants: 0, blancs: 0, exprimes: 0 };
    D.REGIONS.forEach(function (r) { var x = regionVoters(g, r.id); t.ins += x.ins; t.votants += x.votants; t.blancs += x.blancs; t.exprimes += x.exprimes; });
    t.participation = t.votants / t.ins; t.abstention = 1 - t.participation; t.blankPct = t.blancs / t.votants;
    return t;
  }
  function votes(g, withObjectives) {
    var v = {}; g.players.forEach(function (p) { v[p.id] = 0; });
    var totalExp = 0;
    D.REGIONS.forEach(function (r) {
      var reg = g.regions[r.id], T = 0, w = {}, ex = regionVoters(g, r.id).exprimes;
      totalExp += ex;
      g.players.forEach(function (p) { w[p.id] = cubes(g, r.id, p.id) * (reg.controller === p.id ? R.incumbentBonus : 1); T += w[p.id]; });
      if (T > 0) g.players.forEach(function (p) { v[p.id] += ex * w[p.id] / T; });
    });
    // électorat très mobilisé aux deux bouts de l'axe (même règle à gauche et à droite)
    if (withObjectives) g.players.forEach(function (p) {
      var o = D.OBJECTIVES.filter(function (x) { return x.id === p.objective; })[0];
      if (objectiveMet(g, p.id, p.objective)) v[p.id] += o.bonus * R.objectiveVotes * totalExp / 65;
    });
    return v;
  }
  function percents(v) {
    var s = 0; Object.keys(v).forEach(function (k) { s += v[k]; });
    return Object.keys(v).map(function (k) { return { pid: k, votes: v[k], pct: s ? v[k] / s : 0 }; })
      .sort(function (a, b) { return b.pct - a.pct; });
  }
  function poll(g) { return percents(votes(g, false)); }
  function ranking(g) { return poll(g).map(function (x) { return x.pid; }); }
  function leader(g) {
    var p = poll(g);
    return p[0].pct > p[1].pct + 0.005 ? p[0].pid : null;
  }
  function last(g) { var r = ranking(g); return r[r.length - 1]; }

  /* ---------- Création ---------- */
  function createGame(humanParty, opts) {
    opts = opts || {};
    var seed = opts.seed != null ? opts.seed : Math.floor(Math.random() * 1e9);
    var rng = makeRng(seed);
    var others = D.PARTIES.map(function (p) { return p.id; }).filter(function (id) { return id !== humanParty; });
    var ai = opts.aiParties || shuffle(others, rng).slice(0, 3);
    var ids = humanParty ? [humanParty].concat(ai) : ai;
    var objs = shuffle(D.OBJECTIVES.map(function (o) { return o.id; }), rng);
    var g = {
      seed: seed, rng: rng, turn: 0, phase: 'setup', winner: null, over: false, result: null,
      alliances: {}, betrayed: {}, offers: [], hot: [], nextHot: [], news: null,
      bases: {}, pending: [], markers: [], crisis: null, dilemma: null, dilemmas: [], lastPoll: null,
      affairs: [], nextAffairs: [], affairDeck: [], affairIdx: 0,
      players: ids.map(function (id, i) {
        var p = PARTY[id];
        return { id: id, human: id === humanParty, money: p.money, infl: p.infl,
                 cards: p.cards.slice(), objective: objs[i], debateWins: 0,
                 forme: R.formeStart, cas: 0, momentum: 0, cred: Object.assign({}, p.cred), talk: {}, militants: 0,
                 programme: null, phare: null, budget: 0 };
      }),
      regions: {}, events: shuffle(D.EVENTS.map(function (e) { return e.id; }), rng),
      event: null, mods: {}, cancel: {}, log: [], history: []
    };
    // v1.0 : chaque région démarre avec ses vrais inscrits, sa vraie abstention et son vrai vote blanc (2022),
    // et chaque parti avec des électeurs proportionnels à son score aux européennes 2024
    D.REGIONS.forEach(function (r) {
      g.regions[r.id] = { cubes: {}, controller: null, ins: r.ins, abst: r.abst / 100 * R.round1Abst, blank: (r.blanc + r.nuls) / 100 * R.round1Blank };
      g.players.forEach(function (pl) { var n = Math.round((r.start[pl.id] || 0) * R.startScale / 100); if (n) addCubes(g, r.id, pl.id, n); });
      // La région part à son vainqueur des européennes 2024 parmi les partis de la partie. Si l'arrondi en cubes
      // le met à égalité ou sous le seuil de contrôle, il reçoit juste ce qu'il faut (3 cubes au plus) pour la tenir.
      var top = pids(g).slice().sort(function (a, b) { return (r.start[b] || 0) - (r.start[a] || 0); })[0];
      var others = 0; pids(g).forEach(function (id) { if (id !== top) others = Math.max(others, cubes(g, r.id, id)); });
      var need = Math.max(others + 1, minControl(top)) - cubes(g, r.id, top);
      if (need > 0 && need <= 3) addCubes(g, r.id, top, need);
      g.regions[r.id].lead2024 = top;
    });
    updateAllControl(g);
    D.REGIONS.forEach(function (r) { var reg = g.regions[r.id], L = reg.lead2024; delete reg.lead2024;
      if (!reg.controller && L) { var best = 0; pids(g).forEach(function (id) { best = Math.max(best, cubes(g, r.id, id)); });
        if (cubes(g, r.id, L) === best && best >= minControl(L)) reg.controller = L; } });
    // v0.5 : une crise en 3 actes, et un paquet de dilemmes
    var cr = D.CRISES[Math.floor(rng() * D.CRISES.length)];
    g.crisis = { id: cr.id, start: R.crisisStart[0] + Math.floor(rng() * (R.crisisStart[1] - R.crisisStart[0] + 1)) };
    g.dilemmas = shuffle(D.DILEMMAS.map(function (d) { return d.id; }), rng);
    g.affairDeck = shuffle(D.AFFAIRS.map(function (a) { return a.id; }), rng);
    g.lastPoll = pollMap(g);
    return g;
  }
  function pollMap(g) { var m = {}; poll(g).forEach(function (x) { m[x.pid] = x.pct; }); return m; }
  function crisisAct(g) {
    if (!g.crisis) return null;
    var k = g.turn - g.crisis.start;
    if (k < 0 || k > 2) return null;
    var cr = D.CRISES.filter(function (c) { return c.id === g.crisis.id; })[0];
    return { crisis: cr, index: k, act: cr.acts[k] };
  }

  /* ---------- Début de tour : revenus, usure, événement ---------- */
  function startTurn(g) {
    g.turn += 1; g.mods = {}; g.cancel = {}; g.log = [];
    var out = { income: [], usure: null, event: null, crisis: null, militants: [], later: [], affairs: [], dilemma: null, programmes: null };
    if (g.turn === 1) out.programmes = applyProgrammes(g);
    // marqueurs expirés
    g.markers = g.markers.filter(function (m) { return m.until >= g.turn; });
    if (g.turn > 1) {
      g.players.forEach(function (pl) {
        var bonus = Math.min(R.incomeRegionMax, controlledRegions(g, pl.id).length * R.incomePerRegion);
        pl.money += R.incomeMoney + bonus; pl.infl += R.incomeInfl;
        var f0 = pl.forme; pl.forme = Math.min(R.formeMax, pl.forme + R.formeRegen + (pl.id === 'EM' ? 1 : 0));
        out.income.push({ pid: pl.id, money: R.incomeMoney + bonus, infl: R.incomeInfl, forme: pl.forme - f0 });
      });
      // militants : +1 cube dans chaque région où le parti a une équipe
      Object.keys(g.bases).forEach(function (rid) {
        g.bases[rid].forEach(function (pid) { if (addCubes(g, rid, pid, 1)) out.militants.push({ pid: pid, rid: rid }); });
      });
      // conséquences différées
      g.pending = g.pending.filter(function (x) {
        if (x.turn > g.turn) return true;
        if (x.affair) { g.nextAffairs.push({ pid: x.pid, id: x.affair }); return false; }
        var hit = g.rng() < x.chance;
        out.later.push({ pid: x.pid, title: x.title, text: x.text, hit: hit, effects: hit ? applyFx(g, x.pid, x.fx) : [] });
        return false;
      });
      // v0.7 : les affaires (dossiers des rivaux, programme non financé, casseroles, Le Canard)
      var list = g.nextAffairs.slice(); g.nextAffairs = [];
      g.players.forEach(function (pl) {
        if (pl.cas > 0 && g.rng() < pl.cas * R.affairPerCasserole && !list.some(function (x) { return x.pid === pl.id; })) list.push({ pid: pl.id, src: 'casseroles' });
      });
      if (!list.length && g.rng() < R.canardChance) {
        var tot = 0; g.players.forEach(function (p) { tot += p.cas + 1; });
        var r = g.rng() * tot, pick = g.players[0];
        for (var i = 0; i < g.players.length; i++) { r -= g.players[i].cas + 1; if (r <= 0) { pick = g.players[i]; break; } }
        list.push({ pid: pick.id, src: 'canard' });
      }
      g.affairs = list.slice(0, R.affairsMax).map(function (x) {
        var id = x.id || g.affairDeck[g.affairIdx++ % g.affairDeck.length];
        var def = affairDef(id);
        return { pid: x.pid, id: id, title: def.title, text: def.text, src: x.src || (id === 'budget' ? 'budget' : 'dossier'), from: x.from || null };
      });
      out.affairs = g.affairs.slice();
    }
    var em = player(g, 'EM');
    if (em && g.turn === 5) {
      var rid = strongestRegion(g, 'EM');
      if (rid) { addCubes(g, rid, 'EM', -1); out.usure = rid; g.log.push({ pid: 'EM', text: 'Usure du pouvoir : −1 cube en ' + REG[rid].name }); }
    }
    // événement du tour : un acte de la crise, sinon une carte événement
    var ca = crisisAct(g);
    if (ca) {
      g.event = 'crisis';
      (ca.act.markers || []).forEach(function (m) { g.markers.push({ rid: m.rid, icon: m.icon, theme: m.theme, until: g.turn + m.turns - 1, title: ca.act.title }); });
      pickNews(g, ca.act.theme);
      out.crisis = { name: ca.crisis.name, index: ca.index, title: ca.act.title, text: ca.act.text, effects: applyFx(g, null, ca.act.fx) };
    } else {
      var evId = g.events[(g.turn - 1) % g.events.length];
      g.event = evId;
      var ev = D.EVENTS.filter(function (e) { return e.id === evId; })[0];
      pickNews(g, ev && ev.theme);
      out.event = { id: evId, effects: applyEvent(g, evId) };
    }
    out.news = g.news;
    // dilemme : un parti à tour de rôle
    var dp = g.players[(g.turn - 1) % g.players.length];
    var did = g.dilemmas[(g.turn - 1) % g.dilemmas.length];
    g.dilemma = { pid: dp.id, id: did };
    out.dilemma = g.dilemma;
    updateAllControl(g);
    g.phase = 'actions';
    return out;
  }
  function affairDef(id) { return id === 'budget' ? D.BUDGET_AFFAIR : D.AFFAIRS.filter(function (a) { return a.id === id; })[0]; }
  /* Un parti réagit à son affaire (index de D.REACTIONS). L'affaire fait d'office sortir 1 casserole. */
  function resolveAffair(g, pid, idx) {
    var k = -1; g.affairs.forEach(function (a, i) { if (a.pid === pid && k < 0) k = i; });
    if (k < 0) return null;
    var a = g.affairs.splice(k, 1)[0], rc = D.REACTIONS[idx] || D.REACTIONS[0], pl = player(g, pid);
    pl.cas = Math.max(0, pl.cas - 1);
    D.REGIONS.forEach(function (r) { g.regions[r.id].abst = Math.min(0.8, g.regions[r.id].abst + R.affairAbst); });   // « tous pourris » : un peu plus d'abstention
    var fx = applyFx(g, pid, rc.fx);
    updateAllControl(g);
    return { pid: pid, title: a.title, reaction: rc.label, effects: fx };
  }
  /* v1.0 : combien d'abstentionnistes un parti peut-il convaincre ici ? */
  function lowTurnoutFit(g, pid, rid) {
    var pl = player(g, pid); if (!pl || !pl.programme) return 0;
    var ap = segmentAppeal(pl.programme.concat(pl.financing || [])), pop = REG[rid].pop, f = 0;
    D.SEGMENTS.forEach(function (sg) { if (ap[sg.id] > 0) f += Math.min(3, ap[sg.id]) * pop[sg.id] / 100 * Math.max(0, 1.2 - D.VOTE_PROP[sg.id]); });
    return f;
  }
  function mobilizeGain(g, pid, rid) {
    var n = 1, why = [];
    if ((g.bases[rid] || []).indexOf(pid) >= 0) { n++; why.push('tes militants'); }
    if (lowTurnoutFit(g, pid, rid) >= 0.18) { n++; why.push('ton programme parle à ceux qui votent peu'); }
    if (regionVoters(g, rid).abst >= 0.35) { n++; why.push('beaucoup d\'abstentionnistes'); }
    return { n: Math.min(3, n), why: why };
  }
  function enqueteChance(g, target) { return Math.min(0.9, R.enqueteBase + R.enqueteCas * player(g, target).cas); }
  function dilemmaDef(id) { return D.DILEMMAS.filter(function (d) { return d.id === id; })[0]; }
  /* Applique le choix d'un parti face à son dilemme. Renvoie la liste des effets (textes). */
  function resolveDilemma(g, pid, idx) {
    if (!g.dilemma || g.dilemma.pid !== pid) return null;
    var d = dilemmaDef(g.dilemma.id), o = d.options[idx] || d.options[0];
    var fx = applyFx(g, pid, o.fx);
    var res = { pid: pid, title: d.title, choice: o.label, effects: fx };
    g.dilemma = null;
    updateAllControl(g);
    return res;
  }

  /* ---------- Effets génériques (dilemmes, crises, conséquences différées) ---------- */
  function applyFx(g, pid, list) {
    var out = [], pl = pid ? player(g, pid) : null;
    function say(t) { out.push(t); }
    function clampRes(p) { p.money = Math.max(0, p.money); p.infl = Math.max(0, p.infl); p.forme = Math.max(0, Math.min(R.formeMax, p.forme)); p.cas = Math.max(0, Math.min(R.casseroleMax, p.cas)); }
    (list || []).forEach(function (e) {
      switch (e.k) {
        case 'money': pl.money += e.n; clampRes(pl); say((e.n > 0 ? '+' : '−') + Math.abs(e.n) + ' €'); break;
        case 'infl': pl.infl += e.n; clampRes(pl); say((e.n > 0 ? '+' : '−') + Math.abs(e.n) + ' ★'); break;
        case 'forme': pl.forme += e.n; clampRes(pl); say((e.n > 0 ? '+' : '−') + Math.abs(e.n) + ' ⚡'); break;
        case 'cas': pl.cas += e.n; clampRes(pl); say(e.n > 0 ? '+' + e.n + ' casserole' + (e.n > 1 ? 's' : '') : '−' + (-e.n) + ' casserole'); break;
        case 'strong': {
          var rid = e.n < 0 ? (strongestRegion(g, pid, function (r) { return g.regions[r.id].controller === pid; }) || strongestRegion(g, pid))
                            : bestRegions(g, pid, 1, function (r) { return cubes(g, r.id, pid) > 0; }, e.n)[0] || bestRegions(g, pid, 1, null, e.n)[0];
          if (rid) { var x = addCubes(g, rid, pid, e.n); say((x >= 0 ? '+' : '−') + Math.abs(x) + ' cube' + (Math.abs(x) > 1 ? 's' : '') + ' en ' + REG[rid].name); }
          break; }
        case 'loseTop': {
          var done = [];
          for (var i = 0; i < e.count; i++) {
            var r2 = strongestRegion(g, pid, function (r) { return done.indexOf(r.id) < 0; });
            if (!r2) break; done.push(r2); addCubes(g, r2, pid, -e.n);
          }
          if (done.length) say('−' + e.n + ' cube en ' + done.map(function (r) { return REG[r].name; }).join(' et '));
          break; }
        case 'regions': {
          var regs = bestRegions(g, pid, e.count, e.profile ? function (r) { return r.profile === e.profile; } : null, e.n);
          regs.forEach(function (r) { addCubes(g, r, pid, e.n); });
          if (regs.length) say('+' + e.n + ' cube en ' + regs.map(function (r) { return REG[r].name; }).join(', '));
          break; }
        case 'rival': {
          var rk = ranking(g).filter(function (x) { return x !== pid && x !== allyOf(g, pid); })[0];
          var r3 = rk && strongestRegion(g, rk);
          if (r3) { var y = -addCubes(g, r3, rk, -e.n); say(PARTY[rk].short + ' perd ' + y + ' cube' + (y > 1 ? 's' : '') + ' en ' + REG[r3].name); }
          break; }
        case 'dice': {
          var win = g.rng() < e.chance;
          say(win ? '🎲 Ça passe !' : '🎲 Raté…');
          out = out.concat(applyFx(g, pid, win ? e.win : e.lose));
          break; }
        case 'later': g.pending.push({ turn: g.turn + e.turns, pid: pid, chance: e.chance, title: e.title, text: e.text, fx: e.fx }); break;
        case 'allMoney': g.players.forEach(function (p) { p.money = Math.max(0, p.money + e.n); }); say('Chaque parti ' + (e.n > 0 ? 'gagne ' : 'perd ') + Math.abs(e.n) + ' €'); break;
        case 'mod': g.mods[e.key] = e.v; break;
        case 'credTop':
          g.players.forEach(function (p) {
            if (cred(g, p.id, e.theme) < 2) return;
            var r4 = bestRegions(g, p.id, 1, null, e.n)[0];
            if (r4) { addCubes(g, r4, p.id, e.n); say(PARTY[p.id].short + ' : +' + e.n + ' cube en ' + REG[r4].name); }
          }); break;
        case 'controllerLoss':
          e.regions.forEach(function (rid) {
            var c = g.regions[rid].controller;
            if (c) { addCubes(g, rid, c, -e.n); say(PARTY[c].short + ' perd ' + e.n + ' cube en ' + REG[rid].name); }
          }); break;
      }
    });
    return out;
  }

  function applyEvent(g, id) {
    var fx = [];
    function say(pid, t) { fx.push({ pid: pid, text: t }); }
    switch (id) {
      case 'crise': g.players.forEach(function (p) { p.money = Math.max(0, p.money - 2); }); say(null, 'Tous les partis perdent 2 €.'); break;
      case 'greve': g.mods.terrainExtra = 1; say(null, 'Meetings : +1 € ce tour.'); break;
      case 'scandale': {
        var l = leader(g);
        if (l) { var rid = strongestRegion(g, l, function (r) { return g.regions[r.id].controller === l; }) || strongestRegion(g, l);
          addCubes(g, rid, l, -2); say(l, PARTY[l].short + ' perd 2 cubes en ' + REG[rid].name + '.'); }
        else say(null, 'Personne n’est en tête : le scandale fait pschitt.');
        break; }
      case 'buzz': g.mods.socialFree = true; say(null, 'Buzz gratuits ce tour.'); break;
      case 'sondage': { var p = player(g, last(g)); p.infl += 2; say(p.id, PARTY[p.id].short + ' gagne 2 ★.'); break; }
      case 'fete': g.players.forEach(function (p) { p.infl += 1; }); say(null, 'Tous les partis gagnent 1 ★.'); break;
      case 'division': case 'division2':
        g.players.forEach(function (p) {
          var n = p.id === 'UG' ? 2 : 1; var rid = strongestRegion(g, p.id);
          if (rid) { addCubes(g, rid, p.id, -n); say(p.id, PARTY[p.id].short + ' perd ' + n + ' cube' + (n > 1 ? 's' : '') + ' en ' + REG[rid].name + '.'); }
        }); break;
      case 'fuite': g.players.forEach(function (p) { p.infl = Math.max(0, p.infl - 1); }); say(null, 'Tous les partis perdent 1 ★.'); break;
      case 'salon': case 'patrimoine': {
        var prof = id === 'salon' ? 'rurale' : 'historique';
        g.players.forEach(function (p) {
          var rid = strongestRegion(g, p.id, function (r) { return r.profile === prof; });
          if (rid) { addCubes(g, rid, p.id, 1); say(p.id, PARTY[p.id].short + ' : +1 cube en ' + REG[rid].name + '.'); }
        }); break; }
      case 'usine':
        D.REGIONS.forEach(function (r) {
          var c = g.regions[r.id].controller;
          if (r.profile === 'industrielle' && c) { addCubes(g, r.id, c, -1); say(c, PARTY[c].short + ' perd 1 cube en ' + r.name + '.'); }
        }); break;
      case 'mecene': { var q = player(g, last(g)); q.money += 3; say(q.id, PARTY[q.id].short + ' gagne 3 €.'); break; }
      case 'bouchons': { var c = g.regions.idf.controller;
        if (c) { addCubes(g, 'idf', c, -1); say(c, PARTY[c].short + " perd 1 cube en Île-de-France."); } else say(null, "Personne ne contrôle l'Île-de-France."); break; }
      default: say(null, 'Rien ne se passe.');
    }
    return fx;
  }

  /* ---------- Coûts et validité des actions ---------- */
  function actionCost(g, pid, act) {
    if (act.type === 'card') return { money: 0, infl: 0, forme: 0 };
    var base = D.ACTIONS[act.type].cost;
    var c = { money: base.money, infl: base.infl, forme: base.forme || 0 };
    if (act.type === 'terrain') {
      c.money += g.mods.terrainExtra || 0;
      if (pid === 'FI' && act.region && REG[act.region].profile === 'rurale') c.money += 1;
    }
    if (act.type === 'reseaux' && g.mods.socialFree) c.money = 0;
    // (réduction MN retirée v0.1)
    return c;
  }
  /* Vérifie si une action peut être programmée (hors coût). Renvoie null si ok, sinon un message. */
  function checkAction(g, pid, act) {
    if (act.type === 'card') {
      var pl = player(g, pid), card = D.CARDS[act.card];
      if (pl.cards.indexOf(act.card) < 0) return 'Carte déjà utilisée.';
      if (card.target === 'region' && !act.region) return 'Choisis une région.';
      if (card.profiles && card.profiles.indexOf(REG[act.region].profile) < 0) return 'Pas le bon type de région.';
      return null;
    }
    var def = D.ACTIONS[act.type];
    if (def.target === 'region' && !act.region) return 'Choisis une région.';
    if (def.theme && !THEME[act.theme]) return 'Choisis un thème.';
    if (act.type === 'imposer' && g.turn >= R.maxTurns) return 'Plus de tour suivant : la campagne est finie.';
    if (act.type === 'mobiliser' && regionVoters(g, act.region).abst <= 1 - R.turnoutMax) return 'Presque tout le monde vote déjà ici.';
    if (act.type === 'militants') {
      var pl0 = player(g, pid);
      if ((g.bases[act.region] || []).indexOf(pid) >= 0) return 'Tu as déjà des militants ici.';
      if (pl0.militants >= R.militantsMax) return 'Toutes tes équipes de militants sont déjà sur le terrain.';
      if (g.turn >= R.maxTurns) return 'Trop tard : la campagne s’achève.';
    }
    if (act.type === 'alliance') return allianceError(g, pid, act.target);
    if (act.type === 'enquete') {
      if (!act.target || !player(g, act.target) || act.target === pid) return 'Choisis un rival.';
      if (allyOf(g, pid) === act.target) return 'On n’enquête pas sur son allié.';
      if (g.turn >= R.maxTurns) return 'Trop tard : le dossier ne sortira pas avant l’élection.';
    }
    if (act.type === 'rupture' && !allyOf(g, pid)) return 'Tu n’as pas d’allié.';
    if (act.type === 'contre' && cubes(g, act.region, pid) < 1) return 'Il faut au moins 1 cube dans la région.';
    if (act.type === 'contre' && !rivalIn(g, act.region, pid)) return 'Aucun rival attaquable ici (on n’attaque pas son allié).';
    if (act.type === 'reforme' && g.regions[act.region].controller !== pid) return 'Il faut contrôler la région.';
    return null;
  }
  function rivalIn(g, rid, pid) {
    var best = null, bn = 0, ally = allyOf(g, pid);
    pids(g).forEach(function (o) { if (o === pid || o === ally) return; var n = cubes(g, rid, o); if (n > bn) { bn = n; best = o; } });
    return best;
  }
  function allianceError(g, pid, target) {
    if (!target || !player(g, target) || target === pid) return 'Choisis un parti.';
    if (dist(pid, target) > R.maxAllianceDistance) return 'Trop éloigné politiquement.';
    if (allyOf(g, pid)) return 'Tu as déjà un allié.';
    if (allyOf(g, target)) return PARTY[target].short + ' a déjà un allié.';
    if (g.betrayed[pid] === target || g.betrayed[target] === pid) return 'La confiance est rompue.';
    return null;
  }
  /* Probabilité qu'un parti (IA) accepte une alliance */
  function acceptChance(g, target, from) {
    var p = dist(target, from) === 1 ? 0.75 : 0.5, l = leader(g);
    if (l === target) p -= 0.3;
    if (l === from) p += 0.15;
    return Math.max(0.05, Math.min(0.95, p));
  }
  function makeAlliance(g, a, b) { g.alliances[a] = b; g.alliances[b] = a; }
  function answerOffer(g, from, to, accept) {
    g.offers = g.offers.filter(function (o) { return !(o.from === from && o.to === to); });
    if (!accept) return false;
    if (allianceError(g, from, to)) return false;
    makeAlliance(g, from, to); return true;
  }
  /* Récupération d'électeurs proches : à distance 1, un cube change de camp ; à distance 2, sur un dé de 4 à 6. */
  function poachTarget(g, pid, rid, allowD2) {
    var ally = allyOf(g, pid), best = null, bn = 0, best2 = null, bn2 = 0;
    pids(g).forEach(function (o) {
      if (o === pid || o === ally) return;
      var n = cubes(g, rid, o); if (!n) return;
      var d = dist(pid, o);
      if (d === 1 && n > bn) { bn = n; best = o; }
      if (d === 2 && n > bn2) { bn2 = n; best2 = o; }
    });
    if (best) return { pid: best, d: 1 };
    if (allowD2 && best2) return { pid: best2, d: 2 };
    return null;
  }
  function poach(g, pid, rid, allowD2) {
    if (cubes(g, rid, pid) >= R.maxCubes) return null;
    var t = poachTarget(g, pid, rid, allowD2);
    if (!t) return null;
    if (t.d === 2 && g.rng() < 0.5) return null;
    addCubes(g, rid, t.pid, -1); addCubes(g, rid, pid, 1);
    return t.pid;
  }

  /* ---------- Valeur d'un renfort (utilisée par l'IA et pour les choix automatiques) ---------- */
  function gain(g, pid, rid, k) {
    var r = REG[rid], my = cubes(g, rid, pid), ctrl = g.regions[rid].controller;
    if (my >= R.maxCubes) return 0;
    k = Math.min(k, R.maxCubes - my);
    var top = 0, tot = 0; pids(g).forEach(function (o) { tot += cubes(g, rid, o); if (o !== pid) top = Math.max(top, cubes(g, rid, o)); });
    var voteVal = r.pts * ((my + k) / (tot + k) - (tot ? my / tot : 0)) * 1.6;
    var ctrlVal;
    if (ctrl === pid) {
      var margin = my - top;
      ctrlVal = margin <= 1 ? r.pts * 0.35 * Math.min(k, 2) / 2 : r.pts * 0.04 * k;
    } else {
      var need = Math.max(minControl(pid) - my, top - my + 1, 1);
      ctrlVal = k >= need ? r.pts * (ctrl ? 1.25 : 1) : r.pts * 0.55 * k / need;
    }
    return voteVal + ctrlVal * 0.6;
  }
  function bestRegions(g, pid, n, filter, k, exclude) {
    return D.REGIONS.filter(function (r) { return (!filter || filter(r)) && (!exclude || exclude.indexOf(r.id) < 0); })
      .map(function (r) { return { id: r.id, v: gain(g, pid, r.id, k || 1) }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, n).map(function (x) { return x.id; });
  }
  /* Médias : la région choisie + les régions les plus intéressantes parmi celles que le thème préoccupe */
  function mediaRegions(g, pid, rid, th) {
    var others = bestRegions(g, pid, R.mediaRegions - 1, function (r) { return concerns(r.id, th); }, 1, [rid]);
    return [rid].concat(others);
  }

  /* ---------- Résolution des actions ---------- */
  function resolveOne(g, pid, act) {
    var pl = player(g, pid), P = PARTY[pid];
    var name = act.type === 'card' ? D.CARDS[act.card].name : D.ACTIONS[act.type].name;
    var entry = { pid: pid, action: name, region: act.region || null, target: act.target || null, theme: act.theme || null, text: '', ok: true };
    if (g.cancel[pid]) { g.cancel[pid] = false; entry.ok = false; entry.text = 'Annulée par le 49.3 !'; return entry; }
    var err = checkAction(g, pid, act);
    if (err) { entry.ok = false; entry.text = 'Échoue : ' + err; return entry; }
    var c = actionCost(g, pid, act);
    if (pl.money < c.money || pl.infl < c.infl || pl.forme < c.forme) { entry.ok = false; entry.text = 'Échoue : pas assez de ressources.'; return entry; }
    pl.money -= c.money; pl.infl -= c.infl; pl.forme -= c.forme;
    // v0.4 : un candidat épuisé peut faire une gaffe
    if (c.forme && pl.forme === 0 && g.rng() < R.gaffeChance) {
      pl.cas = Math.min(R.casseroleMax, pl.cas + 1);
      entry.ok = false; entry.gaffe = true; entry.text = '😬 GAFFE ! Épuisé, le candidat dérape : aucun cube, +1 casserole.';
      return entry;
    }
    // v0.4 : parler souvent d'un thème rend crédible dessus
    if (act.theme) {
      pl.talk[act.theme] = (pl.talk[act.theme] || 0) + 1;
      if (pl.talk[act.theme] >= R.credTalk && pl.cred[act.theme] < 2) {
        pl.cred[act.theme] += 1; pl.talk[act.theme] = 0;
        entry.credUp = act.theme;
      }
    }
    var rn = act.region ? REG[act.region].name : '';
    var t = [];
    switch (act.type) {
      case 'terrain': {
        var imp = impact(g, pid, act.region, act.theme);
        var n = addCubes(g, act.region, pid, terrainCubes(g, pid, act.region, act.theme));
        t.push('impact ' + imp + ' : +' + n + ' en ' + rn);
        var pc = poach(g, pid, act.region, true); if (pc) t.push('récupère 1 électeur de ' + PARTY[pc].short);
        break; }
      case 'medias': {
        mediaRegions(g, pid, act.region, act.theme).forEach(function (rid) {
          var n = mediaCubes(g, pid, rid, act.theme);
          if (!n) { t.push('0 ' + REG[rid].name + ' (message inaudible)'); return; }
          n = addCubes(g, rid, pid, n);
          var pc2 = poach(g, pid, rid, false);
          t.push('+' + n + ' ' + REG[rid].name + (pc2 ? ' (+1 de ' + pc2 + ')' : ''));
        }); break; }
      case 'reseaux': {
        var d = 1 + Math.floor(g.rng() * 6);
        if (pid === 'FI' && d <= 2) { var d2 = 1 + Math.floor(g.rng() * 6); t.push('dé ' + d + ', relancé'); d = d2; }
        var m = d === 1 ? -1 : d <= 3 ? 1 : d <= 5 ? 2 : 4;
        if (isHot(g, act.theme)) m += R.socialHotBonus;
        var got = addCubes(g, act.region, pid, m);
        t.push('dé ' + d + (d === 6 ? ' VIRAL' : d === 1 ? ' bad buzz' : '') + ' : ' + (got >= 0 ? '+' : '') + got + ' en ' + rn); break; }
      case 'contre': {
        var rival = rivalIn(g, act.region, pid);
        var n2 = 2;
        if (rival === 'UG' && REG[act.region].profile === 'historique') n2 = Math.max(0, Math.min(2, cubes(g, act.region, 'UG') - 2));
        var lost = -addCubes(g, act.region, rival, -n2);
        g.regions[act.region].blank += R.attackBlank; g.regions[act.region].abst += R.attackAbst;   // une campagne négative écœure
        pl.cas = Math.min(R.casseroleMax, pl.cas + 1);
        t.push(PARTY[rival].short + ' −' + lost + ' en ' + rn + ' · +1 casserole'); break; }
      case 'mobiliser': {
        var mg = mobilizeGain(g, pid, act.region), reg0 = g.regions[act.region];
        var got = addCubes(g, act.region, pid, mg.n);
        reg0.abst = Math.max(1 - R.turnoutMax, reg0.abst - R.mobTurnout * got);
        if (g.turn <= R.registerTurns) { reg0.ins *= 1.003; t.push('nouveaux inscrits'); }
        t.push('+' + got + ' en ' + rn + ' (abstentionnistes convaincus' + (mg.why.length ? ' : ' + mg.why.join(', ') : '') + ')');
        break; }
      case 'enquete': {
        var tgt = player(g, act.target), ch = enqueteChance(g, act.target);
        if (g.rng() < ch) {
          g.nextAffairs.push({ pid: act.target, from: pid });
          t.push('dossier trouvé sur ' + PARTY[act.target].short + ' : l’affaire sortira demain');
        } else if (g.rng() < R.enqueteBackfire) {
          pl.cas = Math.min(R.casseroleMax, pl.cas + 2);
          t.push('rien trouvé… et tes barbouzes sont démasquées : +2 casseroles');
        } else t.push('rien trouvé sur ' + PARTY[act.target].short);
        break; }
      case 'militants': {
        g.bases[act.region] = (g.bases[act.region] || []).concat([pid]); pl.militants += 1;
        t.push('des militants s’installent en ' + rn + ' (+1 cube par tour)'); break; }
      case 'imposer': {
        if (!g.nextHot.some(function (x) { return x.theme === act.theme; })) g.nextHot.push({ theme: act.theme, pid: pid });
        t.push(THEME[act.theme].name + ' fera l’actu au prochain tour'); break; }
      case 'fonds': {
        var f = pid === 'EM' ? 4 : pid === 'VP' ? 2 : 3; pl.money += f; if (pid === 'EM') pl.infl += 1; t.push('+' + f + ' €' + (pid === 'EM' ? ' +1 ★' : '')); break; }
      case 'reforme': {
        var prof2 = REG[act.region].profile;
        D.REGIONS.forEach(function (r) { if (r.profile === prof2) { var x = addCubes(g, r.id, pid, 1); if (x) t.push('+1 ' + r.name); } });
        break; }
      case 'card': t = resolveCard(g, pid, act); pl.cards = pl.cards.filter(function (k) { return k !== act.card; }); break;
      case 'alliance': {
        var to = player(g, act.target);
        if (to.human) { g.offers.push({ from: pid, to: act.target }); t.push('propose une alliance à ' + PARTY[act.target].short); }
        else if (g.rng() < acceptChance(g, act.target, pid)) { makeAlliance(g, pid, act.target); t.push('ALLIANCE avec ' + PARTY[act.target].short + ' !'); }
        else t.push(PARTY[act.target].short + ' refuse l’alliance');
        break; }
      case 'rupture': {
        var ex = allyOf(g, pid);
        delete g.alliances[pid]; delete g.alliances[ex]; g.betrayed[ex] = pid;
        pl.cas = Math.min(R.casseroleMax, pl.cas + 2);
        var lostI = Math.min(pl.infl, R.breakCost); pl.infl -= lostI;
        t.push('rompt avec ' + PARTY[ex].short + ' (−' + lostI + ' ★)'); break; }
    }
    if (entry.credUp) t.push('devient crédible sur ' + THEME[entry.credUp].name);
    entry.text = t.join(' · ');
    updateAllControl(g);
    return entry;
  }

  function resolveCard(g, pid, act) {
    var pl = player(g, pid), t = [];
    function others() { return g.players.filter(function (p) { return p.id !== pid; }); }
    switch (act.card) {
      case 'marche_pop': case 'climat': t.push('+' + addCubes(g, act.region, pid, 3) + ' en ' + REG[act.region].name); break;
      case 'grand_meeting': t.push('+' + addCubes(g, act.region, pid, 4) + ' en ' + REG[act.region].name); break;
      case 'censure': others().forEach(function (p) { p.infl = Math.max(0, p.infl - 1); }); t.push('chaque adversaire −1 ★'); break;
      case 'primaire': pl.infl += 3; t.push('+3 ★'); break;
      case 'rassemblement': pl.money += 3; pl.infl += 1; t.push('+3 € +1 ★'); break;
      case 'fete_rose': {
        t.push('+' + addCubes(g, act.region, pid, 2) + ' en ' + REG[act.region].name);
        var o = bestRegions(g, pid, 1, function (r) { return cubes(g, r.id, pid) > 0; }, 2, [act.region])[0];
        if (o) t.push('+' + addCubes(g, o, pid, 2) + ' en ' + REG[o].name); break; }
      case 'canicule':
        others().forEach(function (p) {
          var a = strongestRegion(g, p.id); if (a) addCubes(g, a, p.id, -1);
          var b = strongestRegion(g, p.id, function (r) { return r.id !== a; }); if (b) addCubes(g, b, p.id, -1);
        }); t.push('chaque adversaire −1 cube dans 2 régions'); break;
      case 'art493': {
        var rk = ranking(g).filter(function (x) { return x !== pid; })[0];
        g.cancel[rk] = true; pl.cas = Math.min(R.casseroleMax, pl.cas + 1);
        t.push('la prochaine action de ' + PARTY[rk].short + ' est annulée · +1 casserole'); break; }
      case 'remaniement': {
        var from = strongestRegion(g, pid, function (r) { return r.id !== act.region; });
        if (from) { var mv = -addCubes(g, from, pid, -2); addCubes(g, act.region, pid, mv); t.push(mv + ' cubes de ' + REG[from].name + ' vers ' + REG[act.region].name); }
        break; }
      case 'appel18': D.REGIONS.forEach(function (r) { if (r.profile === 'historique') addCubes(g, r.id, pid, 1); }); t.push('+1 dans chaque région historique'); break;
      case 'plateau_tele':
        bestRegions(g, pid, 3, function (r) { return r.profile === 'rurale' || r.profile === 'industrielle'; }, 2)
          .forEach(function (rid) { t.push('+' + addCubes(g, rid, pid, 2) + ' ' + REG[rid].name); }); break;
    }
    return t;
  }

  /* plans : { pid: [act, act, act] } — résolution en alternance, le premier joueur tourne. */
  function resolveActions(g, plans) {
    var order = [], n = g.players.length, start = (g.turn - 1) % n;
    for (var i = 0; i < n; i++) order.push(g.players[(start + i) % n].id);
    var log = [];
    for (var s = 0; s < R.actionsPerTurn; s++) {
      order.forEach(function (pid) {
        var act = (plans[pid] || [])[s];
        if (act) log.push(resolveOne(g, pid, act));
      });
    }
    g.phase = isDebateTurn(g) ? 'debate' : 'spotlight';
    return log;
  }

  /* ---------- Débat ---------- */
  function isDebateTurn(g) { return R.debateTurns.indexOf(g.turn) >= 0; }
  /* v0.6 : le débat en face-à-face. setupDebate prépare les 6 duels (chacun contre chacun, un thème par duel). */
  function setupDebate(g) {
    var ids = pids(g), duels = [];
    for (var i = 0; i < ids.length; i++) for (var j = i + 1; j < ids.length; j++) {
      var th = g.rng() < 0.5 && g.hot && g.hot.length ? g.hot[0] : D.THEMES[Math.floor(g.rng() * D.THEMES.length)].id;
      duels.push({ a: ids[i], b: ids[j], theme: th });
    }
    g.debate = { duels: duels };
    return g.debate;
  }
  /* Points d'une réplique : 2 si elle bat celle d'en face, 1 si nul, 0 si battue, + bonus */
  function replyPoints(g, me, mine, opp, theirs, theme) {
    var R2 = D.REPLIES, pts, notes = [];
    if (mine === 'esquive' || theirs === 'esquive' || mine === theirs) pts = 1;
    else pts = R2[mine].beats === theirs ? 2 : 0;
    if (mine === 'attaque' && player(g, opp).cas > 0) { pts += 1; notes.push('ressort ses casseroles'); }
    if (mine === 'chiffres') {
      var c = cred(g, me, theme);
      if (c === 2) { pts += 1; notes.push('maîtrise le sujet'); }
      if (c === 0) { pts -= 1; notes.push('s’emmêle dans les chiffres'); }
    }
    if (mine === 'emotion' && isHot(g, theme)) { pts += 1; notes.push('le sujet brûlant touche'); }
    return { pts: Math.max(0, pts), notes: notes };
  }
  function duelResult(g, d, ra, rb) {
    var x = replyPoints(g, d.a, ra, d.b, rb, d.theme), y = replyPoints(g, d.b, rb, d.a, ra, d.theme);
    return { a: d.a, b: d.b, theme: d.theme, ra: ra, rb: rb, pa: x.pts, pb: y.pts, na: x.notes, nb: y.notes };
  }
  /* prep : { pid: ★ dépensées } · picks : pour chaque duel { ra, rb } */
  function resolveDebate(g, prep, picks) {
    var tot = {}, duels = [];
    g.players.forEach(function (p) {
      var b = Math.max(0, Math.min(p.infl, R.debatePrepMax, Math.floor((prep || {})[p.id] || 0)));
      p.infl -= b; tot[p.id] = b;
    });
    var prepSpent = Object.assign({}, tot);
    g.debate.duels.forEach(function (d, i) {
      var r = duelResult(g, d, picks[i].ra, picks[i].rb);
      tot[d.a] += r.pa; tot[d.b] += r.pb; duels.push(r);
    });
    var list = g.players.map(function (p) { return { pid: p.id, score: tot[p.id], prep: prepSpent[p.id] }; })
      .sort(function (a, b) { return b.score - a.score; });
    var mult = g.turn === R.maxTurns ? 2 : 1;
    var res = { ranking: list, duels: duels, rewards: [], grand: mult === 2 };
    function reward(pid, n) {
      var regs = bestRegions(g, pid, n, null, 1);
      regs.forEach(function (rid) { addCubes(g, rid, pid, mult); });
      res.rewards.push({ pid: pid, regions: regs, each: mult });
    }
    var top = list[0].score, firsts = list.filter(function (x) { return x.score === top; });
    if (firsts.length === 1) {
      player(g, firsts[0].pid).debateWins += 1; res.winner = firsts[0].pid; reward(firsts[0].pid, 4);
      var second = list[1].score;
      list.filter(function (x) { return x.score === second; }).forEach(function (x) { reward(x.pid, 2); });
    } else firsts.forEach(function (x) { reward(x.pid, 2); });
    g.debate = null;
    updateAllControl(g);
    g.phase = 'spotlight';
    return res;
  }

  /* ---------- Sous les projecteurs + fin de tour ---------- */
  function spotlightTarget(g) { return leader(g); }
  function applySpotlight(g, pid, pay) {
    var pl = player(g, pid), out = { pid: pid, paid: false, regions: [] };
    if (pay && pl.infl >= R.spotlightCost) { pl.infl -= R.spotlightCost; out.paid = true; }
    else {
      var regs = controlledRegions(g, pid).sort(function (a, b) { return b.pts - a.pts; }).slice(0, 2);
      regs.forEach(function (r) { addCubes(g, r.id, pid, -1); out.regions.push(r.id); });
      updateAllControl(g);
    }
    return out;
  }
  function endTurn(g) {
    updateAllControl(g);
    var res = { winner: null, over: false };
    g.history.push(poll(g));
    // v0.4 : dynamique = le sondage a monté (ou baissé) de plus de 1,5 point ce tour
    var now = pollMap(g);
    g.players.forEach(function (pl) {
      var d = now[pl.id] - (g.lastPoll[pl.id] || 0);
      pl.momentum = d >= R.momentumStep ? 1 : d <= -R.momentumStep ? -1 : 0;
    });
    g.lastPoll = now;
    if (g.turn >= R.maxTurns) { g.over = true; g.result = election(g); g.winner = g.result.winner; }
    res.winner = g.winner; res.over = g.over; res.result = g.result;
    g.phase = g.over ? 'over' : 'next';
    return res;
  }

  /* ---------- Objectifs et score final ---------- */
  function objectiveMet(g, pid, oid) {
    function ctrl(rid) { return g.regions[rid].controller === pid; }
    function count(prof) { return D.REGIONS.filter(function (r) { return r.profile === prof && ctrl(r.id); }).length; }
    switch (oid) {
      case 'ouest': return ctrl('bre') && ctrl('pdl') && ctrl('nor');
      case 'territoires': return count('rurale') >= 3;
      case 'industrie': return ctrl('hdf') && ctrl('ges');
      case 'patrimoine': return count('historique') >= 3;
      case 'paris': return ctrl('idf');
      case 'partout': return D.REGIONS.every(function (r) { return cubes(g, r.id, pid) >= 1; });
      case 'debat': return player(g, pid).debateWins >= 2;
      case 'corse': return ctrl('cor');
    }
    return false;
  }
  /* ---------- Élection : premier tour puis second tour avec reports de voix ---------- */
  function transferRate(g, from, to) {
    if (allyOf(g, from) === to) return R.allyTransfer;
    if (g.betrayed[from] === to) return R.betrayedTransfer;
    return R.transfer[dist(from, to)] || 0;
  }
  function election(g) {
    var first = percents(votes(g, true)), st = turnoutStats(g);
    var out = { first: first, second: null, winner: null, direct: false, stats1: st };
    if (first[0].pct > 0.5) { out.direct = true; out.winner = first[0].pid; return out; }
    var A = first[0], B = first[1], va = A.votes, vb = B.votes, transfers = [], nt = 0;
    var scale = st.exprimes / first.reduce(function (s, x) { return s + x.votes; }, 0);   // les voix des 4 partis du jeu → électeurs réels
    first.slice(2).forEach(function (e) {
      var ra = transferRate(g, e.pid, A.pid), rb = transferRate(g, e.pid, B.pid);
      if (ra + rb > 1) { var s = ra + rb; ra /= s; rb /= s; }
      va += e.votes * ra; vb += e.votes * rb; nt += e.votes * (1 - ra - rb);
      transfers.push({ pid: e.pid, toA: ra, toB: rb, abst: 1 - ra - rb });
    });
    var tot = va + vb;
    // les électeurs qui ne se reportent sur aucun des deux finalistes votent blanc… ou restent chez eux
    var blancs2 = st.blancs + nt * scale * R.blankOfNonTransfer, votants2 = st.votants - nt * scale * (1 - R.blankOfNonTransfer);
    var stats2 = { ins: st.ins, votants: votants2, blancs: blancs2, exprimes: votants2 - blancs2, participation: votants2 / st.ins, abstention: 1 - votants2 / st.ins, blankPct: blancs2 / votants2 };
    out.second = { a: A.pid, b: B.pid, pctA: va / tot, pctB: vb / tot, transfers: transfers, stats: stats2 };
    out.winner = va >= vb ? A.pid : B.pid;
    return out;
  }
  function finalScores(g) {
    return g.players.map(function (p) {
      var o = D.OBJECTIVES.filter(function (x) { return x.id === p.objective; })[0];
      var met = objectiveMet(g, p.id, p.objective);
      var pts = controlledPoints(g, p.id);
      return { pid: p.id, regions: pts, objective: o, met: met, bonus: met ? o.bonus : 0,
               total: pts + (met ? o.bonus : 0), cubes: totalCubes(g, p.id) };
    }).sort(function (a, b) { return b.total - a.total || b.cubes - a.cubes; });
  }

  var API = {
    createGame: createGame, startTurn: startTurn, resolveActions: resolveActions, resolveDebate: resolveDebate, setupDebate: setupDebate, duelResult: duelResult, replyPoints: replyPoints,
    isDebateTurn: isDebateTurn, spotlightTarget: spotlightTarget, applySpotlight: applySpotlight, endTurn: endTurn,
    finalScores: finalScores, objectiveMet: objectiveMet, election: election, poll: poll, votes: votes,
    dist: dist, allyOf: allyOf, allianceError: allianceError, answerOffer: answerOffer, acceptChance: acceptChance,
    poachTarget: poachTarget, transferRate: transferRate,
    actionCost: actionCost, checkAction: checkAction, mediaRegions: mediaRegions, gain: gain, bestRegions: bestRegions,
    controlledPoints: controlledPoints, controlledRegions: controlledRegions, totalCubes: totalCubes, ranking: ranking,
    leader: leader, cubes: cubes, minControl: minControl, player: player, rivalIn: rivalIn, strongestRegion: strongestRegion,
    regionVoters: regionVoters, turnoutStats: turnoutStats, mobilizeGain: mobilizeGain, lowTurnoutFit: lowTurnoutFit,
    NATPOP: NATPOP, setProgramme: setProgramme, segmentAppeal: segmentAppeal, echoOf: echoOf, echo: echo, echoBonus: echoBonus, echoRanks: echoRanks, programmeCred: programmeCred, programmeCost: programmeCost, measure: measure, MEAS: MEAS,
    resolveAffair: resolveAffair, enqueteChance: enqueteChance, affairDef: affairDef,
    resolveDilemma: resolveDilemma, dilemmaDef: dilemmaDef, applyFx: applyFx, markerAt: markerAt, hotHere: hotHere, crisisAct: crisisAct,
    impact: impact, cred: cred, isHot: isHot, concerns: concerns, bestTheme: bestTheme, terrainCubes: terrainCubes, mediaCubes: mediaCubes,
    REG: REG, PARTY: PARTY, THEME: THEME, makeRng: makeRng
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.PolitikEngine = API;
})(this);

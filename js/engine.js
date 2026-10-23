/* Politik — moteur de jeu (règles v0.1).
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
  function ranking(g) {
    return g.players.slice().sort(function (a, b) {
      return controlledPoints(g, b.id) - controlledPoints(g, a.id) || totalCubes(g, b.id) - totalCubes(g, a.id);
    }).map(function (p) { return p.id; });
  }
  function leader(g) {
    var r = ranking(g);
    var a = controlledPoints(g, r[0]), b = controlledPoints(g, r[1]);
    return (a > 0 && a > b) ? r[0] : null;
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
      seed: seed, rng: rng, turn: 0, phase: 'setup', winner: null, firstRound: false, over: false,
      players: ids.map(function (id, i) {
        var p = PARTY[id];
        return { id: id, human: id === humanParty, money: p.money, infl: p.infl,
                 cards: p.cards.slice(), objective: objs[i], debateWins: 0 };
      }),
      regions: {}, events: shuffle(D.EVENTS.map(function (e) { return e.id; }), rng),
      event: null, mods: {}, cancel: {}, log: [], history: []
    };
    D.REGIONS.forEach(function (r) { g.regions[r.id] = { cubes: {}, controller: null }; });
    g.players.forEach(function (pl) { PARTY[pl.id].bases.forEach(function (rid) { addCubes(g, rid, pl.id, R.startCubes); }); });
    updateAllControl(g);
    return g;
  }

  /* ---------- Début de tour : revenus, usure, événement ---------- */
  function startTurn(g) {
    g.turn += 1; g.mods = {}; g.cancel = {}; g.log = [];
    var out = { income: [], usure: null, event: null };
    if (g.turn > 1) {
      g.players.forEach(function (pl) {
        var bonus = Math.min(R.incomeRegionMax, controlledRegions(g, pl.id).length * R.incomePerRegion);
        pl.money += R.incomeMoney + bonus; pl.infl += R.incomeInfl;
        out.income.push({ pid: pl.id, money: R.incomeMoney + bonus, infl: R.incomeInfl });
      });
    }
    var em = player(g, 'EM');
    if (em && g.turn >= 4 && g.turn % 2 === 0) {
      var rid = strongestRegion(g, 'EM');
      if (rid) { addCubes(g, rid, 'EM', -1); out.usure = rid; g.log.push({ pid: 'EM', text: 'Usure du pouvoir : −1 cube en ' + REG[rid].name }); }
    }
    var evId = g.events[(g.turn - 1) % g.events.length];
    g.event = evId;
    out.event = { id: evId, effects: applyEvent(g, evId) };
    updateAllControl(g);
    g.phase = 'actions';
    return out;
  }

  function applyEvent(g, id) {
    var fx = [];
    function say(pid, t) { fx.push({ pid: pid, text: t }); }
    switch (id) {
      case 'crise': g.players.forEach(function (p) { p.money = Math.max(0, p.money - 2); }); say(null, 'Tous les partis perdent 2 €.'); break;
      case 'greve': g.mods.terrainExtra = 1; say(null, 'Campagnes terrain : +1 € ce tour.'); break;
      case 'scandale': {
        var l = leader(g);
        if (l) { var rid = strongestRegion(g, l, function (r) { return g.regions[r.id].controller === l; }) || strongestRegion(g, l);
          addCubes(g, rid, l, -2); say(l, PARTY[l].short + ' perd 2 cubes en ' + REG[rid].name + '.'); }
        else say(null, 'Personne n’est en tête : le scandale fait pschitt.');
        break; }
      case 'buzz': g.mods.socialFree = true; say(null, 'Actions Réseaux gratuites ce tour.'); break;
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
    if (act.type === 'card') return { money: 0, infl: 0 };
    var base = D.ACTIONS[act.type].cost;
    var c = { money: base.money, infl: base.infl };
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
    if (act.type === 'contre' && cubes(g, act.region, pid) < 1) return 'Il faut au moins 1 cube dans la région.';
    if (act.type === 'contre' && !rivalIn(g, act.region, pid)) return 'Aucun rival dans cette région.';
    if (act.type === 'reforme' && g.regions[act.region].controller !== pid) return 'Il faut contrôler la région.';
    return null;
  }
  function rivalIn(g, rid, pid) {
    var best = null, bn = 0;
    pids(g).forEach(function (o) { if (o === pid) return; var n = cubes(g, rid, o); if (n > bn) { bn = n; best = o; } });
    return best;
  }

  /* ---------- Valeur d'un renfort (utilisée par l'IA et pour les choix automatiques) ---------- */
  function gain(g, pid, rid, k) {
    var r = REG[rid], my = cubes(g, rid, pid), ctrl = g.regions[rid].controller;
    if (my >= R.maxCubes) return 0;
    k = Math.min(k, R.maxCubes - my);
    var top = 0; pids(g).forEach(function (o) { if (o !== pid) top = Math.max(top, cubes(g, rid, o)); });
    if (ctrl === pid) {
      var margin = my - top;
      return margin <= 1 ? r.pts * 0.35 * Math.min(k, 2) / 2 : r.pts * 0.04 * k;
    }
    var need = Math.max(minControl(pid) - my, top - my + (ctrl ? 1 : 1), 1);
    if (k >= need) return r.pts * (ctrl ? 1.25 : 1);
    return r.pts * 0.55 * k / need;
  }
  function bestRegions(g, pid, n, filter, k, exclude) {
    return D.REGIONS.filter(function (r) { return (!filter || filter(r)) && (!exclude || exclude.indexOf(r.id) < 0); })
      .map(function (r) { return { id: r.id, v: gain(g, pid, r.id, k || 1) }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, n).map(function (x) { return x.id; });
  }
  function mediaRegions(g, pid, rid) {
    var prof = REG[rid].profile;
    var others = bestRegions(g, pid, 2, function (r) { return r.profile === prof; }, 1, [rid]);
    return [rid].concat(others);
  }

  /* ---------- Résolution des actions ---------- */
  function resolveOne(g, pid, act) {
    var pl = player(g, pid), P = PARTY[pid];
    var name = act.type === 'card' ? D.CARDS[act.card].name : D.ACTIONS[act.type].name;
    var entry = { pid: pid, action: name, region: act.region || null, text: '', ok: true };
    if (g.cancel[pid]) { g.cancel[pid] = false; entry.ok = false; entry.text = 'Annulée par le 49.3 !'; return entry; }
    var err = checkAction(g, pid, act);
    if (err) { entry.ok = false; entry.text = 'Échoue : ' + err; return entry; }
    var c = actionCost(g, pid, act);
    if (pl.money < c.money || pl.infl < c.infl) { entry.ok = false; entry.text = 'Échoue : pas assez de ressources.'; return entry; }
    pl.money -= c.money; pl.infl -= c.infl;
    var rn = act.region ? REG[act.region].name : '';
    var t = [];
    switch (act.type) {
      case 'terrain': {
        var n = 2; if (pid === 'SM' && cubes(g, act.region, pid) >= 5) n = 3;
        n = addCubes(g, act.region, pid, n); t.push('+' + n + ' en ' + rn); break; }
      case 'medias': {
        mediaRegions(g, pid, act.region).forEach(function (rid) {
          var prof = REG[rid].profile, n = 1;
          if (pid === 'VP' && prof === 'urbaine') n++;
          if (pid === 'MN' && prof === 'industrielle') n++;
          n = addCubes(g, rid, pid, n); t.push('+' + n + ' ' + REG[rid].name);
        }); break; }
      case 'reseaux': {
        var d = 1 + Math.floor(g.rng() * 6);
        if (pid === 'FI' && d <= 2) { var d2 = 1 + Math.floor(g.rng() * 6); t.push('dé ' + d + ', relancé'); d = d2; }
        var m = d === 1 ? -1 : d <= 3 ? 1 : d <= 5 ? 2 : 4;
        var got = addCubes(g, act.region, pid, m);
        t.push('dé ' + d + (d === 6 ? ' VIRAL' : d === 1 ? ' bad buzz' : '') + ' : ' + (got >= 0 ? '+' : '') + got + ' en ' + rn); break; }
      case 'contre': {
        var rival = rivalIn(g, act.region, pid);
        var n2 = 2;
        if (rival === 'UG' && REG[act.region].profile === 'historique') n2 = Math.max(0, Math.min(2, cubes(g, act.region, 'UG') - 2));
        var lost = -addCubes(g, act.region, rival, -n2);
        t.push(PARTY[rival].short + ' −' + lost + ' en ' + rn); break; }
      case 'fonds': {
        var f = pid === 'EM' ? 4 : pid === 'VP' ? 2 : 3; pl.money += f; if (pid === 'EM') pl.infl += 1; t.push('+' + f + ' €' + (pid === 'EM' ? ' +1 ★' : '')); break; }
      case 'reforme': {
        var prof2 = REG[act.region].profile;
        D.REGIONS.forEach(function (r) { if (r.profile === prof2) { var x = addCubes(g, r.id, pid, 1); if (x) t.push('+1 ' + r.name); } });
        break; }
      case 'card': t = resolveCard(g, pid, act); pl.cards = pl.cards.filter(function (k) { return k !== act.card; }); break;
    }
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
        g.cancel[rk] = true; t.push('la prochaine action de ' + PARTY[rk].short + ' est annulée'); break; }
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
  function resolveDebate(g, bids) {
    var list = g.players.map(function (p) {
      var b = Math.max(0, Math.min(p.infl, Math.floor(bids[p.id] || 0)));
      p.infl -= b; return { pid: p.id, bid: b };
    }).sort(function (a, b) { return b.bid - a.bid; });
    var mult = g.turn === R.maxTurns ? 2 : 1;
    var res = { bids: list, rewards: [], grand: mult === 2 };
    function reward(pid, n) {
      var regs = bestRegions(g, pid, n, null, 1);
      regs.forEach(function (rid) { addCubes(g, rid, pid, mult); });
      res.rewards.push({ pid: pid, regions: regs, each: mult });
    }
    var top = list[0].bid;
    var firsts = list.filter(function (x) { return x.bid === top; });
    if (top === 0) { res.none = true; }
    else if (firsts.length === 1) {
      player(g, firsts[0].pid).debateWins += 1; reward(firsts[0].pid, 4);
      var second = list[1];
      if (second && second.bid > 0) {
        var seconds = list.filter(function (x) { return x.bid === second.bid; });
        seconds.forEach(function (x) { reward(x.pid, 2); });
      }
    } else firsts.forEach(function (x) { reward(x.pid, 2); });
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
    var res = { winner: null, firstRound: false, over: false };
    if (g.turn >= R.firstRoundFromTurn) {
      var r = ranking(g);
      if (controlledPoints(g, r[0]) >= R.majority) { g.winner = r[0]; g.firstRound = true; g.over = true; }
    }
    if (!g.over && g.turn >= R.maxTurns) { g.over = true; g.winner = finalScores(g)[0].pid; }
    g.history.push(g.players.map(function (p) { return { pid: p.id, pts: controlledPoints(g, p.id) }; }));
    res.winner = g.winner; res.firstRound = g.firstRound; res.over = g.over;
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
    createGame: createGame, startTurn: startTurn, resolveActions: resolveActions, resolveDebate: resolveDebate,
    isDebateTurn: isDebateTurn, spotlightTarget: spotlightTarget, applySpotlight: applySpotlight, endTurn: endTurn,
    finalScores: finalScores, objectiveMet: objectiveMet,
    actionCost: actionCost, checkAction: checkAction, mediaRegions: mediaRegions, gain: gain, bestRegions: bestRegions,
    controlledPoints: controlledPoints, controlledRegions: controlledRegions, totalCubes: totalCubes, ranking: ranking,
    leader: leader, cubes: cubes, minControl: minControl, player: player, rivalIn: rivalIn, strongestRegion: strongestRegion,
    REG: REG, PARTY: PARTY, makeRng: makeRng
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.PolitikEngine = API;
})(this);

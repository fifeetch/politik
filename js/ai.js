/* Politik — intelligence artificielle simple.
   Pour chaque action, l'IA estime ce qu'elle rapporte (régions gagnées ou défendues) et choisit la meilleure. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var E = node ? require('./engine.js') : root.PolitikEngine;

  function clone(g) {
    var c = { turn: g.turn, mods: g.mods, players: g.players.map(function (p) { return Object.assign({}, p, { cards: p.cards.slice() }); }), regions: {} };
    Object.keys(g.regions).forEach(function (k) { c.regions[k] = { cubes: Object.assign({}, g.regions[k].cubes), controller: g.regions[k].controller }; });
    return c;
  }
  function add(v, rid, pid, n) { var c = v.regions[rid].cubes; c[pid] = Math.max(0, Math.min(D.RULES.maxCubes, (c[pid] || 0) + n)); }

  function candidates(v, pid, turn) {
    var pl = E.player(v, pid), list = [];
    D.REGIONS.forEach(function (r) {
      list.push({ type: 'terrain', region: r.id });
      list.push({ type: 'reseaux', region: r.id });
      if (E.cubes(v, r.id, pid) >= 1 && E.rivalIn(v, r.id, pid)) list.push({ type: 'contre', region: r.id });
      if (v.regions[r.id].controller === pid) list.push({ type: 'reforme', region: r.id });
    });
    ['urbaine', 'rurale', 'industrielle', 'historique'].forEach(function (prof) {
      var best = E.bestRegions(v, pid, 1, function (r) { return r.profile === prof; }, 1)[0];
      if (best) list.push({ type: 'medias', region: best });
    });
    list.push({ type: 'fonds' });
    pl.cards.forEach(function (card) {
      var def = D.CARDS[card];
      if (def.target === 'region') {
        D.REGIONS.forEach(function (r) {
          if (!def.profiles || def.profiles.indexOf(r.profile) >= 0) list.push({ type: 'card', card: card, region: r.id });
        });
      } else list.push({ type: 'card', card: card });
    });
    return list;
  }

  /* Estimation de la valeur d'une action sur l'état virtuel v. Renvoie { v: valeur, apply: fn } */
  function evaluate(v, pid, act, rng) {
    var pl = E.player(v, pid);
    if (E.checkAction(v, pid, act)) return null;
    var cost = E.actionCost(v, pid, act);
    if (pl.money < cost.money || pl.infl < cost.infl) return null;
    var val = 0, eff = [];
    function boost(rid, n) { val += E.gain(v, pid, rid, n); eff.push([rid, pid, n]); }
    var prof = act.region ? E.REG[act.region].profile : null;
    switch (act.type) {
      case 'terrain': boost(act.region, pid === 'SM' && E.cubes(v, act.region, pid) >= 5 ? 3 : 2); break;
      case 'reseaux': val += 0.5 * E.gain(v, pid, act.region, 1) + 0.33 * E.gain(v, pid, act.region, 2) + 0.17 * E.gain(v, pid, act.region, 4) - 0.17 * 0.5;
        eff.push([act.region, pid, 1]); break;
      case 'medias': E.mediaRegions(v, pid, act.region).forEach(function (rid) {
          var p = E.REG[rid].profile, n = 1;
          if (pid === 'VP' && p === 'urbaine') n++;
          if (pid === 'MN' && p === 'industrielle') n++;
          boost(rid, n); }); break;
      case 'contre': {
        var rival = E.rivalIn(v, act.region, pid), r = E.REG[act.region];
        var ctrl = v.regions[act.region].controller;
        var after = E.cubes(v, act.region, rival) - 2;
        if (ctrl === rival) val += after < E.minControl(rival) || after <= E.cubes(v, act.region, pid) ? r.pts * 0.9 : r.pts * 0.2;
        else val += r.pts * 0.12;
        eff.push([act.region, rival, -2]); break; }
      case 'reforme': D.REGIONS.forEach(function (r) { if (r.profile === prof) boost(r.id, 1); }); break;
      case 'fonds': val += (pl.money < 3 ? 4 : pl.money < 6 ? 1.5 : 0.2) + (pid === 'EM' ? (pl.infl < 3 ? 2.5 : 1) : 0); break;
      case 'card': {
        var c = act.card;
        if (c === 'marche_pop' || c === 'climat') boost(act.region, 3);
        else if (c === 'grand_meeting') boost(act.region, 4);
        else if (c === 'fete_rose') { boost(act.region, 2); val += 1.5; }
        else if (c === 'remaniement') { val += E.gain(v, pid, act.region, 2) - 2; eff.push([act.region, pid, 2]); }
        else if (c === 'plateau_tele') E.bestRegions(v, pid, 3, function (r) { return r.profile === 'rurale' || r.profile === 'industrielle'; }, 2).forEach(function (rid) { boost(rid, 2); });
        else if (c === 'appel18') D.REGIONS.forEach(function (r) { if (r.profile === 'historique') boost(r.id, 1); });
        else if (c === 'canicule' || c === 'art493') val += 2 + v.turn * 0.4;
        else if (c === 'censure') val += 1.5 + v.turn * 0.2;
        else if (c === 'primaire' || c === 'rassemblement') val += pl.infl < 3 || pl.money < 4 ? 3.5 : 1;
        val -= v.turn < 5 ? 1.5 : 0; // garde ses cartes pour plus tard
        break; }
    }
    val -= cost.money * 0.35 + cost.infl * 0.6;
    val += rng() * 0.6;
    return { v: val, cost: cost, eff: eff, act: act };
  }

  function plan(g, pid) {
    var v = clone(g), out = [], rng = g.rng;
    var debate = E.isDebateTurn(g);
    for (var s = 0; s < D.RULES.actionsPerTurn; s++) {
      var best = null;
      candidates(v, pid, g.turn).forEach(function (act) {
        var e = evaluate(v, pid, act, rng);
        if (e && (!best || e.v > best.v)) best = e;
      });
      if (!best) { out.push({ type: 'fonds' }); continue; }
      var pl = E.player(v, pid);
      // garde un peu d'influence pour le débat
      if (debate && best.cost.infl > 0 && pl.infl - best.cost.infl < 2 && best.v < 4) { out.push({ type: 'fonds' }); pl.money += pid === 'EM' ? 4 : pid === 'VP' ? 2 : 3; continue; }
      pl.money -= best.cost.money; pl.infl -= best.cost.infl;
      if (best.act.type === 'fonds') { pl.money += pid === 'EM' ? 4 : pid === 'VP' ? 2 : 3; if (pid === 'EM') pl.infl += 1; }
      if (best.act.type === 'card') pl.cards = pl.cards.filter(function (k) { return k !== best.act.card; });
      best.eff.forEach(function (e) { add(v, e[0], e[1], e[2]); });
      Object.keys(v.regions).forEach(function (rid) { recompute(v, rid); });
      out.push(best.act);
    }
    return out;
  }
  function recompute(v, rid) {
    var best = -1, leaders = [];
    v.players.forEach(function (p) { var n = E.cubes(v, rid, p.id); if (n > best) { best = n; leaders = [p.id]; } else if (n === best) leaders.push(p.id); });
    var prev = v.regions[rid].controller;
    if (leaders.length === 1 && best >= E.minControl(leaders[0])) v.regions[rid].controller = leaders[0];
    else if (prev && leaders.indexOf(prev) >= 0 && best >= E.minControl(prev)) v.regions[rid].controller = prev;
    else v.regions[rid].controller = null;
  }

  function bid(g, pid) {
    var pl = E.player(g, pid), max = pl.infl;
    if (max <= 0) return 0;
    var base = g.turn === D.RULES.maxTurns ? 0.75 : 0.5;
    return Math.min(max, Math.round(max * (base + (g.rng() - 0.5) * 0.4)));
  }
  function payspotlight(g, pid) { return E.player(g, pid).infl >= 4; }

  var API = { plan: plan, bid: bid, paySpotlight: payspotlight };
  if (node) module.exports = API; else root.PolitikAI = API;
})(this);

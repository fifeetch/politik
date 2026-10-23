/* Politik — intelligence artificielle simple.
   Pour chaque action, l'IA estime ce qu'elle rapporte (régions gagnées ou défendues) et choisit la meilleure. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var E = node ? require('./engine.js') : root.PolitikEngine;

  function clone(g) {
    var c = { turn: g.turn, mods: g.mods, hot: g.hot, nextHot: g.nextHot, markers: g.markers, bases: Object.assign({}, g.bases), rng: g.rng, alliances: Object.assign({}, g.alliances), betrayed: g.betrayed, offers: [], players: g.players.map(function (p) { return Object.assign({}, p, { cards: p.cards.slice() }); }), regions: {} };
    Object.keys(g.regions).forEach(function (k) { c.regions[k] = { cubes: Object.assign({}, g.regions[k].cubes), controller: g.regions[k].controller }; });
    return c;
  }
  function add(v, rid, pid, n) { var c = v.regions[rid].cubes; c[pid] = Math.max(0, Math.min(D.RULES.maxCubes, (c[pid] || 0) + n)); }

  function candidates(v, pid, turn) {
    var pl = E.player(v, pid), list = [];
    // le thème le plus porteur dans l'actu pour les Réseaux
    var hotTh = (v.hot || []).slice().sort(function (a, b) { return E.cred(v, pid, b) - E.cred(v, pid, a); })[0];
    D.REGIONS.forEach(function (r) {
      var th = E.bestTheme(v, pid, r.id);
      list.push({ type: 'terrain', region: r.id, theme: th });
      list.push({ type: 'reseaux', region: r.id, theme: hotTh || th });
      if (E.cubes(v, r.id, pid) >= 1 && E.rivalIn(v, r.id, pid)) list.push({ type: 'contre', region: r.id });
      if (v.regions[r.id].controller === pid) list.push({ type: 'reforme', region: r.id });
      if (pl.militants < D.RULES.militantsMax && v.turn <= D.RULES.maxTurns - 3) list.push({ type: 'militants', region: r.id });
    });
    D.THEMES.forEach(function (t) {
      var best = E.bestRegions(v, pid, 1, function (r) { return E.concerns(r.id, t.id); }, 1)[0];
      if (best) list.push({ type: 'medias', region: best, theme: t.id });
      if (E.cred(v, pid, t.id) === 2 && !E.isHot(v, t.id)) list.push({ type: 'imposer', theme: t.id });
    });
    list.push({ type: 'fonds' });
    if (!E.allyOf(v, pid)) v.players.forEach(function (o) {
      if (o.id !== pid && !E.allianceError(v, pid, o.id)) list.push({ type: 'alliance', target: o.id });
    });
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
    if (pl.money < cost.money || pl.infl < cost.infl || pl.forme < cost.forme) return null;
    var val = 0, eff = [];
    function boost(rid, n) { val += E.gain(v, pid, rid, n); eff.push([rid, pid, n]); }
    var prof = act.region ? E.REG[act.region].profile : null;
    switch (act.type) {
      case 'terrain': {
        var pt = E.poachTarget(v, pid, act.region, true);
        boost(act.region, E.terrainCubes(v, pid, act.region, act.theme) + (pt ? (pt.d === 1 ? 1 : 0.5) : 0));
        if (pt && pt.d === 1) eff.push([act.region, pt.pid, -1]);
        break; }
      case 'reseaux': {
        var hb = E.isHot(v, act.theme) ? D.RULES.socialHotBonus : 0;
        val += 0.5 * E.gain(v, pid, act.region, 1 + hb) + 0.33 * E.gain(v, pid, act.region, 2 + hb) + 0.17 * E.gain(v, pid, act.region, 4 + hb) - (hb ? 0 : 0.17 * 0.5);
        eff.push([act.region, pid, 1 + hb]); break; }
      case 'medias': E.mediaRegions(v, pid, act.region, act.theme).forEach(function (rid) {
          var n = E.mediaCubes(v, pid, rid, act.theme);
          if (n) boost(rid, n); }); break;
      case 'imposer': {
        // le thème aidera ses actions du prochain tour… mais aussi les rivaux crédibles sur ce thème
        if (v.turn >= D.RULES.maxTurns || (v.nextHot || []).some(function (x) { return x.theme === act.theme; })) return null;
        var rivals = v.players.filter(function (o) { return o.id !== pid && E.cred(v, o.id, act.theme) === 2; }).length;
        var weight = 0; D.REGIONS.forEach(function (r) { if (E.concerns(r.id, act.theme)) weight += r.pts; });
        val += 2.2 + weight * 0.08 - rivals * 0.9;
        break; }
      case 'contre': {
        var rival = E.rivalIn(v, act.region, pid), r = E.REG[act.region];
        var ctrl = v.regions[act.region].controller;
        var after = E.cubes(v, act.region, rival) - 2;
        if (ctrl === rival) val += after < E.minControl(rival) || after <= E.cubes(v, act.region, pid) ? r.pts * 0.9 : r.pts * 0.2;
        else val += r.pts * 0.12;
        val -= 0.6 + pl.cas * 0.35;   // une attaque = une casserole de plus
        eff.push([act.region, rival, -2]); break; }
      case 'militants': {
        // +1 cube par tour restant dans cette région
        var left = D.RULES.maxTurns - v.turn;
        val += E.gain(v, pid, act.region, 1) * Math.min(left, 4) * 0.42;
        break; }
      case 'reforme': D.REGIONS.forEach(function (r) { if (r.profile === prof) boost(r.id, 1); }); break;
      case 'alliance': {
        // une alliance vaut surtout pour le second tour : plus intéressante en milieu de partie et avec un voisin direct
        var chance = E.acceptChance(v, act.target, pid);
        val += chance * (E.dist(pid, act.target) === 1 ? 6 : 4.5) * (v.turn >= 3 ? 1 : 0.6);
        if (E.PARTY[pid].pos === 1 || E.PARTY[pid].pos === 6) val *= 1.8; // aux extrémités, sans allié, le second tour est perdu d'avance
        break; }
      case 'fonds': val += (pl.money < 3 ? 4 : pl.money < 6 ? 1.5 : 0.2) + (pid === 'EM' ? (pl.infl < 3 ? 2.5 : 1) : 0); break;
      case 'card': {
        var c = act.card;
        if (c === 'marche_pop' || c === 'climat') boost(act.region, 3);
        else if (c === 'grand_meeting') boost(act.region, 4);
        else if (c === 'fete_rose') { boost(act.region, 2); val += 1.5; }
        else if (c === 'remaniement') { val += E.gain(v, pid, act.region, 2) - 2; eff.push([act.region, pid, 2]); }
        else if (c === 'plateau_tele') E.bestRegions(v, pid, 3, function (r) { return r.profile === 'rurale' || r.profile === 'industrielle'; }, 2).forEach(function (rid) { boost(rid, 2); });
        else if (c === 'appel18') D.REGIONS.forEach(function (r) { if (r.profile === 'historique') boost(r.id, 1); });
        else if (c === 'canicule') val += 2 + v.turn * 0.4;
        else if (c === 'art493') val += 1.4 + v.turn * 0.4 - pl.cas * 0.35;
        else if (c === 'censure') val += 1.5 + v.turn * 0.2;
        else if (c === 'primaire' || c === 'rassemblement') val += pl.infl < 3 || pl.money < 4 ? 3.5 : 1;
        val -= v.turn < 5 ? 1.5 : 0; // garde ses cartes pour plus tard
        break; }
    }
    // fatigue : si l'action vide la forme du candidat, risque de gaffe
    if (cost.forme && pl.forme - cost.forme === 0) val = val * (1 - D.RULES.gaffeChance) - D.RULES.gaffeChance * 1.5;
    val -= cost.money * 0.35 + cost.infl * 0.6 + cost.forme * 0.4;
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
      pl.money -= best.cost.money; pl.infl -= best.cost.infl; pl.forme -= best.cost.forme;
      if (best.act.type === 'militants') { v.bases[best.act.region] = (v.bases[best.act.region] || []).concat([pid]); pl.militants += 1; }
      if (best.act.type === 'fonds') { pl.money += pid === 'EM' ? 4 : pid === 'VP' ? 2 : 3; if (pid === 'EM') pl.infl += 1; }
      if (best.act.type === 'alliance') { v.alliances[pid] = best.act.target; v.alliances[best.act.target] = pid; }
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

  /* Dilemmes : l'IA estime la valeur moyenne de chaque option */
  function fxValue(g, pid, list) {
    var pl = E.player(g, pid), v = 0;
    (list || []).forEach(function (e) {
      switch (e.k) {
        case 'money': v += e.n * (pl.money < 4 ? 0.5 : 0.3); break;
        case 'infl': v += e.n * 0.55; break;
        case 'forme': v += e.n * 0.5; break;
        case 'cas': v -= e.n * (0.9 + pl.cas * 0.25); break;
        case 'strong': v += e.n * 1.6; break;
        case 'loseTop': v -= e.n * e.count * 1.4; break;
        case 'regions': v += e.n * e.count * 1.3; break;
        case 'rival': v += e.n * 0.9; break;
        case 'dice': v += e.chance * fxValue(g, pid, e.win) + (1 - e.chance) * fxValue(g, pid, e.lose); break;
        case 'later': v += (g.turn + e.turns <= D.RULES.maxTurns ? e.chance : 0) * fxValue(g, pid, e.fx) * 0.85; break;
      }
    });
    return v;
  }
  function chooseDilemma(g, pid) {
    var d = E.dilemmaDef(g.dilemma.id), best = 0, bv = -1e9;
    d.options.forEach(function (o, i) { var x = fxValue(g, pid, o.fx) + g.rng() * 0.8; if (x > bv) { bv = x; best = i; } });
    return best;
  }

  function acceptOffer(g, target, from) { return g.rng() < E.acceptChance(g, target, from); }

  var API = { plan: plan, bid: bid, paySpotlight: payspotlight, acceptOffer: acceptOffer, chooseDilemma: chooseDilemma };
  if (node) module.exports = API; else root.PolitikAI = API;
})(this);

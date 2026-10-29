/* Politik — intelligence artificielle simple.
   Pour chaque action, l'IA estime ce qu'elle rapporte (régions gagnées ou défendues) et choisit la meilleure. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var E = node ? require('./engine.js') : root.PolitikEngine;

  function clone(g) {
    var c = { seed: g.seed, hist: g.hist, aud: g.aud ? JSON.parse(JSON.stringify(g.aud)) : null, audOn: g.audOn, turn: g.turn, weight: g.weight, base: g.base, mode: g.mode, nost: Object.assign({}, g.nost), petals: g.petals, micro: g.micro, hidden: g.hidden, eclatUntil: g.eclatUntil, bingo: g.bingo, mods: g.mods, hot: g.hot, nextHot: g.nextHot, markers: g.markers, bases: Object.assign({}, g.bases), rng: g.rng, alliances: Object.assign({}, g.alliances), betrayed: g.betrayed, offers: [], players: g.players.map(function (p) { return Object.assign({}, p, { cards: p.cards.slice() }); }), regions: {} };
    Object.keys(g.regions).forEach(function (k) { var o = g.regions[k]; c.regions[k] = { cubes: Object.assign({}, o.cubes), controller: o.controller, ins: o.ins, abst: o.abst, blank: o.blank }; });
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
      list.push({ type: 'mobiliser', region: r.id });
      if (E.cubes(v, r.id, pid) >= 1 && E.rivalIn(v, r.id, pid)) list.push({ type: 'contre', region: r.id });
      if (v.regions[r.id].controller === pid) list.push({ type: 'reforme', region: r.id });
      if (pl.militants < D.RULES.militantsMax && v.turn <= D.RULES.maxTurns - 3) list.push({ type: 'militants', region: r.id });
    });
    D.THEMES.forEach(function (t) {
      var best = E.bestRegions(v, pid, 1, function (r) { return E.concerns(r.id, t.id); }, 1)[0];
      if (E.cred(v, pid, t.id) === 2 && !E.isHot(v, t.id)) list.push({ type: 'imposer', theme: t.id });
    });
    // v3.8 : la Télé est une interview nationale : on la tente sur ses 2 meilleurs thèmes (et le thème à la une)
    var tvThemes = D.THEMES.map(function (t) { return t.id; }).sort(function (a, b) { return E.impact(v, pid, null, b) - E.impact(v, pid, null, a); }).slice(0, 2);
    if (hotTh && tvThemes.indexOf(hotTh) < 0) tvThemes.push(hotTh);
    tvThemes.forEach(function (th) { list.push({ type: 'medias', theme: th }); });
    // v3.9 : la matinale (sur la radio qui l'accueille le mieux) et le 20 h s'il est invité
    if (!E.matinaleError(v, pid)) D.STATIONS.forEach(function (st) { if (E.stationFit(pid, st.id).k !== 'far') list.push({ type: 'matinale', theme: tvThemes[0], station: st.id }); });
    if (!E.vingtError(v, pid)) tvThemes.forEach(function (th) { list.push({ type: 'vingt', theme: th }); });
    // v4.4 (Bêta) : parrainages, candidature commune, défi du débat
    if (E.isBeta(v)) {
      if (pl.sign != null && pl.sign < D.BETA.parr.need && v.turn <= E.parrDeadline(v)) list.push({ type: 'parrainages' });
      if (v.turn >= 2 && v.turn <= D.BETA.union.lastTurn && !pl.unionTried) v.players.forEach(function (o) { if (o.id !== pid && !o.human && !E.unionError(v, pid, o.id)) list.push({ type: 'union', target: o.id }); });
      if (!pl.defiUsed && v.turn >= 2) { var rkD = E.ranking(v), myD = rkD.indexOf(pid); if (myD >= 2 && myD <= 6) { var tD = rkD[0] !== pid && !E.player(v, rkD[0]).human ? rkD[0] : rkD[1]; if (tD && !E.defiError(v, pid, tD)) list.push({ type: 'defi', target: tD }); } }
    }
    list.push({ type: 'fonds' });
    list.push({ type: 'repos' });   // v3.6.6
    // v3.1 : les actions propres à un parti
    var tr = E.traitOf(pid);
    if (tr === 'nostalgie') D.REGIONS.forEach(function (r) { list.push({ type: 'nostalgie', region: r.id }); });
    if (tr === 'rose') list.push({ type: 'rappel' });
    if (tr === 'centre') list.push({ type: 'fusion' });
    if (tr === 'transparent') list.push({ type: 'eclat' });
    // enquêter sur un rival qui traîne des casseroles ou qui mène
    // v1.7 : avec 12 partis, on n'enquête que sur les 3 premiers des sondages (sinon chacun enquête sur tout le monde)
    // v3.6.5 : on n'enquête que sur un rival direct (juste devant soi au sondage, ou le premier si l'on est 2e), 2 fois par partie au plus
    var rkAll = E.ranking(v), myRk = rkAll.indexOf(pid);
    if (v.turn < D.RULES.maxTurns && (pl.enqUsed || 0) < D.RULES.aiEnqueteMax && myRk > 0 && myRk <= 4) {
      list.push({ type: 'enquete', target: rkAll[myRk - 1] });
      if (myRk === 2) list.push({ type: 'enquete', target: rkAll[0] });
    }
    // v1.6 : plus d'alliance pendant la campagne du 1er tour (elles se négocient entre les deux tours)
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
    if (pl.money < cost.money || pl.forme < cost.forme) return null;
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
      case 'matinale':
      case 'vingt':
      case 'medias': {
        // v3.8 : on choisit la réponse qui rapporte le plus au sondage ; l'effet s'use au fil des tours
        var fmtA = act.type === 'medias' ? 'tele' : act.type;
        var q = E.pickQuestion(v, act.theme, pid.length + pid.charCodeAt(0)), iv = E.interview(v, pid, q.id, fmtA, act.station ? E.stationBoost(pid, act.station) : null), card = E.aiAnswer(v, pid, iv);
        act.qid = q.id; act.reply = card.key;
        var left = Math.max(0, D.RULES.maxTurns - v.turn);
        val += E.quickGain(v, pid, card.gains) * 100 * 1.6 * (1 + Math.pow(D.MEDIA.keep, left)) / 2 * 1.4 - (card.risk || 0) * 1.2;
        if (act.type === 'vingt') { var sr = E.stageRisk(v, pid, Math.max(0, pl.forme - 1)); val *= 1 - 1.5 * sr; if (left > 3) val *= 0.6; }   // le trac, et on le garde pour la fin
        break; }
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
      case 'mobiliser': boost(act.region, E.mobilizeGain(v, pid, act.region).n); val += 0.2; break;
      case 'militants': {
        // +1 cube par tour restant dans cette région
        var left = D.RULES.maxTurns - v.turn;
        val += E.gain(v, pid, act.region, 1) * Math.min(left, 4) * 0.42;
        break; }
      case 'reforme': D.REGIONS.forEach(function (r) { if (r.profile === prof) boost(r.id, 1); }); break;
      case 'enquete': {
        if ((v.enq || {})[pid + act.target]) return null;
        var ch = E.enqueteChance(v, act.target), rk = E.ranking(v).indexOf(act.target);
        val += ch * (4.6 + (rk === 0 ? 2.4 : rk === 1 ? 1 : 0)) - (1 - ch) * D.RULES.enqueteBackfire * 2 * (0.6 + pl.cas * 0.2);
        break; }
      case 'alliance': {
        // une alliance vaut surtout pour le second tour : plus intéressante en milieu de partie et avec un voisin direct
        var chance = E.acceptChance(v, act.target, pid);
        val += chance * (E.dist(pid, act.target) === 1 ? 6 : 4.5) * (v.turn >= 3 ? 1 : 0.6);
        break; }
      case 'repos': val += pl.forme <= 0 ? 2.6 : pl.forme === 1 ? 1.4 : -5; break;
      case 'parrainages': {   // v4.4 : indispensable si les signatures ne viendront pas toutes seules
        var lackP = D.BETA.parr.need - pl.sign, passive = D.BETA.parr.perTurn * Math.max(0, E.parrDeadline(v) - v.turn);
        val += lackP > passive ? 9 : 0.3; break; }
      case 'union': {   // v4.4 : absorber un petit voisin
        var chU = E.unionChance(v, pid, act.target), pt = E.poll(v).filter(function (x) { return x.pid === act.target; })[0];
        val += chU * (pt ? pt.pct : 0) * 100 * 0.7 * 1.6 * 1.5 - 1; break; }   // un rival de moins dans son camp
      case 'defi': val += 2.2 + v.turn * 0.15; break;   // v4.4
      case 'nostalgie': {
        var nv = E.nostalgiaPreview(v, pid, act.region);
        if (!nv || nv.stone) return null;   // l'ordinateur ne va jamais jusqu'à l'âge de pierre
        boost(act.region, nv.n);
        if (nv.war) eff.push([act.region, pid === 'MN' ? 'RQ' : 'MN', -1]);
        val -= nv.youth * 1.3;
        break; }
      case 'rappel': {
        var RL = D.RULES;
        val += RL.rappelChance * (E.spec(v, pid, RL.rappelSwing) * 1.6 + 1) - (1 - RL.rappelChance) * RL.rappelCas * (0.7 + pl.cas * 0.25);
        if (E.lostPetals(v).length === 1) val += 1.2;   // la rose peut refleurir
        break; }
      case 'fusion': E.bestRegions(v, pid, E.spec(v, pid, D.RULES.fusionGain), null, 1).forEach(function (rid) { boost(rid, 1); }); val += 1.6; break;
      case 'eclat': {
        if (!v.hidden) return null;
        E.bestRegions(v, pid, E.spec(v, pid, D.RULES.eclatGain), null, 1).forEach(function (rid) { boost(rid, 1); });
        val += 2.4 * Math.min(3, D.RULES.maxTurns - v.turn + 1) / 3;
        break; }
      case 'fonds': val += (pl.money < 3 ? 4 : pl.money < 6 ? 1.5 : 0.2); break;
      case 'card': {   // v5.0 : les cartes de parti (rechargeables, bonus quand leur sujet fait l'actu)
        var c = act.card, C = D.CARDS[c] || {};
        var sp = function (n) { return E.cardN(v, pid, c, n); }, pp = function (x) { return E.cardPt(v, pid, c, x) * 5.5; };   // 1 pt de sondage ≈ 5,5 en valeur
        if (c === 'marche_pop' || c === 'climat' || c === 'piquet' || c === 'grand_meeting') boost(act.region, sp(C.n));
        else if (c === 'fete_rose' || c === 'huma') { boost(act.region, sp(2)); val += 1.5 * sp(2) / 2; }
        else if (c === 'remaniement') { val += E.gain(v, pid, act.region, sp(2)) - sp(2); eff.push([act.region, pid, sp(2)]); }
        else if (c === 'plateau_tele') E.bestRegions(v, pid, 3, function (r) { return r.profile === 'rurale' || r.profile === 'industrielle'; }, 2).forEach(function (rid) { boost(rid, sp(2)); });
        else if (c === 'clochers') E.bestRegions(v, pid, 2, function (r) { return r.profile === 'rurale'; }, 2).forEach(function (rid) { boost(rid, sp(2)); });
        else if (c === 'appel18') D.REGIONS.forEach(function (r) { if (r.profile === 'historique') boost(r.id, sp(1)); });
        else if (c === 'canicule') val += (E.cardHot(v, c) ? 3 : 2) + v.turn * 0.3;
        else if (c === 'art493') val += 1.4 + v.turn * 0.4 - (E.cardHot(v, c) ? 0 : pl.cas * 0.35);
        else if (c === 'censure') val += pp(C.pt) * 0.5 + 0.5;
        else if (c === 'nationaliser' || c === 'depassement') val += pp(C.pt);
        else if (c === 'greve' || c === 'referendum') val += pp(C.pt) + 0.8;
        break; }
    }
    // fatigue : si l'action vide la forme du candidat, risque de gaffe
    if (cost.forme && pl.forme - cost.forme === 0) val = val * (1 - D.RULES.gaffeChance) - D.RULES.gaffeChance * 1.5;
    val -= cost.money * 0.35 + cost.forme * 0.4;
    val += rng() * 0.6;
    return { v: val, cost: cost, eff: eff, act: act };
  }

  function plan(g, pid) {
    var v = clone(g), out = [], rng = g.rng;
    var debate = E.isDebateTurn(g);
    for (var s = 0; s < E.actionsFor(g, pid); s++) {
      var best = null;
      candidates(v, pid, g.turn).forEach(function (act) {
        var e = evaluate(v, pid, act, rng);
        if (e && (!best || e.v > best.v)) best = e;
      });
      if (!best) { out.push({ type: 'fonds' }); continue; }
      var pl = E.player(v, pid);
      // garde un peu d'argent pour préparer le débat (v5.0 : la préparation se paie en €)
      if (debate && best.cost.money > 0 && pl.money - best.cost.money < 2 && best.v < 4) { out.push({ type: 'fonds' }); pl.money += E.fundsGain(pid).money; continue; }
      pl.money -= best.cost.money; pl.forme -= best.cost.forme;
      if (best.act.type === 'militants') { v.bases[best.act.region] = (v.bases[best.act.region] || []).concat([pid]); pl.militants += 1; }
      if (best.act.type === 'fonds') pl.money += E.fundsGain(pid).money;
      if (best.act.type === 'enquete') { v.enq = v.enq || {}; v.enq[pid + best.act.target] = 1; }
      if (best.act.type === 'alliance') { v.alliances[pid] = best.act.target; v.alliances[best.act.target] = pid; }
      if (best.act.type === 'matinale') pl.matinaleTurn = g.turn;
      if (best.act.type === 'union') pl.unionTried = 1;
      if (best.act.type === 'defi') pl.defiUsed = g.turn;
      if (best.act.type === 'parrainages') pl.sign = Math.min(D.BETA.parr.need, pl.sign + D.BETA.parr.action);
      if (best.act.type === 'vingt') pl.vingtUsed = g.turn;
      if (best.act.type === 'repos') pl.forme = Math.min(D.RULES.formeMax, pl.forme + D.RULES.reposForme);
      if (best.act.type === 'nostalgie') { v.nost[pid] = (v.nost[pid] || 0) + 1; pl.nostTurn = g.turn; }
      if (best.act.type === 'rappel') pl.rappelTurn = g.turn;
      if (best.act.type === 'fusion') v.micro = null;
      if (best.act.type === 'eclat') { v.hidden = false; v.eclatUntil = g.turn + D.RULES.eclatTurns - 1; }
      if (best.act.type === 'card') { pl.cardCd = Object.assign({}, pl.cardCd); pl.cardCd[best.act.card] = g.turn + D.CARD_RULES.recharge; }
      best.eff.forEach(function (e) { add(v, e[0], e[1], e[2]); });
      Object.keys(v.regions).forEach(function (rid) { recompute(v, rid); });
      out.push(best.act);
    }
    clanPick(g, pid, out);   // v5.0 (Bêta)
    return out;
  }
  /* v5.0 (Bêta) : l'ordinateur tente parfois une opération clandestine, avec les mêmes règles et les mêmes risques que le joueur.
     Fréquence limitée (une par tour au plus, pas tous les tours), jamais quand il est déjà très suspect.
     Cible : le rival juste devant lui au sondage (ou le premier s'il est 2e). L'espionnage ne lui sert à rien : il ne le joue pas.
     Aucun parti n'a de bonus ou de malus selon son bord politique. */
  function clanPick(g, pid, out) {
    if (!E.clanOn(g) || !out.length) return;
    var C = D.BETA.clan, pl = E.player(g, pid);
    if (E.suspicion(g, pid) > C.ai.suspMax || g.rng() >= C.ai.chance) return;
    var rk = E.ranking(g), me = rk.indexOf(pid), tgt = me > 0 ? rk[me - 1] : rk[1];
    var money = pl.money, forme = pl.forme;
    out.forEach(function (a) { var c = E.actionCost(g, pid, a); money -= c.money; forme -= c.forme; });
    var last = out[out.length - 1], lc = E.actionCost(g, pid, last); money += lc.money; forme += lc.forme;   // l'opération remplace sa dernière action
    var prefs = money < 4 ? ['occulte'] : me <= 3 ? ['fakenews', 'denigrement', 'sabotage', 'fuite'] : ['denigrement', 'fakenews', 'fuite', 'occulte'];
    var off = Math.floor(g.rng() * prefs.length);   // un peu de variété dans le choix de l'opération
    prefs = prefs.slice(off).concat(prefs.slice(0, off));
    for (var i = 0; i < prefs.length; i++) {
      var op = E.clanOp(prefs[i]), act = { type: 'clan', op: prefs[i], target: op.target ? tgt : undefined };
      if ((op.cost.money || 0) > money || (op.cost.forme || 0) > forme || E.clanError(g, pid, act)) continue;
      if (E.clanRisk(g, pid, prefs[i]) > 0.6) continue;
      out[out.length - 1] = act; return;
    }
  }
  function recompute(v, rid) {
    var best = -1, leaders = [];
    v.players.forEach(function (p) { var n = E.cubes(v, rid, p.id); if (n > best) { best = n; leaders = [p.id]; } else if (n === best) leaders.push(p.id); });
    var prev = v.regions[rid].controller;
    if (leaders.length === 1 && best >= E.minControl(leaders[0])) v.regions[rid].controller = leaders[0];
    else if (prev && leaders.indexOf(prev) >= 0 && best >= E.minControl(prev)) v.regions[rid].controller = prev;
    else v.regions[rid].controller = null;
  }

  /* v0.6 : débat. Préparation (v5.0 : en €, 1 € par niveau), puis choix des répliques selon le tempérament et la situation. */
  function prep(g, pid) {
    var pl = E.player(g, pid), max = Math.min(Math.floor(pl.money / D.RULES.prepCost), D.RULES.debatePrepMax);
    var want = g.turn === D.RULES.maxTurns ? 3 : pl.money >= 8 ? 2 : pl.money >= 4 ? 1 : 0;
    return Math.min(max, want);
  }
  /* v4.0 : la carte de réponse choisie en débat (d : le duel, avec sa question ; sinon une question sur le thème) */
  function chooseReply(g, pid, theme, opp, d) {
    var duel = d && d.qid ? d : { a: pid, b: opp, theme: theme, qid: E.pickQuestion(g, theme, 31).id };
    return E.aiDebatePick(g, pid, duel);
  }
  function payspotlight(g, pid) { return E.player(g, pid).money >= D.RULES.spotlightCost + 3; }   // v5.0 : en €

  /* Dilemmes : l'IA estime la valeur moyenne de chaque option */
  function fxValue(g, pid, list) {
    var pl = E.player(g, pid), v = 0;
    (list || []).forEach(function (e) {
      switch (e.k) {
        case 'money': v += e.n * (pl.money < 4 ? 0.5 : 0.3); break;
        case 'pt': v += e.n * 5.5; break;   // v5.0 : points de sondage
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
  function chooseReaction(g, pid) {
    var best = 0, bv = -1e9;
    // chaque parti a ses réflexes face aux affaires
    var bias = { FI: { medias: 2.2 }, MN: { medias: 2.4, nier: 1 }, UG: { nier: 1.8 }, EM: { fusible: 1.2, nier: 0.8 }, SM: { excuses: 0.8 }, VP: { excuses: 1 } }[pid] || {};
    D.REACTIONS.forEach(function (rc, i) { var x = fxValue(g, pid, rc.fx) + (bias[rc.id] || 0) + g.rng() * 1.2; if (x > bv) { bv = x; best = i; } });
    return best;
  }
  function chooseDilemma(g, pid) {
    var d = E.dilemmaDef(g.dilemma.id), best = 0, bv = -1e9;
    d.options.forEach(function (o, i) { var x = fxValue(g, pid, o.fx) + g.rng() * 0.8; if (x > bv) { bv = x; best = i; } });
    return best;
  }

  function acceptOffer(g, target, from) { return g.rng() < E.acceptChance(g, target, from); }

  var API = { plan: plan, prep: prep, chooseReply: chooseReply, paySpotlight: payspotlight, acceptOffer: acceptOffer, chooseDilemma: chooseDilemma, chooseReaction: chooseReaction };
  if (node) module.exports = API; else root.PolitikAI = API;
})(this);

/* Politik — v2.3 : les élections législatives (moteur sans affichage).
   577 circonscriptions, un député chacune, deux tours, avec les vraies règles :
   - élu au 1er tour : plus de 50 % des exprimés ET au moins 25 % des inscrits ;
   - qualifié pour le 2nd tour : au moins 12,5 % des inscrits (au minimum les deux premiers) ;
   - au 2nd tour, le premier l'emporte. En triangulaire, le troisième peut se désister.
   Point de départ : les scores régionaux du 1er tour de la présidentielle, l'effet locomotive du président,
   et une abstention plus forte chez ceux qui votent peu. Tous les réglages sont dans data.js (LEGIS). */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var E = node ? require('./engine.js') : root.PolitikEngine;
  var L = D.LEGIS;

  function gauss(rng) { var u = Math.max(1e-9, rng()), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function axis(pid) { return (E.PARTY[pid].pos - 3.5) / 3.2; }       // −1 à gauche, +1 à droite
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function ids(g) { return g.players.map(function (p) { return p.id; }); }

  /* Les scores régionaux du 1er tour de la présidentielle (même calcul que les sondages du jeu) */
  function regionalBase(g) {
    var out = {};
    D.REGIONS.forEach(function (r) {
      var reg = g.regions[r.id], T = 0, w = {}, o = E.othersShare(g, r.id), s = { _div: o };
      ids(g).forEach(function (pid) { w[pid] = E.cubes(g, r.id, pid) * (reg.controller === pid ? D.RULES.incumbentBonus : 1); T += w[pid]; });
      ids(g).forEach(function (pid) { s[pid] = T ? (1 - o) * w[pid] / T : 0; });
      s._div = Math.max(s._div, 0.03);           // il y a toujours quelques candidats divers
      out[r.id] = s;
    });
    return out;
  }
  /* Ceux qui votent peu (jeunes, ouvriers) se déplacent encore moins aux législatives :
     un parti dont le programme parle surtout à eux perd une partie de ses électeurs */
  function lowTurnoutIndex(g, pid) {
    var pl = E.player(g, pid), prog = (pl && pl.programme) || E.PARTY[pid].programme || [];
    var ap = E.segmentAppeal(prog.concat((pl && pl.financing) || [])), s = 0, w = 0;
    D.SEGMENTS.forEach(function (sg) { var a = Math.max(0, ap[sg.id] || 0); s += a * (1.2 - D.VOTE_PROP[sg.id]); w += a; });
    return w ? s / w : 0.2;
  }
  var NAT_LOW = (function () { var s = 0, t = 0; D.REGIONS.forEach(function (r) { var x = 0; D.SEGMENTS.forEach(function (sg) { x += r.pop[sg.id] / 100 * (1.2 - D.VOTE_PROP[sg.id]); }); s += x * r.ins; t += r.ins; }); return s / t; })();
  function regionTurnout(g, rid, ratio) {
    var r = E.REG[rid], x = 0;
    D.SEGMENTS.forEach(function (sg) { x += r.pop[sg.id] / 100 * (1.2 - D.VOTE_PROP[sg.id]); });
    var t1 = 1 - E.regionVoters(g, rid).abst;          // participation au 1er tour de la présidentielle
    return clamp(t1 * ratio * (1 - 1.5 * (x - NAT_LOW)), 0.2, 0.85);
  }

  /* Les candidatures communes : les unions par défaut (data.js) actives si au moins deux partis sont en lice,

  /* Les candidatures communes : les unions par défaut (data.js) actives si au moins deux partis sont en lice,
     et la majorité présidentielle.
     - En automatique (simulations, dissolution) : le président, son union par défaut, ses soutiens d'entre-deux-tours,
       et les ralliements des partis seuls tout proches.
     - v2.4 : quand le joueur négocie lui-même (opts.allies), la majorité présidentielle = le président + ses alliés,
       et les partis de son union par défaut qui n'ont pas signé partent sous leur propre bannière. */
  function buildUnions(g, opts) {
    var present = ids(g), taken = {}, unions = [], defs = opts.unions || L.unions;
    // v2.7 : le joueur dans l'opposition fait campagne avec son propre camp (lui + ses alliés), qui passe en premier
    if (opts.player) {
      var mine = [opts.player].concat((opts.playerAllies || []).filter(function (p) { return present.indexOf(p) >= 0 && p !== opts.player && p !== opts.pres; }));
      unions.push({ id: 'joueur', name: 'Ton camp', parties: mine, focus: true });
      mine.forEach(function (p) { taken[p] = true; });
    }
    if (opts.pres) {
      var members;
      if (opts.allies) members = [opts.pres].concat(opts.allies.filter(function (p) { return present.indexOf(p) >= 0 && p !== opts.pres; }));
      else {
        var base = defs.filter(function (u) { return u.parties.indexOf(opts.pres) >= 0; })[0];
        members = base ? base.parties.filter(function (p) { return present.indexOf(p) >= 0 && !taken[p]; }) : [opts.pres];
        (opts.partners || []).forEach(function (p) { if (present.indexOf(p) >= 0 && !taken[p] && members.indexOf(p) < 0 && E.dist(p, opts.pres) <= 2) members.push(p); });
        var inUnion = {}; defs.forEach(function (u) { u.parties.forEach(function (p) { if (present.indexOf(p) >= 0) inUnion[p] = true; }); });
        if (!opts.noRally) present.forEach(function (p) { if (!inUnion[p] && !taken[p] && members.indexOf(p) < 0 && Math.abs(E.PARTY[p].pos - E.PARTY[opts.pres].pos) <= L.rallyDist) members.push(p); });
      }
      unions.push({ id: 'pres', name: 'Majorité présidentielle', parties: members, pres: true });
      members.forEach(function (p) { taken[p] = true; });
    }
    defs.forEach(function (u) {
      var m = u.parties.filter(function (p) { return present.indexOf(p) >= 0 && !taken[p]; });
      if (m.length >= 2) { unions.push({ id: u.id, name: u.name, parties: m }); m.forEach(function (p) { taken[p] = true; }); }
    });
    present.forEach(function (p) { if (!taken[p]) unions.push({ id: p, name: E.PARTY[p].short, parties: [p], single: true }); });
    return unions;
  }
  function unionOf(unions, pid) { for (var i = 0; i < unions.length; i++) if (unions[i].parties.indexOf(pid) >= 0) return unions[i]; return null; }
  function pdist(unions, a, b) { if (a === b) return 0; var u = unionOf(unions, a); if (u && u.parties.indexOf(b) >= 0) return 0; return E.dist(a, b); }
  /* Ce qu'un allié apporte vraiment : ses électeurs suivent d'autant moins l'accord qu'il est loin du président */
  function keepOf(u, pid, pres) { if (!u.pres) return u.single ? 1 : L.unionKeep; return pid === pres ? 1 : (L.allyKeep[E.dist(pid, pres)] || 0.3); }

  /* ---------- 1. La préparation : la carte des 577 circonscriptions et les forces en présence ----------
     opts : pres, margin, loser, partners | allies, presMult (dissolution), dissolution,
            geoSeed (la géographie des circonscriptions, fixée pour que projections et vote réel portent sur la même carte),
            rng (le hasard du jour du vote), project (projection : sans hasard du jour du vote),
            camp { nat, reg: {rid: x} } (la campagne du joueur), others { rid: {pid: x} } (la campagne des autres) */
  function prepare(g, opts) {
    opts = opts || {};
    var rng = opts.rng || g.rng, geo = opts.geoSeed != null ? E.makeRng(opts.geoSeed) : rng;
    var P = ids(g), base = regionalBase(g), unions = buildUnions(g, opts), presU = unions.filter(function (u) { return u.pres; })[0];
    var low = {}, lmin = 9, lmax = -9, mult = {};
    P.forEach(function (p) { low[p] = lowTurnoutIndex(g, p); lmin = Math.min(lmin, low[p]); lmax = Math.max(lmax, low[p]); });
    P.forEach(function (p) { mult[p] = 1 - (1 - L.lowTurnoutPenalty) * (lmax > lmin ? (low[p] - lmin) / (lmax - lmin) : 0); });
    var boost = 0;
    if (opts.pres) {
      boost = opts.presMult != null ? opts.presMult - 1 : L.loco + L.locoMargin * Math.max(0, opts.margin || 0);
      if (presU.parties.length === 1 && opts.presMult == null) boost *= L.locoAlone;
      if (!opts.project) boost = (1 + boost) * Math.exp(L.swing * (opts.swing != null ? opts.swing : gauss(rng))) - 1;   // l'humeur du pays
      mult[opts.pres] *= 1 + boost;
      presU.parties.forEach(function (p) { if (p !== opts.pres) mult[p] *= 1 + boost * L.locoUnion; });
    }
    if (opts.loser && mult[opts.loser] && opts.presMult == null) mult[opts.loser] *= 1 - L.loserDip;
    var ratio = opts.dissolution ? L.turnoutDissolution : L.turnoutRatio;
    // la géographie : pour chaque circonscription, son penchant, le bruit propre à chaque parti, sa participation
    var circs = [];
    D.REGIONS.forEach(function (r) {
      for (var c = 0; c < r.seats; c++) {
        var nz = {}; P.forEach(function (p) { nz[p] = gauss(geo); });
        circs.push({ r: r.id, ins: r.ins / r.seats, tilt: gauss(geo), nz: nz, dz: gauss(geo), tz: gauss(geo), pick: geo() });
      }
    });
    var F = opts.player ? 'joueur' : 'pres', focusU = unions.filter(function (u) { return u.id === F; })[0];
    return { g: g, opts: opts, rng: rng, P: P, base: base, unions: unions, presU: presU, focus: F, focusU: focusU, mult: mult, boost: boost, ratio: ratio, geo: circs,
      turnout: D.REGIONS.reduce(function (m, r) { m[r.id] = regionTurnout(g, r.id, ratio); return m; }, {}) };
  }
  function campMult(ctx, pid, rid) {
    var o = ctx.opts, k = 1;
    if (ctx.focusU && ctx.focusU.parties.indexOf(pid) >= 0 && o.camp) k *= (1 + (o.camp.nat || 0)) * (1 + ((o.camp.reg || {})[rid] || 0));
    if (o.others && o.others[rid] && o.others[rid][pid]) k *= 1 + o.others[rid][pid];
    return k;
  }

  /* ---------- 2. Le 1er tour ---------- */
  function round1(ctx) {
    var g = ctx.g, P = ctx.P, unions = ctx.unions, pres = ctx.opts.pres;
    var r1 = { circs: [], votes1: {}, ins: 0, votants1: 0, exprimes1: 0, regVotes: {} };
    unions.forEach(function (u) { r1.votes1[u.id] = 0; }); r1.votes1._div = 0;
    ctx.geo.forEach(function (gc, i) {
      var b = ctx.base[gc.r], sh = {};
      P.forEach(function (p) { sh[p] = b[p] * ctx.mult[p] * campMult(ctx, p, gc.r) * Math.exp(L.tilt * gc.tilt * axis(p) + L.noise * gc.nz[p]); });
      var div = b._div * L.othersStrength * Math.exp(L.noise * gc.dz);
      // une candidature par union : un parti de l'union la porte (le plus fort localement, le plus souvent)
      var cands = [];
      unions.forEach(function (u) {
        var v = 0, ws = [], wsum = 0, pick = null;
        u.parties.forEach(function (p) { v += sh[p] * keepOf(u, p, pres); var w = Math.pow(sh[p], 2) * (p === pres ? 1.6 : 1); ws.push({ p: p, w: w }); wsum += w; });
        var x = gc.pick * wsum; for (var k = 0; k < ws.length; k++) { x -= ws[k].w; if (x <= 0) { pick = ws[k].p; break; } }
        cands.push({ pid: pick || u.parties[0], u: u.id, v: v });
      });
      var sum = div; cands.forEach(function (x) { sum += x.v; });
      cands.forEach(function (x) { x.v /= sum; }); div /= sum;
      cands.sort(function (a, z) { return z.v - a.v; });
      var Tc = clamp(ctx.turnout[gc.r] * (1 + 0.06 * gc.tz), 0.15, 0.9), expIns = Tc * (1 - L.blank1);
      var c = { i: i, r: gc.r, ins: gc.ins, turnout1: Tc, expIns: expIns, c1: cands, div: div, status: '', q: null, withdrawn: [], winner: null, v2: null };
      var rv = r1.regVotes[gc.r] || (r1.regVotes[gc.r] = {});
      cands.forEach(function (x) { r1.votes1[x.u] += x.v * expIns * gc.ins; rv[x.u] = (rv[x.u] || 0) + x.v * expIns * gc.ins; });
      r1.votes1._div += div * expIns * gc.ins;
      r1.ins += gc.ins; r1.votants1 += Tc * gc.ins; r1.exprimes1 += expIns * gc.ins;
      var top = cands[0];
      if (top.v > L.electedVotes && top.v * expIns >= L.electedIns) { c.status = 'elu1'; c.winner = top.pid; }
      else { var q = cands.filter(function (x) { return x.v * expIns >= L.qualifyIns; }); if (q.length < 2) q = cands.slice(0, 2); c.q = q; c.status = q.length >= 3 ? 'tri' : 'duel'; }
      r1.circs.push(c);
    });
    r1.participation1 = r1.votants1 / r1.ins;
    return r1;
  }
  /* Les triangulaires où le camp du président doit choisir : se maintenir ou se désister (il est 3e ou plus) */
  function campChoices(ctx, r1) {
    return r1.circs.filter(function (c) {
      if (!c.q || c.q.length < 3) return false;
      for (var j = 2; j < c.q.length; j++) if (c.q[j].u === ctx.focus) return true;
      return false;
    });
  }

  /* ---------- 3. Le 2nd tour ----------
     dec (choix du joueur, sinon l'ordinateur applique la règle habituelle) :
       withdraw { numéro de circonscription: true } : le camp se désiste dans ces triangulaires ;
       pact : un bloc avec qui l'on s'est promis « je me retire ici, tu te retires là » ;
       barrage : un bloc contre lequel tu appelles à voter là où ton camp n'est plus en lice. */
  function round2(ctx, r1, dec) {
    var g = ctx.g, P = ctx.P, unions = ctx.unions, pres = ctx.opts.pres, rng = ctx.rng, project = ctx.opts.project, F = ctx.focus;
    var res = { circs: [], regions: {}, seats: {}, unions: unions, boost: ctx.boost, pres: pres || null, votes1: r1.votes1, ins: r1.ins,
      votants1: r1.votants1, exprimes1: r1.exprimes1, participation1: r1.participation1, votants2: 0, counts: { elu1: 0, duel: 0, tri: 0, desist: 0 } };
    P.forEach(function (p) { res.seats[p] = 0; });
    D.REGIONS.forEach(function (r) { res.regions[r.id] = { id: r.id, total: r.seats, seats: P.reduce(function (m, p) { m[p] = 0; return m; }, {}), elu1: 0, duel: 0, tri: 0, desist: 0, votes1: r1.regVotes[r.id] || {} }; });
    r1.circs.forEach(function (c0) {
      var c = Object.assign({}, c0, { withdrawn: [] }), reg = res.regions[c.r];
      if (c.status === 'elu1') { reg.elu1++; res.counts.elu1++; }
      else {
        var q = c0.q.slice();
        // les désistements, du dernier qualifié au troisième
        for (var j = q.length - 1; j >= 2 && q.length > 2; j--) {
          var me = q[j], lead = q[0], out = false;
          if (dec && me.u === F) out = !!(dec.withdraw && dec.withdraw[c.i]);
          else if (dec && dec.pact && me.u === dec.pact && q.some(function (x) { return x.u === F; })) out = true;   // le pacte : il se retire pour toi
          else {
            var near = q.some(function (o) { return o !== me && o !== lead && pdist(unions, me.pid, o.pid) <= L.withdrawNear; }) || pdist(unions, me.pid, q[1].pid) <= L.withdrawNear;
            out = pdist(unions, me.pid, lead.pid) >= L.withdrawFar && near && (project ? L.withdrawChance >= 0.5 : rng() < L.withdrawChance);
          }
          if (out) { c.withdrawn.push(me.pid); q.splice(j, 1); reg.desist++; res.counts.desist++; }
        }
        // le pacte joue dans les deux sens : si ton camp est derrière ton partenaire de pacte, c'est toi qui te retires
        if (dec && dec.pact && q.length >= 3) {
          var ip = -1, iy = -1; q.forEach(function (x, k) { if (x.u === F) ip = k; if (x.u === dec.pact) iy = k; });
          if (ip >= 0 && iy >= 0) { var lo = Math.max(ip, iy); c.withdrawn.push(q[lo].pid); q.splice(lo, 1); reg.desist++; res.counts.desist++; }
        }
        c.status = q.length >= 3 ? 'tri' : 'duel';
        if (q.length >= 3) { reg.tri++; res.counts.tri++; } else { reg.duel++; res.counts.duel++; }
        var v2 = {};
        q.forEach(function (x) { v2[x.pid] = x.v * (project ? 1 : 1 + 0.03 * gauss(rng)); });
        c0.c1.forEach(function (y) {
          if (q.indexOf(y) >= 0) return;
          var rates = q.map(function (x) {
            var d = pdist(unions, y.pid, x.pid), t = L.transfer2[d] || 0;
            if (x.u === 'pres' && d <= 3 && !ctx.opts.dissolution) t += L.confirm;
            if (dec && y.u === F && dec.barrage) t = x.u === dec.barrage ? t * L.barrageCut : t + L.barrageGive;   // ta consigne de vote
            if (dec && dec.pact && y.u === dec.pact && x.u === F) t += L.pactGive;                                  // la consigne de ton partenaire
            return t;
          }), rs = rates.reduce(function (a, z) { return a + z; }, 0);
          if (rs > 0.92) rates = rates.map(function (z) { return z * 0.92 / rs; });
          q.forEach(function (x, k) { v2[x.pid] += y.v * rates[k]; });
        });
        q.forEach(function (x) { v2[x.pid] += c.div * 0.4 / q.length; });
        var best = null; q.forEach(function (x) { if (!best || v2[x.pid] > v2[best]) best = x.pid; });
        c.winner = best; c.v2 = v2; c.q = q;
        res.votants2 += c.turnout1 * L.turnout2 * c.ins;
      }
      // la marge du camp présidentiel : + gagné, − perdu (sert à classer les circonscriptions sûres, disputées, perdues)
      if (c.status === 'elu1') c.m = c.c1[0].u === F ? 1 : -1;
      else {
        var mine = 0, other = 0; c.q.forEach(function (x) { if (x.u === F) mine = Math.max(mine, c.v2[x.pid]); else other = Math.max(other, c.v2[x.pid]); });
        c.m = mine ? (mine - other) / (mine + other) : -1;
      }
      res.seats[c.winner]++; reg.seats[c.winner]++;
      res.circs.push(c);
    });
    res.outcome = outcome(res, pres);
    res.focus = F; res.focusSeats = 0; (ctx.focusU ? ctx.focusU.parties : []).forEach(function (p) { res.focusSeats += res.seats[p] || 0; });
    return res;
  }
  function run(g, opts) { var ctx = prepare(g, opts); return round2(ctx, round1(ctx), opts && opts.dec); }

  /* Sûres, disputées, perdues : d'après une projection, région par région */
  function classify(res) {
    var out = { safe: 0, open: 0, lost: 0, regions: {} };
    D.REGIONS.forEach(function (r) { out.regions[r.id] = { safe: 0, open: 0, lost: 0, seats: r.seats }; });
    res.circs.forEach(function (c) {
      var k = c.m > L.safeMargin ? 'safe' : c.m < -L.safeMargin ? 'lost' : 'open';
      out[k]++; out.regions[c.r][k]++;
    });
    return out;
  }
  /* Une alliance avant le 1er tour : la chance qu'un parti accepte une candidature commune avec le président */
  function allyChance(g, pres, pid, tries) {
    var gap = Math.abs(E.PARTY[pres].pos - E.PARTY[pid].pos), ch = L.allyAccept.filter(function (x) { return gap <= x.gap; })[0].p;
    var cd = L.cordon, inA = cd.parties.indexOf(pres) >= 0, inB = cd.parties.indexOf(pid) >= 0;
    if (inA !== inB && E.PARTY[inA ? pid : pres].pos < cd.below) ch *= cd.factor;
    if ((E.player(g, pres).deals || []).some(function (d) { return d.with === pid; })) ch += L.allyDealBonus;   // il t'a déjà soutenu au 2nd tour
    if (pid === 'MD' || pres === 'MD') ch += 0.15;     // le Juste Milieu, faiseur de rois
    if (pid === 'RQ' || pres === 'RQ') ch -= 0.15;     // la Grande Nostalgie, repoussoir
    return clamp(ch * Math.pow(0.6, tries || 0), 0, 0.95);
  }
  /* Un pacte de désistement entre les deux tours avec un autre bloc */
  function pactChance(ctx, blocId) {
    var u = ctx.unions.filter(function (x) { return x.id === blocId; })[0]; if (!u) return 0;
    var ch = 0, lead = ctx.opts.player || ctx.opts.pres; u.parties.forEach(function (p) { ch = Math.max(ch, allyChance(ctx.g, lead, p, 0)); });
    if (ctx.opts.player && u.pres) ch *= 0.3;   // le camp du président ne pactise guère avec l'opposition   // même logique que les alliances
    return clamp(ch + L.pactBonus, 0, 0.95);
  }

  /* ---------- v2.4 : ta campagne des législatives ----------
     lc : l'état de la campagne. La carte des circonscriptions (geoSeed) est tirée une fois pour toutes. */
  var CP = L.campaign;
  function newCampaign(g, o) {
    return { pres: o.pres, player: o.player || null, margin: o.margin || 0, loser: o.loser || null, partners: o.partners || [], geoSeed: Math.floor(g.rng() * 1e9),
      allies: [], tries: {}, refused: {}, offersLeft: L.allyOffers, turn: 1, left: CP.actions, camp: { nat: 0, reg: {} }, others: {},
      used: {}, vedettes: 0, meetings: 0, log: [], dissolution: !!o.dissolution, presMult: o.presMult != null ? o.presMult : null };
  }
  function optsOf(lc, extra) {
    var o = { pres: lc.pres, margin: lc.margin, loser: lc.loser, geoSeed: lc.geoSeed, camp: lc.camp, others: lc.others, dissolution: lc.dissolution, presMult: lc.presMult };
    if (lc.player) { o.player = lc.player; o.playerAllies = lc.allies; o.partners = lc.partners; }   // v2.7 : dans l'opposition, la majorité présidentielle se forme toute seule
    else o.allies = lc.allies;
    return Object.assign(o, extra || {});
  }
  /* La projection : le scrutin d'aujourd'hui, sans le hasard du jour du vote */
  function projection(g, lc) { var res = run(g, optsOf(lc, { project: true })); return { res: res, cls: classify(res) }; }
  /* Proposer une alliance (candidature commune dès le 1er tour) */
  function offerAlly(g, lc, pid) {
    if (lc.offersLeft <= 0) return { ok: false, text: 'Plus de proposition possible.' };
    var lead = lc.player || lc.pres;
    if (pid === lead || lc.allies.indexOf(pid) >= 0) return { ok: false, text: 'Déjà dans ton camp.' };
    if (lc.player && pid === lc.pres) return { ok: false, text: 'C\'est le parti du président.' };
    var ch = offerChance(g, lc, pid);
    lc.offersLeft--; lc.tries[pid] = (lc.tries[pid] || 0) + 1;
    var yes = g.rng() < ch;
    if (yes) { lc.allies.push(pid); delete lc.refused[pid]; } else lc.refused[pid] = true;
    lc.log.push({ type: 'ally', pid: pid, ok: yes });
    return { ok: true, accepted: yes, chance: ch };
  }
  /* La chance qu'un parti accepte de rejoindre ton camp (dans l'opposition, la famille du président lui reste plutôt fidèle) */
  function offerChance(g, lc, pid) {
    var ch = allyChance(g, lc.player || lc.pres, pid, lc.tries[pid]);
    if (lc.player && inPresFamily(lc, pid)) ch *= L.oppoFamilyCut;
    return ch;
  }
  function inPresFamily(lc, pid) { return L.unions.some(function (u) { return u.parties.indexOf(lc.pres) >= 0 && u.parties.indexOf(pid) >= 0; }); }
  function regGain(lc, rid, base) { return base * Math.pow(CP.repeat, lc.used[rid] || 0); }
  /* Ce que rapporterait une action (pour l'afficher sur le bouton) */
  function actionGain(g, lc, type, rid) {
    if (type === 'clip') return CP.clip;
    if (type === 'meeting') return regGain(lc, rid, lc.player ? CP.meetingOppo : CP.meeting);
    if (type === 'vedette') return regGain(lc, rid, CP.vedette);
    if (type === 'mobilise') return regGain(lc, rid, CP.mobilise + (E.regionVoters(g, rid).abst >= 0.27 ? CP.mobiliseLow : 0));
    return 0;
  }
  function actError(g, lc, act) {
    if (lc.left <= 0) return 'Plus d’action ce tour-ci.';
    if (act.type !== 'clip' && !E.REG[act.rid]) return 'Choisis une région.';
    if (act.type === 'meeting' && lc.meetings >= CP.meetingMax) return 'Le président ne tient qu’un meeting par tour.';
    if (act.type === 'vedette' && lc.vedettes >= CP.vedetteMax) return 'Tes ' + CP.vedetteMax + ' vedettes sont déjà investies.';
    return null;
  }
  function act(g, lc, a) {
    var err = actError(g, lc, a); if (err) return { ok: false, text: err };
    var gain = actionGain(g, lc, a.type, a.rid);
    if (a.type === 'clip') lc.camp.nat = (1 + lc.camp.nat) * (1 + gain) - 1;
    else { lc.camp.reg[a.rid] = (1 + (lc.camp.reg[a.rid] || 0)) * (1 + gain) - 1; lc.used[a.rid] = (lc.used[a.rid] || 0) + 1; }
    if (a.type === 'meeting') lc.meetings++;
    if (a.type === 'vedette') lc.vedettes++;
    lc.left--;
    lc.log.push({ type: a.type, rid: a.rid || null, gain: gain, turn: lc.turn });
    return { ok: true, gain: gain, pop: a.type === 'meeting' && !lc.player ? -CP.meetingPop : 0 };
  }
  /* Fin d'un tour de campagne : les autres blocs font campagne là où ils sont forts */
  function endTurn(g, lc) {
    var pr = projection(g, lc).res, ctxU = pr.unions, moves = [];
    ctxU.forEach(function (u) {
      if (u.id === (lc.player ? 'joueur' : 'pres')) return;
      var regs = D.REGIONS.map(function (r) { var n = 0; u.parties.forEach(function (p) { n += pr.regions[r.id].seats[p] || 0; }); return { r: r.id, n: n + g.rng() * 3 }; })
        .sort(function (a, b) { return b.n - a.n; }).slice(0, CP.aiRegions);
      regs.forEach(function (x) {
        if (x.n < 1) return;
        var o = lc.others[x.r] || (lc.others[x.r] = {});
        u.parties.forEach(function (p) { o[p] = (1 + (o[p] || 0)) * (1 + CP.aiBoost) - 1; });
        moves.push({ u: u.id, r: x.r });
      });
    });
    lc.turn++; lc.left = CP.actions; lc.meetings = 0;
    return moves;
  }

  /* Les blocs à l'Assemblée : chaque union (ou parti seul) forme un bloc */
  function blocs(res) {
    return res.unions.map(function (u) {
      var s = 0; u.parties.forEach(function (p) { s += res.seats[p] || 0; });
      return { id: u.id, name: u.name, parties: u.parties, seats: s, pres: !!u.pres };
    }).sort(function (a, b) { return b.seats - a.seats; });
  }
  /* Trois issues (plus une) : majorité absolue, relative (le camp du président est le premier bloc),
     sans majorité (un autre bloc est devant), cohabitation (un autre bloc a la majorité absolue) */
  function outcome(res, pres) {
    var bl = blocs(res), camp = bl.filter(function (b) { return b.pres; })[0], other = bl.filter(function (b) { return !b.pres; })[0];
    var cs = camp ? camp.seats : 0;
    var type = cs >= L.majority ? 'absolue' : other && other.seats >= L.majority ? 'cohabitation' : !other || cs >= other.seats ? 'relative' : 'sans';
    return { type: type, camp: camp ? camp.parties : [], campSeats: cs, rival: other || null, blocs: bl };
  }

  var API = { offerChance: offerChance, newCampaign: newCampaign, optsOf: optsOf, projection: projection, offerAlly: offerAlly, actionGain: actionGain, actError: actError, act: act, endTurn: endTurn,
    run: run, prepare: prepare, round1: round1, round2: round2, campChoices: campChoices, classify: classify, allyChance: allyChance, pactChance: pactChance,
    regionalBase: regionalBase, buildUnions: buildUnions, blocs: blocs, outcome: outcome, lowTurnoutIndex: lowTurnoutIndex, regionTurnout: regionTurnout, unionOf: unionOf, gauss: gauss };
  if (node) module.exports = API; else root.PolitikLegis = API;
})(this);

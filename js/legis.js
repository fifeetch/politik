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
     et la majorité présidentielle (le président, son union et les partis qui l'ont soutenu par un accord). */
  function buildUnions(g, opts) {
    var present = ids(g), taken = {}, unions = [];
    var presU = null;
    if (opts.pres) {
      var base = (opts.unions || L.unions).filter(function (u) { return u.parties.indexOf(opts.pres) >= 0; })[0];
      var members = base ? base.parties.filter(function (p) { return present.indexOf(p) >= 0; }) : [opts.pres];
      (opts.partners || []).forEach(function (p) { if (present.indexOf(p) >= 0 && members.indexOf(p) < 0 && E.dist(p, opts.pres) <= 2) members.push(p); });
      // ralliements : un parti seul (hors des unions par défaut), tout proche du président, rejoint sa majorité
      var inUnion = {}; (opts.unions || L.unions).forEach(function (u) { u.parties.forEach(function (p) { if (present.indexOf(p) >= 0) inUnion[p] = true; }); });
      if (!opts.noRally) present.forEach(function (p) { if (!inUnion[p] && members.indexOf(p) < 0 && Math.abs(E.PARTY[p].pos - E.PARTY[opts.pres].pos) <= L.rallyDist) members.push(p); });
      presU = { id: 'pres', name: 'Majorité présidentielle', parties: members, pres: true };
      members.forEach(function (p) { taken[p] = true; });
      unions.push(presU);
    }
    (opts.unions || L.unions).forEach(function (u) {
      var m = u.parties.filter(function (p) { return present.indexOf(p) >= 0 && !taken[p]; });
      if (m.length >= 2) { unions.push({ id: u.id, name: u.name, parties: m }); m.forEach(function (p) { taken[p] = true; }); }
    });
    present.forEach(function (p) { if (!taken[p]) unions.push({ id: p, name: E.PARTY[p].short, parties: [p], single: true }); });
    return unions;
  }
  function unionOf(unions, pid) { for (var i = 0; i < unions.length; i++) if (unions[i].parties.indexOf(pid) >= 0) return unions[i]; return null; }
  function pdist(unions, a, b) { if (a === b) return 0; var u = unionOf(unions, a); if (u && u.parties.indexOf(b) >= 0) return 0; return E.dist(a, b); }

  /* ---------- L'élection complète ----------
     opts : pres (parti du président), margin (son avance au 2nd tour, ex. 0,08 pour 58 %), loser (finaliste battu),
            partners (partis qui l'ont soutenu), presMult (dissolution : élan ou désaveu selon sa popularité),
            dissolution (participation plus forte), unions (candidatures communes, sinon celles par défaut) */
  function run(g, opts) {
    opts = opts || {};
    var rng = opts.rng || g.rng, P = ids(g), base = regionalBase(g), unions = buildUnions(g, opts);
    var presU = unions.filter(function (u) { return u.pres; })[0];
    // multiplicateurs nationaux : abstention différentielle, locomotive
    var low = {}, lmin = 9, lmax = -9, mult = {};
    P.forEach(function (p) { low[p] = lowTurnoutIndex(g, p); lmin = Math.min(lmin, low[p]); lmax = Math.max(lmax, low[p]); });
    P.forEach(function (p) { mult[p] = 1 - (1 - L.lowTurnoutPenalty) * (lmax > lmin ? (low[p] - lmin) / (lmax - lmin) : 0); });
    var boost = 0;
    if (opts.pres) {
      boost = opts.presMult != null ? opts.presMult - 1 : L.loco + L.locoMargin * Math.max(0, opts.margin || 0);
      if (presU.parties.length === 1 && opts.presMult == null) boost *= L.locoAlone;
      boost = (1 + boost) * Math.exp(L.swing * gauss(rng)) - 1;   // l'humeur du pays
      mult[opts.pres] *= 1 + boost;
      presU.parties.forEach(function (p) { if (p !== opts.pres) mult[p] *= 1 + boost * L.locoUnion; });
    }
    if (opts.loser && mult[opts.loser] && !opts.presMult) mult[opts.loser] *= 1 - L.loserDip;
    var ratio = opts.dissolution ? L.turnoutDissolution : L.turnoutRatio;

    var res = { circs: [], regions: {}, seats: {}, unions: unions, boost: boost, pres: opts.pres || null,
      votes1: {}, ins: 0, votants1: 0, exprimes1: 0, votants2: 0, counts: { elu1: 0, duel: 0, tri: 0, desist: 0 } };
    P.forEach(function (p) { res.seats[p] = 0; });
    unions.forEach(function (u) { res.votes1[u.id] = 0; });
    res.votes1._div = 0;

    D.REGIONS.forEach(function (r) {
      var n = r.seats, insC = r.ins / n, T = regionTurnout(g, r.id, ratio), b = base[r.id];
      var reg = { id: r.id, total: n, seats: {}, elu1: 0, duel: 0, tri: 0, desist: 0, votes1: {}, exprimes1: 0 };
      P.forEach(function (p) { reg.seats[p] = 0; });
      for (var c = 0; c < n; c++) {
        var tilt = L.tilt * gauss(rng), sh = {}, tot = 0;
        P.forEach(function (p) { sh[p] = b[p] * mult[p] * Math.exp(tilt * axis(p) + L.noise * gauss(rng)); tot += sh[p]; });
        var div = b._div * L.othersStrength * Math.exp(L.noise * gauss(rng)); tot += div;
        // une candidature par union : un parti de l'union porte la candidature (le plus fort localement, le plus souvent)
        var cands = [];
        unions.forEach(function (u) {
          var v = 0, pick = null, wsum = 0, ws = [];
          u.parties.forEach(function (p) { v += sh[p]; var w = Math.pow(sh[p], 2) * (p === opts.pres ? 1.6 : 1); ws.push({ p: p, w: w }); wsum += w; });
          if (!u.single) v *= L.unionKeep;
          var x = rng() * wsum; for (var k = 0; k < ws.length; k++) { x -= ws[k].w; if (x <= 0) { pick = ws[k].p; break; } }
          cands.push({ pid: pick || u.parties[0], u: u.id, v: v });
        });
        var sum = div; cands.forEach(function (x) { sum += x.v; });
        cands.forEach(function (x) { x.v /= sum; }); div /= sum;
        cands.sort(function (a, z) { return z.v - a.v; });
        var Tc = clamp(T * (1 + 0.06 * gauss(rng)), 0.15, 0.9), expIns = Tc * (1 - L.blank1);   // exprimés / inscrits
        var circ = { r: r.id, ins: insC, turnout1: Tc, c1: cands, div: div, status: '', withdrawn: [], winner: null, v2: null };
        cands.forEach(function (x) { res.votes1[x.u] += x.v * expIns * insC; reg.votes1[x.u] = (reg.votes1[x.u] || 0) + x.v * expIns * insC; });
        res.votes1._div += div * expIns * insC; reg.exprimes1 += expIns * insC;
        res.ins += insC; res.votants1 += Tc * insC; res.exprimes1 += expIns * insC;
        var top = cands[0];
        if (top.v > L.electedVotes && top.v * expIns >= L.electedIns) {
          circ.status = 'elu1'; circ.winner = top.pid; reg.elu1++; res.counts.elu1++;
          res.votants2 += 0;
        } else {
          var q = cands.filter(function (x) { return x.v * expIns >= L.qualifyIns; });
          if (q.length < 2) q = cands.slice(0, 2);
          // désistements : en triangulaire, le 3e (puis le 4e) se retire si le premier est loin de lui et un autre qualifié proche
          for (var j = q.length - 1; j >= 2 && q.length > 2; j--) {
            var me = q[j], lead = q[0];
            var near = q.some(function (o) { return o !== me && o !== lead && pdist(unions, me.pid, o.pid) <= L.withdrawNear; }) || pdist(unions, me.pid, q[1].pid) <= L.withdrawNear;
            if (pdist(unions, me.pid, lead.pid) >= L.withdrawFar && near && rng() < L.withdrawChance) { circ.withdrawn.push(me.pid); q.splice(j, 1); reg.desist++; res.counts.desist++; }
          }
          circ.status = q.length >= 3 ? 'tri' : 'duel';
          if (q.length >= 3) { reg.tri++; res.counts.tri++; } else { reg.duel++; res.counts.duel++; }
          // 2nd tour : chacun garde ses électeurs, les autres se reportent selon la proximité politique
          var v2 = {};
          q.forEach(function (x) { v2[x.pid] = x.v * (1 + 0.03 * gauss(rng)); });
          cands.forEach(function (y) {
            if (q.indexOf(y) >= 0) return;
            var rates = q.map(function (x) { var d = pdist(unions, y.pid, x.pid), t = L.transfer2[d] || 0; if (x.u === 'pres' && d <= 3 && !opts.dissolution) t += L.confirm; return t; }), rs = rates.reduce(function (a, z) { return a + z; }, 0);
            if (rs > 0.92) rates = rates.map(function (z) { return z * 0.92 / rs; });
            q.forEach(function (x, i) { v2[x.pid] += y.v * rates[i]; });
          });
          q.forEach(function (x) { v2[x.pid] += div * 0.4 / q.length; });
          var best = null; q.forEach(function (x) { if (!best || v2[x.pid] > v2[best]) best = x.pid; });
          circ.winner = best; circ.v2 = v2;
          res.votants2 += Tc * L.turnout2 * insC;
        }
        res.seats[circ.winner]++; reg.seats[circ.winner]++;
        res.circs.push(circ);
      }
      res.regions[r.id] = reg;
    });
    res.participation1 = res.votants1 / res.ins;
    res.outcome = outcome(res, opts.pres);
    return res;
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

  var API = { run: run, regionalBase: regionalBase, buildUnions: buildUnions, blocs: blocs, outcome: outcome, lowTurnoutIndex: lowTurnoutIndex, regionTurnout: regionTurnout, unionOf: unionOf };
  if (node) module.exports = API; else root.PolitikLegis = API;
})(this);

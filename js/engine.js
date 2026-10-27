/* Politik — moteur de jeu (règles v1.0 : poids réels, vote blanc, abstention, mobilisation, programme, affaires, enquêtes, thèmes, candidat, militants, dilemmes, casseroles, crises, alliances, élection à deux tours).
   Aucune dépendance à l'affichage : tout l'état de la partie est dans un objet « g ». */
(function (root) {
  var D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.PolitikData;
  var R = D.RULES;

  /* ---------- Outils ---------- */
  function makeRng(seed) {
    var a = (seed >>> 0) || 1;
    var f = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.getState = function () { return a; };            // v2.8 : pour sauvegarder la partie
    f.setState = function (x) { a = x | 0; };
    return f;
  }
  /* v2.8 : le format de la campagne (classique ou éclair) : on remet les règles d'origine, puis on applique celles du format */
  var BASE_RULES = JSON.parse(JSON.stringify(D.RULES));
  /* v4.1 : le mode Bêta = le Réaliste + les règles à l'essai (après le format, pour la durée de la partie) */
  function applyMode(g) { if (g && g.mode === 'beta') Object.keys(D.BETA.rules).forEach(function (k) { D.RULES[k] = D.BETA.rules[k]; }); return g; }
  function setFormat(name) {
    var F = D.FORMATS[name] || D.FORMATS.classique;
    Object.keys(BASE_RULES).forEach(function (k) { D.RULES[k] = JSON.parse(JSON.stringify(BASE_RULES[k])); });
    Object.keys(F.rules || {}).forEach(function (k) { D.RULES[k] = JSON.parse(JSON.stringify(F.rules[k])); });
    return D.FORMATS[name] ? name : 'classique';
  }
  /* v2.8 : la sauvegarde : tout l'état de la partie, plus l'état du hasard */
  function saveGame(g) { var s = JSON.stringify(g, function (k, v) { return typeof v === 'function' || k === '_cp' || k === '_cpTurn' ? undefined : v; }); var o = JSON.parse(s); o.rngState = g.rng.getState(); return JSON.stringify(o); }
  function loadGame(str) {
    var g = JSON.parse(str); setFormat(g.format); applyMode(g);
    g.rng = makeRng(1); g.rng.setState(g.rngState); delete g.rngState;
    ensureTraits(g);   // v3.1 : une partie sauvegardée avant les traits les reçoit à la reprise
    return g;
  }
  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var REG = {}; D.REGIONS.forEach(function (r) { REG[r.id] = r; });
  var PARTY = {}; D.PARTIES.forEach(function (p) { PARTY[p.id] = p; });

  /* v3.0 : le sigle affiché (celui du modèle réel) ; le code interne sert seulement au programme */
  function sigle(pid) { return PARTY[pid] ? PARTY[pid].sigle || pid : pid; }
  function player(g, pid) { for (var i = 0; i < g.players.length; i++) if (g.players[i].id === pid) return g.players[i]; return null; }
  function pids(g) { return g.players.map(function (p) { return p.id; }); }
  function cubes(g, rid, pid) { return g.regions[rid].cubes[pid] || 0; }
  /* v3.2 : mode Réaliste, le poids électoral. Un soutien pèse selon le score historique du parti dans la région :
     au départ, le sondage colle aux vrais scores, et un petit parti a du mal à dépasser son électorat historique. */
  function weight(g, rid, pid) { return g.weight && g.weight[rid] && g.weight[rid][pid] != null ? g.weight[rid][pid] : 1; }
  function strength(g, rid, pid) { return cubes(g, rid, pid) * weight(g, rid, pid); }
  function computeWeights(g) {
    g.weight = {}; g.hist = {};
    D.REGIONS.forEach(function (r) {
      var H = 0, C = 0, w = {};
      pids(g).forEach(function (id) { H += baseScore(g.base, r, id); C += cubes(g, r.id, id); });
      pids(g).forEach(function (id) {
        var c = cubes(g, r.id, id), h = baseScore(g.base, r, id);
        w[id] = c && H && C ? Math.max(R.weightMin, Math.min(R.weightMax, (h / H) / (c / C))) : 1;
      });
      g.weight[r.id] = w;
      var hs = {}; pids(g).forEach(function (id) { hs[id] = H ? baseScore(g.base, r, id) / H : 0; });
      g.hist[r.id] = hs;   // le socle électoral : la part historique de chaque parti dans la région
    });
  }
  /* Part des voix servant au contrôle d'une région en Réaliste : socle + campagne, sans la prime au sortant (sinon le contrôle se nourrirait lui-même) */
  function controlShares(g, rid) {
    var T = 0, out = {}, so = R.socle;
    pids(g).forEach(function (id) { T += strength(g, rid, id); });
    pids(g).forEach(function (id) { out[id] = (T ? (1 - so) * strength(g, rid, id) / T : 0) + so * ((g.hist[rid] && g.hist[rid][id]) || 0); });
    return mediaAdjust(g, rid, out);
  }
  /* v3.5.5 : le vote d'une région le soir de l'élection (pour la carte de 20 h).
     1er tour : les parts de voix ; 2nd tour : celles des finalistes + les reports des éliminés, aux taux nationaux. */
  function regionVote(g, rid, among) {
    var sh = g.hist ? regionShares(g, rid) : (function () { var o = {}, T = 0; pids(g).forEach(function (id) { T += cubes(g, rid, id); }); pids(g).forEach(function (id) { o[id] = T ? cubes(g, rid, id) / T : 0; }); return o; })();
    var out = {}, sec = g.result && g.result.second;
    among.forEach(function (pid) { out[pid] = sh[pid] || 0; });
    if (sec && sec.transfers) sec.transfers.forEach(function (t) {
      if (out[sec.a] != null) out[sec.a] += (sh[t.pid] || 0) * t.toA;
      if (out[sec.b] != null) out[sec.b] += (sh[t.pid] || 0) * t.toB;
    });
    return out;
  }
  /* Part des voix de chaque parti dans une région (sans les « autres »), socle compris */
  function rawRegionShares(g, rid) {
    var reg = g.regions[rid], T = 0, w = {}, out = {}, so = g.hist ? R.socle : 0;
    g.players.forEach(function (p) { w[p.id] = strength(g, rid, p.id) * (reg.controller === p.id ? R.incumbentBonus : 1); T += w[p.id]; });
    g.players.forEach(function (p) { out[p.id] = (T ? (1 - so) * w[p.id] / T : 0) + so * ((g.hist && g.hist[rid][p.id]) || 0); });
    return out;
  }
  /* v3.8 : avec l'audience médiatique (classes sociales) */
  function regionShares(g, rid) { return mediaAdjust(g, rid, rawRegionShares(g, rid)); }
  /* Le bloc politique d'une région (gauche, centre, droite) d'après ses vrais votes */
  var BLOC = { FI: 'g', LO: 'g', PC: 'g', VP: 'g', SM: 'g', MD: 'c', EM: 'c', HZ: 'c', UG: 'd', DL: 'd', MN: 'd', RQ: 'd' };
  /* ---------- v3.8 : les classes sociales et l'audience médiatique ----------
     Dans chaque région, les voix d'un parti se répartissent entre les 6 groupes sociaux (profil Ipsos 2024,
     ajusté à la composition de la région par la méthode du « calage » : chaque groupe totalise 100 % des voix,
     chaque parti garde son score). L'audience médiatique d'un parti auprès d'un groupe multiplie ses voix
     DANS CE GROUPE, dans toutes les régions à la fois. Sans audience, le vote est exactement le même qu'avant. */
  var SEG = D.SEGMENTS.map(function (s) { return s.id; });
  var SEGW = {};   // poids de chaque groupe parmi les votants d'une région (part de la population × propension à voter)
  D.REGIONS.forEach(function (r) {
    var w = {}, t = 0; SEG.forEach(function (s) { w[s] = r.pop[s] * D.VOTE_PROP[s]; t += w[s]; });
    SEG.forEach(function (s) { w[s] /= t; }); SEGW[r.id] = w;
  });
  function classProf(pid, s) { var p = D.CLASS_PROF[pid]; return p ? p[s] : 1; }
  function audOf(g, pid, s) { return (g.aud && g.aud[pid] && g.aud[pid][s]) || 0; }
  /* x[pid][seg] : la part de chaque parti dans chaque groupe (chaque groupe fait 100 %) */
  function rake(sh, ids, w) {
    var x = {};
    ids.forEach(function (p) { x[p] = {}; SEG.forEach(function (s) { x[p][s] = Math.max(1e-6, sh[p]) * classProf(p, s); }); });
    for (var it = 0; it < 4; it++) {
      SEG.forEach(function (s) { var c = 0; ids.forEach(function (p) { c += x[p][s]; }); ids.forEach(function (p) { x[p][s] /= c; }); });
      ids.forEach(function (p) { var r = 0; SEG.forEach(function (s) { r += w[s] * x[p][s]; }); var f = Math.max(1e-6, sh[p]) / r; SEG.forEach(function (s) { x[p][s] *= f; }); });
    }
    SEG.forEach(function (s) { var c = 0; ids.forEach(function (p) { c += x[p][s]; }); ids.forEach(function (p) { x[p][s] /= c; }); });
    return x;
  }
  /* La même chose, avec l'audience de chacun appliquée groupe par groupe */
  function withMedia(g, x, ids, sh) {
    var y = {}, n = ids.length;
    // additif : 1 point d'audience = environ +k point de vote dans ce groupe, quelle que soit la taille du parti
    // (multiplier aurait avantagé les gros partis). Une audience négative ne fait pas tomber sous 20 % de sa base.
    // v4.0 : l'audience est relative. Ce qui compte, c'est d'être plus (ou moins) vu que les autres auprès d'un groupe :
    // si tout le monde passe autant à la télé, rien ne bouge. L'effet est plus fort, en proportion, pour un petit parti
    // (élasticité e), mais en voix gagnées un gros parti profite un peu plus d'une même audience (temps de parole équitable).
    SEG.forEach(function (s) {
      var e = {}, se = 0, sa = 0;
      ids.forEach(function (p) { e[p] = Math.max(0.3, Math.min(6, Math.pow(1 / (n * Math.max(1e-4, x[p][s])), 0.75))); se += x[p][s] * e[p]; sa += x[p][s] * e[p] * audOf(g, p, s); });
      var abar = se ? sa / se : 0;
      ids.forEach(function (p) { y[p] = y[p] || {}; y[p][s] = Math.max(x[p][s] * 0.2, x[p][s] * (1 + D.MEDIA.k * n * (audOf(g, p, s) - abar) * e[p])); });
    });
    SEG.forEach(function (s) { var c = 0; ids.forEach(function (p) { c += y[p][s]; }); ids.forEach(function (p) { y[p][s] /= c; }); });
    return y;
  }
  function mediaAdjust(g, rid, sh) {
    if (!g.audOn) return sh;
    var ids = Object.keys(sh), w = SEGW[rid], tot = 0, out = {};
    var x = rake(sh, ids, w), y = withMedia(g, x, ids, sh), T = 0;
    ids.forEach(function (p) { tot += sh[p]; });
    ids.forEach(function (p) {
      var a = 0, b = 0; SEG.forEach(function (s) { a += w[s] * y[p][s]; b += w[s] * x[p][s]; });
      out[p] = sh[p] * (b > 0 ? a / b : 1); T += out[p];
    });
    if (T > 0) ids.forEach(function (p) { out[p] *= tot / T; });
    return out;
  }
  /* Sondage par classe sociale : { seg: { pid: part des voix exprimées } } (les « autres » à part) */
  function classPoll(g) {
    var acc = {}; SEG.forEach(function (s) { acc[s] = { _t: 0 }; });
    var ids = pids(g);
    D.REGIONS.forEach(function (r) {
      var ex = regionVoters(g, r.id).exprimes, o = othersShare(g, r.id);
      var sh = rawRegionShares(g, r.id), x = rake(sh, ids, SEGW[r.id]), y = g.audOn ? withMedia(g, x, ids, sh) : x;
      SEG.forEach(function (s) {
        var n = ex * SEGW[r.id][s];
        acc[s]._t += n;
        ids.forEach(function (p) { acc[s][p] = (acc[s][p] || 0) + n * (1 - o) * y[p][s]; });
      });
    });
    var out = {};
    SEG.forEach(function (s) { out[s] = {}; ids.forEach(function (p) { out[s][p] = acc[s]._t ? acc[s][p] / acc[s]._t : 0; }); });
    return out;
  }
  function addAudience(g, pid, gains) {
    g.aud = g.aud || {}; g.aud[pid] = g.aud[pid] || {};
    SEG.forEach(function (s) {
      if (!gains[s]) return;
      g.aud[pid][s] = Math.max(D.MEDIA.min, Math.min(D.MEDIA.max, (g.aud[pid][s] || 0) + gains[s]));
    });
    g.audOn = true;
  }
  function wearAudience(g) {
    if (!g.aud) return;
    var any = false;
    Object.keys(g.aud).forEach(function (p) { SEG.forEach(function (s) {
      var v = (g.aud[p][s] || 0) * D.MEDIA.keep;
      if (Math.abs(v) < 0.05) v = 0; else any = true;
      g.aud[p][s] = v;
    }); });
    g.audOn = any;
  }
  /* Ce qu'un gain d'audience rapporterait au sondage (en points), sans rien changer à la partie */
  function previewGain(g, pid, gains) {
    var before = pollMap(g)[pid] || 0, keep = g.aud ? JSON.parse(JSON.stringify(g.aud)) : null, on = g.audOn;
    addAudience(g, pid, gains);
    var after = pollMap(g)[pid] || 0;
    g.aud = keep; g.audOn = on;
    return after - before;
  }

  /* Estimation rapide (pour l'ordinateur) : dérivée du vote de chaque groupe × poids du groupe dans le pays */
  var NATSEGW = (function () {
    var w = {}, t = 0; SEG.forEach(function (s) { w[s] = 0; });
    D.REGIONS.forEach(function (r) { SEG.forEach(function (s) { w[s] += r.ins * SEGW[r.id][s]; }); t += r.ins; });
    SEG.forEach(function (s) { w[s] /= t; }); return w;
  })();
  function quickGain(g, pid, gains) {
    if (!g._cp || g._cpTurn !== g.turn) { g._cp = classPoll(g); g._cpTurn = g.turn; }
    var d = 0;
    var n = g.players.length;
    SEG.forEach(function (s) { var x = Math.max(1e-4, g._cp[s][pid] || 0), e = Math.max(0.3, Math.min(6, Math.pow(1 / (n * x), 0.75))); d += NATSEGW[s] * D.MEDIA.k * n * x * e * (1 - x) * (gains[s] || 0); });
    return d;
  }
  /* ---------- v3.8 : les interviews (Télé, Matinale, 20h, Débat) ---------- */
  var QBY = {}; D.QUESTIONS.forEach(function (q) { QBY[q.id] = q; });
  function isMajority(pid) { return D.MAJORITY.indexOf(pid) >= 0; }
  function blocOf(pid) { return BLOC[pid] || (PARTY[pid] && PARTY[pid].pos >= 5 ? 'd' : PARTY[pid] && PARTY[pid].pos <= 3 ? 'g' : 'c'); }
  function pickQuestion(g, theme, salt) {
    var list = D.QUESTIONS.filter(function (q) { return q.theme === theme; });
    var h = (g.seed || 0) + g.turn * 7 + (salt || 0) * 13;
    return list[Math.abs(h) % list.length];
  }
  /* La mesure du programme qui répond le mieux à la question */
  function measureFor(g, pid, q) {
    var pl = player(g, pid), best = null, bv = -1e9;
    ((pl && pl.programme) || []).forEach(function (id) {
      var m = MEAS[id]; if (!m || m.theme !== q.theme || (q.meas && q.meas.indexOf(id) < 0)) return;   // v4.0.1 : seulement une mesure qui répond à la question
      var v = 0; SEG.forEach(function (s) { v += ((m.fans || {})[s] || 0) * (q.segs[s] || 0); });
      if (v > bv) { bv = v; best = m; }
    });
    return best;
  }
  /* Les cartes de réponse d'un parti à une question. fmt : 'tele' | 'matinale' | 'vingt' | 'debat'.
     segBoost : un public particulier (la matinale d'une radio, par exemple) */
  function interview(g, pid, qid, fmt, segBoost) {
    var q = QBY[qid], th = q.theme, pl = player(g, pid), c = cred(g, pid, th), hot = isHot(g, th);
    var maj = isMajority(pid), tw = (D.TEMPERS[pid] || { w: {} }).w, sc = D.MEDIA.scale[fmt || 'tele'];
    var segs = {}; SEG.forEach(function (s) { segs[s] = (q.segs[s] || 0.5) * ((segBoost && segBoost[s]) || 1); });
    function card(key, quote, h, t, notes, extra, flat) {
      var gains = {};
      SEG.forEach(function (s) {
        var w = flat ? 0.7 * ((segBoost && segBoost[s]) || 1) : segs[s];
        gains[s] = Math.round(w * (D.HEART[s] * Math.max(0, h) + (1 - D.HEART[s]) * Math.max(0, t)) * sc * 10) / 10;
      });
      if (extra) SEG.forEach(function (s) { if (extra[s]) gains[s] = Math.round((gains[s] + extra[s] * sc) * 10) / 10; });
      return { key: key, name: D.ANSWERS[key].name, icon: D.ANSWERS[key].icon, quote: quote, heart: Math.max(0, h), head: Math.max(0, t), notes: notes, gains: gains };
    }
    var cards = [];
    // ❤️ Émotion
    var h = 2, n = [];
    if (hot) { h++; n.push('+1 ❤️ le sujet fait l’actu'); }
    if (maj) { h--; n.push('−1 ❤️ venant du pouvoir, ça sonne faux'); }
    if ((tw.emotion || 0) >= 4) { h++; n.push('+1 ❤️ c’est ton registre'); }
    else if ((tw.emotion || 0) <= 1) { h--; n.push('−1 ❤️ pas ton registre'); }
    var emo = blocOf(pid) === 'd' && q.emoD ? q.emoD : q.emo;
    cards.push(card('emotion', emo, h, 0, n));
    // 💡 Ma mesure, ou 🎲 promesse improvisée
    var m = measureFor(g, pid, q);
    if (m) {
      var t2 = 2, n2 = ['dans ton programme'], funded = pl && pl.budget <= R.budgetCap;
      if (funded) { t2++; n2.push('+1 🧠 programme financé'); } else { t2--; n2.push('−1 🧠 programme pas financé'); }
      if (c === 2) { t2++; n2.push('+1 🧠 ton point fort'); }
      var fans = {}; Object.keys(m.fans || {}).forEach(function (s) { fans[s] = m.fans[s] * 0.4; });
      var mc = card('mesure', 'Ma réponse est dans mon programme : ' + m.name.charAt(0).toLowerCase() + m.name.slice(1) + '.', 1, t2, n2, fans);
      mc.measure = m.id; mc.funded = funded; cards.push(mc);
    } else {
      var pc = card('promesse', 'Dès mon élection, je m’y attaque : vous verrez des résultats en six mois.', 2, 0,
        ['hors de ton programme', Math.round(D.MEDIA.gaffePromise * 100) + ' % de risque de casserole']);
      pc.risk = D.MEDIA.gaffePromise; cards.push(pc);
    }
    // 🥊 Attaquer le bilan (opposition) ou 🛡️ Défendre le bilan (bloc au pouvoir)
    if (!maj) {
      var h3 = 1, t3 = 1, n3 = [];
      if (hot) { h3++; n3.push('+1 ❤️ le sujet fait l’actu'); }
      if ((tw.attaque || 0) >= 4) { h3++; n3.push('+1 ❤️ c’est ton registre'); }
      if (c === 2) { t3++; n3.push('+1 🧠 ton point fort'); }
      cards.push(card('attaque', q.atk, h3, t3, n3));
    } else {
      var t4 = 2, n4 = [];
      if (c === 2) { t4++; n4.push('+1 🧠 ton point fort'); } else if (c === 0) { t4--; n4.push('−1 🧠 pas ton sujet'); }
      if (hot) { t4--; n4.push('−1 🧠 la colère gronde sur ce sujet'); }
      cards.push(card('bilan', q.def, 0, t4, n4));
    }
    // 🙃 Recentrer sur son sujet fort
    var fav = D.THEMES.slice().sort(function (a, b) { return cred(g, pid, b.id) - cred(g, pid, a.id); }).filter(function (t) { return t.id !== th; })[0];
    var ART = { pouvoir: 'le pouvoir d’achat', emploi: 'l’emploi', services: 'les services publics', ecologie: 'l’écologie', securite: 'la sécurité', immigration: 'l’immigration' };
    var rc = card('recentrer', 'La vraie question, c’est ' + (ART[fav.id] || fav.name.toLowerCase()) + '. Parlons de ce qui compte vraiment.', 0, 1, ['petit gain, mais aucun risque'], null, true);
    rc.fav = fav.id; cards.push(rc);
    return { q: q, fmt: fmt, cards: cards };
  }
  /* v3.9 : l'accueil d'une radio selon ton bord politique */
  var STB = {}; D.STATIONS.forEach(function (st) { STB[st.id] = st; });
  function stationFit(pid, sid) {
    var st = STB[sid], pos = PARTY[pid] ? PARTY[pid].pos : 3.5;
    if (!st || !st.lean) return { k: 'near', f: D.STATION_FIT.near, label: 'public de tous bords' };
    if (pos >= st.lean[0] && pos <= st.lean[1]) return { k: 'home', f: D.STATION_FIT.home, label: 'public acquis' };
    var d = pos < st.lean[0] ? st.lean[0] - pos : pos - st.lean[1];
    return d <= 1 ? { k: 'near', f: D.STATION_FIT.near, label: 'public partagé' } : { k: 'far', f: D.STATION_FIT.far, label: 'public hostile' };
  }
  function stationBoost(pid, sid) {
    var st = STB[sid], f = stationFit(pid, sid).f, b = {};
    SEG.forEach(function (s) { b[s] = (st ? st.segs[s] || 0.5 : 1) * f; });
    return b;
  }
  /* Le 20 h : invité si tu es dans les 4 premiers, une seule fois */
  function vingtError(g, pid) {
    var pl = player(g, pid);
    if (pl.vingtUsed) return 'Tu es déjà passé au 20 h : une seule fois par campagne.';
    if (ranking(g).indexOf(pid) >= D.VINGT.top) return 'Le 20 h n\u2019invite que les ' + D.VINGT.top + ' premiers du sondage.';
    return null;
  }
  /* forme : l'énergie qui reste au moment du direct (après avoir payé le 20 h) */
  function stageRisk(g, pid, forme) { if (forme == null) forme = player(g, pid).forme; return Math.max(D.VINGT.stageMin, D.VINGT.stage - D.VINGT.stagePerForme * Math.max(0, forme)); }
  function matinaleError(g, pid) {
    var pl = player(g, pid);
    if (pl.matinaleTurn && g.turn - pl.matinaleTurn < 2) return 'Une matinale tous les deux tours : les radios t\u2019ont reçu au tour ' + pl.matinaleTurn + '.';
    return null;
  }
  function applyInterview(g, pid, cardObj) {
    addAudience(g, pid, cardObj.gains);
    var out = { gains: cardObj.gains, cas: false };
    if (cardObj.risk && g.rng() < cardObj.risk) {
      var pl = player(g, pid); pl.cas = Math.min(R.casseroleMax, pl.cas + 1); out.cas = true;
    }
    return out;
  }
  /* L'ordinateur choisit sa réponse : le meilleur gain au sondage, avec un peu de son tempérament */
  function aiAnswer(g, pid, iv) {
    var best = null, bv = -1e9, tw = (D.TEMPERS[pid] || { w: {} }).w;
    iv.cards.forEach(function (c) {
      var k = c.key === 'mesure' || c.key === 'promesse' ? 'chiffres' : c.key === 'bilan' ? 'chiffres' : c.key === 'recentrer' ? 'esquive' : c.key;
      var v = quickGain(g, pid, c.gains) * 100 + (tw[k] || 1) * 0.05 - (c.risk || 0) * 0.8 + g.rng() * 0.1;
      if (v > bv) { bv = v; best = c; }
    });
    return best;
  }
  function regionLean(base, rid) {
    var r = REG[rid], t = { g: 0, c: 0, d: 0 }, sum = 0;
    D.PARTIES.forEach(function (p) { var b = BLOC[p.id]; if (!b) return; var v = baseScore(base || 'e2024', r, p.id); t[b] += v; sum += v; });
    Object.keys(t).forEach(function (k) { t[k] = sum ? t[k] / sum : 0; });
    var nat = natLean(base || 'e2024');
    var d = (t.g - nat.g) - (t.d - nat.d);
    return { g: t.g, c: t.c, d: t.d, label: d > 0.06 ? 'Terre de gauche' : d < -0.06 ? 'Terre de droite' : 'Région disputée' };
  }
  var LEAN_NAT = {};
  function natLean(base) {
    if (LEAN_NAT[base]) return LEAN_NAT[base];
    var t = { g: 0, c: 0, d: 0 }, sum = 0;
    D.REGIONS.forEach(function (r) {
      var ex = r.ins * (1 - r.abst / 100);
      D.PARTIES.forEach(function (p) { var b = BLOC[p.id]; if (!b) return; var v = ex * baseScore(base, r, p.id); t[b] += v; sum += v; });
    });
    Object.keys(t).forEach(function (k) { t[k] /= sum; });
    return (LEAN_NAT[base] = t);
  }
  function minControl(pid) { return pid === 'MN' || pid === 'HZ' ? 4 : R.minControl; }
  /* Distance sur l'axe gauche-droite, de 1 (voisins) à 5 (opposés). v1.7 : positions décimales (12 partis), arrondies. */
  function dist(a, b) { if (a === b) return 0; return Math.min(5, Math.max(1, Math.round(Math.abs(PARTY[a].pos - PARTY[b].pos)))); }
  /* Ce que rapporte une Collecte : 3 € en général, 4 € et 1 ★ pour En Mouvement, 2 € pour les petits partis */
  function fundsGain(pid) { return pid === 'EM' ? { money: 4, infl: 1 } : pid === 'VP' || pid === 'PC' || pid === 'MD' ? { money: 2, infl: 0 } : { money: 3, infl: 0 }; }
  /* ---------- v3.1 : les traits satiriques (voir D.TRAITS) ---------- */
  var TRAIT_OF = {}; Object.keys(D.TRAITS).forEach(function (k) { D.TRAITS[k].parties.forEach(function (pid) { TRAIT_OF[pid] = k; }); });
  var CENTRE = D.TRAITS.centre.parties;
  function traitOf(pid) { return TRAIT_OF[pid] || null; }
  function initTraits(g) {
    g.nost = {}; g.petals = {}; g.roseBloom = false; g.micro = null; g.microIdx = 0; g.microDone = 0;
    g.eclatUntil = 0; g.hidden = false; g.bingo = { ticks: [false, false, false, false, false, false, false, false, false], lines: 0, zapUntil: 0 };
    D.TRAITS.nostalgie.parties.forEach(function (pid) { g.nost[pid] = 0; });
    D.PETALS.forEach(function (pt) { g.petals[pt.id] = pt.start; });
  }
  function ensureTraits(g) { if (!g.bingo) initTraits(g); }   // parties sauvegardées avant la v3.1
  function petalsCount(g) { return D.PETALS.filter(function (pt) { return g.petals[pt.id]; }).length; }
  function lostPetals(g) { return D.PETALS.filter(function (pt) { return !g.petals[pt.id]; }); }
  function centrists(g) { return CENTRE.filter(function (pid) { return !!player(g, pid); }); }
  /* 🚦 Embouteillage : les trois partis du centre sont bien implantés ici */
  function jammed(g, pid, rid) {
    if (CENTRE.indexOf(pid) < 0) return false;
    var others = CENTRE.filter(function (o) { return o !== pid; });
    return others.every(function (o) { return player(g, o) && cubes(g, rid, o) >= R.jamMin; }) && cubes(g, rid, pid) >= R.jamMin;
  }
  /* 📀 Les indécis zappent après un bingo, là où La France Indignée est faible */
  function zapped(g, pid, rid) { return pid === 'FI' && g.bingo && g.bingo.zapUntil >= g.turn && cubes(g, rid, pid) <= R.bingoZapMax; }
  /* 🔍 Les Rescapés deviennent transparents, coincés entre le Rassemblement Nostalgique et Réforme Encore */
  function computeHidden(g) {
    if (g.turn < 2 || !player(g, 'UG') || !player(g, 'MN') || !player(g, 'EM') || g.eclatUntil >= g.turn) return false;
    var rk = ranking(g), u = rk.indexOf('UG');
    return u >= 3 && rk.indexOf('MN') < u && rk.indexOf('EM') < u;
  }
  /* v4.3 (Bêta) : la force des effets propres à un parti (cartes, actions de parti, atouts) */
  function spec(g, pid, n) {
    if (!g || g.mode !== 'beta') return n;
    var f = (D.BETA.specific || {})[pid]; if (f == null || f === 1) return n;
    return Math.max(0, Math.round(n * f));   // arrondi : ce que la fiche affiche est ce qui se passe
  }
  function isHidden(g, pid) { return pid === 'UG' && !!g.hidden; }
  function retireeRegion(rid) { return REG[rid].pop.ret >= 30; }
  function nostalgiaPreview(g, pid, rid) {
    var k = (g.nost && g.nost[pid]) || 0;
    if (k >= D.NOSTALGIA.length) return null;
    if (k === D.NOSTALGIA.length - 1) return { k: k, n: 0, youth: 0, stone: true };
    var n = spec(g, pid, R.nostalgieGain[k] + (rid && retireeRegion(rid) ? 1 : 0));
    var other = pid === 'MN' ? 'RQ' : 'MN', war = !!(rid && player(g, other) && cubes(g, rid, other) > 0);
    return { k: k, n: Math.max(0, n - (war ? 1 : 0)), youth: R.nostalgieYouth[k], war: war, stone: false };
  }
  function youngRegions(g, pid, n, except) {
    return D.REGIONS.filter(function (r) { return r.id !== except && cubes(g, r.id, pid) > 0; })
      .sort(function (a, b) { return b.pop.sae - a.pop.sae; }).slice(0, n).map(function (r) { return r.id; });
  }
  /* Déplace des électeurs d'un parti à l'autre dans les 3 régions où « from » en a le plus */
  function swing(g, from, to, n) {
    var moved = [];
    var regs = from && player(g, from) ? D.REGIONS.filter(function (r) { return cubes(g, r.id, from) > 0; }).sort(function (a, b) { return cubes(g, b.id, from) - cubes(g, a.id, from); }).slice(0, n).map(function (r) { return r.id; })
                                       : bestRegions(g, to, n, null, 1);
    regs.forEach(function (rid) {
      var got = to ? addCubes(g, rid, to, 1) : 0;
      if (from && player(g, from) && (got || !to)) addCubes(g, rid, from, -1);
      if (got || !to) moved.push(rid);
    });
    return moved;
  }
  /* 📀 coche des mots du bingo ; renvoie la description du bingo s'il y en a un */
  function tickBingo(g, th, n) {
    var b = g.bingo, out = null;
    for (var i = 0; i < n; i++) {
      var idx = -1;
      D.BINGO.forEach(function (w, j) { if (idx < 0 && th && w.th === th && !b.ticks[j]) idx = j; });
      if (idx < 0) D.BINGO.forEach(function (w, j) { if (idx < 0 && !w.th && !b.ticks[j]) idx = j; });
      if (idx < 0) D.BINGO.forEach(function (w, j) { if (idx < 0 && !b.ticks[j]) idx = j; });
      if (idx < 0) break;
      b.ticks[idx] = true;
      var line = D.BINGO_LINES.filter(function (L) { return L.every(function (j) { return b.ticks[j]; }); })[0];
      if (line) {
        var regs = D.REGIONS.filter(function (r) { return cubes(g, r.id, 'FI') >= R.bingoBoostMin; }).map(function (r) { return r.id; });
        var bn = spec(g, 'FI', 1); regs = regs.filter(function (rid) { return bn > 0 && addCubes(g, rid, 'FI', bn) > 0; });
        b.lines += 1; b.zapUntil = g.turn + R.bingoZap - 1;
        out = { words: line.map(function (j) { return D.BINGO[j].w; }), regions: regs };
        b.ticks = b.ticks.map(function () { return false; });
        break;
      }
    }
    return out;
  }
  /* 🌹 La primaire perpétuelle : 0 = laisser débattre (une action de moins), 1 = trancher (un courant claque la porte) */
  function resolvePrimaire(g, choice) {
    var pr = g.primaire; if (!pr || pr.done) return null;
    pr.done = true; pr.choice = choice;
    var pl = player(g, 'SM'), res = { choice: choice, text: '' };
    if (choice === 0) { g.mods.fewer = g.mods.fewer || {}; g.mods.fewer.SM = 1; res.text = 'Le débat interne s\u2019éternise : 2 actions seulement ce tour.'; }
    else {
      var can = D.PETALS.filter(function (pt) { return g.petals[pt.id] && pt.to; });
      if (!can.length) { var lost = Math.min(pl.infl, 2); pl.infl -= lost; res.text = 'Plus personne pour claquer la porte… mais la séance coûte ' + lost + ' ★.'; }
      else {
        var pt = can[Math.floor(g.rng() * can.length)];
        g.petals[pt.id] = false; res.petal = pt.id;
        var moved = swing(g, 'SM', player(g, pt.to) ? pt.to : null, R.primaireCut);
        res.text = (pl.human ? 'Tu tranches. ' : 'La direction tranche. ') + 'Vexés, ' + pt.name + ' claquent la porte' + (player(g, pt.to) ? ' et partent chez ' + PARTY[pt.to].short : '') + ' : −1 soutien en ' + moved.map(function (r) { return REG[r].name; }).join(', ') + '.';
      }
    }
    g.log.push({ pid: 'SM', text: 'Primaire : ' + res.text });
    updateAllControl(g);
    return res;
  }
  /* L'ordinateur tranche quand il a des pétales à perdre et que ses actions valent cher */
  function autoPrimaire(g) {
    var pl = player(g, 'SM'), petals = D.PETALS.filter(function (pt) { return g.petals[pt.id] && pt.to; }).length;
    var choice = petals === 0 ? (pl.infl >= 4 ? 1 : 0) : (g.rng() < 0.25 ? 1 : 0);
    return resolvePrimaire(g, choice);
  }
  function actionsFor(g, pid) { return R.actionsPerTurn - ((g.mods && g.mods.fewer && g.mods.fewer[pid]) || 0); }

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

  /* v1.5 : le gain d'un Meeting, détaillé : base (selon l'impact) + bonus. terrainCubes en est le total. */
  function terrainBreakdown(g, pid, rid, th) {
    var imp = impact(g, pid, rid, th), parts = [{ k: 'base', label: 'impact ' + imp, n: R.terrainCubes[imp] }];
    if (pid === 'SM' && cubes(g, rid, pid) >= 5) parts.push({ k: 'parti', label: 'implantation', n: spec(g, pid, 1) });
    if (pid === 'DL' && REG[rid].profile === 'rurale') parts.push({ k: 'parti', label: 'France des clochers', n: spec(g, pid, 1) });
    var pl = player(g, pid);
    if (pl && pl.phare && MEAS[pl.phare].theme === th) parts.push({ k: 'phare', label: 'mesure phare', n: R.pharBonus });
    var e = pl && pl.programme ? echoBonus(g, pid, rid) : 0;   // v0.8 : le programme plaît (ou déplaît) aux habitants
    if (e) parts.push({ k: 'echo', label: e > 0 ? 'région de cœur' : 'région hostile', n: e });
    if (pl && pl.momentum) parts.push({ k: 'dyn', label: pl.momentum > 0 ? 'dynamique' : 'passage à vide', n: pl.momentum });
    if (g.bingo && jammed(g, pid, rid)) parts.push({ k: 'jam', label: 'embouteillage au centre', n: -1 });
    if (g.bingo && zapped(g, pid, rid)) parts.push({ k: 'zap', label: 'les indécis zappent', n: -1 });
    // v2.5 : un parti tout neuf attire la curiosité au début de la campagne, puis l'effet s'use
    if (pl && PARTY[pid] && PARTY[pid].novelty && g.turn <= R.novelty.turns) parts.push({ k: 'neuf', label: 'effet nouveauté', n: g.turn <= R.novelty.strongTurns ? 2 : 1 });
    var tot = 0; parts.forEach(function (x) { tot += x.n; });
    return { parts: parts, total: Math.max(1, tot) };
  }
  function terrainCubes(g, pid, rid, th) { return terrainBreakdown(g, pid, rid, th).total; }
  /* L'ordre dans lequel les plans sont joués ce tour : action 1 de chacun, puis action 2… Le premier change à chaque tour. */
  function turnOrder(g) {
    var order = [], n = g.players.length, start = ((Math.max(1, g.turn) - 1) % n + n) % n;
    for (var i = 0; i < n; i++) order.push(g.players[(start + i) % n].id);
    return order;
  }
  function mediaCubes(g, pid, rid, th) {
    var n = R.mediaCubes[impact(g, pid, rid, th)], prof = REG[rid].profile;
    if (n > 0 && pid === 'VP' && prof === 'urbaine') n++;
    if (n > 0 && pid === 'MN' && prof === 'industrielle') n++;
    if (n > 0 && g.bingo && zapped(g, pid, rid)) n--;
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
    var sh = g.hist ? controlShares(g, rid) : null;
    pids(g).forEach(function (pid) {
      // v3.5.4 : en Réaliste, la région revient à qui fait le plus de voix, socle électoral compris (sinon : les soutiens)
      var n = sh ? sh[pid] : strength(g, rid, pid);
      if (n > best + 1e-9) { best = n; leaders = [pid]; } else if (Math.abs(n - best) <= 1e-9) leaders.push(pid);
    });
    var prev = reg.controller;
    var low = sh ? 1 : 0;   // v3.5.6 : en Réaliste, un soutien de moins suffit (un parti à 28 % n'a souvent que 3 soutiens)
    if (leaders.length === 1 && cubes(g, rid, leaders[0]) >= minControl(leaders[0]) - low) reg.controller = leaders[0];
    else if (prev && leaders.indexOf(prev) >= 0 && cubes(g, rid, prev) >= minControl(prev) - low) reg.controller = prev;
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
      var o = othersShare(g, r.id);
      v._autres = (v._autres || 0) + ex * o;
      g.players.forEach(function (p) { w[p.id] = strength(g, r.id, p.id) * (reg.controller === p.id ? R.incumbentBonus : 1); T += w[p.id]; });
      // v3.2 : en Réaliste, une part des électeurs vote par fidélité (le socle) · v3.8 : puis l'audience par classe sociale
      if (T > 0) { var sh = regionShares(g, r.id); g.players.forEach(function (p) { v[p.id] += ex * (1 - o) * sh[p.id]; }); }
    });
    // v3.1 : un micro-parti centriste grignote une part des voix de chaque parti du centre
    if (g.micro) CENTRE.forEach(function (pid) { if (v[pid] != null) { var cut = v[pid] * R.microCut; v[pid] -= cut; v._autres = (v._autres || 0) + cut; } });
    // v1.5 : plus de multiplicateur caché en mode Simulation (avant : FI et MN ×1,18). Départ strictement égal.
    // Objectif secret réussi : des voix en plus le jour du scrutin (pas dans les sondages, voir objectiveShare)
    if (withObjectives) g.players.forEach(function (p) {
      var o = D.OBJECTIVES.filter(function (x) { return x.id === p.objective; })[0];
      if (objectiveMet(g, p.id, p.objective)) v[p.id] += objectiveShare(o) * totalExp;
    });
    return v;
  }
  /* v1.2 : score de départ d'un parti dans une région, selon le point de départ choisi (mode Réaliste) */
  var NAT24 = (function () {
    var n = {}, w = 0;
    D.REGIONS.forEach(function (r) { var ex = r.ins * (1 - r.abst / 100) * (1 - (r.blanc + r.nuls) / 100); w += ex; Object.keys(r.start).forEach(function (p) { n[p] = (n[p] || 0) + ex * r.start[p]; }); });
    Object.keys(n).forEach(function (p) { n[p] /= w; });
    return n;
  })();
  var POLL_SCALE = (function () { var t = 0; Object.keys(D.POLLS.avg).forEach(function (k) { t += D.POLLS.avg[k]; }); return t > 100 ? 100 / t : 1; })();
  function baseScore(base, r, pid) {
    if (base === 'p2022') return (r.start22 && r.start22[pid]) || 0;
    if (base === 'sond') return NAT24[pid] ? (r.start[pid] || 0) * (D.POLLS.avg[pid] || 0) / NAT24[pid] * POLL_SCALE : 0;   // profil 2024 × tendance nationale des sondages
    return r.start[pid] || 0;
  }
  /* Mode Réaliste : la part des « autres » (petites listes, partis absents de la partie). La campagne les écrase peu à peu :
     les électeurs se rangent derrière les grands candidats (vote utile). */
  function othersShare(g, rid) {
    var o = (g.regions[rid] && g.regions[rid].others) || 0;
    return o * Math.pow(R.othersKeep, Math.max(0, g.turn - 1));
  }
  function percents(v) {
    var s = 0; Object.keys(v).forEach(function (k) { s += v[k]; });
    return Object.keys(v).filter(function (k) { return k !== '_autres'; }).map(function (k) { return { pid: k, votes: v[k], pct: s ? v[k] / s : 0 }; })
      .sort(function (a, b) { return b.pct - a.pct; });
  }
  function poll(g) { return percents(votes(g, false)); }
  function ranking(g) { return poll(g).map(function (x) { return x.pid; }); }
  function leader(g) {
    var p = poll(g);
    return p[0].pct > p[1].pct + 0.005 ? p[0].pid : null;
  }
  function last(g) { var r = ranking(g); return r[r.length - 1]; }

  /* ---------- v2.5 : un 13e parti, fondé par le joueur ----------
     p : le parti (même forme que data.js), start : son score de départ (%) dans chaque région */
  function registerParty(p, temper, start) {
    unregisterParty(p.id);
    D.PARTIES.push(p); PARTY[p.id] = p; D.TEMPERS[p.id] = temper;
    D.REGIONS.forEach(function (r) { r.start[p.id] = start; if (r.start22) r.start22[p.id] = start; });
    D.POLLS.avg[p.id] = start; NAT24[p.id] = start;
  }
  function unregisterParty(id) {
    var i = D.PARTIES.map(function (x) { return x.id; }).indexOf(id);
    if (i < 0 || !D.PARTIES[i].custom) return;
    D.PARTIES.splice(i, 1); delete PARTY[id]; delete D.TEMPERS[id];
    D.REGIONS.forEach(function (r) { delete r.start[id]; if (r.start22) delete r.start22[id]; });
    delete D.POLLS.avg[id]; delete NAT24[id];
  }

  /* ---------- Création ---------- */
  function createGame(humanParty, opts) {
    opts = opts || {};
    var format = setFormat(opts.format);
    var seed = opts.seed != null ? opts.seed : Math.floor(Math.random() * 1e9);
    var rng = makeRng(seed);
    var others = D.PARTIES.map(function (p) { return p.id; }).filter(function (id) { return id !== humanParty; });
    var ai = opts.aiParties || shuffle(others, rng).slice(0, R.rivals);
    var ids = humanParty ? [humanParty].concat(ai) : ai;
    var objs = shuffle(D.OBJECTIVES.map(function (o) { return o.id; }), rng);
    var g = {
      seed: seed, rng: rng, format: format, mode: opts.mode === 'egal' ? 'egal' : opts.mode === 'beta' ? 'beta' : 'reel', base: D.BASES[opts.base] ? opts.base : 'e2024', turn: 0, phase: 'setup', winner: null, over: false, result: null,
      alliances: {}, betrayed: {}, offers: [], hot: [], nextHot: [], news: null,
      bases: {}, pending: [], markers: [], crisis: null, dilemma: null, dilemmas: [], lastPoll: null,
      affairs: [], nextAffairs: [], affairDeck: [], affairIdx: 0,
      players: ids.map(function (id, i) {
        var p = PARTY[id];
        return { id: id, human: id === humanParty, money: Math.round(p.money * (1 - R.moneyBlend) + 5 * R.moneyBlend), infl: p.infl,   // v2.8.1 : en éclair, les cagnottes de départ se rapprochent
                 cards: p.cards.slice(), objective: objs[i % objs.length], debateWins: 0,
                 forme: R.formeStart, cas: 0, momentum: 0, cred: Object.assign({}, p.cred), talk: {}, militants: 0,
                 programme: null, phare: null, budget: 0 };
      }),
      regions: {}, events: shuffle(D.EVENTS.map(function (e) { return e.id; }), rng),
      event: null, mods: {}, cancel: {}, log: [], history: []
    };
    applyMode(g);   // v4.1
    // v1.0 : chaque région démarre avec ses vrais inscrits, sa vraie abstention et son vrai vote blanc (2022),
    // et chaque parti avec des électeurs proportionnels à son score de départ (mode Réaliste) ou à égalité (mode Égalité)
    D.REGIONS.forEach(function (r) {
      g.regions[r.id] = { cubes: {}, controller: null, ins: r.ins, abst: r.abst / 100 * R.round1Abst, blank: (r.blanc + r.nuls) / 100 * R.round1Blank };
      if (g.mode === 'egal') {
        // Mode Égalité : tout le monde part avec les mêmes électeurs partout, personne ne tient de région
        g.players.forEach(function (pl) { addCubes(g, r.id, pl.id, R.equalStart); });
        g.regions[r.id].others = 0;
        return;
      }
      // Mode Réaliste : la moyenne des législatives et des européennes 2024 (voir data.js). Le contrôle des régions
      // suit ensuite la règle normale (au moins 3 électeurs, 4 pour le Mouvement National, et être devant)
      // au moins 1 électeur partout : chaque parti a des sympathisants dans toutes les régions
      g.players.forEach(function (pl) {
        var n = Math.max(1, Math.round(baseScore(g.base, r, pl.id) * R.startScale / 100));
        // v2.5 : un parti tout neuf n'a de sympathisants que là où ses thèmes parlent aux habitants, et dans ses régions de base
        var P = PARTY[pl.id];
        if (P.custom) n = (P.bases.indexOf(r.id) >= 0 || (P.themes || []).some(function (t) { return r.concerns.indexOf(t) >= 0; })) ? 1 : 0;
        if (n) addCubes(g, r.id, pl.id, n);
      });
      // les électeurs des partis absents de la partie et des autres listes : « autres », qui pèsent dans les sondages
      var sum = 0; pids(g).forEach(function (id) { sum += baseScore(g.base, r, id); });
      g.regions[r.id].others = Math.max(0, 100 - sum) / 100;
    });
    if (g.mode !== 'egal') computeWeights(g);
    updateAllControl(g);
    // v1.5 : un objectif secret doit demander un effort. S'il est déjà rempli au départ (ex. le Mouvement National
    // contrôle déjà les régions industrielles en mode Réaliste), on l'échange contre un objectif encore à atteindre.
    var spare = objs.slice(g.players.length);
    g.players.forEach(function (pl) {
      if (!objectiveMet(g, pl.id, pl.objective)) return;
      for (var k = 0; k < spare.length; k++) {
        if (!objectiveMet(g, pl.id, spare[k])) { var old = pl.objective; pl.objective = spare[k]; spare[k] = old; return; }
      }
      // plus d'objectif libre (6 partis pour 8 objectifs) : on échange avec un autre parti, si ça arrange les deux
      g.players.some(function (o2) {
        if (o2 === pl || objectiveMet(g, pl.id, o2.objective) || objectiveMet(g, o2.id, pl.objective)) return false;
        var t = pl.objective; pl.objective = o2.objective; o2.objective = t; return true;
      });
    });
    // v0.5 : une crise en 3 actes, et un paquet de dilemmes
    var cr = D.CRISES[Math.floor(rng() * D.CRISES.length)];
    g.crisis = { id: cr.id, start: R.crisisStart[0] + Math.floor(rng() * (R.crisisStart[1] - R.crisisStart[0] + 1)) };
    initTraits(g);
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
    ensureTraits(g);
    g.turn += 1; g.mods = {}; g.cancel = {}; g.log = []; g.primaire = null;
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
        var risk = pl.cas * R.affairPerCasserole;
        if (pl.cas > 0 && g.rng() < risk && !list.some(function (x) { return x.pid === pl.id; })) list.push({ pid: pl.id, src: 'casseroles' });
      });
      if (!list.length && g.rng() < R.canardChance) {
        var tot = 0; g.players.forEach(function (p) { tot += p.cas + 1; });
        var r = g.rng() * tot, pick = g.players[0];
        for (var i = 0; i < g.players.length; i++) { r -= g.players[i].cas + 1; if (r <= 0) { pick = g.players[i]; break; } }
        list.push({ pid: pick.id, src: 'canard' });
      }
      var seenAff = {}; list = list.filter(function (x) { if (seenAff[x.pid]) return false; seenAff[x.pid] = 1; return true; });   // v3.6.5 : une affaire par parti et par tour
      g.affairs = list.slice(0, R.affairsMax).map(function (x) {
        var id = x.id || g.affairDeck[g.affairIdx++ % g.affairDeck.length];
        var def = affairDef(id);
        return { pid: x.pid, id: id, title: def.title, text: def.text, src: x.src || (id === 'budget' ? 'budget' : 'dossier'), from: x.from || null };
      });
      out.affairs = g.affairs.slice();
    }
    var em = player(g, 'EM');
    if (em && g.turn === R.wearTurn) {   // v2.8.1 : le tour de l'usure dépend du format (5 en classique, 2 en éclair)
      var rid = strongestRegion(g, 'EM');
      if (rid) { addCubes(g, rid, 'EM', -1); out.usure = rid; g.log.push({ pid: 'EM', text: 'Usure du pouvoir : −1 soutien en ' + REG[rid].name }); }
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
    // v2.0 : le joueur humain reçoit le sien au tour 2, pour que le premier tour soit tout de suite du jeu
    var order = g.players.slice();
    if (order.length > 1 && order[0].human) order.splice(1, 0, order.shift());
    var dp = order[(g.turn - 1) % order.length];
    var did = g.dilemmas[(g.turn - 1) % g.dilemmas.length];
    g.dilemma = { pid: dp.id, id: did };
    out.dilemma = g.dilemma;
    updateAllControl(g);
    // v3.1 : les traits satiriques du tour
    if (R.microTurns.indexOf(g.turn) >= 0 && !g.micro && centrists(g).length >= 2) {
      g.micro = { name: D.MICRO[g.microIdx++ % D.MICRO.length], since: g.turn };
      out.micro = g.micro.name;
    }
    var wasHidden = g.hidden;
    g.hidden = computeHidden(g);
    if (g.hidden) out.hidden = { fresh: !wasHidden };
    if (player(g, 'SM') && R.primaireTurns.indexOf(g.turn) >= 0 && g.turn < R.maxTurns + 1) {
      g.primaire = { pid: 'SM', done: false };
      if (player(g, 'SM').human) out.primaire = { pid: 'SM' };
      else out.primaire = Object.assign({ pid: 'SM', ai: true }, autoPrimaire(g));
    }
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
    var cap = 3;
    if (pid === 'PC' && REG[rid].profile === 'industrielle') { var bo = spec(g, pid, 1); n += bo; cap = 3 + bo; why.push('bastion ouvrier'); }
    return { n: Math.min(cap, n), why: why };
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
          if (rid) { var x = addCubes(g, rid, pid, e.n); say((x >= 0 ? '+' : '−') + Math.abs(x) + ' soutien' + (Math.abs(x) > 1 ? 's' : '') + ' en ' + REG[rid].name); }
          break; }
        case 'loseTop': {
          var done = [];
          for (var i = 0; i < e.count; i++) {
            var r2 = strongestRegion(g, pid, function (r) { return done.indexOf(r.id) < 0; });
            if (!r2) break; done.push(r2); addCubes(g, r2, pid, -e.n);
          }
          if (done.length) say('−' + e.n + ' soutien en ' + done.map(function (r) { return REG[r].name; }).join(' et '));
          break; }
        case 'regions': {
          var regs = bestRegions(g, pid, e.count, e.profile ? function (r) { return r.profile === e.profile; } : null, e.n);
          regs.forEach(function (r) { addCubes(g, r, pid, e.n); });
          if (regs.length) say('+' + e.n + ' soutien en ' + regs.map(function (r) { return REG[r].name; }).join(', '));
          break; }
        case 'rival': {
          var rk = ranking(g).filter(function (x) { return x !== pid && x !== allyOf(g, pid); })[0];
          var r3 = rk && strongestRegion(g, rk);
          if (r3) { var y = -addCubes(g, r3, rk, -e.n); say(PARTY[rk].short + ' perd ' + y + ' soutien' + (y > 1 ? 's' : '') + ' en ' + REG[r3].name); }
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
            if (r4) { addCubes(g, r4, p.id, e.n); say(PARTY[p.id].short + ' : +' + e.n + ' soutien en ' + REG[r4].name); }
          }); break;
        case 'controllerLoss':
          e.regions.forEach(function (rid) {
            var c = g.regions[rid].controller;
            if (c) { addCubes(g, rid, c, -e.n); say(PARTY[c].short + ' perd ' + e.n + ' soutien en ' + REG[rid].name); }
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
          addCubes(g, rid, l, -2); say(l, PARTY[l].short + ' perd 2 soutiens en ' + REG[rid].name + '.'); }
        else say(null, 'Personne n’est en tête : le scandale fait pschitt.');
        break; }
      case 'buzz': g.mods.socialFree = true; say(null, 'Buzz gratuits ce tour.'); break;
      case 'sondage': { var p = player(g, last(g)); p.infl += 2; say(p.id, PARTY[p.id].short + ' gagne 2 ★.'); break; }
      case 'fete': g.players.forEach(function (p) { p.infl += 1; }); say(null, 'Tous les partis gagnent 1 ★.'); break;
      case 'division': case 'division2':
        g.players.forEach(function (p) {
          var n = p.id === 'UG' ? 2 : 1; var rid = strongestRegion(g, p.id);
          if (rid) { addCubes(g, rid, p.id, -n); say(p.id, PARTY[p.id].short + ' perd ' + n + ' soutien' + (n > 1 ? 's' : '') + ' en ' + REG[rid].name + '.'); }
        }); break;
      case 'fuite': g.players.forEach(function (p) { p.infl = Math.max(0, p.infl - 1); }); say(null, 'Tous les partis perdent 1 ★.'); break;
      case 'salon': case 'patrimoine': {
        var prof = id === 'salon' ? 'rurale' : 'historique';
        g.players.forEach(function (p) {
          var rid = strongestRegion(g, p.id, function (r) { return r.profile === prof; });
          if (rid) { addCubes(g, rid, p.id, 1); say(p.id, PARTY[p.id].short + ' : +1 soutien en ' + REG[rid].name + '.'); }
        }); break; }
      case 'usine':
        D.REGIONS.forEach(function (r) {
          var c = g.regions[r.id].controller;
          if (r.profile === 'industrielle' && c) { addCubes(g, r.id, c, -1); say(c, PARTY[c].short + ' perd 1 soutien en ' + r.name + '.'); }
        }); break;
      case 'mecene': { var q = player(g, last(g)); q.money += 3; say(q.id, PARTY[q.id].short + ' gagne 3 €.'); break; }
      case 'bouchons': { var c = g.regions.idf.controller;
        if (c) { addCubes(g, 'idf', c, -1); say(c, PARTY[c].short + " perd 1 soutien en Île-de-France."); } else say(null, "Personne ne contrôle l'Île-de-France."); break; }
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
    if (act.type === 'medias' && (pid === 'LO' || pid === 'DL')) c.money += 1;   // v1.7 : petits partis, peu de relais médiatiques
    if (act.type === 'militants' && pid === 'LO') c.money -= 1;
    if (act.type === 'reforme' && pid === 'HZ') c.infl -= 1;
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
    if (!def) return 'Action inconnue.';
    if (def.only && def.only.indexOf(pid) < 0) return 'Action réservée à un autre parti.';
    if (def.target === 'region' && !act.region) return 'Choisis une région.';
    if (act.type === 'nostalgie' && (g.nost[pid] || 0) >= D.NOSTALGIA.length) return 'La machine à remonter le temps est cassée : plus personne n\u2019y croit.';
    if (act.type === 'nostalgie' && player(g, pid).nostTurn === g.turn) return 'Un seul retour en arrière par tour : le public a besoin de digérer.';
    if (act.type === 'rappel') {
      if (!lostPetals(g).length) return 'Ta rose a toutes ses pétales.';
      if (player(g, pid).rappelTurn === g.turn) return 'François Hésitant ne décroche qu\u2019une fois par tour.';
    }
    if (act.type === 'repos' && player(g, pid).forme >= R.formeMax) return 'Ton candidat est déjà en pleine forme.';
    if (act.type === 'matinale') { var me1 = matinaleError(g, pid); if (me1) return me1; if (act.station && !STB[act.station]) return 'Radio inconnue.'; }
    if (act.type === 'vingt') { var ve = vingtError(g, pid); if (ve) return ve; }
    if (act.type === 'fusion' && !g.micro) return 'Aucun micro-parti à absorber pour l\u2019instant.';
    if (act.type === 'eclat' && g.eclatUntil >= g.turn) return 'Les caméras sont déjà braquées sur toi.';
    if (def.theme && !THEME[act.theme]) return 'Choisis un thème.';
    if (act.type === 'imposer' && g.turn >= R.maxTurns) return 'Plus de tour suivant : la campagne est finie.';
    if (act.type === 'mobiliser' && regionVoters(g, act.region).abst <= 1 - R.turnoutMax) return 'Presque tout le monde vote déjà ici.';
    if (act.type === 'militants') {
      var pl0 = player(g, pid);
      if ((g.bases[act.region] || []).indexOf(pid) >= 0) return 'Tu as déjà des militants ici.';
      if (pl0.militants >= R.militantsMax) return 'Toutes tes équipes de militants sont déjà sur le terrain.';
      if (g.turn >= R.maxTurns) return 'Trop tard : la campagne s’achève.';
    }
    if (act.type === 'alliance' || act.type === 'rupture') return 'Les alliances se négocient entre les deux tours.';
    if (act.type === 'enquete') {
      if (!act.target || !player(g, act.target) || act.target === pid) return 'Choisis un rival.';
      if (allyOf(g, pid) === act.target) return 'On n’enquête pas sur son allié.';
      if (g.turn >= R.maxTurns) return 'Trop tard : le dossier ne sortira pas avant l’élection.';
    }
    if (act.type === 'rupture' && !allyOf(g, pid)) return 'Tu n’as pas d’allié.';
    if (act.type === 'contre' && cubes(g, act.region, pid) < 1) return 'Il faut au moins 1 soutien dans la région.';
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
    var top = 0, tot = 0; pids(g).forEach(function (o) { tot += strength(g, rid, o); if (o !== pid) top = Math.max(top, cubes(g, rid, o)); });
    var wk = k * weight(g, rid, pid), ms = strength(g, rid, pid);
    var voteVal = r.pts * ((ms + wk) / (tot + wk) - (tot ? ms / tot : 0)) * 1.6;
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
      entry.ok = false; entry.gaffe = true; entry.text = '😬 GAFFE ! Épuisé, le candidat dérape : aucun soutien, +1 casserole.';
      return entry;
    }
    var rn = act.region ? REG[act.region].name : '';
    var t = [];
    switch (act.type) {
      case 'terrain': {
        var bd = terrainBreakdown(g, pid, act.region, act.theme);
        var n = addCubes(g, act.region, pid, bd.total);
        t.push('+' + n + ' en ' + rn + ' (' + bd.parts.map(function (x) { return x.label + (x.k === 'base' ? ' : ' : ' ') + (x.n > 0 && x.k !== 'base' ? '+' : '') + x.n; }).join(', ') + (n < bd.total ? ', plafond atteint' : '') + ')');
        var pc = poach(g, pid, act.region, true); if (pc) t.push('récupère 1 électeur de ' + PARTY[pc].short);
        break; }
      case 'matinale':
      case 'vingt':
      case 'medias': {
        var fmtK = act.type === 'medias' ? 'tele' : act.type, stK = act.type === 'matinale' ? (act.station && STB[act.station] ? act.station : 'rmc') : null;
        if (act.type === 'matinale') pl.matinaleTurn = g.turn;
        if (act.type === 'vingt') pl.vingtUsed = g.turn;
        // v3.8 : une interview à la télé. Plus de région : l'audience gagne des classes sociales, dans toute la France.
        var qv = act.qid && QBY[act.qid] ? QBY[act.qid] : pickQuestion(g, act.theme || bestTheme(g, pid, null), pid.length + pid.charCodeAt(0));
        var iv = interview(g, pid, qv.id, fmtK, stK ? stationBoost(pid, stK) : null);
        var cd = iv.cards.filter(function (x) { return x.key === act.reply; })[0] || aiAnswer(g, pid, iv);
        if (isHidden(g, pid) && g.rng() < R.hiddenMiss) { entry.hidden = true; t.push('📺 personne n\u2019a regardé (la caméra est partie chez le voisin)'); break; }
        if (g.bingo && pid === 'FI' && g.bingo.zapUntil >= g.turn) { Object.keys(cd.gains).forEach(function (s) { cd.gains[s] = Math.round(cd.gains[s] * 7) / 10; }); }
        var flop = act.type === 'vingt' && g.rng() < stageRisk(g, pid);
        if (flop) {   // le trac du direct : trou de mémoire, ça tourne en boucle sur les réseaux
          var neg = {}; SEG.forEach(function (s) { neg[s] = -Math.round(Math.abs(cd.gains[s]) * 5) / 10; });
          cd = Object.assign({}, cd, { gains: neg }); pl.cas = Math.min(R.casseroleMax, pl.cas + 1);
        }
        var before = pollMap(g)[pid] || 0, ra = applyInterview(g, pid, cd);
        entry.media = { fmt: fmtK, station: stK, flop: flop, qid: qv.id, key: cd.key, name: cd.name, icon: cd.icon, quote: cd.quote, gains: cd.gains, delta: (pollMap(g)[pid] || 0) - before, cas: ra.cas };
        entry.theme = qv.theme;
        var best = SEG.slice().sort(function (a, b) { return cd.gains[b] - cd.gains[a]; }).slice(0, 2);
        t.push((act.type === 'vingt' ? '🕗 ' : act.type === 'matinale' ? STB[stK].icon + ' ' + STB[stK].name + ' · ' : '📺 ') + (flop ? '😱 trou de mémoire en direct, +1 casserole · ' : '') + cd.icon + ' ' + cd.name + ' : ' + best.map(function (s) { var sg = D.SEGMENTS.filter(function (x) { return x.id === s; })[0]; return sg.icon + ' +' + String(cd.gains[s]).replace('.', ','); }).join(' · ') +
          ' (' + (entry.media.delta >= 0 ? '+' : '') + (100 * entry.media.delta).toFixed(1).replace('.', ',') + ' pt)' + (ra.cas ? ' · la promesse ne tient pas : +1 casserole' : ''));
        break; }
      case 'reseaux': {
        var d = 1 + Math.floor(g.rng() * 6);
        if (pid === 'FI' && d <= 2) { var d2 = 1 + Math.floor(g.rng() * 6); t.push('dé ' + d + ', relancé'); d = d2; }
        var m = d === 1 ? -1 : d <= 3 ? 1 : d <= 5 ? 2 : 4;
        if (isHot(g, act.theme)) m += R.socialHotBonus;
        if (pid === 'RQ' && act.theme === 'immigration') m += spec(g, pid, 1);   // v1.7 : polémiques
        var unseen = isHidden(g, pid) && m > 0 && g.rng() < R.hiddenMiss;
        if (unseen) { entry.hidden = true; m = 0; }
        var got = addCubes(g, act.region, pid, m);
        t.push('dé ' + d + (d === 6 ? ' VIRAL' : d === 1 ? ' bad buzz' : '') + ' : ' + (got >= 0 ? '+' : '') + got + ' en ' + rn + (unseen ? ' (personne n\u2019a vu la vidéo)' : '')); break; }
      case 'contre': {
        var rival = rivalIn(g, act.region, pid);
        var n2 = 2;
        if (rival === 'UG' && REG[act.region].profile === 'historique') n2 = Math.max(0, Math.min(2, cubes(g, act.region, 'UG') - 2));
        if (isHidden(g, rival)) n2 = Math.min(n2, 1);   // v3.1 : on ne tire pas sur une ambulance
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
        pl.enqUsed = (pl.enqUsed || 0) + 1;
        var tgt = player(g, act.target), ch = enqueteChance(g, act.target);
        if (g.rng() < ch) {
          if (!g.nextAffairs.some(function (x) { return x.pid === act.target; })) g.nextAffairs.push({ pid: act.target, from: pid });   // v3.6.5 : un seul dossier par cible et par tour
          t.push('dossier trouvé sur ' + PARTY[act.target].short + ' : l’affaire sortira demain');
        } else if (g.rng() < R.enqueteBackfire) {
          pl.cas = Math.min(R.casseroleMax, pl.cas + 2);
          t.push('rien trouvé… et tes barbouzes sont démasquées : +2 casseroles');
        } else t.push('rien trouvé sur ' + PARTY[act.target].short);
        break; }
      case 'militants': {
        g.bases[act.region] = (g.bases[act.region] || []).concat([pid]); pl.militants += 1;
        t.push('des militants s’installent en ' + rn + ' (+1 soutien par tour)'); break; }
      case 'imposer': {
        if (!g.nextHot.some(function (x) { return x.theme === act.theme; })) g.nextHot.push({ theme: act.theme, pid: pid });
        t.push(THEME[act.theme].name + ' fera l’actu au prochain tour'); break; }
      case 'fonds': {
        var fg = fundsGain(pid), f = fg.money; pl.money += f; pl.infl += fg.infl; t.push('+' + f + ' €' + (pid === 'EM' ? ' +1 ★' : '')); break; }
      case 'reforme': {
        var prof2 = REG[act.region].profile;
        D.REGIONS.forEach(function (r) { if (r.profile === prof2) { var x = addCubes(g, r.id, pid, 1); if (x) t.push('+1 ' + r.name); } });
        break; }
      case 'repos': {
        var f0r = pl.forme; pl.forme = Math.min(R.formeMax, pl.forme + R.reposForme);
        t.push('le candidat souffle un peu : +' + (pl.forme - f0r) + ' ⚡'); break; }
      case 'nostalgie': {
        var nv = nostalgiaPreview(g, pid, act.region), step = D.NOSTALGIA[nv.k];
        g.nost[pid] = nv.k + 1; pl.nostTurn = g.turn; entry.nost = { k: nv.k, year: step.year, what: step.what };
        if (nv.stone) {
          var hit = [];
          for (var q = 0; q < 3; q++) { var sr = strongestRegion(g, pid, function (r) { return hit.indexOf(r.id) < 0; }); if (sr) { addCubes(g, sr, pid, -1); hit.push(sr); } }
          pl.cas = Math.min(R.casseroleMax, pl.cas + 1);
          t.push('« ' + step.what + ' » : fou rire général · −1 en ' + hit.map(function (r) { return REG[r].name; }).join(', ') + ' · +1 casserole');
          break;
        }
        if (nv.war) { var oth = pid === 'MN' ? 'RQ' : 'MN'; addCubes(g, act.region, oth, -1); entry.war = oth; }
        var gotN = addCubes(g, act.region, pid, nv.n);
        t.push('retour en ' + step.year + ' : +' + gotN + ' en ' + rn + (retireeRegion(act.region) ? ' (les retraités adorent)' : '') + (nv.war ? ' · guerre des nostalgies avec ' + PARTY[entry.war].short + ' (−1 chacun)' : ''));
        if (nv.youth) {
          var yr = youngRegions(g, pid, nv.youth, act.region);
          yr.forEach(function (rid) { addCubes(g, rid, pid, -1); });
          if (yr.length) t.push('les jeunes fuient : −1 en ' + yr.map(function (r) { return REG[r].name; }).join(', '));
        }
        break; }
      case 'rappel': {
        pl.rappelTurn = g.turn;
        var lp = lostPetals(g)[0];
        if (g.rng() < R.rappelChance) {
          g.petals[lp.id] = true; entry.petal = lp.id;
          var mv = swing(g, player(g, lp.to) ? lp.to : null, pid, spec(g, pid, R.rappelSwing));
          t.push('François Hésitant ramène ' + lp.name + ' : +1 en ' + mv.map(function (r) { return REG[r].name; }).join(', ') + (player(g, lp.to) ? ' (repris à ' + PARTY[lp.to].short + ')' : ''));
          if (petalsCount(g) === D.PETALS.length && !g.roseBloom) {
            g.roseBloom = true; entry.bloom = true; pl.infl += 2;
            var bl = bestRegions(g, pid, 3, null, 1); bl.forEach(function (rid) { addCubes(g, rid, pid, 1); });
            t.push('🌹 la rose refleurit ! +2 ★ et +1 en ' + bl.map(function (r) { return REG[r].name; }).join(', '));
          }
        } else {
          pl.cas = Math.min(R.casseroleMax, pl.cas + R.rappelCas); entry.book = true;
          t.push('François Hésitant sort un livre qui règle ses comptes : +' + R.rappelCas + ' casseroles');
        }
        break; }
      case 'fusion': {
        var mname = g.micro.name; g.micro = null; g.microDone += 1; entry.micro = mname;
        var fr = bestRegions(g, pid, spec(g, pid, R.fusionGain), null, 1); fr.forEach(function (rid) { addCubes(g, rid, pid, 1); });
        t.push('absorbe « ' + mname + ' » : ses militants rejoignent le parti, +1 en ' + fr.map(function (r) { return REG[r].name; }).join(', '));
        break; }
      case 'eclat': {
        g.eclatUntil = g.turn + R.eclatTurns - 1; g.hidden = false; entry.eclat = true;
        var er = bestRegions(g, pid, spec(g, pid, R.eclatGain), null, 1); er.forEach(function (rid) { addCubes(g, rid, pid, 1); });
        t.push(PARTY[pid].candidate + ' sort la tronçonneuse : les caméras reviennent · +1 en ' + er.map(function (r) { return REG[r].name; }).join(', '));
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
    // v0.4 : parler souvent d'un thème rend crédible dessus. v1.5 : la crédibilité monte APRÈS l'action
    // (avant, l'action qui franchissait le seuil rapportait plus que ce qu'annonçait l'écran)
    if (act.theme) {
      pl.talk[act.theme] = (pl.talk[act.theme] || 0) + 1;
      if (pl.talk[act.theme] >= R.credTalk && pl.cred[act.theme] < 2) {
        pl.cred[act.theme] += 1; pl.talk[act.theme] = 0;
        entry.credUp = act.theme;
      }
    }
    if (entry.credUp) t.push('devient crédible sur ' + THEME[entry.credUp].name);
    if (pid === 'FI' && act.theme && g.bingo) {   // v3.1 : chaque message coche un mot du bingo
      var bg = tickBingo(g, act.theme, 1);
      if (bg) { entry.bingo = bg; t.push('📀 BINGO (« ' + bg.words.join(' », « ') + ' ») : les militants s\u2019enflamment, +1 en ' + (bg.regions.length ? bg.regions.map(function (r) { return REG[r].name; }).join(', ') : 'aucune région') + ' · les indécis zappent'); }
    }
    entry.text = t.join(' · ');
    updateAllControl(g);
    return entry;
  }

  function resolveCard(g, pid, act) {
    var pl = player(g, pid), t = [];
    function others() { return g.players.filter(function (p) { return p.id !== pid; }); }
    switch (act.card) {
      case 'marche_pop': case 'climat': t.push('+' + addCubes(g, act.region, pid, spec(g, pid, 3)) + ' en ' + REG[act.region].name); break;
      case 'grand_meeting': t.push('+' + addCubes(g, act.region, pid, spec(g, pid, 4)) + ' en ' + REG[act.region].name); break;
      case 'censure': others().forEach(function (p) { p.infl = Math.max(0, p.infl - 1); }); t.push('chaque adversaire −1 ★'); break;
      case 'primaire': pl.infl += 3; t.push('+3 ★'); break;
      case 'rassemblement': pl.money += 3; pl.infl += 1; t.push('+3 € +1 ★'); break;
      case 'fete_rose': {
        t.push('+' + addCubes(g, act.region, pid, spec(g, pid, 2)) + ' en ' + REG[act.region].name);
        var o = bestRegions(g, pid, 1, function (r) { return cubes(g, r.id, pid) > 0; }, 2, [act.region])[0];
        if (o) t.push('+' + addCubes(g, o, pid, spec(g, pid, 2)) + ' en ' + REG[o].name); break; }
      case 'canicule':
        others().forEach(function (p) {
          var a = strongestRegion(g, p.id); if (a) addCubes(g, a, p.id, -1);
          var b = strongestRegion(g, p.id, function (r) { return r.id !== a; }); if (b) addCubes(g, b, p.id, -1);
        }); t.push('chaque adversaire −1 soutien dans 2 régions'); break;
      case 'art493': {
        var rk = ranking(g).filter(function (x) { return x !== pid; })[0];
        g.cancel[rk] = true; pl.cas = Math.min(R.casseroleMax, pl.cas + 1);
        t.push('la prochaine action de ' + PARTY[rk].short + ' est annulée · +1 casserole'); break; }
      case 'remaniement': {
        var from = strongestRegion(g, pid, function (r) { return r.id !== act.region; });
        if (from) { var mv = -addCubes(g, from, pid, -2); addCubes(g, act.region, pid, mv); t.push(mv + ' soutiens de ' + REG[from].name + ' vers ' + REG[act.region].name); }
        break; }
      case 'appel18': D.REGIONS.forEach(function (r) { if (r.profile === 'historique') addCubes(g, r.id, pid, spec(g, pid, 1)); }); t.push('+' + spec(g, pid, 1) + ' dans chaque région historique'); break;
      case 'plateau_tele':
        bestRegions(g, pid, 3, function (r) { return r.profile === 'rurale' || r.profile === 'industrielle'; }, 2)
          .forEach(function (rid) { t.push('+' + addCubes(g, rid, pid, spec(g, pid, 2)) + ' ' + REG[rid].name); }); break;
    }
    return t;
  }

  /* plans : { pid: [act, act, act] } — résolution en alternance, le premier joueur tourne. */
  function resolveActions(g, plans) {
    var order = turnOrder(g);
    var log = [];
    for (var s = 0; s < R.actionsPerTurn; s++) {
      order.forEach(function (pid) {
        var act = (plans[pid] || [])[s];
        if (act && s < actionsFor(g, pid)) log.push(resolveOne(g, pid, act));
      });
    }
    g.phase = isDebateTurn(g) ? 'debate' : 'spotlight';
    return log;
  }

  /* ---------- Débat ---------- */
  function isDebateTurn(g) { return R.debateTurns.indexOf(g.turn) >= 0; }
  /* v0.6 : le débat en face-à-face. setupDebate prépare les 6 duels (chacun contre chacun, un thème par duel). */
  /* v1.6 : quel que soit le nombre de partis, chacun affronte au plus 3 adversaires (méthode du tournoi « tous contre tous »,
     arrêtée après 3 rondes). À 4 partis, cela fait les 6 duels habituels ; à 6, 9 duels au lieu de 15. */
  function setupDebate(g) {
    var ids = shuffle(pids(g), g.rng), duels = [];
    if (ids.length % 2) ids.push(null);   // nombre impair : un parti se repose à chaque ronde
    var n = ids.length, rounds = Math.min(R.debateDuels, n - 1);
    for (var r = 0; r < rounds; r++) {
      for (var i = 0; i < n / 2; i++) {
        var a = ids[i], b = ids[n - 1 - i];
        if (!a || !b) continue;
        var th = g.rng() < 0.5 && g.hot && g.hot.length ? g.hot[0] : D.THEMES[Math.floor(g.rng() * D.THEMES.length)].id;
        duels.push({ a: a, b: b, theme: th, qid: pickQuestion(g, th, duels.length + 31).id });   // v4.0 : une vraie question par duel
      }
      ids.splice(1, 0, ids.pop());   // rotation : le premier reste en place, les autres tournent
    }
    g.debate = { duels: duels };
    return g.debate;
  }
  /* Points d'une réplique : 2 si elle bat celle d'en face, 1 si nul, 0 si battue, + bonus */
  function replyPoints(g, me, mine, opp, theirs, theme) {
    var R2 = D.REPLIES, pts, notes = [];
    var mineRaw = mine; mine = mine === 'disque' ? 'emotion' : mine; theirs = theirs === 'disque' ? 'emotion' : theirs;
    if (mine === 'esquive' || theirs === 'esquive' || mine === theirs) pts = 1;
    else pts = R2[mine].beats === theirs ? 2 : 0;
    if (mine === 'attaque' && player(g, opp).cas > 0) { pts += 1; notes.push('ressort ses casseroles'); }
    if (mine === 'chiffres') {
      var c = cred(g, me, theme);
      if (c === 2) { pts += 1; notes.push('maîtrise le sujet'); }
      if (c === 0) { pts -= 1; notes.push('s’emmêle dans les chiffres'); }
    }
    if (mine === 'emotion' && isHot(g, theme) && mineRaw !== 'disque') { pts += 1; notes.push('le sujet brûlant touche'); }
    if (mineRaw === 'disque') notes.push('« comme je le disais déjà en 2017, en 2022 et en 2027… »');
    return { pts: Math.max(0, pts), notes: notes };
  }
  function duelResult(g, d, ra, rb) {
    var x = replyPoints(g, d.a, ra, d.b, rb, d.theme), y = replyPoints(g, d.b, rb, d.a, ra, d.theme);
    return { a: d.a, b: d.b, theme: d.theme, ra: ra, rb: rb, pa: x.pts, pb: y.pts, na: x.notes, nb: y.notes };
  }
  /* ---------- v4.0 : le débat télévisé, refait ----------
     Chaque duel : une vraie question, les cartes de réponse de chacun (comme une interview), puis les contres.
     Les points = l'audience gagnée (pondérée par le poids de chaque classe dans le pays). L'audience gagnée compte
     vraiment : elle s'ajoute à celle de la campagne, dans toutes les régions. */
  function lowerFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function debateCards(g, pid, qid) {
    var iv = interview(g, pid, qid, 'debat');
    if (pid === 'FI' && g.bingo) {
      var e0 = iv.cards[0];
      iv.cards.push(Object.assign({}, e0, { key: 'disque', name: D.ANSWERS.disque.name, icon: D.ANSWERS.disque.icon,
        quote: 'Comme je le disais déjà en 2017, en 2022 et en 2027 : ' + lowerFirst(e0.quote), notes: ['coche 2 mots du bingo'] }));
    }
    return iv;
  }
  function cardIn(iv, key) {
    var m = { chiffres: ['mesure', 'bilan', 'promesse'], esquive: ['recentrer'], disque: ['disque', 'emotion'] }[key] || [key];   // anciens noms de répliques
    for (var i = 0; i < m.length; i++) { var c = iv.cards.filter(function (x) { return x.key === m[i]; })[0]; if (c) return c; }
    return iv.cards[0];
  }
  function debateCounter(ka, kb) {
    var ra = D.DEB_REG[ka], rb = D.DEB_REG[kb];
    if (D.DEB_BEATS[ra + '>' + rb]) return { winner: 'a', line: D.DEB_BEATS[ra + '>' + rb] };
    if (D.DEB_BEATS[rb + '>' + ra]) return { winner: 'b', line: D.DEB_BEATS[rb + '>' + ra] };
    return { winner: null, line: '' };
  }
  function scaleGains(gains, f) { var o = {}; SEG.forEach(function (s) { o[s] = Math.round((gains[s] || 0) * f * 10) / 10; }); return o; }
  function audScore(gains) { var s = 0; SEG.forEach(function (k) { s += NATSEGW[k] * (gains[k] || 0); }); return Math.round(s * 100) / 10; }
  /* Le résultat d'un duel (sans rien appliquer) */
  function duelOutcome(g, d, ka, kb, prepA, prepB) {
    var ca = cardIn(debateCards(g, d.a, d.qid), ka), cb = cardIn(debateCards(g, d.b, d.qid), kb), ct = debateCounter(ca.key, cb.key), DB = D.DEBATE;
    var fa = (1 + DB.prep * (prepA || 0)) * (ct.winner === 'a' ? DB.win : ct.winner === 'b' ? DB.lose : 1);
    var fb = (1 + DB.prep * (prepB || 0)) * (ct.winner === 'b' ? DB.win : ct.winner === 'a' ? DB.lose : 1);
    var ga = scaleGains(ca.gains, fa), gb = scaleGains(cb.gains, fb), sa = audScore(ga), sb = audScore(gb);
    return { a: d.a, b: d.b, qid: d.qid, theme: d.theme, ka: ca.key, kb: cb.key, ca: ca, cb: cb, ga: ga, gb: gb, sa: sa, sb: sb,
             beat: ct.winner, line: ct.line, winner: sa > sb ? d.a : sb > sa ? d.b : null };
  }
  /* prep : { pid: ★ dépensées } · picks : pour chaque duel { ra, rb } (les clés des cartes choisies) */
  function resolveDebate(g, prep, picks) {
    var tot = {}, prepSpent = {}, duels = [], bingoDeb = null;
    g.players.forEach(function (p) {
      var b = Math.max(0, Math.min(p.infl, R.debatePrepMax, Math.floor((prep || {})[p.id] || 0)));
      p.infl -= b; prepSpent[p.id] = b; tot[p.id] = 0;
    });
    g.debate.duels.forEach(function (d, i) {
      var o = duelOutcome(g, d, picks[i].ra, picks[i].rb, prepSpent[d.a], prepSpent[d.b]);
      var xa = applyInterview(g, d.a, { gains: o.ga, risk: o.ca.risk }), xb = applyInterview(g, d.b, { gains: o.gb, risk: o.cb.risk });
      o.casA = xa.cas; o.casB = xb.cas;
      tot[d.a] += o.sa; tot[d.b] += o.sb; duels.push(o);
      if (g.bingo && ((d.a === 'FI' && o.ka === 'disque') || (d.b === 'FI' && o.kb === 'disque'))) bingoDeb = tickBingo(g, d.theme, 2) || bingoDeb;
    });
    var list = g.players.map(function (p) { return { pid: p.id, score: Math.round(tot[p.id] * 10) / 10, prep: prepSpent[p.id] }; })
      .sort(function (a, b) { return b.score - a.score; });
    var mult = g.turn === R.maxTurns ? 2 : 1;
    var res = { ranking: list, duels: duels, rewards: [], grand: mult === 2, bingo: bingoDeb };
    function reward(pid, k) {
      var gains = {}; SEG.forEach(function (s) { gains[s] = D.DEBATE.winBonus * k * mult; });
      addAudience(g, pid, gains); res.rewards.push({ pid: pid, bonus: D.DEBATE.winBonus * k * mult });
    }
    var top = list[0].score, firsts = list.filter(function (x) { return x.score === top; });
    if (firsts.length === 1) {
      player(g, firsts[0].pid).debateWins += 1; res.winner = firsts[0].pid; reward(firsts[0].pid, 1);
      var second = list[1].score;
      list.filter(function (x) { return x.score === second; }).forEach(function (x) { reward(x.pid, 0.5); });
    } else firsts.forEach(function (x) { reward(x.pid, 0.5); });
    g.debate = null;
    updateAllControl(g);
    g.phase = 'spotlight';
    return res;
  }
  /* Le choix de l'ordinateur en débat : son tempérament, pondéré par ce que chaque réponse rapporte */
  function debateWeights(g, pid, d) {
    var iv = debateCards(g, pid, d.qid), tw = (D.TEMPERS[pid] || { w: {} }).w, opp = d.a === pid ? d.b : d.a, out = [], sum = 0;
    iv.cards.forEach(function (c) {
      if (c.key === 'disque') return;   // le disque rayé remplace l'émotion (voir plus bas)
      var reg = D.DEB_REG[c.key], base = (tw[reg === 'promesse' ? 'chiffres' : reg] || 1) * (reg === 'promesse' ? 0.6 : 1);
      if (reg === 'attaque' && player(g, opp) && player(g, opp).cas > 0) base *= 1.5;
      var w = base * (0.4 + Math.max(0, quickGain(g, pid, c.gains) * 100));
      out.push({ key: c.key, w: w }); sum += w;
    });
    out.forEach(function (x) { x.p = sum ? x.w / sum : 0; });
    return out.sort(function (a, b) { return b.p - a.p; });
  }
  function aiDebatePick(g, pid, d) {
    var ws = debateWeights(g, pid, d), r = g.rng(), k = ws[ws.length - 1].key;
    for (var i = 0; i < ws.length; i++) { r -= ws[i].p; if (r <= 0) { k = ws[i].key; break; } }
    if (pid === 'FI' && k === 'emotion' && !isHot(g, d.theme) && g.bingo && g.rng() < 0.6) k = 'disque';
    return k;
  }
  /* ---------- v4.0 : le face-à-face d'entre-deux-tours ---------- */
  function setupFace(g) {
    var b = g.between, ths = [];
    function add(t) { if (t && ths.indexOf(t) < 0) ths.push(t); }
    add((g.hot || [])[0]); add(bestTheme(g, b.a, null)); add(bestTheme(g, b.b, null));
    D.THEMES.forEach(function (t) { if (ths.length < 3) add(t.id); });
    b.face = { duels: ths.slice(0, 3).map(function (t, i) { return { a: b.a, b: b.b, theme: t, qid: pickQuestion(g, t, 50 + i).id }; }) };
    return b.face;
  }
  /* picks : [{ ra, rb }] · le perdant cède une part de ses voix au gagnant au second tour */
  function resolveFace(g, picks) {
    var b = g.between; if (!b.face) setupFace(g);
    var SA = 0, SB = 0, duels = b.face.duels.map(function (d, i) {
      var o = duelOutcome(g, d, picks[i].ra, picks[i].rb, 0, 0);
      if (o.ca.risk && g.rng() < o.ca.risk) { player(g, d.a).cas += 1; o.casA = true; }
      if (o.cb.risk && g.rng() < o.cb.risk) { player(g, d.b).cas += 1; o.casB = true; }
      SA += o.sa; SB += o.sb; return o;
    });
    var margin = (SA + SB) > 0 ? (SA - SB) / (SA + SB) : 0;
    var swing = Math.max(-D.DEBATE.faceMax, Math.min(D.DEBATE.faceMax, margin * D.DEBATE.faceSwing));
    b.debate = { duels: duels, sa: Math.round(SA * 10) / 10, sb: Math.round(SB * 10) / 10, swing: swing, winner: swing > 0 ? b.a : swing < 0 ? b.b : null };
    b.log.push({ type: 'face', text: b.debate.winner ? PARTY[b.debate.winner].short + ' remporte le grand débat (' + (100 * Math.abs(swing)).toFixed(1).replace('.', ',') + ' % des voix basculent).' : 'Match nul au grand débat.' });
    return b.debate;
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
    g.lastClass = classPoll(g);   // v3.8 : pour la tendance par classe sociale
    // v0.4 : dynamique = le sondage a monté (ou baissé) de plus de 1,5 point ce tour
    var now = pollMap(g);
    g.players.forEach(function (pl) {
      var d = now[pl.id] - (g.lastPoll[pl.id] || 0);
      pl.momentum = d >= R.momentumStep ? 1 : d <= -R.momentumStep ? -1 : 0;
    });
    g.lastPoll = now;
    if (g.turn < R.maxTurns) {   // v3.8 : l'effet des médias s'use d'un tour à l'autre
      wearAudience(g); var nw = pollMap(g); g.lastWear = {};
      g.players.forEach(function (pl) { g.lastWear[pl.id] = (nw[pl.id] || 0) - (now[pl.id] || 0); });
      g.lastPoll = nw;
    }
    g.phase = 'next';
    if (g.turn >= R.maxTurns) {
      // v1.6 : le 1er tour est voté et figé. Majorité absolue : c'est fini. Sinon : l'entre-deux-tours commence.
      var r1 = firstRound(g);
      g.round1 = r1;
      if (r1.direct) { g.over = true; g.result = { first: r1.first, stats1: r1.stats1, direct: true, second: null, winner: r1.first[0].pid }; g.winner = g.result.winner; g.phase = 'over'; }
      else { g.between = openBetween(g); g.phase = 'between'; res.between = true; }
    }
    res.winner = g.winner; res.over = g.over; res.result = g.result;
    return res;
  }

  /* ---------- Objectifs et score final ---------- */
  /* v1.5 : où en est un objectif ? done / need (ex. 2 régions rurales sur 3) */
  function objectiveProgress(g, pid, oid) {
    function ctrl(rid) { return g.regions[rid].controller === pid; }
    function count(prof) { return D.REGIONS.filter(function (r) { return r.profile === prof && ctrl(r.id); }).length; }
    function among(ids) { return ids.filter(ctrl).length; }
    switch (oid) {
      case 'ouest': return { done: among(['bre', 'pdl', 'nor']), need: 3 };
      case 'territoires': return { done: Math.min(3, count('rurale')), need: 3 };
      case 'industrie': return { done: among(['hdf', 'ges']), need: 2 };
      case 'patrimoine': return { done: Math.min(3, count('historique')), need: 3 };
      case 'paris': return { done: among(['idf']), need: 1 };
      case 'terrains': return { done: Object.keys(D.PROFILES).filter(function (pf) { return count(pf) >= 1; }).length, need: Object.keys(D.PROFILES).length };
      case 'debat': return { done: Math.min(2, player(g, pid).debateWins), need: 2 };
      case 'corse': return { done: among(['cor']), need: 1 };
    }
    return { done: 0, need: 1 };
  }
  function objectiveMet(g, pid, oid) { var p = objectiveProgress(g, pid, oid); return p.done >= p.need; }
  /* Part des suffrages exprimés ajoutée par un objectif réussi (≈ 2,8 % pour un bonus de 3, 3,7 % pour 4) */
  function objectiveShare(o) { return o.bonus * R.objectiveVotes / 65; }
  /* ---------- v1.6 : l'élection en deux temps ---------- */
  var R2 = R.round2;
  /* Premier tour : figé une fois pour toutes (résultats, deux qualifiés) */
  function firstRound(g) {
    var v = votes(g, true), first = percents(v), st = turnoutStats(g);
    return { first: first, stats1: st, autres: v._autres || 0, direct: first[0].pct > 0.5, finalists: [first[0].pid, first[1].pid] };
  }
  function openBetween(g) {
    var r1 = g.round1, b = { a: r1.finalists[0], b: r1.finalists[1], elim: r1.first.slice(2).map(function (x) { return x.pid; }),
      left: {}, deals: {}, consignes: {}, tried: {}, boost: {}, offers: [], counter: null, log: [], plan: {}, closed: false };
    [b.a, b.b].forEach(function (f) { b.left[f] = R2.actions; b.boost[f] = { mob: 0, ras: 0 }; player(g, f).deals = []; });
    // v3.6.1 : face à un joueur humain, l'ordinateur a une action de moins (un joueur habile peut faire basculer un duel serré)
    if (player(g, b.a).human !== player(g, b.b).human) [b.a, b.b].forEach(function (f) { if (!player(g, f).human) b.left[f] = R2.aiActions; });
    b.elim.forEach(function (e) { b.consignes[e] = null; });
    // chaque finaliste mené par l'ordinateur prépare ses actions maintenant, sans connaître les décisions à venir des autres
    [b.a, b.b].forEach(function (f) { if (!player(g, f).human) b.plan[f] = aiBetweenPlan(g, b, f); });
    return b;
  }
  function side(b, f) { return f === b.a ? 'A' : 'B'; }
  function votesOf(g, pid) { var x = g.round1.first.filter(function (y) { return y.pid === pid; })[0]; return x ? x.votes : 0; }
  /* Les concessions possibles : les mesures du programme du parti éliminé que le finaliste n'a pas encore (sa mesure phare d'abord) */
  function concessionsFor(g, f, e) {
    var pf = player(g, f), pe = player(g, e), have = (pf.programme || []).concat((pf.deals || []).map(function (d) { return d.measure; }));
    return (pe.programme || PARTY[e].programme).filter(function (m) { return have.indexOf(m) < 0; });
  }
  function dealChance(g, f, e, mid) {
    var b = g.between; if (!b || b.deals[e]) return 0;
    var pe = player(g, e), ch = R2.accept[dist(f, e)] || 0;
    if (mid === pe.phare) ch *= R2.phareBoost;
    if (f === 'MD' || e === 'MD') ch += 0.15;   // v1.7 : faiseur de rois
    if (f === 'RQ' || e === 'RQ') ch -= 0.15;   // v1.7 : repoussoir
    ch = Math.max(0, ch);
    ch *= Math.pow(R2.retry, b.tried[f + e] || 0);
    return Math.min(0.95, ch);
  }
  function makeDeal(g, f, e, mid) {
    var b = g.between;
    b.deals[e] = { with: f, measure: mid };
    b.consignes[e] = side(b, f);
    player(g, f).deals.push({ with: e, measure: mid });
    b.offers = b.offers.filter(function (o) { return o.to !== e; });
    b.log.push({ type: 'deal', f: f, e: e, measure: mid, text: PARTY[e].short + ' appelle à voter ' + PARTY[f].short + ', qui reprend « ' + MEAS[mid].name + ' ».' });
  }
  function betweenError(g, f, act) {
    var b = g.between;
    if (!b || b.closed) return 'L’entre-deux-tours est terminé.';
    if (f !== b.a && f !== b.b) return 'Seuls les deux finalistes agissent.';
    if (b.left[f] <= 0) return 'Plus d’action disponible.';
    if (act.type === 'negocier') {
      if (b.elim.indexOf(act.target) < 0) return 'Ce parti n’est pas éliminé.';
      if (b.deals[act.target]) return PARTY[act.target].short + ' a déjà conclu un accord avec ' + PARTY[b.deals[act.target].with].short + '.';
      if (b.offers.some(function (o) { return o.from === f && o.to === act.target; })) return 'Ton offre attend déjà sa réponse.';
      if (concessionsFor(g, f, act.target).indexOf(act.measure) < 0) return 'Cette concession n’est pas possible.';
    }
    if ((act.type === 'mobiliser' || act.type === 'rassembler') && b.boost[f][act.type === 'mobiliser' ? 'mob' : 'ras'] >= R2.maxUses) return 'Déjà fait deux fois.';
    return null;
  }
  /* Une action d'entre-deux-tours. Résultat : accept / counter / refuse / pending (le joueur éliminé répondra) / done */
  function betweenAct(g, f, act) {
    var b = g.between, err = betweenError(g, f, act);
    if (err) return { ok: false, text: err };
    b.left[f] -= 1;
    if (act.type === 'mobiliser') { b.boost[f].mob++; b.log.push({ type: 'mob', f: f, text: PARTY[f].short + ' part chercher les abstentionnistes.' }); return { ok: true, outcome: 'done' }; }
    if (act.type === 'rassembler') { b.boost[f].ras++; b.log.push({ type: 'ras', f: f, text: PARTY[f].short + ' lance un appel au rassemblement.' }); return { ok: true, outcome: 'done' }; }
    var e = act.target, pe = player(g, e);
    b.tried[f + e] = (b.tried[f + e] || 0);
    if (pe.human) {
      b.offers.push({ from: f, to: e, measure: act.measure });
      b.log.push({ type: 'offer', f: f, e: e, text: PARTY[f].short + ' te fait une offre.' });
      return { ok: true, outcome: 'pending' };
    }
    var ch = dealChance(g, f, e, act.measure);
    b.tried[f + e] += 1;
    if (g.rng() < ch) { makeDeal(g, f, e, act.measure); return { ok: true, outcome: 'accept', chance: ch }; }
    if (act.measure !== pe.phare && pe.phare && concessionsFor(g, f, e).indexOf(pe.phare) >= 0 && g.rng() < R2.counterChance) {
      b.counter = { f: f, e: e, measure: pe.phare };
      b.log.push({ type: 'counter', f: f, e: e, text: PARTY[e].short + ' demande plutôt « ' + MEAS[pe.phare].name + ' ».' });
      return { ok: true, outcome: 'counter', measure: pe.phare, chance: ch };
    }
    b.log.push({ type: 'refuse', f: f, e: e, text: PARTY[e].short + ' refuse l’offre de ' + PARTY[f].short + '.' });
    return { ok: true, outcome: 'refuse', chance: ch };
  }
  /* Le finaliste répond à une contre-offre (sans dépenser d'action) */
  function answerCounter(g, accept) {
    var b = g.between, c = b && b.counter; if (!c) return false;
    b.counter = null;
    if (accept && !b.deals[c.e]) { makeDeal(g, c.f, c.e, c.measure); return true; }
    b.log.push({ type: 'refuse', f: c.f, e: c.e, text: PARTY[c.f].short + ' refuse la contre-offre de ' + PARTY[c.e].short + '.' });
    return false;
  }
  /* Le joueur éliminé répond à une offre : accept / refuse / counter (il réclame sa mesure phare) */
  function answerBetweenOffer(g, f, decision) {
    var b = g.between, e = b.offers.filter(function (o) { return o.from === f; })[0];
    if (!e) return { ok: false };
    var pid = e.to, pe = player(g, pid);
    if (decision === 'accept') { makeDeal(g, f, pid, e.measure); return { ok: true, outcome: 'accept' }; }
    b.offers = b.offers.filter(function (o) { return o !== e; });
    if (decision === 'counter' && pe.phare && pe.phare !== e.measure && concessionsFor(g, f, pid).indexOf(pe.phare) >= 0) {
      // le finaliste (ordinateur) accepte si tes électeurs pèsent assez lourd pour lui
      var weight = votesOf(g, pid) / (votesOf(g, b.a) + votesOf(g, b.b));
      if (g.rng() < Math.min(0.9, 0.35 + 2 * weight)) { makeDeal(g, f, pid, pe.phare); return { ok: true, outcome: 'accept', measure: pe.phare }; }
      b.log.push({ type: 'refuse', f: f, e: pid, text: PARTY[f].short + ' refuse ta contre-offre.' });
      return { ok: true, outcome: 'refuse' };
    }
    b.log.push({ type: 'refuse', f: pid, e: f, text: 'Tu refuses l’offre de ' + PARTY[f].short + '.' });
    return { ok: true, outcome: 'refuse' };
  }
  /* Consigne de vote d'un parti éliminé : 'A', 'B' ou 'none'. Un accord fixe la consigne. */
  function setConsigne(g, e, c) {
    var b = g.between; if (!b || b.deals[e] || b.elim.indexOf(e) < 0) return false;
    b.consignes[e] = c; return true;
  }
  function aiConsigne(g, b, e) {
    if (b.deals[e]) return side(b, b.deals[e].with);
    var dA = dist(e, b.a), dB = dist(e, b.b);
    if (Math.min(dA, dB) >= 3 || dA === dB) return 'none';
    return dA < dB ? 'A' : 'B';
  }
  /* Ce que vaut un accord avec e pour le finaliste f (en voix), pour l'ordinateur */
  function dealValue(g, b, f, e) {
    var d = dist(f, e), now = aiConsigne(g, b, e), mine = side(b, f);
    var gain = (now === mine ? 0 : R2.endorse[d] || 0) + R2.dealBonus - (d >= 3 ? R2.farDealLoss * votesOf(g, f) / Math.max(1e-9, votesOf(g, e)) : 0);
    return votesOf(g, e) * gain;
  }
  function aiBetweenPlan(g, b, f) {
    var targets = b.elim.map(function (e) {
      var pe = player(g, e), mid = concessionsFor(g, f, e)[0];
      return { e: e, mid: mid, score: mid ? dealValue(g, b, f, e) * (R2.accept[dist(f, e)] || 0) : -1 };
    }).filter(function (t) { return t.score > 0; }).sort(function (x, y) { return y.score - x.score; });
    var plan = targets.slice(0, 2).map(function (t) { return { type: 'negocier', target: t.e, measure: t.mid }; });
    while (plan.length < R2.actions) plan.push({ type: plan.length % 2 ? 'mobiliser' : 'rassembler' });
    return plan;
  }
  /* L'ordinateur joue la prochaine action de son plan (en s'adaptant si la cible n'est plus libre) */
  function aiBetweenStep(g, f) {
    var b = g.between; if (!b || b.left[f] <= 0) return null;
    var plan = b.plan[f] || (b.plan[f] = aiBetweenPlan(g, b, f)), act = plan.shift();
    if (act && act.type === 'negocier') {
      var mid = concessionsFor(g, f, act.target).filter(function (m) { return m === player(g, act.target).phare; })[0] || concessionsFor(g, f, act.target)[0];
      act = mid ? { type: 'negocier', target: act.target, measure: mid } : null;
    }
    if (!act || betweenError(g, f, act)) act = betweenError(g, f, { type: 'mobiliser' }) ? { type: 'rassembler' } : { type: 'mobiliser' };
    if (betweenError(g, f, act)) { b.left[f] = 0; return null; }
    var r = betweenAct(g, f, act);
    if (r.outcome === 'counter') answerCounter(g, true);
    return r;
  }
  /* Les reports d'un parti éliminé vers les deux finalistes, et pourquoi. expected : estimation (consignes pas encore données) */
  function transfersFor(g, e, expected) {
    var b = g.between, A = b.a, B = b.b, dA = dist(e, A), dB = dist(e, B), why = [];
    var ra = baseTransfer(e, A), rb = baseTransfer(e, B);
    why.push('proximité : ' + Math.round(100 * ra) + ' % vers ' + PARTY[A].short + ', ' + Math.round(100 * rb) + ' % vers ' + PARTY[B].short);
    var c = b.consignes[e] || (expected ? (player(g, e).human ? 'none' : aiConsigne(g, b, e)) : 'none'), deal = b.deals[e] || null;
    if (c === 'A' || c === 'B') {
      // v3.6.1 : sans accord, la consigne est donnée « du bout des lèvres » (moitié moins suivie) ; un accord la rend franche
      var to = c === 'A' ? A : B, plus = (R2.endorse[dist(e, to)] || 0) * (deal ? 1 : R2.lukewarm);
      if (c === 'A') { ra += plus; rb = Math.max(0, rb - plus / 2); } else { rb += plus; ra = Math.max(0, ra - plus / 2); }
      why.push((deal ? 'consigne franche' : 'consigne du bout des lèvres') + ' : voter ' + PARTY[to].short + ' (+' + Math.round(100 * plus) + ' pts)');
      if (deal) { if (c === 'A') ra += R2.dealBonus; else rb += R2.dealBonus; why.push('accord avec concession (+' + Math.round(100 * R2.dealBonus) + ' pts)'); }
    } else { ra *= R2.noneFactor; rb *= R2.noneFactor; why.push('ne soutient personne (reports ×' + String(R2.noneFactor).replace('.', ',') + ')'); }
    // v3.6 : le front républicain, non systématique (voir D.RULES.round2.reject)
    var rj = R2.reject || {}, gap = (rj[B] || 0.3) - (rj[A] || 0.3);
    if (Math.abs(gap) >= 0.05) {
      var foe = gap > 0 ? B : A, shift = R2.barrage * Math.abs(gap);
      if (dist(e, foe) >= 2) {
        if (gap > 0) { ra += shift; rb = Math.max(0, rb - shift / 2); } else { rb += shift; ra = Math.max(0, ra - shift / 2); }
        why.push('barrage contre ' + PARTY[foe].short + ' (+' + Math.round(100 * shift) + ' pts vers ' + PARTY[gap > 0 ? A : B].short + ')');
      }
    }
    if (b.boost[A].ras) { ra += R2.rassemble * b.boost[A].ras; why.push('appel au rassemblement de ' + PARTY[A].short); }
    if (b.boost[B].ras) { rb += R2.rassemble * b.boost[B].ras; why.push('appel au rassemblement de ' + PARTY[B].short); }
    if (ra + rb > R2.maxTransfer) { var k = R2.maxTransfer / (ra + rb); ra *= k; rb *= k; }
    var rest = 1 - ra - rb, blank = rest * R.blankOfNonTransfer;
    return { pid: e, toA: ra, toB: rb, blank: blank, abst: rest - blank, consigne: c, deal: deal, why: why };
  }
  /* Le calcul du second tour (expected = estimation sans rien modifier) */
  function secondCalc(g, expected) {
    var b = g.between, r1 = g.round1, st = r1.stats1, A = b.a, B = b.b;
    var T1 = r1.first.reduce(function (s, x) { return s + x.votes; }, r1.autres);
    var va = votesOf(g, A), vb = votesOf(g, B), blankV = 0, abstV = 0, notes = [];
    // accords lointains : une partie de ses propres électeurs n'apprécie pas
    [A, B].forEach(function (f) {
      var far = (player(g, f).deals || []).filter(function (d) { return dist(f, d.with) >= 3; }).length;
      if (!far) return;
      var lost = votesOf(g, f) * R2.farDealLoss * far;
      if (f === A) va -= lost; else vb -= lost;
      abstV += lost; notes.push({ pid: f, text: Math.round(100 * R2.farDealLoss * far) + ' % de ses électeurs n’ont pas aimé ses accords avec des partis éloignés' });
    });
    var mobA = b.boost[A].mob * R2.mobilize * T1, mobB = b.boost[B].mob * R2.mobilize * T1;
    va += mobA; vb += mobB;
    // v4.0 : le grand débat d'entre-deux-tours déplace des voix du perdant vers le gagnant
    if (b.debate && b.debate.swing) {
      var sw = Math.abs(b.debate.swing) * T1;
      if (b.debate.swing > 0) { sw = Math.min(sw, vb * 0.5); va += sw; vb -= sw; } else { sw = Math.min(sw, va * 0.5); vb += sw; va -= sw; }
      notes.push({ pid: b.debate.winner, text: 'a remporté le grand débat : ' + (100 * Math.abs(b.debate.swing)).toFixed(1).replace('.', ',') + ' % des électeurs ont changé d’avis' });
    }
    var transfers = b.elim.map(function (e) {
      var t = transfersFor(g, e, expected), ve = votesOf(g, e);
      va += ve * t.toA; vb += ve * t.toB; blankV += ve * t.blank; abstV += ve * t.abst;
      t.pct = ve / T1;
      return t;
    });
    var othersTransfer = null;
    if (r1.autres > 0) {
      var sa = votesOf(g, A) / (votesOf(g, A) + votesOf(g, B)), ta = R.othersTransfer * sa, tb = R.othersTransfer * (1 - sa), rest = 1 - ta - tb;
      va += r1.autres * ta; vb += r1.autres * tb; blankV += r1.autres * rest * R.blankOfNonTransfer; abstV += r1.autres * rest * (1 - R.blankOfNonTransfer);
      othersTransfer = { toA: ta, toB: tb, blank: rest * R.blankOfNonTransfer, abst: rest * (1 - R.blankOfNonTransfer), abstTotal: rest, pct: r1.autres / T1 };
    }
    var scale = st.exprimes / T1, tot = va + vb;
    var votants2 = st.votants - abstV * scale + (mobA + mobB) * scale, blancs2 = st.blancs + blankV * scale;
    var stats = { ins: st.ins, votants: votants2, blancs: blancs2, exprimes: votants2 - blancs2, participation: votants2 / st.ins, abstention: 1 - votants2 / st.ins, blankPct: blancs2 / votants2 };
    return { a: A, b: B, pctA: va / tot, pctB: vb / tot, transfers: transfers, othersTransfer: othersTransfer, stats: stats,
             mob: { a: b.boost[A].mob, b: b.boost[B].mob }, notes: notes, expected: !!expected };
  }
  function projectSecond(g) { return secondCalc(g, true); }
  /* Clôture : l'ordinateur termine ses actions, les éliminés donnent leur consigne, puis on vote */
  function closeBetween(g) {
    var b = g.between; if (!b || b.closed) return g.result;
    for (var k = 0; k < R2.actions * 2; k++) [b.a, b.b].forEach(function (f) { if (!player(g, f).human) aiBetweenStep(g, f); });
    b.offers = []; b.counter = null;
    b.elim.forEach(function (e) { if (!b.consignes[e]) b.consignes[e] = player(g, e).human ? 'none' : aiConsigne(g, b, e); });
    if (!b.debate) { var fc = b.face || setupFace(g); resolveFace(g, fc.duels.map(function (d) { return { ra: aiDebatePick(g, d.a, d), rb: aiDebatePick(g, d.b, d) }; })); }   // v4.0
    b.closed = true;
    var r1 = g.round1, second = secondCalc(g, false);
    g.result = { first: r1.first, stats1: r1.stats1, direct: false, second: second, othersTransfer: second.othersTransfer, deals: b.deals, winner: second.pctA >= second.pctB ? b.a : b.b };
    g.winner = g.result.winner; g.over = true; g.phase = 'over';
    return g.result;
  }
  /* Pour les simulations : tout le monde est mené par l'ordinateur */
  function autoBetween(g) {
    var b = g.between;
    for (var k = 0; k < R2.actions; k++) [b.a, b.b].forEach(function (f) { aiBetweenStep(g, f); });
    return closeBetween(g);
  }
  /* Ancienne fonction (tests) : 1er tour seul, ou élection complète sans joueur */
  function election(g) {
    var r1 = firstRound(g);
    return { first: r1.first, stats1: r1.stats1, direct: r1.direct, finalists: r1.finalists };
  }
  function transferRate(g, from, to) { return baseTransfer(from, to); }
  /* v3.6.4 : report spontané d'un parti éliminé vers un finaliste, selon la distance,
     avec le « cordon » : la gauche et le centre reportent très peu sur l'extrême droite (2022 : 17 % des électeurs
     de Mélenchon vers Le Pen, moins de 10 % pour ceux de Jadot, Roussel ou Hidalgo). */
  function baseTransfer(from, to) {
    var r = R.transfer[dist(from, to)] || 0, c = R.cordon;
    if (c && c.parties.indexOf(to) >= 0 && c.parties.indexOf(from) < 0 && PARTY[from].pos < c.below) r *= c.factor;
    // v3.6.7 : union des blocs (gauche entre elle, droite entre elle) et cordon autour de la gauche radicale pour la droite
    var B = R.blocs, pf = PARTY[from].pos, pt = PARTY[to].pos;
    if (B) {
      if (pf <= B.leftMax && pt <= B.leftMax) r = Math.max(r, B.left);
      if (pf >= B.rightMin && pt >= B.rightMin) r = Math.max(r, B.right);
      if (pf >= B.rightMin && pt <= B.farLeft) r *= B.farLeftFactor;
    }
    return r;
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
    createGame: createGame, startTurn: startTurn, resolveActions: resolveActions, resolveDebate: resolveDebate, setupDebate: setupDebate, debateCards: debateCards, duelOutcome: duelOutcome, debateCounter: debateCounter, aiDebatePick: aiDebatePick, debateWeights: debateWeights, setupFace: setupFace, resolveFace: resolveFace, audScore: audScore, duelResult: duelResult, replyPoints: replyPoints,
    isDebateTurn: isDebateTurn, spotlightTarget: spotlightTarget, applySpotlight: applySpotlight, endTurn: endTurn,
    finalScores: finalScores, firstRound: firstRound, openBetween: openBetween, betweenAct: betweenAct, betweenError: betweenError, answerCounter: answerCounter, answerBetweenOffer: answerBetweenOffer, setConsigne: setConsigne, concessionsFor: concessionsFor, dealChance: dealChance, aiBetweenStep: aiBetweenStep, aiConsigne: aiConsigne, transfersFor: transfersFor, projectSecond: projectSecond, closeBetween: closeBetween, autoBetween: autoBetween, objectiveMet: objectiveMet, objectiveProgress: objectiveProgress, objectiveShare: objectiveShare, terrainBreakdown: terrainBreakdown, turnOrder: turnOrder, election: election, poll: poll, votes: votes,
    dist: dist, fundsGain: fundsGain, allyOf: allyOf, allianceError: allianceError, answerOffer: answerOffer, acceptChance: acceptChance,
    poachTarget: poachTarget, transferRate: transferRate,
    actionCost: actionCost, checkAction: checkAction, mediaRegions: mediaRegions, gain: gain, bestRegions: bestRegions,
    controlledPoints: controlledPoints, controlledRegions: controlledRegions, totalCubes: totalCubes, ranking: ranking,
    leader: leader, cubes: cubes, minControl: minControl, player: player, rivalIn: rivalIn, strongestRegion: strongestRegion,
    regionVoters: regionVoters, othersShare: othersShare, baseScore: baseScore, turnoutStats: turnoutStats, mobilizeGain: mobilizeGain, lowTurnoutFit: lowTurnoutFit,
    NATPOP: NATPOP, setProgramme: setProgramme, segmentAppeal: segmentAppeal, echoOf: echoOf, echo: echo, echoBonus: echoBonus, echoRanks: echoRanks, programmeCred: programmeCred, programmeCost: programmeCost, measure: measure, MEAS: MEAS,
    resolveAffair: resolveAffair, enqueteChance: enqueteChance, affairDef: affairDef,
    resolveDilemma: resolveDilemma, dilemmaDef: dilemmaDef, applyFx: applyFx, markerAt: markerAt, hotHere: hotHere, crisisAct: crisisAct,
    impact: impact, cred: cred, isHot: isHot, concerns: concerns, bestTheme: bestTheme, terrainCubes: terrainCubes, mediaCubes: mediaCubes,
    makeDeal: makeDeal, weight: weight, strength: strength, controlShares: controlShares, regionVote: regionVote, regionLean: regionLean, natLean: natLean, regionShares: regionShares,
    traitOf: traitOf, nostalgiaPreview: nostalgiaPreview, petalsCount: petalsCount, lostPetals: lostPetals, jammed: jammed, zapped: zapped, isHidden: isHidden, retireeRegion: retireeRegion, resolvePrimaire: resolvePrimaire, actionsFor: actionsFor, centrists: centrists, tickBingo: tickBingo, ensureTraits: ensureTraits,
    classPoll: classPoll, addAudience: addAudience, previewGain: previewGain, quickGain: quickGain, interview: interview, applyInterview: applyInterview, aiAnswer: aiAnswer, pickQuestion: pickQuestion, stationFit: stationFit, stationBoost: stationBoost, vingtError: vingtError, matinaleError: matinaleError, stageRisk: stageRisk, isMajority: isMajority, audOf: audOf, SEG: SEG,
    applyMode: applyMode, spec: spec,
    REG: REG, PARTY: PARTY, sigle: sigle, THEME: THEME, makeRng: makeRng, setFormat: setFormat, saveGame: saveGame, loadGame: loadGame, registerParty: registerParty, unregisterParty: unregisterParty
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.PolitikEngine = API;
})(this);

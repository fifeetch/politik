/* Politik — v0.9 : gouverner le pays (le quinquennat, en 5 années).
   Moteur sans affichage : tout l'état est dans un objet « gv ».
   Ordres de grandeur réels : déficit public de 5,1 % du PIB en 2025 (Insee), dette proche de 118 % du PIB en 2026,
   objectif européen de revenir sous 3 % (Cour des comptes, juin 2026). 1 point de PIB ≈ 30 milliards d'euros. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var E = node ? require('./engine.js') : root.PolitikEngine;

  var C = {
    years: 5, seats: 577, majority: 289,
    deficit0: 5.0, debt0: 118, mdPerPoint: 30,
    debtDrift: 3.0,            // la croissance du PIB « allège » la dette d'environ 3 points par an
    interest: 0.02,            // chaque point de dette au-delà de 118 % alourdit le déficit de 0,02 point (les intérêts)
    growth: 0.25,              // la croissance réduit un peu le déficit chaque année
    marketPenalty: 4,          // déficit bien au-dessus de la trajectoire : les taux grimpent, la popularité baisse
    target: function (year) { return Math.max(3, 5.0 - 0.45 * year); },   // trajectoire vers 3 %
    amendFactor: 0.5,          // une mesure amendée garde la moitié de ses effets
    satPerFan: 7,              // un groupe qui aime une mesure adoptée : +7 de satisfaction par point
    honeymoon: 6               // l'état de grâce de la première année
  };

  /* ---------- Les cartes budgétaires de Bercy (l'automne) ---------- */
  var BUDGET_CARDS = [
    { id: 'point', title: 'Le point d\'indice', text: 'Les syndicats de fonctionnaires réclament une hausse des salaires.', opts: [
      { label: 'Augmenter de 1,5 %', def: 0.12, sat: { pi: 7 } }, { label: 'Geler', def: -0.15, sat: { pi: -7 } }] },
    { id: 'pensions', title: 'Les pensions de retraite', text: 'L\'inflation a rogné les pensions. Faut-il les revaloriser entièrement ?', opts: [
      { label: 'Revaloriser comme l\'inflation', def: 0.05, sat: { ret: 3 } }, { label: 'Revaloriser un peu moins', def: -0.25, sat: { ret: -8 } }] },
    { id: 'collectivites', title: 'Les communes et départements', text: 'Les maires réclament plus de dotations pour leurs écoles et leurs routes.', opts: [
      { label: 'Augmenter les dotations', def: 0.08, sat: { ind: 3, ret: 2 } }, { label: 'Leur demander des économies', def: -0.2, sat: { pop: -3, ret: -2 } }] },
    { id: 'defense', title: 'La défense', text: 'Le contexte international pousse à investir dans l\'armée.', opts: [
      { label: 'Effort exceptionnel', def: 0.1, sat: { ret: 3, cad: 2 } }, { label: 'Étaler l\'effort', def: -0.05, sat: { ret: -2 } }] },
    { id: 'niche_emploi', title: 'Le crédit d\'impôt pour l\'emploi à domicile', text: 'Une niche fiscale coûteuse, très utilisée par les ménages aisés et les retraités.', opts: [
      { label: 'La raboter', def: -0.15, sat: { cad: -5, ret: -3 } }, { label: 'La garder', def: 0, sat: {} }] },
    { id: 'pompe', title: 'Le prix à la pompe', text: 'Le carburant flambe. Les automobilistes des campagnes n\'en peuvent plus.', opts: [
      { label: 'Remise à la pompe', def: 0.15, sat: { pop: 4, ind: 3 } }, { label: 'Refuser', def: 0, sat: { pop: -5, ind: -3 } }] },
    { id: 'hopital', title: 'L\'hôpital', text: 'Les urgences ferment la nuit faute de personnel.', opts: [
      { label: 'Plan d\'urgence', def: 0.1, sat: { ret: 4, pi: 4 } }, { label: 'Réorganiser à budget constant', def: 0, sat: { pi: -5, ret: -3 } }] },
    { id: 'renovation', title: 'Les aides à la rénovation', text: 'Les aides pour isoler les logements coûtent cher, mais font vivre les artisans.', opts: [
      { label: 'Les prolonger', def: 0.07, sat: { ind: 4 } }, { label: 'Les réduire', def: -0.12, sat: { ind: -4 } }] },
    { id: 'production', title: 'Les impôts de production', text: 'Les industriels demandent une baisse des impôts qui pèsent sur leurs usines.', opts: [
      { label: 'Les baisser', def: 0.15, sat: { ind: 5, cad: 3 } }, { label: 'Refuser', def: 0, sat: { ind: -2 } }] },
    { id: 'etudiants', title: 'Les étudiants', text: 'Des files d\'attente aux distributions alimentaires. Faut-il un repas à 1 € pour tous ?', opts: [
      { label: 'Oui, pour tous', def: 0.02, sat: { sae: 8 } }, { label: 'Seulement les boursiers', def: 0, sat: { sae: -3 } }] },
    { id: 'rachats', title: 'Les rachats d\'actions', text: 'Les grandes entreprises rachètent leurs propres actions. Les taxer ?', opts: [
      { label: 'Taxer', def: -0.12, sat: { cad: -4, pop: 2 } }, { label: 'Ne pas taxer', def: 0, sat: { pop: -2 } }] },
    { id: 'controleurs', title: 'Les contrôleurs des impôts', text: 'Recruter 1 500 contrôleurs pour lutter contre la fraude fiscale ?', opts: [
      { label: 'Recruter', def: -0.1, sat: { pop: 2 } }, { label: 'Pas maintenant', def: 0, sat: {} }] },
    { id: 'chomage', title: 'L\'assurance chômage', text: 'Bercy propose de réduire la durée d\'indemnisation.', opts: [
      { label: 'Réduire', def: -0.2, sat: { sae: -7, pop: -2 } }, { label: 'Ne rien changer', def: 0, sat: {} }] },
    { id: 'agriculture', title: 'Les agriculteurs', text: 'Les tracteurs bloquent les routes : ils dénoncent les normes et les prix trop bas.', opts: [
      { label: 'Plan d\'aide', def: 0.05, sat: { ind: 5 } }, { label: 'Tenir bon', def: 0, sat: { ind: -7 } }] }
  ];

  /* ---------- Les événements du quinquennat ---------- */
  var EVENTS = [
    { id: 'canicule', title: 'Été caniculaire', text: 'Sécheresse, incendies, coupures d\'eau : le pays suffoque.', opts: [
      { label: 'Plan d\'urgence climatique', def: 0.05, pop: 3, sat: { sae: 3 } }, { label: 'Laisser les préfets gérer', def: 0, pop: -4 }] },
    { id: 'marches', title: 'Les marchés s\'inquiètent', text: 'Les taux d\'intérêt de la dette française grimpent. Les agences de notation menacent.', opts: [
      { label: 'Plan d\'économies d\'urgence', def: -0.15, pop: -4, sat: { pi: -3, ret: -3 } }, { label: 'Rassurer sans rien changer', def: 0, debt: 2, pop: 0 }] },
    { id: 'ministre', title: 'L\'affaire du ministre', text: 'Un de tes ministres est accusé d\'avoir menti sur son patrimoine.', opts: [
      { label: 'Le limoger', pop: 2 }, { label: 'Le défendre', pop: -5, cas: true }] },
    { id: 'bleus', title: 'Les Bleus champions !', text: 'L\'équipe de France remporte la Coupe du monde. Le pays est en liesse.', opts: [
      { label: 'Recevoir l\'équipe à l\'Élysée', pop: 4 }] },
    { id: 'gilets', title: 'Colère des automobilistes', text: 'Des ronds-points occupés dans tout le pays contre le prix du carburant.', opts: [
      { label: 'Geler les taxes sur le carburant', def: 0.05, pop: 4, sat: { pop: 6 } }, { label: 'Fermeté', pop: -6, sat: { pop: -8, ind: -4 } }] },
    { id: 'tracteurs', title: 'Les tracteurs sur le périph', text: 'Les agriculteurs encerclent Paris.', opts: [
      { label: 'Négocier un plan', def: 0.03, sat: { ind: 7 } }, { label: 'Laisser passer l\'orage', sat: { ind: -8 }, pop: -2 }] },
    { id: 'cour', title: 'Le rapport de la Cour des comptes', text: 'La Cour des comptes juge ta trajectoire budgétaire « peu crédible ».', opts: [
      { label: 'Annoncer un tour de vis', def: -0.1, pop: -3 }, { label: 'Contester les chiffres', pop: -1, debt: 1 }] },
    { id: 'innovation', title: 'Une gigafactory s\'installe', text: 'Un industriel veut construire une usine géante de batteries… si l\'État aide.', opts: [
      { label: 'Subventionner', def: 0.03, sat: { pop: 5, pi: 2 } }, { label: 'Refuser', sat: { pop: -2 } }] }
  ];

  /* ---------- Création du quinquennat ---------- */
  function create(g, pid) {
    var pl = E.player(g, pid), ally = E.allyOf(g, pid);
    var res = g.result, pct = res.second ? (res.second.a === pid ? res.second.pctA : res.second.pctB) : res.first[0].pct;
    var ap = E.segmentAppeal(pl.programme.concat(pl.financing || []));
    var sat = {}; D.SEGMENTS.forEach(function (sg) { sat[sg.id] = clamp(45 + 5 * ap[sg.id], 15, 85); });
    var gv = {
      rng: g.rng, pid: pid, ally: ally, year: 1, over: false,
      deficit: C.deficit0, debt: C.debt0, sat: sat, popBonus: 0,
      elected: Math.round(pct * 1000) / 10,
      measures: pl.programme.map(function (id) { return { id: id, status: 'pending', amended: false }; }),
      financing: (pl.financing || []).slice(),
      seats: {}, used493: false, censures: 0, dissolved: false, fell: 0, log: [], history: [],
      cardsDeck: shuffle(BUDGET_CARDS.map(function (c) { return c.id; }), g.rng),
      eventsDeck: shuffle(EVENTS.map(function (e) { return e.id; }), g.rng),
      achievements: {}
    };
    gv.popBonus = Math.round((pct * 100 - popularity(gv)) * 0.6) + C.honeymoon;
    // les mesures de financement s'appliquent dès le premier budget
    gv.financing.forEach(function (id) { var m = E.measure(id); gv.deficit += m.cost / C.mdPerPoint; addSat(gv, m.fans, 1); });
    legislatives(gv, g);
    return gv;
  }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function shuffle(a, rng) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function addSat(gv, fans, k) { Object.keys(fans || {}).forEach(function (s) { gv.sat[s] = clamp(gv.sat[s] + fans[s] * (k == null ? C.satPerFan : k), 0, 100); }); }
  function natShare(sid) { return E.NATPOP[sid] / 100; }
  /* Popularité = satisfaction de chaque groupe, pondérée par son poids dans la population (Insee) */
  function popularity(gv) {
    var p = 0, w = 0;
    D.SEGMENTS.forEach(function (sg) { p += gv.sat[sg.id] * natShare(sg.id); w += natShare(sg.id); });
    return clamp(Math.round(p / w + (gv.popBonus || 0)), 3, 97);
  }

  /* ---------- Les législatives : 577 sièges, région par région ---------- */
  function legislatives(gv, g, popShift) {
    var ids = g.players.map(function (p) { return p.id; }), seats = {}, total = 0;
    ids.forEach(function (id) { seats[id] = 0; });
    var ptsSum = 0; D.REGIONS.forEach(function (r) { ptsSum += r.pts; });
    var alloc = [];
    D.REGIONS.forEach(function (r) {
      var n = Math.round(C.seats * r.pts / ptsSum), w = {}, s = 0;
      ids.forEach(function (id) {
        var c = E.cubes(g, r.id, id) + 0.5;
        if (id === gv.pid) c *= popShift ? popShift : 1.0;    // l'élan présidentiel (ou le désaveu)
        w[id] = Math.pow(c, 1.05); s += w[id];                   // le scrutin majoritaire amplifie le premier
      });
      ids.forEach(function (id) { var x = n * w[id] / s; seats[id] += Math.floor(x); alloc.push({ id: id, rest: x - Math.floor(x) }); });
      total += n;
    });
    var placed = 0; ids.forEach(function (id) { placed += seats[id]; });
    alloc.sort(function (a, b) { return b.rest - a.rest; });
    for (var i = 0; placed < C.seats; i++, placed++) seats[alloc[i % alloc.length].id]++;
    while (placed > C.seats) { var big = ids.slice().sort(function (a, b) { return seats[b] - seats[a]; })[0]; seats[big]--; placed--; }
    gv.seats = seats;
    return seats;
  }
  function blocSeats(gv) { return gv.seats[gv.pid] + (gv.ally ? gv.seats[gv.ally] || 0 : 0); }
  function majorityType(gv) { var b = blocSeats(gv); return b >= C.majority ? 'absolue' : b >= 200 ? 'relative' : 'faible'; }

  /* ---------- Les votes à l'Assemblée ---------- */
  /* Position d'un groupe sur une mesure (ou sur le budget) : pour, abstention ou contre */
  function stance(gv, gid, mid) {
    if (gid === gv.pid) return 'pour';
    if (gid === gv.ally) return mid && E.measure(mid).choc ? 'abst' : 'pour';   // même un allié rechigne devant une mesure choc
    var d = E.dist(gid, gv.pid), score = 2 - d;
    if (mid) {
      var m = E.measure(mid), party = E.PARTY[gid];
      if (party.programme.indexOf(mid) >= 0 || (party.financing || []).indexOf(mid) >= 0) score += 3;
      if (m.theme && (party.cred[m.theme] || 0) >= 2) score += 1;
      if (m.choc) score -= 1;
    } else score -= 0.5;          // un budget, c'est toujours plus dur à voter pour l'opposition
    if (popularity(gv) < 30) score -= 1;
    return score >= 1.5 ? 'pour' : score >= 0 ? 'abst' : 'contre';
  }
  /* Les frondeurs : une partie de ton groupe refuse une mesure coûteuse, choc ou impopulaire */
  function frondeurs(gv, mid) {
    var pop = popularity(gv), share = 0;
    if (mid) { var m = E.measure(mid); if (m.choc || Math.abs(m.cost) >= 15) share += 0.15; }
    else if (gv.deficit > C.target(gv.year) + 0.5) share += 0.1;
    if (pop < 45) share += 0.1;
    if (pop < 30) share += 0.1;
    return Math.round(gv.seats[gv.pid] * share);
  }
  function vote(gv, mid, negotiated) {
    var r = { pour: 0, contre: 0, abst: 0, groups: [], frondeurs: frondeurs(gv, mid) };
    Object.keys(gv.seats).forEach(function (gid) {
      var st = gid === negotiated ? 'pour' : stance(gv, gid, mid), n = gv.seats[gid];
      if (gid === gv.pid && r.frondeurs) { r.abst += r.frondeurs; n -= r.frondeurs; }
      r[st] += n; r.groups.push({ id: gid, seats: gv.seats[gid], stance: st, frondeurs: gid === gv.pid ? r.frondeurs : 0 });
    });
    r.passed = r.pour > r.contre;           // majorité des suffrages exprimés : les abstentions ne comptent pas
    return r;
  }
  /* Motion de censure après un 49.3 : il faut 289 voix */
  function censure(gv, negotiated) {
    var pour = 0, groups = [];
    Object.keys(gv.seats).forEach(function (gid) {
      if (gid === gv.pid || gid === gv.ally || gid === negotiated) { groups.push({ id: gid, seats: gv.seats[gid], stance: 'contre' }); return; }
      var d = E.dist(gid, gv.pid);
      var votes = d >= 3 || (d === 2 && popularity(gv) < 40);
      if (votes) pour += gv.seats[gid];
      groups.push({ id: gid, seats: gv.seats[gid], stance: votes ? 'pour' : 'abst' });
    });
    return { pour: pour, passed: pour >= C.majority, groups: groups };
  }
  /* Référendum : les Français votent sur la mesure… et un peu sur le président */
  function referendum(gv, mid) {
    var m = E.measure(mid), yes = 0;
    D.SEGMENTS.forEach(function (sg) { yes += natShare(sg.id) * clamp(50 + 9 * ((m.fans || {})[sg.id] || 0), 10, 90); });
    var pop = popularity(gv);
    yes = yes + (pop - 50) * 0.35 + (gv.rng() - 0.5) * 8;
    var censured = mid === 'referendum' && gv.rng() < 0.5;
    return { yes: Math.round(yes * 10) / 10, passed: !censured && yes > 50, censured: censured };
  }
  /* Une mesure du programme est adoptée (amendée ou non) */
  function adopt(gv, mid, amended) {
    var m = E.measure(mid), k = amended ? C.amendFactor : 1;
    var it = gv.measures.filter(function (x) { return x.id === mid; })[0];
    it.status = 'adopted'; it.amended = !!amended;
    gv.deficit += k * m.cost / C.mdPerPoint;
    addSat(gv, m.fans, C.satPerFan * k);
  }
  function reject(gv, mid) {
    var it = gv.measures.filter(function (x) { return x.id === mid; })[0];
    it.status = 'rejected';
    gv.popBonus -= 2;
  }
  /* Le gouvernement est renversé : nouveau gouvernement, et à la deuxième fois, dissolution */
  function governmentFalls(gv, g) {
    gv.fell += 1; gv.popBonus -= 4;
    if (gv.fell >= 2 && !gv.dissolved) {
      gv.dissolved = true;
      var shift = clamp(popularity(gv) / 45, 0.6, 1.4);
      legislatives(gv, g, shift);
      return 'dissolution';
    }
    return 'nouveau';
  }

  /* ---------- L'automne budgétaire ---------- */
  function drawCards(gv) {
    var out = [];
    for (var i = 0; i < 3; i++) out.push(card(gv.cardsDeck[((gv.year - 1) * 3 + i) % gv.cardsDeck.length]));
    return out;
  }
  function card(id) { return BUDGET_CARDS.filter(function (c) { return c.id === id; })[0]; }
  function applyOpt(gv, o) {
    if (o.def) gv.deficit += o.def;
    if (o.sat) addSat(gv, o.sat, 1);
    if (o.pop) gv.popBonus += o.pop;
    if (o.debt) gv.debt += o.debt;
  }
  function drawEvent(gv) { var id = gv.eventsDeck[(gv.year - 1) % gv.eventsDeck.length]; return EVENTS.filter(function (e) { return e.id === id; })[0]; }

  /* ---------- Fin d'année : intérêts, dette, Bruxelles ---------- */
  function endYear(gv) {
    var out = { year: gv.year };
    gv.deficit += Math.max(0, gv.debt - C.debt0) * C.interest - C.growth;   // la charge de la dette, moins l'effet de la croissance
    gv.deficit = Math.round(gv.deficit * 100) / 100;
    gv.debt = Math.round((gv.debt + gv.deficit - C.debtDrift) * 10) / 10;
    out.target = C.target(gv.year);
    out.bruxelles = gv.deficit > out.target + 0.3;
    if (out.bruxelles) { gv.debt += 0.5; out.text = 'Bruxelles rappelle la France à l\'ordre : le déficit dépasse la trajectoire promise.'; }
    out.markets = gv.deficit > out.target + 1;
    if (out.markets) { gv.popBonus -= C.marketPenalty; gv.deficit += 0.1; out.text = 'Les marchés s\'inquiètent : les taux d\'intérêt grimpent, les crédits immobiliers aussi. Ta popularité en pâtit.'; }
    if (gv.year === 1) gv.popBonus -= C.honeymoon;                     // fin de l'état de grâce
    gv.popBonus -= 2;                                                  // l'usure du pouvoir
    out.deficit = gv.deficit; out.debt = gv.debt; out.pop = popularity(gv);
    gv.history.push({ year: gv.year, deficit: gv.deficit, debt: gv.debt, pop: out.pop });
    gv.year += 1;
    if (gv.year > C.years) gv.over = true;
    return out;
  }

  /* ---------- Le bilan du quinquennat ---------- */
  function verdict(gv) {
    var adopted = gv.measures.filter(function (m) { return m.status === 'adopted'; }).length, pop = popularity(gv);
    var score = adopted * 8 + (gv.deficit <= 3 ? 20 : gv.deficit <= 4 ? 10 : gv.deficit > 5.5 ? -15 : 0) + (gv.debt < C.debt0 ? 10 : 0) + pop * 0.6;
    var ach = [];
    if (adopted === gv.measures.length) ach.push('📜 Promesses tenues : tout ton programme est adopté');
    if (!gv.used493) ach.push('🕊️ L\'art du compromis : jamais de 49.3');
    if (gv.deficit <= 3) ach.push('🇪🇺 Cap des 3 % atteint');
    if (gv.debt < C.debt0) ach.push('📉 Désendetteur : la dette a baissé');
    if (gv.survived) ach.push('😅 Rescapé de la censure');
    if (pop >= 50) ach.push('⭐ Toujours populaire en fin de mandat');
    var v = pop >= 45 && score >= 60 ? 'reelu' : pop >= 32 ? 'serre' : 'battu';
    if (v === 'reelu' && gv.deficit > 5) v = 'serre';     // une dette hors de contrôle te rattrape dans la campagne
    return { adopted: adopted, pop: pop, score: Math.round(score), verdict: v, achievements: ach };
  }

  var API = { C: C, BUDGET_CARDS: BUDGET_CARDS, EVENTS: EVENTS, create: create, popularity: popularity, legislatives: legislatives, blocSeats: blocSeats,
    majorityType: majorityType, stance: stance, vote: vote, frondeurs: frondeurs, censure: censure, referendum: referendum, adopt: adopt, reject: reject,
    governmentFalls: governmentFalls, drawCards: drawCards, applyOpt: applyOpt, drawEvent: drawEvent, endYear: endYear, verdict: verdict, addSat: addSat };
  if (node) module.exports = API; else root.PolitikGov = API;
})(this);

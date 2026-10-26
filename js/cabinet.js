/* Politik — v2.6 : former le gouvernement (règles sans affichage).
   6 postes (data.js, MINISTRY). On tire 8 profils : 3 députés de ton parti, 2 de tes alliés, 2 experts de la société civile,
   1 personnalité d'ouverture venue d'un parti rival. Chaque ministre : compétence, loyauté, notoriété (1 à 3 étoiles) et un trait.
   Pendant le mandat : événements de ministres (gaffes, affaires, frondes, démissions) et un remaniement par an. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var E = node ? require('./engine.js') : root.PolitikEngine;
  var G = node ? require('./govern.js') : root.PolitikGov;
  var MIN = D.MINISTRY, POSTS = MIN.posts.map(function (p) { return p.id; });
  var TRAIT_IDS = Object.keys(MIN.traits);

  function pick(a, rng) { return a[Math.floor(rng() * a.length)]; }
  function stars(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }
  var HAIRS = ['court', 'long', 'carre', 'boucles', 'chignon', 'chauve'];
  function randomFace(rng, sex) {
    var hairs = sex === 'f' ? ['long', 'carre', 'boucles', 'chignon', 'court'] : ['court', 'chauve', 'boucles', 'court'];
    return { skin: Math.floor(rng() * 6), hair: pick(hairs, rng), hairColor: pick(['#1E1A1A', '#3A2A20', '#8A5A3B', '#C9922E', '#C9C9D1'], rng),
      glasses: pick(['none', 'none', 'rondes', 'carrees'], rng), mouth: pick(['sourire', 'grand', 'serieux'], rng), outfit: pick(['#26305A', '#4A4A55', '#7A1E24', '#2E6B45', '#5B3E8C'], rng),
      beard: sex === 'm' && rng() < 0.3 };
  }
  /* Un profil de ministre. origin : parti · allie · expert · ouverture · impose (cohabitation) */
  function profile(gv, rng, origin, party, used) {
    // v3.0 : d'abord une figure connue du parti (version satirique), sinon un nom inventé
    var figs = party && origin !== 'expert' ? (MIN.figures[party] || []).filter(function (f) { return used.indexOf(f[0]) < 0; }) : [], name, sex;
    if (figs.length) { var f = pick(figs, rng); name = f[0]; sex = f[1]; }
    else {
      sex = rng() < 0.5 ? 'f' : 'm'; var list = MIN.names[sex].filter(function (n) { return used.indexOf(n) < 0; });
      if (!list.length) { sex = sex === 'f' ? 'm' : 'f'; list = MIN.names[sex].filter(function (n) { return used.indexOf(n) < 0; }); }
      name = pick(list, rng);
    }
    used.push(name);
    var p = { id: 'm' + used.length + '-' + Math.floor(rng() * 1e6), name: name, sex: sex, origin: origin, party: party || null, face: randomFace(rng, sex),
      comp: stars(rng, 1, 3), loy: stars(rng, 2, 3), not: stars(rng, 1, 3), trait: pick(TRAIT_IDS, rng), region: null };
    if (origin === 'expert') { p.comp = 3; p.loy = 2; p.not = 1; p.trait = pick(['bourreau', 'gaffeur', 'bourreau'], rng); }
    if (origin === 'allie') p.loy = stars(rng, 1, 2);
    if (origin === 'ouverture' || origin === 'impose') { p.comp = 2; p.loy = 1; p.not = 3; if (p.trait === 'reseau' && origin === 'impose') p.trait = 'ambitieux'; }
    // un député de ton parti (ou d'un allié) vient d'une région où il a été élu
    if ((origin === 'parti' || origin === 'allie') && gv.legis) {
      var regs = D.REGIONS.filter(function (r) { return gv.legis.regions[r.id] && gv.legis.regions[r.id].seats[party] > 0; });
      if (regs.length) p.region = pick(regs, rng).id;
    }
    return p;
  }
  /* Le rival d'où vient la personnalité d'ouverture */
  function rivalParty(gv) {
    // v3.0 : l'ouverture vient du parti rival le plus proche sur l'axe (qui a des députés), pas forcément du plus gros
    return Object.keys(gv.seats).filter(function (id) { return id !== gv.pid && !G.isAlly(gv, id) && gv.seats[id] > 0; })
      .sort(function (a, b) { return Math.abs(E.PARTY[a].pos - E.PARTY[gv.pid].pos) - Math.abs(E.PARTY[b].pos - E.PARTY[gv.pid].pos) || gv.seats[b] - gv.seats[a]; })[0];
  }
  /* Le tirage des profils (8) ; used : les noms déjà pris */
  function draw(gv, n) {
    var rng = gv.rng, used = (gv.cabinet && gv.cabinet.used) || [], out = [], c = n || MIN.draw;
    var allies = (gv.allies || []).filter(function (a) { return (gv.seats[a] || 0) > 0; });
    for (var i = 0; i < (c.parti || 0); i++) out.push(profile(gv, rng, 'parti', gv.pid, used));
    // au moins un profil pour chaque allié (sinon il ne pourrait pas avoir de ministère)
    var nAl = c.allie ? Math.max(c.allie, allies.length) : 0;
    for (i = 0; i < nAl; i++) out.push(allies.length ? profile(gv, rng, 'allie', allies[i % allies.length], used) : profile(gv, rng, 'parti', gv.pid, used));
    for (i = 0; i < (c.expert || 0); i++) out.push(profile(gv, rng, 'expert', null, used));
    for (i = 0; i < (c.ouverture || 0); i++) { var rv = rivalParty(gv); if (rv) out.push(profile(gv, rng, 'ouverture', rv, used)); }
    return out;
  }
  /* Le début du gouvernement : le vivier de profils. En cohabitation, le Premier ministre est imposé par la majorité adverse. */
  function start(gv) {
    gv.cabinet = { posts: {}, pool: [], used: [], fronde: 0, reshuffledYear: 0, fusibleUsed: false, imposed: null, log: [] };
    gv.cabinet.pool = draw(gv);
    if (gv.cohab) {   // v2.7 : en cohabitation, Matignon, c'est toi
      var P0 = E.PARTY[gv.pid], me = { id: 'toi', name: P0.candidate, sex: 'f', origin: 'toi', party: gv.pid, face: gv.myFace || randomFace(gv.rng, 'm'), comp: 2, loy: 3, not: 3, trait: 'reseau', region: null };
      gv.cabinet.imposed = me; gv.cabinet.posts.pm = me;
    } else if (G.majorityType(gv) === 'cohabitation') {
      var rv = gv.legis.outcome.rival, party = rv.parties.slice().sort(function (a, b) { return (gv.seats[b] || 0) - (gv.seats[a] || 0); })[0];
      var pm = profile(gv, gv.rng, 'impose', party, gv.cabinet.used);
      gv.cabinet.imposed = pm; gv.cabinet.posts.pm = pm;
    }
    return gv.cabinet;
  }
  /* La proposition de Lulu : les plus compétents aux postes clés, au moins un poste pour chaque allié, la parité si possible */
  function suggest(gv) {
    var cab = gv.cabinet, free = cab.pool.slice(), out = {};
    if (cab.imposed) out.pm = cab.imposed;
    var order = ['pm', 'eco', 'int', 'sante', 'educ', 'eco2'].filter(function (p) { return !out[p]; });
    // d'abord un poste pour chaque allié présent dans le vivier
    (gv.allies || []).forEach(function (a) {
      var x = free.filter(function (p) { return p.party === a; }).sort(function (u, v) { return v.comp - u.comp; })[0];
      if (x) { var post = order.filter(function (p) { return p !== 'pm' && !out[p]; }).pop(); out[post] = x; free.splice(free.indexOf(x), 1); }
    });
    order.forEach(function (post) {
      if (out[post]) return;
      var cands = free.filter(function (p) { return post !== 'pm' || p.origin === 'parti'; });
      if (!cands.length) cands = free;
      var f = 0, m = 0; Object.keys(out).forEach(function (k) { if (out[k].sex === 'f') f++; else m++; });
      cands.sort(function (u, v) { return score(v) - score(u); });
      function score(p) { return p.comp * 2 + p.loy + (p.trait === 'casserole' || p.trait === 'gaffeur' ? -1.5 : 0) + ((f > m && p.sex === 'm') || (m > f && p.sex === 'f') ? 2.5 : 0); }
      out[post] = cands[0]; free.splice(free.indexOf(cands[0]), 1);
    });
    return out;
  }
  /* Ce que donnerait une équipe : parité, alliés servis, ouverture */
  function check(gv, posts) {
    var f = 0, m = 0, n = 0, partiesIn = {}, ouv = false;
    POSTS.forEach(function (k) { var x = posts[k]; if (!x) return; n++; if (x.sex === 'f') f++; else m++; if (x.party) partiesIn[x.party] = true; if (x.origin === 'ouverture') ouv = true; });
    var parity = n === 6 ? (f === 3 ? 'ok' : Math.max(f, m) >= 5 ? 'bad' : 'meh') : null;
    var unserved = (gv.allies || []).filter(function (a) { return (gv.seats[a] || 0) > 0 && !partiesIn[a]; });
    return { full: n === 6, f: f, m: m, parity: parity, unserved: unserved, ouverture: ouv };
  }
  /* Nommer le gouvernement */
  function form(gv, posts) {
    var cab = gv.cabinet, ck = check(gv, posts), notes = [], pop = 0;
    cab.posts = Object.assign({}, posts);
    cab.pool = cab.pool.filter(function (p) { return POSTS.every(function (k) { return posts[k] !== p; }); });
    if (ck.parity === 'ok') { pop += MIN.parity; notes.push({ icon: '⚖️', text: 'Gouvernement paritaire : +' + MIN.parity + ' de popularité.' }); }
    if (ck.parity === 'bad') { pop -= MIN.parity; notes.push({ icon: '⚖️', text: 'Gouvernement très déséquilibré entre femmes et hommes : −' + MIN.parity + ' de popularité.' }); }
    if (ck.ouverture) { pop += MIN.ouverture; cab.fronde += MIN.ouvertureFronde; notes.push({ icon: '🤝', text: 'Une personnalité d\'ouverture : +' + MIN.ouverture + ' de popularité, mais ton camp grogne (plus de frondeurs cette année).' }); }
    ck.unserved.forEach(function (a) {
      gv.allies = (gv.allies || []).filter(function (x) { return x !== a; });
      if (gv.ally === a) gv.ally = null;
      notes.push({ icon: '🚪', text: E.PARTY[a].short + ' n\'a aucun ministère : il quitte ta majorité (' + gv.seats[a] + ' députés).', bad: true });
    });
    gv.popBonus += pop;
    return { pop: pop, notes: notes, check: ck };
  }
  /* Le remaniement : une fois par an, remplacer un ministre par un nouveau profil. Changer de Premier ministre = le fusible. */
  function canReshuffle(gv) { return !!gv.cabinet && gv.cabinet.reshuffledYear !== gv.year && !gv.over; }
  function reshufflePool(gv) {
    var cab = gv.cabinet;
    if (cab.pool.length < 3) cab.pool = cab.pool.concat(draw(gv, { parti: 2, expert: 1, allie: (gv.allies || []).length ? 1 : 0 }));
    return cab.pool;
  }
  function reshuffle(gv, post, prof) {
    var cab = gv.cabinet, old = cab.posts[post], pop = 0;
    if (cab.imposed && post === 'pm') return { ok: false, text: 'En cohabitation, le Premier ministre vient de la majorité de l\'Assemblée.' };
    cab.posts[post] = prof; cab.pool = cab.pool.filter(function (p) { return p !== prof; });
    cab.reshuffledYear = gv.year;
    if (post === 'pm') { pop = cab.fusibleUsed ? 1 : MIN.fusible; cab.fusibleUsed = true; }
    else pop = 1;
    gv.popBonus += pop;
    var ck = check(gv, cab.posts), notes = [];
    if (old && old.party && old.origin === 'allie' && ck.unserved.indexOf(old.party) >= 0) {
      gv.allies = gv.allies.filter(function (x) { return x !== old.party; });
      notes.push({ icon: '🚪', text: E.PARTY[old.party].short + ' perd son seul ministère : il quitte ta majorité.', bad: true });
    }
    return { ok: true, pop: pop, old: old, notes: notes };
  }
  /* Remplacer un ministre parti (démission) : un expert prend le poste, sans remaniement */
  function replaceWithExpert(gv, post) { var x = draw(gv, { expert: 1 })[0]; x.comp = 2; gv.cabinet.posts[post] = x; return x; }

  /* Les événements de ministres : au plus un par été. Chaque événement propose des choix (même forme que les événements du quinquennat). */
  function event(gv) {
    var cab = gv.cabinet; if (!cab || gv.rng() > MIN.eventChance) return null;
    var cands = [];
    POSTS.forEach(function (post) {
      var x = cab.posts[post]; if (!x) return;
      if (x.trait === 'gaffeur') cands.push({ k: 'gaffe', post: post, x: x, w: 3 });
      if (x.trait === 'casserole' && !x.out) cands.push({ k: 'affaire', post: post, x: x, w: 2 });
      if (x.trait === 'ambitieux' && gv.year >= 3 && G.popularity(gv) < 45 && !(cab.imposed && post === 'pm')) cands.push({ k: 'depart', post: post, x: x, w: 3 });
      if (x.loy <= 1) cands.push({ k: 'fronde', post: post, x: x, w: 2 });
      if (x.trait === 'bourreau') cands.push({ k: 'succes', post: post, x: x, w: 2 });
    });
    if (!cands.length) return null;
    var tot = 0; cands.forEach(function (c) { tot += c.w; }); var r = gv.rng() * tot, ch = cands[0];
    for (var i = 0; i < cands.length; i++) { r -= cands[i].w; if (r <= 0) { ch = cands[i]; break; } }
    var x = ch.x, P = MIN.posts.filter(function (p) { return p.id === ch.post; })[0], who = x.name + ' (' + P.short + ')', k = x.not;   // la notoriété amplifie tout
    if (ch.k === 'gaffe') return { id: 'gaffe', post: ch.post, minister: x, title: 'La petite phrase de ' + x.name, text: who + ' a lâché une petite phrase méprisante en direct. Les réseaux sociaux s\'enflamment.',
      opts: [{ label: 'Le recadrer publiquement', pop: -1, loy: -1 }, { label: 'Le couvrir', pop: -1 - k }] };
    if (ch.k === 'affaire') return { id: 'affaire', post: ch.post, minister: x, title: 'L\'affaire ' + x.name.split(' ')[1], text: 'Une vieille affaire ressort : ' + who + ' aurait omis de déclarer une partie de son patrimoine.',
      opts: [{ label: 'Le limoger', pop: -1, fire: true }, { label: 'Le défendre', pop: -2 - k, closed: true }] };
    if (ch.k === 'depart') return { id: 'depart', post: ch.post, minister: x, title: x.name + ' claque la porte', text: who + ' démissionne avec fracas pour « reprendre sa liberté »… et préparer sa propre candidature.',
      opts: [{ label: 'Nommer un expert à sa place', pop: -1 - k, fire: true }] };
    if (ch.k === 'fronde') return { id: 'fronde', post: ch.post, minister: x, title: x.name + ' prend ses distances', text: who + ' critique ta politique dans la presse. Des députés de ton camp le suivent.',
      opts: [{ label: 'Le rappeler à l\'ordre', pop: -1, loy: 1 }, { label: 'Laisser dire', fronde: MIN.leaveFronde }] };
    return { id: 'succes', post: ch.post, minister: x, title: 'Le bon élève : ' + x.name, text: who + ' enchaîne les déplacements et les annonces. Les Français saluent le travail accompli.',
      opts: [{ label: 'Le mettre en avant', pop: 1 }] };
  }
  function applyEvent(gv, ev, o) {
    var cab = gv.cabinet, x = ev.minister, out = {};
    if (o.pop) gv.popBonus += o.pop;
    if (o.loy) x.loy = Math.max(1, Math.min(3, x.loy + o.loy));
    if (o.fronde) cab.fronde += o.fronde;
    if (o.closed) x.out = true;
    if (o.fire) out.replacement = replaceWithExpert(gv, ev.post);
    cab.log.push({ year: gv.year, id: ev.id, name: x.name });
    return out;
  }

  var API = { start: start, draw: draw, suggest: suggest, check: check, form: form, canReshuffle: canReshuffle, reshufflePool: reshufflePool, reshuffle: reshuffle,
    event: event, applyEvent: applyEvent, replaceWithExpert: replaceWithExpert, POSTS: POSTS };
  if (node) module.exports = API; else root.PolitikCabinet = API;
})(this);

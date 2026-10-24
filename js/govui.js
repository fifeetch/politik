/* Politik — v1.0 : l'écran « Gouverner » (le quinquennat). S'appuie sur js/govern.js pour les règles. */
(function () {
  var D = window.PolitikData, E = window.PolitikEngine, G = window.PolitikGov, A = window.PolitikArt, U = window.PolitikUI;
  var modal = U.modal, closeModal = U.closeModal, toast = U.toast, esc = U.esc, line = U.line, srcHtml = U.srcHtml;
  var gv = null, g = null, me = null, learned = {}, step = 0, lawsThisYear = 0;
  function $(id) { return document.getElementById(id); }
  function party(id) { return E.PARTY[id]; }
  function chip(pid) { var p = party(pid); return '<span class="who" style="background:' + p.color + ';color:' + p.ink + '">' + pid + '</span>'; }
  function fr(x, d) { return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace('.', ','); }
  function seg(id) { return D.SEGMENTS.filter(function (s) { return s.id === id; })[0]; }
  /* « Le saviez-vous ? » une fois par quinquennat */
  function learn(key) {
    var L = D.LEARN[key]; if (!L || learned[key]) return '';
    learned[key] = true;
    return '<div class="learn learn-inline">' + A.advisor() + '<div><span class="kicker">Le saviez-vous ?</span><b>' + esc(L.title) + '</b><p>' + esc(L.text) + '</p>' + srcHtml(L) + '</div></div>';
  }

  /* ---------- L'hémicycle : 577 sièges, de gauche à droite ---------- */
  function hemicycle(seats, stances, big) {
    var order = D.PARTIES.slice().sort(function (a, b) { return a.pos - b.pos; }).map(function (p) { return p.id; }).filter(function (id) { return seats[id] != null; });
    var rows = 11, r0 = 34, r1 = 96, pts = [], total = 0;
    order.forEach(function (id) { total += seats[id]; });
    var lens = [], sum = 0;
    for (var i = 0; i < rows; i++) { var r = r0 + (r1 - r0) * i / (rows - 1); lens.push(r); sum += r; }
    var counts = lens.map(function (l) { return Math.round(total * l / sum); });
    var diff = total - counts.reduce(function (a, b) { return a + b; }, 0); counts[rows - 1] += diff;
    lens.forEach(function (r, i) {
      for (var k = 0; k < counts[i]; k++) { var a = Math.PI * (1 - (k + 0.5) / counts[i]); pts.push({ x: 100 + r * Math.cos(a), y: 104 - r * Math.sin(a), a: a }); }
    });
    pts.sort(function (p, q) { return q.a - p.a; });
    var colors = [], fr0 = [];
    order.forEach(function (id) {
      var st = stances ? stances[id] : null, n = seats[id], f = st && st.frondeurs ? st.frondeurs : 0;
      for (var k = 0; k < n; k++) {
        var c = party(id).color, op = 1;
        if (st) { var s2 = k < f ? 'abst' : st.stance; op = s2 === 'pour' ? 1 : s2 === 'abst' ? 0.22 : 1; if (s2 === 'contre') c = '#23203A'; }
        colors.push({ c: c, op: op });
      }
    });
    var h = '<svg viewBox="0 0 200 110" class="hemi-svg' + (big ? ' big' : '') + '" aria-label="Hémicycle de l\'Assemblée nationale">';
    pts.forEach(function (p, i) { var c = colors[i] || { c: '#ccc', op: 1 }; h += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="2.3" fill="' + c.c + '" fill-opacity="' + c.op + '"/>'; });
    h += '<text x="100" y="100" text-anchor="middle" class="hemi-n">' + total + '</text><text x="100" y="108" text-anchor="middle" class="hemi-l">députés</text></svg>';
    return h;
  }
  function legend(seats) {
    return '<div class="hemi-leg">' + D.PARTIES.slice().sort(function (a, b) { return a.pos - b.pos; }).filter(function (p) { return seats[p.id] != null; }).map(function (p) {
      return '<span' + (p.id === me ? ' class="me"' : '') + '><i style="background:' + p.color + '"></i>' + (p.id === me ? 'Toi' : p.id) + ' ' + seats[p.id] + '</span>';
    }).join('') + '</div>';
  }

  /* ---------- L'écran principal ---------- */
  var STEPS = ['loi', 'evenement', 'budget', 'bilan'];
  var STEP_LABEL = { legislatives: 'Les législatives', loi: 'Printemps : ta loi de l\'année', evenement: 'Été : l\'actualité', budget: 'Automne : le budget', bilan: 'Hiver : le bilan de l\'année' };
  function current() { return gv.year === 1 && step === -1 ? 'legislatives' : STEPS[step]; }
  function render() {
    var P = party(me), pop = G.popularity(gv), tgt = G.C.target(gv.year), bloc = G.blocSeats(gv);
    $('gov-face').innerHTML = A.portrait(me);
    $('gov-kicker').textContent = 'Quinquennat de ' + P.candidate;
    $('gov-title').textContent = gv.over ? 'Fin du mandat' : 'Année ' + gv.year + ' sur ' + G.C.years;
    $('gov-sub').textContent = gv.over ? '' : STEP_LABEL[current()];
    function gauge(icon, label, val, sub, cls) { return '<div class="gauge ' + (cls || '') + '"><span class="g-i">' + icon + '</span><span class="g-l">' + label + '</span><b>' + val + '</b><small>' + sub + '</small></div>'; }
    $('gov-gauges').innerHTML =
      gauge('💶', 'Déficit', fr(gv.deficit, 1) + ' %', 'objectif ' + fr(tgt, 1) + ' %', gv.deficit > tgt + 0.3 ? 'bad' : 'ok') +
      gauge('📈', 'Dette', fr(gv.debt, 0) + ' %', 'du PIB', gv.debt > G.C.debt0 + 4 ? 'bad' : '') +
      gauge('😊', 'Popularité', pop + ' %', pop >= 45 ? 'soutenu' : pop >= 30 ? 'contesté' : 'impopulaire', pop < 30 ? 'bad' : pop >= 45 ? 'ok' : '') +
      gauge('🏛️', 'Assemblée', bloc + ' / 577', 'majorité ' + G.majorityType(gv), bloc >= 289 ? 'ok' : 'bad');
    $('gov-hemi').innerHTML = hemicycle(gv.seats) + legend(gv.seats);
    $('gov-sat').innerHTML = D.SEGMENTS.map(function (s) {
      var v = gv.sat[s.id], f = v >= 65 ? '😀' : v >= 50 ? '🙂' : v >= 35 ? '😐' : v >= 20 ? '🙁' : '😡';
      return '<span class="satc" title="' + esc(s.full) + ' : ' + Math.round(v) + ' / 100">' + s.icon + f + '</span>';
    }).join('');
    $('gov-prog').innerHTML = '<div class="kicker">Tes promesses</div>' + gv.measures.map(function (m) {
      var M = E.measure(m.id), st = m.status === 'adopted' ? (m.amended ? '✅ adoptée (amendée)' : '✅ adoptée') : m.status === 'rejected' ? '❌ rejetée' : '⏳ à faire voter';
      return '<div class="gp-row ' + m.status + '"><span>' + esc(M.name) + '</span><small>' + st + '</small></div>';
    }).join('');
    $('gov-advisor').innerHTML = '<span class="adv-face">' + A.advisor() + '</span><p><b>Lulu :</b> ' + esc(advice()) + '</p>';
    $('gov-dissolve').hidden = !(G.canDissolve(gv) && current() === 'loi');
    $('gov-next').textContent = gv.over ? 'Voir le bilan du mandat' : STEP_LABEL[current()];
  }
  function advice() {
    var pop = G.popularity(gv), tgt = G.C.target(gv.year), pend = gv.measures.filter(function (m) { return m.status === 'pending'; }).length;
    if (gv.over) return 'Cinq ans déjà ! Voyons ce que les Français retiendront de ton mandat.';
    if (current() === 'legislatives') return 'D\'abord, les législatives : sans majorité à l\'Assemblée, impossible de tenir tes promesses.';
    if (gv.deficit > tgt + 1) return 'Le déficit dérape (' + fr(gv.deficit, 1) + ' % pour un objectif de ' + fr(tgt, 1) + ' %). Les marchés vont s\'énerver : cet automne, il faudra des économies.';
    if (pop < 30) return 'La rue gronde, ta popularité est à ' + pop + ' %. Évite les mesures choc et fais un geste pour les groupes les plus mécontents.';
    if (G.blocSeats(gv) < 289 && current() === 'loi') return 'Pas de majorité absolue : pour faire passer ta loi, il faudra négocier avec un groupe… ou tenter le 49.3, au risque de la censure.';
    if (pend > 0 && current() === 'loi') return 'Il te reste ' + pend + ' promesse' + (pend > 1 ? 's' : '') + ' à faire voter. Les Français s\'en souviendront à la prochaine élection.';
    if (current() === 'budget') return 'Le budget, c\'est l\'heure des choix : chaque dépense plaît à quelqu\'un, chaque économie fâche quelqu\'un d\'autre.';
    return 'Garde un œil sur les trois jauges : le déficit, la popularité et ta majorité. Il faut tenir les trois en même temps.';
  }

  /* ---------- Démarrer le quinquennat ---------- */
  document.getElementById('btn-govern').addEventListener('click', function () {
    g = U.game(); me = U.me();
    if (!g || g.winner !== me) return;
    gv = G.create(g, me); learned = {}; step = -1; lawsThisYear = 0;
    U.go('gov'); render();
    showLegislatives();
  });
  $('gov-next').addEventListener('click', function () {
    if (!gv) return;
    if (gv.over) return finalBilan();
    var s = current();
    if (s === 'legislatives') return showLegislatives();
    if (s === 'loi') return chooseLaw();
    if (s === 'evenement') return showEvent();
    if (s === 'budget') return budget();
    if (s === 'bilan') return yearEnd();
  });
  /* ---------- Dissoudre l'Assemblée (article 12) ---------- */
  $('gov-dissolve').addEventListener('click', function () {
    if (!gv || !G.canDissolve(gv)) return;
    var pop = G.popularity(gv);
    modal({ kicker: 'Article 12 de la Constitution', title: 'Dissoudre l\'Assemblée ?', html:
      '<p>Tu renvoies les députés devant les électeurs. Les nouvelles législatives se joueront sur ta popularité du moment : <b>' + pop + ' %</b>.</p>' +
      '<div class="brief">' + line(pop >= 45 ? '✅' : '⚠️', pop >= 45 ? 'Avec une telle popularité, ton camp devrait gagner des sièges.' : 'Sous 45 % de popularité, ton camp risque de perdre des sièges.') +
      line('🔁', 'Une seule dissolution par mandat.') + '</div>' + learn('dissolution'),
      buttons: [{ label: 'Dissoudre', primary: true, onClick: function () {
        var r = G.dissolve(gv, g); render();
        modal({ kicker: 'Législatives anticipées', title: r.after >= r.before ? 'Pari gagné' : 'Pari perdu', html: hemicycle(gv.seats, null, true) + legend(gv.seats) +
          '<p>Ton camp passe de <b>' + r.before + '</b> à <b>' + r.after + ' députés</b>. Majorité ' + G.majorityType(gv) + '.</p>',
          buttons: [{ label: 'Continuer', primary: true, onClick: render }] });
      } }, { label: 'Garder cette Assemblée', onClick: closeModal }] });
  });
  function next() { step = step + 1; if (step >= STEPS.length) { step = 0; } render(); }

  function showLegislatives() {
    var bloc = G.blocSeats(gv), t = G.majorityType(gv);
    var html = '<p>Un mois après ton élection, les Français élisent leurs députés. Voici ta nouvelle Assemblée :</p>' + hemicycle(gv.seats, null, true) + legend(gv.seats) +
      '<div class="brief">' + line('🏛️', 'Ton camp' + (gv.ally ? ' (avec ton allié ' + esc(party(gv.ally).short) + ')' : '') + ' : <b>' + bloc + ' députés</b> sur 577.') +
      line(t === 'absolue' ? '✅' : '⚠️', t === 'absolue' ? '<b>Majorité absolue</b> (289 au moins) : tu as les mains libres… tant que tes députés te suivent.' :
        '<b>Majorité ' + t + '</b> : il te manque ' + (289 - bloc) + ' voix. Chaque loi sera une bataille.') + '</div>' + learn('legislatives');
    modal({ kicker: 'Juin · Élections législatives', title: t === 'absolue' ? 'Une majorité pour gouverner' : 'Une Assemblée sans majorité', html: html,
      buttons: [{ label: 'Au travail !', primary: true, onClick: function () { step = 0; render(); } }] });
  }

  /* ---------- Printemps : la loi de l'année ---------- */
  function chooseLaw() {
    var pend = gv.measures.filter(function (m) { return m.status === 'pending'; });
    if (!pend.length) {
      modal({ kicker: 'Printemps', title: 'Toutes tes promesses sont votées', html: '<p>Ton programme est entièrement passé devant l\'Assemblée. Place à l\'actualité !</p>', buttons: [{ label: 'Continuer', primary: true, onClick: next }] });
      return;
    }
    var html = '<p>Quelle promesse de ton programme présentes-tu au Parlement cette année ?' + (gv.year === 1 ? ' <b>État de grâce</b> : cette première année, tu peux en faire voter deux.' : '') + '</p><div class="pick">' +
      pend.map(function (m) {
        var M = E.measure(m.id), v = G.vote(gv, m.id);
        return '<button type="button" class="pick-row" data-m="' + m.id + '"><span class="pick-txt"><b>' + esc(M.name) + '</b><small>' + (M.cost > 0 ? 'coûte ' + M.cost + ' Md€' : M.cost < 0 ? 'rapporte ' + (-M.cost) + ' Md€' : 'ne coûte rien') +
          ' · pronostic : ' + (v.passed ? '<b>adoptée</b>' : '<b>rejetée</b>') + ' (' + v.pour + ' pour, ' + v.contre + ' contre)</small></span></button>';
      }).join('') + '</div>';
    modal({ kicker: 'Printemps · Année ' + gv.year, title: 'Ta loi de l\'année', html: html, buttons: [{ label: 'Ne rien présenter cette année', onClick: function () { lawsThisYear = 0; next(); } }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-m]'), function (b) { b.addEventListener('click', function () { closeModal(); lawScreen(b.getAttribute('data-m'), null); }); });
      } });
  }
  function stancesOf(v) { var m = {}; v.groups.forEach(function (x) { m[x.id] = x; }); return m; }
  function lawScreen(mid, negotiated) {
    var M = E.measure(mid), v = G.vote(gv, mid, negotiated);
    var html = '<div class="law-head"><b>' + esc(M.name) + '</b><small>' + (M.cost > 0 ? 'coûte ' + M.cost + ' Md€ par an' : M.cost < 0 ? 'rapporte ' + (-M.cost) + ' Md€ par an' : 'ne coûte rien') + '</small></div>' +
      hemicycle(gv.seats, stancesOf(v), true) +
      '<div class="tally"><span class="t-pour">✅ Pour <b>' + v.pour + '</b></span><span class="t-contre">❌ Contre <b>' + v.contre + '</b></span><span class="t-abst">➖ Abstention <b>' + v.abst + '</b></span></div>' +
      '<div class="brief">' + v.groups.filter(function (x) { return x.seats > 0; }).map(function (x) {
        return line(chip(x.id), '<b>' + esc(party(x.id).short) + '</b> (' + x.seats + ') : ' + (x.stance === 'pour' ? 'vote pour' : x.stance === 'contre' ? 'vote contre' : 's\'abstient') + (x.id === negotiated ? ' <span class="muted">(accord négocié)</span>' : '') + (x.frondeurs ? ' <span class="muted">— dont ' + x.frondeurs + ' frondeurs qui refusent</span>' : ''));
      }).join('') + '</div>' +
      '<p class="hint">Pronostic : <b>' + (v.passed ? 'adoptée' : 'rejetée') + '</b>.</p>';
    var lm = learn('majorite'); if (lm) html = lm + html;
    var buttons = [{ label: '🗳️ Passer au vote', primary: true, onClick: function () { lawResult(mid, v.passed, negotiated, 'vote', v); } }];
    if (!negotiated) {
      var cands = v.groups.filter(function (x) { return x.stance !== 'pour' && x.seats > 0 && E.dist(x.id, me) <= 3; }).sort(function (a, b) { return b.seats - a.seats; });
      if (cands.length) buttons.push({ label: '🤝 Négocier avec un groupe (mesure amendée)', onClick: function () { negotiate(mid, cands); } });
    }
    if (!gv.used493y) buttons.push({ label: '⚡ 49.3 : adopter sans vote', onClick: function () { use493(mid, negotiated); } });
    if (G.canReferendum(mid)) buttons.push({ label: '🗳️ Référendum : demander aux Français', onClick: function () { doReferendum(mid); } });
    modal({ kicker: 'À l\'Assemblée nationale', title: 'Le vote de ta loi', html: html, buttons: buttons });
  }
  function negotiate(mid, cands) {
    var html = '<p>Un groupe accepte de voter ta loi si tu acceptes ses <b>amendements</b> : la mesure gardera la moitié de ses effets (et de son coût).</p>';
    modal({ kicker: 'Négociation', title: 'Avec qui négocier ?', html: html,
      buttons: cands.map(function (x) { return { label: party(x.id).short + ' · ' + x.seats + ' députés', onClick: function () { lawScreen(mid, x.id); } }; }).concat([{ label: 'Annuler', onClick: function () { lawScreen(mid, null); } }]) });
  }
  function lawResult(mid, passed, negotiated, how, v) {
    var M = E.measure(mid);
    if (passed) G.adopt(gv, mid, !!negotiated); else G.reject(gv, mid);
    var html = (v ? '<div class="vote-anim">' + hemicycle(gv.seats, stancesOf(v), true) + '</div><div class="tally big"><span class="t-pour">✅ <b>' + v.pour + '</b></span><span class="t-contre">❌ <b>' + v.contre + '</b></span></div>' : '') +
      '<p>' + (passed ? '« ' + esc(M.name) + ' » est <b>adoptée</b>' + (negotiated ? ', amendée par ' + esc(party(negotiated).short) + '.' : '.') : '« ' + esc(M.name) + ' » est <b>rejetée</b> par l\'Assemblée. Une promesse qui tombe à l\'eau…') + '</p>' + effectsHtml(M, passed ? (negotiated ? 0.5 : 1) : 0);
    modal({ kicker: how === 'vote' ? 'Résultat du vote' : 'Résultat', title: passed ? 'Loi adoptée !' : 'Loi rejetée', html: html, buttons: [{ label: 'Continuer', primary: true, onClick: afterLaw }] });
  }
  function effectsHtml(M, k) {
    if (!k) return '';
    var parts = [];
    if (M.cost) parts.push(line('💶', 'Déficit ' + (M.cost > 0 ? '+' : '−') + fr(Math.abs(M.cost) * k / G.C.mdPerPoint, 2) + ' point de PIB'));
    Object.keys(M.fans || {}).forEach(function (s) { var x = M.fans[s]; parts.push(line(seg(s).icon, esc(seg(s).name) + (x > 0 ? ' 👍 satisfaits' : ' 👎 mécontents'))); });
    return '<div class="brief">' + parts.join('') + '</div>';
  }
  function afterLaw() {
    lawsThisYear += 1;
    render();
    if (gv.year === 1 && lawsThisYear < 2 && gv.measures.some(function (m) { return m.status === 'pending'; })) return chooseLaw();
    lawsThisYear = 0; next();
  }
  function use493(mid, negotiated) {
    gv.used493 = true; gv.used493y = true;
    var c = G.censure(gv, negotiated), M = E.measure(mid);
    var st = {}; c.groups.forEach(function (x) { st[x.id] = { stance: x.stance === 'pour' ? 'pour' : x.stance === 'contre' ? 'contre' : 'abst' }; });
    var html = '<p>Ton Premier ministre engage la responsabilité du gouvernement. L\'opposition dépose une <b>motion de censure</b> : si 289 députés la votent, le gouvernement tombe.</p>' +
      hemicycle(gv.seats, st, true) + '<div class="tally"><span class="t-contre">Pour la censure <b>' + c.pour + '</b></span><span>Il en faut <b>289</b></span></div>' + learn('art49_3') + learn('censure');
    if (c.passed) {
      G.reject(gv, mid);
      G.governmentFalls(gv);
      html += '<p class="verdict-bad">💥 <b>La censure est votée.</b> Le gouvernement est renversé et ta loi est rejetée. Tu nommes un nouveau Premier ministre.</p>' +
        (G.canDissolve(gv) ? '<p class="hint">Tu peux aussi dissoudre l\'Assemblée depuis l\'écran principal.</p>' : '');
    } else {
      G.adopt(gv, mid, !!negotiated); gv.survived = true;
      html += '<p>😅 <b>La censure échoue</b> (' + c.pour + ' voix sur 289 nécessaires). « ' + esc(M.name) + ' » est adoptée sans vote. Mais l\'opinion n\'aime pas trop : −2 de popularité.</p>' + effectsHtml(M, negotiated ? 0.5 : 1);
      gv.popBonus -= 2;
    }
    modal({ kicker: 'Article 49.3', title: c.passed ? 'Gouvernement renversé !' : 'Le 49.3 passe', html: html, buttons: [{ label: 'Continuer', primary: true, onClick: afterLaw }] });
  }
  function doReferendum(mid) {
    var M = E.measure(mid), r = G.referendum(gv, mid);
    var html = '<p>Tu soumets « ' + esc(M.name) + ' » directement aux Français. Attention : on vote aussi un peu… pour ou contre le président.</p>';
    if (r.censured) { G.reject(gv, mid); html += '<p class="verdict-bad">⚖️ Le <b>Conseil constitutionnel</b> juge que ce sujet n\'entre pas dans le champ du référendum (article 11). La consultation est annulée, et ta mesure avec.</p>'; }
    else if (r.passed) { G.adopt(gv, mid, false); gv.popBonus += 2; html += '<div class="refbar"><i style="width:' + r.yes + '%"></i><span>OUI ' + fr(r.yes, 1) + ' %</span></div><p>🎉 <b>Le oui l\'emporte !</b> La mesure est adoptée telle quelle, et ta légitimité sort renforcée.</p>' + effectsHtml(M, 1); }
    else { G.reject(gv, mid); gv.popBonus -= 6; html += '<div class="refbar no"><i style="width:' + r.yes + '%"></i><span>OUI ' + fr(r.yes, 1) + ' %</span></div><p class="verdict-bad">😬 <b>Le non l\'emporte.</b> Ta mesure est enterrée et ton autorité ébranlée (−6 de popularité). En 1969, un président a démissionné après un référendum perdu.</p>'; }
    html += learn('referendum');
    modal({ kicker: 'Référendum', title: r.censured ? 'Référendum annulé' : r.passed ? 'Le oui gagne' : 'Le non gagne', html: html, buttons: [{ label: 'Continuer', primary: true, onClick: afterLaw }] });
  }

  /* ---------- Été : l'événement ---------- */
  function optHtml(o) {
    var p = [];
    if (o.def) p.push('déficit ' + (o.def > 0 ? '+' : '−') + fr(Math.abs(o.def), 2) + ' pt' + (o.once ? ', une seule année' : ''));
    if (o.debt) p.push('dette +' + o.debt + ' pts');
    if (o.pop) p.push('popularité ' + (o.pop > 0 ? '+' : '') + o.pop);
    Object.keys(o.sat || {}).forEach(function (s) { p.push(seg(s).icon + ' ' + (o.sat[s] > 0 ? '+' : '') + o.sat[s]); });
    return p.join(' · ') || 'aucun effet immédiat';
  }
  function showEvent() {
    var ev = G.drawEvent(gv);
    var html = '<div class="paper"><div class="paper-mast">LE QUOTIDIEN NATIONAL <span>· Été, année ' + gv.year + '</span></div><div class="paper-head">' + esc(ev.title) + '</div><div class="paper-text">' + esc(ev.text) + '</div></div>' +
      (ev.id === 'cour' ? learn('cour') : '') + '<div class="pick">' +
      ev.opts.map(function (o, i) { return '<button type="button" class="pick-row" data-o="' + i + '"><span class="pick-txt"><b>' + esc(o.label) + '</b><small>' + optHtml(o) + '</small></span></button>'; }).join('') + '</div>';
    modal({ kicker: 'Été · Année ' + gv.year, title: 'L\'actualité s\'impose', html: html, buttons: [],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-o]'), function (b) {
          b.addEventListener('click', function () { var o = ev.opts[+b.getAttribute('data-o')]; G.applyOpt(gv, o); closeModal(); next(); });
        });
      } });
  }

  /* ---------- Automne : le budget ---------- */
  function budget() {
    var cards = G.drawCards(gv), i = 0, def0 = gv.deficit;
    if (gv.year === 1 && !gv.financingDone) {
      var fin = G.applyFinancing(gv); render();
      if (fin.length) {
        var tot = fin.reduce(function (a, m) { return a + m.cost; }, 0);
        modal({ kicker: 'Automne · Ton premier budget', title: 'Les recettes de ton programme', html:
          '<p>Les financements promis pendant la campagne entrent dans ce premier budget.</p><div class="brief">' +
          fin.map(function (m) { return line('💶', esc(m.name) + ' : <b>' + (m.cost < 0 ? 'rapporte ' + fr(-m.cost, 0) : 'coûte ' + fr(m.cost, 0)) + ' Md€</b>'); }).join('') +
          line('📉', 'Déficit ' + (tot < 0 ? '−' : '+') + fr(Math.abs(tot) / G.C.mdPerPoint, 2) + ' point de PIB') + '</div>',
          buttons: [{ label: 'Passer aux arbitrages', primary: true, onClick: function () { oneCard(); } }] });
        return;
      }
    }
    oneCard();
    function oneCard() {
      if (i >= cards.length) return budgetVote(def0);
      var c = cards[i];
      var html = (i === 0 ? learn('budget') : '') + '<div class="bercy"><span class="kicker">Note de Bercy ' + (i + 1) + ' sur ' + cards.length + '</span><b>' + esc(c.title) + '</b><p>' + esc(c.text) + '</p></div><div class="pick">' +
        c.opts.map(function (o, k) { return '<button type="button" class="pick-row" data-o="' + k + '"><span class="pick-txt"><b>' + esc(o.label) + '</b><small>' + optHtml(o) + '</small></span></button>'; }).join('') + '</div>';
      modal({ kicker: 'Automne · Le projet de loi de finances', title: 'Les arbitrages', html: html, buttons: [],
        onOpen: function () {
          Array.prototype.forEach.call(document.querySelectorAll('[data-o]'), function (b) {
            b.addEventListener('click', function () { G.applyOpt(gv, c.opts[+b.getAttribute('data-o')]); closeModal(); render(); i++; oneCard(); });
          });
        } });
    }
  }
  function budgetVote(def0) {
    var tgt = G.C.target(gv.year), v = G.vote(gv, null), favorable = gv.deficit <= tgt + 0.2;
    var html = '<div class="brief">' + line('💶', 'Déficit prévu : <b>' + fr(gv.deficit, 1) + ' %</b> du PIB (objectif de l\'année : ' + fr(tgt, 1) + ' %).') +
      line('🔎', '<b>Avis du Haut Conseil des finances publiques</b> : ' + (favorable ? 'prévisions jugées réalistes.' : 'il émet des <b>réserves</b> sur la trajectoire.')) + '</div>' +
      hemicycle(gv.seats, stancesOf(v), true) + '<div class="tally"><span class="t-pour">✅ Pour <b>' + v.pour + '</b></span><span class="t-contre">❌ Contre <b>' + v.contre + '</b></span></div>' + learn('hcfp');
    if (!favorable) gv.popBonus -= 1;
    var buttons = [];
    if (v.passed) buttons.push({ label: '🗳️ Faire voter le budget', primary: true, onClick: function () { done('Le budget est adopté par l\'Assemblée.'); } });
    else {
      var cand = v.groups.filter(function (x) { return x.stance !== 'pour' && E.dist(x.id, me) <= 2; }).sort(function (a, b) { return b.seats - a.seats; })[0];
      if (cand) buttons.push({ label: '🤝 Concéder une dépense à ' + party(cand.id).short + ' (déficit +0,1 pt)', primary: true, onClick: function () {
        gv.deficit += 0.1; var v2 = G.vote(gv, null, cand.id);
        if (v2.passed) done('Grâce à l\'accord avec ' + party(cand.id).short + ', le budget est adopté.');
        else force493();
      } });
      buttons.push({ label: '⚡ 49.3 sur le budget', onClick: force493 });
    }
    modal({ kicker: 'Automne · Vote du budget', title: v.passed ? 'Ton budget a une majorité' : 'Pas de majorité pour ton budget', html: html, buttons: buttons });
    function force493() {
      gv.used493 = true;
      var c = G.censure(gv);
      if (c.passed) {
        G.governmentFalls(gv); gv.deficit += 0.1;
        done('💥 La motion de censure est votée (' + c.pour + ' voix) : le gouvernement tombe. Le budget est finalement adopté par une loi spéciale, plus tard et plus cher (+0,1 pt de déficit).', true);
      } else { gv.survived = true; done('😅 Le 49.3 passe : la censure ne recueille que ' + c.pour + ' voix. Budget adopté sans vote.'); }
    }
    function done(txt, bad) {
      modal({ kicker: 'Le budget', title: bad ? 'Crise politique' : 'Budget adopté', html: '<p' + (bad ? ' class="verdict-bad"' : '') + '>' + txt + '</p>',
        buttons: [{ label: 'Continuer', primary: true, onClick: next }] });
    }
  }

  /* ---------- Hiver : le bilan de l'année ---------- */
  function yearEnd() {
    var y = gv.year, r = G.endYear(gv);
    gv.used493y = false;
    var html = '<div class="brief">' + line('💶', 'Déficit public : <b>' + fr(r.deficit, 1) + ' %</b> du PIB (objectif ' + fr(r.target, 1) + ' %).') +
      line('📈', 'Dette publique : <b>' + fr(r.debt, 0) + ' %</b> du PIB.') + line('😊', 'Popularité : <b>' + r.pop + ' %</b>.') + '</div>' +
      (r.text ? '<p class="verdict-bad">' + esc(r.text) + '</p>' : '<p>Les comptes tiennent la route. Bruxelles ne dit rien… pour l\'instant.</p>') +
      (y === 1 ? learn('trois_pourcent') : y === 2 ? learn('dette') : '');
    step = 0;
    modal({ kicker: 'Hiver · Bilan de l\'année ' + y, title: gv.over ? 'Le mandat s\'achève' : 'Une année de passée', html: html,
      buttons: [{ label: gv.over ? 'Voir le bilan du mandat' : 'Année ' + gv.year, primary: true, onClick: function () { render(); if (gv.over) finalBilan(); } }] });
    render();
  }
  function finalBilan() {
    var v = G.verdict(gv), P = party(me);
    var title = v.verdict === 'reelu' ? 'Réélu pour un second mandat !' : v.verdict === 'serre' ? 'Réélection incertaine' : 'Battu à la présidentielle';
    var html = '<div class="cand-line">' + A.portrait(me) + '<div><b class="cand-name">' + esc(P.candidate) + '</b><span>' + esc(P.name) + '</span></div></div>' +
      '<div class="brief">' + line('📜', 'Promesses tenues : <b>' + v.adopted + ' / ' + gv.measures.length + '</b>') +
      line('💶', 'Déficit final : <b>' + fr(gv.deficit, 1) + ' %</b> (départ ' + fr(G.C.deficit0, 1) + ' %, objectif 3 %)') +
      line('📈', 'Dette : <b>' + fr(gv.debt, 0) + ' %</b> du PIB (départ ' + G.C.debt0 + ' %)') + line('😊', 'Popularité : <b>' + v.pop + ' %</b>') +
      line('🏛️', 'Gouvernements renversés : <b>' + gv.fell + '</b>' + (gv.dissolved ? ' · dissolution' : '')) + '</div>' +
      (v.achievements.length ? '<div class="brief"><div class="kicker">Tes trophées</div>' + v.achievements.map(function (a) { return line('🏅', esc(a)); }).join('') + '</div>' : '') +
      '<p>' + (v.verdict === 'reelu' ? 'Les Français te font confiance pour cinq ans de plus.' : v.verdict === 'serre' ? 'Tu peux te représenter, mais rien n\'est joué : la campagne sera rude.' : 'Les Français veulent tourner la page.') + '</p>';
    modal({ kicker: 'Bilan du quinquennat', title: title, html: html,
      buttons: [{ label: 'Nouvelle campagne', primary: true, onClick: function () { gv = null; U.go('choose'); } }, { label: 'Accueil', onClick: function () { gv = null; U.go('title'); } }] });
  }
})();

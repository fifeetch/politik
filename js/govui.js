/* Politik — v1.0 : l'écran « Gouverner » (le quinquennat). S'appuie sur js/govern.js pour les règles. */
(function () {
  var D = window.PolitikData, E = window.PolitikEngine, G = window.PolitikGov, LG = window.PolitikLegis, FX = window.PolitikFX, CB = window.PolitikCabinet, A = window.PolitikArt, U = window.PolitikUI;
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

  var MAJ_LABEL = { absolue: 'majorité absolue', relative: 'majorité relative', sans: 'sans majorité', cohabitation: 'cohabitation' };
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
      gauge('🏛️', 'Assemblée', bloc + ' / 577', MAJ_LABEL[G.majorityType(gv)], bloc >= 289 ? 'ok' : 'bad');
    $('gov-hemi').innerHTML = hemicycle(gv.seats) + legend(gv.seats);
    renderTeam();
    $('gov-sat').innerHTML = D.SEGMENTS.map(function (s) {
      var v = gv.sat[s.id], f = v >= 65 ? '😀' : v >= 50 ? '🙂' : v >= 35 ? '😐' : v >= 20 ? '🙁' : '😡';
      return '<span class="satc" title="' + esc(s.full) + ' : ' + Math.round(v) + ' / 100">' + s.icon + f + '</span>';
    }).join('');
    $('gov-prog').innerHTML = '<div class="kicker">Tes promesses</div>' + gv.measures.map(function (m) {
      var M = E.measure(m.id), st = m.status === 'adopted' ? (m.amended ? '✅ adoptée (amendée)' : '✅ adoptée') : m.status === 'rejected' ? '❌ rejetée' : '⏳ à faire voter';
      return '<div class="gp-row ' + m.status + '"><span>' + esc(M.name) + '</span><small>' + st + '</small></div>';
    }).join('');
    if (gv.deals && gv.deals.length) $('gov-prog').innerHTML += '<div class="kicker" style="margin-top:8px">Engagements d\'entre-deux-tours</div>' + gv.deals.map(function (d) {
      return '<div class="gp-row"><span>' + esc(E.measure(d.measure).name) + '</span><small>🤝 promis à ' + esc(E.PARTY[d.with].short) + ' · engagement de campagne, sans vote ni soutien automatique à l\'Assemblée</small></div>';
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
    gv = G.create(g, me, { manual: true }); learned = {}; step = -1; lawsThisYear = 0;
    startLegis();   // v2.4 : ta campagne des législatives
  });
  $('gov-next').addEventListener('click', function () {
    if (!gv) return;
    if (gv.over) return finalBilan();
    var s = current();
    if (s === 'legislatives') return gv.legis ? legisNight({ onDone: function () { step = 0; U.go('gov'); render(); } }) : startLegis();
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
        var r = G.dissolve(gv, g);
        legisNight({ dissolution: true, before: r.before, onDone: function () { U.go('gov'); render(); } });
      } }, { label: 'Garder cette Assemblée', onClick: closeModal }] });
  });
  function next() { step = step + 1; if (step >= STEPS.length) { step = 0; } render(); }

  /* ---------- v2.3-2.4 : les législatives ----------
     A. Ta campagne (v2.4) : former ton camp (alliances), 2 tours d'actions sur la carte des circonscriptions disputées.
     B. La soirée du 1er tour : scores par bloc, élus du soir, duels, triangulaires.
     C. Ton entre-deux-tours (v2.4) : te maintenir ou te désister, pacte de désistement, consigne de vote.
     D. Le 2nd tour : l'hémicycle se remplit région par région, puis le verdict. */
  var LMAP = window.PolitikMap, LCP = D.LEGIS.campaign;
  var lgTimers = [];
  function lgLater(fn, ms) { lgTimers.push(setTimeout(fn, ms)); }
  function lgStop() { lgTimers.forEach(clearTimeout); lgTimers = []; }
  function presScore(pid) { var x = (g.result.first || []).filter(function (y) { return y.pid === pid; })[0]; return x ? x.pct : 0; }
  function blocName(b) { return b.id === 'pres' ? (gv.pid === me ? 'Ton camp' : 'Majorité présidentielle') : b.id === me ? 'Toi' : b.name; }
  function blocColor(b) {
    if (b.id === 'pres') return party(gv.pid).color;
    var best = b.parties[0]; b.parties.forEach(function (p) { if (presScore(p) > presScore(best)) best = p; });
    return party(best).color;
  }
  function blocDot(b) { return '<i class="lc-dot" style="background:' + blocColor(b) + '"></i>'; }
  function sv(tag, attrs) { var e = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  /* Les places de l'hémicycle : de gauche à droite, chaque parti occupe sa part (comme hemicycle()) */
  function hemiLayout(seats) {
    var order = D.PARTIES.slice().sort(function (a, b) { return a.pos - b.pos; }).map(function (p) { return p.id; }).filter(function (id) { return seats[id] != null; });
    var rows = 11, r0 = 34, r1 = 96, pts = [], lens = [], sum = 0, total = 577;
    for (var i = 0; i < rows; i++) { var r = r0 + (r1 - r0) * i / (rows - 1); lens.push(r); sum += r; }
    var counts = lens.map(function (l) { return Math.round(total * l / sum); });
    counts[rows - 1] += total - counts.reduce(function (a, b) { return a + b; }, 0);
    lens.forEach(function (r, i) { for (var k = 0; k < counts[i]; k++) { var a = Math.PI * (1 - (k + 0.5) / counts[i]); pts.push({ x: 100 + r * Math.cos(a), y: 104 - r * Math.sin(a), a: a }); } });
    pts.sort(function (p, q) { return q.a - p.a; });
    var j = 0; order.forEach(function (id) { for (var k = 0; k < seats[id]; k++) { pts[j].pid = id; pts[j].k = k; j++; } });
    return pts;
  }

  /* ===== A. La campagne des législatives ===== */
  var lc = null, lsel = null, lproj = null, lctx = null, lr1 = null, ldec = null, lpactTried = false;
  function startLegis() {
    lc = LG.newCampaign(g, { pres: me, margin: gv.margin, loser: gv.loser });
    lsel = null; lctx = null; lr1 = null; ldec = null; lpactTried = false;
    U.go('lcamp'); renderCamp();
    allianceSheet(true);
  }
  function campOf(l) { return [me].concat(l.allies); }
  /* Former son camp : candidatures communes dès le 1er tour */
  function allianceSheet(first) {
    var others = g.players.map(function (p) { return p.id; }).filter(function (p) { return p !== me && lc.allies.indexOf(p) < 0; })
      .sort(function (a, b) { return E.dist(a, me) - E.dist(b, me) || presScore(b) - presScore(a); });
    var html = (first ? '<p>Dans chaque circonscription, une seule candidature par camp : tes alliés te laissent la place ici, tu leur laisses ailleurs. Seul, ton parti affronte tout le monde.</p>' : '') +
      '<div class="lc-camp">' + campOf(lc).map(function (p) { return '<span class="lc-chip" style="--c:' + party(p).color + '">' + (p === me ? 'Toi' : esc(party(p).short)) + '</span>'; }).join('') + '</div>' +
      '<p class="hint">' + (lc.offersLeft ? 'Encore <b>' + lc.offersLeft + ' proposition' + (lc.offersLeft > 1 ? 's' : '') + '</b>. Plus un parti est proche de toi, plus il dit oui ; ses électeurs suivent aussi mieux.' : 'Plus de proposition possible.') + '</p>' +
      '<div class="pick">' + others.map(function (p) {
        var ch = LG.allyChance(g, me, p, lc.tries[p]), d = E.dist(p, me), P = party(p);
        return '<button type="button" class="pick-row lc-ally" data-ally="' + p + '"' + (lc.offersLeft ? '' : ' disabled') + '><span class="who" style="background:' + P.color + ';color:' + P.ink + '">' + p + '</span><span class="pick-txt"><b>' + esc(P.short) + '</b><small>' +
          (d <= 1 ? 'ton camp' : d === 2 ? 'proche' : d === 3 ? 'l\'autre camp' : 'très loin de toi') + ' · ' + (100 * presScore(p)).toFixed(0) + ' % à la présidentielle' + (lc.refused[p] ? ' · a refusé' : '') + '</small></span><b class="lc-pct">' + Math.round(100 * ch) + ' %</b></button>';
      }).join('') + '</div>';
    modal({ kicker: 'Législatives · avant le 1er tour', title: 'Former ton camp', html: html,
      buttons: [{ label: first ? 'Partir en campagne' : 'Retour à la carte', primary: true, onClick: renderCamp }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-ally]'), function (b) {
          b.addEventListener('click', function () {
            var p = b.getAttribute('data-ally'), r = LG.offerAlly(g, lc, p);
            if (!r.ok) return toast(r.text);
            toast(r.accepted ? '🤝 ' + party(p).short + ' rejoint ton camp !' : '❌ ' + party(p).short + ' refuse.');
            allianceSheet(first);
          });
        });
      } });
  }
  function regColor(rc) { return rc.seats ? (rc.safe + rc.open / 2) / rc.seats : 0; }
  function renderCamp() {
    lproj = LG.projection(g, lc);
    var cls = lproj.cls, seats = lproj.res.outcome.campSeats, P = party(me);
    $('lc-title').textContent = 'Tour ' + lc.turn + ' sur ' + LCP.turns;
    $('lc-left').textContent = lc.left + ' action' + (lc.left > 1 ? 's' : '');
    $('lc-camp').innerHTML = campOf(lc).map(function (p) { return '<span class="lc-chip" style="--c:' + party(p).color + '">' + (p === me ? 'Toi' : esc(party(p).short)) + '</span>'; }).join('') +
      (lc.offersLeft ? '<button type="button" class="lc-chip lc-add" id="lc-add">+ allié</button>' : '');
    if ($('lc-add')) $('lc-add').onclick = function () { allianceSheet(false); };
    $('lc-proj').innerHTML = '<div class="lc-pl"><span>Projection</span><b>' + seats + ' sièges</b></div>' +
      '<div class="lg-bar lc-bar"><i style="background:' + P.color + ';width:' + Math.min(100, 100 * seats / 400).toFixed(1) + '%"></i><span class="lg-maj" style="left:' + (100 * 289 / 400).toFixed(1) + '%"></span></div>' +
      '<div class="lc-cls"><span>🟢 <b>' + cls.safe + '</b> sûres</span><span>⚖️ <b>' + cls.open + '</b> disputées</span><span>🔴 <b>' + cls.lost + '</b> perdues</span></div>';
    // la carte : plus la région est à toi, plus elle prend ta couleur ; le badge compte ses circonscriptions disputées
    var s = $('lc-map'); s.innerHTML = '';
    D.REGIONS.forEach(function (r) {
      var rc = cls.regions[r.id], p = sv('path', { d: LMAP.regions[r.id].d, fill: P.color, 'fill-opacity': (0.12 + 0.8 * regColor(rc)).toFixed(2), stroke: '#FAFAF6', 'stroke-width': 1.6, 'stroke-linejoin': 'round', class: 'lc-reg', 'data-rid': r.id });
      p.addEventListener('click', function () { lsel = r.id; renderCamp(); });
      s.appendChild(p);
    });
    if (lsel) s.appendChild(sv('path', { d: LMAP.regions[lsel].d, class: 'sel' }));
    D.REGIONS.forEach(function (r) {
      var rc = cls.regions[r.id], m = LMAP.regions[r.id]; if (!rc.open) return;
      var gb = sv('g', { class: 'lc-badge' });
      gb.appendChild(sv('circle', { cx: m.x, cy: m.y, r: 10 }));
      var t = sv('text', { x: m.x, y: m.y + 3.5 }); t.textContent = rc.open; gb.appendChild(t);
      gb.addEventListener('click', function () { lsel = r.id; renderCamp(); });
      s.appendChild(gb);
    });
    // la région choisie et les actions
    var info = $('lc-info');
    if (!lsel) info.innerHTML = '<p class="lc-hint">Touche une région : les chiffres ⚖️ comptent ses circonscriptions <b>disputées</b>, celles qui peuvent basculer.</p>';
    else { var rc = cls.regions[lsel]; info.innerHTML = '<span><b>' + esc(E.REG[lsel].name) + '</b> · ' + rc.seats + ' sièges</span><small>🟢 ' + rc.safe + ' sûres · ⚖️ ' + rc.open + ' disputées · 🔴 ' + rc.lost + ' perdues</small>'; }
    var acts = [
      { type: 'meeting', icon: '📣', name: 'Le président en meeting', sub: 'use ta popularité (−' + LCP.meetingPop + ')' },
      { type: 'vedette', icon: '🌟', name: 'Investir une vedette', sub: (LCP.vedetteMax - lc.vedettes) + ' vedette' + (LCP.vedetteMax - lc.vedettes > 1 ? 's' : '') + ' en réserve' },
      { type: 'mobilise', icon: '🚪', name: 'Mobiliser', sub: 'porte-à-porte, surtout là où l\'on vote peu' },
      { type: 'clip', icon: '📺', name: 'Clip national', sub: 'un peu partout' }
    ];
    $('lc-acts').innerHTML = acts.map(function (a) {
      var err = LG.actError(g, lc, { type: a.type, rid: lsel }), gain = !err ? previewGain(a.type) : null;
      return '<button type="button" class="lc-act" data-act="' + a.type + '"' + (err ? ' disabled' : '') + '><span class="lc-ai">' + a.icon + '</span><span class="lc-at"><b>' + a.name + '</b><small>' +
        (err ? esc(err) : (gain > 0 ? '≈ +' + gain + ' siège' + (gain > 1 ? 's' : '') : 'peu d\'effet ici') + ' · ' + esc(a.sub)) + '</small></span></button>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('[data-act]'), function (b) { b.addEventListener('click', function () { doAct(b.getAttribute('data-act')); }); });
    $('lc-advisor').innerHTML = '<span class="adv-face">' + A.advisor() + '</span><p><b>Lulu :</b> ' + esc(campAdvice(seats, cls)) + '</p>';
    $('lc-next').textContent = lc.left > 0 ? 'Fin du tour (' + lc.left + ' action' + (lc.left > 1 ? 's' : '') + ' perdue' + (lc.left > 1 ? 's' : '') + ')' : lc.turn < LCP.turns ? 'Tour suivant' : 'Aller voter';
    if (lc.left === 0) $('lc-next').textContent = lc.turn < LCP.turns ? 'Tour suivant' : 'Le 1er tour';
    else $('lc-next').textContent = 'Fin du tour';
  }
  /* Combien de sièges rapporterait une action (projection avec l'action jouée) */
  function previewGain(type) {
    if (type !== 'clip' && !lsel) return 0;
    var copy = JSON.parse(JSON.stringify(lc)), r = LG.act(g, copy, { type: type, rid: lsel });
    if (!r.ok) return 0;
    return LG.projection(g, copy).res.outcome.campSeats - lproj.res.outcome.campSeats;
  }
  function campAdvice(seats, cls) {
    if (!lc.allies.length) return 'Seul, ton parti affronte tout le monde dans 577 circonscriptions. Propose des alliances aux partis proches : touche « + allié ».';
    if (seats < 289) return 'Il te manque ' + (289 - seats) + ' sièges. Vise les régions avec beaucoup de circonscriptions disputées (⚖️) : c\'est là que tout se joue.';
    if (cls.open > 40) return 'Tu es en route pour la majorité, mais ' + cls.open + ' circonscriptions restent disputées. Rien n\'est joué avant le vote.';
    return 'La majorité se dessine. Garde le rythme jusqu\'au bout !';
  }
  function doAct(type) {
    if (type !== 'clip' && !lsel) return toast('Touche d\'abord une région.');
    var before = lproj.res.outcome.campSeats, r = LG.act(g, lc, { type: type, rid: lsel });
    if (!r.ok) return toast(r.text);
    if (r.pop) gv.popBonus += r.pop;
    renderCamp();
    var d = lproj.res.outcome.campSeats - before;
    toast(d > 0 ? '+' + d + ' siège' + (d > 1 ? 's' : '') + ' dans la projection' : 'La projection ne bouge presque pas');
  }
  $('lc-next').addEventListener('click', function () {
    if (!lc) return;
    var before = lproj.res.outcome.campSeats, moves = LG.endTurn(g, lc), last = lc.turn > LCP.turns;
    if (last) lc.turn = LCP.turns;
    lproj = LG.projection(g, lc);
    var after = lproj.res.outcome.campSeats, seen = {};
    var html = '<div class="brief">' + moves.filter(function (m) { var k = m.u; if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 4).map(function (m) {
      var u = lproj.res.unions.filter(function (x) { return x.id === m.u; })[0];
      return line(blocDot(u), '<b>' + esc(blocName(u)) + '</b> fait campagne en ' + esc(E.REG[m.r].name) + '.');
    }).join('') + '</div><p>Projection : <b>' + after + ' sièges</b> pour ton camp (' + (after - before >= 0 ? '+' : '') + (after - before) + ').</p>';
    modal({ kicker: 'Législatives', title: last ? 'Fin de la campagne' : 'Les autres font campagne', html: html,
      buttons: [{ label: last ? 'Le 1er tour' : 'Tour ' + lc.turn, primary: true, onClick: function () { if (last) vote1(); else renderCamp(); } }] });
  });
  function vote1() {
    lctx = LG.prepare(g, LG.optsOf(lc, { rng: g.rng }));
    lr1 = LG.round1(lctx);
    night1({ unions: lctx.unions, votes1: lr1.votes1, participation1: lr1.participation1, circs: lr1.circs, regions: null }, { btn: 'Ton entre-deux-tours', next: betweenScreen });
  }

  /* ===== C. Ton entre-deux-tours ===== */
  function betweenScreen() {
    lgStop();
    if (!ldec) ldec = { withdraw: {}, pact: null, barrage: null };
    var choices = LG.campChoices(lctx, lr1), projCtx = Object.assign({}, lctx, { opts: Object.assign({}, lctx.opts, { project: true }) });
    var proj = LG.round2(projCtx, lr1, ldec), seats = proj.outcome.campSeats;
    $('lb-proj').innerHTML = '<div class="lc-pl"><span>Projection du 2nd tour</span><b>' + seats + ' sièges</b></div>' +
      '<div class="lg-bar lc-bar"><i style="background:' + party(me).color + ';width:' + Math.min(100, 100 * seats / 400).toFixed(1) + '%"></i><span class="lg-maj" style="left:' + (100 * 289 / 400).toFixed(1) + '%"></span></div>';
    var U2 = lctx.unions, byId = {}; U2.forEach(function (u) { byId[u.id] = u; });
    // 1. Tes triangulaires
    $('lb-tri').hidden = !choices.length;
    $('lb-tri').innerHTML = '<div class="kicker">Tes triangulaires · ' + choices.length + '</div><p class="hint">Ton candidat est 3e. Te maintenir, c\'est garder tes chances ; te désister, c\'est aider un candidat plus proche de toi à battre le premier.</p>' +
      choices.slice(0, 12).map(function (c) {
        var mine = c.q.filter(function (x) { return x.u === 'pres'; })[0], lead = c.q[0], out = !!ldec.withdraw[c.i];
        return '<div class="lb-row"><span class="lb-txt"><b>' + esc(E.REG[c.r].name) + '</b><small>toi ' + Math.round(100 * mine.v) + ' % · ' + c.q.filter(function (x) { return x !== mine; }).map(function (x) { return esc(blocName(byId[x.u])) + ' ' + Math.round(100 * x.v) + ' %'; }).join(' · ') + '</small></span>' +
          '<span class="seg2"><button type="button" data-w="' + c.i + '" data-v="0" aria-pressed="' + !out + '">Rester</button><button type="button" data-w="' + c.i + '" data-v="1" aria-pressed="' + out + '">Se retirer</button></span></div>';
      }).join('') + (choices.length > 12 ? '<p class="hint">… et ' + (choices.length - 12) + ' autres, réglées comme la dernière.</p>' : '');
    // 2. Le pacte « je me retire ici, tu te retires là »
    var rivals = U2.filter(function (u) { return !u.pres && (lr1.votes1[u.id] || 0) > 0.04 * lr1.exprimes1; })
      .sort(function (a, b) { return LG.pactChance(lctx, b.id) - LG.pactChance(lctx, a.id); });
    $('lb-pact').innerHTML = '<div class="kicker">Pacte de désistement</div><p class="hint">« Je me retire ici, tu te retires là » : dans vos triangulaires communes, le moins bien placé se retire et appelle à voter pour l\'autre. Une seule tentative.</p>' +
      (ldec.pact ? '<p>🤝 Pacte conclu avec <b>' + esc(blocName(byId[ldec.pact])) + '</b>.</p>' : lpactTried ? '<p>❌ Ta proposition a été refusée.</p>' :
        '<div class="pick">' + rivals.slice(0, 4).map(function (u) {
          return '<button type="button" class="pick-row lc-ally" data-pact="' + u.id + '">' + blocDot(u) + '<span class="pick-txt"><b>' + esc(blocName(u)) + '</b><small>' + fr(100 * (lr1.votes1[u.id] || 0) / lr1.exprimes1, 1) + ' % au 1er tour</small></span><b class="lc-pct">' + Math.round(100 * LG.pactChance(lctx, u.id)) + ' %</b></button>';
        }).join('') + '</div>');
    // 3. La consigne de vote là où ton camp n'est plus en lice
    var targets = rivals.filter(function (u) { return u.id !== ldec.pact; }).sort(function (a, b) { return (lr1.votes1[b.id] || 0) - (lr1.votes1[a.id] || 0); }).slice(0, 4);
    $('lb-cons').innerHTML = '<div class="kicker">Ta consigne de vote</div><p class="hint">Là où ton camp est éliminé, tes électeurs t\'écoutent un peu : appelle-les à faire barrage à un bloc.</p><div class="lb-chips">' +
      '<button type="button" data-bar="" aria-pressed="' + !ldec.barrage + '">Aucune consigne</button>' + targets.map(function (u) {
        return '<button type="button" data-bar="' + u.id + '" aria-pressed="' + (ldec.barrage === u.id) + '">Barrage à ' + esc(blocName(u)) + '</button>';
      }).join('') + '</div>';
    Array.prototype.forEach.call(document.querySelectorAll('[data-w]'), function (b) { b.addEventListener('click', function () { ldec.withdraw[+b.getAttribute('data-w')] = b.getAttribute('data-v') === '1'; betweenScreen(); }); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-bar]'), function (b) { b.addEventListener('click', function () { ldec.barrage = b.getAttribute('data-bar') || null; betweenScreen(); }); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-pact]'), function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-pact'), ch = LG.pactChance(lctx, id); lpactTried = true;
        if (g.rng() < ch) { ldec.pact = id; toast('🤝 Pacte conclu avec ' + blocName(byId[id]) + ' !'); } else toast('❌ ' + blocName(byId[id]) + ' refuse ton pacte.');
        betweenScreen();
      });
    });
    U.go('lbtw');
  }
  $('lb-go').addEventListener('click', function () {
    if (!lctx) return;
    var res = LG.round2(lctx, lr1, ldec);
    G.setLegis(gv, res);
    night2({ onDone: function () { step = 0; startCabinet(); } });   // v2.6 : puis tu formes ton gouvernement
  });

  /* ===== B. La soirée du 1er tour ===== */
  /* s : unions, votes1, participation1, circs (status, winner, q) — o : dissolution, btn, next */
  function night1(s, o) {
    lgStop(); $('toast').hidden = true;
    var lead = {}; s.circs.forEach(function (c) { var p = c.c1[0].pid; lead[p] = (lead[p] || 0) + 1; });
    g.players.forEach(function (p) { if (lead[p.id] == null) lead[p.id] = 0; });
    var layout = hemiLayout(lead), e1 = {}, n1 = 0, duels = 0, tri = 0;
    s.circs.forEach(function (c) { if (c.status === 'elu1') { e1[c.winner] = (e1[c.winner] || 0) + 1; n1++; } else if (c.q && c.q.length >= 3) tri++; else duels++; });
    $('lg-kicker').textContent = o.dissolution ? 'Législatives anticipées' : 'Juin · Élections législatives';
    $('lg-title').textContent = o.dissolution ? 'Les Français revotent' : 'Le 1er tour';
    var shown = {};
    $('lg-hemi').innerHTML = '<svg viewBox="0 0 200 110" aria-label="Hémicycle de l\'Assemblée nationale">' + layout.map(function (pt) {
      var on = pt.pid && (shown[pt.pid] = (shown[pt.pid] || 0)) < (e1[pt.pid] || 0); if (on) shown[pt.pid]++;
      return '<circle cx="' + pt.x.toFixed(1) + '" cy="' + pt.y.toFixed(1) + '" r="2.3" fill="' + (on ? party(pt.pid).color : '#3A3560') + '"/>';
    }).join('') + '<text x="100" y="100" text-anchor="middle" class="hemi-n">' + n1 + '</text><text x="100" y="108" text-anchor="middle" class="hemi-l">élus dès ce soir</text></svg>';
    var camp1 = 0; s.circs.forEach(function (c) { if (c.status === 'elu1' && c.c1[0].u === 'pres') camp1++; });
    $('lg-camp').innerHTML = campBar(camp1);
    var tot1 = 0; Object.keys(s.votes1).forEach(function (k) { tot1 += s.votes1[k]; });
    var bl = s.unions.map(function (u) { return Object.assign({ pct: (s.votes1[u.id] || 0) / tot1 }, u); }).sort(function (a, b) { return b.pct - a.pct; });
    var top = bl.slice(0, 4), rest = 1 - top.reduce(function (a, b) { return a + b.pct; }, 0), maxp = top[0].pct;
    $('lg-stage').innerHTML =
      '<div class="night-turnout"><span>Participation <b>' + fr(100 * s.participation1, 1) + ' %</b></span><span>' + (top[0].pres && gv.pid === me ? 'Ton camp arrive en tête' : esc(blocName(top[0])) + ' en tête') + '</span></div>' +
      top.map(function (b) {
        return '<div class="nb-row"><span class="nb-lbl">' + esc(blocName(b)) + '</span><span class="nb-bar"><i style="background:' + blocColor(b) + ';width:' + (100 * b.pct / maxp).toFixed(0) + '%"></i></span><b>' + fr(100 * b.pct, 1) + ' %</b></div>';
      }).join('') + '<div class="nb-row"><span class="nb-lbl">Autres partis</span><span class="nb-bar"><i style="background:#8E8AA8;width:' + (100 * rest / maxp).toFixed(0) + '%"></i></span><b>' + fr(100 * rest, 1) + ' %</b></div>' +
      '<div class="lg-counts"><span class="lg-count"><b>' + n1 + '</b>élus dès ce soir</span><span class="lg-count"><b>' + duels + '</b>duels</span><span class="lg-count"><b>' + tri + '</b>triangulaires</span></div>' +
      '<button type="button" class="lg-more" id="lg-learn1">📚 Comment on devient député</button>';
    $('lg-learn1').onclick = learnLegis;
    $('lg-btn').textContent = o.btn || 'Le second tour';
    $('lg-btn').onclick = function () { lgStop(); o.next(); };
    U.go('legis');
  }
  function campBar(cs) {
    return '<div class="lg-campline"><span>' + (gv.pid === me ? 'Ton camp' : 'Majorité présidentielle') + '</span><b id="lg-cs">' + cs + '</b></div>' +
      '<div class="lg-bar"><i id="lg-cbar" style="background:' + party(gv.pid).color + ';width:' + Math.min(100, 100 * cs / 400).toFixed(1) + '%"></i><span class="lg-maj" style="left:' + (100 * 289 / 400).toFixed(1) + '%"></span></div>';
  }
  function learnLegis() {
    var L1 = D.LEARN.scrutin_legis, L2 = D.LEARN.locomotive;
    modal({ kicker: 'Le saviez-vous ?', title: L1.title, html: '<p>' + esc(L1.text) + '</p>' + srcHtml(L1) + '<h3>' + esc(L2.title) + '</h3><p>' + esc(L2.text) + '</p>' + srcHtml(L2) });
  }

  /* ===== D. Le 2nd tour et le verdict (résultat dans gv.legis) — o : dissolution, before, onDone ===== */
  function night2(o) {
    lgStop();
    var res = gv.legis, out = res.outcome, layout = hemiLayout(res.seats), shown = {}, campSet = {};
    out.camp.forEach(function (p) { campSet[p] = true; });
    Object.keys(res.seats).forEach(function (p) { shown[p] = 0; });
    $('lg-kicker').textContent = (o.dissolution ? 'Législatives anticipées' : 'Juin · Élections législatives') + ' · 2nd tour';
    $('lg-title').textContent = 'L\'Assemblée se remplit';
    $('lg-hemi').innerHTML = '<svg viewBox="0 0 200 110" aria-label="Hémicycle de l\'Assemblée nationale">' + layout.map(function (pt, i) {
      return '<circle id="lgd' + i + '" cx="' + pt.x.toFixed(1) + '" cy="' + pt.y.toFixed(1) + '" r="2.3" fill="#3A3560"/>';
    }).join('') + '<text x="100" y="100" text-anchor="middle" class="hemi-n" id="lg-n">0</text><text x="100" y="108" text-anchor="middle" class="hemi-l">députés élus</text></svg>';
    $('lg-camp').innerHTML = campBar(0);
    function seat(pid, n) {
      for (var i = 0; i < layout.length; i++) {
        var pt = layout[i]; if (pt.pid !== pid || pt.k < shown[pid] || pt.k >= shown[pid] + n) continue;
        var c = $('lgd' + i); c.setAttribute('fill', party(pid).color); FX.replay(c, 'new');
      }
      shown[pid] += n;
    }
    function refresh() {
      var tot = 0, cs = 0; Object.keys(shown).forEach(function (p) { tot += shown[p]; if (campSet[p]) cs += shown[p]; });
      $('lg-n').textContent = tot; $('lg-cs').textContent = cs;
      $('lg-cbar').style.width = Math.min(100, 100 * cs / 400) + '%';
    }
    // les élus du 1er tour sont déjà assis
    var e1 = {}; res.circs.forEach(function (c) { if (c.status === 'elu1') e1[c.winner] = (e1[c.winner] || 0) + 1; });
    Object.keys(e1).forEach(function (p) { seat(p, e1[p]); }); refresh();
    $('lg-stage').innerHTML = '<p class="lg-ticker" id="lg-tick">Les bureaux ferment…</p>';
    var order = D.REGIONS.slice().sort(function (a, b) { return a.seats - b.seats; }), done = {};
    $('lg-btn').textContent = 'Passer';
    $('lg-btn').onclick = function () { lgStop(); order.forEach(fill); verdict(); };
    U.go('legis');
    function fill(r) {
      if (done[r.id]) return; done[r.id] = true;
      var add = {}, camp = 0;
      res.circs.forEach(function (c) { if (c.r === r.id && c.status !== 'elu1') add[c.winner] = (add[c.winner] || 0) + 1; });
      Object.keys(add).forEach(function (p) { seat(p, add[p]); });
      Object.keys(res.regions[r.id].seats).forEach(function (p) { if (campSet[p]) camp += res.regions[r.id].seats[p]; });
      refresh();
      var t = $('lg-tick'); if (t) { t.innerHTML = '<b>' + esc(r.name) + '</b> : ' + (gv.pid === me ? 'ton camp' : 'la majorité') + ' ' + camp + ' sur ' + r.seats; FX.replay(t, 'bump'); }
    }
    order.forEach(function (r, i) { lgLater(function () { fill(r); }, 500 + i * 560); });
    lgLater(verdict, 500 + order.length * 560 + 500);
    function verdict() {
      lgStop(); refresh();
      var t = out.type, cs = out.campSeats, riv = out.rival;
      var title = t === 'absolue' ? 'Majorité absolue !' : t === 'relative' ? 'Majorité relative' : t === 'sans' ? 'Pas de majorité' : 'Cohabitation';
      var txt = t === 'absolue' ? 'Avec <b>' + cs + ' députés</b>, ton camp dépasse les 289 sièges : tu as les mains libres… tant que tes députés te suivent.' :
        t === 'relative' ? 'Ton camp arrive en tête avec <b>' + cs + ' députés</b>, mais il en manque <b>' + (289 - cs) + '</b> pour la majorité. Chaque loi sera une bataille.' :
        t === 'sans' ? 'Aucun bloc n\'a la majorité, et ' + esc(blocName(riv)) + ' (' + riv.seats + ') devance ton camp (' + cs + '). Il faudra négocier chaque texte.' :
        esc(blocName(riv)) + ' obtient <b>' + riv.seats + ' sièges</b> : la majorité absolue contre toi. En vrai, le président devrait nommer un Premier ministre de cette majorité, qui conduirait la politique du pays.';
      if (o.dissolution && o.before != null) txt += '<br>Ton camp passe de <b>' + o.before + '</b> à <b>' + cs + '</b> députés : ' + (cs >= o.before ? 'pari gagné.' : 'pari perdu.');
      $('lg-title').textContent = title;
      $('lg-kicker').textContent = o.dissolution ? 'Législatives anticipées · résultat' : 'Le résultat des législatives';
      $('lg-stage').innerHTML = '<p class="lg-verdict">' + txt + '</p><div class="hemi-leg">' + out.blocs.filter(function (b) { return b.seats > 0; }).map(function (b) {
        return '<span><i style="background:' + blocColor(b) + '"></i>' + esc(blocName(b)) + ' ' + b.seats + '</span>';
      }).join('') + '</div>' + '<button type="button" class="lg-more" id="lg-regions">Région par région ›</button>' +
        '<button type="button" class="lg-more" id="lg-learn">📚 Comment on devient député</button>';
      $('lg-regions').onclick = regionsDetail;
      $('lg-learn').onclick = learnLegis;
      $('lg-btn').textContent = 'Au travail !';
      $('lg-btn').onclick = function () { lgStop(); o.onDone && o.onDone(); };
    }
  }
  /* Les législatives jouées sans campagne (dissolution) : 1er tour puis 2nd tour, à partir de gv.legis */
  function legisNight(o) {
    var res = gv.legis;
    night1({ unions: res.unions, votes1: res.votes1, participation1: res.participation1, circs: res.circs }, { dissolution: o.dissolution, next: function () { night2(o); } });
  }
  /* Le détail, région par région : élus au 1er tour, duels, triangulaires et sièges de chaque bloc */
  function regionsDetail() {
    var res = gv.legis, out = res.outcome;
    var html = D.REGIONS.slice().sort(function (a, b) { return b.seats - a.seats; }).map(function (r) {
      var rg = res.regions[r.id], parts = out.blocs.map(function (b) {
        var n = 0; b.parties.forEach(function (p) { n += rg.seats[p] || 0; }); return { b: b, n: n };
      }).filter(function (x) { return x.n > 0; }).sort(function (a, b) { return b.n - a.n; });
      return '<div class="lg-reg"><b>' + esc(r.name) + ' · ' + r.seats + ' sièges</b><small>' + rg.elu1 + ' élu' + (rg.elu1 > 1 ? 's' : '') + ' au 1er tour · ' + rg.duel + ' duel' + (rg.duel > 1 ? 's' : '') + ' · ' + rg.tri + ' triangulaire' + (rg.tri > 1 ? 's' : '') + (rg.desist ? ' · ' + rg.desist + ' désistement' + (rg.desist > 1 ? 's' : '') : '') + '</small>' +
        '<small>' + parts.map(function (x) { return esc(blocName(x.b)) + ' <b>' + x.n + '</b>'; }).join(' · ') + '</small>' +
        '<span class="lg-seg">' + parts.map(function (x) { return '<i style="flex:' + x.n + ';background:' + blocColor(x.b) + '"></i>'; }).join('') + '</span></div>';
    }).join('');
    modal({ kicker: 'Législatives', title: 'Région par région', html: html });
  }


  /* ===== v2.6 : le gouvernement ===== */
  var POSTS = D.MINISTRY.posts, TRAITS = D.MINISTRY.traits, gform = {};
  function postDef(id) { return POSTS.filter(function (p) { return p.id === id; })[0]; }
  function mface(x) { return A.face(Object.assign({}, x.face, { bg: x.party ? PolitikPerso.lighten(party(x.party).color, 0.55) : '#E3E0D6' })); }
  function starsTxt(n) { return '★★★'.slice(0, n) + '<span class="st-off">' + '★★★'.slice(0, 3 - n) + '</span>'; }
  function originTxt(x) {
    return x.origin === 'parti' ? 'Ton parti' + (x.region ? ' · député' + (x.sex === 'f' ? 'e' : '') + ', ' + esc(E.REG[x.region].name) : '') :
      x.origin === 'allie' ? 'Allié · ' + esc(party(x.party).short) : x.origin === 'expert' ? 'Société civile' : x.origin === 'impose' ? 'Imposé par la majorité · ' + esc(party(x.party).short) : 'Ouverture · ' + esc(party(x.party).short);
  }
  function mcard(x, extra) {
    var t = TRAITS[x.trait];
    return '<span class="mc-face">' + mface(x) + '</span><span class="mc-txt"><b>' + esc(x.name) + '</b><small class="mc-or">' + originTxt(x) + '</small>' +
      '<small class="mc-st">Compétence ' + starsTxt(x.comp) + ' · Loyauté ' + starsTxt(x.loy) + ' · Notoriété ' + starsTxt(x.not) + '</small>' +
      '<small>' + t.icon + ' <b>' + esc(t.name) + '</b> : ' + esc(t.text) + '</small>' + (extra || '') + '</span>';
  }
  function startCabinet() {
    CB.start(gv); gform = Object.assign({}, gv.cabinet.posts);
    renderForm(); U.go('gform');
  }
  function renderForm() {
    var cab = gv.cabinet, ck = CB.check(gv, gform);
    $('gf-posts').innerHTML = POSTS.map(function (p) {
      var x = gform[p.id], locked = cab.imposed && p.id === 'pm';
      return '<button type="button" class="gf-post' + (x ? ' full' : '') + '" data-post="' + p.id + '"' + (locked ? ' disabled' : '') + '><span class="gf-ic">' + p.icon + '</span><span class="gf-pt"><b>' + esc(p.name) + '</b>' +
        (x ? '<small>' + esc(x.name) + ' · ' + originTxt(x) + (locked ? ' · imposé' : '') + '</small>' : '<small class="gf-empty">Choisir ›</small>') + '</span>' + (x ? '<span class="gf-face">' + mface(x) + '</span>' : '') + '</button>';
    }).join('');
    var allies = (gv.allies || []).filter(function (a) { return gv.seats[a] > 0; });
    $('gf-check').innerHTML = '<span class="' + (ck.parity === 'ok' ? 'ok' : ck.parity === 'bad' ? 'bad' : '') + '">⚖️ ' + ck.f + ' femme' + (ck.f > 1 ? 's' : '') + ' · ' + ck.m + ' homme' + (ck.m > 1 ? 's' : '') + (ck.parity === 'ok' ? ' : parité' : '') + '</span>' +
      allies.map(function (a) { var bad = ck.unserved.indexOf(a) >= 0; return '<span class="' + (bad ? 'bad' : 'ok') + '">' + (bad ? '⚠️ ' : '✅ ') + esc(party(a).short) + (bad ? ' : aucun poste, il quittera ta majorité' : ' a son ministère') + '</span>'; }).join('') +
      (cab.imposed ? '<span class="bad">🏛️ Cohabitation : Matignon revient à la majorité de l\'Assemblée</span>' : '');
    $('gf-go').disabled = !ck.full;
    $('gf-go').textContent = ck.full ? 'Nommer le gouvernement' : 'Encore ' + (6 - (ck.f + ck.m)) + ' poste' + (6 - (ck.f + ck.m) > 1 ? 's' : '') + ' à pourvoir';
    Array.prototype.forEach.call(document.querySelectorAll('[data-post]'), function (b) { b.addEventListener('click', function () { pickMinister(b.getAttribute('data-post')); }); });
  }
  function pickMinister(post) {
    var P = postDef(post), taken = {}; Object.keys(gform).forEach(function (k) { if (k !== post && gform[k]) taken[gform[k].id] = k; });
    var list = gv.cabinet.pool.filter(function (x) { return post !== 'pm' || x.origin !== 'ouverture'; });
    var html = '<p class="hint">' + esc(P.text) + '</p><div class="pick">' + list.map(function (x) {
      var where = taken[x.id];
      return '<button type="button" class="pick-row mc" data-m="' + x.id + '">' + mcard(x, where ? '<small class="mc-where">déjà à ' + esc(postDef(where).short) + ' : il changera de poste</small>' : '') + '</button>';
    }).join('') + '</div>';
    modal({ kicker: P.icon + ' ' + P.name, title: 'Qui nommer ?', html: html, buttons: [{ label: 'Annuler' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-m]'), function (b) {
          b.addEventListener('click', function () {
            var x = gv.cabinet.pool.filter(function (y) { return y.id === b.getAttribute('data-m'); })[0];
            Object.keys(gform).forEach(function (k) { if (gform[k] === x) delete gform[k]; });
            gform[post] = x; closeModal(); renderForm();
          });
        });
      } });
  }
  $('gf-lulu').addEventListener('click', function () { gform = CB.suggest(gv); renderForm(); toast('Lulu : « Les plus compétents aux postes clés, un ministère pour chaque allié. »'); });
  $('gf-go').addEventListener('click', function () {
    var r = CB.form(gv, gform);
    var html = '<div class="gf-team">' + POSTS.map(function (p) { var x = gv.cabinet.posts[p.id]; return '<div class="gf-mini"><span class="gf-face">' + mface(x) + '</span><small>' + p.icon + ' ' + esc(p.short) + '</small><b>' + esc(x.name) + '</b></div>'; }).join('') + '</div>' +
      (r.notes.length ? '<div class="brief">' + r.notes.map(function (n) { return line(n.icon, esc(n.text)); }).join('') + '</div>' : '') +
      '<p class="hint">Un ministre compétent fait mieux passer les lois de son domaine ; un ministre peu loyal peut lancer une fronde ; un ministre connu fait parler de lui, en bien comme en mal. Un remaniement est possible chaque année.</p>';
    modal({ kicker: 'Le perron de l\'Élysée', title: 'Ton gouvernement est nommé', html: html, buttons: [{ label: 'Au travail !', primary: true, onClick: function () { U.go('gov'); render(); } }] });
  });
  /* La ligne « Ton gouvernement » de l'écran principal */
  function renderTeam() {
    var el = $('gov-team'); if (!el) return;
    if (!gv.cabinet || !gv.cabinet.posts.eco) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '<span class="kicker">Ton gouvernement</span><span class="gt-faces">' + POSTS.map(function (p) { var x = gv.cabinet.posts[p.id]; return x ? '<span class="gt-face" title="' + esc(p.short + ' : ' + x.name) + '">' + mface(x) + '</span>' : ''; }).join('') + '</span>' +
      (CB.canReshuffle(gv) ? '<span class="gt-re">Remanier ›</span>' : '<span class="gt-re off">Voir ›</span>');
  }
  document.getElementById('gov-team').addEventListener('click', function () {
    if (!gv || !gv.cabinet) return;
    var can = CB.canReshuffle(gv);
    var html = '<div class="pick">' + POSTS.map(function (p) { var x = gv.cabinet.posts[p.id]; return '<div class="pick-row mc static"><span class="gf-ic">' + p.icon + '</span>' + mcard(x, '<small class="mc-where">' + esc(p.name) + '</small>') + '</div>'; }).join('') + '</div>' +
      '<p class="hint">' + (can ? 'Un remaniement par an : remplace un ministre. Changer de Premier ministre, c\'est le fusible : ' + (gv.cabinet.fusibleUsed ? '+1' : '+' + D.MINISTRY.fusible) + ' de popularité.' : 'Tu as déjà remanié cette année.') + '</p>';
    modal({ kicker: 'Le gouvernement', title: 'Ton équipe', html: html, buttons: (can ? [{ label: '🔄 Remanier', primary: true, onClick: reshuffleStep }] : []).concat([{ label: 'Fermer' }]) });
  });
  function reshuffleStep() {
    var html = '<div class="pick">' + POSTS.filter(function (p) { return !(gv.cabinet.imposed && p.id === 'pm'); }).map(function (p) {
      var x = gv.cabinet.posts[p.id]; return '<button type="button" class="pick-row" data-rp="' + p.id + '"><span class="gf-ic">' + p.icon + '</span><span class="pick-txt"><b>' + esc(p.name) + '</b><small>' + esc(x.name) + ' · compétence ' + starsTxt(x.comp) + ' · loyauté ' + starsTxt(x.loy) + '</small></span></button>';
    }).join('') + '</div>';
    modal({ kicker: 'Remaniement', title: 'Quel poste changer ?', html: html, buttons: [{ label: 'Annuler' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-rp]'), function (b) {
          b.addEventListener('click', function () {
            var post = b.getAttribute('data-rp'), pool = CB.reshufflePool(gv);
            modal({ kicker: 'Remaniement · ' + postDef(post).name, title: 'Qui nommer ?', html: '<div class="pick">' + pool.map(function (x) { return '<button type="button" class="pick-row mc" data-nm="' + x.id + '">' + mcard(x) + '</button>'; }).join('') + '</div>', buttons: [{ label: 'Annuler' }],
              onOpen: function () {
                Array.prototype.forEach.call(document.querySelectorAll('[data-nm]'), function (c) {
                  c.addEventListener('click', function () {
                    var x = pool.filter(function (y) { return y.id === c.getAttribute('data-nm'); })[0], r = CB.reshuffle(gv, post, x);
                    render();
                    modal({ kicker: 'Remaniement', title: post === 'pm' ? 'Nouveau Premier ministre' : 'Nouveau ministre', html: '<p>' + esc(x.name) + ' remplace ' + esc(r.old.name) + ' (' + esc(postDef(post).name) + ').</p><div class="brief">' +
                      line('😊', (post === 'pm' ? 'Le fusible a sauté : ' : 'Un nouveau souffle : ') + '+' + r.pop + ' de popularité.') + r.notes.map(function (n) { return line(n.icon, esc(n.text)); }).join('') + '</div>' });
                  });
                });
              } });
          });
        });
      } });
  }
  /* L'été : un ministre peut faire l'actualité */
  function ministerEvent(then) {
    var ev = gv.cabinet ? CB.event(gv) : null;
    if (!ev) return then();
    var x = ev.minister, P = postDef(ev.post);
    var html = '<div class="gf-evt"><span class="gf-face">' + mface(x) + '</span><span><small>' + P.icon + ' ' + esc(P.name) + '</small><b>' + esc(x.name) + '</b></span></div><p>' + esc(ev.text) + '</p><div class="pick">' +
      ev.opts.map(function (o, i) { return '<button type="button" class="pick-row" data-mo="' + i + '"><span class="pick-txt"><b>' + esc(o.label) + '</b><small>' + (o.pop ? 'popularité ' + (o.pop > 0 ? '+' : '') + o.pop : '') + (o.fronde ? 'plus de frondeurs cette année' : '') + (o.fire ? (o.pop ? ' · ' : '') + 'un expert reprend le poste' : '') + (o.loy ? ' · loyauté ' + (o.loy > 0 ? '+' : '') + o.loy : '') + '</small></span></button>'; }).join('') + '</div>';
    modal({ kicker: 'Le gouvernement · été', title: ev.title, html: html, buttons: [],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-mo]'), function (b) {
          b.addEventListener('click', function () { var r = CB.applyEvent(gv, ev, ev.opts[+b.getAttribute('data-mo')]); closeModal(); render(); if (r.replacement) toast(r.replacement.name + ' reprend le poste.'); then(); });
        });
      } });
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
          b.addEventListener('click', function () { var o = ev.opts[+b.getAttribute('data-o')]; G.applyOpt(gv, o); closeModal(); ministerEvent(next); });
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

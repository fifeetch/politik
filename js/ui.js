/* Politik — interface (écrans, carte, déroulement d'un tour). */
(function () {
  var D = window.PolitikData, M = window.PolitikMap, E = window.PolitikEngine, AI = window.PolitikAI;
  var R = D.RULES;
  var SHORT = { idf: 'IDF', ara: 'ARA', hdf: 'HDF', naq: 'N-AQ', occ: 'OCC', ges: 'G-EST', pac: 'PACA',
                pdl: 'PDL', bre: 'BRE', nor: 'NOR', bfc: 'BFC', cvl: 'CVL', cor: 'CORSE' };
  var NEUTRAL = '#DDD7C8';
  var SVGNS = 'http://www.w3.org/2000/svg';

  var g = null, me = null, chosen = 'VP', selected = null, queue = [];

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    if (html != null) e.innerHTML = html;
    return e;
  }
  function svg(tag, attrs) { var e = document.createElementNS(SVGNS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  function party(id) { return E.PARTY[id]; }
  function chip(pid) { var p = party(pid); return '<span class="who" style="background:' + p.color + ';color:' + p.ink + '">' + pid + '</span>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Écrans ---------- */
  function go(name) {
    Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.remove('active'); });
    $('screen-' + name).classList.add('active');
    if (name === 'choose') renderChoose();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]'); if (t) go(t.getAttribute('data-go'));
    var a = e.target.closest('[data-action="rules"]'); if (a) showRules();
  });

  /* ---------- Modale & toast ---------- */
  function modal(opts) {
    $('modal-kicker').textContent = opts.kicker || '';
    $('modal-title').textContent = opts.title || '';
    $('modal-body').innerHTML = opts.html || '';
    var bx = $('modal-buttons'); bx.innerHTML = '';
    (opts.buttons || [{ label: 'Continuer', primary: true }]).forEach(function (b) {
      var btn = el('button', { class: 'btn ' + (b.primary ? 'btn-ink' : ''), type: 'button' }, esc(b.label));
      if (b.disabled) btn.disabled = true;
      btn.addEventListener('click', function () { if (!b.keep) closeModal(); if (b.onClick) b.onClick(); });
      bx.appendChild(btn);
    });
    $('modal').hidden = false;
    if (opts.onOpen) opts.onOpen();
  }
  function closeModal() { $('modal').hidden = true; }
  var toastTimer;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2200); }

  /* ---------- Écran titre : carte décorative ---------- */
  function renderTitleMap() {
    var s = $('title-map'), cols = D.PARTIES.map(function (p) { return p.color; }).concat(['#F5D547']), i = 0;
    D.REGIONS.forEach(function (r) {
      s.appendChild(svg('path', { d: M.regions[r.id].d, fill: cols[i++ % cols.length], stroke: '#1B1F3B', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }));
    });
  }

  /* ---------- Choix du parti ---------- */
  function renderChoose() {
    var grid = $('party-grid'); grid.innerHTML = '';
    D.PARTIES.forEach(function (p) {
      var b = el('button', { class: 'party-card' + (p.id === chosen ? ' on' : ''), type: 'button', 'aria-pressed': p.id === chosen });
      b.innerHTML = '<div class="party-band" style="background:' + p.color + ';color:' + p.ink + '"><span class="party-ini">' + p.id +
        '</span><span class="party-fam">' + esc(p.family) + '</span></div><div class="party-body"><span class="party-name">' + esc(p.name) +
        '</span><span class="party-res">' + p.money + ' € · ' + p.infl + ' ★</span></div>';
      b.addEventListener('click', function () { chosen = p.id; renderChoose(); });
      grid.appendChild(b);
    });
    var p = party(chosen);
    $('party-detail').innerHTML = '<div><b>Force.</b> ' + esc(p.force) + '</div><div><b>Faiblesse.</b> ' + esc(p.weakness) +
      '</div><div><b>Bases.</b> ' + p.bases.map(function (r) { return E.REG[r].name; }).join(', ') +
      '</div><div><b>Cartes.</b> ' + p.cards.map(function (c) { return D.CARDS[c].name; }).join(' · ') + '</div>';
  }
  $('btn-start').addEventListener('click', function () { startGame(chosen); });

  /* ---------- Partie ---------- */
  function startGame(pid) {
    g = E.createGame(pid); me = pid; selected = null; queue = [];
    go('game');
    nextTurn();
  }
  function mePl() { return E.player(g, me); }

  function nextTurn() {
    var info = E.startTurn(g);
    queue = [];
    render();
    var ev = D.EVENTS.filter(function (e) { return e.id === info.event.id; })[0];
    var html = '';
    if (info.income.length) {
      var mine = info.income.filter(function (x) { return x.pid === me; })[0];
      html += '<p>Revenus : <b>+' + mine.money + ' €</b> et <b>+' + mine.infl + ' ★</b>.</p>';
    }
    if (info.usure) html += '<p>' + chip('EM') + ' Usure du pouvoir : En Mouvement perd 1 cube en ' + esc(E.REG[info.usure].name) + '.</p>';
    html += '<div class="event-card"><span class="kicker">Événement</span><div class="h2">' + esc(ev.title) + '</div><p>' + esc(ev.text) + '</p></div>';
    var fx = info.event.effects.filter(function (f) { return f.pid; });
    if (fx.length) html += '<div class="log">' + fx.map(function (f) { return '<div class="log-row">' + chip(f.pid) + '<span>' + esc(f.text) + '</span></div>'; }).join('') + '</div>';
    if (E.isDebateTurn(g)) html += '<p><b>Débat télévisé à la fin de ce tour.</b> Garde de l\'influence (★) pour miser.</p>';
    modal({ kicker: 'Tour ' + g.turn + ' / ' + R.maxTurns, title: g.turn === 1 ? 'La campagne commence' : 'Nouveau tour', html: html,
            buttons: [{ label: 'À mes actions', primary: true, onClick: render }] });
  }

  /* Ressources projetées après les actions déjà programmées */
  function projected() {
    var pl = mePl(), m = pl.money, f = pl.infl;
    queue.forEach(function (a) {
      var c = E.actionCost(g, me, a); m -= c.money; f -= c.infl;
      if (a.type === 'fonds') { m += me === 'EM' ? 4 : me === 'VP' ? 2 : 3; if (me === 'EM') f += 1; }
      if (a.type === 'card' && a.card === 'primaire') f += 3;
      if (a.type === 'card' && a.card === 'rassemblement') { m += 3; f += 1; }
    });
    return { money: m, infl: f };
  }
  function canQueue(act) {
    if (g.phase !== 'actions') return 'Ce n’est pas le moment.';
    if (queue.length >= R.actionsPerTurn) return 'Tes 3 actions sont déjà choisies.';
    if (act.type === 'card' && queue.some(function (q) { return q.card === act.card; })) return 'Carte déjà programmée.';
    var err = E.checkAction(g, me, act); if (err) return err;
    var c = E.actionCost(g, me, act), pr = projected();
    if (pr.money < c.money) return 'Pas assez d’argent.';
    if (pr.infl < c.infl) return 'Pas assez d’influence.';
    return null;
  }
  function addAction(act) {
    var err = canQueue(act);
    if (err) { toast(err); return; }
    queue.push(act); render();
  }

  /* ---------- Rendu ---------- */
  function render() {
    if (!g) return;
    var pl = mePl(), pr = projected();
    $('turn-label').textContent = 'TOUR ' + g.turn + ' / ' + R.maxTurns;
    $('phase-label').textContent = E.isDebateTurn(g) ? 'Actions · débat ce tour' : 'Actions';
    $('res-money').textContent = '€ ' + pr.money + (pr.money !== pl.money ? ' / ' + pl.money : '');
    $('res-infl').textContent = '★ ' + pr.infl + (pr.infl !== pl.infl ? ' / ' + pl.infl : '');
    renderRace(); renderMap(); renderRegion(); renderQueue(); renderActions();
  }
  function renderRace() {
    var bar = $('race-bar'), leg = $('race-legend'); bar.innerHTML = ''; leg.innerHTML = '';
    E.ranking(g).forEach(function (pid) {
      var pts = E.controlledPoints(g, pid), p = party(pid);
      bar.appendChild(el('div', { class: 'seg', style: 'width:' + (100 * pts / 65) + '%;background:' + p.color }));
      leg.appendChild(el('span', { class: pid === me ? 'me' : '' }, '<i class="sw" style="background:' + p.color + '"></i>' + (pid === me ? 'Toi' : pid) + ' ' + pts));
    });
    bar.appendChild(el('div', { class: 'mark' }));
  }
  function renderMap() {
    var s = $('map'); s.innerHTML = '';
    D.REGIONS.forEach(function (r) {
      var c = g.regions[r.id].controller;
      var p = svg('path', { d: M.regions[r.id].d, class: 'reg', fill: c ? party(c).color : NEUTRAL, tabindex: 0, role: 'button', 'aria-label': r.name });
      p.addEventListener('click', function () { selected = r.id; render(); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selected = r.id; render(); } });
      s.appendChild(p);
    });
    if (selected) {
      s.appendChild(svg('path', { d: M.regions[selected].d, class: 'sel' }));
      s.appendChild(svg('path', { d: M.regions[selected].d, class: 'sel-glow' }));
    }
    D.REGIONS.forEach(function (r) {
      var m = M.regions[r.id], gb = svg('g', { class: 'badge' });
      var rr = r.pts >= 10 ? 10 : r.id === 'cor' ? 8 : 9;
      gb.appendChild(svg('circle', { cx: m.x, cy: m.y, r: rr }));
      var t = svg('text', { x: m.x, y: m.y + 3.5 }); t.textContent = r.pts; gb.appendChild(t);
      s.appendChild(gb);
    });
    // actions programmées
    var count = {};
    queue.forEach(function (a, i) {
      if (!a.region) return;
      var m = M.regions[a.region], k = count[a.region] = (count[a.region] || 0) + 1;
      var x = m.x + 10 + (k - 1) * 9, y = m.y - 9;
      s.appendChild(svg('circle', { cx: x, cy: y, r: 6, class: 'plan-dot' }));
      var t = svg('text', { x: x, y: y + 3, class: 'plan-num' }); t.textContent = i + 1; s.appendChild(t);
    });
  }
  function renderRegion() {
    var box = $('region-info');
    if (!selected) {
      var o = D.OBJECTIVES.filter(function (x) { return x.id === mePl().objective; })[0];
      box.innerHTML = '<div class="region-head"><div><h2 class="region-name">Touche une région</h2><span class="region-sub">pour voir les forces en présence et agir</span></div>' +
        '<span class="tag" style="background:' + party(me).color + ';color:' + party(me).ink + '">' + esc(party(me).short) + '</span></div>' +
        '<div class="hint">Objectif secret : <b>' + esc(o.name) + '</b> — ' + esc(o.text) + ' (+' + o.bonus + ').</div>';
      return;
    }
    var r = E.REG[selected], reg = g.regions[selected], c = reg.controller;
    var status = c ? 'contrôlée par ' + (c === me ? 'toi' : party(c).short) : 'non contrôlée';
    var html = '<div class="region-head"><div><h2 class="region-name">' + esc(r.name) + '</h2><span class="region-sub">' + D.PROFILES[r.profile] + ' · ' + r.pts + ' pts · ' + status + '</span></div>' +
      (c === me ? '<span class="tag" style="background:' + party(me).color + ';color:' + party(me).ink + '">À toi</span>' : '<span class="tag tag-yellow">À prendre</span>') + '</div>';
    g.players.slice().sort(function (a, b) { return E.cubes(g, selected, b.id) - E.cubes(g, selected, a.id); }).forEach(function (p) {
      var n = E.cubes(g, selected, p.id), P = party(p.id), cubes = '';
      for (var i = 0; i < R.maxCubes; i++) cubes += '<i class="cube' + (i < n ? ' on' : '') + '"' + (i < n ? ' style="background:' + P.color + '"' : '') + '></i>';
      html += '<div class="cube-row"><span class="lbl">' + (p.id === me ? 'Toi' : esc(P.short)) + '</span><span class="cubes">' + cubes + '</span><span class="n">' + n + '</span></div>';
    });
    box.innerHTML = html;
  }
  function renderQueue() {
    var box = $('queue-slots'); box.innerHTML = '';
    for (var i = 0; i < R.actionsPerTurn; i++) {
      var a = queue[i];
      if (!a) { box.appendChild(el('div', { class: 'slot' }, 'Action ' + (i + 1))); continue; }
      var name = a.type === 'card' ? D.CARDS[a.card].name : D.ACTIONS[a.type].name;
      var b = el('button', { class: 'slot full', type: 'button', 'aria-label': 'Retirer ' + name }, esc(name) + (a.region ? '<small>' + SHORT[a.region] + '</small>' : '<small>✕ retirer</small>'));
      (function (idx) { b.addEventListener('click', function () { queue.splice(idx, 1); render(); }); })(i);
      box.appendChild(b);
    }
    $('btn-validate').textContent = queue.length < R.actionsPerTurn ? 'Valider (' + queue.length + '/3)' : 'Valider';
    $('btn-validate').disabled = g.phase !== 'actions';
  }
  function costLabel(act) {
    var c = E.actionCost(g, me, act), parts = [];
    if (act.type === 'fonds') return '+' + (me === 'EM' ? '4 € +1 ★' : me === 'VP' ? '2 €' : '3 €');
    if (c.money) parts.push(c.money + ' €'); if (c.infl) parts.push(c.infl + ' ★');
    if (act.type === 'reseaux') parts.push('dé');
    return parts.join(' + ') || 'gratuit';
  }
  function renderActions() {
    var box = $('actions'); box.innerHTML = '';
    ['terrain', 'medias', 'reseaux', 'contre', 'fonds', 'reforme'].forEach(function (type) {
      var def = D.ACTIONS[type], act = { type: type, region: def.target ? selected : undefined };
      var b = el('button', { class: 'act', type: 'button', title: def.text }, '<b>' + def.name + '</b><span>' + costLabel(act) + '</span>');
      if (def.target && !selected) b.disabled = true;
      else if (canQueue(act)) b.style.opacity = '.55';
      b.addEventListener('click', function () { addAction(act); });
      box.appendChild(b);
    });
    var cards = $('cards'); cards.innerHTML = '';
    mePl().cards.forEach(function (k) {
      var def = D.CARDS[k];
      var b = el('button', { class: 'cardbtn', type: 'button', title: def.text }, esc(def.name) + '<small>' + esc(def.text) + '</small>');
      if (queue.some(function (q) { return q.card === k; })) b.disabled = true;
      b.addEventListener('click', function () {
        if (def.target === 'region' && !selected) { toast('Choisis d’abord une région sur la carte.'); return; }
        addAction({ type: 'card', card: k, region: def.target === 'region' ? selected : undefined });
      });
      cards.appendChild(b);
    });
    if (!mePl().cards.length) cards.innerHTML = '<span class="hint">Cartes spéciales utilisées.</span>';
  }

  /* ---------- Validation et résolution ---------- */
  $('btn-validate').addEventListener('click', function () {
    if (g.phase !== 'actions') return;
    if (queue.length < R.actionsPerTurn) {
      modal({ title: 'Valider avec ' + queue.length + ' action' + (queue.length > 1 ? 's' : '') + ' ?', html: '<p>Les actions non utilisées sont perdues.</p>',
              buttons: [{ label: 'Valider quand même', primary: true, onClick: resolve }, { label: 'Retour' }] });
    } else resolve();
  });

  function resolve() {
    var plans = {}; plans[me] = queue.slice();
    g.players.forEach(function (p) { if (!p.human) plans[p.id] = AI.plan(g, p.id); });
    var log = E.resolveActions(g, plans);
    queue = []; render();
    var html = '<div class="log">' + log.map(function (l) {
      return '<div class="log-row' + (l.ok ? '' : ' fail') + '">' + chip(l.pid) + '<span><b>' + esc(l.action) + '</b>' + (l.region ? ' · ' + SHORT[l.region] : '') + ' — ' + esc(l.text) + '</span></div>';
    }).join('') + '</div>';
    modal({ kicker: 'Tour ' + g.turn, title: 'Résultats des actions', html: html,
            buttons: [{ label: E.isDebateTurn(g) ? 'Place au débat' : 'Fin du tour', primary: true, onClick: E.isDebateTurn(g) ? debate : spotlight }] });
  }

  function debate() {
    var max = mePl().infl, grand = g.turn === R.maxTurns;
    var html = '<p>Mise de l\'influence en secret. <b>Toutes les mises sont perdues</b>, même celles des perdants.</p>' +
      '<p>1er : +' + (grand ? 2 : 1) + ' cube dans 4 régions · 2e : +' + (grand ? 2 : 1) + ' cube dans 2 régions.' + (grand ? ' <b>Grand débat : gains doublés !</b>' : '') + '</p>' +
      '<div class="bid"><input id="bid" type="range" min="0" max="' + max + '" value="' + Math.min(2, max) + '" aria-label="Mise en influence"><output id="bid-out">' + Math.min(2, max) + ' ★</output></div>' +
      '<p class="hint">Tu as ' + max + ' ★.</p>';
    modal({ kicker: grand ? 'Grand débat final' : 'Débat télévisé', title: 'Combien mises-tu ?', html: html,
      onOpen: function () { var r = $('bid'); r.addEventListener('input', function () { $('bid-out').textContent = r.value + ' ★'; }); },
      buttons: [{ label: 'Miser', primary: true, keep: true, onClick: function () {
        var bids = {}; bids[me] = parseInt($('bid').value, 10) || 0;
        g.players.forEach(function (p) { if (!p.human) bids[p.id] = AI.bid(g, p.id); });
        closeModal();
        var res = E.resolveDebate(g, bids); render();
        var h = '<div class="log">' + res.bids.map(function (b, i) { return '<div class="log-row">' + chip(b.pid) + '<span>' + (i === 0 && !res.none ? '<b>' : '') + 'Mise : ' + b.bid + ' ★' + (i === 0 && !res.none ? '</b>' : '') + '</span></div>'; }).join('') + '</div>';
        if (res.none) h += '<p>Personne n\'a misé : débat sans vainqueur.</p>';
        res.rewards.forEach(function (w) { h += '<p>' + chip(w.pid) + ' +' + w.each + ' cube' + (w.each > 1 ? 's' : '') + ' en ' + w.regions.map(function (x) { return SHORT[x]; }).join(', ') + '</p>'; });
        modal({ kicker: 'Débat', title: res.none ? 'Match nul' : (res.bids[0].pid === me ? 'Tu remportes le débat !' : party(res.bids[0].pid).short + ' remporte le débat'), html: h,
                buttons: [{ label: 'Fin du tour', primary: true, onClick: spotlight }] });
      } }] });
  }

  function spotlight() {
    var t = E.spotlightTarget(g);
    if (!t) return finishTurn(null);
    if (t === me) {
      var can = mePl().infl >= R.spotlightCost;
      modal({ kicker: 'Sous les projecteurs', title: 'Tu es en tête !', html: '<p>Les médias fouillent ton passé. Paie <b>2 ★</b> pour étouffer l\'affaire, ou perds 1 cube dans tes 2 plus grandes régions.</p>',
        buttons: [{ label: 'Payer 2 ★', primary: true, disabled: !can, onClick: function () { finishTurn(E.applySpotlight(g, me, true)); } },
                  { label: 'Perdre 2 cubes', onClick: function () { finishTurn(E.applySpotlight(g, me, false)); } }] });
    } else finishTurn(E.applySpotlight(g, t, AI.paySpotlight(g, t)));
  }

  function finishTurn(spot) {
    var res = E.endTurn(g); render();
    if (spot && !spot.paid && spot.pid !== me) toast(party(spot.pid).short + ' sous les projecteurs : −1 cube en ' + spot.regions.map(function (x) { return SHORT[x]; }).join(', '));
    else if (spot && spot.paid && spot.pid !== me) toast(party(spot.pid).short + ' paie 2 ★ pour éviter le scandale');
    if (res.over) return endGame();
    setTimeout(nextTurn, spot && spot.pid !== me ? 900 : 0);
  }

  function endGame() {
    $('toast').hidden = true;
    var fs = E.finalScores(g), win = g.winner;
    $('end-kicker').textContent = g.firstRound ? 'Élu au premier tour · tour ' + g.turn : 'Résultats après 8 tours';
    $('end-title').textContent = win === me ? 'TU ES ÉLU !' : 'PERDU…';
    $('end-sub').textContent = win === me ? party(me).name + ' remporte l\'élection.' : party(win).name + ' remporte l\'élection.';
    var rows = (g.firstRound ? g.players.map(function (p) { return { pid: p.id, regions: E.controlledPoints(g, p.id), bonus: 0, total: E.controlledPoints(g, p.id), objective: null }; })
      .sort(function (a, b) { return b.total - a.total; }) : fs);
    var h = '<table class="score-table"><thead><tr><th>Parti</th><th class="num">Régions</th><th class="num">Objectif</th><th class="num">Total</th></tr></thead><tbody>';
    rows.forEach(function (s) {
      h += '<tr><td>' + chip(s.pid) + (s.pid === me ? 'Toi' : esc(party(s.pid).short)) + '</td><td class="num">' + s.regions +
        '</td><td class="num">' + (s.objective ? (s.met ? '+' + s.bonus : '—') : '—') + '</td><td class="num"><b>' + s.total + '</b></td></tr>';
    });
    h += '</tbody></table>';
    if (!g.firstRound) {
      var mine = fs.filter(function (x) { return x.pid === me; })[0];
      h += '<p class="hint" style="margin:8px 0 0">Ton objectif « ' + esc(mine.objective.name) + ' » : ' + (mine.met ? 'réussi !' : 'raté.') + '</p>';
    }
    $('end-table').innerHTML = h;
    go('end');
  }

  /* ---------- Menu & règles ---------- */
  $('btn-menu').addEventListener('click', function () {
    var o = D.OBJECTIVES.filter(function (x) { return x.id === mePl().objective; })[0], p = party(me);
    modal({ kicker: 'Ton parti', title: p.name, html: '<p><b>Objectif secret :</b> ' + esc(o.name) + ' — ' + esc(o.text) + ' (+' + o.bonus + ' pts).</p><p><b>Force :</b> ' + esc(p.force) + '</p><p><b>Faiblesse :</b> ' + esc(p.weakness) + '</p>',
            buttons: [{ label: 'Reprendre', primary: true }, { label: 'Règles du jeu', onClick: showRules }, { label: 'Abandonner la partie', onClick: function () { g = null; go('title'); } }] });
  });
  function showRules() {
    modal({ kicker: 'Règles v0.1', title: 'Comment gagner', html:
      '<p><b>But :</b> contrôler des régions. Les 13 régions valent 65 points ; <b>33 points = élu au premier tour</b> (à partir du tour 4). Sinon, après 8 tours, le meilleur score gagne (régions + objectif secret).</p>' +
      '<p><b>Contrôle :</b> le parti qui a le plus de cubes dans une région, avec au moins 3 cubes (4 pour le Mouvement National).</p>' +
      '<p><b>Chaque tour :</b> revenus (4 € + 1 € par région contrôlée, max +3 ; +2 ★), un événement, puis <b>3 actions choisies en secret</b> par tous les partis en même temps, résolues à tour de rôle.</p>' +
      '<p><b>Actions :</b> Terrain (2 € : +2 cubes) · Médias (3 € + 1 ★ : +1 cube dans 3 régions du même profil) · Réseaux (1 € : un dé, de −1 à +4) · Contre-campagne (2 € + 1 ★ : −2 cubes au rival le plus fort) · Fonds (+3 €) · Réforme (4 ★ : +1 cube dans toutes les régions du profil d\'une région que tu contrôles). Chaque parti a aussi 2 cartes spéciales à usage unique.</p>' +
      '<p><b>Débats</b> aux tours 3, 6 et 8 : on mise de l\'influence, toutes les mises sont perdues.</p>' +
      '<p><b>Sous les projecteurs :</b> à la fin de chaque tour, le parti en tête paie 2 ★ ou perd 1 cube dans ses 2 plus grandes régions.</p>' });
  }

  renderTitleMap();
  renderChoose();
})();

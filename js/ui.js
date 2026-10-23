/* Politik — interface (écrans, carte, déroulement d'un tour). */
(function () {
  var D = window.PolitikData, M = window.PolitikMap, E = window.PolitikEngine, AI = window.PolitikAI;
  var R = D.RULES;
  var SHORT = { idf: 'IDF', ara: 'ARA', hdf: 'HDF', naq: 'N-AQ', occ: 'OCC', ges: 'G-EST', pac: 'PACA',
                pdl: 'PDL', bre: 'BRE', nor: 'NOR', bfc: 'BFC', cvl: 'CVL', cor: 'CORSE' };
  var NEUTRAL = '#DDD7C8';
  var SVGNS = 'http://www.w3.org/2000/svg';

  var g = null, me = null, chosen = 'VP', selected = null, queue = [];
  var theme = null, themePicked = false;   // v0.3 : le message (thème) choisi pour les actions
  var T = window.PolitikTuto, forceTuto = false, tutoGame = false;

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
  function axisHtml(pid) {
    var cells = D.PARTIES.slice().sort(function (a, b) { return a.pos - b.pos; }).map(function (p) {
      var on = p.id === pid;
      return '<span class="axis-dot' + (on ? ' on' : '') + '" style="' + (on ? 'background:' + p.color + ';color:' + p.ink : '') + '">' + p.id + '</span>';
    }).join('');
    return '<div class="axis"><span class="axis-l">gauche</span>' + cells + '<span class="axis-l">droite</span></div>';
  }
  function chanceLabel(c) { return c >= 0.7 ? 'probable' : c >= 0.45 ? 'incertain' : 'peu probable'; }
  function th(id) { return E.THEME[id]; }
  function credDots(n) { return '<span class="dots">' + [0, 1].map(function (i) { return '<i class="' + (i < n ? 'on' : '') + '"></i>'; }).join('') + '</span>'; }
  function credHtml(pid) {
    var lv = ['faible', 'moyen', 'fort'];
    return '<div class="cred">' + D.THEMES.slice().sort(function (a, b) { return E.cred(pid, b.id) - E.cred(pid, a.id); }).map(function (t) {
      var c = E.cred(pid, t.id);
      return '<span class="cred-row cred-' + c + '">' + t.icon + ' ' + esc(t.name) + credDots(c) + '<em>' + lv[c] + '</em></span>';
    }).join('') + '</div>';
  }
  function concernsHtml(rid) {
    return E.REG[rid].concerns.map(function (x) { return '<span class="concern-tag' + (E.isHot(g, x) ? ' hot' : '') + '">' + th(x).icon + ' ' + esc(th(x).short) + '</span>'; }).join('');
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Écrans ---------- */
  function go(name) {
    Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.remove('active'); });
    $('screen-' + name).classList.add('active');
    if (name === 'choose') renderChoose();
  }
  document.addEventListener('click', function (e) {
    var h = e.target.closest('[data-action="tuto"]'); if (h) { forceTuto = true; go('choose'); return; }
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
    $('party-detail').innerHTML = axisHtml(p.id) + '<div><b>Crédibilité sur les thèmes.</b> Plus tu es crédible sur un thème, plus ton message porte.</div>' + credHtml(p.id) +
      (p.pos === 1 || p.pos === 6 ? '<div><b>Électorat mobilisé.</b> Au bout de l\'axe : tes voix comptent ×' + R.edgeMobilization + ', mais les reports de second tour seront rares. Pense aux alliances !</div>' : '') +
      '<div><b>Force.</b> ' + esc(p.force) + '</div><div><b>Faiblesse.</b> ' + esc(p.weakness) +
      '</div><div><b>Bases.</b> ' + p.bases.map(function (r) { return E.REG[r].name; }).join(', ') +
      '</div><div><b>Cartes.</b> ' + p.cards.map(function (c) { return D.CARDS[c].name; }).join(' · ') + '</div>';
  }
  $('btn-start').addEventListener('click', function () { startGame(chosen); });

  /* ---------- Partie ---------- */
  function startGame(pid) {
    g = E.createGame(pid); me = pid; selected = null; queue = []; theme = null; themePicked = false;
    go('game');
    nextTurn();
  }
  function mePl() { return E.player(g, me); }

  function nextTurn() {
    var info = E.startTurn(g);
    queue = []; themePicked = false; theme = E.bestTheme(g, me, selected);
    render();
    var ev = D.EVENTS.filter(function (e) { return e.id === info.event.id; })[0];
    var html = '';
    if (info.income.length) {
      var mine = info.income.filter(function (x) { return x.pid === me; })[0];
      html += '<p>Revenus : <b>+' + mine.money + ' €</b> et <b>+' + mine.infl + ' ★</b>.</p>';
    }
    if (info.usure) html += '<p>' + chip('EM') + ' Usure du pouvoir : En Mouvement perd 1 cube en ' + esc(E.REG[info.usure].name) + '.</p>';
    html += newsHtml(g.news);
    html += '<div class="event-card"><span class="kicker">Événement</span><div class="h2">' + esc(ev.title) + '</div><p>' + esc(ev.text) + '</p></div>';
    var fx = info.event.effects.filter(function (f) { return f.pid; });
    if (fx.length) html += '<div class="log">' + fx.map(function (f) { return '<div class="log-row">' + chip(f.pid) + '<span>' + esc(f.text) + '</span></div>'; }).join('') + '</div>';
    if (E.isDebateTurn(g)) html += '<p><b>Débat télévisé à la fin de ce tour.</b> Garde de l\'influence (★) pour miser.</p>';
    modal({ kicker: 'Tour ' + g.turn + ' / ' + R.maxTurns, title: g.turn === 1 ? 'La campagne commence' : 'Nouveau tour', html: html,
            buttons: [{ label: 'À mes actions', primary: true, onClick: function () {
              render();
              if (g.turn === 1 && (forceTuto || !T.isActive())) { var before = T.isActive(); T.maybeStart(forceTuto); tutoGame = !before && T.isActive(); forceTuto = false; }
            } }] });
  }

  /* La Une du tour : le thème qui fait l'actu (+ ceux imposés par les partis) */
  function newsHtml(n) {
    if (!n) return '';
    var t = th(n.theme), mine = E.cred(me, n.theme);
    var h = '<div class="paper"><div class="paper-mast">LE QUOTIDIEN NATIONAL <span>· Tour ' + g.turn + '</span></div>' +
      '<div class="paper-head">' + esc(n.headline) + '</div>' +
      '<div class="paper-foot">' + t.icon + ' <b>' + esc(t.name) + '</b> fait l\'actu : +1 d\'impact pour tous les messages sur ce thème.</div>';
    n.imposed.forEach(function (x) {
      if (x.theme === n.theme) return;
      h += '<div class="paper-foot">' + th(x.theme).icon + ' <b>' + esc(th(x.theme).name) + '</b> s\'impose aussi dans le débat, grâce à ' + (x.pid === me ? 'toi' : esc(party(x.pid).short)) + '.</div>';
    });
    h += '</div><p class="hint">' + (mine === 2 ? 'Tu es très crédible sur ce thème : c\'est ton moment !' : mine === 1 ? 'Tu es moyennement crédible sur ce thème.' : 'Ce n\'est pas ton sujet… À toi de voir si tu suis l\'actu ou si tu parles d\'autre chose.') + '</p>';
    return h;
  }
  function renderNews() {
    var b = $('news'); if (!g || !g.news) { b.hidden = true; return; }
    b.hidden = false;
    b.innerHTML = '<span class="news-k">À la une</span>' + g.hot.map(function (x) { return '<span class="news-t">' + th(x).icon + ' ' + esc(th(x).name) + '</span>'; }).join('<span class="news-plus">+</span>');
  }
  $('news').addEventListener('click', function () { if (g && g.news) modal({ kicker: 'Actualité', title: 'À la une ce tour', html: newsHtml(g.news) }); });

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
    queue.push(act); render(); T.notify('queue');
  }

  /* ---------- Rendu ---------- */
  function render() {
    if (!g) return;
    var pl = mePl(), pr = projected();
    $('turn-label').textContent = 'TOUR ' + g.turn + ' / ' + R.maxTurns;
    $('phase-label').textContent = E.isDebateTurn(g) ? 'Actions · débat ce tour' : 'Actions';
    $('res-money').textContent = '€ ' + pr.money + (pr.money !== pl.money ? ' / ' + pl.money : '');
    $('res-infl').textContent = '★ ' + pr.infl + (pr.infl !== pl.infl ? ' / ' + pl.infl : '');
    renderRace(); renderNews(); renderMap(); renderRegion(); renderQueue(); renderMessage(); renderActions();
  }
  function renderRace() {
    var bar = $('race-bar'), leg = $('race-legend'); bar.innerHTML = ''; leg.innerHTML = '';
    var ally = E.allyOf(g, me);
    E.poll(g).forEach(function (x) {
      var pid = x.pid, pct = Math.round(100 * x.pct), p = party(pid);
      bar.appendChild(el('div', { class: 'seg', style: 'width:' + (100 * x.pct) + '%;background:' + p.color }));
      leg.appendChild(el('span', { class: pid === me ? 'me' : '' }, '<i class="sw" style="background:' + p.color + '"></i>' + (pid === me ? 'Toi' : pid) + ' ' + pct + ' %' + (pid === ally ? ' <em class="ally">allié</em>' : '')));
    });
    bar.appendChild(el('div', { class: 'mark' }));
  }
  function renderMap() {
    var s = $('map'); s.innerHTML = '';
    D.REGIONS.forEach(function (r) {
      var c = g.regions[r.id].controller;
      var p = svg('path', { d: M.regions[r.id].d, class: 'reg', fill: c ? party(c).color : NEUTRAL, tabindex: 0, role: 'button', 'aria-label': r.name });
      p.addEventListener('click', function () { selectRegion(r.id); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRegion(r.id); } });
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
  function selectRegion(rid) {
    selected = rid;
    if (!themePicked) theme = E.bestTheme(g, me, rid);
    render(); T.notify('region');
  }
  function renderRegion() {
    var box = $('region-info');
    if (!selected) {
      var o = D.OBJECTIVES.filter(function (x) { return x.id === mePl().objective; })[0];
      box.innerHTML = '<div class="region-head"><div><h2 class="region-name">Touche une région</h2>' +
        '<span class="region-sub">🎯 Objectif secret : ' + esc(o.name) + ' (' + esc(o.text.charAt(0).toLowerCase() + o.text.slice(1)) + ')</span></div></div>';
      return;
    }
    var r = E.REG[selected], reg = g.regions[selected], c = reg.controller;
    var tag = c === me ? '<span class="tag" style="background:' + party(me).color + ';color:' + party(me).ink + '">À toi</span>'
      : c ? '<span class="tag" style="background:' + party(c).color + ';color:' + party(c).ink + '">' + c + '</span>'
      : '<span class="tag tag-yellow">À prendre</span>';
    var html = '<div class="region-head"><div><h2 class="region-name">' + esc(r.name) + '</h2>' +
      '<span class="region-sub">' + r.pts + ' pts · ' + D.PROFILES[r.profile] + ' · préoccupée par ' +
      r.concerns.map(function (x) { return '<span class="concern-ic' + (E.isHot(g, x) ? ' hot' : '') + '" title="' + esc(th(x).name) + '">' + th(x).icon + '</span>'; }).join('') +
      '</span></div>' + tag + '</div>';
    // forces en présence : une seule ligne, seulement les partis présents (et toi)
    var rows = g.players.filter(function (p) { return p.id === me || E.cubes(g, selected, p.id) > 0; })
      .sort(function (a, b) { return E.cubes(g, selected, b.id) - E.cubes(g, selected, a.id); });
    html += '<div class="forces">' + rows.map(function (p) {
      var n = E.cubes(g, selected, p.id), P = party(p.id);
      return '<span class="force' + (p.id === me ? ' me' : '') + '"><i style="background:' + P.color + '"></i>' + (p.id === me ? 'Toi' : p.id) + ' <b>' + n + '</b></span>';
    }).join('') + '<span class="force-hint">cubes · ' + E.minControl(me) + ' pour tenir</span></div>';
    box.innerHTML = html;
  }
  function renderQueue() {
    var box = $('queue-slots'); box.innerHTML = '';
    for (var i = 0; i < R.actionsPerTurn; i++) {
      var a = queue[i];
      if (!a) { box.appendChild(el('div', { class: 'slot' }, 'Action ' + (i + 1))); continue; }
      var name = a.type === 'card' ? D.CARDS[a.card].name : D.ACTIONS[a.type].name;
      var sub = (a.theme ? th(a.theme).icon + ' ' : '') + (a.region ? SHORT[a.region] : a.target ? a.target : a.theme ? th(a.theme).short : '✕ retirer');
      var b = el('button', { class: 'slot full', type: 'button', 'aria-label': 'Retirer ' + name }, esc(name) + '<small>' + sub + '</small>');
      (function (idx) { b.addEventListener('click', function () { queue.splice(idx, 1); render(); }); })(i);
      box.appendChild(b);
    }
    $('btn-validate').textContent = queue.length < R.actionsPerTurn ? 'Valider (' + queue.length + '/3)' : 'Valider';
    $('btn-validate').disabled = g.phase !== 'actions';
  }
  function costLabel(act) {
    var c = E.actionCost(g, me, act), parts = [];
    if (c.money) parts.push(c.money + ' €'); if (c.infl) parts.push(c.infl + ' ★');
    return parts.length ? parts.join(' + ') : 'gratuit';
  }
  /* Ce que fait une action, en clair, sur son bouton (avec les chiffres réels du moment) */
  var PROF_PLURAL = { urbaine: 'urbaines', rurale: 'rurales', industrielle: 'industrielles', historique: 'historiques' };
  function effect(act) {
    var r = act.region, n;
    switch (act.type) {
      case 'terrain':
        if (!r) return 'des cubes dans 1 région';
        n = E.terrainCubes(g, me, r, act.theme); return '<b>+' + n + ' cube' + (n > 1 ? 's' : '') + '</b> ici';
      case 'medias':
        if (!r) return 'des cubes dans 3 régions';
        n = 0; E.mediaRegions(g, me, r, act.theme).forEach(function (rid) { n += E.mediaCubes(g, me, rid, act.theme); });
        return '<b>+' + n + ' cube' + (n > 1 ? 's' : '') + '</b> · 3 régions';
      case 'reseaux': return 'dé : <b>−1 à +' + (4 + (E.isHot(g, act.theme) ? 1 : 0)) + '</b> cubes';
      case 'imposer': return 'ton thème <b>à la une</b>';
      case 'contre': return 'rival en tête <b>−2 cubes</b>';
      case 'fonds': return '<b>+' + (me === 'EM' ? '4 € +1 ★' : me === 'VP' ? '2 €' : '3 €') + '</b>';
      case 'reforme':
        if (!r) return '+1 cube dans des régions';
        if (g.regions[r].controller !== me) return 'région à toi requise';
        return '<b>+1 cube</b> rég. ' + PROF_PLURAL[E.REG[r].profile];
    }
    return '';
  }
  function impactDots(n) { var h = ''; for (var i = 0; i < 4; i++) h += '<i class="' + (i < n ? 'on' : '') + '"></i>'; return '<span class="imp">' + h + '</span>'; }
  function renderMessage() {
    var b = $('message'), t = th(theme);
    b.innerHTML = '<span class="msg-k">Message</span><span class="msg-t">' + t.icon + ' ' + esc(t.name) + (E.isHot(g, theme) ? ' 🔥' : '') + '</span>' +
      (selected ? impactDots(E.impact(g, me, selected, theme)) : '') + '<span class="msg-change">Changer</span>';
  }
  $('message').addEventListener('click', function () {
    if (!g || g.phase !== 'actions') return;
    var list = D.THEMES.map(function (t) { return { t: t, imp: E.impact(g, me, selected, t.id) }; })
      .sort(function (a, b) { return b.imp - a.imp; });
    var html = '<p class="hint">Plus l\'impact est fort, plus ton action rapporte.' + (selected ? ' Ici, en ' + esc(E.REG[selected].name) + ' :' : '') + '</p><div class="pick">' +
      list.map(function (x) {
        var why = [];
        var c = E.cred(me, x.t.id); why.push(['pas ton sujet', 'tu es crédible', 'ton point fort'][c]);
        if (selected && E.concerns(selected, x.t.id)) why.push('la région s\'en soucie');
        if (E.isHot(g, x.t.id)) why.push('🔥 à la une');
        return '<button type="button" class="pick-row' + (x.t.id === theme ? ' on' : '') + '" data-theme="' + x.t.id + '"><span class="pick-i">' + x.t.icon + '</span>' +
          '<span class="pick-txt"><b>' + esc(x.t.name) + '</b><small>' + why.join(' · ') + '</small></span>' + (selected ? impactDots(x.imp) : '') + '</button>';
      }).join('') + '</div>';
    modal({ kicker: 'Ton message', title: 'De quoi parles-tu ?', html: html, buttons: [{ label: 'Fermer' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('.pick-row'), function (row) {
          row.addEventListener('click', function () { theme = row.getAttribute('data-theme'); themePicked = true; closeModal(); render(); T.notify('theme'); });
        });
      } });
  });
  var MAIN = ['terrain', 'medias', 'reseaux'];
  function renderActions() {
    var box = $('actions'); box.innerHTML = '';
    MAIN.forEach(function (type) {
      var def = D.ACTIONS[type], act = { type: type, region: selected || undefined, theme: theme };
      var big = type === 'terrain' || type === 'medias' ? (selected ? '+' + bigGain(act) : '—') : (selected ? '🎲' : '—');
      var b = el('button', { class: 'tile', type: 'button', 'aria-label': def.name + ', ' + costLabel(act) },
        '<span class="tile-n">' + def.icon + ' ' + def.name + '</span><span class="tile-big">' + big + '</span><span class="tile-cost">' + costLabel(act) + '</span>');
      if (!selected) b.disabled = true;
      else if (canQueue(act)) b.classList.add('dim');
      b.addEventListener('click', function () { addAction(act); });
      box.appendChild(b);
    });
    var more = el('button', { class: 'tile tile-more', type: 'button', id: 'btn-more' }, '<span class="tile-n">Plus</span><span class="tile-big">⋯</span><span class="tile-cost">autres actions</span>');
    more.addEventListener('click', moreMenu);
    box.appendChild(more);
  }
  function bigGain(act) {
    if (act.type === 'terrain') return E.terrainCubes(g, me, act.region, act.theme);
    var n = 0; E.mediaRegions(g, me, act.region, act.theme).forEach(function (rid) { n += E.mediaCubes(g, me, rid, act.theme); }); return n;
  }
  /* Les autres actions, dans une fenêtre où l'on a la place de les expliquer */
  function moreMenu() {
    if (g.phase !== 'actions') return;
    var items = [];
    ['imposer', 'contre', 'fonds', 'reforme'].forEach(function (type) {
      var def = D.ACTIONS[type], act = { type: type, region: def.target === 'region' ? selected : undefined, theme: def.theme ? theme : undefined };
      var err = def.target === 'region' && !selected ? 'choisis d\'abord une région' : canQueue(act);
      items.push({ act: act, icon: def.icon, name: def.name, cost: costLabel(act), fx: effect(act), err: err });
    });
    mePl().cards.forEach(function (k) {
      var def = D.CARDS[k], act = { type: 'card', card: k, region: def.target === 'region' ? selected : undefined };
      var err = def.target === 'region' && !selected ? 'choisis d\'abord une région' : canQueue(act);
      items.push({ act: act, icon: '🃏', name: def.name, cost: 'carte unique', fx: esc(def.text), err: err });
    });
    var ally = E.allyOf(g, me);
    items.push({ special: ally ? 'break' : 'alliance', icon: '🤝', name: ally ? 'Allié : ' + party(ally).short : 'Alliance', cost: ally ? 'rompre ?' : '1 ★',
      fx: ally ? 'Toucher pour rompre l\'alliance' : 'S\'allier à un parti proche pour le second tour',
      err: queue.some(function (q) { return q.type === 'alliance' || q.type === 'rupture'; }) ? 'déjà programmée' : null });
    var html = '<div class="pick">' + items.map(function (it, i) {
      return '<button type="button" class="pick-row' + (it.err ? ' off' : '') + '" data-i="' + i + '"><span class="pick-i">' + it.icon + '</span>' +
        '<span class="pick-txt"><b>' + esc(it.name) + '</b><small>' + (it.err ? esc(it.err) : it.fx) + '</small></span><span class="pick-cost">' + esc(it.cost) + '</span></button>';
    }).join('') + '</div>';
    modal({ kicker: 'Autres actions', title: 'Plus d\'options', html: html, buttons: [{ label: 'Fermer' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('.pick-row'), function (row) {
          row.addEventListener('click', function () {
            var it = items[+row.getAttribute('data-i')];
            if (it.err) { toast(it.err.charAt(0).toUpperCase() + it.err.slice(1) + '.'); return; }
            closeModal();
            if (it.special === 'alliance') allianceMenu();
            else if (it.special === 'break') confirmBreak();
            else addAction(it.act);
          });
        });
      } });
  }
  function allianceMenu() {
    var rows = g.players.filter(function (p) { return p.id !== me; }).sort(function (a, b) { return E.dist(me, a.id) - E.dist(me, b.id); });
    var html = axisHtml(me) + '<p>Un allié ne peut pas t\'attaquer (ni toi l\'attaquer), vous ne vous volez pas d\'électeurs, et au second tour ses électeurs se reportent à <b>' + Math.round(R.allyTransfer * 100) + ' %</b> sur toi.</p>';
    var buttons = [];
    rows.forEach(function (p) {
      var err = E.allianceError(g, me, p.id), d = E.dist(me, p.id);
      var label = party(p.id).short + ' · distance ' + d + (err ? ' — ' + err : ' — accord ' + chanceLabel(E.acceptChance(g, p.id, me)));
      buttons.push({ label: label, disabled: !!err, onClick: function () { addAction({ type: 'alliance', target: p.id }); } });
    });
    buttons.push({ label: 'Annuler' });
    modal({ kicker: 'Coûte 1 ★ et 1 action', title: 'Proposer une alliance', html: html, buttons: buttons });
  }
  function confirmBreak() {
    var ally = E.allyOf(g, me);
    modal({ kicker: 'Rupture', title: 'Trahir ' + party(ally).short + ' ?', html: '<p>Tu perds <b>' + R.breakCost + ' ★</b>, et ses électeurs ne te reporteront presque rien au second tour (' + Math.round(R.betrayedTransfer * 100) + ' %). En échange, tu peux de nouveau l\'attaquer et lui prendre des électeurs.</p>',
      buttons: [{ label: 'Rompre l\'alliance (1 action)', primary: true, onClick: function () { addAction({ type: 'rupture' }); } }, { label: 'Garder l\'alliance' }] });
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
    T.stop();
    var plans = {}; plans[me] = queue.slice();
    g.players.forEach(function (p) { if (!p.human) plans[p.id] = AI.plan(g, p.id); });
    var log = E.resolveActions(g, plans);
    queue = []; render();
    var html = '<div class="log">' + log.map(function (l) {
      return '<div class="log-row' + (l.ok ? '' : ' fail') + '">' + chip(l.pid) + '<span><b>' + esc(l.action) + '</b>' + (l.theme ? ' ' + th(l.theme).icon : '') + (l.region ? ' · ' + SHORT[l.region] : '') + ' — ' + esc(l.text) + '</span></div>';
    }).join('') + '</div>';
    var after = E.isDebateTurn(g) ? debate : spotlight;
    modal({ kicker: 'Tour ' + g.turn, title: 'Résultats des actions', html: html,
            buttons: [{ label: E.isDebateTurn(g) ? 'Place au débat' : 'Fin du tour', primary: true, onClick: function () { handleOffers(after); } }] });
  }
  function handleOffers(then) {
    var o = g.offers.filter(function (x) { return x.to === me; })[0];
    if (!o) return then();
    var p = party(o.from), err = E.allianceError(g, o.from, me);
    if (err) { E.answerOffer(g, o.from, me, false); return handleOffers(then); }
    modal({ kicker: 'Proposition', title: p.short + ' te propose une alliance', html: axisHtml(o.from) +
      '<p>Vous ne pourrez plus vous attaquer ni vous prendre d\'électeurs. Au second tour, ses électeurs se reporteront à ' + Math.round(R.allyTransfer * 100) + ' % sur toi (et les tiens sur lui).</p>',
      buttons: [{ label: 'Accepter', primary: true, onClick: function () { E.answerOffer(g, o.from, me, true); render(); toast('Alliance avec ' + p.short + ' !'); handleOffers(then); } },
                { label: 'Refuser', onClick: function () { E.answerOffer(g, o.from, me, false); handleOffers(then); } }] });
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
      modal({ kicker: 'Sous les projecteurs', title: 'Tu es en tête des sondages !', html: '<p>Les médias fouillent ton passé. Paie <b>2 ★</b> pour étouffer l\'affaire, ou perds 1 cube dans tes 2 plus grandes régions.</p>',
        buttons: [{ label: 'Payer 2 ★', primary: true, disabled: !can, onClick: function () { finishTurn(E.applySpotlight(g, me, true)); } },
                  { label: 'Perdre 2 cubes', onClick: function () { finishTurn(E.applySpotlight(g, me, false)); } }] });
    } else finishTurn(E.applySpotlight(g, t, AI.paySpotlight(g, t)));
  }

  function finishTurn(spot) {
    var res = E.endTurn(g); render();
    if (spot && !spot.paid && spot.pid !== me) toast(party(spot.pid).short + ' sous les projecteurs : −1 cube en ' + spot.regions.map(function (x) { return SHORT[x]; }).join(', '));
    else if (spot && spot.paid && spot.pid !== me) toast(party(spot.pid).short + ' paie 2 ★ pour éviter le scandale');
    if (res.over) return endGame();
    if (g.turn === 1 && tutoGame) {
      tutoGame = false;
      return modal({ kicker: 'Tutoriel', title: 'Bon à savoir', html:
        '<p><b>Chaque tour</b> commence par tes revenus et un <b>événement</b> (crise, scandale, fête…) qui touche tous les partis.</p>' +
        '<p><b>Aux tours 3, 6 et 8</b>, un <b>débat télévisé</b> : tu mises de l\'influence (★). Le plus gros parieur gagne des cubes, mais toutes les mises sont perdues.</p>' +
        '<p><b>Sous les projecteurs</b> : à la fin de chaque tour, le parti en tête paie 2 ★ ou perd des cubes. Être premier trop tôt, ça se paie !</p>' +
        '<p>Tu peux revoir les règles à tout moment avec le bouton <b>•••</b>.</p>',
        buttons: [{ label: 'Tour suivant', primary: true, onClick: nextTurn }] });
    }
    setTimeout(nextTurn, spot && spot.pid !== me ? 900 : 0);
  }

  function bars(list, max) {
    return list.map(function (x) {
      var p = party(x.pid);
      return '<div class="vote-row"><span class="vote-lbl">' + chip(x.pid) + (x.pid === me ? 'Toi' : esc(p.short)) + '</span>' +
        '<span class="vote-bar"><i style="width:' + (100 * x.pct / max) + '%;background:' + p.color + '"></i></span><b>' + (100 * x.pct).toFixed(1) + ' %</b></div>';
    }).join('');
  }
  function endGame() {
    $('toast').hidden = true;
    var res = g.result, win = g.winner;
    $('end-kicker').textContent = 'Soirée électorale';
    $('end-title').textContent = win === me ? 'TU ES ÉLU !' : 'PERDU…';
    $('end-sub').textContent = party(win).name + (res.direct ? ' l\'emporte dès le premier tour.' : ' remporte le second tour.');
    var h = '<div class="kicker">Premier tour</div>' + bars(res.first, res.first[0].pct);
    if (res.second) {
      var s = res.second;
      h += '<div class="kicker" style="margin-top:12px">Second tour</div>' +
        bars([{ pid: s.a, pct: s.pctA }, { pid: s.b, pct: s.pctB }].sort(function (x, y) { return y.pct - x.pct; }), Math.max(s.pctA, s.pctB));
      h += '<div class="transfers">' + s.transfers.map(function (t) {
        return '<p>' + chip(t.pid) + 'Reports : ' + Math.round(100 * t.toA) + ' % → ' + s.a + ', ' + Math.round(100 * t.toB) + ' % → ' + s.b + ', ' + Math.round(100 * t.abst) + ' % abstention' +
          (E.allyOf(g, t.pid) === s.a || E.allyOf(g, t.pid) === s.b ? ' <em class="ally">alliance</em>' : '') + '</p>';
      }).join('') + '</div>';
    }
    var mine = E.finalScores(g).filter(function (x) { return x.pid === me; })[0];
    h += '<p class="hint" style="margin:10px 0 0">Ton objectif « ' + esc(mine.objective.name) + ' » : ' + (mine.met ? 'réussi, des voix en plus !' : 'raté.') + '</p>';
    $('end-table').innerHTML = h;
    go('end');
  }

  /* ---------- Menu & règles ---------- */
  $('btn-menu').addEventListener('click', function () {
    var o = D.OBJECTIVES.filter(function (x) { return x.id === mePl().objective; })[0], p = party(me);
    modal({ kicker: 'Ton parti', title: p.name, html: '<p><b>Objectif secret :</b> ' + esc(o.name) + ' — ' + esc(o.text) + ' (+' + o.bonus + ' pts).</p><p><b>Force :</b> ' + esc(p.force) + '</p><p><b>Faiblesse :</b> ' + esc(p.weakness) + '</p>' + credHtml(me),
            buttons: [{ label: 'Reprendre', primary: true }, { label: 'Règles du jeu', onClick: showRules }, { label: 'Abandonner la partie', onClick: function () { g = null; go('title'); } }] });
  });
  function showRules() {
    modal({ kicker: 'Règles v0.3', title: 'Comment gagner', html:
      '<p><b>But :</b> remporter l\'élection présidentielle à la fin des <b>8 tours de campagne</b>. Chaque région vote selon ses cubes, pondérée par sa population (ses points). Le parti qui contrôle une région y gagne un petit bonus.</p>' +
      '<p><b>Premier tour :</b> plus de 50 % des voix = élu directement. Sinon, les deux premiers vont au <b>second tour</b>, et les électeurs des autres partis se reportent selon leur proximité politique (alliés : 85 %).</p>' +
      axisHtml(me || chosen) +
      '<p><b>Partis proches :</b> quand tu fais un Meeting ou passes à la Télé là où un parti voisin sur l\'axe est présent, tu lui prends 1 électeur (distance 2 : sur un dé de 4 à 6).</p>' +
      '<p><b>Alliances :</b> 1 ★ et 1 action, avec un parti à distance 2 au plus. Entre alliés, pas d\'attaque ni de vol d\'électeurs. Rompre coûte 2 ★ et ruine les reports.</p>' +
      '<p><b>Chaque tour :</b> revenus (4 € + 1 € par région contrôlée, max +3 ; +2 ★), un événement, puis <b>3 actions secrètes</b> jouées par tous en même temps.</p>' +
      '<p><b>Ton message.</b> Meeting, Télé, Buzz et Faire la une portent un <b>thème</b> (💶 🏭 🏥 🌿 🚓 🛂). Son <b>impact</b>, de 0 à 4 = ta crédibilité sur le thème (0 à 2) + 1 si la région s\'en préoccupe + 1 si le thème fait l\'actu. Le bon message au bon endroit rapporte deux fois plus.</p>' +
      '<p><b>Les actions :</b></p><ul class="rules-acts">' +
        '<li>📣 <b>Meeting</b> (2 €) : des cubes dans la région, de 1 à 4 selon l\'impact du message.</li>' +
        '<li>📺 <b>Télé</b> (3 € + 1 ★) : ton message passe dans la région et dans les 2 autres régions les plus concernées par le thème. +1 cube dans chacune (+2 si impact 4, rien si impact 0).</li>' +
        '<li>📱 <b>Buzz</b> (1 €) : un coup de dé, de −1 à +4 cubes. +1 si le thème fait l\'actu.</li>' +
        '<li>🗞️ <b>Faire la une</b> (2 € + 2 ★) : ton thème fera l\'actu au tour suivant… pour tout le monde.</li>' +
        '<li>🥊 <b>Attaquer</b> (2 € + 1 ★) : le rival le plus fort de la région perd 2 cubes (il faut y avoir 1 cube).</li>' +
        '<li>💰 <b>Collecte</b> (gratuit) : +3 € dans la caisse.</li>' +
        '<li>📜 <b>Promesse</b> (4 ★) : dans une région que tu tiens, +1 cube dans toutes les régions du même type.</li>' +
        '<li>🤝 <b>Alliance</b> (1 ★) et 2 cartes spéciales par parti.</li></ul>' +
      '<p><b>Débats</b> aux tours 3, 6 et 8. <b>Sous les projecteurs :</b> le premier des sondages paie 2 ★ ou perd des cubes à chaque fin de tour.</p>' });
  }

  renderTitleMap();
  renderChoose();
})();

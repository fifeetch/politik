/* Politik — interface (écrans, carte, déroulement d'un tour). */
(function () {
  var D = window.PolitikData, M = window.PolitikMap, E = window.PolitikEngine, AI = window.PolitikAI, A = window.PolitikArt, FX = window.PolitikFX;
  var R = D.RULES;
  var dataErrors = D.validate ? D.validate() : [];
  if (dataErrors.length && window.console) console.error('Politik : données incohérentes —', dataErrors);
  var SHORT = { idf: 'IDF', ara: 'ARA', hdf: 'HDF', naq: 'N-AQ', occ: 'OCC', ges: 'G-EST', pac: 'PACA',
                pdl: 'PDL', bre: 'BRE', nor: 'NOR', bfc: 'BFC', cvl: 'CVL', cor: 'CORSE' };
  var NEUTRAL = '#D9DCD3';
  var SVGNS = 'http://www.w3.org/2000/svg';

  var g = null, me = null, chosen = 'VP', selected = null, queue = [];
  var gameMode = 'reel';   // v1.1 : 'reel' (Réaliste) ou 'egal' (Simulation : égalité des chances)
  var gameBase = 'e2024';  // v1.2 : point de départ du mode Réaliste : 'p2022', 'e2024' ou 'sond'
  try { if (localStorage.getItem('politik_mode') === 'egal') gameMode = 'egal'; var sb = localStorage.getItem('politik_base'); if (D.BASES[sb]) gameBase = sb; } catch (e) {}
  var justAdded = -1;                      // v1.4 : la dernière carte posée, qui se retourne
  var theme = null, themePicked = false;   // v0.3 : le message (thème) choisi pour les actions
  var advisorHidden = false;               // v0.7 : la conseillère, masquée pour ce tour
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
    return '<div class="cred">' + D.THEMES.slice().sort(function (a, b) { return E.cred(g, pid, b.id) - E.cred(g, pid, a.id); }).map(function (t) {
      var c = E.cred(g, pid, t.id);
      return '<span class="cred-row cred-' + c + '">' + t.icon + ' ' + esc(t.name) + credDots(c) + '<em>' + lv[c] + '</em></span>';
    }).join('') + '</div>';
  }
  function concernsHtml(rid) {
    return E.REG[rid].concerns.map(function (x) { return '<span class="concern-tag' + (E.isHot(g, x) ? ' hot' : '') + '">' + th(x).icon + ' ' + esc(th(x).short) + '</span>'; }).join('');
  }
  /* v1.5 : l'objectif secret, en clair : progression, état et ce qu'il rapporte vraiment */
  function objShare(o) { return pctFr(E.objectiveShare(o), 1).replace(',0', ''); }
  function objLine(pid) {
    var pl = E.player(g, pid), o = D.OBJECTIVES.filter(function (x) { return x.id === pl.objective; })[0], pr = E.objectiveProgress(g, pid, pl.objective);
    return { o: o, pr: pr, met: pr.done >= pr.need,
      html: '🎯 <b>' + esc(o.name) + '</b> : ' + esc(o.text.charAt(0).toLowerCase() + o.text.slice(1)) + '. <b>' + pr.done + '/' + pr.need + '</b>' +
        (pr.done >= pr.need ? ' ✅ réussi pour l\'instant' : '') + ' · rapporte ≈ +' + objShare(o) + ' % des voix le jour du vote (pas compté dans le sondage)' };
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Écrans ---------- */
  function go(name) {
    if (name === 'choose' || name === 'title' || name === 'setup') g = null;
    if (name !== 'game') FX.clearBreaking();
    Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.remove('active'); });
    $('screen-' + name).classList.add('active');
    if (name === 'choose') renderChoose();
    if (name === 'setup') renderSetup();
  }
  document.addEventListener('click', function (e) {
    var h = e.target.closest('[data-action="tuto"]'); if (h) { forceTuto = true; go('setup'); return; }
    var t = e.target.closest('[data-go]'); if (t) go(t.getAttribute('data-go'));
    var a = e.target.closest('[data-action="rules"]'); if (a) showRules();
  });

  /* ---------- Modale & toast ---------- */
  function modal(opts) {
    var card = document.querySelector('#modal .modal-card');
    card.className = 'modal-card' + (opts.cls ? ' ' + opts.cls : '');
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
    FX.setModal(true);
    FX.replay(card, 'enter');
    if (opts.onOpen) opts.onOpen();
  }
  function closeModal() { $('modal').hidden = true; FX.setModal(false); }
  var toastTimer;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2200); }

  function mio(x) { return x.toFixed(1).replace('.', ','); }
  function pctFr(x, d) { return (100 * x).toFixed(d == null ? 0 : d).replace('.', ','); }
  /* Financé, partiellement financé, non financé (selon le reste à financer) */
  function fundingState(over) { return over <= 0 ? 'ok' : over <= R.budgetCasStep ? 'partial' : 'no'; }
  var FUND_LABEL = { ok: 'Programme financé', partial: 'Partiellement financé', no: 'Non financé' };
  /* Score national de départ du parti (moyenne législatives + européennes 2024), pondéré par les suffrages exprimés de chaque région */
  function score2024(pid) {
    var s = 0, w = 0;
    D.REGIONS.forEach(function (r) { var ex = r.ins * (1 - r.abst / 100) * (1 - (r.blanc + r.nuls) / 100); s += ex * r.start[pid] / 100; w += ex; });
    return s / w;
  }

  /* ---------- Écran titre : carte décorative ---------- */
  function renderTitleMap() {
    // la carte de l'affiche : chaque région à la couleur de son vainqueur des européennes 2024
    var s = $('title-map');
    D.REGIONS.forEach(function (r) {
      var best = Object.keys(r.start).sort(function (a, b) { return r.start[b] - r.start[a]; })[0];
      s.appendChild(svg('path', { d: M.regions[r.id].d, fill: party(best).color, stroke: '#FAFAF6', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }));
    });
  }

  /* ---------- v1.2 : paramètres de la partie ---------- */
  /* Score national de départ d'un parti, en %, pour un point de départ donné */
  function natScore(base, pid) {
    if (base === 'sond') return D.POLLS.avg[pid];
    var s = 0, w = 0;
    D.REGIONS.forEach(function (r) { var ex = r.ins * (1 - r.abst / 100) * (1 - (r.blanc + r.nuls) / 100); s += ex * E.baseScore(base, r, pid); w += ex; });
    return s / w;
  }
  function renderSetup() {
    var modes = [['reel', 'Réaliste', 'Les partis partent avec leurs vrais scores.'], ['egal', 'Simulation', 'Tout le monde part du même point : mêmes électeurs partout, aucun bonus caché.']];
    $('mode-pick').innerHTML = modes.map(function (m) {
      return '<button type="button" role="radio" class="mode-btn' + (gameMode === m[0] ? ' on' : '') + '" data-mode="' + m[0] + '" aria-checked="' + (gameMode === m[0]) + '"><b>' + m[1] + '</b><small>' + m[2] + '</small></button>';
    }).join('');
    $('base-wrap').hidden = gameMode !== 'reel';
    $('base-pick').innerHTML = ['p2022', 'e2024', 'sond'].map(function (k) {
      var B = D.BASES[k], on = gameBase === k, more = '';
      if (on && k === 'sond') {
        more = '<div class="polls"><p>Moyenne de <b>6 sondages</b> réalisés en ' + D.POLLS.date + ' pour la présidentielle 2027 :</p><ul>' +
          D.POLLS.list.map(function (x) { return '<li>' + esc(x.who) + ', ' + esc(x.when) + '</li>'; }).join('') + '</ul>' +
          '<p class="hint">En Mouvement = Philippe (Horizons) + Attal (Renaissance) quand il est testé ; L\'Union Gaulliste = Retailleau (LR) ; Les Verts Pâturages = Tondelier. Les sondages sont nationaux : chaque région garde son profil de 2024 et suit la tendance.</p>' + srcHtml(D.POLLS) + '</div>';
      } else if (on) {
        var L = D.LEARN[B.learn];
        more = '<div class="polls">' + srcHtml(L) + '</div>';
      }
      return '<div class="base-card' + (on ? ' on' : '') + '"><button type="button" role="radio" class="base-btn" data-base="' + k + '" aria-checked="' + on + '"><b>' + esc(B.name) + '</b><small>' + esc(B.text) + '</small></button>' + more +
        (on ? '<button type="button" class="linkbtn base-why" data-learn="' + B.learn + '">Pourquoi ce choix, et ses limites</button>' : '') + '</div>';
    }).join('');
    // aperçu : le score national de départ de chaque parti
    var parts = D.PARTIES.slice().sort(function (a, b) { return a.pos - b.pos; });
    var max = 0, sc = {};
    parts.forEach(function (p) { sc[p.id] = gameMode === 'egal' ? 1 : natScore(gameBase, p.id); max = Math.max(max, sc[p.id]); });
    $('setup-preview').innerHTML = '<h2 class="setup-h">Au départ</h2>' + (gameMode === 'egal'
      ? '<p class="hint">Chaque parti a 2 électeurs dans chaque région. Personne ne tient de région, personne ne part en tête.</p>'
      : '<div class="prev-bars">' + parts.map(function (p) {
          return '<div class="prev-row"><span>' + esc(p.short) + '</span><span class="prev-track"><i style="width:' + (100 * sc[p.id] / max) + '%;background:' + p.color + '"></i></span><b>' + pctFr(sc[p.id] / 100, 1) + ' %</b></div>';
        }).join('') + '</div><p class="hint">Score national. Le reste va aux petites listes, qui comptent sous « Autres » dans les sondages du jeu.</p>');
    Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), function (b) {
      b.addEventListener('click', function () { gameMode = b.getAttribute('data-mode'); try { localStorage.setItem('politik_mode', gameMode); } catch (e) {} renderSetup(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-base]'), function (b) {
      b.addEventListener('click', function () { gameBase = b.getAttribute('data-base'); try { localStorage.setItem('politik_base', gameBase); } catch (e) {} renderSetup(); });
    });
  }
  $('btn-setup-go').addEventListener('click', function () { go('choose'); });

  /* ---------- Choix du parti ---------- */
  function renderChoose() {
    $('choose-kicker').textContent = gameMode === 'egal' ? 'Simulation : tout le monde part à égalité' : 'Réaliste : départ « ' + D.BASES[gameBase].short + ' »';
    var grid = $('party-grid'); grid.innerHTML = '';
    D.PARTIES.forEach(function (p) {
      var b = el('button', { class: 'party-card' + (p.id === chosen ? ' on' : ''), type: 'button', 'aria-pressed': p.id === chosen, style: 'border-left-color:' + p.color });
      b.innerHTML = '<div class="party-band" style="background:' + p.color + ';color:' + p.ink + '"><span class="party-ini">' + p.id +
        '</span><span class="party-fam">' + esc(p.family) + '</span></div><div class="party-face">' + A.portrait(p.id) + '</div><div class="party-body"><span class="party-name">' + esc(p.name) +
        '</span><span class="party-res">' + esc(p.candidate) + '</span></div>';
      b.addEventListener('click', function () { chosen = p.id; renderChoose(); });
      grid.appendChild(b);
    });
    var p = party(chosen);
    $('party-detail').innerHTML = '<div class="cand-line">' + A.portrait(p.id) + '<div><b class="cand-name">' + esc(p.candidate) + '</b><span>' + esc(p.candTitle) + ' · tempérament ' + D.TEMPERS[p.id].label + '</span></div></div>' +
      (gameMode === 'reel' ? '<div class="score24"><span>Score de départ</span><b>' + pctFr(natScore(gameBase, p.id) / 100, 1) + ' %</b><small>' + esc(D.BASES[gameBase].text) + ' <button type="button" class="linkbtn" data-learn="' + D.BASES[gameBase].learn + '">Pourquoi ce chiffre ?</button></small></div>'
        : '<div class="score24"><span>Mode Égalité</span><b>2</b><small>électeurs dans chaque région pour chaque parti : personne ne part en tête.</small></div>') +
      axisHtml(p.id) +
 ((p.pos <= 1 || p.pos >= 6) ? '<div><b>Au bout de l\'axe.</b> Au second tour, les reports de voix seront plus durs à obtenir : il faudra bien négocier entre les deux tours.</div>' : '') +
      '<div><b>Force.</b> ' + esc(p.force) + '</div><div><b>Faiblesse.</b> ' + esc(p.weakness) +
      '</div><div><b>Bases.</b> ' + p.bases.map(function (r) { return E.REG[r].name; }).join(', ') +
      '</div><div><b>Cartes.</b> ' + p.cards.map(function (c) { return D.CARDS[c].name; }).join(' · ') + '</div>';
  }
  $('btn-start').addEventListener('click', function () { openProgramme(chosen); });

  /* ---------- v0.7 : composer son programme ---------- */
  var progSel = [], progFin = [];
  function fansHtml(m) {
    if (!m.fans) return '';
    var up = [], down = [];
    D.SEGMENTS.forEach(function (sg) { var v = m.fans[sg.id] || 0; if (v > 0) up.push(v > 1 ? sg.icon + sg.icon : sg.icon); if (v < 0) down.push(v < -1 ? sg.icon + sg.icon : sg.icon); });
    return (up.length ? ' · 👍 ' + up.join('') : '') + (down.length ? ' · 👎 ' + down.join('') : '');
  }
  function fiche(m) {
    var t = th(m.theme);
    return '<p class="fiche-what">' + esc(m.edu.what) + '</p><div class="fiche-pc"><div class="fiche-pro"><b>👍 Pour</b>' + esc(m.edu.pro) + '</div><div class="fiche-con"><b>👎 Contre</b>' + esc(m.edu.con) + '</div></div>' +
      '<p class="hint">' + t.icon + ' ' + esc(t.name) + ' · ' + costTxt(m.cost) + (m.choc ? ' · 💥 mesure choc' : '') + '</p>' +
      enVrai(m) + srcHtml(m);
  }
  /* v1.2 : qui défend une mesure proche pour 2027 (comparateur pédagogique, non officiel) */
  function enVrai(m) {
    if (!m.vrai) return '';
    var R = D.REFERENCE_2027;
    return '<div class="fiche-vrai"><b>🗳️ En vrai, pour 2027</b><p>' + esc(m.vrai) + '</p>' +
      (R ? '<small>D\'après le comparateur <a href="' + esc(R.url) + '" target="_blank" rel="noopener">Comprendre la Politique</a> (site pédagogique, non officiel), relevé le ' + frDate(R.checked) + '.</small>' : '') + '</div>';
  }
  function frDate(iso) {
    var M = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    var d = iso.split('-'); return (+d[2]) + ' ' + M[+d[1] - 1] + ' ' + d[0];
  }
  function costTxt(c) { return c < 0 ? 'rapporte ' + (-c) + ' Md€' : c === 0 ? 'ne coûte rien' : 'coûte ' + c + ' Md€'; }
  function openProgramme(pid) {
    progSel = party(pid).programme.slice(); progFin = (party(pid).financing || []).slice();
    go('programme'); renderProgramme(pid);
  }
  function renderProgramme(pid) {
    var p = party(pid), all = progSel.concat(progFin), cr = E.programmeCred(pid, progSel);
    var dep = 0, rec = 0; all.forEach(function (id) { var c = E.measure(id).cost; if (c > 0) dep += c; else rec -= c; });
    var reste = dep - rec, over = reste - R.budgetCap;
    $('prog-cand').innerHTML = A.portrait(pid);
    $('prog-sub').textContent = p.candidate + ' · ' + p.name;
    var pct = Math.max(0, Math.min(100, 100 * reste / (R.budgetCap * 2)));
    // qui aime ton programme, et où
    var ap = E.segmentAppeal(all);
    var order = D.REGIONS.slice().sort(function (a, b) { return E.echoOf(all, b.id) - E.echoOf(all, a.id); });
    var good = order.slice(0, R.echoGoodN), bad = order.slice(-R.echoBadN);
    $('prog-budget').innerHTML = '<div class="pb-lines"><span>Dépenses nouvelles</span><b>+' + dep + ' Md€</b><span>Recettes et économies</span><b class="pb-rec">−' + rec + ' Md€</b><span><b>Reste à financer</b></span><b>' + reste + ' Md€</b></div>' +
      '<div class="pb-bar"><i class="' + (over > 0 ? 'over' : '') + '" style="width:' + pct + '%"></i><span class="pb-cap" style="left:50%"></span></div>' +
      '<div class="pb-msg fund-' + fundingState(over) + '"><b>' + FUND_LABEL[fundingState(over)] + '</b> · ' + (over > 0 ? over + ' Md€ au-delà des ' + R.budgetCap + ' Md€ tolérés : ' + Math.ceil(over / R.budgetCasStep) + ' casserole' + (Math.ceil(over / R.budgetCasStep) > 1 ? 's' : '') + ', et les économistes vont s\'en mêler.' : 'il reste moins de ' + R.budgetCap + ' Md€ à trouver.') +
      ' <button type="button" class="linkbtn" data-learn="budget">C\'est quoi, le budget ?</button></div>' +
      '<div class="pb-fans">' + D.SEGMENTS.map(function (sg) { var v = ap[sg.id]; return '<span class="fan ' + (v > 0 ? 'up' : v < 0 ? 'down' : '') + '" title="' + esc(sg.full) + '">' + sg.icon + ' ' + (v > 0 ? '+' : '') + v + '</span>'; }).join('') + '</div>' +
      '<div class="pb-geo">❤️ <b>Régions de cœur</b> : ' + good.map(function (r) { return esc(SHORT[r.id]); }).join(', ') + ' · 👎 <b>hostiles</b> : ' + bad.map(function (r) { return esc(SHORT[r.id]); }).join(', ') +
      ' <button type="button" class="linkbtn" data-geo="1">Pourquoi ?</button></div>' +
      '<div class="pb-note">Les montants sont des ordres de grandeur pour le jeu, pas des chiffrages officiels.</div>';
    $('prog-budget').querySelector('[data-geo]').addEventListener('click', function () { geoModal(all); });
    var list = $('prog-list'); list.innerHTML = '';
    D.THEMES.forEach(function (t) {
      var sec = el('div', { class: 'pl-theme' }, '<div class="pl-head">' + t.icon + ' <b>' + esc(t.name) + '</b><span class="pl-cred">ta crédibilité ' + credDots(cr[t.id]) + '</span></div>');
      D.MEASURES.filter(function (m) { return m.theme === t.id; }).forEach(function (m) {
        var i = progSel.indexOf(m.id), on = i >= 0;
        var row = el('div', { class: 'pl-row' + (on ? ' on' : '') + (i === 0 ? ' phare' : '') });
        row.innerHTML = '<button type="button" class="pl-pick" aria-pressed="' + on + '">' + (i === 0 ? '★' : on ? (i + 1) : '+') + '</button>' +
          '<span class="pl-txt"><b>' + esc(m.name) + '</b><small>' + costTxt(m.cost) + (m.choc ? ' · 💥 choc' : '') + (p.programme.indexOf(m.id) >= 0 ? ' · conseillé' : '') + (i === 0 ? ' · <b>mesure phare</b>' : '') + fansHtml(m) + '</small></span>' +
          (on && i > 0 ? '<button type="button" class="pl-star" title="En faire ta mesure phare">☆</button>' : '') +
          '<button type="button" class="pl-info" aria-label="Le saviez-vous ?">?</button>';
        row.querySelector('.pl-pick').addEventListener('click', function () {
          if (on) progSel.splice(i, 1);
          else if (progSel.length >= R.programmeSize) { toast('5 mesures au plus : retires-en une d’abord.'); return; }
          else progSel.push(m.id);
          renderProgramme(pid);
        });
        var st = row.querySelector('.pl-star');
        if (st) st.addEventListener('click', function () { progSel.splice(i, 1); progSel.unshift(m.id); renderProgramme(pid); toast('Nouvelle mesure phare : ' + m.name); });
        row.querySelector('.pl-info').addEventListener('click', function () { modal({ kicker: 'Le saviez-vous ?', title: m.name, html: fiche(m) }); });
        sec.appendChild(row);
      });
      list.appendChild(sec);
    });
    // financement : jusqu'à 3 mesures de recettes ou d'économies
    var fsec = el('div', { class: 'pl-theme pl-fin' }, '<div class="pl-head">🏦 <b>Comment tu finances</b><span class="pl-cred">' + progFin.length + ' / ' + R.fundingMax + ' (facultatif)</span></div>');
    D.FUNDING.forEach(function (m) {
      var on = progFin.indexOf(m.id) >= 0;
      var row = el('div', { class: 'pl-row' + (on ? ' on' : '') });
      row.innerHTML = '<button type="button" class="pl-pick" aria-pressed="' + on + '">' + (on ? '✓' : '+') + '</button>' +
        '<span class="pl-txt"><b>' + esc(m.name) + '</b><small>' + costTxt(m.cost) + ((p.financing || []).indexOf(m.id) >= 0 ? ' · conseillé' : '') + fansHtml(m) + '</small></span>' +
        '<button type="button" class="pl-info" aria-label="Le saviez-vous ?">?</button>';
      row.querySelector('.pl-pick').addEventListener('click', function () {
        if (on) progFin.splice(progFin.indexOf(m.id), 1);
        else if (progFin.length >= R.fundingMax) { toast('3 mesures de financement au plus.'); return; }
        else progFin.push(m.id);
        renderProgramme(pid);
      });
      row.querySelector('.pl-info').addEventListener('click', function () { modal({ kicker: 'Le saviez-vous ?', title: m.name, html: fiche(m) }); });
      fsec.appendChild(row);
    });
    list.appendChild(fsec);
    $('prog-mini').innerHTML = '<span class="fund-dot fund-' + fundingState(over) + '"></span>' + FUND_LABEL[fundingState(over)] + ' : <b>' + reste + ' Md€</b> à financer · ' + progSel.length + ' / ' + R.programmeSize + ' promesses · ' + progFin.length + ' / ' + R.fundingMax + ' financements';
    $('prog-go').disabled = progSel.length !== R.programmeSize;
    $('prog-go').textContent = progSel.length === R.programmeSize ? 'Entrer en campagne' : 'Encore ' + (R.programmeSize - progSel.length) + ' mesure' + (R.programmeSize - progSel.length > 1 ? 's' : '') + ' à choisir';
  }
  $('prog-reco').addEventListener('click', function () { progSel = party(chosen).programme.slice(); progFin = (party(chosen).financing || []).slice(); renderProgramme(chosen); });
  $('prog-go').addEventListener('click', function () { if (progSel.length === R.programmeSize) startGame(chosen, progSel.slice(), progFin.slice()); });
  $('prog-skip').addEventListener('click', function () {
    if (progSel.length !== R.programmeSize) { toast('Choisis d’abord tes 5 promesses.'); return; }
    modal({ kicker: 'Raccourci', title: 'Gouverner directement ?', html: '<p>La campagne se joue sans toi, et tu l\'emportes de justesse au second tour. Tu commences directement par les législatives, avec le programme que tu viens de composer.</p>',
      buttons: [{ label: '🏛️ Aller au pouvoir', primary: true, onClick: function () { skipCampaign(chosen, progSel.slice(), progFin.slice()); } }, { label: 'Annuler' }] });
  });
  /* Qui vit dans chaque région (Insee), et ce que ton programme leur fait */
  function geoModal(ids) {
    var ap = E.segmentAppeal(ids);
    var html = '<p>Chaque mesure plaît ou déplaît à certains groupes (👍 / 👎). Ton programme rapporte plus là où les groupes qu\'il séduit sont <b>plus nombreux que la moyenne</b>.</p>' +
      '<div class="brief">' + D.SEGMENTS.map(function (sg) { var v = ap[sg.id]; return line(sg.icon, '<b>' + esc(sg.name) + '</b> : ' + (v > 0 ? 'séduits (+' + v + ')' : v < 0 ? 'mécontents (' + v + ')' : 'indifférents') + ' <span class="muted">· ' + E.NATPOP[sg.id].toFixed(0) + ' % des 15 ans ou plus en moyenne</span>'); }).join('') + '</div>' +
      srcHtml({ src: [D.SEGMENTS_SRC] });
    modal({ kicker: 'Ton électorat', title: 'Qui t\'aime, et où ?', html: html });
  }
  /* Qui vit ici ? Composition d'une région (Insee) */
  function popModal(rid) {
    var r = E.REG[rid], pl = g && mePl();
    var bonus = pl ? E.echoBonus(g, me, rid) : 0, ap = pl ? E.segmentAppeal(pl.programme.concat(pl.financing || [])) : null;
    var v = g ? E.regionVoters(g, rid) : { ins: r.ins, abst: r.abst / 100 * R.round1Abst, blank: (r.blanc + r.nuls) / 100 * R.round1Blank };
    var html = '<div class="voters"><div><b>' + mio(v.ins) + ' M</b><span>inscrits</span></div><div><b>' + pctFr(v.abst) + ' %</b><span>s\'abstiennent</span></div><div><b>' + pctFr(v.blank, 1) + ' %</b><span>votent blanc ou nul</span></div></div>' +
      (rid === 'cor' ? '<p class="hint">Corse, outre-mer et Français de l\'étranger, regroupés.</p>' : '') +
      '<div class="popbars">' + D.SEGMENTS.map(function (sg) {
      var v = r.pop[sg.id], n = E.NATPOP[sg.id], a = ap ? ap[sg.id] : 0;
      return '<div class="popbar"><span class="pb-lbl">' + sg.icon + ' ' + esc(sg.name) + '</span><span class="pb-track"><i style="width:' + (v * 2) + '%"></i><em style="left:' + (n * 2) + '%"></em></span><b>' + v.toFixed(1).replace('.', ',') + ' %</b>' +
        (ap ? '<span class="pb-a ' + (a > 0 ? 'up' : a < 0 ? 'down' : '') + '">' + (a > 0 ? '👍' : a < 0 ? '👎' : '·') + '</span>' : '') + '</div>';
    }).join('') + '</div><p class="hint">Le trait rouge = la moyenne nationale. 👍 / 👎 = l\'avis de ce groupe sur ton programme.</p>' +
      (pl ? '<p>' + (bonus > 0 ? '❤️ <b>Région de cœur</b> pour ton programme : +1 cube sur tes Meetings ici.' : bonus < 0 ? '👎 <b>Région hostile</b> à ton programme : −1 cube sur tes Meetings ici.' : 'Ton programme reçoit ici un accueil moyen.') + '</p>' : '') +
      learnBox(rid === 'cor' ? 'outremer' : 'abstention') + srcHtml({ src: [D.SEGMENTS_SRC] });
    modal({ kicker: 'Qui vit ici ?', title: r.name, html: html });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-learn]'); if (!b) return;
    var L = D.LEARN[b.getAttribute('data-learn')];
    if (L) modal({ kicker: 'Le saviez-vous ?', title: L.title, html: '<div class="learn">' + A.advisor() + '<p>' + esc(L.text) + '</p></div>' + srcHtml(L) });
  });
  /* Sources officielles d'une fiche */
  function srcHtml(L) {
    if (!L.src || !L.src.length) return '';
    return '<div class="src"><span>📎 Source' + (L.src.length > 1 ? 's' : '') + ' :</span>' + L.src.map(function (x) {
      return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.label) + '</a>';
    }).join('') + '</div>';
  }
  /* Fiche « Le saviez-vous ? » montrée une seule fois par partie, au bon moment */
  function learnBox(key) {
    var L = D.LEARN[key]; if (!L || !g) return '';
    g.learned = g.learned || {};
    if (g.learned[key]) return '';
    g.learned[key] = true;
    return '<div class="learn learn-inline">' + A.advisor() + '<div><span class="kicker">Le saviez-vous ?</span><b>' + esc(L.title) + '</b><p>' + esc(L.text) + '</p>' + srcHtml(L) + '</div></div>';
  }

  /* ---------- Partie ---------- */
  function startGame(pid, prog, fin) {
    g = E.createGame(pid, { mode: gameMode, base: gameBase }); me = pid; selected = null; queue = []; theme = null; themePicked = false; advisorHidden = false;
    E.setProgramme(g, pid, prog || party(pid).programme, fin || party(pid).financing);
    go('game');
    nextTurn();
  }
  function mePl() { return E.player(g, me); }
  /* Raccourci : la campagne se joue toute seule, et tu l'emportes de justesse au second tour */
  function skipCampaign(pid, prog, fin) {
    g = E.createGame(pid, { mode: gameMode, base: gameBase }); me = pid;
    E.setProgramme(g, pid, prog, fin);
    while (!g.over) {
      var info = E.startTurn(g);
      g.affairs.slice().forEach(function (a) { E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)); });
      if (info.dilemma) E.resolveDilemma(g, info.dilemma.pid, AI.chooseDilemma(g, info.dilemma.pid));
      var plans = {}; g.players.forEach(function (p) { plans[p.id] = AI.plan(g, p.id); });
      E.resolveActions(g, plans);
      g.offers = [];
      if (E.isDebateTurn(g)) {
        var deb = E.setupDebate(g), pr = {}; g.players.forEach(function (p) { pr[p.id] = AI.prep(g, p.id); });
        E.resolveDebate(g, pr, deb.duels.map(function (d) { return { ra: AI.chooseReply(g, d.a, d.theme, d.b), rb: AI.chooseReply(g, d.b, d.theme, d.a) }; }));
      }
      var t = E.spotlightTarget(g); if (t) E.applySpotlight(g, t, AI.paySpotlight(g, t));
      E.endTurn(g);
    }
    if (g.winner !== me) {
      var rival = g.result.first.filter(function (x) { return x.pid !== me; })[0].pid;
      g.result.direct = false;
      g.result.second = { a: me, b: rival, pctA: 0.51, pctB: 0.49, transfers: [] };
      g.winner = me;
    }
    $('btn-govern').hidden = false;
    $('btn-govern').click();
  }

  function nextTurn() {
    var info = E.startTurn(g);
    queue = []; themePicked = false; theme = E.bestTheme(g, me, selected); advisorHidden = false; advReact = null;
    // les affaires et le dilemme des IA se règlent tout de suite ; les tiens t'attendent après le journal
    var aiAff = [];
    g.affairs.filter(function (a) { return a.pid !== me; }).forEach(function (a) { aiAff.push(Object.assign({ src: a.src }, E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)))); });
    var aiDil = null;
    if (info.dilemma && info.dilemma.pid !== me) aiDil = E.resolveDilemma(g, info.dilemma.pid, AI.chooseDilemma(g, info.dilemma.pid));
    render();
    var mine = g.affairs.filter(function (a) { return a.pid === me; });
    var waits = mine.length || (g.dilemma && g.dilemma.pid === me);
    var alerts = [];
    if (info.crisis) alerts.push('CRISE · ' + info.crisis.title);
    mine.forEach(function (a) { alerts.push('AFFAIRE · Toi : ' + a.title); });
    aiAff.forEach(function (x) { alerts.push('AFFAIRE · ' + party(x.pid).short + ' : ' + x.title); });
    info.later.forEach(function (x) { if (x.hit) alerts.push(x.title + (x.pid === me ? '' : ' (' + party(x.pid).short + ')')); });
    FX.breaking('Alerte info', alerts);
    modal({ kicker: 'Tour ' + g.turn + ' / ' + R.maxTurns, title: g.turn === 1 ? 'La campagne commence' : 'Le journal du matin', html: journalHtml(info, aiDil, aiAff),
            buttons: [{ label: mine.length ? 'Une affaire te tombe dessus →' : waits ? 'Une décision t’attend →' : 'À mes actions', primary: true, onClick: function () {
              chain([function (next) { mine.length ? showAffair(next) : next(); },
                     function (next) { g.dilemma && g.dilemma.pid === me ? showDilemma(next) : next(); }], startActions);
            } }] });
  }
  function chain(steps, done) {
    var i = 0;
    (function next() { if (i >= steps.length) return done(); steps[i++](next); })();
  }
  /* Ton affaire : le journal sort l'histoire, tu choisis comment réagir */
  function showAffair(then) {
    var a = g.affairs.filter(function (x) { return x.pid === me; })[0];
    if (!a) return then();
    var src = a.src === 'budget' ? 'Les économistes ont épluché ton programme.' : a.src === 'casseroles' ? 'À force d\'accumuler les casseroles, ça devait sortir.' :
      a.src === 'canard' ? 'Le Canard Déchaîné sort l\'info en une.' : 'Un rival a fouillé ton passé…';
    var html = '<div class="paper paper-spin paper-scandal"><div class="paper-mast">' + (a.src === 'canard' ? 'LE CANARD DÉCHAÎNÉ' : 'LE QUOTIDIEN NATIONAL') + ' <span>· Édition spéciale</span></div>' +
      '<div class="paper-vign">' + A.vignette('scandale') + '</div><div class="paper-head">' + esc(a.title) + '</div></div>' +
      '<p><b>' + esc(src) + '</b> ' + esc(a.text) + '</p>' + learnBox('affaires') +
      '<div class="pick">' + D.REACTIONS.map(function (rc, i) {
        return '<button type="button" class="pick-row" data-rc="' + i + '"><span class="pick-txt"><b>' + esc(rc.label) + '</b><small>' + esc(rc.hint) + '</small></span></button>';
      }).join('') + '</div>';
    modal({ kicker: '💥 Affaire', title: 'Ça sort dans la presse', cls: 'shake', html: html, buttons: [],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-rc]'), function (row) {
          row.addEventListener('click', function () {
            var res = E.resolveAffair(g, me, +row.getAttribute('data-rc'));
            closeModal(); render();
            modal({ kicker: 'Ta réaction', title: res.reaction, html: '<div class="brief">' + [line('🍳', 'L\'affaire est sortie : −1 casserole.')].concat(res.effects.map(function (t) { return line('•', esc(t)); })).join('') + '</div>',
              buttons: [{ label: 'Continuer', primary: true, onClick: function () { showAffair(then); } }] });
          });
        });
      } });
  }
  function startActions() {
    render();
    if (g.turn === 1 && (forceTuto || !T.isActive())) { var before = T.isActive(); T.maybeStart(forceTuto); tutoGame = !before && T.isActive(); forceTuto = false; }
  }
  function line(icon, html) { return '<div class="brief-row"><span class="brief-i">' + icon + '</span><span>' + html + '</span></div>'; }
  /* Le journal du tour : la une, puis « en bref » (seulement ce qui compte) */
  function journalHtml(info, aiDil, aiAff) {
    var vk = info.crisis ? g.news.theme : g.news.theme;
    var h = '<div class="paper paper-spin"><div class="paper-mast">LE QUOTIDIEN NATIONAL <span>· Tour ' + g.turn + '</span></div>' +
      (A.hasVignette(vk) ? '<div class="paper-vign">' + A.vignette(vk) + '</div>' : '');
    if (info.crisis) {
      h += '<div class="paper-crisis">Crise · ' + esc(info.crisis.name) + ' · ' + (info.crisis.index + 1) + '/3</div>' +
        '<div class="paper-head">' + esc(info.crisis.title) + '</div><div class="paper-text">' + esc(info.crisis.text) + '</div>';
    } else {
      var ev = D.EVENTS.filter(function (e) { return e.id === info.event.id; })[0];
      h += '<div class="paper-head">' + esc(ev.title) + '</div><div class="paper-text">' + esc(ev.text) + '</div>';
      if (!ev.theme) h += '<div class="paper-text"><i>Aussi :</i> ' + esc(g.news.headline) + '</div>';
    }
    h += '<div class="paper-foot">🔥 À la une : ' + g.hot.map(function (x) { return th(x).icon + ' <b>' + esc(th(x).name) + '</b>'; }).join(' + ') +
      ' <span class="muted">(+1 d\'impact)</span></div></div>';
    var b = [];
    var inc = info.income.filter(function (x) { return x.pid === me; })[0];
    if (inc) b.push(line('💰', 'Ta caisse : <b>+' + inc.money + ' €</b> · <b>+' + inc.infl + ' ★</b>' + (inc.forme ? ' · <b>+' + inc.forme + ' ⚡</b>' : '')));
    var myMil = info.militants.filter(function (x) { return x.pid === me; });
    if (myMil.length) b.push(line('👥', 'Tes militants : +1 cube en ' + myMil.map(function (x) { return SHORT[x.rid]; }).join(', ')));
    if (info.event) info.event.effects.filter(function (f) { return f.pid === me; }).forEach(function (f) { b.push(line('📰', esc(f.text))); });
    if (info.crisis) info.crisis.effects.forEach(function (t) { b.push(line('📰', esc(t))); });
    (aiAff || []).forEach(function (x) {
      b.push(line('💥', '<b>Affaire pour ' + esc(party(x.pid).short) + '</b> : « ' + esc(x.title) + ' ». Réaction : <b>' + esc(x.reaction) + '</b>' + (x.effects.length ? ' — ' + esc(x.effects.join(', ')) : '') + '.'));
    });
    if (info.programmes) info.programmes.forEach(function (x) {
      if (x.pid === me) {
        b.push(line('📋', 'Il te reste <b>' + x.budget + ' Md€</b> à financer : ' + FUND_LABEL[fundingState(x.over)].toLowerCase() + (x.over > 0 ? ', ça va se voir…' : '.') + (x.cas ? ' (+' + x.cas + ' casserole' + (x.cas > 1 ? 's' : '') + ')' : '')));
        if (x.echo.length) b.push(line('❤️', 'Ton programme fait mouche en ' + x.echo.map(function (r) { return SHORT[r]; }).join(', ') + ' : +1 cube dans chacune.'));
      }
      else if (x.choc.length) b.push(line('📢', esc(party(x.pid).short) + ' fait parler avec « ' + esc(x.choc[0]) + ' ».'));
    });
    info.later.forEach(function (x) {
      if (x.hit) b.push(line('⏳', '<b>' + esc(x.title) + '</b>' + (x.pid === me ? '' : ' (' + esc(party(x.pid).short) + ')') + ' — ' + esc(x.text) + ' ' + esc(x.effects.join(', ')) + '.'));
      else if (x.pid === me) b.push(line('😮‍💨', '« ' + esc(x.title) + ' » : fausse alerte, l\'affaire ne sort pas.'));
    });
    if (info.usure) b.push(line('🕰️', 'Usure du pouvoir : En Mouvement perd 1 cube en ' + esc(E.REG[info.usure].name) + '.'));
    if (aiDil) b.push(line('🤔', esc(party(aiDil.pid).short) + ', face à « ' + esc(aiDil.title) + ' », choisit : <b>' + esc(aiDil.choice) + '</b>' + (aiDil.effects.length ? ' — ' + esc(aiDil.effects.join(', ')) : '') + '.'));
    if (E.isDebateTurn(g)) b.push(line('🎙️', '<b>Débat télévisé</b> à la fin de ce tour : garde de l\'influence (★) pour miser.'));
    if (b.length) h += '<div class="brief"><div class="kicker">En bref</div>' + b.join('') + '</div>';
    if (g.turn === 1) h += learnBox('presidentielle');
    else if (g.turn === 2) h += learnBox('agenda');
    else if (g.turn === 4) h += learnBox('sondages');
    else if (g.turn === 5) h += learnBox('comptes');
    else if (g.turn === 6) h += learnBox('dette');
    else if (g.turn === 7) h += learnBox('temps_parole');
    return h;
  }
  /* ---------- v0.7 : Lulu, la directrice de campagne — un conseil clair par tour ---------- */
  function advice() {
    var pl = mePl(), ph = E.measure(pl.phare), hot = g.hot || [];
    if (g.turn === 1) return 'Bienvenue ! Parle de ta mesure phare (' + th(ph.theme).icon + ' ' + th(ph.theme).short + ') : touche une région qui s\'en soucie, puis 📣 Meeting.';
    if (E.isDebateTurn(g) && pl.infl < 2) return 'Débat télévisé ce soir 🎙️ et tu n\'as presque plus d\'influence ★. Évite la Télé ce tour-ci pour garder de quoi te préparer.';
    if (E.isDebateTurn(g)) return 'Débat télévisé ce soir 🎙️ ! Garde 2 ou 3 ★ pour la préparation : chaque ★ vaut 1 point.';
    if (pl.forme <= 1) return 'Ton candidat est épuisé (⚡ ' + pl.forme + '). Évite Meeting et Télé : 🚪 Mobiliser ou une 💰 Collecte ne le fatiguent pas.';
    if (pl.cas >= 3) return 'Ça sent le roussi : ' + pl.cas + ' casseroles 🍳. Une affaire peut tomber à tout moment. Évite d\'attaquer ou d\'enquêter ce tour-ci.';
    var mineHot = hot.filter(function (t) { return pl.programme.some(function (id) { return E.measure(id).theme === t; }); })[0];
    if (mineHot) {
      var m = pl.programme.map(E.measure).filter(function (x) { return x.theme === mineHot; })[0];
      return th(mineHot).icon + ' ' + th(mineHot).name + ' fait la une, et c\'est dans ton programme (« ' + m.name + ' ») : c\'est le moment d\'en parler !';
    }
    var close = D.REGIONS.filter(function (r) {
      var c = g.regions[r.id].controller, my = E.cubes(g, r.id, me);
      if (c === me || my === 0) return false;
      var top = 0; g.players.forEach(function (p) { if (p.id !== me) top = Math.max(top, E.cubes(g, r.id, p.id)); });
      return top - my <= 1;
    }).sort(function (a, b) { return b.ins - a.ins; })[0];
    if (close) return 'Tu es tout près de prendre ' + close.name + ' (' + mio(close.ins) + ' millions d\'inscrits) : un Meeting bien ciblé peut suffire.';
    if (pl.money < 3) return 'Les caisses sont vides. Une 💰 Collecte (menu Plus) renfloue le parti.';
    if (pl.militants === 0 && g.turn <= 4) return 'Pense aux 👥 militants (menu Plus) : implantés tôt, ils te rapportent des électeurs à chaque tour.';
    var lead = E.ranking(g)[0];
    if (lead !== me && E.player(g, lead).cas > 0 && E.allyOf(g, me) !== lead) return party(lead).short + ' est en tête et traîne des casseroles : une 🔎 enquête (menu Plus) pourrait le faire trébucher.';
    var o = D.OBJECTIVES.filter(function (x) { return x.id === pl.objective; })[0];
    var op = E.objectiveProgress(g, me, pl.objective);
    if (op.done < op.need) return 'N\'oublie pas ton objectif secret : ' + o.text.charAt(0).toLowerCase() + o.text.slice(1) + ' (' + op.done + '/' + op.need + '). Réussi, il rapporte environ ' + objShare(o) + ' % des voix en plus le jour du vote.';
    var low = D.REGIONS.slice().sort(function (a, b) { return E.lowTurnoutFit(g, me, b.id) - E.lowTurnoutFit(g, me, a.id); })[0];
    if (g.turn <= R.registerTurns + 2 && E.lowTurnoutFit(g, me, low.id) >= 0.18) return 'En ' + low.name + ', ton programme parle à ceux qui votent peu : 🚪 Mobiliser y fait voter des abstentionnistes.';
    return 'Vise les régions qui pèsent lourd : le chiffre sur la carte, c\'est leur nombre d\'inscrits, en millions.';
  }
  /* v1.4 : Lulu parle dans une bulle de BD. Elle s'écrit lettre par lettre quand le conseil change,
     et Lulu réagit quelques secondes à chaque action que tu programmes. */
  var advShown = null, advTyper = null, advReact = null, advReactTimer = null;
  function renderAdvisor() {
    var box = $('advisor');
    if (!g || g.phase !== 'actions' || advisorHidden) { box.hidden = true; advShown = null; return; }
    var text = advReact || advice();
    if (!box.hidden && text === advShown) return;
    box.hidden = false; advShown = text;
    if (!box.querySelector('.adv-bubble')) {
      box.innerHTML = '<span class="adv-face">' + A.advisor() + '</span><p class="adv-bubble" aria-live="polite"><b>' + D.ADVISOR.name + ' :</b> <span class="adv-txt"></span></p><button type="button" class="adv-close" aria-label="Masquer le conseil">✕</button>';
      box.querySelector('.adv-close').addEventListener('click', function () { advisorHidden = true; renderAdvisor(); });
    }
    box.classList.toggle('react', !!advReact);
    var txt = box.querySelector('.adv-txt');
    if (advTyper) advTyper.stop();
    txt.textContent = '';
    FX.whenFree('lulu', function () {
      if (advShown !== text || box.hidden) return;
      FX.replay(box.querySelector('.adv-face'), 'lulu-pop');
      FX.replay(box.querySelector('.adv-bubble'), 'bubble-in');
      advTyper = FX.type(txt, text);
    });
  }
  function luluSay(text) {
    advReact = text;
    clearTimeout(advReactTimer);
    advReactTimer = setTimeout(function () { advReact = null; if (g) renderAdvisor(); }, 5200);
  }
  /* Ce que Lulu dit quand tu programmes une action */
  function luluLine(act, wasTiring) {
    var rn = act.region ? E.REG[act.region].name : '';
    if (wasTiring) return 'Doucement ! Le candidat tire la langue (⚡ à 0) : à ce rythme, la gaffe nous guette.';
    if (queue.length >= R.actionsPerTurn) return 'Les 3 actions sont prêtes. Tu valides quand tu veux, on fonce !';
    switch (act.type) {
      case 'terrain': var n = E.terrainCubes(g, me, act.region, act.theme);
        return n >= 3 ? '+' + n + ' en ' + rn + ' ? Je réserve la plus grande salle de la ville !' : 'Un meeting en ' + rn + ' : je préviens la presse locale.';
      case 'medias': return 'Un passage télé : ça rayonne sur trois régions d\'un coup. Bien vu.';
      case 'mobiliser': return 'Aller chercher ceux qui ne votent plus en ' + rn + ' : c\'est souvent là que tout se joue.';
      case 'reseaux': return 'Les réseaux sociaux… carton ou flop. Croisons les doigts !';
      case 'imposer': return 'Demain, tout le monde parlera de notre sujet. Malin.';
      case 'contre': return 'Ça va faire du bruit… et nous coûter une casserole 🍳.';
      case 'militants': return 'Des militants en ' + rn + ' : ils rapporteront à chaque tour.';
      case 'fonds': return 'On renfloue les caisses. Les donateurs adorent les petits-fours.';
      case 'reforme': return 'Montrer ce qu\'on fait là où on gouverne : du concret, j\'adore.';
      case 'card': return 'Tu sors une carte maîtresse : « ' + D.CARDS[act.card].name + ' » !';
      case 'enquete': return 'On fouille… mais si on se fait prendre, ça nous retombe dessus.';
      case 'rupture': return 'Rompre ? Leurs électeurs ne l\'oublieront pas de sitôt.';
    }
    return 'Noté !';
  }

  /* Ton dilemme du tour */
  function showDilemma(then) {
    var d = E.dilemmaDef(g.dilemma.id);
    var html = '<p>' + esc(d.text) + '</p><div class="pick">' + d.options.map(function (o, i) {
      return '<button type="button" class="pick-row" data-o="' + i + '"><span class="pick-txt"><b>' + esc(o.label) + '</b><small>' + esc(o.hint) + '</small></span></button>';
    }).join('') + '</div>';
    modal({ kicker: 'Dilemme', title: d.title, html: html, buttons: [],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('.pick-row'), function (row) {
          row.addEventListener('click', function () {
            var res = E.resolveDilemma(g, me, +row.getAttribute('data-o'));
            closeModal(); render();
            modal({ kicker: 'Ton choix', title: res.choice, html: res.effects.length ? '<div class="brief">' + res.effects.map(function (t) { return line('•', esc(t)); }).join('') + '</div>' : '<p>Rien de plus… pour l\'instant.</p>',
              buttons: [{ label: 'À mes actions', primary: true, onClick: then }] });
          });
        });
      } });
  }

  /* La Une du tour : le thème qui fait l'actu (+ ceux imposés par les partis) */
  function newsHtml(n) {
    if (!n) return '';
    var t = th(n.theme), mine = E.cred(g, me, n.theme);
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
    var pl = mePl(), m = pl.money, f = pl.infl, fo = pl.forme;
    queue.forEach(function (a) {
      var c = E.actionCost(g, me, a); m -= c.money; f -= c.infl; fo -= c.forme;
      if (a.type === 'fonds') { m += E.fundsGain(me).money; f += E.fundsGain(me).infl; }
      if (a.type === 'card' && a.card === 'primaire') f += 3;
      if (a.type === 'card' && a.card === 'rassemblement') { m += 3; f += 1; }
    });
    return { money: m, infl: f, forme: fo };
  }
  function canQueue(act) {
    if (g.phase !== 'actions') return 'Ce n’est pas le moment.';
    if (queue.length >= R.actionsPerTurn) return 'Tes 3 actions sont déjà choisies.';
    if (act.type === 'card' && queue.some(function (q) { return q.card === act.card; })) return 'Carte déjà programmée.';
    var err = E.checkAction(g, me, act); if (err) return err;
    var c = E.actionCost(g, me, act), pr = projected();
    if (pr.money < c.money) return 'Pas assez d’argent.';
    if (pr.infl < c.infl) return 'Pas assez d’influence.';
    if (pr.forme < c.forme) return 'Ton candidat est épuisé (⚡ 0). Il récupère au prochain tour.';
    return null;
  }
  function addAction(act) {
    var err = canQueue(act);
    if (err) { toast(err); return; }
    var wasTiring = tiring(act);
    queue.push(act); justAdded = queue.length - 1;
    luluSay(luluLine(act, wasTiring));
    render(); T.notify('queue');
  }

  /* ---------- Rendu ---------- */
  function render() {
    if (!g) return;
    var pl = mePl(), pr = projected();
    $('turn-label').textContent = 'Tour ' + g.turn + ' sur ' + R.maxTurns;
    $('phase-label').textContent = E.isDebateTurn(g) ? 'Débat télévisé ce soir' : '3 actions à jouer';
    function pill(id, sym, now, before) { $(id).innerHTML = sym + ' ' + now + (now !== before ? '<small>/' + before + '</small>' : ''); }
    pill('res-money', '€', pr.money, pl.money); pill('res-infl', '★', pr.infl, pl.infl); pill('res-forme', '⚡', pr.forme, pl.forme);
    $('res-forme').classList.toggle('low', pr.forme <= 0);
    // dynamique et casseroles : une seule ligne discrète dans l'encadré du sondage
    var st = [];
    if (pl.momentum > 0) st.push('<span class="st st-up">↗ En dynamique</span>');
    if (pl.momentum < 0) st.push('<span class="st st-down">↘ Passage à vide</span>');
    if (pl.cas > 0) st.push('<span class="st st-cas" title="Casseroles">' + new Array(pl.cas + 1).join('🍳') + '</span>');
    $('race-status').innerHTML = st.length ? st.join('') : '50 % : élu dès le 1er tour';
    renderRace(); renderNews(); renderAdvisor(); renderMap(); renderRegion(); renderQueue(); renderMessage(); renderActions();
  }
  /* v1.4 : on garde les mêmes barres d'un tour à l'autre pour qu'elles glissent vers leur nouvelle valeur,
     et seulement quand l'écran est visible (pas derrière une fenêtre). */
  var raceG = null, raceSig = '', raceShown = {};
  function renderRace() {
    var sig = E.poll(g).map(function (x) { return x.pid + Math.round(x.pct * 1000); }).join() + '|' + E.allyOf(g, me);
    if (raceG === g && sig === raceSig) return;
    var fresh = raceG !== g; raceG = g; raceSig = sig;
    if (fresh) { raceShown = {}; $('race-bar').innerHTML = ''; drawRace(true); }
    else FX.whenFree('race', function () { if (g) drawRace(false); });
  }
  function drawRace(instant) {
    var bar = $('race-bar'), leg = $('race-legend'), ally = E.allyOf(g, me), poll = E.poll(g);
    var au = 1 - poll.reduce(function (s, x) { return s + x.pct; }, 0);
    var rows = poll.concat(au > 0.005 ? [{ pid: '_autres', pct: au }] : []), keep = {};
    bar.classList.toggle('instant', instant);
    rows.forEach(function (x, i) {
      keep[x.pid] = 1;
      var seg = bar.querySelector('[data-pid="' + x.pid + '"]');
      if (!seg) {
        seg = el('div', { class: 'seg' + (x.pid === '_autres' ? ' seg-autres' : ''), 'data-pid': x.pid, style: 'width:0' });
        if (x.pid !== '_autres') seg.style.background = party(x.pid).color;
        bar.appendChild(seg);
      }
      seg.style.order = x.pid === '_autres' ? 50 : i;
      seg.classList.toggle('me', x.pid === me);
      if (instant) seg.style.width = (100 * x.pct) + '%';
      else requestAnimationFrame(function () { seg.style.width = (100 * x.pct) + '%'; });
    });
    Array.prototype.forEach.call(bar.querySelectorAll('.seg'), function (sg) { if (!keep[sg.getAttribute('data-pid')]) sg.remove(); });
    if (!bar.querySelector('.mark')) bar.appendChild(el('div', { class: 'mark' }));
    if (instant) requestAnimationFrame(function () { bar.classList.remove('instant'); });
    leg.innerHTML = '';
    var shown = {};
    // v1.7 : 12 partis. La légende montre les 5 premiers, toi, et regroupe le reste (la barre, elle, montre tout le monde)
    var top = poll.slice(0, 5).map(function (x) { return x.pid; });
    if (top.indexOf(me) < 0) top.push(me);
    var rest = poll.filter(function (x) { return top.indexOf(x.pid) < 0; });
    rows.forEach(function (x) { if (top.indexOf(x.pid) < 0 && x.pid !== '_autres') shown[x.pid] = x.pct; });
    var restPct = rest.reduce(function (t, x) { return t + x.pct; }, 0) + au;
    rows = poll.filter(function (x) { return top.indexOf(x.pid) >= 0; }).concat(restPct > 0.005 ? [{ pid: '_autres', pct: restPct, n: rest.length }] : []);
    rows.forEach(function (x) {
      var old = raceShown[x.pid], now = Math.round(100 * x.pct), was = old == null ? null : Math.round(100 * old);
      var trend = !instant && was != null && was !== now ? (now > was ? 'up' : 'down') : '';
      var name = x.pid === '_autres' ? (x.n ? x.n + ' autres' : 'Autres') : x.pid === me ? 'Toi' : x.pid;
      var sw = x.pid === '_autres' ? '<i class="sw sw-autres"></i>' : '<i class="sw" style="background:' + party(x.pid).color + '"></i>';
      var span = el('span', { class: x.pid === '_autres' ? 'autres' : x.pid === me ? 'me' : '' },
        sw + name + ' <span class="num">' + (trend ? was : now) + '</span> %' + (trend ? '<b class="trend ' + trend + '">' + (trend === 'up' ? '▲' : '▼') + '</b>' : '') + (x.pid === ally ? ' <em class="ally">allié</em>' : ''));
      leg.appendChild(span);
      if (trend) FX.count(span.querySelector('.num'), was, now, 800, function (v) { return Math.round(v); });
      shown[x.pid] = x.pct;
    });
    raceShown = shown;
  }
  var mapMode = 'ctrl';
  /* Calque « Abstention » : du plus clair (on vote) au plus foncé (on s'abstient) */
  function abstFill(a) { var t = Math.max(0, Math.min(1, (a - 0.18) / 0.34)); var c0 = [236, 230, 214], c1 = [44, 38, 92]; return 'rgb(' + c0.map(function (v, i) { return Math.round(v + (c1[i] - v) * t); }).join(',') + ')'; }
  /* v1.4 : la carte vivante.
     - ink : les régions qui viennent de changer de main. La nouvelle couleur se répand depuis le centre.
     - candPos : la région où se trouve ton candidat (son pion se déplace à chaque tour). */
  var mapG = null, lastCtrl = {}, ink = {}, candPos = null, pawnEl = null, replaying = false;
  function ctrlColor(c) { return c ? party(c).color : NEUTRAL; }
  function pawnPt(rid) { var m = M.regions[rid]; return { x: m.x - 19, y: m.y + 4 }; }
  function startPos() {
    var best = 'idf', bn = -1;
    D.REGIONS.forEach(function (r) { var n = E.cubes(g, r.id, me); if (n > bn) { bn = n; best = r.id; } });
    return best;
  }
  function inkPending() { return Object.keys(ink).filter(function (k) { return !ink[k].started; }).length; }
  function inkMs() { var n = Object.keys(ink).length; return n && !FX.reduced ? 950 + 160 * (n - 1) : 0; }
  function startInk() {
    var i = 0;
    Object.keys(ink).forEach(function (rid) {
      var k = ink[rid]; if (k.started) return;
      k.started = true;
      FX.wait(160 * i++, function () {
        if (ink[rid] !== k) return;
        var m = M.regions[rid];
        if (mapMode !== 'abst') FX.ripple($('map'), m.x, m.y, k.to, k.mine);
        FX.tween(950, function (t) { k.p = t; FX.inkSet(rid, t); }, function () {
          if (ink[rid] === k) delete ink[rid];
          if (!Object.keys(ink).length && g && !replaying) renderMap();
        });
      });
    });
  }
  function renderMap() {
    var s = $('map'); s.innerHTML = '';
    var abstMode = mapMode === 'abst';
    $('map-wrap').classList.toggle('mode-abst', abstMode);
    if (mapG !== g) { mapG = g; ink = {}; lastCtrl = {}; D.REGIONS.forEach(function (r) { lastCtrl[r.id] = g.regions[r.id].controller; }); candPos = startPos(); }
    D.REGIONS.forEach(function (r) {
      var c = g.regions[r.id].controller, c0 = lastCtrl[r.id];
      if (c === c0) return;
      lastCtrl[r.id] = c;
      if (abstMode) return;
      var from = ink[r.id] ? ink[r.id].to : ctrlColor(c0);
      ink[r.id] = { from: from, to: ctrlColor(c), p: 0, started: false, mine: c === me || c0 === me };
    });
    // l'encart : Corse, outre-mer et Français de l'étranger
    s.appendChild(svg('rect', { x: 326, y: 292, width: 42, height: 63, rx: 3, class: 'inset' }));
    var il = svg('text', { x: 347, y: 289, class: 'inset-l' }); il.textContent = '+ outre-mer'; s.appendChild(il);
    D.REGIONS.forEach(function (r) {
      var c = g.regions[r.id].controller;
      var k = abstMode ? null : ink[r.id];
      var fill = abstMode ? abstFill(E.regionVoters(g, r.id).abst) : k ? k.from : c ? party(c).color : NEUTRAL;
      var p = svg('path', { d: M.regions[r.id].d, class: 'reg', fill: fill, tabindex: 0, role: 'button', 'aria-label': r.name, 'data-rid': r.id });
      p.addEventListener('click', function () { selectRegion(r.id); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRegion(r.id); } });
      s.appendChild(p);
      if (k) FX.inkLayer(s, r.id, p, M.regions[r.id].d, M.regions[r.id].x, M.regions[r.id].y, k.to, k.p);
    });
    if (inkPending()) FX.whenFree('ink', startInk);
    if (selected) {
      s.appendChild(svg('path', { d: M.regions[selected].d, class: 'sel' }));
      s.appendChild(svg('path', { d: M.regions[selected].d, class: 'sel-glow' }));
    }
    D.REGIONS.forEach(function (r) {
      var m = M.regions[r.id], gb = svg('g', { class: 'badge' });
      var label = abstMode ? pctFr(E.regionVoters(g, r.id).abst) + '%' : mio(r.ins);
      gb.appendChild(svg('rect', { x: m.x - 11, y: m.y - 7, width: 22, height: 13, rx: 6.5 }));
      var t = svg('text', { x: m.x, y: m.y + 3 }); t.textContent = label; gb.appendChild(t);
      s.appendChild(gb);
    });
    // crises : icônes posées sur la carte
    var seen = {};
    (g.markers || []).forEach(function (mk) {
      if (seen[mk.rid]) return; seen[mk.rid] = 1;
      var m = M.regions[mk.rid];
      var t = svg('text', { x: m.x - 15, y: m.y - 5, class: 'marker' }); t.textContent = mk.icon; s.appendChild(t);
    });
    // tes équipes de militants
    Object.keys(g.bases || {}).forEach(function (rid) {
      if (g.bases[rid].indexOf(me) < 0) return;
      var m = M.regions[rid];
      var t = svg('text', { x: m.x - 4, y: m.y + 19, class: 'marker marker-sm' }); t.textContent = '👥'; s.appendChild(t);
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
    // le pion de ton candidat
    pawnEl = null;
    if (!abstMode && candPos) { var pp = pawnPt(candPos); pawnEl = FX.pawn(s, pp.x, pp.y, A.portrait(me), party(me).color); }
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-mapmode]'), function (b) {
    b.addEventListener('click', function () {
      mapMode = b.getAttribute('data-mapmode');
      Array.prototype.forEach.call(document.querySelectorAll('[data-mapmode]'), function (x) { x.setAttribute('aria-pressed', x === b); });
      if (g) renderMap();
    });
  });
  function selectRegion(rid) {
    selected = rid;
    if (!themePicked) theme = E.bestTheme(g, me, rid);
    render(); T.notify('region');
  }
  function renderRegion() {
    var box = $('region-info');
    if (!selected) {
      box.innerHTML = '<div class="region-head"><div><h2 class="region-name">Touche une région</h2>' +
        '<span class="region-sub">' + objLine(me).html + '</span></div></div>';
      return;
    }
    var r = E.REG[selected], reg = g.regions[selected], c = reg.controller;
    var tag = c === me ? '<span class="stamp">À toi</span>'
      : c ? '<span class="tag" style="background:' + party(c).color + ';color:' + party(c).ink + '">' + c + '</span>'
      : '<span class="tag tag-yellow">À prendre</span>';
    var v = E.regionVoters(g, selected), echo = E.echoBonus(g, me, selected);
    var html = '<div class="region-head"><h2 class="region-name">' + esc(r.name) + '</h2>' + tag + '</div>' +
      '<div class="chips"><span class="chip"><b>' + mio(v.ins) + ' M</b> inscrits</span><span class="chip"><b>' + pctFr(v.abst) + ' %</b> abstention</span>' +
      (echo > 0 ? '<span class="chip chip-good">❤️ Région de cœur</span>' : echo < 0 ? '<span class="chip chip-bad">👎 Hostile</span>' : '') + '</div>' +
      '<div class="chips"><span class="chips-k">Soucis</span>' + r.concerns.map(function (x) { return '<span class="chip chip-theme' + (E.isHot(g, x) ? ' hot' : '') + '">' + th(x).icon + ' ' + esc(th(x).short) + (E.isHot(g, x) ? ' 🔥' : '') + '</span>'; }).join('') + '<button type="button" class="linkbtn chips-end" id="btn-pop">Qui vit ici ?</button></div>';
    // forces en présence : une barre empilée, du plus fort au plus faible
    var rows = g.players.filter(function (p) { return p.id === me || E.cubes(g, selected, p.id) > 0; })
      .sort(function (a, b) { return E.cubes(g, selected, b.id) - E.cubes(g, selected, a.id); });
    var tot = 0; rows.forEach(function (p) { tot += E.cubes(g, selected, p.id); });
    html += '<div class="forces-wrap"><div class="forces-bar">' + rows.filter(function (p) { return E.cubes(g, selected, p.id) > 0; }).map(function (p) {
      var n = E.cubes(g, selected, p.id), P = party(p.id);
      return '<span class="fseg' + (p.id === me ? ' me' : '') + '" style="flex:' + n + ';background:' + P.color + ';color:' + P.ink + '">' + (p.id === me ? 'Toi' : p.id) + ' ' + n + '</span>';
    }).join('') + (tot ? '' : '<span class="fseg empty">Personne ici</span>') + '</div>' +
      ((g.bases[selected] || []).indexOf(me) >= 0 ? '<div class="forces-foot">👥 Tes militants sont implantés ici : +1 électeur par tour.</div>' : '') + '</div>';
    var bd = E.terrainBreakdown(g, me, selected, theme), room = R.maxCubes != null ? R.maxCubes - E.cubes(g, selected, me) : null;
    html += '<div class="calc-line">📣 Meeting ici : ' + bd.parts.map(function (x, i) { return (i ? (x.n >= 0 ? ' + ' : ' − ') : '') + esc(x.label) + ' <b>' + (i ? Math.abs(x.n) : x.n) + '</b>'; }).join('') +
      ' = <b>' + bd.total + ' cube' + (bd.total > 1 ? 's' : '') + '</b>' + (E.poachTarget(g, me, selected, true) ? ' <span class="muted">· et peut-être 1 électeur pris à un parti voisin</span>' : '') + (room != null && room < bd.total ? ' <span class="calc-warn">(plafond : +' + Math.max(0, room) + ' seulement)</span>' : '') + '</div>';
    var mk = E.markerAt(g, selected);
    if (mk) html += '<div class="mk-line">' + mk.icon + ' ' + esc(mk.title) + ' : ici, ' + th(mk.theme).icon + ' ' + esc(th(mk.theme).name) + ' compte comme à la une.</div>';
    box.innerHTML = html;
    var bp = $('btn-pop'); if (bp) bp.addEventListener('click', function () { popModal(selected); });
  }
  function renderQueue() {
    var box = $('queue-slots'); box.innerHTML = '';
    for (var i = 0; i < R.actionsPerTurn; i++) {
      var a = queue[i];
      if (!a) { box.appendChild(el('div', { class: 'slot' }, 'Action ' + (i + 1))); continue; }
      var name = a.type === 'card' ? D.CARDS[a.card].name : D.ACTIONS[a.type].name;
      var sub = (a.theme ? th(a.theme).icon + ' ' : '') + (a.region ? SHORT[a.region] : a.target ? a.target : a.theme ? th(a.theme).short : '✕ retirer');
      var b = el('button', { class: 'slot full' + (i === justAdded ? ' flip' : ''), type: 'button', 'aria-label': 'Retirer ' + name },
        '<span class="slot-in"><span class="face front">' + esc(name) + '<small>' + sub + '</small></span><span class="face back" aria-hidden="true">★</span></span>');
      (function (idx) { b.addEventListener('click', function () { queue.splice(idx, 1); render(); }); })(i);
      box.appendChild(b);
    }
    justAdded = -1;
    $('btn-validate').textContent = queue.length < R.actionsPerTurn ? 'Valider ' + queue.length + '/3' : 'Valider';
    $('btn-validate').disabled = g.phase !== 'actions';
  }
  function costLabel(act, compact) {
    var c = E.actionCost(g, me, act), parts = [], sp = compact ? '' : ' ';
    if (c.money) parts.push(c.money + sp + '€'); if (c.infl) parts.push(c.infl + sp + '★'); if (c.forme) parts.push(c.forme + sp + '⚡');
    return parts.length ? parts.join(compact ? ' ' : ' + ') : 'gratuit';
  }
  /* Vrai si cette action viderait la forme du candidat (risque de gaffe) */
  function tiring(act) {
    var c = E.actionCost(g, me, act);
    return c.forme > 0 && projected().forme - c.forme === 0;
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
      case 'mobiliser':
        if (!r) return 'fais voter des abstentionnistes';
        n = E.mobilizeGain(g, me, r); return '<b>+' + n.n + ' cube' + (n.n > 1 ? 's' : '') + '</b> · des abstentionnistes vont voter';
      case 'reseaux': return 'dé : <b>−1 à +' + (4 + (E.isHot(g, act.theme) ? 1 : 0)) + '</b> cubes';
      case 'imposer': return 'ton thème <b>à la une</b>';
      case 'contre': return 'rival en tête <b>−2 cubes</b> · +1 🍳';
      case 'militants': return '<b>+1 cube</b> ici à chaque tour · ' + (R.militantsMax - mePl().militants) + ' équipe' + (R.militantsMax - mePl().militants > 1 ? 's' : '') + ' dispo';
      case 'fonds': return '<b>+' + E.fundsGain(me).money + ' €' + (E.fundsGain(me).infl ? ' +' + E.fundsGain(me).infl + ' ★' : '') + '</b>';
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
        var c = E.cred(g, me, x.t.id); why.push(['pas ton sujet', 'tu es crédible', 'ton point fort'][c]);
        if (c < 2) { var left = R.credTalk - (mePl().talk[x.t.id] || 0); why.push('encore ' + left + ' action' + (left > 1 ? 's' : '') + ' pour progresser'); }
        if (selected && E.concerns(selected, x.t.id)) why.push('la région s\'en soucie');
        var mk = selected && E.markerAt(g, selected, x.t.id);
        if (E.isHot(g, x.t.id)) why.push('🔥 à la une');
        else if (mk) why.push(mk.icon + ' sujet brûlant ici');
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
  var MAIN = ['terrain', 'medias', 'mobiliser'];
  function renderActions() {
    var box = $('actions'); box.innerHTML = '';
    MAIN.forEach(function (type) {
      var def = D.ACTIONS[type], act = { type: type, region: selected || undefined, theme: def.theme ? theme : undefined };
      var big = selected ? '+' + bigGain(act) : '—';
      var b = el('button', { class: 'tile', type: 'button', 'aria-label': def.name + ', ' + costLabel(act) },
        '<span class="tile-n">' + def.name + '</span><span class="tile-mid"><span class="tile-i">' + def.icon + '</span><span class="tile-big">' + big + '</span></span>' +
        (selected && tiring(act) && !canQueue(act) ? '<span class="tile-cost tile-warn">⚠️ risque de gaffe</span>' : '<span class="tile-cost">' + costLabel(act, true) + '</span>'));
      if (!selected) b.disabled = true;
      else if (canQueue(act)) b.classList.add('dim');
      b.addEventListener('click', function () { addAction(act); });
      box.appendChild(b);
    });
    var more = el('button', { class: 'tile tile-more', type: 'button', id: 'btn-more' }, '<span class="tile-n">Plus</span><span class="tile-mid"><span class="tile-big">⋯</span></span><span class="tile-cost">7 actions</span>');
    more.addEventListener('click', moreMenu);
    box.appendChild(more);
  }
  function bigGain(act) {
    if (act.type === 'mobiliser') return E.mobilizeGain(g, me, act.region).n;
    if (act.type === 'terrain') return E.terrainCubes(g, me, act.region, act.theme);
    var n = 0; E.mediaRegions(g, me, act.region, act.theme).forEach(function (rid) { n += E.mediaCubes(g, me, rid, act.theme); }); return n;
  }
  /* Les autres actions, dans une fenêtre où l'on a la place de les expliquer */
  function moreMenu() {
    if (g.phase !== 'actions') return;
    var items = [];
    ['reseaux', 'militants', 'imposer', 'contre', 'fonds', 'reforme'].forEach(function (type) {
      var def = D.ACTIONS[type], act = { type: type, region: def.target === 'region' ? selected : undefined, theme: def.theme ? theme : undefined };
      var err = def.target === 'region' && !selected ? 'choisis d\'abord une région' : canQueue(act);
      items.push({ act: act, icon: def.icon, name: def.name, cost: costLabel(act), fx: effect(act), err: err });
    });
    mePl().cards.forEach(function (k) {
      var def = D.CARDS[k], act = { type: 'card', card: k, region: def.target === 'region' ? selected : undefined };
      var err = def.target === 'region' && !selected ? 'choisis d\'abord une région' : canQueue(act);
      items.push({ act: act, icon: '🃏', name: def.name, cost: 'carte unique', fx: esc(def.text), err: err });
    });
    items.push({ special: 'enquete', icon: '🔎', name: 'Enquêter sur un rival', cost: costLabel({ type: 'enquete', target: null }),
      fx: 'Fouiller son passé : s\'il traîne des casseroles, une affaire lui tombe dessus', err: g.turn >= R.maxTurns ? 'trop tard pour sortir un dossier' : null });
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
            if (it.special === 'enquete') enqueteMenu();
            else if (it.special === 'alliance') allianceMenu();
            else if (it.special === 'break') confirmBreak();
            else addAction(it.act);
          });
        });
      } });
  }
  function enqueteMenu() {
    var rows = g.players.filter(function (p) { return p.id !== me; });
    var html = '<p>Tes équipes fouillent le passé d\'un rival. Plus il traîne de casseroles 🍳, plus tu as de chances de trouver quelque chose. Mais si on découvre tes barbouzes, c\'est toi qui prends 2 casseroles.</p>' + learnBox('affaires');
    var buttons = rows.map(function (p) {
      var err = E.checkAction(g, me, { type: 'enquete', target: p.id }) || canQueue({ type: 'enquete', target: p.id });
      var pl = E.player(g, p.id), ch = Math.round(100 * E.enqueteChance(g, p.id));
      return { label: party(p.id).short + ' · ' + pl.cas + ' 🍳 · ' + (err ? err : ch + ' % de chances'), disabled: !!err, onClick: function () { addAction({ type: 'enquete', target: p.id }); } };
    });
    buttons.push({ label: 'Annuler' });
    modal({ kicker: costLabel({ type: 'enquete' }) + ' · 1 action', title: 'Enquêter sur qui ?', html: html, buttons: buttons });
  }
  function allianceMenu() {
    var rows = g.players.filter(function (p) { return p.id !== me; }).sort(function (a, b) { return E.dist(me, a.id) - E.dist(me, b.id); });
    var html = learnBox('alliances') + axisHtml(me) + '<p>Un allié ne peut pas t\'attaquer (ni toi l\'attaquer), vous ne vous volez pas d\'électeurs, et au second tour ses électeurs se reportent à <b>' + Math.round(R.allyTransfer * 100) + ' %</b> sur toi.</p>';
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

  /* Le coup de tampon : il répond au clic, puis on passe à la suite */
  function stampThen(fn) {
    var q = document.querySelector('.queue'), reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var st = el('span', { class: 'stamp stamp-hit', 'aria-hidden': 'true' }, 'Validé');
    q.classList.add('played');
    q.appendChild(st);
    setTimeout(function () { st.remove(); q.classList.remove('played'); fn(); }, reduce ? 150 : 820);
  }
  function resolve() {
    if (!resolve.busy) { resolve.busy = true; return stampThen(function () { resolve(); resolve.busy = false; }); }
    T.stop();
    // photo avant les actions, pour le flash info
    var before = {}, ctrl0 = {}, allies0 = Object.assign({}, g.alliances);
    E.poll(g).forEach(function (x) { before[x.pid] = x.pct; });
    D.REGIONS.forEach(function (r) { ctrl0[r.id] = g.regions[r.id].controller; });
    var cubes0 = {}; D.REGIONS.forEach(function (r) { cubes0[r.id] = E.cubes(g, r.id, me); });
    var mine = queue.slice();
    var plans = {}; plans[me] = queue.slice();
    g.players.forEach(function (p) { if (!p.human) plans[p.id] = AI.plan(g, p.id); });
    var log = E.resolveActions(g, plans);
    queue = []; advReact = null;
    // v1.4 : on montre d'abord la tournée du candidat sur la carte, puis les régions qui basculent, puis le flash info
    FX.hold(); render();
    replayTurn(mine, cubes0, function () {
      FX.release();
      FX.wait(inkMs() + 120, function () { showFlash(log, before, ctrl0, allies0); });
    });
  }
  /* La tournée du candidat : son pion va de région en région, une trace en pointillés derrière lui.
     À chaque étape : les cubes gagnés s'envolent, et pour « Mobiliser » des abstentionnistes prennent ta couleur. */
  function replayTurn(acts, cubes0, done) {
    var stops = [];
    acts.forEach(function (a) {
      if (!a.region) return;
      var last = stops[stops.length - 1];
      if (last && last.rid === a.region) { last.mob = last.mob || a.type === 'mobiliser'; return; }
      stops.push({ rid: a.region, mob: a.type === 'mobiliser' });
    });
    var ended = false;
    function finish() {
      if (ended) return; ended = true; replaying = false;
      if (stops.length) candPos = stops[stops.length - 1].rid;
      var sk = document.querySelector('.fx-skip'); if (sk) sk.remove();
      if (g) renderMap();
      done();
    }
    if (!stops.length || FX.reduced || mapMode === 'abst' || !pawnEl) return finish();
    replaying = true;
    var s = $('map'), shown = {}, i = 0;
    var skip = el('button', { class: 'fx-skip', type: 'button', 'aria-label': 'Passer l\'animation' }, '<span>Ton candidat fait campagne… <u>passer</u></span>');
    skip.addEventListener('click', finish);
    $('screen-game').appendChild(skip);
    (function next() {
      if (ended) return;
      if (i >= stops.length) return FX.wait(250, finish);
      var st = stops[i++];
      FX.route(s, pawnEl, pawnPt(candPos), pawnPt(st.rid), 900, function () {
        if (ended) return;
        candPos = st.rid;
        var m = M.regions[st.rid], d = E.cubes(g, st.rid, me) - cubes0[st.rid];
        if (!shown[st.rid]) {
          shown[st.rid] = 1;
          if (d) FX.floatText(s, m.x + 2, m.y - 12, (d > 0 ? '+' : '−') + Math.abs(d), d > 0 ? 'gain' : 'loss');
          if (st.mob) FX.voters(s, m.x, m.y + 22, Math.max(1, d), party(me).color);
        }
        FX.wait(st.mob ? 1500 : 500, next);
      });
    })();
  }
  function showFlash(log, before, ctrl0, allies0) {
    var html = flashHtml(log, before, ctrl0, allies0) +
      '<details class="details"><summary>Détail des ' + log.length + ' actions</summary><div class="log">' + log.map(function (l) {
      return '<div class="log-row' + (l.gaffe ? ' gaffe' : l.ok ? '' : ' fail') + (l.credUp && l.pid === me ? ' up' : '') + '">' + chip(l.pid) + '<span><b>' + esc(l.action) + '</b>' + (l.theme ? ' ' + th(l.theme).icon : '') + (l.region ? ' · ' + SHORT[l.region] : '') + ' — ' + esc(l.text) + '</span></div>';
    }).join('') + '</div></details>';
    var after = E.isDebateTurn(g) ? debate : spotlight;
    modal({ kicker: 'Tour ' + g.turn + ' · ce soir', title: 'Flash info', html: html,
            buttons: [{ label: E.isDebateTurn(g) ? 'Place au débat 🎙️' : 'Fin du tour', primary: true, onClick: function () { handleOffers(after); } }] });
  }
  function who(pid) { return pid === me ? 'Toi' : party(pid).short; }
  /* v0.6 : le flash info — 2 à 4 gros titres tirés de ce qui vient de se passer */
  function flashHtml(log, before, ctrl0, allies0) {
    var heads = [];
    D.REGIONS.slice().sort(function (a, b) { return b.pts - a.pts; }).forEach(function (r) {
      var c0 = ctrl0[r.id], c1 = g.regions[r.id].controller;
      if (c0 === c1) return;
      var subj = function (p) { return p === me ? 'Tu' : party(p).short; }, obj = function (p) { return p === me ? 'toi' : party(p).short; };
      if (c1) heads.push({ w: r.pts + (c1 === me || c0 === me ? 20 : 0), t: '<b>' + esc(subj(c1)) + (c1 === me ? ' prends ' : ' prend ') + esc(r.name) + '</b>' + (c0 ? ' à ' + esc(obj(c0)) : '') + ' !' });
      else heads.push({ w: r.pts / 2 + (c0 === me ? 20 : 0), t: esc(r.name) + ' n\'a plus de maître : ' + esc(subj(c0)) + (c0 === me ? ' perds' : ' perd') + ' le contrôle.' });
    });
    log.filter(function (l) { return l.pid === me && !l.ok && !l.gaffe; }).forEach(function (l) { heads.push({ w: 16, t: '❌ <b>Ton action « ' + esc(l.action) + ' » a échoué</b> : ' + esc(l.text.replace(/^Échoue : /, '')) }); });
    log.filter(function (l) { return l.gaffe; }).forEach(function (l) { heads.push({ w: 15, t: '😬 <b>Gaffe</b> de ' + esc(who(l.pid)) + ' en ' + (l.region ? esc(E.REG[l.region].name) : 'campagne') + ' : le candidat était épuisé.' }); });
    Object.keys(g.alliances).forEach(function (pid) {
      var o = g.alliances[pid];
      if (pid < o && allies0[pid] !== o) heads.push({ w: 14, t: '🤝 Alliance surprise entre <b>' + esc(who(pid)) + '</b> et <b>' + esc(who(o)) + '</b>.' });
    });
    log.filter(function (l) { return l.credUp && l.pid === me; }).forEach(function (l) { heads.push({ w: 9, t: '📈 Tu deviens crédible sur ' + esc(th(l.credUp).name) + '.' }); });
    heads.sort(function (a, b) { return b.w - a.w; });
    var h = '<div class="flash"><div class="flash-band"><span class="flash-live">● Direct</span><span class="flash-ch">INFO-CONTINU</span><span class="flash-tag">FLASH INFO</span></div><div class="flash-body">';
    h += heads.length ? heads.slice(0, 4).map(function (x) { return '<p>' + x.t + '</p>'; }).join('') : '<p>Calme plat : aucune région ne change de main ce soir.</p>';
    h += '<p class="flash-order">Ordre de jeu ce tour : ' + E.turnOrder(g).map(function (p) { return p === me ? '<b>toi</b>' : esc(party(p).short); }).join(' → ') + ' (action 1 de chacun, puis 2, puis 3)</p>';
    h += '</div><div class="flash-ticker">' + E.poll(g).map(function (x) {
      var d = (x.pct - (before[x.pid] || 0)) * 100, arr = d >= 0.5 ? '<i class="up">▲' + d.toFixed(1).replace('.', ',') + '</i>' : d <= -0.5 ? '<i class="down">▼' + (-d).toFixed(1).replace('.', ',') + '</i>' : '<i>=</i>';
      return '<span class="' + (x.pid === me ? 'me' : '') + '">' + (x.pid === me ? 'Toi' : x.pid) + ' ' + Math.round(x.pct * 100) + ' % ' + arr + '</span>';
    }).join('') + '</div></div>';
    return h;
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

  /* ---------- v0.6 : le débat télévisé en face-à-face ---------- */
  function replyTag(k) { var r = D.REPLIES[k]; return r.icon + ' ' + r.name; }
  function debate() {
    var deb = E.setupDebate(g), grand = g.turn === R.maxTurns, picks = [];
    var mine = []; deb.duels.forEach(function (d, i) { if (d.a === me || d.b === me) mine.push(i); });
    var max = Math.min(mePl().infl, R.debatePrepMax), mult = grand ? 2 : 1;
    var html = '<p>3 questions, 3 adversaires. À chaque question, choisis ta réplique :</p>' +
      '<div class="rps">🥊 bat ❤️ · ❤️ bat 📊 · 📊 bat 🥊 · 🙃 = nul</div>' +
      '<div class="brief">' + mine.map(function (i) {
        var d = deb.duels[i], o = d.a === me ? d.b : d.a;
        return line(th(d.theme).icon, '<b>' + esc(party(o).short) + '</b> sur ' + esc(th(d.theme).name) + ' <span class="muted">· tempérament ' + D.TEMPERS[o].label + '</span>');
      }).join('') + '</div>' +
      '<p><b>Préparation</b> : chaque ★ dépensée = +1 point.</p>' +
      '<div class="bid"><input id="bid" type="range" min="0" max="' + max + '" value="' + Math.min(1, max) + '" aria-label="Préparation en influence"><output id="bid-out">' + Math.min(1, max) + ' ★</output></div>' +
      '<p class="hint">Le vainqueur gagne +' + mult + ' cube dans 4 régions, le 2e dans 2 régions.' + (grand ? ' <b>Grand débat final : gains doublés !</b>' : '') + '</p>' + learnBox('debat');
    var prep = {};
    modal({ kicker: grand ? 'Grand débat final' : 'Débat télévisé', title: 'Ce soir, face-à-face !', html: html,
      onOpen: function () { var r = $('bid'); r.addEventListener('input', function () { $('bid-out').textContent = r.value + ' ★'; }); },
      buttons: [{ label: 'Entrer sur le plateau', primary: true, keep: true, onClick: function () {
        prep[me] = parseInt($('bid').value, 10) || 0; closeModal(); round(0);
      } }] });

    function bonusHint(k, d, o) {
      if (k === 'attaque' && E.player(g, o).cas > 0) return ' <b>+1 ici</b> : il traîne des casseroles.';
      if (k === 'chiffres') { var c = E.cred(g, me, d.theme); if (c === 2) return ' <b>+1 ici</b> : c\'est ton point fort.'; if (c === 0) return ' <b>−1 ici</b> : pas ton sujet.'; }
      if (k === 'emotion' && E.isHot(g, d.theme)) return ' <b>+1 ici</b> : le sujet fait l\'actu.';
      return '';
    }
    function round(k) {
      var i = mine[k], d = deb.duels[i], o = d.a === me ? d.b : d.a;
      var h = '<div class="question"><div class="q-face">' + A.portrait(o) + '</div><div><span class="kicker">Question ' + (k + 1) + ' / 3</span><div class="q-theme">' + th(d.theme).icon + ' ' + esc(th(d.theme).name) + '</div>' +
        '<div class="q-vs">Face à <b>' + esc(party(o).candidate) + '</b> (' + esc(party(o).short) + ') · ' + D.TEMPERS[o].label + '</div></div></div><div class="pick">' +
        ['attaque', 'chiffres', 'emotion', 'esquive'].map(function (key) {
          var r = D.REPLIES[key];
          var bh = bonusHint(key, d, o), txt = bh ? esc(r.hint.split('. ')[0]) + '.' + bh : esc(r.hint);
          return '<button type="button" class="pick-row" data-r="' + key + '"><span class="pick-i">' + r.icon + '</span><span class="pick-txt"><b>' + r.name + '</b><small>' + txt + '</small></span></button>';
        }).join('') + '</div>';
      modal({ kicker: grand ? 'Grand débat final' : 'Débat télévisé', title: 'Que réponds-tu ?', html: h, buttons: [],
        onOpen: function () {
          Array.prototype.forEach.call(document.querySelectorAll('.pick-row'), function (row) {
            row.addEventListener('click', function () {
              var my = row.getAttribute('data-r'), their = AI.chooseReply(g, o, d.theme, me);
              picks[i] = d.a === me ? { ra: my, rb: their } : { ra: their, rb: my };
              var r = E.duelResult(g, d, picks[i].ra, picks[i].rb);
              var mp = d.a === me ? r.pa : r.pb, op = d.a === me ? r.pb : r.pa, mn = d.a === me ? r.na : r.nb, on = d.a === me ? r.nb : r.na;
              var verdict = mp > op ? 'Manche gagnée !' : mp < op ? 'Manche perdue…' : 'Match nul';
              var rh = '<div class="duel"><div class="duel-side"><span class="duel-face">' + A.portrait(me) + '</span><span class="duel-who">Toi</span><span class="duel-r">' + D.REPLIES[my].icon + '</span><b>' + D.REPLIES[my].name + '</b><span class="duel-pts">+' + mp + '</span>' + (mn.length ? '<small>' + esc(mn.join(', ')) + '</small>' : '') + '</div>' +
                '<div class="duel-vs">VS</div><div class="duel-side"><span class="duel-face">' + A.portrait(o) + '</span><span class="duel-who">' + esc(party(o).short) + '</span><span class="duel-r">' + D.REPLIES[their].icon + '</span><b>' + D.REPLIES[their].name + '</b><span class="duel-pts">+' + op + '</span>' + (on.length ? '<small>' + esc(on.join(', ')) + '</small>' : '') + '</div></div>';
              closeModal();
              modal({ kicker: 'Question ' + (k + 1) + ' / 3', title: verdict, html: rh,
                buttons: [{ label: k < 2 ? 'Question suivante' : 'Les résultats', primary: true, onClick: function () { if (k < 2) round(k + 1); else finish(); } }] });
            });
          });
        } });
    }
    function finish() {
      g.players.forEach(function (p) { if (!p.human) prep[p.id] = AI.prep(g, p.id); });
      deb.duels.forEach(function (d, i) { if (!picks[i]) picks[i] = { ra: AI.chooseReply(g, d.a, d.theme, d.b), rb: AI.chooseReply(g, d.b, d.theme, d.a) }; });
      var res = E.resolveDebate(g, prep, picks); render();
      var h = '<div class="brief">' + res.ranking.map(function (x, n) {
        return line(n === 0 && res.winner ? '🏆' : (n + 1) + '.', chip(x.pid) + (x.pid === me ? '<b>Toi</b>' : esc(party(x.pid).short)) + ' — <b>' + x.score + ' pts</b>' + (x.prep ? ' <span class="muted">(dont ' + x.prep + ' de préparation)</span>' : ''));
      }).join('') + '</div>';
      res.rewards.forEach(function (w) { h += '<p>' + chip(w.pid) + ' +' + w.each + ' cube' + (w.each > 1 ? 's' : '') + ' en ' + w.regions.map(function (x) { return SHORT[x]; }).join(', ') + '</p>'; });
      modal({ kicker: 'Débat', title: !res.winner ? 'Égalité en tête' : res.winner === me ? 'Tu remportes le débat !' : party(res.winner).short + ' remporte le débat', html: h,
              buttons: [{ label: 'Fin du tour', primary: true, onClick: spotlight }] });
    }
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
    if (res.over) return electionNight();
    if (res.between) return betweenScreen();
    if (g.turn === 1 && tutoGame) {
      tutoGame = false;
      return modal({ kicker: 'Tutoriel', title: 'Bon à savoir', html:
        '<p><b>Chaque tour</b> commence par le journal : un événement, le thème à la une, et parfois un <b>dilemme</b> pour toi.</p>' +
        '<p><b>⚡ Ménage ton candidat :</b> Meeting et Télé le fatiguent. À 0 ⚡, il risque la gaffe.</p>' +
        '<p><b>🍳 Attention aux casseroles :</b> attaquer ou tricher en ajoute, et elles finissent par sortir en scandale.</p>' +
        '<p><b>Aux tours 3, 6 et 8</b>, un <b>débat télévisé</b> : 3 face-à-face où tu choisis tes répliques (🥊 bat ❤️, ❤️ bat 📊, 📊 bat 🥊). Le vainqueur gagne des cubes.</p>' +
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
  /* ---------- v0.6 : la soirée électorale à 20h ---------- */
  var nightTimers = [], nightDone = false;
  function later(fn, ms) { nightTimers.push(setTimeout(fn, ms)); }
  /* ---------- v1.6 : entre les deux tours ---------- */
  function consigneTxt(b, c) { return c === 'A' ? 'appelle à voter ' + who2(b.a) : c === 'B' ? 'appelle à voter ' + who2(b.b) : c === 'none' ? 'ne soutient personne' : 'hésite encore'; }
  function who2(pid) { return pid === me ? 'toi' : party(pid).short; }
  function pctN(x) { return Math.round(100 * x); }
  function betweenScreen() {
    $('toast').hidden = true;
    var b = g.between, isFin = me === b.a || me === b.b;
    // l'ordinateur ne connaît pas tes décisions à venir : s'il n'y a que des finalistes menés par l'ordinateur, ils jouent tout de suite
    if (!isFin) for (var k = 0; k < R.round2.actions; k++) [b.a, b.b].forEach(function (f) { E.aiBetweenStep(g, f); });
    go('between');
    renderBetween();
    $('screen-between').scrollTop = 0;
    modal({ kicker: 'Premier tour · 20h', title: isFin ? 'Tu es qualifié pour le second tour !' : 'Éliminé… mais pas hors jeu',
      html: '<p>' + (isFin ? 'Face à <b>' + esc(party(me === b.a ? b.b : b.a).short) + '</b>. Les partis éliminés pèsent ' + pctN(1 - g.round1.first[0].pct - g.round1.first[1].pct) + ' % des voix : il te faut leurs électeurs. Tu as <b>' + R.round2.actions + ' actions</b> : négocier un soutien en échange d\'une concession, mobiliser les abstentionnistes, ou lancer un appel au rassemblement.'
        : '<b>' + esc(party(b.a).short) + '</b> et <b>' + esc(party(b.b).short) + '</b> s\'affrontent au second tour. Tes électeurs peuvent faire la différence : écoute leurs offres, puis donne ta <b>consigne de vote</b>.') + '</p>' + learnBox('alliances'),
      buttons: [{ label: 'À moi de jouer', primary: true }] });
  }
  function renderBetween() {
    var b = g.between, isFin = me === b.a || me === b.b, rival = me === b.a ? b.b : b.a, r1 = g.round1;
    $('btw-title').textContent = isFin ? 'Le second tour se joue maintenant' : 'Tes électeurs valent de l\'or';
    $('btw-sub').innerHTML = esc(party(b.a).short) + ' contre ' + esc(party(b.b).short) + '. ' + (isFin ? 'Il te reste <b>' + b.left[me] + ' action' + (b.left[me] > 1 ? 's' : '') + '</b>.' : 'Ta consigne : <b>' + consigneTxt(b, b.consignes[me]) + '</b>.');
    // le premier tour, figé
    $('btw-first').innerHTML = '<div class="kicker">Premier tour · résultat définitif</div>' + r1.first.map(function (x) {
      var p = party(x.pid), q = x.pid === b.a || x.pid === b.b;
      return '<div class="vote-row' + (q ? ' qual' : '') + '"><span class="vote-lbl">' + chip(x.pid) + (x.pid === me ? 'Toi' : esc(p.short)) + '</span><span class="vote-bar"><i style="width:' + (100 * x.pct / r1.first[0].pct) + '%;background:' + p.color + '"></i></span><b>' + pctFr(x.pct, 1) + ' %</b></div>';
    }).join('') + '<p class="hint">Qualifiés : ' + esc(party(b.a).short) + ' et ' + esc(party(b.b).short) + '. Participation ' + pctFr(r1.stats1.participation, 1) + ' %.</p>';
    // l'estimation, avec ses hypothèses
    var pr = E.projectSecond(g), PA = party(b.a), PB = party(b.b);
    $('btw-estim').innerHTML = '<div class="kicker">Si l\'on votait maintenant · estimation</div>' +
      '<div class="duel-bar"><span style="width:' + (100 * pr.pctA) + '%;background:' + PA.color + ';color:' + PA.ink + '">' + (b.a === me ? 'Toi' : esc(PA.short)) + ' ' + pctFr(pr.pctA, 1) + ' %</span><span style="width:' + (100 * pr.pctB) + '%;background:' + PB.color + ';color:' + PB.ink + '">' + (b.b === me ? 'Toi' : esc(PB.short)) + ' ' + pctFr(pr.pctB, 1) + ' %</span><i class="mark"></i></div>' +
      '<p class="hint">Hypothèses : les consignes pas encore données sont remplacées par ce que chaque parti ferait probablement' + (isFin ? '' : ' (pour toi : ne soutenir personne)') + '. Les actions à venir peuvent tout changer.</p>';
    // ce que je peux faire
    var mine = $('btw-me');
    if (isFin) {
      var acts = [
        { k: 'negocier', icon: '🤝', name: 'Négocier un soutien', fx: 'Avec un parti éliminé, en échange d\'une de ses mesures' },
        { k: 'mobiliser', icon: '🚪', name: 'Mobiliser les abstentionnistes', fx: '+' + pctFr(R.round2.mobilize, 1) + ' % des suffrages pour toi (' + b.boost[me].mob + '/' + R.round2.maxUses + ')' },
        { k: 'rassembler', icon: '📣', name: 'Appel au rassemblement', fx: '+' + pctN(R.round2.rassemble) + ' points de report de chaque parti éliminé (' + b.boost[me].ras + '/' + R.round2.maxUses + ')' }];
      mine.innerHTML = '<div class="kicker">Tes actions · ' + b.left[me] + ' sur ' + R.round2.actions + '</div><div class="pick">' + acts.map(function (a) {
        var err = b.left[me] <= 0 ? 'Plus d\'action disponible.' : a.k === 'negocier' ? (b.elim.some(function (e) { return !b.deals[e]; }) ? null : 'Plus aucun parti libre.') : E.betweenError(g, me, { type: a.k });
        return '<button type="button" class="pick-row' + (err ? ' off' : '') + '" data-bact="' + a.k + '"><span class="pick-i">' + a.icon + '</span><span class="pick-txt"><b>' + a.name + '</b><small>' + esc(err || a.fx) + '</small></span></button>';
      }).join('') + '</div>';
      Array.prototype.forEach.call(mine.querySelectorAll('[data-bact]'), function (row) {
        row.addEventListener('click', function () {
          if (row.classList.contains('off')) return toast(row.querySelector('small').textContent);
          var k = row.getAttribute('data-bact');
          if (k === 'negocier') negotiateMenu();
          else playBetween({ type: k });
        });
      });
    } else {
      var offers = b.offers.filter(function (o) { return o.to === me; }), deal = b.deals[me];
      var h = '<div class="kicker">Tes décisions</div>';
      if (deal) h += '<p>🤝 <b>Accord conclu avec ' + esc(party(deal.with).short) + '</b> : il reprend ta mesure « ' + esc(E.measure(deal.measure).name) + ' ». Ta consigne : voter ' + esc(party(deal.with).short) + '.</p>';
      offers.forEach(function (o) {
        var pe = mePl(), canCounter = pe.phare && pe.phare !== o.measure && E.concessionsFor(g, o.from, me).indexOf(pe.phare) >= 0;
        h += '<div class="offer"><p><b>' + esc(party(o.from).short) + '</b> te propose un accord : il reprend ta mesure « <b>' + esc(E.measure(o.measure).name) + '</b> » si tu appelles à voter pour lui.</p>' +
          '<div class="offer-btns"><button type="button" class="btn btn-ink" data-offer="accept" data-from="' + o.from + '">Accepter</button>' +
          (canCounter ? '<button type="button" class="btn" data-offer="counter" data-from="' + o.from + '">Réclamer ma mesure phare</button>' : '') +
          '<button type="button" class="btn" data-offer="refuse" data-from="' + o.from + '">Refuser</button></div></div>';
      });
      if (!offers.length && !deal) h += '<p class="hint">Aucune offre en attente. Tu peux tout de même donner ta consigne.</p>';
      if (!deal) h += '<div class="kicker" style="margin-top:6px">Ta consigne de vote</div><div class="consigne">' + [['A', 'Voter ' + who2(b.a)], ['B', 'Voter ' + who2(b.b)], ['none', 'Ne soutenir personne']].map(function (c) {
        return '<button type="button" class="btn' + (b.consignes[me] === c[0] ? ' btn-ink' : '') + '" data-cons="' + c[0] + '">' + esc(c[1]) + '</button>';
      }).join('') + '</div><p class="hint">Une consigne ne déplace qu\'une partie de tes électeurs : les autres font ce qu\'ils veulent.</p>';
      mine.innerHTML = h;
      Array.prototype.forEach.call(mine.querySelectorAll('[data-offer]'), function (bt) {
        bt.addEventListener('click', function () {
          var from = bt.getAttribute('data-from'), r = E.answerBetweenOffer(g, from, bt.getAttribute('data-offer'));
          toast(r.outcome === 'accept' ? 'Accord conclu avec ' + party(from).short + ' !' : bt.getAttribute('data-offer') === 'counter' ? party(from).short + ' refuse ta contre-offre.' : 'Offre refusée.');
          renderBetween();
        });
      });
      Array.prototype.forEach.call(mine.querySelectorAll('[data-cons]'), function (bt) {
        bt.addEventListener('click', function () { E.setConsigne(g, me, bt.getAttribute('data-cons')); renderBetween(); });
      });
    }
    // les partis éliminés : position et reports estimés
    $('btw-parties').innerHTML = '<div class="kicker">Les partis éliminés · reports estimés</div>' + b.elim.map(function (e) {
      var t = E.transfersFor(g, e, true), d = b.deals[e], c = b.consignes[e];
      var st = d ? '🤝 accord avec ' + esc(who2(d.with)) + ' (« ' + esc(E.measure(d.measure).name) + ' »)' : c ? (c === 'none' ? '∅ ' : '➜ ') + consigneTxt(b, c) : '… hésite';
      return '<button type="button" class="elim-row" data-why="' + e + '"><span class="elim-top">' + chip(e) + '<b>' + (e === me ? 'Toi' : esc(party(e).short)) + '</b> <span class="muted">' + pctFr(votePct(e), 1) + ' %</span><span class="elim-st">' + st + '</span></span>' +
        '<span class="split"><i style="width:' + (100 * t.toA) + '%;background:' + PA.color + '"></i><i style="width:' + (100 * t.toB) + '%;background:' + PB.color + '"></i><i class="split-rest" style="width:' + (100 * (t.blank + t.abst)) + '%"></i></span>' +
        '<small>' + pctN(t.toA) + ' % → ' + esc(who2(b.a)) + ' · ' + pctN(t.toB) + ' % → ' + esc(who2(b.b)) + ' · ' + pctN(t.blank + t.abst) + ' % blanc ou abstention</small></button>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('[data-why]'), function (row) {
      row.addEventListener('click', function () {
        var e = row.getAttribute('data-why'), t = E.transfersFor(g, e, true);
        modal({ kicker: 'Reports de voix · estimation', title: e === me ? 'Tes électeurs' : 'Les électeurs de ' + party(e).short, html: '<div class="brief">' + t.why.map(function (w) { return line('•', esc(w)); }).join('') +
          line('=', '<b>' + pctN(t.toA) + ' %</b> pour ' + esc(who2(b.a)) + ', <b>' + pctN(t.toB) + ' %</b> pour ' + esc(who2(b.b)) + ', ' + pctN(t.blank) + ' % blanc, ' + pctN(t.abst) + ' % abstention') + '</div><p class="hint">Ces taux sont des règles du jeu, pas des prévisions politiques réelles.</p>' });
      });
    });
    // le fil des négociations
    $('btw-feed').innerHTML = '<div class="kicker">Dans les coulisses</div>' + (b.log.length ? b.log.slice().reverse().slice(0, 8).map(function (l) {
      return '<p>' + ({ deal: '🤝', refuse: '✋', counter: '↩️', offer: '✉️', mob: '🚪', ras: '📣' }[l.type] || '•') + ' ' + esc(l.text) + '</p>';
    }).join('') : '<p class="hint">Rien pour l\'instant.</p>');
    var undecided = !isFin && !b.deals[me] && !b.consignes[me];
    $('btw-go').textContent = undecided ? 'Choisis d\'abord ta consigne' : 'Aller au second tour';
    $('btw-go').disabled = undecided;
  }
  function votePct(pid) { var x = g.round1.first.filter(function (y) { return y.pid === pid; })[0]; return x ? x.pct : 0; }
  function negotiateMenu() {
    var b = g.between, free = b.elim.filter(function (e) { return !b.deals[e]; }).sort(function (x, y) { return votePct(y) - votePct(x); });
    var buttons = free.map(function (e) {
      var err = E.betweenError(g, me, { type: 'negocier', target: e, measure: E.concessionsFor(g, me, e)[0] });
      return { label: party(e).short + ' · ' + pctFr(votePct(e), 1) + ' % · distance ' + E.dist(me, e) + (err ? ' — ' + err : ''), disabled: !!err, onClick: function () { concessionMenu(e); } };
    });
    buttons.push({ label: 'Annuler' });
    modal({ kicker: '1 action', title: 'Avec qui négocier ?', html: axisHtml(me) + '<p>Plus un parti est proche de toi sur l\'axe, plus il acceptera facilement, et plus ses électeurs suivront sa consigne. Un accord avec un parti éloigné (distance 3 ou plus) fait fuir ' + pctN(R.round2.farDealLoss) + ' % de tes électeurs.</p>', buttons: buttons });
  }
  function concessionMenu(e) {
    var list = E.concessionsFor(g, me, e).slice(0, 5), pe = E.player(g, e);
    var buttons = list.map(function (mid) {
      var m = E.measure(mid), ch = E.dealChance(g, me, e, mid);
      return { label: th(m.theme).icon + ' ' + m.name + (mid === pe.phare ? ' ★ sa mesure phare' : '') + ' · ' + costTxt(m.cost) + ' · accord ' + chanceLabel(ch), onClick: function () { playBetween({ type: 'negocier', target: e, measure: mid }); } };
    });
    buttons.push({ label: 'Annuler' });
    modal({ kicker: 'Ta concession à ' + party(e).short, title: 'Quelle mesure reprends-tu ?', html: '<p>La mesure s\'ajoute à tes engagements pour le mandat. Céder sa <b>mesure phare</b> augmente nettement les chances d\'accord.</p>', buttons: buttons });
  }
  /* Une action du joueur finaliste, puis la réponse de son rival (mené par l'ordinateur) */
  function playBetween(act) {
    var b = g.between, rival = me === b.a ? b.b : b.a, r = E.betweenAct(g, me, act);
    if (!r.ok) return toast(r.text);
    function rivalTurn() {
      var rr = E.aiBetweenStep(g, rival);
      renderBetween();
      if (rr) { var last = b.log[b.log.length - 1]; if (last) toast(last.text); }
    }
    if (act.type !== 'negocier') { renderBetween(); return rivalTurn(); }
    var pn = party(act.target).short, m = E.measure(act.measure);
    if (r.outcome === 'accept') modal({ kicker: '🤝 Accord', title: pn + ' accepte !', html: '<p>' + esc(pn) + ' appelle à voter pour toi. Tu reprends « ' + esc(m.name) + ' » dans tes engagements.</p>', buttons: [{ label: 'Continuer', primary: true, onClick: rivalTurn }] });
    else if (r.outcome === 'counter') modal({ kicker: '↩️ Contre-offre', title: pn + ' veut mieux', html: '<p>' + esc(pn) + ' refuse « ' + esc(m.name) + ' », mais signe tout de suite si tu reprends sa mesure phare : « <b>' + esc(E.measure(r.measure).name) + '</b> » (' + costTxt(E.measure(r.measure).cost) + ').</p>',
      buttons: [{ label: 'Accepter la contre-offre', primary: true, onClick: function () { E.answerCounter(g, true); rivalTurn(); } }, { label: 'Refuser', onClick: function () { E.answerCounter(g, false); rivalTurn(); } }] });
    else modal({ kicker: '✋ Refus', title: pn + ' refuse', html: '<p>' + esc(pn) + ' ne veut pas s\'engager avec toi pour l\'instant. Une nouvelle demande aura moins de chances.</p>', buttons: [{ label: 'Continuer', primary: true, onClick: rivalTurn }] });
  }
  $('btw-go').addEventListener('click', function () {
    var b = g.between, isFin = me === b.a || me === b.b;
    function go2() { E.closeBetween(g); electionNight(); }
    if (isFin && b.left[me] > 0) modal({ title: 'Il te reste ' + b.left[me] + ' action' + (b.left[me] > 1 ? 's' : ''), html: '<p>Les actions non utilisées sont perdues.</p>', buttons: [{ label: 'Aller voter', primary: true, onClick: go2 }, { label: 'Retour' }] });
    else go2();
  });

  /* v1.4 : la soirée électorale en trois temps.
     1. Le dépouillement : les régions tombent une à une sur la carte (des plus petites à l'Île-de-France),
        avec des résultats partiels qui bougent.
     2. Le compte à rebours de 20h, face aux deux finalistes dans l'ombre.
     3. 20h : le visage de l'élu apparaît, puis les vrais résultats. */
  function electionNight() {
    $('toast').hidden = true;
    var res = g.result, win = g.winner, P = party(win);
    var pct = res.direct ? res.first[0].pct : (res.second.a === win ? res.second.pctA : res.second.pctB);
    var finals = res.second ? [{ pid: res.second.a, pct: res.second.pctA }, { pid: res.second.b, pct: res.second.pctB }] : res.first;
    var among = finals.map(function (x) { return x.pid; });
    var duo = res.second ? [res.second.a, res.second.b] : [res.first[0].pid, res.first[1].pid];
    var STEP = 520;
    nightTimers.forEach(clearTimeout); nightTimers = []; nightDone = false;
    var screen = $('screen-night'), clock = $('night-clock');
    screen.classList.remove('flash20', 'counting', 'final');
    clock.classList.remove('hot', 'tick', 'long');
    var mapEl = $('night-map'); mapEl.innerHTML = '';
    var paths = {};
    D.REGIONS.forEach(function (r) {
      var p = svg('path', { d: M.regions[r.id].d, fill: '#3A3560', stroke: '#1D1A33', 'stroke-width': 1.2, 'stroke-linejoin': 'round', class: 'night-reg' });
      mapEl.appendChild(p); paths[r.id] = p;
    });
    // le vainqueur d'une région, parmi les candidats encore en lice
    function leadIn(rid) {
      var best = null, bn = 0;
      among.forEach(function (pid) { var n = E.cubes(g, rid, pid); if (n > bn) { bn = n; best = pid; } });
      return best;
    }
    function paint(rid, anim) {
      var w = leadIn(rid); if (!w) return null;
      paths[rid].setAttribute('fill', party(w).color);
      if (anim) { FX.replay(paths[rid], 'pop'); var m = M.regions[rid]; FX.ripple(mapEl, m.x, m.y, party(w).color); }
      return w;
    }
    clock.hidden = false; clock.textContent = '19:00';
    $('night-btn').textContent = 'Passer';
    $('night-stage').innerHTML = '<div class="night-est">' + (res.second ? 'Second tour' : 'Premier tour') + ' · dépouillement en cours</div>' +
      '<div class="count-prog"><span class="count-bar"><i id="count-fill"></i></span><span><b id="count-pct">0 %</b> des bureaux</span></div>' +
      '<p class="count-line" id="count-line">Les bureaux de vote ferment, on ouvre les urnes…</p>';
    $('night-bars').innerHTML = '<div class="kicker kicker-yellow">Résultats partiels (mise en scène) · ils vont encore bouger</div>' + finals.map(function (x) {
      var p = party(x.pid);
      return '<div class="nb-row" data-pid="' + x.pid + '"><span class="nb-lbl">' + (x.pid === me ? 'Toi' : esc(p.short)) + '</span><span class="nb-bar"><i style="background:' + p.color + '"></i></span><b>–</b></div>';
    }).join('');
    screen.classList.add('counting');
    go('night');

    // 1. le dépouillement, région par région
    var order = D.REGIONS.slice().sort(function (a, b) { return a.ins - b.ins; });
    var totIns = 0; order.forEach(function (r) { totIns += r.ins; });
    var finalSum = 0; finals.forEach(function (x) { finalSum += x.pct; });
    var scale = res.second ? 1 : Math.max(0.3, finals[0].pct * 1.15);
    var acc = {}, counted = 0;
    among.forEach(function (pid) { acc[pid] = 0; });
    order.forEach(function (r, i) { later(function () { countRegion(r); }, 600 + i * STEP); });
    later(countdown, 600 + order.length * STEP + 700);
    function countRegion(r) {
      var w = {}, tot = 0;
      among.forEach(function (pid) { w[pid] = E.cubes(g, r.id, pid); tot += w[pid]; });
      among.forEach(function (pid) { acc[pid] += r.ins * (tot ? w[pid] / tot : 1 / among.length); });
      counted += r.ins;
      var f = counted / totIns, mix = 0.55 * f;   // les partiels se rapprochent du vrai résultat… sans le dévoiler
      var rows = finals.map(function (x) { return { pid: x.pid, v: (acc[x.pid] / counted) * finalSum * (1 - mix) + x.pct * mix }; })
        .sort(function (a, b) { return b.v - a.v; });
      rows.forEach(function (x, i) {
        var row = document.querySelector('.nb-row[data-pid="' + x.pid + '"]'); if (!row) return;
        row.style.order = i + 1;
        row.querySelector('i').style.width = Math.min(100, 100 * x.v / scale) + '%';
        row.querySelector('b').textContent = (100 * x.v).toFixed(1).replace('.', ',') + ' %';
      });
      var shownPct = Math.round(97 * f);
      $('count-fill').style.width = shownPct + '%';
      $('count-pct').textContent = shownPct + ' %';
      clock.textContent = '19:' + ('0' + Math.round(8 + 50 * f)).slice(-2);
      var w0 = paint(r.id, true);
      $('count-line').innerHTML = '<b>' + esc(r.name) + '</b> : ' + (w0 ? (w0 === me ? 'tu arrives en tête !' : esc(party(w0).short) + ' arrive en tête.') : 'résultat très serré.');
      FX.replay($('count-line'), 'bump');
    }
    // 2. le compte à rebours, face aux deux finalistes dans l'ombre
    function countdown() {
      screen.classList.remove('counting');
      $('night-bars').classList.add('veiled');
      $('night-stage').innerHTML = '<div class="night-est">Premières estimations dans…</div>' +
        '<div class="duo">' + duo.map(function (pid) { return '<span class="duo-face" style="--c:' + party(pid).color + '">' + A.portrait(pid) + '</span>'; }).join('<span class="duo-vs">?</span>') + '</div>';
      clock.textContent = '19:59:50'; clock.classList.add('long');
      for (var k = 1; k <= 9; k++) (function (k) {
        later(function () {
          clock.textContent = '19:59:5' + k;
          clock.classList.toggle('hot', k >= 7);
          FX.replay(clock, 'tick');
        }, 560 * k);
      })(k);
      later(reveal, 560 * 10);
    }
    // 3. 20h
    function reveal() {
      $('night-bars').classList.remove('veiled');
      clock.classList.remove('hot', 'tick', 'long');
      clock.textContent = '20:00';
      screen.classList.add('flash20');
      $('night-stage').innerHTML = '<div class="night-est">Estimation · ' + (res.direct ? 'élu dès le 1er tour' : 'second tour') + '</div>' +
        '<div class="portrait" style="background:' + P.color + ';color:' + P.ink + '"><span class="portrait-art">' + A.portrait(win) + '</span><span class="portrait-name">' + esc(P.candidate) + ' · ' + esc(P.short) + '</span></div>' +
        '<div class="night-pct">' + (pct * 100).toFixed(1).replace('.', ',') + ' %</div>' +
        '<div class="night-who">' + (win === me ? '🎉 C\'EST TOI ! Tu es élu président.' : esc(P.name) + ' remporte l\'élection.') + '</div>';
      later(showBars, 2600);
    }
    function showBars() {
      screen.classList.remove('flash20');
      $('night-bars').classList.remove('veiled');
      var list = finals.slice().sort(function (x, y) { return y.pct - x.pct; });
      var stt = res.second ? res.second.stats : res.stats1;
      $('night-bars').innerHTML = '<div class="kicker kicker-yellow">' + (res.second ? 'Second tour' : 'Premier tour') + '</div>' +
        (stt ? '<div class="night-turnout"><span>Participation <b>' + pctFr(stt.participation, 1) + ' %</b></span><span>Blancs et nuls <b>' + pctFr(stt.blankPct, 1) + ' %</b> des votants</span></div>' : '') + list.map(function (x) {
        var p = party(x.pid);
        return '<div class="nb-row"><span class="nb-lbl">' + (x.pid === me ? 'Toi' : esc(p.short)) + '</span><span class="nb-bar"><i style="background:' + p.color + '" data-w="' + (100 * x.pct) + '"></i></span><b>' + (100 * x.pct).toFixed(1).replace('.', ',') + ' %</b></div>';
      }).join('');
      requestAnimationFrame(function () { Array.prototype.forEach.call(document.querySelectorAll('.nb-bar i[data-w]'), function (i) { i.style.width = i.getAttribute('data-w') + '%'; }); });
      $('night-bars').innerHTML += '<div class="night-learn">' + learnBox(res.second ? 'second_tour' : 'vingt_heures') + '</div>';
      nightDone = true; $('night-btn').textContent = 'Voir les résultats détaillés';
    }
    $('night-btn').onclick = function () {
      if (nightDone) { nightTimers.forEach(clearTimeout); return endGame(); }
      // passer : on saute directement à la fin de la mise en scène
      nightTimers.forEach(clearTimeout); nightTimers = [];
      screen.classList.remove('counting');
      D.REGIONS.forEach(function (r) { paint(r.id, false); });
      reveal(); nightTimers.forEach(clearTimeout); nightTimers = [];
      screen.classList.remove('flash20');
      $('night-stage').querySelector('.portrait').classList.add('instant');
      showBars();
    };
  }

  function endGame() {
    $('toast').hidden = true;
    var res = g.result, win = g.winner;
    $('end-kicker').textContent = 'Soirée électorale';
    $('end-title').textContent = win === me ? 'Tu es élu !' : 'Perdu…';
    $('end-sub').textContent = party(win).name + (res.direct ? ' l\'emporte dès le premier tour.' : ' remporte le second tour.');
    function turnoutLine(st) { return st ? '<p class="turnout">Participation ' + pctFr(st.participation, 1) + ' % · ' + mio(st.votants) + ' millions de votants, dont ' + pctFr(st.blankPct, 1) + ' % de blancs et nuls</p>' : ''; }
    var h = '<div class="kicker">Premier tour</div>' + turnoutLine(res.stats1) + bars(res.first, res.first[0].pct);
    if (res.second) {
      var s = res.second;
      h += '<div class="kicker" style="margin-top:12px">Second tour</div>' + turnoutLine(s.stats) +
        bars([{ pid: s.a, pct: s.pctA }, { pid: s.b, pct: s.pctB }].sort(function (x, y) { return y.pct - x.pct; }), Math.max(s.pctA, s.pctB));
      h += '<div class="transfers">' + s.transfers.map(function (t) {
        var d = t.deal ? ' · 🤝 accord (« ' + esc(E.measure(t.deal.measure).name) + ' »)' : '';
        return '<p>' + chip(t.pid) + '<b>' + (t.consigne === 'A' ? 'Consigne : ' + esc(s.a) : t.consigne === 'B' ? 'Consigne : ' + esc(s.b) : 'Aucune consigne') + '</b>' + d + ' → ' + Math.round(100 * t.toA) + ' % ' + s.a + ', ' + Math.round(100 * t.toB) + ' % ' + s.b + ', ' + Math.round(100 * t.blank) + ' % blanc, ' + Math.round(100 * t.abst) + ' % abstention</p>';
      }).join('') + (res.othersTransfer ? '<p><span class="who" style="background:#C6C9BF">…</span>Autres listes : ' + Math.round(100 * res.othersTransfer.toA) + ' % → ' + s.a + ', ' + Math.round(100 * res.othersTransfer.toB) + ' % → ' + s.b + ', ' + Math.round(100 * res.othersTransfer.abstTotal) + ' % blanc ou abstention</p>' : '') +
        (s.mob.a || s.mob.b ? '<p>🚪 Mobilisation : ' + s.a + ' ×' + s.mob.a + ', ' + s.b + ' ×' + s.mob.b + ' (+' + pctFr(R.round2.mobilize, 1) + ' % des suffrages à chaque fois)</p>' : '') +
        s.notes.map(function (n) { return '<p>' + chip(n.pid) + esc(n.text) + '</p>'; }).join('') + '</div>';
    }
    // v1.5 : du dernier sondage au 1er tour, la seule différence vient des objectifs secrets réussis
    var lastPoll = {}; E.poll(g).forEach(function (x) { lastPoll[x.pid] = x.pct; });
    h += '<div class="brief" style="margin-top:12px"><div class="kicker">Du dernier sondage au 1er tour</div>' + res.first.map(function (x) {
      var ol = objLine(x.pid), d = 100 * (x.pct - (lastPoll[x.pid] || 0));
      return line(ol.met ? '🎯' : '·', chip(x.pid) + (x.pid === me ? '<b>Toi</b>' : esc(party(x.pid).short)) + ' : ' + pctFr(lastPoll[x.pid] || 0, 1) + ' % → <b>' + pctFr(x.pct, 1) + ' %</b> ' +
        '<span class="muted">(' + (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1).replace('.', ',') + ' pt · objectif « ' + esc(ol.o.name) + ' » ' + (ol.met ? 'réussi' : 'raté') + ')</span>');
    }).join('') + '<p class="hint" style="margin:6px 0 0">Un objectif réussi ajoute des voix le jour du vote. Ceux qui ratent le leur baissent donc un peu en proportion.</p></div>';
    if (win === me) h += '<p style="margin:10px 0 0"><b>Et maintenant, il faut gouverner !</b> Législatives, vote de tes lois, budget, crises : cinq ans pour tenir tes promesses.</p>';
    $('end-table').innerHTML = h;
    $('btn-govern').hidden = win !== me;
    go('end');
  }

  /* ---------- Menu & règles ---------- */
  $('btn-menu').addEventListener('click', function () {
    var pl = mePl(), o = D.OBJECTIVES.filter(function (x) { return x.id === pl.objective; })[0], p = party(me);
    var html = '<div class="cand-line">' + A.portrait(me) + '<div><b class="cand-name">' + esc(p.candidate) + '</b><span>' + esc(p.candTitle) + '</span></div></div>' +
      '<p>' + objLine(me).html + '.</p>' +
      '<div class="brief"><div class="kicker">Ton programme · ' + pl.budget + ' Md€</div>' + pl.programme.map(function (id, i) {
        var m = E.measure(id); return line(i === 0 ? '★' : th(m.theme).icon, esc(m.name) + (i === 0 ? ' <span class="muted">(mesure phare : +1 cube en Meeting sur ' + esc(th(m.theme).name) + ')</span>' : ''));
      }).join('') + (pl.financing || []).map(function (id) { return line('🏦', esc(E.measure(id).name)); }).join('') +
      line('❤️', 'Régions de cœur : ' + E.echoRanks(g, me).good.map(function (r) { return SHORT[r]; }).join(', ') + ' · 👎 hostiles : ' + E.echoRanks(g, me).bad.map(function (r) { return SHORT[r]; }).join(', ')) + '</div>' +
      '<div class="brief"><div class="kicker">Ton candidat</div>' +
      line('⚡', '<b>Forme ' + pl.forme + ' / ' + R.formeMax + '</b> — Meeting et Télé en coûtent 1. À 0, risque de gaffe. +' + (R.formeRegen + (me === 'EM' ? 1 : 0)) + ' par tour.') +
      line('🍳', '<b>' + pl.cas + ' casserole' + (pl.cas > 1 ? 's' : '') + '</b> — chacune = ' + Math.round(R.affairPerCasserole * 100) + ' % de risque d\'affaire par tour. Attaquer, enquêter, trahir, le 49.3 et certains choix en ajoutent.') +
      line(pl.momentum > 0 ? '↗' : pl.momentum < 0 ? '↘' : '→', pl.momentum > 0 ? '<b>En dynamique</b> : +1 cube sur tes Meetings.' : pl.momentum < 0 ? '<b>Passage à vide</b> : −1 cube sur tes Meetings.' : '<b>Dynamique stable.</b> Gagne 1,5 point au sondage en un tour pour être en dynamique.') +
      line('👥', '<b>' + pl.militants + ' / ' + R.militantsMax + ' équipes de militants</b> — chacune rapporte 1 cube par tour.') +
      '</div><p><b>Force :</b> ' + esc(p.force) + '</p><p><b>Faiblesse :</b> ' + esc(p.weakness) + '</p>' + credHtml(me);
    modal({ kicker: 'Ton parti', title: p.name, html: html,
            buttons: [{ label: 'Reprendre', primary: true }, { label: '📚 Comprendre la politique', onClick: library }, { label: 'Règles du jeu', onClick: showRules }, { label: 'Abandonner la partie', onClick: function () { go('title'); } }] });
  });
  /* La bibliothèque : toutes les fiches « Le saviez-vous ? » */
  function library() {
    var keys = Object.keys(D.LEARN);
    var html = '<div class="learn">' + A.advisor() + '<p>Tout ce qu\'il faut savoir pour comprendre une vraie campagne. Touche une fiche.</p></div><div class="pick">' +
      keys.map(function (k) { return '<button type="button" class="pick-row" data-learn="' + k + '"><span class="pick-i">📄</span><span class="pick-txt"><b>' + esc(D.LEARN[k].title) + '</b></span></button>'; }).join('') +
      (g ? mePl().programme.map(function (id) { var m = E.measure(id); return '<button type="button" class="pick-row" data-mes="' + id + '"><span class="pick-i">' + th(m.theme).icon + '</span><span class="pick-txt"><b>' + esc(m.name) + '</b><small>ta mesure</small></span></button>'; }).join('') : '') + '</div>';
    modal({ kicker: 'Bibliothèque', title: 'Comprendre la politique', html: html, buttons: [{ label: 'Fermer' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-mes]'), function (b) {
          b.addEventListener('click', function () { var m = E.measure(b.getAttribute('data-mes')); modal({ kicker: 'Le saviez-vous ?', title: m.name, html: fiche(m) }); });
        });
      } });
  }
  function showRules() {
    modal({ kicker: 'Règles v1.5', title: 'Comment gagner', html:
      '<p><b>But :</b> remporter l\'élection présidentielle à la fin des <b>8 tours de campagne</b>. Chaque région vote selon ses cubes. Elle pèse ses <b>vrais électeurs</b> : ses inscrits (le chiffre sur la carte, en millions), moins ceux qui s\'abstiennent, moins ceux qui votent blanc ou nul. Le parti qui contrôle une région y gagne un petit bonus.</p>' +
      '<p><b>Deux modes de jeu.</b> <b>Réaliste</b> : chaque parti démarre avec ses vrais scores, au choix ceux de la présidentielle 2022, la moyenne des législatives et des européennes 2024, ou la moyenne de 6 sondages d\'octobre 2026 ; les petites listes et les partis absents de ta partie comptent sous « Autres » dans les sondages, et la campagne les réduit peu à peu. <b>Simulation</b> : chaque parti a 2 électeurs dans chaque région et personne ne tient de région : le départ est strictement égal, sans bonus caché. Ensuite, au second tour, les partis du centre de l\'axe reçoivent plus facilement des reports de voix que ceux des extrémités.</p>' +
      '<p><b>L\'abstention :</b> environ un quart des inscrits ne votent pas, et beaucoup plus en outre-mer. Le bouton <b>Abstention</b> au-dessus de la carte la montre. 🚪 <b>Mobiliser</b> fait voter des abstentionnistes ; attaquer ou multiplier les affaires en dégoûte d\'autres.</p>' +
      '<p><b>Premier tour :</b> les ' + D.PARTIES.length + ' partis sont en lice. Plus de 50 % des suffrages exprimés (les blancs ne comptent pas) = élu directement. Sinon, les deux premiers sont qualifiés, et le résultat est figé.</p>' +
      '<p><b>🤝 Entre les deux tours :</b> chaque finaliste a <b>' + R.round2.actions + ' actions</b>. Il peut <b>négocier un soutien</b> avec un parti éliminé en lui cédant une de ses mesures (celui-ci accepte, refuse ou réclame sa mesure phare), <b>mobiliser</b> des abstentionnistes ou lancer un <b>appel au rassemblement</b>. Chaque parti éliminé, toi compris si tu es éliminé, donne ensuite sa <b>consigne de vote</b> : un finaliste, ou personne.</p>' +
      '<p><b>Les reports de voix</b> ne sont jamais automatiques : une consigne déplace une partie des électeurs, d\'autant moins que les partis sont éloignés sur l\'axe ; les autres votent pour l\'autre finaliste, blanc ou s\'abstiennent. Le détail s\'affiche avant et après le vote. Un accord avec un parti éloigné (distance 3 ou plus) fait fuir 3 % de tes propres électeurs. Les concessions sont des engagements de campagne : elles ne donnent pas de majorité à l\'Assemblée.</p>' +
      axisHtml(me || chosen) +
      '<p><b>Partis proches :</b> quand tu fais un Meeting ou passes à la Télé là où un parti voisin sur l\'axe est présent, tu lui prends 1 électeur (distance 2 : sur un dé de 4 à 6).</p>' +
      '<p><b>🤝 Pas d\'alliance avant le 1er tour :</b> chaque parti fait campagne seul. Les accords se négocient <b>entre les deux tours</b> (voir plus bas).</p>' +
      '<p><b>Chaque tour :</b> revenus (4 € + 1 € par région contrôlée, max +3 ; +2 ★), un événement, puis <b>3 actions secrètes</b>. Tout le monde choisit en secret, puis les plans sont joués <b>chacun son tour</b> : l\'action 1 de chaque parti, puis l\'action 2, puis la 3. Le parti qui commence change à chaque tour (l\'ordre est affiché dans le flash info). Une action peut donc échouer si un rival a changé la situation juste avant : le flash info te dit pourquoi.</p>' +
      '<p><b>Ton message.</b> Meeting, Télé, Buzz et Faire la une portent un <b>thème</b> (💶 🏭 🏥 🌿 🚓 🛂). Son <b>impact</b>, de 0 à 4 = ta crédibilité sur le thème (0 à 2) + 1 si la région s\'en préoccupe + 1 si le thème fait l\'actu. Le bon message au bon endroit rapporte deux fois plus.</p>' +
      '<p><b>Les actions :</b></p><ul class="rules-acts">' +
        '<li>📣 <b>Meeting</b> (2 €) : des cubes dans la région. <b>Base</b> de 1 à 4 selon l\'impact du message, <b>plus les bonus</b> : mesure phare +1, région de cœur +1 (hostile −1), dynamique ±1, et pour Socialisme Modéré +1 là où il a déjà 5 cubes. Le détail s\'affiche quand tu touches une région. Une région compte au plus 10 cubes par parti.</li>' +
        '<li>📺 <b>Télé</b> (3 € + 1 ★) : ton message passe dans la région et dans les 2 autres régions les plus concernées par le thème. +1 cube dans chacune (+2 si impact 4, rien si impact 0).</li>' +
        '<li>🚪 <b>Mobiliser</b> (2 €) : du porte-à-porte pour faire voter des abstentionnistes. 1 cube, +1 avec tes militants, +1 si ton programme parle à ceux qui votent peu ici, +1 si la région s\'abstient beaucoup (3 au plus). Jusqu\'au tour 3, tu fais aussi inscrire de nouveaux électeurs.</li>' +
        '<li>📱 <b>Buzz</b> (1 €, menu Plus) : un coup de dé, de −1 à +4 cubes. +1 si le thème fait l\'actu.</li>' +
        '<li>🗞️ <b>Faire la une</b> (2 € + 2 ★) : ton thème fera l\'actu au tour suivant… pour tout le monde.</li>' +
        '<li>🥊 <b>Attaquer</b> (2 € + 1 ★) : le rival le plus fort de la région perd 2 cubes (il faut y avoir 1 cube).</li>' +
        '<li>💰 <b>Collecte</b> (gratuit) : +3 € dans la caisse.</li>' +
        '<li>📜 <b>Promesse</b> (4 ★) : dans une région que tu tiens, +1 cube dans toutes les régions du même type.</li>' +
        '<li>👥 <b>Militants</b> (3 €) : une équipe dans la région, +1 cube à chaque début de tour (3 équipes au plus).</li>' +
        '<li>🃏 2 cartes spéciales par parti.</li></ul>' +
      '<p><b>⚡ La forme du candidat</b> (4 au plus, +2 par tour). Meeting et Télé coûtent 1 ⚡. Si une action la fait tomber à 0, le candidat épuisé peut faire une <b>gaffe</b> (4 chances sur 10) : aucun cube et une casserole.</p>' +
      '<p><b>↗ La dynamique.</b> Si tu gagnes 1,5 point au sondage en un tour, tes Meetings rapportent 1 cube de plus au tour suivant. Si tu en perds 1,5, 1 de moins.</p>' +
      '<p><b>Crédibilité qui évolue.</b> Après 3 actions sur un même thème, ta crédibilité dessus augmente (2 au plus). Le bonus compte à partir de l\'action suivante.</p>' +
      '<p><b>🎯 Objectif secret.</b> Chaque parti en reçoit un au hasard (sa progression s\'affiche sous la carte). Réussi à la fin de la campagne, il ajoute environ 3 à 4 % des voix le jour du vote. Ce bonus n\'apparaît pas dans les sondages.</p>' +
      '<p><b>📋 Ton programme.</b> Avant la campagne, choisis 5 mesures. Chacune te rend plus crédible sur son thème. La 1re est ta <b>mesure phare</b> : +1 cube sur tes Meetings qui en parlent. Il te reste au plus ' + R.budgetCap + ' Md€ à financer : au-delà, le programme est partiellement financé (1 casserole par tranche de ' + R.budgetCasStep + ' Md€) ou non financé, et une affaire tombe au tour 3. Les mesures 💥 choc font parler (+1 cube dans 2 régions) mais ajoutent une casserole.</p>' +
      '<p><b>💥 Les affaires.</b> Chaque casserole 🍳 donne 12 % de risque d\'affaire par tour. Le Canard Déchaîné en sort aussi de temps en temps, et un rival peut <b>🔎 enquêter</b> sur toi. Quand une affaire tombe, tu choisis ta réaction : nier, t\'excuser, sacrifier un collaborateur ou accuser les médias.</p>' +
      '<p><b>🤔 Les dilemmes.</b> Chaque tour, un parti (à tour de rôle) doit faire un choix. Certains choix ont des <b>conséquences différées</b> qui peuvent ressortir quelques tours plus tard.</p>' +
      '<p><b>Les crises.</b> Chaque partie connaît une crise en 3 actes (krach, grève, été brûlant, désindustrialisation). Les régions touchées sont marquées sur la carte : leur thème y compte comme à la une.</p>' +
      '<p><b>🎙️ Le débat télévisé</b> (tours 3, 6 et 8) : chaque parti affronte 3 adversaires tirés au sort, une question chacun. Choisis ta réplique : 🥊 Attaque bat ❤️ Émotion, ❤️ Émotion bat 📊 Chiffres, 📊 Chiffres bat 🥊 Attaque, 🙃 Esquive = nul. Manche gagnée 2 points, nulle 1. Bonus : 🥊 +1 si le rival a des casseroles, 📊 +1 sur ton point fort (−1 si ce n\'est pas ton sujet), ❤️ +1 si le thème fait l\'actu. Chaque ★ de préparation (3 au plus) = +1 point. Le 1er gagne +1 cube dans 4 régions, le 2e dans 2 régions (doublé au débat final). Chaque parti a son tempérament : observe-le !</p>' +
      '<p><b>Sous les projecteurs :</b> le premier des sondages paie 2 ★ ou perd des cubes à chaque fin de tour.</p>' });
  }

  /* ---------- Installer l'application (PWA) ---------- */
  var installEvt = null;
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function showInstall(on) { $('btn-install').hidden = !on || standalone; }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; showInstall(true); });
  window.addEventListener('appinstalled', function () { installEvt = null; showInstall(false); toast('Politik est installé sur ton écran d’accueil !'); });
  if (ios) showInstall(true);
  $('btn-install').addEventListener('click', function () {
    if (installEvt) {
      installEvt.prompt();
      installEvt.userChoice.then(function () { installEvt = null; showInstall(false); });
      return;
    }
    modal({ kicker: 'Installer Politik', title: 'Sur ton écran d’accueil', html:
      (ios ? '<div class="brief">' + line('1', 'Ouvre ce jeu dans <b>Safari</b>.') + line('2', 'Touche le bouton <b>Partager</b> (le carré avec une flèche ⬆️) en bas de l’écran.') +
             line('3', 'Choisis <b>« Sur l’écran d’accueil »</b>, puis <b>Ajouter</b>.') + '</div>'
           : '<div class="brief">' + line('1', 'Ouvre le menu du navigateur (⋮ en haut à droite sur Chrome).') + line('2', 'Choisis <b>« Installer l’application »</b> ou <b>« Ajouter à l’écran d’accueil »</b>.') + '</div>') +
      '<p class="hint">Politik aura sa propre icône, s’ouvrira en plein écran et fonctionnera même sans internet.</p>' });
  });

  /* Outils partagés avec la phase « Gouverner » (js/govui.js) */
  window.PolitikUI = { modal: modal, closeModal: closeModal, toast: toast, go: go, esc: esc, line: line, srcHtml: srcHtml, chip: chip,
    game: function () { return g; }, me: function () { return me; } };
  renderTitleMap();
  renderChoose();
})();

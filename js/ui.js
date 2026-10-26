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
  /* v2.5 : ton personnage et ton parti (gardés d'une partie à l'autre) */
  var PS = window.PolitikPerso, perso = null, founded = null, leadOn = false;
  try { perso = JSON.parse(localStorage.getItem('politik_perso') || 'null'); founded = JSON.parse(localStorage.getItem('politik_parti') || 'null'); leadOn = localStorage.getItem('politik_lead') === '1'; } catch (e) {}
  function savePerso() { try { localStorage.setItem('politik_perso', JSON.stringify(perso)); localStorage.setItem('politik_parti', JSON.stringify(founded)); localStorage.setItem('politik_lead', leadOn ? '1' : '0'); } catch (e) {} }
  var gameMode = 'reel';   // v1.1 : 'reel' (Réaliste) ou 'egal' (Simulation : égalité des chances)
  var gameBase = 'e2024';  // v1.2 : point de départ du mode Réaliste : 'p2022', 'e2024' ou 'sond'
  try { if (localStorage.getItem('politik_mode') === 'egal') gameMode = 'egal'; var sb = localStorage.getItem('politik_base'); if (D.BASES[sb]) gameBase = sb; } catch (e) {}
  var gameFormat = 'classique';   // v2.8 : 'classique' (8 tours) ou 'eclair' (3 tours)
  try { if (localStorage.getItem('politik_format') === 'eclair') gameFormat = 'eclair'; } catch (e) {}
  /* v2.8 : la sauvegarde automatique, au début de chaque tour de campagne */
  var SAVE = 'politik_save';
  /* v3.3 : la photo de la partie au début du tour. Le bouton « Sauvegarder » la réécrit : reprendre en plein tour
     rejouerait le journal et les événements, on reprend donc toujours au début du tour en cours. */
  var turnSnap = null, turnSnapTurn = 0;
  function saveNow() {
    if (g) { turnSnap = E.saveGame(g); turnSnapTurn = g.turn + 1; }
    try { localStorage.setItem(SAVE, JSON.stringify({ v: 1, when: Date.now(), game: turnSnap || E.saveGame(g), me: me, quick: quickGame, perso: perso, founded: founded, lead: leadOn,
      foundedOn: !!(founded && me === founded.sigle) })); } catch (e) {}
  }
  function clearSave() { try { localStorage.removeItem(SAVE); } catch (e) {} renderResume(); }
  function readSave() { try { var x = JSON.parse(localStorage.getItem(SAVE) || 'null'); return x && x.v === 1 ? x : null; } catch (e) { return null; } }
  function renderResume() {
    var sv = readSave(), b = $('btn-resume'); if (!b) return;
    if (!sv) { b.hidden = true; return; }
    var gg; try { gg = JSON.parse(sv.game); } catch (e) { b.hidden = true; return; }
    var P = E.PARTY[sv.me] || (sv.founded && sv.founded.sigle === sv.me ? sv.founded : null);
    b.hidden = !P;
    if (P) b.innerHTML = '↻ Reprendre ta partie<small>' + esc(P.name || P.short) + ' · tour ' + (gg.turn + 1) + ' sur ' + (D.FORMATS[gg.format] || D.FORMATS.classique).turns + '</small>';
  }
  function resumeGame() {
    var sv = readSave(); if (!sv) return;
    perso = sv.perso; founded = sv.founded; leadOn = sv.lead;
    PS.reset(A);
    if (sv.foundedOn && founded) PS.found(founded, perso, A);
    else if (leadOn && perso && perso.name) PS.lead(sv.me, perso, A);
    g = E.loadGame(sv.game); me = sv.me; quickGame = sv.quick; selected = null; queue = []; theme = null; themePicked = false; advisorHidden = false;
    go('game'); nextTurn();
    toast('Partie reprise au tour ' + g.turn + '.');
  }
  var justAdded = -1;                      // v1.4 : la dernière carte posée, qui se retourne
  var theme = null, themePicked = false;   // v0.3 : le message (thème) choisi pour les actions
  var advisorHidden = false;               // v0.7 : la conseillère, masquée pour ce tour
  var T = window.PolitikTuto, forceTuto = false, tutoGame = false;
  var quick = false, quickGame = false;    // v2.0 : « Jouer » direct (programme conseillé, sans paramétrage)

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
  function chip(pid) { var p = party(pid); return '<span class="who" style="background:' + p.color + ';color:' + p.ink + '">' + esc(E.sigle(pid)) + '</span>'; }
  function axisHtml(pid) {
    var cells = D.PARTIES.slice().sort(function (a, b) { return a.pos - b.pos; }).map(function (p) {
      var on = p.id === pid;
      return '<span class="axis-dot' + (on ? ' on' : '') + '" style="' + (on ? 'background:' + p.color + ';color:' + p.ink : '') + '">' + esc(E.sigle(p.id)) + '</span>';
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
    if (name === 'setup') quick = false;
    if (name !== 'game') FX.clearBreaking();
    Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.remove('active'); });
    $('screen-' + name).classList.add('active');
    if (name === 'choose') renderChoose();
    if (name === 'setup') renderSetup();
    if (name === 'title') renderResume();
  }
  document.addEventListener('click', function (e) {
    var h = e.target.closest('[data-action="tuto"]'); if (h) { forceTuto = true; quick = true; go('choose'); return; }
    var pl = e.target.closest('[data-action="play"]'); if (pl) { gameFormat = 'classique'; try { localStorage.setItem('politik_format', 'classique'); } catch (er) {} quick = true; go('choose'); return; }
    var ec = e.target.closest('[data-action="eclair"]'); if (ec) { gameFormat = 'eclair'; try { localStorage.setItem('politik_format', 'eclair'); } catch (er) {} quick = true; go('choose'); return; }
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
    $('format-pick').innerHTML = ['classique', 'eclair'].map(function (k) {
      var F = D.FORMATS[k]; return '<button type="button" role="radio" class="mode-btn' + (gameFormat === k ? ' on' : '') + '" data-format="' + k + '" aria-checked="' + (gameFormat === k) + '"><b>' + (k === 'eclair' ? '⚡ ' : '') + esc(F.name) + '</b><small>' + esc(F.text) + '</small></button>';
    }).join('');
    $('base-pick').innerHTML = ['p2022', 'e2024', 'sond'].map(function (k) {
      var B = D.BASES[k], on = gameBase === k, more = '';
      if (on && k === 'sond') {
        more = '<div class="polls"><p>Moyenne de <b>6 sondages</b> réalisés en ' + D.POLLS.date + ' pour la présidentielle 2027 :</p><ul>' +
          D.POLLS.list.map(function (x) { return '<li>' + esc(x.who) + ', ' + esc(x.when) + '</li>'; }).join('') + '</ul>' +
          '<p class="hint">Chaque parti du jeu porte le sigle de son modèle réel : RE = Renaissance, HOR = Horizons, LR = Les Républicains, LE = Les Écologistes… Les sondages sont nationaux : chaque région garde son profil de 2024 et suit la tendance.</p>' + srcHtml(D.POLLS) + '</div>';
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
    Array.prototype.forEach.call(document.querySelectorAll('[data-format]'), function (b) {
      b.addEventListener('click', function () { gameFormat = b.getAttribute('data-format'); try { localStorage.setItem('politik_format', gameFormat); } catch (e) {} renderSetup(); });
    });
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
    PS.reset(A);   // v2.5 : les partis retrouvent leurs candidats, le parti fondé n'est pas encore en lice
    renderPersoStrip();
    $('choose-kicker').textContent = gameFormat === 'eclair' ? '⚡ Campagne éclair : 3 tours' : quick ? 'Touche un parti, puis lance-toi' : gameMode === 'egal' ? 'Simulation : tout le monde part à égalité' : 'Réaliste : départ « ' + D.BASES[gameBase].short + ' »';
    $('screen-choose').classList.toggle('quick', quick);
    $('choose-back').setAttribute('data-go', quick ? 'title' : 'setup');
    $('choose-back').textContent = quick ? '‹ Accueil' : '‹ Paramètres de la partie';
    $('btn-start').textContent = quick ? 'C\'est parti !' : 'Composer mon programme';
    var grid = $('party-grid'); grid.innerHTML = '';
    // v2.5 : ton parti (ou la case pour le fonder) en premier
    var fb = el('button', { class: 'party-card party-new' + (founded && chosen === founded.sigle ? ' on' : ''), type: 'button', style: 'border-left-color:' + (founded ? founded.color : 'var(--violet)') });
    if (founded) {
      fb.innerHTML = '<div class="party-band" style="background:' + founded.color + ';color:' + PS.buildParty(founded, perso).ink + '"><span class="party-ini">' + esc(founded.sigle) + '</span><span class="party-fam">Ton parti</span></div><div class="party-face">' + A.face(PS.faceCfg(perso || PS.defaultChar(), founded.color)) +
        '</div><div class="party-body"><span class="party-name">' + esc(founded.name) + '</span><span class="party-res">' + esc((perso && perso.name) || 'Toi') + '</span></div>';
      fb.addEventListener('click', function () { chosen = founded.sigle; renderChoose(); });
    } else {
      fb.innerHTML = '<div class="party-band"><span class="party-ini">＋</span><span class="party-fam">Nouveau</span></div><div class="party-face party-plus">✦</div><div class="party-body"><span class="party-name">Fonder ton parti</span><span class="party-res">nom, couleur, idées</span></div>';
      fb.addEventListener('click', function () { foundParty(); });
    }
    grid.appendChild(fb);
    if (founded && chosen === founded.sigle) { renderFoundedDetail(); return; }
    if (!E.PARTY[chosen]) chosen = 'VP';
    D.PARTIES.forEach(function (p) {
      var b = el('button', { class: 'party-card' + (p.id === chosen ? ' on' : ''), type: 'button', 'aria-pressed': p.id === chosen, style: 'border-left-color:' + p.color });
      var meLead = leadOn && perso && perso.name && p.id === chosen;   // v2.5 : tu prends la tête du parti choisi
      b.innerHTML = '<div class="party-band" style="background:' + p.color + ';color:' + p.ink + '"><span class="party-ini">' + esc(E.sigle(p.id)) +
        '</span><span class="party-fam">' + esc(p.family) + '</span></div><div class="party-face">' + (meLead ? A.face(PS.faceCfg(perso, p.color)) : A.portrait(p.id)) + '</div><div class="party-body"><span class="party-name">' + esc(p.name) +
        '</span><span class="party-res">' + esc(meLead ? perso.name : p.candidate) + '</span></div>';
      b.addEventListener('click', function () { chosen = p.id; renderChoose(); });
      grid.appendChild(b);
    });
    var p = party(chosen), lead = leadOn && perso && perso.name;
    $('party-detail').innerHTML = '<div class="cand-line">' + (lead ? A.face(PS.faceCfg(perso, p.color)) : A.portrait(p.id)) + '<div><b class="cand-name">' + esc(lead ? perso.name : p.candidate) + '</b><span>' + (lead ? 'à la tête du parti · ' + esc(PS.TRAITS[perso.trait].name.toLowerCase()) : esc(p.candTitle) + ' · tempérament ' + D.TEMPERS[p.id].label) + '</span></div></div>' +
      (gameMode === 'reel' ? '<div class="score24"><span>Score de départ</span><b>' + pctFr(natScore(gameBase, p.id) / 100, 1) + ' %</b><small>' + esc(D.BASES[gameBase].text) + ' <button type="button" class="linkbtn" data-learn="' + D.BASES[gameBase].learn + '">Pourquoi ce chiffre ?</button></small></div>'
        : '<div class="score24"><span>Mode Égalité</span><b>2</b><small>électeurs dans chaque région pour chaque parti : personne ne part en tête.</small></div>') +
      axisHtml(p.id) +
 ((p.pos <= 1 || p.pos >= 6) ? '<div><b>Au bout de l\'axe.</b> Au second tour, les reports de voix seront plus durs à obtenir : il faudra bien négocier entre les deux tours.</div>' : '') +
      '<div><b>Force.</b> ' + esc(p.force) + '</div><div><b>Faiblesse.</b> ' + esc(p.weakness) +
      '</div><div><b>Bases.</b> ' + p.bases.map(function (r) { return E.REG[r].name; }).join(', ') +
      '</div><div><b>Cartes.</b> ' + p.cards.map(function (c) { return D.CARDS[c].name; }).join(' · ') + '</div>' + traitHtml(p.id, false);
  }
  /* v2.0 : en partie rapide, le programme conseillé du parti est pris d'office */
  $('btn-start').addEventListener('click', function () {
    if (founded && chosen === founded.sigle && !(perso && perso.name)) { toast('Crée d\'abord ton personnage.'); return editChar(function () { renderChoose(); }); }
    applyPerso();
    if (quick) startGame(chosen); else openProgramme(chosen);
  });
  /* v2.5 : juste avant la partie, ton parti entre en lice, ou tu prends la tête du parti choisi */
  function applyPerso() {
    PS.reset(A);
    if (founded && chosen === founded.sigle) PS.found(founded, perso, A);
    else if (leadOn && perso && perso.name) PS.lead(chosen, perso, A);
  }
  /* La bande « Ton personnage », au-dessus des partis */
  function renderPersoStrip() {
    var has = perso && perso.name, col = founded && chosen === founded.sigle ? founded.color : (E.PARTY[chosen] || { color: '#7B3FA0' }).color;
    $('perso-strip').innerHTML = '<span class="ps-face">' + A.face(PS.faceCfg(perso || PS.defaultChar(), col)) + '</span><span class="ps-txt"><b>' + (has ? esc(perso.name) : 'Ton personnage') + '</b><small>' +
      (has ? (founded && chosen === founded.sigle ? 'candidat de ton parti' : leadOn ? 'tu prends la tête du parti choisi' : 'tu joues avec le candidat du parti') : 'ton nom, ton visage, ton style en débat') + '</small></span>' +
      (has && !(founded && chosen === founded.sigle) ? '<button type="button" class="ps-toggle" id="ps-lead" aria-pressed="' + leadOn + '">' + (leadOn ? 'Candidat : toi' : 'Être candidat') + '</button>' : '') +
      '<button type="button" class="ps-edit" id="ps-edit">' + (has ? 'Modifier' : 'Créer') + '</button>';
    $('ps-edit').onclick = function () { editChar(function () { if (!leadOn && perso.name) leadOn = true; savePerso(); renderChoose(); }); };
    if ($('ps-lead')) $('ps-lead').onclick = function () { leadOn = !leadOn; savePerso(); renderChoose(); };
  }
  function renderFoundedDetail() {
    var p = PS.buildParty(founded, perso);
    D.PARTIES.forEach(function (q) {
      var b = el('button', { class: 'party-card', type: 'button', style: 'border-left-color:' + q.color });
      b.innerHTML = '<div class="party-band" style="background:' + q.color + ';color:' + q.ink + '"><span class="party-ini">' + esc(E.sigle(q.id)) + '</span><span class="party-fam">' + esc(q.family) + '</span></div><div class="party-face">' + A.portrait(q.id) + '</div><div class="party-body"><span class="party-name">' + esc(q.name) + '</span><span class="party-res">' + esc(q.candidate) + '</span></div>';
      b.addEventListener('click', function () { chosen = q.id; renderChoose(); });
      $('party-grid').appendChild(b);
    });
    $('party-detail').innerHTML = '<div class="cand-line">' + A.face(PS.faceCfg(perso || PS.defaultChar(), p.color)) + '<div><b class="cand-name">' + esc((perso && perso.name) || 'Toi') + '</b><span>à la tête de ' + esc(p.name) + ' · ' + esc(PS.TRAITS[(perso || PS.defaultChar()).trait].name.toLowerCase()) + '</span></div></div>' +
      '<div class="score24"><span>Score de départ</span><b>≈ ' + D.RULES.novelty.start + ' %</b><small>Un parti tout neuf : des sympathisants seulement là où tes thèmes parlent aux habitants.</small></div>' +
      axisHtmlPos(p) +
      '<div><b>Tes thèmes.</b> ' + p.themes.map(function (t) { return th(t).icon + ' ' + esc(th(t).name); }).join(' · ') + '</div>' +
      '<div><b>Force.</b> ' + esc(p.force) + '</div><div><b>Faiblesse.</b> ' + esc(p.weakness) + '</div>' +
      '<div><b>Bases.</b> ' + p.bases.map(function (r) { return E.REG[r].name; }).join(', ') + '</div>' +
      '<div class="stack"><button type="button" class="btn" id="fp-edit">Modifier ton parti</button><button type="button" class="linkbtn" id="fp-del">Dissoudre ton parti</button></div>';
    $('fp-edit').onclick = function () { foundParty(); };
    $('fp-del').onclick = function () { modal({ kicker: 'Ton parti', title: 'Dissoudre ' + founded.name + ' ?', html: '<p>Ton parti disparaît. Ton personnage reste : tu pourras prendre la tête d\'un autre parti, ou en fonder un nouveau.</p>',
      buttons: [{ label: 'Dissoudre', primary: true, onClick: function () { founded = null; chosen = 'VP'; savePerso(); renderChoose(); } }, { label: 'Annuler' }] }); };
  }
  /* L'axe avec ton parti placé parmi les 12 */
  function axisHtmlPos(p) {
    var all = D.PARTIES.concat([p]).sort(function (a, b) { return a.pos - b.pos; });
    return '<div class="axis"><span class="axis-l">gauche</span>' + all.map(function (q) {
      var on = q === p; return '<span class="axis-dot' + (on ? ' on' : '') + '" style="' + (on ? 'background:' + q.color + ';color:' + q.ink : '') + '">' + esc(q.sigle || q.id) + '</span>';
    }).join('') + '<span class="axis-l">droite</span></div>';
  }

  /* ---------- v2.5 : l'atelier du personnage ---------- */
  function editChar(onDone) {
    var c = JSON.parse(JSON.stringify(perso || PS.defaultChar())), F = PS.FACE;
    if (!c.name) c.name = PS.randomName();
    function chips(key, list) {
      return '<div class="pc-row">' + list.map(function (x) { var v = x[0], on = c.face[key] === v; return '<button type="button" class="pc-chip" data-k="' + key + '" data-v="' + v + '" aria-pressed="' + on + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>';
    }
    function swatches(key, list, isSkin) {
      return '<div class="pc-row">' + list.map(function (v, i) { var val = isSkin ? i : v, on = c.face[key] === val; return '<button type="button" class="pc-sw" data-k="' + key + '" data-v="' + val + '" aria-pressed="' + on + '" style="background:' + v + '" aria-label="couleur ' + (i + 1) + '"></button>'; }).join('') + '</div>';
    }
    function draw() {
      var col = founded ? founded.color : (E.PARTY[chosen] || { color: '#7B3FA0' }).color;
      $('pc-prev').innerHTML = A.face(PS.faceCfg(c, col));
    }
    var html = '<div class="pc-top"><div class="pc-prev" id="pc-prev"></div><div class="pc-name"><label class="kicker" for="pc-name">Ton nom</label><input id="pc-name" class="pc-input" maxlength="26" value="' + esc(c.name) + '"><button type="button" class="linkbtn" id="pc-rand">🎲 Un nom au hasard</button></div></div>' +
      '<div class="kicker">Peau</div>' + swatches('skin', A.SKINS, true) +
      '<div class="kicker">Cheveux</div>' + chips('hair', F.hair) + swatches('hairColor', F.hairColor) +
      '<div class="kicker">Lunettes</div>' + chips('glasses', F.glasses) +
      '<div class="kicker">Expression</div>' + chips('mouth', F.mouth) +
      '<div class="kicker">Tenue</div>' + swatches('outfit', F.outfit) +
      '<div class="pc-row"><button type="button" class="pc-chip" id="pc-beard" aria-pressed="' + !!c.face.beard + '">Barbe</button></div>' +
      '<div class="kicker">Ton style en débat</div><div class="pick">' + Object.keys(PS.TRAITS).map(function (k) {
        var t = PS.TRAITS[k]; return '<button type="button" class="pick-row pc-trait" data-trait="' + k + '" aria-pressed="' + (c.trait === k) + '"><span class="lc-ai">' + t.icon + '</span><span class="pick-txt"><b>' + esc(t.name) + '</b><small>' + esc(t.text) + '</small></span></button>';
      }).join('') + '</div>';
    modal({ kicker: 'Ton personnage', title: 'Qui es-tu ?', html: html, buttons: [{ label: 'C\'est moi !', primary: true, onClick: function () {
      c.name = ($('pc-name') ? $('pc-name').value : c.name).trim() || PS.randomName(); perso = c; savePerso(); if (onDone) onDone();
    } }, { label: 'Annuler' }],
      onOpen: function () {
        draw();
        $('pc-name').addEventListener('input', function () { c.name = this.value; });
        $('pc-rand').addEventListener('click', function () { c.name = PS.randomName(); $('pc-name').value = c.name; });
        $('pc-beard').addEventListener('click', function () { c.face.beard = !c.face.beard; this.setAttribute('aria-pressed', c.face.beard); draw(); });
        Array.prototype.forEach.call(document.querySelectorAll('[data-k]'), function (b) {
          b.addEventListener('click', function () {
            var k = b.getAttribute('data-k'), v = b.getAttribute('data-v'); c.face[k] = k === 'skin' ? +v : v;
            Array.prototype.forEach.call(document.querySelectorAll('[data-k="' + k + '"]'), function (x) { x.setAttribute('aria-pressed', x === b); });
            draw();
          });
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-trait]'), function (b) {
          b.addEventListener('click', function () { c.trait = b.getAttribute('data-trait'); Array.prototype.forEach.call(document.querySelectorAll('[data-trait]'), function (x) { x.setAttribute('aria-pressed', x === b); }); });
        });
      } });
  }

  /* ---------- v2.5 : fonder ton parti ---------- */
  function foundParty() {
    if (!(perso && perso.name)) { return editChar(function () { foundParty(); }); }
    var d = founded ? JSON.parse(JSON.stringify(founded)) : { name: PS.randomPartyName(), sigle: '', color: PS.COLORS[0], pos: 3.5, themes: [] };
    if (!d.sigle) d.sigle = PS.sigleOf(d.name);
    var STEPS = [0.5, 1.2, 2, 2.5, 3.2, 3.8, 4.4, 5, 5.6, 6.3];
    function axisPick() {
      var all = D.PARTIES.slice().sort(function (a, b) { return a.pos - b.pos; });
      return '<div class="fp-axis">' + STEPS.map(function (x) {
        return '<button type="button" class="fp-step" data-pos="' + x + '" aria-pressed="' + (d.pos === x) + '" title="' + esc(PS.familyOf(x)) + '"></button>';
      }).join('') + '</div><div class="fp-ref">' + all.map(function (q) { return '<i style="left:' + (100 * (q.pos - 0.2) / 6.6).toFixed(1) + '%;background:' + q.color + '" title="' + esc(q.short) + '"></i>'; }).join('') + '</div>' +
        '<div class="fp-axl"><span>gauche</span><b id="fp-fam">' + esc(PS.familyOf(d.pos)) + '</b><span>droite</span></div>';
    }
    var html = '<label class="kicker" for="fp-name">Le nom de ton parti</label><input id="fp-name" class="pc-input" maxlength="32" value="' + esc(d.name) + '"><button type="button" class="linkbtn" id="fp-rand">🎲 Un nom au hasard</button>' +
      '<div class="fp-two"><div><label class="kicker" for="fp-sig">Sigle</label><input id="fp-sig" class="pc-input fp-sig" maxlength="3" value="' + esc(d.sigle) + '"></div><div><span class="kicker">Couleur</span><div class="pc-row">' +
      PS.COLORS.map(function (col) { return '<button type="button" class="pc-sw" data-col="' + col + '" aria-pressed="' + (d.color === col) + '" style="background:' + col + '" aria-label="couleur"></button>'; }).join('') + '</div></div></div>' +
      '<span class="kicker">Ta place sur l\'axe gauche-droite</span>' + axisPick() +
      '<p class="hint">Les points de couleur sont les 12 autres partis. Plus tu es près d\'eux, plus tu leur prends des électeurs… et plus les alliances avec eux sont faciles.</p>' +
      '<span class="kicker">Tes 2 thèmes forts</span><div class="pc-row">' + D.THEMES.map(function (t) {
        return '<button type="button" class="pc-chip" data-th="' + t.id + '" aria-pressed="' + (d.themes.indexOf(t.id) >= 0) + '">' + t.icon + ' ' + esc(t.name) + '</button>';
      }).join('') + '</div><p class="hint" id="fp-err"></p>';
    modal({ kicker: 'Nouveau parti', title: 'Fonder ton parti', html: html, buttons: [{ label: 'Fonder le parti', primary: true, keep: true, onClick: function () {
      d.name = $('fp-name').value.trim(); d.sigle = $('fp-sig').value.toUpperCase().replace(/[^A-Z]/g, '');
      var err = !d.name ? 'Donne un nom à ton parti.' : PS.sigleError(d.sigle) || (d.themes.length !== 2 ? 'Choisis 2 thèmes forts.' : null);
      if (err) { $('fp-err').textContent = err; return; }
      closeModal(); founded = d; chosen = d.sigle; savePerso(); renderChoose();
      toast('🎉 ' + d.name + ' est né !');
    } }, { label: 'Annuler' }],
      onOpen: function () {
        $('fp-name').addEventListener('input', function () { d.name = this.value; $('fp-sig').value = PS.sigleOf(d.name); });
        $('fp-rand').addEventListener('click', function () { d.name = PS.randomPartyName(); $('fp-name').value = d.name; $('fp-sig').value = PS.sigleOf(d.name); });
        Array.prototype.forEach.call(document.querySelectorAll('[data-col]'), function (b) { b.addEventListener('click', function () { d.color = b.getAttribute('data-col'); Array.prototype.forEach.call(document.querySelectorAll('[data-col]'), function (x) { x.setAttribute('aria-pressed', x === b); }); }); });
        Array.prototype.forEach.call(document.querySelectorAll('[data-pos]'), function (b) { b.addEventListener('click', function () { d.pos = +b.getAttribute('data-pos'); $('fp-fam').textContent = PS.familyOf(d.pos); Array.prototype.forEach.call(document.querySelectorAll('[data-pos]'), function (x) { x.setAttribute('aria-pressed', x === b); }); }); });
        Array.prototype.forEach.call(document.querySelectorAll('[data-th]'), function (b) {
          b.addEventListener('click', function () {
            var t = b.getAttribute('data-th'), i = d.themes.indexOf(t);
            if (i >= 0) d.themes.splice(i, 1); else { d.themes.push(t); if (d.themes.length > 2) d.themes.shift(); }
            Array.prototype.forEach.call(document.querySelectorAll('[data-th]'), function (x) { x.setAttribute('aria-pressed', d.themes.indexOf(x.getAttribute('data-th')) >= 0); });
          });
        });
      } });
  }

  /* ---------- v0.7 : composer son programme ---------- */
  var progSel = [], progFin = [];
  function fansHtml(m) {
    if (!m.fans) return '';
    var up = [], down = [];
    D.SEGMENTS.forEach(function (sg) { var v = m.fans[sg.id] || 0; if (v > 0) up.push(v > 1 ? sg.icon + sg.icon : sg.icon); if (v < 0) down.push(v < -1 ? sg.icon + sg.icon : sg.icon); });
    return (up.length ? ' · 👍 ' + up.join('') : '') + (down.length ? ' · 👎 ' + down.join('') : '');
  }
  var FIN_SAVE = ['gelpensions', 'gelpoint', 'chomage', 'trainvie'];   // les financements qui sont des économies (le reste : des recettes)
  function fiche(m) {
    var t = m.theme ? th(m.theme) : { icon: m.cost < 0 ? '🏦' : '💸', name: FIN_SAVE.indexOf(m.id) >= 0 ? 'Financement · économie' : 'Financement · recette' };   // v3.5.3 : les financements n'ont pas de thème
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
    // financement : jusqu'à R.fundingMax mesures de recettes ou d'économies
    var fsec = el('div', { class: 'pl-theme pl-fin' }, '<div class="pl-head">🏦 <b>Comment tu finances</b><span class="pl-cred">' + progFin.length + ' / ' + R.fundingMax + ' (facultatif)</span></div>');
    // v3.5.3 : les financements rangés comme les lois du quinquennat : recettes, puis économies (ce qui rapporte le plus d'abord)
    var finGroups = [{ icon: '💶', name: 'Faire rentrer de l\u2019argent', ids: [] }, { icon: '✂️', name: 'Réduire les dépenses', ids: [] }];
    D.FUNDING.slice().sort(function (a, b) { return a.cost - b.cost; }).forEach(function (m) { finGroups[FIN_SAVE.indexOf(m.id) >= 0 ? 1 : 0].ids.push(m); });
    finGroups.forEach(function (gp) {
      fsec.appendChild(el('div', { class: 'pl-sub' }, gp.icon + ' ' + esc(gp.name)));
      gp.ids.forEach(finRow);
    });
    function finRow(m) {
      var on = progFin.indexOf(m.id) >= 0;
      var row = el('div', { class: 'pl-row' + (on ? ' on' : '') });
      row.innerHTML = '<button type="button" class="pl-pick" aria-pressed="' + on + '">' + (on ? '✓' : '+') + '</button>' +
        '<span class="pl-txt"><b>' + esc(m.name) + '</b><small>' + costTxt(m.cost) + ((p.financing || []).indexOf(m.id) >= 0 ? ' · conseillé' : '') + fansHtml(m) + '</small></span>' +
        '<button type="button" class="pl-info" aria-label="Le saviez-vous ?">?</button>';
      row.querySelector('.pl-pick').addEventListener('click', function () {
        if (on) progFin.splice(progFin.indexOf(m.id), 1);
        else if (progFin.length >= R.fundingMax) { toast(R.fundingMax + ' mesures de financement au plus.'); return; }
        else progFin.push(m.id);
        renderProgramme(pid);
      });
      row.querySelector('.pl-info').addEventListener('click', function () { modal({ kicker: 'Le saviez-vous ?', title: m.name, html: fiche(m) }); });
      fsec.appendChild(row);
    }
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
      (pl ? '<p>' + (bonus > 0 ? '❤️ <b>Région de cœur</b> pour ton programme : +1 soutien sur tes Meetings ici.' : bonus < 0 ? '👎 <b>Région hostile</b> à ton programme : −1 soutien sur tes Meetings ici.' : 'Ton programme reçoit ici un accueil moyen.') + '</p>' : '') +
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
    g = E.createGame(pid, { mode: gameMode, base: gameBase, format: gameFormat }); me = pid; selected = null; queue = []; theme = null; themePicked = false; advisorHidden = false;
    quickGame = quick;
    E.setProgramme(g, pid, prog || party(pid).programme, fin || party(pid).financing);
    go('game');
    nextTurn();
  }
  function mePl() { return E.player(g, me); }
  /* Raccourci : la campagne se joue toute seule, et tu l'emportes de justesse au second tour */
  function skipCampaign(pid, prog, fin) {
    g = E.createGame(pid, { mode: gameMode, base: gameBase, format: gameFormat }); me = pid;
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
      if (E.endTurn(g).between) E.autoBetween(g);   // v2.3 : l'entre-deux-tours se joue tout seul (sinon la boucle ne finissait jamais)
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
    saveNow();   // v2.8 : on peut reprendre la partie à ce tour
    var info = E.startTurn(g);
    queue = []; themePicked = false; theme = E.bestTheme(g, me, selected); advisorHidden = false; advReact = null;
    // les affaires et le dilemme des IA se règlent tout de suite ; les tiens t'attendent après le journal
    var aiAff = [];
    g.affairs.filter(function (a) { return a.pid !== me; }).forEach(function (a) { aiAff.push(Object.assign({ src: a.src }, E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)))); });
    var aiDil = null;
    if (info.dilemma && info.dilemma.pid !== me) aiDil = E.resolveDilemma(g, info.dilemma.pid, AI.chooseDilemma(g, info.dilemma.pid));
    render();
    var mine = g.affairs.filter(function (a) { return a.pid === me; });
    var myPrim = g.primaire && !g.primaire.done && g.primaire.pid === me;
    var waits = mine.length || (g.dilemma && g.dilemma.pid === me) || myPrim;
    var alerts = [];
    if (info.crisis) alerts.push('CRISE · ' + info.crisis.title);
    mine.forEach(function (a) { alerts.push('AFFAIRE · Toi : ' + a.title); });
    aiAff.forEach(function (x) { alerts.push('AFFAIRE · ' + party(x.pid).short + ' : ' + x.title); });
    info.later.forEach(function (x) { if (x.hit) alerts.push(x.title + (x.pid === me ? '' : ' (' + party(x.pid).short + ')')); });
    FX.breaking('Alerte info', alerts);
    var jp = journalParts(info, aiDil, aiAff);
    var paper = window.PolitikPress.build({ g: g, E: E, me: me, info: info, aiAff: aiAff, aiDil: aiDil, log: g.turn > 1 ? pressLog : [], changes: g.turn > 1 ? pressChanges : [], before: pressBefore });
    paper.mine = jp.mine; paper.learn = jp.learn;
    lastPaper = paper;
    lastJournal = articlesHtml(paper);
    showTab('carte'); $('tab-actu-dot').hidden = false;
    // v2.0 : en partie rapide, le premier tour démarre directement sur la carte (le journal reste dans l'onglet Actu)
    if (g.turn === 1 && quickGame && !waits) return startActions();
    showPaper(paper, mine.length ? 'Une affaire te tombe dessus →' : waits ? 'Une décision t’attend →' : 'À mes actions', function () {
      chain([function (next) { mine.length ? showAffair(next) : next(); },
             function (next) { g.dilemma && g.dilemma.pid === me ? showDilemma(next) : next(); },
             function (next) { g.primaire && !g.primaire.done && g.primaire.pid === me ? showPrimaire(next) : next(); }], startActions);
    });
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
    // v2.5.1 : l'édition spéciale au style de la une (scène plein cadre, mot géant)
    var word = a.src === 'budget' ? 'Ardoise.' : a.src === 'casseroles' ? 'Casserole.' : a.src === 'canard' ? 'Révélations.' : 'Coup bas.';
    var canard = a.src === 'canard';
    var html = '<div class="aff-une">' + Press.scene('scandale') +
      '<div class="une-top"><span class="une-logo' + (canard ? ' canard' : '') + '"><b>' + (canard ? 'CD' : 'QN') + '</b><span>' + (canard ? 'Le Canard<br>Déchaîné' : 'Le Quotidien<br>National') + '</span></span><span class="aff-tag">Édition spéciale</span></div>' +
      '<div class="aff-word">' + esc(word) + '</div><p class="aff-title">' + esc(a.title) + '</p></div>' +
      '<p><b>' + esc(src) + '</b> ' + esc(a.text) + '</p>' +
      '<button type="button" class="linkbtn" id="aff-learn">📚 Les affaires et la justice</button>' +
      '<div class="pick">' + D.REACTIONS.map(function (rc, i) {
        return '<button type="button" class="pick-row" data-rc="' + i + '"><span class="pick-txt"><b>' + esc(rc.label) + '</b><small>' + esc(rc.hint) + '</small></span></button>';
      }).join('') + '</div>';
    modal({ kicker: '💥 Affaire', title: 'Ça sort dans la presse', cls: 'shake', html: html, buttons: [],
      onOpen: function () {
        $('aff-learn').addEventListener('click', function () { var L = D.LEARN.affaires; $('aff-learn').outerHTML = '<div class="learn learn-inline">' + A.advisor() + '<div><b>' + esc(L.title) + '</b><p>' + esc(L.text) + '</p>' + srcHtml(L) + '</div></div>'; });
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
    if (g.turn === 1 && (forceTuto || !T.isActive())) {
      var before = T.isActive(); T.maybeStart(forceTuto, { region: tutoRegion() }); tutoGame = !before && T.isActive(); forceTuto = false;
      if (tutoGame) render();
    }
  }
  /* v2.0 : la région que le tutoriel fait clignoter : celle où un Meeting rapporte le plus (puis la plus peuplée) */
  function tutoRegion() {
    var best = null, bn = -1;
    D.REGIONS.forEach(function (r) {
      var act = { type: 'terrain', region: r.id, theme: E.bestTheme(g, me, r.id) };
      if (canQueue(act)) return;
      var n = E.terrainCubes(g, me, r.id, act.theme) + r.ins / 100;
      if (n > bn) { bn = n; best = r.id; }
    });
    return best;
  }
  function line(icon, html) { return '<div class="brief-row"><span class="brief-i">' + icon + '</span><span>' + html + '</span></div>'; }
  /* v2.1 : le journal du matin en deux temps.
     La une (front) : le gros titre et 2 ou 3 brèves, rien de plus.
     Les pages intérieures (inside) : tout le détail, rangé par rubriques, qu'on ouvre si on veut. */
  var JOUR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  function journalParts(info, aiDil, aiAff) {
    var vk = g.news.theme, crisis = info.crisis;
    var ev = crisis ? null : D.EVENTS.filter(function (e) { return e.id === info.event.id; })[0];
    var title = crisis ? crisis.title : ev.title, text = crisis ? crisis.text : ev.text;
    // ---- les rubriques intérieures ----
    var mine = [], rivals = [];
    var inc = info.income.filter(function (x) { return x.pid === me; })[0];
    if (inc) mine.push(line('💰', 'Ta caisse : <b>+' + inc.money + ' €</b> · <b>+' + inc.infl + ' ★</b>' + (inc.forme ? ' · <b>+' + inc.forme + ' ⚡</b>' : '')));
    var myMil = info.militants.filter(function (x) { return x.pid === me; });
    if (myMil.length) mine.push(line('👥', 'Tes militants : +1 soutien en ' + myMil.map(function (x) { return SHORT[x.rid]; }).join(', ')));
    if (info.event) info.event.effects.filter(function (f) { return f.pid === me; }).forEach(function (f) { mine.push(line('📰', esc(f.text))); });
    var myAffairsLater = [];
    if (info.programmes) info.programmes.forEach(function (x) {
      if (x.pid === me) {
        mine.push(line('📋', 'Il te reste <b>' + x.budget + ' Md€</b> à financer : ' + FUND_LABEL[fundingState(x.over)].toLowerCase() + (x.over > 0 ? ', ça va se voir…' : '.') + (x.cas ? ' (+' + x.cas + ' casserole' + (x.cas > 1 ? 's' : '') + ')' : '')));
        if (x.echo.length) mine.push(line('❤️', 'Ton programme fait mouche en ' + x.echo.map(function (r) { return SHORT[r]; }).join(', ') + ' : +1 soutien dans chacune.'));
      }
      else if (x.choc.length) rivals.push(line('📢', esc(party(x.pid).short) + ' fait parler avec « ' + esc(x.choc[0]) + ' ».'));
    });
    info.later.forEach(function (x) {
      var row = x.hit ? line('⏳', '<b>' + esc(x.title) + '</b>' + (x.pid === me ? '' : ' (' + esc(party(x.pid).short) + ')') + ' — ' + esc(x.text) + ' ' + esc(x.effects.join(', ')) + '.')
        : x.pid === me ? line('😮‍💨', '« ' + esc(x.title) + ' » : fausse alerte, l\'affaire ne sort pas.') : null;
      if (row) (x.pid === me ? mine : rivals).push(row);
    });
    (aiAff || []).forEach(function (x) {
      rivals.push(line('💥', '<b>Affaire pour ' + esc(party(x.pid).short) + '</b> : « ' + esc(x.title) + ' ». Réaction : <b>' + esc(x.reaction) + '</b>' + (x.effects.length ? ' — ' + esc(x.effects.join(', ')) : '') + '.'));
    });
    if (info.usure) rivals.push(line('🕰️', 'Usure du pouvoir : Réforme Encore perd 1 soutien en ' + esc(E.REG[info.usure].name) + '.'));
    if (aiDil) rivals.push(line('🤔', esc(party(aiDil.pid).short) + ', face à « ' + esc(aiDil.title) + ' », choisit : <b>' + esc(aiDil.choice) + '</b>' + (aiDil.effects.length ? ' — ' + esc(aiDil.effects.join(', ')) : '') + '.'));
    var country = [];
    if (crisis) crisis.effects.forEach(function (t) { country.push(line('📰', esc(t))); });
    else if (!ev.theme && g.news.headline) country.push(line('📰', esc(g.news.headline)));
    country.push(line('🔥', 'À la une : ' + g.hot.map(function (x) { return th(x).icon + ' <b>' + esc(th(x).name) + '</b>'; }).join(' + ') + ' <span class="muted">(+1 d\'impact pour qui en parle)</span>'));
    var learnKey = { 1: 'presidentielle', 2: 'agenda', 4: 'sondages', 5: 'comptes', 6: 'dette', 7: 'temps_parole' }[g.turn];
    var learn = learnKey ? learnBox(learnKey) : '';
    // ---- les 2 ou 3 brèves de la une : seulement ce qui change ton tour ----
    var briefs = [];
    if (E.isDebateTurn(g)) briefs.push({ k: 'Ce soir', t: '🎙️ Débat télévisé', s: 'Garde des ★ pour miser.' });
    var myHit = info.later.filter(function (x) { return x.pid === me && x.hit; })[0];
    if (myHit) briefs.push({ k: 'Te concerne', t: '⏳ ' + esc(myHit.title), s: esc(myHit.effects.join(', ')) });
    briefs.push({ k: 'Sujet du jour', t: g.hot.map(function (x) { return th(x).icon + ' ' + esc(th(x).short); }).join(' + '), s: 'Parles-en : +1 d\'impact.' });
    if (aiAff && aiAff.length) briefs.push({ k: 'Affaires', t: '💥 ' + (aiAff.length > 1 ? aiAff.length + ' rivaux visés' : esc(party(aiAff[0].pid).short)), s: aiAff.length > 1 ? aiAff.map(function (x) { return esc(party(x.pid).short); }).join(', ') : 'Dans la tourmente.' });
    if (inc) briefs.push({ k: 'Ta caisse', t: '+' + inc.money + ' € · +' + inc.infl + ' ★', s: myMil.length ? '👥 Tes militants rapportent.' : 'De quoi faire campagne.' });
    briefs = briefs.slice(0, 3);
    var front = '<div class="np np-in"><div class="np-mast"><span class="np-name">Le Quotidien National</span>' +
      '<span class="np-date"><span>Tour ' + g.turn + ' sur ' + R.maxTurns + '</span><span>' + JOUR[(g.turn - 1) % 7] + ' · édition du matin</span><span>1,20 €</span></span></div>' +
      (crisis ? '<div class="np-crisis">Crise · ' + esc(crisis.name) + ' · ' + (crisis.index + 1) + '/3</div>' : '') +
      '<h3 class="np-head">' + esc(title) + '</h3>' +
      (A.hasVignette(vk) ? '<div class="np-vign">' + A.vignette(vk) + '</div>' : '') +
      '<p class="np-lead">' + esc(text) + '</p>' +
      '<div class="np-cols">' + briefs.map(function (b) { return '<div class="np-brief"><span class="np-k">' + b.k + '</span><b>' + b.t + '</b><small>' + b.s + '</small></div>'; }).join('') + '</div></div>';
    function rub(name, rows) { return rows.length ? '<section class="np-rub"><h4>' + name + '</h4><div class="np-rows">' + rows.join('') + '</div></section>' : ''; }
    var inside = '<div class="np np-inside"><div class="np-folio"><span>Le Quotidien National</span><span>Pages intérieures · tour ' + g.turn + '</span></div>' +
      rub('France', country) + rub('Ta campagne', mine) + rub('Chez les rivaux', rivals) +
      (learn ? '<section class="np-rub"><h4>Le saviez-vous ?</h4>' + learn + '</section>' : '') + '</div>';
    return { front: front, inside: inside, mine: mine.join(''), learn: learn };
  }
  /* ---------- v2.2 : le journal du matin en plein écran ----------
     La une : une scène dessinée, un mot géant, et 3 titres qui renvoient chacun à leur article.
     « Ouvrir le journal » : tous les articles du jour, plus le mot de Lulu sur ta campagne. */
  var pressLog = [], pressBefore = {}, pressChanges = [], lastPaper = null, paperCont = null;
  var Press = window.PolitikPress;
  function articleHtml(a) {
    var p = a.pid ? party(a.pid) : null;
    return '<article class="art-item' + (a.mine ? ' mine' : '') + '" id="art-' + a.id + '">' +
      '<div class="art-rub"><span>' + esc(a.rub) + '</span>' + (a.mine ? '<em>Ton parti</em>' : '') + '<i>p. ' + a.page + '</i></div>' +
      (a.id === 'main' ? '<div class="art-pic">' + Press.scene(a.scene) + '</div>' : '') +
      '<h3>' + esc(a.title) + '</h3>' +
      (a.rule ? '<p class="art-rule"><b>' + esc(a.ruleLabel || 'Pour la campagne') + ' :</b> ' + esc(a.rule) + '</p>' : '') +
      '<div class="art-body">' + (p && a.id !== 'main' ? '<span class="art-face" style="--pc:' + p.color + '">' + A.portrait(a.pid) + '</span>' : '') + '<p>' + esc(a.text) + '</p></div></article>';
  }
  function articlesHtml(paper) {
    return '<div class="pages-in">' + paper.articles.map(articleHtml).join('') +
      (paper.mine ? '<section class="art-lulu"><div class="art-rub"><span>Le mot de Lulu</span></div><div class="learn">' + A.advisor() + '<div class="brief">' + paper.mine + '</div></div></section>' : '') +
      (paper.learn ? '<section class="art-learn">' + paper.learn + '</section>' : '') + '</div>';
  }
  function frontHtml(paper) {
    var m = paper.main;
    return '<div class="une-pic">' + Press.scene(paper.scene) + '</div>' +
      '<div class="une-top"><span class="une-logo"><b>QN</b><span>Le Quotidien<br>National</span></span><span class="une-date">' + paper.day.charAt(0).toUpperCase() + paper.day.slice(1) + '<br>' + esc(paper.when || 'tour ' + g.turn + ' sur ' + R.maxTurns) + '</span></div>' +
      '<div class="une-word">' + esc(paper.word) + '</div>' +
      '<p class="une-sub">' + esc(m.lead || m.title) + '</p>' +
      '<div class="une-teasers">' + paper.teasers.map(function (a) {
        return '<button type="button" class="une-t" data-art="' + a.id + '"><b>' + esc(a.title) + '</b><small>' + (a.mine ? 'Ton parti · ' : '') + 'page ' + a.page + '</small></button>';
      }).join('') + '</div>';
  }
  /* le mot géant prend toute la largeur, sans déborder */
  function fitWord() {
    var w = document.querySelector('#paper-front .une-word'); if (!w) return;
    var size = 132; w.style.fontSize = size + 'px';
    while (w.scrollWidth > w.clientWidth + 1 && size > 48) { size -= 4; w.style.fontSize = size + 'px'; }
  }
  function showPaper(paper, contLabel, cont) {
    closeModal(); $('toast').hidden = true;
    paperCont = cont;
    $('paper-front').innerHTML = frontHtml(paper);
    $('paper-inside').innerHTML = '<div class="pages-head"><button type="button" class="linkbtn" id="paper-back">‹ La une</button><span>Le Quotidien National · ' + esc(paper.when || 'tour ' + g.turn) + '</span></div>' + articlesHtml(paper);
    $('paper-inside').hidden = true; $('paper-front').hidden = false;
    $('paper-open').hidden = false;
    $('paper-go').textContent = contLabel;
    $('paper').hidden = false;
    FX.replay($('paper-front'), 'une-in');
    requestAnimationFrame(fitWord);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord);
  }
  function openPages(id) {
    $('paper-front').hidden = true; $('paper-inside').hidden = false; $('paper-open').hidden = true;
    FX.replay($('paper-inside'), 'pages-in-anim');
    var t = id && $('paper-inside').querySelector('#art-' + id);
    $('paper-inside').scrollTop = 0;
    if (t) { $('paper-inside').scrollTop = t.offsetTop - 56; FX.replay(t, 'art-hi'); }
  }
  function closePaper() { $('paper').hidden = true; var c = paperCont; paperCont = null; if (c) c(); }
  $('paper-go').addEventListener('click', closePaper);
  $('paper-open').addEventListener('click', function () { openPages(); });
  $('paper').addEventListener('click', function (e) {
    var t = e.target.closest('[data-art]'); if (t) return openPages(t.getAttribute('data-art'));
    if (e.target.closest('#paper-back')) { $('paper-inside').hidden = true; $('paper-front').hidden = false; $('paper-open').hidden = false; }
  });
  /* ---------- v0.7 : Lulu, la directrice de campagne — un conseil clair par tour ---------- */
  function advice() {
    var pl = mePl(), ph = E.measure(pl.phare), hot = g.hot || [];
    if (g.turn === 1) return 'Parle de ta mesure phare (' + th(ph.theme).icon + ' ' + th(ph.theme).short + ') : choisis une région, puis 📣 Meeting.';
    if (E.isDebateTurn(g) && pl.infl < 2) return 'Débat ce soir 🎙️ et presque plus de ★ : évite la Télé ce tour-ci.';
    if (E.isDebateTurn(g)) return 'Débat ce soir 🎙️ ! Garde 2 ou 3 ★ : chaque ★ vaut 1 point.';
    if (pl.forme <= 1) return 'Candidat épuisé (⚡ ' + pl.forme + ') : préfère 🚪 Mobiliser ou 💰 Collecte.';
    if (pl.cas >= 3) return pl.cas + ' casseroles 🍳 : une affaire peut tomber. N\'attaque pas ce tour-ci.';
    var mineHot = hot.filter(function (t) { return pl.programme.some(function (id) { return E.measure(id).theme === t; }); })[0];
    if (mineHot) {
      var m = pl.programme.map(E.measure).filter(function (x) { return x.theme === mineHot; })[0];
      return th(mineHot).icon + ' ' + th(mineHot).name + ' fait la une, et c\'est dans ton programme : parles-en !';
    }
    var close = D.REGIONS.filter(function (r) {
      var c = g.regions[r.id].controller, my = E.cubes(g, r.id, me);
      if (c === me || my === 0) return false;
      var top = 0; g.players.forEach(function (p) { if (p.id !== me) top = Math.max(top, E.cubes(g, r.id, p.id)); });
      return top - my <= 1;
    }).sort(function (a, b) { return b.ins - a.ins; })[0];
    if (close) return 'Tu peux prendre ' + close.name + ' : un Meeting peut suffire.';
    if (pl.money < 3) return 'Caisses vides : fais une 💰 Collecte (menu Plus).';
    if (pl.militants === 0 && g.turn <= 4) return 'Implante des 👥 militants (menu Plus) : ils rapportent à chaque tour.';
    var lead = E.ranking(g)[0];
    if (lead !== me && E.player(g, lead).cas > 0 && E.allyOf(g, me) !== lead) return party(lead).short + ' mène et a des casseroles : 🔎 enquête sur lui (menu Plus).';
    var o = D.OBJECTIVES.filter(function (x) { return x.id === pl.objective; })[0];
    var op = E.objectiveProgress(g, me, pl.objective);
    if (op.done < op.need) return 'Objectif secret 🎯 ' + o.name + ' : ' + op.done + '/' + op.need + ' (+' + objShare(o) + ' % des voix).';
    var low = D.REGIONS.slice().sort(function (a, b) { return E.lowTurnoutFit(g, me, b.id) - E.lowTurnoutFit(g, me, a.id); })[0];
    if (g.turn <= R.registerTurns + 2 && E.lowTurnoutFit(g, me, low.id) >= 0.18) return 'En ' + low.name + ', 🚪 Mobiliser fait voter des abstentionnistes pour toi.';
    return 'Vise les grandes régions : ce sont elles qui pèsent le plus.';
  }
  /* v1.4 : Lulu parle dans une bulle de BD. Elle s'écrit lettre par lettre quand le conseil change,
     et Lulu réagit quelques secondes à chaque action que tu programmes. */
  var advShown = null, advTyper = null, advReact = null, advReactTimer = null;
  function renderAdvisor() {
    var box = $('advisor');
    if (!g || g.phase !== 'actions' || advisorHidden || T.isActive()) { box.hidden = true; advShown = null; return; }
    var text = advReact || advice();
    if (!box.hidden && text === advShown) return;
    box.hidden = false; advShown = text;
    if (!box.querySelector('.adv-bubble')) {
      box.innerHTML = '<span class="adv-face">' + A.advisor() + '</span><p class="adv-bubble" aria-live="polite"><b>' + D.ADVISOR.name + ' :</b> <span class="adv-txt"></span></p><button type="button" class="adv-close" aria-label="Masquer le conseil">✕</button>';
      box.querySelector('.adv-close').addEventListener('click', function (e) { e.stopPropagation(); advisorHidden = true; renderAdvisor(); });
      box.querySelector('.adv-bubble').addEventListener('click', function () { modal({ kicker: D.ADVISOR.title, title: D.ADVISOR.name + ' te conseille', html: '<div class="learn">' + A.advisor() + '<p>' + esc(advShown || '') + '</p></div>' }); });
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
  document.addEventListener('politik:tuto-end', function () { if (g) renderAdvisor(); });
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
    if (queue.length >= E.actionsFor(g, me)) return 'Tes ' + E.actionsFor(g, me) + ' actions sont déjà choisies.';
    if (act.type === 'card' && queue.some(function (q) { return q.card === act.card; })) return 'Carte déjà programmée.';
    if (['rappel', 'fusion', 'eclat'].indexOf(act.type) >= 0 && queue.some(function (q) { return q.type === act.type; })) return 'Déjà programmé ce tour.';
    if (act.type === 'nostalgie' && queue.some(function (q) { return q.type === 'nostalgie'; })) return 'Un seul retour en arrière par tour.';
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
    render(); T.notify(queue.length >= E.actionsFor(g, me) ? 'full' : 'queue');
  }

  /* ---------- v1.8 : les onglets ---------- */
  var activeTab = 'carte', journalSeen = '';
  /* v3.5 : la version PC. Sur grand écran, le sondage reste affiché à gauche et la colonne de droite montre
     l'actualité ou ton parti (voir css/desktop.css). */
  var DESK = window.matchMedia ? window.matchMedia('(min-width: 1024px) and (min-height: 560px)') : { matches: false };
  var rightTab = 'actu';
  function isDesk() { return !!DESK.matches; }
  function deskLayout() {
    if (!g || !isDesk()) return;
    $('tab-sondage').hidden = false; renderPollTab();
    ['actu', 'parti'].forEach(function (k) { $('tab-' + k).hidden = k !== rightTab; });
    if (rightTab === 'actu') renderActu(); else renderParti();
    Array.prototype.forEach.call(document.querySelectorAll('.tabbar [data-tab]'), function (b) {
      if (b.getAttribute('data-tab') === rightTab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  if (DESK.addEventListener) DESK.addEventListener('change', function () { if (!g) return; if (isDesk()) deskLayout(); else showTab('carte', true); });
  function showTab(name, fromBack) {
    if (isDesk()) {   // grand écran : seule la colonne de droite change
      if (name === 'actu' || name === 'parti') rightTab = name;
      activeTab = 'carte';
      deskLayout();
      if (name === 'actu') { journalSeen = g.turn + ''; $('tab-actu-dot').hidden = true; }
      T.notify('tab');
      return;
    }
    // v3.3.2 : le bouton « retour » du téléphone ramène à la carte au lieu de quitter le jeu
    if (!fromBack) {
      var inTab = history.state && history.state.politikTab;
      if (name !== 'carte' && !inTab) history.pushState({ politikTab: 1 }, '');
      else if (name === 'carte' && inTab) { history.back(); return; }
    }
    activeTab = name;
    ['sondage', 'actu', 'parti'].forEach(function (k) { $('tab-' + k).hidden = k !== name; });
    Array.prototype.forEach.call(document.querySelectorAll('.tabbar [data-tab]'), function (b) {
      if (b.getAttribute('data-tab') === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (name === 'sondage') { renderPollTab(); $('tab-sondage').scrollTop = 0; }
    if (name === 'actu') { renderActu(); journalSeen = g.turn + ''; $('tab-actu-dot').hidden = true; $('tab-actu').scrollTop = 0; }
    if (name === 'parti') { renderParti(); $('tab-parti').scrollTop = 0; }
    T.notify('tab');
  }
  Array.prototype.forEach.call(document.querySelectorAll('.tabbar [data-tab]'), function (b) {
    b.addEventListener('click', function () { if (g) showTab(b.getAttribute('data-tab')); });
  });
  window.addEventListener('popstate', function () { if (activeTab !== 'carte') showTab('carte', true); });
  // Un bouton « Retour à la carte » toujours visible en haut de chaque onglet
  ['sondage', 'actu', 'parti'].forEach(function (k) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tab-back'; b.textContent = '← Retour à la carte';
    b.addEventListener('click', function () { showTab('carte'); });
    $('tab-' + k).insertBefore(b, $('tab-' + k).firstChild);
  });
  // La vraie hauteur visible de l'écran (évite que le bas passe sous la barre du téléphone)
  function fitHeight() {
    var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-h', Math.round(h) + 'px');
  }
  fitHeight();
  window.addEventListener('resize', fitHeight);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitHeight);
  function ordinal(n) { return n + (n === 1 ? 'er' : 'ᵉ'); }
  function renderPollTab() {
    var poll = E.poll(g), rank = 1 + poll.findIndex(function (x) { return x.pid === me; }), mine = poll[rank - 1];
    var prev = g.history.length ? g.history[g.history.length - 1].filter(function (x) { return x.pid === me; })[0] : null, d = prev ? 100 * (mine.pct - prev.pct) : 0;
    $('pos-card').innerHTML = '<div><span class="pos-k">Ta position</span><b class="pos-rank">' + ordinal(rank) + ' sur ' + poll.length + '</b><span class="pos-k">Les 2 premiers vont au second tour</span></div>' +
      '<div class="pos-right"><b class="pos-pct">' + pctFr(mine.pct, 1) + ' %</b>' + (prev ? '<span class="' + (d >= 0 ? 'up' : 'down') + '">' + (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1).replace('.', ',') + ' pt ce tour</span>' : '') + '</div>';
    var max = poll[0].pct;
    $('poll-list').innerHTML = poll.map(function (x, i) {
      var P = party(x.pid);
      return '<li><button type="button" class="poll-row' + (x.pid === me ? ' me' : '') + '" data-party="' + x.pid + '"><span class="pr-n">' + (i + 1) + '</span><span class="pr-name">' + (x.pid === me ? 'Toi · ' : '') + esc(P.short) + '</span>' +
        '<span class="pr-bar"><i style="width:' + (100 * x.pct / max) + '%;background:' + P.color + '"></i></span><b>' + pctFr(x.pct, 1) + '</b></button></li>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('[data-party]'), function (b) { b.addEventListener('click', function () { partyCard(b.getAttribute('data-party')); }); });
  }
  /* ---------- v3.1 : les traits satiriques ---------- */
  function traitKey(pid) { return E.traitOf(pid); }
  /* L'état du trait pendant la partie (année rêvée, pétales, micro-parti, visibilité, bingo) */
  function traitState(pid) {
    var k = traitKey(pid); if (!k || !g || !g.bingo) return '';
    if (k === 'nostalgie') {
      var n = g.nost[pid] || 0;
      return '<div class="years">' + D.NOSTALGIA.map(function (y, i) { return '<span class="yr' + (i < n ? ' done' : '') + (i === n ? ' next' : '') + (i === D.NOSTALGIA.length - 1 ? ' stone' : '') + '">' + esc(y.year) + '</span>'; }).join('<i>›</i>') + '</div>' +
        '<small class="muted">' + (n === 0 ? 'Pas encore de retour en arrière.' : n >= D.NOSTALGIA.length ? 'La machine est cassée.' : 'Année rêvée : ' + esc(D.NOSTALGIA[n - 1].year) + '. Prochain cran : ' + esc(D.NOSTALGIA[n].year) + '.') + '</small>';
    }
    if (k === 'rose') {
      return '<div class="rose">' + D.PETALS.map(function (pt) {
        var on = g.petals[pt.id];
        return '<span class="petal' + (on ? ' on' : '') + '" title="' + esc(pt.name) + '">' + (on ? '🌹' : '🥀') + '<small>' + esc(pt.name) + (on || !pt.to ? '' : ' → ' + esc(E.sigle(pt.to))) + '</small></span>';
      }).join('') + '</div><small class="muted">' + E.petalsCount(g) + ' pétales sur ' + D.PETALS.length + (g.roseBloom ? ' · la rose a refleuri' : '') + '.</small>';
    }
    if (k === 'centre') return g.micro ? '<p class="trait-now">🐣 « <b>' + esc(g.micro.name) + '</b> » grignote des voix aux trois partis du centre. Qui va payer pour l\u2019absorber ?</p>' : '<p class="muted">Pas de micro-parti en ce moment.' + (g.microDone ? ' (' + g.microDone + ' absorbé' + (g.microDone > 1 ? 's' : '') + ')' : '') + '</p>';
    if (k === 'transparent') return g.hidden ? '<p class="trait-now">🔍 <b>Avis de recherche</b> : tu es transparent ce tour.</p>' : g.eclatUntil >= g.turn ? '<p class="trait-now">🎥 Les caméras sont là jusqu\u2019au tour ' + g.eclatUntil + '.</p>' : '<p class="muted">On te voit, pour l\u2019instant.</p>';
    if (k === 'disque') {
      return '<div class="bingo">' + D.BINGO.map(function (w, i) { return '<span class="bc' + (g.bingo.ticks[i] ? ' on' : '') + '">' + (w.th ? th(w.th).icon + ' ' : '') + esc(w.w) + '</span>'; }).join('') + '</div>' +
        '<small class="muted">' + g.bingo.lines + ' bingo' + (g.bingo.lines > 1 ? 's' : '') + ' depuis le début' + (g.bingo.zapUntil >= g.turn ? ' · <b>les indécis zappent</b> jusqu\u2019à la fin du tour ' + g.bingo.zapUntil : '') + '.</small>';
    }
    return '';
  }
  function traitHtml(pid, withState) {
    var k = traitKey(pid); if (!k) return '';
    var t = D.TRAITS[k];
    return '<div class="trait-box"><div class="trait-h">' + t.icon + ' <b>' + esc(t.name) + '</b></div>' + (withState ? traitState(pid) : '') +
      '<p><b>👍</b> ' + esc(t.plus) + '</p><p><b>👎</b> ' + esc(t.minus) + '</p><p class="trait-learn">💡 ' + esc(t.learn) + '</p></div>';
  }
  /* 🌹 La primaire du Parti Survivant (quand c'est toi) */
  function showPrimaire(then) {
    var can = D.PETALS.filter(function (pt) { return g.petals[pt.id] && pt.to; });
    var html = '<div class="learn">' + A.portrait(me) + '<p>Les courants du parti exigent un grand débat interne. Encore. Comme à chaque fois.</p></div><div class="pick">' +
      '<button type="button" class="pick-row" data-p="0"><span class="pick-i">🗣️</span><span class="pick-txt"><b>Laisser débattre</b><small>Tout le monde garde sa place, mais tu n\u2019as que 2 actions ce tour.</small></span></button>' +
      '<button type="button" class="pick-row" data-p="1"><span class="pick-i">✂️</span><span class="pick-txt"><b>Trancher</b><small>' + (can.length ? 'Tu gardes tes 3 actions, mais un courant claque la porte : un pétale part, avec ' + R.primaireCut + ' soutiens, chez un voisin.' : 'Plus personne ne peut partir… mais la séance coûte 2 ★.') + '</small></span></button></div>';
    modal({ kicker: '🌹 Primaire perpétuelle', title: 'Le parti se déchire', html: html, buttons: [],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-p]'), function (b) {
          b.addEventListener('click', function () {
            var res = E.resolvePrimaire(g, +b.getAttribute('data-p'));
            render();
            modal({ kicker: 'Primaire', title: res.choice === 0 ? 'Débat interminable' : 'Porte claquée', html: '<p>' + esc(res.text) + '</p>', buttons: [{ label: 'Continuer', primary: true, onClick: then }] });
          });
        });
      } });
  }
  function partyCard(pid) {
    var P = party(pid), regs = D.REGIONS.filter(function (r) { return g.regions[r.id].controller === pid; });
    modal({ kicker: P.family, title: pid === me ? 'Toi · ' + P.name : P.name,
      html: '<div class="cand-line">' + A.portrait(pid) + '<div><b class="cand-name">' + esc(P.candidate) + '</b><span>' + esc(P.candTitle) + '</span></div></div>' + axisHtml(pid) +
        '<p><b>Régions tenues :</b> ' + (regs.length ? regs.map(function (r) { return esc(r.name); }).join(', ') : 'aucune') + '</p>' +
        '<p><b>Force :</b> ' + esc(P.force) + '</p><p><b>Faiblesse :</b> ' + esc(P.weakness) + '</p>' + traitHtml(pid, true) + (pid !== me ? '<p class="muted">Débat : tempérament ' + esc(D.TEMPERS[pid].label) + '.</p>' : '') });
  }
  var lastJournal = '';
  function renderActu() {
    $('actu-body').innerHTML = (lastPaper ? '<button type="button" class="btn" id="actu-une">📰 Revoir la une du jour</button>' : '') + (g.news ? newsHtml(g.news) : '') + (lastJournal ? '<div class="actu-pages">' + lastJournal + '</div>' : '');
    var b = $('actu-une'); if (b) b.addEventListener('click', function () { showPaper(lastPaper, 'Retour à la carte', null); });
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
    var rk = 1 + E.poll(g).findIndex(function (x) { return x.pid === me; });
    $('tab-sondage-label').textContent = 'Sondage · ' + ordinal(rk);
    if (activeTab === 'sondage' || isDesk()) renderPollTab();
    if (isDesk() && rightTab === 'parti' && !$('tab-parti').hidden) renderParti();
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
      var name = x.pid === '_autres' ? (x.n ? x.n + ' autres' : 'Autres') : x.pid === me ? 'Toi' : E.sigle(x.pid);
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
      var p = svg('path', { d: M.regions[r.id].d, class: 'reg' + (T.pulseRegion() === r.id ? ' tuto-pulse' : ''), fill: fill, tabindex: 0, role: 'button', 'aria-label': r.name, 'data-rid': r.id });
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
      var ctl = g.regions[r.id].controller;
      var label = abstMode ? pctFr(E.regionVoters(g, r.id).abst) + '%' : ctl === me ? 'Toi' : ctl ? E.sigle(ctl) : '—';
      if (!abstMode && ctl) gb.setAttribute('class', 'badge badge-owner' + (ctl === me ? ' badge-me' : ''));
      var bw = Math.max(26, 7 * label.length + 6);   // v3.0 : les sigles de 4 ou 5 lettres (MoDem)
      gb.appendChild(svg('rect', { x: m.x - bw / 2, y: m.y - 8, width: bw, height: 15, rx: 7.5 }));
      var t = svg('text', { x: m.x, y: m.y + 3.5 }); t.textContent = label; gb.appendChild(t);
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
  /* v1.8 : la fiche de la région, en version courte. Le détail (soucis, forces, calcul) s'ouvre dans « Détails ». */
  function rankIn(rid, pid) {
    var mine = E.cubes(g, rid, pid);
    return 1 + g.players.filter(function (p) { return p.id !== pid && E.cubes(g, rid, p.id) > mine; }).length;
  }
  function renderRegion() {
    var box = $('region-info');
    if (!selected) {
      var ol = objLine(me);
      box.innerHTML = '<div class="region-head"><h2 class="region-name">Touche une région</h2></div>' +
        '<button type="button" class="linkbtn obj-line" id="btn-obj">🎯 Objectif : ' + esc(ol.o.name) + ' · <b>' + ol.pr.done + '/' + ol.pr.need + '</b></button>';
      $('btn-obj').addEventListener('click', function () { showTab('parti'); });
      return;
    }
    var r = E.REG[selected], reg = g.regions[selected], c = reg.controller;
    var tag = c === me ? '<span class="stamp">À toi</span>'
      : c ? '<span class="tag" style="background:' + party(c).color + ';color:' + party(c).ink + '">' + c + '</span>'
      : '<span class="tag tag-yellow">À prendre</span>';
    var v = E.regionVoters(g, selected), echo = E.echoBonus(g, me, selected), rk = rankIn(selected, me), n = E.cubes(g, selected, me);
    box.innerHTML = '<div class="region-head"><h2 class="region-name">' + esc(r.name) + '</h2>' +
      (echo > 0 ? '<span class="chip chip-good">❤️ De cœur</span>' : echo < 0 ? '<span class="chip chip-bad">👎 Hostile</span>' : '') + tag + '</div>' +
      '<div class="region-line"><span>' + mio(v.ins) + ' M inscrits · ' + pctFr(v.abst) + ' % d\'abstention · tu es <b>' + rk + (rk === 1 ? 'er' : 'ᵉ') + '</b> ici (' + n + ' soutien' + (n > 1 ? 's' : '') + ')</span>' +
      '<button type="button" class="linkbtn" id="btn-reg-more">Détails</button></div>' +
      '<div class="region-concerns"><span>Ce qui les préoccupe :</span>' + concernsHtml(selected) + '</div>';
    $('btn-reg-more').addEventListener('click', regionDetails);
  }
  function regionDetails() {
    if (!selected) return;
    var r = E.REG[selected];
    var html = '<div class="chips"><span class="chips-k">Soucis</span>' + r.concerns.map(function (x) { return '<span class="chip chip-theme' + (E.isHot(g, x) ? ' hot' : '') + '">' + th(x).icon + ' ' + esc(th(x).short) + (E.isHot(g, x) ? ' 🔥' : '') + '</span>'; }).join('') + '</div>';
    var real = !!g.weight;   // v3.2 : en Réaliste, chaque soutien pèse selon le score historique du parti ici
    if (real) {
      var ln = E.regionLean(g.base, selected), myW = E.weight(g, selected, me);
      html += '<div class="calc-line">🧭 <b>' + esc(ln.label) + '</b> · gauche ' + Math.round(100 * ln.g) + ' % · centre ' + Math.round(100 * ln.c) + ' % · droite ' + Math.round(100 * ln.d) + ' % <span class="muted">(' + esc(D.BASES[g.base].short) + ')</span><br>' +
        (myW >= 1.15 ? '💪 Terrain favorable : chacun de tes soutiens pèse lourd ici.' : myW <= 0.6 ? '🪶 Terrain difficile : tes soutiens pèsent peu ici, ton électorat historique y est faible.' : '⚖️ Tes soutiens pèsent normalement ici.') + '</div>';
    }
    var sh = real ? E.regionShares(g, selected) : null;
    var rows = g.players.filter(function (p) { return E.cubes(g, selected, p.id) > 0; }).sort(function (a, b) { return real ? sh[b.id] - sh[a.id] : E.cubes(g, selected, b.id) - E.cubes(g, selected, a.id); });
    if (real) rows = rows.slice(0, 6);
    html += '<div class="kicker">Qui mène ici</div><div class="brief">' + rows.map(function (p, i) {
      var nn = E.cubes(g, selected, p.id), bar = real ? Math.min(100, 100 * sh[p.id] / Math.max(0.01, sh[rows[0].id])) : 10 * nn;
      return '<div class="vote-row' + (p.id === me ? ' qual' : '') + '"><span class="vote-lbl">' + chip(p.id) + (p.id === me ? 'Toi' : esc(party(p.id).short)) + '</span><span class="vote-bar"><i style="width:' + bar + '%;background:' + party(p.id).color + '"></i></span><b>' + (real ? Math.round(100 * sh[p.id]) + ' %' : nn) + '</b></div>';
    }).join('') + '</div>';
    var c = g.regions[selected].controller, need = 0;
    if (c !== me) {
      if (real) {
        var topS = 0; g.players.forEach(function (p) { if (p.id !== me) topS = Math.max(topS, E.strength(g, selected, p.id)); });
        var mw = E.weight(g, selected, me), byStr = Math.floor((topS - E.strength(g, selected, me)) / mw) + 1;
        need = Math.max(E.minControl(me) - E.cubes(g, selected, me), byStr);
      } else { var top = rows.length ? E.cubes(g, selected, rows[0].id) : 0; need = Math.max(E.minControl(me), top + 1) - E.cubes(g, selected, me); }
    }
    if (need > R.maxCubes - E.cubes(g, selected, me)) html += '<p>Prendre cette région est <b>hors de portée</b> pour l\u2019instant. Chaque soutien compte quand même pour tes voix.</p>';
    else if (need > 0) html += '<p>Il te manque <b>' + need + ' soutien' + (need > 1 ? 's' : '') + '</b> pour prendre la région (au moins ' + E.minControl(me) + ' et être devant tout le monde).</p>';
    if ((g.bases[selected] || []).indexOf(me) >= 0) html += '<p>👥 Tes militants sont implantés ici : +1 électeur par tour.</p>';
    var bd = E.terrainBreakdown(g, me, selected, theme), room = R.maxCubes - E.cubes(g, selected, me);
    html += '<div class="calc-line">📣 Meeting ici : ' + bd.parts.map(function (x, i) { return (i ? (x.n >= 0 ? ' + ' : ' − ') : '') + esc(x.label) + ' <b>' + (i ? Math.abs(x.n) : x.n) + '</b>'; }).join('') +
      ' = <b>' + bd.total + ' soutien' + (bd.total > 1 ? 's' : '') + '</b>' + (E.poachTarget(g, me, selected, true) ? ' <span class="muted">· et peut-être 1 électeur pris à un parti voisin</span>' : '') + (room < bd.total ? ' <span class="calc-warn">(plafond : +' + Math.max(0, room) + ' seulement)</span>' : '') + '</div>';
    var mk = E.markerAt(g, selected);
    if (mk) html += '<div class="mk-line">' + mk.icon + ' ' + esc(mk.title) + ' : ici, ' + th(mk.theme).icon + ' ' + esc(th(mk.theme).name) + ' compte comme à la une.</div>';
    modal({ kicker: 'Région', title: r.name, html: html, buttons: [{ label: 'Qui vit ici ?', onClick: function () { popModal(selected); } }, { label: 'Fermer', primary: true }] });
  }
  function renderQueue() {
    var box = $('queue-slots'); box.innerHTML = '';
    for (var i = 0; i < R.actionsPerTurn; i++) {
      var a = queue[i];
      if (!a && i >= E.actionsFor(g, me)) { box.appendChild(el('div', { class: 'slot slot-lock', title: 'Perdue à cause de la primaire' }, '🌹 Primaire')); continue; }
      if (!a) { box.appendChild(el('div', { class: 'slot' }, 'Action ' + (i + 1))); continue; }
      var name = a.type === 'card' ? D.CARDS[a.card].name : D.ACTIONS[a.type].name;
      var sub = (a.theme ? th(a.theme).icon + ' ' : '') + (a.region ? SHORT[a.region] : a.target ? a.target : a.theme ? th(a.theme).short : '✕ retirer');
      var b = el('button', { class: 'slot full' + (i === justAdded ? ' flip' : ''), type: 'button', 'aria-label': 'Retirer ' + name },
        '<span class="slot-in"><span class="face front">' + esc(name) + '<small>' + sub + '</small></span><span class="face back" aria-hidden="true">★</span></span>');
      (function (idx) { b.addEventListener('click', function () { queue.splice(idx, 1); render(); }); })(i);
      box.appendChild(b);
    }
    justAdded = -1;
    var maxA = E.actionsFor(g, me);
    $('btn-validate').textContent = queue.length < maxA ? 'Valider ' + queue.length + '/' + maxA : 'Valider';
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
        if (!r) return 'des soutiens dans 1 région';
        n = E.terrainCubes(g, me, r, act.theme); return '<b>+' + n + ' soutien' + (n > 1 ? 's' : '') + '</b> ici';
      case 'medias':
        if (!r) return 'des soutiens dans 3 régions';
        n = 0; E.mediaRegions(g, me, r, act.theme).forEach(function (rid) { n += E.mediaCubes(g, me, rid, act.theme); });
        return '<b>+' + n + ' soutien' + (n > 1 ? 's' : '') + '</b> · 3 régions';
      case 'mobiliser':
        if (!r) return 'fais voter des abstentionnistes';
        n = E.mobilizeGain(g, me, r); return '<b>+' + n.n + ' soutien' + (n.n > 1 ? 's' : '') + '</b> · des abstentionnistes vont voter';
      case 'reseaux': return 'dé : <b>−1 à +' + (4 + (E.isHot(g, act.theme) ? 1 : 0)) + '</b> soutiens';
      case 'imposer': return 'ton thème <b>à la une</b>';
      case 'contre': return 'rival en tête <b>−2 soutiens</b> · +1 🍳';
      case 'militants': return '<b>+1 soutien</b> ici à chaque tour · ' + (R.militantsMax - mePl().militants) + ' équipe' + (R.militantsMax - mePl().militants > 1 ? 's' : '') + ' dispo';
      case 'fonds': return '<b>+' + E.fundsGain(me).money + ' €' + (E.fundsGain(me).infl ? ' +' + E.fundsGain(me).infl + ' ★' : '') + '</b>';
      case 'nostalgie': {
        var k0 = g.nost[me] || 0;
        if (k0 >= D.NOSTALGIA.length) return 'la machine est cassée';
        var step = D.NOSTALGIA[k0];
        if (k0 === D.NOSTALGIA.length - 1) return 'retour à <b>' + esc(step.year) + '</b> : fou rire général, −1 soutien dans 3 régions';
        if (!r) return 'retour en <b>' + esc(step.year) + '</b> · choisis d\u2019abord une région';
        var pv = E.nostalgiaPreview(g, me, r), gainN = Math.max(0, R.nostalgieGain[k0] + (E.retireeRegion(r) ? 1 : 0) - (pv.war ? 1 : 0)), yth = R.nostalgieYouth[k0];
        return 'retour en <b>' + esc(step.year) + '</b> (' + esc(step.what) + ') : <b>+' + gainN + '</b> ici' + (E.retireeRegion(r) ? ' (retraités ❤️)' : '') + (pv.war ? ' · guerre des nostalgies' : '') + (yth ? ' · les jeunes fuient : −1 dans ' + yth + ' région' + (yth > 1 ? 's' : '') : ''); }
      case 'rappel': {
        var lp = E.lostPetals(g)[0];
        return lp ? Math.round(R.rappelChance * 100) + ' % : ' + esc(lp.name) + ' reviennent (+' + R.rappelSwing + ' soutiens' + (lp.to ? ' repris à ' + esc(party(lp.to).short) : '') + ') · sinon un livre, <b>+' + R.rappelCas + ' 🍳</b>' : 'la rose est complète'; }
      case 'fusion': return g.micro ? 'absorbe « ' + esc(g.micro.name) + ' » : <b>+1 soutien</b> dans ' + R.fusionGain + ' régions' : 'aucun micro-parti à absorber';
      case 'eclat': return '<b>+1 soutien</b> dans ' + R.eclatGain + ' régions · les caméras reviennent ' + R.eclatTurns + ' tours';
      case 'reforme':
        if (!r) return '+1 soutien dans des régions';
        if (g.regions[r].controller !== me) return 'région à toi requise';
        return '<b>+1 soutien</b> rég. ' + PROF_PLURAL[E.REG[r].profile];
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
      var b = el('button', { class: 'tile', type: 'button', 'data-act': type, 'aria-label': def.name + ', ' + costLabel(act) },
        '<span class="tile-n">' + def.name + '</span><span class="tile-mid"><span class="tile-i">' + def.icon + '</span><span class="tile-big">' + big + '</span></span>' +
        (selected && tiring(act) && !canQueue(act) ? '<span class="tile-cost tile-warn">⚠️ risque de gaffe</span>' : '<span class="tile-cost">' + costLabel(act, true) + '</span>'));
      if (!selected) b.disabled = true;
      else if (canQueue(act)) b.classList.add('dim');
      b.addEventListener('click', function () { addAction(act); });
      box.appendChild(b);
    });
    var more = el('button', { class: 'tile tile-more', type: 'button', id: 'btn-more' }, '<span class="tile-n">Plus</span><span class="tile-mid"><span class="tile-big">⋯</span></span><span class="tile-cost">' + (traitKey(me) ? D.TRAITS[traitKey(me)].icon + ' + 7 actions' : '7 actions') + '</span>');
    more.addEventListener('click', moreMenu);
    box.appendChild(more);
  }
  function bigGain(act) {
    if (act.type === 'mobiliser') return E.mobilizeGain(g, me, act.region).n;
    if (act.type === 'terrain') return E.terrainCubes(g, me, act.region, act.theme);
    var n = 0; E.mediaRegions(g, me, act.region, act.theme).forEach(function (rid) { n += E.mediaCubes(g, me, rid, act.theme); }); return n;
  }
  /* Les autres actions, dans une fenêtre où l'on a la place de les expliquer */
  /* v3.1 : une ligne courte par action ; le détail arrive ensuite dans le journal */
  var MORE_SHORT = {
    reseaux: 'Un coup de dé sur les réseaux', militants: '+1 soutien ici à chaque tour', imposer: 'Ton thème à la une demain',
    contre: 'Affaiblir le rival en tête ici', fonds: 'Remplir la caisse', reforme: 'Gagner les régions du même type',
    nostalgie: 'Promettre le retour du passé', rappel: 'Faire revenir d\u2019anciens électeurs', fusion: 'Absorber le micro-parti', eclat: 'Faire revenir les caméras',
    marche_pop: 'Grosse mobilisation en ville', censure: 'Tous tes rivaux perdent 1 ★', fete_rose: 'Fête dans 2 régions', primaire: 'Gagner de l\u2019influence',
    climat: 'Grosse mobilisation verte', canicule: 'Tous tes rivaux reculent', art493: 'Bloquer le rival en tête', remaniement: 'Déplacer tes soutiens ici',
    appel18: 'Toutes les régions historiques', rassemblement: 'Argent et influence', plateau_tele: 'Passer à la télé dans 3 régions', grand_meeting: 'Gros meeting ici'
  };
  function moreMenu() {
    if (g.phase !== 'actions') return;
    var items = [];
    ['reseaux', 'militants', 'imposer', 'contre', 'fonds', 'reforme'].forEach(function (type) {
      var def = D.ACTIONS[type], act = { type: type, region: def.target === 'region' ? selected : undefined, theme: def.theme ? theme : undefined };
      var err = def.target === 'region' && !selected ? 'choisis d\'abord une région' : canQueue(act);
      items.push({ act: act, icon: def.icon, name: def.name, cost: costLabel(act), fx: MORE_SHORT[type], err: err });
    });
    Object.keys(D.ACTIONS).forEach(function (type) {   // v3.1 : les actions propres à ton parti
      var def = D.ACTIONS[type]; if (!def.only || def.only.indexOf(me) < 0) return;
      var act = { type: type, region: def.target === 'region' ? selected : undefined };
      var err = def.target === 'region' && !selected ? 'choisis d\u2019abord une région' : canQueue(act);
      items.unshift({ act: act, icon: def.icon, name: def.name, cost: costLabel(act), fx: MORE_SHORT[type], err: err, mine: true });
    });
    mePl().cards.forEach(function (k) {
      var def = D.CARDS[k], act = { type: 'card', card: k, region: def.target === 'region' ? selected : undefined };
      var err = def.target === 'region' && !selected ? 'choisis d\'abord une région' : canQueue(act);
      items.push({ act: act, icon: '🃏', name: def.name, cost: 'carte unique', fx: MORE_SHORT[k] || esc(def.text), err: err });
    });
    items.push({ special: 'enquete', icon: '🔎', name: 'Enquêter sur un rival', cost: costLabel({ type: 'enquete', target: null }),
      fx: 'Fouiller le passé d\u2019un rival', err: g.turn >= R.maxTurns ? 'trop tard pour sortir un dossier' : null });
    var html = '<div class="pick">' + items.map(function (it, i) {
      return '<button type="button" class="pick-row' + (it.err ? ' off' : '') + (it.mine ? ' mine' : '') + '" data-i="' + i + '"><span class="pick-i">' + it.icon + '</span>' +
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
    if (queue.length < E.actionsFor(g, me) && !T.isActive()) {
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
    pressLog = log; pressBefore = before;   // v2.2 : le journal de demain racontera ce tour
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
  /* v2.1 : le flash info façon chaîne d'info. À l'écran : la carte des régions qui changent de main,
     UN gros titre, deux brèves au plus et le bandeau des sondages qui défile. Le reste s'ouvre avec « Tout le détail ». */
  function showFlash(log, before, ctrl0, allies0) {
    var f = flashData(log, before, ctrl0, allies0);
    var after = E.isDebateTurn(g) ? debate : spotlight;
    var contLabel = E.isDebateTurn(g) ? 'Place au débat 🎙️' : 'Fin du tour';
    function cont() { handleOffers(after); }
    function open() {
      modal({ kicker: 'Tour ' + g.turn + ' · 20 h', title: 'Flash info', cls: 'tv-modal', html: tvHtml(f),
        buttons: [{ label: contLabel, primary: true, onClick: cont }, { label: 'Tout le détail', onClick: detail }] });
    }
    function detail() {
      modal({ kicker: 'Flash info · tour ' + g.turn, title: 'Le détail de la soirée', html: flashDetail(f, log),
        buttons: [{ label: contLabel, primary: true, onClick: cont }, { label: '‹ Revenir au direct', onClick: open }] });
    }
    open();
  }
  function who(pid) { return pid === me ? 'Toi' : party(pid).short; }
  /* Les gros titres de la soirée, du plus important au moins important */
  function flashData(log, before, ctrl0, allies0) {
    var heads = [], changed = [];
    pressChanges = [];
    D.REGIONS.slice().sort(function (a, b) { return b.pts - a.pts; }).forEach(function (r) {
      var c0 = ctrl0[r.id], c1 = g.regions[r.id].controller;
      if (c0 === c1) return;
      changed.push(r.id); pressChanges.push({ rid: r.id, from: c0, to: c1 });
      var nm = r.id === 'cor' ? 'l\'outre-mer' : r.name;
      if (c1) heads.push({ w: r.pts + (c1 === me || c0 === me ? 20 : 0), me: c1 === me || c0 === me, t: (c1 === me ? 'Tu prends ' : party(c1).short + ' prend ') + nm + (c0 ? (c0 === me ? ' : tu la perds' : ' à ' + party(c0).short) : '') });
      else heads.push({ w: r.pts / 2 + (c0 === me ? 20 : 0), me: c0 === me, t: nm + ' : ' + (c0 === me ? 'tu perds' : party(c0).short + ' perd') + ' le contrôle' });
    });
    var fails = log.filter(function (l) { return l.pid === me && !l.ok && !l.gaffe; });
    if (fails.length) heads.push({ w: 16, me: true, t: '❌ ' + (fails.length > 1 ? fails.length + ' de tes actions échouent' : 'Ton action « ' + fails[0].action + ' » échoue') });
    log.filter(function (l) { return l.gaffe; }).forEach(function (l) { heads.push({ w: 15, me: l.pid === me, t: '😬 Gaffe de ' + who(l.pid) + (l.region ? ' en ' + SHORT[l.region] : '') }); });
    Object.keys(g.alliances).forEach(function (pid) {
      var o = g.alliances[pid];
      if (pid < o && allies0[pid] !== o) heads.push({ w: 14, t: '🤝 Alliance ' + who(pid) + ' – ' + who(o) });
    });
    log.filter(function (l) { return l.credUp && l.pid === me; }).forEach(function (l) { heads.push({ w: 9, me: true, t: '📈 Tu deviens crédible sur ' + th(l.credUp).name }); });
    heads.sort(function (a, b) { return b.w - a.w; });
    var poll = E.poll(g).map(function (x) { return { pid: x.pid, pct: x.pct, d: (x.pct - (before[x.pid] || 0)) * 100 }; });
    var rank = 1 + poll.findIndex(function (x) { return x.pid === me; });
    return { heads: heads, changed: changed, poll: poll, rank: rank, mine: poll[rank - 1] };
  }
  function arrow(d) { return d >= 0.5 ? '<i class="up">▲ ' + d.toFixed(1).replace('.', ',') + '</i>' : d <= -0.5 ? '<i class="down">▼ ' + (-d).toFixed(1).replace('.', ',') + '</i>' : '<i>=</i>'; }
  function tvHtml(f) {
    var map = '<svg class="tv-map" viewBox="0 0 370 357" aria-hidden="true">' + D.REGIONS.map(function (r) {
      var on = f.changed.indexOf(r.id) >= 0, c = g.regions[r.id].controller;
      return '<path d="' + M.regions[r.id].d + '" class="' + (on ? 'tv-hit' : '') + '" fill="' + (on ? (c ? party(c).color : '#8E8AA8') : '#3A3656') + '"/>';
    }).join('') + '</svg>';
    var top = f.heads[0], rest = f.heads.slice(1, 3);
    var ticker = f.poll.map(function (x) { return '<span class="' + (x.pid === me ? 'me' : '') + '">' + (x.pid === me ? 'TOI' : esc(party(x.pid).short.toUpperCase())) + ' ' + pctFr(x.pct) + ' % ' + arrow(x.d) + '</span>'; }).join('<b>•</b>');
    return '<div class="tv"><div class="tv-top"><span class="tv-live">● DIRECT</span><span class="tv-ch">INFO-CONTINU</span><span class="tv-clock">20:00</span></div>' +
      '<div class="tv-studio">' + map + (f.changed.length ? '<span class="tv-count">' + f.changed.length + ' région' + (f.changed.length > 1 ? 's' : '') + '<br>bascule' + (f.changed.length > 1 ? 'nt' : '') + '</span>' : '') + '</div>' +
      '<div class="tv-lower"><span class="tv-tag">FLASH INFO</span><span class="tv-head">' + esc(top ? top.t : 'Calme plat : aucune région ne bascule') + '</span></div>' +
      (rest.length ? '<div class="tv-sub">' + rest.map(function (h) { return '<span>' + esc(h.t) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="tv-ticker"><div class="tv-track"><div>' + ticker + '</div><div aria-hidden="true">' + ticker + '</div></div></div></div>' +
      '<div class="tv-me"><span>Ta position</span><b>' + ordinal(f.rank) + '</b><span>' + pctFr(f.mine.pct, 1) + ' %</span>' + arrow(f.mine.d) + '</div>';
  }
  function flashDetail(f, log) {
    var h = '';
    h += '<div class="brief"><div class="kicker">Les titres de la soirée</div>' + (f.heads.length ? f.heads.map(function (x) { return line(x.me ? '👉' : '•', x.me ? '<b>' + esc(x.t) + '</b>' : esc(x.t)); }).join('') : line('•', 'Aucune région ne change de main.')) + '</div>';
    var mineLog = log.filter(function (l) { return l.pid === me; });
    if (mineLog.length) h += '<div class="brief"><div class="kicker">Tes actions</div>' + mineLog.map(function (l) {
      return line(l.gaffe ? '😬' : l.ok ? '✅' : '❌', '<b>' + esc(l.action) + '</b>' + (l.region ? ' · ' + SHORT[l.region] : '') + ' — ' + esc(l.text));
    }).join('') + '</div>';
    h += '<div class="brief"><div class="kicker">Le sondage</div><div class="tv-poll">' + f.poll.map(function (x, i) {
      var P = party(x.pid);
      return '<div class="' + (x.pid === me ? 'me' : '') + '"><span>' + (i + 1) + '</span>' + chip(x.pid) + '<span class="tp-n">' + (x.pid === me ? 'Toi' : esc(P.short)) + '</span><b>' + pctFr(x.pct, 1) + ' %</b>' + arrow(x.d) + '</div>';
    }).join('') + '</div></div>';
    h += '<details class="details"><summary>Ordre de jeu et toutes les actions</summary><p class="hint">Ordre ce tour : ' + E.turnOrder(g).map(function (p) { return p === me ? '<b>toi</b>' : esc(party(p).short); }).join(' → ') + ' (action 1 de chacun, puis 2, puis 3).</p><div class="log">' + log.map(function (l) {
      return '<div class="log-row' + (l.gaffe ? ' gaffe' : l.ok ? '' : ' fail') + '">' + chip(l.pid) + '<span><b>' + esc(l.action) + '</b>' + (l.theme ? ' ' + th(l.theme).icon : '') + (l.region ? ' · ' + SHORT[l.region] : '') + ' — ' + esc(l.text) + '</span></div>';
    }).join('') + '</div></details>';
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
      '<p class="hint">Le vainqueur gagne +' + mult + ' soutien dans 4 régions, le 2e dans 2 régions.' + (grand ? ' <b>Grand débat final : gains doublés !</b>' : '') + '</p>' + learnBox('debat');
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
        '<div class="q-vs">Face à <b>' + esc(party(o).candidate) + '</b> (' + esc(party(o).short) + ') · ' + D.TEMPERS[o].label + '</div></div></div><div class="question-guide"><b>À toi</b><span>Choisis la réplique qui te ressemble le plus.</span></div><div class="debate-pick-label">Ta réponse</div><div class="pick">' +
        ['attaque', 'chiffres', 'emotion', 'esquive'].concat(me === 'FI' ? ['disque'] : []).map(function (key) {
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
      res.rewards.forEach(function (w) { h += '<p>' + chip(w.pid) + ' +' + w.each + ' soutien' + (w.each > 1 ? 's' : '') + ' en ' + w.regions.map(function (x) { return SHORT[x]; }).join(', ') + '</p>'; });
      if (res.bingo) h += '<p>📀 ' + chip('FI') + ' <b>BINGO en direct</b> (« ' + res.bingo.words.map(esc).join(' », « ') + ' ») : les militants s\u2019enflamment' + (res.bingo.regions.length ? ', +1 en ' + res.bingo.regions.map(function (x) { return SHORT[x]; }).join(', ') : '') + '. Les indécis, eux, zappent.</p>';
      modal({ kicker: 'Débat', title: !res.winner ? 'Égalité en tête' : res.winner === me ? 'Tu remportes le débat !' : party(res.winner).short + ' remporte le débat', html: h,
              buttons: [{ label: 'Fin du tour', primary: true, onClick: spotlight }] });
    }
  }

  function spotlight() {
    var t = E.spotlightTarget(g);
    if (!t) return finishTurn(null);
    if (t === me) {
      var can = mePl().infl >= R.spotlightCost;
      modal({ kicker: 'Sous les projecteurs', title: 'Tu es en tête des sondages !', html: '<p>Les médias fouillent ton passé. Paie <b>2 ★</b> pour étouffer l\'affaire, ou perds 1 soutien dans tes 2 plus grandes régions.</p>',
        buttons: [{ label: 'Payer 2 ★', primary: true, disabled: !can, onClick: function () { finishTurn(E.applySpotlight(g, me, true)); } },
                  { label: 'Perdre 2 soutiens', onClick: function () { finishTurn(E.applySpotlight(g, me, false)); } }] });
    } else finishTurn(E.applySpotlight(g, t, AI.paySpotlight(g, t)));
  }

  function finishTurn(spot) {
    var res = E.endTurn(g); render();
    if (spot && !spot.paid && spot.pid !== me) toast(party(spot.pid).short + ' sous les projecteurs : −1 soutien en ' + spot.regions.map(function (x) { return SHORT[x]; }).join(', '));
    else if (spot && spot.paid && spot.pid !== me) toast(party(spot.pid).short + ' paie 2 ★ pour éviter le scandale');
    if (res.over) return electionNight();
    if (res.between) return betweenScreen();
    if (g.turn === 1 && tutoGame) {
      tutoGame = false;
      // v2.0 : une récompense courte à la place du long « Bon à savoir »
      var poll = E.poll(g), rank = 1 + poll.findIndex(function (x) { return x.pid === me; }), mine = poll[rank - 1];
      var held = D.REGIONS.filter(function (r) { return g.regions[r.id].controller === me; }).length;
      return modal({ kicker: 'Tour 1 bouclé', title: rank <= 2 ? 'Bien joué !' : 'C\'est parti !', cls: 'reward', html:
        '<div class="reward-big"><b>' + ordinal(rank) + '</b><span>au sondage · ' + pctFr(mine.pct, 1) + ' %</span></div>' +
        '<div class="learn">' + A.advisor() + '<p>' + (rank <= 2 ? 'Tu es dans les 2 premiers : tu irais au second tour. Tiens bon jusqu\'au tour 8 !' : 'Objectif : finir dans les 2 premiers au tour 8 pour aller au second tour.') +
        (held ? ' Tu tiens déjà ' + held + ' région' + (held > 1 ? 's' : '') + '.' : '') + ' Je te glisse un conseil à chaque tour.</p></div>',
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
    clearSave();   // v2.8 : la campagne est finie
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

  var endMore = [];
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-more]'); if (!b) return;
    var m = endMore[+b.getAttribute('data-more')]; if (m) modal({ kicker: 'Résultats', title: m.label, html: m.html });
  });
  function endGame() {
    $('toast').hidden = true;
    var res = g.result, win = g.winner;
    $('end-kicker').textContent = 'Soirée électorale';
    $('end-title').textContent = win === me ? 'Tu es élu !' : 'Perdu…';
    $('end-sub').textContent = party(win).name + (res.direct ? ' l\'emporte dès le premier tour.' : ' remporte le second tour.');
    function turnoutLine(st) { return st ? '<p class="turnout">Participation ' + pctFr(st.participation, 1) + ' % · ' + mio(st.votants) + ' millions de votants, dont ' + pctFr(st.blankPct, 1) + ' % de blancs et nuls</p>' : ''; }
    // v2.1 : à l'écran, seulement le résultat. Le détail s'ouvre d'un toucher.
    var h = '', more = [];
    if (res.second) {
      var s = res.second;
      h += '<div class="kicker">Second tour</div>' + bars([{ pid: s.a, pct: s.pctA }, { pid: s.b, pct: s.pctB }].sort(function (x, y) { return y.pct - x.pct; }), Math.max(s.pctA, s.pctB));
    }
    var top = res.first.slice(0, 3), meRow = res.first.filter(function (x) { return x.pid === me; })[0];
    var meRank = 1 + res.first.indexOf(meRow);
    h += '<div class="kicker" style="margin-top:12px">Premier tour</div>' + bars(top, res.first[0].pct) +
      (meRank > 3 ? '<p class="end-me">Toi : <b>' + ordinal(meRank) + '</b> avec ' + pctFr(meRow.pct, 1) + ' %</p>' : '');
    more.push({ icon: '📊', label: 'Premier tour complet', sub: 'Les ' + res.first.length + ' partis et la participation',
      html: turnoutLine(res.stats1) + bars(res.first, res.first[0].pct) });
    if (res.second) {
      more.push({ icon: '🔁', label: 'Les reports de voix', sub: 'Qui a appelé à voter pour qui',
        html: turnoutLine(s.stats) + '<div class="transfers">' + s.transfers.map(function (t) {
          var d = t.deal ? ' · 🤝 accord (« ' + esc(E.measure(t.deal.measure).name) + ' »)' : '';
          return '<p>' + chip(t.pid) + '<b>' + (t.consigne === 'A' ? 'Consigne : ' + esc(E.sigle(s.a)) : t.consigne === 'B' ? 'Consigne : ' + esc(E.sigle(s.b)) : 'Aucune consigne') + '</b>' + d + ' → ' + Math.round(100 * t.toA) + ' % ' + s.a + ', ' + Math.round(100 * t.toB) + ' % ' + s.b + ', ' + Math.round(100 * t.blank) + ' % blanc, ' + Math.round(100 * t.abst) + ' % abstention</p>';
        }).join('') + (res.othersTransfer ? '<p><span class="who" style="background:#C6C9BF">…</span>Autres listes : ' + Math.round(100 * res.othersTransfer.toA) + ' % → ' + s.a + ', ' + Math.round(100 * res.othersTransfer.toB) + ' % → ' + s.b + ', ' + Math.round(100 * res.othersTransfer.abstTotal) + ' % blanc ou abstention</p>' : '') +
          (s.mob.a || s.mob.b ? '<p>🚪 Mobilisation : ' + E.sigle(s.a) + ' ×' + s.mob.a + ', ' + E.sigle(s.b) + ' ×' + s.mob.b + ' (+' + pctFr(R.round2.mobilize, 1) + ' % des suffrages à chaque fois)</p>' : '') +
          s.notes.map(function (n) { return '<p>' + chip(n.pid) + esc(n.text) + '</p>'; }).join('') + '</div>' });
    }
    // v1.5 : du dernier sondage au 1er tour, la seule différence vient des objectifs secrets réussis
    var lastPoll = {}; E.poll(g).forEach(function (x) { lastPoll[x.pid] = x.pct; });
    var myObj = objLine(me);
    more.push({ icon: '🎯', label: 'Les objectifs secrets', sub: 'Le tien : « ' + myObj.o.name + ' », ' + (myObj.met ? 'réussi' : 'raté'),
      html: '<div class="brief">' + res.first.map(function (x) {
        var ol = objLine(x.pid), d = 100 * (x.pct - (lastPoll[x.pid] || 0));
        return line(ol.met ? '🎯' : '·', chip(x.pid) + (x.pid === me ? '<b>Toi</b>' : esc(party(x.pid).short)) + ' : ' + pctFr(lastPoll[x.pid] || 0, 1) + ' % → <b>' + pctFr(x.pct, 1) + ' %</b> ' +
          '<span class="muted">(' + (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1).replace('.', ',') + ' pt · « ' + esc(ol.o.name) + ' » ' + (ol.met ? 'réussi' : 'raté') + ')</span>');
      }).join('') + '<p class="hint" style="margin:6px 0 0">Un objectif réussi ajoute des voix le jour du vote : c\'est la seule différence entre le dernier sondage et le 1er tour.</p></div>' });
    h += '<div class="end-more">' + more.map(function (m, i) {
      return '<button type="button" class="end-row" data-more="' + i + '"><span class="end-i">' + m.icon + '</span><span><b>' + esc(m.label) + '</b><small>' + esc(m.sub) + '</small></span><span class="end-chev">›</span></button>';
    }).join('') + '</div>';
    endMore = more;
    $('end-table').innerHTML = h;
    $('btn-govern').hidden = win !== me;
    $('btn-oppo').hidden = win === me;   // v2.7 : la partie continue dans l'opposition
    go('end');
  }

  /* ---------- Menu & règles ---------- */
  /* v1.8 : l'onglet « Mon parti » (avant : la fenêtre du bouton •••) */
  function renderParti() {
    var pl = mePl(), o = D.OBJECTIVES.filter(function (x) { return x.id === pl.objective; })[0], p = party(me);
    var html = '<div class="cand-line">' + A.portrait(me) + '<div><b class="cand-name">' + esc(p.candidate) + '</b><span>' + esc(p.candTitle) + '</span></div></div>' +
      '<p>' + objLine(me).html + '.</p>' +
      '<div class="brief"><div class="kicker">Ton programme · ' + pl.budget + ' Md€</div>' + pl.programme.map(function (id, i) {
        var m = E.measure(id); return line(i === 0 ? '★' : th(m.theme).icon, esc(m.name) + (i === 0 ? ' <span class="muted">(mesure phare : +1 soutien en Meeting sur ' + esc(th(m.theme).name) + ')</span>' : ''));
      }).join('') + (pl.financing || []).map(function (id) { return line('🏦', esc(E.measure(id).name)); }).join('') +
      line('❤️', 'Régions de cœur : ' + E.echoRanks(g, me).good.map(function (r) { return SHORT[r]; }).join(', ') + ' · 👎 hostiles : ' + E.echoRanks(g, me).bad.map(function (r) { return SHORT[r]; }).join(', ')) + '</div>' +
      '<div class="brief"><div class="kicker">Ton candidat</div>' +
      line('⚡', '<b>Forme ' + pl.forme + ' / ' + R.formeMax + '</b> — Meeting et Télé en coûtent 1. À 0, risque de gaffe. +' + (R.formeRegen + (me === 'EM' ? 1 : 0)) + ' par tour.') +
      line('🍳', '<b>' + pl.cas + ' casserole' + (pl.cas > 1 ? 's' : '') + '</b> — chacune = ' + Math.round(R.affairPerCasserole * 100) + ' % de risque d\'affaire par tour. Attaquer, enquêter, trahir, le 49.3 et certains choix en ajoutent.') +
      line(pl.momentum > 0 ? '↗' : pl.momentum < 0 ? '↘' : '→', pl.momentum > 0 ? '<b>En dynamique</b> : +1 soutien sur tes Meetings.' : pl.momentum < 0 ? '<b>Passage à vide</b> : −1 soutien sur tes Meetings.' : '<b>Dynamique stable.</b> Gagne 1,5 point au sondage en un tour pour être en dynamique.') +
      line('👥', '<b>' + pl.militants + ' / ' + R.militantsMax + ' équipes de militants</b> — chacune rapporte 1 soutien par tour.') +
      '</div><p><b>Force :</b> ' + esc(p.force) + '</p><p><b>Faiblesse :</b> ' + esc(p.weakness) + '</p>' + traitHtml(me, true) + credHtml(me);
    $('parti-body').innerHTML = '<span class="kicker">Ton parti</span><h1 class="h1 tab-title">' + esc(p.name) + '</h1>' + html +
      '<div class="stack parti-btns">' + (g && !g.over && g.phase !== 'between' && turnSnap ? '<button type="button" class="btn btn-ink" id="pb-save">💾 Sauvegarder la partie</button>' : '') + '<button type="button" class="btn" id="pb-lib">📚 Comprendre la politique</button><button type="button" class="btn" id="pb-rules">Règles du jeu</button><button type="button" class="btn btn-ghost" id="pb-quit">Abandonner la partie</button></div>';
    if ($('pb-save')) $('pb-save').addEventListener('click', function () {
      try {
        localStorage.setItem(SAVE, JSON.stringify({ v: 1, when: Date.now(), game: turnSnap, me: me, quick: quickGame, perso: perso, founded: founded, lead: leadOn,
          foundedOn: !!(founded && me === founded.sigle) }));
        renderResume();
        toast('💾 Partie sauvegardée (début du tour ' + turnSnapTurn + '). « Reprendre » sur l\u2019écran d\u2019accueil.');
      } catch (e) { toast('Sauvegarde impossible sur cet appareil.'); }
    });
    $('pb-lib').addEventListener('click', library); $('pb-rules').addEventListener('click', showRules);
    $('pb-quit').addEventListener('click', function () { modal({ title: 'Abandonner la partie ?', html: '<p>Ta campagne sera perdue.</p>', buttons: [{ label: 'Abandonner', primary: true, onClick: function () { clearSave(); go('title'); } }, { label: 'Continuer à jouer' }] }); });
  }
  $('btn-menu').addEventListener('click', function () { showTab(activeTab === 'parti' ? 'carte' : 'parti'); });
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
      '<p><b>But :</b> remporter l\'élection présidentielle à la fin des <b>8 tours de campagne</b>. Chaque région vote selon ses soutiens. Elle pèse ses <b>vrais électeurs</b> : ses inscrits (le chiffre sur la carte, en millions), moins ceux qui s\'abstiennent, moins ceux qui votent blanc ou nul. Le parti qui contrôle une région y gagne un petit bonus.</p>' +
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
        '<li>📣 <b>Meeting</b> (2 €) : des soutiens dans la région. <b>Base</b> de 1 à 4 selon l\'impact du message (de 2 à 5 en campagne éclair), <b>plus les bonus</b> : mesure phare +1, région de cœur +1 (hostile −1), dynamique ±1, et pour le Parti Survivant +1 là où il a déjà 5 soutiens. Le détail s\'affiche quand tu touches une région. Une région compte au plus 10 soutiens par parti.</li>' +
        '<li>📺 <b>Télé</b> (3 € + 1 ★) : ton message passe dans la région et dans les 2 autres régions les plus concernées par le thème. +1 soutien dans chacune (+2 si impact 4, rien si impact 0).</li>' +
        '<li>🚪 <b>Mobiliser</b> (2 €) : du porte-à-porte pour faire voter des abstentionnistes. 1 soutien, +1 avec tes militants, +1 si ton programme parle à ceux qui votent peu ici, +1 si la région s\'abstient beaucoup (3 au plus). Jusqu\'au tour 3, tu fais aussi inscrire de nouveaux électeurs.</li>' +
        '<li>📱 <b>Buzz</b> (1 €, menu Plus) : un coup de dé, de −1 à +4 soutiens. +1 si le thème fait l\'actu.</li>' +
        '<li>🗞️ <b>Faire la une</b> (2 € + 2 ★) : ton thème fera l\'actu au tour suivant… pour tout le monde.</li>' +
        '<li>🥊 <b>Attaquer</b> (2 € + 1 ★) : le rival le plus fort de la région perd 2 soutiens (il faut y avoir 1 soutien).</li>' +
        '<li>💰 <b>Collecte</b> (gratuit) : +3 € dans la caisse.</li>' +
        '<li>📜 <b>Promesse</b> (4 ★) : dans une région que tu tiens, +1 soutien dans toutes les régions du même type.</li>' +
        '<li>👥 <b>Militants</b> (3 €) : une équipe dans la région, +1 soutien à chaque début de tour (3 équipes au plus).</li>' +
        '<li>🃏 2 cartes spéciales par parti.</li></ul>' +
      '<p><b>⚡ La forme du candidat</b> (4 au plus, +2 par tour). Meeting et Télé coûtent 1 ⚡. Si une action la fait tomber à 0, le candidat épuisé peut faire une <b>gaffe</b> (4 chances sur 10) : aucun soutien et une casserole.</p>' +
      '<p><b>↗ La dynamique.</b> Si tu gagnes 1,5 point au sondage en un tour, tes Meetings rapportent 1 soutien de plus au tour suivant. Si tu en perds 1,5, 1 de moins.</p>' +
      '<p><b>Crédibilité qui évolue.</b> Après 3 actions sur un même thème, ta crédibilité dessus augmente (2 au plus). Le bonus compte à partir de l\'action suivante.</p>' +
      '<p><b>🎯 Objectif secret.</b> Chaque parti en reçoit un au hasard (sa progression s\'affiche sous la carte). Réussi à la fin de la campagne, il ajoute environ 3 à 4 % des voix le jour du vote. Ce bonus n\'apparaît pas dans les sondages.</p>' +
      '<p><b>📋 Ton programme.</b> Avant la campagne, choisis 5 mesures. Chacune te rend plus crédible sur son thème. La 1re est ta <b>mesure phare</b> : +1 soutien sur tes Meetings qui en parlent. Il te reste au plus ' + R.budgetCap + ' Md€ à financer : au-delà, le programme est partiellement financé (1 casserole par tranche de ' + R.budgetCasStep + ' Md€) ou non financé, et une affaire tombe au tour 3. Les mesures 💥 choc font parler (+1 soutien dans 2 régions) mais ajoutent une casserole.</p>' +
      '<p><b>💥 Les affaires.</b> Chaque casserole 🍳 donne 12 % de risque d\'affaire par tour. Le Canard Déchaîné en sort aussi de temps en temps, et un rival peut <b>🔎 enquêter</b> sur toi. Quand une affaire tombe, tu choisis ta réaction : nier, t\'excuser, sacrifier un collaborateur ou accuser les médias.</p>' +
      '<p><b>🤔 Les dilemmes.</b> Chaque tour, un parti (à tour de rôle) doit faire un choix. Certains choix ont des <b>conséquences différées</b> qui peuvent ressortir quelques tours plus tard.</p>' +
      '<p><b>Les crises.</b> Chaque partie connaît une crise en 3 actes (krach, grève, été brûlant, désindustrialisation). Les régions touchées sont marquées sur la carte : leur thème y compte comme à la une.</p>' +
      '<p><b>🎙️ Le débat télévisé</b> (tours 3, 6 et 8) : chaque parti affronte 3 adversaires tirés au sort, une question chacun. Choisis ta réplique : 🥊 Attaque bat ❤️ Émotion, ❤️ Émotion bat 📊 Chiffres, 📊 Chiffres bat 🥊 Attaque, 🙃 Esquive = nul. Manche gagnée 2 points, nulle 1. Bonus : 🥊 +1 si le rival a des casseroles, 📊 +1 sur ton point fort (−1 si ce n\'est pas ton sujet), ❤️ +1 si le thème fait l\'actu. Chaque ★ de préparation (3 au plus) = +1 point. Le 1er gagne +1 soutien dans 4 régions, le 2e dans 2 régions (doublé au débat final). Chaque parti a son tempérament : observe-le !</p>' +
      '<p><b>⚖️ Mode Réaliste : le poids des urnes.</b> Chaque soutien pèse selon le score historique de son parti dans la région : un soutien du parti en tête de la région compte beaucoup, celui d\u2019un petit parti beaucoup moins. Et la moitié des électeurs vote par fidélité (le <b>socle électoral</b>) : la campagne se joue sur l\u2019autre moitié. Résultat : les petits partis ont du mal à dépasser leur score historique, et chaque région garde sa couleur (terre de gauche, de droite ou disputée, dans la fiche de la région). En mode Simulation, tout le monde pèse pareil.</p>' +
      '<p><b>Sous les projecteurs :</b> le premier des sondages paie 2 ★ ou perd des soutiens à chaque fin de tour.</p>' +
      '<p><b>🎭 Les traits satiriques.</b> Huit partis vivent un gag qui se joue de l\u2019intérieur, avec un avantage et un coût : ' + Object.keys(D.TRAITS).map(function (k) { var t = D.TRAITS[k]; return t.icon + ' <b>' + esc(t.name) + '</b> (' + t.parties.map(function (p) { return esc(party(p).short); }).join(', ') + ')'; }).join(' · ') + '. Le détail est dans l\u2019onglet de ton parti, et les actions propres à ton parti dans le menu « Plus ».</p>' });
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
  window.PolitikUI = { showPaper: showPaper, modal: modal, closeModal: closeModal, toast: toast, go: go, esc: esc, line: line, srcHtml: srcHtml, chip: chip,
    game: function () { return g; }, me: function () { return me; } };
  renderTitleMap();
  renderChoose();
  renderResume();
  $('btn-resume').addEventListener('click', resumeGame);
  /* v1.9 : l'écran d'ouverture du studio disparaît tout seul (ou d'un toucher) */
  (function () {
    var sp = $('splash'); if (!sp) return;
    var done = false;
    function hide() { if (done) return; done = true; sp.classList.add('out'); setTimeout(function () { sp.remove(); }, 600); }
    sp.addEventListener('click', hide);
    setTimeout(hide, FX.reduced ? 1200 : 2900);
  })();
})();

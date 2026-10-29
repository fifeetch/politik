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
  /* v4.8 : les partis modifiés par le joueur (nom, sigle, couleur, candidat, score de départ) */
  var partyEdits = {};
  try { partyEdits = JSON.parse(localStorage.getItem('politik_edits') || '{}') || {}; } catch (e) { partyEdits = {}; }
  function saveEdits() { try { localStorage.setItem('politik_edits', JSON.stringify(partyEdits)); } catch (e) {} }
  function editOf(pid) { return partyEdits[pid] || (partyEdits[pid] = {}); }
  function cleanEdit(pid) { var e = partyEdits[pid]; if (e && !Object.keys(e).some(function (k) { return e[k] != null && e[k] !== ''; })) delete partyEdits[pid]; }
  /* Applique les modifications (et le score de ton parti fondé) aux données du jeu */
  function applyEdits() {
    PS.applyEdits(partyEdits, A);
    if (founded && founded.score > 0) D.START_EDITS[founded.sigle] = founded.score;
  }
  /* Les candidats de tous les partis pour la partie : la personnalité choisie, ou toi */
  function candsOpt(pid) {
    var c = {};
    D.PARTIES.forEach(function (p) { c[p.id] = (partyEdits[p.id] && partyEdits[p.id].cand) || 0; });
    var meLead = (founded && pid === founded.sigle) || (leadOn && perso && perso.name);
    if (meLead && perso) c[pid] = { name: perso.name, q: perso.q || 'tribun', d: perso.d || 'terne', title: 'toi' };
    return c;
  }
  function savePerso() { try { localStorage.setItem('politik_perso', JSON.stringify(perso)); localStorage.setItem('politik_parti', JSON.stringify(founded)); localStorage.setItem('politik_lead', leadOn ? '1' : '0'); } catch (e) {} }
  var gameMode = 'reel';   // v1.1 : 'reel' (Réaliste) ou 'egal' (Simulation : égalité des chances)
  var gameBase = 'e2024';  // v1.2 : point de départ du mode Réaliste : 'p2022', 'e2024' ou 'sond'
  try { var sm = localStorage.getItem('politik_mode'); if (sm === 'egal' || sm === 'beta') gameMode = sm; var sb = localStorage.getItem('politik_base'); if (D.BASES[sb]) gameBase = sb; } catch (e) {}
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
    var lb = $('btn-load'); if (lb) { var n = readSaves().length; lb.hidden = !n; lb.innerHTML = '📂 Charger une partie<small>' + n + ' sauvegarde' + (n > 1 ? 's' : '') + '</small>'; }
    if (!sv) { b.hidden = true; return; }
    var gg; try { gg = JSON.parse(sv.game); } catch (e) { b.hidden = true; return; }
    var P = E.PARTY[sv.me] || (sv.founded && sv.founded.sigle === sv.me ? sv.founded : null);
    b.hidden = !P;
    if (P) b.innerHTML = '↻ Reprendre la dernière partie<small>' + esc(P.name || P.short) + ' · tour ' + (gg.turn + 1) + ' sur ' + (D.FORMATS[gg.format] || D.FORMATS.classique).turns + '</small>';
  }
  /* v3.7 : les sauvegardes nommées (plusieurs parties gardées, à recharger depuis l'accueil) */
  var SAVES = 'politik_saves', SAVES_MAX = 20;
  function readSaves() { try { var x = JSON.parse(localStorage.getItem(SAVES) || '[]'); return Array.isArray(x) ? x.filter(function (s) { return s && s.v === 1 && s.game; }) : []; } catch (e) { return []; } }
  function writeSaves(list) { localStorage.setItem(SAVES, JSON.stringify(list)); }
  function snapPayload() {
    return { v: 1, when: Date.now(), game: turnSnap, me: me, quick: quickGame, perso: perso, founded: founded, lead: leadOn, foundedOn: !!(founded && me === founded.sigle) };
  }
  function saveInfo(sv) {
    var gg; try { gg = JSON.parse(sv.game); } catch (e) { return null; }
    var P = E.PARTY[sv.me] || (sv.founded && sv.founded.sigle === sv.me ? sv.founded : null);
    if (!P) return null;
    return { party: P.name || P.short, turn: gg.turn + 1, turns: (D.FORMATS[gg.format] || D.FORMATS.classique).turns };
  }
  function whenFr(t) {
    var d = new Date(t), p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + ' à ' + p2(d.getHours()) + 'h' + p2(d.getMinutes());
  }
  function saveNamed() {
    if (!turnSnap) return;
    var info = saveInfo(snapPayload()) || { party: '', turn: turnSnapTurn };
    var def = info.party + ' · tour ' + info.turn;
    var list = readSaves();
    modal({ kicker: '💾 Sauvegarder', title: 'Nommer ta partie',
      html: '<label class="kicker" for="sv-name">Nom de la sauvegarde</label><input id="sv-name" class="pc-input" maxlength="40" value="' + esc(def) + '">' +
        '<p class="hint">La partie reprendra au début du tour ' + turnSnapTurn + '. Même nom qu\u2019une sauvegarde existante = elle est remplacée.</p>' +
        (list.length >= SAVES_MAX ? '<p class="hint">Tu as déjà ' + SAVES_MAX + ' sauvegardes : la plus ancienne sera effacée.</p>' : ''),
      onOpen: function () { var i = $('sv-name'); if (i) { i.focus(); i.select(); } },
      buttons: [{ label: 'Enregistrer', primary: true, onClick: function () {
        var name = (($('sv-name') && $('sv-name').value) || '').trim() || def;
        var entry = Object.assign(snapPayload(), { name: name, id: Date.now().toString(36) });
        var l = readSaves().filter(function (x) { return x.name.toLowerCase() !== name.toLowerCase(); });
        l.unshift(entry);
        while (l.length > SAVES_MAX) l.pop();
        try { writeSaves(l); toast('💾 « ' + name + ' » enregistrée. « Charger une partie » sur l\u2019écran d\u2019accueil.'); }
        catch (e) { toast('Sauvegarde impossible : mémoire du téléphone pleine. Supprime une ancienne sauvegarde.'); }
        renderResume();
      } }, { label: 'Annuler' }] });
  }
  function showLoad() {
    var list = readSaves();
    var rows = list.map(function (sv, i) {
      var inf = saveInfo(sv);
      return '<li class="sv-row"><button type="button" class="sv-load" data-i="' + i + '"' + (inf ? '' : ' disabled') + '><b>' + esc(sv.name) + '</b><small>' +
        (inf ? esc(inf.party) + ' · tour ' + inf.turn + ' sur ' + inf.turns + ' · ' : 'Sauvegarde illisible · ') + whenFr(sv.when) + '</small></button>' +
        '<button type="button" class="sv-del" data-i="' + i + '" aria-label="Supprimer ' + esc(sv.name) + '">🗑</button></li>';
    }).join('');
    modal({ kicker: '📂 Charger', title: 'Tes parties enregistrées',
      html: list.length ? '<ul class="sv-list">' + rows + '</ul>' : '<p>Aucune partie enregistrée. En jeu : onglet « Mon parti » → « Sauvegarder la partie ».</p>',
      buttons: [{ label: 'Fermer' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('#modal .sv-load'), function (b) {
          b.addEventListener('click', function () { var sv = readSaves()[+b.getAttribute('data-i')]; closeModal(); if (sv) resumeGame(sv); });
        });
        Array.prototype.forEach.call(document.querySelectorAll('#modal .sv-del'), function (b) {
          b.addEventListener('click', function () {
            var l = readSaves(), sv = l[+b.getAttribute('data-i')]; if (!sv) return;
            modal({ title: 'Supprimer « ' + sv.name + ' » ?', html: '<p>Cette sauvegarde sera effacée pour de bon.</p>',
              buttons: [{ label: 'Supprimer', primary: true, onClick: function () {
                try { writeSaves(readSaves().filter(function (x) { return x.id !== sv.id || x.when !== sv.when; })); } catch (e) {}
                renderResume(); showLoad();
              } }, { label: 'Garder', onClick: showLoad }] });
          });
        });
      } });
  }
  function resumeGame(from) {
    var sv = (from && from.game) ? from : readSave(); if (!sv) return;
    perso = sv.perso; founded = sv.founded; leadOn = sv.lead;
    PS.reset(A); applyEdits();
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
    restoreModal();
    $('modal').hidden = false;
    FX.setModal(true);
    FX.replay(card, 'enter');
    if (opts.onOpen) opts.onOpen();
  }
  function closeModal() { restoreModal(); $('modal').hidden = true; FX.setModal(false); }
  /* v4.5.1 : réduire une fenêtre pour regarder le jeu derrière (scores, carte…), puis la rouvrir.
     Pendant ce temps, le jeu se regarde mais ne se joue pas : on rouvre d'abord la fenêtre. */
  function minimizeModal() {
    $('modal').classList.add('min');
    $('modal-pill').textContent = '▴ Rouvrir · ' + ($('modal-title').textContent || 'la fenêtre');
    $('modal-pill').hidden = false;
  }
  function restoreModal() { $('modal').classList.remove('min'); $('modal-pill').hidden = true; }
  $('modal-min').addEventListener('click', minimizeModal);
  $('modal-pill').addEventListener('click', restoreModal);
  document.addEventListener('click', function (ev) {
    if (!$('modal').classList.contains('min') || $('modal').hidden) return;
    if ($('modal-pill').contains(ev.target)) return;
    if (!ev.target.closest('button, a, [role="button"], input, select, label')) return;
    ev.preventDefault(); ev.stopPropagation();
    toast('Rouvre la fenêtre en bas pour continuer.');
  }, true);
  var toastTimer;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, Math.max(2200, String(msg).length * 45)); }

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
  function natScore(base, pid) { return E.natScore(base, pid); }   // v4.8 : réglages du joueur compris
  function renderSetup() {
    PS.reset(A); applyEdits();   // v4.8 : l'aperçu des scores tient compte de tes réglages
    var modes = [['reel', 'Réaliste', 'Les partis partent avec leurs vrais scores.'], ['egal', 'Simulation', 'Tout le monde part du même point : mêmes électeurs partout, aucun bonus caché.'], ['beta', D.BETA.name, D.BETA.text]];
    $('mode-pick').innerHTML = modes.map(function (m) {
      return '<button type="button" role="radio" class="mode-btn' + (gameMode === m[0] ? ' on' : '') + '" data-mode="' + m[0] + '" aria-checked="' + (gameMode === m[0]) + '"><b>' + m[1] + '</b><small>' + m[2] + '</small></button>';
    }).join('');
    $('base-wrap').hidden = gameMode === 'egal';
    // v4.1 : ce qui change en mode Bêta
    var bx = $('beta-note');
    if (!bx) { bx = el('div', { id: 'beta-note', class: 'beta-note' }); $('mode-pick').parentNode.insertBefore(bx, $('mode-pick').nextSibling); }
    bx.hidden = gameMode !== 'beta';
    bx.innerHTML = '<b>🧪 À l\u2019essai dans ce mode :</b><ul>' + D.BETA.changes.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>';
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
    applyEdits();   // v4.8 : tes modifications de partis
    renderPersoStrip();
    $('choose-kicker').textContent = gameFormat === 'eclair' ? '⚡ Campagne éclair : 3 tours' : quick ? 'Touche un parti, puis lance-toi' : gameMode === 'egal' ? 'Simulation : tout le monde part à égalité' : (gameMode === 'beta' ? '🧪 Bêta' : 'Réaliste') + ' : départ « ' + D.BASES[gameBase].short + ' »';
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
      candPickHtml(p.id, lead) +
      (gameMode !== 'egal' ? scoreHtml(p.id, D.BASES[gameBase].text, '<button type="button" class="linkbtn" data-learn="' + D.BASES[gameBase].learn + '">Pourquoi ce chiffre ?</button>')
        : '<div class="score24"><span>Mode Égalité</span><b>2</b><small>électeurs dans chaque région pour chaque parti : personne ne part en tête.</small></div>') +
      axisHtml(p.id) +
 ((p.pos <= 1 || p.pos >= 6) ? '<div><b>Au bout de l\'axe.</b> Au second tour, les reports de voix seront plus durs à obtenir : il faudra bien négocier entre les deux tours.</div>' : '') +
      '<div><b>Force.</b> ' + esc(p.force) + '</div><div><b>Faiblesse.</b> ' + esc(p.weakness) +
      '</div><div><b>Bases.</b> ' + p.bases.map(function (r) { return E.REG[r].name; }).join(', ') +
      '</div><div><b>Cartes.</b> ' + p.cards.map(function (c) { return D.CARDS[c].name; }).join(' · ') + '</div>' + traitHtml(p.id, false) +
      '<div class="stack pe-actions"><button type="button" class="btn" id="pe-edit">✏️ Modifier ce parti</button>' + (partyEdits[p.id] ? '<button type="button" class="linkbtn" id="pe-reset">Remettre ce parti d\u2019origine</button>' : '') + '</div>';
    wireChooseDetail(p.id, lead);
  }
  /* ---------- v4.8 : choisir le candidat du parti ---------- */
  function qdHtml(q, d) {
    var Q = D.QUALITIES[q], Dd = D.DEFECTS[d];
    return (Q ? '<span class="qd qd-q" title="' + esc(Q.text) + '">' + Q.icon + ' ' + esc(Q.name) + '</span>' : '') + (Dd ? '<span class="qd qd-d" title="' + esc(Dd.text) + '">' + Dd.icon + ' ' + esc(Dd.name) + '</span>' : '');
  }
  function candPickHtml(pid, lead) {
    var PP = window.PolitikPeople; if (!PP) return '';
    if (lead) {
      var q = perso.q || 'tribun', d = perso.d || 'terne';
      return '<div class="cand-pick"><span class="kicker">Ton candidat : toi</span><div class="qd-row">' + qdHtml(q, d) + '</div><p class="hint">' + esc(D.QUALITIES[q].text) + ' ' + esc(D.DEFECTS[d].text) + ' Change-les avec « Modifier » sur ton personnage.</p></div>';
    }
    var list = PP.peopleOf(pid), cur = (partyEdits[pid] && partyEdits[pid].cand) || 0, sel = list[cur] || list[0];
    if (!list.length) return '';
    return '<div class="cand-pick"><span class="kicker">Choisis ton candidat · ' + list.length + ' personnalités</span><div class="cp-list">' + list.map(function (x) {
      return '<button type="button" class="cp-card" data-cand="' + x.idx + '" aria-pressed="' + (x.idx === cur) + '"><span class="cp-face">' + (x.leader ? A.basePortrait(pid) : A.face(PS.personFace(pid, x.idx))) + '</span><b>' + esc(x.name) + '</b><small>' + (x.leader ? 'chef de file' : esc(x.title)) + '</small><span class="qd-row">' + qdHtml(x.q, x.d) + '</span></button>';
    }).join('') + '</div><p class="hint cp-why"><b>' + esc(sel.name) + '</b> · ' + D.QUALITIES[sel.q].icon + ' ' + esc(D.QUALITIES[sel.q].text) + ' ' + D.DEFECTS[sel.d].icon + ' ' + esc(D.DEFECTS[sel.d].text) + '</p></div>';
  }
  /* ---------- v4.8 : régler le score de départ ---------- */
  function scoreHtml(pid, text, extra) {
    var cur = natScore(gameBase, pid), set = partyEdits[pid] && partyEdits[pid].score;
    var orig0 = (function () { var keep = D.START_EDITS; D.START_EDITS = {}; var v = E.natScore(gameBase, pid); D.START_EDITS = keep; return v; })();
    var max = Math.max(25, Math.ceil(orig0 + 5)), val = Math.round(cur * 2) / 2;
    return '<div class="score24 score-set"><span>Score de départ</span><b id="sc-val">' + pctFr(cur / 100, 1) + ' %</b>' +
      '<input type="range" id="sc-range" class="sc-range" min="1" max="' + max + '" step="0.5" value="' + val + '" aria-label="Score de départ en %">' +
      '<small>' + (set ? 'Réglé par toi (d\u2019origine : ' + pctFr(orig0 / 100, 1) + ' %). Les autres partis s\u2019ajustent en proportion. <button type="button" class="linkbtn" id="sc-reset">Revenir au vrai score</button>'
        : esc(text) + ' ' + (extra || '') + ' Glisse le curseur pour changer : les autres partis s\u2019ajustent en proportion.') + '</small></div>';
  }
  function wireScore(pid, isFounded) {
    var rg = $('sc-range'); if (!rg) return;
    rg.addEventListener('input', function () { $('sc-val').textContent = String(rg.value).replace('.', ',') + ' %'; });
    rg.addEventListener('change', function () {
      var v = +rg.value;
      if (isFounded) { founded.score = v; savePerso(); } else { editOf(pid).score = v; saveEdits(); }
      renderChoose();
    });
    if ($('sc-reset')) $('sc-reset').addEventListener('click', function () {
      if (isFounded) { delete founded.score; savePerso(); } else { delete editOf(pid).score; cleanEdit(pid); saveEdits(); }
      renderChoose();
    });
  }
  function wireChooseDetail(pid, lead) {
    var onC = document.querySelector('.cp-card[aria-pressed="true"]');   // le candidat choisi reste en vue
    if (onC && onC.parentNode) onC.parentNode.scrollLeft = Math.max(0, onC.offsetLeft - onC.parentNode.offsetLeft - 8);
    Array.prototype.forEach.call(document.querySelectorAll('[data-cand]'), function (b) {
      b.addEventListener('click', function () { var i = +b.getAttribute('data-cand'); if (i) editOf(pid).cand = i; else { delete editOf(pid).cand; cleanEdit(pid); } saveEdits(); renderChoose(); });
    });
    wireScore(pid, false);
    $('pe-edit').addEventListener('click', function () { editParty(pid); });
    if ($('pe-reset')) $('pe-reset').addEventListener('click', function () {
      modal({ title: 'Remettre ' + PS.original(pid).name + ' d\u2019origine ?', html: '<p>Nom, sigle, couleur, candidat et score de départ reviennent comme au début.</p>',
        buttons: [{ label: 'Remettre d\u2019origine', primary: true, onClick: function () { delete partyEdits[pid]; saveEdits(); renderChoose(); } }, { label: 'Annuler' }] });
    });
  }
  /* ---------- v4.8 : modifier un parti existant (nom, nom court, sigle, couleur) ---------- */
  function editParty(pid) {
    var o = PS.original(pid), e = JSON.parse(JSON.stringify(partyEdits[pid] || {})), p = party(pid);
    var cols = [o.color].concat(PS.COLORS, ['#C8323C', '#E87FA4', '#3B8A45', '#F5B335', '#2F6EBA', '#1F2A55', '#8B1E1E', '#E1663A']).filter(function (c, i, a) { return a.indexOf(c) === i; });
    var curCol = e.color || o.color;
    var html = '<label class="kicker" for="pe-name">Nom du parti</label><input id="pe-name" class="pc-input" maxlength="32" value="' + esc(e.name || o.name) + '">' +
      '<label class="kicker" for="pe-short">Nom court (cartes, sondages)</label><input id="pe-short" class="pc-input" maxlength="22" value="' + esc(e.short || o.short) + '">' +
      '<div class="fp-two"><div><label class="kicker" for="pe-sig">Sigle</label><input id="pe-sig" class="pc-input fp-sig" maxlength="4" value="' + esc(e.sigle || o.sigle || pid) + '"></div><div><span class="kicker">Couleur</span><div class="pc-row">' +
      cols.map(function (c) { return '<button type="button" class="pc-sw" data-pcol="' + c + '" aria-pressed="' + (c === curCol) + '" style="background:' + c + '" aria-label="couleur"></button>'; }).join('') + '</div></div></div>' +
      '<p class="hint">D\u2019origine : ' + esc(o.name) + ' (' + esc(o.sigle || pid) + '). Le candidat et le score de départ se choisissent juste sous le portrait.</p><p class="hint" id="pe-err"></p>';
    modal({ kicker: 'Modifier un parti', title: p.name, html: html, buttons: [{ label: 'Enregistrer', primary: true, keep: true, onClick: function () {
      var nm = $('pe-name').value.trim(), sh = $('pe-short').value.trim(), sg = $('pe-sig').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!nm || !sh) { $('pe-err').textContent = 'Le nom et le nom court ne peuvent pas être vides.'; return; }
      if (!/^[A-Z0-9]{2,4}$/.test(sg)) { $('pe-err').textContent = 'Le sigle doit faire 2 à 4 lettres.'; return; }
      var ed = editOf(pid);
      ed.name = nm !== o.name ? nm : undefined; ed.short = sh !== o.short ? sh : undefined; ed.sigle = sg !== (o.sigle || pid) ? sg : undefined; ed.color = curCol !== o.color ? curCol : undefined;
      Object.keys(ed).forEach(function (k) { if (ed[k] === undefined) delete ed[k]; }); cleanEdit(pid); saveEdits();
      closeModal(); renderChoose(); toast('✏️ Parti modifié.');
    } }, { label: 'Annuler' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('[data-pcol]'), function (b) {
          b.addEventListener('click', function () { curCol = b.getAttribute('data-pcol'); Array.prototype.forEach.call(document.querySelectorAll('[data-pcol]'), function (x) { x.setAttribute('aria-pressed', x === b); }); });
        });
      } });
  }
  /* v2.0 : en partie rapide, le programme conseillé du parti est pris d'office */
  $('btn-start').addEventListener('click', function () {
    if (founded && chosen === founded.sigle && !(perso && perso.name)) { toast('Crée d\'abord ton personnage.'); return editChar(function () { renderChoose(); }); }
    applyPerso();
    if (quick) startGame(chosen); else openProgramme(chosen);
  });
  /* v2.5 : juste avant la partie, ton parti entre en lice, ou tu prends la tête du parti choisi */
  function applyPerso() {
    PS.reset(A); applyEdits();
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
      (gameMode !== 'egal' ? '<div class="score24 score-set"><span>Score de départ</span><b id="sc-val">' + pctFr((founded.score || D.RULES.novelty.start) / 100, 1) + ' %</b>' +
        '<input type="range" id="sc-range" class="sc-range" min="1" max="25" step="0.5" value="' + (founded.score || D.RULES.novelty.start) + '" aria-label="Score de départ en %">' +
        '<small>' + (founded.score ? 'Réglé par toi. Les autres partis s\u2019ajustent en proportion. <button type="button" class="linkbtn" id="sc-reset">Revenir à 3 % (parti tout neuf)</button>' : 'Un parti tout neuf part d\u2019environ 3 %. Glisse le curseur (1 à 25 %) : les autres partis s\u2019ajustent en proportion.') + '</small></div>' : '') +
      '<div class="cand-pick"><span class="kicker">Ton candidat : toi</span><div class="qd-row">' + qdHtml((perso && perso.q) || 'tribun', (perso && perso.d) || 'terne') + '</div></div>' +
      axisHtmlPos(p) +
      '<div><b>Tes thèmes.</b> ' + p.themes.map(function (t) { return th(t).icon + ' ' + esc(th(t).name); }).join(' · ') + '</div>' +
      '<div><b>Force.</b> ' + esc(p.force) + '</div><div><b>Faiblesse.</b> ' + esc(p.weakness) + '</div>' +
      '<div><b>Bases.</b> ' + p.bases.map(function (r) { return E.REG[r].name; }).join(', ') + '</div>' +
      '<div class="stack"><button type="button" class="btn" id="fp-edit">✏️ Modifier ton parti</button><button type="button" class="btn btn-ghost" id="fp-del">🗑️ Supprimer ton parti</button></div>';
    wireScore(founded.sigle, true);
    $('fp-edit').onclick = function () { foundParty(); };
    $('fp-del').onclick = function () { modal({ kicker: 'Ton parti', title: 'Supprimer ' + founded.name + ' ?', html: '<p>Ton parti disparaît. Ton personnage reste : tu pourras prendre la tête d\'un autre parti, ou en fonder un nouveau.</p>',
      buttons: [{ label: 'Supprimer', primary: true, onClick: function () { founded = null; chosen = 'VP'; savePerso(); renderChoose(); } }, { label: 'Annuler' }] }); };
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
      }).join('') + '</div>' +
      // v4.8 : une qualité et un défaut, comme les personnalités des partis
      '<div class="kicker">Ta qualité</div><div class="pick">' + Object.keys(D.QUALITIES).map(function (k) {
        var t = D.QUALITIES[k]; return '<button type="button" class="pick-row" data-q="' + k + '" aria-pressed="' + ((c.q || 'tribun') === k) + '"><span class="lc-ai">' + t.icon + '</span><span class="pick-txt"><b>' + esc(t.name) + '</b><small>' + esc(t.text) + '</small></span></button>';
      }).join('') + '</div>' +
      '<div class="kicker">Ton défaut</div><div class="pick">' + Object.keys(D.DEFECTS).map(function (k) {
        var t = D.DEFECTS[k]; return '<button type="button" class="pick-row" data-d="' + k + '" aria-pressed="' + ((c.d || 'terne') === k) + '"><span class="lc-ai">' + t.icon + '</span><span class="pick-txt"><b>' + esc(t.name) + '</b><small>' + esc(t.text) + '</small></span></button>';
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
        ['q', 'd'].forEach(function (key) {   // v4.8
          Array.prototype.forEach.call(document.querySelectorAll('[data-' + key + ']'), function (b) {
            b.addEventListener('click', function () { c[key] = b.getAttribute('data-' + key); Array.prototype.forEach.call(document.querySelectorAll('[data-' + key + ']'), function (x) { x.setAttribute('aria-pressed', x === b); }); });
          });
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
    g = E.createGame(pid, { mode: gameMode, base: gameBase, format: gameFormat, cands: candsOpt(pid) }); me = pid; selected = null; queue = []; theme = null; themePicked = false; advisorHidden = false;
    quickGame = quick;
    E.setProgramme(g, pid, prog || party(pid).programme, fin || party(pid).financing);
    go('game');
    nextTurn();
  }
  function mePl() { return E.player(g, me); }
  /* Raccourci : la campagne se joue toute seule, et tu l'emportes de justesse au second tour */
  function skipCampaign(pid, prog, fin) {
    g = E.createGame(pid, { mode: gameMode, base: gameBase, format: gameFormat, cands: candsOpt(pid) }); me = pid;
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
        E.resolveDebate(g, pr, deb.duels.map(function (d) { return { ra: AI.chooseReply(g, d.a, d.theme, d.b, d), rb: AI.chooseReply(g, d.b, d.theme, d.a, d) }; }));
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
    if (info.bomb) alerts.unshift('BOMBE · ' + (info.bomb.pid === me ? 'Toi' : party(info.bomb.pid).short) + ' : ' + info.bomb.title.replace('💣 ', ''));
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
    if (E.isDebateTurn(g)) briefs.push({ k: 'Ce soir', t: '🎙️ Débat télévisé', s: 'Garde des ★ pour te préparer.' });
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
      '<div class="art-body">' + (p && a.id !== 'main' ? '<span class="art-face" style="--pc:' + p.color + '">' + A.portrait(a.pid) + '</span>' : '') + '<p>' + esc(a.text) + '</p></div>' +
      (a.why ? '<button type="button" class="art-more" data-why="' + esc(a.id) + '">🔎 Les coulisses <span aria-hidden="true">›</span></button>' : '') + '</article>';
  }
  /* v4.8 : les coulisses d'un article. Le journal raconte ; ici, on explique ce qui s'est passé DANS LE JEU :
     l'action jouée, sa règle, son effet chiffré, et le trait du parti quand c'est un gag. Plus on fouille, plus on comprend. */
  var curPaper = null;
  function specOf(pid, k, part) { var f = D.FICHES[k]; return f ? f[part].replace(/\{(\d+)\}/g, function (m, n) { return String(E.spec ? E.spec(g, pid, +n) : +n); }) : ''; }
  function ruleBlock(pid, key) {
    if (!key) return '';
    var A0 = D.ACTIONS[key], C0 = D.CARDS[key], f = D.FICHES[key];
    var name = A0 ? (A0.icon ? A0.icon + ' ' : '') + A0.name : C0 ? '🃏 ' + C0.name : key;
    var h = '<div class="cl-box"><span class="kicker">La règle · ' + esc(name) + (A0 && A0.only ? ' (action propre au parti)' : C0 ? ' (carte unique du parti)' : '') + '</span>';
    if (f) h += '<p><b>Quand :</b> ' + esc(specOf(pid, key, 'quand')) + '</p><p><b>Effet :</b> ' + esc(specOf(pid, key, 'effet')) + '</p>' + (f.risque !== 'Aucun.' ? '<p><b>Risque :</b> ' + esc(specOf(pid, key, 'risque')) + '</p>' : '');
    else h += '<p>' + esc((A0 || C0 || {}).text || '') + '</p>' + (A0 && A0.cost ? '<p class="muted">Coût : ' + esc(costTxtOf(A0.cost)) + '</p>' : '');
    return h + '</div>';
  }
  function costTxtOf(c) { var t = []; if (c.money) t.push(c.money + ' €'); if (c.infl) t.push(c.infl + ' ★'); if (c.forme) t.push(c.forme + ' ⚡'); return t.join(' + ') || 'gratuit'; }
  function traitBlock(tk) {
    var T0 = D.TRAITS[tk]; if (!T0) return '';
    return '<div class="cl-box cl-trait"><span class="kicker">Le trait du parti · ' + T0.icon + ' ' + esc(T0.name) + '</span><p><b>👍 L\u2019atout :</b> ' + esc(T0.plus) + '</p><p><b>👎 Le revers :</b> ' + esc(T0.minus) + '</p>' +
      (T0.learn ? '<p class="cl-learn">📚 ' + esc(T0.learn) + '</p>' : '') + '</div>';
  }
  function coulisses(a) {
    var w = a.why || {}, h = '', who = a.pid ? party(a.pid) : null, mine = a.pid === me;
    if (who) h += '<p class="cl-who">' + chip(a.pid) + ' <b>' + esc(who.candidate) + '</b> · ' + esc(who.name) + (mine ? ' <em>(ton parti)</em>' : '') + '</p>';
    if (w.k === 'act' && w.l) {
      var l = w.l;
      h += '<div class="cl-box"><span class="kicker">Ce qui s\u2019est passé dans le jeu</span><p>' + esc(who ? who.short : '') + ' a joué <b>' + esc(l.action) + '</b>' +
        (l.region ? ' en <b>' + esc(E.REG[l.region].name) + '</b>' : '') + (l.target ? ' contre <b>' + esc(party(l.target).short) + '</b>' : '') +
        (l.theme && th(l.theme) ? ', avec le message ' + th(l.theme).icon + ' <b>' + esc(th(l.theme).name) + '</b>' : '') + '.</p>' +
        (l.text ? '<p><b>Résultat :</b> ' + esc(l.text) + '</p>' : '') +
        (l.pt ? '<p><b>Effet au sondage pour ' + esc(who ? who.short : '') + ' :</b> <span class="' + (l.pt > 0 ? 'up' : 'down') + '">' + ptStr(l.pt) + '</span></p>' : '') + '</div>';
      h += ruleBlock(a.pid, w.key);
      if (w.trait) h += traitBlock(w.trait);
      if (!mine && w.key && D.ACTIONS[w.key] && D.ACTIONS[w.key].only) h += '<p class="hint">Cette action n\u2019existe que pour ce parti. Tu peux voir toutes ses forces en touchant son nom dans l\u2019onglet Sondage.</p>';
    } else if (w.k === 'trait') {
      h += traitBlock(w.trait);
    } else if (w.k === 'event') {
      h += '<div class="cl-box"><span class="kicker">Pourquoi c\u2019est important</span><p>Chaque tour, un sujet fait la une : ' + (th(w.theme) ? th(w.theme).icon + ' <b>' + esc(th(w.theme).name) + '</b>' : 'un thème') + '. Tous les messages sur ce thème gagnent <b>+1 d\u2019impact</b> ce tour-ci : un Meeting sur ce sujet rapporte plus de soutiens.</p>' +
        (w.quiet ? '' : '<p>L\u2019événement lui-même peut aussi donner ou retirer des soutiens, de l\u2019argent ou de l\u2019influence à certains partis : c\u2019est la règle indiquée sous le titre.</p>') +
        (w.crisis ? '<p>Une crise dure plusieurs tours, en plusieurs actes : prépare-toi à ce que le même sujet revienne.</p>' : '') + '</div>';
    } else if (w.k === 'bascule') {
      h += '<div class="cl-box"><span class="kicker">Comment une région change de main</span><p>Une région revient au parti qui y fait le plus de voix' + (g.hist ? ' (le socle des électeurs fidèles plus les soutiens gagnés en campagne)' : '') + ', à condition d\u2019y avoir au moins ' + (R.minControl - (g.hist ? 1 : 0)) + ' soutiens.</p>' +
        '<p>Tenir une région ne compte pas en soi pour l\u2019élection : ce sont les voix qui comptent. Mais certains objectifs secrets demandent de tenir des régions, et chaque région tenue rapporte un peu d\u2019argent à chaque tour.</p></div>';
    } else if (w.k === 'affair') {
      var x = w.x;
      h += '<div class="cl-box"><span class="kicker">D\u2019où viennent les affaires</span><p>Chaque casserole 🍳 donne environ ' + Math.round(100 * R.affairPerCasserole) + ' % de risque qu\u2019une affaire sorte à chaque tour. On en récolte en attaquant un rival, en faisant une promesse hors programme, en gaffant quand le candidat est épuisé, ou quand un rival enquête sur toi.</p>' +
        '<p><b>Réaction choisie :</b> ' + esc(x.reaction) + '.' + (x.effects && x.effects.length ? ' <b>Conséquences :</b> ' + esc(x.effects.join(', ')) + '.' : '') + '</p>' +
        '<p>Une affaire fait aussi monter un peu l\u2019abstention partout : « tous pourris ».</p></div>';
    } else if (w.k === 'dilemma') {
      var dx = w.x;
      h += '<div class="cl-box"><span class="kicker">Le dilemme</span><p>À chaque tour, un parti doit trancher un choix délicat. ' + esc(who ? who.short : '') + ' a choisi : <b>' + esc(dx.choice) + '</b>.</p>' +
        (dx.effects && dx.effects.length ? '<p><b>Effets :</b> ' + esc(dx.effects.join(', ')) + '.</p>' : '') + '<p>Ton tour viendra : chaque option a un prix et un avantage.</p></div>';
    } else if (w.k === 'prog') {
      h += '<div class="cl-box"><span class="kicker">Les mesures choc</span><p>Une mesure choc fait parler d\u2019elle dès le premier tour : +1 soutien dans 2 régions qui s\u2019en préoccupent, mais aussi <b>+1 casserole</b>, car elle est attaquée de toutes parts.</p></div>';
    } else if (w.k === 'poll') {
      h += '<div class="cl-box"><span class="kicker">Comment se fait le sondage</span><p>Chaque région vote selon ' + (g.hist ? 'son socle d\u2019électeurs fidèles (les vrais résultats de référence) et ' : '') + 'les soutiens gagnés par chaque parti, puis on additionne toutes les régions selon leur nombre de votants. L\u2019audience dans les médias s\u2019ajoute, classe sociale par classe sociale.</p>' +
        '<p>Seuls les deux premiers vont au second tour. Le bilan de fin de tour te montre, ligne par ligne, d\u2019où viennent tes hausses et tes baisses.</p></div>';
    }
    modal({ kicker: 'Les coulisses', title: a.title, html: '<div class="coulisses">' + h + '</div>', buttons: [{ label: 'Retour au journal', primary: true }] });
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
    curPaper = paper;
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
    var wb = e.target.closest('[data-why]');
    if (wb && curPaper) { var art = curPaper.articles.filter(function (x) { return x.id === wb.getAttribute('data-why'); })[0]; if (art) return coulisses(art); }
    var t = e.target.closest('[data-art]'); if (t) return openPages(t.getAttribute('data-art'));
    if (e.target.closest('#paper-back')) { $('paper-inside').hidden = true; $('paper-front').hidden = false; $('paper-open').hidden = false; }
  });
  /* ---------- v0.7 : Lulu, la directrice de campagne — un conseil clair par tour ---------- */
  function advice() {
    var pl = mePl(), ph = E.measure(pl.phare), hot = g.hot || [];
    if (g.turn === 1) return 'Parle de ta mesure phare (' + th(ph.theme).icon + ' ' + th(ph.theme).short + ') : choisis une région, puis 📣 Meeting.';
    if (E.isDebateTurn(g) && pl.infl < 2) return 'Débat ce soir 🎙️ et presque plus de ★ : évite la Télé ce tour-ci.';
    if (E.isDebateTurn(g)) return 'Débat ce soir 🎙️ ! Garde 2 ou 3 ★ : chaque ★ de préparation = +15 % sur tes réponses, et la fiche de ton adversaire.';
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
  /* v4.8 : Lulu peut être coupée pour de bon (réglage gardé sur le téléphone), et rallumée depuis « Mon parti » */
  var luluOff = (function () { try { return localStorage.getItem('politik-lulu-off') === '1'; } catch (e) { return false; } })();
  function setLuluOff(v) { luluOff = !!v; try { localStorage.setItem('politik-lulu-off', v ? '1' : '0'); } catch (e) { /* stockage indisponible */ } }
  /* v4.8 : l'astuce du tour (au plus une nouvelle par tour, jamais deux fois la même dans une partie) */
  function tipCtx() { return { g: g, me: me, pl: mePl(), E: E, R: R, sel: selected }; }
  function tipOfTurn() {
    var TP = window.PolitikTips; if (!TP || !g) return null;
    g.tips = g.tips || { seen: {}, turn: {} };
    var id = g.tips.turn[g.turn];
    if (!id) { var t = TP.next(tipCtx(), g.tips.seen); if (!t) return null; id = t.id; g.tips.turn[g.turn] = id; g.tips.seen[id] = true; }
    return TP.TIPS.filter(function (x) { return x.id === id; })[0] || null;
  }
  function anotherTip() {
    var TP = window.PolitikTips; if (!TP || !g) return null;
    g.tips = g.tips || { seen: {}, turn: {} };
    var t = TP.next(tipCtx(), g.tips.seen);
    if (!t) { var all = TP.TIPS; t = all[Math.floor(Math.random() * all.length)]; }
    g.tips.seen[t.id] = true;
    return t;
  }
  function luluModal(extraTip) {
    var tip = extraTip || tipOfTurn();
    var h = '<div class="learn">' + A.advisor() + '<div class="lulu-m">' +
      '<span class="kicker">Mon conseil du tour</span><p>' + esc(advice()) + '</p>' +
      (tip ? '<span class="kicker">💡 Astuce</span><p>' + esc(tip.text) + '</p>' : '') + '</div></div>';
    modal({ kicker: D.ADVISOR.title, title: D.ADVISOR.name + ' te conseille', html: h,
      buttons: [{ label: 'Une autre astuce', onClick: function () { luluModal(anotherTip()); } },
                { label: 'Merci Lulu', primary: true },
                { label: '🔕 Je ne veux plus de conseils', onClick: function () {
                  setLuluOff(true); renderAdvisor();
                  toast('Lulu se tait. Pour la rappeler : onglet « Mon parti » → « Réactiver Lulu ».');
                } }] });
  }
  function renderAdvisor() {
    var box = $('advisor');
    if (!g || g.phase !== 'actions' || advisorHidden || luluOff || T.isActive()) { box.hidden = true; advShown = null; return; }
    var tipT = advReact ? null : tipOfTurn();
    var text = advReact || (tipT ? '💡 ' + tipT.text : advice());
    if (!box.hidden && text === advShown) return;
    box.hidden = false; advShown = text;
    if (!box.querySelector('.adv-bubble')) {
      box.innerHTML = '<span class="adv-face">' + A.advisor() + '</span><p class="adv-bubble" aria-live="polite"><b>' + D.ADVISOR.name + ' :</b> <span class="adv-txt"></span></p><button type="button" class="adv-close" aria-label="Masquer le conseil">✕</button>';
      box.querySelector('.adv-close').addEventListener('click', function (e) { e.stopPropagation(); advisorHidden = true; renderAdvisor(); });
      box.querySelector('.adv-bubble').addEventListener('click', function () { luluModal(); });
      box.querySelector('.adv-face').addEventListener('click', function () { luluModal(); });
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
      case 'terrain': var mL = estRange(act);
        return mL && mL.hi >= 0.003 ? mL.txt + ' au sondage avec ' + rn + ' ? Je réserve la plus grande salle de la ville !' : 'Un meeting en ' + rn + ' : je préviens la presse locale.';
      case 'medias': return 'La télé, ça touche toute la France d\u2019un coup. Mais l\u2019effet s\u2019use : pense aussi au terrain.';
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
      if (a.type === 'repos') fo = Math.min(R.formeMax, fo + R.reposForme);
      if (a.type === 'card' && a.card === 'primaire') f += 3;
      if (a.type === 'card' && a.card === 'rassemblement') { m += 3; f += 1; }
    });
    return { money: m, infl: f, forme: fo };
  }
  function canQueue(act) {
    if (g.phase !== 'actions') return 'Ce n’est pas le moment.';
    if (queue.length >= E.actionsFor(g, me)) return 'Tes ' + E.actionsFor(g, me) + ' actions sont déjà choisies.';
    if (act.type === 'card' && queue.some(function (q) { return q.card === act.card; })) return 'Carte déjà programmée.';
    if (['rappel', 'fusion', 'eclat', 'matinale', 'vingt', 'defi'].indexOf(act.type) >= 0 && queue.some(function (q) { return q.type === act.type; })) return 'Déjà programmé ce tour.';
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
    try { var mEst = estRange(act), mReg = estReg(act); act.est = mEst ? mEst.hi : null; act.estReg = mReg ? mReg.d : null; } catch (e) { act.est = null; act.estReg = null; }   // v4.8 : le gain annoncé, pour le comparer au réel dans le bilan
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
      '<div class="pos-right"><b class="pos-pct">' + pctFr(mine.pct, 1) + ' %</b>' + (prev ? '<span class="' + (d >= 0 ? 'up' : 'down') + '">' + (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1).replace('.', ',') + ' pt au dernier tour</span>' : '') +
      (g.bilan && g.bilan.rows[me] ? '<button type="button" class="linkbtn pos-bilan" id="btn-bilan">Pourquoi ? Le bilan</button>' : '') + '</div>' + wearNote() + betaNote();
    var bb = $('btn-bilan'); if (bb) bb.addEventListener('click', function () { modal({ kicker: 'Tour ' + g.bilan.turn, title: 'Ton bilan au sondage', html: bilanHtml(g.bilan), buttons: [{ label: 'Fermer', primary: true }] }); });
    var max = poll[0].pct;
    $('poll-list').innerHTML = poll.map(function (x, i) {
      var P = party(x.pid);
      return '<li><button type="button" class="poll-row' + (x.pid === me ? ' me' : '') + '" data-party="' + x.pid + '"><span class="pr-n">' + (i + 1) + '</span><span class="pr-name">' + (x.pid === me ? 'Toi · ' : '') + esc(P.short) + '</span>' +
        '<span class="pr-bar"><i style="width:' + (100 * x.pct / max) + '%;background:' + P.color + '"></i></span><b>' + pctFr(x.pct, 1) + '</b></button></li>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('[data-party]'), function (b) { b.addEventListener('click', function () { partyCard(b.getAttribute('data-party')); }); });
    renderClassBox();
  }
  /* v4.0.2 : pourquoi ça baisse ? L'effet de tes passages dans les médias s'estompe à chaque tour */
  /* v4.4 : la vague, la démobilisation, les parrainages */
  function betaNote() {
    if (!E.isBeta(g)) return '';
    var h = '', dl = E.dynLabel(g, me), pl = mePl();
    if (dl === 'vague') h += '<p class="pos-note">🌊 <b>La vague</b> : ' + pl.streak + ' tours de hausse d\u2019affilée. Meeting +2 soutiens, médias +30 %.</p>';
    if (dl === 'demob') h += '<p class="pos-note">🥶 <b>Démobilisation</b> : ' + (-pl.streak) + ' tours de baisse. Meeting −1, médias −20 %. Une hausse ce tour-ci casse la spirale.</p>';
    if (pl.sign != null && pl.sign < D.BETA.parr.need && g.turn <= E.parrDeadline(g)) h += '<p class="pos-note">✍️ <b>Parrainages : ' + pl.sign + ' / ' + D.BETA.parr.need + '</b> — sinon éliminé à la fin du tour ' + E.parrDeadline(g) + ' (menu Plus).</p>';
    return h;
  }
  function wearNote() {
    var w = g.lastWear && g.lastWear[me] ? 100 * g.lastWear[me] : 0;
    if (w > -0.1) return '';
    return '<p class="pos-note">📉 Dont <b>' + w.toFixed(1).replace('.', ',').replace('-', '−') + ' pt</b> : l\u2019effet de tes passages dans les médias s\u2019estompe (−15 % par tour). Repasse à la télé ou à la radio pour l\u2019entretenir, ou gagne des régions sur le terrain : ça, ça reste.</p>';
  }
  /* v3.8 : ton score dans chaque classe sociale (profil Ipsos 2024 + ta campagne dans les médias) */
  function renderClassBox() {
    var box = $('class-box'); if (!box) return;
    var cp = E.classPoll(g), prev = g.lastClass;
    box.innerHTML = '<div class="cls-h"><b>Ton score par classe sociale</b><small>dans toute la France</small></div>' + D.SEGMENTS.map(function (sg) {
      var row = cp[sg.id], x = row[me] || 0, lead = Object.keys(row).sort(function (a, b) { return row[b] - row[a]; })[0];
      var d = prev && prev[sg.id] ? x - (prev[sg.id][me] || 0) : 0, a = E.audOf(g, me, sg.id);
      return '<div class="cls-row"><span class="cls-n">' + sg.icon + ' ' + esc(sg.name) + '</span><span class="cls-bar"><i style="width:' + Math.min(100, 100 * x / 0.6) + '%;background:' + party(me).color + '"></i></span>' +
        '<b class="cls-pct">' + pctFr(x, 0) + ' %</b><span class="cls-d ' + (d > 0.0005 ? 'up' : d < -0.0005 ? 'down' : '') + '">' + (Math.abs(d) >= 0.0005 ? (d > 0 ? '↗' : '↘') + Math.abs(100 * d).toFixed(1).replace('.', ',') : '') + '</span>' +
        '<small class="cls-s">' + (lead === me ? 'tu es en tête' : 'en tête : ' + esc(E.sigle(lead)) + ' ' + pctFr(row[lead], 0) + ' %') + (Math.abs(a) >= 0.1 ? ' · 📺 audience ' + (a > 0 ? '+' : '') + a.toFixed(1).replace('.', ',') : '') + '</small></div>';
    }).join('') + '<p class="hint">Les médias (Télé, débat) font gagner des classes sociales partout en France ; le terrain gagne des régions. Point de départ : <a href="' + D.CLASS_SRC.url + '" target="_blank" rel="noopener">' + esc(D.CLASS_SRC.label) + '</a>.</p>';
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
    estCache = {}; hideTip();
    var pl = mePl(), pr = projected();
    $('turn-label').textContent = 'Tour ' + g.turn + ' sur ' + R.maxTurns;
    $('phase-label').textContent = E.isDebateTurn(g) ? 'Débat télévisé ce soir' : '3 actions à jouer';
    function pill(id, sym, now, before, word) { $(id).innerHTML = '<span>' + sym + ' ' + now + (now !== before ? '<small>/' + before + '</small>' : '') + '</span><small class="pill-w">' + word + '</small>'; }
    pill('res-money', '€', pr.money, pl.money, 'argent'); pill('res-infl', '★', pr.infl, pl.infl, 'influence'); pill('res-forme', '⚡', pr.forme, pl.forme, 'énergie');
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
  var mapMode = 'ctrl', mapSeg = 'pop';
  /* ---------- v4.6 : les filtres de carte (à la manière des jeux Paradox) ----------
     Chaque filtre colore les régions selon une donnée, pose une étiquette sur chacune et a sa légende sous la carte. */
  function hexRgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function ramp(stops, t) {
    t = Math.max(0, Math.min(1, t)); var n = stops.length - 1, i = Math.min(n - 1, Math.floor(t * n)), u = t * n - i, a = hexRgb(stops[i]), b = hexRgb(stops[i + 1]);
    return 'rgb(' + a.map(function (v, k) { return Math.round(v + (b[k] - v) * u); }).join(',') + ')';
  }
  var RAMP = { abst: ['#ECE6D6', '#8E86C2', '#2C265C'], hot: ['#D8462F', '#F3B9A4', '#EFEBE3'], meet: ['#EEEDFE', '#AFA9EC', '#534AB7', '#26215C'],
    up: ['#EAF3DE', '#639922', '#27500A'], down: ['#FCEBEB', '#E24B4A', '#791F1F'], seg: ['#F4EFE6', '#C99A5B', '#6B3F12'] };
  var THEME_COL = { pouvoir: '#E0A33A', emploi: '#8A6D5A', services: '#4A90C8', ecologie: '#4E9A5B', securite: '#3E4C7A', immigration: '#B5523B' };
  function myScoreRamp() { var c = party(me).color; return ['#F4F1EA', c]; }
  function regNow(rid) { var sh = E.regionShares(g, rid), k = 1 - E.othersShare(g, rid), o = {}; Object.keys(sh).forEach(function (p) { o[p] = sh[p] * k; }); return o; }
  function top2(rid) { var sh = regNow(rid), ids = Object.keys(sh).sort(function (a, b) { return sh[b] - sh[a]; }); return { a: ids[0], b: ids[1], gap: sh[ids[0]] - sh[ids[1]] }; }
  var LAYERS = [
    { k: 'ctrl', fam: 'Le rapport de force', icon: '🚩', name: 'Qui contrôle', what: 'Le parti qui tient chaque région (le plus de voix, avec assez de soutiens).' },
    { k: 'score', fam: 'Le rapport de force', icon: '🎯', name: 'Ton score', what: 'Ton score dans chaque région, en % des voix. Plus c’est foncé, plus tu es fort.',
      fill: function (rid) { var r = scoreRange(); return ramp(myScoreRamp(), ((regNow(rid)[me] || 0) - r.lo) / Math.max(0.005, r.hi - r.lo)); }, label: function (rid) { var v = regNow(rid)[me] || 0; return pctFr(v, v < 0.1 ? 1 : 0) + '%'; },
      legend: function () { var r = scoreRange(); return gradLeg(myScoreRamp(), pctFr(r.lo) + ' %', pctFr(r.hi) + ' %'); } },
    { k: 'serre', fam: 'Le rapport de force', icon: '⚖️', name: 'Course serrée', what: 'L’écart entre le 1er et le 2e. Rouge : la région peut basculer avec peu de soutiens.',
      fill: function (rid) { return ramp(RAMP.hot, top2(rid).gap / 0.3); }, label: function (rid) { return pctFr(top2(rid).gap) + ' pt'; },
      legend: function () { return gradLeg(RAMP.hot, 'serré', 'joué d’avance'); } },
    { k: 'prog', fam: 'La dynamique', icon: '📈', name: 'Progression', what: 'Ce que tu as gagné ou perdu dans chaque région au dernier tour.',
      fill: function (rid) { var d = progOf(rid); return d == null ? '#EFEBE3' : d > 0.0005 ? ramp(RAMP.up, d / 0.05) : d < -0.0005 ? ramp(RAMP.down, -d / 0.03) : '#EFEBE3'; },
      label: function (rid) { var d = progOf(rid); return d == null ? '—' : Math.abs(d) < 0.0005 ? '=' : ptNum(d); },
      legend: function () { return g.regPrev ? gradLeg([RAMP.down[1], '#EFEBE3', RAMP.up[1]], 'baisse', 'hausse') : '<span>Rien à comparer avant la fin du 1er tour.</span>'; } },
    { k: 'abst', fam: 'Le terrain', icon: '🛋️', name: 'Abstention', what: 'La part des inscrits qui ne votent pas. Là où elle est forte, Mobiliser rapporte plus.',
      fill: function (rid) { return ramp(RAMP.abst, (E.regionVoters(g, rid).abst - 0.18) / 0.34); }, label: function (rid) { return pctFr(E.regionVoters(g, rid).abst) + '%'; },
      legend: function () { return gradLeg(RAMP.abst, 'on vote', 'on s’abstient'); } },
    { k: 'classe', fam: 'Le terrain', icon: '👥', name: 'Classe sociale', what: 'La part d’une classe sociale dans la population de chaque région.',
      fill: function (rid) { var r = segRange(); return ramp(RAMP.seg, (segShare(rid) - r.lo) / Math.max(1, r.hi - r.lo)); }, label: function (rid) { return Math.round(E.REG[rid].pop[mapSeg]) + '%'; },
      legend: function () { return '<span class="ml-segs">' + D.SEGMENTS.map(function (sg) { return '<button type="button" data-seg="' + sg.id + '" class="' + (sg.id === mapSeg ? 'on' : '') + '">' + sg.icon + ' ' + SEG_SHORT[sg.id] + '</button>'; }).join('') + '</span>'; } },
    { k: 'theme', fam: 'Le terrain', icon: '🔥', name: 'Préoccupation', what: 'Le sujet qui compte le plus pour les habitants de chaque région.',
      fill: function (rid) { return THEME_COL[E.REG[rid].concerns[0]] || '#ccc'; }, label: function (rid) { return th(E.REG[rid].concerns[0]).icon; }, dark: true,
      legend: function () { return D.THEMES.map(function (t) { return '<span class="ml-key"><i style="background:' + THEME_COL[t.id] + '"></i>' + t.icon + ' ' + esc(t.short) + '</span>'; }).join(''); } },
    { k: 'accueil', fam: 'Le terrain', icon: '❤️', name: 'Accueil de ton programme', what: 'Régions de cœur (+1 soutien sur tes Meetings) et régions hostiles (−1).',
      fill: function (rid) { var e = E.echoBonus(g, me, rid); return e > 0 ? '#4E9A5B' : e < 0 ? '#C0503C' : '#DCD6CA'; },
      label: function (rid) { var e = E.echoBonus(g, me, rid); return e > 0 ? 'cœur' : e < 0 ? 'hostile' : 'moyen'; },
      legend: function () { return '<span class="ml-key"><i style="background:#4E9A5B"></i>de cœur</span><span class="ml-key"><i style="background:#DCD6CA"></i>moyen</span><span class="ml-key"><i style="background:#C0503C"></i>hostile</span>'; } },
    { k: 'meet', fam: 'Où faire campagne', icon: '📣', name: 'Rendement d’un Meeting', what: 'Ce qu’un Meeting rapporterait à ton score national, ici et maintenant (avec ton message actuel).',
      fill: function (rid) { var e = meetPt(rid); return e == null ? '#DCD6CA' : ramp(RAMP.meet, e / meetMax()); }, label: function (rid) { var e = meetPt(rid); return e == null ? '—' : ptNum(e); },
      legend: function () { return gradLeg(RAMP.meet, 'rapporte peu', 'rapporte le plus'); } }
  ];
  var LAYER = {}; LAYERS.forEach(function (l) { LAYER[l.k] = l; });
  function gradLeg(stops, l, r) { return '<span>' + l + '</span><i class="ml-bar" style="background:linear-gradient(90deg,' + stops.join(',') + ')"></i><span>' + r + '</span>'; }
  function progOf(rid) { if (!g.regPrev || !g.regNow) return null; return ((g.regNow[rid] || {})[me] || 0) - ((g.regPrev[rid] || {})[me] || 0); }
  function segShare(rid) { return E.REG[rid].pop[mapSeg] || 0; }
  var SEG_SHORT = { ind: 'Indépendants', cad: 'Cadres', pi: 'Intermédiaires', pop: 'Ouvriers, employés', ret: 'Retraités', sae: 'Sans emploi' };
  function segRange() { var lo = 100, hi = 0; D.REGIONS.forEach(function (r) { var v = r.pop[mapSeg] || 0; lo = Math.min(lo, v); hi = Math.max(hi, v); }); return { lo: lo, hi: hi }; }
  function scoreRange() { var lo = 1, hi = 0; D.REGIONS.forEach(function (r) { var v = regNow(r.id)[me] || 0; lo = Math.min(lo, v); hi = Math.max(hi, v); }); return { lo: lo, hi: hi }; }
  function meetTheme(rid) { return themePicked && theme ? theme : E.bestTheme(g, me, rid); }
  function meetPt(rid) { if (g.phase !== 'actions') return null; var e = est({ type: 'terrain', region: rid, theme: meetTheme(rid) }); return e ? e.pt : null; }
  function meetMax() { var m = 0.001; D.REGIONS.forEach(function (r) { var e = meetPt(r.id); if (e != null) m = Math.max(m, e); }); return m; }
  function lumOf(c) { var v = c.charAt(0) === '#' ? hexRgb(c) : c.match(/\d+/g).map(Number); return (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) / 255; }
  function renderLegend() {
    var L = LAYER[mapMode], box = $('map-legend');
    $('map-filter-name').textContent = L.name;
    if (!L.legend) { box.innerHTML = ''; box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = L.legend();
    Array.prototype.forEach.call(box.querySelectorAll('[data-seg]'), function (b) { b.addEventListener('click', function () { mapSeg = b.getAttribute('data-seg'); renderMap(); }); });
  }
  function mapFilterMenu() {
    var fams = [];
    LAYERS.forEach(function (l) { if (fams.indexOf(l.fam) < 0) fams.push(l.fam); });
    var html = fams.map(function (f) {
      return '<div class="kicker">' + esc(f) + '</div><div class="pick">' + LAYERS.filter(function (l) { return l.fam === f; }).map(function (l) {
        return '<button type="button" class="pick-row' + (l.k === mapMode ? ' on' : '') + '" data-layer="' + l.k + '"><span class="pick-i">' + l.icon + '</span><span class="pick-txt"><b>' + esc(l.name) + '</b><small>' + esc(l.what) + '</small></span></button>';
      }).join('') + '</div>';
    }).join('');
    modal({ kicker: 'La carte', title: 'Que veux-tu voir ?', html: html, buttons: [{ label: 'Fermer' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('#modal [data-layer]'), function (b) {
          b.addEventListener('click', function () { mapMode = b.getAttribute('data-layer'); closeModal(); if (g) renderMap(); });
        });
      } });
  }
  $('btn-map-filter').addEventListener('click', mapFilterMenu);
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
        if (mapMode === 'ctrl') FX.ripple($('map'), m.x, m.y, k.to, k.mine);
        FX.tween(950, function (t) { k.p = t; FX.inkSet(rid, t); }, function () {
          if (ink[rid] === k) delete ink[rid];
          if (!Object.keys(ink).length && g && !replaying) renderMap();
        });
      });
    });
  }
  function renderMap() {
    var s = $('map'); s.innerHTML = '';
    var L = LAYER[mapMode] || LAYER.ctrl, abstMode = mapMode !== 'ctrl';   // v4.6 : abstMode = « un filtre autre que le contrôle »
    $('map-wrap').classList.toggle('mode-abst', abstMode);
    renderLegend();
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
      var fill = abstMode ? L.fill(r.id) : k ? k.from : c ? party(c).color : NEUTRAL;
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
      var label = abstMode ? L.label(r.id) : ctl === me ? 'Toi' : ctl ? E.sigle(ctl) : '—';
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
    if (candPos) { var pp = pawnPt(candPos); pawnEl = FX.pawn(s, pp.x, pp.y, A.portrait(me), party(me).color); }
  }
  function selectRegion(rid) {
    selected = rid;
    if (!themePicked) theme = E.bestTheme(g, me, rid);
    render(); T.notify('region');
  }
  /* v1.8 : la fiche de la région, en version courte. Le détail (soucis, forces, calcul) s'ouvre dans « Détails ». */
  function rankIn(rid, pid) {
    if (g.hist) { var sh = E.regionShares(g, rid); return 1 + g.players.filter(function (p) { return p.id !== pid && sh[p.id] > sh[pid]; }).length; }   // v3.5.4 : en Réaliste, le rang suit les voix
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
    // v4.7 : épuré : le nom (on le touche pour la fiche complète) et ce qui préoccupe les habitants, rien d'autre
    var echo = E.echoBonus(g, me, selected);
    box.innerHTML = '<div class="region-head"><button type="button" class="region-name region-btn" id="btn-reg-more" aria-label="Fiche de la région">' + esc(r.name) + ' <span class="reg-chev">›</span></button>' +
      (echo > 0 ? '<span class="chip chip-good">❤️ De cœur</span>' : echo < 0 ? '<span class="chip chip-bad">👎 Hostile</span>' : '') + tag + '</div>' +
      '<div class="region-concerns"><span>Ce qui les préoccupe :</span>' + concernsHtml(selected) + '</div>';
    $('btn-reg-more').addEventListener('click', regionDetails);
  }
  function regionDetails() {
    if (!selected) return;
    var r = E.REG[selected];
    var v0 = E.regionVoters(g, selected), rk0 = rankIn(selected, me), n0 = E.cubes(g, selected, me);
    var html = '<p class="reg-facts">' + mio(v0.ins) + ' M inscrits · ' + pctFr(v0.abst) + ' % d\'abstention · pèse ' + pctTxt(regionShare(selected)) + ' des votants · tu es <b>' + rk0 + (rk0 === 1 ? 'er' : 'ᵉ') + '</b> ici (' + n0 + ' soutien' + (n0 > 1 ? 's' : '') + ')</p>' +
      '<div class="chips"><span class="chips-k">Soucis</span>' + r.concerns.map(function (x) { return '<span class="chip chip-theme' + (E.isHot(g, x) ? ' hot' : '') + '">' + th(x).icon + ' ' + esc(th(x).short) + (E.isHot(g, x) ? ' 🔥' : '') + '</span>'; }).join('') + '</div>';
    var real = !!g.weight;   // v3.2 : en Réaliste, chaque soutien pèse selon le score historique du parti ici
    if (real) {
      var ln = E.regionLean(g.base, selected), myW = E.weight(g, selected, me);
      html += '<div class="calc-line">🧭 <b>' + esc(ln.label) + '</b> · gauche ' + Math.round(100 * ln.g) + ' % · centre ' + Math.round(100 * ln.c) + ' % · droite ' + Math.round(100 * ln.d) + ' % <span class="muted">(' + esc(D.BASES[g.base].short) + ')</span><br>' +
        (myW >= 1.15 ? '💪 Terrain favorable : chacun de tes soutiens pèse lourd ici.' : myW <= 0.6 ? '🪶 Terrain difficile : tes soutiens pèsent peu ici, ton électorat historique y est faible.' : '⚖️ Tes soutiens pèsent normalement ici.') + '</div>';
    }
    // v4.9.4 : la même intention de vote que les info-bulles (part des voix exprimées, « autres » compris)
    var sh = null; if (real) { sh = {}; g.players.forEach(function (p) { sh[p.id] = E.regScore(g, selected, p.id); }); }
    var rows = g.players.filter(function (p) { return E.cubes(g, selected, p.id) > 0; }).sort(function (a, b) { return real ? sh[b.id] - sh[a.id] : E.cubes(g, selected, b.id) - E.cubes(g, selected, a.id); });
    if (real) rows = rows.slice(0, 6);
    html += '<div class="kicker">Qui mène ici</div><div class="brief">' + rows.map(function (p, i) {
      var nn = E.cubes(g, selected, p.id), bar = real ? Math.min(100, 100 * sh[p.id] / Math.max(0.01, sh[rows[0].id])) : 10 * nn;
      return '<div class="vote-row' + (p.id === me ? ' qual' : '') + '"><span class="vote-lbl">' + chip(p.id) + (p.id === me ? 'Toi' : esc(party(p.id).short)) + '</span><span class="vote-bar"><i style="width:' + bar + '%;background:' + party(p.id).color + '"></i></span><b>' + (real ? pctFr(sh[p.id], 1) + ' %' : nn) + '</b></div>';
    }).join('') + '</div>';
    var c = g.regions[selected].controller, need = 0;
    if (c !== me) {
      if (real) {   // v3.5.4 : combien de soutiens pour passer devant en voix (socle compris) ?
        var c0 = g.regions[selected].cubes[me] || 0, byStr = 99;
        for (var k = 1; k <= R.maxCubes - c0; k++) {
          g.regions[selected].cubes[me] = c0 + k;
          var cs = E.controlShares(g, selected), lead = g.players.every(function (p) { return p.id === me || cs[me] > cs[p.id]; });
          if (lead) { byStr = k; break; }
        }
        g.regions[selected].cubes[me] = c0;
        need = Math.max(E.minControl(me) - 1 - c0, byStr);
      } else { var top = rows.length ? E.cubes(g, selected, rows[0].id) : 0; need = Math.max(E.minControl(me), top + 1) - E.cubes(g, selected, me); }
    }
    if (need > R.maxCubes - E.cubes(g, selected, me)) html += '<p>Prendre cette région est <b>hors de portée</b> pour l\u2019instant. Chaque soutien compte quand même pour tes voix.</p>';
    else if (need > 0) html += '<p>Il te manque <b>' + need + ' soutien' + (need > 1 ? 's' : '') + '</b> pour prendre la région (au moins ' + (E.minControl(me) - (real ? 1 : 0)) + ' et être devant tout le monde).</p>';
    if ((g.bases[selected] || []).indexOf(me) >= 0) html += '<p>👥 Tes militants sont implantés ici : +1 électeur par tour.</p>';
    var bd = E.terrainBreakdown(g, me, selected, theme), room = R.maxCubes - E.cubes(g, selected, me);
    html += '<div class="calc-line">📣 Meeting ici : ' + bd.parts.map(function (x, i) { return x.k === 'base' ? 'message ' + IMPACT_WORD[E.impact(g, me, selected, theme)] + ' <b>' + x.n + '</b>' : (x.n >= 0 ? ' + ' : ' − ') + esc(x.label) + ' <b>' + Math.abs(x.n) + '</b>'; }).join('') +
      ' = ' + bd.total + ' soutien' + (bd.total > 1 ? 's' : '') + (function () { var m = estRange({ type: 'terrain', region: selected, theme: theme }); return m ? ' → <b>' + m.txt + ' au sondage</b>' : ''; })() + '<br><span class="muted">La région pèse ' + pctTxt(regionShare(selected)) + ' des votants de France.</span>' + (E.poachTarget(g, me, selected, true) ? ' <span class="muted">· et peut-être 1 électeur pris à un parti voisin</span>' : '') + (room < bd.total ? ' <span class="calc-warn">(plafond : +' + Math.max(0, room) + ' seulement)</span>' : '') + '</div>';
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
      var sub = (a.reply ? D.ANSWERS[a.reply].icon + ' ' : a.theme ? th(a.theme).icon + ' ' : '') + (a.station ? D.STATIONS.filter(function (s) { return s.id === a.station; })[0].name : a.region ? SHORT[a.region] : a.target ? E.sigle(a.target) : a.theme ? th(a.theme).short : '✕ retirer');
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
    return c.forme > 0 && projected().forme - c.forme <= E.gaffeLimit(g, me);   // v4.8 : un gaffeur dérape dès 1 ⚡
  }
  /* Ce que fait une action, en clair, sur son bouton (avec les chiffres réels du moment) */
  var PROF_PLURAL = { urbaine: 'urbaines', rurale: 'rurales', industrielle: 'industrielles', historique: 'historiques' };
  function effect(act) {
    var r = act.region, n;
    switch (act.type) {
      case 'terrain':
        if (!r) return 'des soutiens dans 1 région';
        n = E.terrainCubes(g, me, r, act.theme); return '<b>+' + n + ' soutien' + (n > 1 ? 's' : '') + '</b> ici';
      case 'medias': return 'une interview : <b>des classes sociales</b> dans toute la France';
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
  /* ---------- v4.5 : une seule unité à l'écran, le point de sondage ---------- */
  var estCache = {};
  function ptNum(x) { var v = Math.round(1000 * x) / 10; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1).replace('.', ','); }
  function ptStr(x) { return Math.abs(x) < 0.0005 ? '0 pt' : ptNum(x) + ' pt'; }
  /* Ce que l'action rapporterait au sondage national, jouée après celles déjà programmées (null si impossible) */
  function est(act, luck) {
    var k = JSON.stringify(act) + '|' + JSON.stringify(queue) + '|' + g.turn + '|' + (luck == null ? 'h' : luck);
    if (!(k in estCache)) estCache[k] = E.estimate(g, me, act, queue.filter(function (a) { return a !== act; }), luck);
    return estCache[k];
  }
  /* Le texte court : « +0,3 pt », ou une fourchette si le hasard s'en mêle */
  function estRange(act) {
    var hi = est(act), lo = act.type === 'reseaux' ? est(act, 0) : hi;
    if (!hi) return null;
    if (lo && Math.abs(hi.pt - lo.pt) >= 0.0005) return { lo: lo.pt, hi: hi.pt, txt: ptNum(Math.min(lo.pt, hi.pt)) + ' à ' + ptNum(Math.max(lo.pt, hi.pt)) + ' pt' };
    return { lo: hi.pt, hi: hi.pt, txt: ptStr(hi.pt), moved: hi.moved };
  }
  /* v4.9.2 : une seule unité, le % d'intention de vote, à deux échelles :
     🟢 vert = dans la région (Meeting, Mobiliser…) · 🔵 bleu = dans toute la France (médias, score national). */
  function estReg(act) { var x = est(act); return x && x.reg ? x.reg : null; }
  function regNum(d) { var v = Math.round(1000 * d) / 10; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1).replace('.', ','); }
  function regStr(d) { return regNum(d) + ' pts'; }
  function regLine(r) { return r ? pctFr(r.before, 1) + ' % → ' + pctFr(r.after, 1) + ' % (' + regStr(r.d) + ')' : ''; }
  /* Le poids d'une région : sa part des électeurs qui votent en France */
  function regionShare(rid) { return E.regionVoters(g, rid).exprimes / E.turnoutStats(g).exprimes; }
  function pctTxt(x) { var v = 100 * x; return (v < 1 ? v.toFixed(1) : Math.round(v)).toString().replace('.', ',') + ' %'; }
  var IMPACT_WORD = ['faible', 'faible', 'moyen', 'fort', 'très fort'];
  function impactWord(n) { return 'Message ' + IMPACT_WORD[Math.max(0, Math.min(4, n))]; }
  /* « Comment c'est calculé ? » : la chaîne de calcul de chaque action principale, en mots */
  function howModal() {
    var h = '<p>Tous les chiffres du jeu sont des <b>% d’intention de vote</b>, <b>en France</b> : chaque action affiche ce qu’elle te fait gagner au sondage national, celui qui décide de l’élection.</p>' +
      '<p>Une action en région rapporte selon le poids de cette région parmi les votants de France. Les rivaux jouent en même temps : leur progression fait baisser ta part.</p>' +
      '<p class="hint">Sous le capot, le jeu compte des <b>soutiens</b> (les électeurs que tu gagnes) : ce sont eux qui font bouger les %. Le détail est ci-dessous.</p>';
    var r = selected, thm = theme || E.bestTheme(g, me, r || null);
    if (r) {
      var bd = E.terrainBreakdown(g, me, r, thm), m = estRange({ type: 'terrain', region: r, theme: thm }), w = E.weight(g, r, me);
      h += '<div class="how"><b>📣 Meeting en ' + esc(E.REG[r].name) + '</b><ol>' +
        '<li>Ton message (' + th(thm).icon + ' ' + esc(th(thm).name) + ') est <b>' + IMPACT_WORD[E.impact(g, me, r, thm)] + '</b> ici : ta crédibilité sur le sujet, + si la région s’en préoccupe, + s’il fait l’actu.</li>' +
        '<li>Il te rapporte <b>' + bd.total + ' soutien' + (bd.total > 1 ? 's' : '') + '</b> (' + bd.parts.map(function (x) { return x.k === 'base' ? 'message ' + IMPACT_WORD[E.impact(g, me, r, thm)] + ' : ' + x.n : esc(x.label) + ' ' + (x.n > 0 ? '+' : '') + x.n; }).join(', ') + ').</li>' +
        (g.weight ? '<li>Un soutien pèse selon ton électorat historique ici : <b>' + (w >= 1.15 ? 'terrain favorable, il pèse lourd' : w <= 0.6 ? 'terrain difficile, il pèse peu' : 'poids normal') + '</b>. Plus tu as déjà de soutiens, moins le suivant ajoute.</li>' : '') +
        (function () { var ci = E.crowdInfo(g, r); return ci && ci.now > ci.start ? '<li>🏟️ <b>Salle comble</b> : la région compte ' + ci.now + ' soutiens tous partis confondus (' + ci.start + ' au début). Chaque soutien y pèse moins qu\u2019au départ, mais ton Meeting rassemble plus de monde : ' + (E.crowdBonus(g, r, bd.parts[0].n) ? '<b>+' + E.crowdBonus(g, r, bd.parts[0].n) + '</b> soutiens.' : 'pas encore de bonus.') + '</li>' : ''; })() +
        '<li>La région représente <b>' + pctTxt(regionShare(r)) + ' des votants</b> de France.</li>' +
        '<li>Résultat : <b>' + (m ? m.txt : 'impossible ici') + '</b> au sondage national.</li></ol></div>';
      var mg = E.mobilizeGain(g, me, r), mo = estRange({ type: 'mobiliser', region: r });
      h += '<div class="how"><b>🚪 Mobiliser en ' + esc(E.REG[r].name) + '</b><ol>' +
        '<li>Tu vas chercher des abstentionnistes : <b>' + mg.n + ' soutien' + (mg.n > 1 ? 's' : '') + '</b>' + (mg.why.length ? ' (' + mg.why.map(esc).join(', ') + ')' : '') + ', et l’abstention baisse ici.</li>' +
        '<li>Ces nouveaux votants ne sont pris à personne : ils grossissent ton paquet de voix.</li>' +
        '<li>Résultat : <b>' + (mo ? mo.txt : 'impossible ici') + '</b> au sondage national.</li></ol></div>';
    } else h += '<p class="hint">Touche une région pour voir le calcul du Meeting et de Mobiliser là-bas.</p>';
    h += '<div class="how"><b>📺 Médias (télé, radio, 20 h, débat)</b><ol>' +
      '<li>Pas de région : ta réponse touche des <b>classes sociales dans toute la France</b>.</li>' +
      '<li>Une réponse qui joue sur l’émotion (le <b>cœur</b>) parle surtout aux employés, ouvriers et sans-emploi ; une réponse sur les chiffres et le programme (la <b>tête</b>) aux cadres et retraités.</li>' +
      '<li>Chaque réponse affiche son effet en points avant que tu choisisses.</li>' +
      '<li>L’effet <b>s’estompe de 15 % par tour</b> : il faut repasser dans les médias pour le garder. Le terrain, lui, reste.</li></ol></div>';
    modal({ kicker: 'Comment c’est calculé ?', title: 'Tout se joue au sondage', html: h, buttons: [{ label: 'Compris', primary: true }] });
  }
  function impactDots(n) { var h = ''; for (var i = 0; i < 4; i++) h += '<i class="' + (i < n ? 'on' : '') + '"></i>'; return '<span class="imp">' + h + '</span>'; }
  function renderMessage() {
    var b = $('message'), t = th(theme);
    b.innerHTML = '<span class="msg-k">Message</span><span class="msg-t">' + t.icon + ' ' + esc(t.name) + (E.isHot(g, theme) ? ' 🔥' : '') + '</span>' +
      (selected ? '<span class="msg-w">· ' + IMPACT_WORD[E.impact(g, me, selected, theme)] + '</span>' : '') + '<span class="msg-change">▾</span>';
  }
  $('btn-how').addEventListener('click', function () { if (g) howModal(); });
  $('message').addEventListener('click', function () {
    if (!g || g.phase !== 'actions') return;
    var list = D.THEMES.map(function (t) { return { t: t, imp: E.impact(g, me, selected, t.id) }; })
      .sort(function (a, b) { return b.imp - a.imp; });
    var html = '<p class="hint">Plus le message est fort, plus ton Meeting rapporte.' + (selected ? ' Ici, en ' + esc(E.REG[selected].name) + ', ce que rapporterait un Meeting :' : '') + '</p><div class="pick">' +
      list.map(function (x) {
        var why = [];
        var c = E.cred(g, me, x.t.id); why.push(['pas ton sujet', 'tu es crédible', 'ton point fort'][c]);
        if (c < 2) { var left = R.credTalk - (mePl().talk[x.t.id] || 0); why.push('encore ' + left + ' action' + (left > 1 ? 's' : '') + ' pour progresser'); }
        if (selected && E.concerns(selected, x.t.id)) why.push('la région s\'en soucie');
        var mk = selected && E.markerAt(g, selected, x.t.id);
        if (E.isHot(g, x.t.id)) why.push('🔥 à la une');
        else if (mk) why.push(mk.icon + ' sujet brûlant ici');
        return '<button type="button" class="pick-row' + (x.t.id === theme ? ' on' : '') + '" data-theme="' + x.t.id + '"><span class="pick-i">' + x.t.icon + '</span>' +
          '<span class="pick-txt"><b>' + esc(x.t.name) + '</b><small>' + IMPACT_WORD[x.imp] + ' · ' + why.join(' · ') + '</small></span>' + (selected ? (function () { var m = estRange({ type: 'terrain', region: selected, theme: x.t.id }); return '<span class="pick-cost pick-pt">' + (m ? m.txt : '—') + '</span>'; })() : '') + '</button>';
      }).join('') + '</div>';
    modal({ kicker: 'Ton message', title: 'De quoi parles-tu ?', html: html, buttons: [{ label: 'Fermer' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('.pick-row'), function (row) {
          row.addEventListener('click', function () { theme = row.getAttribute('data-theme'); themePicked = true; closeModal(); render(); T.notify('theme'); });
        });
      } });
  });
  /* v4.7 : l'appui long (ou le survol à la souris) montre le détail d'une action ; un appui court la joue */
  var tipEl = null;
  function showTip(anchor, html) {
    hideTip();
    tipEl = el('div', { class: 'hold-tip', role: 'tooltip' }, html);
    document.body.appendChild(tipEl);
    var r = anchor.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    var x = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)), y = r.top - h - 8;
    if (y < 8) y = r.bottom + 8;
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  }
  function hideTip() { if (tipEl) { tipEl.remove(); tipEl = null; } }
  function holdTip(btn, html, act) {
    var timer = null, shown = false, startX = 0, startY = 0, moved = false;
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    btn.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      shown = false; moved = false; startX = e.clientX; startY = e.clientY;
      clearTimeout(timer);
      if (e.pointerType !== 'mouse') timer = setTimeout(function () { shown = true; showTip(btn, html()); if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) {} }, 380);
    });
    btn.addEventListener('pointermove', function (e) { if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 12) { moved = true; clearTimeout(timer); } });
    btn.addEventListener('pointerup', function () {
      clearTimeout(timer);
      if (shown) { hideTip(); shown = false; return; }
      if (!moved && !btn.disabled) act();
    });
    btn.addEventListener('pointercancel', function () { clearTimeout(timer); hideTip(); shown = false; });
    btn.addEventListener('mouseenter', function () { clearTimeout(btn._hov); btn._hov = setTimeout(function () { showTip(btn, html()); }, 300); });
    btn.addEventListener('mouseleave', function () { clearTimeout(btn._hov); hideTip(); });
    btn.addEventListener('click', function (e) { if (e.detail === 0) act(); });   // clavier (Entrée, Espace)
  }
  var MAIN = ['terrain', 'medias', 'mobiliser'];
  function renderActions() {
    var box = $('actions'); box.innerHTML = '';
    MAIN.forEach(function (type) {
      var def = D.ACTIONS[type], tv = type === 'medias', act = { type: type, region: tv ? undefined : selected || undefined, theme: def.theme ? (theme || (tv ? E.bestTheme(g, me, selected || null) : undefined)) : undefined };
      var on = selected || tv;   // v3.8 : la Télé ne vise plus une région
      // v4.5 : le gros chiffre = les points de sondage ; le détail (soutiens, où) en petit dessous
      // v4.9.2 : action en région → gain d'intention de vote DANS la région (vert) ; médias → gain en France (bleu)
      var big = '—', sub = tv ? 'toute la France' : 'touche une région', scope = tv ? ' tile-nat' : ' tile-reg';
      if (tv) { big = '+' + teleEstimate(act.theme); sub = 'France'; }
      else if (on) {
        // v4.9.4 : le gros chiffre = le gain en France (bleu, le même que sur la carte et le bilan) ; le gain « dans la région » (+22…) ne s'affiche plus
        var e = estRange(act);
        big = e ? ptNum(e.hi) + '<small>pt</small>' : '—'; scope = ' tile-nat';
        sub = e ? 'France' : 'impossible ici';
      }
      var warn = on && tiring(act) && !canQueue(act), poor = on && /argent|influence|épuisé/.test(canQueue(act) || '');
      var b = el('button', { class: 'tile tile-min', type: 'button', 'data-act': type, 'aria-label': def.name + ', ' + costLabel(act) + '. Reste appuyé pour le détail.' },
        '<span class="tile-n">' + def.icon + ' ' + (tv ? 'Médias' : def.name) + '</span><span class="tile-big' + (on ? ' tile-pt' + scope : '') + '">' + big + '</span><span class="tile-sub">' + (on ? sub : 'choisis une région') + '</span>' +
        (warn ? '<span class="tile-flag" aria-hidden="true">⚠️</span>' : poor ? '<span class="tile-flag" aria-hidden="true">€</span>' : ''));
      if (!on) b.disabled = true;
      else if (canQueue(act)) b.classList.add('dim');
      (function (act0, tv0, sub0, warn0) {
        holdTip(b, function () {
          var c = canQueue(act0);
          return '<b>' + def.icon + ' ' + (tv0 ? 'Médias' : esc(def.name)) + '</b>' +
            (tv0 ? '<span>Une interview : des électeurs dans toute la France. Jusqu\u2019à <b class="c-nat">' + teleEstimate(act0.theme).replace(/<[^>]+>/g, ' ').trim() + '</b> d\u2019intention de vote en France.</span>' :
              (function () { var e = estRange(act0); return '<span>🔵 En France : <b class="c-nat">' + (e ? e.txt : '—') + '</b></span>' + (selected ? '<span>La région pèse ' + pctTxt(regionShare(selected)) + ' des votants de France</span>' : ''); })()) +
            '<span>Coût : ' + esc(costLabel(act0)) + '</span>' +
            (warn0 ? '<span class="tip-warn">Ton énergie tomberait à 0 : 4 chances sur 10 de faire une gaffe.</span>' : c ? '<span class="tip-warn">' + esc(c) + '</span>' : '') +
            '<small>Touche pour l\u2019ajouter · ⓘ pour le calcul</small>';
        }, function () { if (tv0) mediaMenu(act0.theme); else addAction(act0); });
      })(act, tv, sub, warn);
      box.appendChild(b);
    });
    var more = el('button', { class: 'tile tile-more tile-min', type: 'button', id: 'btn-more' }, '<span class="tile-n">Plus</span><span class="tile-big">' + (projected().forme <= 1 ? '😴' : '⋯') + '</span><span class="tile-sub">' + (projected().forme <= 1 ? 'repos dispo' : '8 actions') + '</span>');
    if (projected().forme <= 1) more.classList.add('tile-rest');   // v3.6.6 : candidat fatigué, le repos est dans « Plus »
    more.addEventListener('click', moreMenu);
    box.appendChild(more);

  }
  /* ---------- v3.8 : la Télé, une interview en direct ---------- */
  var SEGBY = {}; D.SEGMENTS.forEach(function (s) { SEGBY[s.id] = s; });
  function ptFr(x) { return (x >= 0 ? '+' : '−') + Math.abs(100 * x).toFixed(1).replace('.', ','); }
  function teleQuestion(thm) { return E.pickQuestion(g, thm, queue.filter(function (a) { return a.type === 'medias'; }).length + 97); }
  function teleEstimate(thm) {
    var iv = E.interview(g, me, teleQuestion(thm).id, 'tele'), best = 0;
    iv.cards.forEach(function (c) { best = Math.max(best, E.previewGain(g, me, c.gains)); });
    return Math.abs(100 * best).toFixed(1).replace('.', ',') + '<small>pt</small>';
  }
  function answerCard(c, extra) {
    // v4.5 : en mots, qui la réponse touche (et qui elle fâche) ; le seul chiffre, ce sont les points de sondage (extra)
    var pos = E.SEG.filter(function (k) { return c.gains[k] > 0; }).sort(function (a, b) { return c.gains[b] - c.gains[a]; }).slice(0, 2);
    var neg = E.SEG.filter(function (k) { return c.gains[k] < 0; }).sort(function (a, b) { return c.gains[a] - c.gains[b]; }).slice(0, 2);
    var nm = function (k) { return esc(SEGBY[k].name.toLowerCase()); };
    var reg = c.heart && !c.head ? 'Joue sur l’émotion' : c.head && !c.heart ? 'Joue sur les chiffres' : c.heart && c.head ? 'Émotion et chiffres' : '';
    return '<span class="ans-h"><span class="ans-i">' + c.icon + '</span><b>' + esc(c.name) + '</b>' + (extra || '') + '</span>' +
      '<q class="ans-q">' + esc(c.quote) + '</q>' +
      '<span class="ans-who">' + (reg ? reg + ' · ' : '') + (pos.length ? 'plaît surtout aux <b>' + pos.map(nm).join(' et ') + '</b>' : 'ne convainc personne') + (neg.length ? ' · fâche les ' + neg.map(nm).join(' et ') : '') + '</span>' +
      (c.notes.length ? '<small class="ans-n">' + c.notes.map(noteTxt).join(' · ') + '</small>' : '');
  }
  /* « +1 ❤️ c'est ton registre » → « bonus : c'est ton registre » (plus d'icônes à décoder) */
  function noteTxt(n) {
    var m = /^([+−-])\s*\d+(?:[.,]\d+)?\s*(?:❤️|🧠)\s*/.exec(n);
    return esc(m ? (m[1] === '+' ? 'bonus : ' : 'malus : ') + n.slice(m[0].length) : n.replace(/❤️/g, 'émotion').replace(/🧠/g, 'chiffres'));
  }
  function tvSet(kicker, iv, host, cls) {
    var t = th(iv.q.theme);
    return '<div class="tvset' + (cls ? ' ' + cls : '') + '"><div class="tvset-top"><span class="tv-live">● EN DIRECT</span><span>' + esc(kicker) + '</span></div>' +
      '<div class="tvset-q"><span class="tvset-chip">' + t.icon + ' ' + esc(t.name) + '</span><p>« ' + esc(iv.q.ask) + ' »</p><small>' + esc(host) + '</small></div></div>';
  }
  /* v3.9 : une interview (Télé, Matinale, 20 h) : la question, tes 4 réponses et ce qu'elles rapportent */
  function interviewModal(o) {
    var q = teleQuestion(o.theme), iv = E.interview(g, me, q.id, o.fmt, o.station ? E.stationBoost(me, o.station) : null);
    var html = tvSet(o.kicker, iv, o.host, o.cls) + (o.intro || '') + '<div class="ans-k">Ta réponse</div><div class="ans-list">' + iv.cards.map(function (c, i) {
      return '<button type="button" class="ans" data-i="' + i + '">' + answerCard(c, '<b class="ans-pt">' + ptStr(E.previewGain(g, me, c.gains)) + '</b>') + '</button>';
    }).join('') + '</div><p class="hint">Le chiffre = ce que la réponse rapporte à ton score au sondage national. Elle agit dans <b>toute la France</b>, sur les classes sociales qu\u2019elle touche, et son effet s\u2019estompe de 15 % par tour.</p>';
    var act0 = { type: o.type, theme: q.theme, station: o.station };
    modal({ kicker: costLabel(act0) + ' · 1 action', title: o.title || 'Que réponds-tu ?', cls: 'tv-modal', html: html, buttons: [{ label: 'Annuler' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('#modal .ans'), function (b) {
          b.addEventListener('click', function () { var c = iv.cards[+b.getAttribute('data-i')]; closeModal(); addAction(Object.assign({}, act0, { qid: q.id, reply: c.key })); });
        });
      } });
  }
  /* v4.0.2 : le bouton Médias : Télé, Matinale radio et 20 h au même endroit */
  function mediaMenu(thm) {
    var tErr = canQueue({ type: 'medias', theme: thm });
    var mErr = E.matinaleError(g, me) || (queue.some(function (q) { return q.type === 'matinale'; }) ? 'Déjà programmée ce tour.' : canQueue({ type: 'matinale', theme: thm, station: 'rmc' }));
    var vErr = E.vingtError(g, me) || (queue.some(function (q) { return q.type === 'vingt'; }) ? 'Déjà programmé ce tour.' : canQueue({ type: 'vingt', theme: thm }));
    var rows = [
      { k: 'tele', icon: '📺', name: 'Interview télé', cost: costLabel({ type: 'medias', theme: thm }), fx: 'Gagne des électeurs dans toute la France · jusqu\u2019à +' + teleEstimate(thm).replace(/<[^>]+>/g, ' ').trim(), err: tErr },
      { k: 'matinale', icon: '📻', name: 'Matinale radio', cost: costLabel({ type: 'matinale' }), fx: 'Choisis ta radio et son public · une fois tous les deux tours', err: mErr },
      { k: 'vingt', icon: '🕗', name: 'Le journal de 20 h', cost: costLabel({ type: 'vingt' }), fx: vErr ? '' : '<b>Tu es invité !</b> Une seule fois : gain doublé, mais gare au trac', err: vErr }
    ];
    var html = '<p>Les médias te font gagner des électeurs <b>partout en France</b>, dans les classes sociales que ta réponse touche. L\u2019effet s\u2019estompe de 15 % par tour : il faut l\u2019entretenir.</p><div class="pick">' + rows.map(function (r, i) {
      return '<button type="button" class="pick-row' + (r.err ? ' off' : '') + (r.k === 'vingt' && !r.err ? ' mine' : '') + '" data-i="' + i + '"><span class="pick-i">' + r.icon + '</span><span class="pick-txt"><b>' + esc(r.name) + '</b><small>' + (r.err ? esc(r.err.replace(/\.$/, '')) : r.fx) + '</small></span><span class="pick-cost">' + esc(r.cost) + '</span></button>';
    }).join('') + '</div>';
    modal({ kicker: 'Médias', title: 'Où veux-tu passer ?', html: html, buttons: [{ label: 'Fermer' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('#modal .pick-row'), function (b) {
          b.addEventListener('click', function () {
            var r = rows[+b.getAttribute('data-i')];
            if (r.err) return toast(r.err);
            closeModal();
            if (r.k === 'tele') teleInterview(thm); else if (r.k === 'matinale') matinaleMenu(); else vingtInterview();
          });
        });
      } });
  }
  function teleInterview(thm) { interviewModal({ type: 'medias', fmt: 'tele', theme: thm, kicker: '📺 Interview télé', host: 'La journaliste, plateau du 13 h' }); }
  /* v3.9 : la matinale radio. D'abord la station (son public et son accueil), puis l'interview */
  function matinaleMenu() {
    var thm = theme || E.bestTheme(g, me, selected || null);
    var html = '<p>Une interview à 7 h 50. Chaque radio a son public : choisis qui tu veux toucher. Les auditeurs t\u2019écoutent mieux s\u2019ils sont de ton bord.</p><div class="pick">' + D.STATIONS.map(function (st) {
      var fit = E.stationFit(me, st.id), top = E.SEG.slice().sort(function (a, b) { return st.segs[b] - st.segs[a]; }).slice(0, 2);
      return '<button type="button" class="pick-row st-' + fit.k + '" data-st="' + st.id + '"><span class="pick-i">' + st.icon + '</span><span class="pick-txt"><b>' + esc(st.name) + ' <span class="muted">(' + esc(st.parody) + ')</span></b><small>' + esc(st.desc) + '</small>' +
        '<small class="st-fit">Public : ' + top.map(function (s) { return SEGBY[s].icon + ' ' + esc(SEGBY[s].name.toLowerCase()); }).join(', ') + ' · <b>' + esc(fit.label) + '</b>' + (fit.f === 1 ? '' : ' (' + (fit.f > 1 ? '+' : '−') + Math.abs(Math.round((fit.f - 1) * 100)) + ' %)') + '</small></span></button>';
    }).join('') + '</div>';
    modal({ kicker: '📻 Matinale radio · 1 ⚡', title: 'Quelle radio ce matin ?', html: html, buttons: [{ label: 'Annuler' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('#modal [data-st]'), function (b) {
          b.addEventListener('click', function () {
            var st = D.STATIONS.filter(function (x) { return x.id === b.getAttribute('data-st'); })[0], fit = E.stationFit(me, st.id);
            closeModal();
            interviewModal({ type: 'matinale', fmt: 'matinale', theme: thm, station: st.id, kicker: st.icon + ' ' + st.name + ' · la matinale', host: 'L\u2019intervieweur de 7 h 50 · ' + fit.label, cls: 'radio' });
          });
        });
      } });
  }
  /* v3.9 : le 20 h, une fois par campagne, sur invitation */
  function vingtInterview() {
    var thm = theme || E.bestTheme(g, me, selected || null), risk = Math.round(100 * E.stageRisk(g, me, Math.max(0, projected().forme - 1)));
    interviewModal({ type: 'vingt', fmt: 'vingt', theme: thm, kicker: '🕗 Le journal de 20 h', host: 'Le présentateur du 20 h · 6 millions de téléspectateurs', cls: 'vingt', title: 'Le grand rendez-vous',
      intro: '<p class="vingt-risk">😱 <b>Trac du direct : ' + risk + ' %</b> de risque de trou de mémoire (la moitié du gain en négatif, +1 casserole). Moins tu as d\u2019énergie ⚡, plus c\u2019est risqué.</p>' });
  }
  function bigGain(act) {
    if (act.type === 'mobiliser') return E.mobilizeGain(g, me, act.region).n;
    if (act.type === 'terrain') return E.terrainCubes(g, me, act.region, act.theme);
    var n = 0; E.mediaRegions(g, me, act.region, act.theme).forEach(function (rid) { n += E.mediaCubes(g, me, rid, act.theme); }); return n;
  }
  /* v4.3 : tes actions de parti et tes cartes, avec leur fiche (dans l'onglet Mon parti) */
  function specialsHtml() {
    var rows = [];
    Object.keys(D.ACTIONS).forEach(function (k) { var a = D.ACTIONS[k]; if (a.only && a.only.indexOf(me) >= 0 && D.FICHES[k]) rows.push({ icon: a.icon, name: a.name + ' · ' + costLabel({ type: k }), k: k }); });
    mePl().cards.forEach(function (k) { if (D.FICHES[k]) rows.push({ icon: '🃏', name: D.CARDS[k].name + ' · carte unique', k: k }); });
    if (!rows.length) return '';
    return '<div class="specials"><div class="kicker">Tes actions spéciales et tes cartes</div>' + rows.map(function (r) {
      return '<div class="special"><b>' + r.icon + ' ' + esc(r.name) + '</b><span class="pick-txt">' + ficheHtml(r.k) + '</span></div>';
    }).join('') + '</div>';
  }
  /* v4.3 : la fiche d'une action ou d'une carte propre à ton parti : quand · effet chiffré · risque */
  function ficheTxt(k, part) { var f = D.FICHES[k]; return f ? f[part].replace(/\{(\d+)\}/g, function (m, n) { return String(E.spec ? E.spec(g, me, +n) : +n); }) : ''; }
  function ficheHtml(k) {
    var f = D.FICHES[k]; if (!f) return '';
    return '<span class="fiche-l"><b>Effet :</b> ' + esc(ficheTxt(k, 'effet')) + '</span><span class="fiche-l"><b>Quand :</b> ' + esc(ficheTxt(k, 'quand')) + '</span>' +
      (f.risque !== 'Aucun.' ? '<span class="fiche-l fiche-r"><b>Risque :</b> ' + esc(ficheTxt(k, 'risque')) + '</span>' : '');
  }
  /* Les autres actions, dans une fenêtre où l'on a la place de les expliquer */
  /* v3.1 : une ligne courte par action ; le détail arrive ensuite dans le journal */
  var MORE_SHORT = {
    repos: '+2 ⚡ tout de suite : le candidat récupère', reseaux: 'Un coup de dé sur les réseaux', militants: '+1 soutien ici à chaque tour', imposer: 'Ton thème à la une demain',
    contre: 'Affaiblir le rival en tête ici', fonds: 'Remplir la caisse', reforme: 'Gagner les régions du même type',
    nostalgie: 'Promettre le retour du passé', rappel: 'Faire revenir d\u2019anciens électeurs', fusion: 'Absorber le micro-parti', eclat: 'Faire revenir les caméras',
    marche_pop: 'Grosse mobilisation en ville', censure: 'Tous tes rivaux perdent 1 ★', fete_rose: 'Fête dans 2 régions', primaire: 'Gagner de l\u2019influence',
    climat: 'Grosse mobilisation verte', canicule: 'Tous tes rivaux reculent', art493: 'Bloquer le rival en tête', remaniement: 'Déplacer tes soutiens ici',
    appel18: 'Toutes les régions historiques', rassemblement: 'Argent et influence', plateau_tele: 'Passer à la télé dans 3 régions', grand_meeting: 'Gros meeting ici'
  };
  function moreMenu() {
    if (g.phase !== 'actions') return;
    var items = [];
    ['repos', 'reseaux', 'militants', 'imposer', 'contre', 'fonds', 'reforme'].forEach(function (type) {
      var def = D.ACTIONS[type], act = { type: type, region: def.target === 'region' ? selected : undefined, theme: def.theme ? theme : undefined };
      var err = def.target === 'region' && !selected ? 'choisis d\'abord une région' : canQueue(act);
      items.push({ act: act, icon: def.icon, name: def.name, cost: costLabel(act), fx: MORE_SHORT[type], err: err });
    });
    Object.keys(D.ACTIONS).forEach(function (type) {   // v3.1 : les actions propres à ton parti
      var def = D.ACTIONS[type]; if (!def.only || def.only.indexOf(me) < 0) return;
      var act = { type: type, region: def.target === 'region' ? selected : undefined };
      var err = def.target === 'region' && !selected ? 'choisis d\u2019abord une région' : canQueue(act);
      items.unshift({ act: act, icon: def.icon, name: def.name, cost: costLabel(act), fx: D.FICHES[type] ? ficheHtml(type) : MORE_SHORT[type], err: err, mine: true });
    });
    mePl().cards.forEach(function (k) {
      var def = D.CARDS[k], act = { type: 'card', card: k, region: def.target === 'region' ? selected : undefined };
      var err = def.target === 'region' && !selected ? 'choisis d\'abord une région' : canQueue(act);
      items.push({ act: act, icon: '🃏', name: def.name, cost: 'carte unique', fx: D.FICHES[k] ? ficheHtml(k) : MORE_SHORT[k] || esc(def.text), err: err });
    });
    // v3.9 : la matinale et le 20 h
    var mErr = E.matinaleError(g, me) || (queue.some(function (q) { return q.type === 'matinale'; }) ? 'déjà programmée ce tour' : canQueue({ type: 'matinale', theme: theme || E.bestTheme(g, me, null), station: 'rmc' }));
    items.unshift({ special: 'matinale', icon: '📻', name: 'Matinale radio', cost: costLabel({ type: 'matinale' }), fx: 'Une radio, un public : gagne des classes sociales', err: mErr ? mErr.replace(/\.$/, '') : null });
    var vErr = E.vingtError(g, me) || (queue.some(function (q) { return q.type === 'vingt'; }) ? 'déjà programmé ce tour' : canQueue({ type: 'vingt', theme: theme || E.bestTheme(g, me, null) }));
    items.unshift({ special: 'vingt', icon: '🕗', name: 'Le 20 h', cost: costLabel({ type: 'vingt' }), fx: '<b>Tu es invité !</b> Une fois par campagne : gros gain… ou gros raté', err: vErr ? vErr.replace(/\.$/, '') : null, mine: !vErr });
    if (E.isBeta(g)) {   // v4.4 : les nouvelles mécaniques de la Bêta
      var pl4 = mePl();
      if (pl4.sign != null && pl4.sign < D.BETA.parr.need) items.unshift({ act: { type: 'parrainages' }, icon: '✍️', name: 'Chercher des parrainages', cost: costLabel({ type: 'parrainages' }),
        fx: '<b>' + pl4.sign + ' / ' + D.BETA.parr.need + ' signatures</b> · +' + D.BETA.parr.action + ' par tournée · date limite : fin du tour ' + E.parrDeadline(g), err: canQueue({ type: 'parrainages' }), mine: true });
      if (g.turn <= D.BETA.union.lastTurn) items.push({ special: 'union', icon: '🤝', name: 'Candidature commune', cost: costLabel({ type: 'union', target: null }), fx: 'Rallier un petit parti de ton camp : 70 % de ses électeurs te rejoignent (jusqu\u2019au tour ' + D.BETA.union.lastTurn + ')', err: null });
      if (!pl4.defiUsed) items.push({ special: 'defi', icon: '🎤', name: 'Défier en débat', cost: costLabel({ type: 'defi', target: null }), fx: 'Un face-à-face avec le rival de ton choix. S\u2019il refuse : la chaise vide lui coûte cher (une fois par campagne)', err: null });
    }
    items.push({ special: 'enquete', icon: '🔎', name: 'Enquêter sur un rival', cost: costLabel({ type: 'enquete', target: null }),
      fx: 'Fouiller le passé d\u2019un rival', err: g.turn >= R.maxTurns ? 'trop tard pour sortir un dossier' : null });
    // v4.5 : chaque action dit ce qu'elle rapporte au sondage (ou qu'elle n'y touche pas tout de suite)
    var SLOW = { repos: '0 pt au sondage', fonds: '0 pt au sondage', parrainages: '0 pt au sondage',
      imposer: '0 pt maintenant · effet au tour suivant', militants: '0 pt maintenant · effet à chaque tour suivant' };
    function ptLine(it) {
      if (it.err || !it.act) return '';
      if (SLOW[it.act.type]) return '<span class="pt-line muted">' + SLOW[it.act.type] + '</span>';
      var e = estRange(it.act);
      if (!e) return '';
      var lo = Math.min(e.lo, e.hi), hi = Math.max(e.lo, e.hi);
      if (Math.abs(hi) < 0.0005 && Math.abs(lo) < 0.0005) return '<span class="pt-line muted">' + (hi > 0 ? 'moins de +0,1 pt au sondage' : hi < 0 ? 'moins de −0,1 pt au sondage' : '0 pt au sondage') + '</span>';
      return '<span class="pt-line"><b>' + e.txt + '</b> au sondage' + (it.act.type === 'reseaux' ? ' (selon le dé)' : '') + '</span>';
    }
    var html = '<div class="pick">' + items.map(function (it, i) {
      return '<button type="button" class="pick-row' + (it.err ? ' off' : '') + (it.mine ? ' mine' : '') + '" data-i="' + i + '"><span class="pick-i">' + it.icon + '</span>' +
        '<span class="pick-txt"><b>' + esc(it.name) + '</b>' + ptLine(it) + '<small>' + (it.err ? '<span class="fiche-err">' + esc(it.err) + '</span>' : '') + (!it.err || /fiche-l/.test(it.fx || '') ? it.fx : '') + '</small></span><span class="pick-cost">' + esc(it.cost) + '</span></button>';
    }).join('') + '</div>';
    modal({ kicker: 'Autres actions', title: 'Plus d\'options', html: html, buttons: [{ label: 'Fermer' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('.pick-row'), function (row) {
          row.addEventListener('click', function () {
            var it = items[+row.getAttribute('data-i')];
            if (it.err) { toast(it.err.charAt(0).toUpperCase() + it.err.slice(1) + '.'); return; }
            closeModal();
            if (it.special === 'enquete') enqueteMenu();
            else if (it.special === 'matinale') matinaleMenu();
            else if (it.special === 'union') unionMenu();
            else if (it.special === 'defi') defiMenu();
            else if (it.special === 'vingt') vingtInterview();
            else if (it.special === 'alliance') allianceMenu();
            else if (it.special === 'break') confirmBreak();
            else addAction(it.act);
          });
        });
      } });
  }
  /* v4.4 : candidature commune */
  function unionMenu() {
    var rows = g.players.filter(function (p) { return p.id !== me; }).map(function (p) { return { p: p, err: E.unionError(g, me, p.id) || canQueue({ type: 'union', target: p.id }) }; })
      .sort(function (a, b) { return (a.err ? 1 : 0) - (b.err ? 1 : 0); });
    var html = '<p>Tu proposes à un parti de ton camp, au moins deux fois plus petit que toi, de se ranger derrière ta candidature. S\u2019il accepte, il se retire : <b>70 %</b> de ses électeurs te rejoignent.</p>';
    var buttons = rows.map(function (r) {
      return { label: party(r.p.id).short + ' · ' + (r.err ? r.err.replace(/\.$/, '') : 'accord ' + chanceLabel(E.unionChance(g, me, r.p.id))), disabled: !!r.err, onClick: function () { addAction({ type: 'union', target: r.p.id }); } };
    });
    buttons.push({ label: 'Annuler' });
    modal({ kicker: costLabel({ type: 'union', target: null }) + ' · 1 action', title: 'Candidature commune avec qui ?', html: html, buttons: buttons });
  }
  /* v4.4 : défi du débat (le rival, puis ta réponse à la question) */
  function defiMenu() {
    var rows = g.players.filter(function (p) { return p.id !== me; });
    var buttons = rows.map(function (p) {
      var err = E.defiError(g, me, p.id) || canQueue({ type: 'defi', target: p.id }), ch = Math.round(100 * E.defiAccept(g, me, p.id));
      return { label: party(p.id).short + ' · ' + (err ? err.replace(/\.$/, '') : ch + ' % qu\u2019il accepte'), disabled: !!err, onClick: function () { defiQuestion(p.id); } };
    });
    buttons.push({ label: 'Annuler' });
    modal({ kicker: costLabel({ type: 'defi', target: null }) + ' · 1 action', title: 'Qui défies-tu ?', html: '<p>S\u2019il accepte : un face-à-face sur une question, et chacun gagne des électeurs selon sa réponse. S\u2019il refuse : <b>+1 soutien pour toi dans 2 régions, −1 pour lui dans 2 régions</b>. Les favoris refusent plus souvent.</p>', buttons: buttons });
  }
  function defiQuestion(target) {
    var thm = theme || E.bestTheme(g, me, null), q = E.pickQuestion(g, thm, 61), iv = E.debateCards(g, me, q.id);
    var html = tvSet('🎤 Défi : face à ' + party(target).short, iv, 'Si ' + party(target).candidate + ' accepte le débat', 'debat') + '<div class="ans-k">Ta réponse (si le débat a lieu)</div><div class="ans-list">' + iv.cards.map(function (c, i) {
      return '<button type="button" class="ans" data-i="' + i + '">' + answerCard(c, '<b class="ans-pt">' + ptStr(E.previewGain(g, me, c.gains)) + '</b>') + '<small class="ans-c">' + counterHint(c) + '</small>' + '</button>';
    }).join('') + '</div>';
    modal({ kicker: 'Défi du débat', title: 'Que répondras-tu ?', cls: 'tv-modal', html: html, buttons: [{ label: 'Annuler' }],
      onOpen: function () {
        Array.prototype.forEach.call(document.querySelectorAll('#modal .ans'), function (b) {
          b.addEventListener('click', function () { var c = iv.cards[+b.getAttribute('data-i')]; closeModal(); addAction({ type: 'defi', target: target, theme: q.theme, qid: q.id, reply: c.key }); });
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
    replayTurn(mine, cubes0, log, function () {
      FX.release();
      FX.wait(inkMs() + 120, function () { showFlash(log, before, ctrl0, allies0); });
    });
  }
  /* La tournée du candidat : son pion va de région en région, une trace en pointillés derrière lui.
     À chaque étape : ce que tes actions ont rapporté au sondage s'envole, et pour « Mobiliser » des abstentionnistes prennent ta couleur.
     v4.9.2 : le chiffre est en POINTS DE SONDAGE (le gain réel, rivaux compris), comme sur les cases d'action et dans le bilan.
     Avant, c'était le nombre de soutiens gagnés dans la région (+9…), une autre unité : c'était trompeur. */
  function replayTurn(acts, cubes0, log, done) {
    var ptBy = {}, okBy = {};   // v4.9.4 : le gain en France de tes actions dans chaque région
    (log || []).forEach(function (l) {
      if (l.pid !== me || !l.region) return;
      ptBy[l.region] = (ptBy[l.region] || 0) + (l.pt || 0);   // v4.9.4 : le gain en France, comme la carte et le bilan
      okBy[l.region] = okBy[l.region] || l.ok;
    });
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
    if (!stops.length || FX.reduced || !pawnEl) return finish();
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
          var pt = ptBy[st.rid] || 0;
          if (okBy[st.rid] === false) FX.floatText(s, m.x + 2, m.y - 12, 'raté', 'loss');
          else if (Math.abs(pt) >= 0.0005) FX.floatText(s, m.x + 2, m.y - 12, ptStr(pt), pt > 0 ? 'gain' : 'loss');
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
      '<div class="tv-me"><span>Ta position</span><b>' + ordinal(f.rank) + '</b><span>' + pctFr(f.mine.pct, 1) + ' %</span>' + arrow(f.mine.d) + '</div>' +
      (g.led ? '<p class="bilan-mini">Tes actions <b>' + ptStr(g.led.acts[me] || 0) + '</b> · les rivaux <b>' + ptStr(g.led.riv[me] || 0) + '</b> · bilan complet en fin de tour</p>' : '');
  }
  function flashDetail(f, log) {
    var h = '';
    h += '<div class="brief"><div class="kicker">Les titres de la soirée</div>' + (f.heads.length ? f.heads.map(function (x) { return line(x.me ? '👉' : '•', x.me ? '<b>' + esc(x.t) + '</b>' : esc(x.t)); }).join('') : line('•', 'Aucune région ne change de main.')) + '</div>';
    var mineLog = log.filter(function (l) { return l.pid === me; });
    if (mineLog.length) h += '<div class="brief"><div class="kicker">Tes actions</div>' + mineLog.map(function (l) {
      return line(l.gaffe ? '😬' : l.ok ? '✅' : '❌', '<b>' + esc(l.action) + '</b>' + (l.region ? ' · ' + SHORT[l.region] : '') + (l.pt ? ' · <b>' + ptStr(l.pt) + '</b>' : '') + ' — ' + esc(l.text));
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
  /* ---------- v4.0 : le débat télévisé, sur le plateau ---------- */
  function counterHint(c) {
    var r = D.DEB_REG[c.key], w = [], l = [];
    Object.keys(D.DEB_BEATS).forEach(function (k) { var p = k.split('>'); if (p[0] === r) w.push(p[1]); if (p[1] === r) l.push(p[0]); });
    var nm = function (x) { return D.DEB_REG_NAME[x].split(' (')[0]; };
    return (w.length ? '<span class="ch-w">bat ' + w.map(nm).join(', ') + '</span>' : '') + (l.length ? '<span class="ch-l">contrée par ' + l.map(nm).join(', ') + '</span>' : '') || '<span>ni contre, ni contrée</span>';
  }
  function vsStrip(o) {
    return '<div class="vs-strip"><span class="vs-side"><span class="vs-face">' + A.portrait(me) + '</span><b>Toi</b></span><span class="vs-x">VS</span>' +
      '<span class="vs-side"><span class="vs-face">' + A.portrait(o) + '</span><b>' + esc(party(o).short) + '</b><small>' + esc(D.TEMPERS[o] ? D.TEMPERS[o].label : '') + '</small></span></div>';
  }
  function undecided(sa, sb, o, la, lb) {
    var x = sa + sb > 0 ? 100 * sa / (sa + sb) : 50;
    return '<div class="undec"><div class="undec-k">Les indécis devant leur écran</div><div class="undec-bar"><i class="u-me" data-w="' + x.toFixed(1) + '" style="width:50%;background:' + party(me).color + '"></i><i class="u-op" style="background:' + party(o).color + '"></i></div>' +
      '<div class="undec-l"><b>Toi' + (la ? ' · ' + la : '') + '</b><b>' + esc(party(o).short) + (lb ? ' · ' + lb : '') + '</b></div></div>';
  }
  /* Les duels d'une soirée (débat du 1er tour ou face-à-face). cfg : { kicker, host, duels, prep (pid → ★), fiche, done(picks) } */
  function runDuels(cfg) {
    var picks = [], n = cfg.duels.length;
    function step(k) {
      if (k >= n) return cfg.done(picks);
      var d = cfg.duels[k], mineA = d.a === me, o = mineA ? d.b : d.a;
      var iv = E.debateCards(g, me, d.qid), fiche = '';
      if (cfg.fiche) {
        var ws = E.debateWeights(g, o, d);
        fiche = '<div class="fiche">📋 <b>Fiche de préparation</b> : ' + esc(party(o).candidate) + ' répond souvent par ' + ws.slice(0, 2).map(function (x) { return D.ANSWERS[x.key].icon + ' ' + esc(D.ANSWERS[x.key].name.toLowerCase()) + ' (' + Math.round(100 * x.p) + ' %)'; }).join(' ou ') + '.</div>';
      } else fiche = '<div class="fiche muted">📋 Sans préparation, tu ne sais pas ce qu’il va répondre.</div>';
      var mult = 1 + D.DEBATE.prep * ((cfg.prep || {})[me] || 0);
      var html = tvSet(cfg.kicker + ' · question ' + (k + 1) + ' / ' + n, iv, cfg.host, 'debat') + vsStrip(o) + fiche +
        '<div class="ans-k">Ta réponse</div><div class="ans-list">' + iv.cards.map(function (c, i) {
          return '<button type="button" class="ans" data-i="' + i + '">' + answerCard(c, '<b class="ans-pt">' + ptStr(E.previewGain(g, me, scaleG(c.gains, mult))) + '</b>') +
            '<small class="ans-c">' + counterHint(c) + '</small></button>';
        }).join('') + '</div>';
      modal({ kicker: cfg.kicker, title: 'Que réponds-tu ?', cls: 'tv-modal', html: html, buttons: [],
        onOpen: function () {
          Array.prototype.forEach.call(document.querySelectorAll('#modal .ans'), function (b) {
            b.addEventListener('click', function () {
              var my = iv.cards[+b.getAttribute('data-i')].key, their = AI.chooseReply(g, o, d.theme, me, d);
              picks[k] = mineA ? { ra: my, rb: their } : { ra: their, rb: my };
              var r = E.duelOutcome(g, d, picks[k].ra, picks[k].rb, (cfg.prep || {})[d.a] || 0, (cfg.prep || {})[d.b] || 0);
              var mc = mineA ? r.ca : r.cb, oc = mineA ? r.cb : r.ca, ms = mineA ? r.sa : r.sb, os = mineA ? r.sb : r.sa;
              var iBeat = r.beat === (mineA ? 'a' : 'b'), oBeat = r.beat && !iBeat;
              var mg = mineA ? r.ga : r.gb, og = mineA ? r.gb : r.ga, mPt = E.previewGain(g, me, mg), oPt = E.previewGain(g, o, og);   // v4.5 : en points de sondage
              var side = function (who, c, pt, beat, lost) {
                return '<div class="duel-card' + (beat ? ' won' : lost ? ' lost' : '') + '"><div class="dc-h"><span class="dc-who">' + who + '</span><span>' + c.icon + ' ' + esc(c.name) + '</span><b>' + ptStr(pt) + '</b></div><q class="ans-q">' + esc(c.quote) + '</q></div>';
              };
              var verdict = ms > os ? 'Question gagnée !' : ms < os ? 'Question perdue…' : 'Match nul';
              var rh = side('Toi', mc, mPt, iBeat, oBeat) + (r.line ? '<div class="dc-line">' + (iBeat ? '💥 Ta réponse contre la sienne (ton gain ×' + String(D.DEBATE.win).replace('.', ',') + ', le sien réduit)' : '💥 Sa réponse contre la tienne (son gain ×' + String(D.DEBATE.win).replace('.', ',') + ', le tien réduit)') + ' : ' + esc(r.line) + '</div>' : '') +
                side(esc(party(o).short), oc, oPt, oBeat, iBeat) + undecided(ms, os, o, ptStr(mPt), ptStr(oPt));
              closeModal();
              modal({ kicker: cfg.kicker + ' · question ' + (k + 1) + ' / ' + n, title: verdict, cls: 'tv-modal', html: rh,
                onOpen: function () { setTimeout(function () { var u = document.querySelector('#modal .u-me'); if (u) u.style.width = u.getAttribute('data-w') + '%'; }, 60); },
                buttons: [{ label: k < n - 1 ? 'Question suivante' : 'Le verdict', primary: true, onClick: function () { step(k + 1); } }] });
            });
          });
        } });
    }
    step(0);
  }
  function scaleG(gains, f) { var o = {}; E.SEG.forEach(function (s) { o[s] = Math.round((gains[s] || 0) * f * 10) / 10; }); return o; }

  function debate() {
    var deb = E.setupDebate(g), grand = g.turn === R.maxTurns;
    var mine = deb.duels.filter(function (d) { return d.a === me || d.b === me; });
    var max = Math.min(mePl().infl, R.debatePrepMax), mult = grand ? 2 : 1;
    var html = '<p>' + mine.length + ' questions, ' + mine.length + ' adversaires. À chaque question, tu choisis ta réponse ; certaines contrent les autres :</p>' +
      '<div class="rps">L\u2019émotion bat les chiffres · les chiffres battent l\u2019attaque · l\u2019attaque bat l\u2019émotion · attaque et chiffres démontent une promesse</div>' +
      '<div class="brief">' + mine.map(function (d) {
        var o = d.a === me ? d.b : d.a;
        return line(th(d.theme).icon, '<b>' + esc(party(o).short) + '</b> sur ' + esc(th(d.theme).name) + ' <span class="muted">· ' + D.TEMPERS[o].label + '</span>');
      }).join('') + '</div>' +
      '<p><b>Préparation</b> : chaque ★ influence dépensée = +' + Math.round(D.DEBATE.prep * 100) + ' % sur le gain de tes réponses, et la fiche de ton adversaire (sa réponse favorite).</p>' +
      '<div class="bid"><input id="bid" type="range" min="0" max="' + max + '" value="' + Math.min(1, max) + '" aria-label="Préparation en influence"><output id="bid-out">' + Math.min(1, max) + ' ★</output></div>' +
      '<p class="hint">Chaque réponse affiche ce qu\u2019elle rapporte à ton score au sondage national (partout en France). Si ta réponse contre celle d\u2019en face, ton gain grimpe. Le vainqueur de la soirée reçoit en plus un bonus au sondage.' + (grand ? ' <b>Grand débat final : bonus doublé !</b>' : '') + '</p>' + learnBox('debat');
    var prep = {};
    g.players.forEach(function (p) { if (!p.human) prep[p.id] = AI.prep(g, p.id); });
    modal({ kicker: grand ? 'Grand débat final' : 'Débat télévisé', title: 'Ce soir, sur le plateau !', html: html,
      onOpen: function () { var r = $('bid'); r.addEventListener('input', function () { $('bid-out').textContent = r.value + ' ★'; }); },
      buttons: [{ label: 'Entrer sur le plateau', primary: true, keep: true, onClick: function () {
        prep[me] = parseInt($('bid').value, 10) || 0; closeModal();
        runDuels({ kicker: grand ? 'Grand débat final' : 'Débat télévisé', host: 'Les deux journalistes du débat', duels: mine, prep: prep, fiche: prep[me] > 0, done: function (myPicks) {
          var picks = deb.duels.map(function (d) {
            var j = mine.indexOf(d); if (j >= 0) return myPicks[j];
            return { ra: AI.chooseReply(g, d.a, d.theme, d.b, d), rb: AI.chooseReply(g, d.b, d.theme, d.a, d) };
          });
          finish(picks);
        } });
      } }] });

    function finish(picks) {
      var res = E.resolveDebate(g, prep, picks); render();
      var h = '<div class="brief">' + res.ranking.slice(0, 6).map(function (x, n) {
        return line(n === 0 && res.winner ? '🏆' : (n + 1) + '.', chip(x.pid) + (x.pid === me ? '<b>Toi</b>' : esc(party(x.pid).short)) + ' — <b>' + ptStr((res.delta || {})[x.pid] || 0) + '</b> au sondage' + (x.prep ? ' <span class="muted">(' + x.prep + ' ★ de préparation)</span>' : ''));
      }).join('') + '</div>';
      var myRank = 1 + res.ranking.findIndex(function (x) { return x.pid === me; });
      if (myRank > 6) h += '<p>Toi : ' + ordinal(myRank) + '.</p>';
      if (res.rewards.length) h += '<p class="hint">Bonus du vainqueur (' + res.rewards.map(function (w) { return w.pid === me ? 'toi' : esc(party(w.pid).short); }).join(', ') + ') déjà compté dans ces chiffres. Classement : qui a le mieux répondu, question par question.</p>';
      var cas = res.duels.filter(function (o) { return (o.a === me && o.casA) || (o.b === me && o.casB); }).length;
      if (cas) h += '<p>🍳 Ta promesse improvisée a été épinglée : +' + cas + ' casserole' + (cas > 1 ? 's' : '') + '.</p>';
      if (res.bingo) h += '<p>📀 ' + chip('FI') + ' <b>BINGO en direct</b> (« ' + res.bingo.words.map(esc).join(' », « ') + ' ») : les militants s’enflamment' + (res.bingo.regions.length ? ', +1 en ' + res.bingo.regions.map(function (x) { return SHORT[x]; }).join(', ') : '') + '. Les indécis, eux, zappent.</p>';
      h += '<p class="hint">Le détail par classe sociale est dans l’onglet Sondage.</p>';
      modal({ kicker: 'Débat', title: !res.winner ? 'Égalité en tête' : res.winner === me ? 'Tu remportes le débat !' : party(res.winner).short + ' remporte le débat', html: h,
              buttons: [{ label: 'Fin du tour', primary: true, onClick: spotlight }] });
    }
  }
  /* v4.0 : le grand face-à-face d'entre-deux-tours (si tu es finaliste) */
  function faceAFace(then) {
    var b = g.between, fc = b.face || E.setupFace(g), o = b.a === me ? b.b : b.a;
    var html = '<p>Le grand débat d’entre-deux-tours, la tradition depuis 1974. Trois questions face à <b>' + esc(party(o).candidate) + '</b>.</p>' +
      '<div class="rps">L\u2019émotion bat les chiffres · les chiffres battent l\u2019attaque · l\u2019attaque bat l\u2019émotion · attaque et chiffres démontent une promesse</div>' +
      '<div class="brief">' + fc.duels.map(function (d) { return line(th(d.theme).icon, esc(th(d.theme).name)); }).join('') + '</div>' +
      '<p class="hint">Le gagnant fait basculer jusqu’à ' + Math.round(D.DEBATE.faceMax * 100) + ' % des électeurs du perdant. Quelques points qui peuvent tout changer.</p>' + learnBox('debat');
    modal({ kicker: 'Entre-deux-tours', title: 'Le grand face-à-face', html: html, buttons: [{ label: 'Entrer sur le plateau', primary: true, onClick: function () {
      runDuels({ kicker: 'Le face-à-face', host: 'Les deux journalistes du grand débat', duels: fc.duels, prep: {}, fiche: true, done: function (picks) {
        var r = E.resolveFace(g, picks), mine = b.a === me ? r.sa : r.sb, his = b.a === me ? r.sb : r.sa;
        var won = r.winner === me;
        modal({ kicker: 'Le face-à-face', title: !r.winner ? 'Match nul' : won ? 'Tu remportes le grand débat !' : party(o).short + ' remporte le grand débat',
          html: undecided(mine, his, o) + '<p>' + (r.winner ? (won ? 'Les indécis basculent vers toi' : 'Les indécis basculent vers ' + esc(party(o).short)) + ' : <b>' + (100 * Math.abs(r.swing)).toFixed(1).replace('.', ',') + ' %</b> des électeurs changent d’avis pour le second tour.' : 'Personne ne fait la différence.') + '</p>',
          onOpen: function () { setTimeout(function () { var u = document.querySelector('#modal .u-me'); if (u) u.style.width = u.getAttribute('data-w') + '%'; }, 60); },
          buttons: [{ label: 'Aller voter', primary: true, onClick: then }] });
      } });
    } }] });
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

  /* v4.4 : éliminé faute de parrainages */
  function humanOut() {
    var o = g.humanOut; clearSave();
    modal({ kicker: 'Fin des parrainages', title: 'Pas de candidature', html: '<p>Tu n\u2019as pas réuni les <b>500 signatures d\u2019élus</b> à temps : ton parti ne sera pas sur la ligne de départ.' +
      (o && o.heir ? ' Une partie de tes électeurs se reporte sur ' + esc(party(o.heir).short) + '.' : '') + '</p><p class="hint">Astuce : sous 5 % dans les sondages, fais « Chercher des parrainages » (menu Plus) dès les premiers tours.</p>' + learnBox('parrainages'),
      buttons: [{ label: 'Retour à l\u2019accueil', primary: true, onClick: function () { go('title'); } }] });
  }
  /* v4.5 : le bilan du tour, toujours au même format : d'où vient ta hausse ou ta baisse.
     v4.8 : chaque ligne se touche et s'ouvre sur son détail (action par action, rival par rival, événement par événement). */
  function bilanHtml(b) {
    var x = b && b.rows[me]; if (!x) return '';
    function cls(v) { return v > 0.0005 ? 'up' : v < -0.0005 ? 'down' : ''; }
    function row(label, v, always, detail) {
      if (!always && Math.abs(v) < 0.0005) return '';
      var head = '<span>' + label + '</span><b class="' + cls(v) + '">' + ptStr(v) + '</b>';
      if (!detail) return '<div class="bilan-row">' + head + '</div>';
      return '<details class="bilan-det"><summary class="bilan-row">' + head + '<i class="bilan-chev" aria-hidden="true">›</i></summary><div class="bilan-more">' + detail + '</div></details>';
    }
    function li(icon, txt, v) { return '<div class="bm-line"><span class="bm-i">' + icon + '</span><span class="bm-t">' + txt + '</span>' + (v == null ? '' : '<b class="' + cls(v) + '">' + ptStr(v) + '</b>') + '</div>'; }
    function where(a) {
      return (a.region ? ' en ' + esc(E.REG[a.region].name) : a.target ? ' contre ' + esc(E.sigle(a.target)) : '') + (a.theme && th(a.theme) ? ' · ' + th(a.theme).icon + ' ' + esc(th(a.theme).short) : '');
    }
    // 1. Tes actions : prévu → réel, et pourquoi c'est différent
    var dA = '', anyLess = false, anyFail = false;
    (x.list || []).forEach(function (a) {
      var name = '<b>' + esc(a.action) + '</b>' + where(a);
      if (!a.ok) { anyFail = true; dA += li(a.gaffe ? '😬' : '✕', name + '<small>' + esc(a.text || 'Échouée') + '</small>', a.pt); return; }
      // v4.9.2 : l'écart n'est signalé que s'il se voit une fois arrondi
      var gap = a.est != null && ptStr(a.est) !== ptStr(a.pt);
      if (gap && a.pt < a.est) anyLess = true;
      dA += li(a.slot + '.', name + '<small>🔵 en France : ' + (gap ? 'annoncé ' + ptStr(a.est) + ', réel ' + ptStr(a.pt) : ptStr(a.pt) + (a.est != null ? ', comme annoncé' : '')) + '</small>', a.pt);
    });
    if (!dA) dA = '<p class="bm-note">Aucune action ce tour-ci.</p>';
    else dA += '<p class="bm-note">' + (anyLess ? 'Pourquoi moins que prévu ? Le chiffre annoncé est calculé sur la situation du début du tour. Mais les actions se jouent à tour de rôle (l’action 1 de chaque parti, puis l’action 2…) : quand un rival passe avant toi dans la même région ou sur le même public, il y a plus de monde à se partager les voix, et ton gain réel baisse. ' : '') +
      (anyFail ? 'Une action échouée ne rapporte rien (ressources insuffisantes, gaffe ou contre-attaque). ' : '') + 'Le ⓘ à côté du message détaille le calcul de chaque action.</p>';
    // 2. Les rivaux : qui t'a pris le plus, et avec quoi
    var by = x.by || {}, ids = Object.keys(by).sort(function (p, q) { return by[p] - by[q]; }), dR = '';
    ids.filter(function (p) { return Math.abs(by[p]) >= 0.0005; }).slice(0, 6).forEach(function (p) {
      var hits = (x.hit || []).filter(function (h) { return h.pid === p; }).sort(function (u, v) { return u.d - v.d; }), top = hits[0];
      dR += li(chip(p), '<b>' + esc(party(p).short) + '</b>' + (top ? '<small>surtout : ' + esc(top.action) + where(top) + ' (' + ptStr(top.d) + ')</small>' : ''), by[p]);
    });
    dR = (dR || '<p class="bm-note">Aucun rival n’a fait bouger ton score.</p>') +
      '<p class="bm-note">Le sondage est une part du gâteau : chaque électeur gagné par un rival fait baisser ta part, même si tu n’en perds aucun. Une action d’un rival peut aussi te faire monter (s’il prend des voix à un parti plus gros que toi, par exemple).</p>';
    // 3. Le débat
    var dD = '<p class="bm-note">Ce que le débat télévisé a changé pour toi : ta prestation, et celle de tes adversaires. L’effet passe par l’audience auprès des classes sociales, dans toute la France, et s’estompe ensuite comme les autres médias.</p>';
    // 4. Événements, affaires, imprévus : un par un
    var dO = '';
    (x.oth || []).filter(function (o) { return Math.abs(o.d) >= 0.0005; }).forEach(function (o) { dO += li(o.icon, esc(o.label), o.d); });
    dO = (dO || '<p class="bm-note">Rien de notable ce tour-ci.</p>') +
      '<p class="bm-note">Ces effets touchent tous les partis : un événement sur un thème que tu portes peut te faire monter, une affaire chez un rival peut te profiter.</p>';
    // 5. L'usure des médias
    var dW = '<p class="bm-note">À chaque fin de tour, l’effet de tous les passages dans les médias (télé, radio, 20 h, débat) baisse de 15 %. Ce tour-ci, cela t’a coûté <b>' + ptStr(x.wear) + '</b>. Pour garder cet effet, il faut repasser dans les médias. Les soutiens gagnés sur le terrain, eux, restent. Au dernier tour, il n’y a pas d’usure avant le vote.</p>';
    return '<p class="bilan-hint">Ton intention de vote en France 🔵 (c\u2019est elle qui décide de l\u2019élection). Touche une ligne pour voir le détail.</p><div class="bilan">' +
      row('Tes actions', x.acts, true, dA) +
      row(x.riv <= 0 ? 'Ce que les rivaux t’ont pris' : 'Les actions des rivaux', x.riv, true, dR) +
      row('Le débat télévisé', x.deb, false, dD) +
      row('Événements, affaires et imprévus', x.other, true, dO) +
      row('L’effet des médias qui s’estompe', x.wear, false, dW) +
      '<div class="bilan-row bilan-tot"><span>Total du tour</span><b>' + ptStr(x.total) + '</b></div></div>' +
      '<p class="bilan-mini">Tu passes de ' + pctFr(x.start, 1) + ' % à ' + pctFr(x.end, 1) + ' %. Le sondage est une part du total : quand tes rivaux gagnent des électeurs, ta part baisse même si tu n’en perds aucun.</p>';
  }
  function bilanModal(then) {
    var b = g.bilan;
    if (!b || !b.rows[me]) return then();
    modal({ kicker: 'Fin du tour ' + b.turn, title: 'Ton bilan au sondage', html: bilanHtml(b), buttons: [{ label: g.over || g.phase === 'between' ? 'Continuer' : 'Tour suivant', primary: true, onClick: then }] });
  }
  function finishTurn(spot) {
    var res = E.endTurn(g); render();
    if (spot && !spot.paid && spot.pid !== me) toast(party(spot.pid).short + ' sous les projecteurs : −1 soutien en ' + spot.regions.map(function (x) { return SHORT[x]; }).join(', '));
    else if (spot && spot.paid && spot.pid !== me) toast(party(spot.pid).short + ' paie 2 ★ pour éviter le scandale');
    if (g.humanOut) return humanOut();   // v4.4 : pas tes 500 parrainages
    if (res.out && res.out.length) {   // v4.4 : les partis sans leurs 500 signatures quittent la course
      var outH = '<p>Sans leurs 500 signatures d\u2019élus, ces partis ne seront pas candidats :</p><div class="brief">' + res.out.map(function (o) {
        return line('✍️', '<b>' + esc(party(o.pid).short) + '</b>' + (o.heir ? ' — une partie de ses électeurs part chez ' + esc(party(o.heir).short) + ' (+' + o.moved + ' soutiens)' : '') + '.');
      }).join('') + '</div>' + learnBox('parrainages');
      return modal({ kicker: 'Fin des parrainages', title: res.out.length + ' parti' + (res.out.length > 1 ? 's' : '') + ' éliminé' + (res.out.length > 1 ? 's' : ''), html: outH,
        buttons: [{ label: 'Continuer', primary: true, onClick: function () { if (res.over) electionNight(); else if (res.between) betweenScreen(); else nextTurn(); } }] });
    }
    if (res.over) return bilanModal(electionNight);
    if (res.between) return bilanModal(betweenScreen);
    if (g.turn === 1 && tutoGame) {
      tutoGame = false;
      // v2.0 : une récompense courte à la place du long « Bon à savoir »
      var poll = E.poll(g), rank = 1 + poll.findIndex(function (x) { return x.pid === me; }), mine = poll[rank - 1];
      var held = D.REGIONS.filter(function (r) { return g.regions[r.id].controller === me; }).length;
      return modal({ kicker: 'Tour 1 bouclé', title: rank <= 2 ? 'Bien joué !' : 'C\'est parti !', cls: 'reward', html:
        '<div class="reward-big"><b>' + ordinal(rank) + '</b><span>au sondage · ' + pctFr(mine.pct, 1) + ' %</span></div>' +
        '<div class="learn">' + A.advisor() + '<p>' + (rank <= 2 ? 'Tu es dans les 2 premiers : tu irais au second tour. Tiens bon jusqu\'au tour 8 !' : 'Objectif : finir dans les 2 premiers au tour 8 pour aller au second tour.') +
        (held ? ' Tu tiens déjà ' + held + ' région' + (held > 1 ? 's' : '') + '.' : '') + ' Je te glisse un conseil à chaque tour.</p></div>' + '<div class="kicker">Ton bilan au sondage</div>' + bilanHtml(g.bilan),
        buttons: [{ label: 'Tour suivant', primary: true, onClick: nextTurn }] });
    }
    setTimeout(function () { bilanModal(nextTurn); }, spot && spot.pid !== me ? 900 : 0);
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
      }).join('') + '</div>' + threatHtml(rival);
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
      var aim = isFin && !d && E.rivalTargets(g, rival).indexOf(e) >= 0;
      var st = aim ? '🎯 courtisé par ' + esc(party(rival).short) : d ? '🤝 accord avec ' + esc(who2(d.with)) + ' (« ' + esc(E.measure(d.measure).name) + ' »)' : c ? (c === 'none' ? '∅ ' : '➜ ') + consigneTxt(b, c) : '… hésite';
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
  /* v4.5.1 : un écart en points (toujours positif) */
  function ptFr(d) { return String(Math.round(1000 * Math.abs(d)) / 10).replace('.', ',') + ' pt'; }
  /* v4.5.1 : qui le rival compte courtiser, et ce que tu perdrais s'il y arrive */
  function threatHtml(rival) {
    var aims = E.rivalTargets(g, rival).map(function (e) { return { e: e, c: E.threatCost(g, me, e) }; }).filter(function (t) { return t.c >= 0.001; });
    if (!aims.length) return '';
    return '<div class="threat"><div class="kicker">🎯 ' + esc(party(rival).short) + ' prépare ses offres</div>' + aims.map(function (t) {
      return '<p><b>' + esc(party(t.e).short) + '</b> : s\'il signe avec lui, tu perds environ <b>' + ptFr(t.c) + '</b>.</p>';
    }).join('') + '<p class="hint">Négocie avant lui pour garder ces électeurs : un parti ne signe qu\'avec un seul finaliste.</p></div>';
  }
  function votePct(pid) { var x = g.round1.first.filter(function (y) { return y.pid === pid; })[0]; return x ? x.pct : 0; }
  function negotiateMenu() {
    var b = g.between, rival = me === b.a ? b.b : b.a, aims = E.rivalTargets(g, rival), free = b.elim.filter(function (e) { return !b.deals[e]; }).sort(function (x, y) { return votePct(y) - votePct(x); });
    var buttons = free.map(function (e) {
      var err = E.betweenError(g, me, { type: 'negocier', target: e, measure: E.concessionsFor(g, me, e)[0] });
      var aim = aims.indexOf(e) >= 0 ? ' · 🎯 visé par ' + party(rival).short + ' (protège ' + ptFr(E.threatCost(g, me, e)) + ')' : '';
      return { label: party(e).short + ' · ' + pctFr(votePct(e), 1) + ' % · distance ' + E.dist(me, e) + aim + (err ? ' — ' + err : ''), disabled: !!err, onClick: function () { concessionMenu(e); } };
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
    var b = g.between, rival = me === b.a ? b.b : b.a;
    // v3.6.1 : on montre l'effet de TON action, puis celui de la réponse du rival, séparément
    function myPct() { var pj = E.projectSecond(g); return me === pj.a ? pj.pctA : pj.pctB; }
    function ptTxt(d) { var v = Math.round(1000 * d) / 10; return (v > 0 ? '+' : v < 0 ? '−' : '±') + String(Math.abs(v)).replace('.', ',') + ' pt'; }
    var aimed = act.type === 'negocier' && E.rivalTargets(g, rival).indexOf(act.target) >= 0, saved = aimed ? E.threatCost(g, me, act.target) : 0;
    var p0 = myPct(), r = E.betweenAct(g, me, act);
    if (!r.ok) return toast(r.text);
    var p1 = myPct();
    function rivalTurn() {
      var rr = E.aiBetweenStep(g, rival), p2 = myPct();
      renderBetween();
      var last = rr ? b.log[b.log.length - 1] : null;
      var prot = aimed && b.deals[act.target] && b.deals[act.target].with === me ? ' (et tu protèges ' + ptFr(saved) + ' : ' + party(act.target).short + ' ne peut plus signer avec ' + party(rival).short + ')' : '';
      toast('Ton action : ' + ptTxt(p1 - p0) + prot + (rr ? ' · Réponse de ' + party(rival).short + ' : ' + ptTxt(p2 - p1) + (last ? ' (' + last.text + ')' : '') : ''));
    }
    if (act.type !== 'negocier') { renderBetween(); return rivalTurn(); }
    var pn = party(act.target).short, m = E.measure(act.measure);
    if (r.outcome === 'accept') modal({ kicker: '🤝 Accord', title: pn + ' accepte !', html: '<p>' + esc(pn) + ' appelle à voter pour toi. Tu reprends « ' + esc(m.name) + ' » dans tes engagements.</p>', buttons: [{ label: 'Continuer', primary: true, onClick: rivalTurn }] });
    else if (r.outcome === 'counter') modal({ kicker: '↩️ Contre-offre', title: pn + ' veut mieux', html: '<p>' + esc(pn) + ' refuse « ' + esc(m.name) + ' », mais signe tout de suite si tu reprends sa mesure phare : « <b>' + esc(E.measure(r.measure).name) + '</b> » (' + costTxt(E.measure(r.measure).cost) + ').</p>',
      buttons: [{ label: 'Accepter la contre-offre', primary: true, onClick: function () { E.answerCounter(g, true); p1 = myPct(); rivalTurn(); } }, { label: 'Refuser', onClick: function () { E.answerCounter(g, false); rivalTurn(); } }] });
    else modal({ kicker: '✋ Refus', title: pn + ' refuse', html: '<p>' + esc(pn) + ' ne veut pas s\'engager avec toi pour l\'instant. Une nouvelle demande aura moins de chances.</p>', buttons: [{ label: 'Continuer', primary: true, onClick: rivalTurn }] });
  }
  $('btw-go').addEventListener('click', function () {
    var b = g.between, isFin = me === b.a || me === b.b;
    function go2() {
      // v4.0 : le grand débat d'entre-deux-tours (joué par toi si tu es finaliste, sinon par l'ordinateur)
      if (isFin && !g.between.debate) return faceAFace(function () { E.closeBetween(g); electionNight(); });
      E.closeBetween(g);
      var fd = g.between && g.between.debate;
      if (!isFin && fd) return modal({ kicker: 'Entre-deux-tours', title: 'Le grand débat', html: '<p>' + (fd.winner ? esc(party(fd.winner).short) + ' remporte le face-à-face : ' + (100 * Math.abs(fd.swing)).toFixed(1).replace('.', ',') + ' % des électeurs changent d\u2019avis.' : 'Match nul au grand débat.') + '</p>', buttons: [{ label: 'La soirée électorale', primary: true, onClick: electionNight }] });
      electionNight();
    }
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
      var best = null, bn = 0, rv = E.regionVote(g, rid, among);   // v3.5.5 : le vrai vote de la région (poids, socle, reports)
      among.forEach(function (pid) { if (rv[pid] > bn) { bn = rv[pid]; best = pid; } });
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
      var rv = E.regionVote(g, r.id, among);
      among.forEach(function (pid) { w[pid] = rv[pid] || 0; tot += w[pid]; });
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
      (pl.cand && pl.cand.q ? line(D.QUALITIES[pl.cand.q].icon, '<b>' + esc(D.QUALITIES[pl.cand.q].name) + '</b> — ' + esc(D.QUALITIES[pl.cand.q].text)) : '') +
      (pl.cand && pl.cand.d ? line(D.DEFECTS[pl.cand.d].icon, '<b>' + esc(D.DEFECTS[pl.cand.d].name) + '</b> — ' + esc(D.DEFECTS[pl.cand.d].text)) : '') +
      line('⚡', '<b>Forme ' + pl.forme + ' / ' + R.formeMax + '</b> — Meeting et Télé en coûtent 1. À 0, risque de gaffe. +' + (R.formeRegen + (me === 'EM' ? 1 : 0)) + ' par tour.') +
      line('🍳', '<b>' + pl.cas + ' casserole' + (pl.cas > 1 ? 's' : '') + '</b> — chacune = ' + Math.round(R.affairPerCasserole * 100) + ' % de risque d\'affaire par tour. Attaquer, enquêter, trahir, le 49.3 et certains choix en ajoutent.') +
      line(pl.momentum > 0 ? '↗' : pl.momentum < 0 ? '↘' : '→', pl.momentum > 0 ? '<b>En dynamique</b> : +1 soutien sur tes Meetings.' : pl.momentum < 0 ? '<b>Passage à vide</b> : −1 soutien sur tes Meetings.' : '<b>Dynamique stable.</b> Gagne 1,5 point au sondage en un tour pour être en dynamique.') +
      line('👥', '<b>' + pl.militants + ' / ' + R.militantsMax + ' équipes de militants</b> — chacune rapporte 1 soutien par tour.') +
      '</div><p><b>Force :</b> ' + esc(p.force) + '</p><p><b>Faiblesse :</b> ' + esc(p.weakness) + '</p>' + traitHtml(me, true) + specialsHtml() + credHtml(me);
    $('parti-body').innerHTML = '<span class="kicker">Ton parti</span><h1 class="h1 tab-title">' + esc(p.name) + '</h1>' + html +
      '<div class="stack parti-btns">' + (g && !g.over && g.phase !== 'between' && turnSnap ? '<button type="button" class="btn btn-ink" id="pb-save">💾 Sauvegarder la partie</button>' : '') + '<button type="button" class="btn" id="pb-lulu">' + (luluOff ? '🙋 Réactiver Lulu (conseils et astuces)' : '🔕 Couper les conseils de Lulu') + '</button><button type="button" class="btn" id="pb-lib">📚 Comprendre la politique</button><button type="button" class="btn" id="pb-rules">Règles du jeu</button><button type="button" class="btn btn-ghost" id="pb-quit">Abandonner la partie</button></div>';
    if ($('pb-save')) $('pb-save').addEventListener('click', saveNamed);
    $('pb-lib').addEventListener('click', library); $('pb-rules').addEventListener('click', showRules);
    $('pb-lulu').addEventListener('click', function () {   // v4.8
      setLuluOff(!luluOff); advisorHidden = false; renderAdvisor(); renderParti();
      toast(luluOff ? 'Lulu se tait. Tu peux la rappeler ici quand tu veux.' : 'Lulu est de retour, avec ses astuces !');
    });
    $('pb-quit').addEventListener('click', function () { modal({ title: 'Abandonner la partie ?', html: '<p>Ta campagne en cours sera perdue. Tes parties enregistrées sont gardées.</p>', buttons: [{ label: 'Abandonner', primary: true, onClick: function () { clearSave(); go('title'); } }, { label: 'Continuer à jouer' }] }); });
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
      '<p><b>Le score qui compte : le sondage.</b> Toutes les actions se mesurent en <b>points de sondage (pt)</b>, affichés en gros sur chaque bouton. Le calcul part des vrais votes : chaque région vote selon son histoire, chaque classe sociale selon ses habitudes. Une action de terrain agit sur une région (qui pèse sa part des votants), une action dans les médias sur des classes sociales dans toute la France. À la fin de chaque tour, le bilan dit d\u2019où vient ta hausse ou ta baisse.</p>' +
      '<p><b>Deux modes de jeu.</b> <b>Réaliste</b> : chaque parti démarre avec ses vrais scores, au choix ceux de la présidentielle 2022, la moyenne des législatives et des européennes 2024, ou la moyenne de 6 sondages d\'octobre 2026 ; les petites listes et les partis absents de ta partie comptent sous « Autres » dans les sondages, et la campagne les réduit peu à peu. <b>Simulation</b> : chaque parti a 2 électeurs dans chaque région et personne ne tient de région : le départ est strictement égal, sans bonus caché. Ensuite, au second tour, les partis du centre de l\'axe reçoivent plus facilement des reports de voix que ceux des extrémités.</p>' +
      '<p><b>L\'abstention :</b> environ un quart des inscrits ne votent pas, et beaucoup plus en outre-mer. Le bouton <b>Abstention</b> au-dessus de la carte la montre. 🚪 <b>Mobiliser</b> fait voter des abstentionnistes ; attaquer ou multiplier les affaires en dégoûte d\'autres.</p>' +
      '<p><b>Premier tour :</b> les ' + D.PARTIES.length + ' partis sont en lice. Plus de 50 % des suffrages exprimés (les blancs ne comptent pas) = élu directement. Sinon, les deux premiers sont qualifiés, et le résultat est figé.</p>' +
      '<p><b>🤝 Entre les deux tours :</b> chaque finaliste a <b>' + R.round2.actions + ' actions</b>. Il peut <b>négocier un soutien</b> avec un parti éliminé en lui cédant une de ses mesures (celui-ci accepte, refuse ou réclame sa mesure phare), <b>mobiliser</b> des abstentionnistes ou lancer un <b>appel au rassemblement</b>. Chaque parti éliminé, toi compris si tu es éliminé, donne ensuite sa <b>consigne de vote</b> : un finaliste, ou personne.</p>' +
      '<p><b>🛡️ Le barrage (« front républicain »).</b> Chaque parti a un indice de rejet. Les électeurs des partis éliminés votent un peu plus contre le finaliste le plus rejeté, sauf s\'ils en sont proches. Face à deux finalistes aussi rejetés l\'un que l\'autre, l\'effet s\'annule. Le détail des reports s\'affiche entre les deux tours.</p>' +
      '<p><b>Les reports de voix</b> ne sont jamais automatiques : une consigne déplace une partie des électeurs, d\'autant moins que les partis sont éloignés sur l\'axe ; les autres votent pour l\'autre finaliste, blanc ou s\'abstiennent. Le détail s\'affiche avant et après le vote. Un accord avec un parti éloigné (distance 3 ou plus) fait fuir 3 % de tes propres électeurs. Les concessions sont des engagements de campagne : elles ne donnent pas de majorité à l\'Assemblée.</p>' +
      axisHtml(me || chosen) +
      '<p><b>Partis proches :</b> quand tu fais un Meeting ou passes à la Télé là où un parti voisin sur l\'axe est présent, tu lui prends 1 électeur (distance 2 : sur un dé de 4 à 6).</p>' +
      '<p><b>🤝 Pas d\'alliance avant le 1er tour :</b> chaque parti fait campagne seul. Les accords se négocient <b>entre les deux tours</b> (voir plus bas).</p>' +
      '<p><b>Chaque tour :</b> revenus (' + R.incomeMoney + ' € + 1 € par région contrôlée, max +3 ; +2 ★), un événement, puis <b>3 actions secrètes</b>. Tout le monde choisit en secret, puis les plans sont joués <b>chacun son tour</b> : l\'action 1 de chaque parti, puis l\'action 2, puis la 3. Le parti qui commence change à chaque tour (l\'ordre est affiché dans le flash info). Une action peut donc échouer si un rival a changé la situation juste avant : le flash info te dit pourquoi.</p>' +
      '<p><b>Ton message.</b> Meeting, Télé, Buzz et Faire la une portent un <b>thème</b> (💶 🏭 🏥 🌿 🚓 🛂). Son <b>impact</b>, de 0 à 4 = ta crédibilité sur le thème (0 à 2) + 1 si la région s\'en préoccupe + 1 si le thème fait l\'actu. Le bon message au bon endroit rapporte deux fois plus.</p>' +
      '<p><b>Les actions :</b></p><ul class="rules-acts">' +
        '<li>📣 <b>Meeting</b> (2 €) : des soutiens dans la région. <b>Base</b> de 1 à 4 selon l\'impact du message (de 2 à 5 en campagne éclair), <b>plus les bonus</b> : mesure phare +1, région de cœur +1 (hostile −1), dynamique ±1, et pour le Parti Survivant +1 là où il a déjà 5 soutiens. Le détail s\'affiche quand tu touches une région. Une région compte au plus 10 soutiens par parti.</li>' +
        '<li>📻 <b>Matinale radio</b> (1 ⚡, une fois tous les deux tours) : une interview sur une radio au choix. Chaque radio a son public (France Intérieure : cadres et profs ; Radio Nouba : les jeunes ; Europe Hier : retraités et petits patrons ; Radio Mon Comptoir : ouvriers et artisans). Si les auditeurs sont de ton bord, +25 % ; s\u2019ils sont loin, −30 %.</li>' +
        '<li>🕗 <b>Le 20 h</b> (1 ⚡, une fois par campagne, réservé aux 4 premiers du sondage) : le gain d\u2019une interview multiplié par deux… mais le trac du direct peut tourner au trou de mémoire (25 % de risque, 5 % de moins par ⚡ qu\u2019il te reste).</li>' +
        '<li>📺 <b>Télé</b> (3 € + 1 ★ + 1 ⚡) : une interview sur ton thème. Tu choisis ta réponse (❤️ émotion, 💡 ta mesure, 🥊 attaque ou 🛡️ bilan, 🙃 recentrer) : elle te fait gagner des voix dans une ou plusieurs <b>classes sociales</b>, dans toutes les régions à la fois. L\u2019effet s\u2019use de 15 % par tour.</li>' +
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
      '<p><b>🎙️ Le débat télévisé</b> (tours 3, 6 et 8) : chaque parti affronte 3 adversaires, une vraie question de journaliste à chaque fois. Tu choisis ta réponse (❤️ émotion, 💡 ta mesure ou 🛡️ le bilan, 🥊 attaque, 🙃 recentrer). Certaines contrent les autres : ❤️ bat 📊 chiffres (mesure, bilan), 📊 bat 🥊 attaque, 🥊 bat ❤️, et 🥊 comme 📊 démontent une 🎲 promesse improvisée. La réponse qui contre gagne 30 %, celle qui est contrée perd la moitié. Chaque réponse affiche ce qu\u2019elle rapporte en points de sondage, dans toute la France. Chaque ★ de préparation (3 au plus) = +15 % et la fiche de ton adversaire. Le vainqueur reçoit en plus un bonus au sondage (doublé au débat final).</p>' +
      '<p><b>🎙️ Le face-à-face</b> (entre les deux tours) : 3 questions entre les deux finalistes. Le gagnant fait basculer jusqu\u2019à 3 % des électeurs de l\u2019autre pour le second tour.</p>' +
      '<p><b>⚖️ Mode Réaliste : le poids des urnes.</b> Chaque soutien pèse selon le score historique de son parti dans la région : un soutien du parti en tête de la région compte beaucoup, celui d\u2019un petit parti beaucoup moins. Et la moitié des électeurs vote par fidélité (le <b>socle électoral</b>) : la campagne se joue sur l\u2019autre moitié. Résultat : les petits partis ont du mal à dépasser leur score historique, et chaque région garde sa couleur (terre de gauche, de droite ou disputée, dans la fiche de la région). En mode Simulation, tout le monde pèse pareil.</p>' +
      '<p><b>🧪 Mode Bêta.</b> Le mode Réaliste avec les règles à l\u2019essai : ' + D.BETA.changes.map(esc).join(' ') + '</p>' +
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
  // v3.8.1 : un démarrage qui ne peut plus rester bloqué (une erreur ici n'empêche pas d'arriver à l'accueil)
  [renderTitleMap, renderChoose, renderResume].forEach(function (f) { try { f(); } catch (e) { if (window.console) console.error(e); } });
  if ($('btn-resume')) $('btn-resume').addEventListener('click', function () { resumeGame(); });
  if ($('btn-load')) $('btn-load').addEventListener('click', showLoad);
  /* v1.9 : l'écran d'ouverture du studio disparaît tout seul (ou d'un toucher) */
  (function () {
    var sp = $('splash'); if (!sp) return;
    var done = false;
    function hide() { if (done) return; done = true; sp.classList.add('out'); setTimeout(function () { sp.remove(); }, 600); }
    sp.addEventListener('click', hide);
    setTimeout(hide, FX.reduced ? 1200 : 2900);
  })();
})();

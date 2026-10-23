/* Politik — interface (écrans, carte, déroulement d'un tour). */
(function () {
  var D = window.PolitikData, M = window.PolitikMap, E = window.PolitikEngine, AI = window.PolitikAI, A = window.PolitikArt;
  var R = D.RULES;
  var SHORT = { idf: 'IDF', ara: 'ARA', hdf: 'HDF', naq: 'N-AQ', occ: 'OCC', ges: 'G-EST', pac: 'PACA',
                pdl: 'PDL', bre: 'BRE', nor: 'NOR', bfc: 'BFC', cvl: 'CVL', cor: 'CORSE' };
  var NEUTRAL = '#DDD7C8';
  var SVGNS = 'http://www.w3.org/2000/svg';

  var g = null, me = null, chosen = 'VP', selected = null, queue = [];
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
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Écrans ---------- */
  function go(name) {
    if (name === 'choose' || name === 'title') g = null;
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
        '</span><span class="party-fam">' + esc(p.family) + '</span></div><div class="party-face">' + A.portrait(p.id) + '</div><div class="party-body"><span class="party-name">' + esc(p.name) +
        '</span><span class="party-res">' + esc(p.candidate) + '</span></div>';
      b.addEventListener('click', function () { chosen = p.id; renderChoose(); });
      grid.appendChild(b);
    });
    var p = party(chosen);
    $('party-detail').innerHTML = '<div class="cand-line">' + A.portrait(p.id) + '<div><b class="cand-name">' + esc(p.candidate) + '</b><span>' + esc(p.candTitle) + ' · tempérament ' + D.TEMPERS[p.id].label + '</span></div></div>' +
      axisHtml(p.id) +
      (p.pos === 1 || p.pos === 6 ? '<div><b>Électorat mobilisé.</b> Au bout de l\'axe : tes voix comptent ×' + R.edgeMobilization + ', mais les reports de second tour seront rares. Pense aux alliances !</div>' : '') +
      '<div><b>Force.</b> ' + esc(p.force) + '</div><div><b>Faiblesse.</b> ' + esc(p.weakness) +
      '</div><div><b>Bases.</b> ' + p.bases.map(function (r) { return E.REG[r].name; }).join(', ') +
      '</div><div><b>Cartes.</b> ' + p.cards.map(function (c) { return D.CARDS[c].name; }).join(' · ') + '</div>';
  }
  $('btn-start').addEventListener('click', function () { openProgramme(chosen); });

  /* ---------- v0.7 : composer son programme ---------- */
  var progSel = [];
  function fiche(m) {
    var t = th(m.theme);
    return '<p class="fiche-what">' + esc(m.edu.what) + '</p><div class="fiche-pc"><div class="fiche-pro"><b>👍 Pour</b>' + esc(m.edu.pro) + '</div><div class="fiche-con"><b>👎 Contre</b>' + esc(m.edu.con) + '</div></div>' +
      '<p class="hint">' + t.icon + ' ' + esc(t.name) + ' · ' + costTxt(m.cost) + (m.choc ? ' · 💥 mesure choc' : '') + '</p>';
  }
  function costTxt(c) { return c < 0 ? 'rapporte ' + (-c) + ' Md€' : c === 0 ? 'ne coûte rien' : 'coûte ' + c + ' Md€'; }
  function openProgramme(pid) {
    progSel = party(pid).programme.slice();
    go('programme'); renderProgramme(pid);
  }
  function renderProgramme(pid) {
    var p = party(pid), cost = E.programmeCost(progSel), over = cost - R.budgetCap, cr = E.programmeCred(pid, progSel);
    $('prog-cand').innerHTML = A.portrait(pid);
    $('prog-sub').textContent = p.candidate + ' · ' + p.name;
    var pct = Math.max(0, Math.min(100, 100 * cost / (R.budgetCap * 1.6)));
    $('prog-budget').innerHTML = '<div class="pb-top"><b>Coût : ' + cost + ' Md€</b><span>' + progSel.length + ' / ' + R.programmeSize + ' mesures</span></div>' +
      '<div class="pb-bar"><i class="' + (over > 0 ? 'over' : '') + '" style="width:' + pct + '%"></i><span class="pb-cap" style="left:' + (100 / 1.6) + '%"></span></div>' +
      '<div class="pb-msg">' + (over > 0 ? '⚠️ <b>Non financé</b> (+' + over + ' Md€) : ' + Math.ceil(over / R.budgetCasStep) + ' casserole(s), et les économistes vont s\'en mêler.' : '✅ <b>Programme financé</b> (40 Md€ au plus).') +
      ' <button type="button" class="linkbtn" data-learn="budget">C\'est quoi, le budget ?</button></div>';
    var list = $('prog-list'); list.innerHTML = '';
    D.THEMES.forEach(function (t) {
      var sec = el('div', { class: 'pl-theme' }, '<div class="pl-head">' + t.icon + ' <b>' + esc(t.name) + '</b><span class="pl-cred">ta crédibilité ' + credDots(cr[t.id]) + '</span></div>');
      D.MEASURES.filter(function (m) { return m.theme === t.id; }).forEach(function (m) {
        var i = progSel.indexOf(m.id), on = i >= 0;
        var row = el('div', { class: 'pl-row' + (on ? ' on' : '') + (i === 0 ? ' phare' : '') });
        row.innerHTML = '<button type="button" class="pl-pick" aria-pressed="' + on + '">' + (i === 0 ? '★' : on ? (i + 1) : '+') + '</button>' +
          '<span class="pl-txt"><b>' + esc(m.name) + '</b><small>' + costTxt(m.cost) + (m.choc ? ' · 💥 choc' : '') + (p.programme.indexOf(m.id) >= 0 ? ' · conseillé' : '') + (i === 0 ? ' · <b>mesure phare</b>' : '') + '</small></span>' +
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
    $('prog-go').disabled = progSel.length !== R.programmeSize;
    $('prog-go').textContent = progSel.length === R.programmeSize ? 'ENTRER EN CAMPAGNE' : 'ENCORE ' + (R.programmeSize - progSel.length) + ' MESURE' + (R.programmeSize - progSel.length > 1 ? 'S' : '');
  }
  $('prog-reco').addEventListener('click', function () { progSel = party(chosen).programme.slice(); renderProgramme(chosen); });
  $('prog-go').addEventListener('click', function () { if (progSel.length === R.programmeSize) startGame(chosen, progSel.slice()); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-learn]'); if (!b) return;
    var L = D.LEARN[b.getAttribute('data-learn')];
    if (L) modal({ kicker: 'Le saviez-vous ?', title: L.title, html: '<div class="learn">' + A.advisor() + '<p>' + esc(L.text) + '</p></div>' });
  });
  /* Fiche « Le saviez-vous ? » montrée une seule fois par partie, au bon moment */
  function learnBox(key) {
    var L = D.LEARN[key]; if (!L || !g) return '';
    g.learned = g.learned || {};
    if (g.learned[key]) return '';
    g.learned[key] = true;
    return '<div class="learn learn-inline">' + A.advisor() + '<div><span class="kicker">Le saviez-vous ?</span><b>' + esc(L.title) + '</b><p>' + esc(L.text) + '</p></div></div>';
  }

  /* ---------- Partie ---------- */
  function startGame(pid, prog) {
    g = E.createGame(pid); me = pid; selected = null; queue = []; theme = null; themePicked = false; advisorHidden = false;
    E.setProgramme(g, pid, prog || party(pid).programme);
    go('game');
    nextTurn();
  }
  function mePl() { return E.player(g, me); }

  function nextTurn() {
    var info = E.startTurn(g);
    queue = []; themePicked = false; theme = E.bestTheme(g, me, selected); advisorHidden = false;
    // les affaires et le dilemme des IA se règlent tout de suite ; les tiens t'attendent après le journal
    var aiAff = [];
    g.affairs.filter(function (a) { return a.pid !== me; }).forEach(function (a) { aiAff.push(Object.assign({ src: a.src }, E.resolveAffair(g, a.pid, AI.chooseReaction(g, a.pid)))); });
    var aiDil = null;
    if (info.dilemma && info.dilemma.pid !== me) aiDil = E.resolveDilemma(g, info.dilemma.pid, AI.chooseDilemma(g, info.dilemma.pid));
    render();
    var mine = g.affairs.filter(function (a) { return a.pid === me; });
    var waits = mine.length || (g.dilemma && g.dilemma.pid === me);
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
    var html = '<div class="aff-vign">' + A.vignette('scandale') + '</div><p><b>' + esc(src) + '</b> ' + esc(a.text) + '</p>' + learnBox('affaires') +
      '<div class="pick">' + D.REACTIONS.map(function (rc, i) {
        return '<button type="button" class="pick-row" data-rc="' + i + '"><span class="pick-txt"><b>' + esc(rc.label) + '</b><small>' + esc(rc.hint) + '</small></span></button>';
      }).join('') + '</div>';
    modal({ kicker: '💥 Affaire', title: a.title, html: html, buttons: [],
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
    var h = '<div class="paper"><div class="paper-mast">LE QUOTIDIEN NATIONAL <span>· Tour ' + g.turn + '</span></div>' +
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
      if (x.pid === me) b.push(line('📋', 'Ton programme coûte <b>' + x.budget + ' Md€</b> : ' + (x.over > 0 ? 'non financé, ça va se voir…' : 'financé.') + (x.cas ? ' (+' + x.cas + ' casserole' + (x.cas > 1 ? 's' : '') + ')' : '')));
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
    else if (g.turn === 7) h += learnBox('temps_parole');
    return h;
  }
  /* ---------- v0.7 : Lulu, la directrice de campagne — un conseil clair par tour ---------- */
  function advice() {
    var pl = mePl(), ph = E.measure(pl.phare), hot = g.hot || [];
    if (g.turn === 1) return 'Bienvenue ! Parle de ta mesure phare (' + th(ph.theme).icon + ' ' + th(ph.theme).short + ') : touche une région qui s\'en soucie, puis 📣 Meeting.';
    if (E.isDebateTurn(g) && pl.infl < 2) return 'Débat télévisé ce soir 🎙️ et tu n\'as presque plus d\'influence ★. Évite la Télé ce tour-ci pour garder de quoi te préparer.';
    if (E.isDebateTurn(g)) return 'Débat télévisé ce soir 🎙️ ! Garde 2 ou 3 ★ pour la préparation : chaque ★ vaut 1 point.';
    if (pl.forme <= 1) return 'Ton candidat est épuisé (⚡ ' + pl.forme + '). Évite Meeting et Télé : un 📱 Buzz ou une 💰 Collecte ne le fatiguent pas.';
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
    }).sort(function (a, b) { return b.pts - a.pts; })[0];
    if (close) return 'Tu es tout près de prendre ' + close.name + ' (' + close.pts + ' pts) : un Meeting bien ciblé peut suffire.';
    if (pl.money < 3) return 'Les caisses sont vides. Une 💰 Collecte (menu Plus) renfloue le parti.';
    if (pl.militants === 0 && g.turn <= 4) return 'Pense aux 👥 militants (menu Plus) : implantés tôt, ils te rapportent des électeurs à chaque tour.';
    var lead = E.ranking(g)[0];
    if (lead !== me && E.player(g, lead).cas > 0 && E.allyOf(g, me) !== lead) return party(lead).short + ' est en tête et traîne des casseroles : une 🔎 enquête (menu Plus) pourrait le faire trébucher.';
    var o = D.OBJECTIVES.filter(function (x) { return x.id === pl.objective; })[0];
    if (!E.objectiveMet(g, me, pl.objective)) return 'N\'oublie pas ton objectif secret : ' + o.text.charAt(0).toLowerCase() + o.text.slice(1) + '. Il rapporte des voix en plus.';
    return 'Vise les régions qui pèsent lourd : le chiffre sur la carte, c\'est leur nombre de points.';
  }
  function renderAdvisor() {
    var box = $('advisor');
    if (!g || g.phase !== 'actions' || advisorHidden) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = '<span class="adv-face">' + A.advisor() + '</span><p><b>' + D.ADVISOR.name + ' :</b> ' + esc(advice()) + '</p><button type="button" class="adv-close" aria-label="Masquer le conseil">✕</button>';
    box.querySelector('.adv-close').addEventListener('click', function () { advisorHidden = true; renderAdvisor(); });
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
      if (a.type === 'fonds') { m += me === 'EM' ? 4 : me === 'VP' ? 2 : 3; if (me === 'EM') f += 1; }
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
    queue.push(act); render(); T.notify('queue');
  }

  /* ---------- Rendu ---------- */
  function render() {
    if (!g) return;
    var pl = mePl(), pr = projected();
    $('turn-label').textContent = 'TOUR ' + g.turn + ' / ' + R.maxTurns;
    $('phase-label').textContent = E.isDebateTurn(g) ? 'Actions · débat ce tour' : 'Actions';
    function pill(id, sym, now, before) { $(id).innerHTML = sym + ' ' + now + (now !== before ? '<small>/' + before + '</small>' : ''); }
    pill('res-money', '€', pr.money, pl.money); pill('res-infl', '★', pr.infl, pl.infl); pill('res-forme', '⚡', pr.forme, pl.forme);
    $('res-forme').classList.toggle('low', pr.forme <= 0);
    // dynamique et casseroles : une seule ligne discrète dans l'encadré du sondage
    var st = [];
    if (pl.momentum > 0) st.push('<span class="st st-up">↗ En dynamique</span>');
    if (pl.momentum < 0) st.push('<span class="st st-down">↘ Passage à vide</span>');
    if (pl.cas > 0) st.push('<span class="st st-cas" title="Casseroles">' + new Array(pl.cas + 1).join('🍳') + '</span>');
    $('race-status').innerHTML = st.length ? st.join('') : '50 % = élu direct';
    renderRace(); renderNews(); renderAdvisor(); renderMap(); renderRegion(); renderQueue(); renderMessage(); renderActions();
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
      var mil = (g.bases[selected] || []).indexOf(p.id) >= 0 ? ' 👥' : '';
      return '<span class="force' + (p.id === me ? ' me' : '') + '"><i style="background:' + P.color + '"></i>' + (p.id === me ? 'Toi' : p.id) + ' <b>' + n + '</b>' + mil + '</span>';
    }).join('') + '<span class="force-hint">cubes · ' + E.minControl(me) + ' pour tenir</span></div>';
    var mk = E.markerAt(g, selected);
    if (mk) html += '<div class="mk-line">' + mk.icon + ' ' + esc(mk.title) + ' : ici, ' + th(mk.theme).icon + ' ' + esc(th(mk.theme).name) + ' compte comme à la une.</div>';
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
      case 'reseaux': return 'dé : <b>−1 à +' + (4 + (E.isHot(g, act.theme) ? 1 : 0)) + '</b> cubes';
      case 'imposer': return 'ton thème <b>à la une</b>';
      case 'contre': return 'rival en tête <b>−2 cubes</b> · +1 🍳';
      case 'militants': return '<b>+1 cube</b> ici à chaque tour · ' + (R.militantsMax - mePl().militants) + ' équipe' + (R.militantsMax - mePl().militants > 1 ? 's' : '') + ' dispo';
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
  var MAIN = ['terrain', 'medias', 'reseaux'];
  function renderActions() {
    var box = $('actions'); box.innerHTML = '';
    MAIN.forEach(function (type) {
      var def = D.ACTIONS[type], act = { type: type, region: selected || undefined, theme: theme };
      var big = type === 'terrain' || type === 'medias' ? (selected ? '+' + bigGain(act) : '—') : (selected ? '🎲' : '—');
      var b = el('button', { class: 'tile', type: 'button', 'aria-label': def.name + ', ' + costLabel(act) },
        '<span class="tile-n">' + def.icon + ' ' + def.name + '</span><span class="tile-big">' + big + '</span>' +
        (selected && tiring(act) && !canQueue(act) ? '<span class="tile-cost tile-warn">⚠️ risque de gaffe</span>' : '<span class="tile-cost">' + costLabel(act, true) + '</span>'));
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
    ['militants', 'imposer', 'contre', 'fonds', 'reforme'].forEach(function (type) {
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

  function resolve() {
    T.stop();
    // photo avant les actions, pour le flash info
    var before = {}, ctrl0 = {}, allies0 = Object.assign({}, g.alliances);
    E.poll(g).forEach(function (x) { before[x.pid] = x.pct; });
    D.REGIONS.forEach(function (r) { ctrl0[r.id] = g.regions[r.id].controller; });
    var plans = {}; plans[me] = queue.slice();
    g.players.forEach(function (p) { if (!p.human) plans[p.id] = AI.plan(g, p.id); });
    var log = E.resolveActions(g, plans);
    queue = []; render();
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
    log.filter(function (l) { return l.gaffe; }).forEach(function (l) { heads.push({ w: 15, t: '😬 <b>Gaffe</b> de ' + esc(who(l.pid)) + ' en ' + (l.region ? esc(E.REG[l.region].name) : 'campagne') + ' : le candidat était épuisé.' }); });
    Object.keys(g.alliances).forEach(function (pid) {
      var o = g.alliances[pid];
      if (pid < o && allies0[pid] !== o) heads.push({ w: 14, t: '🤝 Alliance surprise entre <b>' + esc(who(pid)) + '</b> et <b>' + esc(who(o)) + '</b>.' });
    });
    log.filter(function (l) { return l.credUp && l.pid === me; }).forEach(function (l) { heads.push({ w: 9, t: '📈 Tu deviens crédible sur ' + esc(th(l.credUp).name) + '.' }); });
    heads.sort(function (a, b) { return b.w - a.w; });
    var h = '<div class="flash"><div class="flash-band"><span class="flash-live">● Direct</span><span class="flash-ch">INFO-CONTINU</span><span class="flash-tag">FLASH INFO</span></div><div class="flash-body">';
    h += heads.length ? heads.slice(0, 4).map(function (x) { return '<p>' + x.t + '</p>'; }).join('') : '<p>Calme plat : aucune région ne change de main ce soir.</p>';
    h += '</div><div class="flash-ticker">' + E.poll(g).map(function (x) {
      var d = (x.pct - (before[x.pid] || 0)) * 100, arr = d >= 0.5 ? '<i class="up">▲' + d.toFixed(1) + '</i>' : d <= -0.5 ? '<i class="down">▼' + (-d).toFixed(1) + '</i>' : '<i>=</i>';
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
  function regionWinner(rid) {
    var best = null, bn = 0;
    g.players.forEach(function (p) { var n = E.cubes(g, rid, p.id); if (n > bn) { bn = n; best = p.id; } });
    return best;
  }
  function electionNight() {
    $('toast').hidden = true;
    var res = g.result, win = g.winner, P = party(win);
    var pct = res.direct ? res.first[0].pct : (res.second.a === win ? res.second.pctA : res.second.pctB);
    nightTimers.forEach(clearTimeout); nightTimers = []; nightDone = false;
    var mapEl = $('night-map'); mapEl.innerHTML = '';
    var paths = {};
    D.REGIONS.forEach(function (r) {
      var p = svg('path', { d: M.regions[r.id].d, fill: '#3B4170', stroke: '#F4F0E6', 'stroke-width': 1.2, 'stroke-linejoin': 'round', class: 'night-reg' });
      mapEl.appendChild(p); paths[r.id] = p;
    });
    $('night-stage').innerHTML = '<p class="night-wait">Les derniers bureaux de vote ferment…</p>';
    $('night-bars').innerHTML = ''; $('night-clock').hidden = false; $('night-clock').textContent = '19:59:55';
    $('night-btn').textContent = 'Passer';
    go('night');
    // compte à rebours
    [56, 57, 58, 59].forEach(function (sec, i) { later(function () { $('night-clock').textContent = '19:59:' + sec; }, 650 * (i + 1)); });
    later(reveal, 650 * 5);
    function reveal() {
      $('night-clock').textContent = '20:00';
      $('screen-night').classList.add('flash20');
      $('night-stage').innerHTML = '<div class="night-est">Estimation · ' + (res.direct ? 'élu dès le 1er tour' : 'second tour') + '</div>' +
        '<div class="portrait" style="background:' + P.color + ';color:' + P.ink + '"><span class="portrait-art">' + A.portrait(win) + '</span><span class="portrait-name">' + esc(P.candidate) + ' · ' + esc(P.short) + '</span></div>' +
        '<div class="night-pct">' + (pct * 100).toFixed(1).replace('.', ',') + ' %</div>' +
        '<div class="night-who">' + (win === me ? '🎉 C\'EST TOI ! Tu es élu président.' : esc(P.name) + ' remporte l\'élection.') + '</div>';
      later(colorMap, 2600);
    }
    function colorMap() {
      $('screen-night').classList.remove('flash20');
      D.REGIONS.slice().sort(function (a, b) { return a.pts - b.pts; }).forEach(function (r, i) {
        later(function () { var w = regionWinner(r.id); if (w) { paths[r.id].setAttribute('fill', party(w).color); paths[r.id].classList.add('pop'); } }, 140 * i);
      });
      later(showBars, 140 * D.REGIONS.length + 300);
    }
    function showBars() {
      var list = res.second ? [{ pid: res.second.a, pct: res.second.pctA }, { pid: res.second.b, pct: res.second.pctB }].sort(function (x, y) { return y.pct - x.pct; }) : res.first;
      $('night-bars').innerHTML = '<div class="kicker kicker-yellow">' + (res.second ? 'Second tour' : 'Premier tour') + '</div>' + list.map(function (x) {
        var p = party(x.pid);
        return '<div class="nb-row"><span class="nb-lbl">' + (x.pid === me ? 'Toi' : esc(p.short)) + '</span><span class="nb-bar"><i style="background:' + p.color + '" data-w="' + (100 * x.pct) + '"></i></span><b>' + (100 * x.pct).toFixed(1).replace('.', ',') + ' %</b></div>';
      }).join('');
      requestAnimationFrame(function () { Array.prototype.forEach.call(document.querySelectorAll('.nb-bar i'), function (i) { i.style.width = i.getAttribute('data-w') + '%'; }); });
      $('night-bars').innerHTML += '<div class="night-learn">' + learnBox(res.second ? 'second_tour' : 'vingt_heures') + '</div>';
      nightDone = true; $('night-btn').textContent = 'Voir les résultats détaillés';
    }
    $('night-btn').onclick = function () {
      if (nightDone) { nightTimers.forEach(clearTimeout); return endGame(); }
      // passer : on saute directement à la fin de la mise en scène
      nightTimers.forEach(clearTimeout); nightTimers = [];
      reveal(); nightTimers.forEach(clearTimeout); nightTimers = [];
      $('screen-night').classList.remove('flash20');
      D.REGIONS.forEach(function (r) { var w = regionWinner(r.id); if (w) paths[r.id].setAttribute('fill', party(w).color); });
      $('night-stage').querySelector('.portrait').classList.add('instant');
      showBars();
    };
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
    var pl = mePl(), o = D.OBJECTIVES.filter(function (x) { return x.id === pl.objective; })[0], p = party(me);
    var html = '<div class="cand-line">' + A.portrait(me) + '<div><b class="cand-name">' + esc(p.candidate) + '</b><span>' + esc(p.candTitle) + '</span></div></div>' +
      '<p>🎯 <b>Objectif secret :</b> ' + esc(o.name) + ' — ' + esc(o.text) + ' (+' + o.bonus + ' pts).</p>' +
      '<div class="brief"><div class="kicker">Ton programme · ' + pl.budget + ' Md€</div>' + pl.programme.map(function (id, i) {
        var m = E.measure(id); return line(i === 0 ? '★' : th(m.theme).icon, esc(m.name) + (i === 0 ? ' <span class="muted">(mesure phare : +1 cube en Meeting sur ' + esc(th(m.theme).name) + ')</span>' : ''));
      }).join('') + '</div>' +
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
    modal({ kicker: 'Règles v0.7', title: 'Comment gagner', html:
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
        '<li>👥 <b>Militants</b> (3 €) : une équipe dans la région, +1 cube à chaque début de tour (3 équipes au plus).</li>' +
        '<li>🤝 <b>Alliance</b> (1 ★) et 2 cartes spéciales par parti.</li></ul>' +
      '<p><b>⚡ La forme du candidat</b> (4 au plus, +2 par tour). Meeting et Télé coûtent 1 ⚡. Si une action la fait tomber à 0, le candidat épuisé peut faire une <b>gaffe</b> (4 chances sur 10) : aucun cube et une casserole.</p>' +
      '<p><b>↗ La dynamique.</b> Si tu gagnes 1,5 point au sondage en un tour, tes Meetings rapportent 1 cube de plus au tour suivant. Si tu en perds 1,5, 1 de moins.</p>' +
      '<p><b>Crédibilité qui évolue.</b> Après 3 actions sur un même thème, ta crédibilité dessus augmente (2 au plus).</p>' +
      '<p><b>📋 Ton programme.</b> Avant la campagne, choisis 5 mesures. Chacune te rend plus crédible sur son thème. La 1re est ta <b>mesure phare</b> : +1 cube sur tes Meetings qui en parlent. Au-delà de 40 Md€, le programme n\'est pas financé : casseroles, et une affaire au tour 3. Les mesures 💥 choc font parler (+1 cube dans 2 régions) mais ajoutent une casserole.</p>' +
      '<p><b>💥 Les affaires.</b> Chaque casserole 🍳 donne 12 % de risque d\'affaire par tour. Le Canard Déchaîné en sort aussi de temps en temps, et un rival peut <b>🔎 enquêter</b> sur toi. Quand une affaire tombe, tu choisis ta réaction : nier, t\'excuser, sacrifier un collaborateur ou accuser les médias.</p>' +
      '<p><b>🤔 Les dilemmes.</b> Chaque tour, un parti (à tour de rôle) doit faire un choix. Certains choix ont des <b>conséquences différées</b> qui peuvent ressortir quelques tours plus tard.</p>' +
      '<p><b>Les crises.</b> Chaque partie connaît une crise en 3 actes (krach, grève, été brûlant, désindustrialisation). Les régions touchées sont marquées sur la carte : leur thème y compte comme à la une.</p>' +
      '<p><b>🎙️ Le débat télévisé</b> (tours 3, 6 et 8) : chaque parti affronte les 3 autres, une question chacun. Choisis ta réplique : 🥊 Attaque bat ❤️ Émotion, ❤️ Émotion bat 📊 Chiffres, 📊 Chiffres bat 🥊 Attaque, 🙃 Esquive = nul. Manche gagnée 2 points, nulle 1. Bonus : 🥊 +1 si le rival a des casseroles, 📊 +1 sur ton point fort (−1 si ce n\'est pas ton sujet), ❤️ +1 si le thème fait l\'actu. Chaque ★ de préparation (3 au plus) = +1 point. Le 1er gagne +1 cube dans 4 régions, le 2e dans 2 régions (doublé au débat final). Chaque parti a son tempérament : observe-le !</p>' +
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

  renderTitleMap();
  renderChoose();
})();

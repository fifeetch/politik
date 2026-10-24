/* Politik — tutoriel guidé du premier tour.
   Met en lumière une zone de l'écran et affiche une bulle d'explication. */
(function () {
  var KEY = 'politik_tuto_done';
  var STEPS = [
    { target: null, title: 'Bienvenue en campagne !',
      text: 'Tu as <b>8 tours de campagne</b> pour gagner des électeurs dans les régions. Ensuite on vote : <b>premier tour</b>, puis <b>second tour</b> entre les deux premiers.' },
    { target: '.news', title: 'L\'actualité',
      text: 'Chaque tour, un thème fait la une. Parler de ce thème rapporte plus… à tous les partis. Touche le bandeau pour relire la une.' },
    { target: '.race', title: 'Le sondage',
      text: 'Les intentions de vote si l\'élection avait lieu maintenant. Le trait noir, c\'est 50 % : au-delà, tu es élu dès le premier tour.' },
    { target: '.map-wrap', title: 'La carte',
      text: 'Le chiffre d\'une région, c\'est son nombre d\'inscrits, en millions : plus il est gros, plus elle pèse. Sa couleur indique le parti qui la contrôle (gris : personne).<br><b>Touche une région</b> pour continuer.', wait: 'region' },
    { target: '#region-info', title: 'La région',
      text: 'Ses inscrits, son abstention et ce qui la préoccupe (les icônes). En dessous, les <b>cubes</b> de chaque parti = ses électeurs. Le plus de cubes (au moins 3) donne le <b>contrôle</b> de la région.' },
    { target: '#message', title: 'Ton message',
      text: 'Chaque campagne parle d\'un <b>thème</b>. Le meilleur pour cette région est déjà choisi. Les petits points montrent son impact : plus il y en a, plus ça rapporte.<br>Touche cette ligne quand tu veux parler d\'autre chose.' },
    { target: '#actions', title: 'Tes actions',
      text: 'Le gros chiffre = les cubes que tu vas gagner. <b>📣 Meeting</b> : ici. <b>📺 Télé</b> : sur 3 régions. <b>🚪 Mobiliser</b> : faire voter des abstentionnistes.<br><b>Touche « Meeting »</b> pour la programmer.', wait: 'queue' },
    { target: '.queue', title: '3 actions par tour',
      text: 'Ton action est programmée (son numéro apparaît sur la carte). Touche-la pour l\'annuler.' },
    { target: '#btn-more', title: 'Plus d\'options',
      text: 'Ici : le <b>Buzz</b>, implanter des <b>militants</b>, attaquer un rival, collecter de l\'argent, faire la une, tes <b>2 cartes spéciales</b> et les <b>alliances</b>.' },
    { target: '.res', title: 'Argent et influence',
      text: '<b>€</b> paie les campagnes. <b>★</b> (influence) sert à la télé, aux attaques et aux débats. <b>⚡</b> c\'est la forme de ton candidat : Meeting et Télé le fatiguent. Le petit « /7 » = ce que tu avais avant tes actions.<br>Le bouton <b>•••</b> montre ton objectif secret et l\'état de ton candidat.' },
    { target: '#btn-validate', title: 'À toi de jouer',
      text: 'Choisis encore 2 actions, puis <b>Valider</b>. Tous les partis jouent en secret et en même temps, puis les actions sont révélées une à une.', last: true }
  ];
  var i = -1, active = false, focusEl = null, bubble = null;

  function done() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function markDone() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }

  function clearFocus() { if (focusEl) focusEl.classList.remove('tuto-focus'); focusEl = null; }
  function stop(finished) {
    active = false; clearFocus();
    if (bubble) bubble.remove(); bubble = null;
    var dim = document.getElementById('tuto-dim'); if (dim) dim.hidden = true;
    markDone();
  }
  function show() {
    var s = STEPS[i], app = document.getElementById('app');
    clearFocus();
    if (!bubble) { bubble = document.createElement('div'); bubble.className = 'tuto-bubble'; bubble.setAttribute('role', 'dialog'); app.appendChild(bubble); }
    var dim = document.getElementById('tuto-dim');
    if (s.target) {
      focusEl = document.querySelector(s.target);
      if (focusEl) focusEl.classList.add('tuto-focus');
      if (dim) dim.hidden = true;
    } else if (dim) dim.hidden = false;
    var btn = s.wait ? '' : '<button type="button" class="btn btn-ink btn-small" data-tuto="next">' + (s.last ? 'C\'est parti !' : 'Suivant') + '</button>';
    bubble.innerHTML = '<div class="tuto-top"><span class="kicker">Tutoriel · ' + (i + 1) + ' / ' + STEPS.length + '</span>' +
      '<button type="button" class="tuto-skip" data-tuto="skip">Passer</button></div>' +
      '<div class="tuto-title">' + s.title + '</div><p>' + s.text + '</p>' + btn;
    // bulle en bas si la zone est en haut, et inversement
    var r = focusEl ? focusEl.getBoundingClientRect() : null, ar = app.getBoundingClientRect();
    var upper = r ? (r.top + r.height / 2 - ar.top) < ar.height / 2 : false;
    bubble.classList.toggle('at-bottom', !!(r && upper));
    bubble.classList.toggle('at-top', !!(r && !upper));
    bubble.classList.toggle('at-center', !r);
  }
  function next() {
    i++;
    if (i >= STEPS.length) { stop(); return; }
    show();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tuto]'); if (!t) return;
    if (t.getAttribute('data-tuto') === 'next') next();
    else stop('skip');
  });

  window.PolitikTuto = {
    /* force = true : relancer le tutoriel même s'il a déjà été vu */
    maybeStart: function (force) {
      if (active || (!force && done())) return;
      active = true; i = -1;
      var dim = document.getElementById('tuto-dim');
      if (!dim) { dim = document.createElement('div'); dim.id = 'tuto-dim'; dim.className = 'tuto-dim'; document.getElementById('app').appendChild(dim); }
      next();
    },
    notify: function (what) {
      if (!active) return;
      var s = STEPS[i];
      if (s && s.wait === what) setTimeout(next, 150);
      else if (s && s.target) setTimeout(show, 0); // l'écran a été redessiné : on remet la mise en lumière
    },
    isActive: function () { return active; },
    stop: function () { if (active) stop(); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
})();

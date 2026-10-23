/* Politik — tutoriel guidé du premier tour.
   Met en lumière une zone de l'écran et affiche une bulle d'explication. */
(function () {
  var KEY = 'politik_tuto_done';
  var STEPS = [
    { target: null, title: 'Bienvenue en campagne !',
      text: 'Tu as <b>8 tours de campagne</b> pour gagner des électeurs dans les régions. Ensuite on vote : <b>premier tour</b>, puis <b>second tour</b> entre les deux premiers.' },
    { target: '.race', title: 'Le sondage',
      text: 'Les intentions de vote si l\'élection avait lieu maintenant. Le trait noir, c\'est 50 % : au-delà, tu es élu dès le premier tour.' },
    { target: '.map-wrap', title: 'La carte',
      text: 'Le chiffre d\'une région, ce sont ses points. Sa couleur indique le parti qui la contrôle (gris : personne).<br><b>Touche une région</b> pour continuer.', wait: 'region' },
    { target: '#region-info', title: 'Les forces en présence',
      text: 'Chaque carré coloré est un <b>cube</b> = des électeurs. Avoir le plus de cubes (au moins 3) donne le <b>contrôle</b> de la région : plus d\'argent et un bonus de voix. « Proche » signale un parti voisin : tu peux lui prendre des électeurs en faisant campagne ici.' },
    { target: '#actions', title: 'Tes actions',
      text: 'La plus simple : <b>Terrain</b>, +2 cubes pour 2 €.<br><b>Touche « Terrain »</b> pour la programmer dans cette région.', wait: 'queue' },
    { target: '.queue', title: '3 actions par tour',
      text: 'Ton action est programmée (le petit numéro apparaît aussi sur la carte). Tu as 3 actions par tour. Touche une action jaune pour l\'annuler.' },
    { target: '.res', title: 'Argent et influence',
      text: '<b>€</b> paie les campagnes. <b>★</b> sert aux médias, aux attaques et aux débats.<br>« 5 / 7 » veut dire : il te restera 5 sur les 7 que tu as.<br>Le bouton <b>•••</b> montre ton objectif secret.' },
    { target: '#cards', title: 'Tes cartes spéciales',
      text: 'Deux cartes puissantes, propres à ton parti, à usage unique. Le bouton jaune <b>Alliance</b> permet de s\'allier à un parti proche : précieux pour le second tour !' },
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

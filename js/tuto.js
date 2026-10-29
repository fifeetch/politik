/* Politik — tutoriel du premier tour (v2.0 : on apprend en jouant).
   4 étapes, une phrase chacune, dites par Lulu. Chaque étape attend un geste du joueur :
   pas de bouton « Suivant », pas de pavé à lire. */
(function () {
  var KEY = 'politik_tuto_done';
  var STEPS = [
    { target: '.map-wrap', wait: 'region', pulse: true,
      text: '👆 Touche la région qui clignote.' },
    { target: '#actions [data-act="terrain"]', wait: 'queue',
      text: '📣 Lance un <b>Meeting</b>. Le chiffre en <b style="color:#2F6EBA">bleu</b> : ce qu\u2019il te fait gagner au sondage, en France.' },
    { target: null, wait: 'full', pos: 'top',
      text: 'Bravo ! Ajoute une ou deux actions si tu as assez d\'argent (€), puis <b>Valider</b>.' },
    { target: '#btn-validate', wait: 'validate',
      text: '✅ <b>Valider</b> : tous les partis jouent en même temps.' }
  ];
  var i = -1, active = false, focusEl = null, bubble = null, pulseRid = null;

  function done() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function markDone() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }

  function clearFocus() {
    if (focusEl) focusEl.classList.remove('tuto-focus'); focusEl = null;
    Array.prototype.forEach.call(document.querySelectorAll('.tuto-pulse'), function (x) { x.classList.remove('tuto-pulse'); });
  }
  function stop() {
    active = false; clearFocus();
    if (bubble) bubble.remove(); bubble = null;
    markDone();
    document.dispatchEvent(new Event('politik:tuto-end'));
  }
  function face() { var A = window.PolitikArt; return A && A.advisor ? A.advisor() : ''; }
  function show() {
    var s = STEPS[i], app = document.getElementById('app');
    clearFocus();
    if (!bubble) { bubble = document.createElement('div'); bubble.className = 'tuto-bubble'; bubble.setAttribute('role', 'dialog'); bubble.setAttribute('aria-live', 'polite'); app.appendChild(bubble); }
    if (s.target) { focusEl = document.querySelector(s.target); if (focusEl) focusEl.classList.add('tuto-focus'); }
    if (s.pulse && pulseRid) {
      var p = document.querySelector('#map [data-rid="' + pulseRid + '"]'); if (p) p.classList.add('tuto-pulse');
    }
    bubble.innerHTML = '<span class="tb-face">' + face() + '</span><p>' + s.text + '</p>' +
      '<div class="tb-side"><span class="tb-dots">' + STEPS.map(function (x, k) { return '<i class="' + (k <= i ? 'on' : '') + '"></i>'; }).join('') + '</span>' +
      '<button type="button" class="tuto-skip" data-tuto="skip">Passer</button></div>';
    // bulle en bas si la zone est en haut, et inversement
    var r = focusEl ? focusEl.getBoundingClientRect() : null, ar = app.getBoundingClientRect();
    var upper = r ? (r.top + r.height / 2 - ar.top) < ar.height / 2 : false;
    var top = s.pos === 'top' || (r && !upper);
    bubble.classList.toggle('at-bottom', !top);
    bubble.classList.toggle('at-top', !!top);
    bubble.classList.remove('at-center');
  }
  function next() {
    i++;
    if (i >= STEPS.length) { stop(); return; }
    show();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tuto]'); if (!t) return;
    stop();
  });

  window.PolitikTuto = {
    /* force = true : relancer le tutoriel même s'il a déjà été vu. opts.region : la région à faire clignoter */
    maybeStart: function (force, opts) {
      if (active || (!force && done())) return;
      active = true; i = -1; pulseRid = (opts && opts.region) || null;
      next();
    },
    notify: function (what) {
      if (!active) return;
      var s = STEPS[i];
      if (s && s.wait === what) setTimeout(next, 150);
      else if (what === 'full' && s && s.wait === 'queue') { i++; setTimeout(next, 150); } // déjà 3 actions : on saute une étape
      else setTimeout(show, 0); // l'écran a été redessiné : on remet la mise en lumière
    },
    /* la région qui clignote sur la carte (seulement pendant l'étape qui la demande) */
    pulseRegion: function () { return active && STEPS[i] && STEPS[i].pulse ? pulseRid : null; },
    isActive: function () { return active; },
    stop: function () { if (active) stop(); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
})();

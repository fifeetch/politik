/* Politik — les animations (v1.4).
   Petits outils réutilisables : on les appelle depuis ui.js.
   Règle d'or : une animation ne joue que si le joueur la voit. Tant qu'une fenêtre (modale) couvre l'écran,
   FX.whenFree() met l'animation en attente, puis la lance quand la fenêtre se ferme.
   Si le téléphone demande « moins d'animations » (réglage d'accessibilité), tout s'affiche directement. */
(function (root) {
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduced = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var appNode = null, holds = 0, pending = [], flushTimer = null;

  function app() { return appNode || (appNode = document.getElementById('app')); }
  function noop() {}

  /* ---------- Attendre que l'écran soit visible ---------- */
  function blocked() { return holds > 0 || app().classList.contains('modal-open'); }
  function schedule() { clearTimeout(flushTimer); flushTimer = setTimeout(flush, 40); }
  function flush() {
    if (blocked()) return;
    var list = pending; pending = [];
    list.forEach(function (p) { p.fn(); });
  }
  /* Lance fn dès que plus rien ne couvre l'écran. Une même clé remplace l'attente précédente. */
  function whenFree(key, fn) {
    pending = pending.filter(function (p) { return p.key !== key; });
    pending.push({ key: key, fn: fn });
    schedule();
  }
  function setModal(open) { app().classList.toggle('modal-open', !!open); if (!open) schedule(); }
  /* hold / release : « attends, je joue une séquence » (le replay du tour par exemple) */
  function hold() { holds++; }
  function release() { holds = Math.max(0, holds - 1); schedule(); }

  /* ---------- Le moteur : une animation image par image ---------- */
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function tween(ms, step, done) {
    if (reduced || ms <= 0) { step(1); if (done) done(); return { stop: noop }; }
    var t0 = null, live = true;
    function frame(now) {
      if (!live) return;
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / ms);
      step(t);
      if (t < 1) requestAnimationFrame(frame); else if (done) done();
    }
    requestAnimationFrame(frame);
    return { stop: function () { live = false; } };
  }
  function wait(ms, fn) { return setTimeout(fn, reduced ? 0 : ms); }

  function mk(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }
  function defsOf(svgEl) {
    var d = svgEl.querySelector('defs');
    if (!d) { d = mk('defs'); svgEl.insertBefore(d, svgEl.firstChild); }
    return d;
  }

  /* ---------- 1. La région qui bascule : l'encre se répand depuis le centre ---------- */
  var INK_MAX = 95;   // rayon qui couvre la plus grande région de la carte
  function inkRadius(p) { return INK_MAX * ease(p); }
  /* Dessine la couche d'encre (au rayon atteint p) juste au-dessus du contour de la région */
  function inkLayer(svgEl, key, after, d, x, y, color, p) {
    var cp = mk('clipPath', { id: 'ink-' + key });
    cp.appendChild(mk('circle', { id: 'ink-c-' + key, cx: x, cy: y, r: inkRadius(p) }));
    defsOf(svgEl).appendChild(cp);
    var over = mk('path', { d: d, fill: color, 'clip-path': 'url(#ink-' + key + ')', class: 'ink' });
    after.parentNode.insertBefore(over, after.nextSibling);
    return over;
  }
  function inkSet(key, p) { var c = document.getElementById('ink-c-' + key); if (c) c.setAttribute('r', inkRadius(p)); }
  /* Une onde qui part du centre (comme une goutte qui tombe) */
  function ripple(svgEl, x, y, color, big) {
    if (reduced) return;
    var c = mk('circle', { cx: x, cy: y, r: 2, fill: 'none', stroke: color, 'stroke-width': 3, class: 'ripple' });
    svgEl.appendChild(c);
    tween(big ? 1100 : 800, function (t) {
      c.setAttribute('r', 2 + (big ? 46 : 32) * ease(t));
      c.setAttribute('stroke-width', 3 * (1 - t) + .3);
      c.setAttribute('opacity', 1 - t);
    }, function () { c.remove(); });
  }

  /* ---------- 2. Le candidat qui se déplace sur la carte ---------- */
  var PAWN = 28;
  function pawn(svgEl, x, y, portraitSvg, color) {
    var g = mk('g', { class: 'pawn', transform: 'translate(' + x + ',' + y + ')' });
    g.appendChild(mk('ellipse', { cx: 0, cy: 1, rx: 7, ry: 2.6, class: 'pawn-shadow' }));
    var body = mk('g', { class: 'pawn-body' });
    body.appendChild(mk('path', { d: 'M-5,-6 L0,0 L5,-6 Z', fill: color || '#23203A', class: 'pawn-tip' }));
    var img = mk('svg', { x: -PAWN / 2, y: -PAWN - 4, width: PAWN, height: PAWN, viewBox: '0 0 120 120' });
    // le portrait dessiné dans art.js : on garde seulement l'intérieur de son <svg>
    img.innerHTML = String(portraitSvg || '').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    body.appendChild(img);
    g.appendChild(body);
    svgEl.appendChild(g);
    return g;
  }
  function placePawn(g, x, y) { g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')'); }
  /* Courbe légèrement bombée d'une région à l'autre, avec une trace en pointillés */
  function route(svgEl, g, a, b, ms, done) {
    var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) { hop(g, a, done); return; }
    var cx = (a.x + b.x) / 2 - dy * 0.25, cy = (a.y + b.y) / 2 + dx * 0.25 - len * 0.12;
    function pt(t) { var u = 1 - t; return { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y }; }
    var trail = mk('path', { class: 'trail', d: 'M' + a.x + ',' + a.y });
    svgEl.insertBefore(trail, g);
    var dur = Math.max(420, Math.min(ms, 260 + len * 6));
    tween(dur, function (t) {
      var e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;   // départ et arrivée en douceur
      var d = 'M' + a.x + ',' + a.y, n = Math.max(1, Math.round(24 * e));
      for (var i = 1; i <= n; i++) { var p = pt(e * i / n); d += ' L' + p.x.toFixed(1) + ',' + p.y.toFixed(1); }
      trail.setAttribute('d', d);
      var q = pt(e);
      placePawn(g, q.x, q.y - Math.sin(Math.PI * e) * 6);
    }, function () { placePawn(g, b.x, b.y); land(g); if (done) done(); });
  }
  function land(g) { g.classList.remove('landed'); void g.getBoundingClientRect(); g.classList.add('landed'); }
  function hop(g, a, done) {
    tween(380, function (t) { placePawn(g, a.x, a.y - Math.sin(Math.PI * t) * 8); }, function () { land(g); if (done) done(); });
  }

  /* Un chiffre qui s'envole (+2, −1…) au-dessus d'une région */
  function floatText(svgEl, x, y, text, cls) {
    var t = mk('text', { x: x, y: y, class: 'float ' + (cls || '') });
    t.textContent = text;
    svgEl.appendChild(t);
    tween(1300, function (p) { t.setAttribute('y', y - 16 * ease(p)); t.setAttribute('opacity', p < .6 ? 1 : 1 - (p - .6) / .4); }, function () { t.remove(); });
  }

  /* ---------- 3. Les abstentionnistes : des silhouettes grises qui prennent ta couleur ---------- */
  function voters(svgEl, x, y, n, color, done) {
    var total = 5, gap = 10, x0 = x - gap * (total - 1) / 2, g = mk('g', { class: 'voters' }), people = [];
    for (var i = 0; i < total; i++) {
      var p = mk('g', { transform: 'translate(' + (x0 + i * gap) + ',' + y + ')', class: 'voter' });
      p.appendChild(mk('circle', { cx: 0, cy: -8.6, r: 2.8 }));
      p.appendChild(mk('path', { d: 'M-4.4,0 Q-4.4,-5.4 0,-5.4 Q4.4,-5.4 4.4,0 Z' }));
      g.appendChild(p); people.push(p);
    }
    svgEl.appendChild(g);
    var k = Math.max(1, Math.min(total, n));
    people.forEach(function (p, i) {
      if (i >= k) return;
      wait(220 + i * 170, function () { p.setAttribute('fill', color); p.classList.add('won'); });
    });
    wait(220 + k * 170 + 650, function () {
      g.classList.add('leave');
      wait(400, function () { g.remove(); if (done) done(); });
    });
  }

  /* ---------- 4. L'écriture à la main de la bulle (machine à écrire) ---------- */
  function type(el, text, done) {
    if (reduced) { el.textContent = text; if (done) done(); return { stop: noop }; }
    var i = 0, live = true;
    el.textContent = '';
    (function next() {
      if (!live) return;
      i = Math.min(text.length, i + 2);
      el.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(next, 22); else if (done) done();
    })();
    return { stop: function () { live = false; el.textContent = text; } };
  }

  /* Un nombre qui défile jusqu'à sa nouvelle valeur */
  function count(el, from, to, ms, fmt) {
    return tween(ms, function (t) { el.textContent = fmt(from + (to - from) * ease(t)); });
  }

  /* ---------- 5. Le bandeau « Alerte info » qui défile en haut de l'écran ---------- */
  var bannerTimer = null;
  function breaking(label, items) {
    var old = document.querySelector('.breaking'); if (old) old.remove();
    clearTimeout(bannerTimer);
    if (!items || !items.length) return;
    var text = items.join('   ✦   ');
    var b = document.createElement('div');
    b.className = 'breaking';
    b.setAttribute('role', 'status');
    b.innerHTML = '<span class="breaking-k"><i></i>' + label + '</span><span class="breaking-track"><span class="breaking-txt"></span></span>';
    b.querySelector('.breaking-txt').textContent = text;
    // la vitesse de défilement ne dépend pas de la longueur du texte
    var secs = Math.max(6, Math.min(16, 3 + text.length / 9));   // environ 9 lettres par seconde : le temps de lire
    b.style.setProperty('--crawl', secs + 's');
    // v3.6.2 : en partie, le bandeau se pose en bas de la carte (il ne cache plus l'argent, l'influence et la forme en haut)
    var mw = document.getElementById('map-wrap'), inGame = mw && mw.offsetParent;
    if (inGame) { b.classList.add('breaking-map'); mw.appendChild(b); } else app().appendChild(b);
    function out() { b.classList.add('out'); setTimeout(function () { b.remove(); }, 400); }
    b.addEventListener('click', out);
    bannerTimer = setTimeout(out, reduced ? 6000 : 1000 * (secs + 0.6));
  }

  function clearBreaking() { clearTimeout(bannerTimer); var b = document.querySelector('.breaking'); if (b) b.remove(); }

  /* Rejouer une animation CSS sur un élément (retirer la classe, puis la remettre) */
  function replay(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  root.PolitikFX = {
    reduced: reduced, blocked: blocked, whenFree: whenFree, setModal: setModal, hold: hold, release: release,
    tween: tween, wait: wait, ease: ease,
    inkLayer: inkLayer, inkSet: inkSet, ripple: ripple,
    pawn: pawn, placePawn: placePawn, route: route, hop: hop, floatText: floatText, voters: voters,
    type: type, count: count, breaking: breaking, clearBreaking: clearBreaking, replay: replay
  };
})(this);

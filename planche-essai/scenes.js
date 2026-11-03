/* Planche d'essai — les cases : bulles, cartouches, plateau du débat, studio de la matinale, image de la une.
   Tout est tracé ici, en SVG. Chaque case renvoie un <svg> complet ; la page les range en planche. */
(function (root) {
  var P = root.Perso, L = root.Lettrage, PAL = P.PAL, INK = P.INK, p = P.p, a = P.a, t = P.t, buste = P.buste, cercle = P.cercle;
  var NUIT = '#22345a', NUIT2 = '#182642', NUIT3 = '#2f4772', LUM = '#efe2bd';

  function alea(n) { var x = Math.sin(n * 91.17 + 2.3) * 43758.5453; return x - Math.floor(x); }
  function rect(x, y, w, h, f, tr) { return p('M' + x + ',' + y + ' h' + w + ' v' + h + ' h' + (-w) + ' Z', f, tr == null ? 2.2 : tr); }
  function af(x, y, w, h, f) { return a('M' + x + ',' + y + ' h' + w + ' v' + h + ' h' + (-w) + ' Z', f); }

  /* une case : cadre à l'encre, contenu découpé */
  var nCase = 0;
  function kase(w, h, titre, inner) {
    var id = 'k' + (++nCase);
    return '<svg class="case" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + titre.replace(/"/g, '&quot;') + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><clipPath id="' + id + '"><rect width="' + w + '" height="' + h + '"/></clipPath></defs>' +
      '<g clip-path="url(#' + id + ')" stroke-linecap="round" stroke-linejoin="round">' + inner + '</g>' +
      '<rect x="1.5" y="1.5" width="' + (w - 3) + '" height="' + (h - 3) + '" fill="none" stroke="' + INK + '" stroke-width="3"/></svg>';
  }

  /* ---------- Bulles et cartouches ---------- */
  function bulle(cx, cy, lignes, taille, o) {
    o = o || {};
    var b = L.bloc(lignes, cx, 0, taille, { gras: o.gras, graine: o.graine });
    var rx = b.l / 2 + taille * 1.5, ry = b.h / 2 + taille * 1.25, s = '';
    var ell = 'M' + (cx - rx) + ',' + cy + ' C' + (cx - rx) + ',' + (cy - ry * 1.02) + ' ' + (cx - rx * 0.55) + ',' + (cy - ry) + ' ' + cx + ',' + (cy - ry) +
      ' C' + (cx + rx * 0.6) + ',' + (cy - ry) + ' ' + (cx + rx) + ',' + (cy - ry * 0.96) + ' ' + (cx + rx) + ',' + cy +
      ' C' + (cx + rx) + ',' + (cy + ry * 1.02) + ' ' + (cx + rx * 0.55) + ',' + (cy + ry) + ' ' + cx + ',' + (cy + ry) +
      ' C' + (cx - rx * 0.6) + ',' + (cy + ry) + ' ' + (cx - rx) + ',' + (cy + ry * 0.96) + ' ' + (cx - rx) + ',' + cy + ' Z';
    if (o.queue) {
      var qx = o.queue[0], qy = o.queue[1], ang = Math.atan2(qy - cy, qx - cx);
      var bx = cx + Math.cos(ang) * rx * 0.72, by = cy + Math.sin(ang) * ry * 0.72;
      var nx = -Math.sin(ang), ny = Math.cos(ang), lq = o.large || taille * 1.1;
      s += p('M' + (bx + nx * lq) + ',' + (by + ny * lq) + ' Q' + ((bx + qx) / 2 + nx * lq * 0.3) + ',' + ((by + qy) / 2 + ny * lq * 0.3) + ' ' + qx + ',' + qy + ' Q' + ((bx + qx) / 2 - nx * lq * 0.5) + ',' + ((by + qy) / 2 - ny * lq * 0.5) + ' ' + (bx - nx * lq) + ',' + (by - ny * lq) + ' Z', PAL.blanc, 2.4);
    }
    s += p(ell, PAL.blanc, 2.4);
    if (o.queue) { var qx2 = o.queue[0], qy2 = o.queue[1], an2 = Math.atan2(qy2 - cy, qx2 - cx), lq2 = (o.large || taille * 1.1) * 0.9; var bx2 = cx + Math.cos(an2) * rx * 0.74, by2 = cy + Math.sin(an2) * ry * 0.74, nx2 = -Math.sin(an2), ny2 = Math.cos(an2);
      s += a('M' + (bx2 + nx2 * lq2) + ',' + (by2 + ny2 * lq2) + ' L' + (bx2 + Math.cos(an2) * taille * 0.9) + ',' + (by2 + Math.sin(an2) * taille * 0.9) + ' L' + (bx2 - nx2 * lq2) + ',' + (by2 - ny2 * lq2) + ' Z', PAL.blanc); }
    s += L.bloc(lignes, cx, cy - b.h / 2, taille, { gras: o.gras, graine: o.graine }).s;
    return s;
  }
  function pensee(cx, cy, lignes, taille, o) {
    o = o || {};
    var b = L.bloc(lignes, cx, 0, taille, { graine: o.graine });
    var rx = b.l / 2 + taille * 2, ry = b.h / 2 + taille * 1.7, n = o.n || 14, d = '', s = '';
    for (var i = 0; i <= n; i++) {
      var ang = i / n * Math.PI * 2, x = cx + Math.cos(ang) * rx, y = cy + Math.sin(ang) * ry;
      if (i === 0) { d = 'M' + x + ',' + y; continue; }
      var am = (i - 0.5) / n * Math.PI * 2, f = 1.2 + alea(i + (o.graine || 1)) * 0.1;
      d += ' Q' + (cx + Math.cos(am) * rx * f) + ',' + (cy + Math.sin(am) * ry * f) + ' ' + x + ',' + y;
    }
    s += p(d + ' Z', PAL.blanc, 2.4);
    if (o.vers) {
      var tx = o.vers[0], ty = o.vers[1], an = Math.atan2(ty - cy, tx - cx);
      var sx = cx + Math.cos(an) * rx * 1.14, sy = cy + Math.sin(an) * ry * 1.14;
      [0.22, 0.56, 0.86].forEach(function (u, k) { s += cercle(sx + (tx - sx) * u, sy + (ty - sy) * u, taille * (0.62 - k * 0.17), PAL.blanc, 2.2); });
    }
    s += L.bloc(lignes, cx, cy - b.h / 2, taille, { graine: o.graine }).s;
    return s;
  }
  function cartouche(x, y, lignes, taille, o) {
    o = o || {};
    var lmax = 0; lignes.forEach(function (li) { lmax = Math.max(lmax, L.largeur(li, taille)); });
    var w = lmax + taille * 1.6, h = lignes.length * taille * 1.34 + taille * 0.8;
    var s = p('M' + x + ',' + y + ' L' + (x + w) + ',' + (y + 1) + ' L' + (x + w - 1) + ',' + (y + h) + ' L' + (x + 1) + ',' + (y + h - 1) + ' Z', o.fond || '#f2d078', 2.2);
    s += L.bloc(lignes, x + taille * 0.8, y + taille * 0.55, taille, { ancre: 'g', graine: 21 }).s;
    return s;
  }

  /* une figure posée, éventuellement retournée pour regarder à gauche */
  function pose(nom, expr, x, y, s, o) {
    o = o || {}; o.s = s;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + (o.gauche ? -s : s) + ',' + s + ')">' + buste(nom, expr, o) + '</g>';
  }
  function lettres(texte, x, y, taille, o) { return L.ligne(texte, x, y, taille, o); }

  /* ---------- Le plateau ---------- */
  function ecran(x, y, w, h, tailleTitre) {
    var s = rect(x - 8, y - 8, w + 16, h + 16, NUIT2, 2.6);
    s += af(x, y, w / 3, h, '#27508c') + af(x + w / 3, y, w / 3, h, '#ece3cb') + af(x + 2 * w / 3, y, w / 3, h, PAL.rouge);
    s += t('M' + x + ',' + y + ' h' + w + ' v' + h + ' h' + (-w) + ' Z', 1.6);
    return s;
  }
  function chrono(x, y, w, h, temps, actif) {
    return rect(x, y, w, h, '#14110f', 2.2) + L.ligne(temps, x + w / 2, y + h * 0.2, h * 0.58, { ancre: 'm', gras: true, encre: actif ? '#ffcf5a' : '#c9704f', graine: 7 });
  }
  function projecteur(x, y, ang, s) {
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + ang + ') scale(' + s + ')">' + p('M-16,-22 h32 l8,40 h-48 Z', PAL.noir, 2.2) + p('M-24,18 h48 q-24,12 -48,0 Z', LUM, 2) + p('M0,-22 V-44', 'none', 3) + '</g>';
  }
  function fond_plateau() {
    var s = af(0, 0, 1200, 640, NUIT);
    // pans du mur, en éventail
    [[0, 60, 260, 96, 260, 430, 0, 470], [940, 96, 1200, 60, 1200, 470, 940, 430]].forEach(function (q, k) {
      s += p('M' + q[0] + ',' + q[1] + ' L' + q[2] + ',' + q[3] + ' L' + q[4] + ',' + q[5] + ' L' + q[6] + ',' + q[7] + ' Z', NUIT3, 2.2);
      for (var i = 1; i < 5; i++) { var u = i / 5, xa = q[0] + (q[2] - q[0]) * u; s += t('M' + xa + ',' + (q[1] + (q[3] - q[1]) * u) + ' L' + xa + ',' + (q[7] + (q[5] - q[7]) * u), 1.4); }
      for (var j = 1; j < 4; j++) { var v = j / 4; s += t('M' + q[0] + ',' + (q[1] + (q[7] - q[1]) * v) + ' L' + q[2] + ',' + (q[3] + (q[5] - q[3]) * v), 1.1); }
    });
    // lames de lumière
    [[40, 90], [110, 96], [180, 100], [1020, 100], [1090, 96], [1160, 90]].forEach(function (q) { s += p('M' + q[0] + ',' + q[1] + ' h14 v' + (360 - Math.abs(q[0] - 600) * 0.06 - 10) + ' h-14 Z', '#f0d58c', 1.5); });
    // la poutre et les projecteurs
    s += af(0, 0, 1200, 44, NUIT2) + t('M0,44 H1200', 2.4) + t('M0,20 H1200', 1.4);
    for (var i = 0; i < 16; i++) s += t('M' + (i * 80) + ',20 l40,24 l40,-24', 1.2);
    [[110, 16], [280, 8], [440, -6], [600, 0], [760, 6], [920, -8], [1090, -16]].forEach(function (q) { s += projecteur(q[0], 62, q[1], 0.82); });
    // le sol, verni, avec son grand cercle
    s += p('M-5,440 L1205,440 L1205,645 L-5,645 Z', '#2b3f6c', 2.4);
    s += p('M90,640 C200,470 1000,470 1110,640 Z', NUIT3, 2);
    s += p('M250,640 C330,520 870,520 950,640 Z', '#3a5586', 1.6);
    for (var k = 0; k < 13; k++) { var xb = 600 + (k - 6) * 180; s += t('M' + (600 + (k - 6) * 70) + ',440 L' + xb + ',640', 0.9); }
    s += t('M0,500 H1200 M0,570 H1200', 0.9);
    return s;
  }
  function pupitre(x, y, w, h, gauche, nom, temps, actif) {
    // bureau légèrement courbe : plateau et façade
    var s = p('M' + x + ',' + y + ' L' + (x + w) + ',' + (y - (gauche ? 0 : 10)) + ' L' + (x + w + (gauche ? 16 : -6)) + ',' + (y + 20) + ' L' + (x + (gauche ? -6 : -16)) + ',' + (y + 22 + (gauche ? 8 : 0)) + ' Z', LUM, 2.4);
    s += p('M' + (x + (gauche ? -6 : -16)) + ',' + (y + 22 + (gauche ? 8 : 0)) + ' L' + (x + w + (gauche ? 16 : -6)) + ',' + (y + 20) + ' L' + (x + w + (gauche ? 6 : -12)) + ',' + (y + h) + ' L' + (x + (gauche ? 2 : -8)) + ',' + (y + h + 6) + ' Z', '#8d2a20', 2.6);
    s += af(x + 10, y + h - 26, w - 14, 7, PAL.ocre);
    s += L.ligne(nom, x + w / 2, y + 44, 21, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 5 });
    s += chrono(x + w / 2 - 78, y + 74, 156, 58, temps, actif);
    return s;
  }
  function tableJournalistes() {
    var s = p('M416,396 C500,376 700,376 784,396 L806,424 C700,404 500,404 394,424 Z', LUM, 2.4);
    s += p('M394,424 C500,404 700,404 806,424 L796,500 C700,484 500,484 404,500 Z', '#27508c', 2.6);
    s += af(0, 0, 0, 0, 'none');
    s += L.ligne('HEXA TV', 600, 432, 26, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 9 });
    s += p('M516,402 h28 l6,6 h-34 Z', PAL.blanc, 1.4) + p('M664,402 h28 l6,6 h-34 Z', PAL.blanc, 1.4);
    return s;
  }
  function camera(x, y, s, gauche) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + (gauche ? -s : s) + ',' + s + ')">' +
      p('M-8,20 L-8,110 M-8,110 L-52,150 M-8,110 L34,150 M-8,110 L-8,152', 'none', 6) +
      p('M-60,-36 L44,-36 L58,-20 L58,22 L-60,22 Z', PAL.noir, 2.6) +
      p('M58,-16 L100,-26 L100,20 L58,14 Z', '#3e3833', 2.6) + p('M100,-30 Q114,-3 100,24 Q92,-3 100,-30 Z', '#7d94a0', 2.2) +
      p('M-40,-60 L10,-60 L10,-36 L-40,-36 Z', '#3e3833', 2.2) + af(-34, -54, 38, 12, '#ffcf5a') +
      cercle(-44, -20, 5, PAL.rouge, 1.4) + t('M-52,4 H40', 1.2).replace('stroke="' + INK + '"', 'stroke="#6b5e54"') + '</g>';
  }
  /* sur téléphone, le cartouche sort de la case large, où il serait illisible : il passe au-dessus, à sa taille */
  var CART_DEBAT = ['PLATEAU DU DÉBAT, 21 H 47.', 'IL RESTE UNE HEURE.', 'ILS NE SE PARLENT DÉJÀ PLUS.'], CART_RADIO = ['LA MATINALE, 7 H 52.', 'LA MINUTE OÙ LA CAMPAGNE', 'PEUT BASCULER.'];
  function cartoucheSeul(lignes) {
    return '<svg class="cart-tel" viewBox="0 0 420 98" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g stroke-linecap="round" stroke-linejoin="round">' + cartouche(2, 2, lignes, 19) + '</g></svg>';
  }
  function debatLarge() {
    var s = fond_plateau();
    // l'écran géant
    s += ecran(330, 58, 540, 222);
    s += p('M600,66 L690,104 L716,176 L660,246 L540,246 L484,176 L510,104 Z', NUIT, 2.2);
    s += L.ligne('LE DÉBAT', 600, 94, 54, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 4 });
    s += L.ligne('ENTRE-DEUX-TOURS', 600, 160, 22, { ancre: 'm', encre: '#ffcf5a', gras: true, graine: 8 });
    s += L.ligne('PRÉSIDENTIELLE 2027', 600, 194, 16, { ancre: 'm', encre: PAL.blanc, graine: 18 });
    // bandeau direct
    s += af(330, 254, 94, 26, PAL.rouge) + L.ligne('DIRECT', 377, 259, 16, { ancre: 'm', encre: PAL.blanc, gras: true });
    s += af(424, 254, 446, 26, NUIT2) + L.ligne('SONDAGE : 51 / 49', 600, 259, 15, { ancre: 'm', encre: PAL.blanc, graine: 12 });
    // journalistes et leur table
    s += pose('journaliste', 'parle', 372, 188, 0.48, { rot: 2, lacet: 14 });
    s += pose('matinalier', 'neutre', 828, 186, 0.48, { gauche: true, rot: 2, lacet: 40 });
    s += tableJournalistes();
    // les fiches, les verres
    s += p('M530,396 l26,-3 l4,12 l-28,3 Z', PAL.blanc, 1.4);
    // la caméra au centre
    s += camera(600, 522, 0.72);
    // les candidats
    s += pose('megaphone', 'colere', -30, 96, 0.9, { geste: 'index', rot: 3, lacet: 40 });
    s += pupitre(-12, 420, 384, 200, true, 'J.-L. MÉGAPHONE', '31:12', true);
    s += pose('brushing', 'assure', 1230, 104, 0.92, { gauche: true, rot: -2, lacet: 34 });
    s += pupitre(838, 420, 384, 200, false, 'J. BRUSHING', '29:47', false);
    // bulle et cartouche
    s += '<g class="cart-large">' + cartouche(14, 56, CART_DEBAT, 19) + '</g>';
    return kase(1200, 640, 'Plateau du débat d’entre-deux-tours : Jean-Lutte Mégaphone et Jordan Brushing face à face derrière leurs pupitres, chronomètres allumés, deux journalistes au centre, écran géant, caméra.', s);
  }
  function panneaux(x, y, w, h) {
    var s = af(x, y, w, h, NUIT3);
    for (var i = 0; i <= 8; i++) s += t('M' + (x + i * w / 8) + ',' + y + ' v' + h, 1.3);
    s += t('M' + x + ',' + (y + h * 0.5) + ' h' + w, 1.1) + t('M' + x + ',' + y + ' h' + w, 2.2);
    [1, 4, 7].forEach(function (i) { s += p('M' + (x + i * w / 8 + 14) + ',' + (y + 12) + ' h16 v' + (h - 24) + ' h-16 Z', '#f0d58c', 1.4); });
    return s;
  }
  function debatMegaphone() {
    var s = af(0, 0, 640, 620, NUIT);
    s += panneaux(0, 300, 640, 280) + ecran(-40, 30, 400, 250);
    s += p('M0,0 h640 v28 h-640 Z', NUIT2, 2);
    [[430, 20], [560, -10]].forEach(function (q) { s += projecteur(q[0], 50, q[1], 0.8); });
    s += af(380, 90, 260, 200, NUIT3); for (var i = 0; i < 6; i++) s += t('M' + (380 + i * 44) + ',90 V300', 1.2);
    s += pose('megaphone', 'colere', -60, 166, 1.3, { geste: 'index', rot: 4, lacet: 34, tangage: 3 });
    s += p('M-5,590 L645,566 L645,625 L-5,625 Z', '#8d2a20', 2.6);
    s += chrono(388, 536, 156, 58, '31:12', true);
    s += bulle(316, 92, ['VOUS PROMETTEZ TOUT,', 'MONSIEUR BRUSHING,', '*SAUF DE DIRE QUI PAIE !'], 27, { queue: [392, 318], graine: 31 });
    return kase(640, 620, 'Jean-Lutte Mégaphone, furieux, le doigt pointé : « Vous promettez tout, Monsieur Brushing, sauf de dire qui paie ! »', s);
  }
  function debatBrushing() {
    var s = af(0, 0, 640, 620, NUIT);
    s += panneaux(0, 300, 640, 280) + ecran(280, 30, 400, 250);
    s += p('M0,0 h640 v28 h-640 Z', NUIT2, 2);
    s += af(0, 90, 280, 200, NUIT3); for (var i = 0; i < 6; i++) s += t('M' + (i * 44) + ',90 V300', 1.2);
    s += pose('brushing', 'assure', 690, 176, 1.3, { gauche: true, geste: 'paume', rot: -3, lacet: 16 });
    s += p('M-5,566 L645,590 L645,625 L-5,625 Z', '#8d2a20', 2.6);
    s += chrono(70, 530, 156, 58, '29:47', false);
    s += pensee(278, 112, ['SOURIRE.', 'NE RIEN RÉPONDRE.', '*ET NE PAS TOUCHER LA MÈCHE.'], 21, { vers: [392, 226], graine: 5, n: 16 });
    return kase(640, 620, 'Jordan Brushing, souriant, ne répond pas. Il pense : « Sourire. Ne rien répondre. Et ne pas toucher la mèche. »', s);
  }

  /* ---------- La radio ---------- */
  var OCRE_MUR = '#d9b878', OCRE_MUR2 = '#cfad6c', VERT_TABLE = '#3f5f55';
  function mousse(x, y, w, h, c1, c2) {
    var s = af(x, y, w, h, c1), n = 0;
    for (var yy = y; yy < y + h; yy += 28) for (var xx = x; xx < x + w; xx += 28) {
      n++;
      s += a('M' + xx + ',' + yy + ' L' + (xx + 28) + ',' + yy + ' L' + (n % 2 ? xx : xx + 28) + ',' + (yy + 28) + ' Z', c2);
    }
    return s;
  }
  function micro(x, y, ang, s, base) {
    // tête de micro, bonnette rouge, sur un bras articulé
    var out = '';
    if (base) out += p('M' + base[0] + ',' + base[1] + ' L' + base[2] + ',' + base[3] + ' L' + x + ',' + y, 'none', 5) + p('M' + base[0] + ',' + base[1] + ' L' + base[2] + ',' + base[3] + ' L' + x + ',' + y, 'none', 2).replace('stroke="' + INK + '"', 'stroke="#8d8d84"') + cercle(base[2], base[3], 6, PAL.grisO, 2);
    out += '<g transform="translate(' + x + ',' + y + ') rotate(' + ang + ') scale(' + s + ')">' +
      p('M-12,0 h24 v44 h-24 Z', '#3e3833', 2.4) + p('M-20,-48 C-20,-68 20,-68 20,-48 L20,-8 C20,6 -20,6 -20,-8 Z', PAL.rouge, 2.6) +
      a('M-20,-48 C-20,-56 -16,-60 -10,-62 L-10,0 C-16,-2 -20,-4 -20,-8 Z', PAL.rougeO) + t('M-20,-40 H20 M-20,-28 H20 M-20,-16 H20', 1.1) + '</g>';
    return out;
  }
  function studioFond() {
    var s = mousse(0, 0, 1200, 640, OCRE_MUR, OCRE_MUR2);
    // la vitre de la régie
    s += rect(70, 70, 500, 270, '#2c3e4b', 3.4);
    s += af(78, 78, 484, 254, '#3e5a68');
    // régie : technicienne, console, écrans
    s += rect(120, 108, 110, 66, '#1a2a33', 2) + a('M126,160 l18,-18 l14,10 l20,-28 l14,12 l22,-16 v48 h-88 Z', '#5fae8a');
    s += rect(420, 108, 110, 66, '#1a2a33', 2) + L.ligne('07:52:18', 475, 128, 20, { ancre: 'm', encre: '#ffcf5a', gras: true });
    s += pose('journaliste', 'neutre', 236, 122, 0.4, { rot: 0 });
    s += p('M78,290 L562,290 L562,332 L78,332 Z', '#1f2b33', 2.4);
    for (var i = 0; i < 22; i++) { var xf = 92 + i * 21; s += t('M' + xf + ',298 V324', 1).replace('stroke="' + INK + '"', 'stroke="#9fb2bc"') + af(xf - 3, 300 + (i * 7) % 18, 7, 5, i % 5 === 0 ? PAL.rouge : PAL.grisC); }
    // reflet sur la vitre
    s += a('M340,78 L420,78 L300,332 L220,332 Z', '#ffffff24') + a('M450,78 L480,78 L360,332 L330,332 Z', '#ffffff1c');
    // voyant « À l'antenne »
    s += rect(640, 34, 250, 62, '#3b1712', 3) + af(650, 44, 230, 42, PAL.rouge);
    s += L.ligne('À L’ANTENNE', 765, 52, 26, { ancre: 'm', encre: '#fff3cf', gras: true, graine: 6 });
    [[640, 30], [890, 30], [628, 66], [902, 66], [640, 102], [890, 102]].forEach(function (q, i) { s += t('M' + q[0] + ',' + q[1] + ' l' + (i % 2 ? 12 : -12) + ',' + (i < 2 ? -12 : i > 3 ? 12 : 0), 2.4); });
    // pendule
    s += cercle(1086, 90, 62, PAL.blanc, 3) + cercle(1086, 90, 3, INK, 1);
    for (var h = 0; h < 12; h++) { var an = h / 12 * Math.PI * 2; s += t('M' + (1086 + Math.sin(an) * 50) + ',' + (90 - Math.cos(an) * 50) + ' L' + (1086 + Math.sin(an) * 57) + ',' + (90 - Math.cos(an) * 57), 2.4); }
    s += t('M1086,90 L1058,70', 4) + t('M1086,90 L1058,132', 2.8) + p('M1086,90 L1118,104', 'none', 1.5).replace('stroke="' + INK + '"', 'stroke="' + PAL.rouge + '"');
    // affiche de la station, fenêtre sur les toits
    s += rect(930, 170, 240, 170, '#e6a77e', 3);
    s += af(938, 178, 224, 154, '#f0b98d');
    s += a('M938,290 L960,270 L990,270 L1004,250 L1030,252 L1046,232 L1076,236 L1090,256 L1120,258 L1162,246 L1162,332 L938,332 Z', '#8f6670');
    s += p('M1056,238 L1062,178 L1068,238 M1058,210 h8 M1050,238 L1074,238', 'none', 2);
    s += a('M938,312 L990,296 L1040,306 L1100,288 L1162,300 L1162,332 L938,332 Z', '#6b4d59');
    s += t('M1050,170 V340 M930,256 H1170', 3);
    // enseigne de la station, à côté du voyant
    s += rect(640, 130, 250, 96, PAL.blanc, 2.6);
    s += L.ligne('RADIO', 765, 142, 22, { ancre: 'm', gras: true }) + L.ligne('MON COMPTOIR', 765, 172, 24, { ancre: 'm', encre: PAL.rouge, gras: true, graine: 11 });
    s += t('M676,212 H854', 1.6);
    return s;
  }
  function tableRadio() {
    var s = p('M-10,470 L1210,470 L1210,650 L-10,650 Z', VERT_TABLE, 3);
    s += af(-5, 470, 1210, 10, '#2c4539');
    s += t('M0,480 H1200', 1.4);
    return s;
  }
  function feuilles(x, y, rot, s) {
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(' + s + ')">' + p('M6,6 L136,0 L142,80 L10,88 Z', '#e4d8b6', 1.8) + p('M0,0 L130,-6 L136,74 L4,82 Z', PAL.blanc, 2) +
      t('M14,14 L116,10 M14,26 L120,22 M14,38 L108,34 M14,50 L118,46 M14,62 L84,60', 1.1) + '</g>';
  }
  function tasse(x, y, s, c) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' + p('M-26,-30 L26,-30 L22,18 Q0,26 -22,18 Z', c || PAL.blanc, 2.4) + '<ellipse cx="0" cy="-30" rx="26" ry="7" fill="#4a2c1a" stroke="' + INK + '" stroke-width="2.2"/>' + p('M26,-20 C44,-22 44,6 23,6', 'none', 3) + '</g>';
  }
  function radioLarge() {
    var s = studioFond();
    s += pose('matinalier', 'parle', 66, 150, 0.98, { rot: 4, casque: true, lacet: 36 });
    s += pose('tournesol', 'inquiet', 1200, 150, 1.02, { gauche: true, rot: -5, casque: true, lacet: 20, tangage: -2 });
    s += tableRadio();
    s += micro(392, 372, -74, 1.05, [474, 476, 462, 410]);
    s += micro(892, 366, 74, 1.05, [826, 476, 836, 410]);
    s += feuilles(230, 510, -5, 1.3) + feuilles(760, 520, 6, 1.1);
    s += tasse(150, 540, 1.1, PAL.blanc) + tasse(1090, 560, 1.1, PAL.bleu);
    // le téléphone qui vibre, la minute de la matinale
    s += '<g transform="translate(600,552) rotate(82) scale(.74)">' + P.telephone() + '</g>' + t('M540,508 q-8,6 -2,14 M660,508 q8,6 2,14', 1.8);
    s += '<g class="cart-large">' + cartouche(16, 16, CART_RADIO, 18) + '</g>';
    return kase(1200, 640, 'Studio de Radio Mon Comptoir, 7 h 52 : Marine Tournesol, casque sur les oreilles, en difficulté face au journaliste. Voyant À l’antenne allumé, micros, régie derrière la vitre, Paris à l’aube.', s);
  }
  function radioJournaliste() {
    var s = mousse(0, 0, 640, 620, OCRE_MUR, OCRE_MUR2);
    s += rect(-10, 30, 250, 180, '#3e5a68', 3) + rect(14, 52, 92, 56, '#1a2a33', 1.8) + a('M20,98 l16,-16 l12,8 l18,-24 l12,10 l22,-14 v36 Z', '#5fae8a') + a('M150,30 L190,30 L120,210 L80,210 Z', '#ffffff24');
    for (var i = 0; i < 11; i++) s += t('M' + (14 + i * 20) + ',150 V196', 1).replace('stroke="' + INK + '"', 'stroke="#9fb2bc"') + af(10 + i * 20, 158 + (i * 7) % 26, 8, 6, i % 4 ? PAL.grisC : PAL.rouge);
    s += pose('matinalier', 'parle', -18, 150, 1.34, { rot: 5, casque: true, lacet: 30, tangage: 2 });
    s += micro(446, 430, -72, 1.3, [560, 640, 548, 510]);
    s += bulle(372, 92, ['VOUS AVEZ DIT', '« LE TRAIN GRATUIT POUR TOUS ».', '*QUI PAIE, MADAME TOURNESOL ?'], 22, { queue: [350, 262], graine: 12 });
    return kase(640, 620, 'Le journaliste de la matinale : « Vous avez dit le train gratuit pour tout le monde. Qui paie, Madame Tournesol ? »', s);
  }
  function radioInvitee() {
    var s = mousse(0, 0, 640, 620, OCRE_MUR, OCRE_MUR2);
    s += rect(420, 20, 210, 54, '#3b1712', 3) + af(428, 28, 194, 38, PAL.rouge) + L.ligne('À L’ANTENNE', 525, 36, 21, { ancre: 'm', encre: '#fff3cf', gras: true });
    s += pose('tournesol', 'inquiet', 700, 148, 1.38, { gauche: true, rot: -6, casque: true, lacet: 14, tangage: -2 });
    s += micro(208, 410, 72, 1.3, [120, 640, 116, 500]);
    s += pensee(204, 118, ['QUI A ÉCRIT', 'CETTE FICHE ?', '*ET OÙ EST LA PAGE 2 ?'], 24, { vers: [330, 196], graine: 9 });
    s += bulle(170, 548, ['C’EST… ENFIN… JE VOUS', 'RENVERRAI LE CHIFFRE.'], 21, { queue: [316, 430], graine: 17 });
    return kase(640, 620, 'Marine Tournesol, en sueur : « C’est… enfin… je vous renverrai le chiffre. » Elle pense : qui a écrit cette fiche, et où est la page 2 ?', s);
  }

  /* ---------- L'image de la une : la gare, un matin de grève ---------- */
  function usager(x, y, s, n, dos) {
    var peaux = ['#efc39b', '#d9a67a', '#a56d47', '#7d4d31', '#efc39b', '#e6b48c'], chev = [PAL.noir, PAL.brun, PAL.grisC, '#b5552a', PAL.ocreO, PAL.brunO, PAL.noir];
    var manteaux = [PAL.marine, '#6b6a5e', PAL.rougeO, '#7d8f55', PAL.bleuO, PAL.brunO, '#3b3a46', PAL.ocreO, '#a9a594'];
    var pe = peaux[n % 6], ch = chev[(n * 3) % 7], ma = manteaux[(n * 5) % 9], gau = n % 2 === 0, type = (n * 7) % 5;
    var k0 = P.getK(); P.setK(1 / Math.pow(s, 0.7));
    var o = '<g transform="translate(' + x + ',' + y + ') scale(' + (gau ? -s : s) + ',' + s + ')">';
    // manteau : vraies épaules, manches, col
    o += p('M-44,190 L-46,30 C-46,10 -30,0 -12,-4 L12,-4 C30,0 46,10 46,30 L44,190 Z', ma, 2.4);
    o += t('M-30,34 C-32,80 -32,130 -30,190 M30,34 C32,80 32,130 30,190', 1.5);
    if (!dos) o += t('M0,14 V190', 1.3) + p('M-14,-6 L0,16 L14,-6 Z', n % 2 ? PAL.creme : PAL.blanc, 1.8);
    else o += t('M-16,-2 Q0,8 16,-2', 2);
    if (n % 4 === 0) o += p('M-22,-8 C-10,4 10,4 22,-8 L24,6 C10,16 -10,16 -24,6 Z', n % 8 === 0 ? PAL.rouge : PAL.ocre, 2);
    o += p('M-9,-6 L-8,-22 L10,-22 L11,-6 Z', dos ? (type === 2 ? ch : pe) : pe, 2);
    // tête
    o += p('M-21,-40 C-21,-60 21,-60 21,-40 C23,-20 12,-10 0,-10 C-12,-10 -23,-20 -21,-40 Z', pe, 2.3);
    if (dos) {
      if (type === 3) o += p('M-23,-34 C-28,-68 28,-68 23,-34 C14,-26 -14,-26 -23,-34 Z', PAL.rouge, 2.2) + t('M-20,-42 Q0,-34 20,-42', 1.3);
      else if (type === 2) o += p('M-24,-40 C-26,-68 26,-68 24,-40 C28,-14 28,4 22,14 C8,20 -8,20 -22,14 C-28,4 -28,-14 -24,-40 Z', ch, 2.2) + t('M-8,-44 C-10,-20 -10,0 -8,14 M8,-44 C10,-20 10,0 8,14', 1.1);
      else if (type === 4) o += p('M-22,-34 C-24,-58 24,-58 22,-34 C20,-30 16,-36 8,-40 C-4,-44 -18,-40 -22,-34 Z', PAL.grisC, 2);
      else o += p('M-23,-30 C-28,-66 28,-66 23,-30 C22,-22 16,-18 10,-16 C2,-14 -6,-14 -12,-16 C-18,-18 -22,-22 -23,-30 Z', ch, 2.2) + t('M-10,-50 Q-4,-34 -8,-20 M8,-50 Q12,-34 8,-20', 1.1);
    } else {
      if (type === 3) o += p('M-23,-38 C-28,-70 28,-70 23,-38 C10,-46 -10,-46 -23,-38 Z', PAL.rouge, 2.2) + p('M-24,-40 Q0,-48 24,-40 L24,-34 Q0,-42 -24,-34 Z', PAL.rougeO, 1.6);
      else if (type === 2) o += p('M-24,-34 C-30,-70 30,-70 25,-34 C26,-18 24,-2 28,12 C16,8 18,-20 14,-38 C4,-48 -8,-48 -14,-38 C-18,-20 -16,8 -28,12 C-24,-2 -26,-18 -24,-34 Z', ch, 2.2);
      else if (type === 4) o += p('M-22,-36 C-24,-60 24,-60 22,-36 C18,-46 12,-50 0,-50 C-10,-50 -18,-46 -22,-36 Z', PAL.grisC, 2);
      else if (type === 1) o += p('M-23,-32 C-30,-64 28,-68 24,-38 C14,-50 -4,-48 -12,-42 C-16,-38 -18,-30 -18,-26 C-22,-26 -23,-30 -23,-32 Z', ch, 2.2);
      else o += p('M-22,-36 C-26,-66 26,-66 22,-36 C16,-46 8,-48 0,-46 C-8,-48 -16,-46 -22,-36 Z', ch, 2.2);
      if (n % 3 !== 2) o += t('M-9,-34 l0,3 M10,-34 l0,3', 2.6) + t('M-5,-21 Q1,-19 6,-22', 1.6);
      else o += t('M-11,-33 q3,-2 6,0 M6,-33 q3,-2 6,0', 1.8) + t('M-5,-19 Q1,-22 6,-19', 1.6);
      o += t('M2,-32 q4,5 0,7', 1.2);
    }
    if (!dos && n % 3 === 1 || dos && n % 4 === 1) {
      // bras levé, téléphone en l'air : on filme
      o += p('M34,30 C50,16 56,-20 56,-58 L72,-56 C74,-10 66,34 42,58 Z', ma, 2.3);
      o += p('M50,-74 L74,-72 L72,-114 L48,-116 Z', PAL.noir, 2) + p('M50,-62 C48,-72 54,-82 64,-80 C72,-78 72,-66 70,-58 Z', pe, 2);
    } else if (!dos && n % 3 === 0) {
      // le nez sur son téléphone
      o += p('M36,34 C42,50 38,70 22,76 L12,64 C22,58 26,50 24,38 Z', ma, 2.3);
      o += p('M4,52 L22,50 L24,76 L6,78 Z', PAL.noir, 1.8) + cercle(8, 72, 5.4, pe, 1.6);
    }
    o += '</g>';
    P.setK(k0);
    return o;
  }
  function tableauDeparts(x, y, w, lignes) {
    var h = 34 * (lignes.length + 1) + 18;
    var s = p('M' + (x + 30) + ',-5 V' + y + ' M' + (x + w - 30) + ',-5 V' + y, 'none', 4);
    s += rect(x, y, w, h, '#191613', 3.2);
    s += L.ligne('DÉPARTS', x + 18, y + 10, 18, { encre: '#ffcf5a', gras: true });
    s += L.ligne('8 H 04', x + w - 18, y + 10, 18, { encre: '#ffcf5a', gras: true, ancre: 'd' });
    lignes.forEach(function (li, i) {
      var yy = y + 40 + i * 34;
      s += t('M' + (x + 10) + ',' + (yy - 6) + ' h' + (w - 20), 1).replace('stroke="' + INK + '"', 'stroke="#514a44"');
      s += L.ligne(li[0], x + 16, yy, 16, { encre: '#f3e7c8', graine: i + 2 });
      s += L.ligne(li[1], x + 78, yy, 16, { encre: '#f3e7c8', graine: i + 5 });
      s += L.ligne('SUPPRIMÉ', x + w - 16, yy, 16, { encre: '#ff8a5e', ancre: 'd', gras: true, graine: i + 7 });
    });
    return s;
  }
  function fer(d, w) { return p(d, 'none', w + 2.6) + p(d, 'none', w).replace('stroke="' + INK + '"', 'stroke="#5d6e6a"'); }
  function imageGare() {
    var W = 1200, H = 680, VX = 600, VY = 330, s = af(0, 0, W, H, '#dfe5d2'), i;
    // la verrière en perspective : pans de verre en éventail
    for (i = 0; i < 18; i++) {
      var a1 = Math.PI + i / 18 * Math.PI, a2 = Math.PI + (i + 1) / 18 * Math.PI;
      if (i % 2) s += a('M' + VX + ',' + VY + ' L' + (VX + Math.cos(a1) * 1000) + ',' + (VY + Math.sin(a1) * 1000) + ' L' + (VX + Math.cos(a2) * 1000) + ',' + (VY + Math.sin(a2) * 1000) + ' Z', '#cbd5c4');
    }
    for (i = 0; i <= 18; i++) { var an0 = Math.PI + i / 18 * Math.PI; s += t('M' + VX + ',' + VY + ' L' + (VX + Math.cos(an0) * 1000) + ',' + (VY + Math.sin(an0) * 1000), 1.3); }
    // les grandes fermes de fer, du premier plan vers le fond
    [1.9, 1.42, 1.08, 0.82].forEach(function (u) {
      var d = 'M' + (VX - 620 * u) + ',' + (VY + 90) + ' C' + (VX - 620 * u) + ',' + (VY - 330 * u) + ' ' + (VX + 620 * u) + ',' + (VY - 330 * u) + ' ' + (VX + 620 * u) + ',' + (VY + 90);
      s += fer(d, 7 * u);
      var d2 = 'M' + (VX - 590 * u) + ',' + (VY + 90) + ' C' + (VX - 590 * u) + ',' + (VY - 296 * u) + ' ' + (VX + 590 * u) + ',' + (VY - 296 * u) + ' ' + (VX + 590 * u) + ',' + (VY + 90);
      s += t(d2, 1.2);
    });
    // le pignon du fond, sa verrière et l'horloge
    var dp = 'M' + (VX - 372) + ',' + (VY + 90) + ' C' + (VX - 372) + ',' + (VY - 262) + ' ' + (VX + 372) + ',' + (VY - 262) + ' ' + (VX + 372) + ',' + (VY + 90) + ' Z';
    s += p(dp, '#efe2bd', 3);
    [0.14, 0.24, 0.34, 0.66, 0.76, 0.86].forEach(function (u) { var m = 1 - u, bx = -372 * (m * m * m + 3 * m * m * u) + 372 * (3 * m * u * u + u * u * u), by = (VY + 90) * (m * m * m + u * u * u) + (VY - 262) * (3 * m * m * u + 3 * m * u * u); s += t('M' + (VX + bx) + ',' + (VY + 90) + ' V' + by, 1.5); });
    s += t('M' + (VX - 340) + ',' + (VY + 10) + ' H' + (VX + 340), 1.5);
    s += cercle(600, 208, 44, PAL.blanc, 3.2) + cercle(600, 208, 37, 'none', 1.4) + t('M600,208 L600,180', 3) + t('M600,208 L620,212', 3.8) + cercle(600, 208, 3, INK, 1);
    for (var h = 0; h < 12; h++) { var an = h / 12 * Math.PI * 2; s += t('M' + (600 + Math.sin(an) * 30) + ',' + (208 - Math.cos(an) * 30) + ' L' + (600 + Math.sin(an) * 35) + ',' + (208 - Math.cos(an) * 35), 1.8); }
    // quais, rames à l'arrêt
    s += af(0, 420, W, 90, '#b39b6f') + t('M0,420 H1200', 3);
    [[10, 430, '#a74a35'], [760, 430, '#4f7f92']].forEach(function (q) {
      s += p('M' + q[0] + ',396 h' + q[1] + ' v92 h-' + q[1] + ' Z', q[2], 2.8);
      for (var f = 0; f < 6; f++) s += rect(q[0] + 18 + f * 70, 410, 50, 42, '#29343a', 1.8);
      s += af(q[0] + 2, 464, q[1] - 4, 8, PAL.creme);
    });
    // colonnes de fonte
    [20, 432, 768, 1180].forEach(function (x) { s += p('M' + (x - 11) + ',510 L' + (x - 8) + ',300 L' + (x + 8) + ',300 L' + (x + 11) + ',510 Z', '#44524f', 2.6) + p('M' + (x - 24) + ',300 C' + (x - 14) + ',284 ' + (x + 14) + ',284 ' + (x + 24) + ',300 Z', '#44524f', 2.2); });
    // le tableau des départs, l'info du jour
    s += tableauDeparts(44, 178, 346, [['8:12', 'MELUN'], ['8:15', 'CRÉTEIL'], ['8:21', 'CERGY'], ['8:30', 'NANTERRE']]);
    s += tableauDeparts(810, 178, 346, [['8:34', 'POISSY'], ['8:40', 'VERSAILLES'], ['8:44', 'MEAUX'], ['8:50', 'ÉVRY']]);
    // le sol
    s += af(0, 490, W, 200, '#8f7a5a') + t('M0,490 H1200', 2.6);
    for (var k = 0; k < 15; k++) s += t('M' + (600 + (k - 7) * 70) + ',490 L' + (600 + (k - 7) * 230) + ',690', 0.8);
    s += t('M0,540 H1200 M0,610 H1200', 0.8);
    // la foule, rangée du fond au premier plan
    var rangs = [[448, 0.5, 20, 60], [486, 0.68, 15, 84], [536, 0.9, 10, 124]], n = 1;
    rangs.forEach(function (r, ir) {
      for (var q = 0; q < r[2]; q++) {
        var x = 16 + q * r[3] + (alea(n) - 0.5) * 20 + (ir % 2 ? 24 : 0);
        s += usager(x, r[0] + (alea(n + 40) - 0.5) * 10, r[1], n, ir < 2 && n % 5 === 0);
        n++;
      }
      // Mégaphone dans la foule, juché sur un banc, porte-voix en main : la rangée de devant le coupe à la taille
      if (ir === 1) s += pose('megaphone', 'colere', 462, 196, 0.66, { geste: 'megaphone', rot: 2, lacet: 18 });
    });
    // premier plan : on lui tourne le dos, on le filme
    [[60, 4], [262, 3], [452, 6], [742, 12], [950, 1], [1146, 9]].forEach(function (q) { s += usager(q[0], 610, 1.7, q[1], true); });
    return kase(W, H, 'Une gare parisienne un matin de grève : verrière de fer, tableaux des départs qui affichent « supprimé » partout, usagers qui filment avec leur téléphone, et Jean-Lutte Mégaphone au milieu de la foule, porte-voix à la main.', s);
  }

  /* ---------- Les fiches de personnages : un buste, devant le décor qui le situe ---------- */
  var DECORS = {
    // le meeting : pancartes, foule, banderole
    rue: function () {
      var s = af(0, 0, 420, 480, '#e8b56a');
      s += a('M0,0 L420,0 L420,70 L0,120 Z', '#efc98a');
      [[20, 90, -6], [86, 60, 5], [316, 56, -4], [372, 96, 7]].forEach(function (q, i) {
        s += '<g transform="translate(' + q[0] + ',' + q[1] + ') rotate(' + q[2] + ')">' + p('M0,40 V300', 'none', 4) + rect(-32, -20, 64, 62, i % 2 ? PAL.blanc : PAL.rouge, 2.2) + L.ligne(i % 2 ? 'NON' : 'SMIC', 0, 2, 17, { ancre: 'm', gras: true, encre: i % 2 ? INK : PAL.blanc, graine: i + 2 }) + '</g>';
      });
      for (var i = 0; i < 9; i++) s += p('M' + (i * 54 - 20) + ',480 V300 C' + (i * 54 - 20) + ',270 ' + (i * 54 + 22) + ',270 ' + (i * 54 + 22) + ',300 V480 Z', '#c99450', 1.8);
      return s;
    },
    // le plateau : drapeaux, lumière froide
    bleu: function () {
      var s = af(0, 0, 420, 480, '#8fb3c2');
      s += a('M0,0 L150,0 L60,480 L0,480 Z', '#a4c4cf') + a('M260,0 L330,0 L420,300 L420,460 Z', '#a4c4cf');
      [[36, 40], [98, 20]].forEach(function (q) {
        s += p('M' + q[0] + ',' + q[1] + ' V480', 'none', 3.4);
        s += p('M' + q[0] + ',' + q[1] + ' C' + (q[0] + 24) + ',' + (q[1] + 10) + ' ' + (q[0] + 40) + ',' + (q[1] - 6) + ' ' + (q[0] + 64) + ',' + (q[1] + 4) + ' L' + (q[0] + 62) + ',' + (q[1] + 104) + ' C' + (q[0] + 40) + ',' + (q[1] + 94) + ' ' + (q[0] + 24) + ',' + (q[1] + 112) + ' ' + q[0] + ',' + (q[1] + 102) + ' Z', PAL.blanc, 2);
        s += a('M' + q[0] + ',' + q[1] + ' C' + (q[0] + 8) + ',' + (q[1] + 4) + ' ' + (q[0] + 14) + ',' + (q[1] + 6) + ' ' + (q[0] + 21) + ',' + (q[1] + 5) + ' L' + (q[0] + 21) + ',' + (q[1] + 106) + ' C' + (q[0] + 14) + ',' + (q[1] + 106) + ' ' + (q[0] + 8) + ',' + (q[1] + 104) + ' ' + q[0] + ',' + (q[1] + 102) + ' Z', PAL.marine);
        s += a('M' + (q[0] + 43) + ',' + (q[1] + 2) + ' C' + (q[0] + 50) + ',' + (q[1] + 1) + ' ' + (q[0] + 57) + ',' + (q[1] + 2) + ' ' + (q[0] + 64) + ',' + (q[1] + 4) + ' L' + (q[0] + 62) + ',' + (q[1] + 104) + ' C' + (q[0] + 55) + ',' + (q[1] + 102) + ' ' + (q[0] + 49) + ',' + (q[1] + 100) + ' ' + (q[0] + 43) + ',' + (q[1] + 100) + ' Z', PAL.rouge);
      });
      return s;
    },
    // le Palais-Bourbon : colonnade et fronton
    assemblee: function () {
      var s = af(0, 0, 420, 480, '#f0d9a6');
      s += p('M-10,70 L210,6 L430,70 Z', '#e6d3a8', 2.4) + p('M60,62 L210,20 L360,62 Z', '#d6bd88', 1.4);
      s += rect(-10, 70, 440, 26, '#e6d3a8', 2.2) + t('M-10,84 H430', 1.1);
      for (var i = 0; i < 8; i++) {
        var x = 8 + i * 58;
        s += p('M' + x + ',96 h30 v384 h-30 Z', '#efe2bd', 2.2) + a('M' + (x + 20) + ',96 h10 v384 h-10 Z', '#d6bd88') + t('M' + (x + 8) + ',100 V480 M' + (x + 15) + ',100 V480', 0.9) + p('M' + (x - 6) + ',96 h42 v-8 h-42 Z', '#e6d3a8', 1.8);
      }
      s += a('M0,96 h420 v22 h-420 Z', '#b89f6b55');
      return s;
    },
    // le champ, l'éolienne, le soleil
    champ: function () {
      var s = af(0, 0, 420, 480, '#bfd8d2');
      s += cercle(88, 86, 46, '#f2d078', 2.2);
      s += p('M0,300 C80,260 180,290 240,270 C310,250 380,280 420,262 L420,480 L0,480 Z', '#a9c07a', 2.2);
      s += p('M348,270 L354,110 L360,270 Z', PAL.blanc, 1.8);
      [[-90, 0], [30, 0], [150, 0]].forEach(function (q) { s += '<g transform="translate(354,110) rotate(' + q[0] + ')">' + p('M-4,0 Q0,-60 8,-74 Q8,-30 4,0 Z', PAL.blanc, 1.6) + '</g>'; });
      s += cercle(354, 110, 5, PAL.grisC, 1.4);
      for (var i = 0; i < 9; i++) { var x = i * 54 - 6, y = 300 + (i % 2) * 22; s += t('M' + x + ',' + y + ' V480', 2.2) + cercle(x, y, 13, PAL.ocre, 1.6) + cercle(x, y, 6, PAL.brunO, 1); }
      return s;
    },
    // la ville d'usines, le ciel de brique
    usine: function () {
      var s = af(0, 0, 420, 480, '#dd8a5a');
      s += a('M0,0 H420 V110 C340,80 260,120 180,96 C110,76 50,110 0,92 Z', '#e7a578');
      [[30, 70], [86, 110], [330, 60], [380, 104]].forEach(function (q) { s += p('M' + q[0] + ',' + q[1] + ' l-10,270 h36 l-10,-270 Z', '#a24f30', 2.2) + t('M' + (q[0] - 2) + ',' + (q[1] + 22) + ' h16', 1.2); });
      s += p('M-5,340 L60,300 L60,340 L120,300 L120,340 L180,300 L180,340 L240,300 L240,340 L300,300 L300,340 L360,300 L360,340 L425,300 L425,480 L-5,480 Z', '#a24f30', 2.2);
      return s;
    }
  };
  function fiche(nom, expr, decor, titre, o) {
    return kase(420, 480, titre, (DECORS[decor] || DECORS.rue)() + buste(nom, expr, o || {}));
  }

  root.Scenes = { debatLarge: debatLarge, debatMegaphone: debatMegaphone, debatBrushing: debatBrushing, radioLarge: radioLarge, radioJournaliste: radioJournaliste, radioInvitee: radioInvitee, imageGare: imageGare, fiche: fiche, cartDebat: function () { return cartoucheSeul(CART_DEBAT); }, cartRadio: function () { return cartoucheSeul(CART_RADIO); }, kase: kase, bulle: bulle, pensee: pensee, cartouche: cartouche };
})(this);

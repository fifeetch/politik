/* Politik — les cases dessinées branchées dans le jeu : débat, radio, images de la une.
   Le texte du jeu passe dans des bulles qui se calculent : la case grandit avec le texte, rien ne déborde.
   Largeur de travail : 640 pour les cases, 1200 pour le plateau et les images de une. */
(function (root) {
  var P = root.Perso, L = root.Lettrage, S = root.Scenes, V = root.Visages;
  if (!P || !L || !S || !V) return;
  var PAL = P.PAL, INK = P.INK, p = P.p, a = P.a, t = P.t, cercle = P.cercle, R = S.outils, W = 640;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function svg(w, h, titre, inner, cls) {
    return '<svg class="bd-case' + (cls ? ' ' + cls : '') + '" viewBox="0 0 ' + w + ' ' + Math.round(h) + '" role="img" aria-label="' + esc(titre) + '" xmlns="http://www.w3.org/2000/svg"><g stroke-linecap="round" stroke-linejoin="round">' + inner + '</g>' +
      '<rect x="1.5" y="1.5" width="' + (w - 3) + '" height="' + (Math.round(h) - 3) + '" fill="none" stroke="' + INK + '" stroke-width="3"/></svg>';
  }

  /* ---------- Le texte ---------- */
  /* le lettrage n'a que des capitales et des signes courants : on ramène le reste à ce qu'il sait tracer */
  function propre(s) { return String(s).replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/[…]/g, '...').replace(/\s+/g, ' ').trim(); }
  function colle(s) { return s.replace(/« /g, '« ').replace(/ ([»?!:;])/g, ' $1'); }
  function coupe(txt, taille, maxW) {
    var lignes = [], cur = '';
    colle(propre(txt)).split(' ').forEach(function (m0) {
      var m = m0.replace(/ /g, ' ');
      var essai = cur ? cur + ' ' + m : m;
      if (L.largeur(essai, taille) <= maxW || !cur) cur = essai;
      else { lignes.push(cur); cur = m; }
    });
    if (cur) lignes.push(cur);
    return lignes;
  }
  /* la taille qui fait tenir chaque mot, sans jamais descendre sous le lisible */
  function ajuste(txt, taille, maxW, mini) {
    var mots = colle(propre(txt)).split(' '), plus = 0;
    mots.forEach(function (m) { plus = Math.max(plus, L.largeur(m.replace(/ /g, ' '), taille)); });
    return plus > maxW ? Math.max(mini || 12, taille * maxW / plus) : taille;
  }
  function plaque(txt, cx, y, maxW, taille, encre) {
    var tt = taille, l = L.largeur(propre(txt), tt);
    if (l > maxW) tt = tt * maxW / l;
    return L.ligne(propre(txt), cx, y + (taille - tt) / 2, tt, { ancre: 'm', encre: encre || PAL.blanc, gras: true, graine: 5 });
  }
  /* une bulle rectangulaire aux angles ronds : le texte y tient toujours. Renvoie le tracé et le bas de la bulle */
  function bulle(txt, x, y, largeur, taille, queue) {
    var pad = taille * 1.05, tt = ajuste(txt, taille, largeur - 2 * pad), lignes = coupe(txt, tt, largeur - 2 * pad), inter = 1.32;
    var lmax = 0; lignes.forEach(function (li) { lmax = Math.max(lmax, L.largeur(li, tt)); });
    var w = Math.min(largeur, lmax + 2 * pad), h = lignes.length * tt * inter + pad * 1.3 - tt * .1, x0 = x + (largeur - w) / 2, r = Math.min(h / 2, tt * 1.5), s = '';
    var d = 'M' + (x0 + r) + ',' + y + ' Q' + (x0 + w / 2) + ',' + (y - 3) + ' ' + (x0 + w - r) + ',' + y + ' Q' + (x0 + w) + ',' + y + ' ' + (x0 + w) + ',' + (y + r) + ' Q' + (x0 + w + 3) + ',' + (y + h / 2) + ' ' + (x0 + w) + ',' + (y + h - r) +
      ' Q' + (x0 + w) + ',' + (y + h) + ' ' + (x0 + w - r) + ',' + (y + h) + ' Q' + (x0 + w / 2) + ',' + (y + h + 3) + ' ' + (x0 + r) + ',' + (y + h) + ' Q' + x0 + ',' + (y + h) + ' ' + x0 + ',' + (y + h - r) + ' Q' + (x0 - 3) + ',' + (y + h / 2) + ' ' + x0 + ',' + (y + r) + ' Q' + x0 + ',' + y + ' ' + (x0 + r) + ',' + y + ' Z';
    var q = '';
    if (queue) {
      var bx = Math.max(x0 + r + 16, Math.min(x0 + w - r - 16, queue[0])), by = y + h - 2;
      q = p('M' + (bx - 15) + ',' + by + ' Q' + ((bx + queue[0]) / 2 - 4) + ',' + ((by + queue[1]) / 2) + ' ' + queue[0] + ',' + queue[1] + ' Q' + ((bx + queue[0]) / 2 + 7) + ',' + ((by + queue[1]) / 2) + ' ' + (bx + 15) + ',' + by + ' Z', PAL.blanc, 2.4);
    }
    s += q + p(d, PAL.blanc, 2.4);
    if (queue) s += a('M' + (Math.max(x0 + r + 16, Math.min(x0 + w - r - 16, queue[0])) - 13.5) + ',' + (y + h - 3.5) + ' h27 v6 h-27 Z', PAL.blanc);
    s += L.bloc(lignes, x0 + w / 2, y + pad * .72, tt, { inter: inter, graine: 11 }).s;
    return { s: s, bas: y + h };
  }

  /* ---------- Les fonds ---------- */
  function fondPlateau(h) {
    var s = R.af(0, 0, W, h, R.NUIT), haut = Math.max(0, h - 330);
    s += R.panneaux(0, haut, W, 330) + R.af(0, 0, W, Math.max(haut, 0), R.NUIT2);
    for (var i = 0; i < 8; i++) s += t('M' + (i * 90 + 20) + ',0 V' + haut, 1.1);
    return s;
  }
  function fondStudio(h) {
    return R.mousse(0, 0, W, h, R.OCRE_MUR, R.OCRE_MUR2);
  }
  function fond(kind, h) { return kind === 'studio' ? fondStudio(h) : fondPlateau(h); }

  /* ---------- Un buste placé par le centre de sa tête ---------- */
  function repere(id) { var F = P.FICHE[id]; return { cx: F.at[0] + 100 * F.k, haut: F.at[1] + 10 * F.k, droite: F.at[0] + 160 * F.k, bouche: F.at[1] + 186 * F.k }; }
  function buste(id, expr, cx, hautY, s, gauche, o) {
    var r = repere(id), oo = Object.assign({ s: s, gauche: gauche }, o || {});
    return S.pose(id, expr, gauche ? cx + r.cx * s : cx - r.cx * s, hautY - r.haut * s, s, oo);
  }

  /* ---------- Les cases ---------- */
  /* Le gros plan : un candidat, ce qu'il dit, son nom. o : { cote: 'g'|'d', fond, nom, texte, expr, casque } */
  function grosPlan(id, o) {
    var cote = o.cote || 'g', s = 1.12, r = repere(id), cx = cote === 'g' ? 240 : 400, sens = cote === 'g' ? 1 : -1, y0 = 12;
    var tb = o.taille || 25, b = o.texte ? bulle(o.texte, 16, y0, W - 32, tb, null) : { s: '', bas: 0 };
    var hautT = b.bas + 22, dem = (r.droite - r.cx) * s;
    var q = o.texte ? bulle(o.texte, 16, y0, W - 32, tb, [cx + sens * (dem + 12), hautT + 70]) : b;
    var h = hautT + 372, plate = o.nom ? 46 : 0;
    var inner = fond(o.fond, h + plate) + buste(id, o.expr || 'neutre', cx, hautT, s, cote === 'd', { casque: o.casque });
    if (o.nom) inner += p('M-4,' + (h - 2) + ' H' + (W + 4) + ' V' + (h + plate + 4) + ' H-4 Z', o.fond === 'studio' ? '#3f5f55' : '#8d2a20', 2.6) + plaque(o.nom, W / 2, h + 12, W - 40, 24);
    inner += q.s;
    return svg(W, h + plate, (o.nom ? o.nom + ' : ' : '') + (o.texte || ''), inner);
  }
  /* Le face-à-face : la question en bulle, les deux candidats de part et d'autre, leurs noms */
  function faceAFace(idA, idB, nomA, nomB, question, o) {
    o = o || {};
    var b = question ? bulle(question, 16, 12, W - 32, 25, [W / 2, 0]) : { bas: 0, s: '' };
    var q = question ? bulle(question, 16, 12, W - 32, 25, [W / 2, b.bas + 34]) : b;
    var hautT = b.bas + 26, s = .74, h = hautT + 244, plate = 42;
    var inner = fond(o.fond, h + plate) + buste(idA, o.exprA || 'neutre', 172, hautT, s, false) + buste(idB, o.exprB || 'neutre', W - 172, hautT, s, true);
    inner += p('M-4,' + (h - 2) + ' H' + (W + 4) + ' V' + (h + plate + 4) + ' H-4 Z', '#8d2a20', 2.6) + t('M' + W / 2 + ',' + h + ' V' + (h + plate), 2.4);
    inner += plaque(nomA, W / 4, h + 11, W / 2 - 24, 20) + plaque(nomB, 3 * W / 4, h + 11, W / 2 - 24, 20) + q.s;
    return svg(W, h + plate, nomA + ' face à ' + nomB + (question ? '. Question : ' + question : ''), inner);
  }
  /* Le grand plateau : les pupitres, l'écran, les journalistes. Sur téléphone, le jeu lui préfère faceAFace */
  function plateau(idA, idB, nomA, nomB, titre) {
    var s = S.fondPlateauLarge();
    s += R.ecran(330, 58, 540, 222);
    s += p('M600,66 L690,104 L716,176 L660,246 L540,246 L484,176 L510,104 Z', R.NUIT, 2.2);
    s += L.ligne('LE DÉBAT', 600, 94, 54, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 4 });
    s += plaque(titre || 'EN DIRECT', 600, 160, 320, 22, '#ffcf5a');
    s += R.af(330, 254, 94, 26, PAL.rouge) + L.ligne('DIRECT', 377, 259, 16, { ancre: 'm', encre: PAL.blanc, gras: true });
    s += S.pose('journaliste', 'parle', 372, 188, 0.48, { rot: 2 }) + S.pose('matinalier', 'neutre', 828, 186, 0.48, { gauche: true, rot: 2 });
    s += S.tableJournalistes();
    s += buste(idA, 'colere', 180, 100, .86, false) + buste(idB, 'assure', 1020, 100, .86, true);
    s += S.pupitre(-12, 420, 384, 200, true, '', '', false) + S.pupitre(838, 420, 384, 200, false, '', '', false);
    s += plaque(nomA, 180, 458, 340, 24) + plaque(nomB, 1020, 458, 340, 24);
    return svg(1200, 640, 'Le plateau du débat : ' + nomA + ' face à ' + nomB, s);
  }
  /* Le studio : la matinale, la question du journaliste, l'invité qui écoute */
  function studio(id, nomStation, question) {
    var sg = 76, b = bulle(question, 16, sg + 18, W - 32, 25, [0, 0]), hautT = b.bas + 26, s0 = .74, h = hautT + 236;
    var q = bulle(question, 16, sg + 18, W - 32, 25, [190, hautT + 40]);
    var inner = fondStudio(h + 54);
    inner += R.rect(14, 12, 360, sg - 14, PAL.blanc, 2.6) + plaque(nomStation, 194, 26, 330, 28, PAL.rouge);
    inner += R.rect(390, 12, 236, sg - 14, '#3b1712', 3) + R.af(398, 20, 220, sg - 30, PAL.rouge) + L.ligne('À L’ANTENNE', 508, 30, 24, { ancre: 'm', encre: '#fff3cf', gras: true, graine: 6 });
    inner += buste('matinalier', 'parle', 150, hautT, s0, false, { casque: true }) + buste(id, 'neutre', W - 160, hautT, s0, true, { casque: true });
    inner += p('M-4,' + (h - 2) + ' H' + (W + 4) + ' V' + (h + 60) + ' H-4 Z', R.VERT_TABLE, 3);
    inner += S.micro(322, h - 62, -70, .7, [388, h + 10, 376, h - 34]) + S.micro(W - 322 + 10, h - 62, 70, .7, [W - 390, h + 10, W - 376, h - 34]);
    inner += q.s;
    return svg(W, h + 54, nomStation + ', la matinale. Question : ' + question, inner);
  }
  /* Le plateau d'interview : le 13 h (la journaliste) ou le 20 h (le présentateur), la question, l'invité */
  function tele(id, nomChaine, question, vingt) {
    var sg = 76, b = bulle(question, 16, sg + 18, W - 32, 25, [0, 0]), hautT = b.bas + 26, s0 = .74, h = hautT + 236;
    var q = bulle(question, 16, sg + 18, W - 32, 25, [190, hautT + 40]);
    var inner = fondPlateau(h + 54);
    inner += R.rect(14, 12, 360, sg - 14, PAL.blanc, 2.6) + plaque(nomChaine, 194, 26, 330, 28, PAL.rouge);
    inner += R.rect(390, 12, 236, sg - 14, '#3b1712', 3) + R.af(398, 20, 220, sg - 30, PAL.rouge) + L.ligne('EN DIRECT', 508, 30, 24, { ancre: 'm', encre: '#fff3cf', gras: true, graine: 6 });
    inner += buste(vingt ? 'matinalier' : 'journaliste', 'parle', 150, hautT, s0, false) + buste(id, 'neutre', W - 160, hautT, s0, true);
    inner += p('M-4,' + (h - 2) + ' H' + (W + 4) + ' V' + (h + 60) + ' H-4 Z', '#8d2a20', 3);
    inner += q.s;
    return svg(W, h + 54, nomChaine + '. Question : ' + question, inner);
  }
  /* La vignette du menu Médias : le lieu, le journaliste et l'invité, sans bulle */
  function mediaCase(kind, id) {
    var radio = kind === 'matinale', hautT = 66, s0 = .66, h = hautT + 214;
    var titre = radio ? 'LA MATINALE' : kind === 'vingt' ? 'LE 20 H' : 'LE 13 H';
    var inner = fond(radio ? 'studio' : '', h + 30);
    inner += R.rect(14, 10, 300, 46, PAL.blanc, 2.6) + plaque(titre, 164, 18, 280, 26, PAL.rouge);
    inner += R.rect(410, 10, 216, 46, '#3b1712', 3) + R.af(417, 17, 202, 32, PAL.rouge) + L.ligne(radio ? 'À L’ANTENNE' : 'EN DIRECT', 518, 22, 21, { ancre: 'm', encre: '#fff3cf', gras: true, graine: 6 });
    inner += buste(radio || kind === 'vingt' ? 'matinalier' : 'journaliste', 'parle', 150, hautT, s0, false, { casque: radio }) + buste(id, 'assure', W - 160, hautT, s0, true, { casque: radio });
    inner += p('M-4,' + (h - 2) + ' H' + (W + 4) + ' V' + (h + 36) + ' H-4 Z', radio ? R.VERT_TABLE : '#8d2a20', 3);
    return svg(W, h + 30, titre, inner);
  }

  /* ---------- Les images de la une ---------- */
  var UNE = {
    greve: function () { return S.imageGare({ sansCandidat: true }); },
    /* l'usine fermée : la grille, les cheminées froides, les salariés devant */
    usine: function () {
      var s = R.af(0, 0, 1200, 680, '#d9c6a5') + a('M0,0 H1200 V200 C1000,170 800,220 600,190 C400,160 200,210 0,180 Z', '#c9b48f'), n = 1, i;
      [[120, 70], [230, 110], [920, 60], [1040, 100]].forEach(function (q) { s += p('M' + q[0] + ',' + q[1] + ' l-16,300 h60 l-16,-300 Z', '#8f4a30', 2.6) + t('M' + (q[0] - 2) + ',' + (q[1] + 30) + ' h28 M' + (q[0] - 4) + ',' + (q[1] + 60) + ' h32', 1.6); });
      s += p('M-5,420 V300 L100,240 V300 L205,240 V300 L310,240 V300 L415,240 V300 L520,240 V300 L625,240 V300 L730,240 V300 L835,240 V300 L940,240 V300 L1045,240 V300 L1205,240 V420 Z', '#a85c3c', 2.8);
      for (i = 0; i < 11; i++) s += R.rect(40 + i * 105, 318, 58, 62, '#3c4a50', 2);
      s += R.af(0, 420, 1200, 260, '#8f7a5a') + t('M0,420 H1200', 2.8);
      for (i = 0; i < 17; i++) s += p('M' + (i * 75) + ',424 V600', 'none', 5);
      s += p('M-4,430 H1204 M-4,590 H1204', 'none', 6);
      s += '<g transform="rotate(-3 600 450)">' + R.rect(470, 416, 260, 76, PAL.blanc, 3) + L.ligne('FERMÉ', 600, 430, 46, { ancre: 'm', encre: PAL.rouge, gras: true, graine: 3 }) + '</g>';
      [[470, .6, 12, 92], [540, .86, 9, 136]].forEach(function (r, ir) { for (var q = 0; q < r[2]; q++) { s += S.usager(30 + q * r[3] + (ir ? 50 : 0), r[0], r[1], n, ir === 1 && n % 2 === 0); n++; } });
      return S.kase(1200, 680, 'Une usine fermée, ses salariés devant la grille.', s);
    },
    /* le meeting : la scène, la banderole, les projecteurs, la foule de dos */
    meeting: function () {
      var s = R.af(0, 0, 1200, 680, R.NUIT2), n = 2, i;
      for (i = 0; i < 7; i++) s += a('M' + (120 + i * 160) + ',0 l-70,430 h150 Z', '#ffe9a81c');
      s += R.af(0, 0, 1200, 44, '#10192e') + t('M0,44 H1200', 2.4);
      [120, 280, 440, 600, 760, 920, 1080].forEach(function (x, k) { s += R.projecteur(x, 58, (k - 3) * 6, .82); });
      s += R.rect(230, 120, 740, 90, PAL.rouge, 3) + L.ligne('GRAND MEETING', 600, 142, 46, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 7 });
      s += p('M520,300 L680,300 L700,440 L500,440 Z', '#7a2a22', 2.8) + p('M512,288 H688 V304 H512 Z', LUM(), 2.4) + p('M600,288 V250 L628,236', 'none', 4) + cercle(630, 234, 8, PAL.noir, 2);
      s += p('M-5,430 H1205 V690 H-5 Z', '#27395c', 2.8) + t('M0,448 H1200', 2);
      [[470, .62, 15, 84], [540, .9, 10, 124], [612, 1.3, 7, 180]].forEach(function (r, ir) { for (var q = 0; q < r[2]; q++) { s += S.usager(24 + q * r[3] + (ir % 2 ? 40 : 0), r[0], r[1], n, true); n++; } });
      return S.kase(1200, 680, 'Un grand meeting vu de la salle : la scène vide, la banderole, la foule.', s);
    },
    /* la télé : le plateau et les deux journalistes */
    tele: function () {
      var s = S.fondPlateauLarge() + R.af(0, 640, 1200, 40, '#2b3f6c');
      s += R.ecran(330, 58, 540, 222) + L.ligne('EN DIRECT', 600, 130, 62, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 4 });
      s += S.pose('journaliste', 'parle', 300, 150, 0.78, { rot: 2 }) + S.pose('matinalier', 'neutre', 900, 150, 0.78, { gauche: true, rot: 2 });
      s += p('M330,400 H870 V610 H330 Z', '#27508c', 2.6);   // le pied du bureau cache les jambes
      s += '<g transform="translate(600,330) scale(1.55) translate(-600,-396)">' + S.tableJournalistes() + '</g>';
      s += S.camera(120, 560, 1) + S.camera(1090, 560, 1, true);
      return S.kase(1200, 680, 'Le plateau de télévision, deux journalistes à l’antenne.', s);
    },
    /* la ville : un boulevard, les toits, les voitures */
    ville: function () {
      var s = R.af(0, 0, 1200, 680, '#e8d3a8') + a('M0,0 H1200 V240 H0 Z', '#f0dfb9') + cercle(960, 110, 60, '#f2d078', 2.4), i;
      [[0, 180, 170], [170, 150, 210], [360, 130, 190], [790, 140, 200], [980, 170, 230]].forEach(function (q, k) {
        s += p('M' + q[0] + ',440 V' + (q[1] + 44) + ' L' + (q[0] + 16) + ',' + q[1] + ' H' + (q[0] + q[2] - 16) + ' L' + (q[0] + q[2]) + ',' + (q[1] + 44) + ' V440 Z', k % 2 ? '#d9b878' : '#cfad6c', 2.6);
        s += a('M' + q[0] + ',' + (q[1] + 44) + ' L' + (q[0] + 16) + ',' + q[1] + ' H' + (q[0] + q[2] - 16) + ' L' + (q[0] + q[2]) + ',' + (q[1] + 44) + ' Z', '#6f7e8c');
        for (var c = 0; c < Math.floor(q[2] / 44); c++) for (var r = 0; r < 4; r++) s += R.rect(q[0] + 14 + c * 44, q[1] + 66 + r * 62, 26, 44, r === 0 ? '#3c4a50' : '#4f6470', 1.6);
      });
      s += p('M555,440 L590,120 L600,60 L610,120 L645,440 Z', '#8d8d84', 2.6) + t('M574,300 H626 M582,200 H618', 2.2);
      s += R.af(0, 440, 1200, 240, '#6c6a62') + t('M0,440 H1200', 3) + R.af(0, 440, 1200, 22, '#b3a78e') + t('M0,462 H1200', 2);
      for (i = 0; i < 9; i++) s += R.af(40 + i * 140, 566, 80, 8, PAL.creme);
      [[60, 490, PAL.rouge], [300, 500, PAL.bleu], [540, 488, PAL.ocre], [790, 502, PAL.vert], [1020, 490, PAL.rouge]].forEach(function (q) {
        s += p('M' + q[0] + ',' + (q[1] + 50) + ' v-22 l34,-4 l26,-30 h76 l28,30 l24,6 v20 Z', q[2], 2.6) + R.rect(q[0] + 62, q[1] + 2, 34, 22, '#3c4a50', 1.6) + R.rect(q[0] + 102, q[1] + 2, 34, 22, '#3c4a50', 1.6) + cercle(q[0] + 44, q[1] + 52, 14, PAL.noir, 2.2) + cercle(q[0] + 150, q[1] + 52, 14, PAL.noir, 2.2);
      });
      return S.kase(1200, 680, 'Un boulevard de grande ville, voitures à l’arrêt.', s);
    },
    /* --- Les affiches d'origine, redessinées : ciels clairs, grands volumes, un seul sujet lisible au téléphone --- */
    /* le caddie : le rayon, le caddie presque vide, l'étiquette qui grimpe */
    caddie: function () {
      var s = R.af(0, 0, 1200, 680, '#f3e4bf'), i, j, coul = [PAL.rouge, PAL.ocre, PAL.bleu, PAL.vert, PAL.creme, '#d9825a'];
      s += R.rect(-5, 0, 1210, 70, PAL.rouge, 2.8) + L.ligne('TOUT AUGMENTE', 600, 14, 44, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 5 });
      for (j = 0; j < 3; j++) {
        s += R.rect(-5, 186 + j * 116, 1210, 14, '#cdb98f', 2.2);
        for (i = 0; i < 16; i++) { var h = 54 + ((i * 7 + j * 5) % 5) * 9; s += R.rect(14 + i * 74, 186 + j * 116 - h, 58, h, coul[(i * 3 + j * 5) % 6], 1.8) + t('M' + (22 + i * 74) + ',' + (186 + j * 116 - h + 16) + ' h40', 1.2); }
      }
      s += R.af(0, 430, 1200, 250, '#e6d6ad') + t('M0,430 H1200', 2.8);
      for (i = 0; i < 9; i++) s += t('M' + (i * 150) + ',430 L' + ((i - 4) * 260 + 600) + ',680', 1);
      s += S.usager(110, 350, 1, 7, false) + S.usager(1090, 362, .94, 4, false);
      // le caddie : trois fois rien au fond
      s += R.rect(490, 408, 70, 80, PAL.ocre, 2.4) + p('M580,492 L586,380 C586,372 606,372 606,380 L612,492 Z', PAL.vert, 2.4) + p('M630,360 L696,486 L720,474 L654,350 Z', '#e0ac62', 2.4);
      s += p('M340,370 L880,370 L810,560 L400,560 Z', '#ffffff55', 3.4);
      for (i = 1; i < 10; i++) s += t('M' + (340 + i * 54) + ',370 L' + (400 + i * 41) + ',560', 2);
      for (i = 1; i < 4; i++) s += t('M' + (340 + i * 15) + ',' + (370 + i * 47.5) + ' H' + (880 - i * 17.5), 2);
      s += p('M880,370 L930,306 H1000', 'none', 9) + p('M400,560 L424,620 H800 L810,560', 'none', 6);
      s += cercle(450, 644, 24, PAL.noir, 2.4) + cercle(450, 644, 8, PAL.grisC, 1.6) + cercle(780, 644, 24, PAL.noir, 2.4) + cercle(780, 644, 8, PAL.grisC, 1.6);
      s += '<g transform="rotate(-7 180 560)">' + p('M50,500 H300 L340,560 L300,620 H50 Z', '#ffcf5a', 3) + p('M72,552 H112 M92,532 V572', 'none', 9).replace('stroke="' + INK + '"', 'stroke="' + PAL.rougeO + '"') + L.ligne('15 %', 200, 528, 62, { ancre: 'm', encre: PAL.rougeO, gras: true, graine: 3 }) + '</g>';
      return S.kase(1200, 680, 'Au supermarché, un caddie presque vide et une étiquette qui grimpe.', s);
    },
    /* la relance : le chantier, la grue, la courbe qui remonte */
    relance: function () {
      var s = R.af(0, 0, 1200, 680, '#cfe3e4') + nuage(160, 90, 1.1) + nuage(980, 70, .9), i, j;
      s += p('M250,470 V190 H700 V470 Z', '#e6d3a8', 2.8);
      for (i = 0; i < 5; i++) for (j = 0; j < 3; j++) s += R.rect(282 + i * 84, 216 + j * 82, 50, 56, j === 0 && i > 2 ? '#cfe3e4' : '#6f9fb2', 2);
      for (i = 0; i <= 5; i++) s += t('M' + (240 + i * 94) + ',170 V470', 3);
      for (j = 0; j < 4; j++) s += t('M232,' + (200 + j * 82) + ' H716', 2.6);
      // la grue
      s += p('M880,470 L888,110 H912 L920,470 Z', PAL.ocre, 2.6);
      for (i = 0; i < 9; i++) s += t('M888,' + (120 + i * 38) + ' L914,' + (156 + i * 38), 1.5);
      s += p('M600,92 H1120 V116 H600 Z', PAL.ocre, 2.6) + p('M900,92 L900,44', 'none', 5) + t('M900,46 L640,92 M900,46 L1100,92', 2) + R.rect(1060, 116, 60, 50, PAL.grisO, 2.2);
      s += t('M660,116 V236', 2.2) + R.rect(610, 236, 100, 26, PAL.rouge, 2.2);
      s += R.af(0, 470, 1200, 210, '#c6a673') + t('M0,470 H1200', 2.8);
      // la courbe
      s += '<g transform="translate(40,120)">' + R.rect(0, 0, 190, 150, PAL.blanc, 2.8) + p('M20,126 L66,96 L104,108 L168,28', 'none', 8).replace('stroke="' + INK + '"', 'stroke="' + PAL.vertO + '"') + p('M146,28 L172,22 L170,50 Z', PAL.vertO, 2) + '</g>' + t('M135,270 V480', 5);
      for (i = 0; i < 6; i++) s += S.usager(150 + i * 190, 500, 1, i * 3 + 2, false) + casque(150 + i * 190, 500, 1, i % 2 ? '#ffcf5a' : '#f6f0e0');
      return S.kase(1200, 680, 'Un chantier qui repart : la grue, l’immeuble en travaux, les ouvriers.', s);
    },
    /* l'hôpital : le fronton, la croix rouge, l'ambulance, la file d'attente */
    hopital: function () {
      var s = R.af(0, 0, 1200, 680, '#d6e7e8') + nuage(1040, 70, .9), i, j;
      s += p('M90,450 V70 H1110 V450 Z', '#f6efdd', 2.8) + a('M90,120 H1110 V70 H90 Z', '#e4d9bd') + t('M90,120 H1110', 2);
      for (i = 0; i < 12; i++) for (j = 0; j < 3; j++) if (!(i > 3 && i < 8 && j > 0)) s += R.rect(124 + i * 80, 144 + j * 94, 50, 64, '#a9c8d0', 2);
      s += p('M400,300 H800 V340 H400 Z', PAL.rouge, 2.8) + L.ligne('URGENCES', 600, 304, 32, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 3 });
      s += R.rect(440, 340, 320, 110, '#6f9fb2', 2.6) + t('M600,340 V450', 2.4);
      s += '<g transform="translate(600,50)">' + cercle(0, 40, 54, PAL.blanc, 3) + a('M-14,0 H14 V26 H40 V54 H14 V80 H-14 V54 H-40 V26 H-14 Z', PAL.rouge) + t('M-14,0 H14 V26 H40 V54 H14 V80 H-14 V54 H-40 V26 H-14 Z', 2.2) + '</g>';
      s += R.af(0, 450, 1200, 230, '#bcb6a5') + t('M0,450 H1200', 2.8);
      // l'ambulance
      s += p('M780,420 H1090 Q1130,420 1150,470 L1176,500 V570 H780 Z', PAL.blanc, 3) + a('M782,500 H1174 V526 H782 Z', PAL.rouge) + t('M782,500 H1174 M782,526 H1174', 1.8);
      s += R.rect(1040, 436, 74, 52, '#6f9fb2', 2.2) + R.rect(830, 396, 60, 24, PAL.bleu, 2.2) + cercle(880, 572, 34, PAL.noir, 2.6) + cercle(880, 572, 12, PAL.grisC, 1.8) + cercle(1096, 572, 34, PAL.noir, 2.6) + cercle(1096, 572, 12, PAL.grisC, 1.8);
      for (i = 0; i < 6; i++) s += S.usager(60 + i * 120, 470 + (i % 2) * 8, .94, i * 2 + 1, false);
      for (i = 0; i < 4; i++) s += S.usager(40 + i * 210, 580, 1.3, i * 5 + 3, true);
      return S.kase(1200, 680, 'Les urgences d’un hôpital, l’ambulance et la file d’attente.', s);
    },
    /* la campagne : les collines, la ferme, le tracteur, la vache */
    nature: function () {
      var s = R.af(0, 0, 1200, 680, '#d3e6e2') + cercle(1020, 96, 54, '#f7d97c', 2.4) + nuage(200, 90, 1.1) + nuage(640, 60, .8), i;
      s += p('M-5,300 C200,210 400,220 620,290 C820,240 1020,220 1205,280 V680 H-5 Z', '#b6c98a', 2.6);
      s += p('M-5,400 C260,330 520,340 760,410 C940,370 1080,370 1205,400 V680 H-5 Z', '#9db871', 2.6);
      for (i = 0; i < 8; i++) s += t('M' + (760 + i * 62) + ',' + (408 - i * 3) + ' L' + (660 + i * 90) + ',680', 1.2);
      // la ferme
      s += p('M170,350 V240 H420 V350 Z', '#f2e3c2', 2.6) + p('M150,244 L220,180 H372 L440,244 Z', '#b9543a', 2.6) + R.rect(226, 280, 44, 70, PAL.brun, 2.2) + R.rect(310, 268, 50, 42, '#6f9fb2', 2);
      s += arbre(540, 330, 1.2) + arbre(90, 340, .9);
      for (i = 0; i < 12; i++) s += t('M' + (i * 62) + ',500 v-44', 3);
      s += t('M0,468 H700 M0,488 H700', 2.4);
      // la vache
      s += '<g transform="translate(90,456) scale(1.15)">' + p('M20,60 C10,20 30,10 70,10 H170 C200,10 214,24 214,50 L212,70 C200,86 180,88 170,84 L168,140 H148 L146,92 H70 L68,140 H46 L44,86 C30,84 22,76 20,60 Z', PAL.blanc, 2.8) +
        a('M70,12 C96,10 112,24 104,48 C92,66 66,58 60,36 C58,24 62,16 70,12 Z', PAL.brun) + a('M140,40 C160,34 176,46 170,66 C156,80 134,74 134,58 C134,50 136,44 140,40 Z', PAL.brun) +
        p('M196,10 C226,-6 262,6 266,34 C272,58 252,72 232,68 C212,62 196,38 196,10 Z', PAL.blanc, 2.8) + p('M238,56 C252,48 270,50 268,62 C264,74 240,76 234,66 Z', '#efb7a0', 2.2) + cercle(236, 30, 4.5, INK, 1) + t('M208,8 L200,-10 M240,2 L246,-14', 3) + p('M100,92 Q112,112 124,92 Z', '#efb7a0', 2) + '</g>';
      // le tracteur
      s += '<g transform="translate(620,296) scale(1.2)">' + p('M120,90 H320 L346,170 V216 H80 V150 L120,150 Z', PAL.rouge, 3) + R.rect(120, 8, 110, 96, '#c9e0e2', 3) + p('M108,10 H244 V-4 H108 Z', PAL.rougeO, 2.6) + p('M300,90 V30 L316,30 V90', PAL.grisO, 2.2) + t('M250,120 H330 M250,140 H336 M250,160 H340', 2) +
        cercle(124, 222, 84, PAL.noir, 3) + cercle(124, 222, 42, PAL.ocre, 2.6) + cercle(124, 222, 14, PAL.noir, 2) + cercle(310, 240, 50, PAL.noir, 3) + cercle(310, 240, 24, PAL.ocre, 2.4) + '</g>';
      return S.kase(1200, 680, 'La campagne : une ferme, une vache, un tracteur rouge.', s);
    },
    /* la chaleur : le soleil, la croix de la pharmacie, la rue écrasée */
    chaleur: function () {
      var s = R.af(0, 0, 1200, 680, '#f8e2a6'), i, c = [['#efc98a', 40, 200], ['#e8b676', 300, 170], ['#f0d29b', 780, 210], ['#e8b676', 1010, 190]];
      for (i = 0; i < 12; i++) { var an = i * Math.PI / 6; s += p('M' + (240 + Math.cos(an - .1) * 118) + ',' + (130 + Math.sin(an - .1) * 118) + ' L' + (240 + Math.cos(an) * 196) + ',' + (130 + Math.sin(an) * 196) + ' L' + (240 + Math.cos(an + .1) * 118) + ',' + (130 + Math.sin(an + .1) * 118) + ' Z', '#f4b23d', 2.2); }
      s += cercle(240, 130, 104, '#ffcf5a', 3);
      c.forEach(function (q, k) {
        var x = q[1], y = q[2], w = k === 2 ? 230 : k === 3 ? 200 : 260;
        s += p('M' + x + ',500 V' + y + ' H' + (x + w) + ' V500 Z', q[0], 2.6) + p('M' + (x - 12) + ',' + y + ' L' + (x + w / 2) + ',' + (y - 30) + ' L' + (x + w + 12) + ',' + y + ' Z', '#b9583a', 2.4);
        for (var m = 0; m < Math.floor(w / 80); m++) for (var r = 0; r < 3; r++) s += R.rect(x + 22 + m * 80, y + 28 + r * 84, 44, 58, '#5d8f8c', 1.8) + t('M' + (x + 44 + m * 80) + ',' + (y + 28 + r * 84) + ' v58', 1.2);
      });
      // la croix de pharmacie
      s += t('M650,250 H760', 6) + '<g transform="translate(650,130)">' + a('M-44,0 H44 V82 H130 V170 H44 V252 H-44 V170 H-130 V82 H-44 Z', '#3f9a58') + t('M-44,0 H44 V82 H130 V170 H44 V252 H-44 V170 H-130 V82 H-44 Z', 3) + L.ligne('42', -12, 92, 70, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 4 }) + '<circle cx="48" cy="100" r="10" fill="none" stroke="' + PAL.blanc + '" stroke-width="6"/>' + '</g>';
      s += R.af(0, 500, 1200, 180, '#d9c595') + t('M0,500 H1200', 2.8);
      for (i = 0; i < 5; i++) s += S.usager(110 + i * 245, 500 + (i % 2) * 20, 1.08, i * 3 + 1, false) + chapeau(110 + i * 245, 500 + (i % 2) * 20, 1.08);
      return S.kase(1200, 680, 'Une rue écrasée de soleil, 42 degrés à la croix de la pharmacie.', s);
    },
    /* le feu : la colline qui brûle, le bombardier d'eau, le camion rouge */
    feu: function () {
      var s = R.af(0, 0, 1200, 680, '#f7dcae'), i;
      [[150, 150, 1.5], [420, 100, 1.9], [760, 130, 1.6]].forEach(function (q) { s += nuage(q[0], q[1], q[2], '#e7dccb'); });
      s += p('M-5,420 C200,270 420,250 640,320 C840,260 1040,250 1205,340 V680 H-5 Z', '#9aa767', 2.6);
      for (i = 0; i < 9; i++) s += pin(40 + i * 130, 340 + ((i * 5) % 3) * 22, 1 + (i % 2) * .2);
      [[170, 330, 1.4], [420, 300, 1.8], [670, 320, 1.5], [900, 310, 1.1]].forEach(function (q) { s += flamme(q[0], q[1], q[2]); });
      // le bombardier d'eau
      s += '<g transform="translate(830,50)">' + p('M0,50 C40,26 200,22 280,34 L330,0 L344,4 L326,52 C250,74 60,84 0,50 Z', PAL.rouge, 3) + p('M84,28 L220,18 L214,34 L90,40 Z', '#ffcf5a', 2.6) + R.rect(26, 38, 34, 16, '#c9e0e2', 2) + '</g>';
      for (i = 0; i < 6; i++) s += t('M' + (900 + i * 20) + ',132 q-6,70 -44,' + (120 + i * 12), 3).replace('stroke="' + INK + '"', 'stroke="#5d9ab2"');
      s += R.af(0, 500, 1200, 180, '#8d8778') + t('M0,500 H1200', 2.8);
      for (i = 0; i < 8; i++) s += R.af(30 + i * 160, 620, 90, 8, PAL.creme);
      // le camion
      s += p('M360,410 H860 V570 H360 Z', PAL.rouge, 3) + p('M860,440 H960 L1020,500 V570 H860 Z', PAL.rouge, 3) + R.rect(880, 456, 80, 52, '#c9e0e2', 2.2) + a('M362,510 H1018 V526 H362 Z', PAL.blanc) + t('M372,394 H840 M380,394 V410 M820,394 V410', 4) + L.ligne('POMPIERS', 610, 438, 44, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 3 });
      s += cercle(460, 572, 38, PAL.noir, 2.6) + cercle(460, 572, 14, PAL.grisC, 1.8) + cercle(920, 572, 38, PAL.noir, 2.6) + cercle(920, 572, 14, PAL.grisC, 1.8);
      s += agent(150, 480, 1.04, '#2c3a52', PAL.ocre) + agent(1110, 490, 1, '#2c3a52', PAL.ocre);
      return S.kase(1200, 680, 'Un incendie sur la colline, le bombardier d’eau, le camion des pompiers.', s);
    },
    /* la pluie : la rue inondée, la barque, le panneau */
    pluie: function () {
      var s = R.af(0, 0, 1200, 680, '#cfdcdc'), i;
      [[130, 70, 1.6], [480, 50, 1.9], [860, 70, 1.7], [1120, 60, 1.2]].forEach(function (q) { s += nuage(q[0], q[1], q[2], '#a9b9bc'); });
      [[30, 170, 280, '#e6d3a8'], [330, 200, 250, '#dcbf8c'], [600, 160, 260, '#e6d3a8'], [880, 190, 320, '#d6b98a']].forEach(function (q) {
        s += p('M' + q[0] + ',560 V' + q[1] + ' H' + (q[0] + q[2]) + ' V560 Z', q[3], 2.6) + p('M' + (q[0] - 10) + ',' + q[1] + ' L' + (q[0] + 24) + ',' + (q[1] - 36) + ' H' + (q[0] + q[2] - 24) + ' L' + (q[0] + q[2] + 10) + ',' + q[1] + ' Z', '#7a8791', 2.4);
        for (var m = 0; m < Math.floor(q[2] / 70); m++) for (var r = 0; r < 3; r++) s += R.rect(q[0] + 20 + m * 70, q[1] + 28 + r * 96, 40, 62, '#6f8f9c', 1.8);
      });
      // la voiture noyée
      s += p('M700,510 v-30 l40,-6 l34,-40 h110 l40,40 l36,8 v40 Z', PAL.rouge, 2.8) + R.rect(790, 442, 44, 30, '#3c4a50', 1.8) + R.rect(842, 442, 44, 30, '#3c4a50', 1.8);
      s += p('M-5,500 Q80,490 160,500 T320,500 T480,500 T640,500 T800,500 T960,500 T1120,500 T1280,500 V690 H-5 Z', '#8db6c4', 2.6);
      for (i = 0; i < 16; i++) s += t('M' + (30 + ((i * 137) % 1100)) + ',' + (530 + ((i * 53) % 130)) + ' q24,-8 48,0 t48,0', 1.6);
      // le panneau
      s += '<g transform="translate(1060,300)">' + p('M-6,120 V300 H6 V120 Z', PAL.grisC, 2.2) + p('M0,0 L110,150 H-110 Z', PAL.blanc, 3) + p('M0,28 L80,138 H-80 Z', 'none', 8).replace('stroke="' + INK + '"', 'stroke="' + PAL.rouge + '"') + t('M-34,112 q17,-10 34,0 t34,0 M-34,126 q17,-10 34,0 t34,0', 3) + '</g>';
      // la barque
      s += S.usager(330, 410, .92, 5, false) + parapluie(330, 396, 1.1, PAL.rouge) + S.usager(510, 414, .92, 8, false);
      s += p('M170,560 L690,560 L620,640 H250 Z', '#b9583a', 3) + p('M170,560 L690,560 L684,574 L180,574 Z', '#e6d3a8', 2.4) + t('M660,500 L560,650', 7);
      s += p('M170,640 Q300,624 430,640 T700,640 V690 H170 Z', '#8db6c4', 2.2);
      for (i = 0; i < 44; i++) s += t('M' + (10 + ((i * 271) % 1190)) + ',' + (40 + ((i * 97) % 440)) + ' l-8,26', 1.5).replace('stroke="' + INK + '"', 'stroke="#47748a"');
      return S.kase(1200, 680, 'Une rue inondée sous la pluie, une barque et une voiture noyée.', s);
    },
    /* la police : le commissariat, le fourgon, les agents */
    /* les marchés : le grand écran, la courbe des taux qui grimpe, la salle qui regarde */
    bourse: function () {
      var s = R.af(0, 0, 1200, 680, '#e8dcc0'), i;
      s += R.rect(60, 40, 1080, 400, '#1f2d4d', 3);
      for (i = 1; i < 6; i++) s += p('M60,' + (40 + i * 66) + ' H1140', 'none', 1, 'stroke-opacity=".35"');
      s += p('M90,420 V360 L260,350 L420,310 L560,322 L720,240 L880,190 L1110,110 V420 Z', '#c6402d', 2.8);
      s += L.ligne('TAUX DE LA DETTE', 330, 62, 40, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 4 });
      s += R.rect(860, 58, 250, 76, PAL.blanc, 2.6) + L.ligne('EN HAUSSE', 985, 80, 32, { ancre: 'm', encre: PAL.rouge, gras: true, graine: 5 });
      s += R.af(0, 440, 1200, 240, '#8d7f68') + t('M0,440 H1200', 2.8);
      [[470, .6, 12, 92], [540, .86, 9, 136]].forEach(function (r, ir) { for (var q = 0; q < r[2]; q++) s += S.usager(30 + q * r[3] + ir * 30, r[0], r[1], q + ir * 5, true); });
      return S.kase(1200, 680, 'Une salle de marché regarde grimper la courbe des taux de la dette française.', s);
    },
    /* le rond-point occupé : les gilets, le brasero, la banderole, la file de voitures */
    rondpoint: function () {
      var s = R.af(0, 0, 1200, 680, '#dbe8e6') + nuage(180, 70, .9) + nuage(960, 60, .8), i;
      s += a('M0,300 C200,270 420,290 600,276 C820,260 1000,290 1200,270 V680 H0 Z', '#a9b87a') + t('M0,300 C200,270 420,290 600,276 C820,260 1000,290 1200,270', 2.6);
      s += arbre(120, 300, .9) + arbre(1080, 290, .8);
      s += p('M0,470 C240,380 960,380 1200,470 V680 H0 Z', '#b8b2a2', 2.8);
      s += p('M280,560 C280,440 920,440 920,560 C920,650 280,650 280,560 Z', '#8ea05f', 3);
      s += t('M600,470 V300', 5) + R.rect(330, 230, 540, 84, PAL.blanc, 2.8) + L.ligne('NON AUX TAXES !', 600, 250, 44, { ancre: 'm', encre: PAL.rouge, gras: true, graine: 7 });
      s += p('M566,560 L580,500 H620 L634,560 Z', '#5a4a3c', 2.6) + p('M582,500 C570,462 594,458 590,430 C616,448 632,470 618,500 Z', '#e8682c', 2.2) + p('M594,500 C588,482 600,476 600,462 C612,474 616,488 608,500 Z', '#f6c64b', 1.6);
      [70, 200, 330, 790, 920, 1050].forEach(function (x, j) { s += agent(x, 410 + (j % 2) * 26, 1.02, '#e8c72e', j % 3 === 0 ? '#3b3a46' : '#7d4d31'); });
      return S.kase(1200, 680, 'Un rond-point occupé par des manifestants en gilet jaune, autour d\u2019un brasero.', s);
    },
    /* la Cour des comptes : la façade, le rapport, le tampon */
    cour: function () {
      var s = R.af(0, 0, 1200, 680, '#dbe8e6') + nuage(1040, 70, .8), i;
      s += p('M120,180 L600,70 L1080,180 Z', '#efe3c6', 2.8) + R.rect(120, 180, 960, 44, '#e2d4b3', 2.6);
      s += L.ligne('COUR DES COMPTES', 600, 188, 28, { ancre: 'm', encre: PAL.noir, gras: true, graine: 3 });
      s += R.rect(140, 224, 920, 216, '#efe3c6', 2.6);
      for (i = 0; i < 7; i++) s += R.rect(170 + i * 128, 224, 44, 216, '#f6eedb', 2.2);
      s += R.af(0, 440, 1200, 240, '#b8b2a2') + t('M0,440 H1200', 2.8);
      for (i = 0; i < 9; i++) s += S.usager(40 + i * 128, 470, .6, i, true);
      s += '<g transform="rotate(-4 600 540)">' + R.rect(380, 420, 440, 240, PAL.blanc, 3) + L.ligne('RAPPORT ANNUEL', 600, 440, 34, { ancre: 'm', encre: PAL.noir, gras: true, graine: 2 });
      for (i = 0; i < 2; i++) s += t('M420,' + (500 + i * 24) + ' H780', 1.6);
      s += R.rect(430, 556, 340, 74, '#fff3cf', 3) + L.ligne('PEU CRÉDIBLE', 600, 572, 40, { ancre: 'm', encre: PAL.rouge, gras: true, graine: 9 }) + '</g>';
      return S.kase(1200, 680, 'La façade de la Cour des comptes et un rapport tamponné « peu crédible ».', s);
    },
    police: function () {
      var s = R.af(0, 0, 1200, 680, '#dbe8e6') + nuage(1000, 60, .8) + nuage(160, 80, .9), i;
      s += p('M60,450 V110 H840 V450 Z', '#efe3c6', 2.8) + R.rect(180, 130, 540, 76, '#27508c', 2.8) + L.ligne('POLICE', 450, 142, 56, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 4 });
      [100, 200, 610, 710].forEach(function (x) { s += R.rect(x, 240, 84, 110, '#a9c8d0', 2.2) + t('M' + (x + 42) + ',240 v110', 1.4); });
      s += R.rect(360, 240, 180, 210, '#27395c', 2.6) + t('M450,240 V450', 2.2) + cercle(434, 350, 5, PAL.ocre, 1.4) + cercle(466, 350, 5, PAL.ocre, 1.4);
      s += t('M450,110 V36', 4) + R.af(452, 38, 34, 44, '#27508c') + R.af(486, 38, 34, 44, PAL.blanc) + R.af(520, 38, 34, 44, PAL.rouge) + t('M452,38 h102 v44 h-102', 1.8);
      s += R.af(0, 450, 1200, 230, '#b8b2a2') + t('M0,450 H1200', 2.8) + R.af(0, 450, 1200, 20, '#d4cdb9') + t('M0,470 H1200', 2);
      // le fourgon
      s += p('M700,340 H1090 C1124,340 1146,380 1160,430 L1190,456 V570 H700 Z', PAL.blanc, 3) + a('M702,470 H1188 V506 H702 Z', '#27508c') + t('M702,470 H1188 M702,506 H1188', 1.8) + R.rect(1060, 366, 78, 66, '#6f9fb2', 2.2) + R.rect(740, 372, 260, 60, '#6f9fb2', 2.2);
      for (i = 1; i < 5; i++) s += t('M' + (740 + i * 52) + ',372 v60', 2);
      s += p('M880,340 V314 H950 V340 Z', '#3f7fd0', 2.4) + L.ligne('POLICE', 880, 476, 25, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 6 }) + cercle(800, 572, 36, PAL.noir, 2.6) + cercle(800, 572, 13, PAL.grisC, 1.8) + cercle(1090, 572, 36, PAL.noir, 2.6) + cercle(1090, 572, 13, PAL.grisC, 1.8);
      s += agent(110, 450, 1.24, '#27395c', '#27395c') + agent(320, 450, 1.24, '#27395c', '#27395c') + agent(530, 450, 1.24, '#27395c', '#27395c');
      return S.kase(1200, 680, 'Le commissariat, un fourgon et trois agents devant la porte.', s);
    },
    /* la frontière : les montagnes, la barrière, le panneau, la file de voitures */
    frontiere: function () {
      var s = R.af(0, 0, 1200, 680, '#d6e6ea') + nuage(240, 70, 1), i;
      s += p('M-5,370 L170,160 L290,290 L440,100 L620,320 L790,170 L960,310 L1090,200 L1205,320 V500 H-5 Z', '#a6b7bd', 2.6);
      s += p('M170,160 L212,206 L180,226 L150,198 L128,210 Z M440,100 L500,172 L456,190 L422,160 L386,168 Z M790,170 L840,222 L800,232 L770,212 Z', PAL.blanc, 2);
      s += p('M-5,420 C300,360 900,370 1205,420 V680 H-5 Z', '#a7bb7c', 2.6);
      s += p('M430,680 L560,390 H660 L980,680 Z', '#858278', 2.6);
      for (i = 0; i < 4; i++) s += p('M' + (604 + i * 16) + ',' + (410 + i * 62) + ' l' + (6 + i * 3) + ',' + (36 + i * 8), 'none', 4 + i).replace('stroke="' + INK + '"', 'stroke="' + PAL.creme + '"');
      // le poste
      s += p('M90,520 V320 H360 V520 Z', '#efe3c6', 2.8) + p('M60,322 L225,270 L390,322 Z', '#6f7e8c', 2.6) + R.rect(120, 350, 210, 70, '#6f9fb2', 2.2) + L.ligne('DOUANE', 225, 438, 40, { ancre: 'm', gras: true, graine: 7 });
      // le panneau FRANCE
      s += t('M1000,420 V240', 6) + t('M1110,420 V240', 6) + p('M930,110 H1180 V290 H930 Z', '#27508c', 3) + L.ligne('FRANCE', 1055, 190, 50, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 5 });
      for (i = 0; i < 12; i++) s += cercle(1055 + Math.cos(i * Math.PI / 6) * 38, 145 + Math.sin(i * Math.PI / 6) * 24, 3.4, '#ffcf5a', 1);
      // la barrière
      s += R.rect(400, 410, 34, 120, PAL.grisC, 2.6);
      s += '<g transform="rotate(-4 417 430)">' + R.rect(416, 416, 500, 28, PAL.blanc, 2.6);
      for (i = 0; i < 5; i++) s += R.af(420 + i * 100, 418, 50, 24, PAL.rouge);
      s += t('M416,416 h500 v28 h-500 Z', 2.6) + '</g>';
      // la voiture et l'agent
      s += '<g transform="translate(520,470) scale(1.3)">' + p('M0,110 V70 L40,60 L84,10 H236 L280,60 L320,70 V110 Z', PAL.ocre, 2.8) + R.rect(100, 22, 52, 36, '#3c4a50', 1.8) + R.rect(166, 22, 52, 36, '#3c4a50', 1.8) + cercle(60, 112, 26, PAL.noir, 2.4) + cercle(60, 112, 10, PAL.grisC, 1.6) + cercle(260, 112, 26, PAL.noir, 2.4) + cercle(260, 112, 10, PAL.grisC, 1.6) + '</g>';
      s += agent(62, 520, 1.1, '#27395c', '#27395c');
      return S.kase(1200, 680, 'Un poste-frontière en montagne : la barrière baissée, le panneau France, une voiture contrôlée.', s);
    },
    /* le scandale : la porte du ministère, la meute, les flashs, le dossier */
    scandale: function () {
      var s = R.af(0, 0, 1200, 680, '#eadfc4'), i, n = 2;
      for (i = 1; i < 6; i++) s += t('M0,' + (i * 76) + ' H1200', 1.3);
      for (i = 0; i < 14; i++) s += t('M' + (i * 90 + (i % 2) * 20) + ',0 V380', .9);
      s += p('M400,430 V90 C400,30 800,30 800,90 V430 Z', '#f4ecd8', 3) + R.rect(440, 110, 320, 320, '#3e6b58', 3) + t('M600,110 V430', 2.6) + R.rect(466, 136, 110, 120, '#4f8069', 1.8) + R.rect(624, 136, 110, 120, '#4f8069', 1.8) + R.rect(466, 280, 110, 120, '#4f8069', 1.8) + R.rect(624, 280, 110, 120, '#4f8069', 1.8) + cercle(586, 290, 7, PAL.ocre, 1.6) + cercle(614, 290, 7, PAL.ocre, 1.6);
      s += t('M900,110 L990,60', 4) + '<g transform="rotate(-29 990 60)">' + R.af(990, 34, 40, 50, '#27508c') + R.af(1030, 34, 40, 50, PAL.blanc) + R.af(1070, 34, 40, 50, PAL.rouge) + t('M990,34 h120 v50 h-120 Z', 1.8) + '</g>';
      [[300, 150, 1.5], [930, 240, 1.3], [150, 300, .9], [820, 90, .8]].forEach(function (q) { s += flash(q[0], q[1], q[2]); });
      s += R.af(0, 430, 1200, 250, '#b5ab94') + t('M0,430 H1200', 2.8);
      for (i = 0; i < 11; i++) { var x = 60 + i * 108, y = 420 + (i % 2) * 18; s += S.usager(x, y, 1.02, n++, true); s += i % 3 === 1 ? micro(x + 10, y - 60) : appareil(x + 8, y - 96); }
      for (i = 0; i < 7; i++) s += S.usager(30 + i * 190, 556, 1.4, n++, true);
      // le dossier
      s += '<g transform="rotate(-6 300 540)">' + p('M60,450 H180 L206,476 H540 V660 H60 Z', '#efd28a', 3) + '<g transform="rotate(-5 300 560)">' + p('M104,510 H500 V596 H104 Z', 'none', 7).replace('stroke="' + INK + '"', 'stroke="' + PAL.rouge + '"') + L.ligne('CONFIDENTIEL', 302, 534, 40, { ancre: 'm', encre: PAL.rouge, gras: true, graine: 3 }) + '</g></g>';
      return S.kase(1200, 680, 'Devant la porte close du ministère, journalistes et flashs ; un dossier confidentiel au premier plan.', s);
    },
    /* la fête : la mairie pavoisée, les lampions, le bal, le feu d'artifice dans un soir clair */
    fete: function () {
      var s = R.af(0, 0, 1200, 680, '#8fa7c9') + a('M0,220 C300,190 900,190 1200,220 V680 H0 Z', '#d8b9b4') + a('M0,330 H1200 V680 H0 Z', '#f0cfa0'), i;
      [[210, 110, '#fff0a8', 1.1], [980, 90, '#ffb3a0', 1.2], [790, 60, PAL.blanc, .8]].forEach(function (q) { s += artifice(q[0], q[1], q[2], q[3]); });
      s += p('M280,470 V200 H920 V470 Z', '#f4e6c8', 2.8) + p('M256,204 L600,120 L944,204 Z', '#7a8791', 2.8) + L.ligne('MAIRIE', 600, 158, 36, { ancre: 'm', gras: true, graine: 5 });
      [330, 470, 650, 790].forEach(function (x) { s += R.rect(x, 280, 80, 120, '#6f9fb2', 2.2); });
      s += t('M600,120 V52', 4) + R.af(602, 54, 30, 38, '#27508c') + R.af(632, 54, 30, 38, PAL.blanc) + R.af(662, 54, 30, 38, PAL.rouge) + t('M602,54 h90 v38 h-90 Z', 1.8);
      s += R.af(0, 470, 1200, 210, '#d3b98a') + t('M0,470 H1200', 2.8);
      // les guirlandes de lampions
      [[0, 180, 400, 170, 90], [400, 170, 800, 170, 80], [800, 170, 1200, 180, 90]].forEach(function (g) {
        s += t('M' + g[0] + ',' + g[1] + ' Q' + ((g[0] + g[2]) / 2) + ',' + (g[1] + g[4] * 2) + ' ' + g[2] + ',' + g[3], 2);
        for (var k = 1; k < 6; k++) { var u = k / 6, x = (1 - u) * (1 - u) * g[0] + 2 * u * (1 - u) * ((g[0] + g[2]) / 2) + u * u * g[2], y = (1 - u) * (1 - u) * g[1] + 2 * u * (1 - u) * (g[1] + g[4] * 2) + u * u * g[3]; s += lampion(x, y + 4, [PAL.rouge, PAL.blanc, '#27508c'][k % 3]); }
      });
      for (i = 0; i < 9; i++) s += S.usager(40 + i * 140, 450 + (i % 2) * 10, .86, i * 3 + 2, false);
      for (i = 0; i < 6; i++) s += S.usager(100 + i * 200, 540, 1.16, i * 5 + 1, i % 2 === 0);
      return S.kase(1200, 680, 'Le bal populaire devant la mairie, les lampions et le feu d’artifice.', s);
    }
  };
  /* ---------- Le petit matériel des affiches ---------- */
  function nuage(x, y, k, c) { return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + p('M-70,20 C-90,20 -92,-6 -66,-8 C-62,-32 -24,-36 -14,-16 C0,-40 44,-34 44,-10 C70,-14 80,20 54,22 Z', c || PAL.blanc, 2) + '</g>'; }
  function arbre(x, y, k) { return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + p('M-10,0 L-6,-80 H6 L10,0 Z', PAL.brun, 2.4) + p('M-50,-70 C-76,-96 -56,-132 -30,-126 C-26,-160 26,-162 32,-128 C62,-130 76,-92 50,-68 C30,-52 -30,-52 -50,-70 Z', PAL.vert, 2.6) + t('M-20,-100 q10,-12 22,-6 M12,-86 q12,-8 18,2', 1.4) + '</g>'; }
  function pin(x, y, k) { return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + p('M-6,0 L-3,-70 H3 L6,0 Z', PAL.brunO, 2) + p('M-50,-64 C-46,-96 -20,-108 0,-108 C20,-108 46,-96 50,-64 C20,-54 -20,-54 -50,-64 Z', PAL.vertO, 2.2) + '</g>'; }
  function flamme(x, y, k) { return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + p('M-70,40 C-90,-10 -50,-30 -46,-70 C-24,-50 -22,-40 -14,-34 C-16,-70 0,-110 26,-130 C24,-90 56,-60 56,-30 C66,-36 70,-46 70,-56 C92,-20 84,20 66,40 Z', '#e8602c', 2.8) + p('M-34,40 C-46,10 -24,-4 -20,-26 C-8,-14 -4,-10 2,-8 C2,-34 12,-54 24,-66 C26,-40 46,-20 42,6 C44,18 40,30 34,40 Z', '#ffcf5a', 2) + '</g>'; }
  /* un agent, sur le même corps que les usagers : uniforme et casquette (ou casque, pour les pompiers) */
  function agent(x, y, k, c, coiffe) {
    var k0 = P.getK(); P.setK(1 / Math.pow(k, .7));
    var o = '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + p('M-44,190 L-46,30 C-46,10 -30,0 -12,-4 L12,-4 C30,0 46,10 46,30 L44,190 Z', c, 2.4) + t('M0,14 V190', 1.3) + p('M-14,-6 L0,16 L14,-6 Z', '#c9d6e0', 1.8) + p('M-9,-6 L-8,-22 L10,-22 L11,-6 Z', PAL.peau, 2) +
      p('M-21,-40 C-21,-60 21,-60 21,-40 C23,-20 12,-10 0,-10 C-12,-10 -23,-20 -21,-40 Z', PAL.peau, 2.3) + t('M-9,-34 l0,3 M10,-34 l0,3', 2.6) + t('M-5,-21 H6', 1.6) + t('M2,-32 q4,5 0,7', 1.2) +
      p('M-26,-42 C-30,-74 30,-74 26,-42 C14,-48 -14,-48 -26,-42 Z', coiffe, 2.2) + p('M-26,-42 Q0,-50 26,-42 L30,-36 Q0,-44 -30,-36 Z', PAL.noir, 1.6) + R.rect(24, 40, 14, 10, '#ffcf5a', 1.2) + '</g>';
    P.setK(k0); return o;
  }
  function casque(x, y, k, c) { return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + p('M-25,-40 C-30,-76 30,-76 25,-40 Z', c, 2.2) + p('M-30,-40 H30 L34,-34 H-34 Z', c, 2) + '</g>'; }
  function chapeau(x, y, k) { return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + p('M-22,-46 C-22,-74 22,-74 22,-46 Z', '#f2e2a8', 2.2) + p('M-40,-46 C-20,-54 20,-54 40,-46 C20,-38 -20,-38 -40,-46 Z', '#f2e2a8', 2.2) + '</g>'; }
  function parapluie(x, y, k, c) { return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + t('M0,-70 V40', 3) + p('M-90,-70 C-80,-130 80,-130 90,-70 C70,-84 50,-84 30,-70 C10,-84 -10,-84 -30,-70 C-50,-84 -70,-84 -90,-70 Z', c, 2.6) + '</g>'; }
  function flash(x, y, k) { var d = '', i; for (i = 0; i < 16; i++) { var r = i % 2 ? 26 : 70, an = i * Math.PI / 8; d += (i ? 'L' : 'M') + (Math.cos(an) * r).toFixed(1) + ',' + (Math.sin(an) * r).toFixed(1) + ' '; } return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + p(d + 'Z', '#ffe68a', 2.4) + '</g>'; }
  function appareil(x, y) { return p('M' + (x - 2) + ',' + (y + 70) + ' L' + x + ',' + (y + 14), 'none', 7) + R.rect(x - 28, y - 16, 56, 36, PAL.noir, 2) + cercle(x, y + 2, 11, PAL.grisC, 1.8) + R.rect(x - 14, y - 26, 20, 10, '#ffe68a', 1.4); }
  function micro(x, y) { return t('M' + x + ',' + (y + 40) + ' L' + (x + 6) + ',' + (y - 30), 5) + p('M' + (x - 8) + ',' + (y - 34) + ' a14,14 0 1,1 28,0 a14,14 0 1,1 -28,0', PAL.rouge, 2); }
  function artifice(x, y, c, k) { var s = '', i; for (i = 0; i < 12; i++) { var an = i * Math.PI / 6, r = i % 2 ? 44 : 70; s += p('M' + (Math.cos(an) * 14).toFixed(1) + ',' + (Math.sin(an) * 14).toFixed(1) + ' L' + (Math.cos(an) * r).toFixed(1) + ',' + (Math.sin(an) * r).toFixed(1), 'none', 4).replace('stroke="' + INK + '"', 'stroke="' + c + '"') + '<circle cx="' + (Math.cos(an) * (r + 8)).toFixed(1) + '" cy="' + (Math.sin(an) * (r + 8)).toFixed(1) + '" r="4" fill="' + c + '"/>'; } return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + s + '</g>'; }
  function lampion(x, y, c) { return p('M' + (x - 13) + ',' + (y + 4) + ' C' + (x - 20) + ',' + (y + 22) + ' ' + (x - 13) + ',' + (y + 38) + ' ' + x + ',' + (y + 40) + ' C' + (x + 13) + ',' + (y + 38) + ' ' + (x + 20) + ',' + (y + 22) + ' ' + (x + 13) + ',' + (y + 4) + ' Z', c, 2); }

  /* ---------- Les lieux du mandat : un bandeau sobre au-dessus de l'écran ---------- */
  var LIEUX = {
    /* l'Élysée : la cour, le perron, le pavillon central, le drapeau */
    elysee: function () {
      var s = R.af(0, 0, 1200, 260, '#dbe8e8') + nuage(160, 56, .8) + nuage(1050, 50, .7), i;
      s += p('M90,216 V96 H1110 V216 Z', '#f2e6cb', 2.6) + p('M78,98 L110,70 H1090 L1122,98 Z', '#8d97a0', 2.4);
      for (i = 0; i < 18; i++) if (i < 6 || i > 11) s += R.rect(116 + i * 54, 116, 30, 74, '#7fa3b0', 1.8) + t('M' + (131 + i * 54) + ',116 v74', 1);
      s += p('M450,216 V76 H750 V216 Z', '#f8efd9', 2.6) + p('M430,78 L600,26 L770,78 Z', '#f2e6cb', 2.6) + t('M470,70 L600,36 L730,70', 1.2);
      [474, 526, 578, 622, 674, 726].forEach(function (x) { s += R.rect(x - 8, 88, 16, 124, PAL.blanc, 1.8); });
      s += R.rect(566, 130, 68, 84, '#27395c', 2);
      s += t('M600,26 V-4', 3) + R.af(602, 2, 20, 22, '#27508c') + R.af(622, 2, 20, 22, PAL.blanc) + R.af(642, 2, 20, 22, PAL.rouge) + t('M602,2 h60 v22 h-60 Z', 1.4);
      s += R.af(0, 216, 1200, 44, '#d9c9a2') + t('M0,216 H1200', 2.6) + p('M420,228 H780 L800,238 H400 Z', PAL.rouge, 2);
      return svg(1200, 260, 'L’Élysée', s, 'bd-lieu');
    },
    /* l'Assemblée : le péristyle du palais Bourbon */
    assemblee: function () {
      var s = R.af(0, 0, 1200, 260, '#dbe8e8') + nuage(120, 60, .8) + nuage(1080, 50, .8), i;
      s += p('M60,190 V110 H1140 V190 Z', '#ebddbd', 2.4);
      for (i = 0; i < 12; i++) if (i < 3 || i > 8) s += R.rect(84 + i * 90, 126, 44, 50, '#7fa3b0', 1.8);
      s += p('M280,84 L600,14 L920,84 Z', '#f8efd9', 2.8) + p('M340,78 L600,28 L860,78 Z', '#ebddbd', 1.8) + R.rect(280, 84, 640, 18, '#f2e6cb', 2.2);
      for (i = 0; i < 12; i++) { var x = 298 + i * 55; s += p('M' + (x - 11) + ',102 H' + (x + 15) + ' L' + (x + 13) + ',198 H' + (x - 9) + ' Z', PAL.blanc, 1.8) + t('M' + (x + 2) + ',108 V192', .9); }
      s += t('M600,14 V-4', 3) + R.af(602, 0, 18, 12, '#27508c') + R.af(620, 0, 18, 12, PAL.blanc) + R.af(638, 0, 18, 12, PAL.rouge);
      for (i = 0; i < 4; i++) s += p('M' + (262 - i * 16) + ',' + (198 + i * 12) + ' H' + (938 + i * 16) + ' V' + (210 + i * 12) + ' H' + (262 - i * 16) + ' Z', i % 2 ? '#e0d2b0' : '#efe3c6', 1.8);
      s += R.af(0, 246, 1200, 14, '#bdb7a4');
      return svg(1200, 260, 'L’Assemblée nationale', s, 'bd-lieu');
    },
    /* le conseil des ministres : la grande table, les fauteuils, le miroir */
    conseil: function () {
      var s = R.af(0, 0, 1200, 260, '#efdfb9'), i;
      for (i = 0; i < 9; i++) s += t('M' + (70 + i * 132) + ',0 V150', 1.2) + R.rect(84 + i * 132, 24, 104, 106, '#f6ebcf', 1.3);
      [[60, 16], [1020, 16]].forEach(function (q) { s += R.rect(q[0], q[1], 120, 134, '#b9dbe2', 2.4) + t('M' + (q[0] + 60) + ',' + q[1] + ' v134 M' + q[0] + ',' + (q[1] + 44) + ' h120 M' + q[0] + ',' + (q[1] + 90) + ' h120', 1.4) + p('M' + (q[0] - 12) + ',8 h28 v146 h-28 Z', PAL.rouge, 2) + p('M' + (q[0] + 104) + ',8 h28 v146 h-28 Z', PAL.rouge, 2); });
      s += R.rect(528, 22, 144, 92, '#d9b35c', 2.6) + R.rect(540, 34, 120, 68, '#dbe8e8', 1.6) + R.af(562, 50, 26, 40, '#27508c') + R.af(588, 50, 26, 40, PAL.blanc) + R.af(614, 50, 26, 40, PAL.rouge) + t('M562,50 h78 v40 h-78 Z', 1.4);
      s += R.af(0, 150, 1200, 110, '#a8664a') + t('M0,150 H1200', 2.4);
      for (i = 0; i < 10; i++) s += p('M' + (130 + i * 100) + ',178 v-48 c0,-16 58,-16 58,0 v48 Z', '#c6402d', 2.2);
      s += p('M90,172 H1110 L1160,226 H40 Z', '#7a4a2e', 2.8) + a('M92,174 H1108 L1120,186 H80 Z', '#935c3b');
      s += p('M40,226 H1160 V240 H40 Z', '#5a3520', 2.2);
      for (i = 0; i < 10; i++) s += R.rect(132 + i * 100, 196, 52, 18, PAL.blanc, 1.4);
      return svg(1200, 260, 'Le conseil des ministres', s, 'bd-lieu');
    }
  };
  /* posés une fois pour toutes dans leur écran, entre le titre et les jauges */
  function poseLieu(idEcran, selecteur, lieu) {
    var d = root.document, ec = d && d.getElementById && d.getElementById(idEcran), ref = ec && ec.querySelector(selecteur);
    if (!ref) return;
    var b = d.createElement('div'); b.className = 'bd-bandeau'; b.innerHTML = LIEUX[lieu]();
    ref.parentNode.insertBefore(b, ref.nextSibling);
  }
  poseLieu('screen-gov', '.gov-top', 'elysee'); poseLieu('screen-oppo', '.gov-top', 'assemblee'); poseLieu('screen-gform', '.btw-head', 'conseil');
  function LUM() { return R.LUM; }
  function aUne(nom) { return !!UNE[nom]; }
  function scene(nom) { return UNE[nom] ? UNE[nom]() : LIEUX[nom] ? LIEUX[nom]() : ''; }
  function une(nom) { return UNE[nom] ? UNE[nom]() : ''; }

  root.PolitikBD = { grosPlan: grosPlan, faceAFace: faceAFace, plateau: plateau, studio: studio, tele: tele, mediaCase: mediaCase, aUne: aUne, une: une, scene: scene, LIEUX: LIEUX, depuisVisage: V.depuisVisage, NOMS: V.NOMS };
})(this);

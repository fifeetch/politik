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
    }
  };
  function LUM() { return R.LUM; }
  function aUne(nom) { return !!UNE[nom]; }
  function une(nom) { return UNE[nom] ? UNE[nom]() : ''; }

  root.PolitikBD = { grosPlan: grosPlan, faceAFace: faceAFace, plateau: plateau, studio: studio, aUne: aUne, une: une, depuisVisage: V.depuisVisage, NOMS: V.NOMS };
})(this);

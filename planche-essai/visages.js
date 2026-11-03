/* Planche d'essai — les autres personnalités, sur la même construction que personnages.js : même trait, même buste.
   Chaque fiche ne donne que ce qui la distingue. Noms parodiques de js/people.js.
   Visage : r pommettes, m mâchoire, q mâchoire carrée, c longueur du menton, w largeur du menton, fossette, creux, age 0 à 3.
   Yeux : ec écart, oe taille, ouv ouverture, incl pente (positive : tombants), paup paupière lourde, poches.
   Sourcils : sc couleur, se épaisseur, sl longueur, si et sb levés côté nez et côté tempe, sh hauteur, broussaille.
   Nez : nez (droit, busque, rond, pointu), nl longueur, nb avancée, nw largeur.
   Bouche : bf (droite, tombe, sourit, mince, pleine), ga et dr demi-largeurs, by hauteur, levres. */
(function (root) {
  var P = root.Perso, PAL = P.PAL, INK = P.INK, p = P.p, a = P.a, t = P.t, oeil = P.oeil, sourcil = P.sourcil, bouche = P.bouche, goutte = P.goutte, cercle = P.cercle;
  function trait(d, w, c) { return t(d, w).replace('stroke="' + INK + '"', 'stroke="' + c + '"'); }
  var PEAUX = [null, ['#e6b48c', '#c8915f'], ['#cf9a70', '#ad7a50'], ['#a56d47', '#7f5235']];

  /* ---------- Les traits ---------- */
  function unOeil(f, e, x, y, w, sens) {
    var incl = f.incl || 0, ouv = e.ouv * (f.ouv || 1), s = oeil(x, y, w, ouv, e.reg, e.regY, sens);
    if (f.paup) {
      var yy = y - w * .22;
      s += a('M' + (x - w / 2 - 1) + ',' + (y + .5) + ' C' + (x - w * .3) + ',' + (y - w * .5) + ' ' + (x + w * .3) + ',' + (y - w * .5) + ' ' + (x + w / 2 + 1) + ',' + (y + .5) + ' Q' + x + ',' + yy + ' ' + (x - w / 2 - 1) + ',' + (y + .5) + ' Z', PAL.peau);
      s += t('M' + (x - w / 2 - 1) + ',' + (y + .5) + ' Q' + x + ',' + yy + ' ' + (x + w / 2 + 1) + ',' + (y + .5), 1.8);
    }
    if (f.poches) s += t('M' + (x - w * .4) + ',' + (y + w * .46) + ' Q' + x + ',' + (y + w * .72) + ' ' + (x + w * .46) + ',' + (y + w * .42), 1);
    return incl ? '<g transform="rotate(' + (sens > 0 ? -incl : incl) + ' ' + x + ' ' + y + ')">' + s + '</g>' : s;
  }
  function unNez(f) {
    var nl = f.nl || 0, nb = f.nb || 0, nw = f.nw || 0, tx = 139 + nb, ty = 148 + nl, w = f.femme ? 1.8 : 2, d;
    if (f.nez === 'busque') d = 'M122,104 C123,112 ' + (127 + nb) + ',120 ' + (134 + nb) + ',130 C' + (137 + nb) + ',136 ' + (tx - 1) + ',' + (ty - 8) + ' ' + tx + ',' + ty + ' C' + (tx + 2) + ',' + (ty + 8) + ' ' + (tx - 3) + ',' + (ty + 12) + ' ' + (tx - 10) + ',' + (ty + 11) + ' C' + (tx - 14) + ',' + (ty + 15) + ' ' + (tx - 21 - nw) + ',' + (ty + 14) + ' ' + (tx - 24 - nw) + ',' + (ty + 9);
    else if (f.nez === 'rond') d = 'M122,104 C124,120 ' + (132 + nb) + ',' + (132 + nl * .7) + ' ' + (tx - 2) + ',' + (ty - 4) + ' C' + (tx + 7) + ',' + (ty + 1) + ' ' + (tx + 5) + ',' + (ty + 15) + ' ' + (tx - 7) + ',' + (ty + 14) + ' C' + (tx - 12) + ',' + (ty + 19) + ' ' + (tx - 23 - nw) + ',' + (ty + 18) + ' ' + (tx - 26 - nw) + ',' + (ty + 10);
    else if (f.nez === 'pointu') d = 'M122,104 C124,122 ' + (136 + nb) + ',' + (138 + nl * .7) + ' ' + (tx + 2) + ',' + (ty + 2) + ' C' + (tx + 3) + ',' + (ty + 7) + ' ' + (tx - 2) + ',' + (ty + 9) + ' ' + (tx - 8) + ',' + (ty + 9) + ' C' + (tx - 11) + ',' + (ty + 12) + ' ' + (tx - 16 - nw) + ',' + (ty + 11) + ' ' + (tx - 19 - nw) + ',' + (ty + 7);
    else d = 'M122,104 C124,120 ' + (134 + nb) + ',' + (136 + nl * .7) + ' ' + tx + ',' + ty + ' C' + (tx + 2) + ',' + (ty + 8) + ' ' + (tx - 3) + ',' + (ty + 12) + ' ' + (tx - 10) + ',' + (ty + 11) + ' C' + (tx - 14) + ',' + (ty + 15) + ' ' + (tx - 21 - nw) + ',' + (ty + 14) + ' ' + (tx - 24 - nw) + ',' + (ty + 9);
    return t(d, w);
  }
  function uneBouche(f, e, ym) {
    var ga = f.ga || 21, dr = f.dr || 20, x = 121, s = '', B = e.bouche, bf = f.bf || 'droite', coin = B === 'assure' || bf === 'sourit', tombe = bf === 'tombe';
    // le rouge à lèvres passe sous le trait de la bouche
    if (f.levres && B !== 'colere' && B !== 'parle') {
      var hl = bf === 'mince' ? .6 : bf === 'pleine' ? 1.3 : 1, cy = coin ? -5 : tombe ? 3 : 0;
      s += a('M' + (x - ga) + ',' + (ym + cy) + ' Q' + (x - ga * .5) + ',' + (ym - 7 * hl) + ' ' + (x - 1) + ',' + (ym - 4 * hl) + ' Q' + (x + dr * .5) + ',' + (ym - 7 * hl) + ' ' + (x + dr) + ',' + (ym + cy * .6) + ' Q' + (x + dr * .4) + ',' + (ym + 11 * hl) + ' ' + (x - 1) + ',' + (ym + 10 * hl) + ' Q' + (x - ga * .5) + ',' + (ym + 11 * hl) + ' ' + (x - ga) + ',' + (ym + cy) + ' Z', f.levres);
    }
    if (B !== 'ferme') return s + bouche(B, x, ym, ga, dr);
    var ligne = bf === 'tombe' ? 'M' + (x - ga) + ',' + (ym + 5) + ' Q' + (x - ga * .3) + ',' + (ym - 2) + ' ' + x + ',' + (ym - 1) + ' Q' + (x + dr * .4) + ',' + (ym - 1) + ' ' + (x + dr) + ',' + (ym + 4)
      : bf === 'sourit' ? 'M' + (x - ga - 2) + ',' + (ym - 5) + ' Q' + (x - ga * .4) + ',' + (ym + 5) + ' ' + x + ',' + (ym + 4) + ' Q' + (x + dr * .5) + ',' + (ym + 3) + ' ' + (x + dr) + ',' + (ym - 3)
      : 'M' + (x - ga) + ',' + ym + ' Q' + (x - 2) + ',' + (ym + 2.6) + ' ' + (x + dr) + ',' + (ym - 1);
    s += p(ligne, 'none', bf === 'mince' ? 1.7 : 2.2);
    if (bf !== 'mince') s += t('M' + (x - ga * .36) + ',' + (ym + (bf === 'pleine' ? 15 : 11)) + ' Q' + x + ',' + (ym + (bf === 'pleine' ? 18 : 13)) + ' ' + (x + dr * .46) + ',' + (ym + (bf === 'pleine' ? 14 : 10)), bf === 'pleine' ? 1.6 : 1.3);
    if (bf === 'sourit') s += t('M' + (x - ga - 5) + ',' + (ym - 7) + ' Q' + (x - ga - 4) + ',' + (ym - 3) + ' ' + (x - ga) + ',' + (ym - 1), 1.2);
    return s;
  }

  /* ---------- La tête ---------- */
  function tete(f, e) {
    var j = e.j, s = '', r = f.r || 0, m = f.m || 0, c = f.c || 0, w = f.w || 0, q = f.q || 0, ey = f.ey || 0, ec = f.ec || 0;
    var oy = 114 + ey, oy2 = 112 + ey, sy = 98 + ey - (f.sh || 0), sy2 = 96 + ey - (f.sh || 0);
    if (f.dos) s += f.dos();
    if (!f.sansOreille) {
      var oe = f.oreille || 1;
      s += '<g transform="translate(56,130) scale(' + oe + ') translate(-56,-130)">' + p('M58,112 C46,102 38,114 42,130 C45,146 54,156 62,150 Z', PAL.peau) + t('M49,120 C47,128 51,140 56,143', 1.3) + '</g>';
    }
    var bas = 224 + j + c;
    s += p('M62,60 C88,40 140,40 154,74 C158,86 157,94 154,102 C152,110 ' + (156 + r) + ',118 ' + (158 + r) + ',128 C' + (161 + r + m * .4) + ',146 ' + (158 + r + m) + ',160 ' + (153 + r + m + q * .5) + ',176 C' + (149 + m + q) + ',' + (194 + j * .7 + c * .5) + ' ' + (142 + m + w + q) + ',' + (212 + j + c) + ' ' + (126 + w) + ',' + bas +
      ' C' + (112 + w * .4) + ',' + (bas + 8 - q * .4) + ' ' + (96 - w * .4) + ',' + (bas + 4) + ' ' + (84 - w - q) + ',' + (214 + j + c) + ' C' + (70 - m - q) + ',' + (198 + j + c * .5) + ' ' + (62 - m) + ',176 ' + (60 - m * .5) + ',158 L58,110 C56,90 56,74 62,60 Z', PAL.peau);
    s += a('M' + (60 - m * .5) + ',158 C' + (62 - m) + ',176 ' + (70 - m - q) + ',' + (198 + j + c * .5) + ' ' + (84 - w - q) + ',' + (214 + j + c) + ' C80,194 76,174 76,156 C70,146 64,132 58,112 Z', PAL.peauO);
    if (f.joues) s += a('M84,150 C94,144 104,150 102,160 C96,168 84,164 84,150 Z', f.joues) + a('M146,146 C152,142 158,146 156,154 C152,160 146,156 146,146 Z', f.joues);
    // les rides, selon l'âge
    var age = f.age || 0;
    if (age >= 1) s += t('M94,70 Q118,62 142,70', 1) + t('M84,132 Q98,139 112,131', 1);
    if (age >= 2) s += t('M92,82 Q118,74 146,82', 1.1) + t('M78,114 Q72,112 68,106 M80,122 Q72,124 66,120', 1) + t('M112,158 C98,170 88,182 86,' + (198 + j), 1.3);
    if (age >= 3) s += t('M96,58 Q118,52 138,58', 1) + t('M88,' + (216 + j + c) + ' C100,' + (224 + j + c) + ' 116,' + (224 + j + c) + ' 128,' + (218 + j + c), 1.1) + t('M140,160 C146,170 148,180 146,' + (190 + j), 1.1);
    if (f.creux) s += t('M78,150 C82,164 86,176 94,184', 1.2);
    if (f.fossette) s += t('M116,' + (216 + j + c) + ' Q119,' + (220 + j + c) + ' 122,' + (216 + j + c), 1.2);
    if (e.rides) s += t('M116,94 L120,84 M126,94 L124,84', 1.4);
    if (e.goutte) s += t('M98,62 Q118,56 138,62', 1.2);
    if (f.barbe) s += f.barbe(j);
    // sourcils, yeux, nez, bouche
    var sc = f.sc || PAL.brunO, se = f.se || 5.2, sl = f.sl || 30, si = f.si || 0, sb = f.sb || 0;
    s += sourcil(96 - ec, sy, sl, e.bi + si, e.be + sb, se, sc, 1) + sourcil(141 + ec * .6, sy2, sl * .66, e.bi + si, e.be + sb, se * .84, sc, -1);
    if (f.broussaille) s += t('M' + (86 - ec) + ',' + (sy - 4) + ' l-3,-5 M' + (96 - ec) + ',' + (sy - 6) + ' l-2,-5 M' + (106 - ec) + ',' + (sy - 5) + ' l1,-5 M' + (140 + ec) + ',' + (sy2 - 5) + ' l-1,-5 M' + (148 + ec) + ',' + (sy2 - 4) + ' l2,-5', 1.2);
    var fe = (f.femme ? 1.06 : 1) * (f.oe || 1);
    s += unOeil(f, e, 99 - ec, oy, 24 * fe, 1) + unOeil(f, e, 142 + ec * .6, oy2, 16 * fe, -1);
    if (f.femme) s += t('M' + (87 - ec) + ',' + (oy - 3) + ' L' + (82 - ec) + ',' + (oy - 7) + ' M' + (89 - ec) + ',' + (oy - 6) + ' L' + (85 - ec) + ',' + (oy - 11) + ' M' + (150 + ec * .6) + ',' + (oy2 - 4) + ' L' + (154 + ec * .6) + ',' + (oy2 - 8), 1.5);
    s += unNez(f);
    if (f.moustache) s += f.moustache(j);
    s += uneBouche(f, e, 186 + j * .3 + (f.by || 0));
    if (f.lunettes) s += f.lunettes(oy, oy2, ec);
    if (f.cheveux) s += f.cheveux(e);
    if (f.boucle) s += cercle(50, 150, 3.6, f.boucle, 1.2);
    if (e.goutte) s += goutte(164, 80, 5) + goutte(52, 94, 4);
    return s;
  }

  /* ---------- Coiffures : d'un seul tenant, posées sur le crâne ---------- */
  var FORMES = {
    raie: ['M60,114 C52,98 50,78 54,60 C60,36 88,22 120,24 C144,26 160,42 160,62 C159,68 157,72 153,74 C142,62 124,56 104,58 C90,60 80,70 74,90 C70,100 64,108 60,114 Z', 'M60,114 C52,98 50,78 54,60 C56,50 60,44 66,38 C62,56 64,76 72,90 C68,100 64,108 60,114 Z', 'M84,62 C90,46 108,36 132,38 M100,58 C110,48 126,46 148,54 M76,74 C70,60 74,46 84,38'],
    arriere: ['M60,112 C52,98 50,80 54,62 C60,38 88,26 118,28 C142,30 158,44 158,62 C150,54 134,50 116,52 C96,54 84,62 76,84 C70,94 64,104 60,112 Z', 'M60,112 C52,98 50,80 54,62 C56,52 60,46 66,42 C62,58 66,74 72,88 C68,98 64,106 60,112 Z', 'M82,64 C88,50 104,42 128,42 M98,56 C108,48 124,46 146,52'],
    dense: ['M60,116 C50,100 46,78 52,58 C60,34 92,22 122,26 C146,28 160,44 160,66 C150,58 136,54 118,56 C100,58 86,66 78,84 C72,96 66,106 60,116 Z', 'M60,116 C50,100 46,78 52,58 C54,50 60,42 66,38 C60,58 64,78 72,92 C68,102 64,110 60,116 Z', 'M84,62 C92,46 110,38 136,40 M100,56 C112,48 128,48 150,56'],
    degarni: ['M60,118 C50,104 44,82 50,62 C58,38 90,28 120,32 C140,34 154,46 158,64 C148,54 134,48 118,48 C106,48 94,50 86,58 C78,70 72,86 68,98 C66,106 62,112 60,118 Z', 'M60,118 C50,104 44,82 50,62 C52,54 56,48 62,44 C58,62 62,84 68,98 C66,106 62,112 60,118 Z', 'M78,60 C82,48 96,42 116,40 M64,76 C60,62 66,52 76,46'],
    ras: ['M60,112 C54,98 52,78 56,62 C62,42 90,32 118,34 C138,36 154,48 156,66 C146,60 130,56 112,56 C96,58 84,66 76,82 C70,94 64,104 60,112 Z', 'M60,112 C54,98 52,78 56,62 C58,54 62,48 66,44 C62,60 66,76 72,88 C68,96 64,104 60,112 Z', ''],
    meche: ['M58,124 C44,112 38,88 44,64 C50,34 80,18 114,20 C140,18 162,34 162,58 C164,68 158,74 150,70 C146,78 136,78 128,70 C120,80 108,80 100,72 C92,84 80,92 72,100 C68,110 62,118 58,124 Z', 'M58,124 C44,112 38,88 44,64 C46,54 50,46 56,40 C52,60 58,82 70,100 C66,110 62,118 58,124 Z', 'M72,84 C70,60 84,42 106,36 M92,70 C94,54 110,44 132,44 M112,66 C120,54 134,52 152,58'],
    boucle: ['M58,118 C46,112 40,98 44,88 C34,76 42,60 52,58 C50,42 66,32 78,36 C84,22 106,20 116,30 C130,20 150,28 150,42 C162,46 166,62 158,72 C150,66 140,62 128,64 C116,58 96,62 88,70 C80,78 72,92 66,104 C64,110 60,114 58,118 Z', 'M58,118 C46,112 40,98 44,88 C40,82 40,74 44,68 C48,82 56,94 66,104 C64,110 60,114 58,118 Z', 'M62,70 C68,62 76,62 80,68 M84,48 C92,42 102,44 106,50 M118,42 C126,38 136,42 138,50 M72,88 C78,80 86,80 90,84'],
    courtF: ['M60,130 C46,126 36,108 34,88 C30,56 56,26 96,24 C130,22 156,40 160,72 C162,80 160,84 158,88 C146,68 118,60 92,70 C78,78 70,96 66,120 C64,124 62,128 60,130 Z', 'M60,130 C46,126 36,108 34,88 C33,74 38,60 46,48 C44,72 50,96 62,112 C62,118 61,124 60,130 Z', 'M72,84 C66,62 80,44 104,36 M88,68 C90,52 106,42 130,42 M104,62 C112,54 128,52 150,62']
  };
  function coupe(forme, c, o, l) {
    var F = FORMES[forme];
    return function () { return p(F[0], c, 2.6) + a(F[1], o) + (F[2] ? trait(F[2], 1.2, l) : ''); };
  }
  /* le crâne dégarni : deux pans de côté seulement */
  function calvitie(c, o, l) {
    return function () {
      return p('M58,126 C46,116 40,98 44,80 C48,70 56,62 62,60 C60,74 66,90 72,98 C68,108 62,118 58,126 Z', c, 2.2) + a('M58,126 C46,116 40,98 44,80 C46,76 48,72 52,70 C50,88 58,102 68,104 C66,112 62,120 58,126 Z', o) +
        p('M150,62 C156,68 158,76 158,86 C154,80 150,72 146,66 Z', c, 1.6) + (l ? trait('M78,56 C94,46 118,46 136,54 M84,62 C98,54 116,54 130,60', 1, l) : '');
    };
  }
  /* cheveux longs ou mi-longs : en mèches inégales, jamais en casque. bas : la hauteur des pointes ; centre : raie au milieu */
  function longs(bas, c, o, l, centre) {
    var y = bas;
    return {
      dos: function () {
        return p('M60,42 C36,46 20,76 20,112 C20,132 12,150 16,' + (y - 50) + ' C18,' + (y - 24) + ' 28,' + (y - 6) + ' 42,' + y + ' C50,' + (y - 10) + ' 56,' + (y - 2) + ' 68,' + (y - 16) + ' C76,' + (y - 36) + ' 78,160 84,130 L148,130 C150,150 154,' + (y - 50) + ' 160,' + (y - 30) + ' C168,' + (y - 20) + ' 178,' + (y - 36) + ' 180,' + (y - 58) + ' C184,' + (y - 90) + ' 186,112 178,88 C168,58 146,34 110,30 C92,28 74,32 60,42 Z', c, 2.6) +
          a('M60,42 C36,46 20,76 20,112 C20,132 12,150 16,' + (y - 50) + ' C18,' + (y - 24) + ' 28,' + (y - 6) + ' 42,' + y + ' C36,' + (y - 40) + ' 34,150 38,112 C42,84 48,62 60,42 Z', o) +
          trait('M50,90 C44,120 46,' + (y - 50) + ' 56,' + (y - 14) + ' M172,100 C176,124 174,' + (y - 70) + ' 170,' + (y - 44), 1.3, l);
      },
      cheveux: function () {
        var dessus = centre ? 'M60,122 C50,98 52,74 64,58 C78,42 100,36 114,44 C130,36 150,46 158,62 C162,70 162,78 162,88 C154,72 138,58 114,52 C98,62 84,74 78,90 C72,100 66,110 60,122 Z'
          : 'M60,122 C50,98 52,74 64,58 C80,38 112,30 136,42 C152,50 162,64 162,84 C152,74 140,66 124,62 C108,70 92,72 82,86 C74,98 68,110 60,122 Z';
        return p('M64,98 C54,122 50,' + (y - 70) + ' 56,' + (y - 34) + ' C60,' + (y - 22) + ' 70,' + (y - 24) + ' 72,' + (y - 38) + ' C68,' + (y - 70) + ' 68,134 72,108 Z', c, 2.2) +
          p(dessus, c, 2.6) + trait('M66,84 C72,62 92,48 118,46 M84,76 C96,66 110,58 124,52 M134,52 C144,58 152,66 156,74', 1.2, l);
      }
    };
  }
  /* le chignon : coupe courte sur le devant, petite masse derrière la tête */
  function chignon(c, o, l) {
    var F = FORMES.courtF;
    return {
      dos: function () { return p('M38,62 C22,58 14,76 22,90 C30,100 44,96 48,84 Z', c, 2.4); },
      cheveux: function () { return p(F[0], c, 2.6) + a(F[1], o) + trait(F[2], 1.2, l); }
    };
  }

  /* ---------- Barbes, moustaches, lunettes ---------- */
  function barbe(c, o) {
    o = o || {};
    var h = o.h == null ? 176 : o.h, ep = o.ep || 0, stries = o.stries || INK;
    return function (j) {
      return p('M60,' + (h - 14) + ' C66,' + (h - 2) + ' 78,' + (h + 8) + ' 92,' + (h + 10) + ' C100,' + (h + 6) + ' 108,' + h + ' 120,' + h + ' C132,' + h + ' 142,' + (h + 2) + ' 150,' + (h - 4) + ' C154,' + (h + 6) + ' 150,196 ' + (143 + ep) + ',' + (208 + j) + ' C136,' + (224 + j + ep) + ' 124,' + (233 + j + ep) + ' 108,' + (235 + j + ep) + ' C92,' + (235 + j + ep) + ' 78,' + (218 + j) + ' 68,196 C62,184 60,172 60,' + (h - 14) + ' Z', c, 1.6) +
        trait('M76,190 l3,6 M92,206 l2,6 M112,218 l1,6 M134,204 l-2,6 M146,186 l-2,6', .9, stries);
    };
  }
  function lunettes(forme, c, ep) {
    c = c || INK; ep = ep || 2.4;
    function tr(d, w) { return p(d, 'none', w).replace('stroke="' + INK + '"', 'stroke="' + c + '"'); }
    return function (oy, oy2, ec) {
      ec = ec || 0;
      var x1 = 99 - ec, x2 = 142 + ec * .6, s = '';
      if (forme === 'rondes') s += tr('M' + (x1 - 17) + ',' + oy + ' a17,17 0 1,0 34,0 a17,17 0 1,0 -34,0', ep) + tr('M' + (x2 - 12) + ',' + oy2 + ' a12,16 0 1,0 24,0 a12,16 0 1,0 -24,0', ep);
      else {
        var h = forme === 'fines' ? 12 : 15;
        s += tr('M' + (x1 - 19) + ',' + (oy - h) + ' L' + (x1 + 20) + ',' + (oy - h - 2) + ' L' + (x1 + 19) + ',' + (oy + h - 4) + ' Q' + x1 + ',' + (oy + h + 3) + ' ' + (x1 - 16) + ',' + (oy + h - 1) + ' Z', ep);
        s += tr('M' + (x2 - 13) + ',' + (oy2 - h) + ' L' + (x2 + 14) + ',' + (oy2 - h - 1) + ' L' + (x2 + 12) + ',' + (oy2 + h - 4) + ' Q' + (x2 - 1) + ',' + (oy2 + h + 2) + ' ' + (x2 - 12) + ',' + (oy2 + h - 2) + ' Z', ep);
      }
      s += tr('M' + (x1 + 19) + ',' + (oy - 6) + ' Q' + ((x1 + x2) / 2) + ',' + (oy - 11) + ' ' + (x2 - 12) + ',' + (oy2 - 6), ep * .85);
      s += tr('M' + (x1 - 18) + ',' + (oy - 5) + ' L58,' + (oy - 12), ep * .85);
      return s;
    };
  }

  /* ---------- Les bustes ---------- */
  function costume(f) {
    var c = f.habit || PAL.marine, o = f.habitO || PAL.marineO, l = f.l || 1;
    return function () {
      return '<g transform="translate(240,0) scale(' + l + ',1) translate(-240,0)">' +
        p('M188,278 C150,288 100,296 72,332 C54,362 48,430 44,490 L396,490 C394,430 390,374 378,344 C362,316 322,302 286,284 Z', c, 2.8) +
        a('M72,332 C54,362 48,430 44,490 L80,490 C82,440 90,392 104,362 Z', o) +
        t('M104,362 C116,400 118,440 116,490 M348,346 C340,400 338,440 340,490', 1.8) +
        p('M192,282 L240,430 L286,284 Z', f.chemise || PAL.blanc, 2) + '</g>';
    };
  }
  function colCostume(f) {
    var o = f.habitO || PAL.marineO, ch = f.chemise || PAL.blanc, cr = f.cravate;
    return function () {
      var s = '';
      if (!cr) s += p('M212,298 L238,352 L266,300 C248,314 228,312 212,298 Z', PAL.peau, 1.6);
      s += p('M188,276 L214,330 L238,300 C216,302 198,292 188,276 Z', ch, 2) + p('M290,282 L264,334 L238,300 C260,300 280,294 290,282 Z', ch, 2);
      if (cr) s += p('M228,302 L250,302 L256,318 L248,328 L232,326 L226,316 Z', cr, 2) + p('M232,328 L248,328 L256,430 L242,446 L228,430 Z', cr, 2) + a('M232,328 L240,328 L238,446 L228,430 Z', '#00000033');
      s += p('M186,274 C180,310 182,340 186,358 L204,352 L198,372 L242,470 L240,432 Z', o, 2.4) + p('M292,282 C300,316 298,342 294,358 L276,352 L280,370 L246,470 L242,432 Z', o, 2.4);
      s += t('M246,470 L248,490', 1.6);
      if (f.echarpe) s += p('M170,262 C190,296 280,300 306,262 C314,276 312,298 300,310 C260,330 196,326 172,298 C164,286 164,272 170,262 Z', f.echarpe, 2.4) + p('M206,316 C200,350 200,390 204,424 L236,426 C232,390 236,352 244,320 Z', f.echarpe, 2.2);
      return s;
    };
  }
  function tailleur(f) {
    var c = f.habit || '#3b3a46', o = f.habitO || '#2a2933';
    return function () {
      return p('M186,272 C160,284 124,290 100,320 C84,350 76,430 74,490 L368,490 C366,430 360,364 350,336 C338,308 306,296 278,278 Z', c, 2.8) +
        a('M100,320 C84,350 76,430 74,490 L104,490 C106,440 112,392 124,360 Z', o) +
        t('M124,360 C134,400 136,440 134,490 M326,340 C318,400 316,440 318,490', 1.8) +
        p('M196,272 L232,370 L276,276 Z', f.chemise || PAL.creme, 2);
    };
  }
  function colTailleur(f) {
    var o = f.habitO || '#2a2933';
    return function () {
      var s = p('M204,280 L232,340 L266,282 C248,296 222,296 204,280 Z', PAL.peau, 1.6);
      s += p('M186,270 C176,300 178,330 182,350 L232,420 L232,370 Z', o, 2.4) + p('M280,276 C288,306 288,330 284,350 L238,420 L232,370 Z', o, 2.4) + t('M238,420 L240,490', 1.6);
      if (f.collier) [[210, 300], [218, 312], [228, 320], [238, 322], [248, 316], [258, 306], [264, 294]].forEach(function (q) { s += cercle(q[0], q[1], 3, f.collier, 1); });
      return s;
    };
  }
  function ajoute(id, f) {
    var fem = !!f.femme, teinte = f.teint ? PEAUX[f.teint] : null;
    if (f.coiffure) { if (typeof f.coiffure === 'function') f.cheveux = f.coiffure; else { f.dos = f.coiffure.dos; f.cheveux = f.coiffure.cheveux; } }
    P.FICHE[id] = {
      tete: function (e) { return tete(f, e); }, peau: teinte && teinte[0], peauO: teinte && teinte[1],
      corps: fem ? tailleur(f) : costume(f), col: fem ? colTailleur(f) : colCostume(f), geste: function () { return ''; },
      cou: f.cou || (fem ? [76, 144, 150, 136 + (f.m || 0), 50] : [70, 150, 150, 140 + (f.m || 0), 50]), at: f.at || (fem ? [114, 38] : [114, 42]), k: f.k || (fem ? 1.12 : 1.14)
    };
  }

  /* ---------- Les personnalités ---------- */
  var BRUN = ['#3a2a20', '#281c15', '#7a6250'], CHATAIN = ['#6b4a33', '#513623', '#a08468'], NOIR = ['#2a2522', '#191513', '#6b5e54'], GRIS = ['#a8a79c', '#85847a', '#5d5c54'], BLANC = ['#e4e1d4', '#bdbaad', '#8d8c82'], POIVRE = ['#5e5a55', '#3f3c38', '#a09b94'], BLOND = ['#e0bd68', '#b8923f', '#8a6a2a'], CENDRE = ['#bcb298', '#958b72', '#6b634e'];
  function C(forme, t3) { return coupe(forme, t3[0], t3[1], t3[2]); }
  function L(bas, t3, centre) { return longs(bas, t3[0], t3[1], t3[2], centre); }
  function K(t3) { return calvitie(t3[0], t3[1], t3[2]); }
  var BLOND2 = ['#c9a35a', '#a38240', '#7a6030'], SEL = ['#7d7a74', '#5d5b56', '#b5b2ab'];
  var NOMS = { 'Jean-Lutte Mégaphone': 'megaphone', 'Jordan Brushing': 'brushing', 'Élisabeth Bornée': 'bornee', 'Marine Tournesol': 'tournesol', 'Fabien Rillettes': 'rillettes' };

  var FICHES = {
    /* Raphaël Grandsmots : la quarantaine, mince, cheveux bruns ondulés qui retombent, chemise ouverte sans cravate */
    'Raphaël Grandsmots': { m: -4, c: 5, age: 1, sc: '#2c211a', se: 4.4, sb: 3, nez: 'pointu', nl: 5, oe: 1.04, incl: 3, ga: 20, dr: 18, bf: 'sourit', habit: '#2b2c33', habitO: '#1f1f26', l: .94, coiffure: C('meche', BRUN) },
    /* Gabriel Agité : trente-cinq ans passés, visage plein et lisse, cheveux bruns courts, raie sur le côté */
    'Gabriel Agité': { r: 2, m: 2, c: -2, sc: '#3a2a20', se: 5, si: 2, oe: 1.08, ouv: 1.08, nl: -3, ga: 20, dr: 19, bf: 'pleine', fossette: 1, cravate: '#3f5f8a', l: .96, coiffure: C('raie', ['#54392a', '#3f2a1e', '#8a6a50']) },
    /* Bruno Raboteur : la soixantaine, long visage maigre, joues creuses, yeux étroits, sourcils fins, bouche mince */
    'Bruno Raboteur': { m: -9, r: -4, c: 12, age: 2, sc: '#5d5c54', se: 3.4, sl: 26, si: -2, ouv: .74, oe: .94, ec: -1, nez: 'pointu', nl: 8, nb: -1, ga: 17, dr: 15, by: 4, bf: 'mince', cravate: '#27395c', habit: '#30333a', habitO: '#22242a', l: .9, coiffure: C('arriere', ['#b3b2a8', '#8d8c82', '#5d5c54']) },
    /* Marine La Pénible : la cinquantaine, visage large aux pommettes marquées, blonde aux épaules, veste bleu marine */
    'Marine La Pénible': { femme: 1, r: 4, m: 3, q: 2, age: 1, sc: '#8a6a3a', se: 4.2, sl: 28, sb: 3, oe: 1.02, nez: 'rond', nl: -1, ga: 23, dr: 21, bf: 'pleine', levres: '#c9806e', habit: '#27395c', habitO: '#1a2743', chemise: PAL.blanc, sansOreille: true, coiffure: L(214, BLOND) },
    /* Nathalie Arrêtdetravail : la cinquantaine, cheveux châtains mi-courts, sans apprêt, veste simple */
    'Nathalie Arrêtdetravail': { femme: 1, m: -2, c: 2, sc: '#3a2a20', se: 4.8, sl: 27, si: -1, ouv: .92, nez: 'pointu', nl: 2, ga: 18, dr: 17, bf: 'mince', levres: '#c48a78', habit: '#5a5f63', habitO: '#42464a', chemise: '#c6402d', sansOreille: true, coiffure: L(186, CHATAIN) },
    /* François Bientôtprésident : plus de soixante-dix ans, long visage, grand nez busqué, paupières lourdes, poches, bouche tombante, oreilles marquées */
    'François Bientôtprésident': { c: 9, w: 2, age: 3, sc: '#5d5c54', se: 5, sb: -3, paup: 1, poches: 1, incl: 7, nez: 'busque', nl: 12, nb: 1, nw: 2, oreille: 1.14, ga: 21, dr: 18, by: 5, bf: 'tombe', cravate: '#6f4a7a', habit: '#5c5f66', habitO: '#44474d', l: .96, coiffure: C('degarni', ['#a2a196', '#7f7e74', '#5d5c54']) },
    /* Édouard Patience : la cinquantaine, grand et mince, cheveux et barbe courts blancs, costume sombre */
    'Édouard Patience': { m: -6, r: -2, c: 5, age: 1, sc: '#5d5c54', se: 4, sb: 2, oe: .98, nl: 3, ga: 19, dr: 17, by: 2, cravate: '#4a4a55', habit: '#2d3038', habitO: '#20222a', l: .92, barbe: barbe('#d2cfc3', { stries: '#8d8c82' }), coiffure: C('ras', BLANC) },
    /* Nigaud Dupont-Arriéré : la soixantaine, mâchoire carrée, yeux ronds, gros sourcils droits, nez court et large, grande bouche */
    'Nigaud Dupont-Arriéré': { m: 5, r: 2, q: 7, w: 5, c: -2, age: 2, sc: '#26201c', se: 7.4, sl: 32, si: 3, sb: -1, sh: -1, oe: 1.1, ouv: 1.14, ec: 1, nez: 'rond', nl: -5, nw: 4, ga: 25, dr: 23, by: -2, cravate: '#27508c', habit: '#2f3a4f', habitO: '#20293a', coiffure: C('dense', POIVRE) },
    /* Éric Zéronuance : soixante ans passés, sec, visage étroit, front haut, cheveux foncés courts et dégarnis, costume sombre */
    'Éric Zéronuance': { m: -7, r: -3, c: 4, ey: 3, age: 3, sc: '#26201c', se: 5.6, si: -2, sb: 4, ouv: .84, oe: .92, nl: -2, nb: -2, ga: 19, dr: 17, bf: 'mince', cravate: '#3a3a46', habit: '#23232b', habitO: '#16161c', l: .86,
      coiffure: function () { return p('M60,112 C52,98 50,84 54,72 C58,58 68,50 78,48 C72,60 70,78 68,92 C66,100 62,106 60,112 Z', '#3f3a35', 2.4) + p('M78,48 C96,36 124,34 142,44 C136,42 112,40 96,46 C90,48 84,48 78,48 Z', '#3f3a35', 1.8); } }
    ,
    /* --- La France Indignée --- */
    /* Manuel Bombarde : la quarantaine, cheveux courts foncés, barbe courte, teint mat, veste sans cravate */
    'Manuel Bombarde': { teint: 1, m: -2, c: 2, sc: '#26201c', se: 5.6, si: -2, oe: .96, ouv: .9, nl: 2, ga: 19, dr: 18, barbe: barbe('#3a2f28', { h: 182, stries: '#6b5e54' }), habit: '#3a3d46', habitO: '#2a2c33', l: .94, coiffure: C('raie', NOIR) },
    /* Mathilde Panique : la trentaine, longs cheveux foncés raie au milieu, visage rond, veste bordeaux */
    'Mathilde Panique': { femme: 1, r: 2, m: 1, c: -3, sc: '#2c211a', se: 4, sb: 3, oe: 1.1, ouv: 1.08, nez: 'pointu', nl: -3, ga: 20, dr: 19, bf: 'sourit', levres: '#b8604e', habit: '#7a1e24', habitO: '#5a1419', sansOreille: true, coiffure: L(252, BRUN, true) },
    /* Clémence Guérilla : la trentaine, cheveux châtains au carré, regard droit */
    'Clémence Guérilla': { femme: 1, m: -3, c: 1, sc: '#513623', se: 3.8, si: -2, sb: 2, oe: 1.04, nl: 1, ga: 18, dr: 17, levres: '#c07a68', habit: '#5b2b52', habitO: '#42203c', chemise: PAL.blanc, sansOreille: true, coiffure: L(190, CHATAIN, true) },
    /* Éric Coquelicot : plus de soixante ans, cheveux et barbe blancs, écharpe rouge */
    'Éric Coquelicot': { r: 1, m: 1, age: 2, sc: '#8d8c82', se: 5.6, broussaille: 1, oe: .96, nez: 'rond', nl: 2, ga: 19, dr: 18, bf: 'sourit', barbe: barbe('#e4e1d4', { h: 180, stries: '#8d8c82' }), habit: '#3a3f4a', habitO: '#2a2e36', echarpe: PAL.rouge, coiffure: C('degarni', BLANC) },
    /* Louis Boucan : vingt-cinq ans, cheveux foncés bouclés, visage jeune et rond, sans cravate */
    'Louis Boucan': { r: 1, c: -4, sc: '#26201c', se: 4.6, sb: 3, oe: 1.1, ouv: 1.1, nl: -4, nb: -1, ga: 21, dr: 20, bf: 'sourit', habit: '#26305a', habitO: '#1a2244', l: .9, coiffure: C('boucle', NOIR) }
    ,
    /* --- Le Parti Survivant --- */
    /* Olivier Fauteuil : la cinquantaine passée, gris, lunettes carrées, visage plein */
    'Olivier Fauteuil': { r: 1, m: 2, age: 2, sc: '#5d5c54', se: 4.6, oe: .96, nl: 1, ga: 20, dr: 19, bf: 'sourit', cravate: '#7a1e24', lunettes: lunettes('carrees'), coiffure: C('arriere', GRIS) },
    /* Boris Vaudeville : la cinquantaine, brun, barbe courte, sans cravate */
    'Boris Vaudeville': { m: 1, c: 1, age: 1, sc: '#26201c', se: 5.8, sb: 3, ouv: .92, nez: 'busque', nl: 2, ga: 20, dr: 19, bf: 'sourit', barbe: barbe('#4a3a2e', { h: 186, stries: '#7a6250' }), habit: '#26305a', habitO: '#1a2244', coiffure: C('dense', BRUN) },
    /* Anne Hipster : plus de soixante ans, blond cendré au carré, visage fin */
    'Anne Hipster': { femme: 1, r: 1, m: -2, age: 2, sc: '#7a6030', se: 3.6, sb: 4, oe: .98, nez: 'pointu', nl: 0, ga: 19, dr: 18, bf: 'sourit', levres: '#c07a68', habit: '#7a1e24', habitO: '#5a1419', sansOreille: true, coiffure: L(186, BLOND2) },
    /* Carole Dégainée : la cinquantaine, brune au carré, sourcils arqués */
    'Carole Dégainée': { femme: 1, q: 2, age: 1, sc: '#26201c', se: 4.4, sb: 6, si: -1, oe: 1.04, nl: 1, ga: 21, dr: 20, bf: 'pleine', levres: '#b8604e', habit: '#4a4a55', habitO: '#36363f', chemise: PAL.blanc, sansOreille: true, coiffure: L(194, BRUN) },
    /* François Hésitant : la soixantaine passée, dégarni, lunettes rondes, visage rond */
    'François Hésitant': { r: 5, m: 7, w: 6, c: -3, age: 2, sc: '#5d5c54', se: 4.8, si: 3, oe: .92, nez: 'rond', nl: -3, nw: 2, ga: 21, dr: 20, bf: 'sourit', cravate: '#26305a', lunettes: lunettes('rondes'), coiffure: K(GRIS) }
    ,
    /* --- Les Enracinés --- */
    /* Sandrine Rouspète : la cinquantaine, cheveux blancs courts, lunettes rondes, veste verte */
    'Sandrine Rouspète': { femme: 1, r: 1, age: 2, sc: '#8d8c82', se: 4, sb: 5, oe: .98, nez: 'pointu', nl: 1, ga: 20, dr: 19, bf: 'pleine', levres: '#b8604e', habit: '#2e6b45', habitO: '#214f33', lunettes: lunettes('rondes', '#7a1e24'), coiffure: C('courtF', BLANC) },
    /* Yannick Jardinet : la cinquantaine, poivre et sel, traits ouverts, sans cravate */
    'Yannick Jardinet': { m: 2, age: 2, sc: '#3f3c38', se: 5.4, sb: 2, ouv: .9, nl: 2, ga: 21, dr: 20, bf: 'sourit', fossette: 1, habit: '#3a5a48', habitO: '#2a4335', coiffure: C('dense', SEL) },
    /* Cyrielle Châtaigne : moins de quarante ans, longs cheveux châtains */
    'Cyrielle Châtaigne': { femme: 1, m: -1, c: -2, sc: '#513623', se: 4, sb: 3, oe: 1.1, nl: -2, ga: 19, dr: 18, bf: 'sourit', levres: '#c07a68', habit: '#4f7a4a', habitO: '#3a5c36', sansOreille: true, coiffure: L(246, CHATAIN) },
    /* Éric Pédalo : la cinquantaine, mince, bruns ras, sans cravate */
    'Éric Pédalo': { m: -6, r: -2, c: 4, age: 1, creux: 1, sc: '#26201c', se: 4.6, si: -1, ouv: .88, nez: 'pointu', nl: 3, ga: 18, dr: 17, bf: 'mince', habit: '#3d4a3a', habitO: '#2c362a', l: .9, coiffure: C('ras', BRUN) }
    /*SUITE*/
  };
  Object.keys(FICHES).forEach(function (nom) { NOMS[nom] = nom; ajoute(nom, FICHES[nom]); });
  root.Visages = { FICHES: FICHES, NOMS: NOMS, ajoute: ajoute, calvitie: calvitie, chignon: chignon, lunettes: lunettes, GRIS: GRIS, CENDRE: CENDRE };
})(this);

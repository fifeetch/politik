/* Planche d'essai — les autres personnalités, sur la même construction que personnages.js : mêmes yeux, même bouche, même trait,
   même buste. Chaque fiche ne donne que ce qui la distingue : forme du visage, âge, coiffure, barbe, lunettes, peau, tenue.
   Noms parodiques de js/people.js.
   Réglages du visage : r pommettes, m mâchoire, c longueur du menton, w largeur du menton, age 0 à 3, ey hauteur des yeux,
   nl longueur du nez, nb son avancée, nw sa largeur, by hauteur de la bouche, ga et dr sa demi-largeur. */
(function (root) {
  var P = root.Perso, PAL = P.PAL, INK = P.INK, p = P.p, a = P.a, t = P.t, oeil = P.oeil, sourcil = P.sourcil, bouche = P.bouche, goutte = P.goutte, cercle = P.cercle;
  function trait(d, w, c) { return t(d, w).replace('stroke="' + INK + '"', 'stroke="' + c + '"'); }

  /* ---------- La tête ---------- */
  function tete(f, e) {
    var j = e.j, s = '', r = f.r || 0, m = f.m || 0, c = f.c || 0, w = f.w || 0, by = f.by || 0, ey = f.ey || 0;
    var oy = 114 + ey, oy2 = 112 + ey, sy = 98 + ey, sy2 = 96 + ey;
    if (f.dos) s += f.dos();
    // l'oreille, puis le visage
    if (!f.sansOreille) {
      s += p('M58,112 C46,102 38,114 42,130 C45,146 54,156 62,150 Z', PAL.peau);
      s += t('M49,120 C47,128 51,140 56,143', 1.3);
    }
    var bas = 224 + j + c;
    s += p('M62,60 C88,40 140,40 154,74 C158,86 157,94 154,102 C152,110 ' + (156 + r) + ',118 ' + (158 + r) + ',128 C' + (161 + r + m * .4) + ',146 ' + (158 + r + m) + ',160 ' + (153 + r + m) + ',176 C' + (149 + m) + ',' + (194 + j * .7 + c * .5) + ' ' + (142 + m + w) + ',' + (212 + j + c) + ' ' + (126 + w) + ',' + bas +
      ' C' + (112 + w * .4) + ',' + (bas + 8) + ' ' + (96 - w * .4) + ',' + (bas + 4) + ' ' + (84 - w) + ',' + (214 + j + c) + ' C' + (70 - m) + ',' + (198 + j + c * .5) + ' ' + (62 - m) + ',176 ' + (60 - m * .5) + ',158 L58,110 C56,90 56,74 62,60 Z', PAL.peau);
    s += a('M' + (60 - m * .5) + ',158 C' + (62 - m) + ',176 ' + (70 - m) + ',' + (198 + j + c * .5) + ' ' + (84 - w) + ',' + (214 + j + c) + ' C80,194 76,174 76,156 C70,146 64,132 58,112 Z', PAL.peauO);
    if (f.joues) s += a('M84,150 C94,144 104,150 102,160 C96,168 84,164 84,150 Z', f.joues) + a('M146,146 C152,142 158,146 156,154 C152,160 146,156 146,146 Z', f.joues);
    // les rides, selon l'âge
    var age = f.age || 0;
    if (age >= 1) s += t('M94,70 Q118,62 142,70', 1) + t('M84,132 Q98,139 112,131', 1);
    if (age >= 2) s += t('M92,82 Q118,74 146,82', 1.1) + t('M78,114 Q72,112 68,106 M80,122 Q72,124 66,120', 1) + t('M112,158 C98,170 88,182 86,' + (198 + j), 1.3);
    if (age >= 3) s += t('M96,58 Q118,52 138,58', 1) + t('M88,' + (216 + j + c) + ' C100,' + (224 + j + c) + ' 116,' + (224 + j + c) + ' 128,' + (218 + j + c), 1.1) + t('M140,160 C146,170 148,180 146,' + (190 + j), 1.1);
    if (e.rides) s += t('M116,94 L120,84 M126,94 L124,84', 1.4);
    if (e.goutte) s += t('M98,62 Q118,56 138,62', 1.2);
    if (f.barbe) s += f.barbe(j);
    // sourcils, yeux, nez, bouche
    var sc = f.sc || PAL.brunO, se = f.se || 5.2;
    s += sourcil(96, sy, f.sl || 30, e.bi, e.be, se, sc, 1) + sourcil(141, sy2, (f.sl || 30) * .66, e.bi, e.be, se * .84, sc, -1);
    var fe = f.femme ? 1.06 : 1;
    s += oeil(99, oy, 24 * fe * (f.oe || 1), e.ouv * (f.ouv || 1), e.reg, e.regY, 1) + oeil(142, oy2, 16 * fe * (f.oe || 1), e.ouv * (f.ouv || 1), e.reg, e.regY, -1);
    if (f.femme) s += t('M87,' + (oy - 3) + ' L82,' + (oy - 7) + ' M89,' + (oy - 6) + ' L85,' + (oy - 11) + ' M150,' + (oy2 - 4) + ' L154,' + (oy2 - 8), 1.5);
    var nl = f.nl || 0, nb = f.nb || 0, nw = f.nw || 0, tx = 139 + nb, ty = 148 + nl;
    s += t('M122,104 C124,120 ' + (134 + nb) + ',' + (136 + nl * .7) + ' ' + tx + ',' + ty + ' C' + (tx + 2) + ',' + (ty + 8) + ' ' + (tx - 3) + ',' + (ty + 12) + ' ' + (tx - 10) + ',' + (ty + 11) + ' C' + (tx - 14) + ',' + (ty + 15) + ' ' + (tx - 21 - nw) + ',' + (ty + 14) + ' ' + (tx - 24 - nw) + ',' + (ty + 9), f.femme ? 1.8 : 2);
    var ga = f.ga || 21, dr = f.dr || 20, ym = 186 + j * .3 + by, coin = e.bouche === 'assure';
    // le rouge à lèvres passe sous le trait de la bouche
    if (f.levres && e.bouche !== 'colere' && e.bouche !== 'parle') {
      s += a('M' + (121 - ga) + ',' + (ym + (coin ? -5 : 0)) + ' Q' + (121 - ga * .5) + ',' + (ym - 7) + ' 120,' + (ym - 4) + ' Q' + (121 + dr * .5) + ',' + (ym - 7) + ' ' + (121 + dr) + ',' + (ym + (coin ? -2 : 0)) + ' Q' + (121 + dr * .4) + ',' + (ym + 11) + ' 120,' + (ym + 10) + ' Q' + (121 - ga * .5) + ',' + (ym + 11) + ' ' + (121 - ga) + ',' + (ym + (coin ? -5 : 0)) + ' Z', f.levres);
    }
    s += bouche(e.bouche, 121, ym, ga, dr);
    if (f.lunettes) s += f.lunettes(oy, oy2);
    if (f.cheveux) s += f.cheveux(e);
    if (f.boucle) s += cercle(50, 150, 3.6, f.boucle, 1.2);
    if (e.goutte) s += goutte(164, 80, 5) + goutte(52, 94, 4);
    return s;
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
    var fem = !!f.femme;
    P.FICHE[id] = {
      tete: function (e) { return tete(f, e); }, peau: f.peau, peauO: f.peauO,
      corps: fem ? tailleur(f) : costume(f), col: fem ? colTailleur(f) : colCostume(f), geste: function () { return ''; },
      cou: f.cou || (fem ? [76, 148, 150] : [70, 156, 150]), at: f.at || (fem ? [114, 38] : [114, 42]), k: f.k || (fem ? 1.12 : 1.14)
    };
  }

  /* ---------- Les chefs de file ---------- */
  var FICHES = {
    /* Raphaël Grandsmots : la quarantaine, mince, cheveux bruns ondulés un peu longs, chemise ouverte sans cravate */
    grandsmots: {
      m: -4, c: 5, age: 1, sc: '#2c211a', se: 4.6, nl: 4, ga: 20, dr: 18, cou: [74, 152, 150], habit: '#2b2c33', habitO: '#1f1f26', l: .94,
      cheveux: function () {
        return p('M58,126 C42,114 34,88 40,62 C44,30 78,6 116,8 C150,6 174,26 170,54 C170,64 164,72 156,76 C154,66 146,60 136,62 C128,70 114,62 104,68 C92,70 82,80 76,92 C70,106 64,116 58,126 Z', '#3a2a20', 2.6) +
          a('M58,126 C42,114 34,88 40,62 C42,50 48,40 56,32 C52,56 58,80 68,98 C66,108 62,118 58,126 Z', '#281c15') +
          trait('M72,84 C64,58 80,32 110,22 M88,70 C84,50 104,30 132,26 M106,62 C110,48 128,40 154,46 M46,84 C44,70 48,58 54,50', 1.3, '#7a6250');
      }
    },
    /* Gabriel Agité : trente-cinq ans passés, visage plein et lisse, cheveux bruns courts, raie sur le côté, costume bleu et cravate */
    agite: {
      r: 2, m: 2, c: -2, sc: '#3a2a20', se: 5, ga: 20, dr: 19, cravate: '#3f5f8a', l: .96,
      cheveux: function () {
        return p('M60,114 C52,98 50,78 54,60 C60,36 88,22 120,24 C144,26 160,42 160,62 C159,68 157,72 153,74 C142,62 124,56 104,58 C90,60 80,70 74,90 C70,100 64,108 60,114 Z', '#54392a', 2.6) +
          a('M60,114 C52,98 50,78 54,60 C56,50 60,44 66,38 C62,56 64,76 72,90 C68,100 64,108 60,114 Z', '#3f2a1e') +
          trait('M84,62 C90,46 108,36 132,38 M100,58 C110,48 126,46 148,54 M76,74 C70,60 74,46 84,38', 1.2, '#8a6a50');
      }
    },
    /* Bruno Raboteur : la soixantaine, long visage maigre, cheveux gris courts, costume sombre */
    raboteur: {
      m: -8, r: -3, c: 10, age: 2, sc: '#5d5c54', se: 4, sl: 26, nl: 6, ga: 18, dr: 16, by: 3, cou: [74, 148, 150], cravate: '#27395c', habit: '#30333a', habitO: '#22242a', l: .9,
      cheveux: function () {
        return p('M60,112 C52,98 50,80 54,62 C60,38 88,26 118,28 C142,30 158,44 158,62 C150,54 134,50 116,52 C96,54 84,62 76,84 C70,94 64,104 60,112 Z', '#b3b2a8', 2.6) +
          a('M60,112 C52,98 50,80 54,62 C56,52 60,46 66,42 C62,58 66,74 72,88 C68,98 64,106 60,112 Z', '#8d8c82') +
          t('M82,64 C88,50 104,42 128,42 M98,56 C108,48 124,46 146,52', 1.1);
      }
    },
    /* Marine La Pénible : la cinquantaine, visage large aux pommettes marquées, blonde aux épaules, frange de côté, veste bleu marine */
    lapenible: {
      femme: 1, r: 3, m: 3, age: 1, sc: '#8a6a3a', se: 4.2, sl: 28, ga: 22, dr: 20, levres: '#c9806e', habit: '#27395c', habitO: '#1a2743', chemise: PAL.blanc, sansOreille: true,
      dos: function () {
        return p('M58,44 C34,50 22,84 22,120 C20,150 20,178 30,206 C46,216 66,212 82,198 L92,130 L150,130 L160,180 C168,198 180,192 184,174 C188,146 186,112 176,86 C166,56 142,32 106,30 C88,30 72,34 58,44 Z', '#d9b45c', 2.6) +
          a('M58,44 C34,50 22,84 22,120 C20,150 20,178 30,206 C36,210 44,212 52,210 C38,180 36,150 38,118 C40,88 46,64 58,44 Z', '#b8923f') +
          t('M38,110 C34,140 36,176 44,202 M52,100 C50,134 54,170 64,202 M172,100 C178,124 178,152 174,176', 1.2);
      },
      cheveux: function () {
        return p('M60,122 C50,98 52,74 64,58 C80,38 112,30 136,42 C152,50 162,64 162,84 C150,76 138,66 122,60 C112,76 94,84 82,88 C74,98 68,110 60,122 Z', '#e0bd68', 2.6) +
          t('M66,84 C72,62 92,48 118,46 M84,76 C96,66 110,58 120,50 M132,52 C144,58 152,66 156,74', 1.2);
      }
    },
    /* Nathalie Arrêtdetravail : la cinquantaine, cheveux châtains à hauteur de mâchoire, sans apprêt, veste simple */
    arret: {
      femme: 1, m: -2, age: 0, sc: '#3a2a20', se: 4.4, sl: 28, ga: 19, dr: 18, levres: '#c48a78', habit: '#5a5f63', habitO: '#42464a', chemise: '#c6402d', sansOreille: true,
      dos: function () {
        return p('M60,42 C36,48 24,82 26,116 C26,140 28,160 38,178 C52,184 66,178 74,166 L84,120 L150,120 L156,154 C162,168 174,160 178,146 C182,120 180,96 170,78 C160,52 138,34 106,32 C88,32 72,36 60,42 Z', '#5b3e2a', 2.6) +
          trait('M42,96 C38,120 40,150 46,172 M56,88 C54,116 56,146 64,170', 1.2, '#2e2018');
      },
      cheveux: function () {
        return p('M60,124 C52,100 54,76 66,58 C82,40 112,32 134,42 C150,50 160,62 160,80 C150,68 134,60 118,62 C102,64 88,70 80,84 C72,96 66,110 60,124 Z', '#6b4a33', 2.6) +
          trait('M70,76 C78,60 96,50 118,48 M84,72 C96,62 114,56 134,52', 1.2, '#2e2018');
      }
    },
    /* François Bientôtprésident : plus de soixante-dix ans, long visage, tempes dégarnies, cheveux gris, costume gris, cravate */
    bientot: {
      c: 8, age: 3, sc: '#5d5c54', se: 5.4, nl: 8, nb: 4, nw: 2, oe: .96, ouv: .9, ga: 20, dr: 18, by: 3, cravate: '#6f4a7a', habit: '#5c5f66', habitO: '#44474d', l: .96,
      cheveux: function () {
        return p('M60,118 C50,104 44,82 50,62 C58,38 90,28 120,32 C140,34 154,46 158,64 C148,54 134,48 118,48 C106,48 94,50 86,58 C78,70 72,86 68,98 C66,106 62,112 60,118 Z', '#a2a196', 2.6) +
          a('M60,118 C50,104 44,82 50,62 C52,54 56,48 62,44 C58,62 62,84 68,98 C66,106 62,112 60,118 Z', '#7f7e74') +
          t('M78,60 C82,48 96,42 116,40 M64,76 C60,62 66,52 76,46', 1.1);
      }
    },
    /* Édouard Patience : la cinquantaine, grand et mince, cheveux et barbe courts blancs, costume sombre */
    patience: {
      m: -6, r: -2, c: 5, age: 1, sc: '#5d5c54', se: 4.6, nl: 3, ga: 19, dr: 17, by: 2, cou: [74, 150, 150], cravate: '#4a4a55', habit: '#2d3038', habitO: '#20222a', l: .92,
      barbe: function (j) {
        return p('M60,160 C66,172 78,184 92,186 C100,182 108,176 120,176 C132,176 142,178 150,172 C154,182 148,196 142,' + (208 + j) + ' C136,' + (222 + j) + ' 124,' + (231 + j) + ' 108,' + (233 + j) + ' C92,' + (233 + j) + ' 80,' + (216 + j) + ' 70,196 C64,184 60,172 60,160 Z', '#d2cfc3', 1.5) +
          t('M76,190 l3,6 M92,206 l2,6 M112,218 l1,6 M134,204 l-2,6 M146,186 l-2,6', .8);
      },
      cheveux: function () {
        return p('M60,110 C54,96 52,78 56,62 C62,40 90,30 118,32 C140,34 156,48 156,66 C146,58 130,52 112,54 C96,56 84,64 78,80 C72,90 66,102 60,110 Z', '#e4e1d4', 2.6) +
          a('M60,110 C54,96 52,78 56,62 C58,54 62,48 66,44 C62,60 66,76 72,88 C68,96 64,104 60,110 Z', '#bdbaad');
      }
    },
    /* Nigaud Dupont-Arriéré : la soixantaine, visage carré, cheveux poivre et sel plaqués de côté, costume, cravate bleue */
    dupont: {
      m: 3, r: 1, age: 2, sc: '#26201c', se: 6, nw: 4, oe: 1.04, ga: 21, dr: 20, cravate: '#27508c', habit: '#2f3a4f', habitO: '#20293a',
      cheveux: function () {
        return p('M60,116 C50,100 46,78 52,58 C60,34 92,22 122,26 C146,28 160,44 160,66 C150,58 136,54 118,56 C100,58 86,66 78,84 C72,96 66,106 60,116 Z', '#5e5a55', 2.6) +
          a('M60,116 C50,100 46,78 52,58 C54,50 60,42 66,38 C60,58 64,78 72,92 C68,102 64,110 60,116 Z', '#3f3c38') +
          trait('M84,62 C92,46 110,38 136,40 M100,56 C112,48 128,48 150,56', 1.2, '#a09b94');
      }
    },
    /* Éric Zéronuance : soixante ans passés, sec, visage étroit, front haut, cheveux foncés courts et dégarnis, costume sombre */
    zero: {
      m: -7, r: -3, c: 4, ey: 3, age: 3, sc: '#26201c', se: 6, nl: -2, nb: -2, oe: .92, cou: [76, 148, 150], ga: 19, dr: 17, cravate: '#3a3a46', habit: '#23232b', habitO: '#16161c', l: .86, ouv: .86,
      cheveux: function () {
        return p('M60,112 C52,98 50,84 54,72 C58,58 68,50 78,48 C72,60 70,78 68,92 C66,100 62,106 60,112 Z', '#3f3a35', 2.4) +
          p('M78,48 C96,36 124,34 142,44 C136,42 112,40 96,46 C90,48 84,48 78,48 Z', '#3f3a35', 1.8);
      }
    }
  };
  Object.keys(FICHES).forEach(function (id) { ajoute(id, FICHES[id]); });
  root.Visages = { FICHES: FICHES, ajoute: ajoute };
})(this);

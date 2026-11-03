/* Planche d'essai — les personnages, en ligne claire. Dessinés à la main en tracés SVG, trois quarts face.
   Tête : repère local d'environ 200 × 260, regard vers la droite. Trait : 2,6 pour les contours, 1,5 pour les détails.
   Expressions : assure, colere, inquiet, parle, neutre. Personnalités inventées, d'après js/people.js. */
(function (root) {
  var INK = '#1d1713';
  var PAL = {
    papier: '#f4e8cf', blanc: '#fdf8ea', peau: '#efc39b', peauO: '#d79c72', peauF: '#b87b52', peauF2: '#94603f',
    marine: '#27395c', marineO: '#1a2743', rouge: '#c6402d', rougeO: '#96291d', ocre: '#dfa93c', ocreO: '#b98421',
    vert: '#5d7f58', vertO: '#435f42', gris: '#8d8d84', grisC: '#c9c5b4', grisO: '#5d5c54', brun: '#6d4a2f', brunO: '#4a3120',
    creme: '#f2dfb4', bleu: '#6f9fb2', bleuO: '#477a90', noir: '#26201c'
  };
  var K = 1, uid = 0;

  function p(d, fill, w, extra) { return '<path d="' + d + '" fill="' + (fill || 'none') + '" stroke="' + INK + '" stroke-width="' + ((w == null ? 2.6 : w) * K).toFixed(2) + '"' + (extra || '') + '/>'; }
  function a(d, fill) { return '<path d="' + d + '" fill="' + fill + '"/>'; }   // aplat sans trait
  function t(d, w) { return p(d, 'none', w == null ? 1.5 : w); }                 // trait de détail

  /* ---------- Les traits du visage ---------- */
  function oeil(x, y, w, ouv, reg, regY, sens, peau) {
    var h = 8.2 * ouv * (w / 24), top = y - h * 1.35, bot = y + h * 0.62, id = 'oe' + (++uid);
    var b = w * (sens > 0 ? 0.12 : -0.12);
    var almond = 'M' + (x - w / 2) + ',' + (y + 1.2) + ' C' + (x - w * 0.26 + b) + ',' + top + ' ' + (x + w * 0.2 + b) + ',' + top + ' ' + (x + w / 2) + ',' + (y + 1.6) +
      ' C' + (x + w * 0.2) + ',' + bot + ' ' + (x - w * 0.24) + ',' + bot + ' ' + (x - w / 2) + ',' + (y + 1.2) + ' Z';
    var r = w * 0.2;
    var s = '<clipPath id="' + id + '"><path d="' + almond + '"/></clipPath>' +
      a(almond, PAL.blanc) +
      '<g clip-path="url(#' + id + ')"><circle cx="' + (x + (reg || 0) * w * 0.26) + '" cy="' + (y - h * 0.28 + (regY || 0)) + '" r="' + r + '" fill="' + INK + '"/></g>';
    // paupière haute, épaisse ; paupière basse et pli, fins
    s += p('M' + (x - w / 2 - 1) + ',' + (y + 1.6) + ' C' + (x - w * 0.26 + b) + ',' + top + ' ' + (x + w * 0.2 + b) + ',' + top + ' ' + (x + w / 2) + ',' + (y + 1.6), 'none', 2.5);
    s += t('M' + (x - w * 0.3) + ',' + (bot - 1) + ' Q' + x + ',' + (bot + 1.5) + ' ' + (x + w * 0.36) + ',' + (y + 2.6), 1.2);
    s += t('M' + (x - w * 0.42) + ',' + (top - 1.2) + ' Q' + (x + b) + ',' + (top - 5.5) + ' ' + (x + w * 0.42) + ',' + (top - 0.4), 1.1);
    return s;
  }
  /* sourcil : un aplat effilé, épais côté nez. inter = montée du côté du nez, exter = montée du côté de la tempe */
  function sourcil(x, y, w, inter, exter, ep, coul, sens) {
    var ix = x + sens * w / 2, ex = x - sens * w / 2, iy = y - inter, ey = y - exter, my = (iy + ey) / 2 - 3.4;
    return p('M' + ix + ',' + iy + ' Q' + x + ',' + (my - ep * 0.5) + ' ' + ex + ',' + ey + ' Q' + x + ',' + (my + ep * 0.7) + ' ' + ix + ',' + (iy + ep) + ' Z', coul, 1);
  }
  function bouche(forme, cx, y, ga, dr) {
    var s = '';
    if (forme === 'colere') {
      s += p('M' + (cx - ga) + ',' + (y - 2) + ' C' + (cx - ga * 0.5) + ',' + (y - 9) + ' ' + (cx + dr * 0.5) + ',' + (y - 9) + ' ' + (cx + dr) + ',' + (y - 3) +
        ' C' + (cx + dr + 1) + ',' + (y + 10) + ' ' + (cx + dr * 0.5) + ',' + (y + 30) + ' ' + (cx - 1) + ',' + (y + 31) + ' C' + (cx - ga * 0.6) + ',' + (y + 31) + ' ' + (cx - ga - 2) + ',' + (y + 13) + ' ' + (cx - ga) + ',' + (y - 2) + ' Z', '#4b1712', 2.2);
      s += p('M' + (cx - ga + 3) + ',' + (y - 2) + ' C' + (cx - ga * 0.4) + ',' + (y - 7) + ' ' + (cx + dr * 0.4) + ',' + (y - 7) + ' ' + (cx + dr - 2) + ',' + (y - 2) + ' L' + (cx + dr - 4) + ',' + (y + 6) + ' Q' + cx + ',' + (y + 2.4) + ' ' + (cx - ga + 6) + ',' + (y + 7) + ' Z', PAL.blanc, 1.2);
      s += a('M' + (cx - ga * 0.5) + ',' + (y + 26) + ' Q' + cx + ',' + (y + 14) + ' ' + (cx + dr * 0.55) + ',' + (y + 24) + ' Q' + cx + ',' + (y + 33) + ' ' + (cx - ga * 0.5) + ',' + (y + 26) + ' Z', PAL.rouge);
    } else if (forme === 'parle') {
      s += p('M' + (cx - ga * 0.8) + ',' + y + ' C' + (cx - ga * 0.3) + ',' + (y - 4) + ' ' + (cx + dr * 0.4) + ',' + (y - 4) + ' ' + (cx + dr * 0.85) + ',' + (y - 1) +
        ' C' + (cx + dr * 0.6) + ',' + (y + 13) + ' ' + (cx - ga * 0.4) + ',' + (y + 14) + ' ' + (cx - ga * 0.8) + ',' + y + ' Z', '#4b1712', 2);
      s += a('M' + (cx - ga * 0.6) + ',' + y + ' Q' + cx + ',' + (y - 2.6) + ' ' + (cx + dr * 0.66) + ',' + (y - 0.8) + ' L' + (cx + dr * 0.56) + ',' + (y + 3) + ' Q' + cx + ',' + (y + 1) + ' ' + (cx - ga * 0.5) + ',' + (y + 3.6) + ' Z', PAL.blanc);
      s += t('M' + (cx - ga * 0.3) + ',' + (y + 20) + ' Q' + cx + ',' + (y + 22) + ' ' + (cx + dr * 0.4) + ',' + (y + 19), 1.3);
    } else if (forme === 'inquiet') {
      s += p('M' + (cx - ga) + ',' + (y + 5) + ' Q' + (cx - ga * 0.55) + ',' + (y - 3) + ' ' + (cx - 2) + ',' + y + ' Q' + (cx + dr * 0.5) + ',' + (y + 4) + ' ' + (cx + dr) + ',' + (y + 2), 'none', 2.2);
      s += t('M' + (cx - ga * 0.34) + ',' + (y + 11) + ' Q' + cx + ',' + (y + 13) + ' ' + (cx + dr * 0.45) + ',' + (y + 10), 1.3);
    } else if (forme === 'assure') {
      s += p('M' + (cx - ga - 4) + ',' + (y - 7) + ' Q' + (cx - ga * 0.4) + ',' + (y + 3.6) + ' ' + cx + ',' + (y + 2) + ' Q' + (cx + dr * 0.6) + ',' + (y + 1) + ' ' + (cx + dr) + ',' + (y - 2), 'none', 2.2);
      s += t('M' + (cx - ga - 7) + ',' + (y - 8.5) + ' Q' + (cx - ga - 5.6) + ',' + (y - 5) + ' ' + (cx - ga - 2) + ',' + (y - 3.6), 1.4);
      s += t('M' + (cx - ga * 0.3) + ',' + (y + 12) + ' Q' + cx + ',' + (y + 14) + ' ' + (cx + dr * 0.45) + ',' + (y + 11), 1.3);
    } else {
      s += p('M' + (cx - ga) + ',' + y + ' Q' + (cx - 2) + ',' + (y + 2.6) + ' ' + (cx + dr) + ',' + (y - 1), 'none', 2.2);
      s += t('M' + (cx - ga * 0.34) + ',' + (y + 11) + ' Q' + cx + ',' + (y + 13) + ' ' + (cx + dr * 0.45) + ',' + (y + 10), 1.3);
    }
    return s;
  }
  function goutte(x, y, r) { return p('M' + x + ',' + (y - r * 1.6) + ' Q' + (x + r * 1.1) + ',' + y + ' ' + x + ',' + (y + r) + ' Q' + (x - r * 1.1) + ',' + y + ' ' + x + ',' + (y - r * 1.6) + ' Z', '#bfe0e6', 1.3); }

  /* réglages d'expression, repris par chaque tête */
  var EXPR = {
    neutre: { ouv: 1, reg: 0.35, regY: 0, bi: 0, be: 0, bouche: 'ferme', j: 0 },
    assure: { ouv: 0.86, reg: 0.5, regY: 0, bi: 1, be: 4, bouche: 'assure', j: 0 },
    colere: { ouv: 1.05, reg: 0.5, regY: 0.5, bi: -8, be: 6, bouche: 'colere', j: 16, rides: 1 },
    inquiet: { ouv: 1.14, reg: -0.1, regY: 1.2, bi: 9, be: -5, bouche: 'inquiet', j: 2, goutte: 1 },
    parle: { ouv: 1, reg: 0.5, regY: 0, bi: 3, be: 2, bouche: 'parle', j: 5 }
  };


  function cercle(x, y, r, f, w) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '" stroke="' + INK + '" stroke-width="' + ((w == null ? 1.6 : w) * K).toFixed(2) + '"/>'; }

  /* ---------- Les têtes ---------- */

  /* Jean-Lutte Mégaphone : massif, bajoues, moustache tombante, grands sourcils en broussaille */
  function teteMegaphone(e) {
    var j = e.j, s = '';
    s += p('M84,44 C54,30 18,50 10,94 C4,126 10,164 26,184 C34,192 44,188 48,174 L52,92 Z', PAL.grisC);
    s += a('M10,94 C4,126 10,164 26,184 C34,192 44,188 48,174 L46,150 C34,150 22,128 22,96 C22,80 28,64 36,54 C22,62 13,78 10,94 Z', '#a9a594');
    s += t('M30,70 C22,96 22,128 30,160 M42,62 C32,88 32,120 38,152', 1.2);
    s += p('M46,118 C34,106 24,116 28,134 C31,152 40,166 50,160 Z', PAL.peau);
    s += a('M28,134 C31,152 40,166 50,160 L48,146 C40,146 34,140 28,134 Z', PAL.peauO);
    s += t('M35,124 C32,130 37,146 44,150 M37,126 C42,128 42,134 40,138', 1.3);
    // visage large, bajoues marquées
    s += p('M60,58 C88,26 144,26 162,70 C167,84 167,92 163,102 C161,110 165,118 168,130 C173,150 171,166 166,182 C' + 163 + ',' + (200 + j * 0.6) + ' ' + 150 + ',' + (220 + j) + ' ' + 126 + ',' + (232 + j) + ' C' + 108 + ',' + (240 + j) + ' ' + 86 + ',' + (238 + j) + ' ' + 72 + ',' + (226 + j) + ' C52,' + (212 + j) + ' 44,192 44,166 L46,120 C44,96 48,74 60,58 Z', PAL.peau);
    s += a('M44,166 C44,192 52,' + (212 + j) + ' 72,' + (226 + j) + ' C72,' + (206 + j) + ' 66,184 66,158 C60,146 54,132 46,120 Z', PAL.peauO);
    s += p('M60,58 C66,44 80,38 94,38 C82,48 72,64 68,84 C64,92 56,100 50,114 C46,92 50,74 60,58 Z', PAL.grisC);
    s += t('M60,70 C56,80 54,90 52,100 M70,56 C64,66 60,78 58,90', 1.1);
    s += t('M92,62 Q118,54 146,64 M86,75 Q116,67 150,77', 1.2);
    if (e.rides) s += t('M122,96 L127,83 M135,96 L133,83', 1.6);
    if (e.goutte) s += t('M98,50 Q118,44 138,50', 1.2);
    s += sourcil(96, 98, 40, e.bi, e.be, 11, PAL.grisO, 1) + sourcil(151, 96, 25, e.bi, e.be, 8.5, PAL.grisO, -1);
    s += oeil(99, 116, 25, e.ouv, e.reg, e.regY, 1) + oeil(150, 114, 17, e.ouv, e.reg, e.regY, -1);
    s += t('M84,129 Q98,137 112,129 M141,127 Q150,132 159,126', 1.1);
    s += t('M128,104 C129,120 144,136 151,150 C155,162 147,169 138,167 C134,174 121,172 117,165 C114,158 118,152 123,151', 2.3);
    s += t('M132,164 Q136,162 141,165', 1.3);
    s += t('M110,160 C94,174 82,186 78,' + (204 + j), 1.5);
    s += t('M86,' + (222 + j) + ' C100,' + (230 + j) + ' 118,' + (228 + j) + ' 128,' + (222 + j), 1.2);
    s += bouche(e.bouche, 125, 193 + j * 0.2, 28, 25);
    var dr = e.bouche === 'colere' ? -5 : e.bouche === 'assure' ? -9 : 0;
    if (e.bouche === 'assure') s += t('M82,136 Q72,138 66,132 M84,142 Q76,148 68,146 M160,136 Q166,134 170,128', 1.2);
    s += p('M125,170 C114,165 94,173 88,' + (190 + dr) + ' C85,' + (200 + dr) + ' 84,' + (208 + dr) + ' 86,' + (216 + dr) + ' C93,' + (202 + dr) + ' 108,' + (191 + dr) + ' 127,' + (187 + dr * 0.5) + ' C138,' + (191 + dr) + ' 150,' + (197 + dr) + ' 159,' + (209 + dr) + ' C163,' + (197 + dr) + ' 157,180 148,172 C141,166 131,166 125,170 Z', PAL.grisC, 2.2);
    s += a('M86,' + (216 + dr) + ' C93,' + (202 + dr) + ' 108,' + (191 + dr) + ' 127,' + (187 + dr * 0.5) + ' L126,180 C110,184 94,194 86,' + (216 + dr) + ' Z', '#a9a594');
    s += t('M104,180 L98,194 M114,176 L108,190 M136,176 L142,190 M146,180 L150,194', 1.1);
    if (e.goutte) s += goutte(174, 70, 5.5) + goutte(38, 92, 4.5) + goutte(182, 96, 3.6);
    return s;
  }

  /* Jordan Brushing : jeune, mince, menton volontaire, banane parfaite */
  function teteBrushing(e) {
    var j = e.j, s = '';
    s += p('M58,112 C46,102 38,114 42,130 C45,146 54,156 62,150 Z', PAL.peau);
    s += t('M49,120 C47,128 51,140 56,143', 1.3);
    s += p('M62,60 C88,40 140,40 154,74 C158,86 157,94 154,102 C152,110 156,118 158,128 C161,146 158,160 153,176 C' + 149 + ',' + (194 + j * 0.7) + ' ' + 142 + ',' + (212 + j) + ' ' + 126 + ',' + (224 + j) + ' C' + 112 + ',' + (232 + j) + ' ' + 96 + ',' + (228 + j) + ' ' + 84 + ',' + (214 + j) + ' C70,' + (198 + j) + ' 62,176 60,158 L58,110 C56,90 56,74 62,60 Z', PAL.peau);
    s += a('M60,158 C62,176 70,' + (198 + j) + ' 84,' + (214 + j) + ' C80,194 76,174 76,156 C70,146 64,132 58,112 Z', PAL.peauO);
    s += p('M60,112 C50,92 42,72 46,48 C50,18 84,-4 124,-4 C154,-4 178,8 182,28 C184,42 174,54 160,58 C148,62 132,60 116,62 C98,64 84,70 76,82 C70,92 66,102 62,114 Z', PAL.ocre, 2.6);
    s += a('M60,112 C50,92 42,72 46,48 C48,38 54,28 62,20 C58,44 62,64 72,84 C68,92 64,102 62,114 Z', PAL.ocreO);
    s += a('M84,66 C100,52 130,48 172,50 C166,56 158,58 150,60 C132,60 104,62 84,66 Z', PAL.ocreO);
    s += t('M72,62 C84,28 120,10 170,22 M82,58 C96,36 124,22 174,32 M92,58 C106,44 130,36 172,42 M66,50 C74,24 96,8 126,5', 1.3);
    s += sourcil(96, 98, 30, e.bi, e.be, 5.6, PAL.brun, 1) + sourcil(141, 96, 20, e.bi, e.be, 4.6, PAL.brun, -1);
    s += oeil(99, 114, 24, e.ouv, e.reg, e.regY, 1) + oeil(142, 112, 16, e.ouv, e.reg, e.regY, -1);
    s += t('M122,104 C124,120 134,136 139,148 C141,156 136,160 129,159 C125,163 118,162 115,157', 2);
    if (e.rides) s += t('M116,94 L120,84 M126,94 L124,84', 1.4);
    s += bouche(e.bouche, 121, 186 + j * 0.3, 21, 20);
    s += t('M124,' + (214 + j) + ' Q130,' + (216 + j) + ' 136,' + (211 + j), 1.2);
    if (e.goutte) s += goutte(162, 78, 5) + goutte(50, 92, 4);
    return s;
  }

  /* Élisabeth Bornée : anguleuse, cheveux gris acier coupés court, grandes lunettes rouges, bouche pincée */
  function teteBornee(e) {
    var j = e.j, s = '', e2 = Object.assign({}, e);
    s += p('M86,30 C56,26 34,48 32,84 C30,112 34,134 42,146 C50,152 58,146 60,132 L66,70 Z', PAL.gris);
    s += t('M44,66 C38,88 38,112 42,134 M54,54 C48,76 46,104 48,126', 1.1);
    s += p('M60,116 C50,108 44,118 47,132 C50,146 56,152 63,148 Z', PAL.peau);
    s += p('M66,64 C90,36 142,38 154,76 C158,88 157,96 154,104 C152,112 155,120 156,130 C158,150 150,172 138,192 C' + 130 + ',' + (208 + j) + ' ' + 116 + ',' + (224 + j) + ' ' + 104 + ',' + (224 + j) + ' C' + 92 + ',' + (224 + j) + ' 76,206 68,182 C62,164 60,140 60,116 C60,96 60,78 66,64 Z', PAL.peau);
    s += a('M60,116 C60,140 62,164 68,182 C74,202 84,216 96,222 C84,196 78,172 80,150 C72,142 66,130 60,116 Z', PAL.peauO);
    // la coupe courte, plaquée, frange oblique
    s += p('M62,120 C54,92 54,62 72,44 C94,20 140,22 158,50 C164,62 164,74 160,84 C146,66 118,58 92,70 C78,78 70,96 66,120 Z', PAL.gris, 2.6);
    s += a('M62,120 C54,92 54,62 72,44 C78,38 84,34 92,30 C76,48 70,70 74,88 C70,96 68,108 66,120 Z', PAL.grisO);
    s += t('M86,60 C104,42 132,40 154,56 M96,62 C112,50 134,50 156,66 M76,76 C84,56 98,42 118,34', 1.2);
    s += sourcil(98, 92, 30, e.bi, e.be, 4.4, PAL.grisO, 1) + sourcil(141, 92, 19, e.bi, e.be, 3.8, PAL.grisO, -1);
    s += oeil(99, 111, 22, e.ouv * 0.92, e.reg, e.regY, 1) + oeil(141, 110, 15, e.ouv * 0.92, e.reg, e.regY, -1);
    // lunettes rouges
    s += p('M78,98 L119,96 L118,120 Q98,127 82,122 Z', 'none', 3.4).replace('stroke="' + INK + '"', 'stroke="' + PAL.rouge + '"');
    s += p('M128,96 L156,95 L153,118 Q140,124 129,119 Z', 'none', 3.4).replace('stroke="' + INK + '"', 'stroke="' + PAL.rouge + '"');
    s += t('M78,98 L119,96 L118,120 Q98,127 82,122 Z M128,96 L156,95 L153,118 Q140,124 129,119 Z', 0.9);
    s += p('M119,102 L128,101', 'none', 2.8).replace('stroke="' + INK + '"', 'stroke="' + PAL.rouge + '"');
    s += p('M78,100 L58,104', 'none', 3).replace('stroke="' + INK + '"', 'stroke="' + PAL.rouge + '"');
    s += t('M124,102 C125,120 134,136 138,148 C140,155 134,158 128,157 C124,161 118,160 116,155', 2);
    s += t('M104,160 C96,168 92,176 92,184', 1.2);
    s += bouche(e.bouche, 120, 182 + j * 0.3, 18, 15);
    if (e.goutte) s += goutte(164, 70, 5);
    return s;
  }

  /* Marine Tournesol : visage rond, taches de rousseur, grande crinière rousse bouclée */
  function teteTournesol(e) {
    var j = e.j, s = '';
    // crinière, derrière : grosses boucles, silhouette en soleil
    var boucles = 'M60,40 C46,6 92,-16 116,6 C140,-14 182,4 176,36 C204,44 204,84 186,96 C204,118 192,152 170,152 L160,120 L60,120 L40,190 C14,198 -12,172 2,146 C-18,128 -12,92 10,86 C0,58 28,30 60,40 Z';
    s += p(boucles, '#b5552a', 2.6);
    s += a('M2,146 C-18,128 -12,92 10,86 C14,104 16,130 26,146 C30,162 34,176 40,190 C14,198 -12,172 2,146 Z', '#8d3e1c');
    s += t('M20,110 C14,120 18,132 28,132 M12,160 C18,152 30,156 28,166 M26,60 C20,70 28,82 38,76 M186,62 C192,70 186,82 176,80 M84,14 C76,20 78,32 88,32 M138,10 C148,14 148,26 138,28', 1.5);
    s += p('M62,116 C52,108 46,118 49,132 C52,146 58,154 66,150 Z', PAL.peau);
    s += p('M64,64 C90,38 142,38 158,76 C164,90 164,104 162,120 C162,150 154,178 136,200 C' + 124 + ',' + (214 + j) + ' ' + 104 + ',' + (216 + j) + ' ' + 90 + ',' + (204 + j) + ' C72,188 62,156 62,120 C60,96 58,78 64,64 Z', PAL.peau);
    s += a('M62,120 C62,156 72,188 90,' + (204 + j) + ' C86,184 80,166 80,148 C74,140 68,130 62,120 Z', PAL.peauO);
    // boucles sur le front
    s += p('M60,118 C50,104 52,84 62,76 C54,60 72,44 88,50 C94,34 122,32 132,48 C146,40 164,56 158,74 C150,62 136,58 124,62 C112,66 98,62 88,68 C78,74 72,88 74,98 C70,104 66,110 62,120 Z', '#b5552a', 2.6);
    s += t('M72,62 C78,56 88,58 88,66 M104,44 C112,40 122,44 122,54 M136,50 C146,50 152,58 150,66 M60,92 C64,86 72,86 74,92', 1.4);
    s += sourcil(100, 96, 28, e.bi, e.be, 4.2, '#8d3e1c', 1) + sourcil(144, 95, 18, e.bi, e.be, 3.6, '#8d3e1c', -1);
    s += oeil(102, 114, 25, e.ouv, e.reg, e.regY, 1) + oeil(146, 112, 17, e.ouv, e.reg, e.regY, -1);
    s += p('M90,110 L86,106 M93,107 L90,102', 'none', 1.5);
    s += t('M127,106 C128,122 136,136 140,146 C142,153 136,157 130,155 C126,159 120,158 118,153', 2);
    // taches de rousseur
    [[92, 136], [100, 142], [108, 136], [86, 146], [146, 134], [152, 140], [140, 142]].forEach(function (q) { s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (1.2 * K) + '" fill="#a9613a"/>'; });
    s += bouche(e.bouche, 124, 176 + j * 0.3, 22, 20);
    if (e.goutte) s += goutte(168, 76, 5.5) + goutte(172, 102, 4) + goutte(58, 96, 4.5);
    return s;
  }

  /* Fabien Rillettes : tout rond, joues rouges, casquette, double menton */
  function teteRillettes(e) {
    var j = e.j, s = '';
    s += p('M40,120 C26,108 18,124 22,142 C26,158 34,166 44,160 Z', PAL.peau);
    s += t('M30,128 C27,136 32,150 38,152', 1.3);
    s += p('M44,84 C52,52 148,48 172,88 C180,104 182,130 180,154 C178,186 162,' + (216 + j) + ' 118,' + (224 + j) + ' C76,' + (226 + j) + ' 44,202 38,160 C34,132 36,104 44,84 Z', PAL.peau);
    s += a('M38,160 C44,202 76,' + (226 + j) + ' 110,' + (224 + j) + ' C76,212 60,182 58,150 C50,140 44,130 40,118 Z', PAL.peauO);
    // double menton
    s += t('M72,' + (214 + j) + ' C92,' + (242 + j) + ' 140,' + (242 + j) + ' 162,' + (204 + j), 2.2);
    s += t('M94,' + (208 + j) + ' Q116,' + (216 + j) + ' 138,' + (206 + j), 1.3);
    // joues rouges, aplats
    s += a('M80,146 C90,140 102,146 100,156 C94,164 80,160 80,146 Z', '#e8ab86') + a('M156,146 C164,140 172,146 170,154 C166,162 156,158 156,146 Z', '#e8ab86');
    s += t('M84,150 l6,4 M90,148 l6,4 M160,150 l5,3', 1);
    // casquette de velours
    s += p('M34,92 C22,50 66,8 120,10 C164,12 190,48 182,80 C172,70 150,62 112,62 C86,62 54,72 34,92 Z', PAL.brun, 2.6);
    s += a('M34,92 C22,50 66,8 120,10 C96,20 66,42 56,76 Z', PAL.brunO);
    s += p('M110,60 C146,56 186,62 206,84 C210,92 202,96 192,94 C170,84 138,76 106,76 C102,70 104,64 110,60 Z', PAL.brunO, 2.6);
    s += t('M72,44 C84,34 100,26 120,22 M90,50 C104,40 124,34 148,34 M112,56 C126,48 146,46 168,52', 1.1);
    s += sourcil(100, 106, 28, e.bi, e.be, 6.2, PAL.brunO, 1) + sourcil(150, 106, 20, e.bi, e.be, 5.4, PAL.brunO, -1);
    s += oeil(102, 122, 22, e.ouv * 0.9, e.reg, e.regY, 1) + oeil(152, 120, 15, e.ouv * 0.9, e.reg, e.regY, -1);
    // nez rond et rouge
    s += t('M130,126 C132,136 144,146 148,156 C150,166 140,170 132,167 C128,172 118,170 116,163 C114,158 118,153 122,152', 2.3) + a('M133,150 C140,150 146,156 145,162 C142,166 134,166 131,160 Z', '#e8ab86');
    s += bouche(e.bouche, 128, 184 + j * 0.3, 26, 26);
    if (e.goutte) s += goutte(184, 88, 5) + goutte(30, 100, 4);
    return s;
  }

  /* La journaliste : carré noir, regard droit, boucles d'oreilles */
  function teteJournaliste(e) {
    var j = e.j, s = '';
    s += p('M90,28 C44,24 22,70 24,122 C24,150 22,176 30,196 C42,206 60,204 74,194 L60,90 Z', PAL.noir);
    s += p('M66,64 C90,38 142,38 156,76 C160,88 159,96 156,104 C154,112 157,120 158,130 C160,150 152,174 138,194 C' + 128 + ',' + (210 + j) + ' ' + 112 + ',' + (222 + j) + ' ' + 100 + ',' + (218 + j) + ' C84,212 68,188 62,160 C58,140 58,110 60,96 C60,82 62,72 66,64 Z', PAL.peau);
    s += a('M60,96 C58,110 58,140 62,160 C68,188 84,212 96,218 C84,192 78,170 80,148 C72,132 64,114 60,96 Z', PAL.peauO);
    s += p('M60,122 C50,92 50,56 80,38 C108,22 146,32 158,62 C162,72 160,80 156,84 C150,70 134,58 112,62 C90,66 76,90 72,126 C70,150 72,176 74,194 L60,198 C60,172 62,150 60,122 Z', PAL.noir);
    s += p('M60,154 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0', PAL.ocre, 1.4);
    s += t('M86,50 C100,40 124,36 144,48', 1).replace('stroke="' + INK + '"', 'stroke="#6b5e54"');
    s += sourcil(101, 96, 26, e.bi, e.be, 3.8, PAL.noir, 1) + sourcil(143, 95, 17, e.bi, e.be, 3.4, PAL.noir, -1);
    s += oeil(102, 113, 23, e.ouv, e.reg, e.regY, 1) + oeil(144, 112, 16, e.ouv, e.reg, e.regY, -1);
    s += t('M126,104 C127,120 136,136 140,146 C142,152 136,156 130,154 C126,158 120,157 118,152', 1.9);
    s += bouche(e.bouche, 122, 180 + j * 0.3, 19, 17);
    return s;
  }

  /* Le matinalier : barbe poivre et sel, lunettes rondes, front haut */
  function teteMatinalier(e) {
    var j = e.j, s = '';
    s += p('M78,40 C52,40 36,62 34,92 C32,112 36,132 44,146 L62,120 L66,70 Z', PAL.grisO);
    s += p('M58,116 C46,108 40,120 44,134 C47,148 54,156 62,150 Z', PAL.peau);
    s += t('M49,124 C47,132 51,142 56,146', 1.3);
    s += p('M64,60 C90,34 144,36 158,76 C162,88 161,96 158,104 C156,112 160,120 161,130 C164,150 160,174 148,196 C' + 138 + ',' + (216 + j) + ' ' + 112 + ',' + (232 + j) + ' ' + 88 + ',' + (216 + j) + ' C70,204 60,170 60,120 C58,96 58,74 64,60 Z', PAL.peau);
    s += a('M60,120 C60,170 70,204 88,' + (216 + j) + ' L82,156 C74,144 66,132 60,120 Z', PAL.peauO);
    s += p('M60,136 C66,158 76,158 90,160 C104,162 114,166 134,164 C146,162 156,158 161,146 C164,160 158,182 148,196 C138,' + (216 + j) + ' 112,' + (232 + j) + ' 88,' + (216 + j) + ' C72,204 62,172 60,136 Z', PAL.grisC, 2.2);
    s += t('M72,172 l4,8 M84,180 l3,8 M72,192 l5,7 M96,196 l2,8 M110,210 l1,8 M128,204 l-1,8 M142,186 l-3,8 M150,170 l-3,6', 1.1);
    s += p('M60,86 C60,68 72,52 88,46 C80,60 74,74 72,90 Z', PAL.grisO, 1.4);
    s += t('M92,62 Q118,56 144,64', 1.1);
    s += sourcil(100, 94, 28, e.bi, e.be, 5.4, PAL.grisO, 1) + sourcil(146, 93, 18, e.bi, e.be, 4.6, PAL.grisO, -1);
    s += oeil(102, 112, 21, e.ouv * 0.9, e.reg, e.regY, 1) + oeil(146, 111, 14, e.ouv * 0.9, e.reg, e.regY, -1);
    s += '<circle cx="102" cy="112" r="17" fill="none" stroke="' + INK + '" stroke-width="' + 2.2 * K + '"/><ellipse cx="146" cy="111" rx="12" ry="16" fill="none" stroke="' + INK + '" stroke-width="' + 2.2 * K + '"/>';
    s += t('M119,108 Q126,104 134,108 M85,108 L60,102', 2);
    s += t('M125,120 C127,130 136,142 140,152 C141,158 136,160 130,159 C126,163 120,161 118,157', 2);
    s += bouche(e.bouche, 124, 180 + j * 0.3, 20, 18);
    return s;
  }

  /* ---------- Les mains et les objets ---------- */
  function poing(peau, ombre) {
    return p('M-34,-16 C-38,-30 -18,-38 2,-36 C22,-36 40,-30 40,-12 C40,6 30,18 8,20 C-14,22 -30,10 -34,-16 Z', peau, 2.6) +
      a('M-32,0 C-24,14 -8,22 8,20 C20,19 30,14 36,4 C22,12 -14,14 -32,0 Z', ombre) +
      t('M-16,-34 C-20,-24 -20,-12 -16,-2 M4,-36 C0,-26 0,-14 4,-1 M22,-33 C20,-24 20,-14 23,-3', 1.8);
  }
  /* la main qui pointe, index vers la droite */
  function mainIndex(peau, ombre) {
    return p('M-36,-20 C-18,-30 6,-30 20,-26 L78,-34 C88,-35 90,-22 80,-20 L34,-10 C42,-8 42,2 34,4 C42,8 40,18 32,18 C36,26 30,32 22,30 C8,38 -18,32 -36,16 Z', peau, 2.6) +
      a('M-36,16 C-18,32 8,38 22,30 C10,28 -14,20 -36,2 Z', ombre) +
      t('M34,-10 C24,-10 16,-8 12,-4 M34,4 C26,4 18,6 14,8 M32,18 C26,18 20,18 16,20', 1.7) +
      p('M-14,-27 C-2,-40 22,-44 32,-36 C38,-30 30,-24 20,-23 C10,-22 4,-18 0,-14 Z', peau, 2.4);
  }
  function megaphone() {
    return p('M0,0 L92,-44 C102,-30 108,-8 108,16 L6,20 C-2,14 -4,6 0,0 Z', PAL.blanc, 2.6) +
      a('M6,20 L108,16 C108,8 107,0 105,-6 L3,10 Z', '#d9c9a4') +
      p('M92,-44 C110,-46 126,-20 124,10 C122,28 110,28 108,16 C108,-8 102,-30 92,-44 Z', PAL.rouge, 2.6) +
      p('M100,-32 C110,-26 116,-8 114,10 C112,18 110,18 108,12 C108,-6 104,-22 100,-32 Z', PAL.rougeO, 1.2) +
      t('M28,-13 C34,-4 36,8 34,18', 1.6) +
      p('M-16,-2 C-22,0 -24,12 -16,17 L6,20 C-2,14 -4,6 0,0 Z', PAL.noir, 2.2);
  }
  function telephone() {
    return p('M-26,-50 Q-26,-54 -22,-54 L22,-54 Q26,-54 26,-50 L26,50 Q26,54 22,54 L-22,54 Q-26,54 -26,50 Z', PAL.noir, 2.4) +
      p('M-18,-46 h14 v14 h-14 Z', '#4a4540', 1.2) + cercle(-11, -39, 3.6, '#7d94a0', 1) + t('M8,40 L18,40', 1).replace('stroke="' + INK + '"', 'stroke="#6b5e54"');
  }

  /* ---------- Les corps : la veste en trois quarts, épaule proche à gauche ---------- */
  function corpsMegaphone() {
    return p('M176,282 C130,292 70,306 36,346 C16,372 6,430 0,490 L412,490 C410,440 406,398 394,364 C378,326 330,306 288,288 Z', PAL.vert, 2.8) +
      a('M36,346 C16,372 6,430 0,490 L44,490 C46,440 56,396 72,366 Z', PAL.vertO) +
      t('M72,366 C84,400 88,440 84,490 M352,352 C344,400 342,440 344,490', 2) +
      t('M104,330 C100,380 100,430 104,490 M122,322 C120,380 120,430 124,490 M140,316 C140,380 142,430 146,490 M372,380 C370,420 370,460 372,490 M322,326 C326,380 326,430 324,490 M304,320 C306,380 306,430 304,490', 0.9) +
      p('M186,284 L238,420 L286,288 Z', PAL.creme, 2) +
      a('M186,284 L210,350 L232,300 Z', '#ddc592');
  }
  function colMegaphone() {
    return p('M176,282 C164,316 164,344 168,364 L190,358 L184,378 L238,472 L238,420 L196,300 Z', PAL.vertO, 2.4) +
      p('M288,288 C298,316 298,340 294,356 L272,352 L278,370 L242,472 L238,420 L276,300 Z', PAL.vertO, 2.4) +
      p('M248,452 m-5.5,0 a5.5,5.5 0 1,0 11,0 a5.5,5.5 0 1,0 -11,0', PAL.brun, 1.5) +
      // écharpe rouge
      p('M152,246 C166,272 232,296 304,258 C312,272 312,296 300,310 C246,338 176,326 154,296 C146,280 146,262 152,246 Z', PAL.rouge, 2.6) +
      a('M154,290 C182,320 248,326 302,304 L300,310 C246,338 176,326 154,296 Z', PAL.rougeO) +
      t('M172,270 C190,292 214,304 244,304 M204,290 C214,310 240,316 270,310', 1.3) +
      p('M194,316 C184,352 182,392 188,432 L228,438 C224,398 230,356 242,322 Z', PAL.rouge, 2.6) +
      a('M194,316 C184,352 182,392 188,432 L202,434 C198,392 202,352 212,320 Z', PAL.rougeO) +
      t('M190,432 L186,448 M202,434 L200,450 M214,436 L214,452 M226,438 L228,452', 1.4);
  }
  function gesteMegaphone(g) {
    var s = '';
    if (g === 'megaphone') {
      s += '<g transform="translate(262,330) rotate(-26) scale(1.42)">' + megaphone() + p('M50,18 L46,50 L66,52 L70,17 Z', PAL.grisO, 2.2) + '</g>';
      s += p('M30,490 C50,450 110,420 262,366 L288,424 C216,456 176,476 160,490 Z', PAL.vert, 2.8);
      s += a('M30,490 C50,470 90,450 160,490 Z', PAL.vertO);
      s += t('M120,424 C128,432 134,446 134,464 M170,404 C178,416 182,430 182,446 M206,392 C214,402 218,416 220,430', 1.2);
      s += p('M256,362 L296,350 L312,404 L280,428 Z', PAL.creme, 2.4);
      s += '<g transform="translate(318,396) rotate(-20)">' + poing(PAL.peau, PAL.peauO) + '</g>';
    }
    if (g === 'index') {
      s += p('M40,490 C60,440 130,392 268,350 L290,404 C222,432 186,462 170,490 Z', PAL.vert, 2.8);
      s += a('M40,490 C70,470 110,460 170,490 Z', PAL.vertO);
      s += t('M130,404 C138,414 142,430 142,446 M186,380 C194,392 198,406 198,422', 1.2);
      s += p('M262,346 L286,338 L304,392 L284,408 Z', PAL.creme, 2.4);
      s += '<g transform="translate(330,364) rotate(-14) scale(1.1)">' + mainIndex(PAL.peau, PAL.peauO) + '</g>';
    }
    if (g === 'poing') {
      s += p('M300,490 C310,440 340,396 356,330 L400,342 C396,400 390,440 390,490 Z', PAL.vert, 2.8);
      s += p('M350,328 L404,340 L400,318 L356,308 Z', PAL.creme, 2.4);
      s += '<g transform="translate(380,276) rotate(-82)">' + poing(PAL.peau, PAL.peauO) + '</g>';
    }
    return s;
  }

  function corpsBrushing() {
    return p('M188,278 C150,288 100,296 72,332 C54,362 48,430 44,490 L396,490 C394,430 390,374 378,344 C362,316 322,302 286,284 Z', PAL.marine, 2.8) +
      a('M72,332 C54,362 48,430 44,490 L80,490 C82,440 90,392 104,362 Z', PAL.marineO) +
      t('M104,362 C116,400 118,440 116,490 M348,346 C340,400 338,440 340,490', 1.8) +
      p('M192,282 L240,430 L286,284 Z', PAL.blanc, 2) +
      a('M192,282 L214,350 L236,300 Z', '#d9d3c2');
  }
  function colBrushing() {
    return p('M188,276 L214,330 L238,300 C216,302 198,292 188,276 Z', PAL.blanc, 2) +
      p('M290,282 L264,334 L238,300 C260,300 280,294 290,282 Z', PAL.blanc, 2) +
      p('M228,302 L250,302 L256,318 L248,328 L232,326 L226,316 Z', PAL.rouge, 2) +
      p('M232,328 L248,328 L256,430 L242,446 L228,430 Z', PAL.rouge, 2) +
      a('M232,328 L240,328 L238,446 L228,430 Z', PAL.rougeO) +
      p('M186,274 C180,310 182,340 186,358 L204,352 L198,372 L242,470 L240,432 Z', PAL.marineO, 2.4) +
      p('M292,282 C300,316 298,342 294,358 L276,352 L280,370 L246,470 L242,432 Z', PAL.marineO, 2.4) +
      p('M310,376 h15 v9 h-15 Z', PAL.blanc, 1.2) + a('M310,376 h5 v9 h-5 Z', PAL.marine) + a('M320,376 h5 v9 h-5 Z', PAL.rouge) +
      t('M304,416 L356,408', 1.6) + t('M246,470 L248,490', 1.6);
  }
  function gesteBrushing(g) {
    var s = '';
    if (g === 'selfie') {
      s += p('M340,490 C350,440 366,400 372,356 L414,366 C414,410 410,450 410,490 Z', PAL.marine, 2.8);
      s += t('M356,420 C366,426 380,428 396,424', 1.2);
      s += p('M366,352 L420,364 L416,340 L372,330 Z', PAL.blanc, 2.2);
      s += '<g transform="translate(390,250) rotate(8) scale(.92)">' + telephone() + '</g>';
      s += p('M366,340 C362,318 362,302 366,288 L372,256 L382,258 L384,274 L392,256 L402,258 L402,276 L410,262 L420,266 L420,290 C424,310 422,330 418,352 Z', PAL.peau, 2.6);
      s += a('M366,340 C364,328 362,316 364,304 C380,316 400,322 420,318 C420,330 420,342 418,352 Z', PAL.peauO);
    }
    if (g === 'paume') {
      s += p('M60,490 C80,440 150,420 268,392 L280,444 C220,462 190,476 176,490 Z', PAL.marine, 2.8);
      s += p('M262,388 L284,384 L296,438 L276,446 Z', PAL.blanc, 2.2);
      s += '<g transform="translate(326,406) rotate(-6)">' + poing(PAL.peau, PAL.peauO) + '</g>';
    }
    return s;
  }

  function corpsBornee() {
    return p('M186,272 C160,284 124,290 100,320 C84,350 76,430 74,490 L368,490 C366,430 360,364 350,336 C338,308 306,296 278,278 Z', '#3b3a46', 2.8) +
      a('M100,320 C84,350 76,430 74,490 L104,490 C106,440 112,392 124,360 Z', '#2a2933') +
      t('M124,360 C134,400 136,440 134,490 M326,340 C318,400 316,440 318,490', 1.8) +
      p('M196,272 L232,370 L276,276 Z', PAL.blanc, 2);
  }
  function colBornee() {
    return p('M186,270 C176,300 178,330 182,350 L232,420 L232,370 Z', '#2a2933', 2.4) +
      p('M280,276 C288,306 288,330 284,350 L238,420 L232,370 Z', '#2a2933', 2.4) +
      t('M238,420 L240,490', 1.6) +
      // collier discret
      '<g fill="' + PAL.ocre + '">' + [[208, 306], [216, 318], [226, 326], [238, 328], [250, 322], [260, 312], [268, 298]].map(function (q) { return cercle(q[0], q[1], 3.4, PAL.creme, 1); }).join('') + '</g>';
  }
  function gesteBornee(g) {
    var s = '';
    if (g === 'dossier') {
      s += p('M196,352 L330,342 L340,480 L204,490 Z', PAL.rouge, 2.6);
      s += a('M196,352 L330,342 L331,356 L197,366 Z', PAL.rougeO);
      s += p('M224,392 L306,386 L309,444 L228,450 Z', PAL.creme, 1.8);
      s += root.Lettrage ? root.Lettrage.ligne('49.3', 266, 404, 26, { ancre: 'm', gras: true }) : '';
      s += p('M86,490 C96,464 140,450 196,446 L204,490 Z', '#3b3a46', 2.8);
      s += '<g transform="translate(232,462) rotate(-4) scale(.8)">' + poing(PAL.peau, PAL.peauO) + '</g>';
    }
    return s;
  }

  function corpsTournesol() {
    return p('M190,270 C160,284 124,292 96,322 C78,354 70,430 66,490 L376,490 C374,430 368,364 358,334 C344,306 310,294 280,276 Z', '#7d8f55', 2.8) +
      a('M96,322 C78,354 70,430 66,490 L100,490 C100,440 108,392 122,360 Z', '#5f7040') +
      t('M122,360 C132,400 134,440 132,490 M332,340 C326,400 324,440 326,490', 1.8) +
      p('M198,272 L236,380 L276,276 Z', PAL.creme, 2);
  }
  function colTournesol() {
    return p('M190,268 C182,300 184,330 188,352 L236,430 L236,380 Z', '#5f7040', 2.4) +
      p('M280,274 C290,304 290,330 286,350 L242,430 L236,380 Z', '#5f7040', 2.4) +
      // le tournesol à la boutonnière
      '<g transform="translate(318,350)">' + [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(function (ang) { return '<g transform="rotate(' + ang + ')">' + p('M0,-8 L5,-22 L0,-30 L-5,-22 Z', PAL.ocre, 1.4) + '</g>'; }).join('') + cercle(0, 0, 11, PAL.brunO, 1.8) + '</g>';
  }
  function gesteTournesol(g) {
    var s = '';
    if (g === 'mug') {
      s += p('M90,490 C100,466 170,446 240,434 L252,480 C226,484 200,488 190,490 Z', '#7d8f55', 2.8);
      s += p('M236,430 L258,426 L268,476 L250,482 Z', PAL.creme, 2.2);
      s += p('M276,404 L342,400 L340,486 Q308,494 280,486 Z', PAL.bleu, 2.6);
      s += p('M342,420 C364,416 366,458 340,464', 'none', 3);
      s += a('M276,404 L290,403 L293,489 Q286,488 280,486 Z', PAL.bleuO);
      s += '<g transform="translate(292,456) scale(.86)">' + poing(PAL.peau, PAL.peauO) + '</g>';
    }
    return s;
  }

  function corpsRillettes() {
    return p('M176,282 C136,292 78,306 46,344 C22,372 10,430 2,490 L420,490 C418,430 412,376 396,350 C374,316 322,298 290,284 Z', '#8a6a4a', 2.8) +
      a('M46,344 C22,372 10,430 2,490 L46,490 C48,440 58,394 74,364 Z', '#664c32') +
      t('M74,364 C86,400 90,440 88,490 M362,350 C354,400 352,440 354,490', 2) +
      p('M188,286 L240,450 L286,288 Z', PAL.creme, 2) +
      t('M240,340 L240,450', 1.4) + cercle(244, 372, 2.6, PAL.blanc, 1) + cercle(244, 410, 2.6, PAL.blanc, 1);
  }
  function colRillettes() {
    return p('M186,282 L214,340 L240,306 C220,308 200,298 186,282 Z', PAL.creme, 2) +
      p('M290,286 L266,342 L240,306 C258,306 278,298 290,286 Z', PAL.creme, 2) +
      // cravate rouge desserrée
      p('M226,312 L252,312 L256,326 L246,334 L232,332 L226,324 Z', PAL.rouge, 2) +
      p('M232,334 L246,334 L258,420 L244,436 L228,422 Z', PAL.rouge, 2) +
      a('M232,334 L240,334 L242,436 L228,422 Z', PAL.rougeO) +
      p('M178,282 C168,316 170,346 174,366 L240,478 L238,450 L194,306 Z', '#664c32', 2.4) +
      p('M292,286 C302,316 302,344 298,362 L244,478 L240,450 L282,306 Z', '#664c32', 2.4);
  }
  function gesteRillettes(g) {
    var s = '';
    if (g === 'verre') {
      s += '<g transform="translate(-34,10)">' + p('M310,490 C320,440 340,410 356,376 L404,392 C400,430 400,460 402,490 Z', '#8a6a4a', 2.8);
      s += p('M352,372 L408,390 L412,366 L362,350 Z', PAL.creme, 2.2);
      // le ballon de rouge
      s += p('M350,206 C344,236 354,262 384,264 C414,262 424,236 418,206 Z', PAL.blanc, 2.4);
      s += a('M347,232 C350,252 362,262 384,263 C406,262 420,252 421,232 Z', PAL.rougeO);
      s += t('M347,232 C370,236 400,236 421,232', 1.4);
      s += p('M380,264 L380,316 M388,264 L388,316', 'none', 2);
      s += p('M360,324 Q384,312 408,324', 'none', 2.4);
      s += '<g transform="translate(386,342) rotate(-90) scale(.9)">' + poing(PAL.peau, PAL.peauO) + '</g></g>';
    }
    return s;
  }

  function corpsJournaliste() {
    return p('M190,272 C160,282 124,290 100,318 C84,350 78,430 76,490 L372,490 C370,430 364,362 352,334 C340,306 310,292 280,276 Z', PAL.bleuO, 2.8) +
      a('M100,318 C84,350 78,430 76,490 L108,490 C110,440 116,392 128,360 Z', '#335e72') +
      p('M198,272 L236,370 L276,276 Z', PAL.creme, 2);
  }
  function colJournaliste() {
    return p('M190,270 C180,300 182,330 186,352 L236,430 L236,370 Z', '#335e72', 2.4) + p('M282,276 C290,306 290,330 286,350 L240,430 L236,370 Z', '#335e72', 2.4);
  }
  function corpsMatinalier() {
    return p('M186,278 C150,288 104,298 78,330 C60,360 54,430 50,490 L392,490 C390,430 386,372 374,342 C358,312 320,300 284,282 Z', PAL.ocreO, 2.8) +
      a('M78,330 C60,360 54,430 50,490 L86,490 C88,440 96,392 110,360 Z', '#8f6416') +
      t('M110,360 C122,400 124,440 122,490 M344,346 C338,400 336,440 338,490', 1.8) +
      t('M130,340 L128,490 M150,330 L150,490 M170,320 L172,490 M300,320 L298,490 M318,326 L318,490', 0.9) +
      p('M194,282 L240,400 L282,284 Z', PAL.bleu, 2);
  }
  function colMatinalier() {
    return p('M186,280 L212,330 L238,304 C218,302 198,296 186,280 Z', PAL.bleu, 2) + p('M286,284 L262,332 L238,304 C258,304 274,298 286,284 Z', PAL.bleu, 2) +
      p('M182,282 C176,320 186,380 234,470 L238,400 Z', '#8f6416', 2.4) + p('M290,286 C298,330 284,390 244,470 L240,400 Z', '#8f6416', 2.4);
  }

  /* ---------- Assemblage d'un buste ---------- */
  var FICHE = {
    megaphone: { tete: teteMegaphone, corps: corpsMegaphone, col: colMegaphone, geste: gesteMegaphone, cou: [58, 160, 150], at: [100, 6], k: 1.18 },
    brushing: { tete: teteBrushing, corps: corpsBrushing, col: colBrushing, geste: gesteBrushing, cou: [78, 150, 150], at: [114, 42], k: 1.14 },
    bornee: { tete: teteBornee, corps: corpsBornee, col: colBornee, geste: gesteBornee, cou: [80, 140, 150], at: [114, 38], k: 1.12 },
    tournesol: { tete: teteTournesol, corps: corpsTournesol, col: colTournesol, geste: gesteTournesol, cou: [80, 144, 150], at: [114, 40], k: 1.14 },
    rillettes: { tete: teteRillettes, corps: corpsRillettes, col: colRillettes, geste: gesteRillettes, cou: [62, 164, 150], at: [100, 34], k: 1.16 },
    journaliste: { tete: teteJournaliste, corps: corpsJournaliste, col: colJournaliste, geste: function () { return ''; }, cou: [82, 142, 150], at: [116, 40], k: 1.12 },
    matinalier: { tete: teteMatinalier, corps: corpsMatinalier, col: colMatinalier, geste: function () { return ''; }, cou: [78, 146, 150], at: [116, 38], k: 1.14 }
  };
  function cou(c) {
    var x1 = c[0], x2 = c[1], y = c[2];
    return p('M' + (x1 + 4) + ',' + (y + 20) + ' L' + (x1 - 2) + ',' + (y + 104) + ' L' + (x2 + 2) + ',' + (y + 104) + ' L' + (x2 - 2) + ',' + (y + 30), PAL.peau) +
      a('M' + (x1 + 2) + ',' + (y + 44) + ' C' + (x1 + 30) + ',' + (y + 96) + ' ' + (x2 - 30) + ',' + (y + 96) + ' ' + (x2 - 1) + ',' + (y + 52) + ' L' + (x2 + 1) + ',' + (y + 102) + ' L' + (x1 - 1) + ',' + (y + 102) + ' Z', PAL.peauO);
  }
  /* un buste : nom, expression, { rot, geste, s : échelle prévue, pour garder le trait constant } */
  function buste(nom, expr, o) {
    o = o || {};
    var F = FICHE[nom], e = EXPR[expr || 'neutre'], s = o.s || 1, avant = K;
    K = 1 / Math.pow(s, 0.72);
    var at = F.at, rot = o.rot || 0;
    var tr = '<g transform="translate(' + at[0] + ',' + at[1] + ') scale(' + F.k + ') rotate(' + rot + ' 100 200)">';
    var dz = K; K = dz / F.k;
    var couS = tr + cou(F.cou) + '</g>', teteS = tr + F.tete(e) + (o.casque ? casque() : '') + '</g>';
    K = dz;
    var out = F.corps(e) + couS + F.col(e) + teteS + (o.geste ? F.geste(o.geste) : '');
    K = avant;
    return '<g stroke-linecap="round" stroke-linejoin="round">' + out + '</g>';
  }
  /* le casque de radio, posé sur la tête */
  function casque() {
    return p('M44,120 C36,40 96,-14 150,20 C172,36 176,70 172,106', 'none', 7) + p('M44,120 C36,40 96,-14 150,20 C172,36 176,70 172,106', 'none', 3).replace('stroke="' + INK + '"', 'stroke="' + PAL.grisO + '"') +
      p('M28,108 C44,100 62,108 64,128 C66,150 52,166 36,160 C22,154 18,120 28,108 Z', PAL.noir, 2.4) + t('M34,118 C44,114 54,120 54,132', 1.2).replace('stroke="' + INK + '"', 'stroke="#6b5e54"');
  }

  root.Perso = { PAL: PAL, INK: INK, buste: buste, p: p, a: a, t: t, cercle: cercle, poing: poing, mainIndex: mainIndex, telephone: telephone, setK: function (k) { K = k; }, getK: function () { return K; } };
})(this);

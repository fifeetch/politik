/* Politik — les grandes cases des événements : des plans larges sans dialogue, des gens entiers, au même trait que le plateau du débat. */
(function (root) {
  var P = root.Perso, S = root.Scenes, L = root.Lettrage;
  if (!P || !S || !L) return;
  var PAL = P.PAL, INK = P.INK, p = P.p, a = P.a, t = P.t, cercle = P.cercle, R = S.outils;
  var W = 1200, H = 680;
  var PEAUX = { a: ['#efc39b', '#d79c72'], b: ['#d9a67a', '#b87b52'], c: ['#a56d47', '#84522f'], d: ['#7d4d31', '#5f3822'] };

  /* un membre : un trait épais cerné d'encre */
  function membre(d, c, w) {
    var fin = '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    return '<path d="' + d + '" stroke="' + INK + '" stroke-width="' + (w + 5) + fin + '<path d="' + d + '" stroke="' + c + '" stroke-width="' + w + fin;
  }

  /* Une personne entière, les pieds en (x, sol), regard vers la droite (g : vers la gauche). Environ 310 de haut à l'échelle 1. */
  function gens(x, sol, k, o) {
    var pe = PEAUX[o.peau || 'a'], ch = o.cheveux || PAL.brunO, haut = o.haut || PAL.marine, bas = o.bas || '#3b3a46', pose = o.pose || 'bas', s = '';
    var assis = pose === 'assis', ourlet = o.long ? -100 : -128, dy = assis ? 44 : 0;
    /* les jambes */
    if (assis) {
      s += membre('M-14,-84 L34,-84 L36,-12', bas, 21) + membre('M4,-80 L52,-80 L56,-12', bas, 21);
      s += p('M22,-14 L50,-14 C60,-10 66,-6 66,0 L22,0 Z', PAL.noir, 2.4) + p('M42,-14 L70,-14 C80,-10 86,-6 86,0 L42,0 Z', PAL.noir, 2.4);
    } else {
      var ecart = o.marche ? 28 : 9;
      s += membre('M-11,-112 L' + (-11 - ecart * .4) + ',-60 L' + (-13 - ecart * .8) + ',-14', bas, 21);
      s += membre('M11,-112 L' + (11 + ecart * .5) + ',-60 L' + (13 + ecart) + ',-14', bas, 21);
      s += p('M' + (-27 - ecart * .8) + ',-14 L' + (-3 - ecart * .8) + ',-14 C' + (7 - ecart * .8) + ',-10 ' + (13 - ecart * .8) + ',-6 ' + (13 - ecart * .8) + ',0 L' + (-27 - ecart * .8) + ',0 Z', PAL.noir, 2.4);
      s += p('M' + (2 + ecart) + ',-14 L' + (26 + ecart) + ',-14 C' + (36 + ecart) + ',-10 ' + (42 + ecart) + ',-6 ' + (42 + ecart) + ',0 L' + (2 + ecart) + ',0 Z', PAL.noir, 2.4);
    }
    /* le bassin, qui raccorde les jambes au corps */
    if (!assis) s += p('M-29,-140 L29,-140 L27,-96 C16,-90 6,-90 1,-98 C-6,-90 -18,-90 -27,-96 Z', bas, 2.6);
    /* le haut du corps */
    var c = '<g transform="translate(0,' + dy + ')">';
    if (o.cheveux2 === 'long') c += p('M-31,-282 C-34,-316 32,-316 30,-282 L32,-220 C12,-210 -16,-210 -33,-220 Z', ch, 2.4);
    if (o.cheveux2 === 'boucles') c += cercle(-2, -288, 38, ch, 2.4);
    if (o.cheveux2 === 'queue') c += p('M-20,-290 C-46,-290 -52,-250 -40,-226 C-30,-240 -28,-262 -18,-272 Z', ch, 2.4);
    /* le bras arrière */
    c += membre('M-27,-218 L-37,-170 L-35,' + (o.long ? -122 : -128), haut, 17) + cercle(-35, o.long ? -114 : -120, 9, pe[0], 2);
    /* le tronc */
    c += p('M-30,-232 C-34,-200 -31,-150 -29,' + ourlet + ' L29,' + ourlet + ' C31,-150 34,-200 30,-232 C18,-242 -18,-242 -30,-232 Z', haut, 2.6);
    c += a('M-30,-232 C-34,-200 -31,-150 -29,' + ourlet + ' L-15,' + ourlet + ' C-18,-160 -18,-200 -14,-238 Z', 'rgba(29,23,19,.2)');
    c += t('M4,-226 V' + (ourlet + 2), 1.5);
    if (o.gilet) {
      c += p('M-26,-234 C-29,-200 -27,-170 -25,-150 L25,-150 C27,-170 29,-200 26,-234 C12,-226 -12,-226 -26,-234 Z', o.gilet, 2.2) + a('M-26,-190 L26,-190 L26,-176 L-26,-176 Z', PAL.blanc);
    }
    if (o.bandes) c += a('M-30,-178 H30 V-168 H-30 Z', '#efe2bd') + a('M-29,-146 H29 V-136 H-29 Z', '#efe2bd');
    /* la tête */
    c += p('M-9,-250 L-9,-232 C-4,-226 6,-226 11,-232 L11,-250 Z', pe[1], 2);
    c += cercle(-22, -268, 6, pe[0], 1.8);
    c += p('M-22,-272 C-24,-304 24,-304 23,-272 C25,-250 12,-240 0,-240 C-12,-240 -24,-250 -22,-272 Z', pe[0], 2.3);
    c += a('M-22,-268 C-22,-250 -12,-241 0,-240 C-8,-246 -14,-256 -14,-270 Z', pe[1]);
    var bo = o.bouche || 'ferme';
    c += cercle(5, -271, 2.5, INK, 0) + cercle(16, -271, 2.3, INK, 0);
    if (bo === 'crie') c += t('M0,-281 L10,-277 M21,-281 L13,-277', 2) + p('M3,-258 Q10,-261 18,-258 Q16,-244 10,-244 Q5,-245 3,-258 Z', '#4b1712', 1.8);
    else if (bo === 'triste') c += t('M0,-279 L9,-282 M21,-279 L13,-282', 1.8) + t('M4,-251 Q10,-256 16,-251', 1.8);
    else c += t('M0,-280 Q5,-283 10,-280 M13,-280 Q17,-283 21,-280', 1.6) + t('M4,-254 Q10,-251 16,-255', 1.8);
    c += t('M11,-268 q5,5 -1,8', 1.3);
    var co = o.cheveux2 || 'court';
    if (co === 'court' || co === 'casquette' || co === 'queue') c += p('M-24,-268 C-30,-308 28,-312 24,-280 C14,-294 -6,-294 -14,-286 C-18,-282 -18,-274 -18,-266 Z', ch, 2.2);
    if (co === 'long') c += p('M-24,-268 C-30,-310 28,-312 24,-282 C10,-296 -8,-292 -14,-284 C-18,-278 -20,-272 -18,-262 Z', ch, 2.2);
    if (co === 'boucles') c += p('M-26,-272 C-30,-312 30,-314 26,-282 C14,-296 -8,-294 -16,-286 C-20,-282 -20,-276 -20,-270 Z', ch, 2.2);
    if (co === 'gris') c += p('M-23,-264 C-27,-284 -20,-294 -12,-296 C-16,-284 -16,-274 -17,-262 Z', ch, 2);
    if (co === 'casquette') c += p('M-25,-282 C-27,-312 25,-312 25,-284 Z', o.coiffe || PAL.rouge, 2.2) + p('M12,-288 C26,-288 40,-284 44,-278 C34,-276 22,-280 10,-280 Z', o.coiffe || PAL.rouge, 2);
    if (co === 'casque') c += p('M-28,-280 C-32,-322 32,-322 30,-282 Z', '#dfa93c', 2.4) + p('M-4,-314 C0,-320 8,-320 11,-314 L10,-286 L-3,-286 Z', '#efc35c', 1.8) + p('M-34,-280 C-14,-288 22,-288 40,-278 L40,-272 C20,-280 -14,-280 -34,-272 Z', '#b98421', 2);
    /* le bras avant, selon la pose */
    var d = 'M27,-218 L37,-170 L35,-128', main = [35, -120];
    if (pose === 'poing') { d = 'M27,-220 L52,-258 L46,-314'; main = [46, -324]; }
    else if (pose === 'pancarte') { d = 'M27,-220 L52,-214 L58,-250'; main = [58, -258]; }
    else if (pose === 'tient') { d = 'M27,-218 L52,-180 L62,-186'; main = [66, -190]; }
    else if (pose === 'montre') { d = 'M27,-218 L38,-176 L6,-178'; main = [-2, -178]; }
    else if (pose === 'tel') { d = 'M27,-218 L46,-198 L28,-258'; main = [26, -266]; }
    else if (pose === 'lance') { d = 'M27,-216 L62,-190 L98,-200'; main = [104, -202]; }
    else if (pose === 'assis') { d = 'M27,-218 L40,-170 L44,-138'; main = [46, -130]; }
    if (pose === 'pancarte') {
      c += '<g class="an-pancarte" style="animation-delay:' + (-(o.n || 1) * .3) + 's">' + t('M58,-250 V-380', 4.4) + '<g transform="rotate(' + (o.n % 2 ? 3 : -3) + ' 58 -410)">' + R.rect(-22, -446, 160, 66, o.fond || PAL.blanc, 2.8) + '<g' + (o.g ? ' transform="translate(116,0) scale(-1,1)"' : '') + '>' + L.ligne(o.texte, 58, -431, 34, { ancre: 'm', encre: PAL.rouge, gras: true, graine: o.n || 3 }) + '</g></g></g>';
    }
    if (pose === 'tel') c += p('M16,-286 L34,-284 L32,-246 L14,-248 Z', PAL.noir, 1.8);
    c += membre(d, haut, 17) + cercle(main[0], main[1], 9.5, pe[0], 2);
    c += '</g>';
    s += c;
    return '<g transform="translate(' + x + ',' + sol + ') scale(' + (o.g ? -k : k) + ',' + k + ')">' + s + '</g>';
  }

  /* ---------- La grève : le quai, le train à l'arrêt, le cortège, les usagers qui attendent ---------- */
  function train(y) {
    var s = p('M-10,' + y + ' H1210 V' + (y + 190) + ' H-10 Z', '#2f5d9b', 3);
    s += a('M-10,' + (y + 126) + ' H1210 V' + (y + 150) + ' H-10 Z', PAL.creme) + t('M-10,' + (y + 126) + ' H1210 M-10,' + (y + 150) + ' H1210', 2);
    for (var i = 0; i < 7; i++) {
      s += p('M' + (10 + i * 176) + ',' + (y + 28) + ' h130 v76 h-130 Z', '#16233f', 2.4) + a('M' + (18 + i * 176) + ',' + (y + 34) + ' l40,0 l-34,62 l-6,0 Z', '#2f4772');
    }
    return s;
  }
  function tableau(x, y, w, lignes) {
    var h = 40 * lignes.length + 54, s = t('M' + (x + 40) + ',-5 V' + y + ' M' + (x + w - 40) + ',-5 V' + y, 5);
    s += R.rect(x, y, w, h, '#191613', 3.4) + L.ligne('DÉPARTS', x + 18, y + 12, 22, { encre: '#ffcf5a', gras: true });
    lignes.forEach(function (li, i) {
      var yy = y + 48 + i * 40;
      s += L.ligne(li, x + 18, yy, 20, { encre: '#f3e7c8', graine: i + 3 }) + L.ligne('SUPPRIMÉ', x + w - 18, yy, 20, { encre: '#ff8a5e', ancre: 'd', gras: true, graine: i + 7 });
    });
    return s;
  }
  function greve() {
    var s = R.af(0, 0, W, H, '#22345a'), i;
    /* la verrière et ses fermes */
    s += R.af(0, 0, W, 150, '#2f4772');
    for (i = 0; i < 9; i++) s += t('M' + (i * 150) + ',0 L' + (600 + (i - 4) * 90) + ',150', 2.4);
    s += t('M0,150 H1200', 4) + t('M0,70 Q600,40 1200,70', 2.4);
    s += '<g class="an-train">' + train(170) + '</g>';
    /* le quai et sa ligne jaune */
    s += R.af(0, 360, W, 320, '#a39d8c') + t('M0,360 H1200', 3) + a('M0,376 H1200 V392 H0 Z', PAL.ocre) + t('M0,376 H1200 M0,392 H1200', 1.6);
    s += tableau(690, 14, 340, ['6 H 42  MEAUX', '6 H 51  CERGY', '7 H 04  ÉVRY']);
    /* le cortège : le deuxième rang, puis la banderole et ceux qui la portent */
    s += gens(205, 560, .84, { peau: 'c', cheveux: PAL.noir, haut: PAL.rougeO, bas: '#27395c', pose: 'poing', bouche: 'crie' });
    s += gens(285, 552, .84, { peau: 'a', cheveux2: 'long', cheveux: '#b5552a', haut: '#6b6a5e', bas: '#3b3a46', pose: 'pancarte', texte: 'NON !', fond: '#f5d547', n: 2 });
    s += gens(372, 562, .84, { peau: 'd', cheveux2: 'boucles', cheveux: PAL.noir, haut: '#2f8a8a', bas: '#4a3120', pose: 'poing', bouche: 'crie' });
    s += gens(450, 552, .84, { peau: 'b', cheveux2: 'gris', cheveux: PAL.grisC, haut: PAL.ocreO, bas: '#3b3a46', pose: 'bas', bouche: 'crie' });
    s += gens(530, 560, .84, { peau: 'a', cheveux2: 'casquette', cheveux: PAL.brun, coiffe: PAL.rouge, haut: PAL.marine, gilet: PAL.rouge, bas: '#5d5c54', pose: 'pancarte', texte: 'GRÈVE', n: 3 });
    /* la banderole */
    s += '<g class="an-banderole">' + p('M178,428 C290,416 470,440 588,422 L590,510 C470,530 290,504 180,518 Z', PAL.blanc, 3.2);
    s += a('M178,500 C290,486 470,512 590,492 L590,510 C470,530 290,504 180,518 Z', PAL.grisC);
    s += L.ligne('EN GRÈVE', 384, 452, 44, { ancre: 'm', encre: PAL.rouge, gras: true, graine: 3 }) + '</g>';
    s += gens(122, 616, .94, { peau: 'b', cheveux: PAL.noir, haut: '#7d8f55', gilet: PAL.rouge, bas: '#27395c', pose: 'tient', bouche: 'crie' });
    s += gens(652, 618, .94, { g: true, peau: 'c', cheveux2: 'queue', cheveux: PAL.noir, haut: PAL.marine, gilet: PAL.rouge, bas: '#3b3a46', pose: 'tient', bouche: 'crie' });
    /* les usagers : le banc, la valise, la montre */
    s += t('M860,590 V636 M1110,590 V636', 6) + p('M830,560 H1140 L1146,590 H824 Z', '#6d4a2f', 2.8);
    s += gens(884, 628, .86, { g: false, peau: 'a', cheveux2: 'gris', cheveux: PAL.grisC, haut: '#6b6a5e', long: false, bas: '#27395c', pose: 'assis', bouche: 'triste' });
    s += gens(1012, 628, .86, { peau: 'd', cheveux2: 'long', cheveux: PAL.noir, haut: '#7d8f55', bas: '#4a3120', pose: 'assis', bouche: 'triste' });
    s += gens(790, 612, .9, { g: true, peau: 'b', cheveux: PAL.brunO, haut: '#3b3a46', long: true, bas: '#5d5c54', pose: 'tel', bouche: 'triste' });
    s += R.rect(726, 556, 44, 60, '#8d2a20', 2.6) + t('M740,556 q8,-14 16,0', 2.4);
    s += gens(1148, 620, .9, { g: true, peau: 'c', cheveux2: 'court', cheveux: PAL.noir, haut: '#477a90', long: true, bas: '#3b3a46', pose: 'montre', bouche: 'triste' });
    return S.kase(W, H, 'Une gare à l’arrêt : le cortège des cheminots devant le train, les usagers qui attendent sur le quai.', s);
  }

  /* ---------- Le feu de forêt : la colline qui brûle, le Canadair qui largue, les pompiers à la lance ---------- */
  function flamme(x, y, k, i) {
    var ext = 'M-78,46 C-104,-8 -62,-40 -58,-86 C-34,-64 -28,-50 -18,-42 C-22,-92 2,-138 34,-164 C30,-112 66,-82 66,-38 C78,-46 84,-58 84,-70 C110,-26 100,24 78,46 Z';
    var mil = 'M-50,46 C-66,10 -38,-12 -34,-44 C-18,-30 -12,-22 -6,-16 C-8,-52 8,-84 28,-102 C28,-68 50,-44 50,-14 C60,-20 62,-26 64,-32 C76,-4 66,28 52,46 Z';
    var coe = 'M-22,46 C-32,24 -14,10 -10,-8 C0,4 6,8 8,14 C10,-6 16,-20 26,-32 C26,-14 40,0 38,22 C38,32 32,40 26,46 Z';
    return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')"><g class="an-flamme" style="animation-delay:' + (-(i % 5) * .23) + 's">' + p(ext, '#e2572b', 3) + a(mil, '#f4a13a') + a(coe, '#fbe07a') + '</g></g>';
  }
  /* un pin en étages ; brûlé, il ne reste que le tronc et les branches */
  function pin(x, y, k, brule) {
    var s = '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">';
    if (brule) {
      s += p('M-7,0 L-3,-150 L3,-150 L8,0 Z', '#26201c', 2.2) + t('M-2,-60 L-34,-92 M0,-84 L30,-118 M-1,-112 L-24,-138 M-22,-78 L-34,-78 M18,-104 L30,-100', 4);
    } else {
      s += p('M-7,0 L-3,-60 H4 L8,0 Z', PAL.brunO, 2.2);
      s += p('M-52,-40 C-28,-54 -24,-72 -14,-74 L14,-74 C24,-72 30,-54 54,-40 C30,-30 -28,-30 -52,-40 Z', '#2c4f39', 2.4);
      s += p('M-42,-78 C-24,-90 -18,-108 -10,-110 L10,-110 C18,-108 24,-90 44,-78 C24,-68 -24,-68 -42,-78 Z', '#3f6a4c', 2.4);
      s += p('M-28,-112 C-16,-122 -8,-144 0,-152 C8,-144 16,-122 30,-112 C16,-104 -14,-104 -28,-112 Z', '#4e7d5a', 2.4);
    }
    return s + '</g>';
  }
  function fumee(x, y, k, c) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')"><g class="an-fumee">' + p('M-150,50 C-200,46 -196,-22 -136,-26 C-136,-86 -46,-104 -14,-58 C22,-110 120,-96 118,-30 C176,-36 196,44 136,52 Z', c, 2.8) + '</g></g>';
  }
  /* le Canadair, de profil, le nez à gauche : la coque de bateau, l'aile haute, le moteur, le flotteur */
  function canadair() {
    var J = '#f2c230', J2 = '#d29e1c', s = '';
    /* la dérive et son empennage en haut */
    s += p('M398,30 L436,-58 L478,-58 L470,28 Z', PAL.rouge, 3) + p('M410,-66 H520 L512,-54 H416 Z', PAL.rouge, 2.6);
    /* le flotteur, sous l'aile */
    s += t('M226,96 L232,132 M262,92 L256,132', 3.4) + p('M186,140 C206,126 280,126 304,138 C282,150 208,152 186,140 Z', PAL.rouge, 2.6);
    /* la coque */
    s += p('M0,64 C6,42 34,28 76,24 L440,18 C462,16 490,12 506,8 L510,24 C476,46 420,62 356,72 C330,92 290,102 238,106 C160,112 60,108 22,90 C8,84 0,74 0,64 Z', J, 3);
    s += p('M4,74 C60,74 300,76 500,28 C476,46 420,62 356,72 C330,92 290,102 238,106 C160,112 60,108 22,90 C12,86 6,80 4,74 Z', PAL.rouge, 2.4);
    s += a('M22,90 C60,108 160,112 238,106 C290,102 330,92 356,72 C320,84 250,94 180,96 C110,98 60,94 22,90 Z', PAL.rougeO);
    /* le cockpit et les hublots */
    s += p('M20,50 C30,36 50,30 72,28 L72,52 L18,56 Z', '#c9e0e2', 2.4) + t('M46,31 V54', 2);
    for (var i = 0; i < 6; i++) s += cercle(112 + i * 42, 46, 8, '#c9e0e2', 2);
    s += L.ligne('SÉCURITÉ CIVILE', 190, 80, 15, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 4 });
    /* l'aile et le moteur */
    s += p('M150,24 L156,2 H254 L262,22 Z', J2, 2.4);
    s += p('M116,-4 C130,-10 268,-14 300,-4 C268,8 130,10 116,-4 Z', J, 3);
    s += p('M120,-16 C136,-34 210,-36 240,-18 C214,-4 140,-2 120,-16 Z', PAL.rouge, 2.8);
    s += a('M120,-16 C140,-6 214,-6 240,-18 C214,-4 140,-2 120,-16 Z', PAL.rougeO);
    s += '<ellipse class="an-helice" cx="114" cy="-16" rx="7" ry="46" fill="#c9c5b4" fill-opacity=".55" stroke="' + INK + '" stroke-width="2"/>' + cercle(114, -16, 7, PAL.noir, 2);
    return s;
  }
  /* l'eau qui tombe du ventre de l'avion et s'ouvre en rideau */
  function largage(x, y) {
    var s = '<g transform="translate(' + x + ',' + y + ')">', i;
    s += p('M0,0 L92,-4 C118,70 112,150 86,214 C30,250 -112,262 -186,226 C-168,160 -36,110 0,0 Z', '#bfe0e6', 3);
    s += a('M16,0 L74,-3 C96,70 88,150 66,206 C20,232 -90,240 -150,218 C-120,160 -14,100 16,0 Z', '#e3f2f3');
    [['M38,2 C44,70 30,140 -10,214', 5], ['M60,0 C72,70 64,140 44,206', 4], ['M22,4 C14,60 -30,130 -80,216', 4.5], ['M10,6 C-14,70 -70,130 -130,206', 3.5]].forEach(function (q) {
      s += '<path class="an-largage" d="' + q[0] + '" fill="none" stroke="#7fb9c8" stroke-width="' + q[1] + '" stroke-linecap="round" stroke-dasharray="30 16"/>';
    });
    for (i = 0; i < 16; i++) s += '<circle class="an-goutte" style="animation-delay:' + (-i * .19) + 's" cx="' + (-190 + i * 20) + '" cy="' + (214 + (i * 29) % 34) + '" r="' + (4 + i % 3) + '" fill="#bfe0e6" stroke="' + INK + '" stroke-width="1.4"/>';
    return s + '</g>';
  }
  function maison(x, y, k) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + R.rect(-50, -56, 100, 56, '#efe2bd', 2.4) + p('M-62,-54 L0,-96 L62,-54 Z', PAL.rouge, 2.4) + R.rect(-34, -40, 20, 24, '#7fa3ad', 1.8) + R.rect(14, -40, 20, 40, PAL.brun, 1.8) + '</g>';
  }
  function feu() {
    var s = R.af(0, 0, W, H, '#f0b061'), i;
    s += R.af(0, 0, W, 80, '#cf6a34') + R.af(0, 80, W, 80, '#e08a45');
    s += fumee(160, 120, 1.5, '#574840') + fumee(430, 90, 1.7, '#6b5a50') + fumee(300, 210, 1.2, '#85736a') + fumee(700, 180, .9, '#85736a');
    /* la colline et ses pins */
    s += p('M-5,340 C180,250 420,240 640,300 C840,250 1040,240 1205,320 V680 H-5 Z', '#7d7a48', 3);
    [[40, 330, .9, 1], [130, 306, 1, 1], [240, 288, 1.05, 1], [340, 284, 1, 1], [450, 292, .95, 1], [930, 268, .85, 0], [1010, 262, .9, 0], [1090, 272, .85, 0], [1170, 296, .9, 0]].forEach(function (q) { s += pin(q[0], q[1], q[2], q[3]); });
    s += maison(860, 318, .8) + maison(1000, 326, .9) + maison(1120, 340, .8);
    /* le front de flammes */
    [[70, 360, 1.05], [220, 340, 1.4], [370, 336, 1.55], [520, 346, 1.35], [650, 352, 1.05], [760, 356, .75]].forEach(function (q, j) { s += flamme(q[0], q[1], q[2], j); });
    /* le Canadair et son rideau d'eau, qui tombe sur le bout du front */
    s += largage(780, 138);
    s += fumee(610, 372, .62, '#efe9dc') + fumee(740, 376, .5, '#efe9dc');
    s += '<g class="an-avion"><g transform="translate(610,44) scale(1.04)">' + canadair() + '</g></g>';
    /* la route, le camion */
    s += p('M-5,424 C300,404 900,404 1205,428 V680 H-5 Z', '#8d8778', 3);
    for (i = 0; i < 6; i++) s += R.af(i * 210 + 30, 640, 110, 8, PAL.creme);
    s += '<g transform="translate(660,360) scale(.82)">' + p('M0,110 H440 V270 H0 Z', PAL.rouge, 3.6) + p('M440,140 H540 L600,200 V270 H440 Z', PAL.rouge, 3.6) + R.rect(460, 156, 80, 52, '#c9e0e2', 2.6) + a('M2,210 H598 V226 H2 Z', PAL.blanc) + t('M20,96 H420 M40,96 V110 M400,96 V110', 4) + L.ligne('POMPIERS', 220, 138, 48, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 5 }) + cercle(100, 272, 40, PAL.noir, 3) + cercle(100, 272, 16, PAL.grisC, 2) + cercle(500, 272, 40, PAL.noir, 3) + cercle(500, 272, 16, PAL.grisC, 2) + '</g>';
    /* le tuyau, le jet, les pompiers à la lance */
    s += membre('M680,590 C560,650 380,664 250,622', '#c6402d', 8);
    s += '<path class="an-largage" d="M352,456 C400,396 470,360 560,366" fill="none" stroke="#bfe0e6" stroke-width="9" stroke-linecap="round" stroke-dasharray="26 8"/>';
    s += gens(132, 624, .84, { cheveux2: 'casque', peau: 'b', haut: '#2c3a52', bas: '#2c3a52', bandes: true, pose: 'lance', bouche: 'crie' });
    s += gens(226, 648, .92, { cheveux2: 'casque', peau: 'a', haut: '#2c3a52', bas: '#2c3a52', bandes: true, pose: 'lance', bouche: 'crie' });
    s += R.rect(318, 450, 34, 12, PAL.noir, 2);
    /* les braises */
    for (i = 0; i < 14; i++) s += '<circle class="an-braise" style="animation-delay:' + (-i * .37) + 's" cx="' + (40 + i * 50) + '" cy="' + (300 + (i * 37) % 70) + '" r="' + (3 + i % 3) + '" fill="#ffd25e" stroke="' + INK + '" stroke-width="1"/>';
    return S.kase(W, H, 'Un feu de forêt : un Canadair largue son eau sur la colline en flammes, les pompiers tiennent la route à la lance.', s);
  }

  /* ---------- Les pièces communes des autres scènes ---------- */
  function vit(html, i) { return '<g class="an-gens" style="animation-delay:' + (-(i || 0) * .27) + 's">' + html + '</g>'; }
  function nuage(x, y, k, c) { return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')"><g class="an-fumee">' + p('M-70,20 C-90,20 -92,-6 -66,-8 C-62,-32 -24,-36 -14,-16 C0,-40 44,-34 44,-10 C70,-14 80,20 54,22 Z', c || PAL.blanc, 2.2) + '</g></g>'; }
  function arbre(x, y, k) { return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + p('M-9,0 L-6,-90 H6 L10,0 Z', PAL.brun, 2.4) + p('M-52,-80 C-78,-104 -56,-142 -28,-134 C-24,-168 28,-168 32,-136 C62,-140 78,-102 50,-78 C30,-64 -30,-64 -52,-80 Z', '#5d7f58', 2.6) + a('M-52,-80 C-30,-64 30,-64 50,-78 C40,-92 -30,-96 -52,-80 Z', '#435f42') + '</g>'; }
  function voiture(x, y, k, c, gauche) {
    var v = p('M-120,-20 C-120,-46 -96,-50 -78,-52 L-48,-88 C-44,-92 40,-92 50,-88 L84,-54 C110,-50 124,-40 124,-18 L124,0 H-120 Z', c, 3) + p('M-40,-82 H-4 V-54 H-66 Z', '#c9e0e2', 2.2) + p('M6,-82 H42 L68,-54 H6 Z', '#c9e0e2', 2.2) + cercle(-70, 2, 24, PAL.noir, 2.6) + cercle(-70, 2, 9, PAL.grisC, 1.6) + cercle(76, 2, 24, PAL.noir, 2.6) + cercle(76, 2, 9, PAL.grisC, 1.6);
    return '<g transform="translate(' + x + ',' + y + ') scale(' + (gauche ? -k : k) + ',' + k + ')">' + v + '</g>';
  }
  /* un immeuble de ville : le toit de zinc, les balcons, les fenêtres */
  function immeuble(x, w, sol, h, c, nb) {
    var haut = sol - h, s = p('M' + (x + 8) + ',' + (haut - 34) + ' H' + (x + w - 8) + ' L' + (x + w + 6) + ',' + haut + ' H' + (x - 6) + ' Z', '#6d7c88', 2.6);
    s += R.rect(x, haut, w, h, c, 2.8);
    var n = nb || 4, l = Math.floor((h - 90) / 72), pas = w / n;
    for (var i = 0; i < n; i++) for (var j = 0; j < l; j++) {
      var fx = x + pas * i + pas / 2 - 16, fy = haut + 18 + j * 72;
      s += R.rect(fx, fy, 32, 46, '#7fa3ad', 1.8) + t('M' + (fx + 16) + ',' + fy + ' v46', 1.2) + t('M' + (fx - 5) + ',' + (fy + 50) + ' h42', 3);
    }
    return s;
  }
  function brasero(x, y, k, i) {
    var s = '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')">' + p('M-44,-90 L44,-90 L36,0 L-36,0 Z', '#3b3a46', 3);
    [[-18, -66], [10, -66], [-24, -36], [4, -36], [24, -36], [-8, -14], [14, -14]].forEach(function (q) { s += cercle(q[0], q[1], 5, '#f4a13a', 1.4); });
    return s + '</g>' + flamme(x, y - 112 * k, .62 * k, i || 0);
  }
  function panneauBois(x, y, w, h, texte, taille, c, encre) { return '<g class="an-pancarte" style="transform-origin:50% 0">' + R.rect(x, y, w, h, c || PAL.blanc, 3) + L.ligne(texte, x + w / 2, y + (h - taille) / 2, taille, { ancre: 'm', encre: encre || PAL.rouge, gras: true, graine: 3 }) + '</g>'; }
  function gyro(x, y, c) { return '<circle class="an-clignote" cx="' + x + '" cy="' + y + '" r="20" fill="' + (c || '#5dc3ff') + '" fill-opacity=".55"/>' + cercle(x, y, 9, c || '#5dc3ff', 2); }

  var SCENES = {
    greve: greve,
    feu: feu,
    /* le cortège sur le boulevard */
    manif: function () {
      var s = R.af(0, 0, W, H, '#cfe2e6') + nuage(180, 60, .9) + nuage(1000, 46, .8) + immeuble(-20, 300, 400, 290, '#e6d6b4') + immeuble(280, 340, 400, 320, '#d9c49c', 5) + immeuble(620, 300, 400, 280, '#ead9b9') + immeuble(920, 300, 400, 310, '#d9c49c');
      s += R.af(0, 400, W, 280, '#b1afa3') + t('M0,400 H1200', 3);
      var fond = [[60, 'c', 'court', '#7d8f55'], [160, 'a', 'long', PAL.ocreO], [270, 'd', 'boucles', '#477a90'], [800, 'b', 'court', PAL.rougeO], [900, 'a', 'gris', '#6b6a5e'], [1010, 'c', 'long', '#2f8a8a'], [1120, 'b', 'casquette', PAL.marine]];
      fond.forEach(function (q, i) { s += vit(gens(q[0], 520, .72, { peau: q[1], cheveux2: q[2], cheveux: q[2] === 'gris' ? PAL.grisC : PAL.noir, haut: q[3], pose: i % 2 ? 'poing' : 'bas', bouche: 'crie' }), i); });
      s += gens(160, 540, .8, { peau: 'b', cheveux: PAL.brunO, haut: '#3b3a46', pose: 'pancarte', texte: 'RETRAIT', fond: '#f5d547', n: 1 }) + gens(960, 544, .8, { peau: 'd', cheveux: PAL.noir, haut: PAL.ocre, pose: 'pancarte', texte: 'ASSEZ !', n: 4 });
      [[370, 'a', 'long', '#b5552a', PAL.rouge], [465, 'c', 'court', PAL.noir, '#7d8f55'], [560, 'd', 'queue', PAL.noir, PAL.marine], [655, 'b', 'gris', PAL.grisC, PAL.ocreO], [750, 'a', 'casquette', PAL.brun, '#477a90']].forEach(function (q, i) { s += vit(gens(q[0], 580, .88, { peau: q[1], cheveux2: q[2], cheveux: q[3], haut: q[4], gilet: i % 2 ? PAL.rouge : null, pose: 'poing', bouche: 'crie' }), i + 3); });
      s += '<g class="an-banderole">' + p('M300,440 C480,424 700,452 860,432 L862,540 C700,560 480,530 302,548 Z', PAL.blanc, 3.2) + L.ligne('TOUS ENSEMBLE', 580, 468, 48, { ancre: 'm', encre: PAL.rouge, gras: true, graine: 3 }) + '</g>';
      s += gens(250, 640, .96, { peau: 'b', cheveux: PAL.noir, haut: '#7d8f55', gilet: PAL.rouge, pose: 'tient', bouche: 'crie' }) + gens(912, 642, .96, { g: true, peau: 'a', cheveux2: 'long', cheveux: PAL.ocreO, haut: PAL.marine, gilet: PAL.rouge, pose: 'tient', bouche: 'crie' });
      return S.kase(W, H, 'Un cortège de grévistes sur le boulevard, derrière la banderole de tête.', s);
    },
    /* le piquet devant l'usine */
    piquet: function () {
      var s = R.af(0, 0, W, H, '#c7c3d6') + nuage(220, 60, .9) + nuage(960, 50, .8), i;
      s += p('M0,110 L120,60 V110 L240,60 V110 L360,60 V110 L480,60 V110 L600,60 V110 L720,60 V110 L840,60 V110 L960,60 V110 L1080,60 V110 L1200,60 V300 H0 Z', '#8f5a48', 3);
      for (i = 0; i < 8; i++) s += R.rect(40 + i * 150, 140, 90, 70, '#4d6372', 2.4);
      s += R.af(0, 300, W, 380, '#95917f') + t('M0,300 H1200', 3);
      s += R.rect(320, 200, 40, 200, '#5d5c54', 2.8) + R.rect(840, 200, 40, 200, '#5d5c54', 2.8);
      for (i = 0; i < 16; i++) s += t('M' + (370 + i * 30) + ',210 V400', 5);
      s += t('M360,226 H840 M360,384 H840', 6);
      s += panneauBois(440, 150, 320, 84, 'EN GRÈVE', 50);
      for (i = 0; i < 5; i++) s += R.rect(60, 470 - i * 24, 190, 12, '#c79a5e', 2.2) + R.rect(66, 482 - i * 24, 26, 12, '#a87c45', 2) + R.rect(142, 482 - i * 24, 26, 12, '#a87c45', 2) + R.rect(218, 482 - i * 24, 26, 12, '#a87c45', 2);
      s += vit(gens(370, 480, .8, { peau: 'c', cheveux: PAL.noir, haut: '#7d8f55', pose: 'poing', bouche: 'crie' }), 1) + vit(gens(840, 484, .8, { g: true, peau: 'a', cheveux2: 'long', cheveux: '#b5552a', haut: PAL.rougeO, pose: 'poing', bouche: 'crie' }), 2);
      s += brasero(600, 590, 1.1, 1);
      s += gens(340, 620, .96, { peau: 'b', cheveux2: 'casquette', cheveux: PAL.brun, coiffe: PAL.rouge, haut: PAL.marine, gilet: PAL.rouge, pose: 'bas' });
      s += gens(470, 648, .98, { peau: 'd', cheveux2: 'boucles', cheveux: PAL.noir, haut: '#477a90', pose: 'tient' });
      s += gens(740, 648, .98, { g: true, peau: 'a', cheveux2: 'gris', cheveux: PAL.grisC, haut: PAL.brunO, pose: 'tient' });
      s += gens(960, 626, .96, { g: true, peau: 'c', cheveux2: 'queue', cheveux: PAL.noir, haut: '#3b3a46', gilet: PAL.rouge, pose: 'pancarte', texte: 'NON !', fond: '#f5d547', n: 2 });
      return S.kase(W, H, 'Un piquet de grève devant les grilles : palettes, brasero, grévistes qui se relaient.', s);
    },
    /* les poubelles qui débordent */
    eboueurs: function () {
      var s = R.af(0, 0, W, H, '#cfe2e6') + nuage(620, 60, .9) + immeuble(-20, 380, 410, 330, '#e6d6b4', 5) + immeuble(360, 420, 410, 300, '#d9c49c', 5) + immeuble(780, 440, 410, 340, '#ead9b9', 5);
      s += R.af(0, 410, W, 270, '#a39d8c') + t('M0,410 H1200', 3) + a('M0,600 H1200 V680 H0 Z', '#7f7b6d') + t('M0,600 H1200', 3);
      /* le camion de ramassage à l'arrêt */
      s += p('M820,300 H1140 V520 H820 Z', '#7d8f55', 3) + p('M1140,350 H1210 V520 H1140 Z', '#dfdac8', 3) + a('M820,430 H1210 V446 H820 Z', PAL.ocre) + L.ligne('PROPRETÉ', 980, 350, 40, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 6 }) + cercle(900, 526, 36, PAL.noir, 3) + cercle(900, 526, 13, PAL.grisC, 2) + cercle(1110, 526, 36, PAL.noir, 3) + cercle(1110, 526, 13, PAL.grisC, 2);
      /* la montagne de sacs */
      [[40, 560, 62, '#3b3a46'], [130, 540, 72, '#26201c'], [230, 566, 66, '#4d6372'], [330, 544, 78, '#3b3a46'], [430, 570, 60, '#26201c'], [100, 480, 58, '#4d6372'], [200, 462, 64, '#3b3a46'], [300, 482, 58, '#26201c'], [190, 400, 48, '#26201c'], [530, 584, 50, '#4d6372']].forEach(function (q) {
        s += p('M' + (q[0] - q[2]) + ',' + (q[1] + q[2] * .8) + ' C' + (q[0] - q[2] * 1.2) + ',' + (q[1] - q[2] * .4) + ' ' + (q[0] - q[2] * .4) + ',' + (q[1] - q[2]) + ' ' + q[0] + ',' + (q[1] - q[2] * .9) + ' C' + (q[0] + q[2] * .5) + ',' + (q[1] - q[2]) + ' ' + (q[0] + q[2] * 1.2) + ',' + (q[1] - q[2] * .3) + ' ' + (q[0] + q[2]) + ',' + (q[1] + q[2] * .8) + ' Z', q[3], 2.8) + t('M' + (q[0] - 12) + ',' + (q[1] - q[2] * .8) + ' q12,10 24,0', 2).replace('stroke="' + INK + '"', 'stroke="#8d8d84"');
      });
      /* les rats */
      s += '<g class="an-route">' + p('M480,644 C490,622 540,620 556,640 L574,646 L556,650 C540,658 494,658 480,644 Z', '#6b6a5e', 2.4) + t('M482,646 C460,650 450,640 440,650', 3) + cercle(544, 636, 3, INK, 0) + '</g>';
      /* le gréviste au gilet et la passante qui se bouche le nez */
      s += vit(gens(690, 600, 1, { peau: 'c', cheveux2: 'casquette', cheveux: PAL.noir, coiffe: '#e2732b', haut: '#e2732b', bas: '#27395c', bandes: true, pose: 'pancarte', texte: 'GRÈVE', n: 3, bouche: 'crie' }), 1);
      s += gens(540, 590, .92, { peau: 'a', cheveux2: 'long', cheveux: PAL.brunO, haut: '#6b6a5e', long: true, pose: 'tel', bouche: 'triste', marche: true });
      return S.kase(W, H, 'La grève des éboueurs : les sacs s’entassent sur le trottoir, le camion ne repart pas.', s);
    },
    /* l'usine qui ferme */
    usine: function () {
      var s = R.af(0, 0, W, H, '#d8c8a6') + a('M0,150 C300,110 800,180 1200,130 V300 H0 Z', '#cdb88f'), i;
      [[300, 60, 170], [400, 110, 130], [800, 40, 190], [920, 90, 150]].forEach(function (q) { s += p('M' + q[0] + ',260 L' + (q[0] + 10) + ',' + q[1] + ' H' + (q[0] + 44) + ' L' + (q[0] + 54) + ',260 Z', '#8f5a48', 3) + a('M' + (q[0] + 8) + ',' + (q[1] + 20) + ' H' + (q[0] + 46) + ' V' + (q[1] + 34) + ' H' + (q[0] + 8) + ' Z', PAL.creme); });
      s += p('M0,240 L120,190 V240 L240,190 V240 L360,190 V240 L480,190 V240 L600,190 V240 L720,190 V240 L840,190 V240 L960,190 V240 L1080,190 V240 L1200,190 V420 H0 Z', '#b0603f', 3);
      for (i = 0; i < 8; i++) s += R.rect(40 + i * 150, 270, 90, 66, '#3b4a55', 2.4) + t('M' + (40 + i * 150) + ',270 L' + (130 + i * 150) + ',336 M' + (130 + i * 150) + ',270 L' + (40 + i * 150) + ',336', 2.4);
      s += R.af(0, 420, W, 260, '#8d8778') + t('M0,420 H1200', 3);
      s += R.rect(380, 300, 34, 190, '#5d5c54', 2.8) + R.rect(790, 300, 34, 190, '#5d5c54', 2.8);
      for (i = 0; i < 13; i++) s += t('M' + (424 + i * 28) + ',320 V490', 5);
      s += t('M414,340 H790 M414,470 H790', 6);
      s += panneauBois(470, 240, 260, 80, 'FERMÉ', 52);
      var q = [[110, 'a', 'court', PAL.marine, 'pancarte', 'crie'], [230, 'd', 'boucles', '#7d8f55', 'bas', 'triste'], [340, 'b', 'casquette', '#477a90', 'poing', 'crie'], [470, 'c', 'long', PAL.ocreO, 'bas', 'triste'], [760, 'a', 'gris', '#6b6a5e', 'bas', 'triste'], [880, 'c', 'court', PAL.rougeO, 'poing', 'crie'], [1010, 'b', 'queue', '#2f8a8a', 'montre', 'triste'], [1120, 'd', 'court', '#3b3a46', 'bas', 'triste']];
      q.forEach(function (g, i) { var h = gens(g[0], 610 + (i % 2) * 26, .9, { peau: g[1], cheveux2: g[2], cheveux: g[2] === 'gris' ? PAL.grisC : PAL.noir, haut: g[3], pose: g[4], bouche: g[5], g: g[0] > 600, texte: 'NON !', fond: PAL.blanc, n: 2 }); s += g[4] === 'poing' || g[4] === 'pancarte' ? vit(h, i) : h; });
      return S.kase(W, H, 'L’usine a fermé : les cheminées froides, la grille cadenassée, les salariés devant.', s);
    },
    /* le boulevard, vivant et lisible */
    ville: function () {
      var s = R.af(0, 0, W, H, '#cfe2e6') + nuage(160, 70, .9) + nuage(760, 44, 1) + immeuble(-30, 330, 430, 370, '#e6d6b4', 4) + immeuble(300, 300, 430, 330, '#d9c49c', 4) + immeuble(600, 320, 430, 380, '#ead9b9', 4) + immeuble(920, 310, 430, 340, '#d9c49c', 4);
      /* le café et sa terrasse */
      s += R.rect(620, 340, 280, 90, '#8d2a20', 2.8) + R.rect(650, 356, 90, 74, '#7fa3ad', 2) + R.rect(780, 356, 90, 74, '#7fa3ad', 2) + p('M606,322 H914 L934,360 H586 Z', '#c6402d', 2.8) + L.ligne('CAFÉ', 760, 328, 26, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 3 });
      /* la boulangerie */
      s += R.rect(40, 346, 220, 84, '#27395c', 2.8) + R.rect(66, 360, 170, 70, '#efe2bd', 2) + L.ligne('BOULANGERIE', 150, 326, 22, { ancre: 'm', encre: INK, gras: true, graine: 4 });
      s += R.af(0, 430, W, 110, '#c9c5b4') + t('M0,430 H1200 M0,540 H1200', 3) + R.af(0, 540, W, 140, '#6f6c61');
      for (var i = 0; i < 6; i++) s += R.af(30 + i * 210, 606, 110, 9, PAL.creme);
      s += arbre(320, 500, 1.2) + arbre(1000, 500, 1.2);
      /* les gens, en entier */
      s += vit(gens(120, 528, .62, { peau: 'd', cheveux2: 'long', cheveux: PAL.noir, haut: PAL.ocre, marche: true }), 1) + gens(440, 530, .62, { peau: 'a', cheveux2: 'gris', cheveux: PAL.grisC, haut: '#6b6a5e', long: true, g: true }) + gens(530, 532, .62, { peau: 'c', haut: '#477a90', pose: 'tel', marche: true }) + vit(gens(860, 532, .62, { peau: 'b', cheveux2: 'queue', cheveux: PAL.brunO, haut: PAL.rougeO, g: true, marche: true }), 3);
      /* les voitures qui roulent */
      s += '<g class="an-route">' + voiture(280, 600, .9, PAL.rouge) + voiture(820, 594, .86, '#477a90') + '</g>';
      return S.kase(W, H, 'Un boulevard de grande ville : immeubles, café, boulangerie, passants et voitures.', s);
    },
    /* le rayon de supermarché */
    caddie: function () {
      var s = R.af(0, 0, W, H, '#efe2bd') + R.af(0, 0, W, 60, '#fdf8ea') + t('M0,60 H1200', 3), i, j;
      for (i = 0; i < 5; i++) s += a('M' + (60 + i * 240) + ',16 h130 v18 h-130 Z', '#fff7cf');
      /* les rayons */
      for (j = 0; j < 4; j++) {
        s += R.rect(-5, 110 + j * 96, 800, 14, '#8d8d84', 2.4);
        for (i = 0; i < 14; i++) if ((i * 7 + j * 3) % 4) s += R.rect(16 + i * 56, 56 + j * 96 + 6 + (i % 2) * 6, 40, 48 - (i % 2) * 6, [PAL.rouge, '#477a90', PAL.ocre, '#7d8f55', PAL.creme][(i + j) % 5], 2);
      }
      s += R.af(0, 500, W, 180, '#c9c5b4') + t('M0,500 H1200', 3);
      /* l'étiquette qui grimpe */
      s += '<g class="an-gens">' + R.rect(820, 90, 340, 230, PAL.blanc, 3.4) + a('M820,90 h340 v54 h-340 Z', PAL.rouge) + t('M820,144 h340', 3) + L.ligne('PRIX', 990, 102, 30, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 2 }) + L.ligne('+15 %', 990, 176, 86, { ancre: 'm', encre: PAL.rouge, gras: true, graine: 3 }) + '</g>' + t('M890,0 V90 M1090,0 V90', 4);
      /* le caddie presque vide, la cliente */
      s += '<g transform="translate(640,630)"><path d="M-170,-210 L-140,-60 H100 L136,-190 Z" fill="#c9e0e2" fill-opacity=".4" stroke="' + INK + '" stroke-width="3"/>' + t('M-160,-160 H126 M-150,-110 H112 M-90,-210 L-80,-60 M-20,-205 V-60 M50,-200 L44,-60', 2.2) + t('M136,-190 L176,-240 H220', 5) + t('M-140,-60 L-150,-20 H100', 4) + cercle(-120, 0, 18, PAL.noir, 2.6) + cercle(80, 0, 18, PAL.noir, 2.6) + R.rect(-60, -110, 50, 50, PAL.rouge, 2.2) + '</g>';
      s += gens(980, 650, 1.08, { g: true, peau: 'd', cheveux2: 'boucles', cheveux: PAL.noir, haut: '#7d8f55', long: true, bas: '#27395c', pose: 'tient', bouche: 'triste' });
      s += gens(230, 620, 1, { peau: 'a', cheveux2: 'gris', cheveux: PAL.grisC, haut: '#6b6a5e', pose: 'montre', bouche: 'triste' });
      return S.kase(W, H, 'Au supermarché : les rayons se vident, l’étiquette affiche plus 15 %, le caddie reste presque vide.', s);
    },
    /* le chantier */
    relance: function () {
      var s = R.af(0, 0, W, H, '#cfe2e6') + nuage(240, 70, .9) + nuage(760, 50, .8), i, j;
      s += R.af(0, 480, W, 200, '#b89a6a') + t('M0,480 H1200', 3);
      /* l'immeuble en construction et ses échafaudages */
      s += R.rect(560, 170, 480, 310, '#d6d2c2', 3);
      for (i = 0; i < 5; i++) for (j = 0; j < 4; j++) s += R.rect(590 + i * 90, 190 + j * 72, 56, 50, j < 2 ? '#7fa3ad' : '#3b3a46', 2);
      for (i = 0; i < 6; i++) s += t('M' + (540 + i * 110) + ',150 V480', 4);
      for (j = 0; j < 4; j++) s += t('M530,' + (170 + j * 90) + ' H1090', 4);
      /* la grue et sa charge qui se balance */
      s += t('M180,480 V90', 14) + t('M180,480 V90', 7).replace('stroke="' + INK + '"', 'stroke="#dfa93c"');
      s += membre('M60,110 H620', '#dfa93c', 12) + R.rect(120, 118, 90, 70, '#c6402d', 2.6) + t('M180,90 L60,108 M180,90 L560,108', 2.4);
      s += '<g class="an-pancarte" style="transform-origin:50% 0">' + t('M480,116 V300', 3) + R.rect(420, 300, 120, 56, '#8d2a20', 2.8) + t('M420,300 L480,262 L540,300', 2.4) + '</g>';
      /* les ouvriers */
      s += vit(gens(330, 610, .96, { cheveux2: 'casque', peau: 'c', haut: '#e2732b', bas: '#27395c', bandes: true, pose: 'poing' }), 1);
      s += gens(470, 640, 1, { cheveux2: 'casque', peau: 'a', haut: '#27395c', bas: '#3b3a46', bandes: true, pose: 'tel' });
      s += gens(780, 630, .98, { g: true, cheveux2: 'casque', peau: 'd', haut: '#e2732b', bas: '#27395c', bandes: true, pose: 'tient' });
      s += gens(940, 610, .92, { cheveux2: 'casque', peau: 'b', haut: PAL.marine, bas: '#3b3a46', gilet: '#f5d547', pose: 'bas' });
      s += R.rect(50, 590, 150, 60, '#a87c45', 2.6) + R.rect(70, 546, 110, 44, '#c79a5e', 2.6);
      return S.kase(W, H, 'Un grand chantier repart : la grue, l’immeuble en travaux, les ouvriers.', s);
    },
    /* les urgences */
    hopital: function () {
      var s = R.af(0, 0, W, H, '#d3e3e3') + nuage(180, 50, .8), i, j;
      s += R.rect(200, 80, 800, 380, '#efe9dc', 3);
      for (i = 0; i < 7; i++) for (j = 0; j < 2; j++) s += R.rect(232 + i * 108, 100 + j * 76, 74, 54, '#7fa3ad', 2);
      s += R.rect(240, 260, 720, 66, '#c6402d', 3) + '<g class="an-clignote">' + L.ligne('URGENCES', 600, 272, 46, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 3 }) + '</g>';
      s += R.rect(460, 330, 280, 130, '#7fa3ad', 3) + t('M600,330 V460', 3);
      s += R.af(0, 460, W, 220, '#a39d8c') + t('M0,460 H1200', 3);
      /* l'ambulance */
      s += p('M780,360 H1110 V540 H780 Z', PAL.blanc, 3) + p('M1110,410 H1200 V540 H1110 Z', PAL.blanc, 3) + a('M780,470 H1200 V492 H780 Z', '#c6402d') + R.rect(1124, 424, 62, 44, '#c9e0e2', 2.2) + R.rect(920, 390, 20, 60, '#c6402d', 0) + R.rect(900, 410, 60, 20, '#c6402d', 0) + gyro(960, 346) + cercle(860, 544, 36, PAL.noir, 3) + cercle(860, 544, 13, PAL.grisC, 2) + cercle(1120, 544, 36, PAL.noir, 3) + cercle(1120, 544, 13, PAL.grisC, 2);
      /* la file qui attend */
      [[80, 'a', 'gris', '#6b6a5e', 'bas'], [170, 'c', 'court', '#7d8f55', 'montre'], [260, 'd', 'long', PAL.ocreO, 'tel'], [350, 'b', 'queue', '#477a90', 'bas'], [440, 'a', 'court', PAL.rougeO, 'montre'], [530, 'c', 'boucles', '#3b3a46', 'bas']].forEach(function (q) { s += gens(q[0], 600, .86, { peau: q[1], cheveux2: q[2], cheveux: q[2] === 'gris' ? PAL.grisC : PAL.noir, haut: q[3], pose: q[4], bouche: 'triste', long: true }); });
      /* l'infirmière, débordée */
      s += vit(gens(680, 640, 1, { g: true, peau: 'd', cheveux2: 'queue', cheveux: PAL.noir, haut: '#8fc0c8', bas: '#8fc0c8', pose: 'tient', marche: true }), 1);
      return S.kase(W, H, 'Les urgences débordées : la file d’attente, l’ambulance, une infirmière qui court.', s);
    },
    /* la campagne */
    nature: function () {
      var s = R.af(0, 0, W, H, '#cfe6ea') + nuage(240, 80, 1) + nuage(800, 56, .9) + cercle(1060, 90, 44, '#f5d547', 2.6), i;
      s += p('M-5,300 C200,220 460,240 640,280 C840,220 1040,230 1205,280 V680 H-5 Z', '#8fae6a', 3);
      /* la ferme */
      s += R.rect(120, 190, 240, 130, '#c6402d', 3) + p('M100,194 L240,110 L380,194 Z', '#6b6a5e', 3) + R.rect(206, 240, 68, 80, '#8d2a20', 2.4) + t('M206,240 L274,320 M274,240 L206,320', 2.4) + arbre(450, 320, 1.1);
      /* les sillons */
      s += p('M-5,400 C300,360 900,360 1205,400 V680 H-5 Z', '#b4924f', 3);
      for (i = 0; i < 9; i++) s += t('M' + (-200 + i * 180) + ',680 C' + (i * 110) + ',520 ' + (240 + i * 90) + ',440 ' + (320 + i * 70) + ',384', 3);
      /* la vache */
      s += '<g transform="translate(660,340) scale(.9)">' + p('M-90,-60 C-60,-80 50,-80 80,-62 L84,10 H60 V-16 H-60 V10 H-86 Z', PAL.blanc, 3) + a('M-60,-68 C-30,-74 -10,-60 -20,-36 C-40,-24 -70,-34 -60,-68 Z', INK) + a('M30,-70 C56,-70 70,-50 60,-30 C40,-30 20,-50 30,-70 Z', INK) + p('M80,-70 C104,-84 134,-78 136,-52 C136,-34 112,-28 90,-34 Z', PAL.blanc, 3) + a('M110,-46 C124,-50 138,-46 136,-38 C124,-30 110,-34 110,-46 Z', '#e8a7a0') + cercle(112, -62, 3, INK, 0) + t('M92,-78 L84,-96 M112,-80 L118,-98', 3) + '</g>';
      /* le tracteur qui avance */
      s += '<g class="an-route"><g transform="translate(460,420)">' + p('M-90,50 H110 V110 H-90 Z', PAL.rouge, 3) + p('M-40,-40 H70 L80,50 H-46 Z', '#c9e0e2', 3) + a('M-40,-40 H70 V-28 H-40 Z', PAL.rouge) + t('M100,50 V-10', 8) + cercle(-54, 124, 62, PAL.noir, 3) + cercle(-54, 124, 24, PAL.ocre, 2.4) + cercle(96, 136, 40, PAL.noir, 3) + cercle(96, 136, 15, PAL.ocre, 2.2) + '</g></g>';
      s += gens(980, 640, 1.04, { g: true, peau: 'b', cheveux2: 'casquette', cheveux: PAL.brunO, coiffe: '#477a90', haut: '#477a90', bas: '#27395c', pose: 'tient' });
      return S.kase(W, H, 'La campagne : la ferme, la vache, le tracteur rouge dans les sillons.', s);
    },
    /* la canicule */
    chaleur: function () {
      var s = R.af(0, 0, W, H, '#f6d48c'), i;
      s += '<g class="an-gens">' + cercle(1020, 120, 92, '#f5a93a', 3) + '</g>';
      for (i = 0; i < 12; i++) { var an = i * Math.PI / 6; s += t('M' + (1020 + Math.cos(an) * 110) + ',' + (120 + Math.sin(an) * 110) + ' L' + (1020 + Math.cos(an) * 150) + ',' + (120 + Math.sin(an) * 150), 5); }
      s += immeuble(-20, 340, 440, 340, '#e8cf9b', 4) + immeuble(320, 340, 440, 300, '#dfc38a', 4);
      /* la pharmacie et sa croix */
      s += R.rect(60, 330, 240, 110, '#3f7f55', 2.8) + R.rect(90, 346, 180, 94, '#c9e0e2', 2);
      s += t('M180,200 V330', 6) + R.rect(120, 130, 120, 76, '#191613', 3) + '<g class="an-clignote">' + L.ligne('42 °C', 180, 150, 36, { ancre: 'm', encre: '#7fe08a', gras: true, graine: 3 }) + '</g>';
      s += R.af(0, 440, W, 240, '#c7b07e') + t('M0,440 H1200', 3);
      /* les ondes de chaleur */
      for (i = 0; i < 6; i++) s += '<path class="an-largage" d="M' + (720 + i * 80) + ',420 q-16,-30 0,-60 q16,-30 0,-60" fill="none" stroke="#e2732b" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="20 12"/>';
      /* la fontaine, les gens */
      s += '<g transform="translate(860,610)">' + p('M-150,-40 C-140,10 140,10 150,-40 Z', '#c9c5b4', 3) + p('M-146,-40 C-100,-54 100,-54 146,-40 C100,-28 -100,-28 -146,-40 Z', '#8fc8d8', 2.4) + t('M0,-44 V-150', 8) + '<path class="an-largage" d="M0,-150 C-30,-180 -70,-120 -80,-50 M0,-150 C30,-180 70,-120 80,-50" fill="none" stroke="#6fb0c8" stroke-width="5" stroke-dasharray="14 10" stroke-linecap="round"/></g>';
      s += gens(420, 640, 1, { peau: 'a', cheveux2: 'gris', cheveux: PAL.grisC, haut: PAL.blanc, bas: '#c79a5e', pose: 'assis', bouche: 'triste' }) + R.rect(370, 590, 160, 16, '#6d4a2f', 2.4) + t('M390,606 V650 M510,606 V650', 5);
      s += vit(gens(620, 620, .96, { peau: 'c', cheveux: PAL.noir, haut: '#e8a7a0', bas: '#477a90', pose: 'tel', bouche: 'triste', marche: true }), 1);
      s += gens(240, 620, .96, { peau: 'd', cheveux2: 'long', cheveux: PAL.noir, haut: PAL.ocre, bas: '#3b3a46', pose: 'montre', bouche: 'triste' });
      return S.kase(W, H, 'La canicule : 42 degrés à la croix de la pharmacie, tout le monde cherche l’ombre et la fontaine.', s);
    },
    /* l'inondation */
    pluie: function () {
      var s = R.af(0, 0, W, H, '#8d9aa6') + nuage(260, 70, 1.5, '#6b7680') + nuage(760, 60, 1.7, '#5d6872') + nuage(1080, 90, 1.2, '#6b7680'), i;
      s += immeuble(-20, 380, 480, 380, '#c9bfa4', 5) + immeuble(360, 420, 480, 340, '#b9ae92', 5) + immeuble(780, 440, 480, 390, '#c9bfa4', 5);
      /* la voiture noyée, l'eau */
      s += voiture(880, 500, .9, PAL.rouge);
      s += p('M-5,440 C200,424 400,456 600,440 C800,424 1000,456 1205,438 V680 H-5 Z', '#5f8aa0', 3);
      s += a('M-5,520 C200,504 400,536 600,520 C800,504 1000,536 1205,518 V680 H-5 Z', '#4f7a90');
      for (i = 0; i < 7; i++) s += t('M' + (40 + i * 170) + ',' + (580 + (i % 3) * 24) + ' q30,-12 60,0 t60,0', 2.6);
      /* la barque des secours */
      s += '<g class="an-banderole"><g transform="translate(380,540)">';
      s += gens(-40, 30, .86, { peau: 'b', cheveux2: 'casque', haut: '#2c3a52', bas: '#2c3a52', bandes: true, pose: 'lance' }) + gens(70, 30, .78, { peau: 'd', cheveux2: 'long', cheveux: PAL.noir, haut: '#7d8f55', pose: 'bas', bouche: 'triste' }) + gens(160, 30, .66, { peau: 'a', cheveux: PAL.brunO, haut: PAL.ocre, pose: 'poing' });
      s += p('M-170,-30 H250 C240,30 200,60 160,60 H-100 C-140,60 -160,20 -170,-30 Z', '#e2732b', 3.2) + a('M-170,-30 H250 C248,-20 246,-12 244,-6 H-164 C-166,-12 -168,-22 -170,-30 Z', PAL.blanc) + '</g></g>';
      /* la pluie */
      var pl = ''; for (i = 0; i < 44; i++) pl += 'M' + (i * 29 + (i % 3) * 8) + ',' + ((i * 83) % 620) + ' l-10,36 ';
      s += '<path class="an-pluie" d="' + pl + '" fill="none" stroke="#dfeef2" stroke-width="3" stroke-linecap="round"/>';
      return S.kase(W, H, 'Une rue inondée sous la pluie : la barque des secours, une voiture noyée.', s);
    },
    /* la salle de marché */
    bourse: function () {
      var s = R.af(0, 0, W, H, '#22345a') + R.af(0, 0, W, 40, '#182642'), i;
      /* le grand écran et sa courbe */
      s += R.rect(150, 60, 900, 300, '#10192e', 4);
      for (i = 1; i < 6; i++) s += '<path d="M160,' + (60 + i * 50) + ' H1040" stroke="#2f4772" stroke-width="2"/>';
      for (i = 1; i < 9; i++) s += '<path d="M' + (150 + i * 100) + ',70 V350" stroke="#2f4772" stroke-width="2"/>';
      s += '<path class="an-courbe" d="M170,320 L280,300 L350,316 L470,250 L540,270 L650,190 L730,214 L850,120 L1020,84" fill="none" stroke="#ff7a5a" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>';
      s += L.ligne('TAUX DE LA DETTE', 180, 76, 28, { encre: '#ffcf5a', gras: true, graine: 2 });
      s += '<g class="an-clignote">' + L.ligne('+3,8 %', 700, 72, 40, { ancre: 'd', encre: '#ff7a5a', gras: true, graine: 3 }) + '</g>';
      s += R.af(0, 360, W, 320, '#3a4a6a') + t('M0,360 H1200', 3);
      /* les traders debout, derrière leurs bureaux */
      [[140, 'a', 'court', '#3b3a46', 'tel', 'crie'], [320, 'c', 'long', '#6b6a5e', 'poing', 'crie'], [500, 'b', 'gris', '#27395c', 'tel', 'crie'], [700, 'd', 'court', '#3b3a46', 'poing', 'crie'], [880, 'a', 'queue', '#7d8f55', 'tel', 'crie'], [1060, 'c', 'boucles', '#27395c', 'montre', 'triste']].forEach(function (q, i) { s += vit(gens(q[0], 530, .92, { peau: q[1], cheveux2: q[2], cheveux: q[2] === 'gris' ? PAL.grisC : PAL.noir, haut: q[3], bas: '#26201c', pose: q[4], bouche: q[5], g: q[0] > 600 }), i); });
      /* les bureaux et les écrans */
      s += p('M-5,500 H1205 V680 H-5 Z', '#6d4a2f', 3) + a('M-5,500 H1205 V520 H-5 Z', '#8a6240');
      for (i = 0; i < 6; i++) s += R.rect(60 + i * 190, 430, 130, 84, '#191613', 3) + '<path d="M' + (72 + i * 190) + ',' + (500 - (i % 2) * 14) + ' L' + (110 + i * 190) + ',480 L' + (140 + i * 190) + ',' + (488 - (i % 3) * 10) + ' L' + (180 + i * 190) + ',446" fill="none" stroke="#ff7a5a" stroke-width="4"/>';
      return S.kase(W, H, 'Une salle de marché en panique devant la courbe des taux de la dette française.', s);
    },
    /* le rond-point */
    rondpoint: function () {
      var s = R.af(0, 0, W, H, '#cfe2e6') + nuage(200, 70, 1) + nuage(900, 50, .9), i;
      s += p('M-5,250 C300,210 900,210 1205,250 V680 H-5 Z', '#8fae6a', 3);
      s += R.af(0, 270, W, 110, '#7f7b6d') + t('M0,270 H1200 M0,380 H1200', 3);
      /* la file de voitures à l'arrêt */
      s += voiture(170, 350, .72, '#477a90') + voiture(390, 350, .72, PAL.ocre) + voiture(610, 350, .72, '#6b6a5e') + voiture(830, 350, .72, PAL.rouge) + voiture(1050, 350, .72, '#7d8f55');
      /* l'îlot */
      s += '<ellipse cx="600" cy="560" rx="640" ry="170" fill="#a4bd7a" stroke="' + INK + '" stroke-width="3"/><ellipse cx="600" cy="560" rx="660" ry="186" fill="none" stroke="' + PAL.blanc + '" stroke-width="6"/>';
      /* les pneus, le panneau */
      [[950, 560], [1010, 560], [980, 524]].forEach(function (q) { s += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="42" ry="20" fill="#26201c" stroke="' + INK + '" stroke-width="3"/><ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="18" ry="8" fill="#6b6a5e"/>'; });
      s += t('M130,560 V400', 7) + panneauBois(20, 340, 220, 80, 'ON RESTE', 34, '#f5d547');
      s += brasero(600, 590, 1, 2);
      var G = '#f5d547';
      [[320, 'a', 'gris', '#6b6a5e', 'poing', 'crie'], [420, 'c', 'court', '#3b3a46', 'tient', 'ferme'], [800, 'b', 'long', PAL.rougeO, 'poing', 'crie'], [890, 'd', 'casquette', '#27395c', 'tient', 'ferme']].forEach(function (q, i) { s += vit(gens(q[0], 590, .92, { peau: q[1], cheveux2: q[2], cheveux: q[2] === 'gris' ? PAL.grisC : PAL.noir, coiffe: '#c6402d', haut: q[3], gilet: G, pose: q[4], bouche: q[5], g: q[0] > 600 }), i); });
      s += gens(480, 660, 1.04, { peau: 'b', cheveux: PAL.brunO, haut: '#477a90', gilet: G, pose: 'tient' }) + gens(720, 662, 1.04, { g: true, peau: 'd', cheveux2: 'boucles', cheveux: PAL.noir, haut: PAL.brunO, gilet: G, pose: 'pancarte', texte: 'PRIX !', n: 2 });
      return S.kase(W, H, 'Un rond-point occupé par des manifestants en gilet jaune, autour d’un brasero.', s);
    },
    /* la Cour des comptes */
    cour: function () {
      var s = R.af(0, 0, W, H, '#cfe2e6') + nuage(1060, 60, .8), i;
      s += p('M170,150 L600,50 L1030,150 Z', '#e6dfca', 3) + R.rect(190, 150, 820, 44, '#efe9dc', 3) + L.ligne('COUR DES COMPTES', 600, 158, 32, { ancre: 'm', encre: INK, gras: true, graine: 3 });
      s += R.rect(210, 194, 780, 256, '#e6dfca', 3);
      for (i = 0; i < 7; i++) s += R.rect(230 + i * 112, 194, 46, 256, '#f4eedd', 2.6) + t('M' + (242 + i * 112) + ',204 V440 M' + (264 + i * 112) + ',204 V440', 1.6);
      s += R.rect(150, 450, 900, 26, '#d6d0ba', 3) + R.rect(110, 476, 980, 26, '#c9c3ac', 3) + R.af(0, 502, W, 178, '#a39d8c') + t('M0,502 H1200', 3);
      /* les magistrats, le dossier */
      s += gens(390, 610, .98, { peau: 'a', cheveux2: 'gris', cheveux: PAL.grisC, haut: '#26201c', bas: '#26201c', long: true, pose: 'tient' });
      s += gens(830, 612, .98, { g: true, peau: 'c', cheveux2: 'long', cheveux: PAL.noir, haut: '#26201c', bas: '#26201c', long: true, pose: 'tient' });
      /* le rapport et son tampon */
      s += '<g class="an-gens">' + R.rect(470, 330, 280, 330, PAL.blanc, 3.4) + a('M470,330 h280 v56 h-280 Z', PAL.marine) + L.ligne('RAPPORT', 610, 342, 32, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 2 }) + t('M500,410 H720 M500,436 H720 M500,462 H660 M500,596 H720 M500,622 H680', 2.2) + '<g transform="rotate(-9 610 530)">' + p('M500,490 H720 V568 H500 Z', 'none', 5).replace('stroke="' + INK + '"', 'stroke="#c6402d"') + L.ligne('PEU CRÉDIBLE', 610, 514, 28, { ancre: 'm', encre: '#c6402d', gras: true, graine: 4 }) + '</g></g>';
      return S.kase(W, H, 'La façade de la Cour des comptes, deux magistrats et un rapport tamponné « peu crédible ».', s);
    },
    /* le commissariat */
    police: function () {
      var s = R.af(0, 0, W, H, '#b8cdd8') + nuage(180, 60, .9), i, j;
      s += R.rect(120, 90, 700, 380, '#e0dccb', 3);
      for (i = 0; i < 6; i++) for (j = 0; j < 2; j++) s += R.rect(150 + i * 110, 110 + j * 80, 70, 56, '#7fa3ad', 2);
      s += R.rect(220, 270, 500, 66, '#27395c', 3) + L.ligne('POLICE', 470, 280, 48, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 3 });
      s += R.rect(400, 340, 140, 130, '#4a3120', 3) + t('M470,340 V470', 3);
      /* le drapeau */
      s += t('M770,90 V10', 5) + '<g class="an-pancarte" style="transform-origin:0 50%">' + p('M772,12 H802 V62 H772 Z', '#27508f', 2) + p('M802,12 H832 V62 H802 Z', PAL.blanc, 2) + p('M832,12 H862 V62 H832 Z', PAL.rouge, 2) + '</g>';
      s += R.af(0, 470, W, 210, '#8d8778') + t('M0,470 H1200', 3);
      /* le fourgon */
      s += p('M760,300 H1100 L1180,390 V520 H760 Z', PAL.blanc, 3) + a('M762,430 H1178 V462 H762 Z', '#27508f') + p('M1100,316 L1160,386 H1050 V316 Z', '#c9e0e2', 2.4) + R.rect(790, 330, 200, 56, '#3b4a55', 2.4) + L.ligne('POLICE', 900, 434, 26, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 4 }) + gyro(900, 284) + cercle(850, 526, 38, PAL.noir, 3) + cercle(850, 526, 14, PAL.grisC, 2) + cercle(1100, 526, 38, PAL.noir, 3) + cercle(1100, 526, 14, PAL.grisC, 2);
      /* les trois agents */
      [[250, 'a', 'tient'], [420, 'd', 'bas'], [600, 'b', 'bas']].forEach(function (q, i) { s += gens(q[0], 620 + (i % 2) * 22, 1, { peau: q[1], cheveux2: 'casquette', cheveux: PAL.noir, coiffe: '#1a2743', haut: '#27395c', bas: '#1a2743', pose: q[2] }); });
      return S.kase(W, H, 'Le commissariat, le fourgon et trois agents devant la porte.', s);
    },
    /* le poste-frontière */
    frontiere: function () {
      var s = R.af(0, 0, W, H, '#cfe6ee') + nuage(300, 70, .9) + nuage(900, 50, 1);
      s += p('M-5,330 L180,110 L300,240 L470,70 L690,280 L880,120 L1060,270 L1205,160 V500 H-5 Z', '#8f9aa8', 3);
      s += p('M180,110 L142,156 L176,146 L206,168 L232,168 Z', PAL.blanc, 2.4) + p('M470,70 L420,120 L460,110 L500,132 L520,118 Z', PAL.blanc, 2.4) + p('M880,120 L842,160 L882,150 L926,166 Z', PAL.blanc, 2.4);
      s += R.af(0, 400, W, 280, '#7f7b6d') + t('M0,400 H1200', 3) + R.af(0, 370, W, 30, '#8fae6a') + t('M0,370 H1200', 2.4);
      s += '<path d="M0,540 H1200" stroke="' + PAL.creme + '" stroke-width="8" stroke-dasharray="90 60"/>';
      /* le poste */
      s += R.rect(830, 210, 280, 210, '#e0dccb', 3) + p('M810,214 H1130 L1104,170 H836 Z', '#6d7c88', 3) + R.rect(860, 250, 130, 90, '#7fa3ad', 2.4) + R.rect(1010, 280, 70, 140, '#4a3120', 2.4);
      s += R.rect(880, 110, 220, 60, '#27508f', 3) + L.ligne('FRANCE', 990, 122, 36, { ancre: 'm', encre: PAL.blanc, gras: true, graine: 3 });
      /* la barrière, la voiture contrôlée, l'agent */
      s += R.rect(620, 410, 34, 150, '#c6402d', 3);
      s += '<g transform="translate(637,430)"><g class="an-pancarte" style="transform-origin:0 50%">' + p('M0,-7 H-420 V7 H0 Z', PAL.blanc, 2.6) + a('M-60,-6 h40 v12 h-40 Z M-160,-6 h40 v12 h-40 Z M-260,-6 h40 v12 h-40 Z M-360,-6 h40 v12 h-40 Z', PAL.rouge) + '</g></g>';
      s += voiture(350, 600, 1.1, '#477a90') + voiture(70, 600, .9, PAL.ocre);
      s += gens(720, 640, 1, { g: true, peau: 'b', cheveux2: 'casquette', cheveux: PAL.noir, coiffe: '#1a2743', haut: '#27395c', bas: '#1a2743', pose: 'tient' });
      return S.kase(W, H, 'Un poste-frontière en montagne : la barrière baissée, le panneau France, une voiture contrôlée.', s);
    },
    /* v5.16 : sous les projecteurs, la même meute devant le QG de campagne */
    projecteurs: function () { return SCENES.scandale('QG DE CAMPAGNE', 'Devant la porte close du QG de campagne, photographes et flashs ; un dossier confidentiel à terre.'); },
    /* la meute devant le ministère */
    scandale: function (enseigne, legende) {
      enseigne = enseigne || 'MINISTÈRE';
      var s = R.af(0, 0, W, H, '#2f4772') + R.af(0, 0, W, 60, '#22345a'), i;
      s += R.rect(280, 60, 640, 420, '#d6cfb6', 3) + p('M250,60 H950 L920,20 H280 Z', '#8d8d84', 3) + R.rect(320, 90, 560, 60, '#efe9dc', 2.8) + L.ligne(enseigne, 600, 100, enseigne.length > 10 ? 30 : 38, { ancre: 'm', encre: INK, gras: true, graine: 3 });
      s += p('M480,480 V230 C480,170 720,170 720,230 V480 Z', '#4a3120', 3.4) + t('M600,190 V480', 3) + cercle(580, 350, 7, PAL.ocre, 2) + cercle(620, 350, 7, PAL.ocre, 2);
      s += R.af(0, 480, W, 200, '#8d8778') + t('M0,480 H1200', 3);
      /* les journalistes, les micros, les flashs */
      [[90, 'a', 'court', '#3b3a46'], [230, 'c', 'long', '#7d8f55'], [370, 'd', 'court', PAL.ocreO], [840, 'b', 'queue', '#477a90'], [980, 'a', 'gris', '#6b6a5e'], [1120, 'c', 'boucles', PAL.rougeO]].forEach(function (q, i) {
        s += vit(gens(q[0], 630 + (i % 2) * 20, 1, { peau: q[1], cheveux2: q[2], cheveux: q[2] === 'gris' ? PAL.grisC : PAL.noir, haut: q[3], bas: '#26201c', pose: 'tient', g: q[0] > 600 }), i);
      });
      [[170, 330], [320, 360], [860, 340], [1000, 360], [120, 400], [1080, 410]].forEach(function (q, i) {
        s += '<g class="an-clignote" style="animation-delay:' + (-i * .23) + 's"><path d="M' + q[0] + ',' + (q[1] - 42) + ' L' + (q[0] + 10) + ',' + (q[1] - 10) + ' L' + (q[0] + 42) + ',' + q[1] + ' L' + (q[0] + 10) + ',' + (q[1] + 10) + ' L' + q[0] + ',' + (q[1] + 42) + ' L' + (q[0] - 10) + ',' + (q[1] + 10) + ' L' + (q[0] - 42) + ',' + q[1] + ' L' + (q[0] - 10) + ',' + (q[1] - 10) + ' Z" fill="#fff7cf" stroke="' + INK + '" stroke-width="2"/></g>';
        s += R.rect(q[0] - 22, q[1] + 10, 44, 30, PAL.noir, 2.2) + cercle(q[0], q[1] + 25, 10, '#7fa3ad', 1.8);
      });
      /* le dossier tombé */
      s += '<g transform="rotate(-6 600 590)">' + R.rect(470, 540, 260, 110, '#d9b878', 3) + L.ligne('CONFIDENTIEL', 600, 578, 28, { ancre: 'm', encre: PAL.rouge, gras: true, graine: 4 }) + '</g>';
      return S.kase(W, H, legende || 'Devant la porte close du ministère, journalistes et flashs ; un dossier confidentiel à terre.', s);
    },
    /* la fête */
    fete: function () {
      var s = R.af(0, 0, W, H, '#1f2c54'), i;
      for (i = 0; i < 30; i++) s += '<circle cx="' + ((i * 137) % 1200) + '" cy="' + ((i * 53) % 170) + '" r="2" fill="#fff7cf"/>';
      /* le feu d'artifice */
      [[220, 110, '#ffcf5a'], [980, 90, '#ff7a5a'], [620, 60, '#8fd8e8']].forEach(function (q, j) {
        var f = ''; for (i = 0; i < 12; i++) { var an = i * Math.PI / 6; f += 'M' + (q[0] + Math.cos(an) * 16) + ',' + (q[1] + Math.sin(an) * 16) + ' L' + (q[0] + Math.cos(an) * 66) + ',' + (q[1] + Math.sin(an) * 66) + ' '; }
        s += '<path class="an-clignote" style="animation-delay:' + (-j * .3) + 's" d="' + f + '" stroke="' + q[2] + '" stroke-width="6" stroke-linecap="round"/>';
      });
      /* la mairie */
      s += R.rect(320, 200, 560, 260, '#e6d6b4', 3) + p('M300,204 H900 L860,160 H340 Z', '#6d7c88', 3) + R.rect(420, 216, 360, 44, '#efe9dc', 2.6) + L.ligne('MAIRIE', 600, 224, 28, { ancre: 'm', encre: INK, gras: true, graine: 3 });
      for (i = 0; i < 4; i++) s += R.rect(360 + i * 140, 290, 60, 90, '#ffcf5a', 2.4);
      s += t('M600,160 V96', 5) + '<g class="an-pancarte" style="transform-origin:0 50%">' + p('M602,98 H632 V140 H602 Z', '#27508f', 2) + p('M632,98 H662 V140 H632 Z', PAL.blanc, 2) + p('M662,98 H692 V140 H662 Z', PAL.rouge, 2) + '</g>';
      s += R.af(0, 460, W, 220, '#6f6c61') + t('M0,460 H1200', 3);
      /* les lampions */
      [[0, 230, 340, 300], [340, 300, 860, 300], [860, 300, 1200, 230]].forEach(function (q) {
        s += t('M' + q[0] + ',' + q[1] + ' Q' + ((q[0] + q[2]) / 2) + ',' + (Math.max(q[1], q[3]) + 60) + ' ' + q[2] + ',' + q[3], 2.4);
        for (i = 1; i < 5; i++) { var u = i / 5, x = (1 - u) * (1 - u) * q[0] + 2 * u * (1 - u) * (q[0] + q[2]) / 2 + u * u * q[2], y = (1 - u) * (1 - u) * q[1] + 2 * u * (1 - u) * (Math.max(q[1], q[3]) + 60) + u * u * q[3]; s += cercle(x, y + 16, 15, ['#ff7a5a', '#ffcf5a', '#8fd8e8', '#9fd47a'][i % 4], 2.2); }
      });
      /* la foule qui danse */
      [[80, 'a', 'long', PAL.rouge], [200, 'd', 'court', PAL.ocre], [320, 'b', 'boucles', '#477a90'], [440, 'c', 'queue', '#7d8f55'], [560, 'a', 'casquette', PAL.marine], [680, 'd', 'long', '#e8a7a0'], [800, 'b', 'gris', '#6b6a5e'], [920, 'c', 'court', '#2f8a8a'], [1040, 'a', 'boucles', PAL.rougeO], [1140, 'b', 'court', PAL.ocreO]].forEach(function (q, i) {
        s += vit(gens(q[0], 590 + (i % 2) * 54, .96, { peau: q[1], cheveux2: q[2], cheveux: q[2] === 'gris' ? PAL.grisC : q[2] === 'long' ? PAL.brunO : PAL.noir, coiffe: PAL.rouge, haut: q[3], pose: i % 3 === 2 ? 'tient' : 'poing', bouche: 'crie', g: i % 2 === 1, marche: i % 2 === 0 }), i);
      });
      return S.kase(W, H, 'La fête devant la mairie : les lampions, le feu d’artifice, la foule qui danse.', s);
    },
    /* la fusion : la poignée de mains devant le siège, les confettis, et les déçus sur le côté */
    fusion: function () {
      var s = R.af(0, 0, W, H, '#cfe2e6') + nuage(180, 60, .9) + nuage(1040, 50, .8), i;
      s += R.rect(250, 100, 700, 340, '#e6d6b4', 3) + p('M230,104 H970 L930,60 H270 Z', '#6d7c88', 3);
      for (i = 0; i < 6; i++) s += R.rect(280 + i * 112, 124, 74, 60, '#7fa3ad', 2.2);
      s += R.rect(510, 300, 180, 140, '#4a3120', 3) + t('M600,300 V440', 3);
      s += R.af(0, 440, W, 240, '#a39d8c') + t('M0,440 H1200', 3);
      /* la banderole */
      s += '<g class="an-banderole">' + p('M330,206 C480,194 720,218 870,200 L872,284 C720,302 480,276 332,292 Z', PAL.blanc, 3.2) + L.ligne('FUSION', 600, 220, 50, { ancre: 'm', encre: PAL.rouge, gras: true, graine: 3 }) + '</g>';
      /* les partisans des deux partis */
      [[330, 'a', 'long', PAL.rouge], [420, 'd', 'court', '#7d8f55'], [770, 'b', 'boucles', '#477a90'], [860, 'c', 'queue', PAL.ocreO]].forEach(function (q, i) { s += vit(gens(q[0], 540, .8, { peau: q[1], cheveux2: q[2], cheveux: PAL.noir, haut: q[3], pose: 'poing', bouche: 'crie', g: q[0] > 600 }), i); });
      /* les deux délégués qui se serrent la main */
      s += gens(520, 640, 1.06, { peau: 'b', cheveux2: 'gris', cheveux: PAL.grisC, haut: '#27395c', bas: '#27395c', pose: 'lance' });
      s += gens(690, 640, 1.06, { g: true, peau: 'c', cheveux2: 'court', cheveux: PAL.noir, haut: '#3b3a46', bas: '#3b3a46', pose: 'lance' });
      /* les déçus, à l'écart */
      s += gens(110, 636, .96, { peau: 'a', cheveux: PAL.brunO, haut: '#6b6a5e', pose: 'pancarte', texte: 'TRAHISON', n: 2, bouche: 'crie' });
      s += gens(1090, 636, .96, { g: true, peau: 'd', cheveux2: 'long', cheveux: PAL.noir, haut: '#2f8a8a', pose: 'montre', bouche: 'triste' });
      /* les confettis */
      for (i = 0; i < 26; i++) s += '<rect class="an-goutte" style="animation-delay:' + (-i * .17) + 's" x="' + (230 + (i * 89) % 760) + '" y="' + (40 + (i * 53) % 340) + '" width="12" height="8" fill="' + ['#c6402d', '#f5d547', '#27508f', '#7d8f55'][i % 4] + '" transform="rotate(' + (i * 37) + ' ' + (230 + (i * 89) % 760) + ' ' + (40 + (i * 53) % 340) + ')"/>';
      return S.kase(W, H, 'Une fusion de partis : deux délégués se serrent la main sous les confettis, des déçus protestent à l’écart.', s);
    },
    /* la nuit d'émeutes */
    emeutes: function () {
      var s = R.af(0, 0, W, H, '#1a2340'), i;
      s += fumee(320, 110, 1.6, '#3b3a46') + fumee(780, 90, 1.5, '#4d4a55');
      s += immeuble(-20, 400, 460, 400, '#4a5470', 5) + immeuble(380, 420, 460, 360, '#3f4862', 5) + immeuble(800, 420, 460, 410, '#4a5470', 5);
      /* la vitrine brisée */
      s += R.rect(860, 350, 260, 110, '#22283c', 3) + t('M900,350 L960,410 L920,460 M960,410 L1030,370 M960,410 L1060,450', 2.6).replace('stroke="' + INK + '"', 'stroke="#c9e0e2"');
      s += R.af(0, 460, W, 220, '#4a4a50') + t('M0,460 H1200', 3);
      /* la voiture qui brûle */
      s += voiture(600, 560, 1.15, '#2b2622');
      [[520, 490, 1], [610, 470, 1.25], [710, 490, .95]].forEach(function (q, j) { s += flamme(q[0], q[1], q[2], j); });
      for (i = 0; i < 12; i++) s += '<circle class="an-braise" style="animation-delay:' + (-i * .37) + 's" cx="' + (440 + i * 30) + '" cy="' + (400 + (i * 37) % 60) + '" r="' + (3 + i % 3) + '" fill="#ffd25e" stroke="' + INK + '" stroke-width="1"/>';
      /* la ligne de boucliers */
      [[30], [165], [300]].forEach(function (q) {
        s += gens(q[0], 640, 1, { peau: 'b', cheveux2: 'casque', haut: '#1a2743', bas: '#1a2743', pose: 'tient' }).replace(/#dfa93c/g, '#2c3a52').replace(/#efc35c/g, '#3b4a66').replace(/#b98421/g, '#1f2a3d');
        s += p('M' + (q[0] + 30) + ',380 H' + (q[0] + 96) + ' V610 C' + (q[0] + 80) + ',626 ' + (q[0] + 46) + ',626 ' + (q[0] + 30) + ',610 Z', '#8fa8bd', 2.8) + L.ligne('POLICE', q[0] + 63, 440, 14, { ancre: 'm', encre: INK, gras: true, graine: 2 });
      });
      /* les silhouettes capuchées, de loin */
      [[900, 580], [990, 600], [1090, 584]].forEach(function (q, j) { s += vit('<g transform="translate(' + q[0] + ',' + q[1] + ') scale(-.7,.7)">' + membre('M-11,-112 L-16,-60 L-20,-10', '#26201c', 21) + membre('M11,-112 L18,-60 L24,-10', '#26201c', 21) + p('M-30,-232 C-34,-190 -31,-150 -29,-112 L29,-112 C31,-150 34,-190 30,-232 C18,-244 -18,-244 -30,-232 Z', '#3b3a46', 2.6) + membre('M27,-218 L52,-258 L46,-306', '#3b3a46', 17) + p('M-26,-266 C-30,-312 30,-312 28,-266 C30,-240 14,-232 0,-232 C-14,-232 -30,-240 -26,-266 Z', '#3b3a46', 2.4) + a('M-6,-284 C8,-292 22,-288 22,-272 C22,-254 10,-250 2,-250 Z', '#191613') + '</g>', j); });
      return S.kase(W, H, 'Une nuit d’émeutes : une voiture en feu, une vitrine brisée, la ligne de boucliers face à des silhouettes capuchées.', s);
    }
  };

  root.PolitikEvenements = { gens: gens, SCENES: SCENES };
  /* Ces dessins remplacent ceux du même nom ; le meeting et le plateau télé gardent les leurs */
  var BD = root.PolitikBD;
  if (BD) {
    var aUne = BD.aUne, une = BD.une, scene = BD.scene;
    BD.aUne = function (nom) { return !!SCENES[nom] || aUne(nom); };
    BD.une = function (nom) { return SCENES[nom] ? SCENES[nom]() : une(nom); };
    BD.scene = function (nom) { return SCENES[nom] ? SCENES[nom]() : scene(nom); };
  }
})(this);

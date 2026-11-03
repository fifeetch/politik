/* Planche d'essai — les personnages, en ligne claire. Tracés SVG calculés ici, sans aucune image d'origine.
   La tête est un volume : une pile de tranches ovales, propre à chaque personnage. Traits, rides et cheveux sont posés
   sur ce volume, puis projetés : on peut donc la tourner (lacet), la lever (tangage) et l'incliner (rot) sans la redessiner.
   Proportions : une tête de haut pour un visage aux yeux à mi-hauteur, deux têtes de large pour les épaules.
   Expressions : assure, colere, inquiet, parle, neutre. Personnalités inventées, d'après js/people.js. */
(function (root) {
  var INK = '#1d1713';
  var PAL = {
    papier: '#f4e8cf', blanc: '#fdf8ea', peau: '#efc39b', peauO: '#d79c72', peauF: '#b87b52', peauF2: '#94603f',
    marine: '#27395c', marineO: '#1a2743', rouge: '#c6402d', rougeO: '#96291d', ocre: '#dfa93c', ocreO: '#b98421',
    vert: '#5d7f58', vertO: '#435f42', gris: '#8d8d84', grisC: '#c9c5b4', grisO: '#5d5c54', brun: '#6d4a2f', brunO: '#4a3120',
    creme: '#f2dfb4', bleu: '#6f9fb2', bleuO: '#477a90', noir: '#26201c'
  };
  var K = 1;
  var uid = 0;

  function p(d, fill, w, extra) { return '<path d="' + d + '" fill="' + (fill || 'none') + '" stroke="' + INK + '" stroke-width="' + ((w == null ? 2.6 : w) * K).toFixed(2) + '"' + (extra || '') + '/>'; }
  function a(d, fill) { return '<path d="' + d + '" fill="' + fill + '"/>'; }   // aplat sans trait
  function t(d, w) { return p(d, 'none', w == null ? 1.5 : w); }                 // trait de détail
  function teinte(s, c) { return s.replace('stroke="' + INK + '"', 'stroke="' + c + '"'); }
  function cercle(x, y, r, f, w) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '" stroke="' + INK + '" stroke-width="' + ((w == null ? 1.6 : w) * K).toFixed(2) + '"/>'; }
  function n1(v) { return Math.round(v * 10) / 10; }

  /* courbe lisse passant par des points */
  function lisse(pts, ferme) {
    var n = pts.length, d = 'M' + n1(pts[0][0]) + ',' + n1(pts[0][1]);
    var m = ferme ? n : n - 1;
    for (var i = 0; i < m; i++) {
      var p0 = ferme ? pts[(i - 1 + n) % n] : pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = ferme ? pts[(i + 2) % n] : pts[Math.min(i + 2, n - 1)];
      d += ' C' + n1(p1[0] + (p2[0] - p0[0]) / 6) + ',' + n1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + n1(p2[0] - (p3[0] - p1[0]) / 6) + ',' + n1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + n1(p2[0]) + ',' + n1(p2[1]);
    }
    return d + (ferme ? ' Z' : '');
  }

  /* ---------- Le volume de la tête ---------- */
  var TY = [0, .06, .14, .25, .38, .47, .56, .66, .76, .86, .94, 1];
  var TA = [.04, .17, .27, .325, .34, .335, .325, .3, .265, .2, .12, .03];     // demi-largeur
  var TF = [-.02, .16, .29, .37, .405, .385, .4, .4, .4, .38, .37, .27];       // avant
  var TB = [-.08, -.26, -.38, -.46, -.47, -.44, -.36, -.26, -.16, -.06, .05, .18]; // arrière
  function courbe(T, y) {
    if (y <= 0) return T[0];
    if (y >= 1) return T[T.length - 1];
    var i = 0; while (TY[i + 1] < y) i++;
    var y0 = TY[Math.max(i - 1, 0)], y1 = TY[i], y2 = TY[i + 1], y3 = TY[Math.min(i + 2, TY.length - 1)];
    var v0 = T[Math.max(i - 1, 0)], v1 = T[i], v2 = T[i + 1], v3 = T[Math.min(i + 2, TY.length - 1)];
    var h = y2 - y1, u = (y - y1) / h, m1 = (v2 - v0) / (y2 - y0 || 1) * h, m2 = (v3 - v1) / (y3 - y1 || 1) * h;
    return (2 * u * u * u - 3 * u * u + 1) * v1 + (u * u * u - 2 * u * u + u) * m1 + (-2 * u * u * u + 3 * u * u) * v2 + (u * u * u - u * u) * m2;
  }
  function bosse(y, c, l) { var d = (y - c) / l; return Math.exp(-d * d); }

  function Volume(m, lacet, tangage, j, H, ox, oy) {
    var th = lacet * Math.PI / 180, ps = tangage * Math.PI / 180, ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(ps), sp = Math.sin(ps);
    function dims(y) {
      var d = {
        a: courbe(TA, y) * (m.etroit || 1) + (m.crane || 0) * bosse(y, .28, .16) + (m.pommette || 0) * bosse(y, .54, .07) + (m.joue || 0) * bosse(y, .74, .09) + (m.machoire || 0) * bosse(y, .86, .06) + (m.mentonL || 0) * bosse(y, .96, .05),
        f: courbe(TF, y) + (m.front || 0) * bosse(y, .28, .09) + (m.arcade || 0) * bosse(y, .4, .035) + (m.menton || 0) * bosse(y, .93, .05) + (m.joueF || 0) * bosse(y, .72, .08),
        b: courbe(TB, y)
      };
      return d;
    }
    function proj(x, y, z) {
      var yy = y + (y > .7 ? j * (y - .7) / .3 : 0), X = x * ct + z * st, Z = -x * st + z * ct;
      return [ox + X * H, oy + ((yy - .55) * cp - Z * sp) * H];
    }
    /* un point du visage : x en largeur de tête, y de 0 (crâne) à 1 (menton), dz en relief */
    function S(x, y, dz) {
      var d = dims(y), si = Math.max(-1, Math.min(1, x / d.a)), co = Math.sqrt(1 - si * si);
      return proj(x, y, (d.f + d.b) / 2 + (d.f - d.b) / 2 * co + (dz || 0));
    }
    /* un point repéré par son angle autour de la tête (0 = nez, négatif = côté proche), off = épaisseur de cheveux */
    function Ang(deg, y, off) {
      var d = dims(y), o = off || 0, r = deg * Math.PI / 180, f = d.f + o, b = d.b - o, aa = d.a + o;
      return proj(aa * Math.sin(r), y, (f + b) / 2 + (f - b) / 2 * Math.cos(r));
    }
    /* la silhouette à une hauteur donnée : point le plus à gauche et le plus à droite */
    function Sil(y, off, offF) {
      var d = dims(y), o = off || 0, f = d.f + o + (offF || 0), b = d.b - o, aa = d.a + o, g = null, dr = null;
      for (var q = 0; q < 360; q += 6) {
        var r = q * Math.PI / 180, q2 = proj(aa * Math.sin(r), y, (f + b) / 2 + (f - b) / 2 * Math.cos(r));
        if (!g || q2[0] < g[0]) g = q2;
        if (!dr || q2[0] > dr[0]) dr = q2;
      }
      return { g: g, d: dr };
    }
    return { S: S, Ang: Ang, Sil: Sil, proj: proj, dims: dims, H: H, lacet: lacet };
  }
  function tranches(de, a_, pas) { var r = []; if (de < a_) for (var y = de; y <= a_ + 1e-6; y += pas) r.push(y); else for (var z = de; z >= a_ - 1e-6; z -= pas) r.push(z); return r; }

  /* ---------- Les traits ---------- */
  function oeil(V, sens, cx, e, f) {
    var S = V.S, y0 = .472, w = (f.oeilL || .112), dem = w / 2, h = .036 * e.ouv * (f.oeilH || 1), id = 'oe' + (++uid);
    // sens : -1 côté proche, +1 côté loin ; 'ext' pointe vers la tempe
    function q(u, v) { return S(cx + sens * u * dem, y0 + v * h); }
    var haut = [q(-1, .25), q(-.55, -.62), q(.05, -.95), q(.6, -.62), q(1, .02 - (f.oeilTombe || 0))];
    var bas = [q(1, .02 - (f.oeilTombe || 0)), q(.45, .62), q(-.3, .66), q(-1, .25)];
    var cont = lisse(haut.concat(bas.slice(1, 3)), true);
    var cIris = S(cx + (e.gx || 0) * dem * .55, y0 - .004 + (e.gy || 0) * h);
    var fuite = Math.max(.5, Math.abs(Math.cos(V.lacet * Math.PI / 180 + Math.asin(Math.min(.9, cx / .34))))), ri = .0255 * V.H;
    var s = '<clipPath id="' + id + '"><path d="' + cont + '"/></clipPath>' + a(cont, PAL.blanc);
    s += '<g clip-path="url(#' + id + ')"><ellipse cx="' + n1(cIris[0]) + '" cy="' + n1(cIris[1]) + '" rx="' + n1(ri * fuite) + '" ry="' + n1(ri) + '" fill="' + (f.iris || '#3d2f24') + '"/>' +
      '<ellipse cx="' + n1(cIris[0]) + '" cy="' + n1(cIris[1]) + '" rx="' + n1(ri * .52 * fuite) + '" ry="' + n1(ri * .52) + '" fill="' + INK + '"/>' +
      a(lisse(haut.concat([q(1, -.5), q(-1, -.5)]), true), '#00000022') + '</g>';
    s += t(lisse(haut), 2.1) + t(lisse(bas), 1);
    // le pli de la paupière
    s += t(lisse([q(-.8, -.95 - (f.paupiere || 0)), q(-.1, -1.55 - (f.paupiere || 0)), q(.72, -1.15 - (f.paupiere || 0))]), .9);
    if (f.age >= 1) s += t(lisse([q(-.6, 1.05), q(.1, 1.55), q(.8, 1.05)]), .8);          // poche sous l'œil
    if (f.age >= 2) s += t(lisse([q(-.2, 2.05), q(.45, 2.25), q(1, 1.7)]), .7);
    if (f.age >= 1 || f.patte) s += t(lisse([q(1.2, .05), q(1.55, -.18)]), .8) + t(lisse([q(1.2, .3), q(1.6, .4)]), .8);   // patte d'oie
    return s;
  }
  function sourcil(V, sens, cx, e, f) {
    var S = V.S, y0 = .402 - (f.sourcilH || 0), w = f.sourcilL || .075, ep = f.sourcilE || .012;
    function q(u, dy) { return S(cx + sens * u * w, y0 + dy); }
    var bi = -e.bi, be = -e.be;
    var hautB = [q(-.9, bi), q(-.3, bi * .5 - .009), q(.4, be * .4 - .014), q(1.1, be + .004)];
    var basB = [q(1.1, be + .006), q(.4, be * .4 - .014 + ep * .75), q(-.3, bi * .5 - .009 + ep), q(-.9, bi + ep * 1.1)];
    var s = p(lisse(hautB.concat(basB), true), f.sourcilC || PAL.brunO, .8);
    if (f.broussaille) for (var i = 0; i < 5; i++) {
      var u = -.7 + i * .4, o = u * .3;
      s += t(lisse([q(u, bi * .5 - .004 + o * -.01), q(u + .14, bi * .5 - .03 + o * -.015)]), 1);
    }
    return s;
  }
  function nez(V, f, peau) {
    var S = V.S, nz = f.nezL || .07, lw = f.nezW || .052, b = f.nezBosse || 0, ty = f.nezBas || .612;
    var cote = [S(.012, .44), S(.016 - b * .3, .51, nz * .32 + b), S(.012, .575, nz * .8), S(.004, ty, nz), S(-.014, ty + .03, nz * .86), S(-.02, ty + .05, nz * .4)];
    var aile = [S(-.012, ty + .052, nz * .3), S(-lw * .55, ty + .047, nz * .18), S(-lw, ty + .048, .004), S(-lw * 1.08, ty + .016, .01), S(-lw * .8, ty - .012, nz * .22)];
    var s = a(lisse(cote.concat([S(-.04, ty + .03, .02), S(-.02, .5, 0)]), true), peau || PAL.peau);
    s += t(lisse(cote.slice(1)), 1.7) + t(lisse(aile), 1.5);
    if (V.lacet < 32) s += t(lisse([S(.022, ty + .05, nz * .3), S(lw * .7, ty + .05, .012), S(lw, ty + .03, .006), S(lw * .85, ty + .005, .02)]), 1.2);
    s += a(lisse([S(-.03, ty + .042, nz * .2), S(-.012, ty + .036, nz * .3), S(-.006, ty + .05, nz * .3), S(-.026, ty + .054, nz * .2)], true), INK);
    return s;
  }
  function bouche(V, e, f) {
    var S = V.S, y0 = f.boucheY || .77, mw = f.boucheL || .085, s = '', B = e.bouche, L = f.levres, sg = f.bouchePli || 0;
    function q(u, dy) { return S(u * mw, y0 + dy); }
    if (B === 'colere' || B === 'parle') {
      var ou = B === 'colere' ? .074 : .036, lar = B === 'colere' ? 1.08 : .86, up = B === 'colere' ? -.024 : -.006;
      var haut = [q(-lar, up + .012), q(-lar * .45, up - .006), q(.04, up - .002), q(lar * .55, up - .006), q(lar, up + .012)];
      var bas = [q(lar * .72, up + ou * .75), q(.02, up + ou * 1.08), q(-lar * .72, up + ou * .75)];
      var cont = lisse(haut.concat(bas), true), id = 'bo' + (++uid);
      s += p(cont, '#4b1712', L ? 1.8 : 1.8);
      s += '<clipPath id="' + id + '"><path d="' + cont + '"/></clipPath><g clip-path="url(#' + id + ')">' +
        a(lisse([q(-lar, up - .02), q(lar, up - .02), q(lar * .85, up + ou * .3), q(0, up + ou * .36), q(-lar * .85, up + ou * .3)], true), PAL.blanc) +
        a(lisse([q(-lar * .6, up + ou * 1.3), q(-lar * .3, up + ou * .75), q(lar * .3, up + ou * .72), q(lar * .6, up + ou * 1.3)], true), PAL.rouge) + '</g>';
      if (L) s += teinte(t(lisse(haut), 2.2), L) + teinte(t(lisse(bas.concat([haut[0]])), 2.6), L);
      s += t(lisse([q(-lar * .42, up + ou * 1.08 + .024), q(0, up + ou * 1.08 + .03), q(lar * .46, up + ou * 1.08 + .022)]), 1);
      if (B === 'colere') s += t(lisse([q(-lar * 1.3, up - .012), q(-lar * 1.24, up + .02), q(-lar * 1.08, up + .05)]), 1.1) + t(lisse([q(lar * 1.28, up - .012), q(lar * 1.2, up + .02)]), 1);
      return s;
    }
    var cg = 0, cd = 0, mi = 0;
    if (B === 'assure') { cg = -.016; cd = -.01; mi = .002; }
    if (B === 'inquiet') { cg = .011; cd = .006; mi = -.004; }
    var ligne = [q(-1, cg + sg), q(-.45, mi + .002), q(0, mi - .002), q(.45, mi + .002), q(1, cd + sg)];
    if (L) {
      s += a(lisse([q(-1, cg), q(-.42, -.019), q(-.08, -.013), q(.02, -.016), q(.42, -.018), q(1, cd), q(.45, .029), q(0, .036), q(-.45, .029)], true), L);
      s += t(lisse([q(-.42, -.019), q(-.08, -.013), q(.02, -.016), q(.42, -.018)]), .7);
      s += t(lisse([q(-.5, .029), q(0, .037), q(.5, .029)]), .9);
    } else if (!f.moustache) {
      s += t(lisse([q(-.36, -.016), q(-.08, -.021), q(.04, -.017), q(.36, -.016)]), .7);
    }
    s += t(lisse(ligne), 1.7);
    if (!L) s += t(lisse([q(-.36, .043), q(0, .05), q(.38, .042)]), 1);
    if (B === 'assure') s += t(lisse([q(-1.14, cg - .016), q(-1.2, cg + .002), q(-1.1, cg + .016)]), 1) + t(lisse([q(1.1, cd - .012), q(1.14, cd + .006)]), .9);
    return s;
  }
  function goutte(x, y, r) { return p('M' + n1(x) + ',' + n1(y - r * 1.6) + ' Q' + n1(x + r * 1.1) + ',' + n1(y) + ' ' + n1(x) + ',' + n1(y + r) + ' Q' + n1(x - r * 1.1) + ',' + n1(y) + ' ' + n1(x) + ',' + n1(y - r * 1.6) + ' Z', '#bfe0e6', 1); }

  /* ---------- Les expressions ---------- */
  var EXPR = {
    neutre: { ouv: 1, gx: .55, gy: 0, bi: 0, be: 0, bouche: 'ferme', j: 0 },
    assure: { ouv: .84, gx: .85, gy: .05, bi: .004, be: .012, bouche: 'assure', j: 0, sourit: 1 },
    colere: { ouv: 1.1, gx: .8, gy: .1, bi: -.024, be: .012, bouche: 'colere', j: .085, rides: 1, plisse: 1 },
    inquiet: { ouv: 1.2, gx: .15, gy: .2, bi: .024, be: -.012, bouche: 'inquiet', j: .006, goutte: 1, plisseF: 1 },
    parle: { ouv: 1, gx: .75, gy: 0, bi: .01, be: .006, bouche: 'parle', j: .03 }
  };

  /* le visage complet ; f = la fiche du personnage */
  function tete(V, e, f, o) {
    var S = V.S, H = V.H, s = '', peau = f.peau || PAL.peau, ombre = f.peauO || PAL.peauO, y;
    var gau = [], dro = [];
    tranches(.0, 1, .04).forEach(function (yy) { var q = V.Sil(yy); gau.push(q.g); dro.push(q.d); });
    var contour = lisse(gau.concat(dro.reverse()), true);
    // l'oreille proche
    function oreille() {
      var s = '';
      s += p(lisse([V.Ang(-92, .43), V.Ang(-112, .405, .04), V.Ang(-124, .47, .05), V.Ang(-118, .56, .04), V.Ang(-104, .635, .015), V.Ang(-94, .6)]), peau, 1.8);
      s += t(lisse([V.Ang(-100, .455, .02), V.Ang(-114, .45, .03), V.Ang(-114, .53, .02), V.Ang(-104, .56, .01)]), .9);
      if (f.boucle) { var bo = V.Ang(-104, .66, .01); s += cercle(n1(bo[0]), n1(bo[1]), n1(.018 * H), f.boucle, 1); }
      return s;
    }

    // l'oreille du côté loin, à peine visible de presque face
    if (V.lacet < 20) s += p(lisse([V.Ang(100, .43), V.Ang(92, .42, .05), V.Ang(90, .5, .05), V.Ang(92, .6, .025), V.Ang(100, .62)]), peau, 1.8);
    s += p(contour, peau, 2.3);
    // l'ombre du côté proche : une seule teinte, posée sur le volume
    var bord = tranches(.5, 1, .06).map(function (yy) { return V.Sil(yy).g; });
    var creux = tranches(1, .5, .06).map(function (yy) { var q = V.Sil(yy).g, u = (yy - .5) / .5; return [q[0] + Math.sin(u * Math.PI) * .075 * H, q[1] - (1 - u) * 0]; });
    s += a(lisse(bord.concat(creux), true), ombre);
    // pommettes, rides de l'âge
    if (f.joues) s += a(lisse([S(-.26, .6), S(-.17, .57), S(-.09, .62), S(-.13, .69), S(-.23, .7)], true), f.joues) + a(lisse([S(.1, .6), S(.2, .58), S(.27, .63), S(.2, .69), S(.12, .67)], true), f.joues);
    if (f.rousseur) f.rousseur.forEach(function (q) { var z = S(q[0], q[1]); s += '<circle cx="' + n1(z[0]) + '" cy="' + n1(z[1]) + '" r="' + n1(.9 * K) + '" fill="#a9613a"/>'; });
    if (f.age >= 1 || e.rides) s += t(lisse([S(-.15, .3), S(-.03, .285), S(.1, .3)]), .9);
    if (f.age >= 2) s += t(lisse([S(-.17, .252), S(-.02, .236), S(.13, .25)]), .9) + t(lisse([S(-.12, .205), S(0, .195), S(.1, .205)]), .8);
    if (e.rides || f.pli) s += t(lisse([S(-.022, .385), S(-.018, .425)]), 1.2) + (e.rides ? t(lisse([S(.022, .385), S(.018, .425)]), 1.2) : '');
    if (e.plisseF) s += t(lisse([S(-.09, .325), S(-.02, .345), S(.05, .33)]), .9);
    // le sillon du nez à la bouche, plus creusé avec l'âge ou le sourire
    var sillon = (f.age >= 1 ? 1 : 0) + (e.sourit ? 1 : 0) + (e.bouche === 'colere' ? 1 : 0);
    if (sillon) {
      s += t(lisse([S(-.074, .635), S(-.11, .68), S(-.128, .735), S(-.128, .79)]), sillon > 1 ? 1.3 : 1);
      if (V.lacet < 40) s += t(lisse([S(.072, .635), S(.105, .68), S(.122, .735)]), .9);
    }
    if (f.age >= 2) s += t(lisse([S(-.21, .79), S(-.185, .86), S(-.15, .905)]), 1);   // le bajoue
    if (f.fossette) s += t(lisse([S(-.01, .925), S(.01, .925)]), 1);
    if (f.doubleMenton) s += t(lisse([V.Sil(.93).g, S(-.14, 1.0), S(0, 1.0), S(.12, .99)]), 1.1);
    if (f.oreilleSous) s += oreille();
    // la barbe, sous la bouche
    if (f.barbe) s += f.barbe(V, e);
    s += nez(V, f, peau);
    s += bouche(V, e, f);
    if (f.moustache) s += f.moustache(V, e);
    s += oeil(V, -1, -(f.ecart || .155), e, f) + oeil(V, 1, f.ecart || .155, e, f);
    s += sourcil(V, -1, -(f.ecart || .155) + .005, e, f) + sourcil(V, 1, (f.ecart || .155) - .005, e, f);
    if (f.lunettes) s += f.lunettes(V, e);
    if (f.cheveux) s += f.cheveux(V, e);
    if (!f.oreilleSous) s += oreille();
    if (e.goutte) { var g1 = S(.2, .22), g2 = V.Sil(.36, .02).d, g3 = S(-.24, .3); s += goutte(g1[0], g1[1], 3.4) + goutte(g2[0] + 5, g2[1], 3) + goutte(g3[0], g3[1], 2.6); }
    return s;
  }

  /* ---------- Les cheveux ---------- */
  /* la calotte : une lisière posée sur le front, puis le tour du crâne en silhouette */
  function calotte(V, lisiere, o) {
    var off = o.off == null ? .025 : o.off, pts = lisiere.map(function (q) { return V.Ang(q[0], q[1], q[2] == null ? off * .4 : q[2]); });
    tranches(o.nuque || .62, .07, .07).forEach(function (yy) { pts.push(V.Sil(yy, off, o.offF).g); });
    if (o.finD !== false) { var c0 = V.Sil(0, off, o.offF); pts.push([(c0.g[0] + c0.d[0]) / 2, c0.g[1] - .004 * V.H]); tranches(.07, o.finD || .3, .06).forEach(function (yy) { pts.push(V.Sil(yy, off, o.offF).d); }); }
    return p(lisse(pts, true), o.c, o.tr == null ? 2.2 : o.tr);
  }
  function meches(V, liste, w, c) {
    return liste.map(function (l) { var d = t(lisse(l.map(function (q) { return V.Ang(q[0], q[1], q[2] == null ? .025 : q[2]); })), w || 1); return c ? teinte(d, c) : d; }).join('');
  }
  function masse(V, deY, aY, off, ond, c, tr, offB) {
    /* la masse de cheveux dans le dos, derrière le cou : silhouette élargie, ondulée si ond */
    var g = [], d = [];
    tranches(deY, aY, .05).forEach(function (yy, i) {
      var q = V.Sil(Math.min(yy, .9), off + (yy > .5 ? (yy - .5) * (offB || 0) : 0)), dy = yy > .9 ? (yy - .9) * V.H : 0;
      var w1 = ond ? Math.sin(i * 1.5) * ond * V.H : 0, w2 = ond ? Math.sin(i * 1.5 + 1.6) * ond * V.H : 0;
      g.push([q.g[0] + w1, q.g[1] + dy]); d.push([q.d[0] + w2, q.d[1] + dy]);
    });
    var h0 = V.Sil(.1); // un point au sommet, pour que le haut de la masse reste rond sous la calotte
    return p(lisse([[(h0.g[0] + h0.d[0]) / 2, h0.g[1]]].concat(g, d.reverse()), true), c, tr == null ? 2.3 : tr);
  }

  /* ---------- Les personnages ---------- */
  var FIG = {
    /* Jean-Lutte Mégaphone : le vieux tribun. Visage lourd, front dégarni, moustache grise, veste sombre, écharpe rouge */
    megaphone: {
      H: 192, lacet: 28, large: 1.06, m: { joue: .012, machoire: .022, crane: .004, arcade: .012, mentonL: .01 }, age: 2, pli: 1,
      nezL: .082, nezW: .06, nezBas: .625, sourcilL: .085, sourcilE: .018, sourcilC: '#8a8778', broussaille: 1, oeilL: .104, oeilH: .9, paupiere: .25, oeilTombe: -.12,
      boucheL: .088, boucheY: .785, iris: '#4f5f64',
      moustache: function (V, e) {
        var S = V.S, ou = e.bouche === 'colere' ? -.022 : e.bouche === 'parle' ? -.008 : 0;
        var h = [S(-.112, .79 + ou * .4), S(-.092, .74), S(-.05, .708), S(0, .7), S(.05, .708), S(.09, .74), S(.108, .785 + ou * .4)];
        var b = [S(.08, .77 + ou), S(.04, .758 + ou), S(0, .752 + ou), S(-.04, .758 + ou), S(-.085, .775 + ou)];
        return p(lisse(h.concat(b), true), PAL.grisC, 1.5) + t(lisse([S(-.06, .72), S(-.075, .752 + ou)]), .7) + t(lisse([S(-.025, .712), S(-.032, .75 + ou)]), .7) + t(lisse([S(.03, .712), S(.036, .75 + ou)]), .7) + t(lisse([S(.062, .722), S(.072, .75 + ou)]), .7);
      },
      cheveux: function (V) {
        var c = PAL.grisC;
        return calotte(V, [[62, .3], [44, .19], [24, .12], [0, .115], [-26, .12], [-48, .2], [-66, .3], [-80, .37], [-86, .46], [-98, .47]], { off: .022, c: c, finD: .26 }) +
          meches(V, [[[-64, .24], [-90, .18], [-120, .24]], [[-78, .34], [-104, .3], [-132, .36]], [[-120, .5], [-142, .46], [-160, .5]], [[-30, .1], [-50, .06], [-90, .07]], [[24, .1], [44, .1], [60, .17]]], 1, '#77756a');
      }
    },
    /* Jordan Brushing : le jeune loup. Lisse, mâchoire nette, raie impeccable, costume ajusté */
    brushing: {
      H: 182, lacet: 30, large: .94, m: { etroit: .96, machoire: .014, menton: .012, pommette: .004 }, age: 0, fossette: 1,
      nezL: .066, nezW: .044, nezBas: .612, sourcilL: .074, sourcilE: .012, sourcilC: '#4a3120', oeilL: .108, boucheL: .08, boucheY: .77, iris: '#49657a',
      cheveux: function (V) {
        var c = '#7a5230';
        return calotte(V, [[64, .36], [48, .22], [26, .15], [0, .135], [-22, .15], [-46, .2], [-68, .3], [-82, .4], [-88, .49], [-98, .5]], { off: .03, offF: .05, c: c, finD: .3 }) +
          meches(V, [[[-44, .17, .05], [-14, .06, .07], [24, .04, .07], [52, .14, .05]], [[-30, .15, .05], [0, .1, .075], [34, .11, .07], [56, .2, .04]], [[-16, .135, .04], [12, .14, .06], [40, .17, .05]], [[-62, .26], [-84, .16], [-120, .2]], [[-74, .34], [-100, .28], [-128, .34]]], 1.1, '#4a3120');
      }
    },
    /* Élisabeth Bornée : la haute fonctionnaire. Traits fins et tirés, coupe courte grise, fines lunettes rouges, tailleur sombre */
    bornee: {
      H: 172, lacet: 22, large: .86, cou: .42,  femme: 1, m: { etroit: .95, joue: -.018, machoire: -.012, pommette: .008, menton: .004 }, age: 2,
      nezL: .07, nezW: .042, nezBas: .618, sourcilL: .068, sourcilE: .007, sourcilC: '#6d6a60', oeilL: .1, boucheL: .07, boucheY: .775, bouchePli: .005, levres: '#c48a78', iris: '#55554c', boucle: PAL.grisC,
      lunettes: function (V) {
        var S = V.S, R = PAL.rouge;
        function cadre(cx) { return lisse([S(cx - .066, .448, .012), S(cx, .442, .014), S(cx + .066, .446, .012), S(cx + .062, .49, .012), S(cx, .506, .014), S(cx - .06, .494, .012)], true); }
        return teinte(p(cadre(-.155), 'none', 2.2), R) + teinte(p(cadre(.155), 'none', 2.2), R) +
          teinte(t(lisse([S(-.09, .455, .024), S(0, .448, .05), S(.09, .455, .024)]), 2), R) +
          teinte(t(lisse([S(-.22, .452, .012), S(-.28, .45, .0), V.Ang(-96, .44, .012)]), 2), R);
      },
      cheveux: function (V) {
        var c = '#a3a196';
        return calotte(V, [[64, .4], [50, .32], [30, .27], [8, .235], [-18, .19], [-34, .17], [-50, .22], [-66, .34], [-78, .44], [-86, .55], [-100, .58]], { off: .036, c: c, nuque: .68, finD: .38 }) +
          meches(V, [[[-34, .17, .05], [0, .13, .055], [34, .2, .05], [60, .36, .04]], [[-40, .14, .05], [-6, .07, .055], [36, .12, .055]], [[-66, .3], [-90, .24], [-120, .3]], [[-76, .42], [-100, .4], [-134, .46]], [[-120, .58], [-140, .56], [-158, .6]]], 1, '#6d6a60');
      }
    },
    /* Marine Tournesol : l'écolo de terrain. Cheveux auburn ondulés aux épaules, taches de rousseur, veste de lin, pas de cravate */
    tournesol: {
      H: 172, lacet: 26, large: .86, cou: .4, oreilleSous: 1, femme: 1, m: { etroit: .96, pommette: .006, joue: -.006, machoire: -.008 }, age: 0, patte: 1,
      nezL: .06, nezW: .044, nezBas: .606, sourcilL: .072, sourcilE: .009, sourcilC: '#7c3c1c', oeilL: .114, oeilH: 1.1, boucheL: .08, boucheY: .765, levres: '#c8705a', iris: '#55703e', boucle: PAL.ocre,
      rousseur: [[-.2, .57], [-.16, .6], [-.12, .56], [-.08, .59], [-.22, .62], [.1, .57], [.14, .6], [.18, .56], [.04, .55], [-.03, .545]],
      dos: function (V) { return masse(V, .24, 1.34, .036, .018, '#a84e26', 2.3, .26); },
      cheveux: function (V) {
        var c = '#b5552a';
        var d = calotte(V, [[60, .44], [46, .3], [24, .19], [2, .155], [-22, .2], [-44, .32], [-60, .48], [-70, .66], [-84, .84], [-116, .9]], { off: .045, c: c, nuque: .8, finD: .46 });
        return d + meches(V, [[[2, .155, .05], [-24, .08, .06], [-70, .1, .06], [-110, .24, .06]], [[2, .155, .05], [30, .08, .06], [58, .18, .05], [66, .36, .05]], [[-30, .24, .05], [-60, .24, .06], [-86, .4, .06], [-96, .62, .06]], [[-52, .44, .05], [-76, .54, .06], [-90, .78, .06]], [[14, .17, .05], [40, .2, .05], [54, .32, .05]]], 1.1, '#7c3c1c');
      }
    },
    /* Fabien Rillettes : le camarade bon vivant. Tête ronde, crâne dégarni, joues rouges, veste de velours, cravate desserrée */
    rillettes: {
      H: 188, lacet: 24, large: 1.06, cou: .54, m: { joue: .03, machoire: .036, joueF: .012, mentonL: .03, pommette: .006 }, age: 1, doubleMenton: 1,
      peau: '#efb995', peauO: '#d58e68', joues: '#eaa98a',
      nezL: .074, nezW: .068, nezBas: .622, sourcilL: .078, sourcilE: .015, sourcilC: '#3a3027', oeilL: .1, oeilH: .9, boucheL: .094, boucheY: .775, iris: '#3d2f24',
      cheveux: function (V) {
        var c = '#5a5045';
        return calotte(V, [[-48, .15], [-62, .27], [-76, .37], [-86, .47], [-98, .48]], { off: .018, c: c, finD: false }) +
          p(lisse([V.Ang(72, .3, .01), V.Ang(58, .26, .012), V.Ang(52, .18, .012), V.Sil(.16, .016).d, V.Sil(.26, .016).d], true), c, 1.7) +
          meches(V, [[[-40, .09, .006], [-10, .07, .008], [24, .09, .006]], [[-46, .13, .006], [-14, .11, .008], [20, .13, .006]], [[-82, .34], [-110, .3], [-134, .4]]], .9, '#3a3027');
      }
    },
    /* la journaliste : carré noir, regard droit */
    journaliste: {
      H: 172, lacet: 24, large: .88, cou: .4, oreilleSous: 1, femme: 1, m: { etroit: .95, pommette: .006, joue: -.012 }, age: 0,
      peau: '#d9a67a', peauO: '#bb8558',
      nezL: .058, nezW: .044, sourcilL: .07, sourcilE: .01, sourcilC: PAL.noir, oeilL: .112, oeilH: 1.05, boucheL: .074, boucheY: .77, levres: '#a4503f', iris: '#2c221a', boucle: PAL.ocre,
      dos: function (V) { return masse(V, .24, 1.02, .04, 0, PAL.noir, 2.2, .08); },
      cheveux: function (V) {
        var c = PAL.noir;
        return calotte(V, [[62, .42], [48, .3], [24, .2], [-6, .165], [-30, .17], [-52, .3], [-68, .5], [-76, .72], [-84, .93], [-120, .96]], { off: .05, c: c, nuque: .88, finD: .5 }) +
          meches(V, [[[-30, .17, .06], [-6, .09, .065], [34, .13, .06], [60, .3, .05]], [[-60, .26, .06], [-86, .3, .06], [-92, .6, .06]]], 1, '#6b5e54');
      }
    },
    /* le matinalier : barbe courte poivre et sel, lunettes rondes */
    matinalier: {
      H: 186, lacet: 26, large: .98, m: { machoire: .008, arcade: .006 }, age: 1,
      nezL: .074, nezW: .05, nezBas: .618, nezBosse: .012, sourcilL: .076, sourcilE: .013, sourcilC: '#4b4a42', oeilL: .1, boucheL: .08, boucheY: .775, moustache: function (V) { var S = V.S; return a(lisse([S(-.09, .762), S(-.05, .712), S(0, .708), S(.05, .712), S(.085, .76), S(.04, .744), S(0, .742), S(-.045, .746)], true), PAL.grisO) + teinte(t(lisse([S(-.05, .716), S(-.06, .742)]), .7), PAL.grisC) + teinte(t(lisse([S(.04, .716), S(.05, .742)]), .7), PAL.grisC); },
      barbe: function (V) {
        var S = V.S, pts = [S(-.3, .6), S(-.2, .72), S(-.125, .775), S(-.1, .83), S(-.05, .85), S(.05, .85), S(.1, .83), S(.125, .775), S(.2, .72), V.Sil(.66, .006).d];
        tranches(.74, 1, .08).forEach(function (yy) { pts.push(V.Sil(yy, .01).d); });
        tranches(1, .62, .08).forEach(function (yy) { pts.push(V.Sil(yy, .01).g); });
        var s = p(lisse(pts, true), '#8f8d80', 1.6);
        [[-.24, .76], [-.17, .84], [-.08, .92], [.02, .94], [.1, .9], [.16, .8], [-.21, .68]].forEach(function (q) { s += teinte(t(lisse([S(q[0], q[1]), S(q[0] + .005, q[1] + .03)]), .9), PAL.grisO); });
        return s;
      },
      lunettes: function (V) {
        var S = V.S;
        function rond(cx) { var pts = []; for (var i = 0; i < 12; i++) { var r = i / 12 * Math.PI * 2; pts.push(S(cx + Math.cos(r) * .066, .478 + Math.sin(r) * .066, .014)); } return lisse(pts, true); }
        return t(rond(-.155), 1.9) + t(rond(.155), 1.9) + t(lisse([S(-.09, .462, .022), S(0, .452, .05), S(.09, .462, .022)]), 1.6) + t(lisse([S(-.222, .47, .012), S(-.28, .455, 0), V.Ang(-96, .44, .012)]), 1.7);
      },
      cheveux: function (V) {
        var c = PAL.grisO;
        return calotte(V, [[62, .3], [44, .2], [20, .14], [-6, .13], [-30, .15], [-50, .22], [-68, .32], [-80, .4], [-86, .5], [-98, .5]], { off: .02, c: c, finD: .26 }) +
          meches(V, [[[-20, .11], [-50, .08], [-100, .11]], [[-66, .28], [-92, .22], [-124, .28]], [[20, .12], [44, .14], [58, .22]]], .9, PAL.grisC);
      }
    }
  };

  /* ---------- Les corps ---------- */
  var VESTE = {
    megaphone: { c: '#3a4148', o: '#292f35' }, brushing: { c: PAL.marine, o: PAL.marineO }, bornee: { c: '#3b3a46', o: '#2a2933' },
    tournesol: { c: '#7d8f55', o: '#5f7040' }, rillettes: { c: '#7b5c3e', o: '#5a4229' }, journaliste: { c: PAL.bleuO, o: '#335e72' }, matinalier: { c: '#8a8778', o: '#696759' }
  };
  /* la géométrie d'un torse trois quarts ; cx = l'axe du cou */
  function gabarit(nom) {
    var F = FIG[nom], H = F.H, W = 1.95 * H * (F.large || 1), cx = 214, ys = 34 + H + .27 * H;
    return { F: F, H: H, W: W, cx: cx, ys: ys, g: cx - .55 * W, d: cx + .45 * W, nw: (F.cou || .5) * H, nc: cx + .02 * H, sx: cx + .13 * H };
  }
  function veste(G, c, o) {
    var g = G.g, d = G.d, ys = G.ys, cx = G.cx, H = G.H, nw = G.nw, nc = G.nc;
    var haut = ys - .2 * H;
    var s = p('M' + n1(nc - nw * .62) + ',' + n1(haut) + ' C' + n1(nc - nw * .95) + ',' + n1(haut + .1 * H) + ' ' + n1(g + .12 * H) + ',' + n1(ys - .1 * H) + ' ' + n1(g + .02 * H) + ',' + n1(ys + .02 * H) +
      ' C' + n1(g - .08 * H) + ',' + n1(ys + .3 * H) + ' ' + n1(g - .12 * H) + ',' + n1(ys + .8 * H) + ' ' + n1(g - .12 * H) + ',495 L' + n1(d + .1 * H) + ',495' +
      ' C' + n1(d + .1 * H) + ',' + n1(ys + .8 * H) + ' ' + n1(d + .06 * H) + ',' + n1(ys + .3 * H) + ' ' + n1(d - .03 * H) + ',' + n1(ys + .02 * H) +
      ' C' + n1(d - .1 * H) + ',' + n1(ys - .08 * H) + ' ' + n1(nc + nw * .95) + ',' + n1(haut + .09 * H) + ' ' + n1(nc + nw * .62) + ',' + n1(haut) + ' Z', c, 2.6);
    // l'ombre côté proche et la couture des manches
    s += a('M' + n1(g + .02 * H) + ',' + n1(ys + .02 * H) + ' C' + n1(g - .08 * H) + ',' + n1(ys + .3 * H) + ' ' + n1(g - .12 * H) + ',' + n1(ys + .8 * H) + ' ' + n1(g - .12 * H) + ',495 L' + n1(g + .16 * H) + ',495 C' + n1(g + .14 * H) + ',' + n1(ys + .7 * H) + ' ' + n1(g + .18 * H) + ',' + n1(ys + .3 * H) + ' ' + n1(g + .02 * H) + ',' + n1(ys + .02 * H) + ' Z', o);
    s += t('M' + n1(g + .24 * H) + ',' + n1(ys + .08 * H) + ' C' + n1(g + .3 * H) + ',' + n1(ys + .5 * H) + ' ' + n1(g + .24 * H) + ',' + n1(ys + .9 * H) + ' ' + n1(g + .22 * H) + ',495', 1.5);
    s += t('M' + n1(d - .2 * H) + ',' + n1(ys + .1 * H) + ' C' + n1(d - .26 * H) + ',' + n1(ys + .5 * H) + ' ' + n1(d - .2 * H) + ',' + n1(ys + .9 * H) + ' ' + n1(d - .18 * H) + ',495', 1.4);
    return s;
  }
  function cou(G, peau, ombre, f) {
    var nc = G.nc, nw = G.nw, ys = G.ys, H = G.H, y0 = ys - .62 * H, y1 = ys + .02 * H, s = '';
    s += p('M' + n1(nc - nw / 2) + ',' + n1(y0) + ' C' + n1(nc - nw / 2) + ',' + n1(y0 + .3 * H) + ' ' + n1(nc - nw * .58) + ',' + n1(y1 - .1 * H) + ' ' + n1(nc - nw * .66) + ',' + n1(y1) + ' L' + n1(nc + nw * .66) + ',' + n1(y1) + ' C' + n1(nc + nw * .56) + ',' + n1(y1 - .1 * H) + ' ' + n1(nc + nw * .5) + ',' + n1(y0 + .3 * H) + ' ' + n1(nc + nw * .5) + ',' + n1(y0) + ' Z', peau, 2.2);
    // l'ombre portée du menton
    s += a('M' + n1(nc - nw / 2 + 1) + ',' + n1(y0 + .12 * H) + ' L' + n1(nc + nw * .5 - 1) + ',' + n1(y0 + .16 * H) + ' L' + n1(nc + nw * .5 - 1) + ',' + n1(y0 + .36 * H) + ' C' + n1(nc + nw * .2) + ',' + n1(y0 + .42 * H) + ' ' + n1(nc - nw * .2) + ',' + n1(y0 + .46 * H) + ' ' + n1(nc - nw / 2 - 1) + ',' + n1(y0 + .42 * H) + ' Z', ombre);
    if (f.age >= 2) s += t('M' + n1(nc - nw * .24) + ',' + n1(y0 + .32 * H) + ' C' + n1(nc - nw * .12) + ',' + n1(y0 + .42 * H) + ' ' + n1(nc - nw * .04) + ',' + n1(y0 + .52 * H) + ' ' + n1(nc) + ',' + n1(y1 - .02 * H), 1) + t('M' + n1(nc + nw * .28) + ',' + n1(y0 + .34 * H) + ' C' + n1(nc + nw * .2) + ',' + n1(y0 + .44 * H) + ' ' + n1(nc + nw * .1) + ',' + n1(y0 + .52 * H) + ' ' + n1(nc + nw * .05) + ',' + n1(y1 - .02 * H), 1);
    return s;
  }
  /* le col de chemise et le plastron : cravate, foulard ou col ouvert selon o */
  function plastron(G, o) {
    var nc = G.nc, nw = G.nw, ys = G.ys, H = G.H, sx = G.sx, s = '', ch = o.chemise || PAL.blanc;
    var bas = ys + (o.bas == null ? .95 : o.bas) * H, ntop = ys - .14 * H, ouvert = o.ouvert;
    s += p('M' + n1(nc - nw * .66) + ',' + n1(ntop) + ' L' + n1(sx + .02 * H) + ',' + n1(ouvert ? ys + .2 * H : ys + .1 * H) + ' L' + n1(nc + nw * .68) + ',' + n1(ntop) + ' L' + n1(nc + nw * .8) + ',' + n1(ys + .34 * H) + ' L' + n1(sx) + ',' + n1(bas) + ' L' + n1(nc - nw * .75) + ',' + n1(ys + .34 * H) + ' Z', ch, 1.6);
    if (ouvert) s += a('M' + n1(nc - nw * .54) + ',' + n1(ntop) + ' L' + n1(sx) + ',' + n1(ys + .26 * H) + ' L' + n1(nc + nw * .56) + ',' + n1(ntop) + ' Z', o.peau || PAL.peau);
    if (o.cravate) {
      var cr = o.cravate, ro = o.cravateO || PAL.rougeO, dec = o.desserre || 0, ny = ys - .02 * H + dec;
      s += p('M' + n1(sx - .05 * H) + ',' + n1(ny) + ' L' + n1(sx + .05 * H) + ',' + n1(ny - .01 * H) + ' L' + n1(sx + .04 * H) + ',' + n1(ny + .09 * H) + ' L' + n1(sx - .03 * H) + ',' + n1(ny + .09 * H) + ' Z', cr, 1.6);
      s += p('M' + n1(sx - .03 * H) + ',' + n1(ny + .09 * H) + ' L' + n1(sx + .04 * H) + ',' + n1(ny + .09 * H) + ' L' + n1(sx + .085 * H) + ',' + n1(bas - .08 * H) + ' L' + n1(sx + .015 * H) + ',' + n1(bas + .03 * H) + ' L' + n1(sx - .065 * H) + ',' + n1(bas - .08 * H) + ' Z', cr, 1.7);
      s += a('M' + n1(sx - .03 * H) + ',' + n1(ny + .09 * H) + ' L' + n1(sx) + ',' + n1(ny + .09 * H) + ' L' + n1(sx + .015 * H) + ',' + n1(bas + .03 * H) + ' L' + n1(sx - .065 * H) + ',' + n1(bas - .08 * H) + ' Z', ro);
    }
    // les deux pointes du col
    if (!o.sansCol) {
      s += p('M' + n1(nc - nw * .6) + ',' + n1(ntop - .03 * H) + ' L' + n1(sx - .02 * H) + ',' + n1(ys + (ouvert ? .22 : .05) * H) + ' L' + n1(nc - nw * .42) + ',' + n1(ys + .22 * H) + ' L' + n1(nc - nw * .82) + ',' + n1(ys - .02 * H) + ' Z', ch, 1.7);
      s += p('M' + n1(nc + nw * .62) + ',' + n1(ntop - .03 * H) + ' L' + n1(sx + .02 * H) + ',' + n1(ys + (ouvert ? .22 : .05) * H) + ' L' + n1(nc + nw * .62) + ',' + n1(ys + .2 * H) + ' L' + n1(nc + nw * .84) + ',' + n1(ys - .02 * H) + ' Z', ch, 1.7);
    }
    return s;
  }
  function revers(G, c, o) {
    o = o || {};
    var nc = G.nc, nw = G.nw, ys = G.ys, H = G.H, sx = G.sx, bas = ys + (o.bas == null ? .95 : o.bas) * H;
    var x1 = nc - nw * .72, x2 = nc + nw * .74;
    var s = p('M' + n1(x1) + ',' + n1(ys - .17 * H) + ' C' + n1(x1 - .05 * H) + ',' + n1(ys) + ' ' + n1(x1 - .1 * H) + ',' + n1(ys + .08 * H) + ' ' + n1(x1 - .13 * H) + ',' + n1(ys + .16 * H) + ' L' + n1(x1 - .03 * H) + ',' + n1(ys + .2 * H) + ' L' + n1(x1 - .24 * H) + ',' + n1(ys + .34 * H) + ' L' + n1(sx - .01 * H) + ',' + n1(bas) + ' L' + n1(sx - .01 * H) + ',' + n1(bas + .08 * H) + ' L' + n1(x1 - .06 * H) + ',' + n1(ys + .36 * H) + ' Z', c, 2);
    s = p('M' + n1(x1) + ',' + n1(ys - .17 * H) + ' C' + n1(x1 - .02 * H) + ',' + n1(ys + .02 * H) + ' ' + n1(x1 + .1 * H) + ',' + n1(ys + .4 * H) + ' ' + n1(sx - .01 * H) + ',' + n1(bas) + ' L' + n1(x1 - .05 * H) + ',' + n1(ys + .42 * H) + ' L' + n1(x1 - .26 * H) + ',' + n1(ys + .24 * H) + ' L' + n1(x1 - .13 * H) + ',' + n1(ys + .18 * H) + ' L' + n1(x1 - .17 * H) + ',' + n1(ys + .08 * H) + ' C' + n1(x1 - .13 * H) + ',' + n1(ys - .04 * H) + ' ' + n1(x1 - .06 * H) + ',' + n1(ys - .14 * H) + ' ' + n1(x1) + ',' + n1(ys - .17 * H) + ' Z', c, 2);
    s += p('M' + n1(x2) + ',' + n1(ys - .17 * H) + ' C' + n1(x2 + .0 * H) + ',' + n1(ys + .04 * H) + ' ' + n1(x2 - .06 * H) + ',' + n1(ys + .4 * H) + ' ' + n1(sx + .01 * H) + ',' + n1(bas) + ' L' + n1(x2 + .06 * H) + ',' + n1(ys + .4 * H) + ' L' + n1(x2 + .2 * H) + ',' + n1(ys + .22 * H) + ' L' + n1(x2 + .1 * H) + ',' + n1(ys + .18 * H) + ' L' + n1(x2 + .13 * H) + ',' + n1(ys + .08 * H) + ' C' + n1(x2 + .1 * H) + ',' + n1(ys - .04 * H) + ' ' + n1(x2 + .05 * H) + ',' + n1(ys - .14 * H) + ' ' + n1(x2) + ',' + n1(ys - .17 * H) + ' Z', c, 2);
    s += t('M' + n1(sx) + ',' + n1(bas + .02 * H) + ' L' + n1(sx + .02 * H) + ',495', 1.5);
    return s;
  }

  var HABITS = {
    megaphone: function (G, f, e) {
      var V = VESTE.megaphone, H = G.H, nc = G.nc, nw = G.nw, ys = G.ys, sx = G.sx;
      var s = plastron(G, { ouvert: true, peau: f.peau, chemise: '#c9cbc6', bas: 1 }) + revers(G, V.o, { bas: 1 });
      // l'écharpe rouge, jetée autour du cou
      s += p('M' + n1(nc - nw * .78) + ',' + n1(ys - .2 * H) + ' C' + n1(nc - nw * .3) + ',' + n1(ys + .02 * H) + ' ' + n1(nc + nw * .4) + ',' + n1(ys + .02 * H) + ' ' + n1(nc + nw * .82) + ',' + n1(ys - .2 * H) + ' C' + n1(nc + nw * .96) + ',' + n1(ys - .08 * H) + ' ' + n1(nc + nw * .9) + ',' + n1(ys + .04 * H) + ' ' + n1(nc + nw * .72) + ',' + n1(ys + .12 * H) + ' C' + n1(nc + nw * .2) + ',' + n1(ys + .22 * H) + ' ' + n1(nc - nw * .5) + ',' + n1(ys + .22 * H) + ' ' + n1(nc - nw * .9) + ',' + n1(ys + .06 * H) + ' C' + n1(nc - nw * 1.0) + ',' + n1(ys - .04 * H) + ' ' + n1(nc - nw * .92) + ',' + n1(ys - .14 * H) + ' ' + n1(nc - nw * .78) + ',' + n1(ys - .2 * H) + ' Z', PAL.rouge, 2.2);
      s += a('M' + n1(nc - nw * .9) + ',' + n1(ys + .06 * H) + ' C' + n1(nc - nw * .5) + ',' + n1(ys + .22 * H) + ' ' + n1(nc + nw * .2) + ',' + n1(ys + .22 * H) + ' ' + n1(nc + nw * .72) + ',' + n1(ys + .12 * H) + ' C' + n1(nc + nw * .2) + ',' + n1(ys + .12 * H) + ' ' + n1(nc - nw * .4) + ',' + n1(ys + .12 * H) + ' ' + n1(nc - nw * .94) + ',' + n1(ys - .02 * H) + ' Z', PAL.rougeO);
      s += p('M' + n1(nc - nw * .5) + ',' + n1(ys + .14 * H) + ' C' + n1(nc - nw * .6) + ',' + n1(ys + .5 * H) + ' ' + n1(nc - nw * .58) + ',' + n1(ys + .9 * H) + ' ' + n1(nc - nw * .46) + ',' + n1(ys + 1.26 * H) + ' L' + n1(nc + nw * .02) + ',' + n1(ys + 1.26 * H) + ' C' + n1(nc - nw * .04) + ',' + n1(ys + .9 * H) + ' ' + n1(nc - nw * .02) + ',' + n1(ys + .5 * H) + ' ' + n1(nc + nw * .12) + ',' + n1(ys + .17 * H) + ' Z', PAL.rouge, 2.2);
      s += a('M' + n1(nc - nw * .5) + ',' + n1(ys + .14 * H) + ' C' + n1(nc - nw * .6) + ',' + n1(ys + .5 * H) + ' ' + n1(nc - nw * .58) + ',' + n1(ys + .9 * H) + ' ' + n1(nc - nw * .46) + ',' + n1(ys + 1.26 * H) + ' L' + n1(nc - nw * .26) + ',' + n1(ys + 1.26 * H) + ' C' + n1(nc - nw * .34) + ',' + n1(ys + .9 * H) + ' ' + n1(nc - nw * .36) + ',' + n1(ys + .5 * H) + ' ' + n1(nc - nw * .22) + ',' + n1(ys + .16 * H) + ' Z', PAL.rougeO);
      return s;
    },
    brushing: function (G) {
      var V = VESTE.brushing, H = G.H, ys = G.ys;
      var s = plastron(G, { cravate: '#35568f', cravateO: '#27395c', bas: 1 }) + revers(G, V.o, { bas: 1 });
      // l'insigne tricolore au revers
      var x = G.d - .36 * H, y = ys + .24 * H;
      s += a('M' + n1(x) + ',' + n1(y) + ' h5 v9 h-5 Z', '#27508c') + a('M' + n1(x + 5) + ',' + n1(y) + ' h5 v9 h-5 Z', PAL.blanc) + a('M' + n1(x + 10) + ',' + n1(y) + ' h5 v9 h-5 Z', PAL.rouge) + t('M' + n1(x) + ',' + n1(y) + ' h15 v9 h-15 Z', .9);
      return s;
    },
    bornee: function (G, f) {
      var V = VESTE.bornee, H = G.H, nc = G.nc, nw = G.nw, ys = G.ys;
      var s = plastron(G, { ouvert: true, peau: f.peau, sansCol: true, chemise: '#d8d2c4', bas: .78 }) + revers(G, V.o, { bas: .78 });
      // collier de perles discret
      var q = []; for (var i = 0; i < 9; i++) { var u = i / 8; q.push([nc - nw * .46 + u * nw * .98, ys - .08 * H + Math.sin(u * Math.PI) * .18 * H]); }
      return s + q.map(function (z) { return cercle(n1(z[0]), n1(z[1]), 2.2, PAL.blanc, .7); }).join('');
    },
    tournesol: function (G, f) {
      var V = VESTE.tournesol, H = G.H, ys = G.ys;
      var s = plastron(G, { ouvert: true, peau: f.peau, chemise: PAL.creme, bas: .9 }) + revers(G, V.o, { bas: .9 });
      // un petit tournesol au revers, en insigne
      var x = n1(G.d - .36 * H), y = n1(ys + .3 * H), pe = '';
      for (var ang = 0; ang < 360; ang += 36) pe += '<g transform="rotate(' + ang + ')">' + p('M0,-3 L2.2,-7 L0,-11 L-2.2,-7 Z', PAL.ocre, .7) + '</g>';
      return s + '<g transform="translate(' + x + ',' + y + ')">' + pe + cercle(0, 0, 3.8, PAL.brunO, .8) + '</g>';
    },
    rillettes: function (G) {
      var V = VESTE.rillettes;
      var s = plastron(G, { cravate: PAL.rouge, cravateO: PAL.rougeO, desserre: 8, bas: 1.02, chemise: PAL.creme }) + revers(G, V.o, { bas: 1.02 });
      for (var i = 0; i < 6; i++) { var x = G.g + 20 + i * 8; s += t('M' + n1(x) + ',' + n1(G.ys + 62) + ' L' + n1(x - 4) + ',495', .6); }
      for (var j = 0; j < 6; j++) { var x2 = G.d - 8 - j * 8; s += t('M' + n1(x2) + ',' + n1(G.ys + 62) + ' L' + n1(x2 + 3) + ',495', .6); }
      return s;
    },
    journaliste: function (G, f) { return plastron(G, { ouvert: true, peau: f.peau, sansCol: true, chemise: PAL.creme, bas: .8 }) + revers(G, VESTE.journaliste.o, { bas: .8 }); },
    matinalier: function (G) { return plastron(G, { chemise: PAL.bleu, ouvert: true, peau: FIG.matinalier.peau, bas: 1 }) + revers(G, VESTE.matinalier.o, { bas: 1 }); }
  };

  /* ---------- Les mains : doigts en boudins, paume, plis. Origine au poignet, doigts vers le haut ---------- */
  function doigt(x, y, ang, l, w, c) {
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + ang + ')">' +
      p('M' + (-w / 2) + ',4 L' + (-w / 2 + .6) + ',' + (-l + w * .44) + ' Q0,' + (-l - w * .28) + ' ' + (w / 2 - .6) + ',' + (-l + w * .44) + ' L' + (w / 2) + ',4 Z', c, 1.7) +
      t('M' + (-w / 2 + 1.6) + ',' + (-l * .46) + ' h' + (w - 3.2), .7) + t('M' + (-w / 2 + 2) + ',' + (-l * .72) + ' h' + (w - 4), .6) + '</g>';
  }
  function mainOuverte(c, o) {
    var s = doigt(19, -46, 20, 30, 11.5, c) + doigt(7, -52, 7, 40, 12.5, c) + doigt(-7, -54, -2, 44, 13, c) + doigt(-20, -50, -11, 38, 12.5, c);
    s += doigt(26, -16, 55, 32, 14, c);
    s += p('M-14,2 C-20,-14 -28,-32 -27,-52 C-14,-58 12,-58 26,-48 C30,-34 32,-24 26,-12 C22,-4 16,0 14,2 Z', c, 1.9);
    s += a('M-14,2 C-20,-14 -28,-32 -27,-52 C-22,-54 -18,-55 -14,-56 C-16,-36 -10,-14 -2,2 Z', o);
    s += t('M-20,-28 C-8,-36 8,-34 16,-26 M8,-14 C2,-18 -4,-16 -6,-8', .9);
    return s;
  }
  function poing(c, o) {
    var s = '';
    s += p('M-14,2 C-22,-8 -30,-18 -30,-30 L-30,-52 C-16,-60 16,-60 30,-50 L32,-28 C30,-14 22,-6 14,2 Z', c, 2);
    s += a('M-14,2 C-22,-8 -30,-18 -30,-30 L-30,-40 C-20,-30 -8,-14 0,2 Z', o);
    [-22, -7, 8, 22].forEach(function (x, i) {
      s += p('M' + (x - 7.5) + ',-30 L' + (x - 7.5) + ',-54 Q' + x + ',-64 ' + (x + 7.5) + ',-54 L' + (x + 7.5) + ',-30 Q' + x + ',-24 ' + (x - 7.5) + ',-30 Z', c, 1.6);
    });
    s += p('M-26,-22 C-18,-34 8,-36 18,-30 C24,-26 20,-16 12,-16 C0,-16 -10,-12 -18,-8 C-24,-8 -28,-16 -26,-22 Z', c, 1.8);
    s += t('M2,-32 Q6,-26 3,-18', .7);
    return s;
  }
  function mainIndex(c, o) {
    /* index tendu vers le haut ; on tourne l'ensemble pour le pointer */
    var s = doigt(-8, -52, 2, 56, 13, c);
    s += p('M-14,2 C-22,-8 -26,-20 -24,-36 C-22,-50 -14,-56 -2,-56 C10,-56 26,-52 30,-40 C34,-28 28,-12 14,2 Z', c, 2);
    s += a('M-14,2 C-22,-8 -26,-20 -24,-36 C-20,-30 -10,-14 0,2 Z', o);
    [[6, -48], [15, -40], [22, -30]].forEach(function (q) { s += p('M' + (q[0] - 6) + ',' + q[1] + ' C' + (q[0] - 4) + ',' + (q[1] - 12) + ' ' + (q[0] + 8) + ',' + (q[1] - 8) + ' ' + (q[0] + 7) + ',' + (q[1] + 2) + ' C' + (q[0] + 6) + ',' + (q[1] + 10) + ' ' + (q[0] - 2) + ',' + (q[1] + 12) + ' ' + (q[0] - 6) + ',' + q[1] + ' Z', c, 1.5); });
    s += p('M-20,-16 C-16,-34 -4,-40 6,-34 C12,-30 8,-22 2,-22 C-4,-20 -8,-12 -12,-6 Z', c, 1.7);
    return s;
  }
  /* la main refermée sur un objet posé dessous : quatre doigts à l'horizontale, le pouce à part */
  function mainPrise(c, o) {
    var s = p('M-14,10 C-30,4 -38,-10 -36,-26 L-20,-30 L-14,10 Z', c, 1.9);
    [-24, -11, 2, 15].forEach(function (y, i) {
      s += p('M-28,' + y + ' C-14,' + (y - 3) + ' 10,' + (y - 3) + ' ' + (24 - i * 1.5) + ',' + (y + 1) + ' C' + (31 - i * 1.5) + ',' + (y + 4) + ' ' + (31 - i * 1.5) + ',' + (y + 11) + ' ' + (24 - i * 1.5) + ',' + (y + 13) + ' C10,' + (y + 15) + ' -14,' + (y + 15) + ' -28,' + (y + 12) + ' Z', c, 1.6);
    });
    s += a('M-36,-26 C-38,-10 -30,4 -14,10 L-22,-26 Z', o);
    return s;
  }
  /* le bras : du coude (souvent hors cadre) au poignet, avec son poignet de chemise */
  function bras(c, o, cu, po, lc, lp, mc) {
    var dx = po[0] - cu[0], dy = po[1] - cu[1], l = Math.sqrt(dx * dx + dy * dy), nx = -dy / l, ny = dx / l, s = '';
    var A = [cu[0] + nx * lc, cu[1] + ny * lc], B = [po[0] + nx * lp, po[1] + ny * lp], C = [po[0] - nx * lp, po[1] - ny * lp], D = [cu[0] - nx * lc, cu[1] - ny * lc];
    var mil = [(A[0] + B[0]) / 2 + nx * 3, (A[1] + B[1]) / 2 + ny * 3], mi2 = [(C[0] + D[0]) / 2 - nx * 3, (C[1] + D[1]) / 2 - ny * 3];
    s += p('M' + n1(A[0]) + ',' + n1(A[1]) + ' Q' + n1(mil[0]) + ',' + n1(mil[1]) + ' ' + n1(B[0]) + ',' + n1(B[1]) + ' L' + n1(C[0]) + ',' + n1(C[1]) + ' Q' + n1(mi2[0]) + ',' + n1(mi2[1]) + ' ' + n1(D[0]) + ',' + n1(D[1]) + ' Z', c, 2.4);
    s += a('M' + n1(A[0]) + ',' + n1(A[1]) + ' Q' + n1(mil[0]) + ',' + n1(mil[1]) + ' ' + n1(B[0]) + ',' + n1(B[1]) + ' L' + n1(po[0] + nx * lp * .4) + ',' + n1(po[1] + ny * lp * .4) + ' L' + n1(cu[0] + nx * lc * .4) + ',' + n1(cu[1] + ny * lc * .4) + ' Z', o);
    // quelques plis d'étoffe
    [.35, .62].forEach(function (u, i) { var x = cu[0] + dx * u, y = cu[1] + dy * u, w = (lc + (lp - lc) * u) * .7; s += t('M' + n1(x + nx * w) + ',' + n1(y + ny * w) + ' q' + n1(dx / l * 8) + ',' + n1(dy / l * 8) + ' ' + n1(-nx * w * (i ? .8 : 1.1)) + ',' + n1(-ny * w * (i ? .8 : 1.1)), .9); });
    // la manchette
    var E = [po[0] + dx / l * 9, po[1] + dy / l * 9];
    s += p('M' + n1(B[0] - nx * 2) + ',' + n1(B[1] - ny * 2) + ' L' + n1(E[0] + nx * (lp - 4)) + ',' + n1(E[1] + ny * (lp - 4)) + ' L' + n1(E[0] - nx * (lp - 4)) + ',' + n1(E[1] - ny * (lp - 4)) + ' L' + n1(C[0] + nx * 2) + ',' + n1(C[1] + ny * 2) + ' Z', mc || PAL.blanc, 1.8);
    return { s: s, ang: Math.atan2(dx, -dy) * 180 / Math.PI, bout: E };
  }
  /* une main posée au bout d'un bras */
  function auBout(b, main, ech, dAng) {
    return b.s + '<g transform="translate(' + n1(b.bout[0]) + ',' + n1(b.bout[1]) + ') rotate(' + n1(b.ang + (dAng || 0)) + ') scale(' + ech + ')">' + main + '</g>';
  }

  /* ---------- Les objets ---------- */
  function megaphone() {
    return p('M0,0 L78,-34 C86,-22 90,-6 90,12 L4,16 C-2,10 -4,5 0,0 Z', PAL.blanc, 2.2) +
      a('M4,16 L90,12 C90,6 89,0 88,-4 L2,8 Z', '#d9c9a4') +
      p('M78,-34 C92,-36 104,-16 103,8 C102,22 92,22 90,12 C90,-6 86,-22 78,-34 Z', PAL.rouge, 2.2) +
      p('M84,-25 C92,-20 97,-6 95,8 C93,14 92,14 90,10 C90,-4 88,-16 84,-25 Z', PAL.rougeO, 1) +
      t('M24,-10 C28,-3 30,6 28,14', 1.2) +
      p('M-14,-2 C-18,0 -20,10 -14,14 L4,16 C-2,10 -4,5 0,0 Z', PAL.noir, 1.8);
  }
  function telephone() {
    return p('M-26,-50 Q-26,-54 -22,-54 L22,-54 Q26,-54 26,-50 L26,50 Q26,54 22,54 L-22,54 Q-26,54 -26,50 Z', PAL.noir, 2.4) +
      p('M-18,-46 h14 v14 h-14 Z', '#4a4540', 1.2) + cercle(-11, -39, 3.6, '#7d94a0', 1) + teinte(t('M8,40 L18,40', 1), '#6b5e54');
  }

  /* ---------- Les gestes ---------- */
  var GESTES = {
    megaphone: {
      megaphone: function (G, c, o, pe, po) {
        var b = bras(c, o, [G.g + 40, 500], [G.g + 196, G.ys + 136], 37, 25, '#c9cbc6');
        return '<g transform="translate(' + n1(G.g + 234) + ',' + n1(G.ys + 92) + ') rotate(-18) scale(1.18)">' + megaphone() + '</g>' + auBout(b, mainPrise(pe, po), .9, 66);
      },
      index: function (G, c, o, pe, po) {
        var b = bras(c, o, [G.g + 54, 510], [G.g + 252, G.ys + 44], 38, 25, '#c9cbc6');
        return auBout(b, mainIndex(pe, po), 1.02, 22);
      },
      poing: function (G, c, o, pe, po) {
        var b = bras(c, o, [G.d - 34, 520], [G.d - 26, G.ys + 2], 38, 25, '#c9cbc6');
        return auBout(b, poing(pe, po), 1.04, 0);
      }
    },
    brushing: {
      selfie: function (G, c, o, pe, po) {
        var b = bras(c, o, [G.d - 10, 510], [G.d + 8, G.ys + 34], 32, 21);
        return '<g transform="translate(' + n1(G.d + 12) + ',' + n1(G.ys - 14) + ') rotate(6) scale(.72)">' + telephone() + '</g>' + auBout(b, mainPrise(pe, po), .76, -86);
      },
      paume: function (G, c, o, pe, po) {
        var b = bras(c, o, [G.g + 66, 510], [G.g + 224, G.ys + 112], 33, 21);
        return auBout(b, mainOuverte(pe, po), .9, 12);
      }
    },
    bornee: {
      dossier: function (G, c, o, pe, po) {
        var x = G.cx - 8, y = G.ys + 92;
        var s = p('M' + x + ',' + y + ' L' + (x + 118) + ',' + (y - 8) + ' L' + (x + 128) + ',' + (y + 120) + ' L' + (x + 8) + ',' + (y + 134) + ' Z', PAL.rouge, 2.3);
        s += a('M' + x + ',' + y + ' L' + (x + 118) + ',' + (y - 8) + ' L' + (x + 119) + ',' + (y + 4) + ' L' + (x + 1) + ',' + (y + 12) + ' Z', PAL.rougeO);
        s += p('M' + (x + 24) + ',' + (y + 28) + ' L' + (x + 104) + ',' + (y + 22) + ' L' + (x + 107) + ',' + (y + 72) + ' L' + (x + 27) + ',' + (y + 78) + ' Z', PAL.creme, 1.5);
        s += root.Lettrage ? root.Lettrage.ligne('49.3', x + 66, y + 36, 24, { ancre: 'm', gras: true }) : '';
        var b = bras(c, o, [G.g + 24, 510], [x - 4, y + 96], 30, 18, '#d8d2c4');
        return s + auBout(b, mainPrise(pe, po), .76, 62);
      }
    },
    tournesol: {
      mug: function (G, c, o, pe, po) {
        var x = G.cx + 4, y = G.ys + 92;
        var s = p('M' + x + ',' + y + ' L' + (x + 52) + ',' + (y - 2) + ' L' + (x + 48) + ',' + (y + 68) + ' Q' + (x + 26) + ',' + (y + 74) + ' ' + (x + 4) + ',' + (y + 68) + ' Z', PAL.bleu, 2.2);
        s += '<ellipse cx="' + (x + 26) + '" cy="' + (y - 1) + '" rx="26" ry="6" fill="#4a2c1a" stroke="' + INK + '" stroke-width="' + (1.9 * K).toFixed(2) + '"/>';
        s += p('M' + (x + 51) + ',' + (y + 14) + ' C' + (x + 72) + ',' + (y + 10) + ' ' + (x + 72) + ',' + (y + 50) + ' ' + (x + 49) + ',' + (y + 48), 'none', 2.8);
        var b = bras(c, o, [G.g + 18, 510], [x - 24, y + 54], 30, 18, PAL.creme);
        return s + auBout(b, mainPrise(pe, po), .76, 64);
      },
      paume: function (G, c, o, pe, po) {
        var b = bras(c, o, [G.g + 40, 510], [G.g + 184, G.ys + 96], 30, 18, PAL.creme);
        return auBout(b, mainOuverte(pe, po), .78, 16);
      }
    },
    rillettes: {
      verre: function (G, c, o, pe, po) {
        var x = G.d + 2, y = G.ys + 2;
        var s = p('M' + (x - 26) + ',' + (y - 76) + ' C' + (x - 32) + ',' + (y - 44) + ' ' + (x - 18) + ',' + (y - 20) + ' ' + x + ',' + (y - 20) + ' C' + (x + 18) + ',' + (y - 20) + ' ' + (x + 32) + ',' + (y - 44) + ' ' + (x + 26) + ',' + (y - 76) + ' Z', PAL.blanc, 2);
        s += a('M' + (x - 28.5) + ',' + (y - 54) + ' C' + (x - 26) + ',' + (y - 36) + ' ' + (x - 14) + ',' + (y - 21) + ' ' + x + ',' + (y - 21) + ' C' + (x + 14) + ',' + (y - 21) + ' ' + (x + 26) + ',' + (y - 36) + ' ' + (x + 28.5) + ',' + (y - 54) + ' Z', PAL.rougeO);
        s += t('M' + (x - 28.5) + ',' + (y - 54) + ' Q' + x + ',' + (y - 48) + ' ' + (x + 28.5) + ',' + (y - 54), 1) + p('M' + x + ',' + (y - 20) + ' V' + (y + 28), 'none', 2.2);
        var b = bras(c, o, [G.d - 14, 510], [x - 12, y + 66], 38, 24, PAL.creme);
        return s + auBout(b, mainPrise(pe, po), .72, -78);
      }
    }
  };

  /* ---------- Le casque de radio ---------- */
  function casque(V) {
    var pts = [];
    tranches(.5, .04, .08).forEach(function (y) { var d = V.dims(y); pts.push(V.proj(-(d.a + .05), y, -.04)); });
    pts.push(V.proj(0, -.05, -.04));
    tranches(.04, .5, .08).forEach(function (y) { var d = V.dims(y); pts.push(V.proj(d.a + .05, y, -.04)); });
    var arc = lisse(pts), s = p(arc, 'none', 5.2) + teinte(p(arc, 'none', 2.2), PAL.grisO);
    var c = V.proj(-(V.dims(.5).a + .05), .52, -.04), H = V.H;
    s += '<ellipse cx="' + n1(c[0]) + '" cy="' + n1(c[1]) + '" rx="' + n1(.075 * H) + '" ry="' + n1(.115 * H) + '" fill="' + PAL.noir + '" stroke="' + INK + '" stroke-width="' + (2 * K).toFixed(2) + '"/>';
    s += teinte(t('M' + n1(c[0] - .03 * H) + ',' + n1(c[1] - .06 * H) + ' q' + n1(.05 * H) + ',' + n1(-.02 * H) + ' ' + n1(.06 * H) + ',' + n1(.05 * H), 1), '#6b5e54');
    return s;
  }

  /* ---------- Assemblage d'un buste ----------
     nom, expression, { lacet : tourne la tête (0 face, 45 très de côté), tangage, rot : penche, geste, s : échelle prévue, casque } */
  function buste(nom, expr, o) {
    o = o || {};
    var f = FIG[nom], G = gabarit(nom), e = EXPR[expr || 'neutre'], s = o.s || 1, avant = K;
    K = 1 / Math.pow(s, 0.72);
    var lacet = o.lacet == null ? f.lacet : o.lacet, H = f.H, ox = G.cx - lacet * .0024 * H + (o.dx || 0), oy = 34 + .55 * H;
    var V = Volume(f.m, lacet, o.tangage || 0, e.j, H, ox, oy), vc = VESTE[nom], pe = f.peau || PAL.peau, po = f.peauO || PAL.peauO;
    var rot = o.rot || 0, pivot = n1(G.nc) + ' ' + n1(oy + .4 * H);
    var geste = o.geste && GESTES[nom] && GESTES[nom][o.geste] ? GESTES[nom][o.geste](G, vc.c, vc.o, pe, po) : '';
    var out = veste(G, vc.c, vc.o) +
      '<g transform="rotate(' + rot + ' ' + pivot + ')">' + (f.dos ? f.dos(V) : '') + '</g>' +
      cou(G, pe, po, f) + HABITS[nom](G, f, e) +
      '<g transform="rotate(' + rot + ' ' + pivot + ')">' + tete(V, e, f, o) + (o.casque ? casque(V) : '') + '</g>' + geste;
    K = avant;
    return '<g stroke-linecap="round" stroke-linejoin="round">' + out + '</g>';
  }

  root.Perso = { PAL: PAL, INK: INK, buste: buste, p: p, a: a, t: t, cercle: cercle, poing: poing, mainIndex: mainIndex, telephone: telephone, setK: function (k) { K = k; }, getK: function () { return K; } };
})(this);

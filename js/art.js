/* Politik — illustrations, style dessin de presse (SVG dessinés à la main, personnages inventés).
   ART.portrait(pid) : le candidat d'un parti · ART.advisor() : Lulu · ART.vignette(clé) : petite scène pour le journal. */
(function (root) {
  var INK = '#1B1F3B', W = 2.6;
  var uid = 0;
  function o(extra) { return ' stroke="' + INK + '" stroke-width="' + (extra || W) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function dots(id, color, op) {
    return '<pattern id="' + id + '" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" fill="' + color + '" opacity="' + (op || 0.35) + '"/></pattern>';
  }
  /* cadre commun d'un portrait : fond tramé de la couleur du parti, découpé en cercle */
  function frame(color, inner) {
    var id = 'p' + (++uid);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" class="art">' +
      '<defs><clipPath id="' + id + 'c"><circle cx="60" cy="60" r="57"/></clipPath>' + dots(id + 'd', INK, 0.18) + '</defs>' +
      '<circle cx="60" cy="60" r="57" fill="' + color + '"/>' +
      '<circle cx="60" cy="60" r="57" fill="url(#' + id + 'd)"/>' +
      '<g clip-path="url(#' + id + 'c)">' + inner + '</g>' +
      '<circle cx="60" cy="60" r="57" fill="none"' + o(3.2) + '/></svg>';
  }
  function body(suit, shirt, extra) {
    return '<path d="M8,124 C10,96 30,86 60,86 C90,86 110,96 112,124 Z" fill="' + suit + '"' + o() + '/>' +
      '<path d="M48,86 L60,104 L72,86 Z" fill="' + (shirt || '#FFFFFF') + '"' + o(2) + '/>' + (extra || '');
  }
  function neck(skin) { return '<path d="M51,70 L51,90 Q60,96 69,90 L69,70 Z" fill="' + skin + '"' + o(2.2) + '/>'; }
  function ears(skin, y, dx) {
    y = y || 54; dx = dx || 24;
    return '<ellipse cx="' + (60 - dx) + '" cy="' + y + '" rx="5" ry="7" fill="' + skin + '"' + o(2.2) + '/>' +
           '<ellipse cx="' + (60 + dx) + '" cy="' + y + '" rx="5" ry="7" fill="' + skin + '"' + o(2.2) + '/>';
  }
  function eyes(y, opt) {
    opt = opt || {};
    var dx = opt.dx || 9, r = opt.r || 4.2, py = opt.py || 0, px = opt.px || 0;
    if (opt.closed) return '<path d="M' + (60 - dx - 4) + ',' + y + ' q4,3 8,0 M' + (60 + dx - 4) + ',' + y + ' q4,3 8,0" fill="none"' + o(2.4) + '/>';
    return '<ellipse cx="' + (60 - dx) + '" cy="' + y + '" rx="' + r + '" ry="' + (r + 0.6) + '" fill="#fff"' + o(1.8) + '/>' +
           '<ellipse cx="' + (60 + dx) + '" cy="' + y + '" rx="' + r + '" ry="' + (r + 0.6) + '" fill="#fff"' + o(1.8) + '/>' +
           '<circle cx="' + (60 - dx + px) + '" cy="' + (y + py) + '" r="2" fill="' + INK + '"/><circle cx="' + (60 + dx + px) + '" cy="' + (y + py) + '" r="2" fill="' + INK + '"/>';
  }
  function brows(y, tilt, thick, color) {
    var c = color || INK, t = thick || 3.4;
    return '<path d="M' + 44 + ',' + (y + tilt) + ' L' + 55 + ',' + (y - tilt) + ' M' + 65 + ',' + (y - tilt) + ' L' + 76 + ',' + (y + tilt) + '" fill="none" stroke="' + c + '" stroke-width="' + t + '" stroke-linecap="round"/>';
  }
  function blush(y) { return '<ellipse cx="44" cy="' + y + '" rx="4" ry="2.4" fill="#E8776F" opacity=".45"/><ellipse cx="76" cy="' + y + '" rx="4" ry="2.4" fill="#E8776F" opacity=".45"/>'; }

  var P = {};
  /* La France Indignée — Rémi Barricade, le tribun de la rue : crâne dégarni, sourcils broussailleux, il harangue la foule */
  P.FI = function () {
    var sk = '#E9B58C';
    return frame('#F4A3A0',
      body('#4A4A55', '#FFFFFF', '<path d="M36,92 Q60,104 84,92 L86,104 Q60,114 34,104 Z" fill="#C8323C"' + o() + '/><path d="M74,100 L82,124 L92,122 L84,98 Z" fill="#C8323C"' + o() + '/>') +
      neck(sk) + ears(sk, 54, 25) +
      '<path d="M35,52 Q34,22 60,20 Q86,22 85,52 Q86,80 60,82 Q34,80 35,52 Z" fill="' + sk + '"' + o() + '/>' +
      '<path d="M35,48 Q30,34 40,30 Q38,40 42,46 Z M85,48 Q90,34 80,30 Q82,40 78,46 Z" fill="#B8B8C0"' + o(2) + '/>' +
      brows(40, 3.5, 5.2, '#7A7A84') + eyes(48, { r: 3.8, py: -0.5 }) +
      '<path d="M57,52 Q55,60 58,62 Q61,63 63,61" fill="none"' + o(2.2) + '/>' +
      '<path d="M48,66 Q60,62 72,66 Q70,79 60,79 Q50,79 48,66 Z" fill="#7A1E24"' + o(2.4) + '/>' +
      '<path d="M50,66 Q60,64 70,66 L69,69 Q60,67 51,69 Z" fill="#fff"/>' +
      '<path d="M96,80 L96,62 Q96,56 101,56 L111,56 Q116,56 116,62 L116,80 Z" fill="' + sk + '"' + o() + '/>' +
      '<path d="M101,56 L101,64 M106,56 L106,64 M111,56 L111,64" fill="none"' + o(1.8) + '/>' +
      '<path d="M98,84 L96,124 L116,124 L114,82 Z" fill="#4A4A55"' + o() + '/>' +
      '<path d="M90,48 L84,42 M92,56 L86,56 M24,46 L30,42" fill="none"' + o(2) + '/>');
  };
  /* Les Verts Pâturages — Capucine Verdure, l'écolo à vélo : cheveux bouclés, lunettes rondes, une feuille dans les cheveux */
  P.VP = function () {
    var sk = '#F6D4B6';
    return frame('#A8D9B4',
      '<path d="M22,76 Q14,40 34,22 Q60,6 86,22 Q106,40 98,76 Q92,84 86,74 L34,74 Q28,84 22,76 Z" fill="#8A5A3B"' + o() + '/>' +
      body('#3E9B5A', '#F4F0E6', '<path d="M52,96 l4,8 M64,96 l4,8" fill="none"' + o(1.6) + '/>') +
      neck(sk) + ears(sk, 56, 22) +
      '<path d="M39,54 Q38,28 60,27 Q82,28 81,54 Q81,78 60,80 Q39,78 39,54 Z" fill="' + sk + '"' + o() + '/>' +
      '<path d="M38,46 Q40,26 60,26 Q80,26 82,46 Q74,34 64,38 Q56,30 48,38 Q42,36 38,46 Z" fill="#8A5A3B"' + o(2.2) + '/>' +
      '<circle cx="34" cy="36" r="6" fill="#8A5A3B"' + o(2) + '/><circle cx="86" cy="36" r="6" fill="#8A5A3B"' + o(2) + '/>' +
      '<path d="M78,22 Q90,14 96,22 Q88,30 78,22 Z M78,22 L94,20" fill="#5DBB63"' + o(2) + '/>' +
      brows(43, -1, 2.6) + eyes(52, { r: 3.4 }) +
      '<circle cx="51" cy="52" r="7.5" fill="none"' + o(2.4) + '/><circle cx="69" cy="52" r="7.5" fill="none"' + o(2.4) + '/><path d="M58.5,52 L61.5,52" fill="none"' + o(2.4) + '/>' +
      '<path d="M59,57 Q57,63 61,64" fill="none"' + o(2) + '/>' +
      '<g fill="#B5734F"><circle cx="46" cy="62" r=".9"/><circle cx="49" cy="64" r=".9"/><circle cx="74" cy="62" r=".9"/><circle cx="71" cy="64" r=".9"/></g>' +
      '<path d="M51,69 Q60,76 69,69" fill="none"' + o(2.6) + '/>' + blush(64));
  };
  /* Socialisme Modéré — Claire Consensus, la sage du parti : carré gris, collier de perles, une rose au revers */
  P.SM = function () {
    var sk = '#F2CBA6';
    return frame('#F3BCD1',
      '<path d="M30,74 Q24,30 60,24 Q96,30 90,74 L78,74 L78,46 L42,46 L42,74 Z" fill="#C9C9D1"' + o() + '/>' +
      body('#E07AA0', '#FFFFFF', '<g fill="#fff"' + o(1.2) + '><circle cx="50" cy="90" r="2.2"/><circle cx="55" cy="93" r="2.2"/><circle cx="60" cy="94" r="2.2"/><circle cx="65" cy="93" r="2.2"/><circle cx="70" cy="90" r="2.2"/></g>' +
        '<circle cx="88" cy="102" r="5" fill="#C8323C"' + o(2) + '/><path d="M86,100 q2,2 4,0" fill="none"' + o(1.4) + '/><path d="M88,107 L86,116" fill="none" stroke="#2E7D46" stroke-width="2.4"/>') +
      neck(sk) + ears(sk, 56, 22) +
      '<path d="M39,54 Q38,30 60,29 Q82,30 81,54 Q80,78 60,80 Q40,78 39,54 Z" fill="' + sk + '"' + o() + '/>' +
      '<path d="M37,52 Q34,26 60,24 Q86,26 83,52 Q78,36 62,36 Q48,36 37,52 Z" fill="#C9C9D1"' + o(2.2) + '/>' +
      brows(44, -1.5, 2.6, '#8A8A94') + eyes(52, { closed: true }) +
      '<path d="M59,55 Q57,62 61,63" fill="none"' + o(2) + '/>' +
      '<path d="M51,68 Q60,73 69,68" fill="none"' + o(2.6) + '/>' + blush(63) +
      '<path d="M40,64 Q38,70 42,72 M80,64 Q82,70 78,72" fill="none" stroke="' + INK + '" stroke-width="1.2" opacity=".5"/>');
  };
  /* En Mouvement — Inès Disrupt, la start-uppeuse : chignon haut, micro-casque, sourire éclatant */
  P.EM = function () {
    var sk = '#8D5A3B';
    return frame('#F7CF8E',
      body('#26305A', '#F2A93B') +
      neck(sk) + ears(sk, 56, 22) +
      '<ellipse cx="60" cy="16" rx="13" ry="10" fill="#1E1A1A"' + o() + '/>' +
      '<path d="M39,54 Q38,28 60,27 Q82,28 81,54 Q81,79 60,81 Q39,79 39,54 Z" fill="' + sk + '"' + o() + '/>' +
      '<path d="M38,50 Q36,26 60,25 Q84,26 82,50 Q78,34 60,34 Q44,34 38,50 Z" fill="#1E1A1A"' + o(2.2) + '/>' +
      '<path d="M36,56 Q34,30 60,28 Q86,30 84,56" fill="none"' + o(3) + '/>' +
      '<rect x="80" y="50" width="7" height="12" rx="3" fill="#1E1A1A"' + o(2) + '/><path d="M83,62 Q80,72 68,72" fill="none"' + o(2.2) + '/><circle cx="67" cy="72" r="2.4" fill="#1E1A1A"' + o(1.4) + '/>' +
      brows(43, -2, 3) + eyes(51, { r: 3.6, px: 0.6 }) +
      '<path d="M58,55 Q56,62 61,62" fill="none" stroke="#3A2416" stroke-width="2"/>' +
      '<path d="M48,66 Q60,64 72,66 Q68,77 60,77 Q52,77 48,66 Z" fill="#fff"' + o(2.4) + '/><path d="M49,67 Q60,70 71,67" fill="none"' + o(1.4) + '/>' +
      '<path d="M90,30 l4,-4 M94,38 l6,-1 M88,22 l1,-6" fill="none" stroke="#F5D547" stroke-width="2.4" stroke-linecap="round"/>');
  };
  /* L'Union Gaulliste — Hubert de La Motte, le notable : visage allongé, moustache fournie, menton levé */
  P.UG = function () {
    var sk = '#F0C9A4';
    return frame('#A9C4EE',
      body('#2B3F78', '#FFFFFF', '<path d="M56,90 L64,90 L66,112 L60,118 L54,112 Z" fill="#1B1F3B"' + o(1.6) + '/>' +
        '<path d="M80,96 L90,96 L88,102 L80,102 Z" fill="#fff"' + o(1.4) + '/><path d="M80,96 L83,96 L83,102 L80,102 Z" fill="#4A7FD0"/><path d="M87,96 L90,96 L89,102 L86.5,102 Z" fill="#C8323C"/>') +
      neck(sk) + ears(sk, 52, 21) +
      '<path d="M40,50 Q39,18 60,16 Q81,18 80,50 Q80,82 60,86 Q40,82 40,50 Z" fill="' + sk + '"' + o() + '/>' +
      '<path d="M39,40 Q38,14 62,14 Q84,15 81,38 Q74,24 56,26 Q46,28 39,40 Z" fill="#F4F0E6"' + o(2.2) + '/>' +
      brows(38, 0.5, 3.4, '#C9C9D1') + eyes(46, { closed: true }) +
      '<path d="M58,48 Q56,60 62,61" fill="none"' + o(2.2) + '/>' +
      '<path d="M44,68 Q52,60 60,64 Q68,60 76,68 Q70,70 60,67 Q50,70 44,68 Z" fill="#E6E2D8"' + o(2.2) + '/>' +
      '<path d="M54,74 Q60,76 66,74" fill="none"' + o(2.2) + '/>' +
      '<path d="M24,30 L30,34 M96,30 L90,34" fill="none" stroke="#F5D547" stroke-width="2.4" stroke-linecap="round"/>');
  };
  /* Mouvement National — Victor Rempart, le bulldog : mâchoire carrée, cheveux en brosse, regard noir */
  P.MN = function () {
    var sk = '#E3AE86';
    return frame('#9BA6CC',
      body('#1F2A4E', '#FFFFFF', '<path d="M56,88 L64,88 L66,112 L60,118 L54,112 Z" fill="#4A7FD0"' + o(1.6) + '/>' +
        '<rect x="80" y="96" width="9" height="6" fill="#fff"' + o(1.2) + '/><rect x="80" y="96" width="3" height="6" fill="#4A7FD0"/><rect x="86" y="96" width="3" height="6" fill="#C8323C"/>') +
      '<path d="M46,70 L46,90 Q60,98 74,90 L74,70 Z" fill="' + sk + '"' + o(2.2) + '/>' + ears(sk, 52, 28) +
      '<path d="M32,40 Q32,22 60,22 Q88,22 88,40 L88,62 Q88,82 72,84 L48,84 Q32,82 32,62 Z" fill="' + sk + '"' + o() + '/>' +
      '<path d="M32,40 Q32,20 60,20 Q88,20 88,40 L88,34 L32,34 Z" fill="#8F8F99"' + o(2.2) + '/>' +
      '<path d="M36,24 l0,-4 M44,22 l0,-4 M52,21 l0,-4 M60,20 l0,-4 M68,21 l0,-4 M76,22 l0,-4 M84,24 l0,-4" fill="none" stroke="#8F8F99" stroke-width="2.6" stroke-linecap="round"/>' +
      brows(44, -3.5, 5.2) + eyes(50, { r: 3.2, py: 0.6 }) +
      '<path d="M56,52 Q53,62 58,64 L64,64 Q68,62 64,52" fill="none"' + o(2.2) + '/>' +
      '<path d="M48,74 Q60,70 72,74" fill="none"' + o(3) + '/><path d="M46,72 L48,74 M74,72 L72,74" fill="none"' + o(2) + '/>' +
      '<path d="M34,64 Q36,78 46,82 M86,64 Q84,78 74,82" fill="none" stroke="' + INK + '" stroke-width="1.2" opacity=".5"/>');
  };

  /* Lulu, ta directrice de campagne : grosses lunettes, chignon et crayon, café à la main */
  function advisor() {
    var sk = '#F3C9A8';
    return frame('#F5D547',
      body('#1B1F3B', '#FFFFFF', '<path d="M86,92 L104,92 L102,122 L88,122 Z" fill="#fff"' + o() + '/><path d="M104,98 Q112,100 104,108" fill="none"' + o(2.4) + '/><path d="M90,86 q2,-4 0,-8 M96,86 q2,-4 0,-8" fill="none"' + o(1.6) + '/>' +
        '<text x="95" y="112" font-size="7" font-weight="800" text-anchor="middle" fill="' + INK + '" font-family="sans-serif">QG</text>') +
      neck(sk) + ears(sk, 56, 22) +
      '<circle cx="60" cy="18" r="11" fill="#C8562B"' + o() + '/><path d="M64,8 L76,2" fill="none" stroke="#F2A93B" stroke-width="3.4" stroke-linecap="round"/><path d="M64,8 L76,2" fill="none"' + o(1) + '/>' +
      '<path d="M39,54 Q38,28 60,27 Q82,28 81,54 Q81,79 60,81 Q39,79 39,54 Z" fill="' + sk + '"' + o() + '/>' +
      '<path d="M38,50 Q36,25 60,25 Q84,25 82,50 Q76,32 58,36 Q46,36 38,50 Z" fill="#C8562B"' + o(2.2) + '/>' +
      '<path d="M40,56 Q36,64 40,70" fill="none" stroke="#C8562B" stroke-width="3" stroke-linecap="round"/>' +
      brows(42, -1.5, 2.8) +
      '<rect x="41" y="45" width="16" height="13" rx="4" fill="#fff"' + o(2.6) + '/><rect x="63" y="45" width="16" height="13" rx="4" fill="#fff"' + o(2.6) + '/><path d="M57,50 L63,50" fill="none"' + o(2.4) + '/>' +
      '<circle cx="50" cy="52" r="2.2" fill="' + INK + '"/><path d="M67,52 q4,-3 8,0" fill="none"' + o(2.2) + '/>' +
      '<path d="M59,59 Q58,64 62,64" fill="none"' + o(2) + '/>' +
      '<path d="M50,69 Q58,75 70,67" fill="none"' + o(2.6) + '/>' + blush(64));
  }

  /* Vignettes du journal (160 × 100) */
  function scene(inner, bg) {
    var id = 'v' + (++uid);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" class="art">' +
      '<defs>' + dots(id + 'd', INK, 0.2) + '</defs>' +
      '<rect x="1.5" y="1.5" width="157" height="97" rx="4" fill="' + (bg || '#F4F0E6') + '"/>' +
      '<rect x="1.5" y="1.5" width="157" height="97" rx="4" fill="url(#' + id + 'd)"/>' + inner +
      '<rect x="1.5" y="1.5" width="157" height="97" rx="4" fill="none"' + o(3) + '/></svg>';
  }
  var V = {};
  V.pouvoir = function () { return scene(
    '<path d="M20,30 L34,30 L44,70 L112,70 L122,40 L38,40" fill="none"' + o(3.4) + '/>' +
    '<path d="M40,40 L120,40 L112,64 L46,64 Z" fill="#fff"' + o() + '/><path d="M60,40 L62,64 M80,40 L80,64 M100,40 L98,64 M42,52 L116,52" fill="none"' + o(1.6) + '/>' +
    '<circle cx="54" cy="82" r="7" fill="#fff"' + o() + '/><circle cx="104" cy="82" r="7" fill="#fff"' + o() + '/>' +
    '<path d="M60,40 L60,24 L84,18 L90,40 Z" fill="#F2A93B"' + o() + '/><path d="M92,40 L96,20 L114,26 L108,40 Z" fill="#E07AA0"' + o() + '/>' +
    '<path d="M118,14 L148,14 L148,34 L118,34 L112,24 Z" fill="#F5D547"' + o() + '/><text x="132" y="29" font-size="12" font-weight="900" text-anchor="middle" fill="' + INK + '" font-family="sans-serif">+12%</text>' +
    '<path d="M136,40 L136,62 M128,48 L136,40 L144,48" fill="none" stroke="#C8323C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>', '#FBE7B0'); };
  V.emploi = function () { return scene(
    '<path d="M14,86 L14,48 L40,34 L40,48 L66,34 L66,48 L92,34 L92,86 Z" fill="#C9C9D1"' + o() + '/>' +
    '<rect x="100" y="20" width="14" height="66" fill="#9BA6CC"' + o() + '/><path d="M104,16 Q110,6 118,10 Q126,4 132,12" fill="none"' + o(2) + ' opacity=".5"/>' +
    '<rect x="94" y="54" width="52" height="32" fill="#E6E1D4"' + o() + '/><rect x="110" y="66" width="20" height="20" fill="#7A7A84"' + o() + '/>' +
    '<path d="M114,66 Q120,58 126,66" fill="none"' + o(2.4) + '/><rect x="113" y="66" width="14" height="11" rx="2" fill="#F5D547"' + o(2) + '/>' +
    '<rect x="22" y="58" width="12" height="10" fill="#fff"' + o(2) + '/><rect x="46" y="58" width="12" height="10" fill="#fff"' + o(2) + '/><rect x="70" y="58" width="12" height="10" fill="#fff"' + o(2) + '/>' +
    '<path d="M20,22 L60,12 L62,24 L22,34 Z" fill="#C8323C"' + o() + '/><text x="41" y="27" font-size="9" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif" transform="rotate(-14 41 23)">FERMÉ</text>', '#DDE6F5'); };
  V.services = function () { return scene(
    '<rect x="40" y="18" width="80" height="68" fill="#fff"' + o() + '/><rect x="70" y="56" width="20" height="30" fill="#A9C4EE"' + o() + '/>' +
    '<rect x="72" y="24" width="16" height="16" fill="#C8323C"' + o(2) + '/><path d="M80,27 L80,37 M75,32 L85,32" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>' +
    '<rect x="48" y="48" width="12" height="10" fill="#E6E1D4"' + o(2) + '/><rect x="100" y="48" width="12" height="10" fill="#E6E1D4"' + o(2) + '/>' +
    '<g' + o(2) + ' fill="#F3BCD1"><circle cx="18" cy="70" r="5"/><circle cx="30" cy="72" r="5"/><circle cx="130" cy="72" r="5"/><circle cx="142" cy="70" r="5"/></g>' +
    '<path d="M13,86 L13,78 Q18,74 23,78 L23,86 M25,86 L25,80 Q30,76 35,80 L35,86 M125,86 L125,80 Q130,76 135,80 L135,86 M137,86 L137,78 Q142,74 147,78 L147,86" fill="#F4F0E6"' + o(2) + '/>' +
    '<circle cx="138" cy="24" r="12" fill="#fff"' + o() + '/><path d="M138,16 L138,24 L144,27" fill="none"' + o(2.4) + '/>', '#E4F4E8'); };
  V.ecologie = function () { return scene(
    '<circle cx="46" cy="38" r="20" fill="#F5D547"' + o() + '/><path d="M46,8 L46,14 M18,38 L24,38 M26,18 L30,22 M66,18 L62,22 M74,38 L68,38" fill="none"' + o(2.4) + '/>' +
    '<path d="M38,36 q3,-3 6,0 M48,36 q3,-3 6,0" fill="none"' + o(2.2) + '/><path d="M38,48 Q46,42 54,48" fill="none"' + o(2.4) + '/><path d="M60,30 q3,6 0,8 q-3,-2 0,-8 Z" fill="#7FC8F8"' + o(1.4) + '/>' +
    '<rect x="104" y="14" width="14" height="58" rx="7" fill="#fff"' + o() + '/><circle cx="111" cy="78" r="11" fill="#C8323C"' + o() + '/><rect x="108" y="22" width="6" height="56" fill="#C8323C"/>' +
    '<path d="M122,24 L128,24 M122,36 L128,36 M122,48 L128,48" fill="none"' + o(2) + '/><text x="140" y="30" font-size="12" font-weight="900" fill="#C8323C" font-family="sans-serif" text-anchor="middle">42°</text>' +
    '<path d="M70,90 L76,72 Q72,64 66,68 M76,72 Q84,62 90,70" fill="none" stroke="#7A5A2B" stroke-width="2.6" stroke-linecap="round"/><path d="M60,92 L96,92" fill="none"' + o(2.4) + '/>', '#FDE2C8'); };
  V.securite = function () { return scene(
    '<path d="M50,58 L110,58 L104,40 Q80,30 56,40 Z" fill="#26305A"' + o() + '/><rect x="46" y="58" width="68" height="10" rx="3" fill="#1B1F3B"' + o() + '/>' +
    '<path d="M74,44 L80,38 L86,44 L80,52 Z" fill="#F5D547"' + o(1.8) + '/>' +
    '<rect x="70" y="14" width="20" height="14" rx="5" fill="#4A7FD0"' + o() + '/><rect x="66" y="26" width="28" height="6" fill="#7A7A84"' + o(2) + '/>' +
    '<path d="M60,12 L50,6 M100,12 L110,6 M58,22 L44,22 M102,22 L116,22" fill="none" stroke="#4A7FD0" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M18,80 L142,80" fill="none" stroke="' + INK + '" stroke-width="2" stroke-dasharray="8 6"/>', '#DDE6F5'); };
  V.immigration = function () { return scene(
    '<rect x="20" y="40" width="10" height="46" fill="#9BA6CC"' + o() + '/><path d="M30,46 L136,46 L136,56 L30,56 Z" fill="#fff"' + o() + '/>' +
    '<path d="M44,46 L54,56 M64,46 L74,56 M84,46 L94,56 M104,46 L114,56 M124,46 L134,56" fill="none" stroke="#C8323C" stroke-width="6"/>' +
    '<path d="M30,46 L136,46 L136,56 L30,56 Z" fill="none"' + o() + '/>' +
    '<rect x="44" y="14" width="56" height="18" fill="#26305A"' + o() + '/><text x="72" y="27" font-size="10" font-weight="900" fill="#fff" font-family="sans-serif" text-anchor="middle">FRONTIÈRE</text>' +
    '<rect x="102" y="66" width="30" height="20" rx="3" fill="#C8562B"' + o() + '/><path d="M112,66 L112,60 L122,60 L122,66" fill="none"' + o(2.2) + '/><path d="M102,74 L132,74" fill="none"' + o(1.6) + '/>', '#EFE9F6'); };
  V.scandale = function () { return scene(
    '<path d="M22,28 L104,28 L104,82 L22,82 Z" fill="#D9A86A"' + o() + '/><path d="M22,28 L63,58 L104,28" fill="none"' + o() + '/>' +
    '<rect x="34" y="62" width="58" height="13" fill="none" stroke="#C8323C" stroke-width="2.6" transform="rotate(-8 63 68)"/>' +
    '<text x="63" y="72" font-size="8.5" font-weight="900" fill="#C8323C" font-family="sans-serif" text-anchor="middle" transform="rotate(-8 63 68)">CONFIDENTIEL</text>' +
    '<circle cx="118" cy="44" r="18" fill="#DDF1FA" fill-opacity=".7"' + o(3.4) + '/><path d="M131,57 L148,76" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M110,36 Q114,32 118,34" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M12,16 L20,22 M150,14 L142,20 M10,90 L18,86" fill="none"' + o(2.2) + '/>', '#FBE7B0'); };
  V.debat = function () { return scene(
    '<path d="M10,8 L40,40 M150,8 L120,40" fill="none" stroke="#F5D547" stroke-width="10" opacity=".35"/>' +
    '<path d="M24,90 L30,56 L58,56 L64,90 Z" fill="#C8323C"' + o() + '/><path d="M96,90 L102,56 L130,56 L136,90 Z" fill="#4A7FD0"' + o() + '/>' +
    '<path d="M44,56 L48,44 M116,56 L112,44" fill="none"' + o(2.4) + '/><circle cx="49" cy="42" r="3.4" fill="' + INK + '"/><circle cx="111" cy="42" r="3.4" fill="' + INK + '"/>' +
    '<path d="M64,26 Q80,14 96,26 Q96,38 80,38 L72,44 L74,37 Q64,35 64,26 Z" fill="#fff"' + o(2.4) + '/><text x="80" y="31" font-size="11" font-weight="900" text-anchor="middle" fill="' + INK + '" font-family="sans-serif">!?</text>' +
    '<rect x="66" y="74" width="28" height="16" rx="3" fill="#1B1F3B"' + o(2) + '/><text x="80" y="85" font-size="7" font-weight="900" text-anchor="middle" fill="#F5D547" font-family="sans-serif">DIRECT</text>', '#E6E1D4'); };

  var ART = {
    portrait: function (pid) { return P[pid] ? P[pid]() : ''; },
    advisor: advisor,
    vignette: function (k) { return V[k] ? V[k]() : ''; },
    hasVignette: function (k) { return !!V[k]; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = ART;
  else root.PolitikArt = ART;
})(this);

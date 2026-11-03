/* Politik — le lettrage de bande dessinée, tracé à la main : chaque capitale est un petit dessin au trait
   (grille de 10 de large sur 14 de haut), posé avec un léger tremblement, comme un lettreur à la plume.
   Aucune police de caractères : tout sort en tracés SVG. */
(function (root) {
  var G = {
    A: [10, 'M0.6,14 Q3,6 5,0.4 Q7.4,7 9.6,13.8 M2.3,9.2 Q5,8.7 8,9'],
    B: [9, 'M1,0.6 L1.2,13.8 M1,0.8 Q8.4,0 8,3.6 Q7.8,6.6 1.2,6.6 Q9,6.4 8.8,10.2 Q8.4,14 1.2,13.8'],
    C: [9.4, 'M8.8,2.6 Q7.2,0.2 5,0.4 Q0.8,0.8 0.8,7 Q0.8,13.6 5,13.8 Q7.4,13.8 8.9,11.4'],
    D: [9.6, 'M1,0.5 L1.2,13.8 M1,0.7 Q9,0 9,7 Q9,13.8 1.2,13.8'],
    E: [8.2, 'M7.8,0.7 L1,0.6 L1.2,13.7 L7.9,13.5 M1.1,6.9 L6.6,6.7'],
    F: [8, 'M7.8,0.7 L1,0.6 L1.2,14 M1.1,6.9 L6.4,6.7'],
    G: [9.8, 'M8.8,2.8 Q7.4,0.3 5,0.4 Q0.8,0.8 0.8,7 Q0.8,13.7 5,13.8 Q8.8,13.8 9,8 L5.6,8'],
    H: [9.8, 'M1,0.5 L1.2,14 M8.8,0.4 L8.8,14 M1.1,7 L8.8,6.8'],
    I: [3, 'M1.5,0.5 L1.5,14'],
    J: [7, 'M6,0.5 L6,10 Q6,13.8 3.2,13.8 Q1,13.8 0.6,11.4'],
    K: [9.2, 'M1,0.5 L1.2,14 M8.2,0.6 L1.2,7.6 L8.8,14'],
    L: [7.6, 'M1,0.5 L1.2,13.7 L7.4,13.5'],
    M: [12, 'M1,14 L1.4,0.6 L6,9.4 L10.6,0.6 L11,14'],
    N: [10, 'M1,14 L1.2,0.6 L8.8,13.8 L9,0.5'],
    O: [10.4, 'M5.2,0.4 Q0.7,0.6 0.7,7 Q0.7,13.8 5.2,13.8 Q9.7,13.8 9.7,7 Q9.7,0.6 5.2,0.4'],
    P: [8.6, 'M1.1,14 L1,0.6 Q8.4,0 8.2,4 Q8,7.8 1.1,7.6'],
    Q: [10.4, 'M5.2,0.4 Q0.7,0.6 0.7,7 Q0.7,13.8 5.2,13.8 Q9.7,13.8 9.7,7 Q9.7,0.6 5.2,0.4 M6,10.4 L9.6,14.4'],
    R: [9, 'M1.1,14 L1,0.6 Q8.4,0 8.2,4 Q8,7.6 1.1,7.4 L8.6,14'],
    S: [8.6, 'M7.8,2.4 Q6.6,0.3 4.4,0.4 Q1,0.6 1,3.6 Q1,6 4.4,7 Q8,8 8,10.6 Q7.8,13.8 4.2,13.8 Q1.6,13.8 0.6,11.4'],
    T: [8.8, 'M0.4,0.8 L8.4,0.6 M4.4,0.7 L4.5,14'],
    U: [9.8, 'M1,0.5 L1,9 Q1,13.8 4.9,13.8 Q8.8,13.8 8.8,9 L8.8,0.5'],
    V: [9.6, 'M0.5,0.5 Q2.8,8 4.8,14 Q7,7.4 9.1,0.5'],
    W: [13.4, 'M0.5,0.5 L3.4,14 L6.7,3.4 L10,14 L12.9,0.5'],
    X: [9.2, 'M0.8,0.5 L8.4,14 M8.4,0.5 L0.8,14'],
    Y: [9, 'M0.5,0.5 L4.5,7.2 L8.5,0.5 M4.5,7.2 L4.6,14'],
    Z: [8.8, 'M0.8,0.8 L8,0.6 L0.8,13.7 L8.2,13.5'],
    '0': [9.4, 'M4.7,0.4 Q0.8,0.6 0.8,7 Q0.8,13.8 4.7,13.8 Q8.6,13.8 8.6,7 Q8.6,0.6 4.7,0.4'],
    '1': [5, 'M0.8,3.4 L3.4,0.6 L3.4,14'],
    '2': [8.6, 'M0.9,3.4 Q1.4,0.4 4.4,0.4 Q7.8,0.6 7.6,3.8 Q7.2,6.8 0.8,13.6 L8,13.5'],
    '3': [8.4, 'M1,2.6 Q2.4,0.3 4.4,0.4 Q7.6,0.6 7.4,3.4 Q7.2,6.4 3.6,6.8 Q8,7 7.8,10.4 Q7.4,13.8 4,13.8 Q1.6,13.8 0.7,11.6'],
    '4': [9, 'M6.4,14 L6.4,0.6 L0.7,9.8 L8.6,9.6'],
    '5': [8.4, 'M7.4,0.7 L1.6,0.6 L1.2,6.4 Q7.6,4.8 7.8,9.6 Q7.8,13.8 4,13.8 Q1.6,13.8 0.7,11.8'],
    '6': [8.6, 'M6.8,0.6 Q1,3 0.9,9.4 Q1,13.8 4.4,13.8 Q7.8,13.8 7.8,9.8 Q7.6,6.2 4.4,6.4 Q1.8,6.4 1,9'],
    '7': [8, 'M0.7,0.8 L7.6,0.6 L2.8,14 M2.4,7.4 L6.4,7.2'],
    '8': [8.6, 'M4.3,0.4 Q1.2,0.5 1.2,3.5 Q1.2,6.4 4.3,6.9 Q7.8,7.6 7.8,10.4 Q7.6,13.8 4.3,13.8 Q0.9,13.8 0.8,10.4 Q0.9,7.6 4.3,6.9 Q7.4,6.4 7.4,3.5 Q7.4,0.5 4.3,0.4'],
    '9': [8.6, 'M7.6,5 Q6.8,7.8 4.2,7.8 Q1,7.8 1,4.2 Q1,0.4 4.4,0.4 Q7.8,0.5 7.7,5 Q7.6,11 2,13.8'],
    '.': [3, 'M1.5,13.3 L1.6,13.7'],
    ',': [3, 'M1.8,13 Q1.8,14.6 0.8,15.8'],
    ';': [3, 'M1.6,5.4 L1.6,5.8 M1.8,13 Q1.8,14.6 0.8,15.8'],
    ':': [3, 'M1.5,5.2 L1.6,5.6 M1.5,12.8 L1.6,13.2'],
    '!': [3.2, 'M1.6,0.5 L1.6,9.4 M1.6,13.2 L1.7,13.6'],
    '?': [8, 'M0.9,3.2 Q1.4,0.4 4,0.4 Q7.2,0.5 7.1,3.4 Q7,5.8 4,7.2 L4,9.6 M4,13.2 L4.1,13.6'],
    "'": [2.6, 'M1.5,0.4 Q1.6,2.4 0.9,4'],
    '-': [6, 'M0.8,7.4 L5.2,7.2'],
    '/': [7, 'M6,0.4 L1,14.2'],
    '€': [9.2, 'M8.6,2.2 Q7.2,0.3 5.2,0.4 Q2,0.6 2,7 Q2,13.7 5.2,13.8 Q7.4,13.8 8.7,11.8 M0.4,5.6 L6.6,5.6 M0.4,8.4 L6,8.4'],
    '%': [10, 'M8.6,0.6 L1.4,14 M3,0.8 Q1,0.8 1,3 Q1,5 3,5 Q4.8,5 4.8,3 Q4.8,0.8 3,0.8 M7.2,9 Q5.4,9 5.4,11.2 Q5.4,13.4 7.2,13.4 Q9,13.4 9,11.2 Q9,9 7.2,9'],
    '«': [7, 'M3.6,4 L0.8,7.4 L3.6,10.8 M6.8,4 L4,7.4 L6.8,10.8'],
    '»': [7, 'M0.6,4 L3.4,7.4 L0.6,10.8 M3.8,4 L6.6,7.4 L3.8,10.8'],
    '…': [8, 'M1.3,13.4 L1.4,13.7 M4,13.4 L4.1,13.7 M6.7,13.4 L6.8,13.7']
  };
  G['’'] = G["'"];
  /* les accents : la lettre, plus un petit trait au-dessus (les capitales restent à leur hauteur) */
  var ACC = { aigu: 'M3.4,-1.2 L6.4,-3.6', grave: 'M3.6,-3.6 L6.4,-1.2', circ: 'M2.4,-1.2 L4.9,-3.6 L7.4,-1.2', trema: 'M3,-2.2 L3.1,-2 M6.8,-2.2 L6.9,-2', ced: 'M4.8,14 Q6.8,14.4 6.4,16 Q5.6,17.2 3.8,16.6' };
  var ACCENTS = { 'É': ['E', 'aigu'], 'È': ['E', 'grave'], 'Ê': ['E', 'circ'], 'Ë': ['E', 'trema'], 'À': ['A', 'grave'], 'Â': ['A', 'circ'], 'Î': ['I', 'circ'], 'Ï': ['I', 'trema'], 'Ô': ['O', 'circ'], 'Û': ['U', 'circ'], 'Ù': ['U', 'grave'], 'Ç': ['C', 'ced'] };

  function alea(n) { var x = Math.sin(n * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); }
  var SP = 1.5, ESPACE = 5.6;

  function largeur(s, taille) {
    var k = taille / 14, l = 0;
    String(s).toUpperCase().split('').forEach(function (c) {
      if (c === ' ') { l += ESPACE; return; }
      var a = ACCENTS[c], g = G[a ? a[0] : c];
      l += (g ? g[0] : 6) + SP;
    });
    return l * k;
  }

  /* une ligne de lettrage, écrite à partir de (x, y = haut des capitales). opt : encre, gras, ancre ('m' centre, 'd' droite) */
  function ligne(s, x, y, taille, opt) {
    opt = opt || {};
    var t = String(s).toUpperCase(), k = taille / 14, l = largeur(t, taille), n = opt.graine || 1;
    var cx = opt.ancre === 'm' ? x - l / 2 : opt.ancre === 'd' ? x - l : x;
    var w = (opt.gras ? 2.5 : 1.75);
    var d = '';
    t.split('').forEach(function (c, i) {
      if (c === ' ') { cx += ESPACE * k; return; }
      var a = ACCENTS[c], g = G[a ? a[0] : c] || G['-'];
      var dy = (alea(n + i * 3) - 0.5) * 0.7, ro = (alea(n + i * 7) - 0.5) * 3.4, se = 0.97 + alea(n + i * 11) * 0.06;
      var acc = a ? ACC[a[1]] : '';
      var dx = a && a[0] === 'I' ? -3.4 : 0;
      d += '<g transform="translate(' + cx.toFixed(2) + ',' + (y + dy * k).toFixed(2) + ') scale(' + (k * se).toFixed(3) + ') rotate(' + ro.toFixed(2) + ' 5 7)"><path d="' + g[1] + '"/>' +
        (acc ? '<path transform="translate(' + dx + ',0)" d="' + acc + '"/>' : '') + '</g>';
      cx += (g[0] + SP) * k;
    });
    return '<g fill="none" stroke="' + (opt.encre || '#1d1713') + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round">' + d + '</g>';
  }

  /* plusieurs lignes centrées : renvoie le tracé, la largeur et la hauteur */
  function bloc(lignes, x, y, taille, opt) {
    opt = opt || {};
    var inter = opt.inter || 1.34, s = '', lmax = 0;
    lignes.forEach(function (li, i) {
      var gras = opt.gras, txt = li;
      if (txt.charAt(0) === '*') { gras = true; txt = txt.slice(1); }
      s += ligne(txt, x, y + i * taille * inter, taille, { ancre: opt.ancre || 'm', encre: opt.encre, gras: gras, graine: (opt.graine || 3) + i * 13 });
      lmax = Math.max(lmax, largeur(txt, taille));
    });
    return { s: s, l: lmax, h: lignes.length * taille * inter - taille * (inter - 1) };
  }

  root.Lettrage = { ligne: ligne, bloc: bloc, largeur: largeur };
})(this);

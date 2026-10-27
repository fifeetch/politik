/* Politik — le journal du matin (v2.2).
   La une : une scène dessinée plein écran et un mot géant, choisis selon l'événement du jour.
   Les pages : de vrais articles écrits à partir de ce qui s'est passé au tour précédent
   (meetings dans les villes, passages télé, porte-à-porte, affaires, régions qui basculent, sondage). */
(function () {
  var D = window.PolitikData;

  /* ---------- Les villes de chaque région (pour situer les meetings) ---------- */
  var CITIES = {
    idf: ['Paris', 'Saint-Denis', 'Créteil', 'Versailles', 'Argenteuil'],
    hdf: ['Lille', 'Amiens', 'Roubaix', 'Dunkerque', 'Calais'],
    ges: ['Strasbourg', 'Metz', 'Reims', 'Mulhouse', 'Nancy'],
    ara: ['Lyon', 'Grenoble', 'Saint-Étienne', 'Clermont-Ferrand', 'Annecy'],
    pac: ['Marseille', 'Nice', 'Toulon', 'Avignon', 'Gap'],
    occ: ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Albi'],
    naq: ['Bordeaux', 'Limoges', 'Poitiers', 'Pau', 'La Rochelle'],
    pdl: ['Nantes', 'Angers', 'Le Mans', 'Saint-Nazaire', 'Laval'],
    bre: ['Rennes', 'Brest', 'Quimper', 'Lorient', 'Saint-Brieuc'],
    nor: ['Rouen', 'Caen', 'Le Havre', 'Cherbourg', 'Évreux'],
    bfc: ['Dijon', 'Besançon', 'Belfort', 'Auxerre', 'Chalon-sur-Saône'],
    cvl: ['Orléans', 'Tours', 'Bourges', 'Chartres', 'Blois'],
    cor: ['Ajaccio', 'Bastia', 'Pointe-à-Pitre', 'Fort-de-France', 'Saint-Denis de La Réunion']
  };
  /* Les sujets abordés, par thème */
  var TOPICS = {
    pouvoir: ['des fins de mois difficiles', 'du prix de l\'essence', 'des loyers trop chers', 'du caddie qui coûte toujours plus cher'],
    emploi: ['des usines qui ferment', 'de l\'emploi des jeunes', 'de l\'apprentissage', 'des petites entreprises de la région'],
    services: ['des urgences débordées', 'des classes qui ferment', 'des déserts médicaux', 'des petites lignes de train supprimées'],
    ecologie: ['de la canicule de l\'été dernier', 'des rivières à sec', 'des logements mal isolés', 'des transports propres'],
    securite: ['de la sécurité dans les quartiers', 'des moyens de la police', 'des incivilités du quotidien', 'd\'une justice trop lente'],
    immigration: ['de l\'immigration', 'de l\'intégration', 'du contrôle des frontières', 'de l\'accueil des réfugiés']
  };
  var CROWDS = ['devant une salle comble', 'devant quelques centaines de sympathisants', 'face à des habitants venus nombreux', 'devant un public conquis d\'avance', 'au milieu de militants survoltés', 'sous un chapiteau plein à craquer'];
  var DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  /* ---------- Le mot de la une, et la scène dessinée ---------- */
  var UNE_EVENTS = {
    crise: ['Panique.', 'caddie', 'Les prix flambent, les marchés plongent : le pays a peur pour son porte-monnaie.'], greve: ['Bloqués.', 'greve', 'Plus un train ne roule : les usagers fulminent, les syndicats tiennent bon.'], scandale: ['Scandale.', 'scandale', 'Révélations en cascade : toute la classe politique retient son souffle.'], buzz: ['Viral.', 'tele', 'Une vidéo de campagne affole les compteurs : tout le pays en parle.'],
    sondage: ['Surprise !', 'tele', 'Coup de tonnerre dans les intentions de vote : les états-majors s\'agitent.'], fete: ['Bal.', 'fete', 'Défilé, bals et feux d\'artifice : les candidats serrent des mains sous les lampions.'], division: ['Déchirés.', 'meeting', 'Les chefs s\'écharpent en public : ambiance glaciale dans les partis.'], fuite: ['Fuite.', 'scandale', 'Des notes internes fuitent dans la presse : panique dans les QG de campagne.'],
    salon: ['À la ferme.', 'nature', 'Entre les vaches et les tracteurs, les candidats font le passage obligé de la campagne.'], usine: ['Rideau.', 'usine', 'Une usine de 800 salariés baisse le rideau : la colère gronde devant les grilles.'], patrimoine: ['Patrimoine.', 'ville', 'Châteaux et ministères ouvrent leurs portes : les candidats soignent leur image.'], mecene: ['Le chèque.', 'scandale', 'Un riche donateur sort son carnet de chèques : les trésoriers des partis jubilent.'],
    bouchons: ['Bouchons.', 'ville', 'Des kilomètres de bouchons autour de Paris : les automobilistes ne décolèrent pas.'], calme: ['Rentrée.', 'ville', 'Rentrée sans fracas : les Français reprennent le chemin du travail.'], division2: ['Pugilat.', 'meeting', 'Congrès sous tension : chaises qui volent et motions de défiance.']
  };
  var UNE_CRISIS = {
    'Rumeurs de krach': ['Rumeurs.', 'caddie', 'Les places boursières tremblent, les épargnants s\'inquiètent.'], 'Krach boursier !': ['Krach.', 'caddie', 'Les marchés s\'effondrent : le porte-monnaie écrase tous les autres sujets.'], 'La reprise': ['Reprise.', 'ville', 'Les indicateurs repartent au vert : soulagement dans les foyers.'],
    'Grève dans les transports': ['Grève.', 'greve', 'Plus un train en Île-de-France : les usagers sont à bout.'], 'La grève s\'étend': ['Paralysie.', 'greve', 'Le Nord, l\'Est et la Normandie rejoignent le mouvement : le pays tourne au ralenti.'], 'Fin du mouvement': ['Accord.', 'ville', 'Un accord est enfin trouvé : les trains repartent.'],
    'Canicule précoce': ['42 °C.', 'chaleur', '42 °C à Marseille : dans le Sud, l\'écologie s\'invite dans tous les débats.'], 'Incendies dans le Sud': ['Brasier.', 'feu', 'Les forêts brûlent : on reproche aux élus leur impréparation.'], 'Orages et inondations': ['Déluge.', 'pluie', 'Après le feu, l\'eau : des villages entiers sous la boue.'],
    'Une usine ferme dans le Nord': ['Rideau.', 'usine', '800 emplois supprimés : dans les Hauts-de-France, on ne parle plus que d\'emploi.'], 'Plan social dans l\'Est': ['Licenciés.', 'usine', 'Le Grand Est est touché à son tour : les salariés manifestent devant les grilles.'], 'Plan de relance': ['Relance.', 'relance', 'L\'État sort le carnet de chèques pour sauver l\'industrie.']
  };

  var THEME_UNE = { pouvoir: ['Vie chère.', 'caddie'], emploi: ['Chômage.', 'usine'], services: ['Urgences.', 'hopital'],
    ecologie: ['Climat.', 'nature'], securite: ['Insécurité.', 'police'], immigration: ['Frontières.', 'frontiere'] };

  /* Petits outils de dessin */
  function rect(x, y, w, h, f, ex) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + f + '"' + (ex || '') + '/>'; }
  function circ(x, y, r, f, ex) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"' + (ex || '') + '/>'; }
  function path(d, f, ex) { return '<path d="' + d + '" fill="' + f + '"' + (ex || '') + '/>'; }
  function txt(x, y, s, size, f, rot, ex) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="Archivo, Anybody, sans-serif" font-weight="900" font-stretch="70%" font-size="' + size + '" fill="' + f + '"' +
      (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + (ex || '') + '>' + s + '</text>';
  }
  /* une foule de têtes et d'épaules au premier plan */
  function crowd(k, y, n, seed) {
    var s = '', w = 360 / n;
    for (var i = 0; i < n; i++) {
      var x = w * i + w / 2 + ((seed * (i + 3)) % 9) - 4, r = 15 + ((seed + i * 7) % 5), top = y + ((i * 13 + seed) % 22);
      s += circ(x, top, r, k) + path('M' + (x - r * 1.9) + ' 560 Q' + (x - r * 1.9) + ' ' + (top + r * 1.6) + ' ' + x + ' ' + (top + r * 1.3) + ' Q' + (x + r * 1.9) + ' ' + (top + r * 1.6) + ' ' + (x + r * 1.9) + ' 560Z', k);
    }
    return s;
  }
  function sign(x, y, w, h, word, k, f, rot) {
    return '<g transform="rotate(' + (rot || 0) + ' ' + x + ' ' + y + ')">' + rect(x - 2, y, 4, 120, k) + rect(x - w / 2, y - h / 2, w, h, f) + txt(x, y + h * 0.18, word, h * 0.56, k) + '</g>';
  }
  function windows(x, y, cols, rows, dx, dy, w, h, f) {
    var s = ''; for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) s += rect(x + i * dx, y + j * dy, w, h, f); return s;
  }

  var PAL = {
    usine: ['#F0444C', '#5A070C', '#1A0507', '#FF7A6E'], relance: ['#4FBF7A', '#0F4A2A', '#06200F', '#B9F5C9'],
    caddie: ['#FFB23E', '#8A3B06', '#2A1203', '#FFE0A3'], hopital: ['#4CC3C0', '#0C4A52', '#04191C', '#C9F5F2'],
    nature: ['#9ED46A', '#2F6B2A', '#0E2410', '#F4F0A8'], chaleur: ['#FFB238', '#B5300E', '#2B0A04', '#FFF2A8'],
    feu: ['#FF8A2B', '#7A1405', '#1E0502', '#FFE36E'], pluie: ['#6FA4D9', '#163B66', '#07142A', '#D3E8FF'],
    police: ['#4A6BE0', '#0E1A4A', '#050A1F', '#FF4E4E'], frontiere: ['#9AB0C4', '#2D4559', '#0D1A26', '#F2F5F8'],
    scandale: ['#B04BE0', '#2A0B45', '#0D0418', '#FFFFFF'], tele: ['#7B6CF6', '#1E1660', '#0A0726', '#FFD84D'],
    fete: ['#2E4FB8', '#0B1640', '#050A1F', '#FFD84D'], meeting: ['#E04B6E', '#3E0B2E', '#14030E', '#FFD84D'],
    greve: ['#F2563A', '#6B1408', '#200502', '#FFE36E'], ville: ['#8FB3D9', '#2B4466', '#0D1726', '#FFE7B0']
  };
  var SCENES = {
    usine: function (p) {
      var k = p[2];
      return '<g fill="url(#' + p.smk + ')">' + '<ellipse cx="96" cy="90" rx="70" ry="40"/><ellipse cx="140" cy="60" rx="80" ry="38"/><ellipse cx="60" cy="40" rx="60" ry="30"/></g>' +
        circ(250, 150, 58, p[3], ' opacity=".5"') + rect(80, 110, 26, 170, k) + rect(124, 140, 20, 140, k) +
        path('M0 330 L0 250 L60 220 L60 250 L120 220 L120 250 L180 220 L180 250 L240 220 L240 250 L300 220 L300 250 L360 220 L360 330 Z', k) +
        windows(30, 262, 5, 1, 60, 0, 22, 18, p[1]) +
        '<g stroke="' + k + '" stroke-width="5">' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<line x1="' + (20 + i * 50) + '" y1="300" x2="' + (20 + i * 50) + '" y2="560"/>'; }).join('') + '<line x1="0" y1="300" x2="360" y2="300"/></g>' +
        '<g transform="rotate(-6 206 323)">' + rect(150, 306, 112, 34, '#F4E9DA') + txt(206, 331, 'FERMÉ', 22, p[1]) + '</g>' +
        crowd(k, 470, 5, 3) + sign(122, 386, 74, 36, 'NON !', k, p[0], -4);
    },
    relance: function (p) {
      var k = p[2];
      return circ(270, 140, 70, p[3], ' opacity=".55"') +
        '<g stroke="' + k + '" stroke-width="6" fill="none"><path d="M40 300 L40 120 L150 120"/><path d="M150 120 L150 80"/><path d="M40 160 L150 160"/></g>' +
        path('M0 330 L0 250 L60 220 L60 250 L120 220 L120 250 L180 220 L180 250 L240 220 L240 250 L300 220 L300 250 L360 220 L360 330 Z', k) +
        windows(30, 262, 5, 1, 60, 0, 22, 18, p[3]) + rect(0, 300, 360, 260, k, ' opacity=".9"') +
        path('M30 520 L120 440 L180 480 L300 360', 'none', ' stroke="' + p[3] + '" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"') +
        path('M280 350 L320 345 L312 386 Z', p[3]) + crowd(k, 480, 4, 5);
    },
    caddie: function (p) {
      var k = p[2], s = circ(270, 120, 60, p[3], ' opacity=".45"');
      [['+12 %', 70, 150, -12], ['+8 %', 280, 230, 10], ['+15 %', 170, 120, 4], ['+6 %', 300, 140, -8]].forEach(function (t) {
        s += '<g transform="rotate(' + t[3] + ' ' + t[1] + ' ' + t[2] + ')">' + path('M' + (t[1] - 38) + ' ' + (t[2] - 18) + ' h64 l14 18 l-14 18 h-64 z', '#FFF6E0') + circ(t[1] + 18, t[2], 4, k) + txt(t[1] - 6, t[2] + 8, t[0], 22, p[1]) + '</g>';
      });
      s += '<g fill="none" stroke="' + k + '" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"><path d="M30 250 L70 250 L110 420 L300 420"/><path d="M80 290 L330 290 L300 400 L105 400"/>' +
        '<path d="M140 290 L150 400 M200 290 L200 400 M260 290 L250 400 M92 345 L318 345"/></g>' + circ(130, 465, 22, k) + circ(280, 465, 22, k) + rect(0, 500, 360, 60, k);
      return s;
    },
    hopital: function (p) {
      var k = p[2];
      return circ(80, 90, 40, p[3], ' opacity=".5"') + rect(70, 150, 220, 250, k) + windows(88, 220, 6, 5, 32, 34, 18, 20, p[1]) +
        rect(152, 165, 56, 18, p[3]) + rect(171, 146, 18, 56, p[3]) + txt(180, 140, 'URGENCES', 20, p[3], 0, ' opacity=".9"') +
        rect(0, 400, 360, 160, k) + path('M190 470 h110 l20 -30 h-40 l-12 -22 h-78z', p[1]) + circ(215, 478, 13, k) + circ(295, 478, 13, k) +
        rect(246, 404, 22, 10, p[3]) + crowd(k, 480, 3, 2);
    },
    nature: function (p) {
      var k = p[2], s = circ(260, 120, 70, p[3], ' opacity=".7"');
      s += path('M0 330 Q90 250 180 300 T360 280 L360 560 L0 560Z', p[1]) + path('M0 400 Q120 330 240 380 T360 360 L360 560 L0 560Z', k);
      [[60, 300], [110, 280], [300, 270], [250, 290]].forEach(function (t) { s += rect(t[0] - 4, t[1], 8, 50, k) + circ(t[0], t[1] - 6, 26, k); });
      s += path('M120 470 h70 l10 -40 h40 l20 40 h10 v30 h-150z', p[0]) + circ(150, 505, 18, p[0]) + circ(250, 505, 12, p[0]);
      return s;
    },
    chaleur: function (p) {
      var k = p[2], s = circ(180, 170, 110, p[3], ' opacity=".85"') + circ(180, 170, 150, p[3], ' opacity=".25"');
      s += path('M0 360 L360 360 L360 560 L0 560Z', k);
      for (var i = 0; i < 6; i++) s += path('M' + (20 + i * 60) + ' 380 l18 40 l-14 30 l20 50', 'none', ' stroke="' + p[1] + '" stroke-width="4"');
      s += '<g fill="none" stroke="' + p[3] + '" stroke-width="5" stroke-linecap="round" opacity=".8">' + [0, 1, 2].map(function (i) { return '<path d="M' + (90 + i * 90) + ' 340 q12 -16 0 -32 t0 -32"/>'; }).join('') + '</g>' +
        rect(250, 280, 70, 100, '#FFF6E0', ' rx="35"') + rect(277, 210, 16, 120, '#FFF6E0') + circ(285, 385, 30, p[1]) + rect(281, 250, 8, 120, p[1]) + txt(160, 470, '42 °C', 70, p[3]);
      return s;
    },
    feu: function (p) {
      var k = p[2], s = '';
      for (var i = 0; i < 7; i++) {
        var x = i * 58, h = 160 + (i * 37) % 90;
        s += path('M' + (x - 30) + ' 420 Q' + (x - 10) + ' ' + (420 - h * 0.6) + ' ' + (x + 6) + ' ' + (420 - h) + ' Q' + (x + 20) + ' ' + (420 - h * 0.5) + ' ' + (x + 40) + ' 420Z', i % 2 ? p[3] : p[0], ' opacity=".9"');
      }
      [[40, 330], [120, 300], [210, 320], [300, 300]].forEach(function (t) { s += path('M' + t[0] + ' ' + (t[1] - 70) + ' L' + (t[0] - 30) + ' ' + (t[1] + 30) + ' L' + (t[0] + 30) + ' ' + (t[1] + 30) + 'Z', k) + rect(t[0] - 4, t[1] + 30, 8, 40, k); });
      s += rect(0, 400, 360, 160, k) + path('M150 470 h90 l20 -30 h-40 l-10 -20 h-60z', p[1]) + circ(175, 478, 12, k) + circ(240, 478, 12, k);
      return s;
    },
    pluie: function (p) {
      var k = p[2], s = '<g fill="' + p[1] + '" opacity=".9"><ellipse cx="90" cy="80" rx="110" ry="50"/><ellipse cx="260" cy="70" rx="120" ry="55"/></g>';
      s += '<g stroke="' + p[3] + '" stroke-width="3" opacity=".7">';
      for (var i = 0; i < 26; i++) s += '<line x1="' + ((i * 41) % 360) + '" y1="' + (120 + (i * 29) % 160) + '" x2="' + ((i * 41) % 360 - 14) + '" y2="' + (150 + (i * 29) % 160) + '"/>';
      s += '</g>' + rect(40, 250, 90, 120, k) + path('M30 255 L85 210 L140 255Z', k) + rect(220, 270, 110, 100, k) + path('M210 275 L275 225 L340 275Z', k) +
        path('M0 350 Q60 335 120 350 T240 350 T360 350 L360 560 L0 560Z', p[0], ' opacity=".9"') + path('M0 380 Q60 365 120 380 T240 380 T360 380 L360 560 L0 560Z', p[1]) +
        rect(160, 360, 34, 20, k) + rect(150, 356, 54, 6, k);
      return s;
    },
    police: function (p) {
      var k = p[2], s = circ(70, 70, 26, p[3], ' opacity=".15"');
      s += rect(0, 160, 90, 260, k) + rect(100, 120, 80, 300, k) + rect(190, 190, 70, 230, k) + rect(270, 140, 90, 280, k) +
        windows(10, 180, 3, 6, 26, 36, 14, 18, p[1]) + windows(280, 160, 3, 7, 28, 36, 14, 18, p[1]) + rect(0, 420, 360, 140, k);
      s += circ(150, 370, 70, p[3], ' opacity=".35"') + circ(230, 370, 70, '#5B8CFF', ' opacity=".35"') +
        path('M70 470 h220 l-20 -45 h-60 l-20 -25 h-60 l-20 25 h-30z', p[1]) + rect(160, 393, 18, 9, p[3]) + rect(182, 393, 18, 9, '#5B8CFF') +
        circ(115, 478, 16, k) + circ(250, 478, 16, k) + rect(320, 260, 6, 160, k) + path('M300 262 h36 l-6 10 h-24z', p[3], ' opacity=".9"');
      return s;
    },
    frontiere: function (p) {
      var k = p[2], s = path('M0 280 L80 190 L140 240 L220 150 L300 230 L360 190 L360 330 L0 330Z', p[1]);
      s += path('M140 560 L175 330 L185 330 L220 560Z', p[3], ' opacity=".35"') + rect(0, 330, 360, 230, k) +
        rect(40, 300, 60, 110, p[1]) + rect(48, 316, 44, 30, p[3], ' opacity=".7"') + rect(36, 292, 68, 10, k);
      for (var i = 0; i < 9; i++) s += rect(110 + i * 24, 360, 24, 14, i % 2 ? p[3] : '#E0342C', ' transform="rotate(-4 220 367)"');
      s += rect(104, 360, 10, 70, p[3]) + '<g transform="rotate(4 280 300)">' + rect(230, 280, 100, 40, p[3]) + txt(280, 308, 'FRONTIÈRE', 19, k) + '</g>' + rect(278, 320, 6, 60, p[3]);
      return s;
    },
    scandale: function (p) {
      var k = p[2], s = '';
      [[70, 140, 40], [260, 110, 55], [180, 210, 34], [320, 230, 30], [40, 260, 28]].forEach(function (t) {
        s += path('M' + t[0] + ' ' + (t[1] - t[2]) + ' L' + (t[0] + t[2] * 0.22) + ' ' + (t[1] - t[2] * 0.22) + ' L' + (t[0] + t[2]) + ' ' + t[1] + ' L' + (t[0] + t[2] * 0.22) + ' ' + (t[1] + t[2] * 0.22) + ' L' + t[0] + ' ' + (t[1] + t[2]) + ' L' + (t[0] - t[2] * 0.22) + ' ' + (t[1] + t[2] * 0.22) + ' L' + (t[0] - t[2]) + ' ' + t[1] + ' L' + (t[0] - t[2] * 0.22) + ' ' + (t[1] - t[2] * 0.22) + 'Z', p[3], ' opacity=".9"') + circ(t[0], t[1], t[2] * 0.9, p[3], ' opacity=".2"');
      });
      [[60, 400], [150, 380], [240, 395], [320, 385]].forEach(function (t, i) {
        s += circ(t[0], t[1], 22, k) + path('M' + (t[0] - 40) + ' 560 Q' + (t[0] - 40) + ' ' + (t[1] + 30) + ' ' + t[0] + ' ' + (t[1] + 26) + ' Q' + (t[0] + 40) + ' ' + (t[1] + 30) + ' ' + (t[0] + 40) + ' 560Z', k) +
          rect(t[0] - 24, t[1] - 10, 30, 22, p[1], ' transform="rotate(' + (i % 2 ? 10 : -10) + ' ' + t[0] + ' ' + t[1] + ')"') + circ(t[0] - 6, t[1] + 1, 7, p[0]);
      });
      s += '<g stroke="' + k + '" stroke-width="5">' + '<line x1="180" y1="300" x2="150" y2="200"/><line x1="200" y1="300" x2="220" y2="190"/></g>' + circ(150, 196, 14, k) + circ(220, 186, 14, k);
      return s;
    },
    tele: function (p) {
      var k = p[2];
      return path('M60 0 L120 0 L200 560 L0 560Z', p[3], ' opacity=".12"') + path('M240 0 L300 0 L360 560 L160 560Z', p[3], ' opacity=".12"') +
        rect(50, 100, 260, 170, k, ' rx="10"') + rect(64, 114, 232, 142, p[0], ' rx="4"') + path('M162 150 L162 220 L218 185Z', p[3]) +
        rect(170, 270, 20, 40, k) + rect(120, 306, 120, 10, k) +
        path('M0 420 L360 400 L360 560 L0 560Z', k) + rect(60, 360, 240, 60, p[1], ' rx="6"') + rect(100, 336, 160, 26, p[3]) + txt(180, 356, 'EN DIRECT', 20, k) +
        circ(250, 300, 24, k) + path('M214 380 Q214 326 250 322 Q286 326 286 380Z', k);
    },
    fete: function (p) {
      var k = p[2], s = '';
      [[90, 120, p[3]], [260, 100, '#FF5A6E'], [180, 200, '#7FE0FF'], [310, 230, p[3]], [50, 250, '#FF5A6E']].forEach(function (t) {
        s += '<g stroke="' + t[2] + '" stroke-width="3" stroke-linecap="round">';
        for (var a = 0; a < 12; a++) { var an = a * Math.PI / 6; s += '<line x1="' + (t[0] + Math.cos(an) * 12) + '" y1="' + (t[1] + Math.sin(an) * 12) + '" x2="' + (t[0] + Math.cos(an) * 48) + '" y2="' + (t[1] + Math.sin(an) * 48) + '"/>'; }
        s += '</g>' + circ(t[0], t[1], 6, t[2]);
      });
      s += rect(0, 360, 360, 200, k) + rect(150, 250, 6, 130, k) + rect(156, 252, 22, 34, '#3A5BD9') + rect(178, 252, 22, 34, '#FFFFFF') + rect(200, 252, 22, 34, '#E0342C') + crowd(k, 430, 6, 4);
      return s;
    },
    meeting: function (p) {
      var k = p[2];
      return path('M90 0 L150 0 L230 420 L10 420Z', p[3], ' opacity=".14"') + path('M220 0 L280 0 L350 420 L130 420Z', p[3], ' opacity=".14"') +
        rect(60, 132, 240, 50, p[1]) + txt(180, 170, 'MEETING', 34, p[3]) +
        circ(180, 230, 26, k) + path('M136 330 Q136 262 180 258 Q224 262 224 330Z', k) + path('M130 300 h100 l-12 110 h-76z', p[1]) + rect(150, 318, 60, 12, p[3]) +
        '<g stroke="' + k + '" stroke-width="4"><line x1="168" y1="300" x2="160" y2="268"/><line x1="192" y1="300" x2="200" y2="268"/></g>' + crowd(k, 440, 6, 6);
    },
    greve: function (p) {
      var k = p[2];
      return circ(270, 110, 50, p[3], ' opacity=".4"') + path('M0 300 L40 210 L330 210 L360 240 L360 300Z', p[1]) + windows(60, 225, 7, 1, 38, 0, 26, 30, p[3]) + rect(0, 300, 360, 260, k) +
        sign(80, 360, 110, 46, 'GRÈVE', k, p[3], -6) + sign(270, 350, 100, 42, 'STOP', k, p[0], 5) + crowd(k, 450, 6, 1);
    },
    ville: function (p) {
      var k = p[2], s = circ(90, 120, 46, p[3], ' opacity=".55"');
      s += path('M0 330 L0 250 L40 250 L40 220 L70 220 L70 250 L110 250 L130 200 L150 250 L170 250 L170 210 L210 210 L210 250 L250 250 L250 230 L290 230 L290 250 L360 250 L360 330Z', p[1]) +
        path('M190 210 Q190 170 220 160 Q250 170 250 210Z', p[1]) + rect(218, 140, 4, 22, p[1]) +
        rect(0, 300, 360, 260, k) + windows(14, 320, 9, 3, 40, 34, 16, 20, p[1]) +
        path('M40 480 h70 l12 -20 h-26 l-10 -16 h-36z', p[0]) + path('M150 490 h70 l12 -20 h-26 l-10 -16 h-36z', p[3]) + path('M250 482 h70 l12 -20 h-26 l-10 -16 h-36z', p[0]) +
        rect(0, 500, 360, 60, k);
      return s;
    }
  };
  /* La scène complète : ciel en dégradé, dessin, trame de points, ombre en bas pour lire le titre */
  var sceneN = 0;
  function scene(name) {
    var p = PAL[name] || PAL.ville, draw = SCENES[name] || SCENES.ville, n = 'u' + (++sceneN);
    return '<svg viewBox="0 0 360 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' +
      '<linearGradient id="' + n + 'une-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + p[0] + '"/><stop offset=".6" stop-color="' + p[1] + '"/><stop offset="1" stop-color="' + p[2] + '"/></linearGradient>' +
      '<radialGradient id="' + n + 'smk"><stop offset="0" stop-color="' + p[2] + '" stop-opacity=".85"/><stop offset="1" stop-color="' + p[2] + '" stop-opacity="0"/></radialGradient>' +
      '<pattern id="' + n + 'une-ht" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="1.5" fill="' + p[2] + '" opacity=".55"/></pattern>' +
      '<linearGradient id="' + n + 'une-fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></linearGradient></defs>' +
      '<rect width="360" height="560" fill="url(#' + n + 'une-sky)"/>' + draw(Object.assign(p.slice(), { smk: n + 'smk' })) +
      '<rect width="360" height="560" fill="url(#' + n + 'une-ht)" opacity=".45"/><rect width="360" height="560" fill="url(#' + n + 'une-fade)"/></svg>';
  }

  /* ---------- Rédaction des articles ---------- */
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003; return h; }
  function pick(list, key) { return list[hash(key) % list.length]; }
  function lc(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  var ACTION_TYPE = {};
  Object.keys(D.ACTIONS).forEach(function (k) { ACTION_TYPE[D.ACTIONS[k].name] = k; });

  /* ctx : { g, me, E, info, aiAff, aiDil, log (actions du tour précédent), changes (régions qui ont basculé), before (sondage d'avant) } */
  function build(ctx) {
    var g = ctx.g, E = ctx.E, me = ctx.me, info = ctx.info, P = function (id) { return E.PARTY[id]; };
    var day = DAYS[(g.turn - 1) % 7], arts = [];
    function who(pid) { return P(pid).candidate + ' (' + P(pid).short + ')'; }
    function measureOn(pid, theme) {
      var pl = E.player(g, pid); if (!pl) return null;
      var ids = (pl.programme || []).filter(function (id) { return E.measure(id).theme === theme; });
      return ids.length ? E.measure(ids[0]).name : null;
    }
    // 1. L'article principal : l'événement ou la crise du jour
    var crisis = info.crisis, ev = crisis ? null : D.EVENTS.filter(function (e) { return e.id === info.event.id; })[0];
    var hotTheme = g.news.theme;
    var u = crisis ? (UNE_CRISIS[crisis.title] || ['Crise.', 'ville']) : (UNE_EVENTS[ev.id] || ['À la une.', 'ville']);
    // jour calme : la une parle du sujet qui fait l'actu
    if (!crisis && (ev.id === 'calme') && THEME_UNE[hotTheme]) u = THEME_UNE[hotTheme];
    var quiet = !crisis && ev.id === 'calme';
    var mainTitle = crisis ? crisis.title : (ev.theme || quiet ? g.news.headline : ev.title);
    var lead = (crisis ? (UNE_CRISIS[crisis.title] || [])[2] : (UNE_EVENTS[ev.id] || [])[2]) || '';
    var mainText = (quiet ? '' : lead + ' ') + (ev && !ev.theme && !quiet && g.news.headline ? 'Autre sujet qui agite le pays : ' + lc(g.news.headline) + '. ' : '') +
      'Ce matin, tout le monde parle ' + (TOPICS[hotTheme] ? TOPICS[hotTheme][0] : 'de la campagne') + ' : les candidats qui en parleront marqueront des points.';
    arts.push({ id: 'main', rub: crisis ? 'Crise · ' + crisis.name : 'L\'événement', title: mainTitle, text: mainText, scene: u[1], lead: quiet ? '' : lead,
      rule: quiet ? '' : (crisis ? crisis.text : ev.text) });

    // 2. Les régions qui ont basculé hier soir
    (ctx.changes || []).slice(0, 2).forEach(function (c) {
      var r = E.REG[c.rid], city = pick(CITIES[c.rid], g.turn + c.rid);
      if (c.to) arts.push({ id: 'bascule-' + c.rid, rub: 'Régions', pid: c.to, mine: c.to === me || c.from === me,
        title: P(c.to).short + ' s\'empare ' + (c.rid === 'cor' ? 'de l\'outre-mer' : 'de la région ' + r.name),
        text: 'Hier soir, à ' + city + ', les militants de ' + P(c.to).short + ' ont sablé le champagne : la région ' + (c.from ? 'échappe à ' + P(c.from).short + ' et ' : '') + 'passe sous leur contrôle. ' +
          'Avec ' + r.ins.toFixed(1).replace('.', ',') + ' millions d\'inscrits, c\'est une prise qui compte pour la présidentielle.' });
    });

    // 3. La campagne sur le terrain : un article par action marquante de la veille
    var seen = {}, field = [];
    (ctx.log || []).forEach(function (l) {
      var type = ACTION_TYPE[l.action];
      if (!l.ok || !type || seen[l.pid + type]) return;
      if (['terrain', 'medias', 'mobiliser', 'reseaux', 'contre', 'militants'].indexOf(type) < 0) return;
      seen[l.pid + type] = true;
      var p = P(l.pid), key = g.turn + l.pid + type + (l.region || ''), city = l.region ? pick(CITIES[l.region], key) : null;
      var topic = l.theme && TOPICS[l.theme] ? pick(TOPICS[l.theme], key + 't') : 'de ses propositions', m = l.theme ? measureOn(l.pid, l.theme) : null;
      var quote = m ? ' « ' + m + ', ce sera pour tout de suite ! », a promis ' + p.candidate + '.' : ' Pas de grande promesse ce jour-là : ' + p.candidate + ' est surtout venu écouter.';
      var a = { pid: l.pid, mine: l.pid === me, rub: 'Campagne' };
      if (type === 'terrain') {
        a.title = pick([p.short + ' à la rencontre des habitants de ' + city, p.candidate + ' fait salle comble à ' + city, 'À ' + city + ', ' + p.candidate + ' parle ' + topic], key);
        a.text = p.candidate + ' était à ' + city + ' (' + E.REG[l.region].name + ') ' + pick(CROWDS, key + 'c') + '. Il a surtout été question ' + topic + '.' + quote;
      } else if (type === 'medias') {
        a.title = p.candidate + ' invité du journal de 13 h';
        if (l.media) {
          var segN = { pop: 'les ouvriers et les employés', sae: 'les étudiants et les chômeurs', ret: 'les retraités', cad: 'les cadres', pi: 'les professions intermédiaires', ind: 'les artisans et les commerçants' };
          var topS = Object.keys(l.media.gains).sort(function (x, y) { return l.media.gains[y] - l.media.gains[x]; })[0];
          var tone = { emotion: 'La voix tremble un peu, le plateau se tait.', mesure: 'Fiche à la main, chiffres à l\'appui.', promesse: 'La promesse tombe, un peu sortie du chapeau.', attaque: 'Le ton monte d\'un cran contre le gouvernement.', bilan: 'Le candidat défend pied à pied le bilan du gouvernement.', recentrer: 'La question est esquivée avec un certain talent.' }[l.media.key] || '';
          a.text = '« ' + l.media.quote + ' » ' + tone + ' Interrogé sur ' + topic + ', ' + p.candidate + ' a choisi la carte « ' + l.media.name.toLowerCase() + ' ». Selon les sondeurs, le message a surtout porté chez ' + segN[topS] + '.' + (l.media.cas ? ' Dès le lendemain, la promesse est épinglée par les fact-checkeurs : une casserole de plus.' : '');
        } else a.text = 'Costume impeccable, phrases calibrées : ' + p.candidate + ' a profité du journal télévisé pour parler ' + topic + '.' + quote;
        a.rub = 'Médias';
      } else if (type === 'mobiliser') {
        a.title = 'Porte-à-porte à ' + city + ' : ' + p.short + ' réveille les abstentionnistes';
        a.text = 'Dans les cités et les bourgs autour de ' + city + ', les militants de ' + p.short + ' ont frappé aux portes de ceux qui ne votent plus. « On vient vous chercher », répètent-ils. Plusieurs habitants ont promis de s\'inscrire sur les listes.';
      } else if (type === 'reseaux') {
        a.title = 'La vidéo de ' + p.candidate + ' fait le tour des réseaux';
        a.text = 'Une courte vidéo de ' + p.candidate + ' sur ' + (l.theme ? E.THEME[l.theme].name.toLowerCase() : 'la campagne') + ' a été partagée des milliers de fois. Les jeunes électeurs, souvent absents des urnes, semblent y avoir été sensibles.';
        a.rub = 'Médias';
      } else if (type === 'contre') {
        var t = l.target ? P(l.target) : null;
        a.title = p.candidate + ' tire à boulets rouges' + (t ? ' sur ' + t.short : '');
        a.text = 'Ambiance tendue : ' + p.candidate + ' s\'en est pris violemment' + (t ? ' à ' + t.candidate : ' à ses rivaux') + '. Efficace, peut-être, mais la presse rappelle que ce genre d\'attaque finit souvent par laisser des traces.';
      } else if (type === 'militants') {
        a.title = p.short + ' ouvre une permanence à ' + city;
        a.text = 'Local rafraîchi, affiches neuves et café offert : ' + p.short + ' s\'installe à ' + city + '. Ses militants comptent y tenir des réunions chaque semaine jusqu\'au vote.';
      }
      a.id = 'camp-' + l.pid + '-' + type;
      field.push(a);
    });
    // on garde au plus 5 articles de terrain : d'abord les tiens, puis les grands partis
    var rank = E.ranking(g);
    field.sort(function (x, y) { return (y.mine ? 100 : 0) - (x.mine ? 100 : 0) || rank.indexOf(x.pid) - rank.indexOf(y.pid); });
    var byParty = {};
    field.filter(function (a) { if (byParty[a.pid]) return false; byParty[a.pid] = 1; return true; }).slice(0, 5).forEach(function (a) { arts.push(a); });

    // 3 ter. v3.1 : tes autres actions de la veille ont aussi leur brève (c'est l'explication de ce qu'elles ont fait)
    var BRIEF = { imposer: ['Ton thème fait la une', 'Grâce à une opération de communication bien huilée, '], reforme: ['Une promesse qui fait le tour du pays', 'En promettant monts et merveilles, '],
                  fonds: ['Soirée de levée de fonds', 'Petits fours et carnets de chèques : '], repos: ['Une journée loin des caméras', 'Balade, sieste et téléphone coupé : '], enquete: ['Des barbouzes dans les poubelles ?', 'Selon nos informations, '] };
    var briefSeen = {};
    (ctx.log || []).forEach(function (l) {
      if (l.pid !== me || !l.text) return;
      var type = ACTION_TYPE[l.action], isCard = !type && D.CARDS && Object.keys(D.CARDS).some(function (k) { return D.CARDS[k].name === l.action; });
      if (!isCard && !BRIEF[type]) return;
      var key = isCard ? 'card-' + l.action : type; if (briefSeen[key]) return; briefSeen[key] = 1;
      var p = P(l.pid), b = isCard ? [l.action + ' : ' + p.short + ' sort le grand jeu', p.candidate + ' a abattu une carte maîtresse. '] : BRIEF[type];
      arts.push({ id: 'brief-' + key.replace(/\W/g, ''), rub: 'Campagne', pid: l.pid, mine: true, title: b[0],
        text: b[1] + (l.ok ? 'bilan pour ' + p.short + ' : ' + l.text + '.' : 'raté : ' + l.text.replace(/^Échoue : /, '').toLowerCase()) });
    });

    // 3 bis. v3.1 : les gags des partis (au plus 3 articles)
    var gags = [];
    (ctx.log || []).forEach(function (l) {
      if (!l.ok) return;
      var p = P(l.pid), mine = l.pid === me;
      if (l.nost) {
        var stone = l.nost.k === D.NOSTALGIA.length - 1;
        gags.push({ id: 'gag-nost-' + l.pid, rub: 'Rétro', pid: l.pid, mine: mine,
          title: stone ? p.candidate + ' promet le retour du feu de bois : fou rire général' : p.candidate + ' promet ' + l.nost.what,
          text: stone ? 'Cette fois, c\u2019est allé trop loin. Devant un parterre médusé, ' + p.candidate + ' a vanté « la simplicité de l\u2019âge de pierre ». Les retraités eux-mêmes ont ri. Sur les réseaux, les montages pleuvent.'
            : (l.nost.k ? 'Nouvelle étape dans la grande marche arrière : après avoir promis de revenir à ' + D.NOSTALGIA[l.nost.k - 1].year + ', ' + p.candidate + ' vise désormais ' + l.nost.year + '.' : 'C\u2019est le début d\u2019une grande marche arrière : ' + p.candidate + ' veut ramener la France en ' + l.nost.year + ', « quand tout allait mieux ».') + ' Dans les clubs du troisième âge, on applaudit. Chez les étudiants, on cherche sur Internet ce qu\u2019est ' + D.NOSTALGIA[l.nost.k].thing + '.' +
              (l.war ? ' Petit problème : ' + P(l.war).short + ' pêche dans le même étang, et les deux partis se sont volé des électeurs.' : '') });
      }
      if (l.petal || l.book) gags.push({ id: 'gag-rose', rub: 'Coulisses', pid: l.pid, mine: mine,
        title: l.book ? 'François Hésitant publie « Ce que je n\u2019ai jamais osé dire » : le ' + p.short + ' en sueur' : 'François Hésitant sort de sa retraite et ramène des brebis égarées au ' + p.short,
        text: l.book ? 'Appelé à la rescousse, l\u2019ancien président a préféré régler ses comptes : 400 pages, des noms, des dates. Au siège du ' + p.short + ', on parle déjà d\u2019une affaire.'
          : 'Coup de téléphone, déjeuner discret, photo sur le marché : François Hésitant a convaincu d\u2019anciens électeurs de revenir.' + (l.bloom ? ' Avec ce retour, la rose a retrouvé tous ses pétales : au siège, on sort le champagne.' : '') });
      if (l.micro) gags.push({ id: 'gag-fusion', rub: 'Centre', pid: l.pid, mine: mine,
        title: p.short + ' absorbe « ' + l.micro + ' »',
        text: 'Fin de l\u2019aventure pour « ' + l.micro + ' », créé il y a quelques semaines à peine. Ses 300 militants rejoignent ' + p.short + '. Les deux autres partis du centre, qui n\u2019ont rien payé, s\u2019en frottent les mains. Les paris sont ouverts sur le nom du prochain.' });
      if (l.eclat) gags.push({ id: 'gag-eclat', rub: 'Médias', pid: l.pid, mine: mine,
        title: p.candidate + ' sort la tronçonneuse : les caméras reviennent',
        text: 'Après des semaines d\u2019oubli, ' + p.candidate + ' a enfin fait parler de lui : coup de gueule, décor de chantier et tronçonneuse en main. Les chaînes d\u2019info ont rebranché leurs caméras.' });
      if (l.bingo) gags.push({ id: 'gag-bingo', rub: 'Meeting', pid: l.pid, mine: mine,
        title: 'Bingo ! ' + p.candidate + ' place « ' + l.bingo.words.join(' », « ') + ' »',
        text: 'Les militants l\u2019attendaient, ils ont été servis : en un seul discours, ' + p.candidate + ' a coché ' + l.bingo.words.length + ' cases de son bingo préféré. La salle exulte. Chez les indécis, en revanche, on a changé de chaîne.' });
    });
    if (info.micro) gags.push({ id: 'gag-micro', rub: 'Centre', title: 'Naissance de « ' + info.micro + ' », nouveau parti du centre',
      text: 'Ils étaient trois au centre, les voici quatre. « Nous ne sommes ni pour ni contre, bien au contraire », explique le fondateur de « ' + info.micro + ' ». Chacun des grands partis du centre y perdra quelques électeurs, sauf si l\u2019un d\u2019eux se dévoue pour l\u2019absorber.' });
    if (info.hidden && E.player(g, 'UG')) gags.push({ id: 'gag-avis', rub: 'Avis de recherche', pid: 'UG', mine: me === 'UG',
      title: 'Avez-vous vu ' + P('UG').candidate + ' ?',
      text: 'Signalement : costume bleu, rabot à la main, dernière apparition télévisée il y a plusieurs semaines. Coincés entre ' + P('MN').short + ' et ' + P('EM').short + ', ' + P('UG').short + ' ne passent plus à l\u2019antenne. Toute information est à transmettre au siège du parti, qui promet une récompense.' });
    if (info.primaire && info.primaire.ai && info.primaire.text) gags.push({ id: 'gag-prim', rub: 'Coulisses', pid: 'SM',
      title: 'Primaire au ' + P('SM').short + ' : ' + (info.primaire.choice === 0 ? 'le débat interne s\u2019éternise' : 'un courant claque la porte'),
      text: 'Encore une primaire, encore des motions, encore des nuits blanches rue de Solférino. ' + info.primaire.text });
    gags.sort(function (x, y) { return (y.mine ? 1 : 0) - (x.mine ? 1 : 0); }).slice(0, 3).forEach(function (a) { arts.push(a); });

    // 4. Les affaires du matin
    (ctx.aiAff || []).forEach(function (x) {
      arts.push({ id: 'aff-' + x.pid, rub: 'Affaires', pid: x.pid, title: 'Affaire « ' + x.title + ' » : ' + P(x.pid).short + ' choisit de ' + lc(x.reaction),
        text: 'Révélée ce matin, l\'affaire « ' + x.title + ' » embarrasse ' + who(x.pid) + '. Le parti a choisi de ' + lc(x.reaction) + '.' + (x.effects.length ? ' Conséquences : ' + x.effects.join(', ') + '.' : '') });
    });
    // le dilemme d'un rival
    if (ctx.aiDil) arts.push({ id: 'dil', rub: 'Coulisses', pid: ctx.aiDil.pid, title: P(ctx.aiDil.pid).short + ' face à un choix délicat',
      text: '« ' + ctx.aiDil.title + ' » : dans les coulisses de ' + P(ctx.aiDil.pid).short + ', le débat a été vif. Finalement, ' + P(ctx.aiDil.pid).candidate + ' a tranché : ' + lc(ctx.aiDil.choice) + '.' + (ctx.aiDil.effects.length ? ' ' + ctx.aiDil.effects.join(', ') + '.' : '') });
    // au tour 1 : les programmes qui font parler
    if (info.programmes) info.programmes.filter(function (x) { return x.pid !== me && x.choc.length; }).slice(0, 2).forEach(function (x) {
      arts.push({ id: 'prog-' + x.pid, rub: 'Programmes', pid: x.pid, title: '« ' + x.choc[0] + ' » : la promesse choc de ' + P(x.pid).short,
        text: P(x.pid).candidate + ' a dévoilé son programme. Sa mesure « ' + x.choc[0] + ' » fait déjà réagir tous les plateaux télé : les uns applaudissent, les autres crient au scandale.' });
    });

    // 5. Le sondage
    var poll = E.poll(g), lead = poll[0], up = null, bestD = 0.4;
    poll.forEach(function (x) { var d = 100 * (x.pct - ((ctx.before || {})[x.pid] || x.pct)); if (d > bestD) { bestD = d; up = x; } });
    var myI = poll.findIndex(function (x) { return x.pid === me; });
    arts.push({ id: 'sondage', rub: 'Sondage', pid: lead.pid, title: 'Sondage : ' + P(lead.pid).short + ' en tête' + (up && up.pid !== lead.pid ? ', ' + P(up.pid).short + ' grimpe' : ''),
      text: P(lead.pid).candidate + ' reste en tête des intentions de vote avec ' + Math.round(lead.pct * 100) + ' %, devant ' + P(poll[1].pid).short + ' (' + Math.round(poll[1].pct * 100) + ' %).' +
        (up && up.pid !== lead.pid ? ' La surprise vient de ' + P(up.pid).short + ', qui gagne ' + bestD.toFixed(1).replace('.', ',') + ' point en un tour.' : '') +
        ' ' + (myI < 2 ? 'Ton parti est qualifié pour le second tour… pour l\'instant.' : 'Ton parti pointe à la ' + (myI + 1) + 'ᵉ place : il faudra remonter pour atteindre le second tour.') });

    // La une : 3 titres qui renvoient aux pages (les tiens d'abord, puis le reste)
    var rest = arts.slice(1), teasers = [], kinds = {};
    function kind(a) { return a.id.split('-')[0]; }
    function take(a) { if (teasers.length < 3 && teasers.indexOf(a) < 0 && !kinds[kind(a)]) { teasers.push(a); kinds[kind(a)] = 1; } }
    rest.filter(function (a) { return a.mine && a.id !== 'sondage'; }).slice(0, 1).forEach(take);
    rest.filter(function (a) { return a.id !== 'sondage'; }).forEach(take);
    if (teasers.length < 3) teasers.push(rest.filter(function (a) { return a.id === 'sondage'; })[0]);
    arts.forEach(function (a, i) { a.page = i + 1; });
    return { word: u[0], scene: u[1], day: day, main: arts[0], articles: arts, teasers: teasers.filter(Boolean).slice(0, 3) };
  }

  window.PolitikPress = { build: build, scene: scene, CITIES: CITIES, SCENES: Object.keys(SCENES), UNE_EVENTS: UNE_EVENTS, UNE_CRISIS: UNE_CRISIS };
})();

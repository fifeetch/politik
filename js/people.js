/* Politik — v4.8 : les personnalités de chaque parti.
   Chaque parti a plusieurs personnalités (le chef de file d'abord, puis ses figures connues, en jeux de mots aux mêmes
   initiales). Au choix du parti, tu choisis aussi ton candidat. Chacun a UNE qualité et UN défaut, qui changent
   vraiment le jeu (Meeting, médias, forme, argent, casseroles, gaffes). Une qualité vaut à peu près un défaut :
   aucun candidat n'est « le meilleur », chacun pousse vers une autre façon de jouer.
   Ce fichier complète les données (PolitikData.PEOPLE, QUALITIES, DEFECTS). */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;

  /* Les qualités : effet en jeu (lu par le moteur) */
  var QUALITIES = {
    tribun:   { name: 'Tribun',             icon: '🎤', text: 'Enflamme les salles : chaque Meeting rapporte +1 soutien.' },
    plateau:  { name: 'Bête de plateau',    icon: '📺', text: 'Crève l’écran : l’effet de chaque passage dans les médias +20 %.' },
    increvable: { name: 'Increvable',       icon: '🏃', text: 'Ne dort jamais : récupère 1 ⚡ de plus à chaque tour.' },
    carnet:   { name: 'Carnet d’adresses', icon: '💰', text: 'Les donateurs l’adorent : +2 € à chaque tour.' },
    propre:   { name: 'Irréprochable',      icon: '🧼', text: 'Rien à se reprocher : deux fois moins de risque qu’une affaire sorte.' }
  };
  /* Les défauts */
  var DEFECTS = {
    clivant:  { name: 'Clivant',            icon: '⚔️', text: 'Divise : dans les régions hostiles à ton programme, chaque Meeting rapporte encore 1 soutien de moins.' },
    terne:    { name: 'Terne',              icon: '😐', text: 'Passe mal à l’écran : l’effet des médias −15 %.' },
    fragile:  { name: 'Petite santé',       icon: '🥱', text: 'Se fatigue vite : récupère 1 ⚡ de moins à chaque tour.' },
    gaffeur:  { name: 'Gaffeur',            icon: '🙊', text: 'La petite phrase de trop : peut gaffer dès qu’il ne lui reste qu’1 ⚡ (au lieu de 0).' },
    casserole: { name: 'Vieille casserole', icon: '🍳', text: 'Un passé chargé : commence la campagne avec 2 casseroles.' }
  };

  /* Les personnalités : [nom, sexe, qualité, défaut, petit titre]. La première est le chef de file habituel. */
  var PEOPLE = {
    FI: [['Jean-Lutte Mégaphone', 'm', 'tribun', 'clivant', 'le tribun au porte-voix'],
         ['Manuel Bombarde', 'm', 'plateau', 'clivant', 'le coordinateur qui tonne'],
         ['Mathilde Panique', 'f', 'increvable', 'gaffeur', 'la présidente de groupe sur tous les fronts'],
         ['Clémence Guérilla', 'f', 'tribun', 'terne', 'la militante des luttes'],
         ['Éric Coquelicot', 'm', 'propre', 'fragile', 'le député-gilet des ronds-points'],
         ['Louis Boucan', 'm', 'increvable', 'clivant', 'le jeune loup qui fait du bruit']],
    SM: [['Raphaël Grandsmots', 'm', 'plateau', 'terne', 'le beau parleur européen'],
         ['Olivier Fauteuil', 'm', 'carnet', 'terne', 'le premier secrétaire bien installé'],
         ['Boris Vaudeville', 'm', 'tribun', 'gaffeur', 'le maire qui joue la comédie'],
         ['Anne Hipster', 'f', 'propre', 'clivant', 'la maire de la capitale à vélo'],
         ['Carole Dégainée', 'f', 'plateau', 'fragile', 'la présidente de région qui tire vite'],
         ['François Hésitant', 'm', 'carnet', 'casserole', 'l’ancien président qui ne sait pas']],
    VP: [['Marine Tournesol', 'f', 'propre', 'terne', 'l’écolo qui suit le soleil'],
         ['Sandrine Rouspète', 'f', 'plateau', 'clivant', 'la députée qui s’indigne'],
         ['Yannick Jardinet', 'm', 'propre', 'fragile', 'l’eurodéputé du potager'],
         ['Cyrielle Châtaigne', 'f', 'increvable', 'terne', 'la cheffe de groupe tenace'],
         ['Éric Pédalo', 'm', 'tribun', 'gaffeur', 'le maire qui roule à contresens']],
    EM: [['Gabriel Agité', 'm', 'plateau', 'fragile', 'le pressé de la réforme'],
         ['Gérald Dans-le-Vent', 'm', 'increvable', 'casserole', 'l’ancien ministre qui suit le vent'],
         ['Élisabeth Bornée', 'f', 'propre', 'terne', 'l’ancienne Première ministre au 49.3'],
         ['Aurore Bergerie', 'f', 'tribun', 'clivant', 'la bergère des députés'],
         ['Yaël Brouhaha-Pivot', 'f', 'carnet', 'gaffeur', 'la présidente du perchoir'],
         ['Stéphane Séjour', 'm', 'carnet', 'terne', 'le secrétaire général toujours en voyage']],
    UG: [['Bruno Raboteur', 'm', 'carnet', 'terne', 'le rabot à la main'],
         ['Laurent Wapiti', 'm', 'tribun', 'clivant', 'le président de région qui brame'],
         ['Xavier Bougonnant', 'm', 'propre', 'terne', 'le président de région qui ronchonne'],
         ['Valérie Patraque', 'f', 'increvable', 'gaffeur', 'la présidente de région qui tousse'],
         ['David Lissé', 'm', 'plateau', 'fragile', 'le maire au brushing parfait'],
         ['Rachida Dorures', 'f', 'tribun', 'casserole', 'la maire des beaux quartiers']],
    MN: [['Marine La Pénible', 'f', 'increvable', 'casserole', 'l’éternelle candidate'],
         ['Jordan Brushing', 'm', 'plateau', 'gaffeur', 'le président lisse comme un selfie'],
         ['Sébastien Chenille', 'm', 'increvable', 'clivant', 'le porte-parole qui ne lâche rien'],
         ['Jean-Philippe Tangage', 'm', 'carnet', 'casserole', 'le député qui tangue'],
         ['Louis Alibi', 'm', 'tribun', 'casserole', 'le maire qui a toujours une excuse'],
         ['Laure Lavande', 'f', 'propre', 'terne', 'la députée qui sent bon']],
    LO: [['Nathalie Arrêtdetravail', 'f', 'tribun', 'terne', 'la grève dans le sang'],
         ['Jean-Pierre Merguez', 'm', 'propre', 'clivant', 'le militant du barbecue syndical'],
         ['Arlette Lagrève', 'f', 'plateau', 'fragile', 'la doyenne des « travailleuses, travailleurs »']],
    PC: [['Fabien Rillettes', 'm', 'plateau', 'gaffeur', 'le camarade bon vivant'],
         ['André Chasse-neige', 'm', 'tribun', 'fragile', 'le député qui déblaie tout'],
         ['Ian Brasero', 'm', 'increvable', 'terne', 'le sénateur des piquets de grève'],
         ['Stéphane Peuple', 'm', 'propre', 'terne', 'le député des quartiers'],
         ['Léon Défilé', 'm', 'tribun', 'clivant', 'le jeune du 1er Mai']],
    MD: [['François Bientôtprésident', 'm', 'propre', 'fragile', 'le candidat perpétuel'],
         ['Marc Fermier', 'm', 'carnet', 'terne', 'l’ancien ministre de la ferme'],
         ['Jean-Noël Barrage', 'm', 'plateau', 'gaffeur', 'l’ancien ministre qui fait barrage'],
         ['Geneviève Discrète', 'f', 'propre', 'terne', 'la ministre qu’on ne voit pas'],
         ['Jean-Louis Bourdonnant', 'm', 'increvable', 'gaffeur', 'le centriste qui bourdonne']],
    HZ: [['Édouard Patience', 'm', 'propre', 'terne', 'celui qui attend son heure'],
         ['Christophe Béton', 'm', 'carnet', 'casserole', 'le maire du bâtiment'],
         ['Frédéric Valsetout', 'm', 'plateau', 'gaffeur', 'le secrétaire général qui valse'],
         ['Laurent Marchepied', 'm', 'increvable', 'terne', 'le second toujours sur le marchepied']],
    DL: [['Nigaud Dupont-Arriéré', 'm', 'tribun', 'clivant', 'le gaulois en retard d’une époque'],
         ['Dominique Jarretière', 'f', 'propre', 'terne', 'la vice-présidente aux bas de laine'],
         ['Nicolas Dentelle', 'm', 'carnet', 'gaffeur', 'le trésorier qui coud des drapeaux'],
         ['Hubert Fromageau', 'm', 'increvable', 'fragile', 'le député du terroir']],
    RQ: [['Éric Zéronuance', 'm', 'plateau', 'clivant', 'le polémiste sans nuance'],
         ['Sarah Krampon', 'f', 'tribun', 'casserole', 'la vice-présidente qui s’accroche'],
         ['Stanislas Rigolo', 'm', 'carnet', 'gaffeur', 'le stratège qui fait rire'],
         ['Guillaume Pelletée', 'm', 'increvable', 'clivant', 'l’eurodéputé qui remue la terre']]
  };

  /* v4.9.1 : le visage de chaque personnalité, dessiné d'après l'apparence de la personnalité qu'elle parodie
     (peau, coupe et couleur de cheveux, lunettes, barbe ; cheveux gris pour les plus âgés).
     peau : 0 très claire → 5 très foncée. Les chefs de file gardent leur portrait dessiné du parti. */
  var BLACK = '#1E1A1A', DARK = '#3A2A20', BROWN = '#8A5A3B', BLOND = '#C9922E', GREY = '#9C9CA6', WHITE = '#D9D9E0', SALT = '#6E6A6A';
  function F(skin, hair, hairColor, glasses, beard, mouth, outfit) { return { skin: skin, hair: hair, hairColor: hairColor, glasses: glasses || 'none', beard: !!beard, mouth: mouth || 'sourire', outfit: outfit || '#26305A' }; }
  var FACES = {
    // LFI
    'Manuel Bombarde': F(1, 'court', DARK, 'none', true, 'serieux', '#4A4A55'),
    'Mathilde Panique': F(0, 'long', DARK, 'none', false, 'grand', '#7A1E24'),
    'Clémence Guérilla': F(0, 'carre', BROWN, 'none', false, 'sourire', '#7A1E24'),
    'Éric Coquelicot': F(0, 'court', WHITE, 'none', true, 'serieux', '#4A4A55'),
    'Louis Boucan': F(0, 'court', DARK, 'none', false, 'grand', '#26305A'),
    'Sophia Chicane': F(2, 'long', BLACK, 'none', false, 'sourire', '#1F1F2A'),
    // PS
    'Olivier Fauteuil': F(0, 'court', GREY, 'carrees', false, 'sourire', '#26305A'),
    'Boris Vaudeville': F(0, 'court', DARK, 'none', true, 'sourire', '#26305A'),
    'Anne Hipster': F(0, 'carre', BLOND, 'none', false, 'sourire', '#7A1E24'),
    'Carole Dégainée': F(0, 'carre', DARK, 'none', false, 'grand', '#4A4A55'),
    'François Hésitant': F(0, 'chauve', GREY, 'rondes', false, 'sourire', '#26305A'),
    'Johanna Roulette': F(0, 'long', BROWN, 'none', false, 'sourire', '#7A1E24'),
    // Écologistes
    'Sandrine Rouspète': F(0, 'court', WHITE, 'rondes', false, 'grand', '#2E6B45'),
    'Yannick Jardinet': F(0, 'court', SALT, 'none', false, 'sourire', '#2E6B45'),
    'Cyrielle Châtaigne': F(0, 'long', BROWN, 'none', false, 'sourire', '#2E6B45'),
    'Éric Pédalo': F(0, 'court', DARK, 'none', false, 'sourire', '#2E6B45'),
    'Grégory Doucement': F(0, 'court', DARK, 'carrees', true, 'sourire', '#2E6B45'),
    // Renaissance
    'Gérald Dans-le-Vent': F(1, 'court', BLACK, 'none', false, 'serieux', '#1F2A55'),
    'Élisabeth Bornée': F(0, 'court', GREY, 'none', false, 'serieux', '#1F2A55'),
    'Aurore Bergerie': F(0, 'long', BLOND, 'none', false, 'sourire', '#1F2A55'),
    'Yaël Brouhaha-Pivot': F(0, 'long', DARK, 'none', false, 'sourire', '#1F2A55'),
    'Stéphane Séjour': F(0, 'court', DARK, 'none', false, 'sourire', '#1F2A55'),
    // LR
    'Laurent Wapiti': F(0, 'court', WHITE, 'none', false, 'serieux', '#B23A2A'),
    'Xavier Bougonnant': F(0, 'chauve', GREY, 'carrees', false, 'serieux', '#1F2A55'),
    'Valérie Patraque': F(0, 'carre', BLOND, 'none', false, 'sourire', '#1F2A55'),
    'David Lissé': F(0, 'court', DARK, 'none', false, 'sourire', '#1F2A55'),
    'Rachida Dorures': F(2, 'long', BLACK, 'none', false, 'grand', '#1F1F2A'),
    // RN
    'Jordan Brushing': F(0, 'court', BLACK, 'none', false, 'sourire', '#1F2A55'),
    'Sébastien Chenille': F(0, 'chauve', GREY, 'carrees', false, 'serieux', '#1F2A55'),
    'Jean-Philippe Tangage': F(0, 'court', DARK, 'none', false, 'sourire', '#1F2A55'),
    'Louis Alibi': F(0, 'court', GREY, 'none', false, 'sourire', '#1F2A55'),
    'Laure Lavande': F(0, 'long', BLOND, 'none', false, 'sourire', '#1F2A55'),
    // LO
    'Jean-Pierre Merguez': F(0, 'court', WHITE, 'none', true, 'serieux', '#7A1E24'),
    'Arlette Lagrève': F(0, 'carre', WHITE, 'none', false, 'grand', '#7A1E24'),
    // PCF
    'André Chasse-neige': F(0, 'chauve', WHITE, 'none', true, 'sourire', '#7A1E24'),
    'Ian Brasero': F(0, 'court', DARK, 'none', false, 'sourire', '#7A1E24'),
    'Stéphane Peuple': F(0, 'court', GREY, 'none', true, 'serieux', '#7A1E24'),
    'Léon Défilé': F(0, 'court', BROWN, 'none', false, 'grand', '#7A1E24'),
    // MoDem
    'Marc Fermier': F(0, 'court', SALT, 'carrees', false, 'sourire', '#E1663A'),
    'Jean-Noël Barrage': F(0, 'court', DARK, 'none', false, 'sourire', '#26305A'),
    'Geneviève Discrète': F(0, 'court', BLOND, 'none', false, 'sourire', '#26305A'),
    'Jean-Louis Bourdonnant': F(0, 'chauve', WHITE, 'rondes', false, 'serieux', '#26305A'),
    // Horizons
    'Christophe Béton': F(0, 'court', DARK, 'none', false, 'sourire', '#26305A'),
    'Frédéric Valsetout': F(0, 'court', GREY, 'carrees', false, 'sourire', '#26305A'),
    'Laurent Marchepied': F(0, 'court', BLACK, 'none', true, 'sourire', '#26305A'),
    // Debout la France (personnages inventés)
    'Dominique Jarretière': F(0, 'chignon', GREY, 'rondes', false, 'serieux', '#1F2A55'),
    'Nicolas Dentelle': F(0, 'court', BROWN, 'none', true, 'sourire', '#1F2A55'),
    'Hubert Fromageau': F(1, 'chauve', SALT, 'none', true, 'grand', '#2E6B45'),
    // Reconquête
    'Sarah Krampon': F(0, 'long', BLACK, 'none', false, 'sourire', '#1F1F2A'),
    'Stanislas Rigolo': F(0, 'court', BROWN, 'none', false, 'sourire', '#1F2A55'),
    'Guillaume Pelletée': F(0, 'court', DARK, 'carrees', false, 'serieux', '#1F2A55')
  };

  /* La liste des personnalités d'un parti, sous forme d'objets */
  function peopleOf(pid) {
    return (PEOPLE[pid] || []).map(function (x, i) { return { id: pid + '-' + i, idx: i, name: x[0], sex: x[1], q: x[2], d: x[3], title: x[4], leader: i === 0 }; });
  }
  /* Le visage d'une personnalité (toujours le même pour un nom donné) */
  function faceOf(name, sex) {
    if (FACES[name]) return Object.assign({}, FACES[name]);   // v4.9.1 : le visage dessiné d'après le modèle
    var h = 7; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 100003;
    var hairs = sex === 'f' ? ['long', 'carre', 'boucles', 'chignon', 'court'] : ['court', 'chauve', 'boucles', 'court', 'long'];
    return { skin: h % 6, hair: hairs[(h >> 3) % hairs.length], hairColor: ['#1E1A1A', '#3A2A20', '#8A5A3B', '#C9922E', '#C9C9D1', '#B23A2A'][(h >> 5) % 6],
      glasses: ['none', 'rondes', 'carrees', 'none'][(h >> 7) % 4], mouth: ['sourire', 'serieux', 'grand'][(h >> 9) % 3],
      outfit: ['#26305A', '#4A4A55', '#7A1E24', '#2E6B45', '#5B3E8C'][(h >> 11) % 5], beard: sex === 'm' && (h >> 13) % 4 === 0 };
  }

  D.QUALITIES = QUALITIES; D.DEFECTS = DEFECTS; D.PEOPLE = PEOPLE;
  var API = { QUALITIES: QUALITIES, DEFECTS: DEFECTS, PEOPLE: PEOPLE, FACES: FACES, peopleOf: peopleOf, faceOf: faceOf };
  if (node) module.exports = API; else root.PolitikPeople = API;
})(this);

/* Politik — données du jeu (règles v0.3 : les thèmes de campagne)
   Toutes les valeurs chiffrées du jeu sont ici : c'est le fichier à modifier pour équilibrer. */
(function (root) {
  var REGIONS = [
    { id: 'idf', name: 'Île-de-France',              profile: 'urbaine',      pts: 12, concerns: ['pouvoir', 'securite'] },
    { id: 'ara', name: 'Auvergne-Rhône-Alpes',       profile: 'urbaine',      pts: 8, concerns: ['ecologie', 'emploi'] },
    { id: 'hdf', name: 'Hauts-de-France',            profile: 'industrielle', pts: 6, concerns: ['emploi', 'pouvoir'] },
    { id: 'naq', name: 'Nouvelle-Aquitaine',         profile: 'rurale',       pts: 6, concerns: ['services', 'ecologie'] },
    { id: 'occ', name: 'Occitanie',                  profile: 'rurale',       pts: 6, concerns: ['pouvoir', 'services'] },
    { id: 'ges', name: 'Grand Est',                  profile: 'industrielle', pts: 5, concerns: ['emploi', 'immigration'] },
    { id: 'pac', name: "Provence-Alpes-Côte d'Azur", profile: 'urbaine',      pts: 5, concerns: ['securite', 'immigration'] },
    { id: 'pdl', name: 'Pays de la Loire',           profile: 'rurale',       pts: 4, concerns: ['ecologie', 'emploi'] },
    { id: 'bre', name: 'Bretagne',                   profile: 'rurale',       pts: 3, concerns: ['ecologie', 'services'] },
    { id: 'nor', name: 'Normandie',                  profile: 'historique',   pts: 3, concerns: ['emploi', 'services'] },
    { id: 'bfc', name: 'Bourgogne-Franche-Comté',    profile: 'historique',   pts: 3, concerns: ['services', 'pouvoir'] },
    { id: 'cvl', name: 'Centre-Val de Loire',        profile: 'historique',   pts: 3, concerns: ['services', 'securite'] },
    { id: 'cor', name: 'Corse',                      profile: 'historique',   pts: 1, concerns: ['securite', 'pouvoir'] }
  ];

  /* v0.3 — Les thèmes de campagne.
     Impact d'un message = crédibilité du parti sur le thème (0, 1 ou 2)
                         + 1 si la région en fait une de ses 2 préoccupations
                         + 1 si le thème fait l'actualité ce tour. */
  var THEMES = [
    { id: 'pouvoir',     name: "Pouvoir d'achat",    short: 'Achat',       icon: '💶' },
    { id: 'emploi',      name: 'Emploi & industrie', short: 'Emploi',      icon: '🏭' },
    { id: 'services',    name: 'Services publics',   short: 'Services',    icon: '🏥' },
    { id: 'ecologie',    name: 'Écologie',           short: 'Écologie',    icon: '🌿' },
    { id: 'securite',    name: 'Sécurité',           short: 'Sécurité',    icon: '🚓' },
    { id: 'immigration', name: 'Immigration',        short: 'Immigration', icon: '🛂' }
  ];

  /* Gros titres de l'actualité, tirés au hasard quand un thème fait la une. */
  var HEADLINES = {
    pouvoir:     ['Le plein à 2,40 € : les automobilistes à bout', 'Les prix du caddie grimpent encore', 'Loyers : les jeunes n\'y arrivent plus'],
    emploi:      ['Une usine de 800 salariés menacée de fermeture', 'Le chômage repart à la hausse', 'Les entreprises peinent à recruter'],
    services:    ['Les urgences ferment la nuit faute de médecins', 'Encore une classe fermée dans un village', 'Les bureaux de poste désertent les campagnes'],
    ecologie:    ['Vague de chaleur record sur tout le pays', 'Les rivières à sec, l\'eau rationnée', 'Les marches pour le climat font le plein'],
    securite:    ['Nuit de tensions en banlieue', 'Les policiers dénoncent leur manque de moyens', 'Un fait divers enflamme les plateaux télé'],
    immigration: ['Le projet de loi immigration enflamme l\'Assemblée', 'Débat tendu sur l\'accueil des réfugiés', 'Contrôles renforcés à la frontière italienne']
  };

  var PROFILES = {
    urbaine: 'Urbaine', rurale: 'Rurale', industrielle: 'Industrielle', historique: 'Historique'
  };

  var PARTIES = [
    { id: 'FI', pos: 1, name: 'La France Indignée', short: 'France Indignée', family: 'Gauche radicale',
      color: '#C8323C', ink: '#FFFFFF', money: 5, infl: 4, bases: ['occ', 'bfc'],
      cred: { pouvoir: 2, services: 2, ecologie: 1, emploi: 1, securite: 0, immigration: 0 },
      force: 'Réseaux sociaux : relance le dé une fois par tour si le résultat est mauvais.',
      weakness: 'Campagne terrain +1 € en région rurale.',
      cards: ['marche_pop', 'censure'] },
    { id: 'SM', pos: 3, name: 'Socialisme Modéré', short: 'Soc. Modéré', family: 'Centre gauche',
      color: '#E07AA0', ink: '#1B1F3B', money: 4, infl: 3, bases: ['naq', 'cvl'],
      cred: { services: 2, emploi: 1, pouvoir: 1, securite: 1, ecologie: 1, immigration: 0 },
      force: "Réseau d'élus : +1 cube en campagne terrain là où il a déjà 5 cubes ou plus.",
      weakness: "Peu d'argent au départ.",
      cards: ['fete_rose', 'primaire'] },
    { id: 'VP', pos: 2, name: 'Les Verts Pâturages', short: 'Verts Pâturages', family: 'Écologie',
      color: '#3E9B5A', ink: '#FFFFFF', money: 6, infl: 3, bases: ['ara', 'cor'],
      cred: { ecologie: 2, services: 1, pouvoir: 1, emploi: 0, securite: 0, immigration: 0 },
      force: 'Campagne médiatique : +1 cube en plus dans les régions urbaines.',
      weakness: 'Lever des fonds ne rapporte que 2 €.',
      cards: ['climat', 'canicule'] },
    { id: 'EM', pos: 4, name: 'En Mouvement', short: 'En Mouvement', family: 'Centre',
      color: '#F2A93B', ink: '#1B1F3B', money: 8, infl: 4, bases: ['pdl', 'bre'],
      cred: { emploi: 2, securite: 2, ecologie: 1, services: 1, immigration: 1, pouvoir: 0 },
      force: 'Lever des fonds rapporte 4 € et 1 ★.',
      weakness: "Usure du pouvoir : aux tours 4, 6 et 8, perd 1 cube dans sa région la plus forte.",
      cards: ['art493', 'remaniement'] },
    { id: 'UG', pos: 5, name: "L'Union Gaulliste", short: 'Union Gaulliste', family: 'Droite',
      color: '#4A7FD0', ink: '#FFFFFF', money: 5, infl: 4, bases: ['ges', 'nor'],
      cred: { securite: 2, emploi: 2, immigration: 1, pouvoir: 1, ecologie: 0, services: 0 },
      force: 'Fidélité : en région historique, une contre-campagne ne peut pas le faire descendre sous 2 cubes.',
      weakness: 'Divisions : les événements « Division » lui coûtent 2 cubes au lieu de 1.',
      cards: ['appel18', 'rassemblement'] },
    { id: 'MN', pos: 6, name: 'Mouvement National', short: 'Mvt National', family: 'Droite nationale',
      color: '#24325E', ink: '#FFFFFF', money: 7, infl: 3, bases: ['hdf', 'pac'],
      cred: { immigration: 2, securite: 2, pouvoir: 1, emploi: 1, ecologie: 0, services: 0 },
      force: 'Médias : +1 cube en plus dans les régions industrielles.',
      weakness: 'Peu de relais locaux : il lui faut 4 cubes (au lieu de 3) pour contrôler une région.',
      cards: ['plateau_tele', 'grand_meeting'] }
  ];

  /* Actions de base. cost = { money, infl } ; target : 'region' | 'party' | null ; theme : l'action porte un message (thème) */
  var ACTIONS = {
    terrain:  { name: 'Terrain',        cost: { money: 2, infl: 0 }, target: 'region', theme: true, text: 'Autant de cubes que l\'impact du message (1 à 4)' },
    medias:   { name: 'Médias',         cost: { money: 3, infl: 1 }, target: 'region', theme: true, text: 'Le message passe dans cette région et les 2 autres les plus concernées par le thème' },
    reseaux:  { name: 'Réseaux',        cost: { money: 1, infl: 0 }, target: 'region', theme: true, text: 'Un dé : de −1 à +4 cubes, +1 si le thème fait l\'actu' },
    contre:   { name: 'Contre-camp.',   cost: { money: 2, infl: 1 }, target: 'region', text: '−2 cubes au rival le plus fort de la région (il faut y avoir 1 cube)' },
    fonds:    { name: 'Fonds',          cost: { money: 0, infl: 0 }, target: null,     text: '+3 €' },
    reforme:  { name: 'Réforme',        cost: { money: 0, infl: 4 }, target: 'region', text: '+1 cube dans toutes les régions du même profil (région contrôlée)' },
    imposer:  { name: 'Imposer',        cost: { money: 2, infl: 2 }, target: null,     theme: true, text: 'Ton thème fera l\'actu au prochain tour (pour tout le monde !)' },
    alliance: { name: 'Alliance',       cost: { money: 0, infl: 1 }, target: 'party',  text: "Proposer une alliance à un parti proche (distance 2 au plus)" },
    rupture:  { name: 'Rupture',        cost: { money: 0, infl: 0 }, target: null,     text: "Rompre ton alliance : −2 ★, et ton ex-allié ne te reportera presque rien au second tour" }
  };

  /* Cartes spéciales : 1 utilisation par partie, prend 1 action. */
  var CARDS = {
    marche_pop:    { name: 'Marche populaire',     target: 'region', profiles: ['urbaine'], text: '+3 cubes dans une région urbaine.' },
    censure:       { name: 'Motion de censure',    target: null, text: 'Chaque adversaire perd 1 ★.' },
    fete_rose:     { name: 'Fête de la Rose',      target: 'region', text: '+2 cubes dans cette région et dans une autre où tu es présent.' },
    primaire:      { name: 'Primaire',             target: null, text: '+3 ★.' },
    climat:        { name: 'Marche pour le climat', target: 'region', profiles: ['rurale', 'urbaine'], text: '+3 cubes dans une région rurale ou urbaine.' },
    canicule:      { name: 'Canicule',             target: null, text: 'Chaque adversaire perd 1 cube dans ses 2 régions les plus fortes.' },
    art493:        { name: '49.3',                 target: null, text: "Annule la prochaine action du rival en tête ce tour." },
    remaniement:   { name: 'Remaniement',          target: 'region', text: "Déplace 2 cubes de ta région la plus forte vers celle-ci." },
    appel18:       { name: 'Appel du 18 juin',     target: null, text: '+1 cube dans chaque région historique.' },
    rassemblement: { name: 'Rassemblement',        target: null, text: '+3 € et +1 ★.' },
    plateau_tele:  { name: 'Plateau télé',         target: null, text: '+2 cubes dans 3 régions rurales ou industrielles.' },
    grand_meeting: { name: 'Grand meeting',        target: 'region', text: '+4 cubes dans une région.' }
  };

  var EVENTS = [
    { id: 'crise', theme: 'pouvoir',      title: 'Crise économique',         text: 'Chaque parti perd 2 €.' },
    { id: 'greve', theme: 'services',      title: 'Grève des transports',     text: 'Ce tour, les campagnes terrain coûtent 1 € de plus.' },
    { id: 'scandale',   title: 'Scandale !',               text: 'Le parti en tête perd 2 cubes dans sa plus grande région.' },
    { id: 'buzz',       title: 'Trend viral',              text: 'Ce tour, les actions Réseaux sont gratuites.' },
    { id: 'sondage',    title: 'Sondage surprise',         text: 'Le dernier au classement gagne 2 ★.' },
    { id: 'fete',       title: 'Fête nationale',           text: 'Tous les partis gagnent 1 ★.' },
    { id: 'division',   title: 'Guerre des chefs',         text: "Division : chaque parti perd 1 cube dans sa région la plus forte (2 pour l'Union Gaulliste)." },
    { id: 'fuite',      title: 'Fuite de documents',       text: 'Chaque parti perd 1 ★.' },
    { id: 'salon', theme: 'ecologie',      title: "Salon de l'agriculture",   text: 'Chaque parti gagne 1 cube dans la région rurale où il est le plus fort.' },
    { id: 'usine', theme: 'emploi',      title: "Fermeture d'usine",        text: 'Dans les régions industrielles, le parti qui contrôle perd 1 cube.' },
    { id: 'patrimoine', title: 'Journées du patrimoine',   text: 'Chaque parti gagne 1 cube dans la région historique où il est le plus fort.' },
    { id: 'mecene',     title: 'Mécène généreux',          text: 'Le dernier au classement gagne 3 €.' },
    { id: 'bouchons', title: 'Bouchons sur le périph',   text: "Le parti qui contrôle l'Île-de-France perd 1 cube." },
    { id: 'calme',      title: 'Rentrée tranquille',       text: 'Il ne se passe rien. Profitez-en.' },
    { id: 'division2',  title: 'Congrès houleux',          text: "Division : chaque parti perd 1 cube dans sa région la plus forte (2 pour l'Union Gaulliste)." }
  ];

  var OBJECTIVES = [
    { id: 'ouest',      name: 'Le Grand Ouest',        text: 'Contrôler Bretagne, Pays de la Loire et Normandie', bonus: 4 },
    { id: 'territoires',name: 'France des territoires', text: 'Contrôler 3 régions rurales',                        bonus: 4 },
    { id: 'industrie',  name: 'Le cœur industriel',     text: 'Contrôler les 2 régions industrielles',             bonus: 4 },
    { id: 'patrimoine', name: 'Le patrimoine',          text: 'Contrôler 3 régions historiques',                   bonus: 4 },
    { id: 'paris',      name: "Paris d'abord",          text: "Contrôler l'Île-de-France",                         bonus: 3 },
    { id: 'partout',    name: 'Présent partout',        text: 'Avoir au moins 1 cube dans les 13 régions',         bonus: 3 },
    { id: 'debat',      name: 'Maître du débat',        text: 'Gagner 2 débats',                                   bonus: 3 },
    { id: 'corse',      name: "L'île de Beauté",        text: 'Contrôler la Corse',                                bonus: 2 }
  ];

  var RULES = {
    maxTurns: 8,
    actionsPerTurn: 3,
    debateTurns: [3, 6, 8],
    incomeMoney: 4, incomePerRegion: 1, incomeRegionMax: 3, incomeInfl: 2,
    minControl: 3, maxCubes: 10, startCubes: 3,
    spotlightCost: 2,
    /* v0.2 : axe politique, transferts, alliances, élection */
    maxAllianceDistance: 2,
    breakCost: 2,
    incumbentBonus: 1.25,        // prime au sortant : les cubes du parti qui contrôle une région comptent ×1,25 dans les votes
    objectiveVotes: 0.6,         // un objectif réussi rapporte bonus × 0,6 « millions » de voix
    transfer: { 1: 0.50, 2: 0.42, 3: 0.35, 4: 0.30, 5: 0.25 },  // report au 2nd tour selon la distance
    allyTransfer: 0.85,
    edgeMobilization: 1.35,
    betrayedTransfer: 0.05,
    /* v0.3 : thèmes */
    terrainCubes: [1, 1, 2, 3, 4],   // cubes gagnés en Terrain selon l'impact du message (0 à 4)
    mediaCubes:   [0, 1, 1, 1, 2],   // cubes par région en Médias selon l'impact (0 à 4)
    mediaRegions: 3,                 // nombre de régions touchées par les Médias
    socialHotBonus: 1                // bonus des Réseaux quand le thème fait l'actu
  };

  var DATA = { REGIONS: REGIONS, PROFILES: PROFILES, THEMES: THEMES, HEADLINES: HEADLINES, PARTIES: PARTIES, ACTIONS: ACTIONS,
               CARDS: CARDS, EVENTS: EVENTS, OBJECTIVES: OBJECTIVES, RULES: RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.PolitikData = DATA;
})(this);

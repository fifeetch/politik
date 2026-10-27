/* Politik — données du jeu (règles v1.0 : poids réels, vote blanc, abstention, départ législatives 2024)
   Régions : ins = millions d'inscrits, abst = abstention (%), blanc / nuls = % des votants, au 2nd tour de la présidentielle 2022
   (Conseil constitutionnel, résultats par département). start = score de départ du mode Réaliste (% des exprimés) :
   la MOYENNE des législatives 2024 (1er tour, la gauche unie répartie entre FI, SM et VP selon les européennes) et des
   européennes 2024 (FI = LFI, SM = PS-Place publique, VP = Les Écologistes, EM = Besoin d'Europe / Ensemble,
   UG = LR, MN = RN et alliés). Sources : ministère de l'Intérieur, résultats définitifs (data.gouv.fr).
   La « région » cor regroupe la Corse, l'outre-mer et les Français de l'étranger.
   Toutes les valeurs chiffrées du jeu sont ici : c'est le fichier à modifier pour équilibrer. */
(function (root) {
  /* v1.2 : les points de départ du mode Réaliste.
     p2022 : 1er tour de la présidentielle 2022 (start22). FI = Mélenchon, SM = Hidalgo, VP = Jadot, EM = Macron,
             UG = Pécresse, MN = Le Pen (ministère de l'Intérieur, résultats définitifs par région).
     e2024 : moyenne des législatives et des européennes 2024 (start).
     sond  : moyenne de 6 sondages d'octobre 2026 pour la présidentielle 2027 (POLLS). Les sondages sont nationaux :
             chaque région garde son profil de 2024 et suit la tendance nationale des sondages. */
  var POLLS = {
    date: 'octobre 2026',
    // v1.7 : moyenne de 58 sondages au 22 octobre 2026 (sondage-presidentielle.fr), un candidat par famille :
    // MN = Le Pen, FI = Mélenchon, HZ = Philippe (Horizons), SM = Glucksmann, EM = Attal (Renaissance), UG = Retailleau,
    // RQ = Zemmour, VP = Tondelier, PC = Roussel, DL = Dupont-Aignan, LO = Arthaud. MD : le MoDem n'a pas de candidat testé.
    // Philippe et Attal sont rarement testés ensemble : le total dépasse 100 %, il est ramené à 100 % dans le moteur.
    avg: { MN: 35.1, FI: 16.5, HZ: 14.9, SM: 12.5, EM: 9.0, UG: 7.8, RQ: 4.1, VP: 3.0, PC: 2.0, DL: 2.0, LO: 0.7, MD: 0 },
    list: [
      { who: 'Harris Interactive', when: '23 octobre', MN: 33, FI: 17, SM: 12, EM: 15, UG: 4, VP: 2 },
      { who: 'OpinionWay pour CNews', when: '21-22 octobre', MN: 36, FI: 16, SM: 13, EM: 16, UG: 6, VP: 1 },
      { who: 'Ifop pour LCI, Le Figaro et Sud Radio', when: '17-19 octobre', MN: 36, FI: 16.5, SM: 13.5, EM: 17, UG: 5, VP: 3 },
      { who: 'YouGov pour Le HuffPost', when: '12-15 octobre', MN: 36, FI: 15, SM: 13, EM: 13, UG: 7, VP: 6 },
      { who: 'Elabe pour BFMTV et La Tribune Dimanche', when: '14-16 octobre', MN: 32.5, FI: 15, SM: 15.5, EM: 16.5, UG: 7, VP: 3 },
      { who: 'Odoxa', when: '15 octobre', MN: 37, FI: 18, SM: 9.5, EM: 17, UG: 6.5, VP: 3 }
    ],
    src: [
      { label: 'Tableau des sondages présidentielle 2027 (EPOC Info, site non officiel)', url: 'https://www.epocinfo.fr/ep2027.php' },
      { label: 'Moyenne des sondages présidentielle 2027 au 22 octobre 2026 (sondage-presidentielle.fr, site non officiel)', url: 'https://sondage-presidentielle.fr/en' },
      { label: 'Sondage OpinionWay pour CNews, 21-22 octobre 2026 (Europe 1, presse)', url: 'https://www.europe1.fr/politique/sondage-presidentielle-2027-apres-le-17-octobre-marine-le-pen-consolide-son-avance-au-premier-tour-david-lisnard-devance-gabriel-attal-1174275' },
      { label: 'Notices des sondages publiés (Commission des sondages)', url: 'https://www.commission-des-sondages.fr/notices/' }
    ]
  };
  var BASES = {
    p2022: { name: 'Présidentielle 2022', short: 'Présidentielle 2022', text: 'Le 1er tour de la dernière présidentielle, en avril 2022.', learn: 'depart2022' },
    e2024: { name: 'Dernières élections', short: 'Moyenne 2024', text: 'La moyenne des législatives et des européennes de 2024.', learn: 'depart2024' },
    sond: { name: 'Sondages 2026', short: 'Sondages 2026', text: 'La moyenne de 6 sondages d\'octobre 2026 pour la présidentielle 2027.', learn: 'departSondages' }
  };
  var REGIONS = [
    { id: 'idf', name: 'Île-de-France', profile: 'urbaine', seats: 97, pts: 9.8, ins: 7.35, abst: 29.4, blanc: 6.2, nuls: 1.7, start: { FI: 18.6, SM: 15.7, VP: 7.1, EM: 20.5, UG: 9.5, MN: 19.5 }, start22: { FI: 30.2, SM: 1.4, VP: 5.4, EM: 30.2, UG: 6.2, MN: 13 }, concerns: ['pouvoir', 'securite'], pop: { ind: 3.3, cad: 20.0, pi: 15.5, pop: 23.7, ret: 19.7, sae: 18.0 } },
    { id: 'ara', name: 'Auvergne-Rhône-Alpes', profile: 'urbaine', seats: 64, pts: 7.4, ins: 5.56, abst: 25.6, blanc: 6.7, nuls: 2.2, start: { FI: 10.2, SM: 13.4, VP: 6.1, EM: 16.7, UG: 11.9, MN: 32 }, start22: { FI: 21.2, SM: 1.8, VP: 5.3, EM: 27.8, UG: 5.1, MN: 22.3 }, concerns: ['ecologie', 'emploi'], pop: { ind: 4.8, cad: 10.7, pi: 15.5, pop: 26.7, ret: 27.6, sae: 14.7 } },
    { id: 'hdf', name: 'Hauts-de-France', profile: 'industrielle', seats: 50, pts: 5.7, ins: 4.26, abst: 26.7, blanc: 5.2, nuls: 2.2, start: { FI: 9.6, SM: 9.7, VP: 3.6, EM: 15.1, UG: 8.4, MN: 43.1 }, start22: { FI: 19, SM: 1.3, VP: 3.1, EM: 25.4, UG: 3.5, MN: 33.3 }, concerns: ['emploi', 'pouvoir'], pop: { ind: 3.2, cad: 7.9, pi: 13.9, pop: 30.1, ret: 26.6, sae: 18.2 } },
    { id: 'naq', name: 'Nouvelle-Aquitaine', profile: 'rurale', seats: 49, pts: 5.9, ins: 4.46, abst: 24.2, blanc: 7.4, nuls: 3.1, start: { FI: 7.9, SM: 16.8, VP: 5.7, EM: 19.5, UG: 6.5, MN: 32.7 }, start22: { FI: 19.9, SM: 2.3, VP: 4.4, EM: 27.6, UG: 4.6, MN: 22.8 }, concerns: ['services', 'ecologie'], pop: { ind: 5.3, cad: 8.2, pi: 13.6, pop: 26.8, ret: 32.8, sae: 13.3 } },
    { id: 'occ', name: 'Occitanie', profile: 'rurale', seats: 49, pts: 5.8, ins: 4.32, abst: 24.8, blanc: 7.3, nuls: 3.1, start: { FI: 10.1, SM: 15.9, VP: 5.2, EM: 16.6, UG: 4.8, MN: 36.2 }, start22: { FI: 22.4, SM: 2.3, VP: 4.2, EM: 23.5, UG: 3.9, MN: 24.6 }, concerns: ['pouvoir', 'services'], pop: { ind: 5.4, cad: 9.4, pi: 13.9, pop: 24.9, ret: 30.4, sae: 16.0 } },
    { id: 'ges', name: 'Grand Est', profile: 'industrielle', seats: 49, pts: 5.1, ins: 3.86, abst: 26.3, blanc: 5.6, nuls: 1.9, start: { FI: 7.9, SM: 10.2, VP: 4.2, EM: 17.4, UG: 11.2, MN: 38.5 }, start22: { FI: 17.6, SM: 1.4, VP: 4, EM: 27.3, UG: 4.3, MN: 29.5 }, concerns: ['emploi', 'immigration'], pop: { ind: 3.7, cad: 8.0, pi: 14.2, pop: 29.9, ret: 28.5, sae: 15.6 } },
    { id: 'pac', name: "Provence-Alpes-Côte d'Azur", profile: 'urbaine', seats: 42, pts: 4.9, ins: 3.66, abst: 27.5, blanc: 5.9, nuls: 1.9, start: { FI: 10.2, SM: 10.5, VP: 4.8, EM: 15.8, UG: 6.8, MN: 41.6 }, start22: { FI: 19.8, SM: 1.1, VP: 4.1, EM: 23.3, UG: 4.4, MN: 27.6 }, concerns: ['securite', 'immigration'], pop: { ind: 5.1, cad: 9.4, pi: 13.9, pop: 24.9, ret: 29.8, sae: 16.9 } },
    { id: 'pdl', name: 'Pays de la Loire', profile: 'rurale', seats: 30, pts: 3.8, ins: 2.83, abst: 23.6, blanc: 6.7, nuls: 2.1, start: { FI: 7.7, SM: 15.6, VP: 6.8, EM: 23.2, UG: 8.7, MN: 28.7 }, start22: { FI: 19.2, SM: 2, VP: 6, EM: 33.3, UG: 5, MN: 20.8 }, concerns: ['ecologie', 'emploi'], pop: { ind: 4.4, cad: 9.1, pi: 14.6, pop: 28.9, ret: 30.3, sae: 12.8 } },
    { id: 'bre', name: 'Bretagne', profile: 'rurale', seats: 27, pts: 3.4, ins: 2.56, abst: 22.1, blanc: 7.2, nuls: 2.4, start: { FI: 7.6, SM: 17.4, VP: 6.8, EM: 24, UG: 7.2, MN: 26.7 }, start22: { FI: 20.6, SM: 2.2, VP: 6.2, EM: 32.8, UG: 4.7, MN: 19.5 }, concerns: ['ecologie', 'services'], pop: { ind: 4.7, cad: 8.6, pi: 14.1, pop: 27.0, ret: 32.2, sae: 13.5 } },
    { id: 'nor', name: 'Normandie', profile: 'historique', seats: 28, pts: 3.2, ins: 2.41, abst: 24.2, blanc: 6.4, nuls: 2.0, start: { FI: 8.1, SM: 13.1, VP: 4.4, EM: 19.6, UG: 8.6, MN: 35.8 }, start22: { FI: 18.8, SM: 1.7, VP: 4.1, EM: 29.3, UG: 4.5, MN: 27.1 }, concerns: ['emploi', 'services'], pop: { ind: 4.2, cad: 7.2, pi: 13.7, pop: 29.2, ret: 31.3, sae: 14.5 } },
    { id: 'bfc', name: 'Bourgogne-Franche-Comté', profile: 'historique', seats: 27, pts: 2.7, ins: 1.99, abst: 25.2, blanc: 6.9, nuls: 2.6, start: { FI: 7.9, SM: 12, VP: 4.5, EM: 17, UG: 10.1, MN: 38.5 }, start22: { FI: 18.6, SM: 1.8, VP: 4, EM: 26.3, UG: 5.1, MN: 27.4 }, concerns: ['services', 'pouvoir'], pop: { ind: 4.6, cad: 7.0, pi: 13.4, pop: 29.0, ret: 32.3, sae: 13.7 } },
    { id: 'cvl', name: 'Centre-Val de Loire', profile: 'historique', seats: 23, pts: 2.5, ins: 1.84, abst: 25.3, blanc: 6.5, nuls: 2.4, start: { FI: 7.9, SM: 12, VP: 4.1, EM: 20.5, UG: 8.4, MN: 36.3 }, start22: { FI: 18.7, SM: 1.7, VP: 4, EM: 28.5, UG: 5.3, MN: 25.9 }, concerns: ['services', 'securite'], pop: { ind: 4.1, cad: 8.0, pi: 14.1, pop: 28.4, ret: 31.9, sae: 13.5 } },
    { id: 'cor', name: 'Corse, outre-mer et Français de l\'étranger', profile: 'historique', seats: 42, pts: 4.8, ins: 3.63, abst: 54.5, blanc: 4.6, nuls: 2.9, start: { FI: 10.4, SM: 15.7, VP: 5.8, EM: 18.6, UG: 11.7, MN: 19.2 }, start22: { FI: 31.2, SM: 2, VP: 4.3, EM: 28.6, UG: 4.3, MN: 16.6 }, concerns: ['pouvoir', 'services'], pop: { ind: 4.9, cad: 5.6, pi: 12.7, pop: 29.4, ret: 21.9, sae: 25.4 } }
  ];

  /* v0.3 — Les thèmes de campagne.
     Impact d'un message = crédibilité du parti sur le thème (0, 1 ou 2)
                         + 1 si la région en fait une de ses 2 préoccupations
                         + 1 si le thème fait l'actualité ce tour. */
  /* v1.7 : scores de départ des 6 nouveaux partis. Simplification assumée (le détail régional officiel n'est pas repris) :
     score national × profil régional d'un parti proche.
     - Moyenne 2024 (européennes du 9 juin + 1er tour des législatives du 30 juin) : Grande Nostalgie ≈ (5,47 + 0,75) / 2 = 3,1 ;
       Parti Camarade ≈ 2,2 (2,36 aux européennes, part estimée dans le Nouveau Front populaire aux législatives) ;
       Lutte Prolétaire ≈ 0,7 (0,49 aux européennes, ≈ 1 aux législatives) ; Toujours Debout ≈ 0,2 (pas de liste aux européennes).
       Juste Milieu et Cap au Large : la liste et la coalition présidentielles (« En Mouvement ») sont partagées selon les députés
       élus en 2024 : environ 60 % En Mouvement, 21 % Juste Milieu, 19 % Cap au Large.
     - Présidentielle 2022 : Zemmour 7,07 ; Roussel 2,28 ; Dupont-Aignan 2,06 ; Arthaud 0,56 (résultats officiels) ;
       Juste Milieu et Cap au Large n'avaient pas de candidat (ils soutenaient le président sortant).
     Profils : Grande Nostalgie et Toujours Debout comme le Mouvement National, Parti Camarade et Lutte Prolétaire
     comme la France Indignée. Ces départs sont des ordres de grandeur de jeu. */
  (function extendStarts() {
    var e24 = { RQ: [3.1, 'MN'], PC: [2.2, 'FI'], LO: [0.7, 'FI'], DL: [0.2, 'MN'] };
    var p22 = { RQ: [7.07, 'MN'], PC: [2.28, 'FI'], LO: [0.56, 'FI'], DL: [2.06, 'MN'] };
    function nat(key, pid) {
      var n = 0, w = 0;
      REGIONS.forEach(function (r) { var ex = r.ins * (1 - r.abst / 100) * (1 - (r.blanc + r.nuls) / 100); w += ex; n += ex * (r[key][pid] || 0); });
      return n / w;
    }
    var natE = {}, natP = {};
    ['MN', 'FI'].forEach(function (p) { natE[p] = nat('start', p); natP[p] = nat('start22', p); });
    REGIONS.forEach(function (r) {
      Object.keys(e24).forEach(function (p) { var x = e24[p]; r.start[p] = Math.round(10 * r.start[x[1]] * x[0] / natE[x[1]]) / 10; });
      Object.keys(p22).forEach(function (p) { var x = p22[p]; r.start22[p] = Math.round(10 * r.start22[x[1]] * x[0] / natP[x[1]]) / 10; });
      var em = r.start.EM;
      r.start.EM = Math.round(10 * em * 0.60) / 10; r.start.MD = Math.round(10 * em * 0.21) / 10; r.start.HZ = Math.round(10 * em * 0.19) / 10;
      r.start22.MD = 0; r.start22.HZ = 0;
    });
  })();

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

  /* ---------- v0.7 : le programme ----------
     Chaque candidat choisit 5 mesures avant la campagne. La 1re est sa mesure phare.
     Crédibilité sur un thème = socle du parti + 1 par mesure sur ce thème (2 au plus).
     cost : coût en milliards d'euros (négatif = économies). choc : fait parler (+1 cube dans 2 régions… et +1 casserole). */
  var MEASURES = [
    { id: 'smic',            theme: 'pouvoir',     name: 'Smic à 1 600 € net',                       cost: 20 , fans: {pop: 2, sae: 1, ind: -1}, edu: { what: 'Le Smic est le salaire minimum légal en France. Il est revalorisé au moins une fois par an. Depuis juin 2026, il est de 1 478 € net par mois pour un temps plein.', pro: 'Plus de pouvoir d\'achat pour les bas salaires.', con: 'Un coût en plus pour les petites entreprises, qui peuvent embaucher moins.' } },
    { id: 'energie',         theme: 'pouvoir',     name: 'Blocage des prix de l\'énergie',            cost: 25 , fans: {pop: 1, ret: 1, ind: 1, sae: 1}, edu: { what: 'L\'État fixe un prix maximum pour l\'électricité ou le gaz et paie la différence aux fournisseurs.', pro: 'Protège les ménages et les entreprises des flambées de prix.', con: 'Très coûteux pour les finances publiques, et n\'incite pas à économiser l\'énergie.' } },
    { id: 'tva',             theme: 'pouvoir',     name: 'TVA réduite sur le carburant',              cost: 15 , fans: {pop: 1, ind: 1}, edu: { what: 'La TVA est un impôt payé sur presque tout ce qu\'on achète, dont le carburant.', pro: 'Baisse visible du prix à la pompe.', con: 'Moins de recettes pour l\'État, et la baisse profite aussi aux gros rouleurs.' } },
    { id: 'cheque',          theme: 'pouvoir',     name: 'Chèque alimentation',                       cost: 6 , fans: {sae: 2, pop: 1}, edu: { what: 'Une aide versée aux ménages modestes pour acheter de la nourriture.', pro: 'Cible ceux qui en ont le plus besoin.', con: 'Aide ponctuelle qui ne règle pas les causes de la hausse des prix.' } },
    { id: 'superprofits',    theme: 'pouvoir',     name: 'Taxe sur les superprofits',                 cost: -12 , fans: {pop: 1, sae: 1, cad: -1}, edu: { what: 'Un impôt exceptionnel sur les bénéfices jugés anormalement élevés de certaines entreprises. Depuis 2025, les très grandes entreprises paient déjà une contribution exceptionnelle sur leurs bénéfices, prolongée en 2026.', pro: 'Fait contribuer les entreprises qui profitent d\'une crise.', con: 'Difficile à définir, et peut faire fuir les investisseurs.' } },
    { id: 'reindus',         theme: 'emploi',      name: 'Grand plan de réindustrialisation',         cost: 30 , fans: {pop: 2, pi: 1}, edu: { what: 'Aider les usines à s\'installer ou revenir en France : subventions, formation, énergie.', pro: 'Recrée des emplois et rend le pays moins dépendant de l\'étranger.', con: 'Très cher, et les résultats prennent des années.' } },
    { id: 'pme',             theme: 'emploi',      name: 'Moins de charges pour les PME',             cost: 15 , fans: {ind: 2, cad: 2}, edu: { what: 'Les charges sociales sont des cotisations payées sur les salaires pour financer la protection sociale. Les baisses de charges déjà en place coûtent 77 milliards d\'euros par an (2024).', pro: 'Les entreprises peuvent embaucher et investir plus.', con: 'Moins de recettes pour la Sécurité sociale, à compenser ailleurs.' } },
    { id: 'semaine4',        theme: 'emploi',      name: 'Semaine de 4 jours',                        cost: 8 , fans: {pi: 1, cad: 1, pop: 1, ind: -1}, edu: { what: 'Travailler sur 4 jours au lieu de 5, à temps de travail réduit ou réorganisé.', pro: 'Plus de temps libre, moins de trajets, salariés plus motivés.', con: 'Difficile à organiser dans certains métiers (hôpitaux, commerces).' } },
    { id: 'apprentissage',   theme: 'emploi',      name: 'Apprentissage pour tous',                   cost: 4 , fans: {sae: 2, ind: 1}, edu: { what: 'L\'apprentissage alterne cours et travail en entreprise, avec un salaire.', pro: 'Facilite l\'accès des jeunes à un premier emploi.', con: 'Les aides aux entreprises ont un coût, et la qualité des formations varie.' } },
    { id: 'retraites',       theme: 'emploi',      name: 'Retraite à 65 ans',                         cost: -15, choc: true , fans: {ind: 1, cad: 1, pop: -2, pi: -1}, edu: { what: 'Reculer l\'âge légal auquel on peut partir à la retraite. La réforme de 2023 le fait passer de 62 à 64 ans, mais sa progression est suspendue jusqu\'en 2028.', pro: 'Équilibre les comptes des retraites, car on vit plus longtemps.', con: 'Pénalise ceux qui ont commencé tôt ou ont des métiers pénibles. Mesure souvent très contestée.' } },
    { id: 'medecins',        theme: 'services',    name: '10 000 médecins de plus',                   cost: 12 , fans: {ret: 2, pop: 1}, edu: { what: 'Former et installer plus de médecins, notamment dans les « déserts médicaux ».', pro: 'Réduit les délais pour se soigner.', con: 'Former un médecin prend une dizaine d\'années.' } },
    { id: 'lignes',          theme: 'services',    name: 'Rouvrir les petites lignes de train',       cost: 10 , fans: {ret: 1, sae: 1, pop: 1}, edu: { what: 'Rouvrir des lignes de train fermées dans les zones rurales.', pro: 'Désenclave les territoires et réduit l\'usage de la voiture.', con: 'Coûteux à remettre en état pour peu de voyageurs parfois.' } },
    { id: 'classes',         theme: 'services',    name: 'Classes de 20 élèves maximum',              cost: 10 , fans: {pi: 2, cad: 1}, edu: { what: 'Limiter le nombre d\'élèves par classe.', pro: 'Les élèves sont mieux suivis, surtout les plus fragiles.', con: 'Il faut recruter beaucoup d\'enseignants, et le métier attire peu.' } },
    { id: 'sp20',            theme: 'services',    name: 'Un service public à 20 min de chez soi',    cost: 15 , fans: {ret: 1, pop: 1, ind: 1}, edu: { what: 'Garantir à chacun une école, une poste, un médecin ou une gare à moins de 20 minutes. Aujourd\'hui, l\'État promet un espace France services à moins de 30 minutes de chez soi.', pro: 'Lutte contre le sentiment d\'abandon des campagnes.', con: 'Maintenir des services peu fréquentés coûte cher.' } },
    { id: 'nonremplacement', theme: 'services',    name: 'Un fonctionnaire sur deux non remplacé',    cost: -10, choc: true , fans: {ind: 1, cad: 1, pi: -2, pop: -1}, edu: { what: 'Ne remplacer qu\'un fonctionnaire sur deux qui part à la retraite.', pro: 'Réduit les dépenses de l\'État.', con: 'Risque de dégrader les services publics (écoles, hôpitaux).' } },
    { id: 'renovation',      theme: 'ecologie',    name: 'Rénover 1 million de logements',            cost: 18 , fans: {pop: 1, ind: 1, cad: 1}, edu: { what: 'Isoler les logements pour qu\'ils consomment moins d\'énergie.', pro: 'Baisse les factures et les émissions de CO₂.', con: 'Gros coût pour l\'État et les propriétaires, et pénurie d\'artisans.' } },
    { id: 'train1',          theme: 'ecologie',    name: 'Le train à 1 € pour les jeunes',            cost: 5 , fans: {sae: 2}, edu: { what: 'Un billet de train à prix symbolique pour les jeunes. En 2024, l\'État a testé un Pass Rail à 49 € par mois l\'été pour les 16-27 ans, illimité en TER et Intercités.', pro: 'Encourage le train plutôt que la voiture.', con: 'Manque à gagner pour la SNCF, à compenser par l\'État.' } },
    { id: 'jets',            theme: 'ecologie',    name: 'Taxe sur les jets privés',                  cost: -0.2 , fans: {pop: 1, sae: 1, cad: -1}, edu: { what: 'Un impôt sur les vols en avion privé, très polluants par passager. Depuis mars 2025, la taxe sur les billets d\'avion est bien plus forte pour les avions d\'affaires : de 210 à 2 100 € selon l\'appareil et la distance.', pro: 'Symbole de justice : les plus riches paient leur pollution.', con: 'Rapporte peu, et les vols peuvent partir de l\'étranger.' } },
    { id: 'plastique',       theme: 'ecologie',    name: 'Fin du plastique jetable',                  cost: 2 , fans: {cad: 1, sae: 1, ind: -1}, edu: { what: 'Interdire progressivement les emballages et objets en plastique à usage unique. La loi anti-gaspillage de 2020 en prévoit déjà la fin d\'ici 2040.', pro: 'Moins de déchets dans la nature et les océans.', con: 'Les entreprises doivent trouver des alternatives, parfois plus chères.' } },
    { id: 'policiers',       theme: 'securite',    name: '10 000 policiers de plus',                  cost: 1 , fans: {ret: 2, pop: 1}, edu: { what: 'Recruter et former davantage de policiers et gendarmes.', pro: 'Plus de présence sur le terrain.', con: 'Il faut aussi des locaux, du matériel, et des années de formation.' } },
    { id: 'proximite',       theme: 'securite',    name: 'Retour de la police de proximité',          cost: 5 , fans: {ret: 1, pop: 1, pi: 1}, edu: { what: 'Des policiers affectés à un quartier, qui connaissent ses habitants.', pro: 'Rétablit la confiance et prévient la délinquance.', con: 'Mobilise beaucoup d\'agents pour des résultats difficiles à mesurer.' } },
    { id: 'planchers',       theme: 'securite',    name: 'Peines planchers',                          cost: 1 , penal: true, fans: {ret: 1}, edu: { what: 'Une peine minimale obligatoire pour certains délits, surtout en cas de récidive.', pro: 'Rend la sanction plus certaine et dissuasive.', con: 'Limite la liberté du juge d\'adapter la peine à chaque cas. Créées en 2007, elles ont été supprimées par la loi du 15 août 2014.' } },
    { id: 'video',           theme: 'securite',    name: 'Caméras dans toutes les communes',          cost: 3 , fans: {ret: 1, ind: 1}, edu: { what: 'Installer des caméras de surveillance sur la voie publique.', pro: 'Aide à élucider des affaires et peut dissuader.', con: 'Efficacité discutée, et questions de vie privée.' } },
    { id: 'fraude',          theme: 'securite',    name: 'Chasse à la fraude sociale',                cost: -6 , fans: {ret: 1, ind: 1, cad: 1, sae: -2}, edu: { what: 'Renforcer les contrôles sur les aides sociales versées à tort. Pour les seules allocations familiales, la Cour des comptes estimait la fraude à 2,3 milliards d\'euros (2018).', pro: 'Les aides vont à ceux qui y ont droit.', con: 'La fraude aux cotisations des entreprises et le non-recours aux droits sont aussi importants.' } },
    { id: 'referendum',      theme: 'immigration', name: 'Référendum sur l\'immigration',             cost: 1 , fans: {ret: 1, pop: 1, cad: -1}, edu: { what: 'Faire voter directement les citoyens sur la politique d\'immigration.', pro: 'Donne la parole au peuple sur un sujet sensible.', con: 'L\'article 11 de la Constitution ne cite pas l\'immigration : la possibilité même de ce référendum fait débat.' } },
    { id: 'accueil',         theme: 'immigration', name: 'Accueil digne et intégration',              cost: 4 , fans: {pi: 1, cad: 1}, edu: { what: 'Mieux accueillir les étrangers en règle : cours de français, accès au travail, logement.', pro: 'Favorise l\'intégration et l\'emploi.', con: 'Coût pour l\'État, et crainte d\'un « appel d\'air ».' } },
    { id: 'controles',       theme: 'immigration', name: 'Contrôles renforcés aux frontières',        cost: 5 , fans: {ret: 1, pop: 1, ind: 1}, edu: { what: 'Plus de contrôles aux frontières de la France.', pro: 'Mieux lutter contre l\'immigration illégale et les trafics.', con: 'Dans l\'espace Schengen, les contrôles aux frontières intérieures sont en principe limités et temporaires.' } },
    { id: 'regroupement',    theme: 'immigration', name: 'Fin du regroupement familial',              cost: 0, choc: true , fans: {ret: 1, pi: -1}, edu: { what: 'Le regroupement familial permet à un étranger installé légalement en France depuis au moins 18 mois de faire venir sa famille.', pro: 'Réduit l\'immigration.', con: 'Ce droit est protégé par des textes européens et internationaux : le supprimer serait juridiquement très difficile.' } }
  ];


  /* v0.8 : mesures de financement (recettes ou économies), 3 au plus, en plus des 5 promesses.
     Les montants sont des ordres de grandeur pour le jeu. */
  var FUNDING = [
    { id: 'isf',          name: 'Rétablir un impôt sur la fortune',            cost: -4,  fans: { cad: -1, ind: -1, pop: 1 },
      edu: { what: 'Un impôt annuel sur le patrimoine des ménages les plus riches. L\'ancien ISF a été remplacé en 2018 par un impôt sur la seule fortune immobilière.', pro: 'Fait contribuer les plus gros patrimoines.', con: 'Risque de départ de contribuables fortunés et d\'investissements à l\'étranger.' } },
    { id: 'heritage',     name: 'Taxer davantage les gros héritages',          cost: -6,  fans: { ret: -1, ind: -1, pop: 1 },
      edu: { what: 'Augmenter les droits de succession sur les héritages les plus importants. Aujourd\'hui, chaque enfant hérite de 100 000 € sans payer de droits, puis le taux monte de 5 à 45 %.', pro: 'Limite la transmission des inégalités d\'une génération à l\'autre.', con: 'Impôt très impopulaire, et difficile pour la transmission des entreprises familiales.' } },
    { id: 'niches',       name: 'Supprimer des niches fiscales',               cost: -10, fans: { cad: -2, ind: -1 },
      edu: { what: 'Les niches fiscales sont des réductions d\'impôt accordées pour encourager certains comportements (emploi à domicile, investissements…). Elles représentaient environ 92 milliards d\'euros en 2025.', pro: 'Rapporte beaucoup et simplifie l\'impôt.', con: 'Chaque niche a ses défenseurs, et certaines soutiennent des emplois.' } },
    { id: 'fraudefisc',   name: 'Renforcer la lutte contre la fraude fiscale', cost: -5,  fans: { pop: 1, sae: 1 },
      edu: { what: 'Plus de contrôleurs et d\'outils pour récupérer les impôts que certains ne paient pas. En 2025, le contrôle fiscal a réclamé 17 milliards d\'euros.', pro: 'Personne ne s\'y oppose sur le principe.', con: 'Les sommes vraiment récupérées sont incertaines et prennent du temps.' } },
    { id: 'tvaplus',      name: 'Hausse d\'un point de TVA',                   cost: -8,  fans: { pop: -2, ret: -1, sae: -1 },
      edu: { what: 'La TVA est payée par tous sur ce qu\'ils achètent : une hausse rapporte beaucoup.', pro: 'Recette rapide et sûre, qui touche aussi les produits importés.', con: 'Pèse plus lourd, en proportion, sur les ménages modestes.' } },
    { id: 'csg',          name: 'Hausse de la CSG des retraités aisés',        cost: -4,  fans: { ret: -2 },
      edu: { what: 'La CSG est une contribution prélevée sur presque tous les revenus, y compris les pensions.', pro: 'Les retraités aisés ont souvent un niveau de vie élevé.', con: 'Les retraités vivent cette hausse comme une injustice après une vie de travail.' } },
    { id: 'gelpensions',  name: 'Geler les pensions de retraite un an',        cost: -4,  fans: { ret: -2 },
      edu: { what: 'Ne pas augmenter les pensions avec l\'inflation pendant un an. Proposé pour 2026, le gel a été retiré par les députés : les pensions ont augmenté de 0,9 %.', pro: 'Économie importante et immédiate.', con: 'Les retraités perdent du pouvoir d\'achat, surtout les plus modestes.' } },
    { id: 'gelpoint',     name: 'Geler le salaire des fonctionnaires',         cost: -3,  fans: { pi: -2 },
      edu: { what: 'Ne pas revaloriser le « point d\'indice » qui sert à calculer le salaire des agents publics. Il vaut 4,92 € par mois depuis juillet 2023.', pro: 'Économie simple à mettre en œuvre.', con: 'Rend les métiers publics (enseignants, soignants) moins attractifs.' } },
    { id: 'chomage',      name: 'Durcir l\'assurance chômage',                 cost: -3,  fans: { sae: -2, pop: -1, ind: 1 },
      edu: { what: 'Réduire la durée ou le montant des allocations chômage.', pro: 'Incite à reprendre un emploi plus vite et fait des économies.', con: 'Fragilise les personnes qui perdent leur emploi.' } },
    { id: 'trainvie',     name: 'Économies sur le train de vie de l\'État',    cost: -5,  fans: { pi: -1, ind: 1, cad: 1 },
      edu: { what: 'Réduire les dépenses de fonctionnement : bâtiments, voitures, agences et organismes publics.', pro: 'Populaire, et montre l\'exemple.', con: 'Les vraies économies sont souvent plus faibles qu\'annoncé.' } },
    /* v3.4 : vingt nouvelles lois de recettes, proposables pendant le quinquennat (camp : qui les soutient à l'Assemblée, voir govern.js) */
    { id: 'executive_pay_tax', name: 'Contribution sur les très hauts salaires', cost: -1.5, fans: { pop: 1, sae: 1, cad: -2 }, camp: 'gauche',
      edu: { what: 'Une contribution en plus sur la part des rémunérations qui dépasse 1 million d\'euros par an, bonus et primes exceptionnelles compris.', pro: 'Fait contribuer les très hauts revenus sans toucher les classes moyennes.', con: 'Les grands groupes peuvent payer leurs dirigeants autrement, ou à l\'étranger.' } },
    { id: 'bank_balance_tax', name: 'Taxe sur les bilans bancaires', cost: -1, fans: { pop: 1, cad: -1, ind: -1 }, camp: 'gauche',
      edu: { what: 'Une contribution annuelle sur une partie des actifs des grandes banques, en excluant les crédits aux PME et à l\'industrie.', pro: 'Les grandes banques dégagent des bénéfices élevés et profitent de la garantie implicite de l\'État.', con: 'Risque de crédit un peu plus cher pour les ménages et les entreprises.' } },
    { id: 'large_life_insurance', name: 'Contribution sur les très grandes assurances-vie', cost: -1.5, fans: { pop: 1, cad: -1, ret: -1 }, camp: 'gauche',
      edu: { what: 'Une taxe annuelle sur la part des contrats d\'assurance-vie qui dépasse plusieurs centaines de milliers d\'euros. L\'assurance-vie est le placement préféré des Français.', pro: 'Ne touche que les très gros contrats, souvent détenus par les ménages les plus aisés.', con: 'L\'épargne peut partir vers d\'autres placements, et les retraités aisés s\'estiment visés.' } },
    { id: 'data_tax', name: 'Taxe sur l’exploitation commerciale des données', cost: -0.8, fans: { pop: 1, sae: 1, cad: -1 }, camp: 'souverain',
      edu: { what: 'Une taxe sur les revenus que les grandes plateformes tirent de la revente et de l\'exploitation des données des utilisateurs français.', pro: 'Les géants du numérique paient peu d\'impôts en France au regard de leur activité.', con: 'Difficile à calculer, et les plateformes peuvent répercuter la taxe sur leurs clients.' } },
    { id: 'digital_ads_tax', name: 'Taxe sur la publicité numérique', cost: -1, fans: { pop: 1, cad: -1 }, camp: 'souverain',
      edu: { what: 'Une taxe sur les recettes de publicité en ligne réalisées auprès du public français.', pro: 'Rééquilibre la concurrence avec la presse et la télévision, déjà taxées.', con: 'Le secteur numérique et les médias commerciaux s\'y opposent, et le coût peut retomber sur les annonceurs.' } },
    { id: 'crypto_tax', name: 'Taxe sur les conversions de cryptomonnaies', cost: -0.5, fans: { pop: 1, cad: -1 }, camp: 'optimisation',
      edu: { what: 'Une petite taxe sur chaque conversion de cryptomonnaies en euros ou en devises. Les transferts entre portefeuilles d\'une même personne restent exonérés.', pro: 'Fait contribuer un secteur spéculatif encore peu taxé.', con: 'Risque de fuite vers des plateformes étrangères, difficiles à contrôler.' } },
    { id: 'luxury_vat', name: 'TVA de luxe ciblée', cost: -1.5, fans: { pop: 1, sae: 1, cad: -1 }, camp: 'gauche',
      edu: { what: 'Un taux de TVA renforcé sur les voitures, bijoux, montres, bateaux et autres biens de très grande valeur.', pro: 'Ne touche presque pas la consommation populaire.', con: 'Les achats de luxe peuvent se faire à l\'étranger, et le droit européen encadre les taux de TVA.' } },
    { id: 'luxury_homes_tax', name: 'Taxe sur les résidences secondaires de luxe', cost: -1.5, fans: { pop: 1, cad: -1, ret: -1 }, camp: 'gauche',
      edu: { what: 'Une taxe annuelle sur les résidences secondaires qui valent plusieurs millions d\'euros, surtout dans les zones touristiques où le logement manque.', pro: 'Peut pousser les propriétaires à louer à l\'année.', con: 'Les propriétaires, souvent des retraités aisés, s\'estiment déjà assez taxés.' } },
    { id: 'vacant_offices', name: 'Taxe sur les bureaux vacants', cost: -1, fans: { pop: 1, cad: -1 }, camp: 'gauche',
      edu: { what: 'Une taxe qui augmente chaque année sur les bureaux laissés vides. Elle disparaît si les locaux sont transformés en logements.', pro: 'Encourage à transformer des bureaux vides en logements.', con: 'Les propriétaires de bureaux et les investisseurs s\'y opposent.' } },
    { id: 'concession_rent', name: 'Contribution sur les concessions autoroutières et aéroportuaires', cost: -1.5, fans: { pop: 1, cad: -1 }, camp: 'souverain',
      edu: { what: 'Une contribution sur les bénéfices exceptionnels des concessions d\'autoroutes, d\'aéroports, de ports et de parkings.', pro: 'Les péages et redevances sont payés par tous, alors que les profits des concessionnaires sont jugés très élevés.', con: 'Risque de procès avec les concessionnaires, protégés par leurs contrats.' } },
    { id: 'flight_frequency_tax', name: 'Taxe sur les grands voyageurs aériens', cost: -1, fans: { pop: 1, sae: 1, cad: -1 }, camp: 'eco',
      edu: { what: 'Une contribution qui augmente à partir du cinquième aller-retour en avion dans l\'année, pour chaque voyageur.', pro: 'Vise les trajets très fréquents, souvent des personnes aisées, et réduit les émissions de CO2.', con: 'Pénalise les déplacements professionnels et les familles éloignées, et reste complexe à suivre.' } },
    { id: 'carbon_imports', name: 'Contribution sur les importations très carbonées', cost: -2, fans: { pop: 1, ind: -1 }, camp: 'souverain',
      edu: { what: 'Une taxe sur les importations d\'acier, de ciment, d\'aluminium, d\'engrais et de produits chimiques fabriqués avec beaucoup de CO2.', pro: 'Protège l\'industrie française qui pollue moins, et pousse les pays exportateurs à décarboner.', con: 'Rend certains matériaux plus chers et peut créer des tensions commerciales.' } },
    { id: 'nonrecyclable_packaging', name: 'Taxe sur les emballages non recyclables', cost: -1.5, fans: { pop: 1, ind: -1 }, camp: 'eco',
      edu: { what: 'Une contribution par emballage non recyclable, plus élevée selon son poids et la difficulté à le traiter.', pro: 'Pousse les industriels vers des emballages recyclables.', con: 'Le rendement baisse à mesure que les emballages changent, et le coût peut se retrouver dans les prix.' } },
    { id: 'land_artificialisation', name: 'Taxe sur l’artificialisation des sols', cost: -1.2, fans: { pop: 1, ind: -1 }, camp: 'eco',
      edu: { what: 'Un prélèvement sur la plus-value réalisée quand des terres agricoles ou naturelles deviennent des zones commerciales ou industrielles.', pro: 'Freine le bétonnage et finance la protection des sols.', con: 'Peut ralentir des projets d\'usines ou de logements.' } },
    { id: 'unused_buildable_land', name: 'Taxe sur les terrains constructibles non bâtis', cost: -2, fans: { pop: 1, cad: -1, ret: -1 }, camp: 'gauche',
      edu: { what: 'Une taxe qui augmente chaque année sur les terrains constructibles gardés vides dans les zones où le logement manque.', pro: 'Libère des terrains pour construire des logements.', con: 'Forte opposition des propriétaires, parfois de simples familles qui gardent un terrain.' } },
    { id: 'aid_clawback', name: 'Récupération des aides publiques indues', cost: -1.2, fans: { pop: 1, sae: 1, ind: 1, cad: -1 }, camp: 'souverain',
      edu: { what: 'Le remboursement automatique d\'une partie des aides publiques quand une entreprise délocalise, ferme un site aidé ou licencie malgré ses engagements.', pro: 'Rend les aides publiques plus justes et plus crédibles.', con: 'Demande des contrôles administratifs, et peut décourager certains investissements.' } },
    { id: 'dormant_patents', name: 'Impôt sur les brevets dormants', cost: -0.4, fans: { ind: 1, cad: -1 }, camp: 'optimisation',
      edu: { what: 'Une contribution sur les brevets gardés plusieurs années sans être exploités, sauf recherche réelle en cours.', pro: 'Pousse les entreprises à exploiter leurs inventions ou à les céder.', con: 'Peut pénaliser les recherches longues, par exemple en santé.' } },
    { id: 'intragroup_debt', name: 'Limiter la déduction des intérêts intragroupe', cost: -2, fans: { pop: 1, sae: 1, cad: -1 }, camp: 'optimisation',
      edu: { what: 'Limiter la déduction fiscale des intérêts quand une filiale française est très endettée auprès de son propre groupe, une technique pour déplacer les bénéfices.', pro: 'S\'attaque à l\'optimisation fiscale des multinationales.', con: 'Les multinationales s\'y opposent et peuvent réduire leurs investissements en France.' } },
    { id: 'carried_interest', name: 'Taxer davantage le « carried interest »', cost: -1, fans: { pop: 1, sae: 1, cad: -1 }, camp: 'gauche',
      edu: { what: 'Imposer comme un salaire les gains des gestionnaires de fonds quand ils ne correspondent pas à un vrai investissement à risque.', pro: 'Supprime un avantage fiscal réservé à quelques professionnels de la finance.', con: 'Risque de voir des sociétés de gestion partir à Londres, au Luxembourg ou ailleurs.' } },
    { id: 'cir_cut', name: 'Réduire le crédit d\'impôt recherche des grandes entreprises', cost: -2, fans: { pop: 1, cad: -1, pi: -1 }, camp: 'gauche',
      edu: { what: 'Le crédit d\'impôt recherche rembourse aux entreprises 30 % de leurs dépenses de recherche. Il coûte environ 7 milliards d\'euros par an, dont une large part va aux grands groupes. La loi réduit le taux pour les grandes entreprises, en épargnant les PME.', pro: 'Plusieurs évaluations publiques doutent de son effet sur la recherche des grands groupes : une partie serait un effet d\'aubaine.', con: 'Risque de voir des laboratoires privés partir à l\'étranger, et des emplois de chercheurs menacés.' } },
    { id: 'pay_gap_tax', name: 'Contribution sur les écarts de rémunération', cost: -1, fans: { pop: 1, sae: 1, cad: -1 }, camp: 'gauche',
      edu: { what: 'Une contribution pour les entreprises où le salaire du dirigeant dépasse de très loin celui des salariés.', pro: 'Peut encourager à augmenter les bas salaires.', con: 'Il faut un calcul fiable de l\'écart, et les grandes entreprises s\'y opposent.' } }
  ];

  /* ---------- v1.2 : « En vrai » et sources officielles ----------
     src  : sources d'État ou d'institutions publiques (vérifiées par test/check-sources.js).
            expect = un mot que la page doit contenir, pour vérifier qu'elle parle bien du sujet.
     vrai : qui défend une mesure proche pour 2027, d'après le comparateur REFERENCE_2027
            (un site pédagogique, pas une source officielle : à revérifier quand la campagne avance). */
  var REFERENCE_2027 = { label: 'Comprendre la Politique — comparateur des programmes 2027', url: 'https://www.comprendrelapolitique.fr/programme-2027.html',
    updated: '2026-10-16', checked: '2026-10-24', official: false };

  var OFFICIAL = {
    smic:            { src: [{ label: 'Le Smic augmente au 1er juin 2026 (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A18916', expect: 'Smic' }],
                       vrai: 'Un Smic plus haut est proposé par LFI (1 600 € net), le PS et Place publique (1 500 € net) et le PCF (1 700 € brut).' },
    energie:         { src: [{ label: 'Les mesures exceptionnelles contre la hausse des prix de l\'énergie (Cour des comptes)', url: 'https://www.ccomptes.fr/fr/publications/les-mesures-exceptionnelles-de-lutte-contre-la-hausse-des-prix-de-lenergie', expect: 'énergie' }],
                       vrai: 'LFI propose de bloquer les prix des produits de première nécessité, énergie comprise.' },
    tva:             { src: [{ label: 'La fiscalité des énergies (ministère de la Transition écologique)', url: 'https://www.ecologie.gouv.fr/politiques-publiques/fiscalite-energies', expect: 'fiscalité' }],
                       vrai: 'Le RN propose de baisser la TVA de 20 % à 5,5 % sur les carburants, le gaz et l\'électricité.' },
    cheque:          { src: [{ label: 'L\'aide alimentaire (ministère des Solidarités)', url: 'https://solidarites.gouv.fr/alimentation', expect: 'aliment' }],
                       vrai: 'Aucun des 12 grands candidats ne la propose telle quelle.' },
    superprofits:    { src: [{ label: 'Loi de finances 2026 : ce qui change pour les entreprises (ministère de l\'Économie)', url: 'https://www.economie.gouv.fr/entreprises/gerer-sa-fiscalite-et-ses-impots/loi-de-finances-2026-ce-qui-change-pour-les-entreprises', expect: 'contribution exceptionnelle' }],
                       vrai: 'Le PS et Place publique veulent taxer les superprofits des multinationales, l\'UPR ceux des pétroliers ; Renaissance l\'évoque.' },
    reindus:         { src: [{ label: 'France 2030, le plan d\'investissement de l\'État (ministère de l\'Économie)', url: 'https://www.economie.gouv.fr/france-2030', expect: 'France 2030' }],
                       vrai: 'Presque tous en parlent : Renaissance vise 1 million d\'emplois industriels, le RN mise sur le patriotisme économique, le PS, Place publique et les Écologistes sur l\'industrie verte.' },
    pme:             { src: [{ label: 'Maîtriser la dynamique des allègements de cotisations (Cour des comptes, 2025)', url: 'https://www.ccomptes.fr/sites/default/files/2025-05/20250526-RALFSS-2025-Maitriser-dynamique-allegements-generaux-de-cotisations-sociales.pdf' }],
                       vrai: 'Baisser les charges ou les impôts des entreprises : Horizons, Renaissance, LR et Nouvelle Énergie.' },
    semaine4:        { src: [{ label: 'Rapport de la mission d\'information sur la semaine de quatre jours (Vie-publique.fr)', url: 'https://www.vie-publique.fr/rapport/297063-rapport-de-la-mission-dinformation-sur-la-semaine-de-quatre-jours', expect: 'quatre jours' }],
                       vrai: 'Proche : la semaine de 32 heures, défendue par le PCF, les Écologistes, le PS et Place publique.' },
    apprentissage:   { src: [{ label: 'Aides à l\'embauche en contrat d\'apprentissage (Service-Public.fr)', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F23556', expect: 'apprenti' }],
                       vrai: 'Horizons veut l\'apprentissage dès 15 ans, Renaissance l\'alternance dès 14 ans.' },
    retraites:       { src: [{ label: 'Suspension de la réforme des retraites : qui est concerné ? (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A18825', expect: 'retraite' }],
                       vrai: '65 ans : Horizons. Rester à 64 ans : Renaissance et LR. Revenir à 62 ou 60 ans : LFI, PCF, PS, Écologistes, Debout la France ; le RN et Reconquête pour les carrières longues.' },
    medecins:        { src: [{ label: 'Combien de médecins à l\'horizon 2050 ? (Drees, ministère de la Santé)', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse/medecins-sages-femmes-chirurgiens-dentistes-et-pharmaciens-combien-de', expect: 'médecins' }],
                       vrai: 'LFI veut 10 000 médecins dans les déserts médicaux, Horizons former 30 % de médecins en plus, Renaissance recruter des médecins diplômés à l\'étranger.' },
    lignes:          { src: [{ label: 'Situation de la SNCF : les lignes de desserte fine du territoire (Sénat, 2022)', url: 'https://www.senat.fr/rap/r21-570/r21-57010.html', expect: 'petites lignes' }],
                       vrai: 'Pas de proposition précise relevée chez les 12 grands candidats.' },
    classes:         { src: [{ label: 'La réduction de la taille des classes en éducation prioritaire (DEPP, ministère de l\'Éducation)', url: 'https://www.education.gouv.fr/sites/default/files/document/r-duction-de-la-taille-de-classe-en-ducation-prioritaire-que-nous-apprennent-les-donn-es-de-la-depp--478949.pdf' }],
                       vrai: 'LFI et le PCF proposent des classes de 20 élèves au plus.' },
    sp20:            { src: [{ label: 'France services, à moins de 30 minutes de chez vous', url: 'https://www.france-services.gouv.fr/moins-de-30-minutes-de-chez-vous', expect: 'France services' }],
                       vrai: 'Pas de proposition précise relevée chez les 12 grands candidats.' },
    nonremplacement: { src: [{ label: 'Bilan de la révision générale des politiques publiques, 2012 (Vie-publique.fr)', url: 'https://www.vie-publique.fr/files/rapport/pdf/124000520.pdf' }],
                       vrai: 'Horizons propose de ne pas remplacer un fonctionnaire sur trois.' },
    renovation:      { src: [{ label: 'MaPrimeRénov\', l\'aide à la rénovation énergétique (France Rénov\')', url: 'https://france-renov.gouv.fr/aides/maprimerenov', expect: 'MaPrimeRénov' }],
                       vrai: 'LFI et Renaissance visent 700 000 logements rénovés par an ; le PS, Place publique, le PCF et les Écologistes en font aussi une priorité.' },
    train1:          { src: [{ label: 'Avec le Pass Rail, voyagez en France de façon illimitée (Gouvernement, 2024)', url: 'https://www.info.gouv.fr/actualite/avec-le-pass-rail-voyagez-en-france-de-facon-illimitee', expect: 'Pass Rail' }],
                       vrai: 'Pas de proposition précise relevée chez les 12 grands candidats.' },
    jets:            { src: [{ label: 'Ce qui change pour les particuliers avec le budget 2025 (ministère de l\'Économie)', url: 'https://www.economie.gouv.fr/cedef/mesures-fiscales-2025', expect: 'aéronef' }],
                       vrai: 'Pas de proposition précise relevée chez les 12 grands candidats.' },
    plastique:       { src: [{ label: 'La loi anti-gaspillage pour une économie circulaire (ministère de la Transition écologique)', url: 'https://www.ecologie.gouv.fr/loi-anti-gaspillage-economie-circulaire', expect: 'plastique' }],
                       vrai: 'Pas de proposition précise relevée chez les 12 grands candidats.' },
    policiers:       { src: [{ label: 'Les forces de sécurité intérieure (Cour des comptes, 2023)', url: 'https://www.ccomptes.fr/system/files/2023-07/20230707-note-thematique-Forces-securite-interieure.pdf' }],
                       vrai: 'Horizons et Debout la France proposent 10 000 policiers de plus, Renaissance 3 000 policiers et gendarmes.' },
    proximite:       { src: [{ label: 'La police de sécurité du quotidien (ministère de l\'Intérieur)', url: 'https://www.interieur.gouv.fr/actualites/grands-dossiers/police-de-securite-du-quotidien', expect: 'quotidien' }],
                       vrai: 'Une police de proximité est défendue par LFI, le PCF, le PS, Place publique, les Écologistes, Renaissance et Horizons.' },
    planchers:       { src: [{ label: 'Loi du 15 août 2014 sur l\'individualisation des peines (Vie-publique.fr)', url: 'https://www.vie-publique.fr/dossierlegislatif/JORFDOLE000028050843', expect: 'peines' }],
                       vrai: 'Le RN, LR, Debout la France et Reconquête veulent rétablir les peines planchers.' },
    video:           { src: [{ label: 'Caméras de surveillance sur la voie publique (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2517', expect: 'caméra' },
                             { label: 'Les polices municipales (Cour des comptes, 2020)', url: 'https://www.vie-publique.fr/en-bref/276919-la-cour-des-comptes-appelle-mieux-encadrer-les-polices-municipales', expect: 'polices municipales' }],
                       vrai: 'Horizons propose de doubler les caméras dans les zones sensibles.' },
    fraude:          { src: [{ label: 'La lutte contre les fraudes aux prestations sociales (Cour des comptes, 2020)', url: 'https://www.vie-publique.fr/sites/default/files/rapport/pdf/276085.pdf' }],
                       vrai: 'Pas de proposition précise relevée chez les 12 grands candidats.' },
    referendum:      { src: [{ label: 'Dans quel cas convoque-t-on un référendum ? (Conseil constitutionnel)', url: 'https://www.conseil-constitutionnel.fr/la-constitution/dans-quel-cas-convoque-t-on-un-referendum', expect: 'référendum' }],
                       vrai: 'Le RN, Debout la France et l\'UPR proposent un référendum sur l\'immigration.' },
    accueil:         { src: [{ label: 'Le contrat d\'intégration républicaine (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F17048', expect: 'intégration' }],
                       vrai: 'Le PS et Place publique défendent un accueil digne, Renaissance l\'intégration par le travail et la langue, LFI la régularisation par le travail.' },
    controles:       { src: [{ label: 'Le rétablissement du contrôle aux frontières intérieures (Conseil d\'État)', url: 'https://www.conseil-etat.fr/actualites/le-retablissement-du-controle-aux-frontieres-interieures-est-conforme-au-nouveau-reglement-schengen', expect: 'frontières' }],
                       vrai: 'Debout la France et Reconquête veulent rétablir les frontières nationales, l\'UPR sortir de Schengen ; Renaissance renforcer les frontières extérieures de l\'UE. Le PS et Place publique s\'y opposent.' },
    regroupement:    { src: [{ label: 'Le regroupement familial (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F11166', expect: 'regroupement familial' }],
                       vrai: 'Le RN veut y mettre fin ; LR et Debout la France veulent supprimer le regroupement « élargi » ; Horizons durcir ses conditions.' },
    isf:             { src: [{ label: 'L\'impôt sur la fortune immobilière (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F563', expect: 'fortune immobilière' }],
                       vrai: 'LFI, le PCF, les Écologistes, le PS et Place publique veulent rétablir un ISF. Horizons s\'y oppose.' },
    heritage:        { src: [{ label: 'Droits de succession : évaluation et calcul (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F14198', expect: 'succession' }],
                       vrai: 'LFI et les Écologistes veulent taxer davantage les très gros héritages ; le RN, LR et Reconquête, au contraire, alléger ou supprimer les droits en ligne directe.' },
    niches:          { src: [{ label: 'Les dépenses fiscales en 2025 (Cour des comptes, avril 2026)', url: 'https://www.ccomptes.fr/sites/default/files/2026-04/NEB-2026-Depenses-fiscales.pdf' }],
                       vrai: 'Horizons veut revoir les niches coûteuses, le PS et Place publique supprimer celles des énergies fossiles.' },
    fraudefisc:      { src: [{ label: 'Lutte contre la fraude : le contrôle fiscal en 2025 (ministère de l\'Économie)', url: 'https://www.economie.gouv.fr/actualites/lutte-contre-la-fraude-un-controle-fiscal-toujours-plus-efficace-en-2025', expect: 'fraude' }],
                       vrai: 'Pas de proposition précise relevée chez les 12 grands candidats.' },
    tvaplus:         { src: [{ label: 'TVA : quels sont les taux de votre quotidien ? (ministère de l\'Économie)', url: 'https://www.economie.gouv.fr/particuliers/impots-et-fiscalite/gerer-mes-autres-impots-et-taxes/tva-quels-sont-les-taux-de-votre-quotidien', expect: 'TVA' }],
                       vrai: 'Aucun grand candidat ne la propose : Renaissance, Horizons et LR promettent même de ne pas augmenter les impôts des ménages.' },
    csg:             { src: [{ label: 'CSG et CRDS sur les revenus d\'activité et de remplacement (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2971', expect: 'CSG' }],
                       vrai: 'Pas de proposition précise relevée chez les 12 grands candidats.' },
    gelpensions:     { src: [{ label: 'Retraites de base : la revalorisation au 1er janvier 2026 (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A17919', expect: 'pension' }],
                       vrai: 'Aucun grand candidat ne le propose ; le RN veut au contraire réindexer les retraites sur l\'inflation.' },
    gelpoint:        { src: [{ label: 'Connaître le point d\'indice (ministère de la Fonction publique)', url: 'https://www.fonction-publique.gouv.fr/etre-agent-public/ma-remuneration/connaitre-le-point-dindice', expect: 'point d' }],
                       vrai: 'Pas de proposition précise relevée chez les 12 grands candidats.' },
    chomage:         { src: [{ label: 'L\'allocation chômage (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F38881', expect: 'chômage' }],
                       vrai: 'Horizons veut limiter l\'indemnisation à 12 mois pour les moins de 50 ans ; Renaissance une réforme pour inciter au retour à l\'emploi.' },
    trainvie:        { src: [{ label: 'Rationaliser les interventions des opérateurs de l\'État (inspections générales, 2025)', url: 'https://www.vie-publique.fr/files/rapport/pdf/299832.pdf' }],
                       vrai: 'LR vise 60 Md€ de dépenses publiques en moins, Renaissance 20 Md€ de dépenses de l\'État en moins.' },
    executive_pay_tax: { src: [{ label: 'La contribution exceptionnelle sur les hauts revenus (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31130', expect: 'hauts revenus' }],
                       vrai: 'Une contribution exceptionnelle sur les hauts revenus existe depuis 2012 (3 à 4 % au-delà de 250 000 € de revenu fiscal). Une contribution ciblée sur les salaires de plus de 1 M€ est une proposition de jeu inspirée de plusieurs débats.' },
    bank_balance_tax: { src: [{ label: 'Taxe de risque systémique et taxe sur le secteur bancaire (BOFiP, impots.gouv.fr)', url: 'https://bofip.impots.gouv.fr/bofip/9792-PGP.html/identifiant=ACTU-2015-00075' }],
                       vrai: 'Une « taxe de risque systémique » a frappé les grandes banques françaises de 2011 à 2019, avant d\'être remplacée par les contributions européennes au fonds de résolution unique. Le dispositif du jeu est une proposition inspirée de ce modèle.' },
    large_life_insurance: { src: [{ label: 'Comment sont imposés les revenus d\'un contrat d\'assurance-vie ? (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F22414', expect: 'assurance' }],
                       vrai: 'Aujourd\'hui, l\'assurance-vie est taxée sur ses gains au moment du retrait, pas sur l\'encours. Une taxe annuelle sur les très gros contrats est une proposition de jeu ; aucun dispositif identique n\'existe en France.' },
    data_tax:        { src: [{ label: 'Suis-je redevable de la taxe sur les services numériques ? (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/international-professionnel/questions/suis-je-redevable-de-la-taxe-sur-les-services-fournis-par-les', expect: 'numérique' }],
                       vrai: 'Depuis 2019, une taxe de 3 % frappe certains services des grandes entreprises du numérique, dont la vente de données à des fins publicitaires. Une taxe spécifique sur l\'exploitation des données irait plus loin : proposition de jeu.' },
    digital_ads_tax: { src: [{ label: 'Taxe sur les services numériques : calcul du montant à payer (BOFiP, impots.gouv.fr)', url: 'https://bofip.impots.gouv.fr/bofip/12213-PGP.html/identifiant=BOI-TCA-TSN-20-20220518' }],
                       vrai: 'La taxe sur les services numériques (3 % depuis 2019) touche déjà la publicité ciblée des plus grands groupes. Une hausse ou un élargissement est régulièrement débattu au Parlement.' },
    crypto_tax:      { src: [{ label: 'Investissement dans les cryptomonnaies : ce qu\'il faut savoir (ministère de l\'Économie)', url: 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/investissement-dans-les-cryptomonnaies-ce-quil-faut-savoir', expect: 'crypto' }],
                       vrai: 'Aujourd\'hui, seules les plus-values de cession sont imposées (flat tax de 30 %). Une taxe sur chaque conversion est une proposition de jeu ; aucun dispositif identique n\'existe en France.' },
    luxury_vat:      { src: [{ label: 'TVA : quels sont les taux de votre quotidien ? (ministère de l\'Économie)', url: 'https://www.economie.gouv.fr/particuliers/impots-et-fiscalite/gerer-mes-autres-impots-et-taxes/tva-quels-sont-les-taux-de-votre-quotidien', expect: 'TVA' }],
                       vrai: 'La France a connu un taux de TVA « majoré » de 33,33 % sur les produits de luxe jusqu\'en 1992. Le droit européen limite aujourd\'hui le nombre de taux : proposition de jeu.' },
    luxury_homes_tax: { src: [{ label: 'Taxe d\'habitation sur les résidences secondaires (Service-Public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F42', expect: 'résidence' }],
                       vrai: 'Les résidences secondaires paient toujours la taxe d\'habitation, et les communes en zone tendue peuvent la majorer jusqu\'à 60 %. Une taxe nationale sur les biens de luxe est une proposition de jeu.' },
    vacant_offices:  { src: [{ label: 'Taxe annuelle sur les bureaux en Île-de-France (Service-Public.fr)', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F20668', expect: 'bureaux' }],
                       vrai: 'Une taxe annuelle sur les bureaux existe déjà en Île-de-France (et dans quelques départements), qu\'ils soient occupés ou non. Une taxe ciblée sur la vacance est une proposition de jeu.' },
    concession_rent: { src: [{ label: 'Concessions autoroutières : des profits futurs à partager équitablement (Sénat, rapport 2020)', url: 'https://www.senat.fr/notice-rapport/2019/r19-709-1-notice.html', expect: 'autorout' }],
                       vrai: 'Une commission d\'enquête du Sénat a jugé en 2020 la rentabilité des sociétés d\'autoroutes très supérieure aux prévisions. Une contribution sur leurs bénéfices est débattue à chaque budget.' },
    flight_frequency_tax: { src: [{ label: 'Les taxes aéronautiques (ministère de la Transition écologique)', url: 'https://www.ecologie.gouv.fr/en/public-policies/aeronautical-taxes' }],
                       vrai: 'La taxe de solidarité sur les billets d\'avion a été fortement relevée en 2025, mais elle ne dépend pas du nombre de vols de chaque voyageur. Une taxe progressive est une proposition de jeu.' },
    carbon_imports:  { src: [{ label: 'Le mécanisme d\'ajustement carbone aux frontières (ministère de la Transition écologique)', url: 'https://www.ecologie.gouv.fr/politiques-publiques/mecanisme-dajustement-carbone-aux-frontieres-macf', expect: 'carbone' }, { label: 'Comprendre le mécanisme d\'ajustement carbone aux frontières (Douane)', url: 'https://www.douane.gouv.fr/fiche/comprendre-le-mecanisme-dajustement-carbone-aux-frontieres', expect: 'carbone' }],
                       vrai: 'L\'Union européenne applique depuis 2026 un mécanisme d\'ajustement carbone aux frontières sur ces produits ; ses recettes vont surtout au budget européen. Une contribution nationale en plus est une proposition de jeu.' },
    nonrecyclable_packaging: { src: [{ label: 'Cadre général des filières à responsabilité élargie des producteurs (ministère de la Transition écologique)', url: 'https://www.ecologie.gouv.fr/politiques-publiques/cadre-general-filieres-responsabilite-elargie-producteurs', expect: 'producteur' }],
                       vrai: 'Les fabricants d\'emballages paient déjà une éco-contribution, modulée selon la recyclabilité, à des éco-organismes. Une taxe versée à l\'État est une proposition de jeu.' },
    land_artificialisation: { src: [{ label: 'Artificialisation des sols (ministère de la Transition écologique)', url: 'https://www.ecologie.gouv.fr/politiques-publiques/artificialisation-sols', expect: 'artificialisation' }],
                       vrai: 'La loi Climat et résilience de 2021 fixe l\'objectif « zéro artificialisation nette » en 2050. Une taxe sur la plus-value de l\'artificialisation est une proposition de jeu, inspirée de travaux publics sur les instruments incitatifs.' },
    unused_buildable_land: { src: [{ label: 'Je possède un terrain constructible, suis-je soumis à une majoration de taxe foncière ? (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/particulier/questions/je-possede-un-terrain-constructible-suis-je-soumis-une-majoration-de-taxe', expect: 'terrain' }],
                       vrai: 'Les communes peuvent déjà majorer la taxe foncière des terrains constructibles, et cette majoration est obligatoire dans certaines zones tendues. Une taxe nationale progressive est une proposition de jeu.' },
    aid_clawback:    { src: [{ label: 'Transparence et évaluation des aides publiques aux entreprises (Sénat, commission d\'enquête, 2025)', url: 'https://www.senat.fr/rap/r24-808-1/r24-808-1.html', expect: 'aides publiques' }],
                       vrai: 'Une commission d\'enquête du Sénat a recommandé en 2025 de mieux conditionner les aides publiques aux entreprises et de prévoir leur remboursement en cas de manquement.' },
    dormant_patents: { src: [{ label: 'Régime fiscal des brevets et actifs incorporels assimilés (BOFiP, impots.gouv.fr)', url: 'https://bofip.impots.gouv.fr/bofip/11729-PGP.html/identifiant=BOI-BIC-BASE-110-30-20200422' }],
                       vrai: 'Les revenus tirés des brevets bénéficient aujourd\'hui d\'un taux réduit de 10 % d\'impôt sur les sociétés. Taxer les brevets non exploités est une proposition de jeu ; aucun dispositif identique n\'existe en France.' },
    intragroup_debt: { src: [{ label: 'Limitation de la déduction des charges financières nettes (BOFiP, impots.gouv.fr)', url: 'https://bofip.impots.gouv.fr/bofip/11787-PGP.html/identifiant=BOI-IS-BASE-35-40-10-20-20200513' }],
                       vrai: 'Depuis 2019, la France plafonne déjà la déduction des charges financières nettes (règle européenne des 30 % de l\'Ebitda). Un plafond plus strict pour la dette intragroupe est une proposition de jeu.' },
    carried_interest: { src: [{ label: 'Régime des parts de « carried interest » (BOFiP, impots.gouv.fr)', url: 'https://bofip.impots.gouv.fr/export/pdf/15810' }],
                       vrai: 'Le « carried interest » bénéficie d\'un régime fiscal particulier, encadré par la loi et régulièrement débattu lors des budgets.' },
    cir_cut:         { src: [{ label: 'Le crédit d\'impôt recherche (ministère de l\'Enseignement supérieur et de la Recherche)', url: 'https://www.enseignementsup-recherche.gouv.fr/fr/le-credit-d-impot-recherche-cir-47773', expect: 'recherche' }, { label: 'Évaluation de la réforme du crédit d\'impôt recherche de 2008 (Direction générale du Trésor)', url: 'https://www.tresor.economie.gouv.fr/Articles/2021/09/20/evaluation-de-la-reforme-du-credit-impot-recherche-de-2008' }],
                       vrai: 'Le crédit d\'impôt recherche est l\'une des plus grosses niches fiscales. Les budgets 2025 et 2026 l\'ont déjà raboté ; son recentrage sur les PME est régulièrement débattu au Parlement.' },
    pay_gap_tax:     { src: [{ label: 'Les sociétés cotées doivent-elles communiquer le salaire de leurs dirigeants ? (ministère de l\'Économie)', url: 'https://www.economie.gouv.fr/cedef/salaire-dirigeants-entreprises-cotees', expect: 'dirigeants' }],
                       vrai: 'Depuis la loi Pacte (2019), les sociétés cotées publient le « ratio d\'équité » entre la rémunération du dirigeant et celle des salariés. Le taxer est une proposition de jeu.' }
  };
  MEASURES.concat(FUNDING).forEach(function (m) {
    var o = OFFICIAL[m.id]; if (!o) return;
    m.src = o.src; m.vrai = o.vrai;
  });

  /* ---------- v0.7 : les affaires ----------
     Une affaire tombe quand les casseroles s'accumulent, quand Le Canard Déchaîné enquête, quand un rival sort un dossier,
     ou quand le programme n'est pas financé. On choisit comment réagir. */
  var AFFAIRS = [
    { id: 'emplois',    title: 'Les emplois fictifs',        text: 'Ton conjoint aurait été payé comme assistant parlementaire sans jamais mettre les pieds à l\'Assemblée.' },
    { id: 'appart',     title: 'L\'appartement de fonction',  text: 'Un 200 m² avec vue sur la Seine, loué une bouchée de pain par la mairie.' },
    { id: 'voyage',     title: 'Le voyage offert',           text: 'Une semaine aux Seychelles, payée par un lobby pétrolier.' },
    { id: 'sondages',   title: 'Les sondages espions',       text: 'Le parti aurait payé des sondages… sur la vie privée de tes rivaux.' },
    { id: 'diplome',    title: 'Le diplôme introuvable',     text: 'Ton master d\'économie viendrait d\'une université qui n\'existe pas.' },
    { id: 'montres',    title: 'La collection de montres',   text: 'Un journaliste compte 14 montres de luxe sur tes photos officielles.' },
    { id: 'valises',    title: 'Les valises de billets',     text: 'Un ancien trésorier parle de valises de billets dans le coffre de ta voiture.' },
    { id: 'suisse',     title: 'Le compte à Genève',         text: 'Un compte bancaire ouvert à ton nom en 2009 refait surface.' },
    { id: 'diners',     title: 'Les dîners à 500 €',         text: 'Des dîners dans les plus grandes tables de Paris, aux frais du contribuable.' },
    { id: 'tweet',      title: 'Le vieux message',           text: 'Un message que tu as publié il y a dix ans refait surface. Il a très mal vieilli.' },
    { id: 'chauffeur',  title: 'Le chauffeur pressé',        text: 'Ta voiture officielle cumule 87 excès de vitesse.' },
    { id: 'neveu',      title: 'Le neveu bien placé',        text: 'Ton neveu de 19 ans dirige désormais la communication du parti.' }
  ];
  var BUDGET_AFFAIR = { id: 'budget', title: 'Le programme non financé', text: 'Les économistes ont fait les comptes : ton programme coûte bien plus que ce que tu annonces.' };
  /* Les 4 façons de réagir à une affaire */
  var REACTIONS = [
    { id: 'nier',    label: 'Nier en bloc',                hint: 'Pile ou face : ça passe… ou −3 soutiens et +1 casserole', fx: [{ k: 'dice', chance: 0.5, win: [], lose: [{ k: 'strong', n: -3 }, { k: 'cas', n: 1 }] }] },
    { id: 'excuses', label: 'S\'excuser publiquement',     hint: '−1 soutien dans tes 2 meilleures régions, mais −2 casseroles : la page est tournée', fx: [{ k: 'loseTop', n: 1, count: 2 }, { k: 'cas', n: -2 }] },
    { id: 'fusible', label: 'Sacrifier un collaborateur',  hint: '−1 soutien, −1 ★, −1 casserole', fx: [{ k: 'strong', n: -1 }, { k: 'infl', n: -1 }, { k: 'cas', n: -1 }] },
    { id: 'medias',  label: 'Accuser les médias',          hint: '1 chance sur 3 que ta base se mobilise (+1 soutien) ; sinon −2 soutiens et +2 casseroles', fx: [{ k: 'dice', chance: 0.34, win: [{ k: 'regions', n: 1, count: 1 }], lose: [{ k: 'strong', n: -2 }, { k: 'cas', n: 2 }] }] }
  ];
  /* La conseillère de campagne */
  var ADVISOR = { name: 'Lulu', title: 'ta directrice de campagne' };


  /* ---------- v0.7 : « Le saviez-vous ? » — comprendre la politique ---------- */
  var LEARN = {
    presidentielle: { title: 'L\'élection présidentielle', text: 'Le président de la République est élu au suffrage universel direct pour 5 ans (le quinquennat, adopté par référendum en 2000). Il ne peut pas faire plus de deux mandats de suite.' , src: [{label: "Constitution, article 6 (Conseil constitutionnel)", url: "https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur"}] },
    second_tour: { title: 'Le scrutin à deux tours', text: 'Si aucun candidat n\'obtient plus de la moitié des voix au 1er tour, les deux premiers s\'affrontent au second tour, deux semaines plus tard. Les candidats éliminés peuvent appeler à voter pour l\'un d\'eux, mais leurs électeurs ne suivent pas toujours.' , src: [{label: "Constitution, article 7 (Conseil constitutionnel)", url: "https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur"}] },
    parrainages: { title: 'Les 500 parrainages', text: 'Pour se présenter, un candidat doit réunir 500 signatures d\'élus (maires, parlementaires…) venant d\'au moins 30 départements. C\'est un vrai défi pour les petits partis.' , src: [{label: "Les parrainages à l'élection présidentielle (Conseil constitutionnel)", url: "https://www.conseil-constitutionnel.fr/nouveaux-cahiers-du-conseil-constitutionnel/les-parrainages-a-l-election-presidentielle"}] },
    comptes: { title: 'Les comptes de campagne', text: 'Les dépenses de campagne sont plafonnées et vérifiées par une commission indépendante. En cas de dépassement, l\'État ne rembourse pas les frais, et le candidat peut être sanctionné.' , src: [{label: "Élection présidentielle 2027 (Commission nationale des comptes de campagne)", url: "https://cnccfp.fr/elections/election-du-president-de-la-republique-2027/"}] },
    sondages: { title: 'Les sondages', text: 'Un sondage interroge environ mille personnes : il a une marge d\'erreur de 2 à 3 points. Leur publication est interdite la veille et le jour du vote.' , src: [{label: "Obligations de publication des sondages (Commission des sondages)", url: "https://www.commission-des-sondages.fr/oblig/obligations.htm"}] },
    vingt_heures: { title: 'Pourquoi 20h ?', text: 'Aucun résultat ne peut être publié avant la fermeture des derniers bureaux de vote, à 20h dans les grandes villes. Les « estimations » sont calculées à partir des premiers bulletins dépouillés.' , src: [{label: "Interdiction de diffusion des résultats avant la clôture (Commission des sondages)", url: "https://www.commission-des-sondages.fr/hist/communiques/portee-interdiction-publication-diffusion-sondages-resultats-mars07.htm"}] },
    temps_parole: { title: 'Le temps de parole', text: 'Pendant la campagne, une autorité indépendante (l\'Arcom) veille à ce que les médias audiovisuels donnent la parole à tous les candidats de façon équitable, puis égale à l\'approche du vote.' , src: [{label: "Protéger le pluralisme politique (Arcom)", url: "https://www.arcom.fr/nous-connaitre-nos-missions/garantir-le-pluralisme-et-la-cohesion-sociale/proteger-le-pluralisme-politique"}] },
    debat: { title: 'Le débat télévisé', text: 'Le débat d\'entre-deux-tours entre les deux finalistes est une tradition depuis 1974. Une phrase bien placée peut marquer toute une campagne : « Vous n\'avez pas le monopole du cœur », lancé par Valéry Giscard d\'Estaing à François Mitterrand en 1974, est restée célèbre.' , src: [{label: "Les règles de temps de parole de l'entre-deux-tours (Arcom)", url: "https://www.arcom.fr/actualites/presidentielle-2022-les-regles-de-temps-de-parole-de-lentre-deux-tours"}] },
    art49_3: { title: 'Le 49.3', text: 'L\'article 49 alinéa 3 de la Constitution permet au gouvernement de faire adopter un texte sans vote des députés… sauf si ceux-ci votent une motion de censure, qui renverse alors le gouvernement. Son usage est limité depuis 2008.' , src: [{label: "Fiche n° 64 : la responsabilité du Gouvernement (Assemblée nationale)", url: "https://www.assemblee-nationale.fr/dyn/contenu/telechargement/629167/file/Fiche%2064%20-%20Responsabilit%C3%A9%20du%20Gouvernement_actualis%C3%A9e061224.pdf"}, {label: "Constitution, article 49 (Conseil constitutionnel)", url: "https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur"}] },
    censure: { title: 'La motion de censure', text: 'Les députés peuvent renverser le gouvernement en votant une motion de censure. Il faut la majorité absolue des députés, soit 289 voix.' , src: [{label: "Fiche n° 64 : la responsabilité du Gouvernement (Assemblée nationale)", url: "https://www.assemblee-nationale.fr/dyn/contenu/telechargement/629167/file/Fiche%2064%20-%20Responsabilit%C3%A9%20du%20Gouvernement_actualis%C3%A9e061224.pdf"}] },
    referendum: { title: 'Le référendum', text: 'Le président peut soumettre un projet de loi directement aux citoyens (article 11 de la Constitution), mais seulement sur certains sujets : organisation des pouvoirs publics, politique économique, sociale ou environnementale.' , src: [{label: "Constitution, article 11 (Conseil constitutionnel)", url: "https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur"}] },
    budget: { title: 'Le budget de l\'État', text: 'Chaque année, le Parlement vote la loi de finances : les recettes et les dépenses de l\'État. Quand on dépense plus qu\'on ne gagne, c\'est le déficit, qui s\'ajoute à la dette. En 2025, les administrations publiques ont dépensé 1 714 milliards d\'euros pour 1 562 milliards de recettes : un déficit de 152,5 milliards, soit 5,1 % de la richesse produite (le PIB).' , src: [{label: "Comptes de la Nation 2025, premiers résultats (Insee)", url: "https://www.insee.fr/fr/statistiques/8956575"}, {label: "La situation et les perspectives des finances publiques, juin 2026 (Cour des comptes)", url: "https://www.ccomptes.fr/fr/publications/la-situation-et-les-perspectives-des-finances-publiques-17"}] },
    affaires: { title: 'Les affaires et la justice', text: 'Une personne mise en cause reste présumée innocente tant qu\'elle n\'est pas condamnée. Mais une condamnation peut s\'accompagner d\'une peine d\'inéligibilité : interdiction de se présenter à une élection.' , src: [{label: "Déclaration des droits de l'homme et du citoyen, article 9 (Conseil constitutionnel)", url: "https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/declaration-des-droits-de-l-homme-et-du-citoyen-de-1789"}] },
    militants: { title: 'Les militants', text: 'Les militants font vivre une campagne sur le terrain : tractage, porte-à-porte, réunions, collage d\'affiches sur les panneaux officiels installés devant chaque bureau de vote.' },
    agenda: { title: 'L\'agenda médiatique', text: 'Les sujets dont parlent les médias influencent ce qui préoccupe les électeurs. Les candidats essaient d\'imposer « leurs » thèmes : ceux sur lesquels ils sont jugés les plus crédibles.' },
    legislatives: { title: 'Les élections législatives', text: 'Les 577 députés sont élus dans 577 circonscriptions, au scrutin majoritaire à deux tours, pour 5 ans. Pour gouverner sereinement, le président a besoin d\'une majorité absolue : 289 députés.', src: [{ label: 'Fiche de synthèse n° 3 : l\'élection des députés (Assemblée nationale)', url: 'https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/l-election-des-deputes' }] },
    scrutin_legis: { title: 'Comment on devient député', text: 'Dans chaque circonscription, il faut plus de 50 % des voix et au moins 25 % des inscrits pour être élu dès le 1er tour. Sinon, ceux qui ont réuni au moins 12,5 % des inscrits vont au 2nd tour (les deux premiers au minimum). À trois, on parle de triangulaire : le troisième peut se retirer pour faire gagner un candidat proche. Au 2nd tour, le premier l\'emporte.', src: [{ label: 'Fiche de synthèse n° 3 : l\'élection des députés (Assemblée nationale)', url: 'https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/l-election-des-deputes' }] },
    locomotive: { title: 'Pourquoi les législatives suivent la présidentielle', text: 'Depuis 2002, les législatives ont lieu quelques semaines après la présidentielle : une loi organique de 2001 a inversé le calendrier, après le passage au quinquennat. Les électeurs confirment souvent leur choix : le président a obtenu une majorité absolue en 2002, 2007, 2012 et 2017, mais seulement une majorité relative en 2022.', src: [{ label: 'Loi organique n° 2001-419 du 15 mai 2001 modifiant la date d\'expiration des pouvoirs de l\'Assemblée nationale (Légifrance)', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000404920' }] },
    jour_opposition: { title: 'Le jour réservé à l\'opposition', text: 'Depuis 2008, la Constitution réserve un jour de séance par mois à un ordre du jour fixé par les groupes d\'opposition et les groupes minoritaires (article 48). C\'est là que l\'opposition fait examiner ses propres propositions de loi. Elles sont rarement adoptées, mais un bon texte peut rassembler au-delà de son camp.', src: [{ label: 'Constitution, article 48 (Conseil constitutionnel)', url: 'https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur' }] },
    cohabitation: { title: 'La cohabitation', text: 'Quand la majorité de l\'Assemblée est opposée au président, celui-ci nomme un Premier ministre issu de cette majorité. Le gouvernement « détermine et conduit la politique de la nation » (article 20) ; le président reste chef des armées et négocie les traités, et il garde le droit de dissoudre l\'Assemblée. La France a connu trois cohabitations : 1986, 1993 et 1997.', src: [{ label: 'Constitution, articles 5, 8, 12, 15, 20 et 52 (Conseil constitutionnel)', url: 'https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur' }] },
    majorite: { title: 'Comment une loi est adoptée', text: 'À l\'Assemblée, une loi est adoptée si elle recueille plus de voix « pour » que de voix « contre » : les abstentions ne comptent pas. C\'est la majorité des suffrages exprimés. Sans majorité absolue, il faut convaincre d\'autres groupes, souvent en acceptant des amendements.', src: [{ label: 'Fiche de synthèse n° 56 : les votes à l\'Assemblée nationale', url: 'https://www.assemblee-nationale.fr/dyn/synthese/fonctionnement-assemblee-nationale/travail-legislatif/les-votes-a-l-assemblee-nationale' }] },
    hcfp: { title: 'Le Haut Conseil des finances publiques', text: 'Un organisme indépendant, rattaché à la Cour des comptes, qui vérifie chaque automne si les prévisions du gouvernement sont réalistes et si le budget respecte la trajectoire promise.', src: [{ label: 'Haut Conseil des finances publiques', url: 'https://www.hcfp.fr/' }] },
    trois_pourcent: { title: 'La règle des 3 %', text: 'Les règles européennes demandent de garder le déficit public sous 3 % du PIB. La France fait l\'objet d\'une procédure pour déficit excessif et s\'est engagée à repasser sous 3 % en 2029.', src: [{ label: 'La situation et les perspectives des finances publiques, juin 2026 (Cour des comptes)', url: 'https://www.ccomptes.fr/fr/publications/la-situation-et-les-perspectives-des-finances-publiques-17' }, { label: 'Le nouveau cadre budgétaire européen (Direction générale du Trésor)', url: 'https://www.tresor.economie.gouv.fr/Articles/2026/04/14/le-nouveau-cadre-budgetaire-europeen-de-la-negociation-a-la-mise-en-oeuvre' }] },
    dissolution: { title: 'La dissolution', text: 'Le président peut dissoudre l\'Assemblée nationale (article 12 de la Constitution) : de nouvelles élections législatives ont alors lieu. Il ne peut pas recommencer dans l\'année qui suit.', src: [{ label: 'Constitution, article 12 (Conseil constitutionnel)', url: 'https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur' }] },
    cour: { title: 'La Cour des comptes', text: 'Une juridiction indépendante qui contrôle la bonne utilisation de l\'argent public. Chaque année, elle publie un rapport sur la situation des finances publiques et ses recommandations.', src: [{ label: 'La situation et les perspectives des finances publiques, juin 2026 (Cour des comptes)', url: 'https://www.ccomptes.fr/fr/publications/la-situation-et-les-perspectives-des-finances-publiques-17' }] },
    vote_blanc: { title: 'Le vote blanc', text: 'Voter blanc, c\'est se déplacer pour dire qu\'aucun candidat ne convient. Depuis la loi du 21 février 2014, les bulletins blancs sont comptés à part et cités dans les résultats, mais ils ne comptent pas dans les suffrages exprimés : ils ne changent donc pas le score des candidats. Au 2nd tour de 2022, il y en a eu 2,2 millions, soit 6,4 % des votants.', src: [{ label: 'Comment le vote blanc est-il comptabilisé ? (Conseil constitutionnel)', url: 'https://presidentielle2022.conseil-constitutionnel.fr/le-vote/etre-electeur-et-voter/vote-blanc-comptabilise.html' }, { label: 'Loi n° 2014-172 du 21 février 2014 (Légifrance)', url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000028636783' }, { label: 'Résultats officiels du 2nd tour 2022 (Conseil constitutionnel)', url: 'https://presidentielle2022.conseil-constitutionnel.fr/les-communiques/resultats-du-second-tour.html' }] },
    abstention: { title: 'L\'abstention', text: 'Au 2nd tour de la présidentielle 2022, 28 % des inscrits ne sont pas allés voter. Elle varie beaucoup : 22 % en Bretagne, 29 % en Île-de-France, et plus de la moitié des inscrits en outre-mer et chez les Français de l\'étranger.', src: [{ label: 'Présidentielle 2022, résultats du 2nd tour par département (Conseil constitutionnel)', url: 'https://presidentielle2022.conseil-constitutionnel.fr/documents/Resultats-departements-2etour.20220427133205.pdf' }] },
    qui_vote: { title: 'Qui vote, qui s\'abstient ?', text: 'D\'après l\'Insee, en 2022 la moitié des cadres inscrits ont voté à tous les tours, contre un quart seulement des ouvriers. Les 65 ans et plus votent beaucoup plus que les 18-29 ans, et les diplômés plus que les non-diplômés. Convaincre ceux qui votent peu est donc un énorme réservoir… mais difficile.', src: [{ label: 'Vingt ans de participation électorale, Insee Première n° 1929', url: 'https://www.insee.fr/fr/statistiques/6658143' }, { label: 'Seul un tiers des électeurs a voté à tous les tours, Insee Première n° 1928', url: 'https://www.insee.fr/fr/statistiques/6658145' }] },
    inscription: { title: 'S\'inscrire sur les listes', text: 'Pour voter, il faut être inscrit sur les listes électorales. En 2022, 95 % des Français en âge de voter l\'étaient, d\'après l\'Insee. Les jeunes sont inscrits d\'office à 18 ans, mais après un déménagement il faut faire la démarche soi-même : en 2022, 16,5 % des électeurs étaient inscrits dans une autre commune que celle où ils vivaient.', src: [{ label: '48,7 millions d\'électeurs inscrits en 2022, Insee Focus n° 264', url: 'https://www.insee.fr/fr/statistiques/6322895' }, { label: 'Inscrits dans une autre commune que leur résidence, Insee Première n° 1986', url: 'https://www.insee.fr/fr/statistiques/7766966' }, { label: 'Je m\'inscris sur les listes électorales (ministère de l\'Intérieur)', url: 'https://www.elections.interieur.gouv.fr/mes-demarches/je-minscris-sur-listes-electorales' }] },
    electeurs: { title: 'Habitants ou électeurs ?', text: 'Ce ne sont pas les habitants qui votent, mais les inscrits. L\'Île-de-France compte 18,8 % de la population de métropole, mais seulement 16,2 % de ses inscrits : la population compte aussi les mineurs et les étrangers, qui ne votent pas à la présidentielle. Dans le jeu, chaque région pèse son vrai nombre d\'inscrits.', src: [{ label: 'Estimation de la population au 1er janvier 2025 (Insee)', url: 'https://www.insee.fr/fr/statistiques/2012730' }, { label: 'Présidentielle 2022, résultats du 2nd tour par département (Conseil constitutionnel)', url: 'https://presidentielle2022.conseil-constitutionnel.fr/documents/Resultats-departements-2etour.20220427133205.pdf' }] },
    outremer: { title: 'Corse, outre-mer et Français de l\'étranger', text: 'Dans le jeu, ils sont regroupés : 3,6 millions d\'inscrits, soit 7 % du corps électoral. Au 2nd tour de 2022, plus de la moitié d\'entre eux se sont abstenus (61 % chez les Français de l\'étranger). Les Français établis hors de France élisent 11 députés.', src: [{ label: 'Présidentielle 2022, résultats du 2nd tour par département (Conseil constitutionnel)', url: 'https://presidentielle2022.conseil-constitutionnel.fr/documents/Resultats-departements-2etour.20220427133205.pdf' }, { label: 'Fiche de synthèse n° 3 : l\'élection des députés (Assemblée nationale)', url: 'https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/l-election-des-deputes' }] },
    depart2024: { title: 'Le point de départ : la moyenne de deux scrutins de 2024', text: 'En mode Réaliste, chaque parti démarre avec, dans chaque région, la moyenne de ses scores aux deux élections de 2024 : les européennes du 9 juin et le 1er tour des législatives du 30 juin. Pourquoi deux scrutins ? Aux européennes, chaque parti avait sa propre liste partout, mais beaucoup d\'électeurs votent différemment quand il s\'agit de l\'Europe (et le camp présidentiel y a fait un score bas). Aux législatives, les partis étaient en alliances (Nouveau Front populaire, Ensemble, RN et alliés) : on y voit mieux le poids de chaque camp, mais pas celui de chaque parti de gauche, réparti ici selon les européennes. La moyenne lisse ces deux défauts. Le RN reste en tête dans la plupart des régions, comme en 2024. Les autres listes et les partis absents de ta partie comptent dans les sondages sous « Autres », et la campagne les réduit peu à peu. Le mode Égalité, lui, fait partir tout le monde à égalité.', src: [{ label: 'Européennes 2024, résultats définitifs par région (ministère de l\'Intérieur, data.gouv.fr)', url: 'https://www.data.gouv.fr/datasets/resultats-des-elections-europeennes-du-9-juin-2024' }, { label: 'Législatives 2024, résultats définitifs du 1er tour (ministère de l\'Intérieur, data.gouv.fr)', url: 'https://www.data.gouv.fr/datasets/elections-legislatives-des-30-juin-et-7-juillet-2024-resultats-definitifs-du-1er-tour' }] },
    depart2022: { title: 'Le point de départ : la présidentielle 2022', text: 'Chaque parti démarre avec, dans chaque région, le score de son candidat au 1er tour de la présidentielle d\'avril 2022 : Mélenchon pour la gauche radicale, Hidalgo pour le PS, Jadot pour les écologistes, Macron pour le centre, Pécresse pour la droite, Le Pen pour l\'extrême droite. C\'est la dernière présidentielle, l\'élection que tu joues. Mais elle date, et elle porte sur des personnes autant que sur des partis : le centre et LFI y étaient bien plus forts qu\'aujourd\'hui, le PS et LR bien plus faibles.', src: [{ label: 'Présidentielle 2022, résultats définitifs du 1er tour par région (ministère de l\'Intérieur, data.gouv.fr)', url: 'https://www.data.gouv.fr/datasets/election-presidentielle-des-10-et-24-avril-2022-resultats-definitifs-du-1er-tour' }] },
    departSondages: { title: 'Le point de départ : les sondages de 2026', text: 'Chaque parti démarre avec la moyenne de 6 sondages réalisés en octobre 2026 pour la présidentielle 2027 (Harris Interactive, OpinionWay, Ifop, YouGov, Elabe, Odoxa). Les sondages donnent un score national : dans chaque région, on garde le profil de 2024 (une région plus à gauche reste plus à gauche) et on applique la tendance nationale. Un sondage n\'est pas une élection : c\'est une photo de l\'opinion à un moment, avec une marge d\'erreur de 2 à 3 points, et sur des candidats plutôt que sur des partis.', src: [{ label: 'Notices des sondages publiés, avec leurs chiffres et leur méthode (Commission des sondages)', url: 'https://www.commission-des-sondages.fr/notices/' }] },
    dette: { title: 'La dette publique', text: 'Fin 2025, la dette publique atteignait 3 460 milliards d\'euros, environ 116 % du PIB, un record. Rien qu\'en intérêts, elle a coûté près de 66 milliards d\'euros en 2025, et la Cour des comptes prévoit environ 77 milliards en 2026 : ce serait le premier poste du budget de l\'État. Les règles européennes demandent de ramener le déficit sous 3 % du PIB.' , src: [{label: "La situation et les perspectives des finances publiques, juin 2026 (Cour des comptes)", url: "https://www.ccomptes.fr/fr/publications/la-situation-et-les-perspectives-des-finances-publiques-17"}, {label: "Comptes de la Nation 2025, premiers résultats (Insee)", url: "https://www.insee.fr/fr/statistiques/8956575"}] },
    alliances: { title: 'Les alliances', text: 'Entre les deux tours, des partis proches peuvent passer des accords : l\'un se retire ou appelle à voter pour l\'autre. Mais une alliance n\'efface pas les désaccords, et les électeurs restent libres.' }
  };

  /* ---------- v0.8 : les groupes de population ----------
     Part de chaque groupe parmi les 15 ans ou plus de chaque région (voir REGIONS[].pop).
     Source : Insee, recensement de la population 2022. */
  var SEGMENTS = [
    { id: 'ind', icon: '🧑‍🌾', name: 'Indépendants',               full: 'Agriculteurs, artisans, commerçants et chefs d\'entreprise' },
    { id: 'cad', icon: '💼', name: 'Cadres',                        full: 'Cadres et professions intellectuelles supérieures' },
    { id: 'pi',  icon: '🧑‍🏫', name: 'Professions intermédiaires',  full: 'Techniciens, enseignants, infirmiers, agents de maîtrise…' },
    { id: 'pop', icon: '🔧', name: 'Employés et ouvriers',          full: 'Employés et ouvriers' },
    { id: 'ret', icon: '👵', name: 'Retraités',                     full: 'Retraités' },
    { id: 'sae', icon: '🎓', name: 'Étudiants et sans emploi',      full: 'Étudiants, chômeurs et autres personnes sans activité professionnelle' }
  ];
  /* v1.0 : propension à voter de chaque groupe (inspirée de l'Insee : la moitié des cadres votent à tous les tours, un quart des ouvriers) */
  var VOTE_PROP = { cad: 1.15, ret: 1.12, pi: 1.05, ind: 1.0, pop: 0.85, sae: 0.8 };
  var SEGMENTS_SRC = { label: 'Population de 15 ans ou plus par groupe socioprofessionnel en 2022 (Insee)', url: 'https://www.insee.fr/fr/statistiques/2012701' };

  var PROFILES = {
    urbaine: 'Urbaine', rurale: 'Rurale', industrielle: 'Industrielle', historique: 'Historique'
  };

  /* v3.0 : les partis gardent le sigle de leur modèle réel (LFI, PS, LE, RE, LR, RN, LO, PCF, MoDem, HOR, DLF, REC)
     et leurs dirigeants les initiales du candidat réel, avec un nom satirique inventé. Le code interne (id) ne change pas. */
  var PARTIES = [
    { id: 'FI', sigle: 'LFI', pos: 1, name: 'La France Indignée', short: 'France Indignée', family: 'Gauche radicale',
      candidate: 'Jean-Lutte Mégaphone', candTitle: 'le tribun au porte-voix', programme: ['smic', 'superprofits', 'medecins', 'train1', 'semaine4'], financing: ['isf', 'heritage', 'niches'],
      color: '#C8323C', ink: '#FFFFFF', money: 5, infl: 4, bases: ['occ', 'bfc'],
      cred: { pouvoir: 2, services: 2, ecologie: 1, emploi: 1, securite: 0, immigration: 0 },
      force: 'Réseaux sociaux : en Buzz, relance le dé si le résultat est mauvais (1 ou 2).',
      weakness: 'Un Meeting coûte 1 € de plus en région rurale.',
      cards: ['marche_pop', 'censure'] },
    { id: 'SM', sigle: 'PS', pos: 3, name: 'Le Parti Survivant', short: 'Parti Survivant', family: 'Centre gauche',
      candidate: 'Raphaël Grandsmots', candTitle: 'le beau parleur européen', programme: ['classes', 'apprentissage', 'cheque', 'proximite', 'plastique'], financing: ['fraudefisc', 'niches'],
      color: '#E07AA0', ink: '#1B1F3B', money: 6, infl: 3, bases: ['naq', 'cvl'],
      cred: { services: 2, emploi: 1, pouvoir: 1, securite: 1, ecologie: 1, immigration: 0 },
      force: "Réseau d'élus : +1 soutien en Meeting là où il a déjà 5 soutiens ou plus.",
      weakness: 'Primaire perpétuelle : au tour 4 (format classique), perdre une action ou voir un courant claquer la porte (voir 🌹).',
      cards: ['fete_rose', 'primaire'] },
    { id: 'VP', sigle: 'LE', pos: 2, name: 'Les Enracinés', short: 'Les Enracinés', family: 'Écologie',
      candidate: 'Marine Tournesol', candTitle: 'l\'écolo qui suit le soleil', programme: ['renovation', 'train1', 'sp20', 'cheque', 'plastique'], financing: ['heritage', 'isf'],
      color: '#3E9B5A', ink: '#FFFFFF', money: 6, infl: 3, bases: ['ara', 'cor'],
      cred: { ecologie: 2, services: 1, pouvoir: 1, emploi: 0, securite: 0, immigration: 0 },
      force: 'À la Télé : +1 soutien en plus dans les régions urbaines.',
      weakness: 'Une Collecte ne rapporte que 2 €.',
      cards: ['climat', 'canicule'] },
    { id: 'EM', sigle: 'RE', pos: 4, name: 'Réforme Encore', short: 'Réforme Encore', family: 'Centre',
      candidate: 'Gabriel Agité', candTitle: 'le pressé de la réforme', programme: ['pme', 'retraites', 'video', 'plastique', 'medecins'], financing: ['trainvie'],
      color: '#F2A93B', ink: '#1B1F3B', money: 8, infl: 4, bases: ['pdl', 'bre'],
      cred: { emploi: 2, securite: 2, ecologie: 1, services: 1, immigration: 1, pouvoir: 0 },
      force: 'Une Collecte rapporte 4 € et 1 ★. Candidat infatigable : récupère 3 ⚡ par tour (au lieu de 2).',
      weakness: "Usure du pouvoir : au tour 5 (au tour 2 en campagne éclair), perd 1 soutien dans sa région la plus forte.",
      cards: ['art493', 'remaniement'] },
    { id: 'UG', sigle: 'LR', pos: 5, name: 'Les Rescapés', short: 'Les Rescapés', family: 'Droite',
      candidate: 'Bruno Raboteur', candTitle: 'le rabot à la main', programme: ['policiers', 'pme', 'controles', 'tva', 'nonremplacement'], financing: ['trainvie', 'gelpoint', 'chomage'],
      color: '#4A7FD0', ink: '#FFFFFF', money: 5, infl: 4, bases: ['ges', 'nor'],
      cred: { securite: 2, emploi: 2, immigration: 1, pouvoir: 1, services: 1, ecologie: 0 },
      force: 'Fidélité : en région historique, une attaque ne peut pas le faire descendre sous 2 soutiens.',
      weakness: 'Divisions : les événements « Division » lui coûtent 2 soutiens au lieu de 1.',
      cards: ['appel18', 'rassemblement'] },
    { id: 'MN', sigle: 'RN', pos: 6, name: 'Rassemblement Nostalgique', short: 'Rass. Nostalgique', family: 'Droite nationale',
      candidate: 'Marine La Pénible', candTitle: 'l\'éternelle candidate', programme: ['referendum', 'planchers', 'tva', 'regroupement', 'video'], financing: ['trainvie'],
      color: '#24325E', ink: '#FFFFFF', money: 7, infl: 3, bases: ['hdf', 'pac'],
      cred: { immigration: 2, securite: 2, pouvoir: 1, emploi: 0, ecologie: 0, services: 0 },
      force: 'À la Télé : +1 soutien en plus dans les régions industrielles.',
      weakness: 'Peu de relais locaux : il lui faut 4 soutiens (au lieu de 3) pour contrôler une région.',
      cards: ['plateau_tele', 'grand_meeting'] },
    /* v1.7 : six partis de plus (12 au total). Positions sur l'axe : de 0,3 (extrême gauche) à 6,7 (droite identitaire). */
    { id: 'LO', sigle: 'LO', pos: 0.3, name: 'Lutte Obstinée', short: 'Lutte Obstinée', family: 'Extrême gauche',
      candidate: 'Nathalie Arrêtdetravail', candTitle: 'la grève dans le sang', programme: ['smic', 'superprofits', 'semaine4', 'sp20', 'accueil'], financing: ['isf', 'heritage', 'fraudefisc'],
      color: '#7B1F2E', ink: '#FFFFFF', money: 3, infl: 3, bases: ['hdf', 'idf'],
      cred: { pouvoir: 2, emploi: 2, services: 1, ecologie: 0, securite: 0, immigration: 0 },
      force: 'Militantisme : une équipe de militants coûte 2 € (au lieu de 3).',
      weakness: 'Pas de relais médiatiques : la Télé coûte 1 € de plus.',
      cards: ['marche_pop', 'censure'] },
    { id: 'PC', sigle: 'PCF', pos: 1.5, name: 'Le Parti Camarade Français', short: 'Parti Camarade', family: 'Communistes',
      candidate: 'Fabien Rillettes', candTitle: 'le camarade bon vivant', programme: ['reindus', 'smic', 'energie', 'lignes', 'superprofits'], financing: ['isf', 'heritage'],
      color: '#E2572B', ink: '#FFFFFF', money: 4, infl: 3, bases: ['hdf', 'idf'],
      cred: { emploi: 2, pouvoir: 2, services: 1, securite: 1, ecologie: 0, immigration: 0 },
      force: 'Bastions ouvriers : Mobiliser rapporte 1 soutien de plus en région industrielle.',
      weakness: 'Une Collecte ne rapporte que 2 €.',
      cards: ['marche_pop', 'grand_meeting'] },
    { id: 'MD', sigle: 'MoDem', pos: 3.6, name: 'Mollesse Démocrate', short: 'Mollesse Démocrate', family: 'Centre',
      candidate: 'François Bientôtprésident', candTitle: 'le candidat perpétuel', programme: ['classes', 'apprentissage', 'proximite', 'renovation', 'pme'], financing: ['niches', 'fraudefisc'],
      color: '#9C6ADE', ink: '#FFFFFF', money: 5, infl: 3, bases: ['naq', 'pdl'],
      cred: { services: 2, emploi: 1, ecologie: 1, securite: 1, pouvoir: 1, immigration: 0 },
      force: 'Faiseur de rois : entre les deux tours, ses accords ont 15 points de chances en plus.',
      weakness: 'Une Collecte ne rapporte que 2 €.',
      cards: ['primaire', 'remaniement'] },
    { id: 'HZ', sigle: 'HOR', pos: 4.4, name: 'Hors-Sol', short: 'Hors-Sol', family: 'Centre droit',
      candidate: 'Édouard Patience', candTitle: 'celui qui attend son heure', programme: ['retraites', 'pme', 'nonremplacement', 'policiers', 'fraude'], financing: ['trainvie', 'chomage', 'gelpoint'],
      color: '#2BA6B8', ink: '#1B1F3B', money: 7, infl: 4, bases: ['nor', 'ara'],
      cred: { emploi: 2, securite: 2, services: 1, immigration: 1, pouvoir: 0, ecologie: 0 },
      force: 'Bâtisseur : une Promesse coûte 3 ★ (au lieu de 4).',
      weakness: 'Parti jeune, peu implanté : il lui faut 4 soutiens (au lieu de 3) pour contrôler une région.',
      cards: ['rassemblement', 'remaniement'] },
    { id: 'DL', sigle: 'DLF', pos: 5.6, name: 'Debout La Flemme', short: 'Debout La Flemme', family: 'Souverainistes',
      candidate: 'Nigaud Dupont-Arriéré', candTitle: 'le gaulois en retard d\'une époque', programme: ['tva', 'controles', 'lignes', 'planchers', 'energie'], financing: ['trainvie', 'fraudefisc'],
      color: '#7A8FA6', ink: '#FFFFFF', money: 3, infl: 2, bases: ['idf', 'bfc'],
      cred: { immigration: 2, pouvoir: 1, securite: 1, emploi: 1, services: 1, ecologie: 0 },
      force: 'La France des clochers : un Meeting rapporte 1 soutien de plus en région rurale.',
      weakness: 'Petit budget : la Télé coûte 1 € de plus.',
      cards: ['appel18', 'plateau_tele'] },
    { id: 'RQ', sigle: 'REC', pos: 6.7, name: 'Rétroconquête', short: 'Rétroconquête', family: 'Droite identitaire',
      candidate: 'Éric Zéronuance', candTitle: 'le polémiste sans nuance', programme: ['regroupement', 'controles', 'referendum', 'planchers', 'fraude'], financing: ['trainvie', 'chomage'],
      color: '#3B3B3B', ink: '#FFFFFF', money: 6, infl: 3, bases: ['pac', 'idf'],
      cred: { immigration: 2, securite: 2, pouvoir: 0, emploi: 0, services: 0, ecologie: 0 },
      force: 'Polémiques : un Buzz sur l\'immigration rapporte 1 soutien de plus.',
      weakness: 'Repoussoir : entre les deux tours, ses accords ont 15 points de chances en moins.',
      cards: ['grand_meeting', 'plateau_tele'] }
  ];

  /* Actions de base. cost = { money, infl } ; target : 'region' | 'party' | null ; theme : l'action porte un message (thème) */
  var ACTIONS = {
    terrain:  { name: 'Meeting',        icon: '📣', cost: { money: 2, infl: 0, forme: 1 }, target: 'region', theme: true, text: 'Autant de soutiens que l\'impact du message (1 à 4)' },
    medias:   { name: 'Télé',           icon: '📺', cost: { money: 3, infl: 1, forme: 1 }, target: null, theme: true, text: 'Une interview sur ton thème : gagne des classes sociales dans toute la France (v3.8)' },
    reseaux:  { name: 'Buzz',           icon: '📱', cost: { money: 1, infl: 0 }, target: 'region', theme: true, text: 'Un dé : de −1 à +4 soutiens, +1 si le thème fait l\'actu' },
    contre:   { name: 'Attaquer',       icon: '🥊', cost: { money: 2, infl: 1 }, target: 'region', text: '−2 soutiens au rival le plus fort de la région (il faut y avoir 1 soutien)' },
    fonds:    { name: 'Collecte',       icon: '💰', cost: { money: 0, infl: 0 }, target: null,     text: '+3 €' },
    reforme:  { name: 'Promesse',       icon: '📜', cost: { money: 0, infl: 4 }, target: 'region', text: '+1 soutien dans toutes les régions du même profil (région contrôlée)' },
    imposer:  { name: 'Faire la une',   icon: '🗞️', cost: { money: 2, infl: 2 }, target: null,     theme: true, text: 'Ton thème fera l\'actu au prochain tour (pour tout le monde !)' },
    mobiliser:{ name: 'Mobiliser',      icon: '🚪', cost: { money: 2, infl: 0 }, target: 'region', text: 'Porte-à-porte : fais voter des abstentionnistes. Plus efficace si ton programme plaît aux groupes qui votent peu ici' },
    militants:{ name: 'Militants',      icon: '👥', cost: { money: 3, infl: 0 }, target: 'region', text: 'Implante une équipe de militants : +1 soutien ici au début de chaque tour (3 équipes au plus)' },
    enquete:  { name: 'Enquêter',       icon: '🔎', cost: { money: 1, infl: 1 }, target: 'party', text: 'Fouiller le passé d\'un rival : si tu trouves quelque chose, une affaire lui tombe dessus au prochain tour' },
    alliance: { name: 'Alliance',       cost: { money: 0, infl: 1 }, target: 'party',  text: "Proposer une alliance à un parti proche (distance 2 au plus)" },
    rupture:  { name: 'Rupture',        cost: { money: 0, infl: 0 }, target: null,     text: "Rompre ton alliance : −2 ★, et ton ex-allié ne te reportera presque rien au second tour" },
    matinale: { name: 'Matinale radio', icon: '📻', cost: { money: 0, infl: 0, forme: 1 }, target: null, theme: true, text: 'Une interview à la radio : le public dépend de la station (une fois tous les deux tours)' },   // v3.9
    vingt:    { name: 'Le 20 h',        icon: '🕗', cost: { money: 0, infl: 0, forme: 1 }, target: null, theme: true, text: 'Invité au journal de 20 h : une fois par campagne, réservé aux 4 premiers du sondage' },   // v3.9
    repos:    { name: 'Repos',          icon: '😴', cost: { money: 0, infl: 0 }, target: null,     text: 'Une journée loin des caméras : +2 ⚡ tout de suite' },   // v3.6.6
    /* v3.1 : les actions propres à un parti (voir TRAITS) */
    nostalgie:{ name: 'C\u2019était mieux avant', icon: '⏪', only: ['MN', 'RQ'], cost: { money: 2, infl: 0, forme: 1 }, target: 'region', text: 'Promettre le retour du passé : plaît aux retraités, fait fuir les jeunes à mesure qu\u2019on recule' },
    rappel:   { name: 'Rappeler un ancien', icon: '📞', only: ['SM'], cost: { money: 1, infl: 1 }, target: null, text: 'François Hésitant sort de sa retraite : il ramène un pétale… ou sort un livre qui règle ses comptes' },
    fusion:   { name: 'Fusionner',      icon: '🧲', only: ['EM', 'MD', 'HZ'], cost: { money: 1, infl: 2 }, target: null, text: 'Absorber le micro-parti centriste du moment' },
    eclat:    { name: 'Le coup d\u2019éclat', icon: '💥', only: ['UG'], cost: { money: 3, infl: 2 }, target: null, text: 'Faire parler de soi : les caméras reviennent pour 3 tours' }
  };

  /* Cartes spéciales : 1 utilisation par partie, prend 1 action. */
  var CARDS = {
    marche_pop:    { name: 'Marche populaire',     target: 'region', profiles: ['urbaine'], text: '+3 soutiens dans une région urbaine.' },
    censure:       { name: 'Motion de censure',    target: null, text: 'Chaque adversaire perd 1 ★.' },
    fete_rose:     { name: 'Fête de la Rose',      target: 'region', text: '+2 soutiens dans cette région et dans une autre où tu es présent.' },
    primaire:      { name: 'Primaire',             target: null, text: '+3 ★.' },
    climat:        { name: 'Marche pour le climat', target: 'region', profiles: ['rurale', 'urbaine'], text: '+3 soutiens dans une région rurale ou urbaine.' },
    canicule:      { name: 'Canicule',             target: null, text: 'Chaque adversaire perd 1 soutien dans ses 2 régions les plus fortes.' },
    art493:        { name: '49.3',                 target: null, text: "Annule la prochaine action du rival en tête ce tour." },
    remaniement:   { name: 'Remaniement',          target: 'region', text: "Déplace 2 soutiens de ta région la plus forte vers celle-ci." },
    appel18:       { name: 'Appel du 18 juin',     target: null, text: '+1 soutien dans chaque région historique.' },
    rassemblement: { name: 'Rassemblement',        target: null, text: '+3 € et +1 ★.' },
    plateau_tele:  { name: 'Plateau télé',         target: null, text: '+2 soutiens dans 3 régions rurales ou industrielles.' },
    grand_meeting: { name: 'Grand meeting',        target: 'region', text: '+4 soutiens dans une région.' }
  };

  /* v3.1 : les traits satiriques. Chaque trait a un avantage ET un coût : le gag se joue de l'intérieur.
     Les chiffres sont réglés par simulation (test/simulate.js). */
  var TRAITS = {
    nostalgie: { parties: ['MN', 'RQ'], icon: '⏪', name: 'La machine à remonter le temps',
      plus: 'Action « C’était mieux avant » (2 € + 1 ⚡, une fois par tour) : 3 soutiens sans choisir de thème, 4 à partir de 1962, +1 dans les régions de retraités.',
      minus: 'Chaque usage recule l’année rêvée. Dès 1962, les jeunes fuient (−1 soutien dans 1 à 3 régions étudiantes). À l’âge de pierre : fou rire général. Et les deux nostalgiques se volent les mêmes électeurs.',
      learn: 'Les retraités votent beaucoup plus que les jeunes : les séduire rapporte. Mais promettre le passé a une limite.' },
    rose: { parties: ['SM'], icon: '🌹', name: 'La rose qui perd ses pétales',
      plus: 'Action « Rappeler un ancien » (1 € + 1 ★) : 2 fois sur 3, un pétale revient et ramène des électeurs partis chez un voisin. Rose complète : elle refleurit (bonus).',
      minus: 'Sinon, l’ancien sort un livre qui règle ses comptes (+2 casseroles). Et la primaire perpétuelle (au tour 4 en format classique) : soit tu perds une action, soit tu tranches et un courant claque la porte.',
      learn: 'Depuis 2017, une partie des électeurs socialistes est partie vers le centre, les écologistes ou la gauche radicale. Les querelles internes coûtent cher.' },
    centre: { parties: ['EM', 'MD', 'HZ'], icon: '🚦', name: 'L’embouteillage au milieu',
      plus: 'Action « Fusionner » (1 € + 2 ★) : absorber le micro-parti et récupérer ses militants (+1 soutien dans 3 régions). Mais les deux autres partis du centre en profitent aussi, gratuitement.',
      minus: 'Là où les trois partis du centre ont chacun 4 soutiens ou plus, un Meeting rapporte 1 soutien de moins. Et en cours de campagne naît un micro-parti centriste qui grignote une part des voix de chacun, tant que personne ne l’absorbe.',
      learn: 'Quand plusieurs partis proposent presque la même chose, ils se partagent les mêmes électeurs. D’où l’appel au « vote utile ».' },
    transparent: { parties: ['UG'], icon: '🔍', name: 'Avis de recherche',
      plus: 'Quand personne ne te regarde, on ne tire pas non plus sur toi : une attaque ne te fait perdre qu’un soutien. Action « Le coup d’éclat » (3 € + 2 ★) : +1 soutien dans 3 régions et les caméras reviennent pour 3 tours.',
      minus: 'Quand le Rassemblement Nostalgique et Réforme Encore sont devant toi et que tu n’es pas dans le trio de tête, tu deviens transparent : une fois sur deux (une sur quatre en format éclair), ta Télé et tes Buzz tombent dans le vide.',
      learn: 'Coincée entre deux pôles plus forts, une famille politique peut disparaître des écrans : c’est la « tripartition ».' },
    disque: { parties: ['FI'], icon: '📀', name: 'Le disque rayé',
      plus: 'Chaque message coche un mot du bingo. Une ligne complète : les militants s’enflamment (+1 soutien dans chaque région où tu as 3 soutiens ou plus). En débat, la réplique « Comme je le disais déjà… ».',
      minus: 'Après un bingo, les indécis zappent : jusqu’à la fin du tour suivant, Meeting et Télé rapportent 1 soutien de moins là où tu as 3 soutiens ou moins.',
      learn: 'Parler à sa base mobilise les convaincus ; répéter les mêmes mots lasse les indécis. Tout l’art est d’élargir sans se renier.' }
  };
  /* ⏪ Les crans de la machine à remonter le temps (le 6e est l'âge de pierre) */
  var NOSTALGIA = [
    { year: '1990', thing: 'le Minitel', what: 'le retour du Minitel' },
    { year: '1975', thing: 'le franc', what: 'le retour du franc et du téléphone à cadran' },
    { year: '1962', thing: 'l\u2019ORTF', what: 'le retour de l’ORTF et de la chaîne unique' },
    { year: '1905', thing: 'une diligence', what: 'le retour de la diligence' },
    { year: '1515', thing: 'une chandelle', what: 'le retour de la chandelle et des châteaux forts' },
    { year: 'l’âge de pierre', thing: 'une massue', what: 'le retour du feu de bois et de la massue' }
  ];
  /* 🌹 Les 5 pétales de la rose et le parti voisin vers lequel chacun peut partir (null : les fidèles ne partent jamais) */
  var PETALS = [
    { id: 'soclib', name: 'les sociaux-libéraux', to: 'EM', start: false },
    { id: 'gauche', name: 'l’aile gauche', to: 'FI', start: false },
    { id: 'eco', name: 'les écolos du parti', to: 'VP', start: true },
    { id: 'elus', name: 'les élus locaux', to: 'MD', start: true },
    { id: 'fideles', name: 'les fidèles', to: null, start: true }
  ];
  /* 🚦 Les micro-partis centristes qui naissent en cours de campagne */
  var MICRO = ['Ensemble Mais Séparés', 'Le Mouvement du Juste Équilibre Modéré', 'Renaissance Bis', 'Agir Peut-Être', 'Le Centre du Centre', 'Les Raisonnables Unis'];
  /* 📀 Le bingo de La France Indignée : 9 mots, la plupart liés à un thème (les autres se cochent à défaut) */
  var BINGO = [
    { w: '6e République' }, { w: 'les riches', th: 'pouvoir' }, { w: 'insoumission' },
    { w: 'l’hôpital', th: 'services' }, { w: 'le peuple' }, { w: 'planification écologique', th: 'ecologie' },
    { w: 'les patrons voyous', th: 'emploi' }, { w: 'la police', th: 'securite' }, { w: 'l’accueil digne', th: 'immigration' }
  ];
  var BINGO_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

  var EVENTS = [
    { id: 'crise', theme: 'pouvoir',      title: 'Crise économique',         text: 'Chaque parti perd 2 €.' },
    { id: 'greve', theme: 'services',      title: 'Grève des transports',     text: 'Ce tour, les Meetings coûtent 1 € de plus.' },
    { id: 'scandale',   title: 'Scandale !',               text: 'Le parti en tête perd 2 soutiens dans sa plus grande région.' },
    { id: 'buzz',       title: 'Trend viral',              text: 'Ce tour, les Buzz sont gratuits.' },
    { id: 'sondage',    title: 'Sondage surprise',         text: 'Le dernier au classement gagne 2 ★.' },
    { id: 'fete',       title: 'Fête nationale',           text: 'Tous les partis gagnent 1 ★.' },
    { id: 'division',   title: 'Guerre des chefs',         text: "Division : chaque parti perd 1 soutien dans sa région la plus forte (2 pour Les Rescapés)." },
    { id: 'fuite',      title: 'Fuite de documents',       text: 'Chaque parti perd 1 ★.' },
    { id: 'salon', theme: 'ecologie',      title: "Salon de l'agriculture",   text: 'Chaque parti gagne 1 soutien dans la région rurale où il est le plus fort.' },
    { id: 'usine', theme: 'emploi',      title: "Fermeture d'usine",        text: 'Dans les régions industrielles, le parti qui contrôle perd 1 soutien.' },
    { id: 'patrimoine', title: 'Journées du patrimoine',   text: 'Chaque parti gagne 1 soutien dans la région historique où il est le plus fort.' },
    { id: 'mecene',     title: 'Mécène généreux',          text: 'Le dernier au classement gagne 3 €.' },
    { id: 'bouchons', title: 'Bouchons sur le périph',   text: "Le parti qui contrôle l'Île-de-France perd 1 soutien." },
    { id: 'calme',      title: 'Rentrée tranquille',       text: 'Il ne se passe rien. Profitez-en.' },
    { id: 'division2',  title: 'Congrès houleux',          text: "Division : chaque parti perd 1 soutien dans sa région la plus forte (2 pour Les Rescapés)." }
  ];

  var OBJECTIVES = [
    { id: 'ouest',      name: 'Le Grand Ouest',        text: 'Contrôler Bretagne, Pays de la Loire et Normandie', bonus: 4 },
    { id: 'territoires',name: 'France des territoires', text: 'Contrôler 3 régions rurales',                        bonus: 4 },
    { id: 'industrie',  name: 'Le cœur industriel',     text: 'Contrôler les 2 régions industrielles',             bonus: 4 },
    { id: 'patrimoine', name: 'Le patrimoine',          text: 'Contrôler 3 régions historiques',                   bonus: 4 },
    { id: 'paris',      name: "Paris d'abord",          text: "Contrôler l'Île-de-France",                         bonus: 3 },
    { id: 'terrains',   name: 'Sur tous les terrains',  text: 'Contrôler au moins une région de chaque type : urbaine, rurale, industrielle et historique', bonus: 3 },
    { id: 'debat',      name: 'Maître du débat',        text: 'Gagner 2 débats',                                   bonus: 3 },
    { id: 'corse',      name: 'Au-delà de l\'Hexagone',   text: 'Contrôler la Corse, l\'outre-mer et les Français de l\'étranger', bonus: 3 }
  ];

  /* v2.8 : les formats de campagne. Le format éclair remplace ces règles le temps d'une partie (voir E.setFormat). */
  var FORMATS = {
    classique: { name: 'Classique', turns: 8, text: '8 tours, une vingtaine de minutes.' },
    eclair: { name: 'Éclair', turns: 3, text: '3 tours, une partie dans le métro.',
      rules: { maxTurns: 3, debateTurns: [3], crisisStart: [1, 1], registerTurns: 1, othersKeep: 0.5, primaireTurns: [], microTurns: [2], hiddenMiss: 0.25,
               novelty: { turns: 2, strongTurns: 1, start: 3 }, incomeMoney: 8,
               /* v2.8.1 : rééquilibrage. En 3 tours, le parti qui part en tête n'avait pas le temps d'être rattrapé :
                  chaque Meeting et chaque passage Télé rapporte plus, les cagnottes de départ se rapprochent,
                  et l'usure d'En Mouvement frappe au tour 2. (1 200 parties simulées, voir ROADMAP) */
               terrainCubes: [2, 2, 3, 4, 5], mediaCubes: [1, 1, 2, 2, 3], wearTurn: 2, moneyBlend: 0.6 } }
  };
  var RULES = {
    maxTurns: 8,
    /* v3.1 : traits satiriques */
    nostalgieGain: [3, 3, 4, 4, 4], nostalgieYouth: [0, 0, 1, 2, 3],
    rappelChance: 0.65, rappelSwing: 3, rappelCas: 2, primaireTurns: [4], primaireCut: 3,
    jamMin: 4, microTurns: [4], microCut: 0.06, fusionGain: 3,
    eclatTurns: 3, eclatGain: 3, hiddenMiss: 0.5,
    bingoZap: 2, bingoBoostMin: 3, bingoZapMax: 3,
    wearTurn: 5,                 // En Mouvement : l'usure du pouvoir frappe à ce tour
    moneyBlend: 0,               // 0 = chaque parti garde sa cagnotte de départ ; 1 = tout le monde part avec 5 €
    actionsPerTurn: 3,
    debateTurns: [3, 6, 8],
    incomeMoney: 6, incomePerRegion: 1, incomeRegionMax: 3, incomeInfl: 2,   // v3.6.3 : 6 € par tour (4 avant) : 3 vraies actions même sans région
    minControl: 3, maxCubes: 10, startCubes: 3,
    socle: 0.5,                    // v3.2 : en Réaliste, la moitié des électeurs vote par fidélité (socle électoral)
    weightMin: 0.1, weightMax: 3,    // v3.2 : poids électoral d'un soutien en mode Réaliste (bornes)
    novelty: { turns: 4, strongTurns: 1, start: 3 },   // v2.5 : ton parti tout neuf part d'environ 3 % ; effet nouveauté : +2 cubes en Meeting au tour 1, +1 aux tours 2 à 4
    equalStart: 2,               // v1.1 mode Égalité : 2 électeurs pour chaque parti dans chaque région
    othersKeep: 0.82,            // v1.1 mode Réaliste : à chaque tour, les « autres listes » gardent 82 % de leurs électeurs
    othersTransfer: 0.6,         // au 2nd tour, 60 % des électeurs des autres listes votent pour un finaliste
    startScale: 10,              // mode Réaliste : cubes de départ = score moyen législatives + européennes 2024 (%) × 10 / 100
    spotlightCost: 2,
    /* v1.6 : tous les partis du jeu se présentent au 1er tour (le joueur + les autres, menés par l'ordinateur) */
    rivals: 99,                  // nombre maximal d'adversaires (99 = tous les partis de data.js)
    debateDuels: 3,              // à chaque débat, chaque parti affronte 3 adversaires (et non tous)
    /* v0.2 : axe politique, transferts, élection */
    maxAllianceDistance: 2,
    breakCost: 2,
    incumbentBonus: 1.25,        // prime au sortant : les cubes du parti qui contrôle une région comptent ×1,25 dans les votes
    objectiveVotes: 0.6,         // un objectif réussi rapporte bonus × 0,6 « millions » de voix
    transfer: { 1: 0.55, 2: 0.42, 3: 0.25, 4: 0.12, 5: 0.06 },  // v3.6.4 : report au 2nd tour selon la distance (loin : on s'abstient plutôt)
    cordon: { parties: ['MN', 'RQ'], below: 4.5, factor: 0.35 },
    blocs: { leftMax: 3, left: 0.62, rightMin: 5, right: 0.65, farLeft: 1, farLeftFactor: 0.4 },   // v3.6.7 : union de la gauche, union des droites, la droite reporte peu sur la gauche radicale  // v3.6.4 : gauche et centre (position < 4,5) reportent ×0,35 vers l'extrême droite
    allyTransfer: 0.85,
    edgeMobilization: 1,         // v1.0 : supprimé (aucune source ne le justifie)
    betrayedTransfer: 0.05,
    /* v0.3 : thèmes */
    terrainCubes: [1, 1, 2, 3, 4],   // cubes gagnés en Meeting selon l'impact du message (0 à 4)
    mediaCubes:   [0, 1, 1, 1, 2],   // cubes par région à la Télé selon l'impact (0 à 4)
    mediaRegions: 3,                 // nombre de régions touchées par la Télé
    socialHotBonus: 1,               // bonus du Buzz quand le thème fait l'actu
    /* v0.4 : le candidat et ses troupes */
    formeMax: 4, formeStart: 4, formeRegen: 2, reposForme: 2,   // ⚡ forme du candidat (Meeting et Télé en coûtent 1)
    gaffeChance: 0.4,                // quand la forme tombe à 0 pendant une action : risque de gaffe
    militantsMax: 3,                 // équipes de militants par parti
    momentumStep: 0.015,             // +1,5 point au sondage en un tour = « en dynamique »
    credTalk: 3,                     // 3 actions sur un thème = +1 de crédibilité dessus (2 au plus)
    /* v0.5 : casseroles, dilemmes, crises */
    casseroleMax: 6,
    scandalPerCasserole: 0.08,       // chaque casserole = 8 % de risque de scandale au début du tour
    scandalCubes: 2,
    crisisStart: [2, 4],             // la crise de la partie commence entre le tour 2 et le tour 4
    /* v0.6 : débat télévisé */
    debatePrepMax: 3,                // préparation : jusqu'à 3 ★, +1 point chacune
    /* v0.7 : programme et affaires */
    programmeSize: 5,
    budgetCap: 25,                   // v0.8 : au-delà de 25 Md€ de reste à financer, le programme n'est pas financé
    fundingMax: 5,                   // v3.5.2 : jusqu'à 5 mesures de financement en plus des 5 promesses
    echoScale: 15, echoGoodN: 4, echoBadN: 2,     // écho du programme : +1 cube en Meeting dans ses 4 régions de cœur, −1 dans ses 2 régions hostiles
    budgetCasStep: 15,               // +1 casserole par tranche de 15 Md€ de dépassement
    pharBonus: 1,                    // mesure phare : +1 cube en Meeting sur son thème
    affairPerCasserole: 0.12,        // chaque casserole = 12 % de risque d'affaire par tour
    canardChance: 0.35,              // sinon, Le Canard Déchaîné sort une affaire 35 % du temps
    affairsMax: 2,                   // au plus 2 affaires par tour
    enqueteBase: 0.35, enqueteCas: 0.15, enqueteBackfire: 0.3,
    aiEnqueteMax: 2,                 // v3.6.5 : chaque parti de l'ordinateur enquête 2 fois par partie au plus, sur un rival direct
    /* v1.0 : participation et vote blanc */
    round1Abst: 0.939,           // abstention au 1er tour = abstention du 2nd × 0,939 (26,31 % contre 28,01 % en 2022)
    round1Blank: 0.254,          // blancs et nuls au 1er tour = ceux du 2nd × 0,254 (2,2 % contre 8,7 % des votants en 2022)
    turnoutMax: 0.92,
    mobTurnout: 0.006,           // chaque cube mobilisé = +0,6 point de participation dans la région
    registerTurns: 3,            // jusqu'au tour 3 : Mobiliser inscrit aussi de nouveaux électeurs (+0,3 % d'inscrits)
    attackBlank: 0.003, attackAbst: 0.002, affairAbst: 0.001,   // campagne négative : des électeurs écœurés
    blankOfNonTransfer: 0.35,    // au 2nd tour, part des électeurs non reportés qui votent blanc (le reste s'abstient)
    /* v1.6 : l'entre-deux-tours. Ces taux sont des réglages de jeu (pas des prédictions politiques), à équilibrer.
       Report de base selon la distance sur l'axe : voir « transfer » plus haut. */
    round2: {
      aiActions: 3,                                            // v3.6.1 : l'ordinateur, face à un joueur humain, n'en a que 3
      actions: 4,                                              // v3.6 : 4 actions de chaque finaliste entre les deux tours (3 avant)
      accept: { 1: 0.85, 2: 0.6, 3: 0.3, 4: 0.12, 5: 0.05 },   // chance qu'un parti éliminé accepte un accord, selon la distance
      phareBoost: 1.3,                                         // ×1,3 si on lui accorde sa mesure phare
      retry: 0.6,                                              // ×0,6 à chaque nouvelle demande après un refus
      counterChance: 0.5,                                      // en cas de refus, une chance sur deux qu'il fasse une contre-offre (sa mesure phare)
      endorse: { 1: 0.3, 2: 0.24, 3: 0.15, 4: 0.08, 5: 0.03 },  // v3.6 : des consignes qui pèsent plus // consigne de vote : points de report en plus (moins on est proche, moins les électeurs suivent)
      noneFactor: 0.75,                                        // « ne soutenir personne » : les reports vers les deux finalistes ×0,75
      lukewarm: 0.5,                                           // v3.6.1 : sans accord, une consigne n'est suivie qu'à moitié
      dealBonus: 0.08,                                         // un accord avec concession rend la consigne plus crédible : +8 points (v3.6)
      farDealLoss: 0.03,                                       // un accord avec un parti éloigné (distance 3 ou plus) fait fuir 3 % de ses propres électeurs
      mobilize: 0.02,                                          // « Mobiliser » : +2 % des suffrages, pris dans l'abstention (2 fois au plus, v3.6)
      rassemble: 0.05,                                         // « Rassembler » : +5 points de report de chaque parti éliminé (2 fois au plus, v3.6)
      /* v3.6 : le « front républicain », non systématique. Chaque parti a un indice de rejet (la part des électeurs qui ne voteraient
         jamais pour lui) : les électeurs des partis éliminés votent davantage contre le finaliste le plus rejeté, sauf ceux qui
         en sont proches. Face à deux finalistes aussi rejetés l'un que l'autre, l'effet s'annule. Ordres de grandeur de jeu,
         inspirés des sondages de « vote impossible » : ce ne sont pas des chiffres officiels. */
      reject: { MN: 0.55, RQ: 0.65, FI: 0.55, LO: 0.45, PC: 0.4, DL: 0.4, EM: 0.35, UG: 0.3, SM: 0.3, VP: 0.3, MD: 0.25, HZ: 0.25 },
      barrage: 0.15,                                           // points de report déplacés = 0,15 × l'écart de rejet (v3.6.4 : le cordon fait déjà une partie du barrage)
      maxUses: 2,
      maxTransfer: 0.95
    }
  };


  /* ---------- v2.3 : les élections législatives ----------
     577 circonscriptions, un député chacune, scrutin majoritaire à deux tours (code électoral, articles L123 à L126 et L162).
     Sièges par région : découpage de 2010 (REGIONS[].seats ; « cor » = Corse 4 + outre-mer 27 + Français de l'étranger 11).
     Les taux ci-dessous sont des réglages de jeu, calés pour retrouver les ordres de grandeur réels depuis 2002 :
     le président obtient une majorité absolue 4 fois sur 5 (2002 : 389 sièges, 2007 : 343, 2012 : 328, 2017 : 351, 2022 : 245). */
  var LEGIS = {
    seats: 577, majority: 289, censureSign: 58,
    electedVotes: 0.5, electedIns: 0.25,     // élu au 1er tour : plus de 50 % des exprimés ET au moins 25 % des inscrits
    qualifyIns: 0.125,                         // qualifié pour le 2nd tour : au moins 12,5 % des inscrits (sinon les deux premiers)
    turnoutRatio: 0.66,                        // participation aux législatives ≈ 2/3 de celle de la présidentielle (47,5 % contre 73,7 % au 1er tour en 2022)
    turnoutDissolution: 0.9,                   // une dissolution mobilise davantage (66,7 % de participation en 2024)
    lowTurnoutPenalty: 0.9,                    // les électorats qui votent peu (jeunes, ouvriers) perdent jusqu'à ~10 % de leurs voix
    blank1: 0.025, blank2: 0.06,               // blancs et nuls (part des votants), 1er et 2nd tour
    loco: 0.1, locoMargin: 1.0,                // effet locomotive : +10 % pour le parti du président, + 1 × son avance au 2nd tour
    locoAlone: 2.2,                            // un président sans union derrière lui : son parti profite encore plus de l'élan (comme en 2017)
    locoUnion: 0.5,                            // ses partenaires d'union en profitent à moitié
    rallyDist: 0.5,                            // ralliements : un parti seul à moins de 0,5 cran du président sur l'axe rejoint sa majorité
    swing: 0.12,                               // l'humeur du pays : d'une élection à l'autre, le camp du président fait mieux ou moins bien que prévu
    confirm: 0.06,                             // effet confirmation : au 2nd tour, +6 points de report vers le camp du président
    loserDip: 0.06,                            // le finaliste battu démobilise un peu
    tilt: 0.7, noise: 0.22,                   // variations locales : penchant gauche-droite de la circonscription, et bruit propre à chaque parti
    unionKeep: 0.85,                           // une candidature unique ne garde pas tous les électeurs des partis qui la soutiennent
    othersStrength: 0.6,                       // les « divers » pèsent dans les exprimés, rarement assez pour gagner
    /* Les candidatures communes par défaut, comme en 2022 et 2024 (gauche unie, majorité présidentielle unie) */
    unions: [
      { id: 'gauche', name: 'Union de la gauche', parties: ['FI', 'PC', 'VP', 'SM'] },
      { id: 'centre', name: 'Union du centre', parties: ['EM', 'MD', 'HZ'] }
    ],
    /* Désistement au 2nd tour (triangulaire) : le 3e se retire si le premier est loin de lui et un autre qualifié proche */
    withdrawFar: 3, withdrawNear: 2, withdrawChance: 0.8,
    /* Reports de voix au 2nd tour selon la distance politique (0 = même famille) */
    transfer2: { 0: 0.85, 1: 0.72, 2: 0.55, 3: 0.3, 4: 0.17, 5: 0.1 },
    turnout2: 0.97,                            // un peu moins de votants au 2nd tour
    /* v2.4 : ta campagne des législatives */
    allyKeep: { 1: 0.92, 2: 0.82, 3: 0.65, 4: 0.5, 5: 0.4 },    // part des électeurs d'un allié qui suivent la candidature commune, selon sa distance au président
    /* chance qu'un parti accepte une alliance, selon l'écart sur l'axe gauche-droite : facile dans son camp, possible au-delà
       (gauche modérée, écologistes et droite par exemple), presque impossible aux deux bouts */
    allyAccept: [{ gap: 0.8, p: 0.85 }, { gap: 1.6, p: 0.6 }, { gap: 2.4, p: 0.35 }, { gap: 3.2, p: 0.15 }, { gap: 99, p: 0.05 }],
    cordon: { parties: ['MN', 'RQ'], below: 5, factor: 0.4 },   // le « cordon sanitaire » : la droite nationale et ceux qui sont loin d'elle se méfient les uns des autres
    allyDealBonus: 0.15,                       // +15 % s'il t'a soutenu au 2nd tour de la présidentielle
    allyOffers: 3,
    oppoFamilyCut: 0.5,                        // v2.7 : dans l'opposition, un parti de la famille du président dit oui moitié moins souvent                             // propositions d'alliance avant la campagne
    campaign: { turns: 2, actions: 3,
      meeting: 0.1, meetingPop: 2, meetingMax: 1, meetingOppo: 0.07,   // v2.7 : dans l'opposition, c'est ton grand meeting de chef de parti (+7 %, sans coût)    // le président en meeting : +10 % pour ton camp dans la région, −2 de popularité, une fois par tour
      vedette: 0.08, vedetteMax: 2,                  // investir une vedette : +8 % dans la région, 2 vedettes en tout
      mobilise: 0.04, mobiliseLow: 0.03,             // mobiliser : +4 %, +3 % de plus là où l'on vote peu
      clip: 0.02,                                    // le clip national : +2 % partout
      repeat: 0.6,                                   // une même région rapporte moins à chaque nouvelle action (×0,6)
      aiBoost: 0.05, aiRegions: 2 },                 // les autres blocs font campagne : +5 % dans 2 régions par tour
    safeMargin: 0.05,                          // au-delà de 5 points d'avance (ou de retard) projetés, une circonscription est sûre (ou perdue)
    pactBonus: 0.05,                           // un pacte de désistement est un peu plus facile à obtenir qu'une alliance (même calcul, +5 points)
    pactGive: 0.1,                             // les électeurs du partenaire de pacte : +10 points de report vers toi
    barrageCut: 0.5, barrageGive: 0.1          // ta consigne de barrage : moitié moins vers le bloc visé, +10 points vers l'autre
  };


  /* ---------- v2.6 : le gouvernement ----------
     6 postes, chacun lié aux thèmes du jeu. Les profils sont des personnages inventés (noms en jeux de mots).
     Les effets sont des réglages de jeu. */
  var MINISTRY = {
    posts: [
      { id: 'pm',    icon: '🏛️', name: 'Premier ministre',                 short: 'Matignon',   themes: [],                      text: 'Fait voter tes lois. Un fusible que l\'on peut sacrifier pour remonter dans les sondages.' },
      { id: 'eco',   icon: '💶', name: 'Économie, Finances et Industrie',  short: 'Bercy',      themes: ['pouvoir', 'emploi'],   text: 'Le budget et l\'emploi : un bon ministre fait baisser le déficit.',
        measures: ['executive_pay_tax', 'bank_balance_tax', 'large_life_insurance', 'data_tax', 'digital_ads_tax', 'crypto_tax', 'luxury_vat', 'luxury_homes_tax', 'vacant_offices', 'concession_rent', 'carbon_imports', 'unused_buildable_land', 'aid_clawback', 'dormant_patents', 'intragroup_debt', 'carried_interest', 'pay_gap_tax', 'cir_cut'] },
      { id: 'int',   icon: '🚓', name: 'Intérieur',                         short: 'Intérieur',  themes: ['securite', 'immigration'], text: 'La sécurité et l\'immigration.' },
      { id: 'sante', icon: '🏥', name: 'Santé',                             short: 'Santé',      themes: ['services'],            text: 'L\'hôpital, les médecins, les épidémies.' },
      { id: 'educ',  icon: '🎒', name: 'Éducation nationale',               short: 'Éducation',  themes: ['services'],            text: 'L\'école et les enseignants.', measures: ['classes'] },
      { id: 'eco2',  icon: '🌿', name: 'Transition écologique',             short: 'Écologie',   themes: ['ecologie'],            text: 'Les canicules, l\'énergie, les transports.',
        measures: ['flight_frequency_tax', 'nonrecyclable_packaging', 'land_artificialisation'] }
    ],
    traits: {
      gaffeur:   { name: 'Gaffeur',             icon: '🙊', text: 'Une petite phrase peut lui échapper à tout moment.' },
      bourreau:  { name: 'Bourreau de travail', icon: '💪', text: 'Ses lois passent mieux et rapportent plus.' },
      reseau:    { name: 'Réseau à l\'Assemblée', icon: '📇', text: 'Ramène des voix en plus pour tes lois.' },
      casserole: { name: 'Casserole cachée',    icon: '🍳', text: 'Une vieille affaire peut ressortir.' },
      ambitieux: { name: 'Ambitieux',           icon: '👑', text: 'Peut te lâcher si tu faiblis, pour préparer sa candidature.' }
    },
    names: {
      f: ['Anne Alyse', 'Claire Voyance', 'Lucie Dité', 'Rose Mérite', 'Annie Versaire', 'Inès Thétique', 'Sophie Losophie', 'Margot Uvernance', 'Laure Atoire', 'Camille Itante', 'Nadia Logue', 'Jade Ministrée'],
      m: ['Hugo Vernement', 'Bruno Tation', 'Gaston Fiscal', 'Olivier Rapport', 'Jules Ministère', 'Rémi Nistre', 'Paul Itique', 'Max Imum', 'Basile Icone', 'Léon Dégalité', 'Yann Térim', 'Félix Cal']
    },
    /* v3.0 : les figures de chaque parti, en version satirique (mêmes initiales que leurs modèles réels).
       Elles deviennent tes ministres, tes députés, ou les ministres d'ouverture venus d'un parti rival. */
    figures: {
      FI: [['Manuel Bombarde', 'm'], ['Mathilde Panique', 'f'], ['Clémence Guérilla', 'f'], ['Éric Coquelicot', 'm'], ['Louis Boucan', 'm'], ['Sophia Chicane', 'f']],
      SM: [['Olivier Fauteuil', 'm'], ['Boris Vaudeville', 'm'], ['Anne Hipster', 'f'], ['Carole Dégainée', 'f'], ['François Hésitant', 'm'], ['Johanna Roulette', 'f']],
      VP: [['Sandrine Rouspète', 'f'], ['Yannick Jardinet', 'm'], ['Cyrielle Châtaigne', 'f'], ['Éric Pédalo', 'm'], ['Grégory Doucement', 'm']],
      EM: [['Gérald Dans-le-Vent', 'm'], ['Élisabeth Bornée', 'f'], ['Aurore Bergerie', 'f'], ['Yaël Brouhaha-Pivot', 'f'], ['Stéphane Séjour', 'm']],
      UG: [['Laurent Wapiti', 'm'], ['Xavier Bougonnant', 'm'], ['Valérie Patraque', 'f'], ['David Lissé', 'm'], ['Rachida Dorures', 'f']],
      MN: [['Jordan Brushing', 'm'], ['Sébastien Chenille', 'm'], ['Jean-Philippe Tangage', 'm'], ['Louis Alibi', 'm'], ['Laure Lavande', 'f']],
      LO: [['Jean-Pierre Merguez', 'm'], ['Arlette Lagrève', 'f']],
      PC: [['André Chasse-neige', 'm'], ['Ian Brasero', 'm'], ['Stéphane Peuple', 'm'], ['Léon Défilé', 'm']],
      MD: [['Marc Fermier', 'm'], ['Jean-Noël Barrage', 'm'], ['Geneviève Discrète', 'f'], ['Jean-Louis Bourdonnant', 'm']],
      HZ: [['Christophe Béton', 'm'], ['Frédéric Valsetout', 'm'], ['Laurent Marchepied', 'm']],
      RQ: [['Sarah Krampon', 'f'], ['Stanislas Rigolo', 'm']],
      DL: []
    },
    draw: { parti: 3, allie: 2, expert: 2, ouverture: 1 },
    parity: 1,               // gouvernement paritaire (3 femmes, 3 hommes) : +1 de popularité ; très déséquilibré (5 ou 6 du même sexe) : −1
    ouverture: 2,            // une personnalité d'ouverture : +2 de popularité… mais ton camp grogne (frondeurs en plus la 1re année)
    ouvertureFronde: 0.05,
    network: 12,             // « Réseau à l'Assemblée » : jusqu'à 12 députés de plus pour une loi de son domaine
    compSat: 0.05,           // chaque étoile de compétence au-dessus de 2 : +5 % d'effet pour les lois du domaine (−5 % en dessous)
    compFronde: 0.05,        // un Premier ministre ou un ministre compétent calme les frondeurs (5 points par étoile)
    ecoDeficit: 0.03,        // un ministre de l'Économie compétent : −0,03 point de déficit par an et par étoile au-dessus de 2
    eventChance: 0.7,        // chaque été, 7 chances sur 10 qu'un ministre fasse l'actualité
    fusible: 4,              // changer de Premier ministre : +4 de popularité la première fois, +1 ensuite
    leaveFronde: 0.1
  };


  /* ---------- v2.7 : l'opposition ----------
     5 ans, 4 trimestres par an : la loi du gouvernement (printemps), l'actualité (été), le jour réservé à l'opposition
     (automne, article 48 : un jour de séance par mois), la motion de censure (hiver, article 49 : 58 signatures pour la
     déposer, 289 voix pour renverser le gouvernement). Les effets sont des réglages de jeu. */
  var OPPO = {
    years: 5, signatures: 58, majority: 289,
    presPop0: 55, presWear: 3,             // la popularité du président : 55 % au départ, −3 par an (l'usure du pouvoir)
    lawFit: 0.25,                          // soutenir une loi que tes électeurs aiment (ou combattre une loi qu'ils rejettent) : jusqu'à +0,6 point
    abstain: -0.1,                         // s'abstenir : un peu illisible
    lawPass: 1, lawFail: -2,               // une loi du gouvernement adoptée / rejetée : popularité du président
    nichePass: 0.35, nicheClose: 0.15, nicheLost: 0,   // ta proposition de loi : adoptée, battue de peu, battue largement
    censureFall: 0.3, censureClose: 0.1, censureFlop: -0.4, censurePres: -4,
    oppoDrift: 0.25,                       // chaque année, l'usure du président fait monter tous les partis d'opposition
    coalitionFar: -0.3,                    // une coalition avec un groupe éloigné (distance 3 ou plus) déroute tes électeurs
    crisisHit: 0.2, crisisUnity: 0.1, crisisPlan: 0.15,
    noise: 0.15,
    dissolveIfPop: 45                      // gouvernement renversé : le président dissout s'il est à 45 % ou plus (et si c'est permis), sinon il nomme un nouveau Premier ministre
  };

  /* ---------- v4.1 : le mode Bêta ----------
     Une copie du mode Réaliste qui sert de banc d'essai : chaque nouvelle règle ou simplification y est testée
     avant de passer dans les autres modes. La liste ci-dessous s'affiche au menu. */
  var BETA = {
    name: 'Bêta 🧪',
    text: 'Le mode Réaliste, avec les nouvelles règles à tester.',
    rules: {
      incumbentBonus: 1,   // pas de prime au sortant : tenir une région ne donne plus +25 % de voix cachées
      socle: 0.3           // socle figé : 30 % du vote reste fidèle aux scores historiques (50 % en Réaliste)
    },
    /* v4.2 : l'élan de l'outsider (tous les partis). Les soutiens gagnés pendant la campagne, et l'audience, valent
       (référence ÷ score de départ) ^ alpha, entre 1 et max. Un parti à 15 % ou plus : ×1 ; à 2 % : ×3 environ. */
    elan: { ref: 15, alpha: 0.6, max: 4 },
    /* v4.2 : le coup de pouce du joueur, plus fort s'il part bas : 1 + bonus × (1 − départ ÷ 33 %) */
    player: { bonus: 0.5 },
    /* v4.2 : Les Enracinés font foi sur l'écologie */
    eco: { party: 'VP', impact: 1, media: 1.5 },
    changes: [
      'Pas de prime au sortant : tenir une région ne donne plus de voix en plus.',
      'Socle figé à 30 % (au lieu de 50 %) : plus de voix bougent pendant la campagne.',
      'Élan de l\u2019outsider : plus un parti part bas, plus ses nouveaux soutiens et ses passages médias comptent.',
      'Coup de pouce du joueur : ton parti a un bonus, d\u2019autant plus fort que tu pars bas.',
      'Les Enracinés font foi sur l\u2019écologie : +1 d\u2019impact et +50 % en interview sur ce thème.'
    ]
  };

  /* ---------- v3.8 : les médias et les classes sociales ----------
     Le terrain (Meeting, Mobiliser…) gagne des soutiens dans UNE région. Les médias (Télé, Matinale, 20h, Débat)
     gagnent de l'audience auprès d'une CLASSE SOCIALE, partout en France à la fois. */

  /* Profil social de départ de chaque parti : son score dans chaque groupe ÷ son score d'ensemble.
     Source : Ipsos, sondage jour du vote des européennes 2024 (8 923 inscrits, 6-7 juin 2024), tableau « selon la profession ».
     Employés et ouvriers = moyenne des deux lignes. Étudiants et sans emploi = moyenne « au chômage » et « 18-24 ans ».
     Indépendants : pas de ligne dans l'enquête, profil neutre (1). RE, MoDem et Horizons = la liste commune (Hayer).
     LO et DLF = la colonne « une autre liste ». */
  var CLASS_PROF = {
    FI: { cad: 1.21, pi: 1.01, pop: 1.26, ret: 0.40, sae: 2.58, ind: 1 },
    PC: { cad: 0.83, pi: 0.83, pop: 0.83, ret: 1.25, sae: 1.04, ind: 1 },
    VP: { cad: 1.45, pi: 1.64, pop: 1.09, ret: 0.55, sae: 1.64, ind: 1 },
    SM: { cad: 1.45, pi: 1.09, pop: 0.65, ret: 1.16, sae: 0.51, ind: 1 },
    EM: { cad: 0.96, pi: 0.82, pop: 0.38, ret: 1.51, sae: 0.45, ind: 1 },
    MD: { cad: 0.96, pi: 0.82, pop: 0.38, ret: 1.51, sae: 0.45, ind: 1 },
    HZ: { cad: 0.96, pi: 0.82, pop: 0.38, ret: 1.51, sae: 0.45, ind: 1 },
    UG: { cad: 1.25, pi: 0.83, pop: 0.42, ret: 1.39, sae: 0.76, ind: 1 },
    MN: { cad: 0.64, pi: 0.92, pop: 1.47, ret: 0.92, sae: 0.92, ind: 1 },
    RQ: { cad: 0.91, pi: 0.91, pop: 0.91, ret: 1.09, sae: 1.00, ind: 1 },
    LO: { cad: 1.03, pi: 1.24, pop: 1.13, ret: 0.72, sae: 0.98, ind: 1 },
    DL: { cad: 1.03, pi: 1.24, pop: 1.13, ret: 0.72, sae: 0.98, ind: 1 }
  };
  var CLASS_SRC = { label: 'Ipsos — Européennes 2024, sociologie des électorats (vote selon la profession)', url: 'https://www.ipsos.com/fr-fr/europeennes-2024/sociologie-des-electorats-2024' };
  /* Ce qui touche chaque groupe : la part du ❤️ cœur (le reste, c'est la 🧠 tête). Les cadres veulent des preuves, les ouvriers qu'on les comprenne. */
  var HEART = { pop: 0.7, sae: 0.65, ind: 0.45, pi: 0.5, ret: 0.4, cad: 0.25 };
  /* Le « bloc central » au pouvoir : il ne peut pas attaquer le bilan du gouvernement, il le défend */
  var MAJORITY = ['EM', 'MD', 'HZ'];
  var MEDIA = {
    k: 0.012,         // 1 point d'audience = environ +1,2 point de vote dans ce groupe
    keep: 0.85,       // l'audience s'use : elle garde 85 % de sa force à chaque tour
    min: -30, max: 30,   // v4.0.2 : bornes larges (l'ancien plafond de 8 bloquait les gains des candidats très médiatisés)
    scale: { tele: 0.5, matinale: 0.35, vingt: 1, debat: 0.7 },
    gaffePromise: 0.3 // promesse improvisée : 30 % de risque de casserole
  };
  /* v3.9 : les matinales radio (parodies). segs = qui écoute ; lean = le bord politique des auditeurs (positions sur l'axe, 0 à 7) */
  var STATIONS = [
    { id: 'inter',  name: 'France Intérieure',  parody: 'France Inter', icon: '📻', segs: { cad: 1.6, pi: 1.5, ret: 1.2, sae: 0.9, pop: 0.6, ind: 0.6 }, lean: [2, 4.4],
      desc: 'La matinale des cadres, des profs et des retraités curieux. Auditeurs plutôt à gauche et au centre.' },
    { id: 'nova',   name: 'Radio Nouba',        parody: 'Radio Nova',   icon: '🎧', segs: { sae: 1.9, pi: 1.2, cad: 1.0, pop: 0.8, ind: 0.5, ret: 0.3 }, lean: [0, 2],
      desc: 'Les jeunes des grandes villes, entre deux morceaux. Auditeurs à gauche toute.' },
    { id: 'europe', name: 'Europe Hier',        parody: 'Europe 1',     icon: '📼', segs: { ret: 1.6, ind: 1.4, pop: 1.0, cad: 0.9, pi: 0.6, sae: 0.4 }, lean: [5.5, 7],
      desc: 'Les retraités et les petits patrons, nostalgiques d\u2019une France d\u2019avant. Auditeurs très à droite.' },
    { id: 'rmc',    name: 'Radio Mon Comptoir', parody: 'RMC',          icon: '☕', segs: { pop: 1.8, ind: 1.5, ret: 0.8, pi: 0.8, sae: 0.8, cad: 0.5 }, lean: null,
      desc: 'Les ouvriers et les artisans, au café ou au volant. Des auditeurs de tous bords, qui ne font de cadeau à personne.' }
  ];
  /* Accueil d'un candidat selon le bord de la radio : public acquis, partagé ou hostile */
  var STATION_FIT = { home: 1.25, near: 1, far: 0.7 };
  var VINGT = { top: 4, stage: 0.25, stagePerForme: 0.05, stageMin: 0.05 };   // le trac du direct : 25 % − 5 % par ⚡ qu'il te reste (5 % au moins)
  /* Les types de réponse */
  var ANSWERS = {
    emotion:   { name: 'Émotion',            icon: '❤️' },
    mesure:    { name: 'Ma mesure',          icon: '💡' },
    promesse:  { name: 'Promesse improvisée', icon: '🎲' },
    attaque:   { name: 'Attaquer le bilan',  icon: '🥊' },
    bilan:     { name: 'Défendre le bilan',  icon: '🛡️' },
    recentrer: { name: 'Recentrer',          icon: '🙃' },
    disque:    { name: 'Comme je le disais déjà…', icon: '📀' }
  };
  /* v4.0 : le débat. Chaque réponse a un registre ; certains registres en contrent d'autres (avec la phrase qui va avec). */
  var DEB_REG = { emotion: 'emotion', disque: 'emotion', mesure: 'chiffres', bilan: 'chiffres', attaque: 'attaque', promesse: 'promesse', recentrer: 'esquive' };
  var DEB_BEATS = {
    'emotion>chiffres':  '« Vous parlez de chiffres, je parle de gens. »',
    'chiffres>attaque':  'Fact-check en direct : les chiffres démontent l\u2019attaque.',
    'attaque>emotion':   '« Vous n\u2019avez pas le monopole du cœur. » (Giscard à Mitterrand, 1974)',
    'attaque>promesse':  '« Et vous la financez comment, votre promesse ? »',
    'chiffres>promesse': '« Votre promesse ne tient pas : les chiffres sont têtus. »'
  };
  var DEB_REG_NAME = { emotion: '❤️ émotion', chiffres: '📊 chiffres (mesure, bilan)', attaque: '🥊 attaque', promesse: '🎲 promesse', esquive: '🙃 recentrer' };
  var DEBATE = {
    win: 1.3, lose: 0.5,     // la réponse qui contre l'autre gagne 30 % ; celle qui est contrée perd la moitié
    prep: 0.15,              // chaque ★ de préparation : +15 % sur tes réponses (et tu lis la fiche de l'adversaire)
    winBonus: 0.8,           // le vainqueur de la soirée : +0,8 d'audience dans toutes les classes (×2 au grand débat final)
    faceSwing: 0.1, faceMax: 0.03   // face-à-face : l'écart de points déplace jusqu'à 3 % des voix du perdant vers le gagnant
  };
  /* Les questions des journalistes. meas = les mesures du programme qui y répondent vraiment. segs = qui se sent concerné (1 = normal). emo / atk / def : la réponse type.
     emoD : variante de l'émotion pour la droite (thèmes où gauche et droite ne parlent pas aux mêmes peurs). */
  var QUESTIONS = [
    { id: 'p_caddie', theme: 'pouvoir', meas: ['smic', 'energie', 'tva', 'cheque', 'superprofits'], ask: 'Les ménages modestes doivent choisir entre faire le plein et remplir leur caddie. Que leur répondez-vous ?',
      segs: { pop: 1.5, sae: 1.3, ret: 0.9, pi: 0.8, ind: 0.7, cad: 0.4 },
      emo: 'Je pense à cette aide-soignante qui saute un repas pour pouvoir payer l’essence et aller travailler.',
      atk: 'Les prix ont flambé et le gouvernement a regardé ailleurs pendant des mois.',
      def: 'Nous avons bloqué les prix de l’énergie avec le bouclier tarifaire : sans lui, les factures auraient explosé.' },
    { id: 'p_loyer', theme: 'pouvoir', meas: ['smic', 'renovation'], ask: 'Beaucoup de jeunes actifs laissent plus d’un tiers de leur salaire dans leur loyer. Comment les aider ?',
      segs: { sae: 1.6, pop: 1.2, pi: 1.1, cad: 0.7, ind: 0.6, ret: 0.4 },
      emo: 'J’ai rencontré une infirmière qui dort dans sa voiture deux nuits par semaine, faute de logement près de l’hôpital.',
      atk: 'On construit de moins en moins de logements, et le gouvernement n’a aucun plan.',
      def: 'Nous avons simplifié les permis de construire et lancé des logements pour les classes moyennes.' },
    { id: 'p_pension', theme: 'pouvoir', meas: ['energie', 'cheque'], ask: 'Beaucoup de retraités vivent avec moins de 1 000 € par mois. Que faites-vous pour eux ?',
      segs: { ret: 1.8, pop: 0.9, ind: 0.8, pi: 0.6, sae: 0.4, cad: 0.4 },
      emo: 'Une dame de 78 ans m’a dit : « J’ai travaillé quarante ans, et je choisis entre le chauffage et le médecin. »',
      atk: 'Les retraités ont payé la facture de ce gouvernement : pensions rabotées, médicaments plus chers.',
      def: 'Nous avons revalorisé les pensions face à l’inflation et relevé les petites retraites.' },

    { id: 'e_usine', theme: 'emploi', meas: ['reindus', 'pme', 'superprofits'], ask: 'Une usine de 800 salariés va fermer. Que dites-vous aux ouvriers ce soir ?',
      segs: { pop: 1.7, ind: 0.9, sae: 1.0, pi: 0.9, ret: 0.6, cad: 0.6 },
      emo: 'Derrière 800 emplois, il y a 800 familles, une école qui perd des classes, un café qui baisse le rideau.',
      atk: 'Le gouvernement a laissé partir nos usines en jurant que le marché ferait le reste.',
      def: 'Le chômage a nettement baissé et des usines rouvrent : la réindustrialisation a commencé.' },
    { id: 'e_jeunes', theme: 'emploi', meas: ['apprentissage', 'semaine4', 'pme', 'train1'], ask: 'Près d’un jeune actif sur cinq est au chômage. Que lui proposez-vous ?',
      segs: { sae: 1.8, pop: 1.0, pi: 0.8, ind: 0.7, cad: 0.6, ret: 0.3 },
      emo: 'J’ai vu un jeune envoyer 200 CV sans une seule réponse. À 22 ans, il se sent déjà de trop.',
      atk: 'Le gouvernement a supprimé des aides, et les jeunes enchaînent les petits boulots.',
      def: 'L’apprentissage n’a jamais aussi bien marché : plus de 800 000 contrats par an.' },
    { id: 'e_patrons', theme: 'emploi', meas: ['pme', 'reindus'], ask: 'Les artisans et les petits patrons disent crouler sous les charges et la paperasse. Que leur répondez-vous ?',
      segs: { ind: 1.9, cad: 1.0, pi: 0.7, pop: 0.6, ret: 0.5, sae: 0.4 },
      emo: 'Un boulanger m’a montré sa pile de formulaires : il passe ses dimanches à remplir des papiers au lieu de vivre.',
      atk: 'Le gouvernement promet chaque année de simplifier. Chaque année, il y a plus de formulaires.',
      def: 'Nous avons baissé les impôts de production et supprimé des formalités.' },

    { id: 's_medecin', theme: 'services', meas: ['medecins', 'sp20', 'lignes'], ask: 'Dans certains villages, il faut six mois pour voir un médecin. Que proposez-vous ?',
      segs: { ret: 1.5, pop: 1.1, ind: 1.0, pi: 0.9, sae: 0.8, cad: 0.6 },
      emo: 'Un agriculteur m’a raconté avoir fait 80 km avec une fracture parce qu’il n’y avait plus personne près de chez lui.',
      atk: 'Les déserts médicaux s’étendent et le gouvernement ferme les yeux.',
      def: 'Nous avons supprimé le numerus clausus : il y aura bien plus de médecins formés.' },
    { id: 's_ecole', theme: 'services', meas: ['classes', 'sp20'], ask: 'Des milliers de classes n’ont pas de professeur à la rentrée. Comment réparer l’école ?',
      segs: { pi: 1.7, cad: 1.1, pop: 0.9, sae: 0.9, ind: 0.6, ret: 0.5 },
      emo: 'Une maman m’a dit que son fils n’avait pas eu de cours de maths depuis Noël.',
      atk: 'Les profs sont épuisés, mal payés, et le gouvernement leur fait la leçon.',
      def: 'Nous avons porté le salaire des professeurs débutants à plus de 2 000 € net par mois.' },
    { id: 's_urgences', theme: 'services', meas: ['medecins', 'sp20'], ask: 'Des urgences ferment la nuit faute de soignants. Que faites-vous ?',
      segs: { pi: 1.3, ret: 1.3, pop: 1.0, sae: 0.8, cad: 0.7, ind: 0.7 },
      emo: 'Une infirmière m’a dit qu’elle pleurait dans sa voiture avant chaque garde de nuit.',
      atk: 'On ferme des lits pendant que les patients attendent sur des brancards.',
      def: 'Nous avons augmenté les salaires des soignants avec le Ségur de la santé.' },

    { id: 'ec_chaleur', theme: 'ecologie', meas: ['renovation', 'plastique', 'jets', 'train1'], ask: 'Les étés sont de plus en plus brûlants. Que faites-vous, concrètement, pour le climat ?',
      segs: { cad: 1.4, pi: 1.3, sae: 1.3, ret: 0.7, pop: 0.6, ind: 0.6 },
      emo: 'Cet été, des enfants ont eu cours à 38 °C dans des classes sans volets. Ce sont eux qui vivront ce climat.',
      atk: 'Le gouvernement fait de beaux discours au sommet et recule dès qu’il faut agir.',
      def: 'Nos émissions de gaz à effet de serre baissent plus vite qu’avant : on tient le cap.' },
    { id: 'ec_voiture', theme: 'ecologie', meas: ['train1', 'lignes', 'tva', 'renovation'], ask: 'À la campagne, sans voiture on ne peut rien faire. Comment rendre l’écologie juste pour ces gens-là ?',
      segs: { pop: 1.3, ind: 1.2, ret: 1.0, pi: 0.9, sae: 0.8, cad: 0.5 },
      emo: 'On ne peut pas demander à une caissière qui fait 50 km par jour d’acheter une voiture électrique à 35 000 €.',
      atk: 'Le gouvernement fait payer l’écologie aux plus modestes et épargne les plus gros pollueurs.',
      def: 'Nous avons lancé la voiture électrique en location à 100 € par mois pour les ménages modestes.' },
    { id: 'ec_agri', theme: 'ecologie', meas: [], ask: 'Les agriculteurs disent que les normes écologiques les étranglent. Que leur répondez-vous ?',
      segs: { ind: 1.8, ret: 1.0, pop: 0.8, pi: 0.7, cad: 0.7, sae: 0.5 },
      emo: 'Un éleveur gagne moins que le Smic en travaillant 70 heures par semaine. Il nourrit la France, il mérite mieux.',
      atk: 'Le gouvernement a empilé les normes sans jamais protéger les prix agricoles.',
      def: 'Nous avons simplifié les règles et fait voter les lois Égalim pour mieux payer les agriculteurs.' },

    { id: 'se_quartier', theme: 'securite', meas: ['policiers', 'proximite', 'video'], ask: 'Dans certains quartiers, des habitants n’osent plus sortir le soir. Que leur répondez-vous ?',
      segs: { ret: 1.3, pop: 1.3, ind: 1.0, pi: 0.8, sae: 0.8, cad: 0.6 },
      emo: 'Les premières victimes de l’insécurité, ce sont les habitants des quartiers populaires, pas les beaux quartiers.',
      emoD: 'Une retraitée m’a dit qu’elle ne sortait plus faire ses courses après 17 heures. En France, en 2027 !',
      atk: 'Le gouvernement promet de l’ordre à chaque fait divers. Rien ne change dans les quartiers.',
      def: 'Nous avons recruté des milliers de policiers et de gendarmes supplémentaires.' },
    { id: 'se_drogue', theme: 'securite', meas: ['policiers', 'planchers', 'proximite', 'video'], ask: 'Le trafic de drogue gagne les villes moyennes. Comment l’arrêter ?',
      segs: { ret: 1.2, pop: 1.2, pi: 1.0, ind: 0.9, cad: 0.8, sae: 0.8 },
      emo: 'Des enfants de 13 ans servent de guetteurs pour 50 € la journée. On est en train de perdre une génération.',
      emoD: 'Des points de deal s’installent au pied des écoles. Les parents ont peur, et ils ont raison.',
      atk: 'Les opérations « coup de poing » font des images, mais les trafics reviennent dès le lendemain.',
      def: 'Nous avons créé un parquet national contre le crime organisé et renforcé les saisies sur les biens des trafiquants.' },
    { id: 'se_justice', theme: 'securite', meas: ['planchers'], ask: 'Les victimes trouvent la justice trop lente. Comment la rendre plus rapide ?',
      segs: { ret: 1.2, ind: 1.1, cad: 1.0, pi: 1.0, pop: 1.0, sae: 0.7 },
      emo: 'Une femme battue a attendu deux ans son procès. Deux ans à croiser son agresseur dans la rue.',
      atk: 'Les tribunaux manquent de tout et le gouvernement s’en lave les mains.',
      def: 'Le budget de la justice a augmenté chaque année et nous recrutons des magistrats.' },

    { id: 'im_accueil', theme: 'immigration', meas: ['referendum', 'accueil', 'controles', 'regroupement'], ask: 'Faut-il accueillir moins d’étrangers en France, ou les accueillir mieux ?',
      segs: { ret: 1.2, pop: 1.2, ind: 1.0, cad: 0.9, pi: 0.9, sae: 0.8 },
      emo: 'Derrière les chiffres, il y a des familles qui fuient la guerre. On peut être ferme et rester humain.',
      emoD: 'Beaucoup de Français ont le sentiment qu’on ne leur demande jamais leur avis. Ils veulent qu’on les écoute enfin.',
      atk: 'Loi après loi, le gouvernement promet de régler la question. Personne n’y croit plus.',
      def: 'Notre loi immigration a durci les expulsions et facilité l’intégration par le travail.' },
    { id: 'im_travail', theme: 'immigration', meas: ['accueil', 'controles'], ask: 'Le bâtiment et la restauration manquent de bras. Faut-il régulariser les travailleurs sans papiers ?',
      segs: { ind: 1.4, pop: 1.1, cad: 1.0, pi: 0.9, ret: 0.9, sae: 0.8 },
      emo: 'Ils construisent nos maisons et font la plonge dans nos restaurants. Ils paient des cotisations sans aucun droit.',
      emoD: 'Avant de faire venir des bras d’ailleurs, pensons aux millions de Français qui cherchent un emploi.',
      atk: 'Le gouvernement dit tout et son contraire : un jour la fermeté, le lendemain les régularisations.',
      def: 'Nous avons créé un titre de séjour pour les métiers en tension, au cas par cas.' },
    { id: 'im_integration', theme: 'immigration', meas: ['accueil', 'regroupement'], ask: 'Comment réussir l’intégration de ceux qui s’installent en France ?',
      segs: { pi: 1.2, cad: 1.1, ret: 1.0, pop: 1.0, sae: 0.9, ind: 0.8 },
      emo: 'J’ai rencontré une femme arrivée sans un mot de français : elle est aujourd’hui aide-soignante. L’intégration, ça marche quand on s’en donne les moyens.',
      emoD: 'S’intégrer, c’est aimer la France, parler sa langue et respecter ses règles. C’est le minimum.',
      atk: 'Les cours de français manquent, les dossiers traînent : le gouvernement a tout laissé filer.',
      def: 'Nous avons rendu obligatoire un niveau de français pour les titres de séjour longs.' }
  ];

  /* ---------- v0.6 : le débat télévisé ----------
     Chaque parti affronte chacun des autres sur une question (un thème).
     Attaque bat Émotion, Émotion bat Chiffres, Chiffres bat Attaque. Esquive = match nul.
     Manche gagnée = 2 points, nulle = 1, perdue = 0, plus les bonus de chaque réplique. */
  var REPLIES = {
    attaque:  { name: 'Attaque',  icon: '🥊', beats: 'emotion',  hint: 'Bat l\'émotion. +1 si ton rival traîne des casseroles.' },
    chiffres: { name: 'Chiffres', icon: '📊', beats: 'attaque',  hint: 'Bat l\'attaque. +1 si c\'est ton point fort, −1 si ce n\'est pas ton sujet.' },
    emotion:  { name: 'Émotion',  icon: '❤️', beats: 'chiffres', hint: 'Bat les chiffres. +1 si le thème fait l\'actu.' },
    esquive:  { name: 'Esquive',  icon: '🙃', beats: null,       hint: 'Match nul assuré : 1 point chacun.' },
    disque:   { name: 'Comme je le disais déjà…', icon: '📀', beats: 'chiffres', only: 'FI', hint: 'Compte comme l\u2019émotion (bat les chiffres), sans le bonus de l\u2019actu. Coche 2 mots du bingo.' }
  };
  /* Tempérament de chaque parti en débat : probabilité de chaque réplique (l'IA s'adapte aussi au thème) */
  var TEMPERS = {
    FI: { label: 'bagarreur',      w: { attaque: 5, emotion: 3, chiffres: 1, esquive: 1 } },
    VP: { label: 'passionné',      w: { emotion: 5, chiffres: 2, attaque: 2, esquive: 1 } },
    SM: { label: 'raisonnable',    w: { chiffres: 4, emotion: 3, esquive: 2, attaque: 1 } },
    EM: { label: 'technocrate',    w: { chiffres: 5, esquive: 3, attaque: 1, emotion: 1 } },
    UG: { label: 'solennel',       w: { chiffres: 3, attaque: 3, emotion: 2, esquive: 2 } },
    MN: { label: 'tribun',         w: { attaque: 4, emotion: 4, esquive: 1, chiffres: 1 } },
    LO: { label: 'militant',       w: { attaque: 4, emotion: 3, chiffres: 2, esquive: 1 } },
    PC: { label: 'gouailleur',     w: { emotion: 4, attaque: 3, chiffres: 2, esquive: 1 } },
    MD: { label: 'conciliant',     w: { esquive: 4, chiffres: 3, emotion: 2, attaque: 1 } },
    HZ: { label: 'pragmatique',    w: { chiffres: 5, esquive: 2, emotion: 2, attaque: 1 } },
    DL: { label: 'gaulois',        w: { attaque: 4, emotion: 3, esquive: 2, chiffres: 1 } },
    RQ: { label: 'polémiste',      w: { attaque: 5, emotion: 3, chiffres: 1, esquive: 1 } }
  };

  /* ---------- v0.5 : dilemmes ----------
     Chaque tour, un parti (à tour de rôle) fait face à un dilemme. Effets possibles :
     money, infl, forme, cas (casseroles) : +n / −n
     strong : n cubes dans sa région la plus forte · loseTop {n, count} : −n dans ses « count » régions les plus fortes
     regions {n, count, profile?} : +n cubes dans ses « count » meilleures régions
     rival : le rival en tête perd n cubes · dice {chance, win, lose} : pari
     later {turns, chance, title, text, fx} : conséquence qui peut ressortir plus tard */
  var DILEMMAS = [
    { id: 'notes', title: 'Notes de frais', text: 'Le Canard Déchaîné révèle les notes de frais de ton trésorier : 12 000 € de dîners en un mois.', options: [
      { label: 'Nier en bloc', hint: 'Pile ou face : l\'affaire s\'éteint… ou −3 soutiens et +1 casserole', fx: [{ k: 'dice', chance: 0.5, win: [], lose: [{ k: 'strong', n: -3 }, { k: 'cas', n: 1 }] }] },
      { label: 'S\'excuser à la télé', hint: '−2 ★, mais +1 soutien : on salue ta franchise', fx: [{ k: 'infl', n: -2 }, { k: 'strong', n: 1 }] },
      { label: 'Contre-attaquer', hint: '−1 ★, le rival en tête perd 2 soutiens… mais +2 casseroles', fx: [{ k: 'infl', n: -1 }, { k: 'rival', n: 2 }, { k: 'cas', n: 2 }] } ] },
    { id: 'mecene', title: 'Le mécène généreux', text: 'Un riche industriel propose de financer ta campagne. Il ne demande rien… pour l\'instant.', options: [
      { label: 'Accepter l\'argent', hint: '+5 € et +1 casserole… et ça pourrait ressortir', fx: [{ k: 'money', n: 5 }, { k: 'cas', n: 1 },
        { k: 'later', turns: 3, chance: 0.5, title: 'L\'affaire du mécène', text: 'Les juges s\'intéressent aux dons de ton mécène.', fx: [{ k: 'strong', n: -2 }, { k: 'cas', n: 1 }] }] },
      { label: 'Refuser poliment', hint: '+1 ★ : l\'intégrité, ça se remarque', fx: [{ k: 'infl', n: 1 }] } ] },
    { id: 'derapage', title: 'Dérapage sur les réseaux', text: 'Un de tes militants publie un message très maladroit qui devient viral.', options: [
      { label: 'L\'exclure du parti', hint: '−1 soutien, mais −1 casserole', fx: [{ k: 'strong', n: -1 }, { k: 'cas', n: -1 }] },
      { label: 'Le défendre', hint: 'Ta base apprécie : +1 soutien. Mais +1 casserole', fx: [{ k: 'strong', n: 1 }, { k: 'cas', n: 1 }] },
      { label: 'Ne rien dire', hint: 'Pile ou face : ça passe, ou −2 ★', fx: [{ k: 'dice', chance: 0.5, win: [], lose: [{ k: 'infl', n: -2 }] }] } ] },
    { id: 'emission', title: 'Le talk-show du dimanche', text: 'L\'émission la plus regardée du pays t\'invite. Ambiance survoltée garantie.', options: [
      { label: 'Y aller', hint: '−1 ⚡ · 2 chances sur 3 : +1 soutien dans 3 régions ; sinon gaffe', fx: [{ k: 'forme', n: -1 }, { k: 'dice', chance: 0.67, win: [{ k: 'regions', n: 1, count: 3 }], lose: [{ k: 'strong', n: -1 }, { k: 'cas', n: 1 }] }] },
      { label: 'Envoyer ton porte-parole', hint: '+1 soutien dans ta meilleure région, sans risque', fx: [{ k: 'regions', n: 1, count: 1 }] },
      { label: 'Décliner et te reposer', hint: '+1 ⚡', fx: [{ k: 'forme', n: 1 }] } ] },
    { id: 'transfuge', title: 'Un ancien ministre veut te rejoindre', text: 'Connu de tous, il apporte ses réseaux… et sa réputation.', options: [
      { label: 'L\'accueillir', hint: '+1 soutien dans 3 régions, +1 casserole. Restera-t-il fidèle ?', fx: [{ k: 'regions', n: 1, count: 3 }, { k: 'cas', n: 1 },
        { k: 'later', turns: 2, chance: 0.35, title: 'Le transfuge claque la porte', text: 'Ton nouvel allié repart avec fracas, et ses électeurs avec lui.', fx: [{ k: 'strong', n: -2 }] }] },
      { label: 'Refuser', hint: '+1 ★ auprès de tes militants', fx: [{ k: 'infl', n: 1 }] } ] },
    { id: 'promesse', title: 'La promesse qui fâche', text: 'Tes conseillers veulent promettre une baisse d\'impôts massive. Ça plaît… mais c\'est finançable ?', options: [
      { label: 'Promettre', hint: '+1 soutien dans 3 régions, mais les économistes vont faire les comptes', fx: [{ k: 'regions', n: 1, count: 3 },
        { k: 'later', turns: 2, chance: 0.8, title: 'Les économistes font les comptes', text: 'Ta promesse coûterait 40 milliards. Les plateaux télé se régalent.', fx: [{ k: 'infl', n: -2 }, { k: 'cas', n: 1 }] }] },
      { label: 'Rester sérieux', hint: '+1 ★', fx: [{ k: 'infl', n: 1 }] } ] },
    { id: 'enregistrement', title: 'L\'enregistrement volé', text: 'Un enregistrement de toi en privé circule. Tu y parles de tes électeurs avec… un certain mépris.', options: [
      { label: 'Démentir', hint: 'Pile ou face : ça passe, ou −2 soutiens et +2 casseroles', fx: [{ k: 'dice', chance: 0.5, win: [], lose: [{ k: 'strong', n: -2 }, { k: 'cas', n: 2 }] }] },
      { label: 'Assumer et t\'excuser', hint: '−1 soutien dans tes 2 meilleures régions, −1 casserole', fx: [{ k: 'loseTop', n: 1, count: 2 }, { k: 'cas', n: -1 }] } ] },
    { id: 'concert', title: 'Le concert gratuit', text: 'Une équipe propose un grand concert gratuit pour les jeunes, avec des artistes connus.', options: [
      { label: 'Organiser le concert', hint: '−3 €, +1 soutien dans 2 régions urbaines', fx: [{ k: 'money', n: -3 }, { k: 'regions', n: 1, count: 2, profile: 'urbaine' }] },
      { label: 'Trop cher', hint: 'Rien ne se passe', fx: [] } ] },
    { id: 'sondage_interne', title: 'Le sondage interne', text: 'Ton équipe a commandé un sondage secret. Il est catastrophique sur ton thème fétiche.', options: [
      { label: 'Changer de cap', hint: '−2 € · +2 ★ (on te trouve à l\'écoute)', fx: [{ k: 'money', n: -2 }, { k: 'infl', n: 2 }] },
      { label: 'Garder le cap', hint: '+1 ⚡ : tu restes serein', fx: [{ k: 'forme', n: 1 }] },
      { label: 'Le faire fuiter… en le truquant', hint: '+1 soutien dans 2 régions, mais ça peut se savoir', fx: [{ k: 'regions', n: 1, count: 2 },
        { k: 'later', turns: 2, chance: 0.5, title: 'Le sondage truqué', text: 'L\'institut dément avoir publié ces chiffres.', fx: [{ k: 'loseTop', n: 1, count: 2 }, { k: 'cas', n: 2 }] }] } ] }
  ];

  /* ---------- v0.5 : crises en 3 actes (une par partie) ----------
     Chaque acte remplace l'événement du tour. markers : icônes posées sur la carte ;
     dans ces régions, le thème du marqueur compte comme « à la une ». */
  var CRISES = [
    { id: 'finance', name: 'Crise financière', acts: [
      { title: 'Rumeurs de krach', text: 'Les marchés tremblent. Chaque parti perd 1 €.', theme: 'pouvoir', fx: [{ k: 'allMoney', n: -1 }] },
      { title: 'Krach boursier !', text: 'Chaque parti perd 2 €. Le pouvoir d\'achat écrase tous les autres sujets.', theme: 'pouvoir', fx: [{ k: 'allMoney', n: -2 }] },
      { title: 'La reprise', text: 'Chaque parti regagne 2 €. Les partis très crédibles sur le pouvoir d\'achat gagnent 1 soutien.', theme: 'pouvoir', fx: [{ k: 'allMoney', n: 2 }, { k: 'credTop', theme: 'pouvoir', n: 1 }] } ] },
    { id: 'greve', name: 'Grève générale', acts: [
      { title: 'Grève dans les transports', text: 'Plus un train en Île-de-France. Là-bas, les services publics sont sur toutes les lèvres.', theme: 'services', markers: [{ rid: 'idf', icon: '✊', theme: 'services', turns: 3 }], fx: [] },
      { title: 'La grève s\'étend', text: 'Le Nord, l\'Est et la Normandie rejoignent le mouvement. Les Meetings coûtent 1 € de plus ce tour.', theme: 'services',
        markers: [{ rid: 'hdf', icon: '✊', theme: 'services', turns: 2 }, { rid: 'ges', icon: '✊', theme: 'services', turns: 2 }, { rid: 'nor', icon: '✊', theme: 'services', turns: 2 }], fx: [{ k: 'mod', key: 'terrainExtra', v: 1 }] },
      { title: 'Fin du mouvement', text: 'Un accord est trouvé. Les partis très crédibles sur les services publics gagnent 1 soutien.', theme: 'services', fx: [{ k: 'credTop', theme: 'services', n: 1 }] } ] },
    { id: 'ete', name: 'Été brûlant', acts: [
      { title: 'Canicule précoce', text: '42 °C à Marseille. Dans le Sud, l\'écologie s\'invite dans tous les débats.', theme: 'ecologie',
        markers: [{ rid: 'pac', icon: '🔥', theme: 'ecologie', turns: 3 }, { rid: 'occ', icon: '🔥', theme: 'ecologie', turns: 3 }], fx: [] },
      { title: 'Incendies dans le Sud', text: 'Les forêts brûlent. Dans chaque région touchée, le parti qui la contrôle perd 1 soutien : on lui reproche son impréparation.', theme: 'ecologie',
        markers: [{ rid: 'naq', icon: '🔥', theme: 'ecologie', turns: 2 }], fx: [{ k: 'controllerLoss', regions: ['pac', 'occ', 'naq'], n: 1 }] },
      { title: 'Orages et inondations', text: 'Après le feu, l\'eau. Les partis très crédibles sur l\'écologie gagnent 1 soutien.', theme: 'ecologie',
        markers: [{ rid: 'bre', icon: '🌊', theme: 'ecologie', turns: 2 }, { rid: 'pdl', icon: '🌊', theme: 'ecologie', turns: 2 }], fx: [{ k: 'credTop', theme: 'ecologie', n: 1 }] } ] },
    { id: 'usines', name: 'Désindustrialisation', acts: [
      { title: 'Une usine ferme dans le Nord', text: '800 emplois supprimés. Dans les Hauts-de-France, on ne parle plus que d\'emploi.', theme: 'emploi',
        markers: [{ rid: 'hdf', icon: '🏭', theme: 'emploi', turns: 3 }], fx: [] },
      { title: 'Plan social dans l\'Est', text: 'Le Grand Est est touché à son tour. Le parti qui contrôle le Nord et l\'Est perd 1 soutien dans chacune.', theme: 'emploi',
        markers: [{ rid: 'ges', icon: '🏭', theme: 'emploi', turns: 2 }], fx: [{ k: 'controllerLoss', regions: ['hdf', 'ges'], n: 1 }] },
      { title: 'Plan de relance', text: 'L\'État annonce un plan de relance. Les partis très crédibles sur l\'emploi gagnent 1 soutien.', theme: 'emploi', fx: [{ k: 'credTop', theme: 'emploi', n: 1 }] } ] }
  ];

  /* v1.5 : contrôle des données. Une erreur ici veut dire qu'une règle annoncée ne pourra pas fonctionner
     (ex. en v1.0 à v1.4, les 13 profils de région étaient vides : cartes, bonus et objectifs territoriaux ne marchaient plus). */
  function validate() {
    var errs = [], ids = {}, profs = Object.keys(PROFILES);
    REGIONS.forEach(function (r) {
      ids[r.id] = 1;
      if (profs.indexOf(r.profile) < 0) errs.push('Région ' + r.id + ' : profil inconnu « ' + r.profile + ' »');
      (r.concerns || []).forEach(function (t) { if (!THEMES.some(function (x) { return x.id === t; })) errs.push('Région ' + r.id + ' : souci inconnu ' + t); });
    });
    profs.forEach(function (pf) { if (!REGIONS.some(function (r) { return r.profile === pf; })) errs.push('Aucune région de profil ' + pf); });
    Object.keys(CARDS).forEach(function (k) {
      (CARDS[k].profiles || []).forEach(function (pf) { if (profs.indexOf(pf) < 0) errs.push('Carte ' + k + ' : profil inconnu ' + pf); });
      if (CARDS[k].profiles && !REGIONS.some(function (r) { return CARDS[k].profiles.indexOf(r.profile) >= 0; })) errs.push('Carte ' + k + ' : aucune région cible possible');
    });
    PARTIES.forEach(function (p) { (p.bases || []).forEach(function (b) { if (!ids[b]) errs.push('Parti ' + p.id + ' : région de base inconnue ' + b); }); });
    return errs;
  }

  var DATA = { REFERENCE_2027: REFERENCE_2027, POLLS: POLLS, BASES: BASES, REGIONS: REGIONS, PROFILES: PROFILES, THEMES: THEMES, HEADLINES: HEADLINES, PARTIES: PARTIES, ACTIONS: ACTIONS,
               CARDS: CARDS, EVENTS: EVENTS, DILEMMAS: DILEMMAS, CRISES: CRISES, REPLIES: REPLIES, TEMPERS: TEMPERS, TRAITS: TRAITS, NOSTALGIA: NOSTALGIA, PETALS: PETALS, MICRO: MICRO, BINGO: BINGO, BINGO_LINES: BINGO_LINES,
               MEASURES: MEASURES, FUNDING: FUNDING, SEGMENTS: SEGMENTS, VOTE_PROP: VOTE_PROP, CLASS_PROF: CLASS_PROF, CLASS_SRC: CLASS_SRC, HEART: HEART, MAJORITY: MAJORITY, BETA: BETA, MEDIA: MEDIA, ANSWERS: ANSWERS, STATIONS: STATIONS, DEB_REG: DEB_REG, DEB_BEATS: DEB_BEATS, DEB_REG_NAME: DEB_REG_NAME, DEBATE: DEBATE, STATION_FIT: STATION_FIT, VINGT: VINGT, QUESTIONS: QUESTIONS, SEGMENTS_SRC: SEGMENTS_SRC, AFFAIRS: AFFAIRS, LEARN: LEARN, BUDGET_AFFAIR: BUDGET_AFFAIR, REACTIONS: REACTIONS, ADVISOR: ADVISOR, OBJECTIVES: OBJECTIVES, RULES: RULES, FORMATS: FORMATS, LEGIS: LEGIS, MINISTRY: MINISTRY, OPPO: OPPO, validate: validate };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.PolitikData = DATA;
})(this);

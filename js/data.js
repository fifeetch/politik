/* Politik — données du jeu (règles v1.0 : poids réels, vote blanc, abstention, départ législatives 2024)
   Régions : ins = millions d'inscrits, abst = abstention (%), blanc / nuls = % des votants, au 2nd tour de la présidentielle 2022
   (Conseil constitutionnel, résultats par département). start = score de départ du mode Réaliste (% des exprimés) :
   la MOYENNE des législatives 2024 (1er tour, la gauche unie répartie entre FI, SM et VP selon les européennes) et des
   européennes 2024 (FI = LFI, SM = PS-Place publique, VP = Les Écologistes, EM = Besoin d'Europe / Ensemble,
   UG = LR, MN = RN et alliés). Sources : ministère de l'Intérieur, résultats définitifs (data.gouv.fr).
   La « région » cor regroupe la Corse, l'outre-mer et les Français de l'étranger.
   Toutes les valeurs chiffrées du jeu sont ici : c'est le fichier à modifier pour équilibrer. */
(function (root) {
  var REGIONS = [
    { id: 'idf', name: 'Île-de-France', profile: '      ', pts: 9.8, ins: 7.35, abst: 29.4, blanc: 6.2, nuls: 1.7, start: { FI: 18.6, SM: 15.7, VP: 7.1, EM: 20.5, UG: 9.5, MN: 19.5 }, concerns: ['pouvoir', 'securite'], pop: { ind: 3.3, cad: 20.0, pi: 15.5, pop: 23.7, ret: 19.7, sae: 18.0 } },
    { id: 'ara', name: 'Auvergne-Rhône-Alpes', profile: '      ', pts: 7.4, ins: 5.56, abst: 25.6, blanc: 6.7, nuls: 2.2, start: { FI: 10.2, SM: 13.4, VP: 6.1, EM: 16.7, UG: 11.9, MN: 32 }, concerns: ['ecologie', 'emploi'], pop: { ind: 4.8, cad: 10.7, pi: 15.5, pop: 26.7, ret: 27.6, sae: 14.7 } },
    { id: 'hdf', name: 'Hauts-de-France', profile: ' ', pts: 5.7, ins: 4.26, abst: 26.7, blanc: 5.2, nuls: 2.2, start: { FI: 9.6, SM: 9.7, VP: 3.6, EM: 15.1, UG: 8.4, MN: 43.1 }, concerns: ['emploi', 'pouvoir'], pop: { ind: 3.2, cad: 7.9, pi: 13.9, pop: 30.1, ret: 26.6, sae: 18.2 } },
    { id: 'naq', name: 'Nouvelle-Aquitaine', profile: '       ', pts: 5.9, ins: 4.46, abst: 24.2, blanc: 7.4, nuls: 3.1, start: { FI: 7.9, SM: 16.8, VP: 5.7, EM: 19.5, UG: 6.5, MN: 32.7 }, concerns: ['services', 'ecologie'], pop: { ind: 5.3, cad: 8.2, pi: 13.6, pop: 26.8, ret: 32.8, sae: 13.3 } },
    { id: 'occ', name: 'Occitanie', profile: '       ', pts: 5.8, ins: 4.32, abst: 24.8, blanc: 7.3, nuls: 3.1, start: { FI: 10.1, SM: 15.9, VP: 5.2, EM: 16.6, UG: 4.8, MN: 36.2 }, concerns: ['pouvoir', 'services'], pop: { ind: 5.4, cad: 9.4, pi: 13.9, pop: 24.9, ret: 30.4, sae: 16.0 } },
    { id: 'ges', name: 'Grand Est', profile: ' ', pts: 5.1, ins: 3.86, abst: 26.3, blanc: 5.6, nuls: 1.9, start: { FI: 7.9, SM: 10.2, VP: 4.2, EM: 17.4, UG: 11.2, MN: 38.5 }, concerns: ['emploi', 'immigration'], pop: { ind: 3.7, cad: 8.0, pi: 14.2, pop: 29.9, ret: 28.5, sae: 15.6 } },
    { id: 'pac', name: "Provence-Alpes-Côte d'Azur", profile: '      ', pts: 4.9, ins: 3.66, abst: 27.5, blanc: 5.9, nuls: 1.9, start: { FI: 10.2, SM: 10.5, VP: 4.8, EM: 15.8, UG: 6.8, MN: 41.6 }, concerns: ['securite', 'immigration'], pop: { ind: 5.1, cad: 9.4, pi: 13.9, pop: 24.9, ret: 29.8, sae: 16.9 } },
    { id: 'pdl', name: 'Pays de la Loire', profile: '       ', pts: 3.8, ins: 2.83, abst: 23.6, blanc: 6.7, nuls: 2.1, start: { FI: 7.7, SM: 15.6, VP: 6.8, EM: 23.2, UG: 8.7, MN: 28.7 }, concerns: ['ecologie', 'emploi'], pop: { ind: 4.4, cad: 9.1, pi: 14.6, pop: 28.9, ret: 30.3, sae: 12.8 } },
    { id: 'bre', name: 'Bretagne', profile: '       ', pts: 3.4, ins: 2.56, abst: 22.1, blanc: 7.2, nuls: 2.4, start: { FI: 7.6, SM: 17.4, VP: 6.8, EM: 24, UG: 7.2, MN: 26.7 }, concerns: ['ecologie', 'services'], pop: { ind: 4.7, cad: 8.6, pi: 14.1, pop: 27.0, ret: 32.2, sae: 13.5 } },
    { id: 'nor', name: 'Normandie', profile: '   ', pts: 3.2, ins: 2.41, abst: 24.2, blanc: 6.4, nuls: 2.0, start: { FI: 8.1, SM: 13.1, VP: 4.4, EM: 19.6, UG: 8.6, MN: 35.8 }, concerns: ['emploi', 'services'], pop: { ind: 4.2, cad: 7.2, pi: 13.7, pop: 29.2, ret: 31.3, sae: 14.5 } },
    { id: 'bfc', name: 'Bourgogne-Franche-Comté', profile: '   ', pts: 2.7, ins: 1.99, abst: 25.2, blanc: 6.9, nuls: 2.6, start: { FI: 7.9, SM: 12, VP: 4.5, EM: 17, UG: 10.1, MN: 38.5 }, concerns: ['services', 'pouvoir'], pop: { ind: 4.6, cad: 7.0, pi: 13.4, pop: 29.0, ret: 32.3, sae: 13.7 } },
    { id: 'cvl', name: 'Centre-Val de Loire', profile: '   ', pts: 2.5, ins: 1.84, abst: 25.3, blanc: 6.5, nuls: 2.4, start: { FI: 7.9, SM: 12, VP: 4.1, EM: 20.5, UG: 8.4, MN: 36.3 }, concerns: ['services', 'securite'], pop: { ind: 4.1, cad: 8.0, pi: 14.1, pop: 28.4, ret: 31.9, sae: 13.5 } },
    { id: 'cor', name: 'Corse, outre-mer et Français de l\'étranger', profile: '   ', pts: 4.8, ins: 3.63, abst: 54.5, blanc: 4.6, nuls: 2.9, start: { FI: 10.4, SM: 15.7, VP: 5.8, EM: 18.6, UG: 11.7, MN: 19.2 }, concerns: ['pouvoir', 'services'], pop: { ind: 4.9, cad: 5.6, pi: 12.7, pop: 29.4, ret: 21.9, sae: 25.4 } }
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

  /* ---------- v0.7 : le programme ----------
     Chaque candidat choisit 5 mesures avant la campagne. La 1re est sa mesure phare.
     Crédibilité sur un thème = socle du parti + 1 par mesure sur ce thème (2 au plus).
     cost : coût en milliards d'euros (négatif = économies). choc : fait parler (+1 cube dans 2 régions… et +1 casserole). */
  var MEASURES = [
    { id: 'smic',            theme: 'pouvoir',     name: 'Smic à 1 600 € net',                       cost: 20 , fans: {pop: 2, sae: 1, ind: -1}, edu: { what: 'Le Smic est le salaire minimum légal en France. Il est revalorisé au moins une fois par an.', pro: 'Plus de pouvoir d\'achat pour les bas salaires.', con: 'Un coût en plus pour les petites entreprises, qui peuvent embaucher moins.' } },
    { id: 'energie',         theme: 'pouvoir',     name: 'Blocage des prix de l\'énergie',            cost: 25 , fans: {pop: 1, ret: 1, ind: 1, sae: 1}, edu: { what: 'L\'État fixe un prix maximum pour l\'électricité ou le gaz et paie la différence aux fournisseurs.', pro: 'Protège les ménages et les entreprises des flambées de prix.', con: 'Très coûteux pour les finances publiques, et n\'incite pas à économiser l\'énergie.' } },
    { id: 'tva',             theme: 'pouvoir',     name: 'TVA réduite sur le carburant',              cost: 15 , fans: {pop: 1, ind: 1}, edu: { what: 'La TVA est un impôt payé sur presque tout ce qu\'on achète, dont le carburant.', pro: 'Baisse visible du prix à la pompe.', con: 'Moins de recettes pour l\'État, et la baisse profite aussi aux gros rouleurs.' } },
    { id: 'cheque',          theme: 'pouvoir',     name: 'Chèque alimentation',                       cost: 6 , fans: {sae: 2, pop: 1}, edu: { what: 'Une aide versée aux ménages modestes pour acheter de la nourriture.', pro: 'Cible ceux qui en ont le plus besoin.', con: 'Aide ponctuelle qui ne règle pas les causes de la hausse des prix.' } },
    { id: 'superprofits',    theme: 'pouvoir',     name: 'Taxe sur les superprofits',                 cost: -12 , fans: {pop: 1, sae: 1, cad: -1}, edu: { what: 'Un impôt exceptionnel sur les bénéfices jugés anormalement élevés de certaines entreprises.', pro: 'Fait contribuer les entreprises qui profitent d\'une crise.', con: 'Difficile à définir, et peut faire fuir les investisseurs.' } },
    { id: 'reindus',         theme: 'emploi',      name: 'Grand plan de réindustrialisation',         cost: 30 , fans: {pop: 2, pi: 1}, edu: { what: 'Aider les usines à s\'installer ou revenir en France : subventions, formation, énergie.', pro: 'Recrée des emplois et rend le pays moins dépendant de l\'étranger.', con: 'Très cher, et les résultats prennent des années.' } },
    { id: 'pme',             theme: 'emploi',      name: 'Moins de charges pour les PME',             cost: 15 , fans: {ind: 2, cad: 2}, edu: { what: 'Les charges sociales sont des cotisations payées sur les salaires pour financer la protection sociale.', pro: 'Les entreprises peuvent embaucher et investir plus.', con: 'Moins de recettes pour la Sécurité sociale, à compenser ailleurs.' } },
    { id: 'semaine4',        theme: 'emploi',      name: 'Semaine de 4 jours',                        cost: 8 , fans: {pi: 1, cad: 1, pop: 1, ind: -1}, edu: { what: 'Travailler sur 4 jours au lieu de 5, à temps de travail réduit ou réorganisé.', pro: 'Plus de temps libre, moins de trajets, salariés plus motivés.', con: 'Difficile à organiser dans certains métiers (hôpitaux, commerces).' } },
    { id: 'apprentissage',   theme: 'emploi',      name: 'Apprentissage pour tous',                   cost: 4 , fans: {sae: 2, ind: 1}, edu: { what: 'L\'apprentissage alterne cours et travail en entreprise, avec un salaire.', pro: 'Facilite l\'accès des jeunes à un premier emploi.', con: 'Les aides aux entreprises ont un coût, et la qualité des formations varie.' } },
    { id: 'retraites',       theme: 'emploi',      name: 'Retraite à 65 ans',                         cost: -15, choc: true , fans: {ind: 1, cad: 1, pop: -2, pi: -1}, edu: { what: 'Reculer l\'âge légal auquel on peut partir à la retraite.', pro: 'Équilibre les comptes des retraites, car on vit plus longtemps.', con: 'Pénalise ceux qui ont commencé tôt ou ont des métiers pénibles. Mesure souvent très contestée.' } },
    { id: 'medecins',        theme: 'services',    name: '10 000 médecins de plus',                   cost: 12 , fans: {ret: 2, pop: 1}, edu: { what: 'Former et installer plus de médecins, notamment dans les « déserts médicaux ».', pro: 'Réduit les délais pour se soigner.', con: 'Former un médecin prend une dizaine d\'années.' } },
    { id: 'lignes',          theme: 'services',    name: 'Rouvrir les petites lignes de train',       cost: 10 , fans: {ret: 1, sae: 1, pop: 1}, edu: { what: 'Rouvrir des lignes de train fermées dans les zones rurales.', pro: 'Désenclave les territoires et réduit l\'usage de la voiture.', con: 'Coûteux à remettre en état pour peu de voyageurs parfois.' } },
    { id: 'classes',         theme: 'services',    name: 'Classes de 20 élèves maximum',              cost: 10 , fans: {pi: 2, cad: 1}, edu: { what: 'Limiter le nombre d\'élèves par classe.', pro: 'Les élèves sont mieux suivis, surtout les plus fragiles.', con: 'Il faut recruter beaucoup d\'enseignants, et le métier attire peu.' } },
    { id: 'sp20',            theme: 'services',    name: 'Un service public à 20 min de chez soi',    cost: 15 , fans: {ret: 1, pop: 1, ind: 1}, edu: { what: 'Garantir à chacun une école, une poste, un médecin ou une gare à moins de 20 minutes.', pro: 'Lutte contre le sentiment d\'abandon des campagnes.', con: 'Maintenir des services peu fréquentés coûte cher.' } },
    { id: 'nonremplacement', theme: 'services',    name: 'Un fonctionnaire sur deux non remplacé',    cost: -10, choc: true , fans: {ind: 1, cad: 1, pi: -2, pop: -1}, edu: { what: 'Ne remplacer qu\'un fonctionnaire sur deux qui part à la retraite.', pro: 'Réduit les dépenses de l\'État.', con: 'Risque de dégrader les services publics (écoles, hôpitaux).' } },
    { id: 'renovation',      theme: 'ecologie',    name: 'Rénover 1 million de logements',            cost: 18 , fans: {pop: 1, ind: 1, cad: 1}, edu: { what: 'Isoler les logements pour qu\'ils consomment moins d\'énergie.', pro: 'Baisse les factures et les émissions de CO₂.', con: 'Gros coût pour l\'État et les propriétaires, et pénurie d\'artisans.' } },
    { id: 'train1',          theme: 'ecologie',    name: 'Le train à 1 € pour les jeunes',            cost: 5 , fans: {sae: 2}, edu: { what: 'Un billet de train à prix symbolique pour les jeunes.', pro: 'Encourage le train plutôt que la voiture.', con: 'Manque à gagner pour la SNCF, à compenser par l\'État.' } },
    { id: 'jets',            theme: 'ecologie',    name: 'Taxe sur les jets privés',                  cost: -0.2 , fans: {pop: 1, sae: 1, cad: -1}, edu: { what: 'Un impôt sur les vols en avion privé, très polluants par passager.', pro: 'Symbole de justice : les plus riches paient leur pollution.', con: 'Rapporte peu, et les vols peuvent partir de l\'étranger.' } },
    { id: 'plastique',       theme: 'ecologie',    name: 'Fin du plastique jetable',                  cost: 2 , fans: {cad: 1, sae: 1, ind: -1}, edu: { what: 'Interdire progressivement les emballages et objets en plastique à usage unique.', pro: 'Moins de déchets dans la nature et les océans.', con: 'Les entreprises doivent trouver des alternatives, parfois plus chères.' } },
    { id: 'policiers',       theme: 'securite',    name: '10 000 policiers de plus',                  cost: 1 , fans: {ret: 2, pop: 1}, edu: { what: 'Recruter et former davantage de policiers et gendarmes.', pro: 'Plus de présence sur le terrain.', con: 'Il faut aussi des locaux, du matériel, et des années de formation.' } },
    { id: 'proximite',       theme: 'securite',    name: 'Retour de la police de proximité',          cost: 5 , fans: {ret: 1, pop: 1, pi: 1}, edu: { what: 'Des policiers affectés à un quartier, qui connaissent ses habitants.', pro: 'Rétablit la confiance et prévient la délinquance.', con: 'Mobilise beaucoup d\'agents pour des résultats difficiles à mesurer.' } },
    { id: 'planchers',       theme: 'securite',    name: 'Peines planchers',                          cost: 1 , penal: true, fans: {ret: 1}, edu: { what: 'Une peine minimale obligatoire pour certains délits, surtout en cas de récidive.', pro: 'Rend la sanction plus certaine et dissuasive.', con: 'Limite la liberté du juge d\'adapter la peine à chaque cas. Déjà essayée puis supprimée en France.' } },
    { id: 'video',           theme: 'securite',    name: 'Caméras dans toutes les communes',          cost: 3 , fans: {ret: 1, ind: 1}, edu: { what: 'Installer des caméras de surveillance sur la voie publique.', pro: 'Aide à élucider des affaires et peut dissuader.', con: 'Efficacité discutée, et questions de vie privée.' } },
    { id: 'fraude',          theme: 'securite',    name: 'Chasse à la fraude sociale',                cost: -6 , fans: {ret: 1, ind: 1, cad: 1, sae: -2}, edu: { what: 'Renforcer les contrôles sur les aides sociales versées à tort.', pro: 'Les aides vont à ceux qui y ont droit.', con: 'La fraude aux cotisations des entreprises et le non-recours aux droits sont aussi importants.' } },
    { id: 'referendum',      theme: 'immigration', name: 'Référendum sur l\'immigration',             cost: 1 , fans: {ret: 1, pop: 1, cad: -1}, edu: { what: 'Faire voter directement les citoyens sur la politique d\'immigration.', pro: 'Donne la parole au peuple sur un sujet sensible.', con: 'L\'article 11 de la Constitution ne cite pas l\'immigration : la possibilité même de ce référendum fait débat.' } },
    { id: 'accueil',         theme: 'immigration', name: 'Accueil digne et intégration',              cost: 4 , fans: {pi: 1, cad: 1}, edu: { what: 'Mieux accueillir les étrangers en règle : cours de français, accès au travail, logement.', pro: 'Favorise l\'intégration et l\'emploi.', con: 'Coût pour l\'État, et crainte d\'un « appel d\'air ».' } },
    { id: 'controles',       theme: 'immigration', name: 'Contrôles renforcés aux frontières',        cost: 5 , fans: {ret: 1, pop: 1, ind: 1}, edu: { what: 'Plus de contrôles aux frontières de la France.', pro: 'Mieux lutter contre l\'immigration illégale et les trafics.', con: 'Dans l\'espace Schengen, les contrôles aux frontières intérieures sont en principe limités et temporaires.' } },
    { id: 'regroupement',    theme: 'immigration', name: 'Fin du regroupement familial',              cost: 0, choc: true , fans: {ret: 1, pi: -1}, edu: { what: 'Le regroupement familial permet à un étranger installé légalement de faire venir sa famille.', pro: 'Réduit l\'immigration.', con: 'Ce droit est protégé par des textes européens et internationaux : le supprimer serait juridiquement très difficile.' } }
  ];


  /* v0.8 : mesures de financement (recettes ou économies), 3 au plus, en plus des 5 promesses.
     Les montants sont des ordres de grandeur pour le jeu. */
  var FUNDING = [
    { id: 'isf',          name: 'Rétablir un impôt sur la fortune',            cost: -4,  fans: { cad: -1, ind: -1, pop: 1 },
      edu: { what: 'Un impôt annuel sur le patrimoine des ménages les plus riches. L\'ancien ISF a été remplacé en 2018 par un impôt sur la seule fortune immobilière.', pro: 'Fait contribuer les plus gros patrimoines.', con: 'Risque de départ de contribuables fortunés et d\'investissements à l\'étranger.' } },
    { id: 'heritage',     name: 'Taxer davantage les gros héritages',          cost: -6,  fans: { ret: -1, ind: -1, pop: 1 },
      edu: { what: 'Augmenter les droits de succession sur les héritages les plus importants.', pro: 'Limite la transmission des inégalités d\'une génération à l\'autre.', con: 'Impôt très impopulaire, et difficile pour la transmission des entreprises familiales.' } },
    { id: 'niches',       name: 'Supprimer des niches fiscales',               cost: -10, fans: { cad: -2, ind: -1 },
      edu: { what: 'Les niches fiscales sont des réductions d\'impôt accordées pour encourager certains comportements (emploi à domicile, investissements…).', pro: 'Rapporte beaucoup et simplifie l\'impôt.', con: 'Chaque niche a ses défenseurs, et certaines soutiennent des emplois.' } },
    { id: 'fraudefisc',   name: 'Renforcer la lutte contre la fraude fiscale', cost: -5,  fans: { pop: 1, sae: 1 },
      edu: { what: 'Plus de contrôleurs et d\'outils pour récupérer les impôts que certains ne paient pas.', pro: 'Personne ne s\'y oppose sur le principe.', con: 'Les sommes vraiment récupérées sont incertaines et prennent du temps.' } },
    { id: 'tvaplus',      name: 'Hausse d\'un point de TVA',                   cost: -8,  fans: { pop: -2, ret: -1, sae: -1 },
      edu: { what: 'La TVA est payée par tous sur ce qu\'ils achètent : une hausse rapporte beaucoup.', pro: 'Recette rapide et sûre, qui touche aussi les produits importés.', con: 'Pèse plus lourd, en proportion, sur les ménages modestes.' } },
    { id: 'csg',          name: 'Hausse de la CSG des retraités aisés',        cost: -4,  fans: { ret: -2 },
      edu: { what: 'La CSG est une contribution prélevée sur presque tous les revenus, y compris les pensions.', pro: 'Les retraités aisés ont souvent un niveau de vie élevé.', con: 'Les retraités vivent cette hausse comme une injustice après une vie de travail.' } },
    { id: 'gelpensions',  name: 'Geler les pensions de retraite un an',        cost: -4,  fans: { ret: -2 },
      edu: { what: 'Ne pas augmenter les pensions avec l\'inflation pendant un an.', pro: 'Économie importante et immédiate.', con: 'Les retraités perdent du pouvoir d\'achat, surtout les plus modestes.' } },
    { id: 'gelpoint',     name: 'Geler le salaire des fonctionnaires',         cost: -3,  fans: { pi: -2 },
      edu: { what: 'Ne pas revaloriser le « point d\'indice » qui sert à calculer le salaire des agents publics.', pro: 'Économie simple à mettre en œuvre.', con: 'Rend les métiers publics (enseignants, soignants) moins attractifs.' } },
    { id: 'chomage',      name: 'Durcir l\'assurance chômage',                 cost: -3,  fans: { sae: -2, pop: -1, ind: 1 },
      edu: { what: 'Réduire la durée ou le montant des allocations chômage.', pro: 'Incite à reprendre un emploi plus vite et fait des économies.', con: 'Fragilise les personnes qui perdent leur emploi.' } },
    { id: 'trainvie',     name: 'Économies sur le train de vie de l\'État',    cost: -5,  fans: { pi: -1, ind: 1, cad: 1 },
      edu: { what: 'Réduire les dépenses de fonctionnement : bâtiments, voitures, agences et organismes publics.', pro: 'Populaire, et montre l\'exemple.', con: 'Les vraies économies sont souvent plus faibles qu\'annoncé.' } }
  ];

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
    { id: 'nier',    label: 'Nier en bloc',                hint: 'Pile ou face : ça passe… ou −3 cubes et +1 casserole', fx: [{ k: 'dice', chance: 0.5, win: [], lose: [{ k: 'strong', n: -3 }, { k: 'cas', n: 1 }] }] },
    { id: 'excuses', label: 'S\'excuser publiquement',     hint: '−1 cube dans tes 2 meilleures régions, mais −2 casseroles : la page est tournée', fx: [{ k: 'loseTop', n: 1, count: 2 }, { k: 'cas', n: -2 }] },
    { id: 'fusible', label: 'Sacrifier un collaborateur',  hint: '−1 cube, −1 ★, −1 casserole', fx: [{ k: 'strong', n: -1 }, { k: 'infl', n: -1 }, { k: 'cas', n: -1 }] },
    { id: 'medias',  label: 'Accuser les médias',          hint: '1 chance sur 3 que ta base se mobilise (+1 cube) ; sinon −2 cubes et +2 casseroles', fx: [{ k: 'dice', chance: 0.34, win: [{ k: 'regions', n: 1, count: 1 }], lose: [{ k: 'strong', n: -2 }, { k: 'cas', n: 2 }] }] }
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
    debat: { title: 'Le débat télévisé', text: 'Le débat d\'entre-deux-tours entre les deux finalistes est une tradition depuis 1974. Une phrase bien placée peut marquer toute une campagne.' , src: [{label: "Les règles de temps de parole de l'entre-deux-tours (Arcom)", url: "https://www.arcom.fr/actualites/presidentielle-2022-les-regles-de-temps-de-parole-de-lentre-deux-tours"}] },
    art49_3: { title: 'Le 49.3', text: 'L\'article 49 alinéa 3 de la Constitution permet au gouvernement de faire adopter un texte sans vote des députés… sauf si ceux-ci votent une motion de censure, qui renverse alors le gouvernement. Son usage est limité depuis 2008.' , src: [{label: "Fiche n° 64 : la responsabilité du Gouvernement (Assemblée nationale)", url: "https://www.assemblee-nationale.fr/dyn/contenu/telechargement/629167/file/Fiche%2064%20-%20Responsabilit%C3%A9%20du%20Gouvernement_actualis%C3%A9e061224.pdf"}, {label: "Constitution, article 49 (Conseil constitutionnel)", url: "https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur"}] },
    censure: { title: 'La motion de censure', text: 'Les députés peuvent renverser le gouvernement en votant une motion de censure. Il faut la majorité absolue des députés, soit 289 voix.' , src: [{label: "Fiche n° 64 : la responsabilité du Gouvernement (Assemblée nationale)", url: "https://www.assemblee-nationale.fr/dyn/contenu/telechargement/629167/file/Fiche%2064%20-%20Responsabilit%C3%A9%20du%20Gouvernement_actualis%C3%A9e061224.pdf"}] },
    referendum: { title: 'Le référendum', text: 'Le président peut soumettre un projet de loi directement aux citoyens (article 11 de la Constitution), mais seulement sur certains sujets : organisation des pouvoirs publics, politique économique, sociale ou environnementale.' , src: [{label: "Constitution, article 11 (Conseil constitutionnel)", url: "https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur"}] },
    budget: { title: 'Le budget de l\'État', text: 'Chaque année, le Parlement vote la loi de finances : les recettes et les dépenses de l\'État. Quand on dépense plus qu\'on ne gagne, c\'est le déficit, qui s\'ajoute à la dette. En 2025, les administrations publiques ont dépensé 1 714 milliards d\'euros pour 1 562 milliards de recettes : un déficit de 152,5 milliards, soit 5,1 % de la richesse produite (le PIB).' , src: [{label: "Comptes de la Nation 2025, premiers résultats (Insee)", url: "https://www.insee.fr/fr/statistiques/8956575"}, {label: "La situation et les perspectives des finances publiques, juin 2026 (Cour des comptes)", url: "https://www.ccomptes.fr/fr/publications/la-situation-et-les-perspectives-des-finances-publiques-17"}] },
    affaires: { title: 'Les affaires et la justice', text: 'Une personne mise en cause reste présumée innocente tant qu\'elle n\'est pas condamnée. Mais une condamnation peut s\'accompagner d\'une peine d\'inéligibilité : interdiction de se présenter à une élection.' , src: [{label: "Déclaration des droits de l'homme et du citoyen, article 9 (Conseil constitutionnel)", url: "https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/declaration-des-droits-de-l-homme-et-du-citoyen-de-1789"}] },
    militants: { title: 'Les militants', text: 'Les militants font vivre une campagne sur le terrain : tractage, porte-à-porte, réunions, collage d\'affiches sur les panneaux officiels installés devant chaque bureau de vote.' },
    agenda: { title: 'L\'agenda médiatique', text: 'Les sujets dont parlent les médias influencent ce qui préoccupe les électeurs. Les candidats essaient d\'imposer « leurs » thèmes : ceux sur lesquels ils sont jugés les plus crédibles.' },
    legislatives: { title: 'Les élections législatives', text: 'Les 577 députés sont élus dans 577 circonscriptions, au scrutin majoritaire à deux tours, pour 5 ans. Pour gouverner sereinement, le président a besoin d\'une majorité absolue : 289 députés.', src: [{ label: 'Fiche de synthèse n° 3 : l\'élection des députés (Assemblée nationale)', url: 'https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/l-election-des-deputes' }] },
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

  var PARTIES = [
    { id: 'FI', pos: 1, name: 'La France Indignée', short: 'France Indignée', family: 'Gauche radicale',
      candidate: 'Rémi Barricade', candTitle: 'le tribun de la rue', programme: ['smic', 'superprofits', 'medecins', 'train1', 'semaine4'], financing: ['isf', 'heritage', 'niches'],
      color: '#C8323C', ink: '#FFFFFF', money: 5, infl: 4, bases: ['occ', 'bfc'],
      cred: { pouvoir: 2, services: 2, ecologie: 1, emploi: 1, securite: 0, immigration: 0 },
      force: 'Réseaux sociaux : en Buzz, relance le dé si le résultat est mauvais (1 ou 2).',
      weakness: 'Un Meeting coûte 1 € de plus en région rurale.',
      cards: ['marche_pop', 'censure'] },
    { id: 'SM', pos: 3, name: 'Socialisme Modéré', short: 'Soc. Modéré', family: 'Centre gauche',
      candidate: 'Claire Consensus', candTitle: 'la sage du parti', programme: ['classes', 'apprentissage', 'cheque', 'proximite', 'plastique'], financing: ['fraudefisc', 'niches'],
      color: '#E07AA0', ink: '#1B1F3B', money: 4, infl: 3, bases: ['naq', 'cvl'],
      cred: { services: 2, emploi: 1, pouvoir: 1, securite: 1, ecologie: 1, immigration: 0 },
      force: "Réseau d'élus : +1 cube en Meeting là où il a déjà 5 cubes ou plus.",
      weakness: "Peu d'argent au départ.",
      cards: ['fete_rose', 'primaire'] },
    { id: 'VP', pos: 2, name: 'Les Verts Pâturages', short: 'Verts Pâturages', family: 'Écologie',
      candidate: 'Capucine Verdure', candTitle: 'l\'écolo à vélo', programme: ['renovation', 'train1', 'sp20', 'cheque', 'plastique'], financing: ['heritage', 'isf'],
      color: '#3E9B5A', ink: '#FFFFFF', money: 6, infl: 3, bases: ['ara', 'cor'],
      cred: { ecologie: 2, services: 1, pouvoir: 1, emploi: 0, securite: 0, immigration: 0 },
      force: 'À la Télé : +1 cube en plus dans les régions urbaines.',
      weakness: 'Une Collecte ne rapporte que 2 €.',
      cards: ['climat', 'canicule'] },
    { id: 'EM', pos: 4, name: 'En Mouvement', short: 'En Mouvement', family: 'Centre',
      candidate: 'Inès Disrupt', candTitle: 'la start-uppeuse', programme: ['pme', 'retraites', 'video', 'plastique', 'medecins'], financing: ['trainvie'],
      color: '#F2A93B', ink: '#1B1F3B', money: 8, infl: 4, bases: ['pdl', 'bre'],
      cred: { emploi: 2, securite: 2, ecologie: 1, services: 1, immigration: 1, pouvoir: 0 },
      force: 'Une Collecte rapporte 4 € et 1 ★. Candidat infatigable : récupère 3 ⚡ par tour (au lieu de 2).',
      weakness: "Usure du pouvoir : au tour 5, perd 1 cube dans sa région la plus forte.",
      cards: ['art493', 'remaniement'] },
    { id: 'UG', pos: 5, name: "L'Union Gaulliste", short: 'Union Gaulliste', family: 'Droite',
      candidate: 'Hubert de La Motte', candTitle: 'le notable', programme: ['policiers', 'pme', 'controles', 'tva', 'nonremplacement'], financing: ['trainvie', 'gelpoint', 'chomage'],
      color: '#4A7FD0', ink: '#FFFFFF', money: 5, infl: 4, bases: ['ges', 'nor'],
      cred: { securite: 2, emploi: 2, immigration: 1, pouvoir: 1, services: 1, ecologie: 0 },
      force: 'Fidélité : en région historique, une attaque ne peut pas le faire descendre sous 2 cubes.',
      weakness: 'Divisions : les événements « Division » lui coûtent 2 cubes au lieu de 1.',
      cards: ['appel18', 'rassemblement'] },
    { id: 'MN', pos: 6, name: 'Mouvement National', short: 'Mvt National', family: 'Droite nationale',
      candidate: 'Victor Rempart', candTitle: 'le bulldog', programme: ['referendum', 'planchers', 'tva', 'regroupement', 'video'], financing: ['trainvie'],
      color: '#24325E', ink: '#FFFFFF', money: 7, infl: 3, bases: ['hdf', 'pac'],
      cred: { immigration: 2, securite: 2, pouvoir: 1, emploi: 0, ecologie: 0, services: 0 },
      force: 'À la Télé : +1 cube en plus dans les régions industrielles.',
      weakness: 'Peu de relais locaux : il lui faut 4 cubes (au lieu de 3) pour contrôler une région.',
      cards: ['plateau_tele', 'grand_meeting'] }
  ];

  /* Actions de base. cost = { money, infl } ; target : 'region' | 'party' | null ; theme : l'action porte un message (thème) */
  var ACTIONS = {
    terrain:  { name: 'Meeting',        icon: '📣', cost: { money: 2, infl: 0, forme: 1 }, target: 'region', theme: true, text: 'Autant de cubes que l\'impact du message (1 à 4)' },
    medias:   { name: 'Télé',           icon: '📺', cost: { money: 3, infl: 1, forme: 1 }, target: 'region', theme: true, text: 'Le message passe dans cette région et les 2 autres les plus concernées par le thème' },
    reseaux:  { name: 'Buzz',           icon: '📱', cost: { money: 1, infl: 0 }, target: 'region', theme: true, text: 'Un dé : de −1 à +4 cubes, +1 si le thème fait l\'actu' },
    contre:   { name: 'Attaquer',       icon: '🥊', cost: { money: 2, infl: 1 }, target: 'region', text: '−2 cubes au rival le plus fort de la région (il faut y avoir 1 cube)' },
    fonds:    { name: 'Collecte',       icon: '💰', cost: { money: 0, infl: 0 }, target: null,     text: '+3 €' },
    reforme:  { name: 'Promesse',       icon: '📜', cost: { money: 0, infl: 4 }, target: 'region', text: '+1 cube dans toutes les régions du même profil (région contrôlée)' },
    imposer:  { name: 'Faire la une',   icon: '🗞️', cost: { money: 2, infl: 2 }, target: null,     theme: true, text: 'Ton thème fera l\'actu au prochain tour (pour tout le monde !)' },
    mobiliser:{ name: 'Mobiliser',      icon: '🚪', cost: { money: 2, infl: 0 }, target: 'region', text: 'Porte-à-porte : fais voter des abstentionnistes. Plus efficace si ton programme plaît aux groupes qui votent peu ici' },
    militants:{ name: 'Militants',      icon: '👥', cost: { money: 3, infl: 0 }, target: 'region', text: 'Implante une équipe de militants : +1 cube ici au début de chaque tour (3 équipes au plus)' },
    enquete:  { name: 'Enquêter',       icon: '🔎', cost: { money: 1, infl: 1 }, target: 'party', text: 'Fouiller le passé d\'un rival : si tu trouves quelque chose, une affaire lui tombe dessus au prochain tour' },
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
    { id: 'greve', theme: 'services',      title: 'Grève des transports',     text: 'Ce tour, les Meetings coûtent 1 € de plus.' },
    { id: 'scandale',   title: 'Scandale !',               text: 'Le parti en tête perd 2 cubes dans sa plus grande région.' },
    { id: 'buzz',       title: 'Trend viral',              text: 'Ce tour, les Buzz sont gratuits.' },
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
    { id: 'corse',      name: 'Au-delà de l\'Hexagone',   text: 'Contrôler la Corse, l\'outre-mer et les Français de l\'étranger', bonus: 3 }
  ];

  var RULES = {
    maxTurns: 8,
    actionsPerTurn: 3,
    debateTurns: [3, 6, 8],
    incomeMoney: 4, incomePerRegion: 1, incomeRegionMax: 3, incomeInfl: 2,
    minControl: 3, maxCubes: 10, startCubes: 3,
    equalStart: 2,               // v1.1 mode Égalité : 2 électeurs pour chaque parti dans chaque région
    egalEdgeBoost: 1.18,         // v1.1 mode Égalité : électorat des partis aux bouts de l'axe (FI, MN) ×1,18
    othersKeep: 0.82,            // v1.1 mode Réaliste : à chaque tour, les « autres listes » gardent 82 % de leurs électeurs
    othersTransfer: 0.6,         // au 2nd tour, 60 % des électeurs des autres listes votent pour un finaliste
    startScale: 10,              // mode Réaliste : cubes de départ = score moyen législatives + européennes 2024 (%) × 10 / 100
    spotlightCost: 2,
    /* v0.2 : axe politique, transferts, alliances, élection */
    maxAllianceDistance: 2,
    breakCost: 2,
    incumbentBonus: 1.25,        // prime au sortant : les cubes du parti qui contrôle une région comptent ×1,25 dans les votes
    objectiveVotes: 0.6,         // un objectif réussi rapporte bonus × 0,6 « millions » de voix
    transfer: { 1: 0.50, 2: 0.42, 3: 0.35, 4: 0.30, 5: 0.25 },  // report au 2nd tour selon la distance
    allyTransfer: 0.85,
    edgeMobilization: 1,         // v1.0 : supprimé (aucune source ne le justifie)
    betrayedTransfer: 0.05,
    /* v0.3 : thèmes */
    terrainCubes: [1, 1, 2, 3, 4],   // cubes gagnés en Meeting selon l'impact du message (0 à 4)
    mediaCubes:   [0, 1, 1, 1, 2],   // cubes par région à la Télé selon l'impact (0 à 4)
    mediaRegions: 3,                 // nombre de régions touchées par la Télé
    socialHotBonus: 1,               // bonus du Buzz quand le thème fait l'actu
    /* v0.4 : le candidat et ses troupes */
    formeMax: 4, formeStart: 4, formeRegen: 2,   // ⚡ forme du candidat (Meeting et Télé en coûtent 1)
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
    fundingMax: 3,                   // mesures de financement en plus des 5 promesses
    echoScale: 15, echoGoodN: 4, echoBadN: 2,     // écho du programme : +1 cube en Meeting dans ses 4 régions de cœur, −1 dans ses 2 régions hostiles
    budgetCasStep: 15,               // +1 casserole par tranche de 15 Md€ de dépassement
    pharBonus: 1,                    // mesure phare : +1 cube en Meeting sur son thème
    affairPerCasserole: 0.12,        // chaque casserole = 12 % de risque d'affaire par tour
    canardChance: 0.35,              // sinon, Le Canard Déchaîné sort une affaire 35 % du temps
    affairsMax: 2,                   // au plus 2 affaires par tour
    enqueteBase: 0.35, enqueteCas: 0.15, enqueteBackfire: 0.3,
    /* v1.0 : participation et vote blanc */
    round1Abst: 0.939,           // abstention au 1er tour = abstention du 2nd × 0,939 (26,31 % contre 28,01 % en 2022)
    round1Blank: 0.254,          // blancs et nuls au 1er tour = ceux du 2nd × 0,254 (2,2 % contre 8,7 % des votants en 2022)
    turnoutMax: 0.92,
    mobTurnout: 0.006,           // chaque cube mobilisé = +0,6 point de participation dans la région
    registerTurns: 3,            // jusqu'au tour 3 : Mobiliser inscrit aussi de nouveaux électeurs (+0,3 % d'inscrits)
    attackBlank: 0.003, attackAbst: 0.002, affairAbst: 0.001,   // campagne négative : des électeurs écœurés
    blankOfNonTransfer: 0.35     // au 2nd tour, part des électeurs non reportés qui votent blanc (le reste s'abstient)
  };

  /* ---------- v0.6 : le débat télévisé ----------
     Chaque parti affronte chacun des autres sur une question (un thème).
     Attaque bat Émotion, Émotion bat Chiffres, Chiffres bat Attaque. Esquive = match nul.
     Manche gagnée = 2 points, nulle = 1, perdue = 0, plus les bonus de chaque réplique. */
  var REPLIES = {
    attaque:  { name: 'Attaque',  icon: '🥊', beats: 'emotion',  hint: 'Bat l\'émotion. +1 si ton rival traîne des casseroles.' },
    chiffres: { name: 'Chiffres', icon: '📊', beats: 'attaque',  hint: 'Bat l\'attaque. +1 si c\'est ton point fort, −1 si ce n\'est pas ton sujet.' },
    emotion:  { name: 'Émotion',  icon: '❤️', beats: 'chiffres', hint: 'Bat les chiffres. +1 si le thème fait l\'actu.' },
    esquive:  { name: 'Esquive',  icon: '🙃', beats: null,       hint: 'Match nul assuré : 1 point chacun.' }
  };
  /* Tempérament de chaque parti en débat : probabilité de chaque réplique (l'IA s'adapte aussi au thème) */
  var TEMPERS = {
    FI: { label: 'bagarreur',      w: { attaque: 5, emotion: 3, chiffres: 1, esquive: 1 } },
    VP: { label: 'passionné',      w: { emotion: 5, chiffres: 2, attaque: 2, esquive: 1 } },
    SM: { label: 'raisonnable',    w: { chiffres: 4, emotion: 3, esquive: 2, attaque: 1 } },
    EM: { label: 'technocrate',    w: { chiffres: 5, esquive: 3, attaque: 1, emotion: 1 } },
    UG: { label: 'solennel',       w: { chiffres: 3, attaque: 3, emotion: 2, esquive: 2 } },
    MN: { label: 'tribun',         w: { attaque: 4, emotion: 4, esquive: 1, chiffres: 1 } }
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
      { label: 'Nier en bloc', hint: 'Pile ou face : l\'affaire s\'éteint… ou −3 cubes et +1 casserole', fx: [{ k: 'dice', chance: 0.5, win: [], lose: [{ k: 'strong', n: -3 }, { k: 'cas', n: 1 }] }] },
      { label: 'S\'excuser à la télé', hint: '−2 ★, mais +1 cube : on salue ta franchise', fx: [{ k: 'infl', n: -2 }, { k: 'strong', n: 1 }] },
      { label: 'Contre-attaquer', hint: '−1 ★, le rival en tête perd 2 cubes… mais +2 casseroles', fx: [{ k: 'infl', n: -1 }, { k: 'rival', n: 2 }, { k: 'cas', n: 2 }] } ] },
    { id: 'mecene', title: 'Le mécène généreux', text: 'Un riche industriel propose de financer ta campagne. Il ne demande rien… pour l\'instant.', options: [
      { label: 'Accepter l\'argent', hint: '+5 € et +1 casserole… et ça pourrait ressortir', fx: [{ k: 'money', n: 5 }, { k: 'cas', n: 1 },
        { k: 'later', turns: 3, chance: 0.5, title: 'L\'affaire du mécène', text: 'Les juges s\'intéressent aux dons de ton mécène.', fx: [{ k: 'strong', n: -2 }, { k: 'cas', n: 1 }] }] },
      { label: 'Refuser poliment', hint: '+1 ★ : l\'intégrité, ça se remarque', fx: [{ k: 'infl', n: 1 }] } ] },
    { id: 'derapage', title: 'Dérapage sur les réseaux', text: 'Un de tes militants publie un message très maladroit qui devient viral.', options: [
      { label: 'L\'exclure du parti', hint: '−1 cube, mais −1 casserole', fx: [{ k: 'strong', n: -1 }, { k: 'cas', n: -1 }] },
      { label: 'Le défendre', hint: 'Ta base apprécie : +1 cube. Mais +1 casserole', fx: [{ k: 'strong', n: 1 }, { k: 'cas', n: 1 }] },
      { label: 'Ne rien dire', hint: 'Pile ou face : ça passe, ou −2 ★', fx: [{ k: 'dice', chance: 0.5, win: [], lose: [{ k: 'infl', n: -2 }] }] } ] },
    { id: 'emission', title: 'Le talk-show du dimanche', text: 'L\'émission la plus regardée du pays t\'invite. Ambiance survoltée garantie.', options: [
      { label: 'Y aller', hint: '−1 ⚡ · 2 chances sur 3 : +1 cube dans 3 régions ; sinon gaffe', fx: [{ k: 'forme', n: -1 }, { k: 'dice', chance: 0.67, win: [{ k: 'regions', n: 1, count: 3 }], lose: [{ k: 'strong', n: -1 }, { k: 'cas', n: 1 }] }] },
      { label: 'Envoyer ton porte-parole', hint: '+1 cube dans ta meilleure région, sans risque', fx: [{ k: 'regions', n: 1, count: 1 }] },
      { label: 'Décliner et te reposer', hint: '+1 ⚡', fx: [{ k: 'forme', n: 1 }] } ] },
    { id: 'transfuge', title: 'Un ancien ministre veut te rejoindre', text: 'Connu de tous, il apporte ses réseaux… et sa réputation.', options: [
      { label: 'L\'accueillir', hint: '+1 cube dans 3 régions, +1 casserole. Restera-t-il fidèle ?', fx: [{ k: 'regions', n: 1, count: 3 }, { k: 'cas', n: 1 },
        { k: 'later', turns: 2, chance: 0.35, title: 'Le transfuge claque la porte', text: 'Ton nouvel allié repart avec fracas, et ses électeurs avec lui.', fx: [{ k: 'strong', n: -2 }] }] },
      { label: 'Refuser', hint: '+1 ★ auprès de tes militants', fx: [{ k: 'infl', n: 1 }] } ] },
    { id: 'promesse', title: 'La promesse qui fâche', text: 'Tes conseillers veulent promettre une baisse d\'impôts massive. Ça plaît… mais c\'est finançable ?', options: [
      { label: 'Promettre', hint: '+1 cube dans 3 régions, mais les économistes vont faire les comptes', fx: [{ k: 'regions', n: 1, count: 3 },
        { k: 'later', turns: 2, chance: 0.8, title: 'Les économistes font les comptes', text: 'Ta promesse coûterait 40 milliards. Les plateaux télé se régalent.', fx: [{ k: 'infl', n: -2 }, { k: 'cas', n: 1 }] }] },
      { label: 'Rester sérieux', hint: '+1 ★', fx: [{ k: 'infl', n: 1 }] } ] },
    { id: 'enregistrement', title: 'L\'enregistrement volé', text: 'Un enregistrement de toi en privé circule. Tu y parles de tes électeurs avec… un certain mépris.', options: [
      { label: 'Démentir', hint: 'Pile ou face : ça passe, ou −2 cubes et +2 casseroles', fx: [{ k: 'dice', chance: 0.5, win: [], lose: [{ k: 'strong', n: -2 }, { k: 'cas', n: 2 }] }] },
      { label: 'Assumer et t\'excuser', hint: '−1 cube dans tes 2 meilleures régions, −1 casserole', fx: [{ k: 'loseTop', n: 1, count: 2 }, { k: 'cas', n: -1 }] } ] },
    { id: 'concert', title: 'Le concert gratuit', text: 'Une équipe propose un grand concert gratuit pour les jeunes, avec des artistes connus.', options: [
      { label: 'Organiser le concert', hint: '−3 €, +1 cube dans 2 régions urbaines', fx: [{ k: 'money', n: -3 }, { k: 'regions', n: 1, count: 2, profile: 'urbaine' }] },
      { label: 'Trop cher', hint: 'Rien ne se passe', fx: [] } ] },
    { id: 'sondage_interne', title: 'Le sondage interne', text: 'Ton équipe a commandé un sondage secret. Il est catastrophique sur ton thème fétiche.', options: [
      { label: 'Changer de cap', hint: '−2 € · +2 ★ (on te trouve à l\'écoute)', fx: [{ k: 'money', n: -2 }, { k: 'infl', n: 2 }] },
      { label: 'Garder le cap', hint: '+1 ⚡ : tu restes serein', fx: [{ k: 'forme', n: 1 }] },
      { label: 'Le faire fuiter… en le truquant', hint: '+1 cube dans 2 régions, mais ça peut se savoir', fx: [{ k: 'regions', n: 1, count: 2 },
        { k: 'later', turns: 2, chance: 0.5, title: 'Le sondage truqué', text: 'L\'institut dément avoir publié ces chiffres.', fx: [{ k: 'loseTop', n: 1, count: 2 }, { k: 'cas', n: 2 }] }] } ] }
  ];

  /* ---------- v0.5 : crises en 3 actes (une par partie) ----------
     Chaque acte remplace l'événement du tour. markers : icônes posées sur la carte ;
     dans ces régions, le thème du marqueur compte comme « à la une ». */
  var CRISES = [
    { id: 'finance', name: 'Crise financière', acts: [
      { title: 'Rumeurs de krach', text: 'Les marchés tremblent. Chaque parti perd 1 €.', theme: 'pouvoir', fx: [{ k: 'allMoney', n: -1 }] },
      { title: 'Krach boursier !', text: 'Chaque parti perd 2 €. Le pouvoir d\'achat écrase tous les autres sujets.', theme: 'pouvoir', fx: [{ k: 'allMoney', n: -2 }] },
      { title: 'La reprise', text: 'Chaque parti regagne 2 €. Les partis très crédibles sur le pouvoir d\'achat gagnent 1 cube.', theme: 'pouvoir', fx: [{ k: 'allMoney', n: 2 }, { k: 'credTop', theme: 'pouvoir', n: 1 }] } ] },
    { id: 'greve', name: 'Grève générale', acts: [
      { title: 'Grève dans les transports', text: 'Plus un train en Île-de-France. Là-bas, les services publics sont sur toutes les lèvres.', theme: 'services', markers: [{ rid: 'idf', icon: '✊', theme: 'services', turns: 3 }], fx: [] },
      { title: 'La grève s\'étend', text: 'Le Nord, l\'Est et la Normandie rejoignent le mouvement. Les Meetings coûtent 1 € de plus ce tour.', theme: 'services',
        markers: [{ rid: 'hdf', icon: '✊', theme: 'services', turns: 2 }, { rid: 'ges', icon: '✊', theme: 'services', turns: 2 }, { rid: 'nor', icon: '✊', theme: 'services', turns: 2 }], fx: [{ k: 'mod', key: 'terrainExtra', v: 1 }] },
      { title: 'Fin du mouvement', text: 'Un accord est trouvé. Les partis très crédibles sur les services publics gagnent 1 cube.', theme: 'services', fx: [{ k: 'credTop', theme: 'services', n: 1 }] } ] },
    { id: 'ete', name: 'Été brûlant', acts: [
      { title: 'Canicule précoce', text: '42 °C à Marseille. Dans le Sud, l\'écologie s\'invite dans tous les débats.', theme: 'ecologie',
        markers: [{ rid: 'pac', icon: '🔥', theme: 'ecologie', turns: 3 }, { rid: 'occ', icon: '🔥', theme: 'ecologie', turns: 3 }], fx: [] },
      { title: 'Incendies dans le Sud', text: 'Les forêts brûlent. Dans chaque région touchée, le parti qui la contrôle perd 1 cube : on lui reproche son impréparation.', theme: 'ecologie',
        markers: [{ rid: 'naq', icon: '🔥', theme: 'ecologie', turns: 2 }], fx: [{ k: 'controllerLoss', regions: ['pac', 'occ', 'naq'], n: 1 }] },
      { title: 'Orages et inondations', text: 'Après le feu, l\'eau. Les partis très crédibles sur l\'écologie gagnent 1 cube.', theme: 'ecologie',
        markers: [{ rid: 'bre', icon: '🌊', theme: 'ecologie', turns: 2 }, { rid: 'pdl', icon: '🌊', theme: 'ecologie', turns: 2 }], fx: [{ k: 'credTop', theme: 'ecologie', n: 1 }] } ] },
    { id: 'usines', name: 'Désindustrialisation', acts: [
      { title: 'Une usine ferme dans le Nord', text: '800 emplois supprimés. Dans les Hauts-de-France, on ne parle plus que d\'emploi.', theme: 'emploi',
        markers: [{ rid: 'hdf', icon: '🏭', theme: 'emploi', turns: 3 }], fx: [] },
      { title: 'Plan social dans l\'Est', text: 'Le Grand Est est touché à son tour. Le parti qui contrôle le Nord et l\'Est perd 1 cube dans chacune.', theme: 'emploi',
        markers: [{ rid: 'ges', icon: '🏭', theme: 'emploi', turns: 2 }], fx: [{ k: 'controllerLoss', regions: ['hdf', 'ges'], n: 1 }] },
      { title: 'Plan de relance', text: 'L\'État annonce un plan de relance. Les partis très crédibles sur l\'emploi gagnent 1 cube.', theme: 'emploi', fx: [{ k: 'credTop', theme: 'emploi', n: 1 }] } ] }
  ];

  var DATA = { REGIONS: REGIONS, PROFILES: PROFILES, THEMES: THEMES, HEADLINES: HEADLINES, PARTIES: PARTIES, ACTIONS: ACTIONS,
               CARDS: CARDS, EVENTS: EVENTS, DILEMMAS: DILEMMAS, CRISES: CRISES, REPLIES: REPLIES, TEMPERS: TEMPERS,
               MEASURES: MEASURES, FUNDING: FUNDING, SEGMENTS: SEGMENTS, VOTE_PROP: VOTE_PROP, SEGMENTS_SRC: SEGMENTS_SRC, AFFAIRS: AFFAIRS, LEARN: LEARN, BUDGET_AFFAIR: BUDGET_AFFAIR, REACTIONS: REACTIONS, ADVISOR: ADVISOR, OBJECTIVES: OBJECTIVES, RULES: RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.PolitikData = DATA;
})(this);

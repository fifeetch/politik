# Feuille de route

## v0.1 — fait
- Carte des 13 régions, 6 partis parodiques, 8 tours, toi contre 3 IA.
- Actions, cartes spéciales, événements, débats, « Sous les projecteurs ».
- Tutoriel guidé du premier tour.

## v0.2 — fait
- **Axe politique** gauche–droite (FI · VP · SM · EM · UG · MN).
- **Électeurs proches** : faire campagne là où un parti voisin est présent lui prend des électeurs.
- **Alliances** : entre partis proches (distance 2 au plus), pas d'attaque entre alliés, rupture possible (trahison).
- **Élection à deux tours** après les 8 tours de campagne, avec reports de voix selon la proximité et les alliances.
- Sondage en direct à la place des points de régions.

## v0.3 — fait : les thèmes de campagne
- **6 thèmes** : 💶 Pouvoir d'achat · 🏭 Emploi & industrie · 🏥 Services publics · 🌿 Écologie · 🚓 Sécurité · 🛂 Immigration.
- **Chaque région a 2 préoccupations**, chaque parti une **crédibilité** (faible, moyenne, forte) sur chaque thème.
- **Impact d'un message** (0 à 4) = crédibilité + 1 si la région s'en préoccupe + 1 si le thème fait l'actu.
  📣 Meeting rapporte de 1 à 4 cubes selon l'impact ; 📺 Télé touche les régions concernées par le thème ; 📱 Buzz +1 si le thème fait l'actu.
- **À la une** : chaque tour, un thème fait l'actualité (celui de l'événement, sinon au hasard), avec un gros titre.
- Nouvelle action **🗞️ Faire la une** (2 € + 2 ★) : ton thème fera l'actu au tour suivant… pour tout le monde.
- L'IA choisit ses thèmes. Équilibrage par simulation (1 500 parties) : écart de victoires ramené de 12–40 % à 18–29 %.
- Usure du pouvoir d'En Mouvement : tours 4 et 7 seulement (au lieu de 4, 6 et 8).
- **Actions renommées en clair** : 📣 Meeting, 📺 Télé, 📱 Buzz, 🗞️ Faire la une, 🥊 Attaquer, 💰 Collecte, 📜 Promesse. Chaque bouton dit ce qu'il fait, avec les chiffres réels du moment.

## v0.4 — fait : le candidat et ses troupes
- **⚡ Forme du candidat** (4 au plus, +2 par tour) : Meeting et Télé en coûtent 1. Si une action la vide, risque de **gaffe** (4 chances sur 10) : aucun cube, +1 casserole.
- **👥 Militants** (3 €) : une équipe implantée rapporte +1 cube par tour dans sa région (3 équipes par parti).
- **↗ Dynamique** : +1,5 point au sondage en un tour = +1 cube sur les Meetings du tour suivant (−1 en passage à vide).
- **Crédibilité qui évolue** : 3 actions sur un même thème = +1 de crédibilité dessus.
- En Mouvement : candidat infatigable (+3 ⚡ par tour), usure du pouvoir au tour 5 seulement.

## v0.5 — fait : dilemmes, casseroles et crises
- **🤔 Dilemmes** : chaque tour, un parti à tour de rôle fait un choix (9 dilemmes : notes de frais, mécène, talk-show, transfuge, promesse intenable…). Les choix de l'IA sont racontés dans le journal.
- **⏳ Conséquences différées** : certains choix peuvent ressortir 2 ou 3 tours plus tard.
- **🍳 Casseroles** : attaquer, trahir, le 49.3, une gaffe ou certains choix en ajoutent. Chacune = 8 % de risque de scandale par tour (−2 cubes, puis l'affaire est soldée).
- **Crises en 3 actes** (une par partie, entre les tours 2 et 6) : krach, grève générale, été brûlant, désindustrialisation.
- **Événements sur la carte** : les régions touchées par une crise portent une icône (✊ 🔥 🌊 🏭) ; leur thème y compte comme à la une.
- **Journal du matin** : chaque tour s'ouvre sur un seul écran (la une, puis « en bref »).

## Idées en réserve
- Militants visibles pour tous les partis, et possibilité de les déloger.
- Dilemmes liés au thème fort de chaque parti.

## v0.6 — fait : les grands moments
- **🎙️ Débat télévisé en face-à-face** (tours 3, 6, 8) : chaque parti affronte les 3 autres, une question (un thème) chacun.
  Répliques : 🥊 Attaque bat ❤️ Émotion, ❤️ Émotion bat 📊 Chiffres, 📊 Chiffres bat 🥊 Attaque, 🙃 Esquive = nul.
  Bonus selon la situation (casseroles du rival, point fort, actualité). Préparation : jusqu'à 3 ★ = +1 point chacune.
  Chaque parti a un **tempérament** (bagarreur, technocrate, tribun…) que l'on peut apprendre à lire.
- **📺 Flash info** en fin de tour : 2 à 4 gros titres (régions qui changent de main, gaffes, alliances) et le bandeau du sondage ▲▼. Le détail des actions est replié.
- **🕗 Soirée électorale à 20h** : compte à rebours, révélation du vainqueur de haut en bas comme à la télé, carte qui se colore région par région, barres de résultats.
- Équilibrage : électorat mobilisé des partis aux extrémités ramené de ×1,35 à ×1,25 (le nouveau débat consomme moins d'influence).

## v0.7 — fait : une campagne incarnée et qui apprend la politique
- **📋 Le programme** : avant la campagne, chaque candidat choisit 5 mesures parmi 28 (Smic à 1 600 €, 10 000 médecins, peines planchers, rénovation des logements…).
  Chaque mesure rend crédible sur son thème. La 1re est la **mesure phare** (+1 cube en Meeting sur son thème).
  Budget : au-delà de 40 Md€, le programme n'est pas financé (casseroles + affaire au tour 3). Les **mesures choc** font parler mais ajoutent une casserole.
- **💥 Les affaires** : 12 affaires (emplois fictifs, compte à Genève, montres de luxe…), déclenchées par les casseroles, par Le Canard Déchaîné, par une **🔎 enquête** d'un rival ou par un programme non financé. On choisit sa réaction : nier, s'excuser, sacrifier un collaborateur, accuser les médias. Environ 5 affaires par partie.
- **🖍️ Illustrations style dessin de presse** : 6 candidats inventés (Rémi Barricade, Capucine Verdure, Claire Consensus, Inès Disrupt, Hubert de La Motte, Victor Rempart), la conseillère Lulu, et des vignettes pour le journal.
- **👩‍💼 Lulu, la directrice de campagne** : un conseil clair à chaque tour, selon la situation.
- **📚 Comprendre la politique** : chaque mesure a sa fiche (c'est quoi, un argument pour, un argument contre) ; 16 fiches sur les institutions (second tour, 500 parrainages, 49.3, motion de censure, référendum, budget, sondages, 20h…), montrées au bon moment et rassemblées dans une bibliothèque.

## v0.8 — fait : un programme financé, qui parle à des gens
- **Recettes et dépenses** : l'écran du programme détaille les dépenses nouvelles, les recettes et économies, et le reste à financer (25 Md€ au plus).
- **10 mesures de financement** (impôt sur la fortune, héritages, niches fiscales, fraude fiscale, TVA, CSG des retraités aisés, gel des pensions, gel du point d'indice, assurance chômage, train de vie de l'État), 3 au plus, chacune avec sa fiche pour / contre.
- **6 groupes de population** (indépendants, cadres, professions intermédiaires, employés et ouvriers, retraités, étudiants et sans emploi), avec leur vraie part dans chaque région (Insee, recensement 2022).
- Chaque mesure plaît 👍 ou déplaît 👎 à certains groupes. Le programme a ses **4 régions de cœur** (+1 cube en Meeting, +1 cube au départ dans les 3 meilleures) et ses **2 régions hostiles** (−1 cube en Meeting).
- « 👥 Qui vit ici ? » : la composition de chaque région comparée à la moyenne nationale.

## v0.9 — fait : gouverner le pays
Quand tu gagnes la présidentielle, le bouton « 🏛️ Gouverner le pays » ouvre ton quinquennat : 5 années, chacune en 4 saisons.
- **Les législatives** : 577 sièges répartis selon tes résultats dans les régions. Majorité absolue (289), relative ou faible.
- **Printemps — ta loi de l'année** : chaque promesse devient un projet de loi. L'hémicycle montre qui vote pour, contre, ou s'abstient, avec les **frondeurs** de ton propre camp.
  Tu peux faire voter, **négocier** avec un groupe (la mesure est amendée : moitié des effets), tenter le **49.3** (motion de censure à 289 voix, gouvernement renversé, dissolution au 2e renversement) ou le **référendum** (le Conseil constitutionnel peut l'annuler).
- **Été — l'actualité** : canicule, marchés inquiets, affaire ministérielle, colère des automobilistes, rapport de la Cour des comptes…
- **Automne — le budget** : 3 notes de Bercy à arbitrer (point d'indice, pensions, carburant, hôpital…), avis du Haut Conseil des finances publiques, vote du budget.
- **Hiver — le bilan** : intérêts de la dette, trajectoire vers 3 % (Bruxelles), marchés, popularité.
- **4 jauges** : déficit (départ 5 % du PIB), dette (118 % du PIB), popularité (calculée à partir des 6 groupes de population, pondérés par leur poids Insee), sièges à l'Assemblée.
- **Bilan du mandat** : promesses tenues, comptes publics, popularité, trophées, et réélection… ou pas.
- 7 nouvelles fiches sourcées (législatives, vote des lois, Haut Conseil des finances publiques, règle des 3 %, dissolution, Cour des comptes).
- Simulation : `node test/govern-sim.js 300` vérifie les ordres de grandeur (déficit, dette, popularité, verdicts).

## v1.0 — fait : de vrais électeurs, et un nouvel habit
- **Électeurs réels** : chaque région pèse ses inscrits (présidentielle 2022), moins l'abstention et les votes blancs ou nuls. Corse, outre-mer et Français de l'étranger regroupés dans un encart.
- **Départ aux législatives 2024** : les cubes de départ suivent les résultats de 2024, région par région (le Mouvement National part en tête). Le score 2024 s'affiche au choix du parti.
- **🚪 Mobiliser** remplace Buzz parmi les actions principales : du porte-à-porte pour faire voter des abstentionnistes (et inscrire de nouveaux électeurs jusqu'au tour 3). Buzz passe dans le menu Plus.
- **Calque Abstention** sur la carte ; « Qui vit ici ? » montre inscrits, abstention et blancs ; participation et blancs à la soirée électorale ; au second tour, les électeurs non reportés votent blanc ou s'abstiennent.
- **Programme** : financé, partiellement financé ou non financé (25 Md€ tolérés).
- **Gouverner, plus réaliste** : la charge de la dette alourdit le déficit de 0,2 point par an ; les recettes du programme entrent au premier budget ; dépenses ponctuelles (remise à la pompe, plans d'aide) qui s'arrêtent l'année suivante ; chaque automne, la « tenue des dépenses » ; nouvelles notes de Bercy (année blanche, surtaxe sur les grandes entreprises, franchises médicales) ; pas de référendum sur une mesure pénale (article 11) ; dissolution au choix dès l'année 2 (article 12) ; sièges répartis selon les inscrits.
- Simulation (`node test/govern-sim.js 300 c`) : un mandat équilibré est réélu environ une fois sur trois ; tout dépenser ou tout économiser mène à l'échec.
- **Nouvel univers graphique « bureau de vote »** : papier de bulletin, encre violette de tampon pour les actions, rouge pour l'actualité et les affaires. Titres en Anybody (police d'affiche), texte et chiffres en Atkinson Hyperlegible (conçue pour la lisibilité). Coup de tampon « Validé » à la fin de chaque tour. Polices livrées avec le jeu : il marche entièrement hors ligne.

## v1.1 — fait : deux modes de jeu
- **Réaliste** : chaque parti démarre avec la moyenne de ses scores aux législatives (1er tour) et aux européennes de 2024, région par région (résultats définitifs du ministère de l'Intérieur). Les petites listes et les partis absents de la partie comptent sous « Autres » dans les sondages (le RN part vers 31 %, comme en 2024) ; la campagne les réduit peu à peu (vote utile), et au second tour 60 % d'entre eux votent pour un finaliste. Plus de région attribuée d'office : le contrôle suit la règle normale.
- **Égalité** : chaque parti a 2 électeurs dans chaque région, personne ne tient de région au départ. Les partis aux deux bouts de l'axe (FI, MN) ont un électorat un peu plus mobilisé (×1,18) pour compenser des reports de second tour plus faibles. Simulation (3 000 parties) : 21 à 32 % de victoires pour chaque parti.
- Fiche « Pourquoi ces chiffres ? » au choix du parti et dans les règles. Le mode choisi est retenu pour les parties suivantes.
- À surveiller : en Réaliste, Socialisme Modéré et En Mouvement gagnent un peu plus souvent (33 %), Les Verts Pâturages moins (16 %), ce qui suit leur poids de départ.

## v1.2 — fait : des sources d'État, vérifiées automatiquement
- **Chaque mesure** du programme (28) et **chaque financement** (10) a sa **source officielle** dans sa fiche (Service-Public.fr, Cour des comptes, Conseil constitutionnel, ministères, Sénat…). Chaque lien a été ouvert et contrôlé à la main.
- **Fiches mises à jour avec les chiffres officiels de 2026** : Smic à 1 478 € net (juin 2026), suspension de la réforme des retraites jusqu'en 2028, contribution exceptionnelle des grandes entreprises prolongée en 2026, gel des pensions 2026 retiré, point d'indice à 4,92 €, 77 Md€ de baisses de charges, 92 Md€ de niches fiscales, 17 Md€ réclamés par le contrôle fiscal, taxe sur les jets depuis mars 2025, fin du plastique jetable d'ici 2040, peines planchers supprimées en 2014, Pass Rail testé en 2024…
- **🗳️ En vrai, pour 2027** : chaque fiche dit quels partis défendent une mesure proche, d'après le comparateur Comprendre la Politique (référence pédagogique, non officielle, date du relevé affichée).
- **Vérification automatique** (`test/check-sources.js` + robot GitHub « Sources officielles ») : chaque fiche a une source, sur un site de l'État ou d'une institution publique ; chaque lien répond et parle toujours du sujet ; le relevé 2027 a moins de 60 jours. À chaque modification et chaque lundi ; e-mail en cas de problème.

## Idées pour la suite (à partir du comparateur 2027)
- Nouvelles mesures très débattues : âge de la retraite (60, 62, 64 ou 65 ans), droit du sol, aide médicale d'État, encadrement des loyers, nouveaux réacteurs nucléaires, éoliennes, référendum d'initiative citoyenne, proportionnelle, places de prison.
- Thèmes absents du jeu : logement, énergie, Europe, institutions, agriculture.

## v1.3 — fait : un écran pour paramétrer sa partie
- Après « Nouvelle partie », un écran de paramétrage : mode **Réaliste** ou **Simulation** (égalité des chances).
- En Réaliste, trois points de départ au choix, avec leurs sources et leurs limites :
  1. **Présidentielle 2022** : 1er tour par région (Mélenchon, Hidalgo, Jadot, Macron, Pécresse, Le Pen ; ministère de l'Intérieur).
  2. **Dernières élections** : moyenne des législatives et des européennes 2024.
  3. **Sondages 2026** : moyenne de 6 sondages d'octobre 2026 pour la présidentielle 2027 (Harris Interactive, OpinionWay, Ifop, YouGov, Elabe, Odoxa) : RN 35,1 %, LFI 16,3 %, centre (Philippe + Attal) 15,8 %, PS-Place publique 12,8 %, LR 5,9 %, Écologistes 3 %. Chaque région garde son profil de 2024 et suit la tendance nationale.
- Aperçu des scores nationaux de départ ; chaque parti a au moins 1 électeur dans chaque région.
- Simulation (1 500 parties par point de départ) : la présidentielle 2022 avantage le centre (43 % de victoires), les sondages 2026 le RN (34 %), conformément aux chiffres réels.

## Plus tard — rejouabilité
- Phase des **500 parrainages** avant la campagne.
- IA avec des personnalités (populiste, prudente, opportuniste).
- Mode carrière sur plusieurs élections.

## Plus tard
- Placement manuel des cubes gagnés en débat.
- Multijoueur entre amis (tour par tour en ligne).
- Version jeu de plateau (prototype papier).
- Application sur les stores.

## v2.0 — fait : du fun en 30 secondes (retours d'un bêta-testeur)
- **▶ Jouer** : partie rapide en deux touchers (parti, puis « C'est parti ! »), programme conseillé pris d'office. Le paramétrage complet passe dans « Partie personnalisée ».
- **Premier tour sans lecture** : pas de journal d'ouverture en partie rapide (il reste dans l'onglet Actu), et le dilemme du joueur passe au tour 2.
- **Tutoriel en 4 gestes** : Lulu dit une phrase par étape, la meilleure région clignote, et chaque étape attend un geste du joueur. À la fin du tour, une récompense (ta place au sondage) remplace l'écran « Bon à savoir ».

## v2.1 — fait : moins d'infos d'un coup, on va chercher le détail
- **Journal du matin** : une première page de vrai journal (gros titre, dessin, 3 brèves) qui arrive à l'écran ; « Ouvrir le journal » donne les pages intérieures par rubriques.
- **Flash info** en direct télé : carte des régions qui basculent, un seul gros titre, deux brèves au plus, bandeau des sondages qui défile ; « Tout le détail » pour le reste.
- **Résultats** : second tour et podium à l'écran ; premier tour complet, reports de voix et objectifs secrets en sous-menus.
- **Région touchée** : ses préoccupations s'affichent tout de suite.

## v2.2 — fait : un vrai journal
- **La une photo** : une scène dessinée plein écran et un mot géant (« Rideau. », « Krach. », « Pugilat. »…) selon l'événement, puis 3 titres qui ouvrent chacun leur article.
- **De vrais articles** écrits à partir du tour : les partis à la rencontre des habitants d'une ville, au 20 h, en porte-à-porte, sur les réseaux, les régions qui basculent, les affaires, le sondage.

## v2.3 — fait : les vraies législatives (lot 1 sur 4)
- **577 circonscriptions** simulées, sièges réels par région (découpage de 2010), deux tours avec les règles du code électoral : élu au 1er tour (50 % des exprimés et 25 % des inscrits), qualification à 12,5 % des inscrits, triangulaires, désistements quand le premier est loin et un autre qualifié proche.
- **Point de départ** : les scores régionaux du 1er tour de la présidentielle, effet locomotive selon l'avance du président, abstention plus forte chez les jeunes et les ouvriers (6 groupes Insee), variations locales gauche-droite, candidatures communes par grandes familles (en attendant de les négocier au lot 2).
- **Soirée des législatives** : 1er tour (participation, scores par bloc, élus du soir, duels, triangulaires), puis hémicycle qui se remplit région par région avec la barre des 289 ; verdict : majorité absolue, relative, sans majorité ou cohabitation. Aussi après une dissolution (le résultat suit la popularité du moment).
- **Équilibre** (`node test/legis-sim.js 200`) : majorité absolue environ 2 fois sur 3, relative 1 fois sur 4, sans majorité ou cohabitation sinon ; participation autour de 48 % ; une dissolution à 35 % de popularité tourne souvent mal.
- 2 fiches « Le saviez-vous ? » : comment on devient député, pourquoi les législatives suivent la présidentielle.
- Raccourci « Passer la campagne » réparé (il ne finissait plus depuis l'entre-deux-tours).

## v2.4 — fait : ta campagne des législatives (lot 2 sur 4)
- **Former ton camp** : 3 propositions d'alliance (candidature unique dès le 1er tour). La chance d'un oui suit l'écart sur l'axe gauche-droite (85 % tout près, 60 %, 35 %, 15 %, 5 % aux antipodes) : facile dans son camp, possible entre camps (gauche modérée et droite, écologistes et droite…), +15 % pour un parti qui t'a soutenu au 2nd tour de la présidentielle. Le « cordon » : la droite nationale (Mouvement National, Grande Nostalgie) et les partis du centre et de la gauche se méfient (×0,4). Plus un allié est loin, moins ses électeurs suivent la candidature commune. Les partis de ta famille qui ne signent pas partent sous leur propre bannière.
- **2 tours de campagne, 3 actions par tour**, sur une carte où chaque région affiche ses circonscriptions disputées : Le président en meeting (+10 %, −2 de popularité, une fois par tour), Investir une vedette (+8 %, 2 en tout), Mobiliser (+4 %, +3 % là où l'on vote peu), Clip national (+2 % partout). Une même région rapporte moins à chaque nouvelle action. Chaque bouton annonce les sièges qu'il peut rapporter, d'après la projection. Les autres blocs font campagne dans leurs régions fortes.
- **Ton entre-deux-tours** : se maintenir ou se retirer dans chaque triangulaire où ton camp est 3e, un pacte de désistement réciproque avec un autre bloc (une tentative), et une consigne de barrage là où ton camp est éliminé. La projection du 2nd tour se met à jour à chaque choix.
- La carte des 577 circonscriptions est tirée une fois : projections et vote réel portent sur la même géographie ; le jour du vote garde sa part de hasard (l'humeur du pays).
- **Équilibre** (`node test/legis-sim.js 150`) : un joueur qui forme son camp, fait campagne et choisit bien obtient la majorité absolue environ 6 fois sur 10 (relative 1 fois sur 4) ; avec des alliances mais sans campagne, environ 1 fois sur 2 ; seul, jamais.

## v2.5 — fait : ton personnage et ton parti
- **Ton personnage** : nom (ou un nom en jeu de mots au hasard), visage à composer dans le style dessin de presse (6 peaux, 6 coiffures, 6 couleurs de cheveux, lunettes, expression, tenue, barbe), et un style en débat (Tribun, Technocrate, Bagarreur, Rassembleur) qui fixe ton tempérament. Il remplace le candidat partout : pion sur la carte, journal, débats, soirée électorale, quinquennat.
- **Prendre la tête d'un parti** : bouton « Candidat : toi » ; le parti garde ses électeurs, ses régions et son programme. Il retrouve son candidat à la partie suivante si tu changes d'avis.
- **Fonder ton parti** : nom, sigle (2 ou 3 lettres), couleur, place sur l'axe (10 crans, avec les 12 partis en repère), 2 thèmes forts. Son programme part de tes thèmes, complété par les idées des partis voisins ; ses régions de base sont celles qui partagent tes préoccupations.
- **Équilibre** (`node test/perso-sim.js 200`) : départ entre 2 et 4 %, environ 8 % au 1er tour quand l'ordinateur le mène, victoire 5 à 18 % des parties selon sa place sur l'axe (plus facile au centre, plus dur aux extrêmes).
- Le gouvernement et l'opposition sont décalés en v2.6 et v2.7.

## v2.5.1 — fait : deux corrections
- Le mot « cubes » (venu du jeu de plateau) est remplacé par **soutiens** dans tous les textes du jeu.
- L'affaire qui sort dans la presse adopte le style de la une de la v2.2 (scène plein cadre, mot géant), la fiche « Le saviez-vous ? » s'ouvre d'un toucher.

## v2.6 — fait : le gouvernement (lot 3)
- **Former ton gouvernement** juste après les législatives : 6 postes liés aux thèmes du jeu, un vivier d'au moins 8 profils inventés (3 députés de ton parti avec leur région, un profil par allié, 2 experts de la société civile, 1 personnalité d'ouverture d'un parti rival), visages dessinés et noms en jeux de mots.
- **Chaque ministre** : compétence, loyauté, notoriété (1 à 3 étoiles) et un trait. Effets : compétence → lois mieux accueillies (+5 % par étoile) et moins de frondeurs ; Réseau à l'Assemblée → jusqu'à 12 voix de plus ; Bourreau de travail → une étoile de compétence en plus ; un Premier ministre peu loyal attise la fronde ; l'Économie compétente fait baisser le déficit (−0,03 point par an et par étoile).
- **Équilibres** : parité (+1 de popularité, −1 si très déséquilibré), ouverture (+2, mais plus de frondeurs la 1re année), un allié sans ministère quitte la majorité. « La proposition de Lulu » sert chaque allié et vise la parité.
- **Pendant le mandat** : chaque été, 7 chances sur 10 qu'un ministre fasse l'actualité (gaffe, affaire, fronde, démission fracassante d'un ambitieux, succès d'un bourreau de travail), avec un choix ; un remaniement par an (changer de Premier ministre : +4 de popularité la première fois, le fusible).
- **Cohabitation** : le Premier ministre est imposé par la majorité de l'Assemblée.
- Simulation (`node test/govern-sim.js 150 c`, et `… c sans` pour comparer) : un gouvernement bien composé aide, surtout par l'Économie, environ 3,5 événements de ministres par mandat. Le simulateur, bloqué depuis l'entre-deux-tours, est réparé.

## v2.7 — fait : l'opposition et la cohabitation (lot 4)
- **La partie continue après une défaite** (finaliste battu ou éliminé au 1er tour) : bouton « Continuer dans l'opposition ».
- **Législatives d'opposition** : le même moteur, mais centré sur ton camp. Tu proposes tes alliances (sauf au parti du président ; sa famille dit oui deux fois moins souvent), tu fais campagne (« Ton grand meeting » remplace le président en meeting, sans coût en popularité), tu joues ton entre-deux-tours. La majorité présidentielle se forme seule.
- **Cohabitation** : ton camp a 289 sièges → tu deviens Premier ministre, tu formes ton gouvernement (Matignon, c'est toi) et gouvernes ; le 49.3 reste possible, mais ni référendum ni dissolution (ce sont des pouvoirs du président) ; le président peut dissoudre à partir de l'année suivante si ta popularité baisse.
- **5 ans d'opposition, 4 trimestres par an** : la loi du gouvernement (tes électeurs l'aiment ou la rejettent : vote en conséquence), l'actualité de l'été, ta proposition de loi le jour réservé (article 48), la motion de censure en hiver (58 signatures, 289 voix ; une proposition de coalition par an). Gouvernement renversé : nouveau Premier ministre, ou dissolution si le président est assez populaire et que l'article 12 le permet.
- **Bilan** : intentions de vote pour la prochaine présidentielle (favori, dans la course, distancé), tes lois adoptées, les gouvernements renversés.
- 2 fiches « Le saviez-vous ? » : le jour réservé à l'opposition (article 48), la cohabitation (articles 5, 8, 12, 15, 20, 52 ; 1986, 1993, 1997).
- Simulation (`node test/oppo-sim.js 100`) : cohabitation directe environ 1 fois sur 20 ; après 5 ans d'opposition active, ton parti gagne environ 4 points, finit favori environ 4 fois sur 10 ; environ un gouvernement renversé par mandat.

## v2.8 — fait : campagne éclair et sauvegarde
- **Campagne éclair** (3 tours) : bouton sur l'écran titre et choix « Durée de la campagne » dans la partie personnalisée. Règles adaptées : un débat au tour 3, crise dès le tour 1, inscriptions possibles au tour 1 seulement, petites listes qui fondent plus vite, revenus de 6 € et +3 ⚡ par tour, effet nouveauté sur 2 tours.
- **Sauvegarde automatique** au début de chaque tour de campagne (le hasard du jeu est sauvegardé aussi : la partie reprend à l'identique) ; « Reprendre ta partie » sur l'écran titre ; la sauvegarde s'efface à la soirée électorale ou si tu abandonnes.
- Simulation (`FORMAT=eclair node test/simulate.js 600`) : aucune erreur.
- **v2.8.1 — rééquilibrage de l'éclair** : en 3 tours, le Mouvement National (en tête au départ) gagnait 45 % des parties, contre 32 % en 8 tours. Désormais, en éclair : un Meeting rapporte 2 à 5 soutiens (au lieu de 1 à 4), la Télé 1 à 3 par région (au lieu de 0 à 2), les cagnottes de départ se rapprochent (60 % du chemin vers 5 €), et l'usure du pouvoir d'En Mouvement frappe au tour 2 (elle ne se déclenchait jamais en 3 tours). Résultat sur 600 parties : Mouvement National 33 %, En Mouvement 21 %, Cap au Large 15 %, Socialisme Modéré 11 % ; le format classique est inchangé. En Mouvement reste un peu fort en éclair : à surveiller.
- Pas encore sauvegardés : l'entre-deux-tours, les législatives et le quinquennat (on reprend au début du dernier tour de campagne).

## v2.8.2 — fait : la campagne des législatives, plus lisible
- Les actions ne sont plus grisées en attendant qu'on touche une région : touche une action, le jeu te demande **« Où ? »** et classe les 13 régions par sièges à gagner (+12, +5…), avec la meilleure marquée « conseillé ».
- Après chaque action : le gain en sièges et la projection avant → après, et un journal du tour (« 📣 Île-de-France +8 sièges »).
- Une légende explique la carte (couleur = région qui penche pour ton camp, pastilles = circonscriptions disputées), et une fiche « Ta campagne en 2 tours » au début.
- Quand les 3 actions sont jouées, un message le dit clairement au lieu de boutons grisés.

## v2.9 — fait : les nouvelles lois
- Au printemps, « Ta loi de l'année » propose tes promesses **et** une nouvelle loi, en trois familles : faire rentrer de l'argent (8 mesures), réduire les dépenses (7 mesures), autres idées (le reste du catalogue). Toutes ont déjà leur fiche sourcée.
- Chaque texte : ce qu'il rapporte ou coûte en Md€ et en points de déficit, les groupes contents ou fâchés, le pronostic du vote ; même vote, négociation, 49.3 et référendum que pour une promesse (pas de référendum sur un impôt).
- Une loi nouvelle ne compte pas dans les promesses tenues ; rejetée : −1 de popularité (contre −2 pour une promesse) et on peut la représenter. Trophée « Réformateur » à partir de 2 lois nouvelles adoptées. Lulu suggère une loi de recettes ou d'économies quand le déficit dérape.

## v3.0 — fait : un quinquennat plus vivant (1/4) et de nouveaux noms
- **Les cartes à glisser** : une carte par saison (20 par mandat), 32 cartes et 9 suites qui reviennent plus tard selon tes choix ; glisser ou toucher un des deux choix ; les points au-dessus des jauges (💶 😊 🏛️ ⏳) annoncent ce qui va bouger sans dire dans quel sens. Effets : déficit, dette, popularité, satisfaction des groupes, frondeurs, départ d'un allié, changement de Premier ministre. Simulation (`node test/govern-sim.js 150 c`) : jouées au hasard, elles font glisser le déficit et rendent la réélection moins sûre ; bien jouées, elles aident.
- **Les noms** : chaque parti porte le sigle de son modèle réel et un nom satirique (Le Parti Survivant, Les Enracinés, Réforme Encore, Les Rescapés, Rassemblement Nostalgique, Lutte Obstinée, Mollesse Démocrate, Hors-Sol, Debout La Flemme, Rétroconquête…) ; les dirigeants ont les initiales des candidats réels (vérifiées en octobre 2026 : Glucksmann a gagné la primaire PS-Place publique) ; 3 portraits redessinés (PS, RE, RN). 50 figures connues des partis, en version satirique, deviennent les ministres possibles ; la personnalité d'ouverture vient du parti rival le plus proche.

## Prochains lots : un quinquennat plus vivant, et l'humour des partis
- **v3.1 — Les traits satiriques des partis** : la machine à remonter le temps (Rassemblement Nostalgique, Rétroconquête), la rose qui perd ses pétales et la primaire perpétuelle (Parti Survivant), l'embouteillage au centre et ses micro-partis (Réforme Encore, Mollesse Démocrate, Hors-Sol), l'avis de recherche (Les Rescapés), le disque rayé et son bingo (La France Indignée) ; plus tard : vote interne des Enracinés, fête du saucisson du PCF, score immuable de Lutte Obstinée, le langue-de-bois-mètre en débat.
- **La France sur la carte** (humeur des régions, manifestations, déplacements du président), **les questions au gouvernement** (duel express), **la réélection rejouée** (campagne éclair depuis ton bilan).

## À venir (pistes du bêta-testeur)
- **Mécaniques débloquées au fil des parties** : scandales et dilemmes, puis le programme détaillé, puis les alliances et la phase « gouverner ».
- **Dilemmes en cartes à glisser** (à la manière de Reigns).

## v3.1 — fait : les traits satiriques (lot 1)
Chaque gag a un avantage **et** un coût, et se joue de l'intérieur quand on prend le parti.
- ⏪ **La machine à remonter le temps** (Rassemblement Nostalgique, Rétroconquête) : action « C'était mieux avant » (2 € + 1 ⚡). 3 soutiens sans thème (4 dès 1962), +1 en région de retraités. L'année rêvée recule (1990 → 1975 → 1962 → 1905 → 1515 → âge de pierre) : dès 1962 les jeunes fuient, à l'âge de pierre fou rire général. Guerre des nostalgies entre les deux partis.
- 🌹 **La rose qui perd ses pétales** (Parti Survivant) : 5 pétales (2 déjà partis chez Réforme Encore et La France Indignée). « Rappeler un ancien » (1 € + 1 ★) : 65 % un pétale revient avec 3 électeurs, sinon un livre règle ses comptes (+2 casseroles). Rose complète = elle refleurit. Primaire perpétuelle au tour 4 (pas en éclair) : perdre une action ou voir un courant partir. Caisse de départ 6 € au lieu de 4.
- 🚦 **L'embouteillage au milieu** (Réforme Encore, Mollesse Démocrate, Hors-Sol) : Meeting −1 là où les trois ont 4 soutiens ou plus. Au tour 4, un micro-parti centriste grignote 6 % des voix de chacun ; « Fusionner » (1 € + 2 ★) l'absorbe (+1 soutien dans 3 régions)… et les deux autres en profitent gratuitement.
- 🔍 **Avis de recherche** (Les Rescapés) : à partir du tour 2, transparents quand le Rassemblement Nostalgique et Réforme Encore sont devant et qu'ils sont hors du trio de tête. Télé et Buzz ignorés une fois sur deux (une sur quatre en éclair), mais une attaque ne leur coûte qu'un soutien. « Le coup d'éclat » (3 € + 2 ★) : +1 dans 3 régions, caméras pour 3 tours.
- 📀 **Le disque rayé** (La France Indignée) : bingo de 9 mots coché par chaque message. Ligne complète : +1 soutien partout où elle a 3 soutiens ou plus, puis les indécis zappent (Meeting et Télé −1 là où elle a 3 soutiens ou moins) jusqu'à la fin du tour suivant. Réplique de débat « Comme je le disais déjà… » (compte comme l'émotion, coche 2 mots).
- Journal : articles satiriques (« Éric Zéronuance promet le retour du Minitel », « Avez-vous vu Bruno Raboteur ? », naissance des micro-partis, bingo, livre de François Hésitant, primaire).
- **Équilibrage par simulation** (800 parties par mode, mêmes parties avant/après) : en Simulation, chaque parti reste dans la marge de hasard de la v3.0 ; La France Indignée, la plus faible, se qualifie plus souvent au second tour (14 % → 22 %). En Réaliste, le Rassemblement Nostalgique passe de 36 % à environ 39 % de victoires : il affronte plus souvent La France Indignée au second tour.
- Lot 2 à venir : petits partis (Enracinés, Parti Camarade, Lutte Obstinée) et le langue-de-bois-mètre.

## v3.2 — fait : le poids des urnes (mode Réaliste)
Avant, en Réaliste, tous les partis convergeaient vers ~8 % : Lutte Obstinée démarrait à 6 % (vrai score ≈ 0,7 %) et le Rassemblement Nostalgique tombait de 31 % à 11 %.
- **Poids électoral** : chaque soutien pèse selon le score historique de son parti dans la région (entre ×0,1 et ×3). Le sondage de départ colle aux vrais scores.
- **Socle électoral** : la moitié des électeurs de chaque région vote par fidélité (sa part historique) ; la campagne se joue sur l'autre moitié.
- Le contrôle d'une région va au parti qui pèse le plus (avec toujours au moins 3 soutiens, 4 pour le RN et Hors-Sol).
- **Terres de gauche, de droite, disputées** : chaque région est classée d'après ses vrais votes (blocs gauche / centre / droite comparés à la moyenne nationale), affiché dans la fiche de la région avec « terrain favorable » ou « terrain difficile » pour ton parti. L'ordinateur en tient compte.
- Mode Simulation inchangé (vérifié : résultats identiques sur 600 parties).
- Simulation (150 parties, base 2024, départ → 1er tour) : RN 33,5 → 25,6 % · PS 13,5 → 14,1 · RE 10,9 → 15,4 · LFI 10,2 → 12,2 · LO 0,7 → 0,8 · PCF 2,2 → 2,4. En rejouant 2022 : RE gagne 55 % des parties, RN 45 %.
- À surveiller : en Réaliste (base 2024), l'ordinateur RN gagne environ 3 parties sur 4. Les petits partis n'ont quasiment aucune chance de victoire : idée à creuser, un objectif « réaliste » adapté (battre son score historique, peser au second tour).

## v3.3 — fait : bouton de sauvegarde
- 💾 « Sauvegarder la partie » dans l'onglet Mon parti, pendant la campagne. La sauvegarde reprend au début du tour en cours (reprendre en plein tour rejouerait le journal et les événements). La sauvegarde automatique à chaque tour est conservée ; « Reprendre » sur l'écran d'accueil.

## v3.4 — fait : 20 nouvelles lois de recettes, ministres remplaçables, journal de l'année
- **20 lois de recettes** dans FUNDING et NEW_LAWS.recettes (0,4 à 2 Md€ chacune) : très hauts salaires, bilans bancaires, grosses assurances-vie, données, publicité numérique, cryptomonnaies, TVA de luxe, résidences secondaires de luxe, bureaux vacants, concessions, grands voyageurs aériens, importations carbonées, emballages non recyclables, artificialisation, terrains constructibles non bâtis, aides publiques indues, brevets dormants, intérêts intragroupe, carried interest, écarts de rémunération. Chacune : explication, pour/contre, source officielle, ligne « En vrai ».
- **Camp politique** de chaque loi (gauche, écologie, souverain, anti-optimisation) : un bonus ou malus au vote de chaque groupe, en plus de la distance politique.
- **Ras-le-bol fiscal** : chaque nouvel impôt hors programme coûte de la popularité (−1,5, −3, −4,5…). Sans lui, la stratégie équilibrée était réélue 295 fois sur 300.
- Ministère porteur : Bercy, ou Transition écologique pour les taxes vertes.
- Fiche de loi : « Pour, contre et sources » dépliable.
- Test `test/check-laws.js` (catalogue, vote, amendement, 49.3, censure, déficit, retour d'une loi rejetée), ajouté à la vérification automatique ; `govern-sim.js` présente une loi de recettes par an (stratégies b et c).
- **Ministres** : après un limogeage ou une démission, tu choisis le remplaçant (l'expert proposé ou un autre profil), hors remaniement annuel. « L'affaire du ministre » vise désormais un vrai ministre.
- **Journal de l'année** : le 31 décembre, Le Quotidien National raconte chaque fait de l'année (cartes, actualité, ministres, lois, budget) avec son effet chiffré (popularité, déficit, majorité).

## v3.5 — fait : la version PC
- Même jeu, même code : sur un écran de 1024 px de large ou plus (css/desktop.css), la campagne passe en trois colonnes : sondage toujours visible à gauche, carte en grand et actions au centre, actualité ou ton parti à droite (deux onglets).
- Les fenêtres de choix deviennent des boîtes centrées ; le journal et les cartes à glisser s'affichent en page centrée sur fond sombre ; les autres écrans (accueil, programme, quinquennat, soirée électorale) sont centrés sur 760 px.
- Survol à la souris sur les boutons. Le téléphone n'est pas modifié.

## v3.6 — fait : un entre-deux-tours plus décisif et le barrage non systématique
- 4 actions par finaliste (3 avant) ; Mobiliser +2 % (1,2 avant) ; Appel au rassemblement +5 points de report (3 avant) ; consignes plus suivies (+30 / +24 / +15 / +8 / +3 points selon la distance) ; accord avec concession +8 points.
- **Barrage (« front républicain ») non systématique** : un indice de rejet par parti (ordre de grandeur de jeu inspiré des sondages de « vote impossible », pas un chiffre officiel). Les électeurs éliminés éloignés du finaliste le plus rejeté reportent 0,3 × l'écart de rejet en plus vers l'autre. RN et LFI ayant un rejet comparable, l'effet s'annule dans ce duel.
- Résultats (200 parties IA, Réaliste 2024) : RE–RN 49/51 en moyenne, PS–RN 50/50, LFI–RN 41/59.
- Carte de départ Réaliste : seuil de contrôle abaissé d'un soutien (v3.5.6), la carte « Présidentielle 2022 » retrouve les vraies couleurs régionales.

## v3.6.1 — fait : un entre-deux-tours où tes actions se voient
- Sans accord, la consigne d'un parti éliminé est « du bout des lèvres » (suivie à moitié) ; un accord la rend franche (+ bonus de concession). Avant, l'estimation comptait déjà la consigne et l'accord ne changeait presque rien.
- Après chaque action, un message sépare **l'effet de ton action** et **la réponse du rival** (avant, la réponse du rival faisait croire que « Mobiliser » faisait baisser).
- Face à un joueur humain, l'ordinateur n'a que 3 actions (4 pour toi). Simulation d'un joueur qui choisit au mieux (Réaliste 2024) : contre le RN, PS 51 % de victoires, RE 75 % ; LFI reste à 0 % (départ trop bas, ~41 %).

## v3.6.3 — fait : de quoi jouer 3 actions
- Revenu de base 6 € par tour (4 avant ; 8 en campagne éclair). En Réaliste, le RN tient presque toutes les régions : les autres partis ne touchaient que 4 € et ne pouvaient jouer qu'une ou deux actions.
- Le coût d'une action s'affiche en rouge quand l'argent, l'influence ou la forme manquent.

## v3.6.4 — fait : la gauche ne se reporte pas sur l'extrême droite
- Reports spontanés qui chutent plus vite avec la distance (55 / 42 / 25 / 12 / 6 %) : loin de son camp, on s'abstient ou on vote blanc.
- « Cordon » autour du RN et de Rétroconquête (comme aux législatives) : la gauche et le centre leur reportent ×0,35. PS → RN 9 %, Écologistes 4 %, PCF 2 % (2022 : 17 % des électeurs de Mélenchon vers Le Pen, moins de 10 % pour Jadot, Roussel, Hidalgo).
- Barrage par indice de rejet ramené à 0,15 (le cordon en fait déjà une partie).
- Simulation (Réaliste 2024) : PS–RN 53/47, RE–RN 52/48, LFI–RN 45/55.

## v3.6.5 — fait : moins d'acharnement, gaffe expliquée
- L'ordinateur n'enquête que sur un rival direct (juste devant lui au sondage, ou le premier s'il est 2e), 2 fois par partie au plus (avant : chacun des 11 partis enquêtait sur les 3 premiers à chaque tour, ~38 enquêtes par partie, 6 maintenant).
- Une seule affaire par parti et par tour.
- La tuile « risque de gaffe » devient « ⚡ épuisé : 4/10 de gaffe », avec l'explication au survol.

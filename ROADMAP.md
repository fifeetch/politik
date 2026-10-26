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

## Prochains lots (législatives, gouvernement, opposition)
- **v2.4 — Ta campagne des législatives** : 2 tours de campagne (circonscriptions sûres, disputées, perdues), Investir une vedette, Le président en meeting, Mobiliser ; **alliances à négocier soi-même** : faciles dans son camp (gauche ou droite), possibles entre camps (par exemple gauche modérée, écologistes et droite) ; puis ton entre-deux-tours (maintien ou désistement, consignes, échanges de circonscriptions).
- **v2.5 — Le gouvernement** : 6 postes, cartes ministres (compétence, loyauté, notoriété, un trait), parité, allié servi, remaniement.
- **v2.6 — L'opposition** : le perdant (finaliste ou éliminé au 1er tour) continue chef de son parti, à chaque trimestre pendant 5 ans : propositions de loi le jour réservé, coalitions, motions de censure ; chute du gouvernement, dissolution par le président (dès l'année 2), cohabitation où tu deviens Premier ministre.

## À venir (pistes du bêta-testeur)
- **Campagne éclair** : un format court en 3 tours, et une sauvegarde automatique pour reprendre une partie.
- **Mécaniques débloquées au fil des parties** : scandales et dilemmes, puis le programme détaillé, puis les alliances et la phase « gouverner ».
- **Dilemmes en cartes à glisser** (à la manière de Reigns).

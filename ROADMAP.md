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

## v0.8 — à cadrer : gouverner le pays
Une fois élu, une seconde phase : former un gouvernement, faire voter son programme à l'Assemblée, tenir le budget, gérer la rue et la popularité.

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

## Plus tard — rejouabilité
- Phase des **500 parrainages** avant la campagne.
- IA avec des personnalités (populiste, prudente, opportuniste).
- Mode carrière sur plusieurs élections.

## Plus tard
- Placement manuel des cubes gagnés en débat.
- Multijoueur entre amis (tour par tour en ligne).
- Version jeu de plateau (prototype papier).
- Application sur les stores.

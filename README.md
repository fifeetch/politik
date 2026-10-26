# Politik

Jeu de stratégie électorale parodique sur la carte de France, pensé pour le téléphone.
13 régions, 8 tours, un seul élu. Tu joues un parti contre 3 IA.

> Parodie politique. Les partis sont inventés, inspirés des grandes familles politiques. Toute ressemblance est volontaire, toute caricature est équitable.

## Jouer

- En ligne : la version publiée sur GitHub Pages (lien dans la description du dépôt).
- En local : ouvre `index.html` dans un navigateur. Aucune installation n'est nécessaire.
- **Installer l'application sur ton téléphone** : ouvre le jeu en ligne, puis touche « 📲 Installer l'application » sur l'écran titre.
  - Android (Chrome) : la fenêtre d'installation s'ouvre directement.
  - iPhone (Safari) : bouton Partager ⬆️ puis « Sur l'écran d'accueil ».
  Politik a alors sa propre icône, s'ouvre en plein écran et fonctionne sans internet.
- Première partie : touche **▶ Jouer**. Lulu te guide pendant le premier tour (relançable avec « Revoir le tutoriel » sur l'écran titre).

## Règles (v1.0, résumé)

- **But** : remporter l'élection présidentielle après **8 tours de campagne**. Chaque région vote selon ses cubes et pèse ses vrais électeurs : ses inscrits, moins les abstentionnistes et les votes blancs ou nuls. Avant chaque partie, on choisit le mode : **Réaliste** (départ aux vrais scores : présidentielle 2022, moyenne législatives + européennes 2024, ou moyenne de 6 sondages d'octobre 2026) ou **Simulation** (tout le monde part avec les mêmes chances). Le parti qui contrôle une région y gagne un bonus de voix.
- **Scrutin** : plus de 50 % au premier tour = élu. Sinon, second tour entre les deux premiers, avec reports de voix selon la proximité politique (alliés : 85 %).
- **Axe politique** : FI · VP · SM · EM · UG · MN. Faire campagne là où un parti voisin est présent lui prend des électeurs.
- **Alliances** : avec un parti à distance 2 au plus ; pas d'attaque entre alliés ; rompre coûte 2 ★ et ruine les reports.
- **Thèmes (v0.3)** : chaque campagne porte un message (💶 🏭 🏥 🌿 🚓 🛂). Son impact, de 0 à 4 = crédibilité du parti sur le thème (0 à 2) + 1 si la région s'en préoccupe + 1 si le thème fait l'actu. Plus l'impact est fort, plus l'action rapporte de cubes. L'action **Imposer** met ton thème à la une du tour suivant.
- **Le candidat (v0.4)** : sa forme ⚡ limite les Meetings et la Télé (risque de gaffe à 0). Les militants 👥 rapportent 1 cube par tour. La dynamique ↗ récompense une progression au sondage. Parler souvent d'un thème rend crédible dessus.
- **Dilemmes et casseroles (v0.5)** : un parti par tour fait face à un dilemme, avec parfois des conséquences différées. Les casseroles 🍳 font courir un risque de scandale. Une crise en 3 actes marque la carte.
- **Les grands moments (v0.6)** : débat télévisé en face-à-face (choix des répliques), flash info en fin de tour, soirée électorale à 20h.
- **Programme et affaires (v0.7)** : 5 mesures à choisir avant la campagne (crédibilité, mesure phare, budget). Des affaires tombent (casseroles, presse, enquêtes des rivaux, programme non financé) et l'on choisit sa réaction. Lulu, la directrice de campagne, donne un conseil par tour, et des fiches « Le saviez-vous ? » expliquent la vraie vie politique.
- **Programme financé et électorat (v0.8)** : dépenses, recettes et reste à financer ; 10 mesures de financement ; 6 groupes de population avec leur part réelle dans chaque région (Insee 2022) ; régions de cœur et régions hostiles.
- **Gouverner (v0.9)** : une fois élu, 5 années de mandat : législatives, vote de tes lois à l'Assemblée (négociation, 49.3, motion de censure, référendum), budget en 3 arbitrages, actualité, bilan. Jauges : déficit, dette, popularité, Assemblée.
- **Électeurs réels (v1.0)** : inscrits, abstention et votes blancs de chaque région (présidentielle 2022), deux modes de départ (Réaliste, Égalité), action 🚪 Mobiliser pour faire voter des abstentionnistes, calque « Abstention » sur la carte, participation à la soirée électorale. Gouverner : charge de la dette, recettes du programme au premier budget, dépenses ponctuelles, dissolution au choix dès l'année 2, sièges selon les inscrits.
- **Animations (v1.4)** : les régions conquises se colorent comme une encre qui se répand, le pion du candidat fait sa tournée sur la carte (trace en pointillés, cubes gagnés qui s'envolent, abstentionnistes qui prennent ta couleur avec Mobiliser), barres du sondage qui glissent avec flèches ▲▼, journal du matin qui tourne, édition spéciale qui fait trembler l'écran en cas d'affaire, bandeau « Alerte info » pour les crises et scandales, cartes d'action qui se retournent, Lulu qui réagit en bulle de BD, et soirée électorale en trois temps (dépouillement région par région, compte à rebours face aux deux finalistes, visage de l'élu à 20h). Tout est coupé si le téléphone demande « moins d'animations ».
- **Règles fiabilisées (v1.5)** : les 13 régions retrouvent leur type (urbaine, rurale, industrielle, historique), donc les cartes, bonus de partis et objectifs territoriaux fonctionnent de nouveau ; le mode Simulation part strictement à égalité (plus de bonus caché pour FI et MN) ; l'objectif « Présent partout », acquis d'office, devient « Sur tous les terrains » ; un objectif déjà rempli au départ est échangé ; sa progression et sa valeur (≈ 3 à 4 % des voix au scrutin, hors sondage) s'affichent ; le calcul du Meeting est détaillé (base + bonus) ; la crédibilité gagnée compte à partir de l'action suivante ; l'ordre de jeu du tour et les actions ratées apparaissent dans le flash info.
- **Entre-deux-tours et 12 partis (v1.6-1.7)** : 12 partis en lice (dont Lutte Prolétaire, Parti Camarade, Juste Milieu, Cap au Large, Toujours Debout, Grande Nostalgie), plus d'alliance pendant la campagne, 1er tour figé, puis une vraie phase entre les deux tours : négocier un soutien contre une concession, mobiliser, appel au rassemblement, consignes de vote, reports de voix expliqués. Les engagements pris sont gardés pour le mandat.
- **Écran de campagne en onglets (v1.8)** : la carte prend la place centrale, avec le sigle du parti qui tient chaque région ; la fiche de la région tient sur deux lignes (« Détails » ouvre le reste) ; Lulu tient sur une ligne ; le sondage des 12 partis, l'actualité et ton parti ont chacun leur onglet en bas de l'écran.
- **Démarrage rapide (v2.0)** : sur l'écran titre, **▶ Jouer** lance une partie en deux touchers (choix du parti, programme conseillé pris d'office) ; « Partie personnalisée » garde le paramétrage complet. Le premier tour commence directement sur la carte. Le tutoriel est remplacé par 4 gestes guidés par Lulu (une région qui clignote, un Meeting, d'autres actions, Valider), puis une récompense : ta place au sondage. Le dilemme du joueur arrive au tour 2 au lieu du tour 1.
- **Moins d'infos d'un coup (v2.1)** : le journal du matin arrive comme une vraie une (gros titre, dessin, 3 brèves) et « Ouvrir le journal » donne les pages intérieures par rubriques (France, Ta campagne, Chez les rivaux, Le saviez-vous). Le flash info passe en direct télé (carte des régions qui basculent, un gros titre, bandeau des sondages qui défile, « Tout le détail » au toucher). Les résultats montrent le second tour et le podium ; le premier tour complet, les reports de voix et les objectifs secrets s'ouvrent d'un toucher. Toucher une région affiche ses préoccupations.
- **Un tour** : journal du matin (revenus, militants, scandales, crise ou événement, dilemme) → 3 actions secrètes jouées par tous en même temps → débat (tours 3, 6, 8) → « Sous les projecteurs » pour le premier des sondages.

## Organisation du code

| Fichier | Rôle |
| --- | --- |
| `index.html` | Les écrans du jeu |
| `css/style.css` | Le style « bureau de vote » : papier de bulletin, encre violette de tampon |
| `fonts/` | Les polices Anybody et Atkinson Hyperlegible (licence SIL OFL), livrées avec le jeu pour qu'il marche hors ligne |
| `js/data.js` | **Tous les chiffres du jeu** : régions, partis, actions, cartes, événements, objectifs |
| `js/map.js` | Les contours des 13 régions |
| `js/engine.js` | Les règles (sans affichage) |
| `js/ai.js` | L'intelligence artificielle des adversaires |
| `js/ui.js` | L'affichage et le déroulement d'une partie |
| `js/art.js` | Les illustrations (candidats, conseillère, vignettes), dessinées en SVG |
| `js/fx.js` | Les animations (encre, pion du candidat, bandeau alerte info, bulle de Lulu…), qui attendent que l'écran soit visible pour se jouer |
| `js/govern.js` | Les règles du quinquennat (législatives, votes, budget, jauges) |
| `js/govui.js` | L'écran « Gouverner » (hémicycle, lois, budget, bilan) |
| `js/tuto.js` | Le tutoriel guidé du premier tour |
| `manifest.webmanifest`, `sw.js`, `icons/` | L'application installable (icône, plein écran, jeu hors ligne). À chaque nouvelle version, changer `VERSION` dans `sw.js` |
| `test/simulate.js` | Simule des centaines de parties pour vérifier l'équilibre |
| `test/govern-sim.js` | Simule des quinquennats pour vérifier les ordres de grandeur |
| `test/check-rules.js` | Vérifie que les règles annoncées fonctionnent (profils, cartes, bonus, objectifs, départ égal, prévision du Meeting, ordre de jeu) |
| `test/check-sources.js` | Vérifie les sources : chaque mesure et chaque fiche renvoie vers un site de l'État, et les liens marchent |
| `.github/workflows/sources.yml` | Le robot GitHub qui lance cette vérification à chaque modification et chaque lundi |

Pour équilibrer le jeu, on modifie `js/data.js`, puis on lance :

```
node test/simulate.js 1000
```

Le script affiche le taux de victoire de chaque parti (l'idéal est autour de 25 %).

## Les sources

Les faits et chiffres du jeu s'appuient sur des **sources d'État** (Service-Public.fr, Vie-publique.fr, Légifrance, Insee, Cour des comptes, Conseil constitutionnel, ministères…).
Les lignes « En vrai, pour 2027 » (qui défend une mesure proche) viennent du comparateur pédagogique [Comprendre la Politique](https://www.comprendrelapolitique.fr/programme-2027.html), utilisé comme **référence non officielle** : la date du relevé est affichée dans le jeu.

```
node test/check-sources.js            # contrôle rapide
node test/check-sources.js --online   # ouvre aussi chaque lien officiel
```

Sur GitHub, le robot « Sources officielles » (onglet Actions) fait ce contrôle tout seul et prévient par e-mail si une source casse, n'est plus officielle, ou si le relevé 2027 a plus de 60 jours.

## Équilibre actuel (v0.7, IA contre IA, 2000 parties)

| Parti | Victoires (idéal 25 %) |
| --- | --- |
| Les Verts Pâturages | 31 % |
| Socialisme Modéré | 29 % |
| Mouvement National | 25 % |
| La France Indignée | 24 % |
| L'Union Gaulliste | 21 % |
| En Mouvement | 18 % |

En moyenne par partie : 5 affaires, 1 à 2 enquêtes, environ 5 équipes de militants.

Les idées pour la suite sont dans [ROADMAP.md](ROADMAP.md).

## Crédits

Contours des régions : [france-geojson](https://github.com/gregoiredavid/france-geojson) (Licence Ouverte / Etalab).

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
- Première partie : un tutoriel guidé se lance automatiquement (relançable avec « Comment jouer » sur l'écran titre).

## Règles (v1.0, résumé)

- **But** : remporter l'élection présidentielle après **8 tours de campagne**. Chaque région vote selon ses cubes et pèse ses vrais électeurs : ses inscrits, moins les abstentionnistes et les votes blancs ou nuls. Le départ suit les législatives de 2024. Le parti qui contrôle une région y gagne un bonus de voix.
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
- **Électeurs réels (v1.0)** : inscrits, abstention et votes blancs de chaque région (présidentielle 2022), départ aux législatives 2024, action 🚪 Mobiliser pour faire voter des abstentionnistes, calque « Abstention » sur la carte, participation à la soirée électorale. Gouverner : charge de la dette, recettes du programme au premier budget, dépenses ponctuelles, dissolution au choix dès l'année 2, sièges selon les inscrits.
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
| `js/govern.js` | Les règles du quinquennat (législatives, votes, budget, jauges) |
| `js/govui.js` | L'écran « Gouverner » (hémicycle, lois, budget, bilan) |
| `js/tuto.js` | Le tutoriel guidé du premier tour |
| `manifest.webmanifest`, `sw.js`, `icons/` | L'application installable (icône, plein écran, jeu hors ligne). À chaque nouvelle version, changer `VERSION` dans `sw.js` |
| `test/simulate.js` | Simule des centaines de parties pour vérifier l'équilibre |
| `test/govern-sim.js` | Simule des quinquennats pour vérifier les ordres de grandeur |

Pour équilibrer le jeu, on modifie `js/data.js`, puis on lance :

```
node test/simulate.js 1000
```

Le script affiche le taux de victoire de chaque parti (l'idéal est autour de 25 %).

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

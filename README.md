# Politik

Jeu de stratégie électorale parodique sur la carte de France, pensé pour le téléphone.
13 régions, 8 tours, un seul élu. Tu joues un parti contre 3 IA.

> Parodie politique. Les partis sont inventés, inspirés des grandes familles politiques. Toute ressemblance est volontaire, toute caricature est équitable.

## Jouer

- En ligne : la version publiée sur GitHub Pages (lien dans la description du dépôt).
- En local : ouvre `index.html` dans un navigateur. Aucune installation n'est nécessaire.
- Première partie : un tutoriel guidé se lance automatiquement (relançable avec « Comment jouer » sur l'écran titre).

## Règles (v0.2, résumé)

- **But** : remporter l'élection présidentielle après **8 tours de campagne**. Chaque région vote selon ses cubes, pondérée par sa population ; le parti qui contrôle une région y gagne un bonus de voix.
- **Scrutin** : plus de 50 % au premier tour = élu. Sinon, second tour entre les deux premiers, avec reports de voix selon la proximité politique (alliés : 85 %).
- **Axe politique** : FI · VP · SM · EM · UG · MN. Faire campagne là où un parti voisin est présent lui prend des électeurs.
- **Alliances** : avec un parti à distance 2 au plus ; pas d'attaque entre alliés ; rompre coûte 2 ★ et ruine les reports.
- **Un tour** : revenus → événement → 3 actions secrètes jouées par tous en même temps → débat (tours 3, 6, 8) → « Sous les projecteurs » pour le premier des sondages.

## Organisation du code

| Fichier | Rôle |
| --- | --- |
| `index.html` | Les écrans du jeu |
| `css/style.css` | Le style « affiche électorale » |
| `js/data.js` | **Tous les chiffres du jeu** : régions, partis, actions, cartes, événements, objectifs |
| `js/map.js` | Les contours des 13 régions |
| `js/engine.js` | Les règles (sans affichage) |
| `js/ai.js` | L'intelligence artificielle des adversaires |
| `js/ui.js` | L'affichage et le déroulement d'une partie |
| `js/tuto.js` | Le tutoriel guidé du premier tour |
| `test/simulate.js` | Simule des centaines de parties pour vérifier l'équilibre |

Pour équilibrer le jeu, on modifie `js/data.js`, puis on lance :

```
node test/simulate.js 1000
```

Le script affiche le taux de victoire de chaque parti (l'idéal est autour de 25 %).

## Équilibre actuel (v0.2, IA contre IA, 1500 parties)

| Parti | Victoires (idéal 25 %) |
| --- | --- |
| Les Verts Pâturages | 39 % |
| Socialisme Modéré | 37 % |
| L'Union Gaulliste | 26 % |
| En Mouvement | 18 % |
| Mouvement National | 16 % |
| La France Indignée | 11 % |

Avec le second tour, les partis du centre récupèrent plus de reports. Les partis aux deux bouts de l'axe ont un électorat plus mobilisé (×1,35) pour compenser, et doivent miser sur les alliances. À affiner avec de vraies parties.

Les idées pour la suite sont dans [ROADMAP.md](ROADMAP.md).

## Crédits

Contours des régions : [france-geojson](https://github.com/gregoiredavid/france-geojson) (Licence Ouverte / Etalab).

# Politik

Jeu de stratégie électorale parodique sur la carte de France, pensé pour le téléphone.
13 régions, 8 tours, un seul élu. Tu joues un parti contre 3 IA.

> Parodie politique. Les partis sont inventés, inspirés des grandes familles politiques. Toute ressemblance est volontaire, toute caricature est équitable.

## Jouer

- En ligne : la version publiée sur GitHub Pages (lien dans la description du dépôt).
- En local : ouvre `index.html` dans un navigateur. Aucune installation n'est nécessaire.

## Règles (v0.1, résumé)

- **But** : contrôler des régions. Les 13 régions valent 65 points ; 33 points = élu au premier tour (à partir du tour 4). Sinon, après 8 tours, le meilleur score gagne (régions + objectif secret).
- **Contrôle** : le parti qui a le plus de cubes dans une région, avec au moins 3 cubes (4 pour le Mouvement National).
- **Un tour** : revenus → événement → 3 actions choisies en secret par tout le monde → débat (tours 3, 6, 8) → « Sous les projecteurs » pour le parti en tête.
- **Actions** : Terrain, Médias, Réseaux (dé), Contre-campagne, Fonds, Réforme, plus 2 cartes spéciales par parti.

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
| `test/simulate.js` | Simule des centaines de parties pour vérifier l'équilibre |

Pour équilibrer le jeu, on modifie `js/data.js`, puis on lance :

```
node test/simulate.js 1000
```

Le script affiche le taux de victoire de chaque parti (l'idéal est autour de 25 %).

## Équilibre actuel (v0.1, IA contre IA, 2000 parties)

| Parti | Victoires |
| --- | --- |
| Socialisme Modéré | 35 % |
| Les Verts Pâturages | 27 % |
| L'Union Gaulliste | 25 % |
| La France Indignée | 23 % |
| Mouvement National | 20 % |
| En Mouvement | 17 % |

## Crédits

Contours des régions : [france-geojson](https://github.com/gregoiredavid/france-geojson) (Licence Ouverte / Etalab).

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

- **But** : remporter l'élection présidentielle après **8 tours de campagne**. Chaque région vote selon ses soutiens et pèse ses vrais électeurs : ses inscrits, moins les abstentionnistes et les votes blancs ou nuls. Avant chaque partie, on choisit le mode : **Réaliste** (départ aux vrais scores : présidentielle 2022, moyenne législatives + européennes 2024, ou moyenne de 6 sondages d'octobre 2026) ou **Simulation** (tout le monde part avec les mêmes chances). Le parti qui contrôle une région y gagne un bonus de voix.
- **Scrutin** : plus de 50 % au premier tour = élu. Sinon, second tour entre les deux premiers, avec reports de voix selon la proximité politique (alliés : 85 %).
- **Axe politique** : FI · VP · SM · EM · UG · MN. Faire campagne là où un parti voisin est présent lui prend des électeurs.
- **Alliances** : avec un parti à distance 2 au plus ; pas d'attaque entre alliés ; rompre coûte 2 ★ et ruine les reports.
- **Thèmes (v0.3)** : chaque campagne porte un message (💶 🏭 🏥 🌿 🚓 🛂). Son impact, de 0 à 4 = crédibilité du parti sur le thème (0 à 2) + 1 si la région s'en préoccupe + 1 si le thème fait l'actu. Plus l'impact est fort, plus l'action rapporte de soutiens. L'action **Imposer** met ton thème à la une du tour suivant.
- **Le candidat (v0.4)** : sa forme ⚡ limite les Meetings et la Télé (risque de gaffe à 0). Les militants 👥 rapportent 1 soutien par tour. La dynamique ↗ récompense une progression au sondage. Parler souvent d'un thème rend crédible dessus.
- **Dilemmes et casseroles (v0.5)** : un parti par tour fait face à un dilemme, avec parfois des conséquences différées. Les casseroles 🍳 font courir un risque de scandale. Une crise en 3 actes marque la carte.
- **Les grands moments (v0.6)** : débat télévisé en face-à-face (choix des répliques), flash info en fin de tour, soirée électorale à 20h.
- **Programme et affaires (v0.7)** : 5 mesures à choisir avant la campagne (crédibilité, mesure phare, budget). Des affaires tombent (casseroles, presse, enquêtes des rivaux, programme non financé) et l'on choisit sa réaction. Lulu, la directrice de campagne, donne un conseil par tour, et des fiches « Le saviez-vous ? » expliquent la vraie vie politique.
- **Programme financé et électorat (v0.8)** : dépenses, recettes et reste à financer ; 10 mesures de financement ; 6 groupes de population avec leur part réelle dans chaque région (Insee 2022) ; régions de cœur et régions hostiles.
- **Gouverner (v0.9)** : une fois élu, 5 années de mandat : législatives, vote de tes lois à l'Assemblée (négociation, 49.3, motion de censure, référendum), budget en 3 arbitrages, actualité, bilan. Jauges : déficit, dette, popularité, Assemblée.
- **Électeurs réels (v1.0)** : inscrits, abstention et votes blancs de chaque région (présidentielle 2022), deux modes de départ (Réaliste, Égalité), action 🚪 Mobiliser pour faire voter des abstentionnistes, calque « Abstention » sur la carte, participation à la soirée électorale. Gouverner : charge de la dette, recettes du programme au premier budget, dépenses ponctuelles, dissolution au choix dès l'année 2, sièges selon les inscrits.
- **Animations (v1.4)** : les régions conquises se colorent comme une encre qui se répand, le pion du candidat fait sa tournée sur la carte (trace en pointillés, soutiens gagnés qui s'envolent, abstentionnistes qui prennent ta couleur avec Mobiliser), barres du sondage qui glissent avec flèches ▲▼, journal du matin qui tourne, édition spéciale qui fait trembler l'écran en cas d'affaire, bandeau « Alerte info » pour les crises et scandales, cartes d'action qui se retournent, Lulu qui réagit en bulle de BD, et soirée électorale en trois temps (dépouillement région par région, compte à rebours face aux deux finalistes, visage de l'élu à 20h). Tout est coupé si le téléphone demande « moins d'animations ».
- **Règles fiabilisées (v1.5)** : les 13 régions retrouvent leur type (urbaine, rurale, industrielle, historique), donc les cartes, bonus de partis et objectifs territoriaux fonctionnent de nouveau ; le mode Simulation part strictement à égalité (plus de bonus caché pour FI et MN) ; l'objectif « Présent partout », acquis d'office, devient « Sur tous les terrains » ; un objectif déjà rempli au départ est échangé ; sa progression et sa valeur (≈ 3 à 4 % des voix au scrutin, hors sondage) s'affichent ; le calcul du Meeting est détaillé (base + bonus) ; la crédibilité gagnée compte à partir de l'action suivante ; l'ordre de jeu du tour et les actions ratées apparaissent dans le flash info.
- **Entre-deux-tours et 12 partis (v1.6-1.7)** : 12 partis en lice (dont Lutte Prolétaire, Parti Camarade, Juste Milieu, Cap au Large, Toujours Debout, Grande Nostalgie), plus d'alliance pendant la campagne, 1er tour figé, puis une vraie phase entre les deux tours : négocier un soutien contre une concession, mobiliser, appel au rassemblement, consignes de vote, reports de voix expliqués. Les engagements pris sont gardés pour le mandat.
- **Écran de campagne en onglets (v1.8)** : la carte prend la place centrale, avec le sigle du parti qui tient chaque région ; la fiche de la région tient sur deux lignes (« Détails » ouvre le reste) ; Lulu tient sur une ligne ; le sondage des 12 partis, l'actualité et ton parti ont chacun leur onglet en bas de l'écran.
- **Démarrage rapide (v2.0)** : sur l'écran titre, **▶ Jouer** lance une partie en deux touchers (choix du parti, programme conseillé pris d'office) ; « Partie personnalisée » garde le paramétrage complet. Le premier tour commence directement sur la carte. Le tutoriel est remplacé par 4 gestes guidés par Lulu (une région qui clignote, un Meeting, d'autres actions, Valider), puis une récompense : ta place au sondage. Le dilemme du joueur arrive au tour 2 au lieu du tour 1.
- **Moins d'infos d'un coup (v2.1)** : le journal du matin arrive comme une vraie une (gros titre, dessin, 3 brèves) et « Ouvrir le journal » donne les pages intérieures par rubriques (France, Ta campagne, Chez les rivaux, Le saviez-vous). Le flash info passe en direct télé (carte des régions qui basculent, un gros titre, bandeau des sondages qui défile, « Tout le détail » au toucher). Les résultats montrent le second tour et le podium ; le premier tour complet, les reports de voix et les objectifs secrets s'ouvrent d'un toucher. Toucher une région affiche ses préoccupations.
- **Le journal du matin (v2.2)** : la une prend tout l'écran, avec une scène dessinée (12 scènes : usine, caddie, hôpital, canicule, incendies, inondations, police, frontière, scandale, télé, fête, meeting, grève, ville) et un mot géant choisi selon l'événement ou l'acte de crise. En dessous, trois titres renvoient chacun à leur article. Les pages intérieures sont de vrais articles écrits à partir du tour précédent : meetings dans les villes de chaque région, passages au 20 h, porte-à-porte, vidéos virales, attaques, permanences, régions qui basculent, affaires, coulisses et sondage, puis le mot de Lulu sur ta campagne. La règle de l'événement est rappelée dans un encadré « Pour la campagne ». Police Archivo (licence SIL OFL) livrée avec le jeu.
- **Les vraies législatives (v2.3)** : après ta victoire (et après une dissolution), les 577 députés sont élus circonscription par circonscription, avec les vraies règles : élu dès le 1er tour avec plus de 50 % des voix et 25 % des inscrits, 2nd tour pour ceux qui ont 12,5 % des inscrits, triangulaires et désistements. Chaque région a ses vrais sièges (97 pour l'Île-de-France, 42 pour Corse, outre-mer et Français de l'étranger). Point de départ : les scores régionaux de la présidentielle, avec l'effet locomotive du président, une abstention plus forte chez ceux qui votent peu, et des candidatures communes par grandes familles (gauche unie, majorité présidentielle). Soirée électorale en deux temps : le 1er tour (scores, élus, duels, triangulaires), puis l'hémicycle qui se remplit région par région. Quatre issues : majorité absolue, relative, sans majorité, cohabitation. Le détail région par région s'ouvre d'un toucher.
- **Ta campagne des législatives (v2.4)** : après ta victoire, tu formes ton camp (3 propositions d'alliance : faciles avec les partis proches, possibles avec l'autre camp, presque impossibles aux deux bouts de l'axe), puis tu fais 2 tours de campagne sur la carte des circonscriptions sûres 🟢, disputées ⚖️ et perdues 🔴, avec 3 actions par tour : 📣 Le président en meeting (efficace, mais use sa popularité), 🌟 Investir une vedette (2 en tout), 🚪 Mobiliser, 📺 Clip national. Chaque bouton annonce combien de sièges il peut rapporter. Les autres blocs font campagne aussi. Après le 1er tour, ton entre-deux-tours : te maintenir ou te retirer dans tes triangulaires, un pacte « je me retire ici, tu te retires là » avec un autre bloc, et ta consigne de vote là où ton camp est éliminé. La projection du 2nd tour se met à jour à chaque choix.
- **Ton personnage et ton parti (v2.5)** : sur l'écran du choix du parti, crée ton personnage (ton nom ou un nom en jeu de mots, un visage à composer : peau, cheveux, lunettes, expression, tenue, barbe, et ton style en débat : Tribun, Technocrate, Bagarreur ou Rassembleur). Puis, au choix : **prends la tête d'un des 12 partis** (« Candidat : toi » : il garde ses électeurs et ses idées, mais le candidat, c'est toi), ou **fonde ton parti** (nom, sigle, couleur, place sur l'axe gauche-droite, 2 thèmes forts). Ton parti s'ajoute aux 12 autres : il part d'environ 3 %, avec des sympathisants seulement là où tes thèmes parlent aux habitants, mais profite d'un effet nouveauté (+2 soutiens en Meeting au tour 1, +1 aux tours 2 à 4). Ton personnage et ton parti sont gardés d'une partie à l'autre.
- **Corrections (v2.5.1)** : les « cubes » du jeu de plateau s'appellent désormais des **soutiens** (des électeurs gagnés à ta cause) dans tous les textes ; l'affaire qui sort dans la presse prend le style de la une (scène plein cadre, mot géant : « Révélations. », « Ardoise. », « Casserole. », « Coup bas. », logo du Quotidien National ou du Canard Déchaîné), la fiche « Les affaires et la justice » s'ouvre d'un toucher.
- **Le gouvernement (v2.6)** : après les législatives, tu formes ton gouvernement : 6 postes (Premier ministre, Économie, Intérieur, Santé, Éducation, Transition écologique) à pourvoir parmi 8 profils au moins (3 députés de ton parti, un ou plusieurs de tes alliés, 2 experts de la société civile, 1 personnalité d'ouverture venue d'un parti rival). Chaque ministre a 3 jauges (compétence, loyauté, notoriété, de 1 à 3 étoiles) et un trait (Gaffeur, Bourreau de travail, Réseau à l'Assemblée, Casserole cachée, Ambitieux). La parité rapporte de la popularité ; un allié sans ministère quitte ta majorité ; « La proposition de Lulu » remplit l'équipe d'un toucher. Pendant le mandat : un ministre compétent fait mieux passer les lois de son domaine et calme les frondeurs, un ministre « Réseau » ramène des voix, un bon ministre de l'Économie fait baisser le déficit ; l'été, les ministres font l'actualité (gaffes, affaires, frondes, démissions fracassantes, succès) ; un remaniement par an, et le fusible du Premier ministre. En cohabitation, Matignon revient à la majorité de l'Assemblée.
- **L'opposition et la cohabitation (v2.7)** : si tu perds la présidentielle (au 2nd tour ou dès le 1er), « Continuer dans l'opposition » : tu fais campagne aux législatives comme chef de ton parti (ton camp, tes alliés, ton grand meeting, ton entre-deux-tours ; la famille du président lui reste plutôt fidèle). Si ton camp obtient 289 sièges, c'est la **cohabitation** : tu deviens Premier ministre, tu formes ton gouvernement et tu gouvernes (lois, budget), tandis que le président garde la défense, les affaires étrangères et le droit de dissoudre. Sinon, 5 ans d'**opposition**, à chaque trimestre : la loi du gouvernement (soutenir, s'abstenir, combattre), l'actualité (unité, dénonciation, contre-proposition), ta proposition de loi le jour réservé à l'opposition, puis la motion de censure (58 signatures, 289 voix, une coalition par an). Si le gouvernement tombe, le président nomme un nouveau Premier ministre ou dissout : nouvelles législatives, nouvelle chance. Bilan : ta place dans les intentions de vote pour la prochaine présidentielle.
- **Campagne éclair et sauvegarde (v2.8)** : sur l'écran titre, « ⚡ Campagne éclair » lance une présidentielle en 3 tours (un débat au dernier tour, la crise dès le tour 1, un peu plus d'argent à chaque tour, des Meetings et des passages Télé qui rapportent plus, des cagnottes de départ plus proches : le parti en tête au départ ne gagne pas plus souvent qu'en 8 tours). La durée se choisit aussi dans « Partie personnalisée ». La partie est **sauvegardée automatiquement** au début de chaque tour de campagne : si tu fermes l'application, « ↻ Reprendre ta partie » apparaît sur l'écran titre et te ramène au journal du tour en cours (avec ton personnage et ton parti).
- **Les nouvelles lois (v2.9)** : chaque printemps du quinquennat, en plus de tes promesses, tu peux présenter **une nouvelle loi** : 💶 faire rentrer de l'argent (taxe sur les superprofits, TVA, héritages, impôt sur la fortune, niches fiscales, fraude fiscale…), ✂️ réduire les dépenses (train de vie de l'État, fraude sociale, gel du point d'indice ou des pensions, assurance chômage, non-remplacement des fonctionnaires, retraite à 65 ans) ou 📜 une autre mesure du catalogue. Chaque texte affiche ce qu'il rapporte ou coûte, son effet sur le déficit, qui y gagne 👍 et qui y perd 👎, et le pronostic du vote. Une loi nouvelle ne compte pas dans tes promesses tenues ; rejetée, on peut la représenter l'année suivante.
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
| `js/press.js` | Le journal du matin : villes, mots de la une, scènes dessinées et rédaction des articles |
| `js/art.js` | Les illustrations (candidats, conseillère, vignettes), dessinées en SVG |
| `js/fx.js` | Les animations (encre, pion du candidat, bandeau alerte info, bulle de Lulu…), qui attendent que l'écran soit visible pour se jouer |
| `js/perso.js` | Ton personnage (visage, trait de débat) et ton parti (le 13e parti, fondé par le joueur) |
| `js/legis.js` | Les élections législatives : 577 circonscriptions, deux tours, désistements, issues |
| `js/cabinet.js` | Le gouvernement : profils de ministres, nomination, parité, alliés, remaniement, événements de ministres |
| `js/oppo.js` | L'opposition : les 4 trimestres, ta proposition de loi, la coalition, la motion de censure, le bilan |
| `js/govern.js` | Les règles du quinquennat (législatives, votes, budget, jauges) |
| `js/govui.js` | L'écran « Gouverner » (hémicycle, lois, budget, bilan) |
| `js/tuto.js` | Le tutoriel guidé du premier tour |
| `manifest.webmanifest`, `sw.js`, `icons/` | L'application installable (icône, plein écran, jeu hors ligne). À chaque nouvelle version, changer `VERSION` dans `sw.js` |
| `test/simulate.js` | Simule des centaines de parties pour vérifier l'équilibre |
| `test/perso-sim.js` | Simule des parties avec un parti fondé : score de départ, effet nouveauté, chances de victoire selon sa place sur l'axe |
| `test/legis-sim.js` | Simule des présidentielles puis les législatives : majorité du président, participation, duels, dissolution |
| `test/oppo-sim.js` | Simule le chemin du perdant : législatives d'opposition, cohabitation, 5 ans d'opposition |
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

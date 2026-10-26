/* Politik — v3.0 : les événements à glisser du quinquennat (à la manière de Reigns).
   À chaque saison, une carte : un personnage te demande quelque chose. Glisse à gauche ou à droite.
   Certains choix laissent une trace (un « drapeau ») et reviennent plus tard sous forme de suite.
   Effets (même forme que les événements du quinquennat) : def (points de déficit), debt (points de dette),
   pop (popularité), sat (satisfaction des groupes), fronde (frondeurs en plus cette année), flag (une trace),
   later (une suite : { id, in: nombre de saisons, chance }), allyLeave (un allié quitte la majorité),
   fusible (changer de Premier ministre). Personnages et organisations inventés ; aucun nom réel. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var E = node ? require('./engine.js') : root.PolitikEngine;
  var G = node ? require('./govern.js') : root.PolitikGov;

  /* who : le personnage · kind : sa famille (couleur de fond) · face : une graine pour son visage */
  var CARDS = [
    { id: 'cheminots', who: 'Le syndicat des cheminots', kind: 'syndicat', text: 'Grève reconductible : plus un train ne roule. « Retirez votre réforme ou on bloque le pays. »',
      left: { label: 'Négocier', def: 0.05, pop: 1, sat: { pi: 3 } }, right: { label: 'Tenir bon', pop: -2, sat: { pop: -3, ind: 2 }, later: { id: 'raffineries', in: 1, chance: 0.7 } } },
    { id: 'patronat', who: 'Le patron des patrons', kind: 'patronat', text: '« Baissez nos impôts de production, sinon nos usines partiront à l\'étranger. »',
      left: { label: 'Refuser', sat: { ind: -3, cad: -1 } }, right: { label: 'Accepter', def: 0.1, pop: -1, sat: { ind: 4, cad: 2 } } },
    { id: 'boulangerie', who: 'La maire d\'un village', kind: 'elus', text: '« Notre dernière boulangerie ferme, la poste aussi. Les campagnes se sentent abandonnées. »',
      left: { label: 'Un plan ruralité', def: 0.05, sat: { ind: 3, ret: 2 } }, right: { label: 'Pas d\'argent', sat: { ind: -3, ret: -2 } } },
    { id: 'bruxelles', who: 'La Commission européenne', kind: 'europe', text: '« Votre déficit nous inquiète. Nous attendons un plan crédible. »', cond: function (gv) { return gv.deficit > G.C.target(gv.year); },
      left: { label: 'Promettre des économies', pop: -1, later: { id: 'bruxelles_bilan', in: 3, chance: 1 } }, right: { label: 'Ignorer Bruxelles', debt: 1, pop: 1 } },
    { id: 'influenceur', who: 'Un influenceur à 5 millions d\'abonnés', kind: 'medias', text: '« Une interview en faisant du karting ? Les jeunes vont adorer. »',
      left: { label: 'Refuser', sat: { sae: -1 } }, right: { label: 'Monter dans le kart', pop: 2, sat: { sae: 4 }, later: { id: 'karting', in: 1, chance: 0.5 } } },
    { id: 'infirmieres', who: 'Le collectif des infirmières', kind: 'syndicat', text: '« Une prime de nuit, ou des démissions en masse dans les hôpitaux. »',
      left: { label: 'Accorder la prime', def: 0.06, sat: { pi: 5 } }, right: { label: 'Réorganiser sans argent', sat: { pi: -5, ret: -2 } } },
    { id: 'pesticide', who: 'Le lobby agrochimique', kind: 'patronat', text: '« Repoussez l\'interdiction de notre pesticide, sinon les rendements s\'effondrent. »',
      left: { label: 'Interdire quand même', pop: 1, sat: { ind: -4, cad: 2 } }, right: { label: 'Repousser', pop: -1, sat: { ind: 4 }, later: { id: 'abeilles', in: 2, chance: 0.8 } } },
    { id: 'interieur', who: 'Ton ministre de l\'Intérieur', kind: 'gouvernement', text: '« Je veux une loi immigration bien plus dure. Sinon, je démissionne. »',
      left: { label: 'Le recadrer', fronde: 0.03 }, right: { label: 'Le laisser faire', fronde: 0.05, sat: { ret: 3, sae: -3, cad: -1 } } },
    { id: 'loyers', who: 'Le syndicat étudiant', kind: 'syndicat', text: '« Les loyers explosent : gelez les loyers des étudiants ! »',
      left: { label: 'Non', sat: { sae: -4 } }, right: { label: 'Geler les loyers', def: 0.03, sat: { sae: 5, cad: -1 } } },
    { id: 'manif', who: 'Le préfet de police', kind: 'etat', text: '« La manifestation d\'hier a dégénéré. J\'interdis les prochaines ? »',
      left: { label: 'Interdire', pop: -1, sat: { ret: 3, sae: -4 } }, right: { label: 'Laisser manifester', sat: { sae: 2, ret: -2 } } },
    { id: 'rugby', who: 'Le comité des grands événements', kind: 'sport', text: '« La France peut accueillir la Coupe du monde de rugby. On candidate ? »',
      left: { label: 'Trop cher', pop: -1 }, right: { label: 'On candidate !', def: 0.04, pop: 3, later: { id: 'rugby_travaux', in: 3, chance: 0.8 } } },
    { id: 'cyber', who: 'L\'agence de cybersécurité', kind: 'etat', text: '« Un hôpital est paralysé par des pirates. Ils demandent une rançon. »',
      left: { label: 'Ne jamais payer', pop: 1, sat: { pi: -2 } }, right: { label: 'Payer en secret', later: { id: 'rancon', in: 2, chance: 0.6 } } },
    { id: 'prix', who: 'Les grandes surfaces', kind: 'patronat', text: '« Le prix des pâtes a pris 20 %. Ne bloquez surtout pas les prix ! »',
      left: { label: 'Bloquer les prix', def: 0.02, sat: { pop: 4, ind: -3 } }, right: { label: 'Laisser faire le marché', sat: { pop: -3, ret: -1 } } },
    { id: 'autoroute', who: 'Des militants écologistes', kind: 'citoyens', text: 'Ils occupent le chantier d\'une autoroute contestée, perchés dans les arbres.',
      left: { label: 'Faire évacuer', pop: -1, sat: { ind: 2, sae: -3 } }, right: { label: 'Suspendre le chantier', sat: { sae: 3, ind: -3 } } },
    { id: 'audiovisuel', who: 'La présidente de l\'audiovisuel public', kind: 'medias', text: '« Sans la redevance, nos caisses sont vides. Il nous faut une rallonge. »',
      left: { label: 'La rallonge', def: 0.03, sat: { cad: 2, pi: 1 } }, right: { label: 'Des économies', def: -0.02, sat: { cad: -2, pi: -1 } } },
    { id: 'munitions', who: 'Le chef d\'état-major', kind: 'etat', text: '« En cas de conflit, nos stocks de munitions ne tiendraient pas deux semaines. »',
      left: { label: 'Plus tard', pop: -1 }, right: { label: 'Commande d\'urgence', def: 0.08, sat: { ret: 3 } } },
    { id: 'vote16', who: 'Les jeunes de ton parti', kind: 'parti', text: '« Et si on proposait le droit de vote à 16 ans ? »',
      left: { label: 'Trop tôt', sat: { sae: -2, ret: 1 } }, right: { label: 'On le propose', sat: { sae: 4, ret: -2 } } },
    { id: 'rip', who: 'Un collectif citoyen', kind: 'citoyens', text: '« 500 000 signatures pour un référendum d\'initiative citoyenne. Vous écoutez ? »',
      left: { label: 'Ignorer', pop: -2 }, right: { label: 'Promettre un grand débat', pop: 2, later: { id: 'rip_suite', in: 2, chance: 1 } } },
    { id: 'cantine', who: 'Les parents d\'élèves', kind: 'citoyens', text: '« La cantine à 1 € partout, comme dans certaines villes ? »',
      left: { label: 'Non', sat: { pop: -2 } }, right: { label: 'Oui !', def: 0.04, sat: { pop: 4, pi: 2 } } },
    { id: 'medecins', who: 'Un collectif de médecins', kind: 'syndicat', text: '« Ne nous obligez pas à nous installer à la campagne ! »',
      left: { label: 'Les obliger', fronde: 0.03, sat: { ind: 3, ret: 3, cad: -3 } }, right: { label: 'Les inciter par des primes', def: 0.03, sat: { ind: 1, ret: 1 } } },
    { id: 'profs', who: 'Les syndicats enseignants', kind: 'syndicat', text: '« Grève générale dans les écoles contre les classes surchargées. »',
      left: { label: 'Recruter 5 000 profs', def: 0.05, sat: { pi: 4, pop: 1 } }, right: { label: 'Service minimum', sat: { pi: -4, ret: 1 } } },
    { id: 'tempete', who: 'Le service de prévision météo', kind: 'etat', text: 'Une tempête historique a ravagé le littoral breton. Des milliers de toits envolés.',
      left: { label: 'Fonds d\'urgence', def: 0.04, pop: 2 }, right: { label: 'Les assurances paieront', pop: -3 } },
    { id: 'datacenter', who: 'Une géante de la tech', kind: 'patronat', text: '« Un centre d\'IA géant en France, contre une électricité à prix bradé. »',
      left: { label: 'Refuser', sat: { cad: -2 } }, right: { label: 'Signer', pop: 1, sat: { cad: 3, sae: -1 }, later: { id: 'datacenter_conso', in: 3, chance: 0.7 } } },
    { id: 'vacances', who: 'Ton chef de cabinet', kind: 'gouvernement', text: '« Le fort présidentiel t\'attend pour les vacances… même si le pays gronde ? »',
      left: { label: 'Rester à Paris', pop: 1 }, right: { label: 'Partir quand même', pop: -2, later: { id: 'paparazzi', in: 1, chance: 0.5 } } },
    { id: 'tour', who: 'Le directeur du Tour de France', kind: 'sport', text: '« Une étape passe par ta ville natale. Tu montes dans ma voiture ? »',
      left: { label: 'Pas le temps', pop: -1 }, right: { label: 'Avec plaisir', pop: 2, sat: { ind: 1, ret: 1 } } },
    { id: 'intox', who: 'Ta conseillère numérique', kind: 'gouvernement', text: '« Une fausse vidéo de toi, fabriquée par une IA, fait des millions de vues. »',
      left: { label: 'Démentir en direct', pop: 1 }, right: { label: 'Porter plainte, sans commentaire', pop: -1 } },
    { id: 'allie', who: 'Le chef de ton allié', kind: 'parti', text: '« Mon parti mérite un ministère de plus. Sinon, nous quittons la majorité. »', cond: function (gv) { return (gv.allies || []).some(function (a) { return gv.seats[a] > 0; }); },
      left: { label: 'Refuser', allyLeave: true }, right: { label: 'Accepter', pop: -1, fronde: 0.05 } },
    { id: 'policiers', who: 'Les syndicats de policiers', kind: 'syndicat', text: '« Une prime, ou nous manifesterons en uniforme devant ton palais. »',
      left: { label: 'Accorder la prime', def: 0.03, sat: { ret: 2 } }, right: { label: 'Refuser', pop: -1, sat: { ret: -2 } } },
    { id: 'bassines', who: 'Les agriculteurs du Sud', kind: 'citoyens', text: '« Des réserves d\'eau géantes pour irriguer nos champs, vite ! »',
      left: { label: 'Les autoriser', sat: { ind: 4, sae: -3 } }, right: { label: 'Les refuser', sat: { ind: -4, sae: 2 } } },
    { id: 'notation', who: 'Une agence de notation', kind: 'europe', text: '« Nous nous apprêtons à dégrader la note de la France. »', cond: function (gv) { return gv.deficit > G.C.target(gv.year) + 0.5; },
      left: { label: 'Plan d\'économies', def: -0.1, pop: -2, sat: { pi: -2 } }, right: { label: 'Les ignorer', debt: 1.5, pop: -1 } },
    { id: 'remaniement', who: 'Lulu, ta conseillère', kind: 'lulu', text: '« Les sondages plongent. Et si on changeait de Premier ministre ? »', cond: function (gv) { return G.popularity(gv) < 45 && gv.cabinet && !gv.cohab; },
      left: { label: 'Garder le cap', fronde: 0.03 }, right: { label: 'Faire sauter le fusible', fusible: true } },
    { id: 'chat', who: 'La garde républicaine', kind: 'etat', text: 'Un chat errant s\'est installé dans les jardins de l\'Élysée. Les Français l\'adorent déjà.',
      left: { label: 'Le confier à un refuge', pop: -1 }, right: { label: 'L\'adopter', pop: 2 } }
  ];
  /* Les suites : elles reviennent quand la trace a été laissée */
  var FOLLOW = [
    { id: 'raffineries', who: 'Les raffineurs en grève', kind: 'syndicat', text: 'La grève s\'étend aux raffineries. Les stations-service sont à sec.', follow: true,
      left: { label: 'Céder', def: 0.05, pop: -1, sat: { pi: 2 } }, right: { label: 'Réquisitionner', pop: -2, sat: { pop: -4 } } },
    { id: 'bruxelles_bilan', who: 'La Commission européenne', kind: 'europe', text: '« Vous nous aviez promis des économies. Voyons voir… »', follow: true, judge: true },
    { id: 'karting', who: 'Ta conseillère numérique', kind: 'gouvernement', text: 'La vidéo du karting tourne mal : on te voit percuter un pneu en hurlant.', follow: true,
      left: { label: 'En rire', pop: 1, sat: { sae: 2 } }, right: { label: 'Faire retirer la vidéo', pop: -2 } },
    { id: 'abeilles', who: 'Un comité de scientifiques', kind: 'citoyens', text: '« Rapport accablant : les abeilles disparaissent près des champs traités. »', follow: true,
      left: { label: 'Interdire enfin', pop: 1, sat: { ind: -3 } }, right: { label: 'Contester le rapport', pop: -3, sat: { cad: -2 } } },
    { id: 'rugby_travaux', who: 'Le comité des grands événements', kind: 'sport', text: '« Les stades prennent du retard. Il faut une rallonge. »', follow: true,
      left: { label: 'Rallonger le budget', def: 0.05 }, right: { label: 'Réduire l\'ambition', pop: -2 } },
    { id: 'rancon', who: 'Un journal d\'investigation', kind: 'medias', text: '« Révélation : l\'État a payé la rançon des pirates. »', follow: true,
      left: { label: 'Assumer', pop: -2 }, right: { label: 'Nier', pop: -4, fronde: 0.03 } },
    { id: 'rip_suite', who: 'Le collectif citoyen', kind: 'citoyens', text: '« Le grand débat est fini. Organiserez-vous le référendum ? »', follow: true,
      left: { label: 'Non, c\'était un débat', pop: -3 }, right: { label: 'Oui, on vote !', pop: 3, fronde: 0.03 } },
    { id: 'datacenter_conso', who: 'Le gestionnaire du réseau électrique', kind: 'etat', text: '« Le centre d\'IA consomme autant qu\'une ville entière. Risque de coupures cet hiver. »', follow: true,
      left: { label: 'Rationner le centre', sat: { cad: -2 }, pop: 1 }, right: { label: 'Rouvrir une centrale', def: 0.03, sat: { sae: -2 } } },
    { id: 'paparazzi', who: 'Un magazine people', kind: 'medias', text: 'En une : toi en maillot de bain pendant que la France gronde.', follow: true,
      left: { label: 'Rentrer d\'urgence', pop: 1 }, right: { label: 'Prendre la pose', pop: -2, sat: { sae: 1 } } }
  ];
  var BY = {}; CARDS.concat(FOLLOW).forEach(function (c) { BY[c.id] = c; });
  /* La couleur de fond de chaque famille de personnages */
  var KIND = { syndicat: '#F3BCD1', patronat: '#BFD4F0', elus: '#D7E8C4', europe: '#C9D3F5', medias: '#F7CF8E', gouvernement: '#D9D4F0', etat: '#D6DCE4',
    citoyens: '#CFEBD8', sport: '#FBD3B0', parti: '#E8D5F2', lulu: '#F5E7A8' };

  function slot(gv) { return (gv.year - 1) * 4 + (gv.cardSlot || 0); }
  /* La carte de la saison : d'abord une suite arrivée à échéance, sinon une carte jamais vue dont la condition est remplie */
  function draw(gv) {
    gv.seen = gv.seen || {}; gv.pendingCards = gv.pendingCards || [];
    var now = slot(gv), due = gv.pendingCards.filter(function (p) { return p.at <= now; })[0];
    if (due) { gv.pendingCards.splice(gv.pendingCards.indexOf(due), 1); return BY[due.id]; }
    var pool = CARDS.filter(function (c) { return !gv.seen[c.id] && (!c.cond || c.cond(gv)); });
    if (!pool.length) return null;
    var c = pool[Math.floor(gv.rng() * pool.length)];
    gv.seen[c.id] = true;
    return c;
  }
  /* Le verdict de Bruxelles : a-t-on tenu la promesse d'économies ? */
  function judged(gv, c) {
    if (!c.judge) return c;
    var ok = gv.deficit <= G.C.target(gv.year) + 0.2;
    return Object.assign({}, c, { text: ok ? '« Vous avez tenu parole : le déficit revient sur la trajectoire. Félicitations. »' : '« Vous n\'avez pas tenu parole. Nous ouvrons une procédure. »',
      left: ok ? { label: 'Merci !', pop: 2 } : { label: 'S\'excuser', pop: -2, debt: 0.5 }, right: ok ? { label: 'En faire une fierté', pop: 3, fronde: 0.02 } : { label: 'Contester', pop: -1, debt: 1 } });
  }
  /* Quelles jauges un choix fait bouger (pour les points au-dessus des jauges, sans dire dans quel sens) */
  function touches(o) {
    var t = {};
    if (o.def || o.debt) t.budget = Math.abs(o.def || 0) * 20 + Math.abs(o.debt || 0) * 2;
    var p = Math.abs(o.pop || 0); Object.keys(o.sat || {}).forEach(function (k) { p += Math.abs(o.sat[k]) * 0.3; }); if (p) t.pop = p;
    if (o.fronde || o.allyLeave || o.fusible) t.assemblee = o.allyLeave ? 3 : 1.5;
    if (o.later) t.suite = 1;
    Object.keys(t).forEach(function (k) { t[k] = t[k] >= 2.5 ? 'big' : 'small'; });
    return t;
  }
  /* Appliquer un choix */
  function apply(gv, c, side) {
    var o = side === 'left' ? c.left : c.right, out = { notes: [] };
    G.applyOpt(gv, o);
    if (o.fronde) gv.fronde = (gv.fronde || 0) + o.fronde;
    if (o.later && gv.rng() < (o.later.chance == null ? 1 : o.later.chance)) { gv.pendingCards = gv.pendingCards || []; gv.pendingCards.push({ id: o.later.id, at: slot(gv) + o.later.in }); }
    if (o.allyLeave) {
      var a = (gv.allies || []).filter(function (x) { return gv.seats[x] > 0; })[0];
      if (a) { gv.allies = gv.allies.filter(function (x) { return x !== a; }); if (gv.ally === a) gv.ally = null; out.notes.push(E.PARTY[a].short + ' quitte ta majorité (' + gv.seats[a] + ' députés).'); }
    }
    if (o.fusible && gv.cabinet) {
      var CB = node ? require('./cabinet.js') : root.PolitikCabinet, pool = CB.reshufflePool(gv);
      if (pool[0]) { var r = CB.reshuffle(gv, 'pm', pool[0]); if (r.ok) out.notes.push(pool[0].name + ' devient Premier ministre (+' + r.pop + ' de popularité).'); }
    }
    gv.cardLog = gv.cardLog || []; gv.cardLog.push({ id: c.id, side: side, year: gv.year });
    return out;
  }
  /* Le visage d'un personnage, toujours le même pour une carte donnée */
  function faceOf(c) {
    var h = 7; for (var i = 0; i < c.id.length; i++) h = (h * 31 + c.id.charCodeAt(i)) % 100003;
    var hairs = ['court', 'long', 'carre', 'boucles', 'chignon', 'chauve'];
    return { skin: h % 6, hair: hairs[(h >> 3) % 6], hairColor: ['#1E1A1A', '#3A2A20', '#8A5A3B', '#C9922E', '#C9C9D1'][(h >> 5) % 5], glasses: ['none', 'rondes', 'carrees', 'none'][(h >> 7) % 4],
      mouth: ['sourire', 'serieux', 'grand'][(h >> 9) % 3], outfit: ['#26305A', '#4A4A55', '#7A1E24', '#2E6B45', '#5B3E8C'][(h >> 11) % 5], beard: (h >> 13) % 4 === 0, bg: KIND[c.kind] || '#E3E0D6' };
  }

  var API = { CARDS: CARDS, FOLLOW: FOLLOW, BY: BY, KIND: KIND, draw: draw, judged: judged, touches: touches, apply: apply, faceOf: faceOf };
  if (node) module.exports = API; else root.PolitikCards = API;
})(this);

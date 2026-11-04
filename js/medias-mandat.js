/* Politik — lot 5 : intervenir à la télé et à la radio pendant le mandat. Moteur sans affichage : tout l'état est dans gv.medias.
   Un passage par an, plus un de secours pendant une crise. Passer reste facultatif : ne rien faire ne coûte rien.
   Tous les chiffres de C sont des réglages de jeu, sans source : ce ne sont pas des faits sur l'effet réel des médias. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var E = node ? require('./engine.js') : root.PolitikEngine;
  var G = node ? require('./govern.js') : root.PolitikGov;
  var ECO = node ? require('./economy.js') : root.PolitikEconomy;

  var C = {
    usure: 0.7,            // chaque passage du mandat rapporte 30 % de moins que le précédent
    lasseDes: 3,           // à partir du 4e passage, les Français saturent…
    lasse: 0.6,            // … −0,6 de popularité au 4e, −1,2 au 5e, etc.
    vingt: { expliquer: 1, annoncer: 3, chute: 2, base: 10, autres: 1.5, autresChute: 5 },   // en points de popularité, ou de satisfaction pour attaquer
    matinale: { expliquer: 2, annoncer: 6, attaquer: 9, noyau: 0.9, agace: 0.6 },           // en satisfaction, multipliés par l'écart du groupe au noyau de la station
    annonce: 0.05,         // le coût au déficit d'une mesure annoncée, en point de PIB, durable
    crise: 2,              // le bon ton gagne 2 points (avec l'usure), le mauvais en perd 2
    risque: { vingt: 0.12, vingtPop: 0.008, vingtRepete: 0.07, matinale: 0.06, matinalePop: 0.003, matinaleRepete: 0.03, popSeuil: 45, max: 0.75 },
    risqueTon: { expliquer: 0.6, annoncer: 1, attaquer: 1.4 }, risqueAttaque: 0.1
  };
  var CANAUX = {
    vingt: { nom: 'Le 20 h', scene: 'FRANCE TV INFO · 20 H', effet: 'Toute la France te regarde : effet fort sur la popularité, mais un raté se voit.', hote: 'Le présentateur du 20 h' },
    matinale: { nom: 'La matinale', effet: 'Tu parles au public d’une station : il t’écoute, les autres peuvent s’agacer.', hote: 'L’intervieweur de 7 h 50' }
  };
  var TONS = {
    expliquer: { nom: 'Expliquer', icone: '🧭', effet: 'Petit gain sûr : au pire, ça passe inaperçu.', expr: 'assure' },
    annoncer: { nom: 'Annoncer une mesure', icone: '📣', effet: 'Gain plus fort, léger coût au déficit.', expr: 'parle' },
    attaquer: { nom: 'Attaquer l’opposition', icone: '🥊', effet: 'Plaît à ta base, fâche les autres, et c’est risqué.', expr: 'colere' }
  };
  var QUESTIONS = [
    'Les Français ont-ils encore confiance en vous ?',
    'Où en est votre action, concrètement ?',
    'Que répondez-vous à ceux qui disent que rien ne change ?',
    'Qu’est-ce qui va changer dans la vie des gens cette année ?',
    'Quel bilan tirez-vous de ces années au pouvoir ?'
  ];
  var REPLIQUES = {
    expliquer: 'Je préfère vous dire les choses simplement : voici ce qu’on fait, et pourquoi on le fait.',
    annoncer: 'J’annonce ce soir une mesure concrète : une aide qui arrivera dès cette année.',
    attaquer: 'L’opposition critique tout et ne propose rien. Moi, je gouverne.'
  };
  var RATES = {
    vingt: { expliquer: 'Euh… le chiffre exact, je ne l’ai plus en tête, mais l’idée est là.', annoncer: 'Cette aide… enfin, le montant reste à préciser… nous y travaillons.', attaquer: 'Eux, ils… non, laissez-moi finir… je ne m’énerve pas !' },
    matinale: { expliquer: 'Pardon, il est tôt… je reprends, si vous le voulez bien.', annoncer: 'Le calendrier ? Écoutez, je n’ai pas la date sous les yeux.', attaquer: 'Vos auditeurs savent bien que… si, si, je l’ai dit, mais pas comme ça.' }
  };
  /* Les crises de l'année : bon est le ton qui apaise, mauvais celui qui aggrave. Un événement qui n'est pas ici n'est pas une crise. */
  var CRISES = {
    canicule: { nom: 'La canicule', q: 'Le pays suffoque. L’État a-t-il été à la hauteur ?', bon: 'expliquer', mauvais: 'attaquer',
      r: { expliquer: 'Voici qui fait quoi, département par département, et où trouver de l’eau et de l’aide.', annoncer: 'Je débloque ce soir une enveloppe pour les communes les plus touchées.', attaquer: 'Ceux qui critiquent aujourd’hui n’ont rien préparé quand ils étaient au pouvoir.' } },
    marches: { nom: 'L’inquiétude des marchés', q: 'Les taux grimpent. La France peut-elle encore payer sa dette ?', bon: 'expliquer', mauvais: 'annoncer',
      r: { expliquer: 'La France paie ses dettes. Voici notre trajectoire, chiffre par chiffre.', annoncer: 'Pour rassurer, je lance ce soir un nouveau plan de soutien.', attaquer: 'Ce sont les promesses de l’opposition qui font peur aux marchés.' } },
    ministre: { nom: 'L’affaire du ministre', q: 'Votre ministre a-t-il menti ? Que saviez-vous ?', bon: 'expliquer', mauvais: 'attaquer',
      r: { expliquer: 'Je dis ce que je sais, ce que je ne sais pas, et la justice fera son travail.', annoncer: 'J’annonce des règles plus strictes pour tous les membres du gouvernement.', attaquer: 'L’opposition fait son beurre sur une affaire : elle ferait mieux de balayer devant sa porte.' } },
    gilets: { nom: 'La colère des automobilistes', q: 'Les ronds-points sont occupés. Les avez-vous entendus ?', bon: 'annoncer', mauvais: 'attaquer',
      r: { expliquer: 'Je comprends cette colère, et voici pourquoi le carburant coûte ce prix.', annoncer: 'Je les ai entendus : j’annonce une aide pour ceux qui n’ont pas d’autre choix que la voiture.', attaquer: 'Certains à l’opposition soufflent sur les braises des ronds-points.' } },
    tracteurs: { nom: 'Les tracteurs sur le périph', q: 'Les agriculteurs encerclent Paris. Quelle réponse leur donnez-vous ?', bon: 'annoncer', mauvais: 'attaquer',
      r: { expliquer: 'Les normes, les prix, les marges : je veux expliquer ce qu’on peut changer, et ce qu’on ne peut pas.', annoncer: 'J’annonce des mesures pour leurs revenus, dès cette année.', attaquer: 'Ceux qui ont signé ces normes viennent maintenant défiler avec eux.' } },
    cour: { nom: 'Le rapport de la Cour des comptes', q: 'La Cour juge votre trajectoire peu crédible. A-t-elle tort ?', bon: 'expliquer', mauvais: 'annoncer',
      r: { expliquer: 'La Cour fait son travail. Voici ce que nous corrigeons, et à quel rythme.', annoncer: 'Ma réponse, c’est une nouvelle mesure pour relancer le pays.', attaquer: 'Ceux qui agitent ce rapport ont creusé la dette avant moi.' } },
    greve: { nom: 'La grève', q: 'Le pays est bloqué. Allez-vous céder ?', bon: 'expliquer', mauvais: 'attaquer',
      r: { expliquer: 'Je veux dire aux grévistes et aux usagers où nous en sommes, et ce qui reste à négocier.', annoncer: 'Je mets sur la table une proposition nouvelle, dès ce soir.', attaquer: 'Une partie de l’opposition veut le blocage plus que la solution.' } }
  };

  var HEUREUX = { bleus: true, innovation: true, evenement: true };
  var CRISE_GENERALE = { expliquer: 'Je veux vous dire ce que nous savons, ce que nous faisons, et ce que nous ne savons pas encore.', annoncer: 'Ce soir, j’annonce des mesures concrètes pour répondre à cette situation.', attaquer: 'Ceux qui critiquent aujourd’hui n’ont rien fait quand ils en avaient le pouvoir.' };
  function etat(gv) { if (!gv.medias) gv.medias = { passes: [] }; return gv.medias; }
  function nbPasses(gv) { return gv.medias ? gv.medias.passes.length : 0; }
  function deLAnnee(gv, y) { return gv.medias ? gv.medias.passes.filter(function (p) { return p.y === y; }) : []; }
  function usure(n) { return Math.pow(C.usure, n); }
  function popBrute(gv) {
    var p = 0, w = 0;
    D.SEGMENTS.forEach(function (s) { var k = E.NATPOP[s.id]; p += gv.sat[s.id] * k; w += k; });
    return p / w + (gv.popBonus || 0);
  }
  function station(id) { return D.STATIONS.filter(function (s) { return s.id === id; })[0]; }
  /* La crise en cours : une grève si le mandat en a une, sinon l'événement de l'année, une fois qu'il est connu du joueur */
  function crise(gv, connu) {
    if (gv.greve && gv.greve.active !== false) return Object.assign({ id: 'greve' }, CRISES.greve);
    if (!connu) return null;
    var fait = G.eventsDone ? G.eventsDone(gv) : 0, ev = G.drawEvent(gv, Math.max(0, fait - 1));   // le dernier événement montré au joueur
    if (!ev || HEUREUX[ev.id]) return null;
    return Object.assign({ id: ev.id }, CRISES[ev.id] || { nom: ev.title, q: ev.text + ' Que répondez-vous aux Français ?', bon: 'expliquer', mauvais: 'attaquer', r: CRISE_GENERALE });
  }
  /* Peut-on passer maintenant ? La raison est toujours écrite */
  function dispo(gv, connu) {
    if (gv.over) return { ok: false, raison: 'Le mandat est terminé.' };
    var an = deLAnnee(gv, gv.year), cr = crise(gv, connu);
    if (!an.length) return { ok: true, secours: false, crise: cr };
    if (cr && an.length === 1) return { ok: true, secours: true, crise: cr };
    return { ok: false, crise: cr, raison: an.length > 1 ? 'Tes deux passages de l’année sont faits, secours compris. Prochain rendez-vous l’an prochain.' : 'Déjà passé dans les médias cette année. Seule une crise ouvrirait un passage de secours.' };
  }
  function risque(gv, canal, ton) {
    var R = C.risque, n = nbPasses(gv), bas = Math.max(0, R.popSeuil - G.popularity(gv));
    var p = canal === 'vingt' ? R.vingt + R.vingtPop * bas + R.vingtRepete * n : R.matinale + R.matinalePop * bas + R.matinaleRepete * n;
    return Math.min(R.max, p * C.risqueTon[ton] + (ton === 'attaquer' ? C.risqueAttaque : 0));
  }
  function baseDe(gv) { return D.SEGMENTS.map(function (s) { return s.id; }).sort(function (a, b) { return gv.sat[b] - gv.sat[a]; }).slice(0, 2); }
  /* Ce que produit un passage, sans rien changer : popularité directe, satisfaction par groupe, déficit */
  function effets(gv, o, rate, cr) {
    var n = nbPasses(gv), f = usure(n), V = C.vingt, M = C.matinale, fx = { pop: 0, sat: {}, def: o.ton === 'annoncer' ? C.annonce : 0, crise: 0 };
    if (o.canal === 'vingt') {
      if (o.ton === 'expliquer') fx.pop = rate ? 0 : V.expliquer * f;
      else if (o.ton === 'annoncer') fx.pop = rate ? -V.chute : V.annoncer * f;
      else { var base = baseDe(gv); D.SEGMENTS.forEach(function (s) { fx.sat[s.id] = base.indexOf(s.id) >= 0 ? (rate ? 0 : V.base * f) : -(rate ? V.autresChute : V.autres); }); }
    } else {
      var st = station(o.station), fit = E.stationFit(gv.pid, st.id).f, amp = M[o.ton], base2 = baseDe(gv);
      D.SEGMENTS.forEach(function (s) {
        var k = st.segs[s.id] - M.noyau, d = k > 0 ? (rate ? 0 : amp * k * fit * f) : o.ton === 'expliquer' ? 0 : amp * k * M.agace * (rate ? 2 : 1);
        if (o.ton === 'attaquer' && base2.indexOf(s.id) < 0) d -= rate ? 3 : 1.5;
        if (d) fx.sat[s.id] = d;
      });
    }
    if (cr) fx.crise = o.ton === cr.mauvais ? -C.crise : o.ton === cr.bon && !rate ? C.crise * f : 0;
    if (n >= C.lasseDes) fx.pop -= C.lasse * (n - C.lasseDes + 1);
    return fx;
  }
  /* Le gain net sur la popularité d'un jeu d'effets (plafonds de satisfaction compris) */
  function net(gv, fx) {
    var p = fx.pop + fx.crise, w = 0;
    D.SEGMENTS.forEach(function (s) { var k = E.NATPOP[s.id]; w += k; p += (Math.max(0, Math.min(100, gv.sat[s.id] + (fx.sat[s.id] || 0))) - gv.sat[s.id]) * k / 100; });
    return p * 100 / Math.max(w, 100);
  }
  /* Ce que le joueur voit avant de choisir : le gain si ça passe, le résultat si ça rate, le risque */
  function apercu(gv, o, connu) {
    var cr = crise(gv, connu), r = risque(gv, o.canal, o.ton);
    return { gain: net(gv, effets(gv, o, false, cr)), rate: net(gv, effets(gv, o, true, cr)), risque: r, def: o.ton === 'annoncer' ? C.annonce : 0,
      risqueTxt: r < 0.1 ? 'faible' : r < 0.25 ? 'moyen' : 'élevé', bonTon: cr ? cr.bon === o.ton : false, mauvaisTon: cr ? cr.mauvais === o.ton : false };
  }
  function question(gv, canal, connu) { var cr = crise(gv, connu); return cr ? cr.q : QUESTIONS[(gv.year - 1 + (canal === 'vingt' ? 0 : 2)) % QUESTIONS.length]; }
  /* Le passage. Le hasard vient de gv.rng : il est sauvegardé avec la partie */
  function passer(gv, o, connu) {
    var d = dispo(gv, connu); if (!d.ok) return { refuse: d.raison };
    if (!CANAUX[o.canal] || !TONS[o.ton] || (o.canal === 'matinale' && !station(o.station))) return { refuse: 'Passage inconnu.' };
    var cr = d.crise, r = risque(gv, o.canal, o.ton), rate = gv.rng() < r, fx = effets(gv, o, rate, cr), p0 = popBrute(gv), f = usure(nbPasses(gv));
    gv.popBonus = (gv.popBonus || 0) + fx.pop + fx.crise;
    if (Object.keys(fx.sat).length) G.addSat(gv, fx.sat, 1);
    var nom = o.canal === 'vingt' ? CANAUX.vingt.nom : CANAUX.matinale.nom + ' sur ' + station(o.station).name, label = 'Passage : ' + nom.charAt(0).toLowerCase() + nom.slice(1);
    if (fx.def) { gv.deficit += fx.def; if (gv.eco) ECO.note(gv.eco, 'deficit', label, fx.def); }
    var pop = popBrute(gv) - p0;
    if (gv.eco) ECO.note(gv.eco, 'pop', label, pop);
    var replique = rate ? RATES[o.canal][o.ton] : cr ? cr.r[o.ton] : REPLIQUES[o.ton];
    var res = { y: gv.year, canal: o.canal, station: o.station || null, ton: o.ton, secours: d.secours, crise: cr ? cr.id : null, rate: rate, pop: Math.round(pop * 100) / 100, def: fx.def, f: Math.round(f * 100) / 100 };
    etat(gv).passes.push(res);
    return Object.assign({ nom: nom, replique: replique, sat: fx.sat, criseNom: cr ? cr.nom : null, criseEffet: fx.crise }, res);
  }
  /* Le résultat écrit, pour l'écran et le bilan */
  function txtPts(x) { var a = Math.abs(x).toFixed(1).replace('.', ','); return (Number(Math.abs(x).toFixed(1)) === 0 ? '' : x > 0 ? '+' : '−') + a; }
  function ligne(p) { return (p.canal === 'vingt' ? CANAUX.vingt.nom : CANAUX.matinale.nom + ' sur ' + station(p.station).name) + ' (' + TONS[p.ton].nom.toLowerCase() + (p.rate ? ', raté' : '') + ') : ' + txtPts(p.pop) + ' de popularité' + (p.def ? ', déficit +' + p.def.toFixed(2).replace('.', ',') + ' pt' : ''); }

  var API = { C: C, CANAUX: CANAUX, TONS: TONS, CRISES: CRISES, etat: etat, nbPasses: nbPasses, deLAnnee: deLAnnee, usure: usure, crise: crise, dispo: dispo, risque: risque, effets: effets, apercu: apercu, question: question, passer: passer, ligne: ligne, txtPts: txtPts, popBrute: popBrute };
  if (node) module.exports = API; else root.PolitikMediasMandat = API;
})(this);

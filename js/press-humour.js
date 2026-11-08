/* Politik — v5.17 : le coin satirique du Quotidien National.
   Dans chaque numéro : une pub parodique, deux brèves et l'horoscope politique (3 signes).
   On se moque des travers de la politique (com, langue de bois, retournements), jamais des électeurs,
   et aucun parti n'est visé plus qu'un autre. Le choix dépend du tour, pas du hasard du jeu : la partie n'est pas modifiée. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;

  /* nom, accroche, texte, petits caractères, pictogramme */
  var PUBS = [
    { nom: 'Langue de Bois®', accroche: 'Ne dit rien, mais le dit bien.', texte: 'Du bois massif pour les grands discours. Résiste aux questions, aux relances et aux journalistes.', mentions: 'Garantie 5 ans, renouvelable une fois.', ic: '🪵' },
    { nom: 'La Veste Réversible', accroche: 'Deux couleurs, une seule conviction.', texte: 'La vôtre, celle du dernier sondage. Se retourne en un clin d’œil, même en direct.', mentions: 'Nouveau coloris : centre.', ic: '🧥' },
    { nom: 'Éléments de Langage', accroche: 'En kit, prêts à l’emploi.', texte: '500 phrases, de « Les Français attendent des actes » à « Je l’ai toujours dit ». Notice incluse : ne jamais répondre à la question.', mentions: 'Montage en 5 minutes, sans réfléchir.', ic: '📦' },
    { nom: 'Promesses, gamme Éphémère', accroche: 'Tenues jusqu’au second tour.', texte: 'Légères, brillantes, faciles à porter en meeting. Elles plaisent à tout le monde, au moins un temps.', mentions: 'Au-delà du second tour, voir conditions en très petits caractères au dos du programme.', ic: '🎈' },
    { nom: 'Sondage Express', accroche: 'Le chiffre que vous voulez, en une heure.', texte: 'Échantillon soigneusement choisi parmi vos proches. Résultats garantis conformes à vos attentes.', mentions: 'Marge d’erreur offerte.', ic: '📊' },
    { nom: 'Kit Selfie au Marché', accroche: 'Un poireau, un cabas, un sourire.', texte: 'Pour avoir l’air de faire ses courses comme tout le monde. Le poireau est réutilisable d’une campagne à l’autre.', mentions: 'Photographe non fourni.', ic: '🥬' },
    { nom: 'Agence Rétropédalage', accroche: 'Vous avez dit une bêtise ?', texte: 'Nous retrouvons « ce que vous vouliez vraiment dire ». Discrétion, rapidité, mauvaise foi.', mentions: 'Devis gratuit. Intervention en moins de 24 h.', ic: '🚲' },
    { nom: 'Salle Comble®', accroche: 'Le meeting plein, même un mardi.', texte: 'Location de figurants enthousiastes. Applaudissements compris, cris de joie sur demande.', mentions: 'Drapeaux en option. Figurants interchangeables d’un parti à l’autre.', ic: '👏' },
    { nom: 'Commission Théodule', accroche: 'Votre problème mérite une commission.', texte: 'Douze experts, un président, un logo. Le rapport est livré en 18 mois.', mentions: 'Rangement dans un tiroir le jour même inclus dans le prix.', ic: '🗄️' },
    { nom: 'La Cravate Anti-Bilan', accroche: 'Elle respire pour vous.', texte: 'Se desserre toute seule dès qu’on vous parle de votre bilan. Idéale pour les débats télévisés.', mentions: 'Existe aussi en foulard.', ic: '👔' },
    { nom: 'Contexte Assurances', accroche: 'Votre phrase est sortie de son contexte ?', texte: 'Nos experts l’y remettent. Ou pas, selon la formule choisie.', mentions: 'Franchise : une excuse publique.', ic: '🛡️' },
    { nom: 'Le Bain de Foule Portatif', accroche: 'Douze sympathisants pliables.', texte: 'Ils tiennent dans le coffre de la voiture officielle et se déplient en trente secondes devant les caméras.', mentions: 'Sourires vendus séparément.', ic: '🧳' }
  ];

  var BREVES = [
    'Le ministère de la Simplification publie son guide de simplification : 412 pages et 3 annexes.',
    'Selon un sondage, 64 % des Français ne font pas confiance aux sondages. Marge d’erreur : 3 points.',
    'Une commission est créée pour réfléchir à la suppression des commissions.',
    'Un candidat promet de « tout changer pour que rien ne change ». Ses conseillers saluent la clarté du message.',
    'Le slogan « Ensemble, plus loin, maintenant » est déposé le même jour par trois partis différents.',
    'Grand débat sur la durée des débats : il durera 9 heures.',
    'Une permanence est cambriolée. Les voleurs n’ont emporté que les tracts du parti d’en face.',
    'Un député s’endort en séance. Réveillé en sursaut, il vote pour. On ne sait toujours pas pour quoi.'
  ];

  var HOROSCOPE = [
    ['♈', 'Bélier', 'Foncez tête baissée : c’est exactement ce que les plateaux télé attendent.'],
    ['♉', 'Taureau', 'Ne lâchez rien. Sauf peut-être cette mesure-là.'],
    ['♊', 'Gémeaux', 'Vous avez deux avis sur chaque sujet. Le centre vous tend les bras.'],
    ['♋', 'Cancer', 'Vos électeurs ont besoin de tendresse. Serrez des mains, avec modération.'],
    ['♌', 'Lion', 'Votre ego est au zénith. Votre sondage, un peu moins.'],
    ['♍', 'Vierge', 'Relisez vos fiches : un chiffre du chômage n’est pas une pointure.'],
    ['♎', 'Balance', 'Un pas à gauche, un pas à droite. Vous dansez, ou vous faites campagne ?'],
    ['♏', 'Scorpion', 'Un rival vous veut du mal. Rassurez-vous : ils vous en veulent tous.'],
    ['♐', 'Sagittaire', 'Promettez loin, visez court.'],
    ['♑', 'Capricorne', 'Vous grimpez lentement. Les sondages aussi.'],
    ['♒', 'Verseau', 'Une idée neuve vous traverse. Laissez-la passer, c’est plus prudent.'],
    ['♓', 'Poissons', 'Noyez le poisson : c’est votre spécialité, et ça marche très bien en interview.']
  ];

  function hash(s) { s = String(s); var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003; return h; }

  /* ctx : { turn, maxTurns, me, debate (bool), city, leader (sigle court), theme (nom du sujet du jour) } — tout est facultatif */
  function edition(ctx) {
    ctx = ctx || {};
    var t = ctx.turn || 1, base = hash(ctx.me || 'x');
    var pub = PUBS[(base + t) % PUBS.length];   // jamais la même pub deux tours de suite
    // les brèves : d'abord celle du moment, puis une brève générale
    var lie = [];
    if (ctx.maxTurns && t >= ctx.maxTurns) lie.push('Dernier jour de campagne : les candidats découvrent les régions qu’ils avaient promis de visiter.');
    if (ctx.debate) lie.push('Soir de débat : les candidats répètent leur « phrase spontanée » devant le miroir depuis six heures du matin.');
    if (ctx.theme) lie.push(ctx.theme + ' : chaque parti affirme y avoir pensé en premier.');
    if (ctx.leader && t > 1) lie.push(ctx.leader + ' passe en tête : ses rivaux découvrent soudain des qualités aux sondages d’il y a trois semaines.');
    if (ctx.city) lie.push(t % 2 ? 'À ' + ctx.city + ', le marché du dimanche compte plus de candidats que de clients.' : 'Le panneau électoral de ' + ctx.city + ' tient encore debout, seul survivant de trois campagnes.');
    var breves = [];
    if (lie.length) breves.push(lie[(ctx.debate || (ctx.maxTurns && t >= ctx.maxTurns)) ? 0 : t % lie.length]);
    breves.push(BREVES[(base + 3 * t) % BREVES.length]);
    if (breves.length < 2) breves.push(BREVES[(base + 3 * t + 1) % BREVES.length]);
    var horo = [0, 1, 2].map(function (i) { return HOROSCOPE[(base + 3 * t + i + Math.floor(t / 4)) % HOROSCOPE.length]; });
    return { pub: pub, breves: breves, horo: horo };
  }

  var API = { PUBS: PUBS, BREVES: BREVES, HOROSCOPE: HOROSCOPE, edition: edition };
  if (node) module.exports = API; else root.PolitikHumour = API;
})(this);

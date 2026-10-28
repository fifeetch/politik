/* Politik — v4.8 : le guide d'astuces de Lulu.
   Lulu ne se contente plus d'un conseil : au bon moment, elle glisse une astuce sur le fonctionnement du jeu
   (au plus une nouvelle par tour, jamais deux fois la même dans une partie). Le reste du temps, elle donne son conseil du tour.
   Chaque astuce a une condition (« when ») : elle n'apparaît que lorsque la situation s'y prête.
   On peut couper Lulu en la touchant (« Je ne veux plus de conseils »), et la rallumer depuis le menu •••. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;

  /* ctx : { g, me, pl (ton joueur), E (moteur), R (règles), sel (région choisie ou null) } */
  var TIPS = [
    { id: 'couleurs', when: function (c) { return c.g.turn === 1; },
      text: 'Tous les chiffres sont des % d\u2019intention de vote. 🟢 Vert : dans la région (Meeting, Mobiliser). 🔵 Bleu : dans toute la France (médias, ton score). C\u2019est le bleu qui décide de l\u2019élection.' },
    { id: 'sondage', when: function (c) { return c.g.turn === 1; },
      text: 'Le seul score qui compte, c’est ton % au sondage. Chaque action affiche ce qu’elle rapporte en points : vise les gros chiffres.' },
    { id: 'appui', when: function (c) { return c.g.turn === 1; },
      text: 'Reste appuyé sur une case d’action (Meeting, Médias…) pour voir son détail sans la jouer.' },
    { id: 'region-nom', when: function (c) { return !!c.sel; },
      text: 'Touche le nom de la région pour ouvrir sa fiche complète : qui mène, combien il te manque, et le calcul de ton Meeting.' },
    { id: 'info', when: function (c) { return c.g.turn >= 1; },
      text: 'Le petit ⓘ à côté du message explique chaque calcul, pas à pas. Plus tu fouilles, plus tu comprends le jeu.' },
    { id: 'une', when: function (c) { return c.pl.programme && (c.g.hot || []).some(function (t) { return c.pl.programme.some(function (id) { return c.E.measure(id).theme === t; }); }); },
      text: 'Le sujet qui fait la une donne +1 d’impact à tous les messages sur ce thème. Quand c’est l’un des tiens, c’est le moment de taper fort.' },
    { id: 'coeur', when: function (c) { return c.sel && c.E.echoBonus(c.g, c.me, c.sel) > 0; },
      text: '❤️ Région de cœur : ton programme y plaît, chaque Meeting y rapporte 1 soutien de plus.' },
    { id: 'hostile', when: function (c) { return c.sel && c.E.echoBonus(c.g, c.me, c.sel) < 0; },
      text: '👎 Région hostile : ton programme y déplaît, chaque Meeting y rapporte 1 soutien de moins. Mieux vaut y aller par les médias.' },
    { id: 'poids', when: function (c) { return c.g.turn >= 2; },
      text: 'Une région pèse selon son nombre de votants : l’Île-de-France compte presque 20 fois plus que la Corse et l’outre-mer.' },
    { id: 'part', when: function (c) { return c.g.turn >= 2; },
      text: 'Le sondage est une part du gâteau : si tes rivaux gagnent des électeurs, ta part baisse même si tu n’en perds aucun.' },
    { id: 'salle', when: function (c) { return c.E.isBeta && c.E.isBeta(c.g) && c.g.turn >= 3; },
      text: '🏟️ Salle comble : plus une région s’est remplie de soutiens, plus un Meeting y rassemble de monde. Ton Meeting garde sa valeur jusqu’au bout.' },
    { id: 'medias-usure', when: function (c) { return c.g.turn >= 2 && c.g.aud && c.g.aud[c.me]; },
      text: '📺 L’effet des médias s’estompe de 15 % par tour. Le terrain, lui, reste : alterne les deux.' },
    { id: 'coeur-tete', when: function (c) { return c.g.turn >= 2; },
      text: 'À la télé, le ❤️ cœur parle surtout aux ouvriers, employés et sans-emploi ; la 🧠 tête aux cadres et aux retraités. Choisis selon qui vote pour toi.' },
    { id: 'abstention', when: function (c) { return c.g.turn <= 4; },
      text: '🚪 Mobiliser va chercher des gens qui ne votent pas : ces voix ne sont prises à personne, elles s’ajoutent à ton paquet.' },
    { id: 'militants', when: function (c) { return c.g.turn <= 3 && !c.pl.militants; },
      text: '👥 Une équipe de militants rapporte +1 soutien à chaque tour dans sa région. Posée tôt, elle travaille toute la campagne.' },
    { id: 'forme', when: function (c) { return c.pl.forme <= 2; },
      text: '⚡ Un candidat à bout de forces peut gaffer : aucun gain et une casserole. Garde toujours un peu d’énergie, ou fais une pause.' },
    { id: 'casseroles', when: function (c) { return c.pl.cas >= 2; },
      text: '🍳 Chaque casserole augmente le risque qu’une affaire sorte. Évite les attaques et les promesses hors programme.' },
    { id: 'argent', when: function (c) { return c.pl.money <= 4; },
      text: '💰 Les caisses se vident ? La Collecte (menu Plus) renfloue, et chaque tour t’apporte un peu d’argent.' },
    { id: 'debat', when: function (c) { return c.E.isDebateTurn(c.g); },
      text: '🎙️ Soir de débat : chaque ★ gardée pour la préparation rend tes réponses plus fortes.' },
    { id: 'objectif', when: function (c) { return c.g.turn >= 2 && c.g.turn <= 6; },
      text: '🎯 Ton objectif secret rapporte des voix en plus à la fin s’il est rempli. Touche la ligne « Objectif » pour le suivre.' },
    { id: 'bilan', when: function (c) { return c.g.turn >= 2; },
      text: 'Dans le bilan de fin de tour, touche chaque ligne : tu verras action par action d’où viennent tes hausses et tes baisses.' },
    { id: 'journal', when: function (c) { return c.g.turn >= 2; },
      text: '📰 Dans le journal, touche un article pour lire les coulisses : quelle action le parti a jouée et ce qu’elle a changé.' },
    { id: 'filtre', when: function (c) { return c.g.turn >= 2; },
      text: '🗺️ Le bouton en haut de la carte change ce qu’elle montre : ton score, la progression, l’abstention, les courses serrées…' },
    { id: 'rivaux', when: function (c) { return c.g.turn >= 3; },
      text: 'Touche un parti dans l’onglet Sondage pour voir son candidat, ses régions et ses points forts.' },
    { id: 'second-tour', when: function (c) { return c.g.turn >= c.R.maxTurns - 2; },
      text: 'Seuls les deux premiers vont au second tour. Ensuite, ce sont les reports de voix des éliminés qui décident : ménage tes voisins politiques.' },
    { id: 'dernier', when: function (c) { return c.g.turn === c.R.maxTurns; },
      text: 'Dernier tour : l’effet des médias ne s’use plus avant le vote. C’est le moment de passer à la télé.' }
  ];

  /* La prochaine astuce à montrer ce tour-ci (ou null) : la première dont la condition est vraie et pas encore vue */
  function next(ctx, seen) {
    seen = seen || {};
    for (var i = 0; i < TIPS.length; i++) {
      var t = TIPS[i];
      if (seen[t.id]) continue;
      try { if (t.when(ctx)) return t; } catch (e) { /* une condition qui ne s'applique pas : on passe */ }
    }
    return null;
  }

  var API = { TIPS: TIPS, next: next };
  if (node) module.exports = API; else root.PolitikTips = API;
})(this);

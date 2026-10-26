/* Politik — v2.5 : ton personnage et ton parti (règles sans affichage).
   - Ton personnage : un nom, un visage à composer, un trait de débat. Il peut prendre la tête d'un des 12 partis.
   - Ton parti : un 13e parti que tu fondes (nom, sigle, couleur, place sur l'axe, 2 thèmes forts).
     Il part d'environ 3 % des voix, avec un effet nouveauté au début de la campagne (data.js, RULES.novelty). */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var E = node ? require('./engine.js') : root.PolitikEngine;

  /* Les traits de débat : ils fixent le tempérament (les répliques préférées) */
  var TRAITS = {
    tribun:      { name: 'Tribun',      icon: '🎤', text: 'Tu enflammes les salles : l\'émotion et l\'attaque.', temper: { label: 'tribun', w: { attaque: 4, emotion: 4, esquive: 1, chiffres: 1 } } },
    technocrate: { name: 'Technocrate', icon: '📊', text: 'Tu connais tes dossiers par cœur : les chiffres d\'abord.', temper: { label: 'technocrate', w: { chiffres: 5, esquive: 3, attaque: 1, emotion: 1 } } },
    bagarreur:   { name: 'Bagarreur',   icon: '🥊', text: 'Tu cognes fort, quitte à te faire des ennemis.', temper: { label: 'bagarreur', w: { attaque: 5, emotion: 3, chiffres: 1, esquive: 1 } } },
    rassembleur: { name: 'Rassembleur', icon: '🤝', text: 'Tu cherches le compromis et esquives les pièges.', temper: { label: 'rassembleur', w: { esquive: 3, emotion: 3, chiffres: 3, attaque: 1 } } }
  };
  /* Les choix du visage */
  var FACE = {
    hair: [['court', 'Court'], ['long', 'Long'], ['carre', 'Carré'], ['boucles', 'Bouclé'], ['chignon', 'Chignon'], ['chauve', 'Dégarni']],
    hairColor: ['#1E1A1A', '#3A2A20', '#8A5A3B', '#C9922E', '#B23A2A', '#C9C9D1'],
    glasses: [['none', 'Sans'], ['rondes', 'Rondes'], ['carrees', 'Carrées']],
    mouth: [['sourire', 'Sourire'], ['grand', 'Éclatant'], ['serieux', 'Sérieux']],
    outfit: ['#26305A', '#4A4A55', '#7A1E24', '#2E6B45', '#F2F0EA', '#5B3E8C']
  };
  /* Les couleurs possibles pour ton parti (distinctes de celles des 12 partis) */
  var COLORS = ['#7B3FA0', '#0F8B8D', '#E4572E', '#2D3142', '#9BC53D', '#FF7EB6', '#B07D2B', '#3A86FF'];
  /* Des noms en jeux de mots, pour qui manque d'inspiration */
  var NAMES = ['Paul Hémique', 'Alex Térieur', 'Anne Onyme', 'Jean Bonneau', 'Sarah Bat', 'Marc Assin', 'Lucie Fer', 'Paul Ochon', 'Clara Vanne', 'Yves Remord', 'Mona Rchie', 'Théo Ricien', 'Agathe Zeblouse', 'Sacha Touille'];
  var PARTY_NAMES = ['Le Grand Élan', 'Demain Maintenant', 'La France d\'en Face', 'Le Parti du Bon Sens', 'Cap Commun', 'L\'Élan Citoyen'];

  function defaultChar() { return { name: '', face: { skin: 1, hair: 'court', hairColor: '#3A2A20', glasses: 'none', mouth: 'sourire', outfit: '#26305A', beard: false }, trait: 'rassembleur' }; }
  function randomName(rng) { return NAMES[Math.floor((rng || Math.random)() * NAMES.length)]; }
  function randomPartyName(rng) { return PARTY_NAMES[Math.floor((rng || Math.random)() * PARTY_NAMES.length)]; }
  function sigleOf(name) {
    var w = String(name || '').replace(/^(le|la|les|l')\s*/i, '').split(/[\s'-]+/).filter(function (x) { return x.length > 2; });
    var s = w.map(function (x) { return x.charAt(0); }).join('').toUpperCase().normalize('NFD').replace(/[^A-Z]/g, '').slice(0, 3);
    return s.length >= 2 ? s : (String(name || 'NP').normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase() + 'NP').slice(0, 2);
  }
  /* Un sigle libre : 2 ou 3 lettres, différent des 12 partis */
  function sigleError(sig) {
    if (!/^[A-Z]{2,3}$/.test(sig || '')) return 'Le sigle doit faire 2 ou 3 lettres.';
    if (D.PARTIES.some(function (p) { return p.id === sig && !p.custom; })) return 'Ce sigle est déjà pris par un autre parti.';
    return null;
  }
  function familyOf(pos) {
    return pos < 0.8 ? 'Extrême gauche' : pos < 1.8 ? 'Gauche radicale' : pos < 2.6 ? 'Gauche' : pos < 3.4 ? 'Centre gauche' : pos < 4.2 ? 'Centre' : pos < 5 ? 'Centre droit' : pos < 5.8 ? 'Droite' : 'Droite nationale';
  }
  function inkOf(hex) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1B1F3B' : '#FFFFFF';
  }
  function lighten(hex, k) {
    var n = parseInt(hex.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (x) { return Math.round(x + (255 - x) * k); });
    return '#' + c.map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  function nearest(pos) { return D.PARTIES.filter(function (p) { return !p.custom; }).slice().sort(function (a, b) { return Math.abs(a.pos - pos) - Math.abs(b.pos - pos); }); }

  /* Fonder son parti : def = { name, sigle, color, pos, themes: [t1, t2] }, ch = ton personnage */
  function buildParty(def, ch) {
    var near = nearest(def.pos), themes = def.themes || [];
    // le programme : d'abord les mesures de tes thèmes défendues par les partis voisins, puis celles des voisins
    var prog = [];
    near.forEach(function (p) { p.programme.forEach(function (m) { if (prog.indexOf(m) < 0 && themes.indexOf(E.measure(m).theme) >= 0) prog.push(m); }); });
    D.MEASURES.forEach(function (m) { if (prog.indexOf(m.id) < 0 && themes.indexOf(m.theme) >= 0 && !m.choc) prog.push(m.id); });
    prog = prog.slice(0, 3);
    near.forEach(function (p) { p.programme.forEach(function (m) { if (prog.length < 5 && prog.indexOf(m) < 0) prog.push(m); }); });
    var cred = {}; D.THEMES.forEach(function (t) { cred[t.id] = themes.indexOf(t.id) >= 0 ? 2 : (near[0].cred[t.id] >= 2 ? 1 : 0); });
    var bases = D.REGIONS.filter(function (r) { return themes.some(function (t) { return r.concerns.indexOf(t) >= 0; }); }).map(function (r) { return r.id; }).slice(0, 2);
    if (bases.length < 2) bases = bases.concat(near[0].bases).slice(0, 2);
    return {
      id: def.sigle, pos: def.pos, name: def.name, short: def.name.length > 18 ? def.sigle : def.name, family: familyOf(def.pos),
      candidate: (ch && ch.name) || 'Toi', candTitle: 'à l\'origine du parti', programme: prog, financing: (near[0].financing || []).slice(0, 2),
      color: def.color, ink: inkOf(def.color), money: 6, infl: 3, bases: bases, cred: cred,
      force: 'Effet nouveauté : +2 cubes en Meeting au tour 1, +1 aux tours 2 à 4.',
      weakness: 'Un parti tout neuf : environ 3 % des voix au départ, et pas encore d\'élus locaux.',
      cards: near[0].cards.slice(), custom: true, novelty: true, themes: themes.slice()
    };
  }
  function temperOf(ch) { var t = TRAITS[(ch && ch.trait) || 'rassembleur'] || TRAITS.rassembleur; return { label: t.temper.label, w: Object.assign({}, t.temper.w) }; }
  /* Le visage de ton personnage, sur le fond de la couleur de son parti */
  function faceCfg(ch, color) { return Object.assign({}, ch.face, { bg: lighten(color || '#7B3FA0', 0.55) }); }

  /* Prendre la tête d'un parti existant : ton nom, ton visage, ton tempérament (restaurés à la partie suivante) */
  var backup = {};
  function lead(pid, ch, A) {
    var p = E.PARTY[pid]; if (!p || p.custom) return;
    if (!backup[pid]) backup[pid] = { candidate: p.candidate, candTitle: p.candTitle, temper: D.TEMPERS[pid] };
    p.candidate = ch.name || 'Toi'; p.candTitle = 'à la tête du parti'; D.TEMPERS[pid] = temperOf(ch);
    if (A) A.setPortrait(pid, function () { return A.face(faceCfg(ch, p.color)); });
  }
  /* Tout remettre comme avant (avant une nouvelle partie) */
  function reset(A) {
    Object.keys(backup).forEach(function (pid) { var p = E.PARTY[pid], b = backup[pid]; p.candidate = b.candidate; p.candTitle = b.candTitle; D.TEMPERS[pid] = b.temper; if (A) A.setPortrait(pid, null); });
    backup = {};
    D.PARTIES.filter(function (p) { return p.custom; }).forEach(function (p) { E.unregisterParty(p.id); });
  }
  /* Fonder son parti pour de bon (juste avant de créer la partie) */
  function found(def, ch, A) {
    var p = buildParty(def, ch);
    E.registerParty(p, temperOf(ch), D.RULES.novelty.start);
    if (A) A.setPortrait(p.id, function () { return A.face(faceCfg(ch, p.color)); });
    return p;
  }

  var API = { TRAITS: TRAITS, FACE: FACE, COLORS: COLORS, defaultChar: defaultChar, randomName: randomName, randomPartyName: randomPartyName, sigleOf: sigleOf, sigleError: sigleError,
    familyOf: familyOf, buildParty: buildParty, temperOf: temperOf, faceCfg: faceCfg, lead: lead, reset: reset, found: found, lighten: lighten };
  if (node) module.exports = API; else root.PolitikPerso = API;
})(this);

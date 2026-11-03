/* Politik — le son du jeu (lot D1).
   Tout est synthétisé en Web Audio : aucun fichier, aucun téléchargement. Aucune mélodie reprise d'une œuvre existante.
   Le jeu ne connaît pas ce fichier : le son écoute le bus (PolitikBus), et le jeu reste identique sans lui.

   Règles :
     - aucun son avant un premier geste du joueur, et le volume monte doucement ensuite ;
     - sans AudioContext, ou si quoi que ce soit échoue, le jeu continue en silence ;
     - son coupé : aucun AudioContext n'est créé. Onglet caché : tout est suspendu.

   Écoute, en plus des événements du socle (nav:go, ui:modal-open, ui:modal-close), ces émissions de js/ui.js :
     ui:alert        { n }       le bandeau « Alerte info » s'affiche
     ui:paper        {}          le journal s'ouvre
     ui:action       { type }    une action rejoint la file
     ui:poll         { delta }   le bilan du tour au sondage (delta : positif ou négatif)
     ui:night-result { win }     le vainqueur est dévoilé à la soirée électorale

   API : PolitikAudio.jouer(id), .ambiance(id ou null), .couper(oui), .volume(0 à 1), .etat(), .SONS, .AMBIANCES */
(function (root) {
  var CLE = 'politik_son';
  var VOLUME_DEPART = 0.45;   // le son démarre doux
  var MONTEE = 1.2;           // secondes de montée du volume à l'ouverture
  var VOIX_MAX = 40;          // notes en cours (un jingle en compte une vingtaine) : au-delà, les nouveaux sons sont ignorés

  var SONS = ['clic', 'page', 'gain', 'perte', 'carte', 'alerte', 'cloche', 'radio', 'vingtHeures', 'foule', 'applaudissements', 'huees', 'soiree'];
  var AMBIANCES = ['plateau', 'meeting'];
  var NOMS = { clic: 'Clic', page: 'Page de journal', gain: 'Gain au sondage', perte: 'Perte au sondage', carte: 'Carte', alerte: 'Alerte de crise', cloche: 'Cloche du débat',
    radio: 'Jingle radio', vingtHeures: 'Jingle du 20 h', foule: 'Foule de meeting', applaudissements: 'Applaudissements', huees: 'Huées légères', soiree: 'Soirée électorale',
    plateau: 'Ambiance de plateau', meeting: 'Ambiance de meeting' };
  // écart minimal entre deux lectures du même son, en secondes
  var ECART = { clic: 0.05, page: 0.2, gain: 0.2, perte: 0.2, carte: 0.1, alerte: 1, cloche: 1.5, radio: 2, vingtHeures: 3, foule: 3, applaudissements: 3, huees: 3, soiree: 4 };

  /* ---------- Quel son pour quel moment ---------- */
  var SON_MODALE = [
    ['cloche', /Ce soir, sur le plateau|Le grand face-à-face/],
    ['radio', /Matinale radio/],
    ['vingtHeures', /· 20 ?h\b|Le grand rendez-vous/],
    ['alerte', /💥 Affaire|L['’]actualité s['’]impose|Crise politique|Gouvernement renversé|Coup de tonnerre|Le président dissout/],
    ['applaudissements', /Tu remportes|Ta loi est adoptée|Le gouvernement tombe|Ton gouvernement est nommé|Tu es qualifié|Bien joué/],
    ['huees', /remporte|Éliminé|Ta proposition est rejetée|La censure échoue|Pas de candidature/],
    ['gain', /Budget adopté|Ton budget a une majorité|Le 49\.3 passe|Le oui gagne/],
    ['perte', /Pas de majorité pour ton budget|Le non gagne|Référendum annulé/]
  ];
  function sonDeModale(d) {
    var txt = ((d && d.kicker) || '') + ' | ' + ((d && d.title) || '');
    for (var i = 0; i < SON_MODALE.length; i++) if (SON_MODALE[i][1].test(txt)) return SON_MODALE[i][0];
    return null;
  }
  var SON_ECRAN = { night: 'soiree', legis: 'soiree' };
  var AMBIANCE_ECRAN = { night: 'plateau', legis: 'plateau', lcamp: 'meeting', between: 'meeting', lbtw: 'meeting' };
  function ambianceVoulue(ecran, modaleCls) {
    if (modaleCls && /\btv-modal\b/.test(modaleCls)) return 'plateau';
    return AMBIANCE_ECRAN[ecran] || null;
  }
  function sonDAction(type) {
    if (type === 'terrain') return 'foule';   // le Meeting
    if (type === 'matinale' || type === 'vingt') return null;   // leur jingle a déjà sonné à l'ouverture
    return 'carte';
  }
  var ZONE_CLIC = 'button, a[href], [role="button"], [role="radio"], .map path';

  /* ---------- Réglages ---------- */
  function lireReglages(stockage) {
    var r = { coupe: false, volume: VOLUME_DEPART };
    try {
      var x = JSON.parse(stockage.getItem(CLE) || 'null');
      if (x && typeof x === 'object') {
        r.coupe = x.coupe === true;
        if (typeof x.volume === 'number' && x.volume >= 0 && x.volume <= 1) r.volume = x.volume;
      }
    } catch (e) { /* stockage indisponible ou illisible : les réglages de départ */ }
    return r;
  }
  function ecrireReglages(stockage, r) {
    try { stockage.setItem(CLE, JSON.stringify({ coupe: r.coupe, volume: r.volume })); } catch (e) { /* stockage indisponible */ }
  }

  /* ---------- Le moteur ---------- */
  function creer(env) {
    env = env || {};
    var doc = env.document || null, bus = env.bus || null, Contexte = env.AudioContext || null;
    var reglages = lireReglages(env.stockage);
    var attendre = env.attendre || function (fn, ms) { return setTimeout(fn, ms); };
    var ctx = null, maitre = null, sortie = null, enPanne = !Contexte;
    var geste = false, voix = 0, dernier = {}, textures = {};
    var ambianceActive = null, ambianceDemandee = null, ecran = null, modaleCls = null, attenteAmbiance = false;

    function cache() { return !!(doc && doc.hidden); }
    function gainDe(v) { return v * v * 1.8; }   // courbe proche de l'oreille ; le compresseur tient le haut de la course

    function reprendre() {
      try {
        if (ctx && ctx.state !== 'running' && ctx.resume) { var p = ctx.resume(); if (p && p.catch) p.catch(function () {}); }
      } catch (e) { /* le navigateur refuse : on réessaiera au prochain geste */ }
    }
    function suspendre() {
      try {
        if (ctx && ctx.state === 'running' && ctx.suspend) { var p = ctx.suspend(); if (p && p.catch) p.catch(function () {}); }
      } catch (e) { /* sans effet */ }
    }
    /* Le contexte naît au premier geste, jamais avant, et jamais si le son est coupé */
    function pret() {
      if (ctx) return true;
      if (enPanne || !geste || reglages.coupe) return false;
      try {
        ctx = new Contexte();
        var comp = ctx.createDynamicsCompressor();   // garde-fou : plusieurs sons ensemble ne saturent pas
        maitre = ctx.createGain();
        maitre.gain.setValueAtTime(0.0001, ctx.currentTime);
        maitre.gain.linearRampToValueAtTime(gainDe(reglages.volume), ctx.currentTime + MONTEE);
        sortie = ctx.createGain();
        sortie.connect(maitre); maitre.connect(comp); comp.connect(ctx.destination);
        return true;
      } catch (e) { enPanne = true; ctx = null; return false; }
    }

    /* ---------- Les briques : une note, un souffle, une texture ---------- */
    function fin(src, noeuds, duree) {
      voix++;
      var fait = false;
      function libere() {
        if (fait) return; fait = true; voix--;
        noeuds.forEach(function (n) { try { n.disconnect(); } catch (e) {} });
      }
      src.onended = libere;
      attendre(libere, (duree + 0.5) * 1000);   // si onended ne vient jamais (contexte suspendu), la voix est quand même rendue
    }
    /* o : t (départ, en s après maintenant), f, f2 (glissando), d (durée), g (niveau), type, a (attaque), coupe (filtre passe-bas) */
    function note(t0, o) {
      var t = t0 + (o.t || 0), d = o.d, s = ctx.createOscillator(), g = ctx.createGain(), noeuds = [s, g], haut = g;
      s.type = o.type || 'sine';
      s.frequency.setValueAtTime(o.f, t);
      if (o.f2) s.frequency.exponentialRampToValueAtTime(o.f2, t + d);
      if (o.det) s.detune.setValueAtTime(o.det, t);
      enveloppe(g, t, d, o.g, o.a);
      s.connect(g);
      if (o.coupe) { var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.coupe, t); g.connect(f); haut = f; noeuds.push(f); }
      haut.connect(sortie);
      s.start(t); s.stop(t + d + 0.02);
      fin(s, noeuds, (o.t || 0) + d);
    }
    function enveloppe(g, t, d, niveau, a) {
      a = a || 0.005;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(niveau, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    }
    /* o : t, d, g, a, filtre (type), f, f2 (balayage), q, texture (nom, sinon souffle blanc), vitesse, tenue (reste au niveau jusqu'à cette part de d) */
    function souffle(t0, o) {
      var t = t0 + (o.t || 0), d = o.d, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = texture(o.texture || 'blanc'); s.loop = true;
      if (o.vitesse) s.playbackRate.setValueAtTime(o.vitesse, t);
      f.type = o.filtre || 'bandpass';
      f.frequency.setValueAtTime(o.f, t);
      if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + d);
      if (o.q) f.Q.setValueAtTime(o.q, t);
      if (o.tenue) {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(o.g, t + (o.a || 0.3));
        g.gain.setValueAtTime(o.g, t + d * o.tenue);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      } else enveloppe(g, t, d, o.g, o.a);
      s.connect(f); f.connect(g); g.connect(sortie);
      s.start(t, Math.random() * 2); s.stop(t + d + 0.02);
      fin(s, [s, f, g], (o.t || 0) + d);
    }
    /* Une fois calculées, les textures restent en mémoire : quelques millisecondes au premier usage, plus rien ensuite */
    function texture(nom) {
      if (textures[nom]) return textures[nom];
      var taux = 22050, sec = { blanc: 2, foule: 5, claps: 3 }[nom], n = taux * sec;
      var b = ctx.createBuffer(1, n, taux), x = b.getChannelData(0), i, k;
      if (nom === 'blanc') {
        for (i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
      } else if (nom === 'foule') {
        // des voix lointaines : quelques bruits sourds qui montent et descendent. Un nombre entier de cycles : la boucle ne s'entend pas.
        for (k = 0; k < 4; k++) {
          var cycles = 2 + k * 3, phase = Math.random() * 6.28, lisse = 0.12 + k * 0.08, y = 0;
          for (i = 0; i < n; i++) {
            y += lisse * (Math.random() * 2 - 1 - y);
            x[i] += y * (0.55 + 0.45 * Math.sin(6.2832 * cycles * i / n + phase)) * 0.9;
          }
        }
      } else {
        // des centaines de mains : de très courts éclats de bruit, tirés au hasard
        for (k = 0; k < 480; k++) {
          var debut = Math.floor(Math.random() * (n - 300)), force = 0.25 + Math.random() * 0.5, duree = 90 + Math.floor(Math.random() * 180);
          for (i = 0; i < duree; i++) x[debut + i] += (Math.random() * 2 - 1) * force * Math.exp(-5 * i / duree);
        }
        for (i = 0; i < n; i++) x[i] = Math.max(-1, Math.min(1, x[i]));
      }
      textures[nom] = b;
      return b;
    }

    /* ---------- Les effets : chaque recette reçoit l'instant de départ ---------- */
    var RECETTES = {
      clic: function (t) {
        note(t, { f: 1500, f2: 800, d: 0.04, g: 0.1, type: 'triangle' });
        souffle(t, { d: 0.025, g: 0.05, f: 3200, q: 1 });
      },
      page: function (t) {
        souffle(t, { d: 0.26, g: 0.2, a: 0.05, f: 1600, f2: 5000, q: 0.8 });
        souffle(t, { t: 0.14, d: 0.16, g: 0.09, a: 0.02, f: 3800, f2: 2200, q: 1.2 });
      },
      gain: function (t) {
        note(t, { f: 523.25, d: 0.2, g: 0.13, type: 'triangle' });
        note(t, { t: 0.1, f: 783.99, d: 0.34, g: 0.14, type: 'triangle' });
        note(t, { t: 0.1, f: 1567.98, d: 0.3, g: 0.03 });
      },
      perte: function (t) {
        note(t, { f: 349.23, d: 0.22, g: 0.13, type: 'triangle', coupe: 1200 });
        note(t, { t: 0.14, f: 261.63, f2: 233.08, d: 0.42, g: 0.14, type: 'triangle', coupe: 900 });
      },
      carte: function (t) {
        souffle(t, { d: 0.11, g: 0.12, a: 0.02, f: 2400, f2: 900, q: 0.7 });
        note(t, { t: 0.05, f: 190, f2: 95, d: 0.09, g: 0.16 });
      },
      alerte: function (t) {
        [0, 0.22, 0.44].forEach(function (dt, i) {
          note(t, { t: dt, f: i === 1 ? 622.25 : 830.61, d: 0.2, g: 0.075, type: 'square', coupe: 1700, a: 0.008 });
        });
        note(t, { f: 110, f2: 82.41, d: 0.75, g: 0.14, a: 0.01 });
      },
      cloche: function (t) {
        // des partiels inharmoniques : c'est ce qui fait une cloche plutôt qu'une note. Deux coups, comme au début d'un round.
        [0, 0.34].forEach(function (dt) {
          [[0.56, 0.06], [0.92, 0.08], [1.19, 0.07], [1.71, 0.05], [2.0, 0.045], [2.74, 0.03], [3.76, 0.018]].forEach(function (p) {
            note(t, { t: dt, f: 880 * p[0], d: 1.5 / Math.sqrt(p[0]), g: p[1], a: 0.002 });
          });
        });
      },
      radio: function (t) {
        // un motif de six notes, composé pour le jeu, avec son écho
        [[0, 587.33], [0.13, 880], [0.26, 739.99], [0.39, 987.77], [0.6, 880], [0.73, 1174.66]].forEach(function (n, i) {
          var long = i === 5 ? 0.6 : 0.2;
          note(t, { t: n[0], f: n[1], d: long, g: 0.1, type: 'triangle' });
          note(t, { t: n[0], f: n[1] * 2, d: long * 0.5, g: 0.022 });
          note(t, { t: n[0] + 0.19, f: n[1], d: long, g: 0.025, type: 'triangle' });
        });
      },
      vingtHeures: function (t) {
        // une montée, deux coups de cuivres et un accord qui s'ouvre, composés pour le jeu
        souffle(t, { d: 0.5, g: 0.08, a: 0.42, f: 500, f2: 3200, q: 0.8 });
        note(t, { t: 0.42, f: 98, f2: 60, d: 0.34, g: 0.2 });
        var cuivre = function (dt, freqs, d, a) {
          freqs.forEach(function (f, i) {
            note(t, { t: dt, f: f, d: d, g: 0.045, a: a, type: 'sawtooth', coupe: 1500, det: i % 2 ? 6 : -6 });
          });
        };
        cuivre(0.42, [146.83, 220, 293.66], 0.2, 0.012);
        cuivre(0.66, [146.83, 220, 293.66], 0.16, 0.012);
        cuivre(0.86, [116.54, 233.08, 293.66, 349.23], 1.1, 0.05);
        note(t, { t: 0.86, f: 87.31, f2: 80, d: 0.8, g: 0.16 });
      },
      foule: function (t) {
        souffle(t, { texture: 'foule', d: 2.8, g: 0.55, a: 0.7, tenue: 0.45, f: 900, q: 0.5 });
        souffle(t, { t: 0.3, texture: 'foule', d: 2.2, g: 0.28, a: 0.6, tenue: 0.3, f: 1900, q: 0.8, vitesse: 1.25 });
        RECETTES.applaudissements(t + 0.9, 0.35);
      },
      applaudissements: function (t, part) {
        part = part || 1;
        souffle(t, { texture: 'claps', d: 3, g: 0.34 * part, a: 0.35, tenue: 0.5, filtre: 'highpass', f: 900 });
        souffle(t, { texture: 'claps', d: 2.6, g: 0.2 * part, a: 0.5, tenue: 0.4, f: 2400, q: 0.6, vitesse: 0.85 });
      },
      huees: function (t) {
        // un « ouh » de salle, assez bas et sans méchanceté
        [147, 165, 175, 196, 208].forEach(function (f, i) {
          note(t, { t: i * 0.05, f: f * 1.1, f2: f * 0.86, d: 1.6, g: 0.032, a: 0.3, type: 'sawtooth', coupe: 520, det: i * 5 - 10 });
        });
        souffle(t, { texture: 'foule', d: 1.8, g: 0.16, a: 0.3, f: 500, q: 0.6 });
      },
      soiree: function (t) {
        // l'attente : trois battements, puis l'accord du direct
        [0, 0.5, 1].forEach(function (dt) {
          note(t, { t: dt, f: 73.42, f2: 49, d: 0.34, g: 0.22, a: 0.004 });
          note(t, { t: dt, f: 293.66, d: 0.12, g: 0.03, type: 'triangle' });
        });
        souffle(t, { t: 0.7, d: 0.9, g: 0.07, a: 0.8, f: 400, f2: 3600, q: 0.7 });
        [110, 164.81, 220, 261.63, 329.63].forEach(function (f, i) {
          note(t, { t: 1.5, f: f, d: 1.7, g: 0.04, a: 0.03, type: 'sawtooth', coupe: 1900, det: i % 2 ? 7 : -7 });
        });
        note(t, { t: 1.5, f: 659.25, d: 1.3, g: 0.05, a: 0.01 });
        note(t, { t: 1.5, f: 55, d: 1.5, g: 0.2, a: 0.01 });
      }
    };

    /* ---------- Jouer ---------- */
    function jouer(id) {
      try {
        if (SONS.indexOf(id) < 0 || reglages.coupe || !pret() || cache()) return false;
        var t = ctx.currentTime;
        if (voix >= VOIX_MAX) return false;
        if (dernier[id] != null && t - dernier[id] < ECART[id]) return false;
        dernier[id] = t;
        RECETTES[id](t + 0.005);
        return true;
      } catch (e) { return false; }
    }

    /* ---------- Les ambiances : une boucle discrète, qui entre et sort en fondu ---------- */
    var REGLAGE_AMBIANCE = {
      plateau: { niveau: 0.05, filtre: 'lowpass', f: 620, vitesse: 0.9 },
      meeting: { niveau: 0.075, filtre: 'bandpass', f: 800, q: 0.45, vitesse: 1.1 }
    };
    function arreterAmbiance() {
      var a = ambianceActive; ambianceActive = null;
      if (!a) return;
      try {
        var t = ctx.currentTime;
        a.g.gain.cancelScheduledValues(t);
        a.g.gain.setValueAtTime(a.g.gain.value, t);
        a.g.gain.linearRampToValueAtTime(0.0001, t + 0.8);
        a.s.stop(t + 0.85);
        attendre(function () { [a.s, a.f, a.g].forEach(function (n) { try { n.disconnect(); } catch (e) {} }); }, 1000);
      } catch (e) { /* déjà arrêtée */ }
    }
    function appliquerAmbiance() {
      try {
        var id = reglages.coupe ? null : ambianceDemandee;
        if ((ambianceActive && ambianceActive.id) === id) return;
        if (id && !pret()) return;
        if (ctx) arreterAmbiance();
        if (!id) return;
        var r = REGLAGE_AMBIANCE[id], t = ctx.currentTime;
        var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = texture('foule'); s.loop = true;
        s.playbackRate.setValueAtTime(r.vitesse, t);
        f.type = r.filtre; f.frequency.setValueAtTime(r.f, t);
        if (r.q) f.Q.setValueAtTime(r.q, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(r.niveau, t + 1.6);
        s.connect(f); f.connect(g); g.connect(sortie);
        s.start(t);
        ambianceActive = { id: id, s: s, f: f, g: g };
      } catch (e) { ambianceActive = null; }
    }
    function ambiance(id) {
      ambianceDemandee = AMBIANCES.indexOf(id) >= 0 ? id : null;
      appliquerAmbiance();
    }
    /* Deux fenêtres qui s'enchaînent ne doivent pas couper l'ambiance : on décide un instant plus tard */
    function revoirAmbiance() {
      if (attenteAmbiance) return;
      attenteAmbiance = true;
      attendre(function () { attenteAmbiance = false; ambiance(ambianceVoulue(ecran, modaleCls)); }, 150);
    }

    /* ---------- Les réglages ---------- */
    function couper(oui) {
      reglages.coupe = !!oui;
      ecrireReglages(env.stockage, reglages);
      try {
        if (ctx) {
          var t = ctx.currentTime;
          maitre.gain.cancelScheduledValues(t);
          maitre.gain.setValueAtTime(maitre.gain.value, t);
          maitre.gain.linearRampToValueAtTime(oui ? 0.0001 : gainDe(reglages.volume), t + (oui ? 0.15 : 0.4));
          if (oui) attendre(function () { if (reglages.coupe) suspendre(); }, 220); else reprendre();
        }
      } catch (e) { /* sans effet */ }
      appliquerAmbiance();
      dessiner();
    }
    function volume(v) {
      v = Math.max(0, Math.min(1, +v || 0));
      reglages.volume = v;
      ecrireReglages(env.stockage, reglages);
      try {
        if (ctx && !reglages.coupe) {
          var t = ctx.currentTime;
          maitre.gain.cancelScheduledValues(t);
          maitre.gain.setValueAtTime(maitre.gain.value, t);
          maitre.gain.linearRampToValueAtTime(gainDe(v), t + 0.06);
        }
      } catch (e) { /* sans effet */ }
      dessiner();
    }
    function etat() {
      return { coupe: reglages.coupe, volume: reglages.volume, geste: geste, disponible: !enPanne, contexte: ctx ? ctx.state : null, ambiance: ambianceActive ? ambianceActive.id : null };
    }

    /* ---------- Le bus ---------- */
    if (bus) {
      bus.on('nav:go', function (d) {
        ecran = d && d.name;
        modaleCls = null;
        if (SON_ECRAN[ecran]) jouer(SON_ECRAN[ecran]);
        revoirAmbiance();
        fermerPanneau();
        placer();
      });
      bus.on('ui:modal-open', function (d) {
        modaleCls = (d && d.cls) || null;
        var s = sonDeModale(d);
        if (s) jouer(s);
        revoirAmbiance();
        fermerPanneau();
      });
      bus.on('ui:modal-close', function () { modaleCls = null; revoirAmbiance(); });
      bus.on('ui:alert', function () { jouer('alerte'); });
      bus.on('ui:paper', function () { jouer('page'); });
      bus.on('ui:action', function (d) { var s = sonDAction(d && d.type); if (s) jouer(s); });
      bus.on('ui:poll', function (d) { if (d && d.delta) jouer(d.delta > 0 ? 'gain' : 'perte'); });
      bus.on('ui:night-result', function (d) { jouer(d && d.win ? 'applaudissements' : 'huees'); });
    }

    /* ---------- Les gestes du joueur et la page ---------- */
    function surGeste() {
      geste = true;
      if (reglages.coupe) return;
      if (pret() && !cache()) reprendre();
      if (ambianceDemandee && !ambianceActive) appliquerAmbiance();
    }
    function surClic(e) {
      surGeste();
      var cible = e.target;
      if (!cible || !cible.closest || cible.closest('.son-zone, .son-panneau')) return;
      if (cible.closest('#paper-open, #paper-back')) { jouer('page'); return; }
      if (cible.closest('#sw-bl, #sw-br')) { jouer('carte'); return; }
      var z = cible.closest(ZONE_CLIC);
      if (z && !z.disabled) jouer('clic');
    }
    function surRelache(e) {
      if (e.target && e.target.closest && e.target.closest('#sw-card')) jouer('carte');   // la carte du mandat qu'on fait glisser
    }
    if (doc && doc.addEventListener) {
      var capte = { capture: true, passive: true };
      doc.addEventListener('pointerdown', surGeste, capte);
      doc.addEventListener('touchend', surGeste, capte);
      doc.addEventListener('keydown', surGeste, capte);
      doc.addEventListener('click', surClic, capte);
      doc.addEventListener('pointerup', surRelache, capte);
      doc.addEventListener('visibilitychange', function () {
        if (doc.hidden) suspendre();
        else if (!reglages.coupe && geste) reprendre();
      });
    }

    /* ---------- Le bouton et son panneau ---------- */
    var zone = null, bouton = null, panneau = null, caseSon = null, curseur = null;
    var ECRAN_BAS = { night: 1, legis: 1 };   // leur coin haut droit est déjà occupé
    var STYLE = '.son-zone{position:absolute;top:max(6px,env(safe-area-inset-top));right:8px;z-index:9;display:flex;flex-direction:column;align-items:flex-end;font:var(--fw-regular,400) var(--fs-sm,13px) var(--body,sans-serif);pointer-events:none}' +
      '.son-zone.son-bas{top:calc(max(6px,env(safe-area-inset-top)) + 38px)}.son-zone.son-lc{top:calc(max(16px,env(safe-area-inset-top)) + 16px);right:104px}.map-wrap>.son-zone{top:6px}' +
      '.son-btn{pointer-events:auto;width:30px;height:30px;padding:0;display:grid;place-items:center;border:1px solid rgba(var(--white-rgb,255,255,255),.35);border-radius:50%;background:rgba(var(--ink-rgb,35,32,58),.72);color:var(--white,#fff);cursor:pointer}' +
      '.son-btn svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
      '.son-btn[aria-expanded="true"]{background:var(--violet,#4A33A3)}' +
      '.son-btn:focus-visible,.son-panneau :focus-visible{outline:2px solid var(--violet-light,#8C79E6);outline-offset:2px}' +
      '.son-panneau{position:absolute;z-index:20;width:min(248px,calc(100vw - 32px));max-height:min(420px,70vh);overflow-y:auto;padding:12px;font:var(--fw-regular,400) var(--fs-sm,13px) var(--body,sans-serif);border-radius:var(--radius-md,10px);background:var(--night,#1D1A33);color:var(--white,#fff);box-shadow:0 8px 24px rgba(var(--black-rgb,0,0,0),.4)}' +
      '.son-panneau label{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:32px}' +
      '.son-panneau input[type=checkbox]{width:20px;height:20px;accent-color:var(--violet-light,#8C79E6)}' +
      '.son-panneau input[type=range]{flex:1;min-width:0;accent-color:var(--violet-light,#8C79E6)}' +
      '.son-panneau summary{cursor:pointer;margin-top:8px;color:var(--on-night-soft,#C8C2EA)}' +
      '.son-liste{display:grid;gap:4px;margin-top:6px}' +
      '.son-liste button{min-height:30px;padding:4px 8px;text-align:left;border:0;border-radius:var(--radius-sm,6px);background:rgba(var(--white-rgb,255,255,255),.1);color:inherit;font:inherit;cursor:pointer}' +
      '.son-note{margin:4px 0 0;font-size:var(--fs-xs,12px);color:var(--on-night-soft,#C8C2EA)}';
    var ICONE = '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M4 9v4h3l5 4V5L7 9z"/>';
    var ONDES = '<path d="M15 8.5a3.5 3.5 0 0 1 0 5M17.5 6a7 7 0 0 1 0 10"/></svg>';
    var BARRE = '<path d="M15 9l5 5M20 9l-5 5"/></svg>';

    function dessiner() {
      if (!bouton) return;
      var coupe = reglages.coupe;
      bouton.innerHTML = ICONE + (coupe ? BARRE : ONDES);
      bouton.setAttribute('aria-label', coupe ? 'Son coupé : ouvrir les réglages du son' : 'Son activé : ouvrir les réglages du son');
      bouton.title = coupe ? 'Son coupé' : 'Son activé';
      if (caseSon) caseSon.checked = !coupe;
      if (curseur) curseur.value = Math.round(reglages.volume * 100);
    }
    /* Le coin haut droit est libre presque partout. En partie, la barre du haut est pleine : le bouton se pose sur la carte. */
    function placer() {
      if (!zone) return;
      var carte = ecran === 'game' && doc.getElementById('map-wrap'), hote = carte || doc.getElementById('app');
      if (zone.parentNode !== hote) hote.appendChild(zone);
      zone.classList.toggle('son-bas', !!ECRAN_BAS[ecran]);
      zone.classList.toggle('son-lc', ecran === 'lcamp');   // à gauche de la pastille des actions
    }
    function fermerPanneau() {
      if (!panneau || panneau.hidden) return;
      panneau.hidden = true;
      bouton.setAttribute('aria-expanded', 'false');
    }
    /* Le panneau vit dans #app : la carte coupe ce qui dépasse. On le pose sous le bouton, dans la place disponible. */
    function poserPanneau() {
      if (panneau.hidden) return;
      var app = panneau.parentNode.getBoundingClientRect(), b = bouton.getBoundingClientRect(), marge = 8, haut = b.bottom - app.top + 6;
      panneau.style.top = haut + 'px';
      panneau.style.right = Math.max(marge, Math.min(app.right - b.right, app.width - panneau.offsetWidth - marge)) + 'px';
      panneau.style.maxHeight = Math.max(120, Math.min(420, app.height - haut - marge)) + 'px';
    }
    function basculerPanneau() {
      panneau.hidden = !panneau.hidden;
      poserPanneau();
      bouton.setAttribute('aria-expanded', panneau.hidden ? 'false' : 'true');
    }
    function installer() {
      if (enPanne || !doc || !doc.getElementById) return;   // sans Web Audio, pas de bouton : il ne ferait rien
      var hote = doc.getElementById('app');
      if (!hote || doc.querySelector('.son-zone')) return;
      var style = doc.createElement('style');
      style.textContent = STYLE;
      doc.head.appendChild(style);
      zone = doc.createElement('div');
      zone.className = 'son-zone';
      zone.innerHTML = '<button type="button" class="son-btn" aria-expanded="false"></button>' +
        '<div class="son-panneau" hidden>' +
          '<label>Son activé <input type="checkbox" class="son-case"></label>' +
          '<label>Volume <input type="range" class="son-volume" min="0" max="100" step="5" aria-label="Volume du son"></label>' +
          '<details><summary>Écouter chaque son</summary><div class="son-liste">' +
            SONS.concat(AMBIANCES).map(function (id) { return '<button type="button" data-son="' + id + '">' + NOMS[id] + '</button>'; }).join('') +
            '<button type="button" data-son="silence">Arrêter l\'ambiance</button>' +
          '</div><p class="son-note">Tous les sons sont créés par le jeu : rien à télécharger.</p></details>' +
        '</div>';
      hote.appendChild(zone);
      bouton = zone.querySelector('.son-btn');
      panneau = zone.querySelector('.son-panneau');
      hote.appendChild(panneau);
      caseSon = panneau.querySelector('.son-case');
      curseur = panneau.querySelector('.son-volume');
      bouton.addEventListener('click', basculerPanneau);
      caseSon.addEventListener('change', function () {
        couper(!caseSon.checked);
        if (caseSon.checked) jouer('clic');
      });
      curseur.addEventListener('input', function () { volume(curseur.value / 100); });
      curseur.addEventListener('change', function () { dernier.gain = null; jouer('gain'); });
      panneau.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-son]');
        if (!b) return;
        var id = b.getAttribute('data-son');
        if (AMBIANCES.indexOf(id) >= 0) ambiance(id);
        else if (id === 'silence') ambiance(null);
        else { dernier[id] = null; jouer(id); }
      });
      doc.addEventListener('click', function (e) { if (e.target && e.target.closest && !e.target.closest('.son-zone, .son-panneau')) fermerPanneau(); });
      doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerPanneau(); });
      if (doc.defaultView) doc.defaultView.addEventListener('resize', poserPanneau);
      dessiner();
    }
    try { installer(); } catch (e) { /* le jeu continue sans bouton */ }

    return { jouer: jouer, ambiance: ambiance, couper: couper, volume: volume, etat: etat, SONS: SONS, AMBIANCES: AMBIANCES, creer: creer };
  }

  var LOGIQUE = { creer: creer, sonDeModale: sonDeModale, sonDAction: sonDAction, ambianceVoulue: ambianceVoulue, lireReglages: lireReglages, SONS: SONS, AMBIANCES: AMBIANCES };
  if (typeof module !== 'undefined' && module.exports) { module.exports = LOGIQUE; return; }
  var stockage = null;
  try { stockage = root.localStorage; } catch (e) { /* lecture interdite : réglages de départ, non mémorisés */ }
  try {
    root.PolitikAudio = creer({ document: root.document, bus: root.PolitikBus, AudioContext: root.AudioContext || root.webkitAudioContext, stockage: stockage });
  } catch (e) { /* jamais de plantage à cause du son */ }
})(this);

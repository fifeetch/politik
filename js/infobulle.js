/* Politik — l'infobulle imbriquée (socle P1), à la façon des jeux Paradox.
   Un mot marqué ouvre une infobulle, qui peut contenir d'autres mots marqués : chacun ouvre une infobulle au-dessus de la précédente.

   Le contenu est une simple donnée, jamais du HTML (tout est échappé à l'affichage) :
     { titre: 'Déficit',                  obligatoire
       valeur: 0.4,                       facultatif : un nombre (affiché « +0,4 ») ou un texte (« 5,1 % »)
       ton: 'mauvais',                    facultatif : 'bon', 'mauvais' ou 'neutre' (la couleur de la valeur)
       sens: 'hausse-mauvaise',           facultatif : ou 'hausse-bonne' ; donne leur ton aux lignes chiffrées qui n'en ont pas
       texte: 'Pèse sur la [[dette|dette publique]].',   facultatif : [[id|mot]] ou [[id]] marque un mot
       lignes: [{ texte: 'Réforme des retraites', valeur: 0.3, ton: 'mauvais', renvoi: 'retraites' }],   renvoi : l'entrée ouverte par ce libellé
       renvois: ['dette', { id: 'pib', texte: 'Le PIB' }] }   facultatif : « Voir aussi », en bas

   API :
     PolitikInfobulle.definir(id, entree)   entree : la donnée, ou une fonction qui la renvoie à l'ouverture (valeurs à jour)
     PolitikInfobulle.definir({ id: entree, … })
     PolitikInfobulle.mot(id, libelle)      le HTML d'un mot marqué, à glisser dans n'importe quel innerHTML
                                            (pas à l'intérieur d'un autre bouton)
     PolitikInfobulle.ouvrir(idOuEntree, ancre)   ouvre depuis le code, fixée ; ancre : un élément (facultatif)
     PolitikInfobulle.fermer()              ferme l'infobulle du dessus
     PolitikInfobulle.fermerTout()

   Gestes :
     toucher    le mot ouvre l'infobulle, fixée. Toucher à côté ou ✕ ferme celle du dessus ; toucher celle du dessous revient à elle.
     souris     le survol ouvre ; on a le temps d'aller dans l'infobulle. Cliquer le mot, l'infobulle ou 📌 la fixe.
     clavier    Entrée ou Espace ouvre, le focus entre dans l'infobulle et y reste ; Échap ferme et rend le focus au mot.

   La partie logique (pile, placement, rendu HTML) ne touche pas à la page : test/check-infobulle.js la vérifie sous Node. */
(function (root) {
  var TONS = { bon: 1, mauvais: 1, neutre: 1 };

  /* ---------- Les données ---------- */
  var catalogue = {};
  function definir(id, entree) {
    if (id && typeof id === 'object') { Object.keys(id).forEach(function (k) { catalogue[k] = id[k]; }); return; }
    catalogue[id] = entree;
  }
  function existe(id) { return Object.prototype.hasOwnProperty.call(catalogue, id); }
  function trouver(id) {
    if (!existe(id)) return null;
    return typeof catalogue[id] === 'function' ? catalogue[id]() : catalogue[id];
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* 0.4 → « +0,4 », −0.1 → « −0,1 » (vrai signe moins), 0 → « 0,0 » */
  function signe(n, d) {
    d = d == null ? 1 : d;
    var a = Math.abs(n).toFixed(d), nul = Number(a) === 0;
    return (nul ? '' : n > 0 ? '+' : '−') + a.replace('.', ',');
  }
  function valeurTexte(v) { return v == null || v === '' ? '' : typeof v === 'number' ? signe(v) : String(v); }
  function tonDe(l, sens) {
    if (TONS[l.ton]) return l.ton;
    if (typeof l.valeur === 'number' && l.valeur !== 0 && sens) {
      if (sens === 'hausse-mauvaise') return l.valeur > 0 ? 'mauvais' : 'bon';
      if (sens === 'hausse-bonne') return l.valeur > 0 ? 'bon' : 'mauvais';
    }
    return 'neutre';
  }
  /* Une entrée complète, quelles que soient les clés fournies */
  function normaliser(e) {
    e = e || {};
    return {
      titre: e.titre == null ? '' : String(e.titre),
      valeur: valeurTexte(e.valeur),
      ton: tonDe(e, e.sens),
      texte: e.texte == null ? '' : String(e.texte),
      lignes: (e.lignes || []).map(function (l) {
        return { texte: l.texte == null ? '' : String(l.texte), valeur: valeurTexte(l.valeur), ton: tonDe(l, e.sens), renvoi: l.renvoi || null };
      }),
      renvois: (e.renvois || []).map(function (r) { return typeof r === 'string' ? { id: r, texte: null } : { id: r.id, texte: r.texte == null ? null : String(r.texte) }; })
    };
  }
  /* « a [[x|mot]] b » → [{ texte: 'a ' }, { id: 'x', texte: 'mot' }, { texte: ' b' }] ; [[x]] prend le titre de l'entrée x */
  function segments(s) {
    var out = [], re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push({ texte: s.slice(last, m.index) });
      out.push({ id: m[1], texte: m[2] == null ? null : m[2] });
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push({ texte: s.slice(last) });
    return out;
  }
  /* Les erreurs d'une entrée (titre manquant, renvoi vers une entrée inconnue) : pour les tests des lots suivants */
  function verifier(e, connu) {
    connu = connu || existe;
    var n = normaliser(e), err = [];
    if (!n.titre) err.push('titre manquant');
    function voir(id) { if (!connu(id)) err.push('renvoi inconnu : ' + id); }
    segments(n.texte).forEach(function (s) { if (s.id) voir(s.id); });
    n.lignes.forEach(function (l) { if (l.renvoi) voir(l.renvoi); segments(l.texte).forEach(function (s) { if (s.id) voir(s.id); }); });
    n.renvois.forEach(function (r) { voir(r.id); });
    return err;
  }

  /* ---------- Le rendu : du HTML, à partir de la donnée ---------- */
  function mot(id, libelle) {
    return '<button type="button" class="ib-mot" data-ib="' + esc(id) + '" aria-haspopup="dialog" aria-expanded="false">' + esc(libelle) + '</button>';
  }
  /* Un renvoi vers une entrée inconnue s'affiche en texte simple : jamais de mot qui n'ouvre rien */
  function motOuTexte(id, libelle) {
    if (!existe(id)) return esc(libelle == null ? '' : libelle);
    if (libelle != null) return mot(id, libelle);
    var e = normaliser(trouver(id));
    return mot(id, e.titre);
  }
  function enrichi(s) {
    return segments(s).map(function (p) { return p.id ? motOuTexte(p.id, p.texte) : esc(p.texte); }).join('');
  }
  function contenuHtml(entree, idTitre) {
    var n = normaliser(entree), h = '<div class="ib-tete"><h3 class="ib-titre"' + (idTitre ? ' id="' + esc(idTitre) + '"' : '') + '>' + esc(n.titre) + '</h3>';
    if (n.valeur) h += '<span class="ib-valeur ib-' + n.ton + '">' + esc(n.valeur) + '</span>';
    h += '</div>';
    if (n.texte) h += '<p class="ib-texte">' + enrichi(n.texte) + '</p>';
    if (n.lignes.length) {
      h += '<ul class="ib-lignes">' + n.lignes.map(function (l) {
        return '<li class="ib-ligne"><span class="ib-l-texte">' + (l.renvoi ? motOuTexte(l.renvoi, l.texte) : enrichi(l.texte)) + '</span>' +
          (l.valeur ? '<span class="ib-valeur ib-' + l.ton + '">' + esc(l.valeur) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    var liens = n.renvois.filter(function (r) { return existe(r.id); });
    if (liens.length) h += '<p class="ib-renvois">Voir aussi : ' + liens.map(function (r) { return motOuTexte(r.id, r.texte); }).join(', ') + '</p>';
    return h;
  }

  /* ---------- La pile : qui est ouvert, au-dessus de quoi ---------- */
  function creerPile(max) {
    max = max || 6;
    var items = [];
    return {
      items: items,
      taille: function () { return items.length; },
      indexDe: function (id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return i; return -1; },
      /* Ouvre item ({ id, mode, … }) au-dessus du niveau parent (−1 : depuis la page). Tout ce qui était au-dessus du parent se ferme.
         Une entrée déjà ouverte en dessous n'est pas rouverte : on revient à elle. Ainsi, A → B → A ne s'empile pas sans fin. */
      ouvrir: function (item, parent) {
        var dej = this.indexDe(item.id);
        if (dej >= 0 && dej <= parent) return { item: items[dej], niveau: dej, deja: true, retires: items.splice(dej + 1) };
        var retires = items.splice(parent + 1);
        if (items.length >= max) retires = items.splice(max - 1).concat(retires);
        items.push(item);
        return { item: item, niveau: items.length - 1, deja: false, retires: retires };
      },
      fermerDepuis: function (niveau) { return niveau < 0 || niveau >= items.length ? [] : items.splice(niveau); },
      /* Ferme ce qui n'est pas fixé au-dessus du niveau gardé (une infobulle fixée protège celles du dessous) */
      fermerSurvol: function (garde) {
        for (var i = Math.max(0, garde + 1); i < items.length; i++) if (items[i].mode === 'survol') return items.splice(i);
        return [];
      },
      fixer: function () { items.forEach(function (it) { it.mode = 'fixe'; }); },
      aDuFixe: function () { return items.some(function (it) { return it.mode === 'fixe'; }); }
    };
  }

  /* ---------- Le placement ----------
     ancre : { x, y, l, h } ou null ; taille : { l, h } ; cadre : { x, y, l, h } (la zone utilisable).
     Sous le mot si ça tient, sinon au-dessus, sinon collée au bord du côté le plus large. Jamais hors du cadre. */
  function placer(ancre, taille, cadre, ecart) {
    ecart = ecart == null ? 6 : ecart;
    function borne(v, min, max) { return Math.max(min, Math.min(max, v)); }
    var maxX = cadre.x + cadre.l - taille.l, maxY = cadre.y + cadre.h - taille.h;
    if (!ancre) return { x: borne(cadre.x + (cadre.l - taille.l) / 2, cadre.x, Math.max(cadre.x, maxX)), y: borne(cadre.y + (cadre.h - taille.h) / 2, cadre.y, Math.max(cadre.y, maxY)), cote: 'centre' };
    var x = borne(ancre.x + ancre.l / 2 - taille.l / 2, cadre.x, Math.max(cadre.x, maxX));
    var bas = cadre.y + cadre.h - (ancre.y + ancre.h) - ecart, haut = ancre.y - cadre.y - ecart;
    if (taille.h <= bas) return { x: x, y: borne(ancre.y + ancre.h + ecart, cadre.y, Math.max(cadre.y, maxY)), cote: 'bas' };
    if (taille.h <= haut) return { x: x, y: borne(ancre.y - ecart - taille.h, cadre.y, Math.max(cadre.y, maxY)), cote: 'haut' };
    return bas >= haut ? { x: x, y: Math.max(cadre.y, maxY), cote: 'bas' } : { x: x, y: cadre.y, cote: 'haut' };
  }

  var API = { definir: definir, existe: existe, mot: mot, signe: signe, normaliser: normaliser, segments: segments, verifier: verifier,
    contenuHtml: contenuHtml, creerPile: creerPile, placer: placer };

  /* ---------- Dans la page ---------- */
  if (typeof document !== 'undefined') (function () {
    var DELAI_OUVRE = 220, DELAI_FERME = 350, MARGE = 8;
    var Bus = root.PolitikBus, pile = creerPile(), calque = null, voile = null, compteur = 0, timerOuvre = null, timerFerme = null;

    function calqueDom() {
      if (calque) return calque;
      calque = document.createElement('div');
      calque.className = 'ib-calque';
      calque.hidden = true;
      voile = document.createElement('div');
      voile.className = 'ib-voile';
      voile.setAttribute('aria-hidden', 'true');
      calque.appendChild(voile);
      calque.addEventListener('click', clicCalque);
      (document.getElementById('app') || document.body).appendChild(calque);
      return calque;
    }
    function dire(nom, data) { if (Bus) Bus.emit(nom, data); }
    function niveauDe(node) {
      var b = node.closest && node.closest('.ib-bulle');
      if (!b) return -1;
      for (var i = 0; i < pile.items.length; i++) if (pile.items[i].el === b) return i;
      return -1;
    }
    function connecte(n) { return !!n && document.documentElement.contains(n); }

    function retirer(items, niveauBas) {
      items.forEach(function (it, k) {
        if (it.ancre && it.ancre.setAttribute) it.ancre.setAttribute('aria-expanded', 'false');
        if (it.el.parentNode) it.el.parentNode.removeChild(it.el);
        dire('ui:infobulle-close', { id: it.id, niveau: niveauBas + k });
      });
      miseAJour();
    }
    function miseAJour() {
      if (!calque) return;
      calque.hidden = pile.taille() === 0;
      voile.hidden = !pile.aDuFixe();
      pile.items.forEach(function (it) {
        var fixe = it.mode === 'fixe', x = it.el.querySelector('.ib-x');
        it.el.setAttribute('aria-modal', fixe ? 'true' : 'false');
        it.el.classList.toggle('ib-fixe', fixe);
        x.textContent = fixe ? '✕' : '📌';
        x.setAttribute('aria-label', fixe ? 'Fermer l’infobulle' : 'Fixer l’infobulle');
      });
    }
    function cadreDe() {
      var s = getComputedStyle(calque), r = calque.getBoundingClientRect();
      var pl = parseFloat(s.paddingLeft) || 0, pr = parseFloat(s.paddingRight) || 0, pt = parseFloat(s.paddingTop) || 0, pb = parseFloat(s.paddingBottom) || 0;
      return { x: pl + MARGE, y: pt + MARGE, l: r.width - pl - pr - 2 * MARGE, h: r.height - pt - pb - 2 * MARGE };
    }
    function positionner(it) {
      var r = calque.getBoundingClientRect(), a = null, cadre = cadreDe();
      if (connecte(it.ancre)) { var q = it.ancre.getBoundingClientRect(); a = { x: q.left - r.left, y: q.top - r.top, l: q.width, h: q.height }; }
      it.el.style.maxHeight = cadre.h + 'px';
      it.el.style.maxWidth = cadre.l + 'px';
      var b = it.el.getBoundingClientRect(), p = placer(a, { l: b.width, h: b.height }, cadre);
      it.el.style.left = Math.round(p.x) + 'px';
      it.el.style.top = Math.round(p.y) + 'px';
      it.el.setAttribute('data-cote', p.cote);
    }
    /* Le cœur : ouvre idOuEntree au-dessus de parent. Renvoie l'élément de la pile, ou null si l'entrée n'existe pas. */
    function ouvrirCouche(idOuEntree, ancre, parent, mode) {
      var obj = typeof idOuEntree === 'object' ? idOuEntree : null;
      var id = obj ? 'direct-' + (++compteur) : idOuEntree;
      var entree = obj || trouver(id);
      if (!entree) { if (typeof console !== 'undefined') console.warn('Infobulle inconnue :', id); return null; }
      calqueDom();
      var res = pile.ouvrir({ id: id, mode: mode, ancre: ancre, el: null }, parent);
      if (res.retires.length) retirer(res.retires, res.niveau + (res.deja ? 1 : 0));
      if (res.deja) return res.item;
      var it = res.item, idTitre = 'ib-t-' + (++compteur);
      it.el = document.createElement('div');
      it.el.className = 'ib-bulle';
      it.el.setAttribute('role', 'dialog');
      it.el.setAttribute('aria-labelledby', idTitre);
      it.el.tabIndex = -1;
      it.el.innerHTML = '<button type="button" class="ib-x"></button>' + contenuHtml(entree, idTitre);
      calque.appendChild(it.el);
      if (ancre && ancre.setAttribute) ancre.setAttribute('aria-expanded', 'true');
      miseAJour();
      positionner(it);
      dire('ui:infobulle-open', { id: id, niveau: res.niveau, mode: mode });
      return it;
    }
    function focusSur(it) { if (it && it.el) it.el.focus({ preventScroll: true }); }
    /* Ferme à partir d'un niveau. Le focus revient au mot qui avait ouvert la plus basse, si le joueur était dedans. */
    function fermerDepuis(niveau, sansFocus) {
      var items = pile.fermerDepuis(niveau);
      if (!items.length) return;
      var bas = items[0], rendre = !sansFocus && (bas.mode === 'fixe' || items.some(function (it) { return it.el.contains(document.activeElement); }));
      retirer(items, niveau);
      if (!rendre) return;
      if (connecte(bas.ancre)) bas.ancre.focus({ preventScroll: true });
      else focusSur(pile.items[pile.taille() - 1]);
    }
    function fermerHaut() { fermerDepuis(pile.taille() - 1); }
    function fermerTout() { annulerTimers(); fermerDepuis(0, true); }
    function fixerTout() { annulerTimers(); pile.fixer(); miseAJour(); focusSur(pile.items[pile.taille() - 1]); }
    function annulerTimers() { clearTimeout(timerOuvre); clearTimeout(timerFerme); timerOuvre = timerFerme = null; }

    function clicCalque(ev) {
      if (ev.target === voile) { fermerHaut(); return; }
      var niveau = niveauDe(ev.target);
      if (niveau < 0) return;
      var it = pile.items[niveau];
      if (ev.target.closest('.ib-x')) { if (it.mode === 'fixe') fermerDepuis(niveau); else fixerTout(); return; }
      if (it.mode !== 'fixe') fixerTout();
      else if (niveau < pile.taille() - 1) { fermerDepuis(niveau + 1, true); focusSur(it); }
    }
    /* En capture : un mot marqué ne déclenche jamais l'action de ce qui l'entoure */
    document.addEventListener('click', function (ev) {
      var m = ev.target.closest && ev.target.closest('[data-ib]');
      if (!m) {
        if (pile.taille() && !(calque && calque.contains(ev.target))) { var g = pile.fermerSurvol(-1); if (g.length) retirer(g, pile.taille()); }
        return;
      }
      ev.preventDefault(); ev.stopPropagation();
      annulerTimers();
      var parent = niveauDe(m), id = m.getAttribute('data-ib'), dej = pile.indexDe(id);
      if (dej > parent && pile.items[dej].ancre === m) {
        // déjà ouverte par ce mot : au survol on la fixe, fixée on la referme
        if (pile.items[dej].mode === 'fixe') fermerDepuis(dej); else fixerTout();
        return;
      }
      var it = ouvrirCouche(id, m, parent, 'fixe');
      if (it) fixerTout();
    }, true);

    /* ---------- Souris : on survole, on a le temps de rejoindre l'infobulle ---------- */
    document.addEventListener('pointerover', function (ev) {
      if (ev.pointerType !== 'mouse' || !ev.target.closest) return;
      var m = ev.target.closest('[data-ib]'), niveau = niveauDe(ev.target), garde = niveau;
      clearTimeout(timerOuvre); timerOuvre = null;
      if (m) {
        var id = m.getAttribute('data-ib'), dej = pile.indexDe(id);
        if (dej > niveau && pile.items[dej].ancre === m) garde = dej;
        else if (!pile.items[dej] || dej > niveau) timerOuvre = setTimeout(function () { if (connecte(m)) ouvrirCouche(id, m, niveauDe(m), 'survol'); }, DELAI_OUVRE);
      }
      clearTimeout(timerFerme); timerFerme = null;
      var aFermer = pile.items.some(function (it, i) { return i > garde && it.mode === 'survol'; });
      if (aFermer) timerFerme = setTimeout(function () {
        var bas = -1;
        pile.items.some(function (it, i) { if (i > garde && it.mode === 'survol') { bas = i; return true; } return false; });
        var g = pile.fermerSurvol(garde);
        if (g.length) retirer(g, bas);
      }, DELAI_FERME);
    });

    /* ---------- Clavier ---------- */
    document.addEventListener('keydown', function (ev) {
      if (!pile.taille()) return;
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); annulerTimers(); fermerHaut(); return; }
      if (ev.key !== 'Tab') return;
      var haut = pile.items[pile.taille() - 1];
      if (haut.mode !== 'fixe') return;
      // le focus reste dans l'infobulle du dessus
      var liste = haut.el.querySelectorAll('button, a[href]');
      if (!liste.length) return;
      var prem = liste[0], dern = liste[liste.length - 1], act = document.activeElement;
      if (!haut.el.contains(act) || act === haut.el) { ev.preventDefault(); (ev.shiftKey ? dern : prem).focus(); }
      else if (ev.shiftKey && act === prem) { ev.preventDefault(); dern.focus(); }
      else if (!ev.shiftKey && act === dern) { ev.preventDefault(); prem.focus(); }
    }, true);

    window.addEventListener('resize', function () { pile.items.forEach(positionner); });
    /* Le décor change sous l'infobulle : on la ferme */
    if (Bus) ['nav:go', 'ui:modal-open', 'ui:modal-close'].forEach(function (n) { Bus.on(n, fermerTout); });

    API.ouvrir = function (idOuEntree, ancre) {
      var it = ouvrirCouche(idOuEntree, ancre || null, pile.taille() - 1, 'fixe');
      if (it) fixerTout();
      return !!it;
    };
    API.fermer = fermerHaut;
    API.fermerTout = fermerTout;
  })();

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.PolitikInfobulle = API;
})(this);

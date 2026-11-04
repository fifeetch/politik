/* Politik — Lulu explique chaque écran, une seule fois : la première fois qu'on y entre.
   Elle reste muette ensuite, et se tait entièrement si le joueur l'a coupée. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var CLE = 'politik_lulu_ecrans', OFF = 'politik-lulu-off';
  var ECRANS = {
    setup: 'Ici tu règles ta partie : sa durée, et d’où partent les scores. Dans le doute, garde les réglages proposés.',
    choose: 'Choisis ton parti, puis ton candidat parmi ses personnalités. Ton propre personnage est une option, avec « Jouer mon personnage ».',
    programme: 'Ton programme : 5 promesses, et de quoi les financer. Touche « Programme conseillé » si tu veux aller vite.',
    game: 'Chaque tour, tu joues 3 actions : choisis une région sur la carte, puis une action. Quand c’est prêt, tu valides.',
    between: 'Le second tour se joue ici : négocie avec les éliminés pour récupérer leurs électeurs, puis va voter.',
    lcamp: 'Campagne des législatives : choisis où faire campagne. Il te faut 289 députés pour gouverner tranquille.',
    lbtw: 'Entre les deux tours des législatives : passe des accords pour ne pas diviser ton camp.',
    gform: 'Nomme ton gouvernement, poste par poste. Un allié sans ministère peut quitter ta majorité.',
    gov: 'Ton mandat dure 5 ans. Chaque année : une loi, l’actualité, le budget, puis le bilan. Surveille le déficit, ta popularité et ta majorité.',
    oppo: 'Tu es dans l’opposition : harcèle le pouvoir jusqu’à la prochaine échéance.'
  };
  function aDire(nom, vus, coupe) { return !coupe && ECRANS[nom] && !vus[nom] ? ECRANS[nom] : null; }
  var API = { ECRANS: ECRANS, aDire: aDire };
  if (node) { module.exports = API; return; }

  var doc = root.document, Bus = root.PolitikBus, A = null, boite = null;
  function lire(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } }
  function vus() { try { return JSON.parse(lire(CLE) || '{}') || {}; } catch (e) { return {}; } }
  function noter(nom) { var v = vus(); v[nom] = 1; try { root.localStorage.setItem(CLE, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  function fermer() { if (boite) { boite.parentNode.removeChild(boite); boite = null; } }
  function dire(nom) {
    fermer();
    var txt = aDire(nom, vus(), lire(OFF) === '1'); if (!txt) return;
    noter(nom);
    A = root.PolitikArt || root.ART || A;
    boite = doc.createElement('div'); boite.className = 'lulu-ecran'; boite.setAttribute('role', 'status');
    boite.innerHTML = '<span class="adv-face">' + (A && A.advisor ? A.advisor() : '') + '</span><p></p><button type="button" class="adv-close" aria-label="Fermer">✕</button>';
    boite.querySelector('p').textContent = txt;
    boite.querySelector('button').addEventListener('click', fermer);
    (doc.getElementById('app') || doc.body).appendChild(boite);
  }
  if (Bus) { Bus.on('nav:go', function (e) { dire(e && e.name); }); Bus.on('ui:modal-open', fermer); }
})(this);

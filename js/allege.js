/* Politik — moins de texte à l'écran : le nom et le chiffre restent, le détail s'ouvre en infobulle.
   Une seule règle pour tout le jeu, appliquée à ce qui s'affiche :
   - une aide (.hint, « Le saviez-vous ? ») quitte l'écran et s'ouvre depuis le titre le plus proche ;
   - dans un choix, ce qui est court ou chiffré reste, le reste s'ouvre depuis le nom du choix ;
   - un long paragraphe de fenêtre, ou un long conseil de Lulu, garde sa première phrase.
   Rien n'est perdu : tout le texte reste lisible dans l'infobulle. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var COURT = 34, CHIFFRE = 60, PHRASE = 120;

  /* Ce qui reste visible dans un choix : court, ou un chiffre pas trop long */
  function garder(txt) {
    var t = String(txt || '').trim();
    return t.length <= COURT || (t.length <= CHIFFRE && /\d/.test(t));
  }
  /* « Une phrase. La suite. » → ['Une phrase.', 'La suite.'] ; un seul morceau si la première phrase est déjà trop longue */
  function couper(txt) {
    var t = String(txt || '').replace(/\s+/g, ' ').trim();
    if (t.length <= PHRASE) return [t, ''];
    var m = /^(.{20,}?[.!?…»])\s+(?=[A-ZÀ-ÖØ-Þ«0-9])/.exec(t);
    if (!m || m[1].length > PHRASE) return [t, ''];
    return [m[1], t.slice(m[0].length)];
  }

  var API = { garder: garder, couper: couper };
  if (node) { module.exports = API; return; }
  root.PolitikAllege = API;

  var doc = root.document, IB = root.PolitikInfobulle, compte = 0;
  if (!doc || !IB) return;
  function texte(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  var fiches = {};
  function nouvelle(entree) { var id = 'al-' + (++compte % 800); IB.definir(id, entree); fiches[id] = entree; return id; }
  function fiche(el) { return el && fiches[el.getAttribute('data-ib')]; }
  /* Le mot marqué est un enfant : le titre ou le nom gardent leur police */
  function marque(el, id) {
    var m = doc.createElement('span');
    while (el.firstChild) m.appendChild(el.firstChild);
    el.appendChild(m);
    m.classList.add('ib-mot', 'al-mot'); m.setAttribute('data-ib', id);
    m.setAttribute('role', 'button'); m.setAttribute('tabindex', '0');
  }
  function ligne(t) { return { texte: t }; }

  /* ---------- La fenêtre : tout ce qui est retiré s'ouvre depuis son titre ---------- */
  function fenetre() {
    var body = doc.getElementById('modal-body'), titre = doc.getElementById('modal-title');
    if (!body || !titre) return;
    var ajout = [];
    Array.prototype.forEach.call(body.querySelectorAll('.hint:not([id]), .learn-inline'), function (el) {
      if (el.closest('details') || !texte(el)) return;
      if (el.classList.contains('learn-inline')) {
        var b = el.querySelector('b'), p = el.querySelector('p'), s = el.querySelector('.src');
        if (b) ajout.push(b.textContent);
        if (p) ajout.push(p.textContent);
        if (s) ajout.push(texte(s));
      } else ajout.push(texte(el));
      el.parentNode.removeChild(el);
    });
    Array.prototype.forEach.call(body.children, function (el) {
      if (el.tagName !== 'P' || el.querySelector('a, button, input, [data-ib]')) return;
      var c = couper(el.textContent);
      if (c[1]) { el.textContent = c[0]; ajout.push(c[1]); }
    });
    if (!ajout.length) return;
    var porte = fiche(titre.querySelector('.al-mot'));
    if (porte) { porte.lignes = porte.lignes.concat(ajout.map(ligne)); return; }
    var nom = texte(titre), s = doc.createElement('span'); s.textContent = nom;
    marque(s, nouvelle({ titre: nom, lignes: ajout.map(ligne) }));
    titre.textContent = ''; titre.appendChild(s);
  }

  /* ---------- Les choix : le nom ouvre ce qui ne tient pas ---------- */
  function choix(zone) {
    Array.prototype.forEach.call(zone.querySelectorAll('.pick-row:not([data-al]), .ans:not([data-al])'), function (rang) {
      rang.setAttribute('data-al', '1');
      if (rang.classList.contains('off')) return;   // la raison d'un refus reste écrite
      var nom = rang.querySelector('.pick-txt > b, .ans-h > b'); if (!nom) return;
      var part = [];
      Array.prototype.forEach.call(rang.querySelectorAll('.pick-txt > small, .pick-txt > span:not([class]), .ans-who, .ans-n, .ans-c'), function (el) {
        var t = texte(el);
        if (!t || (!el.matches('.ans-who, .ans-n, .ans-c, .al-detail') && garder(t))) return;
        part.push(t); el.parentNode.removeChild(el);
      });
      if (part.length) marque(nom, nouvelle({ titre: texte(nom), lignes: part.map(ligne) }));
    });
  }

  /* ---------- Les écrans : une aide s'ouvre depuis le titre qui la précède ---------- */
  function titreAvant(el) {
    for (var n = el.previousElementSibling; n; n = n.previousElementSibling) {
      if (/^(H1|H2|H3|H4)$/.test(n.tagName) || n.classList.contains('kicker')) return n;
      var dedans = n.querySelector && n.querySelector('h1, h2, h3, h4, .kicker');
      if (dedans) return dedans;
    }
    var p = el.parentElement;
    return p && p.id !== 'app' && !p.classList.contains('screen') ? titreAvant(p) : (p ? p.querySelector('h1, h2, .kicker') : null);
  }
  function aides(zone) {
    Array.prototype.forEach.call(zone.querySelectorAll('.hint:not([id]), .sw-hint'), function (el) {
      if (el.closest('#modal, details') || !texte(el)) return;
      var t = titreAvant(el), txt = texte(el), f = t && (t.hasAttribute('data-ib') ? fiche(t) : fiche(t.querySelector('.al-mot')));
      if (f) { f.lignes.push(ligne(txt)); el.parentNode.removeChild(el); return; }
      if (!t || t.querySelector('[data-ib]') || t.hasAttribute('data-ib')) {
        var s = doc.createElement('span'); s.textContent = 'Comment ça marche';
        marque(s, nouvelle({ titre: 'Comment ça marche', lignes: [ligne(txt)] }));
        el.textContent = ''; el.appendChild(s);
        el.classList.remove('hint'); el.classList.add('al-aide');
        return;
      }
      marque(t, nouvelle({ titre: texte(t), lignes: [ligne(txt)] }));
      el.parentNode.removeChild(el);
    });
  }

  /* ---------- Lulu : la première phrase, le reste s'ouvre sur son nom ---------- */
  function lulu(zone) {
    Array.prototype.forEach.call(zone.querySelectorAll('.advisor p'), function (p) {
      var b = p.querySelector('b'), porte = p.querySelector('.adv-txt'); if (!b) return;
      var tout = porte ? texte(porte) : texte(p).replace(texte(b), '').trim(), c = couper(tout);
      if (!c[1]) return;
      if (porte) porte.textContent = c[0];
      else { Array.prototype.slice.call(p.childNodes).forEach(function (n) { if (n !== b) p.removeChild(n); }); p.appendChild(doc.createTextNode(' ' + c[0])); }
      marque(b, nouvelle({ titre: 'Lulu', lignes: [ligne(tout)] }));
    });
  }

  function passe() {
    var app = doc.getElementById('app') || doc.body;
    observe.disconnect();
    try { fenetre(); choix(app); aides(app); lulu(app); } finally { observe.observe(app, { childList: true, subtree: true, characterData: false }); }
  }
  var attente = false, observe = new root.MutationObserver(function () {
    if (attente) return; attente = true;
    (root.requestAnimationFrame || root.setTimeout)(function () { attente = false; passe(); });
  });
  doc.addEventListener('keydown', function (ev) {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('al-mot')) { ev.preventDefault(); ev.target.click(); }
  });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', passe); else passe();
})(this);

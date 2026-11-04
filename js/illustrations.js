/* Politik — les illustrations dessinées des événements (assets/scenes/<id>.jpg).
   L'image se pose sur le dessin du jeu : si elle manque ou ne charge pas (hors ligne), le dessin reste visible. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var IDS = ['aeriens', 'bleus', 'canicule', 'cheminots', 'cour', 'cyclone', 'eboueurs', 'edf', 'emeutes', 'evenement', 'fermeture', 'fuite', 'generale', 'gilets',
    'infirmieres', 'innovation', 'inondations', 'lobbies', 'marches', 'medicaments', 'ministre', 'panne', 'policiers', 'profs', 'raffineries', 'sommet', 'tracteurs'];
  function a(id) { return IDS.indexOf(id) >= 0; }
  /* Le html de l'image à poser dans un cadre .illu-pic, ou rien si cet id n'a pas d'illustration */
  function img(id) { return a(id) ? '<img class="illu" src="assets/scenes/' + id + '.jpg" alt="" width="1200" height="675" draggable="false">' : ''; }
  var API = { IDS: IDS, a: a, img: img };
  if (node) { module.exports = API; return; }
  root.PolitikIllu = API;
  /* En cas d'échec, ou si le service worker a servi son aplat de repli, on retire l'image et le dessin réapparaît */
  function retirer(el) { if (el.parentNode) el.parentNode.removeChild(el); }
  function estIllu(el) { return el && el.classList && el.classList.contains('illu'); }
  root.document.addEventListener('error', function (e) { if (estIllu(e.target)) retirer(e.target); }, true);
  root.document.addEventListener('load', function (e) { if (estIllu(e.target) && e.target.naturalWidth !== Number(e.target.getAttribute('width'))) retirer(e.target); }, true);
})(this);

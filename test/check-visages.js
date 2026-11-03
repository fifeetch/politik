/* Vérifie les visages dessinés : chaque pastille de peau de l'éditeur donne sa propre teinte, celle de la pastille,
   et les 60 personnalités validées ne bougent pas. Usage : node test/check-visages.js */
var assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
var ROOT = path.join(__dirname, '..');
var bac = {};
vm.createContext(bac);
['js/bd-personnages.js', 'js/bd-visages.js'].forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), bac, { filename: f }); });
var P = bac.Perso, V = bac.Visages, SKINS = require('../js/art.js').SKINS;

/* ---------- Les pastilles de peau ---------- */
var vues = {};
SKINS.forEach(function (couleur, i) {
  var F = P.FICHE[V.depuisVisage({ skin: i, hair: 'court', tenue: 'veste' })];
  assert.strictEqual(F.peau, couleur, 'la pastille ' + i + ' dessine la couleur de la pastille');
  assert.ok(F.peauO && F.peauO !== F.peau, 'la pastille ' + i + ' a son ombre');
  vues[F.peau] = 1;
  // la teinte arrive bien dans le dessin
  assert.ok(P.buste(V.depuisVisage({ skin: i, hair: 'court', tenue: 'veste' }), 'neutre').indexOf('fill="' + couleur + '"') >= 0, 'la pastille ' + i + ' colore le visage');
});
assert.strictEqual(Object.keys(vues).length, SKINS.length, 'autant de teintes que de pastilles');

/* ---------- Les 60 personnalités : même dessin, à l'identique ---------- */
function empreinte(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483647; return h; }
var noms = Object.keys(V.NOMS).map(function (n) { return V.NOMS[n]; }).sort(), tout = noms.map(function (n) { return n + ':' + P.buste(n, 'neutre').replace(/oe\d+/g, 'oe'); }).join('|');
assert.strictEqual(noms.length, 60, 'les 60 personnalités');
assert.strictEqual(empreinte(tout), 1808212701, 'le dessin des personnalités validées a changé');

console.log('Visages (' + SKINS.length + ' teintes, ' + noms.length + ' personnalités) : OK');

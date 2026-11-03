/* La joute d'entre-deux-tours : les ripostes forment un cycle, et le gagnant de l'échange prend l'avantage. */
var assert = require('assert'), D = require('../js/data.js'), E = require('../js/engine.js');
var cles = Object.keys(D.PIQUES);
assert.strictEqual(cles.length, 3);
cles.forEach(function (k) {
  assert.ok(D.PIQUES[D.PIQUES[k].bat], k + ' bat une riposte connue');
  assert.ok(D.PIQUES[k].lignes.length >= 2, k + ' a plusieurs répliques');
  assert.strictEqual(E.piqueOutcome(k, D.PIQUES[k].bat), 'a');
  assert.strictEqual(E.piqueOutcome(D.PIQUES[k].bat, k), 'b');
  assert.strictEqual(E.piqueOutcome(k, k), null);
});
assert.ok(D.RELANCES.length >= 4);
assert.strictEqual(E.piqueBonus(4, 6), 1.5);
function duel(pa, pb) {
  var g = E.createGame('VP', { seed: 7 });
  g.between = { a: 'VP', b: 'MN', log: [] };
  var fc = E.setupFace(g);
  return E.resolveFace(g, fc.duels.map(function () { return { ra: 'emotion', rb: 'emotion', pa: pa, pb: pb }; }));
}
var nul = duel(null, null), moi = duel('bilan', 'couper'), lui = duel('couper', 'bilan');
assert.ok(moi.sa > nul.sa, 'gagner la riposte ajoute des points');
assert.strictEqual(moi.sb, nul.sb, 'le perdant de la riposte ne perd pas ses points');
assert.ok(lui.sb > nul.sb, 'symétrique pour l\'adversaire');
assert.ok(moi.swing > nul.swing && lui.swing < nul.swing, 'la riposte déplace des électeurs');
var ra = E.faceRiposte(E.createGame('VP', { seed: 7 })); assert.ok(D.PIQUES[ra]);
console.log('Joute : OK');

/* Moins de texte : la règle de ce qui reste à l'écran. */
var assert = require('assert'), A = require('../js/allege.js');
assert.ok(A.garder('Ne coûte rien'), 'un texte court reste');
assert.ok(A.garder('déficit +0,03 pt, une seule année · +7'), 'un chiffre pas trop long reste');
assert.ok(!A.garder('Gagne des électeurs dans toute la France, dans les classes sociales que ta réponse touche, et plus encore'), 'un long texte part');
assert.ok(!A.garder('Touche une région pour voir le calcul de cette action là-bas'), 'une phrase sans chiffre part');
assert.deepStrictEqual(A.couper('Court.'), ['Court.', '']);
var c = A.couper('Une première phrase assez courte. ' + new Array(30).join('Puis une suite bien plus longue. '));
assert.strictEqual(c[0], 'Une première phrase assez courte.'); assert.ok(c[1].length > 100);
var l = new Array(200).join('a'); assert.deepStrictEqual(A.couper(l), [l, ''], 'sans phrase coupable, on garde tout');
console.log('Moins de texte : OK');

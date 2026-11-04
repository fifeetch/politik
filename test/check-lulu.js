/* Lulu présente chaque écran une fois, et se tait si on l'a coupée. */
var assert = require('assert'), fs = require('fs'), L = require('../js/lulu-ecrans.js');
var html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
Object.keys(L.ECRANS).forEach(function (n) { assert.ok(html.indexOf('id="screen-' + n + '"') >= 0, n + ' est un écran du jeu'); assert.ok(L.ECRANS[n].length <= 170, n + ' : explication courte'); });
assert.ok(L.aDire('game', {}, false), 'première entrée : Lulu explique');
assert.strictEqual(L.aDire('game', { game: 1 }, false), null, 'deuxième entrée : elle se tait');
assert.strictEqual(L.aDire('game', {}, true), null, 'coupée : elle se tait');
assert.strictEqual(L.aDire('title', {}, false), null, 'pas d\'explication sur l\'accueil');
console.log('Lulu, écrans : OK');

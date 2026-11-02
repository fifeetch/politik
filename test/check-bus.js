/* Vérifie le bus d'événements, et que les moteurs n'en dépendent pas. Usage : node test/check-bus.js */
var assert = require('assert'), fs = require('fs');
var Bus = require('../js/bus.js');

var vus = [];
function a(x) { vus.push('a' + x); }
function b(x) { vus.push('b' + x); }

// on / emit : dans l'ordre d'abonnement, avec les données
Bus.on('t', a); Bus.on('t', b);
assert.strictEqual(Bus.emit('t', 1), 2);
assert.deepStrictEqual(vus, ['a1', 'b1']);

// off
vus = []; Bus.off('t', a); Bus.emit('t', 2);
assert.deepStrictEqual(vus, ['b2']);
Bus.off('t', a);   // déjà désabonné : sans effet
vus = []; Bus.off('t'); assert.strictEqual(Bus.emit('t', 3), 0);
assert.deepStrictEqual(vus, []);

// on renvoie de quoi se désabonner
var stop = Bus.on('u', a); vus = []; stop(); Bus.emit('u', 4);
assert.deepStrictEqual(vus, []);

// un événement sans abonné ne fait rien
assert.strictEqual(Bus.emit('personne'), 0);

// se désabonner pendant l'envoi ne saute pas le suivant
vus = [];
function une() { vus.push('une'); Bus.off('v', une); }
Bus.on('v', une); Bus.on('v', b); Bus.emit('v', 5);
assert.deepStrictEqual(vus, ['une', 'b5']);
vus = []; Bus.emit('v', 6);
assert.deepStrictEqual(vus, ['b6']);
Bus.off('v');

// un abonné qui plante n'arrête pas les autres
var err = console.error; console.error = function () {};
vus = []; Bus.on('w', function () { throw new Error('boum'); }); Bus.on('w', b);
assert.doesNotThrow(function () { Bus.emit('w', 7); });
console.error = err;
assert.deepStrictEqual(vus, ['b7']);
Bus.off('w');

// les noms hérités des objets ne sont pas des événements
assert.strictEqual(Bus.emit('constructor'), 0);
assert.strictEqual(Bus.emit('__proto__'), 0);

// les moteurs testés sous Node ne dépendent pas du bus
['engine.js', 'govern.js'].forEach(function (f) {
  assert.ok(!/PolitikBus|bus\.js/.test(fs.readFileSync(__dirname + '/../js/' + f, 'utf8')), f + ' ne doit pas dépendre du bus');
});
// le bus ne touche pas à la page
assert.ok(!/\bdocument\b|\bwindow\b/.test(fs.readFileSync(__dirname + '/../js/bus.js', 'utf8')), 'bus.js ne doit pas toucher au DOM');

// les points d'émission promis sont bien là
var ui = fs.readFileSync(__dirname + '/../js/ui.js', 'utf8');
['nav:go', 'ui:modal-open', 'ui:modal-close', 'ui:toast'].forEach(function (n) {
  assert.ok(ui.indexOf("Bus.emit('" + n + "'") >= 0, 'ui.js doit émettre ' + n);
});

console.log('Bus d\'événements : OK');

/* Chaque événement du mandat et chaque grève a son illustration, légère, et tout fichier annoncé existe. */
var assert = require('assert'), fs = require('fs'), path = require('path'), I = require('../js/illustrations.js');
var dir = path.join(__dirname, '..', 'assets', 'scenes');
I.IDS.forEach(function (id) {
  var f = path.join(dir, id + '.jpg');
  assert.ok(fs.existsSync(f), id + ' : fichier absent');
  assert.ok(fs.statSync(f).size < 600 * 1024, id + ' : image trop lourde pour un téléphone');
});
assert.strictEqual(fs.readdirSync(dir).length, I.IDS.length, 'aucun fichier hors de la liste');
var src = fs.readFileSync(path.join(__dirname, '..', 'js', 'govern.js'), 'utf8');
var bloc = src.slice(src.indexOf("{ id: 'canicule'"), src.indexOf("nom: 'La colère des policiers'") + 40);
var ids = (bloc.match(/\{ id: '([a-z_]+)', scene:/g) || []).map(function (m) { return m.split("'")[1]; });
var greves = (bloc.match(/([a-z]+): \{ nom: '/g) || []).map(function (m) { return m.split(':')[0]; });
assert.ok(ids.length >= 22 && greves.length >= 8, 'événements et grèves retrouvés');
ids.concat(greves).forEach(function (id) { assert.ok(I.a(id), id + ' : pas d\'illustration'); });
assert.strictEqual(I.img('inconnu'), '', 'un id inconnu ne donne pas d\'image');
assert.ok(I.img('canicule').indexOf('assets/scenes/canicule.jpg') > 0);
Object.keys(I.JOURNAL).forEach(function (k) { assert.ok(I.a(I.JOURNAL[k]), k + ' : illustration du journal inconnue'); });
assert.strictEqual(I.duJournal('inconnue'), '', 'une scène sans illustration garde son dessin');
console.log('Illustrations : OK');

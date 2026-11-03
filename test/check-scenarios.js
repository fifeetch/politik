/* Les événements du mandat : chacun a une image dessinée qui existe, et des choix valides. */
var assert = require('assert'), fs = require('fs'), D = require('../js/data.js'), E = require('../js/engine.js'), G = require('../js/govern.js');
var src = fs.readFileSync(__dirname + '/../js/bd-jeu.js', 'utf8');
var SEG = D.SEGMENTS.map(function (x) { return x.id; }), vus = {};
assert.ok(G.EVENTS.length >= 8);
G.EVENTS.forEach(function (ev) {
  assert.ok(!vus[ev.id], ev.id + ' est unique'); vus[ev.id] = true;
  assert.ok(ev.scene, ev.id + ' a une scène');
  assert.ok(new RegExp('\\b' + ev.scene + ': function').test(src), ev.id + ' : la scène ' + ev.scene + ' existe');
  assert.ok(ev.title && ev.text && ev.opts.length >= 1, ev.id + ' a un titre, un texte et des choix');
  ev.opts.forEach(function (o) {
    assert.ok(o.label, ev.id + ' : choix nommé');
    Object.keys(o.sat || {}).forEach(function (k) { assert.ok(SEG.indexOf(k) >= 0, ev.id + ' : groupe connu ' + k); });
  });
});
var CD = require('../js/cards.js');
CD.CARDS.concat(Object.keys(CD.FOLLOW || {}).map(function (k) { return CD.FOLLOW[k]; })).forEach(function (c) {
  var n = CD.sceneOf(c);
  assert.ok(new RegExp('\\b' + n + ': function').test(src), (c.id || c.who) + ' : la scène ' + n + ' existe');
});
console.log('Scénarios (' + G.EVENTS.length + ' événements, ' + CD.CARDS.length + ' cartes) : OK');

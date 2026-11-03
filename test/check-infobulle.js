/* Vérifie la logique de l'infobulle (données, rendu, pile, placement). Usage : node test/check-infobulle.js */
var assert = require('assert');
var IB = require('../js/infobulle.js');

// Le signe : vrai signe moins, virgule, pas de signe sur zéro
assert.strictEqual(IB.signe(0.4), '+0,4');
assert.strictEqual(IB.signe(-0.1), '−0,1');
assert.strictEqual(IB.signe(0), '0,0');
assert.strictEqual(IB.signe(-0.01), '0,0');
assert.strictEqual(IB.signe(2, 0), '+2');

// L'exemple du futur moteur économique : « Déficit +0,4 : réforme des retraites +0,3 ; ralentissement de la croissance +0,2 ; économies de ministères −0,1 »
IB.definir('retraites', { titre: 'Réforme des retraites', texte: 'Elle pèse sur le [[deficit|déficit]].' });
var deficit = { titre: 'Déficit', valeur: 0.4, sens: 'hausse-mauvaise', lignes: [
  { texte: 'Réforme des retraites', valeur: 0.3, renvoi: 'retraites' },
  { texte: 'Ralentissement de la croissance', valeur: 0.2 },
  { texte: 'Économies de ministères', valeur: -0.1 }
] };
IB.definir('deficit', deficit);
var n = IB.normaliser(deficit);
assert.strictEqual(n.valeur, '+0,4');
assert.deepStrictEqual(n.lignes.map(function (l) { return [l.valeur, l.ton]; }), [['+0,3', 'mauvais'], ['+0,2', 'mauvais'], ['−0,1', 'bon']]);
var html = IB.contenuHtml(deficit, 'titre-1');
assert.ok(html.indexOf('id="titre-1"') >= 0);
assert.ok(html.indexOf('data-ib="retraites"') >= 0, 'la ligne avec renvoi est un mot marqué');
assert.ok(html.indexOf('+0,4') >= 0 && html.indexOf('−0,1') >= 0);

// Ton : explicite d'abord, hausse-bonne, neutre sinon
assert.strictEqual(IB.normaliser({ lignes: [{ valeur: 1, ton: 'bon' }], sens: 'hausse-mauvaise' }).lignes[0].ton, 'bon');
assert.strictEqual(IB.normaliser({ lignes: [{ valeur: 1 }], sens: 'hausse-bonne' }).lignes[0].ton, 'bon');
assert.strictEqual(IB.normaliser({ lignes: [{ valeur: '5 %' }], sens: 'hausse-bonne' }).lignes[0].ton, 'neutre');
assert.strictEqual(IB.normaliser({ ton: 'rouge' }).ton, 'neutre');
assert.strictEqual(IB.normaliser(null).titre, '');

// Mots marqués dans le texte
assert.deepStrictEqual(IB.segments('a [[x|mot]] b [[y]]'), [{ texte: 'a ' }, { id: 'x', texte: 'mot' }, { texte: ' b ' }, { id: 'y', texte: null }]);
assert.deepStrictEqual(IB.segments('rien'), [{ texte: 'rien' }]);
assert.deepStrictEqual(IB.segments(''), []);
assert.ok(IB.contenuHtml({ titre: 't', texte: 'la [[deficit]]' }).indexOf('>Déficit</button>') >= 0, '[[id]] prend le titre de l\'entrée');

// Une entrée peut être une fonction, lue à l'ouverture
var compteur = 0;
IB.definir({ vive: function () { compteur++; return { titre: 'Vive ' + compteur }; } });
assert.ok(IB.contenuHtml({ titre: 't', texte: '[[vive]]' }).indexOf('Vive 1') >= 0);

// Tout est échappé : le contenu ne peut pas injecter de HTML
var mechant = { titre: '<img onerror=x>', valeur: '"><b>', texte: '<script>[[deficit|<i>]]', lignes: [{ texte: '<u>', valeur: '<s>' }] };
var h2 = IB.contenuHtml(mechant);
assert.ok(!/<img|<script|<i>|<u>|<s>|"><b>/.test(h2), h2);
assert.ok(IB.mot('a"b', '<x>').indexOf('data-ib="a&quot;b"') >= 0 && IB.mot('a', '<x>').indexOf('&lt;x&gt;') >= 0);

// Un renvoi vers une entrée inconnue reste du texte
var h3 = IB.contenuHtml({ titre: 't', texte: '[[nulle|mot]]', lignes: [{ texte: 'ligne', renvoi: 'nulle' }], renvois: ['nulle'] });
assert.ok(h3.indexOf('data-ib') < 0 && h3.indexOf('mot') >= 0 && h3.indexOf('ligne') >= 0 && h3.indexOf('Voir aussi') < 0);
assert.ok(IB.contenuHtml({ titre: 't', renvois: ['deficit', { id: 'retraites', texte: 'Les retraites' }] }).indexOf('Les retraites</button>') >= 0);

// La vérification des données
assert.deepStrictEqual(IB.verifier(deficit), []);
assert.deepStrictEqual(IB.verifier({ texte: '[[z|m]]', lignes: [{ renvoi: 'y' }], renvois: ['w'] }), ['titre manquant', 'renvoi inconnu : z', 'renvoi inconnu : y', 'renvoi inconnu : w']);

// La pile
function it(id, mode) { return { id: id, mode: mode || 'fixe' }; }
var p = IB.creerPile(), r;
r = p.ouvrir(it('a'), -1); assert.strictEqual(r.niveau, 0);
r = p.ouvrir(it('b'), 0); assert.strictEqual(r.niveau, 1);
r = p.ouvrir(it('c'), 1); assert.strictEqual(r.niveau, 2);
// ouvrir depuis le niveau 0 remplace ce qui était au-dessus
r = p.ouvrir(it('d'), 0);
assert.deepStrictEqual(r.retires.map(function (x) { return x.id; }), ['b', 'c']);
assert.deepStrictEqual(p.items.map(function (x) { return x.id; }), ['a', 'd']);
// A → D → A : pas d'empilement sans fin, on revient à A
r = p.ouvrir(it('a'), 1);
assert.ok(r.deja); assert.strictEqual(r.niveau, 0); assert.strictEqual(p.taille(), 1);
// la profondeur est bornée
var q = IB.creerPile(3);
['a', 'b', 'c', 'd', 'e'].forEach(function (id, i) { q.ouvrir(it(id), Math.min(i, q.taille()) - 1); });
assert.strictEqual(q.taille(), 3);
assert.strictEqual(q.items[2].id, 'e');
// fermer
assert.deepStrictEqual(p.fermerDepuis(5), []);
assert.deepStrictEqual(p.fermerDepuis(-1), []);
assert.strictEqual(p.fermerDepuis(0).length, 1);
assert.strictEqual(p.taille(), 0);
// le survol se ferme, le fixé reste ; une fois fixé, plus rien ne se ferme seul
var s = IB.creerPile();
s.ouvrir(it('a', 'fixe'), -1); s.ouvrir(it('b', 'survol'), 0); s.ouvrir(it('c', 'survol'), 1);
assert.ok(s.aDuFixe());
assert.deepStrictEqual(s.fermerSurvol(1).map(function (x) { return x.id; }), ['c']);
assert.deepStrictEqual(s.fermerSurvol(-1).map(function (x) { return x.id; }), ['b']);
assert.strictEqual(s.taille(), 1);
s.ouvrir(it('d', 'survol'), 0); s.fixer();
assert.deepStrictEqual(s.fermerSurvol(-1), []);
assert.strictEqual(s.taille(), 2);

// Le placement, sur les formats demandés : jamais hors du cadre
function dedans(pos, t, c) { return pos.x >= c.x && pos.y >= c.y && pos.x + t.l <= c.x + c.l + 0.001 && pos.y + t.h <= c.y + c.h + 0.001; }
var CADRES = [[320, 568], [390, 780], [844, 390], [1280, 800]].map(function (f) { return { x: 8, y: 8, l: Math.min(f[0], 480) - 16, h: f[1] - 16 }; });
CADRES.forEach(function (c) {
  [{ l: 300, h: 120 }, { l: 300, h: 300 }, { l: c.l, h: c.h }].forEach(function (t) {
    if (t.l > c.l) t.l = c.l;
    for (var ax = 0; ax <= c.l + 16; ax += 37) for (var ay = 0; ay <= c.h + 16; ay += 41) {
      var pos = IB.placer({ x: ax, y: ay, l: 60, h: 16 }, t, c);
      assert.ok(dedans(pos, t, c), JSON.stringify([c, t, ax, ay, pos]));
    }
    assert.ok(dedans(IB.placer(null, t, c), t, c));
  });
});
// sous le mot si ça tient, au-dessus sinon, sans recouvrir le mot
var c0 = { x: 8, y: 8, l: 304, h: 552 };
var bas = IB.placer({ x: 100, y: 50, l: 60, h: 16 }, { l: 200, h: 100 }, c0);
assert.strictEqual(bas.cote, 'bas'); assert.ok(bas.y >= 66);
var haut = IB.placer({ x: 100, y: 500, l: 60, h: 16 }, { l: 200, h: 100 }, c0);
assert.strictEqual(haut.cote, 'haut'); assert.ok(haut.y + 100 <= 500);

console.log('Infobulle : OK');

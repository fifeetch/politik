/* Rejoue les gestes de l'infobulle sur une petite page factice : remplacements, retours en arrière, fermeture, navigation.
   Ne vérifie ni le rendu ni le placement (ça, c'est le navigateur). Usage : node test/check-infobulle-dom.js */
var assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
function lire(f) { return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); }

/* ---------- La page factice ---------- */
function monde() {
  var doc, listeners = {}, timers = [], curseur = 0, racine;
  function Noeud(tag) {
    this.tag = tag; this.children = []; this.parentNode = null; this.attrs = {}; this.className = ''; this.hidden = false; this.style = {}; this.textContent = ''; this.html = '';
    var self = this;
    this.classList = { toggle: function (c, on) { var l = self.className.split(' ').filter(function (x) { return x && x !== c; }); if (on) l.push(c); self.className = l.join(' '); } };
  }
  Noeud.prototype = {
    setAttribute: function (k, v) { this.attrs[k] = String(v); },
    getAttribute: function (k) { return k in this.attrs ? this.attrs[k] : null; },
    appendChild: function (c) { c.parentNode = this; this.children.push(c); return c; },
    removeChild: function (c) { this.children.splice(this.children.indexOf(c), 1); c.parentNode = null; return c; },
    contains: function (n) { for (; n; n = n.parentNode) if (n === this) return true; return false; },
    focus: function () { doc.activeElement = this; },
    addEventListener: function (t, f) { (this.ls || (this.ls = {}))[t] = f; },
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 100, height: 20 }; },
    correspond: function (s) { return s === '[data-ib]' ? 'data-ib' in this.attrs : s.charAt(0) === '.' && this.className.split(' ').indexOf(s.slice(1)) >= 0; },
    closest: function (s) { for (var n = this; n; n = n.parentNode) if (n.correspond && n.correspond(s)) return n; return null; },
    querySelector: function (s) { var t = this.querySelectorAll(s); return t.length ? t[0] : null; },
    querySelectorAll: function (s) {
      var out = [];
      (function voir(n) { n.children.forEach(function (c) { if (s === 'button, a[href]' ? c.tag === 'button' : c.correspond(s)) out.push(c); voir(c); }); })(this);
      return out;
    },
    /* innerHTML : on ne recrée que les boutons, seuls utiles ici */
    set innerHTML(h) {
      var self = this, re = /<button type="button" class="([^"]*)"(?: data-ib="([^"]*)")?[^>]*>/g, m;
      this.html = h; this.children = [];
      while ((m = re.exec(h))) { var b = new Noeud('button'); b.className = m[1]; if (m[2]) b.attrs['data-ib'] = m[2]; self.appendChild(b); }
    }
  };
  racine = new Noeud('html');
  var app = racine.appendChild(new Noeud('div'));
  doc = { documentElement: racine, body: racine, activeElement: racine,
    createElement: function (t) { return new Noeud(t); },
    getElementById: function (id) { return id === 'app' ? app : null; },
    addEventListener: function (t, f) { listeners[t] = f; } };
  var ctx = { document: doc, console: console,
    getComputedStyle: function () { return {}; },
    setTimeout: function (f, ms) { timers.push(f); return timers.length; },
    clearTimeout: function (id) { if (id) timers[id - 1] = null; } };
  ctx.window = { addEventListener: function () {} };
  vm.createContext(ctx);
  vm.runInContext(lire('js/bus.js'), ctx);
  vm.runInContext(lire('js/infobulle.js'), ctx);
  var IB = ctx.PolitikInfobulle, Bus = ctx.PolitikBus, journal = [];
  ['ui:infobulle-open', 'ui:infobulle-close'].forEach(function (n) { Bus.on(n, function (d) { journal.push((n === 'ui:infobulle-open' ? '+' : '-') + d.id); }); });
  IB.definir({
    A: { titre: 'A', texte: '[[B|vers B]] [[C|vers C]]' },
    B: { titre: 'B', texte: '[[A|retour A]] [[D|vers D]]' },
    C: { titre: 'C' },
    D: { titre: 'D' }
  });
  var w = {
    IB: IB, Bus: Bus, journal: journal, doc: doc, timers: timers,
    calque: function () { return app.querySelector('.ib-calque'); },
    bulles: function () { return w.calque() ? w.calque().querySelectorAll('.ib-bulle') : []; },
    pile: function () { return w.bulles().map(function (b) { return /ib-titre"[^>]*>([^<]*)</.exec(b.html)[1]; }).join('>'); },
    mot: function (id) { var l = w.bulles(), k = l.length; while (k--) { var t = l[k].querySelectorAll('[data-ib]').filter(function (x) { return x.getAttribute('data-ib') === id; }); if (t.length) return t[0]; } return null; },
    motPage: function (id) { var b = new Noeud('button'); b.className = 'ib-mot'; b.attrs['data-ib'] = id; return app.appendChild(b); },
    clic: function (n) { listeners.click({ target: n, preventDefault: function () {}, stopPropagation: function () {} }); if (w.calque() && w.calque().contains(n) && !n.getAttribute('data-ib')) w.calque().ls.click({ target: n }); },
    touche: function (k) { listeners.keydown({ key: k, preventDefault: function () {}, stopPropagation: function () {} }); },
    survol: function (n) { listeners.pointerover({ pointerType: 'mouse', target: n }); },
    temps: function () { while (curseur < timers.length) { var f = timers[curseur]; timers[curseur++] = null; if (f) f(); } }
  };
  return w;
}
function coherent(w) {
  // chaque bulle est complète, et le calque ne contient que la pile
  w.bulles().forEach(function (b) { assert.ok(b.querySelector('.ib-x'), 'bulle sans bouton'); assert.ok(b.querySelector('.ib-x').textContent, 'bulle non rafraîchie'); });
  assert.strictEqual(w.calque().hidden, w.bulles().length === 0, 'calque visible si et seulement si une bulle est ouverte');
}
function ouvert(w) { return w.journal.filter(function (x) { return x[0] === '+'; }).length - w.journal.filter(function (x) { return x[0] === '-'; }).length; }

var scenarios = {
  'remplacer une sœur (A → B, puis C depuis A)': function () {
    var w = monde(), m = w.motPage('A');
    w.clic(m); w.clic(w.mot('B'));
    var motB = w.mot('B');
    assert.strictEqual(w.pile(), 'A>B');
    w.clic(w.mot('C'));
    assert.strictEqual(w.pile(), 'A>C');
    assert.strictEqual(motB.getAttribute('aria-expanded'), 'false', 'le mot remplacé se referme');
    assert.strictEqual(w.mot('C').getAttribute('aria-expanded'), 'true');
    assert.ok(w.bulles()[1].contains(w.doc.activeElement), 'le focus est dans la nouvelle bulle');
    assert.deepStrictEqual(w.journal, ['+A', '+B', '-B', '+C']);
    coherent(w);
  },
  'remplacer plusieurs niveaux (A → B → D, puis C depuis A)': function () {
    var w = monde();
    w.clic(w.motPage('A')); w.clic(w.mot('B')); w.clic(w.mot('D'));
    assert.strictEqual(w.pile(), 'A>B>D');
    w.clic(w.mot('C'));
    assert.strictEqual(w.pile(), 'A>C');
    assert.deepStrictEqual(w.journal, ['+A', '+B', '+D', '-B', '-D', '+C']);
    coherent(w);
  },
  'revenir à une entrée déjà ouverte (A → B → A)': function () {
    var w = monde();
    w.clic(w.motPage('A')); w.clic(w.mot('B')); w.clic(w.mot('A'));
    assert.strictEqual(w.pile(), 'A');
    assert.ok(w.bulles()[0].contains(w.doc.activeElement));
    assert.deepStrictEqual(w.journal, ['+A', '+B', '-B']);
    coherent(w);
    // et la pile reste utilisable
    w.clic(w.mot('C'));
    assert.strictEqual(w.pile(), 'A>C');
    coherent(w);
  },
  'fermer juste après un remplacement : Échap rend le focus': function () {
    var w = monde(), m = w.motPage('A');
    w.clic(m); w.clic(w.mot('B')); w.clic(w.mot('C'));
    var motC = w.mot('C');
    w.touche('Escape');
    assert.strictEqual(w.pile(), 'A');
    assert.strictEqual(w.doc.activeElement, motC);
    w.touche('Escape');
    assert.strictEqual(w.pile(), '');
    assert.strictEqual(w.doc.activeElement, m);
    assert.strictEqual(ouvert(w), 0);
    coherent(w);
  },
  'naviguer juste après un remplacement ferme tout': function () {
    ['nav:go', 'ui:modal-open', 'ui:modal-close'].forEach(function (n) {
      var w = monde();
      w.clic(w.motPage('A')); w.clic(w.mot('B')); w.clic(w.mot('C'));
      w.Bus.emit(n, {});
      assert.strictEqual(w.pile(), '', n);
      assert.strictEqual(ouvert(w), 0, n);
      coherent(w);
      w.clic(w.motPage('A'));   // on peut rouvrir ensuite
      assert.strictEqual(w.pile(), 'A');
    });
  },
  'le survol remplace un survol, jamais une bulle fixée': function () {
    var w = monde();
    w.clic(w.motPage('A')); w.survol(w.mot('B')); w.temps();
    assert.strictEqual(w.pile(), 'A>B');
    w.survol(w.mot('C')); w.temps();
    assert.strictEqual(w.pile(), 'A>C', 'une sœur au survol remplace la précédente');
    coherent(w);
    var w2 = monde();
    w2.clic(w2.motPage('A')); w2.clic(w2.mot('B'));
    w2.survol(w2.mot('C')); w2.temps();
    assert.strictEqual(w2.pile(), 'A>B', 'B est fixée : le survol ne la chasse pas');
    w2.clic(w2.mot('C'));
    assert.strictEqual(w2.pile(), 'A>C', 'le clic, si');
    coherent(w2);
  },
  'un contenu qui plante ne casse pas la pile': function () {
    var w = monde();
    w.IB.definir('E', { titre: 'E', texte: '[[F]]' });
    w.IB.definir('F', function () { throw new Error('boum'); });
    w.clic(w.motPage('A')); w.clic(w.mot('B'));
    assert.throws(function () { w.IB.ouvrir('E'); }, /boum/);
    assert.strictEqual(w.pile(), 'A>B');
    w.clic(w.mot('C'));
    assert.strictEqual(w.pile(), 'A>C');
    coherent(w);
  }
};
var noms = Object.keys(scenarios), ko = 0;
noms.forEach(function (n) {
  try { scenarios[n](); } catch (er) { ko++; console.error('ÉCHEC « ' + n + ' » : ' + er.message); }
});
if (ko) { console.error(ko + ' scénario(s) en échec sur ' + noms.length); process.exit(1); }
console.log('Infobulle, gestes sur page factice (' + noms.length + ' scénarios) : OK');

/* Lot 5 : vérifie les passages télé et radio du mandat (js/medias-mandat.js).
   Usage : node test/check-medias.js   (sort avec le code 1 si un test échoue) */
var D = require('../js/data.js'), E = require('../js/engine.js'), G = require('../js/govern.js'), ECO = require('../js/economy.js'), MM = require('../js/medias-mandat.js'), MS = require('../js/mandat-save.js'), fs = require('fs');
var ok = 0, ko = [];
function check(cond, msg) { if (cond) ok++; else ko.push(msg); }
function near(a, b, t) { return Math.abs(a - b) <= (t == null ? 1e-6 : t); }
function rng(v) { return function () { return v; }; }
function lab(over) {
  var sat = {}; D.SEGMENTS.forEach(function (s) { sat[s.id] = 50; });
  var gv = { pid: 'EM', year: 1, deficit: 5, debt: 118, sat: sat, popBonus: 0, measures: [], extra: [], financing: [], seats: {}, history: [], oneOff: 0, seed: 7, fronde: 0, rng: rng(0.99), eventsDeck: ['bleus', 'bleus', 'marches', 'marches', 'cour', 'cour', 'canicule', 'canicule', 'gilets', 'gilets'] };
  Object.keys(over || {}).forEach(function (k) { gv[k] = over[k]; });
  gv.eco = ECO.create(7, gv.debt, gv.deficit, G.popularity(gv));
  return gv;
}
var V = { canal: 'vingt', ton: 'expliquer' }, A = { canal: 'vingt', ton: 'annoncer' }, X = { canal: 'vingt', ton: 'attaquer' };

/* 1. Un passage par an, un de secours en crise, et la raison écrite */
var g1 = lab();
check(MM.dispo(g1, false).ok && !MM.dispo(g1, false).secours, 'dispo : un passage possible au début');
check(!MM.passer(g1, V, false).refuse, 'passage : accepté');
var nope = MM.dispo(g1, false); check(!nope.ok && /Déjà passé/.test(nope.raison), 'dispo : refus avec sa raison');
check(!!MM.passer(g1, V, false).refuse && MM.nbPasses(g1) === 1, 'passage : un second refusé, sans effet');
g1.year = 2;   // l'année 2 de ce mandat tombe sur « marches »
check(!MM.dispo(g1, false).secours && MM.dispo(g1, false).ok, 'dispo : nouvelle année, nouveau passage');
MM.passer(g1, V, false);
check(!MM.dispo(g1, false).ok, 'crise inconnue : pas de secours avant l\'été');
var sec = MM.dispo(g1, true); check(sec.ok && sec.secours && sec.crise.id === 'marches', 'crise connue : un passage de secours');
MM.passer(g1, V, true);
var fin = MM.dispo(g1, true); check(!fin.ok && /deux passages/.test(fin.raison), 'secours : un seul');
var calme = lab(); MM.passer(calme, V, true); check(!MM.dispo(calme, true).ok, 'événement heureux (bleus) : pas de crise, donc pas de secours');
var over = lab(); over.over = true; check(!MM.dispo(over, false).ok, 'fin de mandat : plus de passage');

/* 2. Les tons */
var e = lab(), p0 = MM.popBrute(e), re = MM.passer(e, V, false);
check(re.pop > 0 && re.pop <= 2 && near(MM.popBrute(e) - p0, re.pop, 0.01) && e.deficit === 5, 'expliquer : petit gain, sans déficit');
var ex = lab({ rng: rng(0) }), rr = MM.passer(ex, V, false); check(rr.rate && rr.pop === 0, 'expliquer raté : passe inaperçu, jamais de perte');
var an = lab(), ra = MM.passer(an, A, false); check(ra.pop > re.pop && near(an.deficit, 5 + MM.C.annonce), 'annoncer : gain plus fort, coût au déficit');
var at = lab(); at.sat.ind = 70; at.sat.cad = 65; MM.passer(at, X, false);
check(at.sat.ind > 70 && at.sat.cad > 65 && at.sat.pop < 50 && at.sat.ret < 50, 'attaquer : la base aime, les autres se fâchent');
var ris = lab(); check(MM.risque(ris, 'vingt', 'attaquer') > MM.risque(ris, 'vingt', 'annoncer') && MM.risque(ris, 'vingt', 'annoncer') > MM.risque(ris, 'vingt', 'expliquer'), 'attaquer : le plus risqué');
Object.keys(MM.TONS).forEach(function (t) { check(!!MM.passer(lab(), { canal: 'vingt', ton: t }, false).replique, 'réplique pour ' + t); });

/* 3. Le 20 h : risque selon la popularité et la répétition. La matinale : ciblée */
var hi = lab({ popBonus: 20 }), lo = lab({ popBonus: -25 });
check(MM.risque(lo, 'vingt', 'annoncer') > MM.risque(hi, 'vingt', 'annoncer'), 'risque : plus haut si la popularité est basse');
var rep = lab(), r1 = MM.risque(rep, 'vingt', 'annoncer'); MM.etat(rep).passes.push({ y: 0 }, { y: 0 }); check(MM.risque(rep, 'vingt', 'annoncer') > r1, 'risque : plus haut si on passe souvent');
D.STATIONS.forEach(function (st) {
  var m = lab(), top = D.SEGMENTS.slice().sort(function (a, b) { return st.segs[b.id] - st.segs[a.id]; }), low = top[top.length - 1];
  MM.passer(m, { canal: 'matinale', station: st.id, ton: 'annoncer' }, false);
  check(m.sat[top[0].id] > 50 && m.sat[low.id] < 50, st.name + ' : son public gagne, les autres s\'agacent');
  var sure = lab(); MM.passer(sure, { canal: 'matinale', station: st.id, ton: 'expliquer' }, false);
  check(D.SEGMENTS.every(function (s) { return sure.sat[s.id] >= 50; }), st.name + ' : expliquer ne fâche personne');
});
check(!!MM.passer(lab(), { canal: 'matinale', station: 'inconnue', ton: 'expliquer' }, false).refuse, 'station inconnue : refusée');

/* 4. La crise : le bon ton réduit le coût, le mauvais l'aggrave */
function enCrise(ton) { var c = lab({ year: 2 }), b = MM.apercu(c, { canal: 'vingt', ton: ton }, true); return { a: b, r: MM.passer(c, { canal: 'vingt', ton: ton }, true), hors: MM.apercu(lab({ year: 2 }), { canal: 'vingt', ton: ton }, false) }; }
var bon = enCrise('expliquer'), mauvais = enCrise('annoncer');
check(bon.r.criseEffet > 0 && bon.a.gain > bon.hors.gain, 'crise : le bon ton apaise');
check(mauvais.r.criseEffet < 0 && mauvais.a.gain < mauvais.hors.gain, 'crise : le mauvais ton aggrave');
check(bon.r.crise === 'marches' && /taux/.test(MM.question(lab({ year: 2 }), 'vingt', true)), 'crise : le passage porte sur l\'actualité de l\'année');
check(Object.keys(MM.CRISES).every(function (k) { var c = MM.CRISES[k]; return c.q && c.bon && c.mauvais && c.bon !== c.mauvais && Object.keys(MM.TONS).every(function (t) { return c.r[t]; }); }), 'crise : une question et trois répliques');
check(G.EVENTS.filter(function (ev) { return MM.CRISES[ev.id]; }).length >= 5, 'crise : les événements de govern.js sont reconnus');
var gr = lab({ greve: { active: true } }); check(MM.dispo(gr, false).ok && MM.crise(gr, false).id === 'greve', 'grève : lue si elle existe');
check(MM.crise(lab(), false) === null, 'grève : le moteur n\'en dépend pas');

/* 5. La surexposition : chaque passage rapporte moins que le précédent, et trop de passages coûtent */
var sx = lab({ eventsDeck: ['bleus', 'bleus', 'bleus', 'bleus', 'bleus'] }), gains = [];
for (var y = 1; y <= 5; y++) { sx.year = y; gains.push(MM.apercu(sx, V, false).gain); MM.passer(sx, V, false); }
check(gains.every(function (x, i) { return !i || x < gains[i - 1]; }), 'surexposition : gains décroissants ' + gains.join(' '));
check(gains[4] < 0, 'surexposition : le 5e passage de suite fait perdre ' + gains[4]);

/* 6. Le détail : popularité, déficit, bilan */
var de = lab(), pa = MM.passer(de, A, false), yr = G.endYear(de), pc = yr.eco.entries.popularity.causes.filter(function (c) { return /Passage/.test(c.label); })[0];
check(!!pc && near(pc.value, pa.pop, 0.01), 'infobulle : la popularité nomme le passage');
check(yr.eco.entries.deficit.causes.some(function (c) { return /Passage/.test(c.label); }), 'infobulle : le déficit nomme le passage');
var somme = yr.eco.entries.popularity.causes.reduce(function (t, c) { return t + c.value; }, 0); check(near(somme, yr.eco.entries.popularity.value, 1e-6), 'détail : la somme des causes reste juste');
check(MM.deLAnnee(de, 1).length === 1 && /20 h.*popularité.*déficit/.test(MM.ligne(MM.deLAnnee(de, 1)[0])), 'bilan : une ligne chiffrée');

/* 7. Ne rien faire n'est pas pénalisé : aucun effet tant qu'on ne passe pas */
var rien = lab(), av = JSON.stringify([rien.sat, rien.popBonus, rien.deficit]); MM.dispo(rien, true); MM.apercu(rien, A, true); MM.question(rien, 'vingt', true);
check(JSON.stringify([rien.sat, rien.popBonus, rien.deficit]) === av && !rien.medias, 'apercu et dispo ne changent rien');

/* 8. La sauvegarde : l'encodage de mandat-save garde gv.medias */
var en = lab(); MM.passer(en, V, false);
var fauxG = { rng: en.rng }, enc = MS.encode ? MS.encode({ gv: en }, fauxG) : null;
var dec = enc ? MS.decode(JSON.parse(JSON.stringify(enc)), fauxG) : { gv: JSON.parse(JSON.stringify(en)) };
check(MM.nbPasses(dec.gv) === 1 && MM.deLAnnee(dec.gv, 1)[0].canal === 'vingt' && !MM.dispo(dec.gv, false).ok, 'sauvegarde : le passage de l\'année survit');

/* 9. Branchements : index.html, service worker, écran */
var idx = fs.readFileSync(__dirname + '/../index.html', 'utf8'), sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8'), ui = fs.readFileSync(__dirname + '/../js/govui.js', 'utf8');
check(idx.indexOf('js/medias-mandat.js') > 0 && sw.indexOf('js/medias-mandat.js') > 0, 'chargé par index.html et sw.js');
check(idx.indexOf('js/medias-mandat.js') > idx.indexOf('js/govern.js'), 'chargé après govern.js');
check(/id="gov-media"/.test(idx) && /id="gov-media-why"/.test(idx) && /renderMedia\(\)/.test(ui), 'bouton branché');
new Function(ui);

console.log(ok + ' vérifications réussies, ' + ko.length + ' en échec.');
ko.forEach(function (x) { console.log('  ✗ ' + x); });
if (ko.length) process.exit(1);

/* Vérification automatique des sources du jeu.
   Usage : node test/check-sources.js            → contrôle hors ligne (rapide)
           node test/check-sources.js --online   → ouvre aussi chaque lien officiel

   Ce que ça vérifie :
   1. Chaque mesure du programme et chaque mesure de financement a au moins une source,
      et une ligne « En vrai » (qui la défend en 2027).
   2. Chaque fiche « Le saviez-vous ? » a une source (sauf les fiches de pure explication).
   3. Chaque source est un site de l'État ou d'une institution publique française (liste ci-dessous).
   4. Le relevé du comparateur 2027 (site pédagogique, non officiel) date de moins de 60 jours.
   5. Avec --online : chaque lien répond, et la page contient bien le mot attendu (« expect »).
   Le script s'arrête en erreur si un point bloquant échoue : le robot GitHub prévient alors par e-mail. */
var D = require('../js/data.js');
var fs = require('fs');

/* Sites acceptés comme sources officielles : l'État (.gouv.fr) et les institutions publiques. */
var OFFICIAL_DOMAINS = [
  'gouv.fr', 'vie-publique.fr', 'insee.fr', 'ccomptes.fr', 'conseil-constitutionnel.fr', 'conseil-etat.fr',
  'assemblee-nationale.fr', 'senat.fr', 'arcom.fr', 'cnccfp.fr', 'commission-des-sondages.fr', 'hcfp.fr',
  'cnil.fr', 'urssaf.fr', 'securite-sociale.fr', 'info-retraite.fr', 'france-travail.fr', 'banque-france.fr'
];
/* Fiches d'explication générale, sans chiffre ni règle à sourcer. */
var CONCEPT_ONLY = ['militants', 'agenda', 'alliances'];
var MAX_REF_AGE_DAYS = 60;

var errors = [], warnings = [], checked = 0;
function err(where, msg) { errors.push('**' + where + '** : ' + msg); }
function warn(where, msg) { warnings.push('**' + where + '** : ' + msg); }

function isOfficial(url) {
  var host;
  try { host = new URL(url).hostname.toLowerCase(); } catch (e) { return false; }
  return OFFICIAL_DOMAINS.some(function (d) { return host === d || host.slice(-(d.length + 1)) === '.' + d; });
}
function checkSrc(where, list, required) {
  if (!list || !list.length) { if (required) err(where, 'aucune source'); return; }
  list.forEach(function (s) {
    if (!s.label) err(where, 'source sans titre');
    if (!s.url || s.url.indexOf('https://') !== 0) err(where, 'lien manquant ou non sécurisé : ' + s.url);
    else if (!isOfficial(s.url)) err(where, 'pas une source d\'État : ' + s.url);
  });
}

/* 1. Mesures et financements */
var items = [];
D.MEASURES.forEach(function (m) { items.push({ where: 'Mesure « ' + m.name + ' »', src: m.src, vrai: m.vrai }); });
D.FUNDING.forEach(function (m) { items.push({ where: 'Financement « ' + m.name + ' »', src: m.src, vrai: m.vrai }); });
items.forEach(function (it) {
  checkSrc(it.where, it.src, true);
  if (!it.vrai) err(it.where, 'pas de ligne « En vrai, en 2027 »');
});

/* 2. Fiches « Le saviez-vous ? » */
Object.keys(D.LEARN).forEach(function (k) {
  var L = D.LEARN[k];
  checkSrc('Fiche « ' + L.title + ' »', L.src, CONCEPT_ONLY.indexOf(k) < 0);
  items.push({ where: 'Fiche « ' + L.title + ' »', src: L.src });
});
if (D.SEGMENTS_SRC) { checkSrc('Groupes de population', [D.SEGMENTS_SRC], true); items.push({ where: 'Groupes de population', src: [D.SEGMENTS_SRC] }); }

/* 4. Fraîcheur du relevé du comparateur 2027 */
var R = D.REFERENCE_2027;
if (!R) err('Comparateur 2027', 'référence absente');
else {
  if (R.official !== false) err('Comparateur 2027', 'doit être marqué comme non officiel');
  var age = Math.floor((Date.now() - new Date(R.checked).getTime()) / 86400000);
  if (age > MAX_REF_AGE_DAYS) warn('Comparateur 2027', 'relevé vieux de ' + age + ' jours : revoir les lignes « En vrai » avec ' + R.url);
}

/* 5. Vérification en ligne */
function norm(t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'"); }
function fetchOne(url) {
  var ctl = new AbortController(); var timer = setTimeout(function () { ctl.abort(); }, 25000);
  return fetch(url, { redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Politik, verification des sources)', 'Accept-Language': 'fr-FR,fr;q=0.9' } })
    .then(function (res) {
      var type = res.headers.get('content-type') || '';
      if (type.indexOf('html') < 0) return { status: res.status, type: type, text: '' };
      return res.text().then(function (text) { return { status: res.status, type: type, text: text }; });
    })
    .finally(function () { clearTimeout(timer); });
}
function online() {
  var seen = {}, jobs = [];
  items.forEach(function (it) { (it.src || []).forEach(function (s) {
    var key = s.url + '|' + (s.expect || '');
    if (seen[key]) return; seen[key] = true;
    jobs.push({ where: it.where, s: s });
  }); });
  var i = 0;
  function next() {
    if (i >= jobs.length) return Promise.resolve();
    var j = jobs[i++];
    return fetchOne(j.s.url).then(function (r) {
      checked++;
      if (r.status === 404 || r.status === 410) err(j.where, 'lien mort (' + r.status + ') : ' + j.s.url);
      else if (r.status >= 400) warn(j.where, 'le site a refusé la visite du robot (' + r.status + '), à vérifier à la main : ' + j.s.url);
      else if (j.s.expect && r.text) {
        if (/captcha|v[ée]rification de s[ée]curit[ée]|access denied/i.test(r.text.slice(0, 4000)) && norm(r.text).indexOf(norm(j.s.expect)) < 0)
          warn(j.where, 'page protégée contre les robots, à vérifier à la main : ' + j.s.url);
        else if (norm(r.text).indexOf(norm(j.s.expect)) < 0)
          err(j.where, 'la page ne parle plus de « ' + j.s.expect + ' » (contenu changé ?) : ' + j.s.url);
      }
    }).catch(function (e) {
      checked++;
      warn(j.where, 'site injoignable (' + (e.name === 'AbortError' ? 'trop lent' : e.message) + ') : ' + j.s.url);
    }).then(next);
  }
  return Promise.all([next(), next(), next(), next()]).then(function () {
    var down = warnings.filter(function (w) { return w.indexOf('injoignable') >= 0; }).length;
    if (jobs.length && down > jobs.length / 2) err('Robot', down + ' liens sur ' + jobs.length + ' injoignables : la vérification en ligne n\'a pas pu se faire');
  });
}

function report() {
  var lines = ['# Vérification des sources de Politik', '',
    items.length + ' fiches contrôlées' + (checked ? ', ' + checked + ' liens officiels ouverts' : '') + '.',
    'Comparateur 2027 (référence non officielle) : relevé du ' + (R ? R.checked : '?') + '.', ''];
  lines.push(errors.length ? '## ❌ À corriger (' + errors.length + ')' : '## ✅ Aucune erreur');
  errors.forEach(function (e) { lines.push('- ' + e); });
  if (warnings.length) { lines.push('', '## ⚠️ À regarder (' + warnings.length + ')'); warnings.forEach(function (w) { lines.push('- ' + w); }); }
  var md = lines.join('\n') + '\n';
  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  if (process.env.GITHUB_ACTIONS) { // une alerte lisible directement dans l'onglet Actions
    var plain = function (t) { return t.replace(/\*\*/g, '').replace(/%/g, '%25').replace(/\n/g, ' '); };
    errors.forEach(function (e) { console.log('::error title=Source à corriger::' + plain(e)); });
    warnings.forEach(function (w) { console.log('::warning title=Source à regarder::' + plain(w)); });
  }
  process.exit(errors.length ? 1 : 0);
}

if (process.argv.indexOf('--online') >= 0) online().then(report);
else report();

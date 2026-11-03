/* Politik — la sauvegarde du quinquennat, des législatives et de l'opposition (règles sans affichage).
   On photographie l'état au début de chaque étape stable (js/govui.js), avec le hasard : reprendre en plein choix ramène au début de l'étape.
   L'état forme un graphe : un ministre est dans gv.cabinet.posts et cabinet.imposed, gv.seats est aussi gv.legis.seats, op.g est la partie.
   JSON seul casserait ces liens : l'encodage les garde, et remplace la partie et son hasard par des renvois.
   Une sauvegarde abîmée ou d'un autre format est refusée ici : elle n'atteint jamais l'écran. */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var E = node ? require('./engine.js') : root.PolitikEngine;
  var KEY = 'politik_save_mandat', V = 1;
  var MAX_CHARS = 4500000;   // un navigateur accorde environ 5 millions de caractères à tout le jeu : au-delà, on garde la sauvegarde d'avant
  var STAGES = ['lcamp', 'vote1', 'afterLegis', 'cabinet', 'gov', 'oppo'];
  /* Le détail des 577 circonscriptions ne sert qu'aux soirées électorales, jouées juste après le vote : il n'entre pas dans la sauvegarde */
  var SKIP = { circs: true };

  function isObj(v) { return v !== null && typeof v === 'object'; }
  function num(v) { return typeof v === 'number' && isFinite(v); }

  /* ---------- Encoder : { $g } la partie, { $rng } son hasard, { $id } un objet partagé, { $r } un renvoi, { $n } NaN et les infinis ---------- */
  function encode(state, g) {
    var count = new Map(), ids = new Map(), next = 0;
    function dropped(k, v) { return SKIP[k] || v === undefined || (typeof v === 'function' && v !== g.rng); }
    (function scan(v) {
      if (!isObj(v) || v === g) return;
      var n = count.get(v) || 0; count.set(v, n + 1);
      if (n) return;
      Object.keys(v).forEach(function (k) { if (!dropped(k, v[k])) scan(v[k]); });
    })(state);
    function enc(v) {
      if (v === g.rng) return { $rng: 1 };
      if (typeof v === 'function' || v === undefined) return null;
      if (typeof v === 'number' && !isFinite(v)) return { $n: String(v) };
      if (!isObj(v)) return v;
      if (v === g) return { $g: 1 };
      if (ids.has(v)) return { $r: ids.get(v) };
      var shared = count.get(v) > 1, id = shared ? next++ : null, out;
      if (shared) ids.set(v, id);
      if (Array.isArray(v)) {
        out = v.map(enc);
        return shared ? { $id: id, $a: out } : out;
      }
      out = shared ? { $id: id } : {};
      Object.keys(v).forEach(function (k) { if (!dropped(k, v[k])) out[k] = enc(v[k]); });
      return out;
    }
    return enc(state);
  }
  function decode(data, g) {
    var byId = {};
    function dec(v) {
      if (!isObj(v)) return v;
      if (Array.isArray(v)) return v.map(dec);
      if (v.$rng) return g.rng;
      if (v.$g) return g;
      if (v.$n) return Number(v.$n);
      if (v.$r != null) { if (!(v.$r in byId)) throw new Error('renvoi inconnu'); return byId[v.$r]; }
      var out = Array.isArray(v.$a) ? [] : {};
      if (v.$id != null) byId[v.$id] = out;
      if (Array.isArray(v.$a)) { v.$a.forEach(function (x) { out.push(dec(x)); }); return out; }
      Object.keys(v).forEach(function (k) { if (k !== '$id' && k !== '__proto__') out[k] = dec(v[k]); });
      return out;
    }
    return dec(data);
  }

  /* o : stage, me, info, g, state, et le contexte de PolitikUI.saveContext() (quick, perso, founded, lead, foundedOn) */
  function pack(o) {
    return { v: V, when: Date.now(), stage: o.stage, me: o.me, info: o.info || '', quick: !!o.quick, perso: o.perso || null, founded: o.founded || null, lead: !!o.lead, foundedOn: !!o.foundedOn,
      game: E.saveGame(o.g), state: encode(o.state, o.g) };
  }

  /* ---------- Contrôler : le premier défaut trouvé, ou null si la sauvegarde est saine ---------- */
  function gvFlaw(gv) {
    if (!isObj(gv)) return 'mandat absent';
    if (gv.oppo) return typeof gv.pid === 'string' ? null : 'président absent';
    if (!num(gv.year) || gv.year < 1 || gv.year > 6 || !num(gv.deficit) || !num(gv.debt) || !num(gv.popBonus)) return 'compteurs du mandat';
    if (!isObj(gv.sat) || D.SEGMENTS.some(function (s) { return !num(gv.sat[s.id]); })) return 'satisfaction';
    if (!isObj(gv.seats) || !Array.isArray(gv.measures) || !Array.isArray(gv.history)) return 'mandat incomplet';
    if (gv.measures.concat(gv.extra || []).some(function (m) { return !isObj(m) || !E.measure(m.id); })) return 'mesure inconnue';
    if (!Array.isArray(gv.cardsDeck) || !Array.isArray(gv.eventsDeck)) return 'pioches';
    if (!isObj(gv.eco) || !num(gv.eco.rng) || !Array.isArray(gv.eco.items) || !Array.isArray(gv.eco.ledger)) return 'conjoncture';
    return null;
  }
  function flaw(sv) {
    if (!isObj(sv)) return 'illisible';
    if (sv.v !== V) return 'ancienne version';
    if (STAGES.indexOf(sv.stage) < 0) return 'étape inconnue';
    if (typeof sv.me !== 'string' || typeof sv.game !== 'string' || !isObj(sv.state)) return 'incomplète';
    if (!E.PARTY[sv.me] && !(sv.founded && sv.founded.sigle === sv.me)) return 'parti inconnu';
    var game = JSON.parse(sv.game);
    if (!isObj(game) || !Array.isArray(game.players) || game.rngState == null) return 'partie abîmée';
    var s = decode(sv.state, { rng: function () { return 0; } }), bad;
    if (!isObj(s)) return 'état illisible';
    if (sv.stage === 'oppo' && !isObj(s.op)) return 'opposition absente';
    if (isObj(s.op) && (!num(s.op.year) || !num(s.op.qi) || s.op.qi < 0 || s.op.qi > 3 || !isObj(s.op.seats) || !Array.isArray(s.op.myCamp) || !Array.isArray(s.op.presCamp) || !num(s.op.score))) return 'opposition abîmée';
    if (isObj(s.keep) && (bad = gvFlaw(s.keep))) return bad;
    if (bad = gvFlaw(s.gv)) return bad;
    if (sv.stage === 'gov') {
      if (s.step !== 0 && s.step !== 1 && s.step !== 2 && s.step !== 3) return 'saison inconnue';
      if (s.gv.oppo || !isObj(s.gv.cabinet) || !isObj(s.gv.cabinet.posts)) return 'gouvernement absent';
    }
    if ((sv.stage === 'lcamp' || sv.stage === 'vote1') && (!isObj(s.lc) || !num(s.lc.turn) || !num(s.lc.left) || !isObj(s.lc.camp) || !Array.isArray(s.lc.allies))) return 'campagne abîmée';
    if (sv.stage === 'afterLegis' && (!isObj(s.gv.legis) || !isObj(s.gv.legis.outcome))) return 'législatives absentes';
    return null;
  }

  /* ---------- Le stockage : toute écriture est protégée, le jeu continue même si elle échoue ---------- */
  function store(st) { if (st) return st; try { return root.localStorage || null; } catch (e) { return null; } }
  /* Renvoie { ok, size, full } : full si la place manque. La sauvegarde précédente reste alors en place. */
  function write(sv, st) {
    var s, size = 0, old = null;
    try { st = store(st); s = JSON.stringify(sv); size = s.length; if (!st) return { ok: false, size: size }; } catch (e) { return { ok: false, size: size }; }
    if (size > MAX_CHARS) return { ok: false, size: size, full: true };
    try { st.setItem(KEY, s); return { ok: true, size: size }; } catch (e) {}
    // la place manque peut-être parce que l'ancienne copie compte encore : on la retire pour écrire, et on la remet si cela ne suffit pas
    try { old = st.getItem(KEY); st.removeItem(KEY); st.setItem(KEY, s); return { ok: true, size: size }; }
    catch (e) { try { if (old != null) st.setItem(KEY, old); } catch (e2) {} return { ok: false, size: size, full: true }; }
  }
  /* null : aucune sauvegarde · { sv } : saine · { bad } : à écarter */
  function read(st) {
    var raw = null;
    try { st = store(st); raw = st ? st.getItem(KEY) : null; } catch (e) { return null; }
    if (raw == null) return null;
    try {
      var sv = JSON.parse(raw), why = flaw(sv);
      return why ? { bad: why } : { sv: sv };
    } catch (e) { return { bad: 'illisible' }; }
  }
  function clear(st) { try { st = store(st); if (st) st.removeItem(KEY); } catch (e) {} }

  var API = { KEY: KEY, V: V, MAX_CHARS: MAX_CHARS, STAGES: STAGES, encode: encode, decode: decode, pack: pack, flaw: flaw, write: write, read: read, clear: clear };
  if (node) module.exports = API; else root.PolitikMandatSave = API;
})(this);

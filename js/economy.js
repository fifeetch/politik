/* Politik — b1 : la conjoncture du quinquennat (croissance, inflation, chômage, taux, charge de la dette).
   Module pur : ni affichage, ni hasard global, ni référence à gv. Tout l'état tient dans un objet « eco »
   sérialisable en JSON, y compris son générateur de hasard (déterministe à partir de la graine de la partie).
   Le joueur ne décide rien ici : le module agit par les leviers existants (déficit, dette, satisfaction).

   Chaque résultat est une « entrée » : { id, label, unit, kind, value, level?, text?, causes: [{ label, value, ref? }] }.
   Règle : la somme des causes égale toujours value. ref renvoie à une autre entrée du même rapport (sans jamais boucler).
   Les chiffres et leurs sources sont dans D.ECONOMY (js/data.js). */
(function (root) {
  var node = typeof module !== 'undefined' && module.exports;
  var D = node ? require('./data.js') : root.PolitikData;
  var P = D.ECONOMY;

  function round(x, n) { var k = Math.pow(10, n == null ? 2 : n); return Math.round(x * k) / k; }
  function sum(list) { return list.reduce(function (s, c) { return s + c.value; }, 0); }

  /* Le hasard de la conjoncture : son état est un simple entier, sauvegardé avec le reste (mulberry32) */
  function draw(eco) {
    eco.rng = (eco.rng + 0x6D2B79F5) | 0;
    var t = Math.imul(eco.rng ^ (eco.rng >>> 15), 1 | eco.rng);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /* Un choc de moyenne nulle, le plus souvent petit (somme de deux tirages) */
  function shock(eco, amp) { return (draw(eco) + draw(eco) - 1) * amp; }

  /* Une entrée dont les causes tombent juste : on arrondit, puis l'écart d'arrondi va à la plus grosse cause */
  function entry(id, label, unit, kind, causes, o) {
    o = o || {};
    var list = causes.filter(function (c) { return Math.abs(c.value) >= 0.005; }).map(function (c) {
      var x = { label: c.label, value: round(c.value) }; if (c.ref) x.ref = c.ref; return x;
    });
    var value = round(o.value != null ? o.value : sum(causes));
    var gap = round(value - sum(list));
    if (gap && list.length) {
      var big = list.slice().sort(function (a, b) { return Math.abs(b.value) - Math.abs(a.value); })[0];
      big.value = round(big.value + gap);
    } else if (gap) list.push({ label: P.labels.rounding, value: gap });
    var e = { id: id, label: label, unit: unit, kind: kind, value: value, causes: list };
    if (o.level != null) e.level = round(o.level);
    if (P.texts[id]) e.text = P.texts[id];
    return e;
  }

  /* ---------- L'état de départ ---------- */
  function create(seed, debt, deficit, pop) {
    var s = P.start;
    return { rng: (seed | 0) ^ 0x51ED270B, growth: s.growth, inflation: s.inflation, unemployment: s.unemployment,
      gap: s.gap, rate: s.rate, apparent: s.apparent, charge: s.apparent * debt / 100, chargeDebt: debt,
      carry: 0, oneOff: 0, open: { deficit: deficit, debt: debt, pop: pop == null ? null : pop },
      ledger: [], items: [], history: [], report: null };
  }
  /* Une décision de l'année qui touche le déficit ou la dette : gardée pour pouvoir l'expliquer en fin d'année */
  function note(eco, lever, label, value) { if (value) eco.ledger.push({ lever: lever, label: label || P.labels.others, value: value }); }
  /* Les effets dans la durée d'une mesure adoptée (champs facultatifs : sans eux, elle agit tout de suite et pour toujours) */
  function register(eco, m, k, year) {
    if (!m.ramp && !m.retour && !m.emploi && !m.prix) return;
    eco.items.push({ id: m.id, label: m.name, pts: k * m.cost / P.mdPerPoint, year: year, ramp: m.ramp || null, retour: m.retour || 0,
      lag: m.lag == null ? P.defaultLag : m.lag, emploi: k * (m.emploi || 0), prix: k * (m.prix || 0), rampDone: 0, retourDone: 0 });
  }
  function grouped(ledger, lever) {
    var out = [], at = {};
    ledger.forEach(function (x) {
      if (x.lever !== lever) return;
      if (at[x.label] == null) { at[x.label] = out.length; out.push({ label: x.label, value: 0 }); }
      out[at[x.label]].value += x.value;
    });
    return out;
  }

  /* ---------- Une année de conjoncture ----------
     i : { year, deficit, debt, target, bercy, shares: { groupe: poids } }. Renvoie ce que le moteur doit appliquer. */
  function step(eco, i) {
    var E = {}, prev = { gap: eco.gap, u: eco.unemployment, infl: eco.inflation, ap: eco.apparent };

    /* 1. Ce que les décisions de l'année ont réellement fait : montée en charge et effet retour des mesures */
    var ramps = [], retours = [], priceFx = [], jobFx = [];
    eco.items.forEach(function (it) {
      var age = i.year - it.year;
      if (it.ramp) {
        var share = it.ramp[Math.min(age, it.ramp.length - 1)], d = it.pts * (share - 1) - it.rampDone;
        it.rampDone += d;
        if (Math.abs(d) > 1e-9) ramps.push({ label: it.label, value: d, ref: 'montee' });
      }
      if (it.retour && age >= it.lag) {
        var done = Math.min(1, (age - it.lag + 1) / P.retourYears), r = -it.retour * it.pts * done - it.retourDone;
        it.retourDone += r;
        if (Math.abs(r) > 1e-9) retours.push({ label: it.label, value: r, ref: 'retour' });
      }
      if (it.prix && age === 0) priceFx.push({ label: it.label, value: it.prix });
      if (it.emploi && age >= it.lag) jobFx.push({ label: it.label, value: it.emploi });
    });
    E.montee = entry('montee', P.labels.montee, 'pts de PIB', 'variation', ramps.map(function (c) { return { label: c.label, value: c.value }; }));
    E.retour = entry('retour', P.labels.retour, 'pts de PIB', 'variation', retours.map(function (c) { return { label: c.label, value: c.value }; }));

    /* 2. L'impulsion budgétaire : ce que l'État injecte (ou retire) dans l'économie cette année */
    var decided = grouped(eco.ledger, 'deficit'), others = i.deficit - eco.open.deficit - i.bercy - sum(decided);
    if (Math.abs(others) > 1e-9) decided.push({ label: P.labels.others, value: others });
    if (i.bercy) decided.push({ label: P.labels.bercy, value: i.bercy });
    var rampTotal = sum(ramps), impulseCauses = decided.concat(rampTotal ? [{ label: P.labels.montee, value: rampTotal, ref: 'montee' }] : []);
    if (eco.oneOff) impulseCauses.push({ label: P.labels.oneOffEnd, value: -eco.oneOff });
    E.impulsion = entry('impulsion', P.labels.impulsion, 'pts de PIB', 'variation', impulseCauses);
    var impulse = sum(impulseCauses);

    /* 3. Inflation : la cible, l'inertie, la chaleur de l'économie, les mesures et les prix mondiaux */
    var priceShock = shock(eco, P.priceShock), gapForPrice = eco.gap;
    var inflCauses = [{ label: P.labels.ecbTarget, value: P.inflationTarget }, { label: P.labels.inertia, value: P.inflationInertia * (prev.infl - P.inflationTarget) },
      { label: P.labels.heat, value: P.inflationGap * gapForPrice }].concat(priceFx, [{ label: P.labels.worldPrices, value: priceShock }]);
    E.inflation = entry('inflation', P.labels.inflation, '%', 'niveau', inflCauses);
    eco.inflation = sum(inflCauses);

    /* 4. Taux des nouveaux emprunts, puis taux moyen de la dette, qui ne suit que lentement (renouvellement du stock) */
    var excess = i.deficit - i.target, debtOver = Math.max(0, i.debt - P.debtComfort);
    var rateCauses = [{ label: P.labels.rateBase, value: P.rate0 }, { label: P.labels.inflation, value: P.rateInflation * (eco.inflation - P.inflationTarget), ref: 'inflation' },
      { label: excess > 0 ? P.labels.riskDeficit : P.labels.trustDeficit, value: excess > 0 ? P.riskLinear * excess + P.riskConvex * excess * excess : Math.max(-P.trustMax, P.riskLinear * excess) },
      { label: P.labels.riskDebt, value: P.riskDebt * debtOver }];
    E.rate = entry('rate', P.labels.rate, '%', 'niveau', rateCauses);
    eco.rate = sum(rateCauses);
    eco.apparent = prev.ap + P.rollover * (eco.rate - prev.ap);

    /* 5. Croissance : le potentiel, plus la variation de l'écart de production */
    var demandNow = P.multiplier * P.impulseNow * impulse, demandLate = P.multiplier * eco.carry;
    var credit = -P.rateDrag * (eco.rate - P.rate0), world = shock(eco, P.demandShock), recall = (P.gapPersistence - 1) * prev.gap;
    var growthCauses = [{ label: P.labels.potential, value: P.potential }, { label: P.labels.gapRecall, value: recall },
      { label: P.labels.budgetNow, value: demandNow, ref: 'impulsion' }, { label: P.labels.budgetLate, value: demandLate },
      { label: P.labels.credit, value: credit, ref: 'rate' }, { label: P.labels.worldDemand, value: world }];
    E.growth = entry('growth', P.labels.growth, '%', 'niveau', growthCauses);
    eco.growth = sum(growthCauses);
    eco.gap = eco.growth - P.potential + prev.gap;
    eco.carry = (1 - P.impulseNow) * impulse;

    /* 6. Chômage : il rejoint lentement son niveau d'équilibre, moins ce que permet l'activité (loi d'Okun) */
    var jobs = sum(jobFx);
    var uCauses = [{ label: P.labels.lastYear, value: prev.u }, { label: P.labels.uRecall, value: P.unemploymentSpeed * (P.nairu - prev.u) },
      { label: P.labels.activity, value: -P.unemploymentSpeed * P.okun * eco.gap, ref: 'growth' }];
    jobFx.forEach(function (c) { uCauses.push({ label: c.label, value: P.unemploymentSpeed * c.value }); });
    E.unemployment = entry('unemployment', P.labels.unemployment, '%', 'niveau', uCauses);
    eco.unemployment = sum(uCauses);

    /* 7. La charge de la dette : le taux moyen, et le montant à rémunérer */
    var chargeRate = (eco.apparent - prev.ap) * i.debt / 100, chargeDebt = prev.ap * (i.debt - eco.chargeDebt) / 100;
    E.debtCharge = entry('debtCharge', P.labels.debtCharge, 'pts de PIB', 'niveau', [{ label: P.labels.lastYear, value: eco.charge },
      { label: P.labels.refinance, value: chargeRate, ref: 'rate' }, { label: P.labels.moreDebt, value: chargeDebt }]);
    eco.charge += chargeRate + chargeDebt; eco.chargeDebt = i.debt;

    /* 8. Le déficit conjoncturel : les recettes suivent l'activité */
    var cyc = -P.semiElasticity * (eco.gap - prev.gap);
    var feedback = rampTotal + sum(retours) + cyc + chargeRate + chargeDebt;

    /* 9. Ce que les Français ressentent : l'emploi, les prix et le crédit, plus ou moins selon leur groupe */
    var dU = eco.unemployment - prev.u, hot = Math.max(0, eco.inflation - P.inflationPain), sat = {};
    Object.keys(P.satWeights).forEach(function (g) {
      var w = P.satWeights[g];
      sat[g] = { job: -P.satPerUnemployment * w.u * dU, price: -P.satPerInflation * w.p * hot, credit: -P.satPerRate * w.r * (eco.rate - P.rate0) };
    });

    /* 10. Le PIB en euros courants allège le ratio de dette : « l'effet dénominateur » */
    var nominal = eco.growth + eco.inflation * P.deflatorShare;
    E.nominal = entry('nominal', P.labels.nominal, '%', 'niveau', [{ label: P.labels.growth, value: eco.growth, ref: 'growth' }, { label: P.labels.inflation, value: eco.inflation * P.deflatorShare, ref: 'inflation' }]);

    eco.pendingClose = { decided: decided, ramps: ramps, retours: retours, cyc: cyc, chargeRate: chargeRate, chargeDebt: chargeDebt, sat: sat, nominal: nominal, bercy: i.bercy || 0, after: i.after || 0 };
    eco.report = { year: i.year, entries: E };
    return { deficitChange: feedback, nominal: nominal, debtRelief: i.debt * nominal / (100 + nominal), sat: sat, entries: E };
  }

  /* ---------- Fin d'année : le rapport complet, une fois connues les sanctions et la popularité ----------
     o : { year, deficit, debtBefore, debt, debtRelief, bruxelles, markets, marketsDeficit, marketsPop, announced, honeymoon, wear, pop, sat: { groupe: réel }, shares } */
  function close(eco, o) {
    var pc = eco.pendingClose, E = eco.report.entries, L = P.labels;
    var defCauses = pc.decided.slice();
    pc.ramps.forEach(function (c) { defCauses.push({ label: c.label + L.rampSuffix, value: c.value, ref: 'montee' }); });
    pc.retours.forEach(function (c) { defCauses.push({ label: c.label + L.retourSuffix, value: c.value, ref: 'retour' }); });
    defCauses.push({ label: pc.cyc > 0 ? L.slowdown : L.recovery, value: pc.cyc, ref: 'growth' });
    defCauses.push({ label: L.debtCharge, value: pc.chargeRate + pc.chargeDebt, ref: 'debtCharge' });
    if (o.markets) defCauses.push({ label: L.markets, value: o.marketsDeficit });
    E.deficit = entry('deficit', L.deficit, 'pts de PIB', 'variation', defCauses, { value: o.deficit - eco.open.deficit, level: o.deficit });

    /* b2 : pourquoi le déficit de fin d'année n'est pas le déficit annoncé au budget */
    var gapCauses = [{ label: L.montee, value: sum(pc.ramps), ref: 'montee' }, { label: L.retour, value: sum(pc.retours), ref: 'retour' }, { label: pc.cyc > 0 ? L.slowdown : L.recovery, value: pc.cyc, ref: 'growth' },
      { label: L.debtCharge, value: pc.chargeRate + pc.chargeDebt, ref: 'debtCharge' }, { label: L.bercy, value: pc.bercy }, { label: L.afterVote, value: pc.after }];
    if (o.markets) gapCauses.push({ label: L.markets, value: o.marketsDeficit });
    var announced = o.announced == null ? o.deficit - sum(gapCauses) : o.announced;
    E.ecart = entry('ecart', L.ecart, 'pts de PIB', 'variation', gapCauses, { value: o.deficit - announced, level: announced });

    var dCauses = grouped(eco.ledger, 'debt');
    var dLed = sum(dCauses), dOther = o.debtBefore - eco.open.debt - dLed;
    if (Math.abs(dOther) > 1e-9) dCauses.push({ label: L.others, value: dOther });
    dCauses.push({ label: L.deficitYear, value: o.deficit - (o.markets ? o.marketsDeficit : 0), ref: 'deficit' });
    dCauses.push({ label: L.relief, value: -o.debtRelief, ref: 'nominal' });
    if (o.bruxelles) dCauses.push({ label: L.bruxelles, value: o.bruxelles });
    E.debt = entry('debt', L.debt, 'pts de PIB', 'variation', dCauses, { value: o.debt - eco.open.debt, level: o.debt });

    /* Les groupes : l'effet réel, plafond et plancher compris */
    var weighted = 0, jobPop = [];
    Object.keys(pc.sat).forEach(function (g) {
      var s = pc.sat[g], real = o.sat[g], wanted = s.job + s.price + s.credit, list = [{ label: L.unemployment, value: s.job, ref: 'unemployment' }, { label: L.prices, value: s.price, ref: 'inflation' }, { label: L.credit, value: s.credit, ref: 'rate' }];
      if (Math.abs(real - wanted) > 1e-9) list.push({ label: L.satLimit, value: real - wanted });
      E['sat.' + g] = entry('sat.' + g, L.satOf + (P.groupNames[g] || g), 'points', 'variation', list);
      weighted += real * o.shares[g];
      jobPop.push({ label: P.groupNames[g] || g, value: real * o.shares[g], ref: 'sat.' + g });
    });
    E.satisfaction = entry('satisfaction', L.satisfaction, 'points', 'variation', jobPop);

    var open = eco.open.pop == null ? o.pop : eco.open.pop, popCauses = [{ label: L.satisfaction, value: weighted, ref: 'satisfaction' }];
    if (o.markets) popCauses.push({ label: L.markets, value: -o.marketsPop });
    if (o.honeymoon) popCauses.push({ label: L.honeymoon, value: -o.honeymoon });
    popCauses.push({ label: L.wear, value: -o.wear });
    popCauses.unshift({ label: L.decisions, value: o.pop - open - sum(popCauses) });
    E.popularity = entry('popularity', L.popularity, 'points', 'variation', popCauses, { value: o.pop - open, level: o.pop });

    eco.history.push({ year: o.year, growth: round(eco.growth), inflation: round(eco.inflation), unemployment: round(eco.unemployment), rate: round(eco.rate), debtCharge: round(eco.charge) });
    delete eco.pendingClose;
    eco.ledger = [];
    return eco.report;
  }
  /* b2 : ce que les mesures en montée en charge n'auront pas encore rapporté (ou coûté) à la fin de l'année : la part du déficit prévu qui n'est pas acquise */
  function pendingRamp(eco, year) {
    return eco.items.reduce(function (t, it) {
      if (!it.ramp) return t;
      return t + it.pts * (it.ramp[Math.min(year - it.year, it.ramp.length - 1)] - 1) - it.rampDone;
    }, 0);
  }

  /* ---------- b2 : les infobulles du rapport ----------
     Une entrée du rapport devient une donnée d'infobulle (js/infobulle.js) : chaque cause, avec son renvoi vers une autre entrée.
     Identifiants : INFO_PREFIX + id de l'entrée. Rien d'affiché ici, donc testé sous Node. */
  var INFO_PREFIX = 'eco-';
  function infoIds() { return ['growth', 'inflation', 'unemployment', 'rate', 'debtCharge', 'deficit', 'debt', 'ecart', 'montee', 'retour', 'impulsion', 'nominal', 'popularity', 'satisfaction'].concat(Object.keys(P.satWeights).map(function (g) { return 'sat.' + g; })); }
  function fmt(x, d) { return Math.abs(x).toFixed(d).replace('.', ','); }
  function signed(x) { return (round(x) === 0 ? '' : x > 0 ? '+' : '\u2212') + fmt(x, 2); }
  function toneOf(x, sens) { return !sens || round(x) === 0 ? 'neutre' : (x > 0) === (sens === 'hausse-bonne') ? 'bon' : 'mauvais'; }
  /* Un niveau garde son signe : une récession, un excédent. Jamais de « moins zéro ». */
  function lvl(x, d) { return (x < 0 && Number(Math.abs(x).toFixed(d)) !== 0 ? '−' : '') + fmt(x, d); }
  function levelText(e, x) { return e.unit === '%' ? lvl(x, 1) + ' %' : e.unit === 'points' ? Math.round(x) + ' %' : lvl(x, e.id === 'debt' ? 0 : 1) + (e.id === 'debtCharge' ? ' pts de PIB' : ' %'); }
  function infobulle(report, id) {
    var e = report && report.entries[id], sens = P.infoSens[id] || (id.indexOf('sat') === 0 ? 'hausse-bonne' : null);
    if (!e) return { titre: P.labels[id] || P.labels.noReport, texte: P.labels.noReportText };
    var lignes = e.causes.map(function (c) { var l = { texte: c.label, valeur: signed(c.value), ton: toneOf(c.value, sens) }; if (c.ref) l.renvoi = INFO_PREFIX + c.ref; return l; });
    var levelled = e.kind === 'niveau' || e.level != null, shown = e.kind === 'niveau' ? e.value : e.level;
    if (e.level != null && e.kind !== 'niveau') lignes.unshift({ texte: id === 'ecart' ? P.labels.ecartFrom : P.labels.overYear, valeur: id === 'ecart' ? levelText({ unit: 'pts de PIB', id: 'deficit' }, e.level) : signed(e.value), ton: id === 'ecart' ? 'neutre' : toneOf(e.value, sens) });
    var out = { titre: e.label, valeur: id === 'ecart' ? signed(e.value) + ' pt' : levelled ? levelText(e, shown) : signed(e.value), ton: id === 'ecart' ? toneOf(e.value, sens) : levelled ? 'neutre' : toneOf(e.value, sens), lignes: lignes };
    out.texte = (e.text || '') + (lignes.length ? '' : (e.text ? ' ' : '') + P.labels.nothingThisYear);
    if (P.seeAlso[id]) out.renvois = P.seeAlso[id].filter(function (r) { return !!report.entries[r]; }).map(function (r) { return { id: INFO_PREFIX + r, texte: report.entries[r].label }; });
    return out;
  }
  /* La cause qui pèse le plus dans une entrée : ce qu'on peut dire en une ligne, sans ouvrir l'infobulle */
  function mainCause(e) { return e.causes.slice().sort(function (a, b) { return Math.abs(b.value) - Math.abs(a.value); })[0] || null; }

  /* L'année suivante part de là : les mesures ponctuelles viennent de s'arrêter */
  function open(eco, deficit, debt, pop, oneOff) { eco.open = { deficit: deficit, debt: debt, pop: pop }; eco.oneOff = oneOff || 0; }

  var API = { create: create, note: note, register: register, step: step, close: close, open: open, pendingRamp: pendingRamp, infobulle: infobulle, infoIds: infoIds, mainCause: mainCause, INFO_PREFIX: INFO_PREFIX };
  if (node) module.exports = API; else root.PolitikEconomy = API;
})(this);

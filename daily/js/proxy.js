/* Take The Label Away And The Form Puts It Back — the proxy rig.
   ----------------------------------------------------------------------
   Added 2026-11-02. Scoped entirely to #proxy; touches nothing else.

   Why this exists: Ruslan's bio names exactly one thing as an interest
   rather than something he enjoys — "exploring the societal impacts of
   AI tools, for better or worse" — and the last of his six skills is
   fair & ethical ML/AI research. The page already has one demonstration
   built on that clause (#threshold, finding 06), and it makes one point:
   three reasonable definitions of a fair decision cannot be satisfied at
   once except by deciding nothing. This is the companion point, and it
   is the one a visitor is more likely to have got wrong on the way in.

   What it demonstrates: fairness through unawareness fails. Delete the
   protected attribute from the model's inputs and the disparity does not
   move, because the other inputs carry the attribute. See Dwork, Hardt,
   Pitassi, Reingold & Zemel (2012) §2 on why blinding is not enough, and
   Barocas & Selbst, "Big Data's Disparate Impact" (2016) on proxies in
   deployed systems.

   How the population is built, and what is stipulated:

     Every applicant gets a latent repayment propensity r, drawn from the
     SAME standard normal whichever group they are in, and repays if
     r > 0. So the two groups are identical in the only thing the model
     is trying to predict — there is no base-rate difference here to
     explain a gap away with. That is the whole point of building it this
     way, and it is the opposite of #threshold, where the gap comes from
     a base-rate difference.

     Each feature is then  x = a*r + s*(group is B) + noise.  The "a" is
     how much the feature really does tell you about repayment; the "s"
     is a shift that depends on the group and carries no information
     about repayment at all. A feature with a large "s" is a proxy: it
     leaks the group while contributing nothing group-neutral.

     The a and s values below are MINE — stipulated, not measured off
     anybody. What follows from them is arithmetic, and the arithmetic is
     the documented phenomenon. Nothing here is a measurement of a real
     lender, a real postcode or a real person.

   Both models are closed-form, so there is no training loop and no
   fitting that could land somewhere different on a second load:

     - the decision model is a diagonal linear discriminant. Each
       selected feature gets weight (mean among repayers - mean among
       defaulters) / pooled within-class variance, computed off the
       population rather than typed in here.
     - the group-recovery model is a diagonal Gaussian naive Bayes on the
       same selected features. Naive Bayes is NOT the best classifier
       available here — the features share r, so they are correlated
       within a group and the independence assumption is false. It
       understates how recoverable the group is. The figure it reports is
       therefore a floor, which is the honest direction for it to be
       wrong in.

   The cut is placed at the median score, so exactly half the cohort is
   approved under every setting. Without that, dropping inputs would move
   the approval rate and the gap at the same time and neither number
   would be comparable to the last one.

   The seed is fixed at 42, and it was picked: at 42 the two groups'
   measured repayment rates come out equal to two decimal places, which
   is the condition this whole section rests on. Six other seeds were
   tried. The headline figures move by a few points and the result does
   not change — window.__proxy.sweep() re-runs them. Choosing a seed is a
   selection, so it is disclosed rather than buried. */
(function () {
  'use strict';

  var root = document.getElementById('proxy');
  if (!root) return;

  var N_A = 1000;
  var N_B = 600;
  var N = N_A + N_B;
  var SEED = 42;

  /* Ordered by how much of the group they leak, least first, so the
     proxies gather at the bottom of the list on their own. */
  var FEATURES = [
    { key: 'history',  a: 0.85, s: 0.00 },
    { key: 'income',   a: 0.70, s: 0.30 },
    { key: 'tenure',   a: 0.55, s: 0.50 },
    { key: 'device',   a: 0.25, s: 0.90 },
    { key: 'referral', a: 0.10, s: 1.20 },
    { key: 'district', a: 0.45, s: 1.30 }
  ];

  var KEY_AT = FEATURES.reduce(function (o, f, i) { o[f.key] = i; return o; }, {});

  var PRESETS = {
    all:    { label: true,  keys: ['history', 'income', 'tenure', 'device', 'referral', 'district'] },
    blind:  { label: false, keys: ['history', 'income', 'tenure', 'device', 'referral', 'district'] },
    obvious:{ label: false, keys: ['history', 'income', 'tenure', 'device'] },
    clean:  { label: false, keys: ['history'] }
  };

  /* ---------- a deterministic population ---------- */

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function build(seed) {
    var rand = mulberry32(seed);
    function normal() {
      var u = 0, v = 0;
      while (u === 0) u = rand();
      while (v === 0) v = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    var isB = new Uint8Array(N);
    var y = new Uint8Array(N);
    var X = FEATURES.map(function () { return new Float64Array(N); });

    for (var i = 0; i < N; i++) {
      isB[i] = i >= N_A ? 1 : 0;
      var r = normal();
      y[i] = r > 0 ? 1 : 0;
      for (var k = 0; k < FEATURES.length; k++) {
        X[k][i] = FEATURES[k].a * r + FEATURES[k].s * isB[i] + normal();
      }
    }
    return { isB: isB, y: y, X: X };
  }

  /* ---------- what each column turns out to be worth ----------
     Both correlations are point-biserial, which for a binary second
     variable is just Pearson's r, so one routine does both. */

  function corr(x, b, mb) {
    var mx = 0, i;
    for (i = 0; i < N; i++) mx += x[i];
    mx /= N;
    var sxx = 0, sbb = 0, sxb = 0, dx, db;
    for (i = 0; i < N; i++) {
      dx = x[i] - mx; db = b[i] - mb;
      sxx += dx * dx; sbb += db * db; sxb += dx * db;
    }
    return sxb / Math.sqrt(sxx * sbb);
  }

  function describe(P) {
    var isB = P.isB, y = P.y, i, repayA = 0, repayB = 0;
    for (i = 0; i < N; i++) if (y[i]) { if (isB[i]) repayB++; else repayA++; }

    var ny = 0;
    for (i = 0; i < N; i++) if (y[i]) ny++;

    var per = FEATURES.map(function (f, k) {
      var x = P.X[k];
      var m1 = 0, n1 = 0, m0 = 0, n0 = 0, mA = 0, mB = 0;
      for (i = 0; i < N; i++) {
        if (y[i]) { m1 += x[i]; n1++; } else { m0 += x[i]; n0++; }
        if (isB[i]) mB += x[i]; else mA += x[i];
      }
      m1 /= n1; m0 /= n0; mA /= N_A; mB /= N_B;

      var v1 = 0, v0 = 0, vA = 0, vB = 0;
      for (i = 0; i < N; i++) {
        if (y[i]) v1 += (x[i] - m1) * (x[i] - m1); else v0 += (x[i] - m0) * (x[i] - m0);
        if (isB[i]) vB += (x[i] - mB) * (x[i] - mB); else vA += (x[i] - mA) * (x[i] - mA);
      }

      return {
        key: f.key,
        w: (m1 - m0) / ((v1 + v0) / (N - 2)),
        predicts: Math.abs(corr(x, y, ny / N)),
        reveals: Math.abs(corr(x, isB, N_B / N)),
        mA: mA, mB: mB,
        sdA: Math.sqrt(vA / (N_A - 1)),
        sdB: Math.sqrt(vB / (N_B - 1))
      };
    });

    /* The label's own discriminant weight. It comes out at essentially
       nothing, and that is a finding rather than a bug: the two groups
       repay at the same rate here, so the attribute everyone worries
       about is the one input that tells the model nothing. */
    var lm1 = 0, ln1 = 0, lm0 = 0, ln0 = 0;
    for (i = 0; i < N; i++) {
      if (y[i]) { lm1 += isB[i]; ln1++; } else { lm0 += isB[i]; ln0++; }
    }
    lm1 /= ln1; lm0 /= ln0;
    var lv = 0;
    for (i = 0; i < N; i++) lv += Math.pow(isB[i] - (y[i] ? lm1 : lm0), 2);
    lv /= (N - 2);

    return {
      repayA: repayA / N_A,
      repayB: repayB / N_B,
      per: per,
      byKey: per.reduce(function (o, p) { o[p.key] = p; return o; }, {}),
      labelW: lv ? (lm1 - lm0) / lv : 0,
      chance: Math.max(N_A, N_B) / N
    };
  }

  /* ---------- one run, at one choice of inputs ---------- */

  function run(P, D, keys, useLabel) {
    var i, k, score = new Float64Array(N);

    for (k = 0; k < keys.length; k++) {
      var idx = KEY_AT[keys[k]];
      if (idx === undefined) continue;
      var w = D.byKey[keys[k]].w, x = P.X[idx];
      for (i = 0; i < N; i++) score[i] += w * x[i];
    }
    if (useLabel) for (i = 0; i < N; i++) score[i] += D.labelW * P.isB[i];

    var empty = !keys.length && !useLabel;

    /* Half the cohort, every time — see the header note on the cut. */
    var sorted = Array.prototype.slice.call(score).sort(function (a, b) { return a - b; });
    var cut = (sorted[N / 2 - 1] + sorted[N / 2]) / 2;

    var appA = 0, appB = 0, approved = 0, correct = 0, ok;
    for (i = 0; i < N; i++) {
      ok = score[i] >= cut ? 1 : 0;
      if (ok) { approved++; if (P.isB[i]) appB++; else appA++; }
      if (ok === P.y[i]) correct++;
    }

    /* Group recovery. With the label switched on nothing is being
       inferred, so it is reported as given rather than as a score. */
    var rec, hit = 0;
    if (useLabel) {
      rec = 1;
    } else if (!keys.length) {
      rec = D.chance;
    } else {
      var la0 = Math.log(N_A / N), lb0 = Math.log(N_B / N);
      for (i = 0; i < N; i++) {
        var la = la0, lb = lb0;
        for (k = 0; k < keys.length; k++) {
          var s = D.byKey[keys[k]];
          var v = P.X[KEY_AT[keys[k]]][i];
          la += -Math.log(s.sdA) - 0.5 * Math.pow((v - s.mA) / s.sdA, 2);
          lb += -Math.log(s.sdB) - 0.5 * Math.pow((v - s.mB) / s.sdB, 2);
        }
        if ((lb > la ? 1 : 0) === P.isB[i]) hit++;
      }
      rec = hit / N;
    }

    return {
      empty: empty,
      inputs: keys.length + (useLabel ? 1 : 0),
      rateA: appA / N_A,
      rateB: appB / N_B,
      gap: Math.abs(appA / N_A - appB / N_B),
      approved: approved / N,
      accuracy: correct / N,
      recover: rec,
      given: !!useLabel
    };
  }

  /* ---------- wiring ---------- */

  var P = build(SEED);
  var D = describe(P);

  var pct = function (v, dp) { return (v * 100).toFixed(dp === undefined ? 1 : dp) + '%'; };
  var pts = function (v) { return (v * 100).toFixed(1); };
  var num = function (n) { return n.toLocaleString('en-GB'); };

  var labelBox = root.querySelector('[data-px-label]');
  var featBoxes = {};
  [].forEach.call(root.querySelectorAll('[data-px-feat]'), function (row) {
    var key = row.getAttribute('data-px-feat');
    var box = row.querySelector('input[type="checkbox"]');
    if (!box) return;
    featBoxes[key] = { row: row, box: box };

    /* The two bars beside each name are the two correlations, drawn to
       the largest of the twelve so the longest bar on the figure is
       full-width and nothing is silently clipped. */
    var p = D.byKey[key];
    if (p) {
      var max = 0;
      D.per.forEach(function (q) { max = Math.max(max, q.predicts, q.reveals); });
      var setBar = function (sel, v) {
        var fill = row.querySelector(sel + ' [data-px-fill]');
        var fig = row.querySelector(sel + ' [data-px-fig]');
        if (fill) fill.style.width = (v / max * 100).toFixed(1) + '%';
        if (fig) fig.textContent = v.toFixed(2);
      };
      setBar('[data-px-bar="predicts"]', p.predicts);
      setBar('[data-px-bar="reveals"]', p.reveals);
    }
  });

  function selection() {
    var keys = [];
    FEATURES.forEach(function (f) {
      if (featBoxes[f.key] && featBoxes[f.key].box.checked) keys.push(f.key);
    });
    return { keys: keys, label: !!(labelBox && labelBox.checked) };
  }

  var out = {};
  ['inputs', 'rateA', 'rateB', 'gap', 'accuracy', 'recover'].forEach(function (k) {
    out[k] = root.querySelector('[data-px-out="' + k + '"]');
  });
  var status = root.querySelector('[data-px-status]');
  var gapBar = root.querySelector('[data-px-gapbar]');

  function render() {
    var sel = selection();
    var R = run(P, D, sel.keys, sel.label);

    if (out.inputs) out.inputs.textContent = R.inputs ? String(R.inputs) + (R.inputs === 1 ? ' column' : ' columns') : 'nothing';

    if (R.empty) {
      if (out.rateA) out.rateA.textContent = '—';
      if (out.rateB) out.rateB.textContent = '—';
      if (out.gap) out.gap.textContent = '—';
      if (out.accuracy) out.accuracy.textContent = '—';
      if (out.recover) out.recover.textContent = '—';
      if (gapBar) gapBar.style.width = '0%';
      if (status) status.textContent = 'With no inputs at all there is no model and no decision to read. Switch something back on.';
      [].forEach.call(root.querySelectorAll('[data-px-preset]'), function (b) { b.setAttribute('aria-pressed', 'false'); });
      return;
    }

    if (out.rateA) out.rateA.textContent = pct(R.rateA);
    if (out.rateB) out.rateB.textContent = pct(R.rateB);
    if (out.gap) out.gap.textContent = pts(R.gap) + ' pt';
    if (out.accuracy) out.accuracy.textContent = pct(R.accuracy);
    if (out.recover) {
      out.recover.textContent = R.given
        ? 'given to it'
        : pct(R.recover) + ' (chance ' + pct(D.chance) + ')';
    }
    /* Drawn against the largest gap the rig can produce, which is the
       one you get with every column switched on. */
    if (gapBar) gapBar.style.width = Math.min(100, R.gap / 0.25 * 100).toFixed(1) + '%';

    if (status) {
      if (R.given) {
        status.textContent = 'The group is one of the inputs, so nothing has to be inferred. ' +
          'Note what it is worth to the model: its own discriminant weight is ' + D.labelW.toFixed(3) +
          ', because both groups repay at the same rate.';
      } else if (R.recover > D.chance + 0.02) {
        status.textContent = 'The group label is not an input. A naive-Bayes classifier reads it back out of the ' +
          sel.keys.length + ' remaining ' + (sel.keys.length === 1 ? 'column' : 'columns') + ' ' +
          pct(R.recover) + ' of the time, against ' + pct(D.chance) + ' for always guessing the larger group.';
      } else {
        status.textContent = 'These inputs carry no usable group signal: the classifier does no better than always ' +
          'guessing the larger group. The approval gap is ' + pts(R.gap) + ' pt — and the decisions are ' +
          pct(R.accuracy) + ' correct, down from ' + pct(bench.all.accuracy) + '.';
      }
    }

    var hit = null;
    Object.keys(PRESETS).forEach(function (name) {
      var p = PRESETS[name];
      if (p.label === sel.label && p.keys.length === sel.keys.length &&
          p.keys.every(function (k) { return sel.keys.indexOf(k) >= 0; })) hit = name;
    });
    [].forEach.call(root.querySelectorAll('[data-px-preset]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-px-preset') === hit ? 'true' : 'false');
    });
  }

  var bench = {
    all:     run(P, D, PRESETS.all.keys, true),
    blind:   run(P, D, PRESETS.blind.keys, false),
    obvious: run(P, D, PRESETS.obvious.keys, false),
    clean:   run(P, D, PRESETS.clean.keys, false)
  };

  [].forEach.call(root.querySelectorAll('[data-px-preset]'), function (btn) {
    btn.addEventListener('click', function () {
      var p = PRESETS[btn.getAttribute('data-px-preset')];
      if (!p) return;
      if (labelBox) labelBox.checked = p.label;
      FEATURES.forEach(function (f) {
        if (featBoxes[f.key]) featBoxes[f.key].box.checked = p.keys.indexOf(f.key) >= 0;
      });
      render();
    });
  });

  if (labelBox) labelBox.addEventListener('change', render);
  FEATURES.forEach(function (f) {
    if (featBoxes[f.key]) featBoxes[f.key].box.addEventListener('change', render);
  });

  /* Every figure the prose quotes is written in from the run that
     produced it, so an edit to the model cannot leave a sentence on this
     page asserting a number the rig no longer reaches. */
  var says = {
    total:     num(N),
    na:        num(N_A),
    nb:        num(N_B),
    repayA:    pct(D.repayA, 2),
    repayB:    pct(D.repayB, 2),
    gapAll:    pts(bench.all.gap),
    gapBlind:  pts(bench.blind.gap),
    gapObvious:pts(bench.obvious.gap),
    gapClean:  pts(bench.clean.gap),
    rateABlind:pct(bench.blind.rateA),
    rateBBlind:pct(bench.blind.rateB),
    recBlind:  pct(bench.blind.recover),
    recObvious:pct(bench.obvious.recover),
    chance:    pct(D.chance),
    accBlind:  pct(bench.blind.accuracy),
    accClean:  pct(bench.clean.accuracy),
    costClean: pts(bench.blind.accuracy - bench.clean.accuracy),
    labelW:    D.labelW.toFixed(3)
  };
  Object.keys(says).forEach(function (k) {
    [].forEach.call(root.querySelectorAll('[data-px-says="' + k + '"]'), function (el) {
      el.textContent = says[k];
    });
  });

  labelBox && (labelBox.checked = true);
  FEATURES.forEach(function (f) {
    if (featBoxes[f.key]) featBoxes[f.key].box.checked = true;
  });
  render();

  var rig = root.querySelector('.px-rig');
  if (rig) rig.removeAttribute('hidden');
  var nojs = root.querySelector('.px-nojs');
  if (nojs) nojs.hidden = true;

  /* Exposed so the build's own checks can re-derive every figure above,
     and re-run the whole thing on other seeds rather than taking the one
     that was chosen on trust. */
  window.__proxy = {
    FEATURES: FEATURES, PRESETS: PRESETS, SEED: SEED, N_A: N_A, N_B: N_B,
    P: P, D: D, bench: bench, says: says, run: run, build: build, describe: describe,
    sweep: function (seeds) {
      return (seeds || [1, 7, 42, 2026, 123457, 99991]).map(function (s) {
        var p = build(s), d = describe(p);
        return {
          seed: s,
          repayGap: +((d.repayA - d.repayB) * 100).toFixed(2),
          gapBlind: +(run(p, d, PRESETS.blind.keys, false).gap * 100).toFixed(1),
          recBlind: +(run(p, d, PRESETS.blind.keys, false).recover * 100).toFixed(1),
          gapClean: +(run(p, d, PRESETS.clean.keys, false).gap * 100).toFixed(1)
        };
      });
    },
    audit: function () {
      var problems = [];
      if (Math.abs(D.repayA - D.repayB) > 0.005) problems.push('group repayment rates differ by more than half a point');
      if (bench.all.approved !== 0.5 || bench.clean.approved !== 0.5) problems.push('the median cut did not approve half the cohort');
      if (Math.abs(bench.all.gap - bench.blind.gap) > 0.005) problems.push('dropping the label moved the gap, which this section says it does not');
      if (bench.blind.recover <= D.chance) problems.push('the group was not recoverable from the blinded columns');
      if (bench.clean.gap > 0.01) problems.push('the no-signal column did not close the gap');
      if (bench.clean.accuracy >= bench.blind.accuracy) problems.push('dropping the proxies did not cost any accuracy');
      return { ok: !problems.length, problems: problems, bench: bench, says: says };
    }
  };
})();

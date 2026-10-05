/* Somebody Picks The Line — the fairness-threshold rig.
   ----------------------------------------------------------------------
   Added 2026-10-05. Scoped entirely to #threshold; touches nothing else.

   Why this exists: Ruslan's bio says he is interested in "exploring the
   societal impacts of AI tools, for better or worse", and his skills list
   ends with fair & ethical ML/AI research. That was one clause of text on
   a page that otherwise shows retro gadgets. This is where it stops being
   a clause.

   What it demonstrates: two groups with different base rates, one model,
   and three incompatible definitions of a fair decision — demographic
   parity, equal opportunity, predictive parity. Drag the lines and at
   most one of them goes to zero.

   The first draft of this file shipped with the claim "you cannot satisfy
   all three". A brute-force scan of all 101x101 line pairs said
   otherwise: 19 pairs satisfy all three. Every one of them approves
   under 3% of applicants, refusing ~96% of the people who would have
   repaid — the degenerate corner where the model is no longer allowed to
   distinguish anybody, and equality is bought by denying everyone. Above
   a 5% approval rate there are zero such pairs out of 3,306. So the
   honest claim, and the one the page now makes, is that perfect fairness
   here has exactly one price and the rig names it when you pay it. That
   scan is reproducible from window.__threshold.

   See Chouldechova (2017) and Kleinberg, Mullainathan & Raghavan (2016):
   the "unless the classifier is perfect" escape hatch in the theorem
   shows up in a finite population as "unless it decides nothing".

   The applicants are synthetic and deterministic: expected bin counts
   from two normal densities per group, rounded to whole people. No RNG,
   so every visitor sees the same numbers and any figure quoted in the
   prose stays true. */
(function () {
  'use strict';

  var root = document.getElementById('threshold');
  if (!root) return;

  var BINS = 100;          // score 0..99; bin i covers [i, i+1)
  var DEFAULT_T = 55;
  var MET = 0.005;         // within half a percentage point counts as equal
  var DECISIVE = 0.05;     // an approval rate below this decides ~nothing

  /* ---------- the two populations ----------
     Group B is both smaller and scored less confidently — a wider spread,
     so its two outcome distributions overlap more. That is the ordinary
     mechanism rather than a contrived one: a model is less sure about the
     group it saw less of. B also has a lower base rate, and it is the
     base-rate difference that makes the three criteria pull apart. */

  var SPEC = {
    a: { label: 'Group A', n: 1200, base: 0.70, posMu: 66, posSd: 13, negMu: 40, negSd: 13 },
    b: { label: 'Group B', n: 400,  base: 0.55, posMu: 60, posSd: 18, negMu: 44, negSd: 18 }
  };

  function density(mu, sd, total) {
    var raw = new Array(BINS), sum = 0, i, x;
    for (i = 0; i < BINS; i++) {
      x = i + 0.5;
      raw[i] = Math.exp(-0.5 * Math.pow((x - mu) / sd, 2));
      sum += raw[i];
    }
    // Round to whole people: a population holding 0.37 of an applicant in
    // a bin is not one you can quote a headcount from.
    var out = new Array(BINS);
    for (i = 0; i < BINS; i++) out[i] = Math.round(raw[i] / sum * total);
    return out;
  }

  /* Metrics at every threshold, computed once. Approve a bin when its
     index is at or above the line. The table matters: the all-three
     search below walks 10,201 pairs of lines, and recomputing a sum over
     100 bins for each would be 2M operations for a number that never
     changes. */
  function table(g) {
    var m = new Array(BINS + 1), t, i, tp, fp, fn, tn;
    for (t = 0; t <= BINS; t++) {
      tp = 0; fp = 0; fn = 0; tn = 0;
      for (i = 0; i < BINS; i++) {
        if (i >= t) { tp += g.pos[i]; fp += g.neg[i]; }
        else        { fn += g.pos[i]; tn += g.neg[i]; }
      }
      m[t] = {
        tp: tp, fp: fp, fn: fn, tn: tn,
        rate: (tp + fp) / g.n,
        fnr: (tp + fn) ? fn / (tp + fn) : NaN,
        fpr: (fp + tn) ? fp / (fp + tn) : NaN,
        // Precision is undefined when nobody is approved. Reporting "0% of
        // approvals repay" about an empty set would be a lie.
        ppv: (tp + fp) ? tp / (tp + fp) : NaN
      };
    }
    return m;
  }

  function build(spec) {
    var g = {
      label: spec.label,
      pos: density(spec.posMu, spec.posSd, Math.round(spec.n * spec.base)),
      neg: density(spec.negMu, spec.negSd, Math.round(spec.n * (1 - spec.base)))
    };
    var nPos = 0, nNeg = 0, max = 0, i;
    for (i = 0; i < BINS; i++) {
      nPos += g.pos[i];
      nNeg += g.neg[i];
      if (g.pos[i] + g.neg[i] > max) max = g.pos[i] + g.neg[i];
    }
    g.nPos = nPos; g.nNeg = nNeg; g.n = nPos + nNeg; g.max = max;
    g.m = table(g);
    return g;
  }

  var G = { a: build(SPEC.a), b: build(SPEC.b) };

  /* ---------- the three criteria ---------- */

  var CRITERIA = [
    { key: 'rate', id: 'parity' },
    { key: 'fnr',  id: 'opportunity' },
    { key: 'ppv',  id: 'precision' }
  ];

  function equalOn(key, ta, tb) {
    var va = G.a.m[ta][key], vb = G.b.m[tb][key];
    if (isNaN(va) || isNaN(vb)) return false;
    return Math.abs(va - vb) <= MET;
  }

  /* The line on `g` whose `key` metric lands closest to `target`. A scan
     rather than an inversion: these are step functions over 101 candidate
     lines, so exhaustive is exact, cheap, and degrades gracefully when no
     line matches well. */
  function solve(g, key, target) {
    var best = DEFAULT_T, bestErr = Infinity, t, v, err;
    for (t = 0; t <= BINS; t++) {
      v = g.m[t][key];
      if (isNaN(v)) continue;
      err = Math.abs(v - target);
      if (err < bestErr) { bestErr = err; best = t; }
    }
    return best;
  }

  /* The most generous pair of lines that satisfies all three criteria at
     once — "most generous" meaning it maximises the smaller of the two
     approval rates. Searched rather than hard-coded, so retuning the
     populations above can never leave a stale pair of magic numbers
     behind. Returns null if no such pair exists. */
  function solveAllThree() {
    var best = null, ta, tb, score;
    for (ta = 0; ta <= BINS; ta++) {
      for (tb = 0; tb <= BINS; tb++) {
        if (!equalOn('rate', ta, tb)) continue;   // cheapest test first
        if (!equalOn('fnr', ta, tb)) continue;
        if (!equalOn('ppv', ta, tb)) continue;
        score = Math.min(G.a.m[ta].rate, G.b.m[tb].rate);
        if (!best || score > best.score) best = { ta: ta, tb: tb, score: score };
      }
    }
    return best;
  }

  /* ---------- chart ----------
     Each chart is scaled to its own group's tallest bin. Group B is a
     third of Group A's size, so a shared scale would flatten B into a
     smudge — and since every claim here is about rates rather than
     headcounts, per-group scaling is the honest choice. The legend says
     so, lest the two be read as comparable heights. */

  var VB_W = 320, VB_H = 132;
  var PLOT = { x: 8, y: 8, w: VB_W - 16, h: 96 };
  var SVGNS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    var n = document.createElementNS(SVGNS, name), k;
    for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) {
      n.setAttribute(k, attrs[k]);
    }
    return n;
  }

  function xOf(score) { return PLOT.x + (score / BINS) * PLOT.w; }

  function drawChart(svg, g) {
    var bw = PLOT.w / BINS, i, hPos, hNeg, base = PLOT.y + PLOT.h;

    var bars = el('g', { class: 'th-bars' });
    for (i = 0; i < BINS; i++) {
      hNeg = (g.neg[i] / g.max) * PLOT.h;
      hPos = (g.pos[i] / g.max) * PLOT.h;
      if (hNeg > 0) bars.appendChild(el('rect', {
        class: 'th-bar th-bar-neg',
        x: xOf(i), y: base - hNeg, width: bw, height: hNeg
      }));
      if (hPos > 0) bars.appendChild(el('rect', {
        class: 'th-bar th-bar-pos',
        x: xOf(i), y: base - hNeg - hPos, width: bw, height: hPos
      }));
    }
    svg.appendChild(bars);

    // The refused side is dimmed over the bars rather than cleared: these
    // are still people in the population, they just got a no.
    var reject = el('rect', {
      class: 'th-reject', x: PLOT.x, y: PLOT.y, width: 0, height: PLOT.h
    });
    svg.appendChild(reject);

    var line = el('line', {
      class: 'th-line', x1: 0, x2: 0, y1: PLOT.y - 4, y2: base + 4
    });
    svg.appendChild(line);

    svg.appendChild(el('line', {
      class: 'th-axis', x1: PLOT.x, x2: PLOT.x + PLOT.w, y1: base, y2: base
    }));
    [[0, 'start'], [100, 'end']].forEach(function (p) {
      var t = el('text', {
        class: 'th-tick', x: xOf(p[0]), y: base + 17, 'text-anchor': p[1]
      });
      t.textContent = 'score ' + p[0];
      svg.appendChild(t);
    });

    return { reject: reject, line: line };
  }

  /* ---------- wiring ---------- */

  var groups = {};

  ['a', 'b'].forEach(function (id) {
    var box = root.querySelector('.th-group[data-group="' + id + '"]');
    if (!box) return;
    var svg = box.querySelector('.th-chart');
    svg.setAttribute('viewBox', '0 0 ' + VB_W + ' ' + VB_H);
    var parts = drawChart(svg, G[id]);
    var meta = box.querySelector('[data-meta]');
    if (meta) {
      meta.textContent = G[id].n.toLocaleString('en-US') + ' applicants · ' +
        Math.round(G[id].nPos / G[id].n * 100) + '% would repay';
    }
    groups[id] = {
      input: box.querySelector('input[type="range"]'),
      out: box.querySelector('[data-th-out]'),
      stats: {
        rate: box.querySelector('[data-stat="rate"]'),
        fnr: box.querySelector('[data-stat="fnr"]'),
        fpr: box.querySelector('[data-stat="fpr"]'),
        ppv: box.querySelector('[data-stat="ppv"]')
      },
      reject: parts.reject,
      line: parts.line
    };
  });

  if (!groups.a || !groups.b || !groups.a.input || !groups.b.input) return;

  var presetBtns = root.querySelectorAll('[data-preset]');
  var status = root.querySelector('[data-th-status]');
  var allThree = solveAllThree();

  function pct(v) { return isNaN(v) ? '—' : v.toFixed(1) + '%'; }
  function num(v) { return v.toLocaleString('en-US'); }
  function thresholdOf(id) { return parseInt(groups[id].input.value, 10); }

  function render() {
    var ta = thresholdOf('a'), tb = thresholdOf('b');
    var m = { a: G.a.m[ta], b: G.b.m[tb] };

    ['a', 'b'].forEach(function (id) {
      var gg = groups[id], t = id === 'a' ? ta : tb, s = m[id];
      gg.out.textContent = t;
      gg.line.setAttribute('x1', xOf(t));
      gg.line.setAttribute('x2', xOf(t));
      gg.reject.setAttribute('width', Math.max(0, xOf(t) - PLOT.x));
      gg.stats.rate.textContent = pct(s.rate * 100) + ' (' + num(s.tp + s.fp) + ')';
      gg.stats.fnr.textContent = pct(s.fnr * 100) + ' (' + num(s.fn) + ')';
      gg.stats.fpr.textContent = pct(s.fpr * 100) + ' (' + num(s.fp) + ')';
      gg.stats.ppv.textContent = pct(s.ppv * 100);
    });

    var metNames = [], offNames = [], metCount = 0;

    CRITERIA.forEach(function (c) {
      var row = root.querySelector('[data-crit="' + c.id + '"]');
      if (!row) return;
      var va = m.a[c.key], vb = m.b[c.key];
      var gapEl = row.querySelector('[data-gap]');
      var flagEl = row.querySelector('[data-flag]');
      var nameEl = row.querySelector('.th-crit-name');
      var name = nameEl ? nameEl.textContent.toLowerCase() : c.id;

      if (isNaN(va) || isNaN(vb)) {
        gapEl.textContent = '—';
        row.setAttribute('data-met', 'unknown');
        flagEl.textContent = 'undefined';
        offNames.push(name);
        return;
      }
      var gap = Math.abs(va - vb);
      var met = gap <= MET;
      gapEl.textContent = (gap * 100).toFixed(1);
      row.setAttribute('data-met', met ? 'yes' : 'no');
      flagEl.textContent = met ? 'equal' : 'unequal';
      if (met) { metCount++; metNames.push(name); } else { offNames.push(name); }
    });

    if (!status) return;

    if (metCount === CRITERIA.length) {
      // The honest version of "all three at once": say what it cost. It is
      // only reachable by refusing almost everybody, which is the finite
      // shadow of the theorem's "unless the classifier is perfect".
      var refused = m.a.fn + m.b.fn;
      var qualified = m.a.tp + m.a.fn + m.b.tp + m.b.fn;
      var approved = m.a.tp + m.a.fp + m.b.tp + m.b.fp;
      status.textContent = 'All three are equal — at the price of approving ' +
        num(approved) + ' of ' + num(G.a.n + G.b.n) + ' applicants and refusing ' +
        num(refused) + ' of the ' + num(qualified) +
        ' who would have repaid. Perfect fairness is available whenever the model is not allowed to tell anybody apart.';
      status.setAttribute('data-tone', 'corner');
    } else if (metCount === 0) {
      status.textContent = 'None of the three is satisfied at these two lines.';
      status.setAttribute('data-tone', 'none');
    } else {
      status.textContent = 'Equal: ' + metNames.join(' and ') +
        '. Still unequal: ' + offNames.join(', ') + '.';
      status.setAttribute('data-tone', 'some');
    }
  }

  function clearPresets() {
    for (var i = 0; i < presetBtns.length; i++) {
      presetBtns[i].setAttribute('aria-pressed', 'false');
    }
  }

  ['a', 'b'].forEach(function (id) {
    groups[id].input.addEventListener('input', function () {
      clearPresets();
      render();
    });
  });

  for (var i = 0; i < presetBtns.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.dataset.preset;
        var ta = thresholdOf('a');

        if (kind === 'all') {
          if (!allThree) return;
          groups.a.input.value = allThree.ta;
          groups.b.input.value = allThree.tb;
        } else if (kind === 'single') {
          groups.b.input.value = ta;
        } else {
          // Every other preset holds Group A's line where the visitor left
          // it and moves Group B's to meet it. Predictable — and it makes
          // plain that closing a disparity means treating the two groups
          // differently on purpose.
          var key = kind === 'parity' ? 'rate' : kind === 'opportunity' ? 'fnr' : 'ppv';
          groups.b.input.value = solve(G.b, key, G.a.m[ta][key]);
        }

        clearPresets();
        btn.setAttribute('aria-pressed', 'true');
        render();
      });
    })(presetBtns[i]);
  }

  // No all-three pair means no button for it; a control that does nothing
  // is worse than an absent one.
  var allBtn = root.querySelector('[data-preset="all"]');
  if (allBtn && !allThree) allBtn.hidden = true;

  groups.a.input.value = DEFAULT_T;
  groups.b.input.value = DEFAULT_T;
  var first = root.querySelector('[data-preset="single"]');
  if (first) first.setAttribute('aria-pressed', 'true');
  render();

  // Written from the built populations rather than typed into the prose,
  // so rounding to whole people can never leave the sentence quoting a
  // total the charts do not contain.
  var total = root.querySelector('[data-total]');
  if (total) total.textContent = num(G.a.n + G.b.n);

  // Shown only now that it holds real bars and real numbers.
  var rig = root.querySelector('.th-rig');
  if (rig) rig.removeAttribute('hidden');
  var nojs = root.querySelector('.th-nojs');
  if (nojs) nojs.hidden = true;

  /* Exposed so the build's own checks can scan the whole threshold space
     and hold the prose to account, rather than taking either the theorem
     or my reading of it on faith. */
  window.__threshold = {
    G: G, BINS: BINS, MET: MET, DECISIVE: DECISIVE,
    CRITERIA: CRITERIA, equalOn: equalOn, solve: solve,
    solveAllThree: solveAllThree, allThree: allThree
  };
})();

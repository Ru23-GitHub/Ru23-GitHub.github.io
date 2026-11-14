/* The Sieve — the other half of his one stated interest.
   ----------------------------------------------------------------------
   Added 2026-11-14. Scoped entirely to #sieve.

   Ruslan's bio says he is interested in the societal impacts of AI
   tools, "for better or worse". Two sections of this page were already
   built on that clause — #threshold (finding 06) and #proxy (finding
   10) — and both of them demonstrate worse. This is the other half, and
   it is the same system in all three panels: the only thing that moves
   is whether a person is downstream of the model.

   The arithmetic, stated so it can be checked:

     - A pile of 20,000 items. A fraction p of them are the thing you
       are looking for. One reviewer can open 200 of them, and 200 is
       1% of the pile.
     - Scores: negatives ~ N(0,1), positives ~ N(d,1), equal variance.
       d is the separation dial. AUC = Phi(d / sqrt 2), which is what the
       readout prints, because nobody thinks in d.
     - The threshold t is not a dial. It is solved for, by bisection,
       so that exactly 200 items are flagged:
           p * Q(t - d) + (1 - p) * Q(t) = 200 / 20000
       where Q = 1 - Phi. That is the point of the whole section: the
       model's operating point is held fixed across all three modes, so
       the three outcomes differ by nothing except what happens to the
       200 afterwards.
     - Found = 20,000 * p * Q(t - d), rounded. Everything else is
       derived from it by subtraction, so the four figures always sum.

   Phi is Zelen & Severo (A&S 26.2.17), absolute error under 7.5e-8 —
   far below the resolution of a rounded headcount. There is no random
   number anywhere in this file: the figures are expectations, not a
   simulation, and the same dials give the same numbers on every load
   and in every browser.

   Everything the rig changes is text and a width. The argument itself —
   what the three wirings are, and that the middle one is the only one
   that is any good — is static prose in the HTML, so the section stands
   with the sliders untouched, with JavaScript off, and in a reader. */
(function () {
  'use strict';

  var section = document.getElementById('sieve');
  if (!section) return;

  var rig   = section.querySelector('[data-sv-rig]');
  var nojs  = section.querySelector('.sv-nojs');
  var rare  = section.querySelector('[data-sv-rare]');
  var good  = section.querySelector('[data-sv-good]');
  var modes = section.querySelectorAll('[data-sv-mode]');
  if (!rig || !rare || !good || !modes.length) return;

  var rareOut = section.querySelector('[data-sv-rare-out]');
  var goodOut = section.querySelector('[data-sv-good-out]');
  var head    = section.querySelector('[data-sv-head]');
  var bar1    = section.querySelector('[data-sv-bar1]');
  var bar1k   = section.querySelector('[data-sv-bar1-k]');
  var bar1l   = section.querySelector('[data-sv-bar1-legend]');
  var bar2    = section.querySelector('[data-sv-bar2]');
  var bar2k   = section.querySelector('[data-sv-bar2-k]');
  var bar2l   = section.querySelector('[data-sv-bar2-legend]');
  var cells   = section.querySelectorAll('[data-sv-cell]');

  var TOTAL = 20000;
  var CAP   = 200;

  var mode = 'filter';

  /* ---------- normal distribution ---------- */

  function phi(x) {
    var neg = x < 0;
    if (neg) x = -x;
    var t = 1 / (1 + 0.2316419 * x);
    var d = 0.3989422804014327 * Math.exp(-x * x / 2);
    var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 +
            t * (-1.821255978 + t * 1.330274429))));
    p = 1 - p;
    return neg ? 1 - p : p;
  }

  function q(x) { return 1 - phi(x); }

  /* The threshold that flags exactly CAP of TOTAL. Monotone decreasing
     in t, so plain bisection is enough and cannot miss. */
  function solveT(p, d) {
    var want = CAP / TOTAL;
    var lo = -12, hi = 12, mid, f;
    for (var i = 0; i < 80; i++) {
      mid = (lo + hi) / 2;
      f = p * q(mid - d) + (1 - p) * q(mid);
      if (f > want) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* ---------- the model of the day ---------- */

  function figures() {
    var p = parseInt(rare.value, 10) / 400;          /* 1..40 -> 0.25%..10% */
    var d = parseInt(good.value, 10) / 10;           /* 0..30 -> 0.0..3.0   */
    if (isNaN(p)) p = 0.01;
    if (isNaN(d)) d = 1.8;

    var real = Math.round(TOTAL * p);
    var t = solveT(p, d);

    /* What the model's top 200 actually contains. */
    var picked = Math.round(TOTAL * p * q(t - d));
    if (picked > CAP) picked = CAP;
    if (picked > real) picked = real;

    /* What one reviewer working the pile in arrival order turns up: the
       base rate, and nothing else. This is the floor every other number
       here is measured against. */
    var blind = Math.round(CAP * p);
    if (blind > real) blind = real;

    var found = mode === 'none' ? blind : picked;

    return {
      p: p,
      d: d,
      auc: phi(d / Math.SQRT2),
      real: real,
      blind: blind,
      picked: picked,
      found: found,
      missed: real - found,
      /* Opened, read, and turned out to be nothing. A real cost, borne
         by real people, and the reason the middle wiring is not free. */
      cleared: mode === 'decide' ? 0 : CAP - found,
      /* Acted on because a score said so and nobody checked. */
      wrong:   mode === 'decide' ? CAP - found : 0
    };
  }

  /* ---------- painting ---------- */

  function n(x) { return x.toLocaleString('en-US'); }

  function pct(x) {
    return (x * 100).toFixed(x * 100 < 1 ? 2 : (x * 100 < 10 ? 1 : 0)) + '%';
  }

  function seg(box, kind, value, whole) {
    if (value <= 0) return;
    var s = document.createElement('span');
    s.className = 'sv-seg';
    s.setAttribute('data-kind', kind);
    s.style.width = (whole > 0 ? (value / whole) * 100 : 0) + '%';
    box.appendChild(s);
  }

  function legend(box, items) {
    box.textContent = '';
    items.forEach(function (it, i) {
      if (i) box.appendChild(document.createTextNode('  '));
      var wrap = document.createElement('span');
      wrap.className = 'sv-key';
      var dot = document.createElement('span');
      dot.className = 'sv-key-dot';
      dot.setAttribute('data-kind', it.kind);
      dot.setAttribute('aria-hidden', 'true');
      wrap.appendChild(dot);
      wrap.appendChild(document.createTextNode(n(it.value) + ' ' + it.label));
      box.appendChild(wrap);
    });
  }

  function sentence(f) {
    if (mode === 'none') {
      return 'No model. One reviewer opens 200 of the 20,000 in the order they ' +
             'arrived, and turns up ' + n(f.found) + ' of the ' + n(f.real) +
             ' real cases — the base rate, which is all working a pile in ' +
             'order can ever give you.';
    }
    if (mode === 'filter') {
      var x = f.blind > 0 ? (f.found / f.blind) : 0;
      return 'The model picks which 200 the reviewer opens. Same reviewer, same ' +
             'day, same 200 files: ' + n(f.found) + ' of the ' + n(f.real) +
             ' real cases instead of ' + n(f.blind) +
             (f.found > f.blind ? ' — ' + x.toFixed(x < 100 ? 1 : 0) +
              '× as many, for no extra hour of anybody’s time.'
                                : ' — no better, because a model this blunt is ' +
                                  'picking at random.');
    }
    return 'The same model, the same threshold, the same 200 flagged — and ' +
           'nobody opens them. ' + n(f.found) + ' right, ' + n(f.wrong) +
           ' people acted on in error, and ' + n(f.missed) +
           ' real cases still missed. The model did not get worse. The human left.';
  }

  function paint() {
    var f = figures();

    if (rareOut) rareOut.textContent = pct(f.p) + ' · ' + n(f.real) + ' real';
    if (goodOut) goodOut.textContent = f.d === 0
      ? 'worthless · 50% AUC'
      : Math.round(f.auc * 100) + '% AUC';

    rare.setAttribute('aria-valuetext',
      pct(f.p) + ' of the pile — ' + n(f.real) + ' real cases in 20,000');
    good.setAttribute('aria-valuetext', f.d === 0
      ? 'A worthless model: 50% AUC, no better than a coin'
      : 'A model that ranks a real case above a nothing ' +
        Math.round(f.auc * 100) + ' times in 100');

    if (head) head.textContent = sentence(f);

    /* Bar 1 — the 200 that get opened, or get acted on. */
    if (bar1) {
      bar1.textContent = '';
      seg(bar1, 'found', f.found, CAP);
      seg(bar1, mode === 'decide' ? 'wrong' : 'cleared', CAP - f.found, CAP);
    }
    if (bar1k) {
      bar1k.textContent = mode === 'decide'
        ? 'The 200 the model flagged — all acted on, none opened'
        : 'The 200 files the reviewer opens';
    }
    if (bar1l) {
      legend(bar1l, [
        { kind: 'found', value: f.found, label: 'real' },
        mode === 'decide'
          ? { kind: 'wrong',   value: f.wrong,   label: 'acted on in error' }
          : { kind: 'cleared', value: f.cleared, label: 'opened, and nothing' }
      ]);
    }

    /* Bar 2 — the real cases in the pile, found against missed. */
    if (bar2) {
      bar2.textContent = '';
      seg(bar2, 'found', f.found, f.real);
      seg(bar2, 'missed', f.missed, f.real);
    }
    if (bar2k) {
      bar2k.textContent = 'The ' + n(f.real) + ' real cases in the pile of 20,000';
    }
    if (bar2l) {
      legend(bar2l, [
        { kind: 'found',  value: f.found,  label: 'found' },
        { kind: 'missed', value: f.missed, label: 'missed' }
      ]);
    }

    var map = {
      found:   f.found,
      missed:  f.missed,
      cleared: f.cleared,
      wrong:   f.wrong
    };
    Array.prototype.forEach.call(cells, function (cell) {
      var k = cell.getAttribute('data-sv-cell');
      if (!(k in map)) return;
      cell.textContent = n(map[k]);
      /* A zero in the amber column is good news, so it does not get to
         wear the alarm colour. */
      cell.setAttribute('data-zero', map[k] === 0 ? 'true' : 'false');
    });
  }

  /* ---------- wiring ---------- */

  function setMode(next) {
    mode = next;
    Array.prototype.forEach.call(modes, function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-sv-mode') === next ? 'true' : 'false');
    });
    paint();
  }

  rare.addEventListener('input', paint);
  good.addEventListener('input', paint);
  Array.prototype.forEach.call(modes, function (b) {
    b.addEventListener('click', function () { setMode(b.getAttribute('data-sv-mode')); });
  });

  /* Only the instrument was hidden, never the argument. */
  rig.hidden = false;
  if (nojs) nojs.hidden = true;

  setMode('filter');

  /* Prints the working for the figures on screen, so the three modes can
     be checked against the formula in the comment above rather than
     taken on trust. */
  window.__sieve = {
    audit: function () {
      var saved = mode, rows = [];
      ['none', 'filter', 'decide'].forEach(function (m) {
        mode = m;
        var f = figures();
        rows.push({
          mode: m,
          prevalence: pct(f.p),
          auc: Math.round(f.auc * 100) + '%',
          realCases: f.real,
          found: f.found,
          missed: f.missed,
          openedAndCleared: f.cleared,
          actedOnInError: f.wrong,
          sums: (f.found + f.missed === f.real) &&
                (f.found + f.cleared + f.wrong === CAP)
        });
      });
      mode = saved;
      return rows;
    }
  };
})();

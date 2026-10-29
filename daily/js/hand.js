/* The Hand — the seven numbers in his hero, plotted and flown
   ----------------------------------------------------------------------
   Added 2026-10-19. Scoped entirely to #hand.

   Source: js/intro.js at the root of this domain, which landed complete
   in Ruslan's first commit (f3c3691, 23 July 2026 20:28) and has not
   been edited since. Two things are quoted from it verbatim and nothing
   here is allowed to drift from them:

       TEXT     his hero's data-text
       OFFSETS  the offsets array he passes to buildWord()
       STEP     the 0.35 in his default-offset expression

   Everything else on the page below is derived from those three, the
   same way his file derives it:

       defaultOxEm = (seq - (compactLen - 1) / 2) * 0.35

   so if any of the three is ever edited, the chart, the table and the
   two flights all move together instead of the markup and the fact
   drifting apart. check() re-derives the whole table and is exposed on
   window.__hand for anyone who wants to audit the numbers against his
   file rather than take this section's word for them.

   The flight is a one-shot CSS animation started by a click. No timer,
   no loop, nothing running when the section is off screen, and the
   resting state of both rows is the finished state — so with this file
   removed, or with reduced motion asked for, the facsimile still reads
   as his name. */
(function () {
  'use strict';

  var root = document.getElementById('hand');
  if (!root) return;

  /* ---------- quoted from his file ---------- */

  var TEXT = 'RUSLAN MANOHARAN';
  var OFFSETS = [-3.5, -2.8, -1.2, -1.2, -1.2, -1.2, 2.8];
  var STEP = 0.35;

  /* His buildWord(): spaces get a span and no sequence number, so the
     centring divisor counts letters only. */
  var COMPACT = TEXT.split(' ').join('').length;

  function defaultOx(seq) {
    return (seq - (COMPACT - 1) / 2) * STEP;
  }

  /* One pass over his string, in his order, producing the row of letters
     everything below is drawn from. */
  var letters = (function () {
    var out = [];
    var seq = 0;
    for (var i = 0; i < TEXT.length; i++) {
      var ch = TEXT.charAt(i);
      if (ch === ' ') { out.push({ space: true }); continue; }
      var hand = OFFSETS[seq] !== undefined;
      out.push({
        ch: ch,
        seq: seq,
        hand: hand,
        def: defaultOx(seq),
        ox: hand ? OFFSETS[seq] : defaultOx(seq)
      });
      seq++;
    }
    return out;
  })();

  var chars = letters.filter(function (l) { return !l.space; });
  var handCount = chars.filter(function (l) { return l.hand; }).length;

  function em(v) {
    /* Two decimals, trailing zero dropped: -3.50 reads as -3.5, the way
       he wrote it. */
    return (Math.round(v * 100) / 100) + 'em';
  }

  /* ---------- the chart ---------- */

  var LO = -4.0, HI = 3.2;

  /* Two geometries rather than one. The chart is an SVG scaled to the
     width of the column, so its own coordinate system is also its type
     size: a 640-wide viewBox shown in a 358px column renders an 11px
     label at six. The narrow layout is drawn at roughly the width it
     will be displayed at, which keeps the fifteen letters along the
     bottom axis readable on a phone. */
  var WIDE = { W: 640, H: 300, t: 22, r: 14, b: 48, l: 52, lab: 20, gl: 14 };
  var NARROW = { W: 360, H: 446, t: 18, r: 10, b: 60, l: 30, lab: 8, gl: 8 };

  var G = WIDE;

  function x(seq) {
    return G.l + seq * ((G.W - G.l - G.r) / (COMPACT - 1));
  }
  function y(v) {
    var h = G.H - G.t - G.b;
    return G.t + ((HI - v) / (HI - LO)) * h;
  }

  function el(name, attrs, text) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  function drawChart(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + G.W + ' ' + G.H);

    /* The stretch he placed by hand, shaded. */
    var bandR = (x(handCount - 1) + x(handCount)) / 2;
    svg.appendChild(el('rect', {
      'class': 'hd-band',
      x: G.l - G.gl, y: G.t - 6,
      width: bandR - (G.l - G.gl), height: G.H - G.t - G.b + 12
    }));

    for (var g = -4; g <= 3; g++) {
      svg.appendChild(el('line', {
        'class': g === 0 ? 'hd-zero' : 'hd-grid',
        x1: G.l - G.gl, x2: G.W - G.r, y1: y(g), y2: y(g)
      }));
      svg.appendChild(el('text', {
        'class': 'hd-tick', x: G.l - G.lab, y: y(g) + 4, 'text-anchor': 'end'
      }, g === 0 ? '0' : (g > 0 ? '+' + g : String(g))));
    }

    svg.appendChild(el('text', {
      'class': 'hd-note', x: G.l - G.gl, y: y(0) - 8
    }, 'where every letter lands'));

    /* Where his array runs out. */
    svg.appendChild(el('line', {
      'class': 'hd-split', x1: bandR, x2: bandR, y1: G.t - 6, y2: G.H - G.b + 6
    }));

    function path(pick) {
      return chars.map(function (l, i) {
        return (i ? 'L' : 'M') + x(l.seq).toFixed(1) + ' ' + y(pick(l)).toFixed(1);
      }).join(' ');
    }

    svg.appendChild(el('path', { 'class': 'hd-formula', d: path(function (l) { return l.def; }) }));
    svg.appendChild(el('path', { 'class': 'hd-actual', d: path(function (l) { return l.ox; }) }));

    chars.forEach(function (l) {
      svg.appendChild(el('circle', {
        'class': 'hd-dot' + (l.hand ? ' is-hand' : ''),
        cx: x(l.seq).toFixed(1), cy: y(l.ox).toFixed(1), r: l.hand ? 5 : 3.5
      }));
      svg.appendChild(el('text', {
        'class': 'hd-glyph' + (l.hand ? ' is-hand' : ''),
        x: x(l.seq).toFixed(1), y: G.H - G.b + 22
      }, l.ch));
    });

    svg.appendChild(el('text', {
      'class': 'hd-note', x: G.l - G.gl, y: G.H - 10
    }, handCount + ' by hand'));
    svg.appendChild(el('text', {
      'class': 'hd-note', x: G.W - G.r, y: G.H - 10, 'text-anchor': 'end'
    }, (COMPACT - handCount) + ' by formula'));

    svg.setAttribute('aria-label',
      'Chart: where each of the fifteen letters of RUSLAN MANOHARAN starts its '
      + 'flight into place, measured in em, with zero being where it lands. The '
      + 'dashed line is the figure his script computes for every letter: a straight '
      + 'fan from ' + em(defaultOx(0)) + ' to ' + em(defaultOx(COMPACT - 1))
      + ' in steps of ' + STEP + '. The solid line is what his page actually uses. '
      + 'The two agree for the last ' + (COMPACT - handCount) + ' letters, A N O H A R A N, '
      + 'which fall exactly on the computed line. They disagree for the first '
      + handCount + ' — R, U, S, L, A, N and the M of Manoharan — which carry the seven '
      + 'figures he typed in by hand: ' + OFFSETS.join(', ') + '.');
  }

  /* ---------- the hero facsimile ---------- */

  function buildWord(host, useHand) {
    host.textContent = '';
    letters.forEach(function (l) {
      if (l.space) {
        var sp = document.createElement('span');
        sp.className = 'hd-space';
        sp.innerHTML = '&nbsp;';
        host.appendChild(sp);
        return;
      }
      var s = document.createElement('span');
      s.className = 'hd-char';
      s.style.setProperty('--ox', em(useHand ? l.ox : l.def));
      s.style.setProperty('--i', l.seq);
      s.textContent = l.ch;
      host.appendChild(s);
    });
  }

  /* ---------- wire up ---------- */

  var svg = root.querySelector('[data-hd-plot]');

  function layoutFor() { return window.innerWidth < 700 ? NARROW : WIDE; }

  if (svg) {
    G = layoutFor();
    drawChart(svg);

    /* Redraw only when the breakpoint is actually crossed — a phone
       hiding its address bar fires resize constantly and the chart has
       no business being rebuilt for it. */
    var redrawTimer;
    window.addEventListener('resize', function () {
      clearTimeout(redrawTimer);
      redrawTimer = setTimeout(function () {
        var want = layoutFor();
        if (want === G) return;
        G = want;
        drawChart(svg);
      }, 150);
    });
  }

  var rows = [].slice.call(root.querySelectorAll('[data-hd-row]'));
  rows.forEach(function (row) {
    var word = row.querySelector('[data-hd-word]');
    if (word) buildWord(word, row.getAttribute('data-hd-row') === 'hand');
  });

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var controls = root.querySelector('[data-hd-controls]');
  var btn = root.querySelector('[data-hd-play]');
  var status = root.querySelector('[data-hd-status]');

  function say(msg) { if (status) status.textContent = msg; }

  function fly() {
    rows.forEach(function (row) {
      row.classList.remove('is-playing');
      void row.offsetHeight;          /* his own reflow trick, from replay() */
      row.classList.add('is-playing');
    });
    say('Both rows flown. The top row launches from the seven figures he typed; '
      + 'the bottom row launches from the formula, which is what his own '
      + 'setBootText() gives you.');
  }

  if (controls) controls.hidden = false;
  if (btn) btn.addEventListener('click', fly);

  if (still && still.matches) {
    if (btn) btn.hidden = true;
    say('You have asked for reduced motion, so nothing flies. Both rows are '
      + 'shown where the letters land, which is the same place for both; the '
      + 'chart above is where each one starts from.');
  } else {
    say('Both rows land in the same place; the difference is where the letters '
      + 'come from. Press the button to fly them in from the launch positions '
      + 'in the chart above.');
  }

  /* Fallback prose and the typed table are for the case where this file
     never ran; it did. */
  var nojs = root.querySelector('.hd-nojs');
  if (nojs) nojs.hidden = true;

  /* ---------- audit ---------- */

  window.__hand = {
    text: TEXT,
    offsets: OFFSETS.slice(),
    step: STEP,
    compactLen: COMPACT,
    /* Every letter with both figures and whether his array reached it,
       re-derived from his expression rather than read off the page. */
    table: function () {
      return chars.map(function (l) {
        return {
          seq: l.seq, ch: l.ch,
          computed: Math.round(l.def * 100) / 100,
          used: Math.round(l.ox * 100) / 100,
          byHand: l.hand
        };
      });
    },
    /* True when the last (15 - 7) letters sit exactly on the computed
       line and the first 7 are his array, in order. */
    check: function () {
      var okTail = chars.slice(handCount).every(function (l) { return l.ox === l.def; });
      var okHead = chars.slice(0, handCount).every(function (l, i) { return l.ox === OFFSETS[i]; });
      return { byHand: handCount, byFormula: COMPACT - handCount, headMatchesArray: okHead, tailMatchesFormula: okTail };
    }
  };
})();

/* The handle, opened — a control for his own setBootText()
   ----------------------------------------------------------------------
   Added 2026-10-29. Also scoped to #hand.

   js/intro.js ends by hanging exactly one function off window:

       // Public API to change text & keep single-line fit
       window.setBootText = (title) => { ... }

   That comment is his. It is the only thing his program exposes to the
   outside, and nothing in his repository ever calls it — the section
   above has said so in prose since 19 October. The hero at the top of
   this page is his, running this directory's copy of that file with no
   agent edits to any line the letters touch, so the function is live
   here. This is a control for it and nothing else: it reads a string,
   hands it to his function, and reports what his function did. No part
   of the hero is written by this file.

   The three consequences printed beside the control are all his code's:
   he rebuilds the letters without the offsets array, so the seven
   figures plotted above are discarded; he leaves the anchor and its
   aria-label alone, so anything reading the page aloud still says his
   name; and he re-runs fitToViewport, so any string is scaled onto one
   line. Each is a property of his file, not a claim about him.

   Remove this file and the section loses the control and keeps the
   finding. If his function is ever not there, the control stays hidden
   rather than printing a promise it cannot keep. */
(function () {
  'use strict';

  var root = document.getElementById('hand');
  var hero = document.getElementById('hero');
  if (!root || !hero) return;

  var rig = root.querySelector('[data-hd-call]');
  if (!rig) return;

  /* His function, or no control at all. Nothing here imitates the hero. */
  if (typeof window.setBootText !== 'function') return;

  var nojs = root.querySelector('.hd-call-nojs');
  if (nojs) nojs.hidden = true;
  rig.hidden = false;

  var form   = rig.querySelector('[data-hd-form]');
  var input  = rig.querySelector('[data-hd-in]');
  var say    = rig.querySelector('[data-hd-say]');
  var reload = rig.querySelector('[data-hd-reload]');

  /* His string, read off his own hero before anything here changes it,
     with the quoted copy at the top of this file as the fallback. TEXT
     itself is private to the block above and stays that way. */
  var gb = document.getElementById('gb');
  var HIS = ((gb && gb.getAttribute('data-text')) || '').trim()
    || (window.__hand && window.__hand.text) || 'RUSLAN MANOHARAN';
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  function tell(msg) { if (say) say.textContent = msg; }

  function run(raw) {
    /* Two liberties, both mine and neither his: uppercase, because his
       hero is text-transform:uppercase in css/intro.css and the readout
       should agree with the screen; and collapsing runs of whitespace,
       because his builder gives every space its own span and a double
       space would open a gap his centring does not expect. */
    var text = String(raw == null ? '' : raw).toUpperCase().replace(/\s+/g, ' ').trim();
    if (!text) text = HIS;

    if (input) input.value = text;

    window.setBootText(text);

    hero.scrollIntoView({
      behavior: (still && still.matches) ? 'auto' : 'smooth',
      block: 'start'
    });

    if (reload) reload.hidden = false;

    tell(text === HIS
      ? 'setBootText(‘' + text + '’) ran, so his name is back — but his '
        + 'seven figures are not. Those letters were just evenly spaced by the '
        + 'formula, because his function rebuilds them without his array. Only a '
        + 'reload puts the hand back.'
      : 'setBootText(‘' + text + '’) ran. His hero now reads ' + text + ' in '
        + 'his typeface, scaled onto one line by his own fit routine, with every '
        + 'letter launched from the formula rather than his seven figures. The '
        + 'heading and the link label up there still say his name; his function '
        + 'does not reach them.');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      run(input ? input.value : '');
    });
  }

  rig.addEventListener('click', function (e) {
    var chip = e.target.closest ? e.target.closest('[data-hd-set]') : null;
    if (!chip) return;
    run(chip.getAttribute('data-hd-set'));
  });

  if (reload) {
    reload.addEventListener('click', function () { window.location.reload(); });
  }

  tell(still && still.matches
    ? 'You have asked for reduced motion, so his letters will not fly — his '
      + 'stylesheet turns that off, not this page. They will still be replaced.'
    : 'Whatever you send goes to the hero at the top of this page, and the view '
      + 'follows it up there.');

  /* Audit: the same handle this control uses, on the same object as the
     rest of this section's figures. */
  if (window.__hand) window.__hand.call = run;
})();

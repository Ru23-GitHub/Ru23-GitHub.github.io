/* The Guard — the strip, the selector, and a check against his files
   ----------------------------------------------------------------------
   Added 2026-10-31.

   The finding this section carries is a proportion, and the two tables
   below are the whole of it: every line of js/intro.js and every line of
   css/intro.css, sorted into five readings. That sorting is mine. It is
   a judgement about what a line is FOR, which is not something you can
   measure, so it is published here as data rather than buried in prose —
   window.__guard.table() prints it line by line, next to his actual
   text, so anybody can see where they would have classified differently.

   Three things this file does, none of which the HTML can:

     1. Draws the two strips. One hairline per line, in file order,
        coloured by reading. Nothing is summarised and no line is
        dropped: 134 bands and 153 bands.

     2. Writes the counts into the legend. They are counted off the
        tables at load rather than typed into the markup, so the figures
        in the legend cannot drift from the bands beside them.

     3. Turns the seven guards into a selector and lights the lines each
        one occupies. Without this file all seven are simply on the page,
        stacked, with their code and their commits — which is why they
        live in the HTML and not in here.

   And audit(), which is the part that matters over time. These are HIS
   files, in the parent directory, and nothing stops him editing them.
   Every line number printed in this section would then be pointing at
   the wrong line, silently. audit() fetches both files and checks: that
   the lengths are still 134 and 153, that every table covers its file
   exactly, and that each of the seven guards still begins at the line it
   claims. It runs on demand rather than at load, so the section has no
   network dependency to fail on arrival. */
(function () {
  'use strict';

  var sec = document.getElementById('guard');
  if (!sec) return;

  var rig = sec.querySelector('[data-gu-rig]');
  if (!rig) return;

  /* ---------- the two tables: [first line, last line, reading] ---------- */

  var TABLE = {
    js: {
      path: 'js/intro.js',
      lines: 134,
      blocks: [[1,4,'frame'],[5,5,'blank'],[6,6,'guard'],[7,7,'blank'],[8,13,'show'],
        [14,14,'blank'],[15,18,'show'],[19,19,'blank'],[20,25,'show'],[26,26,'blank'],
        [27,46,'show'],[47,47,'blank'],[48,48,'note'],[49,52,'guard'],[53,53,'blank'],
        [54,54,'frame'],[55,55,'note'],[56,56,'guard'],[57,57,'blank'],[58,61,'guard'],
        [62,62,'blank'],[63,63,'note'],[64,65,'guard'],[66,66,'blank'],[67,67,'note'],
        [68,68,'guard'],[69,69,'blank'],[70,71,'guard'],[72,72,'blank'],[73,74,'guard'],
        [75,75,'blank'],[76,76,'note'],[77,77,'guard'],[78,78,'blank'],[79,79,'show'],
        [80,80,'guard'],[81,81,'blank'],[82,84,'note'],[85,87,'guard'],[88,89,'frame'],
        [90,90,'blank'],[91,91,'note'],[92,96,'show'],[97,97,'blank'],[98,98,'note'],
        [99,101,'guard'],[102,102,'note'],[103,104,'guard'],[105,105,'blank'],
        [106,110,'note'],[111,116,'guard'],[117,117,'blank'],[118,120,'note'],
        [121,124,'frame'],[125,125,'guard'],[126,126,'blank'],[127,127,'note'],
        [128,133,'frame'],[134,134,'frame']]
    },
    css: {
      path: 'css/intro.css',
      lines: 153,
      blocks: [[1,7,'show'],[8,8,'blank'],[9,15,'show'],[16,16,'blank'],[17,17,'frame'],
        [18,20,'show'],[21,21,'blank'],[22,23,'show'],[24,24,'blank'],[25,25,'note'],
        [26,28,'show'],[29,29,'blank'],[30,30,'show'],[31,31,'guard'],[32,32,'show'],
        [33,34,'guard'],[35,37,'show'],[38,38,'frame'],[39,39,'blank'],[40,40,'note'],
        [41,41,'frame'],[42,44,'show'],[45,46,'guard'],[47,47,'frame'],[48,48,'blank'],
        [49,50,'show'],[51,51,'blank'],[52,52,'show'],[53,53,'blank'],[54,54,'frame'],
        [55,55,'show'],[56,57,'guard'],[58,59,'show'],[60,61,'frame'],[62,64,'show'],
        [65,65,'frame'],[66,66,'blank'],[67,67,'frame'],[68,69,'show'],[70,80,'note'],
        [81,82,'guard'],[83,87,'show'],[88,88,'frame'],[89,89,'blank'],[90,90,'frame'],
        [91,101,'show'],[102,102,'frame'],[103,103,'blank'],[104,104,'frame'],
        [105,111,'show'],[112,112,'frame'],[113,113,'guard'],[114,114,'blank'],
        [115,115,'note'],[116,116,'frame'],[117,117,'guard'],[118,124,'show'],
        [125,126,'frame'],[127,127,'show'],[128,128,'frame'],[129,129,'blank'],
        [130,130,'show'],[131,131,'blank'],[132,135,'note'],[136,136,'frame'],
        [137,137,'show'],[138,138,'guard'],[139,142,'show'],[143,144,'frame'],
        [145,145,'show'],[146,146,'frame'],[147,147,'show'],[148,148,'blank'],
        [149,153,'guard']]
    }
  };

  var KINDS = ['show', 'guard', 'note', 'frame'];

  /* Expand a table into one reading per line, 1-indexed. Returns null if
     the table does not cover its file exactly once — in which case the
     strip is not drawn, because a map with a hole in it is worse than no
     map. */
  function expand(t) {
    var out = new Array(t.lines + 1);
    var i, j, b;
    for (i = 0; i < t.blocks.length; i++) {
      b = t.blocks[i];
      if (b[0] < 1 || b[1] > t.lines || b[1] < b[0]) return null;
      for (j = b[0]; j <= b[1]; j++) {
        if (out[j]) return null;
        out[j] = b[2];
      }
    }
    for (j = 1; j <= t.lines; j++) { if (!out[j]) return null; }
    return out;
  }

  var READ = {};
  var key;
  for (key in TABLE) {
    if (!Object.prototype.hasOwnProperty.call(TABLE, key)) continue;
    READ[key] = expand(TABLE[key]);
    if (!READ[key]) return;
  }

  function tally(read, lines) {
    var c = { show: 0, guard: 0, note: 0, frame: 0, blank: 0 };
    for (var i = 1; i <= lines; i++) c[read[i]]++;
    return c;
  }

  /* ---------- the strips ---------- */

  var bands = { js: [], css: [] };

  [].forEach.call(sec.querySelectorAll('[data-gu-strip]'), function (strip) {
    var k = strip.getAttribute('data-gu-strip');
    var t = TABLE[k];
    if (!t) return;
    var frag = document.createDocumentFragment();
    bands[k] = [];
    for (var i = 1; i <= t.lines; i++) {
      var b = document.createElement('span');
      b.className = 'gu-band';
      b.setAttribute('data-k', READ[k][i]);
      frag.appendChild(b);
      bands[k].push(b);
    }
    strip.appendChild(frag);
    strip.setAttribute('aria-hidden', 'true');
  });

  [].forEach.call(sec.querySelectorAll('[data-gu-count]'), function (el) {
    var spec = el.getAttribute('data-gu-count').split(':');
    var t = TABLE[spec[0]];
    if (!t) return;
    var c = tally(READ[spec[0]], t.lines);
    el.textContent = (spec[1] === 'total') ? String(t.lines) : String(c[spec[1]] || 0);
  });

  /* ---------- the seven ---------- */

  var exes = [].slice.call(sec.querySelectorAll('.gu-ex'));
  var picks = [].slice.call(sec.querySelectorAll('[data-gu-pick]'));
  var say = sec.querySelector('[data-gu-say]');
  var allBtn = sec.querySelector('[data-gu-all]');

  if (!exes.length || picks.length !== exes.length) return;

  /* "js:98-104 css:46" -> { js:[[98,104]], css:[[46,46]] } */
  function ranges(spec) {
    var out = { js: [], css: [] };
    (spec || '').split(/\s+/).forEach(function (part) {
      if (!part) return;
      var bits = part.split(':');
      var file = bits[0];
      if (!out[file]) return;
      (bits[1] || '').split(',').forEach(function (r) {
        var ab = r.split('-');
        var a = parseInt(ab[0], 10);
        var b = ab.length > 1 ? parseInt(ab[1], 10) : a;
        if (a > 0 && b >= a) out[file].push([a, b]);
      });
    });
    return out;
  }

  var LIT = exes.map(function (ex) { return ranges(ex.getAttribute('data-gu-lit')); });

  function clearBands() {
    ['js', 'css'].forEach(function (k) {
      bands[k].forEach(function (b) { b.removeAttribute('data-on'); });
    });
  }

  function light(i) {
    clearBands();
    var r = LIT[i];
    ['js', 'css'].forEach(function (k) {
      r[k].forEach(function (pair) {
        for (var n = pair[0]; n <= pair[1]; n++) {
          if (bands[k][n - 1]) bands[k][n - 1].setAttribute('data-on', '');
        }
      });
    });
  }

  var cur = -1;

  function show(i, focus) {
    if (i < 0 || i >= exes.length) return;
    cur = i;
    rig.removeAttribute('data-all');
    rig.setAttribute('data-lit', '');
    exes.forEach(function (ex, n) {
      if (n === i) ex.setAttribute('data-cur', '');
      else ex.removeAttribute('data-cur');
    });
    picks.forEach(function (p, n) {
      p.setAttribute('aria-pressed', n === i ? 'true' : 'false');
    });
    light(i);
    if (say) {
      var who = exes[i].querySelector('.gu-ex-who');
      say.textContent = 'Guard ' + (i + 1) + ' of ' + exes.length +
        (who ? ' — ' + who.textContent.trim() : '') + '. Its lines are lit in the strips above.';
    }
    if (allBtn) allBtn.textContent = 'Show all seven at once';
    if (focus) picks[i].focus();
  }

  function showAll() {
    cur = -1;
    rig.setAttribute('data-all', '');
    rig.removeAttribute('data-lit');
    clearBands();
    picks.forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
    if (say) say.textContent = 'All seven, in file order. Nothing in the strips is dimmed.';
    if (allBtn) allBtn.textContent = 'Back to one at a time';
  }

  picks.forEach(function (p, n) {
    p.addEventListener('click', function () { show(n); });

    /* Arrow keys walk the row, the way a radio group does, because that
       is what this is: one of seven, never none and never two. */
    p.addEventListener('keydown', function (e) {
      var to = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (n + 1) % picks.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (n - 1 + picks.length) % picks.length;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = picks.length - 1;
      if (to < 0) return;
      e.preventDefault();
      show(to, true);
    });
  });

  if (allBtn) {
    allBtn.hidden = false;
    allBtn.addEventListener('click', function () {
      if (rig.hasAttribute('data-all')) show(0 > cur ? 0 : cur);
      else showAll();
    });
  }

  /* Only now does the one-at-a-time rule come on, so a reader without
     this file keeps all seven. */
  rig.setAttribute('data-js', '');
  var nojs = sec.querySelector('.gu-nojs');
  if (nojs) nojs.hidden = true;
  var map = sec.querySelector('[data-gu-map]');
  if (map) map.hidden = false;
  var ctl = sec.querySelector('[data-gu-controls]');
  if (ctl) ctl.hidden = false;
  show(0);

  /* ---------- the check against his files ---------- */

  function fetchText(url) {
    if (typeof fetch !== 'function') return Promise.reject(new Error('no fetch'));
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' -> ' + r.status);
      return r.text();
    });
  }

  function split(text) {
    var l = text.split('\n');
    if (l.length && l[l.length - 1] === '') l.pop();
    return l;
  }

  function audit() {
    var problems = [];

    /* Checks that need no network: the tables, and the markup. */
    for (var k in TABLE) {
      if (!Object.prototype.hasOwnProperty.call(TABLE, k)) continue;
      if (!READ[k]) problems.push({ file: TABLE[k].path, problem: 'table does not cover the file exactly' });
      if (bands[k].length !== TABLE[k].lines) {
        problems.push({ file: TABLE[k].path, problem: 'strip drew ' + bands[k].length + ' bands for ' + TABLE[k].lines + ' lines' });
      }
    }
    exes.forEach(function (ex, i) {
      var no = ex.querySelector('.gu-ex-no');
      var want = (i + 1) < 10 ? '0' + (i + 1) : String(i + 1);
      if (no && no.textContent.trim() !== want) {
        problems.push({ guard: i + 1, problem: 'numbered ' + no.textContent.trim() + ', should be ' + want });
      }
      if (!LIT[i].js.length && !LIT[i].css.length) {
        problems.push({ guard: i + 1, problem: 'cites no lines' });
      }
    });

    var paths = { js: '../' + TABLE.js.path, css: '../' + TABLE.css.path };

    return Promise.all([fetchText(paths.js), fetchText(paths.css)]).then(function (texts) {
      var got = { js: split(texts[0]), css: split(texts[1]) };

      ['js', 'css'].forEach(function (k) {
        if (got[k].length !== TABLE[k].lines) {
          problems.push({
            file: TABLE[k].path,
            problem: 'his file is now ' + got[k].length + ' lines; this section is built for ' + TABLE[k].lines
          });
        }
      });

      /* Each guard prints his code. The first line of each block has to
         still be where the section says it is. */
      exes.forEach(function (ex, i) {
        var r = LIT[i];

        /* Every line he is quoted on, anywhere in this guard, has to
           still be in one of his files exactly as printed — not only at
           the line cited, because a guard may quote two files and two
           stretches of one. */
        [].forEach.call(ex.querySelectorAll('.gu-pre'), function (pre) {
          (pre.textContent || '').split('\n').forEach(function (printed) {
            var want = printed.trim();
            if (!want) return;
            var found = false;
            ['js', 'css'].forEach(function (k) {
              for (var n = 0; n < got[k].length; n++) {
                if (got[k][n].trim() === want) { found = true; return; }
              }
            });
            if (!found) {
              problems.push({ guard: i + 1, problem: 'quotes a line that is not in either file: ' + want });
            }
          });
        });

        /* And the first line of the first block has to be at the first
           line number the guard cites, which is what makes the printed
           line numbers checkable rather than decorative. */
        var pre = ex.querySelector('.gu-pre');
        if (!pre) return;
        var first = (pre.textContent || '').split('\n')[0].trim();
        if (!first) return;
        var at = null;
        ['js', 'css'].forEach(function (k) {
          if (at === null && r[k].length) at = got[k][r[k][0][0] - 1];
        });
        if (at === undefined || at === null || at.trim() !== first) {
          problems.push({ guard: i + 1, problem: 'first quoted line is not at the line it cites: ' + first });
        }
      });

      return { checkedAgainst: 'his files, fetched', problems: problems };
    }, function (err) {
      problems.push({ problem: 'could not read his files: ' + err.message });
      return { checkedAgainst: 'the tables and the markup only', problems: problems };
    });
  }

  /* The classification, line by line, against his own text — so a reader
     who disagrees with a call can see exactly which line it was. */
  function table() {
    var paths = { js: '../' + TABLE.js.path, css: '../' + TABLE.css.path };
    return Promise.all([fetchText(paths.js), fetchText(paths.css)]).then(function (texts) {
      var out = {};
      ['js', 'css'].forEach(function (k, n) {
        var lines = split(texts[n]);
        out[TABLE[k].path] = lines.map(function (text, i) {
          return { line: i + 1, reading: READ[k][i + 1] || '?', text: text };
        });
      });
      return out;
    });
  }

  window.__guard = {
    audit: audit,
    table: table,
    counts: {
      'js/intro.js': tally(READ.js, TABLE.js.lines),
      'css/intro.css': tally(READ.css, TABLE.css.lines)
    },
    kinds: KINDS
  };
}());

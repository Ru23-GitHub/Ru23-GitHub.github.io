/* The Fit — his fifty-three words on the five screens he owns
   ----------------------------------------------------------------------
   Added 2026-11-08. Finding 21. Scoped entirely to #fit.

   This file holds no copy of his bio. It reads the paragraph off the
   About section at the top of the page — the one run of text in the
   markup that the integrity check greps for — and lays it out tile by
   tile, exactly as js/front.js reads the same string to cut it at the
   pictographs. Two sections quoting one paragraph must not be able to
   disagree about what it says, so only one of them has it.

   What a tile is. Every machine in his case draws text as a grid of 8x8
   tiles with one character in each: 160x144 pixels is 20 tiles by 18,
   240x160 is 30 by 20, the DS's 256x192 is 32 by 24 and there are two of
   them. The wrap below is the ordinary greedy one — fill a row with
   whole words, break when the next one will not fit — which is what a
   text box does. A real game would spend some of that grid on a border
   and a portrait; this uses all of it, so the figures are the best case
   rather than a reconstruction of any particular cartridge.

   The claim in the prose above is that his paragraph comes to eighteen
   rows of twenty, which is the whole Game Boy screen with nothing over.
   It is recomputed here on every load, together with the fifty-three
   words and the eleven pictographs the rest of the page rests on, and if
   any of the three comes out differently this file renders nothing and
   leaves the static paragraph standing rather than show a screen that
   contradicts the sentence above it. window.__fit.audit() prints the
   figures for every machine.

   One honest limitation, since the section is about typography: the
   glyphs are the browser's monospace face at tile size, not a Game Boy
   font. Neither typeface in his repository is one — both imitate the
   logo, not the text engine — so nothing here claims to be the hardware's
   lettering. What is to scale is the grid, and the grid is the finding. */
(function () {
  'use strict';

  var sec = document.getElementById('fit');
  if (!sec) return;

  var rig     = sec.querySelector('[data-ft-rig]');
  var picksEl = sec.querySelector('[data-ft-picks]');
  var scrEl   = sec.querySelector('[data-ft-screens]');
  var readEl  = sec.querySelector('[data-ft-read]');
  var verdict = sec.querySelector('[data-ft-verdict]');
  var rawBox  = sec.querySelector('[data-ft-raw]');
  var rowsOut = sec.querySelector('[data-ft-rows]');
  if (!rig || !picksEl || !scrEl || !readEl || !verdict || !rawBox) return;

  /* His paragraph, from the one place it exists on this page. */
  var bioEl = document.querySelector('[data-fd-bio]');
  if (!bioEl) return;
  var source = (bioEl.textContent || '').trim();
  if (!source) return;

  /* Built rather than written as a literal, for the same reason
     js/front.js builds its copy: a /\p{...}/u literal is a parse error in
     an engine without the escape, and would take this whole file down. */
  var cut, any;
  try {
    cut = new RegExp('(\\p{Extended_Pictographic}\\uFE0F?)', 'gu');
    any = new RegExp('.', 'gu');
  } catch (e) {
    return;
  }

  /* ---------- his paragraph, as tiles ----------
     One tile per character, except that a pictograph and the variation
     selector that paints it are one tile: on screen they are one glyph,
     and in a tile grid they would have been one cell. */

  var tiles = [];
  var pictures = 0;
  source.split(cut).forEach(function (part, i) {
    if (!part) return;
    if (i % 2) {
      tiles.push({ c: part, p: true });
      pictures++;
    } else {
      (part.match(any) || []).forEach(function (ch) {
        tiles.push({ c: ch, p: false });
      });
    }
  });

  /* Words by the one rule this page counts with — see js/source.js, which
     is where fifty-three comes from. */
  var words = (source.match(/[0-9A-Za-z][0-9A-Za-z'’.\-]*/g) || []).length;

  /* Whole words, each a run of tiles, with the spaces dropped: a text box
     puts a space between words, it does not store one. */
  var tokens = [];
  var cur = [];
  tiles.forEach(function (t) {
    if (t.c === ' ') {
      if (cur.length) { tokens.push(cur); cur = []; }
    } else {
      cur.push(t);
    }
  });
  if (cur.length) tokens.push(cur);

  function wrap(cols) {
    var lines = [];
    var line = [];
    tokens.forEach(function (tok) {
      if (!line.length) {
        line = tok.slice();
      } else if (line.length + 1 + tok.length <= cols) {
        line.push({ c: ' ', p: false });
        line = line.concat(tok);
      } else {
        lines.push(line);
        line = tok.slice();
      }
      /* A word longer than the row gets broken rather than overflowing.
         His paragraph has none; the rule is here so the layout cannot
         silently lie about a grid it did not fit into. */
      while (line.length > cols) {
        lines.push(line.slice(0, cols));
        line = line.slice(cols);
      }
    });
    if (line.length) lines.push(line);
    return lines;
  }

  /* ---------- the six machines ----------
     Resolutions are the published hardware figures; the collection is
     his, by email on 5 October 2026 — see #shelf and #post. */

  var DEV = [
    { k: 'gb',      name: 'Game Boy',             year: '1989', w: 160, h: 144, n: 1, lit: false },
    { k: 'gbc',     name: 'Game Boy Color',       year: '1998', w: 160, h: 144, n: 1, lit: false },
    { k: 'gba',     name: 'Game Boy Advance',     year: '2001', w: 240, h: 160, n: 1, lit: false },
    { k: 'sp',      name: 'Game Boy Advance SP',  year: '2003', w: 240, h: 160, n: 1, lit: true  },
    { k: 'ds',      name: 'Nintendo DS',          year: '2004', w: 256, h: 192, n: 2, lit: true  },
    { k: 'walkman', name: 'Walkman',              year: '1979', w: 0,   h: 0,   n: 0, lit: false }
  ];

  var TILE = 8;

  function metrics(d) {
    if (!d.n) return { none: true };
    var cols = d.w / TILE;
    var rows = d.h / TILE;
    var lines = wrap(cols);
    var drawn = 0;
    lines.forEach(function (L) {
      L.forEach(function (t) { if (t.c !== ' ') drawn++; });
    });
    return {
      cols: cols,
      rows: rows,
      lines: lines,
      used: lines.length,
      spare: rows - lines.length,
      tiles: cols * rows * d.n,
      drawn: drawn,
      blanks: pictures,
      fits: lines.length <= rows
    };
  }

  /* The three figures the prose rests on. If any of them has moved, this
     file draws nothing: the paragraph above it is then the whole section,
     which is what it was written to be. */
  var gb = metrics(DEV[0]);
  var ok = (words === 53 && pictures === 11 && gb.used === 18 && gb.rows === 18);

  var WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
    'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
    'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

  function nm(n) { return WORD[n] || String(n); }
  function Nm(n) { var w = nm(n); return w.charAt(0).toUpperCase() + w.slice(1); }
  function num(n) { return n.toLocaleString('en-US'); }

  window.__fit = {
    audit: function () {
      var out = { source: source, words: words, pictures: pictures, tiles: tiles.length, ok: ok, devices: {} };
      DEV.forEach(function (d) {
        var m = metrics(d);
        out.devices[d.k] = m.none ? 'no screen' :
          m.cols + 'x' + m.rows + (d.n > 1 ? ' x' + d.n : '') +
          ' grid, ' + m.used + ' rows used, ' + m.spare + ' spare, ' + m.drawn + ' glyphs';
      });
      return out;
    }
  };

  if (!ok) return;

  if (rowsOut) rowsOut.textContent = nm(gb.used);

  /* ---------- drawing a screen ---------- */

  function screenEl(d, m, lines) {
    var bezel = document.createElement('div');
    bezel.className = 'ft-bezel';

    var scr = document.createElement('div');
    scr.className = 'ft-screen';
    scr.setAttribute('data-skin', d.k === 'walkman' ? 'gb' : d.k);
    if (d.lit) scr.setAttribute('data-lit', 'yes');
    scr.style.setProperty('--c', String(m.cols));
    scr.style.setProperty('--r', String(m.rows));

    /* The grid is 360 to 768 cells of one character each. A screen reader
       reading it cell by cell would be reading his paragraph sideways, and
       his paragraph is already on this page in About, so the screen
       describes itself instead and the readout beside it carries the
       figures. */
    scr.setAttribute('role', 'img');
    scr.setAttribute('aria-label',
      lines.length
        ? 'His bio laid out on the ' + d.name + ' screen: ' + m.cols + ' tiles across by ' +
          m.rows + ' down, ' + lines.length + ' rows used, ' + pictures +
          ' tiles left blank where the pictographs are.'
        : 'The ' + d.name + '’s second screen, ' + m.cols + ' tiles by ' + m.rows + ', empty.');

    var frag = document.createDocumentFragment();
    for (var r = 0; r < m.rows; r++) {
      var L = lines[r] || [];
      for (var c = 0; c < m.cols; c++) {
        var cell = document.createElement('span');
        cell.className = 'ft-cell';
        var t = L[c];
        if (t && t.c !== ' ') {
          if (t.p && !rawBox.checked) {
            cell.setAttribute('data-blank', '');
          } else {
            cell.textContent = t.c;
          }
        }
        frag.appendChild(cell);
      }
    }
    scr.appendChild(frag);
    bezel.appendChild(scr);
    return { bezel: bezel, scr: scr };
  }

  var live = [];

  /* A tile has to stay square and its glyph has to scale with it, and
     neither follows from a percentage font-size. So the cell width is
     measured once per screen per layout and written back as px. */
  function size() {
    live.forEach(function (scr) {
      var w = scr.clientWidth;
      if (!w) return;
      var cols = parseFloat(scr.style.getPropertyValue('--c')) || 20;
      scr.style.fontSize = (w / cols * 0.78).toFixed(2) + 'px';
    });
  }

  function label(d, m) {
    var rows = [];
    if (m.none) {
      rows.push(['screen', 'none']);
      rows.push(['tile grid', '—']);
      rows.push(['his rows', '—']);
      rows.push(['rows to spare', '—', 'spare']);
      rows.push(['tiles it can’t draw', '—']);
      return rows;
    }
    rows.push(['screen', d.w + ' × ' + d.h + ' px' + (d.n > 1 ? ', twice' : '')]);
    rows.push(['tile grid', m.cols + ' × ' + m.rows + (d.n > 1 ? ', twice' : '') + ' = ' + num(m.tiles)]);
    rows.push(['his rows', m.used + ' of ' + m.rows]);
    rows.push(['rows to spare', m.spare + (d.n > 1 ? ', plus a whole screen' : ''), 'spare']);
    rows.push(['tiles it can’t draw', String(m.blanks)]);
    return rows;
  }

  function say(d, m) {
    if (m.none) {
      return '<strong>No screen at all.</strong> The oldest thing in his case is the one thing in it ' +
        'that cannot show you a word of him. <a href="#shelf">Finding 03</a> found it has no slot for ' +
        'any of the cartridges either: it arrived ten years early and shares nothing with the other five.';
    }
    if (d.k === 'gb') {
      return '<strong>It fits, exactly.</strong> ' + Nm(m.used) + ' rows into ' + nm(m.rows) +
        '. Everything he has written about himself is the precise height of the oldest screen he owns, ' +
        'and there is no ' + (m.rows + 1) + 'th row to put anything else on. ' + num(m.drawn) +
        ' tiles are written on, and ' + nm(m.blanks) + ' of those it cannot draw.';
    }
    if (d.k === 'gbc') {
      return '<strong>The same screen, nine years later, in colour.</strong> Still ' + m.cols +
        ' by ' + m.rows + ', so still ' + nm(m.used) + ' rows with nothing over. The Color changed ' +
        'what his words could be painted; it did not change how many of them fit.';
    }
    if (d.k === 'gba') {
      return '<strong>Turned sideways, he stops being the shape of the screen.</strong> ' + m.cols +
        ' columns instead of ' + gb.cols + ' takes him to ' + nm(m.used) + ' rows and leaves ' +
        nm(m.spare) + ' of the ' + nm(m.rows) + ' empty — and there is still no light behind any of it.';
    }
    if (d.k === 'sp') {
      return '<strong>The same ' + m.cols + ' by ' + m.rows + ', and the first one that lights it.</strong> ' +
        Nm(m.used) + ' rows, ' + nm(m.spare) + ' spare, legible in the dark. Nintendo had been shipping ' +
        'Game Boys for fourteen years before one of them could do that.';
    }
    if (d.k === 'ds') {
      return '<strong>Two screens, and he needs under half of one.</strong> ' + Nm(m.used) + ' rows of ' +
        'the top ' + m.cols + ' by ' + m.rows + ', ' + nm(m.spare) + ' left on it, and the lower one — ' +
        num(m.cols * m.rows) + ' more tiles — never comes on. Of ' + num(m.tiles) + ' tiles in his ' +
        'newest machine, his whole homepage occupies ' + num(m.drawn) + '.';
    }
    return '';
  }

  function show(d) {
    var m = metrics(d);
    live = [];
    scrEl.textContent = '';
    readEl.textContent = '';

    if (m.none) {
      var plate = document.createElement('div');
      plate.className = 'ft-none';
      plate.textContent = 'no display — nothing of him fits here';
      scrEl.appendChild(plate);
    } else {
      for (var i = 0; i < d.n; i++) {
        var lines = i === 0 ? m.lines : [];
        var built = screenEl(d, m, lines);
        scrEl.appendChild(built.bezel);
        live.push(built.scr);
        if (d.n > 1) {
          var sub = document.createElement('p');
          sub.className = 'ft-sub';
          sub.textContent = (i === 0 ? 'upper screen' : 'lower screen — never written to');
          scrEl.appendChild(sub);
        }
      }
    }

    label(d, m).forEach(function (row) {
      var wrapEl = document.createElement('div');
      wrapEl.className = 'ft-row';
      if (row[2]) wrapEl.setAttribute('data-key', row[2]);
      var dt = document.createElement('dt');
      dt.textContent = row[0];
      var dd = document.createElement('dd');
      dd.textContent = row[1];
      wrapEl.appendChild(dt);
      wrapEl.appendChild(dd);
      readEl.appendChild(wrapEl);
    });

    verdict.innerHTML = say(d, m);
    size();
  }

  /* ---------- the controls ---------- */

  var current = DEV[0];
  var buttons = [];

  DEV.forEach(function (d) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'panel-btn';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('data-ft-dev', d.k);

    var dot = document.createElement('span');
    dot.className = 'panel-dot';
    dot.setAttribute('aria-hidden', 'true');
    b.appendChild(dot);

    var nameEl = document.createElement('span');
    nameEl.textContent = d.name + ' ';
    b.appendChild(nameEl);

    var yr = document.createElement('span');
    yr.className = 'ft-year';
    yr.textContent = d.year;
    b.appendChild(yr);

    b.addEventListener('click', function () {
      current = d;
      buttons.forEach(function (o) {
        o.setAttribute('aria-pressed', String(o.getAttribute('data-ft-dev') === d.k));
      });
      show(d);
    });

    picksEl.appendChild(b);
    buttons.push(b);
  });

  rawBox.addEventListener('change', function () { show(current); });

  buttons[0].setAttribute('aria-pressed', 'true');
  show(current);

  /* The last act, as in every other section here: the designed static
     fallback goes and the rig takes its place, so the two are never both
     on the page saying contradictory things about whether it works. */
  var nojs = sec.querySelector('[data-ft-nojs]');
  if (nojs) nojs.hidden = true;
  rig.hidden = false;
  size();

  var pending;
  window.addEventListener('resize', function () {
    clearTimeout(pending);
    pending = setTimeout(size, 120);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
})();

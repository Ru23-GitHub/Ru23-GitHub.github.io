/* The Font That Set One Word — the reconstruction and the specimen
   ----------------------------------------------------------------------
   Added 2026-10-14. The section's substance is in the HTML: the dates,
   the diff that removed the word, the font's own name table, and the
   reading. With JavaScript off the stage still shows the cue as it
   stood for its 68 hours, both specimen lines still render the fifteen
   letters of his name in both faces, and nothing is missing.

   What this file adds is the three dates, the typing, and the grid.

   The dates are a reconstruction, not a recording. Nobody screenshotted
   this: the cue was wired to nintendo.otf at 21:29 on 23 July 2026 and
   unwired at 18:20 on 26 July, and no image of it exists anywhere in
   this repository. What does exist is the markup and the stylesheet at
   each of those commits, which is enough to build it again exactly —
   so the stage is CSS copied off f3c3691, 54d5642 and e220507, and
   every caption says which commit it came from.

   The "now" caption counts the days since the word was removed at
   runtime rather than carrying a number in the prose, for the same
   reason the Ledger measures its own percentages: a figure typed into
   a sentence is true for one day and quietly wrong afterwards.

   The specimen is the point of the whole section, and it is the one
   thing here that is not archaeology. The file has set five distinct
   glyphs in its life — S, c, r, o, l. The input gives it the rest of
   its alphabet, and the grid shows the 95 printable ASCII characters
   it has been carrying, unasked, since July. */
(function () {
  'use strict';

  var section = document.getElementById('type');
  if (!section) return;

  /* ---------- the three dates ---------- */

  var stage = section.querySelector('[data-ty-stage]');
  var picks = [].slice.call(section.querySelectorAll('.ty-pick'));
  var caption = section.querySelector('[data-ty-caption]');
  var clearBtn = section.querySelector('[data-ty-clear]');
  var controls = section.querySelector('[data-ty-controls]');

  /* The state the page ships in is the one that is live on his homepage
     right now, so "clear" means "back to today" rather than "back to
     nothing". */
  var DEFAULT = 'now';

  /* 26 July 2026, 18:20:09 -0700 — e220507, the commit that took the
     word out. Everything after it is still true. */
  var REMOVED = Date.UTC(2026, 6, 27, 1, 20, 9);

  function daysSinceRemoval() {
    var d = Math.floor((Date.now() - REMOVED) / 86400000);
    return d > 0 ? d : 0;
  }

  var CAPTION = {
    first: 'f3c3691, 23 July 2026 at 20:28 — the word “Scroll” stacked above a bouncing chevron, set in game_boy_1989.ttf at italic 700, 16px, in #ff3dee at 65% opacity. His CSS comment already said it was imitating the pink “Nintendo” text under the Game Boy logo. It was not: this is the Game Boy font. It looked like this for one hour and one minute.',
    wired: '54d5642, 23 July 2026 at 21:29 — he shipped nintendo.otf and pointed the cue at it. “Scroll” at 18px between two 16px chevrons, laid out in a row, the bounce dropped. This is the only thing that file has ever set, and it set it for 68 hours and 51 minutes.',
    now: 'e220507, 26 July 2026 at 18:20 — the word and the second chevron deleted, the remaining one grown from 16px to 24px, and the two font lines removed from the rule. This is what is on his homepage today, and has been for DAYS days.'
  };

  var state = DEFAULT;

  function paintStage() {
    if (stage) stage.setAttribute('data-state', state);

    for (var i = 0; i < picks.length; i++) {
      picks[i].setAttribute('aria-pressed',
        picks[i].getAttribute('data-ty-date') === state ? 'true' : 'false');
    }

    if (caption) {
      caption.textContent = (CAPTION[state] || '')
        .replace('DAYS', String(daysSinceRemoval()));
    }
    if (clearBtn) clearBtn.disabled = state === DEFAULT;
  }

  function show(next) {
    state = (next === state) ? DEFAULT : next;
    paintStage();
  }

  for (var i = 0; i < picks.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        show(btn.getAttribute('data-ty-date'));
      });
    })(picks[i]);
  }

  if (clearBtn) clearBtn.addEventListener('click', function () { show(DEFAULT); });

  section.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state !== DEFAULT) { show(DEFAULT); }
  });

  /* ---------- the specimen ---------- */

  var input = section.querySelector('[data-ty-input]');
  var specControls = section.querySelector('[data-ty-spec-controls]');
  var samples = [].slice.call(section.querySelectorAll('.ty-sample'));
  var resets = [].slice.call(section.querySelectorAll('[data-ty-set]'));

  /* Whatever is already in the markup is the no-JS specimen, and it is
     also the value the input starts at, so turning the script on does
     not change what is on screen. */
  var INITIAL = samples.length ? samples[0].textContent.trim() : 'RUSLAN MANOHARAN';

  function setSample(str) {
    /* textContent throughout: the input is a text field on a page with
       no server, but it writes into the DOM, and the only safe way to
       put a visitor's string into an element is as text. */
    var out = str.length ? str : ' ';
    for (var i = 0; i < samples.length; i++) samples[i].textContent = out;
  }

  if (input) {
    input.value = INITIAL;
    input.addEventListener('input', function () { setSample(input.value); });
  }

  for (var r = 0; r < resets.length; r++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var str = btn.getAttribute('data-ty-set');
        if (input) input.value = str;
        setSample(str);
        if (input) input.focus();
      });
    })(resets[r]);
  }

  /* ---------- the glyph grid ----------
     95 cells, built here rather than written into the HTML: it is a
     decorative inventory, the sentence above it carries the same fact in
     words, and a screen reader reading ninety-five isolated punctuation
     marks aloud would be noise. Hence aria-hidden on the container in
     the markup. */

  var USED = 'Scrol';   /* the five distinct glyphs in "Scroll" */
  var grid = section.querySelector('[data-ty-glyphs]');
  var built = 0;

  if (grid) {
    for (var c = 0x20; c <= 0x7e; c++) {
      var ch = String.fromCharCode(c);
      var cell = document.createElement('span');
      cell.className = 'ty-glyph';
      /* The space is a glyph the font really does carry, and an empty
         cell is the honest way to draw it. */
      cell.textContent = ch === ' ' ? ' ' : ch;
      if (USED.indexOf(ch) !== -1) cell.setAttribute('data-used', '1');
      grid.appendChild(cell);
      built++;
    }
  }

  /* ---------- did it actually load? ----------
     The claim this section makes is that a browser has never fetched
     this file, because an @font-face nothing selects is never
     requested. This page does select it, so this page does fetch it —
     and says so out of its own font loader rather than on my word. */

  var status = section.querySelector('[data-ty-status]');
  var loaded = null;

  /* Both @font-face rules on this page point at the same 28,120 bytes.
     css/intro.css declares them as 'Nintendo' and nothing on the page
     selects that family; css/type.css declares them as 'Spritendo' and
     the two specimen lines above do. So the browser's own font registry
     holds the whole argument of this section as two rows, and it is a
     better witness for it than I am. */
  function familyStatus(name) {
    var found = null;
    try {
      document.fonts.forEach(function (f) { if (f.family === name) found = f.status; });
    } catch (e) { /* an older FontFaceSet without forEach */ }
    return found;
  }

  function reportFont() {
    if (!status) return;

    if (loaded === null) {
      status.textContent = 'Asking the browser whether nintendo.otf loaded…';
      return;
    }

    if (loaded === false) {
      status.textContent = 'nintendo.otf did not load here, so the first line is falling back to the Game Boy face. The point it is making is in the text either way.';
      return;
    }

    var theirs = familyStatus('Nintendo');
    var line = 'nintendo.otf: 28,120 bytes, fetched and rendering — both lines above are set in the face named beside them.';

    /* Only make the second claim if the browser is the one making it. */
    if (theirs === 'unloaded') {
      line += ' His own rule for the very same file is on this page too, under the family name ‘Nintendo’, and the browser still lists that one as unloaded: nothing selects it, so it was never asked for.';
    } else if (theirs) {
      line += ' His own rule for the same file, under the family name ‘Nintendo’, is listed as ' + theirs + '.';
    }

    status.textContent = line;
  }

  if (window.FontFace && document.fonts && document.fonts.load) {
    reportFont();
    document.fonts.load('18px Spritendo', 'Scroll').then(function (faces) {
      loaded = faces.length > 0;
      reportFont();
    })['catch'](function () {
      loaded = false;
      reportFont();
    });
  } else if (status) {
    /* No Font Loading API: say nothing rather than guess. */
    status.textContent = 'This browser cannot report on font loading, so take the two lines above at face value.';
  }


  /* ---------- wire up ---------- */

  if (controls) controls.removeAttribute('hidden');
  if (specControls) specControls.removeAttribute('hidden');
  paintStage();

  window.__type = {
    dates: ['first', 'wired', 'now'],
    state: function () { return state; },
    show: show,
    daysSinceRemoval: daysSinceRemoval,
    glyphsDrawn: built,
    glyphsEverUsed: USED.split(''),
    fontLoaded: function () { return loaded; },
    familyStatus: familyStatus,
    setSample: setSample
  };
})();

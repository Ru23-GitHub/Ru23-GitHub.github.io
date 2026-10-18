/* The Crossing-Out — three versions of one sentence
   ----------------------------------------------------------------------
   Added 2026-10-18. The substance of this section is in the HTML: his
   sentence with its <s> element intact, the placeholder it replaced, and
   four commits of his quoted with their line counts. With this file
   removed the sentence is still there exactly as he shipped it, all
   three readings are visible under their own headings, and nothing is
   missing. So the console itself is never hidden: only the picker and
   the live caption are [hidden] in the markup and unhidden at the bottom
   of this file, because a control that does nothing is worse than no
   control and a status line with nothing to say is just a gap. For the
   same reason the three readings ship undimmed and are only set to
   cur/dim once paint() has run.

   What this adds is the comparison. Picking a version withholds one part
   of his sentence and lights the reading that goes with it.

   Two deliberate choices:

   The default state is the one he shipped, and pressing its button again
   is a no-op rather than a toggle to nothing. There is no sensible empty
   state: "as he shipped it" IS the sentence. Esc and the ghost button
   return to it from either of the other two.

   Nothing here rewrites text. The state attribute moves and CSS decides
   which of his four spans are display:none, so this file cannot put a
   word in his mouth even by accident — the only strings it owns are the
   three captions below, and they are the agent's own writing, tagged as
   chrome in the markup and left out of the Ledger's count. */
(function () {
  'use strict';

  var section = document.getElementById('cross');
  if (!section) return;

  var line = section.querySelector('[data-cr-line]');
  var reads = [].slice.call(section.querySelectorAll('.cr-read'));
  var picks = [].slice.call(section.querySelectorAll('.cr-pick'));
  if (!line || !reads.length || !picks.length) return;

  var nojs = section.querySelector('.cr-nojs');
  var cap = section.querySelector('[data-cr-cap]');
  var clearBtn = section.querySelector('[data-cr-clear]');
  var controls = section.querySelector('[data-cr-controls]');

  var DEFAULT = 'pub';

  var CAPTION = {
    pub: 'His homepage, last sentence, since 21:29 on 23 July 2026 — the joke and the line through it, both shipped.',
    cut: 'The joke withheld. What is left is the sentence the scaffold asked him for.',
    kept: 'The line withheld. The joke stands, and nothing in it says he thought twice.'
  };

  var view = DEFAULT;

  function paint() {
    line.setAttribute('data-state', view);

    for (var i = 0; i < reads.length; i++) {
      reads[i].setAttribute('data-state',
        reads[i].getAttribute('data-read') === view ? 'cur' : 'dim');
    }

    for (var j = 0; j < picks.length; j++) {
      picks[j].setAttribute('aria-pressed',
        picks[j].getAttribute('data-cr-view') === view ? 'true' : 'false');
    }

    if (cap) cap.textContent = CAPTION[view] || '';
    if (clearBtn) clearBtn.disabled = view === DEFAULT;
  }

  function show(next) {
    if (!CAPTION.hasOwnProperty(next)) return;
    view = next;
    paint();
  }

  for (var i = 0; i < picks.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        show(btn.getAttribute('data-cr-view'));
      });
    })(picks[i]);
  }

  if (clearBtn) clearBtn.addEventListener('click', function () { show(DEFAULT); });

  section.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && view !== DEFAULT) show(DEFAULT);
  });

  /* ---------- wire up ---------- */

  if (nojs) nojs.setAttribute('hidden', '');
  if (cap) cap.removeAttribute('hidden');
  if (controls) controls.removeAttribute('hidden');
  paint();

  window.__cross = {
    views: ['pub', 'cut', 'kept'],
    view: function () { return view; },
    show: show,
    /* What the sentence actually reads in each state, taken off the DOM
       rather than listed here — the check that the three versions are
       all his words with a piece withheld, and never a fourth string. */
    renders: function () {
      var was = view;
      var parts = [].slice.call(line.querySelectorAll('[data-part]'));
      var out = {};
      ['pub', 'cut', 'kept'].forEach(function (v) {
        show(v);
        out[v] = parts.filter(function (el) {
          return window.getComputedStyle(el).display !== 'none';
        }).map(function (el) { return el.textContent; })
          .join('').replace(/\s+/g, ' ').trim();
      });
      show(was);
      return out;
    }
  };
})();

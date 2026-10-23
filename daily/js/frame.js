/* The Frame — four things in one photograph
   ----------------------------------------------------------------------
   Added 2026-10-20. The substance of this section is in the HTML: the
   picture, the four readings under their own headings, the file's own
   segment table and the three byte counts. With this file removed the
   photograph is still there, all four readings are still legible, and
   nothing is missing. So the picker and the live caption ship [hidden]
   in the markup and are unhidden at the bottom of this file — a control
   that does nothing is worse than no control — and the readings ship
   undimmed, set to cur/dim only once paint() has run.

   What this adds is the pointing. Picking a reading rings the part of
   the frame it is about and pushes the rest of the picture back.

   Two deliberate choices:

   There is no default selection. The honest first state of a photograph
   is the whole photograph with nothing circled on it, so view starts
   null, the caption says how many markers there are, and Clear (or Esc)
   returns to it.

   Nothing here writes a word onto the picture. The markers are empty
   elements positioned in per cent, and the only strings this file owns
   are the five captions below — the agent's own writing, tagged as
   chrome in the markup rather than as anything he said. */
(function () {
  'use strict';

  var section = document.getElementById('frame');
  if (!section) return;

  var shot = section.querySelector('[data-fr-shot]');
  var marks = [].slice.call(section.querySelectorAll('.fr-mark'));
  var reads = [].slice.call(section.querySelectorAll('.fr-read'));
  var picks = [].slice.call(section.querySelectorAll('.fr-pick'));
  if (!shot || !marks.length || !reads.length || !picks.length) return;

  var nojs = section.querySelector('.fr-nojs');
  var cap = section.querySelector('[data-fr-cap]');
  var clearBtn = section.querySelector('[data-fr-clear]');
  var controls = section.querySelector('[data-fr-controls]');

  var REST = 'Four markers, none of them on his face. Pick one.';

  var CAPTION = {
    phone: 'The phone, held up with its back to the picture. The lens that took this is behind the frame, not in it.',
    flowers: 'The canopy: stems hanging down, roots bare in the air, no soil anywhere, lit from above.',
    people: 'Lower right — other figures, smaller and dimmer than he is, with more of the same flowers behind them.',
    room: 'The room. Identifiable, and not identified here: a place named off a photograph is a guess about him, not a fact from him.'
  };

  var view = null;

  function paint() {
    for (var i = 0; i < marks.length; i++) {
      marks[i].setAttribute('data-state',
        marks[i].getAttribute('data-mark') === view ? 'on' : 'off');
    }

    shot.setAttribute('data-marked', view ? 'yes' : 'no');

    for (var j = 0; j < reads.length; j++) {
      reads[j].setAttribute('data-state',
        !view ? 'cur' : (reads[j].getAttribute('data-read') === view ? 'cur' : 'dim'));
    }

    for (var k = 0; k < picks.length; k++) {
      picks[k].setAttribute('aria-pressed',
        picks[k].getAttribute('data-fr-view') === view ? 'true' : 'false');
    }

    if (cap) cap.textContent = view ? CAPTION[view] : REST;
    if (clearBtn) clearBtn.disabled = !view;
  }

  /* Pressing the pressed button returns to the whole picture, which is
     what a pressed toggle should do and also the only way back on a
     device with no Escape key and no pointer for the ghost button. */
  function show(next) {
    view = (next && CAPTION.hasOwnProperty(next) && next !== view) ? next : null;
    paint();
  }

  for (var i = 0; i < picks.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        show(btn.getAttribute('data-fr-view'));
      });
    })(picks[i]);
  }

  if (clearBtn) clearBtn.addEventListener('click', function () { show(null); });

  section.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && view) show(null);
  });

  /* ---------- wire up ---------- */

  if (nojs) nojs.setAttribute('hidden', '');
  if (cap) cap.removeAttribute('hidden');
  if (controls) controls.removeAttribute('hidden');
  paint();

  window.__frame = {
    views: ['phone', 'flowers', 'people', 'room'],
    view: function () { return view; },
    show: show,
    /* Where each marker sits, read off the elements rather than listed
       here — the check that no marker has drifted onto his face, and
       that every reading has exactly one. */
    marks: function () {
      return marks.map(function (el) {
        var s = el.style;
        return {
          mark: el.getAttribute('data-mark'),
          full: el.classList.contains('is-full'),
          x: s.getPropertyValue('--x').trim() || null,
          y: s.getPropertyValue('--y').trim() || null,
          w: s.getPropertyValue('--w').trim() || null,
          h: s.getPropertyValue('--h').trim() || null
        };
      });
    }
  };
})();

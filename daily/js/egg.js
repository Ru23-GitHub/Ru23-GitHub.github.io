/* The Egg — three views of one anchor
   ----------------------------------------------------------------------
   Added 2026-10-13. The section's substance is in the HTML: the four
   attributes of the hero anchor on his real homepage, the line of CSS
   that keeps it from looking like a link, and the string a screen reader
   reads instead of his name. With JavaScript off all three panes are
   visible, stacked, each under its own heading, and nothing is missing.

   What this file adds is the comparison: picking a view lights one pane,
   sets the other two aside, and changes what is drawn over the facsimile
   of the wordmark — nothing, the anchor's dashed box, or the
   announcement. The picker is [hidden] in the markup and unhidden here,
   because a control that does nothing is worse than no control.

   Two deliberate choices:

   Panes are dimmed, never hidden. Three tabbed panes are not fallbacks
   for one another, so hiding two would take two thirds of this section's
   writing off the page depending on which tab you had open.

   The sweep on the destination screen is a one-shot animation driven by a
   data attribute, and it is cleared on animationend rather than left set,
   so pressing the button twice plays it twice. Reduced motion is handled
   in CSS (the duration collapses to a frame) rather than by refusing to
   run, so the button still does something visible for everyone. */
(function () {
  'use strict';

  var section = document.getElementById('egg');
  if (!section) return;

  var stage = section.querySelector('[data-eg-stage]');
  var panes = [].slice.call(section.querySelectorAll('.eg-pane'));
  var picks = [].slice.call(section.querySelectorAll('.eg-pick'));
  if (!stage || !panes.length || !picks.length) return;

  var caption = section.querySelector('[data-eg-caption]');
  var clearBtn = section.querySelector('[data-eg-clear]');
  var controls = section.querySelector('[data-eg-controls]');

  var DEFAULT = 'rendered';

  var CAPTION = {
    rendered: 'What every sighted visitor gets: the letters, and no sign at all that they are a link.',
    markup: 'The same element with its own box drawn on it — one anchor, four attributes, and a line of CSS that suppresses the underline in all three states.',
    announced: 'What a screen reader says instead. Those last four words are the only place on either page where the link is openly declared.'
  };

  var view = DEFAULT;

  function paint() {
    stage.setAttribute('data-view', view);

    for (var i = 0; i < panes.length; i++) {
      var key = panes[i].getAttribute('data-pane');
      panes[i].setAttribute('data-state', key === view ? 'cur' : 'dim');
    }

    for (var j = 0; j < picks.length; j++) {
      picks[j].setAttribute('aria-pressed',
        picks[j].getAttribute('data-eg-view') === view ? 'true' : 'false');
    }

    if (caption) caption.textContent = CAPTION[view] || '';
    if (clearBtn) clearBtn.disabled = view === DEFAULT;
  }

  function show(next) {
    /* Picking the lit view again returns to "as rendered" rather than
       leaving nothing picked: there is no sensible empty state here,
       because "as rendered" IS the state the page ships in. */
    view = (next === view) ? DEFAULT : next;
    paint();
  }

  for (var i = 0; i < picks.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        show(btn.getAttribute('data-eg-view'));
      });
    })(picks[i]);
  }

  if (clearBtn) clearBtn.addEventListener('click', function () { show(DEFAULT); });

  section.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && view !== DEFAULT) { show(DEFAULT); }
  });

  /* ---------- the destination sweep ---------- */

  var screen = section.querySelector('[data-eg-screen]');
  var play = section.querySelector('[data-eg-play]');

  if (screen && play) {
    var sweep = screen.querySelector('.eg-sweep');

    function stop() { screen.setAttribute('data-playing', 'false'); }

    play.addEventListener('click', function () {
      stop();
      /* Reading offsetWidth between the two writes forces the style to be
         recomputed, which is what lets the same animation restart on a
         second press instead of being treated as unchanged. */
      void screen.offsetWidth;
      screen.setAttribute('data-playing', 'true');
    });

    if (sweep) sweep.addEventListener('animationend', stop);
  }

  /* ---------- wire up ---------- */

  if (controls) controls.removeAttribute('hidden');
  paint();

  window.__egg = {
    views: ['rendered', 'markup', 'announced'],
    view: function () { return view; },
    show: show
  };
})();

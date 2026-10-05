/* Lifecycle — one place for "is anyone actually looking at this?"
   ======================================================================
   Added 2026-10-05. Five exhibits had each grown their own copy of the
   same two rules:

     stop when the tab is hidden
     stop when the section has scrolled off screen

   written out separately in slime.js, spacewar.js and horologium.js, each
   with its own IntersectionObserver, its own visibilitychange listener,
   and its own slightly different idea of how the two interact. The bug
   that pattern invites is real: hide the tab, scroll away, come back, and
   whichever handler fires last decides whether you are running — so a
   section could resume while off screen, or stay dead while visible.

   Daily.whenVisible solves it once by keeping both facts and deriving the
   answer, rather than letting two handlers race to set it.

     Daily.whenVisible(el, {
       setup()  optional, run once the first time el is approached
       start()  called when el is on screen AND the tab is visible
       stop()   called whenever that stops being true
       margin   how early to wake up, default 200px
     })

   setup() is what makes lazy allocation possible: an exhibit that needs
   a couple of megabytes of typed arrays no longer pays for them at load
   if nobody scrolls that far.
*/
(function () {
  'use strict';

  var Daily = (window.Daily = window.Daily || {});

  Daily.whenVisible = function (el, opts) {
    if (!el) return;
    var started = false;
    var setupDone = false;
    var onScreen = false;

    function ready() {
      if (setupDone) return;
      setupDone = true;
      if (opts.setup) opts.setup();
    }

    /* One derived decision from two facts, so the handlers can fire in
       any order and still agree. */
    function settle() {
      var should = onScreen && !document.hidden;
      if (should === started) return;
      started = should;
      if (should) { ready(); if (opts.start) opts.start(); }
      else if (opts.stop) opts.stop();
    }

    document.addEventListener('visibilitychange', settle);

    if (!window.IntersectionObserver) {
      /* No observer: treat it as permanently on screen and let the tab
         rule do the work. */
      onScreen = true;
      ready();
      settle();
      return;
    }

    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) ready();     /* allocate on approach, before painting */
      settle();
    }, { rootMargin: (opts.margin == null ? 200 : opts.margin) + 'px 0px' }).observe(el);
  };
})();

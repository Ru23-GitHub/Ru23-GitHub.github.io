/* Rail — marks the section you're currently in
   ======================================================================
   Added 2026-10-05.

   The progress bar is pure CSS. This file does one thing: keep
   aria-current on whichever rail link matches the section filling most
   of the viewport.

   An IntersectionObserver rather than a scroll listener, and it tracks
   the largest visible section rather than the first one to cross a line
   — with sections of wildly different heights (a 100svh hero, a short
   About, a very tall console) "first to cross" flickers between two
   neighbours at the boundary. */
(function () {
  'use strict';

  var rail = document.querySelector('[data-rail]');
  if (!rail || !window.IntersectionObserver) return;

  var links = {};
  var order = [];
  Array.prototype.forEach.call(rail.querySelectorAll('a[href^="#"]'), function (a) {
    var id = a.getAttribute('href').slice(1);
    if (!document.getElementById(id)) return;
    links[id] = a;
    order.push(id);
  });
  if (!order.length) return;

  var ratios = {};
  var current = null;

  function settle() {
    var best = null, bestRatio = 0;
    for (var i = 0; i < order.length; i++) {
      var r = ratios[order[i]] || 0;
      if (r > bestRatio) { bestRatio = r; best = order[i]; }
    }
    if (!best || best === current) return;
    if (current && links[current]) links[current].removeAttribute('aria-current');
    links[best].setAttribute('aria-current', 'true');
    current = best;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { ratios[e.target.id] = e.intersectionRatio; });
    settle();
  }, {
    /* A spread of thresholds so a tall section still reports a useful
       ratio as it passes, rather than jumping 0 -> 1. */
    threshold: [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1]
  });

  order.forEach(function (id) { observer.observe(document.getElementById(id)); });

  rail.hidden = false;
})();

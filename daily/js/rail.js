/* The navigator — current section, progress, and closing the sheet
   ----------------------------------------------------------------------
   Added 2026-10-16. Everything load-bearing about the bar is in the HTML
   and the CSS: it is a position:sticky element containing a <details>,
   so with this file removed it still names Ruslan, still links all
   sixteen parts of the page, and still carries his three contact links,
   with the browser doing the disclosure and the keyboard handling.

   What this adds is the part that cannot be done declaratively:

     1. which section you are standing in, written into the closed bar
        and marked in the open list with aria-current
     2. how far through the document you are — read off
        scrollHeight rather than a figure typed in here, which would be
        wrong the next time a section is added or cut
     3. closing the sheet when you pick a destination out of it, so the
        anchor you just jumped to is not sitting underneath it

   Section tops are cached rather than read per frame. The page animates
   on scroll (animation-timeline: view()) and reading sixteen bounding
   boxes on every rAF while that runs is a measurable amount of layout
   for no benefit — the tops only move when the viewport does, or when
   the document's height changes, and both are watched below. */
(function () {
  'use strict';

  var rail = document.querySelector('.rail');
  if (!rail) return;

  var menu = rail.querySelector('[data-rail-menu]');
  var open = rail.querySelector('[data-rail-open]');
  var hereNo = rail.querySelector('[data-rail-no]');
  var hereName = rail.querySelector('[data-rail-name]');
  var prog = rail.querySelector('[data-rail-prog]');

  /* Document order, because the scan below walks forward and stops. */
  var rows = [];
  [].forEach.call(rail.querySelectorAll('.rail-list a[href^="#"]'), function (a) {
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) rows.push({ a: a, el: el, no: a.getAttribute('data-no') || '', name: a.getAttribute('data-name') || '' });
  });
  if (!rows.length) return;

  /* Only now: the progress line and the current-section readout are this
     file's doing, so neither should appear if it never ran. */
  rail.classList.add('rail-js');

  var tops = [];
  var docH = 0;
  var dock = 0;
  var current = null;

  function measure() {
    var y = window.pageYOffset;
    tops = rows.map(function (r) { return Math.round(r.el.getBoundingClientRect().top + y); });
    docH = document.documentElement.scrollHeight;

    /* Where the probe goes. It has to be at least as deep as the
       scroll-margin the stylesheet puts on every section, or a section
       you have just jumped to lands BELOW the probe and the bar names
       the section above it instead — which is exactly what it did on the
       first run of this file. Reading the margin out of the computed
       style rather than repeating 62px here means the two cannot drift
       apart when the bar's height changes. */
    var sm = parseFloat(window.getComputedStyle(rows[0].el).scrollMarginTop);
    dock = Math.max(rail.getBoundingClientRect().height, sm || 0) + 6;
  }

  function paint() {
    frame = 0;

    /* One layout read, not sixteen. If the page has grown or shrunk —
       a font landing, an exhibit opening a panel — the cache is stale. */
    if (document.documentElement.scrollHeight !== docH) measure();

    var y = window.pageYOffset;
    var probe = y + dock;
    var runway = docH - window.innerHeight;

    var found = rows[0];
    for (var i = 0; i < tops.length; i++) {
      if (tops[i] <= probe) found = rows[i];
      else break;
    }

    /* The last section on the page can never reach the probe: there is
       less document below its top than the probe sits down from the
       viewport, so the page runs out of scroll first and the bar would
       name the section above to someone plainly reading the last one.
       (Measured when that section was #contact: ~320px below its top
       against a 68px probe. #under took the last place on 2026-10-26
       and the arithmetic is the same.) At the bottom of the page, the
       bottom section is the one you are in. */
    if (runway > 0 && y >= runway - 2) found = rows[rows.length - 1];

    if (found !== current) {
      if (current) current.a.removeAttribute('aria-current');
      found.a.setAttribute('aria-current', 'location');
      hereNo.textContent = found.no;
      hereNo.hidden = !found.no;
      hereName.textContent = found.name;
      current = found;
    }

    var pct = runway > 0 ? Math.min(1, Math.max(0, y / runway)) : 0;
    prog.style.width = (pct * 100).toFixed(2) + '%';

    if (menu && menu.open) fitSheet();
  }

  /* The sheet hangs off the bottom of the bar, and the bar is only at the
     top of the screen once it has stuck. Opened before that — on the one
     screen where the hero has just scrolled past — a fixed max-height ran
     the sheet off the bottom of the window. So it gets told how much room
     there actually is, every frame while it is open. */
  function fitSheet() {
    var room = window.innerHeight - rail.getBoundingClientRect().bottom - 14;
    rail.style.setProperty('--rail-room', Math.max(200, Math.round(room)) + 'px');
  }

  var frame = 0;
  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(paint);
  }

  measure();
  paint();

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('hashchange', schedule);

  window.addEventListener('resize', function () {
    measure();
    schedule();
  }, { passive: true });

  /* Fonts arrive late and move everything down. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { measure(); schedule(); });
  }
  window.addEventListener('load', function () { measure(); schedule(); });

  /* ---------- the sheet ---------- */

  if (!menu) return;

  function shut() {
    if (menu.open) menu.open = false;
  }

  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  menu.addEventListener('toggle', function () {
    if (!menu.open) return;
    var box = rail.getBoundingClientRect();

    /* Below ~280px there is no arrangement of the sheet that reads well,
       so the bar goes to the top of the window first and opens from
       there. It is a sticky header being asked to stick; the scroll is
       short and it puts the sheet where it always is otherwise. */
    if (window.innerHeight - box.bottom < 280) {
      window.scrollTo({
        top: Math.round(box.top + window.pageYOffset),
        behavior: still.matches ? 'auto' : 'smooth'
      });
    }
    fitSheet();

    /* Opened from near the foot of the page, the list scrolls to About and
       the row you are actually standing in is off the bottom of the sheet.
       Bring it into view — no animation, because this is the sheet's
       opening state rather than a movement anyone asked to watch. */
    if (current) {
      var row = current.a;
      var sheet = row.closest('.rail-sheet');
      if (sheet) sheet.scrollTop = Math.max(0, row.offsetTop - sheet.clientHeight / 2 + row.offsetHeight / 2);
    }
  });

  /* Picking a destination closes the thing you picked it from; otherwise
     the sheet is left hanging over the section you just asked for. The
     contact links are in here too and close it for the same reason. */
  menu.addEventListener('click', function (e) {
    if (e.target.closest('.rail-sheet a')) shut();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.open) {
      shut();
      if (open) open.focus();
    }
  });

  document.addEventListener('pointerdown', function (e) {
    if (menu.open && !menu.contains(e.target)) shut();
  });
}());

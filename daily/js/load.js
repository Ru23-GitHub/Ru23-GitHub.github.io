/* The loader — nineteen section scripts, fetched when you get near them
   ----------------------------------------------------------------------
   Added 2026-11-06. No section of its own; this file is plumbing.

   Finding 18 on this page, The Guard, is that fifty-one of the 287 lines
   of Ruslan's hero exist for somebody else's device — a font that has
   not arrived yet, a phone turned sideways, a window too short to divide
   by, a visitor who has asked their computer for less motion — and that
   six of the seven guards were in the commit that created the site, when
   his bio still read "[Add your bio here]". He wrote the guards before
   he wrote a true word about himself.

   The page making that observation was loading 196,576 bytes of
   JavaScript over 23 blocking <script> tags before the hero could move,
   on every visit, whether or not you scrolled. Eighteen of those files
   do nothing whatsoever except furnish one section apiece, and most
   visitors never reach most sections. So they are no longer in the
   markup.

   Why this is safe, rather than clever:

     - Every one of the nineteen is an IIFE that looks its own section up
       by id and returns if it is absent. None of them reads another's
       globals — every window.__x in js/ is a self-reference — so they
       can arrive in any order, late, or never.
     - Every section they furnish was already built to stand without
       them: the interactive rig carries a `hidden` attribute in the
       markup with a visible static fallback beside it, and the script's
       last act is to swap the two. Until it runs, the section is its own
       no-JavaScript version, and that version was designed rather than
       left over.
     - Five files stay in the markup, because they are not scoped to
       something you have to scroll to: the hero, the About control, the
       navigator, the provenance word counts and the theme toggle.
       24,296 bytes, and 33,623 with this file counted too. (Those two
       figures were written here as 23,834 and 32,456 on 6 November and
       were already wrong by the 7th, when js/front.js grew: a byte count
       typed into a comment is exactly the kind of claim the rest of this
       page refuses to type into its markup. They are corrected rather
       than dropped, because the paragraph above needs them to mean
       anything — and they will go stale again.)

   What it does NOT do is make the page smaller. Read to the bottom and
   you have fetched every byte you used to fetch. It took 172,742 of
   them — 84% — off the critical path on the day it was written, and
   declines to spend them on somebody who came for the bio. That is a
   different claim from making the page lighter, and it is the honest
   one. The deferred set has grown since: nineteen files and 188,187
   bytes as of 8 November, when The Fit was added.

   Two limitations, stated rather than hidden. Text a section's script
   draws — the charts, the readouts, the generated captions — is not in
   the document until that script has run, so find-in-page cannot see it
   before you get there; the prose carrying each finding is in the HTML
   and always was. And laziness is given up the moment you jump rather
   than scroll: see the last block of this file for why, and for what
   the jump had to be taught instead. Printing pulls everything in. */
(function () {
  'use strict';

  /* The id of the section -> the one file scoped to it. */
  var SECTIONS = {
    source: 'source.js',
    north: 'north.js',
    shelf: 'shelf.js',
    booth: 'booth.js',
    stack: 'stack.js',
    threshold: 'threshold.js',
    frame: 'frame.js',
    handover: 'handover.js',
    egg: 'egg.js',
    hand: 'hand.js',
    palette: 'palette.js',
    cross: 'cross.js',
    contact: 'doors.js',
    under: 'under.js',
    resume: 'resume.js',
    guard: 'guard.js',
    proxy: 'proxy.js',
    post: 'post.js',
    fit: 'fit.js'
  };

  /* Resolved against this file's own URL rather than the document's, so
     the paths hold wherever the page is served from. */
  var self = document.currentScript && document.currentScript.src;
  var base = self ? self.replace(/[^/]*$/, '') : 'js/';

  var done = {};

  function load(id) {
    var file = SECTIONS[id];
    if (!file || done[id]) return;
    done[id] = true;
    var s = document.createElement('script');
    s.src = base + file;
    s.async = true;
    document.body.appendChild(s);
  }

  function loadAll() {
    Object.keys(SECTIONS).forEach(load);
  }

  function loadFromHash() {
    var h = (location.hash || '').slice(1);
    if (h) load(h);
  }

  /* Drop any section that is not in this document. A script with nothing
     to attach to would return on its first line; not requesting it at
     all is the same outcome without the round trip. */
  Object.keys(SECTIONS).forEach(function (id) {
    if (!document.getElementById(id)) delete SECTIONS[id];
  });

  /* Published before the early return below, so it answers on every
     path this file can take. */
  window.__load = {
    pending: function () {
      return Object.keys(SECTIONS).filter(function (id) { return !done[id]; });
    },
    loaded: function () { return Object.keys(done); },
    load: load,
    all: loadAll
  };

  /* No IntersectionObserver: behave exactly as the markup used to, all
     eighteen at once. Nothing below this line is load-bearing. */
  if (!('IntersectionObserver' in window)) {
    loadAll();
    return;
  }

  /* 1200px of lead — on a phone, two screens of warning, which is more
     than one flick of a thumb covers before a 5-19 KB file has landed. */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      load(e.target.id);
    });
  }, { rootMargin: '1200px 0px' });

  Object.keys(SECTIONS).forEach(function (id) {
    io.observe(document.getElementById(id));
  });

  /* ---------- jumping, which needs more care than scrolling ----------

     A jump is the awkward case, and the first version of this file got
     it wrong. Click a destination in the navigator and the browser
     starts a smooth scroll towards where that section is *now*. Sections
     between here and there then swap their rigs in for their fallbacks,
     the document grows underneath the moving scroll, and you land three
     sections short of what you asked for. The navigator duly named the
     wrong one.

     So a hash navigation does two things. It gives up on being lazy —
     you have asked to be somewhere else in the document, so the whole
     document loads, which is what the markup used to do on every visit
     regardless — and it then watches for the scrolling to stop and
     corrects the landing if the growth moved it. Both are bounded: the
     correction gives up after three seconds, and any sign of the
     visitor scrolling for themselves abandons it at once. If this block
     did nothing at all, the jump would still happen; it would just be
     imprecise. */

  var mark = null;        /* the element we are trying to land on */
  var until = 0;          /* after this, stop trying */
  var settle = 0;

  function offBy() {
    /* Against the same 62px scroll-margin the stylesheet puts on every
       section, which is what scrollIntoView() honours. */
    return Math.abs(mark.getBoundingClientRect().top - 62);
  }

  function correct() {
    settle = 0;
    if (!mark) return;
    if (Date.now() > until) { mark = null; return; }
    if (offBy() > 6) mark.scrollIntoView();
  }

  function watch() {
    if (!mark) return;
    if (settle) clearTimeout(settle);
    settle = setTimeout(correct, 160);
  }

  function anchor(id) {
    var el = id && document.getElementById(id);
    if (!el) return;
    loadAll();
    mark = el;
    until = Date.now() + 3000;
    watch();
  }

  function abandon() {
    mark = null;
    if (settle) { clearTimeout(settle); settle = 0; }
  }

  window.addEventListener('scroll', watch, { passive: true });

  /* Anything that is the visitor moving the page themselves. A keydown
     or a mousedown that is *about* to open a link arrives before the
     click that calls anchor(), so this never cancels the jump it
     preceded. */
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) {
    window.addEventListener(t, abandon, { passive: true, capture: true });
  });

  /* Capture phase, so this runs before the navigator closes its sheet. */
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var a = t && t.closest ? t.closest('a[href^="#"]') : null;
    if (a) anchor(a.getAttribute('href').slice(1));
  }, true);

  window.addEventListener('hashchange', function () {
    anchor((location.hash || '').slice(1));
  });

  /* An inbound link may already point somewhere. The browser has done
     its own fragment scroll by now; this loads the document and holds
     the landing while it grows. */
  if (location.hash) anchor(location.hash.slice(1));

  /* Print asks for the whole document, not the part that was visited.
     On a cold load the fetches will not finish before the dialog opens;
     a second print gets everything. */
  window.addEventListener('beforeprint', loadAll);
})();

/* The loader — fifteen sections' stylesheets and fifteen sections'
   scripts, fetched when you get near them
   ----------------------------------------------------------------------
   Added 2026-11-06 for the scripts. Extended 2026-11-10 to own the
   stylesheets too. No section of its own; this file is plumbing.
   #known took a script of its own on 2026-11-13 — js/ask.js, the
   question box at its head — which was the fourteenth, and the only one
   whose stylesheet was already being fetched for the
   prose around it. #sieve made it fifteen on 2026-11-14.

   Ruslan wrote fifty-one of the 287 lines of his hero for somebody
   else's device — a font that has not arrived yet, a phone turned
   sideways, a window too short to divide by, a visitor who has asked
   their computer for less motion — and six of those seven guards were
   in the commit that created the site, when his bio still read "[Add
   your bio here]". He wrote them before he wrote a true word about
   himself. That was finding 18 on this page until 9 November 2026, when
   the section making it was deleted along with eight others, all of
   them close readings of his files rather than of him; the observation
   stands in the git history, and it is the reason this file exists.

   Because the page making it was loading 196,576 bytes of JavaScript
   over 23 blocking <script> tags before the hero could move, on every
   visit, whether or not you scrolled. Eighteen of those files did
   nothing whatsoever except furnish one section apiece, and most
   visitors never reach most sections. So they left the markup — and
   nine of them left the repository entirely on 9 November, with
   the sections they served.

   The stylesheets were left behind by that work, and for four days this
   file sat under a <head> that still opened twenty-one of them, 129,860
   bytes, every one of them blocking the first paint. Thirteen of the
   twenty-one dressed exactly one section apiece and came to 90,700 of
   those bytes — just under 70% of the page's stylesheet weight, held in
   front of a visitor who came for his name, his face, his bio and his
   three contact links, none of which any of the fifteen touches. Those
   fifteen now arrive the same way their scripts do. (Thirteen on the day
   this was written; #chime made it fourteen on 11 November, and #sieve
   fifteen on the 14th.)

   What stays in the <head>, and why: style, intro, reveal, panel, rail,
   front, prov, theme. 40,364 bytes. Those are the page, the animation
   of his name, the reveal rule every section shares, the shared panel
   chrome, the navigator that carries his contact links, the control
   under his bio, the provenance disclosures, and the theme — which is
   to say, everything a visitor sees before scrolling, plus the three
   small shared files a deferred section would otherwise have to wait
   for twice. (panel.css is 3,651 bytes and is used by nine of the
   fifteen; it is cheaper to hold it than to work out who needs it.)

   Why this is safe, rather than clever:

     - Every one of the fifteen scripts is an IIFE that looks its own
       section up by id and returns if it is absent. None of them reads
       another's globals — every window.__x in js/ is a self-reference —
       so they can arrive in any order, late, or never.
     - Every one of the fifteen stylesheets is scoped to its own
       section: an id selector, or a class prefix no other file uses.
       The only rules any of them puts on :root are three private custom
       properties read nowhere outside the section that declares them.
       So none of the fifteen can change the look of anything that is
       already on screen, which is the property that makes deferring
       them safe at all. If that ever stops being true of a new file,
       this is the paragraph it breaks.
     - Each link is inserted immediately before the <noscript> in the
       <head> that lists all fifteen, not appended to the body. The
       cascade therefore holds exactly: after the seven that block, and
       before theme.css, which is where they were written.
     - A section's stylesheet is requested first and its script follows
       when the stylesheet has landed — or failed. That costs a round
       trip, which the 1200px of lead pays for, and it buys the
       guarantee that no rig is ever shown before it is dressed: the
       script's last act is to un-hide the rig, so the script must not
       win that race.
     - Every section they furnish was already built to stand without
       them: the interactive rig carries a `hidden` attribute in the
       markup with a visible static fallback beside it, and the script's
       last act is to swap the two. Until it runs, the section is its own
       no-JavaScript version, and that version was designed rather than
       left over. Its prose is dressed by style.css either way.
     - With JavaScript off, nothing here runs and the browser applies
       all fifteen out of the <noscript> itself. The page is then
       exactly what it was before 2026-11-06: every byte, up front.

   What it does NOT do is make the page smaller. Read to the bottom and
   you have fetched every byte you used to fetch. What it does is
   decline to spend them on somebody who came for the bio. Of the
   374,309 bytes of stylesheet and script this page can ask for, an
   arrival that reads his name, his photo, his paragraph and his contact
   links and then leaves now takes 110,673 — 40,364 of blocking
   stylesheet, 11,221 more because #known sits inside the 1200px lead,
   39,859 of script in the <head>, and ask.js at 19,229 because it
   belongs to #known and comes in behind it. Before 6 November the same
   arrival took the lot. (Every figure in this comment is a byte count typed into a
   comment, which is exactly the kind of claim the rest of this page
   refuses to type into its markup, and two of them were already wrong a
   day after they were written: the script totals here read 23,834 and
   32,456 on 6 November and were stale by the 7th, when js/front.js
   grew. They are corrected rather than dropped, because the paragraphs
   above need them to mean anything — and they will go stale again.
   They went stale again on 11 November, when #chime arrived with a
   fourteenth stylesheet and a thirteenth script, and again on the same
   day when correcting this paragraph grew the file the paragraph is
   counting. They were stale again by 12 November — the fourteen read
   98,938 against 100,384 and the whole read 319,775 against 333,918 —
   and were caught by the audit that also found The Handover publishing
   ten wrong line numbers for two nights. They were stale again on
   13 November, when ask.js arrived inside the lead and this paragraph
   went on quoting an arrival cost that no longer included it; that is
   the error this paragraph is most prone to, because a new file inside
   the 1200px lead costs every visitor and a new file outside it costs
   almost none. Recounted on 14 November, with #sieve. Every figure in
   it is the settled one, and will not stay that way.)

   Three limitations, stated rather than hidden. Text a section's script
   draws — the charts, the readouts, the generated captions — is not in
   the document until that script has run, so find-in-page cannot see it
   before you get there; the prose carrying each finding is in the HTML
   and always was. Laziness is given up the moment you jump rather than
   scroll: see the last block of this file for why, and for what the
   jump had to be taught instead. And printing pulls everything in on
   beforeprint, which for a script is merely late but for a stylesheet
   is a race the dialog can win — a first print from a cold load may set
   some sections in the browser's own default. A second print gets
   everything. That is the honest cost of the fifteen, and it is worth
   it. */
(function () {
  'use strict';

  /* The id of the section -> the two files scoped to it. A section may
     have a stylesheet and no script; none currently has a script and no
     stylesheet, but the loader does not mind either way. */
  var SECTIONS = {
    known: { css: 'known.css', js: 'ask.js' },
    source: { css: 'source.css', js: 'source.js' },
    north: { css: 'north.css', js: 'north.js' },
    shelf: { css: 'shelf.css', js: 'shelf.js' },
    booth: { css: 'booth.css', js: 'booth.js' },
    stack: { css: 'stack.css', js: 'stack.js' },
    threshold: { css: 'threshold.css', js: 'threshold.js' },
    handover: { css: 'handover.css', js: 'handover.js' },
    contact: { css: 'doors.css', js: 'doors.js' },
    resume: { css: 'resume.css', js: 'resume.js' },
    proxy: { css: 'proxy.css', js: 'proxy.js' },
    post: { css: 'post.css', js: 'post.js' },
    fit: { css: 'fit.css', js: 'fit.js' },
    chime: { css: 'chime.css', js: 'chime.js' },
    sieve: { css: 'sieve.css', js: 'sieve.js' }
  };

  /* Resolved against this file's own URL rather than the document's, so
     the paths hold wherever the page is served from. js/ -> the sibling
     css/ directory. */
  var self = document.currentScript && document.currentScript.src;
  var jsBase = self ? self.replace(/[^/]*$/, '') : 'js/';
  var cssBase = jsBase.replace(/js\/$/, 'css/');

  /* Where a stylesheet goes: immediately before the <noscript> that
     lists all fifteen, which is the position they were written in. If
     that element is ever removed, fall back to the end of <head>, which
     puts them after theme.css — a cascade this page does not currently
     depend on either way, and the <noscript> is there to keep it that
     way. */
  var slot = document.querySelector('head [data-css-slot]');

  var done = {};

  function addScript(file) {
    var s = document.createElement('script');
    s.src = jsBase + file;
    s.async = true;
    document.body.appendChild(s);
  }

  function load(id) {
    var files = SECTIONS[id];
    if (!files || done[id]) return;
    done[id] = true;

    if (!files.css) {
      if (files.js) addScript(files.js);
      return;
    }

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssBase + files.css;

    /* The script waits for the stylesheet either way. On success because
       the rig must be dressed before it is shown; on failure because a
       missing stylesheet is no reason to withhold a working control —
       the rig would be plain, not broken, and its section's prose is
       dressed by style.css regardless. */
    if (files.js) {
      var go = function () { addScript(files.js); };
      link.addEventListener('load', go);
      link.addEventListener('error', go);
    }

    if (slot && slot.parentNode) slot.parentNode.insertBefore(link, slot);
    else document.head.appendChild(link);
  }

  function loadAll() {
    Object.keys(SECTIONS).forEach(load);
  }

  /* Drop any section that is not in this document. A script with nothing
     to attach to would return on its first line, and a stylesheet with
     nothing to dress matches nothing; not requesting either is the same
     outcome without the round trip. */
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
    files: function (id) { return SECTIONS[id] || null; },
    load: load,
    all: loadAll
  };

  /* No IntersectionObserver: behave exactly as the markup used to, all
     of them at once. Nothing below this line is load-bearing. */
  if (!('IntersectionObserver' in window)) {
    loadAll();
    return;
  }

  /* 1200px of lead — on a phone, two screens of warning, which is more
     than one flick of a thumb covers before a stylesheet of 5-11 KB and
     a script of 5-19 KB have landed one after the other. Outrun it and
     you see the section's own prose in style.css's hands for a moment,
     and then the rest arrives. */
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
     imprecise.

     Stylesheets made this block matter more rather than less: a
     stylesheet landing changes a section's height as surely as a rig
     does, and the three-second window now has to cover both. */

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

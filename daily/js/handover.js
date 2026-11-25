/* The Handover — finding his sixteen lines in this file
   ----------------------------------------------------------------------
   Added 2026-11-01. Cut back 2026-11-24 with the section it serves: the
   ribbon drawing of this document and the slider for stepping through
   his lines were pictures of the agent's own file, so both are gone and
   so is the code for them. What is left does two jobs.

   One: write the line numbers into the list of his sixteen lines. The
   numbers are measured, not typed. This file fetches daily/index.html —
   the same bytes the browser has already parsed — and locates each line
   by what surrounds it:

     * eleven of the sixteen are lines whose text occurs exactly once in
       the whole file (the doctype, the three metas, the year script, and
       so on), so that text is the address and cannot go stale.
     * three are located relative to the line before them.
     * two have no unique text of their own — a mid-file `  </section>`
       identical to sixteen others, and a blank line identical to two
       hundred and eighty — so each is found at or below an anchor that
       does occur exactly once: `  <section id="shelf">` and
       `  </footer>`. No rule here uses a line number.

   data-total and data-lines in the markup are a fallback only, for a
   browser that cannot fetch. If the fetch fails, or any one of the
   sixteen does not resolve, the rig prints those typed figures and says
   on screen that they were typed rather than measured. It never
   silently prints a figure it could not verify.

   With this file absent: no numbers — and the sixteen lines are still
   listed, in order, as text, which is the whole of the finding.

   Two: the floor check, far below, which looks in this document for the
   seven things rule two of his brief protects.

   window.__handover.audit() reports the section's own assertions. */
(function () {
  'use strict';

  var section = document.getElementById('handover');
  if (!section) return;

  var rig    = section.querySelector('[data-ho-rig]');
  var list   = section.querySelector('.ho-lines');
  var nojs   = section.querySelector('.ho-nojs');
  if (!rig || !list) return;

  var rows = [].slice.call(list.children);

  /* ---------- the typed figures, which are now only a fallback ---------- */

  var typedTotal = parseInt(rig.getAttribute('data-total'), 10);
  var typedNums = (rig.getAttribute('data-lines') || '')
    .split(/[\s,]+/)
    .filter(function (s) { return s !== ''; })
    .map(function (s) { return parseInt(s, 10); });

  var total = typedTotal;
  var nums = typedNums;
  var source = 'typed';      /* 'measured' once the file has been read */
  var trouble = '';          /* why it is still 'typed', if it is */
  var sane = false;

  /* ---------- finding his sixteen in the file itself ----------

     In file order, and each with the rule that finds it. 'unique' means
     the line's text occurs exactly once in daily/index.html, so the text
     is the address. 'after' means it is the line immediately following
     the one before it, and must read as given. 'next' means the first
     line at or below the previous one that reads as given. 'below' is
     for the two whose own text is not unique: each is the first line
     reading as given at or below an anchor that does occur exactly
     once, so neither needs a line number. No rule here uses one. */
  var SPEC = [
    { how: 'unique', text: '<!doctype html>' },
    { how: 'unique', text: '<html lang="en">' },
    { how: 'unique', text: '<head>' },
    { how: 'unique', text: '<meta charset="utf-8" />' },
    { how: 'unique', text: '<meta name="viewport" content="width=device-width,initial-scale=1" />' },
    { how: 'unique', text: '<meta name="robots" content="noindex" />' },
    { how: 'unique', text: '</head>' },
    { how: 'unique', text: '<body>' },
    { how: 'after',  text: '' },
    { how: 'next',   text: '  </section>' },
    { how: 'after',  text: '' },
    { how: 'below',  anchor: '  <section id="shelf">', text: '  </section>' },
    { how: 'below',  anchor: '  </footer>',              text: '' },
    { how: 'unique', text: "<script>document.getElementById('year').textContent = new Date().getFullYear();</script>" },
    { how: 'unique', text: '</body>' },
    { how: 'unique', text: '</html>' }
  ];

  function resolve(lines) {
    var out = [], prev = 0, i, j, n, hits;
    if (SPEC.length !== rows.length) return { fail: 'the rig lists ' + rows.length + ' lines and the resolver knows ' + SPEC.length + '.' };
    for (i = 0; i < SPEC.length; i++) {
      n = -1;
      if (SPEC[i].how === 'unique') {
        hits = [];
        for (j = 0; j < lines.length; j++) if (lines[j] === SPEC[i].text) hits.push(j + 1);
        if (hits.length !== 1) return { fail: 'line ' + (i + 1) + ' of the sixteen was meant to be unique in the file and occurs ' + hits.length + ' times.' };
        n = hits[0];
      } else if (SPEC[i].how === 'after') {
        n = prev + 1;
        if (lines[n - 1] !== SPEC[i].text) return { fail: 'the line after ' + prev + ' is no longer what it was.' };
      } else if (SPEC[i].how === 'next') {
        for (j = prev; j < lines.length; j++) if (lines[j] === SPEC[i].text) { n = j + 1; break; }
        if (n < 0) return { fail: 'no ' + SPEC[i].text.trim() + ' found below line ' + prev + '.' };
      } else if (SPEC[i].how === 'below') {
        var anchors = [];
        for (j = 0; j < lines.length; j++) if (lines[j] === SPEC[i].anchor) anchors.push(j + 1);
        if (anchors.length !== 1) {
          return { fail: 'the anchor ' + SPEC[i].anchor.trim() + ', which line ' + (i + 1) + ' of the sixteen sits below, occurs ' + anchors.length + ' times in the file and has to occur exactly once.' };
        }
        for (j = anchors[0] - 1; j < lines.length; j++) if (lines[j] === SPEC[i].text) { n = j + 1; break; }
        if (n < 0) return { fail: 'nothing reading as line ' + (i + 1) + ' of the sixteen was found at or below ' + SPEC[i].anchor.trim() + '.' };
      } else {
        return { fail: 'line ' + (i + 1) + ' of the sixteen carries a rule this resolver does not know: ' + SPEC[i].how + '.' };
      }
      if (n <= prev) return { fail: 'the sixteen came out of order at index ' + i + '.' };
      out.push(n);
      prev = n;
    }
    return { nums: out, total: lines.length };
  }

  /* ---------- state ---------- */

  /* data-code is authoritative when present, including when it is the
     empty string — which is exactly the case for his blank lines, whose
     visible content is a marker of mine rather than anything he wrote.
     Only the audit reads this now; nothing on screen depends on it. */
  function codeOf(li) {
    var code = li.querySelector('.ho-code');
    if (!code) return null;
    var a = code.getAttribute('data-code');
    return a === null ? code.textContent : a;
  }

  /* ---------- wiring ---------- */

  function start() {
    /* If the rows and the numbers disagree, every number this file would
       write is suspect. Say nothing rather than label the rows wrongly:
       the rows themselves are already correct and already on the page. */
    sane = !!total && total > 0 &&
      nums.length === rows.length &&
      nums.every(function (n) { return !isNaN(n) && n >= 1 && n <= total; });
    if (!sane) return;

    rows.forEach(function (li, i) {
      var slot = li.querySelector('[data-ho-n]');
      if (slot) slot.textContent = nums[i].toLocaleString('en-US');
    });

    /* The file's length, quoted once in the prose above and written from
       the same measurement the numbers come from, so this section cannot
       carry two figures for one file that drift apart. */
    var fl = section.querySelector('[data-ho-filelines]');
    if (fl) fl.textContent = total.toLocaleString('en-US');

    /* Say which of the two it is. A figure nobody can check is the thing
       this rig got wrong once, so it states its own provenance on its
       face rather than in the note at the foot. */
    var how = section.querySelector('[data-ho-how]');
    if (how) {
      how.textContent = source === 'measured'
        ? 'Sixteen line numbers, measured from this file as your browser loaded it.'
        : 'Typed by hand, and not verified this load' + (trouble ? ' — ' + trouble : '.');
      how.setAttribute('data-ho-how', source);
    }

    if (nojs) nojs.hidden = true;
  }

  /* ---------- read the file, then wire ----------

     The document is already in the browser's cache, so this is normally
     a cache hit and costs nothing on the wire. It is started when this
     file runs, which js/load.js only does when the section is within
     1200px — so a visitor who never reaches The Handover never asks for
     it. Whichever settles first, the fetch or the four-second timeout,
     wires the rig exactly once. */
  var booted = false;

  function boot(got, why) {
    if (booted) return;
    booted = true;
    if (got) { nums = got.nums; total = got.total; source = 'measured'; }
    else { trouble = why || ''; }
    start();
  }

  window.setTimeout(function () { boot(null, 'the file did not come back in time.'); }, 4000);

  if (typeof window.fetch === 'function') {
    window.fetch('index.html', { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (text) {
        var lines = text.split('\n');
        /* A trailing newline is the end of the last line, not a line. */
        if (lines.length && lines[lines.length - 1] === '') lines.pop();
        var got = resolve(lines);
        if (got.fail) boot(null, got.fail);
        else boot(got, '');
      })
      .catch(function (e) {
        boot(null, 'the file could not be read back (' + (e && e.message ? e.message : 'fetch failed') + ').');
      });
  } else {
    boot(null, 'this browser has no fetch.');
  }


  /* ---------- the floor: his rule, performed instead of asserted ----------

     Rule two of daily/PROMPT.md lists five bullets the page must keep in
     some visible, reachable form. The last bullet is three links, so the
     list protects seven things. This section claimed six of them from
     1 November to 18 November 2026, directly above a sentence asserting
     that all of them were still present, and nothing checked either
     claim. So: seven selectors, run against the document the visitor
     already has, reported with the number of places each one is found in.

     What this is not: proof that the rule is met. It shows the elements
     are in the markup — not that they are visible, legible, or findable
     by a stranger, and a selector cannot tell the difference. Nor is it
     the real guard: an agent free to drop the seven is free to drop this
     too. The guard is the pre-commit check in the brief and a git
     history nobody rewrites. What it is good for is that the claim is
     now made in front of you, and that it found the miscount. */

  var floorBox  = section.querySelector('[data-ho-floor]');
  var floorList = section.querySelector('[data-ho-floor-list]');
  var floorSum  = section.querySelector('[data-ho-floor-sum]');
  var floorNojs = section.querySelector('.ho-floor-nojs');

  function all(sel) {
    try { return [].slice.call(document.querySelectorAll(sel)); }
    catch (e) { return []; }
  }

  /* Normalised so a line break or a run of spaces in the markup cannot
     hide a phrase that is plainly there on screen. */
  function flat(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function byText(sel, parts) {
    return all(sel).filter(function (el) {
      var t = flat(el);
      return parts.every(function (fragment) { return t.indexOf(fragment) !== -1; });
    });
  }

  var FLOOR = [
    { what: 'His name, as the page\u2019s subject',
      how: 'a heading or a label reading \u201cRuslan Manoharan\u201d',
      go: ['#about', 'About'],
      find: function () { return byText('h1, h2, .rail-home, footer', ['Ruslan Manoharan']); } },

    { what: 'The About bio text',
      how: 'his whole paragraph, matched on two phrases from either end of it',
      go: ['#about', 'About'],
      find: function () { return byText('p', ['the PNW has my heart', 'collecting retro tech']); } },

    { what: 'The profile photo',
      how: 'an image whose source is images/profile.jpg',
      go: ['#about', 'About'],
      find: function () { return all('img[src*="images/profile.jpg"]'); } },

    { what: 'The resume link',
      how: 'a link to the Drive document behind his resume button',
      go: ['#resume', 'The Resume'],
      find: function () { return all('a[href*="drive.google.com/file"]'); } },

    { what: 'His email',
      how: 'a mailto: link to his address',
      go: ['#contact', 'The Doors'],
      find: function () { return all('a[href^="mailto:ruslan.manoharan@"]'); } },

    { what: 'His LinkedIn',
      how: 'a link to linkedin.com/in/ruslanmanoharan',
      go: ['#contact', 'The Doors'],
      find: function () { return all('a[href*="linkedin.com/in/ruslanmanoharan"]'); } },

    { what: 'His Instagram',
      how: 'a link to instagram.com/rumanoharan',
      go: ['#contact', 'The Doors'],
      find: function () { return all('a[href*="instagram.com/rumanoharan"]'); } }
  ];

  var floorResult = [];

  function checkFloor() {
    if (!floorBox || !floorList) return;

    floorResult = FLOOR.map(function (item) {
      var hits;
      try { hits = item.find(); } catch (e) { hits = []; }
      return { what: item.what, how: item.how, go: item.go, count: hits.length, ok: hits.length > 0 };
    });

    while (floorList.firstChild) floorList.removeChild(floorList.firstChild);

    floorResult.forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'ho-fl';
      li.setAttribute('data-ok', r.ok ? 'true' : 'false');

      var mark = document.createElement('span');
      mark.className = 'ho-fl-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = r.ok ? '\u2713' : '\u2717';
      li.appendChild(mark);

      var body = document.createElement('span');
      body.className = 'ho-fl-body';

      var what = document.createElement('span');
      what.className = 'ho-fl-what';
      what.textContent = r.what;
      /* The tick is decorative, so the verdict is also said in words. */
      var sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = r.ok ? ' \u2014 present. ' : ' \u2014 MISSING. ';
      what.appendChild(sr);
      body.appendChild(what);

      var how = document.createElement('span');
      how.className = 'ho-fl-how';
      how.textContent = r.how;
      body.appendChild(how);

      li.appendChild(body);

      var found = document.createElement('span');
      found.className = 'ho-fl-found';
      found.textContent = r.ok
        ? (r.count === 1 ? 'in 1 place' : 'in ' + r.count + ' places')
        : 'not found';
      li.appendChild(found);

      var go = document.createElement('a');
      go.className = 'ho-fl-go';
      go.href = r.go[0];
      go.textContent = r.go[1];
      li.appendChild(go);

      floorList.appendChild(li);
    });

    var kept = floorResult.filter(function (r) { return r.ok; });
    var places = floorResult.reduce(function (n, r) { return n + r.count; }, 0);

    if (floorSum) {
      if (kept.length === floorResult.length) {
        floorSum.textContent = 'All seven are here, in ' + places + ' places between them. '
          + 'Checked against this document as it loaded, not against a list written earlier.';
      } else {
        floorSum.textContent = kept.length + ' of ' + floorResult.length + '. Missing: '
          + floorResult.filter(function (r) { return !r.ok; })
              .map(function (r) { return r.what; }).join('; ')
          + '. That is a broken rule, not a bug in this list \u2014 the git history is one revert deep.';
      }
    }

    floorBox.setAttribute('data-ok', kept.length === floorResult.length ? 'true' : 'false');
    floorBox.hidden = false;
    if (floorNojs) floorNojs.hidden = true;
  }

  checkFloor();

  /* ---------- audit ---------- */

  window.__handover = {
    audit: function () {
      var out = {
        total: total,
        marked: nums.length,
        rows: rows.length,
        consistent: sane,
        source: source,
        typedTotal: typedTotal,
        typedNums: typedNums.join(' '),
        shown: nums.join(' '),
        floor: floorResult.map(function (r) { return r.what + ': ' + (r.ok ? r.count + ' place(s)' : 'MISSING'); }),
        problems: []
      };
      if (floorResult.length !== 7) out.problems.push('the floor check knows ' + floorResult.length + ' protected things; his rule lists seven.');
      floorResult.forEach(function (r) {
        if (!r.ok) out.problems.push('his rule protects \u201c' + r.what + '\u201d and it is not in this document.');
      });
      if (!sane) out.problems.push('the numbers and the list disagree, so no line numbers were written.');
      if (source !== 'measured') out.problems.push('the figures on screen are the typed ones, unverified against the file — ' + (trouble || 'reason not recorded.'));
      if (source === 'measured' && (total !== typedTotal || nums.join(' ') !== typedNums.join(' '))) {
        out.problems.push('data-total/data-lines in the markup have gone stale against the file: typed ' + typedTotal + ' / ' + typedNums.join(' ') + ', measured ' + total + ' / ' + nums.join(' ') + '. The screen shows the measured figures; the attributes want retyping.');
      }
      if (nums.length !== 16) out.problems.push('this section’s prose says sixteen; data-lines carries ' + nums.length + '.');
      for (var i = 1; i < nums.length; i++) {
        if (nums[i] <= nums[i - 1]) out.problems.push('line numbers are not ascending at index ' + i + ' — the list is meant to be in file order.');
      }
      rows.forEach(function (li, i) {
        if (codeOf(li) === null) out.problems.push('row ' + i + ' has no line text.');
      });
      return out;
    }
  };
}());

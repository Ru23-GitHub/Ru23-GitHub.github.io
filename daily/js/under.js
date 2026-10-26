/* The Smaller Word — one control, and an audit
   ----------------------------------------------------------------------
   Added 2026-10-26. This section is seven <details> elements and the
   browser already does everything that matters: toggling, the keyboard,
   the ARIA, expanding a closed row when find-in-page lands inside it.
   Delete this file and the closing argument still reads and still opens.

   So there are only two things here, both of which <details> cannot do
   for itself.

   1. One button that opens or closes all seven at once. Its label says
      which it will do and how many, and it is written by this file
      rather than typed into the HTML, so it cannot disagree with the
      number of rows actually in the list. The button does not exist
      without this file, which is why it ships hidden.

   2. audit(). Every row in this section cites another section of this
      page by fragment, and sections here get deleted — The Ledger went
      on 23 October, the museum went on 5 October, nineteen files at
      once. A closing argument that points at a finding which no longer
      exists is worse than no closing argument, so the check is one call
      away rather than a thing to remember: window.__under.audit()
      returns any row whose link resolves to nothing, plus any row whose
      printed number disagrees with its position. */
(function () {
  'use strict';

  var sec = document.getElementById('under');
  if (!sec) return;

  var rows = [].slice.call(sec.querySelectorAll('.un-det'));
  if (!rows.length) return;

  var wrap = sec.querySelector('[data-un-all]');
  var btn = sec.querySelector('[data-un-allbtn]');

  /* Spelled out because the rest of the section is: "Open all 7" in a
     page that writes "seven" everywhere else would read as a different
     author. Falls back to the digits past twelve, which this list will
     never reach, but an untested branch is a worse thing to leave than
     an ugly one. */
  var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six',
               'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

  function word(n) { return WORDS[n] || String(n); }

  function openCount() {
    return rows.filter(function (d) { return d.open; }).length;
  }

  function label() {
    if (!btn) return;
    /* The button offers whichever move affects more rows, so one press
       always does something visible. On a tie — and seven cannot tie —
       it would offer to open. */
    var open = openCount();
    var willOpen = open * 2 <= rows.length;
    btn.textContent = willOpen
      ? 'Open all ' + word(rows.length)
      : 'Close all ' + word(rows.length);
    btn.setAttribute('data-will', willOpen ? 'open' : 'close');
  }

  if (btn && wrap) {
    wrap.hidden = false;
    label();

    btn.addEventListener('click', function () {
      var willOpen = btn.getAttribute('data-will') === 'open';
      rows.forEach(function (d) { d.open = willOpen; });
      label();
    });

    /* A row toggled on its own changes what the button should offer. */
    rows.forEach(function (d) {
      d.addEventListener('toggle', label);
    });
  }

  /* ---------- the audit ---------- */

  function audit() {
    var bad = [];

    rows.forEach(function (d, i) {
      var no = d.querySelector('.un-no');
      var want = String(i + 1);
      if (want.length < 2) want = '0' + want;
      if (no && no.textContent.trim() !== want) {
        bad.push({ row: i + 1, problem: 'number reads ' + no.textContent.trim() + ', should read ' + want });
      }

      var links = [].slice.call(d.querySelectorAll('a[href^="#"]'));
      if (!links.length) {
        bad.push({ row: i + 1, problem: 'cites no section' });
      }
      links.forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        if (!id || !document.getElementById(id)) {
          bad.push({ row: i + 1, problem: 'cites #' + id + ', which is not on this page' });
        }
      });
    });

    return { rows: rows.length, open: openCount(), problems: bad };
  }

  window.__under = { audit: audit };
}());

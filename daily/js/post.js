/* 20 / The Correspondence — the three figures that are arithmetic
   ----------------------------------------------------------------------
   Added 2026-11-03.

   The letters in this section are text in the markup and need nothing
   from this file to be read. What this file does is refuse to let three
   numbers be typed in:

     1. the turnaround on each answered question, and their sum, taken
        from the <time datetime> on the letter that went out and the one
        that came back;
     2. how long the unanswered question has been open, which is a figure
        that is wrong the moment it is written down;
     3. the word counts in the tally — his two replies against his bio —
        counted off the quoted strings on this page.

   (3) carries an assertion, in the manner of js/front.js: the claim this
   section makes is that his two replies come to one word MORE than the
   fifty-three on his homepage, and if the strings above ever stop
   supporting that, the tally stays hidden rather than saying it anyway.

   The word rule is the one js/source.js and js/front.js use, deliberately
   and to the character: a run of letters or digits that may carry
   internal apostrophes, hyphens or dots. Three places on this page now
   count words and they must not be able to disagree about what one is. */

(function () {
  'use strict';

  var root = document.getElementById('post');
  if (!root) return;

  var WORD = /[0-9A-Za-z][0-9A-Za-z'’.\-]*/g;

  function words(text) {
    return (String(text || '').match(WORD) || []).length;
  }

  function ms(el) {
    if (!el) return NaN;
    var t = el.getAttribute('datetime');
    if (!t) return NaN;
    var v = Date.parse(t);
    return isNaN(v) ? NaN : v;
  }

  /* 49m 56s / 1h 45m 40s. Seconds are kept because they are known: these
     came off mail headers, not off a memory of roughly how long it took. */
  function span(delta) {
    var s = Math.round(delta / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    return (h ? h + 'h ' + m + 'm ' + sec + 's' : m + 'm ' + sec + 's');
  }

  var report = { turnarounds: [], open: null, counts: {}, problems: [] };

  /* ---------- 1. turnaround, and the sum of them ---------- */

  var total = 0;
  var answered = 0;

  [].forEach.call(root.querySelectorAll('[data-po-ex]'), function (ex) {
    var out = ex.querySelector('[data-po-sent]');
    var back = ex.querySelector('[data-po-replied]');
    var slot = ex.querySelector('[data-po-turn]');
    if (!slot) return;

    var a = ms(out);
    var b = ms(back);

    if (!isNaN(a) && !isNaN(b) && b > a) {
      slot.textContent = 'answered in ' + span(b - a);
      slot.removeAttribute('data-po-open');
      total += b - a;
      answered++;
      report.turnarounds.push({ id: ex.getAttribute('data-po-ex'), took: span(b - a) });
      return;
    }

    /* No reply: the figure is how long that has been true, which is why
       it is counted here and not written into the file. */
    if (!isNaN(a) && !back) {
      var days = Math.floor((Date.now() - a) / 86400000);
      if (days >= 0) {
        slot.textContent = 'no reply — ' + days + (days === 1 ? ' day' : ' days');
        slot.setAttribute('data-po-open', '');
        report.open = { id: ex.getAttribute('data-po-ex'), days: days };
      }
      return;
    }

    report.problems.push('exchange ' + ex.getAttribute('data-po-ex') + ': timestamps missing or out of order; its badge was left alone.');
  });

  var sum = root.querySelector('[data-po-total]');
  if (sum && answered === 2 && total > 0) sum.textContent = span(total);
  report.totalWait = total ? span(total) : null;

  /* ---------- 2. the tally ---------- */

  var tally = root.querySelector('[data-po-tally]');
  var bio = document.querySelector('[data-fd-bio]');
  var said = [].slice.call(root.querySelectorAll('[data-po-said]'));

  if (!tally || !bio || said.length !== 2) {
    report.problems.push('the tally was not drawn: his bio or one of the two replies was not on the page.');
    window.__post = { audit: function () { return report; } };
    return;
  }

  var wBio = words(bio.textContent);
  var wLetters = said.reduce(function (n, el) { return n + words(el.textContent); }, 0);

  report.counts = { bio: wBio, letters: wLetters, each: said.map(function (el) { return words(el.textContent); }) };

  /* The claim, stated as a test. Fifty-three is the figure two other
     sections publish for his bio; fifty-four is what his two replies come
     to; the section's whole point is that the second is one larger. */
  if (wBio !== 53 || wLetters !== 54) {
    report.problems.push('the tally stayed hidden: his bio counts ' + wBio + ' and his replies ' + wLetters + ', which no longer supports the claim this section makes.');
    window.__post = { audit: function () { return report; } };
    return;
  }

  var most = Math.max(wBio, wLetters);

  [].forEach.call(tally.querySelectorAll('[data-po-bar]'), function (bar) {
    var n = bar.getAttribute('data-po-bar') === 'letters' ? wLetters : wBio;
    var fill = bar.querySelector('[data-po-fill]');
    var num = bar.querySelector('[data-po-num]');
    if (num) num.textContent = n + ' words';
    if (fill) fill.style.width = (n / most * 100).toFixed(2) + '%';
  });

  tally.hidden = false;

  var nojs = root.querySelector('[data-po-nojs]');
  if (nojs) nojs.hidden = true;

  window.__post = { audit: function () { return report; } };
})();

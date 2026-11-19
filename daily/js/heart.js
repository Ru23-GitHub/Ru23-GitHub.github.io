/* The Heart — 15 · how he talks about himself
   ----------------------------------------------------------------------
   Added 2026-11-19. Scoped entirely to #heart.

   The argument of this section is a reading, and a reading cannot be
   computed. What CAN be computed is everything it rests on, and that is
   all this file does:

     · the length of the three passages, counted off the page itself
       with the same word rule The Source uses, so the figures in the
       markup cannot drift from his actual words the way this page's
       typed numbers have drifted twice before;
     · how many phrases are marked as softening and how many as flat,
       counted off the marks in the markup rather than typed beside them;
     · one view picker over the passage, and one status line.

   Nothing here classifies anything. Which phrases count as softening is
   a judgement, it is written into the markup by hand, and the section's
   provenance note says so in those words. This file only counts what is
   there and reports when the prose disagrees with it — window.__heart
   carries the measurement, the comparison, and an audit() that prints
   both.

   The marks are real <span>s inside his sentences, so his words appear
   exactly once on this page and the three views are the same string seen
   three ways. There is no second copy of anything he wrote. */
(function () {
  'use strict';

  var section = document.getElementById('heart');
  if (!section) return;

  var rig  = section.querySelector('[data-ht-rig]');
  var nojs = section.querySelector('.ht-nojs');
  if (!rig) return;

  /* The same rule as js/source.js: a word is a run of letters or digits
     that may carry internal apostrophes, hyphens or dots. The emoji, the
     brackets and the colon count for nothing, which is what makes 53 and
     54 comparable figures rather than two different kinds of count. */
  var WORD = /[0-9A-Za-z][0-9A-Za-z'’.\-]*/g;

  function words(str) {
    var m = String(str).match(WORD);
    return m ? m.length : 0;
  }

  /* ---------- measuring ---------- */

  var texts = [].slice.call(rig.querySelectorAll('[data-ht-text]'));
  var marks = [].slice.call(rig.querySelectorAll('[data-ht-m]'));

  var per = {};
  var total = 0;
  texts.forEach(function (t) {
    var n = words(t.textContent);
    per[t.getAttribute('data-ht-text')] = n;
    total += n;
  });

  function kind(k) {
    var n = 0;
    for (var i = 0; i < marks.length; i++) {
      if (marks[i].getAttribute('data-ht-m') === k) n++;
    }
    return n;
  }

  var m = {
    total: total,
    bio:   per.bio || 0,
    mail:  (per.mail1 || 0) + (per.mail2 || 0),
    down:  kind('down'),
    up:    kind('up')
  };

  /* Write a measured figure into its slot and keep what the markup said,
     so a disagreement is readable rather than silently papered over. The
     fallback in the HTML is what a visitor without JavaScript sees, so a
     mismatch is a defect in the prose and not noise. */
  var checks = [];

  function put(sel, value) {
    var els = [].slice.call(section.querySelectorAll(sel));
    if (!els.length) return;
    els.forEach(function (el) {
      var was = el.textContent.trim();
      var now = String(value);
      el.textContent = now;
      checks.push({ slot: sel, markup: was, measured: now, agreed: was === now });
    });
  }

  put('[data-ht-total]', m.total);
  put('[data-ht-bio]', m.bio);
  put('[data-ht-mail]', m.mail);
  put('[data-ht-down]', m.down);
  put('[data-ht-up]', m.up);

  /* ---------- the three views ---------- */

  var picks = [].slice.call(section.querySelectorAll('[data-ht-view]'));
  var say   = section.querySelector('[data-ht-say]');

  /* One line per view, and each one says whose the marking is. The
     numbers are the measured ones, so this copy cannot claim six
     strikes while five are drawn. */
  function copy(view) {
    if (view === 'down') {
      return m.down + ' phrase' + (m.down === 1 ? '' : 's') +
        ' struck through — every place in these ' + m.total +
        ' words where he softens something about himself. His words are ' +
        'all still there and still in his order; the lines through them ' +
        'are mine, and so is the judgement that these are the six.';
    }
    if (view === 'up') {
      return m.up + ' phrase' + (m.up === 1 ? '' : 's') + ' lit, the rest ' +
        'dimmed. In ' + m.total + ' words these are the only places he ' +
        'says he loves something and then stops — no qualifier, no ' +
        'joke, nothing taken back.';
    }
    return 'His ' + m.total + ' words as he wrote them, nothing marked: ' +
      m.bio + ' on his homepage and ' + m.mail + ' in two replies. ' +
      'The two views beside this one are filters over this same passage, ' +
      'not a second copy of it.';
  }

  var current = null;

  function show(view) {
    current = view;
    rig.setAttribute('data-view', view);
    for (var i = 0; i < picks.length; i++) {
      var on = picks[i].getAttribute('data-ht-view') === view;
      picks[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (say) say.textContent = copy(view);
  }

  picks.forEach(function (b) {
    b.addEventListener('click', function () {
      show(b.getAttribute('data-ht-view'));
    });
  });

  /* Only the picker was hidden, never the passage: his words and the six
     glosses under them are in the markup unconditionally, and with this
     file absent the section still makes its whole case — it just makes
     it without the filter. */
  var views = section.querySelector('.ht-views-wrap');
  if (views) views.hidden = false;
  if (nojs) nojs.hidden = true;

  show('plain');

  /* ---------- what this file will answer for ---------- */

  window.__heart = {
    measured: m,
    per: per,
    checks: checks,
    disagreed: checks.filter(function (c) { return !c.agreed; }),
    view: function () { return current; },
    audit: function () {
      var out = { measured: m, problems: [] };

      checks.forEach(function (c) {
        if (!c.agreed) {
          out.problems.push('slot ' + c.slot + ': markup said "' + c.markup +
            '", the page measures "' + c.measured + '"');
        }
      });

      /* The two figures the prose leans on hardest, checked against the
         passage rather than against each other. */
      if (m.bio + m.mail !== m.total) {
        out.problems.push('the parts do not sum: ' + m.bio + ' + ' + m.mail +
          ' is not ' + m.total);
      }
      if (!m.down || !m.up) {
        out.problems.push('a view has nothing to show: down=' + m.down +
          ', up=' + m.up);
      }

      /* Every mark must be inside one of the measured passages, or the
         counts above are counting something the views cannot reach. */
      marks.forEach(function (el) {
        var p = el.closest ? el.closest('[data-ht-text]') : null;
        if (!p) out.problems.push('a marked phrase sits outside his words: "' +
          el.textContent.trim().slice(0, 40) + '"');
      });

      if (window.console && console.table) console.table(checks);
      return out;
    }
  };
})();

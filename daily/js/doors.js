/* The Doors — measuring the eight forms, and taking two pieces out of one
   ----------------------------------------------------------------------
   Added 2026-10-25. Everything load-bearing in this section is in the
   HTML: his four links, the eight nameplates with their character counts
   printed as digits, and the three handle forms spelled out in prose in
   the closing note. With this file removed the finding still reads; what
   goes missing is the length bars and the reducer's three buttons.

   So both of those ship [hidden] or at zero width and are turned on at the
   bottom of this file. A control that does nothing is worse than no
   control, and a 3px rule that is never going to be given a length is
   just a stray hairline across a card.

   Two things this file deliberately does not do.

   It does not type any of his names. The counts are measured off the text
   in each nameplate, so the digits in the markup and the bars underneath
   them cannot drift apart — and if they ever did, audit() below says which
   row. The three doors are ONE string in the markup whose pieces this file
   strikes through by moving a state attribute; the only strings owned here
   are the three captions, which are the agent's own writing and are tagged
   as chrome in the markup rather than as anything he said.

   It does not sort. The eight plates are in the order a visitor actually
   meets them — the address before the page, the page before the bio, the
   bio before the doors, the doors before a reply — and that order is the
   markup's, not this file's. Sorting them by length would have made the
   bars tidier and the sequence meaningless. */
(function () {
  'use strict';

  var section = document.getElementById('contact');
  if (!section) return;

  /* ---------- the eight nameplates ---------- */

  var plates = [].slice.call(section.querySelectorAll('.dr-plate'));
  var measured = [];

  if (plates.length) {
    /* All eight forms are ASCII, so length in UTF-16 code units is also
       length in characters. Spelled out rather than assumed, because the
       one form on this list that is not his writing is a domain, and the
       next thing added here might not be ASCII. */
    function count(el) {
      var s = (el.textContent || '').trim();
      return (typeof Array.from === 'function' ? Array.from(s) : s.split('')).length;
    }

    var max = 0;

    plates.forEach(function (plate) {
      var form = plate.querySelector('.dr-form');
      var out = plate.querySelector('[data-dr-count]');
      if (!form) return;

      var n = count(form);
      if (n > max) max = n;

      measured.push({
        form: (form.textContent || '').trim(),
        n: n,
        /* What the markup claimed before this file touched it. */
        printed: out ? parseInt((out.textContent || '').replace(/\D+/g, ''), 10) : null,
        bar: plate.querySelector('.dr-bar > span'),
        out: out
      });
    });

    measured.forEach(function (row) {
      if (row.out) row.out.textContent = row.n + ' chars';
      if (row.bar && max > 0) row.bar.style.width = (row.n / max * 100).toFixed(2) + '%';
    });
  }

  /* ---------- the reducer ---------- */

  var str = section.querySelector('[data-dr-string]');
  var picks = [].slice.call(section.querySelectorAll('.dr-pick'));
  var nojs = section.querySelector('.dr-nojs');
  var reads = section.querySelector('[data-dr-reads]');
  var clearBtn = section.querySelector('[data-dr-clear]');
  var controls = section.querySelector('[data-dr-controls]');

  var DEFAULT = 'email';

  var CAPTION = {
    email: 'The mailbox, whole: sixteen characters, one dot, both names in full. The longest of the three, and the only one of them he hands out as a sentence rather than as a URL.',
    linkedin: 'The dot goes. Fifteen characters, and the two names have become one word — because a LinkedIn path cannot hold a full stop.',
    instagram: 'Four more letters go, out of the middle of his first name. Eleven characters, and what is left of "Ruslan" is the two that his own mail signs itself with.'
  };

  var view = DEFAULT;

  function paint() {
    if (str) str.setAttribute('data-state', view);

    picks.forEach(function (btn) {
      btn.setAttribute('aria-pressed',
        btn.getAttribute('data-dr-view') === view ? 'true' : 'false');
    });

    if (reads) reads.textContent = CAPTION[view] || '';
    if (clearBtn) clearBtn.disabled = view === DEFAULT;
  }

  function show(next) {
    if (!CAPTION.hasOwnProperty(next)) return;
    view = next;
    paint();
  }

  picks.forEach(function (btn) {
    btn.addEventListener('click', function () {
      show(btn.getAttribute('data-dr-view'));
    });
  });

  if (clearBtn) clearBtn.addEventListener('click', function () { show(DEFAULT); });

  section.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && view !== DEFAULT) show(DEFAULT);
  });

  /* ---------- wire up ---------- */

  if (nojs) nojs.setAttribute('hidden', '');
  if (reads) reads.removeAttribute('hidden');
  if (controls) controls.removeAttribute('hidden');
  paint();

  window.__doors = {
    /* The eight forms and their measured lengths, in document order. */
    forms: measured.map(function (r) { return { form: r.form, chars: r.n }; }),

    /* Any nameplate whose printed digits disagree with its own string. */
    audit: function () {
      return measured.filter(function (r) {
        return r.printed !== null && r.printed !== r.n;
      }).map(function (r) {
        return { form: r.form, printed: r.printed, measured: r.n };
      });
    },

    views: ['email', 'linkedin', 'instagram'],
    view: function () { return view; },
    show: show,

    /* What the one string actually reads in each state, taken off the DOM
       rather than listed here — the check that the three doors are one
       string with pieces withheld and never a fourth spelling. */
    renders: function () {
      if (!str) return {};
      var was = view;
      var parts = [].slice.call(str.querySelectorAll('[data-part]'));
      var out = {};
      ['email', 'linkedin', 'instagram'].forEach(function (v) {
        show(v);
        out[v] = parts.filter(function (el) {
          return window.getComputedStyle(el).textDecorationLine.indexOf('line-through') === -1;
        }).map(function (el) { return el.textContent; }).join('');
      });
      show(was);
      return out;
    }
  };
}());

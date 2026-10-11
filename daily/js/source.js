/* Fifty-Three Words — his bio read as the page's source text
   ----------------------------------------------------------------------
   Added 2026-10-11.

   The substance of this section is in the HTML: his paragraph split into
   seven clauses, and a map of eight rows saying what each one became.
   With JavaScript off, both read straight down the page and nothing is
   missing — which is why the clauses ship as plain <span>s and only
   become controls here.

   What this file adds:

     - the four figures, measured off the clause spans in the DOM rather
       than trusted from the markup. The markup carries them too, because
       they have to be right with JavaScript off, so the two can disagree;
       when they do, the measurement wins and window.__source records the
       disagreement. A typed "53 words" is true for one commit and
       quietly false after the next one.

     - picking a clause, which narrows the map to that clause's row and
       sets the rest aside.

   Two details worth keeping:

   The clauses become role="button" rather than being <button>s in the
   markup, because a <button> will not break across lines and the longest
   clause here is twenty-one words. A span wraps; promoting it at runtime
   gets the semantics without the layout cost, and leaves the no-JS page
   honest about what is and is not interactive.

   Escape clears, and so does picking the lit clause again, so no visitor
   can get stuck looking at a page with six of eight rows set aside. */
(function () {
  'use strict';

  var section = document.getElementById('source');
  if (!section) return;

  var para = section.querySelector('[data-src-text]');
  var map = section.querySelector('.src-map');
  if (!para || !map) return;

  var clauses = [].slice.call(para.querySelectorAll('.src-clause'));
  var rows = [].slice.call(map.querySelectorAll('.src-row'));
  if (!clauses.length || !rows.length) return;

  var status = section.querySelector('[data-src-status]');
  var hint = section.querySelector('[data-src-hint]');

  /* Same definition as the Ledger's, deliberately: a word is a run of
     letters or digits that may carry internal apostrophes, hyphens or
     dots. Keep the two in step. */
  var WORD = /[0-9A-Za-z][0-9A-Za-z'’.\-]*/g;

  /* An emoji here is one character above U+2100, skipping the variation
     selector and the zero-width joiner. That makes 🌧️ — a cloud plus
     U+FE0F — count once rather than twice, and it is why this counts
     code points rather than UTF-16 units: a surrogate pair is one
     emoji, not two. */
  function countEmoji(str) {
    var n = 0;
    var chars = Array.from ? Array.from(str) : str.split('');
    for (var i = 0; i < chars.length; i++) {
      var cp = chars[i].codePointAt(0);
      if (cp > 0x2100 && cp !== 0xfe0f && cp !== 0x200d) n++;
    }
    return n;
  }

  function measure() {
    var text = clauses.map(function (c) { return c.textContent; }).join(' ');
    var w = text.match(WORD);
    var built = 0;
    for (var i = 0; i < clauses.length; i++) {
      if (!clauses[i].hasAttribute('data-empty')) built++;
    }
    return {
      words: w ? w.length : 0,
      emoji: countEmoji(text),
      stops: (text.match(/\./g) || []).length,
      built: built,
      clauses: clauses.length
    };
  }

  /* Write a measured figure into its slot and report whether the markup
     already agreed. The fallback value in the HTML is what a visitor
     without JavaScript sees, so a mismatch is a real defect, not noise. */
  function put(sel, value) {
    var el = section.querySelector(sel);
    if (!el) return null;
    var was = el.textContent.trim();
    var now = String(value);
    el.textContent = now;
    return { slot: sel, markup: was, measured: now, agreed: was === now };
  }

  var m = measure();
  var checks = [
    put('[data-src-words]', m.words),
    put('[data-src-emoji]', m.emoji),
    put('[data-src-stops]', m.stops),
    put('[data-src-built]', m.built + ' of ' + m.clauses)
  ].filter(Boolean);

  /* ---------- picking a clause ---------- */

  var current = null;

  function rowFor(key) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute('data-row') === key) return rows[i];
    }
    return null;
  }

  function paint() {
    for (var i = 0; i < clauses.length; i++) {
      var key = clauses[i].getAttribute('data-clause');
      clauses[i].setAttribute('aria-pressed', key === current ? 'true' : 'false');
    }
    for (var j = 0; j < rows.length; j++) {
      var on = current !== null && rows[j].getAttribute('data-row') === current;
      rows[j].classList.toggle('src-on', on);
      rows[j].classList.toggle('src-aside', current !== null && !on);
    }
  }

  function describe() {
    if (!status) return;
    if (current === null) {
      status.textContent = 'Nothing picked. All eight rows below are shown.';
      return;
    }
    var row = rowFor(current);
    var title = row ? (row.querySelector('dt') || {}).textContent : '';
    var clause = null;
    for (var i = 0; i < clauses.length; i++) {
      if (clauses[i].getAttribute('data-clause') === current) clause = clauses[i];
    }
    var empty = clause && clause.hasAttribute('data-empty');
    status.textContent = empty
      ? 'That clause became nothing. The row below says why.'
      : 'That clause became ' + String(title).replace(/\s+/g, ' ').trim() + '.';
  }

  function reveal(key) {
    var row = rowFor(key);
    if (!row || typeof row.scrollIntoView !== 'function') return;
    var box = row.getBoundingClientRect();
    if (box.top >= 0 && box.bottom <= (window.innerHeight || 0)) return;
    row.scrollIntoView({ block: 'nearest' });
  }

  function pick(key) {
    current = (current === key) ? null : key;
    paint();
    describe();
    if (current !== null) reveal(current);
  }

  for (var i = 0; i < clauses.length; i++) {
    (function (el) {
      var key = el.getAttribute('data-clause');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-pressed', 'false');
      el.addEventListener('click', function () { pick(key); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          pick(key);
        }
      });
    })(clauses[i]);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && current !== null) {
      current = null;
      paint();
      describe();
    }
  });

  para.classList.add('src-live');
  if (hint) hint.hidden = false;
  describe();

  window.__source = {
    measured: m,
    checks: checks,
    disagreements: checks.filter(function (c) { return !c.agreed; }),
    pick: pick,
    current: function () { return current; }
  };
})();

/* Fifty-Three Words — his bio read as the page's source text
   ----------------------------------------------------------------------
   Added 2026-10-11. Rebuilt 2026-11-17, when the map below turned out to
   have been understating itself for eight days.

   The substance of this section is in the HTML: his paragraph split into
   seven clauses, and a map saying what became of each one. The map has
   nine rows for seven clauses, because one section on this page rests on
   the paragraph as a whole rather than on any clause of it, and five rest
   on nothing he wrote about himself at all. With JavaScript off, the
   paragraph and the map read straight down the page and nothing is
   missing — which is why the clauses ship as plain <span>s and only
   become controls here.

   What this file adds:

     - the four figures, and every row's list of sections, measured off
       the page rather than trusted from the markup. The markup carries
       them too, because they have to be right with JavaScript off, so
       the two can disagree; when they do, the measurement wins and
       window.__source records the disagreement.

     - picking a clause, which narrows the map to that clause's row and
       sets the rest aside.

   Why the filing is checked at all. On 9 November nine sections were
   deleted from this page and on the 14th a new one arrived, and through
   all of it this map went on claiming that `collecting retro tech 💾`
   had produced exactly one section and `AI tools` exactly one. By the
   16th it was four short, and the index at the top of the page — which
   keeps its own count of the same thing — had been right the whole time.
   Nothing was comparing them. So RESTS below is now checked against the
   page's own table of contents on every load: every numbered section in
   the contents must be filed in exactly one row, and no row may name a
   section the contents does not list. A map that cannot pass that check
   is left exactly as the markup wrote it and the failure is published in
   window.__source.problems, because a stale row a visitor can read is
   better than a confident row this file made up.

   Two details worth keeping:

   The clauses become role="button" rather than being <button>s in the
   markup, because a <button> will not break across lines and the longest
   clause here is twenty-one words. A span wraps; promoting it at runtime
   gets the semantics without the layout cost, and leaves the no-JS page
   honest about what is and is not interactive.

   Escape clears, and so does picking the lit clause again, so no visitor
   can get stuck looking at a page with all but one row set aside. */
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

  /* ---------- the filing ----------

     Section id -> the row it is filed under. The two keys beginning with
     a double underscore are the rows that are not clauses of his
     paragraph: __whole is the paragraph read entire, __other is a
     section that rests on something outside it. Every other key is a
     data-clause value from the paragraph above.

     This is a judgement, not a measurement, and the provenance note
     under the map says which calls are arguable. What is checked is that
     it is complete and that it names nothing that is not there. */
  var RESTS = {
    source: '__whole',
    north: 'pnw',
    shelf: 'retro',
    booth: 'karaoke',
    stack: '__other',
    threshold: 'ai',
    handover: '__other',
    contact: '__other',
    resume: '__other',
    proxy: 'ai',
    post: '__other',
    fit: 'retro',
    chime: 'retro',
    sieve: 'ai',
    heart: '__whole',
    type: '__other'
  };

  /* The page's own table of contents, which is the navigator at the top:
     one entry per numbered section, carrying its number, its codename and
     where it points. Read rather than duplicated, so that adding a
     section to the page is enough to make this file notice it. */
  function contents() {
    var out = [];
    var links = document.querySelectorAll('.rail-list a[data-no][href^="#"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      out.push({
        no: (a.getAttribute('data-no') || '').trim(),
        id: a.getAttribute('href').slice(1),
        name: (a.getAttribute('data-name') || '').replace(/\s+/g, ' ').trim()
      });
    }
    return out;
  }

  var toc = contents();
  var problems = [];

  if (!toc.length) {
    problems.push('no table of contents found: cannot check the filing');
  } else {
    var seen = {};
    toc.forEach(function (f) {
      seen[f.id] = true;
      if (!RESTS[f.id]) {
        problems.push('section ' + f.no + ' (#' + f.id + ') is in the contents and filed nowhere');
      }
    });
    Object.keys(RESTS).forEach(function (id) {
      if (!seen[id]) problems.push('#' + id + ' is filed but is not in the contents');
    });
    Object.keys(RESTS).forEach(function (id) {
      var key = RESTS[id];
      if (!map.querySelector('.src-row[data-row="' + key + '"]')) {
        problems.push('#' + id + ' is filed under "' + key + '", which has no row');
      }
    });
  }

  /* Section number order, which is page order, so a row's list reads the
     way the page does. */
  var groups = {};
  if (!problems.length) {
    toc.forEach(function (f) {
      var key = RESTS[f.id];
      (groups[key] || (groups[key] = [])).push(f);
    });
  }

  /* ---------- the measured figures ---------- */

  /* A word is a run of letters or digits that may carry internal
     apostrophes, hyphens or dots — so the emoji, the brackets and the
     lone full stop in his paragraph count for nothing. */
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

    /* How many clauses of his paragraph carry at least one section, and
       how many of the fourteen come out of the paragraph at all. Both are
       counted off the filing above rather than typed. */
    var hits = 0;
    var fromHim = 0;
    for (var i = 0; i < clauses.length; i++) {
      var key = clauses[i].getAttribute('data-clause');
      var g = groups[key];
      if (g && g.length) { hits++; fromHim += g.length; }
    }
    if (groups.__whole) fromHim += groups.__whole.length;

    return {
      words: w ? w.length : 0,
      emoji: countEmoji(text),
      stops: (text.match(/\./g) || []).length,
      clauses: clauses.length,
      hits: hits,
      fromHim: fromHim,
      findings: toc.length
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
    put('[data-src-emoji]', m.emoji)
  ];

  if (!problems.length) {
    checks.push(put('[data-src-hit]', m.hits + ' of ' + m.clauses));
    checks.push(put('[data-src-his]', m.fromHim + ' of ' + m.findings));
  }

  checks = checks.filter(Boolean);

  /* Small numbers as words, because the rest of the page writes them
     that way and a row reading "3 sections" would be the only place on
     it that does not. */
  var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
               'fourteen', 'fifteen'];

  function count(n) {
    return (n < WORDS.length ? WORDS[n] : String(n)) +
      ' section' + (n === 1 ? '' : 's');
  }

  /* ---------- each row's list of sections ----------

     Rebuilt from the contents, so the number and the codename beside a
     link are the page's own and cannot drift from the navigator. What the
     markup said is kept first, for the same reason the figures are: a
     disagreement here is a defect worth being able to read. */
  function hitsHTML(list) {
    return list.map(function (f) {
      return '<li><a href="#' + f.id + '">' +
        '<span class="src-hit-no" aria-hidden="true">' + f.no + '</span>' +
        '<span class="src-hit-n"></span></a></li>';
    }).join('');
  }

  if (!problems.length) {
    var lists = [].slice.call(map.querySelectorAll('[data-src-hits]'));
    lists.forEach(function (ul) {
      var key = ul.getAttribute('data-src-hits');
      var want = groups[key] || [];
      var had = [].slice.call(ul.querySelectorAll('a')).map(function (a) {
        return a.getAttribute('href');
      }).join(' ');
      var now = want.map(function (f) { return '#' + f.id; }).join(' ');

      ul.innerHTML = hitsHTML(want);
      /* The codename is set as text rather than interpolated into the
         HTML above, so a name carrying a quote or an ampersand cannot
         become markup. */
      var names = [].slice.call(ul.querySelectorAll('.src-hit-n'));
      for (var i = 0; i < names.length && i < want.length; i++) {
        names[i].textContent = want[i].name;
      }

      checks.push({ slot: '[data-src-hits="' + key + '"]', markup: had, measured: now, agreed: had === now });
    });

    /* And the count in each row's heading, for the same reason: a typed
       "three sections" is the exact thing that was wrong here before. A
       row with nothing in it says so in its own words — a clause he
       named and this page has not earned anything on is a gap, and his
       greeting is not. */
    var heads = [].slice.call(map.querySelectorAll('[data-src-n]'));
    heads.forEach(function (el) {
      var key = el.getAttribute('data-src-n');
      var n = (groups[key] || []).length;
      var row = el.closest ? el.closest('.src-row') : null;
      var kind = row ? row.getAttribute('data-kind') : '';
      var was = el.textContent.trim();
      var now = n ? count(n) : (kind === 'gap' ? 'nothing yet' : 'no section');
      el.textContent = now;
      checks.push({ slot: '[data-src-n="' + key + '"]', markup: was, measured: now, agreed: was === now });
    });
  }

  /* ---------- picking a clause ---------- */

  var current = null;

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

  function clauseFor(key) {
    for (var i = 0; i < clauses.length; i++) {
      if (clauses[i].getAttribute('data-clause') === key) return clauses[i];
    }
    return null;
  }

  function describe() {
    if (!status) return;
    if (current === null) {
      status.textContent = 'Nothing picked. All ' + rows.length +
        ' rows below are shown.';
      return;
    }
    var clause = clauseFor(current);
    var list = groups[current] || [];

    if (!list.length) {
      status.textContent = clause && clause.hasAttribute('data-empty')
        ? 'That clause became nothing. The row below says why.'
        : 'No section rests on that clause. The row below says why it is here anyway.';
      return;
    }

    var named = list.map(function (f) { return f.no + ' ' + f.name; }).join(', ');
    status.textContent = 'That clause became ' + count(list.length) + ': ' + named + '.';
  }

  function rowFor(key) {
    return map.querySelector('.src-row[data-row="' + key + '"]');
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
    filing: RESTS,
    contents: toc,
    groups: groups,
    problems: problems,
    checks: checks,
    disagreements: checks.filter(function (c) { return !c.agreed; }),
    pick: pick,
    current: function () { return current; }
  };
})();

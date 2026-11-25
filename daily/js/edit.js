/* 26 / The Edit — checks this page's quotations of him against its own record
   ----------------------------------------------------------------------
   Added 2026-11-25.

   The three divergences this section describes were all found by hand,
   which is the problem: nothing was looking. This file is the thing that
   looks, and it runs on every load.

   What it compares
   ----------------
   Every element marked data-verbatim="bio|mail1|mail2" claims to be his
   words, reproduced. The canonical copy of each is read out of the DOM,
   not stored here:

     bio    <p data-fd-bio>            in #about  — his paragraph, carried
                                       over from the root of this domain
     mail1  <p data-ht-text="mail1">   in #post   — his reply of 5 Oct 2026
     mail2  <p data-ht-text="mail2">   in #post   — his reply of 7 Oct 2026

   Keeping the canonical strings in the DOM rather than in this file is
   deliberate, and it is the same rule #about already states about his
   bio: no second copy of his writing is kept. A copy in here would be a
   fourth transcript to drift, and it would be the one nobody reads.

   The honest limit of this
   -----------------------
   This is an internal consistency check. It proves the quotations agree
   with the transcript in #post; it cannot prove the transcript agrees
   with what he actually sent, because this page has no access to his
   mailbox. If the transcript were wrong, every check here would pass.
   The section says so in print, and so does this comment.

   #about's bio paragraph has three views and two of them rewrite its
   text in place. When it is not in the view he wrote, the bio checks are
   reported as "not checked" rather than guessed at or silently skipped.

   window.__edit.audit() prints the whole table. */

(function () {
  'use strict';

  var sec = document.getElementById('edit');
  if (!sec) return;

  /* ---- normalisation -------------------------------------------------
     Only differences that are differences in what he typed should fail.
     Curly punctuation, non-breaking spaces and line wrapping are this
     page's typesetting, not his writing, so they are flattened first. */

  function norm(s) {
    if (s == null) return '';
    s = String(s);
    if (s.normalize) s = s.normalize('NFC');
    return s
      .replace(/[‘’‛]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[   ]/g, ' ')
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /* A quotation may be wrapped in quote marks and may be cut short with
     an ellipsis. Neither is a change to his words. */
  function unwrap(s) {
    return s
      .replace(/^["'‘’“”]+/, '')
      .replace(/["'‘’“”]+$/, '')
      .replace(/(\.\.\.|…)$/, '')
      .trim();
  }

  function textOf(el) {
    return el ? norm(el.textContent) : '';
  }

  /* ---- the canonical copies, read out of the page -------------------- */

  var bioEl = document.querySelector('[data-fd-bio]');
  var bioWritten = !!bioEl && bioEl.getAttribute('data-view') === 'written';

  var SOURCE = {
    bio: {
      label: 'his bio, in About',
      text: bioWritten ? textOf(bioEl) : '',
      ready: bioWritten,
      why: bioEl
        ? 'the bio is showing one of its two rewritten views, so there is nothing verbatim to check against'
        : 'the bio paragraph is not on the page'
    },
    mail1: {
      label: 'his reply of 5 Oct, in 11',
      text: textOf(document.querySelector('[data-ht-text="mail1"]')),
      ready: !!document.querySelector('[data-ht-text="mail1"]'),
      why: 'the transcript of his first reply is not on the page'
    },
    mail2: {
      label: 'his reply of 7 Oct, in 11',
      text: textOf(document.querySelector('[data-ht-text="mail2"]')),
      ready: !!document.querySelector('[data-ht-text="mail2"]'),
      why: 'the transcript of his second reply is not on the page'
    }
  };

  /* ---- run it -------------------------------------------------------- */

  var marks = [].slice.call(document.querySelectorAll('[data-verbatim]'));

  var rows = marks.map(function (el) {
    var key = el.getAttribute('data-verbatim');
    var src = SOURCE[key];
    var quoted = unwrap(norm(el.textContent));
    var where = el.getAttribute('data-vwhere') || 'a quotation';

    if (!src) {
      return { state: 'unknown', where: where, src: key, detail: 'no canonical source named ' + key };
    }
    if (!src.ready) {
      return { state: 'skipped', where: where, src: src.label, detail: src.why };
    }
    if (!quoted) {
      return { state: 'skipped', where: where, src: src.label, detail: 'the element is empty' };
    }
    return {
      state: src.text.indexOf(quoted) !== -1 ? 'match' : 'differs',
      where: where,
      src: src.label,
      detail: src.text.indexOf(quoted) !== -1
        ? 'reproduced exactly'
        : 'this does not appear in what he wrote'
    };
  });

  var nMatch = rows.filter(function (r) { return r.state === 'match'; }).length;
  var nDiff = rows.filter(function (r) { return r.state === 'differs' || r.state === 'unknown'; }).length;
  var nSkip = rows.filter(function (r) { return r.state === 'skipped'; }).length;

  /* ---- render --------------------------------------------------------- */

  var MARK = { match: '✓', differs: '✕', unknown: '✕', skipped: '–' };

  var list = sec.querySelector('[data-ed-table]');
  var verdict = sec.querySelector('[data-ed-verdict]');
  var rig = sec.querySelector('[data-ed-rig]');
  var nojs = sec.querySelector('.ed-nojs');

  if (!list || !verdict || !rig) return;

  rows.forEach(function (r) {
    var li = document.createElement('li');
    li.className = 'ed-line';
    li.setAttribute('data-ok', r.state === 'match' ? 'yes' : (r.state === 'skipped' ? 'skip' : 'no'));

    var m = document.createElement('span');
    m.className = 'ed-mark';
    m.setAttribute('aria-hidden', 'true');
    m.textContent = MARK[r.state] || '?';

    var w = document.createElement('span');
    w.className = 'ed-what';
    w.textContent = r.where + ' — ' + r.detail;

    var s = document.createElement('span');
    s.className = 'ed-src';
    s.textContent = r.src;

    li.appendChild(m);
    li.appendChild(w);
    li.appendChild(s);
    list.appendChild(li);
  });

  var line;
  if (!rows.length) {
    line = 'nothing on this page is marked as a quotation of him';
  } else if (nDiff) {
    line = nDiff + ' of ' + rows.length + ' do not match what he wrote';
  } else {
    line = nMatch + ' of ' + rows.length + ' reproduced exactly';
    if (nSkip) line += ', ' + nSkip + ' not checked';
  }
  verdict.textContent = line;
  verdict.setAttribute('data-ok', nDiff ? 'no' : 'yes');

  rig.hidden = false;
  if (nojs) nojs.hidden = true;

  window.__edit = {
    rows: rows,
    sources: SOURCE,
    audit: function () {
      /* eslint-disable no-console */
      console.log('The Edit — ' + line);
      rows.forEach(function (r) {
        console.log('  ' + (MARK[r.state] || '?') + ' ' + r.where + ' [' + r.src + '] ' + r.detail);
      });
      return rows;
    }
  };
})();

/* The Handover — drawing the file, and stepping through his sixteen lines
   ----------------------------------------------------------------------
   Added 2026-11-01. Scoped entirely to #handover.

   Until 12 November this file did nothing but read two typed attributes:

     data-total   lines in daily/index.html as committed
     data-lines   the line numbers still attributed to Ruslan Manoharan

   Both come from `git blame`, which needs the repository, so the figures
   were retyped by hand on the nights somebody remembered. Nothing checked
   them, and on 12 November they were found to have been wrong for two
   nights: the file had grown from 1,683 lines to 1,788, and ten of the
   sixteen numbers on screen pointed at lines that were no longer his.

   So the numbers are no longer trusted. This file now fetches
   daily/index.html — the same bytes the browser has already parsed — and
   finds his lines in it:

     * eleven of the sixteen are lines whose text occurs exactly once in
       the whole file (the doctype, the three metas, the year script,
       and so on). Those are located by that text and cannot go stale.
     * three more are located relative to the one before them: the blank
       after <body>, the hero's closing tag, the blank after that.
     * two cannot be. A mid-file `  </section>` and a blank line near the
       bottom are his by git history and are textually identical to
       fifteen and two hundred and thirty-five others. Those two stay
       pinned in data-lines — and are checked against the fetched file
       before anything is printed.

   If the fetch fails, or any one of the sixteen does not resolve, the rig
   falls back to the typed attributes and says on screen that the numbers
   were typed rather than measured. It never silently prints a figure it
   has not been able to verify, which is the failure this replaced.

   What this file adds:

     1. the ribbon — one tick per line in data-lines, placed at its true
        position in the file. The ticks are drawn from the same attribute
        the list is checked against, so the picture cannot drift from the
        evidence beside it.
     2. the line numbers in the list, written in from the fetched file
        rather than typed sixteen times beside the sixteen lines they
        number.
     3. a slider that walks the sixteen, lighting the row and its tick
        and naming what that line does.

   With this file absent: no ribbon, no slider, no numbers — and the
   sixteen lines are still listed, in order, as text, which is the whole
   of the finding. That is why the ribbon is [data-chrome] and
   aria-hidden and the list is neither.

   window.__handover.audit() reports the section's own assertions. */
(function () {
  'use strict';

  var section = document.getElementById('handover');
  if (!section) return;

  var rig    = section.querySelector('[data-ho-rig]');
  var list   = section.querySelector('.ho-lines');
  var ribbon = section.querySelector('[data-ho-ribbon]');
  var pick   = section.querySelector('[data-ho-pick]');
  var slider = section.querySelector('[data-ho-slider]');
  var read   = section.querySelector('[data-ho-read]');
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
     line at or below the previous one that reads as given. 'pin' means
     the file cannot tell it from its identical twins and the number has
     to come out of data-lines — checked against the file before use. */
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
    { how: 'pin',    text: '  </section>' },
    { how: 'pin',    text: '' },
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
      } else {
        n = typedNums[i];
        if (!n || lines[n - 1] !== SPEC[i].text) return { fail: 'pinned line ' + n + ' is not the one it was pinned to; it has moved and data-lines has not.' };
      }
      if (n <= prev) return { fail: 'the sixteen came out of order at index ' + i + '.' };
      out.push(n);
      prev = n;
    }
    return { nums: out, total: lines.length };
  }

  /* ---------- what each of his lines is for ---------- */

  /* Keyed by the line's text rather than by its index, so that a line
     moving up or down the file — which happens on any night the agent
     edits above it — cannot hand a row somebody else's description. */
  function role(code) {
    var t = (code || '').trim();
    if (t === '') return 'A blank line.';
    if (t === '<!doctype html>') return 'The first line of the file.';
    if (t === '<html lang="en">') return 'The element everything else is inside, and the one place this page declares what language it is in.';
    if (t === '<head>') return 'Opens the head.';
    if (t === '</head>') return 'Closes it. Everything between these two is the agent’s now — thirty-odd stylesheets and a script that were three stylesheets when he cloned the file.';
    if (t.indexOf('charset') > -1) return 'The character set. It is the reason the emoji in his bio arrive as emoji.';
    if (t.indexOf('viewport') > -1) return 'The viewport. It is the reason this page fits your phone at all.';
    if (t.indexOf('robots') > -1) return 'Keeps the experiment out of search results. He wrote it in the commit that made the clone.';
    if (t === '<body>') return 'Opens the body.';
    if (t === '</body>') return 'Closes it.';
    if (t === '</html>') return 'The last line of the file.';
    if (t === '</section>') return 'A closing tag. The section it closes has been rewritten; the tag at the end of it is his.';
    if (t.indexOf('getFullYear') > -1) return 'The only program of his still running on this page. Its whole job is to keep the year beside his name from going out of date.';
    return 'His.';
  }

  /* ---------- the ribbon ---------- */

  var NS = 'http://www.w3.org/2000/svg';
  var ticks = [];

  function draw() {
    if (!ribbon || !sane) return;

    /* A 1,000-unit box in the long direction, so one unit is a little
       under three lines of his file and a tick is always visible. The
       ribbon turns with the layout: upright beside the list on a wide
       screen, flat above it on a phone. */
    var vertical = ribbon.clientHeight > ribbon.clientWidth;
    ribbon.setAttribute('viewBox', vertical ? '0 0 100 1000' : '0 0 1000 100');
    ribbon.setAttribute('preserveAspectRatio', 'none');
    while (ribbon.firstChild) ribbon.removeChild(ribbon.firstChild);
    ticks = [];

    nums.forEach(function (n, i) {
      var at = ((n - 1) / (total - 1)) * 1000;
      var r = document.createElementNS(NS, 'rect');
      r.setAttribute('class', 'ho-tick');
      /* Eight units of a thousand. Four was true to the line's share of
         the file and about 1.4px wide once the ribbon lies down across a
         390px phone, which is a tick nobody can see. Clamped below so the
         first and last are not drawn half outside the box they belong
         to. */
      var span = 8;
      var o = Math.max(0, Math.min(1000 - span, at - span / 2));
      if (vertical) {
        r.setAttribute('x', '0'); r.setAttribute('width', '100');
        r.setAttribute('y', String(o)); r.setAttribute('height', String(span));
      } else {
        r.setAttribute('y', '0'); r.setAttribute('height', '100');
        r.setAttribute('x', String(o)); r.setAttribute('width', String(span));
      }
      r.setAttribute('data-on', 'false');
      ribbon.appendChild(r);
      ticks[i] = r;
    });
  }

  /* ---------- state ---------- */

  var at = -1;

  /* data-code is authoritative when present, including when it is the
     empty string — which is exactly the case for his blank lines, whose
     visible content is a marker of mine rather than anything he wrote. */
  function codeOf(li) {
    var code = li.querySelector('.ho-code');
    if (!code) return null;
    var a = code.getAttribute('data-code');
    return a === null ? code.textContent : a;
  }

  function paint(i) {
    at = i;
    rows.forEach(function (li, j) {
      li.setAttribute('data-on', j === i ? 'true' : 'false');
    });
    ticks.forEach(function (t, j) {
      t.setAttribute('data-on', j === i ? 'true' : 'false');
    });

    if (!read) return;
    if (i < 0) { read.textContent = ''; return; }

    var text = codeOf(rows[i]);
    if (text === null) text = '';
    read.innerHTML = '';
    var b = document.createElement('b');
    b.textContent = 'Line ' + nums[i].toLocaleString('en-US');
    read.appendChild(b);
    read.appendChild(document.createTextNode(' of ' + total.toLocaleString('en-US') + ' — ' + role(text)));
    if (slider) slider.setAttribute('aria-valuetext', 'Line ' + nums[i] + '. ' + role(text));
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

    /* The ribbon's caption names the last line. Written from data-total
       rather than typed beside it, so this section carries one figure for
       the file's length and not two that can drift apart. */
    var last = section.querySelector('[data-ho-last]');
    if (last) last.textContent = total.toLocaleString('en-US');

    /* Say which of the two it is. A figure nobody can check is the thing
       this rig got wrong, so the rig states its own provenance on the
       face of it rather than in the note at the foot. */
    var how = section.querySelector('[data-ho-how]');
    if (how) {
      how.textContent = source === 'measured'
        ? 'Measured from this file as your browser loaded it.'
        : 'Typed by hand, and not verified this load' + (trouble ? ' — ' + trouble : '.');
      how.setAttribute('data-ho-how', source);
    }

    draw();

    if (slider && pick) {
      slider.min = '0';
      slider.max = String(rows.length - 1);
      slider.value = '0';
      slider.addEventListener('input', function () {
        var i = parseInt(slider.value, 10);
        paint(isNaN(i) ? 0 : Math.max(0, Math.min(rows.length - 1, i)));
      });
      pick.hidden = false;
      if (read) read.hidden = false;
      paint(0);
    }

    if (nojs) nojs.hidden = true;

    /* The ribbon's long axis depends on the layout, so it is redrawn when
       the layout can have changed. Nothing here animates. */
    var frame = 0;
    window.addEventListener('resize', function () {
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        var keep = at;
        draw();
        paint(keep);
      });
    }, { passive: true });
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
        problems: []
      };
      if (!sane) out.problems.push('the numbers and the list disagree: no numbers were written and the ribbon was not drawn.');
      if (source !== 'measured') out.problems.push('the figures on screen are the typed ones, unverified against the file — ' + (trouble || 'reason not recorded.'));
      if (source === 'measured' && (total !== typedTotal || nums.join(' ') !== typedNums.join(' '))) {
        out.problems.push('data-total/data-lines in the markup have gone stale against the file: typed ' + typedTotal + ' / ' + typedNums.join(' ') + ', measured ' + total + ' / ' + nums.join(' ') + '. The screen shows the measured figures; the attributes want retyping.');
      }
      if (nums.length !== 16) out.problems.push('this section’s prose says sixteen; data-lines carries ' + nums.length + '.');
      for (var i = 1; i < nums.length; i++) {
        if (nums[i] <= nums[i - 1]) out.problems.push('line numbers are not ascending at index ' + i + ' — the list is meant to be in file order.');
      }
      rows.forEach(function (li, i) {
        var text = codeOf(li);
        if (text === null) out.problems.push('row ' + i + ' has no line text.');
        else if (role(text) === 'His.') {
          out.problems.push('row ' + i + ' has no description of what that line does.');
        }
      });
      return out;
    }
  };
}());

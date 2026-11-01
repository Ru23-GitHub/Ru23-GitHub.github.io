/* The Handover — drawing the file, and stepping through his sixteen lines
   ----------------------------------------------------------------------
   Added 2026-11-01. Scoped entirely to #handover.

   Two numbers cannot be measured in a browser, so they are typed into the
   markup and this file does nothing but read them:

     data-total   lines in daily/index.html as committed
     data-lines   the line numbers still attributed to Ruslan Manoharan

   Both come from `git blame`, which needs the repository. The provenance
   note at the foot of the section gives the exact command, because a
   figure that cannot be checked from the page has to be checkable from
   somewhere.

   What this file adds:

     1. the ribbon — one tick per line in data-lines, placed at its true
        position in the file. The ticks are drawn from the same attribute
        the list is checked against, so the picture cannot drift from the
        evidence beside it.
     2. the line numbers in the list, written in from data-lines rather
        than typed sixteen times beside the sixteen lines they number.
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

  /* ---------- the two typed figures ---------- */

  var total = parseInt(rig.getAttribute('data-total'), 10);
  var nums = (rig.getAttribute('data-lines') || '')
    .split(/[\s,]+/)
    .filter(function (s) { return s !== ''; })
    .map(function (s) { return parseInt(s, 10); });

  /* If the markup and the attribute disagree about how many lines there
     are, every number this file would write is suspect. Say nothing
     rather than label the rows wrongly: the rows themselves are already
     correct and already on the page. */
  var sane = !!total && total > 0 &&
    nums.length === rows.length &&
    nums.every(function (n) { return !isNaN(n) && n >= 1 && n <= total; });

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

  if (sane) {
    rows.forEach(function (li, i) {
      var slot = li.querySelector('[data-ho-n]');
      if (slot) slot.textContent = nums[i].toLocaleString('en-US');
    });

    /* The ribbon's caption names the last line. Written from data-total
       rather than typed beside it, so this section carries one figure for
       the file's length and not two that can drift apart. */
    var last = section.querySelector('[data-ho-last]');
    if (last) last.textContent = total.toLocaleString('en-US');

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

  /* ---------- audit ---------- */

  window.__handover = {
    audit: function () {
      var out = {
        total: total,
        marked: nums.length,
        rows: rows.length,
        consistent: sane,
        problems: []
      };
      if (!sane) out.problems.push('data-lines and the list disagree, or data-total is missing: no numbers were written and the ribbon was not drawn.');
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

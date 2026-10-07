/* The Karaoke Booth — cue a song, and the timeline underneath it.
   ----------------------------------------------------------------------
   Added 2026-10-07. Scoped entirely to #booth.

   Source of the songs: Ruslan, by email, 7 October 2026, answering a
   direct question. He gave titles and artists. The release years are
   mine, looked up rather than recalled — which mattered: I had Soft Spot
   filed under keshi's GABRIEL (2022) and it is actually track four of
   Requiem, 13 September 2024. Had I trusted memory, the timeline below
   would have been wrong by two years and the thing it shows would have
   been weaker.

   Nothing here runs on a timer. The colour sweep is a one-shot CSS
   animation started by a click and finished by the browser, so there is
   no loop to pause when the tab hides or the section scrolls out of
   view, and nothing animates unless a person asks it to.

   The timeline is drawn here rather than written into the HTML because
   its geometry is derived from the data: move a year and the dot moves
   with it, instead of the markup and the facts drifting apart. */
(function () {
  'use strict';

  var root = document.getElementById('booth');
  if (!root) return;

  /* ---------- the setlist ---------- */

  var SONGS = {
    sugar:     { title: 'Sugar',      by: 'BROCKHAMPTON',                 year: 2019 },
    lowkey:    { title: 'Lowkey',     by: 'NIKI',                         year: 2019 },
    dialdrunk: { title: 'Dial Drunk', by: 'Noah Kahan feat. Post Malone', year: 2023 },
    softspot:  { title: 'Soft Spot',  by: 'keshi',                        year: 2024, fav: true }
  };

  /* The shelf's six machines, with the years already printed in their own
     captions one section up. Repeated here only so the chart can place
     them; if the two ever disagree the chart is the one that is wrong. */
  var SHELF = [
    { name: 'Walkman', year: 1979 },
    { name: 'Game Boy', year: 1989 },
    { name: 'Game Boy Color', year: 1998 },
    { name: 'Game Boy Advance', year: 2001 },
    { name: 'Game Boy Advance SP', year: 2003 },
    { name: 'Nintendo DS', year: 2004 }
  ];

  /* ---------- the screen ---------- */

  var rig = root.querySelector('.booth-rig');
  var nojs = root.querySelector('.booth-nojs');
  var elState = root.querySelector('[data-bs-state]');
  var elTitle = root.querySelector('[data-bs-title]');
  var elWipe = root.querySelector('[data-bs-wipe]');
  var elMeta = root.querySelector('[data-bs-meta]');
  var elFind = root.querySelector('[data-bs-find]');
  var elStatus = root.querySelector('[data-booth-status]');
  var rows = root.querySelectorAll('.booth-row');

  function cue(key) {
    var s = SONGS[key];
    if (!s) return;

    elState.textContent = s.fav ? 'Cued — his favourite' : 'Cued';
    elTitle.textContent = s.title;
    elWipe.textContent = s.title;
    elMeta.textContent = s.by + '  ·  ' + s.year;

    /* A search, not a link to a copy: it cannot point at the wrong
       recording, and it carries no third-party script onto this page. */
    elFind.href = 'https://www.youtube.com/results?search_query=' +
      encodeURIComponent(s.title + ' ' + s.by);
    elFind.textContent = 'Find “' + s.title + '” ↗';
    elFind.hidden = false;

    for (var i = 0; i < rows.length; i++) {
      var btn = rows[i].querySelector('.booth-cue');
      rows[i].setAttribute('aria-current',
        btn && btn.getAttribute('data-song') === key ? 'true' : 'false');
    }

    /* Restart the one-shot sweep. Removing the attribute, forcing a
       reflow and putting it back is the only reliable way to replay a CSS
       animation on an element that already finished one. */
    rig.removeAttribute('data-playing');
    void rig.offsetWidth;
    rig.setAttribute('data-playing', '');

    elStatus.textContent = 'Cued: ' + s.title + ' — ' + s.by + ', ' + s.year + '.' +
      (s.fav ? ' The one he called his most favourite song ever.' : '');
  }

  for (var i = 0; i < rows.length; i++) {
    (function (btn) {
      if (!btn) return;
      btn.addEventListener('click', function () { cue(btn.getAttribute('data-song')); });
    })(rows[i].querySelector('.booth-cue'));
  }

  /* ---------- the timeline ---------- */

  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (text != null) n.appendChild(document.createTextNode(text));
    return n;
  }

  /* Two layouts, not one scaled down.

     An SVG with width:100% scales its text with the viewBox, so the wide
     620-unit drawing rendered into a 350px phone column put the axis
     labels at about six pixels — present, measurable, and unreadable.
     Shrinking a chart is not the same as making a small one. The compact
     layout is a narrower viewBox (so a 13-unit label lands near 13px),
     with the band names moved above their rows where there is no room
     beside them, and ticks every twenty years instead of ten. */

  function layout(compact) {
    return compact
      ? { W: 360, H: 236, L: 14, R: 14, yShelf: 62, yBooth: 180, axis: 118,
          ticks: [1980, 2000, 2020], stack: 13, r: 5,
          /* Stacked: the band names go outside the rows, one above and one
             below, because the only space beside them is the tick row.
             The 1979/2024 end notes are dropped here — they collided with
             the band labels at both ends, and the key underneath already
             states both ranges, so nothing is lost but the overlap. */
          bands: 'stacked', endNotes: false }
      : { W: 620, H: 168, L: 112, R: 24, yShelf: 52, yBooth: 118, axis: 85,
          ticks: [1980, 1990, 2000, 2010, 2020], stack: 14, r: 5.5,
          bands: 'beside', endNotes: true };
  }

  function drawTimeline(svg, compact) {
    var C = layout(compact);
    var MIN = 1975, MAX = 2028;   // a little air either side of the data

    function x(year) { return C.L + (year - MIN) / (MAX - MIN) * (C.W - C.L - C.R); }

    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.classList.toggle('is-compact', !!compact);

    var g = el('g');

    // axis
    g.appendChild(el('line', { class: 'bt-axis', x1: C.L, y1: C.axis, x2: C.W - C.R, y2: C.axis }));
    C.ticks.forEach(function (y) {
      g.appendChild(el('line', { class: 'bt-axis', x1: x(y), y1: C.axis - 4, x2: x(y), y2: C.axis + 4 }));
      g.appendChild(el('text', { class: 'bt-tick', x: x(y), y: C.axis + 18, 'text-anchor': 'middle' }, y));
    });

    // the gap between the newest machine and the oldest song, marked once
    var gapA = x(2004), gapB = x(2019);
    g.appendChild(el('line', { class: 'bt-gapline', x1: gapA, y1: C.yShelf, x2: gapA, y2: C.yBooth }));
    g.appendChild(el('line', { class: 'bt-gapline', x1: gapB, y1: C.yShelf, x2: gapB, y2: C.yBooth }));
    g.appendChild(el('text', {
      class: 'bt-note', x: (gapA + gapB) / 2, y: C.axis - 10, 'text-anchor': 'middle'
    }, '15 years'));

    // band labels — direct, so the two series are never colour-only
    if (C.bands === 'stacked') {
      g.appendChild(el('text', { class: 'bt-band', x: C.L, y: C.yShelf - 26 }, 'The Shelf'));
      g.appendChild(el('text', { class: 'bt-band', x: C.L, y: C.yBooth + C.stack + 28 }, 'The Booth'));
    } else {
      g.appendChild(el('text', { class: 'bt-band', x: C.L - 16, y: C.yShelf + 4, 'text-anchor': 'end' }, 'The Shelf'));
      g.appendChild(el('text', { class: 'bt-band', x: C.L - 16, y: C.yBooth + 4, 'text-anchor': 'end' }, 'The Booth'));
    }

    function dot(item, y, series, label) {
      var c = el('circle', {
        class: 'bt-dot', 'data-series': series,
        cx: x(item.year), cy: y, r: C.r
      });
      c.appendChild(el('title', {}, label));
      g.appendChild(c);
    }

    SHELF.forEach(function (d) { dot(d, C.yShelf, 'shelf', d.name + ', ' + d.year); });

    /* Sugar and Lowkey are both 2019 and would land on the same point, so
       they are nudged apart vertically and keep their surface ring. */
    var songs = Object.keys(SONGS).map(function (k) { return SONGS[k]; });
    var byYear = {};
    songs.forEach(function (s) { byYear[s.year] = (byYear[s.year] || 0) + 1; });
    var placed = {};
    songs.forEach(function (s) {
      var n = byYear[s.year], i = (placed[s.year] = (placed[s.year] || 0) + 1) - 1;
      var offset = n > 1 ? (i - (n - 1) / 2) * C.stack : 0;
      dot(s, C.yBooth + offset, 'booth', s.title + ' \u2014 ' + s.by + ', ' + s.year);
    });

    // the two ends, labelled directly where there is room for them
    if (C.endNotes) {
      g.appendChild(el('text', { class: 'bt-note', x: x(1979), y: C.yShelf - 14, 'text-anchor': 'middle' }, '1979'));
      g.appendChild(el('text', { class: 'bt-note', x: x(2024), y: C.yBooth + C.stack + 22, 'text-anchor': 'middle' }, '2024'));
    }

    svg.setAttribute('viewBox', '0 0 ' + C.W + ' ' + C.H);
    svg.appendChild(g);
  }

  var chart = root.querySelector('[data-bt-chart]');
  var narrow = window.matchMedia ? window.matchMedia('(max-width: 680px)') : null;

  if (chart) {
    drawTimeline(chart, !!(narrow && narrow.matches));
    if (narrow) {
      var onChange = function () { drawTimeline(chart, narrow.matches); };
      if (narrow.addEventListener) narrow.addEventListener('change', onChange);
      else if (narrow.addListener) narrow.addListener(onChange);
    }
    var key = document.createElement('ul');
    key.className = 'bt-key';
    key.setAttribute('data-chrome', '');   // chart furniture, not prose
    key.innerHTML =
      '<li><i class="k-shelf" aria-hidden="true"></i> Hardware on his shelf (1979–2004)</li>' +
      '<li><i class="k-booth" aria-hidden="true"></i> Songs in his setlist (2019–2024)</li>';
    chart.parentNode.insertBefore(key, chart.nextSibling);
  }

  /* ---------- wire up ---------- */

  if (nojs) nojs.hidden = true;
  if (rig) rig.removeAttribute('hidden');
  elStatus.textContent = 'Nothing cued yet. Four songs in the book.';

  window.__booth = { SONGS: SONGS, SHELF: SHELF, cue: cue, draw: drawTimeline };
})();

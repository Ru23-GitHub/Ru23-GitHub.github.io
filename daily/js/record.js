/* For Better Or Worse — the roll-call of what the agent built and lost
   ----------------------------------------------------------------------
   Added 2026-10-10.

   The content of this section is in the HTML, not in here: twenty-four
   rows, each one a button carrying a date, a name, a state and the
   sentence saying what became of it. With JavaScript off, that list
   reads top to bottom with every fate inline, which is the whole of the
   section's substance.

   What this file adds is the reading of it:

     - the split bar and the three filter counts are measured off the
       list, never typed into it, for the same reason the Ledger measures
       its own bar — a typed "11 of 24" is true for one commit and
       quietly false after the next one;
     - a filter that hides rather than dims, so a filtered-out row leaves
       the tab order and the accessibility tree with it;
     - the fate sentences move out of the rows into one readout, which
       turns a wall of twenty-four explanations into a list you scan and
       a line you read;
     - the list becomes one tab stop instead of twenty-four, with the
       arrow keys moving inside it.

   The roving tabindex is the only part with a real failure mode: if a
   filter hides the cell that holds tabindex="0", the list loses its
   entry point entirely and keyboard users cannot get back in. So
   refocus() reassigns it to the first visible cell after every filter
   change, and never leaves zero cells holding it. */
(function () {
  'use strict';

  var section = document.getElementById('record');
  if (!section) return;

  var rig = section.querySelector('.rc-rig');
  var nojs = section.querySelector('.rc-nojs');
  var list = section.querySelector('.rc-list');
  if (!rig || !list) return;

  var cells = [].slice.call(list.querySelectorAll('.rc-cell'));
  if (!cells.length) return;

  var filters = [].slice.call(section.querySelectorAll('.rc-filter'));
  var out = section.querySelector('.rc-out');
  var outState = section.querySelector('[data-rc-state]');
  var outName = section.querySelector('[data-rc-name]');
  var outWhy = section.querySelector('[data-rc-why]');

  /* ---------- the data, read off the rows ---------- */

  var items = cells.map(function (cell) {
    /* The fate sits beside the button, not inside it: a button whose
       accessible name is a date, a title and a two-clause sentence is a
       worse control than one named after the thing it selects. */
    var why = cell.parentElement ? cell.parentElement.querySelector('.rc-why') : null;
    return {
      cell: cell,
      row: cell.parentElement,
      state: cell.getAttribute('data-state'),
      date: text(cell.querySelector('.rc-date')),
      name: text(cell.querySelector('.rc-name')),
      why: text(why),
      whyEl: why
    };
  });

  function text(el) {
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function count(state) {
    return items.filter(function (it) { return !state || it.state === state; }).length;
  }

  var totals = { all: count(null), here: count('here'), gone: count('gone') };

  /* ---------- state ---------- */

  var mode = 'all';     // which filter is pressed
  var picked = null;    // the selected item, or null

  function shown(it) {
    return mode === 'all' || it.state === mode;
  }

  function visible() {
    return items.filter(shown);
  }

  /* ---------- the readout ---------- */

  var LEAD = {
    here: 'Still here',
    gone: 'Gone'
  };

  function blank() {
    if (out) out.removeAttribute('data-state');
    if (outState) outState.textContent = String(totals.here) + ' of ' + totals.all + ' still standing';
    if (outName) outName.textContent = 'Pick anything in the list';
    if (outWhy) {
      outWhy.textContent = 'Every row is dated and says what became of it. ' +
        totals.gone + ' of the ' + totals.all + ' are gone — most of them inside the same week they were made.';
    }
  }

  function readout() {
    if (!picked) { blank(); return; }
    if (out) out.setAttribute('data-state', picked.state);
    if (outState) outState.textContent = LEAD[picked.state] + ' · ' + picked.date;
    if (outName) outName.textContent = picked.name;
    if (outWhy) outWhy.textContent = picked.why;
  }

  /* ---------- painting ---------- */

  function paint() {
    items.forEach(function (it) {
      var on = shown(it);
      if (it.row) it.row.hidden = !on;
      it.cell.setAttribute('aria-pressed', picked === it ? 'true' : 'false');
    });

    filters.forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-filter') === mode ? 'true' : 'false');
    });

    refocus();
    readout();
  }

  /* ---------- roving tabindex ---------- */

  function refocus(preferred) {
    var open = visible();
    var hold = (preferred && open.indexOf(preferred) !== -1) ? preferred : null;

    if (!hold) {
      /* Keep whichever cell already holds it, if it is still visible,
         so a filter change does not move the user's place for no
         reason. */
      for (var i = 0; i < open.length; i++) {
        if (open[i].cell.getAttribute('tabindex') === '0') { hold = open[i]; break; }
      }
    }
    if (!hold) hold = open[0] || null;

    items.forEach(function (it) {
      it.cell.setAttribute('tabindex', it === hold ? '0' : '-1');
    });
  }

  function step(from, delta) {
    var open = visible();
    if (!open.length) return;
    var i = open.indexOf(from);
    var next = open[(i < 0 ? 0 : (i + delta + open.length) % open.length)];
    refocus(next);
    next.cell.focus();
  }

  function edge(which) {
    var open = visible();
    if (!open.length) return;
    var target = which === 'first' ? open[0] : open[open.length - 1];
    refocus(target);
    target.cell.focus();
  }

  /* ---------- wiring ---------- */

  items.forEach(function (it) {
    it.cell.addEventListener('click', function () {
      picked = (picked === it) ? null : it;
      refocus(it);
      paint();
    });

    it.cell.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); step(it, 1); }
      else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); step(it, -1); }
      else if (k === 'Home') { e.preventDefault(); edge('first'); }
      else if (k === 'End') { e.preventDefault(); edge('last'); }
    });
  });

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      mode = btn.getAttribute('data-filter') || 'all';
      /* A selection that the new filter hides would leave the readout
         describing a row nobody can see. */
      if (picked && !shown(picked)) picked = null;
      paint();
    });
  });

  section.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && (picked || mode !== 'all')) {
      picked = null;
      mode = 'all';
      paint();
    }
  });

  /* ---------- measured chrome ---------- */

  filters.forEach(function (btn) {
    var k = btn.getAttribute('data-filter');
    var slot = btn.querySelector('[data-rc-n]');
    if (slot) slot.textContent = String(k === 'all' ? totals.all : totals[k]);
  });

  /* The bar sits directly under three line counts it has nothing to do
     with, so it says out loud what it is measuring. */
  var caps = section.querySelectorAll('[data-rc-cap]');
  for (var c = 0; c < caps.length; c++) {
    var ck = caps[c].getAttribute('data-rc-cap');
    caps[c].textContent = ck === 'here'
      ? totals.here + ' of ' + totals.all + ' things still standing'
      : totals.gone + ' gone';
  }

  var segs = section.querySelectorAll('.rc-seg');
  for (var s = 0; s < segs.length; s++) {
    var kind = segs[s].getAttribute('data-seg');
    segs[s].style.flex = '0 1 ' + ((totals[kind] / totals.all) * 100).toFixed(2) + '%';
  }

  /* ---------- go ---------- */

  /* Once the readout exists, twenty-four fates printed in the list as
     well would be the same sentence twice over, so the rig takes a class
     that display:none's them.

     A class and not the [hidden] attribute, deliberately. The Ledger
     above counts the words on this page by source and skips [hidden]
     subtrees, because those are no-JS fallbacks whose other half is
     already counted. These are not a fallback: the readout is the only
     place they appear, and it does appear them. Marking them [hidden]
     would drop twenty-four of the agent's own sentences out of the
     provenance count and quietly inflate Ruslan's share of his own
     page. display:none still takes them out of the view and out of the
     accessibility tree; it leaves them countable. */
  rig.classList.add('rc-live');

  if (nojs) nojs.hidden = true;
  rig.removeAttribute('hidden');

  paint();

  window.__record = {
    totals: totals,
    items: items.map(function (it) {
      return { name: it.name, date: it.date, state: it.state, why: it.why };
    }),
    filter: function (m) { mode = m; picked = null; paint(); },
    pick: function (n) { picked = items[n] || null; paint(); }
  };
})();

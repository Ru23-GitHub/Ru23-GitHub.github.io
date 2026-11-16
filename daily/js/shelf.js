/* The Shelf — power toggles, and which machine runs which cartridge.
   ----------------------------------------------------------------------
   Added 2026-10-05, rebuilt 2026-10-06 when the case was re-stocked with
   the machines Ruslan actually owns. The Nokia 3310 left the shelf and its
   Snake loop — the only repeating timer in this file — left with it, which
   is why there is no IntersectionObserver here any more: nothing runs off
   screen that needs stopping.

   Scoped entirely to #shelf. The devices and the cartridges are real
   <button>s, so click, Enter and Space all work for free; this file only
   maintains aria-pressed, keeps the screen-reader labels in sync, and
   writes the compatibility state onto each list item. Every visual change
   hangs off an attribute, so with JS unavailable the case is still a
   legible set of drawings with captions. */
(function () {
  'use strict';

  var shelf = document.getElementById('shelf');
  if (!shelf) return;

  /* ---------- power toggles ---------- */

  var devices = shelf.querySelectorAll('.device');

  function setLabel(btn, on) {
    var label = btn.querySelector('.device-label');
    if (!label) return;
    var name = label.textContent.replace(/^Switch (on|off) the /, '');
    label.textContent = 'Switch ' + (on ? 'off' : 'on') + ' the ' + name;
  }

  for (var i = 0; i < devices.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        setLabel(btn, on);
      });
    })(devices[i]);
  }

  /* ---------- the cartridge rig ----------
     Each .shelf-item carries data-carts: the cartridge formats that machine
     accepts. Selecting a cartridge marks every item yes or no and prints a
     sentence about it. The facts, for the record:

       Game Boy          GB
       Game Boy Color    GB, GBC
       Game Boy Advance  GB, GBC, GBA
       GBA SP            GB, GBC, GBA
       Nintendo DS       GBA, DS      <- the chain breaks here: the DS kept a
                                         Game Boy Advance slot but none of the
                                         older Game Boy hardware
       Walkman           (none)

     Which makes the lineage not quite the tidy nesting it looks like. */

  var carts  = shelf.querySelectorAll('.cart');
  var items  = shelf.querySelectorAll('.shelf-item');
  var status = shelf.querySelector('[data-compat-status]');
  var idle   = status ? status.textContent : '';
  var active = null;

  var COPY = {
    gb:  'A 1989 Game Boy cartridge runs in four of the five handhelds here. The DS is the one that stops it: it kept a Game Boy Advance slot, but none of the older Game Boy hardware underneath.',
    gbc: 'The black Game Boy Color-only cartridges run on everything from 1998 onward. The original Game Boy predates the hardware they need — and the clear dual-mode carts existed precisely so you did not have to choose.',
    gba: 'A Game Boy Advance cartridge runs on three, and it is the only cartridge in this row the DS will take. Slot 2 on the original DS and the DS Lite was a Game Boy Advance slot; the DSi dropped it.',
    ds:  'DS cards go one way only. Nothing older on the shelf has a slot that fits one.'
  };

  var NO_SLOT = {
    walkman: 'No slot — it got there first, ten years early'
  };

  function clear() {
    for (var i = 0; i < items.length; i++) {
      items[i].removeAttribute('data-compat');
      var tag = items[i].querySelector('[data-compat-tag]');
      if (tag) tag.textContent = '';
    }
    if (status) status.textContent = idle;
  }

  function apply(cart) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var accepts = (item.getAttribute('data-carts') || '').split(/\s+/);
      var ok = accepts.indexOf(cart) !== -1;
      item.setAttribute('data-compat', ok ? 'yes' : 'no');

      var tag = item.querySelector('[data-compat-tag]');
      if (!tag) continue;
      var btn = item.querySelector('.device');
      var key = btn ? btn.getAttribute('data-device') : '';
      tag.textContent = ok ? 'Runs it' : (NO_SLOT[key] || 'No slot for it');
    }
    if (status) status.textContent = COPY[cart] || '';
  }

  for (var j = 0; j < carts.length; j++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var cart = btn.getAttribute('data-cart');
        var on = active !== cart;

        for (var k = 0; k < carts.length; k++) {
          carts[k].setAttribute('aria-pressed', 'false');
        }

        if (on) {
          btn.setAttribute('aria-pressed', 'true');
          active = cart;
          apply(cart);
        } else {
          active = null;
          clear();
        }
      });
    })(carts[j]);
  }

  /* ---------- the bag: what you have to carry to keep them running ----------
     Added 2026-11-16. A second axis over the same six machines: the case
     above answers which of them plays which cartridge, this answers what
     feeds them.

     The six .bag-row elements in the markup are the only copy of that data.
     This block reads the cell count and the plug off each row, builds the
     bench's six toggles out of them, and sums the figures on every click —
     nothing here is typed in, including the ten and the one in the heading,
     which is why the bench checks them before it will show itself. With this
     file absent the rows are still a legible table and the paragraph above
     the bench states the total in words. */

  var bag = shelf.querySelector('.bag');

  if (bag) (function () {
    var rows = bag.querySelectorAll('.bag-row');
    var pick = bag.querySelector('[data-bag-pick]');
    var rig  = bag.querySelector('[data-bag-rig]');
    var nojs = bag.querySelector('.bag-nojs');
    var out  = {
      n:    bag.querySelector('[data-bag-n]'),
      aa:   bag.querySelector('[data-bag-aa]'),
      plug: bag.querySelector('[data-bag-plug]'),
      aaU:  bag.querySelector('[data-bag-aa-unit]'),
      plugU:bag.querySelector('[data-bag-plug-unit]'),
      say:  bag.querySelector('[data-bag-say]')
    };
    if (!rows.length || !pick || !rig || !out.say) return;

    var MACHINES = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var yr  = row.querySelector('.bag-yr');
      MACHINES.push({
        row:  row,
        year: yr ? yr.textContent.replace(/\s+/g, '') : '',
        name: row.getAttribute('data-short') || '',
        aa:   parseInt(row.getAttribute('data-aa'), 10) || 0,
        plug: (row.getAttribute('data-plug') || '').replace(/\s+/g, ''),
        on:   false
      });
    }

    /* The heading says ten cells and one charger. Count it off the rows
       rather than believe it: if an edit ever makes that false, the bench
       does not appear and the prose above it is what a reader gets. */
    function tally(list) {
      var aa = 0, plugs = {}, sealed = 0;
      for (var k = 0; k < list.length; k++) {
        aa += list[k].aa;
        if (list[k].plug) { plugs[list[k].plug] = true; sealed++; }
      }
      return { aa: aa, plugs: Object.keys(plugs).length, sealed: sealed, n: list.length };
    }

    var whole = tally(MACHINES);
    if (MACHINES.length !== 6 || whole.aa !== 10 || whole.plugs !== 1 || whole.sealed !== 2) return;

    function selected() {
      return MACHINES.filter(function (m) { return m.on; });
    }

    var NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    function word(n) { return NUM[n] !== undefined ? NUM[n] : String(n); }

    /* Nothing below reads a machine's name to decide what to say — only the
       numbers, so the sentences survive a row being renamed. */
    function sentence(sel) {
      var t = sel.length ? tally(sel) : null;
      if (!t) {
        return 'Nothing in it yet. Six machines on the bench, and twenty-five years between the two ends of it.';
      }
      if (t.n === 6) {
        return 'The whole case, in one bag: ten AA cells and a single charger. Everything he named is carryable — only the last two of it need a wall.';
      }
      if (t.plugs === 0) {
        if (t.aa === whole.aa) {
          return 'Ten AA cells and nothing to plug in. Four machines, twenty-two years between them, and not one needs a socket — the whole near side of 2003.';
        }
        var lead = word(t.n);
        lead = lead.charAt(0).toUpperCase() + lead.slice(1);
        return lead + ' machine' + (t.n === 1 ? '' : 's') + ', ' + word(t.aa) + ' AA cells, nothing to plug in. Everything in the bag runs on something a stranger could hand you.';
      }
      if (t.aa === 0) {
        if (t.sealed === 2) {
          return 'No cells to buy, and one charger for the pair of them — the original DS shipped with the SP’s adapter, so the two newest machines here need one plug between them.';
        }
        return 'No cells to buy. One charger, and nothing works without it.';
      }
      return word(t.aa).charAt(0).toUpperCase() + word(t.aa).slice(1) + ' AA cells and one charger: the bag has crossed 2003. ' +
             (t.sealed === 2
               ? 'Both sealed machines take the same plug, so it is still only one.'
               : 'Everything else in it you could feed at a corner shop.');
    }

    function render() {
      var sel = selected(), t = tally(sel);
      if (out.n)     out.n.textContent    = String(t.n);
      if (out.aa)    out.aa.textContent   = String(t.aa);
      if (out.plug)  out.plug.textContent = String(t.plugs);
      if (out.aaU)   out.aaU.textContent   = t.aa === 1 ? 'cell' : 'cells';
      if (out.plugU) out.plugU.textContent = t.plugs === 1 ? 'charger' : 'chargers';
      out.say.textContent = sentence(sel);
    }

    MACHINES.forEach(function (m) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'panel-btn bag-add';
      btn.setAttribute('aria-pressed', 'false');

      var dot = document.createElement('span');
      dot.className = 'panel-dot';
      dot.setAttribute('aria-hidden', 'true');

      var yr = document.createElement('span');
      yr.className = 'bag-add-yr';
      yr.textContent = m.year;

      var nm = document.createElement('span');
      nm.className = 'bag-add-name';
      nm.textContent = m.name;

      btn.appendChild(dot);
      btn.appendChild(yr);
      btn.appendChild(nm);

      btn.addEventListener('click', function () {
        m.on = !m.on;
        btn.setAttribute('aria-pressed', m.on ? 'true' : 'false');
        render();
      });

      m.btn = btn;
      pick.appendChild(btn);
    });

    if (nojs) nojs.hidden = true;
    rig.removeAttribute('hidden');
    render();

    window.__shelf = window.__shelf || {};
    window.__shelf.bag = {
      machines: MACHINES,
      tally: tally,
      audit: function () {
        var all = tally(MACHINES);
        /* eslint-disable no-console */
        console.log('six machines:', all.n === 6);
        console.log('AA cells across the shelf:', all.aa, '(heading says 10)');
        console.log('distinct chargers:', all.plugs, '(heading says 1)');
        console.log('sealed machines:', all.sealed);
        MACHINES.forEach(function (m) {
          console.log(m.year, m.name, '— AA:', m.aa, 'plug:', m.plug || '(none)');
        });
        return all;
      }
    };
  })();

})();

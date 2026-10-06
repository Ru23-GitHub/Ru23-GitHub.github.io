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
})();

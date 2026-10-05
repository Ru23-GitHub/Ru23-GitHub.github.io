/* The Shelf — power toggles + the Nokia's Snake.
   ----------------------------------------------------------------------
   Added 2026-10-05. Scoped entirely to #shelf; touches nothing else on
   the page. The devices are real <button>s, so click, Enter and Space
   all work for free — this file only maintains aria-pressed, keeps the
   screen-reader label in sync, and drives the one animation that can't
   be expressed in CSS. */
(function () {
  'use strict';

  var shelf = document.getElementById('shelf');
  if (!shelf) return;

  var mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mql.matches;

  /* ---------- Snake, on the Nokia's 32x22 LCD ----------
     A 7x4 cell grid walked around its own perimeter: enough to read as
     Snake at 30 pixels wide without pretending to be a real game. */

  var CELL = 4, OX = 21, OY = 24;
  var LOOP = [];
  (function buildLoop() {
    var c, r;
    for (c = 0; c < 7; c++) LOOP.push([c, 0]);       // top, left to right
    for (r = 1; r < 4; r++) LOOP.push([6, r]);       // right edge, down
    for (c = 5; c >= 0; c--) LOOP.push([c, 3]);      // bottom, right to left
    for (r = 2; r >= 1; r--) LOOP.push([0, r]);      // left edge, up
  })();

  function Snake(svg) {
    this.segs = svg.querySelectorAll('.nk-snake rect');
    this.food = svg.querySelector('.nk-food');
    this.head = 0;
    this.foodAt = 9;
    this.timer = null;
  }

  Snake.prototype.place = function (el, cell) {
    el.setAttribute('x', OX + cell[0] * CELL);
    el.setAttribute('y', OY + cell[1] * CELL);
  };

  Snake.prototype.render = function () {
    for (var i = 0; i < this.segs.length; i++) {
      // segment 0 is the head; the rest trail behind it around the loop
      var idx = (this.head - i + LOOP.length * 2) % LOOP.length;
      this.place(this.segs[i], LOOP[idx]);
    }
    if (this.food) this.place(this.food, LOOP[this.foodAt]);
  };

  Snake.prototype.tick = function () {
    this.head = (this.head + 1) % LOOP.length;
    if (this.head === this.foodAt) {
      // drop the next pellet somewhere clear of the snake's body
      this.foodAt = (this.foodAt + 6 + Math.floor(Math.random() * 6)) % LOOP.length;
    }
    this.render();
  };

  Snake.prototype.start = function () {
    this.render();
    if (reduce || this.timer !== null) return;
    var self = this;
    this.timer = setInterval(function () { self.tick(); }, 210);
  };

  Snake.prototype.stop = function () {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
  };

  /* ---------- power toggles ---------- */

  var buttons = shelf.querySelectorAll('.device');
  var snakes = {};

  function setLabel(btn, on) {
    var label = btn.querySelector('.device-label');
    if (!label) return;
    var name = label.textContent.replace(/^(Switch on|Switch off|Open|Close) (the )?/, '');
    var verb = btn.dataset.device === 'floppy'
      ? (on ? 'Close' : 'Open')
      : (on ? 'Switch off' : 'Switch on');
    label.textContent = verb + ' the ' + name;
  }

  for (var i = 0; i < buttons.length; i++) {
    (function (btn) {
      if (btn.dataset.device === 'nokia') {
        snakes.nokia = new Snake(btn);
        snakes.nokia.render();
      }
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        setLabel(btn, on);
        if (btn.dataset.device === 'nokia' && snakes.nokia) {
          if (on) snakes.nokia.start(); else snakes.nokia.stop();
        }
      });
    })(buttons[i]);
  }

  /* Stop the one repeating timer when the section scrolls out of sight,
     and when someone switches reduced motion on mid-visit. */

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (!snakes.nokia) return;
      var btn = shelf.querySelector('.device[data-device="nokia"]');
      if (entries[0].isIntersecting) {
        if (btn && btn.getAttribute('aria-pressed') === 'true') snakes.nokia.start();
      } else {
        snakes.nokia.stop();
      }
    }, { threshold: 0 }).observe(shelf);
  }

  if (mql.addEventListener) {
    mql.addEventListener('change', function (e) {
      reduce = e.matches;
      if (!snakes.nokia) return;
      if (reduce) snakes.nokia.stop();
    });
  }
})();

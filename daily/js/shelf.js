/* The Shelf — power toggles, and a Snake that is actually Snake
   ======================================================================
   Rewritten 2026-10-05. The previous version is worth describing because
   this one exists to fix it: the Nokia's "Snake" was four rectangles
   walking a hard-coded loop around the screen's perimeter, forever. It
   could not be steered, could not grow, could not die, and the pellet was
   placed at a fixed index on the same loop. It looked like Snake from
   across the room and was a prop.

   This is a real game on the 3310's actual 15x10 playfield: a direction
   queue, growth on eating, wall and self collision, a score, and food
   placed only on cells the snake is not occupying.

   Steering is arrow keys or WASD while the handset has focus, or a swipe
   on a touchscreen. The device is still a <button>, so it still toggles
   with Enter, and arrow keys are only swallowed while it is switched on —
   the page stays scrollable otherwise.
*/
(function () {
  'use strict';

  var shelf = document.getElementById('shelf');
  if (!shelf) return;

  var mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mql.matches;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------- the 3310's playfield ----------
     The screen rect is x19 y21, 32x22 units. Inset by one and divide by
     two: fifteen columns, ten rows, which is close to the real handset's
     proportions. */

  var CELL = 2, X0 = 20.5, Y0 = 22, COLS = 15, ROWS = 10;
  var SPEED = 190;   /* ms per step */

  function Snake(btn) {
    this.btn = btn;
    this.group = btn.querySelector('.nk-snake');
    this.food = btn.querySelector('.nk-food');
    this.scoreEl = shelf.querySelector('[data-snake-score]');
    this.timer = null;
    this.rects = [];
    this.reset();
  }

  Snake.prototype.reset = function () {
    this.body = [[7, 5], [6, 5], [5, 5]];   /* head first */
    this.dir = [1, 0];
    this.queue = [];
    this.score = 0;
    this.dead = false;
    this.placeFood();
    this.render();
    this.paintScore();
  };

  Snake.prototype.paintScore = function () {
    if (!this.scoreEl) return;
    this.scoreEl.textContent = this.dead
      ? 'game over · ' + this.score
      : String(this.score);
  };

  Snake.prototype.occupied = function (c, r) {
    for (var i = 0; i < this.body.length; i++) {
      if (this.body[i][0] === c && this.body[i][1] === r) return true;
    }
    return false;
  };

  /* Rejection-sample a free cell. The playfield is 150 cells and the
     snake would have to fill almost all of it before this got slow, and
     at that point you have won. */
  Snake.prototype.placeFood = function () {
    var c, r, guard = 0;
    do {
      c = Math.floor(Math.random() * COLS);
      r = Math.floor(Math.random() * ROWS);
    } while (this.occupied(c, r) && ++guard < 400);
    this.foodAt = [c, r];
  };

  Snake.prototype.render = function () {
    /* Grow the pool of <rect>s to match the body, reusing what's there. */
    while (this.rects.length < this.body.length) {
      var el = document.createElementNS(SVG_NS, 'rect');
      el.setAttribute('width', CELL - 0.4);
      el.setAttribute('height', CELL - 0.4);
      this.group.appendChild(el);
      this.rects.push(el);
    }
    while (this.rects.length > this.body.length) {
      this.group.removeChild(this.rects.pop());
    }
    for (var i = 0; i < this.body.length; i++) {
      this.rects[i].setAttribute('x', X0 + this.body[i][0] * CELL);
      this.rects[i].setAttribute('y', Y0 + this.body[i][1] * CELL);
    }
    if (this.food) {
      this.food.setAttribute('x', X0 + this.foodAt[0] * CELL);
      this.food.setAttribute('y', Y0 + this.foodAt[1] * CELL);
      this.food.setAttribute('width', CELL - 0.4);
      this.food.setAttribute('height', CELL - 0.4);
    }
  };

  /* Queued rather than applied immediately: pressing up-then-left faster
     than one step would otherwise lose the first press. */
  Snake.prototype.steer = function (dx, dy) {
    var last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (last[0] === -dx && last[1] === -dy) return;   /* no reversing onto yourself */
    if (last[0] === dx && last[1] === dy) return;
    if (this.queue.length < 2) this.queue.push([dx, dy]);
  };

  Snake.prototype.tick = function () {
    if (this.dead) return;
    if (this.queue.length) this.dir = this.queue.shift();

    var head = [this.body[0][0] + this.dir[0], this.body[0][1] + this.dir[1]];

    if (head[0] < 0 || head[0] >= COLS || head[1] < 0 || head[1] >= ROWS) return this.die();
    /* The tail cell is about to be vacated, so moving into it is legal. */
    for (var i = 0; i < this.body.length - 1; i++) {
      if (this.body[i][0] === head[0] && this.body[i][1] === head[1]) return this.die();
    }

    this.body.unshift(head);
    if (head[0] === this.foodAt[0] && head[1] === this.foodAt[1]) {
      this.score++;
      this.paintScore();
      this.placeFood();
    } else {
      this.body.pop();
    }
    this.render();
  };

  Snake.prototype.die = function () {
    this.dead = true;
    this.stop();
    this.paintScore();
    this.btn.classList.add('is-dead');
  };

  Snake.prototype.start = function () {
    this.btn.classList.remove('is-dead');
    if (this.dead) this.reset();
    this.render();
    if (reduce || this.timer !== null) return;
    var self = this;
    this.timer = setInterval(function () { self.tick(); }, SPEED);
  };

  Snake.prototype.stop = function () {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
  };

  /* ---------- power toggles ---------- */

  var buttons = shelf.querySelectorAll('.device');
  var snake = null;
  var nokiaBtn = shelf.querySelector('.device[data-device="nokia"]');

  function setLabel(btn, on) {
    var label = btn.querySelector('.device-label');
    if (!label) return;
    var name = label.textContent.replace(/^(Switch on|Switch off|Open|Close) (the )?/, '');
    var verb = btn.dataset.device === 'floppy'
      ? (on ? 'Close' : 'Open')
      : (on ? 'Switch off' : 'Switch on');
    label.textContent = verb + ' the ' + name;
  }

  Array.prototype.forEach.call(buttons, function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      setLabel(btn, on);
      if (btn === nokiaBtn && snake) {
        if (on) snake.start(); else snake.stop();
      }
    });
  });

  if (nokiaBtn) {
    snake = new Snake(nokiaBtn);

    var KEYS = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
      W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0]
    };

    nokiaBtn.addEventListener('keydown', function (e) {
      var v = KEYS[e.key];
      if (!v) return;
      /* Only while it is switched on, so arrow keys keep scrolling the
         page when the handset is just sitting there. */
      if (nokiaBtn.getAttribute('aria-pressed') !== 'true') return;
      e.preventDefault();
      snake.steer(v[0], v[1]);
      if (snake.dead) snake.start();
    });

    /* Swipe, for the shelf on a phone. */
    var sx = 0, sy = 0, swiping = false;
    nokiaBtn.addEventListener('touchstart', function (e) {
      if (!e.touches.length) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true;
    }, { passive: true });
    nokiaBtn.addEventListener('touchend', function (e) {
      if (!swiping || !e.changedTouches.length) return;
      swiping = false;
      if (nokiaBtn.getAttribute('aria-pressed') !== 'true') return;
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) snake.steer(dx > 0 ? 1 : -1, 0);
      else snake.steer(0, dy > 0 ? 1 : -1);
    }, { passive: true });
  }

  /* Lifecycle is Daily.whenVisible's job now (js/lifecycle.js); this file
     used to carry its own observer. */
  if (window.Daily && window.Daily.whenVisible) {
    window.Daily.whenVisible(shelf, {
      start: function () {
        if (snake && nokiaBtn && nokiaBtn.getAttribute('aria-pressed') === 'true') snake.start();
      },
      stop: function () { if (snake) snake.stop(); }
    });
  }

  if (mql.addEventListener) {
    mql.addEventListener('change', function (e) {
      reduce = e.matches;
      if (reduce && snake) snake.stop();
    });
  }
})();

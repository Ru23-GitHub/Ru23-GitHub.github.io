/* Spacewar! — Steve Russell, MIT, 1962
   ======================================================================
   Added 2026-10-05. The first video game that spread: written for a PDP-1
   with 9 kilobytes of core, drawn on a Type 30 point-plotting CRT, and
   copied by hand onto paper tape to every PDP-1 in the country. DEC
   eventually shipped it as the machine's power-on diagnostic.

   Faithful where it matters:
     - a star at the centre with real inverse-square gravity, which is the
       whole game; good players fly orbits rather than straight lines
     - the screen wraps
     - hyperspace: escape anywhere, at the risk of not arriving
     - torpedoes ignore gravity, which was true of the original and was
       never fixed, because it played better that way

   Keyboard only takes over while the field has focus, so arrow keys still
   scroll the page everywhere else and Tab always leaves.
*/
(function () {
  'use strict';

  var root = document.getElementById('spacewar');
  if (!root) return;
  var canvas = root.querySelector('[data-sw="canvas"]');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var W = 640, H = 400;
  canvas.width = W; canvas.height = H;

  var CX = W / 2, CY = H / 2;
  var GM = 5200;          /* gravitational parameter of the star */
  var STAR_R = 11;
  var TAU = Math.PI * 2;

  var scoreYou = root.querySelector('[data-sw="score-you"]');
  var scoreFoe = root.querySelector('[data-sw="score-foe"]');
  var statusEl = root.querySelector('[data-sw="status"]');
  var startBtn = root.querySelector('[data-sw="start"]');

  /* ---------- state ---------- */

  function Ship(x, y, a, colour, isPlayer) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.a = a; this.colour = colour; this.isPlayer = isPlayer;
    this.alive = true; this.dead = 0; this.score = 0;
    this.cool = 0; this.hyperCool = 0; this.thrusting = false;
  }

  var you, foe, shots, stars, running = false, frame = null, over = false;

  function reset(full) {
    you = new Ship(W * 0.22, H * 0.5, -Math.PI / 2, '#7dff8a', true);
    foe = new Ship(W * 0.78, H * 0.5, Math.PI / 2, '#ff9b6b', false);
    /* The classic opening: both ships in a circular orbit, opposite sides. */
    var v = Math.sqrt(GM / (W * 0.28));
    you.vy = -v; foe.vy = v;
    shots = [];
    if (full) {
      you.score = 0; foe.score = 0;
      over = false;
      stars = [];
      for (var i = 0; i < 90; i++) {
        stars.push({ x: Math.random() * W, y: Math.random() * H, b: 0.25 + Math.random() * 0.6 });
      }
    }
    paintScores();
  }

  function paintScores() {
    if (scoreYou) scoreYou.textContent = String(you.score);
    if (scoreFoe) scoreFoe.textContent = String(foe.score);
  }

  function say(t) { if (statusEl) statusEl.textContent = t; }

  /* ---------- input ---------- */

  var keys = Object.create(null);
  var focused = false;

  var CAPTURE = {
    ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, ' ': 1,
    a: 1, d: 1, w: 1, s: 1, A: 1, D: 1, W: 1, S: 1
  };

  canvas.addEventListener('focus', function () { focused = true; say('Arrows or A/D/W to fly · Space to fire · S for hyperspace.'); });
  canvas.addEventListener('blur', function () { focused = false; keys = Object.create(null); });

  canvas.addEventListener('keydown', function (e) {
    /* Only swallow the keys the game uses, and only while focused, so the
       page never becomes un-scrollable and Tab always gets you out. */
    if (CAPTURE[e.key]) { keys[e.key] = true; e.preventDefault(); }
    if (e.key === 'Enter' && over) { reset(true); say('New game.'); }
  });
  canvas.addEventListener('keyup', function (e) {
    if (CAPTURE[e.key]) { keys[e.key] = false; e.preventDefault(); }
  });
  canvas.addEventListener('pointerdown', function () { canvas.focus(); });

  function held() {
    return {
      left:  keys.ArrowLeft  || keys.a || keys.A,
      right: keys.ArrowRight || keys.d || keys.D,
      thrust: keys.ArrowUp   || keys.w || keys.W,
      hyper: keys.s || keys.S,
      fire: keys[' ']
    };
  }

  /* ---------- physics ---------- */

  function gravity(o, dt) {
    var dx = CX - o.x, dy = CY - o.y;
    var r2 = dx * dx + dy * dy;
    var r = Math.sqrt(r2);
    if (r < 1) return;
    var a = GM / Math.max(r2, 220);     /* softened so near-misses don't explode the integrator */
    o.vx += (dx / r) * a * dt;
    o.vy += (dy / r) * a * dt;
  }

  function integrate(o, dt) {
    o.x += o.vx * dt; o.y += o.vy * dt;
    if (o.x < 0) o.x += W; else if (o.x >= W) o.x -= W;
    if (o.y < 0) o.y += H; else if (o.y >= H) o.y -= H;
  }

  function fire(s) {
    if (s.cool > 0 || !s.alive) return;
    s.cool = 0.32;
    shots.push({
      x: s.x + Math.cos(s.a) * 11,
      y: s.y + Math.sin(s.a) * 11,
      vx: s.vx + Math.cos(s.a) * 230,
      vy: s.vy + Math.sin(s.a) * 230,
      life: 1.9,
      from: s
    });
  }

  function hyperspace(s) {
    if (s.hyperCool > 0 || !s.alive) return;
    s.hyperCool = 2.2;
    s.x = 40 + Math.random() * (W - 80);
    s.y = 40 + Math.random() * (H - 80);
    s.vx *= 0.3; s.vy *= 0.3;
    /* The original gave you a rising chance of simply not coming back. */
    if (Math.random() < 0.18) { kill(s, null, 'lost in hyperspace'); }
  }

  function kill(s, by, why) {
    if (!s.alive) return;
    s.alive = false; s.dead = 1.4;
    if (by && by !== s) by.score++;
    paintScores();
    if (s.isPlayer) say(why ? 'You were ' + why + '.' : 'You were hit.');
    else say(why ? 'They were ' + why + '.' : 'Hit.');
    if (you.score >= 7 || foe.score >= 7) {
      over = true;
      say((you.score > foe.score ? 'You win, 7–' + foe.score : 'They win, 7–' + you.score) + '. Press Enter for a new game.');
    }
  }

  /* ---------- the opponent ---------- */

  function think(dt) {
    if (!foe.alive) return;
    var dx = you.x - foe.x, dy = you.y - foe.y;
    /* shortest way round a wrapping field */
    if (Math.abs(dx) > W / 2) dx -= Math.sign(dx) * W;
    if (Math.abs(dy) > H / 2) dy -= Math.sign(dy) * H;

    var sx = CX - foe.x, sy = CY - foe.y;
    var starDist = Math.hypot(sx, sy);

    /* Falling into the star beats any shot, so that comes first. */
    var want;
    if (starDist < 110) want = Math.atan2(-sy, -sx);
    else want = Math.atan2(dy, dx);

    var diff = ((want - foe.a + Math.PI * 3) % TAU) - Math.PI;
    if (diff > 0.05) foe.a += Math.min(2.8 * dt, diff);
    else if (diff < -0.05) foe.a += Math.max(-2.8 * dt, diff);

    foe.thrusting = starDist < 130 || Math.hypot(dx, dy) > 190;
    if (foe.thrusting) {
      foe.vx += Math.cos(foe.a) * 125 * dt;
      foe.vy += Math.sin(foe.a) * 125 * dt;
    }
    if (Math.abs(diff) < 0.18 && Math.hypot(dx, dy) < 320 && starDist > 70) fire(foe);
  }

  /* ---------- step ---------- */

  function step(dt) {
    var k = held();

    if (you.alive) {
      if (k.left) you.a -= 3.1 * dt;
      if (k.right) you.a += 3.1 * dt;
      you.thrusting = !!k.thrust;
      if (k.thrust) {
        you.vx += Math.cos(you.a) * 140 * dt;
        you.vy += Math.sin(you.a) * 140 * dt;
      }
      if (k.fire) fire(you);
      if (k.hyper) hyperspace(you);
    }

    think(dt);

    [you, foe].forEach(function (s) {
      s.cool = Math.max(0, s.cool - dt);
      s.hyperCool = Math.max(0, s.hyperCool - dt);
      if (!s.alive) {
        s.dead -= dt;
        if (s.dead <= 0 && !over) {
          var ang = Math.random() * TAU, rad = 150;
          s.x = CX + Math.cos(ang) * rad; s.y = CY + Math.sin(ang) * rad;
          var v = Math.sqrt(GM / rad);
          s.vx = -Math.sin(ang) * v; s.vy = Math.cos(ang) * v;
          s.alive = true;
        }
        return;
      }
      gravity(s, dt);
      integrate(s, dt);
      if (Math.hypot(s.x - CX, s.y - CY) < STAR_R + 5) kill(s, null, 'pulled into the star');
    });

    for (var i = shots.length - 1; i >= 0; i--) {
      var t = shots[i];
      t.life -= dt;
      /* No gravity here: the original's torpedoes ignored the star too. */
      integrate(t, dt);
      if (t.life <= 0) { shots.splice(i, 1); continue; }
      if (Math.hypot(t.x - CX, t.y - CY) < STAR_R) { shots.splice(i, 1); continue; }
      var target = t.from === you ? foe : you;
      if (target.alive && Math.hypot(t.x - target.x, t.y - target.y) < 9) {
        kill(target, t.from, null);
        shots.splice(i, 1);
      }
    }
  }

  /* ---------- render ---------- */

  var SHAPES = {
    needle: [[11, 0], [-7, 5], [-4, 0], [-7, -5]],
    wedge:  [[10, 0], [-7, 7], [-7, -7]]
  };

  function drawShip(s) {
    if (!s.alive) {
      /* a short expanding ring where it died */
      var t = 1.4 - s.dead;
      if (t < 0.5) {
        ctx.strokeStyle = s.colour;
        ctx.globalAlpha = Math.max(0, 1 - t * 2);
        ctx.beginPath(); ctx.arc(s.x, s.y, 6 + t * 42, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      return;
    }
    var pts = s.isPlayer ? SHAPES.needle : SHAPES.wedge;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.a);
    ctx.strokeStyle = s.colour;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    pts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
    ctx.closePath();
    ctx.stroke();
    if (s.thrusting) {
      ctx.beginPath();
      ctx.moveTo(-7, 2.5); ctx.lineTo(-13 - Math.random() * 5, 0); ctx.lineTo(-7, -2.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function render() {
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#9fb4c7';
    stars.forEach(function (st) {
      ctx.globalAlpha = st.b;
      ctx.fillRect(st.x | 0, st.y | 0, 1, 1);
    });
    ctx.globalAlpha = 1;

    /* the star */
    var g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 34);
    g.addColorStop(0, 'rgba(255,245,210,.95)');
    g.addColorStop(0.35, 'rgba(255,190,90,.45)');
    g.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(CX, CY, 34, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath(); ctx.arc(CX, CY, STAR_R * 0.5, 0, TAU); ctx.fill();

    ctx.fillStyle = '#dfe9f2';
    shots.forEach(function (t) { ctx.fillRect(t.x - 1, t.y - 1, 2.2, 2.2); });

    drawShip(foe);
    drawShip(you);

    if (!focused) {
      ctx.fillStyle = 'rgba(5,7,10,.72)';
      ctx.fillRect(0, H / 2 - 26, W, 52);
      ctx.fillStyle = '#9fe8a8';
      ctx.font = '13px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CLICK OR TAB HERE TO TAKE THE CONTROLS', CX, H / 2 + 4);
      ctx.textAlign = 'left';
    }
  }

  /* ---------- loop ---------- */

  var last = 0;
  function loop(ts) {
    frame = requestAnimationFrame(loop);
    var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
    last = ts;
    if (!over) step(dt);
    render();
  }

  function start() {
    if (running) return;
    running = true; last = 0;
    frame = requestAnimationFrame(loop);
    startBtn.setAttribute('aria-pressed', 'true');
    startBtn.querySelector('[data-sw="start-label"]').textContent = 'Pause';
  }

  function stop() {
    running = false;
    if (frame) { cancelAnimationFrame(frame); frame = null; }
    startBtn.setAttribute('aria-pressed', 'false');
    startBtn.querySelector('[data-sw="start-label"]').textContent = 'Play';
  }

  startBtn.addEventListener('click', function () {
    if (running) { stop(); say('Paused.'); }
    else { if (over) reset(true); start(); canvas.focus(); }
  });

  root.querySelector('[data-sw="restart"]').addEventListener('click', function () {
    reset(true); say('New game.'); if (!running) start(); canvas.focus();
  });

  document.addEventListener('visibilitychange', function () { if (document.hidden && running) { stop(); say('Paused.'); } });

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting && running) { stop(); say('Paused.'); }
    }, { threshold: 0 }).observe(canvas);
  }

  reset(true);
  render();
  root.classList.add('sw-ready');
})();

/* Physarum — a slime mould grown on a canvas
   ======================================================================
   Added 2026-10-05. Additive: this file touches nothing outside #slime.

   Physarum polycephalum is a single yellow cell with no brain and no
   nervous system. In 2010 Tero et al. put oat flakes on a map of Tokyo
   at the positions of the surrounding towns, let the mould grow, and it
   produced a network with roughly the cost, efficiency and fault
   tolerance of the actual Tokyo rail system. It solves mazes the same
   way. It has no plan; it just lays down slime and follows slime.

   That's the whole model here, from Jeff Jones' 2010 paper:

     1. every agent sniffs three points ahead — left, centre, right
     2. it turns toward whichever smells strongest
     3. it steps forward and deposits a little trail of its own
     4. the whole trail field blurs and fades a bit each tick

   There is no path-finding and no global anything. The networks below
   are what falls out of those four lines running on 19,000 agents.
*/
(function () {
  'use strict';

  var root = document.getElementById('slime');
  if (!root) return;

  var canvas = root.querySelector('[data-sl="canvas"]');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  /* Simulation grid. Fixed and modest on purpose: the diffuse pass is
     nine reads per cell per tick, so this is the knob that decides
     whether a laptop fan spins up. The canvas is scaled to fit by CSS,
     and the upscale blur suits the subject. */
  var W = 480, H = 320, CELLS = W * H;
  var AGENTS = 19000;

  canvas.width = W;
  canvas.height = H;

  var trail = new Float32Array(CELLS);
  var next = new Float32Array(CELLS);
  var ax = new Float32Array(AGENTS);
  var ay = new Float32Array(AGENTS);
  var ah = new Float32Array(AGENTS);

  /* Wrap tables: the field is a torus, and looking these up beats a
     modulo in the inner loop. */
  var xL = new Int32Array(W), xR = new Int32Array(W);
  var yU = new Int32Array(H), yD = new Int32Array(H);
  for (var i = 0; i < W; i++) { xL[i] = (i - 1 + W) % W; xR[i] = (i + 1) % W; }
  for (var j = 0; j < H; j++) { yU[j] = (j - 1 + H) % H; yD[j] = (j + 1) % H; }

  var image = ctx.createImageData(W, H);
  var pixels = new Uint32Array(image.data.buffer);

  /* Endianness decides the byte order inside that Uint32 view. */
  var probe = new ArrayBuffer(4);
  new Uint32Array(probe)[0] = 0x01020304;
  var littleEndian = new Uint8Array(probe)[0] === 0x04;

  /* Physarum polycephalum is genuinely this colour — bright yellow on
     the forest floor — so the ramp is the organism rather than a theme. */
  var STOPS = [
    [0.00, 7, 6, 11],
    [0.12, 42, 20, 6],
    [0.38, 150, 78, 8],
    [0.68, 240, 168, 31],
    [1.00, 255, 243, 196]
  ];
  var LUT = new Uint32Array(256);
  (function buildLUT() {
    for (var n = 0; n < 256; n++) {
      var t = n / 255, k = 0;
      while (k < STOPS.length - 2 && t > STOPS[k + 1][0]) k++;
      var a = STOPS[k], b = STOPS[k + 1];
      var f = (t - a[0]) / (b[0] - a[0] || 1);
      var r = Math.round(a[1] + (b[1] - a[1]) * f);
      var g = Math.round(a[2] + (b[2] - a[2]) * f);
      var bl = Math.round(a[3] + (b[3] - a[3]) * f);
      LUT[n] = littleEndian
        ? (255 << 24) | (bl << 16) | (g << 8) | r
        : (r << 24) | (g << 16) | (bl << 8) | 255;
    }
  })();

  /* ------------------------------------------------------------------
     Parameters
     ------------------------------------------------------------------ */

  var P = { sensorAngle: 22, turnAngle: 45, sensorDist: 9, decay: 0.94, step: 1.0 };

  var PRESETS = {
    network: { sensorAngle: 22, turnAngle: 45, sensorDist: 9,  decay: 0.94, step: 1.0 },
    veins:   { sensorAngle: 45, turnAngle: 20, sensorDist: 13, decay: 0.97, step: 1.2 },
    ripples: { sensorAngle: 12, turnAngle: 11, sensorDist: 16, decay: 0.90, step: 1.0 },
    lattice: { sensorAngle: 60, turnAngle: 58, sensorDist: 5,  decay: 0.95, step: 1.0 }
  };

  var DEPOSIT = 0.22;
  var TAU = Math.PI * 2;

  /* ------------------------------------------------------------------
     Seeding
     ------------------------------------------------------------------ */

  function reseed() {
    trail.fill(0);
    next.fill(0);
    for (var n = 0; n < AGENTS; n++) {
      ax[n] = Math.random() * W;
      ay[n] = Math.random() * H;
      ah[n] = Math.random() * TAU;
    }
    render();
  }

  /* A blob of attractant. The agents have no special food-seeking
     behaviour — they follow trail, and this is just a lot of trail. */
  function feed(cx, cy, radius, strength) {
    var r2 = radius * radius;
    for (var dy = -radius; dy <= radius; dy++) {
      var y = ((cy + dy) % H + H) % H, row = y * W;
      for (var dx = -radius; dx <= radius; dx++) {
        var d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        var x = ((cx + dx) % W + W) % W;
        var v = trail[row + x] + strength * (1 - d2 / r2);
        trail[row + x] = v > 1 ? 1 : v;
      }
    }
  }

  /* ------------------------------------------------------------------
     One tick
     ------------------------------------------------------------------ */

  function sense(x, y, heading, offset) {
    var sx = x + Math.cos(heading) * offset;
    var sy = y + Math.sin(heading) * offset;
    var ix = (sx | 0) % W; if (ix < 0) ix += W;
    var iy = (sy | 0) % H; if (iy < 0) iy += H;
    return trail[iy * W + ix];
  }

  function step() {
    var sa = P.sensorAngle * Math.PI / 180;
    var ra = P.turnAngle * Math.PI / 180;
    var so = P.sensorDist;
    var ss = P.step;

    for (var n = 0; n < AGENTS; n++) {
      var x = ax[n], y = ay[n], h = ah[n];

      var c = sense(x, y, h, so);
      var l = sense(x, y, h - sa, so);
      var r = sense(x, y, h + sa, so);

      if (c > l && c > r) {
        /* straight on */
      } else if (c < l && c < r) {
        h += (Math.random() < 0.5 ? -ra : ra);
      } else if (l < r) {
        h += ra;
      } else if (r < l) {
        h -= ra;
      }

      x += Math.cos(h) * ss;
      y += Math.sin(h) * ss;

      if (x < 0) x += W; else if (x >= W) x -= W;
      if (y < 0) y += H; else if (y >= H) y -= H;

      ax[n] = x; ay[n] = y; ah[n] = h;

      var idx = (y | 0) * W + (x | 0);
      var v = trail[idx] + DEPOSIT;
      trail[idx] = v > 1 ? 1 : v;
    }

    diffuse();
  }

  /* 3x3 mean, then fade. This is the expensive pass. */
  function diffuse() {
    var decay = P.decay;
    for (var y = 0; y < H; y++) {
      var up = yU[y] * W, mid = y * W, dn = yD[y] * W;
      for (var x = 0; x < W; x++) {
        var l = xL[x], r = xR[x];
        var s = trail[up + l] + trail[up + x] + trail[up + r] +
                trail[mid + l] + trail[mid + x] + trail[mid + r] +
                trail[dn + l] + trail[dn + x] + trail[dn + r];
        next[mid + x] = s * 0.1111111 * decay;
      }
    }
    var swap = trail; trail = next; next = swap;
  }

  function render() {
    for (var i = 0; i < CELLS; i++) {
      var v = trail[i];
      pixels[i] = LUT[v >= 1 ? 255 : (v * 255) | 0];
    }
    ctx.putImageData(image, 0, 0);
  }

  /* ------------------------------------------------------------------
     Transport
     ------------------------------------------------------------------ */

  var playBtn = root.querySelector('[data-sl="play"]');
  var playLabel = root.querySelector('[data-sl="play-label"]');
  var statusEl = root.querySelector('[data-sl="status"]');
  var frame = null;
  var running = false;
  var onScreen = true;
  var autoplay = true;    /* set once prefers-reduced-motion is read, below */
  var started = false;

  var reduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  function loop() {
    frame = requestAnimationFrame(loop);
    step();
    render();
  }

  function play() {
    if (running) return;
    running = true;
    frame = requestAnimationFrame(loop);
    playBtn.setAttribute('aria-pressed', 'true');
    playLabel.textContent = 'Pause';
    setStatus('');
  }

  function pause(why) {
    running = false;
    if (frame) { cancelAnimationFrame(frame); frame = null; }
    playBtn.setAttribute('aria-pressed', 'false');
    playLabel.textContent = 'Grow';
    if (why) setStatus(why);
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  playBtn.addEventListener('click', function () {
    if (running) pause(''); else play();
  });

  /* Don't burn a CPU on a canvas nobody is looking at. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && running) pause('Paused — tab was hidden.');
  });

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (!onScreen && running) {
        pause('');
      } else if (onScreen && !running && autoplay && !started) {
        started = true;
        play();
      }
    }, { threshold: 0.2 }).observe(canvas);
  }

  /* ------------------------------------------------------------------
     Controls
     ------------------------------------------------------------------ */

  function bind(name, key, fmt) {
    var input = root.querySelector('[data-ctl="' + name + '"]');
    var out = root.querySelector('[data-out="' + name + '"]');
    if (!input) return;
    function sync() {
      P[key] = parseFloat(input.value);
      if (out) out.textContent = fmt(P[key]);
    }
    input.addEventListener('input', function () {
      sync();
      var preset = root.querySelector('[data-sl="preset"]');
      if (preset && preset.value !== 'custom') preset.value = 'custom';
    });
    sync();
    return input;
  }

  var deg = function (v) { return v + '°'; };
  var px = function (v) { return v + ' px'; };
  var dec = function (v) { return v.toFixed(2); };

  var inputs = {
    sensorAngle: bind('sensor-angle', 'sensorAngle', deg),
    turnAngle: bind('turn-angle', 'turnAngle', deg),
    sensorDist: bind('sensor-dist', 'sensorDist', px),
    decay: bind('decay', 'decay', dec)
  };

  var FORMAT = {
    sensorAngle: ['sensor-angle', deg],
    turnAngle: ['turn-angle', deg],
    sensorDist: ['sensor-dist', px],
    decay: ['decay', dec]
  };

  var presetSel = root.querySelector('[data-sl="preset"]');
  presetSel.addEventListener('change', function () {
    var p = PRESETS[presetSel.value];
    if (!p) return;
    P.step = p.step;
    /* Written straight into state and the readouts: firing 'input' on
       each slider would flip this very select back to Custom. */
    Object.keys(FORMAT).forEach(function (k) {
      P[k] = p[k];
      if (inputs[k]) inputs[k].value = String(p[k]);
      var out = root.querySelector('[data-out="' + FORMAT[k][0] + '"]');
      if (out) out.textContent = FORMAT[k][1](p[k]);
    });
  });

  root.querySelector('[data-sl="reseed"]').addEventListener('click', function () {
    reseed();
    setStatus('Reseeded — 19,000 agents, random headings.');
  });

  /* Keyboard-reachable equivalent of clicking food onto the canvas. */
  root.querySelector('[data-sl="feed"]').addEventListener('click', function () {
    for (var k = 0; k < 5; k++) {
      feed((Math.random() * W) | 0, (Math.random() * H) | 0, 14, 1);
    }
    render();
    setStatus('Five attractants dropped.');
  });

  /* Pointer: drag food onto the field. */
  var painting = false;
  function place(ev) {
    var rect = canvas.getBoundingClientRect();
    var cx = ((ev.clientX - rect.left) / rect.width * W) | 0;
    var cy = ((ev.clientY - rect.top) / rect.height * H) | 0;
    feed(cx, cy, 11, 1);
    if (!running) render();
  }
  canvas.addEventListener('pointerdown', function (ev) {
    painting = true;
    canvas.setPointerCapture(ev.pointerId);
    place(ev);
    ev.preventDefault();
  });
  canvas.addEventListener('pointermove', function (ev) { if (painting) place(ev); });
  canvas.addEventListener('pointerup', function () { painting = false; });
  canvas.addEventListener('pointercancel', function () { painting = false; });

  /* ------------------------------------------------------------------
     Listening to the drum machine

     #euclid broadcasts a `daily:beat` on every onset. When this is armed,
     each beat drops attractant at the position that beat occupies on
     Euclid's own rings: the track picks the radius, the step picks the
     angle. So the rhythm is literally drawn onto the field, and the mould
     grows along it — the network you get is the shape of the pattern you
     are listening to.

     Nothing here reaches into #euclid. If that section is removed, or its
     script fails, this listener simply never fires.
     ------------------------------------------------------------------ */

  var listenIn = root.querySelector('[data-sl="listen"]');
  var RING_R = [0.42, 0.33, 0.24, 0.15];   /* fraction of the short side */

  document.addEventListener('daily:beat', function (ev) {
    if (!listenIn || !listenIn.checked) return;
    var d = ev.detail;
    if (!d || !d.steps) return;

    var r = (RING_R[d.ring] || 0.2) * H;
    var a = (d.index / d.steps) * TAU - Math.PI / 2;
    var cx = (W / 2 + Math.cos(a) * r) | 0;
    var cy = (H / 2 + Math.sin(a) * r) | 0;

    feed(cx, cy, 10, 1);
    if (!running) render();      /* so it's visible even while paused */
  });

  /* ------------------------------------------------------------------ */

  reseed();

  /* Reduced motion: the whole piece is motion, so it does not start on
     its own — but the button still works, because choosing to watch it
     is different from having it thrust at you. */
  autoplay = !reduced.matches;

  if (!autoplay) {
    setStatus('Paused — your system asks for reduced motion. Press Grow when you want it.');
  } else if (!window.IntersectionObserver) {
    started = true;
    play();
  }

  root.classList.add('sl-ready');
})();

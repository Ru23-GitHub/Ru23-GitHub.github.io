/* Daily build — 2026-10-05 — "The Butterfly Effect"
   Lorenz attractor, a divergence lab, and the logistic map.
   Vanilla JS, no dependencies, no build step. */
(function () {
  'use strict';

  var mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mql.matches;
  if (mql.addEventListener) {
    mql.addEventListener('change', function (e) { reduce = e.matches; });
  }

  var COL = { cyan: '103,240,227', mag: '255,110,169', amber: '255,180,87', mute: '109,121,143' };

  /* ---------- canvas helpers ---------- */

  function fit(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    var w = Math.max(1, r.width), h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h, dpr: dpr };
  }

  function onResize(fn) {
    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(fn, 160);
    });
  }

  /* ---------- Lorenz system ---------- */

  var SIGMA = 10, RHO = 28, BETA = 8 / 3;

  function deriv(s, o) {
    o[0] = SIGMA * (s[1] - s[0]);
    o[1] = s[0] * (RHO - s[2]) - s[1];
    o[2] = s[0] * s[1] - BETA * s[2];
  }

  var k1 = new Float64Array(3), k2 = new Float64Array(3),
      k3 = new Float64Array(3), k4 = new Float64Array(3),
      tmp = new Float64Array(3);

  function rk4(s, dt) {
    var i;
    deriv(s, k1);
    for (i = 0; i < 3; i++) tmp[i] = s[i] + 0.5 * dt * k1[i];
    deriv(tmp, k2);
    for (i = 0; i < 3; i++) tmp[i] = s[i] + 0.5 * dt * k2[i];
    deriv(tmp, k3);
    for (i = 0; i < 3; i++) tmp[i] = s[i] + dt * k3[i];
    deriv(tmp, k4);
    for (i = 0; i < 3; i++) {
      s[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
  }

  /* =========================================================
     1. HERO — rotating attractor
     ========================================================= */

  function initHero(canvas) {
    var v = fit(canvas), ctx = v.ctx;
    var MAX = 8200;
    var buf = new Float64Array(MAX * 3);
    var head = 0, count = 0;
    var s = new Float64Array([0.9, 0.2, 12.0]);
    // The camera sways around the classic head-on "butterfly" view rather than
    // spinning freely, so it never lands edge-on. Dragging adds a user offset
    // that the sway continues around.
    var phase = 0, uYaw = 0, uPitch = 0;
    var dragging = false, lastX = 0, lastY = 0;

    function camYaw()   { return 0.34 * Math.sin(phase) + uYaw; }
    function camPitch() {
      return Math.max(-1.3, Math.min(1.3, -0.10 + 0.16 * Math.sin(phase * 0.61) + uPitch));
    }
    var visible = true, raf = null;
    var DT = 0.0045;

    function push() {
      var i = head * 3;
      buf[i] = s[0]; buf[i + 1] = s[1]; buf[i + 2] = s[2];
      head = (head + 1) % MAX;
      if (count < MAX) count++;
    }

    function advance(n) {
      for (var i = 0; i < n; i++) { rk4(s, DT); push(); }
    }

    function draw() {
      var w = v.w, h = v.h;
      ctx.clearRect(0, 0, w, h);
      if (count < 4) return;

      var scale = Math.min(w * 0.78, h) / 62;
      var ox = w >= 900 ? w * 0.655 : w / 2;
      var oy = h / 2 - h * 0.06;
      var yaw = camYaw(), pitch = camPitch();
      var cy = Math.cos(yaw), sy = Math.sin(yaw);
      var cp = Math.cos(pitch), sp = Math.sin(pitch);
      var start = (head - count + MAX) % MAX;

      var BANDS = 7, per = Math.floor(count / BANDS);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      var px = 0, py = 0;
      for (var b = 0; b < BANDS; b++) {
        var from = b * per;
        var to = (b === BANDS - 1) ? count - 1 : (b + 1) * per;
        if (to - from < 2) continue;
        ctx.beginPath();
        for (var i = from; i <= to; i++) {
          var idx = ((start + i) % MAX) * 3;
          var x = buf[idx], y = buf[idx + 1], z = buf[idx + 2] - 25;
          var rx = x * cy - y * sy, ry = x * sy + y * cy;
          var ry2 = ry * cp - z * sp, rz2 = ry * sp + z * cp;
          var f = 1 / (1 + ry2 * 0.0065);
          px = ox + rx * scale * f;
          py = oy - rz2 * scale * f;
          if (i === from) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        var t = (b + 1) / BANDS;
        ctx.strokeStyle = 'rgba(' + COL.cyan + ',' + (0.06 + 0.52 * t * t).toFixed(3) + ')';
        ctx.lineWidth = 0.7 + 1.2 * t;
        ctx.stroke();
      }

      // leading point
      ctx.save();
      ctx.shadowBlur = 16;
      ctx.shadowColor = 'rgba(' + COL.cyan + ',0.9)';
      ctx.fillStyle = '#d9fffa';
      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      raf = null;
      if (!visible) return;
      advance(13);
      if (!dragging) phase += 0.0024;
      draw();
      raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (reduce || raf !== null || !visible) return;
      raf = requestAnimationFrame(frame);
    }

    // seed
    for (var i = 0; i < 900; i++) rk4(s, DT);
    if (reduce) {
      advance(MAX - 1);
      draw();
    } else {
      advance(1400);
      kick();
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) kick();
      }, { threshold: 0 }).observe(canvas);
    }

    /* pointer rotation */
    function down(e) {
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
    }
    function move(e) {
      if (!dragging) return;
      uYaw += (e.clientX - lastX) * 0.008;
      uPitch += (e.clientY - lastY) * 0.006;
      uPitch = Math.max(-1.2, Math.min(1.2, uPitch));
      lastX = e.clientX; lastY = e.clientY;
      if (reduce) draw();
    }
    function up() { dragging = false; }

    if (window.PointerEvent) {
      canvas.addEventListener('pointerdown', down);
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
      canvas.addEventListener('pointerleave', up);
    }

    canvas.addEventListener('keydown', function (e) {
      var step = 0.12, used = true;
      if (e.key === 'ArrowLeft') uYaw -= step;
      else if (e.key === 'ArrowRight') uYaw += step;
      else if (e.key === 'ArrowUp') uPitch = Math.max(-1.2, uPitch - step);
      else if (e.key === 'ArrowDown') uPitch = Math.min(1.2, uPitch + step);
      else used = false;
      if (used) { e.preventDefault(); if (reduce) draw(); }
    });

    onResize(function () { v = fit(canvas); ctx = v.ctx; draw(); });
  }

  /* =========================================================
     2. DIVERGENCE LAB
     ========================================================= */

  function initDivergence() {
    var phase = document.getElementById('divPhase');
    var strip = document.getElementById('divStrip');
    var slider = document.getElementById('epsInput');
    var epsOut = document.getElementById('epsOut');
    var runBtn = document.getElementById('divRun');
    var roT = document.getElementById('roT'), roD = document.getElementById('roD'),
        roG = document.getElementById('roG'), roH = document.getElementById('roH');
    if (!phase || !strip || !slider || !runBtn) return;

    var pv = fit(phase), sv = fit(strip);
    var DT = 0.004, TMAX = 42, TRAIL = 1700;

    // a point comfortably settled on the attractor, shared by every run
    var SEED = new Float64Array([0.9, 0.2, 12.0]);
    for (var w = 0; w < 2000; w++) rk4(SEED, DT);

    var A = new Float64Array(3), B = new Float64Array(3);
    var ta = [], tb = [], curve = [];
    var t = 0, eps = 1e-6, running = false, raf = null, satT = -1, horizon = -1;

    function readEps() { return Math.pow(10, +slider.value); }

    function fmtExp(x) {
      if (!isFinite(x)) return '—';
      var e = Math.floor(Math.log10(Math.abs(x)));
      var m = x / Math.pow(10, e);
      return m.toFixed(1) + 'e' + (e < 0 ? '−' : '+') + Math.abs(e);
    }

    function fmtBig(x) {
      if (x < 1000) return '×' + x.toFixed(0);
      return '×' + fmtExp(x);
    }

    function reset() {
      eps = readEps();
      A.set(SEED); B.set(SEED);
      B[0] += eps;
      t = 0; satT = -1; horizon = -1;
      ta = []; tb = []; curve = [{ t: 0, d: eps }];
      record();
      updateReadout();
      drawPhase();
      drawStrip();
    }

    function dist() {
      var dx = A[0] - B[0], dy = A[1] - B[1], dz = A[2] - B[2];
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function record() {
      ta.push(A[0], A[2]);
      tb.push(B[0], B[2]);
      if (ta.length > TRAIL * 2) { ta.splice(0, 2); tb.splice(0, 2); }
    }

    function step(n) {
      for (var i = 0; i < n; i++) {
        rk4(A, DT); rk4(B, DT);
        t += DT;
        if (i % 4 === 0) record();
        if (i % 10 === 0) {
          var d = dist();
          curve.push({ t: t, d: d });
          if (horizon < 0 && d > 1) horizon = t;
          if (satT < 0 && d > 28) satT = t;
        }
      }
    }

    function done() {
      return t >= TMAX || (satT > 0 && t > satT + 9);
    }

    /* ---- drawing ---- */

    function mapPhase(x, z, w, h) {
      var pad = 14;
      var sx = (w - pad * 2) / 54, sz = (h - pad * 2) / 50;
      var sc = Math.min(sx, sz);
      return [w / 2 + x * sc, h - pad - (z - 2) * sc];
    }

    function trail(ctx, arr, w, h, color) {
      var n = arr.length / 2;
      if (n < 2) return;
      var BANDS = 5, per = Math.floor(n / BANDS);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (var b = 0; b < BANDS; b++) {
        var from = b * per, to = (b === BANDS - 1) ? n - 1 : (b + 1) * per;
        if (to - from < 2) continue;
        ctx.beginPath();
        for (var i = from; i <= to; i++) {
          var p = mapPhase(arr[i * 2], arr[i * 2 + 1], w, h);
          if (i === from) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        }
        var f = (b + 1) / BANDS;
        ctx.strokeStyle = 'rgba(' + color + ',' + (0.05 + 0.5 * f * f).toFixed(3) + ')';
        ctx.lineWidth = 0.6 + 1.0 * f;
        ctx.stroke();
      }
      var last = mapPhase(arr[(n - 1) * 2], arr[(n - 1) * 2 + 1], w, h);
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(' + color + ',0.95)';
      ctx.fillStyle = 'rgba(' + color + ',1)';
      ctx.beginPath();
      ctx.arc(last[0], last[1], 3.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawPhase() {
      var ctx = pv.ctx, w = pv.w, h = pv.h;
      ctx.clearRect(0, 0, w, h);
      trail(ctx, ta, w, h, COL.cyan);
      trail(ctx, tb, w, h, COL.mag);
    }

    function drawStrip() {
      var ctx = sv.ctx, w = sv.w, h = sv.h;
      var L = 44, R = 12, T = 14, Bm = 26;
      var iw = w - L - R, ih = h - T - Bm;
      ctx.clearRect(0, 0, w, h);

      var y0 = Math.log(eps) / Math.LN10 - 0.4;   // bottom of y axis
      var y1 = 1.9;                               // log10(~80)
      var X = function (tt) { return L + iw * Math.min(1, tt / TMAX); };
      var Y = function (d) {
        var l = Math.log(Math.max(d, 1e-18)) / Math.LN10;
        return T + ih * (1 - (l - y0) / (y1 - y0));
      };

      // grid: one line per decade
      ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      for (var e = Math.ceil(y0); e <= Math.floor(y1); e++) {
        var yy = Y(Math.pow(10, e));
        ctx.strokeStyle = 'rgba(' + COL.mute + ',0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L, yy); ctx.lineTo(w - R, yy);
        ctx.stroke();
        ctx.fillStyle = 'rgba(' + COL.mute + ',0.8)';
        ctx.fillText('1e' + (e < 0 ? '−' : '') + Math.abs(e), L - 7, yy);
      }

      // x ticks
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (var tt = 0; tt <= TMAX; tt += 10) {
        ctx.fillStyle = 'rgba(' + COL.mute + ',0.8)';
        ctx.fillText('t=' + tt, X(tt), h - Bm + 7);
      }

      // reference slope: d = eps * e^(0.906 t)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(' + COL.amber + ',0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(X(0), Y(eps));
      var tCap = Math.min(TMAX, Math.log(60 / eps) / 0.906);
      ctx.lineTo(X(tCap), Y(eps * Math.exp(0.906 * tCap)));
      ctx.stroke();
      ctx.setLineDash([]);

      // "forecast lost" marker
      if (horizon > 0) {
        ctx.strokeStyle = 'rgba(' + COL.mag + ',0.45)';
        ctx.beginPath();
        ctx.moveTo(X(horizon), T); ctx.lineTo(X(horizon), h - Bm);
        ctx.stroke();
      }

      // the data
      if (curve.length > 1) {
        ctx.strokeStyle = 'rgba(' + COL.cyan + ',0.95)';
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (var i = 0; i < curve.length; i++) {
          var p = curve[i];
          if (i === 0) ctx.moveTo(X(p.t), Y(p.d)); else ctx.lineTo(X(p.t), Y(p.d));
        }
        ctx.stroke();
      }

      // frame
      ctx.strokeStyle = 'rgba(' + COL.mute + ',0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(L, T); ctx.lineTo(L, h - Bm); ctx.lineTo(w - R, h - Bm);
      ctx.stroke();
    }

    function updateReadout() {
      var d = dist();
      roT.textContent = 't = ' + t.toFixed(2);
      roD.textContent = fmtExp(d);
      roG.textContent = fmtBig(d / eps);
      roH.textContent = horizon > 0 ? 't = ' + horizon.toFixed(1) : '—';
    }

    function frame() {
      raf = null;
      step(28);
      drawPhase();
      drawStrip();
      updateReadout();
      if (done()) { stop(); return; }
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
      runBtn.textContent = 'Run it again';
    }

    function start() {
      reset();
      if (reduce) {
        // no animation: compute the whole run in one go
        while (!done()) step(200);
        drawPhase(); drawStrip(); updateReadout();
        runBtn.textContent = 'Run it again';
        return;
      }
      running = true;
      runBtn.textContent = 'Stop';
      raf = requestAnimationFrame(frame);
    }

    runBtn.addEventListener('click', function () {
      if (running) { stop(); runBtn.textContent = 'Release them'; }
      else start();
    });

    slider.addEventListener('input', function () {
      epsOut.textContent = '1e−' + Math.abs(+slider.value);
      if (running) stop();
      runBtn.textContent = 'Release them';
      reset();
    });

    onResize(function () {
      pv = fit(phase); sv = fit(strip);
      drawPhase(); drawStrip();
    });

    epsOut.textContent = '1e−' + Math.abs(+slider.value);
    reset();
  }

  /* =========================================================
     3. LOGISTIC MAP
     ========================================================= */

  function initLogistic() {
    var bif = document.getElementById('bifCanvas');
    var orb = document.getElementById('orbCanvas');
    var slider = document.getElementById('rInput');
    var rOut = document.getElementById('rOut');
    var pOut = document.getElementById('pOut');
    var chips = document.querySelectorAll('.chip[data-r]');
    if (!bif || !orb || !slider) return;

    var R0 = 2.4, R1 = 4.0;
    var bv = fit(bif), ov = fit(orb);
    var off = document.createElement('canvas');
    var octx = null, col = 0, raf = null, ready = false;

    function startRender() {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
      off.width = Math.min(1500, bif.width);
      off.height = bif.height;
      octx = off.getContext('2d');
      octx.fillStyle = '#0b0d14';
      octx.fillRect(0, 0, off.width, off.height);
      octx.fillStyle = 'rgba(' + COL.cyan + ',0.085)';
      col = 0;
      ready = false;
      if (reduce) { while (col < off.width) renderChunk(off.width); ready = true; blit(); }
      else raf = requestAnimationFrame(chunkFrame);
    }

    function renderChunk(n) {
      var end = Math.min(off.width, col + n);
      var H = off.height;
      for (; col < end; col++) {
        var r = R0 + (R1 - R0) * (col / (off.width - 1));
        var x = 0.37, i;
        for (i = 0; i < 360; i++) x = r * x * (1 - x);
        for (i = 0; i < 240; i++) {
          x = r * x * (1 - x);
          octx.fillRect(col, ((1 - x) * (H - 1)) | 0, 1, 1);
        }
      }
    }

    function chunkFrame() {
      raf = null;
      renderChunk(44);
      blit();
      if (col < off.width) raf = requestAnimationFrame(chunkFrame);
      else ready = true;
    }

    function blit() {
      var ctx = bv.ctx, w = bv.w, h = bv.h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(off, 0, 0, w, h);

      var r = +slider.value;
      var mx = w * (r - R0) / (R1 - R0);

      // marker
      ctx.strokeStyle = 'rgba(' + COL.amber + ',0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(mx, 0); ctx.lineTo(mx, h);
      ctx.stroke();

      // a scrim so the axis labels stay legible over the dense chaotic band
      var scrim = ctx.createLinearGradient(0, h - 26, 0, h);
      scrim.addColorStop(0, 'rgba(11,13,20,0)');
      scrim.addColorStop(1, 'rgba(11,13,20,0.92)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, h - 26, w, 26);

      // axis labels
      ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
      ctx.textBaseline = 'alphabetic';
      var tickStep = w < 560 ? 0.5 : 0.25;
      for (var rr = 2.5; rr <= 4.0001; rr += tickStep) {
        var xx = w * (rr - R0) / (R1 - R0);
        var last = rr > 4.0001 - tickStep;
        ctx.fillStyle = 'rgba(' + COL.mute + ',0.55)';
        ctx.fillRect(Math.min(xx, w - 1), h - 22, 1, 5);
        ctx.fillStyle = 'rgba(' + COL.mute + ',0.9)';
        ctx.textAlign = last ? 'right' : 'center';
        ctx.fillText('r=' + rr.toFixed(2), last ? w - 4 : xx, h - 6);
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(' + COL.amber + ',1)';
      ctx.fillText('r = ' + r.toFixed(3), Math.min(mx + 7, w - 64), 15);
    }

    function periodOf(r) {
      var x = 0.37, i, p;
      for (i = 0; i < 4000; i++) x = r * x * (1 - x);
      var v = new Float64Array(160);
      for (i = 0; i < 160; i++) { x = r * x * (1 - x); v[i] = x; }
      for (p = 1; p <= 48; p++) {
        var ok = true;
        for (i = 0; i < 80; i++) {
          if (Math.abs(v[i] - v[i + p]) > 1e-5) { ok = false; break; }
        }
        if (ok) return p;
      }
      return 0;
    }

    function drawOrbit() {
      var ctx = ov.ctx, w = ov.w, h = ov.h;
      var r = +slider.value;
      var pad = 12, N = 90;
      ctx.clearRect(0, 0, w, h);

      // baseline grid
      ctx.strokeStyle = 'rgba(' + COL.mute + ',0.15)';
      ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var gy = pad + (h - pad * 2) * (g / 4);
        ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(w - pad, gy); ctx.stroke();
      }

      var x = 0.37, i;
      for (i = 0; i < 1200; i++) x = r * x * (1 - x);

      var pts = [];
      for (i = 0; i < N; i++) {
        x = r * x * (1 - x);
        pts.push([pad + (w - pad * 2) * (i / (N - 1)), pad + (h - pad * 2) * (1 - x)]);
      }

      ctx.strokeStyle = 'rgba(' + COL.cyan + ',0.42)';
      ctx.lineWidth = 1.3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]); else ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.stroke();

      ctx.fillStyle = 'rgba(' + COL.cyan + ',0.95)';
      for (i = 0; i < pts.length; i++) {
        ctx.beginPath();
        ctx.arc(pts[i][0], pts[i][1], 1.9, 0, Math.PI * 2);
        ctx.fill();
      }

      var p = periodOf(r);
      pOut.textContent = p === 0 ? 'chaotic — never repeats'
        : p === 1 ? 'settles on one value'
        : 'period ' + p;
    }

    function sync() {
      rOut.textContent = (+slider.value).toFixed(3);
      blit();
      drawOrbit();
      for (var i = 0; i < chips.length; i++) {
        chips[i].setAttribute('aria-pressed',
          Math.abs(+chips[i].dataset.r - +slider.value) < 0.0005 ? 'true' : 'false');
      }
    }

    slider.addEventListener('input', sync);

    for (var i = 0; i < chips.length; i++) {
      chips[i].setAttribute('aria-pressed', 'false');
      chips[i].addEventListener('click', function () {
        slider.value = this.dataset.r;
        sync();
      });
    }

    onResize(function () {
      bv = fit(bif); ov = fit(orb);
      startRender();
      sync();
    });

    startRender();
    sync();
  }

  /* ---------- go ---------- */

  function boot() {
    var hero = document.getElementById('lorenz');
    if (hero) initHero(hero);
    initDivergence();
    initLogistic();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

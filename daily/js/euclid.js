/* Euclid's Drum Machine
   ======================================================================
   Added 2026-10-05. Additive: this file touches nothing outside #euclid.

   Bjorklund's algorithm distributes k onsets as evenly as possible over
   n steps. Toussaint's 2005 paper "The Euclidean Algorithm Generates
   Traditional Musical Rhythms" shows that the patterns it spits out are,
   over and over, rhythms people were already playing — E(3,8) is the
   Cuban tresillo, E(7,12) the West African bembé, E(4,9) a Turkish aksak.

   Each track keeps its own step count and its own cursor, so a 9-step
   pattern against an 8-step pattern phases instead of locking — the
   "Drift" preset leans on that.

   Audio is synthesised from scratch (oscillators + a noise buffer); there
   are no samples and no network requests. The AudioContext is only built
   on the first click of Play, which is also what browsers require.
*/
(function () {
  'use strict';

  var root = document.getElementById('euclid');
  if (!root || !window.requestAnimationFrame) return;

  var TRACKS = [
    { id: 'kick',  name: 'Kick',  hue: '#ff4d6d' },
    { id: 'snare', name: 'Snare', hue: '#ffb340' },
    { id: 'hat',   name: 'Hat',   hue: '#4dd4ff' },
    { id: 'clave', name: 'Clave', hue: '#b388ff' }
  ];

  var MAX_STEPS = 16;

  /* steps, pulses, rotate — in track order: kick, snare, hat, clave */
  var PRESETS = {
    tresillo:  [[8, 3, 0],  [8, 2, 2],  [8, 5, 0],  [8, 3, 1]],
    cinquillo: [[8, 5, 0],  [8, 2, 2],  [16, 9, 0], [8, 3, 0]],
    bembe:     [[12, 7, 0], [12, 3, 2], [12, 5, 1], [12, 2, 0]],
    aksak:     [[9, 4, 0],  [9, 2, 3],  [9, 7, 0],  [9, 3, 1]],
    ruchenitza:[[7, 4, 0],  [7, 2, 2],  [7, 5, 0],  [7, 3, 1]],
    venda:     [[12, 5, 0], [12, 3, 1], [12, 7, 0], [12, 4, 2]],
    khafif:    [[5, 2, 0],  [5, 3, 1],  [5, 4, 0],  [5, 1, 2]],
    drift:     [[8, 3, 0],  [9, 4, 2],  [11, 7, 0], [13, 5, 3]]
  };

  /* ------------------------------------------------------------------
     Bjorklund's algorithm
     ------------------------------------------------------------------ */

  function bjorklund(steps, pulses) {
    var i, out = [];
    if (pulses <= 0) { for (i = 0; i < steps; i++) out.push(0); return out; }
    if (pulses >= steps) { for (i = 0; i < steps; i++) out.push(1); return out; }

    var a = [], b = [];
    for (i = 0; i < pulses; i++) a.push([1]);
    for (i = 0; i < steps - pulses; i++) b.push([0]);

    while (b.length > 1 && a.length > 1) {
      var n = Math.min(a.length, b.length);
      var merged = [];
      for (i = 0; i < n; i++) merged.push(a[i].concat(b[i]));
      var rest = a.length > n ? a.slice(n) : b.slice(n);
      a = merged;
      b = rest;
    }

    var flat = [];
    a.concat(b).forEach(function (group) { flat = flat.concat(group); });
    return flat;
  }

  function rotate(pattern, by) {
    var n = pattern.length;
    if (!n) return pattern;
    var k = ((by % n) + n) % n;
    return pattern.slice(n - k).concat(pattern.slice(0, n - k));
  }

  /* ------------------------------------------------------------------
     Voices — everything synthesised, no samples
     ------------------------------------------------------------------ */

  var ctx = null;
  var master = null;
  var noise = null;

  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume();
    master.connect(ctx.destination);

    /* One second of white noise, reused by the snare and the hat. */
    var len = Math.floor(ctx.sampleRate);
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = noise.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function noiseSource() {
    var src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    src.loopEnd = 1;
    return src;
  }

  function env(gain, at, peak, decay) {
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  }

  var VOICES = {
    kick: function (at) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(165, at);
      osc.frequency.exponentialRampToValueAtTime(46, at + 0.17);
      env(g, at, 0.95, 0.3);
      osc.connect(g).connect(master);
      osc.start(at);
      osc.stop(at + 0.34);
    },

    snare: function (at) {
      var src = noiseSource();
      var bp = ctx.createBiquadFilter();
      var g = ctx.createGain();
      bp.type = 'bandpass';
      bp.frequency.value = 1750;
      bp.Q.value = 0.8;
      env(g, at, 0.34, 0.19);
      src.connect(bp).connect(g).connect(master);
      src.start(at);
      src.stop(at + 0.22);

      /* A little tuned body under the noise, or it reads as a hiss. */
      var body = ctx.createOscillator();
      var bg = ctx.createGain();
      body.type = 'triangle';
      body.frequency.setValueAtTime(196, at);
      body.frequency.exponentialRampToValueAtTime(150, at + 0.09);
      env(bg, at, 0.2, 0.1);
      body.connect(bg).connect(master);
      body.start(at);
      body.stop(at + 0.13);
    },

    hat: function (at) {
      var src = noiseSource();
      var hp = ctx.createBiquadFilter();
      var g = ctx.createGain();
      hp.type = 'highpass';
      hp.frequency.value = 7600;
      env(g, at, 0.16, 0.045);
      src.connect(hp).connect(g).connect(master);
      src.start(at);
      src.stop(at + 0.07);
    },

    clave: function (at) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2100, at);
      osc.frequency.exponentialRampToValueAtTime(1500, at + 0.04);
      env(g, at, 0.22, 0.055);
      osc.connect(g).connect(master);
      osc.start(at);
      osc.stop(at + 0.08);
    }
  };

  /* ------------------------------------------------------------------
     State wired to the controls already in the markup
     ------------------------------------------------------------------ */

  var playBtn   = root.querySelector('[data-eu="play"]');
  var playLabel = root.querySelector('[data-eu="play-label"]');
  var tempoIn   = root.querySelector('[data-eu="tempo"]');
  var tempoOut  = root.querySelector('[data-eu="tempo-out"]');
  var volIn     = root.querySelector('[data-eu="volume"]');
  var volOut    = root.querySelector('[data-eu="volume-out"]');
  var presetIn  = root.querySelector('[data-eu="preset"]');
  var randomBtn = root.querySelector('[data-eu="random"]');
  var ringHost  = root.querySelector('[data-eu="rings"]');

  function tempo() { return parseInt(tempoIn.value, 10) || 100; }
  function volume() { return (parseInt(volIn.value, 10) || 0) / 140; }

  var reduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  var state = TRACKS.map(function (spec) {
    var row = root.querySelector('.eu-track[data-track="' + spec.id + '"]');
    return {
      spec: spec,
      row: row,
      stepsIn: row.querySelector('[data-ctl="steps"]'),
      pulsesIn: row.querySelector('[data-ctl="pulses"]'),
      rotateIn: row.querySelector('[data-ctl="rotate"]'),
      muteIn: row.querySelector('[data-ctl="mute"]'),
      stepsOut: row.querySelector('[data-out="steps"]'),
      pulsesOut: row.querySelector('[data-out="pulses"]'),
      rotateOut: row.querySelector('[data-out="rotate"]'),
      patternOut: row.querySelector('[data-out="pattern"]'),
      notationOut: row.querySelector('[data-out="notation"]'),
      pattern: [],
      dots: [],
      cursor: 0,
      lastDot: null
    };
  });

  /* ------------------------------------------------------------------
     Rings
     ------------------------------------------------------------------ */

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var CENTER = 160;
  var RADII = [132, 104, 76, 48];

  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 320 320');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  ringHost.appendChild(svg);

  state.forEach(function (track, ti) {
    var r = RADII[ti];
    var g = document.createElementNS(SVG_NS, 'g');
    g.style.setProperty('--eu-hue', track.spec.hue);

    var base = document.createElementNS(SVG_NS, 'circle');
    base.setAttribute('class', 'eu-ring-base');
    base.setAttribute('cx', CENTER);
    base.setAttribute('cy', CENTER);
    base.setAttribute('r', r);
    g.appendChild(base);

    var tag = document.createElementNS(SVG_NS, 'text');
    tag.setAttribute('class', 'eu-ring-tag');
    tag.setAttribute('x', CENTER);
    tag.setAttribute('y', CENTER - r - 10);
    tag.setAttribute('text-anchor', 'middle');
    tag.textContent = track.spec.name.toUpperCase();
    /* A presentation attribute loses to the class rule, so set it inline. */
    tag.style.fill = track.spec.hue;
    tag.setAttribute('opacity', '.8');
    g.appendChild(tag);

    track.group = g;
    track.ringRadius = r;
    svg.appendChild(g);
  });

  /* The rings have independent lengths, so the whole machine only repeats
     after lcm(all step counts) sixteenths. Eight against nine against
     eleven against thirteen is 10,296 steps — about twenty minutes at
     98 bpm — which is the whole reason the Drift preset is in here. */
  var cycleNum = document.createElementNS(SVG_NS, 'text');
  cycleNum.setAttribute('class', 'eu-cycle-num');
  cycleNum.setAttribute('x', CENTER);
  cycleNum.setAttribute('y', CENTER - 2);
  cycleNum.setAttribute('text-anchor', 'middle');
  svg.appendChild(cycleNum);

  ['steps before the', 'rings line up again'].forEach(function (line, i) {
    var t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('class', 'eu-cycle-cap');
    t.setAttribute('x', CENTER);
    t.setAttribute('y', CENTER + 13 + i * 11);
    t.setAttribute('text-anchor', 'middle');
    t.textContent = line;
    svg.appendChild(t);
  });

  function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }

  function updateCycle() {
    var n = state.reduce(function (acc, t) {
      var len = t.pattern.length || 1;
      return acc / gcd(acc, len) * len;
    }, 1);
    cycleNum.textContent = n.toLocaleString('en-US');
  }

  /* Dots are rebuilt whenever a track's step count changes. */
  function layoutDots(track) {
    track.dots.forEach(function (d) { track.group.removeChild(d); });
    track.dots = [];
    track.lastDot = null;

    var n = track.pattern.length;
    var r = track.ringRadius;
    var dotR = Math.min(7, (2 * Math.PI * r / Math.max(n, 1)) * 0.36);

    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 - Math.PI / 2;
      var c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('class', 'eu-dot');
      c.setAttribute('cx', (CENTER + Math.cos(a) * r).toFixed(2));
      c.setAttribute('cy', (CENTER + Math.sin(a) * r).toFixed(2));
      c.setAttribute('r', dotR.toFixed(2));
      track.group.appendChild(c);
      track.dots.push(c);
    }
  }

  function paintDots(track) {
    track.dots.forEach(function (dot, i) {
      dot.classList.toggle('is-onset', !!track.pattern[i]);
    });
  }

  /* ------------------------------------------------------------------
     Recomputing a track from its three controls
     ------------------------------------------------------------------ */

  function recompute(track, relayout) {
    var steps = clamp(parseInt(track.stepsIn.value, 10) || 8, 2, MAX_STEPS);

    /* pulses and rotate are both bounded by the step count, so their
       ranges follow it rather than staying at 16. */
    track.pulsesIn.max = String(steps);
    track.rotateIn.max = String(Math.max(steps - 1, 0));

    var pulses = clamp(parseInt(track.pulsesIn.value, 10) || 0, 0, steps);
    var rot = clamp(parseInt(track.rotateIn.value, 10) || 0, 0, Math.max(steps - 1, 0));
    if (String(pulses) !== track.pulsesIn.value) track.pulsesIn.value = String(pulses);
    if (String(rot) !== track.rotateIn.value) track.rotateIn.value = String(rot);

    var changedLength = track.pattern.length !== steps;
    track.pattern = rotate(bjorklund(steps, pulses), rot);
    track.cursor = track.cursor % steps;

    track.stepsOut.textContent = String(steps);
    track.pulsesOut.textContent = String(pulses);
    track.rotateOut.textContent = String(rot);
    track.notationOut.textContent = 'E(' + pulses + ',' + steps + ')' +
      (rot ? ' ↻' + rot : '');
    track.patternOut.textContent = track.pattern
      .map(function (v) { return v ? 'x' : '·'; }).join('');

    if (relayout || changedLength) layoutDots(track);
    paintDots(track);
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function recomputeAll(relayout) {
    state.forEach(function (t) { recompute(t, relayout); });
    updateCycle();
  }

  /* ------------------------------------------------------------------
     Transport — lookahead scheduler, visuals drained on a rAF
     ------------------------------------------------------------------ */

  var LOOKAHEAD = 0.12;   /* seconds of audio scheduled in advance */
  var TICK_MS = 25;
  var timer = null;
  var frame = null;
  var playing = false;
  var nextStepTime = 0;
  var queue = [];

  function stepDuration() { return 60 / tempo() / 4; }   /* sixteenths */

  function schedule() {
    while (nextStepTime < ctx.currentTime + LOOKAHEAD) {
      state.forEach(function (track) {
        var n = track.pattern.length;
        if (!n) return;
        var i = track.cursor % n;
        var hit = !!track.pattern[i];
        if (hit && !track.muteIn.checked) VOICES[track.spec.id](nextStepTime);
        queue.push({ track: track, index: i, hit: hit, at: nextStepTime });
        track.cursor = (track.cursor + 1) % n;
      });
      nextStepTime += stepDuration();
    }
    /* A stalled tab can let the queue grow; keep only what's still ahead. */
    if (queue.length > 400) queue = queue.slice(-200);
  }

  function draw() {
    frame = requestAnimationFrame(draw);
    if (!ctx) return;
    var now = ctx.currentTime;

    while (queue.length && queue[0].at <= now) {
      var ev = queue.shift();
      var track = ev.track;
      var dot = track.dots[ev.index];
      if (track.lastDot && track.lastDot !== dot) {
        track.lastDot.classList.remove('is-cursor', 'is-hit');
        track.lastDot.classList.toggle('is-fade', !reduced.matches);
      }
      if (!dot) continue;
      dot.classList.remove('is-fade');
      dot.classList.add('is-cursor');
      if (ev.hit) dot.classList.add('is-hit');
      track.lastDot = dot;
    }
  }

  function clearCursors() {
    state.forEach(function (track) {
      if (track.lastDot) {
        track.lastDot.classList.remove('is-cursor', 'is-hit', 'is-fade');
        track.lastDot = null;
      }
    });
  }

  function start() {
    if (playing) return;
    if (!audio()) {
      playLabel.textContent = 'No audio';
      return;
    }
    if (ctx.state === 'suspended') ctx.resume();
    playing = true;
    queue = [];
    state.forEach(function (t) { t.cursor = 0; });
    nextStepTime = ctx.currentTime + 0.08;
    timer = setInterval(schedule, TICK_MS);
    schedule();
    if (!frame) frame = requestAnimationFrame(draw);
    playBtn.setAttribute('aria-pressed', 'true');
    playLabel.textContent = 'Stop';
  }

  function stop() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (frame) { cancelAnimationFrame(frame); frame = null; }
    queue = [];
    clearCursors();
    playBtn.setAttribute('aria-pressed', 'false');
    playLabel.textContent = 'Play';
  }

  playBtn.addEventListener('click', function () {
    if (playing) stop(); else start();
  });

  /* ------------------------------------------------------------------
     Control wiring
     ------------------------------------------------------------------ */

  state.forEach(function (track) {
    ['steps', 'pulses', 'rotate'].forEach(function (key) {
      track[key + 'In'].addEventListener('input', function () {
        recompute(track, false);
        updateCycle();
        if (presetIn.value !== 'custom') presetIn.value = 'custom';
      });
    });
    track.muteIn.addEventListener('change', function () {
      track.row.classList.toggle('is-muted', track.muteIn.checked);
    });
  });

  tempoIn.addEventListener('input', function () {
    tempoOut.textContent = tempo() + ' bpm';
  });

  volIn.addEventListener('input', function () {
    volOut.textContent = volIn.value + '%';
    if (master) master.gain.value = volume();
  });

  function applyPreset(name) {
    var preset = PRESETS[name];
    if (!preset) return;
    state.forEach(function (track, i) {
      track.stepsIn.value = String(preset[i][0]);
      track.pulsesIn.value = String(preset[i][1]);
      track.rotateIn.value = String(preset[i][2]);
    });
    recomputeAll(true);
  }

  presetIn.addEventListener('change', function () {
    if (presetIn.value === 'custom') return;
    applyPreset(presetIn.value);
  });

  randomBtn.addEventListener('click', function () {
    state.forEach(function (track, i) {
      var steps = 5 + Math.floor(Math.random() * 12);           /* 5..16 */
      var lo = i === 2 ? 0.35 : 0.15;                           /* hats denser */
      var pulses = Math.max(1, Math.round(steps * (lo + Math.random() * 0.35)));
      track.stepsIn.value = String(steps);
      track.pulsesIn.value = String(Math.min(pulses, steps));
      track.rotateIn.value = String(Math.floor(Math.random() * steps));
    });
    presetIn.value = 'custom';
    recomputeAll(true);
  });

  /* A hidden tab drumming away forever is rude; pause and leave the
     button showing the real state. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && playing) stop();
  });

  /* ------------------------------------------------------------------ */

  tempoOut.textContent = tempo() + ' bpm';
  volOut.textContent = volIn.value + '%';
  state.forEach(function (track) {
    track.row.style.setProperty('--eu-hue', track.spec.hue);
    track.row.classList.toggle('is-muted', track.muteIn.checked);
  });
  recomputeAll(true);
  root.classList.add('eu-ready');
})();

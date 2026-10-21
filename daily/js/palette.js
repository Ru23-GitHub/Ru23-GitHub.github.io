/* The Palette — his letter animation, scrubbable
   ----------------------------------------------------------------------
   Added 2026-10-21.

   Every number this file works from is declared once, in STOPS / DUR /
   STAGGER below, and those three are transcribed from css/intro.css in
   his repository: the seven stops of @keyframes gb-color, the 1.6s
   --char-dur they run over, and the 0.04s --char-stagger between
   letters. Nothing else here is a colour or a timing. The table in the
   markup is the same seven rows written out as the no-script fallback,
   and check() below compares the two and reports any drift, so the
   figures a visitor reads cannot quietly diverge from his file.

   What the rig reconstructs is a frame of his hero that nobody has ever
   actually looked at. On his page the whole sweep is over in 2.16
   seconds and it is also the first thing that happens, so the one state
   anyone has seen is the last one: fifteen letters, all #1733ff. Drag
   the slider and the intermediate frames exist.

   Two keyframes are reproduced, not one. gb-color gives each letter its
   colour; char-entry gives it its opacity (0 at 0%, 1 at 15%), and
   without that second curve the facsimile would show white letters at
   t=0 on a white plate — visible as a shape, when on his page they are
   not there yet. CSS interpolates legacy hex colours in sRGB, so the
   lerp below is a straight per-channel one on the 8-bit values.

   Play is only offered when the visitor has not asked for reduced
   motion. Under reduce, the button is never inserted and the six stop
   chips are the whole control surface — they jump, they do not animate.
   The slider is keyboard-operable either way, which is the reason the
   primary interaction here is a scrub rather than a playback. */
(function () {
  'use strict';

  var section = document.getElementById('palette');
  if (!section) return;

  var name = section.querySelector('[data-pl-name]');
  var scrub = section.querySelector('[data-pl-scrub]');
  var stopList = section.querySelector('[data-pl-stops]');
  var controls = section.querySelector('[data-pl-controls]');
  var read = section.querySelector('[data-pl-read]');
  if (!name || !scrub || !stopList || !controls || !read) return;

  /* css/intro.css, @keyframes gb-color */
  var STOPS = [
    { pc: 0,     hex: '#ffffff' },
    { pc: 13.52, hex: '#ff3dee' },
    { pc: 37.04, hex: '#f96e09' },
    { pc: 48.82, hex: '#f9fa2d' },
    { pc: 66.48, hex: '#07f905' },
    { pc: 90,    hex: '#05f9f7' },
    { pc: 100,   hex: '#1733ff' }
  ];
  var DUR = 1600;      /* --char-dur: 1.6s   */
  var STAGGER = 40;    /* --char-stagger: .04s */
  var FADE_PC = 15;    /* char-entry: opacity 0 -> 1 across the first 15% */

  var TEXT = 'RUSLAN MANOHARAN';

  var reduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  /* ---------- colour ---------- */

  function rgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function hex2(n) {
    var s = Math.round(n).toString(16);
    return s.length === 1 ? '0' + s : s;
  }

  /* The colour a letter is showing at `pc` per cent through its own run. */
  function colourAt(pc) {
    if (pc <= STOPS[0].pc) return STOPS[0].hex;
    for (var i = 1; i < STOPS.length; i++) {
      if (pc <= STOPS[i].pc) {
        var a = STOPS[i - 1];
        var b = STOPS[i];
        var t = (pc - a.pc) / (b.pc - a.pc);
        var ca = rgb(a.hex);
        var cb = rgb(b.hex);
        return '#' + hex2(ca[0] + (cb[0] - ca[0]) * t) +
                     hex2(ca[1] + (cb[1] - ca[1]) * t) +
                     hex2(ca[2] + (cb[2] - ca[2]) * t);
      }
    }
    return STOPS[STOPS.length - 1].hex;
  }

  /* ---------- the facsimile ---------- */

  var chars = [];   /* { el, delay } per letter, in his sequence order */

  (function build() {
    /* Letters are grouped a word at a time. The facsimile has to be able
       to wrap on a 390px screen, and a flat row of fifteen spans wraps
       wherever it runs out of room — which on his surname put the final N
       on a line of its own. Words wrap; letters do not. */
    name.textContent = '';
    var seq = 0;
    var word = null;
    for (var i = 0; i < TEXT.length; i++) {
      var ch = TEXT[i];
      if (ch === ' ') { word = null; continue; }
      if (!word) {
        word = document.createElement('span');
        word.className = 'pl-word';
        name.appendChild(word);
      }
      var el = document.createElement('span');
      el.className = 'pl-ch';
      el.textContent = ch;
      word.appendChild(el);
      chars.push({ el: el, delay: seq * STAGGER });
      seq++;
    }
  })();

  var SWEEP = DUR + (chars.length - 1) * STAGGER;   /* 2160ms */

  var t = 780;   /* mid-sweep, so the rig opens on a frame worth seeing */

  function paint() {
    var lit = 0;
    for (var i = 0; i < chars.length; i++) {
      var c = chars[i];
      var local = t - c.delay;
      var pc = local <= 0 ? 0 : Math.min(100, (local / DUR) * 100);
      var op = local <= 0 ? 0 : Math.min(1, pc / FADE_PC);
      c.el.style.color = colourAt(pc);
      c.el.style.opacity = op;
      if (op > 0) lit++;
    }

    var first = colourAt(Math.min(100, Math.max(0, (t / DUR) * 100)));
    var lastLocal = t - chars[chars.length - 1].delay;
    var last = colourAt(lastLocal <= 0 ? 0 : Math.min(100, (lastLocal / DUR) * 100));

    read.innerHTML = '';
    read.appendChild(txt('t = ' + (t / 1000).toFixed(3) + 's'));
    read.appendChild(chip('first R is', first, lastLocal <= 0));
    read.appendChild(chip('last N is', last, lastLocal <= 0));
    read.appendChild(txt(lit + ' of ' + chars.length + ' letters visible'));

    scrub.value = String(t);
    scrub.setAttribute('aria-valuetext', (t / 1000).toFixed(2) + ' seconds');

    [].forEach.call(stopList.querySelectorAll('[data-pl-at]'), function (b) {
      b.setAttribute('aria-current', Math.abs(Number(b.getAttribute('data-pl-at')) - t) < 6 ? 'true' : 'false');
    });
  }

  function txt(s) {
    var span = document.createElement('span');
    span.textContent = s;
    return span;
  }

  function chip(label, hex, notYet) {
    var span = document.createElement('span');
    span.className = 'pl-chip';
    var dab = document.createElement('span');
    dab.className = 'pl-dab';
    dab.style.background = hex;
    span.appendChild(dab);
    var b = document.createElement('b');
    b.textContent = notYet && label.indexOf('last') === 0 ? 'not started yet' : hex;
    span.appendChild(txt(label + ' '));
    span.appendChild(b);
    return span;
  }

  function seek(ms) {
    t = Math.max(0, Math.min(SWEEP, Math.round(ms)));
    paint();
  }

  /* ---------- controls ---------- */

  scrub.min = '0';
  scrub.max = String(SWEEP);
  scrub.step = '10';
  scrub.addEventListener('input', function () { seek(Number(scrub.value)); });

  /* One chip per stop, at the moment the FIRST letter reaches it — which
     is also the only moment any letter is exactly that colour on its own
     clock, since all fifteen run the same curve offset in time. */
  STOPS.forEach(function (s) {
    var at = Math.round((s.pc / 100) * DUR);
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pl-stop';
    b.setAttribute('data-pl-at', String(at));
    b.setAttribute('aria-current', 'false');
    var dab = document.createElement('span');
    dab.className = 'pl-dab';
    dab.style.background = s.hex;
    b.appendChild(dab);
    b.appendChild(txt(s.hex));
    var pc = document.createElement('span');
    pc.className = 'pl-pc';
    pc.textContent = s.pc + '%';
    b.appendChild(pc);
    b.addEventListener('click', function () { seek(at); });
    li.appendChild(b);
    stopList.appendChild(li);
  });

  if (!reduced) {
    var row = document.createElement('p');
    row.className = 'pl-row';
    var play = document.createElement('button');
    play.type = 'button';
    play.className = 'panel-btn';
    var dot = document.createElement('span');
    dot.className = 'panel-dot';
    dot.setAttribute('aria-hidden', 'true');
    var plabel = document.createElement('span');
    plabel.textContent = 'Play the sweep';
    play.appendChild(dot);
    play.appendChild(plabel);
    play.setAttribute('aria-pressed', 'false');
    row.appendChild(play);
    (section.querySelector('[data-pl-playrow]') || controls).appendChild(row);

    var raf = 0;
    var t0 = 0;

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      play.setAttribute('aria-pressed', 'false');
      plabel.textContent = 'Play the sweep';
    }

    function frame(now) {
      var elapsed = now - t0;
      if (elapsed >= SWEEP) { seek(SWEEP); stop(); return; }
      seek(elapsed);
      raf = requestAnimationFrame(frame);
    }

    play.addEventListener('click', function () {
      if (raf) { stop(); return; }
      play.setAttribute('aria-pressed', 'true');
      plabel.textContent = 'Stop';
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    });

    /* Grabbing the slider mid-playback takes over rather than fighting it. */
    scrub.addEventListener('pointerdown', stop);
    scrub.addEventListener('keydown', stop);
  }

  controls.hidden = false;
  paint();

  /* ---------- audit ----------
     The markup's fallback table holds the same seven stops. If the two
     ever disagree the page is telling a visitor two different things
     about his file, so say so here rather than assert it and break. */
  window.__palette = {
    stops: function () {
      return STOPS.map(function (s) {
        return { pc: s.pc, ms: +((s.pc / 100) * DUR).toFixed(2), hex: s.hex };
      });
    },
    frame: function (ms) {
      var saved = t;
      seek(ms);
      var out = chars.map(function (c) { return { ch: c.el.textContent, color: c.el.style.color, opacity: c.el.style.opacity }; });
      seek(saved);
      return out;
    },
    check: function () {
      var rows = [].slice.call(section.querySelectorAll('[data-pl-row]'));
      var drift = [];
      rows.forEach(function (tr, i) {
        var s = STOPS[i];
        if (!s) { drift.push({ row: i, why: 'no matching stop' }); return; }
        var hex = (tr.getAttribute('data-pl-hex') || '').toLowerCase();
        var pc = Number(tr.getAttribute('data-pl-pc'));
        if (hex !== s.hex) drift.push({ row: i, why: 'hex', markup: hex, script: s.hex });
        if (pc !== s.pc) drift.push({ row: i, why: 'percent', markup: pc, script: s.pc });
      });
      if (rows.length !== STOPS.length) drift.push({ why: 'row count', markup: rows.length, script: STOPS.length });
      return { ok: drift.length === 0, sweep: SWEEP, letters: chars.length, drift: drift };
    }
  };
})();

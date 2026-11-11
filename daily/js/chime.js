/* The Chime — booting his name, on his own choreography
   ----------------------------------------------------------------------
   Added 2026-11-11. Finding 13.

   This file keeps no copy of his hero. Everything it needs it takes from
   what the page has already loaded:

     - the four timings, off the computed value of the custom properties
       he declares on #hero: --title-delay, --char-dur, --char-stagger
       and --shine-delay
     - the seven colours, by walking document.styleSheets for his
       @keyframes gb-color and reading the stops out of it
     - the text, off the data-text attribute of his own hero word
     - the horizontal entry offsets, from the same array and the same
       fallback arithmetic his js/intro.js uses

   The motion itself is not reimplemented at all: .ch-char carries
   animation-name: char-entry, gb-color — his keyframes, by name, from
   css/intro.css. This file only sets each character's duration and
   delay, and seeks by putting a negative delay on a paused animation.
   So the boot on that screen is his boot, and if he changes his hero
   tomorrow this changes with it.

   If the keyframes cannot be read — a browser that refuses cssRules, a
   stylesheet that did not land — the seven swatches and the colour half
   of the readout are left out rather than guessed. The boot still runs:
   it is CSS, and it does not need this file to be right about anything.

   window.__chime.audit() prints what was read and what was assumed. */

(function () {
  'use strict';

  var root = document.getElementById('chime');
  if (!root) return;

  var rig     = root.querySelector('[data-ch-rig]');
  var screen  = root.querySelector('[data-ch-screen]');
  var word    = root.querySelector('[data-ch-word]');
  var gleam   = root.querySelector('[data-ch-gleam]');
  var chime   = root.querySelector('[data-ch-chime]');
  var bootBtn = root.querySelector('[data-ch-boot]');
  var scrub   = root.querySelector('[data-ch-scrub]');
  var clock   = root.querySelector('[data-ch-t]');
  var read    = root.querySelector('[data-ch-read]');
  var swatch  = root.querySelector('[data-ch-swatches]');
  var nojs    = root.querySelector('[data-ch-nojs]');

  if (!rig || !screen || !word || !gleam || !bootBtn || !scrub) return;

  /* ---------- 1. his timings ---------- */

  /* Seconds out of a CSS time. His are written as "1.6s" and ".04s". */
  function secs(v, fallback) {
    if (!v) return fallback;
    v = String(v).trim();
    var n = parseFloat(v);
    if (!isFinite(n)) return fallback;
    return /ms$/.test(v) ? n / 1000 : n;
  }

  var hero = document.getElementById('hero');
  var T = { titleDelay: 0, charDur: 1.6, stagger: 0.04, shineDelay: 2.2 };
  var readTimings = false;

  if (hero) {
    var hs = window.getComputedStyle(hero);
    var td = secs(hs.getPropertyValue('--title-delay'), null);
    var cd = secs(hs.getPropertyValue('--char-dur'), null);
    var st = secs(hs.getPropertyValue('--char-stagger'), null);
    var sd = secs(hs.getPropertyValue('--shine-delay'), null);
    if (cd !== null && st !== null) {
      T.titleDelay = td === null ? 0 : td;
      T.charDur = cd;
      T.stagger = st;
      if (sd !== null) T.shineDelay = sd;
      readTimings = true;
    }
  }

  /* The gleam's own duration is the one number in his hero this file
     cannot read as a custom property — it is written into the shorthand
     of #hero .shine, which is 1.8s. It is in the stylesheet below as the
     same 1.8s, and the provenance note says it is transcribed. */
  var GLEAM_DUR = 1.8;

  /* ---------- 2. his seven colours ---------- */

  /* Walks the loaded stylesheets for @keyframes gb-color and returns
     [{at: 0..1, color: "rgb(...)"}]. Returns null on anything unexpected,
     including the SecurityError a cross-origin sheet throws on
     cssRules — his are same-origin, but this must not throw. */
  function readStops(name) {
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      var rules;
      try { rules = sheets[i].cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (var j = 0; j < rules.length; j++) {
        var r = rules[j];
        /* 7 === CSSRule.KEYFRAMES_RULE; compared numerically because the
           constant is unreliable on older WebKit. */
        if (r.type !== 7 || r.name !== name) continue;
        var out = [];
        for (var k = 0; k < r.cssRules.length; k++) {
          var kf = r.cssRules[k];
          var at = parseFloat(kf.keyText);
          var col = kf.style && kf.style.color;
          if (!isFinite(at) || !col) continue;
          out.push({ at: at / 100, color: col });
        }
        if (out.length < 2) return null;
        out.sort(function (a, b) { return a.at - b.at; });
        return out;
      }
    }
    return null;
  }

  var stops = readStops('gb-color');

  /* A hex spelling for the labels. His keyframes are authored in hex and
     come back from cssRules as rgb() in most engines, so this converts
     rather than assumes either way. */
  function hex(c) {
    var m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(c);
    if (!m) return /^#/.test(c) ? c.toLowerCase() : c;
    var s = '#';
    for (var i = 1; i <= 3; i++) {
      var h = Math.round(parseFloat(m[i])).toString(16);
      s += h.length === 1 ? '0' + h : h;
    }
    return s;
  }

  /* ---------- 3. his text and his offsets ---------- */

  var heroWord = document.getElementById('gb');
  var text = (heroWord && (heroWord.getAttribute('data-text') || '').trim()) || 'RUSLAN MANOHARAN';

  /* His array, from js/intro.js, and his fallback for everything past it.
     It carries seven entries for sixteen characters. */
  var OFFSETS = [-3.5, -2.8, -1.2, -1.2, -1.2, -1.2, 2.8];

  var compactLen = text.split(' ').join('').length;

  /* ---------- 4. build the screen ---------- */

  var chars = [];

  function build() {
    word.textContent = '';
    chars = [];
    var frag = document.createDocumentFragment();
    var seq = 0;

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === ' ') {
        var sp = document.createElement('span');
        sp.className = 'ch-space';
        sp.innerHTML = '&nbsp;';
        frag.appendChild(sp);
        continue;
      }
      var el = document.createElement('span');
      el.className = 'ch-char';
      var ox = OFFSETS[seq] !== undefined
        ? OFFSETS[seq]
        : (seq - (compactLen - 1) / 2) * 0.35;
      var start = T.titleDelay + seq * T.stagger;
      el.style.setProperty('--ox', ox + 'em');
      el.style.animationDuration = T.charDur + 's';
      /* His stagger, as a real animation-delay. Because the delay is part
         of an animation's own timeline, one global boot time then maps
         straight onto every character's currentTime with no arithmetic
         per character. */
      el.style.animationDelay = start + 's';
      el.textContent = ch;
      frag.appendChild(el);
      chars.push({ el: el, start: start, end: start + T.charDur });
      seq++;
    }

    word.appendChild(frag);
    gleam.style.animationDuration = GLEAM_DUR + 's';
    gleam.style.animationDelay = T.shineDelay + 's';
  }

  var total = 0;

  function computeTotal() {
    var lastChar = chars.length
      ? chars[chars.length - 1].start + T.charDur
      : T.charDur;
    return Math.max(lastChar, T.shineDelay + GLEAM_DUR);
  }

  /* ---------- 5. fitting ---------- */

  /* His hero scales his name to the box it is in rather than wrapping it
     — js/intro.js does it with fitToViewport(), because the name is one
     unbreakable line. This screen is 460px at its widest and 351px on a
     390px phone, so it needs the same treatment or the last letters of
     his surname are simply clipped off. Measured at rest, scaled down,
     never up. */
  var scale = 1;

  function fit() {
    scale = 1;
    word.style.transform = 'translate(-50%,-50%) scale(1)';

    /* Measure the finished state: at rest every character sits at
       translate(0,0) and scale 1, so the line box is its natural width.
       Mid-flight it is three and a half times the size and off to one
       side, which would measure nothing useful. */
    for (var i = 0; i < chars.length; i++) place(chars[i], chars[i].end);

    var avail = screen.clientWidth - 24;
    var natural = word.getBoundingClientRect().width;
    if (natural > 0 && avail > 0 && natural > avail) {
      scale = avail / natural;
    }
    word.style.transform = 'translate(-50%,-50%) scale(' + scale + ')';
  }

  /* ---------- 6. seeking ---------- */

  /* Seeking is done on the animation objects themselves. The frames are
     still his — these are the CSSAnimations the stylesheet started from
     his char-entry and gb-color — and setting currentTime on a paused
     one lands on a real frame of his rather than on an interpolation of
     mine. Where getAnimations() is missing, the fallback is a negative
     delay on a paused animation, which does the same thing less exactly:
     it does not reposition an animation that has already finished, so
     the colour can lag a seek made after a completed boot. */
  function place(c, t) {
    /* currentTime is measured from the start of the animation's own delay,
       so the clamp is to that character's window on the boot clock: before
       it, fill-mode holds his 0% frame; after it, his 100%. */
    var at = Math.max(0, Math.min(t, c.end));
    var list = c.el.getAnimations ? c.el.getAnimations() : null;
    if (list && list.length) {
      for (var i = 0; i < list.length; i++) {
        try {
          list[i].pause();
          list[i].currentTime = at * 1000;
        } catch (e) { /* ignore an animation that refuses to be seeked */ }
      }
      return;
    }
    /* No Web Animations API: a negative delay on a paused animation shows
       the same frame, give or take an engine that will not reposition one
       that has already finished. */
    c.el.style.animationPlayState = 'paused';
    c.el.style.animationDelay = (c.start - t) + 's';
  }

  function seek(t) {
    for (var i = 0; i < chars.length; i++) place(chars[i], t);

    var gEnd = T.shineDelay + GLEAM_DUR;
    var gAt = Math.max(0, Math.min(t, gEnd));
    var gl = gleam.getAnimations ? gleam.getAnimations() : null;
    if (gl && gl.length) {
      for (var j = 0; j < gl.length; j++) {
        try { gl[j].pause(); gl[j].currentTime = gAt * 1000; } catch (e) {}
      }
    } else {
      gleam.style.animationPlayState = 'paused';
      gleam.style.animationDelay = (T.shineDelay - t) + 's';
    }
    /* It is only on the screen while it is crossing it. */
    gleam.style.visibility = (t >= T.shineDelay && t <= gEnd) ? '' : 'hidden';

    paintReadout(t);
  }

  function play() {
    /* Rebuilt rather than rewound, so a second press starts the boot from
       nothing instead of continuing a finished one. */
    build();
    fit();
    void word.offsetWidth;
    for (var i = 0; i < chars.length; i++) {
      var el = chars[i].el;
      el.style.animationPlayState = 'running';
      var list = el.getAnimations ? el.getAnimations() : null;
      if (list) {
        for (var j = 0; j < list.length; j++) {
          try { list[j].currentTime = 0; list[j].play(); } catch (e) {}
        }
      }
    }
    gleam.style.visibility = '';
    gleam.style.animationPlayState = 'running';
    var gl = gleam.getAnimations ? gleam.getAnimations() : null;
    if (gl) {
      for (var k = 0; k < gl.length; k++) {
        try { gl[k].currentTime = 0; gl[k].play(); } catch (e) {}
      }
    }
  }

  /* ---------- 7. the readout ---------- */

  function colorAt(tLocal) {
    if (!stops) return null;
    var p = tLocal / T.charDur;
    if (p <= stops[0].at) return stops[0];
    if (p >= stops[stops.length - 1].at) return stops[stops.length - 1];
    for (var i = stops.length - 1; i >= 0; i--) {
      if (p >= stops[i].at) return stops[i];
    }
    return stops[0];
  }

  function ms(t) { return Math.round(t * 1000); }

  function paintReadout(t) {
    if (clock) clock.textContent = ms(t) + 'ms';

    var arrived = 0;
    for (var i = 0; i < chars.length; i++) {
      if (t >= chars[i].start + T.charDur) arrived++;
    }
    var moving = 0;
    for (var j = 0; j < chars.length; j++) {
      if (t >= chars[j].start && t < chars[j].start + T.charDur) moving++;
    }

    /* Which of his seven the first character is passing through. */
    var sw = null;
    if (chars.length) {
      var local = t - chars[0].start;
      if (local >= 0) sw = colorAt(Math.min(local, T.charDur));
    }
    markSwatch(sw);

    var done = t >= total - 0.001;
    if (chime) {
      if (done) chime.setAttribute('data-on', '');
      else chime.removeAttribute('data-on');
    }

    if (!read) return;

    var bits = [];
    if (t <= 0) {
      bits.push('<strong>Nothing yet.</strong> His hero is one link and the link is his name; this is the screen before it arrives.');
    } else if (moving) {
      bits.push('<strong>' + moving + (moving === 1 ? ' letter' : ' letters') + ' in flight</strong>, ' + arrived + ' landed.');
      if (sw) bits.push('The first one is passing through <code>' + hex(sw.color) + '</code>.');
    } else if (t < T.shineDelay) {
      bits.push('<strong>All ' + arrived + ' landed</strong> at ' + ms(chars[chars.length - 1].start + T.charDur) + 'ms, every one of them on <code>' + (stops ? hex(stops[stops.length - 1].color) : '#1733ff') + '</code>.');
      bits.push('The gleam has not started.');
    } else if (!done) {
      bits.push('<strong>The gleam is crossing.</strong> It starts at ' + ms(T.shineDelay) + 'ms and takes ' + ms(GLEAM_DUR) + 'ms &mdash; longer than any single letter&rsquo;s whole entry.');
    } else {
      bits.push('<strong>Booted</strong>, at ' + ms(total) + 'ms. This is what sits behind his name, and what you get for clicking it is the sound of a Game&nbsp;Boy Advance doing the same thing.');
    }
    read.innerHTML = bits.join(' ');
  }

  /* ---------- 7. the seven swatches ---------- */

  var swEls = [];

  function buildSwatches() {
    if (!swatch || !stops) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < stops.length; i++) {
      var li = document.createElement('li');
      li.className = 'ch-sw';
      var dot = document.createElement('b');
      dot.style.background = stops[i].color;
      var lab = document.createElement('span');
      lab.textContent = hex(stops[i].color);
      var at = document.createElement('i');
      at.textContent = ms(stops[i].at * T.charDur) + 'ms';
      li.appendChild(dot);
      li.appendChild(lab);
      li.appendChild(at);
      frag.appendChild(li);
      swEls.push(li);
    }
    swatch.appendChild(frag);
  }

  function markSwatch(stop) {
    if (!swEls.length) return;
    for (var i = 0; i < swEls.length; i++) {
      if (stops[i] === stop) swEls[i].setAttribute('data-now', '');
      else swEls[i].removeAttribute('data-now');
    }
  }

  /* ---------- 8. wiring ---------- */

  build();
  total = computeTotal();
  buildSwatches();

  scrub.min = 0;
  scrub.max = String(ms(total));
  scrub.step = '10';
  scrub.value = '0';

  /* The rig is still hidden here, so the screen has no width yet and
     fit() would divide by nothing. It is unhidden at the foot of this
     file and fitted immediately after. */
  seek(0);

  var raf = 0;

  function followPlayback(endAt) {
    cancelAnimationFrame(raf);
    var t0 = performance.now();
    (function tick() {
      var t = (performance.now() - t0) / 1000;
      if (t > endAt) t = endAt;
      scrub.value = String(ms(t));
      paintReadout(t);
      if (t < endAt) raf = requestAnimationFrame(tick);
    })();
  }

  var reduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  bootBtn.addEventListener('click', function () {
    cancelAnimationFrame(raf);
    if (reduced && reduced.matches) {
      /* Nothing moves. Put it in its finished state and say so. */
      scrub.value = String(ms(total));
      seek(total);
      return;
    }
    play();
    followPlayback(total);
  });

  scrub.addEventListener('input', function () {
    cancelAnimationFrame(raf);
    seek(parseFloat(scrub.value) / 1000);
  });

  /* The rig was hidden in the markup with a static paragraph beside it.
     Swapping the two is this file's last act, so nothing is shown before
     it is built. */
  rig.hidden = false;
  if (nojs) nojs.hidden = true;

  /* Now that the screen has a width, scale his name to it and put the
     boot back where it was. The font arriving changes the measurement, so
     this waits for it as his own hero does; the ResizeObserver covers a
     rotation and a window drag. */
  function refit() {
    var at = parseFloat(scrub.value) / 1000;
    fit();
    seek(at);
  }

  refit();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refit, function () {});
  }

  if (window.ResizeObserver) {
    var settle;
    new ResizeObserver(function () {
      clearTimeout(settle);
      settle = setTimeout(refit, 90);
    }).observe(screen);
  } else {
    window.addEventListener('resize', refit);
  }

  /* ---------- 9. audit ---------- */

  window.__chime = {
    audit: function () {
      return {
        text: text,
        characters: chars.length,
        offsetsGivenByHim: OFFSETS.length,
        offsetsComputed: Math.max(0, compactLen - OFFSETS.length),
        timingsReadFromHisHero: readTimings,
        timings: {
          titleDelay: T.titleDelay,
          charDur: T.charDur,
          stagger: T.stagger,
          shineDelay: T.shineDelay,
          gleamDurTranscribed: GLEAM_DUR
        },
        keyframesRead: !!stops,
        nameScaledToScreen: scale,
        colours: stops ? stops.map(function (s) {
          return { at: s.at, ms: ms(s.at * T.charDur), color: hex(s.color) };
        }) : null,
        totalMs: ms(total)
      };
    }
  };
})();

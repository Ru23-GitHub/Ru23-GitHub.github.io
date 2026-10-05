/* Horologium — five clocks that disagree
   ======================================================================
   Added 2026-10-05. Everything here is computed from the visitor's system
   clock. No network, no timezone database, no dependencies.

   The point is that "what time is it" has had wildly different answers,
   and most of them were not worse — just differently chosen. A Roman hour
   was a twelfth of *daylight*, so it got longer in summer and shorter in
   winter and a clock that ticked evenly would have been the broken one.

   Sun times use the NOAA solar position algorithm (good to about a
   minute). Mars time follows Allison & McEwen's formulation, the same one
   JPL uses to put rover teams on Mars time.
*/
(function () {
  'use strict';

  var root = document.getElementById('horologium');
  if (!root) return;

  var out = {};
  Array.prototype.forEach.call(root.querySelectorAll('[data-clock]'), function (el) {
    out[el.getAttribute('data-clock')] = el;
  });

  function pad(n, w) {
    n = String(Math.floor(n));
    while (n.length < (w || 2)) n = '0' + n;
    return n;
  }

  /* ---------- 1. Roman seasonal hours ------------------------------
     Twelve hours between sunrise and sunset, whatever that is today.
     Seattle, because that's where Ruslan is. */

  var LAT = 47.6062, LON = -122.3321;   /* lon positive east */
  var RAD = Math.PI / 180;

  /* NOAA: returns {sunrise, sunset} in minutes after UTC midnight, or
     null on a polar day/night where the acos has no solution. */
  function sunTimes(date) {
    var start = Date.UTC(date.getUTCFullYear(), 0, 0);
    var day = (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000;
    var g = 2 * Math.PI / 365 * (day - 1 + 0.5);

    var eq = 229.18 * (0.000075
      + 0.001868 * Math.cos(g)   - 0.032077 * Math.sin(g)
      - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));

    var decl = 0.006918
      - 0.399912 * Math.cos(g)     + 0.070257 * Math.sin(g)
      - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
      - 0.002697 * Math.cos(3 * g) + 0.001480 * Math.sin(3 * g);

    var cosHA = Math.cos(90.833 * RAD) / (Math.cos(LAT * RAD) * Math.cos(decl))
              - Math.tan(LAT * RAD) * Math.tan(decl);
    if (cosHA > 1 || cosHA < -1) return null;

    var ha = Math.acos(cosHA) / RAD;
    return {
      sunrise: 720 - 4 * (LON * -1 + ha) - eq,
      sunset:  720 - 4 * (LON * -1 - ha) - eq
    };
  }

  function roman(now) {
    var t = sunTimes(now);
    if (!t) return { time: '—', note: 'The sun does not cooperate at this latitude today.' };

    var minsUTC = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
    var dayLen = t.sunset - t.sunrise;
    var hourLen = dayLen / 12;

    if (minsUTC < t.sunrise || minsUTC >= t.sunset) {
      /* Night was also twelve hours, just the other twelve. */
      var nightLen = 1440 - dayLen;
      var nHourLen = nightLen / 12;
      var since = minsUTC < t.sunrise ? minsUTC + (1440 - t.sunset) : minsUTC - t.sunset;
      var nh = Math.floor(since / nHourLen) + 1;
      return {
        time: 'Nox ' + Math.min(nh, 12),
        note: 'Night hour ' + Math.min(nh, 12) + ' of 12 · each one ' + Math.round(nHourLen) + ' minutes long'
      };
    }

    var h = Math.floor((minsUTC - t.sunrise) / hourLen) + 1;
    return {
      time: 'Hora ' + Math.min(h, 12),
      note: 'Daylight hour ' + Math.min(h, 12) + ' of 12 · each one ' + Math.round(hourLen) + ' minutes long today'
    };
  }

  /* ---------- 2. French Revolutionary decimal time ------------------
     Ten hours a day, a hundred minutes each, a hundred seconds each.
     Legally mandated in 1794, abandoned after seventeen months. */

  function decimal(now) {
    var secsLocal = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
    var frac = secsLocal / 86400;
    var dh = Math.floor(frac * 10);
    var dm = Math.floor(frac * 1000) % 100;
    var ds = Math.floor(frac * 100000) % 100;
    return {
      time: dh + ':' + pad(dm) + ':' + pad(ds),
      note: 'A decimal second is 0.864 of yours · in force 1794–1795'
    };
  }

  /* ---------- 3. Swatch Internet Time -------------------------------
     1000 .beats a day, no timezones, all of it on Biel Mean Time. */

  function beats(now) {
    var bmt = (now.getTime() + 3600000) % 86400000;   /* UTC+1 */
    var b = bmt / 86400;
    return {
      time: '@' + pad(Math.floor(b), 3) + '.' + pad(Math.floor(b * 100) % 100),
      note: 'One beat is 1 min 26.4 s · no timezones, everywhere at once'
    };
  }

  /* ---------- 4. Mars, at Jezero crater -----------------------------
     Allison & McEwen (2000). A sol is 24h 39m 35.244s, so Mars time
     slips about 40 minutes a day against Earth time — which is why rover
     teams on Mars time drift through their own nights. */

  var JEZERO_W = 282.55;   /* 77.45 E expressed as west longitude */

  function mars(now) {
    var jdUT = 2440587.5 + now.getTime() / 86400000;
    var jdTT = jdUT + (32.184 + 37) / 86400;
    var dJ2000 = jdTT - 2451545.0;
    var msd = (dJ2000 - 4.5) / 1.027491252 + 44796.0 - 0.00096;
    var mtc = (msd % 1) * 24;
    var lmst = (mtc - JEZERO_W * 24 / 360 + 24) % 24;
    var h = Math.floor(lmst), m = Math.floor((lmst - h) * 60), s = Math.floor(((lmst - h) * 60 - m) * 60);
    return {
      time: pad(h) + ':' + pad(m) + ':' + pad(s),
      note: 'Sol ' + Math.floor(msd).toLocaleString('en-US') + ' · a sol runs 39m 35s longer than a day'
    };
  }

  /* ---------- 5. Unix epoch ----------------------------------------- */

  var Y2038 = 2147483647;

  function unix(now) {
    var s = Math.floor(now.getTime() / 1000);
    var left = Y2038 - s;
    var years = left / 31557600;
    return {
      time: String(s),
      note: 'Seconds since 1970 · a signed 32-bit counter overflows in ' + years.toFixed(2) + ' years'
    };
  }

  /* ------------------------------------------------------------------ */

  var CLOCKS = { roman: roman, decimal: decimal, beats: beats, mars: mars, unix: unix };

  function tick() {
    var now = new Date();
    for (var key in CLOCKS) {
      if (!out[key]) continue;
      var r = CLOCKS[key](now);
      var timeEl = out[key].querySelector('[data-time]');
      var noteEl = out[key].querySelector('[data-note]');
      if (timeEl && timeEl.textContent !== r.time) timeEl.textContent = r.time;
      if (noteEl && noteEl.textContent !== r.note) noteEl.textContent = r.note;
    }
  }

  tick();

  /* Ten a second so decimal seconds move smoothly; stopped entirely when
     the tab is hidden or the section is off screen, since nobody is
     reading a clock they cannot see. */
  var timer = null;
  function start() { if (!timer) timer = setInterval(tick, 100); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  if (window.Daily && window.Daily.whenVisible) {
    window.Daily.whenVisible(root, {
      start: function () { tick(); start(); },
      stop: stop
    });
  } else {
    start();
  }

  root.classList.add('hr-ready');
})();

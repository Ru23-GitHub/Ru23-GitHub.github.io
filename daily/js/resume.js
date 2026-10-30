/* The Resume Is The One Thing He Didn't Commit — the first night
   ----------------------------------------------------------------------
   Added 2026-10-30.

   Two jobs, and the first one is not about this section.

   1. Every [data-since] span on the page gets a live elapsed figure.
      Two sections now print one — the cooking question's age in The
      Smaller Word, and the age of the resume link down here — and a
      day-count typed into HTML is wrong by one the following morning.
      The fallback text in the span is a true floor ("three weeks"), so
      with this file deleted both sentences still read and neither lies.
      This runs before anything else below, and before any of the
      assertions, so a failed assertion cannot take it down with it.

   2. The scrubber: a reconstruction of 23 July 2026, 20:28:36 to
      22:28:47 Pacific — the hundred and twenty minutes in which his
      portfolio came into existence — with a replica of his resume
      button showing what it pointed at at the scrubbed second.

   The clock is arithmetic on a wall-clock string, not a Date. The
   figures below are his timestamps in his own timezone, and running them
   through the visitor's clock would print Seattle's evening in Berlin's
   morning for no gain. The one place a real Date is used is the age of
   the current link, which is an actual elapsed interval and is computed
   from an instant carrying its offset.

   Nothing here is typed twice. The three spans, the tick positions and
   the character comparison are all derived from COMMITS and the two
   identifiers, and check() asserts the derived figures against the ones
   the prose beside them states. If any assertion fails the rig stays
   hidden and the section is prose, a bar chart's worth of nothing, and
   his live resume link — which is in the HTML, outside the rig, and is
   never touched by this file. */
(function () {
  'use strict';

  /* ---------- 1. the elapsed figures ---------- */

  var DAY = 86400000;

  function daysSince(iso) {
    var then = new Date(iso + 'T00:00:00Z').getTime();
    if (!isFinite(then)) return null;
    var d = Math.floor((Date.now() - then) / DAY);
    return d >= 0 ? d : null;
  }

  [].slice.call(document.querySelectorAll('[data-since]')).forEach(function (el) {
    var d = daysSince(el.getAttribute('data-since'));
    if (d === null) return;
    el.textContent = d + (d === 1 ? ' day' : ' days');
  });

  /* ---------- 2. the rig ---------- */

  var sec = document.getElementById('resume');
  if (!sec) return;

  var rig = sec.querySelector('[data-rs-rig]');
  var slider = sec.querySelector('[data-rs-slider]');
  if (!rig || !slider) return;

  /* His first night, read out of the repository. Offsets are seconds
     from the first commit; `href` is what the resume button pointed at
     once that commit had landed. */
  var START = { y: 2026, mon: 'July', d: 23, dow: 'Thursday', h: 20, m: 28, s: 36, tz: 'PDT' };

  var DEAD = '#';
  var ID_ONE = '1P4Ve9u1j2RIx--SmgGF2003jzNQ8CaOD';
  var ID_TWO = '1zDf8V-q-Hk6oZ-e-LbQXCuTxDTC65SUV';

  var COMMITS = [
    { t: 0,    sha: 'f3c3691', subject: 'Initial portfolio site: GBA-style intro, About, and Contact sections', href: DEAD },
    { t: 210,  sha: '66c0d32', subject: 'Simplify page chrome: drop nav bar and section kickers',              href: DEAD },
    { t: 3624, sha: '54d5642', subject: 'Fill in real content, fix mobile letter clipping, polish hero details', href: ID_ONE },
    { t: 3833, sha: '3f9e4a2', subject: 'Use "Email" as link text instead of the raw address',                 href: ID_ONE },
    { t: 6408, sha: 'aeb5751', subject: 'Update index.html new resume link',                                   href: ID_TWO },
    { t: 7211, sha: 'a9ea381', subject: 'Fill in About section skills list',                                   href: ID_TWO }
  ];

  var NIGHT = COMMITS[COMMITS.length - 1].t;

  /* The instant the current link landed, with its offset on it, because
     this one is measured against the visitor's actual now. */
  var LIVE_FROM = '2026-07-23T22:15:24-07:00';

  /* ---------- derived, not typed ---------- */

  function firstWith(href) {
    for (var i = 0; i < COMMITS.length; i++) if (COMMITS[i].href === href) return COMMITS[i];
    return null;
  }

  var cOne = firstWith(ID_ONE);
  var cTwo = firstWith(ID_TWO);

  var spanDead = cOne ? cOne.t : 0;                 /* href="#" */
  var spanOne  = (cOne && cTwo) ? cTwo.t - cOne.t : 0;  /* the first document */

  function liveSeconds() {
    return Math.max(0, Math.floor((Date.now() - new Date(LIVE_FROM).getTime()) / 1000));
  }

  /* Positions where the two identifiers carry the same character. Both
     are 33 characters, so this is a straight index walk. */
  var matches = [];
  (function () {
    var n = Math.min(ID_ONE.length, ID_TWO.length);
    for (var i = 0; i < n; i++) if (ID_ONE[i] === ID_TWO[i]) matches.push(i);
  }());

  /* ---------- the assertions ---------- */

  /* Each of these is a figure the prose in the HTML states. If one of
     them stops being true the rig does not render a caption that
     disagrees with it — it does not render at all. */
  var claims = {
    bothThirtyThree: ID_ONE.length === 33 && ID_TWO.length === 33,
    twoMatches: matches.length === 2,
    deadIsOneHour: spanDead === 3624,
    firstIsFortySix: spanOne === 2784,
    nightIsTwoHours: NIGHT === 7211,
    sixCommits: COMMITS.length === 6,
    swapIsAlone: !!cTwo && cTwo.sha === 'aeb5751',
    liveIsLongest: liveSeconds() > spanDead && liveSeconds() > spanOne
  };

  var broken = Object.keys(claims).filter(function (k) { return !claims[k]; });

  /* ---------- formatting ---------- */

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* Wall clock, by arithmetic on his timestamp. The night does not cross
     midnight — the assertion above fixes its length at 7,211 seconds —
     so hours never need to roll a date. */
  function clock(t) {
    var total = START.h * 3600 + START.m * 60 + START.s + t;
    return pad(Math.floor(total / 3600)) + ':' +
           pad(Math.floor(total / 60) % 60) + ':' +
           pad(total % 60);
  }

  function dur(s) {
    if (s >= 86400) {
      var d = Math.floor(s / 86400);
      return d + (d === 1 ? ' day' : ' days');
    }
    var h = Math.floor(s / 3600);
    var m = Math.floor(s / 60) % 60;
    var r = s % 60;
    if (h) return h + ' hr ' + pad(m) + ' min ' + pad(r) + ' s';
    if (m) return m + ' min ' + pad(r) + ' s';
    return r + ' s';
  }

  function shortId(id) { return id.slice(0, 8) + '…' + id.slice(-4); }

  /* Spelled out, because the prose around these figures is. Same reason
     js/under.js carries a table: "2 of 33" in a page that writes "two of
     thirty-three" everywhere else reads as a different author. Falls
     back to digits above the range this section can reach. */
  var WORDS = ['nought', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
               'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
               'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
               'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five',
               'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty',
               'thirty-one', 'thirty-two', 'thirty-three'];

  function word(n) { return WORDS[n] || String(n); }

  /* ---------- state at a second ---------- */

  function at(t) {
    var c = COMMITS[0];
    for (var i = 0; i < COMMITS.length; i++) if (COMMITS[i].t <= t) c = COMMITS[i];
    var state = c.href === DEAD ? 'dead' : (c.href === ID_ONE ? 'one' : 'two');
    /* How long the current destination has been in place at second t. */
    var since = 0;
    for (var j = 0; j < COMMITS.length; j++) {
      if (COMMITS[j].t <= t && COMMITS[j].href === c.href) { since = t - COMMITS[j].t; break; }
    }
    return { commit: c, state: state, held: since };
  }

  /* ---------- the DOM ---------- */

  var elTime    = rig.querySelector('[data-rs-time]');
  var elDate    = rig.querySelector('[data-rs-date]');
  var elBtn     = rig.querySelector('[data-rs-btn]');
  var elPoints  = rig.querySelector('[data-rs-points]');
  var elCommit  = rig.querySelector('[data-rs-commit]');
  var elTarget  = rig.querySelector('[data-rs-target]');
  var elHeld    = rig.querySelector('[data-rs-held]');
  var elBehind  = rig.querySelector('[data-rs-behind]');
  var elStatus  = rig.querySelector('[data-rs-status]');
  var elScale   = rig.querySelector('[data-rs-scale]');
  var jumps     = [].slice.call(rig.querySelectorAll('[data-rs-jump]'));

  if (!elTime || !elBtn || !elPoints || !elStatus) return;
  if (broken.length) return;

  var POINTS = {
    dead: 'the top of its own page — <code>href="#"</code>',
    one:  'a file on Google Drive — <code>' + ID_ONE + '</code>',
    two:  'a different file on Google Drive — <code>' + ID_TWO + '</code>'
  };

  var SAY = {
    dead: 'The button exists before the document does: it points at the top of the page it is already on.',
    one:  'It has a resume behind it now, put there in the same commit as the words of his bio.',
    two:  'He has replaced it — one line out, one line in, and nothing else in the commit. This is the link that is still on his homepage.'
  };

  function paint() {
    var t = Number(slider.value) || 0;
    var s = at(t);

    elTime.textContent = clock(t);
    if (elDate) {
      elDate.textContent = START.dow + ' ' + START.d + ' ' + START.mon + ' ' + START.y + ' · ' + START.tz;
    }

    elBtn.setAttribute('data-state', s.state);
    elPoints.innerHTML = 'Points at ' + POINTS[s.state];

    if (elCommit) elCommit.textContent = s.commit.sha + ' · ' + s.commit.subject;
    if (elTarget) {
      elTarget.innerHTML = s.state === 'dead'
        ? 'nothing — <code>#</code>'
        : '<code>' + shortId(s.state === 'one' ? ID_ONE : ID_TWO) + '</code>';
    }
    if (elHeld) elHeld.textContent = s.held === 0 ? 'just changed' : dur(s.held);
    if (elBehind) {
      elBehind.textContent = s.state === 'dead'
        ? 'No'
        : (s.state === 'one' ? 'Yes — the one he took down' : 'Yes — the one that is live now');
    }

    var say = SAY[s.state];
    if (s.state === 'one') {
      say += ' It will last ' + dur(spanOne) + '.';
    } else if (s.state === 'two') {
      say += ' It has been there ' + dur(liveSeconds()) + ' and counting.';
    } else {
      say += ' It will stay that way for ' + dur(spanDead) + '.';
    }
    elStatus.textContent = say;

    /* The three jumps double as a readout of which span you are standing
       in: they are buttons rather than a radio group because pressing
       one moves the slider, but exactly one of the three is always true
       of the current second, and saying so is cheaper than making the
       reader work it out of the clock. */
    jumps.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-rs-jump') === s.state));
    });

    slider.setAttribute('aria-valuetext',
      clock(t) + ' — ' + (s.state === 'dead'
        ? 'the button points at nothing'
        : (s.state === 'one' ? 'the first resume is behind the button' : 'the current resume is behind the button')));
  }

  /* Commit ticks, placed from the timestamps rather than from typed
     percentages. The two that moved the resume link are marked. */
  if (elScale) {
    COMMITS.forEach(function (c) {
      var tick = document.createElement('span');
      tick.className = 'rs-tick';
      tick.setAttribute('aria-hidden', 'true');
      tick.style.left = (c.t / NIGHT * 100) + '%';
      if (c === cOne || c === cTwo) tick.setAttribute('data-resume', '');
      elScale.insertBefore(tick, elScale.firstChild);
    });
  }

  slider.min = 0;
  slider.max = NIGHT;
  slider.addEventListener('input', paint);

  /* The slider steps in whole minutes, so a jump has to land on a
     multiple of the step or the browser snaps it somewhere of its own
     choosing. Rounded up off the commit's own timestamp rather than
     typed, so the landing is inside the span it is named after however
     the step changes. */
  function firstStepAfter(t) {
    var step = Number(slider.step) || 1;
    return Math.min(NIGHT, Math.ceil((t + 1) / step) * step);
  }

  jumps.forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-rs-jump');
      slider.value = key === 'dead' ? 0
        : firstStepAfter(key === 'one' ? cOne.t : cTwo.t);
      paint();
      slider.focus();
    });
  });

  /* ---------- the three spans ---------- */

  /* One shared linear scale against the longest span, which is the
     current link. The first two work out to thousandths of the third, so
     they are floored at a width that renders — and every bar that has
     been floored says so, next to its true figure. */
  var FLOOR = 0.8;

  function bars() {
    var longest = liveSeconds();
    var rows = [
      { key: 'dead', s: spanDead },
      { key: 'one',  s: spanOne },
      { key: 'two',  s: longest }
    ];
    rows.forEach(function (r) {
      var row = sec.querySelector('[data-span="' + r.key + '"]');
      if (!row) return;
      var fill = row.querySelector('[data-rs-fill]');
      var fig = row.querySelector('[data-rs-fig]');
      var pct = longest ? (r.s / longest * 100) : 0;
      if (fill) fill.style.width = Math.max(pct, FLOOR) + '%';
      if (fig) {
        fig.textContent = dur(r.s) +
          (r.key === 'two' ? ' and counting' : '') +
          '  ·  ' + (pct >= 1 ? pct.toFixed(0) + '%' : pct.toFixed(3) + '%') + ' of the longest';
      }
      if (pct < FLOOR) row.classList.add('rs-floored');
    });
  }

  /* ---------- the two identifiers ---------- */

  function chars() {
    [['one', ID_ONE], ['two', ID_TWO]].forEach(function (pair) {
      var host = sec.querySelector('[data-rs-chars="' + pair[0] + '"]');
      if (!host) return;
      var frag = document.createDocumentFragment();
      for (var i = 0; i < pair[1].length; i++) {
        var ch = document.createElement('span');
        ch.className = 'rs-ch';
        ch.textContent = pair[1][i];
        if (matches.indexOf(i) !== -1) ch.setAttribute('data-match', '');
        frag.appendChild(ch);
      }
      host.textContent = '';
      host.appendChild(frag);
    });

    var note = sec.querySelector('[data-rs-idnote]');
    if (note) {
      note.textContent = 'Both are ' + word(ID_ONE.length) + ' characters, and ' +
        word(matches.length) + ' of those ' + word(ID_ONE.length) +
        ' positions hold the same character in both — position ' + (matches[0] + 1) +
        ', which every Drive identifier starts with, and position ' + (matches[1] + 1) + ', a hyphen. The other ' +
        word(ID_ONE.length - matches.length) + ' differ. He did not correct a link; he pointed the button at another document.';
    }
  }

  /* ---------- audit ---------- */

  function audit() {
    return {
      claims: claims,
      broken: broken,
      night: NIGHT,
      spanDead: spanDead,
      spanOne: spanOne,
      liveSeconds: liveSeconds(),
      liveDays: Math.floor(liveSeconds() / 86400),
      ratio: Math.round(liveSeconds() / spanOne),
      matches: matches,
      /* A visible, working resume link is a requirement of this page, so
         it is checked rather than assumed, and it is checked outside the
         rig because that is where it lives. */
      liveLinkOnPage: !!document.querySelector('a[href*="' + ID_TWO + '"]'),
      takenDownIdIsNotLinked: !document.querySelector('a[href*="' + ID_ONE + '"]')
    };
  }

  window.__resume = { audit: audit, at: at };

  slider.value = 0;
  paint();
  bars();
  chars();
  rig.hidden = false;

  var nojs = sec.querySelector('[data-rs-nojs]');
  if (nojs) nojs.hidden = true;
}());

/* The Last Thing He Did Was Delete — his commits, scaled against each other.
   ----------------------------------------------------------------------
   Added 2026-10-12. Scoped entirely to #log.

   Every fact this file renders is already in the markup: each row carries
   the commit's author timestamp, its insertion and deletion counts and
   the number of files it touched, as data attributes, and prints the
   counts as text. With the script off you still get the eleven commits in
   order with their real numbers. What the script adds is the comparison —
   the bars, the elapsed gaps and the totals — which is the part that only
   means anything relative to the other rows.

   Three things here are deliberate.

   The bars share one scale across every visible row rather than being
   normalised per row. That is the argument: 542 lines is a long bar until
   4,392 lines is on the same axis. Filtering to one scope re-derives the
   maximum from the rows still in play, so his own site's four one-line
   follow-ups become visible once the prune is out of the frame — the same
   data, honestly rescaled, telling a different story about him depending
   on what you compare him to.

   The elapsed gaps are computed from the timestamps rather than trusted
   from the markup, and the markup's own copies are then checked against
   what was computed. A typed "70 days later" is true until someone edits
   a date; a derived one is true or check() reports it. Same reason the
   totals are summed from the rows instead of written into the prose.

   And nothing here hides a row. Filtering pushes the rest of the log
   below normal contrast and leaves it on the shared scale, because the
   comparison is the content; removing the rows you are not looking at
   would quietly remove the only reason the chart exists. */
(function () {
  'use strict';

  var section = document.getElementById('log');
  if (!section) return;

  var list = section.querySelector('.lg-list');
  var rig  = section.querySelector('.lg-rig');
  var nojs = section.querySelector('.lg-nojs');
  if (!list || !rig) return;

  var rows = [].slice.call(list.querySelectorAll('.lg-row'));
  if (!rows.length) return;

  var picks    = section.querySelectorAll('.lg-pick');
  var status   = section.querySelector('[data-lg-status]');
  var clearBtn = section.querySelector('[data-lg-clear]');

  var SCOPE_LABEL = {
    site: 'his own portfolio',
    daily: 'the sandbox'
  };

  /* Bars are linear on a shared scale, so a one-line commit works out to
     0.02% of the widest bar and would not paint at all. A floor keeps it
     visible as a tick; the exact counts are printed beside every row, so
     the floor cannot mislead about a number, only about a ratio under
     about a fiftieth. */
  var FLOOR_PX = 3;

  function toData(row) {
    return {
      el: row,
      at: new Date(row.getAttribute('data-at')).getTime(),
      /* The calendar day is taken from the leading YYYY-MM-DD of the
         recorded timestamp, not from a Date, because a Date would be
         bucketed in the *viewer's* timezone: his 23 July 21:29 is 24 July
         in UTC, and "days with a commit" would then read 3 in London and
         4 in Seattle. The commits carry his own -07:00 offset; that is
         the day that happened. */
      day: String(row.getAttribute('data-at')).slice(0, 10),
      ins: Number(row.getAttribute('data-ins')) || 0,
      del: Number(row.getAttribute('data-del')) || 0,
      files: Number(row.getAttribute('data-files')) || 0,
      scope: row.getAttribute('data-scope') || ''
    };
  }

  var data = rows.map(toData);

  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ---------- elapsed time between commits ---------- */

  var MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  /* Coarsest unit that fits, plus the next one down when it is non-zero:
     "70 days", "2 days, 20 hours", "17 hours, 10 minutes", "3 minutes".
     Rounding is applied to the finer unit, never the coarser one, so a
     gap is never rounded up into a day it did not reach. */
  function elapsed(ms) {
    if (ms >= DAY) {
      var d = Math.floor(ms / DAY);
      var dh = Math.round((ms - d * DAY) / HOUR);
      if (dh >= 24) { d += 1; dh = 0; }
      return dh ? plural(d, 'day') + ', ' + plural(dh, 'hour') : plural(d, 'day');
    }
    if (ms >= HOUR) {
      var h = Math.floor(ms / HOUR);
      var hm = Math.round((ms - h * HOUR) / MIN);
      if (hm >= 60) { h += 1; hm = 0; }
      return hm ? plural(h, 'hour') + ', ' + plural(hm, 'minute') : plural(h, 'hour');
    }
    if (ms >= MIN) return plural(Math.round(ms / MIN), 'minute');
    return plural(Math.round(ms / 1000), 'second');
  }

  /* The markup's typed gaps are the no-script fallback. Overwrite them
     with the derived string and keep what was replaced, so check() can
     report any row where the two disagreed. */
  function gaps() {
    var drift = [];
    for (var i = 1; i < data.length; i++) {
      var ms = data[i].at - data[i - 1].at;
      var want = elapsed(ms) + ' later';
      var out = data[i].el.querySelector('[data-gap]');
      if (!out) continue;
      var had = out.textContent.replace(/\s+/g, ' ').trim();
      if (had !== want) drift.push({ row: i + 1, markup: had, derived: want });
      out.textContent = want;
      data[i].el.setAttribute('data-long', ms >= 30 * DAY ? 'true' : 'false');
    }
    return drift;
  }

  /* ---------- the bars ---------- */

  var active = null;   // the picked scope, or null for everything

  function inScope(d) { return !active || d.scope === active; }

  function totals(filter) {
    var t = { commits: 0, ins: 0, del: 0, files: 0, days: {} };
    data.forEach(function (d) {
      if (filter && !filter(d)) return;
      t.commits += 1;
      t.ins += d.ins;
      t.del += d.del;
      t.files += d.files;
      t.days[d.day] = 1;
    });
    t.dayCount = Object.keys(t.days).length;
    t.net = t.ins - t.del;
    return t;
  }

  function paint() {
    /* The widest bar among the rows in play. Each half of the track is
       half the row's width, so a value equal to the max fills its half. */
    var max = 0;
    data.forEach(function (d) {
      if (!inScope(d)) return;
      if (d.ins > max) max = d.ins;
      if (d.del > max) max = d.del;
    });
    if (!max) max = 1;

    data.forEach(function (d) {
      var lit = inScope(d);
      d.el.setAttribute('data-off', (active && !lit) ? 'true' : 'false');
      d.el.setAttribute('data-cur', (active && lit) ? 'true' : 'false');

      ['ins', 'del'].forEach(function (key) {
        var bar = d.el.querySelector('[data-bar="' + (key === 'ins' ? 'add' : 'del') + '"]');
        if (!bar) return;
        var v = d[key];
        if (!v) { bar.style.width = '0'; return; }
        bar.style.width = 'max(' + FLOOR_PX + 'px, ' + ((v / max) * 100).toFixed(3) + '%)';
      });
    });

    for (var i = 0; i < picks.length; i++) {
      picks[i].setAttribute('aria-pressed',
        picks[i].getAttribute('data-pick') === active ? 'true' : 'false');
    }
    if (clearBtn) clearBtn.disabled = !active;

    return max;
  }

  function describe(max) {
    if (!status) return;
    var t = totals(inScope);
    if (!active) {
      status.textContent =
        'All ' + t.commits + ' of his commits, on one scale. ' + num(t.ins) +
        ' lines added, ' + num(t.del) + ' removed, across ' + t.dayCount +
        ' days — net ' + (t.net < 0 ? '−' : '+') + num(Math.abs(t.net)) +
        '. The widest bar is ' + num(max) + ' lines.';
      return;
    }
    status.textContent =
      t.commits + ' commits to ' + SCOPE_LABEL[active] + ', rescaled to themselves: ' +
      num(t.ins) + ' added, ' + num(t.del) + ' removed, net ' +
      (t.net < 0 ? '−' : '+') + num(Math.abs(t.net)) + '. The widest bar here is ' +
      num(max) + ' lines. The rest of the log is still on this scale, set aside.';
  }

  function render() { describe(paint()); }

  function pick(scope) {
    active = (active === scope) ? null : scope;
    render();
  }

  /* ---------- the summary board ---------- */

  function board() {
    var t = totals(null);
    var drift = [];
    var out = {
      commits: String(t.commits),
      ins: num(t.ins),
      del: num(t.del),
      days: String(t.dayCount)
    };
    Object.keys(out).forEach(function (key) {
      var el = section.querySelector('[data-lg-' + key + ']');
      if (!el) return;
      var had = el.textContent.replace(/\s+/g, ' ').trim();
      if (had !== out[key]) drift.push({ field: key, markup: had, derived: out[key] });
      el.textContent = out[key];
    });
    return { totals: t, drift: drift };
  }

  /* Each button's count is derived too, for the same reason the totals
     are: a typed "6" survives a row being added and stops being true. */
  function pickCounts() {
    var drift = [];
    for (var i = 0; i < picks.length; i++) {
      var scope = picks[i].getAttribute('data-pick');
      var want = String(totals(function (d) { return d.scope === scope; }).commits);
      var out = picks[i].querySelector('.lg-pick-n');
      if (!out) continue;
      var had = out.textContent.replace(/\s+/g, ' ').trim();
      if (had !== want) drift.push({ pick: scope, markup: had, derived: want });
      out.textContent = want;
    }
    return drift;
  }

  /* ---------- wire up ---------- */

  for (var i = 0; i < picks.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () { pick(btn.getAttribute('data-pick')); });
    })(picks[i]);
  }

  if (clearBtn) clearBtn.addEventListener('click', function () { active = null; render(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && active) { active = null; render(); }
  });

  var gapDrift = gaps();
  var summary = board();
  var pickDrift = pickCounts();

  if (nojs) nojs.hidden = true;
  list.classList.add('is-live');
  render();

  /* Everything the section asserts, and whether the markup agreed with
     the numbers derived from the timestamps and counts. A non-empty
     drift list means a typed fallback has gone stale. */
  window.__log = {
    rows: data.map(function (d) {
      return { at: new Date(d.at).toISOString(), ins: d.ins, del: d.del, files: d.files, scope: d.scope };
    }),
    totals: summary.totals,
    bySite: totals(function (d) { return d.scope === 'site'; }),
    byDaily: totals(function (d) { return d.scope === 'daily'; }),
    elapsed: elapsed,
    check: function () {
      return { gapDrift: gapDrift, statDrift: summary.drift, pickDrift: pickDrift };
    },
    pick: pick
  };
})();

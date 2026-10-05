/* Permalink — exhibit state in the URL
   ======================================================================
   Added 2026-10-05. The consoles on this page have real state — a rhythm
   you dialled in, a slime configuration that produced a good network —
   and until now reloading threw all of it away and there was no way to
   show anyone what you found.

   State goes in the QUERY STRING, deliberately not the hash: the section
   rail already owns the hash for #anchors, and clicking a rail link would
   wipe any parameters stored there.

   history.replaceState rather than assignment, so typing in a slider
   doesn't push a hundred entries onto the back button or scroll the page.

   Everything read back out of a URL is untrusted — it is whatever someone
   pasted — so each exhibit clamps and validates its own values and falls
   back to its defaults rather than trusting the string.
*/
(function () {
  'use strict';

  var Daily = (window.Daily = window.Daily || {});

  var supported = !!(window.URL && window.URLSearchParams && window.history && history.replaceState);

  var pending = null;

  Daily.params = {
    supported: supported,

    get: function (key) {
      if (!supported) return null;
      try {
        return new URL(location.href).searchParams.get(key);
      } catch (e) { return null; }
    },

    /* Throttled: dragging a slider fires input continuously, and there is
       no reason to rewrite the URL sixty times a second. */
    set: function (key, value) {
      if (!supported) return;
      if (!pending) pending = {};
      pending[key] = value;
      if (pending.__queued) return;
      pending.__queued = true;
      setTimeout(flush, 250);
    }
  };

  function flush() {
    if (!pending) return;
    var batch = pending;
    pending = null;
    try {
      var u = new URL(location.href);
      for (var k in batch) {
        if (k === '__queued') continue;
        if (batch[k] == null || batch[k] === '') u.searchParams.delete(k);
        else u.searchParams.set(k, batch[k]);
      }
      var q = u.searchParams.toString();
      history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
    } catch (e) { /* a URL we can't rewrite is not worth breaking a page over */ }
  }

  /* ---------- "copy link" buttons ---------- */

  Daily.wireCopy = function (btn, note) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      flush();   /* make sure the URL is current before we read it */
      var url = location.href;
      var done = function (ok) {
        var old = btn.textContent;
        btn.textContent = ok ? 'Link copied' : 'Press ⌘C';
        if (note) note.textContent = ok ? 'Link copied — it carries the settings above.' : url;
        setTimeout(function () { btn.textContent = old; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  };

  /* ---------- small shared parsing helpers ---------- */

  Daily.clamp = function (v, lo, hi, fallback) {
    v = parseFloat(v);
    if (!isFinite(v)) return fallback;
    return v < lo ? lo : (v > hi ? hi : v);
  };
})();

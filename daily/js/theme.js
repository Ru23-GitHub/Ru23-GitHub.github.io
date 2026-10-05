/* Theme toggle
   ======================================================================
   Added 2026-10-05. Three states, cycled in this order:

     auto  -> follow the OS (no attribute set; CSS media query decides)
     light -> force light      [data-theme="light"]
     dark  -> force dark       [data-theme="dark"]

   "Auto" is the default and is a real state rather than a hidden one, so
   someone who flips their OS to dark at sunset gets this page with it
   unless they have deliberately pinned a side.

   The <head> carries a tiny inline copy of the read step: without it the
   document paints light for a frame before this file runs, which is the
   flash of wrong theme. */
(function () {
  'use strict';

  var KEY = 'daily-theme';
  var ORDER = ['auto', 'light', 'dark'];
  var btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;

  var label = btn.querySelector('[data-theme-label]');
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function stored() {
    try {
      var v = localStorage.getItem(KEY);
      return ORDER.indexOf(v) === -1 ? 'auto' : v;
    } catch (e) {
      /* private mode, blocked storage — auto is a fine answer */
      return 'auto';
    }
  }

  function save(v) {
    try {
      if (v === 'auto') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, v);
    } catch (e) { /* nothing to do; the page still works for this visit */ }
  }

  function resolved(mode) {
    if (mode === 'auto') return mq && mq.matches ? 'dark' : 'light';
    return mode;
  }

  function apply(mode) {
    if (mode === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', mode);

    var r = resolved(mode);
    btn.setAttribute('data-resolved', r);
    /* The button's accessible name has to say what pressing it DOES, and
       what it does depends on where in the cycle you are. */
    var nextMode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    btn.setAttribute('aria-label', 'Theme: ' + mode + '. Switch to ' + nextMode + '.');
    if (label) label.textContent = mode === 'auto' ? 'Auto' : (mode === 'dark' ? 'Dark' : 'Light');
  }

  var current = stored();
  apply(current);
  btn.hidden = false;

  btn.addEventListener('click', function () {
    current = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    save(current);
    apply(current);
  });

  /* While in auto, track the OS flipping underneath us. */
  if (mq) {
    var onChange = function () { if (current === 'auto') apply('auto'); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
})();

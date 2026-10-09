/* Five You Ship, One You Ask — how far down the question reaches.
   ----------------------------------------------------------------------
   Added 2026-10-09. Scoped entirely to #stack.

   One <input type="range"> over six positions, 0 to 5. The value is a
   depth: how many of the five build layers, counting down from the one
   the person touches, the sixth skill on his list is being asked at.
   Zero means nobody is asking anywhere; five means the question reaches
   the choice of what the model predicts in the first place.

   Everything this file does is set data-asked on five list items and
   write one status line. The five layers, their roles and their five
   decisions are static prose in the HTML — so with the slider at zero,
   with JavaScript off, or in a reader, the section is still the whole
   argument, just without the instrument. That is also why the layer
   text is tagged [data-from] and the slider, the dots and the status
   line are [data-chrome]: the prose has an author, a readout that the
   slider rewrites does not. */
(function () {
  'use strict';

  var section = document.getElementById('stack');
  if (!section) return;

  var control = section.querySelector('.st-control');
  var nojs    = section.querySelector('.st-nojs');
  var slider  = section.querySelector('[data-st-slider]');
  var status  = section.querySelector('[data-st-status]');
  if (!control || !slider) return;

  /* Document order is top-down: nearest the person first. Depth d lights
     the first d of them. */
  var layers = section.querySelectorAll('.st-layer');
  var MAX = layers.length;   /* five, and the slider's max is set from it */

  /* What is still nobody's department at each depth. Index = depth. */
  var COPY = [
    'Nobody is asking, anywhere. Five technical layers, five decisions that ' +
    'are not technical, and no one looking at any of them.',

    'Asked at the interface and no further — a disclaimer on the screen, ' +
    'written after the other four decisions were already made.',

    'Asked down to deployment. How many people it reaches is in scope now. ' +
    'The model, the data it learned from and the choice of what to predict ' +
    'are still nobody’s department.',

    'Asked down to the language layer. How sure the thing is allowed to ' +
    'sound is in scope. What it learned from, and what it is predicting, ' +
    'are not.',

    'Asked down to the model itself, so who the training data was is finally ' +
    'a question. What the model is predicting is still handed to it as a given.',

    'Asked all the way down, including what the thing is predicting in the ' +
    'first place — the only depth at which the first decision is still open.'
  ];

  /* Short names used to say out loud which layers are covered, so the
     state is never carried by the stripes alone. */
  var NAMES = ['the interface', 'deployment', 'the language layer', 'the model', 'the target'];

  function list(n) {
    if (n === 0) return 'none of them';
    if (n === MAX) return 'all five';
    var parts = NAMES.slice(0, n);
    if (parts.length === 1) return parts[0];
    return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }

  function paint(depth) {
    for (var i = 0; i < layers.length; i++) {
      layers[i].setAttribute('data-asked', i < depth ? 'true' : 'false');
    }

    var where = depth === 0
      ? 'Asked at none of the five layers.'
      : 'Asked at ' + depth + ' of the five layers — ' + list(depth) + '.';

    slider.setAttribute('aria-valuetext', where);

    if (status) {
      status.innerHTML = '';
      var n = document.createElement('span');
      n.className = 'st-count';
      n.textContent = depth + '/' + MAX;
      status.appendChild(n);
      status.appendChild(document.createTextNode(' ' + COPY[depth]));
    }
  }

  slider.max = String(MAX);
  slider.value = '0';
  slider.addEventListener('input', function () {
    var d = parseInt(slider.value, 10);
    paint(isNaN(d) ? 0 : Math.max(0, Math.min(MAX, d)));
  });

  /* Only the instrument is hidden up front, never the argument: the
     five layers and their five decisions are in the markup unconditionally,
     and it is the slider and the readout that appear once this file has
     actually run. */
  control.hidden = false;
  if (status) status.hidden = false;
  if (nojs) nojs.hidden = true;

  paint(0);
})();

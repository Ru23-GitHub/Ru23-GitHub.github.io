/* He Moved North And Stayed Put — the drive up I-5.
   ----------------------------------------------------------------------
   Added 2026-10-08. Scoped entirely to #north.

   What this is about: the first sentence of Ruslan's bio contains a move
   — Portland OR to Seattle WA — and bio sentences make moves sound like
   before-and-afters. This section drives it. The claim it makes is that
   almost nothing about the place changes, and the drawing is arranged so
   that the claim is structural rather than asserted:

     the sky, the two treelines and the ground are generated ONCE, in
     build(), and are never passed to render(). There is no code path by
     which dragging north can alter the forest.

   render() can reach exactly two things: the mountain's outline and its
   ice cap. That is the honest visual content of the drive; the rest of
   what moves is words in the readout.

   On the facts, and which are whose:

     His       Portland OR -> Seattle WA, and "the PNW has my heart".
               Quoted from index.html at the root of this domain.
     Looked up Rainier 14,411 ft and highest in the Cascades (NPS);
               Hood about 11,240 ft, and roughly 3,000 ft shorter than
               Rainier — published summit figures for Hood vary by a few
               feet, so it is written here with "about" rather than a
               false precision; Oregon made the Douglas-fir its state
               tree in 1939 and Washington chose the western hemlock in
               1947, though the Douglas-fir is the commoner tree in
               Washington's forests (Washington Secretary of State);
               the I-5 Interstate Bridge over the Columbia is about
               3,538 ft long and the state line runs down the middle of
               it, at Portland's northern edge; the drive is roughly 175
               miles depending on which end of each city you measure.
     Mine      The observation that the first of those changes happens
               in the first few minutes and the rest of the drive changes
               nothing. Also the drawing: the silhouettes are stylized
               and scaled against each other by summit elevation, which
               is not how either mountain looks from either city.

   Nothing animates on its own. There is no timer, no rAF loop and no
   scroll listener — render() runs on 'input' from a range element and on
   nothing else, so the only motion is motion a person is making. That is
   also why prefers-reduced-motion isn't consulted here: there is no
   autonomous animation to suppress. */
(function () {
  'use strict';

  var root = document.getElementById('north');
  if (!root) return;

  var svg = root.querySelector('[data-nr-sky]');
  var slider = root.querySelector('[data-nr-slider]');
  var rig = root.querySelector('.nr-rig');
  var nojs = root.querySelector('.nr-nojs');
  if (!svg || !slider || !rig) return;

  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- the two ends ---------- */

  var MILES = 175;          /* "roughly", and said so wherever it is shown */
  var GROUND = 258;         /* the y the mountains and trees stand on */
  var MAX_H = 150;          /* px drawn for the taller of the two summits */

  var SOUTH = {
    city: 'Portland, OR',
    state: 'Oregon',
    peak: 'Mount Hood',
    elev: 'about 11,240 ft',
    tree: 'Douglas-fir',
    water: 'the Willamette',
    /* relative to the taller summit, so the two drawings are to scale
       against each other even though neither is to scale against the
       horizon it would really sit on */
    scale: 11240 / 14411,
    snow: 0.70,
    /* x offset in px from centre, then height as a fraction of this
       mountain's own drawn height. Hood is the sharper of the two. */
    profile: [
      [-180, 0], [-120, 0.19], [-72, 0.44], [-34, 0.77], [-14, 0.957],
      [0, 1], [16, 0.94], [46, 0.72], [88, 0.43], [138, 0.20], [190, 0]
    ]
  };

  var NORTH = {
    city: 'Seattle, WA',
    state: 'Washington',
    peak: 'Mount Rainier',
    elev: '14,411 ft',
    tree: 'western hemlock',
    water: 'Puget Sound',
    scale: 1,
    snow: 0.52,
    /* Broader base, blunter summit: Rainier carries a lot more mountain
       and a lot more ice than Hood does. */
    profile: [
      [-250, 0], [-182, 0.17], [-122, 0.39], [-74, 0.64], [-38, 0.867],
      [-12, 0.987], [20, 1], [58, 0.88], [104, 0.667], [160, 0.40], [248, 0]
    ]
  };

  if (SOUTH.profile.length !== NORTH.profile.length) return;

  /* ---------- helpers ---------- */

  function lerp(a, b, t) { return a + (b - a) * t; }

  function el(name, attrs) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    }
    return n;
  }

  function path(points, closeY) {
    var d = '';
    for (var i = 0; i < points.length; i++) {
      d += (i ? 'L' : 'M') + points[i][0].toFixed(1) + ' ' + points[i][1].toFixed(1) + ' ';
    }
    if (closeY !== undefined) {
      d += 'L' + points[points.length - 1][0].toFixed(1) + ' ' + closeY.toFixed(1) + ' ';
      d += 'L' + points[0][0].toFixed(1) + ' ' + closeY.toFixed(1) + ' ';
    }
    return d + 'Z';
  }

  /* A small deterministic PRNG (mulberry32). The treeline has to be
     random-looking and identical on every load, because a forest that
     reshuffled itself on reload would undercut the one thing this
     section is for. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* One conifer: a centre spike with two skirt tiers either side. */
  function fir(cx, base, h, w) {
    return [
      [cx - w, base],
      [cx - w * 0.52, base - h * 0.38],
      [cx - w * 0.78, base - h * 0.38],
      [cx - w * 0.30, base - h * 0.70],
      [cx - w * 0.52, base - h * 0.70],
      [cx, base - h],
      [cx + w * 0.52, base - h * 0.70],
      [cx + w * 0.30, base - h * 0.70],
      [cx + w * 0.78, base - h * 0.38],
      [cx + w * 0.52, base - h * 0.38],
      [cx + w, base]
    ];
  }

  function treeline(seed, base, hMin, hMax, wMin, wMax, step) {
    var rand = rng(seed);
    var d = '';
    for (var x = -30; x < 840; x += step * (0.72 + rand() * 0.56)) {
      var h = lerp(hMin, hMax, rand());
      var w = lerp(wMin, wMax, rand());
      d += path(fir(x, base, h, w), base);
    }
    return d;
  }

  /* The foothills between the volcano and the forest: a few summed sines
     with seeded phases, sampled across the frame. Like the treeline it is
     generated once. It also does the job the old flat sky band did badly
     — that band met the sky in a dead straight line all the way across,
     which read as a seam rather than as distance. */
  function ridge(seed, topHigh, topLow, baseY) {
    var rand = rng(seed);
    var waves = [], total = 0, i;
    for (i = 0; i < 5; i++) {
      var amp = 0.35 + rand() * 0.65;
      waves.push({ amp: amp, f: 1 + Math.floor(rand() * 4), ph: rand() * Math.PI * 2 });
      total += amp;
    }
    var pts = [];
    for (var x = 0; x <= 800; x += 10) {
      var u = x / 800, v = 0;
      for (i = 0; i < waves.length; i++) {
        v += waves[i].amp * Math.sin(u * Math.PI * 2 * waves[i].f + waves[i].ph);
      }
      v = (v / total + 1) / 2;                      /* -1..1 -> 0..1 */
      pts.push([x, topHigh + (topLow - topHigh) * v]);
    }
    return path(pts, baseY);
  }

  /* ---------- build: everything that never changes ---------- */

  var mtn, ice, iceClipRect;

  function build() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var defs = el('defs');

    /* The ice cap is the mountain path drawn a second time and clipped to
       a band across its summit, so the cap can never disagree with the
       outline underneath it. */
    var clip = el('clipPath', { id: 'nr-ice-clip' });
    iceClipRect = el('rect', { x: '0', y: '0', width: '800', height: '0' });
    clip.appendChild(iceClipRect);
    defs.appendChild(clip);

    svg.appendChild(defs);

    /* sky: one flat field rather than a gradient, so the dark-mode colour
       stays under CSS control */
    svg.appendChild(el('rect', { x: '0', y: '0', width: '800', height: '300', 'class': 'nr-sky-far' }));

    /* the mountain, and its cap. Drawn before the foothills so the ridge
       cuts off its base, which is how both of these actually read from
       the lowlands either city sits in. */
    mtn = el('path', { 'class': 'nr-mtn', d: '' });
    svg.appendChild(mtn);
    ice = el('path', { 'class': 'nr-ice', d: '', 'clip-path': 'url(#nr-ice-clip)' });
    svg.appendChild(ice);

    svg.appendChild(el('path', { 'class': 'nr-ridge', d: ridge(5150, 176, 216, 290) }));

    /* The forest. Two layers for depth, both generated here and never
       referenced again. Seeds are fixed, so this is the same forest on
       every load and at every mile. */
    svg.appendChild(el('path', {
      'class': 'nr-trees-far',
      d: treeline(20261008, GROUND - 6, 26, 46, 9, 15, 20)
    }));
    svg.appendChild(el('path', {
      'class': 'nr-trees-near',
      d: treeline(776431, GROUND + 10, 40, 74, 13, 22, 30)
    }));

    svg.appendChild(el('rect', {
      x: '0', y: String(GROUND + 10), width: '800', height: String(300 - GROUND - 10),
      'class': 'nr-ground'
    }));
  }

  /* ---------- render: the only three things the slider can move ---------- */

  var elMile = root.querySelector('[data-nr-mile]');
  var elState = root.querySelector('[data-nr-state]');
  var elNearer = root.querySelector('[data-nr-nearer]');
  var elPeak = root.querySelector('[data-nr-peak]');
  var elElev = root.querySelector('[data-nr-elev]');
  var elTree = root.querySelector('[data-nr-tree]');
  var elWater = root.querySelector('[data-nr-water]');
  var elDesc = root.querySelector('[data-nr-desc]');
  var elStatus = root.querySelector('[data-nr-status]');

  var lastSide = null;

  function render() {
    var t = Number(slider.value) / 100;
    if (!isFinite(t)) t = 0;

    /* geometry */
    var h = lerp(SOUTH.scale, NORTH.scale, t) * MAX_H;
    var pts = [];
    for (var i = 0; i < SOUTH.profile.length; i++) {
      var sx = SOUTH.profile[i][0], sy = SOUTH.profile[i][1];
      var nx = NORTH.profile[i][0], ny = NORTH.profile[i][1];
      pts.push([400 + lerp(sx, nx, t), GROUND - lerp(sy, ny, t) * h]);
    }
    var d = path(pts, GROUND);
    mtn.setAttribute('d', d);
    ice.setAttribute('d', d);

    var snowFrac = lerp(SOUTH.snow, NORTH.snow, t);
    var capTop = GROUND - h;
    iceClipRect.setAttribute('y', capTop.toFixed(1));
    iceClipRect.setAttribute('height', (h * (1 - snowFrac)).toFixed(1));

    /* readout. The state line is on the Columbia, at Portland's northern
       edge, so it is crossed in the first per cent or so of the drive —
       which is the whole observation, and why this is not a halfway
       test. */
    var mile = Math.round(t * MILES);
    var crossed = t > 0.035;
    var near = t < 0.5 ? SOUTH : NORTH;

    if (elMile) elMile.textContent = mile + ' of ~' + MILES;
    if (elState) elState.textContent = crossed ? NORTH.state : SOUTH.state;
    if (elNearer) elNearer.textContent = near.city;
    if (elPeak) elPeak.textContent = near.peak;
    if (elElev) elElev.textContent = near.elev;
    if (elTree) elTree.textContent = crossed ? NORTH.tree : SOUTH.tree;
    if (elWater) elWater.textContent = near.water;

    if (elDesc) {
      elDesc.textContent =
        'A stylized Pacific Northwest horizon at mile ' + mile + ' of about ' + MILES +
        '. The forest of Douglas-firs and the sky are the same at every mile. ' +
        'The single volcano on the skyline is drawn ' +
        (t < 0.5 ? 'nearer to Mount Hood' : 'nearer to Mount Rainier') +
        ', cross-faded between the two by distance travelled.';
    }

    /* Announced only when the side actually flips, so holding an arrow
       key down doesn't fire a hundred status updates. */
    var side = t < 0.5 ? 'south' : 'north';
    if (side !== lastSide) {
      lastSide = side;
      if (elStatus) {
        elStatus.textContent = crossed
          ? 'In Washington, nearer ' + near.city + '. Same forest.'
          : 'Still in Oregon, nearer ' + near.city + '.';
      }
    }
  }

  build();
  slider.addEventListener('input', render);
  render();

  if (nojs) nojs.hidden = true;
  rig.hidden = false;
})();

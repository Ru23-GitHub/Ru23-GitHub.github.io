/* One Hundred Trillion Sonnets — scoped to #queneau
   ======================================================================
   Added 2026-10-05.

   In 1961 Raymond Queneau published "Cent mille milliards de poemes": ten
   sonnets printed so that every page was cut into fourteen horizontal
   strips, one per line. Because all ten sonnets share a rhyme scheme AND
   the same rhyme sounds in the same positions, any line can stand in for
   the line at its own position in any other sonnet. Flip the strips freely
   and you get 10^14 readable sonnets out of 140 printed lines. His preface
   works the reading time out at more than a million centuries.

   This is that machine, with my own 140 lines rather than Queneau's -- his
   are in copyright and in French, and writing to the constraint is most of
   the fun anyway. The ten sonnets are about a building that keeps working
   after everyone has gone home, which is a reasonably on-the-nose subject
   for a page an agent rebuilds every night.

   The constraint, kept honestly:

     scheme      ABAB  ABAB  CCD  EDE
     rhyme A     lines 1 3 5 7    -ight
     rhyme B     lines 2 4 6 8    -ain
     rhyme C     lines 9 10       -ow
     rhyme D     lines 11 13      -ound
     rhyme E     lines 12 14      -ime

   Rhyme words are disjoint between positions that share a sound, so no
   rendered sonnet can ever rhyme a word with itself. Sentences close at
   lines 2, 4, 6, 8, 11 and 14, and every line is a self-contained clause,
   which is what keeps an arbitrary combination grammatical.

   The nicest accident of the format: fourteen digits of 0-9 is just a
   base-10 numeral, so a sonnet's strip settings ARE its number in the
   complete edition. That number is the permalink.
*/
(function () {
  'use strict';

  var root = document.getElementById('queneau');
  if (!root) return;

  var VARIANTS = 10;
  var LINES = 14;

  /* Fourteen positions, ten variants each. Index = strip, inner index = digit. */
  var VERSE = [
    /* 1  A */ [
      'The last one out has left the stairwell light,',
      'There is a kind of patience in the night,',
      'The corridor runs empty, out of sight,',
      'The monitors have gone to screensaver white,',
      'The stairwell holds its breath at every flight,',
      'A beacon blinks unanswered at that height,',
      'The towers hold the last of the twilight,',
      'The building sheds its people before midnight,',
      'The lobby doors lock out the final daylight,',
      'One desk survives beneath its own lamplight,'
    ],
    /* 2  B */ [
      'and down the empty avenue, the rain.',
      'and something in the basement starts again.',
      'and what is left to do is fairly plain.',
      'and far above the roof, a red-eye plane.',
      'and down the hall a fire door on its chain.',
      'and under all of it, the last late train.',
      'and nothing moves at all along the lane.',
      'and moths come knocking softly at the pane.',
      'and no one left inside to lend a brain.',
      'and somewhere water finding out a drain.'
    ],
    /* 3  A */ [
      'The racks blink amber, orderly and bright,',
      'The schedule holds, the tolerances tight,',
      'A cooling fan corrects a drift so slight,',
      'To call it lonely would be fond and trite,',
      'The whole arrangement is absurdly polite,',
      'It logs each failure, patient and contrite,',
      'The chairs are stacked, the standing lamps upright,',
      'The queue is long but blessedly finite,',
      'The work gets done the way it does, overnight,',
      'The copper roofline silvers in the moonlight,'
    ],
    /* 4  B */ [
      'and no one here to tally up the gain.',
      'and dust lies down on every open grain.',
      'and current hums along the humming main.',
      'and nothing in the building feels the pain.',
      'and coffee left at six has set its stain.',
      'and you can hear the transformer at its strain.',
      'and most of what it does will be in vain.',
      'and on the roof, the turning of a vane.',
      'and past the window, the unmoving crane.',
      'and fog comes off the hills in one long mane.'
    ],
    /* 5  A */ [
      'It does not need an audience to be right,',
      'It writes to disk what no one else would write,',
      'Each pass undoes the last and starts a rewrite,',
      'It has the one long song, and will recite,',
      'There was no ceremony and no invite,',
      'A relay somewhere waiting to ignite,',
      'One window on the ninth is still alight,',
      'The shifts that never meet somehow unite,',
      'No one is here to praise it or incite,',
      'There is a plain mechanical delight,'
    ],
    /* 6  B */ [
      'in doing work that nobody will explain.',
      'in what the daylight people left to remain.',
      'in everything a ledger must retain.',
      'in habits that machines alone maintain.',
      'in more than one small building can contain.',
      'in effort nothing living could sustain.',
      'in one long unaccompanied refrain.',
      'in labour that will never once complain.',
      'in protocols that no one did ordain.',
      'in some small competence it might attain.'
    ],
    /* 7  A */ [
      'It goes about the task with all its might,',
      'No part of this is finished, not quite,',
      'It keeps at it from something close to spite,',
      'It eats the whole enormous backlog, bite by bite,',
      'It holds the lot of it on one small site,',
      'A nightly chore becomes a nightly rite,',
      'Nobody will be told about its plight,',
      'It clears the stalled, half-corrupted blight,',
      'Now and again it stumbles on insight,',
      'It runs entirely free of oversight,'
    ],
    /* 8  B */ [
      'a small, unvisited, unwatched domain.',
      'mapping an unremarkable terrain.',
      'heroic in a way that is mundane.',
      'and there is nothing in it that is humane.',
      'obeying rules both simple and arcane.',
      'which is, considered coldly, quite insane.',
      'a one-machine, entirely lifelong campaign.',
      'as steady as the eye of a hurricane.',
      'pressed up against a thin glass membrane.',
      'though none of it, by morning, stays germane.'
    ],
    /* 9  C */ [
      'The night is long, the increments are slow,',
      'The only witness is a standby glow,',
      'The city sleeps in strata far below,',
      'And no one in the morning needs to know,',
      'Outside, the first unpromised fall of snow,',
      'There is no hour at which it says: now go,',
      'There is no audience, and so no show,',
      'A steady, undramatic, nightly flow,',
      'The log file and the night together grow,',
      'The hum drops half a tone and settles low,'
    ],
    /* 10 C */ [
      'and that is all there is to it, though,',
      'with nothing left to catch and none to throw,',
      'exactly as it was nine hours ago,',
      'a cabinet of little lamps aglow,',
      'a bucket filling slowly to overflow,',
      'a change the morning will not undergo,',
      'with no one here to thank and none to owe,',
      'with not one scrap of credit to bestow,',
      'with not a single duty to forgo,',
      'and it will still be running even so,'
    ],
    /* 11 D */ [
      'and morning comes in on a different sound.',
      'and somebody will come to do the round.',
      'and daylight finds it holding its own ground.',
      'and nothing will be lost that can be found.',
      'and whatever it began, it is still bound.',
      'and something in the mechanism, wound.',
      'and six floors down, the heating starts to pound.',
      'and no one comes to check that it is around.',
      'and patience is the only virtue of a hound.',
      'and by the door, a small forgotten mound.'
    ],
    /* 12 E */ [
      'It has no way of telling that it is time,',
      'Somewhere a clock it cannot read will chime,',
      'Nothing about the night was built to rhyme,',
      'The sun begins its slow, enormous climb,',
      'The number it was handed was a prime,',
      'The light comes in the colour of a lime,',
      'No one will call it artistry or crime,',
      'The window keeps its fingerprints and grime,',
      'It has not asked for so much as a dime,',
      'It does the work in silence, like a mime,'
    ],
    /* 13 D */ [
      'and nothing in the gesture is profound,',
      'and all of it goes on in the background,',
      'like roots, like cable, like the underground,',
      'and come the morning none of it is newfound,',
      'and not one bell is rung, no glad resound,',
      'and dark is not a threat but a surround,',
      'and small unimportant miracles abound,',
      'and failure here is taken on rebound,',
      'and it was never here to much astound,',
      'and hour upon hour the interest is compound,'
    ],
    /* 14 E */ [
      'though nobody would call the thing sublime.',
      'which is a word we use for overtime.',
      'and one long shift is all it calls a lifetime.',
      'and leaves whatever glory there is to daytime.',
      'and treats eternity as a mild pastime.',
      'and this is what is really meant by nighttime.',
      'and someone ought to thank it for that, sometime.',
      'as patient as a lamp that is maritime.',
      'as quiet as a window box of thyme.',
      'a small, uncomplaining, private clime.'
    ]
  ];

  /* ---------- state ---------- */

  var digits = new Array(LINES);
  var locked = new Array(LINES);
  for (var i = 0; i < LINES; i++) { digits[i] = 0; locked[i] = false; }

  var seen = Object.create(null);
  var seenCount = 0;
  var SEEN_CAP = 20000;   /* stop remembering strings long before it matters */

  var TOTAL = Math.pow(VARIANTS, LINES);   /* 1e14, exact in a double */

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* no matchMedia: assume motion is fine */ }

  /* ---------- the poem's number ----------
     The fourteen digits read left to right are a base-10 numeral, so the
     edition number is that value plus one. Written out rather than via
     parseInt so there is no doubt about the digit order. */

  function toNumber() {
    var n = 0;
    for (var i = 0; i < LINES; i++) n = n * VARIANTS + digits[i];
    return n + 1;
  }

  function fromNumber(n) {
    /* n is 1-based; wrap at both ends so Next/Previous never dead-end. */
    var v = ((n - 1) % TOTAL + TOTAL) % TOTAL;
    for (var i = LINES - 1; i >= 0; i--) {
      digits[i] = v % VARIANTS;
      v = Math.floor(v / VARIANTS);
    }
  }

  function key() { return digits.join(''); }

  /* ---------- DOM ---------- */

  var poemEl = root.querySelector('[data-qn="poem"]');
  var numberEl = root.querySelector('[data-qn="number"]');
  var statusEl = root.querySelector('[data-qn="status"]');
  var tallyEl = root.querySelector('[data-qn="tally"]');
  var centuriesEl = root.querySelector('[data-qn="centuries"]');
  if (!poemEl) return;

  var lineEls = [];
  var digitEls = [];
  var lockEls = [];

  function build() {
    /* The markup in index.html holds sonnet number one as a no-JS
       fallback. Replace it with the working strips. */
    poemEl.textContent = '';

    for (var i = 0; i < LINES; i++) {
      var li = document.createElement('li');
      li.className = 'qn-strip';

      var d = document.createElement('span');
      d.className = 'qn-digit';
      d.setAttribute('aria-hidden', 'true');
      li.appendChild(d);
      digitEls.push(d);

      var btn = document.createElement('button');
      btn.className = 'qn-line';
      btn.type = 'button';
      btn.setAttribute('data-strip', String(i));
      li.appendChild(btn);
      lineEls.push(btn);

      var lock = document.createElement('button');
      lock.className = 'qn-lock';
      lock.type = 'button';
      lock.setAttribute('data-strip', String(i));
      lock.setAttribute('aria-pressed', 'false');
      lock.title = 'Hold this line while the others shuffle';
      lock.innerHTML = '<span class="qn-lock-ico" aria-hidden="true"></span>' +
                       '<span class="sr-only">Hold line ' + (i + 1) + '</span>';
      li.appendChild(lock);
      lockEls.push(lock);

      poemEl.appendChild(li);
    }
  }

  function flash(el) {
    if (reduceMotion) return;
    el.classList.remove('qn-flip');
    /* reading offsetWidth forces the restart of the animation */
    void el.offsetWidth;
    el.classList.add('qn-flip');
  }

  function renderLine(i, animate) {
    var btn = lineEls[i];
    btn.textContent = VERSE[i][digits[i]];
    btn.setAttribute('aria-label',
      'Line ' + (i + 1) + ', variant ' + (digits[i] + 1) + ' of ' + VARIANTS +
      '. Activate for the next variant.');
    digitEls[i].textContent = String(digits[i]);
    if (animate) flash(btn);
  }

  var fmt = function (n) {
    try { return n.toLocaleString('en-US'); }
    catch (e) { return String(n); }
  };

  function renderNumber() {
    if (numberEl) {
      numberEl.innerHTML =
        '<span class="qn-num-k">Sonnet</span> ' +
        '<span class="qn-num-v">' + fmt(toNumber()) + '</span>' +
        '<span class="qn-num-of">of ' + fmt(TOTAL) + '</span>';
    }
  }

  function renderTally() {
    if (!tallyEl) return;
    /* Years left, at Queneau's own reading rate of 45 seconds a sonnet. */
    var left = (TOTAL - seenCount) * 45 / 31557600;
    tallyEl.textContent =
      'Read in this visit: ' + fmt(seenCount) +
      '. At 45 seconds each, ' + (Math.round(left / 1e5) / 10) +
      ' million years to go.';
  }

  function countSeen() {
    var k = key();
    if (seen[k]) return;
    if (seenCount < SEEN_CAP) seen[k] = true;
    seenCount++;
  }

  function render(animateAll, changed) {
    for (var i = 0; i < LINES; i++) {
      renderLine(i, animateAll || (changed && changed.indexOf(i) >= 0));
    }
    renderNumber();
    countSeen();
    renderTally();
    if (Daily.params) Daily.params.set('q', key());
  }

  /* ---------- interaction ---------- */

  function step(i, delta) {
    digits[i] = (digits[i] + delta + VARIANTS) % VARIANTS;
    renderLine(i, true);
    renderNumber();
    countSeen();
    renderTally();
    if (Daily.params) Daily.params.set('q', key());
  }

  function toggleLock(i) {
    locked[i] = !locked[i];
    lockEls[i].setAttribute('aria-pressed', locked[i] ? 'true' : 'false');
    lineEls[i].classList.toggle('is-held', locked[i]);
    say(locked[i] ? 'Line ' + (i + 1) + ' held.' : 'Line ' + (i + 1) + ' released.');
  }

  function say(msg) { if (statusEl) statusEl.textContent = msg; }

  function shuffle() {
    var changed = [];
    var any = false;
    for (var i = 0; i < LINES; i++) {
      if (locked[i]) continue;
      any = true;
      var next = digits[i];
      if (VARIANTS > 1) {
        /* a different variant, so every shuffle visibly does something */
        next = (digits[i] + 1 + Math.floor(Math.random() * (VARIANTS - 1))) % VARIANTS;
      }
      digits[i] = next;
      changed.push(i);
    }
    if (!any) { say('Every line is held. Release one to shuffle.'); return; }
    render(false, changed);
    say('Shuffled. Sonnet ' + fmt(toNumber()) + '.');
  }

  function jump(delta) {
    fromNumber(toNumber() + delta);
    render(true);
    say('Sonnet ' + fmt(toNumber()) + '.');
  }

  var Daily = window.Daily || {};

  function wire() {
    for (var i = 0; i < LINES; i++) {
      (function (idx) {
        lineEls[idx].addEventListener('click', function (ev) {
          step(idx, ev.shiftKey ? -1 : 1);
        });

        lineEls[idx].addEventListener('keydown', function (ev) {
          var k = ev.key;
          if (k === 'ArrowRight') { step(idx, 1); ev.preventDefault(); }
          else if (k === 'ArrowLeft') { step(idx, -1); ev.preventDefault(); }
          else if (k === 'ArrowDown' && idx < LINES - 1) { lineEls[idx + 1].focus(); ev.preventDefault(); }
          else if (k === 'ArrowUp' && idx > 0) { lineEls[idx - 1].focus(); ev.preventDefault(); }
          else if (k === 'l' || k === 'L') { toggleLock(idx); ev.preventDefault(); }
        });

        lockEls[idx].addEventListener('click', function () { toggleLock(idx); });
      })(i);
    }

    var btn = root.querySelector('[data-qn="shuffle"]');
    if (btn) btn.addEventListener('click', shuffle);

    var nextBtn = root.querySelector('[data-qn="next"]');
    if (nextBtn) nextBtn.addEventListener('click', function () { jump(1); });

    var prevBtn = root.querySelector('[data-qn="prev"]');
    if (prevBtn) prevBtn.addEventListener('click', function () { jump(-1); });

    var firstBtn = root.querySelector('[data-qn="first"]');
    if (firstBtn) firstBtn.addEventListener('click', function () {
      /* The ten sonnets as printed are the settings where every strip
         agrees: sonnet n is all fourteen digits at n-1. Held lines are
         still honoured, so say so rather than claiming a whole one. */
      var same = Math.floor(Math.random() * VARIANTS);
      var whole = true;
      for (var i = 0; i < LINES; i++) {
        if (locked[i]) { if (digits[i] !== same) whole = false; }
        else digits[i] = same;
      }
      render(true);
      say(whole
        ? 'Sonnet ' + (same + 1) + ' of the ten, exactly as printed.'
        : 'Strips set to ' + same + ', but a held line disagrees, so this is not one of the ten.');
    });

    if (Daily.wireCopy) {
      Daily.wireCopy(root.querySelector('[data-qn="copy"]'), statusEl);
    }
  }

  /* ---------- a shared sonnet in the URL ----------
     Untrusted: it is whatever was pasted. Fourteen digits or nothing. */

  function restore() {
    if (!Daily.params) return;
    var q = Daily.params.get('q');
    if (!q || !/^[0-9]{14}$/.test(q)) return;
    for (var i = 0; i < LINES; i++) digits[i] = Number(q.charAt(i));
  }

  /* ---------- the reading-time figure in the prose ---------- */

  function renderCenturies() {
    if (!centuriesEl) return;
    var centuries = TOTAL * 45 / 31557600 / 100;
    centuriesEl.textContent = fmt(Math.round(centuries));
  }

  build();
  restore();
  renderCenturies();
  render(false);
  wire();
  root.classList.add('qn-ready');
})();

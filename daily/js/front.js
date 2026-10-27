/* The front door — switching the pictures out of his paragraph
   ----------------------------------------------------------------------
   Added 2026-10-27.

   His bio is in the markup verbatim, as one run of text, because it has
   to be: it is the paragraph this page is not allowed to drop, and the
   grep that checks for it looks at the file rather than at the DOM. So
   this file does not hold a copy of it. It reads the paragraph off the
   page, cuts it at every pictograph, and puts it back as spans — which
   is the whole mechanism. Three views are then three display rules.

   If any of this fails, or the engine has no Unicode property escapes,
   it returns before touching anything and the controls stay hidden. The
   paragraph is then exactly what the HTML says, which is the point. */
(function () {
  'use strict';

  var bio = document.querySelector('[data-fd-bio]');
  var rig = document.querySelector('[data-fd-rig]');
  if (!bio || !rig) return;

  /* Built rather than written as a literal: a /\p{...}/u literal is a
     parse error, not a runtime one, in an engine that lacks the escape,
     and a parse error here would take the rest of the file with it. */
  var cut;
  try {
    cut = new RegExp('(\\p{Extended_Pictographic}\\uFE0F?)', 'gu');
  } catch (e) {
    return;
  }

  var source = bio.textContent;
  var parts = source.split(cut);
  if (parts.length < 3) return;

  /* split() with one capture group alternates text, capture, text, …
     so every odd index is a pictograph and every even index is prose.
     Empty strings between two adjacent emoji are dropped. */
  var pictures = 0;
  var frag = document.createDocumentFragment();

  parts.forEach(function (part, i) {
    if (!part) return;
    var span = document.createElement('span');
    if (i % 2) {
      span.className = 'fd-p';
      pictures++;
    } else {
      span.className = 'fd-w';
    }
    span.textContent = part;
    frag.appendChild(span);
  });

  bio.textContent = '';
  bio.appendChild(frag);

  /* Three captions. The claims in them are measured off the paragraph
     above rather than typed in: see the assertions below, which drop the
     control entirely rather than let a caption say something the text
     does not support. */
  var stops = (source.match(/\./g) || []).length;
  var commas = (source.match(/,/g) || []).length;

  /* Deliberately the same definition of a word as js/source.js, which is
     where the figure fifty-three on this page comes from: a run of
     letters or digits that may carry internal apostrophes, hyphens or
     dots, so the emoji, the brackets and the lone full stop count for
     nothing. Two sections quoting one paragraph must not be able to
     disagree about how long it is. */
  var words = (source.match(/[0-9A-Za-z][0-9A-Za-z'\u2019.\-]*/g) || []).length;

  if (pictures !== 11 || stops !== 1 || commas !== 1 || words !== 53) return;

  var says = {
    written:
      '<strong>Fifty-three words, eleven pictures, one full stop.</strong> ' +
      'His paragraph as it stands on his homepage, carried over character for character.',
    words:
      '<strong>The same fifty-three words with the eleven pictures taken out.</strong> ' +
      'Nothing now closes the sentence before <em>In my free time</em> &mdash; the robot and ' +
      'the thinking face were the full stop. The four things he does with that time have run ' +
      'together, because the plane, the flame and the microphone were the commas. In fifty-three ' +
      'words he typed one full stop, one comma and one exclamation mark; the other eleven marks ' +
      'of punctuation in here are pictures.',
    pictures:
      '<strong>The eleven he chose, in the order he chose them.</strong> ' +
      'A wave, a pine, rain, two hearts, a robot, a thinking face, a plane, a flame, a ' +
      'microphone, a floppy disk. Six of his seven clauses end on one of these; the seventh ' +
      'ends on the only full stop in the paragraph.'
  };

  var picks = [].slice.call(rig.querySelectorAll('[data-fd-view]'));
  var say = rig.querySelector('[data-fd-say]');
  if (!picks.length || !say) return;

  function show(view) {
    bio.setAttribute('data-view', view);
    picks.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-fd-view') === view));
    });
    say.innerHTML = says[view] || '';
  }

  picks.forEach(function (b) {
    b.addEventListener('click', function () {
      show(b.getAttribute('data-fd-view'));
    });
  });

  /* Reserve the tallest of the three so switching view does not shunt
     the page under the reader's thumb. Measured, because the tallest
     one depends on the viewport and on which font actually loaded. */
  function reserve() {
    bio.style.minHeight = '';
    say.style.minHeight = '';
    var tallBio = 0;
    var tallSay = 0;
    ['written', 'words', 'pictures'].forEach(function (v) {
      bio.setAttribute('data-view', v);
      say.innerHTML = says[v];
      tallBio = Math.max(tallBio, bio.offsetHeight);
      tallSay = Math.max(tallSay, say.offsetHeight);
    });
    bio.style.minHeight = tallBio + 'px';
    say.style.minHeight = tallSay + 'px';
  }

  var pending;
  function remeasure() {
    clearTimeout(pending);
    pending = setTimeout(function () {
      var was = bio.getAttribute('data-view');
      reserve();
      show(was);
    }, 150);
  }

  show('written');
  reserve();
  show('written');
  rig.hidden = false;

  window.addEventListener('resize', remeasure);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(remeasure);
  }
})();

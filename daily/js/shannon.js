/* Shannon's guessing game
   ======================================================================
   Added 2026-10-05.

   In 1951 Claude Shannon wanted to know how much information an English
   letter actually carries. He could not ask a machine, so he used his
   wife Mary. He showed her a text one letter at a time and had her guess
   the next, recording how many attempts each letter took, and wrote down
   nothing but that sequence of numbers.

   The trick is that the numbers are enough. Given an identical guesser,
   you can rebuild the original text from the ranks alone — so the text is
   a function of the ranks, and H(text) <= H(ranks). Measure the entropy
   of the guess-rank distribution and you have bounded the entropy of
   English without ever modelling English.

   His answer was roughly 0.6 to 1.3 bits per letter, against the 4.75
   bits you would need if all 27 symbols were equally likely. That gap is
   redundancy, and it is the reason text compresses — and, eventually, the
   reason next-token prediction turned out to be worth doing at all.

   This is that experiment, with you as Mary.
*/
(function () {
  'use strict';

  var root = document.getElementById('shannon');
  if (!root) return;

  var PASSAGES = [
    { id: 'shannon',
      cite: 'The sentence Shannon used in the 1951 paper',
      text: 'THE ROOM WAS NOT VERY LIGHT A SMALL OBLONG READING LAMP ON THE DESK SHED GLOW ON POLISHED WOOD' },
    { id: 'melville',
      cite: 'Herman Melville, Moby-Dick (1851)',
      text: 'CALL ME ISHMAEL SOME YEARS AGO NEVER MIND HOW LONG PRECISELY HAVING LITTLE OR NO MONEY IN MY PURSE' },
    { id: 'austen',
      cite: 'Jane Austen, Pride and Prejudice (1813)',
      text: 'IT IS A TRUTH UNIVERSALLY ACKNOWLEDGED THAT A SINGLE MAN IN POSSESSION OF A GOOD FORTUNE MUST BE IN WANT OF A WIFE' }
  ];

  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';

  var textEl   = root.querySelector('[data-sh="text"]');
  var triedEl  = root.querySelector('[data-sh="tried"]');
  var input    = root.querySelector('[data-sh="input"]');
  var statusEl = root.querySelector('[data-sh="status"]');
  var citeEl   = root.querySelector('[data-sh="cite"]');
  var pickEl   = root.querySelector('[data-sh="passage"]');
  var skipBtn  = root.querySelector('[data-sh="skip"]');
  var resetBtn = root.querySelector('[data-sh="reset"]');

  var stats = {
    letters: root.querySelector('[data-stat="letters"]'),
    avg:     root.querySelector('[data-stat="avg"]'),
    first:   root.querySelector('[data-stat="first"]'),
    bits:    root.querySelector('[data-stat="bits"]')
  };

  var passage, pos, ranks, tried, attempts;

  function load(id) {
    passage = PASSAGES.filter(function (p) { return p.id === id; })[0] || PASSAGES[0];
    pos = 0;
    ranks = [];       /* how many guesses each solved letter took */
    tried = [];       /* wrong guesses for the current letter */
    attempts = 0;
    if (citeEl) citeEl.textContent = passage.cite;
    render();
    update();
    say('Guess the first letter. It is a letter or a space.');
  }

  function say(t) { if (statusEl) statusEl.textContent = t; }

  function render() {
    var done = passage.text.slice(0, pos);
    var rest = passage.text.length - pos - 1;

    textEl.textContent = '';

    var spanDone = document.createElement('span');
    spanDone.className = 'sh-done';
    spanDone.textContent = done;
    textEl.appendChild(spanDone);

    if (pos < passage.text.length) {
      var cur = document.createElement('span');
      cur.className = 'sh-cursor';
      cur.textContent = '█';
      textEl.appendChild(cur);
    }

    if (rest > 0) {
      var hidden = document.createElement('span');
      hidden.className = 'sh-hidden';
      /* Length is not a secret — Shannon's subject could see the text's
         shape too — but the letters are. */
      hidden.textContent = passage.text.slice(pos + 1).replace(/[A-Z]/g, '·');
      textEl.appendChild(hidden);
    }

    triedEl.textContent = tried.length ? tried.join(' ') : '';
    triedEl.hidden = !tried.length;
  }

  /* H = -sum p log2 p over the guess-rank distribution. Because the text
     is recoverable from the ranks, this is an upper bound on the entropy
     of the text itself — which is the whole move. */
  function entropy() {
    if (!ranks.length) return null;
    var counts = {};
    ranks.forEach(function (r) { counts[r] = (counts[r] || 0) + 1; });
    var h = 0;
    for (var k in counts) {
      var p = counts[k] / ranks.length;
      h -= p * Math.log(p) / Math.LN2;
    }
    return h;
  }

  function update() {
    var n = ranks.length;
    stats.letters.textContent = n + ' / ' + passage.text.length;
    if (!n) {
      stats.avg.textContent = '—';
      stats.first.textContent = '—';
      stats.bits.textContent = '—';
      return;
    }
    var total = ranks.reduce(function (a, b) { return a + b; }, 0);
    var firsts = ranks.filter(function (r) { return r === 1; }).length;
    stats.avg.textContent = (total / n).toFixed(2);
    stats.first.textContent = Math.round(firsts / n * 100) + '%';
    var h = entropy();
    stats.bits.textContent = h === null ? '—' : h.toFixed(2);
  }

  function advance(rank) {
    ranks.push(rank);
    pos++;
    tried = [];
    attempts = 0;
    render();
    update();
    if (pos >= passage.text.length) {
      var h = entropy();
      say('Done. ' + (h !== null ? h.toFixed(2) + ' bits per letter — Shannon got 0.6 to 1.3.' : ''));
      input.disabled = true;
    }
  }

  function guess(ch) {
    if (pos >= passage.text.length) return;
    ch = ch.toUpperCase();
    if (ALPHABET.indexOf(ch) === -1) return;

    var want = passage.text[pos];
    attempts++;

    if (ch === want) {
      say(attempts === 1 ? 'First try.' : 'Got it in ' + attempts + '.');
      advance(attempts);
      return;
    }

    if (tried.indexOf(ch === ' ' ? '␣' : ch) === -1) tried.push(ch === ' ' ? '␣' : ch);
    render();
    say('No — ' + attempts + ' so far on this letter.');
  }

  /* A real <input> rather than a key listener on the document: it works
     with a phone keyboard, it never swallows the page's own shortcuts,
     and Tab leaves it like any other field. */
  input.addEventListener('input', function () {
    var v = input.value;
    input.value = '';
    if (v) guess(v[v.length - 1]);
  });

  /* Space in a text input does not scroll the page, but it also does not
     fire a useful `input` on some browsers until something else is typed,
     so take it on keydown. */
  input.addEventListener('keydown', function (e) {
    if (e.key === ' ') { e.preventDefault(); guess(' '); }
  });

  skipBtn.addEventListener('click', function () {
    if (pos >= passage.text.length) return;
    /* Revealing counts as the worst case: 27 symbols, so rank 27. */
    say('Revealed "' + (passage.text[pos] === ' ' ? 'space' : passage.text[pos]) + '" — counted as 27 guesses.');
    advance(27);
    input.focus();
  });

  resetBtn.addEventListener('click', function () {
    input.disabled = false;
    load(pickEl.value);
    input.focus();
  });

  pickEl.addEventListener('change', function () {
    input.disabled = false;
    load(pickEl.value);
  });

  load(pickEl.value);
  root.classList.add('sh-ready');
})();

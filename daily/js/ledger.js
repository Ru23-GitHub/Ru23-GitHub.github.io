/* Where This Page Gets Him — the provenance highlighter.
   ----------------------------------------------------------------------
   Added 2026-10-07. Scoped to #ledger for its controls; it reads and
   classes [data-from] blocks across the content sections listed in
   SCOPE below. #north joined them on 2026-10-08.

   The page carries a rule it cannot demonstrate on its own: an agent
   writes it, and the agent may not invent facts about Ruslan. Every
   content block is therefore tagged with one of three provenances —

     site   his own published portfolio at the root of this domain
     email  what he has told this build directly, by email
     agent  everything the machine wrote, drew or computed

   — and this file both measures that split and lets you see it.

   Two things here are deliberate rather than incidental:

   The word counts are derived from the DOM at load, never written into
   the prose. A hard-coded "8%" would be true for one commit and quietly
   false after the next one; a measured number is true or the check
   below fails.

   And the check below exists at all because the numbers are only as
   honest as the tagging. An untagged paragraph is invisible to the
   count, which is exactly the failure mode that would flatter the
   agent — so audit() walks the same sections looking for visible
   text with no tagged owner, and reports it. It is exposed on
   window.__ledger rather than run as an assertion so the page never
   breaks over it, but the build runs it before every commit. */
(function () {
  'use strict';

  var section = document.getElementById('ledger');
  if (!section) return;

  var SCOPE = ['about', 'north', 'shelf', 'booth', 'threshold', 'ledger', 'contact'];
  var KINDS = ['site', 'email', 'agent'];

  var LABEL = {
    site: 'his own site',
    email: 'his emails',   /* plural since 7 Oct; it stays true as more arrive */
    agent: 'the agent'
  };

  /* A word is a run of letters or digits, optionally carrying internal
     apostrophes, hyphens or dots: "Ruslan", "AI/LLM" counts as two,
     "4.19" as one, and an em-dash as none. */
  var WORD = /[0-9A-Za-z][0-9A-Za-z'’.\-]*/g;

  function words(str) {
    var m = str.match(WORD);
    return m ? m.length : 0;
  }

  /* Anything inside a [hidden] subtree is a fallback for the other
     branch of this same content — the Line's no-JS paragraph and its
     rig, for instance — so counting both would count one explanation
     twice. */
  function visible(el) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      if (n.hasAttribute && n.hasAttribute('hidden')) return false;
    }
    return true;
  }

  function roots() {
    var out = [];
    for (var i = 0; i < SCOPE.length; i++) {
      var el = document.getElementById(SCOPE[i]);
      if (el) out.push(el);
    }
    return out;
  }

  function walkText(root, fn) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var t;
    while ((t = w.nextNode())) fn(t);
  }

  /* ---------- measure ---------- */

  function measure() {
    var total = { site: 0, email: 0, agent: 0 };
    var blocks = { site: 0, email: 0, agent: 0 };
    var seen = [];

    roots().forEach(function (root) {
      walkText(root, function (t) {
        var n = words(t.nodeValue);
        if (!n) return;
        var host = t.parentElement;
        if (!host) return;
        var owner = host.closest('[data-from]');
        if (!owner) return;
        var kind = owner.getAttribute('data-from');
        if (KINDS.indexOf(kind) === -1) return;
        if (!visible(owner)) return;
        total[kind] += n;
        if (seen.indexOf(owner) === -1) {
          seen.push(owner);
          blocks[kind] += 1;
        }
      });
    });

    return { words: total, textBlocks: blocks };
  }

  /* Visible text in the scoped sections with no [data-from] owner. Every
     entry here is a word the bar is silently not counting. */
  function audit() {
    var leaks = [];
    roots().forEach(function (root) {
      walkText(root, function (t) {
        if (!words(t.nodeValue)) return;
        var host = t.parentElement;
        if (!host) return;
        if (host.closest('svg')) return;
        if (host.closest('[data-from]')) return;
        /* [data-chrome] is furniture, not prose: live readouts a script
           rewrites, control labels, ordinals, a chart legend. It is
           deliberately untagged — some of it has no fixed provenance at
           all, since the booth's screen prints his song titles into the
           agent's own layout — so it is excluded from the count rather
           than attributed to whichever side would flatter the total. It
           is not a leak. */
        if (host.closest('[data-chrome]')) return;
        if (!visible(host)) return;
        leaks.push({
          text: t.nodeValue.replace(/\s+/g, ' ').trim().slice(0, 70),
          where: root.id,
          tag: host.tagName.toLowerCase() + (host.className ? '.' + String(host.className).split(/\s+/)[0] : '')
        });
      });
    });
    return leaks;
  }

  /* ---------- the controls ---------- */

  var rig = section.querySelector('.led-rig');
  var nojs = section.querySelector('.led-nojs');
  var picks = section.querySelectorAll('.led-pick');
  var status = section.querySelector('[data-led-status]');
  var steppers = section.querySelectorAll('[data-step]');
  var clearBtn = section.querySelector('[data-clear]');

  var active = null;   // the picked provenance, or null
  var matches = [];    // its blocks, in document order
  var at = -1;         // which one Previous/Next is parked on

  var reduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function allTagged() {
    var out = [];
    roots().forEach(function (root) {
      var list = root.querySelectorAll('[data-from]');
      for (var i = 0; i < list.length; i++) {
        if (KINDS.indexOf(list[i].getAttribute('data-from')) !== -1) out.push(list[i]);
      }
    });
    return out;
  }

  function paint() {
    var all = allTagged();
    matches = [];

    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      /* A hidden block is the unused half of a fallback pair; classing it
         would make the class count and the match count disagree over
         something nobody can see either way. */
      var shown = visible(el);
      var hit = !!active && shown && el.getAttribute('data-from') === active;
      el.classList.toggle('led-on', hit);
      el.classList.toggle('led-off', !!active && shown && !hit);
      el.classList.remove('led-cur');
      if (hit) matches.push(el);
    }

    if (at >= matches.length) at = matches.length - 1;
    if (at >= 0 && matches[at]) matches[at].classList.add('led-cur');

    for (var j = 0; j < picks.length; j++) {
      picks[j].setAttribute('aria-pressed',
        picks[j].getAttribute('data-pick') === active ? 'true' : 'false');
    }

    var none = !active;
    for (var k = 0; k < steppers.length; k++) steppers[k].disabled = none || matches.length < 2;
    if (clearBtn) clearBtn.disabled = none;
  }

  function say(msg) { if (status) status.textContent = msg; }

  function describe() {
    if (!active) {
      say('Nothing picked. The whole page is lit.');
      return;
    }
    var m = measured.words[active];
    var share = Math.round((m / grand) * 1000) / 10;
    var where = matches.length + (matches.length === 1 ? ' block' : ' blocks');
    var pos = at >= 0 ? ' Showing ' + (at + 1) + ' of ' + matches.length + '.' : '';
    say(num(m) + ' words from ' + LABEL[active] + ', across ' + where +
        ' — ' + share + '% of the page.' + pos);
  }

  function jump(delta) {
    if (!matches.length) return;
    at = at < 0
      ? (delta > 0 ? 0 : matches.length - 1)
      : (at + delta + matches.length) % matches.length;
    paint();
    var el = matches[at];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({
        block: 'center',
        behavior: (reduced && reduced.matches) ? 'auto' : 'smooth'
      });
    }
    describe();
  }

  function pick(kind) {
    active = (active === kind) ? null : kind;
    at = -1;
    paint();
    /* Picking a source parks on its first block and scrolls there. Without
       this the only visible effect of a click is that the section you are
       standing in goes quiet, since every block in this one is the
       agent's and the others are further up the page. */
    if (active && matches.length) jump(1);
    else describe();
  }

  for (var i = 0; i < picks.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () { pick(btn.getAttribute('data-pick')); });
    })(picks[i]);
  }

  for (var s = 0; s < steppers.length; s++) {
    (function (btn) {
      btn.addEventListener('click', function () { jump(Number(btn.getAttribute('data-step')) || 1); });
    })(steppers[s]);
  }

  if (clearBtn) clearBtn.addEventListener('click', function () {
    active = null; at = -1; paint(); describe();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && active) { active = null; at = -1; paint(); describe(); }
  });

  if (reduced && reduced.addEventListener) {
    /* Nothing to re-render — jump() reads the query at call time — but the
       listener keeps the media query live for browsers that only update
       .matches while something is subscribed. */
    reduced.addEventListener('change', function () {});
  }

  /* ---------- wire up ---------- */

  if (nojs) nojs.hidden = true;
  if (rig) rig.removeAttribute('hidden');

  var measured = measure();
  var grand = measured.words.site + measured.words.email + measured.words.agent;

  for (var b = 0; b < picks.length; b++) {
    var kind = picks[b].getAttribute('data-pick');
    var out = picks[b].querySelector('[data-n]');
    if (out) out.textContent = num(measured.words[kind]) + ' w';
  }

  var segs = section.querySelectorAll('.led-seg');
  for (var g = 0; g < segs.length; g++) {
    var k = segs[g].getAttribute('data-seg');
    segs[g].style.flex = '0 1 ' + ((measured.words[k] / grand) * 100).toFixed(2) + '%';
  }

  paint();
  describe();

  window.__ledger = {
    KINDS: KINDS,
    measure: measure,
    audit: audit,
    words: measured.words,
    textBlocks: measured.textBlocks,
    grand: grand,
    pick: pick,
    jump: jump,
    matched: function () { return matches.slice(); }
  };
})();

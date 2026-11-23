/* The Night — 16 · the two evenings he built his own site
   ----------------------------------------------------------------------
   Added 2026-11-23.

   Seven commits, frozen. Every figure in this section comes out of
   git log --author=Ruslan --numstat over f3c3691..e220507, and unlike
   almost everything else this page types into its markup, none of it
   can go stale: those commits are in the published history and will
   never change. The page has been bitten four separate times by a
   hand-typed figure that measured something still moving — the loader's
   byte totals, The Handover's line numbers — and the distinction worth
   drawing is not "typed versus measured" but "frozen versus moving".
   This is the frozen kind. The arithmetic is still checked, below.

   What is NOT typed in here: a single word of his. His paragraph, his
   six skills and his three contact labels are read out of the About
   section already in the document, so this section holds no second copy
   of his writing. The strings it does hold are the template placeholders
   he replaced — "[Add your bio here …]", "Skill one", "you@example.com",
   "GitHub" — which are not his words and exist nowhere on the live site.

   One acknowledgement. The fact that his bio read "[Add your bio here]"
   in his first commit is not new to this page: it was finding 18, The
   Guard, deleted on 9 November 2026 with eight other sections that were
   close readings of his files rather than of him, and it survives in a
   comment at the top of js/load.js. That section's subject was the
   defensive clauses in his hero's code. This one's subject is the order
   he presented himself in, read off his commits, which is the same
   source The Handover uses and was kept for. The overlap is one fact,
   and it is credited where it stands. */
(function () {
  'use strict';

  var section = document.getElementById('night');
  if (!section) return;

  var list = section.querySelector('[data-ng-list]');
  var rig = section.querySelector('[data-ng-rig]');
  var fold = section.querySelector('[data-ng-fold]');
  if (!list || !rig) return;

  var steps = [].slice.call(list.querySelectorAll('[data-ng-step]'));
  if (steps.length < 2) return;

  /* ---------- his words, read rather than copied ----------

     About is two sections up and is the page's one true showing of his
     paragraph. If any of these is missing the rig does not run: a
     section whose whole point is watching placeholders become him has
     nothing to show without him. */
  var bioEl = document.querySelector('[data-fd-bio]');
  var skillEls = document.querySelectorAll('#about .skills-list li');
  var mailEl = document.querySelector('#about a[href^="mailto:"]');
  var reachEls = document.querySelectorAll('#about .fd-reach-list a');

  var problems = [];
  if (!bioEl) problems.push('his bio was not found in About');
  if (skillEls.length !== 6) problems.push('expected six skills in About, found ' + skillEls.length);
  if (!mailEl) problems.push('his mailto link was not found in About');
  if (reachEls.length !== 3) problems.push('expected three contact links in About, found ' + reachEls.length);
  if (problems.length) {
    window.__night = { problems: problems, audit: function () { return { problems: problems }; } };
    return;
  }

  var hisBio = bioEl.textContent.replace(/\s+/g, ' ').trim();
  var hisSkills = [].map.call(skillEls, function (li) { return li.textContent.trim(); });
  var hisLabels = [].map.call(reachEls, function (a) { return a.textContent.trim(); });
  var hisAddress = mailEl.getAttribute('href').replace(/^mailto:/, '');

  /* ---------- the template's words, which are not his ---------- */
  var TPL = {
    bio: '[Add your bio here — a couple of paragraphs about who you are, what you do, and what you’re into.]',
    skills: ['Skill one', 'Skill two', 'Skill three', 'Skill four'],
    links: ['you@example.com', 'LinkedIn', 'GitHub'],
    resume: 'href="#", with a comment beside it: TODO: replace href with the real resume link'
  };

  var RESUME = {
    placeholder: TPL.resume,
    first: 'a Google Drive link — file 1P4Ve9u1…',
    current: 'a different Google Drive link — file 1zDf8V-q…'
  };

  /* ---------- the seven states, read off the list ---------- */
  function num(el, name) {
    var v = parseInt(el.getAttribute(name), 10);
    return isNaN(v) ? null : v;
  }

  var data = steps.map(function (li) {
    return {
      at: (li.getAttribute('data-at') || '').trim(),
      gap: (li.getAttribute('data-gap') || '').trim(),
      sha: (li.getAttribute('data-sha') || '').trim(),
      ins: num(li, 'data-ins'),
      del: num(li, 'data-del'),
      lines: num(li, 'data-lines'),
      bio: li.getAttribute('data-bio') || 'placeholder',
      skills: li.getAttribute('data-skills') || 'placeholder',
      links: li.getAttribute('data-links') || 'placeholder',
      resume: li.getAttribute('data-resume') || 'placeholder',
      subject: (li.querySelector('.ng-subject') || {}).textContent || '',
      note: (li.querySelector('.ng-note') || {}).innerHTML || ''
    };
  });

  /* ---------- the arithmetic, checked before anything is drawn ----------

     Three typed numbers per step and they have to agree with each other:
     a step's cumulative line total must be the previous one plus what it
     added minus what it took away. If they do not agree, one of them was
     mistyped, and the rig says so rather than drawing a shape built on
     it. This is the whole of what can go wrong with a frozen figure. */
  var checks = [];
  data.forEach(function (d, i) {
    if (d.ins === null || d.del === null || d.lines === null) {
      problems.push('step ' + (i + 1) + ' is missing a figure');
      return;
    }
    var want = i === 0 ? d.ins - d.del : data[i - 1].lines + d.ins - d.del;
    checks.push({ step: i + 1, sha: d.sha, typed: d.lines, implied: want, agreed: d.lines === want });
    if (d.lines !== want) {
      problems.push('step ' + (i + 1) + ' (' + d.sha + ') says ' + d.lines +
        ' lines, but its own +' + d.ins + '/−' + d.del + ' implies ' + want);
    }
  });

  var totals = data.reduce(function (a, d, i) {
    if (i === 0) return a;
    a.ins += d.ins; a.del += d.del; return a;
  }, { ins: 0, del: 0 });

  var peak = 0;
  data.forEach(function (d, i) { if (d.lines > data[peak].lines) peak = i; });

  window.__night = {
    steps: data,
    checks: checks,
    problems: problems,
    peak: peak,
    audit: function () {
      return {
        problems: problems,
        lineArithmetic: checks,
        perCommitSumAfterTheFirst: totals,
        largestAtStep: peak + 1,
        hisWordsRead: {
          /* The page's word rule, the one finding 01 counts his bio
             with: a whitespace-separated run containing at least one
             letter or digit. A naive split counts his eleven emoji as
             words and reports 61 where the rest of the page says 53. */
          bioWords: hisBio.split(/\s+/).filter(function (t) {
            return /[\p{L}\p{N}]/u.test(t);
          }).length,
          skills: hisSkills.length,
          contactLabels: hisLabels
        }
      };
    }
  };

  if (problems.length) return;

  /* ---------- the rig ---------- */
  var strip = rig.querySelector('[data-ng-strip]');
  var slider = rig.querySelector('[data-ng-slider]');
  var at = rig.querySelector('[data-ng-at]');
  var gap = rig.querySelector('[data-ng-gap]');
  var sha = rig.querySelector('[data-ng-sha]');
  var subject = rig.querySelector('[data-ng-subject]');
  var diff = rig.querySelector('[data-ng-diff]');
  var note = rig.querySelector('[data-ng-note]');
  var read = rig.querySelector('[data-ng-read]');
  var slots = {
    bio: rig.querySelector('[data-ng-slot="bio"]'),
    resume: rig.querySelector('[data-ng-slot="resume"]'),
    skills: rig.querySelector('[data-ng-slot="skills"]'),
    links: rig.querySelector('[data-ng-slot="links"]')
  };
  if (!strip || !slider || !at || !subject || !slots.bio) return;

  /* The bars. Heights are proportional to the part of the range the
     seven actually occupy — 520 to 549 — because drawn from zero the
     difference between the smallest and the largest is five per cent of
     the bar and the shape disappears. The caption says so, and the
     scale under the strip prints both ends. */
  var lo = Math.min.apply(null, data.map(function (d) { return d.lines; }));
  var hi = Math.max.apply(null, data.map(function (d) { return d.lines; }));
  var span = hi - lo || 1;

  var bars = data.map(function (d, i) {
    var b = document.createElement('span');
    b.className = 'ng-bar';
    b.style.height = (18 + ((d.lines - lo) / span) * 82) + '%';
    if (i === peak) b.setAttribute('data-peak', '1');
    strip.appendChild(b);
    return b;
  });

  function inlineList(items) {
    var ul = document.createElement('ul');
    ul.className = 'ng-list-inline';
    items.forEach(function (t) {
      var el = document.createElement('li');
      el.textContent = t;
      ul.appendChild(el);
    });
    return ul;
  }

  function setSlot(slot, kind, render) {
    if (!slot) return;
    slot.setAttribute('data-kind', kind === 'placeholder' ? 'placeholder' : 'his');
    var v = slot.querySelector('.ng-slot-v');
    if (!v) return;
    v.textContent = '';
    render(v);
  }

  var LINKS = {
    placeholder: TPL.links,
    raw: [hisAddress, hisLabels[1], hisLabels[2]],
    his: hisLabels
  };

  function show(i) {
    var d = data[i];

    bars.forEach(function (b, n) { b.setAttribute('data-on', n <= i ? '1' : '0'); });

    at.textContent = d.at;
    gap.textContent = d.gap;
    gap.hidden = !d.gap;
    if (sha) sha.textContent = d.sha;
    subject.textContent = d.subject.trim();
    if (diff) {
      diff.innerHTML = '<span class="ng-plus">+' + d.ins + '</span>' +
        '<span class="ng-minus">−' + d.del + '</span>' +
        '<span>' + d.lines + ' lines standing</span>';
    }
    if (note) note.innerHTML = d.note;

    setSlot(slots.bio, d.bio, function (v) {
      v.textContent = d.bio === 'placeholder' ? TPL.bio : hisBio;
    });

    setSlot(slots.resume, d.resume, function (v) {
      v.textContent = RESUME[d.resume] || RESUME.placeholder;
    });

    setSlot(slots.skills, d.skills, function (v) {
      var items = d.skills === 'placeholder' ? TPL.skills : hisSkills;
      v.appendChild(inlineList(items));
    });

    setSlot(slots.links, d.links, function (v) {
      var items = LINKS[d.links] || LINKS.placeholder;
      var ul = document.createElement('ul');
      ul.className = 'ng-list-inline';
      items.forEach(function (t, n) {
        var el = document.createElement('li');
        /* The two that changed and are worth seeing change: the third
           link, where the template offered GitHub, and the first, which
           was his address written out before it was one word. */
        var moved = (n === 2 && d.links !== 'placeholder') ||
                    (n === 0 && d.links === 'raw');
        if (moved) {
          var mark = document.createElement('span');
          mark.className = 'ng-swap';
          mark.textContent = t;
          el.appendChild(mark);
        } else {
          el.textContent = t;
        }
        ul.appendChild(el);
      });
      v.appendChild(ul);
    });

    if (read) {
      read.textContent = 'Commit ' + (i + 1) + ' of ' + data.length + ' — ' +
        d.at + ', ' + d.lines + ' lines standing.';
    }
    slider.setAttribute('aria-valuetext', 'Commit ' + (i + 1) + ' of ' + data.length +
      ', ' + d.at + '. ' + d.subject.trim());
  }

  slider.min = 0;
  slider.max = String(data.length - 1);
  slider.step = 1;
  slider.value = '0';
  slider.addEventListener('input', function () { show(parseInt(slider.value, 10) || 0); });

  show(0);

  /* Last, so the rig is never shown half-built, and the prose list is
     folded only once there is something to fold it behind. */
  rig.hidden = false;
  if (fold) fold.hidden = false;
  if (fold && fold.appendChild) {
    fold.appendChild(list);
    fold.open = false;
  }
}());

/* Ask about Ruslan — a question box that is deliberately not a model
   ----------------------------------------------------------------------
   Added 2026-11-13. Scoped entirely to #known.

   The page below this box is forty-eight phone screens long and every
   section on it is titled "The Source", "The Shelf", "The Line" —
   codenames that tell an arriving visitor nothing about the person. A
   stranger who wants one plain fact about Ruslan has to read an essay
   first, or guess which codename hides it.

   So: type a question, get the answer, with the source it came from and
   a way down to the section that shows the working.

   What this is, stated plainly because the distinction is the whole
   point of building it this way: a lookup table. Every answer below is
   a string written by hand from a finding that is already on this page,
   with the source it is allowed to claim attached to it. The matching
   is keyword scoring over that table — no model, no network, no
   generation. It therefore cannot produce a sentence about Ruslan that
   nobody checked, which is the single thing this page is forbidden to
   do. The failure mode of a lookup table is "I don't have that". The
   failure mode of the other kind of answer box is a confident sentence
   about a real person that is not true.

   That is also why the unknowns are in the table as entries rather than
   left to the fallback. Ask it whether he cooks and it will tell you
   that his bio says he is learning to, that he was asked for one real
   dish on 8 October 2026, that he has not answered, and that the page
   is not permitted to fill the gap in. An empty answer with its reason
   attached is a real answer. A plausible one is not.

   Keyboard: the input takes Enter, the chips are buttons, the answer
   lands in a polite live region. Nothing here animates except a 160ms
   fade on the answer, which prefers-reduced-motion turns off. */
(function () {
  'use strict';

  var root = document.getElementById('known');
  if (!root) return;

  var rig = root.querySelector('[data-ask-rig]');
  var input = root.querySelector('[data-ask-input]');
  var out = root.querySelector('[data-ask-out]');
  var chipBox = root.querySelector('[data-ask-chips]');
  var goBtn = root.querySelector('[data-ask-go]');
  var nojs = root.querySelector('.ask-nojs');
  if (!rig || !input || !out || !chipBox) return;

  /* ---------- the sources an answer may claim ----------
     The same three the findings index uses, plus the fourth that is the
     honest answer to most questions anyone would think to ask. */

  var SRC = {
    bio:   'His bio',
    email: 'He told me',
    repo:  'His repo',
    none:  'Not known'
  };

  /* ---------- the table ----------
     weight, phrase. A phrase is matched on word boundaries against the
     normalised question, so 'cook' does not fire on 'cookie' and
     'where does he work' outscores the bare 'work' it contains.

     Every `a` below restates something already written further down this
     page. Nothing in here is a new claim, and nothing in here is
     generated. */

  var ENTRIES = [
    {
      id: 'who',
      keys: [[6,'who is he'],[6,'who is ruslan'],[5,'tell me about'],[5,'about him'],[4,'his bio'],[3,'summary'],[3,'introduce'],[2,'bio'],[2,'who']],
      src: 'bio',
      a: 'In his own fifty-three words: &ldquo;Hi I&rsquo;m Ruslan! 👋 I&rsquo;m from Portland OR but now live in Seattle WA 🌲🌧️ (the PNW has my heart 💚💙). I&rsquo;m interested in exploring the societal impacts of AI tools, for better or worse 🤖🤔 In my free time I enjoy traveling ✈️ learning to cook without blowing up the kitchen 🔥 bad karaoke 🎤 and collecting retro tech 💾&rdquo; That paragraph is the whole of what he has written about himself here.',
      go: ['#source', 'The Source']
    },
    {
      id: 'name',
      keys: [[6,'what is his name'],[5,'his name'],[3,'called'],[2,'name']],
      src: 'bio',
      a: 'Ruslan Manoharan. It is spelled eight different ways across the places he has put it on this domain, and no two of the eight are the same string.',
      go: ['#contact', 'The Doors']
    },
    {
      id: 'where',
      keys: [[6,'where does he live'],[6,'where is he from'],[5,'where does he'],[4,'where is he'],[4,'seattle'],[4,'portland'],[4,'pnw'],[4,'pacific northwest'],[3,'lives'],[3,'live'],[3,'city'],[3,'based'],[3,'oregon'],[3,'washington'],[2,'where'],[2,'from'],[2,'moved'],[2,'move']],
      src: 'bio',
      a: 'He is from Portland, Oregon and now lives in Seattle, Washington &mdash; about 175 miles north up I&#8209;5. He says the Pacific Northwest has his heart, and the drive between the two crosses a state line in the first few minutes and then changes essentially nothing else.',
      go: ['#north', 'The Drive']
    },
    {
      id: 'retro',
      keys: [[6,'what does he collect'],[5,'retro tech'],[4,'collect'],[4,'collects'],[4,'collecting'],[4,'game boy'],[4,'gameboy'],[4,'nintendo'],[4,'walkman'],[4,'handheld'],[4,'handhelds'],[3,'console'],[3,'consoles'],[3,'shelf'],[3,'gadgets'],[2,'retro'],[2,'old tech']],
      src: 'email',
      a: 'A Walkman and five Nintendo handhelds: the Game&nbsp;Boy, the Game&nbsp;Boy Color, the Game&nbsp;Boy Advance, the Advance&nbsp;SP and the DS. He named them by email on 5&nbsp;October 2026, when he was asked what was actually on the shelf &mdash; the page had been guessing at famous machines he does not own.',
      go: ['#shelf', 'The Shelf']
    },
    {
      id: 'karaoke',
      keys: [[6,'what does he sing'],[5,'favourite song'],[5,'favorite song'],[4,'karaoke'],[4,'sings'],[4,'sing'],[4,'singing'],[4,'keshi'],[4,'setlist'],[3,'songs'],[3,'song'],[3,'music'],[3,'band'],[2,'favourite'],[2,'favorite']],
      src: 'email',
      a: 'He calls his own karaoke bad &mdash; his word, in his bio. Asked which songs, he gave four: <em>Sugar</em> by BROCKHAMPTON, <em>Lowkey</em> by NIKI, <em>Dial Drunk</em> by Noah Kahan with Post Malone, and <em>Soft Spot</em> by keshi, which he calls his most favourite song ever.',
      go: ['#booth', 'The Booth']
    },
    {
      id: 'skills',
      keys: [[6,'what does he do'],[6,'what can he do'],[5,'his skills'],[5,'good at'],[4,'skills'],[4,'skill'],[4,'engineer'],[4,'developer'],[4,'machine learning'],[3,'coding'],[3,'code'],[3,'build'],[3,'builds'],[3,'stack'],[3,'cloud'],[3,'analytics'],[2,'llm'],[2,'ai'],[2,'tech stack']],
      src: 'bio',
      a: 'His portfolio lists six: full-stack development, cloud deployment, machine learning, AI/LLM engineering, predictive analytics, and fair &amp; ethical ML/AI research. Five of the six name a thing you ship. The sixth names a question you ask about the thing.',
      go: ['#stack', 'The Stack']
    },
    {
      id: 'interest',
      keys: [[6,'what is he interested in'],[5,'interested in'],[5,'societal impact'],[5,'societal impacts'],[4,'interests'],[4,'interest'],[4,'ethics'],[4,'ethical'],[4,'fairness'],[4,'bias'],[3,'research'],[3,'cares about'],[3,'care about'],[3,'passionate']],
      src: 'bio',
      a: 'The societal impacts of AI tools, for better or worse. Those are his words, and it is the only thing in his bio he calls an <em>interest</em> rather than something he enjoys &mdash; which is why three sections of this page are built on that one clause — two on the <em>worse</em> half, and one on the other.',
      go: ['#threshold', 'The Line']
    },
    {
      id: 'contact',
      keys: [[6,'how do i reach him'],[6,'how can i contact'],[5,'get in touch'],[5,'contact him'],[4,'contact'],[4,'email'],[4,'linkedin'],[4,'instagram'],[4,'reach'],[3,'message'],[3,'hire'],[3,'dm'],[2,'talk']],
      src: 'bio',
      a: 'Three doors, all of them his: <a href="mailto:ruslan.manoharan@gmail.com">email</a>, <a href="https://www.linkedin.com/in/ruslanmanoharan/" target="_blank" rel="noopener">LinkedIn</a> and <a href="https://www.instagram.com/rumanoharan/" target="_blank" rel="noopener">Instagram</a>. They are also in About, at the top of this page, and in the menu at the top of the screen.',
      go: ['#contact', 'The Doors']
    },
    {
      id: 'resume',
      keys: [[5,'his resume'],[5,'his cv'],[4,'resume'],[4,'cv'],[3,'curriculum vitae']],
      src: 'repo',
      a: 'Behind the <em>View Resume</em> button in About. It is the one thing his site loads that is not in his repository &mdash; it lives on Google Drive &mdash; so this page has never read it and cannot. Whatever it says about his work, it says there and not here.',
      go: ['#resume', 'The Resume']
    },
    {
      id: 'site',
      keys: [[6,'who made this'],[6,'who wrote this'],[6,'what is this page'],[5,'why does this page'],[5,'is this real'],[5,'ai wrote'],[4,'this page'],[4,'this site'],[4,'the agent'],[3,'commits'],[3,'experiment'],[5,'daily build'],[2,'agent']],
      src: 'repo',
      a: 'He built his portfolio in thirteen commits across four days in July 2026. Then, on 4&nbsp;October, he copied it into <code>/daily</code>, wrote the rules down in the open, and handed the copy to an agent with permission to rewrite it every night and nobody reviewing what it ships. This page is that copy. Sixteen lines of it are still in his handwriting and not one of them is a word.',
      go: ['#handover', 'The Handover']
    },
    {
      id: 'hero',
      keys: [[6,'what is the font'],[5,'name at the top'],[5,'the link at the top'],[4,'font'],[4,'typeface'],[4,'the hero'],[4,'the sound'],[3,'animation'],[3,'chime'],[3,'video'],[3,'youtube']],
      src: 'repo',
      a: 'His name at the top is set in the typeface of the 1989 Game&nbsp;Boy, and it is a link. It goes to the startup chime of the 2001 Game&nbsp;Boy Advance. Two machines he owns, twelve years apart, in one heading &mdash; and the only hint of it on his real site is an <code>aria-label</code> that says &ldquo;watch the video&rdquo;.',
      go: ['#chime', 'The Chime']
    },
    {
      id: 'emoji',
      keys: [[5,'how does he write'],[4,'emoji'],[4,'emojis'],[4,'punctuation'],[3,'his writing'],[3,'how many words']],
      src: 'bio',
      a: 'Fifty-three words, eleven emoji, one full stop and one comma. Take the pictures out and his sentences stop dividing &mdash; the emoji are doing most of the punctuation. There is a control under his bio that shows the same paragraph three ways.',
      go: ['#source', 'The Source']
    },

    /* ---------- the ones with no answer ----------
       In the table on purpose. Each says what is known, what was asked,
       and why the gap is still a gap. */

    {
      id: 'cooking',
      keys: [[6,'can he cook'],[6,'does he cook'],[5,'what does he cook'],[4,'cook'],[4,'cooks'],[4,'cooking'],[4,'recipe'],[4,'kitchen'],[3,'food'],[3,'dish'],[3,'meal'],[3,'baking'],[2,'eat']],
      src: 'none',
      a: 'His bio says he is &ldquo;learning to cook without blowing up the kitchen&rdquo;, and that is genuinely all of it. He was asked by email on 8&nbsp;October 2026 for one dish he actually makes. He has not replied, the question is still open, and this page is not allowed to fill the gap in with something that sounds about right.',
      go: ['#post', 'The Correspondence']
    },
    {
      id: 'travel',
      keys: [[6,'where has he travelled'],[6,'where has he traveled'],[5,'does he travel'],[4,'travel'],[4,'travels'],[4,'travelling'],[4,'traveling'],[4,'vacation'],[4,'holiday'],[3,'countries'],[3,'country'],[3,'abroad'],[3,'trip'],[3,'trips'],[3,'flights'],[2,'been to']],
      src: 'none',
      a: 'His bio says he enjoys travelling. Nothing more &mdash; no country, no trip, no photograph. He has not been asked either: the rule here is one open question at a time, and the cooking one has been out since 8&nbsp;October.',
      go: ['#post', 'The Correspondence']
    },
    {
      id: 'work',
      keys: [[6,'where does he work'],[6,'who does he work for'],[5,'his job'],[5,'his employer'],[5,'job title'],[4,'employer'],[4,'company'],[4,'job'],[4,'career'],[3,'works'],[3,'work'],[3,'salary'],[3,'experience'],[2,'role']],
      src: 'none',
      a: 'Not here. His portfolio names no employer, no job title and no dates anywhere, and this page may not invent one. His resume might &mdash; it is behind the button in About, on Google Drive, where this page cannot read it.',
      go: ['#resume', 'The Resume']
    },
    {
      id: 'school',
      keys: [[6,'where did he study'],[5,'his degree'],[4,'degree'],[4,'university'],[4,'college'],[4,'school'],[4,'education'],[3,'studied'],[3,'study'],[3,'major'],[3,'graduate'],[3,'phd']],
      src: 'none',
      a: 'Not here. There is no school, degree or date anywhere in what he has published on this domain, and guessing is the one thing this page is forbidden to do. The resume button in About goes to a document it has never been able to open.',
      go: ['#resume', 'The Resume']
    },
    {
      id: 'projects',
      keys: [[6,'what has he built'],[5,'his projects'],[5,'his work'],[4,'projects'],[4,'project'],[4,'github'],[4,'repos'],[3,'repo'],[3,'portfolio pieces'],[5,'case study']],
      src: 'none',
      a: 'His portfolio lists none &mdash; no write-ups, no clients, no links out to work. The one piece of his code this page can actually see is the site itself: thirteen commits in July 2026, and one line of script still running in the footer whose entire job is keeping the year beside his name current.',
      go: ['#handover', 'The Handover']
    },
    {
      id: 'personal',
      keys: [[6,'how old is he'],[5,'is he single'],[4,'girlfriend'],[4,'boyfriend'],[4,'married'],[4,'partner'],[4,'wife'],[4,'husband'],[4,'birthday'],[4,'religion'],[4,'politics'],[3,'family'],[3,'kids'],[3,'children'],[3,'dating'],[3,'age'],[3,'born'],[2,'old']],
      src: 'none',
      a: 'Nothing on this page says, and nothing on this page is going to guess. Everything here traces to one paragraph he wrote, the repository he published, or two emails he answered &mdash; and none of the three mentions any of that.',
      go: ['#known', 'the fourteen']
    },
    {
      id: 'pets',
      keys: [[5,'does he have a dog'],[5,'does he have a cat'],[4,'pets'],[4,'pet'],[3,'dog'],[3,'cat']],
      src: 'none',
      a: 'No idea. His bio names four things he does with his free time &mdash; travelling, cooking, karaoke and collecting retro tech &mdash; and an animal is not one of them. That is not evidence of absence, and this page will not treat it as any.',
      go: ['#source', 'The Source']
    }
  ];

  /* ---------- matching ----------
     Normalise to spaced lowercase with every non-alphanumeric turned
     into a gap, so punctuation and apostrophes cannot block a match and
     every phrase test is a word-boundary test. */

  function norm(s) {
    return ' ' + String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }

  function score(q, entry) {
    var total = 0;
    for (var i = 0; i < entry.keys.length; i++) {
      var k = entry.keys[i];
      if (q.indexOf(' ' + norm(k[1]).trim() + ' ') !== -1) total += k[0];
    }
    return total;
  }

  function best(raw) {
    var q = norm(raw);
    if (q === ' ') return null;
    var top = null, topScore = 0;
    for (var i = 0; i < ENTRIES.length; i++) {
      var s = score(q, ENTRIES[i]);
      if (s > topScore) { topScore = s; top = ENTRIES[i]; }
    }
    return topScore > 0 ? top : null;
  }

  /* ---------- rendering ----------
     The answer is built from the table, so its HTML is ours. The one
     thing that ever comes from the visitor is their own question in the
     no-match case, and that goes in as text, never as markup. */

  function render(entry, asked) {
    out.innerHTML = '';

    var p = document.createElement('p');
    p.className = 'ask-a';

    var meta = document.createElement('p');
    meta.className = 'ask-meta';

    var chip = document.createElement('span');
    chip.className = 'ask-src';

    if (entry) {
      p.innerHTML = entry.a;
      chip.setAttribute('data-src', entry.src);
      chip.textContent = SRC[entry.src];
      meta.appendChild(chip);

      var link = document.createElement('a');
      link.className = 'ask-link';
      link.href = entry.go[0];
      link.textContent = entry.go[1];
      meta.appendChild(link);
    } else {
      p.appendChild(document.createTextNode('I don’t have that one. '));
      var em = document.createElement('span');
      em.className = 'ask-q';
      em.textContent = '“' + String(asked).trim() + '”';
      p.appendChild(em);
      p.appendChild(document.createTextNode(
        ' matches nothing in the fourteen things this page knows, and the box has no way to make one up — it is a list of answers somebody wrote down, not a model. Try one of the suggestions, or read the fourteen below.'
      ));
      chip.setAttribute('data-src', 'none');
      chip.textContent = SRC.none;
      meta.appendChild(chip);
    }

    out.appendChild(p);
    out.appendChild(meta);

    /* Re-trigger the fade without a layout thrash of its own. */
    out.classList.remove('is-in');
    void out.offsetWidth;
    out.classList.add('is-in');
  }

  function ask(raw) {
    var text = String(raw == null ? '' : raw);
    if (!text.trim()) {
      out.innerHTML = '';
      var p = document.createElement('p');
      p.className = 'ask-a ask-idle';
      p.textContent = 'Type a question, or pick one of the suggestions.';
      out.appendChild(p);
      return;
    }
    render(best(text), text);
  }

  /* ---------- the suggestions ----------
     Six, chosen to show the shape of the table rather than to flatter
     it: four it answers, two it cannot. */

  var CHIPS = [
    'Where does he live?',
    'What does he collect?',
    'What does he do?',
    'Can he cook?',
    'Where does he work?',
    'How do I reach him?'
  ];

  CHIPS.forEach(function (q) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ask-chip';
    b.textContent = q;
    b.addEventListener('click', function () {
      input.value = q;
      ask(q);
      input.focus();
    });
    chipBox.appendChild(b);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); ask(input.value); }
  });

  if (goBtn) goBtn.addEventListener('click', function () { ask(input.value); });

  /* The opening state is the honest one: nothing asked, nothing
     answered. */
  ask('');

  if (nojs) nojs.hidden = true;
  rig.hidden = false;

  /* Self-reference only, for checking the table from the console: every
     suggestion and every key should resolve to the entry that owns it. */
  window.__ask = {
    answer: function (q) { var e = best(q); return e ? e.id : null; },
    audit: function () {
      var bad = [];
      ENTRIES.forEach(function (entry) {
        entry.keys.forEach(function (k) {
          var hit = best(k[1]);
          if (!hit || hit.id !== entry.id) {
            bad.push(k[1] + ' -> ' + (hit ? hit.id : 'none') + ' (wanted ' + entry.id + ')');
          }
        });
      });
      CHIPS.forEach(function (q) { if (!best(q)) bad.push('chip: ' + q + ' -> none'); });
      return bad.length ? bad : 'all ' + ENTRIES.length + ' entries resolve from their own keys';
    }
  };
})();

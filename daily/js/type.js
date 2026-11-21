/* The Typeface — 16 · the two fonts he committed
   ----------------------------------------------------------------------
   Added 2026-11-21. Scoped entirely to #type.

   His repository holds exactly three binary files: his photograph and
   two fonts. The photograph is on this page three times over. The fonts
   had never been opened by anything here — the page had read his HTML,
   his CSS, his JavaScript, his commit dates and his emails, and walked
   past 62,616 bytes of type sitting in the one directory nothing had
   looked inside.

   This file opens them, in your browser, with a small sfnt reader:

     · the table directory, so the outline flavour is read rather than
       guessed from the extension;
     · `head` for unitsPerEm and `maxp` for the glyph count;
     · the `name` table, which is where a font says what it is called,
       who made it, what it is based on and what built it — and where
       both of these turn out to be called something other than what his
       @font-face calls them;
     · one `cmap` subtable, chosen the way a shaper chooses one, which
       is the list of characters the file can actually draw.

   Then it runs his own paragraph — read off this page, not retyped —
   against that list, character by character. Both fonts can set every
   letter and every mark of punctuation he wrote, and neither can draw a
   single one of his eleven pictures.

   It also fetches his three real stylesheets from the root of this
   domain and counts the declarations asking for each family, because the
   second finding here is an absence: nothing on his site asks for the
   face he calls 'Nintendo', and a browser does not download a @font-face
   nobody asks for. Picking it in the control below is, as far as this
   page can tell, the only thing on this domain that has ever made a
   browser fetch that file.

   Nothing here is typed. Every figure in the markup is a fallback for a
   browser that cannot fetch, it is compared against the measurement when
   the measurement arrives, and window.__type.audit() prints the
   comparison. What is a reading rather than a measurement is named in
   the section's provenance note. */
(function () {
  'use strict';

  var sec = document.getElementById('type');
  if (!sec) return;

  var rig  = sec.querySelector('[data-ty-rig]');
  var nojs = sec.querySelector('.ty-nojs');
  var cardBox = sec.querySelector('[data-ty-cards]');
  var runBox  = sec.querySelector('[data-ty-run]');
  var sayEl   = sec.querySelector('[data-ty-say]');
  if (!rig || !cardBox || !runBox) return;

  /* His paragraph, from the one copy of it in this document. The same
     source js/fit.js and js/heart.js read, for the same reason: this
     page keeps one copy of anything he wrote. */
  var bioEl = document.querySelector('[data-fd-bio]');
  var BIO = bioEl ? (bioEl.textContent || '').trim() : '';

  /* His name as his hero spells it, off his hero. */
  var heroEl = document.getElementById('gb');
  var NAME = heroEl ? (heroEl.getAttribute('data-text') || '').trim() : 'RUSLAN MANOHARAN';

  var FONTS = [
    {
      key: 'gb',
      file: 'fonts/game_boy_1989.ttf',
      url: '../fonts/game_boy_1989.ttf',
      asked: 'GameBoy',
      stack: "'GameBoy', system-ui, sans-serif",
      used: 'his hero, and every heading on his site'
    },
    {
      key: 'ro',
      file: 'fonts/nintendo.otf',
      url: '../fonts/nintendo.otf',
      asked: 'Nintendo',
      stack: "'Nintendo', system-ui, sans-serif",
      used: 'nothing'
    }
  ];

  /* His own stylesheets, at the root of this domain — the three his
     homepage loads. Fetched read-only to count who asks for what. */
  var SHEETS = ['../css/intro.css', '../css/style.css', '../css/reveal.css'];

  /* ---------- the sfnt reader ----------
     Enough of the format to answer the questions above and no more.
     Everything it reads is at a fixed offset from a table directory
     entry; nothing here rewrites or re-encodes a byte. */

  var NAME_IDS = {
    0: 'copyright', 1: 'family', 2: 'subfamily', 3: 'uniqueid', 4: 'full',
    5: 'version', 6: 'psname', 8: 'manufacturer', 9: 'designer',
    10: 'description', 11: 'vendorurl', 12: 'designerurl', 13: 'license'
  };

  function readFont(buf) {
    var dv = new DataView(buf);
    var u8 = new Uint8Array(buf);
    var len = buf.byteLength;

    function u16(o) { return o + 2 <= len ? dv.getUint16(o) : 0; }
    function u32(o) { return o + 4 <= len ? dv.getUint32(o) : 0; }
    function tag(o) {
      return String.fromCharCode(u8[o], u8[o + 1], u8[o + 2], u8[o + 3]);
    }

    var flavour = u32(0) === 0x00010000 ? 'TrueType outlines'
      : tag(0) === 'OTTO' ? 'PostScript outlines (CFF)'
      : tag(0) === 'true' ? 'TrueType outlines'
      : 'unknown (' + tag(0) + ')';

    var count = u16(4);
    var tables = {};
    for (var i = 0; i < count; i++) {
      var o = 12 + 16 * i;
      tables[tag(o)] = { off: u32(o + 8), len: u32(o + 12) };
    }

    /* ---- the name table ---- */
    function names(off) {
      var n = u16(off + 2);
      var strs = off + u16(off + 4);
      var out = {};
      for (var i = 0; i < n; i++) {
        var o = off + 6 + 12 * i;
        var pid = u16(o), nid = u16(o + 6), nlen = u16(o + 8), noff = u16(o + 10);
        var key = NAME_IDS[nid];
        if (!key) continue;
        var s = '';
        if (pid === 3 || pid === 0) {
          for (var c = 0; c + 1 < nlen; c += 2) s += String.fromCharCode(u16(strs + noff + c));
        } else {
          for (var b = 0; b < nlen; b++) s += String.fromCharCode(u8[strs + noff + b]);
        }
        s = s.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
        /* Windows records win where both exist, which is the pair most
           fonts fill in properly; a Mac-only record is kept rather than
           dropped. */
        if (s && (!(key in out) || pid === 3)) out[key] = s;
      }
      return out;
    }

    /* ---- one cmap subtable ----
       Chosen the way a text shaper chooses: the full-Unicode Windows
       table if there is one, then the Windows BMP table, then anything
       else flagged Unicode, then whatever is first. Counting the union
       of every subtable would double-count the same characters mapped
       twice, which is why this reports one table and says which. */
    function cmap(off) {
      var n = u16(off + 2);
      var subs = [];
      for (var i = 0; i < n; i++) {
        var o = off + 4 + 8 * i;
        subs.push({ pid: u16(o), eid: u16(o + 2), off: off + u32(o + 4) });
      }
      function pick() {
        var want = [[3, 10], [3, 1], [0, 4], [0, 3], [0, 6]];
        for (var w = 0; w < want.length; w++) {
          for (var s = 0; s < subs.length; s++) {
            if (subs[s].pid === want[w][0] && subs[s].eid === want[w][1]) return subs[s];
          }
        }
        return subs[0] || null;
      }
      var sub = pick();
      if (!sub) return null;

      var set = Object.create(null);
      var ranges = [];
      var mapped = 0;
      var fmt = u16(sub.off);

      function add(cp) { if (!set[cp]) { set[cp] = 1; mapped++; } }

      if (fmt === 4) {
        var segX2 = u16(sub.off + 6), seg = segX2 >> 1;
        var endO = sub.off + 14, startO = endO + segX2 + 2;
        var deltaO = startO + segX2, rangeO = deltaO + segX2;
        for (var s = 0; s < seg; s++) {
          var end = u16(endO + 2 * s), start = u16(startO + 2 * s);
          if (start === 0xFFFF) continue;
          var delta = u16(deltaO + 2 * s), ro = u16(rangeO + 2 * s);
          var stop = Math.min(end, 0xFFFE);
          for (var c = start; c <= stop; c++) {
            var g;
            if (ro === 0) g = (c + delta) & 0xFFFF;
            else {
              g = u16(rangeO + 2 * s + ro + 2 * (c - start));
              if (g) g = (g + delta) & 0xFFFF;
            }
            if (g) add(c);
          }
        }
      } else if (fmt === 12) {
        var groups = u32(sub.off + 12);
        for (var gi = 0; gi < groups; gi++) {
          var go = sub.off + 16 + 12 * gi;
          var lo = u32(go), hi = u32(go + 4);
          if (hi < lo) continue;
          ranges.push([lo, hi]);
          mapped += hi - lo + 1;
        }
      } else if (fmt === 6) {
        var first = u16(sub.off + 6), cnt = u16(sub.off + 8);
        for (var k = 0; k < cnt; k++) if (u16(sub.off + 10 + 2 * k)) add(first + k);
      } else if (fmt === 0) {
        for (var b2 = 0; b2 < 256; b2++) if (u8[sub.off + 6 + b2]) add(b2);
      }

      return {
        format: fmt,
        platform: sub.pid,
        encoding: sub.eid,
        mapped: mapped,
        subtables: subs.length,
        has: function (cp) {
          if (set[cp]) return true;
          for (var r = 0; r < ranges.length; r++) {
            if (cp >= ranges[r][0] && cp <= ranges[r][1]) return true;
          }
          return false;
        }
      };
    }

    return {
      bytes: len,
      flavour: flavour,
      tableCount: count,
      tables: Object.keys(tables).sort(),
      upem: tables.head ? u16(tables.head.off + 18) : 0,
      glyphs: tables.maxp ? u16(tables.maxp.off + 4) : 0,
      name: tables.name ? names(tables.name.off) : {},
      cmap: tables.cmap ? cmap(tables.cmap.off) : null
    };
  }

  /* ---------- coverage ---------- */

  function chars(str) {
    return Array.from ? Array.from(str) : String(str).split('');
  }

  function cover(font, str) {
    var cs = chars(str);
    var missing = [];
    var uniq = Object.create(null);
    var uniqList = [];
    for (var i = 0; i < cs.length; i++) {
      var cp = cs[i].codePointAt(0);
      if (!font.cmap || !font.cmap.has(cp)) {
        missing.push(cs[i]);
        if (!uniq[cp]) { uniq[cp] = 1; uniqList.push(cs[i]); }
      }
    }
    return {
      total: cs.length,
      drawable: cs.length - missing.length,
      missing: missing.length,
      unique: uniqList.length,
      uniqueChars: uniqList
    };
  }

  /* ---------- who asks for what ----------
     His stylesheets as text. @font-face blocks are removed first: the
     family descriptor inside one declares a name, it does not ask for
     it, and counting it would make every font look used. */
  function asks(css, family) {
    var body = css.replace(/\/\*[\s\S]*?\*\//g, '')
                  .replace(/@font-face\s*\{[^}]*\}/g, '');
    var re = /(?:^|[;{])\s*(font|font-family|--display|--[a-z-]+)\s*:([^;}]*)/gi;
    var n = 0, m;
    while ((m = re.exec(body))) {
      if (m[2].indexOf(family) !== -1) n++;
    }
    return n;
  }

  /* ---------- rendering ---------- */

  function row(dl, k, v, mono) {
    var wrap = document.createElement('div');
    var dt = document.createElement('dt');
    dt.textContent = k;
    var dd = document.createElement('dd');
    dd.textContent = v;
    if (mono) dd.className = 'ty-mono';
    wrap.appendChild(dt);
    wrap.appendChild(dd);
    dl.appendChild(wrap);
    return dd;
  }

  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function card(f) {
    var art = document.createElement('article');
    art.className = 'ty-card panel';
    art.setAttribute('data-font', f.key);
    if (f.key === 'ro') art.classList.add('ty-card-dead');

    var h = document.createElement('h3');
    h.className = 'ty-card-h';
    var small = document.createElement('span');
    small.className = 'ty-card-file';
    small.textContent = f.file;
    h.appendChild(document.createTextNode(f.data.name.family || '(no family name)'));
    h.appendChild(small);
    art.appendChild(h);

    var flag = document.createElement('p');
    flag.className = 'ty-flag';
    flag.textContent = f.askedBy > 0
      ? 'asked for by ' + f.askedBy + ' declaration' + (f.askedBy === 1 ? '' : 's') + ' in his stylesheets'
      : 'asked for by nothing, anywhere on his site';
    art.appendChild(flag);

    var dl = document.createElement('dl');
    dl.className = 'ty-rows';
    row(dl, 'His @font-face calls it', "'" + f.asked + "'", true);
    row(dl, 'The file calls itself', (f.data.name.family || '?') +
      (f.data.name.subfamily ? ' · ' + f.data.name.subfamily : ''));
    if (f.data.name.version) row(dl, 'Version', f.data.name.version);
    if (f.data.name.copyright) row(dl, 'Copyright', f.data.name.copyright);
    if (f.data.name.designer) row(dl, 'Designer', f.data.name.designer);
    if (f.data.name.uniqueid) row(dl, 'Built by', f.data.name.uniqueid);
    row(dl, 'Outlines', f.data.flavour + ' · ' + f.data.tableCount + ' tables');
    row(dl, 'Glyphs in the file', num(f.data.glyphs), true);
    row(dl, 'Characters it can draw', f.data.cmap
      ? num(f.data.cmap.mapped) + '  (cmap format ' + f.data.cmap.format +
        ', platform ' + f.data.cmap.platform + '/' + f.data.cmap.encoding +
        ' of ' + f.data.cmap.subtables + ')'
      : 'no cmap', true);
    row(dl, 'Size on his server', num(f.data.bytes) + ' bytes', true);
    art.appendChild(dl);

    if (f.data.name.description) {
      var q = document.createElement('p');
      q.className = 'ty-desc';
      q.textContent = '“' + f.data.name.description + '”';
      var cap = document.createElement('span');
      cap.textContent = ' — the file’s own description field';
      q.appendChild(cap);
      art.appendChild(q);
    }

    return art;
  }

  /* The paragraph, one element per character, so a missing character can
     be marked without a second copy of his words existing anywhere. */
  function paint(f, view) {
    var host = runBox.querySelector('[data-ty-para]');
    if (!host) return;
    host.innerHTML = '';
    host.setAttribute('data-view', view);

    /* Set in the face itself: no marks at all, because the point of this
       view is what the browser does about the gaps without being asked.
       The face is applied here rather than in the stylesheet so that
       picking it is what fetches it. */
    if (view === 'set') {
      host.style.fontFamily = f.stack;
      host.textContent = BIO;
      return;
    }

    host.style.fontFamily = '';
    var cs = chars(BIO);
    for (var i = 0; i < cs.length; i++) {
      var cp = cs[i].codePointAt(0);
      if (f.data.cmap && f.data.cmap.has(cp)) {
        host.appendChild(document.createTextNode(cs[i]));
        continue;
      }
      var sp = document.createElement('span');
      sp.className = 'ty-gone';
      sp.textContent = cs[i];
      sp.setAttribute('title', 'U+' + cp.toString(16).toUpperCase() +
        ' — not in ' + (f.data.name.family || f.asked));
      host.appendChild(sp);
    }
  }

  /* ---------- go ---------- */

  var state = { font: 'gb', view: 'mark' };
  var loaded = {};
  var checks = [];
  var measured = {};

  function put(sel, value) {
    var els = [].slice.call(sec.querySelectorAll(sel));
    els.forEach(function (el) {
      var was = el.textContent.trim();
      var now = String(value);
      el.textContent = now;
      checks.push({ slot: sel, markup: was, measured: now, agreed: was === now });
    });
  }

  function say() {
    if (!sayEl) return;
    var f = loaded[state.font];
    if (!f) return;
    var c = f.cover;
    var fam = f.data.name.family || f.asked;
    if (state.view === 'set') {
      sayEl.textContent = 'His paragraph set in ' + fam + '. The ' + c.missing +
        ' characters it cannot draw have not vanished — your browser has quietly ' +
        'handed them to some other font on your machine, which is why the pictures ' +
        'look nothing like the letters around them.';
    } else {
      sayEl.textContent = fam + ' can draw ' + c.drawable + ' of the ' + c.total +
        ' characters he wrote. The ' + c.missing + ' it cannot are marked: ' +
        c.unique + ' distinct characters, and every one of them is a picture or ' +
        'the invisible selector that follows one.';
    }
  }

  function show() {
    var f = loaded[state.font];
    if (!f) return;
    [].slice.call(sec.querySelectorAll('[data-ty-font]')).forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-ty-font') === state.font ? 'true' : 'false');
    });
    [].slice.call(sec.querySelectorAll('[data-ty-view]')).forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-ty-view') === state.view ? 'true' : 'false');
    });
    paint(f, state.view);
    say();
  }

  function fail(why) {
    if (!nojs) return;
    nojs.textContent = 'The live read of his two font files did not complete (' + why +
      '), so every figure in this section is the one typed into the markup, ' +
      'unverified. Reload to try again.';
    nojs.classList.add('ty-failed');
  }

  function get(url, asText) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' → ' + r.status);
      return asText ? r.text() : r.arrayBuffer();
    });
  }

  if (!('fetch' in window) || !('DataView' in window) || !BIO) {
    fail(!BIO ? 'his paragraph is not on this page' : 'this browser has no fetch');
    return;
  }

  Promise.all([
    get(FONTS[0].url, false),
    get(FONTS[1].url, false),
    Promise.all(SHEETS.map(function (u) { return get(u, true); }))
  ]).then(function (res) {
    var sheets = res[2].join('\n');

    FONTS.forEach(function (f, i) {
      f.data = readFont(res[i]);
      f.cover = cover(f.data, BIO);
      f.nameCover = cover(f.data, NAME);
      f.askedBy = asks(sheets, f.asked);
      loaded[f.key] = f;
    });

    var gb = loaded.gb, ro = loaded.ro;

    measured = {
      bytes: gb.data.bytes + ro.data.bytes,
      gb: {
        glyphs: gb.data.glyphs, mapped: gb.data.cmap ? gb.data.cmap.mapped : 0,
        bytes: gb.data.bytes, asked: gb.askedBy,
        family: gb.data.name.family, subfamily: gb.data.name.subfamily
      },
      ro: {
        glyphs: ro.data.glyphs, mapped: ro.data.cmap ? ro.data.cmap.mapped : 0,
        bytes: ro.data.bytes, asked: ro.askedBy,
        family: ro.data.name.family, subfamily: ro.data.name.subfamily
      },
      bio: gb.cover,
      name: gb.nameCover
    };

    /* Every figure the prose leans on, written in and compared. */
    put('[data-ty-bytes]', num(measured.bytes));
    put('[data-ty-gb-glyphs]', num(measured.gb.glyphs));
    put('[data-ty-gb-mapped]', num(measured.gb.mapped));
    put('[data-ty-gb-bytes]', num(measured.gb.bytes));
    put('[data-ty-gb-asked]', measured.gb.asked);
    put('[data-ty-ro-glyphs]', num(measured.ro.glyphs));
    put('[data-ty-ro-mapped]', num(measured.ro.mapped));
    put('[data-ty-ro-bytes]', num(measured.ro.bytes));
    put('[data-ty-ro-asked]', measured.ro.asked);
    put('[data-ty-draw]', measured.bio.drawable);
    put('[data-ty-of]', measured.bio.total);
    put('[data-ty-miss]', measured.bio.missing);
    put('[data-ty-missu]', measured.bio.unique);
    put('[data-ty-name-of]', measured.name.total);

    cardBox.innerHTML = '';
    FONTS.forEach(function (f) { cardBox.appendChild(card(f)); });

    if (nojs) nojs.hidden = true;
    rig.hidden = false;
    show();
  }).catch(function (e) {
    fail(String(e && e.message ? e.message : e));
  });

  [].slice.call(sec.querySelectorAll('[data-ty-font]')).forEach(function (b) {
    b.addEventListener('click', function () {
      state.font = b.getAttribute('data-ty-font');
      show();
    });
  });
  [].slice.call(sec.querySelectorAll('[data-ty-view]')).forEach(function (b) {
    b.addEventListener('click', function () {
      state.view = b.getAttribute('data-ty-view');
      show();
    });
  });

  /* ---------- what this file will answer for ---------- */

  window.__type = {
    fonts: function () { return loaded; },
    measured: function () { return measured; },
    checks: function () { return checks; },
    audit: function () {
      var out = { measured: measured, problems: [] };

      checks.forEach(function (c) {
        if (!c.agreed) {
          out.problems.push('slot ' + c.slot + ': markup said "' + c.markup +
            '", the page measures "' + c.measured + '"');
        }
      });

      if (!loaded.gb || !loaded.ro) {
        out.problems.push('a font file was not read; every figure on the page is the typed fallback');
        return out;
      }

      /* The two claims the section would be wrong without. */
      if (loaded.gb.cover.missing !== loaded.ro.cover.missing) {
        out.problems.push('the two fonts no longer fail on the same characters: ' +
          loaded.gb.cover.missing + ' vs ' + loaded.ro.cover.missing);
      }
      if (loaded.gb.nameCover.missing !== 0) {
        out.problems.push('his name is no longer wholly inside his display face: ' +
          loaded.gb.nameCover.missing + ' characters missing');
      }
      if (loaded.ro.askedBy !== 0) {
        out.problems.push("'" + loaded.ro.asked + "' is now asked for by " +
          loaded.ro.askedBy + ' declaration(s); the section says nothing asks for it');
      }
      if (loaded.gb.askedBy === 0) {
        out.problems.push("'" + loaded.gb.asked + "' is asked for by nothing; the section says his headings use it");
      }

      /* Every character his display face cannot draw should be a
         pictograph or a variation selector. If a letter ever turns up in
         that list the section's whole sentence is wrong. */
      loaded.gb.cover.uniqueChars.forEach(function (ch) {
        var cp = ch.codePointAt(0);
        if (cp < 0x2100) {
          out.problems.push('a character below U+2100 is unsupported: U+' +
            cp.toString(16).toUpperCase());
        }
      });

      if (window.console && console.table) console.table(checks);
      return out;
    }
  };
})();

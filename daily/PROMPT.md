# The /daily experiment

`/daily` is a page an AI agent (Claude) has full creative autonomy over. Once a day, a
scheduled cloud agent reads the prompt below, decides on its own what to build or change,
implements it, and pushes directly to `main` — no human review. The only things it's not
allowed to touch are the real homepage (this repo's root `index.html`, `css/`, `js/`,
`images/`, `fonts/`) and anything outside `daily/` other than appending one entry to
`/change-log`. See `/change-log` for a running history of what it's done.

This file is kept in sync with whatever prompt the routine is actually running. If you're
reading this, it's the current one — not a changelog of past versions.

## Current prompt

```
You run a daily open-ended experiment on Ruslan Manoharan's portfolio repo. The repo serves two pages:

- The REAL homepage: `index.html`, `css/intro.css`, `css/style.css`, `css/reveal.css`, `js/intro.js`, `images/`, `fonts/` — served live at https://ru23-github.github.io/. This is Ruslan's actual portfolio. It must never change as a result of your work. Full stop.
- An isolated clone at `daily/` — `daily/index.html` plus its own `daily/css/*.css` and `daily/js/*.js`, served at https://ru23-github.github.io/daily/. This clone started as a copy of the homepage and carries a visible banner disclosing it's an experimental, auto-evolving build. This is YOUR page, and this experiment is deliberately open-ended: the point is to see what a page turns into over weeks/months when an agent has full creative autonomy over it, day after day. You decide what it becomes.

There is also `change-log/index.html` (served at /change-log), a running list of every change you've made, newest first.

This repo auto-publishes from `main` via GitHub Pages (it's a `username.github.io` repo). You push directly to `main` — there is no PR/review step. That's only safe because your changes are confined to `daily/` and the change-log entry; the guardrail in step 6 is what makes that confinement real, so follow it exactly.

**Your daily job:**

1. `git pull` to make sure you're starting from the latest `main`.
2. Read `change-log/index.html` to see everything you've already done, so you don't repeat yourself.
3. Decide today's idea entirely on your own. Do NOT default to "tasteful portfolio-site polish" as a safe choice — that is explicitly not the point of this experiment. Draw inspiration from literally anything you find genuinely interesting or fun today: pop culture, a recent news story, an internet trend or meme, a piece of music, a historical rabbit hole, a game mechanic, a joke, an aesthetic movement, a piece of generative art, a weird browser API you want to play with — anything. It does not need to relate to portfolios, web design, software, or Ruslan's career at all. It can be a visual redesign, a game, an interactive toy, a written piece, an ambient audiovisual thing, a completely different theme than yesterday's — your call. The only content rule: nothing hateful, harassing, or explicit — this is still attached to a real person's name and publicly reachable, even as an experiment. Otherwise, follow your own taste and curiosity.
4. Implement it by editing/adding files ONLY inside `daily/` (create any new files/subfolders under `daily/` you want — new HTML, CSS, JS, SVG, whatever). Keep the experimental-build banner (or an equivalent visible disclosure) somewhere visible, so visitors always know this page is an unreviewed daily experiment — don't remove that disclosure even if you redesign everything else around it. Vanilla HTML/CSS/JS only — no frameworks, no build tools, no npm, no CDN script tags. Respect prefers-reduced-motion where you use animation, and don't make the page unusable (keyboard trap, totally illegible text, etc.) — beyond that baseline, the execution quality and style are entirely your call.
5. Prepend one new entry to `change-log/index.html` (newest first, keep all previous entries intact): date, a short title for what you did, a 1-2 sentence description of it and why you chose it, and a link to whatever inspired it if there's a clear source. This is the only change allowed outside `daily/`.
6. **Guardrail — run this before every commit:** `git status --short` and `git diff --name-only`. Confirm every single changed or newly-added path is either inside `daily/` or is exactly `change-log/index.html`. If ANYTHING else shows up as changed (the real homepage's `index.html`, any root `css/*.css`, `js/intro.js`, `images/`, `fonts/`, or anything else) — STOP. Do not commit, do not push. Revert the unintended change (or the whole working tree if unsure) and instead just report in your final summary that you aborted and why. This check is not optional.
7. Once the diff is confirmed clean, commit directly to `main` (no branch, no PR) with a message like `Daily build: <what you did> (<date>)`, and `git push origin main`.
8. If, for whatever reason, you don't want to change anything today, that's fine too — skip the day, make no commit, and say why in your summary.

Keep the change-log entry honest about what changed and why you picked it. Don't touch `.gitignore`, `DEPLOYMENT.md`, or anything else outside `daily/` and the one change-log entry.
```

**Model:** Claude Opus 5 · **Schedule:** daily, 9am America/Los_Angeles

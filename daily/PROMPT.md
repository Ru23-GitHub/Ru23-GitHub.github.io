# The /daily experiment

`/daily` is a page an AI agent (Claude) rebuilds a little of each day. A scheduled cloud agent
reads the prompt below, decides on its own what to do, implements it, and pushes directly to
`main` — no human review.

Two hard rules bound it, and only two. First, **scope**: it may never touch the real homepage
(this repo's root `index.html`, `css/`, `js/`, `images/`, `fonts/`) or anything outside `daily/`
other than appending one entry to `/change-log`. Second, **`/daily` stays a personal portfolio
for Ruslan** — his name, bio, photo, resume link and contact links survive in some visible form,
however much else changes, and no fact about him may be invented.

Inside those two lines it has a free hand: it can add, rewrite, restructure, restyle, refactor
and delete, including tearing up its own earlier work.

Because it can now remove things, three checks run before every commit — a scope check, a
portfolio-integrity check, and a headless-browser load of both pages — and the git history is
kept linear and un-rewritten so any single change is one `git revert` away.

See `/change-log` for a running history of what it's done.

This file mirrors the prompt the routine is actually running. The routine's stored copy lives in
the Claude Code routines UI and is edited there; this file is updated to match. If you're reading
this, it's the current text — not a changelog of past versions.

## Current prompt

```
You run a daily experiment on Ruslan Manoharan's portfolio repo. The repo serves two pages:

- The REAL homepage: `index.html`, `css/intro.css`, `css/style.css`, `css/reveal.css`, `js/intro.js`, `images/`, `fonts/` — served live at https://ru23-github.github.io/. This is Ruslan's actual portfolio. It must never change as a result of your work. Full stop.
- An isolated clone at `daily/` — `daily/index.html` plus its own `daily/css/*.css` and `daily/js/*.js`, served at https://ru23-github.github.io/daily/. This clone started as a copy of the homepage. This is YOUR page.

There is also `change-log/index.html` (served at /change-log), a running list of every change you've made, newest first.

This repo auto-publishes from `main` via GitHub Pages (it's a `username.github.io` repo). You push directly to `main` — there is no PR/review step.

**WHAT YOU MAY DO TO `daily/`**

Anything. As of 2026-10-05 the old additive-only rule is lifted: inside `daily/` you may add, rewrite, restructure, restyle, refactor, consolidate and delete — your own earlier additions included. Redesign the page, swap its theme, rip out something that isn't working, rebuild a previous day's section from scratch. You do not need permission and nobody reviews it first.

Two boundaries hold, and they are the whole of it.

**1. Scope.** Every path you touch is inside `daily/` or is exactly `change-log/index.html`. The real homepage and everything else in the repo are off limits — not "be careful with", off limits. This has not changed and is not yours to widen.

**2. It stays a personal portfolio for Ruslan.** `daily/` is a version of his portfolio, however strange it gets. So it keeps, in some visible and reachable form:

- his name as the page's subject
- the About bio text
- the profile photo
- the resume link
- the three contact links (email, LinkedIn, Instagram)

You may rewrite, restyle, relocate, re-voice or re-lay-out any of them — you may not quietly drop them. A visitor arriving cold should still be able to tell within seconds whose page this is and how to reach him.

And: **never invent facts about him.** No made-up jobs, employers, degrees, dates, clients, testimonials or metrics. You may rewrite the voice and structure of his copy freely; every factual claim has to trace back to something already in this repo.

Keep the experimental-build banner (or an equivalent visible disclosure) somewhere visible, so visitors always know this page is an unreviewed daily experiment.

**Your daily job:**

1. `git pull` to make sure you're starting from the latest `main`.
2. Read `change-log/index.html` to see everything you've already done. Read the current `daily/index.html` so you know what's there before you change it.
3. Decide today's work entirely on your own — a new thing, a rework of an old thing, a refactor, a redesign, a deletion, or several at once. Do NOT default to "tasteful portfolio-site polish" as a safe choice — that is explicitly not the point of this experiment. Draw inspiration from literally anything you find genuinely interesting or fun today: pop culture, a recent news story, an internet trend or meme, a piece of music, a historical rabbit hole, a game mechanic, a joke, an aesthetic movement, a piece of generative art, a weird browser API you want to play with — anything. It does not need to relate to portfolios, web design, software, or Ruslan's career at all. The only content rule: nothing hateful, harassing, or explicit — this is still attached to a real person's name and publicly reachable, even as an experiment. Otherwise, follow your own taste and curiosity.
4. Implement it. Vanilla HTML/CSS/JS only — no frameworks, no build tools, no npm, no CDN script tags. Respect prefers-reduced-motion where you use animation, keep it keyboard-operable and legible, and keep it working on a phone.
5. **Guardrail — run all three of these before every commit. None is optional:**
   - **Scope.** `git status --short` and `git diff --name-only`. Confirm every single changed or newly-added path is either inside `daily/` or is exactly `change-log/index.html`. If ANYTHING else shows up as changed (the real homepage's `index.html`, any root `css/*.css`, `js/intro.js`, `images/`, `fonts/`, or anything else) — STOP. Do not commit, do not push. Revert the unintended change (or the whole working tree if unsure) and report in your summary that you aborted and why.
   - **Portfolio integrity.** Grep the rendered `daily/index.html` and confirm all of these survive your change: "Ruslan Manoharan", the About bio paragraph, the `images/profile.jpg` reference, the resume link, and the `mailto:`, LinkedIn and Instagram links. If your change dropped one, put it back before committing.
   - **It still works.** Serve the repo and load `/daily/` in a headless browser (Playwright is available) at a desktop width and ~390px. No console errors, no horizontal page overflow, and the page still readable and keyboard-navigable. Load `/` too and confirm it is untouched and clean. If anything fails, fix or revert it — never push a broken page meaning to fix it tomorrow.
6. **Keep every change revertible.** The git history is the undo button now that you can delete things. One commit per change, on `main`, with a real message. Never amend, rebase, force-push or otherwise rewrite history.
7. Prepend one new entry to `change-log/index.html` (newest first, keep all previous entries intact): date, a short title, a 1-2 sentence description of what you did and why you chose it, and a link to whatever inspired it if there's a clear source. **Say plainly what you changed or removed**, not just what you added — the change-log is how Ruslan finds out what happened without reading diffs, so understating it defeats the point.
8. Commit directly to `main` (no branch, no PR) with a message like `Daily build: <what you did> (<date>)`, and `git push origin main`.
9. In the summary you send at the end, name anything you removed or rebuilt, and say which commit to revert if he wants it back.
10. If, for whatever reason, you don't want to change anything today, that's fine too — skip the day, make no commit, and say why in your summary.

Keep the change-log entry honest about what you did and why you picked it.
```

**Model:** Claude Opus 5 · **Schedule:** daily, 9am America/Los_Angeles

## Change history of this prompt

- **2026-10-05** — Lifted the additive-only rule at Ruslan's request: inside `daily/` the agent
  may now modify, restructure, restyle and delete, its own earlier additions included. The scope
  rule is untouched — the real homepage remains off limits. A new portfolio-integrity boundary
  replaces what the additive rule was implicitly protecting: `daily/` must keep Ruslan's name,
  bio, photo, resume link and contact links in some visible form, and may never fabricate a fact
  about him. The zero-deletions guardrail is retired (it *was* the additive rule) and is replaced
  by three pre-commit checks: scope, portfolio integrity, and a headless-browser load of both
  pages.
- **2026-10-05** — Added the additive-only rule and the matching zero-deletions guardrail,
  after a run replaced the whole page with an unrelated piece instead of adding to it.
  Reworded step 3 so "a completely different theme than yesterday's" and "a visual
  redesign" are no longer offered as options.

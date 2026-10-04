# A review of the development, and what we'd do next (cloud seat, 10-03)

started: 2026-10-03T17:23Z · branch `claude/optimistic-mayer-782rhy` · main at c8f64bb · nothing in the game changed; this file is the whole of the branch.

Griz, 10-03: *"Review the development of this game and make recommendations please"*

**What this is:** an opinion, not a ruling. Nothing here is RULED until his next word on it. The decisions are numbered at the end.

**What was read:** the repo only. The cairn's `..\` files (the handoffs, the bolt, the wiki) are not in a cloud container, so orient steps 1-3 were not walked. Three readers went over the 8-bit code, the DEEP16 code, and the design and the process (the docs, the benches' tables, the ear files, the commit log; the clone is shallow, 183 commits over 10-02/10-03). The seat checked their top claims against the code and ran the gate and every probe in the container's Chromium. **Not seen:** the game in a real browser by eye, the art, the audio, the AI's quality as play, most single grimoire spells, the off-repo files.

## The verdict in a paragraph

The machine is good and it is green: `python dev/check.py all` is GREEN (49 checks, 28 s), and every probe passes when it actually runs (pyro 21/21, pyro8 14/14, wet 52/52, wet8 26/26, srdleft 22/22, keeper 205/205, the old-save migrate check ok). The SRD fidelity work is careful, the monsters are data, the benches have found real things (the countdown reset on every map load, the hires that never cast, no potions on the Deep road). The risk is not the code's quality. **It is where the hours go.** By the commit subjects, about 3% of the last two days touched the 8-bit story a player walks, against roughly 38% process (merges, re-stamps, queue and notes), 26% the grid, 21% rules, 11% benches and docs (a heuristic, give or take 5 points). The live game is the 8-bit. PLAYTEST.md still says *"Nobody has played it start to finish."* The last ear file in the repo is 09-27. GitHub has never had an issue filed. Since 09-27 every story fight runs on the grid, and PLAYTEST.md has no section for that.

## A. Broken now (verified by the seat)

1. **The gate is hollow in a cloud seat.** `dev/pyro-probe.py`, `pyro8-probe.py`, `wet-probe.py`, `wet8-probe.py` and `srdleft-probe.py` launch the browser without `DEEP16_BROWSER_ARGS`. As root, Chromium refuses to start without `--no-sandbox`. Each probe then prints `no result` and exits 0. `dev/check.py`'s `script()` only looks for FAIL, Traceback, LOADERR or `Error:`, so it reports **ok**. Every cloud seat's GREEN has been 44 real checks and 5 empty ones. (On the desktop's Edge they run; with a no-sandbox wrapper here they all pass, so main is truly green today.) Also outside the gate: `dev/keeper-probe.py` (205 checks) and `dev/bench8.py migrate` (the only old-save test).
2. **A grid fight that fails to load or throws freezes the 8-bit.** `js/embed.js` `open()` sets `DS.paused = true`, lays the iframe over the screen, and waits for `d16:ready` and `d16:done`. It has no timeout and no error path. DEEP16 has no `window.onerror` that would answer. A crash on the grid leaves the player in a frozen fight, and everything since the last save is lost. The 8-bit fallback already exists (the `d16:refuse` branch, embed.js:22).
3. **Resistances stack on the grid.** `Battle.prototype.hurt` (deep16/js/battle.js:1658-1691) halves the damage up to four separate times:
   - `typed()`
   - Stoneskin
   - energyWard, poisonWard and rage
   - Warding Bond

   A raging barbarian under Warding Bond, or under Stoneskin against a nonmagical blade, takes a quarter. The SRD: resistances of the same kind count once.
4. **Concentration escapes on the grid.**
   - When temp HP soak the whole blow, `hurt` returns before `concCheck` (battle.js:1688-1693).
   - Wild Shape's beast branch returns before it too (:1690).
   - The sweep that ends concentration (battle.js:584) checks paralyzed, stunned and asleep, but not `conds.incapacitated`. That is what Hideous Laughter and Hypnotic Pattern set on their targets (grimoire.js:598, 603), so a concentrating foe under laughter keeps its spell.

   (Read in the code, not run on a bench.)
5. **Two gameplay rolls leak out of the seed.** On the grid, deep16/js/battle.js:1862 (the door ward's 3%) and climb.js:41 (the climb's fight draw) call `Math.random`. In the 8-bit, rolls and the particles share one `Math.random`, which the benches seed by replacing it globally. A change to an effect or to frame timing therefore changes a seeded run.
6. **Smaller, real:**
   - An unknown item id in a save breaks the ITEM menu (scenes.js:413).
   - An unknown map id throws after the scenes are cleared (a black screen).
   - A throw between `fade(1)` and `fade(0)` in `EV.warp` leaves the screen black.
   - The Settling's triggers wait on `jellyDead`, `poolOozeDead` and `otyughDead`, which only deep16/js/wet.js sets. If that fight ever falls back to the 8-bit battle, the trigger fires again.

## B. The shape of the work

7. **No file says what "the 8-bit is done" means.** The pull rule (monster-driven, the SRD 5.1 the finish line, nothing built is cut) is a good law for DEEP16 and the ladder. It is not a ship plan for the 8-bit. 156 of the SRD's 319 spells are built, 49 of them twice (once per battle), 120 grid-only (HELD, rightly). Meanwhile the story jobs wait: the Dace and cloaker flip, the roper's scene, the Guano escort, the crew's fourth.
8. **There is no difficulty target, and the benches are AI against AI.**
   - Every leg before the lake reaches its boss at 96-100% HP ("fat").
   - The early fights half again still read 20/20 for the class AI.
   - Griz: *"I have found things easy."*
   - Each job picks its own threshold ("no fight under a 60% win", "the seat's cut, not a rule").
   - His own warning from the Keeper applies everywhere: *"The AI doesn't do anything with the players until I hit them - if the benches are doing that they'll be wrong."*
   - One baseline is known to be wrong: the encounter countdown restarts on every map load (RULED to carry, queued). Every road is thinner than designed until it lands, so tuning CR before it lands tunes against the wrong floor.
9. **Rulings by proxy cost rework.** The overseer's leans get built and later undone. The crew went to seven under a scene that says *"Four of them"*, and was reverted (057d951). The swap as worded reads x0.82, easier, not harder. A lean that changes what a player meets wants his word first. A lean that only changes a bench is cheap.
10. **The re-stamp tax.** Both build scripts hash a file's raw bytes (tools/deep16-build.py:44; compile.py:207-215), so a CRLF checkout and an LF checkout stamp differently. One branch moved 34 of 60 stamps, 27 of them on files it never touched. `deep16/index.html` changed in 66 of 183 commits. Its hash line conflicts on every merge, and the recipe records that *"the wrong side drops a script tag."* The 8-bit uses one hash for all 23 files, so any edit re-downloads everything.
11. **The docs are rich but hard to find a way into.**
    - 20 markdown files sit at the root.
    - A ruling for one spell (Sanctuary) lives in the register, two notes files, `invented.json` and both engines.
    - `invented.json`'s "one line" entries average about 700 characters.
    - Commit subjects average about 180 characters, with no area prefix.
    - CLAUDE.md has drifted: the quick gate is 16 modes, not "five". "Benches from PowerShell only" is no longer true for a cloud seat, which has Chromium.

    What works: `cloud-jobs.md`, `URLS.md`, and the For-the-next-seat sections.
12. **The signature-fight recipe is worth it, but dear.** The Keeper took about 30 commits, about 40 records and four HP retunes, and the recipe says *"shorten nothing."* Ration it: one signature fight per act, and only for a boss the story's door needs.

## C. Code health (structural; fix as we pass, never as a rewrite)

13. **Behaviour is layered by monkey-patching.**
    - DEEP16 has about 78 wrap sites: keeper 19, wet 12, grimoire 9, pyro 5. `Battle.prototype.hurt` is wrapped three times, and `M.cast` has 6 definitions.
    - The 8-bit has about 30: `EV.rest`, `EV.longRest` and `Battle.draw` are each wrapped twice.
    - About 20 hand-wired `u.kind === 'keeper'` checks sit in battle, ai and ui.
    - Script order in `index.html` is the only thing that defines the chain.
    - A registry already exists (`D.scripts`, `M.EFFECT`).
    - The next signature fight should declare its hooks on its fightDef (`hurt`, `turnStart`, `over`, `finish`) instead of wrapping.
14. **Conditions overload one key.**
    - `conds.restrained` has 12+ sources (grapple, web, vines, ice, water ...). A webbed creature can't be grappled (battle.js:1319), and ending one restraint frees it from all of them.
    - `conds.grappled` is read but never set.
    - Frightened has two names. Rage has two flags.
    - Reactions are spent by hand at 23 sites.
    - Fixes: one `incapacitated()` predicate, a restraint record that knows its sources, a reaction helper.
15. **The 8-bit's story state is about 200 bare string flags with no registry.**
    - `DS.cond` reads a mistyped key as a false flag, silently.
    - situations.js copies each beat's flags by hand.
    - No test walks the `S.*` scripts in story order.
    - A `flags.json` that compile.py checks every `cond` against, plus a headless story walk that generates situations.js, would catch the soft-locks no bench can.
16. **Long functions.**
    - DEEP16: `Battle.prototype.attack` 335 lines, `M.cast` 228 (with about 25 spell-id branches the registry should own), `exec` 181.
    - 8-bit: `Battle.castSpell` 244 lines.
17. **Comments carry history.**
    - Comments are 22-33% of the characters in the rules files, with about 105 dates in the 8-bit's battle.js.
    - The quotes keep every line traceable, which is worth a lot. But notes like "was free" and "till 09-28g" blur what the rule is now.
    - For new code: one line with the current rule and its ruling id, and the history goes in the register.
18. **The tests are mostly smoke tests.**
    - The every-spell check and the three quick fights fail only on exceptions.
    - 13 of 33 bench modes are named by date (`fixes1003`, `ready1002b`).
    - There are 22 copy-pasted assert helpers.
    - Fixes: name modes by feature, share one helper, assert an effect (HP or a condition changed), and fail on any `lastError`.
19. **Payload** (on the queue as "shrink the scripts").
    - The 8-bit loads 1.4 MB raw. `data.js` is 562 KB, about 26% of it `src` citations the game never reads.
    - The grid loads 63 blocking scripts, 2.87 MB raw, with every fight module on every load.
    - This is low priority while Griz is the only player.

## Recommendations, in order

| # | what | size | why first |
|---|---|---|---|
| 1 | **Make the gate honest.** The five probes take `bench16.EXTRA` (or launch through bench16's own runner). `check.py`'s `script()` counts `no result`, and a missing pass tally, as RED. `keeper-probe.py` and `bench8.py migrate` join `ALL_SCRIPTS`. CLAUDE.md's gate line updated. | small, one seat | Every other check leans on it. |
| 2 | **Run the gate on GitHub Actions** for every push to `claude/*` and `main`, and protect `main` with it. Proved today: it runs in Linux Chromium in 28 s. | small | "RED is no push" stops being a remembered law and becomes a fact, and a cloud seat's GREEN means the same as the desk's. |
| 3 | **A floor under the player.** An embed timeout and an error path that fall back to the 8-bit battle. DEEP16 in embed mode posts its crash. Save ids validated on load. The warp's fade reset. | small | These are the bugs that cost a player an evening. |
| 4 | **The grid's rules bugs (A3-A5).** Halve once. `concCheck` on a temp-HP soak and in Wild Shape. Incapacitated ends concentration. The two rolls onto `D.rand`. A bench mode for each. | small | SRD fidelity is the law. These are plain misses. |
| 5 | **Stamps on normalized bytes.** Strip `\r` before hashing, hash each 8-bit file on its own, write only on change. Retire the `palette.js` checkout step if Windows agrees. | small, **desk-verified on Windows** | Ends most re-stamp commits and the index.html conflicts that drop script tags. |
| 6 | **Write "8-bit done"**: one page, start to credits, the beats a player walks, the story jobs it needs, nothing from the grid's SRD list. Point the next week at it. | his call | The pull rule keeps the grid honest. Nothing yet keeps the ship in view. |
| 7 | **One full human walk, then the ear-file loop again.** PLAYTEST.md gets a section for the grid fights in the story. Him, or a trusted player from the stream. | his time | Benches measure the engine. Only play measures the game. |
| 8 | **One sentence of difficulty target, ruled.** For example: *a party played as a player plays reaches each boss at about X% and wins it about Y% with a down or two.* Land the countdown carry first, rerun the walker, then tune CR against the sentence. | his call | It stops each job choosing its own bar, and stops tuning on a wrong floor. |
| 9 | **A story walk and a flags registry** (C15). | medium | It catches the soft-locks that random play won't. |
| 10 | **Hooks on the fightDef**, by the next signature fight (C13). The others (C14, C16-C18) as each file is next touched. | as we pass | No rewrite. Leave each file a little better each time it is touched. |
| 11 | **Housekeeping**, on his word: prune the merged branches (17 now, among them `claude/new-session-*` and `keeper-*`); put an area prefix on commit subjects (`8bit:`, `d16:`, `gate:`, `docs:`) with his quote in the body; give cloud seats a short in-repo orient (what is and isn't in the container). | small | Less to wade through for the next seat. |

## Decisions for Griz

1. Recommendations 1 and 2 (the honest gate, then Actions with `main` protected): a cloud seat's job?
2. Recommendation 3 (the player's floor: embed timeout and fallback, save validation): a job?
3. Recommendation 4 (the grid's four rules misses, each with a bench): a job, or the fixes seat's next round?
4. Recommendation 5 (normalized stamps): a cloud seat builds it, and the desk proves it on Windows before the merge?
5. Will you write, or approve a draft of, an "8-bit done" page? Until then, do new grid-only scope and new signature fights wait?
6. The difficulty sentence: what are X and Y? And does the countdown carry land before any more CR tuning?
7. Still open on the queue and not repeated here (`cloud-jobs.md`): the crew's fourth, the ladder rungs 3-4, leg four's bed, potions at Second Lamp, the walker's leans.

## For the next seat

- **Running the gate in a cloud container:** `DEEP16_BROWSER=/opt/pw-browsers/chromium DEEP16_BROWSER_ARGS=--no-sandbox python3 dev/check.py all`. Until recommendation 1 lands, the five probes say ok without running. Run each one by hand and look for its `N/N` line, or point `DEEP16_BROWSER` at a wrapper that adds `--no-sandbox`: `printf '#!/bin/sh\nexec /opt/pw-browsers/chromium --no-sandbox "$@"\n'`.
- `js/smoke.js` is Tam Vere's dream on vice row, not a smoke test.
- `data/game-data.json` is written by compile.py and read by nothing in the game.
- The readers' line numbers are as of c8f64bb.
- Their counts (the wraps, the flags, the commit buckets) are a reader's greps, not audits. Recount before quoting them as numbers in a ruling.

## Later, 10-03: the spin-up handoff, and this seat's close (ended 2026-10-03T20:26Z)

Griz, after the merge review and the "spin it up" comparison: *"1 build them on your branch, merge yourself / 2 nah"*, then *"sorry, usage says my cloud is out. Handoff for desktop pleaes."* and *"and close if it lets you"*. Nothing from the three was built here; they go to a desktop seat, already ruled (his "1").

**What happened in this window:** the stream-fixes branch was checked and merged on his word (ac6a6ba: the full gate GREEN with every probe really running, the whole ladder 51 x 10 before and after, 49 identical). The four ways seats got eyes on the game today were compared: only the desk's pane puts it in front of him; four cloud seats each improvised headless eyes and wrote down fragments. `main` at 2dda5e4 (the desk's `deep16/play-as-foe.md` and `.claude/launch.json`): `check.py all` GREEN, 50 checks, with the wrapper below.

**For the desktop seat: build these three, gate, commit by name, push `main`** (his "1"; the answer to "2", a private claude.ai build, was "nah"):

1. **`.claude/skills/spin-up/SKILL.md`**, with frontmatter (`name: spin-up`, a `description` naming "spin it up", "run it in the browser", "nobody has played this", "show me"), so the generic `run` skill finds it before it improvises (it checks `.claude/skills/*/SKILL.md` first; the stream-fixes seat found nothing there).
   - **On the desk:** a server from `.claude/launch.json` (`dragonsleep` 8923, `-2` 8924, `-3` 8925). For a cloud branch: `git fetch origin <branch>` and `git worktree add .claude/worktrees/<name> origin/<branch>`; serve that folder. Whether an entry serves the opened folder or the root is untested, so check that the pane shows the branch (a changed file's `?v=` stamp in `deep16/index.html`), else run `py -m http.server 8925 --directory <worktree>`. Add `&fresh=N` to bust the cache. The doors are in `URLS.md` (and `?keeperfight&play=keeper|party`, `&watch&seed=N`, `&log`). Point to `deep16/play-as-foe.md` for a human-played foe.
   - **In the cloud:** one line saying a cloud seat has no pane, and the desk line above, ready to paste. For the seat's own eyes, tested here 10-03 ~20:20Z: serve with `python3 -m http.server <port> --bind 127.0.0.1`, then `NODE_PATH=/opt/node22/lib/node_modules node eyes.js "<path?query>" out.png <seconds>`, a 12-line Playwright script (`chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })`, collect `pageerror` and console errors, `goto`, `waitForTimeout`, `screenshot`), then Read the PNG and, if he should see it, SendUserFile it. `deep16/index.html?keeperfight&lvl=3&watch&seed=31679` loaded with one 404 (likely the favicon) and no page error; `index.html` loaded clean. The image itself was not looked at. Chromium's `--screenshot` alone never advances the game loop: step `D.update()`/`D.draw()` by hand instead (the Keeper seat's way, and the recipe's "the probe must click").
   - **After a merge:** the live link is the spun-up one (Pages from `main`, a minute or two after the push).
2. **CLAUDE.md, one line**, by the Builds and benches paragraph: *"Spin it up" (his answer to "nobody has seen this in a browser"): `.claude/skills/spin-up/SKILL.md` -- the desk serves it in the pane; a cloud seat says it can't and hands the desk the worktree line.* (Griz, 10-03: *"'spin it up in the browser' should be a thing pointed to in the 8bit claude.md I think"*.)
3. **`.gitignore`: `.claude/worktrees/`** (the desk's own catch: untracked and not ignored, so a careless `git add .` drags whole worktrees in).

**Still open, carried** (not ruled):
- The gate's five probes (`dev/pyro-probe.py`, `pyro8-probe.py`, `wet-probe.py`, `wet8-probe.py`, `srdleft-probe.py`) launch without `bench16.EXTRA`, and `check.py` reads their `no result` as ok. In a cloud seat they run empty unless `DEEP16_BROWSER` points at a wrapper: `printf '#!/bin/sh\nexec /opt/pw-browsers/chromium --no-sandbox "$@"\n' > chrome-ns; chmod +x chrome-ns`.
- This review's other decisions (the player's floor in `js/embed.js`, the grid's four rules misses, the normalized stamps, "8-bit done", the difficulty sentence) are on `cloud-jobs.md` under the open questions.
- The close's off-repo half (the daily, the bolt entry, the card's last-seen) is the desk's: this container has no `..\`. This seat: started 2026-10-03T17:23Z, ended 2026-10-03T20:26Z.

## Carried (2026-10-04)

On Griz's word (*"organize and combine them into groups that can be done by one session"*) every live dragonsleep handoff and every cloud seat's notes file were swept into nine grouped handoffs at the they-live root, one session each. This job's open items: decisions 1-3 were built 10-03 (the honest gate, the floor, the four rules misses) and the spin-up three 5431af1; Actions, the normalized stamps, the housekeeping, the code-health notes and the docs' drift are `handoff-2026-10-04-the-gate-and-the-house.md`; the "8-bit done" page is `handoff-2026-10-03-the-road-and-its-rewards.md` §7b; the difficulty sentence is `handoff-2026-10-04-the-difficulty.md` §2.1; the story walk and the flags registry are `handoff-2026-10-04-the-8-bit-battle-and-its-hands.md` §2.8; one full human walk and PLAYTEST's grid section are `handoff-2026-10-04-eyes-on-the-screen.md` §2.8. This file stays as the record and the gotchas; nothing open lives here.

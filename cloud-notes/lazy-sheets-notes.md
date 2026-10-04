# The lazy sheets: notes for the overseer (cloud seat, 2026-10-03)

Branch `claude/lazy-sheets`, from `main` at `979ed86`. Griz, 10-03, to "The lazy load as a later cloud job?": *"4 yes"*.
The job: load a sheet when something is about to draw it, not all 135 at start-up.

## The four numbers

Measured with `dev/lazy-measure.py`. It serves the repo over HTTP, counts every byte sent, and drives the game in Playwright's
headless Chromium. Each case gets a fresh context, so nothing is cached. The bytes are what had been sent when the screen was reached.

| | before | after | sheet images after |
|---|---|---|---|
| to the title (`?ladder` and `?pocket`: neither draws a figure) | 39.46 MB (36.76 MB of sheets, all 135) | **2.71 MB** (no sheets) | 0 |
| to the first turn of a level-3 ladder fight (the Braiding Ettercap, through the camp) | 39.46 MB | **4.42 MB** (1.71 MB of sheets) | 6 |
| to the first turn of a Pocket DM fight (Barley, Aurdin, Vivian, Lymen at 3, and Brokk, a dragonborn fighter 3; two goblins and a wolf; the party, map and CR screens on the way) | 39.46 MB | **3.96 MB** (1.25 MB of sheets) | 7 |
| the bare page (`deep16/`: the proof-of-concept fight's entry card) | 39.46 MB | 3.81 MB (1.10 MB of sheets) | 6 |

The 2.71 MB left at the title is the scripts themselves. `../data/data.js` alone is 0.56 MB, `grimoire.js` 0.27 MB, `battle.js` 0.19 MB.
Two seconds after each screen ("settled"), nothing more had come for these five. None of their units' casters calls a creature.

## What loads at start, and what each scene asks for

- **Start-up (`main.js`):** no sheet. The scene is pushed at once; it used to wait for `D.loadImages(D.spr.images())`.
- **DEEP16 has no title screen of its own.** Each door's first screen:
  - `?ladder`: the ladder list, text and rungs. No sheets until a rung has been the chosen one for a third of a second (below).
  - `?pocket`: the Solskaft hall, drawn by code. No sheets until the party screen.
  - the bare page: a fight. Its six figures.
  - `?embed`: nothing until the 8-bit game sends the fight; it now says `d16:ready` at once.
- **A fight (`Battle.sheets`, asked for in `Battle.prototype.enter`):**
  - `now`: every unit's figure, including those still in the inn, plus a rider's and the scenery's. The first frame waits for these.
  - `soon`: what the fight may bring on later. That covers the figure a split ooze or a won fight swaps in, a druid's wild shapes, the
    summons' pools (Conjure Animals, Giant Insect), Polymorph's beasts, Conjure Elemental's elementals, the familiars for Find Familiar,
    and Guardian of Faith's guard. These are fetched at low priority once `now` has landed.
  - A level-9 druid, wizard and cleric band asks for 13 such sheets, 2.72 MB.
  - The spell gallery asks for every sheet in the background (`S.ensureAll`).
  - The 8-bit game's fight and the show are fights, so they ask the same way.
- **The ladder list** (follow-up, RULED 10-03): once a rung has been the chosen one for a third of a second (20 frames), its figures
  are fetched in the background: the four as its camp draws them, the fight's foes and scenery, and a rung's own familiar
  (`Ladder.prototype.rungSheets`). The camp then opens without the beat. A rung the mouse only runs over fetches nothing.
- **The camp:** its four before it draws. It also fetches the coming fight's foes, scenery and the four's fight looks in the background,
  so the fight usually has nothing left to wait on.
- **The climb:** its four. The level-up and the DM's hands draw the same four.
- **The Pocket DM:**
  - The party's figures are fetched when the party is worked out.
  - A card whose figure is still on its way shows `...` in its place.
  - The table's foes are fetched in the background while the CR screen is up.
- **The pipeline view (`?gate`):** the sheets of its rows. The map view draws only capsules.
- **Anything else:** `S.draw` of a sheet nobody asked for fetches it and draws nothing (it returns the figure's height, so bars and
  labels sit right). The figure appears on the frame after it lands. `S.outline` does the same. A sheet whose image fails is drawn as
  the grey capsule and holds nothing.

## The pieces (`deep16/js/sprites.js`)

- **`S.ensure(names)`** returns a promise that settles when every named sheet has loaded or failed. Each image is fetched once, and a
  fetch under way is shared.
- **`S.ensureAll()`** and **`S.prefetch(names)`** fetch at low priority, behind whatever is already on its way.
- **`S.ready(names)`** and **`S.failed(name)`** are synchronous answers.
- **`S.gate(scene, names)`** starts a scene's own fetch:
  - `S.held(scene)` is true while it is out. The scene's update returns, and its draw is `S.beat`.
  - The beat is the ladder's dark. After 12 frames it adds the 8-bit window, "THE FIGURES ARE COMING", and a pip per figure that
    lights as it lands.
  - After 1200 frames (20 s) the scene goes on regardless.
- **`S.offline`** is set by `dev/bench16.js`: nothing is fetched and nothing waits. The benches never drew figures (their page never
  loaded images) and still don't.
- `D.loadImages` and `S.images()` are untouched. `dev/camp-shot.py` and `dev/rec-test.py` still preload everything that way, and the
  loader shares those images.

## Benches

- `python dev/check.py` (with `DEEP16_BROWSER=/opt/pw-browsers/chromium DEEP16_BROWSER_ARGS=--no-sandbox`): **GREEN** before
  (18 checks, 17 s) and after (19 checks, 15 s). After the ladder follow-up, on `main` with the spell fixes: 20 checks, 15 s;
  `check.py all` GREEN, 46 checks, the 8-bit benches included (main gave `bench8.py` the browser knob).
- **New mode `lazy1003`**, in both `QUICK_MODES` and `ALL_MODES`, has 16 checks. It turns `S.offline` off, points the sheets at
  `../deep16/art/` (the bench page is in `dev/`), and steps forward as each fetch lands. The page's load event waits on the images, so
  `--dump-dom` reads the result. In order:
  1. Nothing is fetched at script load.
  2. A level-3 ladder fight pushed as the camp pushes it is held: `t` stays 0, there is no entry card, and the beat is drawn with
     no capsule.
  3. Only its six figures are fetched.
  4. Once they land, it moves and its first draw has no capsule and starts no fetch.
  5. Nothing it doesn't use is fetched. The roper's and the dragonborn's sheets are not among them.
  6. A Pocket DM fight with Brokk asks for `npcfighter_dragonborn_p0` and draws clean once it lands.
  7. A xorn drawn unasked starts its own fetch and is drawn (1917 pixels) once it lands.
  8. A sheet with a missing image holds its gate only until the error, then draws as the capsule.
  9. The camp asks for its four, and the cutseal fight's foes arrive in the background.
  10. The ladder list (the follow-up, 3 checks):
      - a rung the mouse rests on for 8 frames fetches nothing;
      - the rung rested on for 25 frames gets its figures and nothing else;
      - that rung's camp is not held.

  It passed 16 of 16 on each of four runs, and 19 of 19 on each of four runs after the ladder follow-up.
- `python dev/check.py all`: every DEEP16 mode is ok, including `matrix`, `show` and `lazy1003`, and the wet, Pyro and srdleft probes.
  The 8-bit benches (`bench8.py` ×7) and the `wet8`/`pyro8` probes are RED here only because they hardcode the desktop's Edge path
  (no `DEEP16_BROWSER` knob). Run through a patched path in this container, all nine are ok. They are the 8-bit game's own pages and
  load no DEEP16 sheet.

## Seen, and not seen

Seen, in this container's Chromium over localhost HTTP:
- The beat on a throttled network (400 KB/s, then 150 KB/s) before the camp and before the fight, then each drawn whole.
- A smoke pass with no page errors and no stuck hold on each of these doors:
  - the Pocket DM party screen;
  - the tester ladder's camp and fight;
  - `?climb`, `?gate`, `?fxgallery` (135 of 135 loaded within 8 s), `?show=grick`;
  - `?npc=hyena,hyena,hyena&vs=bard&lvl=3`, `?npc=druid:9,wizard:9,cleric:9&lvl=9`;
  - the bare page;
  - the embed handshake. A probe page held DEEP16 in an iframe and posted a fixture party for the snoot fight; the fight came up
    and drew.

Not seen:
- The desktop's Edge, a phone, or GitHub Pages over a real connection. The numbers are bytes, not seconds.
- The real 8-bit page opening its iframe.
- A summoned or polymorphed creature appearing in a played fight. The draw-time fetch is proven on a bare draw (the xorn), not a cast.
- The gallery clicked through all its spells. The climb's level-up and the DM's hands after a real fight.

## Findings (not fixed here)

- **The Pocket DM's maker draws no figure.** The job's brief said it shows the class's and race's figure. `drawMaker` draws text and
  buttons only, so there was nothing to ask for there. The party cards are the Pocket DM's only figures.
- **`bench8.py` and the `*8-probe.py` scripts hardcoded Edge.** Fixed on `main` since (2061df7, the same two knobs as bench16).
- **The stamps:** the build on Linux moved 34 of the 60 script stamps, 27 of them for files this branch never touched (LF against
  the desktop's CRLF). Only the seven files changed here were restamped, by hand, with their LF hashes: `sprites.js`, `battle.js`,
  `camp.js`, `climb.js`, `pocket.js`, `view.js`, `main.js`.
  `data/sprites.js` came out byte for byte the same.
- **Playwright** was pip-installed here for the measuring script. `dev/lazy-measure.py` needs it (`pip install playwright`) and runs
  with `DEEP16_BROWSER` set, or with Playwright's own browser.

## Questions, and Griz's answers (RULED 10-03)

1. The beat's words "THE FIGURES ARE COMING", the gold pips, shown after a fifth of a second: keep them, or other words?
   Griz: *"your words"*. Kept as built.
2. A fight with a caster who knows Polymorph or a summoning spell fetches that spell's whole pool in the background (2.72 MB for a
   level-9 druid, wizard and cleric). Keep that, or fetch a creature only when the spell is cast, at the cost of a blink where it appears?
   Griz: *"prefetch; nothing waits on it"*. Kept as built.
3. While the ladder list is up, should it fetch the chosen rung's figures, so the camp opens without a beat? Today the list fetches nothing.
   Griz: *"yes"*. Built: the ladder list, above. The third of a second before a rung counts as chosen is the seat's call.
4. The scripts are now most of the start, 2.7 MB. Is shrinking them a later job?
   Griz: *"later"*. It is on the queue in `cloud-jobs.md`.

## For the next seat (the lazy seat's close, 10-03)

What this job taught, so nobody pays for it twice.

**Gotchas (each cost a run here, or nearly did)**
- **The bench page sits in `dev/`.** The sheets' relative `art/...` paths don't resolve there, so `dev/bench16.js` sets `D.spr.offline = true`:
  nothing is fetched and nothing waits. `lazy1003` is the only mode that fetches. It turns offline off and repoints every
  `D.SHEETS[k].image` at `../deep16/`. A new mode that wants real figures has to do both.
- **`--dump-dom` dumps at the load event.** A detached `new Image()` holds that event open, so an async mode works only if each step runs
  inside the image promises' callbacks. A `setTimeout` poll leaves a gap where the load event fires and the DOM is dumped without the
  result.
- **Wait on what `S.prefetch` returns.** A fresh `S.prefetch([])` takes its snapshot of the fetches under way before the background ones
  have started, and that gave a false FAIL here. `lazy1003`'s `settleZ` wraps `S.prefetch` and waits on every promise it handed out.
- **`S.held(scene)` counts frames; `S.held(scene, true)` only looks.** Count in update (and return), look in draw (and draw `S.beat`).
- **A new scene that draws figures:**
  - either `D.spr.gate(this, names)` in enter, the hold in update and the beat in draw;
  - or rely on `S.draw`'s fallback, where the figure is blank for a moment and then appears.

  A draw guarded by `D.spr.has(...)` (the Pocket DM's cards, `pocket.js` ~633) never triggers a fetch, so ask with `S.ensure`.
- **A new way for a fight to bring on a figure** (a new summon spell or pool, a new shape change, a new `u.sheet =`) goes into
  `Battle.prototype.sheets`, under `soon`. Without that, the figure appears a beat late (fetched at its first draw), with nothing broken.
- **Stamps:** `tools/deep16-build.py` run on Linux moves about 27 stamps for files nobody touched (LF against the desktop's CRLF). Stamp
  only the changed files by hand, with the LF `sha1[:10]`; the desktop re-stamps at merge. After the build,
  `git checkout -- deep16/js/palette.js`. `data/sprites.js` doesn't change unless the art does.
- **The branch after a merge:** `git checkout -B claude/lazy-sheets origin/main` was refused here as destructive. When
  `git merge-base --is-ancestor HEAD origin/main` says yes, `git merge --ff-only origin/main` gets to the same base and can't lose anything.
- **Playwright:** `pip install playwright`, then launch with `executable_path='/opt/pw-browsers/chromium'` and `--no-sandbox`. Its page
  screenshots do advance the game loop, unlike headless Edge's `--screenshot`. To see the beat, slow the network with CDP
  `Network.emulateNetworkConditions`: at full local speed the wait is often over before the beat's 12-frame delay, so it may never show.
- **Noise, not faults:**
  - the console's one 404 is `favicon.ico` from a plain `http.server`;
  - the proxy's refusals of `www.google.com` and `redirector.gvt1.com` are Chromium's own background calls.

**Reading the numbers**
- `dev/lazy-measure.py` counts bytes the server sent, not seconds, in a fresh context per case. "Settled" is two seconds later, which
  is what the background fetches add.
- **Before:** 39.46 MB to any first screen.
- **After:**
  - 2.71 MB to the title;
  - 4.42 MB to the first turn of the level-3 ladder fight;
  - 3.96 MB to the first turn of the Pocket DM fight with Brokk.
- All of the 2.71 MB is scripts (`data.js` 0.56 MB). The last number to move is that one, when the scripts shrink.
- A high-level caster's background pool grows with the bestiary: Polymorph takes every beast with a sheet. It was 2.72 MB for a
  druid, wizard and cleric 9 band on 10-03. Griz ruled it stays a prefetch, so a bigger number there is expected, not a regression.

**Rerun, and when**
- **`python dev/check.py` (with `lazy1003` in it)** after any edit to `sprites.js`, `main.js`, Battle's enter or `sheets`, `camp.js`,
  `climb.js`, `pocket.js`, `ladder.js` or `view.js`. In the cloud, set `DEEP16_BROWSER=/opt/pw-browsers/chromium` and
  `DEEP16_BROWSER_ARGS=--no-sandbox`.
- **`python dev/lazy-measure.py`** when what loads at start changes:
  - the shrink-the-scripts job (queued in `cloud-jobs.md`, Griz: *"later"*): the title's 2.71 MB is its before;
  - a new door in `main.js`;
  - a change to which fight is the level-3 rung's first (`D.fightsAt(3)[0]`, the ettercap today).
- **`lazy1003` names things that can change under it:**
  - Brokk's `~` code and `npcfighter_dragonborn_p0` (the race figures' naming);
  - the xorn as the sheet drawn unasked;
  - the cutseal fight as rung 5's first.

  Its ladder step picks two rungs whose figures aren't fetched yet. If a later step loads every rung's figures first, it fails honestly
  with "no two rungs", and the step wants moving, not deleting.
- **When the seven monsters with no grid foe get sheets, or a new summon pool lands:** nothing to do. They join `Battle.sheets` through
  `D.pool` and `D.SUMMON` by themselves.

**Who said what**
- **Griz, 10-03:**
  - *"4 yes"* (the job);
  - *"your words"* (the beat's words and gold pips stand);
  - *"prefetch; nothing waits on it"* (the summon pools);
  - *"yes"* (the ladder list prefetches the chosen rung);
  - *"later"* (shrinking the scripts).

  All are verbatim here and on `invented.json`'s `deep16-lazy-sheets` line.
- **The seat's calls, recorded on that line and open to his ruling:**
  - the split between figures a scene waits for and figures fetched in the background;
  - the 20-second cap;
  - the 12-frame delay before the beat shows;
  - the third of a second before a rung counts as chosen;
  - the `...` on a Pocket DM card;
  - the camp fetching its fight in the background.
- **The overseer** merged round one (56d42b5) and round two (after the reactions; `cloud-jobs.md` has the row). Neither round's answers
  were the overseer's leans; all four are Griz's.

**Seen at the close, and still not seen**
- **Seen at the close:** in the real page, the ladder resting on rung 5 fetched its 8 distinct figures, for the four and for the tester
  ladder's four (Talmok, Willem, Katarina as `npccleric_p0`, Torvald). Each camp then opened unheld. That moves the tester ladder's
  `rungSheets` path to seen; `lazy1003` covers only the four's ladder.
- **Still not seen:**
  - the desktop's Edge, a phone, or Pages over a real connection (the numbers are bytes, not seconds);
  - the real 8-bit page opening its iframe;
  - a summoned or polymorphed creature appearing in a played fight;
  - the gallery clicked through;
  - the climb's level-up and the DM's hands after a real fight.

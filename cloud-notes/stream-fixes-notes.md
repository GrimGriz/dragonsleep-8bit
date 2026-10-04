# The Keeper after the stream (cloud seat, 10-03)

Griz streamed two Keeper fights on the live game and brought their logs (`keeper-seed39593298-L3.txt`: he played the Keeper, `?keeperfight&play=keeper`, the class AI the party; `keeper-seed45101011-L3.txt`: the 8-bit's own fight through the mark, `start rune`, he played the party, the AI the Keeper). His words: *"Got the fight records of the fights I streamed - which means we have live saving fight battles on testers behalf because I am the sloppy... Check those fight records for oddities please."* -- then, mid-read, *"Also noted we need the elemental 'inspect' card for the fella"* and *"yeah, like viv drowned and was never swirled, prone too long?"*

The seat's read of the logs, checked against the code, and his answers to the five decisions:

> *"Looks like too much for the card really, and is still missing the active drown or whatever button if they don't break the swirl. Don't forget the elemental hieroglyph though, mousing over with Ly's protect spell is what caused the notice.*
> *If SRD disadvantages for prone at reach, all the normal fights definitely should. It's a tough fight, giving him some disadvantage would do well, SRD please.*
> *1 yes / 2 SRD / 3 have it open with the wall / 4 please, they've been useful as is, better not broken (though live should no longer be saving them) / 5 yes"*

## What landed

**1 -- the four bugs (his "1 yes")**
- **The retreat crawled a square a move in the water** (`deep16/js/keeper.js` retreatTurn): its score was `1000 - along*10 + cost`, and a water square costs 10 ft, so every square along tied and the nearest won. Now `(dry - along)*100 + cost`: progress outweighs any walk. In the stream Barley spent a Dash for two squares and Vivian and Barley each took an opportunity Slam on a one-square step.
- **A hero who broke free stayed in the deep** (`keeper.js` the held hero's turn): it broke free and returned. Now it walks off the deep with the walk the escape gave back (`outOfDeep`: the nearest square that is not the deep, toward the landing on a tie; in the party's retreat, the farthest toward the landing). Lymen broke free twice in the stream and was swirled again each time.
- **The swirl outlived its hold** (`keeper.js` the hurt hook): a blow that broke the hold freed the hero but the swirl only ended at the next hero command or the human Keeper's turn -- the class AI's blows are not commands. Now `K.checkSwirl` runs where the hold breaks: up out of the water at once, AC 13, and the party's retreat counts from that round.
- **Prone too long** (`deep16/js/grid.js`, `rules.js` `RU.canRise` / `RU.rise`, `battle.js` moveAlong): a hero knocked flat mid-walk by an opportunity Slam walked on at full speed lying down and lay there through the Keeper's turn. SRD 5.1 now: a prone walker stands for half its speed if the walk has it (its reach is what is left), else it crawls, 5 ft more a square; knocked flat on the way, it stands and the walk ends where the walk runs out. Engine-wide: every grid fight.

**2 -- prone at range, the SRD's ("2 SRD")** (`rules.js` RU.edges): a prone target is advantage within 5 ft and disadvantage beyond, melee or ranged -- a reach blow from 10 ft rolled straight before (the Keeper's Slam on the ones its Wave put down), and a bow within 5 ft had disadvantage (now advantage, against the "in melee" disadvantage: a straight roll). Engine-wide.

**3 -- it opens with the wall ("have it open with the wall")** (`keeper.js` above): the AI Keeper's first turn's action is the Ice Wall, cast, whoever is in its reach; with no one in reach the opening stands as it was (READY if it won the initiative, CAST once the party has moved). `K.CFG.opener` (true; the old profile `&old=1` false). In the 8-bit fight it had someone in reach from its first turn and cast only with no one there: nine rounds of Slams, no wall, no backwash, no deep.

**4 -- the log ("please ... better not broken (though live should no longer be saving them)")** (`deep16/js/keeperlog.js`, `js/embed.js`): the format is as it was. The file comes by itself at the fight's end **only when asked on the live site** -- `&log` on the address (`?keeperfight&...&log`, or the 8-bit's `?log`, passed on to the grid's frame by `js/embed.js`) -- and unasked when served from this machine (the preview server, a file); `&nolog` never. `D16.keeperLog.download()` from the console any time. Fixed: the 8-bit's hand-played fight said `mode ai` (now `party`; `ai` is a watched or benched fight); the class AI's Hide is a line; a resisted blow says so (`The Keeper resists fire: 9 becomes 4`); no line for a click that did nothing or the drowning of one already down; an HP change caught at the next turn's door keeps its own round; the drowning shows its die (`1d8+1 less 2 [6]+1 = 5`). And in the game's own cards: "an opportunity attack on the The Keeper" is "on The Keeper" (`battle.js`, a named foe takes no "the").

**5 -- its card ("5 yes")** (`keeper.js` K.inspectLines, `deep16/js/ui.js` inspect): three short lines in place of the Slam's and the water's, from `K.CFG` as it stands:
`Slam x2 +6, 3d4+3, reach 10  DC 15 STR or prone` / `Wave (bonus) DC 15 STR or prone · Ice Wall 3/3` / `Swirl one on the deep · Suffocate (bonus): it drowns twice` -- then the panel's own: immune poison · resists fire, blindsight 30 ft, and the **elemental glyph** in its corner (every creature's type glyph, drawn by the panel: what Protection from Evil and Good keeps off). Seen rendered headless (a scratch shot, not committed).

**Not his "Viv drowned"**: in these two logs Vivian never drowned and was never swirled -- every HP she lost was a Slam; drowning is laid only by the swirl and Active Suffocation (`keeper.js` K.flood, K.suffocate). The one who drowned with no swirl about him at the time was Aurdin (seed 39593298, R5-R6), freed by Vivian's blow but still in the deep while the swirl stuck on (bug 3 above). If he saw Vivian drown on stream, it was a third fight.

**Not bugs** (read and left): the heroes' straight rolls while "prone" -- they stand at their turn's start (rules.js), so the rolls were right; Barley's AC 11 in the 8-bit fight is the 8-bit's Barley, who wears no armour (`data/data.js` barley armor null; the grid's fixture dresses him in splint, AC 17) -- the AI Keeper's Slam went at him eight times.

## Found

- **The old Keeper's floods were the bug's.** With the SRD's prone, `?keeperfight&seed=31679&watch&lvl=3&old=1` no longer floods (won R7, no flood, one wall; it was R6, one flood, one wall). A search: 2 of 61 old-profile seeds flooded before, 0 of 300 after; with only the new prone walking switched off, the 61 reproduce the old table exactly. The old Keeper's floods were heroes knocked flat by its opportunity Slam lying through its turn for its backwash to sweep in, no save. The Keeper of now floods by its Wave (the whole fights below). The probe's pinned check and `deep16-keeper-notes.md` say so.
- **The probe restored the settings after its `old=1` replay with a list of names** (`dev/keeper-probe.js`): a new `K.CFG` key stays at the old profile's value for every later check unless it is added to that list. `opener: true` is in it now.

## Benches

- `python dev/check.py all` GREEN, 50 checks -- the Keeper's own probe (`dev/keeper-probe.py`) is in the gate now (`ALL_SCRIPTS`): 221 checks, 16 of them the stream's fixes (the retreat 3 -> 9 along where it went 5; out of the deep after breaking free; the swirl ends on the blow, AC 10 -> 13; prone at 10 ft disadvantage, at 5 advantage; a prone walker's reach 15 of 30 and a crawl of 10 a square; knocked flat mid-walk up and stopped short; the opener's wall with a hero in reach and no Slam that turn; the card's three lines and the elemental type; the log's mode, hide, resist, no empty line, round, die).
- `python dev/check.py` GREEN, 20 checks.
- The whole fights, the class AI on both sides, 30 a level (seeds `(f+1)*7919+L`), before and after:

| way in | level | won (of 30) | rounds a fight | downs a fight | floods a fight | drownings a fight | walls a fight |
|---|---|---|---|---|---|---|---|
| ledge (WADE IN) | 3 | 5 -> **9** | 17.0 -> 17.4 | 4.5 -> 4.1 | 3.1 -> 2.6 | 6.5 -> 5.4 | 2.7 -> 2.5 |
| ledge | 4 | 18 -> **28** | 14.7 -> 10.9 | 3.5 -> 2.4 | 4.0 -> 2.7 | 8.6 -> 6.4 | 2.2 -> 1.6 |
| ledge | 5 | 30 -> 30 | 7.4 -> 7.3 | 1.1 -> 0.5 | 3.2 -> 2.8 | 7.5 -> 6.7 | 1.4 -> 1.7 |
| rune (the mark) | 3 | 11 -> **17** | 21.4 -> 15.9 | 4.7 -> 3.5 | 3.5 -> 2.8 | 7.0 -> 5.9 | 2.7 -> 2.5 |
| rune | 4 | 29 -> 30 | 12.0 -> 10.3 | 2.4 -> 0.9 | 3.4 -> 2.3 | 7.4 -> 5.6 | 1.7 -> 1.7 |
| rune | 5 | 30 -> 30 | 7.4 -> 7.2 | 0.5 -> 0.1 | 2.0 -> 1.2 | 4.5 -> 2.9 | 1.4 -> 1.5 |

`python dev/keeper-probe.py runs=30 start=<ledge|rune> eight=0`, the same seeds both sides, the class AI on both sides; before is `main` at c8f64bb. **The Keeper got easier for the class-AI party**, most at level 4 from the ledge (60% to 93%) and at level 3 (its own level: 17% to 30% from the ledge, 37% to 57% from the mark) -- the party now gets out of the water (the retreat, the break-free), the swirl lets go when its hold does, and its Slam on the ones its Wave puts down is at disadvantage from 10 ft (his: *"It's a tough fight, giving him some disadvantage would do well"*). Which of the changes moved it most was not measured (the bench ran them together).

## Not seen

- The game in a browser with a person at it: the card was seen in a headless shot; the opener, the retreat and the stand-up were seen in the probe and the bench, not played.
- The `&log` download landing in a real browser's downloads (the probe catches the anchor click; the 8-bit's `?log` reaching the frame was read, not run).
- The class bench and the ease bench (`deep16-class-bench.md`, `deep16-ease-bench.md`) were not rerun: the SRD's prone is engine-wide, so every fight with a knockdown or a reach weapon moves a little.
- His Windows box: everything here ran in the cloud container's Chromium (`DEEP16_BROWSER=/opt/pw-browsers/chromium DEEP16_BROWSER_ARGS=--no-sandbox`).

## The Pocket DM's roster (ruled and built)

From the first question this session (*"are characters players creating surviving a browser close/computer restart?"* -- yes, in that browser's localStorage, `deep16.pocket`), two gaps: no backup file for the roster, and a failed write not reported. His answer: *"pocket dm roster should save in pocket dm and not overlap with the 8bit ideally / failed save should report"*.
- **SAVE ROSTER / LOAD ROSTER** on THE PARTY (`deep16/js/pocket.js` saveRoster, loadRoster, takeRoster): the player's own characters, and Pyro if the trial is won, to `pocket-dm-roster-<date>.json` (`kind: 'pocket-roster'`) and back; a load adds what is new, skips what is here and what will not build (`NPC.spec`), and refuses any other file. The 8-bit's SAVE TO FILE (`js/scenes.js` FILE_KEYS) is untouched and never carries `deep16.pocket`.
- **A failed write says so**: `PK.save` returns whether it was written; `Pocket.prototype.keep` puts up, in red, *NOT SAVED: this browser's storage is full or shut. SAVE ROSTER to a file.*, and the message outlasts the screen change after a character is made (the error sound, not the level-up).
- `python dev/bench16.py` mode `pocket1002`: 34 checks, six of them these (the file, the load's added/had/bad/Pyro, an 8-bit save file refused, FILE_KEYS without the pocket, the refused write, the message kept).
- Not seen: the buttons clicked in a browser, the picker, a real full storage (the bench stands in a store that refuses). Still open: the play record (`deep16.plays`) fills the storage to its edge and trims only itself.

## Spinning it up (begun, stopped on his word)

Griz: *"Nobody has played any of this in a browser yet. - spin it up please"*, then *"The whole keeper thing where we started recording the fights, 'spin it up in the browser' should be a thing pointed to in the 8bit claude.md I think"*, then *"stop, sorry"*. Reached: `python3 -m http.server 8923` from the repo root and Playwright (`/opt/node-tools/node_modules/playwright`, its Chromium under `/opt/pw-browsers`, `--no-sandbox`) loading `deep16/?keeperfight&lvl=3&watch`: the fight ran in the page's own frame loop, no page error, the Ice Wall up and the Wave in round 1. Not reached: the card's peek, the `&log` download on a host that is not this machine (127.0.0.2 serves as one), the Pocket's buttons. **His word after: the desktop spins it up, not a cloud seat** (*"I had the desktop learn to do it. I should be having a desktop instance spin it up not you, forgot where I was."*): no driver script here and no CLAUDE.md pointer from this seat; the desktop has the way.

## The desk's review (relayed by Griz, 10-03)

Of 3524606: merges clean with main; the gate GREEN with **the five probes that run empty in the cloud working** (135/135 on the desk) -- this seat's cloud GREEN ran them empty; the whole ladder, 51 fights x 10 on the same seeds, 49 identical, the south road 90 -> 89% HP, the story Keeper at level 3 still 5 of 10 but 15.2 rounds against 23.4, the ladder's old Keeper 10/10 unchanged; 41 of 47 grid script stamps changed on files the branch never touched (this container's line endings: the desk's re-stamp after the merge flips them back); keep the easier Keeper for now -- merge, play three fights at level 3 from the ledge on live, then move one setting at a time, HP 160 first; on live, `&log` every streamed fight. **One lean of the desk's is not what was built**: it leaned to put `deep16.pocket` in the 8-bit's SAVE TO FILE; Griz's ruling, the one built, is the roster's own file in the Pocket DM, *"not overlap with the 8bit"*. **Merged by this seat on his word** (*"sorry for any confusion. The spinning things up for my eye is a desktop job. The merge is yours."*): `ac6a6ba` on main, main's stamps kept but for the eight scripts the branch changed, the gate GREEN on the merged tree with the five empty probes run for real (wet 52/52, wet8 26/26, pyro 21/21, pyro8 14/14, srdleft 22/22); the row under Merged in `cloud-jobs.md`.

## For the next seat

- **Who said what**: everything above in his words is from this session, 10-03; the five answers are verbatim at the top.
- **The prone rules are engine-wide** (grid.js `G.prone`/`G.stepCost`/`G.reach`, rules.js `RU.canRise`/`RU.rise`, battle.js moveAlong): a caller of `G.reach` for a prone unit gets the reach after it stands (`o.upright: true` asks as if stood; `o.ghost` skips it). The Wave's sweep moves the prone by `G.canStand`, not by reach: it is not slowed.
- **A new `K.CFG` key**: add it to the probe's restore after its `old=1` replay (`dev/keeper-probe.js`, the `Object.assign(D.keeper.CFG, { opener: true, ...` line) and, if the old Keeper did without it, to `K.PROFILE_OLD`.
- **Rerun** `python dev/keeper-probe.py` (and `runs=30` for the table) after any Keeper or prone change; `python dev/check.py all` before a push.
- **The log is a reader's format**: lines and fields as they were; a new kind of line is a new `action`, not a new field.
- **The gate in a cloud seat**: five probes (wet, wet8, pyro, pyro8, srdleft) launch the browser without `DEEP16_BROWSER_ARGS`, fail to start as root, and `check.py` reads their "no result" as ok. A wrapper makes them run: a script that runs `/opt/pw-browsers/chromium --no-sandbox "$@"`, given as `DEEP16_BROWSER` (the desk's review, `dev-review-notes.md`, has the fix itself among its decisions).
- **Merging from Linux**: the build stamps every script by its bytes, and this container's line endings differ from Griz's PC, so a re-stamp here changes stamps on files nobody touched. Keep main's stamps and take new ones only for the files the branch changed (what `ac6a6ba` did).

## The close (10-03, Griz: *"thanks, please close"*)

Started 2026-10-03T15:59Z, ended 2026-10-03T18:27Z, a cloud seat (no daily, bolt or card from here: they live beside the repo on his PC; the desk writes them from this file). Open and unruled:
1. **The Keeper's ease**: the class-AI party wins more since the fixes; the desk's lean is to play three fights at level 3 from the ledge on live before moving a setting, HP 160 first. And on live, `&log` on every streamed fight.
2. **The play record fills the browser's storage to its edge** (`deep16.plays`, trimming only itself): the Pocket DM's roster write can be the one refused -- now it says NOT SAVED, but nothing makes room. Not raised as a decision yet.
3. **"viv drowned and was never swirled"**: not in either streamed log; a third fight's log would settle it.
4. **Not seen by a person**: the card, the opener, the stand-up, the Pocket's SAVE/LOAD ROSTER -- the desktop spins it up for his eye.
5. **The desk's review's decisions** (`dev-review-notes.md`, six, carried in `cloud-jobs.md`): untouched here.

## Carried (2026-10-04)

On Griz's word (*"organize and combine them into groups that can be done by one session"*) every live dragonsleep handoff and every cloud seat's notes file were swept into nine grouped handoffs at the they-live root, one session each. This job's open items: the Keeper's ease (the three fights at L3 on live, retreatRounds, the Ready hook) is `handoff-2026-10-04-the-difficulty.md` §2.8; the card, the opener, the stand-up, SAVE/LOAD ROSTER and "viv drowned" are `handoff-2026-10-04-eyes-on-the-screen.md` §2.3-4; the play record's room was built 65b957a; the review's decisions are `handoff-2026-10-04-the-gate-and-the-house.md`. This file stays as the record and the gotchas; nothing open lives here.

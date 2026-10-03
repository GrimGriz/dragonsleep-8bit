# The early fights, half again (cloud seat, 10-03)

Griz, 10-03: *"I think we should up the CR by a 1/2 for the early fights. They're taking the slide trap down to the cloaker, we'll let that be fine."* -- *"CR your call, you've examined the numbers closer than I. I have found things easy."* -- *"The Keeper has been completely redone (almost finished) exclude. Exclude Wagon Night as well."* The overseer's call: **x1.5 the fight's adjusted XP by the DMG's reading** (`PK.diff`, our four at the fight's level), each addition of the fight's own kind or place, nothing DEADLY x2, nothing under a 60% win for the class AI. Branch `claude/early-cr` from main c8868ab, main merged in at the close. Register: `invented.json#early-fights-half-again`.

## The set

From `grep -n "music: 'boss'" js/events.js`, the crew's line in `js/deep.js` and the walker's legs:

| fight | grid id | 8-bit scene | level | where it stands |
|---|---|---|---|---|
| the Snoot's glory-seekers | `snoot` | events.js S.snoot | 3 | **built** |
| the braiding ettercap (the gulch) | `ettercap` | events.js S.ettercap | 3 | **built** |
| Hask's crew (the Burial) | `crew` | deep.js, The One Law's FIGHT | 4 | built at seven heads; answer 1 rules it back to four, **queued** |
| the chuul (the lake, the ring) | `chuul` | events.js S.lakeFight | 4 | one giant frog ruled (answer 3), **queued** |
| the Wet | `wet` | events.js S.landlordNear, S.deepCradle, S.jelly, S.poolOoze | -- | **out** (answer 4; not benched as a fight) |

Out, as the prompt says: the Keeper, the wagon night and its road catches, the cloaker, the Deep, the 8-bit's random fights and the Hex. Untouched: `snared` (no boss music), and the ladder's `landlord` and `settling` (answer 5).

## The five answers (the overseer, 10-03, on Griz's "CR your call")

1. **The crew:** *keep the text's "Four of them" and swap kinds instead. Hask, the wheelwright, and two of the night crew in place of the crewmen; bench it toward about x1.4 and a class-AI win of 85% or better. The scene's words stand.*
2. **Then read question 2 off that version.** *If the four still finish under 50% HP, go one step lighter and say so.*
3. **The chuul:** *one giant frog out of the shallows (x1.57, 39 of 40, HP 79% to 68%). The capstone itself is untouched; the frog is the lake's own.*
4. **The Wet:** *leave it. The herd is its danger and the landlord already beats the class AI 20 of 20. No wet.js change.* And Griz, 10-03: *"we should cut the Wet from benching it's got all that 'spawn in crawlers that attack corpses story stuff'"*: the Wet is out of fight benching for good, `fight=wet` stays as it is, it is counted in no chain, and its machinery probes stay in the gate.
5. **The ladder's landlord and settling pools:** *leave them. The ladders are not for this, as with the Keeper.*

Then the correction: *record the five answers, build nothing more, take main, run the gate, push; the crew swap and the chuul's frog go on the queue for a later seat.* So 1 and 3 are not built here.

## Before and after

Bench: `python dev/bench16.py x fight=<id> n=20` (seed 1, the class AI on both sides; the bench prints "L5", its own default, but `fight=` builds the four at the fight's level). Thresholds for four: at 3, 300 / 600 / 900 / 1600; at 4, 500 / 1000 / 1500 / 2000.

| fight | what | adjusted XP | reading | won | rounds | HP left | downs |
|---|---|---|---|---|---|---|---|
| snoot | before: glory-seeker, 2 gnolls, 2 hyenas | 840 (420 x2) | MEDIUM | 20/20 | 4.3 | 82% | 0 |
| snoot | **after: +1 gnoll, +1 hyena** | 1325 (530 x2.5) | HARD, **x1.58** | 20/20 | 5.0 | 70% | 0.1 |
| ettercap | before: ettercap, giant spider | 975 (650 x1.5) | HARD | 20/20 | 3.0 | 91% | 0 |
| ettercap | **after: +2 wolf spiders** | 1500 (750 x2) | HARD, **x1.54** | 20/20 | 4.7 | 81% | 0.2 |
| crew | before: Hask, wheelwright, 2 crewmen | 1700 (850 x2) | HARD | 20/20 | 4.3 | 78% | 0 |
| crew | on the branch: +1 crewman, +2 of the night crew (answer 1 undoes it) | 2500 (1000 x2.5) | DEADLY x1.3, x1.47 | 17/20 | 6.5 | 38% | 1.45 |
| chuul | as it stands (the frog queued) | 1100 | MEDIUM | 20/20 | 5.8 | 78% | 0.2 |

## Each addition, and why it belongs

- **The Snoot: a third gnoll (gn3, at 11,3) and a third hyena (hy3, at 7,6).** The pack's own kind: the Snoot's table runs gnolls 2-3 and hyenas 3-4, and the scene's words are already plural ("glory-seekers of the Snoot"). Tried at n=40: +1 gnoll +1 hyena won 39/40, HP 67% (built); a second glory-seeker (x1.48) 39/40, HP 60%; +1 gnoll +2 hyenas (x1.61) 36/40; +2 gnolls (x1.85) 37/40.
- **The gulch: two wolf spiders (ws1 at 4,5; ws2 at 13,6), on the snared lad's squares.** The gulch's own table: wolf spiders 2-3, or a giant spider with 1-2 of them. At n=40: +1 wolf spider (x1.44) 40/40, HP 84%; +2 (built) 39/40, HP 77%; a second giant spider (x1.74, DEADLY x1.06) 39/40, HP 81%.
- **The crew, as it stands on the branch (dad7084): a third crewman (cm3 at 4,8) and two of the night crew (`robber`, nc1 at 15,8 and nc2 at 7,3).** Seven heads against the scene's "Four of them" (deep.crewCatch, deep.crewAsk, deep.vivWins, deep.crewBack). Answer 1 rules four; the swap is queued. At n=40/60: this version won 35/40 and 51/60, HP 43-44%; two crewmen and one of the night crew (x1.58) 25/40 and 39/60; +2 crewmen (x1.24) 26/40; +3 crewmen (x1.69) 9/40; +3 of the night crew (x1.36) 54/60.

Every addition is in the grid's record (`deep16/data/fights.js`, named in the record's comment) and in the 8-bit scene's list (`js/events.js`, `js/deep.js`): inside the game the 8-bit list decides who is on the grid (battle.js `roster`). A scratch check put each list through the embed: every head lands on its own square, no warning.

## What was not seen

- **No pane:** nothing was drawn or watched; the placements were checked only through the embed (squares and order).
- **The 8-bit's own battle** with the longer lists (it fights them only when DEEP16 is not there) was not benched.
- **The walker** counts only the road, so it was not rerun.

## For the next seat (the early-cr seat's close, 10-03)

**Where the branch stands.** `claude/early-cr` carries four commits of the job (the Snoot 45c1dc5, the gulch 9b849b2, the crew dad7084, the register and notes), main merged at the close, and the stamps. `dev/check.py all` GREEN. The Snoot and the gulch are done. **The crew commit (dad7084) is the one answer 1 overturns:** merged as is, the game ships a seven-head crew under "Four of them" until the queued swap lands; the desktop can merge it and let the later seat replace it, or revert dad7084 at the merge.

**The crew swap, queued (answer 1, then 2).** Read before building: the night crew (`robber`, "Night Crew") are CR 1/8, so the swap as worded goes the wrong way. Benched here at n=40, seed 1, before the correction came in (scratch, nothing in the tree):

| four heads | adjusted XP | x | won | rounds | HP left | downs |
|---|---|---|---|---|---|---|
| Hask, wheelwright, 2 crewmen (as it was) | 1700 | 1.00 | 40/40 | 4.5 | 75% | 0.07 |
| Hask, wheelwright, 2 of the night crew (answer 1 as worded) | 1400 | 0.82 | 40/40 | 3.6 | 85% | 0.05 |
| Hask, wheelwright, crewman, 1 of the night crew | 1550 | 0.91 | 40/40 | 4.2 | 79% | 0.03 |
| Hask, wheelwright, crewman, a bandit captain (a second Hask in all but name) | 2400 | 1.41 | 34/40 | 6.3 | 48% | 0.95 |
| Hask, wheelwright, crewman, a berserker (the Hex's; out of place) | 2400 | 1.41 | 36/40 | 6.0 | 51% | 0.88 |
| Hask, wheelwright, crewman, a veteran | 2900 | 1.71 | 37/40 | 6.0 | 50% | 0.80 |

At four heads, x1.4 needs a CR 2 in the fourth slot, and the crew's own family has none but Hask's pattern. That goes back to Griz or the overseer before it is built: the swap as worded (easier than today), the crew left as it was, or a CR 2 named for the crew. Answer 2 then reads off whichever is built (under 50% HP left, one step lighter).

**The chuul's frog, queued (answer 3).** One `giantfrog` (SRD 5.1 Giant Frog, CR 1/4, it swims) out of the shallows: `{ id: 'frog', kind: 'giantfrog', at: [5, 4] }` in `fights.js` chuul (the point's water, row 4) and `'giantfrog'` after `'chuul'` in events.js S.lakeFight's list. 1100 MEDIUM to 1725 HARD, x1.57; benched in scratch at n=40: 39/40, 5.8 rounds, HP 79% to 68%, downs 0.13 to 0.23. The ring's rounds are untouched. The register line wants its own sentence when it lands.

**The ladders (answer 5: "The ladders are not for this, as with the Keeper").** The Snoot's, the gulch's and the crew's records are also the ladder's rungs 3 and 4 (`D.fightsAt` takes every record with a level and no `ladder: false`), so as built **the ladder changed too**. If answer 5 covers them, the Keeper's pattern does it: `ladder: false` on the story record and a `<id>-ladder` copy with the old foes right after it in the list (its place on the rung), as `keeper-ladder` is. Not built: it was asked only of the landlord and the settling pools.

**Gotchas.**
- **The 8-bit list is the roster.** Inside the game, `embed.enemies` (the 8-bit scene's list) decides who stands on the grid (`Battle.roster`), matched by kind to the record's squares in order. An addition in `fights.js` alone shows on the ladder and the bench but not in the game; one in the list alone lands beside its kind's first square.
- **`PK.diff` counts every head in the multiplier,** CR 0 hyenas and CR 1/8 night crew too (the DMG's "ignore the much weaker ones" is not read). One cheap head can tip a fight up a multiplier band; read the bench before trusting the reading. The crewmen (SRD Thugs with Pack Tactics, in the Burial's dark) are where the reading and the bench part most.
- **Do the sum through `PK.diff`, not by hand:** the crew was first reported here at 2375 (x1.40) for what is 2500 (x1.47).
- **`dev/bench16.js` joke1002** read the Snoot's pack as exactly 2 hyenas and 3 gnolls; it now counts from the record. Other modes that build `snoot`, `ettercap` or `crew` (ring0930, druidlast, charms, auras, familiar, features, and `srdleft-probe`) passed with the new heads but pick units by kind or index: a check that wants "the first foe" may move if the list's order changes.
- **The probes in the gate** (`wet-probe`, `wet8-probe`, `pyro-probe`, `pyro8-probe`, `srdleft-probe`) don't read `DEEP16_BROWSER_ARGS`. In the cloud, as root, point `DEEP16_BROWSER` at a two-line wrapper that execs `/opt/pw-browsers/chromium --no-sandbox "$@"`. Without it they print "no result", and the gate still reads ok, because `check.py` greps for FAIL.
- **Stamps:** `deep16/index.html` has `data/fights.js` stamped by hand (LF `sha1[:10]`), as the lazy seat's notes advise (the build on Linux moves every stamp). The root `index.html` was re-stamped by `tools/compile.py` after the merge (one hash for every 8-bit script; events.js and deep.js changed). The desktop re-stamps at merge either way.

**Rerun, and when.** `python dev/bench16.py x fight=<id> n=20` for snoot, ettercap, crew and chuul after any change to their records, to the four's fixture, or to Pack Tactics, Rampage or Web; the table above is the before. `python dev/bench16.py x mode=joke1002` after any change to the Snoot's record. Not the Wet: it is not benched as a fight (Griz, 10-03).

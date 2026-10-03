# The early fights, half again (cloud seat, 10-03)

Griz, 10-03: *"I think we should up the CR by a 1/2 for the early fights. They're taking the slide trap down to the cloaker, we'll let that be fine."* -- *"CR your call, you've examined the numbers closer than I. I have found things easy."* -- *"The Keeper has been completely redone (almost finished) exclude. Exclude Wagon Night as well."* The overseer's call: **x1.5 the fight's adjusted XP by the DMG's reading** (`PK.diff`, our four at the fight's level), each addition of the fight's own kind or place, nothing DEADLY x2, nothing under a 60% win for the class AI. Branch `claude/early-cr` from main c8868ab. Register: `invented.json#early-fights-half-again`.

## The set

From `grep -n "music: 'boss'" js/events.js`, the crew's line in `js/deep.js` and the walker's legs:

| fight | grid id | 8-bit scene | level | in? |
|---|---|---|---|---|
| the Snoot's glory-seekers | `snoot` | events.js S.snoot | 3 | **built** |
| the braiding ettercap (the gulch) | `ettercap` | events.js S.ettercap | 3 | **built** |
| Hask's crew (the Burial) | `crew` | deep.js, The One Law's FIGHT | 4 | **built** |
| the chuul (the lake, the ring) | `chuul` | events.js S.lakeFight | 4 | asked (Q3) |
| the Wet's four (otyugh, harness crawler, jelly, pool ooze) | `wet` | events.js S.landlordNear, S.deepCradle, S.jelly, S.poolOoze | 4 (the situation's) | asked (Q4) |

Out, as the prompt says: the Keeper, the wagon night and its road catches, the cloaker, the Deep, the 8-bit's random fights and the Hex. Not in the set and untouched: `snared` (no boss music), and the ladder's own copies of the Wet's creatures, `landlord` (rung 4) and `settling` (rung 3) -- Q5.

## Before and after

Bench: `python dev/bench16.py x fight=<id> n=20` (seed 1, the class AI on both sides; the bench prints "L5", its own default, but `fight=` builds the four at the fight's level). The Wet on a scratch bench (below). Thresholds for four: at 3, 300 / 600 / 900 / 1600; at 4, 500 / 1000 / 1500 / 2000.

| fight | what | adjusted XP | reading | won | rounds | HP left | downs |
|---|---|---|---|---|---|---|---|
| snoot | before: glory-seeker, 2 gnolls, 2 hyenas | 840 (420 x2) | MEDIUM | 20/20 | 4.3 | 82% | 0 |
| snoot | **after: +1 gnoll, +1 hyena** | 1325 (530 x2.5) | HARD, **x1.58** | 20/20 | 5.0 | 70% | 0.1 |
| ettercap | before: ettercap, giant spider | 975 (650 x1.5) | HARD | 20/20 | 3.0 | 91% | 0 |
| ettercap | **after: +2 wolf spiders** | 1500 (750 x2) | HARD, **x1.54** | 20/20 | 4.7 | 81% | 0.2 |
| crew | before: Hask, wheelwright, 2 crewmen | 1700 (850 x2) | HARD | 20/20 | 4.3 | 78% | 0 |
| crew | **after: +1 crewman, +2 of the night crew** | 2500 (1000 x2.5) | DEADLY x1.3, **x1.47** | 17/20 | 6.5 | 38% | 1.45 |
| chuul | as it stands (not built) | 1100 | MEDIUM | 20/20 | 5.8 | 78% | 0.2 |
| wet: landlord | as it stands (not built) | 1800 | HARD | 0/20 | 15.3 | 0% | 4.0 |
| wet: jelly | as it stands | 450 | TRIVIAL | 20/20 | 1.9 | 93% | 0 |
| wet: pool ooze | as it stands | 100 | TRIVIAL | 20/20 | 1.0 | 99% | 0 |
| wet: harness crawler | as it stands | 450 | TRIVIAL | 20/20 | 2.2 | 92% | 0 |

## Each addition, and why it belongs

- **The Snoot: a third gnoll (gn3, at 11,3) and a third hyena (hy3, at 7,6).** The pack's own kind: the Snoot's table runs gnolls 2-3 and hyenas 3-4, and the scene's words are already plural ("glory-seekers of the Snoot"). Tried at n=40: +1 gnoll +1 hyena won 39/40, HP 67% (built); a second glory-seeker (x1.48) 39/40, HP 60%; +1 gnoll +2 hyenas (x1.61) 36/40; +2 gnolls (x1.85) 37/40.
- **The gulch: two wolf spiders (ws1 at 4,5; ws2 at 13,6), on the snared lad's squares.** The gulch's own table: wolf spiders 2-3, or a giant spider with 1-2 of them. At n=40: +1 wolf spider (x1.44) 40/40, HP 84%; +2 (built) 39/40, HP 77%; a second giant spider (x1.74, DEADLY x1.06) 39/40, HP 81%.
- **The crew: a third crewman (cm3 at 4,8) and two of the night crew (`robber`, nc1 at 15,8 and nc2 at 7,3)** -- the warrens' silver-robbing crews (the warrens_c table: night crew 2-3 and a crew boss). Built: x1.47, won 35/40 (seed 1) and 51/60 (seed 2), HP 43-44%. The other near step, two crewmen and one of the night crew (x1.58), won 25/40 and 39/60, HP 23-27%, two downs a fight: the crewmen are SRD Thugs with Pack Tactics, in the Burial's dark, and the DMG's reading undercounts them. Also tried: +2 crewmen (x1.24) 26/40; +3 crewmen (x1.69) 9/40; +3 of the night crew (x1.36) 54/60. **The words say four** (deep.crewCatch "Four of them at one family's niches", deep.crewAsk "Four of them", deep.vivWins "the four of them", deep.crewBack "the same four"): not changed (scenes are not this job) -- Q1.

Every addition is in the grid's record (`deep16/data/fights.js`, named in the record's comment) and in the 8-bit scene's list (`js/events.js`, `js/deep.js`): inside the game the 8-bit list decides who is on the grid (battle.js `roster`). A scratch check put each list through the embed: every head lands on its own square, no warning. The ladder's rungs 3 and 4 carry the same records.

## Asked, not built

- **The chuul.** The lake has no table (`content/encounters.json`), the SRD 5.1 gives the chuul no lair, and there is no bigger chuul. Benched at n=40 in scratch only (before: 40/40, 5.5 rounds, HP 79%, downs 0.13): a giant frog out of the shallows (the Glowseep's, it swims; 1725 HARD, x1.57) 39/40, 5.8 rounds, HP 68%, downs 0.23; two frogs (2400 DEADLY x1.2) 38/40, HP 61%; a poisonous snake (x1.53) 40/40, HP 76%, barely felt. Q3.
- **The Wet.** Its grid ignores the 8-bit list; its creatures are the Settling's sleepers by role (`deep16/js/wet.js`), so company for one entry needs wet.js to sleep and wake it with its creature, and to carry its death through the flags -- a change to a heavily ruled fight, not a data line. And the landlord already beats the class AI 20/20 at 4: someone goes down, the herd comes. A scratch prototype (a companion seated awake beside the woken creature; n=20): a **rat swarm** with each (warrens_d's rats: jelly 750 EASY x1.67, ooze 225 x2.25, crawler 750 x1.67) won 20/20 at every entry, HP 90% / 77% / 90%; a **crawler** with each (x3 / x8 / x3: one crawler is CR 2) won jelly 17/20, ooze **13/20** (chasing it wakes the jelly, then the herd), harness 20/20. Q4.

## What was not seen, and for the desktop

- **No pane:** nothing was drawn or watched; the placements were checked only through the embed (squares and order).
- **`bench16.py x fight=wet` does not measure the Wet:** the fight has no level, so the four come in at 9 (`fixture(NaN)`), nothing is awake without an 8-bit entry, and all 20 ran to the cap. The Wet's rows above are from a scratch bench (wet-probe.js's `run`, the four at 4, from each of the four entries); it is not in the tree.
- **The 8-bit's own battle** with the longer lists (it fights them only when DEEP16 is not there) was not benched.
- **Stamps:** `deep16/index.html` has fights.js's new hash only (LF here; the desktop re-stamps at merge). The root `index.html`'s one `?v=` for every 8-bit script was not touched (events.js and deep.js changed; `compile.py` re-stamps it); `data/data.js` has no content change.
- **The joke mode** (`dev/bench16.js` joke1002) counted the Snoot's pack as 2 and 3; it now reads the counts from the fight's record.
- **The gate:** `python dev/check.py all` GREEN, 48 checks, with Chromium wrapped in `--no-sandbox` (the probes' own launch lines do not read `DEEP16_BROWSER_ARGS`; the wrapper is the cloud room's, nothing in the tree).
- **The walker** counts only the road, so it was not rerun.

## Questions

1. The crew's words say "Four of them" in four lines; the fight now has seven. Change the count to seven, or keep four and swap kinds instead?
2. The crew is built at x1.47 (the class AI wins 85%, but HP left falls from 78% to 38%: the hardest real jump of the three). Keep it, or one step lighter (three of the night crew, x1.36, wins 90%)?
3. The chuul: one giant frog out of the shallows (x1.57; HP left 79% to 68%), two, or leave the capstone alone?
4. The Wet: leave it (the herd is its danger), a rat swarm waking with the jelly, the ooze and the roused crawler (still 20/20), or a crawler with each (the ooze's entry falls to 13/20)? Either one needs wet.js changed.
5. The ladder's own landlord (rung 4) and settling pools (rung 3): leave them as they are?

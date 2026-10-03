# The Keeper, build notes (cloud seat, 2026-10-03; branch `claude/intelligent-maxwell-6ich3v`)

Spec: `handoff-2026-10-02-the-keeper.md` plus Griz's answers of 10-03 (DC 15 Slam, drowning twice each floored at 1, wall row 11 readied on "a party member moves toward the exit", 10 ft a wave, any water square beside the victim, the dive as the Slam's look, any pose from either Grok sheet). Code: `deep16/js/keeper.js`; the foe `deep16/data/foes.js keeper`; the map's `deeps`, `lane`, `wallRow` in `deep16/data/maps.js floodstair`; hooks in `ai.js` (dispatch), `battle.js` (moveAlong: the readied wall), `walls.js` (the ice drawn), `gallery.js` and `main.js` (the two routes below). Numbers: `D16.keeper.CFG`.

## Open it in Edge (from a checkout of this branch; or the preview server, `http://localhost:8923/deep16/index.html?...`)
- **The Keeper gallery** (every look, one scene at a time, lit): `deep16/index.html?fxgallery&keeper` -- keys left/right, E again; `&scene=slam|wave|pour|wall|fire|freeze`, `&auto`, `&dark` for the stair's real torchdark.
- **The fight, played by you**: `deep16/index.html?keeperfight` (the fixture party at level 3; `&lvl=4`, `&wall=7` the Ice Wall's row, `&hp=150`, `&lit`).
- **The fight, watched** (the class AI runs the four, no entry card): `deep16/index.html?keeperfight&watch&seed=174221&lvl=3`.
- **Seed 47517** (level 3: won in round 6, one flood with an Active Suffocation, one wall, four waves) replays the same fight drained and through the page's frame loop (`?keeperfight&watch&seed=47517&lvl=3`); dev/keeper-probe.py checks it. (The earlier pane-vs-bench split was the wall's "toward the exit" read off a tween the frame loop clears: fixed in d030e47. Seeds change whenever the rules do: 174221, the first one named, is no longer that fight.)
- **Pose swap in the pane** (Griz: neither sheet is canon): in the console, `D16.keeper.pose({ slam: 'slam_ba' })` (the Slam's dive the other way about) or any row: `pose({ idle: 'b_idle', wave: 'a_wave', wall: 'b_wall', slam: 'b_dive' })`. Rows: `a_*` the first Grok sheet's, `b_*` the second's (idle, wall, dive, wave); `stand` (the default idle: the third sheet's standing poses, a facing each); `slam_b3a` (the default Slam: the second sheet's dive with the first sheet's frame 3), `slam_ab` (the first sheet's dive to the launch, the second's the smash and return), `slam_ba`; `hurt_b`, `die_b`. Defaults in `D16.keeper.POSE`. keeper_p3 holds what is drawn about him: the water swirl, the ice-wall form (frames 4-6, the solid wall, are what stands). Settings in `D16.keeper.CFG`: `hideAfter` (back into the water unseen after its turn), `oaWave` (its opportunity attack a wave toward the deep: not ruled, off), `freezeNeeds` ('all' four squares frozen to hold it, or 'any'), `iceDC` 7, `wallStrikeAC` 10, `wallScale`, `swirlScale`.

## Run it here
- Probe: `python dev/keeper-probe.py` (49 checks; `runs=30 lvls=3,4,5 wall=<row> hp=<n> hide=0 oa=1 need=any` counts whole fights run by the class AI, drained).
- `python dev/bench16.py x fight=keeper n=30` (NB: `fight=` ignores `lvl=`, the three levels print identical numbers; the probe's `lvls=` is the by-level table).
- Cloud only: `DEEP16_BROWSER=<chromium> DEEP16_BROWSER_ARGS=--no-sandbox`. check.py GREEN (18 checks).

## Through the page's frame loop, current build (30 fights a level, the four, Keeper at 100 HP)
| level | won | avg rounds | downs/fight | waves/fight | floods | drowning ticks | fights with a wall |
|---|---|---|---|---|---|---|---|
| 3 | 30/30 | 7.2 | 1.20 | 5.4 | 4 | 7 | 15 |
| 4 | 30/30 | 6.0 | 0.30 | 4.7 | 3 | 6 | 16 |
| 5 | 30/30 | 3.0 | 0.00 | 2.6 | 4 | 3 | 14 |

(The same build drained gives the same kind of numbers; before the 10-03 notes, level 3 was 6.6 rounds and 0.80 downs. Back-into-the-water (`hideAfter`) costs the party a little: level 3 downs per fight 0.83 off, 1.08 on, drained, 40 fights. The opportunity-attack wave, on against off, drained, 40 fights a level: level 3 downs 43 -> 32, floods 4 -> 9; level 4 downs 12 -> 16, floods 7 -> 8; level 5 0 -> 0, floods 5 -> 3.)

## What the bench showed before the notes (drained; 40 fights a level, Keeper at 100 HP -- a proposal, Griz's veto)
**Wall row 11** (the stair is 4 wide here: x7-10, the lane; the wall seals it)
| level | won | avg rounds | downs/fight | waves/fight | floods | drowning ticks | wall springs |
|---|---|---|---|---|---|---|---|
| 3 | 40/40 | 6.6 | 0.82 | 5.2 | 5 | 13 | 19 |
| 4 | 40/40 | 5.5 | 0.28 | 4.7 | 5 | 6 | 19 |
| 5 | 40/40 | 2.7 | 0.00 | 2.3 | 1 | 1 | 19 |

**Wall row 7**
| level | won | avg rounds | downs/fight | waves/fight | floods | drowning ticks | wall springs |
|---|---|---|---|---|---|---|---|
| 3 | 40/40 | 6.0 | 0.90 | 4.8 | 2 | 0 | 0 |
| 4 | 40/40 | 5.1 | 0.17 | 4.1 | 3 | 5 | 0 |
| 5 | 40/40 | 2.5 | 0.03 | 2.1 | 0 | 0 | 0 |

**Wall row 6**: identical to row 7, number for number -- the wall is never raised there (below), so the row changes nothing.

At the Water Weird's 58 HP the four killed it in 2.4-3.6 rounds and the deep never came into play (0 floods in 60 fights); even at 150 HP the party won every fight, so the dial that matters is the rung or the level more than HP.

## Where rows 6 and 7 are ("in the pool, where nothing can be sealed in")
`floodstair` is 18 wide. Rows 1-7 are the pool (row 7: water x4-12; row 6: x3-13), rows 8-13 the stair. The Ice Wall covers the lane, x7-10, four squares. **Only rows 11, 12 and 13 are exactly four wide** (`#######====#######`), so a wall across x7-10 there closes the stair completely: that is what "seals the party in with the Keeper" needs, and why 11 was the row. Row 10 and row 9 are six wide (x6-11: a floor square either side of the stair), row 8 eight wide (x5-12), the pool at 6 and 7 nine to eleven wide. A wall across x7-10 on any of those has an open square on each side, so a hero walks round it (at 7: (6,7), (5,7)... or the shore at (6,8)); nothing is sealed in or out. Also, the party enters on rows 8-10 and the Keeper sits at (8,4): a wall on 6 or 7 is between them and it, not behind them. In the code, `canReadyWall` asks for a hero on the pool side of the row, and the party starts south of 6 and 7, so the Keeper never readies it: hence 0 springs, and the same table. Wall `rowOverride` is a plain number, so nothing is lost by it; a "full-width" wall at 6/7 (every square of the row) would be a different feature, not built.

## Not built / not seen
- **Seen** (headless Chromium, the page stepped by hand, screenshots): the Keeper in the fight from `keeper_p2`, standing in the pool to the waist, the Slam's arc, ring and spray, the Wave's rows, the swirl about a held hero (it quickens on Active Suffocation), the wall growing, the ice squares, the break-out, a weapon blow on the wall. **Not seen**: any of it at game speed in a pane; the figure's scale and foot anchor against the others; the new idle's look as it moves; a click aiming a blow at the wall (the UI lookups are four one-line changes, `occ()` in js/ui.js, unexercised by a click: the probe drives the same code through `exec`); the opportunity-attack wave and the swirl-freeze scenes drawn.
- **Standing depth** is a drawing only (K.wade, 8 px of figure under at the shallow end to 48 at the deep, +6 while it swirls). The map's heights and the rules are as they were.
- **Judgement calls to veto:** the freeze save for a swirling Keeper is the spell's own save ability (CON where it names none) against the caster's spell save DC, and none against a spell that rolls an attack; "the water he is in" is all four of its squares frozen (`freezeNeeds: 'any'` for one); the ice's break-out save is STR; the held one's friends reach the Keeper from anywhere within reach of the held one (G.dist); thunder spells destroy a section as fire does.
- The Slam's wave and the sprite's dive start together and land close, not on the same frame. Freezing has the bloom and the ice only.
- Not built (Griz's calls): the drowning and stabilizing rule (a downed hero's drowning stops at 0 HP); the ice's difficult-terrain cost.
- The class AI never retreats, so in the bench the wall is sprung only by a stray step south.
- No ear-file / PLAYTEST pass; no desktop Edge run.

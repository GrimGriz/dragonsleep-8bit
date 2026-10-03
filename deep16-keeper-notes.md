# The Keeper, build notes (cloud seat, 2026-10-03; branch `claude/intelligent-maxwell-6ich3v`)

Spec: `handoff-2026-10-02-the-keeper.md` plus Griz's answers of 10-03 (DC 15 Slam, drowning twice each floored at 1, wall row 11 readied on "a party member moves toward the exit", 10 ft a wave, any water square beside the victim, the dive as the Slam's look, any pose from either Grok sheet). Code: `deep16/js/keeper.js`; the foe `deep16/data/foes.js keeper`; the map's `deeps`, `lane`, `wallRow` in `deep16/data/maps.js floodstair`; hooks in `ai.js` (dispatch), `battle.js` (moveAlong: the readied wall), `walls.js` (the ice drawn), `gallery.js` and `main.js` (the two routes below). Numbers: `D16.keeper.CFG`.

## Open it in Edge (from a checkout of this branch; or the preview server, `http://localhost:8923/deep16/index.html?...`)
- **The Keeper gallery** (every look, one scene at a time, lit): `deep16/index.html?fxgallery&keeper` -- keys left/right, E again; `&scene=slam|wave|pour|wall|fire|freeze`, `&auto`, `&dark` for the stair's real torchdark.
- **The fight, played by you**: `deep16/index.html?keeperfight` (the fixture party at level 3; `&lvl=4`, `&wall=7` the Ice Wall's row, `&hp=150`, `&lit`).
- **The fight, watched** (the class AI runs the four, no entry card): `deep16/index.html?keeperfight&watch&seed=174221&lvl=3`.
- **Seed 174221 is not the same fight in the pane.** Run the way the bench runs it (drained, no frame loop) it is level 3, won in round 7, two floods, both Active Suffocations, one hold broken, one wall, five waves (dev/keeper-probe.py checks this). Run through the page's frame loop the same seed plays a *different* fight (round 5, no floods, no wall): the first divergence is a step of Vivian's, where the bench's Keeper springs the wall and the page's makes an opportunity attack. Over 24 seeds the frame loop sprang the wall 0 times and flooded 2; the drained bench sprang it ~40% of the fights. **Unexplained**, and it matters: the bench's numbers may not describe what plays in the pane. To watch a fight with a flood, run seeds in the pane and pick one, or use the gallery's `pour` scene.
- **Pose swap in the pane** (Griz: neither sheet is canon): in the console, `D16.keeper.pose({ slam: 'slam_ba' })` (the Slam's dive the other way about) or any row: `pose({ idle: 'b_idle', wave: 'a_wave', wall: 'b_wall', slam: 'b_dive' })`. Rows: `a_*` the first Grok sheet's, `b_*` the second's (idle, wall, dive, wave), `slam_ab` (default: the first sheet's dive to the launch, the second's the smash and return), `slam_ba`, `hurt_b`, `die_b`. Defaults in `D16.keeper.POSE`.

## Run it here
- Probe: `python dev/keeper-probe.py` (32 checks; `runs=30 lvls=3,4,5 wall=<row> hp=<n>` counts whole fights run by the class AI, drained).
- `python dev/bench16.py x fight=keeper n=30` (NB: `fight=` ignores `lvl=`, the three levels print identical numbers; the probe's `lvls=` is the by-level table).
- Cloud only: `DEEP16_BROWSER=<chromium> DEEP16_BROWSER_ARGS=--no-sandbox`. check.py GREEN (18 checks).

## What the bench shows (class AI party, the four; 40 fights a level, Keeper at 100 HP -- a proposal, Griz's veto)
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
- **Seen** (headless Chromium, the page stepped by hand, screenshots): the Keeper drawn in the fight from `keeper_p2`, the Slam's arc, landing ring and spray, the Wave's rows over the lane, the pour's column, rings and bubbles with the victim drawn down under it, the gallery's six scenes. **Not seen**: any of it moving at game speed in a pane; the figure's scale and foot anchor against the others; a fight played with the keys.
- The Slam's wave and the sprite's dive start together and land close, not on the same frame. The wall's rising has the sprite pose and the bloom only; freezing has the bloom only.
- Weapons and single-target spells at the Ice Wall (no way to aim at it); its sections are hurt only by area spells. The ice's difficult-terrain cost. A downed hero's drowning (it stops at 0 HP). Griz's calls.
- The class AI never retreats, so in the bench the wall is sprung only by a stray step south.
- No ear-file / PLAYTEST pass; no desktop Edge run.

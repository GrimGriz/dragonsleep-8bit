# The Keeper, build notes (cloud seat, 2026-10-03; branch `claude/intelligent-maxwell-6ich3v`)

Spec: `handoff-2026-10-02-the-keeper.md` plus Griz's answers of 10-03 (DC 15 Slam, drowning twice each floored at 1, wall row 11 readied on "a party member moves toward the exit", 10 ft a wave, any water square beside the victim, the dive as the Slam's look, any pose from either Grok sheet). Code: `deep16/js/keeper.js`; the foe `deep16/data/foes.js keeper`; the map's `deeps`, `lane`, `wallRow` in `deep16/data/maps.js floodstair`; hooks in `ai.js` (dispatch), `battle.js` (moveAlong: the readied wall), `walls.js` (the ice drawn). Numbers: `D16.keeper.CFG`.

## Run it here
- Probe: `python dev/keeper-probe.py` (28 checks; `runs=30 lvls=3,4,5 wall=<row> hp=<n>` counts whole fights run by the class AI).
- `python dev/bench16.py x fight=keeper n=30` (NB: `fight=` ignores `lvl=`, the three levels print identical numbers; the probe's `lvls=` is the by-level table).
- Cloud only: `DEEP16_BROWSER=<chromium> DEEP16_BROWSER_ARGS=--no-sandbox`. check.py GREEN (18 checks) at 406e6c3.

## What the bench shows (class AI party, the four; 30 fights each, HP 100)
| level | won | avg rounds | downs/fight | waves/fight | floods | wall springs |
|---|---|---|---|---|---|---|
| 3 | 30/30 | 6.6 | 0.8 | 5.1 | 4 | 15 |
| 4 | 30/30 | 5.6 | 0.3 | 4.9 | 2 | 16 |
| 5 | 30/30 | 2.6 | 0 | 2.3 | 1 | 14 |

At the Water Weird's 58 HP the four killed it in 2.4-3.6 rounds and the deep never came into play (0 floods in 60 fights), so it is 100 HP: **his to veto**. Even at 150 HP the party won every fight; the Keeper is a hazard before it is a threat, as designed.

## A fight to watch (replays roll for roll in the probe's harness)
Level 3, seed 174221: two floods, both Active Suffocations (drowning twice), one hold broken by a blow, one wall sprung, five waves, won in round 7. In the page: `D16.seed = 174221; var B = new D16.Battle({ fight: 'keeper', data: D16.save.fixture(3), bench: true }); D16.battle = B; B.enter(); D16.push(B)`, then the party's `guest` and `classAI` true and `B.heroTurn = function* (u) { yield* D16.ai.turn(this, u); }` (what dev/keeper-probe.js does). **Not seen in a pane**: only run headless.

## Not built / not seen
- **The foe still draws `keeper_p1`** (the snake). `keeper_p2`'s rows are `a_*`/`b_*` (turn, idle, wall, dive, wave) and none is wired: the engine wants `idle/walk/attack/hurt/die`, so each needs a mapping (the Slam = the dive; its landing wants a wave effect; the Wave = `*_wave`; the wall = `*_wall`). The pour into the water has no look either.
- Weapons and single-target spells at the Ice Wall (no way to aim at it); its section HP is only hurt by area spells. The ice's difficult-terrain cost. A downed hero's drowning (it stops at 0 HP; the SRD has no stabilizing until breath).
- The class AI never retreats, so the wall springs only on a stray step south in its approach. Wall rows 6 and 7 are in the pool, where nothing on the stair can be "sealed in": the alt-bench there springs nothing. **Asked of Griz: what he meant by 6 or 7.**
- No ear-file / PLAYTEST pass; no desktop Edge run.

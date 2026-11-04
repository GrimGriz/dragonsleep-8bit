# The mannequin: a pose reference the art desk skins (the pilot, 2026-10-31)

Griz, 10-31: *"What if we did stick figure modeling in blender for the various attacks (1H slashing (longswordish), 1H piercing (rapierish), and gave the image gens a stick-figure request with character art 'skin these figures with this character'"*. The chronic costs it goes after: scale drifting between sheets, frame counts that differ by facing, feet that don't register, the hand swapping when side rows are mirrored, pages re-asked and re-cut. Blender pins the motion, the timing, the five views, the size and the feet; the generator only skins it. One family first, the one-handed slash, to see whether the generator follows a pose reference at all before anyone builds the rest.

## What is here

- `slash-SE.png`, `slash-NE.png`, `slash-S.png`, `slash-E.png`, `slash-N.png`: the five reference strips (the art desk's attachments). One scale across all five; the line under the frames is the feet line; frame 4 is the hit.
- `mannequin_slash.png` / `.json`: the rig on the cell grid at 1x, laid out as the engine lays a sheet (8 facings, SW W NW mirrored from SE E NE). `idle` sits in barley_p3's own cell (64 x 72, anchor 32,60); `slash` has 6 frames at 12 fps, `release: 3` (printed frame 4), in a 96 x 84 cell, anchor 48,79. `grips.slash` is the rig's right fist in `barley_p3`'s `grips` format (js/sprites.js S.gripAt). `pilot.points` holds every frame's fist, guard, tip, soles and crown in 1x px.
- `grid-review.png`: the five drawn views and the three mirrored, 4x. Barley's own idle, the mannequin's idle, then SLASH 1-6, each in its cell, the feet line green, the hit boxed gold.

The key: **blue is his RIGHT arm and leg, orange his LEFT** (the poser page's key); grey is the body; the nose shows the face; the magenta bar is the sword, with a gold guard and a pale tip.

Rebuild: `& "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python tools/mannequin-blend.py -- build` (`-- poser` also writes `deep16/_src/mannequin/poser.json` for `tools/poser.html?fig=mannequin`; `-- wrists` prints each frame's wrist), then `python tools/mannequin-sheet.py`.

**The height** is Barley's. The mannequin's idle seen from the front stands 48 rows from crown to feet, as `barley_p3`'s idle S does, measured on the rendered pixels with the sword hidden. The head is about a sixth of the height, as the art desk draws heroes, so the fists sit where his will.

**The wrist** (his eye on the first renders: *"the way the swords look make it seem like something about the wrists is being overlooked"*): the hand runs 7 cm past the wrist to the fist, and the grip goes through the fist. The blade is held to 40-110 degrees off the forearm, the reach of a one-hand grip. Before this the blade grew out of the wrist joint, 23 degrees off the forearm at the follow-through.

## How to judge what comes back

Cut each page by its printed numbers. **Scale a whole page by one factor:** its frame 1 (the guard), crown to the lowest boot row, set to the rig's frame 1 in that view (S 47 rows, SE 46, E 46, NE 47, N 46). Then stand it on the rig's feet: the lowest boot row on the anchor row, the boots' middle on the anchor.

1. **On the grid.** Every frame's crown within 2 px of the rig's (`pilot.points.slash.<view>[i].crown`). A frame drawn taller or shorter than its neighbours fails. The size has to hold through the row, as the rig's does.
2. **The same count in every view.** Six frames, numbered 1-6 once each, on all five pages. A page with 5 or 7 fails outright: that is the drift the rig exists to stop.
3. **Feet on the line.** His feet never move in this row. In frames 2-6 the lowest boot row stays on the anchor row (within 1 px) and each boot stays within 2 px of the rig's soles (`soleL`, `soleR`). A bob or a slide fails.
4. **The right hand holds the blade.** The RIGHT fist is closed within 3 px of the rig's `fist` in every frame; where the rig marks the fist hidden (`under`: the body hides it, mostly in N and NE), his is hidden too. Check handedness against S and N, where it can't be mistaken: in S the fist is on the image's left, in N on its right, and in E it is the near arm (the art desk has drawn right-facing views with the figure's LEFT on the near side before). The sword lies along the bar: the blade runs from his fist to within 3 px of the rig's `tip`, the same length in every frame (since 10-31 the ask draws it -- below; before, the fist was asked empty). In SW, W and NW the cut is mirrored, so he is left-handed there. That is the house rule (RULED 10-14), and the grips mirror with him.
5. **The release frame.** Printed frame 4 is the hit: the right arm reaching out toward the facing, the fist on the rig's frame 4 point. `battle.js` strikes on it (`release: 3`, 15 ticks in at 12 fps). If the reach lands on 3 or 5 instead, the blow is drawn off its beat and fails.

**The verdict:** all five pass on a page, and the pose reference works for that view. If they pass on most pages, the generator follows the reference, and the misses are cutter work. A reasonable try at the cut, and what is left goes on `deep16-dream-polish.md`, not a re-ask (his rule for every cutter, 10-30). If it fails 2 and 3 across the pages, the generator is not following the strip, and the pilot says stop.

**Cut as** `longsword` on `barley_p3`: js/battle.js plays a row named for the weapon, so a longsword's blow plays it with no engine change (and S.wieldOf draws no code weapon over a longsword). `grips.slash` stays in the json for a code-drawn weapon of another kind later.

## What came back first: free Grok's baseline (10-31)

Griz, 10-31: *"what we got back from grok is in fresh - should we have a cutter try put a longsword in its hand and cut it (without overwriting anything we actually use?)"*. Grok sent five pages (sorted to `deep16/_src/barley/GROK-SLASH-2026-10-31/`). `tools/barley-grokslash-sheet.py` cut them into `barley_grokslash_p1`, a test sheet that nothing plays:
- `idle` is `barley_p3`'s own.
- `slash` holds S, SE and E, plus their mirrors.
- `slashback` holds NE and N, kept out of `slash` until his word (the desk's guard). Up close they are drawn from behind, as asked.

The longsword is drawn into the frames at 1x, not by the engine (S.WIELD has no sword): it runs from his right fist along the mannequin's blade for that frame. His fist was read by eye in each frame (`FIST`), because skin found his face first and on the SE page Grok drew him gloved.

Look: `tools/sheet-play.html?sheet=barley_grokslash_p1&ref=barley_p3&face=0,7,6,5,4&z=3`, and `grok-review.png` (each cut at 4x, the mannequin's fist ringed, the hit boxed). The numbers are in `grok-score.json`.

| check | S | SE | E | NE | N |
|---|---|---|---|---|---|
| 1. the size: crown against the rig's, frames 1-6, px (about +1 is the outline ring the cut adds) | 1 -4 3 5 4 2 | 1 -1 3 4 1 1 | 2 3 7 2 1 2 | 1 2 1 1 0 1 | 1 0 -2 -2 -2 0 |
| 2. six frames | yes | yes | yes | yes | yes |
| 3. the feet: bob / stance drift, px | 1.0 / 2.4 | 0.3 / 1.8 | 0.4 / 2.5 | 0.6 / 1.5 | 1.0 / 8.4 |
| 4. his right fist off the rig's, frames 1-6, px | 7 14 7 9 17 6 | 11 4 11 7 26 16 | 10 4 14 3 13 15 | 12 22 4 8 (hidden) 15 | 19 4 5 22 24 23 |
| 5. the hit on 4 | yes, by eye | yes | yes | yes | yes, by eye |

**What held:** what the strip pins hardest.
- Six frames in every view.
- The feet planted on one line: they bob 1 px at most. N's stance widens 8 px in frames 3-4.
- The size: within 2 px in NE and N.
- The beat: the reach lands on 4 everywhere. In S and N the reach is toward or away from the camera, so it was read by eye.
- The hand stays on one side, except NE 2, where he raises the left arm.

**What did not hold: the hand's path.** Asked for an empty fist where the bar is, Grok drew a boxer's punch.
- The wind-up's raised fist lands near the mannequin's: 3-5 px off in SE 2, E 2, NE 3, N 2 and N 3.
- The hit lands near it in E and NE.
- The follow-through is a fist back at the hip in every view, 13-26 px off.

**The lesson for the GPT ask (section 34) and for more families:** the strip carries the frame count, the feet, the size and the beat, but an empty hand does not carry a weapon's arc. "No sword" asked the generator for a punch.

**RULED 10-31**, Griz: *"we can put this on hold til GPT available wed. We'll send the mannequin with the sword along with asking the draw to include it"*. Section 34's blocks ask for the longsword drawn in his hand along the bar, and the ask waits for GPT's image budget (Wednesday 11-04).

## What came back from GPT: the pilot's pages, scored and cut (2026-11-04)

The art desk's `BARLEY-SLASH-PILOT-2026-11-04.zip`, sorted to `deep16/_src/barley/SLASH-PILOT-2026-11-04/`: five pages, six frames each, Barley in mail with the longsword drawn in his hand along the bar, as section 34 asked. Its own note: SE, NE, S and E are candidates; N is HELD, because frame 5 moves the sword to his left hand. `tools/barley-slash-sheet.py` cut them and wrote `pilot-score.json` and `pilot-review.png` (each cut at 4x, the mannequin's fist ringed blue and its tip magenta, the hit boxed).

**The verdict: the generator followed the pose.** Four views pass outright, and N follows it in every frame but one hand.

| check | S | SE | E | NE | N (held) |
|---|---|---|---|---|---|
| 1. the size: crown against the rig's, frames 1-6, px | 0 -2 1 1 1 1 | -1 -2 0 3 1 0 | 1 0 1 1 0 1 | 0 2 0 -2 -2 0 | 0 1 -2 -1 0 -1 |
| 2. six frames | yes | yes | yes | yes | yes |
| 3. the feet: bob / stance drift, px | 0.1 / 0.7 | 0 / 0.6 | 0 / -- | 0.1 / -- | 0 / 0.9 |
| 4. the right hand holds the blade; its tip off the rig's, frames 1-6, px | yes; 3 10 6 6 7 3 | yes; 3 7 5 12 7 8 | yes, the near arm; 5 5 2 6 1 9 | yes; 4 4 3 2 (hidden) 7 | **no on 5** (the left hand); 3 4 4 4 2 5 |
| 5. the hit on 4 | yes | yes | yes | yes | yes |

(`--` in 3: in E and NE the two boots overlap at the sole, one piece.)

**What held, against Grok's 10-31 baseline:**
- The size held to 2 px in nearly every frame (SE 4 is 3). Grok drifted up to 7.
- The feet do not move at all: 0.1 px of bob at most, against Grok's 1.
- The hand's path: the fist is on the mannequin's fist, by eye, in every frame of S, SE, E and NE. Grok drew a punch.
- The blade lies along the bar. Its tip lands 2-8 px from the rig's in most frames. That is mostly a blade drawn a little short, never a blade at the wrong angle.

**What did not hold:**
- N 5: the sword is in his LEFT hand, seen from behind. The arm comes off the left shoulder and the right arm is gone. It fails check 4, so N stays held.
- NE 5: the whole sword is hidden. The rig's fist is hidden too, but the rig's tip shows low on his left; the drawn one does not. The cut tries to draw the blade behind him, but at 1x his body covers it.
- SE 4: the blade at the hit is 12 px short of the rig's tip.
- E 5: the blade is shortened in the follow-through. The art desk named that one itself.

**Cut as** `longsword` on `barley_p3`: S, SE, E, NE as drawn; SW, W, NW their mirrors; `drawn` leaves N out, so his N plays the nearest drawn facing (`js/sprites.js` S.nearFacing). `--with-n` puts N in. The row has its own cell, 96 x 84 with the anchor at 48,79, at 12 fps with `release: 3`. Run the tool again after `tools/barley-sheet.py chain` rebuilds `barley_p3`; it replaces its own row.

**For the next families:** the mannequin with the weapon drawn along the bar is how a move gets asked. The one hand to watch is the hand in the views seen from behind (N).

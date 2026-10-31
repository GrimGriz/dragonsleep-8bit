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
4. **The right hand holds the blade.** The RIGHT fist is closed within 3 px of the rig's `fist` in every frame; where the rig marks the fist hidden (`under`: the body hides it, mostly in N and NE), his is hidden too. Check handedness against S and N, where it can't be mistaken: in S the fist is on the image's left, in N on its right, and in E it is the near arm (the art desk has drawn right-facing views with the figure's LEFT on the near side before). No sword drawn: a page that draws one anyway is a finding about the generator, not a cut. In SW, W and NW the cut is mirrored, so he is left-handed there. That is the house rule (RULED 10-14), and the grips mirror with him.
5. **The release frame.** Printed frame 4 is the hit: the right arm reaching out toward the facing, the fist on the rig's frame 4 point. `battle.js` strikes on it (`release: 3`, 15 ticks in at 12 fps). If the reach lands on 3 or 5 instead, the blow is drawn off its beat and fails.

**The verdict:** all five pass on a page, and the pose reference works for that view. If they pass on most pages, the generator follows the reference, and the misses are cutter work. A reasonable try at the cut, and what is left goes on `deep16-dream-polish.md`, not a re-ask (his rule for every cutter, 10-30). If it fails 2 and 3 across the pages, the generator is not following the strip, and the pilot says stop.

**After the pilot (engine work, not this):** a `slash` row plays a longsword once the engine maps the one-handed slashing weapons to it (the weapon-family alias of `deep16-hero-poses.md`, RULED 10-30) and draws a sword in S.WIELD from `grips.slash`.

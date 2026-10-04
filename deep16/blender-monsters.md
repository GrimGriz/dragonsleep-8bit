---
title: DEEP16 pipeline 1b -- a Blender monster from a printable model
made: 2026-10-01 (Code tab), walked once end to end on the xorn
for: the next window. Griz's opener for one: "we're adding another monster today" -- point it here
---

# A Blender monster from a printable model

**Why this exists.** Griz, 10-01d: *"my thought that a 3D print model would be a cheap blender, and that what you make in the blender we skeleton ... then we screenshot any position we need and cut those images"*. The cost he means is churn: *"the pipeline cost between blender and image gen disappointment an recutting over and over"*. The xorn showed both sides. Two generated sheets came back off-model (`dev/visions/xorn1.jpg` has the mouth on its face and two arms; `xorn2.jpg` has one eye and no arms). A free CC BY print model had the SRD anatomy right from all eight facings on the first render. And a row in Blender is a re-render, not a new sheet: prone, a special move, a blow per arm.

**When to use it.** A creature the generators keep getting wrong, or one that needs rows a sheet won't give (special moves, a blow per limb). The generated sheets (pipeline 2) stay for creatures they draw well.

**His rules for it (10-01d):**
- *"only seeing it in a game-combat test room pulls it off the wanted list"*.
- Prove the colour and lighting first.
- *"It's important for us to do the special move ones - like burrow and Earth Glide more than detailed attacks"*.
- The poser (a clay-and-wire page for posing by hand) waits for *"a monster i'm super fond of"* whose pose he can't describe. Till then the seat scripts the poses.

## The steps (the xorn's commands, as run)

All Blender runs are headless from **PowerShell**, with `--disable-autoexec` on any file from outside, since a `.blend` can carry scripts. Blender is `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe`, called `$bl` below.

1. **Pick it.**
   - The pull rule is monster-driven: build next what the most SRD monsters up the CR ladder use.
   - `deep16-art-wanted.md` lists the creatures still drawn as stand-ins.

2. **Find a model.**
   - Search `<creature> STL` across Thingiverse, Printables, MyMiniFactory, Cults3D and Sketchfab.
   - **Licence:** CC0 or CC BY. NC is tolerable while the game is free. SA would make the sheets SA too, as the LPC ones already are. Read each listing's own: MZ4250's older bestiary is CC BY, his "Roper 2025" is CC BY-SA.
   - **Best:** a listing that ships the artist's own `.blend`. MZ4250's free D&D bestiary on Thingiverse (CC BY) ships a base mesh and a sculpt for each model, so try it first.
   - **Also good:** a kit cut up for a home printer (the roper's: a body with sockets, one loose straight tendril, and the creature in a second pose). Separate parts rig more easily than parts sculpted together, and a second pose can be a state (see *Without a base mesh* below).
   - Skip anything ripped from an official miniature.

3. **Griz fetches it.**
   - Thingiverse wants a login and answers scripts with *"You are not allowed to use robots, spiders, scraping..."*. Printables shows a bot check. Never try to get past either.
   - Ways that worked: he downloads it in Brave; or he drags his logged-in tab into the Claude-in-Chrome group and the seat clicks Download; or the seat clicks Download in the browser pane and he catches the save popup.
   - The "Download all files" zip is fine.
   - File it in `deep16/_src/<creature>/` (gitignored), with the zip, `LICENSE.txt` and `README.txt` in a subfolder (`mz4250/`).
   - Check each file against the md5 the listing's files API gives. The browser pane's network panel shows `api/things/<id>/files`.

4. **Look inside.**
   - Run `& $bl -b --disable-autoexec <file.blend> --python tools/blender-inspect.py`. For an STL or OBJ: `& $bl -b --python tools/blender-inspect.py -- <file>`.
   - MZ4250's pair: the base mesh, `Sphere`, has ~3k faces plus a subdivision. The sculpt has the same object name, place and scale, about a million triangles, and a 25 mm print base (`Medium Creature`) to drop.
   - **A zip may have no base mesh** (the roper's: four STLs, and a `.blend` holding one sculpt and nothing else). Render quick matcap views of each file from five sides before planning (the roper's showed which part was which and where the face was).

5. **Write the creature's script.**
   - Four templates now (the troll's, for a biped, is the last: *A biped on the artist's rig* below): `tools/xorn-blend.py` (a base mesh and its sculpt, a found skeleton), `tools/roper-blend.py` (no base mesh: a kit of printed parts, tendrils on bone chains, a second pose as a state), `tools/grick-blend.py` (the artist's own rig and pose: the rows as bends on it) and `tools/troll-blend.py` (the same for a biped).
   - Copy the nearer one to `tools/<creature>-blend.py`. The xorn's parts, top to bottom:
     - load both meshes;
     - decimate the sculpt to 300k triangles;
     - the colour rules (in the base mesh's frame);
     - the skeleton finder;
     - weights;
     - the rows.
   - The shared parts live in `tools/blender_look.py`: the suns, the cel material, `paint` / `carry` / `mark_proud` (teeth and claws: what stands proud of the base mesh), the holdout floor, and the sprite camera.

6. **The look comes first.** His gate is *"gotta prove we can get the image coloring/lighting right first"*.
   - Run `& $bl -b --disable-autoexec --python tools/<creature>-blend.py -- look <tag> [preset=13] [teeth=white] [eyes=1]`. It renders the model unrigged, facings S and E.
   - Add `-- close <tag>` for an 800 px look at the mouth.
   - Then `python tools/look-sheet.py <creature> <tag> <tag>:nolift ref=clacker,bulette` writes `dev/visions/<creature>-looks.png` beside sprites already in the game. For a Large creature add `cw=150 ch=150` (the default cell is the xorn's size and crops a bigger one). If the look also writes `still_f0.png`, its disguise gets a third row.
   - A small feature at sprite size: the roper's eye is ~10 px across, and a slit pupil cut it into two gold dots that read as two eyes. A 2 px round pupil reads as one eye.
   - **The house look is his xorn pick, "17":**
     - light preset `13` (a warm key high on the upper left, a dim cool fill, a cool rim);
     - four cel bands;
     - the pixel lift on;
     - grey stone split hard from brown;
     - gold eyes, white teeth;
     - the throat dark and shaded (*"go back to unpainted mouth"*).
   - Preset `12` with the lift off was his first favourite, "14". Variants a creature needs are options in its script.

7. **The skeleton and weights.**
   - The xorn's skeleton is *found*: slices of the base mesh give the arms above the rim, the legs below the barrel, and centroids up each limb. The front is between two arms. The build prints the `yaw` that turns the front to −Y.
   - A biped or a quadruped needs its own finder, or bones placed from a probe's printout.
   - Weights are the distance to each bone over the limb's thickness, the nearest two bones, nearly rigid. That suits anything made of stone, shell or bone.

8. **The rows, keyed in code, every bone on every frame.** Name them the engine's way:
   - `idle` and `walk`: loops.
   - `attack`: the fallback for any blow.
   - `flinch`: a hit that doesn't drop it.
   - `hurt`: the death, played once. Pick a lying frame for prone and put it in `S.PRONE` in `deep16/js/sprites.js`, if one reads as knocked flat and alive beside the idle at sprite size.
   - `prone`: where none does (a death that sinks into the floor reads as going under, not as down), a row of its own. It falls through it, lies at its last frame, gets up by playing it backwards, and one that dies lying there stays as it lies (`S.proneRow`). The xorn's is its first death, going over onto its back. The roper's tips over backwards about the back of its foot. Griz, 10-02: *"The old one might be a good prone if 3 is no good"*.
   - **Special moves:**
     - `burrow` is going under. Its **last frame is what shows while it is under**: a mound for a burrower that disturbs the ground (the bulette), nothing for one that doesn't (the xorn's Earth Glide).
     - `reveal` is coming up.
     - The holdout floor (`"floor": true`) hides whatever sinks into it.
   - **A row per attack:** name it after the SRD attack (`claw`, `bite`). A second and third use in a turn take `claw2`, `claw3`. `battle.js` plays them with no more wiring.
   - Then build: `& $bl -b --disable-autoexec --python tools/<creature>-blend.py -- build` writes `deep16/_src/<creature>/<creature>.blend`.

9. **Register it** in `tools/deep16-figures.json`. The xorn's entry is the model: `file`, `show`, `"look": "toon:13"`, `"lift"`, `"floor"`, `size_squares`, `yaw`, `anims` (engine row → action), `frames` (per row), `once` (rows sampled to their last frame).
   - Two options from the roper (10-01e): `size_by` (the meshes whose span is its size and whose middle is its foot, so loose tendrils don't shrink it or move it off its square) and `"fit": true` (each row gets its own frame, as tight as that row reaches over its frames and eight facings; without it a two-square lash would make every row's frame that wide).
   - **A new row name goes in `ANIM_ORDER` in `tools/pixelate.py`** (and an fps in `FPS`). The sheet keeps only rows named there, and drops any other row without a word.

10. **Render.**
    - Smoke-test first: set `$env:D16_OUT = "render-test"; $env:D16_ONLY = "idle:0,6"`, run `& $bl -b --disable-autoexec --python tools/render-sprites.py -- <creature> 8`, then set both back to `$null`.
    - Then run all of it without the env vars: about 570 frames and 15–20 minutes for the xorn's 11 rows. Run it in the background. Blender holds back its prints when its output goes to a file, so count the frames in the render folder to see how far it has got.
    - Then `python tools/pixelate.py p1 <creature>`, `python tools/deep16-build.py`, and `git checkout -- deep16/js/palette.js`.

11. **Wire it.**
    - The foe's `sheet` in `deep16/data/foes.js` becomes `<creature>_p1`.
    - A burrow speed from the SRD (`burrow: 20`) hands it to `deep16/js/ai.js` `burrower`. `earthGlide` makes it a quiet one, with no mound.
    - Its per-attack rows play by name.

12. **The test ground, then the gate.** Griz, 10-02: *"build a permanent 'test ground' with various lighting levels in it, and script a fight that should display all the animations twice"*.
    - **The show, headless first:** `python dev/bench16.py <creature> mode=show lvl=3` fights two of it on the test ground and prints the tally: every row of its sheet with how often the engine played it, `FAIL` for any under two, and the round it ended. Add `stone=grey` (or `brown`) for the other stones. `dev/check.py all` runs it for the grick, the xorn and the roper.
    - **Then in the pane:** `deep16/?show=<creature>` (`&lvl=`, `&stone=brown|grey`, `&n=`; several creatures: `?show=grick,xorn`). That is `deep16/js/show.js` on `data/maps.js testground`:
      - **The ground:** a long hall with one lamp in it, a little nearer the way in. It's bright over the middle and dim in a ring past it: the near end where the watchers come in, and a band toward the far end. It's dark at the far end and in the corners, where the creature starts. Slate stone, so a creature in `S.STONE` shows its recolour.
      - **The watchers:** four, run by the class AI, each with their own eyes. A wizard with a bat (the sonar), a wizard with a snake (the tongue), a dwarf fighter (darkvision), and a human rogue who sees by the lamp alone (no torch: Griz, 10-02). Hover one to see by its eyes.
      - **The director (a test, never a rule):** the creature goes first, so its `still` and `reveal` play. Every blow at it or from it lands, so a blow that follows a hit (the grick's beak) plays, and so does the flinch. No one drops below 1 HP until the director says so, and the creature has three times its hit points. Each one is knocked flat at the end of its second turn and gets up at its next, which shows the prone frame both ways. One that hasn't walked by the end of its turn is walked a few squares (the roper holds its ground). One that has shown every row goes down at the start of its turn, after it has got up, which plays its death. Every one goes down from round 8.
      - **The tally** counts what the engine plays (a row set on the unit, a fall, a death, the still from the start), not what is drawn. The last card reads it. A sheet's `attack` row is listed as never played where every blow has a row of its own (the xorn's), and isn't wanted twice.
    - Run `python dev/check.py` and get GREEN before you push.
    - **Griz's eyes on the test ground decide; only then does it come off the wanted list.**

## Without a base mesh (the roper, 10-01e)

The second monster, and the first fresh window to follow this recipe (Griz: *"I've pulled the zip for the next window to test how they'll do following your pipeline"*). His first zip (CriticalPrints' roper, CC BY-NC) was one fused STL. He then fetched MZ4250's "Roper 2025" (*"grabbed a different one that has a .blend - roper 2025 if that's more convenient"*). Its `.blend` held the hiding sculpt alone, but the zip was a printer's kit, and that made it the better model. What `tools/roper-blend.py` does that the xorn's didn't:

- **Colour onto the points.** `blender_look.paint_points` and `write_points` colour the sculpt's own points: two stones blotched, and a darker one drawn down in vertical streaks, like flowstone. There is nothing to carry from.
- **What stands proud, measured another way.** The eye isn't proud of the shut sculpt (its lid bulges in the same place), so it's found as a sphere: every normal on a ball runs through its centre. The teeth are what stands proud of a 3,000-face decimated copy of the open body, inside the maw. The throat is what lies inside the shut cone's surface in the face.
- **Sockets.** The open body's six tendril holes are what lies 1.4 or more inside the shut cone, off the face, gathered into clusters. Each socket's axis runs from the hole to the middle of its tube's walls, so a tendril comes out of the tube's mouth and not through its side.
- **One loose tendril, six times.** Its axis comes from a PCA, its root at the peg's shoulder (the thick end). It's shortened along its length only (`tlen`: the printed one is longer than the body is tall). Ten bones run down each copy, with weights blended along the length.
- **A rope that never goes through the floor.** Each tendril's ten directions are walked from its socket like a turtle: it bends down, then curls round the foot toward the back, and lies flat when it reaches the floor. Bone `j` is turned onto direction `d_j` by `q_j = n.rotation_difference(Q_{j-1}^-1 d_j)`, since a chain's turns compose.
- **A second pose as a state.** `shut` holds the stalagmite and `wake` the living roper. Whichever isn't showing is a bone scaled to a point inside the other. That needs no object keys, so render-sprites' one action per row carries it. The rows are STILL (the stalagmite) and REVEAL (it opens its eye and the tendrils push out of their sockets). The grid shows STILL until the roper's first turn or a wound (`js/ui.js`, as the ettercap's braid), and `js/ai.js` plays REVEAL before it first acts.
- **Frames in the sheet's budget.** Toppled flat, the cone would lie three squares long and every frame would have to hold it, so the death sinks it a third into the holdout floor, leaning. The lash reaches two squares, and `fit` gives that row alone a frame that size.

## With the artist's own rig (the grick, 10-02)

The third monster. MZ4250's "Grick Updated" (Thingiverse 4738607, CC BY) ships three `.blend`s: the base mesh; `_rigged` (the sculpt on a 107-bone rig, lying straight); and `_posed` (the same sculpt on a re-made rig of 92 bones with its weights, bent into the miniature's pose). Griz filed it in `dev/visions/` this time; the seat copies the zip to `deep16/_src/<creature>/mz4250/`. `tools/grick-blend.py` is the third template. What it does that the others didn't:

- **No skeleton to find.** It loads `_posed`: the armature, the sculpt under it, and the print base. Read the rig first with a probe that prints each bone's rest and posed head (the scratch probes are in the 10-02 daily). Two files' rigs can differ: here the posed rig had other names and a shorter neck.
- **The rows are bends on the artist's pose.** `bends(P, t)` turns a few parameters into a turn per bone: pitch over the neck, tentacles closing or splaying, the gape, a wave along the coil. Each turn is in the pose's frame. `solve` composes them down the tree, `G(b) = G(parent) @ d(b)`, and gives each bone the basis `C^-1 @ M`. The miniature's pose is frame zero of everything.
- **Colour by the rig's own groups.** The base mesh hugs this sculpt within ±0.4, so "what stands proud" finds nothing. The beak is the jaw bones' groups, a hook is a tentacle's last bone, and the belly is what faced down from the worm's axis at rest. A diagnostic render coloured by dominant bone family showed which group was which in one pass.
- **Re-origin the rig on its foot.** `render-sprites.py` turns each facing about the armature object's origin. The artist's sat 14 units off the print base's middle, so the grick would have wandered round its square. The build moves the origin to the base's centre without moving a thing in the world (each edit bone's matrix, then the mesh's parent inverse).
- **The print base is the footprint.** The head and tentacles reach out over the base, as a miniature's do. So `size_by` names `Grick_Foot`, a hidden disc the size of the base at the creature's lowest point. `render-sprites.py`'s `world_bbox` counts a mesh named in `size_by` even when it isn't drawn.
- **Stone Camouflage is the roper's machinery.** A `still` row (coiled low, head down) and a `reveal` (rising out of it) are generic in `ui.js` and `ai.js`. A brown hide in DEEP16's stone ramp joins `S.STONE`, so a map that names its stone recolours it (Griz: *"not worth getting fancy and having a green one turn brown when it goes stealth"*).
- **A new attack row** needs its name in `ui.js`'s play-once rule (`/^(claw|bite|tendril|tentacles|beak)\d?$/`) as well as in `pixelate.py`'s `ANIM_ORDER` and `FPS`. Without the first, it loops.

## A biped on the artist's rig (the troll, 10-04)

The fourth monster, and the first with legs. MZ4250's "Troll Updated" (Thingiverse 4134313, CC BY; Griz fetched the zip into `deep16/_src/troll/`, then `mz4250/`). Found by searching `<creature> thingiverse .blend`: the listing's file names show which ones ship a `.blend`, and MZ4250's all do. `tools/troll-blend.py` is the fifth template and the one to copy for anything with arms and legs. The whole job, from the zip to a sheet that passed `dev/bench16.py troll mode=show`, took one window. In order:

1. **Probe the rig first** (`tools/blender-inspect.py`, then a ten-line script that walks `arm.data.bones` printing each bone's posed head and tail, its length, and how many vertices it weights above 0.3). That printout is the whole map: the troll's is a spine of four bones from the hip, two arms (shoulder, upper arm, forearm, hand, five fingers of three bones), a neck and a skull, a **jaw bone** (the bite is that bone turned), and two legs rooted at the hip as roots of their own. Three roots share the hip's origin (spine and both legs), so one turn about the hip carries the whole skeleton (a fall).
2. **Copy `grick-blend.py`'s machinery unchanged:** the re-origin on the foot, `REST`/`POSE0`, `solve`, `apply`. They are not worm-specific. What changes is `bends(P)`: parameters in the pose's frame (`+X` lowers the front, as in the grick) turned into a quaternion per bone, so a row is a dict (`sw`, `el`, `th`, `kn`, `jaw`, `lean`, `body`...) and every row function stays a few lines.
3. **Three things the troll's file did that the grick's didn't:**
   - **The mesh was parented to the armature, with no Armature modifier** (the parent type does the deform). Set `parent_type = 'OBJECT'`, keep `matrix_parent_inverse` as in the grick, add an `ARMATURE` modifier and `modifiers.move(len - 1, 0)` ahead of the Subsurf. Subsurf at level 1 (the file's 120k-face evaluated mesh was more than the sprite needs).
   - **Objects loaded from a library can be hidden:** `mode_set(EDIT)` failed with "Cannot edit hidden object". `hide_set(False)`, `hide_viewport = False`, `hide_render = False` on the armature and the body first.
   - **Never loop on `body.modifiers[0] is not amod`.** Blender hands back a fresh wrapper every time, so `is` is never true and the script spun silently for 400 s with no output (Blender holds its prints when redirected). Compare names, or just `move()` once.
4. **Ground every frame** (`grounded(P, how)`): after a pose is applied, measure the mesh's lowest point and shift the roots' `lift` so it sits on the ground (`'plant'`: a step, a swing, a blow: the body rides on its feet) or never below it (`'clamp'`: the idle bob, a fall). Without it a walk's swinging legs ran 10 units under the floor. The ground is the lowest point of the artist's own pose (`apply({})`). Cheap: the troll's whole pose build is seconds.
5. **Rows, by feel, checked in `-- poses <tag>`** (matcap frames; then a contact sheet cropped to the union of the alpha boxes, side view `facings=6` reads best, front view is foreshortened to a blob). The troll's: idle (breath, jaw closed: the miniature roars, so the idle closes the jaw by -18), walk (thighs against each other, knee up as a leg comes through, arms across), `claw` and `claw2` (one per arm, windup up and back, then down and across), bite (the jaw bone), flinch, death (knees buckle, then over onto its face), **prone** (the whole skeleton about the hip, over on its back: its own row, since a death on the face is not "knocked flat and alive"). Signs: `+X` on the thigh takes the leg back, on the calf bends the knee (foot back), on the jaw opens it.
6. **Colour by the rig's groups** (the grick's way). The jaw group is the lower jaw; a finger's last bone is its claw. A toe's last bone is the whole forefoot, so tint only the last 30% along it (`u > 0.7`), or the foot goes bone-white (the first render did).
7. **Lift on.** The grick took lift off on his pick; the troll's dark green came out near black without it and read fine with it on (`tools/deep16-figures.json` `"lift": true`, a pixelate-only switch: flip it and run `pixelate.py p1 troll`, no re-render). Try both before the long render.
8. **Render budget:** about 4 minutes for 53 frames x 8 facings, foreground is fine (under the 10-minute limit). Add `troll` to `MODE_FOES['show']` in `dev/check.py` so the gate plays every row twice.
9. **Wire:** the foe's `sheet` was already `troll_p1`, so the new sheet replaced the Yeti's with no change to `foes.js`. CREDITS: a Pipeline 1b entry, and the old Quaternius line gets "till <date>".

What it did not need: no `still`/`reveal` (a troll doesn't hide), no `S.PRONE` (its own `prone` row), no new row names (`claw`, `claw2`, `bite`, `flinch`, `prone` were all in `ANIM_ORDER`). It does not have the SRD's Regeneration drawn; the engine does that (`regen: 10`).

**Second pass on the troll (10-04, Griz: "it looks like it might have a hat and definitely a loin-cloth ... color in the eyes ... use gravity for the prone and death ... claw attacks as swipes across the body ... the bite lunging forward and a little down"):** what to copy from it.
- **Inner lines** (`"lines": {"width": 1.0, "crease": 110}` in the figure's config; `D16_LINES=1` to test): Freestyle draws the silhouette and crease edges in a dark line, inside the figure as well as round it, the way the LPC figures have a dark seam between cloth and skin. Doubles the render (about 10 minutes for the troll); "strokes set empty" in the log is harmless. His verdict on the first try: better than without.
- **Finding a part on a sculpt with coarse groups** (the troll's `Head` group is the whole head, hair and face): give the part its own frame and cut by coordinates (`troll-blend.py`: the head's a/b/s axes from the skull bone; the cap is `b > 1.4`, the locks hang at `|s| > 4`, the eyes are a band `a > 8, -0.3 < b < 1.2, 1.2 < |s| < 3.6`; the loincloth is the hip groups below the waist inside |x| < 7.5). Iterate with `-- close <tag> [at=hips] [zoom=24] [hdiag=1] [cdiag=1]` (an 800 px close-up with a diagnostic colouring) and read the picture; a heuristic on "hollows" found the temples, not the eyes. Eyes are painted unshaded (alpha 0 in the `speckle` attribute) so they stay bright in shadow.
- **Gravity** (`aim()` and `lie()`): to lay a limb on the floor, turn each bone to point at a world direction (`pdir.rotation_difference(G.inverted() @ target)`, the turtle again), `f` of the way, so an arm falls from where it was to lying on the ground in a few frames. A fall is the body about the hip (`body`) plus the limbs aimed (`lie='back'|'face'`). In the iso view a body lying along the ground reads as a diagonal; that is the floor, not a tilt.
- **A lunge** is `shift` (the roots moved along -Y) with the thighs turned back to keep the feet near where they were, the knees bent, the lean forward, and `plant` grounding lowering the body onto its feet.
- **Swipes** are the shoulder (`sw`: - raises, + lowers), `out` (about Z: across the body), the forearm and a body twist, per frame in a table; mirror the signs for the other arm.

## What cost us a step (so it doesn't again)

- **`EditBone.transform` re-rolls.** Turning the bones with it re-rolled them, and the artist's pose came out wild (the worm 4.7 squares tall). Set `eb.matrix = X @ eb.matrix` instead; it keeps head, direction and roll together.
- **The bob seats the figure.** `render-sprites.py` puts the idle's first frame on the ground. An idle bob that dips below that frame sinks into the floor, so start it at its lowest.
- **A camera aimed before the turn.** Aim the close-up camera after the figure is turned to its facing, or it frames empty air.
- **A walk on top of a standing pose scrunches.** Griz: *"their idle pose is like standing and I just thought they'd flatten out more snake-like when they were moving"*. A wave added as bends to a coil sums down the chain and pulls the loop tight. The grick's long move is a path of its own (`slither` in `tools/grick-blend.py`). Fully stretched it ran four squares, the model's whole length, so it folds into a tighter S of about three. Then, on his word, two gaits: *"can we do the old one for 1-2 squares and the new if they're going 3 squares or more"*. A sheet with a `slither` row plays it for a move of three squares or more and its `walk` for less (`js/battle.js` moveAlong). The row also goes in `ui.js`'s loops and `pixelate.py`'s `ANIM_ORDER`.
- **A prone frame that only slumps.** Griz: *"make sure if it can be prone it looks prone when it is"*. The grick's first death pitched the neck forward, and every frame kept the coil's hump, so the prone frame read as a slump. The death row now lays the neck along the ground by frame 3 (`flatten`, the same turtle as the slither, slerped from the coil), alive with its tentacles held up, and goes slack after. Getting up plays it backwards. Laid flat, the neck's belly sank 2.3 units, so only the neck's root bone is lifted (`necklift`) and the coil stays on the ground. Look at the prone frame beside the idle at sprite size before keeping it. The show's report names a creature that can be knocked flat but has no prone frame.
- **A row that never plays** (the xorn's `attack`: every blow had a row of its own) can come off the sheet without losing it. Take it out of the figure's `anims`, and `pixelate.py` leaves it off the sheet while its frames stay in `render/<figure>/`. Griz: *"frames off the sheet is nicer to slower devices? proceed (but we're not throwing them out, right?)"*.
- **Don't wrap `D.ai.turn`.** `dev/bench16.js` reads its source for a rule (rulings0930), and a wrapper turned `dev/check.py` RED. The show's director is handed its turns by `js/battle.js` run instead.


- **`fit` measured the holdout floor** (200 units across) and asked for an 8010 px frame; Blender died rendering it at 4x without a word (exit 9). It measures only the meshes in `show` now.
- **A tendril drooping from its first bone** came out through the wall of its tube; the first bone stays straight.

- **The suns' aim.** The suns are aimed in the camera's frame, and a new camera's matrix is stale till the scene updates. Unaimed, the key light lands behind the figure and the stone renders near black. `blender_look.light` updates the scene first.
- **Stale frames.** A render folder keeps old frames from an earlier render of the same figure (the xorn's blob). That's harmless, because `meta.json` says how many frames each row has.
- **Re-rendering one row.** `D16_ONLY=<row>:<facings>` into `render/` once rewrote `meta.json` with that row alone, and the next pixel pass dropped the rest of the sheet. `render-sprites.py` now merges a partial render into the existing index; the xorn's death row was redone that way twice.
- **Going under is a state, not just a row.** A creature is marked `under` from the first frame of its sink. `js/ui.js` plays the row from there and holds its last frame. When the row only played "once", the game's pace could run past it, and the figure stood whole on the floor before it went (Griz's own fight, 10-01d).
- **Old files.** MZ4250's files are Blender 2.79 and open fine in 5.2.
- **Decimating without operators.** Use `bpy.data.meshes.new_from_object` on the evaluated object.
- **Look runners.** A look runner (Sonnet, 10-01d) found the light in 14 variants. Colour Griz is judging live is the seat's own work: *"You try instead of a runner."*

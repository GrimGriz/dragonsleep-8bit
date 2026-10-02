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
   - Three templates now: `tools/xorn-blend.py` (a base mesh and its sculpt, a found skeleton), `tools/roper-blend.py` (no base mesh: a kit of printed parts, tendrils on bone chains, a second pose as a state) and `tools/grick-blend.py` (the artist's own rig and pose: the rows as bends on it).
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
   - `hurt`: the death, played once. Pick a lying frame for prone and put it in `S.PRONE` in `deep16/js/sprites.js`.
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

12. **The test room, then the gate.**
    - Bench its fight: `python dev/bench16.py x fight=<id> n=4 log=1`.
    - Open it in the pane. The xorn's room is `deep16/?npc=xorn,xorn&lvl=8&watch`; see the handoff.
    - Run `python dev/check.py` and get GREEN before you push.
    - **Griz's eyes in the room decide; only then does it come off the wanted list.**

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

## What cost us a step (so it doesn't again)

- **`EditBone.transform` re-rolls.** Turning the bones with it re-rolled them, and the artist's pose came out wild (the worm 4.7 squares tall). Set `eb.matrix = X @ eb.matrix` instead; it keeps head, direction and roll together.
- **The bob seats the figure.** `render-sprites.py` puts the idle's first frame on the ground. An idle bob that dips below that frame sinks into the floor, so start it at its lowest.
- **A camera aimed before the turn.** Aim the close-up camera after the figure is turned to its facing, or it frames empty air.


- **`fit` measured the holdout floor** (200 units across) and asked for an 8010 px frame; Blender died rendering it at 4x without a word (exit 9). It measures only the meshes in `show` now.
- **A tendril drooping from its first bone** came out through the wall of its tube; the first bone stays straight.

- **The suns' aim.** The suns are aimed in the camera's frame, and a new camera's matrix is stale till the scene updates. Unaimed, the key light lands behind the figure and the stone renders near black. `blender_look.light` updates the scene first.
- **Stale frames.** A render folder keeps old frames from an earlier render of the same figure (the xorn's blob). That's harmless, because `meta.json` says how many frames each row has.
- **Re-rendering one row.** `D16_ONLY=<row>:<facings>` into `render/` once rewrote `meta.json` with that row alone, and the next pixel pass dropped the rest of the sheet. `render-sprites.py` now merges a partial render into the existing index; the xorn's death row was redone that way twice.
- **Going under is a state, not just a row.** A creature is marked `under` from the first frame of its sink. `js/ui.js` plays the row from there and holds its last frame. When the row only played "once", the game's pace could run past it, and the figure stood whole on the floor before it went (Griz's own fight, 10-01d).
- **Old files.** MZ4250's files are Blender 2.79 and open fine in 5.2.
- **Decimating without operators.** Use `bpy.data.meshes.new_from_object` on the evaluated object.
- **Look runners.** A look runner (Sonnet, 10-01d) found the light in 14 variants. Colour Griz is judging live is the seat's own work: *"You try instead of a runner."*

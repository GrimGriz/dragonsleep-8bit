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
   - **Licence:** CC0 or CC BY. NC is tolerable while the game is free. SA would make the sheets SA too, as the LPC ones already are.
   - **Best:** a listing that ships the artist's own `.blend`. MZ4250's free D&D bestiary on Thingiverse (CC BY) ships a base mesh and a sculpt for each model, so try it first.
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

5. **Write the creature's script.**
   - Copy `tools/xorn-blend.py` to `tools/<creature>-blend.py`. Its parts, top to bottom:
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
   - Then `python tools/look-sheet.py <creature> <tag> <tag>:nolift ref=clacker,bulette` writes `dev/visions/<creature>-looks.png` beside sprites already in the game.
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

10. **Render.**
    - Smoke-test first: set `$env:D16_OUT = "render-test"; $env:D16_ONLY = "idle:0,6"`, run `& $bl -b --disable-autoexec --python tools/render-sprites.py -- <creature> 8`, then set both back to `$null`.
    - Then run all of it without the env vars: about 570 frames and 15–20 minutes for the xorn's 11 rows. Run it in the background.
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

## What cost us a step (so it doesn't again)

- **The suns' aim.** The suns are aimed in the camera's frame, and a new camera's matrix is stale till the scene updates. Unaimed, the key light lands behind the figure and the stone renders near black. `blender_look.light` updates the scene first.
- **Stale frames.** A render folder keeps old frames from an earlier render of the same figure (the xorn's blob). That's harmless, because `meta.json` says how many frames each row has.
- **Re-rendering one row.** `D16_ONLY=<row>:<facings>` into `render/` once rewrote `meta.json` with that row alone, and the next pixel pass dropped the rest of the sheet. `render-sprites.py` now merges a partial render into the existing index; the xorn's death row was redone that way twice.
- **Going under is a state, not just a row.** A creature is marked `under` from the first frame of its sink. `js/ui.js` plays the row from there and holds its last frame. When the row only played "once", the game's pace could run past it, and the figure stood whole on the floor before it went (Griz's own fight, 10-01d).
- **Old files.** MZ4250's files are Blender 2.79 and open fine in 5.2.
- **Decimating without operators.** Use `bpy.data.meshes.new_from_object` on the evaluated object.
- **Look runners.** A look runner (Sonnet, 10-01d) found the light in 14 variants. Colour Griz is judging live is the seat's own work: *"You try instead of a runner."*

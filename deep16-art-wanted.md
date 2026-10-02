---
title: DEEP16 art wanted -- the generated sheets, in order
made: 2026-09-28 (Code tab), for Griz's free GPT / Grok image runs, planned at two a day
updated: 2026-10-01 (Code tab) -- the IN HAND list added at the top, the creatures already in moved off the wanted list (a Cowork seat reading the old file took the landlord for still wanted; it has been on the grid since 09-29), the days renumbered
how: paste a creature's HEAD, then the COMMON TAIL, into the generator. Drop what comes back in the repo root (any name; say which creature) and the seat files it in `deep16/_src/` as `<creature>_grok_N.png` (gitignored: that folder is where the generated sheets live; tester screenshots go in `deep16/_src/tester-feedback/`) and cuts it the chuul's way (pipeline 2: one `tools/<creature>-sheet.py` per creature)
---

# DEEP16 art wanted

**Read IN HAND first.** Everything on it is already cut and fighting on the grid: don't generate it again. A second sheet for one of them (idle variations, special moves) is welcome, never needed.

## IN HAND (on the grid; don't regenerate)

| creature | sheets | cut by | in since | prone |
|---|---|---|---|---|
| the chuul | 2 | `tools/chuul-sheet.py` | 09-27 | someday |
| the crawler (the Warrens' herd) | 1 | `tools/crawler-sheet.py` | 09-27 | someday |
| the gnolls (and the Snoot's glory-seekers) | 2 | `tools/gnoll-sheet.py` | 09-28 | someday |
| the cloaker (and its close-up) | 3 | `tools/cloaker-sheet.py` | 09-29 | -- (it flies) |
| the ettercap | 3: the third is the sitting-and-braiding idle, 09-30 (on the grid it braids till it acts or is hurt; on the 8-bit map it sits braiding at the strung end of Web Gulch) | `tools/ettercap-sheet.py` | 09-29, 09-30 | someday |
| **the otyugh -- the landlord** | 1 | `tools/otyugh-sheet.py` | 09-29 | someday |
| the hyena | 2: the second gives the ROFL row (Hideous Laughter) | `tools/hyena-sheet.py` | 09-29, 09-30 | the ROFL row, while it laughs; else someday |
| the bulette | 2 | `tools/bulette-sheet.py` | 09-29 | someday |
| the owls, brown and snowy (Find Familiar) | 2 each | `tools/owl-sheet.py` | 09-29 | someday |
| the giant boar | 1 of 2 ("WILD BOAR ... (1/2) - MOVEMENT & CORE"; it replaces the stand-in bull that charged backwards) | `tools/boar-sheet.py` | 09-30 | someday |
| **the landlord's five pictures** (the Wet's telepathy: the bucket, the fall, the crook, the clackers, the chimney) | 5 stills, his from `dev/visions/` | `tools/visions.py` | 10-01 | -- |
| **the clacker** (the realm's hook horror; the Q2 head below) | 2 from Grok (`clacker_grok_2`: idle, walk, clack, hurt, death, the turnaround; `clacker_grok_3`: the hook that replaces the sheet's own). The first, GPT's, retired: "they 'hook' with their noses by the noses growing :) also their arms are all akilter" | `tools/clacker-sheet.py` | 10-01 | someday |
| **the xorn** -- the first Blender monster (pipeline 1b) | MZ4250's printable Xorn (CC BY), rigged and posed in Blender: 11 rows -- idle, walk, a claw from each arm, bite, sink, rise, flinch, death (its `attack` row, never played, off the sheet 10-02; its frames kept) | `tools/xorn-blend.py`, then `render-sprites.py` | 10-01 | frame 3 of its death |
| **the roper** -- pipeline 1b's second | MZ4250's Roper 2025 (CC BY-SA): idle, creep, a lash from each of four tendrils, reel, bite, flinch, death, still, reveal | `tools/roper-blend.py` | 10-01 | frame 3 of its death |
| **the grick** -- pipeline 1b's third, on the artist's own rig | MZ4250's Grick Updated (CC BY): idle, walk (a step or two, coiled) and slither (three squares and more, laid flat), tentacles, beak, flinch, death, still (Stone Camouflage), reveal; the den's brown stone, in `S.STONE` | `tools/grick-blend.py` | 10-02 | frame 3 of its death: laid flat, alive |

**Prone (10-01b).** Griz: *"Seems like we don't have prone for all the pretty characters we've made (and I guess we'd need at least 1 other frame for getting up from prone)"* -- *"The column for 'art someday' is appropriate if not and in other/monster cases."* The LPC figures (the heroes, Ingrith, the guests, every class NPC: the `_p0` sheets) have it already: their fall row's frame before last, on hands and knees, held while prone, and the row played back to get up (`deep16/js/sprites.js` S.proneFrame). The generated sheets' death rows end dead, so they stand while prone until a sheet brings a row for it; the Blender stand-ins (`_p1`) wait for their generated sheets. When a sheet for one of these is made again, or a new head is written, add this row to it: *"PRONE: knocked flat but alive and struggling, 2 frames: lying on the ground, then pushing itself up."* A sheet that brings it is cut into `S.PRONE` (one line) and the column says so.

**Special moves before detailed attacks (10-01d).** Griz: *"It's important for us to do the special move ones - like burrow and Earth Glide more than detailed attacks, but since this is prototype, go fancy"*. Today the grid plays one `attack` row for every swing (`deep16/js/battle.js` picks `cast` or `attack`), and no creature goes under or comes up on screen (the bulette's Burrow row is cut and shelved, its Emerge kept as `reveal`; foes.js marks its burrow "not read"). So a row for a special move (going under, coming up) outranks a second attack row, and the hook that plays it serves the xorn's Earth Glide and the bulette's burrow both. The xorn, the Blender prototype, gets both: a row per attack (claw, bite) and the special moves.

**The xorn (10-01d).** **10-01d: two generated sheets in, both off-model** (`dev/visions/xorn1.jpg`: the mouth on its face, two arms, two legs; `xorn2.jpg`: one eye, no arms). **Trying Blender instead:** MZ4250's Xorn, CC BY 4.0, ships its Blender sources (https://www.thingiverse.com/thing:2847683 -- `Xorn_Updated.blend`, `Xorn_Updated_sculpted.blend`; Thingiverse refuses scripted downloads, so Griz fetches them into `deep16/_src/xorn/`). Griz: *"only seeing it in a game-combat test room pulls it off the wanted list"*. The still test (`dev/visions/xorn-mz4250-still-test.png`): the anatomy right in all eight facings, the colour pale and flat; *"gotta prove we can get the image coloring/lighting right first"* -- a Sonnet runner's look variants go to `dev/visions/xorn-look-variants.png` before any rig. The poser (a clay-and-wire page to pose a rigged model by hand) waits: *"we'll build it if we ever get a monster i'm super fond of and ... it's too challenging for me to communicate an articulation I think would look good"*; till then the seat scripts the poses. **Built the same day (10-01d):** his pick "17" (*"but go back to unpainted mouth"*), `xorn_p1` from `tools/xorn-blend.py`, eleven rows -- idle, walk, a claw from each of its three arms, the bite, sink and rise (Earth Glide: no mound, it is simply gone), flinch, the death (it settles half into the floor, arms drooping -- his ask after his own fight; prone at its frame 3); the grid plays a row per blow and the burrow (js/ai.js burrower). **Off the wanted list on his word after his own fight** (*"you can do the remove from list, it'll be done when we're finished"*); the test room: `deep16/?npc=xorn,xorn&lvl=8&map=seamwall` (`&watch` to watch both sides). The recipe for the next one: `deep16/blender-monsters.md`.

**The roper (10-01e).** One generated sheet (`dev/visions/roper.jpg`) was off-model: its Creep row is a crawling crab. Pipeline 1b took MZ4250's "Roper 2025" (Thingiverse 7410664, CC BY-SA), which Griz fetched: *"grabbed a different one that has a .blend - roper 2025 if that's more convenient"*. It's a printer's kit: the body with six sockets, one loose tendril, and the roper hiding as a plain stalagmite. `tools/roper-blend.py` builds `roper_p1` from it: idle (the tendrils coiled about its foot), creep, a lash from each of four tendrils (the SRD's four: the top pair, then the middle pair), reel, bite (the bend through the maw brings the upper jaw down), flinch, death (slack, sinking; prone at frame 3), **still** (the stalagmite: the grid shows it till its first turn or a wound) and **reveal** (the eye opens, the tendrils come out; `js/ai.js` plays it before its first act). The stone: "fork", as the Fork's own stalagmites are drawn (*"Brown live is good"*; grey and slate are in `dev/visions/roper-looks.png`). **Off the wanted list on his word after his own fight** (*"ran into it in the group tab, off the list :)"*); the test room: `deep16/?npc=roper&lvl=6&map=roperfork&watch`.

**The grick (10-02).** Pipeline 1b's third, from MZ4250's "Grick Updated" (Thingiverse 4738607, CC BY), which Griz fetched: the first zip to ship the artist's own rig and pose, so the rows are bends on the miniature's own coil (`tools/grick-blend.py`). `grick_p1`: idle, walk (a wave back through the coil), `tentacles` (it rears, the four splayed, then lunges and they close), `beak` (holding, it gapes and snaps), flinch, death (the neck falls forward; prone at frame 3), **still** (Stone Camouflage: coiled low, the head down; the grid shows it till its first turn or a wound) and **reveal**. His picks from `dev/visions/grick-looks.png`: the lift off (*"i like 'green no-lift'"*), the hide the den's own brown stone (*"The SRD says stone camoflague, which means we probably go with brown given the existing maps, I'm pretty sure it's not worth getting fancy and having a green one turn brown when it goes stealth"* -- so `S.STONE`, as the roper: a map that names its stone draws it in that), the beak *"pale"*. The test room: `deep16/?npc=grick,grick,grick&lvl=5&map=grickden&watch`. **Then the test ground (10-02, his ask):** `deep16/?show=grick` -- two gricks in bright, dim and dark on slate, four watchers by different eyes, every row twice (`deep16/js/show.js`; the recipe's step 12). The walk redone the same night: *"I just thought they'd flatten out more snake-like when they were moving"* -- laid flat and slithering (`dev/visions/grick-walk.png`); then *"can we do the old one for 1-2 squares and the new if they're going 3 squares or more"* -- two gaits, `walk` and `slither` (`js/battle.js` moveAlong picks by the move's length). The prone frame, after his *"make sure if it can be prone it looks prone when it is"*: the death row's first cut kept the coil's hump (a slump, not a creature down); now it lays the neck along the ground by frame 3, alive, then goes slack (`dev/visions/grick-prone.png` is the old one). **Off the wanted list on his word** (*"it does, looks great"*, of the test ground).

Still wanted below: four creatures (the Keeper first).

What the cutter needs from a sheet (the gnoll sheets were right): a turnaround of stills (front, right, back, left), then rows of frames all facing right in side view; every frame apart from its neighbours; one scale for the whole sheet. Colour needn't be exact: every sheet is regraded and snapped to DEEP16's 64 colours. (The boar sheet drew its lower rows smaller than its walk; the cutter evens that out, but one scale is still best.)

---

## COMMON TAIL (paste after every head)

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, every frame in side view facing right, numbered under each frame. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.

---

The order is the story fights first, worst stand-in first: a creature drawn today as some other model (the xorn, a green blob till 10-01d, the roper, a cactus till 10-01e, and the grick, a squid till 10-02, are in hand). Two a day. Canon notes are from the wiki and the monster records; the look past them is SRD-plain.

## Day 2

### 3. The grick (the gricks' den)

IN HAND 10-02 (pipeline 1b: above). The head is kept for a re-roll.

HEAD: GRICK -- the dwarven road. A thick worm-like body with rubbery grey-green hide, the head a sharp beak ringed by four tentacles. It rears up from a coil to strike. Rows: Idle (coiled, 8), Slither (8), Attack (rears, tentacles then beak, 8), Hurt (6), Death (8).

### 4. The Keeper (the wall's keeper, the flooded stair)

Stands in as a snake today. A water weird, bound by the dwarves to guard the stair: it cannot leave its water, and it can't be seen in the water till light shows it.

HEAD: THE KEEPER (a serpent of living water) -- the flooded dwarven stair. A serpent made of clear blue-green water with a faint face in it, rising out of a pool on a worn stone stair. Every frame rises out of the same pool surface. Rows: Hidden (only ripples on the pool, 6), Rise (8), Idle (8), Strike (8), Constrict (coils round a shape and drags it under, 8), Hurt (a burst of spray, 6), Death (falls back into the pool, 8).

## Day 3

### 5. The duergar (the giant's camp; three to a fight)

A barbarian model today.

HEAD: DUERGAR (grey dwarves) -- the deep. Bald grey-skinned dwarves with pale eyes, dark iron scale armour, a war pick and javelins. Rows: Idle (8), Walk (8), Attack (war pick, 8), Throw (javelin, 6), Enlarge (grows to twice his height, 6), Fade (turns invisible, 6), Hurt (6), Death (8).

### 6. The troll (leg four: the troll pack)

A yeti today.

HEAD: TROLL -- the dwarven road. Tall and lanky, rubbery green hide, long arms dragging clawed hands, a long nose, lank dark hair. Large. Rows: Idle (8), Walk (8), Claws (8), Bite (6), Regrow (a wound closing, 6), Hurt (6), Death (burning, 8).

## Day 4

### 7. The stone giant (the giant's camp, with the duergar)

A blue demon today.

HEAD: STONE GIANT -- the deep. Lean and hairless, grey skin like carved stone, heavy brow. Huge: much taller than a man. Rows: Idle (8), Walk (8), Club (8), Throw Rock (8), Catch Rock (6), Hurt (6), Death (8).

---

## The landlord's pictures (the telepathy in the Wet -- stills, not sheets; asked 09-30g; IN HAND 10-01)

**In:** his five from `dev/visions/` (10-01), cut by `tools/visions.py` to 360 wide and a palette each, drawn by `deep16/js/wet.js` `W.picture` (the code's 96 x 72 sketches stand in only till they load). The prompts below are kept for a re-roll.

The landlord's own sheet is in (IN HAND above); these are different. The otyugh speaks in pictures. On the grid each one fills the screen for a few seconds, swaying, breathing, a vignette closing in (`deep16/js/wet.js` `W.picture`). The order is the order they are seen: the
bucket at first contact, then the other four in a row after it is fed ("what comes down the stream").

### COMMON TAIL (pictures -- paste after each picture's head)

A single still illustration, not a sprite sheet. Painterly dark fantasy, murky and dreamlike, as if seen through dirty water and through someone else's mind: soft edges, a dark vignette closing in from every corner, a sickly green-grey palette with only the small accents the head names. 4:3 landscape. No text, no border, no frame, no people.

### P1. The bucket (first contact: it is hungry)

HEAD: A PICTURE OF A BUCKET -- the landlord's first thought. A wooden bucket bound with iron hoops, lowered on a frayed rope out of the dark above, swinging a little; bones and scraps of carrion over its rim; thick drips falling from its bottom into black water far below. Behind the whole scene, huge and blurred, a single yellow eye.

### P2. The fall

HEAD: THE FALL -- an underground waterfall pouring out of a crack high in a cave wall into a black pool; the stream carries bones, broken timbers and rags down with it; spray and mist; cold blue-grey water light.

### P3. The crook (the clacker cavern upstream)

HEAD: THE CROOK -- a cavern forest of giant pale fungus, tall caps in lilac and bone-white glowing faintly over a still, mirror-dark cave lake; in the foreground the stream leaves the lake through a narrow channel.

### P4. The clackers (hook horrors; the game never names them)

HEAD: THE CLACKERS -- two tall hunched hook horrors in near darkness: vulture-like beaked heads, armoured grey bodies, long arms ending in huge curved bone hooks raised mid-clack; only their silhouettes, the pale hooks and small yellow eyes catch the light.

### P5. The chimney of wings

HEAD: THE CHIMNEY -- a narrow natural rock chimney seen from below, rising into darkness, filled with a spiral of thousands of bats streaming upward; a thin shaft of grey light far above.

---

## Later (the ladder's bestiary rungs, no story fight yet)

Each wants the same shape; a head drafted when its day comes. Worst fits first:
- the ettin (two heads; an orc recoloured today)
- the gibbering mouther (a pink blob today)
- the gelatinous cube (a slime today: it wants to be a cube, see-through, with things inside)
- the darkmantle (the roof-killers of the guano galleries)
- the spirit naga (a snake today: it wants a human face)
- the earth elemental (a blue demon today)
- the bugbear chief, the ogre (a monkey and an orc today)
- the hobgoblin, the grimlock, the axe beak
- the boar's second sheet, if it comes (its title says 1/2): welcome, not needed -- the first has every row the grid plays

---

## The clackers (the landlord's picture made flesh; asked 10-01; the sheet IN HAND 10-01)

Griz, 10-01: *"we're going to need an art-prompt description of the clackers it has envisioned to hope for something close when we eventually model it, try make one of those in blender so we have it later"*, and the same night, *"I had a problem with the 'later' on the clacker and there's a 16 bit animation sheet available for review"*: he ran Q2, and the sheet is on the grid (IN HAND above; `?npc=clacker` fields it, a block of our own in `deep16/data/foes.js` and `invented.json#clacker`, clacking its hooks at the start of each turn). The look below is read off the landlord's picture (`dev/visions/the-clackers.jpg`, the fourth it sends when fed) and the wiki's clacker cavern (`TarlynsPit/wiki/the-warrens.md`: a hook horror colony crowning the crook; the clacking is their language). The game never names them. Q1 (the model sheet) is still welcome for the Blender model below.

**The look, in words (for any prompt, any tool):** a hook horror. Tall and hunched, about nine feet if it ever straightened, its back bowed so the head hangs forward below the line of the shoulders. A small vulture's head on a thick neck: a long down-curved beak, pale bone, hooked at the tip; two small round yellow eyes set close above the beak's root; no ears, no crest. The whole body sheathed in small overlapping plates like cobblestones or old scales, dark green-grey, lighter on the ridges and black in the seams; a heavy chest and shoulders, a narrow waist. No hands: each long forearm ends in one huge curved hook of pale ivory bone, longer than the forearm, smooth and worn bright on its inner edge. At rest the hooks are carried raised and folded back, so they rise above the shoulders and curl forward over the head like a pair of scythes. Long bent legs, clawed feet, a stalking gait. The only colours are the grey-green hide, the bone of the beak and hooks, and the yellow of the eyes. It talks by striking its hooks together: clack, clack.

### Q1. The clacker, a model sheet (for modelling it in 3D)

Paste alone (not with the COMMON TAIL above):

HEAD: CHARACTER MODEL SHEET FOR 3D MODELLING -- a hook horror: [paste the look, in words, above]. Orthographic views of the whole creature side by side, the same scale and the same baseline in each: FRONT, SIDE (facing right), BACK, and THREE-QUARTER FRONT; in each view it stands in its neutral hunch with the hooks raised over the shoulders. Beneath: a close-up of the head in profile and from the front (the beak, the eyes, how the plates run over the skull), a close-up of one forearm and its hook from the side (where bone meets plate), and a small figure of a human man beside the side view for scale. Flat even studio lighting, no cast shadows, no perspective, a plain light-grey background, clean lines. Concept art, not a painting: every form readable. No text but the view labels.

### Q2. The clacker, a sprite sheet (for the grid, the day it fights)

HEAD: THE CLACKER -- a hook horror out of the deep caves: [paste the look, in words, above]. Large: twice a man's height hunched. Rows: Idle (8, the head bobbing, the hooks flexing), Walk (8, the hunched stride, hooks held high), Hook (8, one hook swung down and across), Clack (6, both hooks raised and struck together over the head: their speech and their war-cry), Climb (6, hooking up a rock wall), Hurt (6), Death (8).

**The model (10-01, a first pass):** `tools/clacker-blend.py` builds it from nothing in Blender 5.2 (`"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python tools/clacker-blend.py [-- previews]` writes `deep16/_src/clacker/clacker.blend`, gitignored, so the script is what the repo keeps). A Skin-modifier body with a plated-hide shader, swept bone hooks, beak and toe claws, yellow eyes; 23 bones; IDLE, WALK and ATTACK (the hooks raised in a V, crossed in an X at frame 17: the clack). It is in `tools/deep16-figures.json` as `clacker` (1.35 squares, about 86 px tall, the ettin's height) and runs through `tools/render-sprites.py`; nothing in the game uses it yet. Previews: `dev/visions/clacker-model-*.png`. **Short of the painting:** the body is a round blob, the legs frog-like, the head long rather than a domed vulture's skull, the hooks rod-straight from the front; a Q1 model sheet is what would true it.

Spell looks are NOT on this list: the pass draws them in code (and Blender can render a floating weapon), so the generator's days go to creatures.

---
title: DEEP16 art wanted -- what is still a stand-in
made: 2026-09-28 (Code tab), for Griz's free GPT / Grok image runs
updated: 2026-10-05 (Code tab) -- rewritten on Griz's word ("we're pretty much done with that list"): the WANTED table is the Pocket DM's pot checked against the figures; everything finished is under IN HAND; the Keeper, rebuilt with a fight of his own, is in
how: paste a creature's HEAD, then the COMMON TAIL, into the generator. Drop what comes back in the repo root (any name; say which creature) and the seat files it in `deep16/_src/` as `<creature>_grok_N.png` (gitignored; tester screenshots go in `deep16/_src/tester-feedback/`) and cuts it the chuul's way (pipeline 2: one `tools/<creature>-sheet.py` per creature). A free print model with a .blend goes through pipeline 1b instead: `deep16/blender-monsters.md`
---

# DEEP16 art wanted

Checked 10-05 against `deep16/data/foes.js` (the Pocket DM's pot: every foe but the story's named, the familiars and CR 0) and `tools/deep16-figures.json`. **Nothing here blocks anything**; the fights all play. These are looks, not needs.

## WANTED (still a Quaternius stand-in, worst fit first)

| creature | stand-in today | what it wants |
|---|---|---|
| the water elemental | **not a foe yet** | RULED 10-04 (Griz: "we're staying as close to the SRD as we can, immunity and a sheet"): a foe of its own with the SRD's condition immunities (prone among them) and its own sheet; Large, swim 90 ft., Whelm. The Keeper is immune to prone by the same ruling |
| the spirit naga | a snake (`Snake_Angry`) | a human face on the serpent |
| the gelatinous cube | the green Slime | a cube, see-through, with things inside |
| the ochre jelly, the gray ooze, the black pudding | the same green Slime (three kinds that look identical) | each its own colour and shape: a jelly, a flat grey film, a black heap |
| the gibbering mouther | the Pink Blob | a mound of mouths and eyes |
| the earth elemental | the Blue Demon | a heap of rock and earth |
| the ettin | the Orc Skull | two heads |
| the ogre | the Orc | an ogre of its own, not an orc recolour |
| the bugbear chief, the bugbear (they share the chief's sheet) | the Monkroose | a bugbear: hairy, long-armed, goblinoid |
| the hobgoblin, the hobgoblin sergeant | the Orc / the Orc Skull | red-faced, disciplined, armoured |
| the grimlock | the Ninja | blind, grey, toothy |
| the axe beak | the Birb | a tall flightless beak |
| the darkmantle | the Glub (hand-built; the SRD attach needed it) | a real sheet, or the Blender recipe |

### In the 8-bit with no grid foe: all seven now on the grid (10-05)

The Hired Blade, the Stable Fighter and the Drow Blade-Captain are done above. The four creatures are **drawn in code** (Griz: *"can we give them a special effect body?"* -- *"Let's try code drawn"*), so they are in hand, and a real sheet or model is welcome, never needed:

- the **will-o'-wisp**: a light field (`tools/wisp-sheet.py`), with a floor light of its own (`glow`, out when it turns invisible);
- the **stirge**, the **fire beetle** (glands that light the floor) and the **giant centipede**: `tools/bugs-sheet.py` on `tools/codeart.py`; the stirge has a `latched` row for Blood Drain (the proboscis driven in, the body swelling red).

Front and back views for the three bugs are in (S and N, 10-05); the hurt row still uses the side frames. What is left: a wisp that shows its Variable Illumination (bright 5-20 ft) on screen.

Any of them goes first to a free printable with a .blend (`deep16/blender-monsters.md`), second to a generated sheet. A second sheet for something already in hand (idle variations, special moves) is welcome, never needed.

## IN HAND (on the grid; don't regenerate)

| creature | what is in | cut by | in since | prone |
|---|---|---|---|---|
| the chuul | 2 sheets | `tools/chuul-sheet.py` | 09-27 | someday |
| the crawler (the Warrens' herd) | 1 | `tools/crawler-sheet.py` | 09-27 | someday |
| the gnolls (and the Snoot's glory-seekers) | 2: the second gives PRONE and LAUGH rows | `tools/gnoll-sheet.py` | 09-28, 10-02 | its own row |
| the cloaker (and its close-up) | 3 | `tools/cloaker-sheet.py` | 09-29 | -- (it flies) |
| the ettercap | 3 (the third: the sitting-and-braiding idle) | `tools/ettercap-sheet.py` | 09-29, 09-30 | someday |
| the otyugh, the landlord | 1 | `tools/otyugh-sheet.py` | 09-29 | someday |
| the hyena | 2 (the second: the ROFL row) | `tools/hyena-sheet.py` | 09-29, 09-30 | the ROFL row |
| the bulette | 2 | `tools/bulette-sheet.py` | 09-29 | someday |
| the owls, brown and snowy (Find Familiar) | 2 each | `tools/owl-sheet.py` | 09-29 | someday |
| the giant boar | 1 of 2 (the first has every row the grid plays) | `tools/boar-sheet.py` | 09-30 | someday |
| the landlord's five pictures (the Wet's telepathy) | 5 stills from `dev/visions/` | `tools/visions.py` | 10-01 | -- |
| the clacker | 2 from Grok (`clacker_grok_2`, `clacker_grok_3` for the hook); GPT's first retired | `tools/clacker-sheet.py` | 10-01 | someday |
| the xorn (pipeline 1b's first) | MZ4250's Xorn, 11 rows | `tools/xorn-blend.py` | 10-01 | its own row |
| the roper (1b's second) | MZ4250's Roper 2025; still and reveal rows | `tools/roper-blend.py` | 10-01 | its own row |
| the grick (1b's third) | MZ4250's Grick on its own rig; walk and slither, still, reveal | `tools/grick-blend.py` | 10-02 | frame 3 of its death |
| the troll (1b's fourth) | MZ4250's Troll Updated, a biped on its own rig | `tools/troll-blend.py` | 10-04 | its own row |
| the stone giants, her and him (1b's fifth; two looks, one at random) | MZ4250's female and male Stone Giant (thing:4157322, CC BY): idle, walk, greatclub, greatclub2, rock, flinch, hurt, prone; Griz's poser frames in greatclub, prone and hurt | `tools/stonegiant-blend.py`, `tools/stonegiantm-blend.py` | 10-04 | its own row |
| the will-o'-wisp, the stirge, the fire beetle, the giant centipede (**drawn in code**, 10-05) | `wisp_p1`, `stirge_p1`, `firebeetle_p1`, `centipede_p1`: idle, walk, attack, flinch, hurt; the stirge's `latched` row | `tools/wisp-sheet.py`, `tools/bugs-sheet.py`, `tools/codeart.py` | 10-05 | the hurt row (they die on their backs) |
| the garrison of Sólskaft: the Trooper and the Drill-sergeant (the Skylights, out of the roof hatch; 10-05) | the duergar's sheet (`duergar_p0`), a grey dwarf in dark iron | a garrison dwarf in the king's colours: idle, walk, a spear thrust (the sergeant a longsword), hurt, prone |
| the townsfolk of Fountain Street (the Skylights' walk-in, 10-05: a look, no fight) | the crewman's, the thug's and the bandit's sheets | plain folk of the street, a woman and a child among them: idle and a run |
| the duergar (an LPC grey dwarf, not generated) | `duergar_full` composed, squashed to a dwarf's build: idle, walk, war-pick swing, hurt, cast (Enlarge, Invisibility) | `tools/lpc-compose.py`, `lpc-squash.py`, `pixelate.py p0` | 10-04 | the LPC fall row |
| **the Keeper** (the flooded stair; a fight of his own) | a generated sheet, `keeper_p2` (`keeperold`, `keeper_p1`, is the ladder's old one) | -- | 10-04 | immune to prone (SRD) |

**The Edifice story battle (10-05, being built):** its band is the troll and/or the stone giants, both in hand with climb rows (3210a68); the party and Pyro are LPC. No art is wanted for it. If a boss wants a look of its own, it goes on the WANTED table.

Not done on the stone giant: **Catch Rock** waits with her Rock Catching (Griz, 10-04: "register now"); nothing in the game can hurl a rock at her yet (`..\handoff-2026-10-04-the-grids-rules.md` 2.7). Not done on the troll: a Regrow row.

**The prone column (10-01b).** The LPC figures (the heroes, Ingrith, the guests, every class NPC, the duergar: the `_p0` sheets) have prone already: the fall row's frame before last, held while prone, played back to get up (`deep16/js/sprites.js` S.proneFrame). A generated sheet's death row ends dead, so it stands while prone until a sheet brings a row for it. When a sheet is made again, ask for: *"PRONE: knocked flat but alive and struggling, 2 frames: lying on the ground, then pushing itself up."* A sheet that brings it is cut into `S.PRONE` (one line).

**Special moves before detailed attacks (10-01d).** Griz: *"It's important for us to do the special move ones - like burrow and Earth Glide more than detailed attacks"*. A row for a special move (going under, coming up, a hide's reveal) outranks a second attack row; the grid has the hooks (js/ai.js burrower, still and reveal).

What the cutter needs from a sheet (the gnoll sheets were right): a turnaround of stills (front, right, back, left), then rows of frames all facing right in side view; every frame apart from its neighbours; one scale for the whole sheet.

---

## COMMON TAIL (paste after every head)

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, every frame in side view facing right, numbered under each frame. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.

---

## Heads kept for a re-roll (all IN HAND above)

HEAD: GRICK -- the dwarven road. A thick worm-like body with rubbery grey-green hide, the head a sharp beak ringed by four tentacles. It rears up from a coil to strike. Rows: Idle (coiled, 8), Slither (8), Attack (rears, tentacles then beak, 8), Hurt (6), Death (8).

HEAD: THE KEEPER (a serpent of living water) -- the flooded dwarven stair. A serpent made of clear blue-green water with a faint face in it, rising out of a pool on a worn stone stair. Every frame rises out of the same pool surface. Rows: Hidden (only ripples on the pool, 6), Rise (8), Idle (8), Strike (8), Constrict (coils round a shape and drags it under, 8), Hurt (a burst of spray, 6), Death (falls back into the pool, 8).

HEAD: DUERGAR (grey dwarves) -- the deep. Bald grey-skinned dwarves with pale eyes, dark iron scale armour, a war pick and javelins. Rows: Idle (8), Walk (8), Attack (war pick, 8), Throw (javelin, 6), Enlarge (grows to twice his height, 6), Fade (turns invisible, 6), Hurt (6), Death (8).

HEAD: TROLL -- the dwarven road. Tall and lanky, rubbery green hide, long arms dragging clawed hands, a long nose, lank dark hair. Large. Rows: Idle (8), Walk (8), Claws (8), Bite (6), Regrow (a wound closing, 6), Hurt (6), Death (burning, 8).

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

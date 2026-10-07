---
title: DEEP16 art wanted -- what is still a stand-in
made: 2026-09-28 (Code tab), for Griz's free GPT / Grok image runs
updated: 2026-10-06 night (Code tab) -- the Mascot's new rows against the sheets asked for, and Goose's first sheet, on his word; 2026-10-06 (Code tab) -- the Wet's three props under WANTED, on his word; 2026-10-05 (Code tab) -- rewritten on Griz's word ("we're pretty much done with that list"): the WANTED table is the Pocket DM's pot checked against the figures; everything finished is under IN HAND; the Keeper, rebuilt with a fight of his own, is in
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

### The MPMons' next sheets (Griz's own: Denny and Beholda, his Monster Party PCs; added 10-06)

On the grid since 10-06 (`deep16/js/mpmon.js`; deep16/README.md "MPMon"): Beholda on a stand-in cut from her first sheet (`tools/beholda-sheet.py`: her front views for every facing, the projection for the gaze, no swing, no fall), Denny with TAUNT, DENIM DAMAGE and CANNONBALL rows made from his poses (`tools/denny-sheet.py`). Griz, 10-06: *"sheets aren't coming until tomorrow"*. When they come back: Beholda's goes in `deep16/_src/beholda_grok_2.<ext>` and `tools/beholda-sheet.py` cuts it (turnaround -> idle by facing; Hover -> walk; Dice Slam -> attack; VNA Bubble -> cast; Baleful Gaze -> gaze, which the Big Screen plays too; Flinch -> flinch; Fall -> hurt; Prone -> prone); Denny's goes in `deep16/_src/denny_sheet_3.<ext>` and `tools/denny-sheet.py` cuts it (Punch -> attack, in the lunge's place; Taunt -> taunt; Denim Damage -> denimdamage; Cannonball -> cannonball; Climb -> climb; Flinch -> flinch; Fall -> hurt; Prone -> prone). The design and these prompts' first draft: `..\beholda\deep16-translation.md`. Each paste is whole (they are his characters, so they carry their own reference line and their own tail, not the COMMON TAIL); attach the named sheet as the reference image.

**Both came back 10-07, IN HAND** (Griz: Beholda's two pastes as one sheet, `dev/visions/beholda/Beholda Pixel Sprite Sheet.png`; Denny's sheets 3 and 4 as "sheet 3 (1 of 2)" and "(2 of 2)", `dev/visions/denny/`): `beholda_p3` by `tools/beholda-p3.py`, `denny_p3` by `tools/denny-p3.py`, both over `tools/sheetrows.py` (deep16/README.md "MPMon", the looks). The pastes below are kept for a re-roll.

BEHOLDA, SHEET 2 -- attach her first sheet (the one with the Big Screen Projection row):

Attached: Beholda's first sprite sheet. Draw her again exactly: the same character, the same pixel style, the same colours, the same size. A round fuzzy purple body with one big eye and a wide smile, four eyestalks with red-ringed eyes on top, cyan lightning wisps at her sides, and three dice hanging on short chains below her (a cyan d20 on the left, a magenta d10 in the middle, a lime d8 on the right).

HEAD: BEHOLDA, THE BENEVOLENT BEHOLDER -- sheet 2, her moves for a tactics game. She has no feet: she floats, and in every frame the bottom of her lowest die hangs the same small height above one shared baseline. She has no hands: she fights by swinging her dangling dice and with her big eye. Rows: Hover (8: drifting forward, the eyestalks trailing back, the dice swinging behind her); Dice Slam (6: she twists and swings her three dice on their chains at a foe in front of her like a flail, then they swing back); VNA Bubble (6: her eyestalks flare out wide, her big eye squeezes shut and then flies open, and a shimmering rainbow soap-bubble film forms close around her body, never bigger than her own body); Baleful Gaze (6: she turns her big eye full on a foe in front of her; the eye swells and glows violet with a hypnotic spiral in the pupil; no beam leaves the eye); Flinch (4: struck, she squashes and jolts back with the eyestalks splayed, then recovers); Fall (6: knocked out, she sinks to the ground, the eyestalks droop, the big eye rolls up and closes, the dice clatter down; the last frame lies flat on the ground); Prone (2: knocked flat but alive and struggling: lying on the ground, then pushing herself back up into the air).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, every frame in side view facing right, numbered under each frame. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, every frame floating at the same height above one baseline. No scenery except what a row names.

DENNY, SHEET 3 -- attach `deep16/_src/denny_sheet_2.webp` (the turnaround and walk cycle sheet):

Attached: Denny's character sheet. Draw him again exactly: the same character, the same pixel style, the same colours, the same size as the turnaround in the attached sheet. A red monkey with big dark eyes, a tan muzzle, orange fin-like ears and a tuft of red hair, a long red tail curled in a spiral, an open blue denim jacket with brass buttons over a bare chest, rolled denim jeans, bare red feet.

HEAD: DENNY THE LOBSTAMONKEE -- sheet 3, his fighting moves for a tactics game. He fights with his bare fists, never a weapon. Rows: Punch (6: a quick jab and a cross, then back on guard); Taunt (6: he plants his feet, waggles his fingers beside his ears, sticks out his tongue, then beckons "come on": cocky, a challenge to every foe); Denim Damage (8: his big hit: he winds up, spins once with the denim jacket flaring, and lands a huge haymaker with a burst of blue denim-thread sparks at the fist, then settles); Cannonball (8: he crouches, springs high into the air, tucks into a ball at the top, slams down onto the ground with a ring of dust bursting out, and stands up out of it); Climb (6: climbing straight up an unseen wall with hands, feet and tail; do not draw the wall); Flinch (4: struck, he jolts back with his eyes squeezed shut, then recovers); Fall (6: knocked out, he topples backward and lies flat on his back, the tail limp; the last frame lies on the ground); Prone (2: knocked flat but alive and struggling: lying on the ground, then pushing himself up).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, every frame in side view facing right, numbered under each frame. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.

RASCAL, SHEET 1 (added 10-06 late, on Griz's word after the Blender figure's v8 look -- *"that claw is all jacked"*, *"Please give me an art wanted paste for a 16b sheet attempt from the image gen"*; the Blender figure is parked, `tools/rascal-blend.py`) -- attach his illustration (the cleaned drawing of the front photo he pasted in chat 10-06) or `dev/visions/Rascal/RascalFront.jpg`. His specials' looks are his (10-06): *"Social sharing as a hat removing bow"*, *"Social flame as dancing with claw clapping"*. When it comes back it goes in `deep16/_src/rascal_grok_1.<ext>` and a cutter `tools/rascal-sheet.py` by `tools/denny-sheet.py`'s pattern cuts it (turnaround -> idle by facing; Walk -> walk; Pinch -> attack; Social Sharing -> socialsharing; Social Flame -> socialflame; Climb -> climb; Flinch -> flinch; Fall -> hurt; Prone -> prone; the two new names into `tools/pixelate.py`'s ANIM_ORDER and FPS and `deep16/js/ui.js`'s play-once rule). The rows face LEFT, not right as the others': his claw is his right arm, and facing right it would be the far arm, hidden behind him.

**It came back the same night** (`dev/visions/Rascal/RascalSheet1.jpg`; Griz: *"got the face wrong and ran two of his mouth whiskers through his hat, but the lobsta tail is cool"*, *"the sheet poses match the others better"*) and was `rascal_p1` from 10-06 till its retirement 10-07 (*"the invisible hat one has no further purpose"*; `tools/rascal-sheet.py`, retired with it: the rows cut by boxes read off the sheet, the whiskers erased above the hat, the walk's missing seventh frame left at seven, the fall's last two frames from the prone row). **A second sheet, when wanted,** asks for: the face as the felt's (a bright red mask with yellow loops round the eyes, the whiskers from the mouth and not through the hat), a front and a back row for each move (the first sheet is side rows only, so S and N show the side frames), and the walk's eight frames numbered as drawn.

Attached: a drawing of Rascal, a needle-felted lobstamonkee. Draw him as a pixel-art character, keeping every feature: a round fuzzy bright orange body (brighter and more orange than the attached picture shows), a big domed head with a bright red face, two big black bead eyes each ringed in yellow, yellow lines running from under the eyes down to an orange muzzle, two long thin orange wire antennae arching out from the sides of his head and hooking at the ends, two thick orange whisker-tentacles curling out from his mouth with hooked yellow tips, a black felt cowboy hat with a red rope band, his RIGHT arm one giant lobster claw as long as his body, banded yellow, orange and black, with two fat red-tipped pincers, his LEFT arm a thin furry orange arm with a three-fingered hand, short bent furry orange legs with three-toed feet, and a long thin lobster tail banded red and black with an orange tip. No clothes but the hat.

HEAD: RASCAL THE LOBSTAMONKEE -- sheet 1, his moves for a tactics game. He fights with the giant claw. Rows: Walk (8: a scuttling walk on the short bent legs, the claw held up in front, the tail trailing behind); Pinch (6: his regular blow: the giant claw swings up and snaps shut on a foe in front of him, then draws back); Social Sharing (6: his left hand sweeps the hat off his head and he bows low, the hat held out wide, the antennae dipping with him, then he straightens and sets it back on); Social Flame (8: he dances on the spot, hopping from foot to foot, the giant claw raised over his head clapping its pincers together in time, the tail swinging; no fire drawn, the game adds it); Climb (6: climbing straight up an unseen wall with the claw, the hand, the feet and the tail; do not draw the wall); Flinch (4: struck, he jolts back with his eyes squeezed shut and the antennae whipping, then recovers); Fall (6: knocked out, he topples backward and lies flat on his back, the claw fallen open, the hat still on; the last frame lies on the ground); Prone (2: knocked flat but alive and struggling: lying on the ground, then pushing himself up).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, every frame in side view facing left so the claw arm is nearest the viewer, numbered under each frame. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.

### The Mascot's new rows, and Goose (added 10-06 night, the race-and-class seat)

The class is the Mascot now (`deep16/js/mpmon.js`; the MPMon lane §6): every one of the four gets a free bonus move at 2nd, a passive at 3rd, a reaction at 6th and a fourth special at 7th. Griz: *"please add goose 16b sheet prompt to art_wanted (and compare what's there for the others versus the new ability needs). Goose is small and should bounce around on idle and jump up to cast."* The rows the sheets above already ask for, against what the new kit plays (the game falls back to the row named after the slash until the new row is cut):

| Mascot | the move | the row it plays | asked for above? |
|---|---|---|---|
| Denny | Taunt (a bonus action now, no swing of its own) | `taunt` | **IN HAND 10-07: `denny_p3`, sheet 3 (1 of 2)** |
| Denny | Monkey Flurry, 2nd (one more punch) | `attack` (the Punch) | **IN HAND 10-07: `denny_p3`, sheet 3 (1 of 2)** |
| Denny | Denim Damage's knock (3rd on) | `denimdamage` | **IN HAND 10-07: `denny_p3`, sheet 3 (1 of 2)** |
| Denny | Bodyguard, 6th (a reaction: he steps in the way) | `guard` | **IN HAND 10-07: `denny_p3`, sheet 3 (1 of 2)** |
| Denny | Lobstah Hug, 7th (a grab and a squeeze) | `lobstahhug` | **IN HAND 10-07: `denny_p3`, sheet 3 (2 of 2)** |
| Beholda | Eye On It, 2nd (her stalks on a foe) | `spot` | **IN HAND 10-07: `beholda_p3`, her second sheet** |
| Beholda | Lucky Dice, 3rd (a passive) | none (a sparkle in code) | -- |
| Beholda | Eye Contact, 6th (a reaction: a stare) | `gaze` | **IN HAND 10-07: `beholda_p3`** |
| Beholda | Spotlight, 7th (a friend Hasted) | `spotlight` | **IN HAND 10-07: `beholda_p3`, her second sheet** |
| Rascal | Fire Bolt, his regular blow | `cast` | **IN HAND 10-07: `rascal_p2`, sheet 2's Fire Bolt** |
| Rascal | Scuttle, 2nd (Dash, Disengage, Hide) | `walk` | yes |
| Rascal | Social Distancing, 5th (the ring round him cleared, no longer a cone) | `socialdistancing` | **IN HAND 10-07: `rascal_p2`, sheet 2** |
| Rascal | Hot Take, 6th (a reaction: fire back) | `hottake` | **IN HAND 10-07: `rascal_p2`, sheet 2** |
| Rascal | Going Viral, 7th (fire foe to foe) | `goingviral` | **IN HAND 10-07: `rascal_p2`, sheet 2** |
| Goose | everything | `idle` `walk` `attack` `cast` `honk` `climb` `flinch` `hurt` `prone` | **IN HAND 10-07: `goose_p1`, his picks from three sheets (`tools/goose-sheet.py`); his build 10-07 (the heals play `cast`, Honk `honk`)** |

When they come back: each new row name into `tools/pixelate.py`'s ANIM_ORDER and FPS and `deep16/js/ui.js`'s play-once rule, the cutter (`tools/denny-sheet.py`, `tools/beholda-sheet.py`, `tools/rascal-sheet.py`) given the rows, then `?mpshow&lvl=9` (every move has a beat) and a fresh eyes row.

DENNY, SHEET 4 (two rows) -- attach `deep16/_src/denny_sheet_2.webp`:

Attached: Denny's character sheet. Draw him again exactly: the same character, the same pixel style, the same colours, the same size as the turnaround in the attached sheet. A red monkey with big dark eyes, a tan muzzle, orange fin-like ears and a tuft of red hair, a long red tail curled in a spiral, an open blue denim jacket with brass buttons over a bare chest, rolled denim jeans, bare red feet.

HEAD: DENNY THE LOBSTAMONKEE -- sheet 4, two more moves for a tactics game. Rows: Guard (4: he hops sideways into the way of a blow meant for a friend and braces, forearms crossed in front of his face, the denim jacket flaring, then holds it); Lobstah Hug (8: he lunges forward and throws both arms and his curled tail round a foe in front of him -- do not draw the foe: he hugs a shape as big as he is -- squeezes hard twice with his cheeks puffed out, then holds the hug).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background. Labelled rows of frames, every frame in side view facing right, numbered under each frame. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery.

BEHOLDA, SHEET 3 (two rows) -- attach her first sheet:

Attached: Beholda's first sprite sheet. Draw her again exactly: the same character, the same pixel style, the same colours, the same size. A round fuzzy purple body with one big eye and a wide smile, four eyestalks with red-ringed eyes on top, cyan lightning wisps at her sides, and three dice hanging on short chains below her (a cyan d20 on the left, a magenta d10 in the middle, a lime d8 on the right).

HEAD: BEHOLDA, THE BENEVOLENT BEHOLDER -- sheet 3, two more moves for a tactics game. She floats: in every frame the bottom of her lowest die hangs the same small height above one shared baseline. Rows: Spot (4: all four eyestalks swivel round to point at a foe in front of her and her big eye narrows knowingly, a small star glinting at each stalk's tip); Spotlight (6: her big eye opens wide and glows warm gold, and a short cone of golden stage light shines up and forward from it, then fades; the cone no longer than she is wide).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background. Labelled rows of frames, every frame in side view facing right, numbered under each frame. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, every frame floating at the same height above one baseline. No scenery except what a row names.

RASCAL, SHEET 2 (four rows, and his face put right) -- attach his illustration (the cleaned drawing of the front photo) or `dev/visions/Rascal/RascalFront.jpg`:

**Both came back 10-07, with a third** (`dev/visions/rascal/`: "Rascal the Lobstamonkee Sprite Sheet1.png", sheet 1 redone with the felt's face and the hat charcoal grey; "Sheet2.png", these four rows and a walk; "Rascal Social Sharing Sprite Sheet3.png", the bow again at a larger scale) and are `rascal_p2` since 10-07 (`tools/rascal-sheet-p2.py`; the bow is sheet 3's -- sheet 1's drew a second hat in his hand while the first stayed on his head; the walk sheet 2's, his word: *"significantly better"*; he stands about 42 at rest, 80% of Denny: *"a little large for the squishy DPS"*). Still side rows only: S and N show the side frames for every row but the idle and the walk.

Attached: a drawing of Rascal, a needle-felted lobstamonkee. Draw him as a pixel-art character, keeping every feature: a round fuzzy bright orange body, a big domed head with a bright red face, two big black bead eyes each ringed in yellow, yellow lines running from under the eyes down to an orange muzzle, two long thin orange wire antennae arching out from the sides of his head and hooking at the ends, two thick orange whisker-tentacles curling out from his MOUTH with hooked yellow tips (they never cross the hat), a black felt cowboy hat with a red rope band, his RIGHT arm one giant lobster claw as long as his body, banded yellow, orange and black, with two fat red-tipped pincers, his LEFT arm a thin furry orange arm with a three-fingered hand, short bent furry orange legs with three-toed feet, and a long thin lobster tail banded red and black with an orange tip. No clothes but the hat.

HEAD: RASCAL THE LOBSTAMONKEE -- sheet 2, four more moves for a tactics game. Rows: Fire Bolt (6: his regular blow at range: he snaps the giant claw shut toward a foe and a small spark of fire flicks out from its tip; draw the spark small); Social Distancing (6: he spins once on the spot with the claw and the free arm flung out wide, a ring of rushing air bursting out round him at knee height, then strikes a pose; no foes drawn); Hot Take (4: a quick indignant claw-snap at a foe in front of him, a burst of sparks off the pincers, his face scowling); Going Viral (8: he holds the giant claw high and shakes it as if it were buzzing, then flings it forward with a flourish and points; no fire drawn, the game adds it).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background. Top left: one large portrait. Below: labelled rows of frames, every frame in side view facing left so the claw arm is nearest the viewer, numbered under each frame. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.

GOOSE, SHEET 1 -- attach `dev/visions/Goose/Goose1.jpg` (his drawing, 10-06). He is the Heals of the four: a sling for his regular blow, his heals cast with a jump (Griz: *"Goose is small and should bounce around on idle and jump up to cast"*). Small: the game draws him smaller than the others (a scale under 1 on his look, set when he is cut), so draw him at the same scale as any sheet; it is the game that shrinks him. When it comes back it goes in `deep16/_src/goose_grok_1.<ext>`, a cutter `tools/goose-sheet.py` by `tools/denny-sheet.py`'s pattern (turnaround -> idle by facing; Idle -> idle; Hop -> walk; Sling -> attack; Cast -> cast; Honk -> honk; Climb -> climb; Flinch -> flinch; Fall -> hurt; Prone -> prone), then his build in `deep16/js/mpmon.js` (the Heals subclass is drafted there, `MP.SUBS.heals`).

Attached: a drawing of Goose, a lobstamonkee. Draw him as a pixel-art character, keeping every feature and the drawing's greys: a small crouching monkey-like body with shaggy charcoal-black fur, slate grey on the arms and legs, long thin arms ending in grasping clawed hands, a bald domed head veined like a skull, two pale hollow round eyes, a grey whiskery beard round the mouth, two very long thin feelers sweeping straight out sideways from his mouth and hooking up at the tips, short bent legs, and a long tail curled at the end. Eerie, a little Lovecraftian, but friendly in how he moves.

HEAD: GOOSE THE LOBSTAMONKEE -- sheet 1, his moves for a tactics game. He is small and springy and never stands still. Rows: Idle (6: bouncing up and down on the spot on his bent legs, the feelers bobbing with each bounce, the tail curling and uncurling); Hop (8: travelling in little bouncing hops, the long arms swinging, the tail held out behind for balance); Sling (6: his regular blow: he whirls a sling over his head in one hand and lets fly forward, then follows through; the stone small); Cast (6: he crouches low, springs straight up into the air with both arms raised high over his head and the clawed hands spread wide, a soft glow between the hands at the top of the jump, then lands back in a crouch); Honk (4: he thrusts his head forward with his mouth wide open and the feelers flaring out, a loud honk); Climb (6: climbing straight up an unseen wall with the clawed hands, the feet and the tail; do not draw the wall); Flinch (4: struck, he jolts back with his eyes squeezed shut and the feelers whipping, then recovers); Fall (6: knocked out, he topples over and lies curled on his side, the feelers limp; the last frame lies on the ground); Prone (2: knocked flat but alive and struggling: lying on the ground, then bouncing back up).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, every frame in side view facing right, numbered under each frame. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.

### Goose and Rascal from the front and from behind (added 10-07, the MPMon seat; IN HAND 10-07)

**All five came back 10-07** (GPT, so `deep16/_src/goose_gpt_3..5.png` and `rascal_gpt_4..5.png`, not the grok names below) and are cut: Goose's S and N rows and his `grouphug` and `lifeline` in `goose_p1` (`tools/goose-sheet.py`, the specs in `tools/goose-fronts-spec.py`; GPT drew him lighter and warmer, each channel brought to his first sheets' charcoal), Rascal's S and N rows in `rascal_p2` (`tools/rascal-sheet-p2.py` sheets 4 and 5; his climb from behind its first five of six, to match the side climb's five).

Griz, 10-07: *"can you give me the copy pasta for the animation sheets that would round out goose and rascal better - they need norths and souths and ...?"* Every sheet so far drew them side-on only, so facing S and N on the grid they play their side rows (Denny's and Beholda's the same, ruled fine for them: *"fine enough, plenty else to do"*). These four ask for each move that is aimed at someone or walks somewhere, from the front (facing S) and from behind (facing N). **The seat's calls, his to overrule:** the bow, the dance and the spin (Social Sharing, Social Flame, Social Distancing) are left side-on -- they read from any side; Fall and Prone are left side-on -- a body on the floor reads from any side; Climb is asked from behind only (a wall is climbed facing it). No portrait and no turnaround on these: rows only, so the rows get the room. When they come back: `deep16/_src/goose_grok_4.png` (front) and `goose_grok_5.png` (behind), `rascal_grok_5.png` (front) and `rascal_grok_6.png` (behind); the cutters (`tools/goose-sheet.py`, `tools/rascal-sheet-p2.py`) take the front rows for facing S and the behind rows for facing N, the diagonals keeping the side rows; the scale by the same measure as now (Goose's torso, Rascal's hat brim).

GOOSE, SHEET 3 (from the front) -- attach `dev/visions/Goose/Goose3.png` (the sheet his turnaround and idle came from):

Attached: Goose's sprite sheet. Draw him again exactly: the same character, the same pixel style, the same colours, the same size as the attached sheet's turnaround. A small crouching monkey-like body with shaggy charcoal-black fur, slate grey on the arms and legs, long thin arms ending in grasping clawed hands, a bald domed head veined like a skull, two pale hollow round eyes, a grey whiskery beard round the mouth, two very long thin feelers sweeping straight out sideways from his mouth and hooking up at the tips, short bent legs, and a long tail curled at the end. Eerie, a little Lovecraftian, but friendly in how he moves.

HEAD: GOOSE THE LOBSTAMONKEE -- sheet 3, his moves seen from the FRONT, for a tactics game: in every frame he faces the viewer, as the turnaround's Front view does. Rows: Idle (6: bouncing up and down on the spot on his bent legs, the feelers bobbing with each bounce, the tail curling and uncurling behind him); Hop (8: travelling toward the viewer in little bouncing hops, the long arms swinging, the feelers bouncing); Sling (6: he whirls a sling over his head in one hand and lets fly toward the viewer, then follows through; the stone small); Cast (6: he crouches low, springs straight up with both arms raised high over his head and the clawed hands spread wide, a soft GREEN glow between the hands at the top of the jump, then lands back in a crouch); Honk (4: he thrusts his head toward the viewer with his mouth wide open and the feelers flaring out to both sides, a loud honk); Flinch (4: struck, he jolts back with his eyes squeezed shut and the feelers whipping, then recovers).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). Labelled rows of frames, every frame facing the viewer, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row and the same as the attached turnaround, feet on one baseline. No portrait and no turnaround: the rows only. No scenery.

GOOSE, SHEET 4 (from behind) -- attach `dev/visions/Goose/Goose3.png`:

Attached: Goose's sprite sheet. Draw him again exactly: the same character, the same pixel style, the same colours, the same size as the attached sheet's turnaround. A small crouching monkey-like body with shaggy charcoal-black fur, slate grey on the arms and legs, long thin arms ending in grasping clawed hands, a bald domed head veined like a skull, two pale hollow round eyes, a grey whiskery beard round the mouth, two very long thin feelers sweeping straight out sideways from his mouth and hooking up at the tips, short bent legs, and a long tail curled at the end. Eerie, a little Lovecraftian, but friendly in how he moves.

HEAD: GOOSE THE LOBSTAMONKEE -- sheet 4, his moves seen from BEHIND, for a tactics game: in every frame his back is to the viewer and he faces away, as the turnaround's Back view does (the back of his veined head, the feelers' tips showing out to both sides, the tail toward the viewer). Rows: Idle (6: bouncing up and down on the spot, the feelers bobbing, the tail curling and uncurling); Hop (8: travelling away from the viewer in little bouncing hops, the long arms swinging, the tail held out for balance); Sling (6: he whirls a sling over his head and lets fly away from the viewer, then follows through; the stone small); Cast (6: he crouches low, springs straight up with both arms raised high over his head and the clawed hands spread wide, a soft GREEN glow between the hands at the top of the jump, then lands back in a crouch); Honk (4: he thrusts his head forward, away from the viewer, the feelers flaring out to both sides, a loud honk); Flinch (4: struck, he jolts with the feelers whipping, then recovers); Climb (6: climbing straight up an unseen wall in front of him, seen from behind, with the clawed hands, the feet and the tail; do not draw the wall).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). Labelled rows of frames, every frame seen from behind, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row and the same as the attached turnaround, feet on one baseline. No portrait and no turnaround: the rows only. No scenery.

RASCAL, SHEET 4 (from the front) -- attach `dev/visions/Rascal/Rascal the Lobstamonkee Sprite Sheet1.png` (sheet 1 redone: the felt's face, the charcoal hat):

Attached: Rascal's sprite sheet. Draw him again exactly: the same character, the same pixel style, the same colours, the same size as the attached sheet's turnaround. A round fuzzy bright orange body, a big domed head with a bright red face, two big black bead eyes each ringed in yellow, yellow lines running from under the eyes down to an orange muzzle, two long thin orange wire antennae arching out from the sides of his head and hooking at the ends, two thick orange whisker-tentacles curling out from his MOUTH with hooked yellow tips (they never cross the hat), a charcoal-grey felt cowboy hat with a red rope band, his RIGHT arm one giant lobster claw as long as his body, banded yellow, orange and black, with two fat red-tipped pincers, his LEFT arm a thin furry orange arm with a three-fingered hand, short bent furry orange legs with three-toed feet, and a long thin lobster tail banded red and black with an orange tip. No clothes but the hat.

HEAD: RASCAL THE LOBSTAMONKEE -- sheet 4, his moves seen from the FRONT, for a tactics game: in every frame he faces the viewer, as the turnaround's Front view does, so the giant claw (his RIGHT arm) is on the viewer's LEFT. Rows: Idle (4: standing on the spot, breathing, the claw resting low, the antennae swaying); Walk (8: a scuttling walk toward the viewer on the short bent legs, the claw held up in front); Pinch (6: his blow up close: the giant claw swings up and snaps shut toward the viewer, then draws back); Fire Bolt (6: he snaps the giant claw shut toward the viewer and a small spark of fire flicks out from its tip; draw the spark small); Hot Take (4: a quick indignant claw-snap toward the viewer, a burst of sparks off the pincers, his face scowling); Going Viral (8: he holds the giant claw high and shakes it as if it were buzzing, then flings it forward toward the viewer with a flourish and points; no fire drawn, the game adds it); Flinch (4: struck, he jolts back with his eyes squeezed shut and the antennae whipping, then recovers).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). Labelled rows of frames, every frame facing the viewer, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row and the same as the attached turnaround, feet on one baseline. No portrait and no turnaround: the rows only. No scenery except what a row names.

RASCAL, SHEET 5 (from behind) -- attach `dev/visions/Rascal/Rascal the Lobstamonkee Sprite Sheet1.png`:

Attached: Rascal's sprite sheet. Draw him again exactly: the same character, the same pixel style, the same colours, the same size as the attached sheet's turnaround. A round fuzzy bright orange body, a big domed head with a bright red face, two big black bead eyes each ringed in yellow, yellow lines running from under the eyes down to an orange muzzle, two long thin orange wire antennae arching out from the sides of his head and hooking at the ends, two thick orange whisker-tentacles curling out from his MOUTH with hooked yellow tips (they never cross the hat), a charcoal-grey felt cowboy hat with a red rope band, his RIGHT arm one giant lobster claw as long as his body, banded yellow, orange and black, with two fat red-tipped pincers, his LEFT arm a thin furry orange arm with a three-fingered hand, short bent furry orange legs with three-toed feet, and a long thin lobster tail banded red and black with an orange tip. No clothes but the hat.

HEAD: RASCAL THE LOBSTAMONKEE -- sheet 5, his moves seen from BEHIND, for a tactics game: in every frame his back is to the viewer and he faces away, as the turnaround's Back view does (the hat's crown and brim from behind, the antennae arching out to both sides, the tail toward the viewer), so the giant claw (his RIGHT arm) is on the viewer's RIGHT. Rows: Idle (4: standing on the spot, breathing, the claw resting low, the antennae swaying); Walk (8: a scuttling walk away from the viewer, the claw held up in front of him, the tail trailing toward the viewer); Pinch (6: the giant claw swings up and snaps shut away from the viewer, then draws back); Fire Bolt (6: he snaps the giant claw shut away from the viewer and a small spark of fire flicks out from its tip; draw the spark small); Hot Take (4: a quick indignant claw-snap away from the viewer, a burst of sparks off the pincers); Going Viral (8: he holds the giant claw high and shakes it as if it were buzzing, then flings it forward, away from the viewer, with a flourish and points; no fire drawn, the game adds it); Flinch (4: struck, he jolts with the antennae whipping, then recovers); Climb (6: climbing straight up an unseen wall in front of him, seen from behind, with the claw, the hand, the feet and the tail; do not draw the wall).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). Labelled rows of frames, every frame seen from behind, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row and the same as the attached turnaround, feet on one baseline. No portrait and no turnaround: the rows only. No scenery except what a row names.

GOOSE, SHEET 5 (optional, the "and": his heals told apart, side view; back as `deep16/_src/goose_grok_6.png`) -- today every heal of his plays the one Cast jump (Heart to Heart, Group Hug, Fountain, Not Today, Lifeline); two rows would let the biggest two read as themselves. Attach `dev/visions/Goose/Goose3.png`, the same reference paragraph as sheet 3, then:

HEAD: GOOSE THE LOBSTAMONKEE -- sheet 5, two heals for a tactics game, every frame in side view facing right. Rows: Group Hug (6: he flings both long arms out wide, a ring of soft GREEN light spreading round him at the floor, then wraps his arms round an armful of air and squeezes, smiling); Lifeline (6: he draws a thin glowing GREEN thread out of his own chest with one clawed hand and throws its end out to the side, where it hangs in the air, still tied to him).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). Labelled rows of frames, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row and the same as the attached turnaround, feet on one baseline. No portrait and no turnaround: the rows only. No scenery except what a row names.

### Props wanted (things on the grid, not creatures; added 10-06)

Griz, 10-06, on the Wet's deep station in his situations ear file: *"Can find at a glance. All 3 are very very 2D, particularly the lantern"* -- then *"please also add to art wanted"*. Today the three are drawn in code as flat rectangles, front-on (`deep16/js/wet.js` `W.layCrate`, `W.layBucket`, `W.layLamp`): they read as stickers on the grid's diamond floor.

| prop | where | today | what it wants |
|---|---|---|---|
| the crate | the Wet's deep station, the grid's (5, 30) (the 8-bit's crate at (13, 5)) | a brown box, its front face only | a plain wooden crate in the grid's isometric view: a top and two sides, the planks and a nailed cross |
| the bucket | on the crate while it lies; carried after | staves, two hoops and a rope handle, front-on (half again as big since 10-04) | a wooden bucket in the same view: a round mouth, dark inside, iron hoops round it, the rope handle |
| the lamp on its post | the grid's (3, 30) since 10-06 (it was (5, 29)) | an iron cage on a post, one face, gold glass | an iron cage lantern hung from the arm of a wooden post, lit: the cage in the round, warm gold glass, the flame flickering |

Any one of three ways: a free model with a .blend through pipeline 1b, rendered at the grid's camera (`deep16/blender-monsters.md`); a generated props sheet from the head below, one frame each (the lamp's flame 2-4 frames); or the seat redraws them in code as boxes and cylinders on the grid's own projection, as the bugs were drawn (no generator needed).

HEAD: PROPS, THE DEEP STATION -- a mine's working station in the dark. Three props, each alone: a plain wooden crate with a nailed cross on its sides; an empty wooden bucket with two iron hoops and a rope handle; an iron cage lantern hanging from the arm of a wooden post, lit with a warm gold light (the lantern again in three more frames, its flame flickering).

PROPS TAIL (paste after the props head, in place of the COMMON TAIL): 16-bit pixel art props, SNES-era, crisp dark outline, readable at small size. Isometric view from above at three-quarters, the floor tiles diamonds twice as wide as they are tall; light from the upper left. Flat dark navy background. Each prop alone with clear space around it, one scale for all, each standing on one floor diamond (the crate fills most of one, the bucket about half, the post as tall as a standing man). No characters, no labels on the props.

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
| ~~the garrison of Sólskaft: the Trooper and the Drill-sergeant (the Skylights; 10-05)~~ DONE 10-05 | LPC-composed as the 8-bit's dwarves: the troopers on `trooper_p0` (09-27), the sergeant on `drillsergeant_p0` (`tools/lpc-compose.py drillsergeant_full`, squashed, pixelated) | (Griz: "LPC the pop-op dwarves more like the NPC dwarves instead of Duergar") |
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

---
title: DEEP16 art wanted -- paste-ready, one block an image
updated: 2026-10-08 (Code tab) -- split on Griz's word ("shouldn't we have (a better titled) art_we_used_to_want.md or something, such that deep16-art-wanted can just be copypasta to throw in the image gen as I can?" -- "The split will be a thing"): only what is still wanted, each as a whole block; a head written for every creature that had none (a GPT read of the old file found heads and tails missing). Earlier 10-08: the stirge's and the fire beetle's hurt from the front and behind, and the bugbear chief's Morningstar 2, IN HAND from his GPT sheets (*"In for /deep16/art wanted"*); the centipede's the same day (`3a3f0e1`). Everything that came back, and every old paste kept for a re-roll, is `deep16-art-in-hand.md`.
how: copy one fenced block, paste it into the generator, one image a block. Where a block says ATTACH, attach that image first. Drop what comes back in the repo root and say which one it is; the seat files it in `deep16/_src/` and cuts it (pipeline 2: a `tools/<creature>-sheet.py` over `tools/sheetrows.py`). When it is cut -- or ruled not wanted -- its block moves to `deep16-art-in-hand.md` with the date and the commit. Nothing is deleted.
---

# DEEP16 art wanted

Nothing here blocks a fight: every one of these plays today on a stand-in. These are looks, not needs. A free print model with a .blend can stand in for any creature sheet below (pipeline 1b, `deep16/blender-monsters.md`).

## 1. Creatures still on a stand-in (one sheet each)

Worst fit first. Each block is a creature's first sheet: its side rows with a portrait and a turnaround (facing S and N it plays the side rows until a front and a back sheet come). The row names are the ones the grid plays; the line under each block is for the seat that cuts it.

### The gelatinous cube (today: the green Slime)

```text
HEAD: THE GELATINOUS CUBE -- a foe for a tactics game. A ten-foot cube of clear, faintly teal jelly, almost invisible, its edges and corners catching the light; inside it hang the things it has swallowed and not yet dissolved: a few bones, a rusted sword, a scatter of coins, an old boot. No face, no eyes, no limbs. Rows: Idle (6: it quivers in place, the things inside drifting slowly); Slide (8: it slides forward along the ground, its whole body wobbling, the things inside lagging behind); Engulf (8: its front face bulges out and surges forward over a space as big as a man, then closes and draws back in, swollen -- do not draw what it takes); Digest (6: the jelly churns and bubbles inside it, the things it holds spinning slowly); Flinch (4: struck, it wobbles hard and dents where the blow landed, then firms again); Fall (6: it loses its corners, sags and spreads into a wide shining puddle, the things inside spilling out onto the floor; the last frame lies flat on the ground).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, the bottom of every frame on one baseline. No scenery except what a row names.
```
Cut as: Idle -> idle, Slide -> walk, Engulf -> `engulf`, Digest -> `digest`, Flinch -> flinch, Fall -> hurt. No prone (SRD: immune). Large.

### The ochre jelly (today: the green Slime)

```text
HEAD: THE OCHRE JELLY -- a foe for a tactics game. A spreading mound of thick yellow-ochre jelly, glistening, deep amber where it is thickest and pale where it thins, streaked with brown. No face, no eyes, no limbs. Rows: Idle (6: it quivers and slowly heaves); Ooze (8: it flows forward along the ground, its front edge rolling over itself); Pseudopod (6: a thick arm of jelly lashes out from its body at a foe in front of it and slaps down, then draws back in); Climb (6: it flows straight up an unseen wall, flattened against it; do not draw the wall); Flinch (4: struck, it splashes and caves in where the blow landed, then fills back out); Fall (6: it loses its shape and spreads flat into a thin stain; the last frame a flat smear on the ground).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, the bottom of every frame on one baseline. No scenery except what a row names.
```
Cut as: Ooze -> walk, Pseudopod -> `pseudopod`, Climb -> climb, Fall -> hurt; the halves of its Split wear the same sheet smaller (`ochrejellym_p1`). No prone (immune). Large.

### The gray ooze (today: the green Slime)

```text
HEAD: THE GRAY OOZE -- a foe for a tactics game. A low, thick mass of oily grey slime the colour of wet slate, easily taken for a puddle or a wet rock on a stone floor; a dull sheen across its top; it can gather itself up into a mound and a thick reaching arm. No face, no eyes, no limbs. Rows: Idle (6: lying flat and still, a slow ripple crossing it); Ooze (8: it slides forward, thin and low to the ground); Pseudopod (6: it suddenly rears a thick grey arm up out of the pool and slams it down on a foe in front of it, then sinks flat again); Climb (6: it slides straight up an unseen wall, flattened against it; do not draw the wall); Flinch (4: struck, it splashes apart where the blow landed, then runs back together); Fall (6: it thins out and dries into a dull grey stain; the last frame a flat stain on the ground).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, the bottom of every frame on one baseline. No scenery except what a row names.
```
Cut as: Ooze -> walk, Pseudopod -> `pseudopod`, Climb -> climb, Fall -> hurt. No prone (immune). Medium.

### The black pudding (today: the green Slime)

```text
HEAD: THE BLACK PUDDING -- a foe for a tactics game. A heaving heap of glossy black slime that flows like hot tar, never solid: it sags, spreads and runs, a dull purple sheen where the light catches its curves, drips running down it and slow bubbles breaking on its skin. No face, no eyes, no limbs. Rows: Idle (6: it heaves and settles, a bubble swelling and bursting); Ooze (8: it rolls forward along the ground, its front edge folding over itself); Pseudopod (6: a thick black arm of slime whips out and smashes down on a foe in front of it, the floor smoking where it lands, then draws back in); Climb (6: it flows straight up an unseen wall, flattened against it; do not draw the wall); Flinch (4: struck, it splashes and caves in where the blow landed, then swells back); Fall (6: it collapses and spreads flat into a black puddle; the last frame a flat smear on the ground).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, the bottom of every frame on one baseline. No scenery except what a row names.
```
Cut as: Ooze -> walk, Pseudopod -> `pseudopod`, Climb -> climb, Fall -> hurt; Split's halves `puddingm_p1`. No prone (immune). Large.

### The gibbering mouther (today: the Pink Blob)

```text
HEAD: THE GIBBERING MOUTHER -- a foe for a tactics game. A heaving mound of soft pink-brown flesh like risen dough, covered all over in mouths and eyes scattered unevenly across it, with no single face anywhere: dozens of mouths of every kind and size, some human, some distorted, some ringed with crooked teeth and some toothless, all moving as if babbling, and pale eyes of different sizes that open and close at random. Rows: Idle (6: it pulses and heaves, the eyes blinking and rolling, the mouths babbling); Ooze (8: it drags itself forward like a slug, its flesh rippling); Bites (6: several mouths stretch out from its body on fleshy stalks and snap at a foe in front of it, then pull back in); Spittle (6: one mouth rears up on a stalk and spits a glob that bursts in a blinding white flash in front of it); Flinch (4: struck, it shudders all over, every eye squeezing shut, then ripples back); Fall (6: it sags and spreads flat, the eyes closing one by one; the last frame a still heap on the ground).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, the bottom of every frame on one baseline. No scenery except what a row names.
```
Cut as: Ooze -> walk, Bites -> `bites`, Spittle -> `spittle` (new: ANIM_ORDER, FPS, the play-once rule, and its Blinding Spittle set to play it), Fall -> hurt. No prone (SRD: immune). Medium.

### The earth elemental (today: the Blue Demon)

```text
HEAD: THE EARTH ELEMENTAL -- a foe for a tactics game. A hulking giant of living rock and earth, twice a man's height and roughly man-shaped: great boulder shoulders, a small stone head with two amber eyes glowing deep in its cracks, thick arms ending in fists of stone, its legs spreading into heaps of rubble where they meet the ground; clods of earth and pebbles fall from it as it moves. Rows: Idle (6: standing heavy and still, stones grinding, a trickle of dirt falling); Walk (8: a slow heavy stride, dust shaking off it with each step); Slam (6: one stone fist swings down on a foe in front of it); Slam 2 (6: its second blow in the same breath: the other fist swings across from the other side); Sink (6: it sinks straight down below the baseline as if into water, as if the floor were there, until nothing is left; the last frame is empty -- draw no floor); Rise (6: it rises up from below the baseline, head first, and stands; draw no floor); Flinch (4: struck, chips of stone fly off it and it rocks back, then steadies); Fall (6: it crumbles into a heap of rubble; the last frame a pile of rocks); Prone (2: knocked flat but alive: toppled onto its back, then heaving itself up on one fist).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.
```
Cut as: Slam -> `slam`, Slam 2 -> `slam2`, Sink -> `burrow` (Earth Glide: its last frame, empty, is what shows while it is under), Rise -> `reveal`, Fall -> hurt, Prone -> prone. Large.

### The ettin (today: the Orc Skull)

```text
HEAD: THE ETTIN -- a foe for a tactics game. A hulking two-headed giant twice a man's height, filthy and brutish: ONE giant body with two arms and two legs, and two separate heads, each on its own thick neck, side by side at the shoulders, each with its own scraggly hair and tusked underbite, one scowling and one leering; dirty patched hide armour, bare thick arms; a heavy battleaxe in its right hand and a spiked morningstar in its left. Rows: Idle (6: the two heads turn and snarl at each other, then both glare forward); Walk (8: a heavy lumbering stride, both weapons swinging); Battleaxe (6: the right arm chops the battleaxe down on a foe in front of it, then back); Morningstar (6: the left arm swings the morningstar across at a foe in front of it, then back); Flinch (4: struck, it rocks back with both heads roaring, then steadies); Fall (6: knocked out from STANDING: frame 1 on its feet and reeling, frame 2 tipping backward, frame 3 falling, frames 4 to 6 hitting the ground and lying flat on its back, both weapons dropped beside it); Prone (2: knocked flat but alive: lying on its side, then pushing itself up on one arm).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.
```
Cut as: Battleaxe -> `battleaxe`, Morningstar -> `morningstar` (its Multiattack swings both, in that order), Fall -> hurt, Prone -> prone. Large.

### The ogre (today: the Orc)

```text
HEAD: THE OGRE -- a foe for a tactics game. A huge hulking brute twice a man's height, fat-bellied and heavy-limbed, with dull yellow-brown skin, a heavy brow over small piggy eyes, a jutting jaw of snaggle teeth and lank dark hair; ragged hides and a fur loincloth; a huge rough wooden greatclub in its right hand, two javelins slung across its back. Rows: Idle (6: standing slack-jawed, scratching, the greatclub resting on its shoulder); Walk (8: a heavy plodding stride, the greatclub swinging); Greatclub (6: it heaves the greatclub up over its shoulder and brings it smashing down on a foe in front of it, then back); Javelin (6: it pulls a javelin from its back and hurls it overhand; draw no javelin in flight -- the last frame shows the empty hand following through); Flinch (4: struck, it rocks back with a bellow, then steadies); Fall (6: knocked out from STANDING: frame 1 on its feet and reeling, frame 2 tipping backward, frame 3 falling, frames 4 to 6 hitting the ground and lying flat on its back, the greatclub dropped beside it); Prone (2: knocked flat but alive: lying on its side, then pushing itself up on one arm).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.
```
Cut as: Greatclub -> `greatclub`, Javelin -> `javelin` (with its `release` frame, the goblin's shortbow's way), Fall -> hurt, Prone -> prone. Large.

### The spirit naga (today: a snake, `Snake_Angry`)

```text
HEAD: THE SPIRIT NAGA -- a foe for a tactics game. A great serpent whose head has a human face: all serpent, a long body of black scales banded with dull red, and at its end a head with a gaunt man's face, sunken cheeks, burning red eyes and long lank black hair, and in its man's mouth a serpent's long venomous fangs -- no human torso, no arms, no hands. Malevolent and patient; it casts spells. Rows: Idle (6: coiled, its upper body raised and swaying, the head turning slowly); Slither (8: gliding forward in S-curves, the head held high); Bite (6: it draws its head back, its man's mouth gaping wide on the long fangs, and strikes forward at a foe in front of it, then recoils); Cast (6: it rears up high, its eyes flare red and a dark violet light gathers round its head, then fades); Flinch (4: struck, it recoils with a hiss, then steadies); Fall (6: it collapses, its coils slumping to the ground, the head falling last; the last frame lies on the ground); Prone (2: knocked flat but alive: its coils sprawled flat on the ground, then rearing up again).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, the bottom of every frame on one baseline. No scenery except what a row names.
```
Cut as: Slither -> walk, Bite -> `bite`, Cast -> cast (its SRD spells), Fall -> hurt, Prone -> prone. Large.

### The grimlock (today: the Ninja)

```text
HEAD: THE GRIMLOCK -- a foe for a tactics game. A stocky, muscular grey-skinned humanoid with no eyes at all: smooth skin where the eyes should be, a broad flat nose, a wide mouth of jagged teeth, pointed ears, long matted black hair; a ragged loincloth and a few bone trinkets on cords; a crude club of bone studded with sharp bone spikes in its right hand. It moves with its head cocked, listening and sniffing. Rows: Idle (6: crouched, its head cocked to one side, sniffing and listening); Walk (8: a stooped, quiet prowl); Spiked Bone Club (6: a vicious overhand blow at a foe in front of it, then back); Lurk (4: pressed flat and still against an unseen rock wall, grey against grey, only its head turning slightly; do not draw the wall); Flinch (4: struck, it jolts back with a hiss, then steadies); Fall (6: knocked out, it topples backward and lies flat on its back, the club dropped beside it; the last frame lies on the ground); Prone (2: knocked flat but alive: lying on the ground, then pushing itself up).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.
```
Cut as: Spiked Bone Club -> `spikedboneclub` and `attack`, Lurk -> `still` (it starts hidden: Stone Camouflage), Fall -> hurt, Prone -> prone. Medium.

### The axe beak (today: the Birb)

```text
HEAD: THE AXE BEAK -- a foe for a tactics game. A tall flightless bird the size of a horse: long powerful legs with big clawed feet, a long neck, stubby useless wings, shaggy brown feathers, and a huge, heavy wedge-shaped beak, yellow-orange, with a sharp cutting edge (a beak, not a blade). Rows: Idle (6: shifting from foot to foot, its head bobbing, its beak clacking); Run (8: a fast long-legged run, the neck stretched out forward); Beak (6: it rears its head back and chops its heavy beak down on a foe in front of it, then back); Flinch (4: struck, it squawks and jerks back, feathers flying, then steadies); Fall (6: it crashes over onto its side, its legs folding; the last frame lies on the ground); Prone (2: knocked flat but alive: on its side with its legs kicking, then scrambling up).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.
```
Cut as: Run -> walk, Beak -> `beak`, Fall -> hurt, Prone -> prone. Large.

### The darkmantle (today: the Glub, hand-built)

```text
HEAD: THE DARKMANTLE -- a foe for a tactics game. A small squid-like cave creature: a dark purple-grey conical mantle, pointed at the top like a stalactite, two small gold eyes near its base, and below them a ring of tentacles long enough to wrap a man's head, joined by a web of skin that spreads wide like a skirt and wraps round what it drops on. In the dark it hangs from cave ceilings looking like a stalactite. It flies by rippling its skirt. Rows: Idle (6: hovering in the air, its webbed skirt rippling slowly); Fly (8: gliding forward through the air, the skirt pulsing); Crush (6: it drops down, spreads its skirt wide and clamps it shut round empty air in front of it, squeezing -- do not draw the foe); Darkness (6: it pulses and a ring of pitch-black darkness blooms out round it, then holds); Flinch (4: struck, it jerks back with its skirt snapping shut, then spreads again); Fall (6: it drops to the floor and goes limp, the skirt spread flat; the last frame lies on the ground); Prone (2: knocked flat but alive: lying on the ground with the skirt sprawled, then lifting back into the air).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row; every frame in the air at the same height above one baseline, but Fall and Prone on the ground. No scenery except what a row names.
```
Cut as: Fly -> walk, Crush -> `crush` (it attaches and rides, `deep16/js/battle.js`), Darkness -> `darkness` (new: its Darkness Aura, `deep16/js/magic.js` castAura, plays no row today), Fall -> hurt, Prone -> prone. Small.

### The water elemental (not a foe yet)

RULED 10-04 (Griz: *"we're staying as close to the SRD as we can, immunity and a sheet"*): a foe of its own with the SRD's condition immunities and its own sheet. Nothing plays this until the foe is built.

```text
HEAD: THE WATER ELEMENTAL -- a foe for a tactics game. A churning column of living water twice a man's height: a rough head and two heavy arms of surging water rising out of a rolling wave at its base, clear blue-green, white foam at its edges, bubbles drifting inside it. It has no legs: it rolls on its wave. Rows: Idle (6: surging and churning in place, foam curling at its edges); Move (8: it rolls forward on its wave, leaning into the motion); Slam (6: a heavy arm of water rises and crashes down on a foe in front of it, spraying, then reforms); Whelm (8: it rears up tall and crashes forward over a space as big as a man, closing round it, then holds, swollen, as if something is inside it -- do not draw what it holds); Flinch (4: struck, it splashes apart at the blow and pulls back together); Fall (6: it loses its shape and collapses into a spreading pool; the last frame a flat puddle on the ground).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, the bottom of every frame on one baseline. No scenery except what a row names.
```
Cut as: Move -> walk, Slam -> `slam` (and `slam2`), Whelm -> `whelm` (new, wired with its foe), Fall -> hurt. No prone (SRD: immune). Large.

## 2. The townsfolk of Fountain Street (a look, no fight; today: the crewman's, the thug's, the bandit's and the brawler's sheets)

The Skylights' walk-in (10-05): the street's people running from the trolls (`deep16/js/battle.js` townsfolk).

```text
HEAD: THE TOWNSFOLK -- three plain people of a mountain town for a tactics game, each drawn on their own rows: a man in a work shirt, a leather apron and boots; a woman in a long skirt with a shawl over her shoulders; a child of about eight in a smock. Ordinary, unarmed, frightened. Rows, for each of the three in turn, the row's name saying whose it is: Idle (4: standing, glancing about nervously); Run (8: running for their life, arms pumping, looking back over a shoulder).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE sheet only, filling the whole image: no other panels, no portraits, no turnarounds, no title. Labelled rows of frames, each row's name at its left, every frame in side view facing right, numbered 1 to N under each frame -- every number used once, none skipped, one drawing for each number. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The man, the woman and the child at their true heights against each other, feet on one baseline. No scenery.
```
Cut as: three sheets, each Idle -> idle, Run -> walk; `deep16/js/battle.js` townsfolk takes them in turn in place of the four men's.

## 3. Prone rows for looks in hand (one row each)

Today a figure without a prone frame stands while prone (`deep16/js/sprites.js` S.proneFrame). Each block asks for the one row; attach the sheet named, so it is drawn to match.

### The chuul
ATTACH `deep16/_src/chuul_grok_1.webp`
```text
Attached: the chuul's sprite sheet. Draw it again exactly: the same creature, the same pixel style, the same colours, the same size as its frames in the attached sheet. A hulking lobster-like creature with two great pincers and a cluster of tentacles round its mouth.

HEAD: THE CHUUL -- one more row for a tactics game, in side view facing right. Rows: Prone (2: knocked flat but alive and struggling: flipped onto its back with its legs and pincers waving, then rolling back onto its legs).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE row only: no portrait, no turnaround, no title, no other panels. The row's name at its left, its frames numbered under each one -- every number used once, one drawing for each number -- every frame apart from its neighbour. Drawn at exactly the size of the attached sheet's frames, not larger. No scenery.
```

### The crawler (the Warrens' herd)
ATTACH `deep16/_src/crawler_grok_1.webp`
```text
Attached: the crawler's sprite sheet. Draw it again exactly: the same creature, the same pixel style, the same colours, the same size as its frames in the attached sheet. A long many-legged crawling worm with a cluster of long tentacles round its mouth.

HEAD: THE CRAWLER -- one more row for a tactics game, in side view facing right. Rows: Prone (2: knocked flat but alive and struggling: flipped onto its back with its many legs waving, then twisting back over onto its legs).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE row only: no portrait, no turnaround, no title, no other panels. The row's name at its left, its frames numbered under each one -- every number used once, one drawing for each number -- every frame apart from its neighbour. Drawn at exactly the size of the attached sheet's frames, not larger. No scenery.
```

### The ettercap
ATTACH `deep16/_src/ettercap_grok_1.png`
```text
Attached: the ettercap's sprite sheet. Draw it again exactly: the same creature, the same pixel style, the same colours, the same size as its frames in the attached sheet. A hunched spider-like humanoid with long clawed arms and a fanged mouth.

HEAD: THE ETTERCAP -- one more row for a tactics game, in side view facing right. Rows: Prone (2: knocked flat but alive and struggling: lying on its back, then rolling over and pushing itself up on its claws).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE row only: no portrait, no turnaround, no title, no other panels. The row's name at its left, its frames numbered under each one -- every number used once, one drawing for each number -- every frame apart from its neighbour. Drawn at exactly the size of the attached sheet's frames, not larger. No scenery.
```

### The otyugh (and the landlord, who wears its sheet)
ATTACH `deep16/_src/otyugh_grok_1.webp`
```text
Attached: the otyugh's sprite sheet. Draw it again exactly: the same creature, the same pixel style, the same colours, the same size as its frames in the attached sheet. A bloated round body on three thick legs, a huge toothy mouth, two long grasping tentacles with spiked ends, and a third stalk bearing its eyes.

HEAD: THE OTYUGH -- one more row for a tactics game, in side view facing right. Rows: Prone (2: knocked flat but alive and struggling: tipped over on its side with its tentacles flailing, then righting itself on its three legs).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE row only: no portrait, no turnaround, no title, no other panels. The row's name at its left, its frames numbered under each one -- every number used once, one drawing for each number -- every frame apart from its neighbour. Drawn at exactly the size of the attached sheet's frames, not larger. No scenery.
```

### The bulette
ATTACH `deep16/_src/bulette_grok_1.jpg`
```text
Attached: the bulette's sprite sheet. Draw it again exactly: the same creature, the same pixel style, the same colours, the same size as its frames in the attached sheet. A massive armoured burrowing beast with a crested back, a huge shark-like mouth and short powerful clawed legs.

HEAD: THE BULETTE -- one more row for a tactics game, in side view facing right. Rows: Prone (2: knocked flat but alive and struggling: rolled onto its side with its legs kicking, then heaving itself back onto its feet).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE row only: no portrait, no turnaround, no title, no other panels. The row's name at its left, its frames numbered under each one -- every number used once, one drawing for each number -- every frame apart from its neighbour. Drawn at exactly the size of the attached sheet's frames, not larger. No scenery.
```

### The brown owl (Find Familiar)
ATTACH `deep16/_src/owl_grok_1.jpg`
```text
Attached: the owl's sprite sheet. Draw it again exactly: the same bird, the same pixel style, the same colours, the same size as its frames in the attached sheet. A brown owl.

HEAD: THE OWL -- one more row for a tactics game, in side view facing right. Rows: Prone (2: knocked out of the air but alive: sprawled on the ground with its wings spread flat, then flapping back up off the ground).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE row only: no portrait, no turnaround, no title, no other panels. The row's name at its left, its frames numbered under each one -- every number used once, one drawing for each number -- every frame apart from its neighbour. Drawn at exactly the size of the attached sheet's frames, not larger. No scenery.
```

### The snowy owl (Find Familiar)
ATTACH `deep16/_src/snowyowl_grok_1.jpg`
```text
Attached: the snowy owl's sprite sheet. Draw it again exactly: the same bird, the same pixel style, the same colours, the same size as its frames in the attached sheet. A white snowy owl flecked with dark spots.

HEAD: THE SNOWY OWL -- one more row for a tactics game, in side view facing right. Rows: Prone (2: knocked out of the air but alive: sprawled on the ground with its wings spread flat, then flapping back up off the ground).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE row only: no portrait, no turnaround, no title, no other panels. The row's name at its left, its frames numbered under each one -- every number used once, one drawing for each number -- every frame apart from its neighbour. Drawn at exactly the size of the attached sheet's frames, not larger. No scenery.
```

### The giant boar
ATTACH `deep16/_src/boar_grok_1.webp`
```text
Attached: the giant boar's sprite sheet. Draw it again exactly: the same beast, the same pixel style, the same colours, the same size as its frames in the attached sheet. A huge bristling wild boar with long curved tusks.

HEAD: THE GIANT BOAR -- one more row for a tactics game, in side view facing right. Rows: Prone (2: knocked flat but alive and struggling: on its side with its legs kicking, then scrambling back onto its feet).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE row only: no portrait, no turnaround, no title, no other panels. The row's name at its left, its frames numbered under each one -- every number used once, one drawing for each number -- every frame apart from its neighbour. Drawn at exactly the size of the attached sheet's frames, not larger. No scenery.
```

### The clacker
ATTACH `deep16/_src/clacker_grok_2.jpg`
```text
Attached: the clacker's sprite sheet. Draw it again exactly: the same creature, the same pixel style, the same colours, the same size as its frames in the attached sheet. A tall hunched hook horror with a vulture's beaked head, a plated grey-green hide and a huge curved bone hook for each forearm.

HEAD: THE CLACKER -- one more row for a tactics game, in side view facing right. Rows: Prone (2: knocked flat but alive and struggling: fallen on its side with its hooks scraping the ground, then pushing itself up on one hook).

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background (a deep blue, not grey and not black). ONE row only: no portrait, no turnaround, no title, no other panels. The row's name at its left, its frames numbered under each one -- every number used once, one drawing for each number -- every frame apart from its neighbour. Drawn at exactly the size of the attached sheet's frames, not larger. No scenery.
```

Cut as: Prone -> the sheet's `prone` row (`S.proneRow`), or its frame into `S.PRONE`.

## Not for the generator (the code's own)

- **The will-o'-wisp's Variable Illumination** on screen (bright 5-20 ft; its light field is `tools/wisp-sheet.py`).

## How a sheet should come back

**Special moves before detailed attacks (10-01d).** Griz: *"It's important for us to do the special move ones - like burrow and Earth Glide more than detailed attacks"*. A row for a special move (going under, coming up, a hide's reveal) outranks a second attack row; the grid has the hooks (js/ai.js burrower, still and reveal).

What the cutter needs from a sheet (the gnoll sheets were right): a turnaround of stills (front, right, back, left), then rows of frames all facing right in side view; every frame apart from its neighbours; one scale for the whole sheet. One sheet an image: a file of several sheets came back as one packed image with soft frames (the bugbear, 10-07).

**To add an ask:** copy the nearest block above and change the head; keep its tail whole. A creature's later sheets (from the front, from behind, its tricks) follow the goblin's and the hobgoblin's in `deep16-art-in-hand.md`.

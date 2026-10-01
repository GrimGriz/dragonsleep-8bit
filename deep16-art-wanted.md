---
title: DEEP16 art wanted -- the generated sheets, in order
made: 2026-09-28 (Code tab), for Griz's free GPT / Grok image runs, planned at two a day
updated: 2026-10-01 (Code tab) -- the IN HAND list added at the top, the creatures already in moved off the wanted list (a Cowork seat reading the old file took the landlord for still wanted; it has been on the grid since 09-29), the days renumbered
how: paste a creature's HEAD, then the COMMON TAIL, into the generator. Drop what comes back in the repo root (any name; say which creature) and the seat files it in `deep16/_src/` as `<creature>_grok_N.png` (gitignored: that folder is where the generated sheets live; tester screenshots go in `deep16/_src/tester-feedback/`) and cuts it the chuul's way (pipeline 2: one `tools/<creature>-sheet.py` per creature)
---

# DEEP16 art wanted

**Read IN HAND first.** Everything on it is already cut and fighting on the grid: don't generate it again. A second sheet for one of them (idle variations, special moves) is welcome, never needed.

## IN HAND (on the grid; don't regenerate)

| creature | sheets | cut by | in since |
|---|---|---|---|
| the chuul | 2 | `tools/chuul-sheet.py` | 09-27 |
| the crawler (the Warrens' herd) | 1 | `tools/crawler-sheet.py` | 09-27 |
| the gnolls (and the Snoot's glory-seekers) | 2 | `tools/gnoll-sheet.py` | 09-28 |
| the cloaker (and its close-up) | 3 | `tools/cloaker-sheet.py` | 09-29 |
| the ettercap | 3: the third is the sitting-and-braiding idle, 09-30 (on the grid it braids till it acts or is hurt; on the 8-bit map it sits braiding at the strung end of Web Gulch) | `tools/ettercap-sheet.py` | 09-29, 09-30 |
| **the otyugh -- the landlord** | 1 | `tools/otyugh-sheet.py` | 09-29 |
| the hyena | 2: the second gives the ROFL row (Hideous Laughter) | `tools/hyena-sheet.py` | 09-29, 09-30 |
| the bulette | 2 | `tools/bulette-sheet.py` | 09-29 |
| the owls, brown and snowy (Find Familiar) | 2 each | `tools/owl-sheet.py` | 09-29 |
| the giant boar | 1 of 2 ("WILD BOAR ... (1/2) - MOVEMENT & CORE"; it replaces the stand-in bull that charged backwards) | `tools/boar-sheet.py` | 09-30 |

Still wanted below: seven creatures (the roper first) and the landlord's five pictures, which are stills for the Wet's telepathy, not a sprite sheet.

What the cutter needs from a sheet (the gnoll sheets were right): a turnaround of stills (front, right, back, left), then rows of frames all facing right in side view; every frame apart from its neighbours; one scale for the whole sheet. Colour needn't be exact: every sheet is regraded and snapped to DEEP16's 64 colours. (The boar sheet drew its lower rows smaller than its walk; the cutter evens that out, but one scale is still best.)

---

## COMMON TAIL (paste after every head)

16-bit pixel art animation sheet, SNES-era action RPG style, crisp dark outline, readable at small size. Flat dark navy background. Top left: one large portrait. Beside it a turnaround of four stills labelled Front, Right, Back, Left. Below: labelled rows of frames, every frame in side view facing right, numbered under each frame. Every frame stands apart with clear space around it: nothing overlaps a neighbour or a label. The same scale in every row, feet on one baseline. No scenery except what a row names.

---

The order is the story fights first, worst stand-in first: a creature drawn today as some other model (the roper is a cactus, the xorn a green blob). Two a day. Canon notes are from the wiki and the monster records; the look past them is SRD-plain.

## Day 1

### 1. The roper (the Fork, two fights)

Stands in as a cactus today.

HEAD: ROPER (the stalagmite that eats) -- the Fork. A tall stalagmite of grey stone that is alive: one great yellow eye near the top, a jagged maw near the base, six grey rope-like tendrils coiled against its sides. It creeps on a mass of tiny feet under its base. The first frame of the Idle row looks exactly like a plain stalagmite (the eye shut, the tendrils hidden). Rows: Idle (the eye opening, 8), Creep (8), Lash (tendrils reaching far to the right, 8), Reel In (6), Bite (6), Hurt (6), Death (8).

### 2. The xorn (the highway)

Stands in as a green blob today.

HEAD: XORN -- the highway. A barrel-shaped body of speckled stone flecked with gems, a wide fanged mouth on the top of its head, three clawed arms and three thick legs spaced around it, three eyes between the arms. Rows: Idle (8), Walk (8), Claws (8), Bite (a lunge down with the top mouth, 6), Sink (melts down into the floor, 6), Rise (up out of the floor, 6), Hurt (6), Death (8).

## Day 2

### 3. The grick (the gricks' den)

Stands in as a squid today.

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

## The landlord's pictures (the telepathy in the Wet -- stills, not sheets; asked 09-30g; STILL WANTED)

The landlord's own sheet is in (IN HAND above); these are different. The otyugh speaks in pictures. On the grid each one fills the screen for a few seconds, blown up soft-edged and swaying, the landlord's
eye opening and closing behind it (`deep16/js/wet.js` `W.picture`). Today they are placeholders drawn in code at 96 x 72. Any size will do
(4:3 landscape); drop them in the repo root and say which picture, and the seat swaps them in. The order is the order they are seen: the
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

Spell looks are NOT on this list: the pass draws them in code (and Blender can render a floating weapon), so the generator's days go to creatures.

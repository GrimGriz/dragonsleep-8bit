# Sólskaft as iso roam with floors, and fog of war against the loadings -- a weigh (2026-11-11)

room: solskaft-weigh -- a Claude Code desktop Code tab on ggpc (config echo claude-fable-5-2), door 2026-11-11T07:44Z, started by the lanes desk on Griz's order, verbatim: *"Spin up a fable seat to weigh doing solskaft as iso roam with floors with the build we discussed earlier / Separately, consider fog of war/exploration first-time with regard to iso roam loadings"*. Worktree `.claude/worktrees/solskaft-weigh` off `origin/main` `f4384421`, removed at the close. A WEIGH: no game code edited, nothing built. This file is the only thing landed.

**How to read the cites.** Lines marked plainly (`file:line`) I read myself. Lines marked *(reader)* came from one of three read-only readers I sent through the 8-bit's Sólskaft, the lanes and the roam code; I spot-checked the ones the two SHOULDs lean on and did not re-read the rest. Numbers under "measured" are from a scratch probe of my own (outside the repo, headless Chromium, this PC, three runs agreeing within 10%): they are the bake's cost in a bench browser, not his pane's -- the code's own note has his pane at roughly twice that per square (`deep16/js/battle.js:15`: "a 60x46 2.3 s, a 90x70 5.3 s", 10-04; mine 1.05-1.13 s and 2.5-2.8 s for the same sizes).

---

# REPORT 1 -- Sólskaft as iso roam with floors

## 1.0 The short of it

**Can we: yes, with what is built.** A floor is one map; floors are joined by stairs that are doors; the pipeline that carries the Halfway Inn, Web Gulch and the Glowseep (a seat's own map handed to `M.FLOORS` with `own: true`) carries five floors of Sólskaft with no new engine. **How big: L** for five walkable floors with their people and signs (three seat-sessions, the first of which puts street level under his feet); the story scenes on top are the story build lane's own L. **Should we: yes, iso, one map a floor, street level first** -- with one thing to say out loud: on 10-29 his lean was the other way (*"probably top down for solskaft with iso for the road"*, `deep16/js/mines.js:221`), filed by the desk as "ask him before it binds". Today's order reverses it; question 1 asks him to say so.

## 1.1 How floors work in iso roam today

- **One map a floor, stairs as doors, everywhere.** A roam place is a `D.Battle` whose map is a key into `D16.MAPS` (`deep16/js/roam.js:172-190`); every map is one character and one height a square (`deep16/js/iso.js:85`). Nothing in the game stacks two walkable levels on one square *(reader, checked against the three cases below)*.
  - **The Hex's three floors:** three defs from `HX.def(lv)`, each 24 x 27; `HX.stair` asks UP/DOWN and `HX.lay` swaps the map and stands the people again (`deep16/js/hex.js:504-539`, the load at `:507`).
  - **The mines' floors:** each first-game level its own `M.FLOORS` entry (`deep16/js/mines.js:25-45`), joined by the 8-bit's warps through `M.go` (`mines.js:325-368` *(reader)*). A warp to a floor the grid has not got says so and keeps the party (`M.held`, `mines.js:316`) -- **this is what the drained stair's warp to the Burial does today.**
  - **The inn's upstairs:** its own 18 x 12 floor, `halfway_up`, off a stair trigger (`deep16/js/inn.js:250`; measured 18 x 12). The ground floor's see-through is the same map laid again with the walls as stubs when the token steps inside (`inn.js:261-285`; `M.relay` -> a full `iso.load`, `mines.js:638-641`).
  - **The Edifice's roof:** not a second level. The facade and roof are one raised plateau (`heights` `i`, 45 ft, `deep16/data/maps.js:1394`); the orchard "under the glass" is **painted into the glass tile** at the bake (`deep16/js/iso.js:208-214`) with the Sunshaft's circle from `shaft: [29.5, 4.8, 2.8]` (`maps.js:1387`); street and roof are joined by a teleport, `passages` (`maps.js:1391`).
- **What a floor costs to author:** an `own` floor is a function returning the first game's map shape -- rows, a legend of tile names, warps, triggers, people, signs (`In.map`, `inn.js:195-213` *(reader)*; registered at `inn.js:216`, `gulch.js:108`). `M.floor` turns it into a grid def (`mines.js:119-217`; `dwarfFloor` -> `=` dressed stone, `dwarfWall` -> `#`, `mines.js:57-66` *(reader)*). `iso: true` puts it on the diamonds, `&view=top` draws the same floor north up (`mines.js:227`). **So a floor authored once can be shown either way** -- the 10-29 lean and today's order are one flag apart in code (the top view wants tile art; the diamonds are code-drawn, RULED 10-29, the warrens-and-galleries lane :244-248 *(reader)*).
- **What a floor costs to bake and load (measured):**

| floor | squares | load (one picture) | note |
|---|---|---|---|
| inn upstairs | 18 x 12 | 0.11 s | |
| galleries_g4 (iso) | 36 x 26 | 0.20 s | |
| the Wet | 30 x 44 | 0.24-0.27 s | |
| warrens mouth (iso) | 40 x 27 | 0.35-0.39 s | |
| the Halfway Inn | 50 x 40 | 0.59-0.63 s | paid again on every step in or out of a building (the relay) |
| the Edifice (fight map) | 60 x 39 | 0.92-1.06 s | the task's "60x33" is 60 x 39 on main |
| Silverton on the diamonds (`&view=iso`, 30 ft squares) | 79 x 52 | 1.5-1.6 s | |
| **Web Gulch -- the largest roam floor** | 40 x 112 | **0.005 s paged**; the other 11 pages 0.9 s, spread | "waited three seconds blank" unpaged (`mines.js:226`) |
| synthetic dwarven floor | 38 x 30 | 0.42-0.47 s; **paged 0.001 s + 0.21 s first frame** | Sólskaft's size |
| synthetic | 38 x 60 | 0.91-0.99 s; paged 0.002 s + 0.34 s | |

  One picture costs about 0.35-0.4 ms a square here. A map with `page` set is painted in 1024-px pieces as the camera comes to them, 6 ms a frame in the background, 48 pieces kept (`iso.js:119-124`, `:316-334`, `:438`); iso mine floors page above 2400 squares (`mines.js:204`, `:226`). A fight map of 1200 squares or more shows BAKING THE FLOOR for a frame (`battle.js:17-21`). Walls and props are already made only when first seen (`iso.js:660-663`, `:684-686`).
- **How it performs once in:** the floor is one blit (or its pages) and a depth-sorted prop list culled to the view (`iso.js:664-692`). Nothing in the measured sizes is near a limit; the caps on record are a 24,000-px picture ("past what a browser will make", `iso.js:121`) and the party-token lane's "tops out near 200 x 150 squares" *(reader, lane :100)*.

## 1.2 The five levels at 5-ft squares, checked against the Edifice as drawn

**The fixed things** (`deep16/data/maps.js:1380-1470`, read): the facade is columns 11-48 of the exterior map, **38 squares, 190 ft**; the roof is rows 1-15, so **the block under the glass is 13 rows deep (65 ft) between a front wall and a back rim**; the vault doors are columns 29-30 -- **dead centre**; the Sunshaft's circle is centred (29.5, 4.8), radius 2.8 -- **at the back of the glass, not its middle**; the falls come down the mountain's face at row 0, columns 28-31, into the intake pool on the back rim directly behind the circle; the four fountains' spouts are in the front face **10 ft up** (`maps.js:1389`); the facade is 45 ft, three 15-ft floors (`maps.js:1372`).

Local coordinates below: x 0-37 west to east (0 and 37 are walls, the doors at 18-19), rows counted north from the front wall (r0 the facade, r1-r13 under the glass, r14 the back rim, r15 onward under the mountain).

### The collisions, and the smallest change for each

1. **Main street is short. (the one that matters)** From the doors to the centre of the light is 10 squares; the light's ring is 6 squares across (r7-r13). That leaves **r1-r6, six squares, 30 ft**, for the ramp's head, the stable, the stores and two temples on the centre line. His pour wants a street.
   - *Smallest change (my lean):* use the width, which is generous. **The cart ramp and the stable run along the inside of the front wall, in the west and east wings** (carts come in the doors and turn left; guests turn right) -- which is what *"a downward ramp on the left ... and a stable on the right"* says. The centre street keeps r1-r6 with one deep store front a side; **the oathstone's court (r7-r13) carries the two temples, one on each side of the stone**; and each wing gets a short cross arcade (east-west) so the stores have four more fronts. Nothing drawn changes.
   - *The other change:* deepen the roof on `MAPS.edifice` by ten rows or so and move the circle with it. That re-cuts the Skylights map (60 x 39, its bench and its show tuned on it) -- M, and it touches a fight he has played. Not my lean.
2. **The throne room has no room under the glass.** The light's ring touches the back rim. So the throne room, and everything "behind the throne", is under the mountain past r14 -- which the wiki already infers (*"the interior runs back into the mountain behind the glass"*). Free ground: no exterior to check against. Proposed depth past the rim: 14-16 rows.
3. **The falls come in in front of the throne, not behind it.** The intake is on the back rim (r14) straight north of the oathstone; "behind the throne" is further into the mountain than the mountain's own face. The fit: the water drops through the rim into a flume at orchard level that runs north over the throne room to the wheel behind it (his *"mainly ... on the second and orchard levels"* allows exactly that), and its tailrace comes back south to the cistern. On the maps it is two strips of water tile and a sign. No change needed, but it is plumbing that should be said.
4. **The cistern cannot be at street level.** The spouts are 10 ft up the front face, so the water that feeds them stands above 10 ft: **the cistern is on the second floor at the front** -- I put it at the east front, over the stable, so one small tank drops to the stable's trough and to the spouts (his *"the cistern that feeds the fountains and the stables"*). The bricked cut with the red mark goes there. This also puts the mission ground on a floor the party otherwise has little reason to climb to.
5. **Two things on the east front** (the stable, and the narrow ramp coming up). Fit: the stable along the front wall (r1-r2, x 21-34), the narrow ramp against the east wall running north-south (x 35-36, r3-r8), coming up beside the stable's door.
6. **The wagon holding is tight.** The ramp, run along the front wall at one height step a square (15 ft in six squares is the grid's own ramp grade), lands at about x 6; "further west of the ramp" is then x 1-5: five squares, room for four wagons. If he wants a yard, the ramp runs north along the west wall instead and the holding takes the front-west corner (8 x 5). Either fits; say which he sees.
7. **The family level under the west lane** fits only just: bier chamber 4, four tiers a side at 2 squares each, a 2-square hallway each side, shrines 3 deep on the east -- the west half then has **7 squares** for the closed street (a 2-square street, houses 2-3 deep either side). The Scalebeam house (6 x 4 in the 8-bit, `tools/mapgen.py:1143-1145` *(reader)*) fits lengthwise along the street. It works; it is the one floor with no slack.
8. **The vault door's roof hatch** (`passages`, `maps.js:1391`) implies an inside stair from the doors to the roof at the front. Fit: **the main stairwell beside the doors** (tollhouse side), street to second floor to orchard to the hatch. This is also the stair the party uses, so it earns its squares.

### Floor by floor (his words CANON; placements below are mine unless marked wiki-PROPOSED)

**ORCHARD (third floor, +30 ft) -- about 38 x 24.** Under the glass, 36 x 13: the apple rows, cherries and pears, hops, the mint bed, wheat along the long edge, the gardener (the 8-bit's Grow, `mapgen.py:1168-1174` *(reader)*); **the hole** over the oathstone, railed, r7-r13 on the centre line; the falls' intake dropping through the back rim; north of the rim the flume, the top of the wheel, and **the garrison's way out behind the waterfall** to the roof by the intake pool (his *"as in the fight"*). Ways: the front stairwell (down, and up to the roof hatch); the old lift's head, if it lives in the light well (question 7); a back stair down to the garrison.

**SECOND FLOOR (+15 ft) -- about 38 x 28.** Two wings of lodging over the stores (each about 15 x 12, rooms off a gallery that looks down on main street -- the street itself open to the orchard's floor, question 3); **the cistern at the east front** with the bricked cut and the red mark; north of the rim, behind the fall: **the armory, the garrison's sleeping quarters** (the 8-bit's lit barracks and its dark tiers together -- six tiers, two filled, dust on the rest), **the kitchens** (smokehouse, brewhouse, the cook), then **the wheel and the falls-works** with Ragna. Ways: the front stairwell; a back stair up to the orchard and down to the throne room's side; nothing across the street unless he wants a bridge.

**STREET LEVEL (0) -- about 38 x 30. The floor to build first.** r0: the vault doors (x 18-19), Pyro's post and Ketil inside them, the two portcullises. West front: **the tollhouse at the head of the ramp** (wiki-PROPOSED) -- Ingrith's ledger-room, the quartermaster's counter, the tariff board, the scales under their cloth; the ramp going down west along the wall. East front: **the guest stable**, ready and empty, a little old fodder. r1-r6: main street, a shuttered store front each side, the wings' arcades behind them (west: trade stores; east: finished goods), the front stairwell. r7-r13: **the oathstone on its pedestal under the light**, a temple on each side (Rekknar's ledger-stone west, the Dormant's empty cut east -- "which two" is the wiki's inference), **the hero-wall** on the court's two flanking walls. r14: the back rim, the doors of the throne room. r15-r24: **the throne room** (the dais, the empty high seat -- "He stands at the door"), **assay, mint (sealed) and treasury (open, empty)** on its west (wiki-PROPOSED). Ways: the vault doors out to Fountain Street; the west ramp and the east ramp down; the stairwell up; **the stair down to the funerary** just north of the oathstone, before the throne room's doors (question 6).

**CART LEVEL (-15 ft) -- about 38 x 30.** The west ramp's foot and **the wagon holding** in the front-west; **the west loading lane** under the west stores (hoist-traps to the shops above); the road north along it, **around the funerary** -- a walled drum under the oathstone, r7-r13 on the centre line (question 4) -- past **the forge** behind it (the Copperbottom smith and the old ore-sorting floor, the armory's racks), **the cold smelters and the cupel-hearth**, **the Forge-Father's temple** beside the forge, and **the highway's mouth** at the back (the gate, the gate watch, the ledger-lamp rack, the muster's ground) *"working in as a second import lane"*; then south down **the east loading lane** under the east stores and up **the narrow east ramp**. In the dark off the lanes: **the shroom farm** (wiki-PROPOSED); **the boarded trade hall** (NO SURFACE FOLK PAST THIS DOOR) wants a home -- my lean is beside the highway's mouth, where Deepholm's factors met the surface's. The stair from the street passes through here on its way down.

**THE THIRD LEVEL BELOW (-30 ft, the bier lower) -- about 38 x 26.** The stair from above lands in a cross-passage at the north; from its ends **two hallways run south**, east and west of the funerary. **East hallway:** the little shrines on its east side (the Burial's chapel -- the grave-anvil, Rekknar's stone, the empty cut, the kneeling-stone, the lamp); **the Warrens' stair lands at its south end**. **West hallway:** the sealed access points on its west side -- I read these as **the 8-bit's four warranted doors finding their purpose** (their "what is behind them is OPEN" closes: the closed residential is). West of them, the closed street: ten doors, five a side, nine barred, **Ásdís's lit** (question 5). **Between the hallways:** from each a stair goes down the middle through four tiers to the bier; two family wedges north of each stair and two south -- **eight places, seven families, one waiting**, exactly the 09-26d/e canon turned a quarter; Pyro's doorless chamber, the empty bier and the one kept lamp at the centre, under the pedestal. The tiers are a true heightmap on this floor (the Flooded Stair's flight is the precedent, `iso.js:85`).

**The light shaft's hole through two floors:** with main street open to the orchard's floor (question 3) the light needs only **one** hole -- the orchard's -- as his pour has it (*"the hole in the third floor and glass ceiling"*). The second floor is two wings and has no floor over the street.

## 1.3 What must be seen through what

| the sight | can the draw do it now | the cheap stand-in |
|---|---|---|
| **Walls inside a built place** | Yes. `R.occlude` cuts any wall between the eye and the party each frame (`roam.js:119-142`); the inn lays a whole building's walls as knee-high stubs while the party is in it (`inn.js:261-285`); his presence rule landed 11-11 (`46ae14da`, the inn lane :973 *(reader)*). All of Sólskaft is "inside": lay every wall as a stub, let occlude do the rest. | none needed |
| **The light down onto the oathstone** | Half. A map light on the stone is there (`lights`, `light.js`); a visible **beam** is not -- no shaft-of-light drawing exists in roam *(reader: searched `beam`, `shaft`, `mote`)*. | S: a tall faint prop over the stone (a column of light with motes, as the 8-bit drew it) plus the bright map light; daylight hours only if he wants the noon hour honoured. |
| **The glass roof over the orchard** | Not needed from inside: the iso eye looks down, and no ceiling is ever drawn. From outside it is already drawn (`iso.js:208-214`). | S: daylight on the orchard floor by THE WORLD's clock (`outdoors`, as the mouths do, `mines.js:26`), and a thin pane-shadow grid on the grass. |
| **Looking down the hole from the orchard** | Not as a live view. The precedent is the Edifice's glass: the floor below **painted into the tile**. | S-M: paint the pedestal and the stone into the hole's squares at the bake; or S: a dark well with a lit disc. |
| **Main street under the lodging** | Yes, as the town draws buildings: the stores are roofed blocks two floors tall with their faces to the street (`roofs`, `iso.js roofCanvas`), cut where they hide the party. The lodging is its own floor, not seen from the street. | none needed |
| **The funerary pit from the cart road** | No -- two walkable levels over one square is what the engine has not got, and the hallways lie under the lanes. An open pit could be faked by drawing the tiers as a lowered heightmap inside the cart level's map (M, and the hallways would then exist twice). | S: a closed drum with a grille; USE reads the sight as words (*four tiers going down into the dark, and one lamp, kept*). My lean, and the 8-bit's own manner. |

## 1.4 Art

- **Nothing has to be asked for to walk it.** The diamonds are code-drawn by ruling (10-29, "no art desk tiles on the diamonds, no art order, a grid piece for each first-game thing" *(reader)*); `=` dressed stone and `#` worked wall are what the Wet's dwarven works and the Edifice already wear (`stone: 'grey'`, `iso.js:28-37` *(reader)*). **Grey-box and finished are the same thing here until he wants more.**
- **In hand that serves:** the troopers and drill-sergeant (art-in-hand :194), the lamp tower, rubble, cots, crates and the supply chest (art-in-hand §8 :1083-1092), the Wet's crate and lamp, the inn's furniture sheets (`innprops_p1/p2`: tables, hearth, beds, counters -- usable for the lodging, the kitchens and Ásdís's room), the town's fountain work "old dwarven work in pale dressed stone" (top view only) *(all reader)*. The grid's own pieces: trees, the well, shelves `S`, counter `K`, boards `o` (`iso.js:62`).
- **Code pieces a seat would draw (S each, as the mines' `M.ISOPIECE` did, `mines.js:230`):** the pedestal and oathstone with its gold band, the throne on its dais, the anvil / ledger-stone / empty cut, a furnace, the wheel, a portcullis, a barred family door and the lit one, the bier, a niche face, a wagon.
- **If he wants it pretty later -- what a dwarven-hall ask to the art desk would have to contain:** for the diamonds, one page of **props at the iso angle** (the list above, plus store fronts shuttered, a hoist and trap, hop poles, a smokehouse rack, a brew vat), since floors and walls stay code; for a north-up Sólskaft instead, a full **tile atlas** in the `toptiles` manner -- dressed floor in three wears, worked wall with its top and face, door shut / barred / lit, stair, ramp, rune-seal whole and cut, water race, plus the props -- two pages. That difference in art is the strongest practical argument for the diamonds.

## 1.5 The story: where the 8-bit's beats and people land

*(the 8-bit's places and lines: `tools/mapgen.py:1005-1290`, `first/js/deep.js`, all from the reader's inventory unless marked)*

| the 8-bit's | where it was | where it lands |
|---|---|---|
| **The drained stair's arrival** (`S.dryStair`, deep.js:114-124; warp warrens_d (8,21) -> burial (2,5), mapgen:748) | the hallway's west end, the cut door | **The south end of the east hallway, third level below.** The party comes up out of the cut seal facing north: the hallway running away from them, the shrines' one lamp in the wall on the right, and on the left the tiers falling away to a second small light -- the bier's -- at the bottom. The Wet's warp already exists and is held (`M.held`); this floor is what it waits for. |
| **The night crew** (`S.crew`, deep.js:204-282; Hask, the wheelwright, two hands at Geirmund's pried row) | a step into the hallway, the near wedge | Geirmund's wedge is the **south-east one, nearest the landing**: the crew is the first thing met, as before. |
| **The niches, the Door-Shield, Asmund's hammer, the bier** (`S.niche` deep.js:152-190, `S.bier` :201) | the four tier rows | The same rows, turned: Audun's wedge and the shield beside Geirmund's; Asmund's (the heir rite, deep.js:1260-1277) on the west side; the eighth place waiting. |
| **Ingrith arrives** (`EV.ingrithArrives`, deep.js:291-340; from the dwarves' stair) | the hallway's east end | Down **the stair from the street**, into the cross-passage at the hallways' north end; its foot is the rune-shut door (`S.dwarfStair`, :202) until then. Bars go across the cut seal as before. |
| **Pyro at the door** (`S.pyroMeet`, deep.js:356-368; trigger across the vault hall) | walked to from the shaft's head | The party comes **up beside the oathstone**, the light on it, and walks main street south to the doors where he stands with Ketil -- the town seen from the inside out on the way to its king. The trigger is a band across main street at r2-r3. Better staging than the 8-bit's. |
| **Ketil's "empty your packs"** (deep.js:394-405) | the door squares | the same squares |
| **Ingrith's ledger-room, the quartermaster** (deep.js:406-429) | the tollhouse, west of the vault hall | the tollhouse at the ramp's head, street level |
| **Ragna and the wheel; The Keeper's Water** (deep.js:1313-1331) | the falls-works, east of the vault hall | Ragna at the wheel behind the throne, second floor; the bricked cut's sign moves to the cistern at the front. What the cistern's own mission is stays open (the wiki's OPEN, his 11-11 *"pretty sure it was wheelwright or ragna one"*). |
| **The smith; the Winnower** (`S.dsmith`, deep.js:903-924) | the works' armory | the forge on the cart level, behind the funerary |
| **The highway gate and the muster** (`S.highwayGate` deep.js:572-587, `S.muster` :588-614) | the works' east end | the highway's mouth at the back of the cart level; the muster on the road in front of it |
| **Ásdís's lit door** (deep.js:439-451) | the west street off the shaft | the third level below, west (question 5) |
| **Halldor's petition; Brann and Hedda; the drilling four and their sergeant** (deep.js:786-800, 1233-1238) | the muster yard | by the tollhouse and the stable, and on the cart loop (his *"running the loop"*); Halldor's bunk with the garrison behind the fall |
| **The cots; the sleeper's offer** (deep.js:433-455) | the yard, both barracks | the garrison's quarters behind the fall |
| **The treasury's step; the mint; the standard weights; the touch-needles** | the works | beside the throne (the wiki's placement) |
| **The lift** (`wwLift`, mapgen:1176-1178) | the Sunshaft's east edge | question 7 |

**What does not fit, by his rule ("unless they don't fit"):** the noon court and the hall turned on its axis (the wiki already cuts them); the muster yard as a room (it becomes the front and the loop); the 8-bit's one hallway across the Burial's top; the Triad's single shrine in the galleries (it becomes two temples on the street and one by the forge). Everything else the 8-bit made has a home above.

## 1.6 The alternatives, weighed

**(a) Iso roam, one map a floor, his reshaped layout.** Five `own` floors on `M.FLOORS`. L in all. For: it is the layout he ruled today; the pipeline is built and benched (the inn, the gulch); no art order; the see-through he asked for at the inn is exactly an interior's need; the same floors draw north up by a flag if he changes his mind. Against: every floor is authored by hand (no generator output to lean on -- though `tools/mapgen.py` can be given a `build_solskaft16()` so the rows are made by code and a checker, as the 8-bit's were); the funerary pit is not truly seen from the road.

**(b) A converter from the 8-bit's three maps, ignoring the reshaping.** S-M: the converter is general already (`R.rows8`, `R.TILE`, `roam.js:42-56`; three more `M.FLOORS` lines with `src: 'solskaft'` and friends, as the Warrens' floors are) and the 8-bit's people, signs and warps come with it for nothing. Against, and it is decisive: his word this morning -- *"reshaping solskaft this session before the 16bit tries to map on to whats in the 8-bit"* -- is an order not to do this; the 8-bit's layout is the noon-court one the wiki now supersedes; and the Edifice the second game drew (the glass, the hole, the falls at the back) does not sit over the 8-bit's plan. **Worth exactly one thing: as a one-day stopgap so the drained stair's warp stops saying "held"** -- and I would not, because the story's first sight of the Burial would then be the wrong Burial.

**(c) A few key floors as roam, the rest as menus or cutscenes.** Street level, the cart level and the third level below as roam (the three the story walks: the stair, the crew, Ingrith, Pyro, the tollhouse, the smith, the gate, Ásdís); **the second floor and the orchard as two small floors later or as counter screens** (Ragna at her wheel and the gardener are a word each; the garrison's bunks are a REST). M-L -- it is (a) with the two cheapest floors deferred. For: he walks the story's Sólskaft a session sooner. Against: the orchard under the glass is the place's signature and the one floor the exterior already promises; the cistern's mission wants the second floor.

**My SHOULD: (a), built in (c)'s order.** The floors are small and the pipeline is there; the top two are an S each once the bottom three exist, so deferring them saves little and they should follow rather than be cut.

### Sizes and the order of build

1. **Street level, grey, walkable from Silverton's vault door** -- the doors, Pyro and Ketil standing, the tollhouse and stable, main street and the shuttered fronts, the oathstone under its light, the two temples, the throne room. People standing with their first-game words (`T.say` reads `content/npcs.json` by id, `town.js:507`), signs, no scenes. **M. This is the first thing he walks**, and it puts collision 1 (the street's length) in front of his eye before anything is built on it.
2. **The third level below** -- hallways, shrines, tiers as heights, the bier, the closed street, and the Wet's cut seal joined to it. **M.** The story's actual way in; after it the drained stair leads somewhere.
3. **The cart level** -- ramps as doors both ends, the loop, forge, smelters, the highway's mouth (its far side still held until the road is grid maps). **M.**
4. **The second floor and the orchard**, with the stairwell, the cistern, the works, the garrison, the way out behind the fall onto the Edifice's roof. **S + S.**
5. **The see-through extras** -- the beam (S), the hole's picture (S-M), the drum's grille (S).
6. **The scenes** (Pyro's meeting, the crew, Ingrith, the niches, the gate and muster, Ragna, the smith's shop, Ásdís) -- **L, and the story build lane's**, which today "WAITS on the road as grid maps" (lane :6, :21 *(reader)*): steps 1-3 are the Sólskaft half of what it waits on.

House costs to name: Sólskaft's floors want `save: true` on the street and cart levels (the 8-bit's `solskaft` and `solskaft_deep` are save points; the Burial is not) -- `R.canSave` allows it per floor (`roam.js:1247`); a bench mode for the floors' ways (every stair and ramp there and back, as `toplevels1021` does for the mines); the new places and any new names to `invented.json`.

## 1.7 Questions for him that change the build

1. **The diamonds, not north up?** On 10-29: *"probably top down for solskaft with iso for the road"*. Lean: **iso, as the inn** -- no tile art to order, the stub walls and presence see-through are built, and `&view=top` keeps the other look one flag away.
2. **Main street is six squares long as the Edifice is drawn** (doors to the light's ring). Lean: **keep the Edifice; the ramp and stable run along the front wall in the wings, one deep store front a side on the street, the two temples flank the oathstone, a short cross arcade in each wing for more fronts.** The other way is ten more rows of roof on the Skylights map.
3. **Is main street open up to the orchard's floor**, the lodging two galleries looking down on it? Lean: **yes** -- then the light needs only the one hole, as his pour says.
4. **The funerary from the cart road: an open pit, or a walled drum with a grille?** Lean: **the drum** -- the engine cannot show one walkable floor through another, and the dead are not a roadside view.
5. **How does a guest reach Ásdís** behind sealed access points? Lean: **one of the west hallway's access points stands open, hers, a lamp in it**; the other three sealed.
6. **Where is the stair to the funerary at street level?** Lean: **just north of the oathstone, before the throne room's doors**, down past the forge to a passage joining the two hallways' north ends; its foot is the rune-shut door the 8-bit had.
7. **The old lift's two platforms** (canon as PLACE, 09-27): Lean: **in the light well, street to orchard**, the foot beside the oathstone's court.
8. **The cistern on the second floor at the east front, over the stable** (the spouts are 10 ft up, so it cannot be lower)? Lean: **yes**, the bricked cut and red mark there.
9. **The wagon holding: five squares in the front-west corner past a ramp along the front wall, or a yard with the ramp along the west wall?** Lean: **the first** -- it matches "further west of the ramp".

---

# REPORT 2 -- fog of war and first-time exploration, against the roam's loadings

## 2.0 The short of it

**Loading and fog are two separate things here, and the loading half is already solved.** A floor Sólskaft's size bakes in about half a second as one picture, or in **a millisecond at the door and a fifth of a second on the first frame** if it is paged -- and paging *is* "do the expensive work as it is revealed": the floor is painted in pieces as the camera reaches them. Tying the paint to what the party has *explored* rather than to what the camera *shows* would save nothing measurable and would add a repaint hitch at every reveal. **So: page Sólskaft's floors (S), and build fog as its own piece (S, then M) for the look and the story, not for the loading.** My SHOULD is to build the small half with the floors and hold the mask until he has walked them.

## 2.1 How a roam map loads today (measured; the table is in 1.1)

- **What is baked when.** At the door: `R.make` -> `Battle.enter` -> `D.iso.load(def)` (`battle.js:30`), which classifies the rock, **bakes the whole floor into one canvas**, and lists the props (`iso.js:96-100`). `R.stats.enterMs` is the game's own stopwatch for it (`roam.js:195-197`). Nothing is baked at page load; nothing is kept when the party leaves a floor, except the town's street while they are in a shop (`B.townAway`, `town.js:619`, `:661` *(reader)*). Every stair in the Hex, every warp in the mines, and every step in or out of an inn building is a full bake again (`hex.js:507`, `mines.js:641`).
- **What is already lazy.** A `page` map paints nothing at the door (`iso.js:316-334`); wall and roof pictures are made the first time they are near the view (`iso.js:662`, `:686`); a paged map's props likewise (`:684`); the sheets of figures are fetched as each scene asks (`main.js:39`, the 10-03 lazy sheets).
- **Measured.** One picture: **~0.4 ms a square** -- the Wet 0.25 s, the inn 0.6 s, the Edifice 1.0 s, Silverton on the diamonds 1.6 s. Paged: **1-5 ms at the door** for any size; the first frame then paints what the camera sees, **0.13-0.34 s** for a 38-wide floor; the rest at 6 ms a frame behind the walk (Web Gulch's other eleven pages: 0.9 s in all, about 85 ms a page).
- **Not measured:** the fetch of the people's sheets over the network on a first visit (my probe ran from disk with no figures drawn); `cloud-notes/lazy-sheets-notes.md` has the 10-03 numbers. If a door ever feels slow on live, that is the more likely cause than the bake.
- **A five-floor Sólskaft, then:** five floors of ~1,100-1,200 squares. Unpaged, each stair is ~0.45 s here (call it up to a second in his pane, and the 38 x 32 ones cross `Battle.BAKE_SQ` 1200 and flash BAKING THE FLOOR, `battle.js:17`). Paged, each stair is a frame, and the floor finishes painting within a second of walking. **Nothing is ever paid for a floor not visited, either way.**

## 2.2 What explored-state exists today

- **None that is remembered.** No `explored` / `visited` / `revealed` anywhere in the roam code *(reader; my own grep of `roam.js` agrees)*.
- **The dark and the light** are live: `L.map` is the light on each square now, `L.partyMap` what the party sees now (2 lit, 1 darkvision, 0 unseen; `light.js:122-148`, `:235-258` *(reader)*); `R.sight` gathers the four's lights and eyes at the token (`roam.js:1465-1470`). Not saved.
- **`seenBy`** is the fights' hiding: who sees whom, per unit, per fight.
- **The L map** (`R.paintMap`, `roam.js:2192`) shows the whole floor at once; in a fight it shades `R0.sightV`, a snapshot of what was in sight when the fight was cut. His 10-28 note took the ways' pins off it because they were *"excessive and reveals the deep gallery"* (the warrens-and-galleries lane :166 *(reader)*) -- he already minds the L map telling too much.
- **The world map** has no hidden or visited hexes; its saved state is `{at, from, t, today, seed, map, pos}` (`world.js:258-269` *(reader)*).
- **The far zoom** is a camera step; it reveals everything.
- **Already designed and HELD:** the party-token map lane §7 (:32-50 *(reader)*), on his *"ponder the work implications of 'first time here' fog of war on grid zoom and 'L' map"* and *"Kick the exploration stuff to Lanes for slotting for a future session"*: a one-way reveal, one bit a square set from `R.sight` each step, a black mask over the baked floor, the L map kept dark, clicks through explored squares only, a bitmask a floor in the save -- sized at one seat-session, five leans unruled. **This report builds on that; it does not replace it.**

## 2.3 What "first-time exploration" could mean here, and what is saved

- **By floor** -- a flag the first time a floor is entered (`seen:<floor>`): the L map lists only floors visited; a first-visit line. Saved for nothing: the house's save already carries `flags` (`house.js:35-39` *(reader)*).
- **By room** -- each floor carries a region layer (a letter a square: the tollhouse, the stable, each store, the throne room ...); a room is black until the party stands in its doorway or sees into it, then stays. Saved as a short list of room ids a floor, in flags. Suits a **built** place: Sólskaft is rooms and doors, and its story is that most of it is shut -- *"much of it sealed or dark"* is the wiki's own frame.
- **By square** -- the lane's §7: sight reveals squares. Suits **caves and the road**. Saved as a bitmask a floor: 38 x 30 is 143 bytes, ~190 characters in the save record; five floors under a kilobyte.
- **Per save, not per place:** the mask belongs in the house's save record beside `flags` (a NEW GAME starts dark; a loaded game remembers). The test doors (`?roam=`) have no save and start dark each time, or lit with a switch.
- **Seen but not in sight now:** the floor stays drawn, dimmed; people and creatures are shown only in present sight (the lane's lean a).

## 2.4 The interaction he is pointing at: do the expensive work as it is revealed

- **It already works that way by camera.** A paged floor paints a piece when the view reaches it. On a 38-wide floor the view at the Wet's zoom covers most of a page or two; the party cannot outrun it (6 ms a frame of background painting finishes a floor in about a second).
- **Doing it by exploration instead** -- paint only explored squares into a page, repaint the page when exploration grows -- is possible (the page painter takes a list of squares, `iso.js:325-333`), but each reveal then dirties one to four pages at ~85 ms a page, on the frame the player steps. It trades a wait that is already a fifth of a second for a stutter at every doorway. **The mask should be an overlay drawn over the finished floor** (one canvas, redrawn only when exploration grows -- the lane's design), and the bake left alone.
- **Loading a floor's *content* on reveal** (a room's people, its props) has nothing to gain either: props are made when first seen already, and standing a room's people is microseconds.
- **Where there is a real saving: keeping floors.** Going up and down Sólskaft's stairs re-bakes each time. A small cache of baked map objects by floor key and tile signature (the Wet already keys its def by `sig`, `roam.js:64-65`; the town keeps one in `B.townAway`) makes a return trip free. Cost: about 12 MB of canvas a floor unpaged. **S-M**, and worth doing only if the stairs feel slow once paged -- I expect they will not.

## 2.5 What breaks

- **Benches that drive roam** (`toplevels1021`, `isoroams1029`, `gulch1028`, `inn1104` and a dozen more, `dev/bench16.js` *(reader)*) walk by `D.roam.walkRoute` fed straight into the path. If routes are limited to explored squares they stall. **The limit must sit on the player's click and hover only**, never on `walkRoute`; and fog must be per floor and off unless a floor says `fog` -- so no existing bench sees it at all.
- **Doors that teleport** (`&at=x,y`, the `?at=` situations' saves, `M.go` landing at a stair): the party appears on a square never seen. The reveal must run once at setup from where they stand -- not only on a step.
- **Saves made mid-floor:** saving is only allowed on town-type floors with `save` (`roam.js:1247`), and position is restored by `at8` (`roam.js:292` *(reader)*). A save from before the mask existed has none: read as "this floor, not yet explored" for a `fog` floor (Sólskaft has no old saves; for older places fog stays off).
- **Floors that are laid again** (the inn's in-and-out, a flag tile changing the Wet): the mask is by square and the size does not change, so it carries; the mask picture must be redrawn after a relay.
- **Fights pulled in or cut onto a field** show their whole ground (the lane's lean c) -- the fight's own sight rules are already there.
- **The dark:** a dark floor already shows only what the lights reach. Fog over it means a square seen once by torch stays drawn, dim. That is a change of feel on the Wet -- another reason for opt-in by floor.
- **The far zoom and height-2 walls:** the mask has to hide wall faces and roofs standing on unseen squares, or their tops give the plan away (the lane names this as "the real cost").

## 2.6 Options, sized

| | what | size |
|---|---|---|
| **P** | **Page Sólskaft's floors** (a per-floor `page`, or the 2400 threshold lowered for interiors) -- the loading answer | **S** |
| **F1** | **First-time by floor:** `seen:<floor>` flags; the L map's floor list; a first-visit card | **S** |
| **F2** | **First-time by room** on built floors: a region layer a floor, rooms black until entered or seen into, on the grid and the L map; ids in flags | **M** (and S a floor to letter the rooms) |
| **F3** | **By square from sight** -- the lane's §7 as written, for caves and the road; the mask in the save | **M** (one seat-session, the lane's own estimate) |
| **F4** | **Bake on reveal** -- the painter tied to explored state | **M-L, and I would not**: no load saved over P, a hitch at each reveal |
| **K** | **Kept floors** -- a cache of baked floors for return trips | **S-M**, only if wanted after P |

## 2.7 My SHOULD

**P now, with the floors. F1 with the floors. F2 after he has walked the five floors, on Sólskaft only. F3 stays held for the road, as the lane has it. Not F4.** Reasons: the measured door cost of a paged floor is nothing, so loading gives fog no job to do; fog earns its place here on the story -- a half-sealed town opening room by room is the place's whole character, and the 8-bit could not do it; rooms fit a built interior better than sight squares and are cheaper to draw and save; and holding the mask until the floors exist means its questions are answered with the place on screen instead of in the abstract.

## 2.8 Questions for him

1. **Fog by floor's own say** -- on for Sólskaft first, the Wet, the mines and the inn left as they are until he asks? Lean: **yes**.
2. **Inside Sólskaft, reveal by room** (a door shows a room) rather than by every square in sight? Lean: **rooms for built places, sight squares for caves and the road.**
3. **A room seen and left:** drawn dim with nobody shown in it until seen again? Lean: **yes** (the lane's lean a).
4. **Between floors: page them** (the stair is instant, the floor finishes painting in about a second as they walk), or one picture each (about half a second to a second blank, BAKING THE FLOOR on the larger ones)? Lean: **page them.**
5. **When:** the small half (floor flags, the L map's floor list) with the floors, the room mask after he has walked them? Lean: **yes** -- and the mask rides the house's save record when it is built.

---

## For the next seat

- **Nothing is built.** The first build is 1.6 step 1 (street level), and it should not start until question 2 of Report 1 is answered: the street's shape decides the floor.
- **The measurements** came from a scratch page outside the repo that loads `deep16/index.html`'s own scripts without `main.js`, wraps `D.iso.load`, and times `D.roam.make(q)` plus synthetic floors with and without `page`. It is not in git; a bench mode that reports `R.stats.enterMs` for every `M.FLOORS` key would replace it in twenty lines if a load-time gate is ever wanted.
- **Checked against main at `f4384421`.** Two seats were landing in `ui.js` / `battle.js` / the iso draw while I read; line numbers there may have moved by the time this is read.
- **The task's brief said the Edifice is 60 x 33; it is 60 x 39** (`rows` and `heights` each 39 long; the probe's `m.w`, `m.h` agree).
- **Not verified by me:** every line marked *(reader)*; the fetch cost of figure sheets on a first visit; whether `content/maps/burial.json` and `solskaft_deep.json` (the second game's copies) match the first game's; anything about how the top view would look for these floors.
- **Lanes this touches:** the story build (`..\handoff-2026-10-14-the-story-build.md`, a pointer section added today); the party-token map lane §4.6 (the road's converter) and §7 (fog, HELD -- Report 2 is its Sólskaft half); the warrens-and-galleries lane's 10-29 "probably top down for solskaft"; the realm page `..\TarlynsPit\wiki\solskaft.md` §The shape (the placements here that go past the wiki's are this seat's and PROPOSED: the cistern on the second floor, the temples flanking the oathstone, the ramp and stable along the front wall, the four sealed doors read as the access points, the stair's place).

---

# 2026-11-11, later -- his thirty feet of main street between the stone and the throne

room: solskaft-weigh, the same seat (config echo claude-fable-5-2), on the lanes desk's message "Griz answered your two gating questions on Sólskaft" relaying his two answers; worktree `.claude/worktrees/solskaft-weigh2` off `origin/main` `5c8e611f`, removed at the close. Notes only.

His words, verbatim, through the desk: *"6 - deserves iso tbh"* -- **RULED: iso** (question 1 of 1.7; the 10-29 "probably top down for solskaft" is superseded). And on question 2: *"7 - what if we put another 30 feet of mainstreet between the stone and the throne? Does the wall thickness buy us the lean?"*

## The squares, read again off `MAPS.edifice` (`deep16/data/maps.js:1433-1450`, the rows; `:1387-1391`)

- Row 0: the mountain's face, rock, the falls painted down it at columns 28-31. Row 1: **the back rim, one square**, the intake pool in it at 28-31. Rows 2-14: the glass, 13 rows. Row 15: **the front rim, one square**, merlons on it. Row 16: the street, with the door's two threshold squares at 29-30 standing *outside* the wall.
- The Sunshaft's circle: centre (29.5, 4.8), radius 2.8 -- its north edge is at 2.0, **exactly the glass's north edge**. The light's ring touches the back rim.
- A correction to 1.2 above: counting the square inside the doors, the south stretch is **seven** squares (35 ft), not six, before the ring (rows 14 down to 8); the court under the ring is six (rows 7 to 2).

## 1. Does his 30 ft fit with the Edifice left exactly as drawn? Yes, wholly.

Everything north of row 1 is rock on the Skylights map and is never seen from outside: six squares of street running on north under the mountain take nothing from it. **No change to the Skylights map, its bench or its show.**

What passes over the new stretch, and whether it collides:
- **The intake pool is straight over its first square** (the rim, columns 28-31 -- the same four columns as a four-square street). The water cannot fall into the street. The fit: it drops through the rim into **a flume at second-floor height that runs north over the stretch's ceiling** to the wheel behind the throne. That is his own earlier word made exact (*"behind the throne on the second and orchard levels"*) and it means **the north stretch is one storey high, 15 ft, under rock** -- not open to the orchard's floor as the south stretch is.
- **The garrison behind the waterfall** (armory, sleeping quarters, the way out by the intake pool) sits on the second and orchard levels directly over the stretch. Good: its stair comes down into the stretch, so the king's guard lives over the king's street.
- **Nothing collides.** The one cost is that the north stretch has a low roof; I think that is a gain (section 4).

## 2. "Does the wall thickness buy us the lean?"

How I drew them: **front wall one square (5 ft), back rim one square, side walls one square each** -- that is what the Edifice's own rim rows are, so the block under the glass is 36 x 13 inside. Two readings of his sentence, both answered:

- **The outer walls' thickness (the desk's reading).** It buys nothing and costs nothing: the walls are already the thinnest the grid has (a wall is a whole square), and the door's threshold is already outside the wall. A thicker front wall at street level than the rim above it would *cost* a row of the south stretch. The back rim is the useful one: at street level it need not be a wall at all -- **an arch through it, the street's width, joins the court to his six squares.**
- **The mountain's face as the wall (how I read him).** The thirty feet *is* a wall's thickness: the street goes through the back of the building and through the rock the falls come down, and comes out in the throne room. Read that way the answer is **yes -- the rock behind the glass is free ground, the one direction the Edifice does not fix, and spending it there is exactly what lets the Edifice stay as drawn.** His proposal is the lean, made better.

**What his 30 ft does to my lean: it stands, and one part of it gets easier.** Still kept: the Edifice untouched; the ramp and the stable along the front wall in the wings; the two temples flanking the oathstone. Changed: the crown's rooms and the hero-wall no longer have to crowd the court or hide off the throne room's side -- they get a street of their own. The cross arcade in each wing becomes optional (question 2 below).

Where thickness does cost, for the record: **every inside wall is a 5-ft square too.** A store front on a seven-square street is two walls and five squares of shop; that is why the south stretch holds one deep front a side and not three.

## 3. The street in two stretches -- my lean for the split

**South of the stone, under the glass: the trade. The court: the faith. North of the stone, under the rock: the crown.**

Street level, local squares (x 0-37 west to east, doors at 18-19; rows counted north from the front wall):

```
 r32  +--------------------------------------+   back of the throne room (the wheel behind it is a floor up)
 r23..|            THRONE ROOM               |   the dais and the empty seat at the north end
 r22  +---------------[doors]----------------+
 r21  | assay      |  NORTH STRETCH   | stair down to the funerary
 r20  | mint       |  six squares,    | (past the forge)
 r19  | (sealed)   |  30 ft, 15 ft    |
 r18  | treasury   |  ceiling, lamps  | the garrison's stair up
 r17  | (open,     |  HERO-WALL on    | (to the quarters behind
 r16  |  empty)    |  both walls      |  the fall)
 r15  |            |  x 17-20         |
 r14  +===========[ arch in the rim ]========+   the back of the glass; the intake pool is over this square
 r13..| REKKNAR'S  |  THE OATHSTONE   | THE DORMANT'S
 r8   | temple     |  under the light | temple          (the court, six squares; the orchard's hole over it)
 r7   | west store |                  | east store
 r6-3 | (trade     |  SOUTH STRETCH   | (finished goods; one deep front a side,
 r2   |  stores)   |  seven squares   |  lodging over both)
 r1   | TOLLHOUSE, ramp down west     | STABLE, the narrow ramp up at the east wall
 r0   +===========[  VAULT DOORS  ]==========+   Pyro, Ketil
```

- **South stretch (35 ft):** the tollhouse at the ramp's head and the stable, both along the front wall in the wings; one store front a side on the street, the stores running deep into the wings under their lodging. His stores and his ramp and stable, as he poured them.
- **The court (30 ft):** the oathstone on its pedestal in the light, a temple on each side facing it. His *"two of the dwarven deities temples would be on main street"*, at the place on it that matters most.
- **North stretch (his 30 ft):** **the hero-wall down both sides** -- the highway's dead cut in rows, walked past on the way to the king; on the west the doors of **assay, mint (sealed) and treasury (open, empty)**, which the wiki had "beside the throne on the west" and which now front the street instead of hiding behind the hall; on the east **the stair down to the funerary** (question 6 of 1.7, answered by this: it opens off the north stretch) and the garrison's stair up. Then the throne room's doors.

**What it does below:**
- **The loading lanes do not move.** They run under the stores, and the stores are all still under the glass.
- **The loop gets room at its far end.** The funerary's drum stays under the court; the road's north leg passes behind it, and **the forge, the smelters, the Forge-Father's temple and the highway's mouth get six more rows of depth** under the north stretch and the throne room, instead of being pressed against the drum. The loop is about 60 ft longer round.
- **One thing to keep apart:** the stair from the street comes down on the east side of the north stretch and must reach the level below the road without crossing it. It goes down in its own well beside the road's north-east corner and passes under the east lane -- a stairwell block on the cart level, not a crossing.
- **The third level below** is unchanged; the passage joining the two hallways' north ends lies under the start of the north stretch, where the stair wants to land.

## 4. The processional, doors to throne, both ways

| | as I weighed it | with his 30 ft |
|---|---|---|
| doors to the stone's centre | 51 ft (10 squares) | 51 ft |
| the stone's centre to the throne room's doors | 19 ft (4 squares: half the court and the rim) | 49 ft (10 squares) |
| **doors to the throne room's doors** | **70 ft, 14 squares** | **100 ft, 20 squares** |
| the throne room, doors to the seat | about 45 ft (9 squares, mine) | the same |
| **doors to the high seat** | **about 115 ft** | **about 145 ft** |

**How each reads on the diamonds.** At the closest zoom the screen (480 x 270; a square is 64 x 32 px, `deep16/js/iso.js:7`, `deep16/js/core.js:5`) shows about **15 squares along a street**, roughly seven either side of the party.
- **As weighed (14 squares):** the whole street fits in one view from its middle. The stone sits ten squares in with the throne's doors four squares behind it -- the stone reads as standing on the throne's doorstep, and the walk is over almost as it starts. A hall, not a street.
- **With his 30 ft (20 squares):** it never fits in one view at the closest zoom, and that is the point: from the doors the party sees the street running up toward the light; at the stone the doors are behind them and the throne's doors are just out of sight up a darker, lower street lined with the dead's names; then the throne room. **Three beats instead of one, and the stone sits ten squares from each end -- exactly centred on the walk.** One step of the far zoom shows all of it.
- **The light is what sells it.** The north stretch is under rock: if the street level is a dark floor lit from the glass by the hour and by lamps under the rock (the working gallery is already a dark floor lit only from its mouth, `deep16/js/mines.js:101-104`), the party walks from daylight into lamplight to reach the king, and by night the whole street is lamps. S-M on top of the floor; not needed to walk it.

## My answer, short

**Yes to his 30 ft.** It fits with the Edifice untouched, it uses the rock instead of the roof, it centres the oathstone on the processional, and it gives the crown's rooms and the hero-wall a street. My lean stands with it; the first build is unchanged in size (street level M -- six more rows of floor is nothing).

## Questions

1. **The north stretch one storey high (15 ft, under rock, the flume and the garrison over it), the south stretch open to the orchard's floor?** Lean: **yes** -- the water has to cross over it somewhere, and the low lamplit approach to the throne is the better walk.
2. **The cross arcade in each wing** (more store fronts off the south stretch): still wanted, or is one deep store a side enough now? Lean: **drop the arcades** -- stores west and east, lodging over them, as he poured it.
3. **The hero-wall on the north stretch's two walls**, and assay, mint and treasury with their doors on its west side? Lean: **yes**.
4. **"Wall thickness":** did he mean the mountain's face as the wall the street goes through (how I read it), or the facade's own walls (the desk's reading)? Either way the thirty feet fits and the lean stands; it only matters if he meant something a wall should *do*.

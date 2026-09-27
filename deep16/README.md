# DEEP16 — past the door

A proof of concept: the world past Deepholm's door, 16-bit at a Diablo angle, on a 5-ft grid, with more of the 5E
rules — movement, the action economy (bonus actions and reactions included), opportunity attacks, cover, flanking, an
area spell. One map, one fight, the 8-bit save carried across. Spec: `they live\handoff-2026-09-26-deep16-poc-spec.md`.

- **Play:** after the expansion's credits choose **PAST THE DOOR**, or open `deep16/` straight
  (https://grimgriz.github.io/dragonsleep-8bit/deep16/). `?gate` shows the sprite comparison (the three pipelines);
  `?view` walks a cursor round the cavern; `?stats` (or the ` key) shows the frame rate; `?scale=N` forces a scale.
- **Keys:** mouse hover/click, right-click to inspect, the wheel (or -/=) zooms out and back, middle-drag or the
  screen's edge (a 16-px band, and as far again past the canvas) to look round · arrows/WASD move the cursor a square
  a press along the grid, as on the 8-bit map (up is up-right on screen), or the menu · E/Z confirm · X/Esc back, and
  at rest the ring (on the window style, the menu) · Q the ring · 1–9 commands · SPACE end turn · C recentre · M/Tab
  the menu (PARTY, MENU style, AUTO END TURN, restart, the gate, RETURN TO SILVERTON).
- **Menu styles** (RULED 09-27, Griz: the ring main, the window for those who'd rather; the first try's BAR of
  buttons dropped. Switched in the menu, kept per browser, or `?menu=ring|window`): **RING** — a Secret of Mana-style
  ring of icons round the hero; a turn starts on the grid, ready to walk, and the ring comes up on X, Q, E over the
  hero or a click on him — and by itself once the grid has nothing left (no step to take, no swing at a foe in reach).
  Hovering picks an icon where it is (the ring holds still for the mouse); the keys turn it. SPELLS opens a ring of
  levels, a level a ring of its spells (up/down picks the slot); **SKILLS** the class features that spend something
  (Lay on Hands, Sacred Weapon, Second Wind, Action Surge, Cunning Action — the 8-bit game's SKILL); **ACTIONS** the
  plain ones (Dash, Disengage, Dodge, and Help with a foe beside you). Each shows what it has left ·
  **WINDOW** — a Chrono Trigger-style command window with a pointing hand, up at rest; SPELLS and ITEM open a list
  (left/right picks the slot level). The bar shows **BARM** after the class — bonus, action, reaction, move and the
  feet left — each lit while it's there to spend.
- **Zoom:** the screen is drawn at the window's whole-number scale, so zooming out steps by whole device pixels
  (at 3×: 1, 2/3, 1/3; at 2×: 1, 1/2) and stays crisp; the menus and the floating numbers keep their size.
- **Sound** (09-27): the 8-bit game's own chip synth (`../js/audio.js`) — its effects for the menus (cursor, confirm,
  cancel, error, a pop when the ring or a prompt comes up) and the fight (hit, crit, miss, a fall, spells by element,
  heals, smites, the jaunt, the drider's arrival), and its tunes: `battle`, `boss` when the drider drops, `victory` or
  `gameover`. MUSIC and SOUNDS volumes in the menu (left/right, E mutes) are the 8-bit game's own, shared. Sound
  starts on the first key or click (the browser's rule).
- **AUTO END TURN** (on by default, in the menu): when every command is grey and there's no square left to step to,
  the turn passes after a beat; X holds it.
- **On the grid, always** (09-27; the old HINTS toggle is gone): a rogue's reachable squares that no foe she knows
  of sees plainly are tinted violet; and for any hero, a gold gem marks each square (her own included) where she'd
  flank a foe with an ally on its far side — the cursor on a gem lights that ally hard and names the pair. A
  paladin's Aura of Protection is a dashed gold circle round him (10 ft: it takes in the centre of every square the
  rules count), and the cursor inside it says so.
- **The second wave:** when the two drow and the spider are down, a cocoon on the far wall splits and a **drider**
  drops out (SRD 5.1, CR 6; its look is the drow captain's upper half on the phase spider's body, darkened, till it has
  a sheet of its own). It closes and fights (the bite, then two longsword cuts) or stands off with three longbow shots;
  Faerie Fire once on three or more; Sleep can't take it and webs don't hold it.
- **Runs** from any static server (the 8-bit game's `dragonsleep` preview on 8923 serves it at `/deep16/`); it loads the
  8-bit game's `../js/font.js`, `../data/data.js` and `../js/rules.js`, so the lettering and the character maths are
  the 8-bit game's own. Nothing here is loaded by the 8-bit game.

## The ladder (`?ladder`) — the leveling simulator

https://grimgriz.github.io/dragonsleep-8bit/deep16/?ladder · Griz, 09-27: *"win this fight, level up, and we slowly
fill out the bestiary"*. Nine rungs, the four built at each level by the 8-bit game's own rules (level 1 drawn back
from their level-2 starts: `SV.levelOne`). A rung holds several fights: **left/right** picks, the 8-bit game's set
pieces first, the bestiary's after; a win brings the level-up card and marks that fight WON. Fights are data
(`data/fights.js`: map, level, foes where they stand, the entry card's words and where they come from), maps are
hand-drawn ASCII (`data/cavern.js`, `data/maps.js`), foes are `data/foes.js` (content/monsters.json's numbers, SRD sizes).

| L | fights (the first is the default) |
|---|---|
| 1 | The Hex Floor (brawlers, a card bruiser) · The Rat Cellar · Road Bandits · The Night Crew · The Glowseep (frogs, snakes) · Bat Swarms (under the roost) |
| 2 | The Rescue (four giant bats; the roost: no fire, no thunder) · Holding the Stair (the four hold the top) · The Snared Lad (wolf spiders, a giant spider) · The Old Cut · Goblins and a Bugbear · Rat Swarms · The Glowseep's Swarms |
| 3 | The Braiding Ettercap (and a giant spider, webs strung) · The Glory-Seekers (gnolls, hyenas, outdoors) · The Settling Pools (ochre jelly, gray ooze) · The Keeper (the flooded stair) · The Web · The South Road (axe beaks, a giant boar) · An Ogre and Its Goblins · The Bandit Captain |
| 4 | The Landlord (the otyugh in its pool) · The Line (five guards, a sergeant, on a bridge) · The Night Crew (Hask; the wheelwright bolts) · The Wagon Yard (Amara and Willem make for the horses) · The Thing in the Lake (the chuul; Barley wears the Ring of Binding) · The Card's Top (Talmok and the berserker, reckless) · Gibbering Mouthers · Duergar and Grimlocks · Crawlers (paralysis) |
| 5 | The Cut Seal (bugbear chief, hobgoblins, a worg) · The Grick Den (hidden; plain steel does half) · The Breach (the bulette) · The Troll Hole · Two Ettins · The Cube (and a mouther) |
| 6 | Pinned (three phase spiders out of the walls) · The Drain Cut (two black puddings that split) · The Cloaker · The Fork (a roper, two darkmantles, hidden) |
| 7 | The Brood (the broodmother and a phase spider) · The Fallback Line (a blade-captain, four drow) · The Black Water (the spirit naga) |
| 8 | Two Trolls · The Raid on Third Lamp (captain, spell-weaver, drow) · The Giant's Camp (stone giant, duergar) · The Cut's Walls (two earth elementals) · The Seam (two xorns) |
| 9 | The Cocoon Gallery (the POC; Denny plays Barley here only) · House-Cleaning (two sect blades, an ambush: DEADLY by the table, which assumes average HP; kept at two on Griz's word, 09-27) |

After the set pieces on each rung come the bestiary's fights: the Cowork seat's first four, then eight from the
8-bit game's random tables (`content/encounters.json`) on the set pieces' maps (09-27). Each set piece is sized **hard for the four** by the DMG table (the 8-bit game sized them for its guests; the card
says what its list was). **The water is hand-waved** (Griz, 09-27): what lives in it keeps to it (the otyugh, the
Keeper, the naga) or swims and comes ashore (the chuul); nobody else swims. The looks are CC0 stand-ins, loose fits
by his word (CREDITS.md; `tools/deep16-figures.json` has a `grade` for Quaternius atlases).

**What the engine reads now** (ai.js `brute()` for any foe without a routine of its own, plus the fight's options):
Web (a ranged attack, restrained, recharge 5–6) · grips on a hit (escape with STR or DEX, an action) and what goes
with them — Tentacle Slam and stun, Reel, Drag Under and the chuul's tentacles on the one held, engulf with Damage
Transfer · Pack Tactics · Martial Advantage · Surprise Attack · a foe's Sneak Attack · immune / resist / vulnerable, and
resistance to plain steel (a hero's weapon with a bonus is magic) · Split (the pudding, the ochre jelly) · a ranged
attack when no one's in reach, and foes that only shoot keep off · Enlarge · Leap · Moan (frightened) · Phantasms
(false images) · the spell-weaver's routine (Hold once, a line of lightning, Fire Bolt; the naga uses it with its bite)
· foes bound to water, or swimming · foes starting hidden or in the Ethereal · a foe that bolts for the map's exit
(the wheelwright) or gives ground toward it (the wagon pair; `noEscape` loses the fight if one gets out) · an ambush
(`ambush`: their Stealth against each passive Perception; the unaware lose round 1; Assassinate) · the roost's law
(`roost`) · the Ring of Binding (`ring`) · strung webs a map starts with · open-air ground (`ground: 'earth'`) · prone (knockdowns; up at half the move) · swarms (resist blades and blows, bite for less at half).
Each foe block names what it has that isn't read yet in `todo`.

**Testing** (`dev/deep16-harness.js`, gitignored): `T16.ladder(id, seed)` opens a fight at its level; `T16.auto()`
hands the four to the guest AI (walk to the nearest foe and swing: no spells, so it runs pessimistic); `T16.run(n)`
steps on. Every fight above ran to a result with no errors that way (09-27).

## The save

Same origin, one localStorage. DEEP16 reads `deep16.handoff` (the snapshot PAST THE DOOR writes) unless a slot was saved
since, else the newest `ds8-save-N`, else a fixture (the four at level 9). It writes nothing to the 8-bit game's keys.
The entry card's **2** swaps between the save and the fixture: the fight is built for level 9.

## The look — three pipelines (RULED 09-27 by Griz: LPC the base, Blender for special monsters)

All three end in the same pass (`tools/pixelate.py`): one 64-colour palette (`palette.json`), a hard alpha, a 1-px
outline. Sheets are `art/<figure>_p<N>.png` + `.json` (per-animation frame sizes; 8 facings: S SW W NW N NE E SE).

- **Pipeline 0, LPC** (`*_p0`): `python tools/lpc-compose.py` fetches the layers from the Universal LPC Spritesheet
  Character Generator (GitHub), recolours them from its palettes and composites the figures into
  `_src/lpc/composed/`; then `python tools/pixelate.py p0 all`. Four directions onto eight facings.
- **Pipeline 1, Blender pre-render** (`*_p1`): `"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b
  --disable-autoexec --python tools/render-sprites.py — <figure> 8` renders a CC0 model (KayKit, or the OpenGameArt
  spider) at the dimetric angle — orthographic, X 60°, Z 45°, the toon matcap — per `tools/deep16-figures.json`
  (which parts show, the atlas recolours, the actions); then `python tools/pixelate.py p1 all`.
- **Pipeline 2, generated** (`denny_p2`): Griz's generated character sheet, cut and cleaned by `python tools/denny-sheet.py`.
- Then `python tools/deep16-build.py` (the palette and sprite manifest as JS; `?v=` stamps on `index.html`).
- The downloaded packs live in `_src/` (gitignored). Credits and licences: `CREDITS.md` (the LPC-derived sheets are
  CC-BY-SA / GPL and stay so).

## The code

`js/core.js` (canvas 480×270 integer-scaled, loop, input) · `js/iso.js` (the 2:1 projection, the baked floor, walls
cut on the near side, painter's order, picking) · `js/art.js` (stalagmites, cocoons, rubble drawn through the
palette) · `js/sprites.js` · `js/save.js` · `js/grid.js` (movement, reach, line of sight and cover, templates,
flanking) · `js/rules.js` (economy, advantage, saves with the aura, damage) · `js/battle.js` (the fight as a
generator: turns, commands, attacks and their reactions, the spells) · `js/ai.js` (the drow, the phase spider, guests)
· `js/ui.js` (the bar, the pips, the overlay, cards, prompts) · `js/fx.js` · `data/cavern.js` (the map) ·
`data/foes.js` (the SRD phase spider; the expansion's Drow Captain with the SRD hand crossbow — PROPOSED).

A stepped harness for testing lives in `dev/deep16-harness.js` (gitignored): pause the loop, drive a turn per call,
rig the dice, inject an attack.

**On a phone** (09-27, Griz: "can we add the d-pad and buttons for phone browsers?") the 8-bit game's pad comes up
(`js/core.js D.initTouch`; `?touch` forces it, `?notouch` hides it): the d-pad, A, B, MENU, END, zoom − and +, and
INFO (inspect what the cursor is on). On the board a tap points, a second tap on the same spot acts, a drag pans and
a long press inspects. Turned sideways the pad sits either side of the board; upright it sits below and the board is
small. What each spell does, against the tabletop: `../deep16-current spells.md` (reading-lamp format).

## Not in the POC

Story beyond the entry card; shops; rests; writing back to the 8-bit save; flight (bats and cloakers
move on the ground). The visual crossing (the 8-bit frame gaining resolution at the door) is unbuilt. Levelling and
many maps and fights: see the ladder, above.

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

## Torchdark — the dark, and the light with a place (09-28)

Griz, 09-28: *"The players will need to be able to still see in the dark, even if the characters can't. I think shooting
blind is just handled with a -4."* So: a map marked `dark` (the 8-bit maps' own `dark`, carried across the seam; 26 of
the grid's maps) is dark but for the lamps and fires it keeps (`lights: [x, y, r, color, dimOnly]`) and what the party
brings — a torch in hand, the Light cantrip on someone's gear, a burning blade, the Sunshaft staff, Sacred Weapon's glow,
Daylight at a point. Every light is bright so far and dim as far again; dim light is enough to see by. **The player
sees the whole grid**; what no one of the four can see is greyed and dimmed (the campfire's light pass, `js/light.js`).
Each character sees by the light a creature stands in and by its own darkvision (Lymen 60 ft, the dwarves; the sheets
say who else: `data/foes.js` `darkvision`, `blindsight`, `blind`). **An attack at a creature the attacker cannot see is at
disadvantage** (the SRD 5.1's rule; his first "-4" was AD&D's number and stays as a switch, `js/rules.js R.BLIND`, one law
for both games); an unseen attacker has advantage, so two blind fighters roll straight; a spell that wants "a creature you
can see" cannot take one unseen. The AI reads the same rule. **Torches are hands:** ITEM lights one (an action; the Thief's bonus) if a hand is free — a two-handed
weapon takes both, a shield one — so Aurdin or Vivian carries it and Lymen cannot; DROP leaves it burning where it
fell, THROW lands it within 20 ft, DOUSE stows it, TAKE UP the one at your feet; a versatile weapon held with a torch
hits for its one-handed die; under the roost it is fire, greyed. **The hooded lantern** (RULED 09-29: *"like a mode that
sort of lights and doesn't wake the bats"*): fifty silver at the Provisioner's or the Chandler's, bright 30 ft and dim 30
more, a hand like a torch, never thrown and never spent (doused or put away it goes back in the pack); HOOD DOWN gives
dim light 5 ft only, so nothing light-shy is dazzled and a roost sleeps -- under a roost it is lit hood down and HOOD UP
is refused; the camp's A LIGHT IN HAND walks in with either. The eleven spells that waited on the dark are built
(Dancing Lights, Fog Cloud, Continual Flame, Darkvision, Invisibility, See Invisibility, Sleet Storm, Stinking Cloud,
Mislead, Pass Without Trace, True Seeing), and the sheets' sight todos (the darkmantle's aura and blinding crush, the
cloaker's fold, the duergar's Invisibility). "Magic Missile at the darkness": a dart aimed at a square the caster cannot
see into strikes what stands there (`D.RULES.missilesAtTheDark`, a switch), and in the cloaker's deep gallery the first
one is the gimmick's cutscene (Griz's livestream branding: a close-up of the caster and his clip `audio/attacking_the_darkness.mp3`,
the cloaker hit, its face and "AND THE DARKNESS ATTACKS BACK", then it comes for the caster). **The Mirror's eye**
(RULED 09-28, the Mirror's warlocks' feature: Amara): a mirror worn facing forward -- in the cone before her, a creature
in any light cannot hide from her and gains nothing by being invisible; it shows nothing in the dark. The roost coming
down is drawn over the map before the hand-off. Open for Griz: the torch's action (a switch, `L.LIGHT_COST`), the dark
maps map by map.

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

**The climb** (09-27, `js/climb.js`, `?climb`, or C / the button on the ladder; Griz: "an alternate mode that goes
fight-by-fight 1-9 (random of created battles)"): one party from level 1 (Barley in splint, as on the ladder). Each
rung draws a fight at random from the rung's; the camp comes before it (a long rest between fights; the gear chosen
there stays with the party). A win is the **level-up with your picks** (SRD 5.1, as the build plays it): an ability
score increase at 4 and 8, and 6 for the fighter (+2 to one, or +1 to two; the SRD's one feat, Grappler, isn't built),
the rogue's archetype at 3 (Thief: ITEM for the bonus action; Cutthroat: in the first round, advantage on a foe that
hasn't acted, and a hit on it is a critical) and two Expertise skills at 6, the wizard's two spells a level from 3 (the
8-bit game's list and Misty Step; Thunderwave and Hold Person are listed, not built) and a cantrip at 4. The class's
own part (HP, a max hit die a level; slots; features; Champion, Devotion) comes as the 8-bit game levels it, and the
quests' reward weapons at 5 and 9. **All four down**: back to the bottom, a new run at level 1 (the best level is
kept). **One of them out the way the party came in** (LEAVE THE FIGHT, in ACTIONS, on the fight's entry squares; a
foe beside them gets its opportunity attack): back to the campfire, where the DM's hands raise the fallen, no level
for it, and another fight drawn from the rung. Kept in `deep16.climb`.

**Set design** (09-27, Griz: "proceed with set design"; `js/iso.js`, `js/art.js`, `data/maps.js`): the maps have more
than cave now. New ground: `,` a road (rutted dirt; a map's `road: 'y'` runs its ruts along gy) and `g` grass. New set
pieces, each a stalagmite to the rules (not walked through, half cover, named in the cover's reason): `T` a tree, `W` a
wagon under its cover and `V` its open bed (squares side by side make one wagon, wheels at its ends), `k` a woodpile,
`f` a rail or fence (posts and bars), `w` a well; and `b` a building's wall (coursed stone; rock to the rules). An
**open edge** of a map (any square on the border you can stand on) fades into the dark and is a way out: LEAVE THE
FIGHT works from any of them, and from a map's `doors`; the ways out are marked on the grid on a hero's turn. A map
closed all round keeps the squares the party came in by. A fight's `riders` are scenery figures standing where they
are (never in the fight), and a win can change them (`after`). **The inn yard** is re-cut from the 8-bit game's Halfway
map at its bearings (22 x 17): the road down the west side, the wagon with the children in its bed (goblins to the eye
until the glamour breaks: `kid1_p0`/`kid2_p0`, Aurdin's LPC layers in farm colours at 80%), the well and the rail,
the inn's wall and its two doors, the woodpile, the stable. The ladder's fight there has two hired swords, and nobody
flees.

**The camp** (09-27, `js/camp.js`: Griz, "spell prep should probably run before each fight"): a rung's E opens the camp
before the fight. **EQUIP** from the rung's armoury, free (Silverton's racks from rung 1; the lake's hoard and Winters'
cases from 5; the Door-Shield and the smith's from 6; dwarven plate at 8): what one hero sets down another can take up.
**PREPARE SPELLS**, SRD counts: Aurdin INT modifier + his level from his book (Misty Step is in it from 3), Lymen CHA
modifier + half his level from the paladin list (nothing at 1), Lesser Restoration always ready from 5 (the Oath of
Devotion); the fight's SPELLS list is then the cantrips, the prepared, and the oath's. Detect Magic is a ritual, listed and
never prepared. The law is the 8-bit game's (`js/rules.js` `R.prepCount`/`R.prepPool`/`R.prepDefault`, one for both games
since 09-28), whose rests run the same choice before the save. **CAST AHEAD** the 8-hour spells:
Mage Armor (on by default, on a hero in no armour, a 1st-level slot) and Aid (three of the four, a 2nd-level slot, +5
HP); each needs its spell prepared. **THE BUILD'S MORNING** resets to the 8-bit game's own picks. The choices are kept
per level (`deep16.camp`); the fight starts from a copy of the morning, so RESTART starts from it again.

**Two magic items that aren't a plus** (09-27, Griz: "create two of the 'magic other than a +' items to complicate the
combat rules further"), in the armoury from rung 5, both SRD 5.1 (their attunement isn't counted):
**Flame Tongue** (a longsword): IGNITE / DOUSE in SKILLS, a bonus action; while it burns a hit adds 2d6 fire, dealt
as fire on its own (fire resistance and immunity read it; a troll doesn't knit that turn); sheathing it in a swap, or
its wielder going down, puts it out; under the roost it won't light. Its light (40 ft) waits for darkness to be read.
**Cloak of Displacement** (a new CLOAK slot, the camp's; anyone can wear one): attacks at the wearer are at
disadvantage until a blow lands, then not till the wearer's next turn; nothing while they're held, stunned, asleep,
restrained or down.

**Gear in a fight** (09-27, Griz: "Don't add a button for gear swapping, but ... apply the action cost for weapon
swaps"; "at least one crossbow/bolts in the player inventory for all of deep16 modes"): every pack DEEP16 fights with
carries a light crossbow and twenty bolts (`SV.armoury`; the 8-bit save walking in is never written). On a hero's turn
the MENU has **EQUIP**: a weapon from the pack, or a shield off or on, each for the action (a swap is two object
interactions; the second takes the action). Armour doesn't change in a fight on the tabletop, but the ladder's test
bench allows it, for the action (09-27: "Allow for in-combat armor swapping on the non-climbing ladder"): ARMOUR OFF
and WEAR, with what the party has taken off in the pack; a climb (`o.climb`, not built) won't. Mage Armor ends when its
wearer puts armour on, and Aurdin's morning Mage Armor on the ladder costs a 1st-level slot. A hero's ranged weapon reaches to its long range with a clear line,
spends a bolt a shot, fires once an action however many attacks (Loading), gets no Great Weapon Fighting, and makes no
opportunity attacks. The ring: the rogue's HIDE is on the first circle, and ACTIONS is the same for all four (DASH,
DISENGAGE, DODGE, HELP), the rogue's Dash and Disengage being Cunning Action's while her bonus action is up.

**On a phone** (09-27, Griz: "can we add the d-pad and buttons for phone browsers?") the 8-bit game's pad comes up
(`js/core.js D.initTouch`; `?touch` forces it, `?notouch` hides it): the d-pad, A, B, MENU, END, zoom − and +, and
INFO (inspect what the cursor is on). On the board a tap points, a second tap on the same spot acts, a drag pans and
a long press inspects. Turned sideways the pad sits either side of the board; upright it sits below and the board is
small. What each spell does, against the tabletop: `../deep16-current spells.md` (reading-lamp format).

**The druid to twelve, step 0** (09-30, Griz 09-29: *"please complete druid to 12 (game probably gonna get to the big boys at some point)"*; 09-30: *"the above 9's we're just prepping in case we have combat involving special NPCs"*): the SRD's slot rows 10-12 (full, half and pact, `js/rules.js`), `NPC.MAXLVL` (the druid 12, every other class 9), the 4th cantrip at 10, the ASI at 12, Heal and Sunbeam on the druid's 6th; **Land's Stride** (6: nonmagical difficult ground costs nothing, advantage on Entangle's save) and **Nature's Ward** (10: poison, disease, and no elemental or fey charm or fright, where the caller names the source: `RU.immuneTo(u, cond, by)`); Wild Shape's flier at 8 (the giant bat, with the beast's STR/DEX/CON saves and senses). The ladder, the climb and the 8-bit cap stay at 9; the four meet a druid 12 at 9. Watch it: `?npc=druid:12&lvl=12`. Bench `mode=druid12`.

**The druid to twelve, steps 1-6** (09-30): **the summons** (`data/summons.js`: a spell's pool is the bestiary read by type and CR, so the world's new beasts join it -- Griz: *"Build a frame so that it's pulling those selections from a place where more to choose from might go as the world expands"*; Conjure Animals, Giant Insect, Conjure Woodland Beings waiting for a fey; the caster picks, one initiative for the lot, gone at 0 HP and with concentration); **the walls** (`js/walls.js`: Wind Wall, Wall of Fire, Wall of Stone, Wall of Thorns as a `B.walls` list the grid reads for passing, cost and sight); **Polymorph** (`features.js F.morph`: the world's beasts of the target's CR or level); **Dominate Beast**, **Charm Person**, **Animal Friendship** (the AI honours a charm: `ai.js heroes`); **Antilife Shell**, **Plant Growth**, **Cloudkill** (the Underdark circle's 9th). Benches `mode=walls`, `charms`, `druidlast`. Waiting, for Griz: Tree Stride (trees only on the road maps), the one-minute conjures (Conjure Minor Elementals, Conjure Elemental, Conjure Fey: cast before a fight, not in one; no mephits, fey or air/fire/water elementals drawn yet).

**The druid to nine** (09-29, Griz: *"we'll have to do her spells for at least up to 9 ... druid beast form ... and other class
features"*): the first zones that move -- **Moonbeam** (a 5-ft shaft of pale light, CON 2d10 radiant on entering it or
starting a turn in it; an action moves it 60 ft) and **Flaming Sphere** (a ball of fire, DEX 2d6 to whoever ends a turn
within 5 ft; a bonus action rolls it 30 ft and rams what it meets; it lights 20 ft) -- moved by casting the spell again,
as the spiritual weapon is swung (`js/grimoire.js` B.zones; `js/looks.js`); **WILD SHAPE** on the ring for a druid the
player runs, with the pick (wolf, wolf spider, axe beak; the giant frog from 4; the giant spider from 8) and **OWN SHAPE**
to end it (`js/features.js`); the **Circle of the Land's circle spells** by land, always prepared (`js/classes.js lands`):
Higertha's mountain, a generic druid's Underdark. `dev/bench16.py mode=zones` checks them. Still to build for the list:
summons (Conjure Animals and kin), walls (Wall of Fire, Stone, Thorns, Wind Wall), Polymorph, charm the AI honours.

## Not in the POC

Story beyond the entry card; shops; rests; writing back to the 8-bit save; flight (bats and cloakers
move on the ground). The visual crossing (the 8-bit frame gaining resolution at the door) is unbuilt. Levelling and
many maps and fights: see the ladder, above.

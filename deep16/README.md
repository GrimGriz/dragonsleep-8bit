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
  the menu -- since 10-06 the 8-bit's own (`../js/menu.js`, Griz: "ideal = identical menus"): the party panel with the grid's own figures,
  ITEMS, MAGIC and SKILLS lit as the ring lights them and handed to the ring's aim (10-07), EQUIP with PUT AWAY and the LIGHT, STATUS,
  OPTIONS (the MENU style, AUTO END TURN, END TURN ASKS, the pace, the volumes), CREDITS and the ways out (restart, the ladder, back).
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
- **The cursor keeps its level** (10-04 night, Griz: *"can we have it determine by the square you're moving onto the covered area from?"*): where a
  raised square and a lower one behind it both lie under the mouse, the one at the height the cursor came from is picked (`iso.pick`'s `prefZ`), so
  the roof is reached from the roof and the street from the street. Prone at END TURN with half the speed unspent, a hero stands first (Griz:
  *"if prone at end turn with movement left ... stand?"*), and a click on your own square while prone stands you at once (*"if prone with move
  left and click on tile your end stand"*); the start of a turn stood one already.
- **Zoom:** the screen is drawn at the window's whole-number scale, so zooming out steps by whole device pixels
  (at 3×: 1, 2/3, 1/3; at 2×: 1, 1/2) and stays crisp; the menus and the floating numbers keep their size. On a floor too big to fit
  at the smallest of those, far steps follow (10-04 night, Griz: *"can we have huge maps and another zoom level when we do?"*): whole art
  pixels to a device pixel (1/6, 1/9 at 3×), one after another down to the first that shows the whole floor, drawn smoothed (`js/ui.js zooms`).
  Huge maps: the drawing skips what is off the screen and sorts the map's props once (`js/iso.js`), so a 90×70 floor draws in under 10 ms;
  what a big floor costs is its load (the bake, about 2.3 s at 60×46 and 5.3 s at 90×70) and its floor canvas (26 MB and 56 MB). A floor of
  1,200 squares or more says BAKING THE FLOOR for a frame before it enters (`Battle.prototype.bakes`, `js/core.js D.push`), and at the far steps
  every standing figure wears a diamond in its side's colour, the active one ringed gold (`farMarks`), since a figure is five pixels tall there.
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
(`roost`) · the Ring of Binding (`ring`) · strung webs a map starts with · open-air ground (`ground: 'earth'`) · prone (knockdowns; up at half the move -- and, the SRD's 10-03, mid-walk too: knocked flat on the way it stands for half its speed if the walk has it, else crawls, 5 ft more a square; a prone target is advantage within 5 ft, disadvantage beyond, a reach blow's as much as a bow's) · swarms (resist blades and blows, bite for less at half).
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
- **Pipeline 1b, a printable model rigged** (`xorn_p1`, 10-01d): a free print model (CC BY / CC0) with its Blender sources, coloured,
  skeletoned and posed in code by `tools/<creature>-blend.py`, lit in the toon look (`tools/blender_look.py`, a figure's `"look":
  "toon:13"`), rendered by `render-sprites.py` like pipeline 1. The whole recipe, walked once on the xorn: **`deep16/blender-monsters.md`**.
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

**The roper's tendrils, and Ready** (10-02, `handoff-2026-10-01-the-tendrils-and-ready`; SRD 5.1 Grasping Tendrils, Ready): a
tendril that lands rides the grip as a thing of its own (`conds.restrained.tendril`: AC 20, 10 HP, immune to poison and psychic)
-- struck at with ATTACK on the held one's square, or your own while held (`battle.js tendrilOn`, `strikeTendril`: the weapon's
dice, no sneak or smite, a natural 1 on the friend), or BREAK THE TENDRIL on the ring (a DC 15 STR check, by the one held or
anyone beside; `exec breaktendril`), and the grip ends with it (`tendrilGone`). BREAK FREE is the grapple's escape and leaves
the tendril whole. A tendril lost is one fewer to throw till its next turn (`u.tendrilsLost`), when every one is back, free
(SRD 5.1; RULED 10-02, Griz: "go with SRD for combat" -- a party that cuts them all is never walked at, and never has to be);
with none to throw, every tendril holding, or no one in its reach it can hold (Freedom of Movement), the roper's reach is its
bite's and it walks in (`ai.js reachOf`, `usableOn`, `brute`). A tendril holding no one is not a thing to strike, nor a target
(RULED 10-02: "perfect, i assume also not targeted"). The dive after any blow it swung, hit or miss, is RULED kept ("it's what
people used to one will want anyway"). The class AI weighs
the escape, cutting the tendril and fighting on by the odds (`tactics.js freeHow`, `pEscape`, `pCut`), and a friend's break or
cut against its swing at the roper. **READY** (ACTIONS): one trigger, the first foe that comes within reach -- for a bow, a
thrown weapon or an attack spell, into sight and range -- and a single weapon attack, or an attack-shaped spell cast now and
held under concentration, its slot spent (`exec ready`; sprung by `readyHook` from a step, a burrower up, a phase spider out, a
spell's end, a blow from hiding; let go at the next turn, `rules.js startTurn`). **READY ends the turn** (RULED 10-05, Griz:
*"Making yourself ready and waiting to do it implies you've decided to wait for a trigger until your next turn and that you're
done moving and using bonus actions - but the action stored as reaction goes off if triggered on someone else's turn"*): the
move and the bonus action left go with it (`T.waits`, `heroTurn`), and a readied thing never springs on its readier's own turn
(`readyHook`, `readyOn`). **No spell readied after a bonus-action spell**, a cantrip neither (RULED 10-05: *"Casting a spell with
a bonus action means you can't ready a spell (other actions still ready-able)"*); a leveled spell readied marks the turn's
`spellAction`. Benched: `ready1005`. The class AI and the plain guests ready
against a foe under the ground or out of the world (`tactics.js readyWanted`, `readyUp`). The bulette bites and dives again
with the move it has left (`ai.js diveAfter`, data/foes.js `diveAfter`), the opportunity attacks of those beside it first
(`battle.js provoke`); it dives only after a turn it struck at someone (`turn.attacked`), and a burrower with no square its
body fits in beside anyone (a target boxed in by the walls and the fallen) comes up as near as it can, within a stride, to
fight on its feet. A creature with blindsight knows a hidden one inside its reach (`ai.js heroes`), and one that comes up
finds the hidden it sees clearly (`rise`): the Breach stalled on both. Benched: `dev/bench16.js` modes `tendrils1002`
(his test among them: the party at a distance cutting every tendril, till it walks in to bite) and `ready1002` (the
Breach itself), both in `dev/check.py`'s gate; `mode=trace&fight=<id>&rounds=N` runs a fight to a round cap and prints
the log's tail and every unit's state, for a fight that never ends on the bench.

**The Edifice** (10-04 night, `data/maps.js` edifice, 60×27): the exterior -- Fountain Street along the foot of Sólskaft's facade as the 8-bit map has it, the
facade 45 ft, and on top the roof of skylight glass (`G`, walkable; `iso.js` bakes it as leaded panes with the orchard on the floor below showing through, and
the Sunshaft's circle from the map's `shaft` -- the orchard painted first, the glass a thin tint and a gloss over it, each tile's edge in thin silver). The
arches' tops are 15 ft sills; a grapple from a sill reaches the rim; the dwarves' rope hangs 45 ft at the
west end; the mountain's waterfall comes down the back wall's face (a map's `falls`, painted by `rockCanvas`) into water at its foot, and the
Sunshaft's circle lies under it at the roof's middle. The vault door on the street and the roof's hatch above it are a `passage` (GO IN / COME OUT
on the ring, or asked when a walk ends on either: the rest of the turn's move, half the speed at least; Griz: *"Front doors possible?"*), shut unless the
fight opens them (`passages: true` on the fight, or `&doors` on the URL; Griz: *"turned off by default"*).
Griz: *"It's supposed to be external and the third floor is internal tho possibly visible to the skylight glass that should make up the majority
of the 4th floor/3rd floor ceiling."* `deep16/?npc=<foes>&vs=<party>&map=edifice`.

**Footholds, big bodies, slow climbers** (10-04 night; `js/grid.js` G.faceKind, G.climbDC, G.bigLimit, G.hanging; `js/battle.js moveAlong`; `js/ai.js`): a map's
`faces: [[x, y, w, h, kind]]` names squares whose face is *rough* (no check to three steps, the DC 4 easier) or *slick* (the DC 5 harder); the Edifice's arches are rough.
A body bigger than Medium climbs its own height and 5 ft by hand (a Large 15 ft, a Huge 25 ft; the map's `climbLarge` overrides), and that much is a pull-up with no
check (Griz: *"for creatures > medium their climbing 5 feet is their top 5 feet?"*). A climb speed is the feet of face a turn (`climbs` on the block; the turn's
`climbLeft`): a face taller than that, the climber takes as far as it goes and clings there, and the AI climbs on next turn (Griz: *"a slow climb speed, like they're
forcefully digging their way into the walls"*). The troll and the stone giant carry `climbs: 10`, ours, not the SRD's: 45 ft in five turns, hanging on the stone between.

**The defend fight** (10-04 night, `&defend` on the class floor, or `defend: true` on a fight; `data/maps.js` edifice `skylight`; `battle.js` enter, hurt, over; `ai.js`
brute): the map's skylight stands on the field as a thing of the party's side -- AC 13, 120 HP, a damage threshold of 8 (a blow under it glances off), resistance to
everything, no turn and no figure, ringed on the glass with its hit points under the strip -- and every foe's mission: it goes for the glass unless one of ours stands
within its reach. Broken, the Edifice is breached and the fight is lost. Griz: *"make the glass above the hole their target with a high damage resist that they'd
eventually beat through - like they're trying to make entry into the dwarven place and this is a defend mission."* A clinging climber hit makes a Dexterity save (DC 10
or half the damage) or loses its hold and falls what it climbed (ours; the SRD has nothing for a climber). The vault's door squares are `d` thresholds with the doorway
painted on the face above; four fountains stand against the facade's foot -- a 3-square pool of water (waded, difficult) ringed by a one-step rim, the spout a hole
flush in the face at 10 ft (`spouts`) pouring into it -- and no moat before the vault. The arches' sills are gone: by hand nobody climbs the facade.

**The Skylights, shown** (10-05 night, Griz: *"can you script a 'show me' like the art render windows do - where we test all the things we added/changed/reverted in the
edifice fight today (current only)"*): `deep16/?skyshow` (`js/skyshow.js`; `&beat=N`, `&only=lane,booth`, `&fast`, `&lvl=N`) -- eleven beats on the Edifice's own map and cast,
each staged where it happens and run by the engine itself, the dice pinned where a beat needs a roll to go one way (its card says so): Hallvör's own lane; under a climber
and the giant down on the one under (from 7.5 ft no dice, then from 10 ft the 1d6 split); the Shove; the rock at the edge and the Dunking Booth; the whistle, her call and
the spiders; a spider down the face to a climber; a troll at 0, Pyro's flask and "Torch him!", and a torch from the barrel; the class AI to the barrel by itself; Shatter alone on the glass; Pyro's handaxe; READY ends the
turn. Each beat checks itself; the last card is the tally (`B.skyReport`; `dev/bench16.js mode=skyshow`, in `dev/check.py`'s gate). Also that night: **Hallvör's lane**
(`fights.js` `climbAt: [13, 16]`, `ai.js brute`): she goes up the west bay, not the column beside the vault doors (the bench had her there, throwing a rock, in 32 fights
of 32, and the party came out at her feet into her opportunity attacks); **her rocks never at the glass** while she guards the roof (`volley`, as her blows); **her call**
a recorded clip, `deep16/audio/come_on_down.mp3` (Windows' Zira, pitched down; the browser's voice was silent in Brave), the browser's voice its fallback; **a foe's
Athletics** from its block (`battle.js makeFoe`: the stone giant's +12 never reached the unit, so the Shove rolled +6); **Sculpt Spells** spares other creatures only
(SRD 5.1: never the caster, never an object -- the glass had been sculpted out of Aurdin's Shatter); the thrown torch's card says where it lands (at its feet, N ft
away: the distance is the thrower's, not a scatter); the play record inside the 8-bit game (`embed.js`); and **the torch barrel** (Griz: *"1 barrel yes 2 barrel yes"*, the barrel the answer to Pyro's "Torch him!"): `maps.js` edifice `torchBarrel: [22, 30]`, a crate in the rail fence behind the houses south of the street (moved there the same night, Griz: *"please move the barrel to 22, 30 (behind the house to the right of the path to the doors)"*; it stood by the vault doors) -- TAKE A TORCH beside it, a lit torch, the turn's free object (RULED: *"no, that's good"* to an action instead), never empty (`battle.js` exec 'barreltorch'); the class AI walks to it and throws for a troll that has not burned (`tactics.js barrelTorch`). A torch under a troll lying on it stays there (RULED the same night: *"3 we can leave it no"*).

**Hidden, beside a foe** (RULED 10-04 night, Griz: *"one line, but lose stealth on successful hit (it can tell where you are from the force of the blow and
it's not invisibility, just hide)"*): an attack at a hidden target has disadvantage at any distance (`rules.js RU.edges`; it was beyond 5 ft only, 09-28's
'heard and felt'), a foe beside her still knows where she is and swings (`ai.js heroes`), and a hit finds her: no longer hidden (`battle.js attack`).

**Ropes and rungs** (10-04; `js/grid.js` ROPES, `js/battle.js` exec 'rope', 'ropeclimb', 'takerope', 'cutrope', `js/ui.js ropeRung`): a map's
`ropes: [[ax, ay, fx, fy]]` hang from the top of a face to its foot, and the party's Rope & Grapple sets one (the item wheel: tied off from up
top, or thrown as far as the rope is long, 50 ft, at DC 10 DEX to 30 ft and 2 more each 5 ft past -- 10-05). Along a rope no check and no fall, at the SRD's double cost (10 ft of movement a 5 ft rung; the climb goes by 5 ft since 10-05, Griz: *"any reason not to do the climb in 5 ft increments instead of 2.5?"* -- *"1 yes"*; the maps keep their 2.5 ft steps for the drawing and the ledges). **The rungs**
(10-04 night, Griz: *"I can't currently target half-way up the rope with a highlighted wall and choose that as my intentional move"*): the mouse
on the roped face picks a rung at a time, every 5 ft -- the face outlined, the rung across it, where the figure will hang marked with the height and
the cost -- and the click climbs or lets down to exactly there and hangs, from the foot, the top, or where it hangs already (any rung, or the
ground). **The grapple's square** (Griz: *"if one clicks on a square where a grapple is they should be able to take it (unless someone is on it -
in which case I think they'll attack it if that's not an ally)"*): nobody on it, a click from beside takes it up into the pack for the action (or
steps there, asked), and standing on it the ring's TAKE THE ROPE; a foe hanging on it within the weapon's reach, the click strikes the rope (AC 11,
2 HP) and cut, the foe falls; an ally on it, the square is a square. Standing on the grapple's square, the click asks first (TAKE IT UP / NOT NOW), and
TAKE THE ROPE sits on the ring's own face (10-04 night, Griz: *"never managed to take up the hook, standing on it makes me select character?"* -- it had
been filed under ACTIONS where nothing listed it). A map's `ropeBucket: [x, y]` (the Edifice: a crate in the alley at the side of the house by the south road, (26,25) since 10-05 -- Griz: "rope bucket to 26, 25 side of the building") hands anyone of ours beside it a
Rope & Grapple for nothing, one a turn, never the last (TAKE A ROPE; Griz: *"an endless supply of rope and grapple while on the map"*). A creature with a
climb speed pays the SRD's climb -- the height, 2.5 ft a step rounded up to the 5 -- not the square's 5 alone, and the AI's far route may take a single step
a Dash would pay for. Benches `mode=rungs1004`, `mode=edifice1004`.

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
interactions; the second takes the action); and since 10-07 the free hand's own -- the weapon PUT AWAY or DRAWN, and LIGHT: a torch or
lantern from the pack lit in hand, or the one held set down, thrown, put out, hooded -- each the ring's own command at its own cost. Armour never changes in a fight (SRD 5.1: a minute or more to don or doff; RULED 10-07, Griz: "SRD everywhere" -- the
ladder's 09-27 ARMOUR OFF and WEAR cut, his "I suspect my ladder exception was prior to the camp or an oversight"); the camp's
EQUIP changes it before a rung, free, and the menu's ARMOR row in a fight says "Armour: not in a fight." Mage Armor ends when its
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

## The Pocket DM (alpha) -- `?pocket` (10-02)

Griz, 10-02: *"the something page calls the class floor the pocket DM, but really it's this test runs page. In the style of 'the ladder' create a
user friendly interface that apparently does everything through the power of a URL (or build something new actually called the pocket DM
(alpha)"*. `js/pocket.js`, a scene of the grid's own in the ladder's look, over **Solskaft's clan hall drawn at 16-bit for the first time** (his
pick for the backdrop: *"the oathstone under the skylight"*): the dais and the empty high seat at the north end, the oath-stone before it with
its band of gold worn bright at hand height, the Sunshaft's noon coming down onto it with its motes (wiki/solskaft.md; the 8-bit's colours,
`../js/art.js`, and its beam, `../js/world.js drawBeam`). **Every fight it makes is a class-floor URL** (`?npc=...&vs=...&lvl=...&map=...`) it
shows and copies, so a fight can be sent and re-run. The title has START, FIGHTS (the record), USEFULS (the ladders, the climb, the galleries,
the pages beside the game, the Discord) and THE 8-BIT GAME; the 8-bit title has POCKET DM (ALPHA).

- **The party** (his: *"choose party size (I think our limit is 6?) by having 4 characters - defaults are fine. Arrows on the top and bottom
  cycle through existing characters - but make them unlock pyro - and a question mark slot"*): four seats to start (Barley, Aurdin, Vivian and
  Lymen at 3), one to six. The arrows cycle the roster: the four, the guests (Brann, Hedda, Halldor, Ingrith, Dace, the trooper -- each at its
  register's level or higher), the named (Talmok, Willem, Katarina, Torvald, Higertha, Amara; the grown builds), **Pyro, LOCKED till the trial
  is won** (then at his 12, run by his own script, his gear his own: *"they can play him but not see or change his gear"*), your own, and the
  **?**. Level 1 to **8** (his cap) under each stock card. The words: `js/classes.js` NPC.spec -- `barley:3`, `talmok:5:grown`, `+item`, `~codes`.
- **The maker** (the ?, his order: *"pick a race & class & set stats, etc. make them put the stats in (etc) before they choose the characters
  level. Let them pick gear ... and let them save those new characters"*): the SRD races and the twelve classes; the six scores **from ten, arrows
  3 to 18** (*"sort of hoping people rebuild their table characters"*), the race's numbers on top; the level 1-8, the ASIs with it; the gear from
  the mundane racks by proficiency (*"generic kits per class"*; THE KIT puts the class's back); a caster's spells from the class's list, the built
  ones, to the counts its level knows (*"classed based, SRD - what we don't have"*); a name. Saved to the roster (`deep16.pocket`), EDIT on its card.
  A made character is a `~` word: `~fighter.5.dwarf.16-14-16-10-12-8.greatsword_chainmail___handaxe__.Brokk` (NPC.decode / NPC.code); a max hit
  die a level, as the heroes.
- **The map:** every grid map but the Settling's and the test ground, the **DARK** ones said so and shown so (the preview greyed to the darkvision
  look but for their lamps), or the **?**, a random one.
- **The dial and the roll** (his: *"give them a CR slider and a re-roll button, and have a subroutine randomly put in monsters we have in
  existence that add up to that CR"*): the CR is **the sum of theirs**, 1/8 to 40; beside it the DMG's reading for this party (the adjusted XP, the
  crowd multiplier, EASY / MEDIUM / HARD / DEADLY xN); REROLL draws again. The pot is the bestiary less the story's named (Talmok, Torvald, Hask,
  the Keeper), CR 0 and the familiars; **Willem and Amara in it when not in the party** (his word); a thing bound to water only where the map
  has water; no more heads than the map has room for. The dial starts where the party reads HARD. WATCH hands your side to the class AI.
- **The ladder** (his: *"a button that auto-fill the next map with a reasonable increase in CR (randomly generated 4-rung ladder) where they get
  'short rest for the wicked' shown and applied to their party before the next map loads"*): THE LADDER: 4 RUNGS FROM HERE takes the dial's table
  first, then three more at **a third again each** on maps drawn fresh. Between rungs **SHORT REST FOR THE WICKED**: the fallen up at 1 HP first
  (the DM's hand; his: *"SRD + free rez for the fallen before the short rest applies"*), then **hit dice till whole or out** (one a level a run,
  d(hit die) + CON each), Second Wind and Action Surge, Channel Divinity, Wild Shape, ki, a bard's inspiration from 5, a warlock's pact slots
  back, a wizard's Arcane Recovery once a run (SRD 5.1). What a fight leaves (HP, slots, features) walks into the next (NPC.carry). After the
  fourth win **LONG REST FOR THE TRIAL** (whole), then **the trial: double deadly** -- the smallest table whose adjusted XP is twice the party's
  deadly threshold (his: *"give them a 'long rest for the trial' after the fourth win and then do your double deadly"*). Win it and **Pyro joins
  the roster**. A loss: **QUIT, RETRY or REROLL THE RUNG**, the party as it went in (his: *"restored to what they went in with before they died"*).
- **The table's file** (10-06, his: *"I couldn't seem to save a roster and saw no place to load a ladder save"*; *"yes to 1 & 2"*): **SAVE TABLE** and
  **LOAD TABLE** on the title (reachable mid-ladder) and on THE PARTY write and read `pocket-dm-table-<date>-<time>.json` -- the seats with their
  winnings, the characters of your own, Pyro, and the ladder under way. A ladder keeps itself in this browser between visits (`deep16.pocket`);
  the file takes it to another browser, the live site from a local one, or past a cleared storage. LOAD adds the file's characters (none here
  lost), points the seats at them, takes the ladder -- asking first if it would put away one under way here -- and still reads a roster file of
  10-03's (`pocket-roster`). SAVE ROSTER (greyed till a character of your own existed, and silent about it) is gone from the screens; a greyed
  button now says why when pressed.
- **The winnings** (his: *"pick a random character on victory and give magic item appropriate to class"*; *"not pyro"*): on every win one of the
  party, drawn at random, finds a thing the class may wear and is better than what it has -- the plus-ones (a weapon of the kind in hand, the
  armour of a weight worn, the Ring of Protection, the Cloak of Displacement), the +2s, Flame Tongue, the Door-Shield and the dwarven plate from
  the third rung and the trial. Worn at once: `+item` on a stock word, in the gear slot of a `~` code.
- **The record** (his: *"Save the fights and give them a way to send their fights with a notes section"*): every fight is recorded (`js/record.js`,
  `deep16.plays`) and summarised in `deep16.pocket` (the last 60): FIGHTS lists them; NOTES is a field over the canvas (the game hears no key
  while it is typed in: `core.js D.typing`); SAVE A FILE downloads the summary, the notes and the play record as one `.json`; COPY the summary;
  EMAIL GRIZ opens a mail with it; THE DISCORD copies the summary and opens https://discord.gg/VDxa5hkA3x; URL copies the fight's.
  **On the tester ladder** (`?ladder&party=ours&play`): R saves every kept fight (the last 40) to `deep16-play-record-<date>-<time>.json`, and
  after a save **C / CLEAR RECORD** (top right, with a question first; E clears, X keeps; 10-04, his: *"add a 'clear record' after you save on the
  ladder"*) takes the fights that file holds out of the browser -- those and no fight played since, and nothing before a save. Each R writes
  the whole record, so an uncleared one repeats in the next file; `python dev/merge-play-records.py` folds the saves in `play-records/` into one
  `deep16-play-records-combined.json`, each fight (its `fight` and `started`) once, the folded files moved to `play-records/merged/`.
- **Bench:** `python dev/bench16.py x mode=pocket1002` (in `dev/check.py`'s gate): the words, a `~` code round-tripped, the ASIs with the level,
  the pot and the roll summing to its CR, the DMG reading, the rests, the winnings by class, a fight by the Pocket's words with a carry, and a
  table of Large and Huge foes seated whole (`battle.js seatBand` honours a footprint now).

## MPMon, the Monster Party Monster -- `js/mpmon.js` (10-06)

Griz's stream table on the grid. Monster Party is his own game, played live with the hivemind (`..\..\monster-party-prep\`): four
persistent PCs, a regular blow each and two specials, 2 specials an encounter, every number a per-level formula. Griz, 10-06: *"MPMon
(MonsterPartyMonster) as a separate class to keep our hands clear of the other machinery"*; *"Make the projection a 3rd ability/feature
that unlocks at level 5"*; *"Denny Race Lobstamonkee"*; *"Come up with a level 5 for him that is loosely 'balanced' with what player
classes get at level 5"*; *"Build now"*. The design and its arithmetic (Monster Party's numbers to the SRD's scale by 0.27):
`..\..\beholda\deep16-translation.md`.

- **A class of its own, in one file.** `js/mpmon.js` registers `mpmon` (R.CLASSES), its natural weapons and hides (items kept off the maker's
  racks), two named builds (NPC.NAMED: any level 1-9), and wraps what it needs -- NPC.sheet/unit, RU.ac (the bubble), RU.edges (the taunt),
  R.weaponAbil (a WIS weapon), F.commands/exec (the ring), F.classLine, the item list (no hands), LK.ground/over (the looks), the Pocket
  DM's seats and short rest -- as `js/familiar.js` wraps. The class code it touches: one line each where Confusion's turn is taken
  (`ai.js`, `battle.js`: DOMINATED), where the Ring of Binding turns a brute (`ai.js`: TAUNTED) and the class AI's `foesOf` (`tactics.js`),
  and the one-shot rows (`ui.js`). The Pocket DM's maker does not offer it (its classes are NPC.CLASSES').
- **THE SPECIALS:** a pool a fight, shared, back on a short rest: 1 at 1st, 2 at 3rd, 3 at 5th, 4 at 7th, 5 at 9th (MP's "2 specials per encounter" grown with the level; RULED 10-06, Griz: *"3 at level 5, 4 at 7, 5 at 9 down to 1 move at lvl 1"*).
- **DENNY**, a Lobstamonkee (climbs 30): MONKEY FISTS (1d6 + STR, 1d8 with both hands free), AC 14 in his denim jacket, d10.
  TAUNT -- his swings (+1d6 on the first that lands, 2d6 at 5th, 3d6 at 9th); then the one he swung at and up to his proficiency
  bonus more within 15 ft save WIS (8 + prof + STR) or are TAUNTED till their turn ends: the AI goes only at him when it can, and anyone
  taunted has disadvantage on attacks at anyone else. DENIM DAMAGE -- his swings, the first that lands +1d8 (2d8 at 4th, 3d8 at 6th,
  4d8 at 8th), doubled on a critical. **At 5:** Extra Attack and CANNONBALL -- a leap of up to 20 ft (no opportunity attacks) beside a foe,
  every foe beside him DEX (8 + prof + STR) or 2d8 bludgeoning and prone (half and standing on a save; 3d8 at 9th), then a swing.
- **BEHOLDA**, an EyeGregore (hovers at 25 ft, darkvision 120, no hands: a potion held to her, no flask, no kit), AC 14 hide, d8.
  DICE SLAM -- her dice swung on her will, 1d8 + WIS. VNA BUBBLE (a bonus action) -- 10 ft + 5 a level (at most 30), +1 AC and 1 more
  for every two levels (at most +5) to her and her friends inside, till her next turn; it pops when she is stunned or down; Griz's bubble
  art (`art/vna-bubble.png`) round her, its reach on the floor. BALEFUL GAZE -- one she sees within 60 ft, WIS (8 + prof + WIS): 1d8
  psychic a level and DOMINATED till the end of its next turn (it goes at the nearest of its own side it can reach), half on a save; one
  proof against charm takes the damage only. **At 5:** THE BIG SCREEN -- the projection, a 30-ft cone at one she picks, (level - 1)d8 and
  dominated, half on a save.
- **RASCAL**, a Lobstamonkee (climbs 30; 10-06 late, the third build): MP's Social PC, so CHA is his stat -- his DC and his blow are by it.
  FIRE BOLT, his regular blow (Griz: *"He'll range attack with a cantrip like Aurdin"*): a spell attack, 1d10 fire at 120 ft, 2d10 at 5th;
  PINCH, the claw, 1d6 + STR when something is on him; AC 14 shell, d8. SOCIAL SHARING (an action) -- the hat comes off and he bows: up
  to 1 + prof friends within 30 ft each get a Social die (d6, d8 at 5th, d10 at 9th) for a roll that needs it (the bard's die, spent where
  it turns a miss into a hit or a failed save into a saved one). SOCIAL FLAME -- a ball of fire round one he sees within 60 ft, 10 ft out
  (15 at 3rd, 20 at 5th): everyone in it, friends too, DEX (8 + prof + CHA) or 1d6 fire a level, half on a save. **At 5:** SOCIAL
  DISTANCING -- a 30-ft cone: each foe in it WIS or 2d8 psychic (3d8 at 9th) and FRIGHTENED of him till its turn ends (it gets away;
  disadvantage on attacks while it sees him), half and unshaken on a save; set against Fear, the wizard's 3rd-level spell at 5. His word
  on the three (10-06): *"love it"*, *"action seems right"*, *"Build it"*.
- **Doors:** `?npc=goblin,goblin,hobgoblin,hobgoblin&vs=denny:5,beholda:5,rascal:5&lvl=5` (yours to play: SKILLS on the ring; `&watch`
  for the class AI); the Pocket DM's roster has all three seats; **`?mpshow`** shows the nine specials one beat at a time (`js/mpshow.js`,
  the dice pinned, each beat checked; `&only=`, `&beat=`, `&fast`, `&lvl=`).
- **Looks:** `beholda_p3` (10-07, her look since) is her second sheet cut whole (`tools/beholda-p3.py` over `tools/sheetrows.py`: the
  turnaround for the idle by facing, Hover the walk, Dice Slam the attack, the VNA Bubble her `cast`, Baleful Gaze, Spot (Eye On It),
  Spotlight, Flinch, Fall the hurt, Prone; she floats, the lowest die 6 px over the floor in every frame, and the fall sinks her to it;
  the rows at one size by her body's radius, the turnaround and the fall drawn a little bigger and brought to it); `denny_p3` (10-07)
  is his third sheet in two (`tools/denny-p3.py`: the Punch his attack, Taunt, Denim Damage, Cannonball -- its 6 and 7 one landing in
  the dust, a wide cell, played at the floor while the engine throws him --, Guard (Bodyguard), Lobstah Hug, Climb, Flinch, Fall, Prone;
  the two sheets at one size by the front views and the head, his walk his second sheet's at the same scale); Spotlight and the Hug wait
  their rows out before the idle (`rowWait`). `beholda_p2` (her first sheet's stand-in, `tools/beholda-sheet.py`) and `denny_p2` (his
  poses as rows, `tools/denny-sheet.py`; Barley's look in the Ledger fight) stay on disk; `rascal_p2` (10-07,
  his look since) is his second round cut whole (`tools/rascal-sheet-p2.py` over `tools/sheetrows.py`: sheet 1 redone with the felt's
  face and a charcoal hat, sheet 2's Fire Bolt as his `cast`, Social Distancing, Hot Take and Going Viral rows, the bow from sheet 3; the
  rows face left so the claw arm shows; each row sized by his hat's brim, the one rigid thing he wears -- the generator drew the rows at
  their own sizes); `rascal_p1`, his first sheet (`tools/rascal-sheet.py`, the whiskers through his hat erased, the hat lost to the
  navy), stays on disk till he has seen p2; `goose_p1` is his three generated sheets cut by Griz's picks (`tools/goose-sheet.py` over
  `tools/sheetrows.py`: each sheet cut by its own row and number labels, the rows mixed frame by frame, each sheet at its own scale by the
  torso's thickness, small -- his idle about 38 px to Denny's 52 --, the cast's glow the heal's green; no build plays it yet). Their next
  sheets' prompts are in `deep16-art-wanted.md`. **`tools/sheet-play.html?sheet=goose_p1&ref=denny_p2`** plays a sheet's rows, four
  facings, another sheet's idle beside for size, before any build does.
- **Bench:** `python dev/bench16.py x mode=mpmon1006` (in `dev/check.py`'s gate): the builds against the design's tables, each special by
  its rule with the dice pinned, the ring, the Pocket DM's seats and rest, a whole fight, Fire Bolt with the specials spent, and the
  show's beats run twice, at 5 and at 9.

### THE MASCOT (10-06 night) -- the class as races, a class and four roles

Griz's rulings verbatim are in the MPMon lane (`..\..\handoff-2026-10-06-the-monster-party-monsters.md` §6). Where the section above says
otherwise, this stands.

- **Named:** the class is the **Mascot** (R.CLASSES.mpmon's name; the code key stays `mpmon`). **The races:** `MP.RACES` -- the Lobstamonkee
  (humanoid, walk 30, climbs, Athletics), the EyeGregore (**fey**; she **floats** -- the grid's flier today, one layer, 5 ft, at most when
  flight at a height lands; darkvision 120, no hands, Perception), shaped as NPC.RACES entries but kept out of the maker (his: *"we'll let
  them unlock the 3 as they are"*). **The roles:** `MP.SUBS` -- **Tank** (Denny, STR), **Buffs** (Beholda, WIS), **DPS** (Rascal, CHA),
  **Heals** (Goose, WIS -- *"the key ability is LOVE... which we'll say is wise"*; built 10-07, below). The specials dispatch
  on `u.mpSub`.
- **The levels:** 1 the two core specials, the setup one a BONUS action (Taunt -- no swing of its own now --, the VNA Bubble, Social
  Sharing); 2 a free bonus move; 3 a passive; 4 an ability score; 5 the third special; 6 a reaction; 7 the fourth special; 8 an ability
  score; 9 THE HIVEMIND. Free moves and reactions spend nothing from the pool; the passives' and reactions' uses are the proficiency bonus a
  fight, back on a short rest (`MP.refill`).
- **THE GROWTH:** every special grows a step a level after it comes, its power on the even levels and its reach on the odd (his, for
  Social Distancing: *"DamageDie or static + at 6, radius at 7, repeat"*), sized to land at or under the first pass's at 5 and 9 (`MP.pw`,
  `MP.rc`; the numbers beside each formula in mpmon.js). Taunt 2 foes in 10 ft -> 4 in 20 at 5th -> 6 in 30 at 9th; Denim +1d6 -> 3d6 -> 5d6
  and its KNOCK (5 ft a reach step, from 3rd); Cannonball 2d8 -> 2d8+4, the leap 20 -> 30; the Bubble +1 -> +5, 10 ft -> 30; the Gaze 1d8 ->
  3d8 -> 5d8, 30 ft -> 90; the Big Screen 4d8 -> 6d8, the cone 30 -> 40; Sharing d4 x1 -> d8 x3 -> d12 x5; Flame 2d6 -> 4d6 -> 6d6, 5 ft
  round -> 25; SOCIAL DISTANCING is the ring round him now (*"clears the 8 square donut around him"*): 2d8 -> 4d8, 5 ft -> 15, every foe in it
  SHOVED out of it and frightened on a failed save.
- **Denny, the Tank:** 2 MONKEY FLURRY (one more punch after the Attack action); 3 STAND FIRM (advantage on saves against prone and on
  STR saves, and on breaking a grip); 6 BODYGUARD (the Protection style without the shield: battle.js reads `bodyguard`, the player is
  asked); 7 LOBSTAH HUG (STR or HELD: grappled and restrained, taunted to him, squeezed 1d8 + STR at the start of each of his turns).
- **Beholda, Buffs:** 2 EYE ON IT (the Help from 30 ft); 3 LUCKY DICE (a friend within 30 ft who rolls a 1 on an attack or a save rolls
  again); 6 EYE CONTACT (Cutting Words' shape: 1d6 off a foe's blow that would land, on its own); 7 SPOTLIGHT (a friend Hasted till the end
  of its next turn, no lethargy).
- **Rascal, the DPS:** 2 SCUTTLE (Dash, Disengage or Hide as a bonus action; `cunning` on him); 3 SPICY (CHA on Fire Bolt's damage); 6 HOT
  TAKE (Hellish Rebuke's shape: 2d10 fire at one that hits him, the player asked); 7 GOING VIRAL (fire foe to foe, 3d8, three of them).
- **GOOSE, the Heals** (10-07; a Lobstamonkee on his sheet `goose_p1`; the draft the race-and-class seat wrote and he passed, and his
  *"his specials should mainly be green energy"*): WIS his stat; d8, CON 10, AC 14; his blow the SLING, 1d4 + WIS at 30/120 (*"yes,
  historically a sling"*). 1 HEART TO HEART (a bonus action: a friend within 30 ft or himself, 1d6 + WIS; 60 ft and 3d6 at 5th, 90 ft and
  5d6 at 9th; the down get up) and GROUP HUG (an action: every friend within 15 ft of him, him too, 1d4 + WIS each; 25 ft and 3d4 at 5th,
  35 ft and 5d4 at 9th) -- both names the seat's; 2 HONK (free: a foe within 30 ft that can hear him, its next swing at disadvantage,
  Vicious Mockery's mark); 3 BIG HEART (his level on each heal: Disciple of Life); 5 FOUNTAIN (his "Cleanse as 'Fountain'": within 30 ft
  the worst of Lesser Restoration's ailments ended and 1d8 + his level); 6 NOT TODAY (a reaction, once a fight, on its own: a friend
  within 30 ft whose blow would drop it stays at 1 -- js/battle.js's Death Ward stop, lent for the blow); 7 LIFELINE (his *"LifeLine
  chooses recipient ally (can tie denny instead of self)"*: a friend tied the fight long to a second, himself or another, who takes half
  of every blow on it; a green thread on the floor; +1 AC and saves to the one tied at 8th). Every heal is the jump with the glow (his
  cast row) in js/fx.js's heal greens.
- **THE HIVEMIND, 9th** (RULED, Griz: *"Denny's activation damage resist for the whole party 1d6, behold 1d6 to hit, rascal 1d6 damage,
  goose 1d6 temp hp - except goose, all apply to next 'special' each char uses (not other moves)"*): each 9th-level Mascot gives every Mascot
  on its side its role's token for that one's next special -- the WARD (1d6 off each blow on it till its next turn), the AIM (1d6 on the
  special's attack roll or off each save against it), the HEAT (1d6 on its first damage roll) -- and the Heals' 1d6 temporary hit points
  at once. When it fires is the seat's lean, asked of him: at the start of each round.
- **Aimed, no popups** (his: *"the abilities weren't using the normal targeting - it had the menu popups again"*): the ring's buttons carry
  `aim`, a spell's geometry, and `js/ui.js` aimCommand hands it to the spell aim -- the cursor, the area on the floor, the click.
- **Locked on the Pocket DM's roster** (*"All locked for now with a flag we can switch"*): hidden till an egg gives one (`st.mascots`; the
  eggs are to come: Denny for the first character made, Beholda for the first battlemap edited); **`&mascots`** on the Pocket DM's door
  opens all four for testing.
- **Doors:** `?mpshow` (5th: the core and the 2nd-3rd moves) and **`?mpshow&lvl=9`** (all 28 beats: the 6ths' reactions, the fourths, the
  Hivemind); Goose's alone: `?mpshow&lvl=7&only=heart,group,fountain,honk,nottoday,lifeline`. By hand:
  `?npc=goblin,goblin,hobgoblin,hobgoblin&vs=denny:5,goose:5&lvl=5`.

## Not in the POC

Story beyond the entry card; shops; rests; writing back to the 8-bit save; flight (bats and cloakers
move on the ground). The visual crossing (the 8-bit frame gaining resolution at the door) is unbuilt. Levelling and
many maps and fights: see the ladder, above.

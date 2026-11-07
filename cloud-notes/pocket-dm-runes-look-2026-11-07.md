# The Pocket DM's runes: a look (2026-11-07, a side seat of the lanes desk, config echo claude-opus-5-5)

His ask: let a DM walk or fly a map, "cast a spell" that places a bound unit at a start square for when the players run his module, and click the placed rune to remove it or set a posture (wait and ambush, patrol, defend). How it saves, and whether the module system needs changing. A LOOK: nothing built, committed or pushed. Paths are under `dragonsleep-8bit/deep16/`. HEAD was not pinned (nothing written to the repo).

## What exists

- **No map walk in the Pocket DM.** The DM sees a floor only as a still picture behind THE LOCATIONS' list (`js/pocketdm.js:449` PD.backdrop -> PD.drawFloor). The nearest things to a walk:
  - `js/view.js:83-115` MapView, a cursor walked round a floor by keys and mouse with D.iso.pick and a rhombus. The door `?view` is hard-wired to 'cavern' (`js/main.js:82`). Figures are drawn as placeholders.
  - The roam (`js/roam.js:172` R.make) is a Battle with no turns (`:279-281` order/active/req cleared), drawn by the grid's own renderer, with a `B.floorMarks` hook for marks on the floor (`:283`, drawn at `js/ui.js:1424`). It walks only the Wet, Silverton and the mines' floors (`:182-184` throws on any other); no D.MAPS id.
  - Fly: a flier's move picks a tile at its own height (`js/ui.js:95-96` UI.flyer and UI.layerZ, `:585-591` D.iso.pickAt). That is the piece to reuse for a DM cursor that rises a level.
- **Bound units.** A purchase is a receipt (`cp.bought`). Receipts picked and bound make ONE unit (`js/pocketdm.js:129` PD.bind, `{ id, members: [{kind, paid}], at }` in `cp.units`). BUILD fills a slot's CR with whole units, newest first (`:148` PD.fill), and the slot keeps `units: [ids]` and `mine` (how many of the foes are units, which come first in `foes`) (`:196` PD.addSlot). The DM cannot pick which unit goes where: the fill chooses. R on a slot row fills it again (`:826`).
- **Cast at a square.** `js/ui.js:916` spellAim sets `B.tool='spell'` with the spell's shape (`:448` aimStart, `:468` aimInput). A prompt that picks squares already exists: Rootdrag's (`js/grimoire.js:806` `squares: true`, read by `js/ui.js:519` pickInput). The rune's "cast" and its click-menu can both use that prompt card.
- **How a Pocket fight seats foes.** Battle `npc.foes` (`js/pocket.js:690`) are built and handed to `js/battle.js:259` seatBand, which puts them on the walkable squares farthest north that a walk from the party can reach. There is already an override: `o.foeAt[i]` puts foe i on a given square (`js/battle.js:109`, the class floor's `&foeat=`, `js/classes.js:793`). Story fights give each foe its own `at` plus `hidden`, `guard`, `from`/`then` (walks in), `chase`, `keepLevel` and `only` (`js/battle.js:350-358` makeFoe0). LURK, the lurkers that start hidden, is a fixed list (`:106`).
- **AI pieces for the postures** (none of them is a posture yet):
  - Sight: a foe knows only the heroes it can see, plus any beside it (`js/ai.js:15` heroes()).
  - Hunting: with no one in sight it goes where a blow was heard or a hero was last seen (`:1276`), and from round 2 it searches (`:1288`). The class AI does the same (`js/tactics.js:603-609`).
  - Lurkers: a lurker with no one watching hides again (`js/ai.js:1265-1271`).
  - Surprise by Stealth against passive Perception exists for story fights only (`js/battle.js:954-971`).
  - READY: the class AI readies when it has a reason (`js/tactics.js:1044` TX.readyWanted, `:1049` TX.readyUp). There is a hook for an idle turn (`:821` TX.IDLE, used by the Mascots' formation in `js/mpmon.js:1034`).
  - `u.guard` guards a UNIT: it goes for heroes within 30 ft of the one it guards (`js/ai.js:1246`).
  - **Patrol: nothing.** **Ambush that holds still: nothing.** A foe that sees no one now hunts.
- **The save.** In the browser: `cp.modules[].slots[]` inside `st.camp`, under localStorage `deep16.pocket` (`js/pocket.js:21`, keep `:425`). The campaign file copies the whole camp (`:1264`, v3), so a new slot field rides along at no cost. The module FILE is `PD.moduleFile` (`js/pocketdm.js:207-210`, v:1: `{map, foes, rest, name?, intro?}` per slot), saved by `:217` to the folder or as a download. It is read at every table by `PK.moduleOf` (`js/pocket.js:972-988`), which **rebuilds each slot from its named fields and drops any other field**. A module taken from a file loses its unit ids (`js/pocketdm.js:203` `units: []`). startModule copies the slots whole (`js/pocket.js:1078`).

## Build plan (sizes as the todo's: XS under an hour, S a sitting, M a seat's job, L several)

1. **THE LAY FLOOR (M).** WALK IT on BUILD's slot row (`js/pocketdm.js:823`) opens that slot's floor as a Battle with no party turns, after the roam's pattern but on any D.MAPS id. It has the camera and a cursor, and FLY lifts the cursor a level with D.iso.pickAt. The beside-the-map list shows the slot's units. Unchecked: whether D.Battle stands up with no party (the roam always has one). Fallback: MapView, upgraded to the real renderer.
2. **THE CAST (S-M).** Pick a unit, then LAY THE RUNE. The aim shows the unit's members as ghosts where they would stand; a click lays the rune with a ring and a sound. Squares it cannot use are refused: rock, cut off from the party's entry (seatBand's reach rule), water for those bound to water (`js/pocketdm.js:88` fits), and Large footprints that do not fit.
3. **THE RUNE'S CARD (S).** Click a rune for a pickInput card: REMOVE · STAND · AMBUSH · PATROL (then a second square) · DEFEND.
4. **PLACEMENT AT PLAY (S-M).** PK.moduleOf carries `runes` through. The launch passes `foeAt` plus a posture for each foe. seatBand gets an anchor: the nearest free squares to the rune, then the members spill as the roam's party does.
5. **THE POSTURES IN THE AI (M-L, benches).** For both ai.js (brute) and tactics.js (class, through TX.IDLE):
   - AMBUSH = hidden at the start, Stealth against passive Perception for surprise (the story's code), held still till a hero is seen or in reach or it is struck, then READY or strike.
   - DEFEND = `guard` widened to a square and a radius: hold there, READY against the first that comes in reach.
   - PATROL = walk the rune to the second square and back while it knows of no one; sight or a sound breaks it.
   - Edge: the hunt on hearing (ai.js:1276 and :1288) must not pull an ambusher or a defender off its post.
6. **THE SAVE (S).** `slot.runes` in the browser and in the module file (v:2). PD.takeModule and R must keep or drop runes on purpose: R refills and changes the units.
7. **THE GATE (S).** A `mode=runes` bench check in both gate lists (lay, save, load in v1 and v2, the play seats and the postures), plus eyes rows.

Whole job: **L**, one seat for 1-4 and 6-7, and the AI lane for 5.

## The format

Add per slot: `runes: [{ foes: ['hobgoblin','hobgoblin'], at: [x, y], post: 'stand'|'ambush'|'patrol'|'defend', to: [x, y], r: 15 }]`.
- A rune names its creatures by kind, not by unit id, because ids do not survive a file (`js/pocketdm.js:203`).
- `slot.foes` still lists everyone, and each rune's creatures are drawn from it. So a page without runes plays the same fight with everyone seated north, as today: an older page silently drops the runes and still plays the fight.
- Bump to `v: 2` as a marker only (nothing reads `v` on modules today). A v1 file (no runes) loads as today. A rune that does not check out (off the map, rock, kinds not in foes) is dropped with a line.
- The campaign file needs nothing: v3 copies the camp whole.

## SRD tie-in

- AMBUSH: SRD 5.1 Combat, Surprise (Stealth against passive Perception; the surprised take no turn in the first round), and Hiding.
- STAND or DEFEND as "wait": the Ready action (SRD 5.1).
- PATROL and DEFEND: the SRD has no posture rules. They are the DM's call, as Combat step 2 has it ("the GM figures out where the adversaries are", quoted at `js/roam.js:19-21`), built from SRD actions (Ready, Hide, Search, Dodge). That is SRD-clean, as our own design.

## His answers, 2026-11-07 (to this seat, after the report), and what changes

1. **The rune's look:** "icons we had to invent for 'protection from' spells", coloured by the rune's posture (ambush, and so on). UNLOCATED: I did not find a 'protection from' icon set. The nearest I found are the Protection from Energy shield badge (`deep16/js/looks.js:797` ICON_SHIELD, drawn at `:822` in the damage type's colour) and the shops' type icons (`deep16/js/pocketdm.js:1011-1017`: paw, claw, sword, boulder, eye, crown). Asked him which.
2. **The DM's figure:** the elder mage now in `deep16/_src/Fresh/DEEP16-ELDER-MAGE-SOURCES.zip` (01:13Z). A small, very old bald mage in a maroon robe with a teal amulet: five drawn facings (mirror the other three), Idle 4, Walk 8, Jump-Stomp 6 with a ground pulse at runtime index 3. The stomp is the cast: the rune is laid on the pulse frame. Per its own notes, cutter acceptance is pending, so the mage needs a cutter seat first (Fresh's rule). Until then the lay floor uses a stand-in token. FLY (lean): the camera and cursor rise a level and the mage stays on the ground below. There is no flying row in the art.
3. **Postures:** stand, ambush, patrol, defend. SLEEP goes to the dream list (it needs a sleeping row). Handed to the desk with a line ready to paste. Not written: `deep16-dream-polish.md` is a tracked file in the shared tree.
4. **Patrol:** the rune to one second square and back. RULED (the lean).
5. **Runes are the interface between the DM and the engine only:** the players never see them. RULED.
6. **The party's entrance is a rune** the DM can move, with a warning when a foe rune is within 30 ft of it. Plumbing: `D.classFight` builds no `entry` (`deep16/data/fights.js:456-462`). One field added there carries it to `deep16/js/battle.js:63` (`F.entry`), and `:80-82` already seats the rest of the party on the nearest free squares behind the first. XS-S.
7. **Reworked (his "if a DM does this there wouldn't be randoms to seat north"): a fight with runes IS its runes.**
   - The first rune laid makes the fight's foes exactly the units on its runes: no random roll and no seating north. The fight's CR shows as their sum.
   - A fight with no runes keeps today's fill.
   - Any of the DM's bound units can be laid, whole. A unit's members (mixed kinds, as the Visiting Barbarian with two stable fighters) spill around its rune and share its posture.
   - R on a laid fight asks first, because it would clear the runes.
   - Lean: a unit once per fight, and the same unit may stand in several fights (the fill's own rule).
8. **Runes in the DM's modules only.** RULED.
9. **If every member of the unit flies:** after placing, a prompt for its altitude. At play the height goes on as `u.fz` (`deep16/js/battle.js:3440-3441` flyTo sets it; `:3458` flyCheck drops a flier that cannot stay up). Offer heights by the map's step, under any ceiling. UNCHECKED: whether `fz` set before round 1 passes flyCheck.

**The format, updated:**
- Per slot: `runes: [{ foes: [the unit's kinds], at: [x, y], post: 'stand'|'ambush'|'patrol'|'defend', to: [x, y], z: ft }]` and `entry: [x, y]` (the party's rune).
- `slot.foes` = the runes' foes joined, so an older page plays the same creatures seated north at the map's own entry.
- `v: 2`. A v1 file loads as today.

**The plan, updated:**
- Step 2 gains the party rune, the 30 ft warning and the altitude prompt.
- Step 4 gains `entry` through classFight, and the "a laid fight is its runes" rule in PD.fill and planRung (`deep16/js/pocketdm.js:148`, `:163`).
- The mage's stomp waits on the cutter.
- Still about L overall.

**For the desk to paste into `deep16-dream-polish.md` (newest last):**
`- 2026-11-07 · (no sheet yet) a sleeping row · The Pocket DM's runes want a SLEEP posture (a foe laid asleep, woken by noise or a blow; SRD 5.1 unconscious/asleep), and no creature has a sleeping row to show it. Left off the postures till then (Griz 11-07: "sleep requires art but add it to the dream list"). · A lying-down sleep row (with a breath) for each figure laid by runes.`

**Item 1, FOUND (his "lymens protection from good evil made us define aberrations, monstrosities, etc"):** the creature-type glyphs at `deep16/js/ui.js:1876-1902`.
- GLYPH is a 9x9 glyph for each of the SRD's 14 types; GCOL holds their colours.
- Origin (Griz 09-29): first meant as a protection-spell mark, then *"add it to the right-click inspect"*.
- `UI.drawGlyph(ctx, type, x, y, { edge, cross, alpha })` (`:1906`) draws one on an 11x11 chip, with a gold or grey edge.
- The rune: that chip laid on the floor, at the unit's type. The posture colours the rune: lean, the chip's edge and a ring round it, so the glyph keeps its own colours and its type stays readable. `edge` grows from gold/grey to one colour per posture.
- A unit of mixed types shows its highest-CR member's type (lean).

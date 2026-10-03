---
layer: reference, a diff. The two spellbooks -- the 8-bit battle's (js/battle.js castSpell) and DEEP16's grid (deep16/js/magic.js, deep16/js/grimoire.js) -- set side by side: every record of content/spells.json, where it runs, where the two part, and what the 8-bit would need for the ones that run on the grid only.
written: 2026-10-03, a cloud seat on GrimGriz/dragonsleep-8bit (config claude-fable-5-1), off main at dc55881 (after the leftovers merge 4454318). Asked for by handoff-2026-10-01-the-two-spellbooks.md, on Griz's word 10-02: "1 - no, but create a handoff for a window to diff 16 & 8bit spell implementation (enlarge has no 8bit record yet)". Read off content/spells.json, js/battle.js, js/rules.js, deep16/data/spells.js, deep16/data/durations.js, deep16/js/magic.js, deep16/js/grimoire.js, deep16/js/battle.js, deep16/js/rules.js, deep16/js/classes.js, deep16/data/foes.js, content/monsters.json, srd/spells/*.md and srd/monsters/*.md, srd/20-npcs.md, and the register spells-srd-by-class.md.
status: a finding is a finding, not a fix. No game code was changed. The register rows the table proved stale are corrected in place (spells-srd-by-class.md, each one line). The questions that change a build are at the end, for Griz.
---

# The two spellbooks

The law both books sit under (RULED 09-28g, Griz): *"they have to be able to transfer back and forth from 16bit fights."* The books themselves are one law already (js/rules.js prepPool, castable: what a hero knows and prepares is the same list in both games). What this file diffs is what happens when a spell on that list is cast: the 8-bit battle runs its own code per `kind` (castSpell), the grid its own per spell (a geometry in data/spells.js, then a handler in grimoire.js or a built-in in magic.js).

## 0. The count, re-counted 10-03

The handoff's numbers were probed 10-02 and said to re-count. They moved by one with the leftovers merge.

| What | 10-02 (the handoff) | 10-03 (this pass, at dc55881) |
|---|---|---|
| records in content/spells.json | 174 | **175** |
| records with `grid: true` | 123 | **124** |
| records with `battle: true` | -- | **50** (two more carry `battle: false`: Pass Without Trace, True Seeing) |
| records with both flags | -- | **3**: Grease, Hideous Laughter, Mirror Image (RULED 10-01c) |
| records with neither | -- | **4**: Detect Magic, Rope Trick, Tiny Hut, Find Familiar (the field's) |
| geometries in deep16/data/spells.js | 173 | **174** (every record but Divine Smite) |
| `E.*` handlers in deep16/js/grimoire.js | 108 | **124** |
| built-in ids in deep16/js/magic.js M.cast | -- | **32** |

**Moved since, 10-03 (the cheap SRD fixes, spell-fixes-notes.md):** Blindness/Deafness is flagged `battle` -- `battle: true` 51, both flags 4, BOTH 50, GRID ONLY 120. The table and the counts below are as read at dc55881.

So the four kinds of record, which the table below marks on every row:

- **BOTH** -- 49 spells run in the 8-bit battle and on the grid, each by its own code. (The handoff said 51: it counted the four field-only records in.)
- **8-BIT ONLY** -- 1: Divine Smite, the paladin's feature, a record with no geometry.
- **FIELD ONLY** -- 4: Detect Magic, Rope Trick, Tiny Hut, Find Familiar, cast from the 8-bit's field menu; the grid's geometry says `none` (the familiar Find Familiar calls does fight on the grid, deep16/js/familiar.js).
- **GRID ONLY** -- 121 spells sit in books and on sheets and run on the grid only. Every one has a record. What they lack is a `battle` flag (js/rules.js R.spellList drops an unflagged record from the 8-bit's MAGIC list) and, for most, a branch castSpell could run them with.

How each game decides what it can cast:

- **The 8-bit.** R.spellList keeps a record only with `battle: true`. castSpell then dispatches on `kind`: smite, command, spiritweapon, light, cloud, revive, attack, auto, save, sleep, heal, buff, cure -- and inside `buff` on the record's `buff` key (shield, mageArmor, invisible, mirror, mislead, seeInvisible, darkvision, continualFlame, stoneskin, aid, branding, magicWeapon, pfeg, sanctuary; anything else is a generic `u.buff`). Targets by the record's `target`: enemy, cone (the picked foe and the two nearest), line (the picked foe and the three nearest), enemies (every foe), ally, allies (up to `max`, three by default), self, revive.
- **The grid.** M.list keeps a record with a geometry in data/spells.js (an unknown record is "not on the grid yet"). M.cast hands it to grimoire.js when `E.<id>` exists, else to a built-in branch by id (Hold Person, Bless, Cure Wounds, the clouds, Sleep, Web, the lights...), else to the generic shape (attack, rays, darts, splash, sphere, cube, cone, line, wave). The walls, Plant Growth, Antilife Shell and Conjure Elemental are deep16/js/walls.js and camp.js; Shield, Hellish Rebuke and Counterspell are reactions (battle.js, grimoire.js).
- **The register** (spells-srd-by-class.md) wrote "grid-only: no 8-bit record" on 49 rows. The record exists in every one of them; 3 of the 49 (Grease, Hideous Laughter, Mirror Image) run in both battles since 10-01c. Those rows, Greater Invisibility's ("grid:" -- it runs in both), Counterspell's (LATER -- built 10-02) and Eldritch Blast's ("in both games" -- as a spell, the grid's; the 8-bit's Amara shoots her sheet's blast) are corrected in place, one line each.

## 1. The table: every record, where it runs, what the register says

`Record flags` are the record's own (`battle`, `grid`, `field`, `ritual`). `The 8-bit battle` names the castSpell branch that runs it. `DEEP16` gives the geometry (shape, range, casting time, concentration) and where it runs. `The register row says` is the row's verdict and whether its words name a game; **STALE** marks the rows corrected 10-03.

| # | Spell | Level | Record flags | The 8-bit battle | DEEP16 (data/spells.js shape; where it runs) | Where it runs | The register row says |
|---|---|---|---|---|---|---|---|
| 1 | Acid Splash | cantrip | battle | castSpell: save (DEX) / target cone | splash 60 ft action; magic.js M.cast (splash -> battle.js attack) | **BOTH** | BUILT, no word on which game |
| 2 | Chill Touch | cantrip | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | attack 120 ft action; grimoire.js E.chilltouch | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 3 | Dancing Lights | cantrip | battle | castSpell: light / target self | sphere 120 ft r 10 action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 4 | Eldritch Blast | cantrip | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | rays 120 ft n 1 action; grimoire.js E.eldritchblast | **GRID ONLY** | BUILT, "in both games" (Amara's sheet attack) **STALE: as a spell, the grid's** |
| 5 | Fire Bolt | cantrip | battle | castSpell: attack / target enemy | attack 120 ft action; magic.js M.cast (attack -> battle.js attack) | **BOTH** | BUILT, no word on which game |
| 6 | Guidance | cantrip | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action conc; grimoire.js E.guidance | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 7 | Light | cantrip | battle, field | castSpell: light / target self; the field too | touch action; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 8 | Poison Spray | cantrip | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 10 ft action; grimoire.js E.poisonspray | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 9 | Produce Flame | cantrip | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | attack 30 ft action; grimoire.js E.produceflame | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 10 | Ray of Frost | cantrip | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | attack 60 ft action; grimoire.js E.rayoffrost | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 11 | Resistance | cantrip | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action conc; grimoire.js E.resistance | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 12 | Sacred Flame | cantrip | battle | castSpell: save (DEX) / target enemy | single 60 ft action; grimoire.js E.sacredflame | **BOTH** | BUILT, both |
| 13 | Shillelagh | cantrip | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self bonus; grimoire.js E.shillelagh | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 14 | Shocking Grasp | cantrip | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | attack 5 ft action; grimoire.js E.shockinggrasp | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 15 | True Strike | cantrip | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 30 ft action conc; grimoire.js E.truestrike | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 16 | Vicious Mockery | cantrip | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action; grimoire.js E.viciousmockery | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 17 | Animal Friendship | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 30 ft action; grimoire.js E.animalfriendship | **GRID ONLY** | BUILT, "the grid's" |
| 18 | Bane | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | allies 30 ft n 3 action conc; grimoire.js E.bane | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 19 | Bless | 1st | battle | castSpell: buff (bless) / target allies | allies 30 ft n 3 action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game **10-03: concentration and its own condition in the 8-bit too** |
| 20 | Burning Hands | 1st | battle | castSpell: save (DEX, half) / target cone | cone 15 ft long action; magic.js area() (cone) | **BOTH** | BUILT, no word on which game |
| 21 | Charm Person | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 30 ft action; grimoire.js E.charmperson | **GRID ONLY** | BUILT, "the grid's" |
| 22 | Color Spray | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | cone 15 ft long action; grimoire.js E.colorspray | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 23 | Command | 1st | battle | castSpell: command / target enemy | single 60 ft action; grimoire.js E.command | **BOTH** | BUILT, both |
| 24 | Cure Wounds | 1st | battle, field | castSpell: heal / target ally; the field too | touch action; grimoire.js E.curewounds | **BOTH** | BUILT, no word on which game |
| 25 | Detect Magic | 1st | field, ritual | the field (js/events.js EV.fieldCast) | none; none on the grid (nothing here to find) | **FIELD ONLY** | BUILT, no word on which game |
| 26 | Divine Favor | 1st | battle | castSpell: buff (divineFavor), bonus action / target self | self bonus conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game **10-03: concentration and its own condition in the 8-bit too** |
| 27 | Divine Smite | 1st | battle | castSpell: smite (the paladin's, no record on the grid) / target enemy | --; no geometry | **8-BIT ONLY** | no row (a class feature, not an SRD spell) |
| 28 | Entangle | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | cube 90 ft 20-ft action conc; grimoire.js E.entangle | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 29 | Expeditious Retreat | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self bonus conc; grimoire.js E.expeditiousretreat | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 30 | Faerie Fire | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | cube 60 ft 20-ft action conc; grimoire.js E.faeriefire | **GRID ONLY** | BUILT, "the grid's" |
| 31 | False Life | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action; grimoire.js E.falselife | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 32 | Find Familiar | 1st | field, ritual | the field (js/events.js EV.fieldCast) | none; none on the grid (an hour\) | **FIELD (the familiar it calls fights on the grid)** | LATER, "on the grid" |
| 33 | Fog Cloud | 1st | battle | castSpell: cloud (fog) / target self | sphere 120 ft r 20 action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, "on the grid" |
| 34 | Glass Whisper | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action; grimoire.js E.glasswhisper | **GRID ONLY** | no row (game-original, in the Ruled section) |
| 35 | Grease | 1st | battle, grid | castSpell: save (DEX, prone) / target cone | cube 60 ft 10-ft action; grimoire.js E.grease | **BOTH** | BUILT, "grid-only: no 8-bit record" **STALE: it runs in both** |
| 36 | Guiding Bolt | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | attack 120 ft action; grimoire.js E.guidingbolt | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 37 | Healing Word | 1st | battle | castSpell: heal, bonus action / target ally | single 60 ft bonus; grimoire.js E.healingword | **BOTH** | BUILT, both |
| 38 | Hellish Rebuke | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | reaction; reaction: deep16/js/grimoire.js M.rebuke | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** **10-03: BOTH -- the 8-bit's reaction window, Battle.rebuke** |
| 39 | Heroism | 1st | battle | castSpell: buff (heroism) / target ally | touch action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game **10-03: concentration and its own condition in the 8-bit too** |
| 40 | Hideous Laughter | 1st | battle, grid | castSpell: save (WIS, laughing) / target enemy | single 30 ft action conc; grimoire.js E.hideouslaughter | **BOTH** | BUILT, "grid-only: no 8-bit record" **STALE: it runs in both** |
| 41 | Hunter's Mark | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 90 ft bonus conc; grimoire.js E.huntersmark | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 42 | Inflict Wounds | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | attack 5 ft action; grimoire.js E.inflictwounds | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 43 | Longstrider | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action; grimoire.js E.longstrider | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 44 | Mage Armor | 1st | battle, field | castSpell: buff (mageArmor) / target ally; the field too | touch action; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 45 | Magic Missile | 1st | battle | castSpell: auto / target enemy | darts 120 ft n 3 action; magic.js M.cast (darts -> battle.js attack) | **BOTH** | BUILT, no word on which game |
| 46 | Mirror's Gaze | 1st | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 90 ft bonus conc; grimoire.js E.mirrorsgaze | **GRID ONLY** | no row (game-original, in the Ruled section) |
| 47 | Protection from Evil and Good | 1st | battle | castSpell: buff (pfeg) / target ally | touch action conc; grimoire.js E.protectionfromevilandgood | **BOTH** | BUILT, both |
| 48 | Sanctuary | 1st | battle | castSpell: buff (sanctuary), bonus action / target ally | single 30 ft bonus; grimoire.js E.sanctuary | **BOTH** | BUILT, both |
| 49 | Shield | 1st | battle | castSpell: buff (shield) / target self | reaction; reaction: deep16/js/battle.js (the reaction when a blow would land) | **BOTH** | BUILT, no word on which game **10-03: a reaction in the 8-bit too (Battle.shieldReact), and it turns Magic Missile there** |
| 50 | Shield of Faith | 1st | battle | castSpell: buff (shieldOfFaith), bonus action / target ally | single 60 ft bonus conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game **10-03: concentration and its own condition in the 8-bit too** |
| 51 | Sleep | 1st | battle | castSpell: sleep / target enemies | sphere 90 ft r 20 action; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 52 | Thunderwave | 1st | battle | castSpell: save (CON, half) / target cone | wave 15-ft action; magic.js area() (wave) | **BOTH** | BUILT, no word on which game |
| 53 | Acid Arrow | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | attack 90 ft action; grimoire.js E.acidarrow | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 54 | Aid | 2nd | battle, field | castSpell: buff (aid) / target allies; the field too | allies 30 ft n 3 action; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 55 | Barkskin | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action conc; grimoire.js E.barkskin | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 56 | Blindness/Deafness | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 30 ft action; grimoire.js E.blindnessdeafness | **GRID ONLY** -- **BOTH since 10-03** (the cheap SRD fixes: `battle: true`, and `repeat: true` for the save each turn) | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 57 | Blur | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action conc; grimoire.js E.blur | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 58 | Branding Smite | 2nd | battle | castSpell: buff (branding), bonus action / target self | self bonus conc; grimoire.js E.brandingsmite | **BOTH** | BUILT, both |
| 59 | Continual Flame | 2nd | battle, field | castSpell: buff (continualFlame) / target ally; the field too | touch action; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 60 | Darkness | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 60 ft r 15 action conc; grimoire.js E.darkness | **GRID ONLY** | BUILT, "on the grid" |
| 61 | Darkvision | 2nd | battle, field | castSpell: buff (darkvision) / target ally; the field too | touch action; magic.js M.cast (built-in) | **BOTH** | BUILT, both |
| 62 | Enhance Ability | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action conc; grimoire.js E.enhanceability | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 63 | Enlarge/Reduce | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 30 ft action conc; grimoire.js E.enlargereduce | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 64 | Flame Blade | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self bonus conc; grimoire.js E.flameblade | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 65 | Flaming Sphere | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 60 ft r 5 action conc; grimoire.js E.flamingsphere | **GRID ONLY** | BUILT, "grid-only" |
| 66 | Gust of Wind | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | line 60 ft long action; grimoire.js E.gustofwind | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 67 | Heat Metal | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action conc; grimoire.js E.heatmetal | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 68 | Hold Person | 2nd | battle | castSpell: save (WIS, paralyzed) / target enemy | single 60 ft action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 69 | Invisibility | 2nd | battle | castSpell: buff (invisible) / target ally | touch action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, "on the grid" |
| 70 | Lesser Restoration | 2nd | battle, field | castSpell: cure / target ally; the field too | touch action; magic.js M.cast (built-in) | **BOTH** | BUILT, both (the grid's one-thing rule is named; the 8-bit's ending all three is not) -- one thing in both since 10-03 |
| 71 | Magic Weapon | 2nd | battle | castSpell: buff (magicWeapon), bonus action / target ally | touch bonus conc; grimoire.js E.magicweapon | **BOTH** | BUILT, both |
| 72 | Mirror Image | 2nd | battle, grid | castSpell: buff (mirror) / target self | self action; grimoire.js E.mirrorimage | **BOTH** | BUILT, "grid-only: no 8-bit record" **STALE: it runs in both** |
| 73 | Misty Step | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | teleport 30 ft bonus; magic.js M.cast (built-in) | **GRID ONLY** | BUILT, "grid-only" |
| 74 | Moonbeam | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 120 ft r 5 action conc; grimoire.js E.moonbeam | **GRID ONLY** | BUILT, "grid-only" |
| 75 | Pass Without Trace | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action conc; magic.js M.cast (built-in) | **GRID ONLY** | BUILT, "grid-only" |
| 76 | Protection from Poison | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action; grimoire.js E.protectionfrompoison | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 77 | Ray of Enfeeblement | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | attack 60 ft action conc; grimoire.js E.rayofenfeeblement | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 78 | Rope Trick | 2nd | field | the field (js/events.js EV.fieldCast) | none; none on the grid (a field spell: a short rest, not a fight) | **FIELD ONLY** | BUILT, no word on which game |
| 79 | Scorching Ray | 2nd | battle | castSpell: attack (rays) / target enemy | rays 120 ft n 3 action; magic.js M.cast (rays -> battle.js attack) | **BOTH** | BUILT, no word on which game |
| 80 | See Invisibility | 2nd | battle | castSpell: buff (seeInvisible) / target self | self action; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 81 | Shatter | 2nd | battle | castSpell: save (CON, half) / target cone | sphere 60 ft r 10 action; magic.js area() (sphere) | **BOTH** | BUILT, no word on which game |
| 82 | Spike Growth | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 150 ft r 20 action conc; grimoire.js E.spikegrowth | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 83 | Spiritual Weapon | 2nd | battle | castSpell: spiritweapon, bonus action / target enemy | single 60 ft bonus; grimoire.js E.spiritualweapon | **BOTH** | BUILT, both |
| 84 | Warding Bond | 2nd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action; grimoire.js E.wardingbond | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 85 | Web | 2nd | battle | castSpell: save (DEX, restrained) / target cone | cube 60 ft 20-ft action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 86 | Beacon of Hope | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action conc; grimoire.js E.beaconofhope | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 87 | Bestow Curse | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 5 ft action conc; grimoire.js E.bestowcurse | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 88 | Blink | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action; grimoire.js E.blink | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 89 | Call Lightning | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 120 ft r 5 action conc; grimoire.js E.calllightning | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 90 | Conjure Animals | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 60 ft r 10 action conc; grimoire.js E.conjureanimals | **GRID ONLY** | BUILT, no word on which game |
| 91 | Counterspell | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | reaction; reaction: deep16/js/grimoire.js M.counterAsk | **GRID ONLY** | LATER, no word on which game **STALE verdict: BUILT 10-02** **10-03: BOTH -- the 8-bit's reaction window, Battle.counterAsk, against a foe's special tagged `spell`** |
| 92 | Daylight | 3rd | battle, field | castSpell: light / target self; the field too | sphere 60 ft r 60 action; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 93 | Dispel Magic | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 120 ft action; grimoire.js E.dispelmagic | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 94 | Fear | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | cone 30 ft long action conc; grimoire.js E.fear | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 95 | Fireball | 3rd | battle | castSpell: save (DEX, half) / target enemies | sphere 150 ft r 20 action; magic.js area() (sphere) | **BOTH** | BUILT, no word on which game |
| 96 | Haste | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 30 ft action conc; grimoire.js E.haste | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 97 | Hypnotic Pattern | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | cube 120 ft 30-ft action conc; grimoire.js E.hypnoticpattern | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 98 | Lightning Bolt | 3rd | battle | castSpell: save (DEX, half) / target line | line 100 ft long action; magic.js area() (line) | **BOTH** | BUILT, no word on which game |
| 99 | Mass Healing Word | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | allies 60 ft n 6 bonus; grimoire.js E.masshealingword | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 100 | Plant Growth | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 150 ft r 100 action; walls.js | **GRID ONLY** | BUILT, no word on which game |
| 101 | Protection from Energy | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action conc; grimoire.js E.protectionfromenergy | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 102 | Revivify | 3rd | battle, field | castSpell: revive / target revive; the field too | none; none on the grid (no one here has died (the fallen are only down)) | **BOTH** | BUILT, both (the 8-bit's field; the grid: nobody dies) |
| 103 | Sleet Storm | 3rd | battle | castSpell: cloud (sleet) / target enemies | sphere 150 ft r 40 action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 104 | Slow | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | cube 120 ft 40-ft action conc; grimoire.js E.slow | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 105 | Spirit Guardians | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action conc; grimoire.js E.spiritguardians | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 106 | Stinking Cloud | 3rd | battle | castSpell: cloud (stink) / target enemies | sphere 90 ft r 20 action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 107 | Tiny Hut | 3rd | field, ritual | the field (js/events.js EV.fieldCast) | none; none on the grid (a field spell: a long rest, not a fight) | **FIELD ONLY** | BUILT, no word on which game |
| 108 | Vampiric Touch | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | attack 5 ft action conc; grimoire.js E.vampirictouch | **GRID ONLY** | BUILT, "grid-only: no 8-bit record" **STALE wording: the record exists** |
| 109 | Wind Wall | 3rd | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | wall 120 ft 50 ft long action conc; walls.js | **GRID ONLY** | BUILT, no word on which game |
| 110 | Banishment | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action conc; grimoire.js E.banishment | **GRID ONLY** | BUILT, "on the grid" |
| 111 | Black Tentacles | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | cube 90 ft 20-ft action conc; grimoire.js E.blacktentacles | **GRID ONLY** | BUILT, "on the grid" |
| 112 | Blight | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 30 ft action; grimoire.js E.blight | **GRID ONLY** | BUILT, "on the grid" |
| 113 | Confusion | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 90 ft r 10 action conc; grimoire.js E.confusion | **GRID ONLY** | BUILT, "on the grid" |
| 114 | Conjure Woodland Beings | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 60 ft r 10 action conc; grimoire.js E.conjurewoodlandbeings | **GRID ONLY** | BUILT, waiting, no word on which game |
| 115 | Death Ward | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action; grimoire.js E.deathward | **GRID ONLY** | BUILT, "on the grid" |
| 116 | Dimension Door | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | teleport 500 ft action; grimoire.js E.dimensiondoor | **GRID ONLY** | BUILT, "on the grid" |
| 117 | Dominate Beast | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action conc; grimoire.js E.dominatebeast | **GRID ONLY** | BUILT, no word on which game |
| 118 | Fire Shield | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action; grimoire.js E.fireshield | **GRID ONLY** | BUILT, "on the grid" |
| 119 | Freedom of Movement | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action; grimoire.js E.freedomofmovement | **GRID ONLY** | BUILT, "on the grid" |
| 120 | Giant Insect | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 30 ft r 5 action conc; grimoire.js E.giantinsect | **GRID ONLY** | BUILT, no word on which game |
| 121 | Greater Invisibility | 4th | battle | castSpell: buff (invisible) / target ally | touch action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, "the grid's" **STALE: it runs in both** |
| 122 | Guardian of Faith | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 30 ft r 5 action; grimoire.js E.guardianoffaith | **GRID ONLY** | BUILT, "on the grid" |
| 123 | Ice Storm | 4th | battle | castSpell: save (DEX, half) / target enemies | sphere 300 ft r 20 action; magic.js area() (sphere) | **BOTH** | BUILT, no word on which game |
| 124 | Phantasmal Killer | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 120 ft action conc; grimoire.js E.phantasmalkiller | **GRID ONLY** | BUILT, "on the grid" |
| 125 | Polymorph | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action conc; grimoire.js E.polymorph | **GRID ONLY** | BUILT, "the grid's" |
| 126 | Resilient Sphere | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 30 ft action conc; grimoire.js E.resilientsphere | **GRID ONLY** | BUILT, "on the grid" |
| 127 | Stoneskin | 4th | battle | castSpell: buff (stoneskin) / target ally | touch action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 128 | Wall of Fire | 4th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | wall 120 ft 60 ft long action conc; walls.js | **GRID ONLY** | BUILT, "the grid's" |
| 129 | Antilife Shell | 5th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action conc; walls.js | **GRID ONLY** | BUILT, no word on which game |
| 130 | Cloudkill | 5th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 120 ft r 20 action conc; grimoire.js E.cloudkill | **GRID ONLY** | BUILT, "the grid's" |
| 131 | Cone of Cold | 5th | battle | castSpell: save (CON, half) / target cone | cone 60 ft long action; magic.js area() (cone) | **BOTH** | BUILT, no word on which game |
| 132 | Conjure Elemental | 5th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | none; none on the grid () | **GRID ONLY** | BUILT, "the grid's" |
| 133 | Contagion | 5th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | attack 5 ft action; grimoire.js E.contagion | **GRID ONLY** | BUILT, "on the grid" |
| 134 | Dispel Evil and Good | 5th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action conc; grimoire.js E.dispelevilandgood | **GRID ONLY** | BUILT, "on the grid" |
| 135 | Flame Strike | 5th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 60 ft r 10 action; grimoire.js E.flamestrike | **GRID ONLY** | BUILT, "on the grid" |
| 136 | Greater Restoration | 5th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action; grimoire.js E.greaterrestoration | **GRID ONLY** | BUILT, "on the grid" |
| 137 | Hold Monster | 5th | battle | castSpell: save (WIS, paralyzed) / target enemy | single 90 ft action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 138 | Insect Plague | 5th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 300 ft r 20 action conc; grimoire.js E.insectplague | **GRID ONLY** | BUILT, "on the grid" |
| 139 | Mass Cure Wounds | 5th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | allies 60 ft n 6 action; grimoire.js E.masscurewounds | **GRID ONLY** | BUILT, "on the grid" |
| 140 | Mislead | 5th | battle | castSpell: buff (mislead) / target self | self action conc; magic.js M.cast (built-in) | **BOTH** | BUILT, no word on which game |
| 141 | Wall of Stone | 5th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | wall 120 ft 60 ft long action conc; walls.js | **GRID ONLY** | BUILT, "the grid's" |
| 142 | Chain Lightning | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 150 ft action; grimoire.js E.chainlightning | **GRID ONLY** | BUILT, "on the grid" |
| 143 | Circle of Death | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 150 ft r 60 action; grimoire.js E.circleofdeath | **GRID ONLY** | BUILT, "on the grid" |
| 144 | Disintegrate | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action; grimoire.js E.disintegrate | **GRID ONLY** | BUILT, "on the grid" |
| 145 | Eyebite | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action conc; grimoire.js E.eyebite | **GRID ONLY** | BUILT, "on the grid" |
| 146 | Flesh to Stone | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action conc; grimoire.js E.fleshtostone | **GRID ONLY** | BUILT, "on the grid" |
| 147 | Freezing Sphere | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 300 ft r 60 action; grimoire.js E.freezingsphere | **GRID ONLY** | BUILT, "on the grid" |
| 148 | Globe of Invulnerability | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action conc; grimoire.js E.globeofinvulnerability | **GRID ONLY** | BUILT, "on the grid" |
| 149 | Harm | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action; grimoire.js E.harm | **GRID ONLY** | BUILT, "on the grid" |
| 150 | Heal | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action; grimoire.js E.heal | **GRID ONLY** | BUILT, "on the grid" |
| 151 | Irresistible Dance | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 30 ft action conc; grimoire.js E.irresistibledance | **GRID ONLY** | BUILT, "on the grid" |
| 152 | Sunbeam | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | line 60 ft long action conc; grimoire.js E.sunbeam | **GRID ONLY** | BUILT, "on the grid" |
| 153 | True Seeing | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action; magic.js M.cast (built-in) | **GRID ONLY** | BUILT, "grid-only" |
| 154 | Wall of Thorns | 6th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | wall 120 ft 60 ft long action conc; walls.js | **GRID ONLY** | BUILT, no word on which game |
| 155 | Arcane Sword | 7th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action conc; grimoire.js E.arcanesword | **GRID ONLY** | BUILT, "on the grid" |
| 156 | Delayed Blast Fireball | 7th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 150 ft r 20 action conc; grimoire.js E.delayedblastfireball | **GRID ONLY** | BUILT, "on the grid" |
| 157 | Divine Word | 7th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self bonus; grimoire.js E.divineword | **GRID ONLY** | BUILT, "on the grid" |
| 158 | Etherealness | 7th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action; grimoire.js E.etherealness | **GRID ONLY** | BUILT, "on the grid" |
| 159 | Finger of Death | 7th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action; grimoire.js E.fingerofdeath | **GRID ONLY** | BUILT, "on the grid" |
| 160 | Fire Storm | 7th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 150 ft r 20 action; grimoire.js E.firestorm | **GRID ONLY** | BUILT, "on the grid" |
| 161 | Prismatic Spray | 7th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | cone 60 ft long action; grimoire.js E.prismaticspray | **GRID ONLY** | BUILT, "on the grid" |
| 162 | Regenerate | 7th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action; grimoire.js E.regenerate | **GRID ONLY** | BUILT, "on the grid" |
| 163 | Symbol | 7th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 5 ft r 0 action; grimoire.js E.symbol | **GRID ONLY** | BUILT, "on the grid" |
| 164 | Earthquake | 8th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 500 ft r 100 action conc; grimoire.js E.earthquake | **GRID ONLY** | BUILT, "on the grid" |
| 165 | Feeblemind | 8th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 150 ft action; grimoire.js E.feeblemind | **GRID ONLY** | BUILT, "on the grid" |
| 166 | Holy Aura | 8th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action conc; grimoire.js E.holyaura | **GRID ONLY** | BUILT, "on the grid" |
| 167 | Maze | 8th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action conc; grimoire.js E.maze | **GRID ONLY** | BUILT, "on the grid" |
| 168 | Mind Blank | 8th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action; grimoire.js E.mindblank | **GRID ONLY** | BUILT, "on the grid" |
| 169 | Power Word Stun | 8th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action; grimoire.js E.powerwordstun | **GRID ONLY** | BUILT, "on the grid" |
| 170 | Sunburst | 8th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 150 ft r 60 action; grimoire.js E.sunburst | **GRID ONLY** | BUILT, "on the grid" |
| 171 | Foresight | 9th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | touch action; grimoire.js E.foresight | **GRID ONLY** | BUILT, "on the grid" |
| 172 | Mass Heal | 9th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | self action; grimoire.js E.massheal | **GRID ONLY** | BUILT, "on the grid" |
| 173 | Meteor Swarm | 9th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 5280 ft r 40 action; grimoire.js E.meteorswarm | **GRID ONLY** | BUILT, "on the grid" |
| 174 | Power Word Kill | 9th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | single 60 ft action; grimoire.js E.powerwordkill | **GRID ONLY** | BUILT, "on the grid" |
| 175 | Weird | 9th | grid | no branch (the record is there; R.spellList filters it out: no `battle` flag) | sphere 120 ft r 30 action conc; grimoire.js E.weird | **GRID ONLY** | BUILT, no word on which game |

## 2. The 49 that run in both battles: where the two part

Each of the 49 is run by its own code on each side. Nobody had checked that the two agree on numbers, saves, DCs, conditions, durations and concentration. They agree on more than they part on: the DC and the attack bonus come from the same functions in both (js/rules.js R.spellDC, R.spellAtk: 8 + proficiency + the casting ability, the familiar's +1s on Web and the charms in both); the dice, the save ability, the half-on-a-save, the upcast dice (+1d6 a slot and the rest) and the cantrip's growth at 5 are read off the same record. Where they part is below: first the laws that part them everywhere, then spell by spell, then what the SRD says against the grid.

### 2a. Seven laws that part them everywhere

1. **The 8-bit battle has no concentration.** castSpell holds nothing: a caster can have Bless, Shield of Faith, Hold Person and Web running at once, and no blow ever shakes one loose. The grid holds one at a time (deep16/js/magic.js M.concentrate: a new one ends the old; a hit asks CON against 10 or half the damage, M.concCheck; its clock runs out at the start of the caster's turn, deep16/data/durations.js). The SRD: one concentration spell at a time, a CON save when damaged. Nineteen of the 49 are concentration spells by the SRD (Bless, Divine Favor, Fog Cloud, Heroism, Hideous Laughter, Protection from Evil and Good, Shield of Faith, Dancing Lights, Web, Branding Smite, Hold Person, Invisibility, Magic Weapon, Sleet Storm, Stinking Cloud, Greater Invisibility, Stoneskin, Hold Monster, Mislead), and so are most of the 121 grid-only ones. **BUILT 10-03 (RULED, Griz: "1 yes, 2 yes"): the 8-bit holds one spell a caster as the grid does (js/battle.js Battle.beginConc, concCheck, endConc; `conc: true` on 82 records, 19 of them battle spells); a new one ends the old with a card; a blow asks CON, DC 10 or half; helpless or down lets go; what it laid on its targets goes with it. The ten-round clock stays ("3 yes").**
2. **One buff slot.** Bless, Shield of Faith, Heroism, Divine Favor and the paladin's Sacred Weapon all live in the one `u.buff` (castSpell's generic branch, `t.buff = b`): the later one replaces the earlier, with no word said. The grid keeps each as its own condition (blessed, shieldOfFaith, heroism, divineFavor, sacred). The SRD: different spells stack, concentration permitting -- Ingrith's Bless and Lymen's Shield of Faith can both stand on Barley. The rest of the 8-bit's buffs (shielded, mageArmor, invisible, stoneskin, branding, magicWeapon, pfeg, sanctuary, images) are their own conditions and do stack. **RETIRED 10-03 (RULED, Griz: "we're retiring the buff slot because it was limiting the 8bit characters to only carrying one buff?" -- yes): `u.buff` is gone; Bless, Shield of Faith, Heroism and Divine Favor are conditions on their targets (`blessed`, `shieldOfFaith`, `heroism`, `divineFavor`), several at once, each read where the slot was read and ended by its caster's concentration; Sacred Weapon is a condition for the minute (Channel Divinity, no concentration). Ingrith's Bless and Lymen's Shield of Faith stand on Barley together (dev/bench8.py reactions1003).**
3. **Area damage is rolled once per target.** castSpell's save branch rolls the dice inside its loop over the targets: Burning Hands, Thunderwave, Shatter, Fireball, Lightning Bolt, Ice Storm, Cone of Cold and Acid Splash roll a fresh total for each foe. The grid's area() and saveAll roll once for everyone caught. The SRD rolls once (a damage roll made for an effect that harms several is one roll for all of them). **Now the SRD's (10-03, the cheap SRD fixes):** castSpell rolls once before its loop and every foe caught takes that roll, half on a save (bench8 `fixes1003`).
4. **The slot is the lowest, never chosen.** castSpell spends R.lowestSlot(h, sp.level): while a lower slot is free a player cannot upcast, so the `up` paths (+1d6 a slot, +1 dart, +1 ray, +5 on Aid, +1d4 on Healing Word) run only once the low slots are gone. The grid asks which slot (M.slotLevels; the list's picker in deep16/js/ui.js). The SRD: the caster chooses the slot.
5. **The clocks.** The 8-bit runs every lasting spell ten rounds (or till the long rest for Mage Armor, Aid, Darkvision and Continual Flame -- RULED 09-27, 09-28). The grid keeps the SRD's durations (durations.js, 09-28h: a minute is ten rounds). Where that parts them: Invisibility and Mislead (SRD concentration, up to 1 hour: the grid 600 rounds, the 8-bit 10), See Invisibility (1 hour), Magic Weapon (concentration, 1 hour), Fog Cloud (concentration, 1 hour), Web (concentration, 1 hour), Protection from Evil and Good and Shield of Faith (concentration, 10 minutes: the grid 100 rounds). The minute-long ones agree. Mirror Image has no end at all in the 8-bit (the grid and the SRD: a minute). In a fight of ten rounds none of this shows; it shows the day the 8-bit's fights run long, or a buff is meant to outlast one.
6. **The 8-bit's areas are readings, not squares.** `cone` is the picked foe and the two nearest, `line` the picked foe and the three nearest, `enemies` every foe (Fireball, Ice Storm, Sleep's pool); a sphere or cube at a point has no 8-bit reading (Shatter is a cone there, Fireball every foe). The push (Thunderwave), the difficult ground, a cloud's obscurement, the distance a spell reaches and anything that hangs on where a creature stands are dropped on the 8-bit side. This is the FF-simple shorthand the record's `_note` names, not a bug; it is written once here so the rows below need not repeat it.
7. **The 8-bit's foes cast no records.** The spell-weaver's line of lightning (`boltstorm`: DEX 14, 8d6, three targets), the naga's bolt, their Hold (WIS 14, paralyzed, a save each turn), Torvald's guardians (one blast: WIS 13, 3d8 half, everyone) and his "sanctuary" (two rounds unseen), the drow's and the captain's darkness (the bright light off), the duergar's Enlarge (its doubled die: the SRD duergar's own, not the spell's +1d4) are `specials` in content/monsters.json with their own numbers, run by Battle.special; Amara shoots her sheet's blast. On the grid the same creatures cast the records (deep16/data/foes.js `caster`, deep16/js/classes.js NPC.NAMED). Nothing a hero meets in the 8-bit is a spell to counter, dispel or shut out with a globe. Their numbers against the SRD blocks were not checked here. **10-03: still so, but a special that is a spell on the sheet now says which (`spell: "lightningbolt"` on the spell-weaver's bolt storm, the naga's bolt, their and Torvald's hold, Torvald's guardians and sanctuary, the drow's darkness), so Counterspell can answer it; a Magic Missile special would be turned by Shield.**

### 2b. Spell by spell

Only where the two part beyond the seven laws. "Which matches" names the side the SRD's words agree with.

| Spell | The 8-bit battle | DEEP16 | The SRD 5.1 says | Which matches |
|---|---|---|---|---|
| Acid Splash | the picked foe and one more (`max: 2`), a separate 1d6 for each; half on a save for any wizard of 6th or higher (its "Potent Cantrip") | one creature, and one within 5 ft of it; one roll; half on a save for the School of Evocation at 6 only | one creature, or two within 5 ft of each other; Potent Cantrip is the evoker's 6th | the grid |
| Shield | an action from the MAGIC list: +5 AC till your next turn | a reaction, offered when a blow would land inside the +5 (deep16/js/battle.js), a 1st-level slot | a reaction when you are hit: +5 AC, the triggering attack included, and no damage from Magic Missile | the grid on the reaction; **neither on Magic Missile** (the grid's darts never read conds.shield; the 8-bit has no shielded check in its auto branch) -- **the grid's now the SRD's (10-03, the cheap SRD fixes):** the reaction is offered as the darts fly and the barrier takes them all; the 8-bit's is the claude/8bit-reactions branch's |
| Magic Missile | every dart at the one picked foe | each dart at a creature of your choice; +1 dart a slot (both) | "one creature or several" | the grid; **now both (10-03, the cheap SRD fixes):** the player aims each dart, X sending the rest at the last; Battle.aimShots weighs for a caster the battle runs |
| Scorching Ray | every ray at the one picked foe | the rays at chosen targets; +1 ray a slot (both) | "one target or several" | the grid; **now both (10-03, the cheap SRD fixes):** the player aims each ray, as the darts |
| Sleep | every foe by hit points; the undead and the asleep-immune skipped; the drow sleep (no Fey Ancestry on the 8-bit sheets) and so do the charm-immune (the naga: condImmune poisoned only on its 8-bit sheet) | a 20-ft sphere; the drow and the fey, the undead, the charm-immune and the Vigil's skipped | "creatures immune to being charmed aren't affected"; the drow's Fey Ancestry: magic can't put it to sleep | the grid; **now both (10-03, the cheap SRD fixes):** the drow sheets carry `feyAncestry`, the naga's `charmed`, and castSpell skips them, the fey and the undead |
| Thunderwave | the picked foe and two, CON half; no push | a 15-ft cube from the caster; a failed save pushed 10 ft | pushed 10 ft on a fail | the grid (the 8-bit has nowhere to push to) |
| Bless | up to three; no extra target from a higher slot | up to three, +1 a slot | +1 target a slot above 1st | the grid; **now both (10-03, the cheap SRD fixes):** the record's `maxUp`, read by castSpell and by the cleric guest's turn (the slot is still the lowest free, law 4) |
| Hold Person, Invisibility, Heroism | one target, whatever the slot | one target, whatever the slot | +1 target a slot | neither (both short, the same way) |
| Fog Cloud | ten rounds over the party; RUN slips away untried; attacks in and out of it are unchanged | heavily obscured: attackers blind, the unseen attacked at disadvantage; concentration, an hour | heavily obscured; concentration, up to 1 hour | the grid (the 8-bit's fog hides nobody from a blow) |
| Stinking Cloud | over the foes only; a failed CON ends the foe's turn (its turn is its action: the same thing); the party is never in it | everyone in the sphere, the action lost | each creature in it, the action spent retching | the grid (the 8-bit's reading spares the party) |
| Sleet Storm | over the foes only; DEX or prone and the whole turn lost; no concentration check, no flames doused | everyone in it; prone only (it acts on, at disadvantage); a concentrating caster CON or loses the spell; flames out | prone; the concentration check | the grid; **the turn now the SRD's (10-03, the cheap SRD fixes):** a failed DEX is prone and the turn goes on, from the ground (the foes-only reach, the concentration check and the flames stay as they were) |
| Mislead | invisible ten rounds, ends on an attack or a cast; the card says a double stands where you stood, but no image is set (`images` untouched: no blow ever goes at the double) | invisible, and one image a blow may go at | "an illusory double of you appears where you are standing" | the grid; **now both (10-03, the cheap SRD fixes):** castSpell sets one image, and a foe's blow may go at it by Mirror Image's d20 |
| Mirror Image | three images, no end | three images, a minute | 1 minute | the grid |
| Lesser Restoration | ends poisoned, paralyzed and blinded, all at once | ends one, the player's pick (an NPC the worst) | "one disease or one condition" | the grid; **now both (10-03, the cheap SRD fixes):** castSpell ends one, the worst first (paralysis, blindness, poison; a paralysing poison is one), the player asked where more than one afflicts |
| Hideous Laughter | WIS or prone and helpless ten rounds; a save at each of its turn ends; INT 4 or less unmoved | the same, and a save with advantage each time it is hurt | both saves, advantage on the one damage triggers | the grid; **now both (10-03, the cheap SRD fixes):** hurt() asks the save with advantage (Battle.laughHurt) |
| Web | the picked foe and two, DEX or restrained; a STR (Athletics) check each turn to tear free, the turn spent either way; no save for those who saved first; fire does nothing to it; ten rounds | a 20-ft cube; a DEX save on starting a turn in it or entering; the restrained may still attack, at disadvantage; a STR check as an action to break free; fire burns it; concentration, an hour | as the grid | the grid |
| Grease | up to three foes DEX or prone once, up again at their next turn (RULED 10-01c: "work a simplified version into 8-bit battles") | a 10-ft square, a minute; a save on entering or ending a turn there | as the grid | the grid, by ruling |
| Stoneskin | half damage from nonmagical bludgeoning, piercing and slashing (hurt() reads the blow's `magicWeapon`) | half from **all** bludgeoning, piercing and slashing, magical blows too (deep16/js/battle.js hurt, the stoneskin line reads no magic) | "resistance to nonmagical bludgeoning, piercing, and slashing damage" | **the 8-bit**; **now both (10-03, the cheap SRD fixes):** the grid's hurt reads the blow's magic |
| Sanctuary | ends when the warded attacks or casts at a foe (heroAttack, castSpell, Command); not on the spiritual weapon's swing | M.unward is written but nothing calls it: a warded unit that attacks or casts at a foe keeps the ward for the minute | "if the warded creature makes an attack or casts a spell that affects an enemy creature, this spell ends" | **the 8-bit** (bar the spiritual weapon); **now both (10-03, the cheap SRD fixes):** the grid calls M.unward from Battle.attack and after a spell that touches a foe; the 8-bit's spiritual weapon swing ends it too (RULED 10-03, Griz: *"yes; dealing damage ends it"*) |
| Protection from Evil and Good | the six types attack the warded at disadvantage, and their fright and charm cannot take it (pfegStops); ten rounds | the disadvantage only (deep16/js/rules.js edges); RU.immuneTo never reads pfeg, so a fiend's fear takes the warded; 100 rounds | both: disadvantage, and "can't be charmed, frightened, or possessed by them"; concentration, 10 minutes | **the 8-bit** on the ward, the grid on the clock; **the ward now both (10-03, the cheap SRD fixes):** RU.immuneTo reads `pfeg`, RU.save the advantage against one already on |
| Magic Weapon | only an ally whose weapon is not magic already | any weapon in hand: a +1 sword goes to +2 (the AI declines; a player is not stopped) | "You touch a nonmagical weapon" | **the 8-bit**; **now both (10-03, the cheap SRD fixes):** the grid's picker refuses a magic blade and says why |
| Ice Storm | 2d8 + 4d6, every foe; no difficult ground | the sphere; no difficult ground either; its 4d6 cold dealt as bludgeoning (**split 10-03**, RULED, Griz: *"yes; it is a bug"*) | "Hailstones turn the storm's area of effect into difficult terrain until the end of your next turn" | neither (the register row says "difficult": it is not, on either side); **the grid's now the SRD's (10-03, the cheap SRD fixes):** the hail lies as a spell's ground till the caster's next turn ends; the 8-bit's is moot (law 6) |
| Spiritual Weapon | swings by itself at the start of the caster's turn, at the lowest-HP foe; no bonus action spent | a bonus action the caster spends, aimed | "As a bonus action on your turn, you can move the weapon up to 20 feet and repeat the attack" | the grid (the dice agree: 1d8 + 1d8 for every two slots above 2nd) |
| Command | GROVEL prone and the turn gone; HALT nothing; FLEE the turn lost; DROP lets go of whoever it holds | GROVEL, HALT as the 8-bit; FLEE its whole move away; DROP disarmed a turn | the four words | both (two readings of DROP; the 8-bit has no move to flee with) |
| Light, Daylight, Dancing Lights | the whole fight lit (bright, or dim for the lights); self only; the fight long; no concentration on the lights | an object, 20 ft (Light); a 60-ft sphere (Daylight); four dim lights at a point, concentration, movable | an object touched; a point | readings (law 6); the lights' concentration is law 1 |

Agreeing, beyond the seven laws: Fire Bolt, Sacred Flame, Burning Hands, Shatter, Fireball, Lightning Bolt, Cone of Cold, Cure Wounds, Healing Word, Aid, Mage Armor, Darkvision, Continual Flame, See Invisibility, Invisibility, Greater Invisibility, Shield of Faith, Divine Favor, Heroism, Branding Smite, Hold Person, Hold Monster, Revivify, Dancing Lights' dim light. Divine Smite runs in the 8-bit alone (a feature, no record on the grid).

### 2c. What this found against the grid

The handoff asked for the 8-bit's gaps; these are the grid's, found on the way, and left as they are:

1. **Stoneskin** halves magical bludgeoning, piercing and slashing too (SRD: nonmagical only). deep16/js/battle.js hurt, the `stoneskin` line. **Fixed 10-03** (the cheap SRD fixes): B.hurt takes the blow's source, `{ magic }` from Battle.attack (the weapon's or a spell attack's) and from every spell's damage (magic.js, grimoire.js, walls.js).
2. **Sanctuary** never ends when the warded one attacks or casts at a foe: M.unward (deep16/js/grimoire.js) has no caller. **Fixed 10-03** (the cheap SRD fixes): Battle.attack calls it for any attack the warded makes (the floating weapon's swing included), and battle.js's cast seam after a spell aimed at a foe or one that hurt or marked a foe.
3. **Protection from Evil and Good** gives the disadvantage but not the immunity to the six types' charm and fright (RU.immuneTo does not read `pfeg`). **Fixed 10-03** (the cheap SRD fixes): RU.immuneTo reads it with the one laying the condition (`by`), and RU.save gives advantage on a new save against a charm or fright already on from one of the six.
4. **Shield** does not stop Magic Missile (nor in the 8-bit). **Fixed on the grid 10-03** (the cheap SRD fixes): magic.js's darts offer the reaction to one targeted who knows it (a player asked; the AI for two darts or more, or darts that could drop it), and one with the barrier up takes none; the AI's dart weighing leaves a shielded foe out. The 8-bit's Shield is the claude/8bit-reactions branch's. The 8-bit's Shield stops it now too (10-03, Battle.special, the blast branch; claude/8bit-reactions).
5. **Magic Weapon** takes a weapon that is magical already. **Fixed 10-03** (the cheap SRD fixes): data/spells.js gives it `nonmagical`, M.targetWhy refuses a magic blade or an empty hand (the picker's card says why), and the cast itself leaves a magic blade as it was.
6. **Ice Storm** lays no difficult ground (the register row says it does). **Fixed 10-03** (the cheap SRD fixes): area() lays a `hail` ground (difficult, M.rough; drawn as hailstones, looks.js) that M.endTurn takes up at the end of the caster's next turn (groundsTime, if he is gone or down).

## 3. The 121 grid-only spells: what the 8-bit battle would need, by the pull rule

The pull rule is monster-driven (RULED 09-30, Griz: "pull rule to monster driven"): build next what the most SRD monsters up the CR ladder use, and what the playable classes at the playable levels cast. So each spell below carries three pulls:

- **SRD monsters and NPC blocks** that have it on their sheet (srd/monsters/*.md, srd/20-npcs.md: 38 casters, the drow at CR 1/4 to the lich at 21), with the CR. The 8-bit's own foes that stand in for them: the drow, the captain and the spell-weaver, the duergar, Torvald, the naga, Amara, Willem (content/monsters.json; their 8-bit spells are specials, law 7).
- **The class lists** (deep16/js/classes.js NPC.CLASSES, levels 1-9: the generic class NPCs and what the Pocket DM hands a made character, capped at 8 -- so a full caster's 4th-level spells, a half caster's 2nd), with the lowest NPC level that reaches it.
- **The game's own casters** that carry it: foes.js `caster` lists (the spell-weaver, the naga), NPC.NAMED (Torvald, Amara, Willem, Ingrith, with their `grow` lists past their register levels) and the 8-bit hero sheets (content/heroes.json).

The order inside each tier: the spells the most SRD casters of CR 8 or under have, the lowest CR first; then every SRD caster; then the class lists. The tiers say what the 8-bit would need, which is the build's cost, not its order; his pick decides between them. Levels 6 and up have no caster at the playable levels and sit at the bottom of every tier: they are the foes' (the lich, the archmage, the mummy lord), and the 8-bit has none of those.

**The pull rule's head** -- every grid-only spell an SRD caster of CR 8 or under has, in order:

1. **Darkness** (2nd, tier B) -- Elf, Drow 1/4, Drider 6, Oni 7; classes: warlock 3
2. **Entangle** (1st, tier B) -- Dryad 1, Druid 2, Unicorn 5; classes: druid 1
3. **Charm Person** (1st, tier B) -- Lamia 4, Oni 7, Spirit Naga 8; classes: bard 1, druid 1, wizard 1
4. **Faerie Fire** (1st, tier B) -- Elf, Drow 1/4, Drider 6; classes: bard 1, druid 1
5. **Blur** (2nd, tier B) -- Steam Mephit 1/4, Gnome, Deep (Svirfneblin) 1/2; classes: wizard 3
6. **Barkskin** (2nd, tier B) -- Dryad 1, Druid 2; classes: druid 3, ranger 5
7. **Shillelagh** (cantrip, tier B) -- Dryad 1, Druid 2; classes: druid 1
8. **Blindness/Deafness** (2nd, tier A) -- Gnome, Deep (Svirfneblin) 1/2; classes: bard 3, cleric 3
9. **Heat Metal** (2nd, tier A) -- Magma Mephit 1/2; classes: bard 3, druid 3
10. **Dispel Magic** (3rd, tier D) -- Priest 2; classes: cleric 5, druid 5
11. **Guiding Bolt** (1st, tier A) -- Priest 2; classes: cleric 1
12. **Produce Flame** (cantrip, tier A) -- Druid 2; classes: druid 1
13. **Inflict Wounds** (1st, tier A) -- Cult Fanatic 2; classes: cleric 1
14. **Spirit Guardians** (3rd, tier C) -- Priest 2; classes: cleric 5
15. **Vicious Mockery** (cantrip, tier A) -- Green Hag 3; classes: bard 1
16. **Greater Restoration** (5th, tier A) -- Couatl 4; classes: bard 9, cleric 9, druid 9
17. **Protection from Poison** (2nd, tier A) -- Couatl 4
18. **Dispel Evil and Good** (5th, tier B) -- Unicorn 5; classes: cleric 9
19. **Ray of Enfeeblement** (2nd, tier B) -- Night Hag 5
20. **Counterspell** (3rd, tier D) -- Mage 6; classes: sorcerer 5, warlock 5, wizard 5
21. **Blight** (4th, tier A) -- Spirit Naga 8; classes: druid 7, sorcerer 7, warlock 7, wizard 7
22. **Ray of Frost** (cantrip, tier A) -- Spirit Naga 8

### A. A number the 8-bit battle rolls already: castSpell's attack, save and heal branches carry it with a flag or a rider (44)

| Spell | Level | Pull: SRD monsters and NPC blocks (CR) | Pull: the class lists (NPC level that reaches it) | The game's own casters | What the 8-bit battle needs |
|---|---|---|---|---|---|
| Blindness/Deafness | 2nd | Gnome, Deep (Svirfneblin) 1/2 | bard 3, cleric 3 | -- | castSpell save CON, cond blinded, a save each turn: the record's own fields run it today if flagged `battle` (blinded and repeat exist); deafness is moot -- **BUILT 10-03 (the cheap SRD fixes):** flagged, and given `repeat: true` (the record had none: without it, no save each turn) |
| Heat Metal | 2nd | Magma Mephit 1/2 | bard 3, druid 3 | -- | 2d8 fire with no save, then CON or (a weapon) no weapon attack next turn / (armour) disadvantage; cast again as a bonus action: a repeat like the spiritual weapon's |
| Guiding Bolt | 1st | Priest 2, Mummy Lord 15 | cleric 1 | torvald | castSpell attack, 4d6 +1d6 a slot; a rider: the next attack at it has advantage (a cond advantage() reads) |
| Produce Flame | cantrip | Druid 2 | druid 1 | -- | castSpell attack, 1d8 (2d8 at 5) |
| Inflict Wounds | 1st | Cult Fanatic 2 | cleric 1 | -- | castSpell attack, 3d10 +1d10 a slot |
| Vicious Mockery | cantrip | Green Hag 3 | bard 1 | -- | castSpell save WIS, 1d4 (2d4 at 5), no half; a rider: its next attack at disadvantage (a one-round cond) |
| Greater Restoration | 5th | Couatl 4, Androsphinx 17 | bard 9, cleric 9, druid 9 | -- | cure: a charm, a curse or a lowered max HP -- nothing the 8-bit lays yet but the crawlers' drain |
| Protection from Poison | 2nd | Couatl 4 | -- | -- | cure poison, then resist poison and advantage on saves against it: the antitoxin cond already gives the advantage |
| Blight | 4th | Spirit Naga 8, Lich 21 | druid 7, sorcerer 7, warlock 7, wizard 7 | Spirit Naga (foes.js) | castSpell save CON half, 8d8 +1d8 a slot; the undead and constructs take nothing (a tag check) |
| Ray of Frost | cantrip | Spirit Naga 8, Lich 21 | -- | Spirit Naga (foes.js), willem | castSpell attack, 1d8 (2d8 at 5); the -10 ft is moot |
| Flame Strike | 5th | Guardian Naga 10, Planetar 16, Androsphinx 17 | cleric 9, warlock 9 | -- | castSpell save DEX half, 4d6 fire + 4d6 radiant (the dmg2/el2 pair Ice Storm uses already), enemies |
| Power Word Stun | 8th | Glabrezu 9, Lich 21 | -- | -- | no save: stunned (the 8-bit has it) if 150 HP or fewer; CON each turn end |
| True Seeing | 6th | Guardian Naga 10, Rakshasa 13 | -- | -- | ally: seeInvisible and darkvision for the fight (both conds exist) |
| Shocking Grasp | cantrip | Archmage 12 | sorcerer 1, wizard 1 | willem (grow) | castSpell attack, 1d8 (2d8 at 5); melee and the lost reaction are moot; advantage against metal armour needs a tag on the foe |
| Contagion | 5th | Mummy Lord 15 | cleric 9, druid 9 | -- | a melee spell attack with no damage that lays the disease: poisoned, then CON at each turn end -- three fails and it is blinded for the fight, three saves and it clears (a cond with a repeat; poisoned and blinded exist) |
| Harm | 6th | Mummy Lord 15 | -- | -- | castSpell save CON half 14d6, never below 1 HP; on a fail the foe's max HP falls by the damage |
| Acid Arrow | 2nd | Lich 21 | wizard 3 | -- | castSpell attack, 4d4 now; two riders: 2d4 more at the end of its next turn, half the first on a miss (+1d4 to both a slot) |
| Disintegrate | 6th | Lich 21 | -- | -- | castSpell save DEX, 10d6+40, nothing on a save |
| Finger of Death | 7th | Lich 21 | -- | -- | castSpell save CON half, 7d8+30 |
| Power Word Kill | 9th | Lich 21 | -- | -- | no save: dropped if 100 HP or fewer |
| Chill Touch | cantrip | -- | sorcerer 1, warlock 1, wizard 1 | willem (grow) | castSpell attack, 1d8 (2d8 at 5); a rider: no healing till the caster's next turn (a cond heal() reads), undead at disadvantage against the caster |
| Mass Cure Wounds | 5th | -- | bard 9, cleric 9, druid 9 | -- | allies heal, 3d8 + mod each |
| Poison Spray | cantrip | -- | sorcerer 1, warlock 1 | -- | castSpell save CON, 1d12 (2d12 at 5), no half; skip the poison-immune (hurt() does) |
| Color Spray | 1st | -- | sorcerer 1, wizard 1 | willem (grow) | the sleep branch's pool (6d10 +2d10 a slot) laying blinded till the caster's next turn instead of asleep |
| Vampiric Touch | 3rd | -- | warlock 5, wizard 5 | -- | castSpell attack 3d6 +1d6 a slot, and half of it back to the caster; again each action: a repeat |
| Eldritch Blast | cantrip | -- | warlock 1 | amara | castSpell attack as rays by level (one at 1, two at 5), 1d10 force; Agonizing Blast +CHA needs the invocation on the sheet; Repelling Blast is moot |
| Flame Blade | 2nd | -- | druid 3 | -- | a bonus action, then a 3d6 fire attack each action for ten rounds: a weapon the caster swings (shillelagh's way) |
| Call Lightning | 3rd | -- | druid 5 | -- | target + the nearest (the cone reading), DEX half 3d10 +1d10 a slot; again each action, no slot: a repeat; needs open sky (the map's `sky`) |
| Mass Healing Word | 3rd | -- | cleric 5 | -- | allies heal, 1d4 + mod each, bonus action (the allies branch + the heal branch) |
| Heal | 6th | -- | druid 11 | -- | ally: 70 HP, and blindness and poison ended |
| Sunbeam | 6th | -- | druid 11 | -- | line (target + 3) CON half 6d8 radiant and blinded a round; again each action for the minute: a repeat |
| Glass Whisper | 1st | -- | -- | -- | castSpell save WIS half, 2d6 +1d6 a slot; the lost reaction is moot |
| Chain Lightning | 6th | -- | -- | -- | castSpell save DEX half 10d8 on the picked foe and three more: the line reading (target + 3) |
| Circle of Death | 6th | -- | -- | -- | castSpell save CON half 8d6 necrotic, enemies (+2d6 a slot) |
| Freezing Sphere | 6th | -- | -- | -- | castSpell save CON half 10d6 cold, enemies |
| Arcane Sword | 7th | -- | -- | -- | a 3d10 force spell attack each turn: the spiritual weapon's path with other dice |
| Divine Word | 7th | -- | -- | -- | enemies, CHA save, by HP: 20 drops, 30 stunned+blinded, 40 blinded, 50 nothing more; the otherworldly sent home |
| Fire Storm | 7th | -- | -- | -- | castSpell save DEX half 7d10 fire, enemies |
| Prismatic Spray | 7th | -- | -- | -- | cone (target + 2), DEX, a d8 ray each: 10d6 of five kinds half, or restrained, or blinded two turns |
| Regenerate | 7th | -- | -- | -- | ally: 4d8+15 now, then 1 HP at each of its turns (a cond ticking in turn()) |
| Feeblemind | 8th | -- | -- | -- | 4d6 psychic, then INT or no spells: moot for the 8-bit's foes, which cast none |
| Sunburst | 8th | -- | -- | -- | castSpell save CON half 12d6 radiant, enemies, and blinded with a CON save each turn (cond + repeat); lifts the foes' darkness special |
| Mass Heal | 9th | -- | -- | -- | allies: 700 HP shared, the most hurt first |
| Meteor Swarm | 9th | -- | -- | -- | castSpell save DEX half 20d6 fire + 20d6 bludgeoning, enemies |

### B. A condition or buff the 8-bit must learn to read (in attack rolls, saves, hurt() or the turn) (40)

| Spell | Level | Pull: SRD monsters and NPC blocks (CR) | Pull: the class lists (NPC level that reaches it) | The game's own casters | What the 8-bit battle needs |
|---|---|---|---|---|---|
| Darkness | 2nd | Elf, Drow 1/4, Drider 6, Oni 7, Glabrezu 9, Gynosphinx 11 | warlock 3 | amara | as a hero's spell: the fight goes dark for the foes (`lit` off): every attack by one with no darkvision is blind -- the 8-bit's dark machinery; the drow have darkvision 120, so against them it is a cost, not a gain |
| Entangle | 1st | Dryad 1, Druid 2, Unicorn 5 | druid 1 | -- | up to three foes (the cone reading), STR or restrained: Web's path with another save and no fire |
| Charm Person | 1st | Lamia 4, Oni 7, Spirit Naga 8, Rakshasa 13 | bard 1, druid 1, wizard 1 | Spirit Naga (foes.js), amara | a humanoid, WIS (with advantage: it is being fought) or charmed: it will not pick the caster (pickHeroFor skips him); harm from the party breaks it |
| Faerie Fire | 1st | Elf, Drow 1/4, Drider 6 | bard 1, druid 1 | -- | enemies, DEX or outlined: attacks at them with advantage (the `revealed` cond already stops hiding; add the advantage); no invisibility |
| Blur | 2nd | Steam Mephit 1/4, Gnome, Deep (Svirfneblin) 1/2 | wizard 3 | willem | a cond: attacks at the caster at disadvantage (advantage() reads it) |
| Barkskin | 2nd | Dryad 1, Druid 2 | druid 3, ranger 5 | -- | a cond: AC no lower than 16 (acOf reads it) |
| Shillelagh | cantrip | Dryad 1, Druid 2 | druid 1 | -- | the club or staff hits with WIS, a d8, magical, for the fight (the attack maths reads the weapon) |
| Dispel Evil and Good | 5th | Unicorn 5, Planetar 16, Solar 21 | cleric 9 | -- | pfeg on the caster (the cond exists), ten rounds |
| Ray of Enfeeblement | 2nd | Night Hag 5 | -- | -- | castSpell attack with no damage, then a cond on the foe: its STR weapon damage halved, CON each turn end to shake it |
| Freedom of Movement | 4th | Guardian Naga 10, Androsphinx 17 | bard 7, cleric 7, druid 7 | -- | a cond: no restrained, grappled or paralyzed (the web, the chuul, the roper); those on them end |
| Confusion | 4th | Glabrezu 9 | bard 7, druid 7, wizard 7 | -- | enemies, WIS; each turn a d10: 1 and 2-6 nothing, 7-8 it strikes a random neighbour (foe on foe: hurt() takes it), 9-10 acts; WIS each turn end |
| Bestow Curse | 3rd | Guardian Naga 10 | cleric 5 | -- | WIS save, then a cond: the caster's hits +1d8 necrotic, or its attacks at the caster at disadvantage |
| Enlarge/Reduce | 2nd | Efreeti 11 | -- | -- | a cond: an ally +1d4 on weapon hits (and advantage on STR saves), a foe on a failed CON -1d4 (disadvantage); the 8-bit duergar already has `enlarged` on the sheet for its own trait |
| Fire Shield | 4th | Archmage 12 | warlock 7, wizard 7 | -- | a cond: half of fire or cold, and 2d8 of the other back at a melee attacker (foeAttack reads it) |
| Mind Blank | 8th | Archmage 12 | -- | -- | a cond: psychic immune, charm immune (nothing in the 8-bit charms yet) |
| Animal Friendship | 1st | -- | bard 1, druid 1, ranger 2 | -- | a beast of INT 3 or less, WIS or charmed, as Charm Person |
| Fear | 3rd | -- | bard 5, warlock 5, wizard 5 | amara, willem (grow) | cone (target + 2), WIS or frightened (the 8-bit has it: cowers half the time, disadvantage); the run and the dropped weapon are moot |
| Haste | 3rd | -- | sorcerer 5, wizard 5, bard 10 (Magical Secrets) | -- | a cond: +2 AC, advantage on DEX saves, one more attack a turn; a lost turn when it ends |
| Guidance | cantrip | -- | cleric 1, druid 1 | ingrith, ingrith (8-bit sheet) | a cond: +1d4 on the next check -- ESCAPE, or the rogue's hide; then spent |
| Resistance | cantrip | -- | cleric 1, druid 1 | -- | a cond: +1d4 on the next saving throw, then spent |
| Bane | 1st | -- | bard 1, cleric 1 | -- | a cond on up to three foes (+1 a slot): -1d4 on their attack rolls and saves (foeAttack and save() read it) |
| Enhance Ability | 2nd | -- | bard 3, druid 3 | -- | Bear's 2d6 temporary HP; the other five are advantage on checks the 8-bit seldom rolls (ESCAPE, the hide) |
| Hypnotic Pattern | 3rd | -- | bard 5, wizard 5 | willem | enemies, WIS or helpless till hurt: the 8-bit's `asleep` is that (incapacitated, wakes on damage); ten rounds |
| Slow | 3rd | -- | bard 5, wizard 5 | willem (grow) | enemies up to six, WIS, a cond: -2 AC and DEX saves, one attack a turn (foeTurn cuts the routine), WIS each turn end |
| False Life | 1st | -- | wizard 1 | -- | temporary HP: the 8-bit keeps them only in u.buff.temp (Heroism) -- a pool of its own |
| Hunter's Mark | 1st | -- | ranger 2 | -- | a cond on one foe: +1d6 on the caster's weapon hits; moves when it drops |
| Warding Bond | 2nd | -- | cleric 3 | -- | a cond: +1 AC and saves, half of every blow, and the caster takes the same (hurt() splits it) |
| Protection from Energy | 3rd | -- | druid 5 | -- | a cond: half damage of one element (hurt() reads it; the game picks the element the foes throw most) |
| Death Ward | 4th | -- | cleric 7 | -- | a cond: the first blow that would drop them leaves 1 HP (hurt() reads it) |
| Phantasmal Killer | 4th | -- | wizard 7 | willem (grow) | WIS or frightened, then at each of its turn ends WIS or 4d10 psychic (+1d10 a slot), a success ends it: a cond with a repeat that deals damage |
| True Strike | cantrip | -- | -- | -- | a cond: advantage on the next attack at that foe |
| Mirror's Gaze | 1st | -- | -- | amara | as Hunter's Mark: +1d6 psychic on every hit, and the marked cannot hide or go unseen from her |
| Beacon of Hope | 3rd | -- | -- | -- | a cond on the party: advantage on WIS saves, healing rolls their maximum |
| Blink | 3rd | -- | -- | -- | a cond: at each turn end a d20, 11+ untargetable till the next turn (the phase spider's `ethereal` cond does the vanishing) |
| Eyebite | 6th | -- | -- | -- | each action one foe: WIS or asleep / frightened / a cond with disadvantage on attacks (WIS each turn end); a repeat without a slot |
| Irresistible Dance | 6th | -- | -- | -- | no first save; a cond: its attacks at disadvantage, attacks at it with advantage, and its action a WIS save (the turn lost) -- the movement half is moot |
| Etherealness | 7th | -- | -- | -- | the caster untargetable till the start of its next turn (the `ethereal` cond) |
| Holy Aura | 8th | -- | -- | -- | a cond on the party: advantage on saves, attacks at them at disadvantage |
| Foresight | 9th | -- | -- | -- | a cond: advantage on attacks and saves, attacks at them at disadvantage |
| Weird | 9th | -- | -- | -- | Phantasmal Killer on every foe (enemies) |

### C. An area, zone, aura, cloud or wall: it needs the FF-simple reading before it is a build (13)

| Spell | Level | Pull: SRD monsters and NPC blocks (CR) | Pull: the class lists (NPC level that reaches it) | The game's own casters | What the 8-bit battle needs |
|---|---|---|---|---|---|
| Spirit Guardians | 3rd | Priest 2 | cleric 5 | torvald | an aura: while the caster stands, each foe at its turn start WIS half 3d8 (+1d8 a slot) -- the 8-bit Torvald's `guardians` special does it once, as a blast; here every turn, ten rounds. Half speed is moot |
| Wall of Fire | 4th | Efreeti 11, Pit Fiend 20 | druid 7, sorcerer 7, wizard 7 | -- | a wall between the lines: DEX half 5d8 (+1d8 a slot) on the foes as it rises (the cone reading), then 5d8 to any foe that comes to melee through it or ends its turn on the near side -- the seat picks the side, as it did on the grid |
| Insect Plague | 5th | Mummy Lord 15, Planetar 16 | cleric 9, druid 9, sorcerer 9 | -- | a cloud over the foes (the stinking cloud's frame): CON half 4d10 (+1d10 a slot) as it forms and at each foe's turn end |
| Guardian of Faith | 4th | Mummy Lord 15 | cleric 7 | -- | a guardian: each foe the first time it comes to blows, DEX half 20 radiant; gone after 60 dealt |
| Cloudkill | 5th | Lich 21 | sorcerer 9, wizard 9 | -- | a cloud over the foes: CON half 5d8 (+1d8 a slot) at each foe's turn start; its rolling away is moot |
| Flaming Sphere | 2nd | -- | druid 3, wizard 3 | -- | a zone beside one foe: at its turn end DEX half 2d6 (+1d6 a slot); the bonus action that rolls it = a new foe picked, which saves at once (the ram) |
| Gust of Wind | 2nd | -- | druid 3 | -- | blows the 8-bit's own fog, stinking and killing clouds apart; the push is moot |
| Moonbeam | 2nd | -- | druid 3 | -- | a zone on one foe: at its turn start CON half 2d10 (+1d10 a slot); the action that moves it = a new foe picked |
| Wind Wall | 3rd | -- | druid 5 | -- | a wall: the foes' ranged attacks (the drow's crossbows, the giant's rock) miss; 3d8 STR half once as it rises on the foes it crosses (the cone reading) |
| Black Tentacles | 4th | -- | wizard 7 | -- | enemies: DEX or 3d6 and restrained, the held 3d6 at each turn start, a STR check to break free (the web's ESCAPE) |
| Antilife Shell | 5th | -- | druid 9 | -- | a ward: no foe but the undead and constructs can strike the caster in melee; ranged attacks and specials pass |
| Delayed Blast Fireball | 7th | -- | -- | -- | a bead held by the caster: 12d6 +1d6 a turn waited (to 22d6), DEX half, enemies, when released -- a BURST action on the MAGIC list while it waits |
| Earthquake | 8th | -- | -- | -- | each foe at its turn start DEX or prone, ten rounds; the concentration check is moot (no 8-bit foe concentrates) |

### D. A mechanism the 8-bit lacks: summons, control, a shape, a reaction, a counter, a dispel, a foe put out of the fight (13)

| Spell | Level | Pull: SRD monsters and NPC blocks (CR) | Pull: the class lists (NPC level that reaches it) | The game's own casters | What the 8-bit battle needs |
|---|---|---|---|---|---|
| Dispel Magic | 3rd | Priest 2, Glabrezu 9, Gynosphinx 11, Mummy Lord 15, Androsphinx 17, Lich 21 | cleric 5, druid 5 | torvald | the 8-bit keeps no record of what spell laid what: it could end a foe special's mark (the duergar enlarged, the phase spider in the rock, the cloaker's phantasms) by a list, or a hero's own cloud or web; the grid asks the spell's level |
| Counterspell | 3rd | Mage 6, Archmage 12, Lich 21 | sorcerer 5, warlock 5, wizard 5 | amara, willem (grow) | nothing to counter: the 8-bit's foes cast no records, their spells are specials (the spell-weaver's bolt, the naga's hold); it would need the specials tagged with a spell and a level, and a reaction offered as one fires |
| Banishment | 4th | Guardian Naga 10, Gynosphinx 11, Archmage 12, Androsphinx 17 | cleric 7, sorcerer 7, warlock 7, wizard 7 | -- | a foe out of the fight ten rounds (the phase spider's `ethereal` cond: not pickable, not dead), back where it stood; the otherworldly held the full ten gone for good |
| Conjure Elemental | 5th | Djinni 11, Efreeti 11 | druid 9, wizard 9 | -- | the camp's CAST AHEAD: an earth elemental walking into the 8-bit fight as an ally needs the same foe-sheet ally; the 8-bit has no camp -- its field would cast it |
| Polymorph | 4th | -- | bard 7, druid 7, sorcerer 7, wizard 7 | -- | a foe becomes a beast of its CR or less: swap its sheet for a bestiary one (content/monsters.json by CR), its own HP behind the beast's; a hero: no beast sheet for a hero yet |
| Conjure Animals | 3rd | -- | druid 5, ranger 9 | -- | summons: foe sheets fighting as allies (the familiar's frame grown up: a unit built from a monster sheet on the hero side, with its own turn) |
| Dominate Beast | 4th | -- | druid 7, sorcerer 7 | -- | a beast fighting for the party: the 8-bit's allies are hero sheets (guests); a foe on the party's side needs a foe-sheet ally -- the familiar is the nearest thing |
| Hellish Rebuke | 1st | -- | warlock 1 | -- | a reaction: offered when a foe's attack hits the caster (foeAttack), DEX half 2d10 (+1d10 a slot) at it -- the 8-bit has no reactions; the one place to add one |
| Conjure Woodland Beings | 4th | -- | druid 7 | -- | summons, as Conjure Animals; no fey in the bestiary yet (greyed on the grid too) |
| Giant Insect | 4th | -- | druid 7 | -- | summons, as Conjure Animals (three giant spiders) |
| Resilient Sphere | 4th | -- | wizard 7 | -- | as Banishment with a DEX save, or a hero sealed (no blows at them, no turns) |
| Flesh to Stone | 6th | -- | -- | -- | CON or restrained, then CON each turn end: three fails stone (out of the fight), three saves free |
| Maze | 8th | -- | -- | -- | a foe out of the fight, no save; d20 + INT each turn end to come back on 20 |

### E. Moot where there are no squares (nothing to build; listed so the count closes) (11)

| Spell | Level | Pull: SRD monsters and NPC blocks (CR) | Pull: the class lists (NPC level that reaches it) | The game's own casters | What the 8-bit battle needs |
|---|---|---|---|---|---|
| Pass Without Trace | 2nd | Dryad 1, Unicorn 5 | ranger 5 | -- | moot: the 8-bit battle rolls no Stealth (the rogue's hide is automatic) |
| Longstrider | 1st | Druid 2 | ranger 2 | -- | moot: speed |
| Misty Step | 2nd | Mage 6, Cloud Giant 9, Archmage 12 | sorcerer 3, wizard 3 | Drow Spell-Weaver (foes.js) | moot: a 30-ft hop; RULED 09-27 grid only already |
| Dimension Door | 4th | Spirit Naga 8, Lich 21 | bard 7, sorcerer 7, warlock 7, wizard 7 | Spirit Naga (foes.js) | moot: 500 ft; could stand in for a RUN that never fails, the caster and one ally |
| Globe of Invulnerability | 6th | Archmage 12, Lich 21 | -- | -- | moot while the 8-bit's foes cast nothing of a level; with the specials tagged, a cond: a special of 5th or lower does nothing to those inside |
| Wall of Stone | 5th | -- | druid 9, sorcerer 9, wizard 9 | -- | moot: a wall that stops sight and passage is nothing where no one moves; at most the party cannot be targeted for ten rounds, which is Sanctuary for everyone |
| Spike Growth | 2nd | -- | druid 3, ranger 5 | -- | moot: movement |
| Expeditious Retreat | 1st | -- | warlock 1 | -- | moot: a Dash |
| Plant Growth | 3rd | -- | druid 5 | -- | moot: squares |
| Wall of Thorns | 6th | -- | druid 11 | -- | moot as a wall; its 7d8 as it grows is a number (the cone reading) |
| Symbol | 7th | -- | -- | -- | moot: a glyph on a square; the stun it lays (enemies WIS or stunned, CON each turn end) is a number the 8-bit rolls, if the trigger is read as "the first foe to attack" |

## 4. What was not looked at

- **Nothing was run.** A Linux container with no browser pane and no headless Edge: no bench, no every-spell check. Every line above is read off the code, not watched. The register's rows and this file are the only files touched; no game code, no content record.
- **The field.** The 8-bit's field casts (js/events.js EV.fieldCast: the rests, Detect Magic, the day's spells, Find Familiar's ritual) and the camp's CAST AHEAD on the grid were not diffed; only the battles were.
- **The AI.** How each side's casters weigh a spell (deep16/js/tactics.js and the grimoire's `ai` hooks; the 8-bit's clericTurn and the specials' chances) is a different question from what a spell does when cast, and was left alone.
- **The 8-bit's monster specials against the SRD blocks.** Law 7 says they are specials, not records; whether the spell-weaver's DEX 14 line, Torvald's WIS 13 guardians or the naga's bolt carry the SRD's numbers was not checked.
- **The SRD spells with no record.** The register's LATER and OUT verdicts (the 144 of the 319 that have no record) were not reopened; the casters' sheets were read only for the 121 that have one.
- **`deep16-current spells.md`** (09-27) predates the class NPCs and the durations pass: it still says a minute-long spell lasts the whole fight. It was not updated; it is the reading lamp's, not the register's.
- **The handoff's §2 numbers** were re-counted (§0); the bolt and the weaving-room card are on Griz's PC and could not be read from here.

## 5. The questions that change a build (for Griz)

Answerable from memory; a number each is enough.

1. **Concentration in the 8-bit battle.** Build it there (one spell held, a CON save when hurt, as the grid does), or keep the 8-bit free of it? Every held spell in §2a.1 waits on this, and so do most of the 121. **RULED 10-03: "1 yes" -- built (§2a.1).**
2. **The one buff slot.** Bless, Shield of Faith, Heroism, Divine Favor and Sacred Weapon replace one another in the 8-bit: a bug to fix (each its own condition, as the grid), or the 8-bit's shorthand to keep? **RULED 10-03: "2 yes" -- retired (§2a.2).**
3. **The clocks.** The hour-long spells (Invisibility, Mislead, See Invisibility, Magic Weapon, Fog Cloud, Web) and the ten-minute ones (Shield of Faith, Protection from Evil and Good) run ten rounds in the 8-bit: leave it (a fight is ten rounds), or the SRD's clocks as the grid keeps them?
4. **A slot picker in the 8-bit.** Upcasting by choice, as on the grid, or the lowest slot as now?
5. **One damage roll per area cast** in the 8-bit, as the SRD and the grid, or one per foe as now?
6. **The grid's own misses (§2c).** Fix Stoneskin (nonmagical only), Sanctuary (ends on an attack) and Protection from Evil and Good (no charm or fright from the six types)? None was fixed here.
7. **Shield.** Give it its Magic Missile immunity in both games? And in the 8-bit, leave it an action, or make it the reaction the grid has (the 8-bit has no reactions: this would be the first, and Hellish Rebuke the second)? **10-03: a reaction in the 8-bit now, with the Magic Missile immunity there (the grid's half of the question stands open).**
8. **The 8-bit's small ones, as one batch on a yes:** Mislead's missing double; Lesser Restoration ending one thing; Sleep skipping the drow and the charm-immune; Hideous Laughter's save with advantage when hurt; the sleet's failed save costing the whole turn instead of the footing; Magic Missile and Scorching Ray at more than one foe; Bless's extra target a slot.
9. **The 8-bit's foes.** Keep their specials, or let them cast the records (one path for both games, the grid's `caster` lists)? Counterspell, Dispel Magic and the Globe have nothing to work on in the 8-bit until they do.
10. **The order of the 121.** By the pull rule's head (Darkness, Entangle, Charm Person, Faerie Fire, Blur, Barkskin, Shillelagh, then the Priest's and the Fanatic's ...), or tier A first (the 44 that are a number castSpell rolls already: the cheapest, the most at once), or nothing until 1 to 5 are ruled?
11. **Blindness/Deafness** could run in the 8-bit today by flagging its record `battle: true` (CON, blinded, a save each turn: the record's own fields): flag it? -- **answered 10-03** (Griz: *"4 yes"*, the cheap SRD fixes): flagged, with `repeat: true`.
12. **Summons, Dominate Beast and Polymorph in the 8-bit** need an ally or a foe built from a monster sheet (the familiar is the nearest thing there): wanted in the 8-bit at all, or do the summoners fight on the grid only?

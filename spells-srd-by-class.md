---
layer: reference, to rule. Every SRD 5.1 spell (the 2014 rules, 319 of them) with a verdict for DRAGONSLEEP -- built, in, dark, later, out -- by level and by class, and who in the game could cast it. In prep of more NPCs and foes (Griz, 09-28: "we're doing it in prep of adding more NPCs and foes - so please do the whole list"), and the first step of the other classes' combat spells (handoff-2026-09-28-deep16-after-the-review-CODE-TAB.md §3A).
written: 2026-09-28, the Code tab on dragonsleep-8bit (config claude-opus-5-5). The spell text and the class lists: the SRD 5.1 as dnd5eapi.co serves it (/api/2014). The verdicts: the wizard 0-5, cleric 0-3, paladin 1-3 and warlock 0-3 lists (192 spells) by the seat; the other 127 by a runner under the same rubric, read by the seat (one changed: Faerie Fire is built). Built first by dev/srd-spells/build_spell_doc.py (gitignored, with the SRD text cached and the verdicts as JSON); since torchdark (09-28d) folded by hand -- this file is the register, the builder is stale.
status: PROPOSED, with Griz's rulings of 09-28 folded in (Ruled, below) and one thing still open (the ear-lamp). Nothing here is built by being listed; every verdict is his to overrule.
---

# The SRD spells, for DRAGONSLEEP

Each spell gets one verdict:

- **BUILT**: in the game now (the 8-bit battle, its field, or the grid).
- **IN**: a clear effect in a fight or on the map that the engines can carry now or with a small addition. Worth building.
- **DARK**: its point was light, darkness, sight, invisibility or fog; it waited on the non-magical dark. **All eleven BUILT 09-28 (torchdark: light with a place, the player seeing what the characters can't, the unseen attacked at disadvantage -- the SRD's rule, his first -4 amended the same day)** -- the column stays for the record.
- **LATER**: a real effect that needs machinery not built yet: summons, flight, walls, taking control of a creature, shapechanging, countering a foe's spell, clouds that move.
- **OUT**: nothing to do in either game (utility, social, travel, divination, crafting, long rituals, bringing back the dead where nobody dies).

| | BUILT | IN | DARK | LATER | OUT | all |
|---|---|---|---|---|---|---|
| **every spell** | 155 | 3 | 0 | 58 | 103 | 319 |
| Wizard | 96 | 1 | 0 | 39 | 68 | 204 |
| Cleric | 53 | 2 | 0 | 10 | 40 | 105 |
| Paladin | 19 | 0 | 0 | 0 | 12 | 31 |
| Warlock | 32 | 0 | 0 | 12 | 20 | 64 |
| Sorcerer | 74 | 0 | 0 | 23 | 23 | 120 |
| Bard | 47 | 0 | 0 | 17 | 47 | 111 |
| Druid | 48 | 2 | 0 | 21 | 35 | 106 |
| Ranger | 15 | 0 | 0 | 7 | 15 | 37 |

**Who**, in the tables: **Au** Aurdin (wizard, spells to 5th), **Ly** Lymen (paladin to 3rd, and his Oath of Devotion's spells), **To** Torvald (cleric 5), **In** Ingrith (cleric 4), **Am** Amara (warlock 5), **Wi** Willem (wizard 5), **SW** the drow spell-weaver (the SRD Mage's own list), **Na** the spirit naga (the SRD's own list), **Dr** the drow's innate, **Du** the duergar's. A hero or a classed NPC is marked for every spell his class and level reach; the two SRD stat blocks only for the spells they have. **Classes**: W wizard, C cleric, P paladin, K warlock, S sorcerer, B bard, D druid, R ranger.

## The casters in the game now

| Caster | Class | Register | Casts today | A first list, for the NPC spells work (to rule) |
|---|---|---|---|---|
| Aurdin | wizard (evoker) 1-9: spells to 5th | the 8-bit build (content/heroes.json) | his book; prepares INT + level (09-28) | his own: the book grows by the build's picks, or the climb's |
| Lymen | paladin (Devotion) 2-9: spells to 3rd | the 8-bit build | the paladin list (Command, Branding Smite, Magic Weapon joined it, both games, 09-28g); prepares CHA + half his level; his oath's always: Protection from Evil and Good and Sanctuary from 3, Lesser Restoration from 5 | the oath's others once built: Zone of Truth at 5, Beacon of Hope and Dispel Magic at 9 |
| Torvald Greyseam | cleric 5 of Dvalgarda, the Vigil (our own domain, 09-28g): to 3rd | the-copper-egg.md (CANON 09-16f) | Spirit Guardians as a line (a stand-in), Hold, Sanctuary as two rounds unseen (a stand-in) | the SRD Priest's (a 5th-level cleric): Light, Sacred Flame, Thaumaturgy; Cure Wounds, Guiding Bolt, Sanctuary; Lesser Restoration, Spiritual Weapon; Dispel Magic, Spirit Guardians -- and Hold Person, the 8-bit's. Slots 4/3/2 |
| Ingrith Scalebeam | cleric 4: to 2nd | deepholm-and-the-edifice.md (CANON 09-26b); no spells in the register | a cleric in both games since 09-28g (RULED): the Life Domain (the seat's), the drafted list and Spiritual Weapon; the 8-bit battle runs her turn as a cleric (#ingrith-cleric) | drafted: Sacred Flame, Guidance; Cure Wounds, Healing Word, Bless, Shield of Faith; Aid, Lesser Restoration, Prayer of Healing. Slots 4/3 |
| Amara | warlock 5, the Great Old One -- the Mirror (RE-RULED 08-29): to 3rd (two 3rd-level slots) | npcs-by-location.md §The Road; module-halfway-inn.md | Eldritch Blast (two beams) | the register's: Eldritch Blast (Agonizing Blast), *friends*, Prestidigitation; Charm Person, *hex*, Suggestion, Darkness, Fear, Gaseous Form (*italic: not SRD*); invocations Agonizing Blast, Beguiling Influence, Fiendish Vigor, Awakened Mind. At threat: Darkness, then Gaseous Form, and runs. TRIMMED 09-28g: six known, the SRD's count (Gaseous Form off, Command on) |
| Willem Glass | wizard 5, the Rimeglass (our own, in Illusion's place, 09-28g): to 3rd | npcs-by-location.md §The Road | Ray of Frost, Phantasms (Mirror Image in round one) | the register's: Minor Illusion, Fire Bolt, Mage Hand, Prestidigitation; Disguise Self, Silent Image, Mage Armor, Shield, Invisibility, Mirror Image, *phantasmal force*, Major Image, Hypnotic Pattern. Slots 4/3/2. Flees with Amara, fights only to cover the going |
| the drow spell-weaver | game-original from the SRD Mage (a 9th-level caster) | content/monsters.json spellweaver | Fire Bolt, a lightning line, Hold, Darkness | the SRD Mage's list (marked SW), with the 8-bit's Lightning Bolt for Fireball, Hold Person, and the drow's innate |
| the spirit naga | SRD Spirit Naga (a 10th-level caster) | content/monsters.json naga | a lightning line, Hold | the SRD's list (marked Na): Blight, Dimension Door and Dominate Person are the new ones |
| innate | the drow: Dancing Lights at will, Darkness and Faerie Fire once a day (SRD); the duergar: Enlarge and Invisibility (SRD actions); the darkmantle: its Darkness Aura (a trait) | SRD 5.1 | Darkness and Faerie Fire on the grid; Enlarge once | Invisibility and Dancing Lights wait on the dark |

No sorcerer, bard, druid or ranger casts in the game yet. Their spells are judged for the foes to come, as a foe would cast them at the party. So are all spells of 6th level and up: no hero reaches them (the cap is 9).

## Ruled, 09-28

- **Spare the Dying: out.** *"leave it out"*. Neither game has death saves; the fallen are only down.
- **Dim light under the roost: lawful.** *"yes"*. Branding Smite's glow and the drow's Dancing Lights break nothing; the law is bright light.
- **Amara's patron: the Great Old One, the Mirror** (the register ratified it 08-29, module-halfway-inn.md; her block in npcs-by-location.md §The Road). His word: *"Default is Yes, though I thought the 'old one' pact would have a spell selection"* -- it does: the Great Old One's expanded list is the PHB's, not the SRD's, and of it the SRD has Hideous Laughter, Detect Thoughts, Clairvoyance, Sending, Dominate Beast, Black Tentacles, Dominate Person and Telekinesis (Dissonant Whispers and Phantasmal Force are not SRD). Her own spells are the register's (the table above).
- **Remove Curse: out.** The Ring of Binding is not a curse: *"it was to pull the chuul out of the water"* (the excuse for no swimming combat).
- **Creature types on the sheets: yes**, *"unless there's a case against it, we're trying to mechanize as much of the ruleset into play we can, until it starts impacting play experience"*. No case against found: the cost is tagging every sheet (most are SRD monsters with their type printed), and it opens Protection from Evil and Good (Lymen's oath at 3), Hold Person's humanoids (a tag today), Banishment's other planes.
- **The roost's word: "fired the roost"**, whatever the cause (the 8-bit line said "Fire" for Light too; mended).
- **The SRD stat blocks' lists as NPC lists: yes** where the register has none (the Priest for Torvald, the Mage for the spell-weaver, the Spirit Naga's own); the register's blocks win where they exist (Amara, Willem). The case against was harder fights to re-tune and each spell built twice; his word: *"harder fights and tuning sounds like 'better gameplay', so yes"*.
- **Resting anywhere: in, as field spells.** *"I'd add them the way you suggest, making sure their long-rests are counted with the others and allow saves."* Each spends a component, the game's first (a special case: nothing else consumes one): Rope Trick a skein of **Gulch Silk** (the gulch spiders' part, already in the game) for a short rest like the tent; Tiny Hut **a special snail shell**, new -- *"we'll put them as a dominion shore export"* -- that Percy sells, and not cheap (his first thing to sell: his shelf was flavour, 09-24): a long rest only where a tent goes, through the same rest (the story clocks count it, the morning's spells, the save). The shell's name and price the building seat drafts.
- **Shooting blind: the SRD's disadvantage** (AMENDED 09-28 ~18:4xZ, on his question *"is it the case that 5E 2014 does disadvantage and my -4 to attack notion was from different edition and shouldn't be what the game does?"* -- yes, the -4 is AD&D's; both games now give an unseen target disadvantage, an unseen attacker advantage; `js/rules.js R.BLIND` keeps the -4 as a switch).
- **The Mirror's eye: the pact of the Mirror's class feature**, all its warlocks (Amara first). *"I'll agree with Mirror Eye and it needing light. All Mirror Warlocks should get it as a class feature."* A mirror worn facing forward: in the cone before her, a creature in any light cannot hide from her and gains nothing by being invisible; it shows nothing in the dark. Built 09-28 (`deep16/js/magic.js inMirror`; `mirrorEye` on her sheets). In place of the PHB's Awakened Mind (dist-7 of the ear file); "the asking" of the register stays open (his note: more like *command*).
- **Willem's cantrip: Ray of Frost.** *"Willem is a frosty person, if he could have chosen it as a cantrip he would."* (The register's block says Fire Bolt: a character note for the Cowork seat to fold, with the shell as a Dominion shore export.)
- **Past the SRD: made our own** (the ear file `dev/distinct-ear-file-2026-09-28.json`, folded 09-28). The principle, canon: the SRD as it stands; what the register names past it the game makes its own, our name, our words, our function. **Hex -> Mirror's Gaze** (AMENDED, his name: on the SRD's Hunter's Mark, 1d6 psychic, no hiding from her). **Friends** dropped (Minor Illusion in its place). **Phantasmal Force** dropped (Willem's Blur in its place). **The pact of the Mirror** in the Great Old One's place, its expanded list SRD spells: 1st Silent Image, Hideous Laughter; 2nd Mirror Image, Detect Thoughts; 3rd Hypnotic Pattern, Clairvoyance; 4th Greater Invisibility, Confusion; 5th Mislead, Dominate Person. **Glass Whisper** (ours) in Dissonant Whispers' place: WIS or 2d6 psychic and no reactions. invented.json #past-the-srd, #mirrors-gaze, #no-friends, #willem-blur, #pact-of-the-mirror, #glass-whisper.
- **The asking is Command** (09-28): *"if command is SRD we'll assume that's what Kat saw working and described in her own words, not change spell name"*; and, on it being a cleric's: *"you're right unless warlocks have access to it"* -- they do: the SRD's own Fiend patron carries Command at the 1st. So Command goes on the pact of the Mirror's list, and Amara knows it (#the-asking-is-command).
- **The class NPCs** (09-28): *"Higertha is half-orc Druid, see if other existing NPCs need classes built and human the rest of the classes"*; *"except when matching existing NPCs, generic is good"*. Existing NPCs with a class are built by name; the rest human, standard array, named by class and level (#class-npcs).
- **Rope Trick and Tiny Hut in Aurdin's build** (09-28): *"The build's picks"*: Rope Trick at wizard 3, Tiny Hut at 5 (#aurdin-rest-spells).

## Ruled, 09-28g

- **Lymen's new spells in the 8-bit's own battle: yes.** *"yeah, they have to be able to transfer back and forth from 16bit fights."* Command, Branding Smite and Magic Weapon on the paladin list, Protection from Evil and Good and Sanctuary his oath's from 3 -- one law for both games (`js/rules.js`), and the 8-bit battle casts all five (#lymen-both-games). The SRD's bonus-action spells cost the bonus action there now, as on the grid (#bonus-action-spells-8bit).
- **The items into the 16-bit fights**: *"Also need to make sure items are being loaded into the 16bit fights."* The pack crosses as it stands; the Winnower, the Greyseam knife, the Door-Shield, the bat-wing pie and the elixir's paralysis cure were missing on the grid and are built there (#items-on-the-grid; `dev/bench16.js mode=items`).
- **Ingrith a cleric in the 8-bit too: yes.** *"Yes, she's meant to be Cleric."* Cleric 4, 31 HP by the d8, slots 4/3, the Life Domain (the seat's: the SRD's one), her drafted list and Spiritual Weapon; the heals counter retired; older saves carry her over (#ingrith-cleric).
- **The Mirror's four 1st-level spells and Amara's seventh: trim.** *"Trim."* The pact of the Mirror's 1st carries two, Glass Whisper and Command (the two his words named); Amara knows six at the 5th, Gaseous Form off her list (#pact-of-the-mirror, #the-asking-is-command).
- **The ooze's acid wearing gear down for good: no.** *"No."* The corrosion is the fight's alone (#ooze-wear-fight-only).
- **The subclasses past the SRD, and Torvald's none: our own.** *"Sufficiently distinct - Kat supposed to be Cleric of trickster deity trapped in mirror."* Drafted by the seat and built on the grid (`deep16/js/features.js`, `deep16/js/classes.js NPC.SUBS`): Talmok's **Path of the Sand** (First Blood, Down in the Sand; Answer Back at 6), Willem's **Rimeglass** (Rime Doubles; Rime Step at 6), Kat's **Window**, Tronupholen's menders (the Hand on the Neck; the Doubling; the Showing at 6; Disguise Self, Silent Image, Blur, Pass without Trace, Hypnotic Pattern, Clairvoyance), Torvald's **Vigil**, Dvalgarda's (Keeper's Ward; Hold the Door; Wakeful at 6; Sanctuary, Protection from Evil and Good, Hold Person, Warding Bond, Spirit Guardians, Glyph of Warding) (#path-of-the-sand, #the-rimeglass, #the-window, #the-vigil). Ingrith's domain is the SRD's Life (#ingrith-cleric).

## Ruled, 09-28h

- **Material components: none, except the rest spells'.** *"no material component for anything but the rest-ones"*: Rope Trick spends its Gulch Silk and Tiny Hut its Dome Whorl; Continual Flame needs no ruby (as built). **Revivify keeps its diamond** (asked, 09-28h: *"Keep the diamond"*; Dagny's grille and the cocoon's diamond keep their reason).
- **Lighting a torch costs an action** (the SRD tinderbox): *"yes to action cost"* (`deep16/js/light.js L.LIGHT_COST 'A'`).
- **The spell animation pass** (handoff-2026-09-28-spell-animation-pass.md §4): both games (*"might as well pretty spells it now"*; the 8-bit gets sprites where it needs them, entangling vines first); code for most, a visible double for whatever makes mirror images (to pop), the terrain art where it serves; the 15 ramps as they are (*"you creative from 15 sounds fine"*); an animation takes as long as it needs (*"The lack of spirit weapon as such is what made me see the need for this pass"*); a sound per element and an alternate for special cases; the cast pose for every caster we have. Fireball and Lightning Bolt are decent as they are; the drow's spells were lackluster.

- **Spell durations kept on the grid** (*"spell durations are theoretically important"*): every SRD spell's duration in rounds (`deep16/data/durations.js`, from the SRD cache by `tools/deep16-durations.py`); a concentration spell lets go when its time is up, at the start of the caster's turn (a minute is ten rounds: Hold Person, Bless, Haste, Banishment...); Mirror Image, Sanctuary and Blink end at their minute too. The 8-bit battle already ran its spells ten rounds.

## Still open

- Nothing from 09-28's list: all ruled 09-28g (above). The four subclasses are the seat's drafts, standing as approved: his word to redirect any of them.

## By level

### Cantrips (24)

| Spell | Classes | Who | Verdict | In the game |
|---|---|---|---|---|
| Acid Splash | W S | Au Wi | **BUILT** | one creature or two side by side, DEX save or 1d6 acid (2d6 at 5th) |
| Chill Touch | W K S | Au Am Wi | **BUILT** | spell attack 120 ft, 1d8 necrotic; no healing till your next turn; undead at disadv vs you -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Dancing Lights | W S B | Au Wi Dr | **BUILT** | the drow's innate at will: four lights, dim 10 ft each (lawful under the roost, 09-28) -- light with a position -- BUILT 09-28 (torchdark): four dim lights at a point within 120 ft, a bonus action moves them; the drow's innate awaits the NPC pass |
| Druidcraft | D |  | **OUT** | harmless tricks: a weather omen, a bloom, a puff or sound, lighting or snuffing a candle |
| Eldritch Blast | K | Am | **BUILT** | Amara's attack in both games (two beams at 5th, 1d10+3 force); a spell once NPCs cast; a spell now (09-28): beams by level, Agonizing and Repelling Blast |
| Fire Bolt | W S | Au Wi SW | **BUILT** | spell attack 120 ft, 1d10 fire (2d10 at 5th); the wizard's first-ring cantrip (09-28) |
| Guidance | C D | To In | **BUILT** | field: +1d4 to one ability check (conc) -- the 8-bit's CHECKs; a cleric's before a check -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Light | W C S B | Au To In Wi SW | **BUILT** | bright light fight-wide (what hates light recoils); under the roost the roof comes down |
| Mage Hand | W K S B | Au Am Wi SW Na | **OUT** | a spectral hand for small errands; nothing in a fight or on the map for it |
| Mending | W C S B D | Au To In Wi | **OUT** | repairs a break or tear; nothing in the game breaks |
| Message | W S B | Au Wi | **OUT** | a whispered message: social |
| Minor Illusion | W K S B | Au Am Wi Na | **LATER** | a sound or image to distract: needs foes the AI lets be fooled; the naga's cantrip |
| Poison Spray | W K S D | Au Am Wi | **BUILT** | one creature within 10 ft, CON save or 1d12 poison (2d12 at 5th) -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Prestidigitation | W K S B | Au Am Wi SW | **OUT** | harmless tricks |
| Produce Flame | D |  | **BUILT** | spell attack 30 ft, 1d8 fire (2d8 at 5th); a flame in hand lights 10 ft; a druid foe later -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Ray of Frost | W S | Au Wi Na | **BUILT** | Willem's attack today (2d8 cold); the spell adds speed -10 till your next turn (a sheet todo) -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Resistance | C D | To In | **BUILT** | touch (conc): +1d4 to one saving throw; a cleric guest before a fight -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Sacred Flame | C | To In | **BUILT** | DEX save or 1d8 radiant (2d8 at 5th), cover no help; Torvald's and Ingrith's cantrip -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it; and in the 8-bit battle since 09-28g (#ingrith-cleric) |
| Shillelagh | D |  | **BUILT** | self, bonus action: club or staff attacks use WIS, d8 damage, magical; a druid foe's melee -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Shocking Grasp | W S | Au Wi | **BUILT** | melee spell attack 1d8 lightning, adv vs metal armour; the target loses its reaction -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Spare the Dying | C | To In | **OUT** | RULED out 09-28 ("leave it out"): no death saves here, nothing to stabilize |
| Thaumaturgy | C | To In | **OUT** | minor wonders: flavour |
| True Strike | W K S B | Au Am Wi | **BUILT** | advantage on the first attack at one creature next turn (conc); weak, but cheap -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Vicious Mockery | B |  | **BUILT** | single: WIS save or 1d4 psychic (scales) and disadv on its next attack; a bard foe later -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |

### 1st (49)

| Spell | Classes | Who | Verdict | In the game |
|---|---|---|---|---|
| Alarm | W R | Au Wi | **OUT** | a ward that wakes the camp: rests are fixed places, nothing ambushes them |
| Animal Friendship | B D R |  | **LATER** | needs a charmed condition: a beast (INT 3 or less) fails WIS, won't attack you; harm ends it |
| Bane | C B | To In | **BUILT** | up to three, CHA save: -1d4 to attacks and saves (conc) -- Bless's mirror; a cleric foe's -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Bless | C P | Ly To In | **BUILT** | up to three: +1d4 to attacks and saves (conc) |
| Burning Hands | W S | Au Wi | **BUILT** | 15-ft cone, DEX save 3d6 fire (half); greyed under the roost |
| Charm Person | W K S B D | Au Am Wi Na | **LATER** | charmed: it won't attack the caster -- needs the AI to honour charm; the naga's, Amara's |
| Color Spray | W S | Au Wi | **BUILT** | 15-ft cone, 6d10 HP of creatures (lowest first) blinded till your next turn -- Sleep's way -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Command | C P | Ly To In | **BUILT** | one word, WIS save: FLEE (moves away), GROVEL (prone), HALT (loses its turn), DROP -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it; and in the 8-bit battle since 09-28g (#lymen-both-games) |
| Comprehend Languages | W K S B | Au Am Wi | **OUT** | reading and hearing any language: social |
| Create or Destroy Water | C D | To In | **OUT** | water by the gallon: the water is hand-waved |
| Cure Wounds | C P B D R | Ly To In | **BUILT** | touch, 1d8 + mod (+1d8 a slot); wakes one who is down (SRD, 09-28) |
| Detect Evil and Good | C P | Ly To In | **OUT** | senses aberrations, fiends, undead within 30 ft: nothing hidden to find by it |
| Detect Magic | W C P S B D R | Au Ly To In Wi SW Na | **BUILT** | field ritual: finds magic in the map's chests; never prepared (09-28) |
| Detect Poison and Disease | C P D R | Ly To In | **OUT** | senses poison and disease: nothing hidden to find by it |
| Disguise Self | W S B | Au Wi | **OUT** | a changed look: social |
| Divine Favor | P | Ly | **BUILT** | bonus action (conc): +1d4 radiant on weapon hits |
| Entangle | D |  | **BUILT** | cube terrain like Web: 20-ft square, STR save or restrained, difficult (conc); a druid foe -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Expeditious Retreat | W K S | Au Am Wi | **BUILT** | self (conc): Dash as a bonus action each turn -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Faerie Fire | D | Dr | **BUILT** | the drow's innate on the grid: 20-ft cube, DEX save or outlined -- attacks at adv, no hiding (conc); as a spell too (09-28: any caster, deep16/js/grimoire.js) |
| False Life | W S | Au Wi | **BUILT** | self: 1d4+4 temp HP for an hour (+5 a slot); cast ahead like Mage Armor -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Feather Fall | W S B | Au Wi | **OUT** | no falls to break in a fight; the guano slide is a save |
| Find Familiar | W | Au Wi | **LATER** | was OUT (invented.json no-familiar, Griz 09-24); REINSTATED 09-29 on his word ("familiars are pretty sweet - let's reinstate"): a ritual from the worldmap menu, the familiar picked by biome (his lean); on the grid a beast-shaped spirit on the party side that takes the Help action and lends its eyes; a spec is owed (handoff-2026-09-29-the-druid-and-the-familiar.md) |
| Floating Disk | W | Au Wi | **OUT** | carries 500 lb: the pack is unlimited |
| Fog Cloud | W S D R | Au Wi | **BUILT** | 20-ft sphere heavily obscured (conc): blocks sight both ways -- BUILT 09-28 (torchdark): heavily obscured on the grid (nothing sees in, out or across); the 8-bit: RUN slips away under it |
| Goodberry | D R |  | **OUT** | ten 1-HP berries (an action each) and a day's food; no caster for it, at most an item |
| Grease | W | Au Wi | **BUILT** | 10-ft square terrain: DEX save or prone, difficult (Web's cube, slick) -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Guiding Bolt | C | To In | **BUILT** | spell attack 120 ft, 4d6 radiant; the next attack at it has advantage; Torvald's -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Healing Word | C B D | To In | **BUILT** | bonus action, 60 ft, 1d4 + mod; wakes one who is down; Ingrith's -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it; and in the 8-bit battle since 09-28g (#ingrith-cleric) |
| Hellish Rebuke | K | Am | **BUILT** | reaction when hurt by one in 60 ft: DEX save 2d10 fire (half); Amara's; greyed under the roost -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Heroism | P B | Ly | **BUILT** | touch (conc): fearless, temp HP = mod each turn |
| Hideous Laughter | W B | Au Wi | **BUILT** | WIS save: prone and incapacitated (conc); a save each turn, and with adv when hurt -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Hunter's Mark | R |  | **BUILT** | single mark, bonus action (conc): +1d6 on weapon hits vs the target; a ranger foe later -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Identify | W B | Au Wi | **OUT** | no unidentified items in the game |
| Illusory Script | W K B | Au Am Wi | **OUT** | a secret message: social |
| Inflict Wounds | C | To In | **BUILT** | melee spell attack 3d10 necrotic (+1d10 a slot) -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Jump | W S D R | Au Wi | **OUT** | no heights to leap on the grid |
| Longstrider | W B D R | Au Wi | **BUILT** | touch: +10 ft speed for an hour; cast ahead -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Mage Armor | W S | Au Wi SW | **BUILT** | touch, no armour: AC 13 + DEX; holds till the long rest in the 8-bit (09-27) |
| Magic Missile | W S | Au Wi SW | **BUILT** | three darts, 1d4+1 force each, never miss (+1 dart a slot) |
| Protection from Evil and Good | W C P K | Au Ly To In Am Wi | **BUILT** | needs creature types on the sheets (RULED yes 09-28, to add); Lymen's oath spell at 3 -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it; and in the 8-bit battle since 09-28g (#lymen-both-games) |
| Purify Food and Drink | C P D | Ly To In | **OUT** | no food or drink in the game |
| Sanctuary | C | Ly To In | **BUILT** | bonus action: WIS save to attack the warded (else pick another); ends if it attacks; Torvald's; Lymen's oath at 3 -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it; and in the 8-bit battle since 09-28g (#lymen-both-games) |
| Shield | W S | Au Wi SW | **BUILT** | reaction: +5 AC till your next turn, the blow included |
| Shield of Faith | C P | Ly To In | **BUILT** | bonus action (conc): +2 AC |
| Silent Image | W S B | Au Wi | **LATER** | an image to fool: needs foes the AI lets be fooled |
| Sleep | W S B | Au Wi Na | **BUILT** | 20-ft sphere, 5d8 HP asleep, lowest first (+2d8 a slot) |
| Speak with Animals | B D R |  | **OUT** | talking with beasts for 10 minutes: conversation, no fight or field effect |
| Thunderwave | W S B D | Au Wi | **BUILT** | 15-ft cube from you, CON save 2d8 thunder and pushed 10 ft; greyed under the roost |
| Unseen Servant | W K B | Au Am Wi | **OUT** | an invisible errand-runner: nothing for it to do |

### 2nd (54)

| Spell | Classes | Who | Verdict | In the game |
|---|---|---|---|---|
| Acid Arrow | W | Au Wi | **BUILT** | spell attack 90 ft: 4d4 acid now, 2d4 at the end of its next turn (half on a miss) -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Aid | C P | Ly To In | **BUILT** | +5 max HP on up to three, the caster among them if he likes (09-28); holds till the long rest |
| Alter Self | W S | Au Wi | **OUT** | a changed body for the caster: travel and disguise |
| Animal Messenger | B D R |  | **OUT** | a beast carries a 25-word message over days: communication |
| Arcane Lock | W | Au Wi | **OUT** | locks a door: the maps lock their own |
| Arcanist's Magic Aura | W | Au Wi | **OUT** | a false aura: social |
| Augury | C | To In | **OUT** | divination: weal or woe |
| Barkskin | D R |  | **BUILT** | touch (ally), conc: its AC can't be less than 16; a druid foe's self-buff later -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Blindness/Deafness | W C S B | Au To In Wi | **BUILT** | CON save or blinded (or deafened) a minute, a save each turn; the blinded condition -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Blur | W S | Au Wi | **BUILT** | self (conc): attackers at disadvantage -- the Cloak of Displacement's edge -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Branding Smite | P | Ly | **BUILT** | Lymen: the next hit +2d6 radiant, shows the invisible; the target glows dim 5 ft (dim is lawful under the roost, 09-28) -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it; and in the 8-bit battle since 09-28g (#lymen-both-games) |
| Calm Emotions | C B | To In | **LATER** | ends charm and fear on humanoids, or makes them indifferent: needs charm and the AI |
| Continual Flame | W C | Au To In Wi | **BUILT** | a torch-bright flame that never goes out: always lit (Ottilie would stop it) -- BUILT 09-28 (torchdark): on the weapon in hand, bright 20 ft, never out; always lit, so Ottilie stops it; no ruby (nothing but the rest spells consumes a component) |
| Darkness | W K S | Au Am Wi Dr | **BUILT** | the drow's innate on the grid (15-ft sphere; swallows Light, Daylight burns it); a spell for Amara with the dark; as a spell too (09-28: any caster, deep16/js/grimoire.js) |
| Darkvision | W S D R | Au Wi | **BUILT** | see in the dark 60 ft: waits on the dark (the player sees, the characters do not) -- BUILT 09-28 (torchdark): 60 ft till the long rest, both games |
| Detect Thoughts | W S B | Au Wi Na | **OUT** | divination: surface thoughts |
| Enhance Ability | C S B D | To In | **BUILT** | touch (conc): Bear's 2d6 temp HP; Bull's adv on STR checks (grapples); Cat's on DEX -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Enlarge/Reduce | W S | Au Wi Du | **BUILT** | CON save: enlarged +1d4 weapon damage, adv STR; reduced -1d4, disadv STR; the duergar's -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Enthrall | K B | Am | **OUT** | a crowd held by a speech: social |
| Find Steed | P | Ly | **OUT** | no mounts in the fights (the horses are written out) |
| Find Traps | C D R | To In | **OUT** | senses traps' presence: the map's traps are its own |
| Flame Blade | D |  | **BUILT** | self (conc), then a melee spell attack each action, 3d6 fire; sheds light; a druid foe -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Flaming Sphere | W D | Au Wi | **BUILT** | a rolling 5-ft ball of fire (DEX 2d6, half) rolled 30 ft by a bonus action, ramming what it meets; ending a turn within 5 ft of it saves too; bright 20 ft -- BUILT 09-29 (the druid to nine, deep16/js/grimoire.js: the first zone that moves; grid-only) |
| Gentle Repose | W C | Au To In Wi | **OUT** | keeps a corpse fresh: nobody dies |
| Gust of Wind | W S D | Au Wi | **BUILT** | 60-ft line, STR save or pushed 15 ft; puts out flames and blows fog away -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Heat Metal | B D |  | **BUILT** | worn/held metal (conc): 2d8 fire, no save, again by bonus action; CON or drop it, else disadv -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Hold Person | W C K S B D | Au To In Am Wi Na | **BUILT** | a humanoid, WIS save or paralyzed, a save each turn (conc) |
| Invisibility | W K S B | Au Am Wi Du | **BUILT** | invisible till it attacks or casts: waits on the dark (the duergar's innate) -- BUILT 09-28 (torchdark): unseen till they attack or cast; the duergar's innate on the grid |
| Knock | W S B | Au Wi | **OUT** | opens a lock: the maps open their own |
| Lesser Restoration | C P B D R | Ly To In | **BUILT** | ends poison, paralysis, blindness, disease; Lymen's oath spell from 5 |
| Levitate | W S | Au Wi | **LATER** | lifts a creature 20 ft (CON save): no elevation on the grid |
| Locate Animals or Plants | B D R |  | **OUT** | divination: direction to the nearest beast or plant of a kind within 5 miles |
| Locate Object | W C P B D R | Au Ly To In Wi | **OUT** | divination |
| Magic Mouth | W B | Au Wi | **OUT** | a message on a trigger: dungeon dressing |
| Magic Weapon | W P | Au Ly Wi | **BUILT** | bonus action (conc, an hour): a weapon becomes +1 and magical -- plain-steel resistance no longer halves it -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it; and in the 8-bit battle since 09-28g (#lymen-both-games) |
| Mirror Image | W K S | Au Am Wi | **BUILT** | self: three duplicates, a hit may strike one instead (d20 by count); Willem's phantasms -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Misty Step | W K S | Au Am Wi SW | **BUILT** | grid only: a 30-ft teleport, bonus action |
| Moonbeam | D |  | **BUILT** | a 5-ft beam moved 60 ft by an action: CON 2d10 radiant (half) on entering it or starting a turn in it -- BUILT 09-29 (the druid to nine, deep16/js/grimoire.js: a zone that moves; grid-only) |
| Pass Without Trace | D R |  | **BUILT** | +10 Stealth for all within 30 ft, no tracks: its point is going unseen; waits on hiding -- BUILT 09-28 (torchdark): +10 Stealth to all within 30 ft on the grid (grid only: no druid or ranger casts yet) |
| Prayer of Healing | C | To In | **IN** | field: up to six, 2d8 + mod each, 10 minutes; a rest-side heal |
| Protection from Poison | C P D R | Ly To In | **BUILT** | touch: ends poison; adv on saves against it and resistance to poison damage, an hour -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Ray of Enfeeblement | W K | Au Am Wi | **BUILT** | spell attack: its STR weapon damage halved (conc); a CON save each turn ends it -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Rope Trick | W | Au Wi | **BUILT** | RULED in 09-28: field only, a short rest like the tent; spends a skein of Gulch Silk -- BUILT 09-28: the 8-bit field (js/events.js EV.fieldCast), Aurdin's from his picks |
| Scorching Ray | W S | Au Wi | **BUILT** | three rays, 2d6 fire each (+1 ray a slot); greyed under the roost |
| See Invisibility | W S B | Au Wi | **BUILT** | sees the invisible and the ethereal: waits on the dark -- BUILT 09-28 (torchdark): the caster sees the invisible |
| Shatter | W K S B | Au Am Wi | **BUILT** | 10-ft sphere, CON save 3d8 thunder (half); greyed under the roost |
| Silence | C B R | To In | **LATER** | 20-ft sphere: no sound, no verbal spells, thunder immune -- matters once foes cast |
| Spider Climb | W K S | Au Am Wi | **OUT** | walls and ceilings: no climbing on the grid |
| Spike Growth | D R |  | **BUILT** | terrain (conc): 20-ft radius, difficult, 2d4 piercing per 5 ft moved in it; a druid foe -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Spiritual Weapon | C | To In | **BUILT** | bonus action: a floating weapon, melee spell attack 1d8+mod force; moved 20 ft to strike again; Torvald's -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it; and in the 8-bit battle since 09-28g (#ingrith-cleric) |
| Suggestion | W K S B | Au Am Wi SW | **LATER** | a charm with a course of action: needs the AI to obey; the spell-weaver's (the SRD Mage) |
| Warding Bond | C | To In | **BUILT** | touch: +1 AC and saves, resistance to all damage; the caster takes the same damage -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Web | W S | Au Wi | **BUILT** | 20-ft cube terrain: DEX save or restrained, a save each turn (conc) |
| Zone of Truth | C P B | Ly To In | **OUT** | social; Lymen's oath spell at 5 (listed, not built) |

### 3rd (42)

| Spell | Classes | Who | Verdict | In the game |
|---|---|---|---|---|
| Animate Dead | W C | Au To Wi | **LATER** | summons: a skeleton or zombie that obeys |
| Beacon of Hope | C | Ly To | **BUILT** | allies in 30 ft (conc): adv on WIS saves, healing always max; Lymen's oath at 9 -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Bestow Curse | W C B | Au To Wi | **BUILT** | touch, WIS save: disadv on one ability, or on attacks vs you, or lose turns, or +1d8 necrotic -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Blink | W S | Au Wi | **BUILT** | self: at each turn's end, 50% ethereal (the engine's) till the next -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Call Lightning | D |  | **BUILT** | needs room overhead (conc): 5-ft-radius bolt, DEX save 3d10 lightning (half), again each action -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Clairvoyance | W C S B | Au To Wi | **OUT** | divination: a far sensor |
| Conjure Animals | D R |  | **BUILT** (09-30) | summons: fey beasts (one CR 2 up to eight CR 1/4; x2 at 5th); the caster picks from the bestiary by type and CR (`deep16/data/summons.js`: a beast drawn into the world joins the pool); one initiative for the lot; they fight as if commanded (RULED 09-30, Griz: "I like it. Build a frame so that it's pulling those selections from a place where more to choose from might go as the world expands") |
| Counterspell | W K S | Au Am Wi SW | **LATER** | a reaction to a foe's casting: waits on foes casting through the spell system; the Mage's |
| Create Food and Water | C P D | Ly To | **OUT** | no food in the game |
| Daylight | C P S D R | Ly To | **BUILT** | bright light fight-wide, burns magical Darkness; under the roost the roof comes down |
| Dispel Magic | W C P K S B D | Au Ly To Am Wi | **BUILT** | ends spells on a creature or in a place (a Web, a Hold, the drow's Darkness); Lymen's oath at 9 -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Fear | W K S B | Au Am Wi | **BUILT** | 30-ft cone, WIS save: drops what it holds, frightened, Dashes away (conc) -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Fireball | W S | Au Wi SW | **BUILT** | 20-ft sphere, DEX save 8d6 fire (half); greyed under the roost |
| Fly | W K S | Au Am Wi SW | **LATER** | flight: none on the grid; the Mage's |
| Gaseous Form | W K S | Au Am Wi | **OUT** | a mist that can't attack or cast: travel through cracks |
| Glyph of Warding | W C B | Au To Wi | **OUT** | an hour to scribe a trap: the maps' traps are their own |
| Haste | W S | Au Wi | **BUILT** | touch (conc): +2 AC, adv DEX saves, double speed, one more attack or Dash; a lost turn when it ends -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Hypnotic Pattern | W K S B | Au Am Wi | **BUILT** | 30-ft cube, WIS save: charmed, incapacitated, speed 0 till hurt or shaken (conc) -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Lightning Bolt | W S | Au Wi Na | **BUILT** | 100-ft line, DEX save 8d6 lightning (half) |
| Magic Circle | W C P K | Au Ly To Am Wi | **OUT** | a warded cylinder against one kind, a minute to cast: set-up, not a fight |
| Major Image | W K S B | Au Am Wi | **LATER** | an illusion to fool: needs foes the AI lets be fooled |
| Mass Healing Word | C | To | **BUILT** | bonus action: up to six in 60 ft, 1d4 + mod each -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Meld Into Stone | C | To | **OUT** | hiding inside stone: no fight or field use |
| Nondetection | W B R | Au Wi | **OUT** | hides from divination |
| Phantom Steed | W | Au Wi | **OUT** | a horse for travel |
| Plant Growth | B D R |  | **LATER** | needs plant tiles: plants within 100 ft cost 4 ft per foot moved; the harvest use is moot |
| Protection From Energy | W C S D R | Au To Wi | **BUILT** | touch (conc): resistance to acid, cold, fire, lightning or thunder -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Remove Curse | W C P K | Au Ly To Am Wi | **OUT** | no curses in the game to lift (the Ring of Binding is not one, RULED 09-28) |
| Revivify | C P | Ly To | **BUILT** | 8-bit field: a diamond brings one who is down back at 1 HP; the grid: nobody dies |
| Sending | W C B | Au To Wi | **OUT** | a message across any distance |
| Sleet Storm | W S D | Au Wi | **BUILT** | 40-ft cylinder: heavily obscured, difficult, DEX or prone, concentration shaken -- BUILT 09-28 (torchdark): heavily obscured, ice (difficult, DEX or prone), flames doused, a caster inside checks CON; the 8-bit: foes DEX or prone each turn |
| Slow | W S | Au Wi | **BUILT** | up to six in a 40-ft cube, WIS save: -2 AC and DEX saves, half speed, no reactions, one attack -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Speak with Dead | C B | To | **OUT** | questions to a corpse: a scene, not a cast |
| Speak with Plants | B D R |  | **OUT** | questioning plants; its brush-to-difficult-terrain side is minor and needs plant tiles |
| Spirit Guardians | C | To | **BUILT** | aura 15 ft (conc): foes entering or starting there WIS save 3d8 radiant (half), half speed; Torvald's -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Stinking Cloud | W S B | Au Wi | **BUILT** | 20-ft sphere heavily obscured; CON save or lose the action -- the obscuring waits on the dark -- BUILT 09-28 (torchdark): heavily obscured, CON each turn inside or the action is lost; the 8-bit: foes save each turn |
| Tiny Hut | W B | Au Wi | **BUILT** | RULED in 09-28: field only, a long rest where a tent goes, counted with the rest (clocks, morning, save); spends a snail shell from Percy's -- BUILT 09-28: the 8-bit field (js/events.js EV.fieldCast), Aurdin's from his picks |
| Tongues | W C K S B | Au To Am Wi | **OUT** | any language: social |
| Vampiric Touch | W K | Au Am Wi | **BUILT** | melee spell attack 3d6 necrotic, heals half (conc; again each action) -- BUILT 09-28 (the class NPCs, deep16/js/grimoire.js): on the grid, cast by any unit that knows it (grid-only: no 8-bit record) |
| Water Breathing | W S D R | Au Wi Na | **OUT** | the water is hand-waved: nobody swims; the naga's list has it |
| Water Walk | C S D R | To | **OUT** | the water is hand-waved |
| Wind Wall | D R |  | **LATER** | a wall of wind up to 50 ft: STR save 3d8 (half), arrows through it miss; needs walls |

### 4th (31)

| Spell | Classes | Who | Verdict | In the game |
|---|---|---|---|---|
| Arcane Eye | W C | Au | **OUT** | a scouting eye: divination |
| Banishment | W C P K S | Au | **BUILT** | CHA save: gone from the field while concentration holds; one from another plane gone for good -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Black Tentacles | W | Au | **BUILT** | 20-ft square terrain (conc): difficult; DEX save or 3d6 bludgeoning and restrained -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Blight | W K S D | Au Na | **BUILT** | CON save 8d8 necrotic (half); the naga's -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Compulsion | B |  | **LATER** | a charm that drives movement: WIS save, then it must move the way you point; forced moves |
| Confusion | W S B D | Au | **BUILT** | 10-ft sphere, WIS save (conc): each turn a d10 -- wander, stand, strike at random -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Conjure Minor Elementals | W D | Au | **LATER** | summons: elementals that obey |
| Conjure Woodland Beings | D R |  | **BUILT, waiting** (09-30) | summons: fey (one CR 2 up to eight CR 1/4); the same frame as Conjure Animals -- greyed until the bestiary has a fey to answer |
| Control Water | W C D | Au | **OUT** | the water is hand-waved |
| Death Ward | C P |  | **BUILT** | touch (ally), 8 hr: the first drop to 0 HP leaves it at 1 instead; a foe priest's champion -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Dimension Door | W K S B | Au Na | **BUILT** | teleport 500 ft with one ally: across the field or off it; the naga's -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Divination | D |  | **OUT** | divination: one question about the next 7 days, a cryptic reply |
| Dominate Beast | S D |  | **LATER** | control of a creature: a beast fails WIS and obeys the caster; needs dominate |
| Fabricate | W | Au | **OUT** | crafting |
| Faithful Hound | W | Au | **LATER** | an invisible watchdog that bites: a summon |
| Fire Shield | W | Au | **BUILT** | self: warm or chill -- resistance to one, and 2d8 back at whoever strikes you in melee -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Freedom of Movement | C B D R |  | **BUILT** | touch (ally), 1 hr: ignores difficult terrain, no magic paralysis or restraint, slips grapples -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Giant Insect | D |  | **LATER** | summons: bugs grown giant (centipedes, spiders, wasps, a scorpion) that obey; needs summons |
| Greater Invisibility | W S B | Au SW | **BUILT** | grid: invisible even while attacking (conc) |
| Guardian of Faith | C |  | **BUILT** | a fixed Large guardian, 8 hr: foes coming within 10 ft DEX save 20 radiant; gone at 60 dealt -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Hallucinatory Terrain | W K B D | Au | **OUT** | scenery illusion |
| Ice Storm | W S D | Au SW | **BUILT** | 20-ft cylinder, DEX save 2d8 bludgeoning + 4d6 cold (half), difficult |
| Locate Creature | W C P B D R | Au | **OUT** | divination |
| Phantasmal Killer | W | Au | **BUILT** | WIS save: frightened, 4d10 psychic at each turn's end till a save (conc) -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Polymorph | W S B D | Au | **LATER** | needs stat blocks to become (a beast's sheet): a foe made a toad, later |
| Private Sanctum | W | Au | **OUT** | a warded room: set-up |
| Resilient Sphere | W | Au | **BUILT** | DEX save: sealed in a sphere (conc) -- one foe out of the fight, or a friend kept safe -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Secret Chest | W | Au | **OUT** | storage |
| Stone Shape | W C D | Au | **OUT** | reshapes stone: the maps' walls are the story's |
| Stoneskin | W S D R | Au | **BUILT** | touch (conc): resistance to nonmagical blades, bolts, bites |
| Wall of Fire | W S D | Au | **LATER** | walls (and fire: greyed under the roost) |

### 5th (37)

| Spell | Classes | Who | Verdict | In the game |
|---|---|---|---|---|
| Animate Objects | W S B | Au | **LATER** | summons: objects that fight |
| Antilife Shell | D |  | **LATER** | a 10-ft barrier moving with the caster: the living can't pass or reach in; moving walls |
| Arcane Hand | W | Au | **LATER** | a Large hand that punches, shoves, grapples, shields: a summon |
| Awaken | B D |  | **OUT** | an 8-hour rite giving a beast or plant INT 10 and speech: story, not a cast in play |
| Cloudkill | W S | Au | **LATER** | a 20-ft poison cloud (CON 5d8, half) drifting 10 ft a turn, obscuring: moving zones and the dark |
| Commune | C |  | **OUT** | divination: three yes-or-no questions to a deity |
| Commune With Nature | D R |  | **OUT** | divination: three facts about the land within 3 miles |
| Cone of Cold | W S | Au SW | **BUILT** | 60-ft cone, CON save 8d8 cold (half) |
| Conjure Elemental | W D | Au | **LATER** | summons: an elemental that obeys, hostile if concentration breaks |
| Contact Other Plane | W K | Au | **OUT** | divination |
| Contagion | C D |  | **BUILT** | touch attack: a disease (blinded, vulnerable to all, stunned when hurt...); 3 CON fails, 7 days -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Creation | W S | Au | **OUT** | crafting |
| Dispel Evil and Good | C P |  | **BUILT** | self (conc): undead, fiends, fey etc. at disadv vs you; a touch frees the charmed or banishes -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Dominate Person | W S B | Au Na | **LATER** | control of a humanoid (a hero turned on the party): needs dominate; the naga's |
| Dream | W K B | Au | **OUT** | a message in a dream |
| Flame Strike | C |  | **BUILT** | sphere 10-ft radius, DEX save 4d6 fire + 4d6 radiant (half); a cleric foe later -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Geas | W C P B D | Au | **OUT** | a binding command over days: story |
| Greater Restoration | C B D |  | **BUILT** | touch cure: ends charm, petrify, a curse, stat or HP-max drain; the answer to harm, feeblemind -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Hallow | C |  | **LATER** | a 24-hr rite on a place: a lair law (fear, vulnerability, no undead); needs place-bound laws |
| Hold Monster | W K S B | Au | **BUILT** | any creature, WIS save or paralyzed, a save each turn (conc) |
| Insect Plague | C S D |  | **BUILT** | a lasting 20-ft sphere (conc): CON save 4d10 piercing on appear, entry, end turn; difficult -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Legend Lore | W C B | Au | **OUT** | divination |
| Mass Cure Wounds | C B D |  | **BUILT** | allies, up to six in a 30-ft sphere: 3d8 + mod each; a foe priest healing its band -- BUILT 09-28 (batch D, deep16/js/grimoire.js): on the grid, for the foes' casters and the NPCs past 6 |
| Mislead | W B | Au | **BUILT** | invisible, and an illusory double: waits on the dark -- BUILT 09-28 (torchdark): invisible till he attacks or casts, and one false image |
| Modify Memory | W B | Au | **OUT** | social |
| Passwall | W | Au | **OUT** | a passage through a wall: the maps' walls are the story's |
| Planar Binding | W C B D | Au | **OUT** | planar business |
| Raise Dead | C P B |  | **OUT** | nobody dies here (the fallen are only down), and it takes an hour |
| Reincarnate | D |  | **OUT** | nobody dies here (the fallen are only down); a new body by a 1-hour rite |
| Scrying | W C K B D | Au | **OUT** | divination |
| Seeming | W S B | Au | **OUT** | disguises: social |
| Telekinesis | W S | Au | **LATER** | moves a creature 30 ft (a contest) or an object: forced moves and objects |
| Telepathic Bond | W | Au | **OUT** | communication |
| Teleportation Circle | W S B | Au | **OUT** | travel |
| Tree Stride | D R |  | **LATER** | needs trees on the grid: into one tree, out of a like tree within 500 ft; a druid foe |
| Wall of Force | W | Au | **LATER** | walls |
| Wall of Stone | W S D | Au | **LATER** | walls |

### 6th (31)

| Spell | Classes | Who | Verdict | In the game |
|---|---|---|---|---|
| Blade Barrier | C |  | **LATER** | a wall of blades (line or ring): DEX save 6d10 slashing on entry or start; needs walls |
| Chain Lightning | W S |  | **BUILT** | a target plus three more within 30 ft of it, DEX save 10d8 lightning (half); a foe archmage -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Circle of Death | W K S |  | **BUILT** | sphere 60-ft radius, CON save 8d6 necrotic (half); a foe necromancer or warlock later -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Conjure Fey | K D |  | **LATER** | summons: one fey of CR 6 or lower that obeys, turning hostile if concentration breaks |
| Contingency | W |  | **LATER** | a stored self-spell set off by a named trigger: needs triggered spells (a boss's backup) |
| Create Undead | W C K |  | **LATER** | night only, 1-min cast: up to three ghouls that obey; summons (or just ghouls on the map) |
| Disintegrate | W S |  | **BUILT** | single: DEX save or 10d6+40 force, none on a save; dust moot, the fallen are only down; a lich -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Eyebite | W K S B |  | **BUILT** | one target per action (conc): WIS save or asleep, panicked (flees), or sickened (disadv) -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Find the Path | C B D |  | **OUT** | travel: knows the shortest route to a familiar place |
| Flesh to Stone | W K |  | **BUILT** | single (conc): CON save or restrained; 3 fails petrified, 3 saves free; needs petrified -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Forbiddance | C |  | **LATER** | a 24-hr ward on a place: no teleporting in, chosen kinds take 5d10; needs place-bound laws |
| Freezing Sphere | W |  | **BUILT** | sphere 60-ft radius, CON save 10d6 cold (half); the kept globe and frozen water aside -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Globe of Invulnerability | W S |  | **BUILT** | fixed 10-ft sphere (conc): spells of 5th or lower from outside can't touch those in it; a lich -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Guards and Wards | W B |  | **OUT** | a stronghold's dressing (fog, locks, webs, lights) for 24 hr: build it as the dungeon |
| Harm | C |  | **BUILT** | single: CON save 14d6 necrotic (half), never below 1 HP; a fail cuts HP max for an hour -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Heal | C D |  | **BUILT** | single ally: regains 70 HP, ends blinded, deafened, disease; a foe high priest's boss heal -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Heroes' Feast | C D |  | **IN** | field, 24 hr for 12: immune poison and fear, adv on WIS saves, +2d10 HP max; a host's gift |
| Instant Summons | W |  | **OUT** | utility: a marked item appears in hand |
| Irresistible Dance | W B |  | **BUILT** | single, no first save (conc): dances in place, disadv attacks and DEX saves, attackers at adv -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Magic Jar | W |  | **LATER** | possession: the caster's soul takes a humanoid's body (CHA save); control of a creature |
| Mass Suggestion | W K S B |  | **LATER** | a charm setting a course for up to 12 (WIS, 24 hr): control, or a story beat |
| Move Earth | W S D |  | **OUT** | reshapes earth over 10-minute stretches: too slow for a fight; earthworks are story |
| Planar Ally | C |  | **OUT** | planar bargaining for a paid service; a hired ally is story, not a cast |
| Programmed Illusion | W B |  | **OUT** | a scripted illusion on a trigger: dungeon dressing with no mechanical effect |
| Sunbeam | W S D |  | **BUILT** | line 60 ft (conc, again each action): CON save 6d8 radiant + blinded; its mote is sunlight -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Transport via Plants | D |  | **OUT** | travel: step into one big plant and out of another anywhere |
| True Seeing | W C K S B |  | **BUILT** | truesight 120 ft for an hour: sees the invisible, through darkness and illusion -- BUILT 09-28 (torchdark): truesight 120 ft on the grid (grid only: no hero reaches 6th) |
| Wall of Ice | W |  | **LATER** | a wall of ice (panels or dome, 30 HP a section): DEX save 10d6 cold; needs walls |
| Wall of Thorns | D |  | **LATER** | a wall of thorns that blocks sight: DEX save 7d8, slow and painful to cross; needs walls |
| Wind Walk | D |  | **OUT** | travel: cloud form flying 300 ft, can only Dash; a minute to change back |
| Word of Recall | C |  | **OUT** | travel: the caster and five teleport to a sanctuary; at most a foe priest's escape |

### 7th (20)

| Spell | Classes | Who | Verdict | In the game |
|---|---|---|---|---|
| Arcane Sword | W B |  | **BUILT** | like Spiritual Weapon: a floating sword, melee spell attack 3d10 force, moved 20 ft by bonus -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Conjure Celestial | C |  | **LATER** | summons: a celestial of CR 4 or lower that obeys; needs summons |
| Delayed Blast Fireball | W S |  | **BUILT** | a bead (conc) that bursts as a 20-ft sphere, DEX save 12d6 fire +1d6 per turn it waits -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Divine Word | C |  | **BUILT** | any number within 30 ft, CHA save, by HP: 50 deafened, 40 blinded, 30 stunned, 20 down -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Etherealness | W C K S B |  | **BUILT** | self, 8 hr: ethereal (the engine's) and moves through walls; a foe's escape or ambush -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Finger of Death | W K S |  | **BUILT** | single: CON save 7d8+30 necrotic (half); the zombie rider is moot, nobody dies; a lich -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Fire Storm | C S D |  | **BUILT** | ten 10-ft cubes laid as the caster likes, DEX save 7d10 fire (half); can spare plants -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Forcecage | W K B |  | **LATER** | a force prison, no save, 1 hr: none leave but by teleport and a CHA save; needs walls |
| Magnificent Mansion | W B |  | **OUT** | 7th level: no hero reaches it, and a foe has no use for a hideaway |
| Mirage Arcane | W B D |  | **OUT** | terrain illusion over a square mile for 10 days: scenery, not a fight |
| Plane Shift | W C K S D |  | **OUT** | planar travel; its banishing touch would send a hero off-world for good |
| Prismatic Spray | W S |  | **BUILT** | cone 60 ft, DEX save, a d8 ray each: 10d6 of five types, restrain-to-stone, blind-to-banish -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Project Image | W B |  | **OUT** | a far illusory double to talk through: a villain's messenger, a story beat |
| Regenerate | C B D |  | **BUILT** | touch (1-min cast): 4d8+15 HP, then 1 HP a turn for an hour; a boss's pre-cast -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Resurrection | C B |  | **OUT** | nobody dies here (the fallen are only down), and it takes an hour |
| Reverse Gravity | W S D |  | **LATER** | a 50-ft cylinder where all fall upward (DEX to hold on): needs elevation |
| Sequester | W |  | **OUT** | hides a creature or object in suspended animation: story |
| Simulacrum | W |  | **LATER** | 12-hr rite: a half-HP double that obeys; a boss's twin needs allies it controls |
| Symbol | W C B |  | **BUILT** | a glyph trap (INT check to find): a 60-ft sphere on trigger - death 10d10, fear, sleep, stun -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Teleport | W S B |  | **OUT** | travel to a known place |

### 8th (16)

| Spell | Classes | Who | Verdict | In the game |
|---|---|---|---|---|
| Animal Shapes | D |  | **LATER** | polymorph: willing creatures become beasts of CR 4 or lower; needs stat blocks |
| Antimagic Field | W C |  | **LATER** | a moving 10-ft no-magic sphere: spells and magic items suppressed; needs moving zones |
| Antipathy/Sympathy | W D |  | **LATER** | a 10-day aura on a place or thing repels (frightened) or lures a kind; place-bound laws |
| Clone | W |  | **OUT** | a spare body against death; nobody dies here |
| Control Weather | W C D |  | **OUT** | weather within 5 miles changing over tens of minutes; the game has no weather |
| Demiplane | W K |  | **OUT** | a door to an empty room: utility |
| Dominate Monster | W K S B |  | **LATER** | control of a creature: fails WIS and obeys (a hero turned on the party); a lich; needs dominate |
| Earthquake | C S D |  | **BUILT** | 100-ft radius (conc): difficult, DEX save or prone each turn, CON or lose concentration -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Feeblemind | W K B D |  | **BUILT** | single: 4d6 psychic, INT save or INT/CHA 1, no spells or speech; a save per 30 days; heal cures -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Glibness | K B |  | **OUT** | social: Charisma checks at least 15, lies pass as truth |
| Holy Aura | C |  | **BUILT** | allies in 30 ft (conc): adv on saves, attacks vs them at disadv; undead hitters CON or blind -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Incendiary Cloud | W S |  | **LATER** | a cloud drifting 10 ft a turn: DEX save 10d8 fire, heavily obscured; needs moving clouds |
| Maze | W |  | **BUILT** | single, no save (conc): gone from the field until a DC 20 INT check as its action -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Mind Blank | W B |  | **BUILT** | touch (ally), 24 hr: immune to psychic damage and to charm; a ward before the naga -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Power Word Stun | W K S B |  | **BUILT** | single, no save: stunned if 150 HP or fewer; CON save at the end of its turns; a lich -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Sunburst | W S D |  | **BUILT** | sphere 60-ft radius, CON save 12d6 radiant + blinded (save each turn); ends spell darkness -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |

### 9th (15)

| Spell | Classes | Who | Verdict | In the game |
|---|---|---|---|---|
| Astral Projection | W C K |  | **OUT** | planar travel on the Astral Plane |
| Foresight | W K B D |  | **BUILT** | touch (ally), 8 hr: adv on attacks, checks, saves; attacks vs it at disadv; a boss pre-cast -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Gate | W C S |  | **LATER** | a portal, or a named being pulled through it (not controlled): summons, or a story beat |
| Imprisonment | W K |  | **OUT** | a 1-minute rite binding a creature for good: a story's end, not a fight |
| Mass Heal | C |  | **BUILT** | allies in sight: 700 HP shared as the caster likes, ends blinded, deafened, disease -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Meteor Swarm | W S |  | **BUILT** | four 40-ft spheres, DEX save 20d6 fire + 20d6 bludgeoning (half), hit once -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Power Word Kill | W K S B |  | **BUILT** | single, no save: at 100 HP or fewer it drops (only down here); a lich later -- BUILT 09-28 (batch E, deep16/js/grimoire.js): on the grid, for the foes past the cap (a lich, an archmage) |
| Prismatic Wall | W |  | **LATER** | a seven-layer wall or globe, a save per layer; blinds within 20 ft; needs walls |
| Shapechange | W D |  | **LATER** | polymorph self into any creature up to its level: needs stat blocks |
| Storm of Vengeance | D |  | **IN** | whole field (conc), a new blow each round: thunder, acid, six 10d6 bolts, hail, sleet |
| Time Stop | W S |  | **LATER** | time: the caster takes 1d4+1 turns in a row, ended if it affects anyone else; turn control |
| True Polymorph | W K B |  | **LATER** | polymorph: creature to creature or object, permanent after an hour; needs stat blocks |
| True Resurrection | C D |  | **OUT** | nobody dies here (the fallen are only down) |
| Weird | W |  | **BUILT** | sphere 30-ft radius (conc): WIS save or frightened, 4d10 psychic each turn till a WIS save -- BUILT 09-28 (deep16/js/grimoire.js): Phantasmal Killer for a crowd |
| Wish | W S |  | **LATER** | copies any spell of 8th or lower once they're built, or forces a reroll; the rest is story |

## By class

The same verdicts, a line a level: each class's own SRD list.

### Wizard (204)

- **Cantrips:** Acid Splash (BUILT), Chill Touch (IN), Dancing Lights (BUILT), Fire Bolt (BUILT), Light (BUILT), Mage Hand (OUT), Mending (OUT), Message (OUT), Minor Illusion (LATER), Poison Spray (IN), Prestidigitation (OUT), Ray of Frost (IN), Shocking Grasp (IN), True Strike (IN)
- **1st:** Alarm (OUT), Burning Hands (BUILT), Charm Person (LATER), Color Spray (IN), Comprehend Languages (OUT), Detect Magic (BUILT), Disguise Self (OUT), Expeditious Retreat (IN), False Life (IN), Feather Fall (OUT), Find Familiar (OUT), Floating Disk (OUT), Fog Cloud (BUILT), Grease (IN), Hideous Laughter (IN), Identify (OUT), Illusory Script (OUT), Jump (OUT), Longstrider (IN), Mage Armor (BUILT), Magic Missile (BUILT), Protection from Evil and Good (LATER), Shield (BUILT), Silent Image (LATER), Sleep (BUILT), Thunderwave (BUILT), Unseen Servant (OUT)
- **2nd:** Acid Arrow (IN), Alter Self (OUT), Arcane Lock (OUT), Arcanist's Magic Aura (OUT), Blindness/Deafness (IN), Blur (IN), Continual Flame (BUILT), Darkness (BUILT), Darkvision (BUILT), Detect Thoughts (OUT), Enlarge/Reduce (IN), Flaming Sphere (LATER), Gentle Repose (OUT), Gust of Wind (IN), Hold Person (BUILT), Invisibility (BUILT), Knock (OUT), Levitate (LATER), Locate Object (OUT), Magic Mouth (OUT), Magic Weapon (IN), Mirror Image (IN), Misty Step (BUILT), Ray of Enfeeblement (IN), Rope Trick (IN), Scorching Ray (BUILT), See Invisibility (BUILT), Shatter (BUILT), Spider Climb (OUT), Suggestion (LATER), Web (BUILT)
- **3rd:** Animate Dead (LATER), Bestow Curse (IN), Blink (IN), Clairvoyance (OUT), Counterspell (LATER), Dispel Magic (IN), Fear (IN), Fireball (BUILT), Fly (LATER), Gaseous Form (OUT), Glyph of Warding (OUT), Haste (IN), Hypnotic Pattern (IN), Lightning Bolt (BUILT), Magic Circle (OUT), Major Image (LATER), Nondetection (OUT), Phantom Steed (OUT), Protection From Energy (IN), Remove Curse (OUT), Sending (OUT), Sleet Storm (BUILT), Slow (IN), Stinking Cloud (BUILT), Tiny Hut (IN), Tongues (OUT), Vampiric Touch (IN), Water Breathing (OUT)
- **4th:** Arcane Eye (OUT), Banishment (IN), Black Tentacles (IN), Blight (IN), Confusion (IN), Conjure Minor Elementals (LATER), Control Water (OUT), Dimension Door (IN), Fabricate (OUT), Faithful Hound (LATER), Fire Shield (IN), Greater Invisibility (BUILT), Hallucinatory Terrain (OUT), Ice Storm (BUILT), Locate Creature (OUT), Phantasmal Killer (IN), Polymorph (LATER), Private Sanctum (OUT), Resilient Sphere (IN), Secret Chest (OUT), Stone Shape (OUT), Stoneskin (BUILT), Wall of Fire (LATER)
- **5th:** Animate Objects (LATER), Arcane Hand (LATER), Cloudkill (LATER), Cone of Cold (BUILT), Conjure Elemental (LATER), Contact Other Plane (OUT), Creation (OUT), Dominate Person (LATER), Dream (OUT), Geas (OUT), Hold Monster (BUILT), Legend Lore (OUT), Mislead (BUILT), Modify Memory (OUT), Passwall (OUT), Planar Binding (OUT), Scrying (OUT), Seeming (OUT), Telekinesis (LATER), Telepathic Bond (OUT), Teleportation Circle (OUT), Wall of Force (LATER), Wall of Stone (LATER)
- **6th:** Chain Lightning (IN), Circle of Death (IN), Contingency (LATER), Create Undead (LATER), Disintegrate (IN), Eyebite (IN), Flesh to Stone (IN), Freezing Sphere (IN), Globe of Invulnerability (IN), Guards and Wards (OUT), Instant Summons (OUT), Irresistible Dance (IN), Magic Jar (LATER), Mass Suggestion (LATER), Move Earth (OUT), Programmed Illusion (OUT), Sunbeam (IN), True Seeing (BUILT), Wall of Ice (LATER)
- **7th:** Arcane Sword (IN), Delayed Blast Fireball (IN), Etherealness (IN), Finger of Death (IN), Forcecage (LATER), Magnificent Mansion (OUT), Mirage Arcane (OUT), Plane Shift (OUT), Prismatic Spray (IN), Project Image (OUT), Reverse Gravity (LATER), Sequester (OUT), Simulacrum (LATER), Symbol (IN), Teleport (OUT)
- **8th:** Antimagic Field (LATER), Antipathy/Sympathy (LATER), Clone (OUT), Control Weather (OUT), Demiplane (OUT), Dominate Monster (LATER), Feeblemind (IN), Incendiary Cloud (LATER), Maze (IN), Mind Blank (IN), Power Word Stun (IN), Sunburst (IN)
- **9th:** Astral Projection (OUT), Foresight (IN), Gate (LATER), Imprisonment (OUT), Meteor Swarm (IN), Power Word Kill (IN), Prismatic Wall (LATER), Shapechange (LATER), Time Stop (LATER), True Polymorph (LATER), Weird (IN), Wish (LATER)

### Cleric (105)

- **Cantrips:** Guidance (IN), Light (BUILT), Mending (OUT), Resistance (IN), Sacred Flame (IN), Spare the Dying (OUT), Thaumaturgy (OUT)
- **1st:** Bane (IN), Bless (BUILT), Command (IN), Create or Destroy Water (OUT), Cure Wounds (BUILT), Detect Evil and Good (OUT), Detect Magic (BUILT), Detect Poison and Disease (OUT), Guiding Bolt (IN), Healing Word (IN), Inflict Wounds (IN), Protection from Evil and Good (LATER), Purify Food and Drink (OUT), Sanctuary (IN), Shield of Faith (BUILT)
- **2nd:** Aid (BUILT), Augury (OUT), Blindness/Deafness (IN), Calm Emotions (LATER), Continual Flame (BUILT), Enhance Ability (IN), Find Traps (OUT), Gentle Repose (OUT), Hold Person (BUILT), Lesser Restoration (BUILT), Locate Object (OUT), Prayer of Healing (IN), Protection from Poison (IN), Silence (LATER), Spiritual Weapon (IN), Warding Bond (IN), Zone of Truth (OUT)
- **3rd:** Animate Dead (LATER), Beacon of Hope (IN), Bestow Curse (IN), Clairvoyance (OUT), Create Food and Water (OUT), Daylight (BUILT), Dispel Magic (IN), Glyph of Warding (OUT), Magic Circle (OUT), Mass Healing Word (IN), Meld Into Stone (OUT), Protection From Energy (IN), Remove Curse (OUT), Revivify (BUILT), Sending (OUT), Speak with Dead (OUT), Spirit Guardians (IN), Tongues (OUT), Water Walk (OUT)
- **4th:** Arcane Eye (OUT), Banishment (IN), Control Water (OUT), Death Ward (IN), Freedom of Movement (IN), Guardian of Faith (IN), Locate Creature (OUT), Stone Shape (OUT)
- **5th:** Commune (OUT), Contagion (IN), Dispel Evil and Good (IN), Flame Strike (IN), Geas (OUT), Greater Restoration (IN), Hallow (LATER), Insect Plague (IN), Legend Lore (OUT), Mass Cure Wounds (IN), Planar Binding (OUT), Raise Dead (OUT), Scrying (OUT)
- **6th:** Blade Barrier (LATER), Create Undead (LATER), Find the Path (OUT), Forbiddance (LATER), Harm (IN), Heal (IN), Heroes' Feast (IN), Planar Ally (OUT), True Seeing (BUILT), Word of Recall (OUT)
- **7th:** Conjure Celestial (LATER), Divine Word (IN), Etherealness (IN), Fire Storm (IN), Plane Shift (OUT), Regenerate (IN), Resurrection (OUT), Symbol (IN)
- **8th:** Antimagic Field (LATER), Control Weather (OUT), Earthquake (IN), Holy Aura (IN)
- **9th:** Astral Projection (OUT), Gate (LATER), Mass Heal (IN), True Resurrection (OUT)

### Paladin (31)

- **1st:** Bless (BUILT), Command (IN), Cure Wounds (BUILT), Detect Evil and Good (OUT), Detect Magic (BUILT), Detect Poison and Disease (OUT), Divine Favor (BUILT), Heroism (BUILT), Protection from Evil and Good (LATER), Purify Food and Drink (OUT), Shield of Faith (BUILT)
- **2nd:** Aid (BUILT), Branding Smite (IN), Find Steed (OUT), Lesser Restoration (BUILT), Locate Object (OUT), Magic Weapon (IN), Protection from Poison (IN), Zone of Truth (OUT)
- **3rd:** Create Food and Water (OUT), Daylight (BUILT), Dispel Magic (IN), Magic Circle (OUT), Remove Curse (OUT), Revivify (BUILT)
- **4th:** Banishment (IN), Death Ward (IN), Locate Creature (OUT)
- **5th:** Dispel Evil and Good (IN), Geas (OUT), Raise Dead (OUT)

### Warlock (64)

- **Cantrips:** Chill Touch (IN), Eldritch Blast (BUILT), Mage Hand (OUT), Minor Illusion (LATER), Poison Spray (IN), Prestidigitation (OUT), True Strike (IN)
- **1st:** Charm Person (LATER), Comprehend Languages (OUT), Expeditious Retreat (IN), Hellish Rebuke (IN), Illusory Script (OUT), Protection from Evil and Good (LATER), Unseen Servant (OUT)
- **2nd:** Darkness (BUILT), Enthrall (OUT), Hold Person (BUILT), Invisibility (BUILT), Mirror Image (IN), Misty Step (BUILT), Ray of Enfeeblement (IN), Shatter (BUILT), Spider Climb (OUT), Suggestion (LATER)
- **3rd:** Counterspell (LATER), Dispel Magic (IN), Fear (IN), Fly (LATER), Gaseous Form (OUT), Hypnotic Pattern (IN), Magic Circle (OUT), Major Image (LATER), Remove Curse (OUT), Tongues (OUT), Vampiric Touch (IN)
- **4th:** Banishment (IN), Blight (IN), Dimension Door (IN), Hallucinatory Terrain (OUT)
- **5th:** Contact Other Plane (OUT), Dream (OUT), Hold Monster (BUILT), Scrying (OUT)
- **6th:** Circle of Death (IN), Conjure Fey (LATER), Create Undead (LATER), Eyebite (IN), Flesh to Stone (IN), Mass Suggestion (LATER), True Seeing (BUILT)
- **7th:** Etherealness (IN), Finger of Death (IN), Forcecage (LATER), Plane Shift (OUT)
- **8th:** Demiplane (OUT), Dominate Monster (LATER), Feeblemind (IN), Glibness (OUT), Power Word Stun (IN)
- **9th:** Astral Projection (OUT), Foresight (IN), Imprisonment (OUT), Power Word Kill (IN), True Polymorph (LATER)

### Sorcerer (120)

- **Cantrips:** Acid Splash (BUILT), Chill Touch (IN), Dancing Lights (BUILT), Fire Bolt (BUILT), Light (BUILT), Mage Hand (OUT), Mending (OUT), Message (OUT), Minor Illusion (LATER), Poison Spray (IN), Prestidigitation (OUT), Ray of Frost (IN), Shocking Grasp (IN), True Strike (IN)
- **1st:** Burning Hands (BUILT), Charm Person (LATER), Color Spray (IN), Comprehend Languages (OUT), Detect Magic (BUILT), Disguise Self (OUT), Expeditious Retreat (IN), False Life (IN), Feather Fall (OUT), Fog Cloud (BUILT), Jump (OUT), Mage Armor (BUILT), Magic Missile (BUILT), Shield (BUILT), Silent Image (LATER), Sleep (BUILT), Thunderwave (BUILT)
- **2nd:** Alter Self (OUT), Blindness/Deafness (IN), Blur (IN), Darkness (BUILT), Darkvision (BUILT), Detect Thoughts (OUT), Enhance Ability (IN), Enlarge/Reduce (IN), Gust of Wind (IN), Hold Person (BUILT), Invisibility (BUILT), Knock (OUT), Levitate (LATER), Mirror Image (IN), Misty Step (BUILT), Scorching Ray (BUILT), See Invisibility (BUILT), Shatter (BUILT), Spider Climb (OUT), Suggestion (LATER), Web (BUILT)
- **3rd:** Blink (IN), Clairvoyance (OUT), Counterspell (LATER), Daylight (BUILT), Dispel Magic (IN), Fear (IN), Fireball (BUILT), Fly (LATER), Gaseous Form (OUT), Haste (IN), Hypnotic Pattern (IN), Lightning Bolt (BUILT), Major Image (LATER), Protection From Energy (IN), Sleet Storm (BUILT), Slow (IN), Stinking Cloud (BUILT), Tongues (OUT), Water Breathing (OUT), Water Walk (OUT)
- **4th:** Banishment (IN), Blight (IN), Confusion (IN), Dimension Door (IN), Dominate Beast (LATER), Greater Invisibility (BUILT), Ice Storm (BUILT), Polymorph (LATER), Stoneskin (BUILT), Wall of Fire (LATER)
- **5th:** Animate Objects (LATER), Cloudkill (LATER), Cone of Cold (BUILT), Creation (OUT), Dominate Person (LATER), Hold Monster (BUILT), Insect Plague (IN), Seeming (OUT), Telekinesis (LATER), Teleportation Circle (OUT), Wall of Stone (LATER)
- **6th:** Chain Lightning (IN), Circle of Death (IN), Disintegrate (IN), Eyebite (IN), Globe of Invulnerability (IN), Mass Suggestion (LATER), Move Earth (OUT), Sunbeam (IN), True Seeing (BUILT)
- **7th:** Delayed Blast Fireball (IN), Etherealness (IN), Finger of Death (IN), Fire Storm (IN), Plane Shift (OUT), Prismatic Spray (IN), Reverse Gravity (LATER), Teleport (OUT)
- **8th:** Dominate Monster (LATER), Earthquake (IN), Incendiary Cloud (LATER), Power Word Stun (IN), Sunburst (IN)
- **9th:** Gate (LATER), Meteor Swarm (IN), Power Word Kill (IN), Time Stop (LATER), Wish (LATER)

### Bard (111)

- **Cantrips:** Dancing Lights (BUILT), Light (BUILT), Mage Hand (OUT), Mending (OUT), Message (OUT), Minor Illusion (LATER), Prestidigitation (OUT), True Strike (IN), Vicious Mockery (IN)
- **1st:** Animal Friendship (LATER), Bane (IN), Charm Person (LATER), Comprehend Languages (OUT), Cure Wounds (BUILT), Detect Magic (BUILT), Disguise Self (OUT), Feather Fall (OUT), Healing Word (IN), Heroism (BUILT), Hideous Laughter (IN), Identify (OUT), Illusory Script (OUT), Longstrider (IN), Silent Image (LATER), Sleep (BUILT), Speak with Animals (OUT), Thunderwave (BUILT), Unseen Servant (OUT)
- **2nd:** Animal Messenger (OUT), Blindness/Deafness (IN), Calm Emotions (LATER), Detect Thoughts (OUT), Enhance Ability (IN), Enthrall (OUT), Heat Metal (IN), Hold Person (BUILT), Invisibility (BUILT), Knock (OUT), Lesser Restoration (BUILT), Locate Animals or Plants (OUT), Locate Object (OUT), Magic Mouth (OUT), See Invisibility (BUILT), Shatter (BUILT), Silence (LATER), Suggestion (LATER), Zone of Truth (OUT)
- **3rd:** Bestow Curse (IN), Clairvoyance (OUT), Dispel Magic (IN), Fear (IN), Glyph of Warding (OUT), Hypnotic Pattern (IN), Major Image (LATER), Nondetection (OUT), Plant Growth (LATER), Sending (OUT), Speak with Dead (OUT), Speak with Plants (OUT), Stinking Cloud (BUILT), Tiny Hut (IN), Tongues (OUT)
- **4th:** Compulsion (LATER), Confusion (IN), Dimension Door (IN), Freedom of Movement (IN), Greater Invisibility (BUILT), Hallucinatory Terrain (OUT), Locate Creature (OUT), Polymorph (LATER)
- **5th:** Animate Objects (LATER), Awaken (OUT), Dominate Person (LATER), Dream (OUT), Geas (OUT), Greater Restoration (IN), Hold Monster (BUILT), Legend Lore (OUT), Mass Cure Wounds (IN), Mislead (BUILT), Modify Memory (OUT), Planar Binding (OUT), Raise Dead (OUT), Scrying (OUT), Seeming (OUT), Teleportation Circle (OUT)
- **6th:** Eyebite (IN), Find the Path (OUT), Guards and Wards (OUT), Irresistible Dance (IN), Mass Suggestion (LATER), Programmed Illusion (OUT), True Seeing (BUILT)
- **7th:** Arcane Sword (IN), Etherealness (IN), Forcecage (LATER), Magnificent Mansion (OUT), Mirage Arcane (OUT), Project Image (OUT), Regenerate (IN), Resurrection (OUT), Symbol (IN), Teleport (OUT)
- **8th:** Dominate Monster (LATER), Feeblemind (IN), Glibness (OUT), Mind Blank (IN), Power Word Stun (IN)
- **9th:** Foresight (IN), Power Word Kill (IN), True Polymorph (LATER)

### Druid (106)

- **Cantrips:** Druidcraft (OUT), Guidance (IN), Mending (OUT), Poison Spray (IN), Produce Flame (IN), Resistance (IN), Shillelagh (IN)
- **1st:** Animal Friendship (LATER), Charm Person (LATER), Create or Destroy Water (OUT), Cure Wounds (BUILT), Detect Magic (BUILT), Detect Poison and Disease (OUT), Entangle (IN), Faerie Fire (BUILT), Fog Cloud (BUILT), Goodberry (OUT), Healing Word (IN), Jump (OUT), Longstrider (IN), Purify Food and Drink (OUT), Speak with Animals (OUT), Thunderwave (BUILT)
- **2nd:** Animal Messenger (OUT), Barkskin (IN), Darkvision (BUILT), Enhance Ability (IN), Find Traps (OUT), Flame Blade (IN), Flaming Sphere (LATER), Gust of Wind (IN), Heat Metal (IN), Hold Person (BUILT), Lesser Restoration (BUILT), Locate Animals or Plants (OUT), Locate Object (OUT), Moonbeam (LATER), Pass Without Trace (BUILT), Protection from Poison (IN), Spike Growth (IN)
- **3rd:** Call Lightning (IN), Conjure Animals (BUILT), Create Food and Water (OUT), Daylight (BUILT), Dispel Magic (IN), Plant Growth (LATER), Protection From Energy (IN), Sleet Storm (BUILT), Speak with Plants (OUT), Water Breathing (OUT), Water Walk (OUT), Wind Wall (LATER)
- **4th:** Blight (IN), Confusion (IN), Conjure Minor Elementals (LATER), Conjure Woodland Beings (BUILT, waits for a fey), Control Water (OUT), Divination (OUT), Dominate Beast (LATER), Freedom of Movement (IN), Giant Insect (LATER), Hallucinatory Terrain (OUT), Ice Storm (BUILT), Locate Creature (OUT), Polymorph (LATER), Stone Shape (OUT), Stoneskin (BUILT), Wall of Fire (LATER)
- **5th:** Antilife Shell (LATER), Awaken (OUT), Commune With Nature (OUT), Conjure Elemental (LATER), Contagion (IN), Geas (OUT), Greater Restoration (IN), Insect Plague (IN), Mass Cure Wounds (IN), Planar Binding (OUT), Reincarnate (OUT), Scrying (OUT), Tree Stride (LATER), Wall of Stone (LATER)
- **6th:** Conjure Fey (LATER), Find the Path (OUT), Heal (IN), Heroes' Feast (IN), Move Earth (OUT), Sunbeam (IN), Transport via Plants (OUT), Wall of Thorns (LATER), Wind Walk (OUT)
- **7th:** Fire Storm (IN), Mirage Arcane (OUT), Plane Shift (OUT), Regenerate (IN), Reverse Gravity (LATER)
- **8th:** Animal Shapes (LATER), Antipathy/Sympathy (LATER), Control Weather (OUT), Earthquake (IN), Feeblemind (IN), Sunburst (IN)
- **9th:** Foresight (IN), Shapechange (LATER), Storm of Vengeance (IN), True Resurrection (OUT)

### Ranger (37)

- **1st:** Alarm (OUT), Animal Friendship (LATER), Cure Wounds (BUILT), Detect Magic (BUILT), Detect Poison and Disease (OUT), Fog Cloud (BUILT), Goodberry (OUT), Hunter's Mark (IN), Jump (OUT), Longstrider (IN), Speak with Animals (OUT)
- **2nd:** Animal Messenger (OUT), Barkskin (IN), Darkvision (BUILT), Find Traps (OUT), Lesser Restoration (BUILT), Locate Animals or Plants (OUT), Locate Object (OUT), Pass Without Trace (BUILT), Protection from Poison (IN), Silence (LATER), Spike Growth (IN)
- **3rd:** Conjure Animals (BUILT), Daylight (BUILT), Nondetection (OUT), Plant Growth (LATER), Protection From Energy (IN), Speak with Plants (OUT), Water Breathing (OUT), Water Walk (OUT), Wind Wall (LATER)
- **4th:** Conjure Woodland Beings (BUILT, waits for a fey), Freedom of Movement (IN), Locate Creature (OUT), Stoneskin (BUILT)
- **5th:** Commune With Nature (OUT), Tree Stride (LATER)


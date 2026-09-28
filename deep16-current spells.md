---
layer: reference. What DEEP16's spells do today, set against the tabletop (SRD 5.1, the 2014 rules). For the reading lamp.
written: 2026-09-27, the Code tab on DEEP16 (config claude-opus-5-5), read off deep16/js/magic.js, deep16/data/spells.js, deep16/js/battle.js, deep16/js/save.js and content/spells.json at 62e9bf9.
---

# DEEP16: the spells so far

Plain text is the spell as DEEP16 runs it on the grid. *Italic is where DEEP16 parts from the tabletop rule.* Each spell says who has it and from which rung of the ladder. DC is the caster's spell save DC.

## Rules every spell keeps

- **Slots.** A levelled spell spends a slot of its level or higher, and a higher slot adds what the tabletop adds: more dice, more darts or rays, more targets. Cantrips grow at level 5.
- **The action and the bonus action.** A spell takes one or the other. After a bonus-action spell, the action can only cast a cantrip; after a levelled action spell, no bonus-action spell. One bonus-action spell a turn.
- **Concentration.** One at a time: a new one ends the old. Damage asks a CON save against DC 10 or half the damage, whichever is higher, and dropping to 0 ends it. *Being held, stunned or put to sleep does not end it; on the tabletop any incapacitation does.*
- **How long.** *A one-minute spell lasts the whole fight; nothing counts down its ten rounds.* Few fights run past ten rounds, so it seldom shows.
- **Areas catch everyone.** A cone, line, sphere or cube hits whoever stands in it, friends included, as on the tabletop. (The 8-bit game's "up to three foes" is its own shorthand; DEEP16 does not use it.)
- **The fallen are only down.** *A hero at 0 HP is down, not dying: no death saves, and nobody dies.* Healing brings them back up.
- **The roost's law.** Under the roost (the rescue, rung 2) fire and thunder spells are greyed out. That is the fight's rule (the 8-bit game's, ruled 09-24), not the spells'. Bright light is the one thing left to remember (ruled 09-28, canon): Light, Daylight and now the paladin's Sacred Weapon (its glow is bright light, 20 ft) bring the roof down, in both games. A thing that is always lit (the Sunshaft Staff; an item's `light` with `when: "always"`) never gets under the roost: Ottilie stops the party at the mine's mouth and keeps it under her stool till they come up. The Flame Tongue, lit only when it burns, goes in; its IGNITE is greyed there.

## How the long spells carry

Mage Armor and Aid last 8 hours on the tabletop.

- **The 8-bit game** holds both *until the next long rest*: sleeping lifts them, and a day longer than 8 hours never ends them early. You caught this one; it spares a recast every dungeon day.
- **The ladder's camp** casts both ahead if you choose (CAST AHEAD): Mage Armor is on by default from rung 3 and costs a 1st-level slot, as on the tabletop (ruled 09-27: it was free until then); Aid, from rung 5, costs a 2nd-level slot for +5 HP on three of the four. Each has to be prepared first.
- **Prepared spells.** The camp prepares the day (PREPARE SPELLS): Aurdin INT modifier + his level from his book, Lymen CHA modifier + half his level from the paladin list, Lesser Restoration always ready for Lymen from rung 5 (his oath). In the fight only the cantrips, the prepared and the oath's are on the SPELLS list. The 8-bit game prepares the same way now (09-28): every rest that offers the save first asks for the day's spells (THE DAY'S SPELLS: prepare each caster, cast Mage Armor or Aid ahead), and a party walking in from the 8-bit game brings the day it prepared.
- Aurdin's Wizard's Robes are the 8-bit game's own (AC 11 + DEX, and not armour as far as the spell cares). Under Mage Armor he stands at 13 + DEX, and the lake's +1 robes add their +1 on top.

## Aurdin (wizard, evoker)

### Cantrips

- **Fire Bolt** (from the start). A spell attack at one creature within 120 ft: 1d10 fire, 2d10 from level 5.
- **Acid Splash** (from rung 6). One creature within 60 ft and a second standing beside it: DEX save or 1d6 acid (2d6 from level 5), nothing on a save.
- **Light** (from the start). *No use on the grid yet ("the ledger-lamp is lit").* No fight has darkness to push back.

### 1st level

- **Burning Hands** (from the start). A 15-ft cone from him: DEX save, 3d6 fire, half on a save; +1d6 a slot higher.
- **Magic Missile** (from the start). Three darts at creatures he picks within 120 ft, 1d4 + 1 force each, never missing; one more dart a slot higher.
- **Shield** (from the start). A reaction when a blow would land: +5 AC until his next turn, that blow included. *DEEP16 only offers it when the +5 would turn the blow, and never on a natural 20; on the tabletop he may raise it on any hit.*
- **Sleep** (from the start). A 20-ft sphere within 90 ft: 5d8 HP of sleep (+2d8 a slot higher), the lowest current HP first; a sleeper wakes when hurt. Drow are not taken (fey blood). *Undead are taken too; on the tabletop undead, and anything that can't be charmed, are not. The skeletons of the Old Cut would sleep.*
- **Detect Magic** (from the start). A ritual: cast from the book without preparing it, in the field. *No use on the grid.*
- **Mage Armor** (from rung 3). Touch, a creature wearing no armour: AC 13 + DEX. On the ladder he walks in already wearing it, one 1st-level slot the poorer (above). It ends if he puts on armour (the ladder lets armour change mid-fight). In a fight it has almost no one to take it: the other three wear armour.

### 2nd level

- **Misty Step** (from rung 3). A bonus action: 30 ft to a square he can see. *DEEP16 hands it to him free from level 3 (the proof of concept's spec asked for it). It is not on his 8-bit sheet; on the tabletop it would be one of his two picks.*
- **Scorching Ray** (from rung 3). Three rays, each its own spell attack within 120 ft for 2d6 fire; one more ray a slot higher.
- **Shatter** (from rung 4). A 10-ft sphere within 60 ft: CON save, 3d8 thunder, half on a save; +1d8 a slot higher. *Creatures of stone, crystal or metal don't save at disadvantage. The earth elementals and the xorns would.*
- **Web** (from rung 4). A 20-ft cube within 60 ft, concentration: DEX save or restrained. Its squares are difficult ground for all but web-walkers, and an action and a STR check against his DC tears a creature free. *Only those standing in it when it is cast save; on the tabletop a creature that walks in, or starts its turn inside, saves too. Fire doesn't burn it away.*

### 3rd level

- **Fireball** (from rung 5). A 20-ft sphere within 150 ft: DEX save, 8d6 fire, half on a save; +1d6 a slot higher. Vivian's Evasion counts from level 7.
- **Lightning Bolt** (from rung 5). A line 100 ft long and 5 ft wide from him: DEX save, 8d6 lightning, half on a save; +1d6 a slot higher.

### 4th level

- **Ice Storm** (from rung 7). A 20-ft sphere within 300 ft: DEX save, 2d8 bludgeoning and 4d6 cold, half on a save. *The whole roll lands as bludgeoning: anything shrugging off blows (a raging Talmok, a swarm) halves the cold as well, and a cold-hardy foe takes it all. The ground isn't left difficult afterward.*
- **Greater Invisibility** (from rung 7). Touch, concentration: invisible. Its attacks have advantage, attacks at it disadvantage. *The foes can't choose it as a target at all unless it stands beside them; on the tabletop they could still swing at the square they hear it in, at disadvantage.*
- **Stoneskin** (from rung 8). Touch, concentration: half damage from bludgeoning, piercing and slashing. *Magic weapons are halved too (the tabletop turns only nonmagical ones), and no 100-gp diamond is spent.*

### 5th level

- **Cone of Cold** (rung 9). A 60-ft cone: CON save, 8d8 cold, half on a save; +1d8 a slot higher.
- **Hold Monster** (rung 9). One creature within 90 ft, concentration: WIS save or paralyzed, and it tries again at the end of each of its turns. Blows at it have advantage, and a blow from beside it is critical. *Undead aren't spared (the tabletop spares them), and a higher slot doesn't add a second target.*

## Lymen (paladin, Oath of Devotion)

- **Divine Smite** (from rung 2, once he has slots). Not a spell on the tabletop, but it spends slots: after a melee hit, a slot for 2d8 radiant, +1d8 a slot higher, up to 5d8; a critical doubles the dice. *The extra 1d8 against undead and fiends isn't added.*
- **Bless** (from the start). Up to three within 30 ft, concentration: +1d4 to attack rolls and saves; one more a slot higher.
- **Cure Wounds** (from the start). Touch: 1d8 + CHA healing, +1d8 a slot higher, and it brings the fallen back up. (The 8-bit game's "not the fallen: they need a kit" is its own rule; DEEP16 keeps the tabletop's.)
- **Shield of Faith** (from the start). A bonus action, one ally within 60 ft, concentration: +2 AC.
- **Divine Favor** (from rung 3). A bonus action, concentration: his weapon hits add 1d4 radiant.
- **Heroism** (from rung 4). Touch, concentration: no fear, and temporary HP equal to his CHA modifier at the start of each of its turns. *A higher slot doesn't add a second creature.*
- **Lesser Restoration** (from rung 5). Touch. *It ends poisoned, paralyzed and blinded all at once. On the tabletop it ends one condition or one disease, and deafened is on its list.*
- **Aid** (from rung 5). Up to three within 30 ft: +5 to maximum and current HP (+10 from a 3rd-level slot), and it brings a fallen one up. *It lasts only the fight it is cast in; the 8-bit game keeps it to the long rest.*
- **Revivify** (rung 9). *No use: nobody dies in DEEP16.*
- **Daylight** (rung 9). *No use yet.* It is not sunlight, so the drow don't flinch; that part is the tabletop's own. It will matter once Darkness is read, because Daylight undoes it.

## In the book but not on the grid

- **Thunderwave** and **Hold Person** have 8-bit records but no grid entry, and nobody learns them.

## Mirror Image is already built

Willem Glass's phantasms (and the cloaker's) are the SRD's Mirror Image to the number: three false images; a blow goes to an image on a d20 of 6 or more with three left, 8 with two, 11 with one; an image has AC 10 + DEX and bursts when hit. Aurdin's Mirror Image needs only its list entry and a cast on himself. *The one piece not read: an attacker who doesn't need sight (blindsight, truesight) isn't fooled on the tabletop.*

## Docket

The tabletop gaps worth closing, small ones first:

1. Sleep and Hold Monster pass over undead.
2. Smite's extra 1d8 against undead and fiends.
3. Lesser Restoration ends one condition, chosen.
4. Ice Storm rolls its two damage types apart; the ground goes difficult.
5. Shatter: disadvantage for creatures of stone, crystal and metal.
6. Heroism and Hold Monster take another creature a slot higher.
7. Web: a save for whoever walks in or starts a turn inside; fire burns it.
8. Invisible heroes can still be swung at where they are heard, at disadvantage.
9. Being held, stunned or asleep ends concentration.
10. Stoneskin turns nonmagical blows only.
11. ~~Mage Armor on the ladder costs its slot~~ (done 09-27).

## Torchdark (09-28): the dark, and the light with a place

Added after the reference above was written (the code tab, 09-28; `deep16/js/light.js`, `magic.js seeWhy`, `rules.js edges`):
- **Dark ground.** A map marked `dark` (the 8-bit maps' `dark`, read across) is dark but for its own lamps and fires and what the party brings. Every light has a place: bright so far, dim as far again. Dim light is enough to see by (the SRD's lightly obscured). The player sees the whole grid; what no one of the four sees is greyed.
- **Sight.** A creature sees another if its blindsight reaches it; else if it is not blinded and (truesight, or no magical darkness or fog between, and the target not invisible to it, and the target in light or within its darkvision). An attack at a creature the attacker cannot see is at disadvantage, as the tabletop has it (*the -4 he first named was AD&D's number and stays as a switch, `js/rules.js R.BLIND`*). An unseen attacker has advantage, so two blind fighters roll straight. A spell that wants "a creature you can see" cannot take one unseen (Bless and Aid need no sight).
- **Torches are hands.** ITEM lights one (an action; the Thief's bonus): a free hand, none under the roost. DROP (free) leaves it burning; THROW (an action) lands it within 20 ft; DOUSE (free) stows it; TAKE UP (free) the one at your feet. Lymen (sword and shield) and Barley (the flail) have no hand for one.
- **Light** is the SRD's now: on the caster's or an ally's gear, bright 20 ft, dim 20 more; **Daylight** a 60-ft sphere at a point (on a creature it goes with them), burning a Darkness it touches. **Sacred Weapon**, the **Flame Tongue** lit and the **Sunshaft Staff** shine as their items say. What hates light is dazzled in bright light the party made, not by its own fire.
- **New:** Dancing Lights (four dim lights, a bonus action moves them), Fog Cloud, Stinking Cloud, Sleet Storm (all heavily obscured: as Darkness to sight; the cloud's CON each turn inside; the sleet's ice, DEX or prone, flames out), Continual Flame (no ruby), Darkvision (60 ft; to the 8-bit till the long rest), Invisibility (till they attack or cast), See Invisibility, Mislead (invisible and one image), Pass Without Trace (+10 Stealth), True Seeing. The darkmantle's Darkness Aura moves with it; its crush blinds; the cloaker's fold blinds; the duergar go invisible before closing.
- *Magic Missile at the darkness:* a dart may be aimed at a square the caster cannot see into; it strikes what stands there. A switch, on. In the cloaker's deep gallery the first one is the gimmick's cutscene (his livestream clip), and the cloaker comes for the caster.
- **The Mirror's eye** (RULED 09-28: the Mirror's warlocks, Amara first): before the wearer, in any light, a creature cannot hide from her and gains nothing by being invisible. Nothing in the dark.

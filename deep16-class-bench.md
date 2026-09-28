---
layer: the class bench (dev/bench_matrix.py; handoff-2026-09-28-npc-classes-to-six.md §3D). Every class NPC of deep16/js/classes.js at levels 1-6, run by the class tactics (deep16/js/tactics.js) in headless Edge: one on one against every other class, and as a band of four against the four at the same level. 10 fights a matchup.
written: 2026-09-28 20:52Z by the Code tab (config claude-opus-5-5). Rerun: python dev/bench_matrix.py n=10
reading: a duel cell is the row class's wins out of 10 against the column class (the rest the column's, or neither). A band line: how often four of the class beat the four heroes (Barley, Aurdin, Vivian, Lymen at the same level, the ladder's fixture: max hit dice, their magic weapons from 5). Estimates of the AI, not of the classes: a class the tactics play badly reads weak.
---

# The class bench

## Level 1  (81 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 9 | 4 | 10 | 8 | 9 | 9 | 10 | 7 | 2 | 8 | 7 | 75% |
| **bard** | 1 | - | 5 | 3 | 2 | 3 | 2 | 9 | 5 | 3 | 1 | 4 | 35% |
| **cleric** | 6 | 5 | - | 9 | 7 | 8 | 7 | 6 | 9 | 3 | 7 | 1 | 62% |
| **druid** | 0 | 7 | 1 | - | 0 | 4 | 2 | 1 | 2 | 0 | 2 | 0 | 17% |
| **fighter** | 2 | 8 | 3 | 10 | - | 8 | 5 | 7 | 7 | 2 | 7 | 6 | 59% |
| **monk** | 1 | 7 | 2 | 6 | 2 | - | 4 | 8 | 7 | 1 | 4 | 3 | 41% |
| **paladin** | 1 | 8 | 3 | 8 | 5 | 6 | - | 7 | 5 | 4 | 4 | 4 | 50% |
| **ranger** | 0 | 1 | 4 | 9 | 3 | 2 | 3 | - | 5 | 0 | 5 | 1 | 30% |
| **rogue** | 3 | 5 | 1 | 8 | 3 | 3 | 5 | 5 | - | 1 | 1 | 2 | 34% |
| **sorcerer** | 8 | 7 | 7 | 10 | 8 | 9 | 6 | 10 | 9 | - | 8 | 6 | 80% |
| **warlock** | 2 | 9 | 3 | 8 | 3 | 6 | 6 | 5 | 9 | 2 | - | 1 | 49% |
| **wizard** | 3 | 6 | 9 | 10 | 4 | 7 | 6 | 9 | 8 | 4 | 9 | - | 68% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 9 (4.1), bard 3 (3.2), cleric 2 (4.1), druid 0 (4.3), fighter 9 (2.8), monk 1 (3.9), paladin 8 (5.1), ranger 0 (2.6), rogue 5 (3.8), sorcerer 10 (2.5), warlock 3 (4.7), wizard 7 (3.9)

## Level 2  (81 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 10 | 5 | 10 | 5 | 10 | 7 | 9 | 10 | 3 | 9 | 8 | 78% |
| **bard** | 0 | - | 0 | 6 | 0 | 1 | 1 | 5 | 3 | 0 | 0 | 5 | 19% |
| **cleric** | 5 | 10 | - | 10 | 6 | 6 | 5 | 5 | 8 | 2 | 7 | 5 | 63% |
| **druid** | 0 | 4 | 0 | - | 1 | 0 | 0 | 5 | 5 | 1 | 4 | 3 | 21% |
| **fighter** | 5 | 10 | 4 | 9 | - | 8 | 1 | 8 | 10 | 5 | 5 | 8 | 66% |
| **monk** | 0 | 9 | 4 | 10 | 2 | - | 4 | 5 | 9 | 0 | 3 | 5 | 46% |
| **paladin** | 3 | 9 | 5 | 10 | 9 | 6 | - | 9 | 10 | 2 | 8 | 9 | 73% |
| **ranger** | 1 | 5 | 5 | 5 | 2 | 5 | 1 | - | 8 | 0 | 3 | 2 | 34% |
| **rogue** | 0 | 7 | 2 | 5 | 0 | 1 | 0 | 2 | - | 0 | 0 | 0 | 15% |
| **sorcerer** | 7 | 10 | 8 | 9 | 5 | 10 | 8 | 10 | 10 | - | 9 | 5 | 83% |
| **warlock** | 1 | 10 | 3 | 6 | 5 | 7 | 2 | 7 | 10 | 1 | - | 0 | 47% |
| **wizard** | 2 | 5 | 5 | 7 | 2 | 5 | 1 | 8 | 10 | 5 | 10 | - | 55% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 7 (4.3), bard 0 (3.9), cleric 6 (6.2), druid 1 (7.8), fighter 5 (4.5), monk 1 (3.8), paladin 3 (6.4), ranger 0 (3.2), rogue 0 (4.6), sorcerer 9 (3.7), warlock 4 (5.5), wizard 2 (6.5)

## Level 3  (72 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 8 | 4 | 9 | 10 | 8 | 10 | 10 | 8 | 7 | 7 | 76% |
| **bard** | 7 | - | 10 | 6 | 5 | 10 | 6 | 7 | 10 | 6 | 7 | 3 | 70% |
| **cleric** | 2 | 0 | - | 0 | 5 | 8 | 4 | 9 | 9 | 1 | 7 | 0 | 41% |
| **druid** | 6 | 4 | 10 | - | 0 | 3 | 8 | 5 | 10 | 5 | 5 | 4 | 55% |
| **fighter** | 1 | 5 | 5 | 10 | - | 8 | 3 | 5 | 9 | 6 | 6 | 9 | 61% |
| **monk** | 0 | 0 | 2 | 7 | 2 | - | 1 | 6 | 10 | 4 | 4 | 6 | 38% |
| **paladin** | 2 | 4 | 6 | 2 | 7 | 9 | - | 9 | 10 | 9 | 8 | 6 | 65% |
| **ranger** | 0 | 3 | 1 | 5 | 5 | 4 | 1 | - | 9 | 4 | 9 | 5 | 42% |
| **rogue** | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 1 | - | 0 | 0 | 1 | 4% |
| **sorcerer** | 2 | 4 | 9 | 5 | 4 | 6 | 1 | 6 | 10 | - | 7 | 7 | 55% |
| **warlock** | 3 | 3 | 3 | 5 | 4 | 6 | 2 | 1 | 10 | 3 | - | 6 | 42% |
| **wizard** | 3 | 7 | 10 | 6 | 1 | 4 | 4 | 5 | 9 | 3 | 4 | - | 51% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 9 (5.3), bard 9 (3.4), cleric 4 (8.1), druid 0 (6.2), fighter 0 (6.0), monk 1 (4.5), paladin 7 (6.0), ranger 0 (3.5), rogue 0 (4.1), sorcerer 9 (5.4), warlock 1 (6.4), wizard 8 (6.7)

## Level 4  (76 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 9 | 7 | 9 | 10 | 5 | 10 | 10 | 7 | 8 | 2 | 73% |
| **bard** | 7 | - | 8 | 8 | 4 | 10 | 5 | 7 | 10 | 5 | 7 | 2 | 66% |
| **cleric** | 1 | 2 | - | 1 | 2 | 2 | 4 | 7 | 10 | 4 | 7 | 1 | 37% |
| **druid** | 3 | 2 | 9 | - | 2 | 1 | 3 | 4 | 10 | 1 | 8 | 4 | 43% |
| **fighter** | 1 | 6 | 8 | 8 | - | 5 | 3 | 5 | 9 | 10 | 7 | 7 | 63% |
| **monk** | 0 | 0 | 8 | 9 | 5 | - | 1 | 7 | 10 | 7 | 8 | 10 | 59% |
| **paladin** | 5 | 5 | 6 | 7 | 7 | 9 | - | 9 | 10 | 7 | 10 | 9 | 76% |
| **ranger** | 0 | 3 | 3 | 6 | 5 | 3 | 1 | - | 9 | 5 | 10 | 4 | 45% |
| **rogue** | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | - | 0 | 0 | 0 | 2% |
| **sorcerer** | 3 | 5 | 6 | 9 | 0 | 3 | 3 | 5 | 10 | - | 7 | 5 | 51% |
| **warlock** | 2 | 3 | 3 | 2 | 3 | 2 | 0 | 0 | 10 | 3 | - | 6 | 31% |
| **wizard** | 8 | 8 | 9 | 6 | 3 | 0 | 1 | 6 | 10 | 5 | 4 | - | 55% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 6 (5.1), bard 8 (4.8), cleric 3 (7.5), druid 0 (4.4), fighter 3 (5.3), monk 0 (3.2), paladin 4 (7.3), ranger 0 (3.9), rogue 0 (4.4), sorcerer 5 (8.6), warlock 0 (6.0), wizard 9 (7.3)

## Level 5  (72 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 4 | 7 | 8 | 6 | 10 | 2 | 10 | 10 | 9 | 7 | 9 | 75% |
| **bard** | 6 | - | 6 | 9 | 1 | 10 | 0 | 4 | 10 | 8 | 4 | 7 | 59% |
| **cleric** | 3 | 4 | - | 1 | 0 | 10 | 0 | 4 | 10 | 3 | 0 | 5 | 36% |
| **druid** | 2 | 1 | 9 | - | 0 | 2 | 1 | 4 | 10 | 6 | 2 | 7 | 40% |
| **fighter** | 4 | 9 | 10 | 10 | - | 10 | 4 | 7 | 10 | 8 | 2 | 8 | 75% |
| **monk** | 0 | 0 | 0 | 8 | 0 | - | 0 | 4 | 8 | 0 | 4 | 6 | 27% |
| **paladin** | 8 | 10 | 10 | 9 | 6 | 10 | - | 7 | 10 | 6 | 4 | 10 | 82% |
| **ranger** | 0 | 6 | 6 | 6 | 3 | 6 | 3 | - | 10 | 7 | 7 | 8 | 56% |
| **rogue** | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | - | 0 | 0 | 0 | 2% |
| **sorcerer** | 1 | 2 | 7 | 4 | 2 | 10 | 4 | 3 | 10 | - | 1 | 6 | 45% |
| **warlock** | 3 | 6 | 10 | 8 | 8 | 6 | 6 | 3 | 10 | 9 | - | 7 | 69% |
| **wizard** | 1 | 3 | 5 | 3 | 2 | 4 | 0 | 2 | 10 | 4 | 3 | - | 34% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 5 (4.7), bard 1 (4.4), cleric 2 (4.4), druid 0 (2.8), fighter 0 (3.5), monk 0 (3.4), paladin 5 (4.6), ranger 0 (2.4), rogue 0 (3.0), sorcerer 8 (2.8), warlock 9 (2.7), wizard 6 (4.0)

## Level 6  (89 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 6 | 8 | 9 | 7 | 10 | 3 | 10 | 10 | 10 | 8 | 10 | 83% |
| **bard** | 4 | - | 7 | 10 | 0 | 9 | 0 | 5 | 10 | 6 | 6 | 7 | 58% |
| **cleric** | 2 | 3 | - | 1 | 0 | 10 | 1 | 3 | 10 | 3 | 2 | 4 | 35% |
| **druid** | 1 | 0 | 9 | - | 0 | 3 | 1 | 5 | 10 | 4 | 3 | 5 | 37% |
| **fighter** | 3 | 10 | 10 | 10 | - | 10 | 7 | 8 | 10 | 8 | 4 | 9 | 81% |
| **monk** | 0 | 1 | 0 | 7 | 0 | - | 0 | 4 | 9 | 0 | 5 | 3 | 26% |
| **paladin** | 7 | 10 | 9 | 9 | 3 | 10 | - | 9 | 10 | 4 | 6 | 10 | 79% |
| **ranger** | 0 | 5 | 7 | 5 | 2 | 6 | 1 | - | 10 | 7 | 8 | 9 | 55% |
| **rogue** | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | - | 0 | 0 | 0 | 1% |
| **sorcerer** | 0 | 4 | 7 | 6 | 2 | 10 | 6 | 3 | 10 | - | 5 | 8 | 55% |
| **warlock** | 2 | 4 | 8 | 7 | 6 | 5 | 4 | 2 | 10 | 5 | - | 7 | 55% |
| **wizard** | 0 | 3 | 6 | 5 | 1 | 7 | 0 | 1 | 10 | 2 | 3 | - | 35% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 2 (4.1), bard 0 (3.8), cleric 1 (6.3), druid 0 (2.8), fighter 0 (3.3), monk 0 (2.8), paladin 0 (4.4), ranger 0 (2.5), rogue 0 (3.0), sorcerer 7 (4.2), warlock 8 (3.6), wizard 5 (3.9)

## Across the levels

One on one, all levels: barbarian 77%, paladin 71%, fighter 67%, sorcerer 62%, bard 51%, wizard 49%, warlock 49%, cleric 46%, ranger 43%, monk 40%, druid 35%, rogue 10%

## Errors

None thrown.

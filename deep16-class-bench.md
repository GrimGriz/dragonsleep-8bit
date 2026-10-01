---
layer: the class bench (dev/bench_matrix.py; handoff-2026-09-28-npc-classes-to-six.md §3D). Every class NPC of deep16/js/classes.js at levels 1-9, run by the class tactics (deep16/js/tactics.js) in headless Edge: one on one against every other class, and as a band of four against the four at the same level. 10 fights a matchup.
written: 2026-10-01 10:19Z by the Code tab (config claude-opus-5-5). Rerun: python dev/bench_matrix.py n=10 levels=1-9 (10-01c: 1-6 and 7-9 run apart and joined, after the warlock learned Expeditious Retreat)
reading: a duel cell is the row class's wins out of 10 against the column class (the rest the column's, or neither). A band line: how often four of the class beat the four heroes (Barley, Aurdin, Vivian, Lymen at the same level, the ladder's fixture: max hit dice, their magic weapons from 5). Estimates of the AI, not of the classes: a class the tactics play badly reads weak.
---

# The class bench

## Level 1  (74 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 9 | 4 | 10 | 8 | 9 | 9 | 7 | 7 | 2 | 8 | 7 | 73% |
| **bard** | 1 | - | 5 | 3 | 2 | 3 | 2 | 1 | 5 | 3 | 1 | 4 | 27% |
| **cleric** | 6 | 5 | - | 9 | 7 | 8 | 7 | 6 | 9 | 3 | 7 | 1 | 62% |
| **druid** | 0 | 7 | 1 | - | 0 | 4 | 2 | 3 | 2 | 0 | 2 | 0 | 19% |
| **fighter** | 2 | 8 | 3 | 10 | - | 8 | 5 | 5 | 7 | 2 | 7 | 6 | 57% |
| **monk** | 1 | 7 | 2 | 6 | 2 | - | 4 | 6 | 7 | 1 | 4 | 3 | 39% |
| **paladin** | 1 | 8 | 3 | 8 | 5 | 6 | - | 8 | 5 | 4 | 4 | 4 | 51% |
| **ranger** | 3 | 9 | 4 | 7 | 5 | 4 | 2 | - | 9 | 1 | 6 | 4 | 49% |
| **rogue** | 3 | 5 | 1 | 8 | 3 | 3 | 5 | 1 | - | 1 | 1 | 2 | 30% |
| **sorcerer** | 8 | 7 | 7 | 10 | 8 | 9 | 6 | 9 | 9 | - | 8 | 6 | 79% |
| **warlock** | 2 | 9 | 3 | 8 | 3 | 6 | 6 | 4 | 9 | 2 | - | 1 | 48% |
| **wizard** | 3 | 6 | 9 | 10 | 4 | 7 | 6 | 6 | 8 | 4 | 9 | - | 65% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 9 (4.1), bard 3 (3.2), cleric 2 (4.1), druid 0 (4.3), fighter 9 (2.8), monk 1 (3.9), paladin 8 (5.1), ranger 3 (4.8), rogue 5 (3.8), sorcerer 10 (2.5), warlock 0 (3.9), wizard 7 (3.9)

## Level 2  (79 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 9 | 5 | 10 | 5 | 10 | 7 | 7 | 10 | 3 | 9 | 8 | 75% |
| **bard** | 1 | - | 0 | 6 | 0 | 1 | 1 | 0 | 3 | 0 | 2 | 4 | 16% |
| **cleric** | 5 | 10 | - | 10 | 6 | 8 | 5 | 2 | 8 | 2 | 7 | 5 | 62% |
| **druid** | 0 | 4 | 0 | - | 1 | 1 | 0 | 3 | 5 | 1 | 4 | 6 | 23% |
| **fighter** | 5 | 10 | 4 | 9 | - | 8 | 1 | 9 | 10 | 5 | 5 | 8 | 67% |
| **monk** | 0 | 9 | 2 | 9 | 2 | - | 4 | 5 | 9 | 1 | 4 | 3 | 44% |
| **paladin** | 3 | 9 | 5 | 10 | 9 | 6 | - | 9 | 10 | 2 | 8 | 9 | 73% |
| **ranger** | 3 | 10 | 8 | 7 | 1 | 5 | 1 | - | 9 | 1 | 5 | 7 | 52% |
| **rogue** | 0 | 7 | 2 | 5 | 0 | 1 | 0 | 1 | - | 0 | 0 | 0 | 15% |
| **sorcerer** | 7 | 10 | 8 | 9 | 5 | 9 | 8 | 9 | 10 | - | 9 | 5 | 81% |
| **warlock** | 1 | 8 | 3 | 6 | 5 | 6 | 2 | 5 | 10 | 1 | - | 0 | 43% |
| **wizard** | 2 | 6 | 5 | 4 | 2 | 7 | 1 | 3 | 10 | 5 | 10 | - | 50% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 7 (4.5), bard 0 (4.3), cleric 3 (6.9), druid 0 (6.1), fighter 6 (3.9), monk 1 (3.7), paladin 4 (6.0), ranger 1 (5.8), rogue 1 (4.8), sorcerer 9 (3.5), warlock 2 (5.3), wizard 1 (6.4)

## Level 3  (78 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 5 | 5 | 9 | 10 | 8 | 6 | 10 | 8 | 7 | 7 | 71% |
| **bard** | 7 | - | 9 | 7 | 9 | 10 | 8 | 8 | 10 | 6 | 7 | 3 | 76% |
| **cleric** | 5 | 1 | - | 1 | 5 | 8 | 7 | 4 | 9 | 1 | 7 | 0 | 44% |
| **druid** | 5 | 3 | 9 | - | 2 | 10 | 5 | 4 | 10 | 5 | 6 | 8 | 61% |
| **fighter** | 1 | 1 | 5 | 8 | - | 8 | 3 | 6 | 9 | 6 | 6 | 9 | 56% |
| **monk** | 0 | 0 | 2 | 0 | 2 | - | 1 | 8 | 10 | 2 | 3 | 5 | 30% |
| **paladin** | 2 | 2 | 3 | 5 | 7 | 9 | - | 7 | 10 | 9 | 8 | 6 | 62% |
| **ranger** | 4 | 2 | 6 | 6 | 4 | 2 | 3 | - | 10 | 3 | 7 | 5 | 47% |
| **rogue** | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | - | 0 | 0 | 1 | 3% |
| **sorcerer** | 2 | 4 | 9 | 5 | 4 | 8 | 1 | 7 | 10 | - | 7 | 7 | 58% |
| **warlock** | 3 | 3 | 3 | 4 | 4 | 7 | 2 | 3 | 10 | 3 | - | 6 | 44% |
| **wizard** | 3 | 7 | 10 | 2 | 1 | 5 | 4 | 5 | 9 | 3 | 4 | - | 48% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 8 (5.6), bard 8 (3.4), cleric 3 (7.4), druid 10 (3.6), fighter 3 (6.3), monk 0 (4.1), paladin 6 (7.0), ranger 3 (6.4), rogue 0 (3.8), sorcerer 8 (6.6), warlock 0 (4.9), wizard 5 (7.6)

## Level 4  (83 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 7 | 7 | 9 | 10 | 5 | 7 | 10 | 7 | 7 | 2 | 67% |
| **bard** | 7 | - | 9 | 8 | 8 | 10 | 8 | 5 | 10 | 5 | 7 | 2 | 72% |
| **cleric** | 3 | 1 | - | 2 | 3 | 4 | 4 | 5 | 10 | 4 | 7 | 1 | 40% |
| **druid** | 3 | 2 | 8 | - | 2 | 3 | 3 | 2 | 8 | 3 | 7 | 6 | 43% |
| **fighter** | 1 | 2 | 7 | 8 | - | 5 | 3 | 8 | 9 | 10 | 7 | 7 | 61% |
| **monk** | 0 | 0 | 6 | 7 | 5 | - | 0 | 8 | 10 | 4 | 8 | 8 | 51% |
| **paladin** | 5 | 2 | 6 | 7 | 7 | 10 | - | 8 | 10 | 7 | 10 | 9 | 74% |
| **ranger** | 3 | 5 | 5 | 8 | 2 | 2 | 2 | - | 10 | 3 | 9 | 6 | 50% |
| **rogue** | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | - | 0 | 0 | 0 | 3% |
| **sorcerer** | 3 | 5 | 6 | 7 | 0 | 6 | 3 | 7 | 10 | - | 7 | 5 | 54% |
| **warlock** | 3 | 3 | 3 | 3 | 3 | 2 | 0 | 1 | 10 | 3 | - | 6 | 34% |
| **wizard** | 8 | 8 | 9 | 4 | 3 | 2 | 1 | 4 | 10 | 5 | 4 | - | 53% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 5 (4.8), bard 7 (4.3), cleric 2 (7.6), druid 2 (5.3), fighter 4 (4.9), monk 0 (3.4), paladin 2 (8.5), ranger 2 (6.6), rogue 0 (3.4), sorcerer 4 (9.7), warlock 0 (4.2), wizard 8 (7.0)

## Level 5  (79 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 4 | 7 | 1 | 6 | 10 | 2 | 3 | 10 | 9 | 7 | 9 | 62% |
| **bard** | 6 | - | 5 | 5 | 3 | 6 | 7 | 2 | 10 | 8 | 4 | 7 | 57% |
| **cleric** | 3 | 5 | - | 0 | 1 | 8 | 1 | 2 | 10 | 3 | 0 | 5 | 35% |
| **druid** | 9 | 5 | 10 | - | 9 | 7 | 10 | 2 | 10 | 8 | 7 | 9 | 78% |
| **fighter** | 4 | 7 | 9 | 1 | - | 8 | 4 | 6 | 10 | 8 | 2 | 8 | 61% |
| **monk** | 0 | 4 | 2 | 3 | 2 | - | 4 | 7 | 10 | 1 | 6 | 8 | 43% |
| **paladin** | 8 | 3 | 9 | 0 | 6 | 6 | - | 3 | 10 | 6 | 4 | 10 | 59% |
| **ranger** | 7 | 8 | 8 | 8 | 4 | 3 | 7 | - | 10 | 8 | 7 | 7 | 70% |
| **rogue** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 | 0% |
| **sorcerer** | 1 | 2 | 7 | 2 | 2 | 9 | 4 | 2 | 10 | - | 1 | 6 | 42% |
| **warlock** | 3 | 6 | 10 | 3 | 8 | 4 | 6 | 3 | 10 | 9 | - | 8 | 64% |
| **wizard** | 1 | 3 | 5 | 1 | 2 | 2 | 0 | 3 | 10 | 4 | 2 | - | 30% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 4 (4.5), bard 3 (3.9), cleric 2 (5.3), druid 0 (3.0), fighter 0 (3.9), monk 0 (4.4), paladin 2 (4.2), ranger 0 (5.4), rogue 0 (2.9), sorcerer 7 (2.7), warlock 5 (3.6), wizard 5 (3.7)

## Level 6  (81 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 6 | 8 | 2 | 7 | 10 | 3 | 4 | 10 | 10 | 8 | 10 | 71% |
| **bard** | 4 | - | 4 | 3 | 4 | 7 | 4 | 2 | 10 | 6 | 6 | 7 | 52% |
| **cleric** | 2 | 6 | - | 0 | 1 | 5 | 3 | 1 | 10 | 3 | 2 | 4 | 34% |
| **druid** | 8 | 7 | 10 | - | 9 | 9 | 9 | 5 | 10 | 8 | 5 | 9 | 81% |
| **fighter** | 3 | 6 | 9 | 1 | - | 9 | 7 | 6 | 10 | 8 | 4 | 9 | 65% |
| **monk** | 0 | 3 | 5 | 1 | 1 | - | 2 | 8 | 10 | 0 | 5 | 8 | 39% |
| **paladin** | 7 | 6 | 7 | 1 | 3 | 8 | - | 7 | 10 | 4 | 6 | 10 | 63% |
| **ranger** | 6 | 8 | 9 | 5 | 4 | 2 | 3 | - | 10 | 8 | 9 | 9 | 66% |
| **rogue** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 | 0% |
| **sorcerer** | 0 | 4 | 7 | 2 | 2 | 10 | 6 | 2 | 10 | - | 5 | 8 | 51% |
| **warlock** | 2 | 4 | 8 | 5 | 6 | 5 | 4 | 1 | 10 | 5 | - | 6 | 51% |
| **wizard** | 0 | 3 | 6 | 1 | 1 | 2 | 0 | 1 | 10 | 2 | 4 | - | 27% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 5 (4.3), bard 1 (4.1), cleric 0 (3.7), druid 0 (3.0), fighter 0 (3.4), monk 0 (3.5), paladin 0 (4.1), ranger 0 (4.7), rogue 0 (3.2), sorcerer 9 (3.6), warlock 1 (3.7), wizard 6 (3.6)

## Across the levels

One on one, all levels: barbarian 70%, paladin 63%, fighter 61%, sorcerer 61%, ranger 56%, druid 51%, bard 50%, warlock 47%, cleric 46%, wizard 46%, monk 41%, rogue 8%

## Errors

None thrown.

## Level 7  (91 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 5 | 8 | 0 | 6 | 10 | 3 | 6 | 10 | 10 | 7 | 10 | 68% |
| **bard** | 5 | - | 4 | 0 | 2 | 5 | 4 | 1 | 10 | 6 | 2 | 6 | 41% |
| **cleric** | 2 | 6 | - | 0 | 0 | 6 | 1 | 0 | 9 | 3 | 0 | 7 | 31% |
| **druid** | 10 | 10 | 10 | - | 10 | 10 | 10 | 5 | 10 | 8 | 8 | 10 | 92% |
| **fighter** | 4 | 8 | 10 | 0 | - | 9 | 3 | 7 | 10 | 8 | 6 | 9 | 67% |
| **monk** | 0 | 5 | 4 | 0 | 1 | - | 3 | 9 | 9 | 3 | 10 | 10 | 49% |
| **paladin** | 7 | 6 | 9 | 0 | 7 | 7 | - | 7 | 10 | 8 | 9 | 8 | 71% |
| **ranger** | 4 | 9 | 10 | 5 | 3 | 1 | 3 | - | 10 | 8 | 10 | 9 | 65% |
| **rogue** | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | - | 0 | 2 | 0 | 4% |
| **sorcerer** | 0 | 4 | 7 | 2 | 2 | 7 | 2 | 2 | 10 | - | 2 | 9 | 43% |
| **warlock** | 3 | 8 | 10 | 2 | 4 | 0 | 1 | 0 | 8 | 8 | - | 5 | 45% |
| **wizard** | 0 | 4 | 3 | 0 | 1 | 0 | 2 | 1 | 10 | 1 | 5 | - | 25% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 5 (4.7), bard 0 (3.7), cleric 2 (5.4), druid 2 (5.6), fighter 3 (5.1), monk 0 (4.5), paladin 3 (6.1), ranger 1 (5.9), rogue 0 (4.7), sorcerer 7 (5.1), warlock 3 (5.4), wizard 1 (4.9)

## Level 8  (92 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 7 | 0 | 6 | 10 | 4 | 7 | 10 | 10 | 5 | 9 | 65% |
| **bard** | 7 | - | 4 | 0 | 3 | 5 | 4 | 2 | 10 | 6 | 2 | 5 | 44% |
| **cleric** | 3 | 6 | - | 1 | 2 | 2 | 1 | 1 | 10 | 6 | 1 | 9 | 38% |
| **druid** | 10 | 10 | 9 | - | 10 | 7 | 10 | 1 | 10 | 5 | 6 | 10 | 80% |
| **fighter** | 4 | 7 | 8 | 0 | - | 4 | 1 | 8 | 10 | 9 | 9 | 9 | 63% |
| **monk** | 0 | 5 | 8 | 3 | 6 | - | 2 | 10 | 10 | 5 | 10 | 10 | 63% |
| **paladin** | 6 | 6 | 9 | 0 | 9 | 8 | - | 9 | 10 | 8 | 9 | 9 | 75% |
| **ranger** | 3 | 8 | 9 | 9 | 2 | 0 | 1 | - | 10 | 8 | 9 | 10 | 63% |
| **rogue** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 4 | 1 | 5% |
| **sorcerer** | 0 | 4 | 4 | 5 | 1 | 5 | 2 | 2 | 10 | - | 5 | 9 | 43% |
| **warlock** | 5 | 8 | 9 | 4 | 1 | 0 | 1 | 1 | 6 | 5 | - | 5 | 41% |
| **wizard** | 1 | 5 | 1 | 0 | 1 | 0 | 1 | 0 | 9 | 1 | 5 | - | 22% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 2 (5.2), bard 0 (3.7), cleric 2 (6.0), druid 0 (3.1), fighter 1 (4.9), monk 1 (6.0), paladin 2 (5.9), ranger 2 (6.8), rogue 0 (5.3), sorcerer 8 (5.1), warlock 1 (4.5), wizard 1 (5.3)

## Level 9  (96 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 6 | 9 | 0 | 10 | 10 | 5 | 10 | 10 | 9 | 7 | 10 | 78% |
| **bard** | 4 | - | 0 | 0 | 2 | 2 | 2 | 2 | 10 | 4 | 3 | 2 | 28% |
| **cleric** | 1 | 10 | - | 0 | 3 | 2 | 0 | 2 | 10 | 6 | 3 | 10 | 43% |
| **druid** | 10 | 10 | 10 | - | 10 | 10 | 10 | 5 | 10 | 9 | 10 | 10 | 95% |
| **fighter** | 0 | 8 | 7 | 0 | - | 7 | 4 | 10 | 10 | 8 | 9 | 10 | 66% |
| **monk** | 0 | 8 | 8 | 0 | 3 | - | 2 | 9 | 10 | 6 | 7 | 10 | 57% |
| **paladin** | 5 | 8 | 10 | 0 | 6 | 8 | - | 10 | 10 | 6 | 5 | 10 | 71% |
| **ranger** | 0 | 8 | 8 | 5 | 0 | 1 | 0 | - | 10 | 7 | 6 | 9 | 49% |
| **rogue** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 1 | 2 | 3% |
| **sorcerer** | 1 | 6 | 4 | 1 | 2 | 4 | 4 | 3 | 10 | - | 5 | 10 | 45% |
| **warlock** | 3 | 7 | 7 | 0 | 1 | 3 | 5 | 4 | 9 | 5 | - | 10 | 49% |
| **wizard** | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 1 | 8 | 0 | 0 | - | 15% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 6 (5.6), bard 0 (3.2), cleric 2 (6.7), druid 3 (4.0), fighter 0 (5.3), monk 0 (5.4), paladin 0 (5.7), ranger 0 (6.1), rogue 0 (4.2), sorcerer 9 (4.6), warlock 0 (4.1), wizard 0 (3.8)

## Across the levels

One on one, all levels: druid 89%, paladin 72%, barbarian 70%, fighter 65%, ranger 59%, monk 56%, warlock 45%, sorcerer 44%, bard 38%, cleric 37%, wizard 21%, rogue 4%

## Errors

None thrown.

---
layer: the class bench (dev/bench_matrix.py; handoff-2026-09-28-npc-classes-to-six.md §3D). Every class NPC of deep16/js/classes.js at levels 1-9, run by the class tactics (deep16/js/tactics.js) in headless Edge: one on one against every other class, and as a band of four against the four at the same level. 10 fights a matchup.
written: 2026-10-04 19:24Z by the Code tab (config claude-opus-5-5). Rerun: python dev/bench_matrix.py n=10
reading: a duel cell is the row class's wins out of 10 against the column class (the rest the column's, or neither). A band line: how often four of the class beat the four heroes (Barley, Aurdin, Vivian, Lymen at the same level, the ladder's fixture: max hit dice, their magic weapons from 5). Estimates of the AI, not of the classes: a class the tactics play badly reads weak.
---

# The class bench

## Level 1  (79 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 9 | 4 | 8 | 8 | 9 | 9 | 7 | 6 | 2 | 8 | 7 | 70% |
| **bard** | 1 | - | 5 | 6 | 2 | 3 | 2 | 1 | 2 | 3 | 1 | 4 | 27% |
| **cleric** | 6 | 5 | - | 10 | 7 | 8 | 7 | 6 | 6 | 3 | 7 | 1 | 60% |
| **druid** | 2 | 4 | 0 | - | 0 | 2 | 3 | 4 | 3 | 0 | 2 | 2 | 20% |
| **fighter** | 2 | 8 | 3 | 10 | - | 8 | 5 | 5 | 7 | 2 | 7 | 6 | 57% |
| **monk** | 1 | 7 | 2 | 8 | 2 | - | 4 | 6 | 6 | 1 | 4 | 3 | 40% |
| **paladin** | 1 | 8 | 3 | 7 | 5 | 6 | - | 8 | 7 | 4 | 4 | 4 | 52% |
| **ranger** | 3 | 9 | 4 | 6 | 5 | 4 | 2 | - | 5 | 1 | 6 | 4 | 45% |
| **rogue** | 4 | 8 | 4 | 7 | 3 | 4 | 3 | 5 | - | 2 | 6 | 7 | 48% |
| **sorcerer** | 8 | 7 | 7 | 10 | 8 | 9 | 6 | 9 | 8 | - | 8 | 10 | 82% |
| **warlock** | 2 | 9 | 3 | 8 | 3 | 6 | 6 | 4 | 4 | 2 | - | 1 | 44% |
| **wizard** | 3 | 6 | 9 | 8 | 4 | 7 | 6 | 6 | 3 | 0 | 9 | - | 55% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 10 (4.2), bard 3 (3.5), cleric 8 (4.3), druid 7 (5.2), fighter 7 (3.8), monk 4 (3.8), paladin 7 (4.8), ranger 2 (5.5), rogue 3 (6.4), sorcerer 9 (2.6), warlock 2 (6.3), wizard 8 (5.4)

## Level 2  (87 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 9 | 5 | 10 | 5 | 10 | 7 | 7 | 7 | 3 | 9 | 8 | 73% |
| **bard** | 1 | - | 0 | 2 | 0 | 1 | 1 | 0 | 1 | 0 | 2 | 4 | 11% |
| **cleric** | 5 | 10 | - | 10 | 6 | 8 | 5 | 2 | 8 | 2 | 7 | 5 | 62% |
| **druid** | 0 | 8 | 0 | - | 1 | 3 | 0 | 4 | 5 | 2 | 2 | 8 | 30% |
| **fighter** | 5 | 10 | 4 | 9 | - | 8 | 1 | 9 | 6 | 5 | 5 | 8 | 64% |
| **monk** | 0 | 9 | 2 | 7 | 2 | - | 4 | 5 | 5 | 1 | 4 | 3 | 38% |
| **paladin** | 3 | 9 | 5 | 10 | 9 | 6 | - | 9 | 6 | 2 | 8 | 10 | 70% |
| **ranger** | 3 | 10 | 8 | 6 | 1 | 5 | 1 | - | 5 | 1 | 5 | 7 | 47% |
| **rogue** | 3 | 9 | 2 | 5 | 4 | 5 | 4 | 5 | - | 2 | 4 | 7 | 45% |
| **sorcerer** | 7 | 10 | 8 | 8 | 5 | 9 | 8 | 9 | 8 | - | 9 | 8 | 81% |
| **warlock** | 1 | 8 | 3 | 8 | 5 | 6 | 2 | 5 | 6 | 1 | - | 0 | 41% |
| **wizard** | 2 | 6 | 5 | 2 | 2 | 7 | 0 | 3 | 3 | 2 | 10 | - | 38% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 10 (5.2), bard 0 (4.2), cleric 3 (7.4), druid 3 (7.4), fighter 7 (4.3), monk 2 (5.0), paladin 7 (6.4), ranger 4 (6.2), rogue 2 (10.0), sorcerer 9 (3.7), warlock 0 (5.8), wizard 1 (7.9)

## Level 3  (89 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 5 | 4 | 9 | 10 | 8 | 6 | 8 | 8 | 7 | 7 | 68% |
| **bard** | 7 | - | 9 | 1 | 9 | 10 | 9 | 8 | 8 | 6 | 7 | 3 | 70% |
| **cleric** | 5 | 1 | - | 1 | 5 | 8 | 7 | 4 | 3 | 1 | 7 | 0 | 38% |
| **druid** | 6 | 9 | 9 | - | 3 | 10 | 4 | 3 | 5 | 4 | 6 | 8 | 61% |
| **fighter** | 1 | 1 | 5 | 7 | - | 8 | 5 | 6 | 6 | 6 | 6 | 9 | 55% |
| **monk** | 0 | 0 | 2 | 0 | 2 | - | 0 | 8 | 10 | 2 | 3 | 5 | 29% |
| **paladin** | 2 | 1 | 3 | 6 | 5 | 10 | - | 7 | 8 | 7 | 8 | 6 | 57% |
| **ranger** | 4 | 2 | 6 | 7 | 4 | 2 | 3 | - | 1 | 3 | 7 | 5 | 40% |
| **rogue** | 2 | 2 | 7 | 5 | 4 | 0 | 2 | 9 | - | 1 | 3 | 4 | 35% |
| **sorcerer** | 2 | 4 | 9 | 6 | 4 | 8 | 3 | 7 | 9 | - | 7 | 9 | 62% |
| **warlock** | 3 | 3 | 3 | 4 | 4 | 7 | 2 | 3 | 7 | 3 | - | 6 | 41% |
| **wizard** | 3 | 7 | 10 | 2 | 1 | 5 | 4 | 5 | 6 | 1 | 4 | - | 44% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 10 (5.1), bard 8 (3.3), cleric 6 (8.1), druid 10 (3.6), fighter 2 (6.8), monk 1 (5.1), paladin 7 (7.4), ranger 0 (7.5), rogue 1 (10.4), sorcerer 9 (7.4), warlock 0 (4.8), wizard 4 (8.2)

## Level 4  (93 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 7 | 8 | 9 | 10 | 5 | 7 | 8 | 7 | 7 | 2 | 66% |
| **bard** | 7 | - | 9 | 3 | 8 | 10 | 7 | 5 | 6 | 5 | 7 | 2 | 63% |
| **cleric** | 3 | 1 | - | 3 | 3 | 4 | 5 | 5 | 6 | 4 | 7 | 1 | 38% |
| **druid** | 2 | 7 | 7 | - | 2 | 3 | 4 | 2 | 0 | 3 | 7 | 6 | 39% |
| **fighter** | 1 | 2 | 7 | 8 | - | 5 | 6 | 8 | 6 | 10 | 7 | 7 | 61% |
| **monk** | 0 | 0 | 6 | 7 | 5 | - | 1 | 8 | 10 | 4 | 8 | 8 | 52% |
| **paladin** | 5 | 3 | 5 | 6 | 4 | 9 | - | 8 | 5 | 7 | 10 | 9 | 65% |
| **ranger** | 3 | 5 | 5 | 8 | 2 | 2 | 2 | - | 2 | 3 | 9 | 6 | 43% |
| **rogue** | 2 | 4 | 4 | 10 | 4 | 0 | 5 | 8 | - | 4 | 7 | 7 | 50% |
| **sorcerer** | 3 | 5 | 6 | 7 | 0 | 6 | 3 | 7 | 6 | - | 7 | 6 | 51% |
| **warlock** | 3 | 3 | 3 | 3 | 3 | 2 | 0 | 1 | 3 | 3 | - | 6 | 27% |
| **wizard** | 8 | 8 | 9 | 4 | 3 | 2 | 1 | 4 | 3 | 4 | 4 | - | 45% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 7 (5.9), bard 8 (4.8), cleric 4 (7.8), druid 5 (5.0), fighter 1 (5.3), monk 1 (4.0), paladin 1 (7.4), ranger 0 (6.6), rogue 4 (11.1), sorcerer 3 (8.7), warlock 0 (5.7), wizard 6 (7.6)

## Level 5  (91 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 4 | 7 | 2 | 6 | 10 | 3 | 3 | 3 | 9 | 7 | 9 | 57% |
| **bard** | 6 | - | 5 | 0 | 3 | 6 | 7 | 2 | 4 | 8 | 4 | 7 | 47% |
| **cleric** | 3 | 5 | - | 0 | 1 | 8 | 1 | 2 | 1 | 3 | 0 | 5 | 26% |
| **druid** | 8 | 10 | 10 | - | 9 | 7 | 9 | 2 | 9 | 8 | 7 | 9 | 80% |
| **fighter** | 4 | 7 | 9 | 1 | - | 8 | 4 | 6 | 5 | 8 | 2 | 8 | 56% |
| **monk** | 0 | 4 | 2 | 3 | 2 | - | 4 | 7 | 9 | 1 | 6 | 8 | 42% |
| **paladin** | 7 | 3 | 9 | 1 | 6 | 6 | - | 3 | 2 | 6 | 4 | 10 | 52% |
| **ranger** | 7 | 8 | 8 | 8 | 4 | 3 | 7 | - | 5 | 8 | 7 | 7 | 65% |
| **rogue** | 7 | 6 | 9 | 1 | 5 | 1 | 8 | 5 | - | 7 | 3 | 9 | 55% |
| **sorcerer** | 1 | 2 | 7 | 2 | 2 | 9 | 4 | 2 | 3 | - | 1 | 6 | 35% |
| **warlock** | 3 | 6 | 10 | 3 | 8 | 4 | 6 | 3 | 7 | 9 | - | 8 | 61% |
| **wizard** | 1 | 3 | 5 | 1 | 2 | 2 | 0 | 3 | 1 | 4 | 2 | - | 22% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 4 (4.0), bard 1 (5.0), cleric 3 (4.9), druid 0 (3.2), fighter 1 (3.2), monk 2 (4.9), paladin 1 (4.5), ranger 3 (4.8), rogue 0 (7.4), sorcerer 8 (2.1), warlock 6 (3.6), wizard 9 (3.4)

## Level 6  (89 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 6 | 8 | 2 | 7 | 10 | 3 | 4 | 5 | 10 | 8 | 10 | 66% |
| **bard** | 4 | - | 4 | 0 | 4 | 7 | 5 | 2 | 4 | 0 | 6 | 7 | 39% |
| **cleric** | 2 | 6 | - | 0 | 1 | 5 | 3 | 1 | 1 | 3 | 2 | 4 | 25% |
| **druid** | 8 | 10 | 10 | - | 9 | 9 | 10 | 5 | 10 | 2 | 5 | 10 | 80% |
| **fighter** | 3 | 6 | 9 | 1 | - | 9 | 8 | 6 | 5 | 8 | 4 | 9 | 62% |
| **monk** | 0 | 3 | 5 | 1 | 1 | - | 2 | 8 | 10 | 0 | 5 | 8 | 39% |
| **paladin** | 7 | 5 | 7 | 0 | 2 | 8 | - | 7 | 2 | 4 | 6 | 10 | 53% |
| **ranger** | 6 | 8 | 9 | 5 | 4 | 2 | 3 | - | 4 | 8 | 9 | 9 | 61% |
| **rogue** | 5 | 6 | 9 | 0 | 5 | 0 | 8 | 6 | - | 7 | 5 | 9 | 55% |
| **sorcerer** | 0 | 10 | 7 | 8 | 2 | 10 | 6 | 2 | 3 | - | 10 | 9 | 61% |
| **warlock** | 2 | 4 | 8 | 5 | 6 | 5 | 4 | 1 | 5 | 0 | - | 6 | 42% |
| **wizard** | 0 | 3 | 6 | 0 | 1 | 2 | 0 | 1 | 1 | 1 | 4 | - | 17% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 4 (4.3), bard 1 (4.8), cleric 1 (4.1), druid 0 (3.2), fighter 1 (3.4), monk 1 (4.1), paladin 0 (3.8), ranger 1 (5.6), rogue 0 (7.8), sorcerer 10 (2.7), warlock 2 (3.9), wizard 7 (3.3)

## Level 7  (99 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 5 | 8 | 0 | 6 | 10 | 3 | 6 | 7 | 10 | 7 | 10 | 65% |
| **bard** | 5 | - | 4 | 0 | 2 | 5 | 4 | 1 | 2 | 6 | 2 | 6 | 34% |
| **cleric** | 2 | 6 | - | 0 | 0 | 6 | 1 | 0 | 3 | 3 | 0 | 7 | 25% |
| **druid** | 10 | 10 | 10 | - | 10 | 10 | 10 | 5 | 10 | 8 | 8 | 10 | 92% |
| **fighter** | 4 | 8 | 10 | 0 | - | 9 | 4 | 7 | 3 | 8 | 6 | 9 | 62% |
| **monk** | 0 | 5 | 4 | 0 | 1 | - | 3 | 9 | 10 | 3 | 10 | 10 | 50% |
| **paladin** | 7 | 6 | 9 | 0 | 6 | 7 | - | 6 | 4 | 8 | 9 | 8 | 64% |
| **ranger** | 4 | 9 | 10 | 5 | 3 | 1 | 4 | - | 4 | 8 | 10 | 9 | 61% |
| **rogue** | 3 | 8 | 7 | 0 | 7 | 0 | 6 | 6 | - | 8 | 10 | 10 | 59% |
| **sorcerer** | 0 | 4 | 7 | 2 | 2 | 7 | 2 | 2 | 2 | - | 2 | 9 | 35% |
| **warlock** | 3 | 8 | 10 | 2 | 4 | 0 | 1 | 0 | 0 | 8 | - | 5 | 37% |
| **wizard** | 0 | 4 | 3 | 0 | 1 | 0 | 2 | 1 | 0 | 1 | 5 | - | 15% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 1 (4.4), bard 0 (3.8), cleric 3 (5.9), druid 2 (6.0), fighter 0 (4.1), monk 0 (5.5), paladin 2 (5.4), ranger 2 (6.2), rogue 0 (11.0), sorcerer 5 (5.0), warlock 3 (5.1), wizard 3 (5.8)

## Level 8  (102 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 7 | 0 | 6 | 10 | 5 | 7 | 8 | 10 | 5 | 9 | 64% |
| **bard** | 7 | - | 4 | 0 | 3 | 5 | 4 | 2 | 4 | 6 | 2 | 4 | 37% |
| **cleric** | 3 | 6 | - | 1 | 2 | 2 | 1 | 1 | 7 | 6 | 1 | 9 | 35% |
| **druid** | 10 | 10 | 9 | - | 10 | 7 | 10 | 1 | 10 | 5 | 7 | 10 | 81% |
| **fighter** | 4 | 7 | 8 | 0 | - | 4 | 2 | 8 | 6 | 9 | 9 | 9 | 60% |
| **monk** | 0 | 5 | 8 | 3 | 6 | - | 3 | 10 | 10 | 5 | 10 | 10 | 64% |
| **paladin** | 5 | 6 | 9 | 0 | 8 | 7 | - | 9 | 6 | 8 | 9 | 9 | 69% |
| **ranger** | 3 | 8 | 9 | 9 | 2 | 0 | 1 | - | 3 | 8 | 9 | 10 | 56% |
| **rogue** | 2 | 6 | 3 | 0 | 4 | 0 | 4 | 7 | - | 7 | 9 | 9 | 46% |
| **sorcerer** | 0 | 4 | 4 | 5 | 1 | 5 | 2 | 2 | 3 | - | 5 | 8 | 35% |
| **warlock** | 5 | 8 | 9 | 3 | 1 | 0 | 1 | 1 | 1 | 5 | - | 5 | 35% |
| **wizard** | 1 | 6 | 1 | 0 | 1 | 0 | 1 | 0 | 1 | 2 | 5 | - | 16% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 6 (5.3), bard 0 (3.9), cleric 2 (6.3), druid 0 (3.2), fighter 0 (4.9), monk 4 (8.8), paladin 1 (6.9), ranger 1 (6.9), rogue 0 (13.7), sorcerer 6 (7.6), warlock 2 (5.3), wizard 3 (6.6)

## Level 9  (99 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 6 | 9 | 0 | 10 | 10 | 5 | 10 | 1 | 9 | 7 | 10 | 70% |
| **bard** | 4 | - | 0 | 0 | 2 | 2 | 2 | 2 | 1 | 4 | 3 | 4 | 22% |
| **cleric** | 1 | 10 | - | 0 | 3 | 2 | 0 | 2 | 3 | 6 | 3 | 10 | 36% |
| **druid** | 10 | 10 | 10 | - | 10 | 10 | 10 | 5 | 10 | 9 | 10 | 10 | 95% |
| **fighter** | 0 | 8 | 7 | 0 | - | 7 | 4 | 10 | 1 | 8 | 9 | 10 | 58% |
| **monk** | 0 | 8 | 8 | 0 | 3 | - | 2 | 9 | 9 | 6 | 7 | 10 | 56% |
| **paladin** | 5 | 8 | 10 | 0 | 6 | 8 | - | 10 | 1 | 6 | 5 | 10 | 63% |
| **ranger** | 0 | 8 | 8 | 5 | 0 | 1 | 0 | - | 2 | 7 | 6 | 9 | 42% |
| **rogue** | 9 | 9 | 7 | 0 | 9 | 1 | 9 | 8 | - | 10 | 8 | 10 | 73% |
| **sorcerer** | 1 | 6 | 4 | 1 | 2 | 4 | 4 | 3 | 0 | - | 5 | 10 | 36% |
| **warlock** | 3 | 7 | 7 | 0 | 1 | 3 | 5 | 4 | 2 | 5 | - | 10 | 43% |
| **wizard** | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | - | 6% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 3 (5.6), bard 0 (3.6), cleric 4 (5.7), druid 3 (3.2), fighter 1 (4.3), monk 1 (6.1), paladin 0 (4.1), ranger 0 (5.1), rogue 0 (11.8), sorcerer 10 (4.0), warlock 0 (4.7), wizard 6 (4.4)

## Across the levels

One on one, all levels: barbarian 67%, druid 64%, paladin 60%, fighter 59%, sorcerer 53%, rogue 52%, ranger 51%, monk 46%, warlock 41%, bard 39%, cleric 39%, wizard 29%

## Errors

None thrown.

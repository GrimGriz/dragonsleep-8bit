---
layer: the class bench (dev/bench_matrix.py; handoff-2026-09-28-npc-classes-to-six.md §3D). Every class NPC of deep16/js/classes.js at levels 1-9, run by the class tactics (deep16/js/tactics.js) in headless Edge: one on one against every other class, and as a band of four against the four at the same level. 10 fights a matchup.
written: 2026-09-30 05:40Z by the Code tab (config claude-opus-5-5). Rerun: python dev/bench_matrix.py n=10
reading: a duel cell is the row class's wins out of 10 against the column class (the rest the column's, or neither). A band line: how often four of the class beat the four heroes (Barley, Aurdin, Vivian, Lymen at the same level, the ladder's fixture: max hit dice, their magic weapons from 5). Estimates of the AI, not of the classes: a class the tactics play badly reads weak.
---

# The class bench

## Level 1  (65 s)

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

barbarian 9 (4.1), bard 3 (3.2), cleric 2 (4.1), druid 0 (4.3), fighter 9 (2.8), monk 1 (3.9), paladin 8 (5.1), ranger 3 (4.8), rogue 5 (3.8), sorcerer 10 (2.5), warlock 3 (4.7), wizard 7 (3.9)

## Level 2  (75 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 10 | 5 | 10 | 5 | 10 | 7 | 7 | 10 | 3 | 9 | 8 | 76% |
| **bard** | 0 | - | 0 | 6 | 0 | 2 | 1 | 0 | 3 | 0 | 0 | 5 | 15% |
| **cleric** | 5 | 10 | - | 10 | 6 | 8 | 5 | 2 | 8 | 2 | 7 | 5 | 62% |
| **druid** | 0 | 4 | 0 | - | 1 | 1 | 0 | 3 | 5 | 1 | 4 | 3 | 20% |
| **fighter** | 5 | 10 | 4 | 9 | - | 8 | 1 | 9 | 10 | 5 | 5 | 8 | 67% |
| **monk** | 0 | 8 | 2 | 9 | 2 | - | 4 | 5 | 9 | 1 | 3 | 3 | 42% |
| **paladin** | 3 | 9 | 5 | 10 | 9 | 6 | - | 9 | 10 | 2 | 8 | 9 | 73% |
| **ranger** | 3 | 10 | 8 | 7 | 1 | 5 | 1 | - | 9 | 1 | 5 | 7 | 52% |
| **rogue** | 0 | 7 | 2 | 5 | 0 | 1 | 0 | 1 | - | 0 | 0 | 0 | 15% |
| **sorcerer** | 7 | 10 | 8 | 9 | 5 | 9 | 8 | 9 | 10 | - | 9 | 5 | 81% |
| **warlock** | 1 | 10 | 3 | 6 | 5 | 7 | 2 | 5 | 10 | 1 | - | 0 | 45% |
| **wizard** | 2 | 5 | 5 | 7 | 2 | 7 | 1 | 3 | 10 | 5 | 10 | - | 52% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 7 (4.3), bard 0 (3.9), cleric 6 (6.2), druid 1 (7.8), fighter 5 (4.5), monk 1 (3.7), paladin 3 (6.4), ranger 1 (7.1), rogue 0 (4.6), sorcerer 9 (3.7), warlock 4 (5.5), wizard 2 (6.5)

## Level 3  (85 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 5 | 5 | 9 | 10 | 8 | 6 | 10 | 8 | 7 | 7 | 71% |
| **bard** | 7 | - | 10 | 7 | 5 | 10 | 7 | 6 | 10 | 6 | 7 | 3 | 71% |
| **cleric** | 5 | 0 | - | 1 | 5 | 8 | 7 | 4 | 9 | 1 | 7 | 0 | 43% |
| **druid** | 5 | 3 | 9 | - | 2 | 10 | 5 | 4 | 10 | 5 | 6 | 8 | 61% |
| **fighter** | 1 | 5 | 5 | 8 | - | 8 | 3 | 6 | 9 | 6 | 6 | 9 | 60% |
| **monk** | 0 | 0 | 2 | 0 | 2 | - | 1 | 8 | 10 | 2 | 3 | 5 | 30% |
| **paladin** | 2 | 3 | 3 | 5 | 7 | 9 | - | 7 | 10 | 9 | 8 | 6 | 63% |
| **ranger** | 4 | 4 | 6 | 6 | 4 | 2 | 3 | - | 10 | 3 | 7 | 5 | 49% |
| **rogue** | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | - | 0 | 0 | 1 | 3% |
| **sorcerer** | 2 | 4 | 9 | 5 | 4 | 8 | 1 | 7 | 10 | - | 7 | 7 | 58% |
| **warlock** | 3 | 3 | 3 | 4 | 4 | 7 | 2 | 3 | 10 | 3 | - | 6 | 44% |
| **wizard** | 3 | 7 | 10 | 2 | 1 | 5 | 4 | 5 | 9 | 3 | 4 | - | 48% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 9 (5.3), bard 9 (3.4), cleric 4 (7.1), druid 10 (4.2), fighter 1 (6.0), monk 0 (4.1), paladin 7 (6.0), ranger 0 (6.5), rogue 0 (4.1), sorcerer 10 (5.5), warlock 1 (6.2), wizard 8 (6.7)

## Level 4  (92 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 7 | 7 | 9 | 10 | 5 | 7 | 10 | 7 | 7 | 2 | 67% |
| **bard** | 7 | - | 8 | 8 | 4 | 10 | 5 | 4 | 10 | 5 | 7 | 2 | 64% |
| **cleric** | 3 | 2 | - | 2 | 3 | 4 | 4 | 5 | 10 | 4 | 7 | 1 | 41% |
| **druid** | 3 | 2 | 8 | - | 2 | 3 | 3 | 2 | 8 | 3 | 7 | 6 | 43% |
| **fighter** | 1 | 6 | 7 | 8 | - | 5 | 3 | 8 | 9 | 10 | 7 | 7 | 65% |
| **monk** | 0 | 0 | 6 | 7 | 5 | - | 0 | 8 | 10 | 4 | 8 | 8 | 51% |
| **paladin** | 5 | 5 | 6 | 7 | 7 | 10 | - | 8 | 10 | 7 | 10 | 9 | 76% |
| **ranger** | 3 | 6 | 5 | 8 | 2 | 2 | 2 | - | 10 | 3 | 9 | 6 | 51% |
| **rogue** | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | - | 0 | 0 | 0 | 3% |
| **sorcerer** | 3 | 5 | 6 | 7 | 0 | 6 | 3 | 7 | 10 | - | 7 | 5 | 54% |
| **warlock** | 3 | 3 | 3 | 3 | 3 | 2 | 0 | 1 | 10 | 3 | - | 6 | 34% |
| **wizard** | 8 | 8 | 9 | 4 | 3 | 2 | 1 | 4 | 10 | 5 | 4 | - | 53% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 6 (5.1), bard 8 (4.8), cleric 4 (7.0), druid 3 (5.4), fighter 3 (5.3), monk 0 (3.4), paladin 4 (7.3), ranger 1 (6.3), rogue 0 (4.4), sorcerer 4 (9.7), warlock 0 (6.4), wizard 9 (7.3)

## Level 5  (82 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 4 | 7 | 1 | 6 | 10 | 2 | 3 | 10 | 9 | 7 | 9 | 62% |
| **bard** | 6 | - | 6 | 5 | 1 | 10 | 0 | 0 | 10 | 8 | 4 | 7 | 52% |
| **cleric** | 3 | 4 | - | 0 | 1 | 10 | 1 | 2 | 10 | 3 | 0 | 5 | 35% |
| **druid** | 9 | 5 | 10 | - | 9 | 10 | 10 | 2 | 10 | 8 | 7 | 9 | 81% |
| **fighter** | 4 | 9 | 9 | 1 | - | 10 | 4 | 6 | 10 | 8 | 2 | 8 | 65% |
| **monk** | 0 | 0 | 0 | 0 | 0 | - | 0 | 4 | 8 | 0 | 4 | 6 | 20% |
| **paladin** | 8 | 10 | 9 | 0 | 6 | 10 | - | 3 | 10 | 6 | 4 | 10 | 69% |
| **ranger** | 7 | 10 | 8 | 8 | 4 | 6 | 7 | - | 10 | 8 | 7 | 7 | 75% |
| **rogue** | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | - | 0 | 0 | 0 | 2% |
| **sorcerer** | 1 | 2 | 7 | 2 | 2 | 10 | 4 | 2 | 10 | - | 1 | 6 | 43% |
| **warlock** | 3 | 6 | 10 | 3 | 8 | 6 | 6 | 3 | 10 | 9 | - | 8 | 65% |
| **wizard** | 1 | 3 | 5 | 1 | 2 | 4 | 0 | 3 | 10 | 4 | 2 | - | 32% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 6 (4.6), bard 1 (4.4), cleric 2 (4.5), druid 0 (3.2), fighter 0 (3.5), monk 0 (3.7), paladin 4 (4.2), ranger 5 (4.4), rogue 0 (3.0), sorcerer 8 (3.1), warlock 10 (2.5), wizard 6 (4.0)

## Level 6  (85 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 6 | 8 | 2 | 7 | 10 | 3 | 4 | 10 | 10 | 8 | 10 | 71% |
| **bard** | 4 | - | 7 | 3 | 0 | 9 | 0 | 1 | 10 | 6 | 6 | 7 | 48% |
| **cleric** | 2 | 3 | - | 0 | 1 | 10 | 3 | 1 | 10 | 3 | 2 | 4 | 35% |
| **druid** | 8 | 7 | 10 | - | 9 | 10 | 9 | 5 | 10 | 8 | 5 | 9 | 82% |
| **fighter** | 3 | 10 | 9 | 1 | - | 10 | 7 | 6 | 10 | 8 | 4 | 9 | 70% |
| **monk** | 0 | 1 | 0 | 0 | 0 | - | 0 | 4 | 9 | 0 | 5 | 3 | 20% |
| **paladin** | 7 | 10 | 7 | 1 | 3 | 10 | - | 7 | 10 | 4 | 6 | 10 | 68% |
| **ranger** | 6 | 9 | 9 | 5 | 4 | 6 | 3 | - | 10 | 8 | 9 | 9 | 71% |
| **rogue** | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | - | 0 | 0 | 0 | 1% |
| **sorcerer** | 0 | 4 | 7 | 2 | 2 | 10 | 6 | 2 | 10 | - | 5 | 8 | 51% |
| **warlock** | 2 | 4 | 8 | 5 | 6 | 5 | 4 | 1 | 10 | 5 | - | 6 | 51% |
| **wizard** | 0 | 3 | 6 | 1 | 1 | 7 | 0 | 1 | 10 | 2 | 4 | - | 32% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 2 (4.1), bard 0 (3.8), cleric 1 (6.1), druid 0 (3.1), fighter 0 (3.3), monk 0 (2.8), paladin 0 (4.4), ranger 1 (4.6), rogue 0 (2.9), sorcerer 7 (3.6), warlock 6 (3.7), wizard 5 (3.9)

## Level 7  (87 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 5 | 8 | 0 | 6 | 10 | 3 | 6 | 10 | 10 | 7 | 10 | 68% |
| **bard** | 5 | - | 1 | 0 | 1 | 9 | 0 | 0 | 10 | 6 | 2 | 6 | 36% |
| **cleric** | 2 | 9 | - | 0 | 0 | 8 | 1 | 0 | 9 | 3 | 0 | 7 | 35% |
| **druid** | 10 | 10 | 10 | - | 10 | 10 | 10 | 5 | 10 | 8 | 8 | 10 | 92% |
| **fighter** | 4 | 9 | 10 | 0 | - | 10 | 3 | 7 | 10 | 8 | 6 | 9 | 69% |
| **monk** | 0 | 1 | 2 | 0 | 0 | - | 2 | 5 | 8 | 2 | 6 | 10 | 33% |
| **paladin** | 7 | 10 | 9 | 0 | 7 | 8 | - | 7 | 10 | 8 | 9 | 8 | 75% |
| **ranger** | 4 | 10 | 10 | 5 | 3 | 5 | 3 | - | 10 | 8 | 10 | 9 | 70% |
| **rogue** | 0 | 0 | 1 | 0 | 0 | 2 | 0 | 0 | - | 0 | 2 | 0 | 5% |
| **sorcerer** | 0 | 4 | 7 | 2 | 2 | 8 | 2 | 2 | 10 | - | 2 | 9 | 44% |
| **warlock** | 3 | 8 | 10 | 2 | 4 | 4 | 1 | 0 | 8 | 8 | - | 5 | 48% |
| **wizard** | 0 | 4 | 3 | 0 | 1 | 0 | 2 | 1 | 10 | 1 | 5 | - | 25% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 6 (5.3), bard 0 (3.5), cleric 0 (4.2), druid 3 (6.3), fighter 3 (4.7), monk 0 (4.1), paladin 3 (5.7), ranger 2 (6.0), rogue 0 (5.7), sorcerer 7 (3.8), warlock 7 (3.8), wizard 3 (5.2)

## Level 8  (83 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 7 | 0 | 6 | 10 | 4 | 7 | 10 | 10 | 5 | 9 | 65% |
| **bard** | 7 | - | 6 | 0 | 0 | 10 | 1 | 0 | 10 | 6 | 2 | 5 | 43% |
| **cleric** | 3 | 4 | - | 1 | 2 | 5 | 1 | 1 | 10 | 6 | 1 | 9 | 39% |
| **druid** | 10 | 10 | 9 | - | 10 | 10 | 10 | 1 | 10 | 5 | 6 | 10 | 83% |
| **fighter** | 4 | 10 | 8 | 0 | - | 7 | 1 | 8 | 10 | 9 | 9 | 9 | 68% |
| **monk** | 0 | 0 | 5 | 0 | 3 | - | 1 | 7 | 9 | 2 | 6 | 9 | 38% |
| **paladin** | 6 | 9 | 9 | 0 | 9 | 9 | - | 9 | 10 | 8 | 9 | 9 | 79% |
| **ranger** | 3 | 10 | 9 | 9 | 2 | 3 | 1 | - | 10 | 8 | 9 | 10 | 67% |
| **rogue** | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | - | 0 | 4 | 1 | 5% |
| **sorcerer** | 0 | 4 | 4 | 5 | 1 | 8 | 2 | 2 | 10 | - | 5 | 9 | 45% |
| **warlock** | 5 | 8 | 9 | 4 | 1 | 4 | 1 | 1 | 6 | 5 | - | 5 | 45% |
| **wizard** | 1 | 5 | 1 | 0 | 1 | 1 | 1 | 0 | 9 | 1 | 5 | - | 23% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 2 (5.1), bard 0 (3.9), cleric 2 (5.8), druid 0 (3.2), fighter 1 (5.3), monk 0 (5.4), paladin 1 (5.1), ranger 0 (5.6), rogue 0 (5.8), sorcerer 6 (4.7), warlock 7 (6.1), wizard 2 (6.0)

## Level 9  (83 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 6 | 9 | 0 | 10 | 10 | 5 | 10 | 10 | 9 | 7 | 10 | 78% |
| **bard** | 4 | - | 1 | 0 | 2 | 9 | 1 | 2 | 10 | 4 | 3 | 2 | 35% |
| **cleric** | 1 | 9 | - | 0 | 3 | 4 | 0 | 2 | 10 | 6 | 3 | 10 | 44% |
| **druid** | 10 | 10 | 10 | - | 10 | 10 | 10 | 5 | 10 | 9 | 10 | 10 | 95% |
| **fighter** | 0 | 8 | 7 | 0 | - | 9 | 4 | 10 | 10 | 8 | 9 | 10 | 68% |
| **monk** | 0 | 1 | 6 | 0 | 1 | - | 0 | 7 | 10 | 3 | 3 | 10 | 37% |
| **paladin** | 5 | 9 | 10 | 0 | 6 | 10 | - | 10 | 10 | 6 | 5 | 10 | 74% |
| **ranger** | 0 | 8 | 8 | 5 | 0 | 3 | 0 | - | 10 | 7 | 6 | 9 | 51% |
| **rogue** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 1 | 2 | 3% |
| **sorcerer** | 1 | 6 | 4 | 1 | 2 | 7 | 4 | 3 | 10 | - | 5 | 10 | 48% |
| **warlock** | 3 | 7 | 7 | 0 | 1 | 7 | 5 | 4 | 9 | 5 | - | 10 | 53% |
| **wizard** | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 1 | 8 | 0 | 0 | - | 15% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 3 (5.6), bard 0 (4.0), cleric 2 (6.2), druid 1 (3.2), fighter 1 (5.1), monk 0 (4.0), paladin 1 (5.4), ranger 1 (7.1), rogue 0 (4.7), sorcerer 9 (4.7), warlock 6 (4.7), wizard 4 (4.8)

## Across the levels

One on one, all levels: barbarian 70%, paladin 70%, fighter 65%, druid 64%, ranger 59%, sorcerer 56%, warlock 48%, cleric 44%, bard 43%, wizard 38%, monk 34%, rogue 7%

## Errors

None thrown.

---
layer: the class bench (dev/bench_matrix.py; handoff-2026-09-28-npc-classes-to-six.md §3D). Every class NPC of deep16/js/classes.js at levels 1-9, run by the class tactics (deep16/js/tactics.js) in headless Edge: one on one against every other class, and as a band of four against the four at the same level. 10 fights a matchup.
written: 2026-10-29 03:31Z by the Code tab (config claude-opus-5-5). Rerun: python dev/bench_matrix.py n=10
reading: a duel cell is the row class's wins out of 10 against the column class (the rest the column's, or neither). A band line: how often four of the class beat the four heroes (Barley, Aurdin, Vivian, Lymen at the same level, the ladder's fixture: max hit dice, their magic weapons from 5). Estimates of the AI, not of the classes: a class the tactics play badly reads weak.
---

# The class bench

## Level 1  (198 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 9 | 4 | 8 | 8 | 9 | 9 | 8 | 7 | 2 | 8 | 7 | 72% |
| **bard** | 1 | - | 5 | 6 | 1 | 3 | 4 | 3 | 2 | 3 | 1 | 4 | 30% |
| **cleric** | 6 | 5 | - | 10 | 7 | 8 | 7 | 6 | 7 | 3 | 7 | 1 | 61% |
| **druid** | 2 | 4 | 0 | - | 0 | 2 | 1 | 4 | 5 | 0 | 2 | 2 | 20% |
| **fighter** | 2 | 9 | 3 | 10 | - | 8 | 6 | 7 | 7 | 2 | 7 | 6 | 61% |
| **monk** | 1 | 7 | 2 | 8 | 2 | - | 5 | 6 | 7 | 1 | 3 | 2 | 40% |
| **paladin** | 1 | 6 | 3 | 9 | 4 | 5 | - | 9 | 4 | 3 | 4 | 4 | 47% |
| **ranger** | 2 | 7 | 4 | 6 | 3 | 4 | 1 | - | 4 | 0 | 6 | 4 | 37% |
| **rogue** | 3 | 8 | 3 | 5 | 3 | 3 | 6 | 6 | - | 2 | 7 | 6 | 47% |
| **sorcerer** | 8 | 7 | 7 | 10 | 8 | 9 | 7 | 10 | 8 | - | 8 | 10 | 84% |
| **warlock** | 2 | 9 | 3 | 8 | 3 | 7 | 6 | 4 | 3 | 2 | - | 1 | 44% |
| **wizard** | 3 | 6 | 9 | 8 | 4 | 8 | 6 | 6 | 4 | 0 | 9 | - | 57% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 10 (4.0), bard 5 (4.1), cleric 9 (4.8), druid 7 (5.4), fighter 7 (3.7), monk 2 (3.2), paladin 9 (4.3), ranger 1 (4.4), rogue 2 (5.4), sorcerer 9 (2.6), warlock 2 (5.9), wizard 7 (5.4)

## Level 2  (206 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 9 | 5 | 10 | 5 | 10 | 7 | 7 | 8 | 3 | 9 | 8 | 74% |
| **bard** | 1 | - | 0 | 2 | 0 | 2 | 1 | 0 | 2 | 0 | 2 | 4 | 13% |
| **cleric** | 5 | 10 | - | 10 | 6 | 8 | 4 | 2 | 8 | 2 | 7 | 5 | 61% |
| **druid** | 0 | 8 | 0 | - | 1 | 3 | 2 | 2 | 6 | 2 | 3 | 8 | 32% |
| **fighter** | 5 | 10 | 4 | 9 | - | 8 | 1 | 9 | 6 | 5 | 5 | 8 | 64% |
| **monk** | 0 | 8 | 2 | 7 | 2 | - | 4 | 6 | 8 | 1 | 4 | 3 | 41% |
| **paladin** | 3 | 9 | 6 | 8 | 9 | 6 | - | 8 | 5 | 2 | 7 | 10 | 66% |
| **ranger** | 3 | 10 | 8 | 8 | 1 | 4 | 2 | - | 4 | 1 | 5 | 7 | 48% |
| **rogue** | 2 | 8 | 2 | 4 | 4 | 2 | 5 | 6 | - | 5 | 3 | 9 | 45% |
| **sorcerer** | 7 | 10 | 8 | 8 | 5 | 9 | 8 | 9 | 5 | - | 9 | 8 | 78% |
| **warlock** | 1 | 8 | 3 | 7 | 5 | 6 | 3 | 5 | 7 | 1 | - | 0 | 42% |
| **wizard** | 2 | 6 | 5 | 2 | 2 | 7 | 0 | 3 | 1 | 2 | 10 | - | 36% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 8 (5.4), bard 0 (4.2), cleric 4 (8.1), druid 2 (7.3), fighter 8 (4.5), monk 2 (5.8), paladin 8 (6.2), ranger 3 (6.2), rogue 0 (9.7), sorcerer 9 (3.7), warlock 2 (5.3), wizard 1 (7.3)

## Level 3  (253 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 5 | 4 | 9 | 10 | 8 | 6 | 8 | 8 | 7 | 7 | 68% |
| **bard** | 7 | - | 9 | 1 | 9 | 10 | 9 | 7 | 6 | 6 | 7 | 3 | 67% |
| **cleric** | 5 | 1 | - | 1 | 5 | 8 | 7 | 4 | 4 | 1 | 7 | 0 | 39% |
| **druid** | 6 | 9 | 9 | - | 3 | 10 | 5 | 5 | 5 | 4 | 6 | 8 | 64% |
| **fighter** | 1 | 1 | 5 | 7 | - | 8 | 5 | 6 | 6 | 6 | 6 | 9 | 55% |
| **monk** | 0 | 0 | 2 | 0 | 2 | - | 0 | 7 | 10 | 2 | 3 | 6 | 29% |
| **paladin** | 2 | 1 | 3 | 5 | 5 | 10 | - | 7 | 7 | 7 | 7 | 6 | 55% |
| **ranger** | 4 | 3 | 6 | 5 | 4 | 3 | 3 | - | 2 | 3 | 7 | 5 | 41% |
| **rogue** | 2 | 4 | 6 | 5 | 4 | 0 | 3 | 8 | - | 1 | 4 | 2 | 35% |
| **sorcerer** | 2 | 4 | 9 | 6 | 4 | 8 | 3 | 7 | 9 | - | 7 | 9 | 62% |
| **warlock** | 3 | 3 | 3 | 4 | 4 | 7 | 3 | 3 | 6 | 3 | - | 6 | 41% |
| **wizard** | 3 | 7 | 10 | 2 | 1 | 4 | 4 | 5 | 8 | 1 | 4 | - | 45% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 10 (5.4), bard 8 (3.2), cleric 6 (8.6), druid 10 (3.6), fighter 0 (6.9), monk 1 (5.3), paladin 8 (7.3), ranger 1 (7.2), rogue 0 (9.0), sorcerer 8 (6.0), warlock 0 (5.8), wizard 5 (9.2)

## Level 4  (267 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 3 | 7 | 8 | 9 | 10 | 5 | 7 | 9 | 7 | 7 | 2 | 67% |
| **bard** | 7 | - | 9 | 3 | 8 | 10 | 8 | 8 | 5 | 5 | 7 | 2 | 65% |
| **cleric** | 3 | 1 | - | 3 | 3 | 4 | 4 | 5 | 6 | 4 | 7 | 1 | 37% |
| **druid** | 2 | 7 | 7 | - | 2 | 3 | 5 | 1 | 1 | 3 | 7 | 6 | 40% |
| **fighter** | 1 | 2 | 7 | 8 | - | 5 | 6 | 8 | 7 | 10 | 7 | 7 | 62% |
| **monk** | 0 | 0 | 6 | 7 | 5 | - | 0 | 8 | 10 | 4 | 8 | 8 | 51% |
| **paladin** | 5 | 2 | 6 | 5 | 4 | 10 | - | 8 | 5 | 9 | 10 | 10 | 67% |
| **ranger** | 3 | 2 | 5 | 9 | 2 | 2 | 2 | - | 3 | 3 | 9 | 6 | 42% |
| **rogue** | 1 | 5 | 4 | 9 | 3 | 0 | 5 | 7 | - | 5 | 6 | 7 | 47% |
| **sorcerer** | 3 | 5 | 6 | 7 | 0 | 6 | 1 | 7 | 5 | - | 7 | 6 | 48% |
| **warlock** | 3 | 3 | 3 | 3 | 3 | 2 | 0 | 1 | 4 | 3 | - | 6 | 28% |
| **wizard** | 8 | 8 | 9 | 4 | 3 | 2 | 0 | 4 | 3 | 4 | 4 | - | 45% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 7 (5.8), bard 8 (4.4), cleric 4 (8.0), druid 4 (5.1), fighter 5 (5.8), monk 1 (4.2), paladin 6 (6.9), ranger 0 (7.1), rogue 1 (8.6), sorcerer 4 (9.1), warlock 0 (5.6), wizard 6 (7.7)

## Level 5  (227 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 4 | 7 | 2 | 6 | 10 | 2 | 3 | 7 | 9 | 7 | 10 | 61% |
| **bard** | 6 | - | 5 | 0 | 3 | 8 | 5 | 0 | 4 | 8 | 4 | 7 | 45% |
| **cleric** | 3 | 5 | - | 0 | 1 | 4 | 3 | 2 | 4 | 3 | 0 | 5 | 27% |
| **druid** | 8 | 10 | 10 | - | 9 | 9 | 10 | 4 | 9 | 7 | 7 | 9 | 84% |
| **fighter** | 4 | 7 | 9 | 1 | - | 7 | 3 | 6 | 4 | 8 | 2 | 9 | 55% |
| **monk** | 0 | 2 | 6 | 1 | 3 | - | 2 | 8 | 10 | 7 | 7 | 10 | 51% |
| **paladin** | 8 | 5 | 7 | 0 | 7 | 8 | - | 1 | 3 | 3 | 0 | 10 | 47% |
| **ranger** | 7 | 10 | 8 | 6 | 4 | 2 | 9 | - | 8 | 9 | 7 | 7 | 70% |
| **rogue** | 3 | 6 | 6 | 1 | 6 | 0 | 7 | 2 | - | 5 | 4 | 10 | 45% |
| **sorcerer** | 1 | 2 | 7 | 3 | 2 | 3 | 7 | 1 | 5 | - | 1 | 6 | 35% |
| **warlock** | 3 | 6 | 10 | 3 | 8 | 3 | 10 | 3 | 6 | 9 | - | 8 | 63% |
| **wizard** | 0 | 3 | 5 | 1 | 1 | 0 | 0 | 3 | 0 | 4 | 2 | - | 17% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 5 (4.5), bard 0 (4.3), cleric 4 (8.6), druid 0 (4.5), fighter 0 (3.8), monk 0 (3.0), paladin 2 (5.0), ranger 3 (4.8), rogue 0 (6.5), sorcerer 10 (3.2), warlock 5 (6.3), wizard 6 (3.2)

## Level 6  (195 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 6 | 8 | 2 | 7 | 9 | 3 | 4 | 9 | 10 | 8 | 10 | 69% |
| **bard** | 4 | - | 4 | 0 | 2 | 4 | 6 | 1 | 3 | 0 | 6 | 7 | 34% |
| **cleric** | 2 | 6 | - | 0 | 1 | 2 | 3 | 1 | 3 | 3 | 2 | 4 | 25% |
| **druid** | 8 | 10 | 10 | - | 9 | 3 | 10 | 6 | 10 | 2 | 5 | 9 | 75% |
| **fighter** | 3 | 8 | 9 | 1 | - | 6 | 5 | 6 | 3 | 8 | 3 | 10 | 56% |
| **monk** | 1 | 6 | 8 | 7 | 4 | - | 3 | 8 | 10 | 8 | 9 | 10 | 67% |
| **paladin** | 7 | 4 | 7 | 0 | 5 | 7 | - | 2 | 3 | 2 | 3 | 10 | 45% |
| **ranger** | 6 | 9 | 9 | 4 | 4 | 2 | 8 | - | 7 | 6 | 9 | 8 | 65% |
| **rogue** | 1 | 7 | 7 | 0 | 7 | 0 | 7 | 3 | - | 5 | 5 | 10 | 47% |
| **sorcerer** | 0 | 10 | 7 | 8 | 2 | 2 | 8 | 4 | 5 | - | 10 | 9 | 59% |
| **warlock** | 2 | 4 | 8 | 5 | 7 | 1 | 7 | 1 | 5 | 0 | - | 6 | 42% |
| **wizard** | 0 | 3 | 6 | 1 | 0 | 0 | 0 | 2 | 0 | 1 | 4 | - | 15% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 4 (4.3), bard 1 (5.4), cleric 2 (7.1), druid 0 (3.4), fighter 1 (3.3), monk 2 (4.6), paladin 0 (5.6), ranger 3 (6.8), rogue 0 (7.1), sorcerer 9 (4.2), warlock 2 (4.1), wizard 3 (4.9)

## Level 7  (203 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 4 | 8 | 0 | 6 | 7 | 3 | 6 | 8 | 10 | 8 | 10 | 64% |
| **bard** | 6 | - | 4 | 0 | 1 | 4 | 9 | 1 | 2 | 6 | 2 | 6 | 37% |
| **cleric** | 2 | 6 | - | 0 | 0 | 0 | 1 | 0 | 1 | 3 | 0 | 7 | 18% |
| **druid** | 10 | 10 | 10 | - | 10 | 5 | 10 | 6 | 10 | 10 | 8 | 10 | 90% |
| **fighter** | 4 | 9 | 10 | 0 | - | 8 | 3 | 7 | 1 | 9 | 4 | 10 | 59% |
| **monk** | 3 | 6 | 10 | 5 | 2 | - | 1 | 8 | 10 | 9 | 10 | 10 | 67% |
| **paladin** | 7 | 1 | 9 | 0 | 7 | 9 | - | 0 | 7 | 0 | 5 | 10 | 50% |
| **ranger** | 4 | 9 | 10 | 4 | 3 | 2 | 10 | - | 4 | 7 | 10 | 10 | 66% |
| **rogue** | 2 | 8 | 9 | 0 | 9 | 0 | 3 | 6 | - | 6 | 10 | 10 | 57% |
| **sorcerer** | 0 | 4 | 7 | 0 | 1 | 1 | 10 | 3 | 4 | - | 2 | 9 | 37% |
| **warlock** | 2 | 8 | 10 | 2 | 6 | 0 | 5 | 0 | 0 | 8 | - | 5 | 42% |
| **wizard** | 0 | 4 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 5 | - | 12% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 2 (4.9), bard 0 (4.2), cleric 3 (8.1), druid 2 (8.0), fighter 1 (4.1), monk 1 (4.9), paladin 0 (4.6), ranger 2 (6.6), rogue 1 (8.7), sorcerer 5 (6.1), warlock 0 (4.9), wizard 2 (4.9)

## Level 8  (171 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 2 | 7 | 0 | 6 | 7 | 4 | 7 | 9 | 10 | 5 | 10 | 61% |
| **bard** | 8 | - | 4 | 0 | 2 | 3 | 3 | 1 | 4 | 6 | 2 | 4 | 34% |
| **cleric** | 3 | 6 | - | 1 | 2 | 0 | 1 | 1 | 7 | 6 | 1 | 8 | 33% |
| **druid** | 10 | 10 | 9 | - | 10 | 1 | 9 | 2 | 10 | 5 | 7 | 10 | 75% |
| **fighter** | 4 | 8 | 8 | 0 | - | 5 | 3 | 8 | 6 | 9 | 6 | 10 | 61% |
| **monk** | 3 | 7 | 10 | 9 | 5 | - | 2 | 10 | 10 | 10 | 10 | 10 | 78% |
| **paladin** | 6 | 7 | 9 | 1 | 7 | 8 | - | 2 | 5 | 0 | 1 | 10 | 51% |
| **ranger** | 3 | 9 | 9 | 8 | 2 | 0 | 8 | - | 1 | 6 | 9 | 10 | 59% |
| **rogue** | 1 | 6 | 3 | 0 | 4 | 0 | 5 | 9 | - | 5 | 10 | 10 | 48% |
| **sorcerer** | 0 | 4 | 4 | 5 | 1 | 0 | 10 | 4 | 5 | - | 5 | 8 | 42% |
| **warlock** | 5 | 8 | 9 | 3 | 4 | 0 | 9 | 1 | 0 | 5 | - | 5 | 45% |
| **wizard** | 0 | 6 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 5 | - | 14% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 7 (5.5), bard 0 (3.8), cleric 1 (6.4), druid 0 (4.2), fighter 2 (5.2), monk 5 (6.3), paladin 1 (4.9), ranger 4 (6.5), rogue 0 (9.6), sorcerer 6 (5.8), warlock 0 (4.8), wizard 0 (4.7)

## Level 9  (117 s)

| row beats column | Bbn | Brd | Clr | Drd | Ftr | Mnk | Pal | Rgr | Rog | Sor | Wlk | Wiz | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **barbarian** | - | 6 | 9 | 0 | 10 | 7 | 4 | 10 | 2 | 10 | 7 | 10 | 68% |
| **bard** | 4 | - | 0 | 0 | 2 | 1 | 10 | 2 | 1 | 4 | 3 | 4 | 28% |
| **cleric** | 1 | 10 | - | 0 | 3 | 0 | 1 | 1 | 6 | 6 | 3 | 10 | 37% |
| **druid** | 10 | 10 | 10 | - | 10 | 3 | 10 | 6 | 10 | 7 | 10 | 10 | 87% |
| **fighter** | 0 | 8 | 7 | 0 | - | 8 | 3 | 10 | 1 | 9 | 7 | 10 | 57% |
| **monk** | 3 | 9 | 10 | 7 | 2 | - | 3 | 7 | 9 | 10 | 9 | 10 | 72% |
| **paladin** | 6 | 0 | 9 | 0 | 7 | 7 | - | 0 | 1 | 5 | 4 | 10 | 45% |
| **ranger** | 0 | 8 | 9 | 4 | 0 | 3 | 10 | - | 5 | 4 | 6 | 10 | 54% |
| **rogue** | 8 | 9 | 4 | 0 | 9 | 1 | 9 | 5 | - | 8 | 8 | 10 | 65% |
| **sorcerer** | 0 | 6 | 4 | 3 | 1 | 0 | 5 | 6 | 2 | - | 5 | 10 | 38% |
| **warlock** | 3 | 7 | 7 | 0 | 3 | 1 | 6 | 4 | 2 | 5 | - | 9 | 43% |
| **wizard** | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | - | 6% |

Bands of four against the four (the band's wins of 10, the rounds):

barbarian 2 (5.3), bard 0 (3.6), cleric 2 (5.9), druid 3 (3.9), fighter 1 (5.0), monk 1 (6.0), paladin 0 (4.8), ranger 2 (6.0), rogue 0 (9.0), sorcerer 8 (5.1), warlock 0 (4.8), wizard 2 (4.9)

## Across the levels

One on one, all levels: barbarian 67%, druid 63%, fighter 59%, monk 55%, ranger 54%, sorcerer 54%, paladin 53%, rogue 49%, warlock 43%, bard 39%, cleric 38%, wizard 27%

## Errors

None thrown.

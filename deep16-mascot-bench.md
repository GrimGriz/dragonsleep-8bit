---
layer: the Mascot bench (dev/bench_mascots.py; the MPMon lane §3.2; Griz, 10-07: *"Bench them vs the story party please"*). The four Mascots of deep16/js/mpmon.js (Denny, Beholda, Rascal, Goose) as a band against the four heroes (Barley, Aurdin, Vivian, Lymen) at the same level, and each one on one against each hero, levels 1-9, every side run by the class AI in headless Edge. 20 band fights a level, 10 a duel.
written: 2026-10-07 05:06Z by the Code tab (config claude-opus-5-5). Rerun: python dev/bench_mascots.py n=20 nd=10
reading: the band line is the Mascots' wins of 20 against the four (the rest the heroes', or neither), its rounds, and beside it the class bench's bands at that level (four of a class against the same four, of 10). Twice: the heroes as the ladder's fixture (max hit dice, their magic weapons from 5 -- as the class bench), then on the NPCs' average HP (avghp=1, even footing: the Mascots are NPCs and roll average). A duel cell is the Mascot's wins of 10 against that hero. Estimates of the AI, not of the kits: a move the AI spends badly reads weak.
---

# The Mascot bench

## At a glance

| level | the band vs the four (fixture) | (average HP) | the class bands at that level, best and worst | Denny 1v1 | Beholda 1v1 | Rascal 1v1 | Goose 1v1 |
|---|---|---|---|---|---|---|---|
| 1 | **2 of 20** (4.0 rounds) | 2 of 20 | barbarian 10, warlock 2; median 7 | 45% | 30% | 25% | 18% |
| 2 | **0 of 20** (4.5 rounds) | 0 of 20 | barbarian 10, warlock 0; median 3 | 58% | 38% | 12% | 15% |
| 3 | **0 of 20** (4.7 rounds) | 2 of 20 | barbarian 10, warlock 0; median 6 | 50% | 30% | 10% | 12% |
| 4 | **2 of 20** (5.8 rounds) | 2 of 20 | bard 8, warlock 0; median 4 | 55% | 42% | 8% | 22% |
| 5 | **1 of 20** (4.0 rounds) | 2 of 20 | wizard 9, rogue 0; median 3 | 25% | 30% | 10% | 0% |
| 6 | **0 of 20** (4.7 rounds) | 4 of 20 | sorcerer 10, rogue 0; median 1 | 35% | 42% | 8% | 0% |
| 7 | **0 of 20** (5.1 rounds) | 1 of 20 | sorcerer 5, rogue 0; median 2 | 28% | 48% | 5% | 20% |
| 8 | **0 of 20** (6.6 rounds) | 8 of 20 | barbarian 6, rogue 0; median 2 | 48% | 50% | 0% | 20% |
| 9 | **13 of 20** (6.4 rounds) | 13 of 20 | sorcerer 10, warlock 0; median 1 | 40% | 48% | 22% | 25% |

## Level 1  (19 s)

The band: the Mascots won 2 of 20, the heroes 18, 4.0 rounds (on average HP: 2, the heroes 18).

In the band fights, a fight: Denny dealt 9, took 14, down 1.0, specials left 0.2 of 1; Beholda dealt 4, took 10, down 0.9, specials left 0.5 of 1; Rascal dealt 6, took 7, down 0.9, specials left 0.2 of 1; Goose dealt 6, took 9, down 0.9, specials left 0.6 of 1; Barley dealt 13, took 5, down 0.2; Aurdin dealt 6, took 7, down 1.1; Vivian dealt 3, took 5, down 0.3; Lymen dealt 11, took 2, down 0.1.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 5 (3 r) | 3 (2 r) | 7 (5 r) | 3 (3 r) | 45% |
| **Beholda** | 3 (3 r) | 1 (1 r) | 6 (4 r) | 2 (3 r) | 30% |
| **Rascal** | 0 (3 r) | 2 (1 r) | 6 (4 r) | 2 (3 r) | 25% |
| **Goose** | 0 (2 r) | 1 (2 r) | 3 (4 r) | 3 (3 r) | 18% |

On average HP, one on one: Denny 45%, Beholda 30%, Rascal 25%, Goose 18%.

## Level 2  (68 s)

The band: the Mascots won 0 of 20, the heroes 20, 4.5 rounds (on average HP: 0, the heroes 20).

In the band fights, a fight: Denny dealt 19, took 24, down 1.0, specials left 0.0 of 1; Beholda dealt 4, took 18, down 1.0, specials left 0.5 of 1; Rascal dealt 11, took 14, down 1.0, specials left 0.1 of 1; Goose dealt 9, took 14, down 1.0, specials left 0.5 of 1; Barley dealt 22, took 8, down 0.0; Aurdin dealt 17, took 17, down 1.1; Vivian dealt 6, took 7, down 0.2; Lymen dealt 18, took 3, down 0.0.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 4 (4 r) | 6 (2 r) | 10 (4 r) | 3 (4 r) | 58% |
| **Beholda** | 1 (3 r) | 5 (3 r) | 9 (6 r) | 0 (4 r) | 38% |
| **Rascal** | 0 (3 r) | 5 (2 r) | 0 (20001 r) | 0 (6 r) | 12% |
| **Goose** | 0 (2 r) | 2 (3 r) | 4 (8 r) | 0 (4 r) | 15% |

On average HP, one on one: Denny 60%, Beholda 48%, Rascal 15%, Goose 20%.

## Level 3  (58 s)

The band: the Mascots won 0 of 20, the heroes 20, 4.7 rounds (on average HP: 2, the heroes 18).

In the band fights, a fight: Denny dealt 15, took 35, down 1.0, specials left 0.2 of 2; Beholda dealt 12, took 26, down 1.0, specials left 1.0 of 2; Rascal dealt 23, took 22, down 1.0, specials left 0.1 of 2; Goose dealt 9, took 21, down 1.0, specials left 0.9 of 2; Barley dealt 35, took 13, down 0.0; Aurdin dealt 34, took 24, down 0.8; Vivian dealt 12, took 3, down 0.0; Lymen dealt 16, took 11, down 0.0.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 5 (5 r) | 2 (4 r) | 10 (6 r) | 3 (5 r) | 50% |
| **Beholda** | 0 (5 r) | 2 (5 r) | 10 (7 r) | 0 (5 r) | 30% |
| **Rascal** | 0 (4 r) | 4 (2 r) | 0 (20001 r) | 0 (8 r) | 10% |
| **Goose** | 0 (3 r) | 0 (4 r) | 5 (13 r) | 0 (2 r) | 12% |

On average HP, one on one: Denny 55%, Beholda 48%, Rascal 15%, Goose 12%.

## Level 4  (70 s)

The band: the Mascots won 2 of 20, the heroes 18, 5.8 rounds (on average HP: 2, the heroes 18).

In the band fights, a fight: Denny dealt 38, took 45, down 0.9, specials left 0.1 of 2; Beholda dealt 14, took 40, down 0.9, specials left 0.6 of 2; Rascal dealt 33, took 27, down 0.9, specials left 0.1 of 2; Goose dealt 11, took 28, down 0.9, specials left 0.6 of 2; Barley dealt 45, took 19, down 0.1; Aurdin dealt 50, took 40, down 1.2; Vivian dealt 14, took 13, down 0.2; Lymen dealt 26, took 19, down 0.1.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 3 (5 r) | 5 (4 r) | 10 (7 r) | 4 (6 r) | 55% |
| **Beholda** | 0 (6 r) | 8 (4 r) | 9 (7 r) | 0 (5 r) | 42% |
| **Rascal** | 0 (4 r) | 3 (2 r) | 0 (20001 r) | 0 (6 r) | 8% |
| **Goose** | 0 (3 r) | 2 (4 r) | 7 (16 r) | 0 (3 r) | 22% |

On average HP, one on one: Denny 62%, Beholda 55%, Rascal 15%, Goose 22%.

## Level 5  (39 s)

The band: the Mascots won 1 of 20, the heroes 19, 4.0 rounds (on average HP: 2, the heroes 18).

In the band fights, a fight: Denny dealt 13, took 50, down 0.9, specials left 2.4 of 3; Beholda dealt 28, took 42, down 0.9, specials left 0.1 of 3; Rascal dealt 43, took 36, down 0.9, specials left 0.8 of 3; Goose dealt 12, took 32, down 0.9, specials left 1.9 of 3; Barley dealt 66, took 21, down 0.1; Aurdin dealt 67, took 43, down 0.9; Vivian dealt 8, took 10, down 0.1; Lymen dealt 16, took 20, down 0.1.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 2 (3 r) | 5 (2 r) | 3 (8 r) | 0 (3 r) | 25% |
| **Beholda** | 0 (4 r) | 5 (3 r) | 7 (8 r) | 0 (6 r) | 30% |
| **Rascal** | 0 (3 r) | 1 (2 r) | 3 (10008 r) | 0 (9 r) | 10% |
| **Goose** | 0 (2 r) | 0 (2 r) | 0 (20 r) | 0 (2 r) | 0% |

On average HP, one on one: Denny 40%, Beholda 45%, Rascal 18%, Goose 5%.

## Level 6  (53 s)

The band: the Mascots won 0 of 20, the heroes 20, 4.7 rounds (on average HP: 4, the heroes 16).

In the band fights, a fight: Denny dealt 10, took 69, down 1.0, specials left 2.2 of 3; Beholda dealt 40, took 55, down 1.0, specials left 0.0 of 3; Rascal dealt 66, took 45, down 1.0, specials left 0.2 of 3; Goose dealt 17, took 41, down 1.0, specials left 1.4 of 3; Barley dealt 88, took 34, down 0.0; Aurdin dealt 72, took 57, down 1.1; Vivian dealt 10, took 13, down 0.0; Lymen dealt 40, took 31, down 0.1.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 2 (3 r) | 6 (3 r) | 6 (8 r) | 0 (2 r) | 35% |
| **Beholda** | 0 (5 r) | 8 (3 r) | 9 (7 r) | 0 (6 r) | 42% |
| **Rascal** | 1 (4 r) | 1 (2 r) | 0 (20001 r) | 1 (8 r) | 8% |
| **Goose** | 0 (2 r) | 0 (4 r) | 0 (20 r) | 0 (2 r) | 0% |

On average HP, one on one: Denny 48%, Beholda 58%, Rascal 35%, Goose 2%.

## Level 7  (53 s)

The band: the Mascots won 0 of 20, the heroes 20, 5.1 rounds (on average HP: 1, the heroes 19).

In the band fights, a fight: Denny dealt 24, took 93, down 1.0, specials left 2.7 of 4; Beholda dealt 42, took 59, down 0.9, specials left 0.1 of 4; Rascal dealt 79, took 57, down 1.0, specials left 0.5 of 4; Goose dealt 11, took 45, down 0.9, specials left 1.3 of 4; Barley dealt 99, took 45, down 0.0; Aurdin dealt 98, took 65, down 0.9; Vivian dealt 12, took 10, down 0.0; Lymen dealt 45, took 38, down 0.1.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 2 (4 r) | 6 (4 r) | 3 (10 r) | 0 (3 r) | 28% |
| **Beholda** | 0 (6 r) | 10 (3 r) | 9 (8 r) | 0 (6 r) | 48% |
| **Rascal** | 1 (5 r) | 1 (3 r) | 0 (20001 r) | 0 (10 r) | 5% |
| **Goose** | 0 (2 r) | 8 (3 r) | 0 (18 r) | 0 (2 r) | 20% |

On average HP, one on one: Denny 50%, Beholda 60%, Rascal 18%, Goose 20%.

## Level 8  (22 s)

The band: the Mascots won 0 of 20, the heroes 20, 6.6 rounds (on average HP: 8, the heroes 12).

In the band fights, a fight: Denny dealt 28, took 113, down 1.0, specials left 2.0 of 4; Beholda dealt 62, took 73, down 1.0, specials left 0.0 of 4; Rascal dealt 131, took 81, down 1.0, specials left 0.1 of 4; Goose dealt 16, took 51, down 0.8, specials left 0.8 of 4; Barley dealt 128, took 82, down 0.1; Aurdin dealt 111, took 86, down 1.8; Vivian dealt 26, took 15, down 0.0; Lymen dealt 62, took 63, down 0.1.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 1 (4 r) | 10 (3 r) | 8 (8 r) | 0 (3 r) | 48% |
| **Beholda** | 1 (6 r) | 9 (3 r) | 10 (8 r) | 0 (7 r) | 50% |
| **Rascal** | 0 (4 r) | 0 (4 r) | 0 (7 r) | 0 (10 r) | 0% |
| **Goose** | 0 (3 r) | 8 (4 r) | 0 (31 r) | 0 (2 r) | 20% |

On average HP, one on one: Denny 60%, Beholda 58%, Rascal 22%, Goose 22%.

## Level 9  (23 s)

The band: the Mascots won 13 of 20, the heroes 7, 6.4 rounds (on average HP: 13, the heroes 7).

In the band fights, a fight: Denny dealt 59, took 130, down 0.6, specials left 2.0 of 5; Beholda dealt 93, took 59, down 0.3, specials left 0.0 of 5; Rascal dealt 188, took 68, down 0.5, specials left 0.5 of 5; Goose dealt 10, took 51, down 0.4, specials left 1.8 of 5; Barley dealt 112, took 121, down 0.7; Aurdin dealt 145, took 91, down 1.3; Vivian dealt 38, took 71, down 0.8; Lymen dealt 43, took 96, down 0.8.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 1 (4 r) | 10 (3 r) | 5 (8 r) | 0 (5 r) | 40% |
| **Beholda** | 1 (7 r) | 8 (4 r) | 10 (6 r) | 0 (8 r) | 48% |
| **Rascal** | 7 (5 r) | 0 (4 r) | 1 (8 r) | 1 (12 r) | 22% |
| **Goose** | 0 (4 r) | 9 (5 r) | 1 (36 r) | 0 (3 r) | 25% |

On average HP, one on one: Denny 60%, Beholda 68%, Rascal 40%, Goose 30%.


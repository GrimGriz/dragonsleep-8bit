---
layer: the Mascot bench (dev/bench_mascots.py; the MPMon lane §3.2; Griz, 10-07: *"Bench them vs the story party please"*). The four Mascots of deep16/js/mpmon.js (Denny, Beholda, Rascal, Goose) as a band against the four heroes (Barley, Aurdin, Vivian, Lymen) at the same level, and each one on one against each hero, levels 1-9, every side run by the class AI in headless Edge. 20 band fights a level, 10 a duel.
written: 2026-10-07 15:46Z by the Code tab (config claude-opus-5-5). Rerun: python dev/bench_mascots.py n=20 nd=10
reading: the band line is the Mascots' wins of 20 against the four (the rest the heroes', or neither), its rounds, and beside it the class bench's bands at that level (four of a class against the same four, of 10). Twice: the heroes as the ladder's fixture (max hit dice, their magic weapons from 5 -- as the class bench), then on the NPCs' average HP (avghp=1, even footing: the Mascots are NPCs and roll average). A duel cell is the Mascot's wins of 10 against that hero. What the actions went to (since 10-07, his worry that Beholda only Big-Screens after 5th): the class AI's pick for each Mascot's action, and the bonus specials as they fired, counted over the band fights. Estimates of the AI, not of the kits: a move the AI spends badly reads weak.
---

# The Mascot bench

## At a glance

| level | the band vs the four (fixture) | (average HP) | the class bands at that level, best and worst | Denny 1v1 | Beholda 1v1 | Rascal 1v1 | Goose 1v1 |
|---|---|---|---|---|---|---|---|
| 1 | **4 of 20** (4.3 rounds) | 4 of 20 | barbarian 10, warlock 2; median 7 | 45% | 18% | 25% | 18% |
| 2 | **4 of 20** (5.5 rounds) | 6 of 20 | barbarian 10, warlock 0; median 3 | 72% | 32% | 12% | 22% |
| 3 | **5 of 20** (7.8 rounds) | 9 of 20 | barbarian 10, warlock 0; median 6 | 62% | 30% | 12% | 25% |
| 4 | **9 of 20** (7.3 rounds) | 11 of 20 | bard 8, warlock 0; median 4 | 58% | 45% | 15% | 42% |
| 5 | **2 of 20** (5.5 rounds) | 7 of 20 | wizard 9, rogue 0; median 3 | 45% | 42% | 18% | 2% |
| 6 | **11 of 20** (875.8 rounds) | 12 of 20 | sorcerer 10, rogue 0; median 1 | 42% | 42% | 20% | 8% |
| 7 | **6 of 20** (7.2 rounds) | 14 of 20 | sorcerer 5, rogue 0; median 2 | 42% | 48% | 8% | 25% |
| 8 | **13 of 20** (8.5 rounds) | 20 of 20 | barbarian 6, rogue 0; median 2 | 60% | 50% | 0% | 30% |
| 9 | **11 of 20** (6.8 rounds) | 16 of 20 | sorcerer 10, warlock 0; median 1 | 62% | 45% | 28% | 25% |

## What the actions went to (the band fights, fixture; the three most of each one's actions, by share)

| level | Denny | Beholda | Rascal | Goose |
|---|---|---|---|---|
| 1 | DENIM DAMAGE 64%, strikes 33%, nothing worth it: close in or ready 4% | strikes 57%, nothing worth it: close in or ready 32%, BALEFUL GAZE 7% | cast firebolt 70%, SOCIAL FLAME 30% | shoots 100% |
| 2 | strikes 50%, DENIM DAMAGE 49%, nothing worth it: close in or ready 1% | strikes 66%, nothing worth it: close in or ready 22%, BALEFUL GAZE 12% | cast firebolt 76%, SOCIAL FLAME 23%, strikes 1% | shoots 100% |
| 3 | DENIM DAMAGE 59%, strikes 41% | strikes 51%, BALEFUL GAZE 19%, nothing worth it: close in or ready 17% | cast firebolt 64%, SOCIAL FLAME 32%, strikes 3% | shoots 96%, GROUP HUG 4% |
| 4 | DENIM DAMAGE 57%, strikes 40%, nothing worth it: close in or ready 3% | strikes 51%, VNA BUBBLE 20%, nothing worth it: close in or ready 17% | cast firebolt 69%, SOCIAL FLAME 30%, strikes 2% | shoots 93%, GROUP HUG 7% |
| 5 | DENIM DAMAGE 91%, CANNONBALL 9% | strikes 36%, VNA BUBBLE 23%, BIG SCREEN 21% | SOCIAL FLAME 75%, cast firebolt 25% | shoots 84%, GROUP HUG 12%, FOUNTAIN 4% |
| 6 | DENIM DAMAGE 74%, CANNONBALL 15%, strikes 9% | strikes 35%, BIG SCREEN 24%, VNA BUBBLE 20% | SOCIAL FLAME 54%, cast firebolt 44%, SOCIAL DISTANCING 2% | shoots 78%, GROUP HUG 17%, FOUNTAIN 5% |
| 7 | DENIM DAMAGE 52%, strikes 22%, CANNONBALL 15% | SPOTLIGHT 31%, strikes 31%, VNA BUBBLE 18% | SOCIAL FLAME 37%, GOING VIRAL 33%, cast firebolt 27% | shoots 53%, GROUP HUG 28%, LIFELINE 10% |
| 8 | strikes 32%, LOBSTAH HUG 28%, DENIM DAMAGE 26% | strikes 38%, SPOTLIGHT 35%, VNA BUBBLE 12% | GOING VIRAL 40%, cast firebolt 40%, SOCIAL FLAME 19% | shoots 60%, FOUNTAIN 16%, GROUP HUG 15% |
| 9 | LOBSTAH HUG 36%, DENIM DAMAGE 32%, CANNONBALL 15% | SPOTLIGHT 37%, BIG SCREEN 20%, VNA BUBBLE 17% | GOING VIRAL 52%, SOCIAL FLAME 20%, cast firebolt 19% | shoots 56%, GROUP HUG 29%, FOUNTAIN 8% |

## Level 1  (19 s)

The band: the Mascots won 4 of 20, the heroes 16, 4.3 rounds (on average HP: 4, the heroes 16).

In the band fights, a fight: Denny dealt 8, took 12, down 0.8, specials left 0.8 of 1 bonus / 0.2 of 1 action; Beholda dealt 7, took 9, down 0.8, specials left 0.6 of 1 bonus / 0.8 of 1 action; Rascal dealt 6, took 7, down 0.8, specials left 0.2 of 1 bonus / 0.2 of 1 action; Goose dealt 6, took 9, down 0.9, specials left 0.8 of 1 bonus / 1.0 of 1 action; Barley dealt 14, took 6, down 0.3; Aurdin dealt 4, took 7, down 1.0; Vivian dealt 3, took 5, down 0.5; Lymen dealt 12, took 5, down 0.3.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 59 turns: the action DENIM DAMAGE 35, strikes 18, nothing worth it: close in or ready 2; the bonus specials taunt 3.
- **Beholda**, 34 turns: the action strikes 16, nothing worth it: close in or ready 9, BALEFUL GAZE 2, VNA BUBBLE 1; the bonus specials gaze 9.
- **Rascal**, 61 turns: the action cast firebolt 35, SOCIAL FLAME 15; the bonus specials sharing 15.
- **Goose**, 42 turns: the action shoots 42; the bonus specials heart 4.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 5 (3 r) | 3 (2 r) | 7 (5 r) | 3 (3 r) | 45% |
| **Beholda** | 1 (3 r) | 0 (1 r) | 2 (4 r) | 4 (3 r) | 18% |
| **Rascal** | 0 (3 r) | 2 (1 r) | 6 (4 r) | 2 (3 r) | 25% |
| **Goose** | 0 (2 r) | 1 (2 r) | 3 (4 r) | 3 (3 r) | 18% |

On average HP, one on one: Denny 45%, Beholda 18%, Rascal 25%, Goose 18%.

## Level 2  (55 s)

The band: the Mascots won 4 of 20, the heroes 16, 5.5 rounds (on average HP: 6, the heroes 14).

In the band fights, a fight: Denny dealt 25, took 26, down 0.8, specials left 1.4 of 2 bonus / 0.0 of 1 action; Beholda dealt 16, took 23, down 0.9, specials left 0.8 of 2 bonus / 0.7 of 1 action; Rascal dealt 15, took 18, down 0.9, specials left 1.2 of 2 bonus / 0.1 of 1 action; Goose dealt 14, took 16, down 0.8, specials left 0.8 of 2 bonus / 1.0 of 1 action; Barley dealt 32, took 14, down 0.2; Aurdin dealt 16, took 21, down 1.6; Vivian dealt 7, took 13, down 0.5; Lymen dealt 17, took 10, down 0.2.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 82 turns: the action strikes 41, DENIM DAMAGE 40, nothing worth it: close in or ready 1; the bonus specials flurry 33, taunt 12.
- **Beholda**, 50 turns: the action strikes 33, nothing worth it: close in or ready 11, BALEFUL GAZE 6; the bonus specials gaze 25, eyeOnIt 3.
- **Rascal**, 84 turns: the action cast firebolt 64, SOCIAL FLAME 19, strikes 1; the bonus specials sharing 16.
- **Goose**, 80 turns: the action shoots 80; the bonus specials honk 36, heart 23.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 4 (4 r) | 10 (3 r) | 10 (4 r) | 5 (5 r) | 72% |
| **Beholda** | 0 (4 r) | 3 (3 r) | 10 (5 r) | 0 (5 r) | 32% |
| **Rascal** | 0 (4 r) | 5 (2 r) | 0 (20001 r) | 0 (7 r) | 12% |
| **Goose** | 0 (3 r) | 5 (5 r) | 4 (9 r) | 0 (2 r) | 22% |

On average HP, one on one: Denny 75%, Beholda 38%, Rascal 15%, Goose 28%.

## Level 3  (58 s)

The band: the Mascots won 5 of 20, the heroes 15, 7.8 rounds (on average HP: 9, the heroes 11).

In the band fights, a fight: Denny dealt 32, took 42, down 0.8, specials left 0.1 of 2 bonus / 0.2 of 2 action; Beholda dealt 18, took 34, down 0.9, specials left 0.5 of 2 bonus / 0.9 of 2 action; Rascal dealt 42, took 31, down 0.8, specials left 1.1 of 2 bonus / 0.1 of 2 action; Goose dealt 16, took 21, down 0.8, specials left 0.5 of 2 bonus / 1.8 of 2 action; Barley dealt 45, took 25, down 0.3; Aurdin dealt 30, took 33, down 1.6; Vivian dealt 13, took 19, down 0.5; Lymen dealt 30, took 22, down 0.2.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 113 turns: the action DENIM DAMAGE 67, strikes 46; the bonus specials flurry 40, taunt 37.
- **Beholda**, 72 turns: the action strikes 36, BALEFUL GAZE 13, nothing worth it: close in or ready 12, VNA BUBBLE 9; the bonus specials gaze 30, eyeOnIt 11.
- **Rascal**, 121 turns: the action cast firebolt 78, SOCIAL FLAME 39, strikes 4; the bonus specials sharing 18.
- **Goose**, 97 turns: the action shoots 92, GROUP HUG 4; the bonus specials honk 50, heart 31.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 7 (6 r) | 5 (4 r) | 10 (7 r) | 3 (6 r) | 62% |
| **Beholda** | 1 (5 r) | 1 (4 r) | 9 (7 r) | 1 (6 r) | 30% |
| **Rascal** | 0 (4 r) | 5 (3 r) | 0 (20001 r) | 0 (8 r) | 12% |
| **Goose** | 0 (4 r) | 2 (5 r) | 8 (17 r) | 0 (4 r) | 25% |

On average HP, one on one: Denny 60%, Beholda 38%, Rascal 15%, Goose 25%.

## Level 4  (61 s)

The band: the Mascots won 9 of 20, the heroes 11, 7.3 rounds (on average HP: 11, the heroes 9).

In the band fights, a fight: Denny dealt 38, took 60, down 0.6, specials left 0.2 of 3 bonus / 0.1 of 2 action; Beholda dealt 30, took 45, down 0.6, specials left 0.3 of 3 bonus / 0.6 of 2 action; Rascal dealt 55, took 29, down 0.6, specials left 1.9 of 3 bonus / 0.1 of 2 action; Goose dealt 23, took 29, down 0.7, specials left 0.9 of 3 bonus / 1.6 of 2 action; Barley dealt 60, took 40, down 0.5; Aurdin dealt 47, took 43, down 1.7; Vivian dealt 17, took 28, down 0.6; Lymen dealt 34, took 31, down 0.5.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 110 turns: the action DENIM DAMAGE 62, strikes 43, nothing worth it: close in or ready 3; the bonus specials taunt 56, flurry 27.
- **Beholda**, 89 turns: the action strikes 45, VNA BUBBLE 18, nothing worth it: close in or ready 15, BALEFUL GAZE 11; the bonus specials gaze 53, eyeOnIt 18.
- **Rascal**, 128 turns: the action cast firebolt 87, SOCIAL FLAME 38, strikes 2; the bonus specials sharing 22.
- **Goose**, 100 turns: the action shoots 90, GROUP HUG 7; the bonus specials honk 43, heart 42.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 4 (7 r) | 7 (4 r) | 9 (7 r) | 3 (8 r) | 58% |
| **Beholda** | 1 (6 r) | 7 (4 r) | 10 (5 r) | 0 (5 r) | 45% |
| **Rascal** | 0 (5 r) | 6 (4 r) | 0 (20001 r) | 0 (7 r) | 15% |
| **Goose** | 0 (5 r) | 8 (8 r) | 9 (21 r) | 0 (5 r) | 42% |

On average HP, one on one: Denny 75%, Beholda 52%, Rascal 20%, Goose 45%.

## Level 5  (55 s)

The band: the Mascots won 2 of 20, the heroes 18, 5.5 rounds (on average HP: 7, the heroes 13).

In the band fights, a fight: Denny dealt 8, took 77, down 0.9, specials left 2.0 of 3 bonus / 2.5 of 3 action; Beholda dealt 45, took 61, down 0.9, specials left 0.8 of 3 bonus / 0.9 of 3 action; Rascal dealt 61, took 52, down 0.9, specials left 2.0 of 3 bonus / 1.1 of 3 action; Goose dealt 15, took 52, down 0.9, specials left 0.9 of 3 bonus / 2.4 of 3 action; Barley dealt 87, took 34, down 0.3; Aurdin dealt 100, took 44, down 0.9; Vivian dealt 15, took 18, down 0.1; Lymen dealt 41, took 35, down 0.1.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 34 turns: the action DENIM DAMAGE 31, CANNONBALL 3; the bonus specials taunt 20, flurry 3.
- **Beholda**, 89 turns: the action strikes 30, VNA BUBBLE 19, THE BIG SCREEN 18, nothing worth it: close in or ready 12, BALEFUL GAZE 5; the bonus specials gaze 45, eyeOnIt 4.
- **Rascal**, 51 turns: the action SOCIAL FLAME 38, cast firebolt 13; the bonus specials sharing 19.
- **Goose**, 82 turns: the action shoots 68, GROUP HUG 10, FOUNTAIN 3; the bonus specials heart 41, honk 18.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 2 (4 r) | 7 (3 r) | 9 (9 r) | 0 (5 r) | 45% |
| **Beholda** | 0 (3 r) | 8 (2 r) | 9 (12 r) | 0 (3 r) | 42% |
| **Rascal** | 0 (4 r) | 4 (3 r) | 3 (10008 r) | 0 (9 r) | 18% |
| **Goose** | 0 (2 r) | 0 (4 r) | 1 (25 r) | 0 (2 r) | 2% |

On average HP, one on one: Denny 58%, Beholda 50%, Rascal 25%, Goose 8%.

## Level 6  (129 s)

The band: the Mascots won 11 of 20, the heroes 8, 875.8 rounds (on average HP: 12, the heroes 8).

In the band fights, a fight: Denny dealt 38, took 113, down 0.7, specials left 1.8 of 4 bonus / 1.1 of 3 action; Beholda dealt 77, took 54, down 0.5, specials left 0.9 of 4 bonus / 0.5 of 3 action; Rascal dealt 109, took 65, down 0.5, specials left 2.9 of 4 bonus / 0.3 of 3 action; Goose dealt 21, took 43, down 0.6, specials left 0.8 of 4 bonus / 1.9 of 3 action; Barley dealt 98, took 79, down 0.8; Aurdin dealt 99, took 65, down 1.9; Vivian dealt 20, took 46, down 0.8; Lymen dealt 67, took 66, down 0.7.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 70 turns: the action DENIM DAMAGE 49, CANNONBALL 10, strikes 6, nothing worth it: close in or ready 1; the bonus specials taunt 45, flurry 3.
- **Beholda**, 103 turns: the action strikes 34, THE BIG SCREEN 24, VNA BUBBLE 20, nothing worth it: close in or ready 14, BALEFUL GAZE 6; the bonus specials gaze 62, eyeOnIt 6.
- **Rascal**, 17480 turns: the action SOCIAL FLAME 52, cast firebolt 42, SOCIAL DISTANCING 2; the bonus specials sharing 22.
- **Goose**, 103 turns: the action shoots 77, GROUP HUG 17, FOUNTAIN 5; the bonus specials heart 63, honk 23.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 2 (4 r) | 7 (3 r) | 7 (10 r) | 1 (4 r) | 42% |
| **Beholda** | 0 (3 r) | 7 (2 r) | 10 (11 r) | 0 (4 r) | 42% |
| **Rascal** | 3 (4 r) | 4 (3 r) | 0 (20001 r) | 1 (9 r) | 20% |
| **Goose** | 0 (2 r) | 3 (6 r) | 0 (35 r) | 0 (3 r) | 8% |

On average HP, one on one: Denny 55%, Beholda 48%, Rascal 42%, Goose 25%.

## Level 7  (73 s)

The band: the Mascots won 6 of 20, the heroes 14, 7.2 rounds (on average HP: 14, the heroes 6).

In the band fights, a fight: Denny dealt 57, took 120, down 0.7, specials left 1.6 of 4 bonus / 1.6 of 4 action; Beholda dealt 55, took 74, down 0.7, specials left 0.4 of 4 bonus / 0.3 of 4 action; Rascal dealt 109, took 82, down 0.8, specials left 2.7 of 4 bonus / 0.8 of 4 action; Goose dealt 8, took 45, down 0.7, specials left 1.4 of 4 bonus / 1.7 of 4 action; Barley dealt 104, took 84, down 0.4; Aurdin dealt 142, took 59, down 0.9; Vivian dealt 21, took 34, down 0.3; Lymen dealt 65, took 63, down 0.3.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 93 turns: the action DENIM DAMAGE 45, strikes 19, CANNONBALL 13, LOBSTAH HUG 8, nothing worth it: close in or ready 2; the bonus specials taunt 47, flurry 19.
- **Beholda**, 128 turns: the action SPOTLIGHT 36, strikes 36, VNA BUBBLE 21, THE BIG SCREEN 11, nothing worth it: close in or ready 9, BALEFUL GAZE 5; the bonus specials gaze 72, eyeOnIt 17.
- **Rascal**, 96 turns: the action SOCIAL FLAME 33, GOING VIRAL 29, cast firebolt 24, SOCIAL DISTANCING 3; the bonus specials sharing 26.
- **Goose**, 107 turns: the action shoots 51, GROUP HUG 27, LIFELINE 10, FOUNTAIN 9; the bonus specials heart 51, honk 33.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 3 (5 r) | 10 (4 r) | 4 (10 r) | 0 (4 r) | 42% |
| **Beholda** | 0 (4 r) | 10 (3 r) | 9 (12 r) | 0 (4 r) | 48% |
| **Rascal** | 2 (6 r) | 1 (4 r) | 0 (20001 r) | 0 (10 r) | 8% |
| **Goose** | 0 (3 r) | 10 (3 r) | 0 (32 r) | 0 (2 r) | 25% |

On average HP, one on one: Denny 60%, Beholda 50%, Rascal 25%, Goose 32%.

## Level 8  (37 s)

The band: the Mascots won 13 of 20, the heroes 7, 8.5 rounds (on average HP: 20, the heroes 0).

In the band fights, a fight: Denny dealt 88, took 159, down 0.5, specials left 1.6 of 5 bonus / 0.7 of 4 action; Beholda dealt 82, took 61, down 0.3, specials left 0.2 of 5 bonus / 0.0 of 4 action; Rascal dealt 149, took 65, down 0.4, specials left 3.8 of 5 bonus / 0.3 of 4 action; Goose dealt 23, took 35, down 0.4, specials left 1.4 of 5 bonus / 1.4 of 4 action; Barley dealt 118, took 122, down 0.8; Aurdin dealt 102, took 85, down 1.9; Vivian dealt 39, took 58, down 0.7; Lymen dealt 74, took 89, down 0.7.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 132 turns: the action strikes 40, LOBSTAH HUG 35, DENIM DAMAGE 33, CANNONBALL 10, nothing worth it: close in or ready 7; the bonus specials taunt 69, flurry 30.
- **Beholda**, 158 turns: the action strikes 57, SPOTLIGHT 52, VNA BUBBLE 18, nothing worth it: close in or ready 13, THE BIG SCREEN 8, BALEFUL GAZE 2; the bonus specials gaze 95, eyeOnIt 25.
- **Rascal**, 127 turns: the action GOING VIRAL 48, cast firebolt 48, SOCIAL FLAME 23, SOCIAL DISTANCING 2; the bonus specials sharing 25.
- **Goose**, 138 turns: the action shoots 78, FOUNTAIN 21, GROUP HUG 20, LIFELINE 12; the bonus specials heart 71, honk 38.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 4 (5 r) | 10 (3 r) | 10 (9 r) | 0 (4 r) | 60% |
| **Beholda** | 0 (4 r) | 10 (3 r) | 10 (11 r) | 0 (4 r) | 50% |
| **Rascal** | 0 (5 r) | 0 (4 r) | 0 (10 r) | 0 (10 r) | 0% |
| **Goose** | 0 (5 r) | 10 (4 r) | 2 (44 r) | 0 (3 r) | 30% |

On average HP, one on one: Denny 72%, Beholda 50%, Rascal 25%, Goose 42%.

## Level 9  (33 s)

The band: the Mascots won 11 of 20, the heroes 9, 6.8 rounds (on average HP: 16, the heroes 4).

In the band fights, a fight: Denny dealt 69, took 131, down 0.5, specials left 2.7 of 5 bonus / 1.9 of 5 action; Beholda dealt 105, took 68, down 0.5, specials left 0.6 of 5 bonus / 0.2 of 5 action; Rascal dealt 176, took 78, down 0.5, specials left 3.9 of 5 bonus / 0.8 of 5 action; Goose dealt 13, took 52, down 0.5, specials left 2.7 of 5 bonus / 3.0 of 5 action; Barley dealt 98, took 130, down 0.7; Aurdin dealt 153, took 84, down 1.6; Vivian dealt 38, took 64, down 0.6; Lymen dealt 55, took 99, down 0.7.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 89 turns: the action LOBSTAH HUG 31, DENIM DAMAGE 27, CANNONBALL 13, strikes 13, nothing worth it: close in or ready 1; the bonus specials taunt 46, flurry 18.
- **Beholda**, 124 turns: the action SPOTLIGHT 45, THE BIG SCREEN 24, VNA BUBBLE 20, strikes 16, nothing worth it: close in or ready 10, BALEFUL GAZE 6; the bonus specials gaze 88, eyeOnIt 9.
- **Rascal**, 110 turns: the action GOING VIRAL 55, SOCIAL FLAME 21, cast firebolt 20, SOCIAL DISTANCING 9; the bonus specials sharing 23.
- **Goose**, 92 turns: the action shoots 50, GROUP HUG 26, FOUNTAIN 7, LIFELINE 6; the bonus specials heart 46, honk 24.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 6 (5 r) | 10 (3 r) | 8 (8 r) | 1 (6 r) | 62% |
| **Beholda** | 0 (4 r) | 9 (4 r) | 9 (11 r) | 0 (4 r) | 45% |
| **Rascal** | 8 (7 r) | 3 (4 r) | 0 (11 r) | 0 (12 r) | 28% |
| **Goose** | 0 (5 r) | 10 (5 r) | 0 (29 r) | 0 (2 r) | 25% |

On average HP, one on one: Denny 72%, Beholda 50%, Rascal 55%, Goose 28%.


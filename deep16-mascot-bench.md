---
layer: the Mascot bench (dev/bench_mascots.py; the MPMon lane §3.2; Griz, 10-07: *"Bench them vs the story party please"*). The four Mascots of deep16/js/mpmon.js (Denny, Beholda, Rascal, Goose) as a band against the four heroes (Barley, Aurdin, Vivian, Lymen) at the same level, and each one on one against each hero, levels 1-9, every side run by the class AI in headless Edge. 20 band fights a level, 10 a duel.
written: 2026-10-07 13:05Z by the Code tab (config claude-opus-5-5). Rerun: python dev/bench_mascots.py n=20 nd=10
reading: the band line is the Mascots' wins of 20 against the four (the rest the heroes', or neither), its rounds, and beside it the class bench's bands at that level (four of a class against the same four, of 10). Twice: the heroes as the ladder's fixture (max hit dice, their magic weapons from 5 -- as the class bench), then on the NPCs' average HP (avghp=1, even footing: the Mascots are NPCs and roll average). A duel cell is the Mascot's wins of 10 against that hero. What the actions went to (since 10-07, his worry that Beholda only Big-Screens after 5th): the class AI's pick for each Mascot's action, and the bonus specials as they fired, counted over the band fights. Estimates of the AI, not of the kits: a move the AI spends badly reads weak.
---

# The Mascot bench

## At a glance

| level | the band vs the four (fixture) | (average HP) | the class bands at that level, best and worst | Denny 1v1 | Beholda 1v1 | Rascal 1v1 | Goose 1v1 |
|---|---|---|---|---|---|---|---|
| 1 | **4 of 20** (4.5 rounds) | 4 of 20 | barbarian 10, warlock 2; median 7 | 45% | 18% | 25% | 18% |
| 2 | **0 of 20** (4.7 rounds) | 5 of 20 | barbarian 10, warlock 0; median 3 | 58% | 30% | 12% | 20% |
| 3 | **0 of 20** (6.3 rounds) | 4 of 20 | barbarian 10, warlock 0; median 6 | 50% | 22% | 10% | 12% |
| 4 | **2 of 20** (5.4 rounds) | 8 of 20 | bard 8, warlock 0; median 4 | 55% | 38% | 8% | 25% |
| 5 | **1 of 20** (3.3 rounds) | 1 of 20 | wizard 9, rogue 0; median 3 | 25% | 30% | 10% | 0% |
| 6 | **3 of 20** (5.3 rounds) | 4 of 20 | sorcerer 10, rogue 0; median 1 | 35% | 25% | 8% | 2% |
| 7 | **3 of 20** (5.2 rounds) | 10 of 20 | sorcerer 5, rogue 0; median 2 | 28% | 40% | 5% | 20% |
| 8 | **5 of 20** (5.9 rounds) | 12 of 20 | barbarian 6, rogue 0; median 2 | 48% | 48% | 0% | 20% |
| 9 | **3 of 20** (5.9 rounds) | 10 of 20 | sorcerer 10, warlock 0; median 1 | 45% | 38% | 22% | 25% |

## What the actions went to (the band fights, fixture; the three most of each one's actions, by share)

| level | Denny | Beholda | Rascal | Goose |
|---|---|---|---|---|
| 1 | DENIM DAMAGE 62%, strikes 36%, nothing worth it: close in or ready 2% | strikes 58%, nothing worth it: close in or ready 38%, VNA BUBBLE 4% | cast firebolt 71%, SOCIAL FLAME 29% | shoots 100% |
| 2 | DENIM DAMAGE 63%, strikes 37% | strikes 73%, nothing worth it: close in or ready 27% | cast firebolt 66%, SOCIAL FLAME 29%, strikes 5% | shoots 98%, GROUP HUG 2% |
| 3 | DENIM DAMAGE 66%, strikes 34% | strikes 68%, nothing worth it: close in or ready 21%, VNA BUBBLE 11% | cast firebolt 58%, SOCIAL FLAME 40%, strikes 2% | shoots 97%, GROUP HUG 3% |
| 4 | DENIM DAMAGE 79%, strikes 20%, nothing worth it: close in or ready 1% | strikes 61%, nothing worth it: close in or ready 27%, VNA BUBBLE 11% | cast firebolt 55%, SOCIAL FLAME 44%, strikes 1% | shoots 98%, GROUP HUG 2% |
| 5 | DENIM DAMAGE 92%, CANNONBALL 8% | strikes 40%, VNA BUBBLE 26%, BIG SCREEN 17% | SOCIAL FLAME 75%, cast firebolt 22%, SOCIAL DISTANCING 3% | shoots 90%, GROUP HUG 6%, FOUNTAIN 4% |
| 6 | DENIM DAMAGE 89%, CANNONBALL 9%, strikes 3% | strikes 43%, BIG SCREEN 23%, VNA BUBBLE 22% | SOCIAL FLAME 78%, cast firebolt 22% | shoots 81%, GROUP HUG 14%, FOUNTAIN 5% |
| 7 | DENIM DAMAGE 61%, CANNONBALL 14%, LOBSTAH HUG 14% | SPOTLIGHT 36%, strikes 24%, BIG SCREEN 19% | SOCIAL FLAME 49%, GOING VIRAL 28%, cast firebolt 16% | shoots 60%, GROUP HUG 17%, LIFELINE 13% |
| 8 | LOBSTAH HUG 40%, DENIM DAMAGE 30%, strikes 16% | SPOTLIGHT 35%, strikes 25%, VNA BUBBLE 18% | GOING VIRAL 44%, SOCIAL FLAME 38%, cast firebolt 18% | shoots 68%, GROUP HUG 16%, LIFELINE 10% |
| 9 | LOBSTAH HUG 61%, DENIM DAMAGE 27%, CANNONBALL 8% | SPOTLIGHT 33%, BIG SCREEN 24%, strikes 22% | GOING VIRAL 49%, SOCIAL FLAME 33%, cast firebolt 13% | shoots 56%, GROUP HUG 33%, LIFELINE 7% |

## Level 1  (24 s)

The band: the Mascots won 4 of 20, the heroes 16, 4.5 rounds (on average HP: 4, the heroes 16).

In the band fights, a fight: Denny dealt 7, took 12, down 0.8, specials left 0.8 of 1 bonus / 0.2 of 1 action; Beholda dealt 7, took 10, down 0.9, specials left 0.5 of 1 bonus / 0.9 of 1 action; Rascal dealt 7, took 7, down 0.8, specials left 0.2 of 1 bonus / 0.2 of 1 action; Goose dealt 6, took 9, down 0.9, specials left 0.8 of 1 bonus / 1.0 of 1 action; Barley dealt 14, took 6, down 0.3; Aurdin dealt 5, took 7, down 1.0; Vivian dealt 3, took 5, down 0.5; Lymen dealt 12, took 5, down 0.3.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 60 turns: the action DENIM DAMAGE 35, strikes 20, nothing worth it: close in or ready 1; the bonus specials taunt 3.
- **Beholda**, 32 turns: the action strikes 15, nothing worth it: close in or ready 10, VNA BUBBLE 1; the bonus specials gaze 10.
- **Rascal**, 63 turns: the action cast firebolt 37, SOCIAL FLAME 15; the bonus specials sharing 15.
- **Goose**, 42 turns: the action shoots 42; the bonus specials heart 4.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 5 (3 r) | 3 (2 r) | 7 (5 r) | 3 (3 r) | 45% |
| **Beholda** | 1 (3 r) | 0 (1 r) | 2 (4 r) | 4 (3 r) | 18% |
| **Rascal** | 0 (3 r) | 2 (1 r) | 6 (4 r) | 2 (3 r) | 25% |
| **Goose** | 0 (2 r) | 1 (2 r) | 3 (4 r) | 3 (3 r) | 18% |

On average HP, one on one: Denny 45%, Beholda 18%, Rascal 25%, Goose 18%.

## Level 2  (100 s)

The band: the Mascots won 0 of 20, the heroes 20, 4.7 rounds (on average HP: 5, the heroes 15).

In the band fights, a fight: Denny dealt 13, took 24, down 1.0, specials left 1.4 of 2 bonus / 0.1 of 1 action; Beholda dealt 14, took 18, down 1.0, specials left 0.8 of 2 bonus / 1.0 of 1 action; Rascal dealt 11, took 16, down 1.0, specials left 1.2 of 2 bonus / 0.2 of 1 action; Goose dealt 11, took 15, down 1.0, specials left 1.2 of 2 bonus / 0.9 of 1 action; Barley dealt 29, took 10, down 0.1; Aurdin dealt 17, took 19, down 1.4; Vivian dealt 8, took 10, down 0.2; Lymen dealt 12, took 5, down 0.0.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 62 turns: the action DENIM DAMAGE 39, strikes 23; the bonus specials flurry 26, taunt 11.
- **Beholda**, 41 turns: the action strikes 30, nothing worth it: close in or ready 11; the bonus specials gaze 24, eyeOnIt 2.
- **Rascal**, 56 turns: the action cast firebolt 37, SOCIAL FLAME 16, strikes 3; the bonus specials sharing 15.
- **Goose**, 62 turns: the action shoots 61, GROUP HUG 1; the bonus specials honk 30, heart 15.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 4 (4 r) | 6 (2 r) | 10 (4 r) | 3 (4 r) | 58% |
| **Beholda** | 1 (4 r) | 1 (3 r) | 10 (5 r) | 0 (3 r) | 30% |
| **Rascal** | 0 (3 r) | 5 (2 r) | 0 (20001 r) | 0 (6 r) | 12% |
| **Goose** | 0 (2 r) | 2 (3 r) | 6 (9 r) | 0 (4 r) | 20% |

On average HP, one on one: Denny 60%, Beholda 38%, Rascal 15%, Goose 22%.

## Level 3  (55 s)

The band: the Mascots won 0 of 20, the heroes 20, 6.3 rounds (on average HP: 4, the heroes 16).

In the band fights, a fight: Denny dealt 21, took 36, down 1.0, specials left 0.8 of 2 bonus / 0.3 of 2 action; Beholda dealt 16, took 28, down 1.0, specials left 0.7 of 2 bonus / 1.7 of 2 action; Rascal dealt 33, took 26, down 1.0, specials left 1.2 of 2 bonus / 0.2 of 2 action; Goose dealt 13, took 21, down 1.0, specials left 0.5 of 2 bonus / 1.9 of 2 action; Barley dealt 38, took 16, down 0.1; Aurdin dealt 32, took 31, down 1.5; Vivian dealt 12, took 14, down 0.4; Lymen dealt 24, took 17, down 0.0.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 86 turns: the action DENIM DAMAGE 57, strikes 29; the bonus specials flurry 38, taunt 24.
- **Beholda**, 56 turns: the action strikes 36, nothing worth it: close in or ready 11, VNA BUBBLE 6; the bonus specials gaze 26, eyeOnIt 7.
- **Rascal**, 90 turns: the action cast firebolt 52, SOCIAL FLAME 36, strikes 2; the bonus specials sharing 16.
- **Goose**, 76 turns: the action shoots 74, GROUP HUG 2; the bonus specials honk 31, heart 30.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 5 (5 r) | 2 (4 r) | 10 (6 r) | 3 (5 r) | 50% |
| **Beholda** | 1 (4 r) | 0 (5 r) | 8 (7 r) | 0 (4 r) | 22% |
| **Rascal** | 0 (4 r) | 4 (2 r) | 0 (20001 r) | 0 (8 r) | 10% |
| **Goose** | 0 (3 r) | 0 (4 r) | 5 (13 r) | 0 (2 r) | 12% |

On average HP, one on one: Denny 55%, Beholda 30%, Rascal 15%, Goose 12%.

## Level 4  (56 s)

The band: the Mascots won 2 of 20, the heroes 18, 5.4 rounds (on average HP: 8, the heroes 12).

In the band fights, a fight: Denny dealt 24, took 48, down 0.9, specials left 2.3 of 3 bonus / 0.3 of 2 action; Beholda dealt 19, took 33, down 0.9, specials left 1.1 of 3 bonus / 1.8 of 2 action; Rascal dealt 43, took 28, down 0.9, specials left 2.1 of 3 bonus / 0.1 of 2 action; Goose dealt 11, took 26, down 0.9, specials left 1.4 of 3 bonus / 1.9 of 2 action; Barley dealt 46, took 21, down 0.1; Aurdin dealt 47, took 39, down 1.1; Vivian dealt 12, took 11, down 0.1; Lymen dealt 25, took 21, down 0.1.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 71 turns: the action DENIM DAMAGE 56, strikes 14, nothing worth it: close in or ready 1; the bonus specials flurry 36, taunt 14.
- **Beholda**, 46 turns: the action strikes 27, nothing worth it: close in or ready 12, VNA BUBBLE 5; the bonus specials gaze 37, eyeOnIt 2.
- **Rascal**, 86 turns: the action cast firebolt 47, SOCIAL FLAME 37, strikes 1; the bonus specials sharing 18.
- **Goose**, 67 turns: the action shoots 65, GROUP HUG 1; the bonus specials heart 31, honk 23.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 3 (5 r) | 5 (4 r) | 10 (7 r) | 4 (6 r) | 55% |
| **Beholda** | 0 (4 r) | 5 (3 r) | 10 (5 r) | 0 (4 r) | 38% |
| **Rascal** | 0 (4 r) | 3 (2 r) | 0 (20001 r) | 0 (6 r) | 8% |
| **Goose** | 0 (3 r) | 2 (4 r) | 8 (18 r) | 0 (3 r) | 25% |

On average HP, one on one: Denny 62%, Beholda 42%, Rascal 15%, Goose 30%.

## Level 5  (38 s)

The band: the Mascots won 1 of 20, the heroes 19, 3.3 rounds (on average HP: 1, the heroes 19).

In the band fights, a fight: Denny dealt 3, took 54, down 1.0, specials left 2.5 of 3 bonus / 2.9 of 3 action; Beholda dealt 26, took 44, down 0.9, specials left 1.3 of 3 bonus / 2.0 of 3 action; Rascal dealt 43, took 35, down 0.9, specials left 2.2 of 3 bonus / 1.6 of 3 action; Goose dealt 9, took 31, down 0.9, specials left 2.0 of 3 bonus / 2.8 of 3 action; Barley dealt 54, took 23, down 0.1; Aurdin dealt 79, took 29, down 0.4; Vivian dealt 6, took 9, down 0.1; Lymen dealt 26, took 21, down 0.1.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 24 turns: the action DENIM DAMAGE 22, CANNONBALL 2; the bonus specials taunt 9, flurry 1.
- **Beholda**, 47 turns: the action strikes 19, VNA BUBBLE 12, THE BIG SCREEN 8, nothing worth it: close in or ready 8; the bonus specials gaze 34.
- **Rascal**, 36 turns: the action SOCIAL FLAME 27, cast firebolt 8, SOCIAL DISTANCING 1; the bonus specials sharing 15.
- **Goose**, 48 turns: the action shoots 43, GROUP HUG 3, FOUNTAIN 2; the bonus specials heart 19, honk 10.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 2 (3 r) | 5 (2 r) | 3 (8 r) | 0 (3 r) | 25% |
| **Beholda** | 0 (2 r) | 7 (2 r) | 5 (11 r) | 0 (2 r) | 30% |
| **Rascal** | 0 (3 r) | 1 (2 r) | 3 (10008 r) | 0 (9 r) | 10% |
| **Goose** | 0 (2 r) | 0 (2 r) | 0 (20 r) | 0 (2 r) | 0% |

On average HP, one on one: Denny 40%, Beholda 42%, Rascal 18%, Goose 5%.

## Level 6  (54 s)

The band: the Mascots won 3 of 20, the heroes 17, 5.3 rounds (on average HP: 4, the heroes 16).

In the band fights, a fight: Denny dealt 16, took 71, down 0.9, specials left 3.1 of 4 bonus / 2.4 of 3 action; Beholda dealt 53, took 56, down 0.9, specials left 1.4 of 4 bonus / 1.2 of 3 action; Rascal dealt 70, took 46, down 0.9, specials left 3.0 of 4 bonus / 1.1 of 3 action; Goose dealt 16, took 51, down 0.9, specials left 2.2 of 4 bonus / 2.3 of 3 action; Barley dealt 89, took 48, down 0.3; Aurdin dealt 84, took 53, down 1.1; Vivian dealt 15, took 22, down 0.2; Lymen dealt 47, took 42, down 0.1.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 35 turns: the action DENIM DAMAGE 31, CANNONBALL 3, strikes 1; the bonus specials taunt 17, flurry 4.
- **Beholda**, 80 turns: the action strikes 33, THE BIG SCREEN 18, VNA BUBBLE 17, nothing worth it: close in or ready 9; the bonus specials gaze 53, eyeOnIt 2.
- **Rascal**, 51 turns: the action SOCIAL FLAME 39, cast firebolt 11; the bonus specials sharing 19.
- **Goose**, 75 turns: the action shoots 59, GROUP HUG 10, FOUNTAIN 4; the bonus specials heart 35, honk 20.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 2 (3 r) | 6 (3 r) | 6 (8 r) | 0 (2 r) | 35% |
| **Beholda** | 0 (2 r) | 4 (2 r) | 6 (13 r) | 0 (3 r) | 25% |
| **Rascal** | 1 (4 r) | 1 (2 r) | 0 (20001 r) | 1 (8 r) | 8% |
| **Goose** | 0 (2 r) | 1 (4 r) | 0 (24 r) | 0 (2 r) | 2% |

On average HP, one on one: Denny 48%, Beholda 40%, Rascal 35%, Goose 10%.

## Level 7  (57 s)

The band: the Mascots won 3 of 20, the heroes 17, 5.2 rounds (on average HP: 10, the heroes 10).

In the band fights, a fight: Denny dealt 32, took 82, down 0.8, specials left 3.5 of 4 bonus / 2.1 of 4 action; Beholda dealt 57, took 59, down 0.8, specials left 0.8 of 4 bonus / 1.0 of 4 action; Rascal dealt 82, took 60, down 0.9, specials left 3.0 of 4 bonus / 1.5 of 4 action; Goose dealt 8, took 37, down 0.7, specials left 2.0 of 4 bonus / 2.6 of 4 action; Barley dealt 88, took 64, down 0.1; Aurdin dealt 111, took 59, down 0.7; Vivian dealt 14, took 21, down 0.1; Lymen dealt 36, took 45, down 0.2.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 52 turns: the action DENIM DAMAGE 31, CANNONBALL 7, LOBSTAH HUG 7, strikes 6; the bonus specials flurry 18, taunt 11.
- **Beholda**, 89 turns: the action SPOTLIGHT 31, strikes 21, THE BIG SCREEN 16, VNA BUBBLE 13, nothing worth it: close in or ready 5; the bonus specials gaze 63, eyeOnIt 5.
- **Rascal**, 61 turns: the action SOCIAL FLAME 30, GOING VIRAL 17, cast firebolt 10, SOCIAL DISTANCING 3, strikes 1; the bonus specials sharing 21.
- **Goose**, 72 turns: the action shoots 42, GROUP HUG 12, LIFELINE 9, FOUNTAIN 7; the bonus specials heart 40, honk 13.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 2 (4 r) | 6 (4 r) | 3 (10 r) | 0 (3 r) | 28% |
| **Beholda** | 0 (3 r) | 9 (3 r) | 7 (15 r) | 0 (4 r) | 40% |
| **Rascal** | 1 (5 r) | 1 (3 r) | 0 (20001 r) | 0 (10 r) | 5% |
| **Goose** | 0 (2 r) | 8 (3 r) | 0 (18 r) | 0 (2 r) | 20% |

On average HP, one on one: Denny 50%, Beholda 45%, Rascal 18%, Goose 20%.

## Level 8  (24 s)

The band: the Mascots won 5 of 20, the heroes 15, 5.9 rounds (on average HP: 12, the heroes 8).

In the band fights, a fight: Denny dealt 45, took 105, down 0.8, specials left 4.2 of 5 bonus / 2.0 of 4 action; Beholda dealt 83, took 68, down 0.8, specials left 0.8 of 5 bonus / 0.4 of 4 action; Rascal dealt 116, took 62, down 0.8, specials left 4.0 of 5 bonus / 1.1 of 4 action; Goose dealt 20, took 42, down 0.7, specials left 2.7 of 5 bonus / 2.7 of 4 action; Barley dealt 100, took 92, down 0.4; Aurdin dealt 116, took 72, down 1.1; Vivian dealt 21, took 32, down 0.3; Lymen dealt 45, took 73, down 0.3.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 63 turns: the action LOBSTAH HUG 25, DENIM DAMAGE 19, strikes 10, CANNONBALL 7, nothing worth it: close in or ready 2; the bonus specials flurry 20, taunt 16.
- **Beholda**, 107 turns: the action SPOTLIGHT 37, strikes 26, VNA BUBBLE 19, THE BIG SCREEN 16, nothing worth it: close in or ready 8; the bonus specials gaze 83, eyeOnIt 6.
- **Rascal**, 71 turns: the action GOING VIRAL 31, SOCIAL FLAME 27, cast firebolt 13; the bonus specials sharing 19.
- **Goose**, 83 turns: the action shoots 56, GROUP HUG 13, LIFELINE 8, FOUNTAIN 5; the bonus specials heart 46, honk 14.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 1 (4 r) | 10 (3 r) | 8 (8 r) | 0 (3 r) | 48% |
| **Beholda** | 0 (3 r) | 10 (3 r) | 9 (11 r) | 0 (4 r) | 48% |
| **Rascal** | 0 (4 r) | 0 (4 r) | 0 (7 r) | 0 (10 r) | 0% |
| **Goose** | 0 (4 r) | 8 (4 r) | 0 (35 r) | 0 (2 r) | 20% |

On average HP, one on one: Denny 60%, Beholda 50%, Rascal 22%, Goose 30%.

## Level 9  (23 s)

The band: the Mascots won 3 of 20, the heroes 17, 5.9 rounds (on average HP: 10, the heroes 10).

In the band fights, a fight: Denny dealt 35, took 125, down 0.9, specials left 4.5 of 5 bonus / 3.0 of 5 action; Beholda dealt 96, took 98, down 0.8, specials left 1.1 of 5 bonus / 1.1 of 5 action; Rascal dealt 117, took 77, down 0.8, specials left 4.0 of 5 bonus / 2.1 of 5 action; Goose dealt 12, took 63, down 0.8, specials left 2.6 of 5 bonus / 3.5 of 5 action; Barley dealt 112, took 91, down 0.5; Aurdin dealt 181, took 71, down 0.9; Vivian dealt 29, took 31, down 0.2; Lymen dealt 50, took 75, down 0.2.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 53 turns: the action LOBSTAH HUG 31, DENIM DAMAGE 14, CANNONBALL 4, strikes 2; the bonus specials flurry 12, taunt 10.
- **Beholda**, 105 turns: the action SPOTLIGHT 34, THE BIG SCREEN 25, strikes 23, VNA BUBBLE 18, nothing worth it: close in or ready 3; the bonus specials gaze 77, eyeOnIt 4.
- **Rascal**, 69 turns: the action GOING VIRAL 33, SOCIAL FLAME 22, cast firebolt 9, SOCIAL DISTANCING 3; the bonus specials sharing 21.
- **Goose**, 71 turns: the action shoots 39, GROUP HUG 23, LIFELINE 5, FOUNTAIN 3; the bonus specials heart 47, honk 10.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 1 (4 r) | 10 (3 r) | 6 (8 r) | 1 (4 r) | 45% |
| **Beholda** | 0 (3 r) | 7 (4 r) | 8 (12 r) | 0 (3 r) | 38% |
| **Rascal** | 7 (6 r) | 2 (4 r) | 0 (8 r) | 0 (12 r) | 22% |
| **Goose** | 0 (3 r) | 10 (5 r) | 0 (22 r) | 0 (2 r) | 25% |

On average HP, one on one: Denny 62%, Beholda 42%, Rascal 42%, Goose 25%.


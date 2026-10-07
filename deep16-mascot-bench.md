---
layer: the Mascot bench (dev/bench_mascots.py; the MPMon lane §3.2; Griz, 10-07: *"Bench them vs the story party please"*). The four Mascots of deep16/js/mpmon.js (Denny, Beholda, Rascal, Goose) as a band against the four heroes (Barley, Aurdin, Vivian, Lymen) at the same level, and each one on one against each hero, levels 1-9, every side run by the class AI in headless Edge. 20 band fights a level, 10 a duel.
written: 2026-10-07 14:26Z by the Code tab (config claude-opus-5-5). Rerun: python dev/bench_mascots.py n=20 nd=10
reading: the band line is the Mascots' wins of 20 against the four (the rest the heroes', or neither), its rounds, and beside it the class bench's bands at that level (four of a class against the same four, of 10). Twice: the heroes as the ladder's fixture (max hit dice, their magic weapons from 5 -- as the class bench), then on the NPCs' average HP (avghp=1, even footing: the Mascots are NPCs and roll average). A duel cell is the Mascot's wins of 10 against that hero. What the actions went to (since 10-07, his worry that Beholda only Big-Screens after 5th): the class AI's pick for each Mascot's action, and the bonus specials as they fired, counted over the band fights. Estimates of the AI, not of the kits: a move the AI spends badly reads weak.
---

# The Mascot bench

## At a glance

| level | the band vs the four (fixture) | (average HP) | the class bands at that level, best and worst | Denny 1v1 | Beholda 1v1 | Rascal 1v1 | Goose 1v1 |
|---|---|---|---|---|---|---|---|
| 1 | **4 of 20** (4.5 rounds) | 4 of 20 | barbarian 10, warlock 2; median 7 | 45% | 18% | 25% | 18% |
| 2 | **0 of 20** (4.7 rounds) | 5 of 20 | barbarian 10, warlock 0; median 3 | 58% | 30% | 12% | 20% |
| 3 | **1 of 20** (5.9 rounds) | 9 of 20 | barbarian 10, warlock 0; median 6 | 45% | 22% | 10% | 12% |
| 4 | **3 of 20** (5.7 rounds) | 6 of 20 | bard 8, warlock 0; median 4 | 40% | 38% | 8% | 25% |
| 5 | **1 of 20** (872.3 rounds) | 1 of 20 | wizard 9, rogue 0; median 3 | 30% | 30% | 10% | 0% |
| 6 | **4 of 20** (5.3 rounds) | 7 of 20 | sorcerer 10, rogue 0; median 1 | 25% | 25% | 8% | 2% |
| 7 | **5 of 20** (5.7 rounds) | 7 of 20 | sorcerer 5, rogue 0; median 2 | 28% | 40% | 5% | 20% |
| 8 | **8 of 20** (6.7 rounds) | 15 of 20 | barbarian 6, rogue 0; median 2 | 58% | 48% | 0% | 20% |
| 9 | **7 of 20** (6.5 rounds) | 13 of 20 | sorcerer 10, warlock 0; median 1 | 55% | 38% | 22% | 25% |

## What the actions went to (the band fights, fixture; the three most of each one's actions, by share)

| level | Denny | Beholda | Rascal | Goose |
|---|---|---|---|---|
| 1 | DENIM DAMAGE 62%, strikes 36%, nothing worth it: close in or ready 2% | strikes 58%, nothing worth it: close in or ready 38%, VNA BUBBLE 4% | cast firebolt 71%, SOCIAL FLAME 29% | shoots 100% |
| 2 | DENIM DAMAGE 63%, strikes 37% | strikes 73%, nothing worth it: close in or ready 27% | cast firebolt 66%, SOCIAL FLAME 29%, strikes 5% | shoots 98%, GROUP HUG 2% |
| 3 | DENIM DAMAGE 66%, strikes 34% | strikes 64%, nothing worth it: close in or ready 23%, VNA BUBBLE 13% | cast firebolt 59%, SOCIAL FLAME 41% | shoots 97%, GROUP HUG 3% |
| 4 | DENIM DAMAGE 73%, strikes 26%, nothing worth it: close in or ready 1% | strikes 59%, nothing worth it: close in or ready 27%, VNA BUBBLE 14% | cast firebolt 58%, SOCIAL FLAME 41%, strikes 1% | shoots 99%, GROUP HUG 1% |
| 5 | DENIM DAMAGE 92%, CANNONBALL 8% | strikes 37%, VNA BUBBLE 28%, BIG SCREEN 17% | SOCIAL FLAME 71%, cast firebolt 26%, SOCIAL DISTANCING 3% | shoots 92%, FOUNTAIN 4%, GROUP HUG 4% |
| 6 | DENIM DAMAGE 73%, CANNONBALL 18%, strikes 9% | strikes 43%, VNA BUBBLE 23%, BIG SCREEN 22% | SOCIAL FLAME 79%, cast firebolt 21% | shoots 81%, GROUP HUG 12%, FOUNTAIN 6% |
| 7 | DENIM DAMAGE 58%, CANNONBALL 17%, strikes 15% | SPOTLIGHT 39%, strikes 23%, VNA BUBBLE 19% | SOCIAL FLAME 42%, GOING VIRAL 31%, cast firebolt 24% | shoots 60%, GROUP HUG 22%, LIFELINE 13% |
| 8 | LOBSTAH HUG 44%, DENIM DAMAGE 38%, CANNONBALL 10% | SPOTLIGHT 33%, strikes 31%, VNA BUBBLE 17% | GOING VIRAL 42%, cast firebolt 33%, SOCIAL FLAME 24% | shoots 61%, GROUP HUG 15%, LIFELINE 14% |
| 9 | LOBSTAH HUG 48%, DENIM DAMAGE 24%, CANNONBALL 17% | SPOTLIGHT 37%, strikes 27%, BIG SCREEN 19% | GOING VIRAL 48%, SOCIAL FLAME 28%, cast firebolt 20% | shoots 61%, GROUP HUG 29%, LIFELINE 6% |

## Level 1  (19 s)

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

## Level 2  (68 s)

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

## Level 3  (75 s)

The band: the Mascots won 1 of 20, the heroes 19, 5.9 rounds (on average HP: 9, the heroes 11).

In the band fights, a fight: Denny dealt 24, took 34, down 0.9, specials left 0.2 of 2 bonus / 0.1 of 2 action; Beholda dealt 15, took 28, down 1.0, specials left 0.6 of 2 bonus / 1.7 of 2 action; Rascal dealt 32, took 26, down 0.9, specials left 1.2 of 2 bonus / 0.2 of 2 action; Goose dealt 13, took 21, down 1.0, specials left 0.5 of 2 bonus / 1.9 of 2 action; Barley dealt 37, took 16, down 0.1; Aurdin dealt 35, took 32, down 1.6; Vivian dealt 10, took 12, down 0.2; Lymen dealt 19, took 17, down 0.1.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 89 turns: the action DENIM DAMAGE 59, strikes 30; the bonus specials taunt 35, flurry 31.
- **Beholda**, 50 turns: the action strikes 30, nothing worth it: close in or ready 11, VNA BUBBLE 6; the bonus specials gaze 28, eyeOnIt 5.
- **Rascal**, 87 turns: the action cast firebolt 51, SOCIAL FLAME 36; the bonus specials sharing 16.
- **Goose**, 79 turns: the action shoots 77, GROUP HUG 2; the bonus specials honk 33, heart 30.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 4 (5 r) | 2 (4 r) | 9 (7 r) | 3 (5 r) | 45% |
| **Beholda** | 1 (4 r) | 0 (5 r) | 8 (7 r) | 0 (4 r) | 22% |
| **Rascal** | 0 (4 r) | 4 (2 r) | 0 (20001 r) | 0 (8 r) | 10% |
| **Goose** | 0 (3 r) | 0 (4 r) | 5 (13 r) | 0 (2 r) | 12% |

On average HP, one on one: Denny 50%, Beholda 30%, Rascal 15%, Goose 12%.

## Level 4  (56 s)

The band: the Mascots won 3 of 20, the heroes 17, 5.7 rounds (on average HP: 6, the heroes 14).

In the band fights, a fight: Denny dealt 22, took 47, down 0.9, specials left 1.1 of 3 bonus / 0.3 of 2 action; Beholda dealt 18, took 33, down 0.9, specials left 1.2 of 3 bonus / 1.7 of 2 action; Rascal dealt 47, took 27, down 0.8, specials left 2.0 of 3 bonus / 0.1 of 2 action; Goose dealt 15, took 26, down 0.8, specials left 1.5 of 3 bonus / 1.9 of 2 action; Barley dealt 44, took 22, down 0.1; Aurdin dealt 46, took 37, down 1.2; Vivian dealt 10, took 12, down 0.2; Lymen dealt 25, took 24, down 0.1.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 76 turns: the action DENIM DAMAGE 54, strikes 19, nothing worth it: close in or ready 1; the bonus specials taunt 38, flurry 17.
- **Beholda**, 46 turns: the action strikes 26, nothing worth it: close in or ready 12, VNA BUBBLE 6; the bonus specials gaze 36, eyeOnIt 3.
- **Rascal**, 92 turns: the action cast firebolt 53, SOCIAL FLAME 37, strikes 1; the bonus specials sharing 19.
- **Goose**, 73 turns: the action shoots 71, GROUP HUG 1; the bonus specials heart 30, honk 28.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 2 (6 r) | 4 (4 r) | 9 (7 r) | 1 (7 r) | 40% |
| **Beholda** | 0 (4 r) | 5 (3 r) | 10 (5 r) | 0 (4 r) | 38% |
| **Rascal** | 0 (4 r) | 3 (2 r) | 0 (20001 r) | 0 (6 r) | 8% |
| **Goose** | 0 (3 r) | 2 (4 r) | 8 (18 r) | 0 (3 r) | 25% |

On average HP, one on one: Denny 50%, Beholda 42%, Rascal 15%, Goose 30%.

## Level 5  (76 s)

The band: the Mascots won 1 of 20, the heroes 18, 872.3 rounds (on average HP: 1, the heroes 19).

In the band fights, a fight: Denny dealt 3, took 54, down 1.0, specials left 2.5 of 3 bonus / 2.9 of 3 action; Beholda dealt 26, took 44, down 0.9, specials left 1.3 of 3 bonus / 1.9 of 3 action; Rascal dealt 41, took 33, down 0.9, specials left 2.2 of 3 bonus / 1.7 of 3 action; Goose dealt 8, took 30, down 0.9, specials left 2.0 of 3 bonus / 2.8 of 3 action; Barley dealt 54, took 23, down 0.1; Aurdin dealt 77, took 27, down 0.3; Vivian dealt 7, took 10, down 0.1; Lymen dealt 25, took 20, down 0.1.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 24 turns: the action DENIM DAMAGE 22, CANNONBALL 2; the bonus specials taunt 9, flurry 1.
- **Beholda**, 46 turns: the action strikes 17, VNA BUBBLE 13, THE BIG SCREEN 8, nothing worth it: close in or ready 8; the bonus specials gaze 34, eyeOnIt 1.
- **Rascal**, 17414 turns: the action SOCIAL FLAME 25, cast firebolt 9, SOCIAL DISTANCING 1; the bonus specials sharing 15.
- **Goose**, 48 turns: the action shoots 44, FOUNTAIN 2, GROUP HUG 2; the bonus specials heart 19, honk 11.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 2 (3 r) | 5 (2 r) | 5 (8 r) | 0 (4 r) | 30% |
| **Beholda** | 0 (2 r) | 7 (2 r) | 5 (11 r) | 0 (2 r) | 30% |
| **Rascal** | 0 (3 r) | 1 (2 r) | 3 (10008 r) | 0 (9 r) | 10% |
| **Goose** | 0 (2 r) | 0 (2 r) | 0 (20 r) | 0 (2 r) | 0% |

On average HP, one on one: Denny 42%, Beholda 42%, Rascal 18%, Goose 5%.

## Level 6  (57 s)

The band: the Mascots won 4 of 20, the heroes 16, 5.3 rounds (on average HP: 7, the heroes 13).

In the band fights, a fight: Denny dealt 23, took 75, down 0.9, specials left 2.6 of 4 bonus / 2.1 of 3 action; Beholda dealt 55, took 55, down 0.8, specials left 1.4 of 4 bonus / 1.1 of 3 action; Rascal dealt 75, took 50, down 0.9, specials left 3.1 of 4 bonus / 0.8 of 3 action; Goose dealt 16, took 49, down 0.9, specials left 1.9 of 4 bonus / 2.2 of 3 action; Barley dealt 93, took 52, down 0.2; Aurdin dealt 86, took 58, down 1.2; Vivian dealt 13, took 25, down 0.2; Lymen dealt 47, took 45, down 0.2.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 44 turns: the action DENIM DAMAGE 32, CANNONBALL 8, strikes 4; the bonus specials taunt 28, flurry 3.
- **Beholda**, 84 turns: the action strikes 36, VNA BUBBLE 19, THE BIG SCREEN 18, nothing worth it: close in or ready 10; the bonus specials gaze 53, eyeOnIt 4.
- **Rascal**, 56 turns: the action SOCIAL FLAME 44, cast firebolt 12; the bonus specials sharing 17.
- **Goose**, 81 turns: the action shoots 66, GROUP HUG 10, FOUNTAIN 5; the bonus specials heart 43, honk 19.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 0 (4 r) | 6 (3 r) | 4 (9 r) | 0 (3 r) | 25% |
| **Beholda** | 0 (2 r) | 4 (2 r) | 6 (13 r) | 0 (3 r) | 25% |
| **Rascal** | 1 (4 r) | 1 (2 r) | 0 (20001 r) | 1 (8 r) | 8% |
| **Goose** | 0 (2 r) | 1 (4 r) | 0 (24 r) | 0 (2 r) | 2% |

On average HP, one on one: Denny 48%, Beholda 40%, Rascal 35%, Goose 10%.

## Level 7  (60 s)

The band: the Mascots won 5 of 20, the heroes 15, 5.7 rounds (on average HP: 7, the heroes 13).

In the band fights, a fight: Denny dealt 44, took 94, down 0.8, specials left 2.1 of 4 bonus / 1.5 of 4 action; Beholda dealt 52, took 57, down 0.8, specials left 0.7 of 4 bonus / 0.6 of 4 action; Rascal dealt 84, took 53, down 0.8, specials left 2.9 of 4 bonus / 1.4 of 4 action; Goose dealt 9, took 34, down 0.6, specials left 1.8 of 4 bonus / 2.5 of 4 action; Barley dealt 85, took 65, down 0.2; Aurdin dealt 110, took 58, down 0.8; Vivian dealt 16, took 24, down 0.2; Lymen dealt 35, took 50, down 0.2.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 72 turns: the action DENIM DAMAGE 41, CANNONBALL 12, strikes 11, LOBSTAH HUG 6, nothing worth it: close in or ready 1; the bonus specials taunt 38, flurry 17.
- **Beholda**, 99 turns: the action SPOTLIGHT 38, strikes 23, VNA BUBBLE 19, THE BIG SCREEN 11, nothing worth it: close in or ready 7; the bonus specials gaze 66, eyeOnIt 11.
- **Rascal**, 68 turns: the action SOCIAL FLAME 28, GOING VIRAL 21, cast firebolt 16, SOCIAL DISTANCING 2; the bonus specials sharing 22.
- **Goose**, 79 turns: the action shoots 47, GROUP HUG 17, LIFELINE 10, FOUNTAIN 4; the bonus specials heart 44, honk 17.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 0 (4 r) | 7 (4 r) | 4 (9 r) | 0 (3 r) | 28% |
| **Beholda** | 0 (3 r) | 9 (3 r) | 7 (15 r) | 0 (4 r) | 40% |
| **Rascal** | 1 (5 r) | 1 (3 r) | 0 (20001 r) | 0 (10 r) | 5% |
| **Goose** | 0 (2 r) | 8 (3 r) | 0 (18 r) | 0 (2 r) | 20% |

On average HP, one on one: Denny 48%, Beholda 45%, Rascal 18%, Goose 20%.

## Level 8  (24 s)

The band: the Mascots won 8 of 20, the heroes 12, 6.7 rounds (on average HP: 15, the heroes 5).

In the band fights, a fight: Denny dealt 61, took 116, down 0.7, specials left 2.7 of 5 bonus / 1.1 of 4 action; Beholda dealt 81, took 59, down 0.6, specials left 0.6 of 5 bonus / 0.2 of 4 action; Rascal dealt 136, took 57, down 0.6, specials left 4.0 of 5 bonus / 0.8 of 4 action; Goose dealt 15, took 36, down 0.6, specials left 2.5 of 5 bonus / 2.2 of 4 action; Barley dealt 98, took 102, down 0.5; Aurdin dealt 103, took 80, down 1.4; Vivian dealt 25, took 45, down 0.5; Lymen dealt 54, took 78, down 0.5.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 83 turns: the action LOBSTAH HUG 35, DENIM DAMAGE 30, CANNONBALL 8, strikes 7; the bonus specials taunt 46, flurry 16.
- **Beholda**, 125 turns: the action SPOTLIGHT 41, strikes 38, VNA BUBBLE 21, THE BIG SCREEN 13, nothing worth it: close in or ready 10; the bonus specials gaze 89, eyeOnIt 8.
- **Rascal**, 98 turns: the action GOING VIRAL 40, cast firebolt 31, SOCIAL FLAME 23, SOCIAL DISTANCING 1; the bonus specials sharing 21.
- **Goose**, 97 turns: the action shoots 57, GROUP HUG 14, LIFELINE 13, FOUNTAIN 8, nothing worth it: close in or ready 1; the bonus specials heart 50, honk 25.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 3 (5 r) | 10 (3 r) | 10 (9 r) | 0 (4 r) | 58% |
| **Beholda** | 0 (3 r) | 10 (3 r) | 9 (11 r) | 0 (4 r) | 48% |
| **Rascal** | 0 (4 r) | 0 (4 r) | 0 (7 r) | 0 (10 r) | 0% |
| **Goose** | 0 (4 r) | 8 (4 r) | 0 (35 r) | 0 (2 r) | 20% |

On average HP, one on one: Denny 68%, Beholda 50%, Rascal 22%, Goose 30%.

## Level 9  (26 s)

The band: the Mascots won 7 of 20, the heroes 13, 6.5 rounds (on average HP: 13, the heroes 7).

In the band fights, a fight: Denny dealt 44, took 120, down 0.8, specials left 3.1 of 5 bonus / 2.6 of 5 action; Beholda dealt 96, took 80, down 0.7, specials left 0.8 of 5 bonus / 0.9 of 5 action; Rascal dealt 160, took 79, down 0.7, specials left 3.7 of 5 bonus / 1.5 of 5 action; Goose dealt 13, took 56, down 0.7, specials left 2.6 of 5 bonus / 3.4 of 5 action; Barley dealt 106, took 112, down 0.6; Aurdin dealt 167, took 81, down 1.1; Vivian dealt 29, took 43, down 0.4; Lymen dealt 44, took 88, down 0.5.

What their turns went to in the band fights (all 20 fights together; a turn is one taken standing):

- **Denny**, 67 turns: the action LOBSTAH HUG 32, DENIM DAMAGE 16, CANNONBALL 11, strikes 7; the bonus specials taunt 38, flurry 14.
- **Beholda**, 121 turns: the action SPOTLIGHT 43, strikes 31, THE BIG SCREEN 22, VNA BUBBLE 17, nothing worth it: close in or ready 3; the bonus specials gaze 84, eyeOnIt 10.
- **Rascal**, 91 turns: the action GOING VIRAL 42, SOCIAL FLAME 25, cast firebolt 18, SOCIAL DISTANCING 3; the bonus specials sharing 26.
- **Goose**, 90 turns: the action shoots 51, GROUP HUG 24, LIFELINE 5, FOUNTAIN 4; the bonus specials heart 47, honk 21.

| one on one: the Mascot's wins of 10 | Barley | Aurdin | Vivian | Lymen | total |
|---|---|---|---|---|---|
| **Denny** | 3 (4 r) | 10 (3 r) | 8 (8 r) | 1 (5 r) | 55% |
| **Beholda** | 0 (3 r) | 7 (4 r) | 8 (12 r) | 0 (3 r) | 38% |
| **Rascal** | 7 (6 r) | 2 (4 r) | 0 (8 r) | 0 (12 r) | 22% |
| **Goose** | 0 (3 r) | 10 (5 r) | 0 (22 r) | 0 (2 r) | 25% |

On average HP, one on one: Denny 70%, Beholda 42%, Rascal 42%, Goose 25%.


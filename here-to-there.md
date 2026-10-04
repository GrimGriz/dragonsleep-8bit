# Here to there: what the party brings to each boss

Griz, 10-03: *"random encounters stay the 8-bit"* and *"we need to run some here-to-there 8bit benches to see what sort of resources the parties are getting to the boss battles with."*

Each leg is walked 100 times from a full start to the next boss's door: the shortest walk on the maps as the story's flags lay them, every step through the game's own encounter roll (`Field.arrive`), every fight fought to its end in the 8-bit battle. The party is tallied at the door; the boss itself is the grid's and is not fought here. The story's state, level and kit are the game's own `DS.situation` (js/situations.js) on round six's kit. How it walks and what it does not see: `cloud-notes/here-to-there-notes.md`. **Findings, not fixes:** nothing in the game was changed.

**Two hands, the same dice.** The table is **the player's hand** (Griz, 10-03: *"a player's hand on the bench now, potions under half and area spells at groups"*; on leg four, *"the tent first, pitched once below half"*). On one of the four's turns, through the battle's own menus: a potion to whichever of the four stands lowest when he is under half (a potion wakes the downed in a fight); else, with two or more foes up, Aurdin's highest-levelled damaging area spell he has a slot for; else the guest turn. After a fight: a healer's kit on each of the four who is down, the tent once when the four are under half, then a potion each for any still standing under half. (Round three, the lean of 10-03: the group at two, *"a pair of trolls is 168 regenerating HP, and a player fireballs that without thinking"*; the kit, *"yes, as a player would"*.) **Floor HP** beside it is the same walks on the guest turn alone (`Battle.guestTurn`, the game's own AI: swings, Second Wind, Shield; no other spell, no potion, no Sneak Attack). Levels are the DEEP16 ladder's wherever it has a rung (Griz: *"yes, and rerun those legs"*), else the situation's; the dry stair alone at the story's 6, not its bestiary rung of 2 (round three).

**HP** is the four heroes' hit points at the door as a share of their maximum (a downed hero counts 0, a wiped walk counts 0); **worst** is the leanest walk of the hundred; **KO** is the share of walks that reach the door with a hero down; **slots left** is level 1/level 2/... against the maximum; **potions left** is potions + greater potions (round six's kit: 3+1); **drunk** is potions drunk a walk; **tent** the walks that pitched it. **Reading:** thin = a wipe, or HP under 60%, or a hero down in 30% or more; fat = HP 90% or more and a hero down in under 10%; fair between (the seat's cut, not a rule).

<!-- walk8: from here to the matching end line, dev/walk8.py writes; the rest of the file is the seat's -->

`python dev/walk8.py leg=all n=100 table` wrote this block (seed 1: the same seed walks the same walks). `python dev/walk8.py leg=<name> n=20` runs one leg again; `python dev/walk8.py legs` lists them.

## The table: each leg from a full start, the player's hand

| leg | lvl | steps | zones (steps) | fights | rounds | HP | worst | KO | wiped | floor HP | slots left | potions left | drunk | tent | torches lit | rested | reading |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **doors** | 4 | 44 | doors (road) 13, doors 1 | 0.2 | 0.6 | 99% | 87% | 0% | 0% | 99% | Aurdin 4/4 2.8/3; Lymen 3/3 | 3.0+1.0 | 0.00 | -- | 0.0 | -- | fat |
| **snoot** | 3 | 69 | north (road) 1, north 13, gulch 6, snoot 7, snoot (road) 12 | 1.1 | 3.0 | 95% | 76% | 0% | 0% | 93% | Aurdin 3/4 2/2; Lymen 3/3 | 2.9+1.0 | 0.16 | -- | 0.0 | -- | fat |
| **gulch** | 3 | 79 | north (road) 2, north 11, gulch 35 | 1.9 | 4.8 | 92% | 52% | 0% | 0% | 88% | Aurdin 2.8/4 2/2; Lymen 3/3 | 2.6+1.0 | 0.37 | -- | 0.0 | -- | fat |
| **wet** | 4 | 101 | north (road) 8, north 1, warrens_d 9 | 0.4 | 1.0 | 99% | 86% | 0% | 0% | 99% | Aurdin 4/4 3/3; Lymen 3/3 | 3.0+1.0 | 0.02 | -- | 1.0 | -- | fat |
| **jelly** | 4 | 113 | north (road) 8, north 1, warrens_d 21 | 0.9 | 2.3 | 97% | 81% | 0% | 0% | 96% | Aurdin 3.9/4 2.9/3; Lymen 3/3 | 2.9+1.0 | 0.12 | -- | 1.0 | -- | fat |
| **ooze** | 4 | 124 | north (road) 8, north 1, warrens_d 32 | 1.5 | 3.9 | 95% | 79% | 0% | 0% | 93% | Aurdin 3.8/4 2.8/3; Lymen 3/3 | 2.9+1.0 | 0.11 | -- | 1.0 | -- | fat |
| **crawler** | 4 | 110 | north (road) 8, north 1, warrens_d 18 | 0.8 | 2.0 | 98% | 81% | 0% | 0% | 97% | Aurdin 3.9/4 2.9/3; Lymen 3/3 | 2.9+1.0 | 0.08 | -- | 1.0 | -- | fat |
| **keeper** | 3 | 136 | north (road) 8, north 1, warrens_c 35, warrens_d 5 | 1.8 | 4.5 | 93% | 67% | 0% | 0% | 91% | Aurdin 2.7/4 2/2; Lymen 3/3 | 2.9+1.0 | 0.10 | -- | 2.0 | -- | fat |
| **cloaker** | 6 | 106 | north 10, glowseep 2, north (road) 1 | 0.3 | 0.7 | 100% | 94% | 0% | 0% | 100% | Aurdin 4/4 3/3 2.9/3; Lymen 4/4 2/2 | 3.0+1.0 | 0.00 | -- | 1.0 | -- | fat |
| **wagon** | 4 | 73 | north (road) 1, north 13, gulch 6, south 7 | 0.9 | 2.1 | 97% | 82% | 0% | 0% | 97% | Aurdin 3.9/4 2.5/3; Lymen 3/3 | 2.9+1.0 | 0.07 | -- | 0.0 | -- | fat |
| **chuul** | 4 | 87 | north (road) 1, north 13, gulch 6, south 7 | 0.9 | 2.0 | 98% | 84% | 0% | 0% | 97% | Aurdin 3.9/4 2.6/3; Lymen 3/3 | 3.0+1.0 | 0.01 | -- | 0.0 | -- | fat |
| **hask** | 4 | 157 | north (road) 8, north 1, warrens_c 35, warrens_d 5 | 1.7 | 4.3 | 95% | 79% | 0% | 0% | 95% | Aurdin 3.8/4 2.3/3; Lymen 3/3 | 2.9+1.0 | 0.06 | -- | 2.0 | -- | fat |
| **cutseal** | 5 | 91 | hw1 30 | 1.2 | 3.8 | 86% | 52% | 0% | 0% | 61% | Aurdin 3.5/4 2.8/3 0.7/2; Lymen 4/4 2/2 | 1.9+0.8 | 1.30 | 1% | 0.0 | -- | fair |
| **gricks** | 5 | 20 | hw1 20 | 0.9 | 2.9 | 89% | 56% | 0% | 0% | 69% | Aurdin 3.7/4 3/3 0.9/2; Lymen 4/4 2/2 | 2.3+0.8 | 0.86 | -- | 0.0 | -- | fair |
| **roper** | 6 | 71 | hw1 21, hw2 38 | 2.7 | 8.4 | 86% | 56% | 0% | 0% | 72% | Aurdin 3.5/4 2.9/3 1.1/3; Lymen 4/4 2/2 | 1.5+0.7 | 1.76 | 4% | 0.0 | First Lamp 97% | fair |
| **bulette** | 5 | 23 | hw2 23 | 1.1 | 3.9 | 88% | 51% | 0% | 0% | 73% | Aurdin 3.7/4 2.9/3 0.8/2; Lymen 4/4 2/2 | 2.0+0.8 | 1.19 | 2% | 0.0 | -- | fair |
| **drain** | 6 | 14 | hw2 4 | 0.2 | 0.6 | 100% | 100% | 0% | 0% | 100% | Aurdin 4/4 3/3 3/3; Lymen 4/4 2/2 | 2.9+1.0 | 0.09 | 1% | 0.0 | Second Lamp 19% | fat |
| **pinned** | 6 | 29 | hw2 13 | 0.7 | 2.3 | 93% | 67% | 0% | 0% | 86% | Aurdin 3.8/4 3/3 2.2/3; Lymen 4/4 2/2 | 2.6+0.9 | 0.46 | -- | 0.0 | -- | fat |
| **stair** | 6 | 164 | north (road) 8, north 1, warrens_c 35, warrens_d 5 | 1.7 | 3.6 | 98% | 89% | 0% | 0% | 98% | Aurdin 3.9/4 3/3 2.3/3; Lymen 4/4 2/2 | 3.0+1.0 | 0.00 | -- | 0.0 | -- | fat |
| **brood** | 7 | 39 | hw2 13, nest 9 | 1.0 | 3.4 | 91% | 56% | 0% | 0% | 83% | Aurdin 3.8/4 3/3 2.5/3 0.1/1; Lymen 4/4 3/3 | 2.6+0.9 | 0.43 | 1% | 0.0 | -- | fat |
| **xorns** | 8 | 35 | hw3 28 | 1.5 | 5.7 | 84% | 51% | 0% | 0% | 66% (wiped 1%) | Aurdin 3.2/4 3/3 2.4/3 0.2/2; Lymen 4/4 3/3 | 1.8+0.7 | 1.45 | 4% | 0.0 | -- | fair |
| **giant** | 8 | 19 | hw3 19 | 1.1 | 3.9 | 90% | 61% | 0% | 0% | 82% | Aurdin 3.6/4 3/3 2.8/3 0.6/2; Lymen 4/4 3/3 | 2.3+0.8 | 0.88 | 2% | 0.0 | -- | fair |
| **raid** | 8 | 17 | hw3 15 | 0.9 | 3.2 | 91% | 52% | 0% | 0% | 80% (wiped 1%) | Aurdin 3.6/4 3/3 2.9/3 0.8/2; Lymen 4/4 3/3 | 2.5+0.9 | 0.65 | -- | 0.0 | -- | fat |
| **fallback** | 7 | 21 | hw4 12 | 0.6 | 2.8 | 87% | 54% | 0% | 0% | 79% (wiped 1%) | Aurdin 3.8/4 3/3 2.8/3 0.5/1; Lymen 4/4 3/3 | 2.1+0.8 | 1.16 | 4% | 0.0 | -- | fair |
| **naga** | 7 | 19 | hw4 19 | 1.0 | 4.5 | 82% | 51% | 0% | 0% | 70% (wiped 1%) | Aurdin 3.5/4 3/3 2.5/3 0.2/1; Lymen 4/4 3/3 | 1.7+0.7 | 1.56 | 2% | 0.0 | -- | fair |
| **trolls** | 8 | 23 | hw4 23 | 1.3 | 5.6 | 80% | 50% | 0% | 0% | 67% (wiped 1%) | Aurdin 3.5/4 3/3 2.7/3 0.5/2; Lymen 4/4 3/3 | 1.6+0.7 | 1.69 | 2% | 0.0 | -- | fair |
| **elemental** | 8 | 15 | hw4 15 | 0.8 | 3.5 | 87% | 63% | 0% | 0% | 78% | Aurdin 3.5/4 3/3 2.9/3 0.9/2; Lymen 4/4 3/3 | 2.2+0.8 | 0.93 | -- | 0.0 | -- | fair |
| **torvald** | 9 | 15 | hw4 15 | 0.8 | 3.3 | 89% | 67% | 0% | 0% | 82% | Aurdin 3.7/4 3/3 3/3 2.7/3 0.3/1; Lymen 4/4 3/3 2/2 | 2.4+0.9 | 0.66 | -- | 0.0 | -- | fair |

- **the road catches**: after the wagon yard: a chase that rolls no encounters (world.js Field.arrive: `!this.chase`), so the party meets the riders with the yard's leftovers.
- **the assassins**: at Deepholm's door, the first rest after Torvald: no walk between (see the torvald leg).

## The chains: the road since the last bed

The same legs walked one after another, nothing reset between the doors and no boss fought (the grid fights those): each row is what the road alone has taken since the party last slept, the floor under what it really brings (the boss before it costs more on top). A walk that wiped earlier counts as wiped at every door after.

| chain | door | steps | fights | HP | worst | KO | wiped by then | floor HP | floor wiped | slots left | potions left | tent by then | rested on the way | reading |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| legone | **cutseal** | 91 | 1.2 | 87% | 50% | 0% | 0% | 64% | 0% | Aurdin 3.5/4 2.8/3 0.7/2; Lymen 4/4 2/2 | 1.9+0.7 | 5% | -- | fair |
| legone | **gricks** | 20 | 1.0 | 77% | 34% | 0% | 0% | 37% | 2% | Aurdin 3/4 2/3 0.1/2; Lymen 4/4 2/2 | 1.0+0.5 | 16% | -- | fair |
| legone | **roper** | 72 | 2.7 | 78% | 0% | 5% | 1% | 56% | 14% | Aurdin 3.5/4 2.5/3 0.3/2; Lymen 4/4 2/2 | 0.0+0.1 | 48% | First Lamp 99% | thin |
| legone | **bulette** | 25 | 1.1 | 63% | 0% | 10% | 2% | 39% | 18% | Aurdin 2.8/4 1.5/3 0/2; Lymen 4/4 2/2 | 0.0+0.0 | 58% | -- | thin |
| legone | **drain** | 16 | 0.3 | 97% | 0% | 2% | 3% | 81% | 19% | Aurdin 3.9/4 2.9/3 1.9/2; Lymen 4/4 2/2 | 0.0+0.0 | 59% | Second Lamp 97% | thin |
| legthree | **xorns** | 35 | 1.5 | 87% | 54% | 0% | 0% | 70% | 2% | Aurdin 3.5/4 3/3 2.5/3 0.2/2; Lymen 4/4 3/3 | 2.2+0.8 | 2% | -- | fair |
| legthree | **giant** | 20 | 1.1 | 82% | 52% | 0% | 0% | 51% | 9% | Aurdin 3/4 2.9/3 1.4/3 0/2; Lymen 4/4 3/3 | 1.6+0.7 | 4% | -- | fair |
| legthree | **raid** | 16 | 0.8 | 76% | 0% | 2% | 2% | 36% | 23% | Aurdin 2.8/4 2.6/3 0.6/3 0/2; Lymen 4/4 3/3 | 1.3+0.5 | 9% | -- | thin |
| legfour | **fallback** | 21 | 0.7 | 89% | 51% | 0% | 0% | 79% | 0% | Aurdin 3.7/4 3/3 2.7/3 0.4/1; Lymen 4/4 3/3 | 2.2+0.9 | -- | -- | fair |
| legfour | **naga** | 20 | 1.1 | 76% | 53% | 0% | 0% | 43% | 14% | Aurdin 3.1/4 3/3 1.7/3 0.1/1; Lymen 4/4 3/3 | 1.1+0.5 | 14% | -- | fair |
| legfour | **trolls** | 24 | 1.3 | 65% | 0% | 9% | 4% | 10% | 69% | Aurdin 2.5/4 2.5/3 0.7/3 0/1; Lymen 4/4 3/3 | 0.3+0.1 | 44% | -- | thin |
| legfour | **elemental** | 14 | 0.8 | 56% | 0% | 17% | 9% | 3% | 87% | Aurdin 2.2/4 2/3 0.3/3 0/1; Lymen 4/4 3/3 | 0.1+0.1 | 63% | -- | thin |
| legfour | **torvald** | 16 | 1.0 | 38% | 0% | 42% | 27% | 1% | 96% | Aurdin 1.7/4 1.1/3 0.2/3 0/1; Lymen 4/4 3/3 | 0.0+0.0 | 76% | -- | thin |
| legfoursally | **fallback** | 21 | 0.6 | 88% | 52% | 0% | 0% | 79% | 0% | Aurdin 3.8/4 3/3 2.7/3 0.5/1; Lymen 4/4 3/3 | 2.1+0.8 | 1% | -- | fair |
| legfoursally | **fallback-home** | 24 | 0.7 | 75% | 0% | 1% | 1% | 54% | 8% | Aurdin 3.4/4 3/3 2.1/3 0.1/1; Lymen 4/4 3/3 | 1.3+0.6 | 5% | Third Lamp 99% | thin |
| legfoursally | **naga** | 43 | 1.8 | 72% | 0% | 3% | 3% | 31% | 25% | Aurdin 3.1/4 3/3 1.6/3 0/1; Lymen 4/4 3/3 | 0.4+0.2 | 25% | -- | thin |
| legfoursally | **naga-home** | 44 | 2.0 | 55% | 0% | 17% | 10% | 4% | 89% | Aurdin 2.4/4 2/3 0.3/3 0/1; Lymen 4/4 3/3 | 0.1+0.0 | 82% | Third Lamp 90% | thin |
| legfoursally | **trolls** | 67 | 3.0 | 37% | 0% | 49% | 25% | 1% | 97% | Aurdin 2.8/4 2.7/3 0.8/3 0/1; Lymen 4/4 3/3 | 0.0+0.0 | 91% | -- | thin |
| legfoursally | **trolls-home** | 67 | 2.3 | 2% | 0% | 96% | 90% | 0% | 100% | Aurdin 2.3/4 1.8/3 0.3/3 0/1; Lymen 4/4 3/3 | 0.0+0.0 | 96% | Third Lamp 10% | thin |
| legfoursally | **elemental** | 73 | 2.3 | 4% | 0% | 94% | 93% | 0% | 100% | Aurdin 2.4/4 2/3 0.4/3 0/1; Lymen 4/4 3/3 | 0.0+0.0 | 96% | -- | thin |
| legfoursally | **elemental-home** | 74 | 2.3 | 0% | 0% | 100% | 99% | 0% | 100% | Aurdin 2.3/4 1.9/3 0.4/3 0/1; Lymen 4/4 3/3 | 0.0+0.0 | 96% | Third Lamp 1% | thin |
| legfoursally | **torvald** | 89 | 2.3 | 0% | 0% | 100% | 100% | 0% | 100% | Aurdin 2.3/4 1.9/3 0.4/3 0/1; Lymen 4/4 3/3 | 0.0+0.0 | 96% | -- | thin |

## Each leg

**doors** -- Silverton to the Doors (the wall at the top of the north road). Level 4 (lvl: no fight there; round six's 4); from Silverton (Fountain Street), rested.
Path 44 steps, silverton > world. At the door: Barley 98%, Aurdin 99%, Vivian 99%, Lymen 100%. Features spent: none. Spells spent: Aurdin: casts Shatter 0.16, Aurdin: shield of force 0.01. Silver +0 a walk.
The road's fights: wolf x3 (0.07 a walk, 9 HP a fight); worg x2 (0.06 a walk, 10 HP a fight); worg x1 (0.04 a walk, 6 HP a fight); wolf x2, worg x1 (0.02 a walk, 8 HP a fight).

**snoot** -- Silverton to the Snoot (the glory-seekers on the road south). Level 3; from Silverton (Fountain Street), rested.
Path 69 steps, silverton > world. At the door: Barley 92%, Aurdin 95%, Vivian 95%, Lymen 99%. Features spent: none. Spells spent: Aurdin: casts Burning Hands 0.86, Aurdin: shield of force 0.15, Lymen: uses Potion of Healing 0.05, Barley: uses Potion of Healing 0.05. Silver +6 a walk.
The road's fights: gnoll x3 (0.10 a walk, 12 HP a fight); gnoll x2 (0.14 a walk, 6 HP a fight); worg x2 (0.05 a walk, 14 HP a fight); giantspider x1 (0.06 a walk, 8 HP a fight).

**gulch** -- Silverton to Web Gulch (the braiding ettercap). Level 3; from Silverton (Fountain Street), rested.
Path 79 steps, silverton > world > gulch. At the door: Barley 88%, Aurdin 94%, Vivian 92%, Lymen 98%. Features spent: none. Spells spent: Aurdin: casts Burning Hands 1.01, Aurdin: shield of force 0.20, Vivian: uses Potion of Healing 0.14, Lymen: uses Potion of Healing 0.10. Silver +6 a walk.
The road's fights: wolfspider x3 (0.35 a walk, 7 HP a fight); wolfspider x2 (0.43 a walk, 4 HP a fight); giantspider x1 (0.53 a walk, 3 HP a fight); giantspider x1, wolfspider x2 (0.10 a walk, 14 HP a fight).

**wet** -- Silverton to the Wet: the otyugh (the landlord's step). Level 4; from Silverton (Fountain Street), rested.
Path 101 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 98%, Aurdin 98%, Vivian 100%, Lymen 100%. Features spent: none. Spells spent: Aurdin: casts Shatter 0.04, Aurdin: shield of force 0.03, Vivian: uses Potion of Healing 0.02. Silver +1 a walk.
The road's fights: crawler x1 (0.12 a walk, 10 HP a fight); ratswarm x2 (0.02 a walk, 7 HP a fight); bandit x3 (0.03 a walk, 4 HP a fight); grayooze x1 (0.11 a walk, 1 HP a fight).

**jelly** -- Silverton to the Wet: the ochre jelly. Level 4 (lvl: the Wet's situation); from Silverton (Fountain Street), rested.
Path 113 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 95%, Aurdin 96%, Vivian 97%, Lymen 99%. Features spent: none. Spells spent: Aurdin: casts Shatter 0.14, Aurdin: shield of force 0.12, Lymen: uses Potion of Healing 0.05, Barley: uses Potion of Healing 0.03. Silver +2 a walk.
The road's fights: crawler x1 (0.37 a walk, 10 HP a fight); wolf x2 (0.04 a walk, 8 HP a fight); ratswarm x2 (0.06 a walk, 4 HP a fight); grayooze x1 (0.22 a walk, 1 HP a fight).

**ooze** -- Silverton to the Wet: the gray ooze in the pool. Level 4 (lvl: the Wet's situation); from Silverton (Fountain Street), rested.
Path 124 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 90%, Aurdin 95%, Vivian 95%, Lymen 99%. Features spent: none. Spells spent: Aurdin: casts Shatter 0.19, Aurdin: shield of force 0.19, Lymen: uses Potion of Healing 0.04, Vivian: uses Potion of Healing 0.03. Silver +4 a walk.
The road's fights: crawler x1 (0.57 a walk, 10 HP a fight); grayooze x1 (0.34 a walk, 2 HP a fight); ratswarm x2 (0.14 a walk, 5 HP a fight); ratswarm x1 (0.15 a walk, 4 HP a fight).

**crawler** -- Silverton to the Wet: the crawler at the deep cradle. Level 4 (lvl: the Wet's situation); from Silverton (Fountain Street), rested.
Path 110 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 97%, Aurdin 97%, Vivian 97%, Lymen 99%. Features spent: none. Spells spent: Aurdin: casts Shatter 0.14, Aurdin: shield of force 0.06, Lymen: uses Potion of Healing 0.03, Vivian: uses Potion of Healing 0.02. Silver +2 a walk.
The road's fights: crawler x1 (0.21 a walk, 11 HP a fight); grayooze x1 (0.17 a walk, 3 HP a fight); ratswarm x1 (0.12 a walk, 4 HP a fight); giantrat x3 (0.04 a walk, 6 HP a fight).

**keeper** -- Silverton to the flooded stair (the Keeper). Level 3; from Silverton (Fountain Street), rested.
Path 136 steps, silverton > world > warrens_a > warrens_c > warrens_d. At the door: Barley 89%, Aurdin 92%, Vivian 94%, Lymen 98%. Features spent: none. Spells spent: Aurdin: casts Burning Hands 1.13, Aurdin: shield of force 0.22, Aurdin: uses Potion of Healing 0.05, Vivian: uses Potion of Healing 0.03. Silver +8 a walk.
The road's fights: crawler x1 (0.15 a walk, 9 HP a fight); giantrat x4 (0.14 a walk, 8 HP a fight); giantrat x3 (0.16 a walk, 5 HP a fight); ratswarm x2 (0.15 a walk, 5 HP a fight).

**cloaker** -- Silverton to the cloaker (the guano mine, down the slide). Level 6 (lvl: the ladder's (Griz, 10-03: "yes, and rerun those legs"; the situation had 4)); from Silverton (Fountain Street), rested.
Path 106 steps, silverton > world > galleries_g1 > galleries_g2 > galleries_g4. At the door: Barley 99%, Aurdin 100%, Vivian 100%, Lymen 100%. Features spent: none. Spells spent: Aurdin: casts Fireball 0.09. Silver +1 a walk.
The road's fights: stirge x3 (0.03 a walk, 8 HP a fight); bandit x2 (0.03 a walk, 5 HP a fight); giantrat x2 (0.07 a walk, 2 HP a fight); insectswarm x1 (0.01 a walk, 14 HP a fight).

**wagon** -- Silverton to the Halfway Inn (the wagon night; the road catches after it). Level 4; from Silverton (Fountain Street), rested. The story long-rests at the inn before the wagon rolls in (events.js EV.longRest, Griz 09-25), and the road catches follow the yard fight in a chase that rolls no encounters: both are fought full or on the yard's leftovers, not on this walk.
Path 73 steps, silverton > world > halfway > halfway_in. At the door: Barley 97%, Aurdin 97%, Vivian 97%, Lymen 98%. Features spent: none. Spells spent: Aurdin: casts Shatter 0.49, Aurdin: shield of force 0.07, Lymen: uses Potion of Healing 0.03, Aurdin: uses Potion of Healing 0.03. Silver +4 a walk.
The road's fights: wolfspider x3 (0.09 a walk, 11 HP a fight); giantrat x3 (0.08 a walk, 6 HP a fight); wolfspider x2 (0.07 a walk, 6 HP a fight); giantspider x1 (0.06 a walk, 6 HP a fight).

**chuul** -- Silverton to the lake (the point: the chuul). Level 4; from Silverton (Fountain Street), rested. By the story the chuul comes after a night at the inn holding the ring (a long rest): this is the walk to the water, or the rowboat's poke by day.
Path 87 steps, silverton > world > halfway. At the door: Barley 97%, Aurdin 98%, Vivian 98%, Lymen 99%. Features spent: none. Spells spent: Aurdin: casts Shatter 0.39, Aurdin: shield of force 0.07, Aurdin: uses Potion of Healing 0.01. Silver +3 a walk.
The road's fights: giantrat x3 (0.15 a walk, 4 HP a fight); wolfspider x2 (0.05 a walk, 8 HP a fight); stirge x3 (0.07 a walk, 6 HP a fight); giantrat x2 (0.11 a walk, 2 HP a fight).

**hask** -- Silverton to the night crew at the niches (Hask, the Burial). Level 4 (lvl: the ladder's (Griz, 10-03: "yes, and rerun those legs"; the situation had 5)); from Silverton (Fountain Street), rested.
Path 157 steps, silverton > world > warrens_a > warrens_c > warrens_d > burial. At the door: Barley 93%, Aurdin 95%, Vivian 95%, Lymen 99%. Features spent: none. Spells spent: Aurdin: casts Shatter 0.73, Aurdin: shield of force 0.17, Barley: uses Potion of Healing 0.02, Lymen: uses Potion of Healing 0.02. Silver +7 a walk.
The road's fights: ratswarm x2 (0.18 a walk, 9 HP a fight); crawler x1 (0.12 a walk, 9 HP a fight); ratswarm x1 (0.25 a walk, 3 HP a fight); giantrat x3 (0.16 a walk, 4 HP a fight).

**cutseal** -- Solskaft to the cut seal (leg one, with Pyro). Level 5; from Solskaft, after a night (the cots).
Path 91 steps, solskaft > solskaft_deep > highway_1. At the door: Barley 75%, Aurdin 84%, Vivian 87%, Lymen 97%, Pyro (guest) 97%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: casts Fireball 1.32, Aurdin: shield of force 0.45, Aurdin: uses Potion of Healing 0.29, Vivian: uses Potion of Healing 0.28. Silver +58 a walk.
The road's fights: bugbear x2, bugbearchief x2 (0.10 a walk, 43 HP a fight, 0.1 down); hobgoblin x6, hobsergeant x1 (0.17 a walk, 24 HP a fight, 0.1 down); hobgoblin x5, hobsergeant x1 (0.26 a walk, 15 HP a fight); bugbear x5, goblin x2 (0.08 a walk, 43 HP a fight).

**gricks** -- The cut seal to the grick den. Level 5; from the cut seal.
Path 20 steps, highway_1. At the door: Barley 80%, Aurdin 88%, Vivian 92%, Lymen 97%, Pyro (guest) 99%. Features spent: none. Spells spent: Aurdin: casts Fireball 1.11, Aurdin: shield of force 0.32, Aurdin: uses Potion of Healing 0.19, Barley: uses Potion of Healing 0.18. Silver +41 a walk.
The road's fights: bugbear x2, bugbearchief x2 (0.07 a walk, 53 HP a fight, 0.1 down); bugbear x4, goblin x3 (0.10 a walk, 28 HP a fight); bugbear x1, bugbearchief x2 (0.07 a walk, 39 HP a fight); hobgoblin x6, hobsergeant x1 (0.16 a walk, 16 HP a fight, 0.1 down).

**roper** -- The grick den to the roper (past First Lamp). Level 6 (lvl: the ladder's (Griz, 10-03: "yes, and rerun those legs"; the situation had 5, leg one's)); from the grick den.
Path 71 steps, highway_1 > highway_2. At the door: Barley 76%, Aurdin 80%, Vivian 88%, Lymen 96%, Pyro (guest) 99%. Features spent: Barley secondWind 0.9 of 1 left, Pyro indomitable 0.8 of 1 left. Spells spent: Aurdin: casts Fireball 3.22, Aurdin: shield of force 0.86, Aurdin: uses Potion of Healing 0.42, Lymen: uses Potion of Healing 0.41. Silver +64 a walk.
The road's fights: ettin x3 (0.13 a walk, 80 HP a fight, 0.1 down); grick x6 (0.23 a walk, 27 HP a fight); bugbear x2, bugbearchief x2 (0.08 a walk, 68 HP a fight); phasespider x4 (0.12 a walk, 36 HP a fight).

**bulette** -- The roper to the bulette. Level 5; from the roper's fork.
Path 23 steps, highway_2. At the door: Barley 79%, Aurdin 86%, Vivian 89%, Lymen 96%, Pyro (guest) 99%. Features spent: Pyro indomitable 0.9 of 1 left. Spells spent: Aurdin: casts Fireball 1.16, Aurdin: shield of force 0.33, Vivian: uses Potion of Healing 0.26, Lymen: uses Potion of Healing 0.25. Silver +9 a walk.
The road's fights: ettin x3 (0.09 a walk, 88 HP a fight, 0.7 down); mouther x4 (0.14 a walk, 30 HP a fight); grick x6 (0.15 a walk, 23 HP a fight, 0.1 down); cube x2, mouther x1 (0.07 a walk, 36 HP a fight, 0.1 down).

**drain** -- The bulette to the drain cut (past Second Lamp). Level 6 (lvl: the ladder's); from the breach (the bulette).
Path 14 steps, highway_2. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%, Pyro (guest) 100%. Features spent: none. Spells spent: Aurdin: casts Fireball 0.23, Aurdin: shield of force 0.05, Lymen: uses Potion of Healing 0.03, Vivian: uses Potion of Healing 0.02. Silver +2 a walk.
The road's fights: ettin x3 (0.04 a walk, 79 HP a fight, 0.5 down); grick x6 (0.04 a walk, 30 HP a fight); ettin x1 (0.03 a walk, 22 HP a fight); grick x4 (0.02 a walk, 26 HP a fight).

**pinned** -- The drain cut to the north cut (the phase spiders, Halldor pinned). Level 6; from the drain cut.
Path 29 steps, highway_2 > pinned. At the door: Barley 87%, Aurdin 92%, Vivian 94%, Lymen 98%, Pyro (guest) 99%. Features spent: Pyro indomitable 0.9 of 1 left. Spells spent: Aurdin: casts Fireball 0.82, Aurdin: shield of force 0.25, Barley: uses Potion of Healing 0.13, Vivian: uses Potion of Healing 0.09. Silver +6 a walk.
The road's fights: grick x6 (0.07 a walk, 41 HP a fight); ettin x3 (0.03 a walk, 87 HP a fight); mouther x4 (0.08 a walk, 31 HP a fight); cube x2, mouther x1 (0.07 a walk, 33 HP a fight).

**stair** -- Solskaft to the dry stair (the crew boss holding it). Level 6 (lvl: the story's, not the ladder's 2 (the lean of 10-03: "the story's; the walker measures arrival, and 2 is the bestiary's rung"): the stair comes after beat 10, where Ragna asks for the water); from Solskaft, after a night (the cots).
Path 164 steps, solskaft > silverton > world > warrens_a > warrens_c > warrens_d. At the door: Barley 97%, Aurdin 98%, Vivian 98%, Lymen 99%. Features spent: none. Spells spent: Aurdin: casts Fireball 0.66, Aurdin: shield of force 0.10. Silver +6 a walk.
The road's fights: centipede x3 (0.21 a walk, 5 HP a fight); giantrat x3 (0.16 a walk, 5 HP a fight); ratswarm x1 (0.24 a walk, 2 HP a fight); ratswarm x2 (0.28 a walk, 1 HP a fight).

**brood** -- Second Lamp to the nest (the Broodmother, Halldor and four troopers). Level 7; from Second Lamp (the road menu's fast travel), after a night there.
Path 39 steps, highway_2 > pinned > nest. At the door: Barley 87%, Aurdin 89%, Vivian 91%, Lymen 97%, Halldor (guest) 97% down 1%, Trooper nest1 (guest) 97%, Trooper nest2 (guest) 95%, Trooper nest3 (guest) 97% down 1%, Trooper nest4 (guest) 97%. Features spent: none. Spells spent: Aurdin: casts Ice Storm 0.92, Aurdin: casts Fireball 0.45, Aurdin: shield of force 0.23, Aurdin: uses Potion of Healing 0.10. Silver +7 a walk.
The road's fights: phasespider x5 (0.28 a walk, 27 HP a fight); ettin x4 (0.07 a walk, 88 HP a fight, 0.3 down); phasespider x4 (0.16 a walk, 26 HP a fight); grick x7 (0.10 a walk, 31 HP a fight).

**xorns** -- Second Lamp to the seam (the xorns, leg three, Brann and Hedda). Level 8 (lvl: the raid's situation); from Second Lamp (fast travel; Third Lamp is the drow's), after a night there.
Path 35 steps, highway_2 > highway_3. At the door: Barley 73%, Aurdin 82%, Vivian 89%, Lymen 96%, Brann (guest) 95%, Hedda (guest) 92%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: casts Ice Storm 1.79, Aurdin: shield of force 0.76, Aurdin: casts Fireball 0.57, Vivian: uses Potion of Healing 0.29. Silver +113 a walk.
The road's fights: xorn x3 (0.36 a walk, 100 HP a fight, 0.1 down); drow x6, drowcaptain x2 (0.28 a walk, 46 HP a fight); cloaker x2 (0.22 a walk, 34 HP a fight, 0.2 down); drow x4, drowcaptain x2 (0.15 a walk, 39 HP a fight).

**giant** -- The seam to the giant's camp. Level 8; from the seam (the xorns).
Path 19 steps, highway_3. At the door: Barley 81%, Aurdin 88%, Vivian 95%, Lymen 97%, Brann (guest) 97%, Hedda (guest) 95% down 1%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: casts Ice Storm 1.43, Aurdin: shield of force 0.40, Barley: uses Potion of Healing 0.19, Aurdin: uses Potion of Healing 0.19. Silver +71 a walk.
The road's fights: xorn x3 (0.19 a walk, 94 HP a fight, 0.2 down); cloaker x2 (0.24 a walk, 30 HP a fight, 0.1 down); drow x6, drowcaptain x2 (0.12 a walk, 56 HP a fight); drow x4, drowcaptain x2 (0.11 a walk, 46 HP a fight).

**raid** -- The giant's camp to Third Lamp (the raid). Level 8; from the giant's camp.
Path 17 steps, highway_3. At the door: Barley 87%, Aurdin 89%, Vivian 90%, Lymen 99%, Brann (guest) 97%, Hedda (guest) 97%. Features spent: none. Spells spent: Aurdin: casts Ice Storm 1.22, Aurdin: shield of force 0.39, Lymen: uses Potion of Healing 0.18, Barley: uses Potion of Healing 0.13. Silver +64 a walk.
The road's fights: xorn x3 (0.15 a walk, 106 HP a fight, 0.1 down); drow x6, drowcaptain x2 (0.18 a walk, 43 HP a fight); cloaker x2 (0.16 a walk, 22 HP a fight, 0.1 down); drow x4, drowcaptain x2 (0.10 a walk, 31 HP a fight).

**fallback** -- Third Lamp to the drow's fallback line (leg four). Level 7 (lvl: the ladder's (Griz, 10-03: "yes, and rerun those legs"; the situation had 8)); from Third Lamp, lit, after a night there.
Path 21 steps, highway_3 > highway_4. At the door: Barley 79%, Aurdin 87%, Vivian 89%, Lymen 94%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: casts Ice Storm 0.54, Aurdin: shield of force 0.25, Vivian: uses Potion of Healing 0.25, Aurdin: casts Fireball 0.23. Silver +21 a walk.
The road's fights: troll x2 (0.19 a walk, 74 HP a fight, 0.1 down); earthelemental x1, xorn x1 (0.13 a walk, 102 HP a fight, 0.2 down); duergar x2, stonegiant x1 (0.07 a walk, 92 HP a fight, 0.1 down); naga x1 (0.08 a walk, 33 HP a fight).

**naga** -- The fallback line to the black water (the naga). Level 7 (lvl: the ladder's (Griz, 10-03: "yes, and rerun those legs"; the situation had 8)); from the fallback line.
Path 19 steps, highway_4. At the door: Barley 75%, Aurdin 78%, Vivian 80%, Lymen 93%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: casts Ice Storm 0.83, Aurdin: shield of force 0.46, Aurdin: casts Fireball 0.46, Barley: uses Potion of Healing 0.36. Silver +39 a walk.
The road's fights: troll x2 (0.28 a walk, 63 HP a fight); earthelemental x1, xorn x1 (0.20 a walk, 75 HP a fight, 0.1 down); duergar x2, stonegiant x1 (0.09 a walk, 73 HP a fight); naga x1 (0.12 a walk, 34 HP a fight).

**trolls** -- The black water to the troll hole. Level 8; from the causeway (the naga).
Path 23 steps, highway_4. At the door: Barley 69%, Aurdin 74%, Vivian 86%, Lymen 91%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: casts Ice Storm 1.48, Aurdin: shield of force 0.53, Lymen: uses Potion of Healing 0.41, Vivian: uses Potion of Healing 0.37. Silver +48 a walk.
The road's fights: troll x2 (0.36 a walk, 72 HP a fight, 0.1 down); earthelemental x1, xorn x1 (0.21 a walk, 71 HP a fight); duergar x3, stonegiant x1 (0.18 a walk, 70 HP a fight, 0.1 down); duergar x2, stonegiant x1 (0.10 a walk, 70 HP a fight).

**elemental** -- The troll hole to the cut's walls (the earth elemental). Level 8; from the troll hole.
Path 15 steps, highway_4. At the door: Barley 83%, Aurdin 81%, Vivian 90%, Lymen 94%. Features spent: none. Spells spent: Aurdin: casts Ice Storm 1.10, Aurdin: shield of force 0.49, Barley: uses Potion of Healing 0.25, Lymen: uses Potion of Healing 0.22. Silver +33 a walk.
The road's fights: earthelemental x1, xorn x1 (0.20 a walk, 75 HP a fight, 0.1 down); troll x2 (0.13 a walk, 59 HP a fight); duergar x2, stonegiant x1 (0.10 a walk, 67 HP a fight); duergar x3, stonegiant x1 (0.08 a walk, 63 HP a fight).

**torvald** -- The cut's walls to Deepholm's door (Torvald; the sect's blades come at the next rest there). Level 9 (lvl: the situation's 9 (off the ladder: a story fight)); from the made road's cut (the elemental). The assassins come when the party first rests at the door after Torvald (deep.js EV.rest): the same state as Torvald's door, less whatever Torvald cost.
Path 15 steps, highway_4 > threshold. At the door: Barley 84%, Aurdin 84%, Vivian 93%, Lymen 94%. Features spent: none. Spells spent: Aurdin: casts Cone of Cold 0.73, Aurdin: casts Ice Storm 0.33, Aurdin: shield of force 0.33, Barley: uses Potion of Healing 0.21. Silver +30 a walk.
The road's fights: troll x2 (0.26 a walk, 63 HP a fight); earthelemental x1, xorn x1 (0.17 a walk, 75 HP a fight); duergar x3, stonegiant x1 (0.08 a walk, 55 HP a fight); duergar x2, stonegiant x1 (0.06 a walk, 57 HP a fight, 0.2 down).

## The five that arrive thinnest (from a full start), and what drained them

1. **trolls** (The black water to the troll hole): HP 80%, worst 50%, a hero down in 0%, wiped 0%. At the door: Barley 69%, Aurdin 74%, Vivian 86%, Lymen 91%. Drained by: troll x2 (0.36 a walk, 72 HP a fight, 0.1 down); earthelemental x1, xorn x1 (0.21 a walk, 71 HP a fight); duergar x3, stonegiant x1 (0.18 a walk, 70 HP a fight, 0.1 down). Spent in the fights: Aurdin: casts Ice Storm 1.48, Aurdin: shield of force 0.53, Lymen: uses Potion of Healing 0.41, Vivian: uses Potion of Healing 0.37; features: Barley secondWind 0.9 of 1 left.
2. **naga** (The fallback line to the black water (the naga)): HP 82%, worst 51%, a hero down in 0%, wiped 0%. At the door: Barley 75%, Aurdin 78%, Vivian 80%, Lymen 93%. Drained by: troll x2 (0.28 a walk, 63 HP a fight); earthelemental x1, xorn x1 (0.20 a walk, 75 HP a fight, 0.1 down); duergar x2, stonegiant x1 (0.09 a walk, 73 HP a fight). Spent in the fights: Aurdin: casts Ice Storm 0.83, Aurdin: shield of force 0.46, Aurdin: casts Fireball 0.46, Barley: uses Potion of Healing 0.36; features: Barley secondWind 0.9 of 1 left.
3. **xorns** (Second Lamp to the seam (the xorns, leg three, Brann and Hedda)): HP 84%, worst 51%, a hero down in 0%, wiped 0%. At the door: Barley 73%, Aurdin 82%, Vivian 89%, Lymen 96%, Brann 95%, Hedda 92%. Drained by: xorn x3 (0.36 a walk, 100 HP a fight, 0.1 down); drow x6, drowcaptain x2 (0.28 a walk, 46 HP a fight); cloaker x2 (0.22 a walk, 34 HP a fight, 0.2 down). Spent in the fights: Aurdin: casts Ice Storm 1.79, Aurdin: shield of force 0.76, Aurdin: casts Fireball 0.57, Vivian: uses Potion of Healing 0.29; features: Barley secondWind 0.9 of 1 left.
4. **roper** (The grick den to the roper (past First Lamp)): HP 86%, worst 56%, a hero down in 0%, wiped 0%. At the door: Barley 76%, Aurdin 80%, Vivian 88%, Lymen 96%, Pyro 99%. Drained by: ettin x3 (0.13 a walk, 80 HP a fight, 0.1 down); grick x6 (0.23 a walk, 27 HP a fight); bugbear x2, bugbearchief x2 (0.08 a walk, 68 HP a fight). Spent in the fights: Aurdin: casts Fireball 3.22, Aurdin: shield of force 0.86, Aurdin: uses Potion of Healing 0.42, Lymen: uses Potion of Healing 0.41; features: Barley secondWind 0.9 of 1 left, Pyro indomitable 0.8 of 1 left.
5. **cutseal** (Solskaft to the cut seal (leg one, with Pyro)): HP 86%, worst 52%, a hero down in 0%, wiped 0%. At the door: Barley 75%, Aurdin 84%, Vivian 87%, Lymen 97%, Pyro 97%. Drained by: bugbear x2, bugbearchief x2 (0.10 a walk, 43 HP a fight, 0.1 down); hobgoblin x6, hobsergeant x1 (0.17 a walk, 24 HP a fight, 0.1 down); hobgoblin x5, hobsergeant x1 (0.26 a walk, 15 HP a fight). Spent in the fights: Aurdin: casts Fireball 1.32, Aurdin: shield of force 0.45, Aurdin: uses Potion of Healing 0.29, Vivian: uses Potion of Healing 0.28; features: Barley secondWind 0.9 of 1 left.

<!-- walk8: end -->

## The countdown carried (10-03, the table above rerun)

RULED 10-03 (Griz: *"yes; a map load is not a rest, but it is a game change"*): the encounter countdown carries across map loads (js/world.js Field.load; `python dev/bench8.py countdown1003`). The walker follows it by itself, and every leg's countdown now starts part-run. The table above is the rerun (`leg=all n=100`, seed 1); against round three's:
- **The short legs meet about twice the fights** (the gulch 1.0 to 1.9, the Keeper's stair 1.1 to 1.8, the brood 0 to 1.0, the Doors, the Wet and the cloaker from none to 0.2-0.4 a walk), and arrive 1-4 points lower. **The base game still reads fat.**
- **Leg one thins at its far end:** the roper's door 85% to 78% (fair to thin), the bulette's 72% to 63% with a hero down in 10 walks of 100.
- **Leg four walked straight: Deepholm's door 46% to 38%, 19 to 27 walks in 100 wiped** before its bosses (the fallback line's door 100% to 89%). That sharpens Question 1 below.
- The prose under "What it says" is round three's, kept as it was.

## What it says (round three: the group at two, the kit, the sally)

1. **With the group at two and the kit, no single leg arrives with a hero down,** and every Deep door from a full start is 80-100% (fair or fat; the floor's are still 64-100%). The hand spent, in 2,800 walks: 1,200 potions in fights and 22 after them, 873 Fireballs, 811 Ice Storms, 199 Burning Hands, 148 Shatters, 70 Cones of Cold, 588 Shields, 39 kits, the tent 16 times. Leg four's pairs now draw the area spell: the earth elemental with a xorn costs about 80 HP a fight, where it cost 130.
2. **Leg four walked straight is no longer the hole.** Third Lamp to Deepholm's door with nothing reset: the troll hole at 69% (2 walks in 100 wiped by then), the cut's walls at 57% (8), **Deepholm's door at 46%, 19 walks in 100 wiped** before any of its four bosses is counted. Round two's hand left 16% and 68 wiped; the floor still leaves 1% and 95.
3. **Sallies make leg four worse, not better.** Third Lamp sits at the near end of the leg: the naga's door is 43 steps out, the troll hole 67, the cut's walls 73, Deepholm's door 89, nearly all of it hw4 (a fight every 17 steps or so). Walked as a sally (out to a door, home to Third Lamp's bed, out to the next), the party walks some 500 steps where the straight walk takes 95, and the night gives back HP and slots but not potions, kits or the tent: the four potions are gone on the way home from the naga, a quarter of the walks are wiped by the troll hole's door, 86 in 100 by the time they would be home from it, and **none reaches Deepholm's door**. The lamps are beds for leg three and the start of leg four, not for its far end.
4. **The kit's four potions are the first thing any Deep leg spends:** by the roper on leg one there are 0.5 left a walk, by the troll hole on leg four 0.5. The road sells none (Second Lamp's stores sell torches; Solskaft's Garrison Stores sell potions, kits and tents).
5. **The dry stair at the story's 6** (the lean: *"the story's; the walker measures arrival, and 2 is the bestiary's rung"*): 99%, a fight on the way through the Warrens.

## Ruled 10-03, round two (Griz's answers to the walker's first five)

1. The AI's hand: *"both: a player's hand on the bench now, potions under half and area spells at groups; the guest turn as a queued game job, since hires fight that badly for real players too"* -- the hand is built (the table above); **the guest turn learning to cast is a game job for the queue** (js/battle.js `guestTurn`), not built here.
2. Leg four: *"the tent first, pitched once below half; rerun before any bed is added"* -- built and rerun in round two: on the straight walk the tent saved about five walks in a hundred (Deepholm's door 16% and 68 wiped with it, 9% and 73 without), its heal for the standing only.
3. Pyro's weight: *"it is the game's own rule; read it again after the hand, since the dumb AI inflates it"* -- read again in round two: with the hand the cut seal went from 67% with a hero down in 30% of walks to 86% with one down in 6%, about a Fireball a walk into the hobgoblins; the AI was most of it.
4. The countdown: *"yes; a map load is not a rest, but it is a game change"* -- **a game job for the queue** (js/world.js `Field.load` calls `resetEncounter`); the table here is still the game as it is, and wants rerunning when that lands (the cloaker, the otyugh, the Doors and the nest will meet fights).
5. The levels: *"yes, and rerun those legs"* -- the ladder's level on every leg that has a rung (the cloaker 4 to 6, the night crew 5 to 4, the roper 5 to 6, the dry stair 6 to 2, the fallback line and the naga 8 to 7), rerun in the table.

## Round three: the four leans (10-03), built as the working answers until Griz's word

The four came back with the overseer's lean in brackets (*"The four, with my lean in brackets"*); they are bench-only and built as written, and stand as leans, not rulings, until he says:

1. Leg four: *"sallies; the lamps are the beds you built. Have the walker model the sally, door to lamp to next door, before anything is added or lightened"* -- modelled (`python dev/walk8.py leg=legfoursally n=100`): item 3 above.
2. The group: *"two; a pair of trolls is 168 regenerating HP, and a player fireballs that without thinking"* -- the hand's group is two (`group=3` puts it back).
3. The kit: *"yes, as a player would"* -- after each fight, a kit on each of the four who is down, before the tent.
4. The dry stair: *"the story's; the walker measures arrival, and 2 is the bestiary's rung"* -- level 6.

## Questions

1. Leg four: walked straight, the hand reaches Deepholm's door at 46% with 19 walks in 100 wiped before its bosses are counted; in sallies from Third Lamp, none arrives. Is the straight walk the leg as meant, or does the far end want a bed (a camp past the troll hole), or a lighter hw4 table?
2. Potions: the road sells none, and the four in the kit are spent in the first fights of every Deep leg. Should Second Lamp's stores carry potions, or is Solskaft's Garrison the only shelf by design?
3. The chains count the road only. Should the walker's next step join each boss's own cost from the grid's bench (`bench16.py x fight=<id>`) to the chains, so a door shows the boss before it too?

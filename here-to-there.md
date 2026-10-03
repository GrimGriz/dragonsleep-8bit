# Here to there: what the party brings to each boss

Griz, 10-03: *"random encounters stay the 8-bit"* and *"we need to run some here-to-there 8bit benches to see what sort of resources the parties are getting to the boss battles with."*

Each leg is walked 100 times from a full start to the next boss's door: the shortest walk on the maps as the story's flags lay them, every step through the game's own encounter roll (`Field.arrive`), every fight fought to its end in the 8-bit battle. The party is tallied at the door; the boss itself is the grid's and is not fought here. The story's state, level and kit are the game's own `DS.situation` (js/situations.js) on round six's kit. How it walks and what it does not see: `here-to-there-notes.md`. **Findings, not fixes:** nothing in the game was changed.

**Two hands, the same dice.** The table is **the player's hand** (Griz, 10-03: *"a player's hand on the bench now, potions under half and area spells at groups"*; on leg four, *"the tent first, pitched once below half"*). On one of the four's turns, through the battle's own menus: a potion to whichever of the four stands lowest when he is under half (a potion wakes the downed in a fight); else, with three or more foes up, Aurdin's highest-levelled damaging area spell he has a slot for; else the guest turn. After a fight: the tent once when the four are under half, then a potion each for any still standing under half. **Floor HP** beside it is the same walks on the guest turn alone (`Battle.guestTurn`, the game's own AI: swings, Second Wind, Shield; no other spell, no potion, no Sneak Attack). Levels are the DEEP16 ladder's wherever it has a rung (Griz: *"yes, and rerun those legs"*), else the situation's.

**HP** is the four heroes' hit points at the door as a share of their maximum (a downed hero counts 0, a wiped walk counts 0); **worst** is the leanest walk of the hundred; **KO** is the share of walks that reach the door with a hero down; **slots left** is level 1/level 2/... against the maximum; **potions left** is potions + greater potions (round six's kit: 3+1); **drunk** is potions drunk a walk; **tent** the walks that pitched it. **Reading:** thin = a wipe, or HP under 60%, or a hero down in 30% or more; fat = HP 90% or more and a hero down in under 10%; fair between (the seat's cut, not a rule).

<!-- walk8: from here to the matching end line, dev/walk8.py writes; the rest of the file is the seat's -->

`python dev/walk8.py leg=all n=100 table` wrote this block (seed 1: the same seed walks the same walks). `python dev/walk8.py leg=<name> n=20` runs one leg again; `python dev/walk8.py legs` lists them.

## The table: each leg from a full start, the player's hand

| leg | lvl | steps | zones (steps) | fights | rounds | HP | worst | KO | wiped | floor HP | slots left | potions left | drunk | tent | torches lit | rested | reading |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **doors** | 4 | 44 | doors (road) 13, doors 1 | 0.0 | 0.0 | 100% | 100% | 0% | 0% | 100% | Aurdin 4/4 3/3; Lymen 3/3 | 3.0+1.0 | 0.00 | -- | 0.0 | -- | fat |
| **snoot** | 3 | 69 | north (road) 1, north 13, gulch 6, snoot 7, snoot (road) 12 | 0.6 | 2.0 | 96% | 68% | 0% | 0% | 95% | Aurdin 3.8/4 2/2; Lymen 3/3 | 2.9+1.0 | 0.14 | -- | 0.0 | -- | fat |
| **gulch** | 3 | 79 | north (road) 2, north 11, gulch 35 | 1.0 | 2.7 | 95% | 79% | 0% | 0% | 93% | Aurdin 3.6/4 2/2; Lymen 3/3 | 2.9+1.0 | 0.14 | -- | 0.0 | -- | fat |
| **wet** | 4 | 101 | north (road) 8, north 1, warrens_d 9 | 0.0 | 0.0 | 100% | 100% | 0% | 0% | 100% | Aurdin 4/4 3/3; Lymen 3/3 | 3.0+1.0 | 0.00 | -- | 1.0 | -- | fat |
| **jelly** | 4 | 113 | north (road) 8, north 1, warrens_d 21 | 0.5 | 1.4 | 98% | 88% | 0% | 0% | 98% | Aurdin 3.9/4 3/3; Lymen 3/3 | 3.0+1.0 | 0.02 | -- | 1.0 | -- | fat |
| **ooze** | 4 | 124 | north (road) 8, north 1, warrens_d 32 | 1.1 | 3.2 | 96% | 81% | 0% | 0% | 96% | Aurdin 3.9/4 3/3; Lymen 3/3 | 2.9+1.0 | 0.10 | -- | 1.0 | -- | fat |
| **crawler** | 4 | 110 | north (road) 8, north 1, warrens_d 18 | 0.4 | 1.1 | 99% | 76% | 0% | 0% | 99% | Aurdin 4/4 3/3; Lymen 3/3 | 3.0+1.0 | 0.01 | -- | 1.0 | -- | fat |
| **keeper** | 3 | 136 | north (road) 8, north 1, warrens_c 35, warrens_d 5 | 1.1 | 3.4 | 95% | 80% | 0% | 0% | 94% | Aurdin 3.6/4 2/2; Lymen 3/3 | 2.9+1.0 | 0.08 | -- | 2.0 | -- | fat |
| **cloaker** | 6 | 106 | north 10, glowseep 2, north (road) 1 | 0.0 | 0.0 | 100% | 100% | 0% | 0% | 100% | Aurdin 4/4 3/3 3/3; Lymen 4/4 2/2 | 3.0+1.0 | 0.00 | -- | 1.0 | -- | fat |
| **wagon** | 4 | 73 | north (road) 1, north 13, gulch 6, south 7 | 0.3 | 0.7 | 99% | 84% | 0% | 0% | 99% | Aurdin 4/4 3/3; Lymen 3/3 | 3.0+1.0 | 0.04 | -- | 0.0 | -- | fat |
| **chuul** | 4 | 87 | north (road) 1, north 13, gulch 6, south 7 | 0.3 | 0.8 | 99% | 84% | 0% | 0% | 99% | Aurdin 3.9/4 3/3; Lymen 3/3 | 3.0+1.0 | 0.00 | -- | 0.0 | -- | fat |
| **hask** | 4 | 157 | north (road) 8, north 1, warrens_c 35, warrens_d 5 | 1.1 | 3.0 | 97% | 80% | 0% | 0% | 96% | Aurdin 3.8/4 2.9/3; Lymen 3/3 | 3.0+1.0 | 0.03 | -- | 2.0 | -- | fat |
| **cutseal** | 5 | 91 | hw1 30 | 1.0 | 3.1 | 86% | 52% | 6% | 0% | 67% | Aurdin 3.6/4 3/3 0.9/2; Lymen 4/4 2/2 | 2.4+0.9 | 0.78 | 1% | 0.0 | -- | fair |
| **gricks** | 5 | 20 | hw1 20 | 0.9 | 3.0 | 88% | 52% | 1% | 0% | 70% | Aurdin 3.6/4 3/3 1/2; Lymen 4/4 2/2 | 2.2+0.8 | 1.02 | 2% | 0.0 | -- | fair |
| **roper** | 6 | 71 | hw1 21, hw2 38 | 2.1 | 7.0 | 87% | 50% | 8% | 0% | 79% | Aurdin 3.8/4 3/3 2/3; Lymen 4/4 2/2 | 1.7+0.7 | 1.59 | 1% | 0.0 | First Lamp 93% | fair |
| **bulette** | 5 | 23 | hw2 23 | 1.1 | 3.9 | 88% | 44% | 3% | 0% | 73% | Aurdin 3.7/4 2.9/3 1/2; Lymen 4/4 2/2 | 2.2+0.8 | 0.99 | 3% | 0.0 | -- | fair |
| **drain** | 6 | 14 | hw2 4 | 0.2 | 0.7 | 100% | 100% | 0% | 0% | 100% | Aurdin 4/4 3/3 3/3; Lymen 4/4 2/2 | 2.9+1.0 | 0.15 | 1% | 0.0 | Second Lamp 20% | fat |
| **pinned** | 6 | 29 | hw2 13 | 0.6 | 2.0 | 95% | 56% | 2% | 0% | 91% | Aurdin 3.9/4 3/3 2.4/3; Lymen 4/4 2/2 | 2.8+1.0 | 0.25 | -- | 0.0 | -- | fat |
| **stair** | 2 | 164 | north (road) 8, north 1, warrens_c 35, warrens_d 5 | 1.0 | 3.1 | 94% | 76% | 0% | 0% | 90% | Aurdin 2.6/3; Lymen 2/2 | 2.8+1.0 | 0.23 | -- | 0.0 | -- | fat |
| **brood** | 7 | 39 | hw2 13, nest 9 | 0.0 | 0.0 | 100% | 100% | 0% | 0% | 100% | Aurdin 4/4 3/3 3/3 1/1; Lymen 4/4 3/3 | 3.0+1.0 | 0.00 | -- | 0.0 | -- | fat |
| **xorns** | 8 | 35 | hw3 28 | 1.1 | 4.2 | 87% | 51% | 3% | 0% | 75% | Aurdin 3.4/4 3/3 3/3 0.8/2; Lymen 4/4 3/3 | 2.2+0.8 | 1.01 | -- | 0.0 | -- | fair |
| **giant** | 8 | 19 | hw3 19 | 1.1 | 4.6 | 86% | 56% | 6% | 0% | 75% (wiped 1%) | Aurdin 3.6/4 3/3 3/3 0.9/2; Lymen 4/4 3/3 | 2.1+0.7 | 1.14 | 6% | 0.0 | -- | fair |
| **raid** | 8 | 17 | hw3 15 | 0.9 | 3.4 | 93% | 55% | 4% | 0% | 85% | Aurdin 3.7/4 3/3 3/3 1.1/2; Lymen 4/4 3/3 | 2.5+0.9 | 0.58 | -- | 0.0 | -- | fat |
| **fallback** | 7 | 21 | hw4 12 | 0.0 | 0.0 | 100% | 100% | 0% | 0% | 100% | Aurdin 4/4 3/3 3/3 1/1; Lymen 4/4 3/3 | 3.0+1.0 | 0.00 | -- | 0.0 | -- | fat |
| **naga** | 7 | 19 | hw4 19 | 1.1 | 5.8 | 75% | 0% | 14% | 2% | 64% (wiped 4%) | Aurdin 3.3/4 3/3 3/3 0.6/1; Lymen 4/4 3/3 | 1.3+0.6 | 2.17 | 16% | 0.0 | -- | thin |
| **trolls** | 8 | 23 | hw4 23 | 1.3 | 7.0 | 75% | 0% | 17% | 1% | 64% (wiped 2%) | Aurdin 3.1/4 3/3 3/3 1.4/2; Lymen 4/4 3/3 | 1.2+0.6 | 2.26 | 14% | 0.0 | -- | thin |
| **elemental** | 8 | 15 | hw4 15 | 0.8 | 3.8 | 84% | 50% | 3% | 0% | 80% | Aurdin 3.6/4 3/3 3/3 1.6/2; Lymen 4/4 3/3 | 2.0+0.7 | 1.30 | 3% | 0.0 | -- | fair |
| **torvald** | 9 | 15 | hw4 15 | 0.8 | 4.2 | 85% | 50% | 4% | 0% | 81% | Aurdin 3.5/4 3/3 3/3 3/3 0.7/1; Lymen 4/4 3/3 2/2 | 2.0+0.8 | 1.27 | 2% | 0.0 | -- | fair |

- **the road catches**: after the wagon yard: a chase that rolls no encounters (world.js Field.arrive: `!this.chase`), so the party meets the riders with the yard's leftovers.
- **the assassins**: at Deepholm's door, the first rest after Torvald: no walk between (see the torvald leg).

## The chains: the road since the last bed

The same legs walked one after another, nothing reset between the doors and no boss fought (the grid fights those): each row is what the road alone has taken since the party last slept, the floor under what it really brings (the boss before it costs more on top). A walk that wiped earlier counts as wiped at every door after.

| chain | door | steps | fights | HP | worst | KO | wiped by then | floor HP | floor wiped | slots left | potions left | tent by then | rested on the way | reading |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| legone | **cutseal** | 91 | 1.0 | 86% | 52% | 3% | 0% | 68% | 0% | Aurdin 3.7/4 3/3 1/2; Lymen 4/4 2/2 | 2.2+0.8 | 2% | -- | fair |
| legone | **gricks** | 20 | 1.0 | 74% | 16% | 16% | 0% | 42% | 0% | Aurdin 3.2/4 2.9/3 0.1/2; Lymen 4/4 2/2 | 1.2+0.5 | 13% | -- | fair |
| legone | **roper** | 72 | 2.2 | 84% | 30% | 9% | 0% | 64% | 9% | Aurdin 3.7/4 3/3 1/2; Lymen 4/4 2/2 | 0.2+0.1 | 46% | First Lamp 100% | fair |
| legone | **bulette** | 25 | 1.2 | 68% | 0% | 35% | 0% | 39% | 14% | Aurdin 3.3/4 2.5/3 0.3/2; Lymen 4/4 2/2 | 0.1+0.1 | 57% | -- | thin |
| legone | **drain** | 16 | 0.2 | 100% | 100% | 0% | 0% | 83% | 17% | Aurdin 4/4 3/3 2/2; Lymen 4/4 2/2 | 0.1+0.1 | 59% | Second Lamp 100% | fat |
| legthree | **xorns** | 35 | 1.1 | 89% | 54% | 2% | 0% | 78% | 0% | Aurdin 3.6/4 3/3 3/3 0.9/2; Lymen 4/4 3/3 | 2.4+0.8 | -- | -- | fair |
| legthree | **giant** | 20 | 1.2 | 81% | 28% | 13% | 0% | 59% | 3% | Aurdin 3.2/4 3/3 2.6/3 0.2/2; Lymen 4/4 3/3 | 1.8+0.7 | 8% | -- | fair |
| legthree | **raid** | 16 | 0.8 | 72% | 0% | 21% | 3% | 43% | 15% | Aurdin 2.9/4 3/3 2.1/3 0.1/2; Lymen 4/4 3/3 | 1.2+0.5 | 15% | -- | thin |
| legfour | **fallback** | 21 | 0.0 | 100% | 100% | 0% | 0% | 100% | 0% | Aurdin 4/4 3/3 3/3 1/1; Lymen 4/4 3/3 | 3.0+1.0 | -- | -- | fat |
| legfour | **naga** | 20 | 1.2 | 74% | 0% | 17% | 2% | 64% | 5% | Aurdin 3.2/4 3/3 3/3 0.6/1; Lymen 4/4 3/3 | 1.2+0.5 | 17% | -- | thin |
| legfour | **trolls** | 24 | 1.4 | 43% | 0% | 62% | 22% | 20% | 42% | Aurdin 2.5/4 3/3 2.7/3 0.3/1; Lymen 4/4 3/3 | 0.3+0.1 | 62% | -- | thin |
| legfour | **elemental** | 14 | 0.9 | 29% | 0% | 73% | 45% | 7% | 71% | Aurdin 2.2/4 3/3 2.6/3 0.3/1; Lymen 4/4 3/3 | 0.1+0.1 | 70% | -- | thin |
| legfour | **torvald** | 16 | 1.2 | 16% | 0% | 83% | 68% | 1% | 95% | Aurdin 2.1/4 2.9/3 2.5/3 0.3/1; Lymen 4/4 3/3 | 0.0+0.0 | 80% | -- | thin |

## Each leg

**doors** -- Silverton to the Doors (the wall at the top of the north road). Level 4 (lvl: no fight there; round six's 4); from Silverton (Fountain Street), rested.
Path 44 steps, silverton > world. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%. Features spent: none. Spells spent: none. Silver +0 a walk.

**snoot** -- Silverton to the Snoot (the glory-seekers on the road south). Level 3; from Silverton (Fountain Street), rested.
Path 69 steps, silverton > world. At the door: Barley 93%, Aurdin 97%, Vivian 97%, Lymen 98%. Features spent: none. Spells spent: Aurdin: casts Burning Hands 0.18, Barley: uses Potion of Healing 0.09, Aurdin: shield of force 0.06, Aurdin: uses Potion of Healing 0.03. Silver +4 a walk.
The road's fights: gnoll x3 (0.09 a walk, 14 HP a fight); gnoll x2 (0.16 a walk, 7 HP a fight); worg x2 (0.04 a walk, 26 HP a fight); gnoll x2, hyena x1 (0.03 a walk, 12 HP a fight).

**gulch** -- Silverton to Web Gulch (the braiding ettercap). Level 3; from Silverton (Fountain Street), rested.
Path 79 steps, silverton > world > gulch. At the door: Barley 92%, Aurdin 95%, Vivian 95%, Lymen 98%. Features spent: none. Spells spent: Aurdin: casts Burning Hands 0.23, Aurdin: shield of force 0.13, Vivian: uses Potion of Healing 0.06, Aurdin: uses Potion of Healing 0.03. Silver +4 a walk.
The road's fights: wolfspider x3 (0.33 a walk, 7 HP a fight); wolfspider x2 (0.36 a walk, 6 HP a fight); giantspider x1 (0.25 a walk, 3 HP a fight); giantspider x1, wolfspider x2 (0.04 a walk, 14 HP a fight).

**wet** -- Silverton to the Wet: the otyugh (the landlord's step). Level 4; from Silverton (Fountain Street), rested.
Path 101 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%. Features spent: none. Spells spent: none. Silver +0 a walk.

**jelly** -- Silverton to the Wet: the ochre jelly. Level 4 (lvl: the Wet's situation); from Silverton (Fountain Street), rested.
Path 113 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 98%, Aurdin 98%, Vivian 98%, Lymen 99%. Features spent: none. Spells spent: Aurdin: shield of force 0.06, Vivian: uses Potion of Healing 0.01, Barley: uses Potion of Healing 0.01. Silver +1 a walk.
The road's fights: crawler x1 (0.24 a walk, 7 HP a fight); ratswarm x2 (0.06 a walk, 8 HP a fight); ratswarm x1 (0.05 a walk, 6 HP a fight); grayooze x1 (0.11 a walk, 1 HP a fight).

**ooze** -- Silverton to the Wet: the gray ooze in the pool. Level 4 (lvl: the Wet's situation); from Silverton (Fountain Street), rested.
Path 124 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 92%, Aurdin 95%, Vivian 97%, Lymen 99%. Features spent: none. Spells spent: Aurdin: shield of force 0.15, Barley: uses Potion of Healing 0.04, Lymen: uses Potion of Healing 0.02, Vivian: uses Potion of Healing 0.02. Silver +3 a walk.
The road's fights: crawler x1 (0.47 a walk, 9 HP a fight); ratswarm x2 (0.13 a walk, 10 HP a fight); darkmantle x2 (0.07 a walk, 6 HP a fight); grayooze x1 (0.26 a walk, 1 HP a fight).

**crawler** -- Silverton to the Wet: the crawler at the deep cradle. Level 4 (lvl: the Wet's situation); from Silverton (Fountain Street), rested.
Path 110 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 99%, Aurdin 99%, Vivian 98%, Lymen 99%. Features spent: none. Spells spent: Aurdin: shield of force 0.03, Barley: uses Potion of Healing 0.01. Silver +1 a walk.
The road's fights: ratswarm x2 (0.07 a walk, 12 HP a fight); crawler x1 (0.11 a walk, 6 HP a fight); ratswarm x1 (0.08 a walk, 4 HP a fight); grayooze x1 (0.06 a walk, 2 HP a fight).

**keeper** -- Silverton to the flooded stair (the Keeper). Level 3; from Silverton (Fountain Street), rested.
Path 136 steps, silverton > world > warrens_a > warrens_c > warrens_d. At the door: Barley 92%, Aurdin 95%, Vivian 95%, Lymen 98%. Features spent: none. Spells spent: Aurdin: casts Burning Hands 0.19, Aurdin: shield of force 0.16, Barley: uses Potion of Healing 0.03, Vivian: uses Potion of Healing 0.02. Silver +5 a walk.
The road's fights: ratswarm x2 (0.19 a walk, 10 HP a fight); ratswarm x1 (0.16 a walk, 4 HP a fight); darkmantle x2 (0.07 a walk, 8 HP a fight); giantrat x3 (0.11 a walk, 5 HP a fight).

**cloaker** -- Silverton to the cloaker (the guano mine, down the slide). Level 6 (lvl: the ladder's (Griz, 10-03: "yes, and rerun those legs"; the situation had 4)); from Silverton (Fountain Street), rested.
Path 106 steps, silverton > world > galleries_g1 > galleries_g2 > galleries_g4. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%. Features spent: none. Spells spent: none. Silver +0 a walk.

**wagon** -- Silverton to the Halfway Inn (the wagon night; the road catches after it). Level 4; from Silverton (Fountain Street), rested. The story long-rests at the inn before the wagon rolls in (events.js EV.longRest, Griz 09-25), and the road catches follow the yard fight in a chase that rolls no encounters: both are fought full or on the yard's leftovers, not on this walk.
Path 73 steps, silverton > world > halfway > halfway_in. At the door: Barley 98%, Aurdin 99%, Vivian 99%, Lymen 100%. Features spent: none. Spells spent: Aurdin: casts Shatter 0.04, Lymen: uses Potion of Healing 0.02, Aurdin: uses Potion of Healing 0.01, Aurdin: shield of force 0.01. Silver +1 a walk.
The road's fights: worg x2 (0.04 a walk, 22 HP a fight); worg x1 (0.06 a walk, 5 HP a fight); axebeak x2 (0.04 a walk, 6 HP a fight); axebeak x1 (0.06 a walk, 2 HP a fight).

**chuul** -- Silverton to the lake (the point: the chuul). Level 4; from Silverton (Fountain Street), rested. By the story the chuul comes after a night at the inn holding the ring (a long rest): this is the walk to the water, or the rowboat's poke by day.
Path 87 steps, silverton > world > halfway. At the door: Barley 99%, Aurdin 98%, Vivian 98%, Lymen 100%. Features spent: none. Spells spent: Aurdin: shield of force 0.06, Aurdin: casts Shatter 0.02. Silver +1 a walk.
The road's fights: axebeak x2 (0.09 a walk, 10 HP a fight); worg x2 (0.02 a walk, 16 HP a fight); bandit x3 (0.03 a walk, 9 HP a fight); bandit x2 (0.02 a walk, 7 HP a fight).

**hask** -- Silverton to the night crew at the niches (Hask, the Burial). Level 4 (lvl: the ladder's (Griz, 10-03: "yes, and rerun those legs"; the situation had 5)); from Silverton (Fountain Street), rested.
Path 157 steps, silverton > world > warrens_a > warrens_c > warrens_d > burial. At the door: Barley 95%, Aurdin 96%, Vivian 97%, Lymen 98%. Features spent: none. Spells spent: Aurdin: shield of force 0.22, Aurdin: casts Shatter 0.12, Aurdin: uses Potion of Healing 0.03. Silver +5 a walk.
The road's fights: ratswarm x2 (0.17 a walk, 8 HP a fight); giantrat x3 (0.09 a walk, 8 HP a fight); giantrat x4 (0.08 a walk, 8 HP a fight); ratswarm x1 (0.17 a walk, 3 HP a fight).

**cutseal** -- Solskaft to the cut seal (leg one, with Pyro). Level 5; from Solskaft, after a night (the cots).
Path 91 steps, solskaft > solskaft_deep > highway_1. At the door: Barley 76% down 3%, Aurdin 83% down 3%, Vivian 91%, Lymen 96%, Pyro (guest) 99%. Features spent: none. Spells spent: Aurdin: casts Fireball 1.06, Aurdin: shield of force 0.37, Aurdin: uses Potion of Healing 0.19, Barley: uses Potion of Healing 0.16. Silver +46 a walk.
The road's fights: bugbear x2, bugbearchief x2 (0.06 a walk, 84 HP a fight, 0.5 down); hobgoblin x6, hobsergeant x1 (0.17 a walk, 26 HP a fight); goblin x2, ogre x4 (0.08 a walk, 32 HP a fight); hobgoblin x5, hobsergeant x1 (0.14 a walk, 18 HP a fight, 0.1 down).

**gricks** -- The cut seal to the grick den. Level 5; from the cut seal.
Path 20 steps, highway_1. At the door: Barley 80%, Aurdin 82% down 1%, Vivian 91%, Lymen 96%, Pyro (guest) 99%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: casts Fireball 0.96, Aurdin: shield of force 0.41, Aurdin: uses Potion of Healing 0.22, Lymen: uses Potion of Healing 0.22. Silver +43 a walk.
The road's fights: bugbear x2, bugbearchief x2 (0.06 a walk, 88 HP a fight, 0.2 down); bugbear x5, goblin x3 (0.07 a walk, 47 HP a fight); hobgoblin x5, hobsergeant x1 (0.12 a walk, 26 HP a fight); hobgoblin x6, hobsergeant x1 (0.16 a walk, 18 HP a fight).

**roper** -- The grick den to the roper (past First Lamp). Level 6 (lvl: the ladder's (Griz, 10-03: "yes, and rerun those legs"; the situation had 5, leg one's)); from the grick den.
Path 71 steps, highway_1 > highway_2. At the door: Barley 77% down 3%, Aurdin 88% down 4%, Vivian 89% down 1%, Lymen 97%, Pyro (guest) 99%. Features spent: Barley secondWind 0.9 of 1 left, Pyro indomitable 0.9 of 1 left. Spells spent: Aurdin: casts Fireball 2.08, Aurdin: shield of force 0.75, Lymen: uses Potion of Healing 0.36, Barley: uses Potion of Healing 0.31. Silver +54 a walk.
The road's fights: cube x2, mouther x1 (0.12 a walk, 65 HP a fight, 0.5 down); ettin x3 (0.07 a walk, 82 HP a fight, 0.1 down); bugbear x1, bugbearchief x2 (0.07 a walk, 65 HP a fight); hobgoblin x6, hobsergeant x1 (0.14 a walk, 28 HP a fight).

**bulette** -- The roper to the bulette. Level 5; from the roper's fork.
Path 23 steps, highway_2. At the door: Barley 78% down 3%, Aurdin 90% down 1%, Vivian 89%, Lymen 96%, Pyro (guest) 99%. Features spent: Barley secondWind 0.9 of 1 left, Pyro indomitable 0.9 of 1 left. Spells spent: Aurdin: casts Fireball 0.98, Aurdin: shield of force 0.26, Barley: uses Potion of Healing 0.26, Lymen: uses Potion of Healing 0.21. Silver +10 a walk.
The road's fights: ettin x3 (0.10 a walk, 78 HP a fight, 0.4 down); grick x6 (0.11 a walk, 31 HP a fight); mouther x3 (0.13 a walk, 19 HP a fight); grick x4 (0.12 a walk, 20 HP a fight).

**drain** -- The bulette to the drain cut (past Second Lamp). Level 6 (lvl: the ladder's); from the breach (the bulette).
Path 14 steps, highway_2. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%, Pyro (guest) 100%. Features spent: none. Spells spent: Aurdin: casts Fireball 0.18, Aurdin: shield of force 0.05, Barley: uses Potion of Healing 0.04, Vivian: uses Potion of Healing 0.03. Silver +2 a walk.
The road's fights: ettin x3 (0.03 a walk, 83 HP a fight, 0.7 down); phasespider x3 (0.04 a walk, 26 HP a fight); mouther x3 (0.04 a walk, 16 HP a fight); phasespider x4 (0.01 a walk, 30 HP a fight).

**pinned** -- The drain cut to the north cut (the phase spiders, Halldor pinned). Level 6; from the drain cut.
Path 29 steps, highway_2 > pinned. At the door: Barley 91% down 1%, Aurdin 94% down 1%, Vivian 95%, Lymen 99%, Pyro (guest) 100%. Features spent: Pyro indomitable 0.9 of 1 left. Spells spent: Aurdin: casts Fireball 0.57, Aurdin: shield of force 0.15, Aurdin: uses Potion of Healing 0.08, Vivian: uses Potion of Healing 0.06. Silver +5 a walk.
The road's fights: ettin x3 (0.04 a walk, 80 HP a fight, 0.2 down); ettin x1 (0.07 a walk, 26 HP a fight); cube x2, mouther x1 (0.03 a walk, 53 HP a fight, 0.3 down); mouther x4 (0.08 a walk, 19 HP a fight).

**stair** -- Solskaft to the dry stair (the crew boss holding it). Level 2 (lvl: the ladder's (Griz, 10-03: "yes, and rerun those legs"; the situation had 6, the spine's: the stair comes after beat 10, where Ragna asks for the water; the ladder's 2 is its rung)); from Solskaft, after a night (the cots).
Path 164 steps, solskaft > silverton > world > warrens_a > warrens_c > warrens_d. At the door: Barley 89%, Aurdin 96%, Vivian 93%, Lymen 99%. Features spent: none. Spells spent: Aurdin: casts Burning Hands 0.26, Aurdin: shield of force 0.13, Barley: uses Potion of Healing 0.07, Lymen: uses Potion of Healing 0.06. Silver +5 a walk.
The road's fights: ratswarm x2 (0.18 a walk, 9 HP a fight); giantrat x4 (0.12 a walk, 7 HP a fight); crewboss x1, robber x3 (0.07 a walk, 8 HP a fight); darkmantle x2 (0.07 a walk, 6 HP a fight).

**brood** -- Second Lamp to the nest (the Broodmother, Halldor and four troopers). Level 7; from Second Lamp (the road menu's fast travel), after a night there.
Path 39 steps, highway_2 > pinned > nest. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%, Halldor (guest) 100%, Trooper nest1 (guest) 100%, Trooper nest2 (guest) 100%, Trooper nest3 (guest) 100%, Trooper nest4 (guest) 100%. Features spent: none. Spells spent: none. Silver +0 a walk.

**xorns** -- Second Lamp to the seam (the xorns, leg three, Brann and Hedda). Level 8 (lvl: the raid's situation); from Second Lamp (fast travel; Third Lamp is the drow's), after a night there.
Path 35 steps, highway_2 > highway_3. At the door: Barley 77% down 2%, Aurdin 86% down 1%, Vivian 90%, Lymen 96%, Brann (guest) 95%, Hedda (guest) 94%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: casts Ice Storm 1.20, Aurdin: shield of force 0.59, Lymen: uses Potion of Healing 0.23, Vivian: uses Potion of Healing 0.21. Silver +83 a walk.
The road's fights: xorn x3 (0.28 a walk, 112 HP a fight, 0.1 down); drow x6, drowcaptain x2 (0.20 a walk, 49 HP a fight, 0.1 down); drow x4, drowcaptain x2 (0.11 a walk, 46 HP a fight); cloaker x2 (0.10 a walk, 16 HP a fight).

**giant** -- The seam to the giant's camp. Level 8; from the seam (the xorns).
Path 19 steps, highway_3. At the door: Barley 74% down 5%, Aurdin 88%, Vivian 91% down 1%, Lymen 97%, Brann (guest) 95% down 1%, Hedda (guest) 95%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: casts Ice Storm 1.09, Aurdin: shield of force 0.39, Vivian: uses Potion of Healing 0.24, Lymen: uses Potion of Healing 0.23. Silver +76 a walk.
The road's fights: xorn x3 (0.24 a walk, 128 HP a fight, 0.1 down); cloaker x2 (0.21 a walk, 52 HP a fight, 0.2 down); drow x6, drowcaptain x2 (0.13 a walk, 56 HP a fight); drow x4, drowcaptain x2 (0.13 a walk, 33 HP a fight).

**raid** -- The giant's camp to Third Lamp (the raid). Level 8; from the giant's camp.
Path 17 steps, highway_3. At the door: Barley 88%, Aurdin 90% down 2%, Vivian 94% down 2%, Lymen 99%, Brann (guest) 97%, Hedda (guest) 97%. Features spent: none. Spells spent: Aurdin: casts Ice Storm 0.90, Aurdin: shield of force 0.34, Aurdin: uses Potion of Healing 0.14, Lymen: uses Potion of Healing 0.12. Silver +65 a walk.
The road's fights: xorn x3 (0.09 a walk, 111 HP a fight, 0.1 down); cloaker x2 (0.19 a walk, 26 HP a fight, 0.2 down); drow x4, drowcaptain x2 (0.11 a walk, 40 HP a fight); drow x6, drowcaptain x2 (0.10 a walk, 37 HP a fight).

**fallback** -- Third Lamp to the drow's fallback line (leg four). Level 7 (lvl: the ladder's (Griz, 10-03: "yes, and rerun those legs"; the situation had 8)); from Third Lamp, lit, after a night there.
Path 21 steps, highway_3 > highway_4. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%. Features spent: none. Spells spent: none. Silver +0 a walk.

**naga** -- The fallback line to the black water (the naga). Level 7 (lvl: the ladder's (Griz, 10-03: "yes, and rerun those legs"; the situation had 8)); from the fallback line.
Path 19 steps, highway_4. At the door: Barley 63% down 9%, Aurdin 69% down 6%, Vivian 79% down 7%, Lymen 88% down 2%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: shield of force 0.71, Lymen: uses Potion of Healing 0.48, Vivian: uses Potion of Healing 0.46, Aurdin: uses Potion of Healing 0.41. Silver +39 a walk.
The road's fights: earthelemental x1, xorn x1 (0.24 a walk, 131 HP a fight, 0.8 down); troll x2 (0.27 a walk, 101 HP a fight, 0.2 down); duergar x2, stonegiant x1 (0.09 a walk, 81 HP a fight, 0.1 down); duergar x3, stonegiant x1 (0.09 a walk, 66 HP a fight).

**trolls** -- The black water to the troll hole. Level 8; from the causeway (the naga).
Path 23 steps, highway_4. At the door: Barley 65% down 6%, Aurdin 62% down 14%, Vivian 79% down 5%, Lymen 90% down 1%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: shield of force 0.93, Aurdin: casts Ice Storm 0.55, Barley: uses Potion of Healing 0.53, Lymen: uses Potion of Healing 0.45. Silver +52 a walk.
The road's fights: earthelemental x1, xorn x1 (0.24 a walk, 129 HP a fight, 0.5 down); troll x2 (0.31 a walk, 94 HP a fight, 0.4 down); duergar x3, stonegiant x1 (0.14 a walk, 94 HP a fight, 0.1 down); duergar x2, stonegiant x1 (0.15 a walk, 68 HP a fight, 0.1 down).

**elemental** -- The troll hole to the cut's walls (the earth elemental). Level 8; from the troll hole.
Path 15 steps, highway_4. At the door: Barley 77% down 2%, Aurdin 80% down 2%, Vivian 88%, Lymen 92%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: shield of force 0.44, Aurdin: casts Ice Storm 0.39, Barley: uses Potion of Healing 0.30, Lymen: uses Potion of Healing 0.27. Silver +33 a walk.
The road's fights: troll x2 (0.19 a walk, 100 HP a fight, 0.1 down); earthelemental x1, xorn x1 (0.10 a walk, 133 HP a fight, 0.2 down); duergar x3, stonegiant x1 (0.11 a walk, 84 HP a fight, 0.1 down); duergar x2, stonegiant x1 (0.04 a walk, 90 HP a fight).

**torvald** -- The cut's walls to Deepholm's door (Torvald; the sect's blades come at the next rest there). Level 9 (lvl: the situation's 9 (off the ladder: a story fight)); from the made road's cut (the elemental). The assassins come when the party first rests at the door after Torvald (deep.js EV.rest): the same state as Torvald's door, less whatever Torvald cost.
Path 15 steps, highway_4 > threshold. At the door: Barley 78% down 1%, Aurdin 79% down 3%, Vivian 89% down 1%, Lymen 92%. Features spent: Barley secondWind 0.9 of 1 left, Barley indomitable 0.9 of 1 left. Spells spent: Aurdin: shield of force 0.51, Barley: uses Potion of Healing 0.34, Aurdin: casts Cone of Cold 0.26, Vivian: uses Potion of Healing 0.23. Silver +27 a walk.
The road's fights: troll x2 (0.24 a walk, 102 HP a fight, 0.1 down); earthelemental x1, xorn x1 (0.17 a walk, 107 HP a fight, 0.1 down); duergar x2, stonegiant x1 (0.12 a walk, 62 HP a fight); duergar x3, stonegiant x1 (0.09 a walk, 54 HP a fight).

## The five that arrive thinnest (from a full start), and what drained them

1. **naga** (The fallback line to the black water (the naga)): HP 75%, worst 0%, a hero down in 14%, wiped 2%. At the door: Barley 63% (down 9%), Aurdin 69% (down 6%), Vivian 79% (down 7%), Lymen 88% (down 2%). Drained by: earthelemental x1, xorn x1 (0.24 a walk, 131 HP a fight, 0.8 down); troll x2 (0.27 a walk, 101 HP a fight, 0.2 down); duergar x2, stonegiant x1 (0.09 a walk, 81 HP a fight, 0.1 down). Spent in the fights: Aurdin: shield of force 0.71, Lymen: uses Potion of Healing 0.48, Vivian: uses Potion of Healing 0.46, Aurdin: uses Potion of Healing 0.41; features: Barley secondWind 0.9 of 1 left.
2. **trolls** (The black water to the troll hole): HP 75%, worst 0%, a hero down in 17%, wiped 1%. At the door: Barley 65% (down 6%), Aurdin 62% (down 14%), Vivian 79% (down 5%), Lymen 90% (down 1%). Drained by: earthelemental x1, xorn x1 (0.24 a walk, 129 HP a fight, 0.5 down); troll x2 (0.31 a walk, 94 HP a fight, 0.4 down); duergar x3, stonegiant x1 (0.14 a walk, 94 HP a fight, 0.1 down). Spent in the fights: Aurdin: shield of force 0.93, Aurdin: casts Ice Storm 0.55, Barley: uses Potion of Healing 0.53, Lymen: uses Potion of Healing 0.45; features: Barley secondWind 0.9 of 1 left.
3. **elemental** (The troll hole to the cut's walls (the earth elemental)): HP 84%, worst 50%, a hero down in 3%, wiped 0%. At the door: Barley 77% (down 2%), Aurdin 80% (down 2%), Vivian 88%, Lymen 92%. Drained by: troll x2 (0.19 a walk, 100 HP a fight, 0.1 down); earthelemental x1, xorn x1 (0.10 a walk, 133 HP a fight, 0.2 down); duergar x3, stonegiant x1 (0.11 a walk, 84 HP a fight, 0.1 down). Spent in the fights: Aurdin: shield of force 0.44, Aurdin: casts Ice Storm 0.39, Barley: uses Potion of Healing 0.30, Lymen: uses Potion of Healing 0.27; features: Barley secondWind 0.9 of 1 left.
4. **torvald** (The cut's walls to Deepholm's door (Torvald; the sect's blades come at the next rest there)): HP 85%, worst 50%, a hero down in 4%, wiped 0%. At the door: Barley 78% (down 1%), Aurdin 79% (down 3%), Vivian 89% (down 1%), Lymen 92%. Drained by: troll x2 (0.24 a walk, 102 HP a fight, 0.1 down); earthelemental x1, xorn x1 (0.17 a walk, 107 HP a fight, 0.1 down); duergar x2, stonegiant x1 (0.12 a walk, 62 HP a fight). Spent in the fights: Aurdin: shield of force 0.51, Barley: uses Potion of Healing 0.34, Aurdin: casts Cone of Cold 0.26, Vivian: uses Potion of Healing 0.23; features: Barley secondWind 0.9 of 1 left, Barley indomitable 0.9 of 1 left.
5. **cutseal** (Solskaft to the cut seal (leg one, with Pyro)): HP 86%, worst 52%, a hero down in 6%, wiped 0%. At the door: Barley 76% (down 3%), Aurdin 83% (down 3%), Vivian 91%, Lymen 96%, Pyro 99%. Drained by: bugbear x2, bugbearchief x2 (0.06 a walk, 84 HP a fight, 0.5 down); hobgoblin x6, hobsergeant x1 (0.17 a walk, 26 HP a fight); goblin x2, ogre x4 (0.08 a walk, 32 HP a fight). Spent in the fights: Aurdin: casts Fireball 1.06, Aurdin: shield of force 0.37, Aurdin: uses Potion of Healing 0.19, Barley: uses Potion of Healing 0.16.

<!-- walk8: end -->

## What it says

1. **The hand lifts the Deep by 10 to 20 points of HP and halves the downed.** From a full start, every Deep door is now 75-100% (the floor's were 64-100%). Leg one's cut seal goes from 67% with a hero down in 30% to 86% with one down in 6%; Aurdin throws a Fireball a walk into the hobgoblin warband there. **Pyro's weight, read again after the hand** (his ruling: *"read it again after the hand, since the dumb AI inflates it"*): with the hand the 1.375x groups of leg one read fair, not thin; the AI was most of it.
2. **What the hand spends:** in 2,800 walks, 1,530 potions (1,509 in fights, 21 after them), 593 Fireballs, 452 Ice Storms, 86 Burning Hands, 26 Cones of Cold, 25 Shatters, 691 Shields, the tent 49 times. The kit's four potions are the first thing to go: by the roper's door on leg one there are 0.3 left a walk, and the road sells none (Second Lamp's stores sell torches; Solskaft's Garrison Stores sell potions, kits and tents).
3. **The base game is unchanged by the hand:** 95-100% at every door, and no walk reaches one with a hero down. The cloaker (now at the ladder's 6), the otyugh and the Doors still meet no fight.
4. **Leg four is still the hole, and the tent doesn't fill it.** Walked from Third Lamp to Deepholm's door with nothing reset (at the ladder's 7): the hand arrives at the troll hole at 43% (22% wiped by then), the cut's walls at 29% (45%), **Deepholm's door at 16%, with 68 walks in 100 wiped**. The tent was pitched in 80% of those walks; without it, 9% and 73 wiped; the floor, 1% and 95. So the tent buys about five walks in a hundred. Its heal is for the standing only (the game's tent: half their maximum to those up), and leg four's fights put heroes down.
5. **Leg four's worst groups are pairs.** Two trolls, and an earth elemental with a xorn, cost about 95-135 HP a fight, and at two foes the hand's three-foe line keeps Aurdin swinging his staff. With an area spell at two foes (`group=2`), Deepholm's door goes to 30% HP and 46 walks wiped (16% and 53 without the tent).
6. **The ladder's levels:** the roper at 6 arrives at 87% (the floor at 6: 79%); the night crew at 4 at 97%; the dry stair at the ladder's 2 at 94% (the Warrens' rats and crawlers are mild at any level); the fallback line and the naga at 7, the naga's door 75% with a hero down in 14%, with the troll hole's the leanest of the single legs.

## Ruled 10-03 (Griz's answers to the first five)

1. The AI's hand: *"both: a player's hand on the bench now, potions under half and area spells at groups; the guest turn as a queued game job, since hires fight that badly for real players too"* -- the hand is built (the table above); **the guest turn learning to cast is a game job for the queue** (js/battle.js `guestTurn`), not built here.
2. Leg four: *"the tent first, pitched once below half; rerun before any bed is added"* -- built and rerun: item 4 above.
3. Pyro's weight: *"it is the game's own rule; read it again after the hand, since the dumb AI inflates it"* -- read again: item 1 above.
4. The countdown: *"yes; a map load is not a rest, but it is a game change"* -- **a game job for the queue** (js/world.js `Field.load` calls `resetEncounter`); the table here is still the game as it is, and wants rerunning when that lands (the cloaker, the otyugh, the Doors and the nest will meet fights).
5. The levels: *"yes, and rerun those legs"* -- the ladder's level on every leg that has a rung (the cloaker 4 to 6, the night crew 5 to 4, the roper 5 to 6, the dry stair 6 to 2, the fallback line and the naga 8 to 7), rerun in the table.

## Questions

1. Leg four with the hand and the tent still wipes 68 walks in 100 before Deepholm's door. A player can walk back to Third Lamp to sleep after any boss: is leg four meant to be walked in sallies from Third Lamp, or does it want a bed on the way, or a lighter hw4 table?
2. The hand's group is three foes. Leg four's worst fights are pairs; at two, Deepholm's door goes from 68 walks wiped to 46. Keep three, or call two a group?
3. A downed hero stays down through the tent (it heals the standing). Add a kit on the downed after a fight to the hand, as a player would?
4. The dry stair at the ladder's 2: the story puts it after beat 10 (the party at 6 or so) and the ladder's 2 is its bestiary rung. Keep 2, or the story's level for that one leg?

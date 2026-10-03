# Here to there: what the party brings to each boss

Griz, 10-03: *"random encounters stay the 8-bit"* and *"we need to run some here-to-there 8bit benches to see what sort of resources the parties are getting to the boss battles with."*

Each leg is walked 100 times from a full start to the next boss's door: the shortest walk on the maps as the story's flags lay them, every step through the game's own encounter roll (`Field.arrive`), every fight fought to its end in the 8-bit battle with **every hero on the guest turn** (`Battle.guestTurn`, the game's own AI). The party is tallied at the door; the boss itself is the grid's and is not fought here. The story's state, level and kit are the game's own `DS.situation` (js/situations.js) on round six's kit. How it walks and what it does not see: `here-to-there-notes.md`. **Findings, not fixes:** nothing in the game was changed.

**HP** is the four heroes' hit points at the door as a share of their maximum (a downed hero counts 0, a wiped walk counts 0); **worst** is the leanest walk of the hundred; **KO** is the share of walks that reach the door with a hero down; **slots left** is level 1/level 2/... against the maximum. **Reading:** thin = a wipe, or HP under 60%, or a hero down in 30% or more; fat = HP 90% or more and a hero down in under 10%; fair between (the seat's cut, not a rule).

<!-- walk8: from here to the matching end line, dev/walk8.py writes; the rest of the file is the seat's -->

`python dev/walk8.py leg=all n=100 table` wrote this block (seed 1: the same seed walks the same walks). `python dev/walk8.py leg=<name> n=20` runs one leg again; `python dev/walk8.py legs` lists them.

## The table: each leg from a full start

| leg | lvl | steps | zones (steps) | fights | rounds | HP | worst | KO | wiped | slots left | potions | torches lit | rested | reading |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **doors** | 4 | 44 | doors (road) 13, doors 1 | 0.0 | 0.0 | 100% | 100% | 0% | 0% | Aurdin 4/4 3/3; Lymen 3/3 | 3.0+1.0 | 0.0 | -- | fat |
| **snoot** | 3 | 69 | north (road) 1, north 13, gulch 6, snoot 7, snoot (road) 12 | 0.6 | 2.0 | 95% | 62% | 1% | 0% | Aurdin 3.9/4 2/2; Lymen 3/3 | 3.0+1.0 | 0.0 | -- | fat |
| **gulch** | 3 | 79 | north (road) 2, north 11, gulch 35 | 1.0 | 2.9 | 93% | 63% | 1% | 0% | Aurdin 3.9/4 2/2; Lymen 3/3 | 3.0+1.0 | 0.0 | -- | fat |
| **wet** | 4 | 101 | north (road) 8, north 1, warrens_d 9 | 0.0 | 0.0 | 100% | 100% | 0% | 0% | Aurdin 4/4 3/3; Lymen 3/3 | 3.0+1.0 | 1.0 | -- | fat |
| **jelly** | 4 | 113 | north (road) 8, north 1, warrens_d 21 | 0.5 | 1.4 | 98% | 88% | 0% | 0% | Aurdin 3.9/4 3/3; Lymen 3/3 | 3.0+1.0 | 1.0 | -- | fat |
| **ooze** | 4 | 124 | north (road) 8, north 1, warrens_d 32 | 1.1 | 3.1 | 96% | 77% | 0% | 0% | Aurdin 3.9/4 3/3; Lymen 3/3 | 3.0+1.0 | 1.0 | -- | fat |
| **crawler** | 4 | 110 | north (road) 8, north 1, warrens_d 18 | 0.4 | 1.1 | 99% | 76% | 0% | 0% | Aurdin 4/4 3/3; Lymen 3/3 | 3.0+1.0 | 1.0 | -- | fat |
| **keeper** | 3 | 136 | north (road) 8, north 1, warrens_c 35, warrens_d 5 | 1.1 | 3.5 | 94% | 70% | 0% | 0% | Aurdin 3.8/4 2/2; Lymen 3/3 | 3.0+1.0 | 2.0 | -- | fat |
| **cloaker** | 4 | 106 | north 10, glowseep 2, north (road) 1 | 0.0 | 0.0 | 100% | 100% | 0% | 0% | Aurdin 4/4 3/3; Lymen 3/3 | 3.0+1.0 | 1.0 | -- | fat |
| **wagon** | 4 | 73 | north (road) 1, north 13, gulch 6, south 7 | 0.3 | 0.8 | 99% | 75% | 0% | 0% | Aurdin 4/4 3/3; Lymen 3/3 | 3.0+1.0 | 0.0 | -- | fat |
| **chuul** | 4 | 87 | north (road) 1, north 13, gulch 6, south 7 | 0.3 | 0.8 | 99% | 84% | 0% | 0% | Aurdin 3.9/4 3/3; Lymen 3/3 | 3.0+1.0 | 0.0 | -- | fat |
| **hask** | 5 | 157 | north (road) 8, north 1, warrens_c 35, warrens_d 5 | 1.1 | 2.5 | 98% | 89% | 0% | 0% | Aurdin 3.9/4 3/3 2/2; Lymen 4/4 2/2 | 3.0+1.0 | 2.0 | -- | fat |
| **cutseal** | 5 | 91 | hw1 30 | 1.0 | 5.1 | 67% | 28% | 30% | 0% | Aurdin 3.4/4 3/3 2/2; Lymen 4/4 2/2 | 3.0+1.0 | 0.0 | -- | thin |
| **gricks** | 5 | 20 | hw1 20 | 0.9 | 4.6 | 70% | 18% | 28% | 0% | Aurdin 3.4/4 3/3 2/2; Lymen 4/4 2/2 | 3.0+1.0 | 0.0 | -- | fair |
| **roper** | 5 | 71 | hw1 21, hw2 38 | 2.2 | 10.9 | 70% | 0% | 29% | 1% | Aurdin 3.4/4 3/3 2/2; Lymen 4/4 2/2 | 3.0+1.0 | 0.0 | First Lamp 93% | thin |
| **bulette** | 5 | 23 | hw2 23 | 1.1 | 5.4 | 73% | 0% | 26% | 0% | Aurdin 3.4/4 3/3 2/2; Lymen 4/4 2/2 | 3.0+1.0 | 0.0 | -- | fair |
| **drain** | 6 | 14 | hw2 4 | 0.2 | 0.9 | 100% | 100% | 0% | 0% | Aurdin 4/4 3/3 3/3; Lymen 4/4 2/2 | 3.0+1.0 | 0.0 | Second Lamp 20% | fat |
| **pinned** | 6 | 29 | hw2 13 | 0.6 | 2.6 | 91% | 44% | 5% | 0% | Aurdin 3.7/4 3/3 3/3; Lymen 4/4 2/2 | 3.0+1.0 | 0.0 | -- | fat |
| **stair** | 6 | 164 | north (road) 8, north 1, warrens_c 35, warrens_d 5 | 1.0 | 2.3 | 99% | 92% | 0% | 0% | Aurdin 3.9/4 3/3 3/3; Lymen 4/4 2/2 | 3.0+1.0 | 0.0 | -- | fat |
| **brood** | 7 | 39 | hw2 13, nest 9 | 0.0 | 0.0 | 100% | 100% | 0% | 0% | Aurdin 4/4 3/3 3/3 1/1; Lymen 4/4 3/3 | 3.0+1.0 | 0.0 | -- | fat |
| **xorns** | 8 | 35 | hw3 28 | 1.1 | 6.1 | 75% | 27% | 20% | 0% | Aurdin 3.2/4 3/3 3/3 2/2; Lymen 4/4 3/3 | 3.0+1.0 | 0.0 | -- | fair |
| **giant** | 8 | 19 | hw3 19 | 1.1 | 6.5 | 75% | 0% | 19% | 1% | Aurdin 3.2/4 3/3 3/3 2/2; Lymen 4/4 3/3 | 3.0+1.0 | 0.0 | -- | thin |
| **raid** | 8 | 17 | hw3 15 | 0.9 | 4.9 | 85% | 30% | 10% | 0% | Aurdin 3.4/4 3/3 3/3 2/2; Lymen 4/4 3/3 | 3.0+1.0 | 0.0 | -- | fair |
| **fallback** | 8 | 21 | hw4 12 | 0.0 | 0.0 | 100% | 100% | 0% | 0% | Aurdin 4/4 3/3 3/3 2/2; Lymen 4/4 3/3 | 3.0+1.0 | 0.0 | -- | fat |
| **naga** | 8 | 19 | hw4 19 | 1.1 | 6.1 | 70% | 0% | 16% | 2% | Aurdin 3.4/4 3/3 3/3 2/2; Lymen 4/4 3/3 | 3.0+1.0 | 0.0 | -- | thin |
| **trolls** | 8 | 23 | hw4 23 | 1.3 | 7.4 | 64% | 0% | 39% | 2% | Aurdin 3.1/4 3/3 3/3 2/2; Lymen 4/4 3/3 | 3.0+1.0 | 0.0 | -- | thin |
| **elemental** | 8 | 15 | hw4 15 | 0.8 | 4.2 | 80% | 42% | 16% | 0% | Aurdin 3.5/4 3/3 3/3 2/2; Lymen 4/4 3/3 | 3.0+1.0 | 0.0 | -- | fair |
| **torvald** | 9 | 15 | hw4 15 | 0.8 | 4.3 | 81% | 19% | 7% | 0% | Aurdin 3.5/4 3/3 3/3 3/3 1/1; Lymen 4/4 3/3 2/2 | 3.0+1.0 | 0.0 | -- | fair |

- **the road catches**: after the wagon yard: a chase that rolls no encounters (world.js Field.arrive: `!this.chase`), so the party meets the riders with the yard's leftovers.
- **the assassins**: at Deepholm's door, the first rest after Torvald: no walk between (see the torvald leg).

## The chains: the road since the last bed

The same legs walked one after another, nothing reset between the doors and no boss fought (the grid fights those): each row is what the road alone has taken since the party last slept, the floor under what it really brings (the boss before it costs more on top). A walk that wiped earlier counts as wiped at every door after.

| chain | door | steps | fights | HP | worst | KO | wiped by then | rested on the way | reading |
|---|---|---|---|---|---|---|---|---|---|
| legone | **cutseal** | 91 | 1.0 | 68% | 26% | 35% | 0% | -- | thin |
| legone | **gricks** | 20 | 1.0 | 42% | 0% | 75% | 0% | -- | thin |
| legone | **roper** | 72 | 2.1 | 64% | 0% | 33% | 9% | First Lamp 91% | thin |
| legone | **bulette** | 25 | 1.2 | 39% | 0% | 69% | 14% | -- | thin |
| legone | **drain** | 16 | 0.5 | 83% | 0% | 17% | 17% | Second Lamp 83% | thin |
| legthree | **xorns** | 35 | 1.1 | 78% | 22% | 17% | 0% | -- | fair |
| legthree | **giant** | 20 | 1.1 | 59% | 0% | 36% | 3% | -- | thin |
| legthree | **raid** | 16 | 0.9 | 43% | 0% | 53% | 15% | -- | thin |
| legfour | **fallback** | 21 | 0.0 | 100% | 100% | 0% | 0% | -- | fat |
| legfour | **naga** | 20 | 1.2 | 71% | 0% | 15% | 2% | -- | thin |
| legfour | **trolls** | 24 | 1.4 | 32% | 0% | 72% | 24% | -- | thin |
| legfour | **elemental** | 14 | 1.0 | 15% | 0% | 92% | 50% | -- | thin |
| legfour | **torvald** | 16 | 1.1 | 5% | 0% | 98% | 82% | -- | thin |

## Each leg

**doors** -- Silverton to the Doors (the wall at the top of the north road). Level 4 (lvl: no fight there; round six's 4); from Silverton (Fountain Street), rested.
Path 44 steps, silverton > world. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%. Features spent: none. Spells spent: none. Silver +0 a walk.

**snoot** -- Silverton to the Snoot (the glory-seekers on the road south). Level 3; from Silverton (Fountain Street), rested.
Path 69 steps, silverton > world. At the door: Barley 92%, Aurdin 94%, Vivian 96% down 1%, Lymen 98%. Features spent: none. Spells spent: Aurdin: shield of force 0.08, Barley: second wind 0.01. Silver +4 a walk.
The road's fights: gnoll x3 (0.09 a walk, 17 HP a fight); worg x2 (0.04 a walk, 34 HP a fight, 0.2 down); gnoll x2 (0.16 a walk, 8 HP a fight); gnoll x2, hyena x1 (0.03 a walk, 22 HP a fight).

**gulch** -- Silverton to Web Gulch (the braiding ettercap). Level 3; from Silverton (Fountain Street), rested.
Path 79 steps, silverton > world > gulch. At the door: Barley 89%, Aurdin 93% down 1%, Vivian 91%, Lymen 97%. Features spent: none. Spells spent: Aurdin: shield of force 0.12, Barley: second wind 0.01. Silver +4 a walk.
The road's fights: wolfspider x3 (0.33 a walk, 11 HP a fight); wolfspider x2 (0.36 a walk, 7 HP a fight); giantspider x1 (0.25 a walk, 4 HP a fight); giantspider x1, wolfspider x2 (0.04 a walk, 23 HP a fight).

**wet** -- Silverton to the Wet: the otyugh (the landlord's step). Level 4; from Silverton (Fountain Street), rested.
Path 101 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%. Features spent: none. Spells spent: none. Silver +0 a walk.

**jelly** -- Silverton to the Wet: the ochre jelly. Level 4 (lvl: the Wet's situation); from Silverton (Fountain Street), rested.
Path 113 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 98%, Aurdin 98%, Vivian 98%, Lymen 99%. Features spent: none. Spells spent: Aurdin: shield of force 0.06. Silver +1 a walk.
The road's fights: crawler x1 (0.24 a walk, 8 HP a fight); ratswarm x2 (0.06 a walk, 8 HP a fight); ratswarm x1 (0.05 a walk, 6 HP a fight); grayooze x1 (0.11 a walk, 1 HP a fight).

**ooze** -- Silverton to the Wet: the gray ooze in the pool. Level 4 (lvl: the Wet's situation); from Silverton (Fountain Street), rested.
Path 124 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 92%, Aurdin 94%, Vivian 98%, Lymen 99%. Features spent: none. Spells spent: Aurdin: shield of force 0.15, Barley: second wind 0.01. Silver +3 a walk.
The road's fights: crawler x1 (0.47 a walk, 9 HP a fight); ratswarm x2 (0.13 a walk, 10 HP a fight); darkmantle x2 (0.07 a walk, 6 HP a fight); grayooze x1 (0.26 a walk, 2 HP a fight).

**crawler** -- Silverton to the Wet: the crawler at the deep cradle. Level 4 (lvl: the Wet's situation); from Silverton (Fountain Street), rested.
Path 110 steps, silverton > world > warrens_a > warrens_b > warrens_d. At the door: Barley 99%, Aurdin 98%, Vivian 98%, Lymen 99%. Features spent: none. Spells spent: Aurdin: shield of force 0.02. Silver +1 a walk.
The road's fights: ratswarm x2 (0.07 a walk, 12 HP a fight); crawler x1 (0.11 a walk, 6 HP a fight); ratswarm x1 (0.08 a walk, 4 HP a fight); grayooze x1 (0.06 a walk, 2 HP a fight).

**keeper** -- Silverton to the flooded stair (the Keeper). Level 3; from Silverton (Fountain Street), rested.
Path 136 steps, silverton > world > warrens_a > warrens_c > warrens_d. At the door: Barley 90%, Aurdin 92%, Vivian 95%, Lymen 97%. Features spent: none. Spells spent: Aurdin: shield of force 0.18, Barley: second wind 0.01. Silver +5 a walk.
The road's fights: ratswarm x2 (0.21 a walk, 11 HP a fight); centipede x3 (0.09 a walk, 10 HP a fight); giantrat x4 (0.07 a walk, 11 HP a fight); giantrat x3 (0.10 a walk, 8 HP a fight).

**cloaker** -- Silverton to the cloaker (the guano mine, down the slide). Level 4; from Silverton (Fountain Street), rested.
Path 106 steps, silverton > world > galleries_g1 > galleries_g2 > galleries_g4. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%. Features spent: none. Spells spent: none. Silver +0 a walk.

**wagon** -- Silverton to the Halfway Inn (the wagon night; the road catches after it). Level 4; from Silverton (Fountain Street), rested. The story long-rests at the inn before the wagon rolls in (events.js EV.longRest, Griz 09-25), and the road catches follow the yard fight in a chase that rolls no encounters: both are fought full or on the yard's leftovers, not on this walk.
Path 73 steps, silverton > world > halfway > halfway_in. At the door: Barley 98%, Aurdin 99%, Vivian 99%, Lymen 100%. Features spent: none. Spells spent: Aurdin: shield of force 0.02, Barley: second wind 0.01. Silver +1 a walk.
The road's fights: worg x2 (0.04 a walk, 29 HP a fight); worg x1 (0.06 a walk, 5 HP a fight); axebeak x2 (0.04 a walk, 6 HP a fight); axebeak x1 (0.06 a walk, 2 HP a fight).

**chuul** -- Silverton to the lake (the point: the chuul). Level 4; from Silverton (Fountain Street), rested. By the story the chuul comes after a night at the inn holding the ring (a long rest): this is the walk to the water, or the rowboat's poke by day.
Path 87 steps, silverton > world > halfway. At the door: Barley 99%, Aurdin 98%, Vivian 98%, Lymen 100%. Features spent: none. Spells spent: Aurdin: shield of force 0.06. Silver +1 a walk.
The road's fights: axebeak x2 (0.09 a walk, 10 HP a fight); bandit x3 (0.03 a walk, 11 HP a fight); worg x2 (0.02 a walk, 16 HP a fight); bandit x2 (0.02 a walk, 7 HP a fight).

**hask** -- Silverton to the night crew at the niches (Hask, the Burial). Level 5; from Silverton (Fountain Street), rested.
Path 157 steps, silverton > world > warrens_a > warrens_c > warrens_d > burial. At the door: Barley 97%, Aurdin 97%, Vivian 99%, Lymen 99%. Features spent: none. Spells spent: Aurdin: shield of force 0.15. Silver +5 a walk.
The road's fights: giantrat x4 (0.11 a walk, 9 HP a fight); ratswarm x2 (0.15 a walk, 6 HP a fight); centipede x2 (0.13 a walk, 4 HP a fight); giantrat x3 (0.12 a walk, 4 HP a fight).

**cutseal** -- Solskaft to the cut seal (leg one, with Pyro). Level 5; from Solskaft, after a night (the cots).
Path 91 steps, solskaft > solskaft_deep > highway_1. At the door: Barley 46% down 12%, Aurdin 54% down 22%, Vivian 77%, Lymen 88%, Pyro (guest) 97%. Features spent: Barley secondWind 0.6 of 1 left. Spells spent: Aurdin: shield of force 0.65, Barley: second wind 0.40. Silver +46 a walk.
The road's fights: hobgoblin x6, hobsergeant x1 (0.17 a walk, 73 HP a fight, 0.5 down); hobgoblin x5, hobsergeant x1 (0.14 a walk, 61 HP a fight, 0.1 down); goblin x2, ogre x4 (0.08 a walk, 83 HP a fight, 0.5 down); bugbear x5, goblin x3 (0.07 a walk, 92 HP a fight, 0.9 down).

**gricks** -- The cut seal to the grick den. Level 5; from the cut seal.
Path 20 steps, highway_1. At the door: Barley 49% down 15%, Aurdin 57% down 20%, Vivian 79% down 3%, Lymen 91%, Pyro (guest) 98%. Features spent: Barley secondWind 0.6 of 1 left. Spells spent: Aurdin: shield of force 0.61, Barley: second wind 0.41. Silver +42 a walk.
The road's fights: hobgoblin x6, hobsergeant x1 (0.15 a walk, 58 HP a fight, 0.2 down); bugbear x5, goblin x3 (0.09 a walk, 93 HP a fight, 0.6 down); bugbear x2, bugbearchief x2 (0.06 a walk, 122 HP a fight, 1.7 down); hobgoblin x5, hobsergeant x1 (0.10 a walk, 65 HP a fight, 0.4 down).

**roper** -- The grick den to the roper (past First Lamp). Level 5 (lvl: leg one's 5 (the ladder puts the roper at 6)); from the grick den.
Path 71 steps, highway_1 > highway_2. At the door: Barley 52% down 18%, Aurdin 59% down 22%, Vivian 75% down 8%, Lymen 92% down 1%, Pyro (guest) 96% down 1%. Features spent: Barley secondWind 0.7 of 1 left, Pyro indomitable 0.8 of 1 left. Spells spent: Aurdin: shield of force 1.45, Barley: second wind 0.70. Silver +53 a walk.
The road's fights: ettin x3 (0.12 a walk, 131 HP a fight, 1.9 down); grick x6 (0.15 a walk, 89 HP a fight, 0.5 down); hobgoblin x6, hobsergeant x1 (0.13 a walk, 76 HP a fight, 0.3 down); hobgoblin x3, worg x5 (0.10 a walk, 82 HP a fight, 0.7 down).

**bulette** -- The roper to the bulette. Level 5; from the roper's fork.
Path 23 steps, highway_2. At the door: Barley 59% down 14%, Aurdin 70% down 17%, Vivian 77% down 9%, Lymen 89% down 1%, Pyro (guest) 98%. Features spent: Barley secondWind 0.8 of 1 left, Pyro indomitable 0.9 of 1 left. Spells spent: Aurdin: shield of force 0.63, Barley: second wind 0.20. Silver +9 a walk.
The road's fights: grick x6 (0.14 a walk, 92 HP a fight, 1.1 down); ettin x3 (0.10 a walk, 111 HP a fight, 1.3 down); grick x4 (0.15 a walk, 48 HP a fight, 0.5 down); phasespider x4 (0.10 a walk, 51 HP a fight, 0.2 down).

**drain** -- The bulette to the drain cut (past Second Lamp). Level 6 (lvl: the ladder's); from the breach (the bulette).
Path 14 steps, highway_2. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%, Pyro (guest) 100%. Features spent: none. Spells spent: Aurdin: shield of force 0.07, Barley: second wind 0.04. Silver +2 a walk.
The road's fights: ettin x3 (0.03 a walk, 151 HP a fight, 1.0 down); phasespider x3 (0.04 a walk, 34 HP a fight); mouther x3 (0.04 a walk, 25 HP a fight); mouther x4 (0.02 a walk, 40 HP a fight).

**pinned** -- The drain cut to the north cut (the phase spiders, Halldor pinned). Level 6; from the drain cut.
Path 29 steps, highway_2 > pinned. At the door: Barley 83% down 3%, Aurdin 85% down 3%, Vivian 95%, Lymen 99%, Pyro (guest) 99%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: shield of force 0.33, Barley: second wind 0.10. Silver +5 a walk.
The road's fights: ettin x3 (0.04 a walk, 96 HP a fight, 0.2 down); grick x6 (0.04 a walk, 65 HP a fight, 0.2 down); cube x2, mouther x1 (0.03 a walk, 87 HP a fight, 1.0 down); mouther x4 (0.08 a walk, 30 HP a fight).

**stair** -- Solskaft to the dry stair (the crew boss holding it). Level 6 (lvl: the spine's (after beat 10, where Ragna asks for the water); the ladder's 2 is the bestiary rung); from Solskaft, after a night (the cots).
Path 164 steps, solskaft > silverton > world > warrens_a > warrens_c > warrens_d. At the door: Barley 98%, Aurdin 98%, Vivian 99%, Lymen 100%. Features spent: none. Spells spent: Aurdin: shield of force 0.08. Silver +5 a walk.
The road's fights: giantrat x4 (0.13 a walk, 5 HP a fight); ratswarm x2 (0.13 a walk, 5 HP a fight); crewboss x1, robber x3 (0.08 a walk, 6 HP a fight); centipede x3 (0.08 a walk, 4 HP a fight).

**brood** -- Second Lamp to the nest (the Broodmother, Halldor and four troopers). Level 7; from Second Lamp (the road menu's fast travel), after a night there.
Path 39 steps, highway_2 > pinned > nest. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%, Halldor (guest) 100%, Trooper nest1 (guest) 100%, Trooper nest2 (guest) 100%, Trooper nest3 (guest) 100%, Trooper nest4 (guest) 100%. Features spent: none. Spells spent: none. Silver +0 a walk.

**xorns** -- Second Lamp to the seam (the xorns, leg three, Brann and Hedda). Level 8 (lvl: the raid's situation); from Second Lamp (fast travel; Third Lamp is the drow's), after a night there.
Path 35 steps, highway_2 > highway_3. At the door: Barley 61% down 8%, Aurdin 68% down 15%, Vivian 78% down 4%, Lymen 92%, Brann (guest) 94%, Hedda (guest) 93%. Features spent: Barley secondWind 0.7 of 1 left. Spells spent: Aurdin: shield of force 0.82, Barley: second wind 0.28, Hedda: second wind 0.02, Brann: second wind 0.01. Silver +81 a walk.
The road's fights: xorn x3 (0.28 a walk, 167 HP a fight, 0.6 down); drow x6, drowcaptain x2 (0.18 a walk, 110 HP a fight, 0.3 down); drow x4, drowcaptain x2 (0.10 a walk, 83 HP a fight, 0.3 down); duergar x9 (0.11 a walk, 37 HP a fight).

**giant** -- The seam to the giant's camp. Level 8; from the seam (the xorns).
Path 19 steps, highway_3. At the door: Barley 57% down 12%, Aurdin 74% down 10%, Vivian 78% down 3%, Lymen 93% down 1%, Brann (guest) 90% down 3%, Hedda (guest) 93% down 1%. Features spent: Barley secondWind 0.7 of 1 left, Brann secondWind 0.9 of 1 left. Spells spent: Aurdin: shield of force 0.78, Barley: second wind 0.32, Brann: second wind 0.05, Hedda: second wind 0.02. Silver +78 a walk.
The road's fights: xorn x3 (0.22 a walk, 190 HP a fight, 0.6 down); drow x6, drowcaptain x2 (0.15 a walk, 97 HP a fight, 0.2 down); drow x4, drowcaptain x2 (0.17 a walk, 74 HP a fight, 0.5 down); cloaker x2 (0.20 a walk, 58 HP a fight, 0.4 down).

**raid** -- The giant's camp to Third Lamp (the raid). Level 8; from the giant's camp.
Path 17 steps, highway_3. At the door: Barley 75% down 5%, Aurdin 83% down 6%, Vivian 87% down 2%, Lymen 96%, Brann (guest) 96%, Hedda (guest) 91%. Features spent: Barley secondWind 0.9 of 1 left. Spells spent: Aurdin: shield of force 0.63, Barley: second wind 0.12, Hedda: second wind 0.04. Silver +64 a walk.
The road's fights: xorn x3 (0.09 a walk, 208 HP a fight, 0.9 down); drow x4, drowcaptain x2 (0.11 a walk, 91 HP a fight, 0.1 down); drow x6, drowcaptain x2 (0.10 a walk, 82 HP a fight); duergar x9 (0.18 a walk, 40 HP a fight).

**fallback** -- Third Lamp to the drow's fallback line (leg four). Level 8; from Third Lamp, lit, after a night there.
Path 21 steps, highway_3 > highway_4. At the door: Barley 100%, Aurdin 100%, Vivian 100%, Lymen 100%. Features spent: none. Spells spent: none. Silver +0 a walk.

**naga** -- The fallback line to the black water (the naga). Level 8; from the fallback line.
Path 19 steps, highway_4. At the door: Barley 60% down 6%, Aurdin 62% down 14%, Vivian 76% down 6%, Lymen 82% down 2%. Features spent: Barley secondWind 0.8 of 1 left. Spells spent: Aurdin: shield of force 0.61, Barley: second wind 0.24. Silver +39 a walk.
The road's fights: earthelemental x1, xorn x1 (0.23 a walk, 134 HP a fight, 0.5 down); troll x2 (0.28 a walk, 103 HP a fight, 0.3 down); duergar x2, stonegiant x1 (0.10 a walk, 108 HP a fight, 0.4 down); drow x5, drowcaptain x1 (0.14 a walk, 70 HP a fight, 0.1 down).

**trolls** -- The black water to the troll hole. Level 8; from the causeway (the naga).
Path 23 steps, highway_4. At the door: Barley 55% down 13%, Aurdin 46% down 28%, Vivian 67% down 10%, Lymen 80% down 2%. Features spent: Barley secondWind 0.6 of 1 left. Spells spent: Aurdin: shield of force 0.89, Barley: second wind 0.37. Silver +49 a walk.
The road's fights: troll x2 (0.36 a walk, 105 HP a fight, 0.6 down); earthelemental x1, xorn x1 (0.24 a walk, 138 HP a fight, 0.9 down); duergar x2, stonegiant x1 (0.14 a walk, 99 HP a fight, 0.2 down); duergar x3, stonegiant x1 (0.11 a walk, 125 HP a fight, 0.5 down).

**elemental** -- The troll hole to the cut's walls (the earth elemental). Level 8; from the troll hole.
Path 15 steps, highway_4. At the door: Barley 73% down 3%, Aurdin 66% down 13%, Vivian 85% down 1%, Lymen 91%. Features spent: Barley secondWind 0.8 of 1 left. Spells spent: Aurdin: shield of force 0.45, Barley: second wind 0.16. Silver +32 a walk.
The road's fights: troll x2 (0.19 a walk, 97 HP a fight, 0.3 down); duergar x3, stonegiant x1 (0.12 a walk, 120 HP a fight, 0.5 down); earthelemental x1, xorn x1 (0.10 a walk, 134 HP a fight, 0.4 down); drow x4, drowcaptain x1 (0.10 a walk, 63 HP a fight, 0.1 down).

**torvald** -- The cut's walls to Deepholm's door (Torvald; the sect's blades come at the next rest there). Level 9 (lvl: the situation's 9 (leg four's fights are at 8)); from the made road's cut (the elemental). The assassins come when the party first rests at the door after Torvald (deep.js EV.rest): the same state as Torvald's door, less whatever Torvald cost.
Path 15 steps, highway_4 > threshold. At the door: Barley 71% down 2%, Aurdin 75% down 6%, Vivian 86% down 1%, Lymen 92%. Features spent: Barley secondWind 0.8 of 1 left. Spells spent: Aurdin: shield of force 0.53, Barley: second wind 0.19. Silver +26 a walk.
The road's fights: troll x2 (0.22 a walk, 98 HP a fight); earthelemental x1, xorn x1 (0.18 a walk, 117 HP a fight, 0.4 down); duergar x2, stonegiant x1 (0.12 a walk, 88 HP a fight); duergar x3, stonegiant x1 (0.09 a walk, 101 HP a fight, 0.1 down).

## The five that arrive thinnest (from a full start), and what drained them

1. **trolls** (The black water to the troll hole): HP 64%, worst 0%, a hero down in 39%, wiped 2%. At the door: Barley 55% (down 13%), Aurdin 46% (down 28%), Vivian 67% (down 10%), Lymen 80% (down 2%). Drained by: troll x2 (0.36 a walk, 105 HP a fight, 0.6 down); earthelemental x1, xorn x1 (0.24 a walk, 138 HP a fight, 0.9 down); duergar x2, stonegiant x1 (0.14 a walk, 99 HP a fight, 0.2 down). Spent in the fights: Aurdin: shield of force 0.89, Barley: second wind 0.37; features: Barley secondWind 0.6 of 1 left.
2. **cutseal** (Solskaft to the cut seal (leg one, with Pyro)): HP 67%, worst 28%, a hero down in 30%, wiped 0%. At the door: Barley 46% (down 12%), Aurdin 54% (down 22%), Vivian 77%, Lymen 88%, Pyro 97%. Drained by: hobgoblin x6, hobsergeant x1 (0.17 a walk, 73 HP a fight, 0.5 down); hobgoblin x5, hobsergeant x1 (0.14 a walk, 61 HP a fight, 0.1 down); goblin x2, ogre x4 (0.08 a walk, 83 HP a fight, 0.5 down). Spent in the fights: Aurdin: shield of force 0.65, Barley: second wind 0.40; features: Barley secondWind 0.6 of 1 left.
3. **naga** (The fallback line to the black water (the naga)): HP 70%, worst 0%, a hero down in 16%, wiped 2%. At the door: Barley 60% (down 6%), Aurdin 62% (down 14%), Vivian 76% (down 6%), Lymen 82% (down 2%). Drained by: earthelemental x1, xorn x1 (0.23 a walk, 134 HP a fight, 0.5 down); troll x2 (0.28 a walk, 103 HP a fight, 0.3 down); duergar x2, stonegiant x1 (0.10 a walk, 108 HP a fight, 0.4 down). Spent in the fights: Aurdin: shield of force 0.61, Barley: second wind 0.24; features: Barley secondWind 0.8 of 1 left.
4. **roper** (The grick den to the roper (past First Lamp)): HP 70%, worst 0%, a hero down in 29%, wiped 1%. At the door: Barley 52% (down 18%), Aurdin 59% (down 22%), Vivian 75% (down 8%), Lymen 92% (down 1%), Pyro 96% (down 1%). Drained by: ettin x3 (0.12 a walk, 131 HP a fight, 1.9 down); grick x6 (0.15 a walk, 89 HP a fight, 0.5 down); hobgoblin x6, hobsergeant x1 (0.13 a walk, 76 HP a fight, 0.3 down). Spent in the fights: Aurdin: shield of force 1.45, Barley: second wind 0.70; features: Barley secondWind 0.7 of 1 left, Pyro indomitable 0.8 of 1 left.
5. **gricks** (The cut seal to the grick den): HP 70%, worst 18%, a hero down in 28%, wiped 0%. At the door: Barley 49% (down 15%), Aurdin 57% (down 20%), Vivian 79% (down 3%), Lymen 91%, Pyro 98%. Drained by: hobgoblin x6, hobsergeant x1 (0.15 a walk, 58 HP a fight, 0.2 down); bugbear x5, goblin x3 (0.09 a walk, 93 HP a fight, 0.6 down); bugbear x2, bugbearchief x2 (0.06 a walk, 122 HP a fight, 1.7 down). Spent in the fights: Aurdin: shield of force 0.61, Barley: second wind 0.41; features: Barley secondWind 0.6 of 1 left.

<!-- walk8: end -->

## What it says

1. **The AI spends HP and nothing else.** Across 2,800 walks and 2,037 fights, every slot spent was a Shield (937 of them, all Aurdin's reaction); the only feature spent was Second Wind (and Pyro's Indomitable, Lymen's Relentless Endurance). The guest turn swings a weapon: no spell but a cleric's, no Sneak Attack (`guestTurn` passes `sneakUsed: true`), no Lay on Hands, no potion, no kit. So the **slots**, **potions** and **kits** columns are full by construction, and the **HP** column is a floor: a player who casts would end these fights sooner and arrive fatter, and would pay for it in slots. The table measures the road's teeth against bare steel.
2. **The base game's roads are fat.** From Silverton every door is 93-100% HP with a hero down in at most 1 walk in 100: at most about one fight on the way (the ooze, the Keeper, Hask and the gulch about one; the wagon and the chuul 0.3). Three doors meet no fight at all: the Doors (14 steps in the zone, 13 of them road at half rate), the otyugh (9 steps in the Wet by Skarn's gate), and **the cloaker** (the slide from G2 drops past G3, the guano mine's only encounter zone). The base game's bosses are fought nearly full.
3. **The Deep's road bites, and the beds are far apart.** From a full start, leg one with Pyro arrives at the cut seal at 67% (a hero down in 30%), and the hw1/hw2 fights cost about 60-130 HP each: Pyro's weight of 1.5 grows every group by 1.375 (`EV.pickGroup`, deep.js), so six hobgoblins and a sergeant, three ettins, six gricks. Leg four (hw4: two trolls, an earth elemental with a xorn, a stone giant with duergar) costs about 90-140 HP a fight with no guests at all.
4. **The chains are the real arrival, less the bosses.** Walked door to door with no boss fought, the road alone leaves the party at 42% at the grick den, 39% at the bulette, 43% at Third Lamp's raid, and at **Deepholm's door 5%, with 82% of walks wiped before it** (Third Lamp to the door: 95 steps, four boss doors, no bed). Leg one has First and Second Lamp on the way and recovers at each (64% at the roper, 83% at the drain); leg three and leg four have none. Every boss in those chains is fought on less than this.
5. **The countdown starts fresh at every map load** (`Field.load` calls `resetEncounter`), so a walk shorter than a zone's minimum on a map never rolls: the nest from Second Lamp (13 steps of hw2 from a lamp outside the zone, then 9 of the nest's 10-18) met no fight in 100 walks, and the fallback line's 12 steps of hw4 land on its trigger on the twelfth. The lamp stations sit outside the highway zones (hw1 stops at x 60, hw2 at 64, hw3 at 56), so the last steps to each lamp, and to the raid at x 57, are safe.
6. **Torches:** the kit's two torches cover two dark maps; the Hask walk is the one that runs out (the Warrens' two dark maps, then the Burial walked unlit). From beat 6 the Ledger-Lamp lights every Deep map and no torch is spent.

## Questions

1. The guest AI casts nothing but Shield and never drinks, kits or sneak-attacks. Leave the table as the floor, or add a second run with a stated player's hand (the area spell at two or more foes, a kit on the downed after a fight, a potion under a quarter), or teach the guest turn to cast (a game change for every guest)?
2. Leg four: Third Lamp to Deepholm's door is 95 steps of hw4 and four boss doors with no bed, and the road alone wipes 82 walks in 100 before the door. Is that the leg as meant, or does it want a bed on the way (a camp, a fourth lamp), or is the tent the answer (round six's kit carries one; the walker never pitches it)?
3. Pyro's 1.5 makes every leg-one group 1.375 times as big; from a full start the cut seal's door is 67% with a hero down in 30%. Intended?
4. The cloaker, the otyugh and the Doors are reached without a fight, and the nest without one from Second Lamp. Keep the countdown's fresh start at every map load, or carry it across maps?
5. The levels are the situations' (and the ladder's where none stands): the roper at 5 (the ladder says 6), leg four at 8, Torvald at 9. Are those where a player would be?

# Here to there: notes for the overseer

The cloud seat's job of 10-03 (`cloud-jobs.md`, queued: *"Here-to-there benches"*). Branch `claude/here-to-there`. Round one merged at 12db1fb (the walker, the table on the guest turn alone, five questions); round two at 7c7379b (Griz's five answers below: the player's hand, the tent, the ladder's levels, the table rerun); round three on `main` at ba793fe: the four leans below (the group at two, the kit, the sally, the dry stair at the story's level), the table rerun. No game file touched in either: `dev/bench8.js` (the `walk` mode), `dev/walk8.py`, `dev/check.py` (one line), `here-to-there.md`, this file.

## Ruled 10-03, and what goes on the queue

His answers to round one's five, verbatim:

1. *"both: a player's hand on the bench now, potions under half and area spells at groups; the guest turn as a queued game job, since hires fight that badly for real players too"* -- the hand is on the bench (below). **For the queue: the guest turn learning to cast** (js/battle.js `Battle.guestTurn`: today a guest swings, takes Second Wind, and casts only as a cleric; Dace and every hire fight that way for a player too).
2. *"the tent first, pitched once below half; rerun before any bed is added"* -- the hand pitches it; rerun in the table and in `here-to-there.md`'s What it says, item 4: it saves about five walks in a hundred on leg four.
3. *"it is the game's own rule; read it again after the hand, since the dumb AI inflates it"* -- read again: item 1 there.
4. *"yes; a map load is not a rest, but it is a game change"* -- **for the queue: the encounter countdown carried across map loads** (js/world.js `Field.load` calls `resetEncounter` on every load). Not built here; when it lands, `python dev/walk8.py leg=all n=100 table` again (the cloaker, the otyugh, the Doors and the nest will meet fights; the walker's `Field.load` calls are the game's, so it follows the change by itself).
5. *"yes, and rerun those legs"* -- every leg takes the ladder's level where it has a rung (the cloaker 4 to 6, the night crew 5 to 4, the roper 5 to 6, the dry stair 6 to 2, the fallback line and the naga 8 to 7); rerun.

## Round three: the four leans, built as the working answers

The walker's second four came back with the overseer's lean in brackets (*"The four, with my lean in brackets"*), not as Griz's rulings. They are bench-only, so they are built as written and stand as leans until his word:

1. *"sallies; the lamps are the beds you built. Have the walker model the sally, door to lamp to next door, before anything is added or lightened"* -- the chain `legfoursally`: Third Lamp to the fallback line, home to Third Lamp's tower and its bed (the road menu's REST HERE: `EV.longRest`, the state tallied first), out to the naga, home, ... out to Deepholm's door. The way-home legs (`fallback-home` and the rest) are chain legs only. What it showed: none of 100 sallies reaches Deepholm's door (here-to-there.md, What it says, item 3).
2. *"two; a pair of trolls is 168 regenerating HP, and a player fireballs that without thinking"* -- the hand's group is two (`group=3` puts it back).
3. *"yes, as a player would"* -- after each fight, a healer's kit on each of the four who is down (`EV.useFieldItem('kit')`: up at 1 HP), before the tent and the potions.
4. *"the story's; the walker measures arrival, and 2 is the bestiary's rung"* -- the dry stair at 6.

## The player's hand (hand=1, the default since round two)

On one of the four's turns (the guests keep their own turns), through the battle's own menus, answered by label as `drive()` answers them:
1. **A potion under half:** if any of the four is under half his HP (down counts), the potion (the plain one first, then the greater) goes to the lowest by share. In a fight a potion wakes the downed (battle.js `useItem`, RULED 09-28); in the field it doesn't (the game wants a kit).
2. **An area spell at a group:** with two or more foes up (three until round three; `group=` to change it), the highest-levelled damaging area spell the hero has a slot for (a cone, a line or all foes, with `dmg` on its record; the roost's fire and thunder left out), a cone or a line aimed at the front foe. In practice Aurdin: Burning Hands, Shatter, Fireball, Ice Storm, Cone of Cold by level. Sleep, Web, Stinking Cloud and the other area spells with no damage are not in it.
3. Else the guest turn, as round one.

After each fight: **a kit on each of the downed** (round three; up at 1 HP, so the tent after it heals him too), then **the tent once,** when the four stand under half their total HP (`EV.useFieldItem('tent')`: the game's own, half their maximum to the standing and a short rest; refused where the game refuses a tent; `tent=0` leaves it out); then **one potion each** for any of the four still standing under half. Not in the hand: Lay on Hands, Arcane Recovery, a run from a fight, walking back to a lamp when hurt (the sally chain walks back after every door, by the lean, not by need). One wrinkle: when the hand's potion is Vivian's (a Thief's Fast Hands: the item is her bonus action), her action is still hers and the menu's own FIGHT follows, with its Sneak Attack, which the guest turn never takes. That is the game's FIGHT; it is left as it falls.

## Run it

```
python dev/walk8.py legs                       the 28 legs and 3 chains: start, door, level
python dev/walk8.py leg=roper n=20             one leg, the player's hand; lvl=7 for another level, seed=5 for other dice, hand=0 for the guest turn alone
python dev/walk8.py leg=legfour n=100 tent=0   the hand without the tent; group=3 for an area spell only at three foes or more
python dev/walk8.py leg=legfoursally n=100     leg four in sallies: each door from Third Lamp, home to its bed after
python dev/walk8.py leg=roper n=1 log          the first walk's fights, line by line
python dev/walk8.py leg=legfour n=100          a chain: the legs walked one after another, the state carried door to door
python dev/walk8.py leg=all n=100 table        everything, twice (the hand and the floor, the same dice); rewrites the block between the markers in here-to-there.md (about 30 s here)
python dev/walk8.py leg=gulch n=1 check        the gate's line (dev/check.py all): FAIL on an error, a walk with no path, or no fight met
```

From PowerShell, as bench8.py (headless Edge). In this container: `DEEP16_BROWSER=/opt/pw-browsers/chromium DEEP16_BROWSER_ARGS=--no-sandbox`. A leg's walks run in one page load (synchronous, about 25 ms a walk); legs run four at a time (`jobs=`). Walk i of a leg rolls from a seed made of `seed`, the leg's name and i (Math.random replaced on the page), so the same seed walks the same walks.

## How a leg is walked

1. **The story's state:** a fresh game, then the game's own `DS.situation(G, s)` (js/situations.js) with the leg's `{lvl, base, spine, flags, unset}`: round six's party and kit (`DS.roundSix`: level 4 remade at the leg's level, the +2 weapons, the Ring of Binding on Barley, 3 potions, a greater potion, 3 kits, 4 simples, 2 draughts, 2 bat-wing pies, 3 oil, 2 torches, a tent, 1,500 silver), the expansion's beats 1..spine (their flags, guests, the Ledger-Lamp at beat 6), and the leg's own boss undone. Barley leads. Vivian's archetype is the first offered (Thief), as `DS.situation` picks it.
2. **The path:** the shortest walk in steps (a 0-1 BFS: a step costs 1, an edge exit or a door bumped costs 0) from the start tile to the door, over every map loaded through `Field.load` so its flag tiles are laid as the leg's flags say. Passable is `DS.TILES[t].pass`, less chests and solid NPCs that stand still (wanderers are ignored); warps and exits by their conditions; a `use` trigger with `script: 'warp'` (Silverton's vault door) is a door. A live step trigger is a wall unless it is the door itself or one that only talks (`lampArrive`, `pyroRoad`, `relief`, `treasury`, `dryStair`, `pyroMeet`, `ketilStop`): the walk goes round shop doors, other bosses and the expansion walls. A door that is a `use` trigger (the Keeper's stair, the deep cradle) is reached on a tile beside it. A door that is a map (`arrive`: the Halfway Inn, Deepholm's door) is reached on arriving.
3. **The steps:** each step sets the party on the tile and calls the game's own `Field.arrive()`: the zone (`zoneAt`), the half rate on road, bridge and dirt path (unless `roadSafe: false`), the countdown, the reset, `EV.encounter` (its group by weight and condition, a night crew's flee, `EV.pickGroup`'s guest scaling in the Deep). A warp step counts as a step and rolls nothing; a map change calls `EV.torchOut()` and `Field.load` (a fresh countdown), as `EV.warp` does, without the fade or the map's enter hook. A step onto a talking trigger rolls nothing (the game runs the trigger instead); the bench runs none of them.
4. **The fights:** fought to the end in the 8-bit battle, the page stepping the game's own loop (`T.step`) with the battle's lines instant (`dev/fastbattle.js`). **Every hero takes the guest turn** unless the hand (above) has a call: `Battle.prototype.heroTurn` is replaced on the page by `this.guestTurn(u)` (the hand's calls go through the original, its menus answered), and `askReact` answers as battle.js answers a guest (Shield always when it turns the hit, Uncanny Dodge at 6 or more, Hellish Rebuke unless under the roost, Counterspell at a levelled spell). After the fight its lines are read (`Victory!`, the XP, the level-ups), an archetype pending is chosen as above, and the state carries: HP, KO (a downed hero stays down unless the hand's potion wakes him in a fight), slots, features, items, silver, XP and levels.
5. **The light:** on a dark map with no light lit and someone without darkvision, the party lights its best (the Ledger-Lamp, a lantern, a torch) through the game's own `EV.useFieldItem`, carried by the first standing hero with a free hand; under a roost only a hooded light. A torch goes out at the next map (`EV.torchOut`), so each dark map costs one; with none left the map is walked unlit and the fights there are fought blind.
6. **Rest:** only at a lamp the walk passes (First Lamp, Second Lamp, Third Lamp unless the drow hold it), once a walk, and only if something is spent: `EV.longRest()` (the lamp's own night, without the fade, the morning's spell prep, or the assassins' hook, which is due only after Torvald). Silverton's inn and Solskaft's cots are where legs start, not on their way. The tent is the hand's (above).
7. **A start mid-map** (a boss's door, a lamp's bed: `mid` in walk8.py) gets the countdown part-run, not fresh: a run length drawn from the zone's rate as often as it is long, then 1 to that many steps left (the remainder a walker finds at a random step). Without it the short legs between bosses on one map met about half the fights the chains meet.
8. **The door:** the four heroes and the guests as they stand (HP, max, KO, level, slots against their maximum, features), the pack (potions, greater potions, kits, simples, draughts, pies, antitoxin, oil, torches, the lantern and the lamp, the tent, diamonds), silver, fights, rounds, steps, the lamps rested at, and per fight the foes, the rounds, the HP lost, the slots spent and the lines that cast something.

**The chains** (`legone` cutseal > gricks > roper > bulette > drain; `legthree` xorns > giant > raid; `legfour` fallback > naga > trolls > elemental > torvald; `legfoursally`, round three: each of leg four's doors from Third Lamp and home to its bed after) walk their legs in one game: the next leg's flags laid at each door, the boss just passed counted done, its path from where the last one stood, the countdown and the state carried, and no boss fought. Each door then shows the road alone since the last bed. The chain walks at its first leg's level.

## The legs: where they start and why

Levels (round two, his ruling 5): the DEEP16 ladder's (`deep16/data/fights.js`) wherever the leg's boss has a rung, the dry stair excepted (round three's lean: the story's 6); else the situation's (js/situations.js: the Wet's three off-ladder doors at 4, Torvald at 9); the Doors (no boss there) at round six's 4.

Base game: every leg from Silverton (Fountain Street, 29,8; `DS.roundSix`'s spot), rested: the Snoot, the gulch and the Keeper at 3, the Wet, the wagon and the chuul at 4, the cloaker at 6. They all stand on round six's state, so a level-3 party at the gulch carries +2 weapons and the ring: fatter than a first visit.

The Deep: in the spine's order. Hask from Silverton (spine 2, level 4); the cut seal from Solskaft (spine 6, Pyro and the Ledger-Lamp, 5); then each boss's door to the next on leg one and two (the gricks 5, the roper 6, the bulette 5, the drain 6); the north cut from the drain (spine 7, 6); the crew boss at the dry stair from Solskaft (spine 10, where Ragna asks for the water; at the story's 6 since round three, not the ladder's 2, its bestiary rung); the nest from Second Lamp by the road menu's fast travel (spine 12, Halldor and four troopers, 7); the xorns from Second Lamp (spine 15 with leg three undone, Brann and Hedda, 8; Third Lamp is the drow's); the giant and the raid door to door (8); leg four from Third Lamp, lit (spine 16: the fallback line and the naga 7, the trolls and the cut's walls 8); Torvald from the earth elemental's cut (spine 17, 9, the situation's: off the ladder). A chain walks at its first leg's level (leg four's at 7) and levels by its own XP. The assassins come at the first rest at the door after Torvald, so their door is Torvald's; the road catches follow the wagon yard in a chase that rolls no encounters. Neither is walked.

Leg four's fallback line, the naga, the trolls and the earth elemental are boss fights (`music: 'boss'`, deep.js `legFour`) the job's list did not name; they are legs here because Torvald's door is past them.

## What the AI does with the heroes (the floor, hand=0)

`Battle.guestTurn` (js/battle.js ~777): a cleric runs `clericTurn` (none in the four); a fighter takes Second Wind under 40% and Action Surge only with the sheet's `surgeAI` (Barley has none, Pyro's own script has its own); everyone else swings at the front foe with `heroAttack(u, t, { actions: 1, bonus: 0, surged: false, sneakUsed: true })`: Extra Attack yes, Sneak Attack never, no bonus action, no spell, no item, never RUN. Shield and the other reactions come through the reaction window. So in round one's 2,800 walks every slot spent was a Shield (937) and nothing else was cast; no potion, kit, Lay on Hands or Arcane Recovery was used; a hero who fell stayed down to the door. That run is the table's **floor HP** column now, the same dice as the hand's.

## What was not seen

- The bosses (the grid fights them): the table is the state at the door. A boss's cost, from bench16's own fights (`python dev/bench16.py x fight=roper`), would sit on top of each chain row; not joined here.
- The rest of a player's hand: Lay on Hands, Arcane Recovery, the control spells, a run from a bad fight, a walk back to a lamp, a detour round a zone, buying potions and torches. The walk takes the shortest way, whatever it crosses.
- The story on the way: talking triggers and maps' enter hooks are not run (Papa's hook, the lamps' first-arrival lines, Pyro's road talk); the lamps' STAY THE NIGHT is the rest above. The morning's spell prep after a lamp's night is skipped (the prepared lists stand as they were).
- Wandering NPCs on the path, and anything a script would walk the party back from (none was on these paths: the BFS walls them).
- Edge on Windows: the runs here were headless Chromium 1194 in the container; the page and the seeds are the same, so the numbers should be too (not checked on his machine).

## For the next seat (the walker's close, 10-03)

What three rounds taught, so nobody pays for it twice:

**Gotchas in the bench (each cost a run here)**
- `DS.battle` hands control back to its script on `setTimeout(0)`. A page that runs in one synchronous go never gets that macrotask, so the encounter script hangs after a won fight. The walk mode routes `setTimeout` into the queue `T.step` drains. bench8's `drive()` never noticed because it stops when the battle scene closes, not when the script does.
- `Field.load` restarts the encounter countdown, so a walk that starts mid-map must start the countdown part-run (`mid` in walk8.py), or short legs meet about half their fights. The arithmetic to check against is zone steps over the mean of the zone's rate (hw1: 20 steps / 20 = 1.0 fight).
- Seed each leg apart (walk8 mixes in the leg's name). Otherwise legs on the same zone replay each other's dice, and the table shows twins.
- `EV.pickGroup` (deep.js) grows every hw* and nest group by the guests' weight (Pyro 1.5, the troopers 0.5 each). Every Deep number with guests carries it.
- The highway zones stop short of the lamp stations (hw1 at x 60, hw2 at 64, hw3 at 56), so the stations, and the raid's door at x 57, are safe ground.
- Potions wake the downed in a fight but not in the field (there it takes a kit). The tent heals only the standing. Order the field half kit, then tent, then potion, or the tent is wasted on the down.
- The guest turn never sneak-attacks (`sneakUsed: true`) and takes Action Surge only with the sheet's `surgeAI`. The hand drives the real menus, so when Vivian's potion goes through Fast Hands, her action's FIGHT gets Sneak Attack. That's the game's own FIGHT; it's left as it falls.

**Reading the numbers**
- A single leg from a full start understates. The chains are the real arrival less the bosses, and that's the column to quote when someone asks "what does the party bring". Neither includes the boss before the door. Joining each boss's cost from bench16 (`bench16.py x fight=<id>`; the ids are the `deep16:` fields on each `EV.fight` in events.js and deep.js) is the obvious round four, and the walker's third open question.
- Extreme results were true each time, but read the fights before believing one: `python dev/walk8.py leg=<name> n=1 log`. Round one's 82% wipes on leg four held up line by line; the guest AI was the cause, not the bench.
- Walks cost about 25 ms, so n=100 on every leg and chain, both hands, is about 30 s. Don't skimp on n to save time.
- `here-to-there.md` regenerates only between its markers. The words outside are the seat's and survive `table`; check with a diff that a rerun on the same seed changes nothing.

**When the queued game jobs land, rerun the table**
- *The countdown carried across map loads:* the walker calls the game's own `Field.load` and `Field.arrive`, so it follows the change by itself. Expect fights where there were none (the cloaker by the slide, the otyugh, the Doors, the nest from Second Lamp) and more on every chain that crosses a map.
- *The guest turn learning to cast:* the floor column moves (it is `guestTurn`). The hand's two calls still come first for the four, so the hand's columns move only where it falls back to the guest turn.

**Who said what**
- Round two's answers are Griz's (the notes quote them verbatim). Round three's four came as the overseer's lean and are built as working answers, recorded as leans. Keep that line sharp in the files. If he overrules a lean, it's one switch each: `group=3`; the kit is the `afterFight` block in bench8.js's walk mode; the stair is `lvl` on the `stair` leg; the sally is just a chain.

**The design shape the numbers show** (findings, for Griz to rule on, not rules)
- The base game's roads barely touch the party. Its teeth are the bosses.
- The Deep's road is where resources go, and potions go first. The road sells none.
- A lamp is a bed only for the doors near it. Leg four's far doors are 67–89 steps from Third Lamp through the densest zone, which is why sallies lose and the straight walk is the better plan there.

## Carried (2026-10-04)

On Griz's word (*"organize and combine them into groups that can be done by one session"*) every live dragonsleep handoff and every cloud seat's notes file were swept into nine grouped handoffs at the they-live root, one session each. This job's open items: leg four's far end is `handoff-2026-10-03-the-road-and-its-rewards.md` §2; the four leans and the boss cost are `handoff-2026-10-04-the-difficulty.md` §2.5-6; the guest turn learning to cast is `handoff-2026-10-04-the-8-bit-battle-and-its-hands.md` §2.1. Moved to cloud-notes/ 10-04; still the walker's manual. This file stays as the record and the gotchas; nothing open lives here.

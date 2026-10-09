# DRAGONSLEEP: every URL

Live at **https://grimgriz.github.io/dragonsleep-8bit/**. The same paths work locally at **http://localhost:8923/** while the preview server `dragonsleep` is running.
Add `&x=anything` to any of these (or `?x=anything` to a bare one) to force a fresh load past the browser's cache.
None of these touch your saves unless you save.

(Written 2026-09-30. The flags are read in `js/scenes.js` for the 8-bit game and in `deep16/js/main.js`, `classes.js`, `gallery.js`, `core.js` and `ui.js` for DEEP16.)

## The 8-bit game

| Link | What it does |
|---|---|
| [`/`](https://grimgriz.github.io/dragonsleep-8bit/) | The game, from the title screen. |
| [`?round6`](https://grimgriz.github.io/dragonsleep-8bit/?round6) | NEW GAME, pick a lead: all four at **level 4** on Fountain Street, every quest done except the Halfway Inn and the lake. Vivian's archetype prompt comes up at once. |
| [`?lvl3`](https://grimgriz.github.io/dragonsleep-8bit/?lvl3) | NEW GAME, pick a lead: all four **just made level 3** (900 XP) on Fountain Street. Only *Company* (the party found) and *Winters' Errands* (both deliveries) are done, with 1 renown. Vivian's archetype prompt comes up at once. |
| [`?at=wet3&lead=lymen`](https://grimgriz.github.io/dragonsleep-8bit/?at=wet3&lead=lymen) | **new 10-03:** the `?lvl3` start with the Warrens' way down already open -- Pete heard, the tally book met, the five known, Skarn's gate open, nothing below done; `&lead=lymen` puts the cursor on him at the lead select (any of the four). Griz: "a level 3 party led by lymen, in silverton, with the gates down to the wet already opened". |
| [`?at=prone8`](https://grimgriz.github.io/dragonsleep-8bit/?at=prone8) | **new 10-06:** a show -- the 8-bit prone cue, a fight that plays itself: sleet over two ogres and a worg, each falling on its side, popping up to swing and dropping back. |
| [`?at=<situation>`](https://grimgriz.github.io/dragonsleep-8bit/situations.html) | **new 10-01:** NEW GAME, pick a lead, and you stand one step short of a line of the playtest ear-file, at its level, with the story done up to there (`wet`, `gulch`, `cloaker`, `roost`, `cradle`, `wagon`, `chuul`, `hook`, `crew`, `pyro`, `couch`, `leg1`, `northcut`, `nest`, `raid`, `leg4`, `torvald`, `blades`, `consult`, `solskaft`). All twenty, with what to try, are on `situations.html`; the table is `js/situations.js`. Vivian comes as a Thief; `&rogue=cutthroat` for the other. |

From the title menu: **COMBAT LADDER** opens `deep16/?ladder` (its **VILLAINS** button, top left, is the tester ladder `deep16/?ladder&party=ours`, whose **HEROES** comes back -- 10-09: the title's PLAYTESTER LADDER row is gone), **OPTIONS** (new 10-09, in that row's place: **GRID SCALE**, the 16-bit pages' default `&scale=` as a slider with its pixels, AUTO fitting the window; **MUSIC** on and off; **MENU TYPE**, LET THE MAP DECIDE or RING / RING2 / WINDOW for every fight, the Mascot games too; and the fights' AUTO END TURN, END TURN ASKS, AI + MESSAGE TIME), and **POCKET DM (ALPHA)** (new 10-02) opens `deep16/?pocket`.

## DEEP16 (the 16-bit grid)

Base: **https://grimgriz.github.io/dragonsleep-8bit/deep16/**. One mode per URL:

| Link | What it does |
|---|---|
| [`deep16/`](https://grimgriz.github.io/dragonsleep-8bit/deep16/) | The Cocoon Gallery: two drow captains and a phase spider. Your party comes from the save you walked through the door with, else your newest save slot, else the level-9 fixture. |
| [`?ladder`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?ladder) | The ladder, a levelling simulator: the story's fights, rung by rung up the levels. |
| [`?ladder&party=ours`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?ladder&party=ours) | The tester ladder: Talmok, Willem, Katarina and Torvald at each rung's level, both sides run by the AI, and you watch. It has its own test camp. |
| [`?ladder&party=ours&play`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?ladder&party=ours&play) | The same, except you run our four, and the fight is recorded. |
| [`?climb`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?climb) | The climb: one party from level 1 to 9. |
| [`?fight=edifice`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?fight=edifice) | **new 10-05:** any fight by its id, the four at its level -- here the Skylights, the Edifice's defend fight (two stone giants and two trolls down the north road, Pyro and the party out of the vault). `&lvl=7` another level; `&full` Pyro at full instead of taking the party's measure. |
| [`?fight=flyingrings`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?fight=flyingrings) | **new 10-08:** Rings of Flying, a testing room on the ladder at 3 (the Climbing Floor): four Rings of Flying in the pack -- PUT ON on the ring, free, as the card after the title says -- then MOVE with Shift+wheel or `[` `]` for height; giant bats and stirges that fly (`deep16/js/flight-ai.js`). `&watch`: the AI puts the rings on and flies up to them. The bench: `mode=flyrings1008` in the quick gate. |
| [`?fight=harbinger`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?fight=harbinger) | **new 10-08:** the Harbinger, the made gnoll, on the Gnoll Hills: the ladder's 7th (`&seed=N&watch` replays a bench fight roll for roll). |
| [`?fight=greyfang`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?fight=greyfang) | **new 10-08 (the GreyFang window):** GreyFang's pit, the story fight -- the Harbinger comes for GreyFang in public, the four at 7th caught off guard, and GreyFang's end as a cutscene. Its show switches: `&callN=read` or `&callN=N` (the pack read off the party, or held at N), `&dbl=`, `&toy=1` / `&toy=0`, `&laugh=1` / `&laugh=0`, `&rise` (see `deep16/js/traits.js`). |
| [`?pocket`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?pocket) | **new 10-02:** **the Pocket DM (alpha)**, over the oath-stone in Solskaft's hall: a party of up to six from the roster (the four, the guests, the named; Pyro once the trial is won) or of your own making (race, class, scores from ten with arrows, level to 8, the class's kit and spells, a name), a map (the dark ones said so), a CR dial that rolls the bestiary to it with the DMG's reading beside, a fight -- or the four-rung ladder with SHORT REST FOR THE WICKED between, a long rest and the trial (double deadly) at the top; a magic item to a random character on each win; the fights kept with notes, saved, mailed or carried to the Discord. Every fight it makes is a `?npc=` URL it shows and copies. **Since 10-09:** SAVE TABLE is **SAVE CAMPAIGN** (the same file and more; a table file still loads); USEFULS' **SITUATIONS** is a notes box that saves `hero_situations_feedback-<UTC>.json` with the party and campaign in it; the four Mascots come by easter egg (Denny the first character made, Beholda the first campaign saved, Goose the first notes saved, Rascal the first unit bound); and behind a door of its own, the DM's table -- no locks, GreyFang, the class floor's knobs, every door here, and a CAMPAIGN of shops (receipts you bind into units, CR 0 at 10 sp) and a ladder of your own (`deep16/js/pocketdm.js`). |
| [`?npc=cleric,wizard&lvl=5`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?npc=cleric,wizard&lvl=5) | The class floor (the Pocket DM): the listed foes against our four at that level. |
| [`?gallery`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?gallery) | **new 10-08:** THE ONE GALLERY -- the spell, feature, Mascot and row galleries as four shelves of one tool (`deep16/js/onegallery.js`). The column down the left: the shelves at its head (1-4, or click), the card, the keys. LEFT/RIGHT the entry (SHIFT ten), UP/DOWN the level where there is one (a spell's slot, a cantrip's caster, a Mascot's level), `,` `.` turn a creature, E again (SHIFT+E a row bare), SPACE pause and `[` `]` a frame, F the dice (creatures), L the list (on CREATURES the bestiary), X back. `&shelf=spells|features|mascots|creatures`, and every shelf's own flags below; `&from=pocket` (X back to the Pocket DM). On CREATURES a blow row is played as that blow at a fighter set in its reach. The old doors below (`?fxgallery`, `&features`, `&mascots`, `?mpgallery`, `?rows=`) open their shelf. **Since later on 10-08:** UP/DOWN on FEATURES the hero's level; a click on a BY SLOT / BY LEVEL line casts or builds at it; spells and features cast with the dice pinned (F lets them fall); **N** (or a click on the YOUR EYE line under the shelves) goes to the next entry an eyes row is waiting on, its title and what should happen at the head of the column, and **V** marks its verdict into situations' own store (Save there, as ever). |
| [`?fxgallery`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?fxgallery) | The spell gallery: every spell on the grid, cast in turn. |
| [`?broke`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?broke) | **new 10-06:** the card a bare door shows when it breaks (THE FIGHT BROKE, its error, E to the 8-bit title), with a sample error -- nothing broke. |
| [`?fxgallery&features`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?fxgallery&features) | The feature gallery: every class feature, fired in turn (since 10-08 the one gallery's FEATURES shelf: UP/DOWN the hero's level). |
| [`?mpgallery`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?mpgallery) | **new 10-07:** the Mascot gallery: the four Mascots' kits (Denny, Beholda, Rascal, Goose), one ability at a time -- left/right the next, **up/down the level 1-9** (the column's numbers and the BY LEVEL ladder recomputed), E or a click on the floor again; the card is a column down the left, the wheel or a click on it scrolls. The foes are normies (every score 8, AC 10, 100 HP). `&lvl=5`, `&ability=cannonball`, `&who=goose`, `&only=heart,group`, `&auto`. Also `?fxgallery&mascots`. |
| [`?rows=darkmantle`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?rows=darkmantle) | **new 10-08:** the row gallery: every row of a creature's sheet one at a time, as the engine draws it -- LEFT/RIGHT the row, `,` `.` (since 10-08, the one gallery's CREATURES shelf; UP/DOWN before) turn it through its eight facings, E (or a click) plays it again; the fall, prone and up, Still, Burrow, and Clamp over a fighter's head set by hand. The word after `rows=` is the creature's id in `deep16/data/foes.js`, one word (`cube`, `earthelemental`, `ettin`, `naga`, `axebeak`, `darkmantle`, `goblin`, `hobgoblin` ...); a word it does not know shows the grick (Griz, 10-08, pasting `?rows=<creature>` as it stood: *"got the grick"*). `?rows=cube,ettin` walks several; `&ripple=body` as on `?show=`. The fight that shows the rows in play is `?show=<creature>`. |
| [`?gameshow`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?gameshow) | The Monster Party Game Show (the lane's seat 1): the title over the lighthouse, the idle wander, the jump in, Third Lamp's arrival. **TUTORIAL ON** on the title (10-07) walks Denny's kit on the lighthouse floor before the jump in. `&at=lamp`, `&fast`. |
| [`?gate`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?gate) | The stop-and-look gate. |
| [`?view`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?view) | The cavern with a cursor, and no fight. |

### The class floor's options (`?npc=`)

- **`npc=`** is the foes, separated by commas. Each can be:
  - a class: `cleric`, `wizard`, `druid`...
  - a class at its own level: `cleric:5`
  - a class, level and race: `druid:3:dwarf`
  - a named character: `talmok`, `higertha`
  - a named character at another level: `talmok:7`
  - the grown build at the character's own level: `talmok:3:grown` (his register says 3; at any other level he is already the grown build)
  - **new 09-30:** any monster from the bestiary by name, e.g. `hyena`.
- **`lvl=`** (or `level=`) sets the level, 1 to 12. Only the druid (and Pyro) go past 9.
- **`vs=fighter,rogue`** gives you a band of your choosing to run, instead of our four. It takes the same kinds of words, except a bestiary monster (your side can't be a hyena yet).
- **new 10-02 (the Pocket DM's words, `deep16/js/classes.js` NPC.spec):** one of the 8-bit game's own by name -- `barley:5`, `vivian:3`, `brann`, `halldor:7`, `dace`, `pyro` -- built by the 8-bit's rules (the four as the ladder dresses them; a guest at its register's level or higher; Pyro at his 12, run by his own script on either side); **`+item`** after any word is a thing worn (`barley:5+dagger1`, `talmok:5:grown+ringofprotection`), if the class may wear it; and a word beginning **`~`** is a character of your own making, the whole sheet in the word: `~<class>.<level>.<race>.<STR-DEX-CON-INT-WIS-CHA>.<weapon_armour_shield_second_ring_cloak>.<Name_With_Underscores>.<spell-spell-...>` -- e.g. `~fighter.5.dwarf.16-14-16-10-12-8.greatsword_chainmail___handaxe__.Brokk` (the scores as typed, race in; the ASIs come with the level; a max hit die a level; an empty gear slot is nothing there; no spells field is the class's own list). The Pocket DM writes these for you.
- **`watch`** hands your side to the class AI too, so you just watch.
- **`fly`**, **`legend`**, **`breath=cold|fire|lightning|stone`**, **`spells=id,id`** (new 10-08, the grid's rules seat's testing room knobs on the class floor): the party has wings; a foe with legendary actions; a recharge breath; the party's casters given those spells to try.
- **new 10-01:** **`fam=owl,bat,...`** gives each of the `vs=` band a familiar, in order (`owl`, `snowyowl`, `bat`, `rat`, `spider`, `frog`, `snake`); **`map=<id>`** fights on another grid map than the Hex floor; **`dark`** puts the dark on it. On a dark map, the mouse on one of yours shows the dark as that one sees it.

Examples:

- [`?npc=talmok:7&vs=fighter:7`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?npc=talmok:7&vs=fighter:7): a level-7 fighter against Talmok at 7.
- [`?npc=hyena,hyena,hyena&vs=bard&lvl=3`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?npc=hyena,hyena,hyena&vs=bard&lvl=3): a level-3 bard against three hyenas.

### The galleries' options

- **`spell=<id>`** starts at that spell; for the feature gallery it's **`feature=<id>`**.
- **`only=a,b,c`** keeps to those spells or features.
- **`raw`** (the spell and feature galleries): the foes keep their own sheet -- no normie made of them (every score 8, 100 hp).
- **`keeper`** (`?fxgallery&keeper`): the Keeper's looks and rules, one scene at a time (`deep16/js/keeper.js` D.fxKeeper) -- not a shelf of the one gallery.
- **`auto`** goes on down the list by itself.
- **`keep`** doesn't clear the stage between casts, so E casts the same spell again on whatever the last cast left (Enlarge twice).
- **`foe=<monster>`** (new 09-30, the spell gallery only) puts three of that bestiary monster where the three fighters stand.
- **`hscale=N`** (new 10-08, any DEEP16 page): every map's heights drawn N times as tall -- the far walls and the Edifice's painted walls under the glass with them -- the rules unchanged (they read feet). A look at true-scale height: [`?fight=edifice&hscale=2`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?fight=edifice&hscale=2).
- **Keys:** left/right for the next spell, up/down to jump ten, E to cast again, M for the menu.

### Add-ons (with any DEEP16 mode)

| Flag | What it does |
|---|---|
| `&stats` | A frame-rate overlay. |
| `&scale=N` | Forces an integer screen scale, e.g. `scale=3`. (Since 10-09 the title's OPTIONS sets a default, GRID SCALE; this wins over it.) |
| `&menu=window` / `&menu=ring` / `&menu=ring2` | Draws the command menu as a window, the ring or the ring by cost, for this page only (since 10-09 it is not saved; the title's MENU TYPE sets the default). |
| `&touch` / `&notouch` | Forces the phone's on-screen pad on or off. |

`?embed` is internal: the 8-bit game opens DEEP16 that way for the story fights. It isn't meant to be opened by hand.

## Testing rooms

- **Hideous Laughter's hyena (09-30):**
  - [`deep16/?fxgallery&spell=hideouslaughter&foe=hyena`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?fxgallery&spell=hideouslaughter&foe=hyena): E casts it again.
  - [`deep16/?npc=hyena,hyena,hyena&vs=bard&lvl=3`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?npc=hyena,hyena,hyena&vs=bard&lvl=3): you cast it yourself, and hear the turn-start cackle as the hyenas' turns come round.

- **The wizards and their familiars (10-01):**
  - [`deep16/?npc=clacker,goblin,goblin&vs=wizard,wizard,wizard,wizard,wizard,wizard,wizard&fam=owl,snowyowl,bat,rat,spider,frog,snake&lvl=5&dark`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?npc=clacker,goblin,goblin&vs=wizard,wizard,wizard,wizard,wizard,wizard,wizard&fam=owl,snowyowl,bat,rat,spider,frog,snake&lvl=5&dark): seven wizards, one of each familiar, against a clacker and two goblins on the Hex floor in the dark (10-01b, Griz: "please use a clacker for one of the goblins in the vision room :)"). Hover each wizard or familiar for its eyes.
- **The clacker (10-01):**
  - [`deep16/?npc=clacker,clacker&lvl=4`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?npc=clacker,clacker&lvl=4): two clackers against our four at level 4; each clacks its hooks as its turn begins.
  - [`deep16/?fxgallery&foe=clacker`](https://grimgriz.github.io/dragonsleep-8bit/deep16/?fxgallery&foe=clacker): every spell, cast at three of them.

## Where the saves go

Every SAVE (the Pocket DM's SAVE CAMPAIGN -- SAVE TABLE till 10-09 --, SAVE A FILE and its SITUATIONS notes, `hero_situations_feedback-<UTC>.json`; R on either ladder, since 10-09 the combat ladder too; the situations page's Save, a Keeper fight's `&log`) is a download: the browser asks where, or drops it in the last folder it used. **Put them in the repo's `play-records/`** -- it stays on this PC (git ignores it), and it is where the seat reads them. Fights recorded for R (since 10-06): the tester ladder played (P), the combat ladder (since 10-09), `?fight=`, `?npc=` (the class floor), the Pocket DM, the story inside the 8-bit; live and localhost keep separate records.

## Pages beside the game

- [`test-runs.html`](https://grimgriz.github.io/dragonsleep-8bit/test-runs.html): **new 10-01**, builds any URL on this page (the class floor's foes row by row, the galleries' picks, the situations), with LIVE / LOCAL, copy, open, and a RECENT list. Its pick-lists are read live from the game's files.
- [`situations.html`](https://grimgriz.github.io/dragonsleep-8bit/situations.html): **new 10-01**, the `?at=` situations, each with what to try; **since 10-06** the eyes rows first (`js/eyes.js`: what is built and nobody has seen, each with its door), six a page, most wanted first. Mark each and Save: that file is how what you saw gets back to the seat.
- [`playtest-lamp.html`](https://grimgriz.github.io/dragonsleep-8bit/playtest-lamp.html): the playtest lamp -- **retired 10-06** (kept as history; mark things on `situations.html` instead).
- **Local only** (not on Pages; open these with the preview server running):
  - [`dev/spell-walk-lamp.html`](http://localhost:8923/dev/spell-walk-lamp.html): Ear Lamp, the spell walk
  - [`dev/feature-walk-lamp.html`](http://localhost:8923/dev/feature-walk-lamp.html): Ear Lamp, the feature walk
  - [`dev/distinct-spells-lamp.html`](http://localhost:8923/dev/distinct-spells-lamp.html): Ear Lamp, past the SRD
  - [`dev/stream-questions.html`](http://localhost:8923/dev/stream-questions.html): Playtest Questions

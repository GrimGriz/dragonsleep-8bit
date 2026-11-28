# The Pocket DM's campaign side: the rework, a build draft

room: the lanes desk of 2026-11-27 evening, a Claude Code desktop Code tab on ggpc (config echo claude-fable-5-2), door 2026-11-28T01:45Z. A DRAFT, written on his *"draft the build and point the lane to it for the DM interface rework"*. Nothing here is built. Nothing is ruled but piece A.

Lane: `..\handoff-2026-10-04-the-pocket-dm-and-the-races.md`, its 2026-11-28 section.

## What he said (verbatim, in the order he said it)

- On a screenshot of THE UNITS at 158 receipts, six Giant Boars and six Skeletons a page: *"Look at this and tell me why I'm asking you to look at it"*; then *"try being a user interface consult for the campaign button side of the pocket DM"*.
- *"the 'build a module' has a R button that seems to re-roll a list of monsters (that match the CR setting). W seems to be where the DM places the units. Having unbound all of my units, I'm wondering if I should be able to place the units rolled with R via W, where I guess a roll would be 'temp bound' as a unit for the DM to place (discuss)"*; on the desk's six points, *"check the check, all this is good regardless of the rest decided tonight."*
- *"what are the historical sections most commonly found in a "Monster Manual" type book for various fantasy RPGs"*
- *"I'm toying with two variant interfaces in my head - a book one, or folder and tree one, for DMs not interested in my nonsense, and our little GM guy on a map clicking on stores that we fly him to - with a 'real estate' option that flies him to a similar place that does locations by 'biome' for lack of a better term"*
- *"In humanoid shop examine how 1/2 CR 'Thug' and 1 CR 'Hired Blade' are displayed"*; then *"I pointed to those two as they're both chibi heads and it was weird they were shown at different zoom levels (apparently cut sizes)"*.
- *"i couldn't load the modules the seats have made for me as I don't know where they are, can you add them to player records where I'm loading mine from"* (done by the desk that night: three files in `play-records/`, the lane's section).

## What the desk saw

Seven screens read in `deep16/js/pocketdm.js` and looked at in a tab of the desk's own, seeded with 102 receipts, 3 units, 15 maps and a six-fight module: THE CAMPAIGN (`drawCamp`, :517), THE SHOPS (:555), a shop (`drawShop`, :705), THE UNITS (`drawUnits`, :762), THE LOCATIONS (:641), BUILD (`drawBuild`, :817), YOUR MODULES (`drawDmMods`, :673). THE VILLAINS and THE MARKS read in code only. Not clicked through as a player; no pad, no keys.

The one large problem: the DM thinks in units and the screens work in singles. His 10-09 words, in the code at :44: *"I went to the store and got Visiting Barbarian and two stable fighters - that was supposed to make a 'unit'."* A purchase is one creature a click; binding is another page, a flat list, one row a receipt, twelve a page.

## The pieces

Sizes are the desk's guesses. The order is the desk's lean.

### A. The roll can be laid (RULED: *"all this is good regardless of the rest decided tonight"*) -- M

Today R fills a fight (his bound units first, the rest rolled to the CR), W lays bound units only, and with none bound LAY THE RUNE refuses (`runes.js` :484). The first rune laid makes the fight exactly its runes (`RN.sync`, :57), so a rolled creature can never be placed.

1. W's pick gets a tab of its own, THE ROLL, ahead of the CR bands: what R put in this fight.
2. Grouped by kind, each group layable on its own (three wolves, and the bandit), so each takes its own posture.
3. Bound to this fight only: never on YOUR UNITS, no cost, not layable in another fight.
4. Laying part of the roll keeps the rest: the rolled creatures not laid seat themselves as they do now.
5. R still asks before it clears a laid fight; a roll's runes go with the roll.
6. KEEP THIS ROLL (optional): buys a rolled group at the shop's price and binds it as a unit.

Checked in code: a rune already holds its creatures by kind and may carry `unit: null`; a module file writes runes by kind (`pocketdm.js` :222, `runes.js` :140), so a laid roll saves with no change to the file. Two things must change for point 4: `RN.sync` (:57) sets the fight's foes to the runes' alone, and `RN.stale` (:65) reads runes that do not add up to the whole fight as left behind, and `PD.camp` drops them. `RN.clean` (:131) already takes runes that are part of the fight.

The case against, told to him: the purse then buys the choice of creature and its use across fights, no longer the right to place.

### B. THE UNITS: receipts by kind -- S

- One row a kind with its count, and a - / + for how many are picked: "Skeleton x6 . CR 1/4 . picking 2". 158 rows become a page or two.
- A panel behind YOUR UNITS (its text stands on the floor's art; `drawCamp` has `panel()`).
- One help line, not two; the rest to the buttons' `why`.

### C. A shop trip is the unit -- M

In a shop BUY adds to "this trip" on the foot of the page ("3 picked: CR 2") with BIND THIS TRIP beside it. Leaving without binding leaves receipts, as now. Shift+click BUY for five, if this does not land.

### D. The shop card at one zoom -- S

`PD.drawCreature` (:418) picks a whole-number zoom from the sheet's height: `floor(124 / top)`, 1 to 4, and no wider than `floor(200 / fw)`. The Thug (sheet `crewman_p1`, top 57) draws at 2; the Hired Blade (`guard_p1`, top 64) at 1; the line falls at 62 px. The Gnoll (fw 120) is at 1 for its width. On the grid every sheet draws at 1: the Thug 57 px, the Hired Blade 64, the Road Patrol 42 -- so the two chibi figures stand near the same height in a fight, both about half again as tall as the Road Patrol. The shop's difference is the card's rule, not the cut.

The lean: one zoom for every Medium figure on the card (2), the foot kept on its line and a tall frame let run under the card; a Large figure at its own.

Not this piece, and not laned: the chibi sheets against the realistic ones on one floor is an art matter (the dream list's kind).

### E. One name and one place for each way out -- S

- The same way to THE UNITS reads "THE UNITS (102 TO BIND)" on THE SHOPS, "BIND (102)" in a shop and "THE UNITS (102)" on THE VILLAINS, at three places on the bar.
- LOAD MODULE is two things: THE CAMPAIGN's (YOUR MODULES) and THE CAMP's, the players' list, which THE CAMPAIGN's own help line points to.
- **The game's own modules are not on the DM's side.** THE WAGON ROAD, THE FARE HOME and THE FEAST live in `deep16/data/modules.js` and show only on THE CAMP's list; YOUR MODULES has FROM A FILE and nothing else, which is why he could not find them. The lean: YOUR MODULES lists the game's own under his, each with COPY TO MINE.

### F. BUILD: the fight rows, the order, who fights where -- M

- A fight's row carries six one-letter buttons (W R x S L M) at 12 x 9 px, drawn over the line that names its foes.
- The page's help line runs off both edges of the screen.
- U / R / O / D want a legend; THE LOCATIONS spells the grounds out.
- THE UNITS says "in the order a table takes them" and nothing sets the order (`PD.newest`, :84: by last use, then newest). Arrows on a unit would.
- A clicked map fills itself; the only way to say which unit fights where is W. A "which unit" pick on a fight's row would.

### G. The book -- L

His *"a book one, or folder and tree one, for DMs not interested in my nonsense"*. A tree that does not move (the bestiary by type, the locations by ground, your units, your modules) and the page beside it. A filter by CR and a search. A creature's page is where a monster book's sections go: the block, what it does, how it fights, how many come, where it lives -- the last a way to that ground's floors. The desk's lean: the book and the map are two ways to the same pages, so a page is built once.

### H. The GM on the map -- L

His *"our little GM guy on a map clicking on stores that we fly him to - with a 'real estate' option that flies him to a similar place that does locations by 'biome'"*. In hand: the elder mage flies on W's floor (`runes.js` RN.floor); the world map is built (`deep16/?world`). The desk's two rules for it: a flight is short and can be skipped; nothing is done on the map that the book cannot do.

"Biome": the code's word is ground, and there are three (`PD.LANDS`: underground, urban, outdoors). A finer cut is a tag on every map first.

### Found beside it, small

- Two rows of the humanoid shelf both read "Gnoll (Longbow)": `drawShop`'s rule (:715) tells same-named kinds apart by their last blow, and both end on the longbow.
- A small brown square after "Bugbear" on that shelf, and one right of the card with the Hired Blade picked. Not chased.

## The order the desk would build in

1. A, B, D, E: one seat, each S to M, each stands alone.
2. C and F.
3. G, the book.
4. H, the map, on the book's pages.

## His to answer before a seat starts

1. B to F: build them as leaned, or pick?
2. The book and the map: both, and which opens first? The desk's lean: the map on a first visit and on the stream, the book once a DM has chosen it, kept by the browser.
3. "Biome": the three grounds as they are, or a finer cut (cave, road, town, water, hills)?
4. A's point 6, KEEP THIS ROLL: in, or later?


## HIS ANSWERS, 2026-11-28 ~02:45Z (to the four questions; this section outranks the pieces above where they differ)

His message, whole:

> 1 - B is yes, split the 'your bindings' as the landing page (on the left) with a slightly different colored button 'unbound' at the top that takes you to unbound receipts - replace the right-pane with the bound units
> (what about setting default formation when binding - are we saving it the first time he places it as a rune?)
> on the right side at a zoom based on their formation foot print (probably 1 zoom closer than the whole footprint onscreen) - on the bind screen the units selected that will be included in their bind
> C - what's 'shift click buy for 5 if this does not land?' (rest approved)
> D - the gnoll zoom looks good, and looks like large will be obviously large at that zoom
> re - chibi:  outbox me an art dept request to costume the generic male NPC (for most) and generic female NPC (as appropriate) for CHIBIs currently in the pocket DM
>
> * also remove combat children and disguised as goblin children from purchaseable units
>
> E - the first two aren't leans?
> else leans
> 2 - leans
> 3 - plan for outdoors to have subsections by biome in the future when we add maps
> 4 - if the DM places the roll as a rune 'add this unit to your stable' when he finishes rune placement

What it rules, piece by piece. Where a line is the desk's reading of his words it says so.

- **B, RULED, reshaped.** THE UNITS opens on YOUR BINDINGS: the bound units listed on the left. At its top a button of a slightly different colour, UNBOUND, goes to the unbound receipts. The right pane shows the binding picked, its members drawn in their formation, zoomed to the formation's footprint (*"probably 1 zoom closer than the whole footprint onscreen"*). On the bind page (the receipts) the right pane shows the creatures picked, the ones the bind will hold. The receipts are still one row a kind with a count (the piece as leaned). *The desk's reading: two pages where there was one, each a list on the left and a picture on the right.*
- **His question, formation at binding -- answered, NOT ruled.** No: today a formation is kept on the rune alone (`r.sq`, the members' squares; `runes.js` :140, :550-587), never on the unit, so the same unit laid in a second fight starts again from `RN.formation`'s default (:181). The desk's lean: keep the last formation a DM set on the unit itself, as offsets from the rune's square and a facing; a unit never laid shows `RN.formation`'s default on open ground. Then YOUR BINDINGS draws what the next rune will lay.
- **C, RULED** (*"rest approved"*): a shop trip is the unit -- BUY adds to this trip, BIND THIS TRIP on the shop's foot. **His question on shift+click, answered:** it was the desk's fallback had C been refused -- shift+click on BUY buying five at once. With C approved it is not needed; the desk's lean is to leave it out. Not ruled either way.
- **D, RULED:** *"the gnoll zoom looks good, and looks like large will be obviously large at that zoom"*. *The desk's reading: every figure on the card at the gnoll's zoom, 1 (the grid's own), not the 2 the desk leaned to; a Large figure then reads Large beside it.* `PD.drawCreature` (:418): `k` is 1.
- **The chibi figures -- an art request written:** `deep16/_src/outbox/ART-REQUEST-2026-11-27-chibi-recostume.md`, thirteen sheets picked by the desk's eye off a contact sheet of every humanoid and villain sheet on the shelves (`crewman_p1`, `guard_p1`, `bandit_p1`, `wheelwright_p1`, `brawler_p1`, `berserker_p1`, `veteran_p1`, `hask_p0`, `drillsergeant_p0`, `duergar_p0`, `drow_p1`, `drow_p0`, `spellweaver_p1`), each to be costumed on the art desk's generic man or woman (ART-122). For him to carry.
- **The children off the shelves -- RULED, to build (XS):** *"also remove combat children and disguised as goblin children from purchaseable units"*. Three kinds stand on the humanoid shelf at CR 0: `commonerchild` (Child), `keptchild` (Child) and `glamourgoblin` (Goblin, the child under the glamour). Add the three to `PD.OUT` (`pocketdm.js` :106).
- **E.** The third bullet RULED (*"else leans"*): the game's own modules listed on YOUR MODULES under his, each with COPY TO MINE. The first two were findings with no lean (his *"the first two aren't leans?"* -- right). The desk's leans, given that night, NOT ruled: (1) the way to THE UNITS reads the same on every bar, "THE UNITS (n)", at the same place, n the receipts unbound; (2) THE CAMPAIGN's LOAD MODULE button is renamed YOUR MODULES (its page's own title), and LOAD MODULE stays THE CAMP's alone.
- **F, RULED as leaned** (*"else leans"*): the fight row's buttons off the foes' line, the help line inside the screen, the grounds spelled out, arrows to order the units, a "which unit" pick on a fight's row.
- **G and H, question 2, RULED** (*"2 - leans"*): both the book and the map, two ways to the same pages; the map opens on a first visit and on the stream, the book once a DM has chosen it, kept by the browser.
- **Question 3, RULED:** *"plan for outdoors to have subsections by biome in the future when we add maps"*. The three grounds stay; OUTDOORS is built so it can take sub-sections by biome later. No tagging of today's maps is asked.
- **Question 4, RULED, reshaped (piece A's point 6):** *"if the DM places the roll as a rune 'add this unit to your stable' when he finishes rune placement"*. KEEP THIS ROLL is not a button on the pick: when the DM finishes laying a rolled group, he is offered ADD THIS UNIT TO YOUR STABLE. **Open, the desk's question for him:** does adding it cost its shop price, or is it free?

The order to build in, as it stands: the children off the shelves (XS) with A, B, D, E's third bullet and F; then C; then G; then H.


**2026-11-28 ~03:10Z, his next word (the lanes desk, the same door):** *"leans 1-3, 4 can we 'first one's free' that and 'played modules earn silver' if they don't have enough silver after?"*

- **RULED (1):** a unit keeps the last formation a DM set for it, on the unit; a unit never laid shows `RN.formation`'s default.
- **RULED (2):** the way to THE UNITS reads "THE UNITS (n)" at one place on every bar, n the receipts unbound; THE CAMPAIGN's LOAD MODULE button is YOUR MODULES, and LOAD MODULE is THE CAMP's alone.
- **RULED (3):** no shift+click BUY for five.
- **(4) his "can we", answered by the desk, NOT ruled till his word:** yes, and the desk's lean is yes. ADD THIS UNIT TO YOUR STABLE is free the first time in a campaign (one flag on the campaign, `PD.camp`); after that it costs the group's shop price (`PD.price`), as BUY ANOTHER does on the pick; where the purse is short the offer stays on the card, greyed, with the line the shops already give -- a fight of yours played here pays twice its CR in silver (`pocketdm.js` :323). The desk's reading of "first one's free": the first in the campaign, not the first in each module.

- **RULED (4), 2026-11-28 ~03:15Z:** his *"yes, rule it"* -- ADD THIS UNIT TO YOUR STABLE is free the first time in a campaign, then the group's shop price; a short purse greys it with the line on how a played fight pays. And *"outbox sent"*: the art request and the four ENGINE-RETURN notes of 11-26 moved to `deep16/_src/art-desk/sent/`.

**2026-11-28 ~04:25Z, after the close, BUILT on his word (the lanes desk, the same door):** *"Good to fix the duplicate shop labels, though I think the gnolls vary by clan (grey keeping, etc) and should be in the shop in case DM wants matching colors..."* -- `d4fc52b5` (PATCHLOG `74e9fd1b`; the full gate GREEN, 452 checks): a kind's `shelfTag` (`deep16/data/foes.js`) names its shelf row, `PD.shelfLabels` (`deep16/js/pocketdm.js`); Gnoll, Gnoll (Gray Keeping), Gnoll (woman), Gnoll (Gray Keeping, woman), Glory-Seeker (Gray Keeping), Commoner (woman); `gnollgray` and `gloryseekergray` off `PD.OUT`, the three children on it (the draft's XS, done); a receipt reads as its row; bench `shelf1127`. The matriarchs stay off the shelf (not asked). The brown square was the picked row's highlight (his word). Not shipped; no eyes row; he has not seen it.

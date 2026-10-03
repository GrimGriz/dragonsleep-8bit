# Cloud jobs -- the oversight queue (founded 2026-10-03)

The desktop oversight window keeps this list; a cloud seat reads it to know what is done, in flight and queued. Prompts the seats are started with live on Griz's PC (`dev/cloud-prompt-<job>.md`, gitignored); the rulings behind them are in `invented.json`, the register and the notes files named below. Law: a cloud seat works a `claude/<job>` branch and never pushes `main`; its close is its branch plus a notes file in the repo root; the desktop merges after the gate is GREEN there and re-stamps.

## Merged (main)

**The signature fight, as a recipe:** `deep16/signature-fights.md` (10-03, from the Keeper's run): his design in his words, the hesitations numbered, bench-first, the looks in a gallery, a cloud seat on a branch and the desk on the gate, the three playtest doors, his records changing the rules, the levers named, the ladder kept on the old fight, the ship on his word. The next signature fight's brief cites it first.

Every seat's notes file ends with a **For the next seat** section (10-03): the gotchas, who said what, what to rerun and when. Read the one for the area you touch before you touch it.

| job | branch | notes | merged |
|---|---|---|---|
| the SRD pass's leftovers (Spy's Cunning Action, Parry, thrown weapons, Ettin, Duergar Resilience) | `claude/srd-pass-leftovers` | -- | 4454318, 10-03 |
| the two spellbooks (every spell record against both battles; 53 register rows) | `claude/two-spellbooks` | `spells-two-books.md` | c7f8451, 10-03 |
| the race figures (dragonborn and tiefling, one per class) | `claude/race-figures` | `deep16-race-figures-notes.md`, `deep16-race-figures.png` | 7beba7c, 10-03 |
| the spell fixes (fifteen SRD misses) | `claude/spell-fixes` | `spell-fixes-notes.md` | b01df88, 10-03 |
| the lazy sheets (start-up 39.46 MB to 2.71 MB) | `claude/lazy-sheets` | `lazy-sheets-notes.md` | 56d42b5, 10-03 |
| the spell fixes, round two (Sanctuary ends on the spiritual weapon's swing in the 8-bit; Ice Storm's two kinds on the grid; his four answers) | `claude/spell-fixes` | `spell-fixes-notes.md` | 093a120, 10-03 |
| the lazy sheets, round two (the ladder list prefetches the chosen rung) | `claude/lazy-sheets` | `lazy-sheets-notes.md` | 10-03, after the reactions |
| the here-to-there walker (28 legs, 3 chains, 100 walks each: what the party reaches each boss with) | `claude/here-to-there` | `here-to-there.md`, `here-to-there-notes.md`, `dev/walk8.py` | 12db1fb, 10-03 (fast-forward) |
| the walker, round two (the player's hand on the bench beside the floor, the tent once below half, the ladder's levels; his five answers) | `claude/here-to-there` | the same files | 7c7379b, 10-03 (fast-forward) |
| the early fights half again (the Snoot's glory-seekers +a gnoll +a hyena, x1.58; the gulch's ettercap +two wolf spiders, x1.54; the crew's change REVERTED on main at 057d951 until its fourth is ruled; the chuul's frog and the Wet untouched) | `claude/early-cr` | `early-cr-notes.md` | 48911cb, 10-03 |
| the walker, round three (a group at two, kits on the downed after a fight, the dry stair at the story's 6, the sally chain) -- built on the overseer's four LEANS, recorded as leans until Griz rules | `claude/here-to-there` | the same files | e1dbf77, 10-03 (fast-forward) |
| the Keeper of the Flooded Stair, redone to his design (the lure AI, 160 HP, Slam 3d4, the drowning 1d8+1, the party's retreat; the ladder keeps the old Keeper) | `claude/intelligent-maxwell-6ich3v` via Griz's own window (`scratch/merge-both`) | `deep16-keeper-notes.md` | c8868ab, 10-03 |
| the 8-bit's reactions and concentration (the buff slot retired; his seven answers built) | `claude/8bit-reactions` | `8bit-reactions-notes.md` | 1b18ac5, 10-03 (the desktop took main for it: eleven files, the records field by field) |

## In flight

| job | branch | state |
|---|---|---|

## Queued (ruled, not started)

- **The crew half again, on his word for its fourth** (early-cr-notes.md): the literal swap (Hask, the wheelwright, two of the night crew) reads x0.82 -- easier; at four heads x1.4 needs a CR 2 in the fourth slot (Hask's pattern, the bandit captain, 34/40; the berserker out of place, 36/40); seven heads (the reverted dad7084, 85% at 38% HP) would need the scene's "Four of them" lines changed to seven. The chuul's one giant frog from the shallows (x1.57, 39/40) waits with it.
- **The ladder's rungs 3 and 4** share the Snoot's and the gulch's records, so they are half again too now. If "the ladders are not for this" (his word on the Keeper) covers them, a ladder copy each with the old foes, as `keeper-ladder` has. His call.
- **The SRD pass's leftovers not built** (from the Keeper window's close; the handoff is spent): tremorsense (waits on flight), the Stone Giant's Rock Catching, Dominate Person, the unread conditions, the Bat Swarms rung.
- **The early fights half again** (Griz, 10-03: *"I think we should up the CR by a 1/2 for the early fights. They're taking the slide trap down to the cloaker, we'll let that be fine."*; then *"CR your call, you've examined the numbers closer than I. I have found things easy."* -- the oversight window's call: x1.5 the fight's adjusted XP by the DMG's reading, each fight's addition of its own kind or its place, named for his eye; *"The Keeper has been completely redone (almost finished) exclude. Exclude Wagon Night as well."*). The set: the Snoot's gnolls, the gulch, the Wet's four, the chuul, Hask's crew; out: the Keeper, the wagon night and its road catches, the cloaker, the Deep. Prompt written 10-03 (`dev/cloud-prompt-early-cr.md`).
- **Dace and the cloaker, flipped** (Griz, 10-03, after reading the deep gallery's words -- the cloaker's card names bright light as its weakness, Dace asks to carry a light down, his sheet line is "arguing with the light": *"We'll have to flip the 'cloaker favors Dace' to the opposite, maybe script 'hey guys is this a cloak? Finally, I can put some Light on the situation down here' cast, end cutscene start the fight - then check if the easter egg still works, and if not decide if we let egg hunters figure out not to bring Dace. All the 'don't take my boy down there' will have to be reworked or cut"*). A story job for a DESKTOP seat, not the cloud: the scene's words cite the galleries module in the cairn (TarlynsPit, GalleriesModule), Ottilie's and Old Wynn's lines are the realm's, and the egg is his (build it whole: the cutscene, the cast, the fight's start, the egg checked after). The sheet quest (Dace's Mirror Image sheet, RULED 10-01c) is under rethink with it.
- **The guest turn learns to cast** (Griz, 10-03, through the walker's first question: the guest AI spent nothing but Shield in 2,800 walks -- no area spell, no potion, no sneak attack; the player's hand on the bench showed what that costs, 10-20 points at every Deep door). A game change in js/battle.js (the guest turn): heal under half, an area spell at a group, the rogue's sneak attack through FIGHT, a potion for the downed. Hires fight that way for real players too. After the prone cue if both run at once.
- **The encounter countdown carried across map loads** (RULED yes 10-03 through the walker's fourth question; a game change, so queued): today every map load restarts the countdown, so a short walk between loads meets nothing (the nest from Second Lamp: no fight in 100 walks). When it lands, rerun `python dev/walk8.py leg=all n=100 table`.
- **One 8-bit follow-up** (ruled 10-03, not built): the prone cue without a prone row (Griz: *"we're not doing prone combat animations - they'll have to pop-up and fall back prone or something"*): a hop and a drop, a tilt or a pose, the same cue wherever the 8-bit knocks something prone, benched with the sleet. Lives in js/battle.js.
- **Shrink the scripts** (the lazy seat's question 4; Griz: *"how the heck are we going to remember to do lazy #4"* -- this line is how): the 2.7 MB of scripts that is now most of the start-up; `data.js` alone 0.56 MB. A later job.
- **The seven monsters with no grid foe** (the centipede, the fire beetle, the stirge, the will-o'-wisp; the Hired Blade, the Stable Fighter, the Drow Blade-Captain): sheets and foes, so the grid refuses nothing. Note: random encounters and the Hex arena fight in the 8-bit by design, with no grid id.
- **The dragonborn's breath weapon and resistance, the tiefling's spells** (`NPC.RACES` has only scores, darkvision, fire resistance); a portrait for the maker's card.
- **The 121 grid-only spells**: HELD (Griz, 10-03). Random encounters are the 8-bit's (ruled 10-03), so the pull for an 8-bit spell is what the heroes cast in random fights; the here-to-there table says which spells get spent on the road. Build nothing past his word.

## Rulings that bound every job

- **The Wet is not benched as a fight** (Griz, 10-03: *"we should cut the Wet from benching it's got all that 'spawn in crawlers that attack corpses story stuff'"*). No win rates, no CR arithmetic, no boss cost in the walker's chains for `wet`; the early-cr job leaves it; `bench16.py x fight=wet` is not a measure of anything. The machinery probes (`dev/wet-probe.py`, `dev/wet8-probe.py`: the Settling, the landlord's pictures) stay in the gate as proofs that the story runs, not as weights of the fight (the overseer's reading of his word; his to narrow).

## Open questions for Griz (not rulings)

- From the early-cr seat (10-03): the crew's fourth (above); does "the ladders are not for this" cover the Snoot, the gulch and the crew rungs?
- From the Keeper window's close (desktop, 10-03): the 8-bit's own story text (w.stairSee, w.markWake) is not matched to the two spawns; nobody has seen the live 8-bit wade-in or rune paths, or the ladder rung screen, in a real browser.
- From the fixes seat's close, five small findings not built: the 8-bit's oozes lack the charmed condition; the drow's charm-save advantage is not read in the 8-bit; a two-kind spell makes a concentrating caster check twice (Ice Storm now, as Flame Strike did); Mislead's double has no clock; no grid foe has magical weapon attacks yet (set `magic: true` when one comes).
- The walker's round-two four were built as the overseer's LEANS (a group at two foes, kits on the downed after a fight, the dry stair at the story's level, leg four in sallies): his word makes them rulings or undoes them (bench-only, easy to undo).
- The walker's round-three three (here-to-there.md, Questions): leg four walked straight arrives at 46% with 19 walks in 100 wiped, in sallies nobody arrives (Third Lamp sits at the near end: 500 steps against 95, the night restores HP and slots but no potion, kit or tent) -- the straight walk as meant, a bed at the far end past the troll hole, or a lighter hw4 table? Should Second Lamp's stores carry potions, or is Solskaft's Garrison the only place by design? Should the chains add each boss's own cost from the grid's bench, so a door shows the boss before it too?
- ~~Random encounters: the 8-bit's, or grid maps someday?~~ RULED 10-03 (Griz: *"random encounters stay the 8-bit"*).
- Whether cloud routines fired from the desktop draw on the same credit as hand-opened sessions.

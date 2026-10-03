# Cloud jobs -- the oversight queue (founded 2026-10-03)

The desktop oversight window keeps this list; a cloud seat reads it to know what is done, in flight and queued. Prompts the seats are started with live on Griz's PC (`dev/cloud-prompt-<job>.md`, gitignored); the rulings behind them are in `invented.json`, the register and the notes files named below. Law: a cloud seat works a `claude/<job>` branch and never pushes `main`; its close is its branch plus a notes file in the repo root; the desktop merges after the gate is GREEN there and re-stamps.

## Merged (main)

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
| the 8-bit's reactions and concentration (the buff slot retired; his seven answers built) | `claude/8bit-reactions` | `8bit-reactions-notes.md` | 1b18ac5, 10-03 (the desktop took main for it: eleven files, the records field by field) |

## In flight

| job | branch | state |
|---|---|---|
| the Keeper of the Flooded Stair (his design) | `claude/intelligent-maxwell-6ich3v` | built and benched; the foe still draws `keeper_p1`, rows 6/7 asked; Griz finishing it in another window |

## Queued (ruled, not started)

- **The guest turn learns to cast** (Griz, 10-03, through the walker's first question: the guest AI spent nothing but Shield in 2,800 walks -- no area spell, no potion, no sneak attack; the player's hand on the bench showed what that costs, 10-20 points at every Deep door). A game change in js/battle.js (the guest turn): heal under half, an area spell at a group, the rogue's sneak attack through FIGHT, a potion for the downed. Hires fight that way for real players too. After the prone cue if both run at once.
- **The encounter countdown carried across map loads** (RULED yes 10-03 through the walker's fourth question; a game change, so queued): today every map load restarts the countdown, so a short walk between loads meets nothing (the nest from Second Lamp: no fight in 100 walks). When it lands, rerun `python dev/walk8.py leg=all n=100 table`.
- **One 8-bit follow-up** (ruled 10-03, not built): the prone cue without a prone row (Griz: *"we're not doing prone combat animations - they'll have to pop-up and fall back prone or something"*): a hop and a drop, a tilt or a pose, the same cue wherever the 8-bit knocks something prone, benched with the sleet. Lives in js/battle.js.
- **Shrink the scripts** (the lazy seat's question 4; Griz: *"how the heck are we going to remember to do lazy #4"* -- this line is how): the 2.7 MB of scripts that is now most of the start-up; `data.js` alone 0.56 MB. A later job.
- **The seven monsters with no grid foe** (the centipede, the fire beetle, the stirge, the will-o'-wisp; the Hired Blade, the Stable Fighter, the Drow Blade-Captain): sheets and foes, so the grid refuses nothing. Note: random encounters and the Hex arena fight in the 8-bit by design, with no grid id.
- **The dragonborn's breath weapon and resistance, the tiefling's spells** (`NPC.RACES` has only scores, darkvision, fire resistance); a portrait for the maker's card.
- **The 121 grid-only spells**: HELD (Griz, 10-03). Random encounters are the 8-bit's (ruled 10-03), so the pull for an 8-bit spell is what the heroes cast in random fights; the here-to-there table says which spells get spent on the road. Build nothing past his word.

## Open questions for Griz (not rulings)

- The walker's round-two four (here-to-there.md, Questions): leg four in sallies from Third Lamp (a player can walk back to sleep after any boss), a bed on the way, or a lighter hw4 table? A group at three foes or at two (Deepholm's door: 68 walks wiped to 46)? The hand using a kit on a downed hero after a fight? The dry stair at the ladder's 2 or the story's 6?
- ~~Random encounters: the 8-bit's, or grid maps someday?~~ RULED 10-03 (Griz: *"random encounters stay the 8-bit"*).
- Whether cloud routines fired from the desktop draw on the same credit as hand-opened sessions.

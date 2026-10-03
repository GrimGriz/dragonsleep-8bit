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

## In flight

| job | branch | state |
|---|---|---|
| the Keeper of the Flooded Stair (his design) | `claude/intelligent-maxwell-6ich3v` | built and benched; the foe still draws `keeper_p1`, rows 6/7 asked; Griz finishing it in another window |
| the 8-bit's reactions and concentration (the buff slot retired) | `claude/8bit-reactions` | built, GREEN in the cloud; must take `main` (fixes and lazy landed after it): eleven files, one real hunk at `js/battle.js` ~849; then his seven answers and two 8-bit follow-ups (Sanctuary ends on the spiritual weapon's strike; the prone cue without a prone row) |

## Queued (ruled, not started)

- **Grid follow-ups:** Ice Storm's damage split (2d8 bludgeoning + 4d6 cold, each resisted on its own); the ladder list prefetches the chosen rung's figures so the camp opens without a beat. Small; DEEP16 only.
- **Shrink the scripts** (the lazy seat's question 4; Griz: *"how the heck are we going to remember to do lazy #4"* -- this line is how): the 2.7 MB of scripts that is now most of the start-up; `data.js` alone 0.56 MB. A later job.
- **The seven monsters with no grid foe** (the centipede, the fire beetle, the stirge, the will-o'-wisp; the Hired Blade, the Stable Fighter, the Drow Blade-Captain): sheets and foes, so the grid refuses nothing. Note: random encounters and the Hex arena fight in the 8-bit by design, with no grid id.
- **The dragonborn's breath weapon and resistance, the tiefling's spells** (`NPC.RACES` has only scores, darkvision, fire resistance); a portrait for the maker's card.
- **The 121 grid-only spells**: HELD (Griz, 10-03) until the random-encounters question is ruled: do they stay the 8-bit's, or get grid maps?

## Open questions for Griz (not rulings)

- Random encounters: the 8-bit's, as the NES shape wants, or grid maps someday? (decides the 121)
- Whether cloud routines fired from the desktop draw on the same credit as hand-opened sessions.

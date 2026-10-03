---
layer: notes for the overseer. The cheap SRD fixes from the two-spellbooks reading (spells-two-books.md §2), built as one batch on Griz's word of 10-03: *"4 yes"* to "The cheap SRD fixes as one Sonnet or cloud batch?".
written: 2026-10-03, a cloud seat on GrimGriz/dragonsleep-8bit (config claude-opus-5-5), branch claude/spell-fixes off main at c7f8451. Started 07:55Z.
status: all fifteen BUILT, one commit each, each with a bench line that failed before and passes after. `python dev/check.py all` GREEN here (45 checks). Nothing past the fifteen was changed; what was found past them is in §4.
---

# The cheap SRD fixes

## 0. The room

- A Linux container with headless Chromium (`/opt/pw-browsers/chromium`). The benches ran here with `DEEP16_BROWSER=/opt/pw-browsers/chromium DEEP16_BROWSER_ARGS=--no-sandbox`: ae9af63 (bench16's knobs) cherry-picked, and the same two lines given to `dev/bench8.py` (2061df7). Unset, both benches use the desktop's Edge as before.
- Baseline before any fix: `check.py all` GREEN, 43 checks. After: GREEN, 45 (the two new `fixes1003` modes).
- New benches: `python dev/bench8.py fixes1003` (items 1-9; `fight9=1` adds a menu-driven fight with Blindness/Deafness) and `python dev/bench16.py x mode=fixes1003` (items 10-15). Both are in `check.py`: the 8-bit one in `ALL_SCRIPTS`, the grid one in `QUICK_MODES` and `ALL_MODES`.
- After each grid edit I ran `tools/deep16-build.py` and restored `deep16/js/palette.js`; after each 8-bit edit, `tools/compile.py` (every run ended `ok:`). The every-spell check still shows only its three by-design notes (Call Lightning, Plant Growth, Conjure Woodland Beings).

## 1. The fifteen

| # | Fix | Commit | Before -> after (the bench line) |
|---|---|---|---|
| 1 | 8-bit: one damage roll for an area | cf0b9b3 | Fireball on three ogres rolled 8d6 three times -> once; Ice Storm's two dice twice, not six times |
| 2 | 8-bit: Mislead's double | 86edbd6 | the ogre's club found Aurdin -> it bursts the double (one image, Mirror Image's d20) |
| 3 | 8-bit: Lesser Restoration ends one thing | bf9b36b | paralysis, blindness and poison all ended -> asked, BLINDNESS alone ends |
| 4 | 8-bit: Sleep skips the drow and the charm-immune | 1f16010 | drow, spell-weaver and naga slept -> the goblin alone |
| 5 | 8-bit: Hideous Laughter's save when hurt | 96962d6 | still laughing -> out of it on a 2 and a 19 (only advantage carries that) |
| 6 | 8-bit: Sleet Storm's fall | 2108eda | down, and the turn lost -> down, and it swings |
| 7 | 8-bit: darts and rays at several foes | acef27a | all at Goblin A (12, 0, 0) -> one dart each; X sends the rest at the last |
| 8 | 8-bit: Bless's extra target | 5b431da | three blessed from a 2nd-level slot -> four (the cleric guest's turn too) |
| 9 | 8-bit: Blindness/Deafness | b2120f9 | not in Aurdin's battle list -> in it; the ogre blinded with a CON save each turn |
| 10 | grid: Stoneskin nonmagical only | 437338c | magic scimitar 4, Ice Storm's 40 did 20 -> 8 and 40 (plain still 4) |
| 11 | grid: Sanctuary ends | 6864c76 | kept through a swing and a Sacred Flame -> ends on both; Bless and Healing Word keep it |
| 12 | grid: Protection from Evil and Good, the ward | 874d294 | a fiend's Fear took the warded fighter -> "proof against it" |
| 13 | grid: Shield against Magic Missile | dc6f8a6 | our wizard took 9, then 12 more, and theirs 10 -> asked, raised, 0 taken; the AI raises its own |
| 14 | grid: Magic Weapon refuses a magic blade | c5238b3 | +1 longsword went to +2 -> refused, and the card says why |
| 15 | grid: Ice Storm's difficult ground | 8095336 | never difficult -> difficult until the end of the caster's next turn |

Each commit also updates the register row (`spells-srd-by-class.md`: "BUILT 10-03 (the cheap SRD fixes, ...)", one clause) and the matching row in `spells-two-books.md` §2 ("now both" / "the grid's now the SRD's"), plus §2c's six grid findings marked fixed. For 9, the §0 count table and question 11 are updated too.

## 2. The readings I chose (where the SRD needed one)

- **6, Sleet Storm.** The SRD: "On a failed save, it falls prone." Nothing in it costs an action. With no squares, the fall costs no action. The foe attacks from the ice with the prone's disadvantage, is open to close blows, and gets up at its next turn (the 8-bit's prone already does this). The difficult ground has nothing to slow where nobody walks. Left as it was: the sleet still falls over the foes only, and there is still no concentration check and no flames doused (two-books law 6 and the 2b row).
- **3, Lesser Restoration.** The 8-bit lays no disease and no deafness, so its list is paralysis, blindness, poison, worst first (the grid's order). A paralysing poison (the crawler's feelers, the chuul's tentacles: `paralyzed` riding on `poisoned`) is one ailment, ended whole, as the grid has it. With more than one ailment the player is asked END WHICH? before the slot is spent, so a cancel costs nothing. With one, it just ends, and the battle says which.
- **7, the pickers.** Against more than one foe the player aims each dart or ray ("dart 2 of 3 at whom?"). X sends the rest at the last foe aimed; cancelling the first pick cancels the cast. Against one foe nothing more is asked. Each dart still rolls its own 1d4+1, as the grid's do (see question 1). No 8-bit caster run by the battle casts either spell yet, so `Battle.aimShots` (the grid's weighing: the weakest till it should be down, then the next) is built and benched but nothing calls it today.
- **11, grid Sanctuary, "a spell that affects an enemy creature".** I read it as: a spell aimed at a foe, or one that hurt a foe or laid something new on one (an area's catch). A spell on friends keeps the ward. Any attack the warded unit makes ends it, the floating weapon's blow included (see question 2).
- **13, the AI's Shield against darts.** It raises Shield for two darts or more, or for darts that could drop it. The AI's dart weighing also leaves out a foe whose barrier is already up.
- **9.** The two-books reading said the record's own fields would run it. They lacked `repeat`, and without it the 8-bit asks no save each turn, so I set `repeat: true` alongside `battle: true`. The grid's handler doesn't read `repeat`.

## 3. What the benches showed, and what was not seen

- **Blindness/Deafness in a fight** (`fixes1003 fight9=1`, six driven fights, Aurdin against two ogres at DC 13): it took four ogres of six. While blinded, an ogre swings at disadvantage and the party's blows come at advantage. One ogre shook it off at the end of its first turn. Two died still blind, and the fourth was still blind where my excerpt of the log ended.
- **A test that moved:** `dispel1002`'s readied-release check proves "no Counterspell" by the foe keeping its reaction. That foe wizard knows Shield, so after fix 13 it rightly spent its reaction on the darts. Its book loses Shield in that check (dev/bench16.js, commented), so the proof holds. Nothing else that passed before fails now.
- **Not seen:** nothing was looked at on a screen. The 8-bit's new menus (the dart picker's "dart 2 of 3", END WHICH? for Lesser Restoration) and the grid's SHIELD? prompt were answered by the benches, never seen drawn. The hail was drawn only to an offscreen canvas, to prove it doesn't throw. Its look is untested by eye. Edge on Windows was not run, so the desktop's `check.py` at merge is the real gate. No playtest.

## 4. Found past the fifteen (reported, not fixed)

1. **The grid's Ice Storm deals all of 2d8 + 4d6 as bludgeoning** (magic.js area(): one total, `sp.el`). The 4d6 is cold. A creature resisting or immune to cold, or to bludgeoning, reads it wrong. The 8-bit splits the two.
2. **Sanctuary and the floating weapon now part the two games.** The grid's spiritual-weapon blow is the caster's attack (Battle.attack), so it ends the ward. The 8-bit still spares that swing (two-books 2b: "bar the spiritual weapon").
3. **No grid foe carries magical weapon attacks** (the SRD's angels, fiends and golems: "weapon attacks are magical"). Stoneskin reads `atk.magic`, so a sheet that comes with such a creature should set it.
4. **The 8-bit's oozes lack `charmed` in condImmune** (the SRD lists it). Their `asleep` already keeps Sleep off, so nothing shows today.
5. **The drow's Fey Ancestry advantage against being charmed** is not read in the 8-bit. No 8-bit spell charms a foe, so it is moot today; the sheets now carry the trait for when one does.

## 5. Questions

1. Magic Missile: one 1d4+1 rolled for all the darts (the SRD's "roll the damage once for all of them", the darts striking together) or one roll per dart (both games today)?
2. Sanctuary: the grid now ends it when the floating weapon strikes, and the 8-bit doesn't. Bring the 8-bit in line?
3. The grid's Ice Storm: split its 4d6 into cold, as the 8-bit does? (Small; not built here.)
4. The sleet reading (the fall costs no action; it fights on from the ice): yes?

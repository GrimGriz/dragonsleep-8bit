# The race figures — notes for the overseer (cloud seat, 2026-10-03)

Branch `claude/race-figures`, from `main` at `9c957e2`. Griz, 10-03: *"1 per class, 2 cloud"*; *"generic kits per class"*.
Look at `deep16-race-figures.png` (repo root): every class figure beside its two races, idle facing S and E and one attack frame, 2x.

## What was built

- **24 sheets**, `deep16/art/npc<class>_dragonborn_p0` and `npc<class>_tiefling_p0` (`.png` + `.json`), one per class per race,
  each the same size and rows as its class sheet (idle, walk, attack, hurt; the cleric's `sit`, the casters' `cast`).
- **The composer** (`tools/lpc-compose.py`): `RACE_LOOKS` and `race_figure(cls_id, race, skin=None)` copy a class figure and lay the
  race over it; a loop registers the 24 in `FIGURES`. The kit, weapon and attack are the class's. `Item` takes one new keyword, `z`
  (`{layer: zPos}`), used only by the tiefling's horns. Another dragon colour is one more `race_figure(..., skin=<key>)` under its own id.
  - Dragonborn: the lizard head of the class figure's sex replaces the class's head (the female lizard head for the druid's orc head
    and the wizard's elderly head; both are noted in the figure's `meta.json`). The hair is dropped. The skin goes on body, head, tail and
    ears, and the lizard tail and dragon ears are added. No wings.
  - Tiefling: the class's own head and hair, the garnet skin, the curled horns and the lizard tail. Where the class head is not a human
    one (only the druid: Higertha's orc head), the human head of the same sex stands in, so the tiefling has no tusks.
- **The hook** (`deep16/js/classes.js`): one helper, `classLook(cls, race)`, used by `NPC.lookOf` and `NPC.unit`'s `u.sheet`. For a race
  other than human it returns `npc<class>_<race>_p0` when `D16.SHEETS` has it, and otherwise the class's look. A named one's `look`
  still wins, `u.kind` stays `'npc' + cls`, and `NPC.heroUnit` is untouched.
- **Rebuilt** `deep16/data/sprites.js`: 24 entries added, none of the other 111 changed (checked entry by entry). In `deep16/index.html`
  only the `data/sprites.js` and `js/classes.js` stamps changed (see the finding below).
- **Credits**: `deep16/CREDITS.md`, Pipeline 0, has a new subsection after the class NPCs' with the five new definitions (the lizard
  heads, male and female; the lizard tail; the dragon ears; the curled horns), copied from each definition's `credits` by the
  composer's `write_credits`. The entries already there are unchanged.
- **`invented.json`**: one line, `deep16-race-looks`, added with `tools/invented_add.py`.
- **Baseline**: before adding anything, the twelve class figures were recomposed and repixelated here. They came out pixel-identical
  to main's sheets, so the overlay is the only source of difference in the new ones.

## The keys chosen

| | kept | also tried | why |
|---|---|---|---|
| dragonborn skin | `all.lpcr.amber` | `all.lpcr.yellow`; `amber` (ulpc), `fur_gold` | reads gold and snaps onto the palette's gold ramp; yellow goes pale and blond, ulpc amber goes peach like a human skin, fur_gold is close to amber but a shade duller |
| tiefling skin | `all.lpcr.garnet` | `all.lpcr.wine`; `all.lpcr.red` | wine's face goes near-black at 1x and the eyes are lost; red is a touch brighter than garnet and stands a little further from red hair |
| horns | `head_horns_curled`, colour `all.lpcr.yellow` (the generator's own "horns" colour) | `head_horns_backwards` | curled read as ram horns framing the face; backwards read as a small spike |
| horns' layer | z131, over hoods and hats | the definition's z126 | at z126 the ranger's and rogue's hoods and the wizard's hat (z130) cover the curled horns entirely |

The dragon ears stay at their own z126, so they are hidden under the ranger's and rogue's hoods and the wizard's hat; there the snout
and the tail carry the race. Hair snapped to the palette goes red in the class sheets already (the fighter's dark brown), so on
garnet skin the tiefling fighter's hair and face sit close; the outline keeps them apart.

## Bytes

Every sheet image is fetched at start (`S.images`). The 24 PNGs add **4,657,072 bytes** (dragonborn 2,280,811; tiefling 2,376,261), so
the sheet images go from 32.1 MB to 36.8 MB, **+14.5%**. `data/sprites.js` grows by 13,134 bytes. The show sheet is 136,725 bytes and
is not loaded by the game.

## Seen, and not seen

Seen in this container's headless Chromium (Playwright's, `/opt/pw-browsers/chromium`):
- `python dev/check.py`: **GREEN**, 18 checks in 18 s, after cherry-picking `ae9af63` (from `claude/intelligent-maxwell-6ich3v`) as
  `0015dc9`, with `DEEP16_BROWSER=/opt/pw-browsers/chromium DEEP16_BROWSER_ARGS=--no-sandbox`.
- `python dev/bench16.py "~fighter.5.dragonborn.16-14-16-10-12-8.greatsword_chainmail___handaxe__.Brokk" lvl=5 n=2`: it loads and fights;
  the four win 2 of 2; exit 0.
- A probe page (the bench page with the bench script swapped for a probe):
  - for each of the twelve classes and the races dragonborn, tiefling, human, dwarf, half-orc and elf, `NPC.lookOf` and `NPC.build(...).sheet`
    agree, and every name they return is in `D16.SHEETS`;
  - Brokk's unit gets `npcfighter_dragonborn_p0`, with kind `npcfighter`;
  - Higertha, Talmok and Torvald keep `npcdruid_p0`, `talmok_p1` and `torvald_p0`.
- A class-floor fight (`?npc=` three made characters `&vs=` three more `&watch`) loaded and screenshotted in the engine. The figures
  draw on the grid and in the turn card's portrait, and the console had no errors.

Not seen:
- the `?pocket` maker's own screens, clicked through;
- the camp (`camp.js`, through `NPC.lookOf`);
- any frame beyond idle S/E, one attack frame and the six figures in that fight: every `walk`, `hurt`, `cast`, and the cleric's `sit`;
- the game in the desktop's Edge.

## Findings (not fixed here)

- **The stamps and line endings.** `tools/deep16-build.py` stamps each script with a hash of its bytes. Run on Linux, it moves 29
  of the 60 script stamps, because main's stamps are mostly hashes of the desktop's CRLF checkout. Here only the two changed files were
  restamped, by hand, with the LF hash, which is how their stamps on main were made (the build writes `sprites.js` LF on Windows too).
  A desktop build after the merge may move other stamps; that is harmless.
- **The container.** It had no PIL, numpy or scipy (pip-installed here), and it does have a Chromium, so the gate ran here.
- **The tail.** The SRD 5.1 gives neither race a description (`srd/01-races.md` has traits only). The PHB's dragonborn "lack wings or a
  tail"; the job asked for the tail, so it is built. Dropping it is one line in `RACE_LOOKS['dragonborn']['add']` and a recompose.
- **The cherry-pick.** `ae9af63` rides this branch as `0015dc9`, the same patch, so merging both branches is clean.

## Questions

1. Gold as `all.lpcr.amber` and garnet as `all.lpcr.garnet`: keep them, or move the tiefling to `all.lpcr.red`?
2. The curled, bone-yellow horns drawn over hoods and hats: keep?
3. The dragonborn's tail: keep it (as asked), or drop it (the PHB's dragonborn has none)?
4. 4.7 MB more at every start (+14.5%) for figures that only a made dragonborn or tiefling uses: load the race sheets only when a fight
   needs them (a later job in `sprites.js`)?

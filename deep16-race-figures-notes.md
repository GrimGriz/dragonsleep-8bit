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

## For the next seat (the close, 2026-10-03)

started 2026-10-03T07:31Z, ended 2026-10-03T14:17Z. The cairn's close (the daily, the bolt entry, the card) lives on Griz's PC; the
desktop seat writes it. This seat's opener was the prompt `dev/cloud-prompt-race-figures.md`, on his PC.

### Where it stands

- **Merged.** The overseer merged this branch as `7beba7c`, then restamped `classes.js` in `979ed86` (see gotcha 6).
- **Question 4 is answered by another job.** The lazy sheets (`56d42b5`) landed after: no sheet is fetched at start, and a scene asks for
  its own sheets. `cloud-notes/lazy-sheets-notes.md` measures a Pocket DM fight with a dragonborn at 3.96 MB to its first turn.
- **Questions 1 to 3 are open.** Nothing on `main` rules them: not `cloud-jobs.md`, not invented.json's `deep16-race-looks` line.
- **Rechecked at the close**, on `main` at `eac193b`, in this container's Chromium:
  - the probe: all 24 sheets resolve; the other races keep the class figure; Higertha, Talmok and Torvald keep their own; Brokk gets
    `npcfighter_dragonborn_p0` with kind `npcfighter`;
  - `python dev/check.py`: GREEN, 20 checks in 18 s, `lazy1003` among them.
- **This branch** was restarted from `main` at `eac193b` for this note, since all its old commits are in `main`. It is `main` plus this
  one commit, so merging it is a fast-forward.

### Who said what

- **Griz, 10-03**, quoted in the job's prompt: *"prolly should check if there's dragonborn available through the method we've used for
  the ones we got (free LPC or something?)"*, then *"1 per class, 2 cloud"* and *"generic kits per class"*. That is all of his word this
  job rests on.
- **The prompt** (the overseer's words, not his) set:
  - gold for the dragonborn ("the colour of the sheet Griz had made");
  - garnet or wine for the tiefling, two keys tried each;
  - curled or backwards horns, the seat to pick and say;
  - a tail on both and no wings;
  - the hook as two lines, and the colour as a parameter.
- **The seat's own calls, none ruled:** `all.lpcr.amber`; `all.lpcr.garnet`; the curled horns in `all.lpcr.yellow` at z131, over hoods and
  hats; the tiefling druid's human head; the dragon ears left under hoods; the `classLook` helper. They are recorded as picks on
  invented.json's `deep16-race-looks`. When he rules, add his words to that line with `tools/invented_add.py` (an `append`, not an `add`).
- **At the close** Griz ruled nothing; he asked for this note.

### Gotchas (each cost time here)

1. **A fresh clone has no Pillow, numpy or scipy:** run `pip install pillow numpy scipy`. `deep16/_src/lpc/` starts empty; the first
   compose of the twelve class figures fetches 242 files (about 657 KB, about a minute).
2. **`FIGURES` carries tuples** (`'attack': ('slash', 'slash_oversize')`). A JSON round-trip turns them into lists, and `build_figure`
   then fails with `body has no ['slash', 'slash_oversize'] sheet`. Copy a figure with `copy.deepcopy`.
3. **`meta.json` notes are joined with `'; '`,** so a semicolon inside a note splits it in two.
4. **The composer writes `CREDITS.md` and `_contact.png` only on a full run:** every figure plus the spider. The spider needs
   `deep16/_src/lpc/LPC_Spiders.zip`, which a clone does not have. On a partial run, call `write_credits(built, path)` yourself, as the
   credits here were made, and make your own show sheet.
5. **The show sheet's script was in the scratchpad and is gone.** To remake `deep16-race-figures.png`:
   - one row per class: the class sheet's idle facing S, then for each race idle S (facing 0), idle E (facing 6), and the attack's
     middle frame facing E;
   - each cell a 96×88 window, with the anim's foot (`ax`, `ay` in the `.json`) placed at (48, 74);
   - scaled ×2, nearest-neighbour.
6. **The stamps: the finding above was half wrong.**
   - `sprites.js` is written LF by the build on Windows too, so its LF hash was right.
   - `classes.js` is not written by the build. The desktop's stamp for it is the hash of its CRLF checkout, which is why the overseer
     had to restamp it.
   - From the cloud, never let the build stamp blind (it moves 29 of the 60). Restamp only what changed: the LF hash for build-written
     files (`sprites.js`, `palette.js`); for hand-edited ones, the CRLF hash (sha1 of the bytes with `\n` made `\r\n`, first 10 hex
     digits). Or leave the stamps to the desktop, and say so in the notes.
7. **`tools/deep16-build.py` rewrites `deep16/js/palette.js`:** run `git checkout -- deep16/js/palette.js` after it.
8. **Benches in the cloud:** set `DEEP16_BROWSER=/opt/pw-browsers/chromium DEEP16_BROWSER_ARGS=--no-sandbox`. `bench16.py` and
   `bench8.py` both take them on `main` now.
9. **Seeing the game here:** Node's Playwright is installed globally (`NODE_PATH=/opt/node22/lib/node_modules`).
   - Serve the repo root with `python3 -m http.server`, then open `deep16/index.html?npc=<words>&vs=<words>&lvl=5&watch`.
   - Press `e` to begin; the mouse wheel zooms. The game loop runs, unlike under Edge's `--screenshot`.
   - `pkill -f` and `pgrep -f` match their own shell: kill the server by PID.
10. **The palette snap draws dark-brown hair red** (the class sheets on `main` too), so the tiefling's red hair and garnet face sit close.
11. **The hook names a sheet by race alone** (`npc<class>_<race>_p0`). Composing another dragon colour is one `race_figure(..., skin=)`
    call, but the game choosing it needs an ancestry on the spec and in the `~` word (`NPC.decode`, `NPC.code`) first.

### Not seen (beyond the list above)

- No record shows Griz has looked at `deep16-race-figures.png`.
- The `?pocket` maker clicked through. The nearest anything came is the lazy seat's `lazy1003`, which fetches a dragonborn's sheet for a
  Pocket DM fight.
- The camp drawing a made dragonborn or tiefling.
- Any walk, hurt or cast row, and the cleric's sit.
- The desktop's Edge.

### What to rerun, and when

- **He rules a colour (question 1):**
  1. Set `RACE_LOOKS[race]['skin']` in `tools/lpc-compose.py`.
  2. Run `python tools/lpc-compose.py` and then `python tools/pixelate.py p0`, each with that race's twelve ids.
  3. Run `python tools/deep16-build.py`, then `git checkout -- deep16/js/palette.js`.
  4. Remake the show sheet (gotcha 5), update the keys table above, and append his words to `deep16-race-looks`.
  5. `python dev/check.py` must be GREEN before the push. The other race's twelve do not change.
- **He rules the horns (question 2):** the twelve tieflings, the same steps; change the horns entry in `RACE_LOOKS['tiefling']['add']`.
  The backwards horns have a second layer at z7, behind the head: lift only layer 1.
- **He drops the tail (question 3):** take it out of `RACE_LOOKS['dragonborn']['add']` and redo the twelve dragonborn, the same steps.
  The tail's credits entry stays, because the tieflings use it; its "Used by" becomes the twelve tieflings.
- **Any edit to `deep16/js/classes.js`:**
  - restamp it (gotcha 6);
  - rerun the probe's three checks, because `dev/check.py` does not check which sheet a race gets: all 24 resolve, the other races
    keep the class figure, and the named ones keep theirs. As a bench mode it would ride the gate; it is not built.
- **A new ancestry or race:** gotcha 11 first.
- **Queued on `main`, not this job** (`cloud-jobs.md`): the breath weapon and the resistance, the tiefling's spells, a portrait for the
  maker's card.

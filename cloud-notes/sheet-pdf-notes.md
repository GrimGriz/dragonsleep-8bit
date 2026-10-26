room: the character sheet as a PDF on the Pocket DM -- a cloud seat, 2026-10-26 (started 2026-10-26T07:50Z), branch `ccr-fc0b66f4-7zmda2`; the second game (DEEP16), the Pocket DM and the races

# The character sheet as a PDF (10-26)

Griz, 10-26: *"Somewhere in the pocket DM - reference user interface best practices - players should be able to save pdf of character sheet"*.

## What landed

- `deep16/js/sheetpdf.js` (new): `D.sheetPdf.model(h, o)` reads a sheet into the paper's words and numbers (all the engine's own: `R.ac`, `R.attackBonus`,
  `R.damageExpr`, `R.offhandDamage`, `R.saveBonus`, `R.skill`, `R.spellDC`, `R.spellAtk`, `D16.FEATURES`' words, a hero's `featText` by `DS.MENU.featureLines`);
  `bytes(m)` writes the PDF by hand (no library); `fileName(m)`; `save(h, o)` makes it and downloads it.
- `deep16/js/pocket.js`: **PDF** beside GEAR under each card of THE PARTY (the same cards GEAR shows on: not a locked one, not the king's -- his gear is not to be
  seen, his word); the hint line says what a chosen button with a `tip` does; **SHEET PDF** beside SAVE on the maker's last page; `PK.bareSpec` (the sheet
  with nothing cast ahead and no ladder carry), `Pocket.sheetPdf`, `Pocket.cardPdf`. The message names the file and keeps inside the screen (a long name
  takes the short line).
- `deep16/index.html`: the script, before `pocket.js`; stamped by `tools/deep16-build.py`.
- `dev/bench16.js` `mode=sheetpdf1026`, in `dev/check.py`'s quick and full lists: 11 checks. Proved RED on the old `pocket.js` (byte-exact swap, restored, `cmp`).
- `js/eyes.js` `eyes-sheetpdf-1026` (door `deep16/?pocket&fresh=26`, a live door: it is a press and a file, to be tested by his hands).
- `invented.json` `sheetpdf-words` (fold `rule`): the race traits' lines and the sheet's headings, drafted.

## The UI calls (the best practices he named, as applied)

1. **Where the character lives**: the action is on the card itself and on the maker's last page, not in a menu of its own.
2. **Named by its result**: PDF / SHEET PDF; the hint line spells it out ("PDF: saves Wenna Test's character sheet, to print or keep") when chosen by mouse or pad.
3. **One press, a real file**: a `.pdf` download, not the print dialog (where a player must know to pick "Save as PDF"); works offline and on the live site alike.
4. **Feedback**: the message names the file and where it went, as SAVE THE PARTY does.
5. **A file named for what it holds**: `<name>-<class><level>-sheet.pdf`; a level-up's sheet does not overwrite the last.
6. **Consistency**: the house's own button, size and placement grammar (EDIT | DROP's split row); d-pad and keys reach it like every other button.
7. **The paper for the table**: ink-light (black, grey rules, no fills but the attack rows' pale band), boxes and circles for a pencil, the 5e order a table
   already knows, one page for most, A4-safe margins.

## Checked

- 16 characters (the four heroes, a made wizard and fighter, every class at 8 and more) through pypdf strict mode and poppler's `pdftoppm`: all parse
  silently; pages looked at by eye (Lymen, the cleric at 8, Barley, the monk, the made wizard): the numbers match the cards.
- A real download in headless Chromium (Playwright's `download` event): `wenna-test-wizard5-sheet.pdf`, 24 KB.
- Quick gate `python dev/check.py`: GREEN, 101 checks.

## For the next seat

- **Run the benches here with the headless shell**, not `/opt/pw-browsers/chromium`: the full build sat five minutes calling Google's hosts through the
  proxy and timed out; `DEEP16_BROWSER=$(find /opt/pw-browsers/chromium_headless_shell-* -name chrome-headless-shell -type f | head -1)
  DEEP16_BROWSER_ARGS=--no-sandbox` runs a mode in about a second.
- **The PDF is ASCII but for its second line**: `bytes()` returns a string of one-byte characters and `save()` makes a `Uint8Array` of it -- a `Blob` of the
  string would write UTF-8 and break every xref offset. Text past ASCII goes in as WinAnsi codes, octal-escaped in the stream (`codes`, `pdfStr`).
- **The wrap trusts the width table**: `HELV` / `BOLD` are Helvetica's AFM widths for 32-126; a new glyph past those falls back to 540/700. If a sheet's text
  ever overruns a column, check the table before the layout.
- **The skills**: the grid models only the skills its fights read (a class card's Stealth and Perception, a hero's own list); the sheet shows all eighteen,
  the unkept ones at the ability's modifier with an empty circle and a note to mark the table's own. If the maker ever picks skills, they come through `h.skills`.
- **Not built**: a QR code to the word; the party's pack and purse on the sheet (they are the party's, not one character's); the morning's chosen day on a
  prepared caster (the sheet marks the build's default day). Ask him before building any.

## For the desk

- A pointer on the todo under the Pocket DM and the races lane: this item landed, to main and to live on his word (*"Solid. Keep 3 and merge live please"*).
- His answers to the seat's four: (3) the eighteen skills stay as built (*"Keep 3"*, a `ruled` line); he saw the party screen and Lymen's sheet in chat
  (*"Solid."*, a `seen` line; `eyes-sheetpdf-1026` folded); (1) the placement and labels and (2) Pyro with no PDF at the DM's table stand as the seat's calls,
  not ruled, his to overrule.

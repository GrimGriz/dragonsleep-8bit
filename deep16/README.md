# DEEP16 — past the door

A proof of concept: the world past Deepholm's door, 16-bit at a Diablo angle, on a 5-ft grid, with more of the 5E
rules — movement, the action economy (bonus actions and reactions included), opportunity attacks, cover, flanking, an
area spell. One map, one fight, the 8-bit save carried across. Spec: `they live\handoff-2026-09-26-deep16-poc-spec.md`.

- **Play:** after the expansion's credits choose **PAST THE DOOR**, or open `deep16/` straight
  (https://grimgriz.github.io/dragonsleep-8bit/deep16/). `?gate` shows the sprite comparison (the three pipelines);
  `?view` walks a cursor round the cavern; `?stats` (or the ` key) shows the frame rate; `?scale=N` forces a scale.
- **Keys:** mouse hover/click, right-click to inspect, the wheel (or -/=) zooms out and back, middle-drag or the
  screen's edge (a 16-px band, or anywhere past the canvas) to look round · arrows/WASD move the cursor a square a
  press along the grid, as on the 8-bit map (up is up-right on screen), or the menu · E/Z confirm · X/Esc back, and at
  rest the menu · Q the ring · 1–9 commands · SPACE end turn · C recentre · H hints · M/Tab the menu (PARTY, HINTS,
  MENU style, AUTO END TURN, restart, the gate, RETURN TO SILVERTON).
- **Menu styles** (RULED 09-27, Griz: the ring main, the window for those who'd rather; the first try's BAR of
  buttons dropped. Switched in the menu, kept per browser, or `?menu=ring|window`): **RING** — a Secret of Mana-style
  ring of icons round the hero; a turn starts on the grid, ready to walk, and the ring comes up on Q, E over the hero
  or a click on him. SPELLS opens a ring of levels, a level a ring of its spells (up/down picks the slot) ·
  **WINDOW** — a Chrono Trigger-style command window with a pointing hand, up at rest; SPELLS and ITEM open a list
  (left/right picks the slot level). The bar shows **BARM** after the class — bonus, action, reaction, move and the
  feet left — each lit while it's there to spend.
- **Zoom:** the screen is drawn at the window's whole-number scale, so zooming out steps by whole device pixels
  (at 3×: 1, 2/3, 1/3; at 2×: 1, 1/2) and stays crisp; the menus and the floating numbers keep their size.
- **AUTO END TURN** (on by default, in the menu): when every command is grey and there's no square left to step to,
  the turn passes after a beat; X holds it.
- **HINTS** (H): hints on the grid — a rogue's reachable squares that no foe she knows of sees plainly are tinted.
- **Runs** from any static server (the 8-bit game's `dragonsleep` preview on 8923 serves it at `/deep16/`); it loads the
  8-bit game's `../js/font.js`, `../data/data.js` and `../js/rules.js`, so the lettering and the character maths are
  the 8-bit game's own. Nothing here is loaded by the 8-bit game.

## The save

Same origin, one localStorage. DEEP16 reads `deep16.handoff` (the snapshot PAST THE DOOR writes) unless a slot was saved
since, else the newest `ds8-save-N`, else a fixture (the four at level 9). It writes nothing to the 8-bit game's keys.
The entry card's **2** swaps between the save and the fixture: the fight is built for level 9.

## The look — three pipelines (RULED 09-27 by Griz: LPC the base, Blender for special monsters)

All three end in the same pass (`tools/pixelate.py`): one 64-colour palette (`palette.json`), a hard alpha, a 1-px
outline. Sheets are `art/<figure>_p<N>.png` + `.json` (per-animation frame sizes; 8 facings: S SW W NW N NE E SE).

- **Pipeline 0, LPC** (`*_p0`): `python tools/lpc-compose.py` fetches the layers from the Universal LPC Spritesheet
  Character Generator (GitHub), recolours them from its palettes and composites the figures into
  `_src/lpc/composed/`; then `python tools/pixelate.py p0 all`. Four directions onto eight facings.
- **Pipeline 1, Blender pre-render** (`*_p1`): `"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b
  --disable-autoexec --python tools/render-sprites.py -- <figure> 8` renders a CC0 model (KayKit, or the OpenGameArt
  spider) at the dimetric angle — orthographic, X 60°, Z 45°, the toon matcap — per `tools/deep16-figures.json`
  (which parts show, the atlas recolours, the actions); then `python tools/pixelate.py p1 all`.
- **Pipeline 2, generated** (`denny_p2`): Griz's generated character sheet, cut and cleaned by `python tools/denny-sheet.py`.
- Then `python tools/deep16-build.py` (the palette and sprite manifest as JS; `?v=` stamps on `index.html`).
- The downloaded packs live in `_src/` (gitignored). Credits and licences: `CREDITS.md` (the LPC-derived sheets are
  CC-BY-SA / GPL and stay so).

## The code

`js/core.js` (canvas 480×270 integer-scaled, loop, input) · `js/iso.js` (the 2:1 projection, the baked floor, walls
cut on the near side, painter's order, picking) · `js/art.js` (stalagmites, cocoons, rubble drawn through the
palette) · `js/sprites.js` · `js/save.js` · `js/grid.js` (movement, reach, line of sight and cover, templates,
flanking) · `js/rules.js` (economy, advantage, saves with the aura, damage) · `js/battle.js` (the fight as a
generator: turns, commands, attacks and their reactions, the spells) · `js/ai.js` (the drow, the phase spider, guests)
· `js/ui.js` (the bar, the pips, the overlay, cards, prompts) · `js/fx.js` · `data/cavern.js` (the map) ·
`data/foes.js` (the SRD phase spider; the expansion's Drow Captain with the SRD hand crossbow — PROPOSED).

A stepped harness for testing lives in `dev/deep16-harness.js` (gitignored): pause the loop, drive a turn per call,
rig the dice, inject an attack.

## Not in the POC

Story beyond the entry card; shops; rests; levelling; more than one map or fight; writing back to the 8-bit save;
sound; touch. The visual crossing (the 8-bit frame gaining resolution at the door) is the next handoff.

# The first game's fixes since the freeze

One line a fix, written by `python tools/first-lock.py fix "<why>"`: when (UTC) · the files under the lock that changed · why. Frozen 2026-10-31 (first/README.md).

- 2026-11-03T21:46Z · first/js/core.js (changed), index.html (changed) · A script left waiting on a scene the title or a load cleared now ends with it, so the game started after takes the keyboard (11-03, his: my keyboard doesn't seem to be working after starting a game)
- 2026-11-11T06:44Z · first/js/battle.js (changed), first/js/scenes.js (changed), first/js/situations.js (changed), first/js/smoke.js (changed), first/js/world.js (changed), index.html (changed), first/js/heroes8.js (new) · the art desk's ART-77-8BIT Lymen and Vivian drawn in place of their typed battle and map figures (first/js/heroes8.js, tools/heroes8-sheet.py; the battle plays the two-frame rows and Win, the map a stand of its own), Griz 11-11: thaw out the 8-bit freeze long enough to replace the main hero 8-bit graphics
- 2026-11-11T06:52Z · first/js/situations.js (changed), index.html (changed) · the ?at=heroes8 show's own quotes escaped (d9d676fa left first/js/situations.js unparsed; the eyes probe caught it), the thaw for the main heroes' graphics

# first/ -- THE FIRST GAME, frozen

Griz, 2026-10-31: *"See if you can pull off the freeze/separation, first game is good enough and sitting standby for polish pass when 16bit is finished"*.

DRAGONSLEEP, the 8-bit (the first game), runs from this folder. Its page is still `index.html` at the root, so the live URL and the players' saves are as they were; every script that page loads is here:

- `first/js/` -- the first game's engine. Eighteen files moved here from `js/` (git keeps their history: `git log --follow`); five are byte copies of the files the two games shared till now -- `rules.js`, `menu.js`, `audio.js`, `font.js`, `pad.js` -- as they stood at the freeze.
- `first/data/data.js` -- its compiled data, byte-identical at the freeze to `data/data.js`.
- `first/content/` -- the content it compiles from (the maps in `first/content/maps/`), a copy of `content/` at the freeze.

**What the second game keeps:** `js/` (the five shared files and `js/eyes.js`), `data/data.js` and `content/` are the second game's now -- `deep16/index.html` loads them. Change them freely: nothing there reaches the first game any more.

**The lock:** `first/MANIFEST.json` holds every frozen file's hash (and the root `index.html`'s). `python tools/first-lock.py check` runs in the quick gate (`dev/check.py`): a frozen file changed, added or gone is RED.

**A first-game fix** (bug fixes only, the TWO GAMES ruling; then the polish pass after the 16-bit):

1. Edit what is here -- `first/js/<file>.js`, or `first/content/<file>.json`. A map: `python tools/mapgen.py --first` rewrites `first/content/maps/` from today's `tools/mapgen.py`, which may carry the second game's changes since the freeze, so diff what it wrote and keep only the fix; `python tools/checkmaps.py --first` walks them.
2. `python tools/first-lock.py fix "<what was fixed, his words where he gave them>"` -- compiles `first/data/data.js` (`tools/compile.py --first`), restamps the root page, rewrites the manifest and adds a dated line to `first/FIXES.md`.
3. The 8-bit benches already test this folder: `dev/bench8.py` builds its page from the root `index.html`'s script list.

`tools/compile.py` with no flag builds `data/data.js` for the second game and leaves the root page alone.

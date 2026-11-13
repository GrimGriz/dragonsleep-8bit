"""DEEP16 pipeline 2 (generated art): the wolf, drawn -> deep16/art/wolf_p1, all eight facings (the Quaternius render it replaces was wolf_p1 since 09-27).

    python tools/wolf-sheet.py            (writes deep16/art/wolf_p1.png/.json)
    python tools/wolf-sheet.py check      (also deep16/art-src/wolf/wolf_p1-review.png: every row of every drawn view at 3x)

The art desk's WOLF-P1-SELECTED-SOURCE-SHEETS (11-13; it reached Fresh after its own paint-over, the mirror wolf's three states), sorted to
deep16/_src/wolf/2026-11-13-wolf-p1-selected-source-sheets/ (the zip beside it): 15 pages, 120 drawings -- Idle 8, Walk 8, Bite 8 in SE, the rear NE,
S, E and N. Cut by tools/wolfpages.py at tools/mirrorwolf-sheet.py's own K on the same 96 x 96 cell (the foot at 48,77): the mirror wolf's pages are
these pages painted over, registered to the pixel, so the wolf and the mirror wolf are one animal in one place. The SE idle 28 px sole to ear, 30 with
the outline (the old render's SE idle was 34 x 26). Rows: idle 6 fps, walk 10, attack 12 with `release` 2 (the Bite closes on drawing 3).
Worn by the wolf, the wild-shaped druid's wolf and every pack on the road; the werewolf's held `towolf` ends on this sheet's Idle 1 when that is built.
"""
import importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('wolfpages', os.path.join(ROOT, 'tools', 'wolfpages.py'))
WP = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(WP)

NAME = 'wolf_p1'
FOLDER = os.path.join(WP.pix.SRC, 'wolf', '2026-11-13-wolf-p1-selected-source-sheets')
GEOM = (96, 96, 48, 77)
K = 245 / 28.0                          # (the mirror wolf's: tools/mirrorwolf-sheet.py)
SOURCE = ('drawn by the art desk (WOLF-P1-SELECTED-SOURCE-SHEETS, 11-13: Idle 8, Walk 8, Bite 8 in five views), cut by tools/wolf-sheet.py through tools/wolfpages.py; '
          'SW W NW mirrored -- the SRD 5.1 Wolf: deep16/data/foes.js wolf')

if __name__ == '__main__':
    frames = WP.cut_state(WP.frame_map(FOLDER), 'regular', K, GEOM)
    WP.write(NAME, frames, GEOM, SOURCE)
    if 'check' in sys.argv:
        WP.review(NAME, frames, os.path.join(ROOT, 'deep16', 'art-src', 'wolf', NAME + '-review.png'))

"""DEEP16 pipeline 2 (generated art): the worg, drawn -> deep16/art/worg_p1, all eight facings (the Quaternius render it replaces was worg_p1 since 09-27).

    python tools/worg-sheet.py            (writes deep16/art/worg_p1.png/.json)
    python tools/worg-sheet.py check      (also deep16/art-src/worg/worg_p1-review.png: every row of every drawn view at 3x)

The art desk's WORG-SOURCE-SHEETS (11-13), sorted out of Fresh to deep16/_src/worg/2026-11-13-worg-source-sheets/ (the zip beside it): 15 pages, 120
drawings -- Idle 8, Walk 8, Bite 8 in SE, the rear NE, S, E and N, a page each, on a 4 x 2 grid its FRAME-MAP.json names. Cut by tools/wolfpages.py
(its head says how). Its size: the old sheet's own -- the SE idle 49 px sole to crest, 51 with the outline (the art desk measured the old SE Idle 1 at
67 x 51 in this same 120 x 122 cell, the foot at 60,98), so K is the SE idle's 270 page px over 49; one scale for every view, so S and N stand as
tall as they are drawn (62 and 63). Rows: idle 6 fps, walk 10, attack 12 with `release` 2 (the Bite; the jaws close on drawing 3).
The mirror worg's three states are paint-overs of these pages and are cut at this K on this cell (tools/mirrorworg-sheet.py).
"""
import importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('wolfpages', os.path.join(ROOT, 'tools', 'wolfpages.py'))
WP = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(WP)

NAME = 'worg_p1'
FOLDER = os.path.join(WP.pix.SRC, 'worg', '2026-11-13-worg-source-sheets')
GEOM = (120, 122, 60, 98)
K = 270 / 49.0
SOURCE = ('drawn by the art desk (WORG-SOURCE-SHEETS, 11-13: Idle 8, Walk 8, Bite 8 in five views), cut by tools/worg-sheet.py through tools/wolfpages.py; '
          'SW W NW mirrored -- the SRD 5.1 Worg: deep16/data/foes.js worg')

if __name__ == '__main__':
    frames = WP.cut_state(WP.frame_map(FOLDER), 'regular', K, GEOM)
    WP.write(NAME, frames, GEOM, SOURCE)
    if 'check' in sys.argv:
        WP.review(NAME, frames, os.path.join(ROOT, 'deep16', 'art-src', 'worg', NAME + '-review.png'))

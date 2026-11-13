"""DEEP16 pipeline 2 (generated art): the Mirror Stirge -> deep16/art/mirrorstirge_p1, all eight facings (it rode stirge_p1 as a stand-in since 11-13).

    python tools/mirrorstirge-sheet.py            (writes deep16/art/mirrorstirge_p1.png/.json)
    python tools/mirrorstirge-sheet.py check      (also deep16/art-src/mirrorstirge/mirrorstirge_p1-review.png: every row of every drawn view at 3x)

The art desk's ART-143 (art-wanted section 61, asked 11-13 by the wisp-and-stirge seat; delivered the same day with ART-48's repair): 30 pages, 230
drawings -- S, SE, E, the rear NE and N, each Idle 8, Fly 8, Magicdrain 8, Flinch 6, Death 8, Latched 8. A stirge of smoked glass and silver facets,
violet in the eyes and at the needle. Cut by tools/stirgepages.py (its head says how) on stirge_p1's own 96 x 112 cell, so the two swap without a jump.
Rows, as the art desk routes them: idle; walk <- Fly; attack <- Magicdrain, `release` 4 (the art desk: "hit on frame 5"); flinch; hurt <- Death (it
cracks, shatters and lies as shards; played once, down at the end); latched (its needle in, filling with light). The moving ripple stays the
engine's (deep16/data/foes.js mirrorstirge: `ripple`).
"""
import importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('stirgepages', os.path.join(ROOT, 'tools', 'stirgepages.py'))
SP = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(SP)

NAME = 'mirrorstirge_p1'
ROWS = ['idle', 'walk', 'attack', 'flinch', 'hurt', 'latched']
FPS = {'idle': 8, 'walk': 10, 'attack': 12, 'flinch': 10, 'hurt': 8, 'latched': 6}        # (stirge_p1's)
LATCH = {'S': (48, 79), 'N': (48, 79), 'SE': (32, 80), 'E': (32, 80), 'NE': (32, 80)}     # (where stirge_p1's latch of each view rides: its first frame's centroid)
SOURCE = ('drawn by the art desk (ART-143, 11-13: art-wanted section 61 -- Idle 8, Fly 8, Magicdrain 8, Flinch 6, Death 8, Latched 8 in five views), cut by '
          'tools/mirrorstirge-sheet.py through tools/stirgepages.py; SW W NW mirrored -- deep16/data/foes.js mirrorstirge')

if __name__ == '__main__':
    fmap = SP.frame_map()
    d = {v: SP.view_rows(fmap, NAME, v, ROWS, LATCH[v]) for v in ('S', 'SE', 'E', 'NE', 'N')}
    frames = {r: [d['S'][r], SP.mirror(d['SE'][r]), SP.mirror(d['E'][r]), SP.mirror(d['NE'][r]), d['N'][r], d['NE'][r], d['E'][r], d['SE'][r]] for r in ROWS}
    SP.write(NAME, frames, ROWS, FPS, SOURCE, extra={'attack': {'release': 4}})
    if 'check' in sys.argv:
        SP.review(frames, ROWS, os.path.join(ROOT, 'deep16', 'art-src', 'mirrorstirge', NAME + '-review.png'))

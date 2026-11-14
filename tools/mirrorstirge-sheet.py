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

# THE TWO STATES (11-14, the hyena-stirge seat, on the lanes desk's relay of Griz's "Art landed in Fresh"; art-wanted section 62): the art desk's
# ART-143-WITHERED-AND-CHARGED-SUPPLEMENT, 60 pages -- the same five views and six rows, each a paint-over of the Normal page on its own grid. Sorted to
# deep16/_src/stirge/2026-11-14-ART-143-WITHERED-AND-CHARGED-SUPPLEMENT/. Cut the Normal's way, every drawing placed by its own number but with the
# NORMAL page's offset and fall (stirgepages view_rows `ref`), so the three swap mid-fight with no jump; worn by rule (js/seep.js S.stateSheet).
STATES = {'mirrorstirge_emaciated_p1': 'the Withered state', 'mirrorstirge_overcharged_p1': 'the Charged state'}


def sheet(fmap, name, ref=None):
    d = {v: SP.view_rows(fmap, name, v, ROWS, LATCH[v], ref=ref) for v in ('S', 'SE', 'E', 'NE', 'N')}
    return {r: [d['S'][r], SP.mirror(d['SE'][r]), SP.mirror(d['E'][r]), SP.mirror(d['NE'][r]), d['N'][r], d['NE'][r], d['E'][r], d['SE'][r]] for r in ROWS}


if __name__ == '__main__':
    fmap = SP.frame_map()
    frames = sheet(fmap, NAME)
    SP.write(NAME, frames, ROWS, FPS, SOURCE, extra={'attack': {'release': 4}})
    if 'check' in sys.argv:
        SP.review(frames, ROWS, os.path.join(ROOT, 'deep16', 'art-src', 'mirrorstirge', NAME + '-review.png'))
    smap = SP.frame_map(SP.STATES)
    for nm, what in STATES.items():
        fs = sheet(smap, nm, ref=(fmap, NAME))
        SP.write(nm, fs, ROWS, FPS, 'drawn by the art desk (ART-143-WITHERED-AND-CHARGED-SUPPLEMENT, 11-14: art-wanted section 62 -- ' + what + ' of the Mirror Stirge, '
                 'a paint-over of ART-143 on its own grid), cut by tools/mirrorstirge-sheet.py through tools/stirgepages.py on the Normal\'s registration; SW W NW '
                 'mirrored -- worn by rule, js/seep.js THE MADE THINGS\' STATES', extra={'attack': {'release': 4}})
        if 'check' in sys.argv:
            SP.review(fs, ROWS, os.path.join(ROOT, 'deep16', 'art-src', 'mirrorstirge', nm + '-review.png'))

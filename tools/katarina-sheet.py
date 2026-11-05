"""DEEP16 pipeline 2 (generated art): Katarina's town figure at the Halfway Inn -> katarina_p1, in all eight facings.

    python tools/katarina-sheet.py            (writes deep16/art/katarina_p1.png/.json)
    python tools/katarina-sheet.py check      (also deep16/art-src/katarina/katarina_p1-review.png)

Asked in art-wanted section 35 (11-04, the Inn seat); cut 11-05 by cutter-1105 on the lanes desk's relay of Griz's "cutter has Katarina it doesn't know
about yet". The art desk's HALFWAY-INN-KATARINA-TOWN, sorted to deep16/_src/katarina/INN-TOWN-1105/: one page a view, H07 S, H08 SE, H09 E, H10 NE (its
corrected rear idle), H11 N; three rows a page -- Idle 4 (the book held to her chest), Walk 8 (the satchel), Sit 4 (writing on a bench, the bench drawn
with her and kept, its geometry still) -- each row's label printed under it. Its FRAME-MAP.md is a table of each row's y window and its frames'
approximate x boundaries (every page the same 1774 x 887 layout): WINDOWS below is that table, and `trim` drops a neighbour's edge reaching in at a
window's side.

The cut is tools/vivian-sheet.py's (loaded here): the navy by the window's edges, one scale a page by its idle to TALL (the inn's women, 47 -- folkwoman_p1,
elsbethhome_p1), each frame on its lowest row by its torso's middle, SW W NW mirrored, boxed down, snapped to the 64 (red and fire left out: her browns),
outlined. Its own notes, kept in `hold`: the walk's leads repeat (1 against 5, 3 against 7) and the knees lift high; the sit's pen moves are slight.
"""
import importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

PAGES = {'S': 'H07-S.png', 'SE': 'H08-SE.png', 'E': 'H09-E.png', 'NE': 'H10-NE.png', 'N': 'H11-N.png'}
ROWX = {'idle': ((0, 257), [340, 600, 885, 1170, 1440]), 'walk': ((300, 542), [30, 240, 455, 670, 885, 1100, 1315, 1530, 1750]),
        'sit': ((593, 840), [340, 600, 885, 1170, 1440])}
WINDOWS = [('INN-TOWN-1105', view, row, i, fn, (xs[i], y[0], xs[i + 1], y[1]))
           for view, fn in PAGES.items() for row, (y, xs) in ROWX.items() for i in range(len(xs) - 1)]

VS.LOOKS['katarina_p1'] = dict(
    src='katarina', windows=WINDOWS, trim=True, tall=47, avoid=['red', 'fire'], name='Katarina',
    rows=[('idle', 4, 4), ('walk', 10, 8), ('sit', 2, 4)],
    hold=['walk: the same lead repeats (1 against 5, 3 against 7) and the knees lift higher than close steps (the art desk\'s own note)',
          'sit: the bench drawn with her, its geometry still; where a scene draws its own bench, mask the overlap (the art desk\'s own note)'],
    source='drawn by the art desk (HALFWAY-INN-KATARINA-TOWN, 11-05: art-wanted section 35, her town figure in five views), cut by tools/katarina-sheet.py over '
           'tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    VS.cut('katarina_p1')

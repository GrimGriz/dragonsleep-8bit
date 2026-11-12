"""DEEP16 pipeline 2 (generated art): Pyronimus "Pyro" Silversands, King of Solskaft, walking -- his town figure -> pyro_p1, in all eight facings.

    python tools/pyro-town-sheet.py            (writes deep16/art/pyro_p1.png/.json)
    python tools/pyro-town-sheet.py check      (also deep16/art-src/ART-141-PYRO/pyro_p1-review.png: every row of every drawn view at 3x)

Asked in art-wanted section 54 (11-12, the lanes desk, his description: "Pyro is old school"); cut 11-12 by cutter-pyro on the lanes desk's relay of Griz's
"pyro first pieces (and a griffon) are in fresh". The art desk's ART-141-PYRO-TOWN, sorted out of Fresh to deep16/_src/ART-141-PYRO/TOWN/: HEAD 7 S, 8 SE, 9 E,
10 the rear NE, 11 N -- PAGE 1 Idle 4 (hands on the two mace heads, a small breath), PAGE 2 Walk 8 (heavy and unhurried, the mantle moving). Its FRAME-MAP.json
gives each frame a cell and a crop guide round the drawing: the cell is the window, the guide the drawing's own box (the printed numbers above it fall away).

The cut is tools/vivian-sheet.py's (loaded here, as Katarina's): the navy by the window's edges; the idle page by its idle's median to TALL -- a dwarf's 38 against a
grown human's 50 (the art desk's "approximately 38 px from crown to sole", Signy's `tall` in tools/keeper-town-sheet.py); the walk page matched to its view's
idle (its first frame as tall as Idle 1: the pages are drawn at their own sizes); each frame on its lowest row by its torso's middle; SW W NW the mirrors of
SE E NE (RULED 10-14); boxed down, snapped to the 64 (red and fire left out: his skin and the mantle's browns), outlined.
Worn at Solskaft's vault doors (deep16/js/solskaft.js SK.PEOPLE pyro); his fight sheet pyro_p0 and his fights are untouched.
"""
import importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

SRC = 'ART-141-PYRO'
BATCH = 'TOWN'
VIEW = {'S': 'S', 'SE': 'SE', 'E': 'E', 'rear NE': 'NE', 'N': 'N'}
ROW = {'Idle': 'idle', 'Walk': 'walk'}


def frame_windows():
    fm = json.load(open(os.path.join(VS.pix.SRC, SRC, BATCH, 'FRAME-MAP.json'), encoding='utf-8'))
    out = []
    for pg in fm['pages']:
        row = ROW[pg['name'].split()[-1]]
        nums = [f['frame'] for f in pg['frames']]
        assert nums == list(range(1, len(nums) + 1)), (pg['source'], nums)            # (every number once, none skipped)
        assert len(nums) == {'idle': 4, 'walk': 8}[row], (pg['source'], len(nums))
        for f in pg['frames']:
            out.append((BATCH, VIEW[pg['facing']], row, f['frame'] - 1, pg['source'], tuple(f['cell_xyxy']), tuple(f['preview_crop_xyxy'])))
    return out


VS.LOOKS['pyro_p1'] = dict(
    src=SRC, windows=frame_windows() if os.path.isdir(os.path.join(VS.pix.SRC, SRC, BATCH)) else [], tall=38, avoid=['red', 'fire'], name='Pyro',
    rows=[('idle', 4, 4), ('walk', 9, 8)], match={'walk': ('idle', 0)},
    hold=['walk: the passing poses are close and the arm swing restrained; SE frames 2-3 close; E 7-8 close; the rear NE cape hides the weight transfer (the art desk\'s own notes)',
          'the rear views: the gold clasp toward screen right (the art desk\'s own note)'],
    source='drawn by the art desk (ART-141-PYRO-TOWN, 11-12: art-wanted section 54, his town figure in five views), cut by tools/pyro-town-sheet.py over '
           'tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    VS.cut('pyro_p1')

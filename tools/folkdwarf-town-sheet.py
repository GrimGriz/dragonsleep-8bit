"""DEEP16 pipeline 2 (generated art): the generic dwarf of Solskaft, walking -- his town figure in his own clothes -> folkdwarf_p1, in all eight facings.

    python tools/folkdwarf-town-sheet.py            (writes deep16/art/folkdwarf_p1.png/.json)
    python tools/folkdwarf-town-sheet.py check      (also the review sheet: every row of every drawn view at 3x)

Asked in art-wanted section 54 (11-12, the lanes desk, his "include a 'generic dwarf' like we did for generic NPC, various costumes"); cut 11-12 by the
Ingrith cutter on the lanes desk's relay. The art desk's ART-141-DWARF-TOWN, sorted out of Fresh to deep16/_src/dwarf/TOWN/: HEAD 13 S, 14 SE, 15 E, 16 the
rear NE, 17 N -- PAGE 1 Idle 4 (thumbs in the belt, a small breath), PAGE 2 Walk 8 (steady and short-legged), the red quilted tunic of the portrait's idle.
Its FRAME-MAP.json spells a frame `number`, its window `window_xyxy` and its guide `crop_guide_xyxy` (a third spelling: Pyro's `name`/`preview_crop_xyxy`,
Ingrith's `action`/`diagnostic_crop_xyxy`). The window is drawn tight round the drawing as Ingrith's was (tools/ingrith-town-sheet.py): the largest piece,
grown by the pieces near it -- up and sideways by GAP, down only by DOWN -- so a printed number or a speck falls away.

The cut is tools/vivian-sheet.py's, as Pyro's and Ingrith's: the idle page by its idle's median to TALL -- a dwarf's 38 against a grown human's 50; the
walk page matched to its view's idle; SW W NW the mirrors of SE E NE (RULED 10-14); boxed down, snapped to the 64 (fire left out: the art desk's "avoid fire
oranges in ash or skin"; the reds kept for the tunic), outlined. Worn by Solskaft's unnamed who are not soldiers (deep16/js/solskaft.js SK.FOLK / SK.CFOLK).
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

SRC = 'dwarf'
BATCH = 'TOWN'
VIEW = {'S': 'S', 'SE': 'SE', 'E': 'E', 'NE': 'NE', 'N': 'N'}
ROW = {'Idle': 'idle', 'Walk': 'walk'}
PAD = 14
GAP, DOWN = 30, 6
_pages = {}


def page(fn):
    if fn not in _pages:
        _pages[fn] = np.asarray(Image.open(os.path.join(VS.pix.SRC, SRC, BATCH, fn)).convert('RGB')).astype(np.float32)
    return _pages[fn]


def tight(a, cell, m=6):
    """the window drawn tight round him: the largest piece and the pieces near it (a number below, a speck beside, fall away)"""
    x0, y0, x1, y1 = cell
    fl, n = ndimage.label(VS.figure(a[y0:y1, x0:x1]))
    objs = ndimage.find_objects(fl)
    big = objs[int(np.argmax(ndimage.sum(fl > 0, fl, range(1, n + 1))))]
    ya, yb, xa, xb = big[0].start, big[0].stop, big[1].start, big[1].stop
    grew = True
    while grew:
        grew = False
        for o in objs:
            if o[0].start < yb + DOWN and o[0].stop > ya - GAP and o[1].start < xb + GAP and o[1].stop > xa - GAP:
                na, nb, nc, nd = min(ya, o[0].start), max(yb, o[0].stop), min(xa, o[1].start), max(xb, o[1].stop)
                if (na, nb, nc, nd) != (ya, yb, xa, xb):
                    ya, yb, xa, xb, grew = na, nb, nc, nd, True
    return (max(x0, x0 + xa - m), max(y0, y0 + ya - m), min(x1, x0 + xb + m), min(y1, y0 + yb + m))


def frame_windows():
    fm = json.load(open(os.path.join(VS.pix.SRC, SRC, BATCH, 'FRAME-MAP.json'), encoding='utf-8'))
    out = []
    for pg in fm['pages']:
        row = ROW[pg['action']]
        W, H = pg['source_size']
        nums = [f['number'] for f in pg['frames']]
        assert nums == list(range(1, len(nums) + 1)), (pg['source'], nums)            # (every number once, none skipped)
        assert len(nums) == {'idle': 4, 'walk': 8}[row], (pg['source'], len(nums))
        for f in pg['frames']:
            x0, y0, x1, y1 = f['window_xyxy']
            cell = (max(0, x0 - PAD), max(0, y0 - PAD), min(W, x1 + PAD), min(H, y1 + PAD))
            out.append((BATCH, VIEW[pg['facing']], row, f['number'] - 1, pg['source'], tight(page(pg['source']), cell)))
    return out


VS.LOOKS['folkdwarf_p1'] = dict(
    src=SRC, windows=frame_windows() if os.path.isdir(os.path.join(VS.pix.SRC, SRC, BATCH)) else [], tall=38, avoid=['fire'], name='Dwarf',
    rows=[('idle', 4, 4), ('walk', 9, 8)], match={'walk': ('idle', 0)},
    hold=['walk: S returns abruptly to a longer stride in a few transitions; SE\'s chest more frontal than its travel; the rear NE lead change subtle (the art desk\'s own notes)'],
    source='drawn by the art desk (ART-141-DWARF-TOWN, 11-12: art-wanted section 54, the generic dwarf\'s town figure in five views), cut by tools/folkdwarf-town-sheet.py '
           'over tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    VS.cut('folkdwarf_p1')

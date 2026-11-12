"""DEEP16 pipeline 2 (generated art): Ingrith Scalebeam, cleric of Solskaft and captain of its ledger, walking -- her town figure -> ingrith_p1, in all eight facings.

    python tools/ingrith-town-sheet.py            (writes deep16/art/ingrith_p1.png/.json)
    python tools/ingrith-town-sheet.py check      (also the review sheet: every row of every drawn view at 3x)

Asked in art-wanted section 54 (11-12, the lanes desk: "Ingrith just as her role in the story shows on her, I'm less picky."); cut 11-12 by cutter-ingrith on the
lanes desk's relay of Griz's word that the art desk's Ingrith pages were in Fresh. The art desk's ART-141-INGRITH-TOWN, sorted out of Fresh to
deep16/_src/ingrith/TOWN/: HEAD 7 S, 8 SE, 9 E, 10 the rear NE, 11 N -- PAGE 1 Idle 4 (the ledger under her arm, a small breath), PAGE 2 Walk 8 (brisk and even).
Its FRAME-MAP.json gives each frame a cell and a diagnostic box round the drawing (this delivery spells them `action` and `diagnostic_crop_xyxy`, where Pyro's
said `name` and `preview_crop_xyxy`). Neither is trusted alone: the N walk's cells and boxes both reach into the tops of the printed numbers under the drawing,
and the S walk's first cell holds a speck. So the cell, widened by PAD, is read for its pieces (vivian-sheet's figure()), and the window is drawn tight round the
largest piece and every piece beside it -- a piece wholly below it or wholly above it, or off to its side, is a number or a speck and falls away.

The cut is tools/vivian-sheet.py's, as Pyro's (tools/pyro-town-sheet.py): the idle page by its idle's median to TALL -- a dwarf's 38 against a grown human's 50;
the walk page matched to its view's idle; SW W NW the mirrors of SE E NE (RULED 10-14); boxed down, snapped to the 64 (red and fire left out: tried with
the reds, 11-12, the N view's hair snapped bright red and every other view's brown -- left out, she is one brown head every facing), outlined. Her fight sheet ingrith_p0 and her fights are untouched.
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

SRC = 'ingrith'
BATCH = 'TOWN'
VIEW = {'S': 'S', 'SE': 'SE', 'E': 'E', 'REAR-NE': 'NE', 'N': 'N'}
ROW = {'IDLE': 'idle', 'WALK': 'walk'}
PAD = 14
GAP, DOWN = 30, 6                                     # (source pixels: the hair and the mace head may stand apart by more than a few; the printed numbers stand 20 and more below the boots, so the box grows down only by DOWN)
_pages = {}


def page(fn):
    if fn not in _pages:
        _pages[fn] = np.asarray(Image.open(os.path.join(VS.pix.SRC, SRC, BATCH, fn)).convert('RGB')).astype(np.float32)
    return _pages[fn]


def tight(a, cell, m=6):
    """the cell's window drawn tight round her: the largest piece and the pieces sharing its rows and columns (a number below, a speck beside, fall away)"""
    x0, y0, x1, y1 = cell
    fl, n = ndimage.label(VS.figure(a[y0:y1, x0:x1]))
    objs = ndimage.find_objects(fl)
    big = objs[int(np.argmax(ndimage.sum(fl > 0, fl, range(1, n + 1))))]
    ya, yb, xa, xb = big[0].start, big[0].stop, big[1].start, big[1].stop
    grew = True
    while grew:                                       # (grown from the largest piece by the pieces within GAP of the box so far: the hair, a boot, the mace head)
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
        W, H = pg['dimensions']
        nums = [f['frame'] for f in pg['frames']]
        assert nums == list(range(1, len(nums) + 1)), (pg['source'], nums)            # (every number once, none skipped)
        assert len(nums) == {'idle': 4, 'walk': 8}[row], (pg['source'], len(nums))
        for f in pg['frames']:
            x0, y0, x1, y1 = f['cell_xyxy']
            cell = (max(0, x0 - PAD), max(0, y0 - PAD), min(W, x1 + PAD), min(H, y1 + PAD))
            out.append((BATCH, VIEW[pg['facing']], row, f['frame'] - 1, pg['source'], tight(page(pg['source']), cell)))
    return out


VS.LOOKS['ingrith_p1'] = dict(
    src=SRC, windows=frame_windows() if os.path.isdir(os.path.join(VS.pix.SRC, SRC, BATCH)) else [], tall=38, avoid=['red', 'fire'], name='Ingrith',
    rows=[('idle', 4, 4), ('walk', 9, 8)], match={'walk': ('idle', 0)},
    hold=['walk: SE and E -- the overlapping boots make the lead-foot switch at 1 and 5 ambiguous (the art desk\'s own note)',
          'the camera is shallower than the grid\'s on some pages; the E profile shows the ledger as an edge (the art desk\'s own note)'],
    source='drawn by the art desk (ART-141-INGRITH-TOWN, 11-12: art-wanted section 54, her town figure in five views), cut by tools/ingrith-town-sheet.py over '
           'tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    VS.cut('ingrith_p1')

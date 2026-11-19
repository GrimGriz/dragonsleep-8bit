"""DEEP16 pipeline 2 (generated art): Asdis Scalebeam, the old kinswoman over Solskaft's west store, walking -- her town figure -> asdis_p1, in all eight facings.

    python tools/asdis-town-sheet.py            (writes deep16/art/asdis_p1.png/.json)
    python tools/asdis-town-sheet.py check      (also the review sheet: every row of every drawn view at 3x)

Asked in art-wanted section 83 (11-18, the lanes desk, on Griz's "outbox that art ask please"); cut 11-19 by cutter-asdis on the lanes desk's start, his
"Asdis in Fresh". The art desk's ART-WANTED-83-ASDIS-SCALEBEAM, sorted out of Fresh to deep16/_src/asdis/2026-11-18-ART-83/ (the zip beside it): HEAD 7 S, 8 SE,
9 E, 10 the rear NE, 11 N -- one Idle 4 page (hands folded in her apron, a small breath) and one Walk 8 page (two rows of four) a view, under originals/town/.
Its FRAME-MAP.json (a `town` list, this delivery's own shape) gives each frame the drawing's exact box on the original sheet (`source_xyxy`, right and bottom
exclusive); the box, widened by PAD, is read for its pieces and drawn tight round the largest and every piece beside it (tools/ingrith-town-sheet.py's way:
a printed number below falls away). The art desk's own reduction (its town-previews-1x/) is not used: the cut is ours, from the originals.

The cut is tools/vivian-sheet.py's, as Ingrith's: the idle page by its idle's median to TALL -- 38, a dwarf's, as Ingrith and the generic dwarf (the art desk
measured her at 40 against folkdwarf_p1 with its own outline); the walk page matched to its view's idle; SW W NW the mirrors of SE E NE (RULED 10-14); boxed
down, snapped to the 64 (red and fire left out, Ingrith's way: with the reds, the SE walk's hands and face snapped red), outlined. The brooch -- the sign of Rekknar the Reckoner pinning her shawl at her left
shoulder (Griz, 11-19: "file the sign, even if the art department rendered it poorly") -- is cut as drawn: on S, SE and E a few grey pixels, hidden from
behind; the mirrors carry it to the other shoulder, as every mirrored costume detail.
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

SRC = 'asdis'
BATCH = '2026-11-18-ART-83'
PAD = 14
GAP, DOWN = 30, 6                                     # (source pixels: the braids and a heel may stand apart; the printed numbers stand well below the feet)
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
    for pg in fm['town']:
        row = pg['action']
        W, H = pg['original_size']
        nums = [f['frame'] for f in pg['frames']]
        assert nums == list(range(1, len(nums) + 1)), (pg['original'], nums)          # (every number once, none skipped)
        assert len(nums) == {'idle': 4, 'walk': 8}[row], (pg['original'], len(nums))
        for f in pg['frames']:
            x0, y0, x1, y1 = f['source_xyxy']
            cell = (max(0, x0 - PAD), max(0, y0 - PAD), min(W, x1 + PAD), min(H, y1 + PAD))
            out.append(('', pg['facing'], row, f['frame'] - 1, pg['original'], tight(page(pg['original']), cell)))
    return out


VS.LOOKS['asdis_p1'] = dict(
    src=SRC + '/' + BATCH, windows=frame_windows() if os.path.isdir(os.path.join(VS.pix.SRC, SRC, BATCH)) else [], tall=38, avoid=['red', 'fire'], name='Asdis',
    rows=[('idle', 4, 4), ('walk', 8, 8)], match={'walk': ('idle', 0)},
    hold=['the brooch (the sign of Rekknar) is a few grey pixels at game size on S, SE and E; hidden from behind; the mirrors move it to the other shoulder'],
    source='drawn by the art desk (ART-WANTED-83-ASDIS-SCALEBEAM, 11-18: art-wanted section 83, her town figure in five views), cut by tools/asdis-town-sheet.py over '
           'tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    VS.cut('asdis_p1')

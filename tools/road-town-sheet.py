"""DEEP16 pipeline 2 (generated art): the road to Deepholm's speakers who do not fight, walking -- a town figure each, in all eight facings.

    python tools/road-town-sheet.py [look ...]        (writes deep16/art/<look>.png/.json; no look: every one whose sources are sorted)
    python tools/road-town-sheet.py <look> check      (also the review sheet: every row of every drawn view at 3x, under deep16/art-src/<src>/)

Asked in art-wanted section 91 (11-19, the seat road-art-1119, on Griz's word: a town figure each for Ketil, Ulf, Thyra, Geir, Ragna, Gudrun and Dagny);
cut 11-20 by the cutter seat cutter-1120 on the lanes desk's start, his "a cutter can start on non-combatants". Each delivery is the art desk's
ART-1xx-<NAME>-...-TOWN-CUTTER-HANDOFF, sorted out of Fresh to deep16/_src/<name>/<batch>/ (the zip beside it): HEAD 01 S, 02 SE, 03 E, 04 the rear NE,
05 N -- PAGE 01 Idle 4, PAGE 02 Walk 8 -- under originals/. Its FRAME-MAP.csv gives each drawing its measured box on the original
(`source_bbox_xyxy_exclusive`, right and bottom exclusive): the box, widened by PAD, is the window, and the box itself keeps the drawing's own pieces
(a printed frame number outside the art falls away -- tools/vivian-sheet.py figure(), katarina_p2's way). The art desk's own reduction (its previews/) is
not used: the cut is ours, from the originals.

The cut is tools/vivian-sheet.py's, as Asdis's and Ingrith's: each idle page by its idle's median to TALL -- 38, a dwarf's, the trooper's beside whom the
art desk measured them (its "~40 px" counts the outline); the walk page matched to its view's idle (its notes: "a common scale per sheet", "preserve the
walk's small vertical variation"); SW W NW the mirrors of SE E NE (RULED 10-14; the notes: "a reflected runtime cell also reflects gear"); boxed down,
snapped to the 64 (fire left out, the trooper's way; red kept where a figure wears it -- Ulf's shield), outlined.
"""
import csv, importlib.util, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

PAD = 14


def frame_windows(src, batch):
    """[(batch, view, row, frame index, file, window, box)] from the delivery's FRAME-MAP.csv"""
    d = os.path.join(VS.pix.SRC, src, batch)
    if not os.path.isdir(d):
        return []
    out, sizes = [], {}
    for r in csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
        fn = r['file']
        if fn not in sizes:
            sizes[fn] = Image.open(os.path.join(d, fn)).size
        W, H = sizes[fn]
        x0, y0, x1, y1 = (int(v) for v in r['source_bbox_xyxy_exclusive'].split())
        win = (max(0, x0 - PAD), max(0, y0 - PAD), min(W, x1 + PAD), min(H, y1 + PAD))
        out.append((batch, r['facing'], r['action'].lower(), int(r['frame']) - 1, fn, win, (x0, y0, x1, y1)))
    rows = {}
    for w in out:
        rows.setdefault((w[1], w[2]), []).append(w[3])
    for (view, row), ns in rows.items():                                    # (every number once, none skipped: Idle 4, Walk 8)
        assert sorted(ns) == list(range({'idle': 4, 'walk': 8}[row])), (src, view, row, sorted(ns))
    assert set(v for v, _ in rows) == set(VS.FACE), (src, sorted(rows))
    return out


def road(look, src, batch, name, art, hold, wear, avoid=('fire',)):
    VS.LOOKS[look] = dict(
        src=src, windows=frame_windows(src, batch), tall=38, avoid=list(avoid), name=name,
        rows=[('idle', 4, 4), ('walk', 8, 8)], match={'walk': ('idle', 0)}, hold=hold,
        source='drawn by the art desk (%s, 11-19: art-wanted section 91, his town figure in five views), cut by tools/road-town-sheet.py over '
               'tools/vivian-sheet.py; SW W NW mirrored; %s' % (art, wear))


# Ulf Silversands, First Lamp (the art desk's ART-150; its notes: the garrison battleaxe at his right hip, the round red shield on his back toward the left
# shoulder, thumbs in the belt at idle). Not worn yet: the road's First Lamp is not on the grid (content/maps/highway_1.json has no Ulf).
road('ulf_p1', 'ulf', '2026-11-19-ART-150', 'Ulf', 'ART-150-ULF-SILVERSANDS-TOWN-CUTTER-HANDOFF',
     ['the mirrors (SW W NW) carry the axe to his left hip and the shield to the other shoulder, as every mirrored costume detail (the art desk\'s own note)',
      'the rear NE walk turns nearer a back view than its idle (the art desk\'s own note)'],
     'worn by no one yet: First Lamp is not on the grid')


if __name__ == '__main__':
    import sys
    for lk in [a for a in sys.argv[1:] if a in VS.LOOKS] or [k for k in VS.LOOKS if VS.LOOKS[k].get('windows') and k.endswith('_p1') and VS.LOOKS[k].get('src') in ('ulf', 'thyra', 'geir', 'dagny')]:
        VS.cut(lk)

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
import csv, importlib.util, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

PAD = 14


GAP, DOWN = 30, 6          # (source pixels: a braid or a heel may stand apart from the body; a printed number stands well below the feet -- tools/asdis-town-sheet.py)


def tight(d, fn, win):
    """a crop window drawn tight round the figure: the largest piece and the pieces near it (a printed number below, a speck beside, fall away) -- the drawing's
    own box in page terms, for a delivery whose map gives cells, not boxes (Thyra's ART-151)"""
    x0, y0, x1, y1 = win
    a = np.asarray(Image.open(os.path.join(d, fn)).convert('RGB').crop(win)).astype(np.float32)
    fl, n = ndimage.label(VS.figure(a))
    objs = ndimage.find_objects(fl)
    big = objs[int(np.argmax(ndimage.sum(fl > 0, fl, range(1, n + 1))))]
    ya, yb, xa, xb = big[0].start, big[0].stop, big[1].start, big[1].stop
    grew = True
    while grew:
        grew = False
        for o in objs:
            if o[0].start < yb + DOWN and o[0].stop > ya - GAP and o[1].start < xb + GAP and o[1].stop > xa - GAP:
                nb = (min(ya, o[0].start), max(yb, o[0].stop), min(xa, o[1].start), max(xb, o[1].stop))
                if nb != (ya, yb, xa, xb):
                    (ya, yb, xa, xb), grew = nb, True
    return (x0 + xa, y0 + ya, x0 + xb, y0 + yb)


def map_rows(d):
    """(file, view, row, frame number, box, is-a-window) from the delivery's frame map: Ulf's FRAME-MAP.csv (`source_bbox_xyxy_exclusive`, the drawing's box),
    Geir's FRAME-MAP.json (`pages` -> `frames` `source_box`, the drawing's box) or Thyra's (`pages` -> `frames` `window_xyxy`, a crop cell)"""
    if os.path.exists(os.path.join(d, 'FRAME-MAP.csv')):
        for r in csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
            if 'source_bbox_xyxy_exclusive' in r:
                yield r['file'], r['facing'], r['action'].lower(), int(r['frame']), tuple(int(v) for v in r['source_bbox_xyxy_exclusive'].split()), False
            elif r['target'] == os.path.basename(os.path.dirname(d)) + '_p1':     # (Dagny's: the ART-147/155 map shared with Torvald, `target` names the sheet;
                x, y, w, h = (int(r[k]) for k in ('source_x', 'source_y', 'source_width', 'source_height'))   # the drawing's box as x, y, width, height)
                yield r['source'], r['facing'], r['action'].lower(), int(r['frame']), (x, y, x + w, y + h), False
        return
    fm = json.load(open(os.path.join(d, 'FRAME-MAP.json'), encoding='utf-8'))
    for pg in fm['pages']:
        for f in pg['frames']:
            box = f.get('source_box') or f.get('window_xyxy')
            yield pg['source'], pg['facing'], pg['action'].lower(), int(f.get('frame') or f.get('number')), tuple(int(v) for v in box), 'source_box' not in f


def frame_windows(src, batch):
    """[(batch, view, row, frame index, file, window, box)] from the delivery's frame map"""
    d = os.path.join(VS.pix.SRC, src, batch)
    if not os.path.isdir(d):
        return []
    out, sizes = [], {}
    for fn, view, row, num, box, cell in map_rows(d):
        if fn not in sizes:
            sizes[fn] = Image.open(os.path.join(d, fn)).size
        W, H = sizes[fn]
        x0, y0, x1, y1 = tight(d, fn, box) if cell else box
        win = (max(0, x0 - PAD), max(0, y0 - PAD), min(W, x1 + PAD), min(H, y1 + PAD))
        out.append((batch, view, row, num - 1, fn, win, (x0, y0, x1, y1)))
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

# Thyra Silversands, Second Lamp (the art desk's ART-151; its notes: the compact steel warhammer at her right hip, the braid over her left shoulder, the shield
# strapped to her back; North Idle's shield "reads browner than North Walk" in its own diagnostic). Not worn yet: Second Lamp (content/maps/highway_2.json
# `thyra`, the first game's road) is not on the grid. Its map gives crop cells, not boxes: tight() finds her in each.
road('thyra_p1', 'thyra', '2026-11-19-ART-151', 'Thyra', 'ART-151-THYRA-SILVERSANDS-TOWN-CUTTER-HANDOFF',
     ['the mirrors (SW W NW) carry the hammer to her left hip and the braid to the other shoulder (the art desk\'s own note)',
      'North Idle\'s shield may read browner than North Walk\'s (the art desk\'s own note)'],
     'worn by no one yet: Second Lamp is not on the grid')

# Geir Silversands, Third Lamp (the art desk's ART-152; its notes: steel cap, pale pointed beard, red quilted sleeves under mail, the round red shield on his
# back, the short iron hammer at his right hip; he listens with a slight head tilt). Not worn yet: Third Lamp is not on the grid.
road('geir_p1', 'geir', '2026-11-19-ART-152', 'Geir', 'ART-152-GEIR-SILVERSANDS-TOWN-CUTTER-HANDOFF',
     ['the mirrors (SW W NW) carry the hammer to his left hip (the art desk\'s own note)',
      'E and rear NE are fresh redraws whose diagonal strides reach further than the trooper\'s (the art desk\'s own note)'],
     'worn by no one yet: Third Lamp is not on the grid')

# Dagny Scalebeam (the art desk's ART-155, delivered in one zip with Torvald's ART-147, which waits in Fresh for the combat art: her pages only copied out;
# its notes: the closed ledger in her left arm, Rekknar's brooch on her left shoulder; no weapon, in her clan's likeness, without furniture). Her pages hold
# Idle above Walk on one image a view (S its own two), so one scale a page. Not worn yet: the threshold (content/maps/threshold.json `dagny`) is not on the grid.
road('dagny_p1', 'dagny', '2026-11-19-ART-155', 'Dagny', 'ART-147-ART-155-TORVALD-DAGNY-TOWN-CUTTER-HANDOFF (her ART-155 pages)',
     ['the mirrors (SW W NW) carry the ledger to her right arm and the brooch to the other shoulder (the art desk\'s own note)',
      'Rekknar\'s brooch is a pixel or two at game size, as Asdis\'s'],
     'worn by no one yet: the threshold is not on the grid')


if __name__ == '__main__':
    import sys
    for lk in [a for a in sys.argv[1:] if a in VS.LOOKS] or [k for k in VS.LOOKS if VS.LOOKS[k].get('windows') and k.endswith('_p1') and VS.LOOKS[k].get('src') in ('ulf', 'thyra', 'geir', 'dagny')]:
        VS.cut(lk)

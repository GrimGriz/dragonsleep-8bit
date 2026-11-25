"""DEEP16 pipeline 2 (generated art): the Dominion's prison wagon, a prop over dominionroad's two-by-two covered wagon -> deep16/art/dmwagon_p1.png/.json,
an atlas of named pieces in js/innprops.js's shape (`prop`, `tiles` 'x,y,w,h,ax,ay' a box, `foot` its footprint) that js/topview.js TV.piece reads.

    python -I tools/dmwagon-sheet.py           (`check` also writes dev/visions/dmwagon-check.png: each piece at 3x on its 2x2 diamond)

Asked in art-wanted section 107 (11-25, the seat nets-1125, on his "7 add a dominion wagon art request"): the Dominion wagon as a prison cell with roof
storage, two facings, the door shut and open. Drawn by the art desk as ART-169 (its PRISON-WAGON-CUTTER-HANDOFF, landed in Fresh 11-25, sorted to
deep16/_src/dmwagon/2026-11-25-ART-169-PRISON-WAGON/, the zip beside it); packed 11-25 by the cutter seat cutter-1125b, on his "wagon is in Fresh".
Its CUTTER-NOTES: six 160 x 110 cells, already at 1x, hard alpha, in the 64 colours (checked here: every pixel on deep16/palette.json); one anchor for all
six, the 2x2 footprint's centre on the ground at (78, 90) in the cell; HEAD 1 the tail to screen lower right (its front, bench and tongue, upper left),
HEAD 2 the tail to lower left (front upper right) -- each shut and locked, and swung open; HEADs 3 and 4 the drive-off views, front lower right and lower
left, shut. The scene starts shut; the recruits' encounter swaps to open at the same origin; a turn on the road changes the cell, not the anchor.

THE PIECES are named by the way the wagon's front faces on screen: dmwagon_nw (HEAD 1), dmwagon_nw_open, dmwagon_ne (HEAD 2), dmwagon_ne_open, dmwagon_se
(HEAD 3), dmwagon_sw (HEAD 4) -- a row each, stacked as goblincamp_p1's are, so js/circles.js sheetAt (the road camp's tents and heaps) draws one with
the sheet's (ax, ay) = the art desk's (78, 90), the footprint's centre, at iso.center(x0 + 0.5, y0 + 0.5) for a wagon on squares x0..x0+1, y0..y0+1.
`tiles` keeps each piece as a box for js/topview.js TV.piece with js/innprops.js's anchor, the BACK corner of its footprint (the top of the 2x2 diamond,
2 x 16 px above its centre on the 64 x 32 grid: js/iso.js TW, TH) -- (78, 58).

HEADs 1 AND 2 ARE THE REAR BENCH REVISION: the art desk's ART-169-REAR-BENCH-REV-REVIEW (the front bench a visible edge above the tongue, at HEADs 3 and
4's height, on the same registered wagon and anchor), taken on Griz's "there's a second wagon zip with revised rear views" (its own REVIEW.md called it
"for review before promotion to the cutter handoff"): its four cells moved into the batch's cells/, the handoff's first four to its superseded/cells/.
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import pixelate as pix                                            # (only its SRC: the shared checkout's deep16/_src from a worktree)

BATCH = os.path.join(pix.SRC, 'dmwagon', '2026-11-25-ART-169-PRISON-WAGON', 'cells')
CELLS = [('dmwagon_nw', 'ART-169-HEAD-1-SHUT-LOCKED.png'), ('dmwagon_nw_open', 'ART-169-HEAD-1-SWUNG-OPEN.png'),
         ('dmwagon_ne', 'ART-169-HEAD-2-SHUT-LOCKED.png'), ('dmwagon_ne_open', 'ART-169-HEAD-2-SWUNG-OPEN.png'),
         ('dmwagon_se', 'ART-169-HEAD-3-SHUT-LOCKED.png'), ('dmwagon_sw', 'ART-169-HEAD-4-SHUT-LOCKED.png')]
CW, CH = 160, 110
CENTRE = (78, 90)
AX, AY = CENTRE[0], CENTRE[1] - 32                                # (the back corner: a 2x2 diamond is 64 tall, its centre 32 below its top)


def main(check=False):
    pal = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json')))['ramps']
    ok = set(tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for r in pal.values() for h in r)
    sheet = np.zeros((CH * len(CELLS), CW, 4), np.uint8); tiles, anims = {}, {}   # (a row a piece, as goblincamp_p1: js/circles.js sheetAt)
    for k, (name, fn) in enumerate(CELLS):
        a = np.asarray(Image.open(os.path.join(BATCH, fn)).convert('RGBA'))
        assert a.shape[:2] == (CH, CW), (fn, a.shape)
        on = a[..., 3] > 0
        assert set(np.unique(a[..., 3]).tolist()) <= {0, 255}, fn + ': not hard alpha'
        off = set(map(tuple, a[on][:, :3].tolist())) - ok
        assert not off, '%s: %d colours off the 64' % (fn, len(off))
        sheet[k * CH:(k + 1) * CH] = a
        tiles[name] = '0,%d,%d,%d,%d,%d' % (k * CH, CW, CH, AX, AY)
        anims[name] = {'row': k, 'frames': 1, 'fps': 1}
    art = os.path.join(ROOT, 'deep16', 'art')
    Image.fromarray(sheet, 'RGBA').save(os.path.join(art, 'dmwagon_p1.png'), optimize=True)
    meta = {'_note': 'the Dominion\'s prison wagon over dominionroad\'s 2x2 covered wagon (tools/dmwagon-sheet.py, art-wanted 107, ART-169, 2026-11-25): '
                     'a row a piece, as goblincamp_p1 (js/circles.js sheetAt draws a row with the sheet\'s ax,ay -- the 2x2 footprint\'s CENTRE -- at '
                     'iso.center(x0 + 0.5, y0 + 0.5)); `tiles` the same pieces as boxes x,y,w,h with js/innprops.js\'s anchor, the footprint\'s back '
                     'corner; named by the way its front faces; the scene starts shut, the recruits\' encounter swaps to _open at the same anchor, a '
                     'turn on the road swaps the heading',
            'image': 'art/dmwagon_p1.png', 'fw': CW, 'fh': CH, 'ax': CENTRE[0], 'ay': CENTRE[1], 'cols': 1, 'prop': True, 'anims': anims,
            'foot': {n: [2, 2] for n, _ in CELLS}, 'centre': list(CENTRE), 'tiles': tiles,
            'source': 'drawn by the art desk (ART-169, 11-25: art-wanted section 107, the Dominion prison wagon with roof storage, two facings shut and '
                      'open and two drive-off views), packed by tools/dmwagon-sheet.py'}
    json.dump(meta, open(os.path.join(art, 'dmwagon_p1.json'), 'w'), indent=1)
    print('  dmwagon_p1: %dx%d, %s' % (sheet.shape[1], sheet.shape[0], ', '.join(n for n, _ in CELLS)))
    if check:
        sheet = np.concatenate([sheet[k * CH:(k + 1) * CH] for k in range(len(CELLS))], 1)   # (the check lays them side by side)
        cv = np.zeros((CH + 40, CW * len(CELLS), 3), np.uint8); cv[...] = (14, 22, 52)
        for k in range(len(CELLS)):
            cx, cy = k * CW + CENTRE[0], CENTRE[1]
            for t in range(-64, 65):                             # (the 2x2 diamond: 128 wide, 64 tall, about the centre)
                dy = 32 - abs(t) // 2
                for y in (cy - dy, cy + dy):
                    if 0 <= y < cv.shape[0]:
                        cv[y, cx + t] = (90, 70, 50)
        al = sheet[..., 3:4] / 255.0
        cv[:CH] = (sheet[..., :3] * al + cv[:CH] * (1 - al)).astype(np.uint8)
        d = os.path.join(ROOT, 'dev', 'visions'); os.makedirs(d, exist_ok=True)
        Image.fromarray(cv).resize((cv.shape[1] * 3, cv.shape[0] * 3), Image.NEAREST).save(os.path.join(d, 'dmwagon-check.png'))


if __name__ == '__main__':
    main('check' in sys.argv)

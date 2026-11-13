"""DEEP16 pipeline 2 (generated art): the cutter for the art desk's stirge pages of 11-13 -- ART-48's S and N repair (into stirge_p1, through
tools/bugs-sheet.py) and ART-143, the Mirror Stirge (tools/mirrorstirge-sheet.py -> mirrorstirge_p1). The cutter of the wolves, on the lanes desk's
relay: "A fourth delivery is in Fresh ... the stirge's repair ... and ART-143, the Mirror Stirge".

The delivery (art-wanted section 61), sorted out of Fresh to deep16/_src/stirge/2026-11-13-ART-48-REPAIR-AND-ART-143-MIRROR-STIRGE/ (the zip beside
it): one action and one facing a page, the row's name at its left, the drawings in two bands (1-4 over 5-8, or 1-3 over 4-6) with its number under
each, on a slate that is not one flat colour. LABEL-DRIVEN, and the labels found by the cutter (38 pages: no boxes written by hand):
  * the slate is the page's own median at an eighth of its size, a wide median over that (a drawing is under a quarter of the window); a pixel is
    figure when it is FAR from the slate there, and a hole in a figure that is only a little off the slate stays in it (a smoked-glass pane: the
    art desk's "do not key out similarly colored smoked-glass body interiors"), where a hole of the slate itself is open air between the wings;
  * a piece that is mostly white (three fifths: the letters' soft edges are not) is lettering; the lettering falls into lines by height, and the two lowest lines are the numbers;
  * a band's pieces go to the number nearest under them, so a frame is everything drawn over its number -- the shards of the Mirror Stirge's
    death, the chips of its flinch;
  * a frame is placed BY ITS NUMBER, not by its own box: the page drew each drawing against its number, and the wings' beat moves a centroid a
    dozen pixels where the body has not moved. A page's hover is the median, over its drawings, of where the body's core (the figure with its thin
    wings eroded away) sits against its number; that point goes to HOVER in the cell and every drawing keeps its own offset from there (the
    drain's lunge, a recoil). The death is hung from its first drawing and let down to the FLOOR by the code stirge's own fall (bugs-sheet DROP48),
    the page's own descent kept on top of it. The latch is hung by its first drawing's centroid on the point where stirge_p1's latch of that view
    rides (the shoulder), the rest by their numbers.
  * ONE SCALE: K 6.0 page px a game px for every 1774 x 887 page, both sets (they are drawn at one scale: S Idle 1 is 101 x 183 page px in the
    repair and 106 x 193 in ART-143). The art desk's own contact used 3.75 (360 px a cell) and called it an approximate body match; at 3.75 the
    body is 20 x 24 px where the stirge's kept SE and NE bodies are 12 x 14, and the repaired S and N must turn into those. At 6.0 the body is
    theirs and the spread wings are 62 px to the old front's 67. The two 1536 x 1024 pages (N Flinch, both sets)
    are at the same scale too: their drawings are the S Flinch's size, measured.
  * down by a premultiplied box straight off the page, snapped to the 64 colours and outlined by tools/pixelate.py (no lift).
Facings (RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors.
"""
import csv, json, os
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)

FOLDER = os.path.join(pix.SRC, 'stirge', '2026-11-13-ART-48-REPAIR-AND-ART-143-MIRROR-STIRGE')
FW, FH, AX, AY = 96, 112, 48, 84            # (stirge_p1's cell since ART-48)
HOVER = (48.0, 46.0)                        # (where the body hovers in the cell: stirge_p1's idles sit at 43 to 48)
FLOOR = 85                                  # (bugs-sheet's: a corpse lies on it)
DROP = [min(30, (i / 7) * 36) / 30 for i in range(8)]     # (bugs-sheet DROP48: the code's own fall)
K = 6.0                                     # (see ONE SCALE in the head)
FAR, NEAR, CORE = 22, 8, 9                  # (page px: far from the slate; a pane's faint tint; the erosion that leaves the body's core)
ROW = {'Idle': 'idle', 'Fly': 'walk', 'Blooddrain': 'attack', 'Magicdrain': 'attack', 'Flinch': 'flinch', 'Death': 'hurt', 'Latched': 'latched'}


def frame_map():
    """-> {(sheet, facing, row): (page path, frames)} from the delivery's FRAME-MAP.csv"""
    out = {}
    with open(os.path.join(FOLDER, 'FRAME-MAP.csv'), encoding='utf-8') as f:
        for r in csv.DictReader(f):
            assert r['engine_row'] == ROW[r['action']], r
            out[(r['sheet'], r['facing'], r['engine_row'])] = (os.path.join(FOLDER, *r['file'].split('/')), int(r['frames']))
    return out


_CUT = {}
def cut(path, n):
    """-> [dict(mask (page-size bool), num (x, y: its number's middle and the number line), core (x, y) or None, cen (x, y))] in number order"""
    if path in _CUT:
        return _CUT[path]
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    H, W = a.shape[:2]
    small = np.asarray(Image.fromarray(a.astype(np.uint8)).resize((W // 8, H // 8), Image.BOX)).astype(np.int16)
    bg = np.stack([ndimage.median_filter(small[..., c], size=41) for c in range(3)], -1).astype(np.uint8)
    bg = np.asarray(Image.fromarray(bg).resize((W, H), Image.BILINEAR)).astype(np.int16)
    diff = np.abs(a - bg).max(-1)
    far, near = diff > FAR, diff > NEAR
    lab, nc = ndimage.label(far, structure=np.ones((3, 3)))
    sl = ndimage.find_objects(lab)
    white = (a.min(-1) >= 195) & ((a.max(-1) - a.min(-1)) <= 28)
    idx = range(1, nc + 1)
    area = ndimage.sum(far, lab, idx); wh = ndimage.sum(white, lab, idx)
    cy = np.array([0.5 * (s[0].start + s[0].stop) for s in sl]); cx = np.array([0.5 * (s[1].start + s[1].stop) for s in sl])
    hh = np.array([s[0].stop - s[0].start for s in sl])
    text = (wh >= 0.6 * area) & (area >= 20) & (area <= 3000) & (hh >= 12) & (hh <= 70)
    tix = np.where(text)[0]
    order = tix[np.argsort(cy[tix])]
    lines, cur = [], [order[0]]
    for i in order[1:]:
        if cy[i] - cy[cur[-1]] > 30: lines.append(cur); cur = [i]
        else: cur.append(i)
    lines.append(cur)
    nums = [sorted(l, key=lambda i: cx[i]) for l in lines[-2:]]
    if len(lines) < 3 or [len(l) for l in nums] != [n // 2, n // 2]:
        raise SystemExit('%s: the lettering fell into lines of %s (want a title and two lines of %d numbers)' % (os.path.basename(path), [len(l) for l in lines], n // 2))
    tops = [min(sl[i][0].start for i in l) for l in nums]; bots = [max(sl[i][0].stop for i in l) for l in nums]
    bands = [(0, tops[0] - 2), (bots[0] + 2, tops[1] - 2)]
    out = []
    for b, (y0, y1) in enumerate(bands):
        xs = np.array([cx[i] for i in nums[b]]); yline = 0.5 * (tops[b] + bots[b])
        mine = [i for i in range(nc) if not text[i] and area[i] >= 6 and y0 <= cy[i] < y1]
        to = {i: int(np.argmin(np.abs(xs - cx[i]))) for i in mine}            # (each piece to the number nearest under it)
        for k, ni in enumerate(nums[b]):
            m = np.isin(lab, [i + 1 for i in mine if to[i] == k])
            if not m.any():
                raise SystemExit('%s: nothing drawn over number %d' % (os.path.basename(path), b * (n // 2) + k + 1))
            holes = ndimage.binary_fill_holes(m) & ~m                      # a pane keeps its faint tint; open air between the wings stays open
            hl, hn = ndimage.label(holes)
            if hn:
                ha = ndimage.sum(holes, hl, range(1, hn + 1)); hw = ndimage.sum(near & holes, hl, range(1, hn + 1))
                m |= np.isin(hl, 1 + np.where((hw >= 0.6 * ha) | (ha < 40))[0])
            ys, xx = np.where(m)
            er = ndimage.binary_erosion(m, iterations=CORE)
            core = None
            if er.any():
                el, en = ndimage.label(er)
                big = el == 1 + int(np.argmax(ndimage.sum(er, el, range(1, en + 1))))
                cyy, cxx = np.where(big); core = (float(cxx.mean()), float(cyy.mean()), int(big.sum()))
            out.append(dict(mask=m, num=(float(xs[k]), float(yline)), core=core, cen=(float(xx.mean()), float(ys.mean())), page=a))
    _CUT[path] = out
    return out


def cell(fr, k, ref, at):
    """one drawing -> an RGBA cell: the page point `ref` at the cell point `at`"""
    m, a = fr['mask'], fr['page']
    ys, xs = np.where(m)
    pad = int(max(FW, FH) * k) + 8
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.zeros((y1 - y0 + 2 * pad, x1 - x0 + 2 * pad, 4), np.uint8)
    rgba[pad:pad + y1 - y0, pad:pad + x1 - x0, :3] = a[y0:y1, x0:x1].astype(np.uint8)
    rgba[pad:pad + y1 - y0, pad:pad + x1 - x0, 3] = m[y0:y1, x0:x1] * 255
    bx, by = pad + ref[0] - x0 - at[0] * k, pad + ref[1] - y0 - at[1] * k
    small = Image.fromarray(rgba, 'RGBA').convert('RGBa').resize((FW, FH), Image.BOX, box=(bx, by, bx + FW * k, by + FH * k)).convert('RGBA')
    return pix.pixelate(small, 1, do_lift=False)


def down(fr, d):
    out = np.zeros_like(fr)
    if d <= 0: return fr
    out[d:] = fr[:-d]
    return out


def med(v): return float(np.median(v))


def view_rows(fmap, sheet, facing, rows, latch_at, k_idle=None):
    """-> ({row: [cells]}, the view's idle K) for one drawn view. `latch_at`: where the latch's first drawing's centroid goes."""
    out = {}
    idle = cut(*fmap[(sheet, facing, 'idle')]) if (sheet, facing, 'idle') in fmap else None
    for row in rows:
        path, n = fmap[(sheet, facing, row)]
        frs = cut(path, n)
        k = K
        if row == 'latched':
            off = (frs[0]['cen'][0] - frs[0]['num'][0], frs[0]['cen'][1] - frs[0]['num'][1]); at = latch_at
        elif row == 'hurt':
            off = (frs[0]['core'][0] - frs[0]['num'][0], frs[0]['core'][1] - frs[0]['num'][1]); at = HOVER
        else:
            cs = [f for f in frs if f['core']]
            off = (med([f['core'][0] - f['num'][0] for f in cs]), med([f['core'][1] - f['num'][1] for f in cs])); at = HOVER
        cells = [cell(f, k, (f['num'][0] + off[0], f['num'][1] + off[1]), at) for f in frs]
        if row == 'hurt':
            low = np.where(cells[-1][..., 3].any(axis=1))[0][-1]
            cells = [down(c, int(round(max(0, FLOOR - low) * d))) for c, d in zip(cells, DROP)]
        edge = sum(int((c[0, :, 3] > 0).sum() + (c[-1, :, 3] > 0).sum() + (c[:, 0, 3] > 0).sum() + (c[:, -1, 3] > 0).sum()) for c in cells)
        print('  %s %s %-7s K %.2f, off the number %+.0f,%+.0f page px%s' % (sheet, facing, row, k, off[0], off[1], ', ON THE CELL BORDER %d px' % edge if edge else ''))
        out[row] = cells
    return out


def mirror(seq):
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def review(frames, rows, out, scale=3, bg=(40, 44, 66), order=(0, 7, 6, 5, 4)):
    """every row of the drawn views at `scale` (S SE E NE N down, the rows across)"""
    wide = sum(len(frames[r][0]) for r in rows)
    sheet = Image.new('RGB', (FW * wide, FH * len(order)), bg)
    x = 0
    for r in rows:
        for vi, f in enumerate(order):
            for i, fr in enumerate(frames[r][f]):
                im = Image.fromarray(np.asarray(fr), 'RGBA')
                sheet.paste(im, (x + i * FW, vi * FH), im)
        x += len(frames[r][0]) * FW
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.resize((sheet.width * scale, sheet.height * scale), Image.NEAREST).save(out)
    print('  review: ' + out)


def repair():
    """ART-48's S and N repair -> {'S': {row: [PIL RGBA FW x FH]}, 'N': ...}: idle, walk, attack, flinch (tools/bugs-sheet.py with_fb lays them over the
    code's front and back; the Latched and the fall of both views are kept, the art desk's own decision)"""
    if not os.path.isdir(FOLDER):
        return {}
    fmap = frame_map()
    out = {}
    for v in ('S', 'N'):
        rows = view_rows(fmap, 'stirge_p1', v, ('idle', 'walk', 'attack', 'flinch'), None)
        out[v] = {r: [Image.fromarray(c, 'RGBA') for c in cs] for r, cs in rows.items()}
    return out


def write(name, frames, order, fps, source, extra=None):
    """frames: {row: [8 facings of cells]} -> deep16/art/<name>.png + .json, the rows stacked in `order` (the shape tools/codeart.py lay writes)"""
    wide = max(len(frames[r][0]) for r in order)
    sheet = np.zeros((FH * 8 * len(order), FW * wide, 4), np.uint8)
    meta, y = {}, 0
    for r in order:
        meta[r] = {'y': y, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'frames': len(frames[r][0]), 'fps': fps[r]}
        meta[r].update((extra or {}).get(r, {}))
        for f in range(8):
            for i, fr in enumerate(frames[r][f]):
                sheet[y + f * FH:y + (f + 1) * FH, i * FW:(i + 1) * FW] = fr
        y += FH * 8
    top = pix.top_of(frames['idle'][0] + frames['idle'][6], AY)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(pix.ART, name + '.png'), optimize=True)
    json.dump({'image': 'art/%s.png' % name, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'top': top, 'source': source, 'anims': meta},
              open(os.path.join(pix.ART, name + '.json'), 'w'), indent=1)
    print('  %s: %dx%d, top %d, %s' % (name, sheet.shape[1], sheet.shape[0], top, ', '.join('%s %d' % (r, len(frames[r][0])) for r in order)))

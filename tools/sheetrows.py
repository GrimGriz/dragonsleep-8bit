"""Cut a generated sheet into its frames by the sheet's own row and number labels (pipeline 2; Goose's three sheets first, 10-07).

    import: spec = importlib.util.spec_from_file_location('sheetrows', 'tools/sheetrows.py') ...; rows = sheetrows.cut_sheet(path, spec)

A sheet's spec (written by hand off the sheet, once): its text boxes (a blob wholly inside one is lettering and is dropped), the portrait's
box, and its rows -- (row, band x0 y0 x1 y1, label strip y0 y1, the labels' names in order). Optional: FIX (a loose bit moved by hand),
CUT (a line of pixels cleared where one frame's feeler touches the next frame's tail), TOUCH_OK (a touch looked at and left).

How a frame is cut: a pixel is figure when it is grey, not navy (blue minus red under 20; the navy's is 31-42) or far from the navy (a
glow) -- a spec may set its own `grey` and `far` (Rascal's second round: a bluer navy, 47-66, and black bands on his tail that read 10-30). The labels' x centres are found in each strip (bright columns, clustered). Each row's band is split among its labels: the bodies'
cores (the mask eroded, a core of 200 px or more) go to the nearest label, the rest of each blob to the core that reaches it first along
the blob (so a feeler stays with its own body), and loose bits (a stone let fly, sparkles, a honk's lines) to the nearest frame.
"""
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


def figure_mask(a, grey=20, far=150):
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    m = ((a[..., 2] - a[..., 0]) < grey) | (np.abs(a - navy).sum(-1) > far)
    holes = ndimage.binary_fill_holes(m) & ~m                      # pinholes only: a hole of real navy (between arm and head) stays
    lab, n = ndimage.label(holes)
    if n:
        sz = ndimage.sum(holes, lab, range(1, n + 1))
        m |= np.isin(lab, 1 + np.where(sz < 12)[0])
    return m


def drop_text(m, boxes):
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    for i, sl in enumerate(ndimage.find_objects(lab)):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        piece = lab[sl] == i + 1
        w, h = x1 - x0, y1 - y0
        if ((w > 250 or h > 140) and piece.sum() < 0.06 * w * h) or (h <= 6 and w >= 40) or (w <= 6 and h >= 40):   # a box's frame, a rule
            m[sl][piece] = False
            continue
        for bx0, by0, bx1, by1 in boxes:
            if x0 >= bx0 and y0 >= by0 and x1 <= bx1 and y1 <= by1:       # (its dark drop shadow too, so no brightness test)
                m[sl][piece] = False
                break


def label_xs(a, x0, x1, y0, y1):
    """the labels' x centres in a strip: bright columns, clustered (a gap of 12 px parts two labels)"""
    strip = a[y0:y1, x0:x1].mean(-1) > 140
    cols = np.where(strip.any(axis=0))[0]
    if not len(cols):
        return []
    groups, cur = [], [cols[0]]
    for c in cols[1:]:
        if c - cur[-1] > 12:
            groups.append(cur); cur = [c]
        else:
            cur.append(c)
    groups.append(cur)
    groups = [g for g in groups if strip[:, g[0]:g[-1] + 1].any(axis=1).sum() >= 8]   # a label stands 8 rows or more (a sparkle doesn't)
    return [x0 + (g[0] + g[-1]) / 2 for g in groups]


def split_band(m, xs):
    """assign every figure pixel in the band to one of the labels at xs: cores to the nearest label, blobs by growth, loose bits nearest"""
    xs = np.array(xs)
    core = ndimage.binary_erosion(m, iterations=4)
    clab, cn = ndimage.label(core)
    seeds = np.zeros(m.shape, np.int32)
    for i, sl in enumerate(ndimage.find_objects(clab)):
        piece = clab[sl] == i + 1
        if piece.sum() < 200:                                        # a body seeds; a sling's stone or a tail's thick end is grown into
            continue
        cx = sl[1].start + np.where(piece)[1].mean()
        seeds[sl][piece] = 1 + int(np.argmin(np.abs(xs - cx)))
    grow = seeds.copy()
    while True:                                                      # grow each core through the blob, a pixel a step
        d = ndimage.grey_dilation(grow, size=(3, 3))
        new = m & (grow == 0) & (d > 0)
        if not new.any():
            break
        grow[new] = d[new]
    loose = m & (grow == 0)
    if loose.any() and (grow > 0).any():
        _, (iy, ix) = ndimage.distance_transform_edt(grow == 0, return_indices=True)
        grow[loose] = grow[iy[loose], ix[loose]]
    return grow


def rgba_crop(a, keep, pad=2):
    ys, xs = np.where(keep)
    y0, y1, x0, x1 = max(0, ys.min() - pad), ys.max() + 1 + pad, max(0, xs.min() - pad), xs.max() + 1 + pad
    rgb = a[y0:y1, x0:x1].astype(np.uint8)
    al = (keep[y0:y1, x0:x1] * 255).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, al]), 'RGBA'), (int(x0), int(y0), int(x1), int(y1))


def cut_sheet(path, spec, fix=None, cuts=None, touch_ok=(), only=None, overlay=None, tag=''):
    """-> {'portrait': [('', image, box)], row: [(name, image, box), ...]}; box is (x0, y0, x1, y1) on the sheet, 2 px of pad round the
    figure. `only`: the rows wanted (all by default). `overlay`: a list to append the check image to (each frame tinted its own colour)."""
    fix, cuts = fix or {}, cuts or {}
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
    m = figure_mask(a, spec.get('grey', 20), spec.get('far', 150))   # (a sheet's own thresholds: Rascal's navy is bluer, 10-07)
    drop_text(m, spec['text'])
    out = {}
    if 'portrait' in spec and (only is None or 'portrait' in only):
        px0, py0, px1, py1 = spec['portrait']
        pm = np.zeros_like(m); pm[py0:py1, px0:px1] = m[py0:py1, px0:px1]
        plab, pn = ndimage.label(pm, structure=np.ones((3, 3)))
        sz = ndimage.sum(pm, plab, range(1, pn + 1))
        pm = np.isin(plab, 1 + np.where(sz >= 40)[0])
        im, box = rgba_crop(a, pm)
        out['portrait'] = [('', im, box)]
    over = (a * 0.25).astype(np.uint8) if overlay is not None else None
    for row, (x0, y0, x1, y1), (ly0, ly1), names in spec['rows']:
        if only is not None and row not in only:
            continue
        xs = label_xs(a, x0, x1, ly0, ly1)
        if len(xs) != len(names):
            raise SystemExit('%s %s: %d labels found at %s, %d wanted' % (tag, row, len(xs), [int(x) for x in xs], len(names)))
        band = np.zeros_like(m); band[y0:y1, x0:x1] = m[y0:y1, x0:x1]
        blab, bn = ndimage.label(band, structure=np.ones((3, 3)))   # specks under 6 px are noise
        sz = ndimage.sum(band, blab, range(1, bn + 1))
        band = np.isin(blab, 1 + np.where(sz >= 6)[0])
        if row in cuts:
            wall = Image.new('1', (band.shape[1], band.shape[0]), 0)
            for line in cuts[row]:
                ImageDraw.Draw(wall).line(line, fill=1, width=2)
            band &= ~np.asarray(wall, dtype=bool)
        g = split_band(band, xs)
        if row in fix:
            blab, _ = ndimage.label(band, structure=np.ones((3, 3)))
            objs = ndimage.find_objects(blab)
            for (fx0, fy0, fx1, fy1), to in fix[row]:
                for i, sl in enumerate(objs):
                    if sl[1].start >= fx0 and sl[0].start >= fy0 and sl[1].stop <= fx1 and sl[0].stop <= fy1:
                        g[blab == i + 1] = 1 + names.index(to)
        for dy, dx in ((0, 1), (1, 0), (1, 1), (1, -1)):               # the check: two frames still touching (a feeler cut short)
            p = g[:g.shape[0] - dy, max(0, -dx):g.shape[1] - max(0, dx)]
            q = g[dy:, max(0, dx):g.shape[1] - max(0, -dx)]
            ys_, xs_ = np.where((p > 0) & (q > 0) & (p != q))
            if len(ys_) and row not in touch_ok:
                print('  touching: %s %s at x %d y %d (frames %s and %s)' % (tag, row, xs_[0] + max(0, -dx), ys_[0], names[p[ys_[0], xs_[0]] - 1],
                                                                          names[q[ys_[0], xs_[0]] - 1]))
                break
        frames = []
        for k, nm in enumerate(names):
            keep = g == k + 1
            if not keep.any():
                raise SystemExit('%s %s %s: nothing cut' % (tag, row, nm))
            im, box = rgba_crop(a, keep)
            frames.append((nm, im, box))
            if over is not None:
                over[keep] = (a[keep] * 0.35 + np.array(HUES[k % len(HUES)]) * 0.65).astype(np.uint8)
        out[row] = frames
    if over is not None:
        overlay.append(Image.fromarray(over))
    return out


HUES = [(255, 90, 90), (90, 220, 90), (90, 140, 255), (240, 210, 60), (230, 90, 230), (60, 220, 220), (255, 150, 40), (180, 180, 255)]

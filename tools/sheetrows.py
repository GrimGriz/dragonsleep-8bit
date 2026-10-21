"""Cut a generated sheet into its frames by the sheet's own row and number labels (pipeline 2; Goose's three sheets first, 10-07).

    import: spec = importlib.util.spec_from_file_location('sheetrows', 'tools/sheetrows.py') ...; rows = sheetrows.cut_sheet(path, spec)

A sheet's spec (written by hand off the sheet, once): its text boxes (a blob wholly inside one is lettering and is dropped), the portrait's
box, and its rows -- (row, band x0 y0 x1 y1, label strip y0 y1, the labels' names in order). Optional: FIX (a loose bit moved by hand),
CUT (a line of pixels cleared where one frame's feeler touches the next frame's tail), TOUCH_OK (a touch looked at and left).

How a frame is cut: a pixel is figure when it is grey, not navy (blue minus red under 20; the navy's is 31-42) or far from the navy (a
glow) -- a spec may set its own `grey` and `far` (Rascal's second round: a bluer navy, 47-66, and black bands on his tail that read 10-30), or `chan`, a test of each channel alone (Beholda's purple outline, Denny's grey navy, 10-07); `join` gives two numbers under one drawing one frame (Denny's Cannonball 6 and 7). The labels' x centres are found in each strip (bright columns, clustered). Each row's band is split among its labels: the bodies'
cores (the mask eroded, a core of 200 px or more) go to the nearest label, the rest of each blob to the core that reaches it first along
the blob (so a feeler stays with its own body), and loose bits (a stone let fly, sparkles, a honk's lines) to the nearest frame.

How big a figure stands: read STANDS below, don't measure the heroes again (10-18, Griz: "add to cutter tool helper orientation ... the
measurements, not to measure again"). A new sheet cut to stand beside them is measured the same way and gets its own line there.
"""
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

# STANDS: how tall the house's figures stand on the grid, measured once (10-18, the ART-72 seat, on main at be78aaa). Each sheet's idle frame 1 in
# every facing, S SW W NW N NE E SE: (how far its top rises above the foot -- the sheet's `ay`, the engine's anchor; how tall it is, outline to
# outline, the 1-px outline ring included; how wide). The LPC sheets (_p0) stand with the feet 2 px below `ay` (tall = above + 2); the generated
# and rendered sheets put the outline's last row on `ay` (tall = above + 1). The four heroes are 49 to 54 tall; Aurdin's LPC hair makes him the
# tallest bare head. A paladin at the old measure "stands 49" (tools/snoothorse-sheet.py's 1.5-a-man) is npcpaladin_p0's S here.
STANDS = {
    'aurdin_p0':         {'S': (52, 54, 30), 'SW': (52, 54, 30), 'W': (50, 53, 28), 'NW': (48, 50, 30), 'N': (48, 50, 30), 'NE': (48, 50, 30), 'E': (50, 53, 28), 'SE': (52, 54, 30)},
    'barley_p0':         {'S': (49, 51, 33), 'SW': (49, 51, 33), 'W': (49, 51, 35), 'NW': (47, 49, 32), 'N': (47, 49, 32), 'NE': (47, 49, 32), 'E': (49, 51, 35), 'SE': (49, 51, 33)},
    'vivian_p0':         {'S': (48, 50, 30), 'SW': (48, 50, 30), 'W': (49, 51, 33), 'NW': (47, 49, 30), 'N': (47, 49, 30), 'NE': (47, 49, 30), 'E': (49, 51, 33), 'SE': (48, 50, 30)},
    'lymen_p0':          {'S': (52, 54, 39), 'SW': (52, 54, 39), 'W': (51, 53, 45), 'NW': (48, 50, 41), 'N': (48, 50, 41), 'NE': (48, 50, 41), 'E': (52, 54, 45), 'SE': (52, 54, 39)},
    'npcwizard_p0':      {'S': (56, 58, 30), 'SW': (56, 58, 30), 'W': (56, 59, 31), 'NW': (56, 58, 30), 'N': (56, 58, 30), 'NE': (56, 58, 30), 'E': (56, 59, 31), 'SE': (56, 58, 30)},
    'npcpaladin_p0':     {'S': (48, 50, 39), 'SW': (49, 51, 48), 'W': (51, 53, 45), 'NW': (51, 53, 45), 'N': (47, 49, 40), 'NE': (51, 53, 45), 'E': (52, 54, 45), 'SE': (49, 51, 48)},
    'gnollmatriarch_p1': {'S': (80, 81, 69), 'SW': (71, 72, 60), 'W': (78, 79, 61), 'NW': (72, 73, 71), 'N': (84, 85, 64), 'NE': (72, 73, 71), 'E': (78, 79, 61), 'SE': (71, 72, 60)},
    'newlandrider_p1':   {'S': (69, 70, 46), 'SW': (65, 66, 73), 'W': (69, 70, 103), 'NW': (66, 67, 67), 'N': (73, 74, 39), 'NE': (66, 67, 67), 'E': (69, 70, 103), 'SE': (65, 66, 73)},
    # the rat swarm (10-20, the ART-74 seat, tools/ratswarm-sheet.py): a carpet with no feet -- its `ay` is its square's middle and its front edge 11 to
    # 16 px below it (the stills' mean width 64 with the ring, the square's floor diamond), so tall is not above + 1 here; each rat about 12 px long
    'ratswarm_p1':       {'S': (27, 40, 61), 'SW': (23, 35, 65), 'W': (24, 38, 61), 'NW': (26, 42, 60), 'N': (26, 43, 55), 'NE': (26, 42, 60), 'E': (24, 38, 61), 'SE': (23, 35, 65)},
    # Silverton's keepers on the town floor (10-21, the Winters seat, tools/keeper-town-sheet.py): drawn facing south only, cut to the heroes' height
    'winters_p1': {'S': (49, 50, 21)}, 'casper_p1': {'S': (49, 50, 23)}, 'androit_p1': {'S': (49, 50, 26)}, 'hessle_p1': {'S': (49, 50, 22)}, 'aldric_p1': {'S': (49, 50, 28)},
    'kessler_p1': {'S': (50, 51, 27)}, 'calla_p1': {'S': (49, 50, 21)}, 'barber_p1': {'S': (49, 50, 26)}, 'marin_p1': {'S': (49, 50, 20)},
}


def figure_mask(a, grey=20, far=150, chan=None):
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    if chan:                                                        # a sheet may test each channel instead (spec `chan`): any one this far from
        m = np.abs(a - navy).max(-1) > chan                         # its navy -- Beholda's dark purple outline is neither grey nor far by the sum,
    else:                                                           # and Denny's navy is grey itself (blue minus red 18), 10-07
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
    m = figure_mask(a, spec.get('grey', 20), spec.get('far', 150), spec.get('chan'))   # (a sheet's own thresholds: Rascal's navy is bluer, 10-07)
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
        for grp in spec.get('join', {}).get(row, ()):                  # two numbers under one drawing (Denny's Cannonball 6 and 7, the dust
            at = [names.index(nm) for nm in grp]                        # round one landing): one frame at their mean x, named '6+7'
            mid = float(np.mean([xs[i] for i in at]))
            xs = [mid if i == at[0] else x for i, x in enumerate(xs) if i not in at[1:]]
            names = ['+'.join(grp) if i == at[0] else n for i, n in enumerate(names) if i not in at[1:]]
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

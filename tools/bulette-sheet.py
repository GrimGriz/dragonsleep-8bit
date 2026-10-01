"""DEEP16 pipeline 2 (generated art): Griz's two generated bulette sheets -> the bulette's palette sprite sheet.

    python tools/bulette-sheet.py            builds deep16/art/bulette_p2.png/.json
    python tools/bulette-sheet.py preview    writes dev/shots/bulette-cuts.png (every anim's frames for facings S, E and N, 2x on grey) and stops

Sources (Griz, 2026-09-29, generated; a new route, and the second sheet came the same day). Every side view faces right.
  deep16/_src/bulette_grok_1.jpg  on a baked grey and white checkerboard (not a flat colour), the labels dark plaques down the left edge
      (the plaques say 8 frames for the idle and the walk; six are drawn). Five rows of six:
        Idle       standing, the head and jaws moving a little
        Walk       the same figure walking
        Burrow     sinking into a mound of dirt (shelved till 10-01d, when the burrow was wired: Griz, "go ahead and wire in the bulette")
        Emerge     bursting up out of a mound, rearing, and landing running: the flying dirt clods are part of the figure
        Leap Bite  crouch, leap, jaws first and down, a ground shadow under the airborne frames, a splash of dirt at the landing
  deep16/_src/bulette_grok_2.jpg  on a flat dark navy ground (row labels at the far left and a number under every frame, both dropped),
      the same creature a touch lighter with a paler belly: a turnaround (Front, Right, Back, Left), then Hurt (6), Death (numbered
      1 2 3 4 6 8, six drawn: it falls onto its back), Walk Toward (6, seen from the front) and Walk Away (6, seen from the back).
What each row became (facings S, SW, W, NW, N, NE, E, SE; the side facings take the side frames, as drawn for S and the east side, mirrored
for the west side and for N, the cloaker's way):
  idle    the six side facings: sheet 1's Idle row. S: the Front still, N: the Back still, each with a one-pixel breathe (the gnoll pattern)
  walk    the six side facings: sheet 1's Walk row. S: Walk Toward, N: Walk Away
  attack  sheet 1's Leap Bite row (Deadly Leap), six frames, every facing (S and N use the side frames: the leap has no front or back view);
          the ground shadow under the airborne frames is kept (see below)
  reveal  sheet 1's Emerge row, every facing: coming up out of the ground (ai.js burrower, 10-01d)
  burrow  sheet 1's Burrow row, every facing: going under, played once; its last frame, the mound, is the bulette while it is under
          (js/ui.js; 10-01d)
  flinch  sheet 2's Hurt row, every facing: a blow that lands and does not drop it, played once (the engine's `hurt` is the death)
  hurt    sheet 2's Death row, every facing: the engine plays `hurt` once when a creature goes down (the convention every generated sheet follows)
The key, sheet 1: the checker is the neutral pixels (its two greys and white, and the lighter half of a ground shadow) joined to the sheet's
edge, with a little slack for the jpeg; patches of the checker enclosed by the figure (between the legs, in a cloud of dust) are the neutral
pixels that are light; the plaques are dropped by their place. The body's own greys (the jaw, the belly, a scale's light) are darker than the
checker and are kept. The shadow under the airborne leap frames is too soft and mottled to key, so its extent is measured off the source and
drawn as a hard, dithered ellipse (the palette has no half-alpha); the standing rows' faint shadows and the dust are dropped. Sheet 2: the
commonest colour is the ground (the gnoll's way); the labels and numbers drop by size.
Scale: each group is taken to HEIGHT px to the top of its spines (a Large creature: the chuul's is 63) by its own standing figure, so every
view stands the same height: sheet 1's rows by the Idle row's figure, the Hurt and Death rows by the Hurt row's first (standing) frame, the
Front and Back stills and the Walk Toward and Walk Away rows by their own figures (drawn at different sizes on the sheet). Each frame is placed
on its torso, its feet on the foot (AY) in every standing frame; the leap and the emerge rows take the row's own baseline (the median of
the row's lowest rows) so a leap's airborne frames stay airborne above their shadow.
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)

SRC = os.path.join(ROOT, 'deep16', '_src')
NAME = 'bulette_p2'
FW, FH, AX, AY = 180, 120, 90, 108
HEIGHT = 64                 # a standing figure, in px, to the top of its spines (the chuul_p2, also Large: 63; its 111 px long: the bulette is stockier, ~100)
PAD = 3                     # a transparent margin round every cut, so the outline is drawn on all four sides
LABEL_X = 158               # sheet 1: the plaques end here (the first frame's dirt starts at 161)
NEUTRAL, LOW = 12, 100      # sheet 1's checker: (max - min) of the channels within NEUTRAL and the brightest channel above LOW (its shadows)
SHADOW = tuple(int(c) for c in pix.OUTLINE)

# the sheets' rows: (x0, y0, x1, y1) and how many figures each holds. Each band stops above the row below it (and above the numbers)
BANDS1 = {'idle': ((158, 12, 1168, 142), 6), 'walk': ((158, 158, 1168, 296), 6), 'burrow': ((158, 312, 1168, 440), 6),
          'emerge': ((158, 446, 1168, 588), 6), 'leap': ((158, 586, 1168, 756), 6)}
BANDS2 = {'turn': ((0, 0, 1168, 163), 4), 'hurt': ((0, 190, 1168, 322), 6), 'death': ((0, 345, 1168, 460), 6),
          'toward': ((0, 470, 1168, 610), 6), 'away': ((0, 620, 1168, 750), 6)}
# sheet 1's leap row: the frames with a ground shadow under them (the airborne ones; the first is standing, the last has landed in a splash of dirt)
SHADOW_FRAMES = {'leap': (1, 2, 3, 4)}


def load(name):
    return np.asarray(Image.open(os.path.join(SRC, name)).convert('RGB')).astype(np.int32)


def key_checker(A):
    """sheet 1's figures' mask: the checker (and its shadows) joined to the edge out, and the islands of it inside the figures."""
    mx, mn = A.max(-1), A.min(-1)
    cand = ((mx - mn) <= NEUTRAL) & (mx >= LOW)
    cand[:, :LABEL_X] = True                                   # the plaques
    lab, k = ndimage.label(cand)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    ids = np.arange(1, k + 1)
    area = ndimage.sum(np.ones_like(mx), lab, ids)
    mean = ndimage.mean(mx, lab, ids)
    isl = {int(i) for i, a, m in zip(ids, area, mean) if a >= 6 and m >= 185}      # a patch of the checker between the legs, in the dust
    bg = np.isin(lab, list(edge | isl))
    bg[:, :LABEL_X] = True
    hole = np.isin(lab, list(isl))
    hole = ndimage.binary_dilation(hole, iterations=1) & (mx >= 140)        # ... and the light fringe of the jpeg round them
    fg = ~bg
    fg = ndimage.binary_opening(fg, iterations=1)
    fg = ndimage.binary_closing(fg, iterations=2)
    return fg, hole


def key_flat(A):
    """sheet 2's figures' mask: everything unlike the ground (the commonest colour), as the gnoll's."""
    v, c = np.unique(A.reshape(-1, 3) // 4, axis=0, return_counts=True)
    bg = v[np.argmax(c)] * 4 + 2
    return ndimage.binary_closing(np.abs(A - bg).sum(-1) > 45, iterations=2), np.zeros(A.shape[:2], dtype=bool)


def shadow_of(A, fg, box):
    """the ground shadow under a figure's box (x0, y0, x1, y1): its box (x0, y0, x1, y1) in sheet coordinates, or None."""
    x0, y0, x1, y1 = box
    ya, yb, xa, xb = y1 + 3, min(fg.shape[0], y1 + 60), max(0, x0 - 12), min(fg.shape[1], x1 + 12)
    c = A[ya:yb, xa:xb]
    mx, mn = c.max(-1), c.min(-1)
    reg = (mx < 190) & (mx >= 40) & ((mx - mn) <= 16) & ~fg[ya:yb, xa:xb]      # (the checker's darker squares are 200 and up)
    reg = ndimage.binary_opening(reg, iterations=1)
    reg = ndimage.binary_closing(reg, iterations=2)
    lab, k = ndimage.label(reg)
    if not k:
        return None
    sizes = ndimage.sum(reg, lab, np.arange(1, k + 1))
    if sizes.max() < 150:
        return None
    ys, xs = np.where(lab == 1 + int(np.argmax(sizes)))
    return (xa + xs.min(), ya + ys.min(), xa + xs.max() + 1, ya + ys.max() + 1)


def frames_in(A, fg, hole, band, n, shadow_idx=(), attach=True):
    """the n figures in a row's band, left to right: dicts of `img` (the cut RGBA, with its PAD margin, figure only), `shadow` (a boolean
    mask the size of img, or None), `oy` (the sheet's y of the image's top row), `bottom` (the sheet's y of its lowest row, the shadow's
    included) and `h` (the figure's height, its spines to its feet). `attach`: small pieces inside a figure's box (clods of dirt) are part of it."""
    x0, y0, x1, y1 = band
    m = fg[y0:y1, x0:x1]
    lab, k = ndimage.label(m)
    big, bits = [], []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        area = int((lab[sl] == i + 1).sum())
        d = {'id': i + 1, 'x0': sl[1].start, 'x1': sl[1].stop, 'y0': sl[0].start, 'y1': sl[0].stop}
        if area >= 1500:
            big.append(d)
        elif area >= 12:
            bits.append(d)
    big.sort(key=lambda d: d['x0'])
    if len(big) == n:
        groups = [{'ids': [d['id']], 'x0': d['x0'], 'x1': d['x1'], 'y0': d['y0'], 'y1': d['y1']} for d in big]
    else:
        groups = []
        for d in big:                                         # pieces that share columns are one figure
            if groups and d['x0'] <= groups[-1]['x1'] + 4:
                g = groups[-1]
                g['ids'].append(d['id']); g['x1'] = max(g['x1'], d['x1']); g['y0'] = min(g['y0'], d['y0']); g['y1'] = max(g['y1'], d['y1'])
            else:
                groups.append({'ids': [d['id']], 'x0': d['x0'], 'x1': d['x1'], 'y0': d['y0'], 'y1': d['y1']})
    assert len(groups) == n, (band, len(groups))
    if attach:                                                # a clod of dirt off a figure goes with the nearest figure (within reach of it)
        dist = [ndimage.distance_transform_edt(~np.isin(lab, g['ids'])) for g in groups]
        for s in bits:
            lm = lab[s['y0']:s['y1'], s['x0']:s['x1']] == s['id']
            near = [float(dd[s['y0']:s['y1'], s['x0']:s['x1']][lm].min()) for dd in dist]
            j = int(np.argmin(near))
            if near[j] <= 22:
                groups[j]['ids'].append(s['id'])
    out = []
    for gi, g in enumerate(groups):
        ids = list(g['ids'])
        mm = ndimage.binary_fill_holes(np.isin(lab, ids)) & ~hole[y0:y1, x0:x1]     # (a patch of the checker inside the figure is not filled in)
        if attach:
            mm = ndimage.binary_erosion(mm, iterations=1)     # the halo of the checker
            rgb = A[y0:y1, x0:x1]                             # ... the pale fringe of the dust on the rim of a clod or the dirt
            pale = (rgb.max(-1) >= 185) & ((rgb.max(-1) - rgb.min(-1)) <= 40)
            mm = mm & ~(pale & ~ndimage.binary_erosion(mm, iterations=2))
            l2, k2 = ndimage.label(mm)                        # ... and what is left of a speck
            mm = np.isin(l2, [i + 1 for i in range(k2) if (l2 == i + 1).sum() >= 20])
        ys, xs = np.where(mm)
        fx0, fx1, fy0, fy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        sh = shadow_of(A, fg, (x0 + fx0, y0 + fy0, x0 + fx1, y0 + fy1)) if gi in shadow_idx else None
        bx0, bx1, by0, by1 = x0 + fx0, x0 + fx1, y0 + fy0, y0 + fy1
        if sh:
            bx0, bx1, by1 = min(bx0, sh[0]), max(bx1, sh[2]), max(by1, sh[3])
        H, W = by1 - by0, bx1 - bx0
        al = np.zeros((H, W), dtype=bool)
        al[y0 + fy0 - by0:y0 + fy1 - by0, x0 + fx0 - bx0:x0 + fx1 - bx0] = mm[fy0:fy1, fx0:fx1]
        img = np.pad(np.dstack([A[by0:by1, bx0:bx1].astype(np.uint8), (al * 255).astype(np.uint8)]), ((PAD, PAD), (PAD, PAD), (0, 0)))
        smask = None
        if sh:
            sx0, sy0, sx1, sy1 = sh
            yy, xx = np.mgrid[sy0:sy1, sx0:sx1]
            cxs, cys, rx, ry = (sx0 + sx1 - 1) / 2, (sy0 + sy1 - 1) / 2, (sx1 - sx0) / 2, (sy1 - sy0) / 2
            smask = np.zeros((H, W), dtype=bool)
            smask[sy0 - by0:sy1 - by0, sx0 - bx0:sx1 - bx0] = ((xx - cxs) / rx) ** 2 + ((yy - cys) / ry) ** 2 <= 1
            smask = np.pad(smask, PAD)
        out.append({'img': Image.fromarray(img, 'RGBA'), 'shadow': smask, 'oy': by0 - PAD, 'bottom': by1 - 1, 'h': int(fy1 - fy0), 'w': int(fx1 - fx0)})
    return out


def fit(cut, scale):
    """one cut to 1x: boxed down by `scale`, palette-snapped and outlined; the shadow boxed down with it. Returns the figure array, the
    shadow mask (or None) and the scale on the y axis."""
    img = cut['img']
    w, h = img.size
    nw, nh = max(1, round(w / scale)), max(1, round(h / scale))
    a = pix.pixelate(img.resize((nw, nh), Image.BOX), 1, do_lift=False)
    s = None
    if cut['shadow'] is not None:
        s = np.asarray(Image.fromarray(cut['shadow'].astype(np.uint8) * 255).resize((nw, nh), Image.BOX)) >= 128
    return a, s, nh / h


def torso_x(a):
    """the middle of the body: the median opaque column over the torso's rows (a tail, a raised head and a spray of dirt are thin)."""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 25 // 100: top + (bot - top) * 65 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def place(a, s, x_ref, base_row):
    """a frame array on the sheet's frame: the column x_ref on AX, the row base_row on AY; the shadow (dithered, hard-edged) under the figure."""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = int(round(AX - x_ref)), AY - int(base_row)
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    if y1 <= y0 or x1 <= x0:
        return out
    blk = out[y0:y1, x0:x1]
    if s is not None:
        yy, xx = np.mgrid[y0:y1, x0:x1]
        sm = s[y0 - oy:y1 - oy, x0 - ox:x1 - ox] & (((xx + yy) & 1) == 0)
        blk[sm, :3] = SHADOW; blk[sm, 3] = 255
    fig = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    solid = fig[..., 3] > 0
    blk[solid] = fig[solid]
    return out


def side(ims, scale, row_base=False):
    """a row of cuts to frames: the torso on AX (read off the figure alone: a shadow, wider than the body, would drag the median) and,
    by default, each frame's own lowest row on AY (the standing rows stand on the ground in every frame; the generator's cells drift down
    a few px across a row). `row_base`: the row's baseline is the median of its lowest rows (the shadow's included), so a leap's airborne
    frames stay airborne above their shadow."""
    base = float(np.median([c['bottom'] for c in ims])) if row_base else None
    out = []
    for cut in ims:
        a, s, fy = fit(cut, scale)
        out.append(place(a, s, torso_x(a), round(((base if row_base else cut['bottom']) - cut['oy']) * fy)))
    return out


def breathe(fr):
    """the chest rises a pixel (the legs stay put)."""
    o = fr.copy()
    rows = np.where(fr[..., 3].any(axis=1))[0]
    mid = rows[0] + (rows[-1] - rows[0]) * 6 // 10
    o[rows[0] - 1:mid] = fr[rows[0]:mid + 1]
    return o


def build_frames():
    A1, A2 = load('bulette_grok_1.jpg'), load('bulette_grok_2.jpg')
    (fg1, h1), (fg2, h2) = key_checker(A1), key_flat(A2)
    r1 = {k: frames_in(A1, fg1, h1, b, n, SHADOW_FRAMES.get(k, ())) for k, (b, n) in BANDS1.items()}
    r2 = {k: frames_in(A2, fg2, h2, b, n, attach=False) for k, (b, n) in BANDS2.items()}
    r2['front'], r2['back'] = [r2['turn'][0]], [r2['turn'][2]]      # the turnaround's stills (its Right and Left are not used: the rows give the sides)
    sc = lambda ims: float(np.mean([c['h'] for c in ims])) / HEIGHT     # a group's source px per px, by its own standing figure
    s1 = sc(r1['idle'])                                         # sheet 1's rows share the Idle row's
    s2 = r2['hurt'][0]['h'] / HEIGHT                            # the Hurt and Death rows: the Hurt row's first frame, standing
    idle_r, walk_r = side(r1['idle'], s1), side(r1['walk'], s1)
    atk_r, rev_r, bur_r = side(r1['leap'], s1, True), side(r1['emerge'], s1, True), side(r1['burrow'], s1, True)
    flinch_r, death_r = side(r2['hurt'], s2), side(r2['death'], s2)
    fS, fN = side(r2['front'], sc(r2['front']))[0], side(r2['back'], sc(r2['back']))[0]
    walkS, walkN = side(r2['toward'], sc(r2['toward'])), side(r2['away'], sc(r2['away']))
    # the mirror is exact on the anchor: the frame is even wide, so a flip lands AX on AX - 1, and the roll puts it back
    mirror = lambda seq: [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]
    idle_l, walk_l, atk_l, rev_l, bur_l, flinch_l, death_l = (mirror(s) for s in (idle_r, walk_r, atk_r, rev_r, bur_r, flinch_r, death_r))
    frames = {'idle': [], 'walk': [], 'attack': [], 'hurt': [], 'flinch': [], 'reveal': [], 'burrow': []}
    for f in range(8):                                        # facings S, SW, W, NW, N, NE, E, SE: S and the east side as drawn, the rest mirrored
        r = f in (0, 5, 6, 7)
        frames['idle'].append([fS] * 3 + [breathe(fS)] * 3 if f == 0 else [fN] * 3 + [breathe(fN)] * 3 if f == 4 else idle_r if r else idle_l)
        frames['walk'].append(walkS if f == 0 else walkN if f == 4 else walk_r if r else walk_l)
        frames['attack'].append(atk_r if r else atk_l); frames['reveal'].append(rev_r if r else rev_l); frames['burrow'].append(bur_r if r else bur_l)
        frames['flinch'].append(flinch_r if r else flinch_l); frames['hurt'].append(death_r if r else death_l)
    return frames, {'sheet 1': s1, 'sheet 2 side': s2, 'front': sc(r2['front']), 'back': sc(r2['back']), 'toward': sc(r2['toward']), 'away': sc(r2['away'])}, (r1, r2)


def preview(frames):
    """every anim's frames for facings S, E and N, side by side at 2x on mid-grey; the foot's row (AY) and column (AX) ticked."""
    from PIL import ImageDraw
    every = [fr for anim in frames for f in (0, 4, 6) for fr in frames[anim][f]]
    al = np.max([fr[..., 3] for fr in every], axis=0) > 0
    ys, xs = np.where(al)
    cx0, cx1, cy0, cy1 = max(0, xs.min() - 3), min(FW, xs.max() + 4), max(0, ys.min() - 3), FH
    cw, ch = (cx1 - cx0) * 2, (cy1 - cy0) * 2
    gut = 78
    nmax = max(len(frames[a][0]) for a in frames)
    im = Image.new('RGBA', (gut + nmax * cw, len(frames) * 3 * ch), (110, 110, 110, 255))
    d = ImageDraw.Draw(im)
    r = 0
    for anim in frames:
        for f, nm in ((0, 'S'), (6, 'E'), (4, 'N')):
            y = r * ch
            d.text((4, y + 4), '%s %s' % (anim, nm), fill=(255, 255, 0, 255))
            d.text((4, y + 16), '%d fr' % len(frames[anim][f]), fill=(220, 220, 220, 255))
            for i, fr in enumerate(frames[anim][f]):
                x = gut + i * cw
                cell = Image.fromarray(fr[cy0:cy1, cx0:cx1], 'RGBA').resize((cw, ch), Image.NEAREST)
                im.alpha_composite(cell, (x, y))
                d.line((x, y + (AY - cy0) * 2 + 1, x + cw - 1, y + (AY - cy0) * 2 + 1), fill=(200, 60, 60, 255))
                d.line((x + (AX - cx0) * 2, y + ch - 8, x + (AX - cx0) * 2, y + ch - 1), fill=(60, 200, 60, 255))
                d.rectangle((x, y, x + cw - 1, y + ch - 1), outline=(80, 80, 80, 255))
            r += 1
    os.makedirs(os.path.join(ROOT, 'dev', 'shots'), exist_ok=True)
    im.save(os.path.join(ROOT, 'dev', 'shots', 'bulette-cuts.png'))


def report(scales, frames):
    print('  scales (source px per px): ' + ', '.join('%s %.3f' % kv for kv in scales.items()))
    every = [fr for anim in frames for f in range(8) for fr in frames[anim][f]]
    al = np.max([fr[..., 3] for fr in every], axis=0) > 0
    ys, xs = np.where(al)
    print('  ink over every frame: x %d-%d of %d, y %d-%d of %d (foot %d,%d)' % (xs.min(), xs.max(), FW, ys.min(), ys.max(), FH, AX, AY))


def build():
    frames, scales, _ = build_frames()
    top = pix.top_of(frames['idle'][0] + frames['idle'][6] + frames['walk'][0] + frames['walk'][6], AY)
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, top)
    mp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(mp))
    for a, fps in (('idle', 5), ('walk', 8), ('attack', 10), ('hurt', 8), ('flinch', 12), ('reveal', 8), ('burrow', 8)):
        meta['anims'][a]['fps'] = fps
    meta['source'] = 'generated by Griz (2026-09-29, two sheets), keyed off the checkerboard and the flat ground and snapped by tools/bulette-sheet.py'
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  top %d' % top)
    report(scales, frames)


if __name__ == '__main__':
    if 'preview' in sys.argv:
        fr, sc, _ = build_frames()
        preview(fr)
        print('preview written')
        report(sc, fr)
        sys.exit(0)
    build()

"""The mannequin pilot's first pages cut (10-31): free Grok's baseline, Barley in mail skinned over the mannequin's one-handed slash, cut into a
sheet of its own -- `barley_grokslash_p1` -- with a longsword drawn into his right fist. Nothing the game plays is touched: not barley_p3, not
tools/pixelate.py's ANIM_ORDER (this writes its own sheet).

    python tools/barley-grokslash-sheet.py            the sheet (deep16/art/barley_grokslash_p1.png/.json) and the score
                                                      (deep16/art-src/mannequin/grok-score.md, grok-review.png)

Griz, 10-31: "what we got back from grok is in fresh - should we have a cutter try put a longsword in its hand and cut it (without overwriting
anything we actually use?)". The pages: deep16/_src/barley/GROK-SLASH-2026-10-31/grokpose1-5.jpg (SE NE S E N, as their titles say), sorted
out of Fresh. Six frames a page over a floor line, the hit on 4, empty fists (the ask said: no sword).

How a page is cut: the navy is each row's own (the page's left edge, so the E page's lighter navy too), and the background is what joins
the page's edge in colours near it -- the dark outline stops it, so his navy trousers stay his; a navy hole the size of a gap under an arm is
background again. The figures are the pieces taller than a fifth of the page; the floor line, the title, the numbers and the HIT text fall
out by shape. One scale a page (deep16/art-src/mannequin/README.md): frame 1, crown to the lowest boot, to the mannequin's frame 1 in that
view. Each frame is boxed down, snapped to the 64 colours and ringed with the outline, then stood in the mannequin's slash cell (96 x 84, the
anchor 48,79): its lowest row on the anchor row, its boots' middle on the anchor.

The sword is drawn into the frames, not by the engine (S.WIELD has no sword yet, and this is a test sheet): from his right fist -- the skin
nearest where the mannequin's right fist is -- along the mannequin's blade for that frame and view, the mannequin's length: a leather grip,
a gold guard, a steel blade in the palette's silver, outlined. Where the mannequin's body hides its fist, the sword goes behind him; else
over him, with his fist drawn again on top so the hand closes on the grip (js/sprites.js S.wield's way).

NE and N: cut, and scored, but kept out of the slash row's facings on the desk's guard ("don't use them as N/NE frames without his word") --
`slash` is drawn in S, SE, E and their mirrors (`drawn`), and the NE and N cuts ride a row of their own, `slashback`, that nothing plays.
`--with-back` puts them in `slash` (his word).
"""
import importlib.util, json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'deep16', '_src', 'barley', 'GROK-SLASH-2026-10-31')
OUT = os.path.join(ROOT, 'deep16', 'art-src', 'mannequin')
NAME = 'barley_grokslash_p1'
PAGES = {'SE': 'grokpose1.jpg', 'NE': 'grokpose2.jpg', 'S': 'grokpose3.jpg', 'E': 'grokpose4.jpg', 'N': 'grokpose5.jpg'}
ORDER = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
WITH_BACK = '--with-back' in sys.argv
PLAIN = '--plain' in sys.argv          # (no sword: the cuts on a grid, to read his fists off -- the FIST table below)
# his RIGHT fist in each cut frame, read by eye off the cuts at 1x (`--plain` draws them on a grid; the cutters' way when a page's colours won't
# say: HAND43, stand_of): the skin test finds his face before his fist in the wind-ups, and on the SE page Grok drew him gloved. By his side, so
# the sword stays in one hand through the row -- the image's left in S, its right in N, the near arm in E and NE, the front-left in SE; 'rig':
# the fist hidden behind him, as the mannequin's is (NE 5), so the mannequin's point and the sword behind him
FIST = {'SE': [(42, 54), (42, 35), (44, 33), (66, 45), (39, 57), (42, 54)],
        'E':  [(58, 59), (43, 31), (46, 29), (68, 46), (58, 61), (57, 61)],
        'NE': [(62, 57), (64, 53), (62, 35), (67, 42), 'rig', (62, 57)],
        'S':  [(41, 58), (37, 42), (38, 35), (43, 48), (39, 59), (43, 57)],
        'N':  [(58, 62), (58, 39), (57, 33), (65, 46), (61, 58), (58, 62)]}
BG_TOL, HOLE = 34, 400            # (a colour this near the row's navy is background; an enclosed navy patch bigger than HOLE page px is too)

_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)
P = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps']
hexc = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.uint8)
OUTL, GRIP, GUARD, STEEL, STEEL2 = hexc(P['outline'][0]), hexc(P['leather'][2]), hexc(P['gold'][3]), hexc(P['silver'][6]), hexc(P['silver'][5])
SKIN = {tuple(hexc(c)) for c in P['skin'][2:]}
HAIR = {tuple(hexc(c)) for c in P['gold'] + P['fire']}

RIG = json.load(open(os.path.join(OUT, 'mannequin_slash.json'), encoding='utf-8'))
CELL = RIG['anims']['slash']; FW, FH, AX, AY = CELL['fw'], CELL['fh'], CELL['ax'], CELL['ay']
RP = RIG['pilot']['points']['slash']


# ------------------------------------------------------------------ a page -> six frames at the page's size
def page_frames(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    H, W = a.shape[:2]
    bg = np.median(a[:, :10], axis=1)                                   # (each row's navy, off the left edge)
    near = np.linalg.norm(a - bg[:, None, :], axis=2) < BG_TOL
    lab, n = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(near, lab, range(1, n + 1))
    back = np.isin(lab, list(edge)) | np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > HOLE])
    fg = ~back
    # the floor line (a long bright run, whole across the page or one under each frame) touches every boot and would join the frames into one:
    # its rows and the blend round them go, all but the dark (the soles' outline stays the figure's)
    bright = a.min(axis=2) > 160; line = np.zeros_like(bright)
    for y in range(H):
        r = np.concatenate([[0], bright[y].astype(np.int8), [0]]); d = np.diff(r); st, en = np.where(d == 1)[0], np.where(d == -1)[0]
        for s0, e0 in zip(st, en):
            if e0 - s0 > 60:
                line[max(0, y - 2):y + 3, s0:e0] = True
    fg &= ~(line & (a.max(axis=2) > 90))
    flab, fn = ndimage.label(fg)
    boxes = ndimage.find_objects(flab)
    figs = [i + 1 for i, b in enumerate(boxes) if b and (b[0].stop - b[0].start) > H * 0.2 and (b[1].stop - b[1].start) < W * 0.4]
    # the printed numbers 1-6 under the figures (the first row of glyphs below them): each figure pixel is its nearest number's, so two
    # frames that touch (SE 4's fist and its sparkle marks reach 5) are parted at the midpoint between their numbers
    fbot = max(boxes[k - 1][0].stop for k in figs)
    glyph = [b for b in boxes if b and b[0].start >= fbot - 4 and H * 0.02 < (b[0].stop - b[0].start) < H * 0.08 and (b[1].stop - b[1].start) < W * 0.06]
    glyph.sort(key=lambda b: b[0].start)
    row1 = [b for b in glyph if glyph and b[0].start - glyph[0][0].start < 20]
    cx = sorted((b[1].start + b[1].stop) / 2 for b in row1)
    if len(cx) != 6:
        raise SystemExit('%s: %d numbers under the figures, not 6' % (os.path.basename(path), len(cx)))
    allfig = np.isin(flab, figs)
    cols = np.argmin(np.abs(np.arange(W)[:, None] - np.array(cx)[None, :]), axis=1)          # (each column's nearest number)
    out = []
    for j in range(6):
        m = allfig & (cols[None, :] == j)
        lab2, n2 = ndimage.label(m)
        if n2 > 1:                                                     # (only the frame's own body: a neighbour's sliver across the line is dropped)
            s = ndimage.sum(m, lab2, range(1, n2 + 1)); m = lab2 == (np.argmax(s) + 1)
        ys, xs = np.where(m); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
        out.append(dict(rgb=a[sl].astype(np.uint8), mask=m[sl], x0=sl[1].start, y0=sl[0].start))
    return out, a


def to1x(fr, k):
    """a frame boxed down by k, snapped to the 64 colours, ringed with the outline: RGBA uint8."""
    h, w = fr['mask'].shape; nw, nh = max(1, round(w * k)), max(1, round(h * k))
    al = np.asarray(Image.fromarray((fr['mask'] * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) / 255
    pm = fr['rgb'].astype(np.float32) * fr['mask'][..., None]
    rgb = np.stack([np.asarray(Image.fromarray(np.clip(pm[..., c], 0, 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) for c in range(3)], -1)
    rgb = rgb / np.maximum(al[..., None], 1e-6) / 255
    solid = al >= 0.5
    o = np.zeros((nh + 2, nw + 2, 4), np.uint8)
    s2 = np.zeros((nh + 2, nw + 2), bool); s2[1:-1, 1:-1] = solid
    o[1:-1, 1:-1][solid, :3] = pix.snap(rgb)[solid]; o[s2, 3] = 255
    e = np.zeros_like(s2); e[1:, :] |= s2[:-1, :]; e[:-1, :] |= s2[1:, :]; e[:, 1:] |= s2[:, :-1]; e[:, :-1] |= s2[:, 1:]
    o[e & ~s2, :3] = OUTL; o[e & ~s2, 3] = 255
    return o


def feet_mid(o):
    """the boots' middle: the midpoint of the two biggest pieces in the bottom 15% of the figure (the cutters' way, 10-30)."""
    al = o[..., 3] > 0; ys = np.where(al.any(1))[0]; t, b = ys[0], ys[-1]
    band = al.copy(); band[: b - max(2, int((b - t) * 0.15))] = False
    lab, n = ndimage.label(band)
    if n == 0:
        return o.shape[1] / 2, b
    s = ndimage.sum(band, lab, range(1, n + 1)); big = np.argsort(s)[::-1][:2] + 1
    cs = [ndimage.center_of_mass(band, lab, i)[1] for i in big]
    return (sum(cs) / len(cs)), b


def place(o):
    """stood in the slash cell: its lowest row on AY, its boots' middle on AX."""
    cx, b = feet_mid(o)
    cell = np.zeros((FH, FW, 4), np.uint8)
    dx, dy = int(round(AX - cx)), AY - b
    h, w = o.shape[:2]
    x0, y0 = max(0, dx), max(0, dy); sx, sy = x0 - dx, y0 - dy
    x1, y1 = min(FW, dx + w), min(FH, dy + h)
    cell[y0:y1, x0:x1] = o[sy:sy + (y1 - y0), sx:sx + (x1 - x0)]
    clipped = (dx < 0) or (dy < 0) or (dx + w > FW) or (dy + h > FH)
    return cell, (dx, dy), clipped


def has(cell, cols):
    m = np.zeros(cell.shape[:2], bool)
    for c in cols:
        m |= (cell[..., 0] == c[0]) & (cell[..., 1] == c[1]) & (cell[..., 2] == c[2]) & (cell[..., 3] > 0)
    return m


def skin_blobs(cell):
    """his bare skin in pieces, the face told from the fists: a piece that touches his hair (gold) is his face (or an ear)."""
    sk = has(cell, SKIN); hair = ndimage.binary_dilation(has(cell, HAIR), iterations=1)
    lab, n = ndimage.label(sk)
    return [(np.array(ndimage.center_of_mass(sk, lab, i))[::-1], lab == i, bool((hair & (lab == i)).any())) for i in range(1, n + 1)]


def stamp(img, p0, p1, s, col, only_empty=False):
    n = max(1, int(math.ceil(math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * 2))); h = (s - 1) / 2
    for i in range(n + 1):
        t = i / n; x = int(round(p0[0] + (p1[0] - p0[0]) * t - h)); y = int(round(p0[1] + (p1[1] - p0[1]) * t - h))
        for yy in range(y, y + s):
            for xx in range(x, x + s):
                if 0 <= xx < img.shape[1] and 0 <= yy < img.shape[0] and (not only_empty or img[yy, xx, 3] == 0):
                    img[yy, xx, :3] = col; img[yy, xx, 3] = 255


def sword(cell, fist, rp, fistmask):
    """the longsword from the fist along the mannequin's blade (its own way and length in this frame and view): a pommel nub behind the fist,
    the guard and the blade beyond it -- nothing drawn inside the fist, and the fist (with its own outline ring) laid back over the grip."""
    F = np.array(fist, float); T = np.array(rp['tip']) - np.array(rp['fist']); L = np.linalg.norm(T); u = T / (L or 1); p = np.array([-u[1], u[0]])
    layer = np.zeros_like(cell)
    G, B0, B1 = F + u * 3, F + u * 4, F + u * L
    stamp(layer, F - u * 3.5, F - u * 2.5, 3, OUTL); stamp(layer, B0, B1 - u * 1, 3, OUTL); stamp(layer, G - p * 3, G + p * 3, 3, OUTL)
    stamp(layer, F - u * 3, F - u * 3, 1, GRIP)
    stamp(layer, B0, B1 - u * 2, 1, STEEL); stamp(layer, B0 + p * 0.9, B1 - u * 3 + p * 0.9, 1, STEEL2)
    stamp(layer, B1 - u * 2, B1 - u * 0.5, 1, STEEL)
    stamp(layer, G - p * 2, G + p * 2, 1, GUARD)
    on = layer[..., 3] > 0
    if rp['under']:                                          # (the mannequin's body hides its fist here: the sword behind him)
        put = on & (cell[..., 3] == 0)
        cell[put] = layer[put]
    else:
        ring = ndimage.binary_dilation(fistmask) & (cell[..., 3] > 0)
        keep = cell.copy(); cell[on] = layer[on]
        cell[ring] = keep[ring]                              # (his fist again on top, its outline with it: the hand closes on the grip)


def main():
    frames, score, review = {}, {}, {}
    for view, fn in PAGES.items():
        fr, page = page_frames(os.path.join(SRC, fn))
        rig = RP[view]; rig_rows = AY - rig[0]['crown'][1]
        f1 = fr[0]['mask']; ys = np.where(f1.any(1))[0]; page_rows = ys[-1] - ys[0]
        k = rig_rows / page_rows
        cells, rows = [], []
        for i, f in enumerate(fr):
            o = to1x(f, k); cell, off, clipped = place(o)
            al = cell[..., 3] > 0; ys2 = np.where(al.any(1))[0]
            crown = ys2[0] if len(ys2) else AY
            r = rig[i] if i < len(rig) else None
            row = dict(frame=i + 1, crown_d=None if r is None else int(round((AY - crown) - (AY - r["crown"][1]))), clipped=bool(clipped),
                       bottom=int(f['y0'] + np.where(f['mask'].any(1))[0][-1]), stance=None, fist_d=None, reach=None)
            # the boots: the stance's width (px at 1x) against frame 1's
            lo = al.copy(); b = ys2[-1] if len(ys2) else AY; lo[: b - 6] = False; lab, n = ndimage.label(lo)
            if n >= 2:
                s = ndimage.sum(lo, lab, range(1, n + 1)); big = np.argsort(s)[::-1][:2] + 1
                xs = sorted(ndimage.center_of_mass(lo, lab, j)[1] for j in big); row['stance'] = round(xs[1] - xs[0], 1)
            fm = np.zeros(cell.shape[:2], bool)
            if r is not None:
                want = np.array(r['fist']); blobs = skin_blobs(cell)
                fx = FIST.get(view, [None] * 6)[i]
                if fx == 'rig':                                # (hidden behind him: the mannequin's point, the sword behind him)
                    c, rr = want, r; row['fist_d'] = None; row['hidden'] = True
                elif fx is not None:                           # (read by eye: seen, so the sword over him)
                    c, rr = np.array(fx, float), dict(r, under=False)
                    y_, x_ = int(fx[1]), int(fx[0]); fm[max(0, y_ - 2):y_ + 3, max(0, x_ - 2):x_ + 3] = True; fm &= cell[..., 3] > 0
                else:                                          # (none read: the skin nearest the mannequin's fist, not his face)
                    hands = [b_ for b_ in blobs if not b_[2] and np.linalg.norm(b_[0] - want) < 16] or [b_ for b_ in blobs if not b_[2]] or blobs
                    c, fm, _ = min(hands, key=lambda b_: np.linalg.norm(b_[0] - want)) if hands else (want, fm, 0); rr = r
                if fx != 'rig':
                    row['fist_d'] = round(float(np.linalg.norm(c - want)), 1)
                row['reach'] = round(float(np.linalg.norm(np.array(c) - np.array([AX, AY - 30]))), 1)
                if not PLAIN:
                    sword(cell, c, rr, fm)
            cells.append(cell); rows.append(row)
        frames[view] = cells
        st0 = rows[0]['stance']; bots = [r_['bottom'] for r_ in rows]
        score[view] = dict(k=round(k, 4), n=len(fr), rows=rows, bob_page_px=int(max(bots) - min(bots)),
                           bob_1x=round((max(bots) - min(bots)) * k, 1),
                           stance_d=max((abs(r_['stance'] - st0) for r_ in rows if r_['stance'] is not None and st0 is not None), default=None),
                           hit=int(np.argmax([r_['reach'] or 0 for r_ in rows]) + 1))
        print('%s: %d frames, k %.3f, crown off %s, fist off %s, the furthest reach on %d, the feet bob %.1f px, stance drift %s' % (
            view, len(fr), k, [r_['crown_d'] for r_ in rows], [r_['fist_d'] for r_ in rows], score[view]['hit'], score[view]['bob_1x'], score[view]['stance_d']))

    # ---- the sheet: idle from barley_p3 (byte for byte), slash (S SE E and the mirrors; NE N with his word), slashback (NE N, nothing plays it)
    bp = json.load(open(os.path.join(ROOT, 'deep16', 'art', 'barley_p3.json'), encoding='utf-8'))
    bimg = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', 'barley_p3.png')).convert('RGBA')); ia = bp['anims']['idle']
    idle_block = bimg[ia['y']:ia['y'] + 8 * ia['fh'], : ia['frames'] * ia['fw']]
    front = ['S', 'SE', 'E'] + (['NE', 'N'] if WITH_BACK else [])
    def facing_cells(view):
        if view in MIRROR and MIRROR[view] in front:
            return [np.ascontiguousarray(c[:, ::-1]) for c in frames[MIRROR[view]]]
        return frames[view] if view in front else [np.zeros((FH, FW, 4), np.uint8)] * 6
    back = {'NE': frames['NE'], 'N': frames['N'], 'NW': [np.ascontiguousarray(c[:, ::-1]) for c in frames['NE']]}
    W = max(ia['frames'] * ia['fw'], 6 * FW); Hh = idle_block.shape[0] + 8 * FH * (1 if WITH_BACK else 2)
    sheet = np.zeros((Hh, W, 4), np.uint8); sheet[:idle_block.shape[0], :idle_block.shape[1]] = idle_block
    y = idle_block.shape[0]; anims = {'idle': dict(ia, y=0)}
    for j, f in enumerate(ORDER):
        for i, c in enumerate(facing_cells(f)):
            sheet[y + j * FH:y + (j + 1) * FH, i * FW:(i + 1) * FW] = c
    drawn = sorted(ORDER.index(f) for f in ORDER if f in front or MIRROR.get(f) in front)
    anims['slash'] = dict(y=y, fw=FW, fh=FH, ax=AX, ay=AY, frames=6, fps=12, release=3, drawn=drawn)
    y += 8 * FH
    if not WITH_BACK:
        for j, f in enumerate(ORDER):
            for i, c in enumerate(back.get(f, [np.zeros((FH, FW, 4), np.uint8)] * 6)):
                sheet[y + j * FH:y + (j + 1) * FH, i * FW:(i + 1) * FW] = c
        anims['slashback'] = dict(y=y, fw=FW, fh=FH, ax=AX, ay=AY, frames=6, fps=12, release=3, drawn=[3, 4, 5])
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', NAME + '.png'), optimize=True)
    meta = dict(image='art/%s.png' % NAME, fw=bp['fw'], fh=bp['fh'], ax=bp['ax'], ay=bp['ay'], top=bp['top'], anims=anims,
                name='Barley in mail, the one-handed slash from free Grok over the mannequin (a test sheet: nothing plays it)',
                source='free Grok\'s baseline pages (deep16/_src/barley/GROK-SLASH-2026-10-31/), cut by tools/barley-grokslash-sheet.py over the '
                       'mannequin\'s cell and scale; the longsword drawn in at 1x along the mannequin\'s blade; the idle is barley_p3\'s')
    with open(os.path.join(ROOT, 'deep16', 'art', NAME + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    json.dump(score, open(os.path.join(OUT, 'grok-score.json'), 'w', encoding='utf-8'), indent=1)

    # ---- the review: each view's six cells at 4x, the mannequin's fist (blue ring) and the feet line
    Z = 4; G = 6; rv = Image.new('RGBA', (60 + 6 * (FW * Z + G), 30 + 5 * (FH * Z + G)), (12, 20, 40, 255)); d = ImageDraw.Draw(rv)
    for j, view in enumerate(['S', 'SE', 'E', 'NE', 'N']):
        y0 = 30 + j * (FH * Z + G)
        d.text((6, y0 + FH * Z // 2), view + ('' if view in front else '\n(kept\nout)'), fill=(230, 230, 240))
        for i, c in enumerate(frames[view]):
            x0 = 60 + i * (FW * Z + G)
            d.rectangle([x0 - 1, y0 - 1, x0 + FW * Z, y0 + FH * Z], outline=(240, 196, 64) if i == 3 else (44, 56, 86))
            rv.alpha_composite(Image.fromarray(c, 'RGBA').resize((FW * Z, FH * Z), Image.NEAREST), (x0, y0))
            d.line([x0, y0 + (AY + 1) * Z, x0 + FW * Z, y0 + (AY + 1) * Z], fill=(120, 200, 140))
            fx, fy = RP[view][i]['fist']; d.ellipse([x0 + fx * Z - 7, y0 + fy * Z - 7, x0 + fx * Z + 7, y0 + fy * Z + 7], outline=(60, 160, 255), width=2)
    for i in range(6):
        d.text((60 + i * (FW * Z + G) + 4, 10), str(i + 1) + (' HIT' if i == 3 else ''), fill=(240, 196, 64) if i == 3 else (220, 226, 240))
    rv.save(os.path.join(OUT, 'grok-review.png'), optimize=True)
    print('%s: %dx%d; slash drawn in %s; review and score in %s' % (NAME, W, Hh, [ORDER[i] for i in drawn], OUT))


main()

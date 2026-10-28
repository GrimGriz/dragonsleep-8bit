"""DEEP16 pipeline 3 on a drawn figure: the star mantle, painted by code onto Aurdin's own Red Mantle frames -> deep16/art/aurdin_p4.

    python tools/starmantle-sheet.py            # deep16/art/aurdin_p4.png + .json
    python tools/starmantle-sheet.py check      # also dev/visions/starmantle/: the masks over every frame, the sheet beside the Red Mantle at 4x

His word (2026-10-28, to the lanes desk): "spin up a lane to try and build an Aurdin with a star mantle (just 4 poses) in code based off the sprites
we have... seems to me code should be more capable than it seems of drawing this stuff". The lane: ..\\handoff-2026-10-28-the-code-drawn-mantle.md.

The four poses (the seat's call, said in the lane): idle, walk, cast and attack, every frame of each, in all eight facings -- a sheet that turns, and
three rows that move the cloth, so the stars are tested holding to it. The source is aurdin_p3 (ART-73, the Red Mantle), cut by tools/aurdin-sheet.py.

1. THE MASK -- which pixels are the mantle. At the grid's size the mantle, his hair and his boots are drawn in the one red ramp (and the art desk's
   full pages do not part them by hue either: measured 10-28, hair and mantle both 0-23 degrees), so the mantle is found by PLACE and by the frame's
   own drawn lines. A neck line per frame (the face's lowest skin where a face shows; from behind, the first row the hair gives way to the collar),
   then three seeds grown at once through the red pixels, 4-connected, a dark pixel dearer to cross than a lit one (pixel art draws its edges dark,
   so two regions meet on a line): the hair from the figure's top, the mantle from just under the neck, and below it all (the belt, the book, the
   boots) from a hand's breadth under the shoulders. A red piece no seed reaches goes with what it touches.
2. THE CLOTH -- where a pixel is on the mantle. The mantle is taken as a band round his shoulders: across a row, a pixel's place from the mantle's
   left edge to its right is the sine of its angle round him from the side the view sees (S: his front; E: his right side; N: his back; the
   mirrored facings their own angles, not a mirror of the stars); down it, its place from the collar to the hem. Stars are fixed in those two
   numbers -- an angle round him and a height on the cloth -- so they ride the cloth as it swings in the walk and turn with him from facing to
   facing, and one on his back is never seen from the front.
3. THE PAINT -- the mantle's own shading kept: each of its red levels becomes a level of a night ramp (violet in the deepest folds, a midnight blue
   in the lit cloth), so the folds read as they did; a thin gold where the hem lies over the tunic; stars only on the cloth's inside (never on an
   edge or a fold's black line), a star in shadow one step dimmer; a few that glint, each on its own beat in the row. Everything that is not the
   mantle -- the face, hair, hands, clasp, strap, book, boots, the outline -- is his pixels untouched.
"""
import os, sys, json, math, heapq
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D16 = os.path.join(ROOT, 'deep16')
SRC_SHEET, OUT_SHEET = 'aurdin_p3', 'aurdin_p4'
ROWS = ['idle', 'walk', 'cast', 'attack']                      # the four poses
FACINGS = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']         # deep16/js/sprites.js S.FACINGS (rows within an animation)
DRAWN = {0: 'S', 7: 'SE', 6: 'E', 5: 'NE', 4: 'N'}             # drawn by the art desk; 1-3 their mirrors (tools/aurdin-sheet.py FACING)
MIRROR = {1: 7, 2: 6, 3: 5}
YAW = {0: 0, 7: 45, 6: 90, 5: 135, 4: 180, 3: 225, 2: 270, 1: 315}   # how far he has turned toward the screen's right, degrees

def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

# the mantle's red, darkest to lightest (the palette's red ramp and the fire ramp's two lights: deep16/palette.json)
REDS = ['240808', '4c1010', '801c1c', 'b83428', 'c85014', 'e8624a', 'f08c24', 'f8c048']
LEVEL = {hexrgb(c): i for i, c in enumerate(REDS)}
SKIN = {hexrgb(c) for c in ('aa6c4a', 'd49a72', 'f0c8a0')}
OUTLINE = hexrgb('0a0810')


def levels(fr):
    """each pixel's red level 0-7, or -1 where it is not the red"""
    lv = np.full(fr.shape[:2], -1, np.int8)
    for c, i in LEVEL.items():
        lv[(fr[..., 0] == c[0]) & (fr[..., 1] == c[1]) & (fr[..., 2] == c[2]) & (fr[..., 3] > 0)] = i
    return lv


def is_skin(fr):
    m = np.zeros(fr.shape[:2], bool)
    for c in SKIN:
        m |= (fr[..., 0] == c[0]) & (fr[..., 1] == c[1]) & (fr[..., 2] == c[2]) & (fr[..., 3] > 0)
    return m


# ------------------------------------------------------------------ 1. the mask
def neck_line(fr, lv, view):
    """the row the head ends on: the face's lowest skin (S, SE, E, NE), or from behind the first row under the hair where the collar shows"""
    al = fr[..., 3] > 0
    ys = np.where(al.any(1))[0]; top, bot = ys.min(), ys.max()
    xs = np.where(al.any(0))[0]
    if view != 'N':
        sk = is_skin(fr); sk[int(top + 0.45 * (bot - top)):] = False     # the face, not the hands
        lab, n = ndimage.label(sk)
        if n:
            sz = ndimage.sum(sk, lab, range(1, n + 1)); k = 1 + int(np.argmax(sz))
            if sz[k - 1] >= 6:
                return int(np.where((lab == k).any(1))[0].max())
    # from behind: the head's middle columns, the first row (past the crown) that is mostly not red and not ink
    cols = np.where((lv[top:top + 8] >= 0).any(0))[0]; xc = int(round(cols.mean()))     # (the hair's columns: a raised hand is not red)
    for y in range(top + 8, bot):
        seg = slice(xc - 3, xc + 4)
        other = al[y, seg] & (lv[y, seg] < 0) & ~((fr[y, seg, 0] == OUTLINE[0]) & (fr[y, seg, 1] == OUTLINE[1]) & (fr[y, seg, 2] == OUTLINE[2]))
        if other.sum() >= 4:
            return y
    return top + 15


HAND = SKIN | {hexrgb('7a4630')}


def glow(fr, lv, neck):
    """the red that is his hands' or his skin's, not the cloth's: a small piece (8 px or less) held inside a hand -- the cast's fire in a palm,
    drawn in the mantle's own reds -- and the lightest reds at a skin's edge (the glow round a hand, a cheek's flush, the neck's warm shadow:
    measured 10-28, the mantle's two lightest reds sat next to skin in 85 of 88 idle pixels), and a bright red touching those within
    two pixels of a hand (the fire's falloff). A hand is skin that starts below the head (the face,
    whose top is well above the neck line, is not one: closed with a hand it would hold the shoulder between them)"""
    sk = np.zeros(lv.shape, bool)
    for c in HAND:
        sk |= (fr[..., 0] == c[0]) & (fr[..., 1] == c[1]) & (fr[..., 2] == c[2]) & (fr[..., 3] > 0)
    lab, n = ndimage.label(sk, structure=np.ones((3, 3)))
    hand = np.zeros_like(sk)
    for k in range(1, n + 1):
        piece = lab == k
        if np.where(piece.any(1))[0].min() >= neck - 4:
            hand |= piece
    holes = ndimage.binary_fill_holes(ndimage.binary_closing(hand, structure=np.ones((3, 3)))) & ~hand
    hl, hn = ndimage.label(holes)
    held = np.isin(hl, [k for k in range(1, hn + 1) if (hl == k).sum() <= 8])
    edge = ndimage.binary_dilation(is_skin(fr), structure=np.ones((3, 3)))
    g = (lv >= 0) & (held | (edge & (lv >= 5)))
    for _ in range(2):                                             # (the fire's own falloff: a bright red touching it, twice over)
        g |= ndimage.binary_dilation(g, structure=np.ones((3, 3))) & (lv >= 4) & ndimage.binary_dilation(hand, structure=np.ones((5, 5)))
    return g


COST = {0: 6, 1: 4, 2: 2}          # a dark red pixel is dearer to cross (an edge line); level 3 and up cost 1


HEAD = {}                          # per drawn view: the head's height, hair's top to the neck line (the median over his idle row)


def head_height(js, im, f):
    if f not in HEAD:
        a = js['anims']['idle']; hs = []
        for i in range(a['frames']):
            fr = frame(im, a, f, i); lv = levels(fr)
            hs.append(neck_line(fr, lv, DRAWN[f]) - int(np.where((lv >= 0).any(1))[0].min()))
        HEAD[f] = int(round(np.median(hs)))
    return HEAD[f]


def mantle_mask(fr, view, head):
    """the mantle's pixels in one frame (a drawn facing), with the regions the seeds grew (for the check). `head`: the view's head height -- a neck
    line found more than 2 px off the hair's top plus it is a hand taken for the face (the cast's arm held out at the chin) and is not used"""
    lv = levels(fr)
    top = int(np.where((lv >= 0).any(1))[0].min())                 # the hair's top (a raised hand is not red)
    neck = neck_line(fr, lv, view)
    if abs(neck - (top + head)) > 2:
        neck = top + head
    red = (lv >= 0) & ~glow(fr, lv, neck)
    H, W = lv.shape
    reg = np.zeros((H, W), np.int8)                                # 1 hair, 2 mantle, 3 below
    seeds = []
    for y in range(H):
        for x in range(W):
            if not red[y, x]:
                continue
            if y <= top + 5:
                seeds.append((0.0, y, x, 1))
            elif neck + 2 <= y <= neck + 6 and lv[y, x] >= 2:
                seeds.append((0.0, y, x, 2))
            elif y >= neck + 15:
                seeds.append((0.0, y, x, 3))
    dist = np.full((H, W), np.inf)
    for d, y, x, r in seeds:
        dist[y, x] = 0; reg[y, x] = r
    heapq.heapify(seeds)
    while seeds:
        d, y, x, r = heapq.heappop(seeds)
        if d > dist[y, x] or reg[y, x] != r:
            continue
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and red[yy, xx]:
                nd = d + COST.get(int(lv[yy, xx]), 1)
                if nd < dist[yy, xx]:
                    dist[yy, xx] = nd; reg[yy, xx] = r; heapq.heappush(seeds, (nd, yy, xx, r))
    # a red piece no seed reached: a hand's if it touches more skin than anything, else with the region it touches most (8 round), else by its height
    lab, n = ndimage.label(red & (reg == 0))
    for k in range(1, n + 1):
        piece = lab == k
        ring = ndimage.binary_dilation(piece, structure=np.ones((3, 3))) & ~piece
        votes = np.bincount(reg[ring].astype(int), minlength=4)[1:]
        if (ring & is_skin(fr)).sum() > votes.sum():
            reg[piece] = 3                                         # (a red bit set in a hand: the hand's)
        elif votes.sum():
            reg[piece] = 1 + int(np.argmax(votes))
        else:
            cy = np.where(piece.any(1))[0].mean()
            reg[piece] = 1 if cy < neck else 2 if cy < neck + 15 else 3
    return reg == 2, reg, neck


# ------------------------------------------------------------------ 2. the cloth
def cloth(m):
    """each mantle pixel's place on the cloth: xn across its row (-1 its left edge .. 1 its right), v down its column (0 the collar .. 1 the hem),
    with the row's half-width and the column's height in px (a distance on the cloth measured in pixels); edges smoothed over three rows or columns,
    so a notch in a fold does not move the stars"""
    H, W = m.shape
    xn = np.zeros((H, W)); v = np.zeros((H, W)); hw = np.ones((H, W)); hv = np.ones((H, W))
    rows = [y for y in range(H) if m[y].any()]
    xl = {y: np.where(m[y])[0].min() for y in rows}; xr = {y: np.where(m[y])[0].max() for y in rows}
    for y in rows:
        l = np.median([xl[k] for k in (y - 1, y, y + 1) if k in xl]); r = np.median([xr[k] for k in (y - 1, y, y + 1) if k in xr])
        c, h = (l + r) / 2.0, max(1.0, (r - l) / 2.0 + 0.5)
        xs = np.where(m[y])[0]
        xn[y, xs] = np.clip((xs - c) / h, -1, 1); hw[y, xs] = h
    cols = [x for x in range(W) if m[:, x].any()]
    yt = {x: np.where(m[:, x])[0].min() for x in cols}; yb = {x: np.where(m[:, x])[0].max() for x in cols}
    for x in cols:
        t = np.median([yt[k] for k in (x - 1, x, x + 1) if k in yt]); b = np.median([yb[k] for k in (x - 1, x, x + 1) if k in yb])
        hgt = max(3.0, b - t)
        ys = np.where(m[:, x])[0]
        v[ys, x] = np.clip((ys - t) / hgt, 0, 1); hv[ys, x] = hgt
    return xn, v, hw, hv


def starfield(seed=1028, n=26):
    """the stars, fixed on the cloth: (angle round him in degrees from his front toward his left, height 0 collar .. 1 hem, kind, beat). Spread so
    no two crowd (a disc's sampling in the two numbers); most are dust, some bright, a few of the bright gold; four glint, each on its own beat"""
    rng = np.random.RandomState(seed)
    out = []
    while len(out) < n:
        th, v = rng.uniform(0, 360), rng.uniform(0.15, 0.85)
        if all(((min(abs(th - t), 360 - abs(th - t)) / 30.0) ** 2 + ((v - w) / 0.26) ** 2) >= 1 for t, w, _, _ in out):
            out.append((th, v, None, None))
    kinds = []
    for k, (th, v, _, _) in enumerate(out):
        r = rng.uniform()
        kinds.append('gold' if r < 0.12 else 'bright' if r < 0.42 else 'dust')
    bright = [k for k, kd in enumerate(kinds) if kd == 'bright']
    glint = bright[::max(1, len(bright) // 6)][:6]
    beat = {k: (j * 0.38) % 1.0 for j, k in enumerate(glint)}       # (a phase in the row: each its own, spread)
    return [(th, v, kinds[k], beat.get(k)) for k, (th, v, _, _) in enumerate(out)]


STARS = starfield()


# ------------------------------------------------------------------ 3. the paint
NIGHT = ['170d22', '2a1840', '2a1840', '1c2c5e', '30509a', '5a82cc', '8a96aa', '8a96aa']   # by the red's level, 0-7: violet in the deep folds
TRIM = ['6c4612', '6c4612', 'a4701e', 'a4701e', 'dca238', 'dca238', 'f8d67a', 'f8d67a']    # the hem's gold, by the same level
STAR = {'bright': ('fcfcf4', 'b8c3d4'), 'gold': ('f8d67a', 'dca238'), 'dust': ('8a96aa', '5a82cc')}  # (in the light, in shadow)
GLINT = ('fcfcf4', 'a8e8ff')                                                                  # a glint: its heart, its four rays


def hem_of(fr, m):
    """where the mantle's lower edge lies over his tunic or sleeve (not over the outline: the silhouette's edge keeps its ink)"""
    ink = (fr[..., 0] == OUTLINE[0]) & (fr[..., 1] == OUTLINE[1]) & (fr[..., 2] == OUTLINE[2])
    below = np.zeros_like(m); below[:-1] = ~m[1:] & (fr[1:, :, 3] > 0) & ~ink[1:]
    return m & below


def inside(fr, m):
    """the pixels a star may sit on: the cloth's inside -- all four neighbours mantle, not the hem, not a fold's black line"""
    ok = m & ~hem_of(fr, m) & (levels(fr) >= 1)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ok &= np.roll(np.roll(m, -dy, 0), -dx, 1)
    return ok


def aim(m, yaw):
    """where each star's place on the cloth is in this frame: {star: (y, x)} -- a star on the near side of him (its angle within 72 degrees of the
    middle of what the facing sees) at the mantle pixel nearest its place, measured in pixels on the cloth, if one is within 1.2 px"""
    xn, v, hw, hv = cloth(m)
    ys, xs = np.where(m)
    out = {}
    for k, (th, sv, kind, beat) in enumerate(STARS):
        rel = (th + yaw + 180) % 360 - 180                        # (round from the middle of what is seen: -yaw is that middle's angle)
        if math.cos(math.radians(rel)) < 0.3:
            continue
        d = np.hypot((xn[ys, xs] - math.sin(math.radians(rel))) * hw[ys, xs], (v[ys, xs] - sv) * hv[ys, xs])
        j = int(np.argmin(d))
        if d[j] <= 1.2:
            out[k] = (int(ys[j]), int(xs[j]))
    return out


def shift(fr, m, fr0, m0):
    """how far the mantle as a whole has moved from frame 0 (fr0, m0) to this one (fr, m): the step of up to 3 px each way that lays the one on
    the other best -- the mantle over the mantle, and the drawn shading over the same shading (a pixel the same red counts twice) -- the nearer
    step on a tie. (Measured off the mask's edges instead, the collar's line wavered a pixel as the hair moved, and the stars with it.)"""
    H, W = m.shape
    best = None
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            ys0, ys1 = max(0, -dy), min(H, H - dy); xs0, xs1 = max(0, -dx), min(W, W - dx)
            a0 = m0[ys0:ys1, xs0:xs1]; a1 = m[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx]
            same = (fr0[ys0:ys1, xs0:xs1, :3] == fr[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx, :3]).all(-1)
            score = (a0 & a1).sum() + (a0 & a1 & same).sum() - 0.5 * (abs(dy) + abs(dx))
            if best is None or score > best[0]:
                best = (score, dy, dx)
    return best[1], best[2]


def place_row(frs, ms, yaw):
    """the stars of one row in one facing, frame by frame: [[(star, y, x)] a frame]. Each star is aimed by its place on the cloth in every frame;
    one aimed in fewer than half the row's frames is left off it (round the edge of what this facing sees, or in a gap). The mantle's motion as a
    whole, frame by frame (shift), is taken out of its aims, and what is left is the star's own place on the cloth (their median) and its own sway
    (half the aims' remainder, the median of each frame and two either side round the loop, held to a pixel either way) -- so it rides every step and
    breath of the mantle exactly and sways with the cloth a little, and a pixel's jitter in the mask does not move it. It then sits on the cloth's
    inside nearest that place (within a pixel) or is hidden that frame (an arm across it); a star that would touch another in any frame is left off
    the row (the dust gives way to the bright)"""
    n = len(frs)
    aims = [aim(m, yaw) for m in ms]
    r = max(range(n), key=lambda i: (len(aims[i]), -i))
    mv = [np.array(shift(fr, m, frs[r], ms[r]), float) for fr, m in zip(frs, ms)]
    ins = [inside(fr, m) for fr, m in zip(frs, ms)]
    hems = [hem_of(fr, m) for fr, m in zip(frs, ms)]; lvs = [levels(fr) for fr in frs]
    cheb = lambda p, q: max(abs(p[0] - q[0]), abs(p[1] - q[1]))
    rows = {}
    for k in range(len(STARS)):
        seq = [np.array(a[k], float) - mv[i] if k in a else None for i, a in enumerate(aims)]
        have = [q for q in seq if q is not None]
        if len(have) * 2 < n:
            continue
        base = np.median(np.array(have), axis=0)
        res = [None if q is None else q - base for q in seq]
        held = []
        for i in range(n):
            win = (-2, -1, 0, 1, 2) if n >= 6 else (-1, 0, 1) if n > 2 else (0,)
            nb = [res[(i + d) % n] for d in win if res[(i + d) % n] is not None]
            sway = np.clip(0.5 * np.median(np.array(nb), axis=0), -1, 1) if nb else np.zeros(2)
            y, x = (int(round(v)) for v in base + mv[i] + sway)
            ok = ins[i]
            c = [(abs(dy) + abs(dx), y + dy, x + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1)
                 if 0 <= y + dy < ok.shape[0] and 0 <= x + dx < ok.shape[1] and ok[y + dy, x + dx]]
            if not c and 0 <= y < ok.shape[0] and 0 <= x < ok.shape[1] and ms[i][y, x] and not hems[i][y, x] and lvs[i][y, x] >= 1:
                c = [(0, y, x)]                                    # (at the cloth's edge this frame, but on it: kept, rather than blink)
            held.append(min(c)[1:] if c else None)
        if sum(p is None for p in held) * 3 > n:
            continue                                               # (hidden in more than a third of the row: left off it)
        rows[k] = held
    keep = set(rows)
    for k in sorted(rows, key=lambda k: (STARS[k][2] != 'dust', -k), reverse=True):   # (the bright first: it keeps its place)
        if k not in keep:
            continue
        for j in sorted(keep):
            if j != k and any(rows[k][i] and rows[j][i] and cheb(rows[k][i], rows[j][i]) < 2 for i in range(n)):
                keep.discard(j)
    return [[(k, rows[k][i][0], rows[k][i][1]) for k in sorted(keep) if rows[k][i]] for i in range(n)]


def paint(fr, m, stars, fi, n):
    """one frame's mantle repainted as the star mantle (m: its mask, stars: where they sit, fi of n: the frame in its row, for the glints' beats)"""
    lv = levels(fr); out = fr.copy(); hem = hem_of(fr, m)
    for L in range(8):
        out[m & (lv == L), :3] = hexrgb(NIGHT[L])
        out[hem & (lv == L), :3] = hexrgb(TRIM[L])
    for k, y, x in stars:
        th, sv, kind, beat = STARS[k]
        b = None if beat is None else int(beat * n) % n
        if b is not None and fi == b:                              # its glint: a white heart and four pale rays
            out[y, x, :3] = hexrgb(GLINT[0])
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if m[y + dy, x + dx] and not hem[y + dy, x + dx]:
                    out[y + dy, x + dx, :3] = hexrgb(GLINT[1])
        elif b is not None and fi == (b + 1) % n:                  # and the frame after, the heart alone
            out[y, x, :3] = hexrgb(GLINT[0])
        else:
            out[y, x, :3] = hexrgb(STAR[kind][0 if lv[y, x] >= 3 else 1])
    return out

# ------------------------------------------------------------------ the sheet
def load():
    js = json.load(open(os.path.join(D16, 'art', SRC_SHEET + '.json')))
    im = np.array(Image.open(os.path.join(D16, 'art', SRC_SHEET + '.png')).convert('RGBA'))
    return js, im


def frame(im, a, f, i):
    y0 = a['y'] + f * a['fh']; x0 = i * a['fw']
    return im[y0:y0 + a['fh'], x0:x0 + a['fw']].copy()


def check_masks(js, im, out):
    """every frame of the four rows in the five drawn views, the regions tinted: hair blue, mantle green, below magenta"""
    os.makedirs(out, exist_ok=True)
    tint = {1: (60, 120, 255), 2: (40, 230, 90), 3: (230, 60, 200)}
    for row in ROWS:
        a = js['anims'][row]; n = a['frames']
        sheet = Image.new('RGBA', (a['fw'] * n * 2, a['fh'] * 5), (36, 36, 52, 255))
        for r, f in enumerate([0, 7, 6, 5, 4]):
            for i in range(n):
                fr = frame(im, a, f, i)
                m, reg, neck = mantle_mask(fr, DRAWN[f], head_height(js, im, f))
                ov = fr.copy()
                for k, c in tint.items():
                    sel = reg == k
                    ov[sel, :3] = (ov[sel, :3] * 0.35 + np.array(c) * 0.65).astype(np.uint8)
                ov[neck, :, :] = np.where(ov[neck, :, 3:4] > 0, ov[neck], (255, 255, 0, 120))
                sheet.alpha_composite(Image.fromarray(fr), (a['fw'] * i * 2, a['fh'] * r))
                sheet.alpha_composite(Image.fromarray(ov), (a['fw'] * (i * 2 + 1), a['fh'] * r))
        sheet = sheet.crop((0, 0, sheet.width, sheet.height))
        sheet.resize((sheet.width * 3, sheet.height * 3), Image.NEAREST).save(os.path.join(out, 'mask-%s.png' % row))


def build(js, im):
    """the four rows, all eight facings: a drawn facing's frame painted; a mirrored facing (SW, W, NW) the drawn one's frame and mask mirrored and
    painted at its own turn -- so its stars are where they are on the cloth, not the drawn facing's in a mirror"""
    rows, anims, y = {}, {}, 0
    W = max(js['anims'][r]['frames'] * js['anims'][r]['fw'] for r in ROWS)
    sheet = np.zeros((sum(js['anims'][r]['fh'] * 8 for r in ROWS), W, 4), np.uint8)
    for row in ROWS:
        a = js['anims'][row]; n = a['frames']
        for f in range(8):
            src = MIRROR.get(f, f)
            frs = [frame(im, a, src, i) for i in range(n)]
            ms = [mantle_mask(fr, DRAWN[src], head_height(js, im, src))[0] for fr in frs]
            if f in MIRROR:
                frs, ms = [fr[:, ::-1].copy() for fr in frs], [m[:, ::-1].copy() for m in ms]
            stars = place_row(frs, ms, YAW[f])
            for i in range(n):
                y0 = y + f * a['fh']
                sheet[y0:y0 + a['fh'], i * a['fw']:(i + 1) * a['fw']] = paint(frs[i], ms[i], stars[i], i, n)
        anims[row] = dict(a, y=y); y += a['fh'] * 8
    out = {k: v for k, v in js.items() if k != 'anims'}
    out.update(image='art/%s.png' % OUT_SHEET, anims=anims, name='Aurdin in the star mantle',
               source='Aurdin in the star mantle: the Red Mantle (aurdin_p3, ART-73) with its mantle repainted by code, four rows (tools/starmantle-sheet.py)')
    return sheet, out


def strip(js, im, sheet, out_js, path, rows=ROWS, facings=(0, 7, 6, 5, 4, 3, 2, 1), frames=None, scale=4):
    """the Red Mantle above, the star mantle below, frame by frame: every row asked, every facing asked (S SE E NE N NW W SW), cropped to the
    figure, a gap between facings, at 4x"""
    gap = lambda w: np.zeros((3, w, 4), np.uint8)
    tiles = []
    for row in rows:
        a, b = js['anims'][row], out_js['anims'][row]
        for f in facings:
            fs = frames if frames is not None else range(a['frames'])
            top = np.concatenate([frame(im, a, f, i)[40:100, 8:56] for i in fs], 1)
            bot = np.concatenate([frame(sheet, b, f, i)[40:100, 8:56] for i in fs], 1)
            tiles += [top, bot, gap(top.shape[1]), gap(top.shape[1])]
    w = max(t.shape[1] for t in tiles)
    img = np.concatenate([np.pad(t, ((0, 0), (0, w - t.shape[1]), (0, 0))) for t in tiles], 0)
    bg = np.zeros_like(img); bg[...] = (34, 34, 50, 255)
    im2 = Image.alpha_composite(Image.fromarray(bg), Image.fromarray(img))
    im2.resize((im2.width * scale, im2.height * scale), Image.NEAREST).save(path)


def main(argv):
    js, im = load()
    sheet, out_js = build(js, im)
    Image.fromarray(sheet).save(os.path.join(D16, 'art', OUT_SHEET + '.png'), optimize=True)
    json.dump(out_js, open(os.path.join(D16, 'art', OUT_SHEET + '.json'), 'w'), indent=1)
    print('%s: %d rows, %dx%d' % (OUT_SHEET, len(ROWS), sheet.shape[1], sheet.shape[0]))
    if 'check' in argv:
        vis = os.path.join(ROOT, 'dev', 'visions', 'starmantle')
        check_masks(js, im, vis)
        for row in ROWS:
            strip(js, im, sheet, out_js, os.path.join(vis, 'strip-%s.png' % row), rows=[row])
        # the turn: each row's first frame in all eight facings, side by side, the Red Mantle above
        tiles = []
        for row in ROWS:
            a, b = js['anims'][row], out_js['anims'][row]
            top = np.concatenate([frame(im, a, f, 0)[40:100, 8:56] for f in (0, 7, 6, 5, 4, 3, 2, 1)], 1)
            bot = np.concatenate([frame(sheet, b, f, 0)[40:100, 8:56] for f in (0, 7, 6, 5, 4, 3, 2, 1)], 1)
            tiles += [top, bot, np.zeros((3, top.shape[1], 4), np.uint8)]
        img = np.concatenate(tiles, 0); bg = np.zeros_like(img); bg[...] = (34, 34, 50, 255)
        t = Image.alpha_composite(Image.fromarray(bg), Image.fromarray(img)); t.resize((t.width * 4, t.height * 4), Image.NEAREST).save(os.path.join(vis, 'turn.png'))


if __name__ == '__main__':
    main(sys.argv[1:])

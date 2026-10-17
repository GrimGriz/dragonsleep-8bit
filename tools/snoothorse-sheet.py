"""DEEP16 pipeline 2 (generated art): the art desk's ART-69, ART-70 and ART-71 (+ its Newland variant) -> the Snoot's horse units and its wagons.

    python tools/snoothorse-sheet.py [fig ...]          # deep16/art/<sheet>.png + .json (all four by default)
    python tools/snoothorse-sheet.py check [fig ...]    # also dev/visions/snoothorse/<fig>/: each page's cut, every facing of every row, a lineup
    python tools/snoothorse-sheet.py measure [fig ...]  # the numbers the scale and tone are taken from, printed

Source (Griz, 2026-10-17: "if usage left try art request for horse units and wagon 16b for snoot for outbox folder"; then "Need the cutting of the
snoot-related in Fresh, horse and wagon units"): four deliveries, sorted out of Fresh into deep16/_src/<fig>/<ART>/ (each its MANIFEST.md, manifest.json
and SHA256.json; the desk's papers and cutter notes in _src/art-desk/received-2026-10-17-<ART>/):
    newlandrider   ART-69          Newland's mounted man-at-arms, a bay warhorse in the Sun's orange-gold       -> newlandrider_p1
    plainsrider    ART-70          the plains tribes' outrider, a lean dun horse, a spear                       -> plainsrider_p1
    wagon          ART-71          the covered wagon, two draft horses, the wagoneer in the Dominion's black    -> wagon_p1
    newlandwagon   ART-71-NEWLAND  the same wagon as Newland's military supply wagon (the desk's variant, on his "riff off 71 to
                                   make a more military wagon for 69's team"; its notes: "Dominion dm1-dm3 retain original ART-71")  -> newlandwagon_p1
Each figure in all five views, ten pages (H1-H5, page 1 and page 2; H1P1 also the turnaround, and the riders' portrait). One drawing a frame: horse and
rider (or wagon, team and wagoneer) together, the thrown rider and the wreck's pieces with their own frame.
Facings (RULED 10-14, five drawn views): S, SE, E, NE, N as drawn; SW, W, NW their mirrors. Rows: the riders' Idle -> idle, Walk -> walk (the trot, the
grid's gait), Charge -> charge (new: the Snoot's show plays it when a unit charges), Strike -> attack (the blow on frame 4, `release` 3), Flinch -> flinch,
Fall -> hurt (the death row, held at its last frame); the wagons' Idle -> idle, Roll -> walk, Jolt -> flinch, Wreck -> hurt.

How a page is cut. Its labels are found, not typed: white glyphs (each piece small, mostly white) grouped into words and the words into strips; a strip
whose words all stand at the left margin is a row's name, the rest are the frames' labels, matched in order to the manifest's printed bands (each band's
count checked). Two layouts: the riders' numbers and the wagons' page-1 "Idle 1" sit UNDER their frames (each blob belongs to the first label strip
below its centre; a frame's seed is its label's x); the wagons' page-2 "Jolt 1" sit BESIDE their frames, at the left (each blob belongs to the strip
nearest its centre; a frame's seed is the mass of what lies right of its label). Every blob wholly inside a word's box is dropped, then each band is
split among its seeds by tools/sheetrows.py split_band (bodies' cores to the nearest seed, then grown through their blobs, loose bits to the nearest).
The scale: the turnaround's Right still stands HEIGHT game px from its top to its hooves (the riders 1.5 a standing man, the assignment's measure: the
paladin npcpaladin_p0 stands 49); each page by its standing figure's filled area against the turnaround's view(s) it shows, sqrt-area (the house's
way since the hyena: height lies, a raised spear or sword is all height and no area). The tone: each page's warm colours turned to its H1P1's.
"""
import os, sys, json, subprocess, io
import importlib.util
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SR = _load('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))

SRC = os.path.join(ROOT, 'deep16', '_src')                 # the pages live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'newlandrider')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

RIDER = {'Idle': 'idle', 'Walk': 'walk', 'Charge': 'charge', 'Strike': 'attack', 'Flinch': 'flinch', 'Fall': 'hurt'}
WAGON = {'Idle': 'idle', 'Roll': 'walk', 'Jolt': 'flinch', 'Wreck': 'hurt'}
# HEIGHT: the turnaround's Right still, top to hooves, in game px. The riders: "the top of the rider's helm about one and a half times a standing man's
# height above the ground (the reference paladin is a standing man at this scale)" -- npcpaladin_p0 stands 49, so 74; the plains horse a light horse
# (the assignment: "a heavy warhorse and a light plains horse"), the same man on it a hand lower: 68, the seat's reading (his to change). The wagons: "the
# top of the canvas about one and a half times a standing man's height above the ground", 74.
FIGS = {
    'newlandrider': dict(sheet='newlandrider_p1', dir=('newlandrider', 'ART-69'), rows=RIDER, height=74, stand=('Flinch', 3)),
    'plainsrider': dict(sheet='plainsrider_p1', dir=('plainsrider', 'ART-70'), rows=RIDER, height=68, stand=('Flinch', 3)),
    'wagon': dict(sheet='wagon_p1', dir=('wagon', 'ART-71'), rows=WAGON, height=74, stand=('Jolt', 3)),
    'newlandwagon': dict(sheet='newlandwagon_p1', dir=('wagon', 'ART-71-NEWLAND'), rows=WAGON, height=74, stand=('Jolt', 3)),
}
# `stand`: page 2's frame (0-based) measured against page 1's Idle for the page's scale -- the riders' Flinch 4 ("then both steady") and the wagons'
# Jolt 4 ("then all steady").
VIEW = {1: 'SE', 2: 'NE', 3: 'S', 4: 'E', 5: 'N'}
TURNVIEW = {'SE': ('Front', 'Right'), 'NE': ('Right', 'Back'), 'S': ('Front',), 'E': ('Right',), 'N': ('Back',)}   # the stills each view sits between
FACING = {'S': (0,), 'SE': (7, 1), 'E': (6, 2), 'NE': (5, 3), 'N': (4,)}   # deep16/js/sprites.js S.FACINGS: S SW W NW N NE E SE (1-3 drawn mirrored)
# what a page's probe can't read alone: a strip of motion lines taken for labels (Jolt 2's, over the front views' canvas), and a number touching a hoof
STRAYS = {('ART-71', 3, 2): (54, 74), ('ART-71-NEWLAND', 3, 2): (51, 66)}
ADDX = {('ART-70', 3, 1, 1419): (866, 855, 1408, 880, 1433)}             # Charge 6's number on its hoof: (x, the glyph's box painted navy)
FPS = {'rider': {'idle': 5, 'walk': 10, 'charge': 12, 'attack': 12, 'flinch': 12, 'hurt': 8},
       'wagon': {'idle': 5, 'walk': 8, 'flinch': 10, 'hurt': 8}}
RELEASE = {'attack': 3}                      # the blow lands on frame 4 (js/battle.js times a melee row by its release)
NAME_X = 140                                 # a word starting left of this is a row's name (the riders', and the wagons' front view)


def kind(fig):
    return 'rider' if FIGS[fig]['rows'] is RIDER else 'wagon'


def manifest(fig):
    d = os.path.join(SRC, *FIGS[fig]['dir'])
    return d, json.load(open(os.path.join(d, 'manifest.json')))


# ---------------------------------------------------------------- the labels
def glyph_words(a, m):
    """white glyphs (a small piece, a third of it white) grouped into words: [x0, y0, x1, y1, glyphs]"""
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    white = a.min(-1) > 185
    gl = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if h > 34 or w > 34 or h < 7:
            continue
        if white[sl][lab[sl] == i + 1].mean() < 0.3:
            continue
        gl.append([sl[1].start, sl[0].start, sl[1].stop, sl[0].stop])
    gl.sort()
    ws = []
    for g in gl:
        for wd in ws:
            if abs((wd[1] + wd[3]) / 2 - (g[1] + g[3]) / 2) < 9 and g[0] - wd[2] < 24 and g[0] >= wd[0]:   # (a word's letters 24 px apart at most: H5P2's "Wreck 4" spaced 20)
                wd[0], wd[1], wd[2], wd[3] = min(wd[0], g[0]), min(wd[1], g[1]), max(wd[2], g[2]), max(wd[3], g[3]); wd[4] += 1
                break
        else:
            ws.append(g + [1])
    return ws


def strips(ws):
    """words grouped by their middle's y: [(y, [words left to right])]"""
    out = []
    for w in sorted(ws, key=lambda w: (w[1] + w[3]) / 2):
        if out and abs((w[1] + w[3]) / 2 - out[-1][0]) < 14:
            out[-1][1].append(w)
        else:
            out.append([(w[1] + w[3]) / 2, [w]])
    return [(c, sorted(l)) for c, l in out]


def bands_of(pg):
    """the manifest's printed bands -> [(row, [frame names])]; the turnaround's bands -> ('turn', [still names])"""
    out = []
    for b in pg['printed_bands_top_to_bottom']:
        if b[0].startswith('Portrait'):
            out.append(('turn', ['Front', 'Right', 'Back', 'Left']))
        elif isinstance(b[1], int):
            out.append((b[0], [str(i) for i in range(b[1], b[2] + 1)]))
        else:
            out.append(('turn', list(b)))
    return out


# ---------------------------------------------------------------- a page cut
def cut_page(fig, pg, check=False):
    """one page -> ({row: [(name, RGBA image, box)]}, layout); the turnaround as row 'turn'"""
    d, man = manifest(fig)
    art = FIGS[fig]['dir'][1]
    head, page = pg['head'], int(pg['page_id'][-1])
    a = np.asarray(Image.open(os.path.join(d, pg['file'])).convert('RGB')).astype(np.int32)
    H, W = a.shape[:2]
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    adds = {k[3]: v for k, v in ADDX.items() if k[:3] == (art, head, page)}
    for x, bx0, by0, bx1, by1 in adds.values():           # a number touching a frame: its white painted out of its box first
        sub = a[by0:by1, bx0:bx1]
        sub[(sub.min(-1) > 120)] = navy.astype(np.int32)
    m = SR.figure_mask(a)
    ws = glyph_words(a, m)
    sts = [(y, l) for y, l in strips(ws) if not any(abs(y - s) < 6 for s in STRAYS.get((art, head, page), ()))]
    labels = [(y, l) for y, l in sts if not all(w[0] < NAME_X for w in l)]
    want = bands_of(pg)
    if len(labels) != len(want):
        raise SystemExit('%s %s: %d label strips found, %d bands in the manifest' % (art, pg['file'], len(labels), len(want)))
    seeds = []
    for (y, l), (row, names) in zip(labels, want):
        xs = [(w[0] + w[2]) / 2 for w in l]
        for sy, (x, *_b) in adds.items():
            if abs(sy - y) < 10:
                xs = sorted(xs + [x])
        if len(xs) != len(names):
            raise SystemExit('%s %s %s at y %d: %d labels, %d wanted' % (art, pg['file'], row, y, len(xs), len(names)))
        seeds.append(xs)
    text = [(w[0] - 3, w[1] - 3, w[2] + 3, w[3] + 3) for w in ws]
    SR.drop_text(m, text)                                   # (a stray strip's bits -- Jolt 2's motion lines -- are a frame's: not text, kept)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    sz = ndimage.sum(m, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.where(sz >= 6)[0])          # specks under 6 px are noise
    m &= keep
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(lab)
    cy = np.array([(sl[0].start + sl[0].stop) / 2 for sl in objs])
    cx = np.array([(sl[1].start + sl[1].stop) / 2 for sl in objs])
    ly = np.array([y for y, _ in labels])
    # the layout: labels under their frames leave nothing below the last of them; labels beside their frames (at the left, at the frame's top or
    # middle) leave the last row's frames, or half of them, below it (the riders' numbers are under on every page)
    after = m[int(max(w[3] for w in labels[-1][1])) + 4:].sum() / max(1, m.sum())
    layout = 'beside' if after > 0.05 and FIGS[fig]['rows'] is WAGON else 'under'
    if layout == 'under':
        owner = np.searchsorted(ly, cy)                     # the first label strip below the blob's middle
    else:
        owner = np.argmin(np.abs(cy[:, None] - ly[None, :]), axis=1)
    # a small piece (a wreck's splinters, a loose sword, a whip's tip) goes with the body nearest it, not the label: a wagon's splinters fly down
    # past the next band's label, and were read as that band's (Wreck 3-6 stood 60 px high on the first cut)
    sz = ndimage.sum(m, lab, range(1, n + 1))
    big = sz >= 2000
    if big.any() and (~big).any():
        bodies = np.isin(lab, 1 + np.where(big)[0])
        _, (iy, ix) = ndimage.distance_transform_edt(~bodies, return_indices=True)
        for i in np.where(~big)[0]:
            ys, xs = np.where(lab[objs[i]] == i + 1)
            y0, x0 = objs[i][0].start + ys[0], objs[i][1].start + xs[0]
            owner[i] = owner[lab[iy[y0, x0], ix[y0, x0]] - 1]
    out, over = {}, (a * 0.25).astype(np.uint8) if check else None
    for k, ((y, l), (row, names)) in enumerate(zip(labels, want)):
        mine = owner == k
        if row == 'turn' and FIGS[fig]['rows'] is RIDER:     # the portrait: left of the stills
            mine &= cx > l[0][0] - 50
        band = np.isin(lab, 1 + np.where(mine)[0])
        if not band.any():
            raise SystemExit('%s %s %s: nothing in the band' % (art, pg['file'], row))
        xs = seeds[k]
        if layout == 'beside':                              # each frame right of its label: the mass between its label and the next
            edges = [w[0] for w in l] + [W]
            col = band.sum(0)
            xs = [float((np.arange(e0, e1) * col[e0:e1]).sum() / max(1, col[e0:e1].sum())) for e0, e1 in zip(edges[:-1], edges[1:])]
        g = SR.split_band(band, xs)
        for dy, dx in ((0, 1), (1, 0), (1, 1), (1, -1)):   # two frames still touching (a blade into the next frame)
            p = g[:g.shape[0] - dy, max(0, -dx):g.shape[1] - max(0, dx)]
            q = g[dy:, max(0, dx):g.shape[1] - max(0, -dx)]
            yy, xx = np.where((p > 0) & (q > 0) & (p != q))
            if len(yy):
                print('  touching: %s %s %s at x %d y %d (frames %s and %s)' % (art, pg['file'][-16:-4], row, xx[0] + max(0, -dx), yy[0],
                                                                             names[p[yy[0], xx[0]] - 1], names[q[yy[0], xx[0]] - 1]))
                break
        frs = []
        for i, nm in enumerate(names):
            kp = g == i + 1
            if not kp.any():
                raise SystemExit('%s %s %s %s: nothing cut' % (art, pg['file'], row, nm))
            im, box = SR.rgba_crop(a, kp)
            frs.append((nm, im, box, frs[0][2][3] if frs else box[3]))   # (its ground: the hooves of its printed band's first frame)
            if check:
                over[kp] = (a[kp] * 0.35 + np.array(SR.HUES[i % len(SR.HUES)]) * 0.65).astype(np.uint8)
        out.setdefault(row, []).extend(frs)
    if check:
        dd = os.path.join(ROOT, 'dev', 'visions', 'snoothorse', fig); os.makedirs(dd, exist_ok=True)
        im = Image.fromarray(over)
        dr = ImageDraw.Draw(im)
        for y, l in labels:
            for w in l:
                dr.rectangle(w[:4], outline=(255, 255, 255))
        im.save(os.path.join(dd, 'cut-H%dP%d.png' % (head, page)))
    return out, layout                                      # (each row's frames in number order: its printed bands joined top to bottom,
                                                            # each frame with its own band's ground -- Walk 5-8 print a band below Walk 1-4)


# ---------------------------------------------------------------- scale and tone
def hsv(im):
    a = np.asarray(im).astype(float)
    rgb = a[..., :3] / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1)
    dd = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = (np.where(mx == r, ((g - b) / dd) % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) * 60) % 360
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return a, h, s, mx


def from_hsv(a, h, s, v):
    cc = v * s
    x = cc * (1 - np.abs((h / 60) % 2 - 1))
    sec = (h // 60).astype(int) % 6
    z = np.zeros_like(cc)
    out = np.select([sec[..., None] == k for k in range(6)],
                    [np.stack(p, -1) for p in ((cc, x, z), (x, cc, z), (z, cc, x), (z, x, cc), (x, z, cc), (cc, z, x))]) + (v - cc)[..., None]
    a = a.copy()
    a[..., :3] = np.clip(out * 255, 0, 255)
    return Image.fromarray(a.round().astype(np.uint8), 'RGBA')


def toned(im, t):
    """an RGBA cut in HSV: its warm colours' hue turned t[0] degrees, saturation times t[1]; every colour's value times t[2]"""
    if t == (0.0, 1.0, 1.0):
        return im
    a, h, s, v = hsv(im)
    warm = (h < 70) | (h > 330)
    h = np.where(warm, (h + t[0]) % 360, h)
    s = np.where(warm, np.clip(s * t[1], 0, 1), s)
    v = np.clip(v * t[2], 0, 1)
    return from_hsv(a, h, s, v)


def warm_medians(ims):
    """hue, saturation and value medians of the warm, coloured pixels (saturation over 0.25) of some cuts"""
    hs, ss, vs = [], [], []
    for im in ims:
        a, h, s, v = hsv(im)
        k = (a[..., 3] > 0) & (s > 0.25) & ((h < 70) | (h > 330))
        hs.append(((h[k] + 180) % 360) - 180); ss.append(s[k]); vs.append(v[k])
    h, s, v = np.concatenate(hs), np.concatenate(ss), np.concatenate(vs)
    return float(np.median(h)), float(np.median(s)), float(np.median(v))


def area(im):
    return float((np.asarray(im)[..., 3] > 0).sum())


def height(im):
    rows = np.where((np.asarray(im)[..., 3] > 0).any(1))[0]
    return float(rows[-1] - rows[0] + 1)


def measure(fig, check=False, say=False):
    """every page cut, and each page's scale (page px a game px) and tone -> ({(head, page): cut}, {(head, page): k}, {(head, page): tone})"""
    _, man = manifest(fig)
    cuts = {}
    for pg in man['pages']:
        cuts[(pg['head'], int(pg['page_id'][-1]))], lay = cut_page(fig, pg, check)
        if say:
            print('  %s H%dP%d: %s' % (fig, pg['head'], int(pg['page_id'][-1]), lay))
    turn = {f[0]: f[1] for f in cuts[(1, 1)]['turn']}
    kt = height(turn['Right']) / FIGS[fig]['height']
    K = {}
    sq = lambda ims: float(np.sqrt(np.median([area(i) for i in ims])))
    for hd, v in VIEW.items():
        idle = [f[1] for f in cuts[(hd, 1)]['Idle']]
        ref = np.mean([np.sqrt(area(turn[t])) for t in TURNVIEW[v]])
        K[(hd, 1)] = kt * sq(idle) / ref
        row, i = FIGS[fig]['stand']
        K[(hd, 2)] = K[(hd, 1)] * np.sqrt(area(cuts[(hd, 2)][row][i][1])) / sq(idle)
    T = {}
    base = None
    for key in sorted(cuts):
        ims = [f[1] for row, frs in cuts[key].items() if row != 'turn' for f in frs]
        med = warm_medians([im.resize((max(1, round(im.width / K[key])), max(1, round(im.height / K[key]))), Image.BOX) for im in ims])
        if base is None:
            base = med
        dh = ((base[0] - med[0] + 180) % 360) - 180
        T[key] = (dh, base[1] / med[1], base[2] / med[2]) if key != (1, 1) else (0.0, 1.0, 1.0)
        if say:
            print('  %s H%dP%d: k %.3f (%.0f%% of the turnaround\'s)  warm h/s/v %.1f %.3f %.3f -> tone %+.1f x%.3f x%.3f' %
                  (fig, key[0], key[1], K[key], 100 * kt / K[key], med[0], med[1], med[2], T[key][0], T[key][1], T[key][2]))
    if say:
        print('  %s: the turnaround\'s Right still %d page px -> %d game px (k %.3f)' % (fig, height(turn['Right']), FIGS[fig]['height'], kt))
    return cuts, K, T


# ---------------------------------------------------------------- the sheet
def game_size(img, k):
    w, h = img.size
    return img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')


def core_x(a):
    """x of the body's thick middle (the barrel of the horse, the wagon's bed): the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def place(a, x_ref, up, fw, fh, ax, ay):
    """a 1x RGBA array onto an fw x fh frame: x_ref at ax, the lowest opaque row `up` px above ay"""
    out = np.zeros((fh, fw, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), ay - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(fh, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


def views(fig, check=False):
    """{view: {engine row: [(1x RGBA array, its core x, px above the ground)]}}, each page at its own scale and tone"""
    cuts, K, T = measure(fig, check)
    rows = FIGS[fig]['rows']
    out = {v: {} for v in FACING}
    for (hd, page), cut in cuts.items():
        k, t = K[(hd, page)], T[(hd, page)]
        for row, frs in cut.items():
            if row == 'turn':
                continue
            seq = []                                         # each frame's ground: its printed band's first frame's hooves (a gallop's lift, a fall's
            for nm, im, box, floor in frs:                   # drop kept as drawn within the band; a lying body's band lies on the ground)
                a = pix.pixelate(game_size(toned(im, t), k), 1, do_lift=False)
                seq.append((a, core_x(a), int(round((floor - box[3]) / k))))
            out[VIEW[hd]][rows[row]] = seq
    return out


def build(fig, check=False):
    name = FIGS[fig]['sheet']
    hd = views(fig, check)
    engine = list(dict.fromkeys(FIGS[fig]['rows'].values()))
    # one frame height and foot for the sheet: the highest any frame rises above its ground, the lowest any lies below it
    above = max(np.where(a[..., 3].any(1))[0][-1] + 1 - np.where(a[..., 3].any(1))[0][0] + up for v in hd.values() for fs in v.values() for a, _, up in fs)
    below = max(0, max(-up for v in hd.values() for fs in v.values() for a, _, up in fs))
    AY = int(np.ceil((above + 4) / 4.0)) * 4
    FH = int(np.ceil((AY + below + 4) / 8.0)) * 8
    frames, sizes, lost = {}, {}, []
    for eng in engine:
        per = [None] * 8
        for v, fs in FACING.items():
            for f in fs:
                per[f] = hd[v][eng]
        counts = {len(p) for p in per}
        if len(counts) > 1:
            raise SystemExit('%s %s: frame counts differ by facing %s' % (fig, eng, sorted(counts)))
        half = max(max(cx, a.shape[1] - cx) for fs in per for a, cx, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, fs in enumerate(per):
            row = []
            for a, cx, up in fs:
                if f in (1, 2, 3):
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, FH, fw // 2, AY)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('%s: cut off at the frame edges: %s' % (fig, ', '.join(lost)))
    if 'charge' not in pix.ANIM_ORDER:               # (named here, not in pixelate.py: the riders' own row, as tools/gnollmatriarch-sheet.py names its cackle)
        pix.ANIM_ORDER.append('charge')
    pix.write_sheet(name, frames, sizes['idle'][0], FH, sizes['idle'][0] // 2, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS[kind(fig)].items():
        meta['anims'][row]['fps'] = fps
    for row, k in RELEASE.items():
        if row in meta['anims']:
            meta['anims'][row]['release'] = k
    meta['source'] = 'drawn by the art desk (2026-10-17, %s: every row in all five views), cut and snapped by tools/snoothorse-sheet.py' % FIGS[fig]['dir'][1]
    json.dump(meta, open(meta_p, 'w'), indent=1)
    return name


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(fig):
    """dev/visions/snoothorse/<fig>/facings-<row>.png: every facing of every row as written, S SW W NW N NE E SE top to bottom, 2x on a gray floor (the
    foot's line drawn); lineup.png: idle frame 1 in all eight facings beside the paladin (npcpaladin_p0, the standing man), 4x"""
    name = FIGS[fig]['sheet']
    d = os.path.join(ROOT, 'dev', 'visions', 'snoothorse', fig); os.makedirs(d, exist_ok=True)
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA')
    for row, an in m['anims'].items():
        fw, fh, n, y, ay = an.get('fw', m['fw']), an.get('fh', m['fh']), an['frames'], an['y'], an.get('ay', m['ay'])
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1), fh * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            dr.line([(0, f * fh + ay + 1), (cv.width, f * fh + ay + 1)], fill=(110, 114, 110, 255))
            dr.text((2, f * fh + 2), FN[f], fill=(255, 255, 255, 255))
            for i in range(n):
                cv.alpha_composite(im.crop((i * fw, y + f * fh, (i + 1) * fw, y + (f + 1) * fh)), (4 + i * (fw + 4), f * fh))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % row))
    an = m['anims']['idle']
    fw, fh, y, ay = an.get('fw', m['fw']), an.get('fh', m['fh']), an['y'], an.get('ay', m['ay'])
    g = json.load(open(os.path.join(ROOT, 'deep16', 'art', 'npcpaladin_p0.json')))
    gi = Image.open(os.path.join(ROOT, 'deep16', 'art', 'npcpaladin_p0.png')).convert('RGBA')
    ga = g['anims']['idle']
    gfw, gfh, gy, gay = ga.get('fw', g['fw']), ga.get('fh', g['fh']), ga['y'], ga.get('ay', g['ay'])
    top = max(ay, gay)
    cv = Image.new('RGBA', (fw * 8 + gfw * 2, top + 16), (70, 74, 70, 255))
    for f in range(8):
        cv.alpha_composite(im.crop((0, y + f * fh, fw, y + f * fh + min(fh, ay + 12))), (f * fw, top - ay))
    for j, f in enumerate((0, 6)):
        cv.alpha_composite(gi.crop((0, gy + f * gfh, gfw, gy + f * gfh + min(gfh, gay + 3))), (8 * fw + j * gfw, top - gay))
    ImageDraw.Draw(cv).line([(0, top + 1), (cv.width, top + 1)], fill=(200, 60, 60, 255))
    cv.resize((cv.width * 4, cv.height * 4), Image.NEAREST).save(os.path.join(d, 'lineup.png'))
    print('  wrote', d)


if __name__ == '__main__':
    args = sys.argv[1:]
    figs = [a for a in args if a in FIGS] or list(FIGS)
    if 'measure' in args:
        for f in figs:
            measure(f, check='check' in args, say=True)
    else:
        for f in figs:
            build(f, check='check' in args)
            if 'check' in args:
                facings(f)

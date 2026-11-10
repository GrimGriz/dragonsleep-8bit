"""DEEP16 pipeline 2 (generated art): the Halfway Inn's props -- the art desk's return of art-wanted section 36 (2026-11-04, nine pages) ->
deep16/art/innprops_p1.png/.json, an atlas of named pieces (the `tiles` shape js/topview.js TV.piece reads: 'x,y,w,h,ax,ay' a box).

    python -I tools/innprops-sheet.py          (`check` also writes dev/visions/innprops-check.png: each piece at 2x on its footprint's diamonds)

Sources (untracked, the shared checkout's deep16/_src/): halfway-inn/ART-36-PAGES-01-09/ -- the bundle HALFWAY-INN-PAGES-01-09.zip unzipped, each page's
CUTTER-NOTES.md beside it; the ask was deep16/_src/art-desk/sent/ASK-2026-11-04-halfway-inn-props.md. The props cutter seat (11-04, started by the lanes desk on
Griz's "cutter is delaying on the props, start up a separate cutter for those").

The pages are drawn in the grid's own 2:1 projection (a table's long top edge rises 0.47 a px across, its short edge 0.6), each prop on a transparent cell. A piece:
  - is every blob of the page inside its box (`box`, read off a probe of the page), mirrored left for right first where the floor wants the other axis (`mirror`:
    a thing drawn along the grid's x stands along its y);
  - is fitted to its footprint by its ground corners at 1x: `foot` (a, b) squares along the grid's x and y, the drawing's width across = 32 (a + b) px (the left and
    right corners of a box stand straight over its footprint's left and right corners), or a scale of its own (`k`, source px a game px) where the drawing runs past
    its footprint (the long table's benches);
  - its anchor (ax, ay) the footprint's BACK corner on the ground -- the corner at (gx0, gy0), top of the diamond -- found from the drawing's middle across and its
    lowest point (the footprint's front corner), nudged by `dx`, `dy` where the feet stand in from the corners; js/innprops.js lays it there and cuts it a square at
    a time for the sort;
  - is boxed down, snapped to deep16/palette.json and outlined (tools/gsprops-sheet.py game(), tools/pixelate.py).
The fires: each hearth is drawn dark in its mouth; its flame frames (the page's strips) are laid in that mouth -- sheared so the logs lie along the mouth's floor,
centred on it, and cut to the mouth's dark (the notes' "fit and clip each overlay to its own sloped firebox") -- each frame a box of `inn_flameC` / `inn_flameS`
with the hearth's own anchor, so it lays over the hearth exactly.
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
GS = _load('gsprops', os.path.join(ROOT, 'tools', 'gsprops-sheet.py'))
pix = GS.pix
SRC = os.path.join(pix.SRC, 'halfway-inn', 'ART-36-PAGES-01-09')
PAGE = {'P01': 'halfway-handoff/P01-HEARTHS-SOURCE.png', 'P02': 'halfway-handoff/P02-COMMON-ROOM-SOURCE.png', 'P03': 'halfway-p03/P03-KITCHEN-SOURCE.png',
        'P04': 'halfway-p04/P04-ROOMS-SOURCE.png', 'P05': 'halfway-p05/P05-BARN-SOURCE.png', 'P06': 'halfway-p06/P06-YARD-AND-SHORE-SOURCE.png',
        'P09A': 'halfway-p09/P09A-SUPPER-AND-LIGHTING.png', 'P09B': 'halfway-p09/P09B-UTILITY-AND-SHORE.png'}
HW, HH = 32, 16

# name: page, box (x0, y0, x1, y1 on the page), foot (a along x, b along y, the floor's), and the fit's own words
PIECES = {
    # PAGE 1 -- the big fire, view A (its long mouth to the lower right: the grid's +x face, the kitchen's -- the one face the fixed camera sees); the small one, A
    'inn_hearth':   dict(page='P01', box=(95, 0, 510, 440), foot=(2, 4), dy=-2),
    'inn_hearthS':  dict(page='P01', box=(1208, 250, 1380, 440), foot=(1, 1), dy=-2),
    # PAGE 2 -- the common room
    # (the furniture drawn about twice a figure's scale for its squares -- a one-square table as tall as the town figure: fitted instead by its height at the props'
    # 8 px a foot (RULED 10-14), `h` px whole, and stood in the middle of its squares; the long table half its drawn length, laid twice end to end on its six)
    'inn_longtable': dict(page='P02', box=(115, 40, 715, 435), foot=(3, 1), cut=(3, 2), h=76, dy=3),  # (a half: the table on its row, its benches over the open side's)
    'inn_settle':   dict(page='P02', box=(885, 150, 1155, 420), foot=(1, 2), h=44, mirror=True),      # (drawn along x facing +y; mirrored it stands along y facing the fire, +x)
    'inn_table2':   dict(page='P02', box=(1298, 208, 1500, 405), foot=(1, 1), h=30),
    'inn_chairA':   dict(page='P02', box=(52, 592, 190, 802), foot=(1, 1), h=30),                     # (facing +x)
    'inn_chairB':   dict(page='P02', box=(210, 618, 348, 805), foot=(1, 1), h=30),                    # (facing +y)
    # PAGE 3 -- the kitchen (each drawn along the grid's x where it has a length: the worktable, the rack), by height as the furniture above
    'inn_tub':      dict(page='P03', box=(95, 160, 350, 460), foot=(1, 1), h=28),
    'inn_worktable': dict(page='P03', box=(505, 150, 925, 505), foot=(2, 1), h=30),
    'inn_rack':     dict(page='P03', box=(1170, 30, 1670, 555), foot=(2, 1), h=48),                   # (the fish drying on a rack: laid twice along the shelf's four)
    'inn_barrel':   dict(page='P03', box=(132, 596, 306, 840), foot=(1, 1), h=24),
    'inn_crate':    dict(page='P03', box=(604, 606, 841, 836), foot=(1, 1), h=20),
    # PAGE 4 -- the rooms: the bed along x, its head at the upper left (a bed by its height is a child's cot, by its square a giant's: between)
    'inn_bed':      dict(page='P04', box=(325, 36, 716, 437), foot=(1, 1), h=36),
    'inn_bedside':  dict(page='P04', box=(1162, 120, 1394, 370), foot=(1, 1), h=22),
    'inn_chest':    dict(page='P04', box=(325, 530, 687, 824), foot=(1, 1), h=20),                    # (cut, not laid: no square names one yet)
    'inn_cupboard': dict(page='P04', box=(1085, 414, 1492, 863), foot=(2, 1), h=48),                  # (cut, not laid)
}
HELD = {'inn_counter': 'P02 lower centre: drawn near frontal (its top 0.13 a px across, not the grid\'s 0.5) and its rail on the customers\' side, which on the floor is '
                       'the side away from the camera -- held (the code\'s counter stands)',
        'inn_stair': 'P02 lower right: rises toward the screen\'s upper right (along the grid\'s y), the floor\'s runs east along x from its foot at (20,23) -- held, '
                     'as the page\'s notes warned (the code\'s floor stands)'}
# THE SECOND ATLAS, innprops_p2 (11-05, the exteriors seat): pages 5, 6, 9A and 9B -- the barn, the yard and the shore, the kitchen's kettle and tools, upstairs' stair
# head and chimney, the sign. Fitted as above (by the footprint where the page's own footprint gives a believable height at 8 px a foot, else by `h` or `k`); `mask`:
# polygons on the page cleared first (the stall's back rail and its manger: the far row's stall, which opens away from the camera, is its two side partitions)
STALL_BACK = [(272, 225), (596, 72), (598, 470), (455, 508), (272, 352)]
PIECES2 = {
    # PAGE 5 -- the barn (the stall drawn opening toward the grid's +x, its manger on the -x rail: laid mirrored it opens +y, the aisle side of the north row)
    'barn_stall':      dict(page='P05', box=(190, 65, 975, 865), foot=(2, 2)),
    'barn_stallsides': dict(page='P05', box=(190, 65, 975, 865), foot=(2, 2), mask=[STALL_BACK]),
    'barn_hay':        dict(page='P05', box=(1160, 630, 1570, 845), foot=(1, 1)),
    # PAGE 6 -- the yard and the shore
    'yard_well':       dict(page='P06', box=(75, 70, 385, 415), foot=(1, 1)),
    'yard_rail':       dict(page='P06', box=(480, 110, 862, 415), foot=(2, 1), k=5.3, mirror=True),  # (posts 4 ft at 8 px a foot: half the rail's four squares, laid twice)
    'yard_woodpile':   dict(page='P06', box=(930, 118, 1215, 395), foot=(1, 1)),                  # (a stack of 4 ft on one square: laid on each square of the floor's 2 x 2)
    'yard_wagon':      dict(page='P06', box=(1280, 30, 1760, 425), foot=(2, 4)),                  # (cut, not laid: drawn tongue to the camera, the yard's wagon faces away -- the dream list)
    'shore_boat':      dict(page='P06', box=(50, 535, 420, 830), foot=(1, 2)),
    'yard_post':       dict(page='P06', box=(555, 475, 760, 850), foot=(1, 1), h=84, dx=-11, dy=6),   # (its post, not its middle, on the square's middle)
    'yard_postlit':    dict(page='P06', box=(962, 475, 1168, 850), foot=(1, 1), h=84, dx=-11, dy=6),
    'shore_stone':     dict(page='P06', box=(1295, 540, 1728, 825), foot=(1, 2)),
    # PAGE 9B -- the kitchen's kettle and tools, the trough (drawn along y: mirrored, along x)
    'kitchen_kettle':  dict(page='P09B', box=(135, 58, 355, 327), foot=(1, 1), h=30),
    'kitchen_tools':   dict(page='P09B', box=(480, 43, 693, 340), foot=(1, 1), h=34),
    'yard_trough':     dict(page='P09B', box=(690, 390, 1083, 670), foot=(2, 1), mirror=True),
    # PAGE 9A -- upstairs' stair head and chimney (drawn 2 x 1 along x, mirrored to stand along y), the sign by the road
    'up_stairhead':    dict(page='P09A', box=(1148, 15, 1472, 303), foot=(1, 1)),
    'up_chimney':      dict(page='P09A', box=(180, 298, 395, 687), foot=(1, 2), h=170, mirror=True),  # (by its height to the ceiling: a stack of 1 x 2, laid at the hearth's back)
    'yard_sign':       dict(page='P09A', box=(1108, 705, 1390, 1000), foot=(1, 1), h=88, dx=-30, dy=16),
}
# THE ANGLE PASS (11-10, the cutter of the barn and wagon revision, on Griz's "cue the barn wagon stuff in doran's cutter"): the art desk's
# HALFWAY-INN-BARN-WAGON-ANGLE-REVISION, source revisions of pages 5 and 6 (deep16/_src/halfway-inn/ART-36-ANGLE-REVISION-1110/, its zip beside it). Two pages:
#   R1 STALLS-AND-WAGON -- a stall opening to the lower right (not cut: no row of the barn opens along x), a stall opening to the lower left with its manger on the
#      back rail (the north row's, as drawn), and Amara's wagon with its long axis down-right, three squares under canvas and the open tail toward the camera;
#   R2 STALL-OPPOSITE-ENTRY -- the left stall reversed, opening to the upper left, its head wall hiding the manger: mirrored, it opens to the upper right, the
#      south row's (which opens away from the camera, onto the aisle).
# Both pages: a faint glow round each drawing at alpha ~14 (cleared under 128). The stalls are drawn on cameras of their own -- the back post is not over the front
# one, the two spans differ (201 px and 263; R2's 426 and 327), the rails slope 0.52 to 0.69 and do not run parallel to their ground lines -- so no one scale and shear
# puts four feet on a 2 x 2's corners: each is laid WALL BY WALL (refit): every wall's ground line (between two feet, the posts' lowest points, read off the page)
# onto its edge of the diamond, verticals kept vertical, its rail made one height (HG, the posts PR times that); each page pixel goes with the front-most wall whose
# span and height hold it (`down`: how far below its ground line a wall reaches -- the north stall's manger hangs in front of its back wall).
REV = os.path.join(pix.SRC, 'halfway-inn', 'ART-36-ANGLE-REVISION-1110')
PAGE.update({'R1': os.path.join(REV, 'STALLS-AND-WAGON.png'), 'R2': os.path.join(REV, 'STALL-OPPOSITE-ENTRY.png')})
HG, PR = 44, 1.25              # (the rail 44 px over the floor, 5 1/2 ft at the props' 8 px a foot; a post a quarter over it)
REFIT = {
    # walls front to back: (from foot, to foot, the rail's height over the ground line at each end in page px, down)
    'barn_stallN': dict(page='R1', box=(792, 120, 1310, 610), pw=34,
                        feet=dict(L=(819, 496), F=(1020, 600), R=(1283, 460), B=(1080, 354)),
                        walls=[('F', 'R', 150, 176, 8), ('B', 'R', 200, 197, 80), ('L', 'B', 165, 193, 14)]),
    'barn_stallS': dict(page='R2', box=(330, 90, 1180, 890), pw=44, mirror=True,
                        feet=dict(L=(379, 593), F=(805, 871), R=(1132, 690), B=(676, 402)),
                        walls=[('L', 'F', 265, 265, 15), ('F', 'R', 262, 262, 10), ('B', 'R', 262, 256, 15)]),
}
# the wagon is drawn on the grid's 2:1 (its bed's near bottom edge 0.49, its tail's -0.50): fitted by its bed, four squares long (427 page px across: k 3.34), and
# registered by its near wheels: the middle of their two ground contacts (1552, 496) and (1765, 608) stands at 1.95 squares along x and 1.8 across from the
# footprint's back corner (the bed 1.2 squares wide in the middle of the two, the wheels outside it); the open tail then stands over the footprint's last square
PIECES3 = {'yard_wagonT': dict(page='R1', box=(1460, 70, 2060, 620), foot=(4, 2), k=3.34, reg=(1658.5, 552, 1.95, 1.8), solid=True)}
# its rim: the open tail's near rail and tailboard (and the far corner post), the rest cleared -- the same box, scale and anchor, so it lays exactly over the wagon;
# js/innprops.js draws it again after the two who stand in the bed, so the board hides their legs (the bed's floor stands 19 px under its top)
WAGON_RIM = [(1826, 466), (1903, 503), (1916, 507), (2018, 456), (2018, 430), (2056, 430), (2056, 630), (1826, 630)]


def rim(wagon, poly):
    """the wagon's own finished pixels inside a page polygon (its rim), the rest cleared: no outline of its own along the cut, the wagon's anchor"""
    from PIL import ImageDraw
    X0, Y0, k, PX, PY = wagon['xf']; g = wagon['g']
    m = Image.new('L', (g.shape[1], g.shape[0]), 0)
    ImageDraw.Draw(m).polygon([((x - X0) / k + PX, (y - Y0) / k + PY) for x, y in poly], fill=255)
    out = g.copy(); out[np.array(m) == 0] = 0
    ys, xs = np.where(out[..., 3] > 0); y0, x0 = int(ys.min()), int(xs.min())
    return dict(wagon, g=out[y0:ys.max() + 1, x0:xs.max() + 1], ax=wagon['ax'] - x0, ay=wagon['ay'] - y0)
# the floats: four frames on one waterline (the page's 1, 2, 3 bob and 4 still), each cut from the same band so the bob is kept
FLOATS = dict(page='P09B', band=(735, 860), xs=(338, 701, 1066, 1435), half=60, k=7.0)


# THE SUPPER (P09A row 1): the long spread is drawn in a row across the page, not along the table's diagonal -- each dish cut alone (a frame of `supper_dish`, anchored
# at its foot) and its place on the long table kept: `along` 0..1 down the table's length from its west end (the page's left to right), `across` -1..1 from the far edge
# to the near (the page's back row to its front); js/innprops.js lays them on the table's top during THE MEAL. The spread for two is one piece, for the table for two.
SPREAD = dict(page='P09A', box=(65, 55, 630, 232), k=4.5)
SPREAD2 = dict(page='P09A', box=(750, 62, 1008, 240), k=9.0)


def spread(spec, a):
    x0, y0, x1, y1 = spec['box']
    src = blobs_in(a, spec['box']); src[src[..., 3] < 128] = 0          # (the page's dark glow round its drawings left behind)
    # the dishes touch outline to outline: each seeded from its lit middle (the candle's flame and the jug's handle join the nearest), every pixel to its nearest seed
    al = src[..., 3]; lum = src[..., :3].astype(int).sum(-1) / 3.0
    seed = ndimage.binary_opening((al >= 240) & (lum > 45), iterations=1)
    lab, n = ndimage.label(seed); sizes = ndimage.sum(seed, lab, range(1, n + 1))
    big = [i + 1 for i in range(n) if sizes[i] >= 400]
    lab2 = np.zeros_like(lab)
    for k in big: lab2[lab == k] = k
    iy, ix = ndimage.distance_transform_edt(lab2 == 0, return_indices=True)[1]
    own = lab2[iy, ix]
    parts = []
    for k in big:
        one = src.copy(); one[own != k] = 0
        ys, xs = np.where(one[..., 3] > 0)
        g = trim(GS.game(trim(one), spec['k']))
        cx = (xs.min() + xs.max()) / 2.0 + x0; by = ys.max() + y0
        parts.append(dict(g=g, ax=g.shape[1] // 2, ay=g.shape[0] - 3, foot=[1, 1], cx=cx, by=by))
    parts.sort(key=lambda p: (p['by'], p['cx']))                 # (back to front: the far dishes drawn first)
    bys = [p['by'] for p in parts]; lo, hi = min(bys), max(bys)
    for p in parts:
        p['along'] = round((p['cx'] - x0) / float(x1 - x0), 3)
        p['across'] = round(((p['by'] - lo) / float(max(1, hi - lo))) * 2 - 1, 3)
    return parts


def spread2(spec, a):
    src = trim(blobs_in(a, spec['box']))
    g = trim(GS.game(src, spec['k']))
    return dict(g=g, ax=g.shape[1] // 2, ay=int(g.shape[0] * 0.62), foot=[1, 1])


# THE GROUND TILES (P09B row 2): the lake's shallows and the wagon ruts, painted into the code's floor (js/iso.js `groundArt`): each the drawing's diamond made exactly
# the square's 64 x 32, its colours snapped to the palette and NO outline (a dark line round every square would be a seam), the diamond filled to its edge from the
# drawing's nearest colour. The ruts are drawn along the grid's y (the Pit road): `ground_rutsX` is the same tile mirrored, along x (the wagon's track into the yard).
# The shallows are drawn deepening from the near edge to the far, so laid side by side they made a checkerboard: `flat` keeps the ripples and the light on them and lays
# them over one shallow tint (the drawing's own colours, its water two parts to its sand one)
GROUND = {'ground_shallows': dict(page='P09B', box=(105, 400, 570, 660), flat=True),
          'ground_ruts': dict(page='P09B', box=(1205, 400, 1670, 660))}


def ground(spec, a, mirror=False):
    src = trim(blobs_in(a, spec['box']))
    if mirror: src = src[:, ::-1].copy()
    t = np.asarray(Image.fromarray(src, 'RGBA').resize((2 * HW, 2 * HH), Image.BOX)).astype(np.float32) / 255.0
    yy, xx = np.mgrid[0:2 * HH, 0:2 * HW]
    dia = (np.abs(xx + 0.5 - HW) / HW + np.abs(yy + 0.5 - HH) / HH) <= 1.0
    op = t[..., 3] > 0.6
    iy, ix = ndimage.distance_transform_edt(~op, return_indices=True)[1]
    rgb = t[..., :3][iy, ix]
    if spec.get('flat'):
        low = np.stack([ndimage.gaussian_filter(rgb[..., c], 5) for c in range(3)], -1)
        top, bot = rgb[:HH][dia[:HH]].mean(0), rgb[HH:][dia[HH:]].mean(0)
        rgb = np.clip(rgb - low + (top * 2 + bot) / 3.0, 0, 1)
    out = np.zeros((2 * HH, 2 * HW, 4), np.uint8)
    out[..., :3] = pix.snap(rgb); out[..., 3] = np.where(dia, 255, 0)
    return dict(g=out, ax=HW, ay=0, foot=[1, 1])


def floats(spec, a):
    y0, y1 = spec['band']; out = []
    for cx in spec['xs']:
        box = (cx - spec['half'], y0, cx + spec['half'], y1)
        src = blobs_in(a, box)
        out.append(GS.game(src, spec['k']))
    hmax = max(g.shape[0] for g in out); wmax = max(g.shape[1] for g in out)
    cells = []
    for g in out:
        c = np.zeros((hmax, wmax, 4), np.uint8); c[:g.shape[0], :g.shape[1]] = g; cells.append(c)
    st = cells[3][..., 3] > 0; ys, xs = np.where(st)
    water = int(round((ys.min() + ys.max()) / 2.0 + (ys.max() - ys.min()) * 0.3))  # (the still frame's waterline: a little under its middle, the ripple's ring)
    ax, ay = wmax // 2, water - HH
    return [dict(g=c, ax=ax, ay=ay, foot=[1, 1]) for c in cells]


FLAMES = {  # the flame strips: page, the band of rows the frames lie in, how many, onto which hearth
    'inn_flameC': dict(page='P01', band=(455, 560), n=6, x0=100, hearth='inn_hearth'),
    'inn_flameS': dict(page='P01', band=(700, 785), n=4, x0=100, hearth='inn_hearthS'),
}


def page(p):
    return np.array(Image.open(os.path.join(SRC, PAGE[p])).convert('RGBA'))


def blobs_in(a, box):
    """the page's drawings whose middles fall in the box, alone on a cell of the box's size (the rest of the page cleared)"""
    x0, y0, x1, y1 = box
    m = ndimage.binary_closing(a[..., 3] > 100, iterations=2)
    lab, n = ndimage.label(m)
    keep = np.zeros(lab.shape, bool)
    for i, sl in enumerate(ndimage.find_objects(lab)):
        cy, cx = (sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2
        if x0 <= cx < x1 and y0 <= cy < y1 and (lab[sl] == i + 1).sum() > 60: keep |= lab == i + 1
    keep = ndimage.binary_dilation(keep, iterations=3)
    out = a.copy(); out[~keep] = 0
    return out[y0:y1, x0:x1]


def trim(g):
    ys, xs = np.where(g[..., 3] > 0)
    return g[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def masked(a, polys):
    """the page with each polygon (page px) cleared"""
    from PIL import ImageDraw
    m = Image.new('L', (a.shape[1], a.shape[0]), 0); d = ImageDraw.Draw(m)
    for p in polys: d.polygon(p, fill=255)
    out = a.copy(); out[np.array(m) > 0] = 0
    return out


def fit(name, spec, a):
    if spec.get('mask'):
        # (the drawing whole first, for its size and anchor; then the cleared page cut to the same box, so a masked piece lays exactly where the whole one does)
        whole = fit(name, dict(spec, mask=None), a)
        src = blobs_in(masked(a, spec['mask']), spec['box'])
        full = blobs_in(a, spec['box'])
        if spec.get('mirror'): src, full = src[:, ::-1].copy(), full[:, ::-1].copy()
        ys, xs = np.where(full[..., 3] > 0)
        gf = GS.game(full[ys.min():ys.max() + 1, xs.min():xs.max() + 1], whole['k'])
        gm = GS.game(src[ys.min():ys.max() + 1, xs.min():xs.max() + 1], whole['k'])
        yy, xx = np.where(gf[..., 3] > 0)
        return dict(whole, g=gm[yy.min():yy.max() + 1, xx.min():xx.max() + 1])
    src = blobs_in(a, spec['box'])
    if spec.get('solid'): src[src[..., 3] < 128] = 0                     # (the page's faint glow round its drawings: the angle pass's, 11-10)
    if spec.get('mirror'): src = src[:, ::-1].copy()
    sy0, sx0 = [int(v.min()) for v in np.where(src[..., 3] > 0)]
    src = trim(src)
    fa, fb = spec['foot']
    k = spec.get('k') or (src.shape[0] / float(spec['h']) if spec.get('h') else src.shape[1] / (32.0 * (fa + fb)))
    G = GS.game(src, k); gy0, gx0 = [int(v.min()) for v in np.where(G[..., 3] > 0)]; g = trim(G)
    if spec.get('reg'):                                                  # (`reg`: a page point (px, py) that stands on the ground at (u, v) squares from the footprint's back corner)
        px, py, u, v = spec['reg']; pad = (G.shape[1] - round(src.shape[1] / k)) / 2.0
        X0, Y0, PX, PY = spec['box'][0] + sx0, spec['box'][1] + sy0, pad - gx0, pad - gy0   # (a page point -> the piece: (p - X0) / k + PX)
        gx = (px - X0) / k + PX; gy = (py - Y0) / k + PY
        return dict(g=g, ax=int(round(gx - 32 * (u - v))), ay=int(round(gy - 16 * (u + v))), k=k, foot=list(spec.get('cut', (fa, fb))), xf=(X0, Y0, k, PX, PY))
    ys, xs = np.where(g[..., 3] > 0)
    cx, yb, w = (xs.min() + xs.max() + 1) / 2.0, ys.max() + 1, xs.max() - xs.min() + 1
    # the drawing's own ground diamond: its middle across, its front corner the lowest point, so its middle w/4 above that; stood on the footprint's middle, whose back
    # corner is 16 (a - b) left of it and 8 (a + b) above (a drawing fitted to its footprint's width lands corner on corner)
    ax = cx - 16 * (fa - fb) + spec.get('dx', 0)
    ay = yb - w / 4.0 - 8 * (fa + fb) + spec.get('dy', 0)
    return dict(g=g, ax=int(round(ax)), ay=int(round(ay)), k=k, foot=list(spec.get('cut', (fa, fb))))


def refit(spec, a):
    """(11-10) a 2 x 2 stall drawn on a camera of its own, laid wall by wall onto the grid's: each output pixel (at the page's own scale K, boxed down after) is
    looked up wall by wall, front to back -- t along the wall's edge of the diamond, its height over that edge -> the same t along the wall's ground line on the page
    and the height there scaled by the wall's own rail (its HG game px are that end's page px) -- and taken if the page pixel is that wall's (the front-most wall whose
    span and height hold it). Posts: `pw` page px either side of a foot, up to PR times the rail. The output mirrored if `mirror`; anchor the back corner."""
    src = blobs_in(a, spec['box']); src[src[..., 3] < 128] = 0
    bx, by = spec['box'][0], spec['box'][1]
    F = {k: (x - bx, y - by) for k, (x, y) in spec['feet'].items()}
    K = ((F['F'][0] - F['L'][0]) + (F['R'][0] - F['F'][0])) / 128.0
    T = {'B': (0.0, 0.0), 'L': (-64.0 * K, 32.0 * K), 'R': (64.0 * K, 32.0 * K), 'F': (0.0, 64.0 * K)}
    al = src[..., 3] >= 128; H, W = al.shape
    walls = []
    for p, q, h0, h1, down in spec['walls']:
        P, Q = np.array(F[p], float), np.array(F[q], float)
        walls.append(dict(P=P, Q=Q, TP=np.array(T[p]), TQ=np.array(T[q]), h0=float(h0), h1=float(h1), down=float(down), mt=spec['pw'] / abs(Q[0] - P[0])))

    def hold(w, t, hg):                                                  # (the wall's span and height, in game px over its ground line)
        post = (t < w['mt']) | (t > 1 - w['mt'])
        return (t >= -w['mt']) & (t <= 1 + w['mt']) & (hg >= -w['down'] * HG / ((w['h0'] + w['h1']) / 2)) & (hg <= np.where(post, PR, 1.04) * HG)
    # whose each page pixel is
    yy, xx = np.mgrid[0:H, 0:W].astype(float); own = np.full((H, W), -1, int)
    for i, w in enumerate(walls):
        t = (xx - w['P'][0]) / (w['Q'][0] - w['P'][0]); hs = w['P'][1] + t * (w['Q'][1] - w['P'][1]) - yy
        hg = hs * HG / (w['h0'] + t * (w['h1'] - w['h0']))
        own[(own < 0) & al & hold(w, t, hg)] = i
    # the output, at the page's scale K: the diamond's corners T, room for the posts over them
    top, side = int(PR * HG * K) + 8, int(8 * K)
    oh, ow = top + int(64 * K) + side, int(128 * K) + 2 * side
    Y, X = np.mgrid[0:oh, 0:ow].astype(float); X -= ow / 2.0; Y -= top
    out = np.zeros((oh, ow, 4), np.uint8); done = np.zeros((oh, ow), bool)
    for i, w in enumerate(walls):
        t = (X - w['TP'][0]) / (w['TQ'][0] - w['TP'][0]); hg = (w['TP'][1] + t * (w['TQ'][1] - w['TP'][1]) - Y) / K
        hs = hg * (w['h0'] + t * (w['h1'] - w['h0'])) / HG
        sx = np.rint(w['P'][0] + t * (w['Q'][0] - w['P'][0])).astype(int); sy = np.rint(w['P'][1] + t * (w['Q'][1] - w['P'][1]) - hs).astype(int)
        inb = (sx >= 0) & (sx < W) & (sy >= 0) & (sy < H); sx, sy = np.clip(sx, 0, W - 1), np.clip(sy, 0, H - 1)
        take = ~done & hold(w, t, hg) & inb & al[sy, sx] & (own[sy, sx] == i)
        out[take] = src[sy[take], sx[take]]; done |= take
    if spec.get('mirror'): out = out[:, ::-1].copy()
    G = GS.game(out, K); pad = (G.shape[1] - round(ow / K)) / 2.0
    gy0, gx0 = [int(v.min()) for v in np.where(G[..., 3] > 0)]
    return dict(g=trim(G), ax=int(round((ow / 2.0) / K + pad - gx0)), ay=int(round(top / K + pad - gy0)), k=K, foot=[2, 2])


def lowline(mask):
    """per column of a mask: its lowest row (None where empty), and a straight line through them"""
    cols = [(x, np.where(mask[:, x])[0].max()) for x in range(mask.shape[1]) if mask[:, x].any()]
    xs = np.array([c[0] for c in cols], float); ys = np.array([c[1] for c in cols], float)
    s, c = np.polyfit(xs, ys, 1)
    return s, c, xs.min(), xs.max()


def flames(name, spec, a, hearth):
    """the strip's frames laid in the hearth's mouth: one transform for all (from frame 1), so the logs lie still and only the flame moves"""
    y0, y1 = spec['band']
    band = a[y0:y1].copy()
    m = band[..., 3] > 100
    lab, n = ndimage.label(ndimage.binary_closing(m, iterations=2))
    sls = sorted([sl for i, sl in enumerate(ndimage.find_objects(lab)) if (lab[sl] == i + 1).sum() > 400], key=lambda sl: sl[1].start)[:spec['n']]
    h = hearth['g']; lum = h[..., :3].astype(int).sum(-1) / 3
    dark = (h[..., 3] > 0) & (lum < 38)
    lab2, n2 = ndimage.label(dark)
    sizes = ndimage.sum(dark, lab2, range(1, n2 + 1))
    mouth = lab2 == (int(np.argmax(sizes)) + 1)
    ms, mc, mx0, mx1 = lowline(mouth)
    frames, shear, place = [], None, None
    for sl in sls:
        f = band[:, sl[1].start - 4:sl[1].stop + 4].copy()
        f = trim(f)
        g = GS.game(f, hearth['k'])
        if shear is None:
            fs, fc, fx0, fx1 = lowline(g[..., 3] > 0)
            shear = ms - fs                               # (the logs' baseline turned to the mouth's floor)
        W2 = g.shape[1]; out = np.zeros((g.shape[0] + int(abs(shear) * W2) + 6, W2, 4), np.uint8); off = int(abs(shear) * W2 / 2) + 3
        for x in range(W2):
            dy = int(round(shear * (x - W2 / 2.0)))
            out[off + dy:off + dy + g.shape[0], x] = g[:, x]
        frames.append(out)
    # place frame 1's lowest middle on the mouth's floor at its middle, two px up (the logs on the hearthstone)
    f0 = frames[0]; ys, xs = np.where(f0[..., 3] > 0)
    fcx = (xs.min() + xs.max()) / 2.0
    fby = max(np.where(f0[:, int(fcx)][:, 3] > 0)[0].max() if f0[:, int(fcx)][:, 3].any() else ys.max(), 0)
    mcx = (mx0 + mx1) / 2.0; mby = ms * mcx + mc
    ox, oy = int(round(mcx - fcx)), int(round(mby - fby - 2))
    grow = ndimage.binary_dilation(mouth, iterations=1)
    outs = []
    for f in frames:
        cv = np.zeros_like(h)
        for yy in range(f.shape[0]):
            ty = yy + oy
            if ty < 0 or ty >= h.shape[0]: continue
            for xx in range(f.shape[1]):
                tx = xx + ox
                if 0 <= tx < h.shape[1] and f[yy, xx, 3] and grow[ty, tx]: cv[ty, tx] = f[yy, xx]
        outs.append(cv)
    # one box for every frame: the union of what they cover, with the hearth's own anchor
    any_ = np.zeros(h.shape[:2], bool)
    for c in outs: any_ |= c[..., 3] > 0
    ys, xs = np.where(any_)
    by0, by1, bx0, bx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return [dict(g=c[by0:by1, bx0:bx1], ax=hearth['ax'] - int(bx0), ay=hearth['ay'] - int(by0), foot=hearth['foot']) for c in outs]


def pack(items, width=512):
    """shelf packing: [(name, piece)] -> sheet, boxes by name"""
    x = y = rowh = 0; places = []
    for nm, p in items:
        h, w = p['g'].shape[:2]
        if x + w > width: x, y, rowh = 0, y + rowh + 1, 0
        places.append((nm, p, x, y)); x += w + 1; rowh = max(rowh, h)
    H = y + rowh
    sheet = np.zeros((H, width, 4), np.uint8); tiles = {}
    for nm, p, px, py in places:
        h, w = p['g'].shape[:2]
        sheet[py:py + h, px:px + w] = p['g']
        tiles.setdefault(nm, []).append('%d,%d,%d,%d,%d,%d' % (px, py, w, h, p['ax'], p['ay']))
    return sheet, {k: ' '.join(v) for k, v in tiles.items()}


def check(items, fn='innprops-check.png'):
    """each piece at 2x on its footprint's diamonds, on the floor's grey: the anchor and the fit at a glance"""
    from PIL import ImageDraw
    cells = []
    for nm, p in items:
        g = p['g']; fa, fb = p['foot']
        W = max(g.shape[1], 32 * (fa + fb)) + 40; H = g.shape[0] + 40
        im = Image.new('RGBA', (W, H), (92, 88, 84, 255)); d = ImageDraw.Draw(im)
        ox, oy = 20 + p['ax'], 20 + p['ay']
        for i in range(fa):
            for j in range(fb):
                tx, ty = ox + (i - j) * HW, oy + (i + j) * HH
                d.polygon([(tx, ty), (tx + HW, ty + HH), (tx, ty + 2 * HH), (tx - HW, ty + HH)], outline=(230, 220, 120, 255))
        im.alpha_composite(Image.fromarray(g, 'RGBA'), (20, 20))
        d.line([(ox - 3, oy), (ox + 3, oy)], fill=(255, 60, 60, 255)); d.text((4, 2), nm, fill=(255, 255, 255, 255))
        cells.append(im.resize((im.width * 2, im.height * 2), Image.NEAREST))
    W = 1600; x = y = rowh = 0; pos = []
    for c in cells:
        if x + c.width > W: x, y, rowh = 0, y + rowh + 6, 0
        pos.append((x, y)); x += c.width + 6; rowh = max(rowh, c.height)
    out = Image.new('RGBA', (W, y + rowh), (30, 30, 30, 255))
    for c, (px, py) in zip(cells, pos): out.alpha_composite(c, (px, py))
    os.makedirs(os.path.join(ROOT, 'dev', 'visions'), exist_ok=True)
    out.save(os.path.join(ROOT, 'dev', 'visions', fn))


def main():
    pages = {}
    got = {}
    for nm, spec in PIECES.items():
        if spec['page'] not in pages: pages[spec['page']] = page(spec['page'])
        got[nm] = fit(nm, spec, pages[spec['page']])
    items = [(nm, got[nm]) for nm in PIECES]
    for nm, spec in FLAMES.items():
        for f in flames(nm, spec, pages[spec['page']], got[spec['hearth']]): items.append((nm, f))
    sheet, tiles = pack(items)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(pix.ART, 'innprops_p1.png'), optimize=True)
    meta = {'_note': 'the Halfway Inn\'s props (tools/innprops-sheet.py, the art desk\'s return of art-wanted section 36, 2026-11-04): each piece a box x,y,w,h and its anchor '
                     'ax,ay -- the back corner of its footprint on the ground; `foot` its squares along the grid\'s x and y; the flames each a frame over its hearth, the '
                     'hearth\'s own anchor. js/innprops.js lays them on the inn\'s floor and cuts each a square at a time for the sort.',
            'image': 'art/innprops_p1.png', 'fw': 64, 'fh': 64, 'ax': 32, 'ay': 48, 'prop': True, 'anims': {},
            'foot': {nm: got[nm]['foot'] for nm in PIECES}, 'fps': {'inn_flameC': 8, 'inn_flameS': 8}, 'tiles': tiles,
            'source': 'generated by the art desk (2026-11-04, ART-36 pages 1-4: deep16/_src/halfway-inn/ART-36-PAGES-01-09), cut by tools/innprops-sheet.py'}
    with open(os.path.join(pix.ART, 'innprops_p1.json'), 'w', encoding='utf-8') as fh:
        json.dump(meta, fh, indent=1)
    print('innprops_p1:', sheet.shape[1], 'x', sheet.shape[0], '|', ', '.join('%s %dx%d k%.2f' % (nm, got[nm]['g'].shape[1], got[nm]['g'].shape[0], got[nm]['k']) for nm in PIECES))
    if 'check' in sys.argv[1:]: check(items)
    # the second atlas (11-05): pages 5, 6, 9A and 9B
    got2, items2 = {}, []
    for nm, spec in PIECES2.items():
        if spec['page'] not in pages: pages[spec['page']] = page(spec['page'])
        got2[nm] = fit(nm, spec, pages[spec['page']]); items2.append((nm, got2[nm]))
    if FLOATS['page'] not in pages: pages[FLOATS['page']] = page(FLOATS['page'])
    for f in floats(FLOATS, pages[FLOATS['page']]): items2.append(('shore_float', f))
    if SPREAD['page'] not in pages: pages[SPREAD['page']] = page(SPREAD['page'])
    dishes = spread(SPREAD, pages[SPREAD['page']])
    for dsh in dishes: items2.append(('supper_dish', dsh))
    items2.append(('supper_two', spread2(SPREAD2, pages[SPREAD2['page']])))
    for nm, spec in GROUND.items():
        if spec['page'] not in pages: pages[spec['page']] = page(spec['page'])
        items2.append((nm, ground(spec, pages[spec['page']])))
    items2.append(('ground_rutsX', ground(GROUND['ground_ruts'], pages[GROUND['ground_ruts']['page']], mirror=True)))
    # the angle pass (11-10): after the rest, so every piece above keeps its box
    for nm, spec in REFIT.items():
        if spec['page'] not in pages: pages[spec['page']] = page(spec['page'])
        got2[nm] = refit(spec, pages[spec['page']]); items2.append((nm, got2[nm]))
    for nm, spec in PIECES3.items():
        if spec['page'] not in pages: pages[spec['page']] = page(spec['page'])
        got2[nm] = fit(nm, spec, pages[spec['page']]); items2.append((nm, got2[nm]))
    got2['yard_wagonRim'] = rim(got2['yard_wagonT'], WAGON_RIM); items2.append(('yard_wagonRim', got2['yard_wagonRim']))
    sheet2, tiles2 = pack(items2)
    Image.fromarray(sheet2, 'RGBA').save(os.path.join(pix.ART, 'innprops_p2.png'), optimize=True)
    meta2 = {'_note': 'the Halfway Inn\'s barn, yard and shore, and the rest of the house (tools/innprops-sheet.py, art-wanted section 36 pages 5, 6, 9A and 9B, 2026-11-05): '
                      'as innprops_p1 -- each piece a box x,y,w,h and its anchor ax,ay, the back corner of its footprint; shore_float four frames on one waterline (1-3 the bob, '
                      '4 still). js/innprops.js lays them.',
             'image': 'art/innprops_p2.png', 'fw': 64, 'fh': 64, 'ax': 32, 'ay': 48, 'prop': True, 'anims': {},
             'foot': {nm: got2[nm]['foot'] for nm in list(PIECES2) + list(REFIT) + list(PIECES3) + ['yard_wagonRim']}, 'fps': {'shore_float': 3}, 'tiles': tiles2,
             'spread': [[dsh['along'], dsh['across']] for dsh in dishes],   # (each frame of supper_dish: along the long table 0..1 from its west end, across it -1 far .. 1 near)
             'source': 'generated by the art desk (2026-11-04, ART-36 pages 5-9: deep16/_src/halfway-inn/ART-36-PAGES-01-09; 2026-11-10, its angle pass of pages 5 and 6: '
                       'ART-36-ANGLE-REVISION-1110 -- barn_stallN, barn_stallS, yard_wagonT and its rim yard_wagonRim), cut by tools/innprops-sheet.py'}
    with open(os.path.join(pix.ART, 'innprops_p2.json'), 'w', encoding='utf-8') as fh:
        json.dump(meta2, fh, indent=1)
    print('innprops_p2:', sheet2.shape[1], 'x', sheet2.shape[0], '|', ', '.join('%s %dx%d k%.2f' % (nm, got2[nm]['g'].shape[1], got2[nm]['g'].shape[0], got2[nm]['k']) for nm in list(PIECES2) + list(REFIT) + list(PIECES3) + ['yard_wagonRim']))
    if 'check' in sys.argv[1:]: check(items2, 'innprops2-check.png')


if __name__ == '__main__':
    main()

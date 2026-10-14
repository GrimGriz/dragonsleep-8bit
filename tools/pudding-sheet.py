"""DEEP16 pipeline 2 (generated art): Griz's three GPT pages of the black pudding -> pudding_p2 and its Split half puddingm_p2 (the green
Slime stand-ins, pudding_p1 and puddingm_p1, stay on disk).

    python tools/pudding-sheet.py            (writes deep16/art/pudding_p2.png/.json and puddingm_p2.png/.json)
    python tools/pudding-sheet.py check      (also dev/visions/pudding/: the cut overlays cut-<page>.png, the key's proof key-proof.png, every
                                              row in facings E, S, N, W for both sheets, and lineup.png beside a goblin, a hobgoblin, the
                                              stand-ins, the cube and the troll, each on its footprint's floor diamond)
    python tools/pudding-sheet.py probe      (each cut frame's numbers on its page: box, number x, the body's height, width and area)

Sources (gitignored, the main checkout's -- a worktree reads them there), deep16/_src/pudding/ -- ART-04, the art desk's assignment
(deep16/_src/art-desk/ENGINE-ART-HANDOFF-2026-10-14/), generated 2026-10-09, the download names matched to page IDs by eye at the desk:
  16-bit black pudding sprite sheet-1.png = ART-04_HEAD-1_PAGE-1: a portrait (dropped), a turnaround Front, Right, Back, Left (cut for the scale
      only), then rows numbered under each frame -- Idle 6, Ooze 8, Pseudopod 6;
  Black pudding flinch and fall sprites-2.png = ART-04_HEAD-1_PAGE-2: Flinch 4, Fall 6;
  Six-step black pudding wall climb.png = ART-04_HEAD-2_PAGE-1: Climb 6 (2172x724, a canvas of its own).
HEAD 1 is the heap from the bottom-right, every frame reaching or rolling toward the bottom-right; HEAD 2 from the top-right, from behind.
Rows: Idle -> idle, Ooze -> walk, Pseudopod -> `pseudopod` and `attack` (the fallback; battle.js plays a row named for the attack's name,
foes.js `Pseudopod`), Flinch -> flinch (the living hit, played once), Fall -> hurt (its last frame the flat smear), Climb -> climb. No prone
row (SRD 5.1: immune to prone). The pseudopod lands on its frame 4 (`release` 3: the arm smashed down, the floor smoking).
Facings: the pudding has no face, so HEAD 1 plays all eight -- S, SE, E, NE, N as drawn, SW, W and NW mirrored -- and the climb is HEAD 2's in
every facing, mirrored the same.
The key: the navy (9 26 56 on page 1, 5 27 62 on page 2, with a wash of 55-65 in its blue across the page) sits close to the near-black body,
so each pixel is keyed per channel against the navy where it lies (KEY below), the navy's own soft shadow round the figures left out, and the
rim GPT blurred into the navy given the colour of the nearest solid pixel. Proved on the darkest frames (key-proof.png: the fall's thin last
smears, the idle's shadowed underside, the pseudopod's smoke, the climb's heap from behind, the flinch's splash): the traced edge hugs the
outline, and at game size the rim carries no navy (0.8% of the first ring inside the outline snaps to the blue ramp, against 2.0% of the body
deeper in: its own blue-violet folds). Loose bits go whole to their own frame: idle 4's bubble drops, idle 5's
splash, pseudopod 4's smoke and 4's and 5's spatter, flinch 2's crown and 3's last drop, the fall's beads (checked on cut-<page>.png).
Each frame is placed by its number's x (the generator's cell middle, the cube's way: the ooze's surge and the pseudopod's reach stay as drawn),
the idle by its mass's middle (its numbers' x would rock the heap 5 px a loop); and at its page height against its row's ground line (the
bottom of the row's rest frames), so the pseudopod's arm and the fall's smear reach down-screen of the foot, the way they were drawn reaching.
Scale: one for the creature. Page 1's idle heap (1, 2, 3 and 6: 4 has its bubble, 5 its splash) is WIDTH px wide at game size, 58 tall, top 59
with its outline (the stand-in pudding_p1: 88 wide, top 62; the cube_p2, a Large ooze, 90 wide, top 72; the troll 84 wide; the Large floor
diamond 128): by area it comes out a shade under the stand-in, the cube and the troll. The pages meet page 1 by their rest frames' AREA, a
heap's measure -- it sags and spreads, its height and width trading frame to frame while its area holds: page 2 (flinch 1 and 4, the heap
before the blow and swelled back) at 1.246 of page 1 (by height 1.299, by width 1.237: the measures agree, it was drawn a quarter larger, as
the art log says); page 3 has no rest pose, so its climb 1 (the heap gathered at the wall's foot) meets the idle by area, 1.681 (by width it
would be 1.411, by height 2.024 -- the gathered heap stands taller and narrower than the idle, 70 x 84 px at game size against 58 x 100).
The Split half (battle.js splitOff: one size down, Large to Medium) is the same cut at HALF the size, linear: the Medium floor diamond is half
the Large's, and the stand-in pair stood at 0.51; 1/sqrt(2), 0.71, would keep the two halves' area the whole's, overflowing their square.
Colour: TONE brings page 3 to page 1 per channel (it came warmer and more violet); page 2 is left as drawn (see TONE).
How it reads at game size (2026-10-14, on the facing grids): the climb is a column of tar rearing up from the heap, 2.2 times the idle's
height, drips running down it, leaning a little to the top-right -- an upright stretching heap, not a sheet flattened against a wall (the art
log's worry, borne out; no cutter fixes it). The ooze's frame 8 is its flattest (39 px tall against frame 1's 54), so its loop lurches back
up to the full heap each cycle, as drawn.
"""
import os, sys, json, subprocess, tempfile
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SR = _load('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))

FILES = {1: os.path.join('pudding', '16-bit black pudding sprite sheet-1.png'),          # ART-04_HEAD-1_PAGE-1
         2: os.path.join('pudding', 'Black pudding flinch and fall sprites-2.png'),      # ART-04_HEAD-1_PAGE-2
         3: os.path.join('pudding', 'Six-step black pudding wall climb.png')}            # ART-04_HEAD-2_PAGE-1
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per page: text boxes (a blob wholly inside one is lettering: the row names; every row's number strip is added below), the portrait, and
# its rows: (row, band x0 y0 x1 y1, number strip y0 y1, names) -- probed 2026-10-14
SHEETS = {
  1: dict(text=[(10, 400, 100, 460), (10, 595, 100, 655), (10, 825, 162, 880)], portrait=(0, 0, 490, 304),
          rows=[('turn', (490, 70, 1536, 258), (260, 291), TURN),
                ('idle', (100, 304, 1536, 518), (507, 528), NUM(6)),         # (the portrait's last drop ends at 301)
                ('ooze', (100, 518, 1536, 708), (697, 719), NUM(8)),
                ('pseudopod', (158, 708, 1536, 957), (946, 968), NUM(6))]),
  2: dict(text=[(10, 335, 140, 395), (10, 645, 92, 705)],
          rows=[('flinch', (140, 150, 1536, 463), (451, 474), NUM(4)),
                ('fall', (90, 463, 1536, 786), (774, 797), NUM(6))]),
  3: dict(text=[(10, 300, 185, 390)],
          rows=[('climb', (185, 40, 2172, 594), (575, 612), NUM(6))]),
}
FIX = {}
CUT = {}
TOUCH_OK = {}

# the key: the ground is a dark navy with a mild wash across the page (blue 55-65), the pudding near-black purple. Each pixel is keyed against
# the navy where it lies (LOCAL: the median of the ground in 32 px blocks, smoothed), per channel: figure where any channel is KEY or more
# from it. The ground's own spread is 4 at most (one speck of 11 on page 2, which the 6 px speck rule drops); the outline (3 4 8) is 48 away.
# The rim the generator blurred into the navy is kept for the shape but given the colour of the nearest SOLID pixel (35 or more away: the
# outline or the body), so no navy is carried into the figure's edge.
KEY, SOLID, RIM = 10, 35, 3
SHADE_R, SHADE_S = 8, 0.55


def local_navy(a, B=32):
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    near = np.abs(a - navy).max(-1) < 14
    H, W = a.shape[:2]
    gh, gw = (H + B - 1) // B, (W + B - 1) // B
    bg = np.zeros((gh, gw, 3)); ok = np.zeros((gh, gw), bool)
    for i in range(gh):
        for j in range(gw):
            nb = near[i * B:(i + 1) * B, j * B:(j + 1) * B]
            if nb.sum() > 0.3 * nb.size:
                bg[i, j] = np.median(a[i * B:(i + 1) * B, j * B:(j + 1) * B][nb], axis=0); ok[i, j] = True
    _, (iy, ix) = ndimage.distance_transform_edt(~ok, return_indices=True)
    bg = bg[iy, ix]
    for c in range(3):
        bg[..., c] = ndimage.uniform_filter(bg[..., c], 3, mode='nearest')
    return np.stack([ndimage.zoom(bg[..., c], B, order=1)[:H, :W] for c in range(3)], -1)


def key_mask(a):
    """the figure: any channel KEY or more from the navy where it lies, but not the navy's own shadow (a pixel on the navy's line, r under
    SHADE_R, at more than SHADE_S of its light: GPT drew a soft dark fringe round the figures, wide between page 2's falls); a hole of that
    shadow inside a figure is figure (the underside's darkest folds), a hole of true navy stays a hole unless it is a pinhole"""
    a = a.astype(float)
    bg = local_navy(a)
    d = np.abs(a - bg).max(-1)
    s = (a * bg).sum(-1) / (bg * bg).sum(-1)
    r = np.sqrt(((a - s[..., None] * bg) ** 2).sum(-1))
    shade = (r < SHADE_R) & (s > SHADE_S)
    m = (d >= KEY) & ~shade
    holes = ndimage.binary_fill_holes(m) & ~m
    lab, n = ndimage.label(holes)
    if n:
        sz = ndimage.sum(holes, lab, range(1, n + 1))
        dark = ndimage.mean(d >= KEY, lab, range(1, n + 1))
        m |= np.isin(lab, 1 + np.where((sz < 12) | (dark > 0.5))[0])
    return m, d


def clean(a):
    """the page with its rim's navy taken out: a figure pixel near the edge and under SOLID takes the nearest solid pixel's colour"""
    m, d = key_mask(a)
    solid = m & (d >= SOLID)
    edge = ndimage.distance_transform_edt(m) <= RIM
    dist, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
    rim = m & ~solid & edge & (dist <= RIM + 1)
    out = a.copy()
    out[rim] = a[iy[rim], ix[rim]]
    return out, m, d, rim


_split_band = SR.split_band
def split_whole(m, xs):
    """sheetrows' split, then a loose drop that came out in two frames' colours (each of its pixels went to the nearest frame) goes whole
    to the frame nearest it (flinch 3's last drop, on page 2, half went to flinch 4)"""
    g = _split_band(m, xs)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    for i, sl in enumerate(ndimage.find_objects(lab)):
        piece = lab == i + 1
        ks = np.unique(g[piece]); ks = ks[ks > 0]
        if len(ks) < 2 or piece.sum() > LOOSE:
            continue
        near = [ndimage.distance_transform_edt(~((g == k) & ~piece))[piece].min() for k in ks]
        g[piece] = ks[int(np.argmin(near))]
    return g
LOOSE = 1500                      # (a drop, a splash's bead, a puff of smoke: under 1500 px on the page; a body is 15000 or more)


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def main_blob(im):
    """the frame's largest piece (the body, without its loose drops and spatter)"""
    al = np.asarray(im)[..., 3] > 0
    lab, n = ndimage.label(al, structure=np.ones((3, 3)))
    if n <= 1:
        return al
    sz = ndimage.sum(al, lab, range(1, n + 1))
    return lab == 1 + int(np.argmax(sz))


def measures(im):
    """a frame's body on the page: (height, width, sqrt of its area with holes filled, bottom row, x middle) of its largest piece"""
    m = ndimage.binary_fill_holes(main_blob(im))
    ys, xs = np.where(m)
    return int(ys.max() - ys.min() + 1), int(xs.max() - xs.min() + 1), float(np.sqrt(m.sum())), int(ys.max()), float((xs.min() + xs.max()) / 2)


def core_x(a):
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def cut(L, check=False):
    s = SHEETS[L]
    img = np.asarray(Image.open(os.path.join(SRC, FILES[L])).convert('RGB')).astype(np.int32)
    cl, m, d, rim = clean(img)
    path = os.path.join(tempfile.gettempdir(), 'pudding-sheet-%d.png' % L)
    Image.fromarray(cl.astype(np.uint8)).save(path)
    labx = {}
    for r in s['rows']:
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        labx[r[0]] = SR.label_xs(cl, x0, x1, l0, l1)
    # each number's own box (not the whole strip: pseudopod 4's and 5's last drops lie in the strip, between the numbers)
    spec = dict(text=s['text'] + [(int(x) - 26, r[2][0] - 3, int(x) + 26, r[2][1] + 4) for r in s['rows'] for x in labx[r[0]]],
                rows=[(r[0], r[1], r[2], r[3]) for r in s['rows']])
    if 'portrait' in s:
        spec['portrait'] = s['portrait']
    orig = SR.figure_mask
    SR.figure_mask = lambda a, *args, **kw: key_mask(a)[0]
    SR.split_band = split_whole
    over = [] if check else None
    try:
        out = SR.cut_sheet(path, spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()), overlay=over, tag='page %d' % L)
    finally:
        SR.figure_mask, SR.split_band = orig, _split_band
    out = {row: [(nm, im, box, labx[row][i]) for i, (nm, im, box) in enumerate(frs)] for row, frs in out.items() if row in labx}
    if check:
        dd = os.path.join(ROOT, 'dev', 'visions', 'pudding'); os.makedirs(dd, exist_ok=True)
        over[0].save(os.path.join(dd, 'cut-%d.png' % L))
    return out, rim.sum()


def probe():
    for L in SHEETS:
        c, nrim = cut(L, True)
        print('page %d: %d rim pixels recoloured' % (L, nrim))
        for row, frs in c.items():
            for nm, im, box, lx in frs:
                h, w, sa, bot, mx = measures(im)
                mb = ndimage.binary_fill_holes(main_blob(im)); ys, xs = np.where(mb)
                base = xs[ys >= ys.max() - 0.3 * (ys.max() - ys.min())].mean()
                print('  %-9s %s box %s  num x %.0f  body h %d w %d sqrtA %.1f bottom %d mid-x %.0f (%+.0f) core-x %+.0f base-x %+.0f' % (
                    row, nm, box, lx, h, w, sa, box[1] + bot, box[0] + mx, box[0] + mx - lx, box[0] + core_x(np.asarray(im)) - lx, box[0] + base - lx))


# the engine's rows: (page, row on it); every facing plays them, SW, W and NW mirrored (the pudding has no face: HEAD 1 serves all eight,
# its climb HEAD 2's)
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'ooze'), 'attack': (1, 'pseudopod'), 'pseudopod': (1, 'pseudopod'), 'flinch': (2, 'flinch'),
        'hurt': (2, 'fall'), 'climb': (3, 'climb')}
MIRROR = (1, 2, 3)
NEW = ['pseudopod']               # this cutter's own row (named here, not in pixelate.py)
FPS = {'idle': 5, 'walk': 8, 'attack': 10, 'pseudopod': 10, 'flinch': 8, 'hurt': 8, 'climb': 8}
RELEASE = {'attack': 3, 'pseudopod': 3}    # (Pseudopod 4, the arm smashed down and the floor smoking: the blow lands there -- battle.js reads `release`)
# each page's rest pose, the frames its scale is measured by (by area: the pudding is a heap that sags and spreads, so its outline's height
# and width trade against each other frame to frame while its area holds): page 1's idle without the bubble (4) and the splash (5); page 2's
# flinch before the blow and after it swells back; page 3 has no rest, its climb 1 (the heap gathered at the wall's foot) is the nearest
REST = {1: ('idle', (0, 1, 2, 5)), 2: ('flinch', (0, 3)), 3: ('climb', (0,))}
# each row's ground line on its page: the bottom of its rest frames (a frame keeps its page height against it, so the pseudopod's arm and the
# fall's smear reach down-screen of the foot, toward the bottom-right they were drawn reaching to)
GROUND = {'idle': (0, 1, 2, 3, 4, 5), 'ooze': (0, 1, 2, 3, 4, 5, 6, 7), 'pseudopod': (0, 1, 5), 'flinch': (0, 3), 'fall': (0,), 'climb': (0, 1, 4)}
WIDTH = 100                       # the idle heap's width at game size, px without its outline (see the head)
HALF = 0.5                        # the Split half, linear (see the head)
# per channel, page 3 brought to page 1 by its rest frame's mean RGB against page 1's idle's (41.5 36.1 50.5): climb 1, 45.2 37.3 54.1, warmer
# and more violet (at game size, untoned, 18% of its pixels snapped violet against the idle's 14%; toned, 14%). Against the turnaround's Back,
# the same side, 38.4 33.6 46.6, it would be toned harder still; the idle is the row the climb plays beside. Page 2 is not toned: its flinch 1
# and 4 came 6% redder on the page (44.0 36.4 50.0), but at game size, snapped, its rows' mean is within 3% of the idle's (34.9 32.7 49.0
# against 34.7 33.7 50.2) and toning it only sent its warm darks to the blue ramp (0.8% of its pixels to 2.5%)
TONE = {3: (0.918, 0.968, 0.933)}
LARGE = dict(name='pudding_p2', AY=108, FH=120, FW=96)     # (the Large sheets' frame: cube_p2, bulette_p2)
SMALL = dict(name='puddingm_p2', AY=60, FH=72, FW=64)


def game_frame(im, k, tone=None):
    """a cut frame at game size, palette-snapped and outlined; and the factor its x went by"""
    if tone:
        im = toned(im, tone)
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)
    return pix.pixelate(small, 1, do_lift=False), small.size[0] / float(w), small.size[1] / float(h)


def mean_rgb(frs, idx):
    px = np.concatenate([np.asarray(frs[i][1])[np.asarray(frs[i][1])[..., 3] > 0][:, :3] for i in idx]).astype(float)
    return px.mean(0)


def scales(c):
    """K per page (page px a game px): page 1's idle heap WIDTH px wide; pages 2 and 3 meet it by their rest frames' area"""
    rest = {L: [measures(c[L][row][i][1]) for i in idx] for L, (row, idx) in REST.items()}
    med = lambda L, j: float(np.median([m[j] for m in rest[L]]))
    k1 = med(1, 1) / WIDTH
    K = {1: k1, 2: k1 * med(2, 2) / med(1, 2), 3: k1 * med(3, 2) / med(1, 2)}
    for L in (2, 3):
        print('  K: page %d %.3f = %.3f of page 1 by area (by height it would be %.3f, by width %.3f)'
              % (L, K[L], K[L] / k1, med(L, 0) / med(1, 0), med(L, 1) / med(1, 1)))
    turn = {nm: measures(im) for nm, im, _, _ in c[1]['turn']}
    print('  K: page 1 %.3f (its idle %.0f px wide on the page); its turnaround is drawn %.3f (Front) to %.3f (Back) of its rows by area'
          % (k1, med(1, 1), turn['front'][2] / med(1, 2), turn['back'][2] / med(1, 2)))
    for L, (row, idx) in REST.items():
        print('  page %d rest (%s %s): height %.0f width %.0f sqrtA %.1f on the page -> %.1f x %.1f px at game size; mean RGB %s'
              % (L, row, [i + 1 for i in idx], med(L, 0), med(L, 1), med(L, 2), med(L, 0) / K[L], med(L, 1) / K[L],
                 mean_rgb(c[L][row], idx).round(1)))
    return K


def anchor(frs, row):
    """each frame's anchor x on the page: its number's x (the generator's cell middle, as the cube's), but the idle by its mass's middle,
    the row's mean kept (the heap heaves in place; its numbers' x leave it wobbling 5 px a loop at game size)"""
    xs = [lx for _, _, _, lx in frs]
    if row != 'idle':
        return xs
    cen = []
    for nm, im, box, lx in frs:
        mb = ndimage.binary_fill_holes(main_blob(im))
        cen.append(box[0] + np.where(mb)[1].mean())
    off = float(np.mean([c - lx for c, lx in zip(cen, xs)]))
    return [c - off for c in cen]


def build(c, K, size, ratio=1.0):
    """the engine's frames for one sheet: {row: [8 facings][frames]} and their sizes"""
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            ground = float(np.median([frs[i][2][1] + measures(frs[i][1])[3] for i in GROUND[row]]))
            ax = anchor(frs, row)
            k = K[L] / ratio
            out = []
            for (nm, im, box, lx), x in zip(frs, ax):
                a, sx, sy = game_frame(im, k, TONE.get(L))
                # (pixelate keeps the image's size: the outline is drawn on its empty edge, so a frame's pad of 2 page px holds it)
                out.append((a, (x - box[0]) * sx, (ground - box[1]) * sy))      # (anchor x, and the ground's row, in the frame's px)
            small[(L, row)] = out
        return small[(L, row)]
    src = {eng: frames_of(*by) for eng, by in ROWS.items()}
    frames, sizes, lost = {}, {}, []
    for eng, fs in src.items():
        half = max(max(cx, a.shape[1] - cx) for a, cx, _ in fs) + 2
        fw = max(size['FW'], int(np.ceil(2 * half / 8.0)) * 8)
        above = max(gy - np.where(a[..., 3].any(1))[0][0] for a, _, gy in fs)
        below = max(np.where(a[..., 3].any(1))[0][-1] - gy for a, _, gy in fs)
        ay = max(size['AY'], int(np.ceil(above + 4)))
        fh = int(np.ceil((ay + max(size['FH'] - size['AY'], below + 4)) / 4.0)) * 4
        sizes[eng] = (fw, fh, fw // 2, ay)
        frames[eng] = []
        for f in range(8):
            row = []
            for a, cx, gy in fs:
                if f in MIRROR:
                    a, cx = a[:, ::-1], a.shape[1] - cx
                out = np.zeros((fh, fw, 4), np.uint8)
                ox, oy = int(round(fw // 2 - cx)), int(round(ay - gy))
                h, w = a.shape[:2]
                y0, x0, y1, x1 = max(0, oy), max(0, ox), min(fh, oy + h), min(fw, ox + w)
                out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
                if (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum():
                    lost.append('%s facing %d' % (eng, f))
                row.append(out)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    return frames, sizes


def write(frames, sizes, size, note):
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name, AY, FH = size['name'], size['AY'], size['FH']
    # (the top for the name and the HP bar: the heap at rest, idle 1, 2, 3 and 6 -- idle 4's bubble throws drops 14 px higher, idle 5's splash)
    top = pix.top_of([fr for f in (0, 6) for i, fr in enumerate(frames['idle'][f]) if i in REST[1][1]], sizes['idle'][3])
    pix.write_sheet(name, frames, size['FW'], FH, size['FW'] // 2, AY, top, sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    for row, k in RELEASE.items():
        meta['anims'][row]['release'] = k
    meta['source'] = ('generated by Griz (2026-10-09, ART-04: three GPT pages -- HEAD 1 page 1 with its turnaround, HEAD 1 page 2, HEAD 2 page 1), '
                      'cut by tools/pudding-sheet.py' + note)
    json.dump(meta, open(meta_p, 'w'), indent=1)
    return top


def main(check=False):
    c = {L: cut(L, check)[0] for L in SHEETS}
    K = scales(c)
    big, bsz = build(c, K, LARGE)
    top = write(big, bsz, LARGE, '')
    small, ssz = build(c, K, SMALL, HALF)
    topm = write(small, ssz, SMALL, ' (the Split half: the same cut, %.2f the size)' % HALF)
    for nm, fr, sz in (('pudding_p2', big, bsz), ('puddingm_p2', small, ssz)):
        hs = [int(sz['idle'][3] - np.where(f[..., 3].any(1))[0][0]) for f in fr['idle'][6]]
        ws = [int(np.ptp(np.where(f[..., 3].any(0))[0]) + 1) for f in fr['idle'][6]]
        print('  %s idle (E, with its outline): height %s, width %s; top %d; rows %s' % (nm, hs, ws, top if nm == 'pudding_p2' else topm,
              ', '.join('%s %dx%d ay %d' % (r, v[0], v[1], v[3]) for r, v in sz.items())))
    if check:
        proof(c)


VIS = os.path.join(ROOT, 'dev', 'visions', 'pudding')


def first(name, anim, f, i=0):
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims'][anim]
    y = an['y'] + f * an['fh']
    return im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']], an['ax'], an['ay']


def over(fr, colour):
    al = fr[..., 3:4] / 255.0
    return (fr[..., :3] * al + np.array(colour) * (1 - al)).astype(np.uint8)


def strip(figs, path, scale=4, floor=(70, 74, 70), feet=None):
    """figures side by side on their feet (each sheet's ay), at 4x; `feet`: a floor diamond (w, h) under each, its footprint"""
    W = sum(a.shape[1] for a, _, _ in figs) + 10 * len(figs)
    top = max(ay for _, _, ay in figs); H = top + max(a.shape[0] - ay for a, _, ay in figs) + 8
    canvas = np.zeros((H, W, 3), np.uint8); canvas[:] = floor
    x = 5
    for j, (a, ax, ay) in enumerate(figs):
        if feet and feet[j]:
            fw_, fh_ = feet[j]
            yy, xx = np.mgrid[0:H, 0:W]
            dia = np.abs(xx - (x + ax)) / (fw_ / 2.0) + np.abs(yy - top) / (fh_ / 2.0) <= 1
            canvas[dia] = (98, 104, 96)
        y0 = top - ay
        sub = canvas[y0:y0 + a.shape[0], x:x + a.shape[1]]
        al = a[..., 3:4] / 255.0
        sub[:] = (a[..., :3] * al + sub * (1 - al)).astype(np.uint8)
        x += a.shape[1] + 10
    canvas[top, :] = (110, 40, 40)                          # (the foot's row)
    Image.fromarray(canvas).resize((W * scale, H * scale), Image.NEAREST).save(path)


def facings(name, frames, scale=4):
    """every row's frames for facings E, S, N and W, read back off the written png, a grid a facing (the foot's row ticked red)"""
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    for f, nm in ((6, 'E'), (0, 'S'), (4, 'N'), (2, 'W')):
        lines = []
        for eng in frames:
            an = m['anims'][eng]
            fs = [first(name, eng, f, i)[0] for i in range(an['frames'])]
            ink = np.any([fr[..., 3] > 0 for fr in fs], axis=0)
            ys, xs = np.where(ink)
            x0, x1, y0 = max(0, xs.min() - 2), xs.max() + 3, max(0, ys.min() - 2)
            cells = []
            for fr in fs:
                cell = np.zeros((an['fh'] + 2 - y0, x1 - x0, 3), np.uint8); cell[:] = (70, 74, 70)
                cell[:an['fh'] - y0] = over(fr[y0:, x0:x1], (70, 74, 70))
                cell[min(an['ay'] + 1 - y0, cell.shape[0] - 1)] = (110, 40, 40)
                cells.append(cell); cells.append(np.full((cell.shape[0], 4, 3), 20, np.uint8))
            lines.append(np.concatenate(cells, 1))
        W = max(l.shape[1] for l in lines)
        grid = np.concatenate([np.pad(l, ((0, 4), (0, W - l.shape[1]), (0, 0)), constant_values=20) for l in lines], 0)
        Image.fromarray(grid).resize((grid.shape[1] * scale, grid.shape[0] * scale), Image.NEAREST).save(
            os.path.join(VIS, '%s-facing-%s.png' % (name, nm)))


# the key's proof, on the darkest frames: page, row, frame (0-based) -- the fall's thin last smear, the idle's shadowed underside, the climb's
# heap from behind, the flinch's splash
PROOF = [(2, 'fall', 5), (2, 'fall', 4), (1, 'idle', 0), (1, 'pseudopod', 3), (3, 'climb', 0), (2, 'flinch', 1)]


def proof(c):
    """for each PROOF frame: the page at 3x with the key's edge traced (yellow: the first ground pixel outside the figure), beside the frame
    at game size at 4x on the navy and on a light floor"""
    pages = {L: np.asarray(Image.open(os.path.join(SRC, FILES[L])).convert('RGB')).astype(np.int32) for L in SHEETS}
    masks = {L: clean(pages[L])[1] for L in SHEETS}
    K = scales(c)
    panels = []
    for L, row, i in PROOF:
        nm, im, box, lx = c[L][row][i]
        x0, y0, x1, y1 = box[0] - 6, box[1] - 6, box[2] + 6, box[3] + 6
        pg = pages[L][y0:y1, x0:x1].astype(np.uint8).copy()
        mine = np.zeros(pg.shape[:2], bool)
        al = np.asarray(im)[..., 3] > 0
        mine[box[1] - y0:box[1] - y0 + al.shape[0], box[0] - x0:box[0] - x0 + al.shape[1]] = al
        ring = ndimage.binary_dilation(mine) & ~mine
        pg[ring] = (255, 230, 40)
        left = np.asarray(Image.fromarray(pg).resize((pg.shape[1] * 3, pg.shape[0] * 3), Image.NEAREST))
        g, _, _ = game_frame(im, K[L], TONE.get(L))
        navy = np.median(pages[L].reshape(-1, 3)[::97], axis=0)
        right = np.concatenate([over(g, navy), np.zeros((g.shape[0], 2, 3), np.uint8), over(g, (150, 156, 150))], 1)
        right = np.asarray(Image.fromarray(right).resize((right.shape[1] * 4, right.shape[0] * 4), Image.NEAREST))
        h = max(left.shape[0], right.shape[0])
        pad = lambda a: np.pad(a, ((0, h - a.shape[0]), (0, 0), (0, 0)), constant_values=20)
        panels.append(np.concatenate([pad(left), np.full((h, 8, 3), 20, np.uint8), pad(right)], 1))
    W = max(p.shape[1] for p in panels)
    Image.fromarray(np.concatenate([np.pad(p, ((0, 8), (0, W - p.shape[1]), (0, 0)), constant_values=20) for p in panels], 0)).save(
        os.path.join(VIS, 'key-proof.png'))
    for name in ('pudding_p2', 'puddingm_p2'):
        facings(name, ROWS)
    # the lineup: a goblin (Small) and a hobgoblin (Medium), the old stand-ins, the pudding (E idle, its pseudopod's blow, its climb at the
    # top), its half, the cube and the troll (Large) -- each on its footprint's floor diamond (Large 2x2: 128x64, Medium 64x32)
    figs = [first('goblin_p2', 'idle', 6), first('hobgoblin_p2', 'idle', 6), first('pudding_p1', 'idle', 6), first('puddingm_p1', 'idle', 6),
            first('pudding_p2', 'idle', 6), first('pudding_p2', 'pseudopod', 6, 3), first('pudding_p2', 'climb', 6, 2),
            first('puddingm_p2', 'idle', 6), first('puddingm_p2', 'idle', 2), first('cube_p2', 'idle', 6), first('troll_p1', 'idle', 6)]
    feet = [(64, 32), (64, 32), (128, 64), (64, 32), (128, 64), (128, 64), (128, 64), (64, 32), (64, 32), (128, 64), (128, 64)]
    strip(figs, os.path.join(VIS, 'lineup.png'), feet=feet)


if __name__ == '__main__':
    if 'probe' in sys.argv[1:]:
        probe()
    else:
        main(check='check' in sys.argv[1:])

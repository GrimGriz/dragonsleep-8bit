"""DEEP16 pipeline 2 (generated art): the art desk's ART-68 -> gnollmatriarch_p1, the Gray Keeping's matriarch-cleric.

    python tools/gnollmatriarch-sheet.py            # deep16/art/gnollmatriarch_p1.png + .json (LOOK below: as drawn, or toned to the tribe's gray)
    python tools/gnollmatriarch-sheet.py check      # also dev/visions/gnollmatriarch/: each page's cut, every facing of every row, a lineup
    python tools/gnollmatriarch-sheet.py drawn|gray <name>   # one look written under another sheet name (the review's candidates)

Source: the art desk's ART-68 (Griz, 2026-10-15: "we'll need some art for the female magic types of Gray Keeping"; then "Art for the
matriarchs in Fresh"), ten pages in deep16/_src/gnollmatriarch/ART-68/ (its MANIFEST.md and SHA256.json; the desk's papers and its cutter notes
in _src/art-desk/received-2026-10-15-ART-68/). She is a new figure, the Snoot battle's death-watch drawn as themselves, every view her own:
    H1P1  SE: portrait and turnaround (Front, Right, Back, Left: the scale's measure, never a row) + Idle 6, Walk 8, Strike 6
    H1P2  SE: Pray 6, Laugh 6, Flinch 4, Fall 6, Prone 2
    H2P1, H2P2  NE (from behind)   H3P1, H3P2  S (the front)   H4P1, H4P2  E (in profile)   H5P1, H5P2  N (from behind)
Facings (RULED 10-14, five drawn views): S, SE, E, NE, N as drawn; SW, W, NW their mirrors. Rows: Idle -> idle, Walk -> walk, Strike -> attack (the
blow lands on frame 4: `release` 3, js/battle.js), Pray -> cast (its pale green ring kept with its frame), Laugh -> cackle (the desk's row map, 10-15: a sheet's `laugh` row plays Hideous
Laughter's fit, js/grimoire.js M.LAUGH's nine poses, and hers is six frames of a standing cackle; how it plays is the Snoot's), Flinch -> flinch, Fall ->
hurt (the death row), Prone -> prone, played 2 then 1 (she lies at its last frame and rises back through it, js/ui.js).
Each page is cut by its own row names and numbers (tools/sheetrows.py), every blob to the row its centre lies in (the rows crowd: a raised staff
reaches the numbers above; tools/mirrorgnoll-sheet.py cut31's way), each row from a strip of the page with every other row's blobs painted the
navy, and every label pixel (the desk's pale lavender, a colour she never has) painted out of its box first, so a letter touching a frame goes.
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
if not os.path.exists(os.path.join(SRC, 'gnollmatriarch')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')
ART68 = os.path.join(SRC, 'gnollmatriarch', 'ART-68')
NAME = 'gnollmatriarch_p1'
NUM = lambda k: [str(i + 1) for i in range(k)]

# per page: its row names' boxes and its rows -- (the page's row, its number strip y0 y1, the numbers' x's), read off the page (the desk's labels
# are a pale lavender: blue over 165 and 12 over red, a colour none of her has). Five numbers sat against a frame or a glow and were read by hand
# (H1P2 Pray 4, H4P1 Walk 1, H5P1 Walk 1, H5P2 Pray 1 and Fall 1), and H5P2's Prone numbers lie low (982-998). H1P1's `turn` row is the
# turnaround, its labels the words Front, Right, Back, Left: cut for the scale only (the portrait above it is boxed out as text).
PAGES = {
    'H1P1': dict(file='ART-68_HEAD-1_PAGE-1.png', names=[(18, 396, 53, 413), (17, 625, 61, 641), (18, 851, 73, 868)], portrait=(0, 0, 470, 285),
                 rows=[('turn', (255, 273), [621, 854, 1100, 1333]),
                       ('idle', (489, 505), [217, 448, 673, 893, 1125, 1348]),
                       ('walk', (719, 735), [152, 343, 526, 695, 877, 1062, 1243, 1426]),
                       ('strike', (961, 977), [203, 448, 671, 920, 1168, 1410])]),
    'H1P2': dict(file='ART-68_HEAD-1_PAGE-2.png', names=[(18, 121, 62, 142), (18, 336, 75, 357), (18, 533, 75, 549), (18, 722, 53, 739), (18, 901, 74, 917)],
                 rows=[('pray', (223, 250), [219, 464, 692, 928, 1180, 1415]),
                       ('laugh', (426, 445), [218, 464, 696, 919, 1170, 1403]),
                       ('flinch', (618, 635), [218, 502, 770, 1034]),
                       ('fall', (809, 826), [176, 388, 619, 840, 1119, 1396]),
                       ('prone', (981, 998), [234, 593])]),
    'H2P1': dict(file='ART-68_HEAD-2_PAGE-1.png', names=[(17, 196, 60, 215), (17, 468, 67, 487), (17, 773, 80, 792)],
                 rows=[('idle', (293, 311), [179, 414, 647, 879, 1122, 1365]),
                       ('walk', (590, 609), [153, 326, 505, 681, 865, 1043, 1213, 1401]),
                       ('strike', (913, 934), [190, 422, 662, 891, 1148, 1370])]),
    'H2P2': dict(file='ART-68_HEAD-2_PAGE-2.png', names=[(18, 143, 59, 164), (18, 362, 73, 383), (18, 559, 73, 576), (18, 730, 50, 747), (18, 909, 72, 925)],
                 rows=[('pray', (233, 253), [189, 428, 656, 891, 1117, 1352]),
                       ('laugh', (447, 464), [189, 432, 660, 892, 1117, 1352]),
                       ('flinch', (638, 654), [189, 431, 661, 892]),
                       ('fall', (821, 838), [177, 398, 619, 856, 1098, 1366]),
                       ('prone', (979, 995), [209, 534])]),
    'H3P1': dict(file='ART-68_HEAD-3_PAGE-1.png', names=[(27, 171, 70, 192), (11, 482, 61, 501), (16, 794, 76, 814)],
                 rows=[('idle', (302, 319), [211, 447, 684, 922, 1166, 1400]),
                       ('walk', (601, 619), [152, 339, 514, 691, 887, 1064, 1257, 1435]),
                       ('strike', (931, 957), [186, 417, 650, 901, 1162, 1408])]),
    'H3P2': dict(file='ART-68_HEAD-3_PAGE-2.png', names=[(31, 136, 77, 158), (25, 354, 82, 375), (26, 538, 82, 555), (32, 723, 67, 740), (27, 901, 82, 917)],
                 rows=[('pray', (234, 255), [244, 479, 701, 924, 1146, 1355]),
                       ('laugh', (440, 460), [201, 451, 685, 923, 1152, 1366]),
                       ('flinch', (627, 645), [241, 503, 754, 1005]),
                       ('fall', (814, 838), [200, 437, 653, 867, 1128, 1396]),
                       ('prone', (984, 1002), [231, 568])]),
    'H4P1': dict(file='ART-68_HEAD-4_PAGE-1.png', names=[(17, 142, 68, 170), (6, 443, 64, 468), (7, 751, 85, 778)],
                 rows=[('idle', (290, 310), [160, 408, 647, 880, 1123, 1360]),
                       ('walk', (593, 613), [126, 310, 489, 677, 875, 1049, 1224, 1408]),
                       ('strike', (914, 934), [168, 430, 652, 891, 1156, 1396])],
                 cut={'strike': [[(811, 842), (811, 902)]]},                     # (Strike 3's skull against Strike 4's back foot)
                 fix={'strike': [((1008, 815, 1062, 892), '4')]}, touch_ok=('strike',)),   # (two of Strike 4's spark lines, nearer 5's foot)
    'H4P2': dict(file='ART-68_HEAD-4_PAGE-2.png', names=[(18, 122, 67, 146), (18, 343, 81, 367), (18, 551, 80, 570), (18, 738, 54, 758), (18, 907, 80, 926)],
                 rows=[('pray', (232, 249), [185, 434, 670, 909, 1145, 1389]),
                       ('laugh', (452, 469), [187, 434, 670, 909, 1157, 1389]),
                       ('flinch', (647, 664), [186, 439, 697, 937]),
                       ('fall', (837, 854), [187, 405, 603, 829, 1097, 1384]),
                       ('prone', (987, 1003), [224, 534])],
                 fix={'fall': [((1222, 772, 1248, 798), '5'), ((1228, 819, 1242, 831), '5')]}, touch_ok=('fall',)),   # (a tick and a chip of Fall 5's)
    'H5P1': dict(file='ART-68_HEAD-5_PAGE-1.png', names=[(20, 164, 58, 184), (13, 476, 63, 495), (16, 810, 76, 829)],
                 rows=[('idle', (275, 293), [167, 397, 637, 867, 1112, 1358]),
                       ('walk', (601, 619), [143, 330, 501, 682, 872, 1051, 1241, 1425]),
                       ('strike', (946, 964), [167, 398, 635, 892, 1142, 1383])]),
    'H5P2': dict(file='ART-68_HEAD-5_PAGE-2.png', names=[(18, 123, 61, 143), (21, 336, 74, 356), (21, 542, 74, 558), (30, 726, 53, 743), (17, 904, 69, 920)],
                 rows=[('pray', (221, 237), [195, 432, 665, 898, 1130, 1362]),
                       ('laugh', (435, 451), [196, 432, 665, 892, 1130, 1362]),
                       ('flinch', (635, 650), [192, 432, 674, 903]),
                       ('fall', (822, 840), [178, 412, 620, 864, 1068, 1355]),
                       ('prone', (982, 998), [199, 526])]),
}
HEADS = {'SE': ('H1P1', 'H1P2'), 'NE': ('H2P1', 'H2P2'), 'S': ('H3P1', 'H3P2'), 'E': ('H4P1', 'H4P2'), 'N': ('H5P1', 'H5P2')}
FACING = {'S': (0,), 'SE': (7, 1), 'E': (6, 2), 'NE': (5, 3), 'N': (4,)}   # deep16/js/sprites.js S.FACINGS: S SW W NW N NE E SE (1-3 drawn mirrored)
ENGINE = {'idle': 'idle', 'walk': 'walk', 'strike': 'attack', 'pray': 'cast', 'laugh': 'cackle', 'flinch': 'flinch', 'fall': 'hurt', 'prone': 'prone'}
PLAY = {'prone': ['2', '1']}                 # (up on the staff, then lying: js/ui.js lies at the last frame and rises back through it)
LOWEST = ('prone',)                          # the row's ground: its lowest point for these, its first frame's feet for the rest (Pray's ring, Strike's
                                             # sparks and a body falling toward the eye reach below where she stood)
FPS = {'idle': 5, 'walk': 10, 'attack': 12, 'cast': 8, 'cackle': 8, 'flinch': 12, 'hurt': 8, 'prone': 8}
RELEASE = {'attack': 3}                      # the blow lands on frame 4 (js/battle.js times a melee row by its release)
FH, AY = 136, 124
# the scale, page px a game px. Her size: Medium, a head taller than the Gray Keeping's gnoll (graykeeping_p2 stands 61-63 px in every view; its
# head about 13): her body on the turnaround (H1P1's Front, Right and Back stills, ears to feet, the staff left out) is 209-213 page px, so the
# turnaround is cut at 2.8 -- she stands 75 px. Each page by its standing figure's filled area against the turnaround's views it sits between,
# sqrt-area (Front 163, Right 142, Back 164; the house's way since the hyena: height lies, she leans on the staff in some views and not others):
# H1P1's Idle 136 against Front and Right's mean 152.5 -> 0.892 of the turnaround's scale; H2P1 178.7 against Right and Back's 153 -> 1.168;
# H3P1 190.2 against Front -> 1.167; H4P1 165.0 against Right -> 1.162; H5P1 165.7 against Back -> 1.010. A page 2 by its standing frames (Laugh 1,
# Flinch 1) against its page 1's Idle: H1P2 1.03, H2P2 0.733, H3P2 0.749, H4P2 0.815, H5P2 0.827 (the desk drew its page 2s smaller, 24 drawings
# to a page against 20, as its notes warned: "Source sprite heights vary materially between pages").
KT = 2.8
_K1 = {'H1P1': 0.892, 'H2P1': 1.168, 'H3P1': 1.167, 'H4P1': 1.162, 'H5P1': 1.010}
_K2 = {'H1P2': 1.03, 'H2P2': 0.733, 'H3P2': 0.749, 'H4P2': 0.815, 'H5P2': 0.827}
KP = {L: KT * r for L, r in _K1.items()}
KP.update({L: KP[L[:3] + '1'] * r for L, r in _K2.items()})
# the colour, page by page, to her first sheet's (H1P1, every later page drawn from it): the medians of her warm browns at game size (saturation
# over 0.2), hue / saturation / value -- H1P1 21.1 / 0.339 / 0.310; H1P2 22.8 / 0.417 / 0.318, H2P1 22.2 / 0.470 / 0.396, H2P2 20.5 / 0.374 /
# 0.373, H3P1 20.0 / 0.394 / 0.333, H3P2 20.8 / 0.439 / 0.318, H4P1 22.2 / 0.444 / 0.361, H4P2 21.8 / 0.414 / 0.361, H5P1 21.1 / 0.375 / 0.380,
# H5P2 20.0 / 0.477 / 0.404: the later pages warmer and brighter. Each page: the hue turned, saturation and value times a factor, to meet H1P1's
TONEP = {'H1P1': (0.0, 1.000, 1.000), 'H1P2': (-1.7, 0.814, 0.975), 'H2P1': (-1.1, 0.721, 0.782), 'H2P2': (0.6, 0.906, 0.832),
         'H3P1': (1.1, 0.861, 0.929), 'H3P2': (0.3, 0.773, 0.975), 'H4P1': (-1.1, 0.764, 0.859), 'H4P2': (-0.7, 0.818, 0.859),
         'H5P1': (0.0, 0.904, 0.814), 'H5P2': (1.1, 0.710, 0.767)}
LOOK = 'gray'                                # RULED 10-15, his pick of the two on the review page: "Toned gray - land the gray matriarch." ('drawn' keeps her grey-brown)


def label_mask(a):
    """the desk's labels: a pale lavender, blue over 165, 12 over red, green over 140"""
    return (a[..., 2] > 165) & (a[..., 2] - a[..., 0] >= 12) & (a[..., 1] > 140)


def cut_page(L, check=False):
    """sheetrows over one ART-68 page -> {row: [(name, RGBA image, box)]}: each blob to the row whose numbers lie below its centre, each row cut
    from a strip of the page with every other row's blobs painted the navy"""
    s = PAGES[L]
    a = np.asarray(Image.open(os.path.join(ART68, s['file'])).convert('RGB')).astype(np.int32)
    H, W = a.shape[:2]
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    text, hand = [(0, y0 - 7, x1 + 14, y1 + 7) for x0, y0, x1, y1 in s['names']], {}
    for row, (sy0, sy1), xs in s['rows']:
        w = 34 if row == 'turn' else 22
        text += [(int(x) - w, sy0 - 6, int(x) + w, sy1 + 7) for x in xs]
    lm = label_mask(a)
    for x0, y0, x1, y1 in text:                     # a label's letters painted out first, so one touching a frame leaves it
        sub = lm[y0:y1, x0:x1]
        a[y0:y1, x0:x1][ndimage.binary_dilation(sub, iterations=1)] = navy.astype(np.int32)
    if 'portrait' in s:
        text.append(s['portrait'])
    m = SR.figure_mask(a)
    SR.drop_text(m, text)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    cy = np.array([c[0] for c in ndimage.center_of_mass(m, lab, range(1, n + 1))])
    owner = np.searchsorted([sy1 for _, (_, sy1), _ in s['rows']], cy)
    orig = SR.label_xs
    SR.label_xs = lambda a_, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a_, x0, x1, y0, y1)
    out, over = {}, (a * 0.25).astype(np.uint8) if check else None
    try:
        for k, (row, (sy0, sy1), xs) in enumerate(s['rows']):
            mine = np.isin(lab, 1 + np.where(owner == k)[0])
            b = a.copy()
            b[m & ~mine] = navy
            ys = np.where(mine.any(1))[0]
            Y0, Y1 = max(0, min(ys[0], sy0) - 8), min(H, max(ys[-1], sy1) + 8)
            buf = io.BytesIO(); Image.fromarray(b[Y0:Y1].astype(np.uint8)).save(buf, 'PNG'); buf.seek(0)
            hand[(0, sy0 - Y0)] = xs
            spec = dict(text=[(t[0], t[1] - Y0, t[2], t[3] - Y0) for t in text], rows=[(row, (0, 0, W, Y1 - Y0), (sy0 - Y0, sy1 - Y0), NUM(len(xs)))])
            fix = {row: [((x0, y0 - Y0, x1, y1 - Y0), to) for (x0, y0, x1, y1), to in s.get('fix', {}).get(row, ())]}
            o = [] if check else None
            cuts = {r: [[(x, y - Y0) for x, y in line] for line in lines] for r, lines in s.get('cut', {}).items()}
            got = SR.cut_sheet(buf, spec, fix=fix, cuts=cuts, touch_ok=s.get('touch_ok', ()), overlay=o, tag=L)
            out.update({r: [(nm, im, (bx[0], bx[1] + Y0, bx[2], bx[3] + Y0)) for nm, im, bx in frs] for r, frs in got.items()})
            if check:
                over[Y0:Y1][mine[Y0:Y1]] = np.asarray(o[0])[mine[Y0:Y1]]
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'gnollmatriarch'); os.makedirs(d, exist_ok=True)
        Image.fromarray(over).save(os.path.join(d, 'cut-%s.png' % L))
    return out


def hsv(im):
    a = np.asarray(im).astype(float)
    rgb = a[..., :3] / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = (np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60) % 360
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


def toned(im, t, gray=False):
    """an RGBA cut in HSV: its hue turned t[0] degrees, its saturation times t[1], its value times t[2]; `gray`, then her warm browns (the pelts, the
    fur, the hide, the staff's wood) toward the Gray Keeping's gray (GRAY), her bone and teeth (pale) and Pray's green light left as they are"""
    a, h, s, v = hsv(im)
    h = (h + t[0]) % 360
    s = np.clip(s * t[1], 0, 1)
    v = np.clip(v * t[2], 0, 1)
    if gray:
        warm = ((h < 60) | (h > 330)) & ~((v > GRAY['bone_v']) & (s < GRAY['bone_s']))
        s = np.where(warm, s * GRAY['fur'], s)
        v = np.where(warm, v * GRAY['dim'], v)
    return from_hsv(a, h, s, v)


GRAY = {'fur': 0.35, 'dim': 0.95, 'bone_v': 0.62, 'bone_s': 0.42}   # the tribe's gray (tools/gnoll-sheet.py gray_cloth keeps the gnoll's fur at 0.25 of
                                                                    # its saturation; her pelts a little warmer, as the desk drew them grey-brown)


def _unblue_map():
    """the palette's blue and slate (its blue ramp, its silver ramp but the two lightest) -> the nearest, in Lab, of its neutral and warm darks
    (tools/gnoll-sheet.py's: the Gray Keeping's sheets hold no blue)"""
    pal = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json')))['ramps']
    hx = lambda c: tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))
    src = [hx(c) for c in pal['blue'] + pal['silver'][:5]]
    dst = [hx(c) for c in pal['outline'] + pal['stone'] + ['#6e6a66'] + pal['bone']]
    lab = lambda cs: pix.to_lab(np.array(cs, np.float32).reshape(1, -1, 3) / 255)[0]
    ls, ld = lab(src), lab(dst)
    return {s: dst[int(np.argmin(((ld - l) ** 2).sum(-1)))] for s, l in zip(src, ls)}


UNBLUE = None


def unblue(a):
    global UNBLUE
    if UNBLUE is None:
        UNBLUE = _unblue_map()
    out = a.copy()
    for s_, d_ in UNBLUE.items():
        m = (a[..., 3] > 0) & (a[..., :3] == np.array(s_, np.uint8)).all(-1)
        out[m, :3] = d_
    return out


def game_size(img, k):
    w, h = img.size
    return img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')


def core_x(a):
    """x of the body's thick middle (the staff and the limbs are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def place(a, x_ref, up, fw, ax):
    """a 1x RGBA array onto an fw x FH frame: x_ref at ax, the lowest opaque row `up` px above AY"""
    out = np.zeros((FH, fw, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


def views(look, check=False):
    """{view: {sheet row: [(1x RGBA array, its core x, px above the ground)]}}, each page at its own scale (KP) and tone (TONEP)"""
    gray = look == 'gray'
    out = {v: {} for v in HEADS}
    for v, pages in HEADS.items():
        for L in pages:
            k, t = KP[L], TONEP[L]
            for row, frs in cut_page(L, check).items():
                if row == 'turn':
                    continue
                floor = max(b[3] for _, _, b in frs) if row in LOWEST else frs[0][2][3]
                if row in PLAY:
                    frs = [next(f for f in frs if f[0] == nm) for nm in PLAY[row]]
                seq = []
                for nm, im, box in frs:
                    a = pix.pixelate(game_size(toned(im, t, gray), k), 1, do_lift=False)
                    if gray:
                        a = unblue(a)
                    seq.append((a, core_x(a), int(round((floor - box[3]) / k))))
                out[v][ENGINE[row]] = seq
    return out


def build(look=LOOK, name=NAME, check=False):
    hd = views(look, check)
    frames, sizes, lost = {}, {}, []
    for eng in ENGINE.values():
        per = [None] * 8
        for v, fs in FACING.items():
            for f in fs:
                per[f] = hd[v][eng]
        counts = {len(p) for p in per}
        if len(counts) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, sorted(counts)))
        half = max(max(cx, a.shape[1] - cx) for fs in per for a, cx, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, fs in enumerate(per):
            row = []
            for a, cx, up in fs:
                if f in (1, 2, 3):
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, fw // 2)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    if 'cackle' not in pix.ANIM_ORDER:               # (named here, not in pixelate.py: this cutter's own row, as tools/gnoll-sheet.py names its laugh)
        pix.ANIM_ORDER.append('cackle')
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    for row, k in RELEASE.items():
        meta['anims'][row]['release'] = k
    meta['source'] = ('drawn by the art desk (2026-10-15, ART-68: every row in all five views), cut and snapped by tools/gnollmatriarch-sheet.py'
                      + (', toned to the Gray Keeping\'s gray' if look == 'gray' else ', her colours as drawn'))
    json.dump(meta, open(meta_p, 'w'), indent=1)
    return name


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(name=NAME):
    """dev/visions/gnollmatriarch/facings-<sheet>-<row>.png: every facing of every row as written, S SW W NW N NE E SE top to bottom, 2x on a gray
    floor (the foot's line drawn); lineup-<sheet>.png: idle frame 1 in all eight facings beside the Gray Keeping's gnoll, 4x"""
    d = os.path.join(ROOT, 'dev', 'visions', 'gnollmatriarch'); os.makedirs(d, exist_ok=True)
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
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s-%s.png' % (name, row)))
    an = m['anims']['idle']
    fw, fh, y, ay = an.get('fw', m['fw']), an.get('fh', m['fh']), an['y'], an.get('ay', m['ay'])
    g = json.load(open(os.path.join(ROOT, 'deep16', 'art', 'graykeeping_p2.json')))
    gi = Image.open(os.path.join(ROOT, 'deep16', 'art', 'graykeeping_p2.png')).convert('RGBA')
    ga = g['anims']['idle']
    gfw, gfh, gy, gay = ga.get('fw', g['fw']), ga.get('fh', g['fh']), ga['y'], ga.get('ay', g['ay'])
    top = max(ay, gay)
    cv = Image.new('RGBA', (fw * 8 + gfw * 2, top + 16), (70, 74, 70, 255))
    for f in range(8):
        cv.alpha_composite(im.crop((0, y + f * fh, fw, y + f * fh + ay + 12)), (f * fw, top - ay))
    for j, f in enumerate((0, 6)):
        cv.alpha_composite(gi.crop((0, gy + f * gfh, gfw, gy + f * gfh + gay + 12)), (8 * fw + j * gfw, top - gay))
    ImageDraw.Draw(cv).line([(0, top + 1), (cv.width, top + 1)], fill=(200, 60, 60, 255))
    cv.resize((cv.width * 4, cv.height * 4), Image.NEAREST).save(os.path.join(d, 'lineup-%s.png' % name))
    print('  wrote', d)


if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] in ('drawn', 'gray'):
        n = build(args[0], args[1] if len(args) > 1 else NAME, check=False)
        facings(n)
    else:
        build(check='check' in args)
        if 'check' in args:
            facings()

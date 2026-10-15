"""DEEP16 pipeline 2 (generated art): Griz's generated gnoll sheets -> two palette sprite sheets, the gnoll and the glory-seeker.

    python tools/gnoll-sheet.py           (writes deep16/art/gnoll_p2 and gloryseeker_p2, .png and .json)
    python tools/gnoll-sheet.py check     (also the cut overlays, dev/visions/gnoll/cut-<page>.png, every facing of every row,
                                           facings-<sheet>-<row>.png, and the lineup of a row's turns and changes, lineup-<sheet>.png)

Source: deep16/_src/gnoll_grok_1.png and gnoll_grok_2.webp (Griz, 2026-09-28, generated; "Hilly Tribe"). Page 1: a turnaround
(front, right, back, left) and rows facing right: idle 8 (a three-quarter view), walk 8, run 8, attack 8 (the spear), hurt 6,
death 7. Page 2: idle variations seen from the front, sit, climb, jump, fall, a second hurt, a thrown spear, emotes, and four
back views. RULED 09-28 (Griz): the gnolls in the Hills' blue cloth as drawn, the Snoot's glory-seekers in the Desert tribe's
red ("blue and red as above is good"); no boss versions yet.
Facings till ART-29: the side rows took the six sideways facings (mirrored for the west side); page 2's front idle took S, its back
views N. The death row plays as `hurt` (the engine plays it once when a creature goes down), as the chuul's and the crawler's do.
Each group of rows is scaled by its own standing height, so every figure stands the same height (a gnoll is 7 ft and more:
a head over the humans' ~50 px). The frames are found by a component pass inside each row's band (the numbers and the panel
rules dropped by their size), and each is placed on its torso, so the tail and the spear swing without moving the body.

ART-29 (2026-10-15, the art desk's five views for the gnoll -- RULED 10-14, a figure is five drawn views, SE mirroring to SW, E to W, NE
to NW): seven pages, 144 drawings, in deep16/_src/gnoll/ART-29/ (its ART-29-MANIFEST.md; the art desk's papers in
_src/art-desk/received-2026-10-15-ART-29/). Its Death plays as `hurt`, Prone as `prone` (it lies at the last frame), Get Up as `getup`,
Laugh as `laugh` -- the same nine poses as the old bank in the same order (the art desk drew them from it), so grimoire.js M.LAUGH's
order stands:
  H1P1  ART-29_HEAD-1_PAGE-1.png  SE: Walk 8
  H2P1  ART-29_HEAD-2_PAGE-1.png  NE: Idle 8, Walk 8, Attack 8
  H2P2  ART-29_HEAD-2_PAGE-2.png  NE: Death 7, Prone 2, Get Up 6, Laugh 9
  H3P1  ART-29_HEAD-3_PAGE-1.png  S:  the rows of H2P2
  H4P1  ART-29_HEAD-4_PAGE-1.png  E:  Idle 8, Attack 8
  H4P2  ART-29_HEAD-4_PAGE-2.png  E:  the rows of H2P2
  H5P1  ART-29_HEAD-5_PAGE-1.png  N:  the rows of H2P2
By the manifest the old rows stay where they were drawn: SE (and SW) keep the old three-quarter idle, attack, death, prone, get up and
laugh; E (and W) the old side walk; S and N the old front still's and back views' idle, walk and attack. Every other facing of every
row is ART-29's (build() prints which view each facing plays). The pages are cut by their labels (sheetrows, the CHAN test), scaled
each by its standing rows (K, in build()), toned to the old page 1's fur and cloth (TONE, in build()), and placed as the old rows are.
"""
import os, sys, json, subprocess
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)
spec = importlib.util.spec_from_file_location('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))
SR = importlib.util.module_from_spec(spec); spec.loader.exec_module(SR)

SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'gnoll_grok_1.png')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')


def load(name):
    a = np.asarray(Image.open(os.path.join(SRC, name)).convert('RGB')).astype(np.int32)
    vals, cnt = np.unique(a.reshape(-1, 3) // 4, axis=0, return_counts=True)
    return a, vals[np.argmax(cnt)] * 4 + 2                # the ground: the commonest colour


P1, BG1 = load('gnoll_grok_1.png')
P2, BG2 = load('gnoll_grok_2.webp')
FW, FH, AX, AY = 120, 96, 60, 86
HEIGHT = {'gnoll_p2': 60, 'gloryseeker_p2': 64}     # standing, in px: the Snoot's young blood a size bigger (CR 1, STR 16)

# the rows' bands (x0, y0, x1, y1) and how many frames each holds
B1 = {'front': ((195, 105, 290, 298), 1), 'back': ((428, 105, 525, 298), 1),
      'idle': ((100, 340, 1140, 470), 8), 'walk': ((100, 485, 1140, 612), 8), 'attack': ((100, 770, 1140, 912), 8),
      'death': ((100, 1040, 840, 1162), 7)}
B2 = {'front': ((20, 105, 120, 252), 1), 'back': ((700, 1062, 900, 1172), 3),   # (the fourth back view is the Desert tribe's)
      # 10-02: the idle variations (the 6th, the yawn), Sit / Rest and Fall / Get Up -- the laugh's poses and the prone row
      'idlevar': ((20, 105, 640, 252), 6), 'sit': ((125, 298, 1290, 386), 8), 'fall': ((130, 680, 1290, 754), 8)}

# ART-29 (10-15): the art desk's five views, cut by their own row and number labels (tools/sheetrows.py; the boxes read off the pages by
# their figures' and labels' blobs): per page its text boxes (the row names) and its rows -- (row, band x0 y0 x1 y1, the number strip
# y0 y1, the numbers). The pages are drawn tight, a figure's paws reaching its numbers' tops and a tall one (Get Up 6, Laugh 1) above the
# row's top: so each band takes the whole figure, every number in it is dropped as text (NUMS, by the strip's own label x's), and the
# prone rows' bands stop at x 700 (two frames; Get Up 6 stands over their strip further right). CLEAR: a box blanked to the navy for one
# row's cut -- the row above's figure dipping into it.
NUM = lambda k: [str(i + 1) for i in range(k)]
CHAN = 16     # figure: any channel 17 or more off the navy (the default test keeps the cloth's darks, blue 30-45 over red, as navy; the page's
              # own navy varies 5-12 at most, the feet's drop shadow 8-16, the outline 24 and more)
A29 = os.path.join('gnoll', 'ART-29')
ART29 = {
    'H1P1': dict(file=os.path.join(A29, 'ART-29_HEAD-1_PAGE-1.png'), text=[(0, 340, 150, 390)],
                 rows=[('walk', (150, 200, 2079, 532), (533, 570), NUM(8))]),
    'H2P1': dict(file=os.path.join(A29, 'ART-29_HEAD-2_PAGE-1.png'), text=[(0, 140, 105, 176), (0, 428, 112, 462), (0, 705, 136, 740)],
                 rows=[('idle', (0, 140, 1536, 377), (378, 402), NUM(8)),
                       ('walk', (0, 404, 1536, 652), (653, 677), NUM(8)),
                       ('attack', (0, 680, 1536, 950), (951, 980), NUM(8))]),
    'H2P2': dict(file=os.path.join(A29, 'ART-29_HEAD-2_PAGE-2.png'), text=[(0, 55, 110, 90), (0, 260, 112, 295), (0, 440, 122, 482), (0, 618, 112, 656)],
                 rows=[('death', (0, 20, 1855, 230), (226, 252), NUM(7)),
                       ('prone', (0, 254, 700, 422), (410, 435), NUM(2)),
                       ('getup', (0, 412, 1855, 592), (588, 612), NUM(6)),
                       ('laugh', (0, 611, 1855, 792), (790, 815), NUM(9))],
                 clear={'getup': [(380, 412, 612, 421)]}),                   # Prone 2's back, its lowest rows
    'H3P1': dict(file=os.path.join(A29, 'ART-29_HEAD-3_PAGE-1.png'), text=[(0, 14, 176, 52), (0, 282, 176, 316), (0, 476, 182, 515), (0, 658, 178, 695)],
                 rows=[('death', (0, 10, 1791, 252), (244, 272), NUM(7)),
                       ('prone', (0, 274, 700, 456), (455, 482), NUM(2)),
                       ('getup', (180, 470, 1791, 645), (645, 674), NUM(6)),     # (x from 180: its numbers' strip runs into the Laugh label)
                       ('laugh', (0, 676, 1791, 847), (843, 868), NUM(9))]),
    'H4P1': dict(file=os.path.join(A29, 'ART-29_HEAD-4_PAGE-1.png'), text=[(0, 160, 112, 200), (0, 476, 147, 515)],
                 rows=[('idle', (0, 110, 1983, 380), (386, 417), NUM(8)),
                       ('attack', (0, 420, 1983, 708), (712, 744), NUM(8))]),
    'H4P2': dict(file=os.path.join(A29, 'ART-29_HEAD-4_PAGE-2.png'), text=[(0, 22, 112, 56), (0, 260, 112, 293), (0, 455, 122, 495), (0, 650, 110, 688)],
                 rows=[('death', (0, 15, 1774, 216), (220, 246), NUM(7)),
                       ('prone', (0, 250, 700, 423), (428, 453), NUM(2)),
                       ('getup', (0, 438, 1774, 620), (624, 650), NUM(6)),
                       ('laugh', (0, 650, 1774, 828), (832, 858), NUM(9))]),
    'H5P1': dict(file=os.path.join(A29, 'ART-29_HEAD-5_PAGE-1.png'), text=[(0, 45, 105, 80), (0, 250, 108, 282), (0, 444, 112, 480), (0, 620, 104, 656)],
                 rows=[('death', (0, 10, 1855, 204), (203, 227), NUM(7)),
                       ('prone', (0, 230, 700, 398), (398, 422), NUM(2)),
                       ('getup', (0, 412, 1855, 590), (586, 611), NUM(6)),
                       ('laugh', (0, 610, 1855, 803), (800, 826), NUM(9))]),
}
FIT29 = {('H3P1', 'death')}     # (a row scaled apart from its page: build())
# a line of pixels cleared (sheetrows' CUT): the E page's Laugh 8 lies with its sole against Laugh 9's toes (x 1530-1531, y 800-818)
CUT29 = {'H4P2': {'laugh': [[(1531, 799), (1531, 820)]]}}


def cut29(L, check=False):
    """sheetrows over one ART-29 page -> {row: [(name, RGBA image, box)]}; every number dropped as text; a CLEAR row cut from a copy of
    the page with its boxes painted the navy"""
    import io
    s = ART29[L]
    path = os.path.join(SRC, s['file'])
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
    nums = [(int(x) - 14, sy0 - 3, int(x) + 14, sy1 + 4) for _, (x0, _, x1, _), (sy0, sy1), _ in s['rows'] for x in SR.label_xs(a, x0, x1, sy0, sy1)]
    pad = lambda b: (b[0], b[1] - 4, b[2] + 4, b[3] + 5)          # (a label's drop shadow is figure to CHAN: the boxes a few px wider)
    spec = dict(text=[pad(b) for b in s['text']] + nums, rows=s['rows'], chan=CHAN)
    over = [] if check else None
    out = SR.cut_sheet(path, spec, only=[r[0] for r in s['rows'] if r[0] not in s.get('clear', {})], cuts=CUT29.get(L), overlay=over, tag=L)
    for row, boxes in s.get('clear', {}).items():
        b = a.copy()
        navy = np.median(a.reshape(-1, 3)[::97], axis=0)
        for x0, y0, x1, y1 in boxes:
            b[y0:y1, x0:x1] = navy
        buf = io.BytesIO(); Image.fromarray(b.astype(np.uint8)).save(buf, 'PNG'); buf.seek(0)
        o2 = [] if check else None
        out.update(SR.cut_sheet(buf, spec, only=[row], cuts=CUT29.get(L), overlay=o2, tag=L + ' ' + row))
        if check:
            over.append(o2[0])
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'gnoll'); os.makedirs(d, exist_ok=True)
        for i, im in enumerate(over):
            im.save(os.path.join(d, 'cut-%s%s.png' % (L, '' if i == 0 else '-' + list(s['clear'])[i - 1])))
        for row, band, _, _ in s['rows']:                  # a frame whose box reaches its band's edge may have been clipped there
            for nm, im, box in out[row]:
                if box[1] + 2 <= band[1] or box[3] - 2 >= band[3] or box[0] + 2 <= band[0] or box[2] - 2 >= band[2]:
                    print('  near the band edge: %s %s %s box %s band %s' % (L, row, nm, box, band))
    return out


def frames_in(sheet, bg, band, n):
    """the n figures in a row's band, left to right: (cut RGBA image, its standing height)."""
    x0, y0, x1, y1 = band
    c = sheet[y0:y1, x0:x1]
    m = np.abs(c - bg).sum(-1) > 45
    m = ndimage.binary_closing(m, iterations=2)
    lab, k = ndimage.label(m)
    comps = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        area = int((lab[sl] == i + 1).sum())
        if area < 300 or w > 190 or (h < 14 and w > 60) or (h < 20 and area < 700):  # a number, a title's word, a panel's rule
            continue
        comps.append({'id': i + 1, 'x0': sl[1].start, 'x1': sl[1].stop, 'area': area})
    # pieces that share columns are one figure (a spear held clear of the body)
    comps.sort(key=lambda d: d['x0'])
    groups = []
    for d in comps:
        if groups and d['x0'] <= groups[-1]['x1'] + 6:
            g = groups[-1]; g['ids'].append(d['id']); g['x1'] = max(g['x1'], d['x1']); g['area'] += d['area']
        else:
            groups.append({'ids': [d['id']], 'x0': d['x0'], 'x1': d['x1'], 'area': d['area']})
    groups = sorted(sorted(groups, key=lambda g: -g['area'])[:n], key=lambda g: g['x0'])
    assert len(groups) == n, (band, len(groups))
    out = []
    for g in groups:
        mm = np.isin(lab, g['ids'])
        mm = ndimage.binary_fill_holes(mm)
        ys, xs = np.where(mm)
        cc = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        am = mm[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        out.append(Image.fromarray(np.dstack([cc.astype(np.uint8), (am * 255).astype(np.uint8)]), 'RGBA'))
    return out


def red_cloth(img):
    """the Hills' blue cloth to the Desert tribe's red (the sheet's own tribe panel): only the blue, the beads and hide kept."""
    a = np.asarray(img, dtype=np.float32) / 255
    rgb = a[..., :3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn + 1e-6
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = (mx - mn) / (mx + 1e-6)
    blue = (h > 195) & (h < 250) & (s > 0.22)
    v = mx
    # a deep madder red at the cloth's own value (a touch warmer in the lights)
    red = np.stack([v, v * (0.16 + 0.1 * v), v * (0.14 + 0.06 * v)], -1) * np.array([1.0, 1.0, 1.0])
    rgb2 = np.where(blue[..., None], np.clip(red * 1.08, 0, 1), rgb)
    return Image.fromarray(np.dstack([(rgb2 * 255).astype(np.uint8), (a[..., 3] * 255).astype(np.uint8)]), 'RGBA')


def hsv(img):
    """an RGBA image -> (rgb 0-1, hue in degrees, saturation, value, alpha)"""
    a = np.asarray(img, dtype=np.float32) / 255
    rgb = a[..., :3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn + 1e-6
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return rgb, h, (mx - mn) / (mx + 1e-6), mx, a[..., 3]


def classes(img):
    """the fur (the tawny browns and the spots) and the cloth (red_cloth's blue), each a mask"""
    rgb, h, s, v, al = hsv(img)
    on = al > 0.5
    return on & (h < 50) & (s > 0.15) & (v > 0.12), on & (h > 195) & (h < 250) & (s > 0.22) & (v > 0.25)


def sv_means(imgs):
    """the fur's and the cloth's mean saturation and value over some frames: ((fur s, v), (cloth s, v))"""
    acc = [[], []]
    for im in imgs:
        _, _, s, v, _ = hsv(im)
        for k, m in enumerate(classes(im)):
            acc[k].append(np.stack([s[m], v[m]], -1))
    return tuple(tuple(np.concatenate(x).mean(0)) for x in acc)


def toned(img, t):
    """the fur's and the cloth's saturation and value times t ((fur s, v), (cloth s, v)), at their own hue; beads, eyes, outline left be"""
    rgb, h, s, v, al = hsv(img)
    for m, (fs, fv) in zip(classes(img), t):
        s2, v2 = np.clip(s * fs, 0, 1), np.clip(v * fv, 0, 1)
        hh = (h / 60) % 6; c = v2 * s2; x = c * (1 - np.abs(hh % 2 - 1)); z = np.zeros_like(c)
        i = np.floor(hh).astype(int)
        out = np.select([(i == k)[..., None] for k in range(6)], [np.stack(q, -1) for q in ((c, x, z), (x, c, z), (z, c, x), (z, x, c), (x, z, c), (c, z, x))])
        rgb = np.where(m[..., None], out + (v2 - c)[..., None], rgb)
    return Image.fromarray(np.dstack([(np.clip(rgb, 0, 1) * 255).round().astype(np.uint8), (al * 255).round().astype(np.uint8)]), 'RGBA')


def fit(img, scale, recolour, tone=None):
    if tone:
        img = toned(img, tone)
    if recolour:
        img = recolour(img)
    w, h = img.size
    img = img.resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX)
    return pix.pixelate(img, 1, do_lift=False)


def torso_x(a):
    """the middle of the body: the median opaque column over the torso's rows (a spear, a tail and a raised arm are thin)."""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 25 // 100: top + (bot - top) * 65 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def place(a, x_ref, dy=0):
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    rows = np.where(a[..., 3].any(axis=1))[0]
    ox, oy = int(round(AX - x_ref)), AY - rows[-1] + dy
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def breathe(fr):
    """the chest rises a pixel (the legs stay put)."""
    o = fr.copy()
    rows = np.where(fr[..., 3].any(axis=1))[0]
    mid = rows[0] + (rows[-1] - rows[0]) * 6 // 10
    o[rows[0] - 1:mid] = fr[rows[0]:mid + 1]
    return o


def hgt(im):
    """a cut frame's height, its opaque rows (sheetrows pads the box with 2 clear px)"""
    rows = np.where(np.asarray(im)[..., 3].any(axis=1))[0]
    return int(rows[-1] - rows[0] + 1)


_CUTS29 = {}
def cuts29():
    """ART-29's pages cut, once for both sheets"""
    if not _CUTS29:
        _CUTS29.update({L: cut29(L, CHECK) for L in ART29})
    return _CUTS29


def build(name, recolour):
    H = HEIGHT[name]
    rows1 = {k: frames_in(P1, BG1, *v) for k, v in B1.items()}
    rows2 = {k: frames_in(P2, BG2, *v) for k, v in B2.items()}
    stand1 = np.mean([im.size[1] for im in rows1['idle']]) / H        # page 1's rows, by the idle row's height
    stand2f = rows2['front'][0].size[1] / H                           # page 2's front idle
    stand2b = np.mean([im.size[1] for im in rows2['back']]) / H       # page 2's back views (drawn smaller)
    side = lambda ims: [place(a, torso_x(a)) for a in (fit(im, stand1, recolour) for im in ims)]
    idle_r, walk_r, atk_r, death_r = side(rows1['idle']), side(rows1['walk']), side(rows1['attack']), side(rows1['death'])
    front = fit(rows2['front'][0], stand2f, recolour)
    fS = place(front, torso_x(front))
    backs = [fit(im, stand2b, recolour) for im in rows2['back']]
    fN = [place(a, torso_x(a)) for a in backs]
    mirror = lambda seq: [fr[:, ::-1].copy() for fr in seq]
    idle_l, walk_l, atk_l, death_l = mirror(idle_r), mirror(walk_r), mirror(atk_r), mirror(death_r)
    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)

    # the laugh (RULED 10-02, Griz: "I'd play 'yawn' (idle variation 6) when the laugh sound fires, then like sit/rest 2, 1, 3, 8 .. 3 to fall/getup 1,
    # 2, 4, 2, - 5, sit/rest 8, fall/getup 5, sit/rest 8"): the row holds each pose once -- 0 the yawn, 1-4 sit 2, 1, 3, 8, 5-8 fall 1, 2, 4, 5 -- and
    # deep16/js/grimoire.js M.LAUGH plays them in his order, each held its own beats. Prone (deep16/js/sprites.js S.proneRow: falls through the row, lies
    # at its last frame): Fall / Get Up 1, 2 -- knocked over onto its back (RULED 10-02, Griz: "yes", to falling over rather than sinking to its hands);
    # and up again by the sheet's own get-up, 3 to 8, played forward (the `getup` row: deep16/js/ui.js). Page 2's rows at its front idle's scale
    p2 = lambda ims: [place(a, torso_x(a)) for a in (fit(im, stand2f, recolour) for im in ims)]
    idv, sit, fall = p2(rows2['idlevar']), p2(rows2['sit']), p2(rows2['fall'])
    laugh_r = [idv[5], sit[1], sit[0], sit[2], sit[7], fall[0], fall[1], fall[3], fall[4]]
    prone_r, getup_r = [fall[0], fall[1]], fall[2:8]
    laugh_l, prone_l, getup_l = mirror(laugh_r), mirror(prone_r), mirror(getup_r)

    # ART-29 (10-15): every page at its own scale (GPT drew each at its own size), the gnoll the old rows' way -- on its torso, its lowest pixel on
    # the floor line. A page 1 by its standing rows: HEAD 2's and HEAD 4's idle the idle's height; HEAD 1's walk the old side walk's (the walk it
    # turns to at E and W). A page 2 (Death, Prone, Get Up, Laugh) by its Get Up 6, the gnoll stood up again, as tall as the idle it rises into.
    cuts = cuts29()
    walk_h = np.mean([im.size[1] for im in rows1['walk']]) / stand1        # the old side walk at game size
    K = {L: float(np.mean([hgt(im) for _, im, _ in cuts[L]['walk']])) / walk_h if L == 'H1P1' else
            float(np.median([hgt(im) for _, im, _ in cuts[L]['idle']])) / H if 'idle' in cuts[L] else hgt(cuts[L]['getup'][5][1]) / H for L in ART29}
    # FIT29: a row GPT drew bigger than its page -- HEAD 3's Death: its Death 1 stands 1.18 of its Get Up 6, the other views' 1.03-1.07 (and its
    # head, ear to ear, a tenth wider than Get Up 6's): scaled so that ratio is theirs
    r = lambda L: hgt(cuts[L]['death'][0][1]) / hgt(cuts[L]['getup'][5][1])
    KR = {(L, row): K[L] * r(L) / float(np.mean([r(M) for M in ART29 if 'getup' in cuts[M] and (M, row) not in FIT29])) for L, row in FIT29}
    # the colour: GPT drew ART-29 warmer and brighter than the old sheets (the fur's saturation 0.49-0.54 to 0.40, its value 0.41-0.47 to 0.36, at
    # game size), so a turn from the old SE rows to the new E or NE ones flushed it; each page's fur and cloth brought to the old page 1's (the
    # rows it turns among: SE, SW, E's and W's walk) by saturation and value, at their own hue -- the GreyFang seat's way (10-14: a per-channel
    # gain moves the fur's hue too)
    ref = sv_means(rows1['idle'] + rows1['walk'] + rows1['attack'] + rows1['death'])
    TONE = {}
    for L in ART29:
        got_ = sv_means([im for frs in cuts[L].values() for _, im, _ in frs])
        TONE[L] = tuple((ref[k][0] / got_[k][0], ref[k][1] / got_[k][1]) for k in (0, 1))
    print('  %s tone (fur s v, cloth s v), to page 1 fur %.2f %.2f cloth %.2f %.2f: %s' % ((name,) + ref[0] + ref[1] + (', '.join(
        '%s %.2f %.2f %.2f %.2f' % ((L,) + TONE[L][0] + TONE[L][1]) for L in ART29),)))
    new = {(L, row): [place(a, torso_x(a)) for a in (fit(im, KR.get((L, row), K[L]), recolour, TONE[L]) for _, im, _ in frs)]
           for L in ART29 for row, frs in cuts[L].items()}
    print('  %s ART-29 scales (page px a game px): %s; %s' % (name, ', '.join('%s %.3f' % (L, K[L]) for L in ART29),
                                                            ', '.join('%s %s %.3f' % (L, row, k) for (L, row), k in KR.items())))
    late = lambda L: {'hurt': L, 'prone': L, 'getup': L, 'laugh': L}           # a page 2's rows (its Death plays as `hurt`)
    view = {'HEAD1': {'walk': 'H1P1'}, 'HEAD2': dict(late('H2P2'), idle='H2P1', walk='H2P1', attack='H2P1'), 'HEAD3': late('H3P1'),
            'HEAD4': dict(late('H4P2'), idle='H4P1', attack='H4P1'), 'HEAD5': late('H5P1')}
    got = lambda v, row: new[(view[v][row], 'death' if row == 'hurt' else row)]
    old = {'idle': (idle_r, idle_l), 'walk': (walk_r, walk_l), 'attack': (atk_r, atk_l), 'hurt': (death_r, death_l),
           'laugh': (laugh_r, laugh_l), 'prone': (prone_r, prone_l), 'getup': (getup_r, getup_l)}

    # the facings (S, SW, W, NW, N, NE, E, SE), RULED 10-14 (a figure is five drawn views; SE mirrors to SW, E to W, NE to NW), by ART-29's manifest:
    # S its front (the old front still's idle, walk and attack; HEAD 3's Death, Prone, Get Up, Laugh), SE the old three-quarter rows but the Walk
    # (HEAD 1's), E the old Walk and HEAD 4's every other row, NE HEAD 2's every row, N its back (the old back views' idle, walk and attack; HEAD 5's rest)
    frames = {'idle': [], 'walk': [], 'attack': [], 'hurt': [], 'laugh': [], 'prone': [], 'getup': []}
    took = {r: [] for r in frames}
    for f in range(8):
        west = f in (1, 2, 3)
        for row in frames:
            if f == 0 and row in ('idle', 'walk', 'attack'):
                seq, src = {'idle': [fS] * 4 + [breathe(fS)] * 4, 'walk': [shift(fS, 0, -(i % 2)) for i in range(8)],
                            'attack': [fS, fS, shift(fS, 0, 1), shift(fS, 0, 3), shift(fS, 0, 4), shift(fS, 0, 3), shift(fS, 0, 1), fS]}[row], 'front'
            elif f == 4 and row in ('idle', 'walk', 'attack'):
                loop = [fN[0], fN[1], fN[2], fN[1]]
                seq, src = {'idle': [x for x in loop for _ in (0, 1)], 'walk': [shift(loop[i % 4], 0, -(i % 2)) for i in range(8)],
                            'attack': [fN[0], fN[0], shift(fN[0], 0, -1), shift(fN[0], 0, -3), shift(fN[0], 0, -4), shift(fN[0], 0, -3), shift(fN[0], 0, -1), fN[0]]}[row], 'back'
            else:
                v = {0: 'HEAD3', 4: 'HEAD5', 1: 'HEAD1', 7: 'HEAD1', 3: 'HEAD2', 5: 'HEAD2', 2: 'HEAD4', 6: 'HEAD4'}[f]
                if row in view[v]:
                    seq, src = got(v, row), v
                else:                                    # the old rows: SE's three-quarter, E's side walk
                    seq, src = old[row][0], 'old'
                if west:
                    seq, src = mirror(seq), src + 'm'
            frames[row].append(seq); took[row].append(src)
    print('  facings (S SW W NW N NE E SE) <- view (m mirrored): ' + '; '.join('%s %s' % (r, ' '.join(t)) for r, t in took.items()))
    lost = ['%s facing %d frame %d' % (r, f, i) for r, per in frames.items() for f, seq in enumerate(per) for i, fr in enumerate(seq)
            if fr[:, 0, 3].any() or fr[:, -1, 3].any() or fr[0, :, 3].any()]
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in ('laugh', 'getup'):                                      # (named here, not in pixelate.py: this cutter's own rows)
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    pix.write_sheet(name, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    if CHECK:
        facings(name, frames)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    meta['anims']['idle']['fps'] = 5; meta['anims']['walk']['fps'] = 10; meta['anims']['attack']['fps'] = 12; meta['anims']['hurt']['fps'] = 8
    meta['anims']['prone']['fps'] = 8; meta['anims']['getup']['fps'] = 8; meta['anims']['laugh']['fps'] = 6   # (the laugh's own beats are grimoire.js M.LAUGH's; fps is for a plain play)
    meta['source'] = ('generated by Griz (2026-09-28, two sheets) and the art desk (2026-10-15, ART-29: the SE walk, every NE row, S and N '
                      'but their idle, walk and attack, E but its walk), cut and snapped by tools/gnoll-sheet.py') + (', the cloth recoloured to the Desert tribe\'s red' if recolour else ', the Hills\' blue as drawn')
    json.dump(meta, open(meta_p, 'w'), indent=1)


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(name, frames):
    """the check: every facing of every row (S SW W NW N NE E SE top to bottom, the floor line drawn), facings-<name>-<row>.png; and the
    lineup, lineup-<name>.png: per facing the frames a turn or a change of row sets side by side -- idle 1, walk 1, attack 4, death 1 and 7,
    prone 2, get up 1 and 6, laugh 1 and 5"""
    d = os.path.join(ROOT, 'dev', 'visions', 'gnoll'); os.makedirs(d, exist_ok=True)
    for row, per in frames.items():
        n = len(per[0])
        cv = Image.new('RGBA', (FW * n + 4 * (n + 1), FH * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            for i, fr in enumerate(per[f]):
                cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (4 + i * (FW + 4), f * FH))
            dr.line([(0, f * FH + AY + 1), (cv.width, f * FH + AY + 1)], fill=(110, 114, 110, 255))
            dr.text((2, f * FH + 2), FN[f], fill=(255, 255, 255, 255))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s-%s.png' % (name, row)))
    pick = [('idle', 0), ('walk', 0), ('attack', 3), ('hurt', 0), ('hurt', 6), ('prone', 1), ('getup', 0), ('getup', 5), ('laugh', 0), ('laugh', 4)]
    cv = Image.new('RGBA', (FW * len(pick), FH * 8), (70, 74, 70, 255))
    dr = ImageDraw.Draw(cv)
    for f in range(8):
        for i, (row, k) in enumerate(pick):
            cv.alpha_composite(Image.fromarray(frames[row][f][k], 'RGBA'), (i * FW, f * FH))
        dr.line([(0, f * FH + AY + 1), (cv.width, f * FH + AY + 1)], fill=(200, 60, 60, 255))
        dr.text((2, f * FH + 2), FN[f], fill=(255, 255, 255, 255))
    cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'lineup-%s.png' % name))


CHECK = 'check' in sys.argv[1:]
if __name__ == '__main__':
    build('gnoll_p2', None)
    build('gloryseeker_p2', red_cloth)

"""DEEP16 pipeline 2 (generated art): Griz's generated carrion-crawler sheet -> a palette sprite sheet.

    python tools/crawler-sheet.py            # deep16/art/crawler_p2.png + .json
    python tools/crawler-sheet.py check      # dev/visions/crawler/: each ART-44 page's cut (a colour a frame), every facing of every row, a lineup

Source: deep16/_src/crawler_grok_1.webp (Griz, 2026-09-27, made with Grok): one page in one hand -- a portrait, three
views (side, front, top), and rows seen from the side facing right: idle 8, crawl 8, tentacles 8, bite 5, hurt 4, death 8.
Its colours stand as drawn (pale yellow body, red tentacles), snapped to the palette; no regrade (the chuul's was).
Facings (until ART-44, below): the front view takes S; the top view takes N (Griz, 09-27: "build it with the top view for N": the sheet has no
rear view); the side rows take the other six (mirrored for the west side). The death row plays as `hurt` (the engine
plays it once when a creature goes down), as the chuul's does. The bite and the flinch rows are not cut.
Boxes from a component pass over the sheet (warm pixels against the navy ground).
ART-44 (10-21): the art desk drew the views the sheet lacked (RULED 10-14, five drawn views: S, SE, E, NE, N; SE mirrors to SW, E
to W, NE to NW), six pages in deep16/_src/crawler/ART-44/ (sorted out of Fresh by its ART-44-sort.py; the desk's papers in
_src/art-desk/received-2026-10-21-ART-44-crawler-FINAL-REPAIRED/), each cut by its own row and number labels (tools/sheetrows.py):
    H1P1  ART-44_HEAD-1_PAGE-1.png  SE: Idle 8, Crawl 8
    H1P2  ART-44_HEAD-1_PAGE-2.png  SE: Tentacles 8, Fall 8
    H2P1  ART-44_HEAD-2_PAGE-1.png  NE: Idle 8, Crawl 8
    H2P2  ART-44_HEAD-2_PAGE-2.png  NE: Tentacles 8, Fall 8
    H3P1  ART-44_HEAD-3_PAGE-1.png  S:  Fall 8
    H5P1  ART-44_HEAD-5_PAGE-1.png  N:  Fall 8
Idle plays as `idle`, Crawl as `walk`, Tentacles as `attack`, Fall as `hurt`. SE and NE draw every row from their own view (SW and NW
mirrored); S and N keep the panel's stills for idle, walk and attack and fall in their own view; E and W keep the side rows. Each page is
scaled to the creature as committed (K44) and toned to the side rows' colours, body and tentacles apart (TONE44); each frame stands with its
body's middle (the gold segments' centroid) on the anchor column and its row's ground from the page (each frame's foot as drawn against
its row's first).
"""
import os, sys, json, subprocess
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SR = _load('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))

SRC = os.path.join(ROOT, 'deep16', '_src')                 # the sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'crawler_grok_1.webp')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')
SHEET = np.asarray(Image.open(os.path.join(SRC, 'crawler_grok_1.webp')).convert('RGB')).astype(np.int32)
BG = np.array([12, 20, 31])
FW, FH, AX, AY = 170, 104, 85, 94
SIDE_H = 50                  # Large, and low: the side rows stand ~50 px (the humans are 56 tall; it is 3-4 ft high, 9 long)

SIDE_V, FRONT_V, TOP_V = (874, 120, 1007, 214), (1036, 104, 1141, 218), (1197, 106, 1270, 220)   # the panel's views
IDLE = [(52, 304, 164, 379), (208, 296, 316, 379), (356, 297, 471, 380), (513, 299, 627, 380), (672, 304, 785, 376),
        (828, 310, 940, 376), (988, 298, 1104, 376), (1151, 303, 1266, 376)]
WALK = [(34, 444, 164, 513), (196, 441, 332, 514), (354, 445, 489, 513), (512, 442, 649, 514), (670, 440, 807, 513),
        (829, 434, 966, 513), (989, 442, 1129, 513), (1150, 449, 1282, 514)]
ATTACK = [(43, 573, 157, 647), (200, 576, 319, 648), (354, 569, 476, 646), (516, 580, 642, 650), (677, 569, 804, 650),
          (836, 572, 966, 651), (995, 577, 1126, 651), (1153, 580, 1269, 650)]
DEATH = [(55, 971, 149, 1037), (220, 964, 329, 1042), (383, 964, 494, 1042), (553, 968, 656, 1042), (710, 993, 823, 1042),
         (863, 974, 976, 1042), (1014, 1003, 1128, 1040), (1167, 1007, 1278, 1039)]

# ART-44 (10-21): the art desk's six pages. Per page: text boxes (each row's name above it, and each number strip the width of the page: a
# number lies wholly inside one, a tentacle tip that dips into it does not), and the rows -- (the page's row name, band x0 y0 x1 y1, its
# number strip y0 y1, the numbers). Read off the pages; H1P2's Tentacles strip starts in the numbers' lower half (a tentacle's highlight
# above them read as a ninth label).
ART44 = os.path.join(SRC, 'crawler', 'ART-44')
N8 = [str(i + 1) for i in range(8)]
W1, W2 = 1774, 1983                                      # the pages' widths (H1P1, H2P1, H2P2; H1P2, H3P1, H5P1)
PAGES = {
    'H1P1': dict(file='ART-44_HEAD-1_PAGE-1.png', text=[(20, 140, 170, 178), (0, 398, W1, 428), (20, 482, 170, 518), (0, 726, W1, 756)],
                 rows=[('idle', (0, 178, W1, 428), (400, 426), N8), ('crawl', (0, 518, W1, 756), (728, 754), N8)]),
    'H1P2': dict(file='ART-44_HEAD-1_PAGE-2.png', text=[(20, 112, 250, 150), (0, 378, W2, 408), (20, 446, 120, 484), (0, 709, W2, 741)],
                 rows=[('tentacles', (0, 150, W2, 408), (392, 405), N8), ('fall', (0, 484, W2, 741), (711, 739), N8)]),
    'H2P1': dict(file='ART-44_HEAD-2_PAGE-1.png', text=[(20, 140, 112, 176), (0, 398, W1, 428), (20, 482, 140, 516), (0, 769, W1, 800)],
                 rows=[('idle', (0, 130, W1, 428), (400, 426), N8), ('crawl', (0, 516, W1, 800), (771, 797), N8)]),
    'H2P2': dict(file='ART-44_HEAD-2_PAGE-2.png', text=[(20, 136, 202, 173), (0, 409, W1, 440), (20, 480, 104, 514), (0, 771, W1, 802)],
                 rows=[('tentacles', (0, 112, W1, 440), (411, 438), N8), ('fall', (0, 514, W1, 802), (773, 800), N8)]),
    'H3P1': dict(file='ART-44_HEAD-3_PAGE-1.png', text=[(20, 186, 110, 222), (0, 567, W2, 603)],
                 rows=[('fall', (0, 222, W2, 603), (569, 601), N8)]),
    'H5P1': dict(file='ART-44_HEAD-5_PAGE-1.png', text=[(20, 176, 116, 214), (0, 585, W2, 623)],
                 rows=[('fall', (0, 214, W2, 623), (587, 621), N8)]),
}
ENGINE = {'idle': 'idle', 'crawl': 'walk', 'tentacles': 'attack', 'fall': 'hurt'}     # the page's row -> the sheet's
HEADS = {'SE': ('H1P1', 'H1P2'), 'NE': ('H2P1', 'H2P2'), 'S': ('H3P1',), 'N': ('H5P1',)}
STILL = ('idle', 'crawl')                    # rows that stand still on their ground: its foot the row's median (the page's jitter is a
                                             # pixel); the others (a lash that reaches down, a fall) from their first frame's foot
# the scale, page px a game px: K44 below (set by eye on the lineup after the measures; see the ENGINE-RETURN of 10-21 for the table)
K44 = {'H1P1': 3.3, 'H2P1': 3.3, 'H3P1': 4.3, 'H5P1': 4.5}
K44.update({'H1P2': K44['H1P1'] * 1.04, 'H2P2': K44['H2P1'] * 1.01})
# the colour, page by page and material by material, to the side rows' (his look's): the art desk drew a brighter, stronger crawler, its
# tentacles most of all, and its pale gold snapped to the palette's peach-tan ramp where the side rows' lands on the gold one. The gold body
# (hue 15-75) and the red tentacles (hue 330-15) apart; the maw's purple, the eyes, the teeth and the outline are left as drawn. The hue is
# turned to the side rows' median (TONE_AT, from the grok sheet's rows and panel; TONE_HUE, each page's, both of the pixels over 0.2
# saturation). The saturation and value factors (TONE44: body s, body v, red s, red v) are fitted on the snapped colours: each page's frames
# cut, toned and snapped on a grid of factors, and the one whose colours' shares come nearest the side rows' (E in every row) kept -- the
# medians' own factors (body s 0.77-0.86, v 0.78-0.90) snapped the body to the peach ramp (10-21; the trials in the ENGINE-RETURN of 10-21f).
TONE_AT = {'body': 35.6, 'red': 358.3}
TONE_HUE = {'H1P1': (35.5, 355.5), 'H1P2': (34.2, 355.9), 'H2P1': (35.5, 355.2), 'H2P2': (33.7, 352.3), 'H3P1': (35.1, 354.3), 'H5P1': (33.6, 354.5)}
TONE44 = {'H1P1': (0.90, 1.00, 0.90, 0.70), 'H1P2': (0.85, 0.95, 0.80, 0.70), 'H2P1': (0.85, 0.95, 1.00, 0.65),
          'H2P2': (0.80, 0.90, 0.80, 0.65), 'H3P1': (0.85, 0.95, 0.90, 0.60), 'H5P1': (0.80, 0.90, 0.80, 0.65)}


def cut(box, pad=5):
    x0, y0, x1, y1 = box
    c = SHEET[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]
    m = np.abs(c - BG).sum(-1) > 45                      # off the navy ground (the drawing's dark outline included)
    m = ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=2))
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = lab == (1 + int(np.argmax(sizes)))              # the creature, not a frame number
    ys, xs = np.where(m)
    c, m = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1], m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray(np.dstack([c.astype(np.uint8), (m * 255).astype(np.uint8)]), 'RGBA')


def figure(box, scale):
    img = cut(box)
    w, h = img.size
    img = img.resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX)
    return pix.pixelate(img, 1, do_lift=False)


def place(a, x_ref, dy=0):
    """a 1x RGBA array onto a frame: x_ref at AX, the lowest opaque row on AY."""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    rows = np.where(a[..., 3].any(axis=1))[0]
    ox, oy = int(round(AX - x_ref)), AY - rows[-1] + dy
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def left_x(a):
    return float(np.where(a[..., 3].any(axis=0))[0][0])


def hsv(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def toned(im, L):
    """an RGBA cut in HSV, material by material: the gold body and the red tentacles each turned to the side rows' hue and scaled (TONE44)"""
    a = np.asarray(im).astype(float)
    h, s, v = hsv(a[..., :3] / 255.0)
    bs, bv, rs, rv = TONE44[L]
    sels = (('body', (s > 0.2) & (h >= 15) & (h < 75), TONE_HUE[L][0], bs, bv), ('red', (s > 0.2) & ((h >= 330) | (h < 15)), TONE_HUE[L][1], rs, rv))
    for mat, sel, ph, fs, fv in sels:
        dh = (TONE_AT[mat] - ph + 180) % 360 - 180
        h = np.where(sel, (h + dh) % 360, h)
        s = np.where(sel, np.clip(s * fs, 0, 1), s)
        v = np.where(sel, np.clip(v * fv, 0, 1), v)
    cc = v * s
    x = cc * (1 - np.abs((h / 60) % 2 - 1))
    sec = (h // 60).astype(int) % 6
    z = np.zeros_like(cc)
    out = np.select([sec[..., None] == k for k in range(6)],
                    [np.stack(p, -1) for p in ((cc, x, z), (x, cc, z), (z, cc, x), (z, x, cc), (x, z, cc), (cc, z, x))]) + (v - cc)[..., None]
    a[..., :3] = np.clip(out * 255, 0, 255)
    return Image.fromarray(a.round().astype(np.uint8), 'RGBA')


def body_x(im):
    """the gold segments' centroid column in a page cut (the tentacles lash and the eye stalks bob; the body holds)"""
    a = np.asarray(im).astype(float)
    h, s, v = hsv(a[..., :3] / 255.0)
    m = (a[..., 3] > 0) & (s > 0.2) & (h >= 15) & (h < 75)
    return float(np.where(m)[1].mean())


def fit(img, scale):
    """one scale: premultiplied box down, a 1-px margin for the outline, snapped to the palette."""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


CLIPPED = []


def place44(a, x_ref, tag='', up=0):
    """a fitted cut onto the frame: x_ref on AX, its lowest opaque row (the outline's) on AY -- or `up` px above it (below, if negative)"""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    rr = np.where(a[..., 3].any(axis=1))[0]; cc = np.where(a[..., 3].any(axis=0))[0]
    ox, oy = int(round(AX - x_ref)), AY - rr[-1] - up
    if ox + cc[0] < 0 or ox + cc[-1] >= FW or oy + rr[0] < 0 or oy + rr[-1] >= FH:
        CLIPPED.append((tag, ox + cc[0], ox + cc[-1], oy + rr[0], oy + rr[-1]))
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def mirror44(seq):
    """west of the drawn east: a flip, then a pixel back so the anchor column stays put (FW is even)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def heads(check=False):
    """ART-44's pages -> {view: {sheet row: [frame, ...]}}: each frame at its page's scale and tone, its body's centroid on AX, its foot
    off the row's ground by what the page draws (`STILL`)."""
    views = {v: {} for v in HEADS}
    for v, pages in HEADS.items():
        for L in pages:
            s = PAGES[L]
            over = [] if check else None
            cuts = SR.cut_sheet(os.path.join(ART44, s['file']), s, overlay=over, tag=L)
            if check:
                d = os.path.join(ROOT, 'dev', 'visions', 'crawler'); os.makedirs(d, exist_ok=True)
                over[0].save(os.path.join(d, 'cut-%s.png' % L))
            k = K44[L]
            for row, frs in cuts.items():
                floor = float(np.median([b[3] for _, _, b in frs])) if row in STILL else frs[0][2][3]
                seq = []
                for nm, im, box in frs:
                    a = fit(toned(im, L), k)
                    a = a[:np.where(a[..., 3].any(axis=1))[0][-1] + 1]            # (its lowest opaque row: the outline under its foot)
                    seq.append(place44(a, 1 + body_x(im) / k, '%s-%s%s' % (L, row, nm), up=int(round((floor - box[3]) / k))))
                views[v][ENGINE[row]] = seq
    return views


def build(check=False):
    s_rows = np.mean([b[3] - b[1] for b in IDLE]) / SIDE_H
    s_panel = (SIDE_V[3] - SIDE_V[1]) / SIDE_H
    centre = lambda a: np.where(a[..., 3].any(axis=0))[0].mean()
    front, top = figure(FRONT_V, s_panel), figure(TOP_V, s_panel)
    fS, fN = place(front, centre(front)), place(top, centre(top))

    idle = [figure(b, s_rows) for b in IDLE]
    half = idle[0].shape[1] / 2                          # the tail end holds still; the body's middle on the foot
    side = lambda a: place(a, left_x(a) + half)
    idle_r = [side(a) for a in idle]
    walk_r = [side(figure(b, s_rows)) for b in WALK]
    atk_r = [side(figure(b, s_rows)) for b in ATTACK]
    death_r = [side(figure(b, s_rows)) for b in DEATH]
    mirror = lambda seq: [fr[:, ::-1].copy() for fr in seq]
    idle_l, walk_l, atk_l, death_l = mirror(idle_r), mirror(walk_r), mirror(atk_r), mirror(death_r)

    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)
    hd = heads(check)                                    # ART-44: SE and NE (every row), S and N (the fall)
    side_r = {'idle': idle_r, 'walk': walk_r, 'attack': atk_r, 'hurt': death_r}
    side_l = {'idle': idle_l, 'walk': walk_l, 'attack': atk_l, 'hurt': death_l}
    still = lambda b, lunge: {'idle': [b, b, shift(b, 0, 1), shift(b, 0, 1)], 'walk': [shift(b, 0, -(i % 2)) for i in range(8)],
                              'attack': [b, shift(b, 0, lunge), shift(b, 0, 2 * lunge), shift(b, 0, lunge)]}
    front_v = {**still(fS, 2), **hd['S']}
    back_v = {**still(fN, -2), **hd['N']}
    # facings S, SW, W, NW, N, NE, E, SE (deep16/js/sprites.js S.FACINGS). RULED 10-14, five drawn views: S, SE (SW mirrored), E (W
    # mirrored), NE (NW mirrored), N. S and N keep the panel's stills, bobbed, for idle, walk and attack (ART-44 drew them only the fall)
    per = [front_v, {r: mirror44(fs) for r, fs in hd['SE'].items()}, side_l, {r: mirror44(fs) for r, fs in hd['NE'].items()},
           back_v, hd['NE'], side_r, hd['SE']]
    frames = {r: [p[r] for p in per] for r in ('idle', 'walk', 'attack', 'hurt')}
    # (a row's frame count must match across facings: the front and top views fill theirs out)
    n = {k: max(len(r) for r in v) for k, v in frames.items()}
    for k, rows in frames.items():
        for i, r in enumerate(rows):
            while len(r) < n[k]: r = r + r[:n[k] - len(r)]
            rows[i] = r[:n[k]]
    for t in CLIPPED:
        print('  CLIPPED', t)
    return frames


def write(frames):
    pix.write_sheet('crawler_p2', frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'crawler_p2.json')
    meta = json.load(open(meta_p))
    meta['anims']['idle']['fps'] = 5; meta['anims']['walk']['fps'] = 10; meta['anims']['attack']['fps'] = 10; meta['anims']['hurt']['fps'] = 8
    meta['source'] = ('generated by Griz with Grok (2026-09-27; the side rows, and the panel\'s front and top views for S and N) and the art desk '
                      '(2026-10-17, ART-44: the SE and NE views of every row, the front and back of the fall), cut and snapped by tools/crawler-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(frames):
    """dev/visions/crawler/facings-<row>.png: every facing of every row, S SW W NW N NE E SE top to bottom, 2x on a grey floor (the foot's
    line drawn), and lineup.png: idle frame 1 in all eight facings and the fall's last, 4x"""
    d = os.path.join(ROOT, 'dev', 'visions', 'crawler'); os.makedirs(d, exist_ok=True)
    for name, per in frames.items():
        n = len(per[0])
        cv = Image.new('RGBA', (FW * n + 4 * (n + 1), FH * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            dr.line([(0, f * FH + AY + 1), (cv.width, f * FH + AY + 1)], fill=(110, 114, 110, 255))
            dr.text((2, f * FH + 2), FN[f], fill=(255, 255, 255, 255))
            for i, fr in enumerate(per[f]):
                cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (4 + i * (FW + 4), f * FH))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % name))
    for row, i in (('idle', 0), ('walk', 0), ('attack', 4), ('hurt', 7)):
        cv = Image.new('RGBA', (FW * 8, FH), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        dr.line([(0, AY + 1), (cv.width, AY + 1)], fill=(200, 60, 60, 255))
        for f in range(8):
            cv.alpha_composite(Image.fromarray(frames[row][f][i], 'RGBA'), (f * FW, 0))
            dr.text((f * FW + 2, 2), FN[f], fill=(255, 255, 255, 255))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'lineup-%s.png' % row))
    print('  wrote', d)


if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else ''
    fr = build(check=arg == 'check')
    if arg == 'check':                                   # the cut overlays, every facing of every row, the lineups (dev/visions/crawler/)
        facings(fr)
    else:
        write(fr)

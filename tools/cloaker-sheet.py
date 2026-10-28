"""DEEP16 pipeline 2 (generated art): Griz's generated cloaker sheet -> the cloaker's palette sprite sheet.

    python tools/cloaker-sheet.py            builds deep16/art/cloaker_p2.png/.json
    python tools/cloaker-sheet.py preview    writes dev/shots/cloaker-cuts.png (the eight cut-outs, numbered) and stops

Source: deep16/_src/cloaker_grok_3.jpg (Griz, 2026-09-29, the third generated sheet, and the one that held together: one creature, one
design, all facing left; the first two mixed a grub-bodied bat with a manta and are kept in _src as cloaker_grok_1/2.png). Eight
panels (4 x 2) on a baked checkerboard (the fourth is numbered 3):
  1 wings out flat   2 wings up   3 wings up, high   4 wings swept down and back, tail up
  5 6 7 the dive: wings folded to the flanks, head down, mouth open   8 wings out flat, tail up
The ground is the neutral light pixels joined to a panel's edge (the checker's two greys); the numbers and rules dropped by size and
place. Every pose is placed on the red of its eyes, so the head stays where it is while the wings do the moving. All eight facings
use the same left-facing poses (mirrored for the east side): there are no front or back views to draw from.
The anims are made from the poses: the idle is the flap slowed and cycled 1-2-3-4-8 with a bob; the glide the same, faster; the attack
winds up (wings up), dives (5-7) and recovers, lunging the way it faces; the death (played as `hurt`, as the gnolls' and chuul's are)
is a shake, the wings folding, and a fall into a heap of cloak. The face close-up (js/ui.js scene `face`) draws the idle's first
frame blown up, so it is a pose with the face clear.
ART-46 (10-21): the art desk drew the views the sheet lacked (RULED 10-14, five drawn views: S, SE, E, NE, N; SE mirrors to SW, E to W,
NE to NW), eight pages in deep16/_src/cloaker/ART-46/ (sorted out of Fresh by its ART-46-sort.py; the desk's papers in
_src/art-desk/received-2026-10-21-ART-46-cloaker-FINAL-SHEETS/), each cut by its own row and number labels (tools/sheetrows.py):
    H1P1 SE Idle 8, Glide 8, Attack 8      H1P2 SE Fall 8, Fly 8
    H2P1 NE the rows of H1P1               H2P2 NE the rows of H1P2
    H3P1 S  the rows of H1P1               H3P2 S  the rows of H1P2
    H5P1 N  the rows of H1P1               H5P2 N  the rows of H1P2
Idle plays as `idle`, Glide as `walk`, Attack as `attack`, Fall as `hurt`, Fly as `fly`. S, SE, NE and N draw every row from their own
view (SW and NW mirrored); E and W keep the side poses, and every facing keeps the roost, the reveal and the moan (the Magic Missile egg's
close-up plays them; the desk was not asked for them). Scale: the wings-out-flat pose (each page's first Idle or Fly frame) is a flat
cloak, and the floor's projection draws a flat thing the same area at any heading, so each page's is met by area to the side's (K46).
Each row hovers where the side does: its first frame's middle on the side's flat pose's middle, every other frame where the page drew it
against its number; the attack lunges as the side's does, and the fall drops to the floor by the side's own curve.
    python tools/cloaker-sheet.py check      dev/visions/cloaker/: each ART-46 page's cut (a colour a frame), every facing of every row
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
SRC = os.path.join(ROOT, 'deep16', '_src')                 # the sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'cloaker_grok_3.jpg')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')
CW, CH = 292, 392                       # one panel
FW, FH, AX, AY = 128, 128, 64, 112      # a frame; the foot (the shadow) at AX, AY; it hovers above it
NAME = 'cloaker_p2'
SCALE = 0.38                            # one scale for every pose (the widest, ~280 px, comes to ~106: a cloaker is two squares wide)
CX, CY = 40, 60                       # where the eyes sit in a frame at rest (it faces left: the head is left of centre, the body and wings right of it)


def cell(sheet, n):
    """panel n (1..8): RGBA cut-out with the checker keyed out, and the red of the eyes' centre in it."""
    col, row = (n - 1) % 4, (n - 1) // 4
    x0, y0 = col * CW + 4, row * CH + 4
    c = sheet[y0:y0 + CH - 8, x0:x0 + CW - 8]
    mx, mn = c.max(-1), c.min(-1)
    bgm = ((mx - mn) <= 10) & (mx >= 185)                 # the checker's greys and white (a jpeg's noise: a little slack)
    lab, k = ndimage.label(bgm)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    big = {i + 1 for i, s in enumerate(ndimage.find_objects(lab)) if (lab[s] == i + 1).sum() > 2500}
    bg = np.isin(lab, list(edge | big))
    fg = ~bg
    fg = ndimage.binary_opening(fg, iterations=1)
    fg = ndimage.binary_closing(fg, iterations=2)
    lab, k = ndimage.label(fg)
    keep = np.zeros_like(fg)
    for i, s in enumerate(ndimage.find_objects(lab)):
        area = int((lab[s] == i + 1).sum())
        y1, x1 = s[0].stop, s[1].stop
        if area < 300 or (y1 < 56 and x1 < 90):           # a speck; the panel's number
            continue
        keep |= lab == i + 1
    keep = ndimage.binary_fill_holes(keep)
    keep = ndimage.binary_erosion(keep, iterations=1)      # the halo of the checker
    ys, xs = np.where(keep)
    cc = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    am = keep[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    red = (cc[..., 0] > 150) & (cc[..., 1] < 80) & (cc[..., 2] < 80) & am
    ry, rx = np.where(red)
    eye = (rx.mean(), ry.mean()) if len(rx) >= 6 else (cc.shape[1] * 0.3, cc.shape[0] * 0.5)
    return Image.fromarray(np.dstack([cc.astype(np.uint8), (am * 255).astype(np.uint8)]), 'RGBA'), eye


def load():
    return np.asarray(Image.open(os.path.join(SRC, 'cloaker_grok_3.jpg')).convert('RGB')).astype(np.int32)


def cuts_all():
    s = load()
    return {'p%d' % n: cell(s, n) for n in range(1, 9)}


def preview(cuts):
    from PIL import ImageDraw
    im = Image.new('RGBA', (4 * 300, 2 * 300), (60, 60, 90, 255))
    d = ImageDraw.Draw(im)
    for i, (key, (c, eye)) in enumerate(cuts.items()):
        col, row = i % 4, i // 4
        s = min(280 / c.size[0], 280 / c.size[1], 1)
        cc = c.resize((max(1, int(c.size[0] * s)), max(1, int(c.size[1] * s))))
        im.alpha_composite(cc, (col * 300 + 8, row * 300 + 8))
        d.ellipse((col * 300 + 8 + eye[0] * s - 3, row * 300 + 8 + eye[1] * s - 3, col * 300 + 8 + eye[0] * s + 3, row * 300 + 8 + eye[1] * s + 3), outline=(0, 255, 0, 255))
        d.text((col * 300 + 6, row * 300 + 4), '%s %dx%d' % (key, c.size[0], c.size[1]), fill=(255, 255, 0, 255))
    os.makedirs(os.path.join(ROOT, 'dev', 'shots'), exist_ok=True)
    im.save(os.path.join(ROOT, 'dev', 'shots', 'cloaker-cuts.png'))


def frame(cut, mirror=False, sx=1.0, sy=1.0, dx=0, dy=0):
    """one pose at 1x: scaled (with a squash/stretch), palette-snapped and outlined, the red of its eyes placed at (CX+dx, CY+dy)."""
    img, (ex, ey) = cut
    w, h = img.size
    if mirror:
        img = img.transpose(Image.FLIP_LEFT_RIGHT); ex = w - ex
    nw, nh = max(1, round(w * SCALE * sx)), max(1, round(h * SCALE * sy))
    img = img.resize((nw, nh), Image.BOX)
    a = pix.pixelate(img, 1, do_lift=False)
    ax_, ay_ = ex * nw / w, ey * nh / h
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    cx = CX if not mirror else FW - CX                      # the mirrored side keeps the head off-centre the other way
    ox, oy = int(round(cx + dx - ax_)), int(round(CY + dy - ay_))
    h2, w2 = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h2), min(FW, ox + w2)
    if y1 > y0 and x1 > x0:
        out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def roost_frame(cut, dy=0):
    """the hung cloak (panels 1 and 2 of the first sheet): placed by its box, centred, its foot on the frame's floor."""
    img, _ = cut
    nw, nh = max(1, round(img.size[0] * SCALE)), max(1, round(img.size[1] * SCALE))
    a = pix.pixelate(img.resize((nw, nh), Image.BOX), 1, do_lift=False)
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = (FW - a.shape[1]) // 2, FH - 3 - a.shape[0] + dy
    y0, y1 = max(0, oy), min(FH, oy + a.shape[0])
    x0, x1 = max(0, ox), min(FW, ox + a.shape[1])
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def box_frame(img, dx=0, dy=0, sc=SCALE):
    """a pose that has no eyes to anchor on, placed by the middle of its box."""
    nw, nh = max(1, round(img.size[0] * sc)), max(1, round(img.size[1] * sc))
    a = pix.pixelate(img.resize((nw, nh), Image.BOX), 1, do_lift=False)
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = FW // 2 - a.shape[1] // 2 + dx, 62 - a.shape[0] // 2 + dy
    y0, y1 = max(0, oy), min(FH, oy + a.shape[0]); x0, x1 = max(0, ox), min(FW, ox + a.shape[1])
    if y1 > y0 and x1 > x0:
        out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def unfurl_first(s1):
    """the reveal's first pose (Griz, 09-29): panel 3, the cloak opening, mirrored, with panel 4's screaming head where the hood is dark."""
    a3, _ = cell(s1, 3)
    a3 = a3.transpose(Image.FLIP_LEFT_RIGHT)
    a4, _ = cell(s1, 4)
    head = a4.crop((46, 0, 118, 96)).resize((66, 88), Image.BOX)
    layer = Image.new('RGBA', a3.size, (0, 0, 0, 0))
    layer.paste(head, (104, 0), head)
    return Image.alpha_composite(a3, layer)


def ghost_cut(s1, n=8):
    """panel 8, the phantasm: three ghost heads on a checkerboard they are drawn over. The ghost is the lavender (blue and red over green)
    and the dark of the eyes and mouths; the checker is neutral. Hard-edged here (the palette has no half-alpha): the scene draws it faint."""
    col, row = (n - 1) % 4, (n - 1) // 4
    x0, y0 = col * CW + 4, row * CH + 4
    c = s1[y0:y0 + CH - 8, x0:x0 + CW - 8]
    lav = (c[..., 0] + c[..., 2]) // 2 - c[..., 1]
    m = (lav > 9) | (c.max(-1) < 175)
    m = ndimage.binary_opening(m, iterations=1)
    m = ndimage.binary_closing(m, iterations=3)
    lab, k = ndimage.label(m)
    keep = np.zeros_like(m)
    for i, s in enumerate(ndimage.find_objects(lab)):
        if (lab[s] == i + 1).sum() >= 400 and not (s[0].stop < 56 and s[1].stop < 90):
            keep |= lab == i + 1
    keep = ndimage.binary_fill_holes(keep)
    ys, xs = np.where(keep)
    cc = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    am = keep[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray(np.dstack([cc.astype(np.uint8), (am * 255).astype(np.uint8)]), 'RGBA')


# ART-46 (10-21): the art desk's eight pages. Per page: text boxes (each row's name, at its left on HEAD 1 and 2, above its first frame
# on HEAD 3 and 5, with room for the drop shadow under a 'y' -- Fly's 'y' rode into Fly 1 on a tight box; each number strip the width of the
# page), and the rows -- (the page's row name, band x0 y0 x1 y1, its number strip).
ART46 = os.path.join(SRC, 'cloaker', 'ART-46')
N8 = [str(i + 1) for i in range(8)]
PAGES46 = {
    'H1P1': dict(file='ART-46_HEAD-1_PAGE-1.png', W=2158, text=[(0, 125, 140, 182), (0, 345, 140, 398), (0, 560, 140, 612)],
                 rows=[('idle', (0, 25, 2158, 225), (202, 222)), ('glide', (0, 240, 2158, 443), (420, 441)), ('attack', (0, 460, 2158, 677), (650, 675))]),
    'H1P2': dict(file='ART-46_HEAD-1_PAGE-2.png', W=2157, text=[(0, 205, 125, 262), (0, 515, 120, 580)],
                 rows=[('fall', (0, 50, 2157, 329), (303, 327)), ('fly', (0, 375, 2157, 653), (627, 651))]),
    'H2P1': dict(file='ART-46_HEAD-2_PAGE-1.png', W=1774, text=[(0, 140, 112, 202), (0, 395, 110, 450), (0, 680, 120, 735)],
                 rows=[('idle', (0, 45, 1774, 265), (241, 263)), ('glide', (0, 300, 1774, 547), (519, 545)), ('attack', (0, 575, 1774, 817), (793, 815))]),
    'H2P2': dict(file='ART-46_HEAD-2_PAGE-2.png', W=1983, text=[(0, 212, 112, 275), (0, 540, 115, 605)],
                 rows=[('fall', (0, 115, 1983, 370), (345, 368)), ('fly', (0, 420, 1983, 711), (684, 709))]),
    'H3P1': dict(file='ART-46_HEAD-3_PAGE-1.png', W=1881, text=[(0, 72, 72, 108), (0, 330, 92, 368), (0, 596, 130, 632)],
                 rows=[('idle', (0, 30, 1881, 258), (236, 255)), ('glide', (0, 290, 1881, 518), (496, 516)), ('attack', (0, 550, 1881, 788), (765, 786))]),
    'H3P2': dict(file='ART-46_HEAD-3_PAGE-2.png', W=2079, text=[(0, 120, 98, 158), (0, 430, 95, 480)],
                 rows=[('fall', (0, 95, 2079, 375), (348, 373)), ('fly', (0, 415, 2079, 683), (658, 681))]),
    'H5P1': dict(file='ART-46_HEAD-5_PAGE-1.png', W=1942, text=[(0, 16, 98, 52), (0, 276, 108, 312), (0, 528, 138, 564)],
                 rows=[('idle', (0, 15, 1942, 252), (233, 250)), ('glide', (0, 270, 1942, 495), (476, 493)), ('attack', (0, 520, 1942, 766), (745, 764))]),
    'H5P2': dict(file='ART-46_HEAD-5_PAGE-2.png', W=2048, text=[(0, 33, 118, 78), (0, 400, 102, 458)],
                 rows=[('fall', (0, 85, 2048, 354), (330, 352)), ('fly', (0, 415, 2048, 701), (677, 699))]),
}
for _s in PAGES46.values():
    _s['text'] = _s['text'] + [(0, ly0 - 2, _s['W'], ly1 + 3) for _, _, (ly0, ly1) in _s['rows']]
    _s['rows'] = [(r, b, l, N8) for r, b, l in _s['rows']]
ENGINE46 = {'idle': 'idle', 'glide': 'walk', 'attack': 'attack', 'fall': 'hurt', 'fly': 'fly'}
HEADS46 = {'SE': ('H1P1', 'H1P2'), 'NE': ('H2P1', 'H2P2'), 'S': ('H3P1', 'H3P2'), 'N': ('H5P1', 'H5P2')}
FLAT_A = 2902                       # the side's wings-out-flat pose (p1, the idle's first frame) at game size, outline and all, in px
FLAT_Y = -53                        # its centroid's height against the foot (AY; the side's idle 1 as built: 53.0 px up): every row's
                                    # first frame hovers there, its centroid on the foot's column (a centroid, not a box: a tail that
                                    # stands up behind the S view's head would sink a box's middle)
# K46, page px a game px: each page's flat frame (Idle 1 on a page 1, Fly 1 on a page 2) met by area to FLAT_A -- `measure` solves them.
# The eyes, where a view shows them, say a tenth to a seventh smaller (SE 2.47, S 2.72 by the red's area against the side pose's), and the
# page 2s are drawn 12-15 per cent bigger than their page 1s -- the art desk's own note: "rendered sprite sizes vary".
K46 = {'H1P1': 2.26, 'H1P2': 2.59, 'H2P1': 2.40, 'H2P2': 2.69, 'H3P1': 2.38, 'H3P2': 2.70, 'H5P1': 2.28, 'H5P2': 2.62}
DIR46 = {'S': (0, 1), 'SE': (1, 1), 'NE': (1, -1), 'N': (0, -1)}    # the lunge, as the side rows' (the attack's DIR): down 0.6 a unit, up 0.2
LUNGE = [0, -3, -5, 6, 11, 11, 5, 1]                                # the side attack's own offsets, frame by frame
DROP = [0, 2, 6, 18, 32, 40, 44, 46]                                # the side death's own drop, frame by frame: the fall lands by its curve


def fit46(img, scale):
    """one scale: premultiplied box down, a 1-px margin for the outline, snapped to the palette."""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


CLIPPED = []


def centroid(a):
    ys, xs = np.where(a[..., 3] > 0)
    return xs.mean(), ys.mean()


def put46(a, cx, cy, tag):
    """a fitted cut onto a frame, its centroid at (AX + cx, AY + cy)"""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    rr = np.where(a[..., 3].any(axis=1))[0]; cc = np.where(a[..., 3].any(axis=0))[0]
    gx, gy = centroid(a)
    ox, oy = int(round(AX + cx - gx)), int(round(AY + cy - gy))
    ox = min(max(ox, -cc[0]), FW - 1 - cc[-1]) if cc[-1] - cc[0] < FW else ox   # (a lunge that would cut a wingtip stops at the frame's edge)
    if ox + cc[0] < 0 or ox + cc[-1] >= FW or oy + rr[0] < 0 or oy + rr[-1] >= FH:
        CLIPPED.append((tag, ox + cc[0], ox + cc[-1], oy + rr[0], oy + rr[-1]))
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def cuts46(L, check=False):
    s = PAGES46[L]
    over = [] if check else None
    path = os.path.join(ART46, s['file'])
    cuts = SR.cut_sheet(path, s, overlay=over, tag=L)
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'cloaker'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%s.png' % L))
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
    lx = {row: SR.label_xs(a, b[0], b[2], l[0], l[1]) for row, b, l, _ in s['rows']}   # each number's x: a frame's place in its cell
    return cuts, lx


def heads46(check=False):
    """ART-46's pages -> {view: {sheet row: [frame, ...]}}: each row's first frame hovering at FLAT_Y, the others where the page drew them
    against their numbers, the attack lunging and the fall dropping as the side's do."""
    views = {v: {} for v in HEADS46}
    for v, pages in HEADS46.items():
        dxv, dyv = DIR46[v]
        for L in pages:
            k = K46[L]
            cuts, lx = cuts46(L, check)
            for row, frs in cuts.items():
                mid = [(b[0] + centroid(np.asarray(im))[0] - lx[row][i], b[1] + centroid(np.asarray(im))[1]) for i, (_, im, b) in enumerate(frs)]   # (page px; x against its number)
                fits = [fit46(im, k) for _, im, _ in frs]
                pos = [((mx - mid[0][0]) / k, FLAT_Y + (my - mid[0][1]) / k) for mx, my in mid]   # (on the foot's column)
                if row == 'attack':
                    pos = [(x + dxv * o, y + dyv * o * (0.6 if dyv > 0 else 0.2)) for (x, y), o in zip(pos, LUNGE)]
                if row == 'fall':                         # the drop the page draws, and the rest to the floor by the side death's curve
                    low8 = pos[-1][1] + np.where(fits[-1][..., 3].any(axis=1))[0][-1] - centroid(fits[-1])[1]   # frame 8's lowest row against the foot, before the drop
                    pos = [(x, y + (0 - low8) * d / DROP[-1]) for (x, y), d in zip(pos, DROP)]
                views[v][ENGINE46[row]] = [put46(a, x, y, '%s-%s%d' % (L, row, i + 1)) for i, (a, (x, y)) in enumerate(zip(fits, pos))]
    return views


def measure46():
    """K46 solved: each page's flat frame's area at game size (outline and all) against FLAT_A"""
    for L, s in PAGES46.items():
        cuts, _ = cuts46(L)
        im = (cuts.get('idle') or cuts['fly'])[0][1]
        lo, hi = 1.5, 4.0
        for _ in range(30):
            k = (lo + hi) / 2
            a = (fit46(im, k)[..., 3] > 0).sum()
            lo, hi = (k, hi) if a > FLAT_A else (lo, k)
        print('  %s flat frame: k %.3f (area %d)' % (L, k, (fit46(im, k)[..., 3] > 0).sum()))


def mirror46(seq):
    """west of the drawn east: a flip, then a pixel back so the anchor column stays put (FW is even)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(frames):
    """dev/visions/cloaker/facings-<row>.png: every facing of every row, S SW W NW N NE E SE top to bottom, 2x on a grey floor (the
    foot's line drawn)"""
    d = os.path.join(ROOT, 'dev', 'visions', 'cloaker'); os.makedirs(d, exist_ok=True)
    for name in ('idle', 'walk', 'attack', 'hurt', 'fly'):
        per = frames[name]
        n = len(per[0])
        cv = Image.new('RGBA', (FW * n + 4 * (n + 1), FH * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            dr.line([(0, f * FH + AY + 1), (cv.width, f * FH + AY + 1)], fill=(110, 114, 110, 255))
            dr.text((2, f * FH + 2), FN[f], fill=(255, 255, 255, 255))
            for i, fr in enumerate(per[f]):
                cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (4 + i * (FW + 4), f * FH))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % name))
    print('  wrote', d)


def build(check=False):
    cuts = cuts_all()
    # the roost (Griz, 09-29: "have him be in that form when we show the magic missiles hitting"): the cloak hung on the roof, from the
    # first sheet's first two panels, a two-frame sway; the easter egg's hit scene shows it (js/magic.js), the same from every side
    s1 = np.asarray(Image.open(os.path.join(SRC, 'cloaker_grok_1.png')).convert('RGB')).astype(np.int32)
    roost = [roost_frame(cell(s1, 1)), roost_frame(cell(s1, 2)), roost_frame(cell(s1, 1), dy=1), roost_frame(cell(s1, 2), dy=1)]
    # the reveal (Griz, 09-29: "4, 7, 5, 6 is the order", a modified mirror of 3 with 4's head before 4): the cloak opens, the scream, the
    # wrap of its wings, the flight left -- all from the first sheet; the scene runs it, and it dissolves into the idle after
    f3, f4, f7, f5, f6 = unfurl_first(s1), cell(s1, 4)[0], cell(s1, 7)[0], cell(s1, 5)[0], cell(s1, 6)[0]
    reveal = [box_frame(f3, dx=-1), box_frame(f3, dx=1), box_frame(f4), box_frame(f4, dy=-1), box_frame(f7), box_frame(f7, dx=1), box_frame(f5), box_frame(f6)]
    # the moan (#8, the ghost heads): a pulse, growing and settling; the scene draws it faint
    g8 = ghost_cut(s1)
    moan = [box_frame(g8, sc=SCALE * s, dx=j) for s, j in ((0.92, 0), (0.99, -1), (1.06, 1), (1.12, -1), (1.06, 1), (0.99, 0))]
    POSE_DY = {'p4': 2, 'p5': 9, 'p6': 9, 'p7': 7, 'p8': 3}     # the dive and the swept-back poses carry the tail high above the eyes: seat them lower
    def P(k, **kw):
        kw['dy'] = kw.get('dy', 0) + POSE_DY.get(k, 0)
        return frame(cuts[k], **kw)
    bob = lambda i, amp=2: int(round(amp * np.sin(2 * np.pi * i / 8)))
    # which way a facing lunges on the screen (dx, dy per unit); the west side faces left, the east side is the mirror
    DIR = {0: (0, 1), 1: (-1, 1), 2: (-1, 0), 3: (-1, -1), 4: (0, -1), 5: (1, -1), 6: (1, 0), 7: (1, 1)}
    MIR = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 1, 7: 1}
    FLAP = ['p1', 'p2', 'p3', 'p3', 'p4', 'p4', 'p8', 'p1']      # the flap, slowed: out, up, up, swept back, back out
    frames = {'idle': [], 'walk': [], 'attack': [], 'hurt': [], 'fly': [], 'roost': [roost] * 8, 'reveal': [reveal] * 8, 'moan': [moan] * 8}
    for f in range(8):
        m = bool(MIR[f]); dxv, dyv = DIR[f]
        # the sheet as it was drawn, 1 to 8: the flight in and the dive (Griz: "a sequence to play at the end of the easter egg")
        frames['fly'].append([P('p%d' % (i + 1), mirror=m, dy=-2 + (i // 4) * 2) for i in range(8)])
        frames['idle'].append([P(FLAP[i], mirror=m, dy=bob(i)) for i in range(8)])
        walk = ['p1', 'p2', 'p3', 'p4', 'p8', 'p2', 'p3', 'p4']
        frames['walk'].append([P(walk[i], mirror=m, dy=bob(i + 2, 3), dx=(1 if dxv > 0 else -1 if dxv < 0 else 0) * (1 if i % 8 < 4 else 0)) for i in range(8)])
        # the attack: wings up, back a little (the wind-up), the dive at it three frames, and back
        seq = [('p1', 0, 0), ('p2', -3, 0), ('p3', -5, 0), ('p5', 6, 0), ('p6', 11, 0), ('p7', 11, 0), ('p8', 5, 0), ('p1', 1, 0)]
        frames['attack'].append([P(k, mirror=m, dx=dxv * o, dy=dyv * o * (0.6 if dyv > 0 else 0.2) + (-2 if k in ('p2', 'p3') else 0)) for k, o, _ in seq])
    # the death (played as `hurt`): a shake, the wings folding, and the fall into a heap on the ground (the same from every side)
    death = [P('p3', dx=-2), P('p3', dx=2, dy=2), P('p5', dy=6), P('p6', sx=1.0, sy=0.85, dy=18),
             P('p6', sx=1.05, sy=0.6, dy=32), P('p6', sx=1.12, sy=0.42, dy=40), P('p6', sx=1.18, sy=0.33, dy=44), P('p6', sx=1.2, sy=0.28, dy=46)]
    for f in range(8):
        frames['hurt'].append(death if not MIR[f] else [frame(cuts['p3'], mirror=True, dx=2)] + [frame(cuts[k], mirror=True, **kw) for k, kw in
                             [('p3', dict(dx=-2, dy=2)), ('p5', dict(dy=6)), ('p6', dict(sy=0.85, dy=18)), ('p6', dict(sx=1.05, sy=0.6, dy=32)),
                              ('p6', dict(sx=1.12, sy=0.42, dy=40)), ('p6', dict(sx=1.18, sy=0.33, dy=44)), ('p6', dict(sx=1.2, sy=0.28, dy=46))]])
    # ART-46 (10-21): S, SE (SW mirrored), NE (NW mirrored) and N drawn from their own views in every row the engine plays; E and W keep
    # the side poses (RULED 10-14, five drawn views); the roost, the reveal and the moan stay as they were in every facing
    hd = heads46(check)
    for f, rows in ((0, hd['S']), (1, {r: mirror46(fs) for r, fs in hd['SE'].items()}), (3, {r: mirror46(fs) for r, fs in hd['NE'].items()}),
                    (4, hd['N']), (5, hd['NE']), (7, hd['SE'])):
        for r, fs in rows.items():
            frames[r][f] = fs
    for r in ('idle', 'walk', 'attack', 'hurt', 'fly'):
        assert len({len(x) for x in frames[r]}) == 1, r     # a row plays one frame count in every facing
    for t in CLIPPED:
        print('  CLIPPED', t)
    if check:
        facings(frames)
        return
    top = pix.top_of(frames['idle'][0] + frames['idle'][6], AY)
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, top)
    mp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(mp))
    for a, fps in (('idle', 5), ('walk', 9), ('attack', 12), ('hurt', 8), ('fly', 9), ('roost', 2), ('reveal', 6), ('moan', 8)):
        meta['anims'][a]['fps'] = fps
    meta['anims'] = {('swoop' if k == 'fly' else k): v for k, v in meta['anims'].items()}   # (its flight in, the egg's: `swoop` since 10-28 -- a sheet's `fly` row plays while its unit is aloft, js/ui.js)
    meta['source'] = ('generated by Griz (2026-09-29, the third cloaker sheet: the side poses, E and W, and the roost, reveal and moan) and the art '
                      'desk (2026-10-17, ART-46: S, SE, NE and N in every row), keyed, posed, cut and snapped by tools/cloaker-sheet.py')
    json.dump(meta, open(mp, 'w'), indent=1)


if __name__ == '__main__':
    if 'preview' in sys.argv:
        preview(cuts_all())
        print('preview written')
        sys.exit(0)
    if 'measure' in sys.argv:                            # K46 solved, page by page
        measure46()
        sys.exit(0)
    build(check='check' in sys.argv)

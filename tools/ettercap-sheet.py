"""DEEP16 pipeline 2 (generated art): Griz's two generated ettercap sheets -> the ettercap's palette sprite sheet.

    python tools/ettercap-sheet.py            builds deep16/art/ettercap_p2.png/.json
    python tools/ettercap-sheet.py preview    writes dev/shots/ettercap-cuts.png (each anim for S, E and N) and stops

Source: deep16/_src/ettercap_grok_1.png ("1/3 - movement & core") and ettercap_grok_2.png ("2/3 - combat & specials")
(Griz, 2026-09-29; a third sheet, the braiding idle, is owed: "22 more hours"). The labels lie about facings: the row
labelled WALK (LEFT) faces right in all four frames, and the WALK (RIGHT) row turns round halfway; so the side walk is the
"left" row, as drawn, and the west side is the east mirrored, as every generated sheet's is.
Page 1: idle 2 (front), walk front 4, walk back 5 (the first four used), the side walk 4, hit 3 (-> `flinch`, a blow that
doesn't drop it), death 6 (-> `hurt`, which the engine plays once when a creature goes down). Page 2: bite 6 (not used: one
attack anim a sheet), claw 6 (-> `attack`), web shot 6 (-> `cast`: ai.js webShot plays a sheet's `cast` row when it has
one), attack recovery 3 (-> the side idle, 1-2-3-2, drawn smaller on the page and scaled up to match). Not used: the web
garrote and reel rows (a victim is drawn into them), wall climb and ceiling crawl (nothing to climb on the grid), alert, web
spin. Each group of rows is scaled by its own standing height; each frame is placed on its torso, the web throw on its body's
left edge (the thrown web would drag the torso's middle to the right).
The third sheet (Griz, 2026-09-30, "idle variation: sitting & braiding silk (1/1)"): deep16/_src/ettercap_grok_3.webp, eight
frames of it on a mossy stump braiding a three-strand cord, -> `braid`. Cut from one common window (the ground stays put), scaled
so it sits SIT px from the stump's foot to the top of its bristles, every frame placed by its left edge plus the first frame's
torso offset (the cord swinging would drag a torso median about). The grid plays it as its idle until it has had a turn or been
hurt (deep16/js/ui.js unitObj: "It stops braiding when it sees you"). The close-up and the details panels are not used.
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)

SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.isdir(SRC):
    import subprocess
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')
NAME = 'ettercap_p2'
FW, FH, AX, AY = 136, 96, 68, 86         # (120 wide and AX 60 until 10-22: ART-39's NE web throw reaches 65 px past the torso)
H = 52                                  # standing, in px: a man's height, hunched (the heroes stand ~50)


def load(name):
    a = np.asarray(Image.open(os.path.join(SRC, name)).convert('RGB')).astype(np.int32)
    vals, cnt = np.unique(a.reshape(-1, 3) // 4, axis=0, return_counts=True)
    return a, vals[np.argmax(cnt)] * 4 + 2                # the ground: the commonest colour


P1, BG1 = load('ettercap_grok_1.png')
P2, BG2 = load('ettercap_grok_2.png')
P3, BG3 = load('ettercap_grok_3.webp')
B3 = ((20, 125, 1520, 385), 8)                           # the strip of eight, below its title (the stump's foot at ~y 370)
SIT = 46                                                 # sitting on the stump: a little under its hunched standing height

# the rows' bands (x0, y0, x1, y1), how many frames each holds, and (the web row) the columns between its frames
B1 = {'front': ((20, 110, 320, 305), 2), 'wfront': ((340, 110, 910, 305), 4), 'wback': ((930, 110, 1520, 305), 5),
      'walk': ((20, 350, 720, 555), 4), 'hit': ((20, 595, 470, 785), 3), 'death': ((490, 595, 1525, 785), 6)}
B2 = {'claw': ((782, 103, 1515, 263), 6), 'recov': ((1145, 535, 1515, 668), 3),
      'web': ((20, 330, 765, 478), 6, [105, 215, 348, 456, 576])}   # (frame 4's web tip overlaps frame 5's claws)


# The five views (10-22, the monster cutter seat's second run): the art desk's ART-39 in deep16/_src/ettercap/ART-39/ (sorted out of Fresh by
# _src/art-desk/sort-delivery.py; its papers in _src/art-desk/received-2026-10-22-ART-39-ettercap-FINAL-SHEETS/): HEAD 1 SE on four pages
# (Idle 8, Walk 8; Claw 6; Web Shot 6; Hit 3, Death 6, Braid 8), HEAD 2 NE on three, HEAD 3 S and HEAD 5 N their Web Shot, Hit, Death and
# Braid. On near-black with lavender labels: cut by tools/sheetrows.py with `chan` (any channel 24 off the page's ground; the default grey
# test takes that ground for figure), each row's name at its left, its numbers under it; boxes read off the pages. SE and SW, NE and NW take
# every row; S and N their cast, flinch, hurt and braid (Griz's sheets keep their idle, walk and claw, as the art desk's brief says).
# Scale by height: this sheet stands 52 side-on and from the front, 50 from behind (H, every group by its standing height), so each view's
# standing frame meets its own: SE and NE their Idle against the side and the front or back (52, 51); a later page by its first standing
# frame (Claw 1, Web Shot 1, Death 1) against its view's Idle 1; S and N by Death 1 against the front's and the back's idles. Placed as the
# page drew them: each row's first frame with its torso on AX and its lowest row on AY, the rest against their numbers and the row's ground
# (the web thrown, the fall, the stump all where the page put them). Through `fit` (the hide's purple kept) as Griz's sheets are.
ART39 = {
  'H1P1': dict(file='ART-39_HEAD-1_PAGE-1.png', W=1881, text=[(27, 89, 145, 132), (26, 454, 150, 507)],
               rows=[('idle', (0, 0, 1881, 408), (379, 408), 8), ('walk', (0, 409, 1881, 789), (760, 789), 8)]),
  'H1P2': dict(file='ART-39_HEAD-1_PAGE-2.png', W=2172, text=[(67, 45, 228, 105)], rows=[('attack', (0, 0, 2172, 645), (599, 645), 6)]),
  'H1P3': dict(file='ART-39_HEAD-1_PAGE-3.png', W=2172, text=[(27, 185, 219, 229)], rows=[('cast', (0, 0, 2172, 582), (544, 582), 6)]),
  'H1P4': dict(file='ART-39_HEAD-1_PAGE-4.png', W=1536, text=[(50, 49, 127, 93), (50, 381, 181, 423), (51, 688, 172, 732)],
               rows=[('flinch', (0, 0, 1536, 369), (343, 369), 3), ('hurt', (0, 370, 1536, 687), (659, 687), 6), ('braid', (0, 688, 1536, 988), (960, 988), 8)]),
  'H2P1': dict(file='ART-39_HEAD-2_PAGE-1.png', W=2172, text=[(25, 156, 162, 199), (26, 481, 198, 537)],
               rows=[('idle', (0, 0, 2172, 345), (320, 345), 8), ('walk', (0, 346, 2172, 677), (652, 677), 8)]),
  'H2P2': dict(file='ART-39_HEAD-2_PAGE-2.png', W=2172, text=[(23, 166, 178, 211), (23, 501, 231, 544)],
               rows=[('attack', (0, 0, 2172, 353), (327, 353), 6), ('cast', (0, 354, 2172, 701), (672, 701), 6)]),   # (Web Shot 4's net tops out at y 354)
  'H2P3': dict(file='ART-39_HEAD-2_PAGE-3.png', W=2172, text=[(26, 119, 146, 159), (26, 332, 189, 373), (27, 557, 220, 611)],
               rows=[('flinch', (0, 0, 2172, 249), (225, 249), 3), ('hurt', (0, 250, 2172, 480), (456, 480), 6), ('braid', (0, 481, 2172, 711), (686, 711), 8)]),
  'H3P1': dict(file='ART-39_HEAD-3_PAGE-1.png', W=1536, text=[(13, 100, 177, 135), (13, 325, 231, 375), (13, 574, 146, 610), (13, 789, 131, 824)],
               rows=[('cast', (0, 0, 1536, 252), (229, 252), 6), ('flinch', (0, 253, 1536, 500), (477, 500), 3), ('hurt', (0, 501, 1536, 731), (709, 731), 6),
                     ('braid', (0, 732, 1536, 990), (967, 990), 8)]),
  'H5P1': dict(file='ART-39_HEAD-5_PAGE-1.png', W=1536, text=[(23, 92, 122, 159), (25, 354, 98, 390), (24, 555, 137, 591), (24, 766, 124, 802)],
               rows=[('cast', (0, 0, 1536, 288), (262, 288), 6), ('flinch', (0, 289, 1536, 519), (493, 519), 3), ('hurt', (0, 520, 1536, 746), (714, 746), 6),
                     ('braid', (0, 747, 1536, 991), (964, 991), 8)]),
}
VIEWS39 = {'SE': ('H1P1', 'H1P2', 'H1P3', 'H1P4'), 'NE': ('H2P1', 'H2P2', 'H2P3'), 'S': ('H3P1',), 'N': ('H5P1',)}
CHAN39 = 24
FIX39 = {'H1P3': {'cast': [((1290, 330, 1535, 510), '4')]}}    # SE Web Shot 4's net, loose threads past the midpoint to 5's number: all 4's


def art39(idle_h):
    """-> {view: {anim: [FH x FW frames]}} from ART-39's pages; idle_h the game-size standing heights {'side':, 'S':, 'N':}"""
    spec = importlib.util.spec_from_file_location('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))
    SR = importlib.util.module_from_spec(spec); spec.loader.exec_module(SR)
    tall = lambda a: int(np.ptp(np.where(a[..., 3].any(axis=1))[0]) + 1)
    def body(im):                                        # the page frame's height: its biggest piece filled (a web shred or a strand left out)
        m = np.asarray(im)[..., 3] > 0
        lab, n = ndimage.label(m, structure=np.ones((3, 3)))
        m = lab == 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
        ys = np.where(m.any(axis=1))[0]
        return float(ys[-1] - ys[0] + 1)
    cuts = {}
    for L, s in ART39.items():
        path = os.path.join(SRC, 'ettercap', 'ART-39', s['file'])
        a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
        sp = dict(text=s['text'] + [(0, l0 - 3, s['W'], l1 + 4) for _, _, (l0, l1), _ in s['rows']],
                  rows=[(r, b, l, [str(i + 1) for i in range(n)]) for r, b, l, n in s['rows']], chan=CHAN39)
        got = SR.cut_sheet(path, sp, fix=FIX39.get(L), tag=L)
        lx = {r: SR.label_xs(a, b[0], b[2], l[0], l[1]) for r, b, l, _ in s['rows']}
        cuts[L] = {r: [(im, box, lx[r][i]) for i, (_, im, box) in enumerate(frs)] for r, frs in got.items()}

    def k_for(ims, target):                              # page px a game px: the fitted frames' median height meets target
        lo, hi = 1.5, 16.0
        for _ in range(24):
            k = (lo + hi) / 2
            got = float(np.median([tall(fit_pad(im, k)) for im in ims]))
            lo, hi = (k, hi) if got > target else (lo, k)
        return (lo + hi) / 2
    K = {}
    for v, ls in VIEWS39.items():
        if v in ('SE', 'NE'):
            p1 = ls[0]
            K[p1] = k_for([im for im, _, _ in cuts[p1]['idle']], (idle_h['side'] + idle_h['S' if v == 'SE' else 'N']) / 2)
            ref = float(np.median([body(im) for im, _, _ in cuts[p1]['idle'][:1]]))
            for L in ls[1:]:
                first = cuts[L]['hurt'][0][0] if 'hurt' in cuts[L] else next(iter(cuts[L].values()))[0][0]
                K[L] = K[p1] * body(first) / ref
        else:
            K[ls[0]] = k_for([cuts[ls[0]]['hurt'][0][0]], idle_h[v])
    print('  ART-39 K: ' + ', '.join('%s %.2f' % (L, K[L]) for L in ART39) +
          '; standing %.0f side-on, %.0f from the front, %.0f from behind' % (idle_h['side'], idle_h['S'], idle_h['N']))
    out, lost = {}, []
    for v, ls in VIEWS39.items():
        out[v] = {}
        for L in ls:
            k = K[L]
            for an, frs in cuts[L].items():
                fits = [fit_pad(im, k) for im, _, _ in frs]
                rel = [((box[0] - x) / k, box[3] / k) for _, box, x in frs]     # (each frame's left against its number, its foot on the row's ground)
                tx = torso_x(fits[0])
                row = []
                for a, (rx, rb) in zip(fits, rel):
                    ox = int(round(AX - tx + (rx - rel[0][0])))
                    oy = int(round(AY + (rb - rel[0][1]))) - (np.where(a[..., 3].any(axis=1))[0][-1])
                    fr = np.zeros((FH, FW, 4), dtype=np.uint8)
                    h, w = a.shape[:2]
                    y0, x0, y1, x1 = max(0, oy), max(0, ox), min(FH, oy + h), min(FW, ox + w)
                    fr[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
                    if (fr[..., 3] > 0).sum() < (a[..., 3] > 0).sum():
                        lost.append('%s %s %d (rows %d..%d cols %d..%d)' % (L, an, len(row) + 1, oy, oy + h - 1, ox, ox + w - 1))
                    row.append(fr)
                out[v][an] = row
    if lost:
        raise SystemExit('ART-39 cut off at the frame edge: ' + '; '.join(lost))
    return out


def frames_in(sheet, bg, band, n, splits=None):
    """the n figures in a row's band, left to right: cut RGBA images."""
    x0, y0, x1, y1 = band
    c = sheet[y0:y1, x0:x1]
    m = np.abs(c - bg).sum(-1) > 45
    if splits is None:
        m = ndimage.binary_closing(m, iterations=2)
    lab, k = ndimage.label(m)
    comps = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        area = int((lab[sl] == i + 1).sum())
        if area < (20 if splits else 300) or w > 260 or (h < 14 and w > 60):  # a number, a title's word, a panel's rule
            continue
        ys, xs = np.where(lab[sl] == i + 1)
        comps.append({'id': i + 1, 'x0': sl[1].start, 'x1': sl[1].stop, 'area': area, 'cx': sl[1].start + xs.mean()})
    comps.sort(key=lambda d: d['x0'])
    if splits:                                            # by the column its middle falls in
        edges = [0] + [s - x0 for s in splits] + [c.shape[1]]
        groups = [{'ids': [d['id'] for d in comps if edges[j] <= d['cx'] < edges[j + 1]]} for j in range(n)]
        groups = [g for g in groups if g['ids']]
    else:                                                 # pieces that share columns are one figure (a claw held clear)
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
        if splits is None:
            mm = ndimage.binary_fill_holes(mm)
        ys, xs = np.where(mm)
        cc = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        am = mm[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        out.append(Image.fromarray(np.dstack([cc.astype(np.uint8), (am * 255).astype(np.uint8)]), 'RGBA'))
    return out


def frames_common(sheet, bg, band, n):
    """the n figures in a band, cut over one common window (the row's own top to its lowest foot), so the ground stays put:
    (RGBA images, each figure's left edge in the window)."""
    x0, y0, x1, y1 = band
    c = sheet[y0:y1, x0:x1]
    m0 = np.abs(c - bg).sum(-1) > 45
    lab, k = ndimage.label(ndimage.binary_closing(m0, iterations=2))
    groups = []
    for i, sl in sorted(enumerate(ndimage.find_objects(lab)), key=lambda t: t[1][1].start):
        if int((lab[sl] == i + 1).sum()) < 300:
            continue
        if groups and sl[1].start <= groups[-1]['x1'] + 6:            # a claw or a strand held clear: the same figure
            g = groups[-1]; g['ids'].append(i + 1); g['x1'] = max(g['x1'], sl[1].stop); g['y0'] = min(g['y0'], sl[0].start); g['y1'] = max(g['y1'], sl[0].stop)
        else:
            groups.append({'ids': [i + 1], 'x0': sl[1].start, 'x1': sl[1].stop, 'y0': sl[0].start, 'y1': sl[0].stop})
    assert len(groups) == n, (band, len(groups))
    ty, by = min(g['y0'] for g in groups), max(g['y1'] for g in groups)
    out = []
    for g in groups:
        mm = ndimage.binary_fill_holes(np.isin(lab, g['ids']) & m0)[ty:by, g['x0']:g['x1']]
        out.append(Image.fromarray(np.dstack([c[ty:by, g['x0']:g['x1']].astype(np.uint8), (mm * 255).astype(np.uint8)]), 'RGBA'))
    return out, by - ty


def purple(img, sat=1.8, val=1.18):
    """the hide's muted purple kept through the snap: the palette has no purple-grey, and as drawn the hide snaps to the
    silver ramp's slate and reads near black; saturated and lifted a little, the dark cool purples land in the violet ramp.
    The pale belly, the red eyes and the claws are left as drawn."""
    a = np.asarray(img, dtype=np.float32) / 255
    rgb = a[..., :3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn + 1e-6
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    m = ((h > 225) | (h < 10)) & (mx < 0.62) & (d > 0.03)
    gr = rgb.mean(-1, keepdims=True)
    out = np.where(m[..., None], np.clip((gr + (rgb - gr) * sat) * val, 0, 1), rgb)
    return Image.fromarray(np.dstack([(out * 255).astype(np.uint8), (a[..., 3] * 255).astype(np.uint8)]), 'RGBA')


def fit(img, scale):
    w, h = img.size
    img = img.resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX)
    return pix.pixelate(purple(img), 1, do_lift=False)


def fit_pad(img, scale):
    """fit(), with a pixel of room all round for the outline (the stump's foot is the window's bottom row)."""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / scale)), max(1, round(h / scale))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(purple(pad), 1, do_lift=False)


def place_foot(a, x_ref):
    """the cut onto the frame with its bottom row (the window's ground, outline and all) on AY."""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = int(round(AX - x_ref)), AY - (a.shape[0] - 1)
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def torso_x(a):
    """the middle of the body: the median opaque column over the torso's rows (a claw and a raised arm are thin)."""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 25 // 100: top + (bot - top) * 65 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def left_x(a):
    cols = np.where(a[..., 3].any(axis=0))[0]
    return float(cols[0])


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


def build():
    r1 = {k: frames_in(P1, BG1, *v) for k, v in B1.items()}
    r2 = {k: frames_in(P2, BG2, *v) for k, v in B2.items()}
    hmean = lambda ims: np.mean([im.size[1] for im in ims])
    s1 = hmean(r1['walk']) / H                               # page 1, by the side walk's height
    s2 = hmean(r2['claw'][:2]) / H                           # page 2, by the claw row's two standing frames
    s3 = hmean(r2['recov']) / H                              # the recovery panel is drawn smaller
    on = lambda ims, s: [place(a, torso_x(a)) for a in (fit(im, s) for im in ims)]
    walk_r, hit_r, death_r = on(r1['walk'], s1), on(r1['hit'], s1), on(r1['death'], s1)
    front, wfront, wback = on(r1['front'], s1), on(r1['wfront'], s1), on(r1['wback'][:4], s1)
    claw_r, recov_r = on(r2['claw'], s2), on(r2['recov'], s3)
    web = [fit(im, s2) for im in r2['web']]
    lx = torso_x(web[0]) - left_x(web[0])                   # the body's middle from its left edge, before the throw
    web_r = [place(a, left_x(a) + lx) for a in web]
    mirror = lambda seq: [fr[:, ::-1].copy() for fr in seq]
    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)
    cuts3, wh = frames_common(P3, BG3, *B3)
    sit = [fit_pad(im, wh / SIT) for im in cuts3]
    lx3 = torso_x(sit[0]) - left_x(sit[0])
    braid_r = [place_foot(a, left_x(a) + lx3) for a in sit]

    idle_r = [recov_r[i] for i in (0, 0, 1, 1, 2, 2, 1, 1)]
    side = {'idle': idle_r, 'walk': walk_r * 2, 'attack': claw_r, 'hurt': death_r, 'flinch': hit_r, 'cast': web_r, 'braid': braid_r}
    fS, fN = front[0], wback[0]
    dip = lambda f0, d: [f0, shift(f0, 0, d), shift(f0, 0, 2 * d), shift(f0, 0, 3 * d), shift(f0, 0, d), f0]
    south = {'idle': [front[0]] * 4 + [front[1]] * 4, 'walk': wfront * 2, 'attack': dip(fS, 1),
             'hurt': death_r, 'flinch': hit_r, 'cast': web_r, 'braid': braid_r}
    north = {'idle': [fN] * 4 + [breathe(fN)] * 4, 'walk': wback * 2, 'attack': dip(fN, -1),
             'hurt': mirror(death_r), 'flinch': mirror(hit_r), 'cast': mirror(web_r), 'braid': mirror(braid_r)}
    tall = lambda a: int(np.ptp(np.where(a[..., 3].any(axis=1))[0]) + 1)
    d39 = art39({'side': tall(idle_r[0]), 'S': tall(front[0]), 'N': tall(fN)})     # ART-39 (10-22): the five views
    get = lambda v, a, base: d39[v].get(a, base)
    frames = {a: [] for a in side}
    for f in range(8):                                   # facings S, SW, W, NW, N, NE, E, SE
        for a in frames:
            frames[a].append(get('S', a, south[a]) if f == 0 else get('N', a, north[a]) if f == 4 else side[a] if f == 6 else
                             get('SE', a, side[a]) if f == 7 else get('NE', a, side[a]) if f == 5 else
                             mirror(get('SE', a, side[a])) if f == 1 else mirror(get('NE', a, side[a])) if f == 3 else mirror(side[a]))
    return frames


def preview(frames):
    k, rows = 2, []
    for a, fs in frames.items():
        for f in (0, 6, 4):
            strip = np.concatenate(fs[f], axis=1)
            rows.append(strip)
    w = max(r.shape[1] for r in rows)
    img = np.zeros((len(rows) * FH, w, 4), dtype=np.uint8); img[..., :3] = 96; img[..., 3] = 255
    for i, r in enumerate(rows):
        al = r[..., 3:4] / 255.0
        seg = img[i * FH:(i + 1) * FH, :r.shape[1], :3]
        img[i * FH:(i + 1) * FH, :r.shape[1], :3] = (r[..., :3] * al + seg * (1 - al)).astype(np.uint8)
        img[i * FH + AY, :r.shape[1], :3] = (140, 60, 60)             # the foot line
    out = os.path.join(ROOT, 'dev', 'shots', 'ettercap-cuts.png')
    Image.fromarray(img[..., :3]).resize((img.shape[1] * k, img.shape[0] * k), Image.NEAREST).save(out)
    print('  ' + out + '  (rows: ' + ', '.join(a + ' S/E/N' for a in frames) + ')')


if __name__ == '__main__':
    frames = build()
    if sys.argv[1:] == ['preview']:
        preview(frames); sys.exit()
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(meta_p))
    for a, fps in (('idle', 4), ('walk', 8), ('attack', 10), ('hurt', 8), ('flinch', 10), ('cast', 9), ('braid', 5)):
        meta['anims'][a]['fps'] = fps
    meta['source'] = ('generated by Griz (2026-09-29, two sheets; the braiding idle 2026-09-30), cut and snapped by tools/ettercap-sheet.py; '
                      'SE and NE every row and S and N their web shot, hit, death and braid drawn by the art desk (ART-39, 10-22)')
    json.dump(meta, open(meta_p, 'w'), indent=1)

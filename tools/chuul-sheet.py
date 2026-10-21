"""DEEP16 pipeline 2 (generated art): Griz's generated chuul sheets -> a palette sprite sheet.

    python tools/chuul-sheet.py

Source: deep16/_src/chuul_grok_1.webp and chuul_grok_2.webp (Griz, 2026-09-27, made with Grok). Page 1 is a turnaround
(front, three-quarter, side, back) in six render styles; the matcap_toon_light row is cut, the same look pipeline 1
renders with. Page 2 is a set of actions seen from the side, facing right: the walk, the claw, the death are cut.
The two pages were drawn in different hands (page 1 bright teal, page 2 darker green with tan claws), and the chuul is
"the colour of wet stone" (Griz, 09-27: "he's supposed to be more colored like a wet stone"), so both are regraded
the same way before the palette snap: the shell by its brightness onto wet slate (a glint kept on the highest lights),
the tentacles and gullet to a dull bruise-violet, the claw tips to bone, the eyes left yellow.
Facings (until ART-43): the front and back views take S and N; the side frames take the other six (mirrored for the west side).
ART-43 (10-21): the art desk drew the views the sheet lacked (RULED 10-14, five drawn views: S, SE, E, NE, N; SE mirrors to SW, E to W,
NE to NW), four pages in deep16/_src/chuul/ART-43/ (sorted out of Fresh by its ART-43-sort.py; the desk's papers in
_src/art-desk/received-2026-10-21-ART-43-chuul-FINAL-SHEETS/), cut by their own row and number labels (tools/sheetrows.py): HEAD 1 SE and
HEAD 2 NE Idle 4, Walk 5, Claw 4, Fall 4 (idle, walk, attack, hurt); HEAD 3 S and HEAD 5 N their Fall. E and W keep the side rows, S and N
the Front and Back stills for idle, walk and attack. Every page regraded as the Grok pages are (the shell by its brightness onto wet slate,
its own range), scaled by K43, each frame's shell middle on the anchor column and its lowest row on the foot, as the side rows stand.
    python tools/chuul-sheet.py check      dev/visions/chuul/: each ART-43 page's cut, every facing of every row
"""
import os, sys, json, subprocess
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)

spec = importlib.util.spec_from_file_location('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))
SR = importlib.util.module_from_spec(spec); spec.loader.exec_module(SR)

SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'chuul_grok_1.webp')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')
PAGE1 = np.asarray(Image.open(os.path.join(SRC, 'chuul_grok_1.webp')).convert('RGB')).astype(np.int32)
PAGE2 = np.asarray(Image.open(os.path.join(SRC, 'chuul_grok_2.webp')).convert('RGB')).astype(np.int32)
FW, FH, AX, AY = 220, 112, 110, 100      # (220 wide since ART-43, the anchor at its middle: the diagonals' pincers reach 102 px from the shell and
                                         # their falls sprawl 180 wide; every Grok frame placed against the anchor as before, 20 px of air each side)
FRONT_H, SIDE_H = 64, 61     # Large: a head taller than the humans' 56 from the front, the side a touch lower

# boxes (x0, y0, x1, y1), from a component pass over the sheets
FRONT, BACK = (212, 284, 389, 396), (930, 286, 1090, 396)          # page 1, the matcap_toon_light row
WALK = [(180, 56, 346, 148), (376, 56, 542, 148), (572, 57, 735, 148), (758, 56, 921, 147), (941, 57, 1104, 148)]
CLAW = [(181, 165, 343, 255), (389, 166, 578, 256), (617, 163, 831, 254), (887, 164, 1090, 256)]
DEATH = [(179, 670, 331, 756), (386, 682, 550, 756), (604, 684, 802, 757), (870, 690, 1083, 759)]


def cut(sheet, box, pad=6):
    x0, y0, x1, y1 = box
    c = sheet[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]
    m = c.sum(-1) > 36                                   # the ground is black; the drawing's own darks sit above it
    m = ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=2))
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = lab == (1 + int(np.argmax(sizes)))
    ys, xs = np.where(m)
    return c[ys.min():ys.max() + 1, xs.min():xs.max() + 1], m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def hsv(rgb):
    r, g, b = [rgb[..., i] for i in range(3)]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, (mx - mn) / (mx + 1e-6), mx


SLATE = np.array([[22, 25, 28], [52, 57, 61], [92, 98, 101], [138, 144, 145], [190, 196, 194]], dtype=np.float32) / 255


def regrade(c, m, lo, hi):
    """c: RGB 0-255 of one cut figure; lo/hi: the page's shell brightness at the 3rd and 98th percentile."""
    rgb = c.astype(np.float32) / 255
    h, s, v = hsv(rgb)
    lum = rgb @ np.array([0.3, 0.55, 0.15], dtype=np.float32)
    out = rgb.copy()
    violet = (h > 250) & (h < 335) & (s > 0.18)
    eye = (h > 40) & (h < 75) & (s > 0.45) & (v > 0.55)
    tan = (h >= 15) & (h <= 50) & (s > 0.2) & ~eye
    shell = ~(violet | eye | tan)
    # the shell by its brightness onto the slate ramp, a glint on the highest lights (it's wet)
    t = np.clip((lum - lo) / max(1e-3, hi - lo), 0, 1) ** 0.9
    k = t * (len(SLATE) - 1); i0 = np.floor(k).astype(int).clip(0, len(SLATE) - 2); f = (k - i0)[..., None]
    slate = SLATE[i0] * (1 - f) + SLATE[i0 + 1] * f
    slate = np.where((t > 0.9)[..., None], np.minimum(1, slate * 1.1), slate)
    out[shell] = slate[shell]
    g = lum[..., None]
    out[violet] = np.clip((g + (rgb - g) * 0.9) * 1.08, 0, 1)[violet]           # the tentacles: a bruise, dulled a little
    bone = np.array([0.78, 0.74, 0.66], dtype=np.float32)
    out[tan] = (bone * np.clip(lum / 0.6, 0.35, 1.1)[..., None])[tan]           # the claw tips: bone
    rgba = np.dstack([(np.clip(out, 0, 1) * 255).astype(np.uint8), (m * 255).astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')


def shell_range(sheet, boxes):
    vals = []
    for b in boxes:
        c, m = cut(sheet, b)
        rgb = c.astype(np.float32) / 255
        h, s, v = hsv(rgb)
        keep = m & ~(((h > 250) & (h < 335) & (s > 0.18)) | ((h > 15) & (h < 75) & (s > 0.2)))
        vals.append((rgb @ np.array([0.3, 0.55, 0.15], dtype=np.float32))[keep])
    v = np.concatenate(vals)
    return float(np.percentile(v, 3)), float(np.percentile(v, 98))


def figure(sheet, box, scale, rng):
    c, m = cut(sheet, box)
    img = regrade(c, m, *rng)
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


def breathe(fr):
    """the shell settles a pixel (the legs stay put)."""
    o = fr.copy()
    rows = np.where(fr[..., 3].any(axis=1))[0]
    mid = rows[0] + (rows[-1] - rows[0]) * 6 // 10
    o[rows[0] + 1:mid + 1] = fr[rows[0]:mid]
    o[rows[0]] = 0
    return o


# ART-43 (10-21): the art desk's four pages. Per page: text boxes (each row's name -- at its left, but HEAD 3's Fall over its first frame --
# and each number strip the width of the page), and the rows -- (the sheet's row, band x0 y0 x1 y1, its number strip). HEAD 1's and HEAD 2's
# Claw 4 lifts its pincer to the Walk's numbers: the Claw's band starts above them (a number lies wholly in its strip's box, a pincer not).
ART43 = os.path.join(SRC, 'chuul', 'ART-43')
PAGES43 = {
    'H1P1': dict(file='ART-43_HEAD-1_PAGE-1.png', W=1774, text=[(0, 99, 95, 134), (0, 314, 95, 349), (0, 540, 95, 576), (0, 747, 95, 782)],
                 rows=[('idle', (0, 15, 1774, 219), (195, 216)), ('walk', (0, 225, 1774, 419), (411, 433)),   # (the band ends over Claw 4's pincer, lifted into these numbers: HAND43)
                       ('attack', (0, 405, 1774, 661), (637, 658)), ('hurt', (0, 672, 1774, 869), (845, 866))]),
    'H2P1': dict(file='ART-43_HEAD-2_PAGE-1.png', W=1672, text=[(0, 103, 95, 137), (0, 322, 95, 357), (0, 546, 95, 580), (0, 763, 95, 798)],
                 rows=[('idle', (0, 15, 1672, 225), (202, 222)), ('walk', (0, 230, 1672, 435), (412, 432)),
                       ('attack', (0, 415, 1672, 675), (652, 672)), ('hurt', (0, 680, 1672, 892), (868, 889))]),
    'H3P1': dict(file='ART-43_HEAD-3_PAGE-1.png', W=2172, text=[(110, 128, 255, 186)], rows=[('hurt', (0, 186, 2172, 560), (519, 557))]),
    'H5P1': dict(file='ART-43_HEAD-5_PAGE-1.png', W=2172, text=[(0, 314, 130, 364)], rows=[('hurt', (0, 195, 2172, 570), (527, 567))]),
}
VIEWS43 = {'SE': 'H1P1', 'NE': 'H2P1', 'S': 'H3P1', 'N': 'H5P1'}
HAND43 = {('H1P1', 'walk'): [251, 593, 916, 1271, 1614], ('H1P1', 'attack'): [268, 618, 1067, 1436],
          ('H2P1', 'attack'): [265, 620, 1100, 1384]}   # a row's numbers' x by hand (the probe's): SE
# Claw 4's pincer gleams in the Walk's strip, a claw tip in its own; NE's Claw 3 printed at 984, given 1100: its pincer's lower jaw, parted from the
# pincer by the dark lines, holds a core of its own nearer Claw 4's number (the frames are placed by the shell, not by their numbers)
COUNT43 = {'idle': 4, 'walk': 5, 'attack': 4, 'hurt': 4}


def cut43(L, check=False):
    s = PAGES43[L]
    spec = dict(text=s['text'] + [(0, l0 - 3, s['W'], l1 + 4) for _, _, (l0, l1) in s['rows']],
                rows=[(r, b, l, [str(i + 1) for i in range(COUNT43[r])]) for r, b, l in s['rows']], chan=CHAN43)
    over = [] if check else None
    hand = {(b[0], l[0]): HAND43[(L, r)] for r, b, l in s['rows'] if (L, r) in HAND43}   # (sheetrows asks by the band's x0 and the strip's y0)
    orig = SR.label_xs
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    try:
        out = SR.cut_sheet(os.path.join(ART43, s['file']), spec, overlay=over, tag=L)
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'chuul'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%s.png' % L))
    return out


CHAN43 = 30            # the mask: any one channel this far from the page's navy (the shell's darks are teal-black, neither grey nor far by the sum)


def page_range(cuts):
    """a page's shell brightness, 3rd and 98th percentile, as shell_range reads a Grok page's"""
    vals = []
    for frs in cuts.values():
        for _, im, _ in frs:
            a = np.asarray(im)
            rgb = a[..., :3].astype(np.float32) / 255
            h, s, v = hsv(rgb)
            keep = (a[..., 3] > 0) & ~(((h > 250) & (h < 335) & (s > 0.18)) | ((h > 15) & (h < 75) & (s > 0.2)))
            vals.append((rgb @ np.array([0.3, 0.55, 0.15], dtype=np.float32))[keep])
    v = np.concatenate(vals)
    return float(np.percentile(v, 3)), float(np.percentile(v, 98))


def fig43(im, k, rng):
    a = np.asarray(im)
    img = regrade(a[..., :3].astype(np.int32), a[..., 3] > 0, *rng)
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0)); pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


def core_x(a):
    """the shell's thick middle (the legs and the pincers are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def k43(frs, rng, area):
    """the K at which a row's frames come out `area` px drawn at game size (the median, outline in)"""
    lo, hi = 1.5, 12.0
    for _ in range(22):
        k = (lo + hi) / 2
        got = float(np.median([(fig43(im, k, rng)[..., 3] > 0).sum() for _, im, _ in frs]))
        lo, hi = (k, hi) if got > area else (lo, k)
    return (lo + hi) / 2


def heads43(side_idle, front, back, check=False):
    """ART-43's pages -> {view: {row: [frame, ...]}} at game size, each frame's shell middle on AX and its lowest row on AY. K by area: the
    diagonals' Idle (the median) against the side idle and the front still between them (a diagonal sees the shell between the two); S's and
    N's Fall 1 (standing, before it drops) against the Front and Back stills."""
    drawn = lambda a: int((a[..., 3] > 0).sum())
    cuts = {L: cut43(L, check) for L in PAGES43}
    rng = {L: page_range(c) for L, c in cuts.items()}
    K = {'H1P1': k43(cuts['H1P1']['idle'], rng['H1P1'], (drawn(side_idle) + drawn(front)) / 2),
         'H2P1': k43(cuts['H2P1']['idle'], rng['H2P1'], (drawn(side_idle) + drawn(front)) / 2),
         'H3P1': k43(cuts['H3P1']['hurt'][:1], rng['H3P1'], drawn(front)),
         'H5P1': k43(cuts['H5P1']['hurt'][:1], rng['H5P1'], drawn(back))}
    print('  K43: ' + ', '.join('%s %.2f' % kv for kv in K.items()) + '; the shell ranges ' + ', '.join('%s %.2f-%.2f' % ((L,) + r) for L, r in rng.items()))
    out = {}
    for v, L in VIEWS43.items():
        out[v] = {}
        for r, frs in cuts[L].items():
            row = []
            for nm, im, _ in frs:
                a = fig43(im, K[L], rng[L])
                fr = place(a, core_x(a))
                if (fr[..., 3] > 0).sum() < (a[..., 3] > 0).sum():
                    raise SystemExit('chuul %s %s %s: cut off at the frame edge' % (L, r, nm))
                row.append(fr)
            out[v][r] = row
    return out


def main(check=False):
    s1 = (FRONT[3] - FRONT[1]) / FRONT_H
    s2 = np.mean([b[3] - b[1] for b in WALK]) / SIDE_H
    r1, r2 = shell_range(PAGE1, [FRONT, BACK]), shell_range(PAGE2, WALK + CLAW)
    front, back = figure(PAGE1, FRONT, s1, r1), figure(PAGE1, BACK, s1, r1)
    centre = lambda a: np.where(a[..., 3].any(axis=0))[0].mean()
    fS, fN = place(front, centre(front)), place(back, centre(back))

    walk = [figure(PAGE2, b, s2, r2) for b in WALK]
    half = walk[0].shape[1] / 2                          # the rear of the shell holds still; the body's middle on the foot
    side = lambda a: place(a, left_x(a) + half)
    walk_r = [side(a) for a in walk]
    claw_r = [side(figure(PAGE2, b, s2, r2)) for b in CLAW]
    death_r = [side(figure(PAGE2, b, s2, r2)) for b in DEATH]
    mirror = lambda seq: [fr[:, ::-1].copy() for fr in seq]
    walk_l, claw_l, death_l = mirror(walk_r), mirror(claw_r), mirror(death_r)
    idle_r = walk_r[0]; idle_l = walk_l[0]

    shift = lambda fr, dx, dy: np.roll(np.roll(fr, dx, axis=1), dy, axis=0)
    frames = {'idle': [], 'walk': [], 'attack': [], 'hurt': []}
    # facings S, SW, W, NW, N, NE, E, SE
    for f in range(8):
        if f == 0:
            b = fS
            frames['idle'].append([b, b, breathe(b), breathe(b)])
            frames['walk'].append([shift(b, 0, -(i % 2)) for i in range(5)])
            frames['attack'].append([b, shift(b, 0, 2), shift(b, 0, 4), shift(b, 0, 2)])
            frames['hurt'].append(death_r)
        elif f == 4:
            b = fN
            frames['idle'].append([b, b, breathe(b), breathe(b)])
            frames['walk'].append([shift(b, 0, -(i % 2)) for i in range(5)])
            frames['attack'].append([b, shift(b, 0, -2), shift(b, 0, -4), shift(b, 0, -2)])
            frames['hurt'].append(death_l)
        elif f in (5, 6, 7):
            frames['idle'].append([idle_r, idle_r, breathe(idle_r), breathe(idle_r)])
            frames['walk'].append(walk_r); frames['attack'].append(claw_r); frames['hurt'].append(death_r)
        else:
            frames['idle'].append([idle_l, idle_l, breathe(idle_l), breathe(idle_l)])
            frames['walk'].append(walk_l); frames['attack'].append(claw_l); frames['hurt'].append(death_l)
    # ART-43 (10-21): SE (SW mirrored) and NE (NW mirrored) every row, S and N their fall, in their own view (RULED 10-14, five drawn views)
    hd = heads43(idle_r, fS, fN, check)
    flip = lambda seq: [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]      # (a pixel back: the anchor column stays put, FW even)
    for f, v, m in ((7, 'SE', False), (1, 'SE', True), (5, 'NE', False), (3, 'NE', True), (0, 'S', False), (4, 'N', False)):
        for r, fs in hd[v].items():
            frames[r][f] = flip(fs) if m else fs
    for r, rows in frames.items():
        assert len({len(x) for x in rows}) == 1, r       # a row plays one frame count in every facing
    if check:
        facings(frames)
        return
    pix.write_sheet('chuul_p2', frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'chuul_p2.json')
    meta = json.load(open(meta_p))
    meta['anims']['idle']['fps'] = 2; meta['anims']['walk']['fps'] = 8; meta['anims']['attack']['fps'] = 8; meta['anims']['hurt']['fps'] = 6
    meta['source'] = ('generated by Griz with Grok (2026-09-27; the side rows, the Front and Back stills) and the art desk (2026-10-17, ART-43: SE and NE '
                      'every row, the fall from the front and behind), regraded to wet stone and cleaned by tools/chuul-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(frames):
    """dev/visions/chuul/facings-<row>.png: every facing of every row, S SW W NW N NE E SE top to bottom, 2x on grey, the foot's line drawn"""
    from PIL import ImageDraw
    d = os.path.join(ROOT, 'dev', 'visions', 'chuul'); os.makedirs(d, exist_ok=True)
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
    print('  wrote', d)


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])

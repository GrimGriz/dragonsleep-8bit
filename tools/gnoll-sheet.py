"""DEEP16 pipeline 2 (generated art): Griz's generated gnoll sheets -> two palette sprite sheets, the gnoll and the glory-seeker.

    python tools/gnoll-sheet.py

Source: deep16/_src/gnoll_grok_1.png and gnoll_grok_2.webp (Griz, 2026-09-28, generated; "Hilly Tribe"). Page 1: a turnaround
(front, right, back, left) and rows facing right: idle 8 (a three-quarter view), walk 8, run 8, attack 8 (the spear), hurt 6,
death 7. Page 2: idle variations seen from the front, sit, climb, jump, fall, a second hurt, a thrown spear, emotes, and four
back views. RULED 09-28 (Griz): the gnolls in the Hills' blue cloth as drawn, the Snoot's glory-seekers in the Desert tribe's
red ("blue and red as above is good"); no boss versions yet.
Facings: the side rows take the six sideways facings (mirrored for the west side); page 2's front idle takes S, its back views
N. The death row plays as `hurt` (the engine plays it once when a creature goes down), as the chuul's and the crawler's do.
Each group of rows is scaled by its own standing height, so every figure stands the same height (a gnoll is 7 ft and more:
a head over the humans' ~50 px). The frames are found by a component pass inside each row's band (the numbers and the panel
rules dropped by their size), and each is placed on its torso, so the tail and the spear swing without moving the body.
"""
import os, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)

SRC = os.path.join(ROOT, 'deep16', '_src')


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


def fit(img, scale, recolour):
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

    frames = {'idle': [], 'walk': [], 'attack': [], 'hurt': [], 'laugh': [], 'prone': [], 'getup': []}
    for f in range(8):                                   # facings S, SW, W, NW, N, NE, E, SE
        west = f in (1, 2, 3, 4)
        frames['laugh'].append(laugh_l if west else laugh_r); frames['prone'].append(prone_l if west else prone_r); frames['getup'].append(getup_l if west else getup_r)
        if f == 0:
            frames['idle'].append([fS] * 4 + [breathe(fS)] * 4)
            frames['walk'].append([shift(fS, 0, -(i % 2)) for i in range(8)])
            frames['attack'].append([fS, fS, shift(fS, 0, 1), shift(fS, 0, 3), shift(fS, 0, 4), shift(fS, 0, 3), shift(fS, 0, 1), fS])
            frames['hurt'].append(death_r)
        elif f == 4:
            loop = [fN[0], fN[1], fN[2], fN[1]]
            frames['idle'].append([x for x in loop for _ in (0, 1)])
            frames['walk'].append([shift(loop[i % 4], 0, -(i % 2)) for i in range(8)])
            frames['attack'].append([fN[0], fN[0], shift(fN[0], 0, -1), shift(fN[0], 0, -3), shift(fN[0], 0, -4), shift(fN[0], 0, -3), shift(fN[0], 0, -1), fN[0]])
            frames['hurt'].append(death_l)
        elif f in (5, 6, 7):
            frames['idle'].append(idle_r); frames['walk'].append(walk_r); frames['attack'].append(atk_r); frames['hurt'].append(death_r)
        else:
            frames['idle'].append(idle_l); frames['walk'].append(walk_l); frames['attack'].append(atk_l); frames['hurt'].append(death_l)
    for extra in ('laugh', 'getup'):                                      # (named here, not in pixelate.py: this cutter's own rows)
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    pix.write_sheet(name, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    meta['anims']['idle']['fps'] = 5; meta['anims']['walk']['fps'] = 10; meta['anims']['attack']['fps'] = 12; meta['anims']['hurt']['fps'] = 8
    meta['anims']['prone']['fps'] = 8; meta['anims']['getup']['fps'] = 8; meta['anims']['laugh']['fps'] = 6   # (the laugh's own beats are grimoire.js M.LAUGH's; fps is for a plain play)
    meta['source'] = 'generated by Griz (2026-09-28, two sheets), cut and snapped by tools/gnoll-sheet.py' + (', the cloth recoloured to the Desert tribe\'s red' if recolour else ', the Hills\' blue as drawn')
    json.dump(meta, open(meta_p, 'w'), indent=1)


if __name__ == '__main__':
    build('gnoll_p2', None)
    build('gloryseeker_p2', red_cloth)

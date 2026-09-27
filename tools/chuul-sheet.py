"""DEEP16 pipeline 2 (generated art): Griz's generated chuul sheets -> a palette sprite sheet.

    python tools/chuul-sheet.py

Source: deep16/_src/chuul_grok_1.webp and chuul_grok_2.webp (Griz, 2026-09-27, made with Grok). Page 1 is a turnaround
(front, three-quarter, side, back) in six render styles; the matcap_toon_light row is cut, the same look pipeline 1
renders with. Page 2 is a set of actions seen from the side, facing right: the walk, the claw, the death are cut.
The two pages were drawn in different hands (page 1 bright teal, page 2 darker green with tan claws), and the chuul is
"the colour of wet stone" (Griz, 09-27: "he's supposed to be more colored like a wet stone"), so both are regraded
the same way before the palette snap: the shell by its brightness onto wet slate (a glint kept on the highest lights),
the tentacles and gullet to a dull bruise-violet, the claw tips to bone, the eyes left yellow.
Facings: the front and back views take S and N; the side frames take the other six (mirrored for the west side).
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)

SRC = os.path.join(ROOT, 'deep16', '_src')
PAGE1 = np.asarray(Image.open(os.path.join(SRC, 'chuul_grok_1.webp')).convert('RGB')).astype(np.int32)
PAGE2 = np.asarray(Image.open(os.path.join(SRC, 'chuul_grok_2.webp')).convert('RGB')).astype(np.int32)
FW, FH, AX, AY = 180, 112, 90, 100
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


def main():
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
    pix.write_sheet('chuul_p2', frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'chuul_p2.json')
    meta = json.load(open(meta_p))
    meta['anims']['idle']['fps'] = 2; meta['anims']['walk']['fps'] = 8; meta['anims']['attack']['fps'] = 8; meta['anims']['hurt']['fps'] = 6
    meta['source'] = 'generated by Griz with Grok (2026-09-27), regraded to wet stone and cleaned by tools/chuul-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)


if __name__ == '__main__':
    main()

"""DEEP16 pipeline 2 (generated art): Griz's generated cloaker sheets -> the cloaker's palette sprite sheet.

    python tools/cloaker-sheet.py            builds deep16/art/cloaker_p2.png/.json
    python tools/cloaker-sheet.py preview    writes dev/shots/cloaker-cuts.png (the sixteen cut-outs, numbered) and stops

Source: deep16/_src/cloaker_grok_1.png and cloaker_grok_2.png (Griz, 2026-09-29, generated; deep16-art-wanted.md #1). Both are eight
panels (4 x 2) on a baked checkerboard:
  sheet 1: 1-2 the roost (a cloak hung on the roof), 3 unfurling, 4 front view, 5-6 flying to the left (side), 7 wrapped round its
           prey (the engulf), 8 the phantasm's ghost
  sheet 2: 1-4 the manta from the front, turned left, left, front, right (fangs, red eyes); 5-8 the back (the six eye-spots), wings
           high, wings wide, banked left, banked right
The ground is found as the neutral light pixels joined to a panel's edge (the checker's two greys), the numbers and rules dropped
by size and place. There is no run of frames to play, only poses, so the anims are made from them: the hover is a bob and a two-pose
flutter, the attack a lunge (the wrapped pose at its height), the death (played as `hurt`, as the gnolls' and chuul's are) a fall
into a heap of cloak. The face close-up (js/ui.js scene `face`) draws the front pose blown up.
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
CW, CH = 292, 392                       # one panel
FW, FH, AX, AY = 128, 120, 64, 104      # a frame; the foot (the shadow) at AX, AY; it hovers above it
NAME = 'cloaker_p2'


def cell(sheet, n):
    """panel n (1..8) of a sheet: RGBA cut-out, the checker keyed out."""
    col, row = (n - 1) % 4, (n - 1) // 4
    x0, y0 = col * CW + 4, row * CH + 4
    c = sheet[y0:y0 + CH - 8, x0:x0 + CW - 8]
    mx, mn = c.max(-1), c.min(-1)
    bgm = ((mx - mn) <= 8) & (mx >= 190)                  # the checker's greys and white
    lab, k = ndimage.label(bgm)
    h, w = bgm.shape
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
        if area < 300 or (y1 < 52 and x1 < 80):           # a speck; the panel's number
            continue
        keep |= lab == i + 1
    keep = ndimage.binary_fill_holes(keep)
    keep = ndimage.binary_erosion(keep, iterations=1)      # the halo of the checker
    ys, xs = np.where(keep)
    cc = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    am = keep[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray(np.dstack([cc.astype(np.uint8), (am * 255).astype(np.uint8)]), 'RGBA')


def load(n):
    return np.asarray(Image.open(os.path.join(SRC, 'cloaker_grok_%d.png' % n)).convert('RGB')).astype(np.int32)


def preview(cuts):
    from PIL import ImageDraw
    W = 4 * 300; H = 4 * 300
    im = Image.new('RGBA', (W, H), (60, 60, 90, 255))
    d = ImageDraw.Draw(im)
    for i, (key, c) in enumerate(cuts.items()):
        col, row = i % 4, i // 4
        s = min(280 / c.size[0], 280 / c.size[1], 1)
        cc = c.resize((max(1, int(c.size[0] * s)), max(1, int(c.size[1] * s))))
        im.alpha_composite(cc, (col * 300 + 8, row * 300 + 8))
        d.text((col * 300 + 6, row * 300 + 4), '%s %dx%d' % (key, c.size[0], c.size[1]), fill=(255, 255, 0, 255))
    os.makedirs(os.path.join(ROOT, 'dev', 'shots'), exist_ok=True)
    im.save(os.path.join(ROOT, 'dev', 'shots', 'cloaker-cuts.png'))


def cuts_all():
    s1, s2 = load(1), load(2)
    return {'a%d' % n: cell(s1, n) for n in range(1, 9)} | {'b%d' % n: cell(s2, n) for n in range(1, 9)}


SCALE = 0.43                            # one scale for every pose: the manta's span comes to ~118 px (a cloaker is two squares wide)
CX, CY = 64, 52                         # where a pose's centre of mass sits at rest (it hovers: the shadow is at AY)


def frame(img, mirror=False, sx=1.0, sy=1.0, dx=0, dy=0):
    """one pose at 1x: scaled (with a squash/stretch), palette-snapped and outlined, its centre of mass placed at (CX+dx, CY+dy)."""
    if mirror:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    w, h = img.size
    img = img.resize((max(1, round(w * SCALE * sx)), max(1, round(h * SCALE * sy))), Image.BOX)
    a = pix.pixelate(img, 1, do_lift=False)
    al = a[..., 3] > 0
    ys, xs = np.where(al)
    cy, cx = ys.mean(), xs.mean()
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = int(round(CX + dx - cx)), int(round(CY + dy - cy))
    h2, w2 = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h2), min(FW, ox + w2)
    if y1 > y0 and x1 > x0:
        out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def build():
    cuts = cuts_all()
    P = lambda k, **kw: frame(cuts[k], **kw)
    bob = lambda i, amp=2: int(round(amp * np.sin(2 * np.pi * i / 8)))
    # the poses of each facing (S, SW, W, NW, N, NE, E, SE): [(cut, mirrored)] cycled two frames each
    LOOP = {0: [('b3', 0), ('b4', 0), ('b3', 0), ('b2', 0)], 1: [('b1', 0), ('b2', 0), ('b1', 0), ('b2', 0)], 2: [('a5', 0), ('a6', 0), ('a5', 0), ('a6', 0)],
            3: [('b7', 0), ('b6', 0), ('b7', 0), ('b5', 0)], 4: [('b5', 0), ('b6', 0), ('b5', 0), ('b6', 0)], 5: [('b8', 0), ('b6', 0), ('b8', 0), ('b5', 0)],
            6: [('a5', 1), ('a6', 1), ('a5', 1), ('a6', 1)], 7: [('b1', 1), ('b2', 1), ('b1', 1), ('b2', 1)]}
    # which way a facing lunges on the screen (dx, dy per unit): S toward the viewer, W left, ...
    DIR = {0: (0, 1), 1: (-1, 1), 2: (-1, 0), 3: (-1, -1), 4: (0, -1), 5: (1, -1), 6: (1, 0), 7: (1, 1)}
    frames = {'idle': [], 'walk': [], 'attack': [], 'hurt': []}
    for f in range(8):
        loop = LOOP[f]
        pose = lambda i: loop[(i // 2) % 4]
        frames['idle'].append([P(pose(i)[0], mirror=bool(pose(i)[1]), dy=bob(i)) for i in range(8)])
        frames['walk'].append([P(pose(i)[0], mirror=bool(pose(i)[1]), dy=bob(i + 2, 3), dx=DIR[f][0] * (i % 2)) for i in range(8)])
        base, m = loop[0]
        dxv, dyv = DIR[f]
        wrap = f != 4 and f not in (3, 5)                        # the wrapped pose faces the viewer: not for a back view
        seq = []
        for i, (s, ox) in enumerate([(1.0, 0), (0.95, -3), (0.92, -5), (1.10, 6), (1.16, 10), (1.16, 10), (1.06, 5), (1.0, 1)]):
            key, mir = (('a7', 0) if (wrap and i in (3, 4, 5)) else (base, m))
            if key == 'a7':
                seq.append(P('a7', sx=s * 0.92, sy=s * 0.92, dx=dxv * ox * 0.5, dy=dyv * ox * 0.5))
            else:
                seq.append(P(key, mirror=bool(mir), sx=s, sy=s, dx=dxv * ox, dy=dyv * ox * 0.6))
        frames['attack'].append(seq)
    # the death (played as `hurt`): a start, the fall of the cloak round it, a heap on the ground (the same from every side)
    death = [P('b2', dx=-2), P('b2', dx=2, dy=2), P('a7', sx=0.9, sy=0.9, dy=4), P('a7', sx=0.95, sy=0.85, dy=14),
             P('a7', sx=1.05, sy=0.6, dy=27), P('a7', sx=1.1, sy=0.42, dy=34), P('a7', sx=1.15, sy=0.34, dy=38), P('a7', sx=1.15, sy=0.3, dy=39)]
    for f in range(8):
        frames['hurt'].append(death)
    top = pix.top_of(frames['idle'][0] + frames['idle'][4], AY)
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, top)
    mp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(mp))
    for a, fps in (('idle', 6), ('walk', 10), ('attack', 12), ('hurt', 8)):
        meta['anims'][a]['fps'] = fps
    meta['source'] = 'generated by Griz (2026-09-29, two sheets), keyed, posed and snapped by tools/cloaker-sheet.py'
    json.dump(meta, open(mp, 'w'), indent=1)


if __name__ == '__main__':
    if 'preview' in sys.argv:
        preview(cuts_all())
        print('preview written')
        sys.exit(0)
    build()

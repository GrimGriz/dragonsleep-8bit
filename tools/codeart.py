"""DEEP16 pipeline 3 helpers: figures drawn in code, then made into palette sprite sheets.

A figure is drawn on a supersampled RGBA canvas (SS x) with the shape helpers below, then `finish` brings it down to the grid's pixel size:
box-filtered, alpha cut at one half (no soft edges but where a figure asks for a glow), every colour snapped to the nearest of DEEP16's 64
palette colours (deep16/palette.json), and a one-pixel dark outline grown round it. `Sheet` lays frames out as the engine reads them
(8 facing rows per animation, frames left to right; deep16/js/sprites.js frameOf), mirroring a right-facing figure for the left facings.

Used by tools/wisp-sheet.py (its own light field), tools/bugs-sheet.py (the stirge, the fire beetle, the centipede).
"""
import os, json, math
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D16 = os.path.join(ROOT, 'deep16')
SS = 4
PAL = json.load(open(os.path.join(D16, 'palette.json'), encoding='utf-8'))['ramps']


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def C(ramp, i):
    return hexrgb(PAL[ramp][i])


ALL = np.array([hexrgb(c) for r in PAL.values() for c in r], dtype=float)
OUTLINE = C('outline', 0)


def snap(rgb):
    d = ((ALL - np.array(rgb, float)) ** 2).sum(axis=1)
    return tuple(int(v) for v in ALL[int(d.argmin())])


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new('RGBA', (w * SS, h * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def _p(self, pts):
        return [(x * SS, y * SS) for x, y in pts]

    def poly(self, pts, col):
        self.d.polygon(self._p(pts), fill=col + (255,))

    def line(self, pts, w, col):
        p = self._p(pts)
        self.d.line(p, fill=col + (255,), width=max(1, int(w * SS)), joint='curve')
        for x, y in p:                          # round caps
            r = max(1, int(w * SS / 2))
            self.d.ellipse((x - r, y - r, x + r, y + r), fill=col + (255,))

    def ell(self, cx, cy, rx, ry, col, rot=0.0):
        if not rot:
            self.d.ellipse(((cx - rx) * SS, (cy - ry) * SS, (cx + rx) * SS, (cy + ry) * SS), fill=col + (255,))
            return
        pts = []
        for k in range(36):
            a = k / 36 * 2 * math.pi
            x, y = rx * math.cos(a), ry * math.sin(a)
            pts.append((cx + x * math.cos(rot) - y * math.sin(rot), cy + x * math.sin(rot) + y * math.cos(rot)))
        self.poly(pts, col)

    def glow(self, cx, cy, r, col, a=0.5):
        """A soft round light, laid over what is there (the only soft thing: glands, lanterns)."""
        yy, xx = np.mgrid[0:self.h * SS, 0:self.w * SS].astype(float)
        d = np.hypot(xx - cx * SS, yy - cy * SS) / (r * SS)
        k = (np.clip(1 - d, 0, 1) ** 1.6 * a)[..., None]
        base = np.array(self.im, float)
        add = np.array(list(col) + [255], float)
        out = base * (1 - k) + add * k
        out[..., 3] = np.maximum(base[..., 3], k[..., 0] * 255)
        self.im = Image.fromarray(out.astype(np.uint8))
        self.d = ImageDraw.Draw(self.im)

    def finish(self, outline=True, sc=1.0, anchor=(48, 84)):
        if sc != 1.0:                           # the figure drawn at another size, about its foot (a Tiny thing on a Medium frame)
            ax, ay = anchor[0] * SS, anchor[1] * SS
            self.im = self.im.transform(self.im.size, Image.AFFINE, (1 / sc, 0, ax - ax / sc, 0, 1 / sc, ay - ay / sc), resample=Image.BICUBIC)
        small = self.im.resize((self.w, self.h), Image.BOX)
        a = np.array(small)
        alpha = a[..., 3]
        mask = alpha >= 128
        out = np.zeros_like(a)
        ys, xs = np.nonzero(mask)
        cache = {}
        for y, x in zip(ys, xs):
            key = tuple(a[y, x, :3])
            if key not in cache:
                cache[key] = snap(key)
            out[y, x] = cache[key] + (255,)
        if outline:
            m = out[..., 3] > 0
            grow = m.copy()
            grow[1:, :] |= m[:-1, :]; grow[:-1, :] |= m[1:, :]; grow[:, 1:] |= m[:, :-1]; grow[:, :-1] |= m[:, 1:]
            edge = grow & ~m
            out[edge] = OUTLINE + (255,)
        return Image.fromarray(out)


def mirror(img):
    return img.transpose(Image.FLIP_LEFT_RIGHT)


FACE_RIGHT = (5, 6, 7)      # NE, E, SE as drawn; the rest mirrored (S and N take the side frames too)
FACINGS = 8


def lay(anims, FW, FH, AX, AY, top, source, name, fps_of=None, flipset=(1, 2, 3)):
    """anims: {anim: [Image frames facing right]}; writes deep16/art/<name>.png + .json. Facings 1,2,3 (SW, W, NW) mirrored; the rest as drawn."""
    order = list(anims)
    sheet = Image.new('RGBA', (FW * max(len(v) for v in anims.values()), FH * FACINGS * len(order)))
    meta = {}
    y = 0
    for an in order:
        fr = anims[an]
        fps = (fps_of or {}).get(an, 8)
        meta[an] = {'y': y, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'frames': len(fr), 'fps': fps}
        for f in range(FACINGS):
            for i, im in enumerate(fr):
                sheet.paste(mirror(im) if f in flipset else im, (i * FW, y + f * FH))
        y += FH * FACINGS
    sheet.save(os.path.join(D16, 'art', name + '.png'), optimize=True)
    json.dump({'image': 'art/%s.png' % name, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'top': top, 'source': source, 'anims': meta},
              open(os.path.join(D16, 'art', name + '.json'), 'w'), indent=1)
    return sheet, meta


def preview(anims, path, scale=3, bg=(40, 32, 28, 255)):
    rows = list(anims)
    FW, FH = next(iter(anims.values()))[0].size
    n = max(len(v) for v in anims.values())
    out = Image.new('RGBA', (FW * n, FH * len(rows)), bg)
    for r, an in enumerate(rows):
        for i, im in enumerate(anims[an]):
            out.alpha_composite(im, (i * FW, r * FH))
    out = out.resize((out.width * scale // 2, out.height * scale // 2), Image.NEAREST)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out.save(path)
    print('wrote', path)

"""DRAGONSLEEP (the 8-bit): a generated NES-style battle sheet -> a monster painter's own pixel rows in js/bestiary-art.js.

    python tools/nes-sheet.py            (rewrites the generated block in js/bestiary-art.js)
    python tools/nes-sheet.py check      (also dev/visions/nes/<id>.png: each pose at 4x beside the source, for the eye)

The 8-bit loads no images: every foe is drawn in code into a DS.Pix (js/bestiary-art.js). A sheet drawn in the 8-bit's own manner -- big
pixels on a flat navy, a few poses side by side over a label each -- is turned into that idiom: the art-pixel grid found on the sheet
(its pitch and phase, by where the colour changes), each cell sampled at its middle, the colours pooled into one small palette, and each
pose written as hand-typed rows (Pix.rows, '.' for clear) between the markers below. The poses share the ready pose's place: a pose's dx/dy
puts its feet where the ready pose's feet are (js/bestiary-art.js DS.monsterArt carries them; js/battle.js draws attack on the lunge, hurt
after a blow, defeated as it fades).

First (and maybe only -- Griz, 10-08: "the code drawings are so-so and the 16 bit one looked so cool, please use new fancy and don't be
surprised if its the only one"): the axe beak, deep16/_src/Fresh/Axe Beak NES Battle Sprite Sheet.png -- READY, ATTACK, HURT, DEFEATED.
Sources are gitignored (the main checkout's deep16/_src; a worktree reads them there).
"""
import os, re, sys, subprocess
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'deep16', '_src')
if not os.path.isdir(os.path.join(SRC, 'Fresh')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')
ART = os.path.join(ROOT, 'js', 'bestiary-art.js')

SPECS = {
    'axebeak': dict(file=os.path.join('Fresh', 'Axe Beak NES Battle Sprite Sheet.png'),
                    poses=['ready', 'attack', 'hurt', 'defeated'],    # left to right on the sheet, over their labels
                    anchor={'ready': 'feet', 'attack': 'feet', 'hurt': 'feet', 'defeated': 'middle'},
                    colors=22),
}
BGTOL = 70          # a sheet pixel this close to the navy (sum of channel differences) is background
LABEL = 0.76        # the labels sit below this fraction of the sheet's height: figures only above it


def load(spec):
    im = np.asarray(Image.open(os.path.join(SRC, spec['file'])).convert('RGB')).astype(np.int32)
    bg = np.median(im[:24, :24].reshape(-1, 3), axis=0)
    fg = np.abs(im - bg).sum(2) > BGTOL
    fg[int(im.shape[0] * LABEL):] = False
    return im, bg, fg


def figures(fg, n):
    """the n figures, left to right: runs of columns with ink, split at the widest gaps"""
    cols = np.where(fg.any(0))[0]
    gaps = sorted(range(1, len(cols)), key=lambda i: cols[i] - cols[i - 1], reverse=True)[:n - 1]
    cuts = sorted(gaps)
    starts = [cols[0]] + [cols[i] for i in cuts]
    ends = [cols[i - 1] for i in cuts] + [cols[-1]]
    out = []
    for x0, x1 in zip(starts, ends):
        ys = np.where(fg[:, x0:x1 + 1].any(1))[0]
        out.append((int(x0), int(ys[0]), int(x1) + 1, int(ys[-1]) + 1))
    return out


def edges(im, fg, axis):
    """how much the colour changes between neighbours along one axis, summed over the ink only"""
    d = np.abs(np.diff(im, axis=axis)).sum(2).astype(np.float64)
    m = fg[:, 1:] | fg[:, :-1] if axis == 1 else fg[1:, :] | fg[:-1, :]
    return (d * m).sum(axis=0 if axis == 1 else 1)


def grid(sig, lo=5.5, hi=9.5):
    """the art-pixel pitch and phase: the comb (one tooth a cell edge) that the edge signal fills best"""
    best = (-1, 0, 0)
    n = len(sig)
    for p in np.arange(lo, hi, 0.01):
        for ph in np.arange(0, p, 0.25):
            k = np.arange(ph, n - 1, p)
            i = np.floor(k).astype(int); f = k - i
            s = (sig[i] * (1 - f) + sig[np.minimum(i + 1, n - 1)] * f).mean()
            if s > best[0]:
                best = (s, p, ph)
    return best[1], best[2]


def sample(im, fg, box, p, ox, oy):
    """each art pixel: the median colour of its cell's middle; clear where the cell is mostly navy"""
    x0, y0, x1, y1 = box
    i0 = int(np.floor((x0 - ox) / p)); i1 = int(np.ceil((x1 - ox) / p))
    j0 = int(np.floor((y0 - oy) / p)); j1 = int(np.ceil((y1 - oy) / p))
    W, H = i1 - i0, j1 - j0
    rgb = np.zeros((H, W, 3), np.int32); on = np.zeros((H, W), bool)
    q = p * 0.25
    for j in range(H):
        cy0 = oy + (j0 + j) * p
        ya, yb = int(round(cy0 + q)), int(round(cy0 + p - q))
        for i in range(W):
            cx0 = ox + (i0 + i) * p
            xa, xb = int(round(cx0 + q)), int(round(cx0 + p - q))
            m = fg[ya:yb, xa:xb]
            if m.size == 0 or m.mean() < 0.5:
                continue
            rgb[j, i] = np.median(im[ya:yb, xa:xb][m], axis=0)
            on[j, i] = True
    ys, xs = np.where(on)
    rgb, on = rgb[ys.min():ys.max() + 1, xs.min():xs.max() + 1], on[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    # where it sits in art pixels on the sheet's grid (for the poses' shared floor)
    return rgb, on, (i0 + xs.min(), j0 + ys.min())


def palette(poses, k):
    """one palette for every pose: the sampled colours pooled and cut to k by median cut"""
    allc = np.concatenate([rgb[on] for rgb, on, _ in poses]).astype(np.uint8)
    strip = Image.fromarray(allc.reshape(1, -1, 3), 'RGB')
    q = strip.quantize(colors=k, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = np.array(q.getpalette()[:3 * k], np.int32).reshape(-1, 3)
    used = sorted(set(np.asarray(q).ravel().tolist()))
    return pal[used]


def to_rows(rgb, on, pal):
    d = ((rgb[:, :, None, :] - pal[None, None, :, :]) ** 2).sum(3)
    idx = d.argmin(2)
    rows = []
    for j in range(rgb.shape[0]):
        rows.append(''.join(chr(97 + idx[j, i]) if on[j, i] else '.' for i in range(rgb.shape[1])))
    return rows, idx


def anchor_x(on, how):
    if how == 'middle':
        xs = np.where(on.any(0))[0]
        return (xs[0] + xs[-1] + 1) / 2.0
    h = on.shape[0]
    feet = on[max(0, h - max(3, h // 10)):]           # the bottom tenth: the feet on the floor
    xs = np.where(feet.any(0))[0]
    return (xs[0] + xs[-1] + 1) / 2.0


def build(cid, spec, check=False):
    im, bg, fg = load(spec)
    boxes = figures(fg, len(spec['poses']))
    x0 = min(b[0] for b in boxes); x1 = max(b[2] for b in boxes); y0 = min(b[1] for b in boxes); y1 = max(b[3] for b in boxes)
    px, ox = grid(edges(im[y0:y1, x0:x1], fg[y0:y1, x0:x1], 1))
    py, oy = grid(edges(im[y0:y1, x0:x1], fg[y0:y1, x0:x1], 0))
    p = (px + py) / 2.0
    ox += x0 + 1; oy += y0 + 1          # (a diff at index i is the edge between pixels i and i+1: the cell starts at i+1)
    print('%s: art pixel %.2f (x %.2f, y %.2f), phase %.1f %.1f' % (cid, p, px, py, ox, oy))
    poses = [sample(im, fg, b, p, ox, oy) for b in boxes]
    pal = palette(poses, spec['colors'])
    names = spec['poses']
    ready_rgb, ready_on, (rgx, rgy) = poses[0]
    rfoot = anchor_x(ready_on, spec['anchor'][names[0]])
    rbottom = rgy + ready_on.shape[0]                  # the floor, in sheet art pixels
    out = {}
    for name, (rgb, on, (gx, gy)) in zip(names, poses):
        rows, _ = to_rows(rgb, on, pal)
        a = anchor_x(on, spec['anchor'][name])
        ra = rfoot if spec['anchor'][name] == 'feet' else anchor_x(ready_on, 'middle')
        dx = int(round(ra - a))
        dy = (gy + on.shape[0]) - rbottom + (ready_on.shape[0] - on.shape[0])   # its own bottom on the same floor
        out[name] = dict(rows=rows, dx=dx, dy=dy, w=on.shape[1], h=on.shape[0])
        print('  %-9s %3d x %3d  dx %3d dy %3d' % (name, on.shape[1], on.shape[0], dx, dy))
    hexes = ['#%02x%02x%02x' % tuple(int(v) for v in c) for c in pal]
    if check:
        vis(cid, out, hexes)
    return out, hexes


def js_block(cid, spec, out, hexes):
    L = ['  // <nes:%s> generated by tools/nes-sheet.py from deep16/_src/%s -- rewrite it with the tool, never by hand' % (cid, spec['file'].replace(os.sep, '/')),
         '  NES.%s = {' % cid,
         '    pal: {' + ', '.join("%s: '%s'" % (chr(97 + i), h) for i, h in enumerate(hexes)) + '},']
    for name in spec['poses']:
        o = out[name]
        L.append('    %s: { dx: %d, dy: %d, rows: [' % (name, o['dx'], o['dy']))
        for r in o['rows']:
            L.append("      '%s'," % r)
        L.append('    ] },')
    L.append('  };')
    L.append('  // </nes:%s>' % cid)
    return L


def vis(cid, out, hexes):
    d = os.path.join(ROOT, 'dev', 'visions', 'nes'); os.makedirs(d, exist_ok=True)
    pal = [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in hexes]
    ims = []
    for name, o in out.items():
        a = np.zeros((o['h'], o['w'], 4), np.uint8); a[..., :3] = (1, 34, 84); a[..., 3] = 255
        for j, r in enumerate(o['rows']):
            for i, ch in enumerate(r):
                if ch != '.':
                    a[j, i, :3] = pal[ord(ch) - 97]
        ims.append(Image.fromarray(a).resize((o['w'] * 4, o['h'] * 4), Image.NEAREST))
    W = sum(i.width for i in ims) + 20 * len(ims); H = max(i.height for i in ims)
    c = Image.new('RGB', (W, H), (1, 34, 84)); x = 0
    for i in ims:
        c.paste(i, (x, H - i.height)); x += i.width + 20
    c.save(os.path.join(d, cid + '.png'))


def main(check=False):
    src = open(ART, 'rb').read().decode('utf-8')
    eol = '\r\n' if '\r\n' in src else '\n'
    lines = src.replace('\r\n', '\n').split('\n')
    for cid, spec in SPECS.items():
        out, hexes = build(cid, spec, check)
        block = js_block(cid, spec, out, hexes)
        a = [i for i, l in enumerate(lines) if l.strip().startswith('// <nes:%s>' % cid)]
        b = [i for i, l in enumerate(lines) if l.strip() == '// </nes:%s>' % cid]
        if a and b:
            lines[a[0]:b[0] + 1] = block
        else:
            k = [i for i, l in enumerate(lines) if l.strip() == '// <nes>'][0]   # the place for new ones
            lines[k + 1:k + 1] = block
    open(ART, 'wb').write(eol.join(lines).encode('utf-8'))
    print('wrote', ART)


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])

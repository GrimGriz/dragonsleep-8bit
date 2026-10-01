"""DEEP16 pixel pass: rendered frames -> a palette sprite sheet the engine draws.

    python tools/pixelate.py p1 <figure> [<figure> ...]    # pipeline 1: deep16/_src/render/<figure>/  -> deep16/art/<figure>_p1.png/.json
    python tools/pixelate.py p0 <figure> [<figure> ...]    # pipeline 0: deep16/_src/lpc/composed/<figure>/ -> deep16/art/<figure>_p0.png/.json
    python tools/pixelate.py p1 all | p0 all

The 16-bit look is the palette more than the pixel count: box the supersampled render down to 1x (alpha-premultiplied, so
edges don't go dark), cut the alpha hard, lift colour a touch, snap every pixel to deep16/palette.json (nearest in Lab),
and draw a 1-px dark outline round the silhouette. One camera, one light, one palette: every creature matches.
Sheet layout: for each anim, 8 rows (facings S, SW, W, NW, N, NE, E, SE), frames left to right.
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D16 = os.path.join(ROOT, 'deep16')
SRC = os.path.join(D16, '_src')
ART = os.path.join(D16, 'art')
FPS = {'idle': 6, 'walk': 10, 'attack': 12, 'hurt': 10, 'die': 8, 'sit': 2, 'cast': 10, 'fly': 9, 'roost': 2, 'reveal': 6, 'moan': 8, 'flinch': 12}
ANIM_ORDER = ['idle', 'walk', 'attack', 'hurt', 'die', 'sit', 'cast', 'fly', 'roost', 'reveal', 'moan', 'flinch', 'rofl', 'braid', 'run', 'clack']  # (clack: the clacker striking its hooks together at its turn's start, 10-01)  # (braid: the ettercap sitting on its stump braiding, till it sees you; run: the giant boar's charge -- both 09-30)  # (rofl: the hyena rolling on the floor with laughter, 09-30: the Hideous Laughter easter egg)  # (flinch: a blow that lands and doesn't drop it, played once: the generated sheets' hit rows, 09-29)  # (fly: the cloaker's flight in, played as drawn -- the easter egg's ending)  # (cast: the spellcasters' own pose, the spell animation pass 09-28h)
# LPC has four directions; the eight facings take the nearest, the front and back diagonals leaning to down and up
LPC_ROW = {'up': 0, 'left': 1, 'down': 2, 'right': 3}
LPC_FOR_FACING = ['down', 'down', 'left', 'up', 'up', 'up', 'right', 'down']


def palette():
    p = json.load(open(os.path.join(D16, 'palette.json'), encoding='utf-8'))
    cols = [c for r in p['ramps'].values() for c in r]
    rgb = np.array([[int(c[i:i + 2], 16) for i in (1, 3, 5)] for c in cols], dtype=np.float32)
    return rgb, to_lab(rgb / 255.0), np.array([int(p['ramps']['outline'][0][i:i + 2], 16) for i in (1, 3, 5)], dtype=np.uint8)


def to_lab(rgb):
    a = np.where(rgb > 0.04045, ((rgb + 0.055) / 1.055) ** 2.4, rgb / 12.92)
    xyz = a @ np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]], dtype=np.float32).T
    xyz /= np.array([0.95047, 1.0, 1.08883], dtype=np.float32)
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


PAL_RGB, PAL_LAB, OUTLINE = palette()


def lift(rgb, sat=1.18, gain=1.12, gamma=0.92):
    """Renders come out greyer than 16-bit sprites: a little more saturation and light before the snap."""
    x = np.clip(rgb * gain, 0, 1) ** gamma
    g = x.mean(axis=-1, keepdims=True)
    return np.clip(g + (x - g) * sat, 0, 1)


def snap(rgb01):
    lab = to_lab(rgb01)
    d = ((lab[..., None, :] - PAL_LAB[None, None, :, :]) ** 2).sum(-1)
    return PAL_RGB[d.argmin(-1)].astype(np.uint8)


def pixelate(img, ss, do_lift=True, alpha_cut=0.5):
    """img: RGBA PIL at ss x -> RGBA uint8 array at 1x, palette-snapped, outlined."""
    a = np.asarray(img.convert('RGBA'), dtype=np.float32) / 255.0
    if ss > 1:
        h, w = a.shape[0] // ss, a.shape[1] // ss
        a = a[:h * ss, :w * ss].reshape(h, ss, w, ss, 4)
        al = a[..., 3:4]
        rgb = (a[..., :3] * al).sum((1, 3)) / np.maximum(al.sum((1, 3)), 1e-6)
        alpha = al.mean((1, 3))[..., 0]
    else:
        rgb, alpha = a[..., :3], a[..., 3]
    if do_lift:
        rgb = lift(rgb)
    solid = alpha >= alpha_cut
    out = np.zeros(rgb.shape[:2] + (4,), dtype=np.uint8)
    out[solid, :3] = snap(rgb)[solid]
    out[solid, 3] = 255
    # the outline: every empty pixel 4-touching the figure
    e = np.zeros_like(solid)
    e[1:, :] |= solid[:-1, :]; e[:-1, :] |= solid[1:, :]; e[:, 1:] |= solid[:, :-1]; e[:, :-1] |= solid[:, 1:]
    edge = e & ~solid
    out[edge, :3] = OUTLINE
    out[edge, 3] = 255
    return out


def write_sheet(name, frames, fw, fh, ax, ay, top, sizes=None):
    """frames: {anim: [[facing0 frames...], ... 8 facings]} of RGBA arrays. Each anim is a block of 8 rows stacked
    down the sheet; `sizes` gives an anim its own frame size and foot, (fw, fh, ax, ay), when it isn't the sheet's
    (LPC's oversize weapon swings are 192 px frames)."""
    sizes = sizes or {}
    anims = [a for a in ANIM_ORDER if a in frames]
    dims = {a: sizes.get(a, (fw, fh, ax, ay)) for a in anims}
    width = max(len(frames[a][0]) * dims[a][0] for a in anims)
    height = sum(8 * dims[a][1] for a in anims)
    sheet = np.zeros((height, width, 4), dtype=np.uint8)
    meta = {'image': 'art/%s.png' % name, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'top': top, 'anims': {}}
    y0 = 0
    for anim in anims:
        afw, afh, aax, aay = dims[anim]
        meta['anims'][anim] = {'y': y0, 'fw': afw, 'fh': afh, 'ax': aax, 'ay': aay, 'frames': len(frames[anim][0]), 'fps': FPS.get(anim, 8)}
        for f in range(8):
            for i, fr in enumerate(frames[anim][f]):
                y, x = y0 + f * afh, i * afw
                sheet[y:y + afh, x:x + afw] = fr[:afh, :afw]
        y0 += 8 * afh
    os.makedirs(ART, exist_ok=True)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, name + '.png'), optimize=True)
    json.dump(meta, open(os.path.join(ART, name + '.json'), 'w'), indent=1)
    print('  %s: %dx%d, %s' % (name, sheet.shape[1], sheet.shape[0], ', '.join('%s %d' % (a, len(frames[a][0])) for a in anims)))


def top_of(frames, ay):
    """How far the figure rises above its foot (for labels and HP bars): the highest opaque row over all idle frames."""
    best = 0
    for f in frames:
        rows = np.where(f[..., 3].any(axis=1))[0]
        if len(rows):
            best = max(best, ay - rows[0])
    return int(best)


def p1(fig):
    d = os.path.join(SRC, 'render', fig)
    meta = json.load(open(os.path.join(d, 'meta.json')))
    frames = {}
    for anim, info in meta['anims'].items():
        frames[anim] = [[pixelate(Image.open(os.path.join(d, anim, 'f%d_%02d.png' % (f, i))), meta['ss']) for i in range(info['frames'])] for f in range(8)]
    write_sheet(fig + '_p1', frames, meta['fw'], meta['fh'], meta['ax'], meta['ay'], top_of(frames['idle'][0], meta['ay']))


def p0(fig):
    d = os.path.join(SRC, 'lpc', 'composed', fig)
    meta = json.load(open(os.path.join(d, 'meta.json')))
    fw, fh = meta['frame_w'], meta['frame_h']
    ax, ay = meta.get('foot', [fw // 2, fh - 6])
    frames, sizes = {}, {}
    for anim, info in meta['anims'].items():
        if anim not in FPS:
            continue
        afw, afh = info.get('frame_w', fw), info.get('frame_h', fh)
        if (afw, afh) != (fw, fh):
            fx, fy = info.get('foot', [ax + info.get('origin', [0, 0])[0], ay + info.get('origin', [0, 0])[1]])
            sizes[anim] = (afw, afh, fx, fy)
        sheet = Image.open(os.path.join(d, anim + '.png')).convert('RGBA')
        rows = info.get('rows', ['up', 'left', 'down', 'right'])
        # LPC art is already pixel art at 1x: snap to the palette without the render lift, keep its own outline
        cells = {}
        for ri, dname in enumerate(rows):
            cells[dname] = [pixelate(sheet.crop((i * afw, ri * afh, (i + 1) * afw, (ri + 1) * afh)), 1, do_lift=False) for i in range(info['frames'])]
        frames[anim] = [cells.get(LPC_FOR_FACING[f]) or cells.get('down') or next(iter(cells.values())) for f in range(8)]
    write_sheet(fig + '_p0', frames, fw, fh, ax, ay, top_of(frames['idle'][0], ay), sizes)


def main():
    mode, figs = sys.argv[1], sys.argv[2:]
    if figs == ['all']:
        cfg = json.load(open(os.path.join(ROOT, 'tools', 'deep16-figures.json'), encoding='utf-8'))
        figs = list(cfg['figures'])
    for fig in figs:
        try:
            (p1 if mode == 'p1' else p0)(fig)
        except FileNotFoundError as e:
            print('  %s_%s: missing %s' % (fig, mode, e.filename))


if __name__ == '__main__':
    main()

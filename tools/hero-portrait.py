"""DEEP16: the heroes' portraits -- the big bust the art desk drew on the first page of each hero's package (HEAD 1 PAGE 1, its portrait beside the
turnaround), cut to a still for the hero on the counter screen (deep16/js/counter.js Counter.drawHero: Ned's scene, 10-22). Griz, 10-22, to the lanes
desk on the Ned and Aurdin seat's question: "The first page of the characters stuff was supposed to have a big one, if you can find that use the one based
on the outfit he's in".

    python tools/hero-portrait.py            (every look: deep16/art/pt_<look>.png/.json)
    python tools/hero-portrait.py check      (also dev/visions/hero-portraits.png, each at 4x)

The bust is the biggest drawing in the page's top-left corner (the turnaround stands right of it, the Idle row below). A pixel is figure when a channel is
MASK_D from the page's navy (tools/portrait-sheet.py's rule); the bust and the wisps beside it are filled, mirrored when the drawing looks screen left
(the hero sits bottom left, looking at the keeper on the right), boxed down (alpha-premultiplied) to W px wide, snapped to deep16/palette.json and
outlined (tools/pixelate.py) -- on its top and sides: its foot is the drawing's own cut edge, on the screen's name strip.
The sheet: one frame, `idle`; `ax` its middle, `ay` its foot. js/counter.js C.HERO_PT picks the look by the figure the hero wears (js/save.js SV.look).
"""
import os, sys, json, glob
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SRC = pix.SRC                     # (_src is not in git: a worktree reads the main checkout's)
ART = os.path.join(ROOT, 'deep16', 'art')

W = 80                            # px wide at game size: the counter screen's hero box, inside its frame (js/counter.js HB)
MASK_D = 22
CORNER = (0, 0, 460, 300)         # where the bust is drawn on the 1536 x 1024 page
# look: (pages' folder, ART id, the figure sheet it goes with, mirror)
LOOKS = {
    'aurdin_red': ('aurdin/ART-73', 'ART-73', 'aurdin_p3', True),      # the Red Mantle (out of robes: his start)
    'aurdin_ochre': ('aurdin/ART-72', 'ART-72', 'aurdin_p2', True),    # the Ochre Mantle (in robes)
}


def bust(a):
    """the bust's mask over the page: the biggest piece in CORNER and the pieces touching its box"""
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    m = ndimage.binary_opening(np.abs(a - navy).max(-1) > MASK_D, structure=np.ones((3, 3)))
    x0, y0, x1, y1 = CORNER
    c = np.zeros_like(m); c[y0:y1, x0:x1] = m[y0:y1, x0:x1]
    lab, n = ndimage.label(c, structure=np.ones((3, 3)))
    if not n:
        raise SystemExit('no drawing in the corner')
    sz = ndimage.sum(c, lab, range(1, n + 1)); objs = ndimage.find_objects(lab)
    main = int(np.argmax(sz)); sl = objs[main]; b = [sl[1].start - 12, sl[0].start - 12, sl[1].stop + 12, sl[0].stop + 12]
    keep = [main + 1] + [i + 1 for i, s in enumerate(objs) if i != main and sz[i] >= 60 and s[1].start <= b[2] and s[1].stop >= b[0] and s[0].start <= b[3] and s[0].stop >= b[1]]
    return ndimage.binary_fill_holes(np.isin(lab, keep))


BLUSH, BLUSH_SAT = '#e8624a', 0.75 # (the red ramp's lightest, and the saturation under which a pixel of it is a cheek, not the hair: measured 10-22)
def blush(px, rgb):
    """a cheek's warm light back to the skin: the palette has nothing between skin's #d49a72 and the red ramp's lightest, so a drawn blush snaps to
    red and reads as a blotch (the Ochre's face, 10-22). A pixel of BLUSH whose own colour is less saturated than BLUSH_SAT (skin 0.53-0.60 there, the
    hair 0.75 and over), beside skin, takes the skin ramp's nearest instead"""
    hx = lambda c: np.array([int(c[i:i + 2], 16) for i in (1, 3, 5)])
    skin = np.array([r == 'skin' for r in pix.PAL_RAMP]); sk = pix.PAL_RGB[skin]
    isk = np.zeros(px.shape[:2], bool)
    for c in sk: isk |= np.all(px[..., :3] == c, -1)
    isk &= px[..., 3] > 0
    H, W0 = isk.shape; p = np.pad(isk, 1); near = np.zeros((H, W0), bool)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dy or dx: near |= p[1 + dy:1 + dy + H, 1 + dx:1 + dx + W0]
    mx, mn = rgb.max(-1), rgb.min(-1); sat = (mx - mn) / np.maximum(mx, 1e-6)
    take = np.all(px[..., :3] == hx(BLUSH), -1) & (px[..., 3] > 0) & (sat < BLUSH_SAT) & near
    if take.any():
        d = ((pix.to_lab(rgb[take])[:, None, :] - pix.PAL_LAB[skin][None]) ** 2).sum(-1)
        px = px.copy(); px[take, :3] = sk[d.argmin(-1)].astype(np.uint8)
    return px


def cut(look):
    folder, art, fig, mirror = LOOKS[look]
    fs = glob.glob(os.path.join(SRC, folder, '%s_16BIT_HEAD-1_PAGE-1.png' % art))
    if not fs:
        raise SystemExit('no first page in %s' % os.path.join(SRC, folder))
    a = np.asarray(Image.open(fs[0]).convert('RGB')).astype(np.int32)
    m = bust(a)
    ys, xs = np.where(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8); rgba[..., :3] = a[y0:y1, x0:x1]; rgba[..., 3] = m[y0:y1, x0:x1] * 255
    if mirror:
        rgba = rgba[:, ::-1].copy()
    k = (W - 2) / float(rgba.shape[1])
    im = Image.fromarray(rgba, 'RGBA').convert('RGBa').resize((W - 2, max(1, round(rgba.shape[0] * k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (im.width + 2, im.height + 1), (0, 0, 0, 0)); pad.paste(im, (1, 1)) # (room for the outline on its top and sides; none under its cut edge)
    px = blush(pix.pixelate(pad, 1, do_lift=False), np.asarray(pad, np.float32)[..., :3] / 255.0)
    fh, fw = px.shape[:2]
    os.makedirs(ART, exist_ok=True)
    Image.fromarray(px, 'RGBA').save(os.path.join(ART, 'pt_%s.png' % look), optimize=True)
    meta = {'image': 'art/pt_%s.png' % look, 'fw': fw, 'fh': fh, 'ax': fw // 2, 'ay': fh, 'top': fh, 'portrait': True, 'still': True, 'figure': fig, 'art': art,
            'anims': {'idle': {'y': 0, 'fw': fw, 'fh': fh, 'ax': fw // 2, 'ay': fh, 'frames': 1, 'fps': 1}},
            'source': 'deep16/_src/%s/%s_16BIT_HEAD-1_PAGE-1.png (the art desk\'s %s, its portrait), cut by tools/hero-portrait.py%s' % (folder, art, art, ', mirrored' if mirror else '')}
    json.dump(meta, open(os.path.join(ART, 'pt_%s.json' % look), 'w'), indent=1)
    print('  pt_%s: %dx%d, from %dx%d page px (%.2f a game px)%s' % (look, fw, fh, x1 - x0, y1 - y0, 1 / k, ', mirrored' if mirror else ''))
    return px


if __name__ == '__main__':
    args = [x for x in sys.argv[1:] if x != 'check']
    outs = [cut(lk) for lk in (args or list(LOOKS))]
    if 'check' in sys.argv[1:]:
        Wd = sum(p.shape[1] + 6 for p in outs); H = max(p.shape[0] for p in outs) + 6
        cv = np.zeros((H, Wd, 3), np.uint8); cv[...] = (11, 20, 48); x = 3
        for p in outs:
            al = p[..., 3:4] / 255.0; sl = cv[3:3 + p.shape[0], x:x + p.shape[1]]; sl[...] = (p[..., :3] * al + sl * (1 - al)).astype(np.uint8); x += p.shape[1] + 6
        d = os.path.join(ROOT, 'dev', 'visions'); os.makedirs(d, exist_ok=True)
        Image.fromarray(cv).resize((Wd * 4, H * 4), Image.NEAREST).save(os.path.join(d, 'hero-portraits.png'))
        print('  dev/visions/hero-portraits.png')

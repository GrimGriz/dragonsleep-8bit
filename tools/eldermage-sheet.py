"""DEEP16: the elder mage -- the art desk's little old mage, the DM's figure on his map and a tester's wizard on the DM's roster (11-07, the desk of 11-07, on
Griz's "got his fly animation in - can we squeeze him as a lvl whatever wizard ... onto live to play with til tuesday").

    python tools/eldermage-sheet.py            # deep16/art/eldermage_p1 (.png + .json)

Sources (the main checkout's deep16/_src/eldermage/, as the art desk sent them): DEEP16-ELDER-MAGE-SOURCES (five views, Idle 4, Walk 8, Jump-Stomp 6) and
DEEP16-ELDER-MAGE-FLIGHT (the same five, Hover 4, Fly 6, Transition 4). Each FRAME-MAP.csv gives a frame's crop window and the ground point it stands on.
Cut by those maps, not by a band probe: each drawing's figure is the navy keyed out (the page's own median, a channel 22 off) and its biggest pieces kept
(the printed digits and the faint jump shadows are small); one scale a facing on each sheet -- the ground sheet's Idle 1 to TALL, the flight sheet's Hover 1
to the same height -- and every frame placed by its mapped ground point on the cell's anchor, so the stomp's rise and the flight's 8-10 px of clearance stay
as drawn (the art desk: "Use fixed cell roots, not the silhouette midpoint"). SW, W and NW the mirrors of SE, E and NE. Rows: idle, walk, stomp (its ground
pulse on index 3), fly (the art desk's Fly: the engine plays `fly` for any unit aloft, js/ui.js), hover (cut, not played yet). Transition is not cut.
"""
import os, csv, json
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix, AD = _load('pixelate'), _load('artdesk')

NAME = 'eldermage_p1'
FW, FH, AX, AY = 72, 72, 36, 66
TALL = 35                                       # (the art desk's own: "roughly 35 px of standing height", a child's -- a little old mage)
SRC = os.path.join(AD.src_dir(ROOT), 'eldermage')
SHEETS = {'ground': 'DEEP16-ELDER-MAGE-SOURCES', 'flight': 'DEEP16-ELDER-MAGE-FLIGHT'}
FILES = {'SE': '01-SE.png', 'NE': '02-NE.png', 'S': '03-S.png', 'E': '04-E.png', 'N': '05-N.png'}
ROWS = {'idle': ('ground', 'Idle'), 'walk': ('ground', 'Walk'), 'stomp': ('ground', 'Jump-Stomp'), 'fly': ('flight', 'Fly'), 'hover': ('flight', 'Hover')}
ORDER = ['idle', 'walk', 'stomp', 'fly', 'hover']
FPS = {'idle': 5, 'walk': 10, 'stomp': 10, 'fly': 8, 'hover': 6}


def frame_map(sheet):
    with open(os.path.join(SRC, SHEETS[sheet], 'FRAME-MAP.csv'), encoding='utf-8') as f:
        return list(csv.DictReader(f))


def figure(a, nav):
    """the drawing in a crop: off the navy by a channel of 22, its biggest piece and any piece a tenth its size or more (the hair, the staff's end)"""
    m = np.abs(a[..., :3].astype(int) - nav).max(-1) > 22
    lb, n = ndimage.label(m, structure=np.ones((3, 3)))
    if not n:
        return m
    sz = ndimage.sum(np.ones_like(lb), lb, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sz) if s >= sz.max() * 0.1]
    return np.isin(lb, keep)


def cut_frame(page, nav, r):
    x0, y0, x1, y1 = int(r['crop_left']), int(r['crop_top']), int(r['crop_right_exclusive']), int(r['crop_bottom_exclusive'])
    a = page[y0:y1, x0:x1]
    m = figure(a, nav)
    rgba = np.zeros((a.shape[0], a.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = a[..., :3]; rgba[..., 3] = m * 255
    return Image.fromarray(rgba, 'RGBA'), (x0 - int(r['ground_x']), y0 - int(r['ground_y']))


def fit(img, k):
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0)); pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False)


def body_h(img):
    m = np.asarray(img)[..., 3] > 0
    ys = np.where(m.any(axis=1))[0]
    return ys[-1] - ys[0] + 1


def view(v):
    out = {}
    scale = {}
    for sheet in ('ground', 'flight'):
        page = np.asarray(Image.open(os.path.join(SRC, SHEETS[sheet], 'Originals', FILES[v])).convert('RGB'))
        nav = np.median(page.reshape(-1, 3)[::97], axis=0)
        rows = [r for r in frame_map(sheet) if r['facing'] == v]
        first = [r for r in rows if r['action'] == ('Idle' if sheet == 'ground' else 'Hover')][0]
        im0, _ = cut_frame(page, nav, first)
        scale[sheet] = body_h(im0) / float(TALL)          # (source px a game px: Idle 1, or Hover 1, stands TALL)
        for an, (sh, act) in ROWS.items():
            if sh != sheet:
                continue
            fs = []
            for r in [r for r in rows if r['action'] == act]:
                im, (ox, oy) = cut_frame(page, nav, r)
                k = scale[sheet]
                g = fit(im, k)
                fr = np.zeros((FH, FW, 4), dtype=np.uint8)
                px, py = int(round(AX + ox / k)) - 1, int(round(AY + oy / k)) - 1   # (the crop's corner against the ground point, the fit's 1-px margin)
                h, w = g.shape[:2]
                ys0, xs0, ys1, xs1 = max(0, py), max(0, px), min(FH, py + h), min(FW, px + w)
                if ys1 > ys0 and xs1 > xs0:
                    fr[ys0:ys1, xs0:xs1] = g[ys0 - py:ys1 - py, xs0 - px:xs1 - px]
                if (fr[..., 3] > 0).sum() < (g[..., 3] > 0).sum():
                    print('  lost at the cell edge: %s %s %s' % (v, an, r.get('source_frame')))
                fs.append(fr)
            out[an] = fs
    return out


def mirror(seq):
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


if __name__ == '__main__':
    d = {v: view(v) for v in FILES}
    frames = {an: [d['S'][an], mirror(d['SE'][an]), mirror(d['E'][an]), mirror(d['NE'][an]), d['N'][an], d['NE'][an], d['E'][an], d['SE'][an]] for an in ORDER}
    for an in ORDER:
        if len({len(fs) for fs in frames[an]}) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (an, [len(fs) for fs in frames[an]]))
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    mp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(mp))
    for an, fps in FPS.items():
        meta['anims'][an]['fps'] = fps
    meta['anims']['stomp']['pulse'] = 3
    meta['anims']['hover']['held'] = 'the upright hover: cut, not played yet (the engine plays `fly` for any unit aloft)'
    meta['source'] = 'drawn by the art desk (DEEP16-ELDER-MAGE-SOURCES and -FLIGHT, 11-07), cut by tools/eldermage-sheet.py by their FRAME-MAPs (11-07)'
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ORDER)))

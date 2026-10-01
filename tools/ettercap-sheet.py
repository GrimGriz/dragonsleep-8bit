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

SRC = os.path.join(ROOT, 'deep16', '_src')
NAME = 'ettercap_p2'
FW, FH, AX, AY = 120, 96, 60, 86
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
    frames = {a: [] for a in side}
    for f in range(8):                                   # facings S, SW, W, NW, N, NE, E, SE
        for a in frames:
            frames[a].append(south[a] if f == 0 else north[a] if f == 4 else side[a] if f in (5, 6, 7) else mirror(side[a]))
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
    meta['source'] = 'generated by Griz (2026-09-29, two sheets; the braiding idle 2026-09-30), cut and snapped by tools/ettercap-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)

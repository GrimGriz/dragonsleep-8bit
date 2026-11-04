"""The mannequin pilot cut (11-04): GPT's pages of Barley in mail skinned over the mannequin's one-handed slash, the longsword drawn in his
hand along the bar by the generator itself -- cut into the `longsword` row of barley_p3, the sheet the game plays when he is in mail.

    python tools/barley-slash-sheet.py            the row on deep16/art/barley_p3.png/.json, and the score
                                                  (deep16/art-src/mannequin/pilot-score.json, pilot-review.png)
    python tools/barley-slash-sheet.py --with-n   N into the row too (the art desk HELD it: frame 5 moves the sword to his left hand)

The pages: deep16/_src/barley/SLASH-PILOT-2026-11-04/ (candidates/ SE NE S E, held/ N), sorted out of Fresh; the art desk's README-CUTTER.md
and MANIFEST.json beside them. Six frames a page, numbered 1-6, the hit on 4; NE has a baseline under the frames, which falls out here.

How a page is cut (tools/barley-grokslash-sheet.py's way, 10-31): the navy is each row's own, the background what joins the page's edge in
colours near it; a long thin run across the page is the baseline and goes. The figures are the big pieces between the title and the numbers;
every smaller piece there (a blade parted from its hand) goes with the frame whose number is nearest its middle. One scale a page
(deep16/art-src/mannequin/README.md): frame 1, crown to the lowest boot row, to the mannequin's frame 1 in that view -- the crown is the top of
his hair (the biggest gold piece's top), not the blade's tip. Each frame is boxed down, snapped to the 64 colours and ringed with the outline,
then stood in the mannequin's slash cell (96 x 84, the anchor 48,79): its lowest boot row on the anchor row, its boots' middle on the anchor.

NE 5: the generator hid the whole sword (the mannequin's fist is behind him there, but its tip shows low on his left); the cutter draws the
blade behind him along the mannequin's bar, as the Grok cut drew it -- only where nothing of him is.

The row is barley_p3's `longsword`: js/battle.js plays a row named for the weapon (a longsword's blow plays it, S.wieldOf draws no code weapon
over a longsword), in its own 96 x 84 cell (js/sprites.js reads a row's fw/fh/ax/ay). SW W NW are SE E NE mirrored (RULED 10-14: he is
left-handed there). Run again after tools/barley-sheet.py chain rebuilds barley_p3 -- this puts the row back; it replaces its own row in place.
"""
import importlib.util, json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'deep16', '_src', 'barley', 'SLASH-PILOT-2026-11-04')
if not os.path.isdir(SRC):                 # (a worktree: deep16/_src/ is untracked and lives in the shared checkout only)
    import subprocess
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--path-format=absolute', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(_common), 'deep16', '_src', 'barley', 'SLASH-PILOT-2026-11-04')
OUT = os.path.join(ROOT, 'deep16', 'art-src', 'mannequin')
NAME, ROW = 'barley_p3', 'longsword'
PAGES = {'SE': 'candidates/BARLEY-SLASH_HEAD-1_PAGE-1_SE.png', 'NE': 'candidates/BARLEY-SLASH_HEAD-2_PAGE-1_NE.png',
         'S': 'candidates/BARLEY-SLASH_HEAD-3_PAGE-1_S.png', 'E': 'candidates/BARLEY-SLASH_HEAD-4_PAGE-1_E.png',
         'N': 'held/BARLEY-SLASH_HEAD-5_PAGE-1_N.png'}
ORDER = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
WITH_N = '--with-n' in sys.argv
BLADE_BEHIND = {('NE', 4)}          # (view, frame index): the generator hid the blade the mannequin shows -- drawn behind him
BG_TOL, HOLE = 34, 400

_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)
P = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps']
hexc = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.uint8)
OUTL, GUARD, STEEL, STEEL2 = hexc(P['outline'][0]), hexc(P['gold'][3]), hexc(P['silver'][6]), hexc(P['silver'][5])

RIG = json.load(open(os.path.join(OUT, 'mannequin_slash.json'), encoding='utf-8'))
CELL = RIG['anims']['slash']; FW, FH, AX, AY = CELL['fw'], CELL['fh'], CELL['ax'], CELL['ay']
RP = RIG['pilot']['points']['slash']


def page_frames(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    H, W = a.shape[:2]
    bg = np.median(a[:, :10], axis=1)
    near = np.linalg.norm(a - bg[:, None, :], axis=2) < BG_TOL
    lab, n = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(near, lab, range(1, n + 1))
    fg = ~(np.isin(lab, list(edge)) | np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > HOLE]))
    # the baseline (NE): a row whose foreground runs more than half the page, thin -- its rows go
    for y in range(H):
        r = np.concatenate([[0], fg[y].astype(np.int8), [0]]); d = np.diff(r); st, en = np.where(d == 1)[0], np.where(d == -1)[0]
        if len(st) and (en - st).max() > W * 0.5:
            fg[max(0, y - 1):y + 2] = False
    flab, fn = ndimage.label(fg)
    boxes = ndimage.find_objects(flab)
    figs = [i + 1 for i, b in enumerate(boxes) if b and (b[0].stop - b[0].start) > H * 0.2 and (b[1].stop - b[1].start) < W * 0.4]
    ftop = min(boxes[k - 1][0].start for k in figs); fbot = max(boxes[k - 1][0].stop for k in figs)
    glyph = [b for b in boxes if b and b[0].start >= fbot - 4 and H * 0.02 < (b[0].stop - b[0].start) < H * 0.08 and (b[1].stop - b[1].start) < W * 0.06]
    glyph.sort(key=lambda b: b[0].start)
    row1 = [b for b in glyph if b[0].start - glyph[0][0].start < 20]
    cx = np.array(sorted((b[1].start + b[1].stop) / 2 for b in row1))
    if len(cx) != 6:
        raise SystemExit('%s: %d numbers under the figures, not 6' % (os.path.basename(path), len(cx)))
    member = [[] for _ in range(6)]
    for i, b in enumerate(boxes):
        if not b or b[0].stop > fbot + 2:
            continue
        if b[0].start < ftop and (b[0].stop - b[0].start) < H * 0.08:      # (the title: short glyphs above the figures; a blade above them all stays)
            continue
        lab_i = i + 1
        if lab_i not in figs and (b[0].stop - b[0].start) * (b[1].stop - b[1].start) < 40:
            continue
        member[int(np.argmin(np.abs(cx - (b[1].start + b[1].stop) / 2)))].append(lab_i)
    out = []
    for j in range(6):
        m = np.isin(flab, member[j])
        ys, xs = np.where(m); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
        out.append(dict(rgb=a[sl].astype(np.uint8), mask=m[sl], x0=sl[1].start, y0=sl[0].start))
    return out


def crown_row(fr):
    """the top of his hair: the topmost gold piece of a head's size (the blade's guard and grip are thinner)."""
    c = fr['rgb'].astype(int); m = fr['mask']
    gold = m & (c[..., 0] > 150) & (c[..., 0] - c[..., 2] > 80) & (c[..., 1] > 70) & (c[..., 1] < 215)
    lab, n = ndimage.label(gold)
    best = None
    for i, b in enumerate(ndimage.find_objects(lab)):
        h, w = b[0].stop - b[0].start, b[1].stop - b[1].start
        if h > m.shape[0] * 0.07 and w > m.shape[1] * 0.12 and b[0].start < m.shape[0] * 0.6 and (best is None or b[0].start < best):
            best = b[0].start
    return best if best is not None else 0


def to1x(fr, k):
    h, w = fr['mask'].shape; nw, nh = max(1, round(w * k)), max(1, round(h * k))
    al = np.asarray(Image.fromarray((fr['mask'] * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) / 255
    pm = fr['rgb'].astype(np.float32) * fr['mask'][..., None]
    rgb = np.stack([np.asarray(Image.fromarray(np.clip(pm[..., c], 0, 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) for c in range(3)], -1)
    rgb = rgb / np.maximum(al[..., None], 1e-6) / 255
    solid = al >= 0.5
    o = np.zeros((nh + 2, nw + 2, 4), np.uint8)
    s2 = np.zeros((nh + 2, nw + 2), bool); s2[1:-1, 1:-1] = solid
    o[1:-1, 1:-1][solid, :3] = pix.snap(rgb)[solid]; o[s2, 3] = 255
    e = np.zeros_like(s2); e[1:, :] |= s2[:-1, :]; e[:-1, :] |= s2[1:, :]; e[:, 1:] |= s2[:, :-1]; e[:, :-1] |= s2[:, 1:]
    o[e & ~s2, :3] = OUTL; o[e & ~s2, 3] = 255
    return o


def boots(o):
    """the two biggest pieces in the bottom 5 rows (a blade's tip low beside him is a sliver): their middles, and the lowest row."""
    al = o[..., 3] > 0; ys = np.where(al.any(1))[0]; b = ys[-1]
    band = al.copy(); band[: b - 4] = False
    lab, n = ndimage.label(band)
    if n == 0:
        return [o.shape[1] / 2], b
    s = ndimage.sum(band, lab, range(1, n + 1)); big = np.argsort(s)[::-1][:2] + 1
    return sorted(ndimage.center_of_mass(band, lab, i)[1] for i in big), b


def place(o):
    xs, b = boots(o); cx = sum(xs) / len(xs)
    cell = np.zeros((FH, FW, 4), np.uint8)
    dx, dy = int(round(AX - cx)), AY - b
    h, w = o.shape[:2]
    x0, y0 = max(0, dx), max(0, dy); sx, sy = x0 - dx, y0 - dy
    x1, y1 = min(FW, dx + w), min(FH, dy + h)
    cell[y0:y1, x0:x1] = o[sy:sy + (y1 - y0), sx:sx + (x1 - x0)]
    return cell, (dx, dy), (dx < 0) or (dy < 0) or (dx + w > FW) or (dy + h > FH)


def steel_tip(cell, rig):
    """the blade's tip: the steel pixel furthest from the rig's fist, toward the rig's tip (None if no steel there)."""
    c = cell[..., :3].astype(int); al = cell[..., 3] > 0
    st = al & (c.min(axis=2) > 120) & (c.max(axis=2) - c.min(axis=2) < 50)
    ys, xs = np.where(st)
    if not len(xs):
        return None
    F = np.array(rig['fist']); u = np.array(rig['tip']) - F; u = u / (np.linalg.norm(u) or 1)
    proj = (xs - F[0]) * u[0] + (ys - F[1]) * u[1]
    i = int(np.argmax(proj))
    return (float(xs[i]), float(ys[i])) if proj[i] > 4 else None


def stamp(img, p0, p1, s, col):
    n = max(1, int(math.ceil(math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * 2))); h = (s - 1) / 2
    for i in range(n + 1):
        t = i / n; x = int(round(p0[0] + (p1[0] - p0[0]) * t - h)); y = int(round(p0[1] + (p1[1] - p0[1]) * t - h))
        for yy in range(y, y + s):
            for xx in range(x, x + s):
                if 0 <= xx < img.shape[1] and 0 <= yy < img.shape[0]:
                    img[yy, xx, :3] = col; img[yy, xx, 3] = 255


def blade_behind(cell, rp):
    F = np.array(rp['fist'], float); T = np.array(rp['tip'], float); u = (T - F) / (np.linalg.norm(T - F) or 1); p = np.array([-u[1], u[0]])
    layer = np.zeros_like(cell); G, B0 = F + u * 3, F + u * 4
    stamp(layer, B0, T - u, 3, OUTL); stamp(layer, G - p * 3, G + p * 3, 3, OUTL)
    stamp(layer, B0, T - u * 2, 1, STEEL); stamp(layer, B0 + p * 0.9, T - u * 3 + p * 0.9, 1, STEEL2); stamp(layer, G - p * 2, G + p * 2, 1, GUARD)
    put = (layer[..., 3] > 0) & (cell[..., 3] == 0)
    cell[put] = layer[put]


def main():
    frames, score = {}, {}
    for view, fn in PAGES.items():
        fr = page_frames(os.path.join(SRC, fn))
        rig = RP[view]; rig_rows = AY - rig[0]['crown'][1]
        ys = np.where(fr[0]['mask'].any(1))[0]; page_rows = ys[-1] - crown_row(fr[0])
        k = rig_rows / page_rows
        cells, rows = [], []
        for i, f in enumerate(fr):
            o = to1x(f, k); cell, off, clipped = place(o)
            r = rig[i]
            crown = off[1] + 1 + round(crown_row(f) * k)          # (his hair's top in the cell)
            xs, b = boots(o)
            if (view, i) in BLADE_BEHIND:
                blade_behind(cell, r)
            tip = steel_tip(cell, r)
            rows.append(dict(frame=i + 1, crown_d=int(round(r['crown'][1] - crown)), clipped=bool(clipped),
                             bottom=int(f['y0'] + np.where(f['mask'].any(1))[0][-1]),
                             stance=round(xs[-1] - xs[0], 1) if len(xs) > 1 else None,
                             tip=None if tip is None else [round(tip[0], 1), round(tip[1], 1)],
                             tip_d=None if tip is None else round(float(np.hypot(tip[0] - r['tip'][0], tip[1] - r['tip'][1])), 1),
                             reach=None if tip is None else round(float(np.hypot(tip[0] - AX, tip[1] - (AY - 30))), 1)))
            cells.append(cell)
        frames[view] = cells
        st0 = rows[0]['stance']; bots = [r_['bottom'] for r_ in rows]
        score[view] = dict(k=round(k, 4), n=len(fr), rows=rows, bob_1x=round((max(bots) - min(bots)) * k, 1),
                           stance_d=max((abs(r_['stance'] - st0) for r_ in rows if r_['stance'] is not None and st0 is not None), default=None))
        print('%-2s k %.4f  crown off %s  tip off %s  bob %.1f  stance drift %s%s' % (
            view, k, [r_['crown_d'] for r_ in rows], [r_['tip_d'] for r_ in rows], score[view]['bob_1x'], score[view]['stance_d'],
            '  CLIPPED ' + str([r_['frame'] for r_ in rows if r_['clipped']]) if any(r_['clipped'] for r_ in rows) else ''))

    front = ['S', 'SE', 'E', 'NE'] + (['N'] if WITH_N else [])
    def facing_cells(view):
        if view in MIRROR and MIRROR[view] in front:
            return [np.ascontiguousarray(c[:, ::-1]) for c in frames[MIRROR[view]]]
        return frames[view] if view in front else [np.zeros((FH, FW, 4), np.uint8)] * 6
    drawn = sorted(ORDER.index(f) for f in ORDER if f in front or MIRROR.get(f) in front)

    # ---- the row onto barley_p3: its own row replaced if there, else under the last row; the sheet widened to the row's six cells
    jp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json'); ip = os.path.join(ROOT, 'deep16', 'art', NAME + '.png')
    meta = json.load(open(jp, encoding='utf-8')); img = np.asarray(Image.open(ip).convert('RGBA'))
    old = meta['anims'].pop(ROW, None)
    if old:
        img = img[:old['y']]
    y = max(a.get('y', 0) + 8 * a.get('fh', meta['fh']) for a in meta['anims'].values())
    img = img[:y]
    Wd = max(img.shape[1], 6 * FW)
    sheet = np.zeros((y + 8 * FH, Wd, 4), np.uint8); sheet[:y, :img.shape[1]] = img
    for j, f in enumerate(ORDER):
        for i, c in enumerate(facing_cells(f)):
            sheet[y + j * FH:y + (j + 1) * FH, i * FW:(i + 1) * FW] = c
    meta['anims'][ROW] = dict(y=y, fw=FW, fh=FH, ax=AX, ay=AY, frames=6, fps=12, release=3, drawn=drawn)
    if 'longsword' not in meta['source']:
        meta['source'] += ('; the longsword row (the one-handed slash, the sword drawn in his hand) from the art desk\'s mannequin pilot of 11-04, '
                           'cut by tools/barley-slash-sheet.py')
    Image.fromarray(sheet, 'RGBA').save(ip, optimize=True)
    with open(jp, 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    json.dump(score, open(os.path.join(OUT, 'pilot-score.json'), 'w', encoding='utf-8', newline='\n'), indent=1)

    # ---- the review: each view's six cells at 4x, the mannequin's fist (blue ring) and tip (magenta ring), the feet line
    Z = 4; G = 6; views = ['S', 'SE', 'E', 'NE', 'N']
    rv = Image.new('RGBA', (60 + 6 * (FW * Z + G), 30 + len(views) * (FH * Z + G)), (12, 20, 40, 255)); d = ImageDraw.Draw(rv)
    for j, view in enumerate(views):
        y0 = 30 + j * (FH * Z + G)
        d.text((6, y0 + FH * Z // 2), view + ('' if view in front else '\n(held)'), fill=(230, 230, 240))
        for i, c in enumerate(frames[view]):
            x0 = 60 + i * (FW * Z + G)
            d.rectangle([x0 - 1, y0 - 1, x0 + FW * Z, y0 + FH * Z], outline=(240, 196, 64) if i == 3 else (44, 56, 86))
            rv.alpha_composite(Image.fromarray(c, 'RGBA').resize((FW * Z, FH * Z), Image.NEAREST), (x0, y0))
            d.line([x0, y0 + (AY + 1) * Z, x0 + FW * Z, y0 + (AY + 1) * Z], fill=(120, 200, 140))
            for key, col in (('fist', (60, 160, 255)), ('tip', (230, 60, 200))):
                fx, fy = RP[view][i][key]; d.ellipse([x0 + fx * Z - 7, y0 + fy * Z - 7, x0 + fx * Z + 7, y0 + fy * Z + 7], outline=col, width=2)
    for i in range(6):
        d.text((60 + i * (FW * Z + G) + 4, 10), str(i + 1) + (' HIT' if i == 3 else ''), fill=(240, 196, 64) if i == 3 else (220, 226, 240))
    rv.save(os.path.join(OUT, 'pilot-review.png'), optimize=True)
    print('%s: %dx%d; %s drawn in %s; review and score in %s' % (NAME, Wd, sheet.shape[0], ROW, [ORDER[i] for i in drawn], OUT))


main()

"""DEEP16 pipeline 2 (generated art): Barley in mail with a GREATAXE -- the overhand chop, one row added to his chain sheet barley_p3.

    python tools/barley-greataxe-sheet.py          (adds `greataxe` to deep16/art/barley_p3.png/.json)
    python tools/barley-greataxe-sheet.py check    (also dev/visions/barley/greataxe.png, every facing at 2x)

The art desk's ART-WANTED-85-BARLEY-CHAINMAIL-GREATAXE (11-19, its own: no ask of ours carries it -- our outbox's proposed ART-WANTED-85 is the guard's spear
throw), sorted out of Fresh to deep16/_src/barley/2026-11-19-ART-WANTED-85-CHAINMAIL-GREATAXE/ (the zip beside it), cut 11-19 by the cutter seat
(cutter-barley-1119) on the lanes desk's relay of Griz's "have the cutter start on the new barley and compare with what we'd render in game today if barely
equipped a greataxe". Five pages, HEAD 1 S, 2 SE, 3 E, 4 the rear NE, 5 N, six poses each: guard, lift, overhead windup, the chop (frame 4, `release` 3),
low follow-through, recover -- the greataxe painted into the poses (the Blender seat's guide, the same chop as Talmok's ART-WANTED-84).

The cut keeps the art desk's registration (its FRAME-MAP.csv): each frame its source rectangle, boxed down by the page's `source_to_1x_scale` times FIT, and
placed by the desk's anchor in its 112 x 80 preview cell (the rear boot's landmark) -- FIT brings the desk's ~51-px guard to his installed height (barley_p3's
idle, 47 px of figure). Snapped and outlined as tools/talmok-axe-sheet.py does (the 64; red, fire and violet left out); SW W NW the mirrors of SE E NE.

Before it, a greataxe in his hands played his empty-handed `attack` and `attack2` with the BATTLEAXE drawn by code through his fists (js/sprites.js
S.wieldOf: a greataxe is drawn as the battleaxe). Shown the two side by side (deep16/?barleyshow beat `greataxe`), Griz, 11-19: "looks like we have to keep
the code-drawn idle, but the attacks are way beeter on the right" -- so both blows play this row while a greataxe is in his hands (js/sprites.js
S.HELD.greataxe), his idle and walk keep the code-drawn axe. The row carries no `grips`, so no code axe is drawn over the painted one (the art desk's
"suppress the equipped-weapon overlay for this row").
"""
import os, sys, json, csv
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
VS = _load('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
ART = os.path.join(ROOT, 'deep16', 'art')
NAME, ROW, FPS, RELEASE = 'barley_p3', 'greataxe', 12, 3
SRC = os.path.join(pix.SRC, 'barley', '2026-11-19-ART-WANTED-85-CHAINMAIL-GREATAXE')
AVOID = ['red', 'fire', 'violet']
FIT = 47 / 51.0                                     # (his installed idle, 47 px of figure, over the desk's ~51-px guard)
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}   # (the sheet's facings: S SW W NW N NE E SE)
MIRROR = {1: 7, 2: 6, 3: 5}


def frames():
    rows = list(csv.DictReader(open(os.path.join(SRC, 'FRAME-MAP.csv'), encoding='utf-8-sig')))
    out, pages = {}, {}
    for fc in FACE:
        mine = sorted([r for r in rows if r['facing'] == fc], key=lambda r: int(r['frame']))
        assert [int(r['frame']) for r in mine] == list(range(1, 7)), (fc, [r['frame'] for r in mine])   # (every number once, none skipped)
        cells = []
        for r in mine:
            fn = r['source_png']
            if fn not in pages:
                pages[fn] = np.asarray(Image.open(os.path.join(SRC, fn)).convert('RGB')).astype(np.float32)
            a = pages[fn]; x, y, w, h = (int(r[k]) for k in ('source_x', 'source_y', 'source_width', 'source_height'))
            P = 6
            win = a[max(0, y - P):y + h + P, max(0, x - P):x + w + P]
            m = VS.figure(win)
            ys, xs = np.where(m); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
            k = float(r['source_to_1x_scale']) * FIT
            o = VS.to1x(win[sl], m[sl], k, AVOID)
            yy = np.where((o[..., 3] > 0).any(1))[0]
            ax = (float(r['anchor_x']) - float(r['art_offset_x_in_cell'])) * FIT + 1
            cells.append((o, ax, int(yy[-1])))
        out[FACE[fc]] = cells
    for mf, src in MIRROR.items():
        out[mf] = [(np.ascontiguousarray(o[:, ::-1]), o.shape[1] - x, foot) for o, x, foot in out[src]]
    return out


def add(check=False):
    fr = frames()
    base = np.asarray(Image.open(os.path.join(ART, NAME + '.png')).convert('RGBA')).copy()
    meta = json.load(open(os.path.join(ART, NAME + '.json')))
    meta['anims'].pop(ROW, None)                                     # (a re-run: the old row dropped first)
    y0 = max(a['y'] + 8 * a.get('fh', meta['fh']) for a in meta['anims'].values())
    base = base[:y0]
    allf = [c for f in range(8) for c in fr[f]]
    up = max(foot + 1 for o, x, foot in allf); dn = max(o.shape[0] - foot - 1 for o, x, foot in allf)
    ay = up + 1; fh = ay + max(dn, 2) + 1
    half = int(np.ceil(max(max(x, o.shape[1] - x) for o, x, foot in allf))) + 2; fw, ax = 2 * half, half
    blk = np.zeros((8 * fh, 6 * fw, 4), np.uint8)
    for f in range(8):
        for i, (o, x, foot) in enumerate(fr[f]):
            dx, dy = int(round(ax - x)), ay - foot
            cell = blk[f * fh:(f + 1) * fh, i * fw:(i + 1) * fw]
            on = o[..., 3] > 0
            cell[dy:dy + o.shape[0], dx:dx + o.shape[1]][on] = o[on]
    meta['anims'][ROW] = {k_: int(v_) for k_, v_ in {'y': y0, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'frames': 6, 'fps': FPS, 'release': RELEASE}.items()}
    W = max(base.shape[1], blk.shape[1])
    sheet = np.zeros((y0 + blk.shape[0], W, 4), np.uint8); sheet[:base.shape[0], :base.shape[1]] = base; sheet[y0:, :blk.shape[1]] = blk
    src = meta.get('source', '')
    meta['source'] = src.split(' -- the greataxe row')[0] + (' -- the greataxe row drawn by the art desk (ART-WANTED-85-BARLEY-CHAINMAIL-GREATAXE, 11-19), '
                                                            'added by tools/barley-greataxe-sheet.py')
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, NAME + '.png'), optimize=True)
    json.dump(meta, open(os.path.join(ART, NAME + '.json'), 'w'), indent=1)
    print('  %s: %dx%d, + %s 6 (%dx%d), release %d' % (NAME, sheet.shape[1], sheet.shape[0], ROW, fw, fh, RELEASE))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'barley'); os.makedirs(d, exist_ok=True)
        cv = np.zeros(blk.shape[:2] + (3,), np.uint8); cv[...] = (14, 22, 52)
        for f in range(8):
            cv[f * fh + ay, :] = (90, 70, 50)
        al = blk[..., 3:4] / 255.0; cv = (blk[..., :3] * al + cv * (1 - al)).astype(np.uint8)
        Image.fromarray(cv).resize((cv.shape[1] * 2, cv.shape[0] * 2), Image.NEAREST).save(os.path.join(d, 'greataxe.png'))
        print('  dev/visions/barley/greataxe.png')


if __name__ == '__main__':
    add('check' in sys.argv[1:])

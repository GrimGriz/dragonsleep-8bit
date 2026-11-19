"""DEEP16 pipeline 2 (generated art): the Line Guard man's spear moves -- three rows added to his fight sheet guard_p2: `throw`, `shove`, `keepback`.

    python tools/guard-spear-sheet.py          (adds the rows to deep16/art/guard_p2.png/.json)
    python tools/guard-spear-sheet.py check    (also dev/visions/guard/<row>.png, every facing at 2x)

Asked from the engine side (the Blender seat for the lanes desk, 11-19): ASK-2026-11-19-guard-spear-throw-and-keep-back (our proposed ART-WANTED-85; the art
desk numbered its pages 86) -- PAGE 1 the Spear Throw, PAGE 2 Keep Back as first posed, the shaft held across the body; then ASK-2026-11-19b, the Keep Back
re-posed as THE POINT OUT (his "I see it point-end out, but like extend on 2, point on 3, point in a different spot on 4, quick return on 5 - like they're
stabbing empty space to keep the foe out of that space"). Both deliveries sorted out of Fresh to deep16/_src/guard/ (the zips beside them), cut 11-19 by the
cutter seat (cutter-guard-1119) on his "spear moves are in Fresh when you're ready", and his word on the first Keep Back: "What it call's keep-back is going to
be 'shove' from the action though, a new keep-back for the feat will be drawn and delivered to Fresh". So:
  throw     <- the first delivery's PAGE 1 (6, `release` 3: frame 4 the last with the spear in his hand, the engine's spear flies from it)
  shove     <- the first delivery's PAGE 2, the shaft across the body (6, `release` 3) -- the Shove action's row
  keepback  <- the second delivery's PAGE 2, the point out (6, `release` 3: the low point) -- the feat's row
HEAD 1 S, 2 SE, 3 E, 4 the rear NE, 5 N; SW W NW the mirrors of SE E NE (RULED 10-14).

The cut keeps the art desk's registration: its FRAME-MAP.csv gives each frame a source rectangle, a `scale` to the guard's installed 53-px stand, and a place in
a 96 x 96 cell whose origin is x 48 and sole line y 76 -- guard_p2's own cell and anchor, so each frame is placed as the desk placed it. Snapped and outlined as
tools/talmok-axe-sheet.py does (the 64; red, fire and violet left out).
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
NAME = 'guard_p2'
GUARD = os.path.join(pix.SRC, 'guard')
FIRST, POINT = '2026-11-19-ART-WANTED-86-GUARD-SPEAR-MAN', '2026-11-19-ART-WANTED-86-GUARD-KEEP-BACK-POINT-OUT'
# row: (its delivery, the frame map's action, fps)
ROWS = [('throw', FIRST, 'throw', 12), ('shove', FIRST, 'keepback', 12), ('keepback', POINT, 'keepback', 12)]
RELEASE = {'throw': 3, 'shove': 3, 'keepback': 3}
AVOID = ['red', 'fire', 'violet']
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}   # (the sheet's facings: S SW W NW N NE E SE)
MIRROR = {1: 7, 2: 6, 3: 5}


def frames(folder, action):
    rows = [r for r in csv.DictReader(open(os.path.join(GUARD, folder, 'FRAME-MAP.csv'), encoding='utf-8-sig')) if r['action'] == action]
    out, pages = {}, {}
    for fc in FACE:
        mine = sorted([r for r in rows if r['facing'] == fc], key=lambda r: int(r['frame']))
        assert [int(r['frame']) for r in mine] == list(range(1, 7)), (folder, action, fc, [r['frame'] for r in mine])   # (every number once, none skipped)
        cells = []
        for r in mine:
            fn = os.path.join(GUARD, folder, 'sources', r['source'])
            if fn not in pages:
                pages[fn] = np.asarray(Image.open(fn).convert('RGB')).astype(np.float32)
            a = pages[fn]; x, y, w, h = (int(r[k]) for k in ('source_x', 'source_y', 'source_w', 'source_h'))
            P = 6
            win = a[max(0, y - P):y + h + P, max(0, x - P):x + w + P]
            m = VS.figure(win)
            ys, xs = np.where(m); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
            o = VS.to1x(win[sl], m[sl], float(r['scale']), AVOID)
            yy = np.where((o[..., 3] > 0).any(1))[0]
            cells.append((o, float(r['origin_x']) - float(r['tile_x']) + 1, int(yy[-1])))
        out[FACE[fc]] = cells
    for mf, src in MIRROR.items():
        out[mf] = [(np.ascontiguousarray(o[:, ::-1]), o.shape[1] - x, foot) for o, x, foot in out[src]]
    return out


def add(check=False):
    base = np.asarray(Image.open(os.path.join(ART, NAME + '.png')).convert('RGBA')).copy()
    meta = json.load(open(os.path.join(ART, NAME + '.json')))
    for row, _, _, _ in ROWS:                                         # (a re-run: the old rows dropped first)
        meta['anims'].pop(row, None)
    y0 = max(a['y'] + 8 * a.get('fh', meta['fh']) for a in meta['anims'].values())
    base = base[:y0]
    FW, FH, AX, AY = meta['fw'], meta['fh'], meta['ax'], meta['ay']   # (the guard's own cell: every row of his on it)
    blocks, clip = [], []
    for row, folder, action, fps in ROWS:
        fr = frames(folder, action)
        blk = np.zeros((8 * FH, 6 * FW, 4), np.uint8)
        for f in range(8):
            for i, (o, x, foot) in enumerate(fr[f]):
                dx, dy = int(round(AX - x)), AY - foot
                sy0, sx0 = max(0, -dy), max(0, -dx)
                hh, ww = min(o.shape[0] - sy0, FH - max(0, dy)), min(o.shape[1] - sx0, FW - max(0, dx))
                if sy0 or sx0 or hh < o.shape[0] or ww < o.shape[1]:
                    clip.append('%s %d.%d' % (row, f, i + 1))
                sub = o[sy0:sy0 + hh, sx0:sx0 + ww]
                cell = blk[f * FH + max(0, dy):f * FH + max(0, dy) + hh, i * FW + max(0, dx):i * FW + max(0, dx) + ww]
                on = sub[..., 3] > 0; cell[on] = sub[on]
        meta['anims'][row] = {'y': int(y0), 'frames': 6, 'fps': fps, 'release': RELEASE[row]}
        blocks.append(blk); y0 += 8 * FH
    W = max([base.shape[1]] + [b.shape[1] for b in blocks])
    sheet = np.zeros((y0, W, 4), np.uint8); sheet[:base.shape[0], :base.shape[1]] = base; y = base.shape[0]
    for b in blocks:
        sheet[y:y + b.shape[0], :b.shape[1]] = b; y += b.shape[0]
    src = meta.get('source', '')
    meta['source'] = src.split(' -- the spear rows')[0] + (' -- the spear rows (throw, shove, keepback) drawn by the art desk (ART-WANTED-86, the man, 11-19: '
                                                          'the spear throw, the shaft shove, the point out), added by tools/guard-spear-sheet.py')
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, NAME + '.png'), optimize=True)
    json.dump(meta, open(os.path.join(ART, NAME + '.json'), 'w'), indent=1)
    print('  %s: %dx%d, + throw, shove, keepback (6 each, %dx%d)%s' % (NAME, sheet.shape[1], sheet.shape[0], FW, FH, '; clipped at the cell: ' + ', '.join(clip) if clip else ''))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'guard'); os.makedirs(d, exist_ok=True)
        for (row, _, _, _), blk in zip(ROWS, blocks):
            cv = np.zeros(blk.shape[:2] + (3,), np.uint8); cv[...] = (14, 22, 52)
            for f in range(8):
                cv[f * FH + AY, :] = (90, 70, 50)
            al = blk[..., 3:4] / 255.0; cv = (blk[..., :3] * al + cv * (1 - al)).astype(np.uint8)
            Image.fromarray(cv).resize((cv.shape[1] * 2, cv.shape[0] * 2), Image.NEAREST).save(os.path.join(d, '%s.png' % row))
        print('  dev/visions/guard/<row>.png')


if __name__ == '__main__':
    add('check' in sys.argv[1:])

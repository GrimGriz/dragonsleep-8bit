"""DEEP16 pipeline 2 (generated art): the kept child, Nell, as she is -- her own town figure (11-12, cutter-art139, on the lanes desk's relay of Griz's
"Fresh refilled"; asked as art-wanted section 52 on his "art request for girl and goblin (or did I ask already)"). Ruling 42: a figure of her own, always on
the screen, beside the party's token once she goes with them; under the glamour she stays goblinchild_p1 (tools/goblinchild-sheet.py).

    python -I tools/keptchild-sheet.py           # deep16/art/keptchild_p1 (.png + .json); `check` also writes dev/visions/keptchild-check.png (every facing, 4x)

Sources: the art desk's ART-139 (deep16/_src/ART-139/, sorted out of Fresh 11-12 by _src/art-desk/art134p6-art139-sort-2026-11-12.py; a worktree reads the main
checkout's): HEAD 4 S, 5 SE, 6 E, 7 NE, 8 N, each an Idle 4 and a Walk 8. The art desk delivered them CUT, `native/keptchild_p1-<view>/idle-NN.png` and
`walk-NN.png`, in the townsfolk's cell (72 x 64, anchor 36, 60, the child's 35 px: folkchild_p1) and snapped to the packet's palette. Each is VERIFIED here before
it goes on the sheet:
  - a frame for every row of FRAME-MAP.csv for its page and action, and no other (the counts, 4 and 8, every number once);
  - 72 x 64, hard alpha, its feet on the anchor's row (60: the art desk's stood on 59, a row above folkchild_p1's and goblinchild_p1's, and are set down
    one px) and its height the child's 35 within 3 px;
  - its height over its source drawing's (FRAME-MAP's `ink_` box) one scale across its page, within 6% (a frame cut from another drawing, or squashed, stands out);
  - snapped to the game's 64 colours (tools/pixelate.py snap; the count of pixels moved is printed: 0 when the art desk kept to them).
Facings (the house's eight, RULED 10-14): S, SE, E, NE, N as drawn; SW, W, NW the mirrors of SE, E, NE (townsfolk-sheet.py `mirror`). The art desk holds four Walk rows
(S, SE, NE, N: the leg exchange and the ankle mark) -- cut as drawn, as the goblin's and the townsfolk's runs were, and on deep16-dream-polish.md.
"""
import os, sys, csv, json
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(ROOT, 'tools', name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix, TF = _load('pixelate'), _load('townsfolk-sheet')
SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(ROOT))) if '.claude' in ROOT.split(os.sep) else ROOT, 'deep16', '_src', 'ART-139')

NAME = 'keptchild_p1'
FW, FH, AX, AY = 72, 64, 36, 60
TALL = 35
VIEWS = {'S': 'ART-139-NELL-HEAD-4-S.png', 'SE': 'ART-139-NELL-HEAD-5-SE.png', 'E': 'ART-139-NELL-HEAD-6-E.png', 'NE': 'ART-139-NELL-HEAD-7-NE.png',
         'N': 'ART-139-NELL-HEAD-8-N.png'}
ROWS = ['idle', 'walk']
FPS = {'idle': 5, 'walk': 12}                   # (the child's own: folkchild_p1)


def build():
    fm = list(csv.DictReader(open(os.path.join(SRC, 'FRAME-MAP.csv'), encoding='utf-8')))
    out, report, bad, moved, nudged = {}, [], [], 0, [0]
    for v, page in VIEWS.items():
        out[v] = {}
        for an in ROWS:
            rows = sorted((r for r in fm if r['page'] == page and r['action'] == an), key=lambda r: int(r['frame']))
            nums = [int(r['frame']) for r in rows]
            if nums != list(range(1, len(nums) + 1)): bad.append('%s %s: FRAME-MAP numbers %s' % (v, an, nums))
            d = os.path.join(SRC, 'native', '%s-%s' % (NAME, v.lower()))
            have = sorted(f for f in os.listdir(d) if f.startswith(an + '-'))
            if len(have) != len(rows): bad.append('%s %s: %d frames, FRAME-MAP %d' % (v, an, len(have), len(rows)))
            fr, ks = [], []
            for r in rows:
                fn = os.path.join(d, '%s-%02d.png' % (an, int(r['frame'])))
                im = np.array(Image.open(fn).convert('RGBA'))
                tag = '%s %s %s' % (v, an, r['frame'])
                if im.shape[:2] != (FH, FW): bad.append('%s: %dx%d' % (tag, im.shape[1], im.shape[0])); continue
                a = im[..., 3]
                if ((a > 0) & (a < 255)).any(): bad.append('%s: soft alpha' % tag)
                ys = np.where(a.any(axis=1))[0]
                if ys.max() == AY - 1 and not a[-1].any():   # (the art desk's cut stands the feet one row above the anchor; folkchild_p1 and goblinchild_p1 stand ON it -- set down a px, so the glamour and the girl swap in place)
                    im = np.roll(im, 1, axis=0); a = im[..., 3]; ys = ys + 1; nudged[0] += 1
                if ys.max() != AY: bad.append('%s: feet at %d, not %d' % (tag, ys.max(), AY))
                h = ys.max() - ys.min() + 1
                if abs(h - TALL) > 3: bad.append('%s: %d px tall' % (tag, h))
                ks.append((int(r['ink_bottom']) - int(r['ink_top'])) / float(h))
                solid = a >= 128
                sn = pix.snap(im[..., :3].astype(np.float32) / 255.0)
                g = np.zeros_like(im); g[solid, :3] = sn[solid]; g[solid, 3] = 255
                moved += int((solid & (g[..., :3] != im[..., :3]).any(-1)).sum())
                fr.append(g)
            if ks:
                med = float(np.median(ks))
                for r, k in zip(rows, ks):
                    if abs(k / med - 1) > 0.06: bad.append('%s %s %s: scale %.2f, its page %.2f' % (v, an, r['frame'], k, med))
            out[v][an] = fr
            report.append('%s %s: %d frames, scale %.2f source px a px' % (v, an, len(fr), float(np.median(ks)) if ks else 0))
    print('\n'.join(report))
    print('%d frames set down 1 px onto the anchor row; %d px moved to the palette; %s' % (nudged[0], moved, ('FAIL\n  ' + '\n  '.join(bad)) if bad else 'all VERIFIED'))
    if bad: raise SystemExit(1)
    frames = {}
    for an in ROWS:
        d = out
        frames[an] = [d['S'][an], TF.mirror(d['SE'][an]), TF.mirror(d['E'][an]), TF.mirror(d['NE'][an]), d['N'][an], d['NE'][an], d['E'][an], d['SE'][an]]
    return frames


def check(frames):
    rows = []
    for an in ROWS:
        for fc in frames[an]:
            row = np.zeros((FH, FW * 8, 4), np.uint8)
            for i, f in enumerate(fc[:8]): row[:, i * FW:(i + 1) * FW] = f
            rows.append(row)
    sh = np.concatenate(rows, 0); bg = np.zeros(sh.shape[:2] + (3,), np.uint8); bg[...] = (14, 20, 48)
    al = sh[..., 3:4] / 255.0; img = (sh[..., :3] * al + bg * (1 - al)).astype(np.uint8)
    for k in range(len(rows)): img[k * FH + AY, :] = (120, 80, 50)
    d = os.path.join(ROOT, 'dev', 'visions'); os.makedirs(d, exist_ok=True)
    Image.fromarray(img).resize((img.shape[1] * 4, img.shape[0] * 4), Image.NEAREST).save(os.path.join(d, 'keptchild-check.png'))
    print('  dev/visions/keptchild-check.png')


if __name__ == '__main__':
    frames = build()
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    mp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(mp))
    for an, fps in FPS.items():
        meta['anims'][an]['fps'] = fps
    meta['source'] = 'drawn and cut by the art desk (ART-139, 11-11: five views of Idle 4 and Walk 8, the S, SE, NE and N walks its ART HOLD), verified and sheeted by tools/keptchild-sheet.py (11-12)'
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ROWS)))
    if 'check' in sys.argv[1:]: check(frames)

"""DEEP16 pipeline 2 (generated art): the violet fungus, the SRD's Medium plant -> deep16/art/violetfungus_p1, every facing from its one view.

    python tools/violetfungus-sheet.py            (writes deep16/art/violetfungus_p1.png/.json)
    python tools/violetfungus-sheet.py check      (also deep16/art-src/violetfungus/violetfungus_p1-review.png)

Asked in art-wanted section 4 (a creature for each biome; the 10-08 scout's lean, deep16-srd-not-yet.md section 6: the Guano Galleries); the art desk's ART-15, two pages
(HEAD 1 PAGE 1: the portrait and turnaround -- not cut -- then Idle 6, Creep 8, Rotting Touch 6; PAGE 2: Flinch 4, Fall 6, Prone 2), in deep16/_src/violetfungus/ since 10-10
and never cut; the ART-15-violet-fungus-FINAL-SHEETS.zip of 11-15 holds the same two pages byte for byte (to deep16/_src/_dupes/violetfungus/). Cut 11-15 by the
cutter-fresh-1115 seat on the lanes desk's queue.

The drawings found by their pieces on the navy (tools/frostgiant-sheet.py's way: bands and columns at the page's widest empty gaps, the counts given here; a light glyph
low by a drawing is a printed number), cut with tools/doran-sheet.py's snap. ONE VIEW (the ask: "a mushroom has no back"): HEAD 1, drawn facing the bottom-right, plays
S, SE, E, NE and N as drawn and SW, W, NW mirrored. Its height: TALL, as tall as a man (the ask). Page 2 drawn at its own size: its Flinch 1 to the Idle's height, and
the Fall and Prone at that page's scale. Standing frames placed by the cap (the middle of the top 55%: the cap rides over the stalk, and the Rotting Touch's tendrils
reach far along the ground); the low heap (Fall 4-6) and the toppled one (Prone 1) by the whole body's middle. The Rotting Touch's dark puff of rot stays drawn (his
"4 agreed", 11-15: a one-shot hit stays).

Rows: idle 6; still 1 (Idle 1 held: False Appearance, js/ui.js -- it stands as an ordinary fungus till it acts); walk 8 <- Creep; touch 6 <- Rotting Touch (`release`
3: the lash lands on frame 4; js/battle.js plays the row named for the attack); flinch 4; hurt 6 <- Fall; prone 2 <- Fall 6 then Prone 1; getup 1 <- Prone 2.
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doransheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)
pix = DS.pix
FOLDER = os.path.join(pix.SRC, 'violetfungus')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'violetfungus')
NAME = 'violetfungus_p1'
TALL = 48                       # (as tall as a man: the townsfolk and heroes stand 49 to 54)
TOL, HOLE, MINA, BIG, PAD = 30, 400, 40, 0.03, 18
TOP = 0.55
AVOID = ['red', 'fire']
PAGES = {'ART-15_HEAD-1_PAGE-1.png': [('turn', 5), ('idle', 6), ('walk', 8), ('touch', 6)], 'ART-15_HEAD-1_PAGE-2.png': [('flinch', 4), ('hurt', 6), ('prone', 2)]}
LYING = {('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)}
ROWS = [('idle', 4, [('idle', i) for i in range(6)]), ('still', 1, [('idle', 0)]), ('walk', 6, [('walk', i) for i in range(8)]),
        ('touch', 10, [('touch', i) for i in range(6)]), ('flinch', 10, [('flinch', i) for i in range(4)]), ('hurt', 8, [('hurt', i) for i in range(6)]),
        ('prone', 8, [('hurt', 5), ('prone', 0)]), ('getup', 6, [('prone', 1)])]
RELEASE = {'touch': 3}
DRAWN = {0: 'S', 4: 'N', 5: 'NE', 6: 'E', 7: 'SE'}
SOURCE = ('drawn by the art desk (ART-15, 10-10: art-wanted section 4, the violet fungus), cut by tools/violetfungus-sheet.py, one view; SW W NW mirrored -- '
          'the SRD 5.1 Violet Fungus: deep16/data/foes.js violetfungus')


def runs(occ, k):
    idx = np.where(occ)[0]; segs, s0 = [], idx[0]
    for a, b in zip(idx[:-1], idx[1:]):
        if b > a + 1:
            segs.append((s0, a + 1)); s0 = b
    segs.append((s0, idx[-1] + 1))
    assert len(segs) >= k, ('fewer spans than wanted', len(segs), k)
    gaps = sorted(range(len(segs) - 1), key=lambda j: segs[j + 1][0] - segs[j][1])[-(k - 1):] if k > 1 else []
    out, a0 = [], segs[0][0]
    for j in range(len(segs)):
        if j in gaps or j == len(segs) - 1:
            out.append((a0, segs[j][1]))
            if j + 1 < len(segs):
                a0 = segs[j + 1][0]
    return out


def page(fn):
    """-> {(act, i): (rgb, mask)} every drawing on a page, tight"""
    pg = np.asarray(Image.open(os.path.join(FOLDER, fn)).convert('RGB')).astype(np.float32)
    bg = np.median(np.concatenate([pg[:, :4].reshape(-1, 3), pg[:, -4:].reshape(-1, 3), pg[:4].reshape(-1, 3), pg[-4:].reshape(-1, 3)]), axis=0)
    near = np.linalg.norm(pg - bg, axis=2) < TOL
    lab, _ = ndimage.label(near); edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    out = np.isin(lab, list(edge)); hl, hn = ndimage.label(near & ~out); hs = ndimage.sum(near & ~out, hl, range(1, hn + 1))
    out |= np.isin(hl, [i + 1 for i, s in enumerate(hs) if s > HOLE])
    fl, fn_ = ndimage.label(~out, structure=np.ones((3, 3))); sz = ndimage.sum(~out, fl, range(1, fn_ + 1)); objs = ndimage.find_objects(fl)
    lite = pg.min(-1) > 150
    glyph = lambda i: (objs[i][0].stop - objs[i][0].start) < 60 and (objs[i][1].stop - objs[i][1].start) < 60 and lite[objs[i]][fl[objs[i]] == i + 1].mean() > 0.4
    big = [i for i in range(fn_) if sz[i] >= BIG * np.sort(sz)[-2] and not glyph(i)]   # (the portrait the biggest on page 1: a frame's size against the next)
    bigm = np.isin(fl, [i + 1 for i in big])
    spec = PAGES[fn]; res = {}
    for (act, n), (y0, y1) in zip(spec, runs(bigm.any(1), len(spec))):
        cols = runs(bigm[y0:y1].any(0), n)
        for i, (x0, x1) in enumerate(cols):
            ids = [j for j in big if y0 <= 0.5 * (objs[j][0].start + objs[j][0].stop) < y1 and x0 <= 0.5 * (objs[j][1].start + objs[j][1].stop) < x1]
            assert ids, (fn, act, i)
            box = (min(objs[j][0].start for j in ids), max(objs[j][0].stop for j in ids), min(objs[j][1].start for j in ids), max(objs[j][1].stop for j in ids))
            for j in range(fn_):                                              # (small pieces near it, not a number low by it)
                if j in ids or j in big or sz[j] < MINA:
                    continue
                s_ = objs[j]; dx = max(0, box[2] - s_[1].stop, s_[1].start - box[3]); dy = max(0, box[0] - s_[0].stop, s_[0].start - box[1])
                if max(dx, dy) <= PAD and not glyph(j):                       # (a light glyph is a printed number -- the row above's sit over these)
                    ids.append(j)
            m = np.isin(fl, [j + 1 for j in ids]); ys, xs = np.where(m)
            sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
            res[(act, i)] = (pg[sl], m[sl])
    return res


def cut(check=False):
    D = {}
    for fn in PAGES:
        D.update(page(fn))
    med = lambda xs: float(np.median(xs))
    ih = med([D[('idle', i)][1].shape[0] for i in range(6)])
    k1 = TALL / ih; k2 = k1 * ih / D[('flinch', 0)][1].shape[0]
    cells = {}
    for name, fps, keys in ROWS:
        for (act, i) in keys:
            if (act, i) in cells:
                continue
            rgb, m = D[(act, i)]
            o = DS.to1x(rgb, m, k1 if act in ('idle', 'walk', 'touch') else k2, AVOID)
            al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
            if (act, i) in LYING:
                cx = ndimage.center_of_mass(al)[1]
            else:
                tp = al.copy(); tp[ys[0] + int(TOP * (ys[-1] - ys[0])):] = False; cx = ndimage.center_of_mass(tp)[1]
            cells[(act, i)] = (o, cx, ys[-1])
    anims, blocks, y = {}, [], 0
    for name, fps, keys in ROWS:
        got = [cells[k_] for k_ in keys]
        reach = max(max(cx, o.shape[1] - cx) for (o, cx, foot) in got)
        up = max(foot for (o, cx, foot) in got) + 2; dn = max(o.shape[0] - 1 - foot for (o, cx, foot) in got) + 2
        fw, fh, ax, ay = int(2 * np.ceil(reach + 2)), int(up + dn + 1), int(np.ceil(reach + 2)), int(up)
        blk = np.zeros((8 * fh, len(keys) * fw, 4), np.uint8)
        for f in range(8):
            for j, k_ in enumerate(keys):
                o, cx, foot = cells[k_]
                if f not in DRAWN:                                            # (SW W NW: the drawn view mirrored about the anchor)
                    o, cx = np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - cx
                dx, dy = int(round(ax - cx)), ay - foot; h, w = o.shape[:2]
                assert dy >= 0 and dy + h <= fh and dx >= 0 and dx + w <= fw, (name, f, k_)
                dst = blk[f * fh + dy:f * fh + dy + h, j * fw + dx:j * fw + dx + w]; put = o[..., 3] > 0; dst[put] = o[put]
        a = dict(y=y, fw=fw, fh=fh, ax=ax, ay=ay, frames=len(keys), fps=fps)
        if name in RELEASE:
            a['release'] = RELEASE[name]
        anims[name] = a; blocks.append(blk); y += 8 * fh
    W = max(b.shape[1] for b in blocks); sheet = np.zeros((y, W, 4), np.uint8); yy = 0
    for b in blocks:
        sheet[yy:yy + b.shape[0], :b.shape[1]] = b; yy += b.shape[0]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', NAME + '.png'), optimize=True)
    i0 = anims['idle']
    meta = dict(image='art/%s.png' % NAME, fw=i0['fw'], fh=i0['fh'], ax=i0['ax'], ay=i0['ay'], top=TALL, anims=anims, name='Violet Fungus', source=SOURCE)
    with open(os.path.join(ROOT, 'deep16', 'art', NAME + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: %dx%d, rows %s; page scales %.4f, %.4f' % (NAME, W, y, ', '.join('%s %d@%dx%d' % (n_, a_['frames'], a_['fw'], a_['fh']) for n_, a_ in anims.items()), k1, k2))
    return sheet


if __name__ == '__main__':
    cut('check' in sys.argv)

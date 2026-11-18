"""DEEP16 pipeline 2 (generated art): the cockatrice, the SRD's Small monstrosity -> deep16/art/cockatrice_p1, all eight facings.

    python tools/cockatrice-sheet.py            (writes deep16/art/cockatrice_p1.png/.json: the 11-18 redraw, redraw() below)
    python tools/cockatrice-sheet.py 1115       (the 11-15 cut, main(), from the first pages)

THE REDRAW (11-18, the cutter seat cutter-1118, on the lanes desk's brief and Griz's "all 3"): the art desk's ART-WANTED-67 COCKATRICE ILLUSTRATED REDRAW,
35 image-generated pages on the navy with no native cut, its FRAME-MAP.json made against our installed sheet (its rows, cells and anchors). redraw() follows
its CUTTER-NOTES.md frame by frame (key, main piece, Lanczos, alpha 128, the nearest of the 64 weighted 3:4:2, its trim and place): every outline the same as
its own 1x previews, 44 pixels in 31 frames a shade off (rounding). Its colours kept, not the house's people's rule: the comb and wattle are drawn red, the
chest rust-orange. One change: the mat's navy enclosed between the legs, in the curled tail and under a wing stays open (OPEN_HOLE), not filled to a blob.

The art desk's COCKATRICE-DEEP16-SOURCES (11-15, a new creature: no art-wanted section), claimed out of Fresh to deep16/_src/cockatrice/ (the zip beside its
2026-11-15-COCKATRICE-SOURCES/) by the cutter-fresh-1115 seat on the lanes desk's queue: a page a view and row -- HEAD 1 SE (its PAGE 01 the identity, not cut), 2 the
rear NE, 3 S, 4 E, 5 N -- Idle 6, Walk 8, Fly 6, Bite 6, Flinch 4, Fall 6, Prone 2; 190 drawings. Each drawing's window is FRAME-MAP.json's box padded PAD a side,
cut by tools/doran-sheet.py's figure and snap. Size: TALL, the art desk's own standing target. Each view's Idle to it; Bite, Flinch and Fall by their first (standing)
frames; Walk by its median height; Fly at the Bite page's fit; Prone 1 by its width to Fall 6's. Standing frames on their feet (the middle of the lowest 12%); lying
ones (Fall 4-6, Prone 1) by the body's middle; Fly keeps each frame's lift over its band's lowest (the art desk: "Fly's origin stays on the ground"; the grid lifts a
flier itself). Each row its own cell. SW W NW mirrored.

Rows: idle 6; walk 8; fly 6 (aloft); attack 6 (the Bite -- its petrifying save the engine's, js/battle.js atk.petrify; `release` 2: frame 3 the contact); flinch 4;
hurt 6 (Fall); prone 2 (Fall 6, Prone 1); getup 1 (Prone 2).
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doransheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)
FOLDER = os.path.join(DS.pix.SRC, 'cockatrice', '2026-11-15-COCKATRICE-SOURCES')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'cockatrice', os.path.basename(FOLDER))
NAME, TALL, PAD, FEET = 'cockatrice_p1', 26, 8, 0.12
AVOID = []
VIEWS = ['SE', 'NE', 'S', 'E', 'N']
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}
LYING = {('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)}
ROWS = [('idle', 6, [('idle', i) for i in range(6)]), ('walk', 10, [('walk', i) for i in range(8)]), ('fly', 10, [('fly', i) for i in range(6)]),
        ('attack', 10, [('attack', i) for i in range(6)]), ('flinch', 12, [('flinch', i) for i in range(4)]), ('hurt', 8, [('hurt', i) for i in range(6)]),
        ('prone', 8, [('hurt', 5), ('prone', 0)]), ('getup', 6, [('prone', 1)])]
RELEASE = {'attack': 2}
SOURCE = ('drawn by the art desk (COCKATRICE-DEEP16-SOURCES, 11-15), cut by tools/cockatrice-sheet.py; SW W NW mirrored -- the SRD 5.1 Cockatrice: '
          'deep16/data/foes.js cockatrice')
FM = json.load(open(os.path.join(FOLDER, 'FRAME-MAP.json'), encoding='utf-8')) if os.path.isdir(FOLDER) else {'pages': []}
ROWOF = {'Idle': 'idle', 'Walk': 'walk', 'Fly': 'fly', 'Bite': 'attack', 'Flinch': 'flinch', 'Fall': 'hurt', 'Prone': 'prone'}
PAGES = {(ROWOF[p['action']], p['facing']): p for p in FM['pages'] if p.get('action') in ROWOF}
_PG, _D = {}, {}


def drawing(act, v, i):
    if (act, v, i) in _D:
        return _D[(act, v, i)]
    p = PAGES[(act, v)]; fn = os.path.join(FOLDER, *p['file'].split('/'))
    if fn not in _PG:
        _PG[fn] = np.asarray(Image.open(fn).convert('RGB')).astype(np.float32)
    pg = _PG[fn]; fr = sorted(p['frames'], key=lambda f: f['frame'])[i]
    x0, y0, x1, y1 = fr['source_box_ltrb_px']
    X0, Y0, X1, Y1 = max(0, x0 - PAD), max(0, y0 - PAD), min(pg.shape[1], x1 + PAD), min(pg.shape[0], y1 + PAD)
    a = pg[Y0:Y1, X0:X1]; m = DS.figure(a, below=True); ys, xs = np.where(m)
    sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    band = [b for b in p['printed_bands_top_to_bottom'] if fr['frame'] in b['numbers']][0]
    floor = max(f['source_box_ltrb_px'][3] for f in p['frames'] if f['frame'] in band['numbers'])
    _D[(act, v, i)] = (a[sl], m[sl], floor - (Y0 + sl[0].stop))
    return _D[(act, v, i)]


def main():
    med = lambda xs: float(np.median(xs))
    h = lambda act, v, i: drawing(act, v, i)[1].shape[0]
    base, F = {}, {}
    for v in VIEWS:
        ih = med([h('idle', v, i) for i in range(6)]); base[v] = TALL / ih
        F[('idle', v)] = 1.0; F[('walk', v)] = ih / med([h('walk', v, i) for i in range(8)])
        for act in ('attack', 'flinch', 'hurt'):
            F[(act, v)] = ih / h(act, v, 0)
        F[('fly', v)] = F[('attack', v)]
        F[('prone', v)] = F[('hurt', v)] * drawing('hurt', v, 5)[1].shape[1] / float(drawing('prone', v, 0)[1].shape[1])
    cells = {}
    for name, fps, keys in ROWS:
        for (act, i) in keys:
            for v in VIEWS:
                if (FACE[v], act, i) in cells:
                    continue
                rgb, m, above = drawing(act, v, i); k = base[v] * F[(act, v)]
                o = DS.to1x(rgb, m, k, AVOID); al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
                if (act, i) in LYING:
                    cx = ndimage.center_of_mass(al)[1]
                else:
                    ft = al.copy(); ft[:ys[-1] - max(2, int(round((ys[-1] - ys[0]) * FEET)))] = False; cx = ndimage.center_of_mass(ft)[1]
                cells[(FACE[v], act, i)] = (o, cx, ys[-1] + (int(round(above * k)) if act == 'fly' else 0))
    for mf, sf in MIRROR.items():
        for (f, act, i) in [c for c in list(cells) if c[0] == sf]:
            o, cx, foot = cells[(f, act, i)]; cells[(mf, act, i)] = (np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - cx, foot)
    anims, blocks, y = {}, [], 0
    for name, fps, keys in ROWS:
        got = [cells[(f,) + tuple(k_)] for f in range(8) for k_ in keys]
        reach = max(max(cx, o.shape[1] - cx) for (o, cx, foot) in got)
        up = max(foot for (o, cx, foot) in got) + 2; dn = max(o.shape[0] - 1 - foot for (o, cx, foot) in got) + 2
        fw, fh, ax, ay = int(2 * np.ceil(reach + 2)), int(up + dn + 1), int(np.ceil(reach + 2)), int(up)
        blk = np.zeros((8 * fh, len(keys) * fw, 4), np.uint8)
        for f in range(8):
            for j, k_ in enumerate(keys):
                o, cx, foot = cells[(f,) + tuple(k_)]; dx, dy = int(round(ax - cx)), ay - foot; hh, ww = o.shape[:2]
                assert dy >= 0 and dy + hh <= fh and dx >= 0 and dx + ww <= fw, (name, f, k_)
                dst = blk[f * fh + dy:f * fh + dy + hh, j * fw + dx:j * fw + dx + ww]; put = o[..., 3] > 0; dst[put] = o[put]
        a = dict(y=y, fw=fw, fh=fh, ax=ax, ay=ay, frames=len(keys), fps=fps)
        if name in RELEASE:
            a['release'] = RELEASE[name]
        anims[name] = a; blocks.append(blk); y += 8 * fh
    W = max(b.shape[1] for b in blocks); sheet = np.zeros((y, W, 4), np.uint8); yy = 0
    for b in blocks:
        sheet[yy:yy + b.shape[0], :b.shape[1]] = b; yy += b.shape[0]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', NAME + '.png'), optimize=True)
    i0 = anims['idle']
    json.dump(dict(image='art/%s.png' % NAME, fw=i0['fw'], fh=i0['fh'], ax=i0['ax'], ay=i0['ay'], top=TALL, anims=anims, name='Cockatrice', source=SOURCE),
              open(os.path.join(ROOT, 'deep16', 'art', NAME + '.json'), 'w', encoding='utf-8', newline='\n'), indent=1)
    print('%s: %dx%d, rows %s; fits %s' % (NAME, W, y, ', '.join('%s %d' % (n_, a_['frames']) for n_, a_ in anims.items()),
                                           ', '.join('%s %s %.2f' % (a_, v, F[(a_, v)]) for (a_, v) in sorted(F) if a_ != 'idle')))


REDRAW = os.path.join(DS.pix.SRC, 'cockatrice', '2026-11-18-ART-WANTED-67-COCKATRICE-REDRAW')
if not os.path.isdir(REDRAW) and '.claude' in ROOT.split(os.sep):
    REDRAW = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'cockatrice', os.path.basename(REDRAW))
SOURCE_REDRAW = ('drawn by the art desk (ART-WANTED-67 COCKATRICE ILLUSTRATED REDRAW, 11-18: image-generated, 35 pages), cut by tools/cockatrice-sheet.py redraw() '
                 'by its own recipe on the installed cells; SW W NW mirrored -- the SRD 5.1 Cockatrice: deep16/data/foes.js cockatrice')
ORDER8 = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
OPEN_HOLE = 2.0    # (game pixels: a hole of the mat's navy this big or more is the ground showing through, left open)
MIR8 = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}


def redraw_frame(pg, f, pal, w342):
    """one pose by the art desk's CUTTER-NOTES.md: the navy keyed out (kept where red minus blue > -5 or blue < 23) in the frame's keying window, its main
    8-connected piece with its holes filled; the crop resized to `reduced_size` by Lanczos, alpha at 128, each colour the nearest of the 64 by squared
    distance weighted 3:4:2; trimmed by `reduced_alpha_crop_ltrb` and pasted at `placement_xy` in the installed cell"""
    kx0, ky0, kx1, ky1 = f['keying_window_ltrb']
    win = pg[ky0:ky1, kx0:kx1].astype(np.int32)
    fg = ((win[..., 0] - win[..., 2]) > -5) | (win[..., 2] < 23)
    lab, n = ndimage.label(fg, structure=np.ones((3, 3)))
    if not n:
        raise SystemExit('no figure in the window')
    main_ = lab == 1 + int(np.argmax(ndimage.sum(fg, lab, range(1, n + 1))))
    keep = ndimage.binary_fill_holes(main_)
    # the one change to the recipe (the seat's call, 11-18): an enclosed hole that is the mat itself -- the navy between the legs under the belly, inside a
    # curled tail or a wing -- stays open when it would be OPEN_HOLE game pixels or more; filled, it came out a dark blue blob at game size (its own 1x has
    # it). The small holes, the dark feathers the key lets through, are filled as the notes say.
    x0, y0, x1, y1 = f['source_crop_ltrb']
    sc = f['reduced_size'][0] / float(x1 - x0)
    hl, hn = ndimage.label(keep & ~main_)
    for k in range(1, hn + 1):
        hk = hl == k; c = win[hk]
        if hk.sum() * sc * sc >= OPEN_HOLE and np.median(c[:, 0] - c[:, 2]) <= -12:
            keep &= ~hk
    m = np.zeros(pg.shape[:2], bool); m[ky0:ky1, kx0:kx1] = keep
    rgba = np.dstack([pg[y0:y1, x0:x1].astype(np.uint8), (m[y0:y1, x0:x1] * 255).astype(np.uint8)])
    r = np.asarray(Image.fromarray(rgba, 'RGBA').resize(tuple(f['reduced_size']), Image.LANCZOS)).astype(np.int32)
    solid = r[..., 3] >= 128
    d = ((r[..., None, :3] - pal[None, None]) ** 2 * w342).sum(-1)
    out = np.zeros(r.shape[:2] + (4,), np.uint8)
    out[solid, :3] = pal[np.argmin(d, -1)][solid]; out[solid, 3] = 255
    cl, ct, cr, cb = f['reduced_alpha_crop_ltrb']; out = out[ct:cb, cl:cr]
    cw, ch = f['cell']; px, py = f['placement_xy']
    cell = np.zeros((ch, cw, 4), np.uint8)
    if px < 0 or py < 0 or px + out.shape[1] > cw or py + out.shape[0] > ch:
        raise SystemExit('%s %d: placed outside its cell' % (f['runtime_row'], f['runtime_frame_1_based']))
    cell[py:py + out.shape[0], px:px + out.shape[1]] = out
    return cell


def redraw():
    """the 11-18 redraw: every frame where the art desk's FRAME-MAP.json puts it, on the rows and cells installed (its `installed_anims`, ours at the time);
    `prone` frame 1 is Fall 6 pixel for pixel, moved by the anchors' difference; SW, W and NW the mirrors about the anchor (flip, a pixel back)"""
    fm = json.load(open(os.path.join(REDRAW, 'FRAME-MAP.json'), encoding='utf-8'))
    inst = fm['installed_anims']
    pal = np.array(sorted({tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for r in json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps'].values() for c in r}), np.int32)
    w342 = np.array([3, 4, 2], np.int32)
    got = {}
    for key, p in fm['pages'].items():
        pg = np.asarray(Image.open(os.path.join(REDRAW, *p['source'].split('/'))).convert('RGB'))
        for f in p['frames']:
            a = inst[f['runtime_row']]
            if list(f['cell']) != [a['fw'], a['fh']] or list(f['anchor']) != [a['ax'], a['ay']]:
                raise SystemExit('%s %s: its cell is not the installed row\'s' % (key, f['frame']))
            got[(p['facing'], f['runtime_row'], f['runtime_frame_1_based'] - 1)] = redraw_frame(pg, f, pal, w342)
    hu, pr = inst['hurt'], inst['prone']
    for v in ('S', 'SE', 'E', 'NE', 'N'):
        last = got[(v, 'hurt', hu['frames'] - 1)]; cell = np.zeros((pr['fh'], pr['fw'], 4), np.uint8)
        dx, dy = pr['ax'] - hu['ax'], pr['ay'] - hu['ay']
        ys, xs = np.where(last[..., 3] > 0)
        if (xs + dx).min() < 0 or (ys + dy).min() < 0 or (xs + dx).max() >= pr['fw'] or (ys + dy).max() >= pr['fh']:
            raise SystemExit('%s: Fall 6 does not fit the prone cell' % v)
        cell[ys + dy, xs + dx] = last[ys, xs]
        got[(v, 'prone', 0)] = cell
    anims, blocks, y = {}, [], 0
    for name in sorted(inst, key=lambda k: inst[k]['y']):
        a = inst[name]
        blk = np.zeros((8 * a['fh'], a['frames'] * a['fw'], 4), np.uint8)
        for fi, fa in enumerate(ORDER8):
            for i in range(a['frames']):
                fr = got[(MIR8.get(fa, fa), name, i)]
                if fa in MIR8:
                    if fr[:, 0, 3].any():
                        raise SystemExit('%s %s %d: drawn on column 0, lost by the mirror' % (fa, name, i + 1))
                    fr = np.roll(fr[:, ::-1], 1, axis=1)
                blk[fi * a['fh']:(fi + 1) * a['fh'], i * a['fw']:(i + 1) * a['fw']] = fr
        if a['y'] != y:
            raise SystemExit('%s: at y %d, installed at %d' % (name, y, a['y']))
        anims[name] = dict(a); blocks.append(blk); y += 8 * a['fh']
    W = max(b.shape[1] for b in blocks); sheet = np.zeros((y, W, 4), np.uint8); yy = 0
    for b in blocks:
        sheet[yy:yy + b.shape[0], :b.shape[1]] = b; yy += b.shape[0]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', NAME + '.png'), optimize=True)
    i0 = anims['idle']
    json.dump(dict(image='art/%s.png' % NAME, fw=i0['fw'], fh=i0['fh'], ax=i0['ax'], ay=i0['ay'], top=TALL, anims=anims, name='Cockatrice', source=SOURCE_REDRAW),
              open(os.path.join(ROOT, 'deep16', 'art', NAME + '.json'), 'w', encoding='utf-8', newline='\n'), indent=1)
    print('%s: %dx%d, rows %s (the redraw, %d drawn frames)' % (NAME, W, y, ', '.join('%s %d' % (n_, a_['frames']) for n_, a_ in anims.items()), len(got)))


if __name__ == '__main__':
    main() if sys.argv[1:] == ['1115'] else redraw()

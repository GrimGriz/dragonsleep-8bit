"""DEEP16 pipeline 2 (generated art): Soldiering for Dunmore's stable -- the Line Guard pikeman's whole fight sheet guardpike_p2, and three rows added to the
Line Guard's own guard_p2: `push`, `pikeattack`, `pikerank`.

    python tools/guard-soldiering-sheet.py           (writes deep16/art/guardpike_p2 and adds the three rows to deep16/art/guard_p2)
    python tools/guard-soldiering-sheet.py check     (also deep16/art-src/guard/guardpike_p2-review.png and dev/visions/guard/<row>.png)
    python tools/guard-soldiering-sheet.py frames    (each frame's drawing box, its boots and its crown)

Asked in art-wanted section 94 (11-21, the pose seat pose-1121, on his "include a line guard looking pike variant in the ask"): PAGE 1 a `push` row for guard_p2,
PAGE 2 a Line Guard pikeman's whole fight sheet. Drawn by the art desk as ART-158 (LINE-GUARD-SOLDIERING handoff, sorted to
deep16/_src/guard/2026-11-24-ART-158-SOLDIERING/, the zip beside it), with two more rows for guard_p2 on his word after its checkpoint: a pike attack and a pike
rank carrying only the pike. Cut 11-24 by the cutter seat cutter-1124 on the lanes desk's message carrying his "Outbox sent and stuff in Fresh".

GUARDPIKE_P2, the clean-shaven pikeman (worn by no foe yet -- no block names a Line Guard pikeman): idle 4, walk 8, attack 8 (the thrust, a step on 3, home on
4), pikerank 6 (planted, home on 4), flinch 4, hurt 6, prone 1 (the Fall 6 crop, its anchor shared). Read and cut by tools/dominion-sheet.py's reader over
tools/vivian-sheet.py: the map's review crops as cells (the SE Attack, a four-by-two page with none, in reading order), each frame on its boots (the S pike runs
past them), his idle to TALL beside guard_p2, every page to its view's idle by crown to boots. His crown is the first run CROWN wide of any colour: his kettle
hat is steel, which the dragger's crown test passes over.

GUARD_P2's new rows, on his own 96 cell and foot line (the earlier rows untouched, as tools/guard-spear-sheet.py adds its own): push 6 (the shield and spear,
the shove on 4 -- deep16/js/features.js THE PUSH plays a sheet's `push`), pikeattack 8 (the pike alone, home on 4) and pikerank 6 (planted, home on 4) -- the
art desk's name `pikeattack`, beside his spear's `attack`; js/battle.js plays a blow's row by its weapon's name, so a Pike blow from him would want a row named
`pike` (not wired: his block carries a spear). Each page scaled so frame 1 stands his own idle's height in that view, each frame on its boots and its torso;
the pike rows wider than his cell, each its own frame width.
"""
import csv, importlib.util, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('dominion_sheet', os.path.join(ROOT, 'tools', 'dominion-sheet.py'))
DM = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DM)
DG, VS = DM.DG, DM.VS
BGTOL = 20                                     # (his leather and cloth stand well off the navy: the dragger's matte)
DG.BGTOL = BGTOL
SRC, BATCH = 'guard', '2026-11-24-ART-158-SOLDIERING'
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}
N = {'idle': 4, 'walk': 8, 'attack': 8, 'pikerank': 6, 'flinch': 4, 'hurt': 6, 'prone': 1, 'push': 6, 'pikeattack': 8}
TALL = 52        # (crown row to boots, the dragger's: at 50 he stood 2-3 px under guard_p2's spear rows, which the art desk registered at the guard's 53)
AVOID = ['red', 'fire', 'violet']              # (guard-spear-sheet's: his rows' snap)


def crown(m):
    """the first row with a run CROWN wide, whatever its colour"""
    for r in range(m.shape[0]):
        d = np.diff(np.concatenate([[0], m[r].astype(np.int8), [0]]))
        if ((np.where(d == -1)[0] - np.where(d == 1)[0]) >= DG.CROWN).any():
            return r
    return 0


def read():
    """{(target, view, row): [(fn, page, mask, box, ground, crown-to-boots), ...]} in frame order -- Prone the Fall 6 crop"""
    d0 = os.path.join(VS.pix.SRC, SRC, BATCH)
    rows = list(csv.DictReader(open(os.path.join(d0, 'FRAME-MAP.csv'), encoding='utf-8-sig')))
    bypage, out = {}, {}
    for r in rows:
        bypage.setdefault(r['source'], []).append(r)
    for fn, rs in bypage.items():
        live = sorted([r for r in rs if r['action'] != 'prone'], key=lambda r: int(r['runtime_index']))
        path = os.path.join(d0, 'originals', fn)
        if all(r['source_rect'] for r in live):
            boxes = [tuple(int(v) for v in r['source_rect'].split()) for r in live]
            a, got = DM.cells(path, boxes)
        else:
            a, got = DM.in_order(path, len(live))
        for j, r in enumerate(live):
            d, bx = got[j]; x0, y0, x1, y1 = bx
            g = y0 + DG.ground(a[y0:y1, x0:x1], d[y0:y1, x0:x1]) + 1
            out.setdefault((r['target'], r['facing'], r['action']), []).append(('originals/' + fn, a, d, bx, g, g - y0 - crown(d[y0:y1, x0:x1])))
        for r in rs:
            if r['action'] == 'prone':                                 # (a pixel-exact crop of Fall 6, sharing its anchor)
                assert r['source_rect'] == [x for x in live if int(x['runtime_index']) == 5][0]['source_rect'], r
                out[(r['target'], r['facing'], 'prone')] = [out[(r['target'], r['facing'], 'hurt')][5]]
    for (t, v, rw), fs in out.items():
        assert len(fs) == N[rw], (t, v, rw, len(fs))
    return out


# ---------------------------------------------------------------- guardpike_p2, a whole sheet
def pike_look(R):
    win, heads = [], {}
    for (t, v, rw), fs in R.items():
        if t != 'guardpike_p2':
            continue
        for i, (fn, a, d, bx, g, h) in enumerate(fs):
            x0, y0, x1, y1 = bx
            w = (max(0, x0 - DG.PAD), max(0, y0 - DG.PAD), min(a.shape[1], x1 + DG.PAD), min(a.shape[0], y1 + DG.PAD))
            win.append((BATCH, v, rw, i, fn, w, bx, g))
            heads[(v, rw, i)] = ((BATCH, fn), h, 0)
    VS.LOOKS['guardpike_p2'] = dict(src=SRC, windows=win, name='Line Guard Pikeman', trim=False, tall=TALL, tallground=True, crownw=DG.CROWN, avoid=AVOID,
        pagescale=DM.scales(heads, N, two=()), bgtol=BGTOL, match={r: ('idle', 0) for r in N if r not in ('idle', 'prone')},
        ground={('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)},
        rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('pikerank', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
        release={'attack': 3, 'pikerank': 3},
        hold=['pikerank: plays wherever his pike strikes through a set wall or over the rank in front (js/battle.js attack, F.pikeThrough), as trooperpike_p2\'s',
              'attack: steps on 3 and lands on 4; S and N foreshortened -- check frame 4 in playback (the art desk\'s own note)',
              'pikerank: both planted boots to be checked at final registration (the art desk\'s own note)',
              'hurt: N falls away from the viewer, the soles nearest the camera (the art desk\'s own note)',
              'prone: the Fall 6 crop held'],
        source='drawn by the art desk (ART-158, 11-24: art-wanted section 94, the Line Guard pikeman, clean-shaven, in five views, the thrust and the Pike Rank '
               'over the mannequin\'s human guides), cut by tools/guard-soldiering-sheet.py over tools/dominion-sheet.py\'s reader and tools/vivian-sheet.py; SW W NW mirrored')
    return heads


# ---------------------------------------------------------------- guard_p2's three rows
ADD = [('push', 10, 3), ('pikeattack', 12, 3), ('pikerank', 10, 3)]   # (row, fps, release)
HELD = {'pikeattack'}   # (a row cut and not played yet -- js/show.js SH.wanted passes it by: his block carries a spear; `push` and `pikerank` the show knows)


def idle_height(base, meta, f):
    """guard_p2's own idle 1 in facing f: its foot line less its crown (the first row with a run 5 wide -- his spear's head is 1 to 3)"""
    a = meta['anims']['idle']; fh = a.get('fh', meta['fh']); fw = a.get('fw', meta['fw'])
    al = base[a['y'] + f * fh:a['y'] + (f + 1) * fh, :fw, 3] > 0
    for r in range(al.shape[0]):
        d = np.diff(np.concatenate([[0], al[r].astype(np.int8), [0]]))
        if ((np.where(d == -1)[0] - np.where(d == 1)[0]) >= 5).any():
            return a.get('ay', meta['ay']) - r + 1
    raise ValueError(f)


def cut1x(a, d, bx, g, k):
    """one drawing at k game px a source px: (1x RGBA, its torso's x, its boots' row)"""
    x0, y0, x1, y1 = bx
    w = (max(0, x0 - DG.PAD), max(0, y0 - DG.PAD), min(a.shape[1], x1 + DG.PAD), min(a.shape[0], y1 + DG.PAD))
    win = a[w[1]:w[3], w[0]:w[2]]
    m = VS.figure(win, False, (x0 - w[0], y0 - w[1], x1 - w[0], y1 - w[1]), BGTOL)
    ys, xs = np.where(m); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    o = VS.to1x(win[sl], m[sl], k, AVOID)
    al = o[..., 3] > 0; rr = np.where(al.any(1))[0]
    top = al.copy(); top[rr[0] + int((rr[-1] - rr[0]) * 0.55):] = False
    from scipy import ndimage
    cx = ndimage.center_of_mass(top)[1]
    return o, cx, int(round((g - w[1] - sl[0].start) * k)) + 1


def add_rows(R, check=False):
    ART = os.path.join(ROOT, 'deep16', 'art')
    base = np.asarray(Image.open(os.path.join(ART, 'guard_p2.png')).convert('RGBA')).copy()
    meta = json.load(open(os.path.join(ART, 'guard_p2.json')))
    for row, _, _ in ADD:                                              # (a re-run: the rows dropped first)
        meta['anims'].pop(row, None)
    y0 = max(a['y'] + 8 * a.get('fh', meta['fh']) for a in meta['anims'].values())
    base = base[:y0]
    FH, AY = meta['fh'], meta['ay']
    blocks, notes = [], []
    for row, fps, rel in ADD:
        cells = {}
        for v, f in FACE.items():
            fs = R[('guard_p2', v, row)]
            k = (idle_height(base, meta, f) - 1) / float(fs[0][5])     # (frame 1 stands his idle's height in this view: crown row to boots)
            cells[f] = [cut1x(a, d, bx, g, k) for fn, a, d, bx, g, h in fs]
            notes.append('%s %s %.4f' % (row, v, k))
        for mf, src in MIRROR.items():
            cells[mf] = [(np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - cx, foot) for o, cx, foot in cells[src]]
        reach = max(max(cx, o.shape[1] - cx) for f in cells for o, cx, foot in cells[f])
        fw = max(meta['fw'], int(2 * np.ceil(reach + 2))); ax = fw // 2
        n = len(cells[0]); blk = np.zeros((8 * FH, n * fw, 4), np.uint8); clip = []
        for f in range(8):
            for i, (o, cx, foot) in enumerate(cells[f]):
                dx, dy = int(round(ax - cx)), AY - foot
                sy0, sx0 = max(0, -dy), max(0, -dx)
                hh, ww = min(o.shape[0] - sy0, FH - max(0, dy)), min(o.shape[1] - sx0, fw - max(0, dx))
                if sy0 or hh < o.shape[0] - sy0:
                    clip.append('%d.%d' % (f, i + 1))
                sub = o[sy0:sy0 + hh, sx0:sx0 + ww]
                cell = blk[f * FH + max(0, dy):f * FH + max(0, dy) + hh, i * fw + max(0, dx):i * fw + max(0, dx) + ww]
                on = sub[..., 3] > 0; cell[on] = sub[on]
        meta['anims'][row] = {'y': int(y0), 'fw': fw, 'fh': FH, 'ax': ax, 'ay': AY, 'frames': n, 'fps': fps, 'release': rel}
        if row in HELD:
            meta['anims'][row]['held'] = True
        if clip:
            print('  %s clipped top or bottom at the cell: %s' % (row, ', '.join(clip)))
        blocks.append((row, blk)); y0 += 8 * FH
    W = max([base.shape[1]] + [b.shape[1] for _, b in blocks])
    sheet = np.zeros((y0, W, 4), np.uint8); sheet[:base.shape[0], :base.shape[1]] = base; y = base.shape[0]
    for _, b in blocks:
        sheet[y:y + b.shape[0], :b.shape[1]] = b; y += b.shape[0]
    meta['source'] = meta.get('source', '').split(' -- the soldiering rows')[0] + (
        ' -- the soldiering rows (push, pikeattack, pikerank) drawn by the art desk (ART-158, 11-24: art-wanted 94, the shield wall\'s shove and the pike carried '
        'alone), added by tools/guard-soldiering-sheet.py')
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, 'guard_p2.png'), optimize=True)
    json.dump(meta, open(os.path.join(ART, 'guard_p2.json'), 'w'), indent=1)
    print('  guard_p2: %dx%d, + %s; scales %s' % (sheet.shape[1], sheet.shape[0], ', '.join('%s %d@%dpx' % (r, meta['anims'][r]['frames'], meta['anims'][r]['fw']) for r, _, _ in ADD), '; '.join(notes)))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'guard'); os.makedirs(d, exist_ok=True)
        for row, blk in blocks:
            cv = np.zeros(blk.shape[:2] + (3,), np.uint8); cv[...] = (14, 22, 52)
            for f in range(8):
                cv[f * FH + AY, :] = (90, 70, 50)
            al = blk[..., 3:4] / 255.0; cv = (blk[..., :3] * al + cv * (1 - al)).astype(np.uint8)
            Image.fromarray(cv).resize((cv.shape[1] * 2, cv.shape[0] * 2), Image.NEAREST).save(os.path.join(d, '%s.png' % row))


if __name__ == '__main__':
    R = read()
    if 'frames' in sys.argv:
        for (t, v, rw), fs in sorted(R.items()):
            for i, (fn, a, d, bx, g, h) in enumerate(fs):
                print(t, v, rw, i, 'box', bx, 'boots', g, 'below', bx[3] - g, 'crown-to-boots', h)
        sys.exit(0)
    pike_look(R)
    VS.cut('guardpike_p2')
    add_rows(R, 'check' in sys.argv)

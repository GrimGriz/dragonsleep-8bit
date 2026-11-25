"""DEEP16 pipeline 2 (generated art): the pike wall's KEEP BACK and the SHOVE, two rows added to each of the two pikemen's sheets, dragger_p2 and guardpike_p2.

    python tools/pike-wall-sheet.py           (adds `keepback` 6 and `shove` 6 to deep16/art/dragger_p2 and guardpike_p2)
    python tools/pike-wall-sheet.py check     (also dev/visions/pikewall/<sheet>-<row>.png, each row's eight facings at 2x on the foot line)
    python tools/pike-wall-sheet.py frames    (each frame's box, boots and crown to boots on its page)

RUN IT AFTER tools/dragger-sheet.py and tools/guard-soldiering-sheet.py: they write the two sheets whole and drop these rows; this drops its own rows first
and adds them again (as tools/guard-soldiering-sheet.py adds its rows to guard_p2).

Asked in art-wanted section 102 (11-25, the cutter seat cutter-1124, on his "outbox the Keep Back and any other rows we need for those two"): the Dominion's
dragger and the Line Guard pikeman lacked only `keepback` (js/features.js F.keepBack, the KEEP BACK reaction), and the game plays a sheet's `shove` for any
Shove (js/ai.js). Drawn by the art desk as ART-166 (its PIKE-WALL-CUTTER-HANDOFF, landed in Fresh 11-25, sorted to
deep16/_src/dragger/2026-11-25-ART-166-PIKE-WALL/, the zip beside it); cut 11-25 by the cutter seat cutter-1125b. Its notes: ten pages, a figure's view a
page, Keep Back 6 on top and Shove 6 below; HEAD 1 S, 2 SE, 3 E, 4 rear NE, 5 N, SW W NW the mirrors (RULED 10-14); printed frame 4 is runtime index 3 on
both rows (`release` 3); Keep Back plays from the Pike Rank hold; Shove turns the shaft crosswise, steps on 3 and drives on 4; "Use each figure's own as-cut
idle for scale and foot registration. Preserve both pike ends in the crop."

THE CUT: each page read whole by tools/mender-sheet.py read_page (12 drawings in reading order, the printed numbers dropped, a loose piece -- a pike's far
end -- to its nearest frame); each frame on its boots (tools/dragger-sheet.py ground()), its crown the first run CROWN wide that is not steel
(dragger-sheet head(): a pike's head is steel); each row scaled so its frame 1 stands the sheet's own idle 1 in that view, crown row to boots; each row its
own frame width, wide enough for the longest pike, the torso on the cell's middle; SW W NW mirrored.
"""
import glob, importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_old = sys.argv; sys.argv = sys.argv[:1]
_sp = importlib.util.spec_from_file_location('mender_sheet', os.path.join(ROOT, 'tools', 'mender-sheet.py'))
MS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(MS)
sys.argv = _old
DG, VS = MS.DG, MS.VS
SRC, BATCH = 'dragger', '2026-11-25-ART-166-PIKE-WALL'
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}
ADD = [('keepback', 10, 3), ('shove', 10, 3)]      # (row, fps, release)
TALL = 52        # (crown row to boots: both sheets' TALL, tools/dragger-sheet.py and tools/guard-soldiering-sheet.py)
FIG = {'dragger_p2': dict(page='DRAGGER', avoid=['fire'], bgtol=20, crown=20, steel=True),
           # (tools/dragger-sheet.py's: his crown the first run CROWN wide that is not steel -- a pike's head is steel. 20, not his 30: ART-166 draws him at
           #  ~0.25 game px a page px against ART-159's ~0.1, so his curls' top runs narrower; at 12 the raised pike's wooden shaft in N read as his crown)
       'guardpike_p2': dict(page='LINE-GUARD-PIKEMAN', avoid=['red', 'fire', 'violet'], bgtol=20, crown=30, steel=False)}
           # (tools/guard-soldiering-sheet.py's: his crown the first run CROWN wide of any colour -- his kettle hat is steel, which the steel test passes
           #  over (his SE read at the brim and stood 2 px tall); 30 page px is wider than a pike's head or shaft here)


def read(fig):
    """{(view, row): [(page, mask, box, ground, crown-to-boots), x6]}"""
    F = FIG[fig]; DG.BGTOL = F['bgtol']; DG.CROWN = F['crown']
    out, notes = {}, {}
    for v in FACE:
        fn = glob.glob(os.path.join(VS.pix.SRC, SRC, BATCH, 'sources', 'ART-166_%s_HEAD-*_%s.png' % (F['page'], v)))
        assert len(fn) == 1, (fig, v, fn)
        a, got, nt = MS.read_page(fn[0], 12)
        notes[os.path.basename(fn[0])] = nt
        for i in range(12):
            d, bx = got[i]; x0, y0, x1, y1 = bx
            sa, sm = a[y0:y1, x0:x1], d[y0:y1, x0:x1]
            g = y0 + DG.ground(sa, sm) + 1
            hc = DG.head(sa, sm)[0] if F['steel'] else anycrown(sm, F['crown'])
            out.setdefault((v, ADD[i // 6][0]), []).append((a, d, bx, g, g - y0 - hc))
    return out, notes


def anycrown(m, w):
    """the first row with a run w wide, whatever its colour (tools/guard-soldiering-sheet.py crown())"""
    for r in range(m.shape[0]):
        d = np.diff(np.concatenate([[0], m[r].astype(np.int8), [0]]))
        if ((np.where(d == -1)[0] - np.where(d == 1)[0]) >= w).any():
            return r
    return 0


def idle_height(base, meta, f):
    """the sheet's own idle 1 in facing f: its foot line less its crown (the first row with a run 5 wide -- a pike's head and shaft are narrower)"""
    a = meta['anims']['idle']; fh = a.get('fh', meta['fh']); fw = a.get('fw', meta['fw'])
    al = base[a['y'] + f * fh:a['y'] + (f + 1) * fh, :fw, 3] > 0
    for r in range(al.shape[0]):
        d = np.diff(np.concatenate([[0], al[r].astype(np.int8), [0]]))
        if ((np.where(d == -1)[0] - np.where(d == 1)[0]) >= 5).any():
            return a.get('ay', meta['ay']) - r + 1
    raise ValueError(f)


def cut1x(a, d, bx, g, k, F):
    """one drawing at k game px a source px: (1x RGBA, its torso's x, its boots' row)"""
    x0, y0, x1, y1 = bx
    w = (max(0, x0 - DG.PAD), max(0, y0 - DG.PAD), min(a.shape[1], x1 + DG.PAD), min(a.shape[0], y1 + DG.PAD))
    win = a[w[1]:w[3], w[0]:w[2]]
    m = VS.figure(win, False, (x0 - w[0], y0 - w[1], x1 - w[0], y1 - w[1]), F['bgtol'])
    ys, xs = np.where(m); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    o = VS.to1x(win[sl], m[sl], k, F['avoid'])
    al = o[..., 3] > 0; rr = np.where(al.any(1))[0]
    top = al.copy(); top[rr[0] + int((rr[-1] - rr[0]) * 0.55):] = False      # (the torso: the upper half, where the pike's far end does not pull the middle)
    cx = ndimage.center_of_mass(top)[1]
    return o, cx, int(round((g - w[1] - sl[0].start) * k)) + 1


def add_rows(fig, R, check=False):
    F = FIG[fig]
    ART = os.path.join(ROOT, 'deep16', 'art')
    base = np.asarray(Image.open(os.path.join(ART, fig + '.png')).convert('RGBA')).copy()
    meta = json.load(open(os.path.join(ART, fig + '.json')))
    for row, _, _ in ADD:                                              # (a re-run: the rows dropped first)
        meta['anims'].pop(row, None)
    y0 = max(a['y'] + 8 * a.get('fh', meta['fh']) for a in meta['anims'].values())
    base = base[:y0]
    FH, AY = meta['fh'], meta['ay']
    blocks, notes = [], []
    for row, fps, rel in ADD:
        cells = {}
        for v, f in FACE.items():
            fs = R[(v, row)]
            k = TALL / float(max(R[(v, r)][0][4] for r, _, _ in ADD))   # (one page, one scale: the taller of the two rows' frame 1 -- the pikeman's E Keep Back
                                           #  read its crown 20 page px low, 5 px over his idle at 1x); frame 1 stands his sheet's TALL, crown row to boots -- each sheet cut its idle to it. Not idle_height():
                                           #  in N (the dragger) and NE and N (the pikeman) the idle's pike head stands above him, read at 1x as his crown)
            cells[f] = [cut1x(a, d, bx, g, k, F) for a, d, bx, g, h in fs]
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
        if clip:
            print('  %s %s clipped top or bottom at the cell: %s' % (fig, row, ', '.join(clip)))
        blocks.append((row, blk)); y0 += 8 * FH
    W = max([base.shape[1]] + [b.shape[1] for _, b in blocks])
    sheet = np.zeros((y0, W, 4), np.uint8); sheet[:base.shape[0], :base.shape[1]] = base; y = base.shape[0]
    for _, b in blocks:
        sheet[y:y + b.shape[0], :b.shape[1]] = b; y += b.shape[0]
    meta['source'] = meta.get('source', '').split(' -- the pike wall\'s rows')[0] + (
        ' -- the pike wall\'s rows (keepback, shove) drawn by the art desk (ART-166, 11-25: art-wanted 102, the Keep Back from the Pike Rank hold and the shaft\'s '
        'Shove), added by tools/pike-wall-sheet.py')
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, fig + '.png'), optimize=True)
    json.dump(meta, open(os.path.join(ART, fig + '.json'), 'w'), indent=1)
    print('  %s: %dx%d, + %s; scales %s' % (fig, sheet.shape[1], sheet.shape[0], ', '.join('%s %d@%dpx' % (r, meta['anims'][r]['frames'], meta['anims'][r]['fw']) for r, _, _ in ADD), '; '.join(notes)))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'pikewall'); os.makedirs(d, exist_ok=True)
        for row, blk in blocks:
            cv = np.zeros(blk.shape[:2] + (3,), np.uint8); cv[...] = (14, 22, 52)
            for f in range(8):
                cv[f * FH + AY, :] = (90, 70, 50)
            al = blk[..., 3:4] / 255.0; cv = (blk[..., :3] * al + cv * (1 - al)).astype(np.uint8)
            Image.fromarray(cv).resize((cv.shape[1] * 2, cv.shape[0] * 2), Image.NEAREST).save(os.path.join(d, '%s-%s.png' % (fig, row)))


if __name__ == '__main__':
    for fig in FIG:
        R, NT = read(fig)
        if 'frames' in sys.argv:
            for (v, rw), fs in sorted(R.items()):
                for i, (a, d, bx, g, h) in enumerate(fs):
                    print(fig, v, rw, i, 'box', bx, 'boots', g, 'crown-to-boots', h)
            for fn, nt in sorted(NT.items()):
                print(fn, '|', '; '.join(nt)[:400])
            continue
        add_rows(fig, R, 'check' in sys.argv)

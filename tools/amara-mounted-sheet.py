"""DEEP16 pipeline 2 (generated art): Amara riding a grey -> amaramounted_p1, horse and rider together in all eight facings.

    python tools/amara-mounted-sheet.py    (writes deep16/art/amaramounted_p1.png/.json; deep16/art-src/amara/amaramounted_p1-review.png)

Asked in art-wanted section 35, block 8 (11-04, the lanes desk, for the chase as RULED 11-04: the pair away north on the horses). The art desk's
HALFWAY-INN-AMARA-MOUNTED, sorted to deep16/_src/amara/INN-MOUNTED-1104/: one page a view (SE, NE from behind, S, E, N), Ride 1-4 on the top row,
Ride 5-6 and Halt (printed 7) below. Not wired: nothing plays a mounted pair yet (the inn lane's chase).

How a page is cut: the navy by the edges and the baked ground shadows with it (a dark blue under the hooves -- her coat is a brown-black, never
blue); the printed numbers are the small pieces; a frame is every other piece in its cell of the page's grid (four a row). The scale: horsegrey_p1's length nose to tail in E
sets the E Halt's, and every view's Halt then stands the E Halt's height (the art desk: "register rider and horse to the Halt pose"). Each
frame by its whole body's middle; the gallop keeps its lift -- a frame stands on its page row's ground (its lowest hoof of the row), not its own.
Boxed down, snapped to the 64 (red and fire left out), outlined.
"""
import importlib.util, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)
SRC = os.path.join(pix.SRC, 'amara', 'INN-MOUNTED-1104')
NAME = 'amaramounted_p1'
P = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps']
OUTL = np.array([int(P['outline'][0][i:i + 2], 16) for i in (1, 3, 5)], np.uint8)
AVOID = ['red', 'fire']
PAGES = {0: 'AMARA-MOUNTED-S.png', 7: 'AMARA-MOUNTED-SE.png', 6: 'AMARA-MOUNTED-E.png', 5: 'AMARA-MOUNTED-NE.png', 4: 'AMARA-MOUNTED-N.png'}
MIRROR = {1: 7, 2: 6, 3: 5}


def frames(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32); H, W = a.shape[:2]
    bg = np.median(np.concatenate([a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)]), axis=0)
    near = (np.linalg.norm(a - bg, axis=2) < 30) | ((a[..., 2] > a[..., 0] + 6) & (a.max(axis=2) < 70))   # (the navy, and the shadows' dark blue)
    lab, k = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(near, lab, range(1, k + 1))
    fg = ~(np.isin(lab, list(edge)) | np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 600]))
    fg = ndimage.binary_opening(fg, iterations=1)
    flab, fn = ndimage.label(fg); boxes = ndimage.find_objects(flab)
    # the page's own grid: four cells a row, two rows (Ride 1-4; Ride 5, 6 and the Halt) -- every piece of any size goes to the cell its middle is in,
    # the printed numbers (small, at a cell's top-left) and specks dropped
    cw, ch = W / 4.0, H / 2.0; cellpieces = [[] for _ in range(7)]
    for i, b in enumerate(boxes):
        if not b: continue
        area = (b[0].stop - b[0].start) * (b[1].stop - b[1].start)
        c = int(((b[1].start + b[1].stop) / 2) // cw); r = int(((b[0].start + b[0].stop) / 2) // ch); n = r * 4 + c
        if area < 400 and (b[0].stop - b[0].start) < H * 0.06: continue
        if (b[0].stop - b[0].start) < H * 0.06 and b[0].start - r * ch < ch * 0.15 and b[1].start - c * cw < cw * 0.25: continue   # (the printed number)
        if n < 7: cellpieces[n].append(i + 1)
    out = []
    for n in range(7):
        if not cellpieces[n]: raise SystemExit('%s: cell %d empty' % (os.path.basename(path), n + 1))
        m_all = np.isin(flab, cellpieces[n]); ys, xs = np.where(m_all)
        b = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
        out.append(dict(rgb=a[b].astype(np.uint8), mask=m_all[b], bottom=b[0].stop, top=b[0].start, row=0 if n < 4 else 1))
    for r in (0, 1):
        floor = max(f['bottom'] for f in out if f['row'] == r)
        for f in out:
            if f['row'] == r: f['lift'] = floor - f['bottom']
    return out


def to1x(d, k):
    rgb8, mask = d['rgb'], d['mask']; h, w = mask.shape; nw, nh = max(1, round(w * k)), max(1, round(h * k))
    al = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) / 255
    pm = rgb8.astype(np.float32) * mask[..., None]
    rgb = np.stack([np.asarray(Image.fromarray(np.clip(pm[..., c], 0, 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) for c in range(3)], -1)
    rgb = rgb / np.maximum(al[..., None], 1e-6) / 255
    solid = al >= 0.5
    o = np.zeros((nh + 2, nw + 2, 4), np.uint8); s2 = np.zeros((nh + 2, nw + 2), bool); s2[1:-1, 1:-1] = solid
    o[1:-1, 1:-1][solid, :3] = pix.snap(rgb, AVOID)[solid]; o[s2, 3] = 255
    e = np.zeros_like(s2); e[1:, :] |= s2[:-1, :]; e[:-1, :] |= s2[1:, :]; e[:, 1:] |= s2[:, :-1]; e[:, :-1] |= s2[:, 1:]
    o[e & ~s2, :3] = OUTL; o[e & ~s2, 3] = 255
    return o


def main():
    hg = json.load(open(os.path.join(ROOT, 'deep16', 'art', 'horsegrey_p1.json'), encoding='utf-8'))
    him = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', 'horsegrey_p1.png')).convert('RGBA'))
    ia = hg['anims']['idle']; cell = him[ia['y'] + 6 * ia['fh']:ia['y'] + 7 * ia['fh'], :ia['fw']]   # (its idle E, frame 1)
    xs = np.where((cell[..., 3] > 0).any(0))[0]; horse_len = xs[-1] - xs[0]
    pages = {f: frames(os.path.join(SRC, fn)) for f, fn in PAGES.items()}
    halt_E = pages[6][6]; kE = horse_len / float(halt_E['mask'].shape[1]); halt_h = halt_E['mask'].shape[0] * kE
    cells = {}
    for f, fr in pages.items():
        k = kE if f == 6 else halt_h / float(fr[6]['mask'].shape[0])
        cells[f] = [(to1x(d, k), round(d['lift'] * k)) for d in fr]
    for m, s in MIRROR.items():
        cells[m] = [(np.ascontiguousarray(o[:, ::-1]), l) for o, l in cells[s]]
    allo = [o for f in cells for o, _ in cells[f]]
    FW = int(2 * np.ceil(max(o.shape[1] for o in allo) / 2 + 2)); lift = max(l for f in cells for _, l in cells[f])
    FH = int(max(o.shape[0] for o in allo) + lift + 6); AX, AY = FW // 2, FH - 4
    rows = [('idle', [6], 2), ('walk', [0, 1, 2, 3, 4, 5], 12)]
    sheet = np.zeros((8 * FH * len(rows), FW * 6, 4), np.uint8); anims = {}; y = 0
    for name, idx, fps in rows:
        for f in range(8):
            for i, j in enumerate(idx):
                o, l = cells[f][j]; h, w = o.shape[:2]
                dx = AX - w // 2; dy = AY - (h - 1) - l
                sheet[y + f * FH + dy:y + f * FH + dy + h, i * FW + dx:i * FW + dx + w][o[..., 3] > 0] = o[o[..., 3] > 0]
        anims[name] = dict(y=y, fw=FW, fh=FH, ax=AX, ay=AY, frames=len(idx), fps=fps); y += 8 * FH
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', NAME + '.png'), optimize=True)
    meta = dict(image='art/%s.png' % NAME, fw=FW, fh=FH, ax=AX, ay=AY, top=int(round(halt_h)), anims=anims, name='Amara on the grey',
                source='drawn by the art desk (HALFWAY-INN-AMARA-MOUNTED, 11-04: art-wanted section 35 block 8, horse and rider together), cut by '
                       'tools/amara-mounted-sheet.py at horsegrey_p1\'s length; idle the Halt, walk the six-frame gallop; SW W NW mirrored; not wired yet')
    with open(os.path.join(ROOT, 'deep16', 'art', NAME + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    out = os.path.join(ROOT, 'deep16', 'art-src', 'amara'); os.makedirs(out, exist_ok=True)
    Z = 2; rv = Image.new('RGBA', (FW * 8 * Z, FH * 5 * Z), (40, 50, 70, 255))
    hgc = Image.fromarray(cell, 'RGBA')
    for j, f in enumerate([0, 7, 6, 5, 4]):
        for i in range(7):
            src = sheet[(0 if i == 6 else 8 * FH) + f * FH:(0 if i == 6 else 8 * FH) + (f + 1) * FH, (0 if i == 6 else i) * FW:((0 if i == 6 else i) + 1) * FW]
            rv.alpha_composite(Image.fromarray(np.ascontiguousarray(src), 'RGBA').resize((FW * Z, FH * Z), Image.NEAREST), (i * FW * Z, j * FH * Z))
    rv.alpha_composite(hgc.resize((hgc.width * Z, hgc.height * Z), Image.NEAREST), (7 * FW * Z, 2 * FH * Z + max(0, FH - hgc.height) * Z))   # (horsegrey_p1's idle E beside, for the size)
    rv.save(os.path.join(out, NAME + '-review.png'), optimize=True)
    print('%s: %dx%d, cell %dx%d, horse %d px long, halt %d px tall' % (NAME, sheet.shape[1], sheet.shape[0], FW, FH, horse_len, round(halt_h)))


main()

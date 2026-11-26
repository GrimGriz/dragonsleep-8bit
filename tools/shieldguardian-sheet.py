"""DEEP16 pipeline 2 (generated art): the shield guardian, the SRD's Large construct -> deep16/art/shieldguardian_p1, all eight facings.

    python tools/shieldguardian-sheet.py            (writes deep16/art/shieldguardian_p1.png/.json)
    python tools/shieldguardian-sheet.py check      (also deep16/art-src/shieldguardian/: a review sheet a view, every row at 2x, the anchor marked)

Drawn by the art desk as ART-172 (SHIELD-GUARDIAN-CUTTER-HANDOFF, 11-25: its identity, SE Idle and SE Fist L, Fist R and Shield approved by Griz; the other 51
strips new, "for cutter review"), sorted out of Fresh to deep16/_src/shieldguardian/2026-11-26-ART-172-SHIELD-GUARDIAN/ (the zip beside it); cut 11-26 by the cutter
seat cutter-1126-constructs for the Pocket DM's stores ("there are 3 in Fresh, two for the Pocket DM stores" -- Griz to the lanes desk). Its FRAME-MAP.csv: five
views (S, SE, E, rear NE, N; SW W NW the mirrors of SE E NE, RULED 10-14) of eleven actions, a strip each, read left to right -- Idle 6, Walk 8, Fist L 6, Fist R 6,
Shield 6, Flinch 4, Fall 6, Prone 1, Bound 4, Regenerate 6, Stored Cast 6. The SE Idle is the bottom band of the approved identity page (its portrait and turnaround
above it, not cut); the approved SE Fist L, Fist R and Shield stand in approved/.

THE PAGES ARE ImageGen's: each strip at its own scale, the figure on a flat navy. It holds nothing, so a frame's lowest pixel is its feet and its top its crown:
  * SCALE: each view's Idle (the median of its six) to TALL; every other strip by its frame 1's crown to feet to its view's Idle -- every strip opens standing -- and
    Prone by its width to its view's Fall 6 (both lying).
  * PLACE: a standing frame on its feet, its middle the middle of its upper 55% (tools/vivian-sheet.py's way, so a punch or a brace does not slide the body); a lying
    one (Fall 4 to 6, Prone) by its whole body's middle.
Each frame: the navy keyed by a flood from the strip's edges (enclosed navy over HOLE px keyed too), boxed down, snapped to the 64, outlined.

Rows (the engine's names): idle 6; walk 8; fist 6 and fist2 6 (Fist L and Fist R: js/battle.js plays the attack's name, and its second use in a turn the numbered
row -- the Multiattack's two Fists, each landing on frame 4, `release` 3); shield 6 (its Shield reaction, the brace on 4 -- js/constructs.js); bound 4 (half the
amulet's wearer's damage taken); regenerate 6 (its 10 hit points at its turn's start); storedcast 6 (its Spell Storing, the release on 4); flinch 4; hurt 6 <- Fall;
prone 1.
"""
import csv, json, os, sys
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)

FOLDER = os.path.join(pix.SRC, 'shieldguardian', '2026-11-26-ART-172-SHIELD-GUARDIAN')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):        # (in a worktree: _src is gitignored and lives only in the shared checkout)
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'shieldguardian', os.path.basename(FOLDER))
NAME = 'shieldguardian_p1'
VIEWS = ['SE', 'NE', 'S', 'E', 'N']
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}
ROW = {'idle': 'idle', 'walk': 'walk', 'fist_l': 'fist', 'fist_r': 'fist2', 'shield': 'shield', 'bound': 'bound', 'regenerate': 'regenerate',
       'stored_cast': 'storedcast', 'flinch': 'flinch', 'fall': 'hurt', 'prone': 'prone'}
ORDER = ['idle', 'walk', 'fist', 'fist2', 'shield', 'bound', 'regenerate', 'storedcast', 'flinch', 'hurt', 'prone']
FPS = {'idle': 6, 'walk': 8, 'fist': 10, 'fist2': 10, 'shield': 10, 'bound': 10, 'regenerate': 8, 'storedcast': 10, 'flinch': 12, 'hurt': 8, 'prone': 4}
EXTRA = {'fist': {'release': 3}, 'fist2': {'release': 3}, 'shield': {'release': 3}, 'storedcast': {'release': 3}}   # (the art desk's events: drawing 4, index 3)
LYING = {('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)}
TALL = 70               # (crown to feet: a Large construct among the grid's Large -- the ogre 74, the troll 75, the earth elemental 68; a Medium hero 47 to 54)
TOL, GAP, HOLE = 22, 8, 600
AVOID = []
SOURCE = ('drawn by the art desk (ART-172 SHIELD-GUARDIAN-CUTTER-HANDOFF, 11-25: five views of eleven actions; its identity, SE Idle, SE Fist L, Fist R and Shield approved by '
          'Griz), cut by tools/shieldguardian-sheet.py (11-26, cutter-1126-constructs): each view\'s Idle to 70 px, each strip by its frame 1, standing frames on their feet; '
          'SW W NW mirrored')


def read(path, n, band=None):
    """(page rgb, [(mask, x0, y0)] of its n drawings left to right); `band`: (y0, y1) of the page to read -- the identity page's idle band"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    if band:
        a = a[band[0]:band[1]]
    bd = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    near = np.linalg.norm(a - np.median(bd, 0), axis=2) < TOL
    lab, _ = ndimage.label(near)
    out = np.isin(lab, list(set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}))
    hl, hn = ndimage.label(near & ~out)
    if hn:
        hs = ndimage.sum(near & ~out, hl, range(1, hn + 1)); out |= np.isin(hl, [i + 1 for i, s in enumerate(hs) if s > HOLE])
    fg = ~out
    gl, _ = ndimage.label(ndimage.binary_dilation(fg, np.ones((2 * GAP + 1,) * 2, bool)))
    groups = []
    for i, sl in enumerate(ndimage.find_objects(gl), 1):
        if sl is None:
            continue
        m = fg[sl] & (gl[sl] == i)
        if m.any():
            groups.append([int(m.sum()), sl[1].start, sl[0].start, m])
    groups.sort(key=lambda g: -g[0])
    if len(groups) < n:
        raise SystemExit('%s: %d drawings, %d wanted' % (path, len(groups), n))
    main = groups[:n]
    small = min(g[0] for g in main)
    for g in groups[n:]:                                                 # (a loose piece inside a frame's reach joins it; specks and printed numbers go)
        if g[0] < 0.02 * small:
            continue
        x0, y0, x1, y1 = g[1], g[2], g[1] + g[3].shape[1], g[2] + g[3].shape[0]
        for f in main:
            fx0, fy0, fx1, fy1 = f[1], f[2], f[1] + f[3].shape[1], f[2] + f[3].shape[0]
            if x1 >= fx0 - 12 and x0 <= fx1 + 12 and y1 >= fy0 - 12 and y0 <= fy1 + 12:
                ux0, uy0, ux1, uy1 = min(fx0, x0), min(fy0, y0), max(fx1, x1), max(fy1, y1)
                m = np.zeros((uy1 - uy0, ux1 - ux0), bool)
                m[fy0 - uy0:fy1 - uy0, fx0 - ux0:fx1 - ux0] |= f[3]; m[y0 - uy0:y1 - uy0, x0 - ux0:x1 - ux0] |= g[3]
                f[1], f[2], f[3] = ux0, uy0, m
                break
    main.sort(key=lambda g: g[1])
    return a, [(g[3], g[1], g[2]) for g in main]


def to1x(a, m, x0, y0, k):
    h, w = m.shape
    nw, nh = max(1, int(round(w * k))), max(1, int(round(h * k)))
    rgb = a[y0:y0 + h, x0:x0 + w]
    al = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) / 255
    pm = rgb * m[..., None]
    c = np.stack([np.asarray(Image.fromarray(np.clip(pm[..., i], 0, 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(np.float32) for i in range(3)], -1)
    c = c / np.maximum(al[..., None], 1e-6) / 255
    solid = al >= 0.5
    sn = pix.snap(c, AVOID)
    o = np.zeros((nh + 2, nw + 2, 4), np.uint8)
    s2 = np.zeros((nh + 2, nw + 2), bool); s2[1:-1, 1:-1] = solid
    o[1:-1, 1:-1][solid, :3] = sn[solid]; o[s2, 3] = 255
    e = np.zeros_like(s2); e[1:, :] |= s2[:-1, :]; e[:-1, :] |= s2[1:, :]; e[:, 1:] |= s2[:, :-1]; e[:, :-1] |= s2[:, 1:]
    o[e & ~s2, :3] = pix.OUTLINE; o[e & ~s2, 3] = 255
    return o


def pages():
    """{view: {action: (rgb, frames)}} from the FRAME-MAP"""
    out = {}
    for r in csv.DictReader(open(os.path.join(FOLDER, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
        p = os.path.join(FOLDER, *r['file'].split('/'))
        band = None
        if r['facing'] == 'SE' and r['action'] == 'idle':                # (the identity page: its idle is the bottom band)
            band = (Image.open(p).size[1] // 2, Image.open(p).size[1])
        out.setdefault(r['facing'], {})[r['action']] = read(p, int(r['visible_figures']), band)
    return out


def cut():
    """{row: {view: [(RGBA, x, y) from the anchor]}}, notes"""
    P = pages()
    rows, notes = {r: {} for r in ORDER}, []
    for v in VIEWS:
        pg = P[v]
        ih = float(np.median([m.shape[0] for m, _, _ in pg['idle'][1]]))
        kv = TALL / ih
        k = {'idle': kv}
        for act in pg:
            if act in ('idle', 'prone'):
                continue
            k[act] = kv * ih / float(pg[act][1][0][0].shape[0])
        fall6 = pg['fall'][1][-1][0]; k['prone'] = k['fall'] * fall6.shape[1] / float(pg['prone'][1][0][0].shape[1])
        notes.append('%s: idle %d src px tall, k %s' % (v, ih, ', '.join('%s %.4f' % (q, k[q]) for q in ROW if q in k)))
        for act, (a, fr) in pg.items():
            row = ROW[act]; out = []
            for i, (m, x0, y0) in enumerate(fr):
                o = to1x(a, m, x0, y0, k[act])
                al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
                if (row, i) in LYING:
                    cx = ndimage.center_of_mass(al)[1]
                else:
                    top = al.copy(); top[ys[0] + int((ys[-1] - ys[0]) * 0.55):] = False
                    cx = ndimage.center_of_mass(top)[1]
                out.append((o, -int(round(cx)), -int(ys[-1])))
            rows[row][v] = out
    return rows, notes


def mirror(fr):
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def lay(rows):
    up = max(-y for r in ORDER for v in VIEWS for o, x, y in rows[r][v]) + 2
    dn = max(y + o.shape[0] for r in ORDER for v in VIEWS for o, x, y in rows[r][v]) + 2
    fh, ay = up + dn, up
    cells, geo = {}, {}
    for r in ORDER:
        hw = max(max(-x, x + o.shape[1]) for v in VIEWS for o, x, y in rows[r][v]) + 2
        fw = 2 * hw
        drawn = {}
        for v in VIEWS:
            fs = []
            for o, x, y in rows[r][v]:
                c = np.zeros((fh, fw, 4), np.uint8)
                c[ay + y:ay + y + o.shape[0], hw + x:hw + x + o.shape[1]] = o
                fs.append(c)
            drawn[FACE[v]] = fs
        cells[r] = [drawn[f] if f in drawn else [mirror(c) for c in drawn[MIRROR[f]]] for f in range(8)]
        geo[r] = (int(fw), int(fh), int(hw), int(ay))
    return cells, geo


def write(cells, geo):
    wide = max(len(cells[r][0]) * geo[r][0] for r in ORDER)
    H = sum(8 * geo[r][1] for r in ORDER)
    sheet = np.zeros((H, wide, 4), np.uint8)
    meta, y = {}, 0
    for r in ORDER:
        fw, fh, ax, ay = geo[r]
        meta[r] = {'y': y, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'frames': len(cells[r][0]), 'fps': FPS[r]}
        meta[r].update(EXTRA.get(r, {}))
        for f in range(8):
            for i, c in enumerate(cells[r][f]):
                sheet[y + f * fh:y + (f + 1) * fh, i * fw:(i + 1) * fw] = c
        y += 8 * fh
    fw0, fh0, ax0, ay0 = geo['idle']
    top = pix.top_of(cells['idle'][0] + cells['idle'][7], ay0)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(pix.ART, NAME + '.png'), optimize=True)
    json.dump({'image': 'art/%s.png' % NAME, 'fw': fw0, 'fh': fh0, 'ax': ax0, 'ay': ay0, 'top': top, 'name': 'Shield Guardian', 'source': SOURCE, 'anims': meta},
              open(os.path.join(pix.ART, NAME + '.json'), 'w', encoding='utf-8', newline='\n'), indent=1)
    print('  %s: %dx%d, top %d, %s' % (NAME, sheet.shape[1], sheet.shape[0], top, ', '.join('%s %d@%dpx' % (r, len(cells[r][0]), geo[r][0]) for r in ORDER)))


def review(cells, geo, folder, scale=2, bg=(14, 20, 48)):
    os.makedirs(folder, exist_ok=True)
    for f, nm in [(7, 'SE'), (5, 'NE'), (0, 'S'), (6, 'E'), (4, 'N'), (1, 'SW')]:
        W = max(len(cells[r][f]) * geo[r][0] for r in ORDER); H = sum(geo[r][1] for r in ORDER)
        im = Image.new('RGB', (W, H), bg); y = 0
        for r in ORDER:
            fw, fh, ax, ay = geo[r]
            for i, c in enumerate(cells[r][f]):
                p = Image.fromarray(c, 'RGBA'); im.paste(p, (i * fw, y), p)
                im.putpixel((i * fw + ax, y + ay), (255, 0, 255))
            y += fh
        im.resize((im.width * scale, im.height * scale), Image.NEAREST).save(os.path.join(folder, '%s-review-%s.png' % (NAME, nm)))
    print('  review: ' + folder)


if __name__ == '__main__':
    rows, notes = cut()
    for nt in notes:
        print('  ' + nt)
    cells, geo = lay(rows)
    write(cells, geo)
    if 'check' in sys.argv:
        review(cells, geo, os.path.join(ROOT, 'deep16', 'art-src', 'shieldguardian'))

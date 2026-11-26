"""DEEP16 pipeline 2 (generated art): the rug of smothering, the SRD's Large construct -> deep16/art/rugofsmothering_p1, all eight facings.

    python tools/rugofsmothering-sheet.py            (writes deep16/art/rugofsmothering_p1.png/.json)
    python tools/rugofsmothering-sheet.py check      (also deep16/art-src/rugofsmothering/: a review sheet a view, every row at 2x, and the placements)

Drawn by the art desk as ART-171 (RUG-OF-SMOTHERING-CUTTER-HANDOFF, 11-25; the SE Smother approved by Griz), sorted out of Fresh to
deep16/_src/rugofsmothering/2026-11-26-ART-171-RUG-OF-SMOTHERING/ (the zip beside it); cut 11-26 by the cutter seat cutter-1126-constructs for the Pocket DM's
stores ("there are 3 in Fresh, two for the Pocket DM stores" -- Griz to the lanes desk). Its FRAME-MAP.csv: HEAD 1 SE, 2 rear NE, 3 S, 4 E, 5 N, nine pages each --
Smother 6, Still 1 (a crop of Smother 1), Idle 4, Creep 8, Hold 4, Release 4, Flinch 4, Collapse 6, Down 1 (a crop of Collapse 6); SW W NW the mirrors of SE E NE
(RULED 10-14). The rug is drawn alone, so the one it holds stays its own figure (js/constructs.js draws the wrap over it).

THE PAGES ARE ImageGen's: not native, each page at its own scale, the frames over printed numbers. The 1536-wide approved SE Smother keeps a true grid; the
1774-wide pages draw their frames at a tighter pitch than the page's width over the count (the rear hem drifts 22 to 47 px a column where the rug lies still).
So a frame is placed by its own printed number -- the slot it was drawn over -- and each page as a whole by its reference frame:
  * SCALE: one a view, every view's flat Still the same AREA as the SE Still at WIDE px wide (a flat thing on the floor projects to the same area at any heading --
    the cloaker's K46); each page by its flat frame's area to its view's Still (Idle 1, Creep 1, Flinch 1, Collapse 1, Release 4; Smother's frame 1 IS the Still).
  * PLACE: the flat frame's REAR HEM (the centroid of its rear-most 5% along the view's heading -- "preserve a rear-hem landmark", the art desk's) on the Still's
    rear hem; the page's other frames by their numbers' offsets from the reference's. The Hold page has no flat frame: its Hold 1 is scaled by its height to Smother
    6's and placed by the COLUMN (the wrap's upper half's middle, the drawing's foot) on Smother 6's -- the attack's end is the hold's start.
  * THE ANCHOR: the Still's middle, the middle of its 2x2 (the rug lies flat over its own footprint). Still is Smother 1 and Down is Collapse 6, as the art desk cut
    them (their own pages are those crops, larger).
Each frame: the page's navy keyed by a flood from the page's edges (enclosed navy over HOLE px keyed too), boxed down, snapped to the 64, outlined.

Rows: still 1 (False Appearance: before its first turn, js/ui.js); idle 4; walk 8 <- Creep (in place, the 10 ft crawl); smother 6 (`release` 3: the grip on
printed frame 4); smotherhold 4 (looped while it holds one, js/constructs.js); smotherrelease 4 (once, as it lets go); flinch 4; hurt 6 <- Collapse; prone 1 <- Down.
The sheet's `wrap`: a facing's column foot at the hold, from the anchor (1x px) -- where js/constructs.js sets the wrap over the one held.
"""
import csv, json, os, sys
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)

FOLDER = os.path.join(pix.SRC, 'rugofsmothering', '2026-11-26-ART-171-RUG-OF-SMOTHERING')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):        # (in a worktree: _src is gitignored and lives only in the shared checkout)
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'rugofsmothering', os.path.basename(FOLDER))
NAME = 'rugofsmothering_p1'
VIEWS = ['SE', 'NE', 'S', 'E', 'N']
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}                  # (the sheet's facing rows; SW 1, W 2, NW 3 the mirrors of SE 7, E 6, NE 5)
MIRROR = {1: 7, 2: 6, 3: 5}
ROW = {'still': 'still', 'idle': 'idle', 'creep': 'walk', 'smother': 'smother', 'hold': 'smotherhold', 'release': 'smotherrelease', 'flinch': 'flinch',
       'collapse': 'hurt'}
ORDER = ['still', 'idle', 'walk', 'smother', 'smotherhold', 'smotherrelease', 'flinch', 'hurt', 'prone']
FPS = {'still': 2, 'idle': 5, 'walk': 8, 'smother': 10, 'smotherhold': 5, 'smotherrelease': 10, 'flinch': 12, 'hurt': 8, 'prone': 4}
EXTRA = {'smother': {'release': 3}}                                  # (the art desk's contact: printed frame 4, index 3)
REF = {'smother': 0, 'idle': 0, 'creep': 0, 'flinch': 0, 'collapse': 0, 'release': 3}   # (each page's flat frame)
WIDE = 90               # (the SE Still's width at 1x: the art desk's own 1x preview, 90 x 60 inside the 2x2's 128 x 64)
TOL, GAP, HOLE = 28, 8, 400
COVER = 48              # (a Medium figure's height and one: the heroes stand 47 to 54 px -- the wrap's top at least this far over the held one's foot)
NOM = {'S': (0, 1), 'SE': (1, 1), 'E': (1, 0), 'NE': (1, -1), 'N': (0, -1)}   # (each view's heading on the page: the front hem leads)
AVOID = ['fire', 'accent', 'violet', 'glow', 'blue', 'orc', 'moss', 'silver']   # (the rug's own ramps only -- red, gold, bone, skin, leather, stone: the rear
                                                                                 #  views' border went to the fire ramp's orange and N's motifs to the accent's pink)
SOURCE = ('drawn by the art desk (ART-171 RUG-OF-SMOTHERING-CUTTER-HANDOFF, 11-25: five views, nine pages each -- the SE Smother approved by Griz), cut by '
          'tools/rugofsmothering-sheet.py (11-26, cutter-1126-constructs): each frame by its printed number, each page by its flat frame\'s rear hem; SW W NW mirrored')


def read(path, n):
    """(page rgb, [(mask, x0, y0) of each frame in reading order], [slot (x, y) of each: its printed number's middle and top, or None])"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    bd = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    near = np.linalg.norm(a - np.median(bd, 0), axis=2) < TOL
    lab, _ = ndimage.label(near)
    out = np.isin(lab, list(set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}))
    hl, hn = ndimage.label(near & ~out)
    if hn:
        hs = ndimage.sum(near & ~out, hl, range(1, hn + 1)); out |= np.isin(hl, [i + 1 for i, s in enumerate(hs) if s > HOLE])
    fg = ~out
    # the printed numbers first, glyph by glyph (a number printed close under a drawing would group into it): cream, 22 to 80 tall -- a tassel parted from
    # the hem is smaller, and the hem's tassels hang from its outline
    nums = []
    cl, cn = ndimage.label(fg, structure=np.ones((3, 3)))
    for i, sl in enumerate(ndimage.find_objects(cl), 1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if not (22 <= h <= 80 and w <= 70):
            continue
        pc = cl[sl] == i; px = a[sl][pc]
        if np.percentile(px.min(1), 75) >= 150 and (px.max(1) - px.min(1)).mean() < 60:
            nums.append((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop)); fg[sl] &= ~pc
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
    main, rest = groups[:n], groups[n:]
    box = lambda g: (g[1], g[2], g[1] + g[3].shape[1], g[2] + g[3].shape[0])
    for g in rest:
        x0, y0, x1, y1 = box(g)
        for f in main:                                                   # (a loose piece in a frame's box: a tassel parted from the hem)
            fx0, fy0, fx1, fy1 = box(f)
            if x1 >= fx0 - 10 and x0 <= fx1 + 10 and y1 >= fy0 - 10 and y0 <= fy1 + 10:
                ux0, uy0, ux1, uy1 = min(fx0, x0), min(fy0, y0), max(fx1, x1), max(fy1, y1)
                m = np.zeros((uy1 - uy0, ux1 - ux0), bool)
                m[fy0 - uy0:fy1 - uy0, fx0 - ux0:fx1 - ux0] |= f[3]; m[y0 - uy0:y1 - uy0, x0 - ux0:x1 - ux0] |= g[3]
                f[1], f[2], f[3] = ux0, uy0, m
                break
    # reading order: bands by their middles, then left to right
    mids = sorted(main, key=lambda g: g[2] + g[3].shape[0] / 2.0)
    bands, cur = [], [mids[0]]
    for g in mids[1:]:
        r = cur[-1]
        if (g[2] + g[3].shape[0] / 2.0) - (r[2] + r[3].shape[0] / 2.0) > 0.5 * r[3].shape[0]:
            bands.append(cur); cur = [g]
        else:
            cur.append(g)
    bands.append(cur)
    fr = [g for b in bands for g in sorted(b, key=lambda g: g[1])]
    # each frame's number: the nearest one under it that its middle stands over
    slots = []
    for g in fr:
        x0, y0, x1, y1 = box(g); cx = (x0 + x1) / 2.0
        under = [b for b in nums if y1 - 60 <= b[1] <= y1 + 160 and b[0] - 60 <= cx <= b[2] + 60]   # (a rear view's near corner hangs lower than its number's top)
        b = min(under, key=lambda b: abs(b[1] - y1)) if under else None
        slots.append(((b[0] + b[2]) / 2.0, float(b[1])) if b else None)
    if n > 1 and (None in slots or len(set(slots)) < n):
        print('  (%s: numbers %d of %d -- placed by their boxes)' % (os.path.basename(path), len(set(s for s in slots if s)), n))
        slots = [((box(g)[0] + box(g)[2]) / 2.0, float(box(g)[3])) for g in fr]
    return a, [(g[3], g[1], g[2]) for g in fr], slots


def heading(v):
    v = np.array(NOM[v], float)
    return v / np.linalg.norm(v)


def hem(m, x0, y0, v):
    """the rear hem: the middle of the rear-most 5% of the drawing along the view's heading (source px)"""
    ys, xs = np.where(m); xs = xs + x0; ys = ys + y0
    p = xs * v[0] + ys * v[1]; b = p <= p.min() + 0.05 * (p.max() - p.min())
    return np.array([xs[b].mean(), ys[b].mean()])


def column(m, x0, y0):
    """the wrap's column: the middle of the drawing's upper 45% across, at the drawing's foot (source px)"""
    ys, xs = np.where(m)
    top = ys <= ys.min() + 0.45 * (ys.max() - ys.min())
    return np.array([xs[top].mean() + x0, ys.max() + y0 + 1.0])


def to1x(a, m, x0, y0, k):
    """the drawing boxed down by k, snapped, outlined: (RGBA, the source point its pixel (0, 0) stands for, less the outline's one)"""
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
    """{view: {action: (rgb, frames, slots)}} from the FRAME-MAP"""
    out = {}
    for r in csv.DictReader(open(os.path.join(FOLDER, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
        if r['action'] in ('still', 'down'):
            continue                                                     # (crops of Smother 1 and Collapse 6: those frames are cut instead)
        out.setdefault(r['facing'], {})[r['action']] = read(os.path.join(FOLDER, *r['file'].split('/')), int(r['drawings']))
    return out


def cut():
    """{row: {facing: [(RGBA, x, y) placed from the anchor]}}, {facing: wrap (dx, dy)}, notes"""
    P = pages()
    rows, wrap, notes = {r: {} for r in ORDER}, {}, []
    sm0 = P['SE']['smother'][1][0][0]
    kSE = WIDE / float(sm0.shape[1]); areaT = sm0.sum() * kSE * kSE
    for v in VIEWS:
        pg, hd = P[v], heading(v)
        st_m, st_x, st_y = pg['smother'][1][0]
        ys, xs = np.where(st_m); cen = np.array([xs.mean() + st_x, ys.mean() + st_y])
        kv = (areaT / st_m.sum()) ** 0.5
        hemT = kv * (hem(st_m, st_x, st_y, hd) - cen)
        place = {}                                                     # action -> (k, ref source point, its target, ref slot)
        for act, ref in REF.items():
            a, fr, sl = pg[act]
            m, x0, y0 = fr[ref]
            k = kv if act == 'smother' else kv * (st_m.sum() / float(m.sum())) ** 0.5
            src = cen if act == 'smother' else hem(m, x0, y0, hd)
            tgt = np.zeros(2) if act == 'smother' else hemT
            place[act] = (k, src, tgt, sl[ref])
        # the hold: its Hold 1 by its height and its column onto Smother 6's
        a6, fr6, sl6 = pg['smother']; m6, x6, y6 = fr6[5]
        k6, s6, t6, r6 = place['smother']
        d6 = (np.array(sl6[5]) - np.array(r6)) if r6 is not None and sl6[5] is not None else np.zeros(2)
        col6 = k6 * (column(m6, x6, y6) - d6 - s6) + t6
        ah, frh, slh = pg['hold']; mh, xh, yh = frh[0]
        kh = k6 * m6.shape[0] / float(mh.shape[0])
        place['hold'] = (kh, column(mh, xh, yh), col6, slh[0])
        # the release: drawn bigger at its start than the Hold it leaves (its page scaled by its flat Release 4) -- eased from the Hold's scale and column at
        # Release 1 (its height to Hold 1's, its column on the Hold's) to the flat Release 4 on the Still's rear hem, frame by frame
        ar, frr, slr = pg['release']; mr, xr, yr = frr[0]
        relA = (kh * mh.shape[0] / float(mr.shape[0]), column(mr, xr, yr), col6, slr[0])
        notes.append('%s: k %.4f (Still %dx%d src), %s, release from %.4f' % (v, kv, st_m.shape[1], st_m.shape[0], ', '.join('%s %.4f' % (q, place[q][0]) for q in place), relA[0]))

        def at(pl, sl, i, x0, y0):
            k, src, tgt, rs = pl
            d = (np.array(sl[i]) - np.array(rs)) if rs is not None and sl[i] is not None else np.zeros(2)
            return k, k * (np.array([x0, y0], float) - d - src) + tgt - 1
        for act, pl in place.items():
            a, fr, sl = pg[act]
            out = []
            for i, (m, x0, y0) in enumerate(fr):
                k, tl = at(pl, sl, i, x0, y0)
                if act == 'release':
                    t = i / float(len(fr) - 1); kA, tA = at(relA, sl, i, x0, y0)
                    k, tl = kA + (k - kA) * t, tA + (tl - tA) * t
                out.append((to1x(a, m, x0, y0, k), int(round(tl[0])), int(round(tl[1]))))
            rows[ROW[act]][v] = out
        rows['still'][v] = [rows['smother'][v][0]]
        rows['prone'][v] = [rows['hurt'][v][-1]]
        o, x, y = rows['smotherhold'][v][0]
        ys, xs = np.where(o[..., 3] > 0); top = ys <= ys.min() + 0.45 * (ys.max() - ys.min())
        foot = ys.max()
        if v in ('NE', 'N'):     # (the rear views: the near hem lies on the ground in front of the column and below its foot -- the foot is the first row, going down,
            c0, c1 = xs[top].min(), xs[top].max()                       #  where the drawing spreads past the column's own width: there the flat end begins)
            for r in range(ys[top].max(), ys.max() + 1):
                rx = xs[ys == r]
                if len(rx) and (rx.min() < c0 - 3 or rx.max() > c1 + 3):
                    foot = r; break
            foot = max(foot, ys.min() + COVER)                          # (and no higher than COVER under the wrap's top: the held one's head stays under the cloth)
        wrap[v] = (int(round(xs[top].mean() + x)), int(foot + y))
    return rows, wrap, notes


def mirror(fr):
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def lay(rows):
    """each row its own width, the anchor in its middle; one height and foot for every row -> (cells {row: [8 facings of [frames]]}, geometry)"""
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


def write(cells, geo, wrap):
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
    wr = [None] * 8
    for v, (dx, dy) in wrap.items():
        wr[FACE[v]] = [dx, dy]
    for f, s in MIRROR.items():
        wr[f] = [-wr[s][0], wr[s][1]]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(pix.ART, NAME + '.png'), optimize=True)
    json.dump({'image': 'art/%s.png' % NAME, 'fw': fw0, 'fh': fh0, 'ax': ax0, 'ay': ay0, 'top': top, 'name': 'Rug of Smothering', 'source': SOURCE,
               'wrap': wr, 'anims': meta}, open(os.path.join(pix.ART, NAME + '.json'), 'w', encoding='utf-8', newline='\n'), indent=1)
    print('  %s: %dx%d, top %d, %s' % (NAME, sheet.shape[1], sheet.shape[0], top, ', '.join('%s %d@%dpx' % (r, len(cells[r][0]), geo[r][0]) for r in ORDER)))
    print('  wrap: %s' % wr)


def review(cells, geo, folder, scale=2, bg=(14, 20, 48)):
    """a sheet a facing (the five drawn and SW): every row, its frames left to right, the anchor marked"""
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
    rows, wrap, notes = cut()
    for nt in notes:
        print('  ' + nt)
    cells, geo = lay(rows)
    write(cells, geo, wrap)
    if 'check' in sys.argv:
        review(cells, geo, os.path.join(ROOT, 'deep16', 'art-src', 'rugofsmothering'))

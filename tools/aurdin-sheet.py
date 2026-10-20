"""DEEP16 pipeline 2 (generated art): the art desk's ART-72 -> aurdin_p2, Aurdin in the Ochre Mantle (his mother's homemade school robes).

    python tools/aurdin-sheet.py            # deep16/art/aurdin_p2.png + .json
    python tools/aurdin-sheet.py check      # also dev/visions/aurdin/: each page's cut, every facing of every row, a lineup beside the heroes
    python tools/aurdin-sheet.py measure    # the numbers the scale is taken from, printed (nothing written)

Source (Griz, 2026-10-18: "Try cut 72 in Fresh for Aurdin on the grid on main please"): the art desk's ART-72, sorted out of Fresh into
deep16/_src/aurdin/ART-72/ (its 23 pages, ART-72-manifest.json and ART-72-source-rectangles.json; the zip beside it; the desk's papers, its
native atlases, previews and cutter in _src/art-desk/received-2026-10-18-ART-72/). The grid's twenty pages, five views four pages each:
    page 1  Idle 6, Walk 8, CastForward 6     (H1P1 also the portrait and the turnaround -- Front, Right, Back, Left: the scale's measure)
    page 2  CastOverhead 6, Defend 4, Flinch 4
    page 3  Fall 6, Prone 2, GetUp 6
    page 4  Interact 6, UseItem 4, Victory 6
    H1 SE, H2 NE (from behind), H3 S (the front), H4 E (in profile), H5 N (the back). The three 8-bit pages (battle, map) are the 8-bit game's.
Facings (RULED 10-14, five drawn views): S, SE, E, NE, N as drawn; SW, W, NW their mirrors (the book and the pouch change hips in a mirror: the
desk's declared shortcut, its notes). Rows (ENGINE below): Idle -> idle, Walk -> walk, CastForward -> cast (every spell the engine casts,
js/magic.js M.cast, and a spell attack, js/battle.js), CastOverhead -> castup (a spell aimed at no one creature: on himself, the party, an area --
magic.js), Defend -> defend (his Shield, the reaction: battle.js), Flinch -> flinch, Fall -> hurt (down, held at its last frame), Prone -> prone
(Fall 2-5 then Prone 1, where he lies while prone; js/ui.js plays the row in and holds its last frame), GetUp -> getup (played forward when the
prone ends, ui.js), Interact -> attack (an empty hand reached out and back: what the engine plays for a blow, a touch spell and a hand on a thing --
the rope, the barrel, the bucket; the blow on Interact 3, `release` 2), UseItem -> useitem (a potion, a pie: battle.js useItem), Victory -> victory
(the fight won), and `sit` (GetUp 3, sat up on the ground: the campfire seats every hero on a sheet's `sit` row, js/campfire.js). Prone 2 is
the one drawing not used.
How a page is cut: the frames are where the desk's own cutter found them (ART-72-source-rectangles.json, a box a drawing). A figure mask off the
page's navy (any channel more than 24 off it; the outline closes the figure, so its holes are filled, but a hole the navy's own colour -- between
an arm and the body -- stays empty); every blob touching a box is kept and every other (the row names, the numbers, the portrait and the
turnaround) dropped; each row's blobs split among its boxes' centres by tools/sheetrows.py split_band (bodies' cores to the nearest centre, loose
bits to the nearest frame).
The scale: the turnaround's Front still stands 52 game px from the top of the hair to the boots, 54 with the game's outline ring -- what Aurdin's
LPC sheet stands facing S (tools/sheetrows.py STANDS: aurdin_p0 S 54), so he stands where he stood beside the other three. Each page 1 by its
Idle 1's filled area against the turnaround's view(s) it sits between, sqrt-area (the house's way since the hyena); each page 2-4 by its
standing frame (STAND) against its page 1's Idle 1 -- the desk drew H1P1 smaller (25 drawings on it) and every page at its own size.
The colour: the desk drew every page from H1P1 and its pages agree (measure prints the medians); no toning.
"""
import os, sys, json, subprocess
import importlib.util
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SR = _load('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))

SRC = os.path.join(ROOT, 'deep16', '_src')                 # the pages live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'aurdin')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')
ART72 = os.path.join(SRC, 'aurdin', 'ART-72')
NAME = 'aurdin_p2'

VIEW = {1: 'SE', 2: 'NE', 3: 'S', 4: 'E', 5: 'N'}
TURNVIEW = {'SE': ('Front', 'Right'), 'NE': ('Right', 'Back'), 'S': ('Front',), 'E': ('Right',), 'N': ('Back',)}   # the stills each view sits between
FACING = {'S': (0,), 'SE': (7, 1), 'E': (6, 2), 'NE': (5, 3), 'N': (4,)}   # deep16/js/sprites.js S.FACINGS: S SW W NW N NE E SE (1-3 drawn mirrored)
STAND = {2: ('CastOverhead', 1), 3: ('Fall', 1), 4: ('Interact', 1)}      # each page's standing frame (the desk: "Page2 overhead starts with idle;
                                                                         # page3 Fall starts with idle; page4 Interact starts with idle")
HEIGHT = 52                  # the Front still, top to boots, game px before the outline ring (54 with it: aurdin_p0's S)
# each sheet row: the page rows and frames it plays, in order, and where its ground is -- 'first' the first frame's boots, 'last' the last frame's
# (GetUp ends standing), or ('on', row, n) a lying frame set with its lowest point on that frame's lowest point (Prone 1 lies where Fall 6 lies)
ENGINE = {
    'idle': [('Idle', None, 'first')],
    'walk': [('Walk', None, 'first')],
    'cast': [('CastForward', None, 'first')],
    'castup': [('CastOverhead', None, 'first')],
    'defend': [('Defend', None, 'first')],
    'flinch': [('Flinch', None, 'first')],
    'hurt': [('Fall', None, 'first')],
    'prone': [('Fall', [2, 3, 4, 5], 'first'), ('Prone', [1], ('on', 'Fall', 6))],
    'getup': [('GetUp', None, 'last')],
    'attack': [('Interact', None, 'first')],
    'useitem': [('UseItem', None, 'first')],
    'victory': [('Victory', None, 'first')],
    'sit': [('GetUp', [3, 3], 'last')],
}
FPS = {'idle': 6, 'walk': 10, 'cast': 10, 'castup': 10, 'defend': 8, 'flinch': 12, 'hurt': 10, 'prone': 10, 'getup': 10, 'attack': 10,
       'useitem': 8, 'victory': 8, 'sit': 2}
RELEASE = {'attack': 2}                      # Interact 3, the hand furthest out (js/battle.js times a blow by its release)
FH, AY = 96, 84


def manifest():
    rows = json.load(open(os.path.join(ART72, 'ART-72-manifest.json')))
    return {e['page_id']: e for e in rows if e['page_id'].startswith('H')}


def rects():
    out = {}
    for r in json.load(open(os.path.join(ART72, 'ART-72-source-rectangles.json'))):
        out.setdefault(r['page'], []).append((r['row'], r['rects']))
    return out


def figure(a):
    """the figure mask off the page's navy: any channel more than 24 off it, holes filled unless the hole is the navy's own colour"""
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    m = np.abs(a - navy).max(-1) > 24
    holes = ndimage.binary_fill_holes(m) & ~m
    lab, n = ndimage.label(holes)
    if n:
        idx = np.arange(1, n + 1)
        mean = np.stack([ndimage.mean(a[..., c], lab, idx) for c in range(3)], -1)
        size = ndimage.sum(holes, lab, idx)
        keep_empty = (np.abs(mean - navy).max(-1) < 18) & (size >= 12)
        m |= np.isin(lab, idx[~keep_empty])
    return m, navy


def load(L):
    return np.asarray(Image.open(os.path.join(ART72, manifest()[L]['file'])).convert('RGB')).astype(np.int32)


def cut_page(L, check=False, log=None):
    """one ART-72 grid page -> {row: [(n, RGBA image, box)]}"""
    a = load(L)
    m, _ = figure(a)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(lab)
    rows = rects()[L]
    want = dict(manifest()[L]['rows'])
    owner = np.zeros(n + 1, np.int32)                    # each blob to the row whose boxes it overlaps most (0: no box -- lettering, dropped)
    best = np.zeros(n + 1)
    for k, (row, rs) in enumerate(rows):
        if len(rs) != want[row]:
            raise SystemExit('%s %s: %d boxes, the manifest says %d' % (L, row, len(rs), want[row]))
        box = np.zeros(m.shape, bool)
        for x0, y0, x1, y1 in rs:
            box[max(0, y0 - 4):y1 + 4, max(0, x0 - 4):x1 + 4] = True
        ov = ndimage.sum(box & m, lab, np.arange(1, n + 1))
        better = ov > best[1:]
        owner[1:][better] = k + 1
        best[1:][better] = ov[better]
    # a letter inside a box (H2P3's GetUp box takes the P of GET UP, the desk's cutter took it too): a small kept blob on the line of a dropped
    # one, within 30 px of it, mostly the labels' cream -- lettering, dropped; again till none moves, so a word goes letter by letter
    boxes = [(sl[1].start, sl[0].start, sl[1].stop, sl[0].stop) for sl in objs]
    size = ndimage.sum(m, lab, np.arange(1, n + 1))
    cream = np.median(np.concatenate([a[sl][lab[sl] == i + 1] for i, sl in enumerate(objs) if owner[i + 1] == 0 and size[i] < 2500]
                                     or [np.zeros((1, 3))]), axis=0)
    def lettered(i):
        x0, y0, x1, y1 = boxes[i]
        if size[i] >= 1500 or y1 - y0 > 40:
            return False
        px = a[objs[i]][lab[objs[i]] == i + 1]
        if (np.abs(px - cream).max(-1) < 45).mean() < 0.5:
            return False
        for j in range(n):
            if owner[j + 1] or size[j] >= 2500:
                continue
            u0, v0, u1, v1 = boxes[j]
            if min(y1, v1) - max(y0, v0) >= 0.7 * min(y1 - y0, v1 - v0) and (u0 - x1 <= 30 and x0 - u1 <= 30):
                return True
        return False
    moved = True
    while moved:
        moved = False
        for i in range(n):
            if owner[i + 1] and lettered(i):
                owner[i + 1] = 0; moved = True
                if log is not None:
                    log.append('%s a letter in a box, dropped: %d px at x %d-%d y %d-%d' % ((L, int(size[i])) + (boxes[i][0], boxes[i][2], boxes[i][1], boxes[i][3])))
    if log is not None:
        for i, sl in enumerate(objs):
            if owner[i + 1] == 0:
                sz = int((lab[sl] == i + 1).sum())
                if sz >= 40 and not (L == 'H1P1' and sl[0].stop <= 300):
                    log.append('%s dropped a blob of %d px at x %d-%d y %d-%d' % (L, sz, sl[1].start, sl[1].stop, sl[0].start, sl[0].stop))
    out = {}
    over = (a * 0.25).astype(np.uint8) if check else None
    for k, (row, rs) in enumerate(rows):
        mine = np.isin(lab, 1 + np.where(owner[1:] == k + 1)[0])
        g = SR.split_band(mine, [(x0 + x1) / 2 for x0, _, x1, _ in rs])
        frs = []
        for j in range(len(rs)):
            keep = g == j + 1
            if not keep.any():
                raise SystemExit('%s %s %d: nothing cut' % (L, row, j + 1))
            im, box = SR.rgba_crop(a, keep)
            frs.append((j + 1, im, box))
            if check:
                over[keep] = (a[keep] * 0.35 + np.array(SR.HUES[j % len(SR.HUES)]) * 0.65).astype(np.uint8)
        out[row] = frs
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'aurdin'); os.makedirs(d, exist_ok=True)
        Image.fromarray(over).resize((a.shape[1] // 2, a.shape[0] // 2), Image.BOX).save(os.path.join(d, 'cut-%s.png' % L))
    return out


def turnaround():
    """H1P1's four stills (Front, Right, Back, Left): {name: (height, filled area)} in page px"""
    a = load('H1P1')
    m, _ = figure(a)
    top = np.zeros_like(m); top[45:300, 470:] = m[45:300, 470:]      # under the words FRONT RIGHT BACK LEFT, right of the portrait
    lab, n = ndimage.label(top, structure=np.ones((3, 3)))
    sz = ndimage.sum(top, lab, range(1, n + 1))
    big = sorted(np.argsort(sz)[::-1][:4] + 1, key=lambda i: ndimage.find_objects(lab == i)[0][1].start)
    out = {}
    for name, i in zip(('Front', 'Right', 'Back', 'Left'), big):
        sl = ndimage.find_objects(lab == i)[0]
        near = np.zeros_like(top)                                    # a stray lock of hair or a boot heel apart from the body: its own column's
        near[:, max(0, sl[1].start - 12):sl[1].stop + 12] = top[:, max(0, sl[1].start - 12):sl[1].stop + 12]
        ys = np.where(near.any(1))[0]
        out[name] = (int(ys[-1] - ys[0] + 1), int(near.sum()))
    return out


def area(im):
    return float((np.asarray(im)[..., 3] > 0).sum())


def scales(pages):
    """page px a game px, every page: the turnaround's Front at HEIGHT, page 1s by sqrt-area against the turnaround, pages 2-4 against page 1"""
    t = turnaround()
    kt = t['Front'][0] / float(HEIGHT)
    k = {}
    for h, v in VIEW.items():
        p1 = pages['H%dP1' % h]
        ref = np.mean([t[s][1] for s in TURNVIEW[v]])
        a1 = area(p1['Idle'][0][1])
        k['H%dP1' % h] = kt * np.sqrt(a1 / ref)
        for p, (row, n) in STAND.items():
            k['H%dP%d' % (h, p)] = k['H%dP1' % h] * np.sqrt(area(pages['H%dP%d' % (h, p)][row][n - 1][1]) / a1)
    return k, kt, t


def game_size(img, k):
    w, h = img.size
    return img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')


def core_x(a):
    """x of the body's thick middle (the arms are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def place(a, x_ref, up, fw, ax):
    """a 1x RGBA array onto an fw x FH frame: x_ref at ax, the lowest opaque row `up` px above AY"""
    out = np.zeros((FH, fw, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


def all_pages(check=False, log=None):
    return {'H%dP%d' % (h, p): cut_page('H%dP%d' % (h, p), check, log) for h in VIEW for p in (1, 2, 3, 4)}


def views(pages, k):
    """{view: {sheet row: [(1x RGBA array, its core x, px above the ground)]}}"""
    out = {}
    for h, v in VIEW.items():
        rows = {}
        for p in (1, 2, 3, 4):
            rows.update({r: (frs, k['H%dP%d' % (h, p)]) for r, frs in pages['H%dP%d' % (h, p)].items()})
        out[v] = {}
        for eng, parts in ENGINE.items():
            seq = []
            for row, which, ground in parts:
                frs, kk = rows[row]
                if ground == 'first':
                    floor = frs[0][2][3]
                elif ground == 'last':
                    floor = frs[-1][2][3]
                for n in (which or [f[0] for f in frs]):
                    nm, im, box = frs[n - 1]
                    a = pix.pixelate(game_size(im, kk), 1, do_lift=False)
                    if isinstance(ground, tuple):                     # its lowest point on another frame's (Prone 1 on Fall 6), in game px
                        ofr, ok = rows[ground[1]]
                        ofl = ofr[0][2][3]
                        up = int(round((ofl - ofr[ground[2] - 1][2][3]) / ok))
                    else:
                        up = int(round((floor - box[3]) / kk))
                    seq.append((a, core_x(a), up))
            out[v][eng] = seq
    return out


def build(name=NAME, check=False):
    log = []
    pages = all_pages(check, log)
    for line in log:
        print('  ' + line)
    k, kt, t = scales(pages)
    hd = views(pages, k)
    frames, sizes, lost = {}, {}, []
    for eng in ENGINE:
        per = [None] * 8
        for v, fs in FACING.items():
            for f in fs:
                per[f] = hd[v][eng]
        half = max(max(cx, a.shape[1] - cx) for fs in per for a, cx, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(64, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, fs in enumerate(per):
            row = []
            for a, cx, up in fs:
                if f in (1, 2, 3):
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, fw // 2)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in ('castup', 'defend', 'getup', 'useitem', 'victory'):     # (this cutter's own rows, named here as tools/gnollmatriarch-sheet.py names its cackle)
        if extra not in pix.ANIM_ORDER:
            pix.ANIM_ORDER.append(extra)
    pix.write_sheet(name, frames, 64, FH, 32, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    for row, r in RELEASE.items():
        meta['anims'][row]['release'] = r
    meta['source'] = 'drawn by the art desk (2026-10-18, ART-72, the Ochre Mantle: every row in all five views), cut and snapped by tools/aurdin-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)
    return name


def measure():
    log = []
    pages = all_pages(False, log)
    k, kt, t = scales(pages)
    print('turnaround (page px: height, filled area):', t)
    print('the turnaround cut at %.3f page px a game px (Front %d page px -> %d)' % (kt, t['Front'][0], HEIGHT))
    for L in sorted(k):
        h, p = int(L[1]), int(L[3])
        alt = ''
        if p > 1:
            a1 = area(pages['H%dP1' % h]['Idle'][0][1])
            others = {2: ('Flinch', 1), 3: ('GetUp', 6), 4: ('Victory', 1)}[p]
            alt = '  (by %s %d instead: %.3f)' % (others[0], others[1], k['H%dP1' % h] * np.sqrt(area(pages[L][others[0]][others[1] - 1][1]) / a1))
        print('  %s %-2s  %.3f%s' % (L, VIEW[h], k[L], alt))
    # the colour, each page at game size: medians of the warm (hair, mantle, skin) and of the robe's blue, hue / saturation / value
    for L in sorted(pages):
        warm, blue = [], []
        for row, frs in pages[L].items():
            for _, im, _ in frs:
                a = np.asarray(game_size(im, k[L])).astype(float)
                a = a[a[..., 3] > 200][:, :3] / 255.0
                mx, mn = a.max(-1), a.min(-1)
                s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
                d = np.maximum(mx - mn, 1e-6)
                r, g, b = a[:, 0], a[:, 1], a[:, 2]
                hh = (np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60) % 360
                sat = s > 0.25
                w = sat & ((hh < 60) | (hh > 330)); bl = sat & (hh > 200) & (hh < 260)
                warm.append(np.stack([hh[w], s[w], mx[w]], -1)); blue.append(np.stack([hh[bl], s[bl], mx[bl]], -1))
        wm, bm = np.median(np.concatenate(warm), 0), np.median(np.concatenate(blue), 0)
        print('  %s warm %5.1f %.3f %.3f   blue %5.1f %.3f %.3f' % (L, wm[0], wm[1], wm[2], bm[0], bm[1], bm[2]))
    for line in log:
        print('  ' + line)


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(name=NAME):
    """dev/visions/aurdin/facings-<row>.png: every facing of every row as written, S SW W NW N NE E SE top to bottom, 2x on a grey floor (the foot's
    line drawn); lineup.png: idle frame 1 in all eight facings beside the other three heroes and his LPC sheet (S and E), 4x"""
    d = os.path.join(ROOT, 'dev', 'visions', 'aurdin'); os.makedirs(d, exist_ok=True)
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA')
    for row, an in m['anims'].items():
        fw, fh, n, y, ay = an.get('fw', m['fw']), an.get('fh', m['fh']), an['frames'], an['y'], an.get('ay', m['ay'])
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1), fh * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            dr.line([(0, f * fh + ay + 1), (cv.width, f * fh + ay + 1)], fill=(110, 114, 110, 255))
            dr.text((2, f * fh + 2), FN[f], fill=(255, 255, 255, 255))
            for i in range(n):
                cv.alpha_composite(im.crop((i * fw, y + f * fh, (i + 1) * fw, y + (f + 1) * fh)), (4 + i * (fw + 4), f * fh))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % row))
    cells = []
    an = m['anims']['idle']
    for f in range(8):
        cells.append((im.crop((0, an['y'] + f * an['fh'], an['fw'], an['y'] + (f + 1) * an['fh'])), an['ay']))
    for other in ('aurdin_p0', 'barley_p0', 'vivian_p0', 'lymen_p0'):
        g = json.load(open(os.path.join(ROOT, 'deep16', 'art', other + '.json')))
        gi = Image.open(os.path.join(ROOT, 'deep16', 'art', other + '.png')).convert('RGBA')
        ga = g['anims']['idle']
        gfw, gfh, gay = ga.get('fw', g['fw']), ga.get('fh', g['fh']), ga.get('ay', g['ay'])
        for f in (0, 6):
            cells.append((gi.crop((0, ga['y'] + f * gfh, gfw, ga['y'] + (f + 1) * gfh)), gay))
    top = max(ay for _, ay in cells)
    cw = max(c.width for c, _ in cells)
    cv = Image.new('RGBA', (cw * len(cells), top + 16), (70, 74, 70, 255))
    for i, (c, ay) in enumerate(cells):
        cv.alpha_composite(c.crop((0, 0, c.width, min(c.height, ay + 12))), (i * cw + (cw - c.width) // 2, top - ay))
    ImageDraw.Draw(cv).line([(0, top + 1), (cv.width, top + 1)], fill=(200, 60, 60, 255))
    cv.resize((cv.width * 4, cv.height * 4), Image.NEAREST).save(os.path.join(d, 'lineup.png'))
    print('  wrote', d)


if __name__ == '__main__':
    args = sys.argv[1:]
    if 'measure' in args:
        measure()
    else:
        build(check='check' in args)
        if 'check' in args:
            facings()

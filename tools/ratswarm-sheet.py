"""DEEP16 pipeline 2 (generated art): the art desk's ART-74 -> ratswarm_p1, the Swarm of Rats as a swarm -- many Tiny rats in one Medium square.

    python tools/ratswarm-sheet.py            # deep16/art/ratswarm_p1.png + .json
    python tools/ratswarm-sheet.py check      # also dev/visions/ratswarm/: each page's cut, every facing of every row, a lineup beside the heroes
    python tools/ratswarm-sheet.py measure    # the numbers the scale and the anchor are taken from, printed (nothing written)

Source (Griz, 2026-10-20, to the lanes desk, asked whether to put cutters on the uncut deliveries in Fresh: "Negative, except for Rat swarm. That
and the two main heroes is probably graphics budget usage this week."): ART-74-rat-swarm-FINAL-SHEETS.zip, sorted out of Fresh into
deep16/_src/ratswarm/ART-74/ (the 15 selected pages and their manifest.json; tools' sort script ART-74-sort.py beside it), the desk's papers and
the zip in _src/art-desk/received-2026-10-20-ART-74/. Five views, three pages each: H1 SE (its PAGE-1 the identity page: a portrait and the
turnaround, Front Right Back Left, above its rows), H2 NE, H3 S, H4 E, H5 N -- each page's view and rows read from the manifest, never assumed.
Facings (RULED 10-14, five drawn views): S, SE, E, NE, N as drawn; SW, W, NW their mirrors (the desk's facing_map).
Rows (ENGINE below; the desk's proposal, ART-74-CUTTER-NOTES.md, checked against the engine): Idle -> idle; Scurry -> walk; Bites -> attack (the
foe's one blow is named Bites, and js/battle.js plays a row named for the blow where the sheet has one, else `attack` -- every other path that
strikes plays `attack`, so the row is `attack`; the jaws meet on frame 4, `release` 3); Flinch -> flinch (battle.js hurt: a blow that leaves it
standing); Scatter -> hurt (the death row: js/ui.js plays it once at 0 HP and holds its last frame, the quiet residue, where it fell -- a swarm is
never prone, foes.js noProne); Oil Fire -> oilfire (NEW: js/oil.js plays it, once, when fire from oil -- a burning square, or the oil on it
catching -- hurts it and it lives; then idle). No Prone, no getting up (condition-immune; the desk drew none).
How a page is cut (the Barley cutter's way, tools/barley-sheet.py, 1e5d03b). Its labels are found, not typed: cream glyphs grouped into words and
words into strips; the first strip is the page's title (what lies in it is dropped: its big letters are figure-coloured); a strip of single glyphs
below it is a band's numbers, matched in order to the manifest's printed bands (each band's count checked); a strip of three words or more is the
turnaround's captions; any other strip is a row's name. Every blob belongs to the first number or caption strip below its middle -- a caption's
blobs are the portrait and the turnaround, the reference, never a frame; every blob wholly inside a word's box is dropped; each band is split
among its numbers' x by tools/sheetrows.py split_band. A swarm's frame is every rat, tail, oil, flame and smoke its number owns.
The scale: the turnaround's four stills (Front Right Back Left, one page, one scale) fill the 5-ft square -- their mean width FILL game px with the
outline ring, the 64-px floor diamond's width. Each view's Idle by its mean filled area against the still(s) its view sits between, sqrt-area (the
house's way since the hyena); every other row of the view by its whole-swarm frames (MEASURE) against the view's Idle, the same way: one scale a
row, never a frame alone, so a row keeps its own frames' sizes as drawn. A swarm's area is its rats' number times their size, and the desk drew
some rows fuller than others (the S Bites ~28 rats to the Idle's ~20); the one length the pages give in numbers is the eyes -- each face's two
bead eyes with their white glints, frontal only -- so `measure` prints the S view's eye spacing in game px at each row's scale, the check on
the rats' own size (written in the return: deep16/_src/outbox/ENGINE-RETURN-2026-10-20b-ratswarm.md).
The anchor: a swarm has no feet. Each frame's swarm middle (the median of its pixels, flames left out) on the square's middle, at the height
that puts the SE Idle 1's front edge FRONT px below it -- the edge of the largest ellipse in the 64x32 diamond (16 / sqrt 2): "a common center
ground anchor; let wider scatter/fire envelopes grow without shrinking rats" (the desk).
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
if not os.path.exists(os.path.join(SRC, 'ratswarm')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')
PAGES = os.path.join(SRC, 'ratswarm', 'ART-74')
NAME = 'ratswarm_p1'
VIEWS = ('SE', 'NE', 'S', 'E', 'N')
TURNVIEW = {'SE': ('Front', 'Right'), 'NE': ('Right', 'Back'), 'S': ('Front',), 'E': ('Right',), 'N': ('Back',)}   # the stills each view sits between
FACING = {'S': (0,), 'SE': (7, 1), 'E': (6, 2), 'NE': (5, 3), 'N': (4,)}   # deep16/js/sprites.js S.FACINGS: S SW W NW N NE E SE (1-3 drawn mirrored)
FILL = 64                    # the stills' mean width, outline ring and all: the 5-ft square's floor diamond is 64 px wide (32 high)
FRONT = 11                   # the SE Idle 1's lowest row this far below the square's middle (16 / sqrt 2: the largest ellipse in the diamond)
# each row's whole-swarm frames, measured against its view's Idle for the row's scale (Bites 1 the low ready swarm, 6 the guard; Flinch 1 and its
# recovery 4; Scatter 1 the living group before it breaks; Oil Fire 1 the swarm over its oil before it lights -- the rest spread, burn or thin)
MEASURE = {'Idle': None, 'Scurry': None, 'Bites': (1, 6), 'Flinch': (1, 4), 'Scatter': (1,), 'Oil Fire': (1,)}
ENGINE = {'idle': 'Idle', 'walk': 'Scurry', 'attack': 'Bites', 'hurt': 'Scatter', 'flinch': 'Flinch', 'oilfire': 'Oil Fire'}
NEW_ROWS = ['oilfire']                                      # (this cutter's rows, after pixelate's own order)
FPS = {'idle': 6, 'walk': 10, 'attack': 12, 'hurt': 10, 'flinch': 12, 'oilfire': 8}
RELEASE = {'attack': 3}      # the jaws meet on frame 4 (the desk: "candidate contact human4/index3") -- js/battle.js times a blow by its release


# ---------------------------------------------------------------- the pages
def pages():
    """the manifest's pages: [{path, view, bands: [(action, first, last)]}] -- the reference band (no range) left out"""
    man = json.load(open(os.path.join(PAGES, 'manifest.json'), encoding='utf-8'))
    out, seen = [], set()
    for e in man['pages']:
        path = os.path.join(PAGES, e['file'])
        if not os.path.isfile(path):
            raise SystemExit('missing page: ' + path)
        if man['facing_map'].get(e['view']) != 'H%s' % e['page_id'].split('HEAD-')[1][0]:
            raise SystemExit('%s: its head and its view %s disagree with the facing map' % (e['file'], e['view']))
        bands = [(b['action'], b['range'][0], b['range'][1]) for b in e['printed_bands_top_to_bottom'] if b.get('range')]
        for act in {b[0] for b in bands}:
            if (e['view'], act) in seen:
                raise SystemExit('two pages for %s %s' % (e['view'], act))
            seen.add((e['view'], act))
            got = sorted(n for b in bands if b[0] == act for n in range(b[1], b[2] + 1))
            if got != list(range(1, e['rows'][act] + 1)):
                raise SystemExit('%s %s: bands give frames %s, the manifest %d' % (e['file'], act, got, e['rows'][act]))
        out.append(dict(path=path, view=e['view'], bands=bands, reference=e.get('reference_drawings', 0)))
    missing = [(v, a) for v in VIEWS for a in ENGINE.values() if (v, a) not in seen]
    if missing:
        raise SystemExit('rows with no page: %s' % missing)
    return out


# ---------------------------------------------------------------- the labels
def cream(a):
    return (a.min(-1) > 150) & (a.mean(-1) > 195)


def glyph_words(a, m):
    """cream glyphs (a small piece, a third of it cream) grouped into words: [x0, y0, x1, y1, glyphs] (tools/barley-sheet.py's)"""
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    cr = cream(a)
    gl = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if h > 44 or w > 44 or h < 9:
            continue
        if cr[sl][lab[sl] == i + 1].mean() < 0.3:
            continue
        gl.append([sl[1].start, sl[0].start, sl[1].stop, sl[0].stop])
    gl.sort()
    ws = []
    for g in gl:
        for wd in ws:
            if abs((wd[1] + wd[3]) / 2 - (g[1] + g[3]) / 2) < 10 and g[0] - wd[2] < 24 and g[0] >= wd[0]:
                wd[0], wd[1], wd[2], wd[3] = min(wd[0], g[0]), min(wd[1], g[1]), max(wd[2], g[2]), max(wd[3], g[3]); wd[4] += 1
                break
        else:
            ws.append(g + [1])
    return ws


def strips(ws):
    """words grouped by their middle's y: [(y, [words left to right])]"""
    out = []
    for w in sorted(ws, key=lambda w: (w[1] + w[3]) / 2):
        if out and abs((w[1] + w[3]) / 2 - out[-1][0]) < 14:
            out[-1][1].append(w)
        else:
            out.append([(w[1] + w[3]) / 2, [w]])
    return [(c, sorted(l)) for c, l in out]


def read_labels(a, m):
    """-> (title's bottom y, [(y, number words)], [(y, caption words)], the boxes to drop) -- the strips sorted top to bottom; the boxes are
    every word's and every lettered strip's whole (the hyphen in "Idle (1-6)" is too short for a glyph, and stood in Idle 1 till 10-20)"""
    ws = glyph_words(a, m)
    sts = strips(ws)
    title = max(w[3] for w in sts[0][1])
    single = lambda l: all(w[4] == 1 for w in l)
    nums = [(y, l) for y, l in sts[1:] if single(l)]
    caps = [(y, l) for y, l in sts[1:] if not single(l) and len(l) >= 3]
    boxes = [(w[0] - 3, w[1] - 3, w[2] + 3, w[3] + 3) for w in ws]
    boxes += [(min(w[0] for w in l) - 3, min(w[1] for w in l) - 3, max(w[2] for w in l) + 3, max(w[3] for w in l) + 3) for y, l in sts if not single(l)]
    return title, nums, caps, boxes


# ---------------------------------------------------------------- a page cut
def blobs(a, m, boxes):
    SR.drop_text(m, boxes)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    sz = ndimage.sum(m, lab, range(1, n + 1))
    m &= np.isin(lab, 1 + np.where(sz >= 6)[0])             # specks under 6 px are noise
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    return lab, ndimage.find_objects(lab)


def cut_page(pg, check=False):
    """one page -> {action: [(n, RGBA image, box)]} in number order"""
    a = np.asarray(Image.open(pg['path']).convert('RGB')).astype(np.int32)
    m = SR.figure_mask(a)
    title, nums, caps, boxes = read_labels(a, m)
    name = os.path.basename(pg['path'])
    if len(nums) != len(pg['bands']):
        raise SystemExit('%s: %d number strips found, %d bands in the manifest' % (name, len(nums), len(pg['bands'])))
    if bool(caps) != bool(pg['reference']):
        raise SystemExit('%s: %d caption strips, %d reference drawings in the manifest' % (name, len(caps), pg['reference']))
    for (y, l), (act, f0, f1) in zip(nums, pg['bands']):
        if len(l) != f1 - f0 + 1:
            raise SystemExit('%s %s %d-%d at y %d: %d numbers' % (name, act, f0, f1, y, len(l)))
    lab, objs = blobs(a, m, boxes)
    cy = np.array([(sl[0].start + sl[0].stop) / 2 for sl in objs])
    marks = sorted([(y, k) for k, (y, _) in enumerate(nums)] + [(y, -1) for y, _ in caps])
    first = np.searchsorted(np.array([y for y, _ in marks]), cy)
    owner = np.array([marks[f][1] if f < len(marks) else -2 for f in first])
    owner[cy < title + 8] = -2                              # the title's letters
    if (owner == -2).sum() and any(sl[0].start > title + 8 for sl, o in zip(objs, owner) if o == -2):
        raise SystemExit('%s: a blob below the last strip' % name)
    out, over = {}, (a * 0.25).astype(np.uint8) if check else None
    for k, ((y, l), (act, f0, f1)) in enumerate(zip(nums, pg['bands'])):
        band = np.isin(lab, 1 + np.where(owner == k)[0])
        g = SR.split_band(band, [(w[0] + w[2]) / 2 for w in l])
        for dy, dx in ((0, 1), (1, 0), (1, 1), (1, -1)):   # two frames still touching (a tail into the next swarm)
            p = g[:g.shape[0] - dy, max(0, -dx):g.shape[1] - max(0, dx)]
            q = g[dy:, max(0, dx):g.shape[1] - max(0, -dx)]
            yy, xx = np.where((p > 0) & (q > 0) & (p != q))
            if len(yy):
                print('  touching: %s %s at x %d y %d (frames %d and %d)' % (name, act, xx[0] + max(0, -dx), yy[0],
                                                                         f0 + p[yy[0], xx[0]] - 1, f0 + q[yy[0], xx[0]] - 1))
                break
        for i in range(f1 - f0 + 1):
            kp = g == i + 1
            if not kp.any():
                raise SystemExit('%s %s frame %d: nothing cut' % (name, act, f0 + i))
            im, box = SR.rgba_crop(a, kp)
            out.setdefault(act, []).append((f0 + i, im, box))
            if check:
                over[kp] = (a[kp] * 0.35 + np.array(SR.HUES[i % len(SR.HUES)]) * 0.65).astype(np.uint8)
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'ratswarm'); os.makedirs(d, exist_ok=True)
        im = Image.fromarray(over)
        dr = ImageDraw.Draw(im)
        for y, l in nums:
            for w in l:
                dr.rectangle(w[:4], outline=(255, 255, 255))
        im.resize((im.width // 2, im.height // 2), Image.BOX).save(os.path.join(d, 'cut-' + name))
    return out


# ---------------------------------------------------------------- the measure
def turnaround(check=False):
    """the identity page's four stills (Front, Right, Back, Left): {name: (width, filled area)} in page px"""
    pg = [p for p in pages() if p['reference']][0]
    a = np.asarray(Image.open(pg['path']).convert('RGB')).astype(np.int32)
    m = SR.figure_mask(a)
    title, nums, caps, boxes = read_labels(a, m)
    y, l = caps[0]
    if len(l) != 5:
        raise SystemExit('identity page: %d captions, five wanted (the portrait, Front, Right, Back, Left)' % len(l))
    lab, objs = blobs(a, m, boxes)
    sz = ndimage.sum(lab > 0, lab, range(1, len(objs) + 1))
    xs = [(w[0] + w[2]) / 2 for w in l]
    half = 0.45 * min(xs[i + 1] - xs[i] for i in range(1, 4))
    out, marks = {}, []
    for nm, x in zip(('Front', 'Right', 'Back', 'Left'), xs[1:]):
        win = np.zeros(lab.shape, bool); win[int(title) + 8:int(l[0][1]) - 4, int(x - half):int(x + half)] = True
        ids = [i + 1 for i in range(len(objs)) if sz[i] >= 40 and (win & (lab == i + 1)).sum() > 0.9 * sz[i]]
        body = np.isin(lab, ids)
        cols, rows = np.where(body.any(0))[0], np.where(body.any(1))[0]
        out[nm] = (int(cols[-1] - cols[0] + 1), int(body.sum()))
        marks.append((int(cols[0]), int(rows[0]), int(cols[-1]), int(rows[-1])))
    if check:
        dd = os.path.join(ROOT, 'dev', 'visions', 'ratswarm'); os.makedirs(dd, exist_ok=True)
        im = Image.fromarray(a.astype(np.uint8)); dr = ImageDraw.Draw(im)
        for b in marks:
            dr.rectangle(b, outline=(255, 60, 60))
        im.save(os.path.join(dd, 'identity-measure.png'))
    return out


def area(im):
    return float((np.asarray(im)[..., 3] > 0).sum())


def mean_area(frs, which):
    return float(np.mean([area(im) for n, im, _ in frs if which is None or n in which]))


def glints(im):
    """a frame's eyes: each a white speck (4 px across at most) in a black bead -> [(x, y)] in page px"""
    a = np.asarray(im).astype(np.int32)
    keep = a[..., 3] > 0
    lum = a[..., :3].mean(-1)
    sat = a[..., :3].max(-1) - a[..., :3].min(-1)
    dark = ndimage.uniform_filter((keep & (lum < 45)).astype(float), size=7)
    lab, n = ndimage.label(keep & (lum > 175) & (sat < 60))
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        if (lab[sl] == i + 1).sum() > 8 or max(sl[0].stop - sl[0].start, sl[1].stop - sl[1].start) > 4:
            continue
        y, x = (sl[0].start + sl[0].stop) // 2, (sl[1].start + sl[1].stop) // 2
        if dark[y, x] >= 0.45:
            out.append((x, y))
    return out


def eye_spacing(frs):
    """the spacing of a face's two eyes over a row's frames, page px: each eye's nearest partner level with it (3 px) and 6 to 30 px off, the
    commonest spacing (its median within 2 px of the histogram's peak) -- (spacing, pairs found)"""
    ds = []
    for _, im, _ in frs:
        pts = glints(im)
        for i, (x, y) in enumerate(pts):
            d = [abs(x - x2) for j, (x2, y2) in enumerate(pts) if j != i and abs(y - y2) <= 3 and 6 <= abs(x - x2) <= 30]
            if d:
                ds.append(min(d))
    if len(ds) < 12:
        return None, len(ds)
    h, e = np.histogram(ds, bins=np.arange(6, 31))
    pk = e[np.argmax(np.convolve(h, [1, 2, 1], 'same'))]
    return float(np.median([d for d in ds if pk - 1.5 <= d <= pk + 2.5])), len(ds)


def measure(check=False, say=False):
    """every page cut, and each row's scale (page px a game px) -> ({(view, action): frames}, {(view, action): k}, kt, turnaround)"""
    cuts = {}
    for pg in pages():
        for act, frs in cut_page(pg, check).items():
            cuts[(pg['view'], act)] = frs
    t = turnaround(check)
    kt = np.mean([w for w, _ in t.values()]) / float(FILL - 2)    # (FILL counts the outline ring the pixel pass draws round the figure)
    K = {}
    for v in VIEWS:
        K[(v, 'Idle')] = kt * np.sqrt(mean_area(cuts[(v, 'Idle')], None) / np.mean([t[s][1] for s in TURNVIEW[v]]))
    for (v, act), frs in cuts.items():
        if act != 'Idle':
            K[(v, act)] = K[(v, 'Idle')] * np.sqrt(mean_area(frs, MEASURE[act]) / mean_area(cuts[(v, 'Idle')], None))
    if say:
        print('turnaround stills (page px: width, filled area):', t)
        print('the stills at %.3f page px a game px (their mean width %.0f page px -> %d game px with the outline ring)' % (kt, kt * (FILL - 2), FILL))
        for key in sorted(K, key=lambda k: (VIEWS.index(k[0]), list(ENGINE.values()).index(k[1]))):
            frs = cuts[key]
            base = K[(key[0], 'Idle')] / np.sqrt(mean_area(cuts[(key[0], 'Idle')], None))
            alt = ' '.join('%.2f' % (base * np.sqrt(area(f[1]))) for f in frs)
            es, ne = eye_spacing(frs)
            eye = '  eyes %.1f page px = %.2f game px (%d pairs)' % (es, es / K[key], ne) if es else ''
            print('  %-2s %-9s k %.3f  (%d frames; the scale each frame alone would give: %s)%s' % (key[0], key[1], K[key], len(frs), alt, eye))
    return cuts, K, kt, t


# ---------------------------------------------------------------- the sheet
def game_size(img, k):
    w, h = img.size
    return img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')


def fire(a):
    """a frame's flames and embers (Oil Fire): warm and bright -- left out of the swarm's middle"""
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    return (r > 180) & (r - b > 110) & (g > 60)


def middle(a):
    """the swarm's middle: the median x and y of its opaque pixels, its flames left out"""
    keep = (a[..., 3] > 0) & ~fire(a)
    if keep.sum() < 20:
        keep = a[..., 3] > 0
    ys, xs = np.where(keep)
    return float(np.median(xs)), float(np.median(ys))


def views(check=False):
    """{view: {sheet row: [(1x RGBA array, its middle x, its middle y)]}}"""
    cuts, K, _, _ = measure(check)
    out = {v: {} for v in VIEWS}
    for v in VIEWS:
        for eng, act in ENGINE.items():
            seq = []
            for n, im, box in cuts[(v, act)]:
                a = pix.pixelate(game_size(im, K[(v, act)]), 1, do_lift=False)
                seq.append((a,) + middle(a))
            out[v][eng] = seq
    return out


def place(a, mx, my, fw, fh, ax, cy):
    """a 1x RGBA array onto an fw x fh frame, its middle (mx, my) at (ax, cy)"""
    out = np.zeros((fh, fw, 4), dtype=np.uint8)
    ox, oy = int(round(ax - mx)), int(round(cy - my))
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(fh, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


def build(name=NAME, check=False):
    hd = views(check)
    a1, mx1, my1 = hd['SE']['idle'][0]
    lift = (np.where(a1[..., 3].any(1))[0][-1] - my1) - FRONT  # the middle this far above the square's middle (the SE Idle 1's front edge at FRONT)
    above = max(my - np.where(a[..., 3].any(1))[0][0] for v in hd.values() for fs in v.values() for a, _, my in fs) + lift
    below = max(np.where(a[..., 3].any(1))[0][-1] - my for v in hd.values() for fs in v.values() for a, _, my in fs) - lift
    AY = int(np.ceil((above + 4) / 4.0)) * 4
    FH = int(np.ceil((AY + max(0, below) + 4) / 8.0)) * 8
    frames, sizes, lost = {}, {}, []
    for eng in ENGINE:
        per = [None] * 8
        for v, fs in FACING.items():
            for f in fs:
                per[f] = hd[v][eng]
        counts = {len(p) for p in per}
        if len(counts) != 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, sorted(counts)))
        half = max(max(mx, a.shape[1] - mx) for p in per for a, mx, _ in p)   # each row its own width, about the middle (a mirror keeps it)
        fw = max(64, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f in range(8):
            row = []
            for a, mx, my in per[f]:
                if f in (1, 2, 3):
                    a, mx = a[:, ::-1], a.shape[1] - 1 - mx
                fr, gone = place(a, mx, my, fw, FH, fw // 2, AY - lift)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(sorted(set(lost))))
    for extra in NEW_ROWS:
        if extra not in pix.ANIM_ORDER:
            pix.ANIM_ORDER.append(extra)
    pix.write_sheet(name, frames, sizes['idle'][0], FH, sizes['idle'][0] // 2, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, an in meta['anims'].items():
        an['fps'] = FPS[row]
        if row in RELEASE:
            an['release'] = RELEASE[row]
    meta['source'] = ('drawn by the art desk (2026-10-19, ART-74: five views, six rows each), cut and snapped by tools/ratswarm-sheet.py; '
                      'each frame\'s swarm middle on its square\'s middle')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    stands(name, lift)
    return name


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def stands(name=NAME, lift=None):
    """the STANDS line (tools/sheetrows.py): idle frame 1 in every facing -- (how far its top rises above `ay`, how tall, how wide), outline to
    outline; a swarm's `ay` is its square's middle, not a foot, so its lowest row sits below it (printed beside)"""
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims']['idle']
    st, low = {}, {}
    for f in range(8):
        c = im[an['y'] + f * an['fh']:an['y'] + (f + 1) * an['fh'], :an['fw']]
        rows, cols = np.where(c[..., 3].any(1))[0], np.where(c[..., 3].any(0))[0]
        st[FN[f]] = (int(an['ay'] - rows[0]), int(rows[-1] - rows[0] + 1), int(cols[-1] - cols[0] + 1))
        low[FN[f]] = int(rows[-1] - an['ay'])
    print('  STANDS %r: %s' % (name, ', '.join("'%s': %s" % (k, v) for k, v in st.items())))
    print('  (its lowest row below `ay`: %s)' % ', '.join('%s %+d' % kv for kv in low.items()))
    return st


def facings(name=NAME):
    """dev/visions/ratswarm/facings-<row>.png: every facing of every row as written, S SW W NW N NE E SE top to bottom, 2x on a grey floor with
    the square's diamond under each frame; lineup.png: idle frame 1 in all eight facings beside the heroes (S and E), 4x, on one floor line"""
    d = os.path.join(ROOT, 'dev', 'visions', 'ratswarm'); os.makedirs(d, exist_ok=True)
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA')
    for row, an in m['anims'].items():
        fw, fh, n, y, ax, ay = an['fw'], an['fh'], an['frames'], an['y'], an['ax'], an['ay']
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1) + 24, fh * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            dr.text((2, f * fh + 2), FN[f], fill=(255, 255, 255, 255))
            for i in range(n):
                x0 = 24 + 4 + i * (fw + 4)
                cx, cy = x0 + ax, f * fh + ay
                dr.polygon([(cx - 32, cy), (cx, cy - 16), (cx + 32, cy), (cx, cy + 16)], outline=(120, 124, 120, 255))
                cv.alpha_composite(im.crop((i * fw, y + f * fh, (i + 1) * fw, y + (f + 1) * fh)), (x0, f * fh))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % row))
    an = m['anims']['idle']
    cells = [(im.crop((0, an['y'] + f * an['fh'], an['fw'], an['y'] + (f + 1) * an['fh'])), an['ay']) for f in range(8)]
    for other in ('giantrat_p1', 'barley_p2', 'aurdin_p2', 'vivian_p0', 'lymen_p0'):
        g = json.load(open(os.path.join(ROOT, 'deep16', 'art', other + '.json')))
        gi = Image.open(os.path.join(ROOT, 'deep16', 'art', other + '.png')).convert('RGBA')
        ga = g['anims']['idle']
        gfw, gfh, gay = ga.get('fw', g['fw']), ga.get('fh', g['fh']), ga.get('ay', g['ay'])
        for f in (0, 6):
            cells.append((gi.crop((0, ga['y'] + f * gfh, gfw, ga['y'] + (f + 1) * gfh)), gay))
    top = max(ay for _, ay in cells)
    cw = max(c.width for c, _ in cells)
    cv = Image.new('RGBA', (cw * len(cells), top + 24), (70, 74, 70, 255))
    dr = ImageDraw.Draw(cv)
    for i, (c, ay) in enumerate(cells):
        cx = i * cw + cw // 2
        dr.polygon([(cx - 32, top), (cx, top - 16), (cx + 32, top), (cx, top + 16)], outline=(120, 124, 120, 255))
        cv.alpha_composite(c.crop((0, 0, c.width, min(c.height, ay + 20))), (i * cw + (cw - c.width) // 2, top - ay))
    cv.resize((cv.width * 4, cv.height * 4), Image.NEAREST).save(os.path.join(d, 'lineup.png'))
    print('  wrote', d)


if __name__ == '__main__':
    args = sys.argv[1:]
    if 'measure' in args:
        measure(check='check' in args, say=True)
    else:
        build(check='check' in args)
        if 'check' in args:
            facings()

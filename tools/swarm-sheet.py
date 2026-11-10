"""DEEP16 pipeline 2 (generated art): the art desk's three swarms -> batswarm_p2, insectswarm_p2 and waspswarm_p1, each a Medium swarm of Tiny
beasts in its one square, in all eight facings.

    python tools/swarm-sheet.py [bats|insects|wasps ...]        # deep16/art/<sheet>.png + .json (all three by default)
    python tools/swarm-sheet.py check [...]                     # also dev/visions/<swarm>/: each page's cut, every facing of every row, a lineup
    python tools/swarm-sheet.py measure [...]                   # the scales, and each row's creature size at game size (nothing written)

Source (2026-11-10, the lanes desk's assignment on Griz's "they can churn through fresh one at a time as they complete at your discretion as to next
cut"): SWARM-OF-BATS-FULL-SHEETS, SWARM-OF-INSECTS-FULL-SHEETS and SWARM-OF-WASPS-FULL-SHEETS, sorted out of Fresh into deep16/_src/<swarm>/ART-SWARM-
<KIND>-2026-11-10/ (their HEAD-1 zips, byte for byte inside the full ones, in _src/_dupes/<swarm>/; the wasps' HEAD-1_SE zip, its cover note the only
file not in the full delivery, in _src/waspswarm/superseded/). Five views, three pages each: H1 SE (its PAGE-1 the identity page: a portrait and the
turnaround, Front Right Back Left, above its rows), H2 NE, H3 S, H4 E, H5 N. Facings (RULED 10-14, five drawn views): S, SE, E, NE, N as drawn;
SW, W, NW their mirrors.
Rows (the desk's notes, checked against the engine -- the rat swarm's own way, tools/ratswarm-sheet.py):
  the bats     Hover -> idle, Fly -> walk, Bites -> attack (the jaws on frame 4, `release` 3), Flinch -> flinch, Scatter -> hurt (the death row, its
               last frame held where it fell). They fly in every fight (js/flight-ai.js): aloft, a sheet with no `fly` row plays its idle and walk --
               the Hover still, the Fly moving.
  the insects  the crawling beetle swarm (the SRD's Swarm of Insects, walking 20 and climbing 20): Idle -> idle, Scurry -> walk, Bites, Flinch,
               Scatter as the bats'.
  the wasps    the SRD's Swarm of Wasps (its insect-swarm variant: walking 5, flying 30, no climb): Hover -> idle, Crawl -> walk (the 5 ft walk on the
               ground), Fly -> fly (js/ui.js aloftRow: aloft it plays in place of idle and walk, RULED 10-28 -- the art desk: "Fly is the primary
               movement and Crawl represents the 5 ft. walk"), Bites, Flinch, Scatter as the bats'.
How a page is cut: the rat swarm's (ratswarm-sheet.py read_labels, blobs): cream glyphs into words and strips; the first strip the title; a strip
of single glyphs a band's numbers, matched in order to the page's bands (each band's count checked); a strip of three words or more the turnaround's
captions (its blobs the reference, never a frame); every blob wholly inside a word dropped; each band split among its numbers. A swarm's frame is
every creature its number owns. The bats' and the wasps' frame maps (FRAME-MAP.json, each frame's crop window) are the check: a frame's pixels
outside its window (10 px about it) are printed. OMIT: a creature the desk asked left out (the bats' South Scatter 8's upper bat).
The scale: as the rat swarm's -- the turnaround's four stills fill the 5-ft square (their mean width FILL game px, the floor diamond's); each view's
idle row by its filled area against the stills its view sits between (sqrt-area); every other row by its whole-swarm frames (MEASURE) against the
view's idle row: one scale a row, so the creatures keep their size from row to row (`measure` prints each row's median creature at game size).
The place: a swarm has no feet. Each frame's middle (the median of its pixels) over the square's middle (the sheet's `ay`): a ground row's middle at
the height that puts the SE idle-row frame 1's front edge FRONT px below the square's middle (the rats'); an air row's (AIR) so that the SE Hover 1's
lowest pixel stands HOVER px over it (the owl's 12, the house's flier). Scatter keeps each frame where it was drawn against its number (the page's
own ground mark: "keep the fixed ground point across all eight frames"), frame 1 placed as its living row is; a flier's Scatter then comes down
evenly through the row till its last frame's lowest pixel rests REST px below the square's middle ("the grounded terminal hold").
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
RS = _load('ratswarm_sheet', os.path.join(ROOT, 'tools', 'ratswarm-sheet.py'))   # its label reader, blobs, area, game_size, middle

SRC = os.path.join(ROOT, 'deep16', '_src')                 # the pages live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'batswarm')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

VIEWS = ('SE', 'NE', 'S', 'E', 'N')
TURNVIEW = {'SE': ('Front', 'Right'), 'NE': ('Right', 'Back'), 'S': ('Front',), 'E': ('Right',), 'N': ('Back',)}   # the stills each view sits between
FACING = {'S': (0,), 'SE': (7, 1), 'E': (6, 2), 'NE': (5, 3), 'N': (4,)}   # deep16/js/sprites.js S.FACINGS: S SW W NW N NE E SE (1-3 drawn mirrored)
FILL = 64      # the stills' mean width, outline ring and all: the 5-ft square's floor diamond is 64 px wide (the rat swarm's)
FRONT = 11     # a ground row: the SE idle-row frame 1's lowest pixel this far below the square's middle (the rats')
HOVER = 12     # an air row: the SE Hover 1's lowest pixel this far over the square's middle (the owl's, the house's flier: tools/darkmantle-sheet.py)
REST = 5       # a flier's Scatter: its last frame's lowest pixel this far below the square's middle, down on the floor
MEASURE = {'Bites': (1, 6), 'Flinch': (1, 4), 'Scatter': (1,)}     # a row's whole-swarm frames for its scale (the rest of each row: all of it)
FPS = {'idle': 6, 'walk': 10, 'fly': 10, 'attack': 12, 'flinch': 12, 'hurt': 10}
RELEASE = {'attack': 3}    # the Bites' contact on frame 4 (every page's notes: "frame 4 (index 3)") -- js/battle.js times a blow by its release

P1 = lambda: [('Idle', 1, 6), ('Scurry', 1, 4), ('Scurry', 5, 8)]
P2 = lambda: [('Bites', 1, 3), ('Bites', 4, 6), ('Flinch', 1, 4)]
P3 = lambda: [('Scatter', 1, 4), ('Scatter', 5, 8)]
SWARMS = {
    'bats': dict(
        sheet='batswarm_p2', dir=os.path.join('batswarm', 'ART-SWARM-BATS-2026-11-10'), maps=True,
        pages=[(v, os.path.join('HEAD-%d_%s' % (h, d), 'PAGE-%d' % p, 'SWARM-OF-BATS_HEAD-%d_PAGE-%d_%s.png' % (h, p, d)), p)
               for h, v, d in ((1, 'SE', 'SE'), (2, 'NE', 'REAR-NE'), (3, 'S', 'SOUTH'), (4, 'E', 'EAST'), (5, 'N', 'NORTH')) for p in (1, 2, 3)],
        reference={('SE', 1), ('S', 1)},       # (the South page 1's portrait and stills are the generator's own, unasked: dropped as reference)
        engine={'idle': 'Hover', 'walk': 'Fly', 'attack': 'Bites', 'flinch': 'Flinch', 'hurt': 'Scatter'},
        air={'Hover', 'Fly', 'Bites', 'Flinch', 'Scatter'},
        omit={('S', 3): [(1262, 652, 1398, 714)]},   # the South Scatter 8's upper bat (its notes: x 1270-1391, y 659-708), for the grounded hold
        what='the Swarm of Bats'),
    'insects': dict(
        sheet='insectswarm_p2', dir=os.path.join('insectswarm', 'ART-SWARM-INSECTS-2026-11-10'), maps=False,
        pages=[(v, ('SWARM-OF-INSECTS_HEAD-1_PAGE-1_SE.png' if (h, p) == (1, 1) else 'SWARM-OF-INSECTS_H%dP%d_%s.png' % (h, p, v)), p)
               for h, v in ((1, 'SE'), (2, 'NE'), (3, 'S'), (4, 'E'), (5, 'N')) for p in (1, 2, 3)],
        bands={1: P1, 2: P2, 3: P3}, reference={('SE', 1)},
        engine={'idle': 'Idle', 'walk': 'Scurry', 'attack': 'Bites', 'flinch': 'Flinch', 'hurt': 'Scatter'},
        air=set(), omit={}, what='the Swarm of Insects'),
    'wasps': dict(
        sheet='waspswarm_p1', dir=os.path.join('waspswarm', 'ART-SWARM-WASPS-2026-11-10'), maps=True,
        pages=[(v, os.path.join('HEAD-%d_%s' % (h, d), 'PAGE-%d' % p, 'SWARM-OF-WASPS_HEAD-%d_PAGE-%d_%s.png' % (h, p, d)), p)
               for h, v, d in ((1, 'SE', 'SE'), (2, 'NE', 'REAR-NE'), (3, 'S', 'S'), (4, 'E', 'E'), (5, 'N', 'N')) for p in (1, 2, 3)],
        reference={('SE', 1)},
        engine={'idle': 'Hover', 'walk': 'Crawl', 'fly': 'Fly', 'attack': 'Bites', 'flinch': 'Flinch', 'hurt': 'Scatter'},
        air={'Hover', 'Fly', 'Bites', 'Flinch', 'Scatter'},
        omit={}, what='the Swarm of Wasps',
        cuts={('SE', 3): [[(1315, 713), (1340, 713)]]}),     # (the SE Scatter 4's lowest wasp's leg touches its number's top: the line between cleared)
}


# ---------------------------------------------------------------- the pages
def frame_map(path):
    """a page's FRAME-MAP.json beside it -> [(action, frame, (x0, y0, x1, y1))] in the map's order (the bats' `label`/`box`, the wasps' `action`/
    `crop_xyxy`; the turnaround's entries, with no frame number, left out)"""
    p = os.path.join(os.path.dirname(path), 'FRAME-MAP.json')
    m = json.load(open(p, encoding='utf-8'))
    out = []
    for e in m['frames']:
        act, n, box = e.get('label') or e.get('action'), e.get('frame'), e.get('box') or e.get('crop_xyxy')
        if act and n is not None and box:
            out.append((str(act).capitalize(), int(n), tuple(box)))
    return out


def bands_of(fm):
    """the printed bands, top to bottom, from a frame map: frames of one action whose windows share their bottom (within 40 px: the band's numbers
    lie under it; a window's top follows its drawing -- the wasps' SE Scatter 8 starts lower than 5-7) are one band"""
    bands = []
    for act, n, box in sorted(fm, key=lambda e: (e[2][3], e[2][0])):
        if bands and bands[-1][0] == act and abs(bands[-1][3] - box[3]) < 40:
            bands[-1][2] = max(bands[-1][2], n); bands[-1][1] = min(bands[-1][1], n)
        else:
            bands.append([act, n, n, box[3]])
    bands.sort(key=lambda b: b[3])
    return [(a, f0, f1) for a, f0, f1, _ in bands]


def pages(sw):
    S = SWARMS[sw]
    out = []
    for v, rel, p in S['pages']:
        path = os.path.join(SRC, S['dir'], rel)
        if not os.path.isfile(path):
            raise SystemExit('missing page: ' + path)
        fm = [e for e in frame_map(path) if e[0] in S['engine'].values()] if S['maps'] else None   # (the wasps' map lists the stills as frames too)
        bands = bands_of(fm) if fm else S['bands'][p]()
        out.append(dict(path=path, view=v, page=p, bands=bands, reference=(v, p) in S['reference'], fmap=fm, omit=S['omit'].get((v, p), []),
                        cuts=S.get('cuts', {}).get((v, p), [])))
    seen = {(pg['view'], b[0]) for pg in out for b in pg['bands']}
    missing = [(v, a) for v in VIEWS for a in S['engine'].values() if (v, a) not in seen]
    if missing:
        raise SystemExit('%s: rows with no page: %s' % (sw, missing))
    return out


# ---------------------------------------------------------------- a page cut (the rat swarm's, with each frame's number kept and the map's check)
def labels(a, m):
    """ratswarm-sheet.py read_labels, a caption strip being one that spans half the page or more: the turnaround's captions run under its five
    drawings, where a row's name with its range ("Scatter (1-4)": three words to the glyph pass) sits at the left margin -- its words still dropped"""
    title, nums, caps, boxes = RS.read_labels(a, m)
    return title, nums, [(y, l) for y, l in caps if l[-1][2] - l[0][0] > 0.5 * a.shape[1]], boxes



def cut_page(sw, pg, check=False):
    """one page -> {action: [(n, RGBA image, box, (its number's middle x, its number strip's top y))]} in number order"""
    a = np.asarray(Image.open(pg['path']).convert('RGB')).astype(np.int32)
    for x0, y0, x1, y1 in pg['omit']:                        # (a creature the desk asked left out: painted the page's navy)
        a[y0:y1, x0:x1] = np.median(a.reshape(-1, 3)[::97], axis=0)
    m = SR.figure_mask(a)
    if pg['cuts']:                                           # (a line of pixels cleared where a creature touches a label: sheetrows' CUT)
        wall = Image.new('1', (m.shape[1], m.shape[0]), 0)
        for line in pg['cuts']:
            ImageDraw.Draw(wall).line(line, fill=1, width=2)
        m &= ~np.asarray(wall, dtype=bool)
    title, nums, caps, boxes = labels(a, m)
    name = os.path.basename(pg['path'])
    if len(nums) != len(pg['bands']):
        raise SystemExit('%s: %d number strips found (%s), %d bands %s' % (name, len(nums), [len(l) for _, l in nums], len(pg['bands']), pg['bands']))
    if bool(caps) != bool(pg['reference']):
        raise SystemExit('%s: %d caption strips, reference %s' % (name, len(caps), pg['reference']))
    for (y, l), (act, f0, f1) in zip(nums, pg['bands']):
        if len(l) != f1 - f0 + 1:
            raise SystemExit('%s %s %d-%d at y %d: %d numbers' % (name, act, f0, f1, y, len(l)))
    lab, objs = RS.blobs(a, m, boxes)
    cy = np.array([(sl[0].start + sl[0].stop) / 2 for sl in objs])
    marks = sorted([(y, k) for k, (y, _) in enumerate(nums)] + [(y, -1) for y, _ in caps])
    first = np.searchsorted(np.array([y for y, _ in marks]), cy)
    owner = np.array([marks[f][1] if f < len(marks) else -2 for f in first])
    owner[cy < title + 8] = -2                              # the title's letters
    if any(sl[0].start > title + 8 for sl, o in zip(objs, owner) if o == -2):
        raise SystemExit('%s: a blob below the last strip' % name)
    win = {(act, n): box for act, n, box in (pg['fmap'] or [])}
    out, over, notes = {}, (a * 0.25).astype(np.uint8) if check else None, []
    for k, ((y, l), (act, f0, f1)) in enumerate(zip(nums, pg['bands'])):
        band = np.isin(lab, 1 + np.where(owner == k)[0])
        if win:                                             # a mapped page: each blob to the window holding most of it (the windows abut on a tight
            g = np.zeros(lab.shape, np.int32)               # band, where the nearest number gave a neighbour's bats away -- the South and East Hovers)
            ws = [win.get((act, f0 + i)) for i in range(f1 - f0 + 1)]
            if any(b is None for b in ws):
                raise SystemExit('%s %s %d-%d: no window in the map for every frame' % (name, act, f0, f1))
            for j in np.where(owner == k)[0]:
                sl = objs[j]; ys, xs = np.where(lab[sl] == j + 1); ys = ys + sl[0].start; xs = xs + sl[1].start
                inside = [int(((xs >= b[0]) & (xs < b[2]) & (ys >= b[1]) & (ys < b[3])).sum()) for b in ws]
                if max(inside) > 0:
                    i = int(np.argmax(inside))
                else:
                    cx, cy_ = xs.mean(), ys.mean()
                    dist = [max(b[0] - cx, 0, cx - b[2]) + max(b[1] - cy_, 0, cy_ - b[3]) for b in ws]
                    i = int(np.argmin(dist))
                    if dist[i] > 30:
                        print('  %s %s: a piece of %d px at x %d y %d, %d px from frame %d\'s window' % (name, act, len(xs), cx, cy_, dist[i], f0 + i))
                g[ys, xs] = i + 1
        else:
            g = SR.split_band(band, [(w[0] + w[2]) / 2 for w in l])
        for i in range(f1 - f0 + 1):
            kp = g == i + 1
            if not kp.any():
                raise SystemExit('%s %s frame %d: nothing cut' % (name, act, f0 + i))
            im, box = SR.rgba_crop(a, kp)
            w = l[i]
            out.setdefault(act, []).append((f0 + i, im, box, ((w[0] + w[2]) / 2.0, float(min(ww[1] for ww in l)))))
            b = win.get((act, f0 + i))
            if b is not None:                               # the map's check: the frame's pixels outside its crop window, 10 px about it
                ys, xs = np.where(kp)
                outside = int(((xs < b[0] - 10) | (xs >= b[2] + 10) | (ys < b[1] - 10) | (ys >= b[3] + 10)).sum())
                if outside > 0.005 * len(xs):
                    notes.append('%s %d: %d of %d px outside its window %s' % (act, f0 + i, outside, len(xs), b))
            elif pg['fmap'] is not None:
                notes.append('%s %d: no window in the map' % (act, f0 + i))
            if check:
                over[kp] = (a[kp] * 0.35 + np.array(SR.HUES[i % len(SR.HUES)]) * 0.65).astype(np.uint8)
    for n_ in notes:
        print('  map check, %s: %s' % (name, n_))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', SWARMS[sw]['sheet'].rsplit('_', 1)[0]); os.makedirs(d, exist_ok=True)
        im = Image.fromarray(over)
        dr = ImageDraw.Draw(im)
        for y, l in nums:
            for w in l:
                dr.rectangle(w[:4], outline=(255, 255, 255))
        for act, n, b in (pg['fmap'] or []):
            dr.rectangle(b, outline=(255, 200, 0))
        im.resize((im.width // 2, im.height // 2), Image.BOX).save(os.path.join(d, 'cut-' + name))
    return out


# ---------------------------------------------------------------- the measure
def turnaround(sw, check=False):
    """the identity page's four stills (Front, Right, Back, Left): {name: (width, filled area)} in page px -- the caption strip's last four words"""
    pg = [p for p in pages(sw) if p['reference'] and p['view'] == 'SE'][0]
    a = np.asarray(Image.open(pg['path']).convert('RGB')).astype(np.int32)
    m = SR.figure_mask(a)
    title, nums, caps, boxes = labels(a, m)
    y, l = caps[0]
    if len(l) < 5:
        raise SystemExit('%s identity page: %d caption words, a portrait and Front, Right, Back, Left wanted' % (sw, len(l)))
    lab, objs = RS.blobs(a, m, boxes)
    sz = ndimage.sum(lab > 0, lab, range(1, len(objs) + 1))
    xs = [(w[0] + w[2]) / 2 for w in l][-4:]
    half = 0.45 * min(xs[i + 1] - xs[i] for i in range(3))
    out, marks = {}, []
    for nm, x in zip(('Front', 'Right', 'Back', 'Left'), xs):
        win = np.zeros(lab.shape, bool); win[int(title) + 8:int(l[0][1]) - 4, int(x - half):int(x + half)] = True
        ids = [i + 1 for i in range(len(objs)) if sz[i] >= 40 and (win & (lab == i + 1)).sum() > 0.9 * sz[i]]
        body = np.isin(lab, ids)
        cols, rows = np.where(body.any(0))[0], np.where(body.any(1))[0]
        out[nm] = (int(cols[-1] - cols[0] + 1), int(body.sum()))
        marks.append((int(cols[0]), int(rows[0]), int(cols[-1]), int(rows[-1])))
    if check:
        dd = os.path.join(ROOT, 'dev', 'visions', SWARMS[sw]['sheet'].rsplit('_', 1)[0]); os.makedirs(dd, exist_ok=True)
        im = Image.fromarray(a.astype(np.uint8)); dr = ImageDraw.Draw(im)
        for b in marks:
            dr.rectangle(b, outline=(255, 60, 60))
        im.resize((im.width // 2, im.height // 2), Image.BOX).save(os.path.join(dd, 'identity-measure.png'))
    return out


def mean_area(frs, which):
    return float(np.mean([RS.area(f[1]) for f in frs if which is None or f[0] in which]))


def creature(a):
    """a frame's median creature at game size: the median area of its pieces 20 px or more (a beetle's legs or a wasp's wing joined to its body)"""
    lab, n = ndimage.label(a[..., 3] > 0)
    sz = ndimage.sum(a[..., 3] > 0, lab, range(1, n + 1))
    sz = sz[sz >= 20]
    return float(np.median(sz)) if len(sz) else 0.0


def measure(sw, check=False, say=False):
    """every page cut, and each row's scale (page px a game px) -> ({(view, action): frames}, {(view, action): k})"""
    S = SWARMS[sw]
    cuts = {}
    for pg in pages(sw):
        for act, frs in cut_page(sw, pg, check).items():
            cuts[(pg['view'], act)] = frs
    t = turnaround(sw, check)
    kt = np.mean([w for w, _ in t.values()]) / float(FILL - 2)    # (FILL counts the outline ring the pixel pass draws round the figure)
    idle = S['engine']['idle']
    K = {}
    for v in VIEWS:
        K[(v, idle)] = kt * np.sqrt(mean_area(cuts[(v, idle)], None) / np.mean([t[s][1] for s in TURNVIEW[v]]))
    for (v, act), frs in cuts.items():
        if act != idle:
            K[(v, act)] = K[(v, idle)] * np.sqrt(mean_area(frs, MEASURE.get(act)) / mean_area(cuts[(v, idle)], None))
    if say:
        acts = list(S['engine'].values())
        print('%s: turnaround stills (page px: width, filled area): %s' % (sw, t))
        print('  the stills at %.3f page px a game px (their mean width %.0f page px -> %d game px with the outline ring)' % (kt, kt * (FILL - 2), FILL))
        for key in sorted(K, key=lambda k: (VIEWS.index(k[0]), acts.index(k[1]))):
            frs = cuts[key]
            sizes = [creature(pix.pixelate(RS.game_size(f[1], K[key]), 1, do_lift=False)) for f in frs]
            print('  %-2s %-8s k %.3f  %d frames, the median creature %.0f game px (%s)' % (key[0], key[1], K[key], len(frs), np.median(sizes),
                                                                                       ' '.join('%.0f' % s for s in sizes)))
    return cuts, K


# ---------------------------------------------------------------- the sheet
def views(sw, check=False):
    """{view: {sheet row: [(1x RGBA array, its middle x, its middle y, its middle from its number in game px (dx, dy))]}}"""
    S = SWARMS[sw]
    cuts, K = measure(sw, check)
    out = {v: {} for v in VIEWS}
    for v in VIEWS:
        for eng, act in S['engine'].items():
            k, seq = K[(v, act)], []
            for n, im, box, (nx, ny) in cuts[(v, act)]:
                a = pix.pixelate(RS.game_size(im, k), 1, do_lift=False)
                mx, my = RS.middle(a)
                seq.append((a, mx, my, ((box[0] - nx) / k + mx, (box[1] - ny) / k + my)))
            out[v][eng] = seq
    return out


def low(a):
    return int(np.where(a[..., 3].any(1))[0][-1])


def build(sw, check=False):
    S = SWARMS[sw]
    name = S['sheet']
    hd = views(sw, check)
    rev = {act: eng for eng, act in S['engine'].items()}
    idle = 'idle'
    # the middle's height over the square's middle (dy < 0 is up): a ground row by the SE idle row's frame 1 front edge, an air row by the SE Hover 1
    a1, _, my1, _ = hd['SE'][idle][0]
    ground_dy = FRONT - (low(a1) - my1)
    ah = hd['SE'][rev['Hover']][0] if 'Hover' in rev else None
    air_dy = (-HOVER - (low(ah[0]) - ah[2])) if ah else None
    place = {}                                       # {(view, row): [(a, mx, my, dx, dy)]}: each frame's middle at (ax + dx, ay + dy)
    for v in VIEWS:
        for eng, act in S['engine'].items():
            base = air_dy if act in S['air'] else ground_dy
            seq = hd[v][eng]
            if eng != 'hurt':
                place[(v, eng)] = [(a, mx, my, 0.0, float(base)) for a, mx, my, _ in seq]
                continue
            d1 = seq[0][3]                           # Scatter: as drawn against its numbers, frame 1 where its living row is
            row = [(a, mx, my, rx - d1[0], base + ry - d1[1]) for a, mx, my, (rx, ry) in seq]
            if act in S['air']:                      # a flier comes down through the row to rest on the floor
                a8, _, my8, _, dy8 = row[-1]
                drop = REST - (dy8 + low(a8) - my8)
                n = len(row) - 1
                row = [(a, mx, my, dx, dy + drop * i / n) for i, (a, mx, my, dx, dy) in enumerate(row)]
            place[(v, eng)] = row
    allf = [f for fs in place.values() for f in fs]
    above = max(-(dy - my + np.where(a[..., 3].any(1))[0][0]) for a, mx, my, dx, dy in allf)       # the highest pixel over the square's middle
    below = max(dy - my + low(a) for a, mx, my, dx, dy in allf)
    AY = int(np.ceil((above + 4) / 4.0)) * 4
    FH = int(np.ceil((AY + max(0, below) + 4) / 8.0)) * 8
    frames, sizes, lost = {}, {}, []
    for eng in S['engine']:
        per = [None] * 8
        for v, fs in FACING.items():
            for f in fs:
                per[f] = place[(v, eng)]
        if len({len(p) for p in per}) != 1:
            raise SystemExit('%s %s: frame counts differ by facing' % (sw, eng))
        half = max(max(mx - dx, a.shape[1] - mx + dx, a.shape[1] - mx - dx, mx + dx) for p in per for a, mx, my, dx, dy in p)
        fw = max(64, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f in range(8):
            row = []
            for a, mx, my, dx, dy in per[f]:
                if f in (1, 2, 3):
                    a, mx, dx = a[:, ::-1], a.shape[1] - 1 - mx, -dx
                fr, gone = RS.place(a, mx, my, fw, FH, fw // 2 + dx, AY + dy)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('%s: cut off at the frame edges: %s' % (sw, ', '.join(sorted(set(lost)))))
    pix.write_sheet(name, frames, sizes['idle'][0], FH, sizes['idle'][0] // 2, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, an in meta['anims'].items():
        an['fps'] = FPS[row]
        if row in RELEASE:
            an['release'] = RELEASE[row]
    meta['source'] = ('drawn by the art desk (2026-11-10, %s: five views, three pages each), cut and snapped by tools/swarm-sheet.py; each frame\'s '
                      'swarm middle over its square\'s middle%s' % (S['what'], ', the flying rows %d px up' % HOVER if S['air'] else ''))
    json.dump(meta, open(meta_p, 'w'), indent=1)
    print('  %s: ay %d, fh %d; rows %s' % (name, AY, FH, ', '.join('%s %dx%d' % (r, sizes[r][0], FH) for r in frames)))
    RS.stands(name)
    return name


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(sw):
    """dev/visions/<swarm>/facings-<row>.png: every facing of every row as written, 2x on a grey floor with the square's diamond under each frame;
    lineup.png: idle frame 1 in all eight facings beside the rat swarm and the heroes, 4x, on one floor line"""
    name = SWARMS[sw]['sheet']
    d = os.path.join(ROOT, 'dev', 'visions', name.rsplit('_', 1)[0]); os.makedirs(d, exist_ok=True)
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
    for other in ('ratswarm_p1', 'giantbat_p1', 'barley_p2', 'vivian_p0'):
        g = json.load(open(os.path.join(ROOT, 'deep16', 'art', other + '.json')))
        gi = Image.open(os.path.join(ROOT, 'deep16', 'art', other + '.png')).convert('RGBA')
        ga = g['anims']['idle']
        gfw, gfh, gay = ga.get('fw', g['fw']), ga.get('fh', g['fh']), ga.get('ay', g['ay'])
        for f in (0, 7):
            cells.append((gi.crop((0, ga['y'] + f * gfh, gfw, ga['y'] + (f + 1) * gfh)), gay))
    top = max(ay for _, ay in cells)
    cw = max(c.width for c, _ in cells)
    cv = Image.new('RGBA', (cw * len(cells), top + 24), (70, 74, 70, 255))
    dr = ImageDraw.Draw(cv)
    for i, (c, ay) in enumerate(cells):
        cx = i * cw + cw // 2
        dr.polygon([(cx - 32, top), (cx, top - 16), (cx + 32, top), (cx, top + 16)], outline=(120, 124, 120, 255))
        cv.alpha_composite(c.crop((0, 0, c.width, min(c.height, ay + 20))), (i * cw + (cw - c.width) // 2, top - ay))
    cv.resize((cv.width * 3, cv.height * 3), Image.NEAREST).save(os.path.join(d, 'lineup.png'))
    print('  wrote', d)


if __name__ == '__main__':
    args = sys.argv[1:]
    which = [a for a in args if a in SWARMS] or list(SWARMS)
    for sw in which:
        if 'measure' in args:
            measure(sw, check='check' in args, say=True)
        else:
            build(sw, check='check' in args)
            if 'check' in args:
                facings(sw)

"""DEEP16 pipeline 2 (generated art): the art desk's ART-75 and ART-76 -> barley_p2, Barley in his battered brown coat with the threshing flail.

    python tools/barley-sheet.py            # deep16/art/barley_p2.png + .json
    python tools/barley-sheet.py check      # also dev/visions/barley/: each page's cut, every facing of every row, a lineup beside the heroes
    python tools/barley-sheet.py measure    # the numbers the scale and the grounds are taken from, printed (nothing written)

Source (Griz, 2026-10-20, to the lanes desk: "Spin up a Fable cutter for Barley's legs (art 75 & 76 in Fresh)"): four deliveries sorted out of
Fresh into deep16/_src/barley/ -- ART-75/ (the 38 retained source sheets and their manifest.json), ART-76/repair/ (the selected repair patch: four
of its six pages, manifest.json), ART-76/pass2/ (the deferred pass 2: 28 selected sources, manifest.json, S-WALK-provenance.json); the desk's reopened
battle Overhead B4 and the REVIEW zip (rejected and uncertain, NOT FINAL) in ART-76/superseded/, the empty-hands sweep test in ART-76/experiment/; the
desk's papers in _src/art-desk/received-2026-10-20-ART-75/ and -ART-76/. One action a page, one view a page: H1 SE, H2 NE (from behind), H3 S (the
front), H4 E (in profile), H5 N (the back) -- each page's head, facing and action read from its manifest, never assumed. The 8-bit pages (battle
LEFT, map stands and walks) are the 8-bit game's; this cutter takes the grid's.
Facings (RULED 10-14, five drawn views): S, SE, E, NE, N as drawn; SW, W, NW their mirrors (the flail changes hands in a mirror: the desk's declared
shortcut, its manifest `mirrors`). A view the desk left OPEN (ART-76-PASS2-CUTTER-NOTES.md, "Remaining 20 slots") is left out: its cells are empty
and the row's `drawn` lists the facings it has. The engine (js/sprites.js frameOf) plays a missing facing from the row's `under` sheet where it names
one -- the walk's is barley_p0, his LPC sheet, so a walk the desk has not drawn clean is the old walk -- and otherwise from the nearest drawn facing.
Rows (ENGINE below): Idle -> idle; Walk -> walk (S only: the desk's whole-frame salvage, 1,2,7,5,6,6,3,8; SE NE E N still repeat the leading leg,
OPEN); FlailSweep -> attack (every blow; the contact on 4, `release` 3); FlailOverhead -> attack2 (the second blow of a turn -- Extra Attack, or the
blow after an Action Surge: js/battle.js plays a sheet's attack2 there; N OPEN); Defend -> defend (the Dodge, battle.js); Flinch -> flinch; Fall ->
hurt (S OPEN); Prone -> prone (Fall 2-5 then Prone 1, where he lies while prone; S OPEN); GetUp -> getup (NE and E only), and `sit` (GetUp 3, sat up:
the campfire, js/campfire.js); Interact -> interact (a hand on a thing -- the rope, the barrel, the bucket: battle.js); UseItem -> useitem (a potion);
Victory -> victory (N OPEN); SecondWind -> secondwind; ActionSurge -> actionsurge (N OPEN). Prone 2 is the one drawing not used.
How a page is cut. Its labels are found, not typed: cream glyphs (each piece small, mostly cream) grouped into words and the words into strips; a strip
of single glyphs is a band's numbers, matched in order to the manifest's printed bands (each band's count checked), any other strip is a row's name
and dropped. Every blob belongs to the first number strip below its middle; every blob wholly inside a word's box is dropped; each band is split
among its numbers' x by tools/sheetrows.py split_band (bodies' cores to the nearest number, grown through their blobs, loose bits to the nearest).
The scale: the identity page's Front still stands HEIGHT game px from the top of his hair to his heels (the flail's top is not his height: the hair is
measured on the head's own columns) -- barley_p0's S, tools/sheetrows.py STANDS (51 tall with the outline ring), so he stands where he stood beside the
other three. Each Idle page by its Idle 1's filled area against the identity still(s) its view sits between, sqrt-area (the house's way since the
hyena: height lies, a raised flail is all height and no area); every other page by its standing frame (STAND) against its view's Idle 1; the Prone
pages by Prone 1 against Fall 6 at the Fall page's scale (the desk: "Fall/Prone source scales differ and need anatomy-based normalization").
The ground: each frame on its own printed band's ground (a band's first frame's feet), but a row the body leaves its feet in -- Fall, Prone, GetUp --
each frame on its own lowest point (the desk drew the lying frames higher on the page than the standing one's feet; on the band's ground they floated
over the floor), and the S walk on each frame's own lowest foot (its printed bands, 1-4 and 5-8, are not where the salvaged frames were drawn).
The legs (`legs`): a walk is wired only where its contact and passing sides alternate. Each frame's two feet are found in the bottom of the figure;
the lower is the one in front (the nearer the camera, the lower on screen), its side of the body's middle the leading leg; the other's lift says
contact (both down) or passing (one up). A row that leads with one leg through the whole cycle repeats it.
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
if not os.path.exists(os.path.join(SRC, 'barley')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')
BAR = os.path.join(SRC, 'barley')
DELIVERIES = [('ART-75', 'sources', 'selected_filename'), (os.path.join('ART-76', 'repair'), 'selected', 'selected_source'),
              (os.path.join('ART-76', 'pass2'), 'selected', 'selected_source')]
NAME, UNDER = 'barley_p2', 'barley_p0'
VIEW = {1: 'SE', 2: 'NE', 3: 'S', 4: 'E', 5: 'N'}
TURNVIEW = {'SE': ('Front', 'Right'), 'NE': ('Right', 'Back'), 'S': ('Front',), 'E': ('Right',), 'N': ('Back',)}   # the stills each view sits between
FACING = {'S': (0,), 'SE': (7, 1), 'E': (6, 2), 'NE': (5, 3), 'N': (4,)}   # deep16/js/sprites.js S.FACINGS: S SW W NW N NE E SE (1-3 drawn mirrored)
HEIGHT = 49                  # the Front still, hair to heels, game px before the outline ring (51 with it: barley_p0's S in STANDS)
# each page's standing frame, measured against its view's Idle 1 for the page's scale (the guard he starts or ends the row in)
STAND = {'Walk': 1, 'FlailSweep': 1, 'FlailOverhead': 1, 'Defend': 1, 'Flinch': 4, 'Fall': 1, 'GetUp': 6, 'Interact': 1, 'UseItem': 4, 'Victory': 1,
         'SecondWind': 6, 'ActionSurge': 1}
# each sheet row: the page rows and frames it plays, in order, and its ground -- 'band' each frame on its printed band's ground, 'own' each frame on its
# own lowest point, or ('on', row, n) a lying frame set with its lowest point where that frame's is (Prone 1 lies where Fall 6 lies)
ENGINE = {
    'idle': [('Idle', None, 'band')],
    'walk': [('Walk', None, 'own')],          # (the salvage moved whole frames between its raw sheet's two bands: frame 3 stood 23 page px over
                                               # its printed band's ground, a hop; each frame on its own lowest foot -- a walk always has one down)
    'attack': [('FlailSweep', None, 'band')],
    'hurt': [('Fall', None, 'own')],
    'sit': [('GetUp', [3, 3], 'own')],
    'flinch': [('Flinch', None, 'band')],
    'prone': [('Fall', [2, 3, 4, 5], 'own'), ('Prone', [1], 'own')],
    'attack2': [('FlailOverhead', None, 'band')],
    'defend': [('Defend', None, 'band')],
    'getup': [('GetUp', None, 'own')],
    'useitem': [('UseItem', None, 'band')],
    'victory': [('Victory', None, 'band')],
    'interact': [('Interact', None, 'band')],
    'secondwind': [('SecondWind', None, 'band')],
    'actionsurge': [('ActionSurge', None, 'band')],
}
NEW_ROWS = ['attack2', 'defend', 'getup', 'useitem', 'victory', 'interact', 'secondwind', 'actionsurge']   # (this cutter's rows, after pixelate's own order)
FPS = {'idle': 6, 'walk': 10, 'attack': 12, 'attack2': 12, 'hurt': 10, 'sit': 2, 'flinch': 12, 'prone': 10, 'defend': 8, 'getup': 10, 'useitem': 8,
       'victory': 8, 'interact': 10, 'secondwind': 8, 'actionsurge': 10}
RELEASE = {'attack': 3, 'attack2': 3}        # the beater meets the target on frame 4 of both swings (the desk: SE sweep "contact 4"; the overhead's
                                             # strike on 4, its 5 the follow-through) -- js/battle.js times a blow by its release
UNDER_ROWS = {'walk': UNDER}                 # a missing facing of these rows plays the old sheet's row (the desk: walks that repeat a leg stay unwired)


# ---------------------------------------------------------------- the pages
def pages():
    """the grid's pages from the three manifests: [{path, head, view, action, bands: [(first, last)]}], one per (view, action)"""
    out, seen = [], {}
    for sub, key, fkey in DELIVERIES:
        man = json.load(open(os.path.join(BAR, sub, 'manifest.json'), encoding='utf-8'))
        for e in man[key]:
            if not e.get('head') or e['action'] not in {p[0] for parts in ENGINE.values() for p in parts} | {'Prone'}:
                continue                                    # (the 8-bit's pages; the empty-hands test, kept in ART-76/experiment/)
            path = os.path.join(BAR, sub, os.path.basename(e[fkey]))
            if not os.path.isfile(path):
                raise SystemExit('missing page: ' + path)
            if VIEW[e['head']] != e['facing']:
                raise SystemExit('%s: head %s says %s, the manifest %s' % (path, e['head'], VIEW[e['head']], e['facing']))
            k = (e['facing'], e['action'])
            if k in seen:
                raise SystemExit('two pages for %s %s: %s and %s' % (k + (seen[k], path)))
            seen[k] = path
            bands = [tuple(b['frame_range']) for b in e['printed_bands_top_to_bottom']]
            out.append(dict(path=path, head=e['head'], view=e['facing'], action=e['action'], bands=bands))
    return out


# ---------------------------------------------------------------- the labels
def cream(a):
    return (a.min(-1) > 150) & (a.mean(-1) > 195)


def glyph_words(a, m):
    """cream glyphs (a small piece, a third of it cream) grouped into words: [x0, y0, x1, y1, glyphs]"""
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


# ---------------------------------------------------------------- a page cut
def cut_page(pg, check=False):
    """one page -> [(n, RGBA image, box, its band's ground)] in number order"""
    a = np.asarray(Image.open(pg['path']).convert('RGB')).astype(np.int32)
    m = SR.figure_mask(a)
    ws = glyph_words(a, m)
    sts = strips(ws)
    nums = [(y, l) for y, l in sts if all(w[4] == 1 for w in l)]   # a band's numbers: single glyphs; a name ("Idle SE", "Walk S") has a longer word
    if len(nums) != len(pg['bands']):
        raise SystemExit('%s: %d number strips found, %d bands in the manifest' % (os.path.basename(pg['path']), len(nums), len(pg['bands'])))
    seeds = []
    for (y, l), (f0, f1) in zip(nums, pg['bands']):
        if len(l) != f1 - f0 + 1:
            raise SystemExit('%s band %d-%d at y %d: %d numbers' % (os.path.basename(pg['path']), f0, f1, y, len(l)))
        seeds.append([(w[0] + w[2]) / 2 for w in l])
    SR.drop_text(m, [(w[0] - 3, w[1] - 3, w[2] + 3, w[3] + 3) for w in ws])
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    sz = ndimage.sum(m, lab, range(1, n + 1))
    m &= np.isin(lab, 1 + np.where(sz >= 6)[0])             # specks under 6 px are noise
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(lab)
    cy = np.array([(sl[0].start + sl[0].stop) / 2 for sl in objs])
    ly = np.array([y for y, _ in nums])
    owner = np.searchsorted(ly, cy)                         # the first number strip below the blob's middle
    out, over = [], (a * 0.25).astype(np.uint8) if check else None
    for k, ((y, l), (f0, f1)) in enumerate(zip(nums, pg['bands'])):
        band = np.isin(lab, 1 + np.where(owner == k)[0])
        g = SR.split_band(band, seeds[k])
        for dy, dx in ((0, 1), (1, 0), (1, 1), (1, -1)):   # two frames still touching (a beater into the next frame)
            p = g[:g.shape[0] - dy, max(0, -dx):g.shape[1] - max(0, dx)]
            q = g[dy:, max(0, dx):g.shape[1] - max(0, -dx)]
            yy, xx = np.where((p > 0) & (q > 0) & (p != q))
            if len(yy):
                print('  touching: %s at x %d y %d (frames %d and %d)' % (os.path.basename(pg['path']), xx[0] + max(0, -dx), yy[0],
                                                                       f0 + p[yy[0], xx[0]] - 1, f0 + q[yy[0], xx[0]] - 1))
                break
        frs = []
        for i in range(f1 - f0 + 1):
            kp = g == i + 1
            if not kp.any():
                raise SystemExit('%s frame %d: nothing cut' % (os.path.basename(pg['path']), f0 + i))
            im, box = SR.rgba_crop(a, kp)
            frs.append((f0 + i, im, box, frs[0][2][3] if frs else box[3]))   # (its ground: its printed band's first frame's feet)
            if check:
                over[kp] = (a[kp] * 0.35 + np.array(SR.HUES[i % len(SR.HUES)]) * 0.65).astype(np.uint8)
        out.extend(frs)
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'barley'); os.makedirs(d, exist_ok=True)
        im = Image.fromarray(over)
        dr = ImageDraw.Draw(im)
        for y, l in nums:
            for w in l:
                dr.rectangle(w[:4], outline=(255, 255, 255))
        im.resize((im.width // 2, im.height // 2), Image.BOX).save(os.path.join(d, 'cut-%s-%s.png' % (pg['view'], pg['action'])))
    return out


# ---------------------------------------------------------------- the measure
def turnaround(check=False):
    """the identity page's four stills (Front, Right, Back, Left): {name: (height hair to heels, filled area)} in page px"""
    path = os.path.join(BAR, 'ART-75', 'ART-75_IDENTITY_PAGE-1.png')
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
    m = SR.figure_mask(a)
    ws = glyph_words(a, m)
    names = [(y, l) for y, l in strips(ws) if len(l) == 4 and all(w[4] >= 4 for w in l)]   # FRONT RIGHT BACK LEFT
    if len(names) != 1:
        raise SystemExit('identity page: %d strips of four words' % len(names))
    y, l = names[0]
    SR.drop_text(m, [(w[0] - 3, w[1] - 3, w[2] + 3, w[3] + 3) for w in ws])
    xs = [(w[0] + w[2]) / 2 for w in l]
    half = 0.45 * (xs[1] - xs[0])
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    sz = ndimage.sum(m, lab, range(1, n + 1))
    out, marks = {}, []
    for nm, x in zip(('Front', 'Right', 'Back', 'Left'), xs):
        win = np.zeros_like(m); win[:int(l[0][1]) - 4, int(x - half):int(x + half)] = True
        ids = [i + 1 for i in range(n) if sz[i] >= 200 and (win & (lab == i + 1)).sum() > 0.9 * sz[i]]
        body = np.isin(lab, ids)
        rows = np.where(body.any(1))[0]
        bottom = rows[-1]
        d = ndimage.distance_transform_edt(body)
        cx = float(np.where(d >= 0.7 * d.max())[1].mean())        # the torso's middle; the head stands over it
        w = 0.11 * (bottom - rows[0])
        top = np.where(body[:, int(cx - w):int(cx + w)].any(1))[0][0]
        out[nm] = (int(bottom - top + 1), int(body.sum()))
        marks.append((int(cx - w), int(cx + w), int(top), int(bottom)))
    if check:
        dd = os.path.join(ROOT, 'dev', 'visions', 'barley'); os.makedirs(dd, exist_ok=True)
        im = Image.fromarray(a.astype(np.uint8)); dr = ImageDraw.Draw(im)
        for x0, x1, t, b in marks:
            dr.rectangle((x0, t, x1, b), outline=(255, 60, 60))
        im.save(os.path.join(dd, 'identity-measure.png'))
    return out


def area(im):
    return float((np.asarray(im)[..., 3] > 0).sum())


def measure(check=False, say=False):
    """every page cut, and each page's scale (page px a game px) -> ({(view, action): frames}, {(view, action): k}, kt, turnaround)"""
    cuts = {(pg['view'], pg['action']): cut_page(pg, check) for pg in pages()}
    t = turnaround(check)
    kt = t['Front'][0] / float(HEIGHT)
    K = {}
    for v in VIEW.values():
        idle = cuts[(v, 'Idle')]
        ref = np.mean([t[s][1] for s in TURNVIEW[v]])
        K[(v, 'Idle')] = kt * np.sqrt(area(idle[0][1]) / ref)
    for (v, act), frs in cuts.items():
        if act in STAND:
            K[(v, act)] = K[(v, 'Idle')] * np.sqrt(area(frs[STAND[act] - 1][1]) / area(cuts[(v, 'Idle')][0][1]))
    for (v, act), frs in cuts.items():
        if act == 'Prone':                                   # Prone 1 lies as Fall 6 lies
            K[(v, act)] = K[(v, 'Fall')] * np.sqrt(area(frs[0][1]) / area(cuts[(v, 'Fall')][5][1]))
    if say:
        print('identity stills (page px: height hair to heels, filled area):', t)
        print('the stills at %.3f page px a game px (Front %d page px -> %d)' % (kt, t['Front'][0], HEIGHT))
        for key in sorted(K, key=lambda k: (k[1], k[0])):
            frs = cuts[key]
            alt = ''
            if key[1] != 'Idle':                             # the scale every other frame of the page would give, for the eye
                base = K[(key[0], 'Idle')] / np.sqrt(area(cuts[(key[0], 'Idle')][0][1]))
                alt = '  by each frame: ' + ' '.join('%.2f' % (base * np.sqrt(area(f[1]))) for f in frs)
            grounds = ' '.join('%+d' % (f[3] - f[2][3]) for f in frs)
            print('  %-2s %-13s k %.3f  (%d frames; above its band\'s ground, page px: %s)%s' % (key[0], key[1], K[key], len(frs), grounds, alt))
    return cuts, K, kt, t


# ---------------------------------------------------------------- the legs
HIS = {'S': ('R', 'L'), 'N': ('L', 'R')}       # facing the camera his right leg is on the screen's left; from behind, his left


def legs(frs, view):
    """a walk's frames (page px) -> [(frame, leading leg 'R'/'L', how far the other foot stands above it in page px)], and the number of times
    the lead changes round the loop (an alternating gait changes twice; one that repeats a leg, never)"""
    out = []
    for nm, im, box, _ in frs:
        al = np.asarray(im)[..., 3] > 0
        rows = np.where(al.any(1))[0]
        top, bot = rows[0], rows[-1]
        low = al.copy(); low[:int(bot - 0.07 * (bot - top))] = False        # the lowest foot alone: the one in front
        mid = core_x(np.asarray(im))
        fx = np.where(low)[1].mean()
        lead = HIS[view][0] if fx < mid else HIS[view][1]
        legs_ = al.copy(); legs_[:int(bot - 0.25 * (bot - top))] = False    # the other: the lowest point past the front foot, the other side
        fc = np.where(low.any(0))[0]
        side = legs_[:, fc[-1] + 1:] if fx < mid else legs_[:, :fc[0]]
        other = np.where(side.any(1))[0]
        out.append((nm, lead, int(bot - other[-1]) if len(other) else None))
    seq = [s for _, s, _ in out]
    changes = sum(seq[i] != seq[i - 1] for i in range(len(seq)))
    return out, changes


def walk_report(cuts=None):
    cuts = cuts or {(pg['view'], pg['action']): cut_page(pg) for pg in pages() if pg['action'] == 'Walk'}
    rep = {}
    for v in VIEW.values():
        if (v, 'Walk') not in cuts:
            rep[v] = None
            print('  walk %-2s  no selected source (the desk: OPEN) -- %s plays its walk' % (v, UNDER))
            continue
        fr, ch = legs(cuts[(v, 'Walk')], v)
        rep[v] = (fr, ch)
        print('  walk %-2s  ' % v + '  '.join('%d %s%s' % (n, s, '' if l is None else '+%d' % l) for n, s, l in fr) +
              '   (the lead changes %d times round the loop: %s)' % (ch, 'alternates' if ch == 2 else 'REPEATS a leg' if ch == 0 else 'uneven'))
    return rep


# ---------------------------------------------------------------- the sheet
def game_size(img, k):
    w, h = img.size
    return img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')


def core_x(a):
    """x of the body's thick middle (the arms and the flail are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def place(a, x_ref, up, fw, fh, ax, ay):
    """a 1x RGBA array onto an fw x fh frame: x_ref at ax, the lowest opaque row `up` px above ay"""
    out = np.zeros((fh, fw, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), ay - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(fh, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


def views(check=False):
    """{view: {sheet row: [(1x RGBA array, its core x, px above the ground)]}} -- a view the desk has not drawn for a row is absent"""
    cuts, K, _, _ = measure(check)
    out = {v: {} for v in FACING}
    for v in FACING:
        for eng, parts in ENGINE.items():
            if not all((v, row) in cuts for row, _, _ in parts):
                continue
            seq = []
            for row, which, ground in parts:
                frs, k = cuts[(v, row)], K[(v, row)]
                for n in (which or [f[0] for f in frs]):
                    nm, im, box, floor = frs[n - 1]
                    a = pix.pixelate(game_size(im, k), 1, do_lift=False)
                    up = 0 if ground == 'own' else int(round((floor - box[3]) / k))
                    seq.append((a, core_x(a), up))
            out[v][eng] = seq
    return out


def build(name=NAME, check=False):
    hd = views(check)
    rise = [np.where(a[..., 3].any(1))[0] for v in hd.values() for fs in v.values() for a, _, _ in fs]
    ups = [up for v in hd.values() for fs in v.values() for _, _, up in fs]
    above = max(r[-1] + 1 - r[0] + u for r, u in zip(rise, ups))
    below = max(0, max(-u for u in ups))
    AY = int(np.ceil((above + 4) / 4.0)) * 4
    FH = int(np.ceil((AY + below + 4) / 8.0)) * 8
    frames, sizes, drawn, lost = {}, {}, {}, []
    for eng in ENGINE:
        per = [None] * 8
        for v, fs in FACING.items():
            if eng in hd[v]:
                for f in fs:
                    per[f] = hd[v][eng]
        have = [f for f in range(8) if per[f] is not None]
        counts = {len(per[f]) for f in have}
        if len(counts) != 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, sorted(counts)))
        nfr = counts.pop()
        half = max(max(cx, a.shape[1] - cx) for f in have for a, cx, _ in per[f])   # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(64, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng], drawn[eng] = [], have
        for f in range(8):
            row = []
            for i in range(nfr):
                if per[f] is None:                          # OPEN at the art desk: left out (the engine plays `under`, or the nearest drawn facing)
                    row.append(np.zeros((FH, fw, 4), dtype=np.uint8))
                    continue
                a, cx, up = per[f][i]
                if f in (1, 2, 3):
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, FH, fw // 2, AY)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
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
        if len(drawn[row]) < 8:
            an['drawn'] = drawn[row]
            if row in UNDER_ROWS:
                an['under'] = UNDER_ROWS[row]
    meta['source'] = ('drawn by the art desk (2026-10-19/20, ART-75 retained sheets and ART-76 repairs, five views; the views it left OPEN left out: '
                      'a row\'s `drawn` lists its facings), cut and snapped by tools/barley-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    print('  OPEN, left out: ' + ', '.join('%s %s' % (r, ' '.join(FN[f] for f in range(8) if f not in drawn[r])) for r in ENGINE if len(drawn[r]) < 8))
    return name


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(name=NAME):
    """dev/visions/barley/facings-<row>.png: every facing of every row as written, S SW W NW N NE E SE top to bottom, 2x on a grey floor (the foot's
    line drawn; an OPEN facing empty); lineup.png: idle frame 1 in all eight facings beside the four heroes' sheets (S and E), 4x"""
    d = os.path.join(ROOT, 'dev', 'visions', 'barley'); os.makedirs(d, exist_ok=True)
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA')
    for row, an in m['anims'].items():
        fw, fh, n, y, ay = an.get('fw', m['fw']), an.get('fh', m['fh']), an['frames'], an['y'], an.get('ay', m['ay'])
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1) + 24, fh * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            dr.line([(0, f * fh + ay + 1), (cv.width, f * fh + ay + 1)], fill=(110, 114, 110, 255))
            dr.text((2, f * fh + 2), FN[f], fill=(255, 255, 255, 255) if f in an.get('drawn', range(8)) else (255, 120, 120, 255))
            for i in range(n):
                cv.alpha_composite(im.crop((i * fw, y + f * fh, (i + 1) * fw, y + (f + 1) * fh)), (24 + 4 + i * (fw + 4), f * fh))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % row))
    cells = []
    an = m['anims']['idle']
    for f in range(8):
        cells.append((im.crop((0, an['y'] + f * an['fh'], an['fw'], an['y'] + (f + 1) * an['fh'])), an['ay']))
    for other in ('barley_p0', 'aurdin_p2', 'aurdin_p0', 'vivian_p0', 'lymen_p0'):
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
        measure(check='check' in args, say=True)
    elif 'legs' in args:
        walk_report()
    else:
        build(check='check' in args)
        if 'check' in args:
            facings()

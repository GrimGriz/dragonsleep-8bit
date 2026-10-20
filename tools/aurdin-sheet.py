"""DEEP16 pipeline 2 (generated art): the art desk's Aurdin suites -> his grid sheets, one a mantle.

    python tools/aurdin-sheet.py [ochre|red ...]          # deep16/art/aurdin_p2 (ochre) and aurdin_p3 (red), .png + .json (both by default)
    python tools/aurdin-sheet.py check [ochre|red ...]    # also dev/visions/aurdin/<look>/: each page's cut, every facing of every row, a lineup
    python tools/aurdin-sheet.py measure [ochre|red ...]  # the numbers the scale is taken from, printed (nothing written)

Source (Griz, 2026-10-18: "Try cut 72 in Fresh for Aurdin on the grid on main please"; 10-20: "there's quarterstaff zips in Fresh", "weapons final
also I think - several zips associated with 72 & 73", "We're going to try mantle as starter gear and ochre when wizard robes equpped"): the art
desk's two mantle suites, sorted out of Fresh into deep16/_src/aurdin/ (each zip beside its pages; the desk's papers, natives, previews and cutters
in _src/art-desk/received-<date>-<ART>/):
    ochre  ART-72 (the Ochre Mantle: his mother's homemade school robes)  + ART-72-QUARTERSTAFF + ART-72-RELAXED-IDLE
                                                                            + ART-72-WEAPONS (dropped 10-20)            -> aurdin_p2
    red    ART-73 (the Red Mantle: a short red mantle, a navy tunic)        + ART-73-QUARTERSTAFF + ART-73-RELAXED-IDLE
                                                                            + ART-73-WEAPONS                            -> aurdin_p3
The base suite's twenty grid pages, five views four pages each (H1 SE, H2 NE from behind, H3 S, H4 E, H5 N):
    page 1  Idle 6, Walk 8, CastForward 6     (H1P1 also the portrait and the turnaround -- Front, Right, Back, Left: the scale's measure)
    page 2  CastOverhead 6, Defend 4, Flinch 4
    page 3  Fall 6, Prone 2, GetUp 6
    page 4  Interact 6, UseItem 4, Victory 6
The supplements, a page a view: QUARTERSTAFF (StaffIdle 6 -- the two-handed guard, StaffWalk 8, StaffCast 6), WEAPONS (Quarterstaff 6 -- the staff
strike, Dagger 6, WandCast 6); RELAXED-IDLE one page, a row a view (StaffRelaxedIdle 6: one hand on the staff, its foot planted). The 8-bit pages
(battle, map) are the 8-bit game's and are not cut here.
Facings (RULED 10-14, five drawn views): S, SE, E, NE, N as drawn; SW, W, NW their mirrors (the book, the pouch and the hand on the staff change sides in
a mirror: the desk's declared shortcut). Rows (ENGINE below): Idle -> idle, Walk -> walk, CastForward -> cast (every aimed spell and a spell attack),
CastOverhead -> castup (a spell aimed at no one creature: js/magic.js M.cast), Defend -> defend (his Shield), Flinch -> flinch, Fall -> hurt (down,
held at its last frame), Prone -> prone (Fall 2-5 then Prone 1: ui.js holds its last frame), GetUp -> getup, Interact -> attack (an empty hand out
and back: a blow with nothing in hand, a touch spell, the rope, the barrel; `release` 2), Interact -> interact too (a hand on a thing: js/battle.js), UseItem -> useitem, Victory -> victory, `sit` (GetUp 3,
the campfire's seat); StaffIdle -> staffidle, StaffWalk -> staffwalk, StaffCast -> staffcast, StaffRelaxedIdle -> staffrest, Quarterstaff ->
staffstrike, Dagger -> dagger, WandCast -> wandcast (js/sprites.js S.inHand plays them while the hand holds the thing). Prone 2 is not used.
How a page is cut: the frames are where the desk's own cutter found them (ART-72-source-rectangles.json, ART-73's CUT-RECTS.json, a box a drawing);
a supplement page has no boxes, so its bodies are found (blobs of 2500 px and more, grouped into the manifest's rows by height and into frames by
x). A figure mask off the page's navy (any channel more than 24 off it, holes filled unless the navy's own colour); every blob touching a box kept,
a small cream blob on a label's line dropped (a letter inside a box), each row's blobs split among its boxes' centres by tools/sheetrows.py
split_band.
The scale: the turnaround's Front still stands HEIGHT game px top to boots, 54 with the game's outline ring -- what his LPC sheet stood facing S
(tools/sheetrows.py STANDS: aurdin_p0 S 54). Each base page 1 by its Idle 1's filled area against the turnaround's view(s), sqrt-area; each page
2-4 by its standing frame (STAND) against its page 1's Idle 1. A supplement page by its first frame's BODY (the filled area opened by 4 px, so the
thin staff, blade and wand drop out) against the same view's base Idle 1, sqrt-area; its rows stand on the body's boots, not the staff's foot.
The colour: the desk drew every page from its H1P1 and the pages agree (measure prints the medians); no toning.
"""
import os, re, sys, json, subprocess
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
AUR = os.path.join(SRC, 'aurdin')

LOOKS = {
    'ochre': dict(sheet='aurdin_p2', art='ART-72', name='the Ochre Mantle', weapons='ART-72-WEAPONS'),
    'red': dict(sheet='aurdin_p3', art='ART-73', name='the Red Mantle', weapons='ART-73-WEAPONS'),
}
VIEW = {1: 'SE', 2: 'NE', 3: 'S', 4: 'E', 5: 'N'}
TURNVIEW = {'SE': ('Front', 'Right'), 'NE': ('Right', 'Back'), 'S': ('Front',), 'E': ('Right',), 'N': ('Back',)}   # the stills each view sits between
FACING = {'S': (0,), 'SE': (7, 1), 'E': (6, 2), 'NE': (5, 3), 'N': (4,)}   # deep16/js/sprites.js S.FACINGS: S SW W NW N NE E SE (1-3 drawn mirrored)
STAND = {2: ('CastOverhead', 1), 3: ('Fall', 1), 4: ('Interact', 1)}      # each base page's standing frame (the desk: "Page2 overhead starts with idle;
                                                                         # page3 Fall starts with idle; page4 Interact starts with idle")
HEIGHT = 52                  # the Front still, top to boots, game px before the outline ring (54 with it: aurdin_p0's S)
STAFF = [('StaffIdle', 6), ('StaffWalk', 8), ('StaffCast', 6)]
WEAPONS = [('Quarterstaff', 6), ('Dagger', 6), ('WandCast', 6)]
REST = [('Rest' + v, 6) for v in ('SE', 'NE', 'S', 'E', 'N')]           # the relaxed page: a row a view, top to bottom
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
    'interact': [('Interact', None, 'first')],                       # (a hand on a thing -- the barrel, the rope: js/battle.js plays a sheet's own `interact`
                                                                     # there since Barley's ART-75, 10-20; his `attack` with the staff in hand is its strike)
    'useitem': [('UseItem', None, 'first')],
    'victory': [('Victory', None, 'first')],
    'sit': [('GetUp', [3, 3], 'last')],
    'staffidle': [('StaffIdle', None, 'first')],
    'staffwalk': [('StaffWalk', None, 'first')],
    'staffcast': [('StaffCast', None, 'first')],
    'staffrest': [('Rest', None, 'first')],
    'staffstrike': [('Quarterstaff', None, 'first')],
    'dagger': [('Dagger', None, 'first')],
    'wandcast': [('WandCast', None, 'first')],
}
FPS = {'idle': 6, 'walk': 10, 'cast': 10, 'castup': 10, 'defend': 8, 'flinch': 12, 'hurt': 10, 'prone': 10, 'getup': 10, 'attack': 10, 'interact': 10,
       'useitem': 8, 'victory': 8, 'sit': 2, 'staffidle': 6, 'staffwalk': 10, 'staffcast': 10, 'staffrest': 6, 'staffstrike': 10, 'dagger': 10,
       'wandcast': 10}
RELEASE = {'attack': 2, 'interact': 2, 'staffcast': 3, 'staffstrike': 3, 'dagger': 3, 'wandcast': 3}   # the hand furthest out; the staff's thrust, the blade's
                                                                                        # and the wand's on frame 4 (js/battle.js times a blow by it)
FH, AY = 112, 96             # (a staff raised overhead reaches 80 px over the boots)


# ------------------------------------------------------------------ the pages
def pages(look):
    """{page key: (file, [(row, count)], [(row, rects)] or None, view)} -- the base pages H<h>P<p>, the supplements S<h>, W<h>, and R (relaxed)"""
    lk, out = LOOKS[look], {}
    art = lk['art']
    base = os.path.join(AUR, art)
    if art == 'ART-72':
        man = {e['page_id']: (os.path.join(base, e['file']), [tuple(r) for r in e['rows']]) for e in json.load(open(os.path.join(base, 'ART-72-manifest.json')))
               if e['page_id'].startswith('H')}
        rc = {}
        for r in json.load(open(os.path.join(base, 'ART-72-source-rectangles.json'))):
            rc.setdefault(r['page'], []).append((r['row'], r['rects']))
    else:
        man, rc = {}, {}
        for e in json.load(open(os.path.join(base, 'MANIFEST.json')))['pages']:
            m = re.search(r'16BIT_HEAD-(\d)_PAGE-(\d)', e['file'])
            if m:
                man['H%sP%s' % m.groups()] = (os.path.join(base, os.path.basename(e['file'])), [tuple(r) for r in e['rows']])
        for e in json.load(open(os.path.join(base, 'CUT-RECTS.json'))):
            m = re.search(r'16BIT_HEAD-(\d)_PAGE-(\d)', e['source'])
            if m:
                rc['H%sP%s' % m.groups()] = [(r['name'], r['rects']) for r in e['rows']]
    for L, (f, rows) in man.items():
        out[L] = (f, rows, rc[L], VIEW[int(L[1])])
    for h, v in VIEW.items():
        out['S%d' % h] = (os.path.join(AUR, art + '-QUARTERSTAFF', '%s-QUARTERSTAFF_HEAD-%d_%s.png' % (art, h, v)), STAFF, None, v)
        if lk['weapons']:
            out['W%d' % h] = (os.path.join(AUR, lk['weapons'], '%s_HEAD-%d_%s.png' % (lk['weapons'], h, v)), WEAPONS, None, v)
    out['R'] = (os.path.join(AUR, art + '-RELAXED-IDLE', '%s-StaffRelaxedIdle-SE-NE-S-E-N.png' % art), REST, None, None)
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


def load(f):
    return np.asarray(Image.open(f).convert('RGB')).astype(np.int32)


def glyph(px):
    """a printed label's pixels: 15 or more bright ones, a quarter of it or more (its dark drop shadow is in the blob too: a thin 1 is mostly shadow);
    cream on most pages, white on ART-73's weapons"""
    br = px[px.mean(-1) > 160]
    return len(br) >= 15 and len(br) >= 0.25 * len(px)


def numbers_under(a, m0, y1, x0, x1):
    """the frame numbers printed under a row: small bright blobs (the labels' cream) whose tops lie within 70 px under its boots, as x centres
    (one a number: no frame runs past 9)"""
    lab, n = ndimage.label(m0, structure=np.ones((3, 3)))
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if not (y1 - 12 <= sl[0].start <= y1 + 70 and 10 <= h <= 40 and w <= 40 and x0 - 60 <= sl[1].start <= x1 + 60):
            continue
        px = a[sl][lab[sl] == i + 1]
        if glyph(px):
            out.append((sl[1].start + sl[1].stop) / 2.0)
    out.sort()
    merged = []                                                      # (a glyph in two pieces: one number)
    for x in out:
        if merged and x - merged[-1] < 20:
            merged[-1] = (merged[-1] + x) / 2
        else:
            merged.append(x)
    return merged


def found_rects(m, plan, tag, a=None):
    """a supplement page's boxes: its bodies (blobs of 2500 px and more in the mask opened by 4 px -- a walking staff touches the next frame's body,
    opened it doesn't) grouped into the plan's rows by height; each row's frames by the numbers printed under it (a walk's boots touch even opened),
    else by its bodies' x"""
    m0 = m
    m = ndimage.binary_opening(m, structure=np.ones((3, 3)), iterations=4)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(lab)
    size = ndimage.sum(m, lab, np.arange(1, n + 1))
    big = [(sl[0].start, sl[1].start, sl[0].stop, sl[1].stop) for i, sl in enumerate(objs) if size[i] >= 2500]
    if len(big) < len(plan):
        raise SystemExit('%s: %d bodies for %d rows' % (tag, len(big), len(plan)))
    big.sort(key=lambda b: (b[0] + b[2]) / 2)
    cy = [(b[0] + b[2]) / 2 for b in big]
    cuts = sorted(sorted(range(1, len(big)), key=lambda i: cy[i] - cy[i - 1])[::-1][:len(plan) - 1])
    groups = [big[i:j] for i, j in zip([0] + cuts, cuts + [len(big)])]
    out = []
    for (row, want), g in zip(plan, groups):
        g = sorted(g, key=lambda b: b[1])
        Y0, Y1, X0, X1 = min(b[0] for b in g), max(b[2] for b in g), min(b[1] for b in g), max(b[3] for b in g)
        xs = numbers_under(a, m0, Y1, X0, X1) if a is not None else []
        if len(xs) == want:                                          # the numbers: each frame's box from midway to its neighbours
            mids = [X0 - 12] + [(p + q) / 2 for p, q in zip(xs, xs[1:])] + [X1 + 12]   # (the outer edges near the bodies: a row's name sits 20 px off)
            out.append((row, [[int(mids[j]), Y0, int(mids[j + 1]), Y1] for j in range(want)], xs))
            continue
        fr = []
        for y0, x0, y1, x1 in g:                                     # a body in two blobs (a staff's far end, a blade): one frame where they overlap in x
            if fr and x0 < fr[-1][2]:
                p = fr[-1]; fr[-1] = [min(p[0], x0), min(p[1], y0), max(p[2], x1), max(p[3], y1)]
            else:
                fr.append([x0, y0, x1, y1])
        while len(fr) > want:                                        # still too many: the two nearest in x are one
            k = min(range(1, len(fr)), key=lambda i: fr[i][0] - fr[i - 1][2])
            p, q = fr[k - 1], fr[k]; fr[k - 1:k + 1] = [[min(p[0], q[0]), min(p[1], q[1]), max(p[2], q[2]), max(p[3], q[3])]]
        if len(fr) != want:
            raise SystemExit('%s %s: %d frames found, %d wanted (%d numbers under it)' % (tag, row, len(fr), want, len(xs)))
        out.append((row, fr, [(b[0] + b[2]) / 2.0 for b in fr]))
    return out


def cut_page(look, L, spec, check=False, log=None):
    """one page -> {row: [(n, RGBA image, box)]}"""
    f, plan, rects, _ = spec
    a = load(f)
    m, _ = figure(a)
    rows = rects if rects is not None else found_rects(m, plan, '%s %s' % (look, L), a)
    rows = [(r[0], r[1], r[2] if len(r) > 2 else [(x0 + x1) / 2.0 for x0, _, x1, _ in r[1]]) for r in rows]   # (row, boxes, the frames' x seeds)
    pad = 4 if rects is not None else 14                             # (a found box is the body's own: the loose tips need more room)
    want = dict(plan)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(lab)
    owner = np.zeros(n + 1, np.int32)                    # each blob to the row whose boxes it overlaps most (0: no box -- lettering, dropped)
    best = np.zeros(n + 1)
    for k, (row, rs, _) in enumerate(rows):
        if len(rs) != want[row]:
            raise SystemExit('%s %s %s: %d boxes, the manifest says %d' % (look, L, row, len(rs), want[row]))
        box = np.zeros(m.shape, bool)
        for x0, y0, x1, y1 in rs:
            box[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad] = True
        ov = ndimage.sum(box & m, lab, np.arange(1, n + 1))
        better = ov > best[1:]
        owner[1:][better] = k + 1
        best[1:][better] = ov[better]
    if True:                                             # a box's margin reaches the numbers under it (the desk's own on ART-73's Idle 1): a number is lettering
        for i, sl in enumerate(objs):
            if not owner[i + 1]:
                continue
            h, w, y1r = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start, max(r[3] for r in rows[owner[i + 1] - 1][1])
            px = a[sl][lab[sl] == i + 1]
            if sl[0].start >= y1r - 12 and 10 <= h <= 40 and w <= 40 and glyph(px):
                owner[i + 1] = 0
    # a letter inside a box (ART-72 H2P3's GetUp box takes the P of GET UP, the desk's cutter took it too): a small kept blob on the line of a dropped
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
        if (np.abs(px - cream).max(-1) < 45).mean() < 0.5 and not glyph(px):
            return False
        for j in range(n):
            u0, v0, u1, v1 = boxes[j]
            if owner[j + 1] or v1 - v0 > 40:                         # (a dropped word of any length: "StaffRelaxedIdle" is one blob by its shadows)
                continue
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
                    log.append('%s %s a letter in a box, dropped: %d px at x %d-%d y %d-%d' % ((look, L, int(size[i])) + (boxes[i][0], boxes[i][2], boxes[i][1], boxes[i][3])))
    if log is not None:                                  # what was dropped inside a row's band, between its first and last frame: a lost piece?
        for i, sl in enumerate(objs):
            if owner[i + 1] or size[i] < 40:
                continue
            cy, cx = (sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2
            for row, rs, sx in rows:
                if min(r[1] for r in rs) <= cy <= max(r[3] for r in rs) and min(sx) - 60 <= cx <= max(sx) + 60:
                    log.append('%s %s dropped inside %s: %d px at x %d-%d y %d-%d' % (look, L, row, int(size[i]), sl[1].start, sl[1].stop, sl[0].start, sl[0].stop))
    out = {}
    over = (a * 0.25).astype(np.uint8) if check else None
    for k, (row, rs, xs) in enumerate(rows):
        mine = np.isin(lab, 1 + np.where(owner[1:] == k + 1)[0])
        g = SR.split_band(mine, xs)
        frs = []
        for j in range(len(rs)):
            keep = g == j + 1
            if not keep.any():
                raise SystemExit('%s %s %s %d: nothing cut' % (look, L, row, j + 1))
            im, box = SR.rgba_crop(a, keep)
            frs.append((j + 1, im, box))
            if check:
                over[keep] = (a[keep] * 0.35 + np.array(SR.HUES[j % len(SR.HUES)]) * 0.65).astype(np.uint8)
        out[row] = frs
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'aurdin', look); os.makedirs(d, exist_ok=True)
        Image.fromarray(over).resize((a.shape[1] // 2, a.shape[0] // 2), Image.BOX).save(os.path.join(d, 'cut-%s.png' % L))
    return out, (min(min(r[1] for r in rs) for _, rs, _ in rows) if L.endswith('P1') and L.startswith('H1') else None)


def turnaround(look, spec, idle_top):
    """H1P1's four stills (Front, Right, Back, Left): {name: (height, filled area)} in page px"""
    a = load(spec[0])
    m, _ = figure(a)
    top = np.zeros_like(m); top[:idle_top - 4, 470:] = m[:idle_top - 4, 470:]   # above the Idle row, right of the portrait (ART-73's stills start above
                                                                                 # where ART-72's words FRONT RIGHT BACK LEFT end: the words go by glyph())
    lab, n = ndimage.label(top, structure=np.ones((3, 3)))
    sz = ndimage.sum(top, lab, range(1, n + 1))
    big = sorted(np.argsort(sz)[::-1][:4] + 1, key=lambda i: ndimage.find_objects(lab == i)[0][1].start)
    out = {}
    for name, i in zip(('Front', 'Right', 'Back', 'Left'), big):
        sl = ndimage.find_objects(lab == i)[0]
        near = np.zeros_like(top)                                    # a stray lock of hair or a boot heel apart from the body: within 12 px of its box
        Y0, Y1, X0, X1 = max(0, sl[0].start - 12), sl[0].stop + 12, max(0, sl[1].start - 12), sl[1].stop + 12
        near[Y0:Y1, X0:X1] = top[Y0:Y1, X0:X1]
        nl, nn = ndimage.label(near, structure=np.ones((3, 3)))
        for j, s2 in enumerate(ndimage.find_objects(nl)):
            pj = a[s2][nl[s2] == j + 1]                              # (a word's letters join by their shadows: by height, not size; its specks too)
            if s2[0].stop <= sl[0].start or (s2[0].stop - s2[0].start <= 40 and (len(pj) < 15 or glyph(pj))):   # (wholly above the still: its word)
                near[s2][nl[s2] == j + 1] = False
        ys = np.where(near.any(1))[0]
        out[name] = (int(ys[-1] - ys[0] + 1), int(near.sum()))
    return out


def area(im):
    return float((np.asarray(im)[..., 3] > 0).sum())


def body(im):
    """the body without what it holds: the filled area opened by 4 px (a staff, a blade, a wand are thinner), and its lowest row (the boots)"""
    b = ndimage.binary_opening(np.asarray(im)[..., 3] > 0, structure=np.ones((3, 3)), iterations=4)
    ys = np.where(b.any(1))[0]
    return float(b.sum()), int(ys[-1]) if len(ys) else np.asarray(im).shape[0] - 1


def all_pages(look, check=False, log=None):
    sp = pages(look)
    cut, idle_top = {}, None
    for L in sorted(sp):
        cut[L], t = cut_page(look, L, sp[L], check, log)
        idle_top = t or idle_top
    if 'R' in cut:                                                   # the relaxed page's rows are its views
        for v in VIEW.values():
            cut['R' + v] = {'Rest': cut['R']['Rest' + v]}
        del cut['R']
    return sp, cut, idle_top


def scales(look, sp, cut, idle_top):
    """page px a game px, every page: the turnaround's Front at HEIGHT, page 1s by sqrt-area against the turnaround, pages 2-4 against page 1,
    a supplement by its first frame's body against its view's base Idle 1's"""
    t = turnaround(look, sp['H1P1'], idle_top)
    kt = t['Front'][0] / float(HEIGHT)
    k = {}
    for h, v in VIEW.items():
        p1 = cut['H%dP1' % h]
        ref = np.mean([t[s][1] for s in TURNVIEW[v]])
        a1 = area(p1['Idle'][0][1])
        k['H%dP1' % h] = kt * np.sqrt(a1 / ref)
        for p, (row, n) in STAND.items():
            k['H%dP%d' % (h, p)] = k['H%dP1' % h] * np.sqrt(area(cut['H%dP%d' % (h, p)][row][n - 1][1]) / a1)
        b1 = body(p1['Idle'][0][1])[0]
        for L in ('S%d' % h, 'W%d' % h, 'R' + v):
            if L in cut:
                first = next(iter(cut[L].values()))[0][1]
                k[L] = k['H%dP1' % h] * np.sqrt(body(first)[0] / b1)
    return k, kt, t


def game_size(img, k):
    w, h = img.size
    return img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')


def core_x(a):
    """x of the body's thick middle (the arms and the staff are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def place(a, x_ref, up, fw, ax, bottom=None):
    """a 1x RGBA array onto an fw x FH frame: x_ref at ax, its `bottom` row (the lowest opaque one by default) `up` px above AY"""
    out = np.zeros((FH, fw, 4), dtype=np.uint8)
    if bottom is None:
        bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


def views(cut, k):
    """{view: {sheet row: [(1x RGBA array, its core x, px above the ground, its boots' row or None)]}}"""
    out = {}
    for h, v in VIEW.items():
        rows = {}
        for L in ['H%dP%d' % (h, p) for p in (1, 2, 3, 4)] + ['S%d' % h, 'W%d' % h, 'R' + v]:
            if L in cut:
                rows.update({r: (frs, k[L], not L.startswith('H')) for r, frs in cut[L].items()})
        out[v] = {}
        for eng, parts in ENGINE.items():
            if parts[0][0] not in rows:
                continue
            seq = []
            for row, which, ground in parts:
                frs, kk, held = rows[row]
                foot = (lambda fr: fr[2][1] + body(fr[1])[1]) if held else (lambda fr: fr[2][3])   # page y of the boots (held: the body's, not the staff's)
                if ground == 'first':
                    floor = foot(frs[0])
                elif ground == 'last':
                    floor = foot(frs[-1])
                for n in (which or [f[0] for f in frs]):
                    fr = frs[n - 1]
                    nm, im, box = fr
                    a = pix.pixelate(game_size(im, kk), 1, do_lift=False)
                    bot = None
                    if held:
                        bot = min(a.shape[0] - 1, int((foot(fr) - box[1]) / kk))
                    if isinstance(ground, tuple):                     # its lowest point on another frame's (Prone 1 on Fall 6), in game px
                        ofr, ok, _ = rows[ground[1]]
                        up = int(round((foot(ofr[0]) - ofr[ground[2] - 1][2][3]) / ok))
                    else:
                        up = int(round((floor - foot(fr)) / kk))
                    seq.append((a, core_x(a), up, bot))
            out[v][eng] = seq
    return out


def build(look, check=False):
    log = []
    sp, cut, idle_top = all_pages(look, check, log)
    for line in log:
        print('  ' + line)
    k, kt, t = scales(look, sp, cut, idle_top)
    hd = views(cut, k)
    frames, sizes, lost = {}, {}, []
    for eng in ENGINE:
        if any(eng not in hd[v] for v in FACING):
            continue
        per = [None] * 8
        for v, fs in FACING.items():
            for f in fs:
                per[f] = hd[v][eng]
        half = max(max(cx, a.shape[1] - cx) for fs in per for a, cx, _, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(64, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, fs in enumerate(per):
            row = []
            for a, cx, up, bot in fs:
                if f in (1, 2, 3):
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, fw // 2, bot)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in ENGINE:                                             # (this cutter's own rows, named here as tools/gnollmatriarch-sheet.py names its cackle)
        if extra not in pix.ANIM_ORDER:
            pix.ANIM_ORDER.append(extra)
    name = LOOKS[look]['sheet']
    pix.write_sheet(name, frames, 64, FH, 32, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row in meta['anims']:
        meta['anims'][row]['fps'] = FPS[row]
        if row in RELEASE:
            meta['anims'][row]['release'] = RELEASE[row]
    meta['source'] = 'drawn by the art desk (%s, %s and its supplements: every row in all five views), cut and snapped by tools/aurdin-sheet.py' % (
        LOOKS[look]['art'], LOOKS[look]['name'])
    json.dump(meta, open(meta_p, 'w'), indent=1)
    return name


def measure(look):
    log = []
    sp, cut, idle_top = all_pages(look, False, log)
    k, kt, t = scales(look, sp, cut, idle_top)
    print('%s: turnaround (page px: height, filled area): %s' % (look, t))
    print('  the turnaround cut at %.3f page px a game px (Front %d page px -> %d)' % (kt, t['Front'][0], HEIGHT))
    for L in sorted(k):
        print('  %-5s %.3f' % (L, k[L]))
    for line in log:
        print('  ' + line)


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings(look):
    """dev/visions/aurdin/<look>/facings-<row>.png: every facing of every row as written, S SW W NW N NE E SE top to bottom, 2x on a grey floor (the
    foot's line drawn); lineup.png: idle frame 1 in all eight facings beside the other three heroes and his LPC sheet (S and E), 4x"""
    name = LOOKS[look]['sheet']
    d = os.path.join(ROOT, 'dev', 'visions', 'aurdin', look); os.makedirs(d, exist_ok=True)
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
    for row in ('idle', 'staffrest', 'staffidle'):
        an = m['anims'].get(row)
        if an:
            for f in (range(8) if row == 'idle' else (0, 7)):
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
    looks = [x for x in args if x in LOOKS] or list(LOOKS)
    for lk in looks:
        if 'measure' in args:
            measure(lk)
        else:
            build(lk, check='check' in args)
            if 'check' in args:
                facings(lk)

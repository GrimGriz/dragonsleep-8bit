"""DEEP16: the Silverton vendors' talking portraits -- the art desk's waist-up dialogue sheets cut for the counter screen (deep16/js/counter.js).
10-21, Griz to the lanes desk: "There's a handful of vendor art in Fresh, start a seat to get Winters set up for giving the starter mission and doing
sales"; of these sheets, 10-20: "Those are for the new silverton buy/sell etc. interfaces".

    python tools/portrait-sheet.py               (every person: deep16/art/pt_<name>.png/.json)
    python tools/portrait-sheet.py winters       (one)
    python tools/portrait-sheet.py check         (also dev/visions/portraits.png, every frame on its anchor, at 2x)

Each person is six source pages, one action a page (the art desk's ART-78 onward, its "Format and scope"): 1 Idle6 (two bands of three), 2-5 the four
dialogue stills -- attentive, welcoming, skeptical, concerned -- one drawing each, 6 Work6 (two bands of three). The pages are read from
deep16/_src/<name>/ART-NN/ (sorted out of Fresh 10-21, deep16/_src/art-desk/vendors-sort-2026-10-21.py).

How a drawing is cut: a pixel is figure when any channel is MASK_D from the page's navy (its median); the drawings are the page's biggest pieces (the
printed titles, numbers and labels are small and fall away); a ledge under the hands -- the counter some pages draw -- is cut off at its top, so every
frame stands on the same line, and the screen draws the counter itself. The art desk's open checks (ART-78-CUTTER-NOTES.md): the stills are drawn bigger
than the idle and the work, so each page is scaled by its own bust -- the head's top to the hands' line, the page's median -- to BUST px; each frame is
placed by its head's middle (x) and the hands' line (y), so a bow of the head stays a bow. Then boxed down (alpha-premultiplied), snapped to
deep16/palette.json and outlined (tools/pixelate.py).

The sheet: one row an action (idle, attentive, welcoming, skeptical, concerned, work), frames left to right, every frame the same box; `ax`, `ay` the
anchor in the box (the head's middle, the hands' line). Not the grid's figure sheets (eight facings): js/counter.js draws these itself.
"""
import os, sys, json, glob
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SRC = pix.SRC                     # (_src is not in git: a worktree reads the main checkout's)
ART = os.path.join(ROOT, 'deep16', 'art')

BUST = 150                        # px from the head's top to the hands' line at game size (the screen is 480 x 270)
MASK_D = 22                       # how far from the navy a channel must be to be figure
ACTIONS = ['idle', 'attentive', 'welcoming', 'skeptical', 'concerned', 'work']   # (the default six; a layout may name its own: Sylvia's)
FPS = {'idle': 3, 'work': 4, 'stretch': 4}   # (the idle a slow breath and blink; the work a deliberate unwrap)
# a person's pages: (page, its bands' counts top to bottom, each drawing's action in reading order) -- the art desk's six-page plan by default
LAYOUT = [(1, [3, 3], ['idle'] * 6), (2, [1], ['attentive']), (3, [1], ['welcoming']), (4, [1], ['skeptical']), (5, [1], ['concerned']), (6, [3, 3], ['work'] * 6)]
# name: (pages' folder, ART id, the keeper's door in deep16/js/town.js, overrides). The art desk's numbers -- ART-78 to ART-81 are also its own
# four heroes' 8-bit makeovers (received-2026-10-20-ART-77/desk-updates): flagged in the ENGINE-RETURN, not renumbered here
PEOPLE = {
    # Sylvia Swann's own two pages (the visible-owl final, 10-16): page 1 her idle, four stills (welcoming, amused, concerned, startled) and her
    # divining (played as her work), page 2 the owl's stretch -- the owl and the divining's glow kept with her (ART-SYLVIA-CUTTER-NOTES-v2.md)
    'sylvia': ('sylvia/ART-SYLVIA', 'ART-SPECIAL-SYLVIA', 'keeper:sylvia', {'pat': '%s_HEAD-1_PAGE-%d-v2.png', 'layout': [
        (1, [6, 4, 6], ['idle'] * 6 + ['welcoming', 'amused', 'concerned', 'startled'] + ['work'] * 6), (2, [3], ['stretch'] * 3)]}),
    'winters': ('winters/ART-78', 'ART-78', 'warp:winters', {'blank': {6: [(0, 0, 420, 29)]}}),
    'casper': ('casper/ART-79', 'ART-79', 'keeper:casper', {}),
    'androit': ('androit/ART-80', 'ART-80', 'keeper:androit', {}),
    'hessle': ('hessle/ART-81', 'ART-81', 'keeper:hessle', {}),
    'aldric': ('aldric/ART-82', 'ART-82', 'keeper:aldric', {}),
    'kessler': ('kessler/ART-83', 'ART-83', 'shop:kessler', {}),
    'calla': ('calla/ART-84', 'ART-84', 'shop:calla', {}),
    'barber': ('barber/ART-85', 'ART-85', 'keeper:barber', {}),
}


def page_path(folder, art, n, pat='%s_HEAD-1_PAGE-%d.png'):
    fs = glob.glob(os.path.join(SRC, folder, pat % (art, n)))
    if not fs:
        raise SystemExit('no page %d in %s' % (n, os.path.join(SRC, folder)))
    return fs[0]


def drawings(a, bands, mask_d=MASK_D):
    """the page's drawings, `bands` of them a band, each (mask of it over the page, its box), read in order: top band first, left to right. A pixel is figure
    when a channel is mask_d from the navy, or half that and touching one that is (a dark coat's shadows against the navy: Winters'); a drawing
    is its biggest piece and the pieces beside it (a sleeve the mask parted from the body: Casper's); a printed word or number is small and short"""
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    d = np.abs(a - navy).max(-1)
    strong = ndimage.binary_opening(d > mask_d, structure=np.ones((3, 3)))
    weak = ndimage.binary_opening(d > mask_d / 2.0, structure=np.ones((3, 3)))
    # the printed words and numbers out first, so the weak mask cannot join a title to a head (Winters' ACQUISITION, Casper's big "4"):
    # small, light pieces of the strong mask
    ls, ns = ndimage.label(strong, structure=np.ones((3, 3)))
    if ns:
        ssz = ndimage.sum(strong, ls, range(1, ns + 1)); lum = ndimage.median(a.mean(-1), ls, range(1, ns + 1))
        txt = np.isin(ls, 1 + np.where((ssz < 2500) & (np.asarray(lum) > 90))[0])
        txt = ndimage.binary_dilation(txt, iterations=4)
        strong &= ~txt; weak &= ~txt
    lw, nw = ndimage.label(weak, structure=np.ones((3, 3)))
    hit = np.unique(lw[strong]); hit = hit[hit > 0]
    m = np.isin(lw, hit) & weak
    want = sum(bands)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(lab)
    sz = ndimage.sum(m, lab, range(1, n + 1))
    groups = []                                                 # [ [labels], box ]
    near = lambda b, c, g: b[0] <= c[2] + g and c[0] <= b[2] + g and b[1] <= c[3] + g and c[1] <= b[3] + g
    for i in np.argsort(-sz):
        sl = objs[i]; b = (sl[1].start, sl[0].start, sl[1].stop, sl[0].stop)
        if sz[i] < 800 or b[3] - b[1] < 40:
            continue                                            # (a letter, a number, a speck)
        g = [q for q in groups if near(q[1], b, 12)]
        if g:
            q = g[0]; q[0].append(i + 1); q[1] = (min(q[1][0], b[0]), min(q[1][1], b[1]), max(q[1][2], b[2]), max(q[1][3], b[3]))
        elif len(groups) < want:
            groups.append([[i + 1], b])
    out = []
    for labs, b in groups:
        piece = ndimage.binary_fill_holes(np.isin(lab, labs))
        out.append((piece, b))
    out.sort(key=lambda p: (p[1][1] + p[1][3]) / 2.0)
    rows, k = [], 0
    for n in bands:
        rows += sorted(out[k:k + n], key=lambda p: p[1][0]); k += n
    return rows


def ledge_top(piece, box):
    """the top row of a counter drawn under the hands -- a run of rows at the piece's foot whose ends stand within 3 px of its widest foot row,
    wider than the figure above it -- or the piece's foot if there is none (a coat's hem is as wide as the coat)"""
    x0, y0, x1, y1 = box
    rows = []
    for y in range(y1 - 1, y0 - 1, -1):
        xs = np.where(piece[y, x0:x1])[0]
        rows.append((y, xs.min() + x0, xs.max() + x0) if len(xs) else (y, None, None))
    foot = [r for r in rows[:6] if r[1] is not None]
    if not foot:
        return y1
    _, l0, r0 = max(foot, key=lambda r: r[2] - r[1])
    k = 0
    while k < len(rows) and k < 6 and (rows[k][1] is None or abs(rows[k][1] - l0) > 3 or abs(rows[k][2] - r0) > 3):
        k += 1                                                  # (the foot's soft last rows)
    run = 0
    while k + run < len(rows) and rows[k + run][1] is not None and abs(rows[k + run][1] - l0) <= 3 and abs(rows[k + run][2] - r0) <= 3:
        run += 1
    if run < 4 or k + run > (y1 - y0) * 0.15:
        return y1
    above = [r - l for y, l, r in rows[k + run:k + run + 30] if l is not None]
    if not above or (r0 - l0) < max(above) + 6:
        return y1
    return rows[k + run - 1][0]


def cut_person(name):
    folder, art, door, ov = PEOPLE[name]
    raw, order = {}, []                                          # action -> [(rgba crop at source size, anchor x, anchor y, bust, ledge)]
    for pg, bands, acts in ov.get('layout', LAYOUT):
        a = np.asarray(Image.open(page_path(folder, art, pg, ov.get('pat', '%s_HEAD-1_PAGE-%d.png'))).convert('RGB')).astype(np.int32)
        for bx0, by0, bx1, by1 in ov.get('blank', {}).get(pg, []):
            a[by0:by1, bx0:bx1] = np.median(a.reshape(-1, 3)[::97], axis=0)   # (a printed title touching a head: Winters' ACQUISITION)
        found = [(piece, box, ledge_top(piece, box)) for piece, box in drawings(a, bands, ov.get('mask_d', MASK_D))]
        if len(found) != len(acts):
            raise SystemExit('%s page %d: %d drawings found, %d wanted' % (name, pg, len(found), len(acts)))
        cut = [b[3] - f for p, b, f in found if f < b[3]]
        for i, (piece, box, foot) in enumerate(found):     # (the page's counter is one counter: a frame whose foot is as wide as its counter
            if cut and foot >= box[3]:                       # frames' but whose run was broken -- a hand over its edge -- is cut at their depth)
                x0, y0, x1, y1 = box
                wid = [np.count_nonzero(piece[y, x0:x1]) for y in range(y1 - int((y1 - y0) * 0.25), y1)]
                if max(wid[-6:]) >= 0.97 * max(wid):
                    found[i] = (piece, box, y1 - int(np.median(cut)))
        for (piece, box, foot), act in zip(found, acts):
            x0, y0, x1, y1 = box
            keep = piece.copy(); keep[foot:, :] = False
            if foot < y1:                                        # (the counter's top edge left in slivers over the cut: anything there under 5 px tall goes)
                band = keep[foot - 8:foot]; keep[foot - 8:foot] = band & ndimage.binary_opening(keep, structure=np.ones((5, 1)))[foot - 8:foot]
            ys, xs = np.where(keep)
            top = ys.min()
            bust = foot - top
            head = keep[top:top + int(bust * 0.22)]
            hx = np.where(head)[1].mean()
            cx0, cx1 = xs.min(), xs.max() + 1
            rgba = np.zeros((foot - top, cx1 - cx0, 4), np.uint8)
            rgba[..., :3] = a[top:foot, cx0:cx1]
            rgba[..., 3] = keep[top:foot, cx0:cx1] * 255
            if act not in raw:
                raw[act] = []; order.append(act)
            raw[act].append((rgba, hx - cx0, foot - top, bust, foot < y1))
    # each page by its own bust (the stills are drawn bigger): the page's median to BUST
    small = {}
    for act, fr in raw.items():
        k = BUST / float(np.median([f[3] for f in fr]))
        out = []
        for rgba, ax, ay, bust, ledge in fr:
            im = Image.fromarray(rgba, 'RGBA').convert('RGBa')
            w, h = max(1, round(rgba.shape[1] * k)), max(1, round(rgba.shape[0] * k))
            im = im.resize((w, h), Image.BOX).convert('RGBA')
            px = pix.pixelate(im, 1, do_lift=False)
            out.append((px, ax * k, ay * k, ledge))
        small[act] = out
    # one box for every frame, round the anchor
    L = max(f[1] for fr in small.values() for f in fr) + 2; R = max(f[0].shape[1] - f[1] for fr in small.values() for f in fr) + 2
    T = max(f[2] for fr in small.values() for f in fr) + 2; B = 2
    fw, fh, axx, ayy = int(np.ceil(L + R)), int(np.ceil(T + B)), int(round(L)), int(round(T))
    rows = len(order); cols = max(len(small[a]) for a in order)
    sheet = np.zeros((rows * fh, cols * fw, 4), np.uint8)
    meta = {'image': 'art/pt_%s.png' % name, 'fw': fw, 'fh': fh, 'ax': axx, 'ay': ayy, 'top': ayy, 'portrait': True, 'anims': {}, 'art': art, 'door': door,
            'source': 'deep16/_src/%s (the art desk\'s %s, sorted out of Fresh 10-21), cut by tools/portrait-sheet.py' % (folder, art)}
    for r, act in enumerate(order):
        for i, (px, ax, ay, ledge) in enumerate(small[act]):
            ox, oy = int(round(axx - ax)), int(round(ayy - ay))
            h, w = px.shape[:2]
            ys0, xs0 = max(0, oy), max(0, ox)
            sub = px[ys0 - oy:min(h, fh - oy), xs0 - ox:min(w, fw - ox)]
            dst = sheet[r * fh + ys0:r * fh + ys0 + sub.shape[0], i * fw + xs0:i * fw + xs0 + sub.shape[1]]
            on = sub[..., 3] > 0
            dst[on] = sub[on]
        meta['anims'][act] = {'y': r * fh, 'fw': fw, 'fh': fh, 'ax': axx, 'ay': ayy, 'frames': len(small[act]), 'fps': FPS.get(act, 1), 'ledge': [bool(f[3]) for f in small[act]]}
    os.makedirs(ART, exist_ok=True)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, 'pt_%s.png' % name), optimize=True)
    json.dump(meta, open(os.path.join(ART, 'pt_%s.json' % name), 'w'), indent=1)
    print('  pt_%s: %dx%d a frame, %s' % (name, fw, fh, ', '.join('%s %d%s' % (a, len(small[a]), ' (ledge cut %d)' % sum(f[3] for f in small[a]) if any(f[3] for f in small[a]) else '') for a in order)))
    return sheet, meta


if __name__ == '__main__':
    args = [x for x in sys.argv[1:] if x != 'check']
    names = args or list(PEOPLE)
    outs = [cut_person(nm) for nm in names]
    if 'check' in sys.argv[1:]:
        W = max(s.shape[1] for s, m in outs); H = sum(s.shape[0] + 6 for s, m in outs)
        cv = np.zeros((H, W, 3), np.uint8); cv[...] = (40, 46, 70); y = 0
        for s, m in outs:
            for r in range(len(m['anims'])):                       # the hands' line drawn under each row: every frame should sit on it
                cv[y + r * m['fh'] + m['ay'], :s.shape[1]] = (120, 80, 50)
            al = s[..., 3:4] / 255.0; sl = cv[y:y + s.shape[0], :s.shape[1]]; sl[...] = (s[..., :3] * al + sl * (1 - al)).astype(np.uint8)
            y += s.shape[0] + 6
        d = os.path.join(ROOT, 'dev', 'visions'); os.makedirs(d, exist_ok=True)
        Image.fromarray(cv).resize((W * 2, H * 2), Image.NEAREST).save(os.path.join(d, 'portraits.png'))
        print('  dev/visions/portraits.png')

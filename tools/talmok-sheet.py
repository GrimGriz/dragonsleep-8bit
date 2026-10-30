"""DEEP16 pipeline 2 (generated art): Talmok, the Hex's champion, in his new look -> talmok_p2, his fight sheet in all eight facings.

    python tools/talmok-sheet.py            (writes deep16/art/talmok_p2.png/.json)
    python tools/talmok-sheet.py check      (also dev/visions/talmok/: every row of every facing at 2x, and the lineup beside the old talmok_p1)

His look, the art desk's (10-29): ART-123-TALMOK HEAD 2, five town pages (S, SE, E, NE, N, Idle 4 each; sorted into deep16/_src/talmok/ART-123-TALMOK/
by _src/art-desk/art123-talmok-b-sort-2026-10-29.py), held uncut till his fight poses came -- the lanes desk's call, a new idle beside the old
walk and fists would change his look between standing and moving. His fight poses: art-wanted section 31, on Griz's "2 - request for combat poses
in outbox please"; the art desk's ART-123-TALMOK-COMBAT (10-30, Griz: "talmok attempts dropped"), sorted into deep16/_src/talmok/ART-123-TALMOK-COMBAT/
by _src/art-desk/art123-talmok-combat-sort-2026-10-30.py, its papers in _src/art-desk/received-2026-10-30-ART-123-TALMOK-COMBAT/. One action and one
view a page: HEAD 1 S, 2 SE, 3 E, 4 NE (from behind), 5 N; PAGE 1 Walk 8 (two bands of four), 2 Pit Fists 6 (two of three), 3 Flinch 4, 4 Fall 4,
5 Prone 1, 6 Sit 2. The art desk's own word on them, its README: "PARTIAL / REVIEW CANDIDATES" -- every Walk UNRESOLVED-GAIT (a leg repeats: no
two alternating half-strides), the N Fall and Prone UNRESOLVED-NORTH-AXIS (he falls toward the top-right, as from the NE), the rest review
candidates with drift. The old KayKit sheet he wore, talmok_p1 (idle, walk, attack, sit), is kept as it was, beside this one.

Rows (the engine's names): idle <- the town page's Idle 4 (SEQ, as the town's keepers: tools/keeper-town-sheet.py); walk <- built (WALKS, below);
attack <- Pit Fists 6 (the cross on 3 lands: `release` 2); flinch <- Flinch 4; hurt <- Fall 4 (he goes down);
prone <- Fall 2-4 then Prone 1 (where he lies while prone: js/sprites.js S.proneRow); sit <- Sit 2. Facings (RULED 10-14): S, SE, E, NE, N as drawn,
SW, W, NW their mirrors.

How a page is cut: its drawings found as tools/portrait-sheet.py finds them (the navy by the page's edges, the printed numbers and labels dropped as
small light text, a drawing its biggest piece and those beside it), in reading order, and checked against the art desk's own review windows (its
MANIFEST.json `review_windows`): as many as it says, each drawing's middle in its own window. The scale: he stands TALL px sole to crown, as talmok_p1 did (its `top`, 57, the art desk's
"about 57 pixels"); the town pages each by their own four drawings' median (keeper-town-sheet's page()); a fight page by its standing frames
(the walk's eight, the fists' ease, the flinch's two at ease, the fall's first), the Sit by his head's width against the town page's at game size
(head_w: the old sheet's KayKit man is a chibi, his head half his height, so his sit is no measure; the art desk drew every Sit about 1.28x the idle,
and `check` prints the head's scale beside every page's), the Prone by its length against the Fall's last frame at the Fall page's scale. The ground:
a standing frame on its feet's middle, a frame on the ground (the fall's last three, the prone, the sit) on its own middle, every frame on its own
lowest pixel. The feet's middle is the midpoint of the two boots (feet_mid), not of the last rows: in the SE and E views one boot stands lower.

THE WALK, built (10-30, Griz to the lanes desk, of the art desk's walks that repeat a leg: "have the cutter hack legs off of other poses and build the
best walk it can"; the old 3D walk stays out). Each of the eight frames of each drawn view is an upper body and a pair of legs, joined at the tunic's
hem (hem(): the lowest rows of its blue, and its pale trim under them) at game size before the snap, so the outline is drawn round the whole: the
legs' hip (the trousers' top, their middle) under the body's, his hands that hang past the hem kept from the body's frame (hands(): skin that runs
down from above the hem, and its drawn outline) and the legs' frame's own hands left out, a hole one leaves over the thigh filled (legs_of()). WALKS names each frame's two sources: a frame of one of his rows in that view
(W walk, P Pit Fists, F flinch, I the town idle), and `m` for legs mirrored about their hip. S and N, where boots and trousers read the same from
either side: the walk's 1-4 as drawn, then 5-8 their own drawn bodies on 1-4's legs mirrored -- the other leg leads. SE, E and NE, where a mirror would
turn the feet: the walk's stride (the near foot forward), legs together (the idle's, or the walk's own narrowest), then a stride with the other foot
forward taken off the fists' stance (SE, E) or the flinch's half step (NE), and together again. Each frame on its own lowest pixel, so he bobs.
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
PS = _load('portraitsheet', os.path.join(ROOT, 'tools', 'portrait-sheet.py'))
KT = _load('keepertown', os.path.join(ROOT, 'tools', 'keeper-town-sheet.py'))
SRC = pix.SRC                     # (_src is not in git: a worktree reads the main checkout's)
ART = os.path.join(ROOT, 'deep16', 'art')
NAME = 'talmok_p2'
OLD = 'talmok_p1'

TALL = 57                         # sole to crown, as talmok_p1 stood (its `top`); the outline falls inside the crop, as keeper-town-sheet's TALL
COMBAT = os.path.join(SRC, 'talmok', 'ART-123-TALMOK-COMBAT', 'ART-123-TALMOK-COMBAT_HEAD-%d_PAGE-%d.png')
TOWN = os.path.join(SRC, 'talmok', 'ART-123-TALMOK', 'ART-123-TALMOK_HEAD-2_PAGE-%d.png')
RECV = os.path.join(SRC, 'art-desk', 'received-2026-10-30-ART-123-TALMOK-COMBAT')
HEADS = {1: 0, 2: 7, 3: 6, 4: 5, 5: 4}        # the art desk's HEAD -> the sheet's facing (S SW W NW N NE E SE)
TOWNPG = {1: 0, 2: 7, 3: 6, 4: 5, 5: 4}       # the town pages: PAGE 1 S, 2 SE, 3 E, 4 NE, 5 N
MIRROR = {1: 7, 2: 6, 3: 5}                   # SW, W, NW: SE, E, NE mirrored
# page: (the action, its bands, the frames it stands in -- the scale's -- or how it is scaled)
PAGES = {1: ('Walk', [4, 4], 'all'), 2: ('Pit Fists', [3, 3], [5]), 3: ('Flinch', [4], [0, 3]), 4: ('Fall', [4], [0]), 5: ('Prone', [1], 'prone'), 6: ('Sit', [2], 'sit')}
GROUND = {('Fall', 1), ('Fall', 2), ('Fall', 3), ('Prone', 0), ('Sit', 0), ('Sit', 1)}   # (frames on the ground: placed on their own middle, not their feet's)
GAP = {(5, 4): 6}                             # (a page whose drawings stand closer than 12 px: the N Fall's 3 and 4, 10 apart)
SEQ = KT.SEQ                                  # (the town's held loop of the four: relaxed and breath three times, the blink, the return)
WALK = 'built'                                # 'built': WALKS, his legs off his other poses; 'drawn': the art desk's walks as they are; 'old': the old sheet's under (js/sprites.js frameOf)
AVOID = ['red', 'fire', 'violet']             # (ramps the snap leaves out -- tools/pixelate.py snap: the skin's shadows flecked the reds, its highlights the fire, after the tone;
                                              # the tunic's shaded underside the violet -- nothing he wears is violet)
WARM, SKIN = 35, (15, 25)                     # the warm hues toned (skin, leather, beard; the pale-gold hair above them kept), and the skin's band they are measured by
ROWS = [('idle', 4), ('walk', 10), ('attack', 12), ('hurt', 8), ('sit', 2), ('flinch', 12), ('prone', 8)]   # (the order on the sheet, and each row's fps)


def manifests():
    out = {}
    for sub in ('front-side', 'rear'):
        for e in json.load(open(os.path.join(RECV, sub, 'MANIFEST.json'), encoding='utf-8-sig')):
            out[(e['head'], e['page'])] = e
    return out


def skin_sat(a, m):
    """the skin's mean saturation on a page: the figure's pixels in the SKIN hues"""
    h, sa, v = PS.hsv(a)
    sel = m & (h >= SKIN[0]) & (h < SKIN[1]) & (sa > 0.25)
    return float(sa[sel].mean())


def tone(a, m, ref):
    """the page's warm hues drawn to the south town page's skin saturation (ref): each channel toward the brightest by one k, so the hue and the value
    stay (keeper-town-sheet's sat_band) -- the fight pages and the town's other views are drawn warmer, and their skin snapped to the fire ramp"""
    k = ref / skin_sat(a, m)
    h, sa, v = PS.hsv(a)
    w = m & (h < WARM) & (sa > 0.2)
    out = a.astype(float); mx = out.max(-1, keepdims=True)
    out = np.where(w[..., None], mx - (mx - out) * k, out)
    return np.clip(np.round(out), 0, 255).astype(a.dtype), k


def drawn(path, bands, gap=12):
    """a page and its drawings (in reading order), the page's warm hues toned (tone)"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
    found = PS.drawings(a, bands, edge=True, gap=gap)
    m = np.zeros(a.shape[:2], bool)
    for p, b in found:
        m |= p
    a, k = tone(a, m, REF_SAT)
    return a, found, k


def feet_mid(piece, t, b, l):
    """the feet's middle: the two biggest pieces in the drawing's bottom 15% (its boots), the midpoint of their own middles -- in the SE and E views
    only the lower boot reaches the last rows, so a middle of those rows stood him on one foot, a different one row to row; one piece, its middle"""
    band = piece[b - max(4, int(0.15 * (b - t))):b]
    lb, n = ndimage.label(band)
    if n >= 2:
        sz = ndimage.sum(band, lb, range(1, n + 1)); o = np.argsort(-sz)
        if sz[o[1]] >= 0.25 * sz[o[0]]:
            return float(np.mean([np.where(lb == 1 + k)[1].mean() for k in o[:2]])) - l
    return float(np.where(band)[1].mean()) - l


def frames_of(a, found):
    """[(rgba at source size, the feet's middle x, its middle x, height)] -- each drawing cropped, the alpha its mask"""
    out = []
    for piece, box in found:
        ys, xs = np.where(piece)
        t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = np.zeros((b - t, r - l, 4), np.uint8)
        rgba[..., :3] = a[t:b, l:r]; rgba[..., 3] = piece[t:b, l:r] * 255
        out.append((rgba, feet_mid(piece, t, b, l), xs.mean() - l, b - t))
    return out


def page_frames(head, pg, ent):
    """one fight page's drawings, checked against the art desk's review windows: [(rgba at source size, the feet's middle x, its middle x, height)], and the tone's k"""
    act, bands, _ = PAGES[pg]
    wins = ent['review_windows']
    if len(wins) != sum(bands) or ent['n'] != sum(bands):
        raise SystemExit('HEAD %d PAGE %d: %d windows, manifest n %d, %d wanted' % (head, pg, len(wins), ent['n'], sum(bands)))
    a, found, k = drawn(COMBAT % (head, pg), bands, GAP.get((head, pg), 12))   # (the whole page's, in reading order; a window can clip a reach -- S Pit Fists 4's)
    if len(found) != len(wins):
        raise SystemExit('HEAD %d PAGE %d: %d drawings found, %d wanted' % (head, pg, len(found), len(wins)))
    for i, ((piece, box), (x0, y0, x1, y1)) in enumerate(zip(found, wins)):
        cx, cy = (box[0] + box[2]) / 2.0, (box[1] + box[3]) / 2.0
        if not (x0 <= cx < x1 and y0 <= cy < y1):
            raise SystemExit('HEAD %d PAGE %d frame %d: its middle is not in the art desk\'s window for it' % (head, pg, i + 1))
    return frames_of(a, found), k


def head_w(mask, H):
    """the head's width: the median of the drawing's widths from 6% to 13% of a standing height H under its crown (below the hair's spikes, above the
    beard's end and the shoulders) -- the measure a sat or crouched drawing keeps"""
    ys = np.where(mask.any(1))[0]
    w = [np.ptp(np.where(mask[y])[0]) + 1 for y in range(ys[0] + int(0.06 * H), ys[0] + max(int(0.13 * H), int(0.06 * H) + 1))]
    return float(np.median(w))


def town_head(found):
    """the town page's drawings at source size: their median height, and their heads' median width"""
    hs = [np.ptp(np.where(p.any(1))[0]) + 1 for p, b in found]
    return float(np.median(hs)), float(np.median([head_w(p, np.median(hs)) for p, b in found]))


def page_head(fr, idx, k0, hw_game):
    """a fight page's scale by its heads: the frames idx's head widths to the idle's in game px (hw_game), the standing height under each crown found
    by the scale itself (from k0, a few rounds)"""
    k = k0
    for _ in range(6):
        k = hw_game / float(np.median([head_w(fr[i][0][..., 3] > 0, TALL / k) for i in idx]))
    return k


def shrink(rgba, k):
    """a drawing boxed down to game size (alpha-premultiplied), not yet snapped: RGBA uint8"""
    im = Image.fromarray(rgba, 'RGBA').convert('RGBa')
    return np.asarray(im.resize((max(1, round(rgba.shape[1] * k)), max(1, round(rgba.shape[0] * k))), Image.BOX).convert('RGBA')).copy()


def pixel(small):
    """snapped to the 64 and outlined (tools/pixelate.py)"""
    return pix.pixelate(Image.fromarray(small, 'RGBA'), 1, do_lift=False, avoid=AVOID)


def snap(rgba, k):
    return pixel(shrink(rgba, k))


# the walk, built: facing -> its eight frames, each (the body's frame, the legs' frame[, 'm' the legs mirrored]); a frame is (row, index), the rows
# W walk, P Pit Fists, F flinch, I the town idle's four drawings -- the order a stride, its follow-through, legs together twice, the other stride
WALKS = {
    0: [('W0', 'W0'), ('W1', 'W1'), ('W2', 'W2'), ('W3', 'W3'), ('W4', 'W0', 'm'), ('W5', 'W1', 'm'), ('W6', 'W2', 'm'), ('W7', 'W3', 'm')],   # S
    4: [('W0', 'W0'), ('W1', 'W1'), ('W2', 'W2'), ('W3', 'W3'), ('W4', 'W0', 'm'), ('W5', 'W1', 'm'), ('W6', 'W2', 'm'), ('W7', 'W3', 'm')],   # N
    7: [('W0', 'W0'), ('W3', 'W3'), ('W1', 'I0'), ('W2', 'I1'), ('W4', 'P0'), ('W5', 'P4'), ('W6', 'I0'), ('W7', 'I1')],                       # SE
    6: [('W3', 'W3'), ('W4', 'W4'), ('W2', 'W2'), ('W6', 'W6'), ('W5', 'P0'), ('W7', 'P4'), ('W0', 'W2'), ('W1', 'W6')],                       # E
    5: [('W0', 'W0'), ('W3', 'W3'), ('W1', 'I0'), ('W2', 'I1'), ('W4', 'F1'), ('W5', 'F2'), ('W6', 'I0'), ('W7', 'I1')],                       # NE
}
ROWKEY = {'W': 'Walk', 'P': 'Pit Fists', 'F': 'Flinch', 'I': 'Idle'}


def blue_of(small):
    on = small[..., 3] >= 128
    h, sa, v = PS.hsv(small[..., :3].astype(np.int32))
    return on & (h >= 200) & (h <= 250) & (sa > 0.35) & (v > 0.2)


def hem(small):
    """the tunic's hem at game size: the last row of its blue -- the blue pieces that start above 70% of his height (the SE walk's painted ground shadow
    is a blue piece of its own, under the boots) -- and of the pale trim just under it"""
    on = small[..., 3] >= 128
    h, sa, v = PS.hsv(small[..., :3].astype(np.int32))
    lb, n = ndimage.label(blue_of(small), structure=np.ones((3, 3)))
    tops = [sl[0].start for sl in ndimage.find_objects(lb)]
    tunic = np.isin(lb, [i + 1 for i, t in enumerate(tops) if t < 0.7 * small.shape[0]])   # (every blue piece that starts above his knees: the belt parts the tunic)
    c = int(np.where(tunic.any(1))[0].max())
    pale = on & (v > 0.6) & (sa < 0.4)
    for y in (c + 1, c + 2):
        if y < small.shape[0] and pale[y].sum() >= 2:
            c = y
    return c


def skin_of(small):
    on = small[..., 3] >= 128
    h, sa, v = PS.hsv(small[..., :3].astype(np.int32))
    return on & (h >= 5) & (h <= 40) & (sa > 0.2) & (v > 0.5), on & (v < 0.25)


def hands(small, c):
    """his hands where they hang past the hem: skin that runs down from above it (8-connected), in the rows just under it, and their drawn outline"""
    skin, dark = skin_of(small)
    lb, n = ndimage.label(skin, structure=np.ones((3, 3)))
    above = set(np.unique(lb[:c + 1][skin[:c + 1]]))
    m = np.isin(lb, list(above - {0}))
    m[:c + 1] = False; m[c + 8:] = False
    m |= ndimage.binary_dilation(m, structure=np.ones((3, 3))) & dark
    m[:c + 1] = False
    return m


def legs_of(small, c):
    """the legs under the hem: the frame there less its own hands (hands()) and any blue (the SE walk's painted ground shadow), less the islands of
    under 6 px a hand's outline leaves; and the holes a hand over the thigh leaves, to be filled"""
    on = small[..., 3] >= 128
    K = on & ~blue_of(small) & ~hands(small, c); K[:c + 1] = False
    lb, n = ndimage.label(K, structure=np.ones((3, 3)))
    if n:
        sz = ndimage.sum(K, lb, range(1, n + 1))
        K &= np.isin(lb, 1 + np.where(sz >= 6)[0])
    holes = ndimage.binary_fill_holes(K) & ~K
    return K, holes


def hip(small, c, drop):
    """the legs' hip: the middle of the trousers' top, three rows under the hem (his hands left out)"""
    band = (small[c + 1:c + 4, :, 3] >= 128) & ~drop[c + 1:c + 4]
    return float(np.where(band)[1].mean())


def compose(body, legs, mirror=False):
    """one frame of the built walk: `body`'s rows down to its hem, its hands under it; `legs`' rows under its own hem, their hip under the body's"""
    cb, cl = hem(body), hem(legs)
    hb, (keep, holes) = hands(body, cb), legs_of(legs, cl)
    L = legs.copy(); L[~keep] = 0
    if holes.any():                                                     # (a hand over the thigh: its hole the trousers' colour round it)
        lb, n = ndimage.label(holes, structure=np.ones((3, 3)))
        for i in range(1, n + 1):
            hm = lb == i; ring = ndimage.binary_dilation(hm, iterations=2) & keep
            L[hm] = np.median(legs[ring], axis=0).astype(np.uint8) if ring.any() else 0
    low = L[cl + 1:]
    xl = hip(legs, cl, ~keep)
    if mirror:
        low = low[:, ::-1]; xl = legs.shape[1] - 1 - xl
    xb = hip(body, cb, hb)
    dx = int(round(xb - xl))
    W = max(body.shape[1], low.shape[1] + abs(dx)) + 2 * abs(dx) + 4
    ox = abs(dx) + 2                                                # (the body's left edge on the new canvas)
    out = np.zeros((cb + 1 + low.shape[0], W, 4), np.uint8)
    out[:cb + 1, ox:ox + body.shape[1]] = body[:cb + 1]
    lx = ox + dx
    seg = out[cb + 1:, lx:lx + low.shape[1]]
    on = low[..., 3] > 0
    seg[on] = low[on]
    hy, hx = np.where(hb)
    keep = (hy + 0 < out.shape[0])
    out[hy[keep], ox + hx[keep]] = body[hy[keep], hx[keep]]         # (his hands over the legs)
    ys, xs = np.where(out[..., 3] > 0)
    return out[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy()


def cut():
    global REF_SAT
    man = manifests()
    a1 = np.asarray(Image.open(TOWN % 1).convert('RGB')).astype(np.int32); m1 = np.zeros(a1.shape[:2], bool)
    for p, b in PS.drawings(a1, [4], edge=True):
        m1 |= p
    REF_SAT = skin_sat(a1, m1)                                    # (the south town page's skin: the look every page is toned to)
    faces = {}                                                    # facing -> {action: [(px, x on the anchor, foot row)]}
    report = []
    for head, f in HEADS.items():
        faces[f] = {}
        # the idle: the town page of this view, by keeper-town-sheet's page() (its four drawings, their median to TALL)
        tp = [p for p, g in TOWNPG.items() if g == f][0]
        a, found, kt = drawn(TOWN % tp, [4])
        if len(found) != 4:
            raise SystemExit('town page %d: %d drawings found, 4 wanted' % (tp, len(found)))
        th, thw = town_head(found); hw_game = thw * TALL / th        # (his head's width at game size, by the town page's own scale)
        k = TALL / th                                             # (the town page by its own four drawings' median, as keeper-town-sheet's page())
        faces[f]['Idle'] = [(sm, fx * k + 1, sm.shape[0]) for sm, fx in [(shrink(q[0], k), q[1]) for q in frames_of(a, found)]]
        report.append('town P%d     k %.4f  tone %.3f' % (tp, k, kt))
        fall_k = fall_last = None
        for pg in sorted(PAGES):
            act, bands, how = PAGES[pg]
            fr, kt = page_frames(head, pg, man[(head, pg)])
            idx = list(range(len(fr))) if how in ('all', 'sit') else how if isinstance(how, list) else None
            kh = page_head(fr, idx, TALL / float(np.median([fr[i][3] for i in idx])), hw_game) if idx else None
            if how == 'all' or isinstance(how, list):
                k = TALL / float(np.median([fr[i][3] for i in idx]))
            elif how == 'sit':
                k = kh                                            # (sat: by his head, the town page's at game size -- the art desk drew every Sit about 1.28x the idle)
            elif how == 'prone':
                k = fall_k * fall_last / float(fr[0][0].shape[1])
            if act == 'Fall':
                fall_k, fall_last = k, fr[-1][0].shape[1]
            row = []
            for i, (rgba, fx, mx, h) in enumerate(fr):
                sm = shrink(rgba, k)
                x = (mx if (act, i) in GROUND else fx) * k + 1
                row.append((sm, x, sm.shape[0]))
            faces[f][act] = row
            report.append('H%d %-9s k %.4f  tone %.3f%s' % (head, act, k, kt, '  (by the head %.4f, %+.1f%%)' % (kh, 100 * (kh / k - 1)) if kh else ''))
        if WALK == 'built':                                       # (the walk, from his own rows' bodies and legs: WALKS)
            src = lambda key: faces[f][ROWKEY[key[0]]][int(key[1:])][0]
            built = []
            for spec in WALKS[f]:
                whole = spec[0] == spec[1] and len(spec) == 2                # (a drawn frame, body and legs its own: taken as drawn)
                sm = src(spec[0]).copy() if whole else compose(src(spec[0]), src(spec[1]), len(spec) > 2 and spec[2] == 'm')
                ys, xs = np.where(sm[..., 3] >= 128); t, b = ys.min(), ys.max() + 1
                built.append((sm, feet_mid(sm[..., 3] >= 128, t, b, 0) + 1, sm.shape[0]))
            faces[f]['Walk'] = built
    for f, g in MIRROR.items():
        faces[f] = {act: [(px[:, ::-1].copy(), px.shape[1] - x, h) for px, x, h in row] for act, row in faces[g].items()}
    for f in faces:                                               # (snapped last: a mirror of a snapped frame is the snap of its mirror)
        faces[f] = {act: [(pixel(sm), x, h) for sm, x, h in row] for act, row in faces[f].items()}
    # the engine's rows from the drawn actions
    rows = {}
    for f in range(8):
        d = faces[f]
        rows.setdefault('idle', {})[f] = [d['Idle'][i] for i in SEQ]
        rows.setdefault('walk', {})[f] = d['Walk']
        rows.setdefault('attack', {})[f] = d['Pit Fists']
        rows.setdefault('hurt', {})[f] = d['Fall']
        rows.setdefault('sit', {})[f] = d['Sit']
        rows.setdefault('flinch', {})[f] = d['Flinch']
        rows.setdefault('prone', {})[f] = d['Fall'][1:] + d['Prone']
    # one foot line for the sheet; each row its own width round the anchor
    T = max(px.shape[0] for r in rows.values() for fs in r.values() for px, x, h in fs) + 2
    fh, ay = T + 3, T
    meta = {'image': 'art/%s.png' % NAME, 'anims': {}}
    blocks, y0, width = [], 0, 0
    for anim, fps in ROWS:
        allf = [q for fs in rows[anim].values() for q in fs]
        L = max(x for px, x, h in allf) + 2; R = max(px.shape[1] - x for px, x, h in allf) + 2
        half = int(np.ceil(max(L, R))); fw, ax = 2 * half, half
        n = len(rows[anim][0])
        blk = np.zeros((8 * fh, n * fw, 4), np.uint8)
        for f in range(8):
            for i, (px, x, h) in enumerate(rows[anim][f]):
                ox, oy = int(round(ax - x)), ay - px.shape[0] + 1
                cell = blk[f * fh:(f + 1) * fh, i * fw:(i + 1) * fw]
                on = px[..., 3] > 0
                cell[oy:oy + px.shape[0], ox:ox + px.shape[1]][on] = px[on]
        an = {'y': y0, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'frames': n, 'fps': fps}
        if anim == 'attack':
            an['release'] = 2                                     # (Pit Fists 3, the right cross thrown through: the blow lands)
        if anim == 'walk' and WALK == 'old':
            an.update(drawn=[], under=OLD)
        meta['anims'][anim] = an
        blocks.append(blk); y0 += 8 * fh; width = max(width, blk.shape[1])
    sheet = np.zeros((y0, width, 4), np.uint8); y = 0
    for blk in blocks:
        sheet[y:y + blk.shape[0], :blk.shape[1]] = blk; y += blk.shape[0]
    idle0 = meta['anims']['idle']
    meta.update(fw=idle0['fw'], fh=fh, ax=idle0['ax'], ay=ay, top=int(ay + 1 - min(ay - px.shape[0] + 1 for px, x, h in rows['idle'][0])))
    meta['source'] = ('drawn by the art desk (ART-123-TALMOK HEAD 2, his five town Idle pages, 10-29; ART-123-TALMOK-COMBAT, his fight poses in five views, '
                      '10-30 -- its own word "PARTIAL / REVIEW CANDIDATES"), cut and snapped by tools/talmok-sheet.py')
    meta['old'] = OLD
    os.makedirs(ART, exist_ok=True)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, NAME + '.png'), optimize=True)
    json.dump(meta, open(os.path.join(ART, NAME + '.json'), 'w'), indent=1)
    print('  %s: %dx%d, %s; stands %d (S idle)' % (NAME, sheet.shape[1], sheet.shape[0],
          ', '.join('%s %d (%dx%d)' % (a, meta['anims'][a]['frames'], meta['anims'][a]['fw'], fh) for a, _ in ROWS), meta['top']))
    return sheet, meta, report


if __name__ == '__main__':
    sheet, meta, report = cut()
    if 'check' in sys.argv[1:]:
        print('\n'.join(report))
        d = os.path.join(ROOT, 'dev', 'visions', 'talmok'); os.makedirs(d, exist_ok=True)
        for anim, an in meta['anims'].items():
            blk = sheet[an['y']:an['y'] + 8 * an['fh'], :an['frames'] * an['fw']]
            cv = np.zeros(blk.shape[:2] + (3,), np.uint8); cv[...] = (14, 22, 52)
            for f in range(8):
                cv[f * an['fh'] + an['ay'], :] = (90, 70, 50)
            al = blk[..., 3:4] / 255.0; cv = (blk[..., :3] * al + cv * (1 - al)).astype(np.uint8)
            Image.fromarray(cv).resize((cv.shape[1] * 2, cv.shape[0] * 2), Image.NEAREST).save(os.path.join(d, '%s.png' % anim))
        print('  dev/visions/talmok/<row>.png')

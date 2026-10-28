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
HOLE_D, HOLE_MIN = 4, 1000        # a hole the counter closed: the page's navy to within HOLE_D, HOLE_MIN source px of it in one piece (Percy's work frame 1)
ACTIONS = ['idle', 'attentive', 'welcoming', 'skeptical', 'concerned', 'work']   # (the default six; a layout may name its own: Sylvia's)
FPS = {'idle': 3, 'work': 4, 'stretch': 4}   # (the idle a slow breath and blink; the work a deliberate unwrap)
# a person's pages: (page, its bands' counts top to bottom, each drawing's action in reading order) -- the art desk's six-page plan by default
LAYOUT = [(1, [3, 3], ['idle'] * 6), (2, [1], ['attentive']), (3, [1], ['welcoming']), (4, [1], ['skeptical']), (5, [1], ['concerned']), (6, [3, 3], ['work'] * 6)]
# name: (pages' folder, ART id, the keeper's door in deep16/js/town.js, overrides). The art desk's numbers: bare ART-78 to ART-81 are these shopkeepers --
# its four heroes' 8-bit makeovers are ART-77-8BIT-<HERO> since its numbering resolution of 10-21 (Griz authorized; the collision is struck)
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
    'marin': ('marin/ART-86', 'ART-86', 'keeper:marin', {}),          # (10-21, Griz: "is the marin voss lack the zip file I just put in Fresh?")
    'kasten': ('kasten/ART-88', 'ART-88', 'shop:kasten', {}),         # (and "Lucia and 88 should be in there now")
    'lucia': ('lucia/ART-110', 'ART-110', 'shop:lucia', {}),
    # the last six of art-wanted section 20 (10-21 evening, the keepers cutter seat; Griz to the lanes desk: "we have shopkeep NPCs in Fresh")
    'cassia': ('cassia/ART-89', 'ART-89', 'inn:cassia', {}),
    'lisbet': ('lisbet/ART-92', 'ART-92', 'shop:lisbet', {}),
    'marko': ('marko/ART-94', 'ART-94', 'shop:marko', {}),
    'vilar': ('vilar/ART-97', 'ART-97', 'shop:vilar', {}),
    'percy': ('percy/ART-102', 'ART-102', 'warp:percy', {}),
    'ned': ('ned/ART-103', 'ART-103', 'warp:percy', {}),               # (Percy's partner: behind the same counter; the counter screen shows Percy's face)
    # two of the non-shop folk (10-21 night; Griz to the lanes desk: "non shop folk also have art in Fresh"): portraits only, no town page asked
    'mela': ('mela/ART-90', 'ART-90', 'keeper:mela', {}),
    'mical': ('mical/ART-91', 'ART-91', 'keeper:mical', {}),
    'merrick': ('merrick/ART-93', 'ART-93', 'keeper:merrick', {}),  # (10-21 night, the same word: the message-lantern house's window)
    # three more, each with a south idle (10-22, the NPC cutter seat; Griz to the lanes desk: "more NPC art is in", then "one cutter for all 3"): Brennan the smith
    # and Venn Hale of the fighters' stables at their doors, Korvin of the Hex's betting slate (his place is the Hex seat's)
    # (`gap`, by page: how near a piece must be to join a drawing -- Brennan's broad shoulders stand 5 px apart on his idle and work pages, Venn Hale's rows 11 px,
    # and her taut strap touches the next frame's on her work page, so there only a piece that overlaps one joins it)
    'brennan': ('brennan/ART-87', 'ART-87', 'keeper:brennan', {'gap': {1: 3, 6: 3}}),
    'venhale': ('venhale/ART-96', 'ART-96', 'keeper:venhale', {'gap': {1: 3, 6: -1}}),   # (Venn Hale by the first game's id, content/npcs.json -- not Venn the barber)
    # Korvin's waistcoat dyed slate grey at the cut, his shirt, skin, hair and inked fingers left alone (RULED 10-22, Griz: "Go for recolor without reroll"; the
    # desk had found Percy his near-twin, the same brown waistcoat over a cream rolled-sleeve shirt): judged in a 4x lineup beside Percy and Merrick on the counter's
    # panel -- the palette's silver ramp, clear of Percy's brown and Merrick's, where a dark blue sank into the navy behind him
    'korvin': ('korvin/ART-95', 'ART-95', 'hex:korvinSlate', {'recolour': {'hue': 215, 'sat': 0.22}}),
    'davos': ('davos/ART-98', 'ART-98', 'leech:davos', {}),         # (10-22, the desk's relay of Griz's "4 should be in fresh": the leech-house's face)
    # (10-22, the desk's relay of Griz's "more NPC in fresh": Marta Venn's cook-stalls, and Madame Ondine Vess of the School, whose door neither game has yet.
    # HELD, not cut: Tam Vere, ART-100, sorted to _src/tam/ART-100 -- the art desk drew her a man (its prompts: "watchful man"), and the realm's Tam and the
    # first game's are a woman (wiki vice-row.md; content/npcs.json `tam`); his word on a re-roll first)
    'marta': ('marta/ART-99', 'ART-99', 'npc:marta', {'gap': {6: 3}, 'match': {6: 1}}),   # (her work's bottom band stands 11 px apart; that page is drawn
    # warmer than her idle, its skin snapping to the reds: its colours matched to the idle's)
    'ondine': ('ondine/ART-101', 'ART-101', 'the School (no door yet)', {'gap': {6: 3}, 'pxjoin': (6,)}),   # (her work: the hand gesturing off-panel reaches into the frame before's box)
    # Aldwin of the mission chapel, pin 30 -- not Aldwyn Androit the notary (ART-80): the art desk's ART-114 (10-28, the second cutter seat, on Griz's 10-22
    # "we need for Aldwin of the free rest"); his chapel's free floor is the services seat's scene (C.SCRIPTS chapel)
    'aldwin': ('aldwin/ART-114', 'ART-114', 'chapel:aldwin', {'bevel': (2, 3, 4, 5)}),   # (his stills' counter tops are bevelled)
    # Tam Vere of the dream-smoke den, pin 40, a woman (10-28, the second cutter seat): the art desk's re-roll of ART-100 (its revision female-2026-10-27); the man it
    # drew first is in _src/tam/superseded/, never cut
    'tam': ('tam/ART-100', 'ART-100', 'keeper:tam', {'bevel': (6,), 'avoid': ['red', 'fire']}),   # (her work's counter top bevelled, as Aldwin's stills; her rust apron
    # snapped in part to the reds, a stain: left out, it keeps to leather and skin)
}


def page_path(folder, art, n, pat='%s_HEAD-1_PAGE-%d.png'):
    fs = glob.glob(os.path.join(SRC, folder, pat % (art, n)))
    if not fs:
        raise SystemExit('no page %d in %s' % (n, os.path.join(SRC, folder)))
    return fs[0]


def drawings(a, bands, mask_d=MASK_D, gap=12, pxjoin=False):
    """the page's drawings, `bands` of them a band, each (mask of it over the page, its box), read in order: top band first, left to right. A pixel is figure
    when a channel is mask_d from the navy, or half that and touching one that is (a dark coat's shadows against the navy: Winters'); a drawing
    is its biggest piece and the pieces within `gap` px of it (a sleeve the mask parted from the body: Casper's) -- by their boxes, or with `pxjoin` by their
    own pixels (a hand reaching into the next frame's box: Madame Ondine Vess's work); a printed word or number is small and short"""
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
        g = [q for q in groups if near(q[1], b, gap)]
        if pxjoin and g:                                        # (only a group whose own pixels come within gap px of this piece's)
            wx0, wy0, wx1, wy1 = max(0, b[0] - gap - 1), max(0, b[1] - gap - 1), b[2] + gap + 1, b[3] + gap + 1
            win = lab[wy0:wy1, wx0:wx1]; me = ndimage.binary_dilation(win == i + 1, iterations=max(1, gap))
            g = [q for q in g if np.isin(win[me], q[0]).any()]
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


def hsv(rgb):
    """hue (degrees), saturation and value (0-1) of an RGB array (0-255)"""
    a = rgb.astype(float) / 255.0; mx = a.max(-1); d = mx - a.min(-1)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.zeros_like(mx); m = d > 1e-6
    rr = m & (mx == r); gg = m & (mx == g) & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6; h[gg] = ((b - r)[gg] / d[gg]) + 2; h[bb] = ((r - g)[bb] / d[bb]) + 4
    return h * 60, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx


def cloth_mask(rgb, fig, hues=(8, 48), smin=0.2, vmax=0.45):
    """the dark brown cloth worn over a pale shirt (a waistcoat) in one drawing's crop, `fig` its figure: the brown of `hues` darker than vmax, its body the big
    pieces left by a 9 px opening (the shirt's fold lines and a face's shadows are thin and fall away), its smaller parts within 30 px of that body (its back over
    a shoulder, a side panel under an arm), its edges 4 px round, and the near-black of its seams inside it (not the ink on the fingers: a blue). A prop of a
    redder, deeper leather in front of it is left out, by its colour smoothed over the dither (Korvin's pouch, his work 4-6)"""
    h, s, v = hsv(rgb)
    cand = fig & (h >= hues[0]) & (h <= hues[1]) & (s >= smin) & (v <= vmax)
    body = ndimage.binary_opening(cand, structure=np.ones((9, 9)))
    lab, n = ndimage.label(body)
    if not n:
        return np.zeros_like(fig)
    sz = ndimage.sum(body, lab, range(1, n + 1))
    main = np.isin(lab, 1 + np.where(sz >= 0.25 * sz.max())[0])
    small = ndimage.binary_opening(cand, structure=np.ones((5, 5)))
    ls, ns = ndimage.label(small)
    if ns:
        ssz = ndimage.sum(small, ls, range(1, ns + 1))
        hit = np.unique(ls[ndimage.binary_dilation(main, iterations=30) & small]); hit = [k for k in hit if k > 0 and ssz[k - 1] >= 300]
        main |= np.isin(ls, hit)
    inside = ndimage.binary_fill_holes(ndimage.binary_closing(main, structure=np.ones((15, 15))))
    seam = fig & (v < 0.24) & ~((h > 180) & (h < 260) & (s > 0.2))
    out = (ndimage.binary_dilation(main, iterations=4) & cand) | (inside & seam)
    bl = np.stack([ndimage.uniform_filter(rgb[..., c].astype(float), 9) for c in range(3)], -1)
    bh, bs, bv = hsv(bl)
    prop = fig & (bh <= 20) & (bs >= 0.5) & (bv <= 0.45)
    lp, npp = ndimage.label(prop)
    if npp:
        psz = ndimage.sum(prop, lp, range(1, npp + 1))
        out &= ~ndimage.binary_fill_holes(ndimage.binary_dilation(np.isin(lp, 1 + np.where(psz >= 800)[0]), iterations=4))
    return out


def hem_cut(rgb, mask, band=(0.5, 0.7)):
    """a whole figure's cloth mask stopped at the waistcoat's hem, where trousers of the same brown go on below it (Korvin's town figure): the hem is the darkest
    row in `band` of the figure's height down each column of the mask, fitted as a V from the sides to the middle by a median fit (the buttons' gap and a stray
    dark fold fall away), and nothing below it is dyed"""
    H = mask.shape[0]; v = ndimage.uniform_filter(hsv(rgb)[2], (5, 9))
    y0, y1 = int(H * band[0]), int(H * band[1])
    cols = np.where(mask[y0:y1].sum(0) > 10)[0]
    if len(cols) < 3:
        return mask
    seam = np.array([y0 + int(np.argmin(np.where(mask[y0:y1, c], v[y0:y1, c], 9))) for c in cols], float)
    xc = (cols.min() + cols.max()) / 2.0; d = np.abs(cols - xc)
    best = None
    for b in np.linspace(-0.6, 0.6, 61):
        a0 = np.median(seam - b * d); err = np.median(np.abs(seam - a0 - b * d))
        if best is None or err < best[0]:
            best = (err, a0, b)
    _, a0, b = best
    out = mask.copy(); line = np.round(a0 + b * np.abs(np.arange(mask.shape[1]) - xc)).astype(int)
    for x in range(mask.shape[1]):
        out[max(0, line[x]):, x] = False
    return out


def recolour(rgb, mask, hue, sat):
    """the pixels under `mask` turned to `hue` at saturation `sat`, each keeping its own value (its light and shade): a cloth dyed another colour before the
    pixelating, so the palette's snap finds that colour's ramp"""
    h, s, v = hsv(rgb)
    out = rgb.astype(float).copy()
    vv = v[mask]; ss = np.full(vv.shape, float(sat))
    hh = (hue / 60.0) % 6; i = int(np.floor(hh)); f = hh - i
    p, q, t = vv * (1 - ss), vv * (1 - ss * f), vv * (1 - ss * (1 - f))
    out[mask] = np.stack([(vv, t, p), (q, vv, p), (p, vv, t), (p, q, vv), (t, p, vv), (vv, p, q)][i], -1) * 255
    return np.clip(np.round(out), 0, 255).astype(np.uint8)


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
    pages = []
    for pg, bands, acts in ov.get('layout', LAYOUT):
        a = np.asarray(Image.open(page_path(folder, art, pg, ov.get('pat', '%s_HEAD-1_PAGE-%d.png'))).convert('RGB')).astype(np.int32)
        for bx0, by0, bx1, by1 in ov.get('blank', {}).get(pg, []):
            a[by0:by1, bx0:bx1] = np.median(a.reshape(-1, 3)[::97], axis=0)   # (a printed title touching a head: Winters' ACQUISITION)
        found = [(piece, box, ledge_top(piece, box)) for piece, box in drawings(a, bands, ov.get('mask_d', MASK_D), ov.get('gap', {}).get(pg, 12), pg in ov.get('pxjoin', ()))]
        if len(found) != len(acts):
            raise SystemExit('%s page %d: %d drawings found, %d wanted' % (name, pg, len(found), len(acts)))
        pages.append((pg, a, found, acts))
    def wide_foot(piece, box):                               # (the drawing's foot as wide as anything near it: a counter's front, not a hem)
        x0, y0, x1, y1 = box
        wid = [np.count_nonzero(piece[y, x0:x1]) for y in range(y1 - int((y1 - y0) * 0.25), y1)]
        return max(wid[-6:]) >= 0.97 * max(wid)
    def top_of(piece): return np.where(piece.any(axis=1))[0][0]
    # the counter where a hand or a cloth broke its edge (Marin's work, Kasten's skeptical still, 10-21): a frame in a band whose neighbours' counter was found takes
    # their line (the counter stands at one height across a band); a lone still of a keeper whose Idle stands at a counter takes the depth of the counters found
    # on the other pages, as a share of the drawing's height
    idle_at_counter = any(f < b[3] for pg, a, found, acts in pages for p, b, f in found if acts[0] == 'idle')
    shares = [(b[3] - f) / float(b[3] - top_of(p)) for pg, a, found, acts in pages for p, b, f in found if f < b[3]]
    for pg, a, found, acts in pages:
        for i, (piece, box, foot) in enumerate(found):
            if foot < box[3]:
                continue
            mid = (box[1] + box[3]) / 2.0
            band = [f for p, b, f in found if f < b[3] and b[1] < mid < b[3]]
            if band:
                line = int(np.median(band))
                if top_of(piece) + 0.6 * (box[3] - top_of(piece)) < line < box[3]:
                    found[i] = (piece, box, line)
            elif idle_at_counter and shares and wide_foot(piece, box):
                found[i] = (piece, box, box[3] - int(round(np.median(shares) * (box[3] - top_of(piece)))))
    # a whole band of a page whose counter went unfound, where the page's other band found it (Davos's work, 10-22: his rolled sleeves stand wider than the
    # ledge just above it on the top band, so no row stood out as the counter's): the page's own counter depth, its drawings drawn at one scale, where the
    # drawing's foot is a ledge that deep -- every row of it standing within 3 px of the same two ends
    def ledge_deep(piece, box, dep):
        x0, y0, x1, y1 = box; ends = []
        for y in range(y1 - dep, y1 - 2):
            xs = np.where(piece[y, x0:x1])[0]
            if not len(xs):
                return False
            ends.append((xs.min(), xs.max()))
        l, r = np.median([e[0] for e in ends]), np.median([e[1] for e in ends])
        return len(ends) >= 4 and all(abs(e[0] - l) <= 3 and abs(e[1] - r) <= 3 for e in ends)
    # a counter whose top is bevelled (Aldwin's four stills, 10-28: the board's top face narrows for ten source rows before the figure's sleeves, so the run
    # of rows as wide as its front starts below it, and two rows of it stood under his hands at game size): the line climbs the bevel to the step where the
    # piece narrows to the figure -- `bevel`: the pages it climbs on
    def bevel_top(piece, box, foot, reach=24, step=16):
        x0, y0, x1, y1 = box
        def ends(y):
            xs = np.where(piece[y, x0:x1])[0]
            return (xs.min(), xs.max()) if len(xs) else None
        for y in range(foot - 1, max(y0 + 1, foot - reach), -1):
            e, u = ends(y), ends(y - 1)
            if e is None or u is None:
                return foot
            if (u[0] - e[0]) + (e[1] - u[1]) > step:
                return y
        return foot
    for pg, a, found, acts in pages:
        if pg in ov.get('bevel', ()):
            found[:] = [(p, b, bevel_top(p, b, f) if f < b[3] else f) for p, b, f in found]
    for pg, a, found, acts in pages:
        deps = [b[3] - f for p, b, f in found if f < b[3]]
        if not deps:
            continue
        dep = int(np.median(deps))
        for i, (piece, box, foot) in enumerate(found):
            if foot == box[3] and ledge_deep(piece, box, dep - 2):
                found[i] = (piece, box, box[3] - dep)
    # a page drawn warmer than the rest (Marta's work, 10-22: its skin snapped to the reds, a burnt face over the stew): its figures' colours matched to
    # another page's, channel by channel (the mean and spread of the figures' pixels), before the cut -- `match`: {page: the page it takes its colours from}
    for pg, a, found, acts in pages:
        ref = ov.get('match', {}).get(pg)
        if ref is None:
            continue
        rp = [q for q in pages if q[0] == ref][0]
        src = np.concatenate([a[pc & (np.arange(a.shape[0])[:, None] < f)] for pc, b, f in found])
        dst = np.concatenate([rp[1][pc & (np.arange(rp[1].shape[0])[:, None] < f)] for pc, b, f in rp[2]])
        k = dst.std(0) / np.maximum(src.std(0), 1e-6)
        a[...] = np.clip(np.round((a - src.mean(0)) * k + dst.mean(0)), 0, 255).astype(a.dtype)
    for pg, a, found, acts in pages:
        for (piece, box, foot), act in zip(found, acts):
            x0, y0, x1, y1 = box
            keep = piece.copy(); keep[foot:, :] = False
            if foot < y1:                                        # (the counter's top edge left in slivers over the cut: anything there under 5 px tall goes)
                band = keep[foot - 8:foot]; keep[foot - 8:foot] = band & ndimage.binary_opening(keep, structure=np.ones((5, 1)))[foot - 8:foot]
                # a hole the counter closed opens again with the counter gone (Percy's work, 10-21: the navy between his arm, the jar and his waistcoat, filled
                # as a hole while the counter's top shut it in): a wide piece of the page's own navy inside the figure
                dn = np.abs(a - np.median(a.reshape(-1, 3)[::97], axis=0)).max(-1)
                lb, nb = ndimage.label(keep & (dn <= HOLE_D), structure=np.ones((3, 3)))
                if nb:
                    sz = ndimage.sum(np.ones_like(lb), lb, range(1, nb + 1))
                    big = 1 + np.where(sz >= HOLE_MIN)[0]
                    if len(big): keep &= ~np.isin(lb, big)
            ys, xs = np.where(keep)
            top = ys.min()
            bust = foot - top
            head = keep[top:top + int(bust * 0.22)]
            hx = np.where(head)[1].mean()
            cx0, cx1 = xs.min(), xs.max() + 1
            rgba = np.zeros((foot - top, cx1 - cx0, 4), np.uint8)
            rgba[..., :3] = a[top:foot, cx0:cx1]
            rgba[..., 3] = keep[top:foot, cx0:cx1] * 255
            if ov.get('recolour'):                               # (a cloth dyed at the cut: Korvin's waistcoat off Percy's brown)
                rgba[..., :3] = recolour(rgba[..., :3], cloth_mask(rgba[..., :3], keep[top:foot, cx0:cx1]), **ov['recolour'])
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
            px = pix.pixelate(im, 1, do_lift=False, avoid=ov.get('avoid'))   # (`avoid`: ramps or colours the snap leaves out -- tools/pixelate.py)
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
    if ov.get('recolour'):
        meta['recolour'] = ov['recolour']                       # (the dye put on at the cut, for the record: Korvin's)
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

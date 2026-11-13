"""DEEP16 pipeline 2 (generated art): the shared cutter for the art desk's wolf-kin pages of 11-13 -- the worg, the mirror worg, the mirror wolf
(tools/worg-sheet.py, tools/mirrorworg-sheet.py, tools/mirrorwolf-sheet.py; the cutter of the wolves, on the lanes desk's start).

These pages carry no lettering: a page is one view, one action and one state, eight drawings on a 4 x 2 grid of windows that the delivery's own
FRAME-MAP.json names (1-4 the top band, 5-8 below; right and bottom exclusive). So nothing here is label-driven (tools/sheetrows.py reads printed
labels; there are none to read) -- the frame map is the label.

How a frame is cut:
  * the navy is flooded from the window's edges: a pixel is navy when it is within NAVY_TOL of the page's navy on every channel AND bluer than red
    by BLUE (the dark fur's edge is as dark as the navy but brown or grey, never blue: the art desk's "key off the navy while retaining dark fur
    edges"); an enclosed pocket of the same navy of POCKET px or more (between tail and hock) goes too. A state may pass `violet=True` (the made
    things: their dark violet fur sits near the navy) and then only the edge flood counts, no pockets.
  * loose bits under LOOSE px are dropped (page noise); the rest stay with the body.
  * ONE SCALE a creature (`k`, page px to a game px), every view, action and state: the pages are drawn at one scale and the states are paint-overs
    of one master, so the overcharged's growth and the emaciated's tuck survive (the art desk: "avoid independently normalizing each state's
    silhouette height").
  * ONE PLACEMENT a view and action, shared by the states (`register`): the page's ground is the median of its eight drawings' lowest rows and its
    middle the median of their bodies' median columns, measured on the state named first; every drawing keeps its own place in its window from
    there (the walk's bob, the bite's reach, a lifted paw). The cell is resampled straight off the page with the ground on a pixel edge, so the
    planted paws land on one row in every frame.
  * ONE COAT every view: the pages came a view at a time and their browns differ (the S greyer, the E warmer); each view's pages are brought, a
    channel each, to the SE idle's mean by its own idle's, measured on the registering state so the states keep their own difference from it.
  * down to game size by a premultiplied box, snapped to the 64 colours and outlined by tools/pixelate.py (no lift).
  * `stars` (the made states): a fleck drawn 3-5 page px wide is under one game pixel and the box would grey it into the fur. A game pixel whose
    block holds enough of a fleck (pixels much lighter than the fur round them and cold: blue at or over red; STAR_COVER of the block) takes the
    fleck's own colour, snapped -- the lightest first and none beside another, so they stay separate points (the art desk: "discrete, hard-edged
    stars. Keep them separated at native scale").
Facings (RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors.
"""
import json, os
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)

NAVY_TOL, BLUE, POCKET, LOOSE = 14, 12, 40, 30
STAR_COVER = 0.12                       # (a fleck must fill this much of a game pixel's block of the page to be kept as a point)
VIEWS = ['SE', 'NE', 'S', 'E', 'N']
ROWS = {'Idle': 'idle', 'Walk': 'walk', 'Bite': 'attack'}


def frame_map(folder):
    """-> {(state, view, row): (page path, [8 windows])} from the delivery's FRAME-MAP.json (the two shapes the art desk sent on 11-13)"""
    fm = json.load(open(os.path.join(folder, 'FRAME-MAP.json'), encoding='utf-8'))
    out = {}
    for s in fm['sheets']:
        act = s.get('action') or s.get('source_action')
        wins = [tuple(f.get('window') or f.get('tile_xyxy')) for f in sorted(s['frames'], key=lambda f: f['frame'])]
        assert len(wins) == 8 and s['runtime_row'] == ROWS[act], s
        out[(s['state'].lower(), s['facing'], ROWS[act])] = (os.path.join(folder, s.get('source') or s.get('path')), wins)
    return out


_PAGES = {}
def page(path):
    if path not in _PAGES:
        a = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
        _PAGES[path] = (a, np.median(a.reshape(-1, 3)[::97], axis=0))
    return _PAGES[path]


def mask(win, navy, violet=False):
    """the figure in a window: everything the navy's flood from the edges does not reach"""
    near = np.abs(win - navy).max(-1) <= NAVY_TOL
    bg = near & ((win[..., 2] - win[..., 0]) > BLUE)
    lab, n = ndimage.label(bg)
    edge = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1]); edge.discard(0)
    out = np.isin(lab, list(edge))
    if not violet and n:
        sz = ndimage.sum(bg, lab, range(1, n + 1))
        out |= np.isin(lab, 1 + np.where(sz >= POCKET)[0])
    m = ~out
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    if n > 1:
        sz = ndimage.sum(m, lab, range(1, n + 1))
        m &= ~np.isin(lab, 1 + np.where(sz < LOOSE)[0])
    return m


def measure(path, wins, violet=False):
    """-> (ground, middle) in window px: the medians over the page's eight drawings of the body's lowest row (exclusive) and its median column"""
    a, navy = page(path)
    bots, mids = [], []
    for x0, y0, x1, y1 in wins:
        m = mask(a[y0:y1, x0:x1], navy, violet)
        lab, n = ndimage.label(m, structure=np.ones((3, 3)))
        body = lab == 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
        ys, xs = np.where(body)
        bots.append(ys.max() + 1); mids.append(np.median(xs))
    return float(np.median(bots)), float(np.median(mids))


def star_mask(win, m, size=9):
    """the flecks: figure pixels far lighter than the fur round them (a `size` px median: 9 for the worg's 3-5 px points, wider for the mirror
    wolf's, drawn as flat squares 12-15 px a side) and cold"""
    lum = win.sum(-1) / 3.0
    base = ndimage.median_filter(lum, size=size) if size <= 9 else ndimage.uniform_filter(lum, size=size)   # (a wide median is minutes a page; the mean does)
    return m & (lum - base > 38) & (lum > 120) & (win[..., 2] >= win[..., 0] - 4)


def tone_of(path, wins, violet=False):
    """the mean colour of a page's eight drawings"""
    a, navy = page(path)
    px = [a[y0:y1, x0:x1][mask(a[y0:y1, x0:x1], navy, violet)] for x0, y0, x1, y1 in wins]
    return np.concatenate(px).mean(0)


def cell(path, win, k, ground, middle, geom, violet=False, stars=False, gain=None):  # (stars: False, True, or the fleck median's size)
    """one drawing -> an RGBA cell at game size, outlined"""
    fw, fh, ax, ay = geom
    a, navy = page(path)
    x0, y0, x1, y1 = win
    w = a[y0:y1, x0:x1]
    m = mask(w, navy, violet)
    if gain is not None:
        w = np.clip(w * gain, 0, 255).astype(np.int16)
    H, W = m.shape
    padx, pady = int(fw * k) + 8, int(fh * k) + 8                       # (the cell reaches past the window: room all round)
    rgba = np.zeros((H + 2 * pady, W + 2 * padx, 4), np.uint8)
    rgba[pady:pady + H, padx:padx + W, :3] = w.astype(np.uint8)
    rgba[pady:pady + H, padx:padx + W, 3] = m * 255
    bx0, by0 = padx + middle - ax * k, pady + ground - ay * k            # (the ground on row ay's upper edge: the paws' last row is ay - 1, the outline's ay)
    box = (bx0, by0, bx0 + fw * k, by0 + fh * k)
    small = Image.fromarray(rgba, 'RGBA').convert('RGBa').resize((fw, fh), Image.BOX, box=box).convert('RGBA')
    out = pix.pixelate(small, 1, do_lift=False)
    if stars:
        sm = star_mask(w, m, 9 if stars is True else int(stars))
        ys, xs = np.where(sm)
        if len(ys):
            gx = np.floor((xs + padx - bx0) / k).astype(int); gy = np.floor((ys + pady - by0) / k).astype(int)
            lum = w.sum(-1)[ys, xs]
            best, count = {}, {}
            for i in np.argsort(lum):                                   # (the lightest fleck pixel of each game pixel's block wins)
                q = (gy[i], gx[i]); best[q] = i; count[q] = count.get(q, 0) + 1
            keys = [q for q in best if 0 <= q[0] < fh and 0 <= q[1] < fw and out[q[0], q[1], 3] and tuple(out[q[0], q[1], :3]) != tuple(pix.OUTLINE)
                    and count[q] >= STAR_COVER * k * k]
            taken = set()
            for q in sorted(keys, key=lambda q: -lum[best[q]]):          # (separate points: the lightest first, none beside another)
                if not any((q[0] + dy, q[1] + dx) in taken for dy in (-1, 0, 1) for dx in (-1, 0, 1)):
                    taken.add(q)
            keys = sorted(taken)
            if keys:
                cols = np.array([w[ys[best[q]], xs[best[q]]] for q in keys], np.float32)[None] / 255.0
                snapped = pix.snap(cols)[0]
                for q, c in zip(keys, snapped):
                    out[q[0], q[1], :3] = c
    return out


def mirror(seq):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide)"""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def cut_state(fmap, state, k, geom, register=None, violet=False, stars=False, own_ground=False):
    """-> {row: [8 facings of 8 frames]} for one state; `register` the state whose pages set each view-and-action's placement (itself when None);
    `own_ground`: the state's own page sets its ground and the registering state only its middle (the mirror worg's states sit a page px or two
    apart on their pages; the mirror wolf's are registered to the pixel and need none)"""
    reg = register or state
    d = {v: {} for v in VIEWS}
    ref = tone_of(*fmap[(reg, 'SE', 'idle')], violet=violet)
    for v in VIEWS:
        gain = ref / tone_of(*fmap[(reg, v, 'idle')], violet=violet)      # (one coat every view: each view's idle brought to the SE idle's mean, a channel each)
        print('  %s tone x %s' % (v, np.round(gain, 2).tolist()))
        for row in ('idle', 'walk', 'attack'):
            rp, rw = fmap[(reg, v, row)]
            ground, middle = measure(rp, rw, violet)
            p, wins = fmap[(state, v, row)]
            if own_ground and reg != state:                                # (a state whose pages are not pixel-registered to the master's: its own ground)
                ground = measure(p, wins, violet)[0]
            d[v][row] = [cell(p, wn, k, ground, middle, geom, violet, stars, gain) for wn in wins]
    frames = {}
    for row in ('idle', 'walk', 'attack'):
        frames[row] = [d['S'][row], mirror(d['SE'][row]), mirror(d['E'][row]), mirror(d['NE'][row]), d['N'][row], d['NE'][row], d['E'][row], d['SE'][row]]
    return frames


def clipped(frames):
    """how many opaque pixels sit on a cell's border, a row: a drawing that ran out of its cell"""
    out = {}
    for row, fs in frames.items():
        n = 0
        for f in fs:
            for fr in f:
                al = fr[..., 3] > 0
                n += int(al[0].sum() + al[-1].sum() + al[:, 0].sum() + al[:, -1].sum())
        out[row] = n
    return out


def write(name, frames, geom, source, release=2):
    fw, fh, ax, ay = geom
    pix.write_sheet(name, frames, fw, fh, ax, ay, pix.top_of(frames['idle'][0] + frames['idle'][6], ay))
    mp = os.path.join(pix.ART, name + '.json')
    meta = json.load(open(mp))
    meta['anims']['attack']['release'] = release          # (the bite closes on drawing 3: js/battle.js strikes on a row's release frame at every pace)
    meta['source'] = source
    json.dump(meta, open(mp, 'w'), indent=1)
    c = clipped(frames)
    print('  %s: top %d, on the cell border %s' % (name, meta['top'], c))
    return meta


def review(name, frames, out, scale=3, bg=(40, 44, 66)):
    """every row of every drawn view at `scale`, for the cutter's eye (S SE E NE N down, the rows across)"""
    order = [0, 7, 6, 5, 4]
    rows = [r for r in ('idle', 'walk', 'attack') if r in frames]
    fh, fw = frames['idle'][0][0].shape[:2]
    sheet = Image.new('RGB', (fw * 8 * len(rows), fh * len(order)), bg)
    for ri, r in enumerate(rows):
        for vi, f in enumerate(order):
            for i, fr in enumerate(frames[r][f]):
                im = Image.fromarray(fr, 'RGBA')
                sheet.paste(im, (ri * 8 * fw + i * fw, vi * fh), im)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.resize((sheet.width * scale, sheet.height * scale), Image.NEAREST).save(out)
    print('  review: ' + out)

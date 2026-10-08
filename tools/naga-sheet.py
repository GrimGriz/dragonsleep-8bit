"""DEEP16 pipeline 2 (generated art): Griz's three GPT sheets of the spirit naga -> naga_p2.

    python tools/naga-sheet.py            (writes deep16/art/naga_p2.png/.json)
    python tools/naga-sheet.py check      (also the cut overlays, dev/visions/naga/cut-<n>.png, and a lineup beside the troll and the gnoll)

Sources (gitignored, the main checkout's -- a worktree reads them there), all in deep16/_src/Fresh/: Spirit Naga animation sprite sheet-4.png
(the side: a portrait, a turnaround Front, Right, Back, Left, and rows facing RIGHT), Spirit Naga Front Animation Sheet-4.png (from the
front) and Six back-view naga idle sprites-12.png (from behind: Griz's re-roll of the whole sheet, in place of Spirit Naga Back-View Animation
Sheet-7.png, which dropped an idle frame) -- Griz, 2026-10-08, from the pastes in deep16-art-in-hand.md ("The stand-ins' first sheets", the
spirit naga; "The six's fronts and backs", the spirit naga from the front and from behind). It replaces the stand-in naga_p1 (a snake).

Sheet 1: idle 6, slither 8, bite 6, cast 6, flinch 4, fall 6, prone 2 -- but its Slither drew seven bodies over eight numbers (the 7 and the
8 sit under one drawing), so the side slither has seven frames. Sheets 2 (the front) and 3 (behind): idle 6, slither 8, bite 6, cast 6, flinch 4.
The engine's rows: idle; walk the slither; bite and attack (the fallback) the bite (battle.js plays a row named for the attack); cast;
flinch; hurt the fall; prone the sheet's Prone played lying-last (flat, then rearing up: reversed, so it lies at its last frame and gets up by
playing it back -- deep16/js/sprites.js S.proneRow, the goblin's way).
Facings: NE, E and SE take the side rows as drawn, SW, W and NW mirrored; S takes sheet 2's rows and N sheet 3's for idle, walk, bite (and
attack), cast and flinch; the fall and prone play side-on from S and N too. A row has one frame count in every facing: the front's and the
back's slither drop one of their eight to meet the side's seven (DROP: the frame whose neighbours are likest, so the loop skips least).
Scale: one K per sheet, sheet px a game px. Sheet 1's rows set HEIGHT, the side idle's standing px (the stand-in's side idle stood 94-97);
its turnaround (drawn bigger than its rows) meets them by its Right and Left against the side idle, by area; sheets 2 and 3 meet the
turnaround by their idles against its Front and its Back, by area (holes filled -- the coiled body is most of it; the hair flies about).
The cast's violet light (dim wisps and sparks round the head, on navy) is kept by place and colour (the goose's glow, the mirror gnoll's
glint): a pixel violet enough is figure, though the navy cut would drop it; at game size it is drawn where its block on the sheet holds
enough of it, in its own colour, with no outline of its own (the body keeps its outline). The black scales are blue-black on the navy: the
navy cut left holes in the coils, filled by colour (figure_mask), the navy seen through a curl of the tail kept. Colour: the front and back
sheets drew the bands a redder red than sheet 1, and broader; each is brought to sheet 1's per channel and per colour -- the red bands, the
light (face, belly), the dark (scales, hair) -- against the turnaround's Front and Back (TONE, printed as it is measured), the glow left be.
"""
import os, sys, json, subprocess, tempfile
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SR = _load('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))

FILES = {1: os.path.join('Fresh', 'Spirit Naga animation sprite sheet-4.png'), 2: os.path.join('Fresh', 'Spirit Naga Front Animation Sheet-4.png'),
         3: os.path.join('Fresh', 'Six back-view naga idle sprites-12.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering: the row names; each number gets its own box below, so the cast's sparks
# beside a number are not taken for it), and its rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the frames' x off the probe,
# [the numbers' x where they differ from the frames'])
SHEETS = {
  1: dict(text=[(0, 205, 124, 1024)],
          rows=[('turn', (380, 0, 1300, 178), (178, 203), TURN, [512, 718, 934, 1159]),
                ('idle', (0, 203, 1536, None), (330, 344), NUM(6), [209, 392, 577, 760, 937, 1123]),
                ('slither', (0, None, 1536, None), (437, 451), NUM(6) + ['7+8'], [214, 399, 604, 793, 999, 1207, 1420],
                 [214, 399, 604, 793, 999, 1207, 1384, 1504]),
                ('bite', (0, None, 1536, None), (556, 570), NUM(6), [209, 378, 551, 761, 973, 1168]),
                ('cast', (0, None, 1536, None), (707, 721), NUM(6), [200, 370, 555, 745, 938, 1127]),
                ('flinch', (0, None, 1536, None), (816, 830), NUM(4), [207, 406, 590, 774]),
                ('fall', (0, None, 1536, None), (906, 920), NUM(6), [207, 419, 619, 853, 1091, 1371]),
                ('prone', (0, None, 1536, None), (999, 1012), NUM(2), [255, 538])]),
  2: dict(text=[(0, 0, 136, 1024)],
          rows=[('idle', (0, 0, 1536, None), (187, 206), NUM(6), [256, 477, 696, 905, 1121, 1350]),
                ('slither', (0, None, 1536, None), (388, 407), NUM(8), [211, 376, 554, 717, 900, 1075, 1254, 1421]),
                ('bite', (0, None, 1536, None), (588, 608), NUM(6), [256, 472, 692, 919, 1136, 1353]),
                ('cast', (0, None, 1536, None), (796, 815), NUM(6), [253, 472, 692, 907, 1129, 1352]),
                ('flinch', (0, None, 1536, None), (981, 999), NUM(4), [354, 637, 895, 1163])]),
  3: dict(text=[(0, 0, 127, 1024)],
          rows=[('idle', (0, 0, 1536, None), (191, 210), NUM(6), [238, 460, 688, 929, 1153, 1387]),
                ('slither', (0, None, 1536, None), (370, 387), NUM(8), [212, 390, 565, 742, 919, 1099, 1270, 1447]),
                ('bite', (0, None, 1536, None), (578, 595), NUM(6), [223, 442, 659, 873, 1108, 1348]),
                ('cast', (0, None, 1536, None), (792, 809), NUM(6), [222, 442, 668, 896, 1112, 1338]),
                ('flinch', (0, None, 1536, None), (969, 986), NUM(4), [235, 502, 760, 1013])]),
}
SPLIT = {(1, 'cast'): 552}   # (sheet, row) -> the line between it and the row above, by hand: the cast's light reaches up past the bite's
                             # numbers (cast 4's ring tops out at 560) while the bites' bottoms end at 550
# painted navy whole before the cut: the portrait's foot inside the idle band (its coils down to 268 beside idle 1, a lock of its hair down
# to 232 just over idle 1's head, which starts at 234)
BLANK = {1: [(0, 195, 214, 272), (214, 195, 300, 233)]}
FIX, CUT, TOUCH_OK = {}, {}, {}

# the engine's rows: (sheet 1's row); S and N take sheets 2 and 3 for the rows they drew
FRONT = BACK = ('idle', 'slither', 'bite', 'cast', 'flinch')
ROWS = {'idle': 'idle', 'walk': 'slither', 'bite': 'bite', 'attack': 'bite', 'cast': 'cast', 'flinch': 'flinch', 'hurt': 'fall', 'prone': 'prone'}
NEW = []              # (every row is in pixelate.py's ANIM_ORDER already)
FPS = {'idle': 5, 'walk': 8, 'bite': 10, 'attack': 10, 'cast': 8, 'flinch': 10, 'hurt': 8, 'prone': 8}
TONE = {}             # filled by tones() below and printed: per channel and colour, sheets 2 and 3 to sheet 1
HEIGHT = 90           # the side idle, standing px (the stand-in's side idle 94-97; the troll's 102)
GLOW_CUT = 0.3        # a game pixel is glow where its block on the sheet is this much violet


def violet(rgb):
    """the cast's light: violet to pink-white (red and blue both well over green) -- the bands' red has no blue, the scales and hair no
    red over green, the navy no red at all"""
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (b - g > 30) & (r - g > 20) & (r > 40)


def figure_mask(a, grey=20, far=150, chan=None):
    """sheetrows' figure (grey or far from the navy), the violet light, which on navy is neither, and the black scales' blue-black (20 29 45
    or so: some red in it, the navy has none -- its red 1, 5 at most) where the navy cut left holes in the coils; a hole that is the navy
    seen through a curl of the tail (its red 2-7, a little darker than the open navy: its brightest channel 15-25 under the navy's) stays a
    hole; one far darker than that is the shadow between two coils (the front sheet's 5 17 35 on a navy of 1 32 82)"""
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    bg = a[..., 2] - a[..., 1]                                    # (blue over green: the scales' 16-18, the navy's 48, the light's haze more)
    m = _figure_mask(a, grey, far, chan) | violet(a) | ((a[..., 0] >= 12) & (bg < 30) & (np.abs(a - navy).sum(-1) > 30))
    holes = ndimage.binary_fill_holes(m) & ~m
    lab, n = ndimage.label(holes)
    if n:
        idx = range(1, n + 1)
        red, top, hue = ndimage.mean(a[..., 0], lab, idx), ndimage.mean(a.max(-1), lab, idx), ndimage.mean(bg, lab, idx)
        m |= np.isin(lab, 1 + np.where(((red >= 10) | (top < navy.max() - 35)) & (hue < 30))[0])   # (not the navy inside the light's ring)
    return m
_figure_mask = SR.figure_mask


def classes(rgb):
    """each pixel's share in the three colours it is drawn in: the red bands, the light (the face, the belly's cream) and the dark (the black
    scales and the hair) -- soft, so a toned band has no edge"""
    rgb = rgb.astype(float)
    r, g = rgb[..., 0], rgb[..., 1]
    red = np.clip((r / np.maximum(g, 1) - 1.4) / 0.5, 0, 1) * np.clip((r - 50) / 30, 0, 1)
    light = (1 - red) * np.clip((rgb.mean(-1) - 90) / 40, 0, 1)
    return red, light, 1 - red - light


def toned(a, f):
    """each class's channels times its own factors: f = (red, light, dark), three (r, g, b) each"""
    a = a.astype(float)
    w = classes(a[..., :3])
    a[..., :3] = np.clip(a[..., :3] * sum(wi[..., None] * np.array(fi) for wi, fi in zip(w, f)), 0, 255)
    return a.astype(np.uint8)


def split_glow(a, glowrow):
    """a cut frame's body and its light (the light: violet pixels the body doesn't enclose; in a cast row, the loose sparks too)"""
    solid = a[..., 3] > 0
    body = ndimage.binary_fill_holes(solid & ~violet(a[..., :3])) & solid
    if glowrow:
        lab, n = ndimage.label(body, structure=np.ones((3, 3)))
        if n > 1:
            sz = ndimage.sum(body, lab, range(1, n + 1))
            body = np.isin(lab, 1 + np.where(sz >= 25)[0])           # (a hair tip may go with them: drawn the same, unoutlined)
    return body, solid & ~body


def game_frame(im, k, tone=None, glowrow=False):
    """a cut frame at game size: the body palette-snapped and outlined (toned to sheet 1), its light kept by place and colour"""
    a = np.asarray(im).copy()
    body, glow = split_glow(a, glowrow)
    b = a.copy(); b[~body, 3] = 0
    if tone:
        b = toned(b, tone)
    w, h = im.size
    size = (max(1, round(w / k)), max(1, round(h / k)))
    out = pix.pixelate(Image.fromarray(b, 'RGBA').resize(size, Image.BOX), 1, do_lift=False)
    if glow.any():
        g = a.copy(); g[~glow, 3] = 0
        gs = np.asarray(Image.fromarray(g, 'RGBA').resize(size, Image.BOX)).astype(float)
        hit = (gs[..., 3] >= GLOW_CUT * 255) & (out[..., 3] == 0)
        if hit.any():
            out[hit, :3] = pix.snap(gs[hit][None, :, :3] / 255.0)[0]
            out[hit, 3] = 255
    return out


def core_x(a):
    """x of the body's thick middle (the coils; the neck, the tail and the light are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def body(im, glowrow=False):
    """a cut frame's measures on the sheet: sqrt of its body's area (holes filled, no light) and its height"""
    m, _ = split_glow(np.asarray(im), glowrow)
    m = ndimage.binary_fill_holes(m)
    ys = np.where(m.any(1))[0]
    return float(np.sqrt(m.sum())), int(ys[-1] - ys[0] + 1)


def place(a, x_ref, up, fw, ax, FH, AY):
    """a 1x RGBA array onto an fw x FH frame: x_ref at ax, the lowest opaque row `up` px above AY"""
    out = np.zeros((FH, fw, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


def cut(L, check=False):
    s = SHEETS[L]
    rows, prev = [], None
    for r in s['rows']:
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        if r[0] != 'turn':
            if prev is not None:
                y0 = SPLIT.get((L, r[0]), prev)
                if (L, r[0]) in SPLIT:                            # (the row above ends there too)
                    rows[-1] = (rows[-1][0], rows[-1][1][:3] + (y0,)) + rows[-1][2:]
            y1 = (l0 + l1) // 2                                   # a row's band: the middle of the strip above to the middle of its own
            prev = y1
        rows.append((r[0], (x0, y0, x1, y1)) + tuple(r[2:]))
    hand = {(r[1][0], r[1][1]): r[4] for r in rows}
    text = list(s['text'])
    for r in rows:
        (x0, _, x1, _), (l0, l1) = r[1], r[2]
        if r[0] == 'turn':
            text.append((x0, l0 - 3, x1, l1 + 4))                 # (the turnaround's words, a strip)
        else:
            text += [(int(x) - 16, l0 - 3, int(x) + 16, l1 + 4) for x in (r[5] if len(r) > 5 else r[4])]   # (a number's drop shadow too)
    spec = dict(text=text, rows=[(r[0], r[1], (r[1][1], r[2][1]), r[3]) for r in rows])
    orig = SR.label_xs
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    SR.figure_mask = figure_mask
    over = [] if check else None
    path = os.path.join(SRC, FILES[L])
    if L in BLANK:
        img = np.asarray(Image.open(path).convert('RGB')).copy()
        navy = np.median(img.reshape(-1, 3)[::97], axis=0).astype(np.uint8)
        for x0, y0, x1, y1 in BLANK.get(L, ()):
            img[y0:y1, x0:x1] = navy
        path = os.path.join(tempfile.gettempdir(), 'naga-sheet-%d.png' % L)
        Image.fromarray(img).save(path)
    try:
        out = SR.cut_sheet(path, spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()), overlay=over, tag='sheet %d' % L)
    finally:
        SR.label_xs = orig
        SR.figure_mask = _figure_mask
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'naga'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
    return out


def scales(c):
    """K per sheet (sheet px a game px), the turnaround the go-between for the front and the back"""
    med = lambda frs, i=0: float(np.median([body(im)[i] for _, im, _ in frs]))
    k1 = med(c[1]['idle'], 1) / HEIGHT
    turn = {nm: body(im)[0] for nm, im, _ in c[1]['turn']}
    kt = k1 * (turn['right'] + turn['left']) / 2 / med(c[1]['idle'])
    k2 = kt * med(c[2]['idle']) / turn['front']
    k3 = kt * med(c[3]['idle']) / turn['back']
    print('  K: sheet 1 %.3f, its turnaround %.3f (%.2f of its rows), the front %.3f, behind %.3f; the side idle %d px, from the front %.0f px, '
          'from behind %.0f px' % (k1, kt, kt / k1, k2, k3, HEIGHT, med(c[2]['idle'], 1) / k2, med(c[3]['idle'], 1) / k3))
    return {1: k1, 2: k2, 3: k3}


def tones(c):
    """each later sheet's body brought to sheet 1's per channel and per colour: its idle's mean RGB in each class (the red bands, the light,
    the dark; the cast's light left out) against the turnaround's view of the same side, measured on the sheet. One factor for the whole
    body would not do: the front and back drew the bands redder and broader (a fifth of the body to sheet 1's seventh, red 147 and 142 to
    its 126), the black scales as sheet 1 did -- the whole body's mean would take the red out of everything and turn the cream green."""
    def means(frs):
        px = []
        for _, im, _ in frs:
            a = np.asarray(im); bm, _ = split_glow(a, False)
            px.append(a[bm & (a[..., 3] > 0), :3].astype(float))
        p = np.concatenate(px)
        return [(w[:, None] * p).sum(0) / w.sum() for w in classes(p)]
    turn = {nm: (nm, im, box) for nm, im, box in c[1]['turn']}
    out = {}
    for L, view in ((2, 'front'), (3, 'back')):
        want, got = means([turn[view]]), means(c[L]['idle'])
        out[L] = tuple(tuple(float('%.3f' % (w / g)) for w, g in zip(wc, gc)) for wc, gc in zip(want, got))
        print('  TONE sheet %d to the turnaround\'s %s: %s' % (L, view, '; '.join('%s %s to %s: %s' % (nm, '%.0f %.0f %.0f' % tuple(gc), '%.0f %.0f %.0f' % tuple(wc), f)
              for nm, wc, gc, f in zip(('red', 'light', 'dark'), want, got, out[L]))))
    return out


def drop_one(frs):
    """eight frames to seven: drop the frame whose two neighbours are likest (the loop skips least), by their pixels at game size"""
    def diff(p, q):
        H = max(p[0].shape[0], q[0].shape[0]); W = max(p[0].shape[1], q[0].shape[1])
        def pad(fr):
            a, cx, up = fr
            o = np.zeros((H + 4, W + 40), float)
            ox = int(round((W + 40) / 2 - cx)); oy = H + 2 - a.shape[0] - up
            al = a[..., 3] > 0
            o[max(0, oy):oy + a.shape[0], max(0, ox):ox + a.shape[1]] = al[max(0, -oy):, max(0, -ox):][:o.shape[0] - max(0, oy), :o.shape[1] - max(0, ox)]
            return o
        return float(np.abs(pad(p) - pad(q)).sum())
    n = len(frs)
    cost = [diff(frs[(i - 1) % n], frs[(i + 1) % n]) for i in range(n)]
    i = int(np.argmin(cost))
    return [f for j, f in enumerate(frs) if j != i], i


def main(check=False):
    global TONE
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    TONE = tones(c)
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            floor = max(b[3] for _, _, b in frs)
            out = []
            for nm, im, box in frs:
                a = game_frame(im, K[L], TONE.get(L), glowrow=(row == 'cast'))
                out.append((a, core_x(a), int(round((floor - box[3]) / K[L]))))
            small[(L, row)] = out
        return small[(L, row)]
    src, dropped = {}, {}
    for eng, row in ROWS.items():
        side = frames_of(1, row)
        if eng == 'prone':
            side = side[::-1]                                  # rearing, then flat: it lies at its last frame and gets up by playing it back
        per = []
        for f in range(8):
            fs = side
            if (f == 0 and row in FRONT) or (f == 4 and row in BACK):
                L = 2 if f == 0 else 3
                fs = frames_of(L, row)
                if len(fs) == len(side) + 1:
                    fs, i = drop_one(fs)
                    dropped[(L, row)] = i + 1
            per.append(fs)
        counts = {len(s) for s in per}
        if len(counts) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, sorted(counts)))
        src[eng] = per
    for (L, row), i in sorted(dropped.items()):
        print('  sheet %d %s: frame %d dropped (%d to the side\'s %d)' % (L, row, i, len(c[L][row]), len(c[1][row])))
    def rise(a, up):                                           # how far a frame reaches above the foot
        ys = np.where(a[..., 3].any(1))[0]
        return ys[-1] - ys[0] + up
    AY = int(max(rise(a, up) for per in src.values() for fs in per for a, _, up in fs)) + 3
    FH = AY + 8
    frames, sizes, lost = {}, {}, []
    for eng, per in src.items():
        half = max(max(cx, a.shape[1] - cx) for fs in per for a, cx, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, fs in enumerate(per):
            row = []
            for a, cx, up in fs:
                if f in (1, 2, 3):
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, fw // 2, FH, AY)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'naga_p2'
    fw0 = sizes['idle'][0]
    pix.write_sheet(name, frames, fw0, FH, fw0 // 2, AY, pix.top_of([fr for f in (0, 4, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    meta['source'] = ('generated by Griz (2026-10-08: three GPT sheets -- the side with its turnaround, then one from the front and one from '
                      'behind, the re-roll), cut by tools/naga-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    print('  frame %d high, the foot at %d; widths %s' % (FH, AY, ', '.join('%s %d' % (e, s[0]) for e, s in sizes.items())))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'naga')
        lineup(os.path.join(d, 'lineup.png'))


def lineup(path):
    """the gnoll (Medium), the old stand-in, the naga (E, S, N idle, E cast), the troll (Large), at 4x on a grey floor (its size, for the eye)"""
    def first(name, anim, f, i=0):
        m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
        im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
        an = m['anims'][anim]
        y = an['y'] + f * an['fh']
        a = im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']]
        xs = np.where(a[..., 3].any(0))[0]                      # (its own columns only: the frames are wide)
        return a[:, xs[0]:xs[-1] + 1], an['ax'] - xs[0], an['ay']
    figs = [first('gnoll_p2', 'idle', 6), first('naga_p1', 'idle', 6), first('naga_p2', 'idle', 6), first('naga_p2', 'idle', 0),
            first('naga_p2', 'idle', 4), first('naga_p2', 'cast', 6, 3), first('troll_p1', 'idle', 6)]
    W = sum(a.shape[1] for a, _, _ in figs) + 10 * len(figs)
    top = max(ay for _, _, ay in figs); H = top + max(a.shape[0] - ay for a, _, ay in figs)
    canvas = np.zeros((H, W, 4), np.uint8); canvas[..., :3] = (70, 74, 70); canvas[..., 3] = 255
    x = 5
    for a, ax, ay in figs:
        y0 = top - ay
        sub = canvas[y0:y0 + a.shape[0], x:x + a.shape[1]]
        al = a[..., 3:4] / 255.0
        sub[..., :3] = (a[..., :3] * al + sub[..., :3] * (1 - al)).astype(np.uint8)
        x += a.shape[1] + 10
    Image.fromarray(canvas).resize((W * 4, H * 4), Image.NEAREST).save(path)


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])

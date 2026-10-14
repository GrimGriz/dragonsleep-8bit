"""DEEP16 pipeline 2 (generated art): the ochre jelly's three GPT pages (ART-02) -> ochrejelly_p2, and its Split halves' ochrejellym_p2 (the
same cut one size down). The green Slime stand-ins, ochrejelly_p1 and ochrejellym_p1, stay on disk.

    python tools/ochrejelly-sheet.py            (writes deep16/art/ochrejelly_p2.png/.json and ochrejellym_p2.png/.json)
    python tools/ochrejelly-sheet.py check      (also the cut overlays dev/visions/ochrejelly/cut-<n>.png, a lineup beside its peers with
                                                 each one's footprint drawn, and every row in facings E, S, N and W: facing-<f>.png)

Sources (gitignored, the main checkout's -- a worktree reads them there), deep16/_src/ochrejelly/, the art desk's ART-02 (assignment
ART-02-ochre-jelly.md; its log ART-CUTTER-HANDOFF.md), matched to the page IDs by the desk, 2026-10-14:
  ART-02_HEAD-1_PAGE-1  Ochre Jelly Isometric Sprite Sheet-1.png   a portrait, a turnaround (Front, Right, Back, Left), then Idle 6, Ooze 8,
                        Pseudopod 6 -- from the bottom-right, every frame facing the bottom-right corner.
  ART-02_HEAD-1_PAGE-2  Flinch and Fall pixel sprite sheet-3.png   Flinch 4, Fall 6, the same view (the art desk's scale-corrected page; the
                        larger one in superseded/ is not read).
  ART-02_HEAD-2_PAGE-1  Amber Jelly Climb Sprite Sheet-4.png       Climb 6, from the top-right, behind it, reaching up toward the top-right.
Rows: Idle -> idle; Ooze -> walk; Pseudopod -> `pseudopod` and `attack` (battle.js plays a row named for the attack, "Pseudopod"; `attack`
the fallback), its `release` frame 3 (engine index; the sheet's 4, the arm slapped flat on the floor); Flinch -> flinch; Fall -> hurt (its
last frame the flat smear); Climb -> climb. No prone row (SRD 5.1: immune to prone). The portrait and the turnaround are not cut.
Facings: a jelly has no face. HEAD 1's rows play in every facing, as drawn in S, N, NE, E and SE and mirrored in SW, W and NW; the climb is
HEAD 2's in every facing, mirrored the same three. Every row has its one frame count in every facing.
The mask: `chan` (any one channel more than CHAN off the navy -- the darkmantle's way): the jelly's outline is black and its soft edge a dark
navy that the house's grey-or-far sum drops; the navy is flat (no pixel of it more than 16 off its median on any page), so CHAN 30 keeps the
outline's whole edge and nothing of the ground (proved on the climb, the darkest drawing: every pixel the grey test keeps, it keeps).
Every frame is one blob but Flinch 2, whose two droplets thrown off to its right (toward the bottom-right) go with it (sheetrows' loose bits
to the nearest frame; `check` prints each frame's blobs).
Scale: K (sheet px a game px), one creature in every row and facing. A mound's measure is its spread: page 1's idle is WIDTH px wide at game
size (no outline), its base filling its Large 2x2 footprint (the art's base ellipse, its widest row to its bottom, inside the 128x64 diamond
of two squares by two at its centre). Every other row meets that idle by area -- the median sqrt of its resting frames' areas against the
idle's: GPT drew the rows of one page at different sizes as well as the pages (on page 1 the Ooze row's first frame is 0.89 of the idle and
the Pseudopod's rest frames 0.95; on page 2 the Flinch's rest frames are 1.07 and the Fall's first 0.99; page 3's Climb 1, the jelly gathered
into a heap before it rises, 1.52). REST names each row's resting frames. What each row means is kept on top of that: the Ooze's front
edge rolling out, the Pseudopod's reach, the Fall spreading flat, the Climb stretching up (its last frame 1.16 times its first by sqrt area,
as drawn). The halves of its Split (ochrejellym_p2) are the same cut at HALF of the size: Large to Medium, ten feet to five, the base filling
one square as the whole fills its four (the stand-ins' pair was 0.52 by top, 32 of 62). At game size (2026-10-14): the idle 106-109 px wide
and 53-57 tall with its outline, top 35 (the stand-in ochrejelly_p1: 92 wide, 71 tall, top 62; cube_p2 90 by 72); the half 54-55 wide, top 19.
Feet: the idle's base is centred on the foot (a Large unit's foot is the middle of its 2x2): the widest row of its base (the rim's middle,
measured on the idle) on AY, so the rim's front runs SINK px below it. Every row's resting frame stands its base on that same line; the
row's other frames keep where the page drew them against it (a front edge rolling forward reaches lower on the screen).
x: each frame by its row's AXIS -- 'label', its number's x (the generator's cell, under the jelly at rest: the Ooze's front and the
Pseudopod's arm reach forward of it, the Fall spreads round it); 'core', the body's thick middle (the Flinch: against its numbers its two
rest frames' bodies sit 15 sheet px apart); 'base', the middle of the lowest BASE px of the frame (the Climb: the heap's foot stays where it is while
its top leans up and over toward the wall).
Colour: the later pages are toned to page 1 per channel, each channel's mean and spread matched (the clacker's way: page 2 came out more
saturated as well as warmer, its blue near nothing in the midtones), measured on resting frames (page 2's Flinch 1 and 4 and Fall 1, page
3's Climb 1) against page 1's idle, inside each figure (the outline eroded away); the numbers are printed.
Seen at game size (the art log's open checks, 2026-10-14): Flinch 2's droplets stay in their frame. The Climb reads as an upright heap
rearing up and leaning over toward the top-right (top-left mirrored), its foot pooled on the floor -- not a body flattened on a wall -- and
its loop snaps from frame 6 (116 px tall) back to frame 1's heap (69); a re-roll is the desk's call, not a cutter's. The Ooze's loop snaps
too: its front edge rolls out over eight frames (100 px wide to 124) and is back in at frame 1.
"""
import os, sys, json, subprocess, tempfile
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

FILES = {1: os.path.join('ochrejelly', 'Ochre Jelly Isometric Sprite Sheet-1.png'), 2: os.path.join('ochrejelly', 'Flinch and Fall pixel sprite sheet-3.png'),
         3: os.path.join('ochrejelly', 'Amber Jelly Climb Sprite Sheet-4.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
CHAN = 30
# per page: text boxes (a blob wholly inside one is lettering: the row names; every row's number strip is added below), and its rows:
# (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe) -- probed 2026-10-14. A band runs from the middle of the
# strip above (the first row's top as given) to the middle of its own strip.
SHEETS = {
  1: dict(text=[(20, 350, 100, 390), (18, 535, 100, 572), (24, 736, 196, 780)],
          rows=[('idle', (0, 285, 1774, None), (439, 458), NUM(6), [270, 526, 782, 1037, 1294, 1550]),
                ('ooze', (0, None, 1774, None), (615, 634), NUM(8), [215, 417, 619, 819, 1021, 1222, 1427, 1630]),
                ('pseudopod', (0, None, 1774, None), (822, 841), NUM(6), [309, 538, 790, 1063, 1337, 1576])]),
  2: dict(text=[(28, 265, 140, 306), (28, 580, 98, 620)],
          rows=[('flinch', (0, 200, 1774, None), (360, 390), NUM(4), [328, 680, 1063, 1415]),
                ('fall', (0, None, 1774, None), (679, 707), NUM(6), [242, 510, 775, 1047, 1321, 1596])]),
  3: dict(text=[(22, 428, 118, 464)],
          rows=[('climb', (0, 190, 1774, None), (601, 624), NUM(6), [246, 515, 780, 1046, 1318, 1578])]),
}
# the engine's rows: (page, row)
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'ooze'), 'attack': (1, 'pseudopod'), 'pseudopod': (1, 'pseudopod'), 'flinch': (2, 'flinch'),
        'hurt': (2, 'fall'), 'climb': (3, 'climb')}
REST = {(1, 'idle'): None, (1, 'ooze'): [0], (1, 'pseudopod'): [0, 5], (2, 'flinch'): [0, 3], (2, 'fall'): [0], (3, 'climb'): [0]}   # (None: all)
AXIS = {'idle': 'label', 'ooze': 'label', 'pseudopod': 'label', 'flinch': 'core', 'fall': 'label', 'climb': 'base'}
BASE = 40                 # sheet px: the climb's foot, the lowest rows of each frame
TONE_FROM = {2: [('flinch', 0), ('flinch', 3), ('fall', 0)], 3: [('climb', 0)]}
MIRROR = (1, 2, 3)        # SW, W, NW: HEAD 1 faces the bottom-right, HEAD 2 the top-right
NEW = ['pseudopod']       # this cutter's own row (named here, not in pixelate.py)
FPS = {'idle': 5, 'walk': 8, 'attack': 10, 'pseudopod': 10, 'flinch': 8, 'hurt': 8, 'climb': 8}
RELEASE = {'pseudopod': 3, 'attack': 3}   # (engine index: the sheet's frame 4, the arm slapped down flat -- battle.js lands the blow on it)
WIDTH = 104               # the idle's spread at game size, px without its outline (its base ellipse then fits the 2x2 diamond)
HALF = 0.5                # the Split's halves: one size down, ten feet to five
VIS = os.path.join(ROOT, 'dev', 'visions', 'ochrejelly')


def body(im):
    """a cut frame's measures on the sheet: sqrt of its area (holes filled), its width and height"""
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    ys, xs = np.where(m)
    return float(np.sqrt(m.sum())), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)


def rim(im):
    """sheet px from the bottom of a mound to the widest row of its base (the lowest 40% of it): the base ellipse's middle"""
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    rows = np.where(m.any(1))[0]
    m = m[rows[0]:rows[-1] + 1]
    w = m.sum(1)
    y0 = int(len(w) * 0.6)
    return len(w) - 1 - (y0 + int(np.argmax(w[y0:])))


def cut(L, check=False):
    s = SHEETS[L]
    rows, prev = [], None
    for r in s['rows']:
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        if prev is not None:
            y0 = prev
        y1 = (l0 + l1) // 2
        prev = y1
        rows.append((r[0], (x0, y0, x1, y1)) + tuple(r[2:]))
    hand = {(r[1][0], r[1][1]): r[4] for r in rows}
    orig = SR.label_xs
    spec = dict(text=s['text'] + [(r[1][0], r[2][0] - 3, r[1][2], r[2][1] + 4) for r in rows],   # (a number's drop shadow runs past its strip)
                rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows], chan=CHAN)
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    over = [] if check else None
    try:
        out = SR.cut_sheet(os.path.join(SRC, FILES[L]), spec, overlay=over, tag='page %d' % L)
    finally:
        SR.label_xs = orig
    labx = {r[0]: r[4] for r in rows}
    out = {row: [(nm, im, box, labx[row][i]) for i, (nm, im, box) in enumerate(frs)] for row, frs in out.items()}
    if check:
        os.makedirs(VIS, exist_ok=True)
        over[0].save(os.path.join(VIS, 'cut-%d.png' % L))
        for row, frs in out.items():                                 # each frame's blobs: a droplet thrown off stays with its own frame
            blobs = []
            for nm, im, box, lx in frs:
                lab, n = ndimage.label(np.asarray(im)[..., 3] > 0, structure=np.ones((3, 3)))
                blobs.append('%s:%d' % (nm, n) if n == 1 else '%s:%d %s' % (nm, n, sorted(int(v) for v in ndimage.sum(lab > 0, lab, range(1, n + 1)))))
            print('  page %d %s blobs: %s' % (L, row, ', '.join(blobs)))
    return out


def inside(im):
    """the figure's colours with its outline eroded away (what the tone measures)"""
    a = np.asarray(im).astype(float)
    return a[ndimage.binary_erosion(a[..., 3] > 0, iterations=3)][:, :3]


def tones(c):
    """per later page: each channel's mean and spread matched to page 1's idle (TONE_FROM: the resting frames measured)"""
    dst = np.concatenate([inside(f[1]) for f in c[1]['idle']])
    mu_d, sd_d = dst.mean(0), dst.std(0)
    T = {}
    for L, picks in TONE_FROM.items():
        src = np.concatenate([inside(c[L][row][i][1]) for row, i in picks])
        mu_s, sd_s = src.mean(0), src.std(0) + 1e-6
        T[L] = (mu_s, sd_s, mu_d, sd_d)
        print('  TONE page %d: mean %s spread %s -> page 1 idle mean %s spread %s'
              % (L, np.round(mu_s).astype(int).tolist(), np.round(sd_s).astype(int).tolist(), np.round(mu_d).astype(int).tolist(), np.round(sd_d).astype(int).tolist()))
    return T


def toned(im, t):
    a = np.asarray(im).astype(float)
    mu_s, sd_s, mu_d, sd_d = t
    a[..., :3] = np.clip((a[..., :3] - mu_s) / sd_s * sd_d + mu_d, 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def game_frame(im, k, tone=None):
    """a cut frame at game size (premultiplied box down, a px of margin for the outline), palette-snapped and outlined; and its x scale"""
    if tone:
        im = toned(im, tone)
    w, h = im.size
    small = im.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (small.width + 2, small.height + 2), (0, 0, 0, 0))
    pad.paste(small, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False), small.size[0] / float(w)


def anchor_x(how, a, im, box, lx, sx):
    """a frame's x on its game-size array (see AXIS in the head)"""
    if how == 'label':
        return 1 + (lx - box[0]) * sx
    if how == 'core':
        d = ndimage.distance_transform_edt(a[..., 3] > 0)
        return float(np.where(d >= 0.7 * d.max())[1].mean())
    m = np.asarray(im)[..., 3] > 0                                     # 'base': the lowest BASE sheet px of the frame
    rows = np.where(m.any(1))[0]
    ys, xs = np.where(m[rows[-1] - BASE + 1:rows[-1] + 1])
    return 1 + xs.mean() * sx


def scales(c):
    """K per (page, row): page 1's idle WIDTH px wide; every row's resting frames meet the idle by area"""
    idle = c[1]['idle']
    med = lambda frs, i: float(np.median([body(f[1])[i] for f in frs]))
    k1 = med(idle, 1) / WIDTH
    a1 = med(idle, 0)
    K = {}
    for (L, row), rest in REST.items():
        frs = c[L][row] if rest is None else [c[L][row][i] for i in rest]
        K[(L, row)] = k1 * med(frs, 0) / a1
    sink = float(np.median([rim(f[1]) for f in idle])) / k1
    print('  K: idle %.3f (its spread %d sheet px, %d at game size; it stands %.0f px, its rim\'s middle %.1f px over its bottom); '
          % (k1, med(idle, 1), WIDTH, med(idle, 2) / k1, sink)
          + ', '.join('%s %.3f (%.3f of the idle)' % (row, K[(L, row)], K[(L, row)] / k1) for (L, row) in REST if row != 'idle'))
    return K, sink


def build(c, K, T, sink, half=1.0):
    """every engine row's frames, 8 facings, at 1/half of K: -> (frames, sizes, FH, AY)"""
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs, k, rest = c[L][row], K[(L, row)] / half, REST[(L, row)]
            floor = float(np.median([f[2][3] for f in (frs if rest is None else [frs[i] for i in rest])]))   # (the resting frames' bottom)
            out = []
            for nm, im, box, lx in frs:
                a, sx = game_frame(im, k, T.get(L))
                out.append((a, anchor_x(AXIS[row], a, im, box, lx, sx), (floor - box[3]) / k))
            small[(L, row)] = out
        return small[(L, row)]
    src = {eng: [(frames_of(*by), f in MIRROR) for f in range(8)] for eng, by in ROWS.items()}
    sk = sink * half
    # the frame: every row but the climb shares one height and foot (the cube's FH 120, AY 108 where they fit); the climb has its own
    def extents(engs):
        rise = drop = 0
        for eng in engs:
            for fs, _ in src[eng]:
                for a, cx, up in fs:
                    rows = np.where(a[..., 3].any(1))[0]
                    bottom = sk - up                                      # (px below AY of the frame's last opaque row, its outline)
                    rise, drop = max(rise, rows[-1] - rows[0] - bottom), max(drop, bottom + 1)
        return int(np.ceil(rise)), int(np.ceil(drop))
    rise, drop = extents([e for e in ROWS if e != 'climb'])
    AY = max(rise + 4, int(round(108 * half)))
    FH = AY + max(drop + 4, int(round(12 * half)))
    crise, cdrop = extents(['climb'])
    CAY = max(crise + 4, AY)
    CFH = CAY + FH - AY
    frames, sizes, lost = {}, {}, []
    for eng, per in src.items():
        fh, ay = (CFH, CAY) if eng == 'climb' else (FH, AY)
        hw = max(max(cx, a.shape[1] - cx) for fs, _ in per for a, cx, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(int(96 * half) if half < 1 else 96, int(np.ceil((2 * hw + 4) / 8.0)) * 8)
        sizes[eng] = (fw, fh, fw // 2, ay)
        frames[eng] = []
        for f, (fs, mirrored) in enumerate(per):
            row = []
            for a, cx, up in fs:
                if mirrored:
                    a, cx = a[:, ::-1], a.shape[1] - cx
                out = np.zeros((fh, fw, 4), dtype=np.uint8)
                last = np.where(a[..., 3].any(axis=1))[0][-1]
                ox, oy = int(round(fw // 2 - cx)), int(round(ay + sk - up)) - last
                h, w = a.shape[:2]
                y0, x0 = max(0, oy), max(0, ox)
                y1, x1 = min(fh, oy + h), min(fw, ox + w)
                out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
                if (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum():
                    lost.append('%s facing %d' % (eng, f))
                row.append(out)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    return frames, sizes, FH, AY


def write(name, frames, sizes, FH, AY, note):
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    pix.write_sheet(name, frames, sizes['idle'][0], FH, sizes['idle'][0] // 2, AY,
                    pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    for row, k in RELEASE.items():
        meta['anims'][row]['release'] = k
    meta['source'] = ('generated by Griz (2026-10-09, the art desk\'s ART-02: three GPT pages -- HEAD 1\'s rows with a turnaround, its Flinch '
                      'and Fall, HEAD 2\'s Climb), cut by tools/ochrejelly-sheet.py' + note)
    json.dump(meta, open(meta_p, 'w'), indent=1)
    h = lambda fr: np.where(fr[..., 3].any(axis=1))[0]
    print('  %s: top %d; idle E: %s px tall, %s wide (with its outline); the climb\'s last frame %d tall' % (
        name, meta['top'], [int(h(fr)[-1] - h(fr)[0] + 1) for fr in frames['idle'][6]][:3],
        [int(np.ptp(np.where(fr[..., 3].any(0))[0]) + 1) for fr in frames['idle'][6]][:3], h(frames['climb'][6][-1])[-1] - h(frames['climb'][6][-1])[0] + 1))


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K, sink = scales(c)
    T = tones(c)
    frames, sizes, FH, AY = build(c, K, T, sink)
    write('ochrejelly_p2', frames, sizes, FH, AY, '')
    frames_m, sizes_m, FH_m, AY_m = build(c, K, T, sink, HALF)
    write('ochrejellym_p2', frames_m, sizes_m, FH_m, AY_m, ' at %.2f of ochrejelly_p2\'s size (its Split\'s halves, one size down)' % HALF)
    if check:
        lineup(os.path.join(VIS, 'lineup.png'))
        for name in ('ochrejelly_p2', 'ochrejellym_p2'):
            facings(name, VIS)


def first(name, anim, f, i=0):
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims'][anim]
    y = an['y'] + f * an['fh']
    return im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']], an['ax'], an['ay']


def lineup(path, scale=3):
    """on their feet (each sheet's ax, ay), each over its footprint's diamond (64x32 a square): the hobgoblin, the half's stand-in and the
    half (E), the stand-in and the jelly (E, S, W, N), its climb's last frame (E), the cube, the troll -- his size, for Griz's eye"""
    figs = [(first('hobgoblin_p2', 'idle', 6), 1), (first('ochrejellym_p1', 'idle', 6), 1), (first('ochrejellym_p2', 'idle', 6), 1),
            (first('ochrejelly_p1', 'idle', 6), 2), (first('ochrejelly_p2', 'idle', 6), 2), (first('ochrejelly_p2', 'idle', 0), 2),
            (first('ochrejelly_p2', 'idle', 2), 2), (first('ochrejelly_p2', 'idle', 4), 2), (first('ochrejelly_p2', 'climb', 6, 5), 2),
            (first('cube_p2', 'idle', 6), 2), (first('troll_p1', 'idle', 6), 2)]
    cols = [max(a.shape[1], 64 * s + 4) for (a, ax, ay), s in figs]
    W = sum(cols) + 6 * len(figs)
    top = max(ay for (a, ax, ay), s in figs); H = top + max(max(a.shape[0] - ay, 16 * s + 3) for (a, ax, ay), s in figs)
    canvas = Image.new('RGB', (W, H), (70, 74, 70)); dr = ImageDraw.Draw(canvas)
    x = 3
    for ((a, ax, ay), s), cw in zip(figs, cols):
        fx = x + cw // 2
        dr.polygon([(fx - 32 * s, top), (fx, top - 16 * s), (fx + 32 * s, top), (fx, top + 16 * s)], outline=(110, 40, 40))
        x0, y0 = fx - ax, top - ay
        canvas.paste(Image.fromarray(a), (x0, y0), Image.fromarray(a[..., 3]))
        x += cw + 6
    canvas.resize((W * scale, H * scale), Image.NEAREST).save(path)


def facings(name, d, scale=4):
    """every row's frames for facings E, S, N and W, read back off the written png, a grid a facing (a line a row, each row cropped to its
    ink; the foot's row ticked red)"""
    meta = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    for f, nm in ((6, 'E'), (0, 'S'), (4, 'N'), (2, 'W')):
        lines = []
        for eng, an in meta['anims'].items():
            fs = [first(name, eng, f, i)[0] for i in range(an['frames'])]
            ink = np.any([fr[..., 3] > 0 for fr in fs], axis=0)
            ys, xs = np.where(ink)
            x0, x1, y0 = max(0, xs.min() - 2), xs.max() + 3, max(0, ys.min() - 2)
            fh, ay = an['fh'], an['ay']
            cells = []
            for fr in fs:
                cell = np.zeros((fh + 2 - y0, x1 - x0, 3), np.uint8); cell[:] = (70, 74, 70)
                al = fr[y0:, x0:x1, 3:4] / 255.0
                cell[:fh - y0] = (fr[y0:, x0:x1, :3] * al + cell[:fh - y0] * (1 - al)).astype(np.uint8)
                cell[ay - y0, :2] = (200, 40, 40); cell[ay - y0, -2:] = (200, 40, 40)
                cells.append(cell); cells.append(np.full((cell.shape[0], 4, 3), 20, np.uint8))
            lines.append(np.concatenate(cells, 1))
        W = max(l.shape[1] for l in lines)
        grid = np.concatenate([np.pad(l, ((0, 4), (0, W - l.shape[1]), (0, 0)), constant_values=20) for l in lines], 0)
        Image.fromarray(grid).resize((grid.shape[1] * scale, grid.shape[0] * scale), Image.NEAREST).save(os.path.join(d, '%s-facing-%s.png' % (name, nm)))


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])

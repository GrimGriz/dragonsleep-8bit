"""DEEP16 pipeline 2 (generated art): the art desk's three GPT pages of the gray ooze -> grayooze_p2 (grayooze_p1, the Slime stand-in, stays on disk).

    python tools/grayooze-sheet.py            (writes deep16/art/grayooze_p2.png/.json)
    python tools/grayooze-sheet.py check      (also the cut overlays dev/visions/grayooze/cut-<n>.png, the key's proof on the palest and the
                                               darkest frames, every row a facing (facing-<E|S|N|W>.png) and a lineup beside its peers)

Sources (gitignored, the main checkout's -- a worktree reads them there), sorted 10-14 into deep16/_src/grayooze/ and matched to the art
desk's page IDs by eye (the desk's brief, 2026-10-14; the art log, deep16/_src/art-desk/ENGINE-ART-HANDOFF-2026-10-14/ART-CUTTER-HANDOFF.md,
ART-03, and its assignment ART-03-gray-ooze.md, Griz's paste from deep16-art-wanted.md §1):
  ART-03_HEAD-1_PAGE-1  Gray Ooze Sprite Animation Sheet-1.png       from the bottom-right: a portrait, a turnaround (Front, Right, Back, Left),
                                                                      then rows numbered under each frame: Idle 6, Ooze 8, Pseudopod 6
  ART-03_HEAD-1_PAGE-2  Normalized flinch and fall slime sprites.png  from the bottom-right, rows only: Flinch 4, Fall 6 (the art desk's
                                                                      scale-corrected page; the larger one, in grayooze/superseded/, is not read)
  ART-03_HEAD-2_PAGE-1  Floating slime climb sprite sheet-2.png      from behind, toward the top-right: Climb 6 (the selected climb, no puddle
                                                                      base; the standing-mound one, in superseded/, is not read)
Rows: Idle -> idle; Ooze -> walk; Pseudopod -> `pseudopod` (battle.js plays a row named for the attack's name: SRD Pseudopod) and `attack`
(the fallback, the same frames), its `release` the slam, Pseudopod 4 -> index 3 (battle.js strikes on it); Flinch -> flinch (the living hit,
played once); Fall -> hurt (the death: it thins and dries into a dull stain, the last frame kept a frame); Climb -> climb. No prone row (SRD 5.1:
immune to prone). `pseudopod` is this cutter's own row name (appended to pix.ANIM_ORDER here).
Facings: faceless -- HEAD 1's rows in every facing as drawn, SW, W and NW mirrored; the climb HEAD 2's in every facing, SW, W, NW mirrored.
Every row has one frame count in every facing (one drawing).
Scale: one for the creature. Page 1's idle (the puddle at rest) is WIDTH px wide in the game -- 83% of a 64x32 tile, a Medium ooze covering
its square (the Slime stand-in, grayooze_p1, was a 40-45 px ball standing 31 over its foot). Every other row meets that idle by AREA
(sqrt of the frame's filled area; a mound changes shape, so neither its width nor its height holds across rows -- the walk's rest is narrower
and taller than the idle's, the flinch's a little taller) by its frames at rest (REST): the ooze 1 and 8, the pseudopod 1 and 6, the flinch
1 and 4, the fall 1 and 2 (the mound before it thins); the reach, the splash and the spread are kept as drawn around that. The climb has no
rest frame and is drawn about twice the size (its canvas is 2172x724 against 1650x953, but the scale is the body's, not the canvas's): all
six frames' median area meets the idle's (on a wall seen from behind the body shows about the area it shows on the floor). The numbers,
printed by scales(): page 1's rows within 7% of the idle (the ooze 0.93 of it, the pseudopod 1.02), page 2 1.04 and 0.93, the climb 1.97.
The turnaround is drawn a size up (1.17-1.23 of the idle) and is not used.
Foot: the rows' drawn floor (each row's median frame bottom) sits SINK px under the foot, so the idle's rim -- its widest line, the middle of
the ground it covers -- is on the foot and the puddle centres on its tile. x: each frame by its body's thick middle (the mound), so the walk's
front and the pseudopod reach forward of it and the mound holds still.
Key: per channel (sheetrows `chan`, CHAN): the navy (10 24 56 / 4 26 70 / 8 27 62 on the three pages; off the figures it varies 6 or less
a channel) against the drawn outline, which is black and fades into the navy: sheetrows' default grey/far test left the outline's dark edge
out of the palest frame (the fall's last, a pale stain: the ring outside its cut ran 30 off the navy at the median), the channel test takes
it to the navy (9 at the median); `check` prints the proof on the palest and the darkest frame and saves key-palest.png / key-darkest.png.
Loose bits: the flinch's splashed lobes (Flinch 3) and droplets (Flinch 2), the fall's last beads and the climb's drips each go to their own
frame by sheetrows' growth (the cut overlays show each frame one colour).
Colour: the later pages came lighter and warmer (GPT's drift), so each is brought to page 1's idle per channel (TONE, computed: the insides,
4 px in from the edge, of page 2's flinch at rest and of the whole climb, against the idle's).
"""
import os, sys, json, subprocess
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

FILES = {1: os.path.join('grayooze', 'Gray Ooze Sprite Animation Sheet-1.png'),             # ART-03_HEAD-1_PAGE-1
         2: os.path.join('grayooze', 'Normalized flinch and fall slime sprites.png'),       # ART-03_HEAD-1_PAGE-2 (the scale-corrected page)
         3: os.path.join('grayooze', 'Floating slime climb sprite sheet-2.png')}            # ART-03_HEAD-2_PAGE-1 (the selected climb)
SRC = os.path.join(ROOT, 'deep16', '_src')                 # the pages live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per page: text boxes (a blob wholly inside one is lettering: the row names; every row's number strip is added below), the portrait,
# and its rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x by hand or None for sheetrows' probe) -- probed 10-14
SHEETS = {
  1: dict(text=[(0, 340, 185, 953)], portrait=(0, 30, 540, 282),
          rows=[('turn', (540, 90, 1650, 244), (244, 282), TURN, [657, 936, 1221, 1491]),      # (the portrait's highlights read as labels)
                ('idle', (0, 290, 1650, None), (452, 474), NUM(6), None),
                ('ooze', (0, None, 1650, None), (643, 666), NUM(8), None),
                ('pseudopod', (0, None, 1650, None), (876, 898), NUM(6), None)]),
  2: dict(text=[(0, 330, 135, 700)],
          rows=[('flinch', (0, 250, 1650, None), (443, 470), NUM(4), None),
                ('fall', (0, None, 1650, None), (717, 744), NUM(6), None)]),
  3: dict(text=[(0, 370, 165, 440)],
          rows=[('climb', (0, 90, 2172, None), (531, 568), NUM(6), None)]),
}
CHAN = 20          # the key: a pixel is figure when any one channel is this far from its page's navy (sheetrows `chan`; see the head)

# the engine's rows: (page, row)
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'ooze'), 'attack': (1, 'pseudopod'), 'pseudopod': (1, 'pseudopod'),
        'flinch': (2, 'flinch'), 'hurt': (2, 'fall'), 'climb': (3, 'climb')}
NEW = ['pseudopod']                    # this cutter's own row (named here, not in pixelate.py)
FPS = {'idle': 5, 'walk': 8, 'attack': 10, 'pseudopod': 10, 'flinch': 8, 'hurt': 8, 'climb': 8}
RELEASE = {'attack': 3, 'pseudopod': 3}            # the slam: Pseudopod 4 (human) -> index 3, the arm flat on the foe (battle.js strikes on it)
# each row's body at rest, the frames (0-based) that meet the idle by area: the ooze, the pseudopod and the flinch begin and end at rest, the
# fall's first two are the mound before it thins; the climb has no rest frame, so all of it
REST = {(1, 'ooze'): (0, 7), (1, 'pseudopod'): (0, 5), (2, 'flinch'): (0, 3), (2, 'fall'): (0, 1), (3, 'climb'): (0, 1, 2, 3, 4, 5)}
TONE_REF = {2: ('flinch', (0, 3)), 3: ('climb', (0, 1, 2, 3, 4, 5))}   # each later page's frames toned to page 1's idle, per channel
WIDTH = 52         # the idle's median width, game px without the outline
SINK = 7           # the row's drawn floor sits this far below the foot (AY), game px: the idle's rim ends (its widest row) 7-8 above its bottom
FH, AY = 80, 64
X_BY = {}          # (page, row) -> 'label' to place a frame by its number's x; the rest by the body's thick middle


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def game_frame(im, k, tone=None):
    """a cut frame at game size, palette-snapped and outlined; and its x scale"""
    if tone:
        im = toned(im, tone)
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX if k >= 1 else Image.LANCZOS)
    return pix.pixelate(small, 1, do_lift=False), small.size[0] / float(w)


def core_x(a):
    """x of the body's thick middle (the mound; the arm, the trailing drips and the splashed lobes are thinner)"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def body(im):
    """a cut frame's measures on the page: sqrt of its area (holes filled), its height and its width"""
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    ys, xs = np.where(m)
    return float(np.sqrt(m.sum())), int(ys.max() - ys.min() + 1), int(xs.max() - xs.min() + 1)


def interior_rgb(frs, idx):
    """the mean colour of the given frames' insides (4 px in from the edge: the drawn outline and the key's halo left out)"""
    px = []
    for i in idx:
        a = np.asarray(frs[i][1]).astype(float)
        d = ndimage.distance_transform_edt(a[..., 3] > 0)
        px.append(a[d > 4][:, :3])
    return np.concatenate(px).mean(0)


def place(a, x_ref, up, fw, ax):
    """a 1x RGBA array onto an fw x FH frame: x_ref at ax, the lowest opaque row `up` px above AY"""
    out = np.zeros((FH, fw, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


_figure_mask = SR.figure_mask


def cut(L, check=False):
    s = SHEETS[L]
    rows, prev = [], None
    for r in s['rows']:
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        if r[0] != 'turn':
            if prev is not None:
                y0 = prev
            y1 = (l0 + l1) // 2                                   # a row's band: the middle of the strip above to the middle of its own
            prev = y1
        rows.append((r[0], (x0, y0, x1, y1)) + tuple(r[2:]))
    hand = {(r[1][0], r[1][1]): r[4] for r in rows}
    strip_of = {(r[1][0], r[1][1]): r[2] for r in rows}            # (sheetrows asks from the band's top: the probe reads the number strip alone)
    orig = SR.label_xs
    spec = dict(text=s['text'] + [(r[1][0], r[2][0] - 3, r[1][2], r[2][1] + 4) for r in rows],   # (a number's drop shadow runs past its strip)
                rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows], chan=CHAN)
    if 'portrait' in s:
        spec['portrait'] = s['portrait']
    labx = {}
    def probe(a, x0, x1, y0, y1):
        xs = hand.get((x0, y0)) or orig(a, x0, x1, *strip_of[(x0, y0)])
        labx[(x0, y0)] = xs
        return xs
    SR.label_xs = probe
    over = [] if check else None
    try:
        out = SR.cut_sheet(os.path.join(SRC, FILES[L]), spec, overlay=over, tag='page %d' % L)
    finally:
        SR.label_xs = orig
    xs_of = {r[0]: labx.get((r[1][0], r[1][1])) for r in rows}
    out = {row: [(nm, im, box, xs_of[row][i]) for i, (nm, im, box) in enumerate(frs)] for row, frs in out.items() if row in xs_of}
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'grayooze'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
    return out


def scales(c):
    """K per (page, row), page px a game px: page 1's idle by its width (WIDTH), every other row's rest against that idle by area"""
    med = lambda frs, i=0, idx=None: float(np.median([body(frs[j][1])[i] for j in (idx if idx is not None else range(len(frs)))]))
    k1 = med(c[1]['idle'], 2) / WIDTH
    a1 = med(c[1]['idle'])
    K = {(1, 'idle'): k1}
    print('  idle (page 1): width %.0f, height %.0f, sqrt-area %.1f page px -> K %.3f (width %d game px)' % (med(c[1]['idle'], 2), med(c[1]['idle'], 1), a1, k1, WIDTH))
    for (L, row), idx in REST.items():
        ar = med(c[L][row], 0, idx)
        K[(L, row)] = k1 * ar / a1
        print('  %-10s (page %d, rest %s): sqrt-area %.1f = %.3f of the idle; width %.0f, height %.0f page px -> K %.3f; at game size width %.0f, height %.0f'
              % (row, L, '+'.join(str(i + 1) for i in idx), ar, ar / a1, med(c[L][row], 2, idx), med(c[L][row], 1, idx), K[(L, row)],
                 med(c[L][row], 2, idx) / K[(L, row)], med(c[L][row], 1, idx) / K[(L, row)]))
    if 'turn' in c[1]:
        t = {nm: body(im) for nm, im, _, _ in c[1]['turn']}
        print('  (the turnaround, for the record: Front sqrt-area %.1f = %.2f of the idle, Right %.2f, Back %.2f, Left %.2f -- drawn a size up)'
              % (t['front'][0], t['front'][0] / a1, t['right'][0] / a1, t['back'][0] / a1, t['left'][0] / a1))
    return K


def tones(c):
    ref = interior_rgb(c[1]['idle'], range(len(c[1]['idle'])))
    T = {}
    for L, (row, idx) in TONE_REF.items():
        m = interior_rgb(c[L][row], idx)
        T[L] = tuple(float(v) for v in (ref / m))
        print('  TONE page %d (%s %s inside %.1f %.1f %.1f against the idle\'s %.1f %.1f %.1f): %.3f %.3f %.3f'
              % (L, row, '+'.join(str(i + 1) for i in idx), m[0], m[1], m[2], ref[0], ref[1], ref[2], T[L][0], T[L][1], T[L][2]))
    return T


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    T = tones(c)
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            k = K[(L, row)]
            floor = float(np.median([f[2][3] for f in frs]))        # the row's drawn floor: its frames' median bottom
            out = []
            for nm, im, box, lx in frs:
                a, sx = game_frame(im, k, T.get(L))
                cx = (lx - box[0]) * sx if X_BY.get((L, row)) == 'label' else core_x(a)
                out.append((a, cx, int(round((floor - box[3]) / k)) - SINK))
            small[(L, row)] = out
        return small[(L, row)]
    src = {}
    for eng, (L, row) in ROWS.items():
        src[eng] = [frames_of(L, row)] * 8                         # faceless: one drawing every facing (SW, W and NW mirrored below)
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
                fr, gone = place(a, cx, up, fw, fw // 2)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    tall = max(AY - np.where(fr[..., 3].any(1))[0][0] for rows in frames.values() for row in rows for fr in row)
    low = max(np.where(fr[..., 3].any(1))[0][-1] - AY for rows in frames.values() for row in rows for fr in row)
    print('  the tallest frame rises %d px over the foot, the lowest reaches %d below (AY %d, FH %d)' % (tall, low, AY, FH))
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'grayooze_p2'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    for row, k in RELEASE.items():
        meta['anims'][row]['release'] = k
    meta['source'] = ('generated by the art desk (ART-03, 2026-10-09: three GPT pages -- HEAD 1 from the bottom-right with its turnaround, '
                      'its flinch and fall, HEAD 2 the climb from behind), cut by tools/grayooze-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'grayooze')
        key_proof(c, d)
        lineup(os.path.join(d, 'lineup.png'))
        facings(frames, d)


def key_proof(c, d):
    """the key on the palest frame (the last of the fall, a dull stain) and the darkest (by its inside's light): each page's ring just
    outside the cut (it should be navy), against sheetrows' default grey/far test; and a 4x crop of each, the cut's edge ticked"""
    lum = {(L, row, i): float(interior_rgb(c[L][row], [i]).mean()) for L in c for row in c[L] if row != 'turn' for i in range(len(c[L][row]))}
    dark = min(lum, key=lum.get)
    pale = (2, 'fall', 5)
    print('  the key: palest by its inside fall 6 (%.0f), the darkest %s %d (%.0f)' % (lum[pale], dark[1], dark[2] + 1, lum[dark]))
    for nm, (L, row, i) in (('palest', pale), ('darkest', dark)):
        a = np.asarray(Image.open(os.path.join(SRC, FILES[L])).convert('RGB')).astype(np.int32)
        navy = np.median(a.reshape(-1, 3)[::97], axis=0)
        x0, y0, x1, y1 = c[L][row][i][2]
        x0, y0, x1, y1 = max(0, x0 - 12), max(0, y0 - 12), x1 + 12, y1 + 12
        sub = a[y0:y1, x0:x1]
        dev = np.abs(sub - navy).max(-1)
        for kn, m in (('chan %d' % CHAN, _figure_mask(a, chan=CHAN)), ('default', _figure_mask(a))):
            m = ndimage.binary_fill_holes(m[y0:y1, x0:x1])
            ring = ndimage.binary_dilation(m) & ~m
            print('    %-7s %s %d, %-8s: %5d px kept; the ring outside the cut: max channel off navy median %2.0f, p90 %2.0f, max %2d'
                  % (nm, row, i + 1, kn, m.sum(), np.median(dev[ring]), np.percentile(dev[ring], 90), dev[ring].max()))
        m = ndimage.binary_fill_holes(_figure_mask(a, chan=CHAN)[y0:y1, x0:x1])
        edge = m & ~ndimage.binary_erosion(m)
        im = sub.astype(np.uint8).copy(); im[edge] = (255, 60, 60)
        Image.fromarray(np.concatenate([sub.astype(np.uint8), im], 1)).resize(((x1 - x0) * 8, (y1 - y0) * 4), Image.NEAREST).save(
            os.path.join(d, 'key-%s.png' % nm))


def first(name, anim, f, i=0):
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims'][anim]
    y = an['y'] + f * an['fh']
    return im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']], an['ax'], an['ay']


def strip(figs, path, scale=4):
    """figures side by side on their feet (each sheet's ay), on a grey floor, at 4x, each on a 64x32 tile's outline"""
    W = sum(max(a.shape[1], 70) for a, _, _ in figs) + 10 * len(figs)
    top = max(ay for _, _, ay in figs); H = top + max(max(a.shape[0] - ay for a, _, ay in figs), 20)
    canvas = np.zeros((H, W, 4), np.uint8); canvas[..., :3] = (70, 74, 70); canvas[..., 3] = 255
    x = 5
    for a, ax, ay in figs:
        w = max(a.shape[1], 70)
        cx = x + w // 2
        for t in range(-32, 33):                                   # the tile under it: a 64x32 diamond about the foot
            dy = 16 - abs(t) // 2
            for yy in (top - dy, top + dy):
                if 0 <= yy < H and 0 <= cx + t < W:
                    canvas[yy, cx + t, :3] = (110, 116, 110)
        x0 = cx - ax
        y0 = top - ay
        ys0, xs0 = max(0, -y0), max(0, -x0)
        sub = canvas[y0 + ys0:y0 + a.shape[0], x0 + xs0:x0 + a.shape[1]]
        aa = a[ys0:ys0 + sub.shape[0], xs0:xs0 + sub.shape[1]]
        al = aa[..., 3:4] / 255.0
        sub[..., :3] = (aa[..., :3] * al + sub[..., :3] * (1 - al)).astype(np.uint8)
        x += w + 10
    canvas[top, :, :3] = (110, 40, 40)                          # (the foot's row)
    Image.fromarray(canvas).resize((W * scale, H * scale), Image.NEAREST).save(path)


def lineup(path):
    """the goblin (Small), the hobgoblin (Medium), the old stand-in, the gray ooze (E idle, S idle, the walk stretched, the pseudopod up, the
    flinch's splash, the stain, the climb at its tallest), the cube (a Large ooze) -- his size, for the desk's eye"""
    strip([first('goblin_p2', 'idle', 6), first('hobgoblin_p2', 'idle', 6), first('grayooze_p1', 'idle', 6), first('grayooze_p2', 'idle', 6),
           first('grayooze_p2', 'idle', 0), first('grayooze_p2', 'walk', 6, 4), first('grayooze_p2', 'pseudopod', 6, 2),
           first('grayooze_p2', 'pseudopod', 6, 3), first('grayooze_p2', 'flinch', 6, 2), first('grayooze_p2', 'hurt', 6, 5),
           first('grayooze_p2', 'climb', 5, 3), first('cube_p2', 'idle', 6)], path)


def facings(frames, d, scale=4):
    """every row's frames for facings E, S, N and W, read back off the written png, a grid a facing (a line a row, each row cropped to its
    ink; the foot's row ticked red)"""
    for f, nm in ((6, 'E'), (0, 'S'), (4, 'N'), (2, 'W')):
        lines = []
        for eng in frames:
            fs = [first('grayooze_p2', eng, f, i)[0] for i in range(len(frames[eng][f]))]
            ink = np.any([fr[..., 3] > 0 for fr in fs], axis=0)
            ys, xs = np.where(ink)
            x0, x1, y0 = max(0, xs.min() - 2), xs.max() + 3, max(0, ys.min() - 2)
            cells = []
            for fr in fs:
                cell = np.zeros((FH + 2 - y0, x1 - x0, 3), np.uint8); cell[:] = (70, 74, 70)
                al = fr[y0:, x0:x1, 3:4] / 255.0
                cell[:FH - y0] = (fr[y0:, x0:x1, :3] * al + cell[:FH - y0] * (1 - al)).astype(np.uint8)
                cell[AY + 1 - y0] = (110, 40, 40)
                cx = fr.shape[1] // 2 - x0
                if 0 <= cx < cell.shape[1]:
                    cell[AY + 1 - y0 - 2:AY + 1 - y0, cx] = (110, 40, 40)   # (the foot's column, a tick)
                cells.append(cell); cells.append(np.full((cell.shape[0], 4, 3), 20, np.uint8))
            lines.append(np.concatenate(cells, 1))
        W = max(l.shape[1] for l in lines)
        grid = np.concatenate([np.pad(l, ((0, 4), (0, W - l.shape[1]), (0, 0)), constant_values=20) for l in lines], 0)
        Image.fromarray(grid).resize((grid.shape[1] * scale, grid.shape[0] * scale), Image.NEAREST).save(os.path.join(d, 'facing-%s.png' % nm))


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])

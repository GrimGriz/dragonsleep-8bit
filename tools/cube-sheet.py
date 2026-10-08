"""DEEP16 pipeline 2 (generated art): Griz's two GPT sheets of the gelatinous cube -> cube_p2 (cube_p1, the green Slime stand-in, stays on disk).

    python tools/cube-sheet.py            (writes deep16/art/cube_p2.png/.json)
    python tools/cube-sheet.py check      (also the cut overlays, dev/visions/cube/cut-<n>.png, and a lineup beside the troll and the gnoll)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/Fresh/Gelatinous Cube Animation Sheet-3.png (the side:
a portrait, a turnaround Front, Right, Back, Left, then rows facing RIGHT, numbered: idle 6, slide 8, engulf 8, digest 6, flinch 4, fall 6)
and Teal Jelly Cube Turnaround Sprite Sheet-1.png (despite its name no turnaround: four rows, Slide Front 8, Engulf Front 8, Slide Back 8,
Engulf Back 8) -- Griz, 2026-10-08, the pastes in deep16-art-in-hand.md ("The stand-ins' first sheets", "The six's fronts and backs").
Rows: Idle -> idle, Slide -> walk, Engulf -> `engulf` and `attack` (the fallback), Digest -> `digest`, Flinch -> flinch, Fall -> hurt
(battle.js plays a row named for the attack's name lowercased: its attacks are Engulf and Digest). No prone row (SRD 5.1: immune to prone).
Facings: NE, E and SE take the side rows as drawn, SW, W and NW mirrored; S takes sheet 2's Front rows and N its Back rows for walk, engulf
and attack; idle, digest, flinch and hurt play side-on from S and N too (a cube reads the same from any side but where it surges). Every
front and back row came with its side row's count (8), so nothing is fitted.
The jelly is drawn clear: the sheet's navy shows through its middle, so sheetrows' figure mask keeps only the bright edges, the things inside
and the lit faces -- FILLED here (every hole in a figure is jelly; nothing on these sheets has a real hole), so each frame is the whole box.
Its glassy edges are lit cyan on both sheets and the mask holds them.
x: each frame is placed by its number's x (the generator's cell centre, under the cube at rest in every row: a surge goes forward of it, a
puddle spreads both ways round it), not by the body's thick middle -- the cube has no thin parts, so its middle drifts forward with the surge.
Scale: the side idle stands HEIGHT px (today's stand-in, cube_p1, stands 73 with its outline). Sheet 2 has no turnaround and draws the cube
bigger, so it meets sheet 1 by the box itself, by area: the median of its rows' first and last frames (the cube at rest, from the front and
from behind) against sheet 1's idle (the side), so the cube covers the same ground from every side. (Against sheet 1's turnaround Front
instead, K 1.37 for 1.70, it would come out about a quarter bigger than the side idle: sheet 1 draws its turnaround a size up from its rows.)
Colour: not toned -- sheet 2's rows average within 1-7% of sheet 1's turnaround per channel (front rows 63 142 136 against its Front's
59 143 137, back rows 59 144 139 against its Back's 60 141 134), under the difference in what each side shows inside it.
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

FILES = {1: os.path.join('Fresh', 'Gelatinous Cube Animation Sheet-3.png'), 2: os.path.join('Fresh', 'Teal Jelly Cube Turnaround Sprite Sheet-1.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering: the row names; every row's number strip is added below), the portrait,
# and its rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe) -- probed 10-08
SHEETS = {
  1: dict(text=[(0, 240, 168, 1024)], portrait=(0, 0, 300, 240),
          rows=[('turn', (480, 0, 1150, 240), (58, 84), TURN, [580, 739, 893, 1043]),      # (its labels above the stills)
                ('idle', (0, 240, 1536, None), (340, 355), NUM(6), [243, 407, 571, 734, 896, 1060]),
                ('slide', (0, None, 1536, None), (453, 469), NUM(8), [224, 389, 554, 722, 891, 1061, 1233, 1408]),
                ('engulf', (0, None, 1536, None), (586, 603), NUM(8), [220, 384, 552, 728, 900, 1068, 1242, 1409]),
                ('digest', (0, None, 1536, None), (720, 735), NUM(6), [231, 400, 564, 732, 901, 1065]),
                ('flinch', (0, None, 1536, None), (847, 862), NUM(4), [234, 403, 569, 728]),
                ('fall', (0, None, 1536, None), (977, 992), NUM(6), [231, 415, 607, 835, 1087, 1363])]),
  2: dict(text=[(0, 0, 168, 1024)],
          rows=[('slidefront', (0, 60, 1536, None), (243, 262), NUM(8), [235, 403, 566, 744, 926, 1090, 1258, 1422]),
                ('engulffront', (0, None, 1536, None), (465, 484), NUM(8), [235, 399, 564, 744, 929, 1091, 1258, 1422]),
                ('slideback', (0, None, 1536, None), (688, 706), NUM(8), [235, 399, 566, 744, 926, 1090, 1258, 1422]),
                ('engulfback', (0, None, 1536, None), (912, 931), NUM(8), [235, 399, 564, 744, 928, 1091, 1258, 1422])]),
}

# the engine's rows: (sheet, row) for the side; S and N as described in the head
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'slide'), 'attack': (1, 'engulf'), 'engulf': (1, 'engulf'), 'digest': (1, 'digest'),
        'flinch': (1, 'flinch'), 'hurt': (1, 'fall')}
FRONT = {'slide': (2, 'slidefront'), 'engulf': (2, 'engulffront')}    # facing S
BACK = {'slide': (2, 'slideback'), 'engulf': (2, 'engulfback')}       # facing N
NEW = ['engulf', 'digest']        # this cutter's own rows (named here, not in pixelate.py)
FPS = {'idle': 5, 'walk': 8, 'attack': 10, 'engulf': 10, 'digest': 6, 'flinch': 8, 'hurt': 8}
TONE = {}                         # (none: see the head)
HEIGHT = 71                       # the side idle, px without its outline (73 with it: the stand-in cube_p1's 73) -- a Large box, the bulette's 66, the troll's ~100
FH, AY = 120, 108                 # (the Large sheets' frame: bulette_p2, otyugh_p2)


def filled_mask(a, *args, **kw):
    """sheetrows' figure mask, every hole filled: the clear jelly shows the navy through it"""
    return ndimage.binary_fill_holes(_figure_mask(a, *args, **kw))
_figure_mask = SR.figure_mask


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def game_frame(im, k, tone=None):
    """a cut frame at game size, palette-snapped and outlined"""
    if tone:
        im = toned(im, tone)
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)
    return pix.pixelate(small, 1, do_lift=False), small.size[0] / float(w)


def body(im):
    """a cut frame's measures on the sheet: sqrt of its area (holes filled) and its height"""
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    ys = np.where(m.any(1))[0]
    return float(np.sqrt(m.sum())), int(ys[-1] - ys[0] + 1)


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
    orig = SR.label_xs
    spec = dict(text=s['text'] + [(r[1][0], r[2][0] - 3, r[1][2], r[2][1] + 4) for r in rows],   # (a number's drop shadow runs past its strip)
                rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows])
    if 'portrait' in s:
        spec['portrait'] = s['portrait']
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    SR.figure_mask = filled_mask
    over = [] if check else None
    try:
        out = SR.cut_sheet(os.path.join(SRC, FILES[L]), spec, overlay=over, tag='sheet %d' % L)
    finally:
        SR.label_xs, SR.figure_mask = orig, _figure_mask
    labx = {r[0]: r[4] for r in rows}
    out = {row: [(nm, im, box, labx[row][i]) for i, (nm, im, box) in enumerate(frs)] for row, frs in out.items() if row in labx}
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'cube'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
    return out


def scales(c):
    """K per sheet (sheet px a game px): sheet 2 meets sheet 1 by the box at rest, by area"""
    med = lambda frs, i=0: float(np.median([body(f[1])[i] for f in frs]))
    k1 = med(c[1]['idle'], 1) / HEIGHT
    rest2 = [c[2][r][i] for r in ('slidefront', 'engulffront', 'slideback', 'engulfback') for i in (0, -1)]
    k2 = k1 * med(rest2) / med(c[1]['idle'])
    kt = k1 * med(rest2) / body(c[1]['turn'][0][1])[0]        # (what it would be against the turnaround's Front, for the record)
    print('  K: sheet 1 %.3f, sheet 2 %.3f (its box at rest %.3f of the side idle by area; against the turnaround Front it would be %.3f); '
          'the side idle %d px, from the front at rest %.0f px, from behind %.0f px'
          % (k1, k2, k2 / k1, kt, HEIGHT, med(rest2[:4], 1) / k2, med(rest2[4:], 1) / k2))
    return {1: k1, 2: k2}


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            floor = max(f[2][3] for f in frs)
            out = []
            for nm, im, box, lx in frs:
                a, sx = game_frame(im, K[L], TONE.get(L))
                out.append((a, (lx - box[0]) * sx, int(round((floor - box[3]) / K[L]))))
            small[(L, row)] = out
        return small[(L, row)]
    src = {}
    for eng, (L, row) in ROWS.items():
        side = frames_of(L, row)
        per = []
        for f in range(8):
            if f == 0 and row in FRONT:
                per.append(frames_of(*FRONT[row]))
            elif f == 4 and row in BACK:
                per.append(frames_of(*BACK[row]))
            else:
                per.append(side)
        counts = {len(s) for s in per}
        if len(counts) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, sorted(counts)))
        src[eng] = per
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
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'cube_p2'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    meta['source'] = ('generated by Griz (2026-10-08: two GPT sheets -- the side with its turnaround, then the slide and the engulf from '
                      'the front and from behind), cut by tools/cube-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'cube')
        lineup(os.path.join(d, 'lineup.png'))
        facings(frames, d)


def first(name, anim, f, i=0):
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims'][anim]
    y = an['y'] + f * an['fh']
    return im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']], an['ax'], an['ay']


def strip(figs, path, scale=4):
    """figures side by side on their feet (each sheet's ay), on a grey floor, at 4x"""
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
    canvas[top, :, :3] = (110, 40, 40)                          # (the foot's row)
    Image.fromarray(canvas).resize((W * scale, H * scale), Image.NEAREST).save(path)


def lineup(path):
    """the house gnoll, the old stand-in, the cube (E idle, S walk, N walk), the troll -- his size, for Griz's eye"""
    strip([first('gnoll_p2', 'idle', 6), first('cube_p1', 'idle', 6), first('cube_p2', 'idle', 6), first('cube_p2', 'walk', 0),
           first('cube_p2', 'walk', 4), first('troll_p1', 'idle', 6)], path)


def facings(frames, d, scale=4):
    """every row's frames for facings E, S, N and W, read back off the written png, a grid a facing (a line a row, each row cropped to its
    ink; the foot's row ticked red)"""
    for f, nm in ((6, 'E'), (0, 'S'), (4, 'N'), (2, 'W')):
        lines = []
        for eng in frames:
            fs = [first('cube_p2', eng, f, i)[0] for i in range(len(frames[eng][f]))]
            ink = np.any([fr[..., 3] > 0 for fr in fs], axis=0)
            ys, xs = np.where(ink)
            x0, x1, y0 = max(0, xs.min() - 2), xs.max() + 3, max(0, ys.min() - 2)
            cells = []
            for fr in fs:
                cell = np.zeros((FH + 2 - y0, x1 - x0, 3), np.uint8); cell[:] = (70, 74, 70)
                al = fr[y0:, x0:x1, 3:4] / 255.0
                cell[:FH - y0] = (fr[y0:, x0:x1, :3] * al + cell[:FH - y0] * (1 - al)).astype(np.uint8)
                cell[AY + 1 - y0] = (110, 40, 40)
                cells.append(cell); cells.append(np.full((cell.shape[0], 4, 3), 20, np.uint8))
            lines.append(np.concatenate(cells, 1))
        W = max(l.shape[1] for l in lines)
        grid = np.concatenate([np.pad(l, ((0, 4), (0, W - l.shape[1]), (0, 0)), constant_values=20) for l in lines], 0)
        Image.fromarray(grid).resize((grid.shape[1] * scale, grid.shape[0] * scale), Image.NEAREST).save(os.path.join(d, 'facing-%s.png' % nm))


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])

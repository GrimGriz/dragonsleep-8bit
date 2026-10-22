"""DEEP16 pipeline 2 (generated art): Griz's three GPT sheets of the axe beak -> axebeak_p2 (the Birb's stand-in, axebeak_p1, stays on disk).

    python tools/axebeak-sheet.py            (writes deep16/art/axebeak_p2.png/.json)
    python tools/axebeak-sheet.py check      (also the cut overlays, dev/visions/axebeak/cut-<n>.png, and a lineup at 4x)

Sources (gitignored, the main checkout's -- a worktree reads them there), all Griz's, 2026-10-08, in deep16/_src/axebeak/:
sheet 1 `Axe Beak Animation Sheet-6.png` (asked as deep16-art-in-hand.md "The stand-ins' first sheets", #### The axe beak): a portrait,
a turnaround (Front, Right, Back, Left, labelled ABOVE the stills), then rows facing RIGHT, numbered under each frame: Idle 6, Run 8, Beak 6,
Flinch 4 (feathers flying round it: each feather is its frame's), Fall 6 (the last lies on the ground), Prone 2 (on its side kicking, then
scrambling up). Sheet 2 `Front-Facing Axe Beak Animation Sheet-5.png` and sheet 3 `Axe beak back-view sprite sheet-9.png` (asked as "The
six's fronts and backs"): Idle 6, Run 8, Beak 6, Flinch 4 from the front and from behind, no turnaround. (`Axe Beak NES Battle Sprite
Sheet.png` beside them is the 8-bit game's, not cut here.)
Rows: Run -> walk; Beak -> `beak` (battle.js plays a row named for the attack, "Beak") and `attack` (the fallback); Flinch -> flinch; Fall ->
hurt; Prone -> prone, its two frames turned round (scrambling up, then lying): it lies at the last and gets up by playing it back
(deep16/js/sprites.js S.proneRow, the goblins' way). Facings: NE, E and SE the side rows as drawn, SW, W and NW mirrored; S takes sheet 2's
idle, walk, beak (and attack) and flinch, N sheet 3's; hurt and prone play side-on from S and N too. Since 10-22 the art desk's ART-37 draws
SE and NE every row (SW and NW their mirror) and S and N their hurt and prone (ART37 below); E and W keep sheet 1's side. Every row has the
same count in every facing as drawn (no frame repeated or dropped).
Scale: one creature in every row and facing. The side idle stands HEIGHT px (the stand-in's side idle, 94). The turnaround is drawn bigger
than the rows: it meets them by its Right and Left against the side idle, and sheets 2 and 3 meet it by their idles against its Front and its
Back -- every time by the area of the body and legs, not the neck (which the turnaround stretches up and the rows hunch): side-on the neck and
head are what an opening as wide as half the torso takes off above the torso's middle, from the front or behind what is above the shoulder
(the first row 0.6 the widest). Hurt and prone are set on the floor (their lying frames drawn a few px above the standing feet).
Colour: sheets 2 and 3 drew it warmer and lighter than sheet 1, so each is brought per channel to sheet 1's turnaround Front or Back (TONE,
the goose's and the mirror gnoll's way), measured here as it cuts.
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

FILES = {1: os.path.join('axebeak', 'Axe Beak Animation Sheet-6.png'), 2: os.path.join('axebeak', 'Front-Facing Axe Beak Animation Sheet-5.png'),
         3: os.path.join('axebeak', 'Axe beak back-view sprite sheet-9.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering: the row names; every row's number strip is added below), the portrait,
# and its rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe)
SHEETS = {
  1: dict(text=[(0, 235, 100, 1024)], portrait=(0, 0, 340, 235),
          rows=[('turn', (350, 30, 1300, 230), (6, 26), TURN, [540, 716, 905, 1110]),          # (its labels above the stills)
                ('idle', (0, 235, 1536, None), (357, 371), NUM(6), [158, 336, 505, 673, 836, 992]),
                ('run', (0, None, 1536, None), (487, 503), NUM(8), [163, 346, 528, 714, 894, 1061, 1232, 1408]),
                ('beak', (0, None, 1536, None), (632, 646), NUM(6), [167, 337, 518, 678, 863, 1038]),
                ('flinch', (0, None, 1536, None), (762, 777), NUM(4), [189, 383, 593, 767]),
                ('fall', (0, None, 1536, None), (880, 894), NUM(6), [186, 383, 567, 767, 970, 1178]),
                ('prone', (0, None, 1536, None), (995, 1009), NUM(2), [189, 412])]),
  2: dict(text=[(0, 0, 110, 1024)],
          rows=[('idle', (0, 0, 1536, None), (228, 246), NUM(6), [238, 445, 648, 851, 1055, 1264]),
                ('run', (0, None, 1536, None), (466, 485), NUM(8), [192, 361, 534, 704, 875, 1054, 1224, 1392]),
                ('beak', (0, None, 1536, None), (709, 727), NUM(6), [236, 443, 647, 852, 1060, 1268]),
                ('flinch', (0, None, 1536, None), (956, 974), NUM(4), [241, 500, 748, 991])]),
  3: dict(text=[(0, 0, 115, 1024)],
          rows=[('idle', (0, 0, 1536, None), (230, 248), NUM(6), [198, 399, 597, 789, 986, 1177]),
                ('run', (0, None, 1536, None), (465, 482), NUM(8), [189, 359, 544, 715, 888, 1059, 1247, 1430]),
                ('beak', (0, None, 1536, None), (719, 736), NUM(6), [195, 399, 600, 794, 990, 1188]),
                ('flinch', (0, None, 1536, None), (962, 979), NUM(4), [202, 411, 626, 816])]),
}
# loose bits by hand: sheet -> row -> [(box on the sheet: every blob wholly inside it, the frame it belongs to)] -- the side flinch's feathers
# fly in a fan round each frame, the fans' near edges as close to the frame before as to their own (looked at, 10-08)
FIX = {1: {'flinch': [((100, 650, 170, 745), '1'), ((220, 705, 245, 730), '1'),
                      ((270, 645, 335, 750), '2'), ((370, 650, 395, 670), '2'), ((440, 700, 470, 725), '2'),
                      ((480, 650, 610, 735), '3'), ((630, 715, 655, 740), '3'),
                      ((680, 670, 712, 695), '4')]}}
CUT, TOUCH_OK = {}, {}

# The five views (10-22, the monster cutter seat's second run): the art desk's ART-37 in deep16/_src/axebeak/ART-37/ (sorted out of Fresh by
# _src/art-desk/sort-delivery.py; its papers in _src/art-desk/received-2026-10-22-ART-37-axebeak-FINAL-SHEETS/): HEAD 1 SE and HEAD 2 NE
# every row on two pages (Idle 6, Run 8, Beak 6; Flinch 4, Fall 6, Prone 2), HEAD 3 S and HEAD 5 N their Fall and Prone. Each row's name at
# its left, its numbers under it; boxes read off the pages (the white numbers, islands in the navy, clustered by row). SE and SW, NE and NW
# take every row; S and N their hurt and prone (sheets 2 and 3 keep their idle, run, beak and flinch). Scale by height, the idle standing
# between the side's and the front's (or the back's): this sheet's front and back stand taller than its side (sheets 2 and 3 met the
# turnaround by body and legs), so a diagonal meets the mean of the two; each page 2 by its Flinch 4 (recovered, the idle's stance) against
# its page 1's idles; S and N by their Fall 1 (standing, before the blow takes it) against the front's and the back's idles.
ART37 = {
  'H1P1': dict(file='ART-37_HEAD-1_PAGE-1.png', W=1536, text=[(18, 178, 96, 214), (17, 453, 92, 489), (17, 735, 106, 771)],
               rows=[('idle', (0, 0, 1536, 341), (316, 341), 6), ('run', (0, 342, 1536, 607), (578, 607), 8), ('beak', (0, 608, 1536, 897), (872, 897), 6)]),
  'H1P2': dict(file='ART-37_HEAD-1_PAGE-2.png', W=1536, text=[(17, 200, 130, 236), (17, 495, 89, 530), (18, 790, 122, 825)],
               rows=[('flinch', (0, 0, 1536, 358), (331, 358), 4), ('fall', (0, 359, 1536, 642), (615, 642), 6), ('prone', (0, 643, 1536, 930), (903, 930), 2)]),
  'H2P1': dict(file='ART-37_HEAD-2_PAGE-1.png', W=1536, text=[(15, 135, 93, 170), (15, 433, 88, 467), (15, 755, 99, 788)],
               rows=[('idle', (0, 0, 1536, 312), (289, 312), 6), ('run', (0, 313, 1536, 613), (590, 613), 8), ('beak', (0, 614, 1536, 931), (908, 931), 6)]),
  'H2P2': dict(file='ART-37_HEAD-2_PAGE-2.png', W=1536, text=[(16, 186, 134, 222), (16, 489, 88, 526), (16, 796, 128, 832)],
               rows=[('flinch', (0, 0, 1536, 369), (342, 369), 4), ('fall', (0, 370, 1536, 665), (638, 665), 6), ('prone', (0, 666, 1536, 952), (925, 952), 2)]),
  'H3P1': dict(file='ART-37_HEAD-3_PAGE-1.png', W=1536, text=[(22, 283, 97, 320), (19, 628, 185, 677)],
               rows=[('fall', (0, 0, 1536, 499), (470, 499), 6), ('prone', (0, 500, 1536, 843), (814, 843), 2)]),
  'H5P1': dict(file='ART-37_HEAD-5_PAGE-1.png', W=1536, text=[(21, 316, 104, 360), (20, 753, 142, 794)],
               rows=[('fall', (0, 0, 1536, 497), (465, 497), 6), ('prone', (0, 498, 1536, 910), (878, 910), 2)]),
}
VIEWS37 = {'SE': ('H1P1', 'H1P2'), 'NE': ('H2P1', 'H2P2'), 'S': ('H3P1',), 'N': ('H5P1',)}
FACE37 = {7: 'SE', 1: 'SE', 5: 'NE', 3: 'NE', 0: 'S', 4: 'N'}       # facing -> the view drawn for it (SW and NW its mirror, below)

# the engine's rows: sheet 1's row for the side (and for S and N where sheets 2 and 3 have none)
ROWS = {'idle': 'idle', 'walk': 'run', 'attack': 'beak', 'beak': 'beak', 'flinch': 'flinch', 'hurt': 'fall', 'prone': 'prone'}
OWN = ('idle', 'run', 'beak', 'flinch')     # the rows sheet 2 draws from the front (S) and sheet 3 from behind (N)
GROUND = ('fall', 'prone')                  # set on the floor: a body lying on its side lies on the ground
FPS = {'idle': 6, 'walk': 12, 'attack': 10, 'beak': 10, 'flinch': 12, 'hurt': 8, 'prone': 8}   # (walk 12: its speed is 50, a quick long-legged run)
HEIGHT = 94           # the side idle, standing px: the stand-in's (axebeak_p1's side idle, 94)
FH, AY = 144, 128


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
    return pix.pixelate(small, 1, do_lift=False)


def core_x(a):
    """x of the body's thick middle (the torso; the neck and the legs are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def _solid(im):
    m = np.asarray(im)[..., 3] > 0
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    m = lab == 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))      # the body, not a loose feather
    return ndimage.binary_fill_holes(m)


def height(im):
    ys = np.where(_solid(im).any(1))[0]
    return int(ys[-1] - ys[0] + 1)


def body_legs(im, view):
    """sqrt of the area of the body and legs, not the neck and head. Side-on ('side'): the torso is what an opening as wide as half its
    thickness keeps; the neck and head go with everything above the torso's middle row that is not torso. From the front or behind: all
    below the shoulder, the first row 0.6 as wide as the widest."""
    m = _solid(im)
    if view == 'side':
        p = np.pad(m, 1)
        r = max(2, int(round(0.5 * ndimage.distance_transform_edt(p).max())))
        y, x = np.ogrid[-r:r + 1, -r:r + 1]
        op = ndimage.binary_opening(np.pad(m, r + 1), structure=x * x + y * y <= r * r)[r + 1:-r - 1, r + 1:-r - 1]
        lab, n = ndimage.label(op)
        torso = lab == 1 + int(np.argmax(ndimage.sum(op, lab, range(1, n + 1))))
        keep = m.copy(); keep[:int(round(np.where(torso)[0].mean()))] = False
        keep |= torso
    else:
        c = m.sum(1)
        keep = m.copy(); keep[:np.where(c >= 0.6 * c.max())[0][0]] = False
    return float(np.sqrt(keep.sum()))


def mean_rgb(im):
    a = np.asarray(im)
    return a[..., :3][_solid(im)].astype(float).mean(0)


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
    over = [] if check else None
    try:
        out = SR.cut_sheet(os.path.join(SRC, FILES[L]), spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()),
                           overlay=over, tag='sheet %d' % L)
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'axebeak'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
    return out


def cut37(L, check=False):
    s = ART37[L]
    spec = dict(text=s['text'] + [(0, l0 - 3, s['W'], l1 + 4) for _, _, (l0, l1), _ in s['rows']],
                rows=[(r, b, l, NUM(n)) for r, b, l, n in s['rows']])
    over = [] if check else None
    out = SR.cut_sheet(os.path.join(SRC, 'axebeak', 'ART-37', s['file']), spec, overlay=over, tag=L)
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'axebeak'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%s.png' % L))
    return out


def scales37(c, K):
    """K for ART-37's pages, by height against the game-size idles of this sheet's side (sheet 1), front (2) and back (3)"""
    med = lambda vals: float(np.median(vals))
    h = {L: med([height(im) for _, im, _ in c[L]['idle']]) / K[L] for L in (1, 2, 3)}
    for p1, p2, other in (('H1P1', 'H1P2', 2), ('H2P1', 'H2P2', 3)):
        K[p1] = med([height(im) for _, im, _ in c[p1]['idle']]) / ((h[1] + h[other]) / 2)
        K[p2] = K[p1] * height(c[p2]['flinch'][-1][1]) / med([height(im) for _, im, _ in c[p1]['idle']])
    K['H3P1'] = height(c['H3P1']['fall'][0][1]) / h[2]
    K['H5P1'] = height(c['H5P1']['fall'][0][1]) / h[3]
    print('  ART-37 K: ' + ', '.join('%s %.3f' % (L, K[L]) for L in ART37) +
          '; the idles stand %.0f side-on, %.0f from the front, %.0f from behind' % (h[1], h[2], h[3]))


def scales(c):
    """K per sheet (sheet px a game px), the turnaround the go-between for the front and behind"""
    med = lambda vals: float(np.median(vals))
    k1 = med([height(im) for _, im, _ in c[1]['idle']]) / HEIGHT
    turn = {nm: im for nm, im, _ in c[1]['turn']}
    side = med([body_legs(im, 'side') for _, im, _ in c[1]['idle']])
    kt = k1 * (body_legs(turn['right'], 'side') + body_legs(turn['left'], 'side')) / 2 / side
    k2 = kt * med([body_legs(im, 'up') for _, im, _ in c[2]['idle']]) / body_legs(turn['front'], 'up')
    k3 = kt * med([body_legs(im, 'up') for _, im, _ in c[3]['idle']]) / body_legs(turn['back'], 'up')
    K = {1: k1, 2: k2, 3: k3}
    hs = {L: med([height(im) for _, im, _ in c[L]['idle']]) / K[L] for L in K}
    print('  K: sheet 1 %.3f, turnaround %.3f (%.3f the rows), front %.3f, behind %.3f; the idle stands %.0f px side-on, %.0f from the front, '
          '%.0f from behind (the turnaround\'s Right %.0f)' % (k1, kt, kt / k1, k2, k3, hs[1], hs[2], hs[3], height(turn['right']) / kt))
    return K


def tones(c):
    """per channel, sheets 2 and 3's idles brought to sheet 1's turnaround Front and Back"""
    turn = {nm: im for nm, im, _ in c[1]['turn']}
    T = {}
    for L, view in ((2, 'front'), (3, 'back')):
        ref = mean_rgb(turn[view]); got = np.median([mean_rgb(im) for _, im, _ in c[L]['idle']], axis=0)
        T[L] = tuple(float(round(x, 3)) for x in ref / got)
        print('  TONE sheet %d: idle %s -> the turnaround %s %s: x %s' % (L, np.round(got).astype(int).tolist(), view, np.round(ref).astype(int).tolist(), T[L]))
    return T


def tones37(c):
    """per channel, as sheets 2 and 3: ART-37 drew it lighter and redder (page 1s by a sixth, the SE page 2 by a fifth). Each page against its
    like: the diagonals' idle and flinch against sheet 1's side idle and flinch, S's and N's Fall 1 (standing) against the turnaround's Front
    and Back (what sheets 2 and 3 were brought to)"""
    turn = {nm: im for nm, im, _ in c[1]['turn']}
    T = {}
    for L in ART37:
        if L in ('H3P1', 'H5P1'):
            row, got = 'fall 1', mean_rgb(c[L]['fall'][0][1])
            ref = mean_rgb(turn['front' if L == 'H3P1' else 'back'])
        else:
            row = 'idle' if 'idle' in c[L] else 'flinch'
            got = np.median([mean_rgb(im) for _, im, _ in c[L][row]], axis=0)
            ref = np.median([mean_rgb(im) for _, im, _ in c[1][row]], axis=0)
        T[L] = tuple(float(round(x, 3)) for x in ref / got)
        print('  TONE %s: %s %s -> %s: x %s' % (L, row, np.round(got).astype(int).tolist(), np.round(ref).astype(int).tolist(), T[L]))
    return T


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    c.update({L: cut37(L, check) for L in ART37})
    K = scales(c)
    scales37(c, K)
    TONE = tones(c)
    TONE.update(tones37(c))
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            floor = max(b[3] for _, _, b in frs)
            out = []
            for nm, im, box in frs:
                a = game_frame(im, K[L], TONE.get(L))
                out.append((a, core_x(a), 0 if row in GROUND else int(round((floor - box[3]) / K[L]))))
            small[(L, row)] = out
        return small[(L, row)]
    src = {}
    for eng, row in ROWS.items():
        side = frames_of(1, row)
        if row == 'prone':
            side = side[::-1]                                  # scrambling up, then lying: it lies at its last frame and gets up by playing it back
        per = [frames_of(2, row) if f == 0 and row in OWN else frames_of(3, row) if f == 4 and row in OWN else side for f in range(8)]
        for f, v in FACE37.items():                            # ART-37's views where it drew the row (SW and NW flipped below, as W)
            L37 = next((L for L in VIEWS37[v] if row in c[L]), None)
            if L37:
                per[f] = frames_of(L37, row)[::-1] if row == 'prone' else frames_of(L37, row)
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
    name = 'axebeak_p2'                                        # (every row is one ANIM_ORDER names already: beak, flinch and prone among them)
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    meta['source'] = ('generated by Griz (2026-10-08: three GPT sheets -- from the side with its turnaround, from the front, from behind), '
                      'cut by tools/axebeak-sheet.py; SE and NE every row and S and N its fall and prone drawn by the art desk (ART-37, 10-22)')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'axebeak')
        lineup(os.path.join(d, 'lineup.png'))


def lineup(path):
    """the gnoll (Medium), the stand-in (the Birb), it (E, S, N), the troll (Large), at 4x on a grey floor (its size, for the eye)"""
    def first(name, anim, f):
        m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
        im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
        an = m['anims'][anim]
        y = an['y'] + f * an['fh']
        return im[y:y + an['fh'], 0:an['fw']], an['ax'], an['ay']
    figs = [first('gnoll_p2', 'idle', 6), first('axebeak_p1', 'idle', 6), first('axebeak_p2', 'idle', 6),
            first('axebeak_p2', 'idle', 0), first('axebeak_p2', 'idle', 4), first('troll_p1', 'idle', 6)]
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

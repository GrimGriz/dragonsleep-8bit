"""DEEP16 pipeline 2 (generated art): Griz's four GPT sheets of the mirror-eyed gnoll -> mirrorgnoll_p1.

    python tools/mirrorgnoll-sheet.py            (writes deep16/art/mirrorgnoll_p1.png/.json)
    python tools/mirrorgnoll-sheet.py check      (also the cut overlays, dev/visions/mirrorgnoll/cut-<n>.png, and a lineup beside the gnolls)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/Mirror-Eyed Gnoll Sprite Sheet1.png and
Mirror-Eyed Gnoll Action Sprite Sheet2.png -- Griz, 2026-10-08, drawn from the GPT "Astra" draft's two prompts
(deep16/_src/oneeye/astra-draft-2026-10-08.md: its rows and its look); then deep16/_src/Fresh/Hunched mirror-eyed gnoll sprite
sheet-1.png (from the front) and Back-View Gnoll Animation Sprite Sheet-3.png (from behind; its sheet-2 dropped an idle frame and swung
the other arm, and this re-roll fixed both), with Back-view mirror-eyed gnoll sprite sheet-2.png's backhand kept as the other arm's
(Griz, 10-08: "if we want to make him do a dance, one has his arm out to one side and the other has the other arm out to a side ...
That's why I thought we needed all 3") -- the seat's lean pasted (10-08: front and back, Idle 6, Walk 8, Backhand 6, Flinch 4, mirrors
in both eyes). Not the Old One's vessel (Griz, 10-08: "he's not gonna be the old
one's avatar - but maybe something the Old One did to another gnoll whilst about on his walk to the Doors"): a spotted gnoll with a mirror
for an eye, no heart glass, no stars -- cut as drawn. His kit is not ruled; every row is cut, under the draft's names, for the kit to pick
(the draft's notes on how the game should play its rows are in the bestiary lane, ../handoff-2026-10-05-the-bestiary-after-the-bugs.md).

Sheets 1 and 2: a portrait and a turnaround (front, right, back, left), then rows facing RIGHT, labelled by number. Sheet 1: idle 6, walk 8,
backhand 6, drain 8 (Drink Light), flinch 4, fall 8. Sheet 2: foretell 6, mirrorstrike 6 (numbered 1-5 and 8 by the generator), kneel 8,
overfill 6, ascend 9 (two 7s), uprightidle 6 -- the last three-quarters to the front, standing tall. Sheets 3 (the front) and 4 (behind):
idle 6, walk 8, backhand 6, flinch 4, no turnaround.
Facings: NE, E and SE take the side rows as drawn, SW, W and NW mirrored (the mirror eye swaps sides with them, as every gnoll's does);
S takes sheet 3's rows and N sheet 4's for idle, walk, backhand (and attack) and flinch; the other rows play side-on from S and N too (as
the hobgoblin's climb and fall). `backhand2` is the other arm: from behind sheet 5's (back sheet 2), from the front the front's backhand
mirrored, side-on the side's (battle.js plays it on a backhand's second use in a turn, as the sergeant's longsword2; a dance can trade them).
`attack` is the backhand, `hurt` the fall; `prone` is the fall's two
going-down frames (his side, then the arm under him), got up from by playing them back (deep16/js/sprites.js S.proneRow, the hobgoblin's way).
Scale: the side idle (hunched) stands HEIGHT px; sheet 2 meets sheet 1 by the hunched guard both draw (sheet 1's idle against the first
frame of sheet 2's foretell, mirrorstrike, kneel, overfill and ascend, by area); the turnaround meets sheet 2 by its front against the
upright idle, by area; sheets 3 and 4 meet the turnaround by their idles against its front and its back, by area. The mirror eye and the cyan streaks are a pixel or two at game size: GLINT keeps them (a game pixel whose block
on the sheet holds the glint takes the glint's colour) so the box filter doesn't wash them into the fur. Colour: each later sheet drew him
warmer than sheet 1 (the most-played rows), so each is brought to sheet 1's per channel (TONE, the goose's and the bugbears' way).
THE MANE RIPPLE READS THESE COLOURS (ec0206f): deep16/js/ripple.js finds his mane as the dark silver ramp (silver 0-3) at the top of
the figure. A re-cut that moves TONE, the palette snap or the mane's colours can lose the mane: open the ripple's door after it
(tools/sheet-play.html?sheet=mirrorgnoll_p1&face=6,0,4&ripple=mane&tones=moss&bg=moss&every=1.5) and see the wave still runs down the mane.
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

FILES = {1: 'Mirror-Eyed Gnoll Sprite Sheet1.png', 2: 'Mirror-Eyed Gnoll Action Sprite Sheet2.png',
         3: os.path.join('Fresh', 'Hunched mirror-eyed gnoll sprite sheet-1.png'), 4: os.path.join('Fresh', 'Back-View Gnoll Animation Sprite Sheet-3.png'),
         5: os.path.join('Fresh', 'Back-view mirror-eyed gnoll sprite sheet-2.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering: the row names; every row's number strip is added below), the portrait,
# and its rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe)
SHEETS = {
  1: dict(text=[(0, 285, 160, 1024)], portrait=(0, 0, 290, 285),
          rows=[('turn', (350, 0, 1300, 258), (258, 281), TURN, [460, 696, 954, 1199]),
                ('idle', (0, 281, 1536, None), (404, 418), NUM(6), [233, 400, 575, 744, 916, 1089]),
                ('walk', (0, None, 1536, None), (536, 550), NUM(8), [233, 387, 535, 685, 839, 988, 1146, 1303]),
                ('backhand', (0, None, 1536, None), (665, 679), NUM(6), [233, 409, 587, 778, 983, 1155]),
                ('drain', (0, None, 1536, None), (792, 805), NUM(8), [233, 395, 564, 734, 906, 1072, 1244, 1411]),
                ('flinch', (0, None, 1536, None), (902, 916), NUM(4), [233, 417, 591, 770]),
                ('fall', (0, None, 1536, None), (1004, 1017), NUM(8), [179, 330, 491, 655, 836, 1021, 1207, 1407])]),
  2: dict(text=[(0, 282, 170, 1024)], portrait=(0, 0, 290, 282),
          rows=[('turn', (350, 0, 1300, 250), (250, 271), TURN, [458, 696, 957, 1200]),
                ('foretell', (0, 271, 1536, None), (385, 399), NUM(6), [245, 433, 661, 873, 1077, 1276]),
                ('mirrorstrike', (0, None, 1536, None), (503, 516), NUM(6), [245, 427, 649, 884, 1129, 1307]),
                ('kneel', (0, None, 1536, None), (622, 636), NUM(8), [229, 382, 553, 722, 903, 1078, 1243, 1428]),
                ('overfill', (0, None, 1536, None), (742, 756), NUM(6), [241, 438, 648, 856, 1061, 1285]),
                ('ascend', (0, None, 1536, None), (873, 887), NUM(9), [234, 398, 556, 724, 888, 1037, 1171, 1305, 1442]),
                ('uprightidle', (0, None, 1536, None), (1006, 1019), NUM(6), [251, 458, 664, 876, 1079, 1289])]),
  3: dict(text=[(0, 0, 170, 1024)],
          rows=[('idle', (0, 0, 1536, None), (244, 261), NUM(6), [266, 492, 705, 915, 1130, 1345]),
                ('walk', (0, None, 1536, None), (487, 504), NUM(8), [221, 399, 564, 732, 907, 1081, 1254, 1426]),
                ('backhand', (0, None, 1536, None), (736, 752), NUM(6), [270, 484, 682, 929, 1161, 1371]),
                ('flinch', (0, None, 1536, None), (982, 998), NUM(4), [309, 544, 775, 999])]),
  4: dict(text=[(0, 0, 170, 1024)],
          rows=[('idle', (0, 0, 1536, None), (246, 263), NUM(6), [268, 492, 709, 929, 1152, 1378]),
                ('walk', (0, None, 1536, None), (487, 504), NUM(8), [219, 397, 573, 732, 907, 1085, 1260, 1427]),
                ('backhand', (0, None, 1536, None), (735, 752), NUM(6), [270, 487, 730, 938, 1156, 1371]),
                ('flinch', (0, None, 1536, None), (984, 1001), NUM(4), [294, 535, 760, 996])]),
  5: dict(text=[(0, 0, 170, 1024)],                                       # (only its backhand: the other arm)
          rows=[('backhand', (0, 506, 1536, None), (735, 752), NUM(6), [270, 487, 695, 928, 1155, 1366])]),   # (below the walk's numbers)
}
SPLIT = {(2, 'ascend'): 741,       # (sheet, row) -> the line between it and the row above, by hand where the two crowd: overfill's feet
         (2, 'uprightidle'): 872}  # end at 739 and ascend 9's head starts at 744; ascend's feet end at 870 and the upright heads start at 873
# a number that touches a head (so it is not wholly inside its strip): its white glyph and its dark shadow painted navy before the cut
ERASE = {2: [(882, 871, 896, 889), (1299, 871, 1313, 889)]}   # ascend's "5" on upright idle 4's head, its second "7" on upright idle 6's
# painted navy whole before the cut: the portraits' last rows inside the first row's band (sheet 2's a red rule), and specks of ground shadow
BLANK = {1: [(0, 276, 300, 287)],
         2: [(0, 266, 300, 284), (888, 379, 895, 381), (1091, 379, 1099, 381), (639, 626, 652, 629), (1034, 868, 1040, 869), (805, 442, 806, 443)]}
# loose bits by hand: sheet -> row -> [(box on the sheet: every blob wholly inside it, the label it belongs to)] -- the streaks' faint tips lie
# nearer the next frame's tail than their own muzzle
FIX = {1: {'drain': [((460, 694, 512, 722), '2'), ((628, 694, 682, 722), '3')]},
       2: {'mirrorstrike': [((784, 427, 822, 447), '3')]}}
CUT = {}
TOUCH_OK = {1: {'drain'}, 2: {'mirrorstrike'}}   # looked at: drain 2's streaks by drain 3's tail, mirrorstrike 3's claw by 4's tail, each cut right

# the engine's rows: (sheet, row) for the side; S and N as described in the head
FRONT, BACK = ('idle', 'walk', 'backhand', 'flinch'), ('idle', 'walk', 'backhand', 'flinch')   # sheet 3's rows for S, sheet 4's for N
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'walk'), 'attack': (1, 'backhand'), 'backhand': (1, 'backhand'), 'backhand2': (1, 'backhand'), 'drain': (1, 'drain'),
        'flinch': (1, 'flinch'), 'hurt': (1, 'fall'), 'prone': (1, 'fall'), 'foretell': (2, 'foretell'), 'mirrorstrike': (2, 'mirrorstrike'),
        'kneel': (2, 'kneel'), 'overfill': (2, 'overfill'), 'ascend': (2, 'ascend'), 'uprightidle': (2, 'uprightidle')}
PRONE = [3, 4]        # the fall's frames 4 and 5 (an arm under him; on his side): lying at the last, got up from by playing it back
NEW = ['backhand', 'backhand2', 'drain', 'foretell', 'mirrorstrike', 'kneel', 'overfill', 'ascend', 'uprightidle']   # this cutter's own rows (named
                                                                                                         # here, not in pixelate.py)
FPS = {'idle': 5, 'walk': 9, 'attack': 10, 'backhand': 10, 'backhand2': 10, 'drain': 8, 'flinch': 8, 'hurt': 8, 'prone': 8, 'foretell': 6,
       'mirrorstrike': 11, 'kneel': 7, 'overfill': 7, 'ascend': 6, 'uprightidle': 5}
# per channel, each sheet's figure brought to sheet 1's: mean RGB against sheet 1's turnaround view of the same side (sheet 2's turnaround,
# 111 74 56, to sheet 1's, 99 70 56; the front, 109 73 55, to its front; behind, 122 77 52 and 116 74 53, to its back, 99 70 58), 10-08
TONE = {2: (0.893, 0.947, 1.0), 3: (0.907, 0.964, 1.033), 4: (0.813, 0.909, 1.11), 5: (0.859, 0.943, 1.085)}
HEIGHT = 64           # the hunched side idle, standing px (the glory-seeker's 64; the house gnoll 60) -- his size is unruled
FH, AY = 112, 100


def glint_mask(rgb):
    """the mirror's cold glint and the cyan streaks: bright, blue and green well over red"""
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (b - r > 50) & (g - r > 30) & ((r + g + b) / 3 > 140)


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def game_frame(im, k, tone=None):
    """a cut frame at game size, palette-snapped and outlined, its glint kept"""
    if tone:
        im = toned(im, tone)
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)
    a = pix.pixelate(small, 1, do_lift=False)
    src = np.asarray(im)
    gm = glint_mask(src[..., :3]) & (src[..., 3] > 0)
    if gm.any():
        H, W = a.shape[:2]
        ys, xs = np.where(gm)
        gy = np.clip((ys * H / src.shape[0]).astype(int), 0, H - 1)
        gx = np.clip((xs * W / src.shape[1]).astype(int), 0, W - 1)
        cnt = np.zeros((H, W), int); np.add.at(cnt, (gy, gx), 1)
        hit = cnt >= max(2, int(0.18 * k * k))                    # a fifth of the block or so is glint
        if hit.any():
            col = np.zeros((H, W, 3)); np.add.at(col, (gy, gx), src[ys, xs, :3].astype(float))
            col = col[hit] / cnt[hit][:, None]
            snapped = pix.snap(col[None] / 255.0)[0]
            a[hit, :3] = snapped
            a[hit, 3] = 255
    return a


def muzzle(a):
    """(x, y) of the muzzle's tip in a frame: the body's rightmost pixel in its upper rows"""
    rows = np.where(a.any(1))[0]
    top = a.copy(); top[rows[0] + (rows[-1] - rows[0]) * 45 // 100:] = False
    ys, xs = np.where(top)
    tip = xs.max()
    return float(tip), float(ys[xs >= tip - 2].mean())


def drink_in(frs):
    """Drink Light, the light going IN as he grows (Griz, 10-08: "The mirror drain is backwards, i.e. the energy going in appears to make
    him smaller, and if you reverse it, it'll look like energy going out makes him bigger"): the sheet's frames 2-6 sink lower as the streaks
    shorten into the eye, so the bodies play in the other order (the lowest brace first, rising), each with the streaks of its place in the
    row set at the same distance from its own muzzle; frames 1, 7 and 8 as drawn."""
    parts = []
    for nm, im, box in frs:
        a = np.asarray(im)
        lab, n = ndimage.label(a[..., 3] > 0, structure=np.ones((3, 3)))
        big = 1 + int(np.argmax(ndimage.sum(a[..., 3] > 0, lab, range(1, n + 1))))
        parts.append((a, lab == big, box))
    out = list(frs)
    for i in range(1, 6):
        (ab, mb, bb), (as_, ms, bs) = parts[6 - i], parts[i]
        mx_b, my_b = muzzle(mb); mx_s, my_s = muzzle(ms)
        dx = int(round(bb[0] + mx_b - bs[0] - mx_s)); dy = int(round(bb[1] + my_b - bs[1] - my_s))
        streak = (as_[..., 3] > 0) & ~ms
        ys, xs = np.where(streak)
        sx, sy = xs + bs[0] + dx, ys + bs[1] + dy                      # the streaks' pixels on the sheet, moved to the body's muzzle
        X0, Y0 = min(bb[0], sx.min()), min(bb[1], sy.min())
        X1, Y1 = max(bb[2], sx.max() + 1), max(bb[3], sy.max() + 1)
        cv = np.zeros((Y1 - Y0, X1 - X0, 4), np.uint8)
        body = ab.copy(); body[~mb] = 0
        cv[bb[1] - Y0:bb[3] - Y0, bb[0] - X0:bb[2] - X0] = body
        cv[sy - Y0, sx - X0] = as_[ys, xs]
        out[i] = (frs[i][0], Image.fromarray(cv, 'RGBA'), (X0, Y0, X1, bb[3]))   # (the foot is the body's: the row's floor reads box[3])
    return out


def core_x(a):
    """x of the body's thick middle (torso and head; the arms and the streaks are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


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
                y0 = SPLIT.get((L, r[0]), prev)
                if (L, r[0]) in SPLIT:                            # (the row above ends there too)
                    rows[-1] = (rows[-1][0], rows[-1][1][:3] + (y0,)) + rows[-1][2:]
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
    path = os.path.join(SRC, FILES[L])
    if L in ERASE or L in BLANK:
        img = np.asarray(Image.open(path).convert('RGB')).copy()
        navy = np.median(img.reshape(-1, 3)[::97], axis=0).astype(np.uint8)
        for x0, y0, x1, y1 in ERASE.get(L, ()):
            box = img[y0:y1, x0:x1].astype(int)
            glyph = (box.mean(-1) > 140) | ((box[..., 2] >= box[..., 0]) & (box.mean(-1) > 50))   # the white number, its soft edge over the
            img[y0:y1, x0:x1][glyph] = navy                                                         # navy and over the dark mane
        for x0, y0, x1, y1 in BLANK.get(L, ()):
            img[y0:y1, x0:x1] = navy
        path = os.path.join(tempfile.gettempdir(), 'mirrorgnoll-sheet-%d.png' % L)
        Image.fromarray(img).save(path)
    try:
        out = SR.cut_sheet(path, spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()),
                           overlay=over, tag='sheet %d' % L)
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'mirrorgnoll'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
    return out


def scales(c):
    """K per sheet (sheet px a game px), the turnaround the go-between for the front and the back"""
    med = lambda frs, i=0: float(np.median([body(im)[i] for _, im, _ in frs]))
    k1 = med(c[1]['idle'], 1) / HEIGHT
    guard2 = float(np.median([body(c[2][r][0][1])[0] for r in ('foretell', 'mirrorstrike', 'kneel', 'overfill', 'ascend')]))
    k2 = k1 * guard2 / med(c[1]['idle'])
    turn2 = {nm: body(im)[0] for nm, im, _ in c[2]['turn']}
    kt = k2 * turn2['front'] / med(c[2]['uprightidle'])
    k3 = kt * med(c[3]['idle']) / turn2['front']
    k4 = kt * med(c[4]['idle']) / turn2['back']
    guard = lambda L: float(np.median([body(c[L]['backhand'][i][1])[0] for i in (0, -1)]))   # (the backhand's first and last: the guard)
    k5 = k4 * guard(5) / guard(4)
    up_h = med(c[2]['uprightidle'], 1) / k2
    print('  K: sheet 1 %.2f, sheet 2 %.2f (its guard %.3f of sheet 1\'s), turnaround %.2f, front %.2f, back %.2f; the side idle %d px, '
          'upright %.0f px, from the front %.0f px, from behind %.0f px'
          % (k1, k2, k2 / k1, kt, k3, k4, HEIGHT, up_h, med(c[3]['idle'], 1) / k3, med(c[4]['idle'], 1) / k4))
    return {1: k1, 2: k2, 3: k3, 4: k4, 5: k5}


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    c[1]['drain'] = drink_in(c[1]['drain'])
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            floor = max(b[3] for _, _, b in frs)
            out = []
            for nm, im, box in frs:
                a = game_frame(im, K[L], TONE.get(L))
                out.append((a, core_x(a), int(round((floor - box[3]) / K[L]))))
            small[(L, row)] = out
        return small[(L, row)]
    src = {}
    for eng, (L, row) in ROWS.items():
        side = frames_of(L, row)
        if eng == 'prone':
            side = [side[i] for i in PRONE]
        per = []
        for f in range(8):
            if eng == 'backhand2' and f == 0:
                per.append([(a[:, ::-1], a.shape[1] - cx, up) for a, cx, up in frames_of(3, 'backhand')])
            elif eng == 'backhand2' and f == 4:
                per.append(frames_of(5, 'backhand'))
            elif f == 0 and L == 1 and row in FRONT:
                per.append(frames_of(3, row))
            elif f == 4 and L == 1 and row in BACK:
                per.append(frames_of(4, row))
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
    name = 'mirrorgnoll_p1'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    meta['source'] = ('generated by Griz (2026-10-08: two GPT sheets from the Astra draft -- the body and its fall, the mirror powers -- '
                      'then one from the front and one from behind), cut by tools/mirrorgnoll-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'mirrorgnoll')
        lineup(frames, os.path.join(d, 'lineup.png'))


def lineup(frames, path):
    """the house gnoll, the glory-seeker and him (E, S, N, upright), the troll, at 4x on a grey floor (his size, for Griz's eye)"""
    def first(name, anim, f):
        m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
        im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
        an = m['anims'][anim]
        y = an['y'] + f * an['fh']
        return im[y:y + an['fh'], 0:an['fw']], an['ax'], an['ay']
    figs = [first('gnoll_p2', 'idle', 6), first('gloryseeker_p2', 'idle', 6), first('mirrorgnoll_p1', 'idle', 6),
            first('mirrorgnoll_p1', 'idle', 0), first('mirrorgnoll_p1', 'idle', 4), first('mirrorgnoll_p1', 'uprightidle', 6), first('troll_p1', 'idle', 6)]
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

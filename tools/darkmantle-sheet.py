"""DEEP16 pipeline 2 (generated art): Griz's four GPT sheets of the darkmantle -> darkmantle_p2 (the hand-built Glub stand-in, darkmantle_p1, stays on disk).

    python tools/darkmantle-sheet.py            (writes deep16/art/darkmantle_p2.png/.json)
    python tools/darkmantle-sheet.py check      (also the cut overlays, dev/visions/darkmantle/cut-<n>.png, and a lineup beside the gnoll,
                                                 the goblin and the stand-in, with the Clamp drawn where the 'over' perch puts it on the gnoll)

Sources (gitignored, the main checkout's -- a worktree reads them there), Griz, 2026-10-08, from the pastes in deep16-art-in-hand.md: sheet 1
deep16/_src/Fresh/Darkmantle Cave Creature Sprite Sheet-5.png ("The stand-ins' first sheets", #### The darkmantle: a portrait, a turnaround
Front, Right, Back, Left, then rows facing RIGHT: Idle 6, Fly 8, Crush 6, Darkness 6, Flinch 4, Fall 6, Prone 2); then from "The six's fronts
and backs": sheet 2 Darkmantle Clamp and Still Sprite Sheet-10.png (its tricks, side-on: Clamp 4, Still 4), sheet 3 Darkmantle Front Animation
Sprite Sheet-11.png (from the front: Idle 6, Fly 8, Crush 6, Flinch 4) and sheet 4 Darkmantle Back-View Animation Sheet.png (from behind, the
same four rows). No turnaround on 2, 3 or 4. Every row's number strip is lettering; each row's frames are placed by its numbers' x, read
off the sheets by a probe.
What each row became: Idle -> idle; Fly -> walk; Crush -> `crush` and `attack` (battle.js plays a row named for the attack, "Crush"; `attack`
the fallback); Darkness -> `darkness` (its Darkness Aura, a ring of black blooming round it: nothing plays it yet); Clamp -> `clamp` (riding
over a head, its LOWEST pixel on the foot ay -- the desk wires where it is drawn); Still -> `still` (False Appearance, a stalagmite on the
floor: ui.js plays a sheet's `still` for a foe that has not acted); Flinch -> flinch; Fall -> hurt; Prone -> prone (the hobgoblin's way:
lifting, then lying -- it lies at its last frame and gets up by playing it backwards, sprites.js S.proneRow).
Facings: NE, E, SE the side rows as drawn, SW, W, NW mirrored; S takes sheet 3's rows and N sheet 4's for idle, walk, crush (and attack) and
flinch; darkness, clamp, still, hurt and prone play side-on from S and N too (the Darkness row draws it face-on in its ring; it reads the
same from any side).
The mask: its dark purple outline and the Darkness ring's purple-black glow on the navy are neither grey nor far from it by the house's
sum (the ring's soft halo, about 34 20 69, fails both): every sheet is cut by `chan` (any one channel this far from the navy -- Beholda's
way); the navy is flat (no pixel of it more than 5 off), so CHAN 25 keeps the halo and nothing of the ground.
Scale: K (sheet px a game px), one creature in every row and facing. Sheet 1's rows (one size: every row's mantle 44-47 px) by the side
idle's area, set so its idle matches the stand-in's (darkmantle_p1 facing E: a median 322 px drawn, its outline in; IDLE_AREA) -- Small,
its Clamp's bag a little wider than a Medium gnoll's head (the lineup). The turnaround is drawn about 1.6 times the rows' size: it meets
the rows by the mantle, the one rigid part (the cone's tip to the eyes' middle, its Right view against the side idle's). The front meets
the turnaround's Front by the mantle and the eyes' gap (their mean), not by area: its idle spreads the skirt wide where the turnaround's
hangs, so its area came out 1.48 times the turnaround against 1.15 and 1.20 by the rigid two, and S would have drawn the mantle a fifth
smaller than E. The front's other rows meet its idle by the eyes' gap (its Fly is drawn 0.91 of the idle's size); behind (no eyes) each
row meets the front's same row by area -- one motion from both sides, the skirt spread alike. The tricks sheet meets the side idle by
its Clamp's mantle (the same tip-to-eyes length); its Still takes the sheet's K. The eyes are kept at game size (GLINT's way, game_frame).
The hover: the paste asked every air row "at the same height above one baseline, but Fall and Prone on the ground"; sheet 1 drew none --
every row stands 5-7 px over its own numbers, Fall's lying frames as the Idle's, and Fall 1 (still in the air) ends within 3 sheet px of
Fall 6 (on the floor): a hover of 0 to 1 game px. So the hover is put in here: HOVER, the owl's 12 (tools/owl-sheet.py: a flier's lowest
pixel this far over the foot line), the same for every air row in every facing, the drawn bob in each row kept on top of it; Fall drops
from it (frame 1 at HOVER, 2 at half, then the floor), Prone's lifting frame at half, Still on the floor, Clamp's lowest pixel on ay.
Darkness is placed by its body (the brighter piece inside the ring), not by the ring's bottom, so it hovers where the idle does.
Colour: each later sheet toned to sheet 1 per channel (TONE, mirrorgnoll-sheet.py's way), by the mantle's colour (each figure's top 35%,
the part every view draws alike; the Clamp's bag glows pink inside): the front and the back by their idles against the turnaround's Front
and Back, the tricks by its Clamp against the turnaround's Right -- each later sheet drew it warmer. Still keeps its own cave-rock grey
(the sheet's tone only).
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

FILES = {1: os.path.join('Fresh', 'Darkmantle Cave Creature Sprite Sheet-5.png'), 2: os.path.join('Fresh', 'Darkmantle Clamp and Still Sprite Sheet-10.png'),
         3: os.path.join('Fresh', 'Darkmantle Front Animation Sprite Sheet-11.png'), 4: os.path.join('Fresh', 'Darkmantle Back-View Animation Sheet.png')}
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
CHAN = 25
# per sheet: text boxes (a blob wholly inside one is lettering: the row names; every row's number strip is added below), and its rows:
# (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe)
SHEETS = {
  1: dict(text=[(0, 290, 140, 1024)],
          rows=[('turn', (420, 0, 1010, 190), (190, 208), TURN, [498, 638, 781, 931]),
                ('idle', (0, 280, 1536, None), (367, 380), NUM(6), [202, 391, 548, 710, 874, 1039]),
                ('fly', (0, None, 1536, None), (477, 489), NUM(8), [227, 385, 563, 736, 906, 1077, 1251, 1423]),
                ('crush', (0, None, 1536, None), (585, 597), NUM(6), [193, 375, 563, 780, 973, 1148]),
                ('darkness', (0, None, 1536, None), (692, 706), NUM(6), [250, 462, 696, 941, 1180, 1407]),
                ('flinch', (0, None, 1536, None), (795, 807), NUM(4), [201, 357, 529, 701]),
                ('fall', (0, None, 1536, None), (898, 912), NUM(6), [189, 353, 529, 722, 922, 1124]),
                ('prone', (0, None, 1536, None), (994, 1006), NUM(2), [208, 389])]),
  2: dict(text=[(0, 0, 200, 1024)],
          rows=[('clamp', (0, 0, 1536, None), (440, 470), NUM(4), [343, 657, 985, 1304]),
                ('still', (0, None, 1536, None), (867, 896), NUM(4), [343, 657, 985, 1302])]),
  3: dict(text=[(0, 0, 150, 1024)],
          rows=[('idle', (0, 0, 1536, None), (254, 272), NUM(6), [247, 468, 676, 886, 1089, 1290]),
                ('fly', (0, None, 1536, None), (473, 491), NUM(8), [191, 369, 538, 705, 881, 1056, 1229, 1411]),
                ('crush', (0, None, 1536, None), (712, 730), NUM(6), [246, 463, 712, 950, 1150, 1340]),
                ('flinch', (0, None, 1536, None), (937, 954), NUM(4), [253, 448, 651, 866])]),
  4: dict(text=[(0, 0, 150, 1024)],
          rows=[('idle', (0, 0, 1536, None), (249, 267), NUM(6), [218, 443, 654, 881, 1105, 1330]),
                ('fly', (0, None, 1536, None), (465, 483), NUM(8), [197, 377, 554, 731, 907, 1082, 1257, 1432]),
                ('crush', (0, None, 1536, None), (699, 717), NUM(6), [224, 443, 699, 951, 1163, 1376]),
                ('flinch', (0, None, 1536, None), (925, 943), NUM(4), [235, 455, 653, 860])]),
}
SPLIT = {(1, 'prone'): 895}  # (sheet, row) -> the line between it and the row above, by hand: Prone 2 lifts its tip into Fall's numbers (898)
# painted navy whole before the cut, each the piece of figure at a point: sheet 1's portrait, its tentacles hanging into the idle's band
PAINT_OUT = {1: [(200, 150)]}
FIX, CUT, TOUCH_OK = {}, {}, {}

# the engine's rows: (sheet, row) for the side; S and N as described in the head
FRONT = BACK = ('idle', 'fly', 'crush', 'flinch')
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'fly'), 'attack': (1, 'crush'), 'crush': (1, 'crush'), 'darkness': (1, 'darkness'),
        'clamp': (2, 'clamp'), 'still': (2, 'still'), 'flinch': (1, 'flinch'), 'hurt': (1, 'fall'), 'prone': (1, 'prone')}
AIR = ('idle', 'fly', 'crush', 'darkness', 'flinch')   # the rows it hovers in
NEW = ['crush', 'darkness', 'clamp']                     # this cutter's own rows (named here, not in pixelate.py)
FPS = {'idle': 5, 'walk': 9, 'attack': 10, 'crush': 10, 'darkness': 8, 'clamp': 3, 'still': 2, 'flinch': 8, 'hurt': 8, 'prone': 6}
IDLE_AREA = 322       # the stand-in's side idle (darkmantle_p1 facing E, the median of its 8 frames, outline in): drawn px of ours to match
HOVER = 12            # every air row's lowest pixel this far over the foot (the owl's): the sheet drew none, see the head
FH, AY = 48, 44       # (the tallest frame stands 38 px over its foot: crush, the hover in)


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def gold_mask(rgb):
    """the two gold eyes: bright, red and green well over blue (the skirt's pink lights are blue-rich)"""
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (r > 190) & (g > 110) & (b < 110) & (r - b > 110)


def game_frame(im, k, tone=None):
    """a cut frame at game size, palette-snapped and outlined, its eyes kept (mirrorgnoll-sheet.py's GLINT: a game pixel whose block on the
    sheet is a quarter gold or more takes the gold, so the box filter doesn't wash the eyes into the dark mantle)"""
    if tone:
        im = toned(im, tone)
    w, h = im.size
    a = pix.pixelate(im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX), 1, do_lift=False)
    src = np.asarray(im)
    gm = gold_mask(src[..., :3]) & (src[..., 3] > 0)
    if gm.any():
        H, W = a.shape[:2]
        ys, xs = np.where(gm)
        gy = np.clip((ys * H / src.shape[0]).astype(int), 0, H - 1)
        gx = np.clip((xs * W / src.shape[1]).astype(int), 0, W - 1)
        cnt = np.zeros((H, W), int); np.add.at(cnt, (gy, gx), 1)
        hit = cnt >= max(2, int(0.25 * k * k))
        if hit.any():
            col = np.zeros((H, W, 3)); np.add.at(col, (gy, gx), src[ys, xs, :3].astype(float))
            a[hit, :3] = pix.snap((col[hit] / cnt[hit][:, None])[None] / 255.0)[0]
            a[hit, 3] = 255
    return a


def core_x(a):
    """x of the body's thick middle (the mantle and the head; the skirt and the tentacles are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def body(im):
    """a cut frame's measures on the sheet: sqrt of its area (holes filled) and its height"""
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    ys = np.where(m.any(1))[0]
    return float(np.sqrt(m.sum())), int(ys[-1] - ys[0] + 1)


def mean_rgb(frs):
    px = np.concatenate([np.asarray(im)[np.asarray(im)[..., 3] > 0][:, :3] for _, im, _ in frs]).astype(float)
    return px.mean(0)


def eyes(im):
    """(tip, eyes): the mantle's tip (the figure's top pixel) and the gold eyes' middle, in the cut's px; None if no eyes show"""
    a = np.asarray(im).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    gold = (al > 0) & gold_mask(a)
    if gold.sum() < 4:
        return None
    ys, xs = np.where(al > 0)
    top = ys.min()
    tip = (float(xs[ys <= top + 1].mean()), float(top))
    gy, gx = np.where(gold)
    return tip, (float(gx.mean()), float(gy.mean()))


def mantle(frs):
    """the mantle's length, tip to the eyes' middle, the median over a row's frames"""
    ds = []
    for _, im, _ in frs:
        te = eyes(im)
        if te:
            (tx, ty), (ex, ey) = te
            ds.append(np.hypot(ex - tx, ey - ty))
    return float(np.median(ds))


def eye_gap(frs):
    """the two eyes' distance apart (a front view), the median over a row's frames"""
    ds = []
    for _, im, _ in frs:
        a = np.asarray(im)
        gold = (a[..., 3] > 0) & gold_mask(a)
        lab, n = ndimage.label(ndimage.binary_dilation(gold, iterations=1))
        if n >= 2:
            big = 1 + np.argsort(ndimage.sum(gold, lab, range(1, n + 1)))[-2:]
            (y0, x0), (y1, x1) = [np.array(np.where(lab == k)).mean(1) for k in big]
            ds.append(np.hypot(x1 - x0, y1 - y0))
    return float(np.median(ds))


def body_foot(im):
    """the Darkness row's foot: the bottom of its body (the piece brighter than the ring round it), in the cut's px"""
    a = np.asarray(im).astype(int)
    lit = (a[..., 3] > 0) & (a[..., :3].mean(-1) > 60)
    lab, n = ndimage.label(lit, structure=np.ones((3, 3)))
    big = 1 + int(np.argmax(ndimage.sum(lit, lab, range(1, n + 1))))
    return int(np.where((lab == big).any(1))[0][-1])


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
                rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows], chan=CHAN)
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    over = [] if check else None
    path = os.path.join(SRC, FILES[L])
    if L in PAINT_OUT:
        img = np.asarray(Image.open(path).convert('RGB')).copy()
        navy = np.median(img.reshape(-1, 3)[::97], axis=0)
        lab, _ = ndimage.label(np.abs(img.astype(int) - navy).max(-1) > CHAN, structure=np.ones((3, 3)))
        for px, py in PAINT_OUT[L]:
            img[lab == lab[py, px]] = navy.astype(np.uint8)
        path = os.path.join(tempfile.gettempdir(), 'darkmantle-sheet-%d.png' % L)
        Image.fromarray(img).save(path)
    try:
        out = SR.cut_sheet(path, spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()), overlay=over, tag='sheet %d' % L)
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'darkmantle'); os.makedirs(d, exist_ok=True)
        im = over[0]
        dr = ImageDraw.Draw(im)
        for row, frs in out.items():                              # every frame boxed, its row and number by it
            for nm, _, (bx0, by0, bx1, by1) in frs:
                dr.rectangle((bx0, by0, bx1 - 1, by1 - 1), outline=(255, 255, 255))
                dr.text((bx0 + 2, by0 - 11), '%s %s' % (row, nm), fill=(255, 255, 0))   # (the tag above the box: nothing inside a frame)
        im.save(os.path.join(d, 'cut-%d.png' % L))
    return out


def game_k(frs, area):
    """the K at which a row's frames, cut to game size, are drawn `area` px (the median, outline in)"""
    lo, hi = 1.0, 12.0
    for _ in range(18):
        k = (lo + hi) / 2
        got = float(np.median([(game_frame(im, k)[..., 3] > 0).sum() for _, im, _ in frs]))
        lo, hi = (k, hi) if got > area else (lo, k)
    return (lo + hi) / 2


def scales(c):
    """K per sheet and row (sheet px a game px); the turnaround the go-between for the front and the back"""
    med = lambda frs, i=0: float(np.median([body(im)[i] for _, im, _ in frs]))
    k1 = game_k(c[1]['idle'], IDLE_AREA)
    turn = {nm: (nm, im, box) for nm, im, box in c[1]['turn']}
    m_idle, m_right, m_clamp = mantle(c[1]['idle']), mantle([turn['right']]), mantle(c[2]['clamp'])
    kt = k1 * m_right / m_idle
    kt_area = k1 * body(turn['right'][1])[0] / med(c[1]['idle'])
    k2 = k1 * m_clamp / m_idle
    # the front: by its area against the turnaround's Front it would come out 1.48 times the turnaround, by its height 1.30, by its mantle 1.15
    # and its eyes' gap 1.20 -- its idle spreads the skirt wide where the turnaround's hangs, so the area reads the skirt, not the creature,
    # and S would draw the mantle a fifth smaller than E: it meets the turnaround by the two rigid measures (their mean)
    m_front, m_tf = mantle(c[3]['idle']), mantle([turn['front']])
    g_front, g_tf = eye_gap(c[3]['idle']), eye_gap([turn['front']])
    k3 = kt * (m_front / m_tf + g_front / g_tf) / 2
    k3_area = kt * med(c[3]['idle']) / body(turn['front'][1])[0]
    K = {(1, r): k1 for r in c[1]}
    K.update({(2, r): k2 for r in c[2]})
    # the front's rows are not all drawn at its idle's size (its Fly's eyes 0.91 of the idle's gap apart): each row meets the idle by the gap
    # (the mantle foreshortens as it tilts toward the viewer; the gap does not); behind, no eyes: each row meets the front's same row by area
    # (one motion seen from both sides by the same round, the skirt spread the same)
    for r in c[3]:
        K[(3, r)] = k3 * eye_gap(c[3][r]) / g_front
        K[(4, r)] = K[(3, r)] * med(c[4][r]) / med(c[3][r])
    k4_area = kt * med(c[4]['idle']) / body(turn['back'][1])[0]
    print('  K: sheet 1 %.2f, turnaround %.2f (by area against the side idle it would be %.2f), tricks %.2f; the front %s (its idle by area '
          'would be %.2f); behind %s (its idle by area against the turnaround Back %.2f); the mantle tip-to-eyes %.1f px on the idle, %.1f on '
          'the turnaround Right, %.1f on the Clamp; front/turnaround mantle %.3f, eye gap %.3f'
          % (k1, kt, kt_area, k2, ' '.join('%s %.2f' % (r, K[(3, r)]) for r in c[3]), k3_area,
             ' '.join('%s %.2f' % (r, K[(4, r)]) for r in c[4]), k4_area, m_idle, m_right, m_clamp, m_front / m_tf, g_front / g_tf))
    return K


def cone_rgb(frs):
    """the mean colour of the mantle (each figure's top 35%: the cone, the one part every view draws alike)"""
    px = []
    for _, im, _ in frs:
        a = np.asarray(im)
        ys = np.where((a[..., 3] > 0).any(1))[0]
        top = a[:ys[0] + int(0.35 * (ys[-1] - ys[0] + 1))]
        px.append(top[top[..., 3] > 0][:, :3])
    return np.concatenate(px).astype(float).mean(0)


def tones(c):
    """per channel, each later sheet's figure brought to sheet 1's by the mantle's colour (its turnaround's matching view)"""
    turn = {nm: [(nm, im, box)] for nm, im, box in c[1]['turn']}
    t = {2: cone_rgb(turn['right']) / cone_rgb(c[2]['clamp']), 3: cone_rgb(turn['front']) / cone_rgb(c[3]['idle']),
         4: cone_rgb(turn['back']) / cone_rgb(c[4]['idle'])}
    print('  TONE: ' + ', '.join('sheet %d %s' % (L, ' '.join('%.3f' % v for v in f)) for L, f in t.items())
          + ' (the side idle mantle against the turnaround Right: %s)' % ' '.join('%.3f' % v for v in cone_rgb(turn['right']) / cone_rgb(c[1]['idle'])))
    return {L: tuple(float(v) for v in f) for L, f in t.items()}


def place(a, x_ref, foot, up, fw, ax):
    """a 1x RGBA array onto an fw x FH frame: x_ref at ax, its row `foot` `up` px above AY"""
    out = np.zeros((FH, fw, 4), dtype=np.uint8)
    ox, oy = int(round(ax - x_ref)), AY - foot - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    TONE = tones(c)
    small = {}
    def frames_of(L, row):
        """the row's frames at game size: (array, x of its middle, its foot row in the array, how far its foot is over the floor)"""
        if (L, row) not in small:
            frs = c[L][row]
            foot_s = [body_foot(im) + box[1] for _, im, box in frs] if row == 'darkness' else [box[3] - 1 for _, _, box in frs]
            floor = max(foot_s)
            out = []
            for (nm, im, box), fs in zip(frs, foot_s):
                a = game_frame(im, K[(L, row)], TONE.get(L))
                bottom = int(np.where(a[..., 3].any(axis=1))[0][-1])
                foot = bottom if row != 'darkness' else min(bottom, int(round((fs - box[1]) * a.shape[0] / im.size[1])))
                up = int(round((floor - fs) / K[(L, row)])) + (HOVER if row in AIR else 0)
                out.append((a, core_x(a), foot, up))
            if row == 'fall':                                     # it drops from the hover: frame 1 where the idle was, 2 half way, then the floor
                out = [(a, cx, ft, up + (HOVER, HOVER // 2)[i] if i < 2 else up) for i, (a, cx, ft, up) in enumerate(out)]
            if row == 'prone':                                    # lifting (half way up), then lying: lies at its last frame, gets up backwards
                out = [(a, cx, ft, up + (HOVER // 2 if i == 1 else 0)) for i, (a, cx, ft, up) in enumerate(out)][::-1]
            small[(L, row)] = out
        return small[(L, row)]
    src = {}
    for eng, (L, row) in ROWS.items():
        side = frames_of(L, row)
        per = []
        for f in range(8):
            if f == 0 and L == 1 and row in FRONT:
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
        half = max(max(cx, a.shape[1] - cx) for fs in per for a, cx, _, _ in fs)    # each row its own width, about the middle (a mirror keeps it)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, fs in enumerate(per):
            row = []
            for a, cx, foot, up in fs:
                if f in (1, 2, 3):
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, foot, up, fw, fw // 2)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(sorted(set(lost))))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'darkmantle_p2'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    meta['source'] = ('generated by Griz (2026-10-08: the body and its rows, its Clamp and Still, from the front, from behind -- four GPT '
                      'sheets), cut by tools/darkmantle-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    side = [(fr[..., 3] > 0).sum() for fr in frames['idle'][6]]
    print('  the side idle: a median %d px drawn (the stand-in %d), %d px tall; hover %d px; the clamp %d px wide'
          % (np.median(side), IDLE_AREA, max(int(np.ptp(np.where(fr[..., 3].any(1))[0])) + 1 for fr in frames['idle'][6]), HOVER,
             max(int(np.ptp(np.where(fr[..., 3].any(0))[0])) + 1 for fr in frames['clamp'][6])))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'darkmantle')
        lineup(frames, os.path.join(d, 'lineup.png'))
        facings(frames, sizes, os.path.join(d, 'facings.png'))


def first(name, anim, f, i=0):
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims'][anim]
    y = an['y'] + f * an['fh']
    return im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']], an['ax'], an['ay'], m.get('top', 0)


def paste(canvas, a, x, y0):
    sub = canvas[y0:y0 + a.shape[0], x:x + a.shape[1]]
    al = a[:sub.shape[0], :sub.shape[1], 3:4] / 255.0
    sub[..., :3] = (a[:sub.shape[0], :sub.shape[1], :3] * al + sub[..., :3] * (1 - al)).astype(np.uint8)


def trim(a, ax, pad=3):
    """a frame cut to its drawn columns (a few px either side), its anchor x moved with it"""
    xs = np.where(a[..., 3].any(0))[0]
    x0, x1 = max(0, xs.min() - pad), min(a.shape[1], xs.max() + 1 + pad)
    return a[:, x0:x1], ax - x0


def lineup(frames, path):
    """the gnoll (Medium), the goblin (Small), the stand-in, then it (E idle, S, N, the darkness, still) and the gnoll with its Clamp where
    ui.js perchPos 'over' puts it (its foot 13 px below his crown), at 4x on a grey floor, the foot line marked"""
    figs = [first('gnoll_p2', 'idle', 6), first('goblin_p2', 'idle', 6), first('darkmantle_p1', 'idle', 6),
            first('darkmantle_p2', 'idle', 6), first('darkmantle_p2', 'idle', 0), first('darkmantle_p2', 'idle', 4),
            first('darkmantle_p2', 'darkness', 6, 5), first('darkmantle_p2', 'still', 6)]
    figs = [trim(a, ax) + (ay, t) for a, ax, ay, t in figs]
    g = first('gnoll_p2', 'idle', 6); g = trim(g[0], g[1], 12) + g[2:]
    cl = first('darkmantle_p2', 'clamp', 6, 2)
    W = sum(a.shape[1] for a, _, _, _ in figs) + g[0].shape[1] + 6 * (len(figs) + 2)
    top = max(max(ay for _, _, ay, _ in figs + [g]), g[3] - 13 + cl[2]) + 6    # (room over the gnoll for the Clamp's frame)
    H = top + max(a.shape[0] - ay for a, _, ay, _ in figs + [g])
    canvas = np.zeros((H, W, 4), np.uint8); canvas[..., :3] = (70, 74, 70); canvas[..., 3] = 255
    canvas[top, :, :3] = (110, 120, 110)                            # the foot line
    x = 5
    for a, ax, ay, _ in figs:
        paste(canvas, a, x, top - ay); x += a.shape[1] + 6
    paste(canvas, g[0], x, top - g[2])
    crown = top - g[3]                                             # (S.unitTop: the sheet's top)
    cx0 = x + g[1] - cl[1]
    if cx0 < 0:
        raise SystemExit('lineup: the clamp runs off the left')
    paste(canvas, cl[0], cx0, crown + 13 - cl[2])
    Image.fromarray(canvas).resize((W * 4, H * 4), Image.NEAREST).save(path)


def facings(frames, sizes, path):
    """every row's frames for facings E (side), S (front) and N (behind) at 3x on grey, each cut about its anchor to the row's drawn width,
    the foot line (grey) and the hover line (blue) marked"""
    rows = [r for r in pix.ANIM_ORDER if r in frames]
    half = {}
    for r in rows:
        ax = sizes[r][2]
        xs = np.where(np.any([fr[..., 3].any(0) for f in (6, 0, 4) for fr in frames[r][f]], axis=0))[0]
        half[r] = int(max(ax - xs.min(), xs.max() + 1 - ax)) + 2
    W = max(3 * len(frames[r][0]) * 2 * half[r] + 3 * 8 for r in rows)
    top = {r: min(np.where(np.any([fr[..., 3].any(1) for f in (6, 0, 4) for fr in frames[r][f]], axis=0))[0]) - 2 for r in rows}
    H = sum(FH - top[r] + 4 for r in rows)
    canvas = np.zeros((H, W, 4), np.uint8); canvas[..., :3] = (70, 74, 70); canvas[..., 3] = 255
    y = 0
    for r in rows:
        x, ax = 0, sizes[r][2]
        for f in (6, 0, 4):
            for fr in frames[r][f]:
                paste(canvas, fr[top[r]:, ax - half[r]:ax + half[r]], x, y); x += 2 * half[r]
            x += 8
        canvas[y + AY - top[r], :, :3] = (110, 120, 110); canvas[y + AY - HOVER - top[r], ::3, :3] = (90, 140, 255)
        y += FH - top[r] + 4
    Image.fromarray(canvas).resize((W * 3, H * 3), Image.NEAREST).save(path)


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])

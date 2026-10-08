"""DEEP16 pipeline 2 (generated art): Griz's two GPT sheets of GreyFang, the grizzled ranger -> greyfang_p1.

    python tools/greyfang-sheet.py            (writes deep16/art/greyfang_p1.png/.json)
    python tools/greyfang-sheet.py check      (also the cut overlays, dev/visions/greyfang/cut-<n>.png, a contact strip of every row and a lineup beside Talmok)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/Fresh/Greyfang_ Grizzled Veteran Ranger Sprite Sheet-1.png
and Greyfang's extra moves sprite sheet-2.png (a CURLY apostrophe in the second's name) -- Griz, 2026-10-08. GreyFang: a man with a wolf's head,
a grizzled veteran ranger in a torn green cloak, a longbow in his hand, a quiver of arrows on his back, a sword for the close work.
Not ruled how the game plays him -- the seat's (deep16/js/classes.js, data/foes.js); this cuts every row under the names the engine reads.

Each sheet: a portrait, a turnaround (front, right, back, left), then rows facing RIGHT, labelled by number. Sheet 1: idle 2, walk 9, bow 13,
hurt 6, cast 7. Sheet 2: slash 6, volley 8, whirlwind 8, climb 6, prone 2, fall 6, parry 6, backstep 6. Sheet 2's turnaround holds a sword in
its Right still, so the scale and the stills are sheet 1's; sheet 2's is cut only to tone against (its front, back and left carry the same kit).
Engine rows: `idle` <- Idle; `walk` <- Walk; `longbow` <- Bow (the engine plays a row named for the blow, lower-cased, battle.js attack: his
Longbow; a blow named Shortbow would find no row and play `attack`); `attack` and `slash` <- Slash; `cast` <- Cast; `climb` <- Climb; `flinch` <-
Hurt (a blow that lands and doesn't drop him); `hurt` <- Fall (he goes down, the bow dropped: the engine's `hurt` is the fall); `prone` <-
Prone, played in reverse (the sheet draws him lying then pushing up on an arm; the engine falls through the row, lies at its last frame and gets
up backwards -- sprites.js S.proneRow, the hobgoblin's way). New rows, named here (not in pixelate.py): `volley` (the Hunter's Volley: its
`release` is where the three arrows leave), `whirlwind` (Whirlwind Attack), `parry`, `backstep`; and `slash`. `longbow`'s `release` is the frame
the string hand lets go (the arrow is gone from the bow: 10 of 13).
Facings: NE, E and SE take the side rows as drawn, SW, W and NW mirrored; S takes the turnaround's Front still as its idle and N the Back
still (one still, set into both idle frames); every other row plays side-on from S and N (as the twin's non-front rows do).
Scale: the side idle stands HEIGHT px -- as tall as Talmok's (talmok_p1's side idle, 63 px with its outline); sheet 2 meets sheet 1 by the
guard both draw (sheet 1's idle against the first frames of sheet 2's slash, parry and backstep, by area); the turnaround's Front still
stands STILL_H by height (upright, against the rows' deep crouch: by area it stood 84 and a turn popped -- scales()). Colour: sheet 2 drew him warmer or cooler than sheet 1 (the most-played rows), so it is brought to
sheet 1's per channel (TONE, the twin's way: sheet 2's front, back and left stills against sheet 1's). The twin is tools/mirrorgnoll-sheet.py.
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

FILES = {1: os.path.join('Fresh', 'Greyfang_ Grizzled Veteran Ranger Sprite Sheet-1.png'),
         2: os.path.join('Fresh', 'Greyfang’s extra moves sprite sheet-2.png')}     # (a curly apostrophe)
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering: the title, the row names; every row's number strip is added below), and its rows:
# (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe)
SHEETS = {
  1: dict(text=[(0, 0, 640, 45), (0, 280, 100, 1024)],
          rows=[('turn', (300, 0, 960, 250), (250, 274), TURN, [383, 527, 688, 852]),
                ('idle', (0, 272, 1536, None), (380, 394), NUM(2), [145, 282]),
                ('walk', (0, None, 1536, None), (511, 526), NUM(9), [145, 282, 415, 553, 680, 818, 954, 1084, 1215]),
                ('bow', (0, None, 1536, None), (660, 676), NUM(13), [146, 260, 376, 482, 590, 704, 810, 922, 1039, 1147, 1256, 1362, 1472]),
                ('hurt', (0, None, 1536, None), (808, 823), NUM(6), [147, 284, 435, 572, 712, 858]),
                ('cast', (0, None, 1536, None), (958, 973), NUM(7), [144, 270, 408, 542, 678, 817, 959])]),
  2: dict(text=[(0, 0, 640, 45), (0, 222, 168, 1024)],
          rows=[('turn', (300, 0, 960, 204), (201, 226), TURN, [378, 528, 681, 836]),
                ('slash', (0, 221, 1536, None), (309, 328), NUM(6), [210, 366, 537, 718, 889, 1036]),
                ('volley', (0, None, 1536, None), (413, 432), NUM(8), [210, 368, 538, 690, 860, 1014, 1180, 1346]),
                ('whirlwind', (0, None, 1536, None), (526, 546), NUM(8), [210, 366, 536, 704, 877, 1067, 1248, 1416]),
                ('climb', (0, None, 1536, None), (628, 648), NUM(6), [208, 366, 523, 668, 818, 968]),
                ('prone', (0, None, 1536, None), (694, 712), NUM(2), [232, 403]),
                ('fall', (0, None, 1536, None), (787, 805), NUM(6), [191, 340, 492, 656, 822, 1003]),
                ('parry', (0, None, 1536, None), (892, 911), NUM(6), [211, 369, 525, 698, 872, 1049]),
                ('backstep', (0, None, 1536, None), (998, 1016), NUM(6), [205, 380, 573, 759, 954, 1134])]),
}
SPLIT = {(2, 'fall'): 696, (2, 'parry'): 788}   # (sheet, row) -> the line between it and the row above, by hand where the two crowd: prone's feet end at 691 and fall 1's ears start at 701; fall's feet end at 784 and parry 2's dotted arc starts at 791
ERASE = {}            # a number that touches a figure: its glyph painted navy before the cut
BLANK = {1: [(0, 45, 298, 274)]}     # the portrait (the cut has no use for it)
FIX = {2: {'volley': [((1046, 326, 1120, 372), '6')]}}   # loose bits by hand: volley 6's three arrows: a loose blob is dealt out pixel by pixel to the nearest body, and the heads lie nearer frame 7's
CUT = {}
TOUCH_OK = {}

# the engine's rows: engine name -> (sheet, row)
ROWS = {'idle': (1, 'idle'), 'walk': (1, 'walk'), 'longbow': (1, 'bow'), 'attack': (2, 'slash'), 'slash': (2, 'slash'), 'cast': (1, 'cast'),
        'climb': (2, 'climb'), 'flinch': (1, 'hurt'), 'hurt': (2, 'fall'), 'prone': (2, 'prone'), 'volley': (2, 'volley'),
        'whirlwind': (2, 'whirlwind'), 'parry': (2, 'parry'), 'backstep': (2, 'backstep')}
REVERSED = {'prone'}                      # played backwards: the sheet's lying-then-pushing-up, so he lies at the last frame
STILL = {'idle': {0: 'front', 4: 'back'}}      # facing -> the turnaround's still, for this row (the other rows play side-on from S and N)
NEW = ['slash', 'volley', 'whirlwind', 'parry', 'backstep']    # this cutter's own rows (named here, not in pixelate.py)
FPS = {'idle': 4, 'walk': 10, 'longbow': 12, 'attack': 12, 'slash': 12, 'cast': 8, 'climb': 8, 'flinch': 10, 'hurt': 8, 'prone': 8,
       'volley': 12, 'whirlwind': 14, 'parry': 10, 'backstep': 12}
RELEASE = {'longbow': 9, 'volley': 5}     # the frame the arrow(s) are gone from the string: js/battle.js times the shot by it (0-based)
GUARD = [('slash', 0), ('parry', 0), ('backstep', 0)]      # sheet 2 frames that stand in sheet 1's idle guard
TONE = {2: (0.886, 0.922, 1.026)}   # (pooled over the front, back and left stills: sheet 2's 80.9 67.0 47.8 to sheet 1's 71.7 61.8 49.0)
HEIGHT = 60           # the side idle, standing px before the outline (Talmok's 63 with it)
STILL_H = 67          # the turnaround's Front still, px before the outline (S 68, N 69 with it, the side idle 63): see scales()
FH, AY = 112, 100


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
    """x of the body's thick middle (torso and head; the arms and the tail are thin), the steadiest thing frame to frame"""
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
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    over = [] if check else None
    path = os.path.join(SRC, FILES[L])
    if L in ERASE or L in BLANK:
        img = np.asarray(Image.open(path).convert('RGB')).copy()
        navy = np.median(img.reshape(-1, 3)[::97], axis=0).astype(np.uint8)
        for x0, y0, x1, y1 in ERASE.get(L, ()):
            box = img[y0:y1, x0:x1].astype(int)
            glyph = (box.mean(-1) > 140) | ((box[..., 2] >= box[..., 0]) & (box.mean(-1) > 50))
            img[y0:y1, x0:x1][glyph] = navy
        for x0, y0, x1, y1 in BLANK.get(L, ()):
            img[y0:y1, x0:x1] = navy
        path = os.path.join(tempfile.gettempdir(), 'greyfang-sheet-%d.png' % L)
        Image.fromarray(img).save(path)
    try:
        out = SR.cut_sheet(path, spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()),
                           overlay=over, tag='sheet %d' % L)
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'greyfang'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
        for r in rows:                                            # a frame whose box reaches its band's edge may have been clipped there
            for nm, im, box in out.get(r[0], ()):
                if r[0] != 'turn' and (box[1] + 2 <= r[1][1] + 1 or box[3] - 2 >= r[1][3] - 1):
                    print('  near the band edge: sheet %d %s %s box %s band y %d-%d' % (L, r[0], nm, box, r[1][1], r[1][3]))
    return out


def figure_mean(im):
    """mean RGB over a cut frame's figure"""
    a = np.asarray(im)
    return a[a[..., 3] > 0][:, :3].mean(0)


def scales(c):
    """K per sheet (sheet px a game px), the turnaround meeting sheet 1 by its Right still against the idle"""
    med = lambda frs, i=0: float(np.median([body(im)[i] for _, im, _ in frs]))
    idle = med(c[1]['idle'])
    k1 = med(c[1]['idle'], 1) / HEIGHT
    guards = [body(c[2][r][i][1])[0] for r, i in GUARD]
    k2 = k1 * float(np.median(guards)) / idle
    # the turnaround by height: its Front still stands STILL_H (the seat, 10-08: matched by area to the idle it stood 84 against the crouch's
    # 63 -- right by his feet and fletching, but he crouches deep in every row and stands upright in the stills, and a turn popped; Griz's
    # earth elemental, 10-08: "bringing the front and back views down to the size of the rest ... so long as the difference is less obvious
    # it's a win"; 70 is the made gnoll's side-to-front, 64 to 71)
    kt = body(c[1]['turn'][0][1])[1] / STILL_H
    print('  K: sheet 1 %.3f, sheet 2 %.3f (its guards %s against sheet 1\'s idle %.1f), turnaround %.3f; the side idle %d px (sheet), front still %.0f px, back still %.0f px'
          % (k1, k2, ' '.join('%.1f' % g for g in guards), idle, kt, HEIGHT,
             body(c[1]['turn'][0][1])[1] / kt, body(c[1]['turn'][2][1])[1] / kt))
    return {1: k1, 2: k2, 't': kt}


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    K = scales(c)
    for L in c:
        print('  tone sheet %d stills:' % L, ' '.join('%s %s' % (nm, np.round(figure_mean(im), 1).tolist()) for nm, im, _ in c[L]['turn']))
    rowmean = lambda L, rows: np.round(np.mean([figure_mean(toned(im, TONE[L]) if L in TONE else im) for r in rows for _, im, _ in c[L][r]], axis=0), 1).tolist()
    print('  bow-in-hand rows, sheet 1 idle+walk %s against sheet 2 volley+backstep (toned) %s' % (rowmean(1, ['idle', 'walk']), rowmean(2, ['volley', 'backstep'])))
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
    def still(name):
        for nm, im, box in c[1]['turn']:
            if nm == name:
                a = game_frame(im, K['t'])
                return a, core_x(a), 0
    src = {}
    for eng, (L, row) in ROWS.items():
        side = frames_of(L, row)
        if eng in REVERSED:
            side = side[::-1]
        per = []
        for f in range(8):
            if f in STILL.get(eng, {}):
                st = still(STILL[eng][f])
                per.append([st] * len(side))
            else:
                per.append(side)
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
    name = 'greyfang_p1'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    for row, k in RELEASE.items():
        meta['anims'][row]['release'] = k
    s0 = frames['idle'][0][0]                       # (the panel's portrait centres on his face: his front still's first opaque row, twelve px down to the eyes -- ui.js, the twin's way)
    meta['face'] = int(AY - np.where(s0[..., 3].any(axis=1))[0][0] - 12)
    meta['source'] = ('generated by Griz (2026-10-08: two GPT sheets -- the body and its rows, then the extra moves), cut by tools/greyfang-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    h = lambda fr: np.where(fr[..., 3].any(axis=1))[0]
    side = [h(fr) for fr in frames['idle'][6]]
    print('  side idle (E) opaque height with outline: %s px (Talmok 63); S still %d px, N still %d px'
          % ([int(r[-1] - r[0] + 1) for r in side], h(frames['idle'][0][0])[-1] - h(frames['idle'][0][0])[0] + 1,
             h(frames['idle'][4][0])[-1] - h(frames['idle'][4][0])[0] + 1))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'greyfang')
        lineup(frames, os.path.join(d, 'lineup.png'))
        strips(frames, meta, d)


def art_frame(name, anim, facing, i):
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims'][anim]
    y = an['y'] + facing * an['fh']
    return im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']], an['ax'], an['ay']


def lineup(frames, path):
    """Talmok, the hobgoblin, the mirror-eyed gnoll and GreyFang (E, S, N), at 4x on a grey floor (his size, for Griz's eye)"""
    figs = [art_frame('talmok_p1', 'idle', 6, 0), art_frame('hobgoblin_p2', 'idle', 6, 0), art_frame('mirrorgnoll_p1', 'idle', 6, 0),
            art_frame('greyfang_p1', 'idle', 6, 0), art_frame('greyfang_p1', 'idle', 0, 0), art_frame('greyfang_p1', 'idle', 4, 0)]
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


def strips(frames, meta, d, z=3):
    """a contact strip a row (the E facing, a grey floor, the frame's number, the release frame ringed), and every facing of the idle"""
    for eng, per in frames.items():
        fs = per[6]
        fw = meta['anims'][eng]['fw']
        W, H = fw * len(fs) + 4 * (len(fs) + 1), FH
        cv = Image.new('RGBA', (W, H), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for i, fr in enumerate(fs):
            x = 4 + i * (fw + 4)
            cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (x, 0))
            dr.line([(x, AY + 1), (x + fw, AY + 1)], fill=(110, 114, 110, 255))
            dr.text((x + 2, 2), str(i + 1), fill=(255, 255, 255, 255))
            if meta['anims'][eng].get('release') == i:
                dr.rectangle([x, 0, x + fw - 1, H - 1], outline=(255, 90, 90, 255))
        cv.resize((W * z, H * z), Image.NEAREST).save(os.path.join(d, 'row-%s.png' % eng))
    fw = meta['anims']['idle']['fw']
    cv = Image.new('RGBA', (fw * 16 + 40, FH), (70, 74, 70, 255))
    for f in range(8):
        for i in range(2):
            cv.alpha_composite(Image.fromarray(frames['idle'][f][i], 'RGBA'), (4 + (f * 2 + i) * (fw + 2), 0))
    cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'idle-facings.png'))


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])

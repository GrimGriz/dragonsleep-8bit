"""DEEP16 pipeline 2 (generated art): Griz's second round of generated sheets for Rascal -> one palette sprite sheet, rascal_p2.

    python tools/rascal-sheet-p2.py [check=1]

Sources (gitignored; masters in dev/visions/rascal/): deep16/_src/rascal_grok_2.png ("Rascal the Lobstamonkee Sprite Sheet1.png": sheet 1
redone, the face as the felt's and the hat charcoal grey), rascal_grok_3.png ("Sheet2.png": sheet 2) and rascal_grok_4.png ("Rascal Social
Sharing Sprite Sheet3.png": one row at a larger scale, a second take on the bow) -- Griz, 2026-10-07, from the pastes in deep16-art-in-hand.md
"RASCAL, SHEET 1" and "RASCAL, SHEET 2". Each sheet is cut by its own row and number labels (tools/sheetrows.py, Goose's recipe; the boxes below
were read off the sheets). The row maps are the pastes': turnaround -> idle by facing; Walk -> walk; Pinch -> attack; Social Sharing ->
socialsharing; Social Flame -> socialflame; Climb -> climb; Flinch -> flinch; Fall -> hurt; Prone -> prone; Fire Bolt -> cast; Social
Distancing -> socialdistancing; Hot Take -> hottake; Going Viral -> goingviral.

The same pass as Goose's: each figure boxed down to game size, snapped to deep16/palette.json and outlined. The sheets draw him at their own
sizes, so each row takes its own scale by his hat's brim (K below) and the frames meet at one size. The rows face LEFT as drawn (his claw is his
right arm, nearest the viewer): facings SW, W and NW take them as drawn, NE, E and SE mirrored; S and N take sheets 4 and 5 (10-07: his moves
from the front and from behind -- idle, walk, Pinch, Fire Bolt, Hot Take, Going Viral, Flinch, and the climb from behind), the side frames for
the rest (the bow, the dance, the spin, the fall, prone). The hat is charcoal grey on these
sheets, not the background's navy, so it cuts whole. (p1, his first sheet, and its cutter tools/rascal-sheet.py with its whisker erase and
the hat it lost to the navy, retired 10-07 on his word: "the invisible hat one has no further purpose".)

`check=1` cuts every row of every sheet, writes each sheet with its frames tinted (dev/visions/rascal/p2-cut-<sheet>.png) and prints the
scales, without writing the look.
"""
import os, sys, json
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
OPT = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a)
CHECK = OPT.get('check') == '1'

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: its thresholds (the navy is bluer than Goose's, 47-66, and the tail's black bands read 10-30: tools/sheetrows.py), text boxes (a
# blob wholly inside one is lettering, dropped) and the rows: (row, band x0 y0 x1 y1, label strip y0 y1, the labels' names in order -- sheet
# 1's climb is labelled 1 2 3 4 6)
SHEETS = {
    '1': dict(file='rascal_grok_2.png', grey=30, far=60,
              text=[(75, 5, 980, 56), (380, 293, 1010, 320), (25, 334, 228, 360), (25, 491, 240, 518), (25, 645, 360, 673),
                    (25, 814, 330, 840), (25, 993, 235, 1018), (25, 1162, 245, 1188), (25, 1313, 215, 1341), (760, 1313, 980, 1341)],
              rows=[('turnaround', (372, 95, 1040, 292), (293, 318), TURN),
                    ('walk', (0, 359, 1055, 467), (467, 484), NUM(8)),
                    ('pinch', (0, 516, 1055, 625), (625, 642), NUM(6)),
                    ('sharing', (0, 671, 1055, 789), (789, 807), NUM(6)),
                    ('flame', (0, 837, 1055, 970), (970, 988), NUM(8)),
                    ('climb', (0, 1016, 1055, 1141), (1141, 1159), ['1', '2', '3', '4', '6']),
                    ('flinch', (0, 1186, 1055, 1298), (1298, 1316), NUM(4)),
                    ('fall', (0, 1340, 744, 1447), (1447, 1469), NUM(6)),
                    ('prone', (749, 1340, 1055, 1447), (1447, 1469), NUM(2))]),
    '2': dict(file='rascal_grok_3.png', grey=30, far=60,
              text=[(75, 5, 980, 56), (25, 343, 240, 371), (25, 534, 300, 561), (25, 732, 410, 764), (25, 949, 300, 977),
                    (25, 1153, 325, 1186)],
              rows=[('walk', (0, 372, 1055, 482), (482, 505), NUM(8)),
                    ('firebolt', (0, 562, 1055, 680), (680, 702), NUM(6)),
                    ('distancing', (0, 764, 1055, 895), (895, 921), NUM(6)),
                    ('hottake', (0, 978, 1055, 1106), (1106, 1129), NUM(4)),
                    ('viral', (0, 1186, 1055, 1362), (1362, 1388), NUM(8))]),
    '3': dict(file='rascal_grok_4.png', grey=30, far=60,
              text=[(60, 140, 1000, 230)],
              rows=[('sharing', (0, 226, 2172, 556), (556, 604), NUM(6))]),
    # his moves from the front (sheet 4) and from behind (sheet 5): GPT, Griz 10-07, from the pastes in deep16-art-in-hand.md "Goose and Rascal
    # from the front and from behind" (deep16/_src/rascal_gpt_4.png, rascal_gpt_5.png). Front: the claw on the viewer's left; behind: on the right
    '4': dict(file='rascal_gpt_4.png', grey=30, far=60,
              text=[(0, 0, 1086, 52), (20, 68, 222, 101), (20, 248, 228, 281), (20, 438, 238, 471), (20, 624, 292, 657), (20, 808, 283, 841),
                    (20, 986, 309, 1021), (20, 1204, 248, 1237)],
              rows=[('idle', (0, 98, 1086, 233), (233, 251), NUM(4)),
                    ('walk', (0, 279, 1086, 409), (409, 432), NUM(8)),
                    ('pinch', (0, 468, 1086, 599), (599, 622), NUM(6)),
                    ('firebolt', (0, 655, 1086, 784), (784, 807), NUM(6)),
                    ('hottake', (0, 838, 1086, 966), (966, 989), NUM(4)),
                    ('viral', (0, 1018, 1086, 1169), (1169, 1192), NUM(8)),
                    ('flinch', (0, 1235, 1086, 1387), (1387, 1410), NUM(4))]),
    '5': dict(file='rascal_gpt_5.png', grey=30, far=60,
              text=[(0, 0, 1086, 52), (18, 62, 222, 95), (18, 218, 227, 250), (18, 397, 238, 430), (18, 568, 286, 601), (18, 739, 285, 772),
                    (18, 892, 285, 928), (18, 1072, 245, 1104), (18, 1226, 236, 1256)],
              rows=[('idle', (0, 62, 1086, 206), (206, 230), NUM(4)),
                    ('walk', (0, 248, 1086, 371), (371, 395), NUM(8)),
                    ('pinch', (0, 428, 1086, 547), (547, 571), NUM(6)),
                    ('firebolt', (0, 596, 1086, 717), (717, 741), NUM(6)),
                    ('hottake', (0, 770, 1086, 880), (881, 895), NUM(4)),
                    ('viral', (0, 926, 1086, 1049), (1049, 1073), NUM(8)),
                    ('flinch', (0, 1097, 1086, 1218), (1219, 1233), NUM(4)),
                    ('climb', (0, 1236, 1086, 1402), (1402, 1428), NUM(6))]),
}
# loose bits moved by hand: sheet -> row -> [(box x0 y0 x1 y1 on the sheet: every blob wholly inside it, the label it belongs to)]
FIX = {'2': {'firebolt': [((350, 590, 382, 620), '3'), ((512, 590, 550, 616), '4')],    # each frame's spark whole (a speck went to the frame before)
             'hottake': [((430, 980, 500, 1080), '3')],                                 # 3's burst of sparks (one went to 2)
             'viral': [((262, 1230, 290, 1272), '3'),                                   # 3's buzz lines left of the claw (half of one went to 2)
                       ((360, 1312, 410, 1350), '3'),                                   # 3's tail end, apart from him past a dark band (its tip went to 4)
                       ((604, 1312, 650, 1352), '5')]}}                                 # 5's the same (a quarter went to 6)
CUT = {}
TOUCH_OK = {'4': {'pinch', 'hottake', 'viral'}, '5': {'firebolt', 'viral'}}   # (a spark or a buzz line against the next frame's: split where they meet, looked at 10-07)

# the engine's rows, each (sheet, the sheet's row): the pastes' row maps. Social Sharing is sheet 3's take (the seat's pick, 10-07: sheet 1's
# bow draws a second hat in his hand while the first stays on his head, frames 1, 3 and 4; sheet 3 lifts it off, bows bare-headed, sets it
# back). The walk is sheet 2's (Griz, 10-07: "sheet twos is better because the image is bigger, but its significantly better").
TAKE = {'turnaround': ('1', 'turnaround'), 'walk': ('2', 'walk'), 'attack': ('1', 'pinch'), 'socialsharing': ('3', 'sharing'),
        'socialflame': ('1', 'flame'), 'climb': ('1', 'climb'), 'flinch': ('1', 'flinch'), 'hurt': ('1', 'fall'), 'prone': ('1', 'prone'),
        'cast': ('2', 'firebolt'), 'socialdistancing': ('2', 'distancing'), 'hottake': ('2', 'hottake'), 'goingviral': ('2', 'viral')}
# facing S and N (10-07, sheets 4 and 5; Griz: "they need norths and souths"): the moves aimed at someone or walking somewhere, from the front
# and from behind; the bow, the dance, the spin, the fall and prone stay side-on (the seat's call in the paste). The climb from behind only, its
# first five frames to match the side climb's five (a row has one frame count in every facing)
TAKE_S = {'idle': ('4', 'idle'), 'walk': ('4', 'walk'), 'attack': ('4', 'pinch'), 'cast': ('4', 'firebolt'), 'hottake': ('4', 'hottake'),
          'goingviral': ('4', 'viral'), 'flinch': ('4', 'flinch')}
TAKE_N = dict({k: ('5', v[1]) for k, v in TAKE_S.items()}, climb=('5', 'climb'))
# the scale: the hat is the one rigid thing he wears, so each row is sized by its brim's width where it sits level on his head (the frames
# named, None for all; measured as the charcoal grey's span in the figure's top 45%). The sheets drew the rows at their own sizes -- the
# turnaround half as big again as the walk, sheet 2's Hot Take a sixth bigger than its walk, sheet 3 2.6 times -- and the hat brings them to
# one. A row with no level hat (the dance, the climb, the fall) takes its sheet's walk.
HATW = 21.5                   # the brim in game px: he stands about 42 at rest, 80% of Denny's 53 (denny_p3; Griz, 10-07: "he is a little large for the
                              # squishy DPS. does it still look good at 80% of Denny Height?"; at 32 he stood 63)
LEVEL = {('1', 'turnaround'): None, ('1', 'walk'): None, ('1', 'pinch'): None, ('1', 'flinch'): ['1', '4'], ('2', 'walk'): None,
         ('2', 'firebolt'): None, ('2', 'distancing'): ['1', '6'], ('2', 'hottake'): ['1', '2', '4'], ('2', 'viral'): ['6', '7', '8'],
         ('3', 'sharing'): ['1', '6'], ('4', 'idle'): None, ('4', 'walk'): None, ('5', 'idle'): None, ('5', 'walk'): None}   # (4 and 5: their other rows take the walk's)
BOB = [0, 1, 1, 0, 0, 1, 1, 0]   # the front and back views' walk, game px
FW, FH, AX, AY = 96, 96, 48, 84


def hat_w(im):
    """the brim's width on the sheet: the charcoal grey's span in the figure's top 45% (crumbs under 8% of the biggest piece left out)"""
    a = np.asarray(im).astype(int)
    rgb, al = a[..., :3], a[..., 3] > 0
    grey = al & ((rgb.max(-1) - rgb.min(-1)) < 28) & (rgb.mean(-1) > 28) & (rgb.mean(-1) < 140)
    ys = np.where(al.any(1))[0]
    grey[ys[0] + int(0.45 * (ys[-1] - ys[0])):] = False
    lab, n = ndimage.label(grey)
    if not n:
        return 0
    sz = ndimage.sum(grey, lab, range(1, n + 1))
    xs = np.where(np.isin(lab, 1 + np.where(sz >= 0.08 * sz.max())[0]).any(0))[0]
    return int(xs[-1] - xs[0] + 1)


def game_size(img, k):
    w, h = img.size
    return img.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)


def core_x(a):
    """x of the body's thick middle (the fuzzy torso: the claw, the tail, the whiskers are thinner), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def place(a, x_ref, up=0):
    """a 1x RGBA array onto a FW x FH frame: x_ref at AX, the lowest opaque row `up` px above AY; -> (frame, px cut off at the edges)"""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(AX - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, int((a[..., 3] > 0).sum() - (out[..., 3] > 0).sum())


def breathe(fr):
    """idle frame 2: the top of the figure sinks a pixel (the feet stay put) -- p1's"""
    o = fr.copy()
    rows = np.where(fr[..., 3].any(axis=1))[0]
    mid = rows[0] + (rows[-1] - rows[0]) * 6 // 10
    o[rows[0] + 1:mid + 1] = fr[rows[0]:mid]
    o[rows[0]] = 0
    return o


def main():
    cuts = {}
    for L, s in SHEETS.items():
        ov = []
        wanted = None if CHECK else {row for (l, row) in list(TAKE.values()) + list(TAKE_S.values()) + list(TAKE_N.values()) if l == L} | {row for (l, row) in LEVEL if l == L}
        cuts[L] = SR.cut_sheet(os.path.join(ROOT, 'deep16', '_src', s['file']), s, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()),
                               only=wanted, overlay=ov if CHECK else None, tag=L)
        if CHECK:
            os.makedirs(os.path.join(ROOT, 'dev', 'visions', 'rascal'), exist_ok=True)
            ov[0].save(os.path.join(ROOT, 'dev', 'visions', 'rascal', 'p2-cut-%s.png' % L))
    K = {}
    for (L, row), names in LEVEL.items():
        ws = [hat_w(im) for nm, im, _ in cuts[L][row] if names is None or nm in names]
        K[(L, row)] = float(np.median(ws)) / HATW
    k_of = lambda L, row: K.get((L, row)) or K[(L, 'walk')]
    print('sheet px a game px:', ', '.join('%s %s %.2f' % (L, row, k) for (L, row), k in sorted(K.items())))
    if CHECK:
        return
    ground = {(L, row): max(b[3] for _, _, b in frs) for L, c in cuts.items() for row, frs in c.items()}   # each sheet row's floor line
    rows, lost = {}, []
    def cut_row(L, row):
        k, out = k_of(L, row), []
        for nm, im, box in cuts[L][row]:
            a = pix.pixelate(game_size(im, k), 1, do_lift=False)
            fr, cut_off = place(a, core_x(a), int(round((ground[(L, row)] - box[3]) / k)))
            if cut_off:
                lost.append('%s %s %s: %d px' % (L, row, nm, cut_off))
            out.append(fr)
        return out
    rowsS = {name: cut_row(L, row) for name, (L, row) in TAKE_S.items()}
    rowsN = {name: cut_row(L, row) for name, (L, row) in TAKE_N.items()}
    rowsN['climb'] = rowsN['climb'][:5]
    for name, (L, row) in TAKE.items():
        k, out = k_of(L, row), []
        for nm, im, box in cuts[L][row]:
            a = pix.pixelate(game_size(im, k), 1, do_lift=False)
            up = 0 if row == 'turnaround' else int(round((ground[(L, row)] - box[3]) / k))   # (off the floor where the sheet drew it so: the dance's hops)
            fr, cut_off = place(a, core_x(a), up)
            if cut_off:
                lost.append('%s %s: %d px' % (name, nm, cut_off))
            out.append(fr)
        rows[name] = out
    if lost:
        raise SystemExit('cut off at the frame edges (widen FW/FH): ' + '; '.join(lost))
    mirror = lambda fr: fr[:, ::-1].copy()
    front, right, back, left = rows.pop('turnaround')
    frames = {'idle': [], 'walk': []}
    for f in range(8):                                      # facings S, SW, W, NW, N, NE, E, SE: the rows face left
        base = front if f == 0 else back if f == 4 else left if f in (1, 2, 3) else right
        if f in (0, 4):                                     # (his own front and back rows since 10-07: sheets 4 and 5)
            frames['idle'].append((rowsS if f == 0 else rowsN)['idle'])
            frames['walk'].append((rowsS if f == 0 else rowsN)['walk'])
        else:
            frames['idle'].append([base, base, breathe(base), breathe(base)])
            frames['walk'].append(rows['walk'] if f in (1, 2, 3) else [mirror(fr) for fr in rows['walk']])
    rows['prone'] = rows['prone'][::-1]                     # the sheet's lying then pushing up -> standing to lying (up: played backwards)
    for name, seq in rows.items():                          # the rest: S and N their own rows where sheets 4 and 5 drew them, else the side frames
        if name != 'walk':
            frames[name] = [rowsS[name] if f == 0 and name in rowsS else rowsN[name] if f == 4 and name in rowsN else
                            [mirror(fr) for fr in seq] if f in (5, 6, 7) else seq for f in range(8)]
    pix.write_sheet('rascal_p2', frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'rascal_p2.json')
    meta = json.load(open(meta_p)); meta['anims']['idle']['fps'] = 2
    meta['source'] = 'generated by Griz (2026-10-07: three Grok sheets, then two GPT sheets, his front and his back), cut by tools/rascal-sheet-p2.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)
    print('rascal_p2:', ', '.join('%s %d' % (k, len(v[0])) for k, v in frames.items()))


if __name__ == '__main__':
    main()

"""DEEP16 pipeline 2 (generated art): Griz's three generated sheets for Goose -> one palette sprite sheet of the frames he picked, goose_p1.

    python tools/goose-sheet.py

Sources (gitignored; masters dev/visions/Goose/Goose1-3.png): deep16/_src/goose_grok_1.png (A, "sheet 1"), goose_grok_2.png (B, "sheet 1,
his moves for a tactics game"), goose_grok_3.png (C, "sheet 2") -- Griz, 2026-10-06/07, from the paste in deep16-art-wanted.md "GOOSE, SHEET
1". Each sheet is cut by its own row and number labels (tools/sheetrows.py; the boxes below were read off the sheets), then his picks are
taken frame by frame, rows mixed across the sheets (Griz, 10-07, verbatim: "turn around C, idle C, hop B, sling B, cast B - with C5 in place
of B4 with the extra claw out of his head, and A4 for #5, can we honk B 1, B2, A3, B4?, climb B 1-3, C4-6, flinch B1-2, A3, C4, fall B, prone
C1, A2, C3-4").

The same pass as Denny's and Rascal's: each figure boxed down to game size, snapped to deep16/palette.json and outlined. The three sheets
draw him at three sizes (A : B : C as 1 : 0.94 : 1.12, the median over their matching frames of the torso's thickness -- not the height:
B holds his arms up high, which made it read the biggest), so each takes its own scale and the frames meet at one size; he is small (Griz: "Goose is small"), his idle about 38 px against Denny's 52, baked in, not drawn shrunk.
The rows face RIGHT: facings NE, E and SE take them as drawn, SW, W and NW mirrored; S and N take his front and back rows (10-07: sheets 3 and 4,
GPT, deep16/_src/goose_gpt_3..4.png -- idle, hop, sling, cast, honk, flinch, and the climb from behind; the fall and prone stay side-on), sized
by the body's radius against C's and brought to his side rows' colour (TONE); Group Hug and Lifeline have rows of their own (sheet 5, side-on). His specials are green energy (Griz, 10-07: "his specials should mainly be green energy"):
the sheets' blue-white glow (the cast's) is drawn in the heal's greens (js/fx.js's), white only at its heart. The seat's calls: a lift on the hop's airborne frames
and at the top of the cast's leap (the sheets drew both on the ground line); the prone row runs standing to lying, the engine's way (it
lies at its last frame and gets up by playing it backwards), so his C1, A2, C3, C4 is the getting up.
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

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per sheet: text boxes (a blob wholly inside one is lettering, dropped), the portrait's box, and the rows:
# (row, band x0 y0 x1 y1, label strip y0 y1, the labels' names in order -- B's cast is labelled 1 2 3 4 6 on the sheet)
SHEETS = {
    'A': dict(file='goose_grok_1.png',
              text=[(240, 0, 1055, 64), (385, 95, 560, 130), (0, 330, 120, 1491)],
              portrait=(10, 4, 368, 312),
              rows=[('turnaround', (388, 130, 1035, 272), (275, 296), TURN),
                    ('idle', (0, 312, 1055, 417), (417, 435), NUM(6)),
                    ('hop', (0, 436, 1055, 547), (547, 565), NUM(8)),
                    ('sling', (0, 566, 1055, 682), (682, 701), NUM(6)),
                    ('cast', (0, 702, 1055, 852), (852, 870), NUM(6)),
                    ('honk', (0, 871, 1055, 968), (968, 986), NUM(4)),
                    ('climb', (0, 987, 1055, 1119), (1119, 1137), NUM(6)),
                    ('flinch', (0, 1138, 1055, 1237), (1237, 1255), NUM(4)),
                    ('fall', (0, 1256, 1055, 1356), (1356, 1374), NUM(6)),
                    ('prone', (0, 1375, 1055, 1459), (1459, 1477), NUM(2))]),
    'B': dict(file='goose_grok_2.png',
              text=[(300, 0, 1491, 52), (440, 62, 775, 98), (0, 302, 245, 338), (745, 302, 950, 338), (0, 492, 232, 524),
                    (790, 492, 1005, 524), (0, 690, 225, 722), (585, 690, 800, 722), (0, 876, 235, 908), (525, 876, 720, 908),
                    (1188, 876, 1400, 908)],
              portrait=(15, 15, 350, 305),
              rows=[('turnaround', (450, 98, 1360, 273), (274, 296), TURN),
                    ('idle', (0, 338, 705, 459), (459, 479), NUM(6)),
                    ('hop', (705, 338, 1491, 459), (459, 479), NUM(8)),
                    ('sling', (0, 482, 790, 666), (666, 686), NUM(6)),
                    ('cast', (790, 482, 1491, 666), (666, 686), ['1', '2', '3', '4', '6']),
                    ('honk', (0, 722, 580, 850), (850, 870), NUM(4)),
                    ('climb', (580, 722, 1491, 850), (850, 870), NUM(6)),
                    ('flinch', (0, 908, 520, 1019), (1019, 1039), NUM(4)),
                    ('fall', (520, 908, 1180, 1019), (1019, 1039), NUM(6)),
                    ('prone', (1188, 908, 1491, 1019), (1019, 1039), NUM(2))]),
    'C': dict(file='goose_grok_3.png',
              text=[(240, 0, 1055, 64), (385, 95, 560, 130), (15, 350, 197, 392), (15, 532, 167, 574), (15, 740, 102, 780),
                    (15, 924, 110, 964), (15, 1123, 114, 1162), (15, 1293, 224, 1330)],
              portrait=(10, 4, 368, 312),
              rows=[('turnaround', (388, 130, 1035, 274), (275, 295), TURN),
                    ('idle', (0, 312, 1055, 466), (466, 486), NUM(6)),
                    ('cast', (0, 487, 1055, 682), (682, 701), NUM(6)),
                    ('honk', (0, 702, 1055, 838), (838, 858), NUM(4)),
                    ('climb', (0, 859, 1055, 1060), (1060, 1080), NUM(6)),
                    ('flinch', (0, 1081, 1055, 1242), (1242, 1262), NUM(4)),
                    ('prone', (0, 1263, 1055, 1423), (1423, 1443), NUM(4))]),
}
# his moves from the front (D, sheet 3), from behind (E, sheet 4) and two heals side-on (F, sheet 5): GPT, Griz 10-07, from the pastes in
# deep16-art-wanted.md "Goose and Rascal from the front and from behind" (deep16/_src/goose_gpt_3..5.png); their specs in tools/goose-fronts-spec.py
SHEETS.update(_load('goose_fronts_spec', os.path.join(ROOT, 'tools', 'goose-fronts-spec.py')).SHEETS)
# loose bits moved by hand: letter -> row -> [(box x0 y0 x1 y1 on the sheet: every blob wholly inside it, the label it belongs to)]
FIX = {'A': {'sling': [((690, 612, 760, 640), '4')]},        # the stone let fly (the nearest frame was 5's)
       'B': {'sling': [((470, 560, 545, 585), '4')]},
       'E': {'sling': [((200, 505, 255, 585), '2')]},        # 2's swing arc whole (its lower end lay nearer 1's feeler)
       'F': {'lifeline': [((1080, 515, 1245, 595), '5')]}}   # 5's thread end, its ball and sparks (the thread breaks short of him, so it went to 6)
# where one frame's feeler touches the next frame's tail: a line of pixels cleared (2 wide) so neither grows into the other
CUT = {'A': {'hop': [[(223, 482), (223, 500)]]},                        # hop 1's feeler hook against hop 2's tail
       'B': {'idle': [[(353, 418), (357, 413), (360, 410), (361, 403)]]}}   # idle 3's feeler hook against idle 4's tail
TOUCH_OK = {'B': {'hop'}, 'D': {'sling', 'honk'}, 'E': {'sling'}, 'F': {'grouphug', 'lifeline'}}   # (hop 5's foot on hop 6's tail; the GPT sheets' arcs, honk
                                              # lines and rings against the next frame's: split where they meet, looked at 10-07)

# his picks (10-07), each (sheet, the sheet's label), in the order played
PICKS = {
    'turnaround': [('C', v) for v in TURN],
    'idle': [('C', n) for n in NUM(6)],
    'hop': [('B', n) for n in NUM(8)],
    'sling': [('B', n) for n in NUM(6)],
    'cast': [('B', '1'), ('B', '2'), ('B', '3'), ('C', '5'), ('A', '4'), ('B', '6')],   # (B4 has a third claw out of his head)
    'honk': [('B', '1'), ('B', '2'), ('A', '3'), ('B', '4')],
    'climb': [('B', '1'), ('B', '2'), ('B', '3'), ('C', '4'), ('C', '5'), ('C', '6')],
    'flinch': [('B', '1'), ('B', '2'), ('A', '3'), ('C', '4')],
    'fall': [('B', n) for n in NUM(6)],
    'prone': [('C', '1'), ('A', '2'), ('C', '3'), ('C', '4')],                          # lying, then up (played backwards below)
}
K = {'A': 2.69, 'B': 2.50, 'C': 3.0,          # sheet px a game px: C's idle (115 px on the sheet) stands about 38
     'D': 3.82, 'E': 3.67, 'F': 4.86}          # (10-07: the body's radius, holes filled, against C's own -- D's idle 31.3 to C's front view 26.0 at C's
                                              # turnaround scale, E's 31.6 to its back 27.5, F's crouch 36 to C's side idle 22.2)
TONE = {'D': (0.87, 0.89, 0.98), 'E': (0.81, 0.81, 0.88), 'F': (0.80, 0.82, 0.92)}   # the GPT sheets draw his fur lighter and warm (mean RGB
# 64/61/56, 69/66/62, 70/66/60 against B's 54/52/54 and C's 60/59/58): each channel brought to 56/54/55, between the two his side rows come from; the glow left be
# facing S and N (10-07, sheets 3 and 4; Griz: "they need norths and souths"): the engine's row -> (sheet, the sheet's row); the fall and prone stay
# side-on (the seat's call in the paste), the climb from behind only. And two rows of his own for two heals (sheet 5, side-on, facing right)
FRONT = {'idle': 'idle', 'walk': 'hop', 'attack': 'sling', 'cast': 'cast', 'honk': 'honk', 'flinch': 'flinch'}
BACK = dict(FRONT, climb='climb')
HEALS = {'grouphug': 'grouphug', 'lifeline': 'lifeline'}
K_TURN = 1.06                                 # C drew its turnaround a little bigger than its rows (the side views' torso 23.4 to the idle's 22)
LIFT = {'hop': [0, 0, 4, 1, 4, 0, 2, 0], 'cast': [0, 2, 7, 0, 0, 0]}     # game px off the floor (the seat's: the hop's air, the leap's top)
BOUNCE = [0, 1, 2, 2, 1, 0]                   # the front and back views' idle bounce, game px
FW, FH, AX, AY = 96, 96, 48, 84


def glow_of(img, box, at):
    """255 where the frame's glow is: the ball (a circle on the sheet) and the sparkles round it (the small blobs in its box). The sheet
    drew it near white, so it is found by where it is, not its colour (GLOW)."""
    a = np.array(img)
    m = np.zeros(a.shape[:2], bool)
    if at:
        (cx, cy, r), (bx0, by0, bx1, by1) = at['ball'], at['box']
        ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
        sx, sy = xs + box[0], ys + box[1]                         # (the crop's pixels on the sheet)
        solid = a[..., 3] > 0
        m = solid & ((sx - cx) ** 2 + (sy - cy) ** 2 <= r * r)
        lab, n = ndimage.label(solid & (sx >= bx0) & (sx < bx1) & (sy >= by0) & (sy < by1) & ~m)
        for i, sl in enumerate(ndimage.find_objects(lab)):
            piece = lab[sl] == i + 1
            if piece.sum() < 80:
                m[sl] |= piece
    return Image.fromarray((m * 255).astype(np.uint8), 'L')


# where a frame's glow is on its sheet (the heal's, drawn green): the ball's centre and radius, the box its sparkles lie in
GLOW = {('B', 'cast', '3'): dict(ball=(1132, 518, 23), box=(1080, 488, 1190, 550))}
HEX = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.uint8)
GREENS = [(235, HEX('#fcfcf4')), (170, HEX('#86a05e')), (110, HEX('#56703e')), (0, HEX('#34482a'))]   # bone, orc 3, 2, 1: js/fx.js's heal


def green(a, small, glow):
    """the glow -> the heal's greens by its light, white only at its heart (Griz, 10-07: "his specials should mainly be green energy")"""
    lum = np.asarray(small.convert('RGB'), np.float32).mean(-1)
    g = (np.asarray(glow) > 90) & (a[..., 3] > 0)
    for floor, col in GREENS:
        sel = g & (lum >= floor)
        a[sel, :3] = col
        g &= ~sel
    return a


def gpt_glow(img):
    """255 where a GPT sheet drew his green energy (green over red and blue by 40), grown 2 px into its bright halo and white heart"""
    a = np.asarray(img).astype(int)
    al = a[..., 3] > 0
    g = al & (a[..., 1] - np.maximum(a[..., 0], a[..., 2]) > 40)
    g = ndimage.binary_dilation(g, iterations=2) & al & (a[..., :3].mean(-1) > 120) | g
    return Image.fromarray((g * 255).astype(np.uint8), 'L')


def toned(img, f, glow):
    """his fur brought to his side rows' colour: every pixel but the glow and the near-white (his feelers' cream), each channel times f"""
    a = np.asarray(img).astype(float)
    keep = (np.asarray(glow) > 0) | (a[..., :3].mean(-1) > 190)
    a[~keep, :3] *= np.array(f, float)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')


def game_size(img, k):
    w, h = img.size
    return img.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)


def core_x(a):
    """x of the body's thick middle (torso and head: the arms, tail and feelers are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def place(a, x_ref, up=0):
    """a 1x RGBA array onto a FW x FH frame: x_ref at AX, the lowest opaque row `up` px above AY"""
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(AX - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def main():
    cuts = {}
    for L, s in SHEETS.items():
        wanted = {row for row, picks in PICKS.items() if any(p[0] == L for p in picks)} if L in 'ABC' else None
        cuts[L] = SR.cut_sheet(os.path.join(ROOT, 'deep16', '_src', s['file']), s, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()),
                               only=wanted, tag=L)
    ground = {(L, row): max(b[3] for _, _, b in frs) for L, c in cuts.items() for row, frs in c.items()}   # each sheet row's floor line
    rows = {}
    for row, picks in PICKS.items():
        out = []
        for i, (L, nm) in enumerate(picks):
            _, im, box = next(f for f in cuts[L][row] if f[0] == nm)
            small = game_size(im, K[L] * (K_TURN if row == 'turnaround' else 1))
            a = green(pix.pixelate(small, 1, do_lift=False), small, glow_of(im, box, GLOW.get((L, row, nm))).resize(small.size, Image.BOX))
            up = 0 if row == 'turnaround' else int(round((ground[(L, row)] - box[3]) / K[L])) + LIFT.get(row, [0] * 9)[i]   # (off the floor where the sheet drew it so)
            out.append(place(a, core_x(a), up))
        rows[row] = out
    lost = []
    def gpt_row(L, row):                                    # a GPT sheet's row at his size and tone, its green the heal's; each at its own height
        out = []
        for nm, im, box in cuts[L][row]:
            glow = gpt_glow(im)
            small = game_size(toned(im, TONE[L], glow), K[L])
            a = green(pix.pixelate(small, 1, do_lift=False), small, glow.resize(small.size, Image.BOX))
            fr = place(a, core_x(a), int(round((ground[(L, row)] - box[3]) / K[L])))
            if (a[..., 3] > 0).sum() > (fr[..., 3] > 0).sum():
                lost.append('%s %s %s' % (L, row, nm))
            out.append(fr)
        return out
    rowsS = {name: gpt_row('D', row) for name, row in FRONT.items()}
    rowsN = {name: gpt_row('E', row) for name, row in BACK.items()}
    heals = {name: gpt_row('F', row) for name, row in HEALS.items()}
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    mirror = lambda fr: fr[:, ::-1].copy()
    front, back = rows['turnaround'][0], rows['turnaround'][2]
    lift = lambda fr, n: np.roll(fr, -n, axis=0)
    seqs = {'attack': rows['sling'], 'cast': rows['cast'], 'honk': rows['honk'], 'climb': rows['climb'], 'flinch': rows['flinch'],
            'hurt': rows['fall'],                           # knocked out: the last frame lies on the ground
            'prone': rows['prone'][::-1]}                   # standing to lying; up again by the row played backwards
    frames = {'idle': [], 'walk': []}
    for f in range(8):                                      # facings S, SW, W, NW, N, NE, E, SE: the rows face right
        if f in (0, 4):                                     # (his own front and back rows since 10-07: sheets 3 and 4)
            frames['idle'].append((rowsS if f == 0 else rowsN)['idle'])
            frames['walk'].append((rowsS if f == 0 else rowsN)['walk'])
        else:
            side = (lambda fr: mirror(fr)) if f in (1, 2, 3) else (lambda fr: fr)
            frames['idle'].append([side(fr) for fr in rows['idle']])
            frames['walk'].append([side(fr) for fr in rows['hop']])
    seqs.update(heals)                                      # (Group Hug and Lifeline: rows of their own, side-on, 10-07)
    for name, seq in seqs.items():                          # S and N their own rows where sheets 3 and 4 drew them, else the side frames
        frames[name] = [rowsS[name] if f == 0 and name in rowsS else rowsN[name] if f == 4 and name in rowsN else
                        [mirror(fr) for fr in seq] if f in (1, 2, 3) else seq for f in range(8)]
    pix.write_sheet('goose_p1', frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'goose_p1.json')
    meta = json.load(open(meta_p))
    meta['source'] = 'generated by Griz (2026-10-06/07, three sheets), his picks cut by tools/goose-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)
    print('goose_p1:', ', '.join('%s %d' % (k, len(v[0])) for k, v in frames.items()))


if __name__ == '__main__':
    main()

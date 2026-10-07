"""DEEP16 pipeline 2 (generated art): Beholda's second sheet -> beholda_p3, the Mascot's figure on the grid (js/mpmon.js), every row hers.

    python tools/beholda-p3.py

Source (gitignored; the master is dev/visions/beholda/Beholda Pixel Sprite Sheet.png): deep16/_src/beholda_grok_2.png -- Griz, 2026-10-07,
from the pastes in deep16-art-wanted.md "BEHOLDA, SHEET 2" and "BEHOLDA, SHEET 3", one sheet with all their rows. Cut by its own row and
number labels (tools/sheetrows.py; the boxes below were read off the sheet), then boxed down to game size, snapped to deep16/palette.json
and outlined by the same pass as every sheet (tools/pixelate.py).

The rows (Griz, 10-07: "turnaround -> idle by facing, Hover -> walk, Dice Slam -> attack, VNA Bubble -> cast, Baleful Gaze -> gaze, Spot ->
spot, Spotlight -> spotlight, Flinch, Fall -> hurt, Prone"; "She floats: keep her lift"). The rows face RIGHT: facings NE, E and SE take
them as drawn, SW, W and NW mirrored. S and N take the turnaround's front and back, bobbing. Idle by facing: the turnaround's four stills,
each with the hover's own bob; the east and west idles the side stills (Right, and Left as drawn). She floats: the lowest die HOVER px over the
foot line in every frame but the fall's last and the prone's lying one, each frame's own bob on the sheet kept (the sheet drew every
row on one baseline); the fall sinks from the hover to the floor by the sheet's own drop. The prone row is stored hovering to lying,
the engine's way (it lies at its last frame and gets up by playing the row backwards), so her 1 (lying) and 2 (pushing up) run 2, 1.
The spotlight's cone reaches past a 96-px cell: its row is twice as wide, the anchor centred (as beholda_p2's gaze was).
"""
import os, json
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
SHEETS = {
    'A': dict(file='beholda_grok_2.png', chan=40,
              text=[(20, 365, 372, 1055),                                   # the left panel's name and the rows' list
                    (388, 10, 526, 40), (388, 140, 462, 167), (388, 247, 500, 276), (388, 352, 512, 380), (388, 460, 530, 487),
                    (388, 560, 448, 589), (388, 657, 503, 685), (388, 750, 466, 778), (388, 844, 446, 871), (388, 956, 461, 984)],
              portrait=(30, 30, 345, 362),
              rows=[('turnaround', (528, 8, 1030, 109), (110, 132), TURN),
                    ('hover', (470, 139, 1440, 226), (227, 240), NUM(8)),
                    ('diceslam', (470, 245, 1440, 333), (334, 346), NUM(6)),
                    ('bubble', (470, 351, 1440, 438), (439, 452), NUM(6)),
                    ('gaze', (470, 457, 1440, 542), (543, 556), NUM(6)),
                    ('spot', (470, 559, 1440, 638), (639, 651), NUM(4)),
                    ('spotlight', (470, 655, 1440, 732), (733, 745), NUM(6)),
                    ('flinch', (470, 749, 1440, 825), (826, 838), NUM(4)),
                    ('fall', (470, 841, 1440, 936), (937, 950), NUM(6)),
                    ('prone', (470, 954, 1440, 1051), (1052, 1066), NUM(2))]),
}
FIX = {'A': {'diceslam': [((745, 255, 776, 330), '2')]}}     # Dice Slam 2's swing arcs (they ran into 3's, so grew from it)
CUT = {'A': {'diceslam': [[(776, 255), (776, 330)]]}}        # between 2's arcs and 3's swoosh
TOUCH_OK = {}

# her size: the turnaround's front view TARGET_H tall (beholda_p2's), the rows by their scale against it -- the body's radius (holes filled)
# runs 20.2-21.9 sheet px through every row against the turnaround's 22.2, and the lime d8 14 against 15.5: the turnaround was drawn
# about 6% bigger; the fall and the prone (the d8 15-16, the body 23) about 8% bigger than the rows
TARGET_H = 50
SCALE = {'turnaround': 1.06, 'fall': 1.08, 'prone': 1.08}      # sheet px a game px, against the rows' (1)
HOVER = 6                                                      # the lowest die this far above the foot line
BOB = [0, 1, 2, 2, 1, 0]                                       # the idle's float, game px
FW, FH, AX, AY = 96, 96, 48, 84
GW = 192                                                       # a row whose frames reach past a 96-px cell (the spotlight's cone) is twice as wide


def game_size(img, k):
    w, h = img.size
    return img.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)


def core_x(a):
    """x of her body's thick middle (the sphere: the stalks, wisps, chains and dice are thin; the pupil's hole filled)"""
    d = ndimage.distance_transform_edt(ndimage.binary_fill_holes(a[..., 3] > 0))
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def place(a, x_ref, up, fw=FW):
    """a 1x RGBA array onto a fw x FH frame: x_ref at the frame's middle, the lowest opaque row `up` px above AY"""
    out = np.zeros((FH, fw, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(fw // 2 - x_ref)), AY - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def main():
    s = SHEETS['A']
    cut = SR.cut_sheet(os.path.join(ROOT, 'deep16', '_src', s['file']), s, fix=FIX.get('A'), cuts=CUT.get('A'), touch_ok=TOUCH_OK.get('A', ()), tag='A')
    front_h = cut['turnaround'][0][2][3] - cut['turnaround'][0][2][1] - 4          # (the crop's 2 px of pad each side)
    K = front_h / TARGET_H / SCALE['turnaround']
    rows, wide = {}, set()
    for row, frs in cut.items():
        if row == 'portrait':
            continue
        k = K * SCALE.get(row, 1)
        ground = max(b[3] for _, _, b in frs)                                       # the row's floor on the sheet (its lowest frame)
        out = []
        for i, (nm, im, box) in enumerate(frs):
            a = pix.pixelate(game_size(im, k), 1, do_lift=False)
            own = (ground - box[3]) / k                                             # the frame's own height over the row's floor
            if row == 'fall':                                                       # sinking: the first frame at the hover, the last on the floor
                d0 = ground - frs[0][2][3]
                up = HOVER * (ground - box[3]) / d0 if d0 else 0
            elif row == 'prone':
                up = 0 if nm == '1' else HOVER                                      # lying; then pushed back up into the air
            else:
                up = HOVER + own
            x = core_x(a)
            if x > AX - 2 or a.shape[1] - x > AX - 2:                 # (2 px of margin: the outline)
                wide.add(row)
            out.append((a, x, int(round(up))))
        rows[row] = [place(a, x, up, GW if row in wide else FW) for a, x, up in out]
    mirror = lambda fr: fr[:, ::-1].copy()
    lift = lambda fr, n: np.roll(fr, -n, axis=0)
    turn = dict(zip(TURN, rows['turnaround']))
    seqs = {'attack': rows['diceslam'], 'cast': rows['bubble'], 'gaze': rows['gaze'], 'spot': rows['spot'], 'spotlight': rows['spotlight'],
            'flinch': rows['flinch'],
            'hurt': rows['fall'],                         # knocked out: the last frame lies on the floor
            'prone': rows['prone'][::-1]}                 # hovering to lying; up again by the row played backwards
    frames = {'idle': [], 'walk': []}
    for f in range(8):                                    # facings S, SW, W, NW, N, NE, E, SE: the rows face right
        v = turn['front' if f == 0 else 'back' if f == 4 else 'left' if f in (1, 2, 3) else 'right']
        frames['idle'].append([lift(v, n) for n in BOB])
        if f in (0, 4):
            frames['walk'].append([lift(v, n) for n in BOB + BOB[1:3]])
        else:
            frames['walk'].append([mirror(fr) for fr in rows['hover']] if f in (1, 2, 3) else rows['hover'])
    for name, seq in seqs.items():
        frames[name] = [[mirror(fr) for fr in seq] if f in (1, 2, 3) else seq for f in range(8)]
    src_row = {'attack': 'diceslam', 'cast': 'bubble', 'hurt': 'fall'}
    sizes = {name: (GW, FH, GW // 2, AY) for name in frames if src_row.get(name, name) in wide}
    pix.write_sheet('beholda_p3', frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'beholda_p3.json')
    meta = json.load(open(meta_p))
    meta['source'] = 'generated by Griz (2026-10-07, her second sheet), cut by tools/beholda-p3.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)
    print('beholda_p3: K %.2f; wide: %s' % (K, ', '.join(sorted(wide)) or 'none'))


if __name__ == '__main__':
    main()

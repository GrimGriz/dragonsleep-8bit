"""DEEP16 pipeline 2 (generated art): Denny's third sheet, in two -> denny_p3, the Mascot's figure on the grid (js/mpmon.js).

    python tools/denny-p3.py
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
    'A': dict(file='denny_sheet_3.png', chan=36,
              text=[(20, 8, 670, 44), (20, 292, 222, 320), (766, 292, 962, 320), (20, 494, 320, 526), (20, 689, 280, 718), (20, 876, 224, 907)],
              portrait=(35, 42, 280, 266),
              rows=[('turnaround', (330, 66, 1012, 250), (251, 277), TURN),
                    ('punch', (0, 318, 740, 452), (453, 475), NUM(6)),
                    ('taunt', (740, 318, 1448, 452), (453, 475), NUM(6)),
                    ('denimdamage', (0, 520, 1448, 653), (654, 677), NUM(8)),
                    ('cannonball', (0, 690, 1448, 845), (846, 870), NUM(8)),
                    ('guard', (0, 895, 1448, 1026), (1027, 1051), NUM(4))],
              join={'cannonball': [('6', '7')]}),                   # one landing in its dust under the two numbers
    'B': dict(file='denny_sheet_4.png', chan=36,
              text=[(20, 8, 675, 42), (20, 284, 300, 314), (20, 479, 210, 508), (20, 685, 218, 714), (623, 685, 797, 714), (20, 894, 214, 925)],
              portrait=(33, 40, 280, 262),
              rows=[('turnaround', (335, 66, 1015, 247), (248, 275), TURN),
                    ('lobstahhug', (0, 300, 1448, 446), (446, 467), NUM(8)),
                    ('climb', (0, 480, 1448, 653), (654, 677), ['1', '2', '3', '4', '6']),
                    ('flinch', (0, 712, 595, 857), (857, 882), NUM(4)),
                    ('fall', (595, 712, 1448, 857), (857, 882), NUM(6)),
                    ('prone', (0, 924, 1448, 1031), (1032, 1055), NUM(2))]),
}
FIX = {}
CUT = {}
TOUCH_OK = {}

# his size: the turnaround's front view TARGET_H tall (denny_p2's). The rows are drawn smaller than the turnarounds: on sheet A the Taunt's
# first frame (his front view, standing) is 0.75 of the turnaround's front, height and head alike (126 to 168 sheet px; the head's radius
# 23.3 to 30.8); sheet B's rows are 1.047 of A's (the head 24.0 to 22.9 in the side views, the standing flinch 135 to 129), its turnaround
# the same as A's. The walk is his second sheet's (deep16/_src/denny_sheet_2.webp, tools/denny-sheet.py's eight frames): that sheet drew
# its walk at 0.76 of its own turnaround (247 sheet px), as A drew its rows, so it is A's scale times 247/168
TARGET_H = 52
ROW = {'A': 0.75, 'B': 0.75 * 1.047}                          # a sheet's rows against its turnaround
FW, FH, AX, AY = 96, 96, 48, 84
GW = 192                                                       # a row whose frames reach past a 96-px cell (the cannonball's dust) is twice as wide
# the rows face RIGHT, as drawn (Taunt is drawn facing out, and plays so). Each frame's own height on the sheet kept, off its row's
# floor (the hug's leap), but not the cannonball's: the engine throws him through the air itself (js/mpmon.js MP.cannonball's tween), so
# its airborne frames play at the floor and the arc is the engine's
FLOOR = {'cannonball'}


def game_size(img, k):
    w, h = img.size
    return img.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)


def core_x(a):
    """x of the body's thick middle (his head and the jacket: the arms, legs and tail are thin), the steadiest thing frame to frame"""
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
    cuts = {L: SR.cut_sheet(os.path.join(ROOT, 'deep16', '_src', s['file']), s, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()), tag=L)
            for L, s in SHEETS.items()}
    front_h = cuts['A']['turnaround'][0][2][3] - cuts['A']['turnaround'][0][2][1] - 4     # (the crop's 2 px of pad each side)
    KT = front_h / TARGET_H
    rows, wide = {}, set()
    for L, c in cuts.items():
        for row, frs in c.items():
            if row == 'portrait' or (L == 'B' and row == 'turnaround'):             # (B's turnaround is A's again)
                continue
            k = KT * (1 if row == 'turnaround' else ROW[L])
            ground = max(b[3] for _, _, b in frs)
            out = []
            for nm, im, box in frs:
                a = pix.pixelate(game_size(im, k), 1, do_lift=False)
                up = 0 if row in FLOOR else (ground - box[3]) / k
                x = core_x(a)
                if x > AX - 2 or a.shape[1] - x > AX - 2:                 # (2 px of margin: the outline)
                    wide.add(row)
                out.append((nm, a, x, int(round(up))))
            rows[row] = [(nm, place(a, x, up, GW if row in wide else FW)) for nm, a, x, up in out]
    # the walk, his second sheet's eight frames (cut as tools/denny-sheet.py cuts them)
    DS = _load('denny_sheet', os.path.join(ROOT, 'tools', 'denny-sheet.py'))
    kw = KT * ROW['A'] * (DS.VIEWS['front'][3] - DS.VIEWS['front'][1]) / front_h
    walk = []
    for b in DS.WALK:
        a = pix.pixelate(game_size(DS.cut(b), kw), 1, do_lift=False)
        walk.append(place(a, core_x(a), 0))
    R = {row: [fr for _, fr in v] for row, v in rows.items()}
    R['cannonball'] = R['cannonball'][:5] + [R['cannonball'][5]] * 2 + R['cannonball'][6:]   # (his 6 and 7 one landing: held two frames)
    mirror = lambda fr: fr[:, ::-1].copy()
    turn = dict(zip(TURN, R['turnaround']))
    seqs = {'attack': R['punch'], 'taunt': R['taunt'], 'denimdamage': R['denimdamage'], 'cannonball': R['cannonball'], 'guard': R['guard'],
            'lobstahhug': R['lobstahhug'], 'climb': R['climb'], 'flinch': R['flinch'],
            'hurt': R['fall'],                            # knocked out: the last frame lies on the floor
            'prone': R['prone'][::-1]}                    # standing to lying; up again by the row played backwards
    frames = {'idle': [], 'walk': []}
    for f in range(8):                                    # facings S, SW, W, NW, N, NE, E, SE
        v = turn['front' if f == 0 else 'back' if f == 4 else 'left' if f in (1, 2, 3) else 'right']
        frames['idle'].append([v, v, DS.breathe(v), DS.breathe(v)])
        if f in (0, 4):
            frames['walk'].append([np.roll(v, -(i % 2), axis=0) for i in range(8)])
        else:
            frames['walk'].append([mirror(fr) for fr in walk] if f in (1, 2, 3) else walk)
    for name, seq in seqs.items():
        frames[name] = [[mirror(fr) for fr in seq] if f in (1, 2, 3) else seq for f in range(8)]
    src_row = {'attack': 'punch', 'hurt': 'fall'}
    sizes = {name: (GW, FH, GW // 2, AY) for name in frames if src_row.get(name, name) in wide}
    pix.write_sheet('denny_p3', frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'denny_p3.json')
    meta = json.load(open(meta_p))
    meta['anims']['idle']['fps'] = 2
    meta['source'] = 'generated by Griz (2026-10-07, his third sheet in two; the walk his second, 2026-09-27), cut by tools/denny-p3.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)
    print('denny_p3: K %.2f (rows A %.2f, B %.2f, the walk %.2f); wide: %s' % (KT, KT * ROW['A'], KT * ROW['B'], kw, ', '.join(sorted(wide)) or 'none'))


if __name__ == '__main__':
    main()

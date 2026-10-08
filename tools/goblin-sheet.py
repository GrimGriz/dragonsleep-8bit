"""DEEP16 pipeline 2 (generated art): Griz's four GPT sheets for the goblin -> one palette sprite sheet, goblin_p2.

    python tools/goblin-sheet.py            (writes deep16/art/goblin_p2.png/.json)
    python tools/goblin-sheet.py check      (also the cut overlays, dev/visions/goblin/cut-<n>.png)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/Goblin-GPT1.png .. Goblin-GPT4.png -- Griz, 2026-10-07,
from the four pastes in deep16-art-in-hand.md "The goblin, redone" (his: "Redoing goblins while we have an expanded art department, please the
copypasta for all the 16 bit sprite animation rows we'll need for them", then "Should be GPT Goblins in _src"). Sheet 1 the side rows (idle, walk,
scimitar, shortbow, flinch, fall, prone; its portrait and turnaround not used), sheet 2 its tricks side-on (nimble escape, hide, climb), sheet 3
from the front, sheet 4 from behind. Each is cut by its own row and number labels (tools/sheetrows.py; the boxes below were read off the sheets
by their white labels).

The rows face RIGHT: facings NE, E and SE take them as drawn, SW, W and NW mirrored; S takes sheet 3's rows, N sheet 4's (the fall, prone and
hide stay side-on, and the climb has no front -- the paste's calls). Each sheet takes its own scale (K: the body's radius, holes filled, the
median over the rows that stand -- heights lie: the side views hunch), every frame snapped to deep16/palette.json and outlined, then set on the
frame by its body's middle, at the height the sheet drew it off its row's floor. The goblin is Small: about 36 px at its hunched side idle
(the Blob Orc it replaces stood 37-39; a dwarf 37-42, a man about 50). The seat's calls: sheet 4's idle has five frames to the others' six, so
from behind it plays 1 2 3 4 5 4 (a row has one frame count in every facing); the swing arcs and the motion lines stay with their frames; the
nimble hop's lines are dropped (they sat on the floor and would pin the hop to it).
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

SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'Goblin-GPT1.png')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
# per sheet: text boxes (a blob wholly inside one is lettering, or a mark dropped on purpose), and the rows:
# (row, band x0 y0 x1 y1, label strip y0 y1, the labels' names in order)
SHEETS = {
    1: dict(file='Goblin-GPT1.png',
            text=[(0, 225, 185, 265), (0, 340, 185, 385), (0, 465, 185, 505), (0, 585, 185, 635), (0, 705, 185, 760), (0, 825, 185, 865),
                  (0, 930, 185, 970)],
            rows=[('idle', (185, 200, 1491, 302), (303, 321), NUM(6)),
                  ('walk', (185, 322, 1491, 418), (419, 437), NUM(8)),
                  ('scimitar', (185, 438, 1491, 549), (550, 568), NUM(6)),
                  ('shortbow', (185, 569, 1491, 680), (681, 700), NUM(6)),
                  ('flinch', (185, 701, 1491, 789), (790, 811), NUM(4)),
                  ('fall', (185, 812, 1491, 895), (896, 914), NUM(6)),
                  ('prone', (185, 915, 1491, 994), (995, 1014), NUM(2))]),
    2: dict(file='Goblin-GPT2.png',
            text=[(0, 140, 322, 220), (0, 440, 200, 535), (0, 800, 200, 880),
                  (570, 215, 650, 280)],                     # nimble 2's motion lines (on the floor line: they'd hold the hop down)
            rows=[('nimble', (322, 40, 1448, 292), (293, 322), NUM(4)),
                  ('hide', (200, 340, 1448, 600), (601, 629), NUM(4)),
                  ('climb', (150, 660, 1448, 985), (986, 1014), NUM(6))]),
    3: dict(file='Goblin-GPT3.png',
            text=[(0, 85, 175, 140), (0, 268, 120, 320), (0, 455, 175, 508), (0, 628, 190, 692), (0, 805, 265, 860), (0, 952, 140, 1025)],
            rows=[('idle', (175, 20, 1448, 170), (171, 194), NUM(6)),
                  ('walk', (120, 200, 1448, 351), (352, 378), NUM(8)),
                  ('scimitar', (175, 385, 1448, 534), (535, 559), NUM(6)),
                  ('shortbow', (190, 565, 1448, 718), (719, 746), NUM(6)),
                  ('nimble', (265, 748, 1448, 884), (887, 918), NUM(4)),
                  ('flinch', (175, 920, 1448, 1053), (1054, 1076), NUM(4))]),
    4: dict(file='Goblin-GPT4.png',
            text=[(0, 70, 175, 125), (0, 205, 175, 265), (0, 345, 175, 405), (0, 502, 185, 548), (0, 620, 245, 700), (0, 782, 175, 840),
                  (0, 925, 175, 982)],
            rows=[('idle', (175, 20, 1448, 140), (141, 163), NUM(5)),
                  ('walk', (175, 170, 1448, 284), (285, 305), NUM(8)),
                  ('scimitar', (175, 310, 1448, 432), (433, 452), NUM(6)),
                  ('shortbow', (185, 460, 1448, 581), (582, 601), NUM(6)),
                  ('nimble', (245, 605, 1448, 722), (723, 741), NUM(4)),
                  ('flinch', (175, 750, 1448, 861), (862, 880), NUM(4)),
                  ('climb', (175, 885, 1448, 1035), (1036, 1055), NUM(6))]),
}
SHEETS[1]['text'].append((0, 0, 380, 206))                 # the portrait (its lower edge lies in the idle row's band)
SHEETS[2]['text'].append((560, 190, 662, 286))               # nimble 2's motion lines (on the floor line: they would hold the hop down)
SHEETS[3]['text'] += [(520, 780, 582, 892), (780, 820, 822, 892), (950, 830, 992, 896),   # nimble 2's and 3's motion lines, the same
                      (383, 890, 402, 917), (620, 880, 642, 907), (872, 882, 894, 909), (1123, 889, 1147, 917)]   # its numbers (beside the feet)
SHEETS[3]['rows'][4] = ('nimble', (265, 748, 1448, 889), (889, 918), NUM(4))
SHEETS[4]['text'].append((0, 860, 900, 882))                 # the flinch row's numbers, so the climb's band can reach climb 6's fingertips
SHEETS[4]['rows'][6] = ('climb', (175, 866, 1448, 1035), (1036, 1055), NUM(6))
# loose bits moved by hand: sheet -> row -> [(box x0 y0 x1 y1 on the sheet: every blob wholly inside it, the label it belongs to)]
FIX = {1: {'scimitar': [((676, 438, 776, 512), '3')]},        # 3's swing arc: its thick middle seeds a core of its own, nearer 4's label,
       4: {'scimitar': [((686, 310, 780, 394), '3')]}}        # so it is cut from the blade (CUT) and handed back to 3
CUT = {1: {'scimitar': [[(679, 470), (679, 512)]]},          # the blade where it is thinnest, short of the arc
       4: {'scimitar': [[(689, 350), (689, 394)]]}}
TOUCH_OK = {1: {'scimitar'}, 4: {'scimitar'}}                # (the arc against the blade it leaves: looked at 10-07)

# the scale, sheet px a game px: by the figure's area against sheet 1's turnaround (one goblin at one scale from four sides; heights lie, the
# side rows crouch deeper than its Right view). sqrt(area): the side idle 72.5 to the turnaround's Right 90.5 (0.801), the front idle 110.0 to its
# Front 99.1 (1.110), the back idle 81.2 to its Back 98.8 (0.822); sheet 2's guard crouch (nimble 1 and 4) 135.9 to sheet 1's idle 72.5 (1.874).
# K[1] sets the size: the hunched side idle (82 px on the sheet) about 36 px.
K = {1: 2.28}
K.update({2: K[1] * 1.874, 3: K[1] * 1.110 / 0.801, 4: K[1] * 0.822 / 0.801})
# the colour, sheet by sheet, to sheet 1's (his look's): GPT drew the front, the back and the tricks a more yellow green than the side rows --
# the skin's blue at game size 41 (sheet 3), 52 (4), 51 (2) to sheet 1's 63, the leather redder. Each channel times a factor, the skin's and the
# leather's apart (means at game size: skin 134/147/63, leather 111/68/37 on sheet 1); the steel and the whites left be
TONE = {2: ((0.965, 0.950, 1.22), (0.93, 0.94, 0.88)),
        3: ((0.920, 0.915, 1.51), (0.90, 0.93, 1.01)),
        4: ((1.020, 1.040, 1.20), (0.88, 0.93, 0.86))}
FRONT = ['idle', 'walk', 'scimitar', 'shortbow', 'nimble', 'flinch']      # sheet 3, facing S
BACK = FRONT + ['climb']                                                    # sheet 4, facing N
SIDE = {'idle': 1, 'walk': 1, 'scimitar': 1, 'shortbow': 1, 'flinch': 1, 'fall': 1, 'prone': 1, 'nimble': 2, 'hide': 2, 'climb': 2}
PAD = {(4, 'idle'): [0, 1, 2, 3, 4, 3]}                      # sheet 4 drew five idle frames to the others' six: 1 2 3 4 5 4
RELEASE = {'shortbow': 4}                                    # the frame the arrow leaves on (frame 5: the bow hand open), js/battle.js times the shot by it
FH, AY = 96, 84


def game_size(img, k):
    w, h = img.size
    return img.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)


def core_x(a):
    """x of the body's thick middle (torso and head; the blade, the bow and the limbs are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def toned(img, f):
    """the skin (green over red, and over blue by 30) times f[0], the rest times f[1], the greys (steel, the arcs, the eyes' whites) left be"""
    a = np.asarray(img).astype(float)
    rgb = a[..., :3]
    skin = (rgb[..., 1] > rgb[..., 0]) & (rgb[..., 1] > rgb[..., 2] + 30)
    grey = rgb.max(-1) - rgb.min(-1) < 25
    rgb[skin] *= np.array(f[0], float)
    rgb[~skin & ~grey] *= np.array(f[1], float)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')


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


def main(check=False):
    cuts = {}
    for L, s in SHEETS.items():
        over = [] if check else None
        cuts[L] = SR.cut_sheet(os.path.join(SRC, s['file']), s, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()), overlay=over, tag=str(L))
        if check:
            out = os.path.join(ROOT, 'dev', 'visions', 'goblin'); os.makedirs(out, exist_ok=True)
            over[0].save(os.path.join(out, 'cut-%d.png' % L))
    # every frame at game size: (1x RGBA, its body's middle, its height off its row's floor)
    small = {}
    for L, c in cuts.items():
        for row, frs in c.items():
            floor = max(b[3] for _, _, b in frs)
            out = []
            for nm, im, box in frs:
                sm = game_size(toned(im, TONE[L]) if L in TONE else im, K[L])
                a = pix.pixelate(sm, 1, do_lift=False)
                out.append((a, core_x(a), int(round((floor - box[3]) / K[L]))))
            small[(L, row)] = [out[i] for i in PAD.get((L, row), range(len(out)))]
    # the engine's rows, by facing (S, SW, W, NW, N, NE, E, SE): S sheet 3, N sheet 4, the rest the side rows (facing right; SW, W, NW mirrored)
    eng = {'idle': 'idle', 'walk': 'walk', 'scimitar': 'scimitar', 'attack': 'scimitar', 'shortbow': 'shortbow', 'nimble': 'nimble',
           'hide': 'hide', 'climb': 'climb', 'flinch': 'flinch', 'hurt': 'fall', 'prone': 'prone'}
    src = {}
    for name, row in eng.items():
        side = small[(SIDE[row], row)]
        if row == 'prone':
            side = side[::-1]                                # pushing up, then lying: it lies at its last frame and gets up by playing it backwards
        src[name] = [small[(3, row)] if f == 0 and row in FRONT else small[(4, row)] if f == 4 and row in BACK else side for f in range(8)]
        counts = {len(s) for s in src[name]}
        if len(counts) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (name, sorted(counts)))
    frames, sizes, lost = {}, {}, []
    for name, per in src.items():
        half = max(max(cx, a.shape[1] - cx) for fs in per for a, cx, _ in fs)    # each row its own width, about the frame's middle (so a mirror keeps the foot)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        ax = fw // 2
        sizes[name] = (fw, FH, ax, AY)
        frames[name] = []
        for f, fs in enumerate(per):
            row = []
            for a, cx, up in fs:
                if f in (1, 2, 3) and f != 4:
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, cut = place(a, cx, up, fw, ax)
                if cut:
                    lost.append('%s facing %d' % (name, f))
                row.append(fr)
            frames[name].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    pix.write_sheet('goblin_p2', frames, 96, FH, 48, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', 'goblin_p2.json')
    meta = json.load(open(meta_p))
    for name, k in RELEASE.items():
        meta['anims'][name]['release'] = k
    meta['source'] = 'generated by Griz (2026-10-07: four GPT sheets -- the side rows, its tricks, from the front, from behind), cut by tools/goblin-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])

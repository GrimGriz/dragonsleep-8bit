"""DEEP16 pipeline 2 (generated art): Griz's four GPT sheets of the grimlock -> grimlock_p2 (the Ninja stand-in, grimlock_p1, stays on disk).

    python tools/grimlock-sheet.py            (writes deep16/art/grimlock_p2.png/.json)
    python tools/grimlock-sheet.py check      (also, in dev/visions/grimlock/: the cut overlays cut-<n>.png, the key's proof key.png, every
                                               row in every facing facings-<row>.png, and a lineup beside its peers lineup.png)
    python tools/grimlock-sheet.py measure    (the cut's measures and the scale and tone they give; writes nothing)

Sources (gitignored, the main checkout's -- a worktree reads them there): deep16/_src/grimlock/, the art desk's ART-07 (assignment
deep16/_src/art-desk/ENGINE-ART-HANDOFF-2026-10-14/assignments-and-manifests/ART-07-grimlock.md; its log ART-CUTTER-HANDOFF.md, "ART-07 --
Grimlock -- 2026-10-10"), generated 2026-10-10, sorted into _src/grimlock 2026-10-14; the download names matched to page IDs by eye (the desk):
  1  ART-07_HEAD-1_PAGE-1  Grimlock Bone Club Sprite Sheet-1.png        a portrait and a turnaround (Front, Right, Back, Left: cut for the
                                                                        measures only), Idle 6, Walk 8, Spiked Bone Club 6
  2  ART-07_HEAD-1_PAGE-2  Grimlock sprite sheet_ lurk to prone-2.png   Lurk 4, Flinch 4, Fall 6, Prone 2
  3  ART-07_HEAD-2_PAGE-1  Spiked bone club pose correction.png         Idle 6, Walk 8, Spiked Bone Club 6 (the rear windup's hand-switch repaired)
  4  ART-07_HEAD-2_PAGE-2  Grimlock Rear-View Pixel Sprite Sheet.png    Lurk 4, Flinch 4, Fall 6, Prone 2
HEAD 1 (pages 1, 2) is drawn from the bottom-right, facing the bottom-right (the club in its right hand: the viewer's left); HEAD 2 (pages 3,
4) from the top-right, seen from behind, facing the top-right (the club in its right hand: the viewer's right). Each page is cut by its own
row and number labels (tools/sheetrows.py; the numbers' x read off the sheets by a probe); every row's number strip and name is lettering.
Rows: `idle` <- Idle; `walk` <- Walk; `spikedboneclub` and `attack` <- Spiked Bone Club (battle.js plays a row named for the attack, lower-
cased, letters only, and falls back to `attack`; its `release` 3 is frame 4, the club's contact -- the front's club down at the foe's feet,
the rear's arm coming over); `still` <- Lurk (the grimlock starts hidden by its Stone Camouflage: ui.js plays `still` till its first turn or a
wound); `flinch` <- Flinch; `hurt` <- Fall (the death, its last frame flat on its back, the club dropped beside it -- the dropped club cut
with its own frame); `prone` <- Prone, played in reverse (the pages draw it lying, then pushing up; the engine falls through the row, lies at
its last frame and gets up through it backwards -- sprites.js S.proneRow, the hobgoblin's way). `spikedboneclub` is a new row name, appended to
pix.ANIM_ORDER here (the ettin's way).
Facings (the engine's 0 S, 1 SW, 2 W, 3 NW, 4 N, 5 NE, 6 E, 7 SE): S, E and SE take HEAD 1 as drawn, SW and W HEAD 1 mirrored; N and NE take
HEAD 2 as drawn, NW HEAD 2 mirrored (the club changes hands in a mirror: the accepted shortcut). Every row has both HEADs, so every row
plays its own view in every facing.
Key: sheetrows' grey test (blue minus red under 20), not a per-channel test: its darkest stuff is the matted hair, neutral black-brown,
and the navy and the ground shadows under its feet are blue -- per channel at 30 takes the shadows, at 50 drops the hair; the grey test keeps
the hair whole and leaves the shadows (check: key.png, the rear idle and the front idle).
Scale: one for the creature. The front idle (page 1) stands HEIGHT px, by height; the other pages meet it by area (holes filled), each by the
poses it shares: page 2 by its Flinch 3-4 (steadied, back on guard) against page 1's idle; page 3 by the median of its standing rows against
page 1's (idle, walk, and the club's guard, frames 1 and 6: 1.06, 1.02, 1.03 -- its idle's club stands out to the side where the front's
crosses the body); page 4 by its Flinch 3-4 against page 3's idle. Not by height across the views: the rear idle and walk are drawn standing
up straighter than the front's (by height, 1.13-1.19 of page 1's, page 3 would come out 0.88 of the size area gives it, its fists, feet and
club that much smaller than the front's -- and those agree with area: the club's length past the fist, read by eye off the attack's frames 4
and 5, is 72-78 px on page 3 against 75 on page 1); so the rear idle stands taller in the game than the front, 54 px with its outline against
50 (REAR_BY = 'height' gives the other answer, one line). The pages that share a pose agree across the views: the Lurk crouch stands 45 px
from the front and 46 from behind, the steadied Flinch 50 and 49 (measure). HEIGHT: a Medium, stocky, stooped: the front idle a few px under
the hobgoblin's upright 50 and over the goblin's (Small) 43; standing up it would be about a hero's height (the turnaround's upright Front
stands 1.3 of the idle on page 1). Each row is placed by its body's thick middle (core_x) on the foot,
its lowest frame on the floor; the fall by its first frame's feet (it starts standing where it stood; the rear's lying frames lie a little
lower, toward the camera, as drawn).
Colour: TONE brings pages 2-4 to page 1 per channel by the skin (the median of the pale, unsaturated pixels -- the bulk of the body, the
same stuff in every view): page 2's flinch to page 1's idle, pages 3's and 4's to page 1's turnaround Back (the same side). GPT drew the
later pages warmer and lighter.
"""
import os, sys, json, subprocess
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

G = 'grimlock'
FILES = {1: os.path.join(G, 'Grimlock Bone Club Sprite Sheet-1.png'),          # ART-07_HEAD-1_PAGE-1
         2: os.path.join(G, 'Grimlock sprite sheet_ lurk to prone-2.png'),     # ART-07_HEAD-1_PAGE-2
         3: os.path.join(G, 'Spiked bone club pose correction.png'),           # ART-07_HEAD-2_PAGE-1
         4: os.path.join(G, 'Grimlock Rear-View Pixel Sprite Sheet.png')}      # ART-07_HEAD-2_PAGE-2
SRC = os.path.join(ROOT, 'deep16', '_src')                 # his sheets live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per page: text boxes (a blob wholly inside one is lettering: the portrait, the row names; every row's number strip is added below), and its
# rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe). The first row's band top is given; the rest run
# strip-middle to strip-middle (bands below). No frame reaches over a line on these pages, and no two touch (the check says so)
SHEETS = {
  1: dict(text=[(0, 0, 445, 292), (10, 380, 92, 418), (10, 603, 96, 641), (10, 830, 160, 903)],
          rows=[('turn', (445, 0, 1536, 258), (259, 290), TURN, [620, 871, 1120, 1383]),
                ('idle', (0, 292, 1536, None), (492, 517), NUM(6), [242, 469, 691, 916, 1147, 1372]),
                ('walk', (0, None, 1536, None), (721, 748), NUM(8), [194, 366, 535, 714, 891, 1069, 1249, 1430]),
                ('club', (0, None, 1536, None), (975, 998), NUM(6), [255, 474, 679, 897, 1142, 1379])]),
  2: dict(text=[(10, 108, 92, 148), (10, 336, 114, 375), (10, 590, 80, 630), (10, 830, 110, 868)],
          rows=[('lurk', (0, 0, 1536, None), (209, 233), NUM(4), [218, 460, 691, 939]),
                ('flinch', (0, None, 1536, None), (456, 483), NUM(4), [233, 504, 712, 936]),
                ('fall', (0, None, 1536, None), (711, 739), NUM(6), [208, 415, 607, 845, 1096, 1375]),
                ('prone', (0, None, 1536, None), (917, 944), NUM(2), [225, 579])]),
  3: dict(text=[(10, 170, 90, 206), (10, 462, 96, 500), (10, 754, 160, 825)],
          rows=[('idle', (0, 0, 1536, None), (297, 321), NUM(6), [217, 444, 668, 891, 1120, 1343]),
                ('walk', (0, None, 1536, None), (590, 614), NUM(8), [201, 368, 545, 710, 886, 1068, 1245, 1424]),
                ('club', (0, None, 1536, None), (907, 931), NUM(6), [229, 448, 668, 884, 1111, 1368])]),
  4: dict(text=[(10, 152, 92, 190), (10, 372, 117, 408), (10, 633, 84, 670), (10, 865, 109, 902)],
          rows=[('lurk', (0, 0, 1536, None), (245, 269), NUM(4), [272, 557, 845, 1122]),
                ('flinch', (0, None, 1536, None), (491, 515), NUM(4), [259, 543, 834, 1107]),
                ('fall', (0, None, 1536, None), (735, 770), NUM(6), [194, 414, 630, 873, 1105, 1343]),
                ('prone', (0, None, 1536, None), (952, 976), NUM(2), [281, 663])]),
}
# loose bits by hand: page -> row -> [(box on the page: every blob wholly inside it, the label it belongs to)] -- the rear Prone 1's club lies
# on the floor beyond its hand, not touching it, about as near Prone 2's number as its own (the cut gave it right; this keeps it so). The
# other dropped clubs (the Falls' 5 and 6) lie by their own numbers; the front Prone 1's touches its hand
FIX = {4: {'prone': [((405, 875, 500, 940), '1')]}}
HEAD1, HEAD2 = (1, 2), (3, 4)                 # the pages of each view
ROWS = {'idle': 'idle', 'walk': 'walk', 'attack': 'club', 'spikedboneclub': 'club', 'still': 'lurk', 'flinch': 'flinch', 'hurt': 'fall',
        'prone': 'prone'}                     # engine row <- the pages' row (each in both views)
PAGE = {'idle': 0, 'walk': 0, 'club': 0, 'lurk': 1, 'flinch': 1, 'fall': 1, 'prone': 1}   # which page of its HEAD a row is on
VIEW = {0: (1, False), 6: (1, False), 7: (1, False), 1: (1, True), 2: (1, True), 4: (2, False), 5: (2, False), 3: (2, True)}  # facing -> (HEAD, mirrored)
NEW = ['spikedboneclub']                      # this cutter's own row (named here, not in pixelate.py)
FPS = {'idle': 6, 'walk': 10, 'attack': 10, 'spikedboneclub': 10, 'still': 3, 'flinch': 8, 'hurt': 8, 'prone': 8}
RELEASE = {'attack': 3, 'spikedboneclub': 3}  # frame 4: the club lands (battle.js times a melee row's hit by its release, 10-08)
HEIGHT = 47           # the front idle (page 1), standing px before the outline
REAR_BY = 'area'      # how page 3 meets page 1 ('height' stands the rear idle as tall as the front's)
FH, AY = 96, 84


def body(im):
    """a cut frame's measures on the page: sqrt of its area (holes filled), its height, its width"""
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    ys, xs = np.where(m.any(1))[0], np.where(m.any(0))[0]
    return float(np.sqrt(m.sum())), int(ys[-1] - ys[0] + 1), int(xs[-1] - xs[0] + 1)


def bands(L):
    """each row's band: the middle of the strip above to the middle of its own (the first row's top as given)"""
    rows, prev = [], None
    for r in SHEETS[L]['rows']:
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        if r[0] != 'turn':
            if prev is not None:
                y0 = prev
            y1 = (l0 + l1) // 2
            prev = y1
        rows.append((r[0], (x0, y0, x1, y1)) + tuple(r[2:]))
    return rows


def cut(L, check=False):
    s = SHEETS[L]
    rows = bands(L)
    hand = {(r[1][0], r[1][1]): r[4] for r in rows}
    orig = SR.label_xs
    spec = dict(text=s['text'] + [(r[1][0], r[2][0] - 3, r[1][2], r[2][1] + 4) for r in rows],   # (a number's drop shadow runs past its strip)
                rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows])
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    over = [] if check else None
    try:
        out = SR.cut_sheet(os.path.join(SRC, FILES[L]), spec, fix=FIX.get(L), overlay=over, tag='page %d' % L)
    finally:
        SR.label_xs = orig
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', G); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
    return out


def med(frs, i=0, idx=None):
    return float(np.median([body(frs[k][1])[i] for k in (idx if idx is not None else range(len(frs)))]))


def scales(c):
    """K per page (page px a game px)"""
    k1 = med(c[1]['idle'], 1) / HEIGHT
    r2 = med(c[2]['flinch'], 0, (2, 3)) / med(c[1]['idle'])                     # the steadied flinch against the idle, by area
    by_area = {row: (med(c[3][row], 0, idx) / med(c[1][row], 0, idx)) for row, idx in (('idle', None), ('walk', None), ('club', (0, 5)))}
    by_height = {row: (med(c[3][row], 1, idx) / med(c[1][row], 1, idx)) for row, idx in (('idle', None), ('walk', None), ('club', (0, 5)))}
    r3 = float(np.median(list((by_area if REAR_BY == 'area' else by_height).values())))
    r4 = med(c[4]['flinch'], 0, (2, 3)) / med(c[3]['idle'])
    K = {1: k1, 2: k1 * r2, 3: k1 * r3, 4: k1 * r3 * r4}
    print('  K: page 1 %.3f (its idle %.0f px high on the page, %d in the game); page 2 %.3f of it (its flinch 3-4 by area); page 3 %.3f '
          '(by %s: area idle %.3f walk %.3f guard %.3f, height idle %.3f walk %.3f guard %.3f); page 4 %.3f of page 3 (its flinch 3-4 by area)'
          % (k1, med(c[1]['idle'], 1), HEIGHT, r2, r3, REAR_BY, by_area['idle'], by_area['walk'], by_area['club'], by_height['idle'],
             by_height['walk'], by_height['club'], r4))
    for L, row, idx in ((1, 'idle', None), (1, 'walk', None), (2, 'lurk', None), (2, 'flinch', (2, 3)), (3, 'idle', None), (3, 'walk', None),
                        (4, 'lurk', None), (4, 'flinch', (2, 3))):
        print('    page %d %-6s stands %.1f px in the game' % (L, row + ('' if idx is None else ' 3-4'), med(c[L][row], 1, idx) / K[L]))
    return K


def skin(L, c, row, idx):
    """the median colour of a page's pale, unsaturated pixels (the skin) in the frames given"""
    p = np.concatenate([np.asarray(c[L][row][i][1]).reshape(-1, 4) for i in idx]).astype(float)
    p = p[p[:, 3] > 0, :3]
    mx, mn, mean = p.max(1), p.min(1), p.mean(1)
    return np.median(p[(mean > 70) & (mean < 210) & (mx - mn < 55)], 0)


def tones(c):
    ref_front, ref_back = skin(1, c, 'idle', range(6)), skin(1, c, 'turn', [2])
    T = {2: tuple(ref_front / skin(2, c, 'flinch', (2, 3))), 3: tuple(ref_back / skin(3, c, 'idle', range(6))),
         4: tuple(ref_back / skin(4, c, 'flinch', (2, 3)))}
    print('  TONE (per channel, by the skin): ' + '; '.join('page %d %s' % (L, ' '.join('%.3f' % v for v in t)) for L, t in T.items()))
    return T


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def game_frame(im, k, tone=None):
    """a cut frame at game size, palette-snapped and outlined"""
    if tone:
        im = toned(im, tone)
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX if k >= 1 else Image.LANCZOS)
    return pix.pixelate(small, 1, do_lift=False)


def core_x(a):
    """x of the body's thick middle (the torso and the head; the arms, the legs and the club are thinner), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


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


def main(mode):
    check = mode == 'check'
    c = {L: cut(L, check) for L in SHEETS}
    if mode == 'measure':
        for L in sorted(c):
            for row, frs in c[L].items():
                ms = [body(im) for _, im, _ in frs]
                print('  page %d %-6s sqrt-area %s | height %s | width %s' % (L, row, ' '.join('%.0f' % m[0] for m in ms),
                                                                           ' '.join('%d' % m[1] for m in ms), ' '.join('%d' % m[2] for m in ms)))
    K = scales(c)
    T = tones(c)
    if mode == 'measure':
        return
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            frs = c[L][row]
            floor = frs[0][2][3] if row == 'fall' else max(b[3] for _, _, b in frs)   # (the fall from its first frame's feet: no hop up first)
            out = []
            for nm, im, box in frs:
                a = game_frame(im, K[L], T.get(L))
                out.append((a, core_x(a), int(round((floor - box[3]) / K[L]))))
            small[(L, row)] = out
        return small[(L, row)]
    src = {}
    for eng, row in ROWS.items():
        per = []
        for f in range(8):
            head, mirrored = VIEW[f]
            fs = frames_of((HEAD1, HEAD2)[head - 1][PAGE[row]], row)
            if eng == 'prone':
                fs = fs[::-1]                        # pushing up, then lying: it lies at its last frame and gets up by playing it backwards
            per.append((fs, mirrored))
        counts = {len(fs) for fs, _ in per}
        if len(counts) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, sorted(counts)))
        src[eng] = per
    frames, sizes, lost = {}, {}, []
    for eng, per in src.items():
        half = max(max(cx, a.shape[1] - cx) for fs, _ in per for a, cx, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, (fs, mirrored) in enumerate(per):
            row = []
            for a, cx, up in fs:
                if mirrored:
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, up, fw, fw // 2)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    tall = max(AY - np.where(fr[..., 3].any(1))[0][0] for rows in frames.values() for row in rows for fr in row)
    deep = max(np.where(fr[..., 3].any(1))[0][-1] - AY for rows in frames.values() for row in rows for fr in row)
    print('  the tallest frame rises %d px over the foot, the lowest reaches %d below (AY %d, FH %d)' % (tall, deep, AY, FH))
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = G + '_p2'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for row in frames['idle'] for fr in row], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    for row, k in RELEASE.items():
        meta['anims'][row]['release'] = k
    meta['source'] = ('generated by Griz (2026-10-10: the art desk\'s ART-07, four GPT pages -- HEAD 1 from the bottom-right, HEAD 2 from '
                      'behind, two pages each), cut by tools/grimlock-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    h = lambda fr: np.where(fr[..., 3].any(axis=1))[0]
    print('  idle opaque height with outline, frame 1 by facing: ' + ', '.join('%s %d' % (n, h(frames['idle'][f][0])[-1] - h(frames['idle'][f][0])[0] + 1)
                                                                        for f, n in enumerate(['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'])) + '; top %d' % meta['top'])
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', G)
        facings(frames, meta, d)
        lineup(os.path.join(d, 'lineup.png'))
        key(os.path.join(d, 'key.png'))


def facings(frames, meta, d):
    """every row in every facing (S, SE, E, then the mirrors SW, W, then N, NE and the mirror NW), a grey floor, the release frame ringed"""
    order = [0, 7, 6, 1, 2, 4, 5, 3]
    for eng, per in frames.items():
        fw, n = meta['anims'][eng]['fw'], len(per[0])
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1) + 20, FH * len(order)), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for j, f in enumerate(order):
            for i, fr in enumerate(per[f]):
                x = 24 + i * (fw + 4)
                cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (x, j * FH))
                if meta['anims'][eng].get('release') == i:
                    dr.rectangle([x, j * FH, x + fw - 1, j * FH + FH - 1], outline=(255, 90, 90, 255))
            dr.text((2, j * FH + 2), ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'][f], fill=(255, 255, 255, 255))
            dr.line([(20, j * FH + AY + 1), (cv.width, j * FH + AY + 1)], fill=(110, 114, 110, 255))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % eng))


def art_frame(name, anim, facing, i):
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims'][anim]
    y = an['y'] + facing * an['fh']
    return im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']], an['ax'], an['ay']


def lineup(path):
    """the goblin (Small), the hobgoblin (Medium), Talmok (a hero), the Ninja stand-in, then the grimlock S, SE, E, N, NE, at 4x on a grey floor"""
    figs = [art_frame('goblin_p2', 'idle', 0, 0), art_frame('hobgoblin_p2', 'idle', 0, 0), art_frame('talmok_p1', 'idle', 0, 0),
            art_frame('grimlock_p1', 'idle', 0, 0)] + [art_frame('grimlock_p2', 'idle', f, 0) for f in (0, 7, 6, 4, 5)]
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
    canvas[top + 1, :, :3] = (110, 114, 110)
    Image.fromarray(canvas).resize((W * 4, H * 4), Image.NEAREST).save(path)


def key(path):
    """the key's proof: the rear idle 1 (the most hair) and the front idle 1 (its foot shadow) -- as drawn, then what the grey test keeps,
    per channel at 30 and at 50 (magenta: dropped)"""
    rows = []
    for L, (x0, y0, x1, y1) in ((3, (140, 85, 370, 290)), (1, (150, 305, 350, 492))):
        a = np.asarray(Image.open(os.path.join(SRC, FILES[L])).convert('RGB')).astype(np.int32)
        panels = [a[y0:y1, x0:x1]]
        for kw in (dict(), dict(chan=30), dict(chan=50)):
            m = SR.figure_mask(a, **kw)[y0:y1, x0:x1]
            s = a[y0:y1, x0:x1].copy(); s[~m] = (255, 0, 255)
            panels.append(s)
        rows.append(np.concatenate(panels, axis=1))
    W = max(r.shape[1] for r in rows)
    im = np.concatenate([np.pad(r, ((0, 4), (0, W - r.shape[1]), (0, 0))) for r in rows], axis=0).astype(np.uint8)
    Image.fromarray(im).resize((im.shape[1] * 2, im.shape[0] * 2), Image.NEAREST).save(path)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'write')

"""DEEP16 pipeline 2 (generated art): the art desk's two GPT pages of the gibbering mouther -> mouther_p2 (mouther_p1, the Pink Blob stand-in,
stays on disk).

    python tools/mouther-sheet.py            (writes deep16/art/mouther_p2.png/.json)
    python tools/mouther-sheet.py check      (also the cut overlays, dev/visions/mouther/cut-<n>.png, a contact strip a row, the bite in
                                              every facing, and a lineup beside the hobgoblin, the stand-in and the cube)

Sources (gitignored, the main checkout's -- a worktree reads them there), ART-05 (assignment ART-05-gibbering-mouther.md, the art log's
ART-05 entry, 2026-10-09; Griz's go for the cut, 2026-10-14: "go with those 5 (if we have what we need for the ogre)"):
  ART-05_HEAD-1_PAGE-1 = deep16/_src/mouther/Gibbering mouther tactics sprite sheet-1.png -- a portrait (dropped as lettering), a turnaround
      Front, Right, Back, Left (cut for the record only), then Idle 6, Ooze 8, Bites 6;
  ART-05_HEAD-1_PAGE-2 = deep16/_src/mouther/Spittle row frame five restored.png -- Spittle 6, Flinch 4, Fall 6 (the corrected page; the one
      whose Spittle 5 lost the creature is in _src/mouther/superseded/ and is not read).
Both pages are HEAD 1, isometric from the bottom-right, every frame facing the bottom-right (looked at, 10-14). The mouther is faceless (mouths
and eyes all over, no back): HEAD 1 plays every facing, S, SE, E, NE and N as drawn, SW, W and NW mirrored. No climb; no prone (SRD 5.1:
immune to prone); no HEAD 2.
Rows: Idle -> idle; Ooze -> walk; Bites -> `bites` (battle.js plays a row named for the attack, Bites) and `attack` (the fallback), the same
frames; Spittle -> `spittle` (Blinding Spittle, js/ai.js spit -- nothing plays it yet: the desk wires it), its `release` 3 (human frame 4, the
glob leaving the stalk's mouth; frame 5 is the white burst); Flinch -> flinch (the living hit, played once); Fall -> hurt (the death, ending a
flat heap). `bites` and `spittle` are this cutter's own rows, appended to pix.ANIM_ORDER here.
Each frame is placed by its number's x (the generator's cell centre, under the mound's middle at rest in every row: the stalks and the glob
reach forward of it, the fall spreads both ways round it) and by its foot -- the lowest opaque row in the columns about that x (the mound's
front at the ground; a bite stalk dipping below the mound's base, Bites 4's, does not lift the frame).
Scale: one for the creature in every row and facing, measured on the mound at rest by its WIDTH (a mound: no height to stand by), its area and
its middle's height checked beside it. PAGE-1's idle is the reference: WIDTH px wide at game size (a Medium mound about its square's 64 px
diamond -- the stand-in stood 62-68 wide and 64 tall, a tall blob; the hobgoblin, Medium, stands 50): the idle is 200 page px wide, K 3.457,
59 px wide and 43 tall with its outline in every facing. PAGE-1 drew its Ooze row smaller (the art log: "Ooze is visibly smaller"): its
frame 1, the mound at rest, is 0.823 of the idle by width (0.837 by area, 0.836 by its middle), and the row's sqrt-areas hold at 111-116
through the stretch, so the whole row takes the one fit. Its Bites row is at the idle's size (frames 1 and 6: the left half 1.005, the
middle 1.024 -- the stalks reach only right -- fit 1.015). PAGE-2 drew the mound bigger: its rest frames (Spittle 1 and 6, Flinch 1 and 4,
Fall 1) are 1.107 of the idle by width, 1.107 by area, 1.110 by the middle -- K 3.828. Spittle 5, the art desk's repair, drew its mound
about 0.87 of its row's (left half 0.855, middle 0.883 against Spittle 1 and 6: smaller, not squashed) and is fitted alone (FRAME_FIT),
or it shrank 4 px between frames 4 and 6. (The turnaround stills are 1.07-1.12 of the idle's
width and 1.15-1.19 of its middle: drawn a size up, not used.) The fits are measured each run and printed (scales()).
Colour: TONE brings PAGE-2 to PAGE-1 per channel (its rest frames 154 76 68 against the idle's 142 80 74: redder, 0.923 1.049 1.090),
measured each run. The palette has no mid pink: the page's salmon-pink dough snaps to the skin ramp, a tan-brown heap with red mouths.
Cut: sheetrows, its `chan` mask (any channel 40 from the navy: the black outline is in, the darker-navy drop shadow out). PAGE-2's Spittle 4
glob and its droplets fly loose between frames 4 and 5 and are given to 4 by hand (FIX); Spittle 5's white flash sits at the mound's front
foot, its sparks a few px from frame 6's left side, and frame 5's mound joins frame 6's there and Fall 4 joins Fall 5 at their spread feet --
the growth from each mound's core parts them (the overlays show it: every spark of the flash is 5's, frame 6 whole). Every hole left in a
frame is filled (12-40 page px: the throats of the stalks' mouths and a pupil or two, never the navy -- no stalk closes a loop).
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

FILES = {1: os.path.join('mouther', 'Gibbering mouther tactics sprite sheet-1.png'),    # ART-05_HEAD-1_PAGE-1
         2: os.path.join('mouther', 'Spittle row frame five restored.png')}            # ART-05_HEAD-1_PAGE-2
SRC = os.path.join(ROOT, 'deep16', '_src')                 # the pages live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, FILES[1])):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

NUM = lambda k: [str(i + 1) for i in range(k)]
TURN = ['front', 'right', 'back', 'left']
# per page: text boxes (a blob wholly inside one is lettering: the portrait, the row names; every row's number strip is added below), and its
# rows: (row, band x0 y0 x1 y1, number strip y0 y1, names, the numbers' x off the probe) -- probed 10-14. A band runs from the middle of the
# strip above to the middle of its own; the last row's runs to the foot of the page (Bites 4's lowest mouth dips to 966, past its strip's middle)
SHEETS = {
  1: dict(text=[(40, 0, 480, 335), (0, 420, 95, 455), (0, 625, 95, 655), (0, 830, 95, 860)],
          rows=[('turn', (500, 100, 1536, 297), (298, 321), TURN, [625, 883, 1140, 1387]),
                ('idle', (0, 330, 1536, None), (526, 543), NUM(6), [196, 421, 645, 870, 1094, 1319]),
                ('ooze', (0, None, 1536, None), (712, 730), NUM(8), [175, 361, 540, 712, 900, 1081, 1267, 1441]),
                ('bites', (0, None, 1536, 1024), (952, 970), NUM(6), [190, 429, 664, 899, 1142, 1369])]),
  2: dict(text=[(0, 180, 110, 220), (0, 480, 110, 512), (0, 772, 110, 802)],
          rows=[('spittle', (0, 0, 1536, None), (295, 313), NUM(6), [213, 446, 666, 888, 1154, 1387]),
                ('flinch', (0, None, 1536, None), (590, 609), NUM(4), [213, 440, 665, 891]),
                ('fall', (0, None, 1536, 1024), (887, 905), NUM(6), [207, 425, 662, 887, 1130, 1386])]),
}
CHAN = 40
# loose bits by hand: page -> row -> [(box on the page: every blob wholly inside it, the label it belongs to)]
FIX = {2: {'spittle': [((970, 135, 1052, 210), '4'),        # the glob and its five droplets, flying between 4's stalk and 5's mound
                       ((1222, 268, 1246, 292), '5')]}}     # a spark of 5's flash, under its foot
CUT = {}
TOUCH_OK = {2: ('spittle', 'fall')}                         # (5's flash meets 6's mound, Fall 4 meets 5: looked at, parted by growth -- the overlays)

ROWS = {'idle': (1, 'idle'), 'walk': (1, 'ooze'), 'attack': (1, 'bites'), 'bites': (1, 'bites'),
        'spittle': (2, 'spittle'), 'flinch': (2, 'flinch'), 'hurt': (2, 'fall')}
NEW = ['bites', 'spittle']        # this cutter's own rows (named here, not in pixelate.py)
FPS = {'idle': 6, 'walk': 8, 'attack': 10, 'bites': 10, 'spittle': 10, 'flinch': 8, 'hurt': 7}
RELEASE = {'spittle': 3}          # the glob leaves on human frame 4 (index 3); the burst is frame 5
MIRROR = (1, 2, 3)                # SW, W, NW take HEAD 1 mirrored; every other facing as drawn
WIDTH = 58                        # the idle's width at game size, px without the outline (60 with it)
FH, AY = 80, 68
FOOT_SPAN = 12                    # sheet px each side of the number's x where the foot is read
# the rest frames each fit is measured on (1-based, as the pages number them)
REST = {(1, 'ooze'): ['1'], (1, 'bites'): ['1', '6'], 2: [('spittle', '1'), ('spittle', '6'), ('flinch', '1'), ('flinch', '4'), ('fall', '1')]}
# one frame fitted alone: Spittle 5 (the art desk's repair) drew the mound about 0.87 of its row's, narrower AND lower (not a squash, which
# spreads as it sinks -- Flinch 2's does), so it would shrink 4 px between 4 and 6 at game size
FRAME_FIT = {(2, 'spittle', '5'): ['1', '6']}


def bands(L):
    rows, prev = [], None
    for r in SHEETS[L]['rows']:
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        if r[0] != 'turn':
            if prev is not None:
                y0 = prev
            mid = (l0 + l1) // 2
            prev = mid
            y1 = y1 if y1 is not None else mid
        rows.append((r[0], (x0, y0, x1, y1)) + tuple(r[2:]))
    return rows


def cut(L, check=False):
    s = SHEETS[L]
    rows = bands(L)
    hand = {(r[1][0], r[1][1]): r[4] for r in rows}
    orig = SR.label_xs
    spec = dict(text=s['text'] + [(r[1][0], r[2][0] - 3, r[1][2], r[2][1] + 4) for r in rows],   # (a number's drop shadow runs past its strip)
                rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows], chan=CHAN)
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    over = [] if check else None
    try:
        out = SR.cut_sheet(os.path.join(SRC, FILES[L]), spec, fix=FIX.get(L), cuts=CUT.get(L), touch_ok=TOUCH_OK.get(L, ()),
                           overlay=over, tag='page %d' % L)
    finally:
        SR.label_xs = orig
    labx = {r[0]: r[4] for r in rows}
    out = {row: [(nm, im, box, labx[row][i]) for i, (nm, im, box) in enumerate(frs)] for row, frs in out.items() if row in labx}
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'mouther'); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
    return out


def measure(fr):
    """a cut frame's measures on the page: width, sqrt(area) (holes filled), the middle's height (the number's column, its foot to its top),
    the left half (the number's x to the leftmost opaque column), the foot (page y)"""
    nm, im, box, lx = fr
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    cx = int(round(lx - box[0]))
    col = m[:, max(0, cx - FOOT_SPAN):cx + FOOT_SPAN + 1].any(1)
    ys = np.where(col)[0]
    xs = np.where(m.any(0))[0]
    return dict(w=int(xs[-1] - xs[0] + 1), a=float(np.sqrt(m.sum())), mid=int(ys[-1] - ys[0] + 1), left=int(cx - xs[0]),
                foot=int(box[1] + ys[-1]))


def scales(c):
    """K per (page, row): page px a game px"""
    med = lambda frs, key: float(np.median([measure(f)[key] for f in frs]))
    pick = lambda L, row, names: [f for f in c[L][row] if f[0] in names]
    idle = {k: med(c[1]['idle'], k) for k in ('w', 'a', 'mid', 'left')}
    k1 = idle['w'] / WIDTH
    print('  idle (PAGE-1, page px): width %.0f, sqrt-area %.1f, middle %.0f, left half %.0f -> K %.3f (the idle %d px wide, %.0f tall at game size)'
          % (idle['w'], idle['a'], idle['mid'], idle['left'], k1, WIDTH, idle['mid'] / k1))
    for nm, im, box, lx in c[1]['turn']:
        mm = measure((nm, im, box, lx))
        print('    turnaround %s (record only): width %.3f of the idle, area %.3f, middle %.3f' % (nm, mm['w'] / idle['w'], mm['a'] / idle['a'], mm['mid'] / idle['mid']))
    K = {}
    # ooze: its rest frame against the idle, by width (area and middle beside it); and the row's areas, frame by frame
    oz = pick(1, 'ooze', REST[(1, 'ooze')])
    fo = {k: med(oz, k) / idle[k] for k in ('w', 'a', 'mid')}
    K[(1, 'ooze')] = k1 * fo['w']
    print('  ooze 1 against the idle: width %.3f, area %.3f, middle %.3f -> fit by width; the row\'s sqrt-areas %s'
          % (fo['w'], fo['a'], fo['mid'], ' '.join('%.0f' % measure(f)['a'] for f in c[1]['ooze'])))
    # bites: frames 1 and 6 by the left half and the middle (the stalks reach right)
    bt = pick(1, 'bites', REST[(1, 'bites')])
    fb = {k: med(bt, k) / idle[k] for k in ('left', 'mid')}
    K[(1, 'bites')] = k1 * float(np.mean([fb['left'], fb['mid']]))
    print('  bites 1, 6 against the idle: left half %.3f, middle %.3f -> fit %.3f' % (fb['left'], fb['mid'], K[(1, 'bites')] / k1))
    K[(1, 'idle')] = K[(1, 'turn')] = k1
    # page 2: its rest frames against the idle, by width
    r2 = [f for row, n in REST[2] for f in pick(2, row, [n])]
    f2 = {k: med(r2, k) / idle[k] for k in ('w', 'a', 'mid')}
    k2 = k1 * f2['w']
    print('  PAGE-2 rest frames against the idle: width %.3f, area %.3f, middle %.3f -> K %.3f; each: %s'
          % (f2['w'], f2['a'], f2['mid'], k2, ', '.join('%s %s w %.3f mid %.3f' % (row, n, measure(f)['w'] / idle['w'], measure(f)['mid'] / idle['mid'])
                                                         for (row, n), f in zip(REST[2], r2))))
    for row in c[2]:
        K[(2, row)] = k2
    # a frame drawn a size off its row (the art desk's repair of Spittle 5 drew the mound smaller): by its left half and middle against
    # its row's rest frames (the flash is on its right)
    for (L, row, nm), by in FRAME_FIT.items():
        f = pick(L, row, [nm])
        r = float(np.mean([measure(f[0])[k] / med(pick(L, row, by), k) for k in ('left', 'mid')]))
        K[(L, row, nm)] = K[(L, row)] * r
        print('  %s %s against %s %s: left half %.3f, middle %.3f -> fit %.3f (game size: the mound %.0f px tall, its row\'s %.0f)'
              % (row, nm, row, ' and '.join(by), measure(f[0])['left'] / med(pick(L, row, by), 'left'), measure(f[0])['mid'] / med(pick(L, row, by), 'mid'),
                 r, measure(f[0])['mid'] / K[(L, row, nm)], med(pick(L, row, by), 'mid') / K[(L, row)]))
    return K


def figure_mean(im):
    a = np.asarray(im).astype(float)
    return a[a[..., 3] > 0][:, :3].mean(0)


def tones(c):
    """PAGE-2 to PAGE-1 per channel: its rest frames' mean RGB against the idle's"""
    p1 = np.mean([figure_mean(f[1]) for f in c[1]['idle']], axis=0)
    p2 = np.mean([figure_mean(f[1]) for row, n in REST[2] for f in c[2][row] if f[0] == n], axis=0)
    t = tuple(float(round(x, 3)) for x in p1 / p2)
    print('  tone: PAGE-1 idle %s, PAGE-2 rest frames %s -> %s%s' % (np.round(p1, 1).tolist(), np.round(p2, 1).tolist(), t,
                                                                  '' if max(abs(x - 1) for x in t) > 0.03 else ' (within 3%: not toned)'))
    return {2: t} if max(abs(x - 1) for x in t) > 0.03 else {}


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def game_frame(fr, k, tone=None):
    """a cut frame at game size, palette-snapped and outlined (2 px of room round it for the outline) -> (array, anchor x, foot row)"""
    nm, im, box, lx = fr
    if tone:
        im = toned(im, tone)
    a = np.asarray(im).copy()                                 # every hole is the mouther's own: a gaping mouth's dark throat, a pupil (12-40
    a[..., 3] = ndimage.binary_fill_holes(a[..., 3] > 0) * 255     # page px; no stalk on these pages closes a loop round the navy) -- filled
    im = Image.fromarray(a, 'RGBA')
    w, h = im.size
    small = im.resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX)
    sx, sy = small.size[0] / float(w), small.size[1] / float(h)
    roomy = Image.new('RGBA', (small.size[0] + 4, small.size[1] + 4), (0, 0, 0, 0)); roomy.paste(small, (2, 2))
    a = pix.pixelate(roomy, 1, do_lift=False)
    foot = (measure(fr)['foot'] - box[1] + 1) * sy + 2       # (the foot's lower edge, game px, in the roomy frame)
    return a, 2 + (lx - box[0]) * sx, foot


def place(a, x_ref, foot, fw):
    """a 1x RGBA array onto an fw x FH frame: x_ref at the frame's middle, the foot's outline on AY (the house's way: place() in the twins
    puts the lowest opaque row, the outline, on AY)"""
    out = np.zeros((FH, fw, 4), dtype=np.uint8)
    ox, oy = int(round(fw // 2 - x_ref)), int(round(AY - foot))
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum()


def main(check=False):
    c = {L: cut(L, check) for L in SHEETS}
    for L in c:
        for row, frs in c[L].items():
            print('  page %d %s: feet %s' % (L, row, ' '.join(str(measure(f)['foot']) for f in frs)))
    K = scales(c)
    TONE = tones(c)
    small = {}
    def frames_of(L, row):
        if (L, row) not in small:
            small[(L, row)] = [game_frame(f, K.get((L, row, f[0]), K[(L, row)]), TONE.get(L)) for f in c[L][row]]
        return small[(L, row)]
    src = {}
    for eng, (L, row) in ROWS.items():
        fs = frames_of(L, row)
        src[eng] = [(fs, f in MIRROR) for f in range(8)]
    frames, sizes, lost = {}, {}, []
    for eng, per in src.items():
        half = max(max(cx, a.shape[1] - cx) for fs, _ in per for a, cx, _ in fs)    # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(96, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng] = []
        for f, (fs, mirrored) in enumerate(per):
            row = []
            for a, cx, foot in fs:
                if mirrored:
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone = place(a, cx, foot, fw)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
            frames[eng].append(row)
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    tall = max(AY - np.where(fr[..., 3].any(1))[0][0] for rows in frames.values() for row in rows for fr in row)
    low = max(np.where(fr[..., 3].any(1))[0][-1] - AY for rows in frames.values() for row in rows for fr in row)
    print('  the tallest frame rises %d px over the foot, the lowest reaches %d px under it (AY %d, FH %d)' % (tall, low, AY, FH))
    for extra in NEW:
        if extra not in pix.ANIM_ORDER: pix.ANIM_ORDER.append(extra)
    name = 'mouther_p2'
    pix.write_sheet(name, frames, 96, FH, 48, AY, pix.top_of([fr for f in (0, 6) for fr in frames['idle'][f]], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, fps in FPS.items():
        meta['anims'][row]['fps'] = fps
    for row, k in RELEASE.items():
        meta['anims'][row]['release'] = k
    meta['source'] = ('generated by the art desk (ART-05, 2026-10-09: two GPT pages of HEAD 1, isometric from the bottom-right -- the body and '
                      'Idle, Ooze, Bites; then Spittle, Flinch, Fall), cut by tools/mouther-sheet.py')
    json.dump(meta, open(meta_p, 'w'), indent=1)
    ink = lambda fr: np.where(fr[..., 3] > 0)
    for f in (6, 0, 2, 4):
        ys, xs = ink(frames['idle'][f][0])
        print('  idle facing %s: %d wide, %d tall with its outline (top %d)' % (['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'][f],
                                                                              xs.max() - xs.min() + 1, ys.max() - ys.min() + 1, meta['top']))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'mouther')
        lineup(os.path.join(d, 'lineup.png'))
        strips(frames, meta, d)


def art_frame(name, anim, facing, i=0):
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = np.asarray(Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA'))
    an = m['anims'][anim]
    y = an['y'] + facing * an['fh']
    return im[y:y + an['fh'], i * an['fw']:(i + 1) * an['fw']], an['ax'], an['ay']


def lineup(path, scale=4):
    """the hobgoblin (Medium), the Pink Blob stand-in, the mouther (E, S, W idle; E walk 8; E fall 6), the cube (Large), the goblin (Small) --
    on their feet on a grey floor, the foot's row red, at 4x (his size, for Griz's eye)"""
    figs = [art_frame('hobgoblin_p2', 'idle', 6), art_frame('mouther_p1', 'idle', 6), art_frame('mouther_p2', 'idle', 6),
            art_frame('mouther_p2', 'idle', 0), art_frame('mouther_p2', 'idle', 2), art_frame('mouther_p2', 'walk', 6, 7),
            art_frame('mouther_p2', 'hurt', 6, 5), art_frame('cube_p2', 'idle', 6), art_frame('goblin_p2', 'idle', 6)]
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
    canvas[top, :, :3] = (110, 40, 40)                          # (the foot's row)
    Image.fromarray(canvas).resize((W * scale, H * scale), Image.NEAREST).save(path)


def strips(frames, meta, d, z=3):
    """a contact strip a row (facing SE, as drawn; a grey floor, the frame's number, the release frame ringed red), and the bite and the
    spittle in every facing (S SW W NW N NE E SE, a line each)"""
    for eng, per in frames.items():
        fs = per[7]
        fw = meta['anims'][eng]['fw']
        W, H = fw * len(fs) + 4 * (len(fs) + 1), FH
        cv = Image.new('RGBA', (W, H), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for i, fr in enumerate(fs):
            x = 4 + i * (fw + 4)
            dr.line([(x, AY + 1), (x + fw, AY + 1)], fill=(110, 114, 110, 255))
            cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (x, 0))
            dr.text((x + 2, 2), str(i + 1), fill=(255, 255, 255, 255))
            if meta['anims'][eng].get('release') == i:
                dr.rectangle([x, 0, x + fw - 1, H - 1], outline=(255, 90, 90, 255))
        cv.resize((W * z, H * z), Image.NEAREST).save(os.path.join(d, 'row-%s.png' % eng))
    for eng in ('bites', 'spittle', 'idle'):
        fw = meta['anims'][eng]['fw']
        n = len(frames[eng][0])
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1), FH * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            for i, fr in enumerate(frames[eng][f]):
                cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (4 + i * (fw + 4), f * FH))
            dr.text((2, f * FH + 2), ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'][f], fill=(255, 255, 255, 255))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % eng))


if __name__ == '__main__':
    main(check='check' in sys.argv[1:])

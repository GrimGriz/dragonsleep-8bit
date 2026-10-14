"""DEEP16 pipeline 2 (generated art): Griz's ten GPT sheets of the grimlock, five views -> grimlock_p2 (the Ninja stand-in, grimlock_p1, stays
on disk).

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
and the art desk's ART-23 (no manifest came with its zip; generated and sorted into _src/grimlock/ART-23 2026-10-14, named by page ID):
  5  ART-23_HEAD-3_PAGE-1.png   Idle 6, Walk 8, Spiked Bone Club 6         (the front attack kept front-facing through impact and recovery)
  6  ART-23_HEAD-3_PAGE-2.png   Lurk 4, Flinch 4, Fall 6, Prone 2
  7  ART-23_HEAD-4_PAGE-1.png   Idle 6, Walk 8, Spiked Bone Club 6         (the profile redrawn to show less chest)
  8  ART-23_HEAD-4_PAGE-2.png   Lurk 4, Flinch 4, Fall 6, Prone 2          (the profile Fall's club-hand discontinuity repaired)
  9  ART-23_HEAD-5_PAGE-1.png   Idle 6, Walk 8, Spiked Bone Club 6         (the back attack's frame-3 hand-switch repaired)
  10 ART-23_HEAD-5_PAGE-2.png   Lurk 4, Flinch 4, Fall 6, Prone 2
HEAD 1 (pages 1, 2) is drawn from the bottom-right, facing the bottom-right (the club in its right hand: the viewer's left); HEAD 2 (pages 3,
4) from the top-right, seen from behind, facing the top-right (the club in its right hand: the viewer's right); HEAD 3 (pages 5, 6) from the
front, facing the viewer (the club in its right hand: the viewer's left); HEAD 4 (pages 7, 8) its right side, facing right (the club in the
near hand, its right); HEAD 5 (pages 9, 10) from straight behind (the club in its right hand: the viewer's right). Every row of ART-23 was
looked at frame by frame: the club stays in the right hand in every one (the front's Fall 3 holds only its handle across the belly, the head
hidden; the profile's Fall 4-6 and the back's Fall 5-6 drop it by that hand). Each page is cut by its own row and number labels
(tools/sheetrows.py; the numbers' x read off the sheets by a probe); every row's number strip and name is lettering. Where a frame touches
what is not its own, a line is cleared (CUT: HEAD 5's Walk, its spiked heads against the next frame's fist; UNTOUCH: the front's row name
against its Spiked Bone Club 1), and page 8's Fall band runs to y 750 (its dropped clubs reach past the strip's middle).
Rows: `idle` <- Idle; `walk` <- Walk; `spikedboneclub` and `attack` <- Spiked Bone Club (battle.js plays a row named for the attack, lower-
cased, letters only, and falls back to `attack`; its `release` 3 is frame 4, the club's contact -- the front's club down at the foe's feet,
the rear's arm coming over); `still` <- Lurk (the grimlock starts hidden by its Stone Camouflage: ui.js plays `still` till its first turn or a
wound); `flinch` <- Flinch; `hurt` <- Fall (the death, its last frame flat on its back, the club dropped beside it -- the dropped club cut
with its own frame); `prone` <- Prone, played in reverse (the pages draw it lying, then pushing up; the engine falls through the row, lies at
its last frame and gets up through it backwards -- sprites.js S.proneRow, the hobgoblin's way). `spikedboneclub` is a new row name, appended to
pix.ANIM_ORDER here (the ettin's way).
Facings (the engine's 0 S, 1 SW, 2 W, 3 NW, 4 N, 5 NE, 6 E, 7 SE), the table FACING, RULED 10-14 (a figure is five drawn views): S <- HEAD 3,
E <- HEAD 4 and W <- HEAD 4 mirrored, N <- HEAD 5, SE <- HEAD 1 and SW <- HEAD 1 mirrored, NE <- HEAD 2 and NW <- HEAD 2 mirrored (the club
changes hands in a mirror: the accepted shortcut). Every row is drawn in every view, so every row plays its own view in every facing. (Till
ART-23 came, 10-14, S and E took HEAD 1 and N HEAD 2; the SE, SW, NE and NW frames are the same drawings as then, pixel for pixel.)
Key: sheetrows' grey test (blue minus red under 20), not a per-channel test: its darkest stuff is the matted hair, neutral black-brown,
and the navy and the ground shadows under its feet are blue -- per channel at 30 takes the shadows, at 50 drops the hair; the grey test keeps
the hair whole and leaves the shadows (check: key.png, the rear idle, the front idle, and HEAD 5's idle, the most hair).
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
stands 1.3 of the idle on page 1). ART-23's views meet page 1 the same way, each first page by the median of its standing rows against
page 1's (BY), each second page by its steadied Flinch (STEADY) against its own idle, by area: HEAD 3 (the front) and HEAD 4 (the side) by
height -- from the front and the side the figure stoops as the bottom-right view does, and by area the side, slimmer, would come out a fifth
too big (the earth elemental's lesson, 10-08); by height the front stands 1.28 of page 1 (area says 1.23) and the side 1.25 (area 1.05).
HEAD 5 (straight behind) by area, as the rear is (Griz, 10-14: "grimlock is hunched forward reads taller from rear angles fine"): 1.23 --
and by height against page 3 it meets the other rear view within a percent, so N and NE stand alike. The idle in every facing, frame 1 with
its outline: S 48, SW 50, W 49, NW 54, N 54, NE 54, E 49, SE 50 (top 56); the walks stand 49-50 from the front, the front-right and the side,
52 and 58 from behind. The second pages' crouches are drawn deeper from the front and the side than from the other views: the Lurk stands 42
from the front and 39 from the side, against 45 from the front-right and 46 from both rear views (the club's bone, the same size in idle and
lurk on the front's two pages, says page 6 is page 5's size; the cutter can't make GPT's crouch shallower).
Each row is placed by its body's thick middle (core_x) on the foot, its lowest frame on the floor; the fall by its first frame's feet (it
starts standing where it stood; the lying frames from behind and from the front lie a little lower, toward the camera, as drawn).
Colour: TONE brings every page to page 1 per channel by the skin (the median of the pale, unsaturated pixels -- the bulk of the body, the
same stuff in every view; a view's first page by its idle, its second by its steadied flinch) to the skin TONE_REF names: pages 2, 5 and 6
to page 1's idle, 3, 4, 9 and 10 to its turnaround Back, 7 and 8 to its turnaround Right (the same side). GPT drew the later pages warmer
and lighter.
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
         4: os.path.join(G, 'Grimlock Rear-View Pixel Sprite Sheet.png'),      # ART-07_HEAD-2_PAGE-2
         5: os.path.join(G, 'ART-23', 'ART-23_HEAD-3_PAGE-1.png'),
         6: os.path.join(G, 'ART-23', 'ART-23_HEAD-3_PAGE-2.png'),
         7: os.path.join(G, 'ART-23', 'ART-23_HEAD-4_PAGE-1.png'),
         8: os.path.join(G, 'ART-23', 'ART-23_HEAD-4_PAGE-2.png'),
         9: os.path.join(G, 'ART-23', 'ART-23_HEAD-5_PAGE-1.png'),
         10: os.path.join(G, 'ART-23', 'ART-23_HEAD-5_PAGE-2.png')}
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
  5: dict(text=[(12, 150, 100, 200), (10, 462, 100, 510), (10, 765, 146, 842)],
          rows=[('idle', (0, 0, 1536, None), (283, 305), NUM(6), [219, 452, 681, 911, 1146, 1378]),
                ('walk', (0, None, 1536, None), (590, 612), NUM(8), [200, 369, 553, 715, 892, 1078, 1241, 1419]),
                ('club', (0, None, 1536, None), (924, 946), NUM(6), [227, 452, 681, 903, 1143, 1385])]),
  6: dict(text=[(12, 115, 100, 160), (12, 355, 120, 398), (10, 592, 85, 636), (12, 843, 115, 885)],
          rows=[('lurk', (0, 0, 1536, None), (225, 247), NUM(4), [287, 605, 917, 1234]),
                ('flinch', (0, None, 1536, None), (479, 501), NUM(4), [298, 605, 920, 1212]),
                ('fall', (0, None, 1536, None), (723, 745), NUM(6), [178, 414, 631, 886, 1145, 1394]),
                ('prone', (0, None, 1536, None), (958, 980), NUM(2), [555, 942])]),
  7: dict(text=[(12, 167, 92, 209), (8, 450, 92, 493), (10, 779, 157, 855)],
          rows=[('idle', (0, 0, 1536, None), (292, 314), NUM(6), [204, 432, 663, 887, 1116, 1381]),
                ('walk', (0, None, 1536, None), (605, 626), NUM(8), [177, 354, 530, 704, 880, 1060, 1239, 1415]),
                ('club', (0, None, 1536, None), (929, 951), NUM(6), [220, 455, 671, 892, 1132, 1379])]),
  8: dict(text=[(16, 109, 98, 151), (18, 351, 120, 392), (17, 597, 85, 639), (18, 846, 117, 887)],
          rows=[('lurk', (0, 0, 1536, None), (216, 238), NUM(4), [290, 598, 903, 1212]),
                ('flinch', (0, None, 1536, None), (472, 494), NUM(4), [291, 598, 877, 1215]),
                ('fall', (0, None, 1536, 750), (728, 753), NUM(6), [192, 406, 617, 879, 1106, 1376]),   # (its dropped clubs reach
                ('prone', (0, None, 1536, None), (959, 980), NUM(2), [296, 633])]),                     # y 743, past the strip's middle)
  9: dict(text=[(14, 134, 97, 182), (9, 449, 103, 497), (9, 757, 146, 841)],
          rows=[('idle', (0, 0, 1536, None), (279, 303), NUM(6), [223, 449, 677, 904, 1136, 1377]),
                ('walk', (0, None, 1536, None), (589, 613), NUM(8), [190, 368, 533, 701, 886, 1055, 1234, 1408]),
                ('club', (0, None, 1536, None), (934, 957), NUM(6), [232, 465, 697, 926, 1143, 1380])]),
  10: dict(text=[(12, 109, 93, 151), (12, 359, 117, 401), (12, 614, 85, 656), (12, 858, 106, 899)],
           rows=[('lurk', (0, 0, 1536, None), (228, 249), NUM(4), [244, 533, 825, 1126]),
                 ('flinch', (0, None, 1536, None), (492, 513), NUM(4), [244, 542, 831, 1128]),
                 ('fall', (0, None, 1536, None), (745, 772), NUM(6), [207, 431, 637, 875, 1111, 1374]),
                 ('prone', (0, None, 1536, None), (965, 990), NUM(2), [266, 619])]),
}
# loose bits by hand: page -> row -> [(box on the page: every blob wholly inside it, the label it belongs to)] -- the rear Prone 1's club lies
# on the floor beyond its hand, not touching it, about as near Prone 2's number as its own (the cut gave it right; this keeps it so). The
# other dropped clubs (the Falls' 5 and 6) lie by their own numbers; the front Prone 1's touches its hand
FIX = {4: {'prone': [((405, 875, 500, 940), '1')]}}
# lines cleared (2 px) where a frame touches something not its own: page -> row -> [polyline] -- HEAD 5's Walk (page 9) holds the club out
# to its right, and four of its spiked heads touch the next frame's left fist, outline to outline (1-2, 2-3, 3-4, 5-6); each line runs
# through the dark between spike and knuckle (the 2-3 one round the spike's tip)
CUT = {9: {'walk': [((290, 477), (290, 490)), ((454, 484), (463, 484), (463, 492)), ((634, 475), (634, 485)), ((983, 479), (983, 489))]}}
# lines cleared before the lettering is dropped: page -> [polyline] -- HEAD 3's Spiked Bone Club 1 (page 5): the row name's "b" touches
# the club's butt by its drop shadow; cleared, "lub" lies wholly in its text box again and goes with the rest of the name
UNTOUCH = {5: [((135, 812), (135, 838))]}
HEADS = {1: (1, 2), 2: (3, 4), 3: (5, 6), 4: (7, 8), 5: (9, 10)}   # the pages of each view
ROWS = {'idle': 'idle', 'walk': 'walk', 'attack': 'club', 'spikedboneclub': 'club', 'still': 'lurk', 'flinch': 'flinch', 'hurt': 'fall',
        'prone': 'prone'}                     # engine row <- the pages' row (each in every view)
PAGE = {'idle': 0, 'walk': 0, 'club': 0, 'lurk': 1, 'flinch': 1, 'fall': 1, 'prone': 1}   # which page of its HEAD a row is on
# facing (deep16/js/sprites.js S.FACINGS) -> (HEAD, mirrored?). RULED 10-14, five drawn views: S <- HEAD 3, E <- HEAD 4 (W mirrored),
# N <- HEAD 5, SE <- HEAD 1 (SW mirrored), NE <- HEAD 2 (NW mirrored)
FACING = {0: (3, False), 1: (1, True), 2: (4, True), 3: (2, True), 4: (5, False), 5: (2, False), 6: (4, False), 7: (1, False)}
STEADY = {2: (2, 3), 4: (2, 3), 6: (0, 3), 8: (2, 3), 10: (2, 3)}  # a HEAD's second page: its Flinch frames back on guard (0-based)
NEW = ['spikedboneclub']                      # this cutter's own row (named here, not in pixelate.py)
FPS = {'idle': 6, 'walk': 10, 'attack': 10, 'spikedboneclub': 10, 'still': 3, 'flinch': 8, 'hurt': 8, 'prone': 8}
RELEASE = {'attack': 3, 'spikedboneclub': 3}  # frame 4: the club lands (battle.js times a melee row's hit by its release, 10-08)
HEIGHT = 47           # the front idle (page 1), standing px before the outline
REAR_BY = 'area'      # how page 3 meets page 1 ('height' stands the rear idle as tall as the front's)
BY = {2: REAR_BY, 3: 'height', 4: 'height', 5: 'area'}    # how each view's first page meets page 1 (its standing rows)
STAND = (('idle', None), ('walk', None), ('club', (0, 5)))  # the standing rows: idle, walk, the club's guard (frames 1 and 6)
TONE_REF = {1: 'idle', 2: 'back', 3: 'idle', 4: 'right', 5: 'back'}   # the skin each view's pages meet: page 1's idle or its turnaround panel
FH, AY = 96, 84


def body(im):
    """a cut frame's measures on the page: sqrt of its area (holes filled), its height, its width"""
    m = ndimage.binary_fill_holes(np.asarray(im)[..., 3] > 0)
    ys, xs = np.where(m.any(1))[0], np.where(m.any(0))[0]
    return float(np.sqrt(m.sum())), int(ys[-1] - ys[0] + 1), int(xs[-1] - xs[0] + 1)


def bands(L):
    """each row's band: the middle of the strip above to the middle of its own (the first row's top as given; a bottom given is kept)"""
    rows, prev = [], None
    for r in SHEETS[L]['rows']:
        (x0, y0, x1, y1), (l0, l1) = r[1], r[2]
        if r[0] != 'turn':
            if prev is not None:
                y0 = prev
            y1 = y1 if y1 is not None else (l0 + l1) // 2
            prev = y1
        rows.append((r[0], (x0, y0, x1, y1)) + tuple(r[2:]))
    return rows


def cut(L, check=False):
    s = SHEETS[L]
    rows = bands(L)
    hand = {(r[1][0], r[1][1]): r[4] for r in rows}
    orig, orig_mask = SR.label_xs, SR.figure_mask
    spec = dict(text=s['text'] + [(r[1][0], r[2][0] - 3, r[1][2], r[2][1] + 4) for r in rows],   # (a number's drop shadow runs past its strip)
                rows=[(r[0], r[1], (r[1][1], r[2][1])) + tuple(r[3:4]) for r in rows])
    SR.label_xs = lambda a, x0, x1, y0, y1: hand.get((x0, y0)) or orig(a, x0, x1, y0, y1)
    def untouched(a, *args, **kw):                   # the page's UNTOUCH lines cleared from the mask before the lettering is dropped
        m = orig_mask(a, *args, **kw)
        if L in UNTOUCH:
            wall = Image.new('1', (m.shape[1], m.shape[0]), 0)
            for line in UNTOUCH[L]:
                ImageDraw.Draw(wall).line(line, fill=1, width=2)
            m &= ~np.asarray(wall, dtype=bool)
        return m
    SR.figure_mask = untouched
    over = [] if check else None
    try:
        out = SR.cut_sheet(os.path.join(SRC, FILES[L]), spec, fix=FIX.get(L), cuts=CUT.get(L), overlay=over, tag='page %d' % L)
    finally:
        SR.label_xs, SR.figure_mask = orig, orig_mask
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', G); os.makedirs(d, exist_ok=True)
        over[0].save(os.path.join(d, 'cut-%d.png' % L))
    return out


def med(frs, i=0, idx=None):
    return float(np.median([body(frs[k][1])[i] for k in (idx if idx is not None else range(len(frs)))]))


def scales(c):
    """K per page (page px a game px): page 1 by its idle's height; each other view's first page against page 1 by its standing rows
    (BY), each second page by its steadied flinch against its own first page's idle, by area"""
    k1 = med(c[1]['idle'], 1) / HEIGHT
    K, said = {1: k1}, ['page 1 %.3f (its idle %.0f px high on the page, %d in the game)' % (k1, med(c[1]['idle'], 1), HEIGHT)]
    for h, (L1, L2) in sorted(HEADS.items()):
        if h > 1:
            by = {m: {row: med(c[L1][row], i, idx) / med(c[1][row], i, idx) for row, idx in STAND} for m, i in (('area', 0), ('height', 1))}
            r = float(np.median(list(by[BY[h]].values())))
            K[L1] = k1 * r
            said.append('page %d %.3f of page 1 (HEAD %d by %s: area idle %.3f walk %.3f guard %.3f, height idle %.3f walk %.3f guard %.3f)'
                        % (L1, r, h, BY[h], by['area']['idle'], by['area']['walk'], by['area']['club'], by['height']['idle'],
                           by['height']['walk'], by['height']['club']))
        r = med(c[L2]['flinch'], 0, STEADY[L2]) / med(c[L1]['idle'])          # the steadied flinch against its view's idle, by area
        K[L2] = K[L1] * r
        said.append('page %d %.3f of page %d (its flinch %s by area)' % (L2, r, L1, '-'.join(str(i + 1) for i in STEADY[L2])))
    print('  K: ' + '; '.join(said))
    for h, (L1, L2) in sorted(HEADS.items()):
        for L, row, idx in ((L1, 'idle', None), (L1, 'walk', None), (L2, 'lurk', None), (L2, 'flinch', STEADY[L2])):
            print('    HEAD %d page %-2d %-6s stands %.1f px in the game' % (h, L, row + ('' if idx is None else ' ' + '-'.join(str(i + 1) for i in idx)),
                                                                         med(c[L][row], 1, idx) / K[L]))
    return K


def skin(L, c, row, idx):
    """the median colour of a page's pale, unsaturated pixels (the skin) in the frames given"""
    p = np.concatenate([np.asarray(c[L][row][i][1]).reshape(-1, 4) for i in idx]).astype(float)
    p = p[p[:, 3] > 0, :3]
    mx, mn, mean = p.max(1), p.min(1), p.mean(1)
    return np.median(p[(mean > 70) & (mean < 210) & (mx - mn < 55)], 0)


def tones(c):
    """each page's skin to page 1's per channel: a view's first page by its idle, its second by its steadied flinch, each to the skin
    TONE_REF names (page 1's idle, or the turnaround panel of the same side)"""
    ref = {'idle': skin(1, c, 'idle', range(6))}
    ref.update({nm: skin(1, c, 'turn', [TURN.index(nm)]) for nm in TURN})
    T = {}
    for h, (L1, L2) in sorted(HEADS.items()):
        for L in (L1, L2):
            if L != 1:
                T[L] = tuple(ref[TONE_REF[h]] / (skin(L, c, 'idle', range(6)) if L == L1 else skin(L, c, 'flinch', STEADY[L])))
    print('  TONE (per channel, by the skin): ' + '; '.join('page %d %s' % (L, ' '.join('%.3f' % v for v in t)) for L, t in T.items()))
    print('  the skins: ' + '; '.join('%s %s' % (nm, ' '.join('%.0f' % v for v in s)) for nm, s in ref.items()))
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
            head, mirrored = FACING[f]
            fs = frames_of(HEADS[head][PAGE[row]], row)
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
                      'behind; 2026-10-14: ART-23, six more -- HEAD 3 from the front, HEAD 4 the right side, HEAD 5 from straight behind; '
                      'two pages each), cut by tools/grimlock-sheet.py')
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
    """the key's proof: the rear idle 1 (the most hair), the front idle 1 (its foot shadow), and HEAD 5's idle 1 (the hair from straight
    behind) -- as drawn, then what the grey test keeps, per channel at 30 and at 50 (magenta: dropped)"""
    rows = []
    for L, (x0, y0, x1, y1) in ((3, (140, 85, 370, 290)), (1, (150, 305, 350, 492)), (9, (125, 35, 360, 285))):
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

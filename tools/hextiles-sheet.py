"""DEEP16 pipeline 2 (generated art): the Hex's inside, the art desk's ART-115 ("best available", 10-27), cut into hextiles_p1 on the top tiles seat's
machinery (tools/toptiles-sheet.py: cut_ground, cut_prop, the Atlas). js/hex.js lays it over its own drawing, the code kept as the fallback.

    python tools/hextiles-sheet.py           (`check` also writes dev/visions/hextiles_p1-check.png: the atlas at 4x on navy)

Asked in deep16-art-wanted.md section 23 (the Hex interior seat, 10-22, five HEADs: the floors, the walls from inside, the ground floor's things, the upper
floors' things, the Hex from outside drawn straight down); taken in 10-28 by the second cutter seat (the lanes desk's order on Griz's "spin up a second cutter,
more landing in fresh"). Sources (gitignored): deep16/_src/hextiles/ART-115/ (nine pages), the art desk's papers in
_src/art-desk/received-2026-10-27-ART-115-BEST-AVAILABLE-SHEETS/ (its STATUS, CUTTER-NOTES, PLAN, manifest). Its manifest names each page's pieces in reading
order but gives no windows ("Manual extraction required"), so the windows are here, measured off the pages (each drawing's own box on the navy, its label left out).

What is cut, and what is not (the art desk's own notes FAIL several groups; the Hex is drawn by code on its true diagonals, 30 degrees off level, at 5 ft a square):
  - HEAD 1 PAGE 1-2, the floors' fills, four variants each, 48 px a square: the concourse's boards (east-west, as the code's run), the upper and lower tiers'
    timber, the board lip's top (its boards, without the riser the art desk drew under them: 48 x 32), the council's boards, the red and the blue rugs' lattice,
    the rush mat. js/hex.js samples them as it samples ART-111's raked sand -- the tiers and the lip along each of the six faces (their planks follow the face).
  - HEAD 3-4, the things that stand, each at its footprint's width in js/hex.js (5 ft a square, 9.6 px a foot), boxed down, snapped, outlined: the spiral
    stair, the contraband box, the trestle table and its benches (the north notches' tables), the odds slate (Korvin's), the felt card table and the stool,
    Vair's empty chair, the council's table and chairs, Urtusk's desk and strongbox, the Armory's chest; the timber post (the six logs on the ground floor).
  - HEAD 5, the doors at the south tip (closed), for the town's Hex (js/topview.js hexCanvas).
  - NOT cut (the code's drawing stands): HEAD 1 PAGE 3-5, the edges between the grounds (drawn on the art desk's own diagonals, not the Hex's: their corners
    repeat, its notes say); HEAD 2, the walls from inside (FAIL in its notes: plaster and stone for the logs, the windows facing every way, iso, not straight
    down); the four bars (drawn at 36 degrees and level, where the Hex's stand at 30 and 12), the bartender's shelf, the Wall of Boxes, the guard station, the
    cushioned bench and the weapon rack (each drawn from the front, level, where the Hex's stand on a diagonal); the rails (no north-south run among them, and the
    diagonals not the Hex's); the roof ring's bands, hips and opening (FAIL in its notes); the south log walls; the lit lantern (no square asks for it).
"""
import os, sys
import importlib.util
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('toptiles', os.path.join(ROOT, 'tools', 'toptiles-sheet.py'))
TT = importlib.util.module_from_spec(spec); spec.loader.exec_module(TT)
T = TT.T
SRC = os.path.join(TT.PX.SRC, 'hextiles', 'ART-115')
PXFT = T / 5.0                     # js/hex.js: a square is 5 ft and 48 px


def page(h, p):
    return os.path.join(SRC, 'ART-115_HEAD-%d_PAGE-%d.png' % (h, p))


# HEAD 1: the fills, each page four rows of four (x0, x1) by (y0, y1), the windows measured off the pages
FILLS = {
    (1, 1): ([(154, 411), (431, 683), (703, 953), (972, 1226)], [(43, 301), (328, 584), (610, 882), (903, 1189)],
             ['hx_plank', 'hx_tier_hi', 'hx_tier_lo', 'hx_lip']),
    (1, 2): ([(185, 452), (464, 734), (745, 1021), (1033, 1307)], [(19, 288), (304, 580), (592, 861), (872, 1150)],
             ['hx_council', 'hx_rug_red', 'hx_rug_blue', 'hx_rushmat']),
}
# the things that stand: name: (head, page, (x0, y0, x1, y1), width in game px -- the footprint's east-west across in js/hex.js, at 9.6 px a foot)
PROPS = {
    'hx_spiral': (3, 1, (1236, 285, 1512, 602), 6.0),          # (HX.SPIRALS: a 6 ft disc, its steps and newel)
    'hx_post': (3, 1, (1044, 290, 1172, 592), 3.4),            # (HX.LOGS: 3 ft round, its stone footing a little wider)
    'hx_box': (3, 1, (544, 727, 753, 901), 2.2),               # (the contraband box on the east guard station)
    'hx_trestle': (3, 1, (816, 665, 1228, 948), 5.0),          # (HX.BOARDS: the north notches' tables, 5 by 3 ft)
    'hx_slate': (3, 1, (1271, 659, 1494, 923), 4.0),           # (Korvin's odds slate, 4 ft)
    'hx_felt': (4, 1, (52, 12, 270, 225), 5.2),                # (HX.FELT: 2.6 ft round)
    'hx_stool': (4, 1, (394, 57, 499, 186), 1.6),              # (the stools round them, 0.7 ft round)
    'hx_chair_fine': (4, 1, (535, 490, 658, 688), 2.2),        # (Vair's empty chair, 2 ft)
    'hx_chair_council': (4, 1, (778, 517, 903, 685), 1.8),     # (the council's chairs, 1.6 ft)
    'hx_desk': (4, 1, (1011, 505, 1266, 699), 5.0),            # (Urtusk's desk, 5 by 2.5 ft)
    'hx_table_council': (4, 1, (33, 746, 1279, 941), 18.0),   # (the council's long table, 18 by 4 ft)
    'hx_strongbox': (4, 1, (81, 970, 244, 1134), 2.5),         # (Urtusk's strongbox)
    'hx_chest': (4, 1, (759, 985, 961, 1134), 3.0),            # (the Armory's chest)
}
DOORS = {'hx_doors_south': (5, 1, (35, 927, 213, 1079))}      # (the south tip's double doors, closed: js/topview.js hexCanvas reads its pixels)


FILLSHAVE = 9     # source px off each side of a fill: the art desk drew each tile as a bevelled block, lit on its left and top, dark on its right (a seam every 48 px)
WOOD = ['skin', 'gold', 'fire', 'red', 'orc', 'moss', 'violet', 'blue', 'glow', 'accent']   # (the ramps a wood fill's snap leaves out: its tans had gone to the skin
# ramp, a pink floor, and the upper tier's to the gold, a second sand beside the sand -- so the boards keep to leather and stone, the code's own woods)


def cut_fill(e, w=T, h=T, sub=None, avoid=None, flat=False):
    """TT.cut_ground with ramps left out of the snap; `flat`: the tile's own light-to-dark shading across it taken out (the council's boards: each tile
    drawn lit at one corner and dark at the other, which tiles as a checker), its grain kept -- each channel less its blur at a sixteenth of the tile (a plank's own tone too), plus its mean"""
    path, (x, y, ww, hh), _ = e
    a, bg = TT.page(path)
    win = a[y:y + hh, x:x + ww]
    r0, r1, c0, c1 = TT.ground_box(win, bg)
    t = win[r0 + FILLSHAVE:r1 - FILLSHAVE, c0 + FILLSHAVE:c1 - FILLSHAVE]
    if sub:
        H0, W0 = t.shape[:2]; t = t[int(sub[1] * H0):int(sub[3] * H0), int(sub[0] * W0):int(sub[2] * W0)]
    rgb, _ = TT.box_down(t, w, h)
    if flat:
        from scipy import ndimage
        lo = np.stack([ndimage.gaussian_filter(rgb[..., k], w / 16.0, mode='wrap') for k in range(3)], -1)
        rgb = np.clip(rgb - lo + rgb.reshape(-1, 3).mean(0), 0, 255)
    out = np.zeros((h, w, 4), dtype=np.uint8); out[..., :3] = TT.PX.snap(np.clip(rgb / 255.0, 0, 1).astype(np.float32), avoid); out[..., 3] = 255
    return out


def cut(check=False):
    A = TT.Atlas(512)
    for (h, p), (cols, rows, names) in FILLS.items():
        for r, (y0, y1) in enumerate(rows):
            for c, (x0, x1) in enumerate(cols):
                e = (page(h, p), (x0, y0, x1 - x0, y1 - y0), (1, 1))
                wood = None if names[r].startswith('hx_rug') else WOOD
                if names[r] == 'hx_lip':
                    img = cut_fill(e, w=T, h=32, sub=(0, 0, 1, 0.6), avoid=wood)   # (the boards only: the art desk drew a riser under them, which the code draws)
                else:
                    img = cut_fill(e, avoid=wood, flat=names[r] == 'hx_council')
                A.add(names[r], img, T // 2, img.shape[0])
            A.newrow()
    for name, (h, p, (x0, y0, x1, y1), ft) in PROPS.items():
        img, sc = TT.cut_prop((page(h, p), (x0, y0, x1 - x0, y1 - y0), (1, 1)), width=max(6, int(round(ft * PXFT))))
        A.add(name, img, img.shape[1] // 2, img.shape[0])
    A.newrow()
    for name, (h, p, (x0, y0, x1, y1)) in DOORS.items():
        e = (page(h, p), (x0, y0, x1 - x0, y1 - y0), (1, 1))
        img, sc = TT.cut_prop(e, width=60, outline=False)
        A.add(name, img, img.shape[1] // 2, img.shape[0])
    A.write('hextiles_p1', 'deep16/_src/hextiles/ART-115/ (the art desk\'s ART-115, 10-27, best available: the Hex inside and out), cut by tools/hextiles-sheet.py',
            {'door': 'roam:hex'}, check)
    for k, v in A.tiles.items():
        print('  %-18s %d x %s' % (k, len(v), ' '.join('%dx%d' % (b[2], b[3]) for b in v[:1])))


if __name__ == '__main__':
    cut('check' in sys.argv[1:])

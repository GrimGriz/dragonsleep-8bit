"""DEEP16 pipeline 2 (generated art): the werewolf in its hybrid shape, a Black Mountain cleric -> deep16/art/werewolf_p1, all eight facings.

    python tools/werewolf-sheet.py            (writes deep16/art/werewolf_p1.png/.json)
    python tools/werewolf-sheet.py check      (also deep16/art-src/werewolf/werewolf_p1-review.png: every row of every drawn view at 3x)

Asked in art-wanted section 43 (ART-130, 11-11, the Coldridge route's random encounters, "the pack, by night"); cut 11-11 by the owlbear cutter on the
desk's relay of Griz's "Cut the werewolf". The art desk's ART-130-WEREWOLF-SOURCES, sorted to deep16/_src/werewolf/ART-130/ (the zip beside it): a page a
view and row under raw/ -- HEAD 1 SE (its Identity page not cut), 2 NE, 3 S, 4 E, 5 N -- Idle 4, Walk 8, Bite 6, Claws 6, Shift-from-Man 8, Shift-to-Wolf 8,
Flinch 4, Fall 6 (it ends as the priest in the torn robe), Prone 1 (the living hybrid on his side). Its FRAME-MAP.csv gives each drawing's cell and figure
box: a window here is the figure box padded PAD a side, inside its cell. Cut by tools/doran-sheet.py's cutter (the navy flooded from the window's edges, the
body and what is near it), no lettering pass.

Scale: every PAGE was drawn at its own size (the Idle page's hybrid about 500 px tall, the others 330 to 420), so each page is brought to the Idle by its
own standing hybrid -- Walk by its median height, Bite, Claws, Flinch and Fall by their frame 1, Shift-from-Man by its frame 8 (the hybrid), Shift-to-Wolf by
its frame 1 -- and the Prone page (one drawing) by its diagonal against Fall 5's on the Fall page. The Idle stands TALL a view. Standing frames stand on
their lowest row by their top's middle; Fall 4-6 and the Prone by the whole body's middle. Facings (RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors.

Rows: idle 4; walk 8; bite 6 and claws 6 (`release` 2: your frame 3 -- js/battle.js plays the row named for the attack); flinch 4; hurt 6 (Fall, held on
6: the priest); prone 2 (Fall 3, then the Prone); getup 3 (the Prone, Fall 3, Fall 2). HELD, cut and not played (no foe changes shape on the grid yet):
shift 8 (Shift-from-Man 1-7, then Idle 1 as the art desk's endpoint asks) and towolf 7 (Idle 1, then Shift-to-Wolf 2-7; its frame 8 is wolf_p1's own
Idle 1 cell, to be joined when the shift is built).
"""
import csv, importlib.util, json, math, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doransheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)
DS.FH, DS.AY = 76, 70           # (a tall hunched Medium figure: the hybrid 56 px, a raised claw above it)

_W = os.path.join(DS.pix.SRC, 'werewolf', 'ART-130')
PAD = 10
VIEWS = ['SE', 'NE', 'S', 'E', 'N']
ACT = {'Idle': 'idle', 'Walk': 'walk', 'Bite': 'bite', 'Claws': 'claws', 'Flinch': 'flinch', 'Fall': 'fall', 'Prone': 'prone',
       'Shift-from-Man': 'man', 'Shift-to-Wolf': 'wolf'}

WIN, BOX = {}, {}
for r in csv.DictReader(open(os.path.join(_W, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
    a = ACT.get(r['action_or_pose'])
    if not a:
        continue
    c = [int(r[k]) for k in ('cell_x0', 'cell_y0', 'cell_x1', 'cell_y1')]; f = [int(r[k]) for k in ('figure_x0', 'figure_y0', 'figure_x1', 'figure_y1')]
    key = (a, int(r['frame']) - 1, r['facing'])
    WIN[key] = (os.path.basename(r['source_file']), (max(c[0], f[0] - PAD), max(c[1], f[1] - PAD), min(c[2], f[2] + PAD), min(c[3], f[3] + PAD)), None)
    BOX[key] = (f[2] - f[0], f[3] - f[1])


def med(xs):
    xs = sorted(xs); n = len(xs); return xs[n // 2] if n % 2 else 0.5 * (xs[n // 2 - 1] + xs[n // 2])


H = lambda a, i, v: BOX[(a, i, v)][1]
D_ = lambda a, i, v: math.hypot(*BOX[(a, i, v)])
IDLE = {v: med([H('idle', i, v) for i in range(4)]) for v in VIEWS}
FIT = {'walk': {v: IDLE[v] / med([H('walk', i, v) for i in range(8)]) for v in VIEWS}}
for a, i in [('bite', 0), ('claws', 0), ('flinch', 0), ('fall', 0), ('man', 7), ('wolf', 0)]:
    FIT[a] = {v: IDLE[v] / H(a, i, v) for v in VIEWS}
FIT['prone'] = {v: FIT['fall'][v] * D_('fall', 4, v) / D_('prone', 0, v) for v in VIEWS}

SOURCES = {'p': dict(folder=os.path.join(_W, 'raw'), windows=WIN, letters=False)}
GROUPS = {('p', 'ref'): (['ref'], [('idle', i) for i in range(4)])}
TIE = {('p', 'idle'): ('p', 'ref', {v: 1.0 for v in VIEWS})}
TIE.update({('p', a): ('p', 'ref', FIT[a]) for a in FIT})
GROUND = {('p', 'fall', 3), ('p', 'fall', 4), ('p', 'fall', 5), ('p', 'prone', 0)}
TALL = 56                       # (sole to ear tip: "a head taller than a man" -- the town figures 47 to 50)
AVOID = ['red']                 # (the yellow eyes keep the fire ramp)
LOOKS = {
    'werewolf_p1': dict(rows=[('idle', 5, [('p', 'idle', i) for i in range(4)]), ('walk', 9, [('p', 'walk', i) for i in range(8)]),
                              ('bite', 10, [('p', 'bite', i) for i in range(6)]), ('claws', 10, [('p', 'claws', i) for i in range(6)]),
                              ('flinch', 12, [('p', 'flinch', i) for i in range(4)]), ('hurt', 8, [('p', 'fall', i) for i in range(6)]),
                              ('prone', 6, [('p', 'fall', 2), ('p', 'prone', 0)]),
                              ('getup', 6, [('p', 'prone', 0), ('p', 'fall', 2), ('p', 'fall', 1)]),
                              ('shift', 8, [('p', 'man', i) for i in range(7)] + [('p', 'idle', 0)]),
                              ('towolf', 8, [('p', 'idle', 0)] + [('p', 'wolf', i) for i in range(1, 7)])],
                        release={'bite': 2, 'claws': 2},
                        hold=['walk: SE, NE and E repeat the lead and passing poses in the second half -- a half-cycle twice, not an alternating stride (the art desk\'s own notes; held for a redraw there, cut as drawn here)',
                              'N prone a little oblique and the N fallen priest diagonal; S Bite and N Bite read as a dip of the head and shoulders (the art desk\'s own notes)',
                              'shift and towolf cut, HELD: no foe changes shape on the grid yet; towolf ends one frame short of wolf_p1\'s own idle cell'],
                        source='drawn by the art desk (ART-130-WEREWOLF-SOURCES, 11-11: art-wanted section 43), cut by tools/werewolf-sheet.py; SW W NW mirrored -- '
                               'the SRD 5.1 Werewolf in its hybrid form: deep16/data/foes.js werewolf'),
}
WEREWOLF = dict(SOURCES=SOURCES, GROUPS=GROUPS, TIE=TIE, GROUND=GROUND, TALL=TALL, AVOID=AVOID, LOOKS=LOOKS, NAME='Werewolf', SRCDIR='werewolf')

if __name__ == '__main__':
    print('fits:', {a: {v: round(x, 3) for v, x in f.items()} for a, f in FIT.items()})
    DS.cut(WEREWOLF, 'werewolf_p1')
    p = os.path.join(ROOT, 'deep16', 'art', 'werewolf_p1.json'); m = json.load(open(p, encoding='utf-8'))
    for r in ('shift', 'towolf'):
        m['anims'][r]['held'] = True    # (cut, not played: js/show.js SH.wanted leaves a held row out)
    with open(p, 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(m, f_, indent=1)

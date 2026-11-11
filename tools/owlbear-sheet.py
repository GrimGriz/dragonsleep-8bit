"""DEEP16 pipeline 2 (generated art): the owlbear, the SRD's Large monstrosity -> deep16/art/owlbear_p1, all eight facings.

    python tools/owlbear-sheet.py            (writes deep16/art/owlbear_p1.png/.json)
    python tools/owlbear-sheet.py check      (also deep16/art-src/owlbear/owlbear_p1-review.png: every row of every drawn view at 3x)

Asked in art-wanted section 46 (ART-133, 11-11, the Coldridge route's random encounters: "add owlbear"); cut 11-11 by the owlbear cutter on the desk's
relay of Griz's "have an opus seat start on the owlbear in fresh please". The art desk's ART-133-COLDRIDGE-OWLBEAR, sorted to deep16/_src/owlbear/ART-133/
(the zip beside it): a page a view and row -- HEAD 1 SE (its P01 the identity plate, not cut), 2 NE, 3 S, 4 E, 5 N -- Idle 6, Walk 8, Beak 6, Claws 6,
Flinch 4, Fall 6, Prone 1 (each Prone page the Fall's frame 6 copied, PRONE-PROVENANCE.json). Its FRAME-MAP.json gives every frame's region on its page
and a warm-pixel crop, and a label box where a numeral sits close over a tall wind-up: a window here is the crop padded PAD a side, inside its region,
its top below the label box. Cut by tools/doran-sheet.py's cutter (the navy flooded from the window's edges, the body and what is near it), no lettering
pass. ONE scale for every view (the art desk drew every sheet at one scale -- the S stands taller than the E because it is drawn so): SE Idle to TALL.
Two rows were drawn at another size and are brought to the idle's by their crops (width and height averaged, a view each): the Walk about 0.9 of it,
the Flinch about 1.25 (the art desk's REVIEW: "Flinch is drawn larger than Idle. Match stable body dimensions before cutting"). A standing frame stands
on its lowest row by its top's middle; a lying one (Fall 4-6, Prone) by its whole body's middle. Facings (RULED 10-14): S SE E NE N as drawn, SW W NW
their mirrors.

Rows: idle 6; walk 8; beak 6 (`release` 2: frame 3 the strike -- js/battle.js plays the row named for the attack, Beak); claws 6 (`release` 2: the rake);
flinch 4; hurt 6 (Fall, held on 6); prone 3 (Fall 4-5 then Prone 1: on its side -- js/sprites.js S.proneRow); getup 3 (Fall 5, 4, 3: the fall run back).
"""
import importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doransheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)
DS.FH, DS.AY = 100, 90          # (a Large beast's cell: the giant boar's, giantboar_p2 -- 100 tall, the ground at 90)

_O = os.path.join(DS.pix.SRC, 'owlbear', 'ART-133')
FMAP = json.load(open(os.path.join(_O, 'FRAME-MAP.json'), encoding='utf-8'))
PAD = 12
VIEWS = ['SE', 'NE', 'S', 'E', 'N']


def windows():
    out, dims = {}, {}
    for p in FMAP['pages']:
        act = p['action'].lower()
        if act == 'identity':
            continue
        v = p['facing'].split()[0]
        for f in p['frames']:
            rx0, ry0, rx1, ry1 = f['region']; x0, y0, x1, y1 = f['suggested_crop']
            top = y0 - PAD
            if 'exclude_source_label_box' in f:
                top = max(top, f['exclude_source_label_box'][3] + 1)
            box = (max(rx0, x0 - PAD), max(ry0, top), min(rx1, x1 + PAD), min(ry1, y1 + PAD))
            out[(act, f['frame'] - 1, v)] = (p['page'], box, None)
            dims[(act, f['frame'] - 1, v)] = (x1 - x0, y1 - y0)
    return out, dims


WIN, DIMS = windows()


def med(xs):
    xs = sorted(xs); n = len(xs); return xs[n // 2] if n % 2 else 0.5 * (xs[n // 2 - 1] + xs[n // 2])


def size(act, v, idx):
    return med([DIMS[(act, i, v)][0] for i in idx]), med([DIMS[(act, i, v)][1] for i in idx])


# one scale for every view: each view's `ref` (its idle by height) times its idle's height over the SE idle's -> TALL / the SE idle's height everywhere
IDLE = {v: size('idle', v, range(6)) for v in VIEWS}
ONE = {v: IDLE[v][1] / IDLE['SE'][1] for v in VIEWS}
WALK = {v: ONE[v] * 0.5 * (IDLE[v][0] / size('walk', v, range(8))[0] + IDLE[v][1] / size('walk', v, range(8))[1]) for v in VIEWS}
FLINCH = {v: ONE[v] * 0.5 * (IDLE[v][0] / size('flinch', v, range(4))[0] + IDLE[v][1] / size('flinch', v, range(4))[1]) for v in VIEWS}

SOURCES = {'p': dict(folder=os.path.join(_O, 'sources'), windows=WIN, letters=False)}
GROUPS = {('p', 'ref'): (['ref'], [('idle', i) for i in range(6)])}
TIE = {('p', a): ('p', 'ref', ONE) for a in ['idle', 'beak', 'claws', 'fall', 'prone']}
TIE[('p', 'walk')] = ('p', 'ref', WALK)
TIE[('p', 'flinch')] = ('p', 'ref', FLINCH)
GROUND = {('p', 'fall', 3), ('p', 'fall', 4), ('p', 'fall', 5), ('p', 'prone', 0)}
TALL = 54                       # (the SE idle, sole to the crown's feathers: bigger than the giant boar, giantboar_p2's 50, as the SRD's Large owlbear is)
AVOID = ['red']                 # (the orange eyes keep the fire ramp; no red in it)
LOOKS = {
    'owlbear_p1': dict(rows=[('idle', 5, [('p', 'idle', i) for i in range(6)]), ('walk', 8, [('p', 'walk', i) for i in range(8)]),
                             ('beak', 10, [('p', 'beak', i) for i in range(6)]), ('claws', 10, [('p', 'claws', i) for i in range(6)]),
                             ('flinch', 12, [('p', 'flinch', i) for i in range(4)]), ('hurt', 8, [('p', 'fall', i) for i in range(6)]),
                             ('prone', 8, [('p', 'fall', 3), ('p', 'fall', 4), ('p', 'prone', 0)]),
                             ('getup', 8, [('p', 'fall', 4), ('p', 'fall', 3), ('p', 'fall', 2)])],
                       release={'beak': 2, 'claws': 2},
                       hold=['the Claws row rakes from all fours and a half-rear, not the full rear on the hind legs asked; the SE and NE far legs mostly hidden',
                             'walk: the far hind lift and plant hard to tell apart in SE, the forepaw lifts alike in NE 3 and 7, the N forefeet hidden behind the rump (the art desk\'s own notes)',
                             'flinch drawn about a quarter larger than the idle, brought down to it here; getup is the fall run back'],
                       source='drawn by the art desk (ART-133-COLDRIDGE-OWLBEAR, 11-11: art-wanted section 46), cut by tools/owlbear-sheet.py; SW W NW mirrored -- '
                              'the SRD 5.1 Owlbear: deep16/data/foes.js owlbear'),
}
OWLBEAR = dict(SOURCES=SOURCES, GROUPS=GROUPS, TIE=TIE, GROUND=GROUND, TALL=TALL, AVOID=AVOID, LOOKS=LOOKS, NAME='Owlbear', SRCDIR='owlbear')

if __name__ == '__main__':
    print('fits: one %s\n  walk %s\n  flinch %s' % ({v: round(x, 3) for v, x in ONE.items()}, {v: round(x, 3) for v, x in WALK.items()}, {v: round(x, 3) for v, x in FLINCH.items()}))
    DS.cut(OWLBEAR, 'owlbear_p1')

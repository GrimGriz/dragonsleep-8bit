"""DEEP16 pipeline 2 (generated art): the griffon, the SRD's Large monstrosity, the Coldridge route's flier by day -> deep16/art/griffon_p1, all eight facings.

    python tools/griffon-sheet.py            (writes deep16/art/griffon_p1.png/.json)
    python tools/griffon-sheet.py check      (also deep16/art-src/ART-131-GRIFFON/griffon_p1-review.png: every row of every facing at 3x)

Asked in art-wanted section 44 (ART-131, 11-11, the Coldridge route's random encounters); cut 11-12 by cutter-pyro on the lanes desk's relay of Griz's
"pyro first pieces (and a griffon) are in fresh". The art desk's ART-131-COLDRIDGE-GRIFFON-SOURCE-SHEETS, sorted out of Fresh to deep16/_src/ART-131-GRIFFON/
(the zip in _src/art-desk/received-2026-11-12/): a page a view and action -- HEAD 1 SE (its PAGE 1 the identity plate, not cut), 2 the rear NE, 3 S, 4 E,
5 N -- Idle 6, Walk 8, Fly 6, Beak 6, Talons 6, Flinch 4, Fall 6, Prone 2; 225 drawings, none missing. Its FRAME-MAP.json gives each drawing's bounding box
on its page (the main foreground component); a window here is that box padded PAD a side (the printed frame numbers sit ~25 px under the drawings, outside it).
Cut by tools/doran-sheet.py's cutter (the navy flooded from the window's edges, the body and what is near it), no lettering pass.

Scale: ONE scale for every view, as the owlbear's (the art desk drew the 1536 pages at one scale -- the N stands taller than the SE because it is drawn so):
SE Idle to TALL, the manticore's standing height (the art desk's "58 px standing height target", the manticore_p1 frame it shares: 160 wide, the ground at 90).
Pages drawn at another size are brought to the idle by their boxes, a view each: the Walk (E's on its own 1774 page) by width and height averaged against
the Idle; the Flinch (the one-band 2172 pages, drawn larger) by its frames 1 and 4 (folded, standing) against the Idle; the Prone by its frame 1's width to
the Fall's frame 6 (the art desk: "Match Fall 6 to Prone 1 by shoulder and hip"). A standing frame stands on its lowest row by its top's middle; a lying
one (Fall 4-6, Prone 1) by its whole body's middle. The Fly keeps its band's vertical offsets (`LIFT`: each frame stands as far above its band's lowest
drawing as on the page -- the wing extremes rise and fall, the body steady), the band's lowest at the ground line: the grid lifts a flier aloft itself.
Facings (RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors.

Rows: idle 6; walk 8; fly 6 (played in place of idle and walk while the griffon is aloft -- js/ui.js UI.aloftRow); beak 6 and claws 6 (the Talons page;
`release` 2: frame 3 the strike -- js/battle.js plays the row named for the attack); flinch 4; hurt 6 (Fall, held on 6: on its side, a wing spread);
prone 3 (Fall 5, 6, then Prone 1); getup 2 (Prone 1, 2: rolling up onto its feet).
"""
import importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doransheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)
DS.FH, DS.AY = 102, 90          # (the manticore's cell, manticore_p1: 102 tall, the ground at 90 -- the griffon shares its frame)

_G = os.path.join(DS.pix.SRC, 'ART-131-GRIFFON')
FMAP = json.load(open(os.path.join(_G, 'FRAME-MAP.json'), encoding='utf-8')) if os.path.isdir(_G) else {'pages': []}
PAD = 6
VIEWS = ['SE', 'NE', 'S', 'E', 'N']
ACT = {'Idle': 'idle', 'Walk': 'walk', 'Fly': 'fly', 'Beak': 'beak', 'Talons': 'talons', 'Flinch': 'flinch', 'Fall': 'fall', 'Prone': 'prone'}
COUNT = {'idle': 6, 'walk': 8, 'fly': 6, 'beak': 6, 'talons': 6, 'flinch': 4, 'fall': 6, 'prone': 2}


def windows():
    out, dims = {}, {}
    for p in FMAP['pages']:
        if p['action'] == 'Identity':
            continue
        act, v = ACT[p['action']], p['facing']
        nums = [f['number'] for f in p['frames']]
        assert nums == list(range(1, COUNT[act] + 1)), (p['file'], nums)           # (every number once, none skipped, the asked count)
        band = {}
        for b in p['printed_bands_top_to_bottom']:
            fl = max(f['source_bbox_xyxy'][3] for f in p['frames'] if f['number'] in b['frame_numbers_left_to_right'])
            for n in b['frame_numbers_left_to_right']:
                band[n] = fl
        W, H = p['canvas_wh']
        for f in p['frames']:
            x0, y0, x1, y1 = f['source_bbox_xyxy']
            box = (max(0, x0 - PAD), max(0, y0 - PAD), min(W, x1 + PAD), min(H, y1 + PAD))
            out[(act, f['number'] - 1, v)] = (p['file'], box, None, band[f['number']])
            dims[(act, f['number'] - 1, v)] = (x1 - x0, y1 - y0)
    return out, dims


WIN, DIMS = windows()


def med(xs):
    xs = sorted(xs); n = len(xs); return xs[n // 2] if n % 2 else 0.5 * (xs[n // 2 - 1] + xs[n // 2])


def size(act, v, idx):
    return med([DIMS[(act, i, v)][0] for i in idx]), med([DIMS[(act, i, v)][1] for i in idx])


def fit(act, idx):
    return {v: ONE[v] * 0.5 * (IDLE[v][0] / size(act, v, idx)[0] + IDLE[v][1] / size(act, v, idx)[1]) for v in VIEWS}


if DIMS:
    IDLE = {v: size('idle', v, range(6)) for v in VIEWS}
    ONE = {v: IDLE[v][1] / IDLE['SE'][1] for v in VIEWS}       # (the view's idle group scales it to TALL; times this, every view at the SE idle's scale)
    WALK, FLINCH = fit('walk', range(8)), fit('flinch', [0, 3])
    PRONE = {v: ONE[v] * DIMS[('fall', 5, v)][0] / float(DIMS[('prone', 0, v)][0]) for v in VIEWS}
else:
    ONE = WALK = FLINCH = PRONE = {v: 1.0 for v in VIEWS}

SOURCES = {'p': dict(folder=_G, windows=WIN, letters=False)}
GROUPS = {('p', 'ref'): (['ref'], [('idle', i) for i in range(6)])}
TIE = {('p', a): ('p', 'ref', ONE) for a in ['idle', 'fly', 'beak', 'talons', 'fall']}
TIE[('p', 'walk')] = ('p', 'ref', WALK)
TIE[('p', 'flinch')] = ('p', 'ref', FLINCH)
TIE[('p', 'prone')] = ('p', 'ref', PRONE)
GROUND = {('p', 'fall', 3), ('p', 'fall', 4), ('p', 'fall', 5), ('p', 'prone', 0)}
LIFT = ('fly',)
TALL = 58                       # (the SE idle, sole to the crest: the manticore's standing height, the art desk's target)
AVOID = ['red']                 # (golden-brown feathers and a tawny lion: no red in it)
LOOKS = {
    'griffon_p1': dict(rows=[('idle', 6, [('p', 'idle', i) for i in range(6)]), ('walk', 8, [('p', 'walk', i) for i in range(8)]),
                             ('fly', 10, [('p', 'fly', i) for i in range(6)]),
                             ('beak', 10, [('p', 'beak', i) for i in range(6)]), ('claws', 10, [('p', 'talons', i) for i in range(6)]),
                             ('flinch', 12, [('p', 'flinch', i) for i in range(4)]), ('hurt', 8, [('p', 'fall', i) for i in range(6)]),
                             ('prone', 8, [('p', 'fall', 4), ('p', 'fall', 5), ('p', 'prone', 0)]),
                             ('getup', 6, [('p', 'prone', 0), ('p', 'prone', 1)])],
                       release={'beak': 2, 'claws': 2},
                       hold=['walk: SE leans toward profile in some poses, its rear-paw contacts subtle; the rear NE four-beat gait to check against SE (the art desk\'s own notes)',
                             'flinch drawn larger than the idle on its one-band page, brought down to it here; prone 1 matched to fall 6 by width',
                             'N talons: the front talon emerges high on frame 3 (the art desk\'s own note)'],
                       source='drawn by the art desk (ART-131-COLDRIDGE-GRIFFON-SOURCE-SHEETS, 11-12: art-wanted section 44), cut by tools/griffon-sheet.py; SW W NW mirrored -- '
                              'the SRD 5.1 Griffon: deep16/data/foes.js griffon'),
}
GRIFFON = dict(SOURCES=SOURCES, GROUPS=GROUPS, TIE=TIE, GROUND=GROUND, LIFT=LIFT, TALL=TALL, AVOID=AVOID, LOOKS=LOOKS, NAME='Griffon', SRCDIR='ART-131-GRIFFON')

if __name__ == '__main__':
    r = lambda d: {v: round(x, 3) for v, x in d.items()}
    print('fits: one %s\n  walk %s\n  flinch %s\n  prone %s' % (r(ONE), r(WALK), r(FLINCH), r(PRONE)))
    DS.cut(GRIFFON, 'griffon_p1')

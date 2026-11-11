"""DEEP16 pipeline 2 (generated art): General Grimlock Grim's world figure -> deep16/art/generalgrim_p1, all eight facings.

    python tools/generalgrim-sheet.py            (writes deep16/art/generalgrim_p1.png/.json)
    python tools/generalgrim-sheet.py check      (also deep16/art-src/generalgrim/generalgrim_p1-review.png: every row of every drawn view at 3x)

The art desk's GENERAL-GRIM-WORLD packages, cut 11-10 by the longbow cutter (its third job) on the lanes desk's queue (Griz, 11-10: "they can churn
through fresh one at a time as they complete at your discretion as to next cut"). General Grimlock Grim, of Griz's Beholda stream table, the
General of the road's redraft (the story build lane's M, the General's cut: his fight, his block and his words are that build's, later -- no foe wears
this sheet yet). Sorted to deep16/_src/generalgrim/ (his portraits, the other cutter's, beside them in PORTRAITS-*-1110/):
  WORLD-B1-SE-1110, WORLD-B2-1110, WORLD-B3-1110   the identity page (S SE E NE N, read only) and two pages a view: P1 Idle 4, Walk 8; P2 Run 8,
                                                   Flinch 4, Fall 4, Prone 1. Bare hands; rank teeth on his anatomical left.
  WORLD-ACTIONS-SE-1110, -OTHER-FACINGS-1110       Right Claw, Left Claw, Bite, Hand Weave, Point, four each (SE on two pages, melee and cast; the
                                                   rest one page a view): contact on claw frame 2-3 and Bite 3, the release on Point 3.
Each FRAME-MAP.json gives every drawing's review window by file and action (the view read off the file's name), padded PAD here. Cut by
tools/doran-sheet.py's cutter (the navy flooded from each window's edges, the page's lettering dropped, the body and what lies by it kept). One scale a
view on each page set by its upright frames to TALL: the world pages' P1 by the Idle, their P2 (drawn smaller) by Flinch 1 and 4 and the Run's grounded frames, the melee rows by the claws' 1 and 4, the cast rows by Hand Weave 1
and Point 1 and 4 (the SE cast page is drawn nearer than the rest). A standing frame stands on its lowest row by its torso's middle, one on the
ground (Fall 3-4, Prone 1) by its whole body's middle; the Run keeps its airborne frames' lift over their band's floor (LIFT: the art desk's
"preserve vertical clearance on airborne frames"). Facings (RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors (the rank teeth change side
with the mirror).

Rows: idle 4; walk 8; run 8; attack 4 (Right Claw, `release` 2: the reach on frame 3); attack2 4 (Left Claw, `release` 2 -- battle.js plays it for
a turn's second blow); bite 4 (`release` 2: the jaws close on frame 3 -- a blow named Bite plays it); cast 4 (Point, `release` 2 -- magic.js plays
`cast` for a spell aimed at someone); castup 4 (Hand Weave -- magic.js plays `castup` for one aimed at no one creature); flinch 4; hurt 4 (Fall, he
dies lying); prone 4 (Fall 2-4 then Prone 1: js/sprites.js S.proneRow). HELD (meta `held`, the show leaves it out): the run, which no gait on the grid
plays yet. His block (11-10, data/foes.js generalgrim, his class build) plays the rest: claw, claw, bite on attack, attack2 and bite, his spells on cast and castup.
"""
import importlib.util, json, os, re, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doransheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)

_G = os.path.join(DS.pix.SRC, 'generalgrim')
PAD = 4
TOL = 12        # (the navy's reach: his charcoal trousers sit 12 to 31 off the page's navy, inside the house's 30 -- at 30 the P2 pages' legs went, the boots afloat)
SHADOW = 0.15   # (the baked ground shadow under the boots is taken off within the body's lowest 15%, and nothing is kept below the soles)

_figure0 = DS.figure
def figure(a, shadow=False, drop=None, below=False, tol=None):
    """doran-sheet.py's figure at TOL, then the art desk's baked ground shadow off: a dark bluish pixel (that file's own shadow test) in the body's
    lowest SHADOW of its height or under the lowest warm row (the boots), and the body chosen again -- the biggest piece and what lies near it or is big"""
    m = _figure0(a, False, drop, below, TOL)
    rows = np.where(m.any(1))[0]
    warm = m & (a[..., 0] > a[..., 2] + 8)
    foot = int(np.where(warm.any(1))[0].max()) if warm.any() else int(rows[-1])
    br = a[..., 2] - a[..., 0]
    sh = (a.max(-1) < 38) & (br >= 6) & (br <= 28) & (a[..., 1] <= a[..., 2])
    sh[:foot - int((foot - rows[0]) * SHADOW)] = False
    gap = (a.max(-1) < 45) & (br >= 10) & (a[..., 1] <= a[..., 2])   # (the navy's shade seen between his legs: bluer than his outline or trousers ever are)
    gap[:rows[0] + (rows[-1] - rows[0]) // 2] = False
    m = m & ~sh & ~gap
    m[foot + 2:] = False
    from scipy import ndimage
    fl, fn = ndimage.label(m, structure=np.ones((3, 3)))
    if not fn:
        raise SystemExit('nothing drawn in the window')
    sz = ndimage.sum(m, fl, range(1, fn + 1)); big = int(np.argmax(sz)) + 1
    reach = ndimage.binary_dilation(fl == big, iterations=DS.NEAR)
    keep = [i + 1 for i in range(fn) if i + 1 == big or sz[i] >= DS.BIG * sz[big - 1] or (reach & (fl == i + 1)).any()]
    return np.isin(fl, keep)
DS.figure = figure
B = ['WORLD-B1-SE-1110', 'WORLD-B2-1110', 'WORLD-B3-1110']
ACT = ['WORLD-ACTIONS-SE-1110', 'WORLD-ACTIONS-OTHER-FACINGS-1110']


def map_windows(folders):
    """{(action, i0, view): (folder/file, box, None)} from the art desk's FRAME-MAP.json files: {file: {groups|rows: {Action: [[x0, y0, x1, y1], ...]}}}
    -- the boxes left to right, top to bottom, as the frames number; the view from the file's name (the identity page has none: left out)"""
    out = {}
    for d in folders:
        m = json.load(open(os.path.join(_G, d, 'FRAME-MAP.json'), encoding='utf-8'))
        for fn, e in m.items():
            v = re.match(r'GENERAL-GRIM-WORLD-(SE|NE|S|E|N)-', fn)
            if not isinstance(e, dict) or not v:
                continue
            for act, boxes in (e.get('groups') or e.get('rows') or {}).items():
                for i, (x0, y0, x1, y1) in enumerate(sorted(boxes, key=lambda b: (b[1] // 40, b[0]))):
                    out[(act.lower(), i, v.group(1))] = (os.path.join(d, fn), (x0 - PAD, y0 - PAD, x1 + PAD, y1 + PAD), None)
    return out


def run_floors(win):
    """the Run's band floors: each band (its windows' top) the lowest of its frames' lowest rows -- a grounded stride's sole; an airborne frame's
    lowest row stands above it by its lift (doran-sheet.py LIFT reads it from the window's 4th element)"""
    lows, pages = {}, {}
    for key, (fn, (x0, y0, x1, y1), _) in win.items():
        if key[0] != 'run':
            continue
        if fn not in pages:
            pg = np.asarray(Image.open(os.path.join(_G, fn)).convert('RGB')).astype(np.float32)
            pages[fn] = (pg, DS.letters(pg))
        pg, lt = pages[fn]
        a = pg[max(0, y0):y1, max(0, x0):x1]
        m = DS.figure(a, False, lt[max(0, y0):y1, max(0, x0):x1])
        lows[key] = max(0, y0) + int(np.where(m.any(1))[0][-1]) + 1
    band = {}
    for key, low in lows.items():
        b = (key[2], win[key][0], win[key][1][1])
        band[b] = max(band.get(b, 0), low)
    for key in lows:
        fn, box, _ = win[key]
        win[key] = (fn, box, None, band[(key[2], fn, box[1])])
    return win


WB = run_floors(map_windows(B))
WA = map_windows(ACT)
SOURCES = {'b': dict(folder=_G, windows=WB), 'act': dict(folder=_G, windows=WA)}
GROUPS = {('b', 'p1'): (['idle', 'walk'], [('idle', i) for i in range(4)]),
          ('b', 'p2'): (['run', 'flinch', 'fall', 'prone'], [('flinch', 0), ('flinch', 3)] + [('run', i) for i in (0, 1, 3, 4, 5, 7)]),
          # (P2 is drawn at 0.50-0.58 of P1's height: its own scale by its upright frames -- Flinch 1 and 4 alone made the South run 59-60 against the
          # idle's 52, the South flinch drawn crouched; with the grounded run frames a stride stands as tall as he does, the braced flinch a little lower)
          ('act', 'melee'): (['right claw', 'left claw', 'bite'], [('right claw', 0), ('left claw', 0), ('right claw', 3), ('left claw', 3)]),
          ('act', 'cast'): (['hand weave', 'point'], [('hand weave', 0), ('point', 0), ('point', 3)])}
GROUND = {('b', 'fall', 2), ('b', 'fall', 3), ('b', 'prone', 0)}
LIFT = ('run',)
TALL = 50                      # (sole to crown: a grimlock stood straight -- grimlock_p2's idle 48-54 with the outline, the house's men 49-53)
AVOID = ['red', 'fire']        # (his grey-brown skin, the leather and the fur: no red, no fire)
HELD = ['run']                 # (no gait plays a run on the grid yet; his claws, bite and casts play since his block, 11-10: data/foes.js generalgrim)
LOOKS = {
    'generalgrim_p1': dict(rows=[('idle', 4, [('b', 'idle', i) for i in range(4)]), ('walk', 9, [('b', 'walk', i) for i in range(8)]),
                                 ('run', 12, [('b', 'run', i) for i in range(8)]),
                                 ('attack', 10, [('act', 'right claw', i) for i in range(4)]), ('attack2', 10, [('act', 'left claw', i) for i in range(4)]),
                                 ('bite', 10, [('act', 'bite', i) for i in range(4)]),
                                 ('cast', 8, [('act', 'point', i) for i in range(4)]), ('castup', 8, [('act', 'hand weave', i) for i in range(4)]),
                                 ('flinch', 12, [('b', 'flinch', i) for i in range(4)]), ('hurt', 8, [('b', 'fall', i) for i in range(4)]),
                                 ('prone', 8, [('b', 'fall', 1), ('b', 'fall', 2), ('b', 'fall', 3), ('b', 'prone', 0)])],
                           release={'attack': 2, 'attack2': 2, 'bite': 2, 'cast': 2},
                           hold=['Walk 1 and 5 lead alike (SE, E, NE), and Run 1 and 5 repeat the stride shape (S, E) -- the art desk\'s own notes',
                                 'NE Fall 4 and Prone 1 settle closer to an east-facing axis than northeast (the art desk\'s own note)',
                                 'N Run 8 keeps a bright right-side mark and Run 5 a plain right pauldron absent from its neighbours (the art desk: held for insignia cleanup)',
                                 'SW, W and NW are mirrors: the rank teeth, on his anatomical left as drawn, change side there'],
                           source='drawn by the art desk (GENERAL-GRIM-WORLD-B1-SE, -B2, -B3, -ACTIONS-SE and -ACTIONS-OTHER-FACINGS, 11-10), cut by '
                                  'tools/generalgrim-sheet.py; SW W NW mirrored -- General Grimlock Grim, of the road\'s redraft (no foe wears it yet)'),
}
GENERALGRIM = dict(SOURCES=SOURCES, GROUPS=GROUPS, GROUND=GROUND, LIFT=LIFT, TALL=TALL, AVOID=AVOID, LOOKS=LOOKS, NAME='General Grimlock Grim',
                   SRCDIR='generalgrim')


def edges():
    """every frame whose drawing reaches its window's edge after the pad -- it may have been clipped there"""
    out = []
    for S in SOURCES.values():
        pages = {}
        for key, w in S['windows'].items():
            fn, (x0, y0, x1, y1) = w[0], w[1]
            if fn not in pages:
                pg = np.asarray(Image.open(os.path.join(_G, fn)).convert('RGB')).astype(np.float32)
                pages[fn] = (pg, DS.letters(pg))
            pg, lt = pages[fn]
            X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(pg.shape[1], x1), min(pg.shape[0], y1)
            m = DS.figure(pg[Y0:Y1, X0:X1], False, lt[Y0:Y1, X0:X1])
            if m[0].any() or m[-1].any() or m[:, 0].any() or m[:, -1].any():
                out.append('%s %d %s' % (key[0], key[1] + 1, key[2]))
    return out


if __name__ == '__main__':
    DS.cut(GENERALGRIM, 'generalgrim_p1')
    p = os.path.join(ROOT, 'deep16', 'art', 'generalgrim_p1.json')
    meta = json.load(open(p, encoding='utf-8'))
    for r in HELD:                                         # (cut, not played yet: the show leaves them out -- js/show.js SH.wanted)
        meta['anims'][r]['held'] = 'not played yet: no gait on the grid plays a run'
    with open(p, 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    if 'check' in sys.argv:
        e = edges()
        print('  at a window\'s edge: ' + (', '.join(e) if e else 'none'))

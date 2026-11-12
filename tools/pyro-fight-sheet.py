"""DEEP16 pipeline 2 (generated art): Pyronimus "Pyro" Silversands fighting -> deep16/art/pyro_p2, all eight facings, his fight sheet from the art desk.

    python tools/pyro-fight-sheet.py            (writes deep16/art/pyro_p2.png/.json)
    python tools/pyro-fight-sheet.py check      (also deep16/art-src/ART-141-PYRO/pyro_p2-review.png: every row of every facing at 3x)
    python tools/pyro-fight-sheet.py measure    (only the crown-to-sole heights a page, the scales they give)

Cut 11-12 by cutter-pyro on the lanes desk's relays of Griz's "got the rest of pyro in from the art desk. the regular attack is weak-sauce but fits his time with
the party in the story so it's kind of funny". Three of the art desk's ART-141 packages, sorted out of Fresh to deep16/_src/ART-141-PYRO/:
  COMBAT/       ART-141-PYRO-COMBAT-COMPLETE: five views (S, SE, E, NE, N), a page an action -- Idle 4 (armed), Attack 6 (one right-hand mace, the left in guard;
                its hit on frame 3), Flinch 4, Fall 6 (the maces let go), Prone 1 (two maces beside him).
  TWIN-STRIKE/  ART-141-PYRO-TWIN-STRIKE-COMPLETE: the Twin Strike in the five views, drawn over the desk's dwarf mannequin (tools/twinmace-sheet.py's strips,
                deep16/art-src/twinmace/twinmace-dwarf-<view>.png): 6 frames, the grip, two loads, the HIT on frame 4 with both maces, two back to guard.
                (Its SE page is byte-identical to the SE checkpoint of the same morning, filed under superseded/.)
  TOWN/         ART-141-PYRO-TOWN, the walk only: his town walk (pyro_p1's pages) cut again at the fight's size -- the same dwarf, the same eight steps.
Each frame-map gives each drawing's bounds on its page; a window here is those bounds padded PAD, kept above the cell's foot (the printed numbers sit
under the cells). Cut by tools/doran-sheet.py's cutter (the navy flooded from the window's edges, the body and what is near it), no lettering pass.

Scale: the pages are drawn at their own sizes (the Twin Strike's at about half the Idle's), and a box's height is spoiled by a mace held overhead, so every
page is measured CROWN TO SOLE: the crown's top found by its gold (the topmost gold pixel of the drawing; the maces are steel and wood), the sole the
drawing's lowest row, the page's median to TALL -- the art desk's "53 px crown to sole", pyro_p0's guard. The Fall by its frame 1's box against the view's idle box (its first frames
a stagger, not the guard); the Prone by its width to the Fall's frame 6 (the body and the two maces beside it, as the art desk asks the seam be matched).
A standing frame stands on its lowest row by its top's middle; a lying one (Fall 4-6, Prone) by its whole body's middle. Facings (RULED 10-14): S SE E NE N
as drawn, SW W NW their mirrors (the maces swap hands with the mirror, as every two-weapon sheet's do).

Rows (the engine's names): idle 4; walk 8 (the town walk); attack 6 (`release` 2: the ordinary blow lands on frame 3 -- js/battle.js plays `attack` for his
Mace and his Mace of Disruption, neither has a row of its name); twinstrike 6 (`release` 3: the hit on frame 4 -- js/battle.js plays it for a TWIN STRIKE
blow, atk.twin, where the sheet has it; his own turn, js/pyro.js, swings his two maces as two blows and makes no Twin Strike, so today only the show and the
gallery play it); flinch 4; hurt 6 (the Fall, held on 6); prone 3 (Fall 5, 6, Prone 1); getup 3 (Fall 6, 5, 4: the fall run back).
"""
import colorsys, importlib.util, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doransheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)
DS.FH, DS.AY = 100, 92          # (a tall cell: the twin strike's maces go up a head and a half over the crown)

_P = os.path.join(DS.pix.SRC, 'ART-141-PYRO')
PAD = 8
TALL = 53
VIEW = {'S': 'S', 'SE': 'SE', 'E': 'E', 'NE': 'NE', 'rear NE': 'NE', 'N': 'N'}
VIEWS = ['S', 'SE', 'E', 'NE', 'N']


def gold_top(a):
    """the topmost row of the crown's gold in a window (RGB float 0-255): yellow, saturated, bright"""
    r, g, b = a[..., 0] / 255.0, a[..., 1] / 255.0, a[..., 2] / 255.0
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    s = (mx - mn) / np.maximum(mx, 1e-6)
    hue = np.where(mx == r, ((g - b) / np.maximum(mx - mn, 1e-6)) % 6, np.where(mx == g, (b - r) / np.maximum(mx - mn, 1e-6) + 2, (r - g) / np.maximum(mx - mn, 1e-6) + 4)) * 60
    m = (hue >= 36) & (hue <= 58) & (s >= 0.45) & (mx >= 0.55)
    rows = np.where(m.sum(axis=1) >= 2)[0]
    return int(rows[0]) if len(rows) else None


def load(folder, fmap, keyf):
    """windows and crown-to-sole heights from a frame map: {(act, i, view): (file, box, None, None)}, {(act, i, view): h}, {(act, i, view): w}"""
    fm = json.load(open(os.path.join(_P, folder, fmap), encoding='utf-8'))
    out, hs, ws = {}, {}, {}
    for p in fm['pages']:
        k = keyf(p)
        if not k:
            continue
        act, v = k[0], VIEW[p['facing']]
        src = p['source']; im = None
        nums = [f['frame'] for f in p['frames']]
        assert nums == list(range(1, len(nums) + 1)), (src, nums)
        for f in p['frames']:
            sb = f.get('signal_bounds_xyxy') or f.get('preview_crop_xyxy'); c = f['cell_xyxy']
            W_, H_ = p.get('dimensions') or [10 ** 6, 10 ** 6]
            box = (max(0, sb[0] - PAD), max(c[1], sb[1] - PAD), min(W_, sb[2] + PAD), min(c[3], sb[3] + PAD))   # (across a cell's side, not its foot: the SE hit's mace runs to its cell's edge, x 1451, and was cut off there)
            out[(act, f['frame'] - 1, v)] = (src, box, None)
            if im is None:
                im = np.asarray(Image.open(os.path.join(_P, folder, src)).convert('RGB')).astype(np.float32)
            gt = gold_top(im[sb[1]:sb[3], sb[0]:sb[2]])
            hs[(act, f['frame'] - 1, v)] = (sb[3] - sb[1] - gt) if gt is not None else None
            ws[(act, f['frame'] - 1, v)] = sb[2] - sb[0]
    return out, hs, ws


def ckey(p):
    return (p['action'].lower(),) if p['action'] in ('Idle', 'Attack', 'Flinch', 'Fall', 'Prone') else None


WC, HC, WWC = load('COMBAT', 'FRAME-MAP.json', ckey)
WT, HT, _ = load('TWIN-STRIKE', 'FRAME-MAP.json', lambda p: ('twin',))
WW, HW, _ = load('TOWN', 'FRAME-MAP.json', lambda p: ('walk',) if p['name'].endswith('Walk') else None)


def med(xs):
    xs = sorted(x for x in xs if x); n = len(xs); return xs[n // 2] if n % 2 else 0.5 * (xs[n // 2 - 1] + xs[n // 2])


def crown(H, act, v):
    # (the page's largest reading: where the gold found is the belt's buckle or a clasp, not the crown -- the crown hidden by a mace, or too dark in a back
    # view -- the reading comes out short, never long; so the largest is the crown's, measured 11-12 against the frames' boxes where nothing is overhead)
    return max(h for (a, i, vv), h in H.items() if a == act and vv == v and h)


def boxh(W, act, v, i=0):
    b = W[(act, i, v)][1]; return b[3] - b[1] - 2 * PAD


# the group: the combat idle by its crop height to TALL (doran-sheet's GROUPS); every other page TIE'd to it: TALL over its own crown-to-sole, over the idle group's scale
IDLE = {v: med([boxh(WC, 'idle', v, i) for i in range(4)]) for v in VIEWS}           # (the cutter's own measure of the idle: the crop's height, about the bounds')
REF = {v: TALL / float(IDLE[v]) for v in VIEWS}
FIT = {act: {v: (TALL / float(crown(H, act, v))) / REF[v] for v in VIEWS} for act, H in (('idle', HC), ('attack', HC), ('flinch', HC), ('twin', HT), ('walk', HW))}
FIT['fall'] = {v: IDLE[v] / float(boxh(WC, 'fall', v, 0)) for v in VIEWS}   # (its own page, by its frame 1 -- still standing, staggered -- against the view's idle: by the Attack's page S and SE fell a third smaller, by its own crown reading E a size bigger)
FIT['prone'] = {v: FIT['fall'][v] * WWC[('fall', 5, v)] / float(WWC[('prone', 0, v)]) for v in VIEWS}

SOURCES = {'c': dict(folder=os.path.join(_P, 'COMBAT'), windows=WC, letters=False),
           'w': dict(folder=os.path.join(_P, 'TWIN-STRIKE'), windows=WT, letters=False),
           't': dict(folder=os.path.join(_P, 'TOWN'), windows=WW, letters=False)}
GROUPS = {('c', 'ref'): (['ref'], [('idle', i) for i in range(4)])}
TIE = {('c', a): ('c', 'ref', FIT[a]) for a in ['idle', 'attack', 'flinch', 'fall', 'prone']}
TIE[('w', 'twin')] = ('c', 'ref', FIT['twin'])
TIE[('t', 'walk')] = ('c', 'ref', FIT['walk'])
GROUND = {('c', 'fall', 3), ('c', 'fall', 4), ('c', 'fall', 5), ('c', 'prone', 0)}
AVOID = ['red', 'fire']        # (his skin and the leather: the 64's reds and fire ramp left out, as his portrait's and his town figure's)
LOOKS = {
    'pyro_p2': dict(rows=[('idle', 5, [('c', 'idle', i) for i in range(4)]), ('walk', 9, [('t', 'walk', i) for i in range(8)]),
                          ('attack', 10, [('c', 'attack', i) for i in range(6)]), ('twinstrike', 10, [('w', 'twin', i) for i in range(6)]),
                          ('flinch', 10, [('c', 'flinch', i) for i in range(4)]), ('hurt', 8, [('c', 'fall', i) for i in range(6)]),
                          ('prone', 8, [('c', 'fall', 4), ('c', 'fall', 5), ('c', 'prone', 0)]),
                          ('getup', 8, [('c', 'fall', 5), ('c', 'fall', 4), ('c', 'fall', 3)])],
                    release={'attack': 2, 'twinstrike': 3},
                    hold=['attack: one right-hand mace, the left kept in guard -- a mild blow, kept as drawn on his word ("the regular attack is weak-sauce but fits his time with the party in the story so it\'s kind of funny")',
                          'twinstrike: SE frame 4 projects the near mace a little flatter than the mannequin; E\'s near guard mace sits lower than the mannequin\'s (the art desk\'s own notes)',
                          'walk: his town walk (ART-141-PYRO-TOWN) cut at the fight\'s size; the town figure carries the maces belted, as every walk of his does',
                          'fall and prone: the maces let go and lie beside him; getup is the fall run back, the maces back in hand at the idle'],
                    source='drawn by the art desk (ART-141-PYRO-COMBAT-COMPLETE and ART-141-PYRO-TWIN-STRIKE-COMPLETE, 11-12, the twin strike over the dwarf mannequin; the walk from ART-141-PYRO-TOWN), '
                           'cut by tools/pyro-fight-sheet.py; SW W NW mirrored -- worn in his fights (js/classes.js NPC.NAMED pyro look)'),
}
PYRO = dict(SOURCES=SOURCES, GROUPS=GROUPS, TIE=TIE, GROUND=GROUND, TALL=TALL, AVOID=AVOID, LOOKS=LOOKS, NAME='Pyro', SRCDIR='ART-141-PYRO')

if __name__ == '__main__':
    for act, H in (('idle', HC), ('attack', HC), ('flinch', HC), ('twin', HT), ('walk', HW)):
        print('%-7s crown-to-sole %s  fit %s' % (act, {v: crown(H, act, v) for v in VIEWS}, {v: round(FIT[act][v], 3) for v in VIEWS}))
    print('idle box', IDLE, ' prone fit', {v: round(FIT['prone'][v], 3) for v in VIEWS})
    if 'measure' not in sys.argv:
        DS.cut(PYRO, 'pyro_p2')

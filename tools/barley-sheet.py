"""DEEP16 pipeline 2 (generated art): the art desk's Barley pages -> two sheets, one a look.

    python tools/barley-sheet.py                  # both: deep16/art/barley_p2 (the coat) and barley_p3 (the chain) .png + .json
    python tools/barley-sheet.py coat|chain       # one
    python tools/barley-sheet.py chain check      # also dev/visions/barley/<outfit>/: each page's cut, every facing of every row, a lineup
    python tools/barley-sheet.py chain measure    # the numbers the scale and the grounds are taken from, printed (nothing written)
    python tools/barley-sheet.py chain legs       # every walk attempt of every view, its forward foot frame by frame (nothing written)

THE COAT, barley_p2 -- Barley barefoot in his battered brown coat with the threshing flail drawn in his hands (the art desk's ART-75 and ART-76; Griz,
2026-10-20, to the lanes desk: "Spin up a Fable cutter for Barley's legs (art 75 & 76 in Fresh)"), and since the chain seat (10-20) its second shot ART-77
and ART-76's third pass folded in (Griz: "make the best of what we have, with barley barefoot until he's wearing chain shirt+ AC gear"). Sorted out of
Fresh into deep16/_src/barley/: ART-75/ (the 38 retained source sheets), ART-76/repair/, ART-76/pass2/, ART-76/pass3/ (selected: GetUp SE), ART-77/
(selected: the ten standing bonus-action rows, Walk N's grip, Fall/Prone/GetUp S, GetUp N, Victory N, FlailOverhead N); the desk's unselected attempts
in ART-76/superseded/ and its broken third pass in ART-76/pass3-broken/ (NOT FINAL), read here only as walk attempts. The desk's papers in
_src/art-desk/received-2026-10-20-ART-75/, -ART-76/ (pass-2/, pass-3/, pass-3-broken/), -ART-77/.
THE CHAIN, barley_p3 -- Barley in the chainmail hauberk and boots (the art desk's ART-109, every slot an attempt, broken ones marked
BROKEN_FINAL_ATTEMPT_RETAINED), EMPTY-HANDED: the engine draws his two-handed weapon by code (js/sprites.js S.wield) at the hands this cutter measures,
frame by frame (`grips` below). Griz: "Had it make empty-handed two handed weapon strikes, try code flail and battle axe implementation" and "that new
barley sheet is to use the best of the broken, as if it was good enough" -- every slot takes its best attempt, a broken one where it is the best there is;
nothing falls back for being broken. In _src/barley/ART-109/ (the 70 final attempts, manifest.json, refs/: the desk's identity turnaround and the walk
attempts it did not select; as-dropped/: the same refs as Griz dropped them in Fresh, matched by their pixels in twins.json).
Facings (RULED 10-14, five drawn views): S, SE, E, NE, N as drawn; SW, W, NW their mirrors (the desk's declared shortcut: a mirror flips the hands too).
A view no delivery has drawn is left out: its cells are empty and the row's `drawn` lists the facings it has; the engine (js/sprites.js frameOf) plays a
missing facing from the row's `under` sheet where it names one, otherwise from the nearest drawn facing.
Rows (ENGINE below): Idle -> idle; Walk -> walk (WALKS: a walk assembled from whole frames of any attempt, on his authorization: "assembling a clean
walk from usable frames or parts of partially defective attempts ... with stable anatomy/facing/scale and per-frame/part provenance"); FlailSweep ->
attack (every blow; the contact on 4, `release` 3; the chain's "Sweep" is its alias); FlailOverhead -> attack2 (the second blow of a turn -- Extra Attack,
or the blow after an Action Surge; the chain's "Overhead"); Defend -> defend (the Dodge); Flinch -> flinch; Fall -> hurt; Prone -> prone (Fall 2-5 then
Prone 1, where he lies while prone); GetUp -> getup, and `sit` (GetUp 3, sat up: the campfire); Interact -> interact (a hand on a thing); UseItem ->
useitem (a potion); Victory -> victory; SecondWind -> secondwind; ActionSurge -> actionsurge. Prone 2 is the one drawing not used.
Which attempt fills a slot: each delivery's pages are candidates for their (view, action); a desk-selected page beats a broken one, a later delivery an
earlier, and PICK pins one by name where the eye chose otherwise.
How a page is cut. Its labels are found, not typed: cream glyphs (each piece small, mostly cream) grouped into words and the words into strips; a strip
of single glyphs is a band's numbers, matched in order to the printed bands (each band's count checked) -- or, where a page prints each frame's number
inside its name ("WALK SE 1"), each name's last glyph; any other strip is a name and dropped whole. Every blob belongs to the first number strip below
its middle; every blob inside a word's or a name strip's box is dropped; each band is split among its numbers' x by tools/sheetrows.py split_band.
The scale: the identity page's Front still stands HEIGHT game px from the top of his hair to his heels -- barley_p0's S, tools/sheetrows.py STANDS (51
tall with the outline ring), so he stands where he stood beside the other three. Each Idle page by its Idle 1's filled area against the identity
still(s) its view sits between, sqrt-area (height lies, a raised flail is all height and no area); every other page by its standing frame (STAND)
against its view's Idle 1; the Prone pages by Prone 1 against Fall 6 at the Fall page's scale.
The ground: each frame on its own printed band's ground (a band's first frame's feet), but a row the body leaves its feet in -- Fall, Prone, GetUp --
and every walk on each frame's own lowest point.
The legs (`legs`): each frame's two feet are found in the bottom of the figure; the forward one along the walk, its side across it. An alternating gait
changes side twice round the loop; one that repeats a leg changes only at the crossing frame, if at all.
"""
import os, sys, json, subprocess, colorsys
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

SRC = os.path.join(ROOT, 'deep16', '_src')                 # the pages live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.exists(os.path.join(SRC, 'barley')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')
BAR = os.path.join(SRC, 'barley')
UNDER = 'barley_p0'
VIEW = {1: 'SE', 2: 'NE', 3: 'S', 4: 'E', 5: 'N'}
HEAD = {v: h for h, v in VIEW.items()}
TURNVIEW = {'SE': ('Front', 'Right'), 'NE': ('Right', 'Back'), 'S': ('Front',), 'E': ('Right',), 'N': ('Back',)}   # the stills each view sits between
FACING = {'S': (0,), 'SE': (7, 1), 'E': (6, 2), 'NE': (5, 3), 'N': (4,)}   # deep16/js/sprites.js S.FACINGS: S SW W NW N NE E SE (1-3 drawn mirrored)
HEIGHT = 49                  # the Front still, hair to heels, game px before the outline ring (51 with it: barley_p0's S in STANDS)
ALIAS = {'Sweep': 'FlailSweep', 'Overhead': 'FlailOverhead'}   # ART-109's names for the two blows (its manifest's `legacy_action`)
# each page's standing frame, measured against its view's Idle 1 for the page's scale (the guard he starts or ends the row in)
STAND = {'Walk': 1, 'FlailSweep': 1, 'FlailOverhead': 1, 'Defend': 1, 'Flinch': 4, 'Fall': 1, 'GetUp': 6, 'Interact': 1, 'UseItem': 4, 'Victory': 1,
         'SecondWind': 6, 'ActionSurge': 1}
# each sheet row: the page rows and frames it plays, in order, and its ground -- 'band' each frame on its printed band's ground, 'own' each frame on its
# own lowest point
ENGINE = {
    'idle': [('Idle', None, 'band')],
    'walk': [('Walk', None, 'own')],
    'attack': [('FlailSweep', None, 'band')],
    'hurt': [('Fall', None, 'own')],
    'sit': [('GetUp', [3, 3], 'own')],
    'flinch': [('Flinch', None, 'band')],
    'prone': [('Fall', [2, 3, 4, 5], 'own'), ('Prone', [1], 'own')],
    'attack2': [('FlailOverhead', None, 'band')],
    'defend': [('Defend', None, 'band')],
    'getup': [('GetUp', None, 'own')],
    'useitem': [('UseItem', None, 'band')],
    'victory': [('Victory', None, 'band')],
    'interact': [('Interact', None, 'band')],
    'secondwind': [('SecondWind', None, 'band')],
    'actionsurge': [('ActionSurge', None, 'band')],
}
NEW_ROWS = ['attack2', 'defend', 'getup', 'useitem', 'victory', 'interact', 'secondwind', 'actionsurge']   # (this cutter's rows, after pixelate's own order)
FPS = {'idle': 6, 'walk': 10, 'attack': 12, 'attack2': 12, 'hurt': 10, 'sit': 2, 'flinch': 12, 'prone': 10, 'defend': 8, 'getup': 10, 'useitem': 8,
       'victory': 8, 'interact': 10, 'secondwind': 8, 'actionsurge': 10}
RELEASE = {'attack': 3, 'attack2': 3}        # the blow meets the target on frame 4 of both swings -- js/battle.js times a blow by its release


# ---------------------------------------------------------------- the deliveries
def _bands(e, key='printed_bands_top_to_bottom'):
    out = []
    for b in e[key]:
        r = b.get('frame_range') or b.get('range') or [min(b['frame_numbers']), max(b['frame_numbers'])]
        out.append((int(r[0]), int(r[1])))
    return out


def classic(sub, key, fkey):
    """ART-75 and ART-76's repair and pass 2: {key: [{head, facing, action, <fkey>, printed_bands_top_to_bottom: [{frame_range}]}]}"""
    man = json.load(open(os.path.join(BAR, sub, 'manifest.json'), encoding='utf-8'))
    return [dict(path=os.path.join(BAR, sub, os.path.basename(e[fkey])), view=e['facing'], head=e['head'], action=e['action'], bands=_bands(e),
                 status='selected', note='', delivery=sub) for e in man[key] if e.get('head')]


def art77(sub='ART-77'):
    """ART-77 (the second shot): {pages: [{head, facing, action, filename, printed_bands_top_to_bottom: [{frame_numbers}]}]}"""
    man = json.load(open(os.path.join(BAR, sub, 'manifest.json'), encoding='utf-8'))
    return [dict(path=os.path.join(BAR, sub, e['filename']), view=e['facing'], head=e['head'], action=e['action'], bands=_bands(e),
                 status='selected', note='', delivery=sub) for e in man['pages']]


def pass3(sub, broken):
    """ART-76 pass 3: selected {sources: [{file, action: 'GetUp SE', printed_bands_top_to_bottom: [{range}]}]}, broken [{package_file, action,
    frame_slots, dimensions, verdict}] (no bands printed in its manifest: a two-row walk page is 1-4 over 5-8, any other one band). The 8-bit's pages
    (LEFT, Map) are not the grid's"""
    man = json.load(open(os.path.join(BAR, sub, 'manifest.json'), encoding='utf-8'))
    out = []
    for e in (man if broken else man['sources']):
        act, _, view = e['action'].rpartition(' ')
        if view not in HEAD or act.startswith('Map'):
            continue
        if broken:
            n = e['frame_slots']
            bands = [(1, 4), (5, 8)] if n == 8 and e['dimensions'][1] > 900 else [(1, n)]
        else:
            bands = _bands(e)
        out.append(dict(path=os.path.join(BAR, sub, os.path.basename(e['package_file' if broken else 'file'])), view=view, head=HEAD[view],
                        action=act, bands=bands, status='broken' if broken else 'selected', note=e.get('verdict', ''), delivery=sub))
    return out


def art109(sub='ART-109'):
    """ART-109 (the chain): {slots: [{head, facing, action, legacy_action, file, status, review_notes, printed_bands_top_to_bottom: [{frame_range}]}]};
    every slot is the desk's one chosen attempt, BROKEN_FINAL_ATTEMPT_RETAINED where it gave up on it"""
    man = json.load(open(os.path.join(BAR, sub, 'manifest.json'), encoding='utf-8'))
    return [dict(path=os.path.join(BAR, sub, os.path.basename(e['file'])), view=e['facing'], head=e['head'], action=e['legacy_action'],
                 bands=_bands(e), status='broken' if e['status'].startswith('BROKEN') else 'selected', note=e['review_notes'], delivery=sub)
            for e in man['slots']]


def attempt(rel, view, action, bands, note, labels=None):
    """a page outside any manifest's selection, read as a candidate only (an unselected walk attempt)"""
    return [dict(path=os.path.join(BAR, rel), view=view, head=HEAD[view], action=action, bands=bands, status='attempt', note=note,
                 delivery=os.path.dirname(rel).replace('\\', '/'), labels=labels)]


SUP = os.path.join('ART-76', 'superseded', 'unselected-sources')
OUTFITS = {
    'coat': dict(
        name='barley_p2', identity=os.path.join('ART-75', 'ART-75_IDENTITY_PAGE-1.png'),
        look='barefoot in his battered brown coat, the threshing flail drawn in his hands',
        deliveries=lambda: (classic('ART-75', 'sources', 'selected_filename') + classic(os.path.join('ART-76', 'repair'), 'selected', 'selected_source') +
                            classic(os.path.join('ART-76', 'pass2'), 'selected', 'selected_source') + pass3(os.path.join('ART-76', 'pass3'), False) +
                            art77() + pass3(os.path.join('ART-76', 'pass3-broken'), True) +
                            attempt(os.path.join(SUP, 'exec-daee575e-928e-4d2d-a277-9d6296aca577.png'), 'N', 'Walk', [(1, 4), (5, 8)], 'walkN2 (pass 2 REVIEW)') +
                            attempt(os.path.join(SUP, 'exec-8654d738-6cb0-481f-b760-ed70aa598f01.png'), 'SE', 'Walk', [(1, 4), (5, 8)], 'walkSE2 (pass 2 REVIEW)') +
                            attempt(os.path.join(SUP, 'exec-8c70aac3-5b3b-4ccd-b50a-d34554be95de.png'), 'NE', 'Walk', [(1, 4), (5, 8)], 'walkNE2 (pass 2 REVIEW)') +
                            attempt(os.path.join(SUP, 'exec-ea1c3c2b-570c-4230-bab6-e6e562f4976d.png'), 'E', 'Walk', [(1, 4)], 'Ewalkhalf1 (pass 2 REVIEW)') +
                            attempt(os.path.join(SUP, 'exec-fd4df547-d152-4730-8fe2-e951aed80f39.png'), 'E', 'Walk', [(5, 8)], 'Ewalkhalf2 (pass 2 REVIEW)')),
        picks={}, grips=False,
        # the walks (`legs` reads every attempt): S the desk's pass-2 salvage as printed (alternates); N the second shot's page (its grip fixed: ART-77)
        # in the desk's own proposed order, 2-5 one leg and 6-8, 1 the other; SE NE E -- every attempt delivered, the pass-2 REVIEW ones and the third
        # pass's, leads with the same leg, so no reorder alternates: the third pass's attempts play as drawn (BROKEN-used, the least bad: the same
        # figure in every facing, where barley_p0's walk is another man), `'under'` here puts barley_p0's walk back in a view
        walks={'N': dict(frames=[('ART-77_16BIT_HEAD-5_PAGE-1.png', n) for n in (2, 3, 4, 5, 6, 7, 8, 1)],
                         why='ART-77 Walk N (grip corrected) in the desk\'s proposed order 2,3,4,5,6,7,8,1: the forward foot L L L L R R R R')}),
    'chain': dict(
        name='barley_p3', identity=os.path.join('ART-109', 'as-dropped', 'a256a9f8-00f7-4f8b-af15-3630e1665919.png'),   # (the desk's controlling identity,
                                                                                                                      # as Griz dropped it: refs/ holds it downscaled)
        look='in the chainmail hauberk and boots, empty-handed: his weapon drawn by the engine at the hands measured here',
        deliveries=lambda: (art109() +
                            attempt(os.path.join('ART-109', 'refs', 'Eight-frame chainmail warrior walk cycle-1.png'), 'SE', 'Walk', [(1, 4), (5, 8)], 'refs: walk cycle-1 (not selected)') +
                            attempt(os.path.join('ART-109', 'refs', 'Eight-frame chainmail warrior walk cycle-2.png'), 'NE', 'Walk', [(1, 4), (5, 8)], 'refs: walk cycle-2 (not selected)') +
                            attempt(os.path.join('ART-109', 'refs', 'Barley’s Eight-Frame Chainmail Walk Cycle-3.png'), 'E', 'Walk', [(1, 4), (5, 8)], 'refs: walk cycle-3 (not selected)')),
        picks={}, grips=True,
        # the walks: S and N the desk's new pages, their legs flickering frame to frame as printed (S lifts R L L L L R L R) -- reordered whole frames so
        # each half-stride is one leg's (S: 7, 2-5 the right foot forward and 6, 1, 8 the left; N: 4, 6, 7, 1 the left and 5, 2, 3, 8 the right); SE NE E:
        # both attempts of each (the desk's final and its unselected ref) lead with the same leg, so the finals play as drawn (BROKEN-used)
        walks={'S': dict(frames=[('ART-109_16BIT_HEAD-3_PAGE-2.png', n) for n in (2, 3, 4, 5, 6, 1, 8, 7)],
                         why='ART-109 Walk S reordered: the forward foot R R R R L L L R round the loop (printed 1-8 it changes side four times)'),
               'N': dict(frames=[('ART-109_16BIT_HEAD-5_PAGE-2.png', n) for n in (4, 6, 7, 1, 5, 2, 3, 8)],
                         why='ART-109 Walk N reordered: the forward foot L L L L R R R R (printed 1-8 it changes side six times)')}),
}
O = OUTFITS['coat']


def use(outfit):
    global O
    O = OUTFITS[outfit]
    return O


def candidates():
    """{(view, action): [page, ...]} in delivery order, every page checked on disk"""
    out = {}
    for e in O['deliveries']():
        if e['action'] not in {p[0] for parts in ENGINE.values() for p in parts} | {'Prone'}:
            continue                                        # (the empty-hands sweep test, kept in ART-76/experiment/)
        if not os.path.isfile(e['path']):
            raise SystemExit('missing page: ' + e['path'])
        if VIEW[e['head']] != e['view']:
            raise SystemExit('%s: head %s says %s, the manifest %s' % (e['path'], e['head'], VIEW[e['head']], e['view']))
        out.setdefault((e['view'], e['action']), []).append(e)
    return out


RANK = {'selected': 2, 'broken': 1, 'attempt': 0}


def chosen(cands=None):
    """{(view, action): the page that fills the slot}: PICK's by name, else the best status, the later delivery of two as good"""
    cands = cands or candidates()
    out = {}
    for k, l in cands.items():
        pin = O['picks'].get(k)
        if pin:
            hit = [e for e in l if os.path.basename(e['path']) == pin]
            if not hit:
                raise SystemExit('PICK %s %s: no candidate named %s' % (k + (pin,)))
            out[k] = hit[0]
        else:
            best = max(RANK[e['status']] for e in l)
            out[k] = [e for e in l if RANK[e['status']] == best][-1]
    return out


# ---------------------------------------------------------------- the labels
def cream(a):
    return (a.min(-1) > 150) & (a.mean(-1) > 195)


def glyph_words(a, m):
    """cream glyphs (a small piece, a third of it cream) grouped into words: [x0, y0, x1, y1, glyphs]"""
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    cr = cream(a)
    gl = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if h > 44 or w > 44 or h < 9:
            continue
        if cr[sl][lab[sl] == i + 1].mean() < 0.3:
            continue
        gl.append([sl[1].start, sl[0].start, sl[1].stop, sl[0].stop])
    gl.sort()
    ws = []
    for g in gl:
        for wd in ws:
            if abs((wd[1] + wd[3]) / 2 - (g[1] + g[3]) / 2) < 10 and g[0] - wd[2] < 24 and g[0] >= wd[0]:
                wd[0], wd[1], wd[2], wd[3] = min(wd[0], g[0]), min(wd[1], g[1]), max(wd[2], g[2]), max(wd[3], g[3]); wd[4] += 1
                break
        else:
            ws.append(g + [1])
    return ws


def strips(ws):
    """words grouped by their middle's y: [(y, [words left to right])]"""
    out = []
    for w in sorted(ws, key=lambda w: (w[1] + w[3]) / 2):
        if out and abs((w[1] + w[3]) / 2 - out[-1][0]) < 14:
            out[-1][1].append(w)
        else:
            out.append([(w[1] + w[3]) / 2, [w]])
    return [(c, sorted(l)) for c, l in out]


def name_numbers(l, n):
    """a strip printing each frame's number at its name's end ("WALK SE 1   WALK SE 2 ..."): the words grouped by the gaps between them (a frame's
    name and number sit closer than two frames' labels), each group's last word its number -> n words, or None"""
    if len(l) == n:                                         # each frame's whole label one word (its glyphs close): the label centred under it
        return l
    gaps = [l[i + 1][0] - l[i][2] for i in range(len(l) - 1)]
    if len(l) < n or n < 2:
        return None
    cut = sorted(gaps)[-(n - 1)]                             # the n-1 widest gaps part the frames
    groups, cur = [], [l[0]]
    for w, g in zip(l[1:], gaps):
        if g >= cut and len(groups) < n - 1:
            groups.append(cur); cur = [w]
        else:
            cur.append(w)
    groups.append(cur)
    if len(groups) != n or any(g[-1][4] != 1 for g in groups):
        return None
    return [g[-1] for g in groups]


# ---------------------------------------------------------------- a page cut
_CUT = {}


def cut_page(pg, check=False):
    """one page -> [(n, RGBA image, box, its band's ground)] in number order (cached by path and bands)"""
    key = (pg['path'], tuple(pg['bands']))
    if key in _CUT and not check:
        return _CUT[key]
    a = np.asarray(Image.open(pg['path']).convert('RGB')).astype(np.int32)
    m = SR.figure_mask(a)
    ws = glyph_words(a, m)
    sts = strips(ws)
    nums = [(y, l) for y, l in sts if all(w[4] == 1 for w in l)]   # a band's numbers: single glyphs; a name ("Idle SE", "Walk S") has a longer word
    names = [(y, l) for y, l in sts if not all(w[4] == 1 for w in l)]
    if len(nums) != len(pg['bands']):                       # numbers printed inside the names ("WALK SE 1"): each name's last glyph
        alt = []
        for (y, l) in names:
            k = len(alt)
            if k < len(pg['bands']):
                got = name_numbers(l, pg['bands'][k][1] - pg['bands'][k][0] + 1)
                if got:
                    alt.append((y, got))
        if len(alt) == len(pg['bands']):
            nums, names = alt, [(y, l) for y, l in names if all(y != ay for ay, _ in alt)]
    if len(nums) != len(pg['bands']):
        raise SystemExit('%s: %d number strips found, %d bands' % (os.path.basename(pg['path']), len(nums), len(pg['bands'])))
    seeds = []
    for (y, l), (f0, f1) in zip(nums, pg['bands']):
        if len(l) != f1 - f0 + 1:
            raise SystemExit('%s band %d-%d at y %d: %d numbers' % (os.path.basename(pg['path']), f0, f1, y, len(l)))
        seeds.append([(w[0] + w[2]) / 2 for w in l])
    boxes = [(w[0] - 3, w[1] - 3, w[2] + 3, w[3] + 3) for w in ws]
    for y, l in names + nums:                               # a name's whole strip (a hyphen is no glyph, and once landed in a frame: the ratswarm's find)
        boxes.append((min(w[0] for w in l) - 6, min(w[1] for w in l) - 4, max(w[2] for w in l) + 6, max(w[3] for w in l) + 4))
    SR.drop_text(m, boxes)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    sz = ndimage.sum(m, lab, range(1, n + 1))
    m &= np.isin(lab, 1 + np.where(sz >= 6)[0])             # specks under 6 px are noise
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(lab)
    cy = np.array([(sl[0].start + sl[0].stop) / 2 for sl in objs])
    ly = np.array([y for y, _ in nums])
    owner = np.searchsorted(ly, cy)                         # the first number strip below the blob's middle
    out, over = [], (a * 0.25).astype(np.uint8) if check else None
    for k, ((y, l), (f0, f1)) in enumerate(zip(nums, pg['bands'])):
        band = np.isin(lab, 1 + np.where(owner == k)[0])
        g = SR.split_band(band, seeds[k])
        for dy, dx in ((0, 1), (1, 0), (1, 1), (1, -1)):   # two frames still touching (a beater into the next frame)
            p = g[:g.shape[0] - dy, max(0, -dx):g.shape[1] - max(0, dx)]
            q = g[dy:, max(0, dx):g.shape[1] - max(0, -dx)]
            yy, xx = np.where((p > 0) & (q > 0) & (p != q))
            if len(yy):
                print('  touching: %s at x %d y %d (frames %d and %d)' % (os.path.basename(pg['path']), xx[0] + max(0, -dx), yy[0],
                                                                       f0 + p[yy[0], xx[0]] - 1, f0 + q[yy[0], xx[0]] - 1))
                break
        frs = []
        for i in range(f1 - f0 + 1):
            kp = g == i + 1
            if not kp.any():
                raise SystemExit('%s frame %d: nothing cut' % (os.path.basename(pg['path']), f0 + i))
            im, box = SR.rgba_crop(a, kp)
            frs.append((f0 + i, im, box, frs[0][2][3] if frs else box[3]))   # (its ground: its printed band's first frame's feet)
            if check:
                over[kp] = (a[kp] * 0.35 + np.array(SR.HUES[i % len(SR.HUES)]) * 0.65).astype(np.uint8)
        out.extend(frs)
    if check:
        d = vision_dir(); im = Image.fromarray(over); dr = ImageDraw.Draw(im)
        for y, l in nums:
            for w in l:
                dr.rectangle(w[:4], outline=(255, 255, 255))
        im.resize((im.width // 2, im.height // 2), Image.BOX).save(os.path.join(d, 'cut-%s-%s-%s.png' % (pg['view'], pg['action'], os.path.splitext(os.path.basename(pg['path']))[0][-12:])))
    _CUT[key] = out
    return out


def vision_dir():
    d = os.path.join(ROOT, 'dev', 'visions', 'barley', O['name']); os.makedirs(d, exist_ok=True)
    return d


# ---------------------------------------------------------------- the measure
def turnaround(check=False):
    """the identity page's four stills (Front, Right, Back, Left): {name: (height hair to heels, filled area)} in page px"""
    path = os.path.join(BAR, O['identity'])
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
    m = SR.figure_mask(a)
    ws = glyph_words(a, m)
    names = []                                              # FRONT RIGHT BACK LEFT: a strip of 16 glyphs or more, its words grouped by the 3 widest gaps
    for y, l in strips(ws):                                 # (ART-109's identity: a thin I parts RIGHT into two words)
        if sum(w[4] for w in l) < 16 or len(l) < 4:
            continue
        gaps = sorted(range(len(l) - 1), key=lambda i: l[i + 1][0] - l[i][2])[-3:]
        groups, cur = [], [l[0]]
        for i, w in enumerate(l[1:]):
            if i in gaps:
                groups.append(cur); cur = [w]
            else:
                cur.append(w)
        groups.append(cur)
        names.append((y, [[min(w[0] for w in g), min(w[1] for w in g), max(w[2] for w in g), max(w[3] for w in g), sum(w[4] for w in g)] for g in groups]))
    if len(names) != 1:
        raise SystemExit('identity page: %d strips of four words' % len(names))
    y, l = names[0]
    SR.drop_text(m, [(w[0] - 3, w[1] - 3, w[2] + 3, w[3] + 3) for w in ws])
    xs = [(w[0] + w[2]) / 2 for w in l]
    half = 0.45 * (xs[1] - xs[0])
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    sz = ndimage.sum(m, lab, range(1, n + 1))
    out, marks = {}, []
    for nm, x in zip(('Front', 'Right', 'Back', 'Left'), xs):
        win = np.zeros_like(m); win[:int(l[0][1]) - 4, int(x - half):int(x + half)] = True
        ids = [i + 1 for i in range(n) if sz[i] >= 200 and (win & (lab == i + 1)).sum() > 0.9 * sz[i]]
        body = np.isin(lab, ids)
        rows = np.where(body.any(1))[0]
        bottom = rows[-1]
        d = ndimage.distance_transform_edt(body)
        cx = float(np.where(d >= 0.7 * d.max())[1].mean())        # the torso's middle; the head stands over it
        w = 0.11 * (bottom - rows[0])
        top = np.where(body[:, int(cx - w):int(cx + w)].any(1))[0][0]
        out[nm] = (int(bottom - top + 1), int(body.sum()))
        marks.append((int(cx - w), int(cx + w), int(top), int(bottom)))
    if check:
        im = Image.fromarray(a.astype(np.uint8)); dr = ImageDraw.Draw(im)
        for x0, x1, t, b in marks:
            dr.rectangle((x0, t, x1, b), outline=(255, 60, 60))
        im.save(os.path.join(vision_dir(), 'identity-measure.png'))
    return out


def area(im):
    return float((np.asarray(im)[..., 3] > 0).sum())


def scales(pages, check=False, say=False):
    """pages: {key: page} -> ({key: frames}, {key: k page px a game px}); the slot pages' Idle and Fall first, any other page by its STAND frame
    against its view's Idle 1 (Prone 1 against the view's Fall 6)"""
    slot = chosen()
    t = turnaround(check)
    kt = t['Front'][0] / float(HEIGHT)
    cuts, K = {}, {}
    idle = {v: cut_page(slot[(v, 'Idle')], check) for v in VIEW.values()}
    kidle = {v: kt * np.sqrt(area(idle[v][0][1]) / np.mean([t[s][1] for s in TURNVIEW[v]])) for v in VIEW.values()}
    for key, pg in pages.items():
        frs = cuts[key] = cut_page(pg, check)
        v, act = pg['view'], pg['action']
        if act == 'Idle':
            K[key] = kt * np.sqrt(area(frs[0][1]) / np.mean([t[s][1] for s in TURNVIEW[v]]))
        elif act == 'Prone':
            fall = cut_page(slot[(v, 'Fall')], check)
            kf = kidle[v] * np.sqrt(area(fall[STAND['Fall'] - 1][1]) / area(idle[v][0][1]))
            K[key] = kf * np.sqrt(area(frs[0][1]) / area(fall[5][1]))
        else:
            K[key] = kidle[v] * np.sqrt(area(frs[STAND[act] - 1][1]) / area(idle[v][0][1]))
    if say:
        print('identity stills (page px: height hair to heels, filled area):', t)
        print('the stills at %.3f page px a game px (Front %d page px -> %d)' % (kt, t['Front'][0], HEIGHT))
        for key in sorted(K, key=lambda k: (pages[k]['action'], pages[k]['view'])):
            frs, pg = cuts[key], pages[key]
            grounds = ' '.join('%+d' % (f[3] - f[2][3]) for f in frs)
            print('  %-2s %-13s k %.3f  %-8s %s  (%d frames; above its band\'s ground, page px: %s)' % (pg['view'], pg['action'], K[key], pg['status'],
                                                                                            os.path.basename(pg['path'])[-34:], len(frs), grounds))
    return cuts, K


def measure(check=False, say=False):
    slot = chosen()
    return scales(slot, check, say)


# ---------------------------------------------------------------- the legs
HIS = {'S': ('R', 'L'), 'N': ('L', 'R')}       # facing the camera his right leg is on the screen's left; from behind, his left
DIR = {'S': (0, 1), 'N': (0, -1), 'E': (1, 0), 'SE': (0.894, 0.447), 'NE': (0.894, -0.447)}   # the walk's direction on the screen (x right, y down)


def footprints(al):
    """a figure's two footprints, the lowest first: [(x centre, bottom y)] -- the lowest opaque row of each column, a footprint the columns within 7 px
    of a local lowest, the second found clear of the first"""
    H, W = al.shape
    ys = np.array([np.where(al[:, x])[0][-1] if al[:, x].any() else -1 for x in range(W)])
    fp, taken = [], np.zeros(W, bool)
    for _ in range(2):
        cand = np.where((ys >= 0) & ~taken)[0]
        if not len(cand):
            break
        top = cand[np.argmax(ys[cand])]
        run = [top]; x = top - 1
        while x >= 0 and ys[x] >= ys[top] - 7 and not taken[x]: run.append(x); x -= 1
        x = top + 1
        while x < W and ys[x] >= ys[top] - 7 and not taken[x]: run.append(x); x += 1
        fp.append((float(np.mean(run)), int(ys[top])))
        taken[max(0, min(run) - 10):max(run) + 11] = True
    return fp


def legs(frs, view):
    """a walk's frames (page px) -> [(frame, the forward foot's side, the stride in page px)], and the number of times the side changes round the loop.
    The forward foot is the footprint further along the walk's direction; its side is which of the two it is across the walk -- facing S or N the
    screen's left or right (his R or L: HIS), in profile or on a diagonal the near or the far leg"""
    dx, dy = DIR[view]; px, py = -dy, dx
    out = []
    for nm, im, box, _ in frs:
        fp = footprints(np.asarray(im)[..., 3] > 0)
        if len(fp) < 2:
            out.append((nm, '?', 0)); continue
        (ax, ay), (bx, by) = fp
        fa, fb = ax * dx + ay * dy, bx * dx + by * dy
        fwd, oth = ((ax, ay), (bx, by)) if fa >= fb else ((bx, by), (ax, ay))
        across = (fwd[0] - oth[0]) * px + (fwd[1] - oth[1]) * py
        if view in HIS:
            side = HIS[view][0] if across < 0 else HIS[view][1]
        else:
            side = 'near' if across > 0 else 'far'
        out.append((nm, side, int(round(abs(fa - fb)))))
    seq = [s for _, s, _ in out]
    changes = sum(seq[i] != seq[i - 1] for i in range(len(seq)))
    return out, changes


def alternates(seq):
    """an alternating gait: the side changes twice round the loop and the shorter run is three frames or more"""
    n = len(seq); ch = sum(seq[i] != seq[i - 1] for i in range(n))
    return ch == 2 and min(seq.count(seq[0]), n - seq.count(seq[0])) >= 3


def walk_report():
    """every walk attempt of every view, its forward foot frame by frame; the walk as the sheet plays it last"""
    cands = candidates()
    for v in VIEW.values():
        for pg in cands.get((v, 'Walk'), []):
            fr, ch = legs(cut_page(pg), v)
            print('  walk %-2s %-8s %-46s ' % (v, pg['status'], (pg['note'] or os.path.basename(pg['path']))[:46]) +
                  ' '.join('%d%s' % (n, s[0]) for n, s, l in fr) + '   (%d changes)' % ch)
        seq = walk_frames(v, cands)
        if seq:
            fr, ch = legs([f for f, _, _ in seq], v)
            print('  walk %-2s PLAYS    %-46s ' % (v, '') + ' '.join('%d%s' % (n, s[0]) for n, s, l in fr) +
                  '   (%d changes: %s)' % (ch, 'ALTERNATES' if alternates([s for _, s, _ in fr]) else 'REPEATS a leg'))


# ---------------------------------------------------------------- the walks
def walk_frames(v, cands=None):
    """the walk as the sheet plays it in view v: [(frame, its page, k key)] -- WALKS' frames in its order (each its page's printed number), else the slot
    page's frames as printed; None where no attempt is drawn or the walk is left to `under`"""
    cands = cands or candidates()
    spec = O['walks'].get(v)
    if spec == 'under':
        return None
    if spec:
        by = {os.path.basename(pg['path']): pg for pg in cands.get((v, 'Walk'), [])}
        out = []
        for fname, n in spec['frames']:
            pg = by.get(fname)
            if not pg:
                raise SystemExit('WALKS %s: no attempt named %s' % (v, fname))
            fr = [f for f in cut_page(pg) if f[0] == n]
            if not fr:
                raise SystemExit('WALKS %s: %s has no frame %d' % (v, fname, n))
            out.append((fr[0], pg, (pg['path'], tuple(pg['bands']))))
        return out
    pg = chosen(cands).get((v, 'Walk'))
    return [(f, pg, (pg['path'], tuple(pg['bands']))) for f in cut_page(pg)] if pg else None


def walk_provenance(v, seq):
    spec = O['walks'].get(v)
    if not spec:
        return
    prov = {'view': v, 'sheet': O['name'], 'why': spec.get('why', ''),
            'changed': 'whole-frame reorder; no mirroring, warping, recolouring or part edit; each frame at its own page\'s scale, on its own lowest foot',
            'frames': [{'output_frame': i + 1, 'source': os.path.relpath(pg['path'], BAR).replace('\\', '/'), 'source_status': pg['status'],
                        'source_numbered_frame': f[0], 'source_box': list(f[2])} for i, (f, pg, _) in enumerate(seq)]}
    d = os.path.join(BAR, 'walks'); os.makedirs(d, exist_ok=True)
    json.dump(prov, open(os.path.join(d, '%s-%s-WALK-provenance.json' % (O['name'], v)), 'w'), indent=1)


# ---------------------------------------------------------------- the sheet
def game_size(img, k):
    w, h = img.size
    return img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')


def core_x(a):
    """x of the body's thick middle (the arms and the flail are thin), the steadiest thing frame to frame"""
    d = ndimage.distance_transform_edt(a[..., 3] > 0)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def place(a, x_ref, up, fw, fh, ax, ay):
    """a 1x RGBA array onto an fw x fh frame: x_ref at ax, the lowest opaque row `up` px above ay -> (frame, cut off?, (ox, oy) its offset)"""
    out = np.zeros((fh, fw, 4), dtype=np.uint8)
    bottom = np.where(a[..., 3].any(axis=1))[0][-1]
    ox, oy = int(round(ax - x_ref)), ay - bottom - up
    h, w = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(fh, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out, (a[..., 3] > 0).sum() > (out[..., 3] > 0).sum(), (ox, oy)


def views(check=False):
    """{view: {sheet row: [(1x RGBA array, its core x, px above the ground, its source frame, page px a game px, the page)]}} -- a view no delivery has
    drawn for a row is absent"""
    slot = chosen()
    pages = dict(slot)
    walkseq = {v: walk_frames(v) for v in VIEW.values()}
    for v, seq in walkseq.items():
        for f, pg, key in seq or []:
            pages[key] = pg
    cuts, K = scales(pages, check)
    out = {v: {} for v in FACING}
    for v in FACING:
        for eng, parts in ENGINE.items():
            if eng == 'walk':
                if not walkseq[v]:
                    continue
                walk_provenance(v, walkseq[v])
                src = [(f, K[key], 'own', pg) for f, pg, key in walkseq[v]]
            else:
                if not all((v, row) in slot for row, _, _ in parts):
                    continue
                src = []
                for row, which, ground in parts:
                    frs, k = cuts[(v, row)], K[(v, row)]
                    for n in (which or range(1, len(frs) + 1)):
                        src.append((frs[n - 1], k, ground, slot[(v, row)]))
            seq = []
            for (nm, im, box, floor), k, ground, pg in src:
                a = pix.pixelate(game_size(im, k), 1, do_lift=False)
                up = 0 if ground == 'own' else int(round((floor - box[3]) / k))
                seq.append((a, core_x(a), up, (nm, im, box), k, pg))
            out[v][eng] = seq
    return out


def build(check=False):
    name = O['name']
    hd = views(check)
    rise = [np.where(s[0][..., 3].any(1))[0] for v in hd.values() for fs in v.values() for s in fs]
    ups = [s[2] for v in hd.values() for fs in v.values() for s in fs]
    above = max(r[-1] + 1 - r[0] + u for r, u in zip(rise, ups))
    below = max(0, max(-u for u in ups))
    AY = int(np.ceil((above + 4) / 4.0)) * 4
    FH = int(np.ceil((AY + below + 4) / 8.0)) * 8
    frames, sizes, drawn, lost, grip = {}, {}, {}, [], {}
    for eng in ENGINE:
        per = [None] * 8
        for v, fs in FACING.items():
            if eng in hd[v]:
                for f in fs:
                    per[f] = hd[v][eng]
        have = [f for f in range(8) if per[f] is not None]
        counts = {len(per[f]) for f in have}
        if len(counts) != 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (eng, sorted(counts)))
        nfr = counts.pop()
        half = max(max(s[1], s[0].shape[1] - s[1]) for f in have for s in per[f])   # each row its own width, about the middle (a mirror keeps the foot)
        fw = max(64, int(np.ceil((2 * half + 4) / 8.0)) * 8)
        sizes[eng] = (fw, FH, fw // 2, AY)
        frames[eng], drawn[eng], grip[eng] = [], have, [None] * 8
        for f in range(8):
            row, gr = [], []
            for i in range(nfr):
                if per[f] is None:                          # no delivery has drawn it: left out (the engine plays `under`, or the nearest drawn facing)
                    row.append(np.zeros((FH, fw, 4), dtype=np.uint8))
                    continue
                a, cx, up, src, k, pg = per[f][i]
                mir = f in (1, 2, 3)
                if mir:
                    a, cx = a[:, ::-1], a.shape[1] - cx
                fr, gone, off = place(a, cx, up, fw, FH, fw // 2, AY)
                if gone:
                    lost.append('%s facing %d' % (eng, f))
                row.append(fr)
                if O['grips']:
                    gr.append((src, k, a.shape[1], off, mir))
            frames[eng].append(row)
            if O['grips'] and per[f] is not None:
                grip[eng][f] = gr
    if lost:
        raise SystemExit('cut off at the frame edges: ' + ', '.join(lost))
    for extra in NEW_ROWS:
        if extra not in pix.ANIM_ORDER:
            pix.ANIM_ORDER.append(extra)
    pix.write_sheet(name, frames, sizes['idle'][0], FH, sizes['idle'][0] // 2, AY, pix.top_of(frames['idle'][0], AY), sizes=sizes)
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for row, an in meta['anims'].items():
        an['fps'] = FPS[row]
        if row in RELEASE:
            an['release'] = RELEASE[row]
        if len(drawn[row]) < 8:
            an['drawn'] = drawn[row]
            if row == 'walk':
                an['under'] = UNDER
    used = sorted({(s[5]['view'], s[5]['action'], s[5]['status'], os.path.relpath(s[5]['path'], BAR).replace('\\', '/'))
                   for v in hd.values() for fs in v.values() for s in fs})
    meta['source'] = ('drawn by the art desk (Barley %s), cut and snapped by tools/barley-sheet.py %s; %d pages, %d of them attempts the desk marked broken or '
                      'did not select' % (O['look'], 'coat' if name == 'barley_p2' else 'chain', len({u[3] for u in used}),
                                          len({u[3] for u in used if u[2] != 'selected'})))
    if O['grips']:                                          # (each facing's frames one string, "lx ly rx ry flags" a frame and ";" between: data/sprites.js
        meta['grips'] = {row: [None if fr is None else ';'.join(' '.join('%g' % v for v in k) for k in fr) for fr in per]   # writes JSON a value a line)
                         for row, per in grips_of(grip, sizes).items()}
    json.dump(meta, open(meta_p, 'w'), indent=1)
    open_ = [(r, [FN[f] for f in range(8) if f not in drawn[r]]) for r in ENGINE if len(drawn[r]) < 8]
    print('  %s left out: %s' % (name, ', '.join('%s %s' % (r, ' '.join(fs)) for r, fs in open_) or 'nothing'))
    print('  attempts used that the desk marked broken or did not select: ' +
          (', '.join('%s %s' % (u[0], u[1]) for u in used if u[2] != 'selected') or 'none'))
    return name


# ---------------------------------------------------------------- the grips (the chain: his weapon drawn by the engine, js/sprites.js S.wield)
# The desk drew every chain page empty-handed for a weapon drawn by code (CUTTER-NOTES.md: "Measure hand centers, proposed shaft axes, release frames and
# occlusion from selected pixels ... Test code weapon overlays frame by frame"). In the mail outfit his only bare skin is his face, his neck and his two
# fists, so the fists are found by colour on each source frame: skin (bright, half-saturated orange) not the hair's deeper gold, the face dropped (the
# skin blob that touches the hair below its middle). Two fists apart: the shaft runs through both, the upper one leading (the guard's fist by the hinge),
# or of two level the one further from the chest. Two together (one blob twice a fist, or two within a fist's width): the shaft runs from his chest
# out through them. One seen (the far fist hidden by the body, N and NE): the other is set at his middle in front of the body, and the shaft drawn under
# him. A row where a hand lets go to do something (Interact, UseItem, Victory): the hand that stays holds the weapon at the guard's angle. A row on the
# ground (hurt from frame 3, prone, sit, getup to frame 4): the weapon lies on the floor beside him. Each frame stored as [lead x, lead y, rear x,
# rear y, flags] in game px from the frame's foot (ax, ay); flags 1 drawn under the figure, 2 the lead fist on the shaft (drawn over it), 4 the rear
# fist on it, 8 on the floor. GRIPFIX overrides a frame by hand, (view, row, frame from 1): [lead x, lead y, rear x, rear y] in source px of the cut
# frame (the review page names them).
HELD = ['idle', 'walk', 'attack', 'attack2', 'defend', 'flinch', 'secondwind', 'actionsurge', 'victory', 'interact', 'useitem']
LETGO = {'victory', 'interact', 'useitem'}
GROUND = {'hurt': lambda i, n: i >= 2, 'prone': lambda i, n: True, 'sit': lambda i, n: True, 'getup': lambda i, n: i < n - 2}
BACK = {'N', 'NE'}
GRIPFIX = {}


def _hsv(a):
    rgb = a[..., :3].astype(np.float64) / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1)
    c = mx - mn
    s = np.where(mx > 0, c / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    cc = np.maximum(c, 1e-6)
    h = np.where(mx == r, ((g - b) / cc) % 6, np.where(mx == g, (b - r) / cc + 2, (r - g) / cc + 4)) / 6.0
    return h, s, mx


def hands(im, Hs=None):
    """a source frame -> (fists [(x, y, area)] largest first, chest (x, y), middle (x, y), figure height) in page px; Hs his standing height on this
    page (the head is looked for where it stands over his feet; without it, the frame's own height)"""
    a = np.asarray(im)
    al = a[..., 3] > 0
    h, s, v = _hsv(a)
    ys = np.where(al.any(1))[0]; top, bot = ys[0], ys[-1]
    Hs = Hs or (bot - top)
    r = max(1, int(round(Hs / 110.0)))                      # (about 3 page px on a 330 px figure)
    warm = al & (v > 0.62) & (s > 0.28) & (h > 0.04) & (h < 0.14)   # skin and the hair's gold: the mail's ring glints are specks, opened away; a fist's
    warm[int(bot - 0.30 * Hs):] = False                     # knuckles and fingers, parted by their outline, closed into one (the boots: no fist so low)
    warm = ndimage.binary_opening(warm, iterations=r)
    warm = ndimage.binary_closing(warm, iterations=2 * r)
    d = ndimage.distance_transform_edt(al)
    core = np.where(d >= 0.7 * d.max())
    mid = (float(core[1].mean()), float(core[0].mean()))
    # the head: every warm piece centred in the box where a head stands (over his middle, the top quarter of his standing height, a crouch allowed:
    # hair, face and neck, which the closing may leave in pieces); fists raised over it (an overhead's load) are what of the head's blob stands
    # higher than his hair can, parted from it at that line
    y0, y1 = int(bot - 1.03 * Hs), int(bot - 0.74 * Hs)
    hx0, hx1 = mid[0] - 0.13 * Hs, mid[0] + 0.13 * Hs
    sl, sn = ndimage.label(warm, structure=np.ones((3, 3)))
    for i in range(sn):
        piece = sl == i + 1
        py, px = np.where(piece)
        cy, cx = py.mean(), px.mean()
        hit = (piece[max(0, y0):y1, max(0, int(hx0)):int(hx1)]).any()
        if (y0 <= cy <= y1 and hx0 <= cx <= hx1) or (hit and py.min() < y0 and cy > y0 - 0.05 * Hs):
            above = piece.copy(); above[max(0, y0):] = False     # the part over his hair line stays (a fist), the rest is the head
            warm &= ~piece
            warm |= above
    sl, sn = ndimage.label(warm, structure=np.ones((3, 3)))
    blobs = []
    for i in range(sn):
        piece = sl == i + 1
        n = int(piece.sum())
        if n < (Hs / 19.0) ** 2:
            continue
        py, px = np.where(piece)
        cv = np.cov(np.vstack([px, py])) if n > 2 else np.eye(2)
        ev, evec = np.linalg.eigh(cv)                       # (its long way: two fists stacked in one blob)
        blobs.append((float(px.mean()), float(py.mean()), n, float(np.sqrt(max(ev[1], 1e-6) / max(ev[0], 1e-6))), (float(evec[0, 1]), float(evec[1, 1]))))
    blobs.sort(key=lambda b: -b[2])
    chest = (mid[0], bot - 0.70 * Hs)
    return blobs[:3], chest, mid, Hs


def together(T, chest, fist, under):
    """two fists as one: the shaft from his chest out through them"""
    u = np.array(T) - np.array(chest); u = u / max(1e-6, np.hypot(*u))
    w = 0.5 * np.sqrt(fist)
    return (T[0] + u[0] * w, T[1] + u[1] * w), (T[0] - u[0] * w, T[1] - u[1] * w), under | 6, 'together'


def grip_frame(im, fist, view, Hs, guard=True):
    """one held frame -> (lead (x, y), rear (x, y), flags, how) in page px of the cut frame"""
    fs, chest, mid, H = hands(im, Hs)
    fs = [f for f in fs if f[2] >= 0.35 * fist]
    under = 1 if view in BACK else 0
    if len(fs) >= 2 and np.hypot(fs[0][0] - fs[1][0], fs[0][1] - fs[1][1]) > 1.1 * np.sqrt(fist):
        A, B = fs[0][:2], fs[1][:2]
        dx, dy = B[0] - A[0], B[1] - A[1]
        if abs(dy) > 0.35 * np.hypot(dx, dy):
            L, R = (A, B) if A[1] < B[1] else (B, A)
        else:
            L, R = (A, B) if abs(A[0] - chest[0]) > abs(B[0] - chest[0]) else (B, A)
        return L, R, under | 6, 'two'
    if fs and (fs[0][2] > 1.5 * fist or len(fs) >= 2):
        T = fs[0][:2] if len(fs) < 2 else ((fs[0][0] + fs[1][0]) / 2, (fs[0][1] + fs[1][1]) / 2)
        if guard and len(fs) < 2 and fs[0][3] > 1.7:        # one long blob in a guard: two fists along it, the shaft its long way, the upper end leading (a blow's
                                                            # fists together point it from his chest out through them)
            ex, ey = fs[0][4]; ex, ey = (ex, ey) if ey < 0 or (ey == 0 and ex > 0) else (-ex, -ey)
            w = 0.5 * np.sqrt(fs[0][2])
            return (T[0] + ex * w, T[1] + ey * w), (T[0] - ex * w, T[1] - ey * w), under | 6, 'stacked'
        return together(T, chest, fist, under)
    al = np.asarray(im)[..., 3] > 0; ys = np.where(al.any(1))[0]
    if not fs and ys[0] < ys[-1] - 1.06 * Hs:              # none found, and he stands taller than himself: his fists are his top (an overhead's load on the hair)
        tx = np.where(al[ys[0]:ys[0] + int(0.06 * Hs)].any(0))[0].mean()
        fs = [(tx, ys[0] + 0.04 * Hs, 2 * fist, 1.0, (0.0, 1.0))]
        return together(fs[0][:2], chest, fist, under)
    if fs:
        V = fs[0][:2]; Hd = (mid[0], mid[1] - 0.05 * H)
        L, R = (V, Hd) if V[1] <= Hd[1] else (Hd, V)
        return L, R, 1 | (2 if L is V else 4), 'one seen'
    Hd = (mid[0], mid[1] - 0.05 * H)
    return (Hd[0], Hd[1] - 0.2 * H), Hd, 1, 'none seen'


def grips_of(grip, sizes):
    """{row: [8 facings: [frames: [lead x, lead y, rear x, rear y, flags]] or null]} -- grip[row][facing] = [(src frame, k, width, (ox, oy), mirrored)]"""
    out, fist, tall, guardu = {}, {}, {}, {}
    for row, per in grip.items():
        fw, fh, ax, ay = sizes[row]
        rows = []
        for f in range(8):
            if per[f] is None:
                rows.append(None); continue
            view = FN[f] if f not in (1, 2, 3) else {1: 'SE', 2: 'E', 3: 'NE'}[f]
            frs, n = [], len(per[f])
            guard = None
            for i, ((nm, im, box), k, wid, (ox, oy), mir) in enumerate(per[f]):
                def game(p):
                    gw = max(1, round(im.size[0] / k)); gx = p[0] * gw / im.size[0]; gy = p[1] * max(1, round(im.size[1] / k)) / im.size[1]
                    if mir:
                        gx = wid - gx
                    return round(ox + gx - ax, 1), round(oy + gy - ay, 1)
                g = GROUND.get(row)
                if row not in HELD and not (g and not g(i, n)):
                    side = -1 if mir else 1
                    frs.append([side * 9, -2, side * -11, 1, 9]); continue
                if view not in fist and row == 'idle':          # his standing height in this view, game px (its Idle 1), and a fist's size
                    i1 = np.asarray(per[f][0][0][1])[..., 3] > 0; r1 = np.where(i1.any(1))[0]
                    tall[view] = (r1[-1] - r1[0]) / per[f][0][1]
                    fs, _, _, _ = hands(per[f][0][0][1], tall[view] * per[f][0][1])
                    fist[view] = float(np.mean([b[2] for b in fs[:2]])) if fs else None
                Hs = tall[view] * k                             # ... on this page, page px
                fx = GRIPFIX.get((view, row, i + 1))
                if fx:
                    L, R, fl, how = (fx[0], fx[1]), (fx[2], fx[3]), (1 if view in BACK else 0) | 6, 'fixed'
                else:
                    L, R, fl, how = grip_frame(im, fist.get(view) or (Hs / 12.0) ** 2, view, Hs, guard=row in ('idle', 'walk') or i in (0, n - 1))
                gL, gR = game(L), game(R)
                if row in LETGO:                             # a hand lets go: the one that stays holds the weapon at the guard's angle
                    if guard is None:
                        guard = (gL, gR)
                    else:
                        dL = np.hypot(gL[0] - guard[0][0], gL[1] - guard[0][1]); dR = np.hypot(gR[0] - guard[1][0], gR[1] - guard[1][1])
                        if max(dL, dR) > 3:
                            vec = (guard[0][0] - guard[1][0], guard[0][1] - guard[1][1])
                            # the hand nearer its own guard place stays on the shaft
                            near = min((np.hypot(p[0] - q[0], p[1] - q[1]), j, p) for j, q in enumerate(guard) for p in (gL, gR))
                            stay = near[2]
                            if near[1] == 0:
                                gL, gR = stay, (round(stay[0] - vec[0], 1), round(stay[1] - vec[1], 1)); fl = (fl & 1) | 2
                            else:
                                gR, gL = stay, (round(stay[0] + vec[0], 1), round(stay[1] + vec[1], 1)); fl = (fl & 1) | 4
                if row not in ('idle', 'walk') and i in (0, n - 1) and how in ('together', 'one seen', 'none seen') and view in guardu:
                    gu = guardu[view]                           # a guard frame read uncertainly: the shaft at the view's idle guard angle, through the lead fist
                    gR = (round(gL[0] - gu[0], 1), round(gL[1] - gu[1], 1))
                if row == 'idle' and i == 0 and view not in guardu:
                    guardu[view] = (gL[0] - gR[0], gL[1] - gR[1])
                frs.append([gL[0], gL[1], gR[0], gR[1], fl])
            rows.append(frs)
        out[row] = rows
    return out


FN = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']


def facings():
    """dev/visions/barley/<sheet>/facings-<row>.png: every facing of every row as written, S SW W NW N NE E SE top to bottom, 2x on a grey floor (the foot's
    line drawn; a facing left out empty); lineup.png: idle frame 1 in all eight facings beside the four heroes' sheets (S and E), 4x"""
    name = O['name']
    d = vision_dir()
    m = json.load(open(os.path.join(ROOT, 'deep16', 'art', name + '.json')))
    im = Image.open(os.path.join(ROOT, 'deep16', 'art', name + '.png')).convert('RGBA')
    for row, an in m['anims'].items():
        fw, fh, n, y, ay = an.get('fw', m['fw']), an.get('fh', m['fh']), an['frames'], an['y'], an.get('ay', m['ay'])
        cv = Image.new('RGBA', (fw * n + 4 * (n + 1) + 24, fh * 8), (70, 74, 70, 255))
        dr = ImageDraw.Draw(cv)
        for f in range(8):
            dr.line([(0, f * fh + ay + 1), (cv.width, f * fh + ay + 1)], fill=(110, 114, 110, 255))
            dr.text((2, f * fh + 2), FN[f], fill=(255, 255, 255, 255) if f in an.get('drawn', range(8)) else (255, 120, 120, 255))
            for i in range(n):
                cv.alpha_composite(im.crop((i * fw, y + f * fh, (i + 1) * fw, y + (f + 1) * fh)), (24 + 4 + i * (fw + 4), f * fh))
        cv.resize((cv.width * 2, cv.height * 2), Image.NEAREST).save(os.path.join(d, 'facings-%s.png' % row))
    cells = []
    an = m['anims']['idle']
    for f in range(8):
        cells.append((im.crop((0, an['y'] + f * an['fh'], an['fw'], an['y'] + (f + 1) * an['fh'])), an['ay']))
    for other in ('barley_p0', 'barley_p2', 'aurdin_p2', 'vivian_p0', 'lymen_p0'):
        if other == name:
            continue
        g = json.load(open(os.path.join(ROOT, 'deep16', 'art', other + '.json')))
        gi = Image.open(os.path.join(ROOT, 'deep16', 'art', other + '.png')).convert('RGBA')
        ga = g['anims']['idle']
        gfw, gfh, gay = ga.get('fw', g['fw']), ga.get('fh', g['fh']), ga.get('ay', g['ay'])
        for f in (0, 6):
            cells.append((gi.crop((0, ga['y'] + f * gfh, gfw, ga['y'] + (f + 1) * gfh)), gay))
    top = max(ay for _, ay in cells)
    cw = max(c.width for c, _ in cells)
    cv = Image.new('RGBA', (cw * len(cells), top + 16), (70, 74, 70, 255))
    for i, (c, ay) in enumerate(cells):
        cv.alpha_composite(c.crop((0, 0, c.width, min(c.height, ay + 12))), (i * cw + (cw - c.width) // 2, top - ay))
    ImageDraw.Draw(cv).line([(0, top + 1), (cv.width, top + 1)], fill=(200, 60, 60, 255))
    cv.resize((cv.width * 4, cv.height * 4), Image.NEAREST).save(os.path.join(d, 'lineup.png'))
    print('  wrote', d)


if __name__ == '__main__':
    args = sys.argv[1:]
    outfits = [o for o in OUTFITS if o in args] or list(OUTFITS)
    for o in outfits:
        use(o)
        print('%s (%s):' % (o, O['name']))
        if 'measure' in args:
            measure(check='check' in args, say=True)
        elif 'legs' in args:
            walk_report()
        else:
            build(check='check' in args)
            if 'check' in args:
                facings()

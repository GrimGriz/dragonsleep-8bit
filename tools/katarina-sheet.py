"""DEEP16 pipeline 2 (generated art): Katarina's town figure at the Halfway Inn -> katarina_p1, in all eight facings; her fight figure -> katarina_p2.

    python tools/katarina-sheet.py [katarina_p1|katarina_p2]          (writes deep16/art/<name>.png/.json; both with no name)
    python tools/katarina-sheet.py [name] check                       (also deep16/art-src/katarina/<name>-review.png)

Asked in art-wanted section 35 (11-04, the Inn seat); cut 11-05 by cutter-1105 on the lanes desk's relay of Griz's "cutter has Katarina it doesn't know
about yet". The art desk's HALFWAY-INN-KATARINA-TOWN, sorted to deep16/_src/katarina/INN-TOWN-1105/: one page a view, H07 S, H08 SE, H09 E, H10 NE (its
corrected rear idle), H11 N; three rows a page -- Idle 4 (the book held to her chest), Walk 8 (the satchel), Sit 4 (writing on a bench, the bench drawn
with her and kept, its geometry still) -- each row's label printed under it. Its FRAME-MAP.md is a table of each row's y window and its frames'
approximate x boundaries (every page the same 1774 x 887 layout): WINDOWS below is that table, and `trim` drops a neighbour's edge reaching in at a
window's side.

The cut is tools/vivian-sheet.py's (loaded here): the navy by the window's edges, one scale a page by its idle to TALL (the inn's women, 47 -- folkwoman_p1,
elsbethhome_p1), each frame on its lowest row by its torso's middle, SW W NW mirrored, boxed down, snapped to the 64 (red and fire left out: her browns),
outlined. Its own notes, kept in `hold`: the walk's leads repeat (1 against 5, 3 against 7) and the knees lift high; the sit's pen moves are slight.

katarina_p2, HER FIGHT FIGURE (11-11, the cutter of 11-10 on the lanes desk's relay; Griz 11-11: "art request cleric-appropriate fight poses for Katarina in the
outbox", then "first Kat SE should be in fresh"): the art desk's KATARINA-COMBAT-HEAD-1-SE, sorted to deep16/_src/katarina/COMBAT-SE-1111/ -- art-wanted section
39's HEAD 1, SE only (NE, S, E and N still open with the art desk): seven pages, one action each -- Idle 4 (armed: the shield up, the mace low), Attack 6 (the
blow lands on frame 3), Cast 6 (the mirror held out over the shield), Cast Up 6 (lifted high), Flinch 4, Fall 6 (the mace let go), Prone 1. Its FRAME-MAP.json
gives each drawing's window (the prone's widened here: it cut her hair at the top). Each page drawn at its own size, so: the idle's page by its idle to 47, as
her town figure; the attack's, the cast's and the cast up's by their first frame (the same guard) to the idle's first; the flinch's by its last (the guard
again); the fall's at the attack's (the same page format, its first frame a recoil, not the guard); the prone by its width to the fall's last (the art desk's
note: "normalize by body/head scale to Fall6"). SE as drawn, SW its mirror; every row carries `drawn` [SW, SE], so another facing shows the nearer of the two
(js/sprites.js) till the other four views come -- the cut re-run then. Her walk is her town walk, every facing, copied whole from katarina_p1 (the ask: "her
town Walk as its walk"). Worn by the Pocket DM's Katarina (js/classes.js NPC.NAMED katarina).
"""
import importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

PAGES = {'S': 'H07-S.png', 'SE': 'H08-SE.png', 'E': 'H09-E.png', 'NE': 'H10-NE.png', 'N': 'H11-N.png'}
ROWX = {'idle': ((0, 257), [340, 600, 885, 1170, 1440]), 'walk': ((300, 542), [30, 240, 455, 670, 885, 1100, 1315, 1530, 1750]),
        'sit': ((593, 840), [340, 600, 885, 1170, 1440])}
WINDOWS = [('INN-TOWN-1105', view, row, i, fn, (xs[i], y[0], xs[i + 1], y[1]))
           for view, fn in PAGES.items() for row, (y, xs) in ROWX.items() for i in range(len(xs) - 1)]

VS.LOOKS['katarina_p1'] = dict(
    src='katarina', windows=WINDOWS, trim=True, tall=47, avoid=['red', 'fire'], name='Katarina',
    rows=[('idle', 4, 4), ('walk', 10, 8), ('sit', 2, 4)],
    hold=['walk: the same lead repeats (1 against 5, 3 against 7) and the knees lift higher than close steps (the art desk\'s own note)',
          'sit: the bench drawn with her, its geometry still; where a scene draws its own bench, mask the overlap (the art desk\'s own note)'],
    source='drawn by the art desk (HALFWAY-INN-KATARINA-TOWN, 11-05: art-wanted section 35, her town figure in five views), cut by tools/katarina-sheet.py over '
           'tools/vivian-sheet.py; SW W NW mirrored')

# her fight figure: the frame map's windows, a row a page
import json
from PIL import Image
import numpy as np
COMBAT = 'COMBAT-SE-1111'
PAGEROW = {1: 'idle', 2: 'attack', 3: 'cast', 4: 'castup', 5: 'flinch', 6: 'hurt', 7: 'prone'}
WIDEN = {(7, 1): (440, 180, 1340, 690)}                # (the prone's window began at y 240, through her hair: widened, the label and the number still outside it)


def combat_windows():
    fm = json.load(open(os.path.join(VS.pix.SRC, 'katarina', COMBAT, 'FRAME-MAP.json'), encoding='utf-8'))
    return [(COMBAT, pg['facing'], PAGEROW[pg['page']], fr['frame'] - 1, pg['filename'], WIDEN.get((pg['page'], fr['frame']), tuple(fr['window_xyxy'])))
            for pg in fm for fr in pg['frames']]


VS.LOOKS['katarina_p2'] = dict(
    src='katarina', windows=combat_windows() if os.path.isdir(os.path.join(VS.pix.SRC, 'katarina', COMBAT)) else [], trim=True, tall=47, avoid=['red', 'fire'], name='Katarina',
    rows=[('idle', 4, 4), ('attack', 10, 6), ('cast', 10, 6), ('castup', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    match={'attack': ('idle', 0), 'cast': ('idle', 0), 'castup': ('idle', 0), 'flinch': ('idle', 0, 3), 'prone': ('hurt', 5, 0, 'w')},
    scaleas={'hurt': 'attack'}, ground={('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)}, release={'attack': 2, 'cast': 3, 'castup': 3},
    hold=['SE only (HEAD 1): NE, S, E and N still open with the art desk -- every row drawn [SW, SE], another facing shows the nearer of the two',
          'idle: breath and head height vary a little, the jerkin seam and belt pouches drift; no registered loop claimed (the art desk\'s own note)',
          'attack: the strike path is short between frames 2 and 3 (the art desk\'s own note)',
          'cast up: frame 6 leaves her hand near her throat, not back behind the shield, into the idle (the art desk\'s own note)',
          'fall and prone: she ends lying head to screen-left, feet to screen-right -- across the screen, not along a diagonal (the art desk\'s own note)',
          'palette: snapped to the 64 here; the art desk\'s pages were not (its PALETTE-AUDIT)'],
    source='drawn by the art desk (KATARINA-COMBAT-HEAD-1-SE, 11-11: art-wanted section 39, HEAD 1 SE of five), cut by tools/katarina-sheet.py over tools/vivian-sheet.py; '
           'SW mirrored; her walk her town walk (katarina_p1), every facing')


def borrow_walk(look, frm='katarina_p1'):
    """her town walk, every facing, copied whole from katarina_p1 into the fight figure's sheet (same FH and AY: the same cutter)"""
    art = os.path.join(ROOT, 'deep16', 'art')
    src = json.load(open(os.path.join(art, frm + '.json'), encoding='utf-8')); w = src['anims']['walk']
    a = np.asarray(Image.open(os.path.join(art, frm + '.png')).convert('RGBA'))
    blk = a[w['y']:w['y'] + 8 * VS.FH, :w['fw'] * w['frames']]
    meta = json.load(open(os.path.join(art, look + '.json'), encoding='utf-8'))
    b = np.asarray(Image.open(os.path.join(art, look + '.png')).convert('RGBA'))
    W = max(b.shape[1], blk.shape[1]); y0 = b.shape[0]
    out = np.zeros((y0 + blk.shape[0], W, 4), np.uint8); out[:y0, :b.shape[1]] = b; out[y0:, :blk.shape[1]] = blk
    Image.fromarray(out, 'RGBA').save(os.path.join(art, look + '.png'), optimize=True)
    anims = meta['anims']; ent = dict(w, y=y0); ent.pop('drawn', None)
    meta['anims'] = dict([('idle', anims['idle']), ('walk', ent)] + [(k, v) for k, v in anims.items() if k != 'idle'])
    with open(os.path.join(art, look + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: walk copied from %s (%d frames, every facing), sheet %dx%d' % (look, frm, w['frames'], W, out.shape[0]))


if __name__ == '__main__':
    for lk in [x for x in sys.argv[1:] if x in ('katarina_p1', 'katarina_p2')] or ['katarina_p1', 'katarina_p2']:
        VS.cut(lk)
        if lk == 'katarina_p2':
            borrow_walk(lk)

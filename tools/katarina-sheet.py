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

katarina_p2, HER FIGHT FIGURE (11-11, the cutter of 11-10; Griz 11-11: "art request cleric-appropriate fight poses for Katarina in the outbox", then "first Kat
SE should be in fresh", then to the art desk "lose the mirror casts and just do the mace-up one, it's combat so low res and we're getting arm switches and shield
misplacements on the mirror cast", and to the cutter "the mirror cast was really bad, so i had the art do a 'raised mace' cast move instead, in Fresh"): the art
desk's KATARINA-COMBAT-FULL-SHEETS, sorted to deep16/_src/katarina/COMBAT-FULL-1111/ -- art-wanted section 39 whole, five views (HEAD 1 SE, 2 NE, 3 S, 4 E,
5 N), six pages a view, one action a page: Idle 4 (armed: the shield up, the mace low), Attack 6 (the blow lands on frame 3), Mace Up 6 (the mace raised high in
the right hand, the shield kept in guard -- both `cast` and `castup`, one sequence, as he ruled; the mirror a pendant now, held by no row), Flinch 4, Fall 6
(the mace let go), Prone 1. (The SE-only package of the same morning, COMBAT-SE-1111, with its mirror casts, is superseded: kept as it came, cut no more.)
Its FRAME-MAP.json gives each drawing a window and the art desk's own box round it: the window is widened to hold the box (a raised mace ran out of the top),
and only the pieces that touch the box are kept (a window holds the tail of a printed label, or a frame number). Each page drawn at its own size, so: the
idle's page by its idle to 47, as her town figure; the attack's and the mace up's by their first frame (the same guard) to the idle's first; the flinch's by
its last (the guard again); the fall's at the attack's (its first frame a recoil, not the guard); the prone by its width to the fall's last (the art desk's
note: "normalize by body/head scale to Fall6"). S SE E NE N as drawn, SW W NW their mirrors. Her walk is her town walk, every facing, copied whole from
katarina_p1 (the ask: "her town Walk as its walk"). Worn by the Pocket DM's Katarina (js/classes.js NPC.NAMED katarina).
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
COMBAT = 'COMBAT-FULL-1111'
MARGIN = 24                                           # (the window widened to the art desk's box and this much round it; pieces touching the box itself kept)


def combat_windows():
    fm = json.load(open(os.path.join(VS.pix.SRC, 'katarina', COMBAT, 'FRAME-MAP.json'), encoding='utf-8'))
    out = []
    for pg in fm['rows']:
        W, H = pg['source_size']
        for fr in pg['frames']:
            w, d = fr['source_window_xyxy'], fr['diagnostic_foreground_box_xyxy']
            win = (max(0, min(w[0], d[0] - MARGIN)), max(0, min(w[1], d[1] - MARGIN)), min(W, max(w[2], d[2] + MARGIN)), min(H, max(w[3], d[3] + MARGIN)))
            out.append((COMBAT, pg['facing'], pg['engine_rows'][0], fr['frame'] - 1, pg['file'], win, tuple(d)))   # (the mace up cut once as `cast`; `castup` names the same frames -- finish())
    return out


VS.LOOKS['katarina_p2'] = dict(
    src='katarina', windows=combat_windows() if os.path.isdir(os.path.join(VS.pix.SRC, 'katarina', COMBAT)) else [], trim=True, tall=47, avoid=['red', 'fire'], name='Katarina',
    rows=[('idle', 4, 4), ('attack', 10, 6), ('cast', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    match={'attack': ('idle', 0), 'cast': ('idle', 0), 'flinch': ('idle', 0, 3), 'prone': ('hurt', 5, 0, 'w')},
    scaleas={'hurt': 'attack'}, ground={('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)}, release={'attack': 2, 'cast': 3},
    hold=['cast and castup: one sequence, the Mace Up, as he ruled -- the mirror casts lost',
          'idle: breath and head height vary a little, the jerkin seam and belt pouches drift; the rear idles barely move; no registered loop claimed (the art desk\'s own note)',
          'attack: NE strikes out to the right more than its feet face; N\'s frame 3 keeps the mace high, the downstroke reads on 4 (the art desk\'s own note)',
          'fall and prone: SE, S and E end lying head left, feet right; NE the same from behind; N head right -- across the screen, not along each diagonal (the art desk\'s own note)',
          'palette: snapped to the 64 here; the art desk\'s pages were not (its PALETTE-AUDIT)'],
    source='drawn by the art desk (KATARINA-COMBAT-FULL-SHEETS, 11-11: art-wanted section 39, all five views, the Mace Up for both casts on his word), cut by tools/katarina-sheet.py over tools/vivian-sheet.py; '
           'SW W NW mirrored; her walk her town walk (katarina_p1), every facing')


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
    if 'cast' in meta['anims'] and 'castup' not in meta['anims']:   # (his "just do the mace-up one": castup is the cast's own frames, the same block of the sheet)
        meta['anims'] = dict(sum([[(k, v)] + ([('castup', dict(v))] if k == 'cast' else []) for k, v in meta['anims'].items()], []))
    with open(os.path.join(art, look + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: walk copied from %s (%d frames, every facing), sheet %dx%d' % (look, frm, w['frames'], W, out.shape[0]))


if __name__ == '__main__':
    for lk in [x for x in sys.argv[1:] if x in ('katarina_p1', 'katarina_p2')] or ['katarina_p1', 'katarina_p2']:
        VS.cut(lk)
        if lk == 'katarina_p2':
            borrow_walk(lk)

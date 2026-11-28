"""DEEP16 pipeline 2 (generated art): the crewman's recostume on realistic proportions -> crewman_p1 (worn by Thug, Stable Fighter, Crewman and Card Bruiser).

    python tools/crewman-sheet.py                (writes deep16/art/crewman_p1.png/.json)
    python tools/crewman-sheet.py check          (also deep16/art-src/crewman/crewman_p1-review.png)

The art desk's RECOSTUME-1127, sorted to deep16/_src/crewman/RECOSTUME-1127/: five views a page set (HEAD 1 S, 2 SE, 3 E, 4 rear NE, 5 N), Idle 4,
Walk 8 and Attack 8 each, the figure on a dark-navy matte; its FRAME-MAP.csv gives every drawing a source-pixel window (right and bottom exclusive, with
the cutter's clearance, so a window may hold a printed frame number, a label or a neighbour's edge). The cut is tools/vivian-sheet.py's (loaded here), the
window table read from the CSV below; SW W NW are the mirrors of SE E NE (RULED 10-14). Rows: idle 4 at 6 fps, walk 8 at 10, attack 8 at 12 -- the old
sheet's playback, and the cutter's own 64-high cell with the soles on row 61 (the old cell was 96x96, anchor (48,84), idle 8 frames).

The choices:
  tall 48      the notes: about 50 px crown to sole on the neutral adult (the old figure's big head stood at 57); one scale a page by its idle's median height.
               48, not 50: the cutter's `tall` is the figure inside its outline, and the outline adds a row above and below -- 48 stands 50 drawn, as folkman_p1
               and the hired sword's guard_p1 do (the desk, 11-27: the runner's 50 stood 52).
  match        walk and attack pages hold no idle: each is scaled so its frame 1 (the low ready of the attack, the first stride of the walk) stands as tall
               as the view's idle frame 1 -- both are crown to sole with the axe low and no raised piece over the head, so the head comes out the idle's size
               (the review's head measure, in the report). Not the page's tallest frame: the raised axe of the wind-up would count as body height.
  trim         the windows are cut on approximate boundaries: a neighbour's edge reaching in at a side goes, the frame's own pieces stay.
  specks       the printed digits and labels: see `clean` -- any piece of the keyed figure that is small and not within reach of the figure's body is dropped
               before the cutter sees it (the cutter's own filter, 0.5% of the biggest piece, lets a digit through; an axe head or a hand is joined to the body
               by the arm or haft, so it is never "apart"). Only one frame needed it (SE idle 1, a label in the window's top rows).
  bgtol 12     the matte's own RGB variation is at most 7 from the page's navy (measured on all 15 pages), but the dark brown trousers, hair and boot leather sit
               within the cutter's default 30 of it: at 30 whole stretches of leg and hair were keyed out as matte (the legs came out as thin ghosts, the
               lowest boot row dropped and the figure's sole line with it). 12 clears the matte and keeps the clothes.
  release 5    the attack's blow is drawing 6 (zero-based 5): the notes' "first lowered chop" (js/battle.js reads it).
  avoid        none: his kit is slate-blue and leather, no reds to guard.
"""
import csv, importlib.util, os, sys
import numpy as np
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

BATCH = 'RECOSTUME-1127'
DELIVERY = os.path.join(VS.pix.SRC, 'crewman', BATCH)


def windows():
    out = []
    for r in csv.DictReader(open(os.path.join(DELIVERY, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
        box = (int(r['x0']), int(r['y0']), int(r['x1_exclusive']), int(r['y1_exclusive']))
        out.append((BATCH, r['facing'], r['action'], int(r['index']), r['source'], box))
    return out


_figure = VS.figure
GAP = 14        # source px: a piece this near the body (dilated) is the figure's own


def clean(a, trim=False, box=None, tol=None):
    """the cutter's figure(), then drop printed text: a piece not joined to the main piece, within GAP px of it, and small (under 4% of its size)"""
    m = _figure(a, trim, box, tol)
    lab, n = ndimage.label(m)
    if n < 2:
        return m
    sz = ndimage.sum(m, lab, range(1, n + 1)); big = int(np.argmax(sz)) + 1
    near = ndimage.binary_dilation(lab == big, iterations=GAP)
    keep = [i + 1 for i in range(n) if i + 1 == big or sz[i] >= 0.04 * sz.max() or (near & (lab == i + 1)).any()]
    return np.isin(lab, keep)


VS.figure = clean

VS.LOOKS['crewman_p1'] = dict(
    src='crewman', windows=windows(), trim=True, bgtol=12, tall=48, name='Crewman',
    rows=[('idle', 6, 4), ('walk', 10, 8), ('attack', 12, 8)],
    match={'walk': ('idle', 0), 'attack': ('idle', 0)}, release={'attack': 5},
    hold=['rear NE walk: two separately drawn bands, a common scale and foot line; the lead-foot change between frames 1 and 5 is subtle in the overlapping legs -- check it in playback (the art desk\'s own note)',
          'attack: the high wind-up is drawings 4-5, the first low chop drawing 6 (release 5); engine hit timing to be verified in playback (the art desk\'s own note)'],
    source='drawn by the art desk (RECOSTUME-1127: the crewman on realistic proportions -- the ART-122 generic man\'s face, brown hair and beard, the slate-blue and leather kit and '
           'right-hand axe), cut by tools/crewman-sheet.py over tools/vivian-sheet.py; SW W NW mirrored; worn by Thug, Stable Fighter, Crewman and Card Bruiser')

if __name__ == '__main__':
    VS.cut('crewman_p1')

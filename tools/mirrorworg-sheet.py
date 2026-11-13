"""DEEP16 pipeline 2 (generated art): the mirror worg in its three states -> deep16/art/mirrorworg_p1 (Normal, worn by the foe),
mirrorworg_emaciated_p1 and mirrorworg_overcharged_p1 (cut and registered; nothing wears them yet), all eight facings.

    python tools/mirrorworg-sheet.py            (writes the three sheets' .png/.json)
    python tools/mirrorworg-sheet.py check      (also deep16/art-src/mirrorworg/<sheet>-review.png: every row of every drawn view at 3x)

The art desk's MIRROR-WORG-SOURCE-SHEETS (11-13), sorted out of Fresh to deep16/_src/mirrorworg/2026-11-13-mirror-worg-source-sheets/ (the zip beside
it): 45 pages, 360 drawings -- Normal, Emaciated and Overcharged, each Idle 8, Walk 8, Bite 8 in SE, the rear NE, S, E and N. Each state is a
paint-over of the regular worg (tools/worg-sheet.py): the starfield fixed in the coat (violet, cold cyan and off-white points on the brow, the
shoulders and the back), the emaciated tucked and frayed, the overcharged risen and broader. The moving ripple and the mirror eye stay the engine's
(deep16/data/foes.js mirrorworg: `ripple`, `mirrorEye`).
Cut by tools/wolfpages.py at the regular worg's own K on its cell, so the three stand on one foot origin and a swap between them does not jump: each
view-and-action is placed by the Normal page's middle and by its own page's ground (the states sit a page px or two apart on their pages). The flecks
are kept through the downsample (wolfpages `stars`).
THE STATES ARE NOT WIRED: the makings' withering (three daily stages unless fed on magic -- the clock lane, held) is not built, so nothing chooses
between them. The show takes `&state=emaciated|overcharged` to look at one (deep16/js/madeshow.js).
"""
import importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('wolfpages', os.path.join(ROOT, 'tools', 'wolfpages.py'))
WP = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(WP)

FOLDER = os.path.join(WP.pix.SRC, 'mirrorworg', '2026-11-13-mirror-worg-source-sheets')
GEOM = (120, 122, 60, 98)
K = 270 / 49.0                          # (the regular worg's: tools/worg-sheet.py)
SHEETS = {'normal': 'mirrorworg_p1', 'emaciated': 'mirrorworg_emaciated_p1', 'overcharged': 'mirrorworg_overcharged_p1'}
SOURCE = ('drawn by the art desk (MIRROR-WORG-SOURCE-SHEETS, 11-13: the %s state, Idle 8, Walk 8, Bite 8 in five views, a paint-over of the regular worg), '
          'cut by tools/mirrorworg-sheet.py through tools/wolfpages.py; SW W NW mirrored -- deep16/data/foes.js mirrorworg%s')

if __name__ == '__main__':
    fmap = WP.frame_map(FOLDER)
    for state, name in SHEETS.items():
        frames = WP.cut_state(fmap, state, K, GEOM, register='normal', stars=True, own_ground=True)
        WP.write(name, frames, GEOM, SOURCE % (state.capitalize(), '' if state == 'normal' else ' (HELD: no state is chosen by the engine yet)'))
        if 'check' in sys.argv:
            WP.review(name, frames, os.path.join(ROOT, 'deep16', 'art-src', 'mirrorworg', name + '-review.png'))

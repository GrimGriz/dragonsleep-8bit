"""DEEP16 pipeline 2 (generated art): the mirror wolf in its three states -> deep16/art/mirrorwolf_p1 (Normal, worn by the foe),
mirrorwolf_emaciated_p1 and mirrorwolf_overcharged_p1 (cut and registered; nothing wears them yet), all eight facings.

    python tools/mirrorwolf-sheet.py            (writes the three sheets' .png/.json)
    python tools/mirrorwolf-sheet.py check      (also deep16/art-src/mirrorwolf/<sheet>-review.png: every row of every drawn view at 3x)

The art desk's MIRROR-WOLF-THREE-STATE-SOURCES (11-13), sorted out of Fresh to deep16/_src/mirrorwolf/2026-11-13-mirror-wolf-three-state-sources/ (the
zip beside it): 45 pages, 360 drawings -- Normal, Emaciated and Overcharged, each Idle 8, Walk 8, Bite 8 in SE, the rear NE, S, E and N; each a
registered paint-over of the art desk's own redrawn wolf (WOLF-P1-SELECTED-SOURCE-SHEETS, which has NOT been delivered: the regular wolf, wolf_p1, is
still the 09-27 render, and the werewolf's held `towolf` still ends on it). The starfield fixed in the coat; the ripple and the mirror eye the
engine's (deep16/data/foes.js mirrorwolf).
Cut by tools/wolfpages.py: the states are registered to the pixel on their pages (the same lowest row in every frame of every state), so each
view-and-action is placed once, by the Normal page, and the three share it -- the overcharged's growth and the emaciated's tuck are the drawing's.
Its size: the SE idle 28 px sole to ear (30 with the outline) on wolf_p1's own 96 x 96 cell, the foot at 48,77 -- the art desk's own 1x contact
(review/MIRROR-WOLF-SE-IDLE-NATIVE-COMPARISON.png) and the old wolf's 34 x 26; under three-fifths of the worg, a Medium beast beside a Large one.
THE STATES ARE NOT WIRED (as the mirror worg's: tools/mirrorworg-sheet.py); `&state=` on the show looks at one.
"""
import importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('wolfpages', os.path.join(ROOT, 'tools', 'wolfpages.py'))
WP = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(WP)

FOLDER = os.path.join(WP.pix.SRC, 'mirrorwolf', '2026-11-13-mirror-wolf-three-state-sources')
GEOM = (96, 96, 48, 77)
K = 245 / 28.0
SHEETS = {'normal': 'mirrorwolf_p1', 'emaciated': 'mirrorwolf_emaciated_p1', 'overcharged': 'mirrorwolf_overcharged_p1'}
SOURCE = ('drawn by the art desk (MIRROR-WOLF-THREE-STATE-SOURCES, 11-13: the %s state, Idle 8, Walk 8, Bite 8 in five views, a paint-over of its redrawn wolf), '
          'cut by tools/mirrorwolf-sheet.py through tools/wolfpages.py; SW W NW mirrored -- deep16/data/foes.js mirrorwolf%s')

if __name__ == '__main__':
    fmap = WP.frame_map(FOLDER)
    for state, name in SHEETS.items():
        frames = WP.cut_state(fmap, state, K, GEOM, register='normal', stars=41)   # (41: its flecks are flat squares 12-15 page px a side)
        WP.write(name, frames, GEOM, SOURCE % (state.capitalize(), '' if state == 'normal' else ' (HELD: no state is chosen by the engine yet)'))
        if 'check' in sys.argv:
            WP.review(name, frames, os.path.join(ROOT, 'deep16', 'art-src', 'mirrorwolf', name + '-review.png'))

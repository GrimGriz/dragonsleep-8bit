"""DEEP16 pipeline 2 (generated art): Solskaft's garrison trooper, walking the hold -- his town figure in the trooper's kit -> trooper_p1, in all eight facings.

    python tools/trooper-town-sheet.py            (writes deep16/art/trooper_p1.png/.json)
    python tools/trooper-town-sheet.py check      (also the review sheet: every row of every drawn view at 3x)

Asked in art-wanted section 55, block 4 (11-12, the lanes desk, on his word: "go on the level and kit for pyros folk ... and then the combat posings we'll
need (world model revision?)"); cut 11-13 by the garrison cutter on the lanes desk's relay. The art desk's ART-142-GARRISON-PORTRAITS-AND-TOWN, sorted out of
Fresh to deep16/_src/ART-142-GARRISON-PORTRAITS-AND-TOWN/ (the zip beside it): the generic dwarf's town figure (folkdwarf_p1) re-dressed -- the steel cap, the
coat of mail to mid-thigh, the quilted red sleeves, the round shield slung on his back, the battleaxe hung head-down at the right hip, two throwing axes at the
left. HEAD 1 S, 2 SE, 3 E, 4 the rear NE, 5 N -- PAGE 1 Idle 4, PAGE 2 Walk 8. Its FRAME-MAP.json gives each frame a `number`, an `engine_index` and a
`window_xyxy` on `sources/town/`; the window is drawn tight round the drawing as folkdwarf_p1's (tools/folkdwarf-town-sheet.py, whose `tight` this borrows).

The cut is tools/vivian-sheet.py's, as folkdwarf_p1's: the idle page by its idle's median to TALL -- the dwarf's 38, the art desk's "match the supplied
folkdwarf_p1 scale"; the walk page matched to its view's idle; SW W NW the mirrors of SE E NE (RULED 10-14: the belt kit flips with them, the art desk's
"mirror assets may flip the belt kit visually as part of the existing facing convention"); boxed down, snapped to the 64 (fire left out; the reds kept for the
sleeves), outlined. Worn by Solskaft's soldiers on the street (deep16/js/solskaft.js: Ketil and the drill's four) in place of the gate watch's fight sheet.
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_fd = importlib.util.spec_from_file_location('folkdwarf_town', os.path.join(ROOT, 'tools', 'folkdwarf-town-sheet.py'))
FD = importlib.util.module_from_spec(_fd); _fd.loader.exec_module(FD)
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

SRC = 'ART-142-GARRISON-PORTRAITS-AND-TOWN'
ROW = {'Idle': 'idle', 'Walk': 'walk'}
PAD = 14
_pages = {}


def page(fn):
    if fn not in _pages:
        _pages[fn] = np.asarray(Image.open(os.path.join(VS.pix.SRC, SRC, fn)).convert('RGB')).astype(np.float32)
    return _pages[fn]


def frame_windows():
    fm = json.load(open(os.path.join(VS.pix.SRC, SRC, 'FRAME-MAP.json'), encoding='utf-8'))
    out = []
    for pg in fm['pages']:
        if pg.get('asset') != 'trooper_p1':
            continue                                                                   # (the two portrait stills are pt_dwarf's: tools/portrait-sheet.py)
        row = ROW[pg['action']]
        W, H = pg['source_size'] if 'source_size' in pg else pg['source_dimensions']
        idx = [f['engine_index'] for f in pg['frames']]
        assert idx == list(range({'idle': 4, 'walk': 8}[row])), (pg['source'], idx)   # (every number once, none skipped)
        for f in pg['frames']:
            x0, y0, x1, y1 = f['window_xyxy']
            cell = (max(0, x0 - PAD), max(0, y0 - PAD), min(W, x1 + PAD), min(H, y1 + PAD))
            out.append(('', pg['facing'], row, f['engine_index'], pg['source'], FD.tight(page(pg['source']), cell)))
    return out


VS.LOOKS['trooper_p1'] = dict(
    src=SRC, windows=frame_windows() if os.path.isdir(os.path.join(VS.pix.SRC, SRC)) else [], tall=38, avoid=['fire'], name='Trooper',
    rows=[('idle', 4, 4), ('walk', 9, 8)], match={'walk': ('idle', 0)},
    hold=["walk: the rear NE lead change subtle (boot overlap); E and SE several close passing silhouettes; N distinguishes the trailing soles at 1 and 5 (the art desk's own notes)"],
    source="drawn by the art desk (ART-142-GARRISON-PORTRAITS-AND-TOWN, 11-12: art-wanted section 55 block 4, the garrison trooper's town figure in five views), cut by "
           'tools/trooper-town-sheet.py over tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    VS.cut('trooper_p1')

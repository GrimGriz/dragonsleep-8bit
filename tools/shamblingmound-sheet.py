"""DEEP16 pipeline 2 (generated art): the shambling mound -> deep16/art/shamblingmound_p1, all eight facings from its one view.

    python tools/shamblingmound-sheet.py            (writes deep16/art/shamblingmound_p1.png/.json)
    python tools/shamblingmound-sheet.py check      (also deep16/art-src/shamblingmound/shamblingmound_p1-review.png: every row at 3x)

Asked as deep16-art-wanted.md section 4 (11-14, the lanes desk; the 10-08 scout's creature for the Glowseep). The art desk's
SHAMBLING-MOUND-GLOWSEEP-SOURCES, sorted out of Fresh to deep16/_src/shamblingmound/2026-11-14-GLOWSEEP-SOURCES/ (the zip beside it); cut on Griz's
"Have it start the new art shambling mound (better prompt imo)" (11-14). ART-13 of 10-10, the first mound, was in hand and never cut: its three pages
are in deep16/_src/shamblingmound/superseded/ (the cutter's review of the two side by side: deep16/_src/art-desk/sent/ENGINE-RETURN-2026-11-14-
shambling-mound-REVIEW.md).

The pages come NATIVE: drawn at game size on the 64 colours over a flat #0e1430, and FRAME-MAP.json gives every drawing's rectangle (176 x 141) and one
ground anchor in it, (83, 127). So a frame is cut as drawn, pixel for pixel: the navy keyed out inside its rectangle and nothing else -- no rescale, no
snap, no outline (a page's drips, clumps and the Charged bolt stay with their frame, as the art desk asks). Not tools/sheetrows.py: that cutter finds
the frames by the page's lettering, and these pages hand them over by number (the mirror hyena's cutter does the same with its native strips).
ONE VIEW (the ask: "It has no face and no back"): HEAD 1, drawn facing the bottom-right, plays S, N, NE, E and SE as drawn and SW, W, NW mirrored (a flip,
then one pixel right: the anchor column stays put) -- tools/ochrejelly-sheet.py's way for a thing with no face. Each row its own width about the anchor.
Rows, as the ask routes them: idle 6; walk 8 <- Shamble; slam 6 and slam2 6 (js/battle.js plays the attack's name, and its second use in a turn the
numbered row), each `release` 3 -- the art desk's contact frame 4; engulf 8; charged 6 (Lightning Absorption, js/traits.js TR.absorbs); flinch 4;
hurt 6 <- Fall (held on 6, the heap); prone 2.
"""
import json, os, sys
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)

FOLDER = os.path.join(pix.SRC, 'shamblingmound', '2026-11-14-GLOWSEEP-SOURCES')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):        # (in a worktree: _src is gitignored and lives only in the shared checkout)
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'shamblingmound', os.path.basename(FOLDER))
NAME = 'shamblingmound_p1'
ROW = {'Idle': 'idle', 'Shamble': 'walk', 'Slam': 'slam', 'Slam 2': 'slam2', 'Engulf': 'engulf', 'Charged': 'charged', 'Flinch': 'flinch', 'Fall': 'hurt', 'Prone': 'prone'}
ORDER = ['idle', 'walk', 'slam', 'slam2', 'engulf', 'charged', 'flinch', 'hurt', 'prone']
FPS = {'idle': 6, 'walk': 8, 'slam': 10, 'slam2': 10, 'engulf': 8, 'charged': 8, 'flinch': 10, 'hurt': 8, 'prone': 4}
EXTRA = {'slam': {'release': 3}, 'slam2': {'release': 3}}                 # (the art desk's contact frame 4, index 3)
DRAWN = {0: 'S', 4: 'N', 5: 'NE', 6: 'E', 7: 'SE'}                          # (facings as drawn; 1 SW, 2 W, 3 NW mirrored)
SOURCE = ('drawn by the art desk (SHAMBLING-MOUND-GLOWSEEP-SOURCES, 11-14: art-wanted section 4 -- Idle 6, Shamble 8, Slam 6, Slam 2 6, Engulf 8, '
          'Charged 6, Flinch 4, Fall 6, Prone 2, one view facing the bottom-right), cut native by tools/shamblingmound-sheet.py; SW W NW mirrored -- '
          'deep16/data/foes.js shamblingmound')


def frames():
    """-> {row: [RGBA arrays, the anchor at (AX0, AY0)]} from the frame map, the navy keyed"""
    fm = json.load(open(os.path.join(FOLDER, 'FRAME-MAP.json'), encoding='utf-8'))
    bg = np.array(fm['background_rgb'], np.uint8)
    out = {}
    for a in fm['actions']:
        row = ROW[a['action']]
        page = np.asarray(Image.open(os.path.join(FOLDER, *a['page'].split('/'))).convert('RGB'))
        fs = []
        for f in sorted(a['frames'], key=lambda f: f['index']):
            x, y, w, h = f['rect_xywh']; assert tuple(f['anchor_in_rect_xy']) == tuple(fm['ground_anchor_xy']), f
            rgb = page[y:y + h, x:x + w]
            rgba = np.zeros((h, w, 4), np.uint8); rgba[..., :3] = rgb; rgba[..., 3] = np.where((rgb == bg).all(-1), 0, 255)
            fs.append(rgba)
        assert len(fs) == a['frame_count'], a['action']
        out[row] = fs
    return out, tuple(fm['ground_anchor_xy'])


def mirror(fr):
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def lay(rows, anchor):
    """each row its own width, the anchor in its middle; one height and foot for every row -> (cells {row: [8 facings of [frames]]}, geometry)"""
    ax0, ay0 = anchor
    ink = lambda fr: (np.where(fr[..., 3].any(0))[0], np.where(fr[..., 3].any(1))[0])
    up = max(ay0 - ink(fr)[1].min() for fs in rows.values() for fr in fs) + 2
    dn = max(ink(fr)[1].max() - ay0 for fs in rows.values() for fr in fs) + 2
    fh, ay = up + dn + 1, up
    out, geo = {}, {}
    for r in ORDER:
        fs = rows[r]
        hw = max(max(ax0 - ink(fr)[0].min(), ink(fr)[0].max() - ax0) for fr in fs) + 2
        fw = 2 * hw
        cells = []
        for fr in fs:
            c = np.zeros((fh, fw, 4), np.uint8)
            sy0, sx0 = ay0 - ay, ax0 - hw                                 # (the source pixel that lands on the cell's 0, 0)
            ys0, xs0 = max(0, sy0), max(0, sx0)
            ys1, xs1 = min(fr.shape[0], sy0 + fh), min(fr.shape[1], sx0 + fw)
            c[ys0 - sy0:ys1 - sy0, xs0 - sx0:xs1 - sx0] = fr[ys0:ys1, xs0:xs1]
            assert c[..., 3].sum() == fr[..., 3].sum(), (r, 'a frame lost pixels in its cell')
            cells.append(c)
        out[r] = [cells if f in DRAWN else [mirror(c) for c in cells] for f in range(8)]
        geo[r] = (int(fw), int(fh), int(hw), int(ay))
    return out, geo


def write(cells, geo):
    wide = max(len(cells[r][0]) * geo[r][0] for r in ORDER)
    H = sum(8 * geo[r][1] for r in ORDER)
    sheet = np.zeros((H, wide, 4), np.uint8)
    meta, y = {}, 0
    for r in ORDER:
        fw, fh, ax, ay = geo[r]
        meta[r] = {'y': y, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'frames': len(cells[r][0]), 'fps': FPS[r]}
        meta[r].update(EXTRA.get(r, {}))
        for f in range(8):
            for i, c in enumerate(cells[r][f]):
                sheet[y + f * fh:y + (f + 1) * fh, i * fw:(i + 1) * fw] = c
        y += 8 * fh
    fw0, fh0, ax0, ay0 = geo['idle']
    top = pix.top_of(cells['idle'][0] + cells['idle'][7], ay0)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(pix.ART, NAME + '.png'), optimize=True)
    json.dump({'image': 'art/%s.png' % NAME, 'fw': fw0, 'fh': fh0, 'ax': ax0, 'ay': ay0, 'top': top, 'name': 'Shambling Mound', 'source': SOURCE, 'anims': meta},
              open(os.path.join(pix.ART, NAME + '.json'), 'w', encoding='utf-8', newline='\n'), indent=1)
    print('  %s: %dx%d, top %d, %s' % (NAME, sheet.shape[1], sheet.shape[0], top, ', '.join('%s %d@%dpx' % (r, len(cells[r][0]), geo[r][0]) for r in ORDER)))
    return sheet


def review(cells, geo, out, scale=3, bg=(14, 20, 48)):
    W = sum(len(cells[r][0]) * geo[r][0] for r in ORDER); H = max(geo[r][1] for r in ORDER) * 2
    im = Image.new('RGB', (W, H), bg); x = 0
    for r in ORDER:
        fw, fh = geo[r][:2]
        for vi, f in enumerate((7, 2)):                                   # (SE as drawn, W mirrored)
            for i, c in enumerate(cells[r][f]):
                p = Image.fromarray(c, 'RGBA'); im.paste(p, (x + i * fw, vi * fh), p)
        x += len(cells[r][0]) * fw
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.resize((im.width * scale, im.height * scale), Image.NEAREST).save(out)
    print('  review: ' + out)


if __name__ == '__main__':
    rows, anchor = frames()
    cells, geo = lay(rows, anchor)
    write(cells, geo)
    if 'check' in sys.argv:
        review(cells, geo, os.path.join(ROOT, 'deep16', 'art-src', 'shamblingmound', NAME + '-review.png'))

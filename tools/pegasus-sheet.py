"""DEEP16: the pegasus (art-wanted 64's celestial, the art desk's §69) -> pegasus_p1 (11-15, the NPC cutter seat, on Griz's "since people is
done have it work the creature list backward", the desk's relay).

    python tools/pegasus-sheet.py

Source (the art desk's, in the main checkout's deep16/_src/pegasus/2026-11-15-ART-WANTED-69-PEGASUS/ -- a worktree reads it there):
FRAME-MAP.csv, 35 pages, each frame's window (`crop_x/y/w/h`, 144 x 152: native pixel art at 1x, the ground under the body at 72,114),
every colour one of the 64. The page's ground, #0e1430, is also the 64's darkest blue, but the white pegasus uses none of it: the patches
of it inside a figure are gaps (between the legs in the Fall, between the tail and a hind leg), looked at in a zoom -- so it is keyed
everywhere, and the gaps not joined to the window's edge are counted. No rescale and no snap.
Rows: Idle `idle` 8, Walk `walk` 8, Fly `fly` 8 (drawn 17 px lifted; the grid lifts a flier itself, so each view's fly band is stood with
its lowest pixel on the ground line, as the griffon's and the wyvern's), Hooves `attack` 8 (both forehooves land on frame 5: `release` 4),
Flinch `flinch` 6, Fall `hurt` 8, Prone 1 `prone` (down and breathing), Prone 2 `getup` (the recovery). Facings: the five views as drawn,
SW, W and NW the mirrors of SE, E and NE (RULED 10-14).
"""
import os, sys, json, csv
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix, AD = _load('pixelate'), _load('artdesk')

FW, FH, AX, AY = 144, 152, 72, 114
GROUND = (14, 20, 48)
NAME = 'pegasus_p1'
DIR = ('pegasus', '2026-11-15-ART-WANTED-69-PEGASUS')
ORDER = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
ROWS = {'idle': [('idle', range(8))], 'walk': [('walk', range(8))], 'fly': [('fly', range(8))], 'hooves': [('attack', range(8))],
        'flinch': [('flinch', range(6))], 'hurt': [('hurt', range(8))], 'prone': [('prone', [0]), ('getup', [1])]}
FPS = {'idle': 6, 'walk': 10, 'fly': 10, 'attack': 10, 'flinch': 12, 'hurt': 8, 'prone': 1, 'getup': 4}
RELEASE = {'attack': 4}


def palette():
    p = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))
    return {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for r in p['ramps'].values() for c in r}


def mirror(fr):
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def cut():
    d = os.path.join(AD.src_dir(ROOT), *DIR)
    pal, views, pages, inside = palette(), {}, {}, []
    for r in csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8')):
        x, y, w, h = (int(r[k]) for k in ('crop_x', 'crop_y', 'crop_w', 'crop_h'))
        if (w, h) != (FW, FH) or (int(r['anchor_x']), int(r['anchor_y'])) != (AX, AY):
            raise SystemExit('%s %s: a window of %dx%d' % (r['source_png'], r['frame'], w, h))
        if r['source_png'] not in pages:
            pages[r['source_png']] = np.asarray(Image.open(os.path.join(d, r['source_png'])).convert('RGB'))
        win = pages[r['source_png']][y:y + h, x:x + w]
        g = (win == GROUND).all(-1)
        lab, n = ndimage.label(g)
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        bg = np.isin(lab, list(edge))
        if (g & ~bg).sum():
            inside.append(int((g & ~bg).sum()))
        fg = ~g
        off = {tuple(c) for c in win[fg]} - pal
        if off:
            raise SystemExit('%s %s: %d colours off the 64' % (r['source_png'], r['frame'], len(off)))
        fr = np.zeros((FH, FW, 4), np.uint8); fr[fg, :3] = win[fg]; fr[fg, 3] = 255
        views.setdefault(r['facing'], {}).setdefault(r['runtime_row'], {})[int(r['index'])] = fr
    print('  gaps inside the figures keyed: %d px in %d frames' % (sum(inside), len(inside)))
    out = {}
    for v, rows in views.items():
        out[v] = {}
        for src, dst in ROWS.items():
            for row, idx in dst:
                out[v][row] = [rows[src][i] for i in idx]
        lows = [int(np.where(f[..., 3].any(1))[0][-1]) for f in out[v]['fly']]
        dy = AY - max(lows)
        if dy > 0:
            out[v]['fly'] = [np.roll(f, dy, axis=0) for f in out[v]['fly']]
        print('  %s fly: stood %+d px (its band\'s lowest on row %d)' % (v, dy, AY))
    if set(out) != {'S', 'SE', 'E', 'NE', 'N'}:
        raise SystemExit('views %s' % sorted(out))
    rows = list(out['S'])
    return {an: [[mirror(fr) for fr in out[MIRROR[f]][an]] if f in MIRROR else out[f][an] for f in ORDER] for an in rows}


if __name__ == '__main__':
    frames = cut()
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    mp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(mp))
    missing = [an for an in frames if an not in meta['anims']]
    if missing:
        raise SystemExit('rows not written (not in tools/pixelate.py ANIM_ORDER): %s' % missing)
    for an, f in FPS.items():
        meta['anims'][an]['fps'] = f
    for an, r in RELEASE.items():
        meta['anims'][an]['release'] = r
    meta['source'] = 'drawn by the art desk (ART-WANTED-69 PEGASUS, 11-15: five views, native on a 144 x 152 cell), cut by tools/pegasus-sheet.py (11-15)'
    json.dump(meta, open(mp, 'w'), indent=1)

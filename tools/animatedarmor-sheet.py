"""DEEP16: the animated armor (art-wanted 64's construct, the art desk's §68) -> animatedarmor_p1 (11-15, the NPC cutter seat, on Griz's
"since people is done have it work the creature list backward", the desk's relay).

    python tools/animatedarmor-sheet.py

Source (the art desk's, in the main checkout's deep16/_src/animatedarmor/2026-11-15-ART-WANTED-68-ANIMATED-ARMOR/ -- a worktree reads it
there): FRAME-MAP.csv, 40 pages, each frame's window (`x/y/width/height`, 220 x 204: native pixel art at 2x on a 110 x 102 cell, the ground at
55,86), the navy #101228, every colour one of the 64. Each window read one pixel in two (refused unless an exact 2x and on the 64), the navy
keyed. Rows as the art desk named them: Still `still` 1 (False Appearance: the armor standing empty on its stand till it first acts -- js/ui.js
draws a sheet's `still` before a creature's first turn), Idle `idle` 8, Walk `walk` 8, Slam `slam` 8 and Slam 2 `slam2` 8 (its Multiattack's
two blows, the second on its `2` row as the stone giant's and the shambling mound's; both land on frame 4: `release` 3), Flinch `flinch` 6,
Fall `hurt` 8 (it comes apart), Prone `prone` 2. Facings: the five views as drawn, SW, W and NW the mirrors of SE, E and NE (RULED 10-14).
"""
import os, sys, json, csv
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix, AD = _load('pixelate'), _load('artdesk')

FW, FH, AX, AY = 110, 102, 55, 86
NAVY = (16, 18, 40)
NAME = 'animatedarmor_p1'
DIR = ('animatedarmor', '2026-11-15-ART-WANTED-68-ANIMATED-ARMOR')
ORDER = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
COUNT = {'still': 1, 'idle': 8, 'walk': 8, 'slam': 8, 'slam2': 8, 'flinch': 6, 'hurt': 8, 'prone': 2}
FPS = {'still': 2, 'idle': 6, 'walk': 9, 'slam': 10, 'slam2': 10, 'flinch': 12, 'hurt': 8, 'prone': 4}
RELEASE = {'slam': 3, 'slam2': 3}


def palette():
    p = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))
    return {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for r in p['ramps'].values() for c in r}


def mirror(fr):
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def cut():
    d = os.path.join(AD.src_dir(ROOT), *DIR)
    pal, views, pages = palette(), {}, {}
    for r in csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8')):
        x, y, w, h = (int(r[k]) for k in ('x', 'y', 'width', 'height'))
        k = w // FW
        if (w, h) != (FW * k, FH * k):
            raise SystemExit('%s %s: a window of %dx%d' % (r['source_page'], r['frame'], w, h))
        if r['source_page'] not in pages:
            pages[r['source_page']] = np.asarray(Image.open(os.path.join(d, 'selected', r['source_page'])).convert('RGB'))
        win = pages[r['source_page']][y:y + h, x:x + w]; sm = win[k // 2::k, k // 2::k]
        if (np.repeat(np.repeat(sm, k, 0), k, 1) != win).any():
            raise SystemExit('%s %s: not an exact %dx page' % (r['source_page'], r['frame'], k))
        fg = (sm != NAVY).any(-1)
        off = {tuple(c) for c in sm[fg]} - pal
        if off:
            raise SystemExit('%s %s: %d colours off the 64' % (r['source_page'], r['frame'], len(off)))
        fr = np.zeros((FH, FW, 4), np.uint8); fr[fg, :3] = sm[fg]; fr[fg, 3] = 255
        views.setdefault(r['facing'], {}).setdefault(r['runtime_row'], {})[int(r['index'])] = fr
    if set(views) != {'S', 'SE', 'E', 'NE', 'N'}:
        raise SystemExit('views %s' % sorted(views))
    for v in views:
        for an, n in COUNT.items():
            if sorted(views[v].get(an, {})) != list(range(n)):
                raise SystemExit('%s %s: frames %s, not %d' % (v, an, sorted(views[v].get(an, {})), n))
            views[v][an] = [views[v][an][i] for i in range(n)]
    return {an: [[mirror(fr) for fr in views[MIRROR[f]][an]] if f in MIRROR else views[f][an] for f in ORDER] for an in COUNT}


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
    meta['source'] = 'drawn by the art desk (ART-WANTED-68 ANIMATED-ARMOR, 11-15: five views, native 2x on a 110 x 102 cell), cut by tools/animatedarmor-sheet.py (11-15)'
    json.dump(meta, open(mp, 'w'), indent=1)

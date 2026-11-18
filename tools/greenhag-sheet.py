"""DEEP16: the green hag (art-wanted 64's fey, the art desk's §70) -> greenhag_p1, both her forms on one sheet (11-15, the NPC cutter seat, on
Griz's "since people is done have it work the creature list backward", the desk's relay).

    python tools/greenhag-sheet.py          (the 11-18 redraw, cut_redraw(): the art desk's ART-WANTED-70 GREEN-HAG ILLUSTRATED REDRAW -- 55
                                            image-generated pages, its own native cut a strip a page, taken as drawn, each frame its map's
                                            SHA-256; pixel for pixel its own assembled runtime/greenhag_p1.png; after his 11-15 "hag was still
                                            code drawn or something is very very wrong" -- the cutter seat cutter-1118, Griz's "all 3")
    python tools/greenhag-sheet.py 1115     (the 11-15 cut, below, from the first pages)

Source (the art desk's, in the main checkout's deep16/_src/greenhag/2026-11-15-ART-WANTED-70-GREEN-HAG/ -- a worktree reads it there):
FRAME-MAP.json, 55 pages, each frame's window (`source_rect_px`, 264 x 264: native pixel art at 3x on an 88 x 88 cell, the ground at 44,62),
the navy #101228; every colour one of the 64. So no rescale and no snap: each window read one pixel in three (refused unless an exact 3x and
on the 64), the navy keyed out.

Her borrowed face goes on the same sheet the lamia's robed woman does (the ask's "as the lamia's human form is worn"): the guise's Idle on
`still`, its Walk on `stillwalk`, its Unmask on `reveal` -- so she stands as the old countrywoman till her first turn or a wound, and the
unmask plays (js/ui.js, js/ai.js, js/battle.js: a sheet with `still` and `reveal`). Her own rows: Idle `idle` 8, Walk `walk` 8, Claws
`claw` 8, Cast `cast` 8 (no light drawn at the fingertip: the game draws the spell's), Vanish `vanish` 6 (Invisible Passage; frame 6
drawn empty on purpose), Flinch `flinch` 6, Fall `hurt` 8, Prone 1 `prone` (her live down pose) and Prone 2 `getup` (the long-arm
press-up). Facings: the five views as drawn, SW, W and NW the mirrors of SE, E and NE (RULED 10-14).
"""
import os, sys, json, hashlib
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix, AD = _load('pixelate'), _load('artdesk')

FW, FH, AX, AY = 88, 88, 44, 62
NAVY = (16, 18, 40)
NAME = 'greenhag_p1'
DIR = ('greenhag', '2026-11-15-ART-WANTED-70-GREEN-HAG')
ORDER = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
# (form, the art desk's action) -> [(the sheet's row, the action's frame indices)], fps, release (the blow's frame, zero-based)
ROWS = {('true', 'Idle'): [('idle', range(8))], ('true', 'Walk'): [('walk', range(8))], ('true', 'Claws'): [('claw', range(8))],
        ('true', 'Cast'): [('cast', range(8))], ('true', 'Vanish'): [('vanish', range(6))], ('true', 'Flinch'): [('flinch', range(6))],
        ('true', 'Fall'): [('hurt', range(8))], ('true', 'Prone'): [('prone', [0]), ('getup', [1])],
        ('guise', 'Idle'): [('still', range(8))], ('guise', 'Walk'): [('stillwalk', range(8))], ('guise', 'Unmask'): [('reveal', range(6))]}
FPS = {'idle': 6, 'walk': 10, 'claw': 10, 'cast': 8, 'vanish': 8, 'flinch': 12, 'hurt': 8, 'prone': 1, 'getup': 4, 'still': 5, 'stillwalk': 8, 'reveal': 8}
RELEASE = {'claw': 2, 'cast': 4}   # (the first rake out on Claws 3; the finger highest on Cast 5)
HELD = {'stillwalk': 'her borrowed face walking, not played yet: she unmasks at her first turn, so it waits for a story that walks her in her guise (the lamia\'s human walk is held so)'}


def palette():
    p = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))
    return {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for r in p['ramps'].values() for c in r}


def mirror(fr):
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def cut():
    d = os.path.join(AD.src_dir(ROOT), *DIR)
    fm = json.load(open(os.path.join(d, 'FRAME-MAP.json'), encoding='utf-8'))
    assert tuple(fm['native_frame_wh_px']) == (FW, FH) and tuple(fm['native_ground_anchor_xy_px']) == (AX, AY)
    pal, views, matched, blanks = palette(), {}, [0, 0], 0
    for p in fm['pages']:
        a = np.asarray(Image.open(os.path.join(d, p['source_png'])).convert('RGB'))
        frames = {}
        for f in p['frames']:
            x, y, w, h = f['source_rect_px']; k = w // FW
            if (w, h) != (FW * k, FH * k):
                raise SystemExit('%s %d: a window of %dx%d' % (p['source_png'], f['number'], w, h))
            win = a[y:y + h, x:x + w]; sm = win[k // 2::k, k // 2::k]
            if (np.repeat(np.repeat(sm, k, 0), k, 1) != win).any():
                raise SystemExit('%s %d: not an exact %dx page' % (p['source_png'], f['number'], k))
            fg = (sm != NAVY).any(-1)
            off = {tuple(c) for c in sm[fg]} - pal
            if off:
                raise SystemExit('%s %d: %d colours off the 64' % (p['source_png'], f['number'], len(off)))
            fr = np.zeros((FH, FW, 4), np.uint8); fr[fg, :3] = sm[fg]; fr[fg, 3] = 255
            if f.get('empty'):
                if fg.any():
                    raise SystemExit('%s %d: drawn where the map says empty' % (p['source_png'], f['number']))
                blanks += 1
            if f.get('art_rgba_sha256'):
                matched[0] += 1; matched[1] += hashlib.sha256(fr.tobytes()).hexdigest() == f['art_rgba_sha256']
            frames[f['index']] = fr
        for row, idx in ROWS[(p['form'], p['action'])]:
            views.setdefault(p['facing'], {})[row] = [frames[i] for i in idx]
    print('  %s: %d of %d frames match the map\'s own art SHA-256; %d drawn empty as the map says' % (NAME, matched[1], matched[0], blanks))
    if set(views) != {'S', 'SE', 'E', 'NE', 'N'}:
        raise SystemExit('views %s' % sorted(views))
    rows = sorted({r for v in views.values() for r in v})
    for v in views:
        if sorted(views[v]) != rows:
            raise SystemExit('%s rows %s, not %s' % (v, sorted(views[v]), rows))
    return {an: [[mirror(fr) for fr in views[MIRROR[f]][an]] if f in MIRROR else views[f][an] for f in ORDER] for an in rows}


REDRAW = ('greenhag', '2026-11-18-ART-WANTED-70-GREEN-HAG-REDRAW')


def cut_redraw():
    """the 11-18 redraw (the art desk's ART-WANTED-70 GREEN-HAG ILLUSTRATED REDRAW): 55 image-generated pages with its own native cut on the 64, a strip
    a page (native/, 88 x 88 cells on the ground at 44,62, display order) -- taken as drawn: each frame's cell where FRAME-MAP.json says
    (`native_rect_xywh_px`), refused unless its RGBA is the map's own SHA-256, its alpha binary and every colour one of the 64; the rows as the 11-15
    cut's (ROWS), her Vanish 6 empty as drawn"""
    d = os.path.join(AD.src_dir(ROOT), *REDRAW)
    fm = json.load(open(os.path.join(d, 'FRAME-MAP.json'), encoding='utf-8'))
    assert tuple(fm['cell_wh_px']) == (FW, FH) and tuple(fm['anchor_xy_px']) == (AX, AY)
    pal, views, matched, blanks = palette(), {}, 0, 0
    for p in fm['pages']:
        a = np.asarray(Image.open(os.path.join(d, p['native_strip'])).convert('RGBA'))
        frames = {}
        for f in p['frames']:
            x, y, w, h = f['native_rect_xywh_px']
            fr = np.ascontiguousarray(a[y:y + h, x:x + w])
            if (w, h) != (FW, FH) or set(np.unique(fr[..., 3]).tolist()) - {0, 255}:
                raise SystemExit('%s %d: not a binary %dx%d cell' % (p['native_strip'], f['number'], FW, FH))
            if hashlib.sha256(fr.tobytes()).hexdigest() != f['native_rgba_sha256']:
                raise SystemExit('%s %d: not the map\'s own pixels (SHA-256)' % (p['native_strip'], f['number']))
            fg = fr[..., 3] > 0
            off = {tuple(c) for c in fr[fg][:, :3]} - pal
            if off:
                raise SystemExit('%s %d: %d colours off the 64' % (p['native_strip'], f['number'], len(off)))
            fr = fr.copy(); fr[~fg] = 0
            matched += 1; blanks += not fg.any()
            frames[f['index']] = fr
        for row, idx in ROWS[(p['form'], p['action'])]:
            views.setdefault(p['facing'], {})[row] = [frames[i] for i in idx]
    print('  %s: %d frames, each the map\'s own SHA-256; %d drawn empty' % (NAME, matched, blanks))
    if set(views) != {'S', 'SE', 'E', 'NE', 'N'}:
        raise SystemExit('views %s' % sorted(views))
    rows = sorted({r for v in views.values() for r in v})
    for v in views:
        if sorted(views[v]) != rows:
            raise SystemExit('%s rows %s, not %s' % (v, sorted(views[v]), rows))
    return {an: [[mirror(fr) for fr in views[MIRROR[f]][an]] if f in MIRROR else views[f][an] for f in ORDER] for an in rows}


if __name__ == '__main__':
    first = sys.argv[1:] == ['1115']
    frames = cut() if first else cut_redraw()
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
    for an, why in HELD.items():
        meta['anims'][an]['held'] = why
    meta['source'] = ('drawn by the art desk (ART-WANTED-70 GREEN-HAG, 11-15: five views, her own rows and her borrowed face\'s, native 3x on an 88 x 88 cell), cut by tools/greenhag-sheet.py (11-15)' if first else
                      'drawn by the art desk (ART-WANTED-70 GREEN-HAG ILLUSTRATED REDRAW, 11-18: five views, her own rows and her borrowed face\'s, image-generated, its native cut 1x on the 88 x 88 cell), cut by tools/greenhag-sheet.py (11-18)')
    json.dump(meta, open(mp, 'w'), indent=1)

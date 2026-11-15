"""DEEP16: the generic man and woman head to foot in their portraits' costumes -> folkman_<costume>_p1, folkwoman_<costume>_p1 (art-wanted 65,
11-15, the NPC cutter seat on the lanes desk's brief; Griz: "are we missing art for the worldmap figures for these guys?" from the Glowseep's floor).

    python tools/folk-costume-sheet.py              # every costume in PIECES
    python tools/folk-costume-sheet.py lightcrew    # one

Sources (the art desk's, in the main checkout's deep16/_src/folkcostumes/<piece>/ -- a worktree reads them there; sorted out of Fresh by
_src/art-desk/art65-*-sort-*.py): each piece's FRAME-MAP.json names every frame's window on its SHEETS/ page (`cell_source_xywh`), its
person (`runtime_target`), its view (`facing`) and its row (`action`, idle 4 or walk 8). The pages are native pixel art drawn at 3x on the
navy (#07162E) on folkman_p1's own cell (72 x 64, anchor 36,60), every colour one of the 64: so no rescale and no snap -- each window is
read one pixel in three (refused unless it is an exact 3x), the navy keyed out, every colour checked against deep16/palette.json.
Placed as drawn (the art desk registered each view against the town figures), but each view stood so its Idle 1's lowest row is on AY, the
view's walk moved with it (the E, NE and N pages draw the soles a pixel above the S and SE: the old townsfolk stand on 60 in every view).
Facings: the five views as drawn, SW, W and NW the mirrors of SE, E and NE (RULED 10-14). Rows idle and walk at folkman_p1's fps.
No drawn looping effect in these (the light crew's moss on the gloves is a still colour; RULED 11-15, drawn smoke and breath to the engine).
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix, AD = _load('pixelate'), _load('artdesk')

FW, FH, AX, AY = 72, 64, 36, 60
NAVY = (7, 22, 46)
FPS = {'idle': 5, 'walk': 12}            # (folkman_p1's and folkwoman_p1's own)
ROWS = ['idle', 'walk']
ORDER = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']   # (a sheet's eight facing rows; SW, W, NW the mirrors)
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
# costume -> its piece's folder under _src/folkcostumes/, and the art desk's piece name for the source line
PIECES = {
    'lightcrew': ('2026-11-15-ART-WANTED-65-LIGHTCREW', 'ART-WANTED-65 GLOWSEEP-LIGHTCREW, 11-15'),
}


def palette():
    p = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))
    return {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for r in p['ramps'].values() for c in r}


def mirror(fr):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide) -- tools/townsfolk-sheet.py's"""
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def cut(costume):
    """-> {sheet name: {row: [8 facings of [RGBA frames]]}}"""
    folder, _ = PIECES[costume]
    d = os.path.join(AD.src_dir(ROOT), 'folkcostumes', folder)
    fm = json.load(open(os.path.join(d, 'FRAME-MAP.json')))
    pal, got = palette(), {}
    for s in fm['sheets']:
        name = s['runtime_target']
        if name not in ('folkman_%s_p1' % costume, 'folkwoman_%s_p1' % costume):
            raise SystemExit('%s: a page for %s, not %s' % (s['file'], name, costume))
        a = np.asarray(Image.open(os.path.join(d, s['file'])).convert('RGB'))
        frames = []
        for f in sorted(s['frames'], key=lambda f: f['index']):
            x, y, w, h = f['cell_source_xywh']
            k = w // FW
            if (w, h) != (FW * k, FH * k):
                raise SystemExit('%s %d: a window of %dx%d, not %d x the cell' % (s['file'], f['number'], w, h, k))
            win = a[y:y + h, x:x + w]
            sm = win[k // 2::k, k // 2::k]
            if (np.repeat(np.repeat(sm, k, 0), k, 1) != win).any():
                raise SystemExit('%s %d: not an exact %dx page' % (s['file'], f['number'], k))
            fg = (sm != NAVY).any(-1)
            off = {tuple(c) for c in sm[fg]} - pal
            if off:
                raise SystemExit('%s %d: %d colours off the 64 (%s)' % (s['file'], f['number'], len(off), sorted(off)[:4]))
            fr = np.zeros((FH, FW, 4), np.uint8)
            fr[fg, :3] = sm[fg]; fr[fg, 3] = 255
            frames.append(fr)
        if len(frames) != s['frame_count']:
            raise SystemExit('%s: %d frames, the map says %d' % (s['file'], len(frames), s['frame_count']))
        got.setdefault(name, {}).setdefault(s['facing'], {})[s['action']] = frames
    out = {}
    for name, views in got.items():
        if set(views) != {'S', 'SE', 'E', 'NE', 'N'}:
            raise SystemExit('%s: views %s, not the five' % (name, sorted(views)))
        for v, rows in views.items():               # each view stood on its Idle 1's lowest row
            foot = int(np.where(rows['idle'][0][..., 3].any(axis=1))[0][-1])
            dy = AY - foot
            if dy:
                for an in rows:
                    for i, fr in enumerate(rows[an]):
                        if dy > 0 and fr[FH - dy:, :, 3].any():
                            raise SystemExit('%s %s %s %d: cut off by the stand' % (name, v, an, i + 1))
                        rows[an][i] = np.roll(fr, dy, axis=0)
                print('  %s %s: stood %+d px (its Idle 1 on row %d)' % (name, v, dy, AY))
        out[name] = {an: [[mirror(fr) for fr in views[MIRROR[f]][an]] if f in MIRROR else views[f][an] for f in ORDER] for an in ROWS}
        for an in ROWS:
            if len({len(fs) for fs in out[name][an]}) > 1:
                raise SystemExit('%s %s: frame counts differ by facing' % (name, an))
    return out


if __name__ == '__main__':
    for costume in (sys.argv[1:] or list(PIECES)):
        for name, frames in sorted(cut(costume).items()):
            pix.write_sheet(name, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))   # (S and E, as tools/townsfolk-sheet.py's)
            mp = os.path.join(ROOT, 'deep16', 'art', name + '.json')
            meta = json.load(open(mp))
            for an, fps in FPS.items():
                meta['anims'][an]['fps'] = fps
            meta['source'] = 'drawn by the art desk (%s: five views, Idle 4 and Walk 8, native 3x on folkman_p1\'s cell), cut by tools/folk-costume-sheet.py (11-15)' % PIECES[costume][1]
            json.dump(meta, open(mp, 'w'), indent=1)

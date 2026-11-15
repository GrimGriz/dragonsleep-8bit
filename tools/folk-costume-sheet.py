"""DEEP16: the generic man and woman head to foot in their portraits' costumes -> folkman_<costume>_p1, folkwoman_<costume>_p1 (art-wanted 65,
11-15, the NPC cutter seat on the lanes desk's brief; Griz: "are we missing art for the worldmap figures for these guys?" from the Glowseep's floor).

    python tools/folk-costume-sheet.py              # every costume in PIECES
    python tools/folk-costume-sheet.py lightcrew    # one

Sources (the art desk's, in the main checkout's deep16/_src/folkcostumes/<piece>/ -- a worktree reads them there; sorted out of Fresh by
_src/art-desk/art<n>-*-sort-*.py). Each piece's frame map names every frame's window on its page, its person (the sheet), its view and its
row (idle 4 or walk 8): FRAME-MAP.json (the light crew's: `sheets`, each frame's `cell_source_xywh`) or FRAME-MAP.csv (the shaft hand's:
a row a frame, `target`, `facing`, `action`, `frame_index`, `source_page`, `crop_x/y/w/h`). The pages are native pixel art on folkman_p1's
own cell (72 x 64, anchor 36,60), every colour one of the 64 -- the light crew drawn at 3x, the shaft hand at 1x -- so no rescale and no
snap: each window is read one pixel in k (refused unless it is an exact k x), the piece's navy keyed out, every colour checked against
deep16/palette.json. Placed as drawn (the art desk registered each view against the town figures). `stand`: each view moved so its Idle 1's
lowest row is on AY, its walk with it -- the light crew's (its E, NE and N pages draw the soles a pixel above the S and SE; the old townsfolk
stand on 60 in every view); not the shaft hand's (its notes: a forward boot in SE and NE projects a row below the ground, on purpose).
Facings: the five views as drawn, SW, W and NW the mirrors of SE, E and NE (RULED 10-14). Rows idle and walk at folkman_p1's fps.
No drawn looping effect in these (the light crew's moss on the gloves is a still colour; the shaft hand's candle is unlit; RULED 11-15,
drawn smoke and breath to the engine).
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

FW, FH, AX, AY = 72, 64, 36, 60
FPS = {'idle': 5, 'walk': 12}            # (folkman_p1's and folkwoman_p1's own)
ROWS = ['idle', 'walk']
COUNT = {'idle': 4, 'walk': 8}
ORDER = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']   # (a sheet's eight facing rows; SW, W, NW the mirrors)
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
# costume -> its piece: its folder under _src/folkcostumes/, the art desk's name for the source line, its navy, and whether each view is stood
PIECES = {
    'lightcrew': dict(folder='2026-11-15-ART-WANTED-65-LIGHTCREW', name='ART-WANTED-65 GLOWSEEP-LIGHTCREW, 11-15: five views, Idle 4 and Walk 8, native 3x on folkman_p1\'s cell',
                      navy=(7, 22, 46), stand=True),
    'shaft': dict(folder='2026-11-15-ART-WANTED-71-SHAFT-HAND', name='ART-WANTED-71 SHAFT-HAND, 11-15: five views, Idle 4 and Walk 8, native 1x on folkman_p1\'s cell',
                  navy=(16, 22, 52), stand=False),   # (its E ear in the fire ramp is the townsfolk's own head, folkman_p1's and folkwoman_p1's since 10-27, kept)
    'scraper': dict(folder='2026-11-15-ART-WANTED-72-GUANO-SCRAPER', name='ART-WANTED-72 GUANO-SCRAPER, 11-15: five views, Idle 4 and Walk 8, native 4x on folkman_p1\'s cell',
                    navy=(17, 24, 45), stand=False),
    'drinker': dict(folder='2026-11-15-ART-WANTED-73-DRINKER', name='ART-WANTED-73 DRINKER, 11-15: five views, Idle 4 and Walk 8, native 4x on folkman_p1\'s cell',
                    navy=(17, 24, 45), stand=False),
    'gambler': dict(folder='2026-11-15-ART-WANTED-74-GAMBLER', name='ART-WANTED-74 GAMBLER, 11-15: five views, Idle 4 and Walk 8, native 4x on folkman_p1\'s cell',
                    navy=(17, 24, 45), stand=False),
}


def palette():
    p = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))
    return {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for r in p['ramps'].values() for c in r}


def mirror(fr):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide) -- tools/townsfolk-sheet.py's"""
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def frames_of(d):
    """the piece's frame map, whichever shape the art desk sent -> [(sheet, view, row, index, page, (x, y, w, h))]"""
    if os.path.exists(os.path.join(d, 'FRAME-MAP.json')):
        fm = json.load(open(os.path.join(d, 'FRAME-MAP.json'), encoding='utf-8'))
        if 'sheets' in fm:                      # (the light crew's: `sheets`, each frame's `index` and `cell_source_xywh`)
            return [(s['runtime_target'], s['facing'], s['action'], f['index'], s['file'], tuple(f['cell_source_xywh'])) for s in fm['sheets'] for f in s['frames']]
        return [(p['target'], p['facing'], p['row'], f['frame'] - 1, p['png'], tuple(f['source_rect_xywh'])) for p in fm['pages'] for f in p['frames']]   # (the scraper's: `pages`)
    out = []
    for r in csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8')):   # (a row a frame; its columns named four ways so far)
        g = lambda *ks: next(r[k] for k in ks if r.get(k) not in (None, ''))
        idx = int(g('frame_index', 'index')) if any(r.get(k) not in (None, '') for k in ('frame_index', 'index')) else int(g('frame_1based', 'frame', 'frame_number')) - 1
        out.append((g('target', 'runtime_target'), r['facing'], g('action', 'row', 'runtime_row'), idx, g('source_page', 'source_png', 'png'),
                    (int(g('crop_x', 'x')), int(g('crop_y', 'y')), int(g('crop_w', 'crop_width', 'width')), int(g('crop_h', 'crop_height', 'height')))))
    return out


def cut(costume):
    """-> {sheet name: {row: [8 facings of [RGBA frames]]}}"""
    P = PIECES[costume]
    d = os.path.join(AD.src_dir(ROOT), 'folkcostumes', P['folder'])
    pal, got, pages = palette(), {}, {}
    for name, v, an, idx, page, (x, y, w, h) in frames_of(d):
        if name not in ('folkman_%s_p1' % costume, 'folkwoman_%s_p1' % costume):
            raise SystemExit('%s: a frame for %s, not %s' % (page, name, costume))
        if page not in pages:
            pages[page] = np.asarray(Image.open(os.path.join(d, page)).convert('RGB'))
        a, k = pages[page], w // FW
        if (w, h) != (FW * k, FH * k):
            raise SystemExit('%s %s %d: a window of %dx%d, not %d x the cell' % (page, an, idx + 1, w, h, k))
        win = a[y:y + h, x:x + w]
        sm = win[k // 2::k, k // 2::k]
        if (np.repeat(np.repeat(sm, k, 0), k, 1) != win).any():
            raise SystemExit('%s %s %d: not an exact %dx page' % (page, an, idx + 1, k))
        fg = (sm != P['navy']).any(-1)
        off = {tuple(c) for c in sm[fg]} - pal
        if off:
            raise SystemExit('%s %s %d: %d colours off the 64 (%s)' % (page, an, idx + 1, len(off), sorted(off)[:4]))
        fr = np.zeros((FH, FW, 4), np.uint8)
        fr[fg, :3] = sm[fg]; fr[fg, 3] = 255
        got.setdefault(name, {}).setdefault(v, {}).setdefault(an, {})[idx] = fr
    out = {}
    for name, views in got.items():
        if set(views) != {'S', 'SE', 'E', 'NE', 'N'}:
            raise SystemExit('%s: views %s, not the five' % (name, sorted(views)))
        for v in views:
            for an, n in COUNT.items():
                if sorted(views[v].get(an, {})) != list(range(n)):
                    raise SystemExit('%s %s %s: frames %s, not %d' % (name, v, an, sorted(views[v].get(an, {})), n))
                views[v][an] = [views[v][an][i] for i in range(n)]
        if P['stand']:
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
    return out


if __name__ == '__main__':
    for costume in (sys.argv[1:] or list(PIECES)):
        for name, frames in sorted(cut(costume).items()):
            pix.write_sheet(name, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))   # (S and E, as tools/townsfolk-sheet.py's)
            mp = os.path.join(ROOT, 'deep16', 'art', name + '.json')
            meta = json.load(open(mp))
            for an, fps in FPS.items():
                meta['anims'][an]['fps'] = fps
            meta['source'] = 'drawn by the art desk (%s), cut by tools/folk-costume-sheet.py (11-15)' % PIECES[costume]['name']
            json.dump(meta, open(mp, 'w'), indent=1)

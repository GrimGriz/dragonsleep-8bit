"""DEEP16 pipeline 2 (generated art): the mirror hyena in its three states -> deep16/art/mirrorhyena_p1 (Normal, worn by the foe),
mirrorhyena_emaciated_p1 (WITHERED) and mirrorhyena_overcharged_p1 (CHARGED), all eight facings, every row the plain hyena has.

    python tools/mirrorhyena-sheet.py            (writes the three sheets' .png/.json)
    python tools/mirrorhyena-sheet.py check      (also deep16/art-src/mirrorhyena/<sheet>-review.png: every row of every drawn view at 3x)

The art desk's MIRROR-HYENA-THREE-STATE-SOURCES (asked 11-14 as deep16-art-wanted.md section 63, on Griz's "Yes, ask for it"), sorted out of Fresh to
deep16/_src/mirrorhyena/2026-11-14-mirror-hyena-three-state-sources/ (the zip beside it): 90 strips, 720 drawings -- Normal, Withered and Charged,
each Idle 8, Walk 8, Bite 8, Death 8, Flinch 6, Laugh 10 in S, SE, E, the rear NE and N; a paint-over of hyena_p2's own cuts (its CUTTER-NOTES.md).
Unlike the wolves' pages (tools/wolfpages.py: painted pages keyed off a navy, scaled down) these come NATIVE: transparent strips already on
hyena_p2's cell and foot (96 x 80, the foot at 48,72), one drawing a 96 x 80 box of FRAME-MAP.json, hard alpha, the 64 colours. So a frame is cut
as drawn, pixel for pixel -- no rescale, no snap, no outline. ONE SCALE: the plain hyena's -- `scale_check` measures each view's idle frame 1
against hyena_p2's idle frame 1 in that view (height and width of the figure) and the cut stops if any is off by more than SCALE_TOL px.
The strips are checked against FRAME-MAP.json's SHA-256 before they are cut. Facings (RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors
(a flip, then a pixel right: the anchor column stays put, as the hyena's and the wolves' cutters do). Rows and fps as hyena_p2's, so the engine's
hyena rows (the pack's laugh's `rofl`, the `flinch`, the fall's `hurt`) play the same on all three.
The STATES are worn by rule (js/seep.js S.stateSheet: <sheet>_emaciated_p1 when WITHERED, <sheet>_overcharged_p1 when CHARGED, 11-14); the moving
ripple and the mirror eye stay the engine's (deep16/data/foes.js mirrorhyena).
"""
import hashlib, json, os, sys
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)

FOLDER = os.path.join(pix.SRC, 'mirrorhyena', '2026-11-14-mirror-hyena-three-state-sources')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):        # (in a worktree: _src is gitignored and lives only in the shared checkout)
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'mirrorhyena', os.path.basename(FOLDER))
BASE = 'hyena_p2'
GEOM = (96, 80, 48, 72)
ROWS = ['idle', 'walk', 'attack', 'hurt', 'flinch', 'rofl']
SHEETS = {'Normal': 'mirrorhyena_p1', 'Withered': 'mirrorhyena_emaciated_p1', 'Charged': 'mirrorhyena_overcharged_p1'}
SCALE_TOL = 3
SOURCE = ('drawn by the art desk (MIRROR-HYENA-THREE-STATE-SOURCES, 11-14, art-wanted section 63: the %s state, Idle 8, Walk 8, Bite 8, Death 8, '
          'Flinch 6, Laugh 10 in five views, a paint-over of hyena_p2 on its own cell), cut by tools/mirrorhyena-sheet.py; SW W NW mirrored -- '
          'deep16/data/foes.js mirrorhyena%s')
FACING = {'S': 0, 'N': 4, 'NE': 5, 'E': 6, 'SE': 7}


def load(folder):
    """-> {(state, facing, row): [frames as RGBA arrays]} from FRAME-MAP.json, every strip's hash checked"""
    fm = json.load(open(os.path.join(folder, 'FRAME-MAP.json'), encoding='utf-8'))
    assert tuple(fm['cell']) == GEOM[:2] and tuple(fm['anchor']) == GEOM[2:], (fm['cell'], fm['anchor'])
    out = {}
    for s in fm['sheets']:
        p = os.path.join(folder, s['file'])
        h = hashlib.sha256(open(p, 'rb').read()).hexdigest()
        assert h == s['sha256'], 'hash: ' + s['file']
        im = np.asarray(Image.open(p).convert('RGBA'))
        fr = []
        for f in sorted(s['frame_map'], key=lambda f: f['index']):
            x, y, w, hh = f['box']
            assert (w, hh) == GEOM[:2], s['file']
            c = im[y:y + hh, x:x + w].copy()
            c[c[..., 3] < 128] = 0; c[c[..., 3] >= 128, 3] = 255              # (hard alpha, as delivered; held to it)
            fr.append(c)
        assert len(fr) == s['frames'], s['file']
        out[(s['state'], s['facing'], s['engine_row'])] = fr
    return out


def mirror(seq):
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def base_frames():
    """hyena_p2's own frames, {row: [8 facings of frames]}, for the scale check and the row fps"""
    meta = json.load(open(os.path.join(pix.ART, BASE + '.json')))
    im = np.asarray(Image.open(os.path.join(pix.ART, BASE + '.png')).convert('RGBA'))
    out = {}
    for r, a in meta['anims'].items():
        out[r] = [[im[a['y'] + f * a['fh']:a['y'] + (f + 1) * a['fh'], i * a['fw']:(i + 1) * a['fw']] for i in range(a['frames'])] for f in range(8)]
    return meta, out


def box(fr):
    ys, xs = np.where(fr[..., 3] > 0)
    return (int(ys.max() - ys.min() + 1), int(xs.max() - xs.min() + 1), int(ys.max())) if len(ys) else (0, 0, 0)


def scale_check(cut, base):
    bad = []
    for v, f in FACING.items():
        for st in SHEETS:
            a, b = box(cut[(st, v, 'idle')][0]), box(base['idle'][f][0])
            print('  %-8s %-2s idle 1: %dh x %dw, foot row %d   (hyena_p2 %dh x %dw, foot row %d)' % ((st, v) + a + b))
            if st == 'Normal' and (abs(a[0] - b[0]) > SCALE_TOL or abs(a[1] - b[1]) > SCALE_TOL):
                bad.append(v)
    assert not bad, 'off the plain hyena\'s scale: %s' % bad


def palette_check(frames):
    px = np.concatenate([fr[fr[..., 3] > 0][:, :3] for fs in frames.values() for f in fs for fr in f]).astype(np.float32)
    u = np.unique(px, axis=0)
    sn = (pix.snap(u[None] / 255.0)[0]).astype(np.int16)
    off = int((np.abs(sn - u.astype(np.int16)).max(-1) > 1).sum())
    print('  colours: %d, off the 64: %d' % (len(u), off))
    return off


def review(name, frames, out, scale=3, bg=(40, 44, 66)):
    order = [0, 7, 6, 5, 4]
    fh, fw = GEOM[1], GEOM[0]
    n = max(len(frames[r][0]) for r in ROWS)
    sheet = Image.new('RGB', (fw * n, fh * len(order) * len(ROWS)), bg)
    for ri, r in enumerate(ROWS):
        for vi, f in enumerate(order):
            for i, fr in enumerate(frames[r][f]):
                im = Image.fromarray(fr, 'RGBA')
                sheet.paste(im, (i * fw, (ri * len(order) + vi) * fh), im)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.resize((sheet.width * scale, sheet.height * scale), Image.NEAREST).save(out)
    print('  review: ' + out)


if __name__ == '__main__':
    cut = load(FOLDER)
    bmeta, base = base_frames()
    scale_check(cut, base)
    fw, fh, ax, ay = GEOM
    for state, name in SHEETS.items():
        frames = {}
        for r in ROWS:
            d = {v: cut.get((state, v, r)) or cut[('Normal', v, r)] for v in FACING}   # (a state short of a row falls back to Normal's: none is short in this delivery)
            frames[r] = [d['S'], mirror(d['SE']), mirror(d['E']), mirror(d['NE']), d['N'], d['NE'], d['E'], d['SE']]
        off = palette_check(frames)
        assert off == 0, name + ': colours off the 64'
        pix.write_sheet(name, frames, fw, fh, ax, ay, pix.top_of(frames['idle'][0] + frames['idle'][6], ay))
        mp = os.path.join(pix.ART, name + '.json')
        meta = json.load(open(mp))
        for r in ROWS:                                       # (hyena_p2's rows exactly: its fps and anything else a row carries)
            for k, v in bmeta['anims'][r].items():
                if k != 'y':
                    meta['anims'][r][k] = v
        meta['source'] = SOURCE % (state, '' if state == 'Normal' else ' (worn when %s: js/seep.js S.stateSheet)' % state.upper())
        json.dump(meta, open(mp, 'w'), indent=1)
        print('  %s: top %d' % (name, meta['top']))
        if 'check' in sys.argv:
            review(name, frames, os.path.join(ROOT, 'deep16', 'art-src', 'mirrorhyena', name + '-review.png'))

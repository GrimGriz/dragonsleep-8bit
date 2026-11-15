"""DEEP16 pipeline 2 (generated art): the ice mephit, the SRD's Small elemental -> deep16/art/icemephit_p1, all eight facings, cut as drawn.

    python tools/icemephit-sheet.py            (writes deep16/art/icemephit_p1.png/.json)

The art desk's ICE-MEPHIT-DEEP16-SOURCES (11-15, a new creature: no art-wanted section), claimed out of Fresh to deep16/_src/icemephit/ (the zip beside its
2026-11-15-ICE-MEPHIT-SOURCES/) by the cutter-fresh-1115 seat on the lanes desk's queue. The pages come NATIVE: drawn at game size on the 64 colours in 64 x 64 cells,
the ground origin at (32, 52), the mat exactly #0e1430, FRAME-MAP.json giving every cell -- so each frame is cut as drawn, the mat keyed out and nothing else (no
rescale, no snap), as tools/shamblingmound-sheet.py cuts its native pages. HEAD 1 SE, 2 the rear NE, 3 S, 4 E, 5 N; SW W NW mirrored (a flip, then a pixel right:
the anchor column stays put). Fly keeps its drawn lift (the art desk's "keep Fly's built-in vertical offset").

Rows: idle 4; still 1 (False Appearance, the folded shard -- js/ui.js plays it till it acts); walk 8; fly 6 (aloft, js/ui.js UI.aloftRow); claws 6 (`release` 2: the
hit on frame 3 -- js/battle.js plays the row named for the attack); breath 6 (Frost Breath, `release` 3 -- js/traits.js M.breathe plays it, the cone the engine's
bloom; only mouth flecks drawn); flinch 4; hurt 6 (Death Burst: it shatters on frame 4, as it dies); prone 2. NOT CUT: Fog Cloud Cast (its innate fog cloud is not
on the grid for a monster yet; its pages stay in _src).
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOLDER = os.path.join(ROOT, 'deep16', '_src', 'icemephit', '2026-11-15-ICE-MEPHIT-SOURCES', 'ICE-MEPHIT')
if not os.path.isdir(FOLDER) and '.claude' in ROOT.split(os.sep):
    FOLDER = os.path.join(ROOT.split(os.sep + '.claude' + os.sep)[0], 'deep16', '_src', 'icemephit', '2026-11-15-ICE-MEPHIT-SOURCES', 'ICE-MEPHIT')
NAME = 'icemephit_p1'
ROWS = [('idle', 'Idle', 5), ('still', 'False Appearance', 1), ('walk', 'Walk', 10), ('fly', 'Fly', 10), ('claws', 'Claws', 10), ('breath', 'Frost Breath', 8),
        ('flinch', 'Flinch', 10), ('hurt', 'Death Burst', 8), ('prone', 'Prone', 6)]
RELEASE = {'claws': 2, 'breath': 3}
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}
SOURCE = ('drawn by the art desk at game size (ICE-MEPHIT-DEEP16-SOURCES, 11-15), cut as drawn by tools/icemephit-sheet.py; SW W NW mirrored -- '
          'the SRD 5.1 Ice Mephit: deep16/data/foes.js icemephit')


def main():
    fm = json.load(open(os.path.join(FOLDER, 'FRAME-MAP.json'), encoding='utf-8'))
    W, H = fm['cell_wh']; AX, AY = fm['anchor_xy']; bg = np.array([int(fm['backdrop'][i:i + 2], 16) for i in (1, 3, 5)], np.uint8)
    cells = {}
    for p in fm['pages']:
        if p['facing'] not in FACE:
            continue
        pg = np.asarray(Image.open(os.path.join(FOLDER, *p['file'].split('/'))).convert('RGB'))
        fs = []
        for f in sorted(p['frames'], key=lambda f: f['frame']):
            x, y, w, h = f['cell_xywh']; assert (w, h) == (W, H) and tuple(f['anchor_xy']) == (AX, AY), (p['file'], f)
            rgb = pg[y:y + h, x:x + w]; c = np.zeros((h, w, 4), np.uint8); c[..., :3] = rgb; c[..., 3] = np.where((rgb == bg).all(-1), 0, 255)
            fs.append(c)
        cells[(FACE[p['facing']], p['action'])] = fs
    for mf, sf in MIRROR.items():
        for (f, act) in [k for k in list(cells) if k[0] == sf]:
            cells[(mf, act)] = [np.roll(c[:, ::-1], 1, axis=1).copy() for c in cells[(f, act)]]
    n = {act: len(cells[(0, act)]) for _, act, _ in ROWS}
    sheet = np.zeros((8 * H * len(ROWS), W * max(n.values()), 4), np.uint8); anims = {}
    for r, (name, act, fps) in enumerate(ROWS):
        for f in range(8):
            fs = cells[(f, act)]; assert len(fs) == n[act], (name, f)
            for i, c in enumerate(fs):
                sheet[(r * 8 + f) * H:(r * 8 + f + 1) * H, i * W:(i + 1) * W] = c
        anims[name] = dict(y=r * 8 * H, fw=W, fh=H, ax=AX, ay=AY, frames=n[act], fps=fps)
        if name in RELEASE:
            anims[name]['release'] = RELEASE[name]
    al = sheet[anims['idle']['y'] + 7 * H:anims['idle']['y'] + 8 * H, :W, 3] > 0
    top = int(AY - np.where(al.any(1))[0].min())
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', NAME + '.png'), optimize=True)
    json.dump(dict(image='art/%s.png' % NAME, fw=W, fh=H, ax=AX, ay=AY, top=top, anims=anims, name='Ice Mephit', source=SOURCE),
              open(os.path.join(ROOT, 'deep16', 'art', NAME + '.json'), 'w', encoding='utf-8', newline='\n'), indent=1)
    print('%s: %dx%d, top %d, rows %s' % (NAME, sheet.shape[1], sheet.shape[0], top, ', '.join('%s %d' % (k, v['frames']) for k, v in anims.items())))


if __name__ == '__main__':
    main()

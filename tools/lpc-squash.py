"""A dwarf's build from an LPC figure (09-28, the 8-bit game's guests in DEEP16; Griz: "LPC compose").

LPC has no dwarf body, so tools/lpc-compose.py composes each dwarf full-size as <id>_full, and this squashes every
frame about the figure's foot into <id>: the legs much shorter (below the hip line), the head and body a little
shorter, the whole a little broader. Nearest-neighbour, so the pixels stay pixels; tools/pixelate.py p0 <id> takes it
from there. A plain uniform shrink (the wagon's children) reads as a small human; a dwarf is short in the leg.

  python tools/lpc-squash.py pyro halldor ...     deep16/_src/lpc/composed/<id>_full/ -> deep16/_src/lpc/composed/<id>/
"""
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'deep16', '_src', 'lpc', 'composed')
LEGS = 19      # the LPC adult's hip line sits this far above the foot (64px frames, foot at y 61)
BUILD = {'legs': 0.55, 'body': 0.94, 'wide': 1.10}


def squash_cell(cell, fx, fy, b):
    """cell: HxWx4 array; (fx, fy) the foot in it. Each output pixel samples its source by the inverse map."""
    h, w = cell.shape[:2]
    hip_src = fy - LEGS
    hip_dst = fy - LEGS * b['legs']
    ys = np.arange(h, dtype=np.float32)
    src_y = np.where(ys >= hip_dst, fy - (fy - ys) / b['legs'], hip_src - (hip_dst - ys) / b['body'])
    xs = np.arange(w, dtype=np.float32)
    src_x = fx + (xs - fx) / b['wide']
    sy = np.floor(src_y + 0.5).astype(int)
    sx = np.floor(src_x + 0.5).astype(int)
    ok_y = (sy >= 0) & (sy < h)
    ok_x = (sx >= 0) & (sx < w)
    out = np.zeros_like(cell)
    yy, xx = np.meshgrid(np.where(ok_y)[0], np.where(ok_x)[0], indexing='ij')
    out[yy, xx] = cell[sy[yy], sx[xx]]
    return out


def squash(fid, b=BUILD):
    src, dst = os.path.join(OUT, fid + '_full'), os.path.join(OUT, fid)
    meta = json.load(open(os.path.join(src, 'meta.json'), encoding='utf-8'))
    os.makedirs(dst, exist_ok=True)
    fw, fh = meta['frame_w'], meta['frame_h']
    foot = meta.get('foot', [fw // 2, fh - 6])
    for anim, info in meta['anims'].items():
        p = os.path.join(src, anim + '.png')
        if not os.path.exists(p):
            continue
        afw, afh = info.get('frame_w', fw), info.get('frame_h', fh)
        fx, fy = info.get('foot', foot)
        sheet = np.asarray(Image.open(p).convert('RGBA')).copy()
        rows, cols = sheet.shape[0] // afh, sheet.shape[1] // afw
        for r in range(rows):
            for c in range(cols):
                cell = sheet[r * afh:(r + 1) * afh, c * afw:(c + 1) * afw]
                sheet[r * afh:(r + 1) * afh, c * afw:(c + 1) * afw] = squash_cell(cell, fx, fy, b)
        Image.fromarray(sheet).save(os.path.join(dst, anim + '.png'))
    notes = meta.get('notes') or []
    meta['notes'] = ([notes] if isinstance(notes, str) else notes) + ['squashed to a dwarf\'s build by tools/lpc-squash.py from %s_full (%s)' % (fid, b)]
    json.dump(meta, open(os.path.join(dst, 'meta.json'), 'w', encoding='utf-8'), indent=1)
    for extra in ('CREDITS.md',):
        if os.path.exists(os.path.join(src, extra)):
            shutil.copy(os.path.join(src, extra), os.path.join(dst, extra))
    print('%-10s <- %s_full' % (fid, fid))


if __name__ == '__main__':
    for fid in sys.argv[1:]:
        squash(fid)

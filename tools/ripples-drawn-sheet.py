"""DEEP16 pipeline 2 (generated art): Mr. Ripples' idle as the art desk skinned it -> ripples_p1, one drawn view (SE) and its mirror (SW).

    python tools/ripples-drawn-sheet.py            (writes deep16/art/ripples_p1.png/.json and deep16/art-src/ripples/ripples_p1-over-blend-4x.png)

11-13, the cutter of the 1113c seat, on the lanes desk's relay. What went out: GUIDE-2026-11-13-mr-ripples-idle, the Blender seat's first crack
(tools/ripples-blend.py, tools/ripples-sheet.py -> ripples_blend_p1: eight frames, five views) for the art desk to skin. What came back, sorted out
of Fresh to deep16/_src/ripples/ART-RIPPLES-IDLE-RESTORED-2026-11-13/: ONE page, "Mr. Ripples restored eight-frame idle sprite sheet" -- the SOUTH-EAST
view only (the Blender SE row's stance, the legs apart and the near arm hanging; the muzzle drawn nearer profile), eight numbered frames in two rows of four on a slate ground: the hyena's head drawn (muzzle, ears, the one gold eye), the crest down
his back, the hands' claws, the hide black with the stars in it. NOT in it: the other four views (S, E, NE, N), and the mirror band that climbs
him on frames 5 to 7 (the engine can lay its own: js/ripple.js 'body', js/looks.js LK.ripple).

The cut: tools/lymen-sheet.py's band_frames (a labelled row read whole, the numbers wiped, the drawings counted off), one scale for the page --
frame 1 as tall as ripples_blend_p1's SE frame 1 -- each frame on its own lowest row and set by its FEET (they are planted: the breath and the
head's turn stay as drawn). The cell is the Blender row's (58 wide or what he needs, 94 high, the feet at 89). SE as drawn, SW its mirror; the row
carries `drawn` [SW, SE] and js/sprites.js shows the nearest for the other six. A REVIEW ROW, worn by nobody: no foe row exists for him.
"""
import importlib.util, json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('lymen_sheet', os.path.join(ROOT, 'tools', 'lymen-sheet.py'))
LS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(LS)
VS = LS.VS
VS.BG_TOL = 30                       # (the house's: this ground is slate and he is black -- nothing of him is near it)

LOOK = 'ripples_p1'
PAGE = os.path.join(VS.pix.SRC, 'ripples', 'ART-RIPPLES-IDLE-RESTORED-2026-11-13', 'Mr. Ripples restored eight-frame idle sprite sheet.png')
E, W_ = 7, 1                       # (SE and SW: the names are the first cut's, when the page was read as East)
ART = os.path.join(ROOT, 'deep16', 'art')


def blend_east():
    """ripples_blend_p1's SE frame 1: (the cell, how tall he stands in it)"""
    j = json.load(open(os.path.join(ART, 'ripples_blend_p1.json'), encoding='utf-8')); a = j['anims']['idle']
    im = np.asarray(Image.open(os.path.join(ART, 'ripples_blend_p1.png')).convert('RGBA'))
    fw, fh = a.get('fw', j['fw']), a.get('fh', j['fh'])
    c = im[a['y'] + E * fh:a['y'] + (E + 1) * fh, :fw]; ys = np.where((c[..., 3] > 0).any(1))[0]
    return j, im, a, fw, fh, ys[-1] - ys[0] + 1


def cut():
    j0, bim, ba, bfw, FH, tall = blend_east(); AY = ba.get('ay', j0['ay'])
    pg = LS.page(PAGE); H = pg.shape[0]
    frames = LS.band_frames(pg, 0, H // 2, 4) + LS.band_frames(pg, H // 2, H, 4)
    k = tall / float(frames[0][1].shape[0])
    cells = []
    for rgb, m, bot in frames:
        o = VS.to1x(rgb, m, k); al = o[..., 3] > 0; ys = np.where(al.any(1))[0]; foot = ys[-1]
        xs = np.where(al[max(0, foot - 4):foot + 1].any(0))[0]
        cells.append((o, (xs.min() + xs.max()) / 2.0, foot))
    reach = max(max(cx, o.shape[1] - cx) for o, cx, foot in cells); fw = max(bfw, int(2 * np.ceil(reach + 2))); ax = fw // 2
    sheet = np.zeros((8 * FH, 8 * fw, 4), np.uint8)
    for i, (o, cx, foot) in enumerate(cells):
        for f, oo, c in ((E, o, cx), (W_, np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - cx)):
            dx, dy = int(round(ax - c)), int(AY - foot); h, w = oo.shape[:2]; sy = max(0, -dy)
            dst = sheet[f * FH + max(0, dy):f * FH + max(0, dy) + h - sy, i * fw + dx:i * fw + dx + w]
            sub = oo[sy:sy + dst.shape[0]]; put = sub[..., 3] > 0; dst[put] = sub[put]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, LOOK + '.png'), optimize=True)
    anims = dict(idle=dict(y=0, fw=fw, fh=FH, ax=ax, ay=AY, frames=8, fps=ba.get('fps', 6), drawn=[W_, E]))
    meta = dict(image='art/%s.png' % LOOK, fw=fw, fh=FH, ax=ax, ay=AY, top=j0['top'], anims=anims, name='Mr. Ripples (the art desk\'s skin: idle, SE)',
                hold=["a review row: his idle as the art desk skinned the Blender figure, the SOUTH-EAST view only (SW its mirror) -- worn by nobody; no foe row exists for him",
                      "the other four views (S, E, NE, N) did not come back; nor did the mirror band on frames 5 to 7 (the engine's own ripple can lay it: js/ripple.js 'body')"],
                source="drawn by the art desk over GUIDE-2026-11-13-mr-ripples-idle (the Blender seat's ripples_blend_p1), 11-13, one page, the SE view; cut by tools/ripples-drawn-sheet.py; SW mirrored")
    with open(os.path.join(ART, LOOK + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: %dx%d, idle 8@%dpx, SE and SW; scale %.4f, stands %d' % (LOOK, sheet.shape[1], sheet.shape[0], fw, k, tall))
    # the still: the skin's SE row over the Blender row's, 4x
    a = sheet[E * FH:(E + 1) * FH]; b = bim[ba['y'] + E * FH:ba['y'] + (E + 1) * FH, :bfw * 8]
    Wd = max(a.shape[1], b.shape[1]); out = Image.new('RGBA', (Wd, 2 * FH), (44, 52, 70, 255))
    out.alpha_composite(Image.fromarray(np.ascontiguousarray(a), 'RGBA'), (0, 0)); out.alpha_composite(Image.fromarray(np.ascontiguousarray(b), 'RGBA'), (0, FH))
    d = os.path.join(ROOT, 'deep16', 'art-src', 'ripples'); os.makedirs(d, exist_ok=True)
    out.resize((Wd * 4, 2 * FH * 4), Image.NEAREST).save(os.path.join(d, LOOK + '-over-blend-4x.png'), optimize=True)


if __name__ == '__main__':
    cut()

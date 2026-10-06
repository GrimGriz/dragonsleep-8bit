"""Rascal's look test: tools/rascal-blend.py -- look <tag> -> one contact sheet to judge at game size, dev/visions/rascal-look-<tag>.png:
the four facings at 2x; then the game's own pixel pass (tools/pixelate.py: boxed to 1x, the lift, the palette snap, the outline) at 3x; then the
same with the lift off; and at the right of each pixel row Denny's idle (deep16/art/denny_p2, facings S and E), feet on the same line, for scale.
(v4's sheet boxed the render down without the palette pass, which is not what the grid draws.)
    python tools/rascal-look.py <tag> [ref=denny|none]"""
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import pixelate as P

opt = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a)
tag = [a for a in sys.argv[1:] if '=' not in a][0]
d = os.path.join(ROOT, 'deep16', '_src', 'rascal', 'look_out', tag)
meta = json.load(open(os.path.join(d, 'meta.json'))); ss, AX, AY = meta['ss'], meta['ax'], meta['ay']
ims = [Image.open(os.path.join(d, 'f%d_00.png' % f)).convert('RGBA') for f in meta['facings']]
box = None
for im in ims:
    b = im.getbbox(); box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
big = [im.crop(box).resize(((box[2] - box[0]) // 2, (box[3] - box[1]) // 2), Image.LANCZOS) for im in ims]
# one cell for the pixel rows: the figure's box at 1x with a margin, the foot line where the anchor falls inside it
x0, y0, x1, y1 = box[0] // ss - 4, box[1] // ss - 4, box[2] // ss + 5, box[3] // ss + 5
cw, ch, foot = x1 - x0, y1 - y0, AY - y0
Z = 3
refs = []
ref = opt.get('ref', 'denny')
if ref != 'none':
    sh = os.path.join(ROOT, 'deep16', 'art', ref + ('_p2' if os.path.exists(os.path.join(ROOT, 'deep16', 'art', ref + '_p2.png')) else '_p1'))
    sim = Image.open(sh + '.png').convert('RGBA'); a = json.load(open(sh + '.json'))['anims']['idle']
    for f in (0, 6):
        refs.append((sim.crop((0, a['y'] + f * a['fh'], a['fw'], a['y'] + (f + 1) * a['fh'])), a['ax'], a['ay']))


def cell(im, ax, ay):
    """an RGBA image at 1x into the cell, its anchor on the cell's foot line, x3 nearest."""
    c = Image.new('RGBA', (cw, ch), (0, 0, 0, 0)); c.paste(im, (cw // 2 - ax, foot - ay), im)
    return c.resize((cw * Z, ch * Z), Image.NEAREST)


rows = []
for lift in (True, False):
    cells = [cell(Image.fromarray(P.pixelate(im, ss, do_lift=lift), 'RGBA'), AX, AY) for im in ims] + [cell(fr, ax, ay) for fr, ax, ay in refs]
    rows.append(cells)
GAP = 12
W = max(sum(c.width for c in big) + GAP * (len(big) + 1), max(sum(c.width for c in r) + GAP * (len(r) + 1) for r in rows))
H = GAP + big[0].height + GAP + sum(r[0].height + GAP + 16 for r in rows)
sheet = Image.new('RGBA', (W, H), (58, 54, 66, 255)); dr = ImageDraw.Draw(sheet)
x, y = GAP, GAP
for im in big:
    sheet.alpha_composite(im, (x, y)); x += im.width + GAP
y += big[0].height + GAP
for lab, cells in zip(("the game's pixel pass, lift on, x3", 'the same, lift off, x3'), rows):
    dr.text((GAP, y), lab + ('' if not refs else '   |   at the right: %s idle, S and E, the same scale' % ref), fill=(214, 218, 232, 255)); y += 16
    x = GAP
    for c in cells:
        sheet.alpha_composite(c, (x, y)); x += c.width + GAP
    y += cells[0].height + GAP
out = os.path.join(ROOT, 'dev', 'visions', 'rascal-look-%s.png' % tag); os.makedirs(os.path.dirname(out), exist_ok=True)
sheet.convert('RGB').save(out); print(out, sheet.size)

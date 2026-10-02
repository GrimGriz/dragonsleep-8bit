"""A contact sheet of a Blender monster's look tests beside sprites already in the game, through the game's own pixel pass (pipeline 1b,
deep16/blender-monsters.md, step 4). Reads deep16/_src/<creature>/look_out/<tag>/ (written by tools/<creature>-blend.py -- look <tag>).

    python tools/look-sheet.py <creature> <tag>[:nolift] [<tag>[:nolift] ...] [ref=clacker,bulette] [cw=84] [ch=92]
        -> dev/visions/<creature>-looks.png: one column per tag (S above, E below, 3x; and a third row, its disguise, where the look
           wrote still_f0.png -- the roper's stalagmite), then the reference sprites (their idle, S and E). cw/ch: a cell's size at 1x
           (the xorn's 84 x 92; a Large creature wants more -- the roper's 150 x 150)
"""
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import pixelate as P

opt = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a)
NAVY, Z, CH, CW = (24, 28, 48, 255), 3, int(opt.get('ch', 92)), int(opt.get('cw', 84))
args = [a for a in sys.argv[1:] if '=' not in a]
refs = opt['ref'].split(',') if 'ref' in opt else ['clacker', 'bulette']
creature, tags = args[0], args[1:]
OUT = os.path.join(ROOT, 'deep16', '_src', creature, 'look_out')


def cell(arr, ax, ay, cw):
    c = Image.new('RGBA', (cw, CH), (0, 0, 0, 0))
    c.paste(Image.fromarray(arr, 'RGBA').crop((ax - cw // 2, ay - (CH - 14), ax - cw // 2 + cw, ay + 14)), (0, 0))
    return c.resize((cw * Z, CH * Z), Image.NEAREST)


cols = []
for t in tags:
    tag, _, flag = t.partition(':')
    m = json.load(open(os.path.join(OUT, tag, 'meta.json')))
    shots = ['f0_00', 'f6_00'] + (['still_f0'] if os.path.exists(os.path.join(OUT, tag, 'still_f0.png')) else [])
    cols.append((t, [cell(P.pixelate(Image.open(os.path.join(OUT, tag, s + '.png')), m['ss'], do_lift=(flag != 'nolift')), m['ax'], m['ay'], CW) for s in shots]))
for name in refs:
    sh = '%s_p2' % name if os.path.exists(os.path.join(ROOT, 'deep16', 'art', '%s_p2.png' % name)) else '%s_p1' % name
    im = Image.open(os.path.join(ROOT, 'deep16', 'art', sh + '.png')).convert('RGBA')
    a = json.load(open(os.path.join(ROOT, 'deep16', 'art', sh + '.json')))['anims']['idle']
    cols.append(('ref ' + name, [cell(np.asarray(im.crop((0, a['y'] + f * a['fh'], a['fw'], a['y'] + (f + 1) * a['fh']))), a['ax'], a['ay'], max(100, CW)) for f in (0, 6)]))
W = sum(c[1][0].width for c in cols)
NR = max(len(c[1]) for c in cols)
sheet = Image.new('RGBA', (W, 28 + NR * CH * Z), NAVY)
x = 0
for label, cells in cols:
    ImageDraw.Draw(sheet).text((x + 4, 8), label, fill=(214, 218, 232, 255))
    for k, c in enumerate(cells):
        sheet.alpha_composite(c, (x, 28 + k * CH * Z))
    x += cells[0].width
out = os.path.join(ROOT, 'dev', 'visions', '%s-looks.png' % creature)
os.makedirs(os.path.dirname(out), exist_ok=True)
sheet.convert('RGB').save(out)
print('wrote', out)

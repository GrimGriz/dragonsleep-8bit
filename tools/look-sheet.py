"""A contact sheet of a Blender monster's look tests beside sprites already in the game, through the game's own pixel pass (pipeline 1b,
deep16/blender-monsters.md, step 4). Reads deep16/_src/<creature>/look_out/<tag>/ (written by tools/<creature>-blend.py -- look <tag>).

    python tools/look-sheet.py <creature> <tag>[:nolift] [<tag>[:nolift] ...] [ref=clacker,bulette]
        -> dev/visions/<creature>-looks.png: one column per tag (S above, E below, 3x), then the reference sprites (their idle, S and E)
"""
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import pixelate as P

NAVY, Z, CH = (24, 28, 48, 255), 3, 92
args = [a for a in sys.argv[1:] if not a.startswith('ref=')]
refs = next((a[4:].split(',') for a in sys.argv[1:] if a.startswith('ref=')), ['clacker', 'bulette'])
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
    cols.append((t, [cell(P.pixelate(Image.open(os.path.join(OUT, tag, 'f%d_00.png' % f)), m['ss'], do_lift=(flag != 'nolift')), m['ax'], m['ay'], 84) for f in (0, 6)]))
for name in refs:
    sh = '%s_p2' % name if os.path.exists(os.path.join(ROOT, 'deep16', 'art', '%s_p2.png' % name)) else '%s_p1' % name
    im = Image.open(os.path.join(ROOT, 'deep16', 'art', sh + '.png')).convert('RGBA')
    a = json.load(open(os.path.join(ROOT, 'deep16', 'art', sh + '.json')))['anims']['idle']
    cols.append(('ref ' + name, [cell(np.asarray(im.crop((0, a['y'] + f * a['fh'], a['fw'], a['y'] + (f + 1) * a['fh']))), a['ax'], a['ay'], 100) for f in (0, 6)]))
W = sum(c[1][0].width for c in cols)
sheet = Image.new('RGBA', (W, 28 + 2 * CH * Z), NAVY)
x = 0
for label, (s, e) in cols:
    ImageDraw.Draw(sheet).text((x + 4, 8), label, fill=(214, 218, 232, 255))
    sheet.alpha_composite(s, (x, 28)); sheet.alpha_composite(e, (x, 28 + CH * Z)); x += s.width
out = os.path.join(ROOT, 'dev', 'visions', '%s-looks.png' % creature)
os.makedirs(os.path.dirname(out), exist_ok=True)
sheet.convert('RGB').save(out)
print('wrote', out)

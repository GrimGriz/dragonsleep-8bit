"""The twin-mace mannequin's modeling poses laid out for the art desk (11-12): tools/twinmace-blend.py renders, this writes the reference strips.
Plain Python (Pillow).

    python tools/twinmace-sheet.py            the human striker (with the target, and alone)
    python tools/twinmace-sheet.py dwarf      the dwarf-proportioned striker, no target (deep16/_src/twinmace-dwarf/ -> twinmace-dwarf-*.png)
    python tools/twinmace-sheet.py sword [dwarf]   the one-handed slash (deep16/_src/slash1h[-dwarf]/ -> deep16/art-src/slash1h/slash1h-*.png)
    python tools/twinmace-sheet.py longbow|stab dwarf           the road patrol's two (deep16/art-src/longbow/, stab/), laid the same way
    python tools/twinmace-sheet.py axe|handaxe|crossbow dwarf   the garrison's three (11-12: deep16/_src/<axeshield|handaxe|crossbow>-dwarf/ ->
                                              deep16/art-src/<name>/<name>-dwarf-<view>.png the striker alone, <name>-dwarf-target-<view>.png with
                                              the target, and a page of all five views of each)

Reads deep16/_src/twinmace/ (model/ the striker with the target, render/ the striker alone, meta.json; gitignored); writes deep16/art-src/twinmace/:
    twinmace-<S|SE|E|NE|N>.png   one strip a drawn facing: the six frames large on the art desk's navy, the target standing in each, numbered
                                 1-6 under the feet line, the release frame's number gold with HIT under it.
    twinmace-alone-<...>.png     the same six without the target: the striker's own silhouette, for the sprite.
    twinmace-all.png             the five facings on one page, half the size: the whole motion at a glance.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DWARF = 'dwarf' in sys.argv[1:]
SWORD = 'sword' in sys.argv[1:]
NAME = 'slash1h' if SWORD else 'twinmace'          # the folders' and the strips' name
ROW = 'slash' if SWORD else 'twinmace'
MOVE = 'ONE-HANDED SLASH' if SWORD else 'TWIN STRIKE, TWO MACES'
HIT = 'THE CUT' if SWORD else 'HIT'
GARR = {'axe': ('axeshield', 'axecut', 'BATTLEAXE CUT, ROUND SHIELD', 'THE CUT'), 'handaxe': ('handaxe', 'throw', 'HANDAXE THROW', 'RELEASE'),
        'crossbow': ('crossbow', 'shoot', 'HEAVY CROSSBOW SHOT', 'LOOSE'),           # the garrison's three (11-12)
        'longbow': ('longbow', 'shoot', 'LONGBOW SHOT', 'LOOSE'), 'stab': ('stab', 'stab', 'SHORTSWORD STAB', 'THE STAB')}      # the road patrol's two
for _k in GARR:
    if _k in sys.argv[1:]:
        NAME, ROW, MOVE, HIT = GARR[_k]
SRC = os.path.join(ROOT, 'deep16', '_src', NAME + ('-dwarf' if DWARF else ''))
OUT = os.path.join(ROOT, 'deep16', 'art-src', NAME)
NAVY, GOLD, INK, LINE = (12, 20, 40), (240, 196, 64), (226, 232, 244), (120, 140, 176)
NAMES = {'S': 'FRONT (S)', 'SE': 'FRONT-RIGHT (SE)', 'E': 'RIGHT SIDE (E)', 'NE': 'BACK-RIGHT (NE)', 'N': 'BACK (N)'}


def font(px):
    for f in ('consolab.ttf', 'consola.ttf', 'DejaVuSansMono-Bold.ttf'):
        for d in ('C:/Windows/Fonts', '/usr/share/fonts/truetype/dejavu'):
            try:
                return ImageFont.truetype(os.path.join(d, f), px)
            except OSError:
                pass
    return ImageFont.load_default(px)


def strip(kind, M, f, n, rel, zoom, title):
    """one facing's frames in a row: each render (ss x the cell) drawn at `zoom` x the cell."""
    fw, fh, ay = M['fw'], M['fh'], M['ay']
    cw, ch = fw * zoom, fh * zoom; top, foot = 16 * zoom, 14 * zoom
    pg = Image.new('RGBA', (cw * n + 4 * zoom, top + ch + foot), NAVY + (255,)); d = ImageDraw.Draw(pg)
    F1, F2 = font(5 * zoom), font(4 * zoom)
    d.text((pg.width // 2, 7 * zoom), title, font=F1, fill=INK, anchor='mm')
    fy = top + (ay + 1) * zoom
    d.line([(2 * zoom, fy), (pg.width - 2 * zoom, fy)], fill=LINE, width=max(1, zoom // 4))
    for i in range(n):
        im = Image.open(os.path.join(SRC, kind, ROW, '%s_%02d.png' % (f, i))).convert('RGBA').resize((cw, ch), Image.LANCZOS)
        pg.alpha_composite(im, (2 * zoom + i * cw, top))
        x = 2 * zoom + i * cw + cw // 2
        d.text((x, fy + 4 * zoom), str(i + 1), font=F1, fill=GOLD if i == rel else INK, anchor='mm')
        if i == rel:
            d.text((x, fy + 9 * zoom), HIT, font=F2, fill=GOLD, anchor='mm')
    return pg


def main():
    meta = json.load(open(os.path.join(SRC, 'render', 'meta.json')))
    os.makedirs(OUT, exist_ok=True)
    n = meta['rows'][ROW]['frames']; rel = meta['rows'][ROW]['release']; small = []; withT = []
    for f in meta['facings']:
        if DWARF:      # (no target: the striker's own strips, and the page of all five)
            b = strip('render', meta['rows'][ROW], f, n, rel, 4, 'DWARF MANNEQUIN - %s - %s' % (MOVE, NAMES[f]))
            b.convert('RGB').save(os.path.join(OUT, NAME + '-dwarf-%s.png' % f), optimize=True)
            small.append(strip('render', meta['rows'][ROW], f, n, rel, 2, NAMES[f]))
            if meta.get('model'):      # (a dwarf set rendered with the target as well: the garrison's)
                a = strip('model', meta['model'][ROW], f, n, rel, 4, 'DWARF MANNEQUIN - %s - %s - with the target' % (MOVE, NAMES[f]))
                a.convert('RGB').save(os.path.join(OUT, NAME + '-dwarf-target-%s.png' % f), optimize=True)
                withT.append(strip('model', meta['model'][ROW], f, n, rel, 2, NAMES[f]))
            continue
        a = strip('model', meta['model'][ROW], f, n, rel, 4, 'MANNEQUIN - %s - %s' % (MOVE, NAMES[f]))
        a.convert('RGB').save(os.path.join(OUT, NAME + '-%s.png' % f), optimize=True)
        b = strip('render', meta['rows'][ROW], f, n, rel, 4, 'MANNEQUIN - %s - %s - the striker alone' % (MOVE, NAMES[f]))
        b.convert('RGB').save(os.path.join(OUT, NAME + '-alone-%s.png' % f), optimize=True)
        small.append(strip('model', meta['model'][ROW], f, n, rel, 2, NAMES[f]))
    W = max(s.width for s in small); H = sum(s.height for s in small)
    pg = Image.new('RGB', (W, H), NAVY); y = 0
    for s in small:
        pg.paste(s.convert('RGB'), ((W - s.width) // 2, y)); y += s.height
    pg.save(os.path.join(OUT, NAME + ('-dwarf-all.png' if DWARF else '-all.png')), optimize=True)
    if withT:
        W = max(s.width for s in withT); pg = Image.new('RGB', (W, sum(s.height for s in withT)), NAVY); y = 0
        for s in withT:
            pg.paste(s.convert('RGB'), ((W - s.width) // 2, y)); y += s.height
        pg.save(os.path.join(OUT, NAME + '-dwarf-target-all.png'), optimize=True)
    print('twinmace-sheet: %s -- twinmace-{%s}.png, twinmace-alone-*.png, twinmace-all.png' % (OUT, ','.join(meta['facings'])))


if __name__ == '__main__':
    main()

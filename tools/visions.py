"""The landlord's pictures (the telepathy in the Wet, deep16/js/wet.js W.picture): Griz's paintings from his image runs
(dev/visions/*.jpg, gitignored like deep16/_src/) brought down to the grid's size and a 16-bit palette, written to
deep16/art/visions/<kind>.png. Prints each one's ?v= hash for W.PICS.

  python tools/visions.py            write the five
  python tools/visions.py preview    also a 3x contact sheet at dev/visions/_preview.png
"""
import hashlib, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'dev', 'visions')
OUT = os.path.join(ROOT, 'deep16', 'art', 'visions')
# kind (W.picture's names) <- his file
KINDS = [('bucket', 'bucket.jpg'), ('fall', 'the-fall.jpg'), ('crook', 'the-crook.jpg'), ('clackers', 'the-clackers.jpg'), ('bats', 'the-chimney.jpg')]
W = 360        # the grid is 480 x 270; W.picture draws these at about this width, so the screen's own pixels do the 16-bit
COLOURS = 64   # a palette of its own per picture, dithered: a cutscene's still, not a sprite


def one(src):
    im = Image.open(src).convert('RGB')
    h = round(im.height * W / im.width)
    im = im.resize((W, h), Image.LANCZOS)
    return im.quantize(colors=COLOURS, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG)


def main(argv):
    os.makedirs(OUT, exist_ok=True)
    made = []
    for kind, name in KINDS:
        p = os.path.join(SRC, name)
        if not os.path.exists(p):
            print('missing', p)
            continue
        im = one(p)
        out = os.path.join(OUT, kind + '.png')
        im.save(out, optimize=True)
        hsh = hashlib.sha1(open(out, 'rb').read()).hexdigest()[:10]
        made.append((kind, im))
        print("%-9s %dx%d %6d bytes  '%s.png?v=%s'" % (kind, im.width, im.height, os.path.getsize(out), kind, hsh))
    if 'preview' in argv and made:
        sheet = Image.new('RGB', (W * 3, sum(m.height for _, m in made[:1]) * 3 * len(made)))
        y = 0
        for _, m in made:
            big = m.convert('RGB').resize((m.width * 3, m.height * 3), Image.NEAREST)
            sheet.paste(big, (0, y)); y += big.height
        sheet.save(os.path.join(SRC, '_preview.png'))
    print('ok: %d pictures' % len(made))


if __name__ == '__main__':
    main(sys.argv[1:])

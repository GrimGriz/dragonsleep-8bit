"""MR. RIPPLES' idle (tools/ripples-blend.py's renders) through the palette and outline step, then WHAT HE IS laid over the silhouette, and the
sheet row. Plain Python (Pillow, numpy).

    python tools/ripples-sheet.py            deep16/art/ripples_blend_p1.png/.json (idle 8 and walk 8, eight facings: S SE E NE N rendered, SW W NW mirrored;
                                             worn by nobody -- deep16/?rows=ripples_blend_p1,mirrorgnoll_p1&beside) and
                                             deep16/art-src/ripples/ripples-<idle|walk>-views-4x.png (the five views, eight frames, 4x)
    python tools/ripples-sheet.py guide      also the art desk's guide frames: deep16/_src/outbox/GUIDE-2026-11-13c-mr-ripples-idle-and-walk/ (gitignored)

The model is rendered in a violet guide colour so its form shows. After tools/pixelate.py snaps and outlines a frame, this script makes him
the page's Mr. Ripples (wiki/the-trickster.md): "the hide black that gives back no light, with stars moving in it" and "he ripples mirrors".
  THE HIDE   every violet pixel goes to the outline's black, the paler shapes (chest, claws) to the darkest violet: a hole in the picture.
  THE STARS  a field of a few points fixed to the SCREEN, drifting two pixels a frame on a 16 px tile (so the eight frames loop), seen only
             through the hide's inside: he moves and the stars do not move with him.
  THE TENDRILS (11-13) are the model's own (tools/ripples-blend.py): the same black, the same stars through them.
  THE RIPPLE (OFF since 11-13, BAND empty: the engine runs it, deep16/js/ripple.js) once a loop, on frames 5-7 (the idle's shudder), a band of mirror facets climbs him from the knees to the head: silver and
             glass-blue, a few facets carrying warm colours -- what stands before him, given back (Griz's pasted parable, 11-13, "as
             inspiration or to ignore": a mirror that steals any light shown to it). No silver in his FACE at rest: the band passes and is gone.
The eye, the teeth and the socket are kept as rendered.
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)
SRC = os.path.join(ROOT, 'deep16', '_src', 'ripples', 'render')
ART = os.path.join(ROOT, 'deep16', 'art')
OUT = os.path.join(ROOT, 'deep16', 'art-src', 'ripples')
VIEWS = ['S', 'SE', 'E', 'NE', 'N']
FACING = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 'SE', 2: 'E', 3: 'NE'}
P = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps']
rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
VIOLET = [rgb(c) for c in P['violet']]
BLACK, DEEP = rgb(P['outline'][0]), rgb(P['violet'][0])
STARS = [(3, 2, rgb(P['bone'][2])), (11, 5, rgb(P['violet'][5])), (7, 9, rgb(P['bone'][0])), (14, 12, rgb(P['violet'][4])), (1, 13, rgb(P['glow'][2])), (9, 15, rgb(P['violet'][5]))]
FACETS = [rgb(P['silver'][6]), rgb(P['silver'][5]), rgb(P['glow'][2]), rgb(P['silver'][4]), rgb(P['bone'][2]), rgb(P['silver'][5]), rgb(P['gold'][3]), rgb(P['silver'][6]),
          rgb(P['glow'][1]), rgb(P['silver'][4]), rgb(P['skin'][3]), rgb(P['silver'][6])]
BAND = {}          # (was {4: 0.30, 5: 0.58, 6: 0.86}: the band climbing him on frames 5-7 -- OFF since 11-13, his "i told it to pull the mirror bands as we'd had the game engine run it on harbinger": the ripple is the engine's, deep16/js/ripple.js)
TEND = (1, 2, 3, 4, 5, 6)          # the frames (from 0) the two tendrils are out on: a bud on 2, the lash on 4 and 5, a stub on 7 (tools/ripples-blend.py)
AVOID = [r for r in P if r not in ('violet', 'bone', 'gold', 'outline')]


def become(a, i, ay, tall):
    """a: one snapped, outlined frame (RGBA uint8) -> Mr. Ripples on frame i"""
    a = a.copy(); H, W = a.shape[:2]; solid = a[..., 3] > 0
    viol = np.zeros((H, W), bool); pale = np.zeros((H, W), bool)
    for k, c in enumerate(VIOLET):
        m = solid & (a[..., 0] == c[0]) & (a[..., 1] == c[1]) & (a[..., 2] == c[2]); viol |= m
        if k >= 4:
            pale |= m
    a[viol, :3] = BLACK; a[pale, :3] = DEEP
    for c in P['gold']:           # the one eye: lit, whatever shade the render left it (nothing else of his is gold)
        c = rgb(c); a[solid & (a[..., 0] == c[0]) & (a[..., 1] == c[1]) & (a[..., 2] == c[2]), :3] = rgb(P['gold'][4])
    inside = viol.copy()          # the hide's inside: a hide pixel whose four neighbours are all the figure
    inside[1:, :] &= solid[:-1, :]; inside[:-1, :] &= solid[1:, :]; inside[:, 1:] &= solid[:, :-1]; inside[:, :-1] &= solid[:, 1:]
    for sx, sy, c in STARS:
        for y in range((sy + i) % 16, H, 16):          # (one pixel down and two across a frame: sixteen in eight frames)
            for x in range((sx + 2 * i) % 16, W, 16):
                if inside[y, x] and (x * 7 + y * 13 + i) % 5:          # (a star in five dark on any frame: they twinkle)
                    a[y, x, :3] = c
    if i in BAND:
        yc = ay - BAND[i] * tall
        for x in range(W):
            j = (x * 2654435761 >> 7) % 3 - 1          # a ragged edge, a column at a time
            for y in range(int(yc) - 3 + j, int(yc) + 4 + j):
                if 0 <= y < H and viol[y, x]:
                    a[y, x, :3] = FACETS[(x * 5 + y * 3 + (x // 3) * (y // 2)) % len(FACETS)] if (x + y) % 2 == 0 or abs(y - yc) < 2 else BLACK
    return a


def font(px):
    try:
        return ImageFont.truetype('C:/Windows/Fonts/consolab.ttf', px)
    except OSError:
        return ImageFont.load_default(px)


def main():
    meta = json.load(open(os.path.join(SRC, 'meta.json'))); R = meta['rows']; ROWS = [r for r in ('idle', 'walk') if r in R]
    raw = {r: {v: [pix.pixelate(Image.open(os.path.join(SRC, r, '%s_%02d.png' % (v, i))), meta['ss'], avoid=AVOID) for i in range(R[r]['frames'])] for v in VIEWS} for r in ROWS}
    tall = pix.top_of(raw['idle']['S'][:1], R['idle']['ay'])
    C = {r: {v: [become(raw[r][v][i], i, R[r]['ay'], tall) for i in range(R[r]['frames'])] for v in VIEWS} for r in ROWS}
    frames = {}
    for r in ROWS:
        by = {FACING[v]: C[r][v] for v in VIEWS}
        for f, v in MIRROR.items():
            by[f] = [fr[:, ::-1] for fr in C[r][v]]
        frames[r] = [by[f] for f in range(8)]
    M = R['idle']
    pix.write_sheet('ripples_blend_p1', frames, M['fw'], M['fh'], M['ax'], M['ay'], tall, {r: (R[r]['fw'], R[r]['fh'], R[r]['ax'], R[r]['ay']) for r in ROWS})
    p = os.path.join(ART, 'ripples_blend_p1.json'); j = json.load(open(p, encoding='utf-8'))
    j.update(name='Mr. Ripples (Blender: idle, walk)',
             hold=['a review sheet: Mr. Ripples\' idle with his two tendrils (out of the shoulder blades on 2, a full-square lash on 4 and 5, gone by 8) and his walk (no tendrils), '
                   'for Griz\'s eye and the art desk\'s paint-over -- worn by nobody; no foe row exists for him',
                   'his size (80 rows, the gnoll matriarch\'s), which socket is empty (his left), no kit, the gold eye are the seat\'s leans, put to Griz'],
             source='built and rendered by tools/ripples-blend.py on the mannequin\'s bones (11-13), snapped and outlined by tools/pixelate.py; the hide and '
                    'the stars laid by tools/ripples-sheet.py; S SE E NE N rendered, SW W NW mirrored')
    json.dump(j, open(p, 'w', encoding='utf-8'), indent=1)

    os.makedirs(OUT, exist_ok=True); Z = 4; lab = 40; NAVY = (44, 52, 70)          # (a lighter ground than the game's navy: he is a hole, and a hole wants something to be a hole in)

    def page(r, z):
        m = R[r]; n = m['frames']; pg = Image.new('RGB', (lab + m['fw'] * n * z, m['fh'] * z * 5), NAVY); d = ImageDraw.Draw(pg)
        for k, v in enumerate(VIEWS):
            s = Image.fromarray(np.concatenate(C[r][v], axis=1), 'RGBA'); bg = Image.new('RGBA', s.size, NAVY + (255,)); bg.alpha_composite(s)
            pg.paste(bg.resize((s.width * z, s.height * z), Image.NEAREST).convert('RGB'), (lab, k * m['fh'] * z)); d.text((6, k * m['fh'] * z + 8), v, font=font(13), fill=(226, 232, 244))
        return pg
    for r in ROWS:
        page(r, Z).save(os.path.join(OUT, 'ripples-%s-views-4x.png' % r), optimize=True)

    if 'guide' in sys.argv[1:]:          # what the art desk paints from: a folder a row -- each view's eight frames large, the model as rendered (flat shapes, a clean line), and as he is at 6x; the sheet and its json; the positions
        import shutil
        G = os.path.join(ROOT, 'deep16', '_src', 'outbox', 'GUIDE-2026-11-13c-mr-ripples-idle-and-walk')
        for r in ROWS:
            D = os.path.join(G, r); os.makedirs(D, exist_ok=True); n = R[r]['frames']
            for v in VIEWS:
                ims = [Image.open(os.path.join(SRC, r, '%s_%02d.png' % (v, i))).convert('RGBA') for i in range(n)]
                w, h = ims[0].size; pgm = Image.new('RGBA', (w * n, h + 40), (96, 104, 120, 255)); dd = ImageDraw.Draw(pgm)
                for i, im in enumerate(ims):
                    mark = r == 'idle' and i in TEND
                    pgm.alpha_composite(im, (i * w, 0)); dd.text((i * w + w // 2, h + 20), str(i + 1) + (' TENDRILS' if mark else ''), font=font(22), fill=(240, 196, 64) if mark else (226, 232, 244), anchor='mm')
                pgm.convert('RGB').save(os.path.join(D, 'ripples-%s-model-%s.png' % (r, v)), optimize=True)
                s = Image.fromarray(np.concatenate(C[r][v], axis=1), 'RGBA'); bg = Image.new('RGBA', s.size, NAVY + (255,)); bg.alpha_composite(s)
                bg.resize((s.width * 6, s.height * 6), Image.NEAREST).convert('RGB').save(os.path.join(D, 'ripples-%s-as-he-is-%s-6x.png' % (r, v)), optimize=True)
        for a, b in ((os.path.join(ART, 'ripples_blend_p1.png'), 'ripples_blend_p1.png'), (p, 'ripples_blend_p1.json'), (os.path.join(SRC, 'ripples-poses.json'), 'ripples-poses.json')):
            shutil.copyfile(a, os.path.join(G, b))
        print('  guide frames: ' + G)


if __name__ == '__main__':
    main()

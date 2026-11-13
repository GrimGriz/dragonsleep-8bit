"""The Blender Lymen's renders (tools/lymen-blend.py) through the pipeline's own palette and outline step (tools/pixelate.py `pixelate`), laid as a
REVIEW sheet in the game's row shape, and the comparison stills beside the art desk's drawn row. Plain Python (Pillow, numpy).

    python tools/lymen-blend-sheet.py [griz]

Reads deep16/_src/lymen-blend/render/ (gitignored); writes
    deep16/art/lymen_blend_p2.png/.json     idle 1 and attack 6 (release 3), eight facings: S SE E NE N rendered, SW W NW their mirrors. Worn by
                                            nobody: the row gallery shows it beside the drawn checkpoint, deep16/?rows=lymen_blend_p2,lymen_check_p2&beside
    deep16/art-src/lymen-blend/
        lymen-blend-views-4x.png            the five rendered views, six beats each, at 4x on the game's navy
        lymen-blend-vs-drawn-SE.png         like for like: the rendered SE row over the art desk's drawn SE row (lymen_check_p2), at 1x and at 4x
        lymen-blend-griz-vs-drawn-SE.png    (`griz`, when deep16/_src/lymen-blend-griz/ is rendered) the same figure on the very poser file the
                                            art desk drew over (his 11-13 00:12 frames), over the drawn row: fidelity frame by frame
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pix)
ART = os.path.join(ROOT, 'deep16', 'art')
OUT = os.path.join(ROOT, 'deep16', 'art-src', 'lymen-blend')
NAVY, INK, GOLD = (12, 20, 40), (226, 232, 244), (240, 196, 64)
VIEWS = ['S', 'SE', 'E', 'NE', 'N']
FACING = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 'SE', 2: 'E', 3: 'NE'}          # SW, W, NW (RULED 10-14)
AVOID = ['fire', 'skin', 'red', 'violet', 'glow', 'blue']          # (ramps nothing of his is made of: a shaded edge never lands on one)


def font(px):
    for f in ('consolab.ttf', 'consola.ttf'):
        try:
            return ImageFont.truetype(os.path.join('C:/Windows/Fonts', f), px)
        except OSError:
            pass
    return ImageFont.load_default(px)


def cells(src):
    """{row: {view: [RGBA arrays at 1x]}} and the render's meta"""
    d = os.path.join(ROOT, 'deep16', '_src', src, 'render'); meta = json.load(open(os.path.join(d, 'meta.json')))
    C = {}
    for row, info in meta['rows'].items():
        C[row] = {v: [pix.pixelate(Image.open(os.path.join(d, row, '%s_%02d.png' % (v, i))), meta['ss'], avoid=AVOID) for i in range(info['frames'])]
                  for v in VIEWS}
    return C, meta


def strip(frames):
    return Image.fromarray(np.concatenate(frames, axis=1), 'RGBA')


def drawn_row(name='lymen_check_p2', f=7):
    j = json.load(open(os.path.join(ART, name + '.json'), encoding='utf-8')); a = j['anims']['attack']
    im = Image.open(os.path.join(ART, name + '.png')).convert('RGBA')
    return im.crop((0, a['y'] + f * a['fh'], a['fw'] * a['frames'], a['y'] + (f + 1) * a['fh'])), a


def versus(mine, M, path, label):
    """the rendered SE row over the drawn SE row: at 1x, then at 4x, the feet on one line, numbered, the cut gold"""
    dr, a = drawn_row(); n = 6
    cw = max(M['fw'], a['fw']); up = max(M['ay'], a['ay']); dn = max(M['fh'] - M['ay'], a['fh'] - a['ay']); ch = up + dn

    def row(im, fw, ax, ay):
        r = Image.new('RGBA', (cw * n, ch), NAVY + (255,))
        for i in range(n):
            r.alpha_composite(im.crop((i * fw, 0, (i + 1) * fw, im.height)), (i * cw + cw // 2 - ax, up - ay))
        return r
    A, B = row(mine, M['fw'], M['ax'], M['ay']), row(dr, a['fw'], a['ax'], a['ay'])
    F, F2 = font(13), font(11); lab = 150; Z = 4
    W = lab + cw * n * Z; H = 26 + ch * 2 + 14 + (ch * Z + 22) * 2
    pg = Image.new('RGB', (W, H), NAVY); d = ImageDraw.Draw(pg); y = 22
    d.text((6, 4), 'LYMEN, LONGSWORD SLASH BEHIND THE SHIELD, SE: ' + label, font=F, fill=INK)
    for im, t in ((A, 'BLENDER 1x'), (B, 'DRAWN 1x')):
        pg.paste(im.convert('RGB'), (lab, y)); d.text((6, y + ch // 2), t, font=F2, fill=INK); y += ch
    y += 14
    for im, t in ((A, 'BLENDER 4x'), (B, 'DRAWN 4x')):
        pg.paste(im.resize((im.width * Z, im.height * Z), Image.NEAREST).convert('RGB'), (lab, y)); d.text((6, y + ch * Z // 2), t, font=F2, fill=INK)
        for i in range(n):
            d.text((lab + i * cw * Z + cw * Z // 2, y + ch * Z + 9), str(i + 1) + (' THE CUT' if i == 3 else ''), font=F2, fill=GOLD if i == 3 else INK, anchor='mm')
        y += ch * Z + 22
    pg.save(path, optimize=True); print('  ' + path)


def main():
    os.makedirs(OUT, exist_ok=True)
    C, meta = cells('lymen-blend'); R = meta['rows']
    frames = {}
    for row, anim in (('idle', 'idle'), ('slash', 'attack')):
        by = {FACING[v]: C[row][v] for v in VIEWS}
        for f, v in MIRROR.items():
            by[f] = [fr[:, ::-1] for fr in C[row][v]]
        frames[anim] = [by[f] for f in range(8)]
    sizes = {a: (R[r]['fw'], R[r]['fh'], R[r]['ax'], R[r]['ay']) for r, a in (('idle', 'idle'), ('slash', 'attack'))}
    i_ = R['idle']
    pix.write_sheet('lymen_blend_p2', frames, i_['fw'], i_['fh'], i_['ax'], i_['ay'], pix.top_of(frames['idle'][0], i_['ay']), sizes)
    p = os.path.join(ART, 'lymen_blend_p2.json'); j = json.load(open(p, encoding='utf-8'))
    j['anims']['attack'].update(release=R['slash']['release'], fps=10)          # (10 fps, as lymen_check_p2 plays: the two beside each other in step)
    j['anims']['idle']['fps'] = 1
    j.update(name='Lymen (Blender, on the mannequin)',
             hold=["a review sheet: the EXPERIMENT of 11-13 -- Lymen modelled on the mannequin's own bones and rendered from the rig, to judge beside "
                   "the art desk's drawn row -- worn by nobody",
                   'the rows are the rig\'s as it stands on main (his gist, re-posed after the art desk drew its checkpoint): the poses differ a little from the drawn row\'s'],
             source='built and rendered by tools/lymen-blend.py over tools/twinmace-blend.py kit=sword+shield (11-13), snapped and outlined by '
                    'tools/pixelate.py, laid by tools/lymen-blend-sheet.py; S SE E NE N rendered, SW W NW mirrored')
    json.dump(j, open(p, 'w', encoding='utf-8'), indent=1)

    # the five views at 4x
    M = R['slash']; Z = 4; F = font(13); lab = 40
    pg = Image.new('RGB', (lab + M['fw'] * 6 * Z, M['fh'] * Z * 5), NAVY); d = ImageDraw.Draw(pg)
    for k, v in enumerate(VIEWS):
        s = strip(C['slash'][v]); bg = Image.new('RGBA', s.size, NAVY + (255,)); bg.alpha_composite(s)
        pg.paste(bg.resize((s.width * Z, s.height * Z), Image.NEAREST).convert('RGB'), (lab, k * M['fh'] * Z)); d.text((6, k * M['fh'] * Z + 8), v, font=F, fill=INK)
    pg.save(os.path.join(OUT, 'lymen-blend-views-4x.png'), optimize=True)

    versus(strip(C['slash']['SE']), M, os.path.join(OUT, 'lymen-blend-vs-drawn-SE.png'), 'the rig on main (his gist) over the drawn checkpoint')
    if 'griz' in sys.argv[1:]:
        G, gm = cells('lymen-blend-griz')
        versus(strip(G['slash']['SE']), gm['rows']['slash'], os.path.join(OUT, 'lymen-blend-griz-vs-drawn-SE.png'),
               'the very frames the art desk drew over (his 11-13 00:12 poser file)')


if __name__ == '__main__':
    main()

"""The mannequin's renders laid out (10-31, the pilot of Griz's "skin these figures with this character"): tools/mannequin-blend.py renders,
this lays them on the DEEP16 cell grid and writes the reference strips the art desk skins. Plain Python (Pillow, numpy).

    python tools/mannequin-sheet.py

Reads deep16/_src/mannequin/render/ (meta.json and the frames, gitignored); writes deep16/art-src/mannequin/:
    mannequin_slash.png / .json   the sheet at 1x, as the engine lays one: each row its own cell (fw fh ax ay), the eight facings S SW W NW N
                                  NE E SE a row of cells each, SW W NW the SE E NE mirrored about the anchor (RULED 10-14). The json is a
                                  sheet's (anims, release) and carries the rig's grip as js/sprites.js reads `grips` (S.gripAt: "lx ly rx
                                  ry flags" a frame, from the foot; L the right fist, R a point 6 px back along the blade from it -- one
                                  hand: the engine's shaft runs from R through L and on; flags 2 the fist redrawn over the weapon, 1 the
                                  body hides it), and every frame's points (the fist, the guard, the tip, the soles, the crown).
    grid-review.png               the five drawn facings and the three mirrored, 4x: the hero's own idle (the size measured), the mannequin's
                                  idle, then the six SLASH frames, each in its cell, the feet's row a line, the release frame boxed gold.
    slash-<S|SE|E|NE|N>.png       the reference strips, one a facing: the six frames large on the art desk's navy, numbered 1-6 under the
                                  feet line, the release frame's number gold with HIT under it.
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REND = os.path.join(ROOT, 'deep16', '_src', 'mannequin', 'render')
OUT = os.path.join(ROOT, 'deep16', 'art-src', 'mannequin')
ORDER = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']          # the engine's facings 0-7
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
NAVY = (12, 20, 40)                                          # (the art desk's pages: a deep blue)
GOLD = (240, 196, 64)
BACK = 6                                                     # px back along the blade from the fist: the grip's rear point


def font(px):
    for f in ('consolab.ttf', 'consola.ttf', 'DejaVuSansMono-Bold.ttf'):
        for d in ('C:/Windows/Fonts', '/usr/share/fonts/truetype/dejavu'):
            try:
                return ImageFont.truetype(os.path.join(d, f), px)
            except OSError:
                pass
    return ImageFont.load_default(px)


def to1x(img, ss):
    """a render at ss x down to the game's pixels: a pixel is drawn where at least half its block is, in the block's mean colour."""
    a = np.asarray(img.convert('RGBA'), dtype=np.float64) / 255
    H, W = a.shape[0] // ss, a.shape[1] // ss
    b = a[:H * ss, :W * ss].reshape(H, ss, W, ss, 4)
    al = b[..., 3].mean(axis=(1, 3)); rgb = (b[..., :3] * b[..., 3:]).sum(axis=(1, 3)) / np.maximum(b[..., 3].sum(axis=(1, 3)), 1e-9)[..., None]
    out = np.zeros((H, W, 4), np.uint8); on = al >= 0.5
    out[on, :3] = np.round(rgb[on] * 255); out[on, 3] = 255
    return Image.fromarray(out, 'RGBA')


def main():
    M = json.load(open(os.path.join(REND, 'meta.json'), encoding='utf-8'))
    ss, rows = M['ss'], M['rows']
    os.makedirs(OUT, exist_ok=True)
    big = {name: {f: [Image.open(os.path.join(REND, name, '%s_%02d.png' % (f, i))).convert('RGBA') for i in range(r['frames'])]
                  for f in M['facings']} for name, r in rows.items()}
    small = {name: {f: [to1x(im, ss) for im in fr] for f, fr in fs.items()} for name, fs in big.items()}

    def cell(name, f, i):
        if f in MIRROR:
            return small[name][MIRROR[f]][i].transpose(Image.FLIP_LEFT_RIGHT)     # (ax is fw/2: the flip keeps the anchor)
        return small[name][f][i]

    # ---- the sheet
    W = max(r['frames'] * r['fw'] for r in rows.values()); Hs = sum(8 * r['fh'] for r in rows.values())
    sheet = Image.new('RGBA', (W, Hs), (0, 0, 0, 0)); anims = {}; y = 0
    for name, r in rows.items():
        for k, f in enumerate(ORDER):
            for i in range(r['frames']):
                sheet.alpha_composite(cell(name, f, i), (i * r['fw'], y + k * r['fh']))
        anims[name] = dict(y=y, fw=r['fw'], fh=r['fh'], ax=r['ax'], ay=r['ay'], frames=r['frames'], fps=r['fps'])
        if r.get('release') is not None:
            anims[name]['release'] = r['release']
        y += 8 * r['fh']
    sheet.save(os.path.join(OUT, 'mannequin_slash.png'), optimize=True)

    def grip(name, f):
        r = rows[name]; src = MIRROR.get(f, f); sg = -1 if f in MIRROR else 1; out = []
        for p in M['points'][name][src]:
            L = np.array(p['fist']) - [r['ax'], r['ay']]; T = np.array(p['tip']) - [r['ax'], r['ay']]
            u = (T - L) / (np.linalg.norm(T - L) or 1); B = L - u * BACK
            out.append('%g %g %g %g %d' % (round(sg * L[0], 1), round(L[1], 1), round(sg * B[0], 1), round(B[1], 1), 1 if p['under'] else 2))
        return ';'.join(out)
    grips = {name: [grip(name, f) for f in ORDER] for name in rows}
    J = dict(image='art-src/mannequin/mannequin_slash.png', fw=rows['idle']['fw'], fh=rows['idle']['fh'], ax=rows['idle']['ax'], ay=rows['idle']['ay'],
             top=M['hero_rows'], anims=anims, grips=grips, name='the mannequin (a pose reference, not a figure of the game)',
             source='tools/mannequin-blend.py (the rig, rows IDLE and SLASH, rendered at the five drawn facings) and tools/mannequin-sheet.py (laid on '
                    'the cell grid; SW W NW mirrored)',
             pilot=dict(hero=M['hero'], hero_rows=M['hero_rows'], scale=M['scale'], k=M['k'],
                        note='points: 1x px from the cell top left in the drawn facings (S SE E NE N); fist = the right fist, where the grip sits; '
                             'soleL / soleR the middle of each sole on the floor; crown the highest point on the screen; under: the body hides the fist',
                        points=M['points']))
    with open(os.path.join(OUT, 'mannequin_slash.json'), 'w', encoding='utf-8', newline='\n') as fh_:
        json.dump(J, fh_, indent=1)

    # ---- the review grid, 4x: the hero's idle | the mannequin's idle | SLASH 1-6, a row a facing, the feet's rows on one line
    hero = json.load(open(os.path.join(ROOT, 'deep16', 'art', M['hero'] + '.json'), encoding='utf-8'))
    himg = Image.open(os.path.join(ROOT, 'deep16', 'art', M['hero'] + '.png')).convert('RGBA'); ha = hero['anims']['idle']
    hcell = lambda f: himg.crop((0, ha['y'] + ORDER.index(f) * ha['fh'], ha['fw'], ha['y'] + (ORDER.index(f) + 1) * ha['fh']))
    Z, G, LW = 4, 6, 70
    up = max(ha['ay'], *(r['ay'] for r in rows.values())); down = max(ha['fh'] - ha['ay'], *(r['fh'] - r['ay'] for r in rows.values()))
    cols = [('%s idle' % M['hero'], ha['fw'], ha['ax'], ha['ay'], None)] + [('mannequin idle', rows['idle']['fw'], rows['idle']['ax'], rows['idle']['ay'], ('idle', 0))] + \
           [('SLASH %d%s' % (i + 1, ' HIT' if i == rows['slash'].get('release') else ''), rows['slash']['fw'], rows['slash']['ax'], rows['slash']['ay'], ('slash', i))
            for i in range(rows['slash']['frames'])]
    xs = [LW]; [xs.append(xs[-1] + c[1] * Z + G) for c in cols]
    RH = (up + down) * Z + G; top = 40
    rv = Image.new('RGBA', (xs[-1] + G, top + 8 * RH + 30), NAVY + (255,)); d = ImageDraw.Draw(rv); f16, f12 = font(16), font(13)
    for c, x in zip(cols, xs):
        d.text((x, 12), c[0], fill=GOLD if 'HIT' in c[0] else (200, 210, 230), font=f12)
    for k, f in enumerate(['S', 'SE', 'E', 'NE', 'N', 'SW', 'W', 'NW']):
        y0 = top + k * RH; feet = y0 + up * Z          # (the anchor row's top edge: the feet's row is the band below it)
        d.text((8, y0 + up * Z // 2), f, fill=(230, 230, 240), font=f16)
        if f in MIRROR:
            d.text((8, y0 + up * Z // 2 + 22), '=' + MIRROR[f] + '\nflipped', fill=(140, 150, 175), font=f12)
        for c, x in zip(cols, xs):
            fw_, ax_, ay_ = c[1], c[2], c[3]
            im = hcell(f) if c[4] is None else cell(c[4][0], f, c[4][1])
            fh_ = im.size[1]; cx, cy = x, feet - ay_ * Z
            d.rectangle([cx - 1, cy - 1, cx + fw_ * Z, cy + fh_ * Z], outline=(44, 56, 86))
            rv.alpha_composite(im.resize((fw_ * Z, fh_ * Z), Image.NEAREST), (cx, cy))
            if 'HIT' in c[0]:
                d.rectangle([cx - 3, cy - 3, cx + fw_ * Z + 2, cy + fh_ * Z + 2], outline=GOLD, width=2)
            d.line([cx, feet + Z, cx + fw_ * Z, feet + Z], fill=(120, 200, 140), width=1)     # (the feet's row's bottom edge: the line the soles stand on)
            d.line([cx + ax_ * Z, feet + Z - 6, cx + ax_ * Z, feet + Z + 6], fill=(120, 200, 140), width=1)
    d.text((8, rv.size[1] - 22), 'green: the feet line (the anchor row) and the anchor; gold: the release frame. Orange = his LEFT, blue = his RIGHT (as the poser keys them), '
           'magenta bar = the sword. SW W NW are SE E NE flipped: the sword changes hand there.', fill=(150, 160, 185), font=f12)
    rv.save(os.path.join(OUT, 'grid-review.png'), optimize=True)

    # ---- the reference strips: one a drawn facing, the frames large, one box for all six so the scale and the feet hold
    rel = rows['slash'].get('release'); f40, f30, f24 = font(40), font(30), font(24); m = 24; box = {}
    for f in M['facings']:
        bb = [im.getbbox() for im in big['slash'][f]]
        box[f] = (min(b[0] for b in bb) - m, min(b[1] for b in bb) - m, max(b[2] for b in bb) + m, max(b[3] for b in bb) + m)
    k = min(1.0, *((2300 - 7 * 30) / (6 * (b[2] - b[0])) for b in box.values()), *(560 / (b[3] - b[1]) for b in box.values()))   # (one scale for the five)
    for f in M['facings']:
        x0, y0, x1, y1 = box[f]; y0 += m
        crops = [im.crop(box[f]) for im in big['slash'][f]]
        cw, ch = crops[0].size; cw2, ch2 = int(cw * k), int(ch * k); gap = 30
        Wp = 6 * cw2 + 7 * gap; Hp = 110 + ch2 + 110
        pg = Image.new('RGBA', (Wp, Hp), NAVY + (255,)); d = ImageDraw.Draw(pg)
        t = 'MANNEQUIN - SLASH %s' % f; tw = d.textlength(t, font=f40); d.text(((Wp - tw) / 2, 30), t, fill=(220, 226, 240), font=f40)
        r = rows['slash']; feet_y = 110 + int(((r['ay'] + 0.9) * M['ss'] - (y0 - m)) * k)     # (the lowest sole's bottom: tools/mannequin-blend.py sets it there)
        d.line([gap // 2, feet_y, Wp - gap // 2, feet_y], fill=(96, 112, 150), width=2)
        for i, im in enumerate(crops):
            x = gap + i * (cw2 + gap)
            pg.alpha_composite(im.resize((cw2, ch2), Image.LANCZOS), (x, 110))
            hit = i == rel; s = str(i + 1); sw = d.textlength(s, font=f30)
            d.text((x + (cw2 - sw) / 2, feet_y + 16), s, fill=GOLD if hit else (220, 226, 240), font=f30)
            if hit:
                hw = d.textlength('HIT', font=f24); d.text((x + (cw2 - hw) / 2, feet_y + 54), 'HIT', fill=GOLD, font=f24)
        pg.convert('RGB').save(os.path.join(OUT, 'slash-%s.png' % f), optimize=True)
    print('mannequin-sheet: %s -- the sheet %dx%d (idle %dx%d, slash %dx%d), grid-review.png, slash-{%s}.png' % (
        OUT, W, Hs, rows['idle']['fw'], rows['idle']['fh'], rows['slash']['fw'], rows['slash']['fh'], ','.join(M['facings'])))


main()

"""DEEP16 pipeline 2 (generated art): Griz's generated cloaker sheet -> the cloaker's palette sprite sheet.

    python tools/cloaker-sheet.py            builds deep16/art/cloaker_p2.png/.json
    python tools/cloaker-sheet.py preview    writes dev/shots/cloaker-cuts.png (the eight cut-outs, numbered) and stops

Source: deep16/_src/cloaker_grok_3.jpg (Griz, 2026-09-29, the third generated sheet, and the one that held together: one creature, one
design, all facing left; the first two mixed a grub-bodied bat with a manta and are kept in _src as cloaker_grok_1/2.png). Eight
panels (4 x 2) on a baked checkerboard (the fourth is numbered 3):
  1 wings out flat   2 wings up   3 wings up, high   4 wings swept down and back, tail up
  5 6 7 the dive: wings folded to the flanks, head down, mouth open   8 wings out flat, tail up
The ground is the neutral light pixels joined to a panel's edge (the checker's two greys); the numbers and rules dropped by size and
place. Every pose is placed on the red of its eyes, so the head stays where it is while the wings do the moving. All eight facings
use the same left-facing poses (mirrored for the east side): there are no front or back views to draw from.
The anims are made from the poses: the idle is the flap slowed and cycled 1-2-3-4-8 with a bob; the glide the same, faster; the attack
winds up (wings up), dives (5-7) and recovers, lunging the way it faces; the death (played as `hurt`, as the gnolls' and chuul's are)
is a shake, the wings folding, and a fall into a heap of cloak. The face close-up (js/ui.js scene `face`) draws the idle's first
frame blown up, so it is a pose with the face clear.
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)
SRC = os.path.join(ROOT, 'deep16', '_src')
CW, CH = 292, 392                       # one panel
FW, FH, AX, AY = 128, 128, 64, 112      # a frame; the foot (the shadow) at AX, AY; it hovers above it
NAME = 'cloaker_p2'
SCALE = 0.38                            # one scale for every pose (the widest, ~280 px, comes to ~106: a cloaker is two squares wide)
CX, CY = 40, 60                       # where the eyes sit in a frame at rest (it faces left: the head is left of centre, the body and wings right of it)


def cell(sheet, n):
    """panel n (1..8): RGBA cut-out with the checker keyed out, and the red of the eyes' centre in it."""
    col, row = (n - 1) % 4, (n - 1) // 4
    x0, y0 = col * CW + 4, row * CH + 4
    c = sheet[y0:y0 + CH - 8, x0:x0 + CW - 8]
    mx, mn = c.max(-1), c.min(-1)
    bgm = ((mx - mn) <= 10) & (mx >= 185)                 # the checker's greys and white (a jpeg's noise: a little slack)
    lab, k = ndimage.label(bgm)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    big = {i + 1 for i, s in enumerate(ndimage.find_objects(lab)) if (lab[s] == i + 1).sum() > 2500}
    bg = np.isin(lab, list(edge | big))
    fg = ~bg
    fg = ndimage.binary_opening(fg, iterations=1)
    fg = ndimage.binary_closing(fg, iterations=2)
    lab, k = ndimage.label(fg)
    keep = np.zeros_like(fg)
    for i, s in enumerate(ndimage.find_objects(lab)):
        area = int((lab[s] == i + 1).sum())
        y1, x1 = s[0].stop, s[1].stop
        if area < 300 or (y1 < 56 and x1 < 90):           # a speck; the panel's number
            continue
        keep |= lab == i + 1
    keep = ndimage.binary_fill_holes(keep)
    keep = ndimage.binary_erosion(keep, iterations=1)      # the halo of the checker
    ys, xs = np.where(keep)
    cc = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    am = keep[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    red = (cc[..., 0] > 150) & (cc[..., 1] < 80) & (cc[..., 2] < 80) & am
    ry, rx = np.where(red)
    eye = (rx.mean(), ry.mean()) if len(rx) >= 6 else (cc.shape[1] * 0.3, cc.shape[0] * 0.5)
    return Image.fromarray(np.dstack([cc.astype(np.uint8), (am * 255).astype(np.uint8)]), 'RGBA'), eye


def load():
    return np.asarray(Image.open(os.path.join(SRC, 'cloaker_grok_3.jpg')).convert('RGB')).astype(np.int32)


def cuts_all():
    s = load()
    return {'p%d' % n: cell(s, n) for n in range(1, 9)}


def preview(cuts):
    from PIL import ImageDraw
    im = Image.new('RGBA', (4 * 300, 2 * 300), (60, 60, 90, 255))
    d = ImageDraw.Draw(im)
    for i, (key, (c, eye)) in enumerate(cuts.items()):
        col, row = i % 4, i // 4
        s = min(280 / c.size[0], 280 / c.size[1], 1)
        cc = c.resize((max(1, int(c.size[0] * s)), max(1, int(c.size[1] * s))))
        im.alpha_composite(cc, (col * 300 + 8, row * 300 + 8))
        d.ellipse((col * 300 + 8 + eye[0] * s - 3, row * 300 + 8 + eye[1] * s - 3, col * 300 + 8 + eye[0] * s + 3, row * 300 + 8 + eye[1] * s + 3), outline=(0, 255, 0, 255))
        d.text((col * 300 + 6, row * 300 + 4), '%s %dx%d' % (key, c.size[0], c.size[1]), fill=(255, 255, 0, 255))
    os.makedirs(os.path.join(ROOT, 'dev', 'shots'), exist_ok=True)
    im.save(os.path.join(ROOT, 'dev', 'shots', 'cloaker-cuts.png'))


def frame(cut, mirror=False, sx=1.0, sy=1.0, dx=0, dy=0):
    """one pose at 1x: scaled (with a squash/stretch), palette-snapped and outlined, the red of its eyes placed at (CX+dx, CY+dy)."""
    img, (ex, ey) = cut
    w, h = img.size
    if mirror:
        img = img.transpose(Image.FLIP_LEFT_RIGHT); ex = w - ex
    nw, nh = max(1, round(w * SCALE * sx)), max(1, round(h * SCALE * sy))
    img = img.resize((nw, nh), Image.BOX)
    a = pix.pixelate(img, 1, do_lift=False)
    ax_, ay_ = ex * nw / w, ey * nh / h
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    cx = CX if not mirror else FW - CX                      # the mirrored side keeps the head off-centre the other way
    ox, oy = int(round(cx + dx - ax_)), int(round(CY + dy - ay_))
    h2, w2 = a.shape[:2]
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h2), min(FW, ox + w2)
    if y1 > y0 and x1 > x0:
        out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def roost_frame(cut, dy=0):
    """the hung cloak (panels 1 and 2 of the first sheet): placed by its box, centred, its foot on the frame's floor."""
    img, _ = cut
    nw, nh = max(1, round(img.size[0] * SCALE)), max(1, round(img.size[1] * SCALE))
    a = pix.pixelate(img.resize((nw, nh), Image.BOX), 1, do_lift=False)
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = (FW - a.shape[1]) // 2, FH - 3 - a.shape[0] + dy
    y0, y1 = max(0, oy), min(FH, oy + a.shape[0])
    x0, x1 = max(0, ox), min(FW, ox + a.shape[1])
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def box_frame(img, dx=0, dy=0, sc=SCALE):
    """a pose that has no eyes to anchor on, placed by the middle of its box."""
    nw, nh = max(1, round(img.size[0] * sc)), max(1, round(img.size[1] * sc))
    a = pix.pixelate(img.resize((nw, nh), Image.BOX), 1, do_lift=False)
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = FW // 2 - a.shape[1] // 2 + dx, 62 - a.shape[0] // 2 + dy
    y0, y1 = max(0, oy), min(FH, oy + a.shape[0]); x0, x1 = max(0, ox), min(FW, ox + a.shape[1])
    if y1 > y0 and x1 > x0:
        out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def unfurl_first(s1):
    """the reveal's first pose (Griz, 09-29): panel 3, the cloak opening, mirrored, with panel 4's screaming head where the hood is dark."""
    a3, _ = cell(s1, 3)
    a3 = a3.transpose(Image.FLIP_LEFT_RIGHT)
    a4, _ = cell(s1, 4)
    head = a4.crop((46, 0, 118, 96)).resize((66, 88), Image.BOX)
    layer = Image.new('RGBA', a3.size, (0, 0, 0, 0))
    layer.paste(head, (104, 0), head)
    return Image.alpha_composite(a3, layer)


def ghost_cut(s1, n=8):
    """panel 8, the phantasm: three ghost heads on a checkerboard they are drawn over. The ghost is the lavender (blue and red over green)
    and the dark of the eyes and mouths; the checker is neutral. Hard-edged here (the palette has no half-alpha): the scene draws it faint."""
    col, row = (n - 1) % 4, (n - 1) // 4
    x0, y0 = col * CW + 4, row * CH + 4
    c = s1[y0:y0 + CH - 8, x0:x0 + CW - 8]
    lav = (c[..., 0] + c[..., 2]) // 2 - c[..., 1]
    m = (lav > 9) | (c.max(-1) < 175)
    m = ndimage.binary_opening(m, iterations=1)
    m = ndimage.binary_closing(m, iterations=3)
    lab, k = ndimage.label(m)
    keep = np.zeros_like(m)
    for i, s in enumerate(ndimage.find_objects(lab)):
        if (lab[s] == i + 1).sum() >= 400 and not (s[0].stop < 56 and s[1].stop < 90):
            keep |= lab == i + 1
    keep = ndimage.binary_fill_holes(keep)
    ys, xs = np.where(keep)
    cc = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    am = keep[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray(np.dstack([cc.astype(np.uint8), (am * 255).astype(np.uint8)]), 'RGBA')


def build():
    cuts = cuts_all()
    # the roost (Griz, 09-29: "have him be in that form when we show the magic missiles hitting"): the cloak hung on the roof, from the
    # first sheet's first two panels, a two-frame sway; the easter egg's hit scene shows it (js/magic.js), the same from every side
    s1 = np.asarray(Image.open(os.path.join(SRC, 'cloaker_grok_1.png')).convert('RGB')).astype(np.int32)
    roost = [roost_frame(cell(s1, 1)), roost_frame(cell(s1, 2)), roost_frame(cell(s1, 1), dy=1), roost_frame(cell(s1, 2), dy=1)]
    # the reveal (Griz, 09-29: "4, 7, 5, 6 is the order", a modified mirror of 3 with 4's head before 4): the cloak opens, the scream, the
    # wrap of its wings, the flight left -- all from the first sheet; the scene runs it, and it dissolves into the idle after
    f3, f4, f7, f5, f6 = unfurl_first(s1), cell(s1, 4)[0], cell(s1, 7)[0], cell(s1, 5)[0], cell(s1, 6)[0]
    reveal = [box_frame(f3, dx=-1), box_frame(f3, dx=1), box_frame(f4), box_frame(f4, dy=-1), box_frame(f7), box_frame(f7, dx=1), box_frame(f5), box_frame(f6)]
    # the moan (#8, the ghost heads): a pulse, growing and settling; the scene draws it faint
    g8 = ghost_cut(s1)
    moan = [box_frame(g8, sc=SCALE * s, dx=j) for s, j in ((0.92, 0), (0.99, -1), (1.06, 1), (1.12, -1), (1.06, 1), (0.99, 0))]
    POSE_DY = {'p4': 2, 'p5': 9, 'p6': 9, 'p7': 7, 'p8': 3}     # the dive and the swept-back poses carry the tail high above the eyes: seat them lower
    def P(k, **kw):
        kw['dy'] = kw.get('dy', 0) + POSE_DY.get(k, 0)
        return frame(cuts[k], **kw)
    bob = lambda i, amp=2: int(round(amp * np.sin(2 * np.pi * i / 8)))
    # which way a facing lunges on the screen (dx, dy per unit); the west side faces left, the east side is the mirror
    DIR = {0: (0, 1), 1: (-1, 1), 2: (-1, 0), 3: (-1, -1), 4: (0, -1), 5: (1, -1), 6: (1, 0), 7: (1, 1)}
    MIR = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 1, 7: 1}
    FLAP = ['p1', 'p2', 'p3', 'p3', 'p4', 'p4', 'p8', 'p1']      # the flap, slowed: out, up, up, swept back, back out
    frames = {'idle': [], 'walk': [], 'attack': [], 'hurt': [], 'fly': [], 'roost': [roost] * 8, 'reveal': [reveal] * 8, 'moan': [moan] * 8}
    for f in range(8):
        m = bool(MIR[f]); dxv, dyv = DIR[f]
        # the sheet as it was drawn, 1 to 8: the flight in and the dive (Griz: "a sequence to play at the end of the easter egg")
        frames['fly'].append([P('p%d' % (i + 1), mirror=m, dy=-2 + (i // 4) * 2) for i in range(8)])
        frames['idle'].append([P(FLAP[i], mirror=m, dy=bob(i)) for i in range(8)])
        walk = ['p1', 'p2', 'p3', 'p4', 'p8', 'p2', 'p3', 'p4']
        frames['walk'].append([P(walk[i], mirror=m, dy=bob(i + 2, 3), dx=(1 if dxv > 0 else -1 if dxv < 0 else 0) * (1 if i % 8 < 4 else 0)) for i in range(8)])
        # the attack: wings up, back a little (the wind-up), the dive at it three frames, and back
        seq = [('p1', 0, 0), ('p2', -3, 0), ('p3', -5, 0), ('p5', 6, 0), ('p6', 11, 0), ('p7', 11, 0), ('p8', 5, 0), ('p1', 1, 0)]
        frames['attack'].append([P(k, mirror=m, dx=dxv * o, dy=dyv * o * (0.6 if dyv > 0 else 0.2) + (-2 if k in ('p2', 'p3') else 0)) for k, o, _ in seq])
    # the death (played as `hurt`): a shake, the wings folding, and the fall into a heap on the ground (the same from every side)
    death = [P('p3', dx=-2), P('p3', dx=2, dy=2), P('p5', dy=6), P('p6', sx=1.0, sy=0.85, dy=18),
             P('p6', sx=1.05, sy=0.6, dy=32), P('p6', sx=1.12, sy=0.42, dy=40), P('p6', sx=1.18, sy=0.33, dy=44), P('p6', sx=1.2, sy=0.28, dy=46)]
    for f in range(8):
        frames['hurt'].append(death if not MIR[f] else [frame(cuts['p3'], mirror=True, dx=2)] + [frame(cuts[k], mirror=True, **kw) for k, kw in
                             [('p3', dict(dx=-2, dy=2)), ('p5', dict(dy=6)), ('p6', dict(sy=0.85, dy=18)), ('p6', dict(sx=1.05, sy=0.6, dy=32)),
                              ('p6', dict(sx=1.12, sy=0.42, dy=40)), ('p6', dict(sx=1.18, sy=0.33, dy=44)), ('p6', dict(sx=1.2, sy=0.28, dy=46))]])
    top = pix.top_of(frames['idle'][0] + frames['idle'][6], AY)
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, top)
    mp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(mp))
    for a, fps in (('idle', 5), ('walk', 9), ('attack', 12), ('hurt', 8), ('fly', 9), ('roost', 2), ('reveal', 6), ('moan', 8)):
        meta['anims'][a]['fps'] = fps
    meta['source'] = 'generated by Griz (2026-09-29, the third cloaker sheet), keyed, posed and snapped by tools/cloaker-sheet.py'
    json.dump(meta, open(mp, 'w'), indent=1)


if __name__ == '__main__':
    if 'preview' in sys.argv:
        preview(cuts_all())
        print('preview written')
        sys.exit(0)
    build()

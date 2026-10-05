"""DEEP16 pipeline 3 (drawn in code): the will-o'-wisp -> deep16/art/wisp_p1.png + .json.

    python tools/wisp-sheet.py            # writes the sheet and its frame map
    python tools/wisp-sheet.py preview    # dev/shots/wisp-preview.png: every row, facings S, E and N, 3x, on dark stone and on black

Griz, 10-05: "wisp is a glowing orb, do we have anything that can do that - can we give them a special effect body?" -- "Let's try code drawn".
No model, no generated sheet: the figure is a light field (a core, a halo, a wavering teardrop tail, a few orbiting motes, a ground shadow
that tightens as it rises) quantised to the palette's `bone` and `glow` ramps with a Bayer dither, so it reads as SNES glow rather than as a
smooth gradient. An orb faces nowhere, so the eight facing rows are one figure; only the Shock row aims (the arc leaves toward the facing:
S, SW, W, NW, N, NE, E, SE) and the tail streams back from the way it travels.
Rows: idle 8, walk 8, attack 8 (the core swells, a jagged arc, a flash), hurt 6 (it gutters and recoils), death 8 (it gutters, a ring bursts
and it goes out in embers). The engine plays `hurt` once when a creature goes down, as every sheet's, so `hurt` here is the death, and
`flinch` is the short one a blow gets (as the clacker's sheet).
The glow the grid pours on the floor round it is the foe block's `glow` (js/light.js L.carried), not this sheet.
"""
import os, sys, json, math
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D16 = os.path.join(ROOT, 'deep16')
FW, FH = 96, 128
AX, AY = 48, 112                    # the foot: the shadow's centre
K = 1.4                             # the figure's scale: a Tiny light, but one a player can see across a hall
HOVER = 40                          # the core's rest height over the foot
FACINGS = 8
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0 - 0.5
# the dirs the facings point on screen (S, SW, W, NW, N, NE, E, SE), y down; iso squares read flatter than they are long
DIRS = [(0, 1), (-1, .6), (-1, 0), (-1, -.6), (0, -1), (1, -.6), (1, 0), (1, .6)]
BONE = (252, 252, 244); G2 = (168, 232, 255); G1 = (60, 188, 252); G0 = (26, 92, 128); TEAL = (42, 122, 112); OUT = (14, 20, 48)
YY, XX = np.mgrid[0:FH, 0:FW].astype(float)


def blob(cx, cy, r):                # a soft round light: 1 at the centre, 0 at r
    d = np.hypot(XX - cx, (YY - cy) * 1.0) / r
    return np.clip(1 - d, 0, 1) ** 1.4


def seg(x0, y0, x1, y1, w):         # a line of light: 1 on it, 0 at w off it
    vx, vy = x1 - x0, y1 - y0
    L2 = vx * vx + vy * vy or 1.0
    t = np.clip(((XX - x0) * vx + (YY - y0) * vy) / L2, 0, 1)
    d = np.hypot(XX - (x0 + t * vx), YY - (y0 + t * vy))
    return np.clip(1 - d / w, 0, 1)


def frame(ph, core=7.5, bob=0.0, lean=(0, 0), tail=1.0, flash=0.0, arc=None, ring=None, fade=1.0, motes=3, jitter=0.0, shadow=1.0):
    """One frame: ph the phase (0..1 round the loop), core the core's radius, lean the way it drifts (the tail streams from it)."""
    core *= K
    cx = AX + lean[0] * 3 + jitter * math.sin(ph * 40)
    cy = AY - HOVER + bob + lean[1] * 2
    field = np.zeros((FH, FW))
    white = np.zeros((FH, FW))
    # the halo: a wide faint light that breathes
    breathe = 1 + 0.12 * math.sin(ph * 2 * math.pi)
    field += 0.55 * blob(cx, cy, (core * 2.9 + flash * 9) * breathe)
    # the tail: a teardrop of wavering light below and behind
    if tail > 0:
        n = 7
        for i in range(1, n + 1):
            f = i / n
            sway = math.sin(ph * 2 * math.pi * 1.0 + f * 3.4) * (2 + 3 * f)
            tx = cx - lean[0] * 9 * f + sway
            ty = cy + core * 0.7 + f * 17 * K * tail - lean[1] * 5 * f
            field += (0.55 * (1 - f) + 0.05) * blob(tx, ty, core * (0.95 - 0.7 * f)) * tail
    # the core: a bright disc with a white heart
    field += 1.25 * blob(cx, cy, core * 1.3)
    white += blob(cx, cy, core * 0.78)
    # the motes: small lights circling it
    for m in range(motes):
        a = ph * 2 * math.pi + m * 2 * math.pi / max(motes, 1)
        r = core * 1.9 + 2.5 * math.sin(a * 2 + m)
        mx, my = cx + r * math.cos(a), cy + r * math.sin(a) * 0.55 + 1
        field += 0.9 * blob(mx, my, 2.4)
        white += 0.9 * blob(mx, my, 1.3)
    # a shock: a jagged arc from the core toward the facing, and its flash
    if arc:
        dx, dy = arc['dir']
        n = math.hypot(dx, dy) or 1
        dx, dy = dx / n, dy / n
        L = arc['len'] * K
        px, py = cx, cy
        rnd = np.random.RandomState(arc['seed'])
        k = 6
        for i in range(1, k + 1):
            nx = cx + dx * L * i / k + rnd.uniform(-5, 5) * (-dy) * (1 if i < k else 0)
            ny = cy + dy * L * i / k + rnd.uniform(-5, 5) * dx * (1 if i < k else 0)
            field += 1.6 * seg(px, py, nx, ny, 2.2)
            white += 1.5 * seg(px, py, nx, ny, 1.1)
            if i == 3 and arc.get('fork'):
                field += 1.1 * seg(nx, ny, nx + (dx + dy) * 9, ny + (dy - dx) * 9, 1.8)
            px, py = nx, ny
        field += 0.8 * blob(px, py, 9 * arc.get('burst', 1.0))
        white += 0.5 * blob(px, py, 4)
    # a ring: the burst a wisp goes out in
    if ring:
        d = np.hypot(XX - cx, (YY - cy) * 1.15)
        field += ring['a'] * np.clip(1 - np.abs(d - ring['r']) / 2.6, 0, 1)
    if flash:
        white += flash * blob(cx, cy, core * 1.8)
    field *= fade
    white *= fade
    # quantise: the dither decides the edge of each ramp step
    dith = np.tile(BAYER, (FH // 4 + 1, FW // 4 + 1))[:FH, :FW]
    img = np.zeros((FH, FW, 4), np.uint8)

    def put(mask, col, a=255):
        img[mask] = (col[0], col[1], col[2], a)
    s = field + dith * 0.16
    w = white + dith * 0.16
    put(s > 0.10, G0, 90)
    put(s > 0.22, G0, 170)
    put(s > 0.36, G1, 200)
    put(s > 0.58, G1, 255)
    put(s > 0.80, G2, 255)
    put(w > 0.55, BONE, 255)
    # the shadow on the ground, tighter as it rises, drawn first (under the light)
    sh = np.hypot((XX - AX) / (13 * shadow), (YY - AY) / (4.5 * shadow)) < 1
    empty = img[..., 3] == 0
    img[sh & empty] = (10, 8, 16, 120)
    return img


def loops():
    rows = {}
    # idle: it hangs and sways, the tail wavering, the core pulsing
    rows['idle'] = [dict(ph=i / 8, core=7.5 + 0.8 * math.sin(i / 8 * 2 * math.pi), bob=2.2 * math.sin(i / 8 * 2 * math.pi), shadow=1 + 0.06 * math.sin(i / 8 * 2 * math.pi)) for i in range(8)]
    # walk: it drifts, leaning into the way it goes with the tail streaming; a bigger bob
    rows['walk'] = [dict(ph=i / 8, core=7.2, bob=3.2 * math.sin(i / 8 * 2 * math.pi), lean=(1.0, 0), tail=1.35, shadow=1 + 0.1 * math.sin(i / 8 * 2 * math.pi)) for i in range(8)]
    # attack: it gathers (the core swells, the motes draw in), the arc leaps, the flash, and back
    A = []
    for i in range(8):
        sw = [7.5, 9, 10.5, 9.5, 8.5, 8, 7.8, 7.5][i]
        fl = [0, 0.1, 0.25, 0.9, 0.5, 0.15, 0, 0][i]
        arc = None
        if i in (3, 4, 5):
            arc = dict(len=[34, 40, 30][i - 3], seed=11 + i, fork=(i == 4), burst=[1.1, 1.5, 0.8][i - 3])
        A.append(dict(ph=i / 8, core=sw, bob=[0, 1, 2, -1, -2, -1, 0, 0][i], flash=fl, arc=arc, motes=3, jitter=[0, 0, .6, 1.2, 1.2, .6, 0, 0][i]))
    rows['attack'] = A
    # flinch: a blow rocks it back and it gutters
    rows['flinch'] = [dict(ph=i / 6, core=[6, 5, 6.4, 7, 7.4, 7.5][i], bob=[0, 3, 4, 2, 1, 0][i], fade=[1, .5, .8, .6, .9, 1][i], flash=[.6, 0, .4, 0, .2, 0][i], lean=(-1, 0), tail=.9) for i in range(6)]
    # hurt (what the engine plays at the end): it gutters, the ring bursts, embers
    H = []
    for i in range(8):
        H.append(dict(ph=i / 8,
                      core=[7, 6, 5.5, 4.5, 3.5, 2.2, 1.2, 0.6][i],
                      bob=[0, 2, 4, 6, 8, 10, 12, 14][i],
                      fade=[1, .9, 1, .8, .7, .55, .35, .18][i], flash=[0, .5, .2, .9, .4, 0, 0, 0][i], tail=[1, .8, .6, .4, .2, 0, 0, 0][i],
                      ring=None if i < 3 else dict(r=[0, 0, 0, 9, 17, 26, 34, 40][i], a=[0, 0, 0, 1.1, .9, .7, .5, .3][i]),
                      motes=[3, 3, 3, 4, 4, 3, 2, 1][i], shadow=[1, 1, .9, .8, .7, .5, .3, .15][i]))
    rows['hurt'] = H
    return rows


def build():
    rows = loops()
    order = [('idle', 8, 6), ('walk', 8, 8), ('attack', 8, 10), ('hurt', 8, 7), ('flinch', 6, 10)]
    sheet = Image.new('RGBA', (FW * 8, FH * FACINGS * len(order)))
    anims = {}
    y = 0
    for name, n, fps in order:
        anims[name] = {'y': y, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'frames': n, 'fps': fps}
        for f in range(FACINGS):
            for i, p in enumerate(rows[name][:n]):
                p = dict(p)
                if name == 'attack' and p.get('arc'):
                    p['arc'] = dict(p['arc'], dir=DIRS[f])
                if name == 'walk':
                    d = DIRS[f]
                    p['lean'] = (-d[0], -d[1] * 0.5)      # the tail streams from the way it goes
                sheet.paste(Image.fromarray(frame(**p)), (i * FW, y + f * FH))
        y += FH * FACINGS
    return sheet, anims


def write(sheet, anims):
    sheet.save(os.path.join(D16, 'art', 'wisp_p1.png'), optimize=True)
    meta = {'image': 'art/wisp_p1.png', 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'top': 70,
            'source': 'drawn in code by tools/wisp-sheet.py (a light field quantised to the bone and glow ramps; 10-05)', 'anims': anims}
    json.dump(meta, open(os.path.join(D16, 'art', 'wisp_p1.json'), 'w'), indent=1)


def preview(sheet, anims):
    cols = 8
    names = list(anims)
    W, H = FW * cols, FH * len(names) * 3
    out = Image.new('RGBA', (W * 2, H), (0, 0, 0, 255))
    stone = Image.new('RGBA', (W, H), (36, 28, 24, 255))
    for ri, nm in enumerate(names):
        a = anims[nm]
        for k, f in enumerate((0, 6, 4)):                       # S, E, N
            for i in range(a['frames']):
                cell = sheet.crop((i * FW, a['y'] + f * FH, (i + 1) * FW, a['y'] + (f + 1) * FH))
                stone.alpha_composite(cell, (i * FW, (ri * 3 + k) * FH))
                out.alpha_composite(cell, (W + i * FW, (ri * 3 + k) * FH))
    out.paste(stone, (0, 0))
    out = out.resize((out.width * 3 // 3, out.height))
    d = os.path.join(ROOT, 'dev', 'shots'); os.makedirs(d, exist_ok=True)
    p = os.path.join(d, 'wisp-preview.png'); out.save(p); print('wrote', p)


if __name__ == '__main__':
    sh, an = build()
    if 'preview' in sys.argv:
        preview(sh, an)
    else:
        write(sh, an); print('wrote deep16/art/wisp_p1.png and .json', sh.size)

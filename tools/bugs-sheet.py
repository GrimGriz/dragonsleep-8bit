"""DEEP16 pipeline 3 (drawn in code): the stirge, the fire beetle and the giant centipede -> deep16/art/<creature>_p1.png + .json.

    python tools/bugs-sheet.py                 # all three
    python tools/bugs-sheet.py stirge          # one
    python tools/bugs-sheet.py preview         # dev/shots/bugs-<creature>.png: every row, as drawn (facing right), 3x on stone

Griz, 10-05: "can we give them a special effect body?" -- "Let's try code drawn", and of the stirge's Blood Drain: "visually it'd be about
making it look like the stinger went in". The same hand as tools/wisp-sheet.py, tools/codeart.py doing the pixel work: shapes on a 4x canvas,
brought down box-filtered, snapped to the 64 palette colours, outlined. One figure facing right; SW, W and NW are its mirror, and S and N
take the side frames too (a first pass: a front and a back would be the next art).
Rows (every creature): idle 8, walk 8, attack 8, flinch 6, hurt 8 (the death; the engine plays `hurt` once at the end). The stirge adds
`latched` 8: drawn at the shoulder of the one it is draining (js/ui.js plays it for an attached rider), the stinger in, the body swelling red.
The fire beetle's glands glow in the picture and as a light on the floor (data/foes.js `glow`, SRD: bright 10 ft, dim 10 ft).
Since 10-05 the rows bring a front (S) and a back (N) drawn here too (with_fb); since 10-08 the stirge's and the fire beetle's hurt from the front
and behind are his GPT sheets, cut and pixelated (HURT_FB) -- the centipede's too, the same night.
"""
import os, sys, math
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import codeart as ca
from codeart import C

FW = FH = 96
AX, AY = 48, 84
S = math.sin
PI2 = 2 * math.pi


def rotate(c, deg, cx, cy):
    c.im = c.im.rotate(deg, center=(cx * ca.SS, cy * ca.SS), resample=ca.Image.BICUBIC)
    c.d = ca.ImageDraw.Draw(c.im)


# ------------------------------------------------------------------ the fire beetle
def beetle(ph=0.0, walk=0.0, bite=0.0, lift=0.0, rot=0.0, pulse=0.5, curl=0.0, nudge=0.0):
    c = ca.Canvas(FW, FH)
    L = lift
    dark, mid, hi = C('leather', 1), C('leather', 2), C('leather', 3)
    leg_n, leg_f = C('stone', 3), C('stone', 1)

    def legs(col, off, xs):
        for k, hx in enumerate(xs):
            sw = S(PI2 * (ph + (k % 2) * 0.5 + off)) * 5 * walk
            lf = max(0.0, S(PI2 * (ph + (k % 2) * 0.5 + off) + 1.57)) * 4 * walk
            hy = 72 - L
            hxx = hx + nudge
            kx = hxx + (8 if k == 0 else (-8 if k == 2 else 2)) - curl * 2
            ky = hy + 5 - curl * 14
            fx = kx + sw * 0.6 + (4 if k == 0 else (-4 if k == 2 else 0))
            fy = 84 - lf - curl * 22
            c.line([(hxx, hy), (kx, ky), (fx, fy)], 2.2, col)
    legs(leg_f, 0.5, [52, 42, 32])        # far side, darker and behind
    # the body
    c.ell(40 + nudge, 62 - L, 25, 15, dark)
    c.ell(39 + nudge, 58 - L, 20, 9.5, mid)
    c.ell(37 + nudge, 54 - L, 11, 3.2, hi)
    for bx in (26, 33, 40, 47):             # the elytra's ribs
        c.line([(bx + nudge, 53 - L), (bx - 2 + nudge, 66 - L)], 0.8, dark)
    c.ell(60 + nudge, 64 - L, 10, 11, C('stone', 2))               # the thorax
    c.ell(59 + nudge, 60 - L, 6, 4, C('stone', 4))
    # the head and its jaws
    hx, hy = 73 + nudge + bite * 3, 68 - L + bite * 1.5
    c.ell(hx, hy, 8, 6.8, C('stone', 2))
    c.ell(hx - 1, hy - 2, 4.5, 2.4, C('stone', 4))
    op = 1.5 + bite * 4
    c.line([(hx + 5, hy + 1), (hx + 10, hy + 1 + op * 0.4), (hx + 14, hy - 2 + op)], 2.0, C('bone', 0))
    c.line([(hx + 5, hy + 3), (hx + 10, hy + 3 - op * 0.2), (hx + 14, hy + 5 - op * 0.6)], 2.0, C('bone', 0))
    c.ell(hx + 2, hy - 2, 1.3, 1.3, C('outline', 0))
    wob = S(PI2 * ph * 2) * 2
    c.line([(hx + 1, hy - 6), (hx + 9, hy - 14 + wob), (hx + 16, hy - 16 + wob * 1.5)], 1.0, C('stone', 5))
    legs(leg_n, 0.0, [54, 44, 34])         # near side, over it
    # the glands: a rear one on the abdomen and one over the eyes; they pulse
    for gx, gy, gr in ((17 + nudge, 63 - L, 5.2), (hx - 2, hy - 7.5, 3.4)):
        c.glow(gx, gy, gr * 2.4, C('fire', 1), 0.55 * (0.7 + 0.5 * pulse))
        c.ell(gx, gy, gr * 0.9, gr * 0.75, C('fire', 1))
        c.ell(gx - 0.5, gy - 0.5, gr * 0.5, gr * 0.4, C('fire', 2))
    if rot:
        rotate(c, rot, 48, 78)
    return c.finish(sc=0.8)


def beetle_rows():
    idle = [beetle(ph=i / 8, pulse=0.5 + 0.5 * S(PI2 * i / 8), nudge=0, lift=0.6 * S(PI2 * i / 8)) for i in range(8)]
    walk = [beetle(ph=i / 8, walk=1.0, pulse=0.5 + 0.5 * S(PI2 * i / 8), lift=1.2 * abs(S(PI2 * i / 8))) for i in range(8)]
    atk = [beetle(ph=i / 8, bite=b, nudge=n, lift=l, pulse=0.9) for i, (b, n, l) in enumerate(zip([0, .2, .5, 1, 1, .6, .2, 0], [0, -2, -4, 3, 4, 1, 0, 0], [0, 1, 2, 0, 0, 0, 0, 0]))]
    flinch = [beetle(ph=i / 6, nudge=n, lift=l, bite=0.4, pulse=0.2) for i, (n, l) in enumerate(zip([0, -4, -3, -1, 0, 0], [0, 2, 1, 0, 0, 0]))]
    hurt = []
    for i in range(8):                        # it goes over onto its back, the legs curling, the glands dying
        k = i / 7
        hurt.append(beetle(ph=0.2, rot=-180 * min(1, k * 1.5), curl=min(1, max(0, (k - 0.35) * 1.6)), pulse=max(0.0, 0.8 - k), lift=(2 * S(k * 3.14)), nudge=0))
    return {'idle': idle, 'walk': walk, 'attack': atk, 'flinch': flinch, 'hurt': hurt}


# ------------------------------------------------------------------ the giant centipede
def centipede(ph=0.0, walk=0.0, rear=0.0, bite=0.0, rot=0.0, curl=0.0, nudge=0.0, flat=0.0):
    c = ca.Canvas(FW, FH)
    n = 12
    pts = []
    for s in range(n + 1):
        u = s / n
        x = 12 + u * 60 + nudge * u
        y = 77 - 3 * u + (4.0 * walk + 1.2) * S(PI2 * (-ph) + u * 6.0) - rear * (u ** 1.8) * 30
        x += rear * (u ** 1.8) * 8
        pts.append((x, y))
    red_a, red_b, hi = C('red', 3), C('red', 2), C('red', 4)
    legc, legf = C('gold', 3), C('gold', 1)
    for far in (True, False):                # far-side legs first, then the body, then near legs
        if far:
            for s in range(1, n):
                x, y = pts[s]
                g = 84 - 2 * (s % 2)
                sw = S(PI2 * (ph * 2 + s * 0.22)) * 3.0 * walk
                c.line([(x + 1, y + 2), (x + 3 + sw, y + 9), (x + 2 + sw * 1.4, min(g, y + 15 + curl * -5))], 1.2, legf)
    for s in range(n + 1):                   # the segments, tail first
        x, y = pts[s]
        u = s / n
        rx = 3.6 + 2.6 * (1 - abs(u - 0.62) * 1.3) if s < n else 0
        ry = 5.2 - 0.8 * (1 - u)
        if s < n:
            c.ell(x, y, max(3.2, rx), ry, red_a if s % 2 == 0 else red_b)
            c.ell(x - 0.5, y - 2.0, max(2, rx - 1.2), 1.7, hi)
    for s in range(1, n):
        x, y = pts[s]
        g = 84 - 2 * ((s + 1) % 2)
        sw = S(PI2 * (ph * 2 + s * 0.22 + 0.5)) * 3.0 * walk
        c.line([(x, y + 3), (x + 2 + sw, y + 10), (x + sw * 1.4 - 1, min(g, y + 16 + curl * -5))], 1.3, legc)
    # the tail's two trailing feelers
    tx, ty = pts[0]
    c.line([(tx - 2, ty), (tx - 8, ty + 1 + S(PI2 * ph) * 1.5)], 1.0, legc)
    c.line([(tx - 2, ty - 1), (tx - 8, ty - 4 + S(PI2 * ph + 1) * 1.5)], 1.0, legc)
    # the head and its forcipules
    hx, hy = pts[n]
    hx += 3
    c.ell(hx, hy, 8, 6.4, C('red', 4))
    c.ell(hx - 1, hy - 2.2, 5, 2.4, C('fire', 2))
    op = 1.2 + bite * 5
    c.line([(hx + 5, hy + 2), (hx + 10, hy + 5 + op * 0.3), (hx + 13, hy + 3 + op * 0.2 - 3 * bite)], 2.0, C('bone', 1))
    c.line([(hx + 4, hy + 4), (hx + 9, hy + 8 - op * 0.1), (hx + 12, hy + 8 + op * 0.5)], 2.0, C('bone', 1))
    c.ell(hx + 2.5, hy - 1.5, 1.3, 1.3, C('outline', 0))
    w = S(PI2 * ph * 2) * 2
    c.line([(hx + 3, hy - 5), (hx + 10, hy - 11 + w), (hx + 17, hy - 12 + w * 1.4)], 1.0, legc)
    if rot:
        rotate(c, rot, 48, 80)
    return c.finish(sc=0.9)


def centipede_rows():
    idle = [centipede(ph=i / 8, walk=0.2, rear=0.05 * S(PI2 * i / 8)) for i in range(8)]
    walk = [centipede(ph=i / 8, walk=1.0) for i in range(8)]
    atk = [centipede(ph=i / 8, walk=0.3, rear=r, bite=b, nudge=nd) for i, (r, b, nd) in enumerate(zip([0, .15, .45, .8, .55, .2, 0, 0], [0, 0, .3, 1, 1, .4, 0, 0], [0, -2, -3, 2, 5, 1, 0, 0]))]
    flinch = [centipede(ph=i / 6, walk=0.5, rear=r, nudge=n, bite=0.5) for i, (r, n) in enumerate(zip([0, .5, .6, .3, .1, 0], [0, -4, -3, -1, 0, 0]))]
    hurt = []
    for i in range(8):                        # it rolls onto its back and the legs draw in
        k = i / 7
        hurt.append(centipede(ph=0.1, walk=0.0, rear=0.3 * (1 - k), rot=180 * min(1, k * 1.6), curl=k, bite=0.4 * (1 - k)))
    return {'idle': idle, 'walk': walk, 'attack': atk, 'flinch': flinch, 'hurt': hurt}


# ------------------------------------------------------------------ the stirge
def stirge(ph=0.0, flap=1.0, dive=0.0, rot=0.0, latched=0.0, drop=0.0, fold=0.0, swell=0.0, drip=0.0):
    c = ca.Canvas(FW, FH)
    body, belly, wing_n, wing_f = C('leather', 2), C('red', 2), C('leather', 1), C('leather', 0)
    if latched:
        # drawn at the shoulder of the one it drains, the stinger in to the right: a round, red, swelling body, the wings folded back
        r = 6.2 + swell * 3.4
        cx, cy = 36, 80
        for wx in (1, 0):
            c.poly([(cx - 4, cy - 4), (cx - 22, cy - 12 + wx * 4), (cx - 19, cy + 1 + wx * 3), (cx - 6, cy + 3)], wing_f if wx else wing_n)
        c.ell(cx, cy, r + 1.5, r, C('red', 2))
        c.ell(cx - 1, cy - 2.5, r - 2, r - 3.2, C('red', 3))
        c.ell(cx - 3, cy - 4.5, (r - 6) if r > 6 else 2, 2.4, C('red', 4))
        # the head, down at the end of the stinger
        c.ell(cx + r - 1, cy + 2, 5, 4.5, body)
        c.ell(cx + r + 0.5, cy + 0.5, 1.1, 1.1, C('outline', 0))
        c.line([(cx + r + 3, cy + 3), (cx + r + 10, cy + 7)], 1.2, C('bone', 1))          # the proboscis, driven in
        c.ell(cx + r + 10.5, cy + 7.5, 1.9, 1.4, C('red', 3))                              # the bead of blood where it enters
        if drip:
            c.ell(cx + r + 10.5 + drip * 1.5, cy + 9 + drip * 8, 1.2, 1.8, C('red', 4))
        for lx in (-5, 3):                                                                    # the clinging feet
            c.line([(cx + lx, cy + r - 2), (cx + lx + 3, cy + r + 4)], 1.1, wing_f)
        return c.finish()
    cx, cy = 48 + dive * 14, 52 + drop + S(PI2 * ph) * 2.2 + dive * 6
    # the far wing, behind
    a = (0.25 + 0.95 * S(PI2 * ph)) * flap + (1 - flap) * 0.4
    a = a * (1 - fold) + (-0.5) * fold

    def wing(col, lean):
        sx, sy = cx - 2 + lean, cy - 4
        ang = -2.35 + a * 0.85                          # swept up and back, the stroke wide
        L1, L2 = 27 * (1 - 0.55 * fold), 21 * (1 - 0.55 * fold)
        tip = (sx + L1 * math.cos(ang) * 0.9, sy + L1 * math.sin(ang))
        mid = (sx + L2 * math.cos(ang + 0.75) * 1.05 - 2, sy + L2 * math.sin(ang + 0.75))
        low = (sx + 12 * math.cos(ang + 1.45) - 4, sy + 12 * math.sin(ang + 1.45) + 3)
        c.poly([(sx, sy), tip, ((tip[0] + mid[0]) / 2 - 1, (tip[1] + mid[1]) / 2 + 3), mid, ((mid[0] + low[0]) / 2, (mid[1] + low[1]) / 2 + 2), low], col)
        c.line([(sx, sy), tip], 1.0, C('leather', 3) if col == wing_n else C('leather', 1))
        c.line([(sx, sy), mid], 0.9, C('leather', 3) if col == wing_n else C('leather', 1))
    wing(wing_f, -3)
    # the body, a small oval, head up and forward
    c.ell(cx, cy, 10, 7.2, body, rot=-0.25)
    c.ell(cx - 1, cy + 3, 7, 3.4, belly, rot=-0.25)
    c.ell(cx - 2, cy - 3, 6, 2.2, C('leather', 3), rot=-0.25)
    hx, hy = cx + 10, cy - 2.5
    c.ell(hx, hy, 4.6, 4.2, C('leather', 2))
    c.ell(hx + 1.5, hy - 1, 1.1, 1.1, C('red', 4))
    pl = 12 + dive * 9
    c.line([(hx + 3.5, hy + 0.5), (hx + pl, hy + 4 + dive * 2)], 1.3, C('bone', 1))        # the proboscis
    c.ell(hx + pl + 0.5, hy + 4.4 + dive * 2, 0.9, 0.9, C('bone', 2))
    c.line([(cx - 2, cy + 6), (cx - 4, cy + 10)], 1.1, wing_f)                               # the tail-end claws
    c.line([(cx + 3, cy + 6), (cx + 5, cy + 10)], 1.1, wing_f)
    wing(wing_n, 2)
    if rot:
        rotate(c, rot, cx, cy)
    return c.finish()


def stirge_rows():
    idle = [stirge(ph=i / 8) for i in range(8)]
    walk = [stirge(ph=(i / 8) * 1.0, flap=1.0, dive=0.1) for i in range(8)]
    atk = [stirge(ph=i / 8, dive=d, flap=1.0, fold=f) for i, (d, f) in enumerate(zip([0, -.2, -.4, .5, 1, .8, .3, 0], [0, 0, 0, .3, .6, .4, 0, 0]))]
    flinch = [stirge(ph=i / 6, flap=1.0, dive=-0.15 * (i % 3 == 1), drop=d, rot=r) for i, (d, r) in enumerate(zip([0, 3, 4, 2, 1, 0], [0, 25, 20, 10, 4, 0]))]
    hurt = []
    for i in range(8):                        # it tumbles, the wings folding, and lies belly up
        k = i / 7
        hurt.append(stirge(ph=i / 8, flap=max(0.2, 1 - k), fold=min(1, k * 1.4), drop=min(30, k * 36), rot=200 * min(1, k * 1.3)))
    latched = [stirge(latched=1, swell=0.5 + 0.5 * S(PI2 * i / 8) * 0.4 + i / 14, drip=(i % 8) / 8.0 if i > 3 else 0) for i in range(8)]
    return {'idle': idle, 'walk': walk, 'attack': atk, 'flinch': flinch, 'hurt': hurt, 'latched': latched}


# ------------------------------------------------------------------ front (S, toward the viewer) and back (N, away) views
def beetle_fb(view, ph=0.0, walk=0.0, bite=0.0, lift=0.0, pulse=0.5, nudge=0.0):
    c = ca.Canvas(FW, FH)
    L, front = lift, view == 'S'
    dark, mid, hi = C('leather', 1), C('leather', 2), C('leather', 3)
    legc = C('stone', 3)

    def legs(sign, off):
        for k, (hy, kx, ky, fx) in enumerate(((68, 12, 64, 16), (73, 14, 71, 14), (77, 14, 77, 18))):
            sw = S(PI2 * (ph + (k % 2) * 0.5 + off)) * 3.5 * walk
            lf = max(0.0, S(PI2 * (ph + (k % 2) * 0.5 + off) + 1.57)) * 3.5 * walk
            hx = 48 + sign * 11
            c.line([(hx, hy - L), (48 + sign * (11 + kx), ky - L), (48 + sign * (11 + fx) + sw * 0.0, 84 - lf + (0 if k < 2 else 0))], 2.2, legc)
    legs(-1, 0.0); legs(1, 0.5)
    if front:
        c.ell(48, 56 - L, 21, 17, dark)                      # the carapace, rising behind the head
        c.ell(48, 51 - L, 14, 8, mid)
        c.line([(48, 40 - L), (48, 62 - L)], 0.9, dark)
        hy = 68 - L + bite * 3
        c.ell(48, hy, 11, 9.4, C('stone', 2))
        c.ell(48, hy - 3, 7, 3, C('stone', 4))
        op = 1.0 + bite * 4
        c.line([(41, hy + 5), (43 - op, hy + 10 + bite), (47, hy + 12 + bite * 2)], 2.2, C('bone', 0))
        c.line([(55, hy + 5), (53 + op, hy + 10 + bite), (49, hy + 12 + bite * 2)], 2.2, C('bone', 0))
        for ex in (42.5, 53.5):
            c.ell(ex, hy - 1, 1.6, 1.6, C('outline', 0))
        w = S(PI2 * ph * 2) * 2
        c.line([(41, hy - 7), (33, hy - 15 + w), (27, hy - 17 + w)], 1.0, C('stone', 5))
        c.line([(55, hy - 7), (63, hy - 15 + w), (69, hy - 17 + w)], 1.0, C('stone', 5))
        for gx in (40.5, 55.5):
            c.glow(gx, hy - 5.5, 7, C('fire', 1), 0.55 * (0.7 + 0.5 * pulse))
            c.ell(gx, hy - 5.5, 3.2, 2.6, C('fire', 1)); c.ell(gx - 0.4, hy - 6, 1.7, 1.3, C('fire', 2))
    else:
        c.ell(48, 61 - L, 23, 20, dark)                      # the elytra from behind, the seam down the middle
        c.ell(48, 55 - L, 16, 11, mid)
        c.ell(45, 48 - L, 7, 3, hi)
        c.line([(48, 42 - L), (48, 78 - L)], 1.2, dark)
        for ry in (52, 60, 68):
            c.line([(30, ry - L), (48, ry + 3 - L), (66, ry - L)], 0.8, dark)
        gy = 74 - L
        c.glow(48, gy, 9, C('fire', 1), 0.6 * (0.7 + 0.5 * pulse))
        c.ell(48, gy, 5.2, 3.8, C('fire', 1)); c.ell(47.4, gy - 0.7, 2.8, 1.8, C('fire', 2))
    return c.finish(sc=0.8)


def centipede_fb(view, ph=0.0, walk=0.0, rear=0.0, bite=0.0, nudge=0.0):
    c = ca.Canvas(FW, FH)
    front = view == 'S'
    n = 9
    red_a, red_b, hi = C('red', 3), C('red', 2), C('red', 4)
    legc, legf = C('gold', 3), C('gold', 1)
    # the body seen along its length: nearest segment low and big, the far ones up and small
    segs = []
    for k in range(n):
        u = k / (n - 1)                                   # 0 near, 1 far
        segs.append((48 + S(PI2 * (-ph) + u * 5) * 2.2 * walk, 76 - u * 30 - rear * u * 8, 9.5 - 4.6 * u, 6.4 - 2.4 * u))
    for k in range(n - 1, -1, -1):                        # far to near
        x, y, rx, ry = segs[k]
        sw = S(PI2 * (ph * 2 + k * 0.3)) * 2.5 * walk
        for sg in (-1, 1):
            c.line([(x + sg * rx * 0.7, y), (x + sg * (rx + 6 + sw), y + 4 + (n - k) * 0.2), (x + sg * (rx + 9 + sw), y + 9 + (n - k) * 0.5)], 1.5, legf if sg < 0 else legc)
        c.ell(x, y, rx, ry, red_a if k % 2 == 0 else red_b)
        c.ell(x, y - ry * 0.45, rx * 0.8, ry * 0.4, hi)
    x0, y0, rx0, _ = segs[0]
    if front:
        hy = y0 + 2 + bite * 3
        c.ell(x0, hy, 12, 9.2, C('red', 4)); c.ell(x0, hy - 3, 8, 3, C('fire', 2))
        for ex in (x0 - 4.5, x0 + 4.5):
            c.ell(ex, hy - 1, 1.5, 1.5, C('outline', 0))
        op = 1 + bite * 5
        c.line([(x0 - 6, hy + 5), (x0 - 7 - op * 0.4, hy + 11), (x0 - 2, hy + 14 + bite * 2)], 2.4, C('bone', 1))
        c.line([(x0 + 6, hy + 5), (x0 + 7 + op * 0.4, hy + 11), (x0 + 2, hy + 14 + bite * 2)], 2.4, C('bone', 1))
        w = S(PI2 * ph * 2) * 2
        c.line([(x0 - 6, hy - 6), (x0 - 16, hy - 14 + w), (x0 - 22, hy - 15 + w)], 1.0, legc)
        c.line([(x0 + 6, hy - 6), (x0 + 16, hy - 14 + w), (x0 + 22, hy - 15 + w)], 1.0, legc)
    else:
        w = S(PI2 * ph) * 2
        c.line([(x0 - 3, y0 + 4), (x0 - 7, y0 + 12 + w)], 1.0, legc)                  # the tail's feelers
        c.line([(x0 + 3, y0 + 4), (x0 + 7, y0 + 12 - w)], 1.0, legc)
    return c.finish(sc=0.9)


def stirge_fb(view, ph=0.0, flap=1.0, dive=0.0, fold=0.0, drop=0.0):
    c = ca.Canvas(FW, FH)
    front = view == 'S'
    body, belly, wing_n, wing_f = C('leather', 2), C('red', 2), C('leather', 1), C('leather', 0)
    cx, cy = 48, 52 + drop + S(PI2 * ph) * 2.0 + dive * 8
    a = ((0.25 + 0.95 * S(PI2 * ph)) * flap + (1 - flap) * 0.4) * (1 - fold) - 0.5 * fold
    for sg in (-1, 1):                                    # the wings, spread, beating
        sx, sy = cx + sg * 5, cy - 3
        up = 0.9 - a * 0.7                                # how far up the tip goes
        spread = 1 - 0.55 * fold
        tip = (sx + sg * 27 * spread, sy - 24 * up * spread + 4)
        mid = (sx + sg * 21 * spread, sy - 3 + 3 * a)
        low = (sx + sg * 9, sy + 8)
        c.poly([(sx, sy), tip, (tip[0] - sg * 4, (tip[1] + mid[1]) / 2), mid, ((mid[0] + low[0]) / 2, mid[1] + 6), low], wing_n)
        c.line([(sx, sy), tip], 1.0, C('leather', 3)); c.line([(sx, sy), mid], 0.9, C('leather', 3))
    c.ell(cx, cy, 8, 9.5, body)
    c.ell(cx, cy + 3, 5.6, 5.5, belly)
    if front:
        c.ell(cx, cy - 8, 5.2, 4.6, C('leather', 2))
        for ex in (-2, 2):
            c.ell(cx + ex, cy - 8.4, 1.1, 1.1, C('red', 4))
        c.line([(cx, cy - 6), (cx, cy - 3 + dive * 3)], 1.2, C('bone', 1))             # the proboscis, foreshortened at the viewer
        c.ell(cx, cy - 2.5 + dive * 3, 1.3, 1.3, C('bone', 2))
    else:
        c.ell(cx, cy - 8, 5, 4.4, C('leather', 1))
        for ex in (-4, 4):
            c.poly([(cx + ex, cy - 11), (cx + ex * 1.5, cy - 15), (cx + ex * 0.4, cy - 11)], C('leather', 1))   # the ears
        c.line([(cx - 2, cy + 8), (cx - 3, cy + 13)], 1.1, wing_f); c.line([(cx + 2, cy + 8), (cx + 3, cy + 13)], 1.1, wing_f)
    if front:
        c.line([(cx - 3, cy + 8), (cx - 4, cy + 13)], 1.1, wing_f); c.line([(cx + 3, cy + 8), (cx + 4, cy + 13)], 1.1, wing_f)
    return c.finish()


# ------------------------------------------------------------------ the hurt row from the front and behind: his generated sheets (10-08)
# Griz, 10-08, two GPT sheets for the art list's "the three bugs' hurt row from the front and behind" ("In for /deep16/art wanted"):
# deep16/_src/Stirge front and back hurt sheet.png and Fire Beetle front and back hurt sheet.png, rows "Hurt Front" (S) and "Hurt Back" (N),
# eight frames each, cut by tools/sheetrows.py on boxes read off the images. The side row stays drawn in code; the giant centipede's sheet
# came the same night (below). Each spec: text boxes, rows (facing, band x0 y0 x1 y1, label strip y0 y1), and K, image px a game px:
# the figure's area in frame 1 (the bug as it stands, before the blow lands) against the code's own S idle's (the stirge 898 px, K 3.68 S and 3.72 N; the beetle 1220, 3.04 and 3.01),
# measured on the pixelated frame, outline and all. The stirge flies: its sheet starts it only a little above the floor it lands on, so the
# rise above the floor is stretched to start at its idle's height (19 px) and land where the sheet lands it.
HURT_FB = {
    'stirge': dict(file='Stirge front and back hurt sheet.png', K=3.70, lift=True,
                   text=[(30, 190, 150, 272), (30, 500, 150, 580)],
                   rows=[('S', (150, 105, 2172, 305), (316, 352)), ('N', (150, 415, 2172, 615), (627, 663))]),
    'firebeetle': dict(file='Fire Beetle front and back hurt sheet.png', K=3.03, lift=False,
                       text=[(25, 145, 300, 190), (25, 455, 280, 500)],
                       rows=[('S', (30, 195, 1983, 362), (364, 398)), ('N', (30, 503, 1983, 666), (673, 712))]),
    # the centipede's, the same night from the paste on the art list (his "I told it you were getting the centipede"): the image he pasted in
    # chat (2000 x 667 webp) filed as deep16/_src/Centipede front and back hurt sheet.webp; a PNG of it in its place cuts the same. K a view
    # each: the code draws its back smaller than its front (its S idle 1223 px, its N 1069) where his two rows share one scale, so one K
    # would jump the size as the fall starts in one facing; each view's frame 1 to its own idle (S 3.19, N 3.79)
    'centipede': dict(file='Centipede front and back hurt sheet.webp', K={'S': 3.19, 'N': 3.79}, lift=False,
                      text=[(15, 18, 210, 50), (15, 340, 192, 373)],
                      rows=[('S', (50, 65, 2000, 286), (289, 319)), ('N', (50, 375, 2000, 600), (604, 634))]),
}
FLOOR = 85                                  # the idle's lowest row (AY 84, its outline under it): a corpse lies on it


def _src_dir():
    """his sheets live in the main checkout (_src is not in git): a worktree reads them there"""
    d = os.path.join(ca.ROOT, 'deep16', '_src')
    if os.path.isdir(d):
        return d
    import subprocess
    common = subprocess.run(['git', '-C', ca.ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    return os.path.join(os.path.dirname(os.path.abspath(os.path.join(ca.ROOT, common))), 'deep16', '_src')


def _bottom(im):
    a = np.asarray(im)[..., 3] > 0
    return int(np.where(a.any(axis=1))[0][-1])


def hurt_fb(name, idle):
    """-> {'S': [8 frames], 'N': [8 frames]} from his sheet, or {} for a bug with none; `idle` the code's idle row with its S and N"""
    if name not in HURT_FB:
        return {}
    import importlib.util
    from scipy import ndimage

    def load(nm):
        spec = importlib.util.spec_from_file_location(nm, os.path.join(ca.ROOT, 'tools', nm + '.py'))
        mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
        return mod
    SR, pix = load('sheetrows'), load('pixelate')
    h = HURT_FB[name]
    names = [str(i + 1) for i in range(8)]
    rows = SR.cut_sheet(os.path.join(_src_dir(), h['file']), dict(text=h['text'], rows=[(v, b, l, names) for v, b, l in h['rows']]),
                        tag=name)
    out = {}
    for view, _, _ in h['rows']:
        frs = rows[view]
        k = h['K'][view] if isinstance(h['K'], dict) else h['K']
        floor = max(b[3] for _, _, b in frs)
        ups = [(floor - b[3]) / k for _, _, b in frs]
        if h['lift'] and ups[0] > 0:                     # from its idle's height above the floor, landing where the sheet lands it
            ups = [u * (FLOOR - _bottom(idle[view][0])) / ups[0] for u in ups]
        row = []
        for (nm, im, box), up in zip(frs, ups):
            w, hh = im.size
            a = pix.pixelate(im.resize((max(1, round(w / k)), max(1, round(hh / k))), Image.BOX), 1, do_lift=False)
            d = ndimage.distance_transform_edt(a[..., 3] > 0)
            cx = float(np.where(d >= 0.7 * d.max())[1].mean())   # the body's thick middle: the wings and legs are thin
            fr = np.zeros((FH, FW, 4), np.uint8)
            bottom = np.where(a[..., 3].any(axis=1))[0][-1]
            ox, oy = int(round(AX - cx)), int(round(FLOOR - up)) - bottom
            ah, aw = a.shape[:2]
            y0, x0, y1, x1 = max(0, oy), max(0, ox), min(FH, oy + ah), min(FW, ox + aw)
            fr[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
            if (fr[..., 3] > 0).sum() < (a[..., 3] > 0).sum():
                raise SystemExit('%s hurt %s frame %s: cut off at the frame edge' % (name, view, nm))
            row.append(Image.fromarray(fr, 'RGBA'))
        out[view] = row
    return out


def with_fb(name, rows):
    """Bring each row's front (S) and back (N) beside its side frames; hurt takes his generated sheet's where there is one (10-08), else
    keeps the side frames (as the clacker's sheet)."""
    out = {}
    for an, fr in rows.items():
        if an in ('hurt', 'latched'):
            out[an] = fr
            continue
        n = len(fr)
        d = {'side': fr}
        for v in ('S', 'N'):
            if name == 'firebeetle':
                if an == 'idle': d[v] = [beetle_fb(v, ph=i / n, pulse=0.5 + 0.5 * S(PI2 * i / n), lift=0.6 * S(PI2 * i / n)) for i in range(n)]
                elif an == 'walk': d[v] = [beetle_fb(v, ph=i / n, walk=1.0, pulse=0.5 + 0.5 * S(PI2 * i / n), lift=1.2 * abs(S(PI2 * i / n))) for i in range(n)]
                elif an == 'attack': d[v] = [beetle_fb(v, ph=i / n, bite=b, lift=l, pulse=0.9) for i, (b, l) in enumerate(zip([0, .2, .5, 1, 1, .6, .2, 0], [0, 1, 2, 0, 0, 0, 0, 0]))]
                else: d[v] = [beetle_fb(v, ph=i / n, bite=0.4, lift=l, pulse=0.2) for i, l in enumerate([0, 2, 1, 0, 0, 0])]
            elif name == 'centipede':
                if an == 'idle': d[v] = [centipede_fb(v, ph=i / n, walk=0.2) for i in range(n)]
                elif an == 'walk': d[v] = [centipede_fb(v, ph=i / n, walk=1.0) for i in range(n)]
                elif an == 'attack': d[v] = [centipede_fb(v, ph=i / n, walk=0.3, rear=r, bite=b) for i, (r, b) in enumerate(zip([0, .15, .45, .8, .55, .2, 0, 0], [0, 0, .3, 1, 1, .4, 0, 0]))]
                else: d[v] = [centipede_fb(v, ph=i / n, walk=0.5, rear=r, bite=0.5) for i, r in enumerate([0, .5, .6, .3, .1, 0])]
            elif name == 'stirge':
                if an in ('idle', 'walk'): d[v] = [stirge_fb(v, ph=i / n) for i in range(n)]
                elif an == 'attack': d[v] = [stirge_fb(v, ph=i / n, dive=dv, fold=f) for i, (dv, f) in enumerate(zip([0, -.2, -.4, .5, 1, .8, .3, 0], [0, 0, 0, .3, .6, .4, 0, 0]))]
                else: d[v] = [stirge_fb(v, ph=i / n, drop=dd) for i, dd in enumerate([0, 3, 4, 2, 1, 0])]
        out[an] = d
    fb = hurt_fb(name, out['idle'])
    if fb:
        out['hurt'] = dict(side=out['hurt'], **fb)
    return out


MAKE = {'stirge': (stirge_rows, 'stirge_p1', 62, {'idle': 8, 'walk': 10, 'attack': 12, 'flinch': 10, 'hurt': 8, 'latched': 6}),
        'firebeetle': (beetle_rows, 'firebeetle_p1', 52, {'idle': 6, 'walk': 10, 'attack': 12, 'flinch': 10, 'hurt': 8}),
        'centipede': (centipede_rows, 'centipede_p1', 50, {'idle': 8, 'walk': 12, 'attack': 12, 'flinch': 10, 'hurt': 8})}

if __name__ == '__main__':
    names = [a for a in sys.argv[1:] if a in MAKE] or list(MAKE)
    for nm in names:
        fn, out, top, fps = MAKE[nm]
        rows = with_fb(nm, fn())
        if 'preview' in sys.argv:
            ca.preview(rows, os.path.join(ca.ROOT, 'dev', 'shots', 'bugs-%s.png' % nm))
        else:
            sh, meta = ca.lay(rows, FW, FH, AX, AY, top, 'drawn in code by tools/bugs-sheet.py (10-05)', out, fps_of=fps)
            print('wrote deep16/art/%s.png' % out, sh.size)

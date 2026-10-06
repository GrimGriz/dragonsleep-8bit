"""Rascal the Lobstamonkee for DEEP16 (Griz's Monster Party PC; MPMon's third), built in code from his needle-felted figure's three photos and
the black-hatted drawing -- pipeline 1b's "no base mesh" branch (deep16/blender-monsters.md), but with no printed kit either: every part is made here.
10-06. Stage one: the model, the rig, the look. The rows (and any frames) wait on his word on the look.

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --disable-autoexec --python tools/rascal-blend.py -- build
    ... -- look <tag> [preset=13] [hat=1]      the idle, four facings, to deep16/_src/rascal/look_out/<tag>/  (then tools/rascal-look.py <tag>)
    ... -- close <tag> [face=0] [zoom=2.6] [hz=2.05]   an 800 px close look at the head (zoom: rig units across the frame)
    ... -- poses <tag> [facings=0,2,4,6] [snap=45]     matcap frames: the rest pose, a bent one, the lower pincer snapped open (the rig's check)

What he is (from the felt figure and the drawing): a red-brown fuzzy lobstamonkee, a big domed head with a bright red face, two black bead eyes each in
a yellow ring with yellow lines running down to an orange muzzle, two long orange wire antennae that arch up and hook, two short yellow horns, four
curling whisker-tentacles at the mouth, a long thin left arm with a three-fingered hand, a GIANT banded lobster claw for a right arm (the biggest
thing on the felt figure: a yellow/orange/black forearm swelling into the palm, two long red-tipped pincers), short bent legs, a banded (red/black,
orange tip) lobster tail, and a black felt cowboy hat with a red rope band. Units are ~1.75 ft; one 5-ft square is FOOT_D = 2.0 units. Faces -Y,
+X is his left, z up, feet on z 0.

The skeleton is the troll's shape (tools/blender_pose.py's Rig: spine, neck, head, two four-bone arms, two legs whose thighs are roots at the hip) plus
his own chains (tail, antennae, horns, whiskers, the hat riding the head, the lower pincer `pinch_b` under the claw's `hand_b`), which the rows turn
by bone name. v5 (10-06, Fable): the claw ~1.6x, the hat wider and rounder, the face brightened, the pose test in degrees, the close-up zoomed.
"""
import bpy, bmesh, sys, os, math, importlib.util, json, random
from mathutils import Vector, Quaternion, Matrix, noise

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'deep16', '_src', 'rascal')
os.makedirs(SRC, exist_ok=True)
spec = importlib.util.spec_from_file_location('blender_look', os.path.join(ROOT, 'tools', 'blender_look.py'))
BL = importlib.util.module_from_spec(spec); spec.loader.exec_module(BL)
spec = importlib.util.spec_from_file_location('blender_pose', os.path.join(ROOT, 'tools', 'blender_pose.py'))
BP = importlib.util.module_from_spec(spec); spec.loader.exec_module(BP)

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['build']
MODE = ARGS[0]
TAG = ARGS[1] if MODE in ('look', 'close', 'poses') and len(ARGS) > 1 else 'rascal'
OPT = dict(a.split('=', 1) for a in ARGS if '=' in a)
PRESET = OPT.get('preset', '13')
FOOT_D, SQ_H = 2.0, 1.0            # one 5-ft square in rig units; squares of footprint
V3 = lambda *a: Vector(a[0] if len(a) == 1 else a) if a else Vector((0.0, 0.0, 0.0))
rnd = random.Random(11); noise.seed_set(11)

# ------------------------------------------------------------------ the palette (sRGB hex; BL.srgb2lin at the end)
PAL = dict(body='#ef7d5c', head='#e86e50', limb='#e4705a', belly='#f79a70', muzzle='#ffa048', face='#ff4a3a', yline='#ffdc62', hand='#cc5238', pad='#f08060',
           ring='#f03a2c', eye='#0b0a0d', glint='#ffffff', wire='#ff8a3a', wiretip='#ffc84a', horn='#fcd25c', whisk='#ff9a3c',
           tred='#e0443a', tblack='#3a3640', torange='#ff8a34', tyellow='#ffd25a', ctip='#f03a30',
           hat='#464252', rope='#d8443a', rope2='#a8281f', brow='#a03a28')      # (v5: the face and muzzle brighter, the hat a shade up from near-black)

# ------------------------------------------------------------------ the geometry store: points, faces, a colour and a flag per face, weights per point
VERTS, FACES, FCOL, FFLAG, VW = [], [], [], [], []


def add(vs, fs, col, wts, flat=False):
    """vs: points; fs: index tuples into vs; col: a hex, or f(face centroid) -> hex; wts: one dict per point (bone -> weight), or a dict for all."""
    base = len(VERTS)
    for i, v in enumerate(vs):
        VERTS.append(V3(v)); VW.append(wts[i] if isinstance(wts, list) else wts)
    for f in fs:
        FACES.append(tuple(base + i for i in f))
        cc = col(sum((V3(vs[i]) for i in f), V3()) / len(f)) if callable(col) else col
        hexc, fl = cc if isinstance(cc, tuple) else (cc, flat)        # (a colour function may answer (hex, unshaded): the face's yellow lines)
        FCOL.append(hexc); FFLAG.append(fl)


def frame_along(P):
    """parallel-transported (u, v) per point of a polyline."""
    n = len(P); T = []
    for i in range(n):
        a = P[max(i - 1, 0)]; b = P[min(i + 1, n - 1)]
        T.append((b - a).normalized())
    seed = V3((0, 0, 1)) if abs(T[0].z) < 0.9 else V3((1, 0, 0))
    u = T[0].cross(seed).normalized(); out = []
    for i in range(n):
        if i:
            ax = T[i - 1].cross(T[i])
            if ax.length > 1e-6:
                ang = T[i - 1].angle(T[i]); u = Quaternion(ax.normalized(), ang) @ u
        u = (u - T[i] * u.dot(T[i])).normalized()
        out.append((T[i], u, T[i].cross(u)))
    return out


def tube(P, R, col, wf, sides=8, cap0=True, cap1=True, ringcol=None):
    """a tapered tube along the polyline P with radii R. col: a hex or f(ring index) -> hex (a band per ring pair); wf(i) -> weights of ring i.
    Round caps: a smaller ring, then a pole."""
    fr = frame_along(P); vs, ws, rings = [], [], []
    if not callable(wf):
        wd = wf; wf = lambda i: wd

    def ring(c, r, T, u, v, w):
        idx = []
        for k in range(sides):
            a = 2 * math.pi * k / sides
            vs.append(c + (u * math.cos(a) + v * math.sin(a)) * r); ws.append(w); idx.append(len(vs) - 1)
        return idx
    pole = []
    if cap0:
        T, u, v = fr[0]; w = wf(0)
        vs.append(P[0] - T * R[0] * 0.85); ws.append(w); pole.append(len(vs) - 1)
        rings.append(ring(P[0] - T * R[0] * 0.5, R[0] * 0.75, T, u, v, w))
    first_real = len(rings)
    for i in range(len(P)):
        T, u, v = fr[i]; rings.append(ring(P[i], R[i], T, u, v, wf(i)))
    if cap1:
        T, u, v = fr[-1]; w = wf(len(P) - 1)
        rings.append(ring(P[-1] + T * R[-1] * 0.5, R[-1] * 0.75, T, u, v, w))
        vs.append(P[-1] + T * R[-1] * 0.85); ws.append(w); pole.append(len(vs) - 1)
    fs, cols = [], []
    for j in range(len(rings) - 1):
        a, b = rings[j], rings[j + 1]
        for k in range(sides):
            fs.append((a[k], a[(k + 1) % sides], b[(k + 1) % sides], b[k]))
            ri = min(max(j - first_real + 0, 0), len(P) - 1) if cap0 else min(j, len(P) - 1)
            cols.append(ri)
    if cap0:
        for k in range(sides):
            fs.append((pole[0], rings[0][(k + 1) % sides], rings[0][k])); cols.append(0)
    if cap1:
        for k in range(sides):
            fs.append((pole[-1], rings[-1][k], rings[-1][(k + 1) % sides])); cols.append(len(P) - 2)
    base = len(VERTS)
    for i, v in enumerate(vs):
        VERTS.append(v); VW.append(ws[i])
    for f, ci in zip(fs, cols):
        FACES.append(tuple(base + i for i in f)); FCOL.append(col(ci) if callable(col) else col); FFLAG.append(False)


def ell(c, r, col, wts, seg=14, rings=9, flat=False, rot=None):
    """an ellipsoid at c with radii r=(x, y, z); col: a hex or f(unit direction) -> hex."""
    vs, fs = [], []
    for j in range(rings + 1):
        th = math.pi * j / rings
        for k in range(seg if 0 < j < rings else 1):
            ph = 2 * math.pi * k / seg
            d = V3((math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)))
            vs.append(d)
    # indices: pole 0, rings 1..rings-1 each seg, pole last
    top, bot = 0, len(vs) - 1
    def idx(j, k):
        return 0 if j == 0 else bot if j == rings else 1 + (j - 1) * seg + (k % seg)
    for j in range(rings):
        for k in range(seg):
            a, b, cc, d = idx(j, k), idx(j, k + 1), idx(j + 1, k + 1), idx(j + 1, k)
            if j == 0: fs.append((a, d, cc))
            elif j == rings - 1: fs.append((a, d, b))
            else: fs.append((a, b, cc, d))
    dirs = vs
    c = V3(c); pts = []
    for d in dirs:
        p = V3((d.x * r[0], d.y * r[1], d.z * r[2]))
        if rot is not None: p = rot @ p
        pts.append(p + c)
    base = len(VERTS)
    for i, p in enumerate(pts):
        VERTS.append(p); VW.append(wts[i] if isinstance(wts, list) else wts)
    for f in fs:
        FACES.append(tuple(base + i for i in f))
        if callable(col):
            dd = sum((dirs[i] for i in f), V3()) / len(f); cc = col(dd.normalized() if dd.length else dd)
        else:
            cc = col
        hexc, fl = cc if isinstance(cc, tuple) else (cc, flat)
        FCOL.append(hexc); FFLAG.append(fl)


def path(*pts):
    return [V3(p) for p in pts]


def resample(P, n):
    """n+1 points equally spaced in arclength along the polyline."""
    L = [0.0]
    for i in range(1, len(P)): L.append(L[-1] + (P[i] - P[i - 1]).length)
    out = []
    for k in range(n + 1):
        s = L[-1] * k / n
        j = max(i for i in range(len(L)) if L[i] <= s + 1e-9); j = min(j, len(P) - 2)
        t = (s - L[j]) / max(L[j + 1] - L[j], 1e-9); out.append(P[j] + (P[j + 1] - P[j]) * t)
    return out


def smooth(P, sub=3):
    """Chaikin smoothing: a hand-set polyline into a flowing wire."""
    for _ in range(sub):
        Q = [P[0]]
        for i in range(len(P) - 1):
            Q.append(P[i] * 0.75 + P[i + 1] * 0.25); Q.append(P[i] * 0.25 + P[i + 1] * 0.75)
        Q.append(P[-1]); P = Q
    return P


# ------------------------------------------------------------------ the skeleton: name -> (head, tail, parent)
BONES = {}


def bone(name, head, tail, parent=None):
    BONES[name] = (V3(head), V3(tail), parent)


def chain_bones(prefix, pts, nb, parent):
    """nb bones down the polyline P (resampled equally); returns [(name, head, tail)]."""
    S = resample(pts, nb); names = []
    for j in range(nb):
        n = '%s%d' % (prefix, j); bone(n, S[j], S[j + 1], parent if j == 0 else '%s%d' % (prefix, j - 1)); names.append(n)
    return names


def chain_weights(prefix, nb, pts):
    """weights for a tube's rings along `pts` (the dense path): by arclength, blended between neighbouring bones' middles."""
    L = [0.0]
    for i in range(1, len(pts)): L.append(L[-1] + (pts[i] - pts[i - 1]).length)
    tot = L[-1]

    def wf(i):
        s = L[i] / tot * nb          # in bone units; a bone j's middle is at j + 0.5
        x = s - 0.5
        j = int(math.floor(x)); f = x - j
        if j < 0: return {'%s0' % prefix: 1.0}
        if j >= nb - 1: return {'%s%d' % (prefix, nb - 1): 1.0}
        return {'%s%d' % (prefix, j): 1 - f, '%s%d' % (prefix, j + 1): f}
    return wf


# the body ---------------------------------------------------------------
HIPZ = 0.98
bone('hip', (0, 0.06, HIPZ), (0, 0.02, 1.24))
bone('chest', (0, 0.02, 1.24), (0, -0.07, 1.62), 'hip')
bone('neck', (0, -0.07, 1.62), (0, -0.11, 1.78), 'chest')
bone('head', (0, -0.11, 1.78), (0, -0.11, 2.38), 'neck')
for s, sg in (('a', 1), ('b', -1)):
    bone('clav_' + s, (0, -0.04, 1.55), (sg * 0.32, -0.04, 1.52), 'chest')
    bone('thigh_' + s, (0, 0.06, HIPZ), (sg * 0.40, -0.12, 0.58))
    bone('calf_' + s, (sg * 0.40, -0.12, 0.58), (sg * 0.36, 0.10, 0.16), 'thigh_' + s)
    bone('foot_' + s, (sg * 0.36, 0.10, 0.16), (sg * 0.38, -0.12, 0.06), 'calf_' + s)
    bone('toes_' + s, (sg * 0.38, -0.12, 0.06), (sg * 0.40, -0.40, 0.03), 'foot_' + s)
# his left arm (+X, 'a'): long and thin, a three-fingered felt hand
bone('upper_a', (0.32, -0.04, 1.52), (0.64, 0.00, 1.30), 'clav_a')
bone('fore_a', (0.64, 0.00, 1.30), (0.72, -0.30, 1.14), 'upper_a')
bone('hand_a', (0.72, -0.30, 1.14), (0.74, -0.46, 1.08), 'fore_a')
# his right arm (-X, 'b'): the giant lobster claw -- a short furry upper arm, a thick banded forearm swelling into the claw's palm, and two long
# red-tipped pincers from the wrist (v5: the whole claw ~1.6x v4's; Griz, 10-06: "His right hand is a giant claw")
bone('upper_b', (-0.32, -0.04, 1.52), (-0.56, -0.02, 1.30), 'clav_b')
bone('fore_b', (-0.56, -0.02, 1.30), (-0.58, -0.28, 0.98), 'upper_b')
bone('hand_b', (-0.58, -0.28, 0.98), (-0.40, -0.82, 0.50), 'fore_b')     # the upper pincer (the fixed finger; the rows turn the whole claw by it)
bone('pinch_b', (-0.58, -0.28, 0.98), (-0.80, -0.66, 0.54), 'hand_b')    # the lower pincer (it snaps: a turn about the axis both pincers hinge on)

W = lambda **k: k


def torso_col(d):
    return PAL['belly'] if d.y < -0.35 and d.z < 0.5 else PAL['body']


ell((0, 0.03, 1.24), (0.42, 0.34, 0.46), torso_col, W(hip=0.35, chest=0.65), seg=16, rings=10)        # the barrel chest
ell((0, 0.06, 1.02), (0.32, 0.27, 0.22), PAL['body'], W(hip=1.0), seg=12, rings=7)                  # the hips


def head_col(d):
    if d.y < -0.30:                      # the face: bright red, a yellow line down from under each eye and one down the middle to the muzzle. The whole face is
        # UNSHADED (v8): under the brim the key light never reaches it, and at 1x it went near black; the felt's face is the brightest red on him
        # (v7: the lines start under the eyes -- run up through them they joined the rings into one yellow bar at 1x, and the face read as goggles)
        if 0.13 < abs(d.x) < 0.22 and -0.45 < d.z < 0.08: return (PAL['yline'], True)
        if abs(d.x) < 0.045 and -0.5 < d.z < 0.0: return (PAL['yline'], True)
        if d.z < -0.38 and abs(d.x) < 0.45: return (PAL['muzzle'], True)
        return (PAL['face'], True)
    return PAL['head']


ell((0, -0.09, 1.96), (0.36, 0.33, 0.36), head_col, W(head=1.0), seg=36, rings=18)      # (v8: finer, so a yellow line is one face wide and not three)
ell((0, -0.30, 1.80), (0.16, 0.12, 0.10), PAL['muzzle'], W(head=1.0), seg=10, rings=6)
ell((0, -0.14, 1.66), (0.15, 0.12, 0.10), PAL['body'], W(neck=1.0), seg=10, rings=6)
for sg in (1, -1):                       # two big black bead eyes, each in a yellow ring (the felt's yellow loops round the eyes), a white glint; all unshaded
    ell((sg * 0.19, -0.32, 2.05), (0.14, 0.085, 0.14), PAL['yline'], W(head=1.0), seg=12, rings=7, flat=True)     # (v7: a thin rim -- v5's wide rings read as yellow goggles at 1x)
    ell((sg * 0.19, -0.37, 2.05), (0.125, 0.08, 0.125), PAL['eye'], W(head=1.0), seg=12, rings=7, flat=True)
    ell((sg * 0.155, -0.445, 2.095), (0.035, 0.022, 0.035), PAL['glint'], W(head=1.0), seg=6, rings=4, flat=True)

# his left arm and hand: long, thin; three long thin fingers
tube(path((0.32, -0.04, 1.52), (0.48, -0.02, 1.42), (0.64, 0.00, 1.30)), [0.105, 0.085, 0.07], PAL['limb'], lambda i: {'upper_a': 1.0} if i < 2 else {'upper_a': 0.5, 'fore_a': 0.5}, sides=8)
tube(path((0.64, 0.00, 1.30), (0.69, -0.14, 1.22), (0.72, -0.30, 1.14)), [0.07, 0.065, 0.06], PAL['limb'], lambda i: {'fore_a': 1.0} if i < 2 else {'fore_a': 0.5, 'hand_a': 0.5}, sides=8)
ell((0.73, -0.34, 1.12), (0.085, 0.09, 0.075), PAL['hand'], W(hand_a=1.0), seg=10, rings=6)
for off in (-0.07, 0.0, 0.07):
    tube(path((0.73 + off * 0.5, -0.38, 1.10), (0.73 + off * 1.4, -0.50, 1.04), (0.73 + off * 2.2, -0.60, 0.97)), [0.03, 0.026, 0.016],
         lambda i: PAL['hand'] if i == 0 else PAL['pad'], W(hand_a=1.0), sides=6)

# his right arm: the giant claw, the biggest thing on the felt figure. A furry upper arm, then the banded forearm (yellow/orange/black, a lobster's)
# swelling into the claw's palm at the wrist, then two long fat pincers splayed apart, banded, the last third of each red
tube(path((-0.32, -0.04, 1.52), (-0.45, -0.03, 1.42), (-0.56, -0.02, 1.30)), [0.11, 0.10, 0.10], PAL['limb'], lambda i: {'upper_b': 1.0} if i < 2 else {'upper_b': 0.5, 'fore_b': 0.5}, sides=8)
FB = smooth(path((-0.56, -0.02, 1.30), (-0.59, -0.13, 1.15), (-0.58, -0.28, 0.98)), 2)
nfb = len(FB)
fb_band = lambda i: [PAL['tyellow'], PAL['torange'], PAL['tblack'], PAL['torange']][(i // 3) % 4]
tube(FB, [0.15 + 0.10 * (i / (nfb - 1)) + 0.03 * math.sin(math.pi * i / (nfb - 1)) for i in range(nfb)], fb_band, lambda i: {'fore_b': 1.0} if i < nfb - 2 else {'fore_b': 0.5, 'hand_b': 0.5}, sides=10)
UP = smooth(path((-0.58, -0.28, 0.98), (-0.55, -0.52, 0.80), (-0.48, -0.70, 0.62), (-0.40, -0.82, 0.50)), 3)
LO = smooth(path((-0.58, -0.28, 0.98), (-0.68, -0.46, 0.80), (-0.76, -0.58, 0.64), (-0.80, -0.66, 0.54)), 3)
for P_, bn, rad in ((UP, 'hand_b', 0.21), (LO, 'pinch_b', 0.16)):
    n_ = len(P_)
    tube(P_, [rad * (1 - 0.88 * (i / (n_ - 1)) ** 1.3) for i in range(n_)],
         lambda i, n_=n_: PAL['ctip'] if i >= int(n_ * 0.62) else [PAL['tyellow'], PAL['tblack'], PAL['torange'], PAL['tyellow']][(i // 5) % 4], W(**{bn: 1.0}), sides=8)

# the legs: thin, bent out at the knee like a spider's, a big splayed three-toed foot
for s, sg in (('a', 1), ('b', -1)):
    th = path((sg * 0.10, 0.06, 1.0), (sg * 0.26, -0.02, 0.80), (sg * 0.40, -0.12, 0.58))
    tube(th, [0.14, 0.105, 0.085], PAL['limb'], lambda i, s=s: {'thigh_' + s: 1.0} if i < 2 else {'thigh_' + s: 0.5, 'calf_' + s: 0.5}, sides=8)
    ca = path((sg * 0.40, -0.12, 0.58), (sg * 0.38, 0.0, 0.38), (sg * 0.36, 0.10, 0.16))
    tube(ca, [0.085, 0.07, 0.065], PAL['limb'], lambda i, s=s: {'calf_' + s: 1.0} if i < 2 else {'calf_' + s: 0.6, 'foot_' + s: 0.4}, sides=8)
    ell((sg * 0.37, 0.0, 0.09), (0.10, 0.20, 0.07), PAL['hand'], W(**{'foot_' + s: 1.0}), seg=10, rings=6)
    for off in (-0.13, 0.0, 0.13):
        tp = path((sg * (0.37 + off * 0.3), -0.12, 0.07), (sg * (0.38 + off * 1.0), -0.26, 0.05), (sg * (0.38 + off * 1.5), -0.40, 0.035))
        tube(tp, [0.04, 0.032, 0.022], lambda i: PAL['hand'] if i == 0 else PAL['pad'], W(**{'toes_' + s: 1.0}), sides=6)

# the tail: a thin banded stick that trails down and back to the floor like a third leg, an orange tip
TAIL = smooth(path((0, 0.22, 1.00), (0, 0.50, 0.80), (0, 0.76, 0.52), (0, 0.92, 0.26), (0, 0.98, 0.07)), 3)
TN = 6
chain_bones('tail', TAIL, TN, 'hip')
nt = len(TAIL); trad = [0.115 - 0.065 * (i / (nt - 1)) for i in range(nt)]
tube(TAIL, trad, lambda i: PAL['torange'] if i >= nt - 6 else (PAL['tred'] if (i // 4) % 2 == 0 else PAL['tblack']), chain_weights('tail', TN, TAIL), sides=8)


# the antennae: two long orange wires that go out under the brim, arch up and hook; two short yellow horns; four curling whiskers at the mouth
for s, sg in (('a', 1), ('b', -1)):
    # (v6: the wires sweep forward as they rise, as the felt's do -- in one plane they stacked into a vertical pole from the side)
    AP = smooth(path((sg * 0.28, -0.02, 2.06), (sg * 0.55, -0.10, 2.00), (sg * 0.80, -0.22, 2.12), (sg * 0.94, -0.34, 2.42), (sg * 0.88, -0.40, 2.78),
                     (sg * 0.66, -0.38, 2.96), (sg * 0.46, -0.30, 2.84), (sg * 0.48, -0.26, 2.66), (sg * 0.60, -0.28, 2.64)), 3)
    nb = 7; pre = 'ant_' + s; chain_bones(pre, AP, nb, 'head'); n = len(AP)
    tube(AP, [0.040 - 0.018 * (i / (n - 1)) for i in range(n)], lambda i, n=n: PAL['wiretip'] if i > n - 12 else PAL['wire'], chain_weights(pre, nb, AP), sides=6)
    # (v4 gave him two short yellow horns here; the six photos show none -- they poked up through the hat's brim as two yellow hooks. Cut, v6.)


def curl(c, r0, turns, a0, n, plane):
    """a spiral in a plane (u, v) about c, from radius r0 inward; a0 where it starts."""
    u, v = plane; out = []
    for k in range(n):
        t = k / (n - 1); a = a0 + turns * 2 * math.pi * t; r = r0 * (1 - 0.82 * t)
        out.append(c + u * (math.cos(a) * r) + v * (math.sin(a) * r))
    return out


# the whiskers: two thick yellow-orange ones that hang forward from the muzzle, tipped with a small bulb, and two thin orange strings that curl away
for i, (sg, thick) in enumerate([(1, True), (-1, True), (1, False), (-1, False)]):
    st = V3((sg * 0.08, -0.38, 1.80))
    if thick:
        WP = smooth(path(st, (sg * 0.16, -0.50, 1.76), (sg * 0.30, -0.62, 1.64), (sg * 0.36, -0.70, 1.50), (sg * 0.30, -0.74, 1.40)), 3); rad, ncol = 0.038, 'horn'
    else:
        out = V3((sg * 0.40, -0.52, 1.84)); cen = out + V3(sg * 0.10, -0.02, -0.16)
        sp = curl(cen, 0.17, 1.2, math.pi * (1.0 if sg > 0 else 0.0), 10, (V3((1, 0, 0)), V3((0, 0, 1))))
        WP = smooth([st, V3((sg * 0.20, -0.46, 1.84)), out] + sp, 2); rad, ncol = 0.024, 'whisk'
    pre = 'whisk%d_' % i; chain_bones(pre, WP, 4, 'head'); n = len(WP)
    tube(WP, [rad * (1 - 0.4 * (j / (n - 1))) for j in range(n)], PAL[ncol], chain_weights(pre, 4, WP), sides=6)
    if thick:
        ell(WP[-1] + V3((0, 0, -0.02)), (0.06, 0.06, 0.06), PAL['horn'], W(**{pre + '3': 1.0}), seg=8, rings=5)


# the hat: his black felt cowboy hat, floppy, a wide brim that droops a little at front and back, a low round crown, a red rope band
HAT_ON = OPT.get('hat', '1') != '0'
if HAT_ON:
    # (v5: the brim wider than the shoulders and thick as felt, the crown a taller round dome -- v4's read small and flat from the game camera)
    rx, ry, HZ = 0.76, 0.70, 2.20
    tilt = Quaternion((1, 0, 0), math.radians(-16)) @ Quaternion((0, 1, 0), math.radians(4))
    place = lambda p: tilt @ p + V3((0, -0.05, HZ))
    NR, NT = 7, 28
    hv, hf = [], []
    for i in range(NR + 1):
        r = 0.44 + 0.56 * i / NR
        for k in range(NT):
            a = 2 * math.pi * k / NT; x = math.cos(a) * rx * r; y = math.sin(a) * ry * r
            z = 0.13 * (x / rx) ** 2 - 0.05 * (y / ry) ** 2 + 0.03 * (r - 0.44)        # (the sides curl up, the front and back dip a little)
            hv.append(place(V3((x, y, z))))
    for i in range(NR):
        for k in range(NT):
            a, b = i * NT + k, i * NT + (k + 1) % NT
            hf.append((a, b, b + NT, a + NT))
    n0 = len(hv)
    hv += [v + V3((0, 0, -0.07)) for v in hv]
    hf2 = [(a + n0, d + n0, c + n0, b + n0) for (a, b, c, d) in hf]
    rim = [(NR * NT + k, NR * NT + k + n0, NR * NT + (k + 1) % NT + n0, NR * NT + (k + 1) % NT) for k in range(NT)]
    add(hv, hf + hf2 + rim, PAL['hat'], W(head=1.0))
    # the crown: a round dome, a shallow dent in the top
    cv, cf = [], []
    NC, NH = 22, 7
    for j in range(NH + 1):
        t = j / NH
        rr = 0.38 * math.sqrt(max(1 - (t * 0.97) ** 2.2, 0.0)) + 0.002
        zz = 0.02 + 0.42 * t
        for k in range(NC):
            a = 2 * math.pi * k / NC
            dent = 0.03 * math.exp(-(math.cos(a) * rr / 0.12) ** 2) if t > 0.8 else 0.0
            cv.append(place(V3((math.cos(a) * rr, math.sin(a) * rr * 0.94 - 0.01, zz - dent))))
    for j in range(NH):
        for k in range(NC):
            a, b = j * NC + k, j * NC + (k + 1) % NC
            cf.append((a, b, b + NC, a + NC))
    cen = len(cv); cv.append(place(V3((0, -0.01, 0.42 - 0.03))))
    for k in range(NC):
        cf.append((NH * NC + k, NH * NC + (k + 1) % NC, cen))
    add(cv, cf, PAL['hat'], W(head=1.0))
    # the rope band: a twisted red rope round the crown's foot
    RP = [place(V3((math.cos(2 * math.pi * k / 24) * 0.395, math.sin(2 * math.pi * k / 24) * 0.37 - 0.01, 0.08))) for k in range(25)]
    tube(RP, [0.04] * len(RP), lambda i: PAL['rope'] if i % 2 == 0 else PAL['rope2'], W(head=1.0), sides=6, cap0=False, cap1=False)


# ------------------------------------------------------------------ the mesh, its colour, its rig
scene = None


def make_scene():
    global scene, arm, body
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    me = bpy.data.meshes.new('Rascal_Body')
    me.from_pydata([tuple(v) for v in VERTS], [], [tuple(f) for f in FACES])
    me.update()
    for p in me.polygons: p.use_smooth = True
    body = bpy.data.objects.new('Rascal_Body', me); scene.collection.objects.link(body)
    # colour: the face's colour x a felt blotch (position noise) and a fine fuzz, written per corner
    ca = me.color_attributes.new('speckle', 'FLOAT_COLOR', 'CORNER')
    rr = random.Random(5); out = []
    for p in me.polygons:
        c = BL.srgb2lin(FCOL[p.index]); cen = p.center
        k = 1 + 0.15 * noise.noise(V3((cen.x * 3.0 + 11, cen.y * 3.0 + 3, cen.z * 3.0 + 7))) + 0.08 * (rr.random() * 2 - 1)
        flat = FFLAG[p.index]
        for li in p.loop_indices:
            ca.data[li].color = (c[0] * (1 if flat else k), c[1] * (1 if flat else k), c[2] * (1 if flat else k), 0.0 if flat else 1.0)
    me.color_attributes.active_color = ca
    # the rig
    ad = bpy.data.armatures.new('Rascal_Rig'); arm = bpy.data.objects.new('Rascal_Rig', ad); scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm; arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for n, (h, t, par) in BONES.items():
        eb = ad.edit_bones.new(n); eb.head = h; eb.tail = t if (t - h).length > 1e-4 else h + V3((0, 0, 0.01))
    for n, (h, t, par) in BONES.items():
        if par: ad.edit_bones[n].parent = ad.edit_bones[par]
    bpy.ops.object.mode_set(mode='OBJECT')
    # weights
    vg = {n: body.vertex_groups.new(name=n) for n in BONES}
    for i, w in enumerate(VW):
        tot = sum(w.values())
        for n, x in w.items():
            if x > 0: vg[n].add([i], x / tot, 'REPLACE')
    body.parent = arm
    m = body.modifiers.new('Armature', 'ARMATURE'); m.object = arm
    bpy.context.view_layer.update()


make_scene()
BN = arm.data.bones
names = dict(spine=['hip', 'chest'], neck=['neck'], head='head', arm_a=['clav_a', 'upper_a', 'fore_a', 'hand_a'], arm_b=['clav_b', 'upper_b', 'fore_b', 'hand_b'],
             leg_a=[None, 'thigh_a', 'calf_a', 'foot_a', 'toes_a', 'toes_a'], leg_b=[None, 'thigh_b', 'calf_b', 'foot_b', 'toes_b', 'toes_b'],
             roots=['hip', 'thigh_a', 'thigh_b'])
R = BP.Rig(arm, body, names, log='[rascal]')


def stand_camera():
    k = BL.UPS * SQ_H / FOOT_D
    arm.scale = (k, k, k); arm.location = (0, 0, 0); bpy.context.view_layer.update()
    Rr = 1.3 * BL.UPS * SQ_H
    lo, hi = V3((-Rr, -Rr, 0)), V3((Rr, Rr, 3.1 * k))
    return BL.sprite_camera(scene, lo, hi)


if MODE in ('look', 'close', 'poses'):
    cam, FW, FH, AX, AY = stand_camera()
    r = scene.render
    od = os.path.join(SRC, 'look_out', TAG); os.makedirs(od, exist_ok=True)
    r.film_transparent = True; r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
    if MODE == 'poses':
        r.engine = 'BLENDER_WORKBENCH'; scene.display.shading.light = 'MATCAP'
        r.resolution_x, r.resolution_y, r.resolution_percentage = FW * 2, FH * 2, 100
        views = [int(x) for x in OPT.get('facings', '0,2,4,6').split(',')]
        # the rig's check (v5): the rest pose; a bent one that turns every chain a row will (the numbers are DEGREES -- v4's test gave fractions of
        # a degree and rendered as rest, so the rig was never shown to deform); and the lower pincer snapped open about the axis both pincers hinge on
        tests = [('rest', {}), ('bend', dict(lean=12, twist=10, head=-20, hyaw=18, swa=-75, ela=-35, swb=40, outb=-30, elb=-20, tha=30, kna=45, thb=-20, knb=20)),
                 ('snap', dict(swb=-45, elb=-30))]
        pin = arm.pose.bones['pinch_b']; hb, pb_ = BN['hand_b'], BN['pinch_b']
        n_ = ((hb.tail_local - hb.head_local).cross(pb_.tail_local - pb_.head_local)).normalized()
        n_loc = pb_.matrix_local.to_3x3().inverted() @ n_                                    # (the hinge, in the lower pincer's own frame)
        for nm, P in tests:
            R.apply(P)
            pin.rotation_quaternion = Quaternion(n_loc, math.radians(float(OPT.get('snap', 45)))) if nm == 'snap' else Quaternion()
            for f in views:
                arm.rotation_euler.z = math.radians(45 - 45 * f); bpy.context.view_layer.update()
                r.filepath = os.path.join(od, '%s_f%d.png' % (nm, f)); bpy.ops.render.render(write_still=True)
        print('[rascal] poses %s done' % TAG); sys.exit(0)
    r.resolution_x, r.resolution_y, r.resolution_percentage = FW * BL.SS, FH * BL.SS, 100
    if MODE == 'close':
        arm.rotation_euler.z = math.radians(45 - 45 * int(OPT.get('face', 0))); bpy.context.view_layer.update()
        kk = arm.scale[0]; hc = arm.matrix_world @ V3((0, -0.1, float(OPT.get('hz', 2.05))))
        back = cam.matrix_world.to_3x3() @ V3((0, 0, 1))
        # (zoom: rig units across the 800 px frame. v4's default of 14 was the troll's, whose square is 50 units; here a square is 2, so it showed the whole figure small)
        cam.location = hc + back * 40; cam.data.ortho_scale = float(OPT.get('zoom', 2.6)) * kk; r.resolution_x = r.resolution_y = 800
    BL.light(scene, cam, PRESET)
    BL.toon_material(body)
    shots = [int(x) for x in OPT.get('facings', '0,2,4,6').split(',')] if MODE == 'look' else [int(OPT.get('face', 0))]
    for f in shots:
        arm.rotation_euler.z = math.radians(45 - 45 * f); bpy.context.view_layer.update()
        r.filepath = os.path.join(od, 'f%d_00.png' % f); bpy.ops.render.render(write_still=True)
    json.dump({'figure': 'rascal', 'tag': TAG, 'ss': BL.SS, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'facings': shots}, open(os.path.join(od, 'meta.json'), 'w'), indent=1)
    print('[rascal] look %s done' % TAG); sys.exit(0)

if MODE == 'build':
    BL.toon_material(body)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SRC, 'rascal.blend'))
    print('[rascal] built: %s (%d points, %d faces, %d bones)' % (os.path.join(SRC, 'rascal.blend'), len(VERTS), len(FACES), len(BONES)))

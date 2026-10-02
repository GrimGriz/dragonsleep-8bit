"""The roper for DEEP16, from MZ4250's printable Roper 2025 (Thingiverse thing:7410664, CC BY-SA: deep16/CREDITS.md) -- pipeline 1b's
second monster (deep16/blender-monsters.md), 10-01e.

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --disable-autoexec --python tools/roper-blend.py -- build [stone=fork|grey|slate]
    ... -- look <tag> [stone=...] [pupil=dot|slit|none] [tlen=0.65]   the coloured model idle and as a stalagmite, to deep16/_src/roper/look_out/<tag>/
    ... -- close <tag> [...]                                  an 800 px look at the face
    ... -- poses <tag>                                         every row's frames, matcap, side by side (the poses, not the look) to look_out/<tag>/

The zip (Griz's download, gitignored in deep16/_src/roper/roper2025/files/) has NO base mesh, unlike the xorn's:
    Roper_for_FDM_body.stl   the open roper without its tendrils: the eye, the maw, six sockets (three a side)       -> Roper_Body
    Roper_Hiding.stl         the same cone with its eye and mouth shut, a plain stalagmite (False Appearance)        -> Roper_Shut
                             (Roper_Hiding.blend holds this same sculpt and nothing else)
    Roper_Tentacle_...stl    one straight tendril with a peg at its root (for the printer, "warp it with a heat gun") -> Roper_Tendril.1-6, one per socket
    Roper.stl                the assembled roper, its tendrils sculpted in place and fused to the body: not used -- we pose our own
So the colour is painted straight onto the sculpt's points (blender_look.paint_points), and what stands proud (the teeth, the eye) is
measured against the shut body (the same cone) and a coarse copy of the open one, not a base mesh.

The rig: a root; `shut` holds the stalagmite and `wake` the living roper, and whichever is not showing is shrunk to a point inside the
other (a bone's scale: no object keys, so render-sprites.py's one action per row carries it); `body` and `head` bend the cone; ten bones
down each tendril, posed as a rope that hangs and lies on the floor (it never goes through it). The rows, every bone on every frame:
    IDLE 8 (loop: the tendrils coiled about its foot, stirring)  CREEP 8 (loop)  LASH, LASH2, LASH3, LASH4 6 (one tendril each, thrown
    at the one in front: the SRD's four)  REEL 6 (the two front tendrils hauling in)  BITE 6 (the cone bowed onto the one in front)
    FLINCH 5  DEATH 8 (the tendrils go slack and it tips over backwards; frame 3 is its prone frame)  STILL 1 (a stalagmite)
    REVEAL 8 (the stalagmite opens its eye and the tendrils come out of it)
"""
import bpy, sys, os, math, importlib.util
import numpy as np
from mathutils import Vector, Quaternion, Matrix
from mathutils.bvhtree import BVHTree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'deep16', '_src', 'roper')
FILES = os.path.join(SRC, 'roper2025', 'files')
spec = importlib.util.spec_from_file_location('blender_look', os.path.join(ROOT, 'tools', 'blender_look.py'))
BL = importlib.util.module_from_spec(spec); spec.loader.exec_module(BL)

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['build']
MODE = ARGS[0]
TAG = ARGS[1] if MODE in ('look', 'close', 'poses') and len(ARGS) > 1 else 'roper'
OPT = dict(a.split('=', 1) for a in ARGS if '=' in a)
STONE, PUPIL, PRESET = OPT.get('stone', 'fork'), OPT.get('pupil', 'dot'), OPT.get('preset', '13')
TLEN = float(OPT.get('tlen', '0.65'))     # the tendrils at 0.65 of the printed length: a lash then reaches about two squares, not four
NB = 10                                   # bones down a tendril

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def stl(fname, name):
    before = set(bpy.data.objects)
    bpy.ops.wm.stl_import(filepath=os.path.join(FILES, fname))
    ob = [o for o in bpy.data.objects if o not in before][0]
    ob.name = ob.data.name = name
    return ob


def decimate(ob, faces):
    dg = bpy.context.evaluated_depsgraph_get()
    m = ob.modifiers.new('dec', 'DECIMATE'); m.ratio = min(1.0, faces / len(ob.data.polygons))
    dg.update()
    me2 = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    ob.modifiers.remove(m); old = ob.data; ob.data = me2; bpy.data.meshes.remove(old); me2.name = ob.name
    print('[roper] %s: %d verts, %d faces' % (ob.name, len(me2.vertices), len(me2.polygons)))


def co(ob):
    a = np.zeros(len(ob.data.vertices) * 3); ob.data.vertices.foreach_get('co', a); return a.reshape(-1, 3)


def set_co(ob, a):
    ob.data.vertices.foreach_set('co', a.reshape(-1)); ob.data.update()


body = stl('Roper_for_FDM_body.stl', 'Roper_Body')
shut = stl('Roper_Hiding.stl', 'Roper_Shut')
tent = stl([f for f in os.listdir(FILES) if f.startswith('Roper_Tentacle') and f.endswith('.stl')][0], 'Roper_Tendril')
decimate(body, 240000); decimate(shut, 160000); decimate(tent, 9000)

# ------------------------------------------------------------------ one frame: the shut cone's foot at the origin, the face to -Y (as printed)
S, B = co(shut), co(body)


def foot_centre(P):
    lo = P[P[:, 2] < P[:, 2].min() + 10]
    return np.array([(lo[:, 0].max() + lo[:, 0].min()) / 2, (lo[:, 1].max() + lo[:, 1].min()) / 2, P[:, 2].min()])


S0 = foot_centre(S)
S -= S0; B -= foot_centre(B)
set_co(shut, S); set_co(body, B)
ZTOP = float(S[:, 2].max())
print('[roper] the cone: %.1f tall, foot %.1f across' % (ZTOP, S[:, 0].max() - S[:, 0].min()))

# the open body measured against the shut one (the same cone): signed distance out of the shut surface, and its outward normal
stree = BVHTree.FromPolygons(S.tolist(), [tuple(p.vertices) for p in shut.data.polygons])
DS = np.zeros(len(B)); NS = np.zeros((len(B), 3)); NEAR = np.zeros((len(B), 3))
for i in range(len(B)):
    v = Vector(B[i]); loc, nor, fi, dist = stree.find_nearest(v)
    DS[i] = (v - loc).dot(nor); NS[i] = nor[:]; NEAR[i] = loc[:]
RB = np.hypot(B[:, 0], B[:, 1])
FRONT_ANG = np.degrees(np.arctan2(np.abs(B[:, 0]), -B[:, 1]))    # 0 straight out of the face (-Y), 180 the back


def rcone(z):
    """the shut cone's radius at height z (the median over a 2-unit slice)."""
    s = np.abs(S[:, 2] - z) < 1.0
    return float(np.median(np.hypot(S[s, 0], S[s, 1]))) if s.any() else 0.0


# ------------------------------------------------------------------ the six sockets: holes into the cone off the face, three a side
cand = np.where((DS < -1.4) & (FRONT_ANG > 55) & (RB > 0.55 * np.array([rcone(z) for z in B[:, 2]])))[0]
vox = {}
for i in cand:
    vox.setdefault(tuple((B[i] / 1.5).astype(int)), []).append(i)
seen, clusters = set(), []
for k in vox:
    if k in seen:
        continue
    stack, cl = [k], []
    seen.add(k)
    while stack:
        c = stack.pop(); cl += vox[c]
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    nk = (c[0] + dx, c[1] + dy, c[2] + dz)
                    if nk in vox and nk not in seen:
                        seen.add(nk); stack.append(nk)
    clusters.append(cl)
clusters.sort(key=len, reverse=True)
print('[roper] socket clusters (points): %s' % [len(c) for c in clusters[:10]])
SOCK = []
for cl in clusters[:6]:
    # the tube's axis: from the hole's inside (the cluster) to the middle of its rim (what stands proud of the cone round it), so the
    # tendril comes out of the tube's mouth and not through its wall
    H = B[cl].mean(axis=0)
    dH = np.linalg.norm(B - H, axis=1)
    print('[roper]   hole at (%.1f, %.1f, %.1f), %d points, depth %.1f..%.1f; proud points within 3/5/7: %d %d %d' % (
        H[0], H[1], H[2], len(cl), DS[cl].min(), DS[cl].max(), ((DS > 0.5) & (dH < 3)).sum(), ((DS > 0.5) & (dH < 5)).sum(), ((DS > 0.5) & (dH < 7)).sum()))
    # (the hole is ~5 deep; the tube stands out of the cone round it: its proud walls, inside a cone about the surface's normal so the
    # maw's teeth by the middle pair stay out, give the axis; the tendril is rooted in the hole and runs out of the tube's mouth)
    loc, nor, fi, dist = stree.find_nearest(Vector(H))
    n0 = np.array(nor[:]); u_ = (B - H) / np.maximum(dH, 1e-6)[:, None]
    rim = (DS > 0.5) & (dH < 7.5) & (u_ @ n0 > 0.6)
    n = Vector(B[rim].mean(axis=0) - H).normalized() if rim.sum() >= 10 else Vector((nor.x, nor.y, 0.25 * nor.z)).normalized()
    print('[roper]   its tube: %d proud points' % int(rim.sum()))
    SOCK.append((Vector(H), n))
SOCK.sort(key=lambda s: (-round(s[0].z), -s[0].x))
assert len(SOCK) == 6, SOCK
for k, (p, n) in enumerate(SOCK):
    print('[roper] socket %d at (%.1f, %.1f, %.1f) out (%.2f, %.2f, %.2f)' % (k + 1, p.x, p.y, p.z, n.x, n.y, n.z))
# which is which: by height, top pair first; right (+x) before left. The lash order: the top right, the top left, the middle pair
SIDE = [1 if p.x > 0 else -1 for p, n in SOCK]

# ------------------------------------------------------------------ the tendril: its axis, its root (the peg's shoulder), its length
T = co(tent); c0 = T.mean(axis=0)
_, _, Vt = np.linalg.svd(T - c0, full_matrices=False); TAX = Vt[0]
ts = (T - c0) @ TAX; tr = np.linalg.norm((T - c0) - ts[:, None] * TAX, axis=1)
edges = np.linspace(ts.min(), ts.max(), 61); prof = []
for j in range(60):
    sel = tr[(ts >= edges[j]) & (ts <= edges[j + 1])]
    prof.append(float(np.percentile(sel, 90)) if len(sel) else (prof[-1] if prof else 0.0))     # (a decimated rod leaves some slices empty)
prof = np.array(prof)
if prof[:9].mean() < prof[-9:].mean():           # the root is the thick end
    TAX = -TAX; ts = -ts; prof = prof[::-1]; edges = -edges[::-1]
thick = prof[:18].max()
sh = next(j for j in range(60) if prof[j] > 0.8 * thick)
S_ROOT, S_TIP = edges[sh], ts.max()
TL = (S_TIP - S_ROOT) * TLEN
print('[roper] tendril: %.1f long (printed %.1f), %.1f thick; peg %.1f; profile %s' % (TL, S_TIP - S_ROOT, 2 * thick, S_ROOT - ts.min(), np.round(prof[::6], 2).tolist()))
e1 = np.cross(TAX, [0, 0, 1.0]); e1 = e1 / np.linalg.norm(e1) if np.linalg.norm(e1) > 1e-6 else np.array([1.0, 0, 0]); e2 = np.cross(TAX, e1)
TA = ts - S_ROOT                                  # along the tendril from the shoulder (the peg is < 0)
T1, T2 = (T - c0) @ e1, (T - c0) @ e2
TA = np.where(TA > 0, TA * TLEN, TA)              # (shortened along its length, not thinned)
SEG = TL / NB
TENDS = []
for k, (p, n) in enumerate(SOCK):
    ob = tent if k == 0 else bpy.data.objects.new('Roper_Tendril.%d' % (k + 1), tent.data.copy())
    if k == 0:
        ob.name = 'Roper_Tendril.1'
    else:
        scene.collection.objects.link(ob)
    ob.data.name = ob.name
    nn = np.array(n[:]); a1 = np.cross(nn, [0, 0, 1.0]); a1 /= np.linalg.norm(a1); a2 = np.cross(nn, a1)
    set_co(ob, np.array(p[:]) + TA[:, None] * nn + T1[:, None] * a1 + T2[:, None] * a2)
    TENDS.append(ob)

# ------------------------------------------------------------------ colour: painted onto the points (no base mesh to carry it from)
STONES = {   # (base, streak, the second stone blotched in, the tendrils): 'fork' is the Fork's own stalagmites (DEEP16's stone ramp, js/art.js)
    'fork': ('#7a6250', '#58443a', '#9a836a', '#6a5546'),
    'grey': ('#86847f', '#5e5b56', '#a09682', '#6e6b66'),
    'slate': ('#6c707a', '#4c505a', '#8a8e98', '#5c606a'),
}
SB, SS_, S2, STN = STONES[STONE]
COL = dict(base=SB, base2=S2, streak=SS_, split=2.2, fine=0.10, blotch=0.16, blotch_scale=0.09, streak_scale=(0.35, 0.35, 0.04), streak_amt=0.55, seed=7)
cb, ub = BL.paint_points(B, COL)
cs, us = BL.paint_points(S, COL)        # (the shut cone in the same stone, so the reveal does not change its colour)

# the throat: inside the shut surface, in the face -- dark and shaded (the xorn's "unpainted mouth"); its lips a darker red
mouth = (DS < -0.9) & (FRONT_ANG < 75) & (B[:, 2] > 24) & (B[:, 2] < 52)
deep = np.clip((-DS - 0.9) / 4.0, 0, 1)
cb[mouth] = (np.array(BL.srgb2lin('#5c1a22'))[None, :] * (1 - deep[mouth, None]) + np.array(BL.srgb2lin('#2a0810'))[None, :] * deep[mouth, None])
# the eye: the round ball over the maw (the shut cone's lid bulges where it sits, so it is found as a sphere, not as what stands proud):
# the face's most forward point up there; on a ball every normal runs through the centre, so p = c + r n is fitted over the points round
# it (least squares in c and r), then the ball is every point that lies on that sphere with its normal pointing out of it; gold, unshaded
VN = np.zeros(len(B) * 3); body.data.vertices.foreach_get('normal', VN); VN = VN.reshape(-1, 3)
REG = (FRONT_ANG < 35) & (B[:, 2] > 51) & (B[:, 2] < 66) & (np.abs(B[:, 0]) < 7)
mid = REG & (np.abs(B[:, 0]) < 1.0)                    # (the apex from the midline: the maw's top lip juts further than the ball)
apex = B[mid][np.argmin(B[mid][:, 1])]
print('[roper] the eye\'s apex (%.1f, %.1f, %.1f)' % tuple(apex))
on = REG & (np.linalg.norm(B - apex, axis=1) < 1.8)
for it in range(4):
    m_ = int(on.sum())
    A_ = np.zeros((3 * m_, 4)); A_[:, :3] = np.tile(np.eye(3), (m_, 1)); A_[:, 3] = VN[on].reshape(-1)
    sol = np.linalg.lstsq(A_, B[on].reshape(-1), rcond=None)[0]; ec, er = sol[:3], abs(float(sol[3]))
    rv = B - ec; rl = np.linalg.norm(rv, axis=1)
    on = REG & (np.abs(rl - er) < (0.12 if it < 3 else 0.06) * er) & ((rv * VN).sum(axis=1) / np.maximum(rl, 1e-6) > (0.85 if it < 3 else 0.94))
ball = on
cb[ball] = np.array(BL.srgb2lin('#f2c450')); ub[ball] = True
if PUPIL == 'slit':        # (at sprite size a slit cuts the eye in two: it read as two eyes, 10-01e)
    pup = ball & (np.abs(B[:, 0] - ec[0]) < er * 0.2) & (B[:, 1] < ec[1] - 0.5 * er)
    cb[pup] = np.array(BL.srgb2lin('#1a1008'))
elif PUPIL == 'dot':       # a round pupil looking straight out of the face
    pup = ball & ((B - ec) @ np.array([0, -1.0, 0]) / np.maximum(np.linalg.norm(B - ec, axis=1), 1e-6) > math.cos(math.radians(11)))
    cb[pup] = np.array(BL.srgb2lin('#1a1008'))
print('[roper] the eye at (%.1f, %.1f, %.1f) r %.1f: %d points' % (ec[0], ec[1], ec[2], er, int(ball.sum())))
BL.write_points(body, cb, ub)
BL.write_points(shut, cs, us)
for ob in TENDS:
    P = co(ob); ct, ut = BL.paint_points(P, dict(COL, base=STN, base2=SB, streak=SS_, streak_scale=(0.6, 0.6, 0.6), seed=11 + len(ob.name)))
    BL.write_points(ob, ct, ut)
# the teeth: what stands proud of a coarse copy of the open body, in the maw
coarse = body.copy(); coarse.data = body.data.copy(); scene.collection.objects.link(coarse)
decimate(coarse, 3000)
ctree = BVHTree.FromPolygons([v.co[:] for v in coarse.data.vertices], [tuple(p.vertices) for p in coarse.data.polygons])
bpy.data.objects.remove(coarse, do_unlink=True)
nt = BL.mark_proud(body, ctree, lambda x, y, z: 24 < z < 52 and abs(x) < 15 and y < -4, '#eeeadc', seed_at=1.0, grow_to=0.35)
print('[roper] teeth: %d points' % nt)
for ob in [body, shut] + TENDS:
    BL.toon_material(ob, gem_glow=1.15)

# ------------------------------------------------------------------ the armature
arm_data = bpy.data.armatures.new('Roper_Rig')
arm = bpy.data.objects.new('Roper_Rig', arm_data)
scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; arm.select_set(True)
UP = Vector((0, 0, 1)); FRONT = Vector((0, -1, 0)); TILT = UP.cross(FRONT)     # turning about TILT brings the top toward the front
ZM = 36.0                                   # where the cone bends (the maw's middle)
BONES = [('root', Vector((0, 0, 0)), Vector((0, 0, 8)), None),
         ('shut', Vector((0, 0, 24)), Vector((0, 0, 32)), 'root'),
         ('wake', Vector((0, 0, 24)), Vector((0, 0, 30)), 'root'),
         ('body', Vector((0, 0, 0)), Vector((0, 0, ZM)), 'wake'),
         ('head', Vector((0, 0, ZM)), Vector((0, 0, ZTOP)), 'body')]
for k, (p, n) in enumerate(SOCK):
    par = 'head' if p.z > ZM else 'body'
    for j in range(NB):
        BONES.append(('t%d.%d' % (k + 1, j), p + n * (SEG * j), p + n * (SEG * (j + 1)), par if j == 0 else 't%d.%d' % (k + 1, j - 1)))
bpy.ops.object.mode_set(mode='EDIT')
for name, h, t, par in BONES:
    eb = arm_data.edit_bones.new(name); eb.head, eb.tail, eb.roll = h, t, 0.0
    if par:
        eb.parent = arm_data.edit_bones[par]; eb.use_connect = name[0] == 't' and not name.endswith('.0')
bpy.ops.object.mode_set(mode='OBJECT')
arm_data.display_type = 'STICK'
arm['yaw'] = 0.0


def weigh(ob, groups):
    """groups: {bone: (indices, weights)}"""
    for name, (idx, w) in groups.items():
        vg = ob.vertex_groups.get(name) or ob.vertex_groups.new(name=name)
        q = np.round(w * 20) / 20
        for val in np.unique(q):
            if val > 0:
                vg.add(idx[q == val].tolist(), float(val), 'REPLACE')


allv = lambda ob: np.arange(len(ob.data.vertices))
weigh(shut, {'shut': (allv(shut), np.ones(len(shut.data.vertices)))})
wh = np.clip((B[:, 2] - (ZM - 8)) / 16.0, 0, 1); wh = wh * wh * (3 - 2 * wh)
weigh(body, {'body': (allv(body), 1 - wh), 'head': (allv(body), wh)})
for k, ob in enumerate(TENDS):
    u = np.clip(TA / SEG, 0, NB - 1e-6)
    g = {}
    for j in range(NB):
        w = np.clip(1 - np.abs(u - (j + 0.5)), 0, 1)
        if j == 0:
            w = np.where(u < 0.5, 1.0, w)
        if j == NB - 1:
            w = np.where(u > NB - 0.5, 1.0, w)
        g['t%d.%d' % (k + 1, j)] = (allv(ob), w)
    weigh(ob, g)
for ob in [body, shut] + TENDS:
    ob.parent = arm; ob.matrix_parent_inverse = Matrix.Identity(4); ob.matrix_basis = Matrix.Identity(4)
    m = ob.modifiers.new('Armature', 'ARMATURE'); m.object = arm; m.use_vertex_groups = True
print('[roper] rigged: %d bones' % len(BONES))

# ------------------------------------------------------------------ posing: a rope down each tendril
REST = {b.name: b.matrix_local.to_quaternion() for b in arm_data.bones}
REST3 = {b.name: b.matrix_local.to_3x3() for b in arm_data.bones}
TR = 1.6                                    # a tendril's half thickness: the floor it lies on


def pose():
    return {b[0]: [Quaternion(), Vector(), 1.0] for b in BONES}


def Q(axis, deg):
    ax = Vector(axis)
    return Quaternion(ax.normalized(), math.radians(deg)) if ax.length > 1e-6 and deg else Quaternion()


def rope(k, droop, curl, toward=None, pull=None, lift=0.0, base=None, off=None):
    """tendril k's ten directions, as a turtle walks it from its socket: each bone bends `droop[j]` degrees down and `curl[j]` round the
    foot (toward the back), never through the floor; `toward` (a direction) and `pull` (0..1 per bone) bend it onto a line instead.
    `base` (a quaternion) is the frame the socket has been carried into (the body bowing) and `off` how far the root has moved: the rope
    is worked out in the world."""
    p0, n0 = SOCK[k]
    q0 = base or Quaternion()
    p = q0 @ p0 + (off or Vector()); d = (q0 @ n0).normalized()
    if lift:
        d = (Q(UP.cross(d), -lift) @ d).normalized()
    back = 1 if SIDE[k] > 0 else -1          # (round the foot toward the back: +x side turns anticlockwise seen from above)
    out = []
    for j in range(NB):
        d = (Q(UP.cross(d) if UP.cross(d).length > 1e-4 else Vector((1, 0, 0)), droop[j]) @ d).normalized()   # (positive droop: down)
        d = (Q(UP, curl[j] * back) @ d).normalized()
        if toward is not None and pull is not None and pull[j] > 0:
            d = d.slerp(toward.normalized(), min(1.0, pull[j])) if hasattr(d, 'slerp') else (d * (1 - pull[j]) + toward.normalized() * pull[j]).normalized()
        nxt = p + d * SEG
        if nxt.z < TR:                       # the floor: it lies down along it
            h = Vector((d.x, d.y, 0.0))
            if h.length < 1e-3:
                h = Vector((n0.x, n0.y, 0.0))
            d = Vector((h.x, h.y, 0.0)).normalized() * math.sqrt(max(0.0, 1 - min(1, ((TR - p.z) / SEG) ** 2))) + Vector((0, 0, max(-1.0, min(1.0, (TR - p.z) / SEG))))
            d.normalize()
        out.append(d.copy()); p = p + d * SEG
    return out


def aim(P_, k, dirs, base=None):
    """set tendril k's bones so that bone j points along dirs[j] (armature frame). Bone j's turn composes on its parent's: the chain's
    rest direction is the socket's n, so q_j = the turn of n onto (Q_{j-1}^-1 dirs[j])."""
    n0 = SOCK[k][1]
    acc = (base or Quaternion()).copy()
    for j in range(NB):
        local = acc.inverted() @ dirs[j]
        q = n0.rotation_difference(local)
        P_['t%d.%d' % (k + 1, j)][0] = q
        acc = acc @ q


def scale_bone(P_, name, s):
    P_[name][2] = s


def wave(j, t, ph, amp):
    return amp * math.sin(2 * math.pi * t + j * 0.7 + ph)


IDLE_DROOP = [0, 30, 20, 10, 5, 2, 0, 0, 0, 0]     # (the first bone straight: out of the tube's mouth before it bends)
IDLE_CURL = [0, 0, 6, 12, 18, 22, 26, 28, 30, 32]


def idle_ropes(P_, t, amp=4.0, lift=0.0, base=None, only=None):
    for k in range(6):
        if only is not None and k not in only:
            continue
        ph = k * 1.3
        dr = [IDLE_DROOP[j] + wave(j, t, ph, amp) for j in range(NB)]
        cu = [IDLE_CURL[j] + wave(j, t, ph + 2.0, amp * 1.5) for j in range(NB)]
        aim(P_, k, rope(k, dr, cu, lift=lift, base=base), base=base)


def awake(P_):
    scale_bone(P_, 'shut', 0.001)


def row_idle(i, n):
    t = i / n; P_ = pose(); awake(P_)
    P_['body'][0] = Q(TILT, 1.2 * math.sin(2 * math.pi * t))
    idle_ropes(P_, t)
    return P_


def row_creep(i, n):
    """it creeps on the mass of tiny feet under it (the SRD's 10 ft): a rolling shuffle, the cone rocking, the tendrils trailing."""
    t = i / n; P_ = pose(); awake(P_)
    s = math.sin(2 * math.pi * t)
    P_['root'][1] = UP * (0.6 * abs(math.sin(2 * math.pi * t)))
    P_['body'][0] = Q(FRONT, 3.5 * s) @ Q(TILT, 3 + 2 * math.cos(2 * math.pi * t))
    P_['head'][0] = Q(FRONT, -1.5 * s)
    for k in range(6):
        ph = k * 1.1
        dr = [IDLE_DROOP[j] + wave(j, t, ph, 6) for j in range(NB)]
        cu = [IDLE_CURL[j] * 0.6 + wave(j, t, ph + 1.5, 9) for j in range(NB)]
        aim(P_, k, rope(k, dr, cu))
    return P_


LASH_ORDER = [0, 1, 2, 3]                     # the top right, the top left, then the middle pair (SOCK is sorted top first, right first)
LASH_PROG = [0.0, -0.6, 0.35, 1.0, 0.95, 0.55]


def lash_dir(k):
    p, n = SOCK[k]
    return (FRONT * 1.0 + Vector((0.12 * SIDE[k], 0, 0)) + Vector((0, 0, -0.32))).normalized()


def row_lash(m):
    k = LASH_ORDER[m]

    def f(i, n):
        t = i / n; P_ = pose(); awake(P_); p = LASH_PROG[i]
        P_['body'][0] = Q(TILT, 5 * p) @ Q(UP, -4 * SIDE[k] * max(p, 0))
        idle_ropes(P_, t, only=[o for o in range(6) if o != k])
        if p < 0:       # drawn back: reared up and over its own shoulder
            dr = [-14 * -p, -10 * -p, -6 * -p, 4, 6, 8, 10, 12, 12, 12]
            cu = [0, 0, 8 * -p, 10, 10, 8, 6, 4, 2, 0]
            aim(P_, k, rope(k, dr, cu, lift=30 * -p))
        else:           # thrown: the rope pulled onto a line at the one in front, the tip last
            dr = [IDLE_DROOP[j] * (1 - p) for j in range(NB)]
            cu = [IDLE_CURL[j] * (1 - p) for j in range(NB)]
            pull = [min(1.0, p * (1.25 - 0.06 * j)) for j in range(NB)]
            if i == 4:
                pull = [min(1.0, x) * (1 - 0.18 * math.sin(math.pi * j / NB)) for j, x in enumerate(pull)]    # (the crack: a ripple down it)
            aim(P_, k, rope(k, dr, cu, toward=lash_dir(k), pull=pull))
        return P_
    return f


def row_reel(i, n):
    """Reel: the two thrown tendrils haul back in, coiling as they come, the cone rocking back with the weight."""
    p = [1.0, 0.85, 0.6, 0.35, 0.12, 0.0][i]; t = i / n; P_ = pose(); awake(P_)
    P_['body'][0] = Q(TILT, -6 * math.sin(math.pi * (1 - p)))
    idle_ropes(P_, t, only=[2, 3, 4, 5])
    for k in (0, 1):
        dr = [IDLE_DROOP[j] * (1 - p) for j in range(NB)]
        cu = [IDLE_CURL[j] * (1 - p) + 25 * math.sin(math.pi * p) * (j / NB) for j in range(NB)]
        pull = [min(1.0, p * (1.2 - 0.05 * j)) for j in range(NB)]
        aim(P_, k, rope(k, dr, cu, toward=lash_dir(k), pull=pull))
    return P_


def row_bite(i, n):
    """the top half bowed down onto the one in front: the bend is through the maw, so the upper jaw comes down on the lower (drawn back
    first, it gapes)."""
    p = [0.0, -0.5, 0.45, 1.0, 0.8, 0.25][i]; t = i / n; P_ = pose(); awake(P_)
    b = Q(TILT, 5 * max(p, 0)); h = Q(TILT, 26 * p)
    P_['body'][0] = b; P_['head'][0] = h
    for k in range(6):
        par = b @ h if SOCK[k][0].z > ZM else b
        ph = k * 1.3
        dr = [IDLE_DROOP[j] * (1 - 0.4 * max(p, 0)) + wave(j, t, ph, 4) for j in range(NB)]
        cu = [IDLE_CURL[j] * (1 - 0.5 * max(p, 0)) for j in range(NB)]
        aim(P_, k, rope(k, dr, cu, lift=10 * max(p, 0), base=par), base=par)
    return P_


def row_flinch(i, n):
    p = [0.0, 1.0, 0.75, 0.35, 0.0][i]; t = i / n; P_ = pose(); awake(P_)
    b = Q(TILT, -10 * p)
    P_['body'][0] = b; P_['root'][1] = UP * 0.8 * p
    for k in range(6):
        par = b
        dr = [IDLE_DROOP[j] * (1 - 0.6 * p) for j in range(NB)]
        cu = [IDLE_CURL[j] * (1 - 0.3 * p) for j in range(NB)]
        aim(P_, k, rope(k, dr, cu, lift=24 * p, base=par), base=par)
    return P_


def row_death(i, n):
    """the tendrils go slack and fall flat about it, and the cone settles a third of the way into the floor, leaning back; frame 3 (the
    tendrils down, barely sunk) is its prone frame (deep16/js/sprites.js S.PRONE: getting up is the row played back from there).
    (Toppled flat it would lie three squares long, and every row's frame would have to hold it.)"""
    s = [0.0, 0.0, 0.06, 0.14, 0.32, 0.55, 0.8, 1.0][i]          # the settling
    l = [0.0, 0.45, 0.8, 1.0, 1.0, 1.0, 1.0, 1.0][i]             # the slack
    P_ = pose(); awake(P_)
    fall = Q(TILT, -14 * s)                                       # back (the top away from the front)
    P_['root'][0] = fall
    P_['root'][1] = -UP * 0.33 * ZTOP * s                         # (under the holdout floor, deep16-figures.json `floor`)
    for k in range(6):
        dr = [IDLE_DROOP[j] * (1 - l) + 55 * l * (1 if j in (1, 2) else 0.0) for j in range(NB)]     # (straight down from the tube, then slack on the floor)
        cu = [IDLE_CURL[j] * (1 + 0.4 * l) for j in range(NB)]
        aim(P_, k, rope(k, dr, cu, base=fall, off=P_['root'][1]), base=fall)
    return P_


def row_still(i, n):
    """False Appearance: a stalagmite. The living roper (and its tendrils) shrunk to a point inside the shut cone."""
    P_ = pose(); scale_bone(P_, 'wake', 0.001)
    return P_


def row_reveal(i, n):
    """the stalagmite opens its eye and the tendrils come out of it: frame 0 the stalagmite, 1 the eye open (the open body in its place),
    then the tendrils pushed out of their sockets, tight-curled, uncoiling into the idle."""
    P_ = pose()
    if i == 0:
        scale_bone(P_, 'wake', 0.001); return P_
    awake(P_)
    g = [0.04, 0.04, 0.2, 0.45, 0.7, 0.9, 1.0, 1.0][i]          # how far out
    sh_ = [0, 0, 2.0, -1.5, 1.0, -0.5, 0.2, 0][i]
    P_['body'][0] = Q(FRONT, sh_) @ Q(TILT, 0.5 * sh_)
    idle_ropes(P_, i / n, lift=25 * (1 - g))
    for k in range(6):
        scale_bone(P_, 't%d.0' % (k + 1), max(0.001, g))
    return P_


ROWS = [('IDLE', 8, True, row_idle), ('CREEP', 8, True, row_creep),
        ('LASH', 6, False, row_lash(0)), ('LASH2', 6, False, row_lash(1)), ('LASH3', 6, False, row_lash(2)), ('LASH4', 6, False, row_lash(3)),
        ('REEL', 6, False, row_reel), ('BITE', 6, False, row_bite), ('FLINCH', 5, False, row_flinch), ('DEATH', 8, False, row_death),
        ('STILL', 2, False, row_still), ('REVEAL', 8, False, row_reveal)]


def apply_pose(P_):
    for bname, (q, loc, s) in P_.items():
        pb = arm.pose.bones[bname]
        pb.rotation_quaternion = REST[bname].inverted() @ q @ REST[bname]
        pb.location = REST3[bname].inverted() @ loc if loc.length else Vector()
        pb.scale = (s, s, s)


ad = arm.animation_data_create()
for pb in arm.pose.bones:
    pb.rotation_mode = 'QUATERNION'
for name, n, loop, fn in ROWS:
    act = bpy.data.actions.new(name); act.use_fake_user = True; ad.action = act
    for i in range(n + (1 if loop else 0)):
        apply_pose(fn(i % n, n))
        for pb in arm.pose.bones:
            for path in ('rotation_quaternion', 'location', 'scale'):
                pb.keyframe_insert(path, frame=i + 1, group=pb.name)
    act.use_frame_range = True
    act.frame_start, act.frame_end = 1, n + (1 if loop else 0)
    act.use_cyclic = loop
    for fc in getattr(act, 'fcurves', []):
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def use(name):
    act = bpy.data.actions[name]; ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots):
        ad.action_slot = act.slots[0]
    return act


use('IDLE')
print('[roper] rows: %s' % ', '.join(r[0] for r in ROWS))


# ------------------------------------------------------------------ the measure: how far each row reaches, in squares from the foot's centre
def extent(names):
    dg = bpy.context.evaluated_depsgraph_get(); pts = []
    for o in [body, shut] + TENDS:
        oe = o.evaluated_get(dg); me = oe.to_mesh()
        a = np.zeros(len(me.vertices) * 3); me.vertices.foreach_get('co', a); oe.to_mesh_clear()
        a = a.reshape(-1, 3)
        pts.append(a[::7])
    P = np.concatenate(pts)
    P = P[np.linalg.norm(P - np.array([0, 0, 24.0]), axis=1) > 0.5]     # (a shrunk body is a point at the middle)
    return P


SQ = (S[:, 0].max() - S[:, 0].min()) / 1.4     # units per square, when the foot is 1.4 squares across (deep16-figures.json size_squares)
if MODE in ('build', 'measure'):
    for name, n, loop, fn in ROWS:
        use(name); r = 0.0; zt = 0.0
        for i in range(n):
            scene.frame_set(i + 1); P = extent(None)
            r = max(r, float(np.hypot(P[:, 0], P[:, 1]).max())); zt = max(zt, float(P[:, 2].max()))
        print('[roper] reach %-7s %.2f squares out, %.2f high' % (name, r / SQ, zt / SQ))
    use('IDLE'); scene.frame_set(1)


# ------------------------------------------------------------------ look tests and pose sheets
def stand_camera():
    """the sprite camera over the rig scaled so the foot is 1.4 squares across (render-sprites.py's size_squares does this to the rig)."""
    k = 1.4 * BL.UPS / (S[:, 0].max() - S[:, 0].min())
    arm.scale = (k, k, k); bpy.context.view_layer.update()
    R = 2.2 * BL.UPS
    lo, hi = Vector((-R, -R, 0)), Vector((R, R, ZTOP * k * 1.05))
    return BL.sprite_camera(scene, lo, hi)


if MODE in ('look', 'close'):
    cam, FW, FH, AX, AY = stand_camera()
    r = scene.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = FW * BL.SS, FH * BL.SS, 100
    if MODE == 'close':     # (straight at the face, a little from above, as the sprite camera sees it at facing 0... turned to face it)
        k = arm.scale[0]
        cam.rotation_euler = (math.radians(75), 0, 0); cam.location = Vector((0, -200 * k, 46 * k)) + Vector((0, 0, 200 * k * math.tan(math.radians(15))))
        cam.data.ortho_scale = 34 * k; r.resolution_x = r.resolution_y = 800; bpy.context.view_layer.update()
    r.film_transparent = True; r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
    BL.light(scene, cam, PRESET)
    od = os.path.join(SRC, 'look_out', TAG); os.makedirs(od, exist_ok=True)
    shots = [('IDLE', 0, 'f0_00'), ('IDLE', 6, 'f6_00'), ('STILL', 0, 'still_f0')] if MODE == 'look' else [('IDLE', 0, 'f0_00')]
    for row, f, fn in shots:
        use(row); scene.frame_set(1)
        arm.rotation_euler.z = math.radians(45 - 45 * f) if MODE == 'look' else 0.0     # (as render-sprites.py turns a figure to facing f; the face is -Y)
        r.filepath = os.path.join(od, fn + '.png'); bpy.ops.render.render(write_still=True)
    import json
    json.dump({'figure': 'roper', 'tag': TAG, 'ss': BL.SS, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'facings': [0, 6]}, open(os.path.join(od, 'meta.json'), 'w'), indent=1)
    print('[roper] look %s done' % TAG)
    sys.exit(0)

if MODE == 'poses':
    cam, FW, FH, AX, AY = stand_camera()
    r = scene.render; r.engine = 'BLENDER_WORKBENCH'; scene.display.shading.light = 'MATCAP'
    r.resolution_x, r.resolution_y, r.resolution_percentage = FW * 2, FH * 2, 100
    r.film_transparent = True; r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
    od = os.path.join(SRC, 'look_out', TAG); os.makedirs(od, exist_ok=True)
    facings = [int(x) for x in OPT.get('facings', '0,6').split(',')]
    rows = OPT.get('rows', ','.join(r_[0] for r_ in ROWS)).split(',')
    for name, n, loop, fn in ROWS:
        if name not in rows:
            continue
        use(name)
        for f in facings:
            arm.rotation_euler.z = math.radians(45 - 45 * f)
            for i in range(n):
                scene.frame_set(i + 1)
                r.filepath = os.path.join(od, '%s_f%d_%02d.png' % (name, f, i)); bpy.ops.render.render(write_still=True)
    print('[roper] poses %s done' % TAG)
    sys.exit(0)

if MODE == 'build':
    use('IDLE'); scene.frame_set(1)
    os.makedirs(SRC, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SRC, 'roper.blend'))
    print('[roper] built: %s (rows %s; prone frame 3 of DEATH)' % (os.path.join(SRC, 'roper.blend'), ', '.join(r_[0] for r_ in ROWS)))

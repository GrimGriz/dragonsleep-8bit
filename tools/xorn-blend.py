"""The xorn for DEEP16, from MZ4250's printable Xorn (Thingiverse thing:2847683, CC BY 4.0: deep16/CREDITS.md) -- the first monster of
pipeline 1b (a printable model, rigged and posed in Blender, rendered in the toon look: deep16/blender-monsters.md). 10-01d.

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --disable-autoexec --python tools/xorn-blend.py -- build [teeth=white|gem] [eyes=0|1]
    ... -- look <tag> [preset=12|13] [teeth=...] [eyes=...]     a look test: the coloured model unrigged, facings S and E, to deep16/_src/xorn/look_out/<tag>/
    ... -- close <tag> [...]                                     the same, an 800 px close look at the mouth

Reads deep16/_src/xorn/Xorn_Updated.blend (his base mesh, 3,032 faces) and deep16/_src/xorn/mz4250/Xorn_Updated_sculpted.blend (the same
body sculpted, a million triangles), both gitignored: Griz downloads them (Thingiverse wants a login), this script is what the repo keeps.
`build` writes deep16/_src/xorn/xorn.blend for tools/render-sprites.py: ONE parent-less armature, Xorn_Rig, and the mesh Xorn_Body under it.

The look (Griz, 10-01d): of the variants he picked "17" -- light preset 13 (the high key), three gold eyes, white teeth, the pixel pass's lift
on (tools/deep16-figures.json), the grey stone split harder from the brown ("higher contrast on the gray stone in his body compared to the
brown stone in his body") -- "but go back to unpainted mouth please": the throat dark and shaded, as look 13 had it. Options keep the others:
preset=12, eyes=0, teeth=gem (crystal, unshaded), mouth=red.

The skeleton is found, not drawn: slices of the base mesh give three arms (straight up out of the barrel's sides), three legs between them,
and the barrel; the front is between two arms (a leg under it), so the third arm is at the back. The stone is weighted to the bones by
distance over each limb's thickness, nearly rigid: rock does not stretch. The rows are keyed in code, every bone on every frame:
    IDLE 8 (loop)  WALK 8 (loop, a three-legged rotary gait)  CLAW, CLAW2, CLAW3 6 (the front-left arm, the front-right, the back arm
    over the top: the three claws of its Multiattack)  BITE 6 (the top mouth brought down onto the one in front)  SINK 6 and RISE 6
    (Earth Glide: down into the floor and up out of it, cleanly -- "the xorn doesn't disturb the material it moves through")
    FLINCH 5  DEATH 8 (it settles half into the floor, its arms drooping -- Griz's ask; frame 3 is its prone frame).
"""
import bpy, sys, os, math, importlib.util
import numpy as np
from mathutils import Vector, Quaternion, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'deep16', '_src', 'xorn')
spec = importlib.util.spec_from_file_location('blender_look', os.path.join(ROOT, 'tools', 'blender_look.py'))
BL = importlib.util.module_from_spec(spec); spec.loader.exec_module(BL)

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['build']
MODE = ARGS[0]
TAG = ARGS[1] if MODE in ('look', 'close') and len(ARGS) > 1 else 'xorn'
OPT = dict(a.split('=', 1) for a in ARGS if '=' in a)
# the defaults are Griz's pick, "17" (10-01d): light 13 (the high key), the eyes, white teeth, the lift on (deep16-figures.json) -- "17 is the
# winner, but go back to unpainted mouth please": the throat as look 13 had it, dark and shaded (mouth=red is the painted red, unshaded)
PRESET, TEETH, EYES, MOUTH = OPT.get('preset', '13'), OPT.get('teeth', 'white'), OPT.get('eyes', '1') == '1', OPT.get('mouth', 'dark')
AXIS = (0.19, -0.38)           # the barrel's vertical axis in the meshes' local x, y (the mouth bowl's centre)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def load(path, name):
    with bpy.data.libraries.load(path) as (src, dst):
        dst.objects = ['Sphere']
    ob = dst.objects[0]; ob.name = name; scene.collection.objects.link(ob)
    return ob


base = load(os.path.join(SRC, 'Xorn_Updated.blend'), 'Xorn_Base')
body = load(os.path.join(SRC, 'mz4250', 'Xorn_Updated_sculpted.blend'), 'Xorn_Body')
M = body.matrix_world.copy()   # (the base mesh stands at the same place and scale: one local frame for both)
dg = bpy.context.evaluated_depsgraph_get()

# ------------------------------------------------------------------ the sculpt, a million triangles, brought to 300k: plenty at 64 px a square
dec = body.modifiers.new('dec', 'DECIMATE'); dec.ratio = 0.3
dg.update()
me2 = bpy.data.meshes.new_from_object(body.evaluated_get(dg))
body.modifiers.remove(dec); old = body.data; body.data = me2; bpy.data.meshes.remove(old)
me2.name = 'Xorn_Body'
print('[xorn] sculpt decimated: %d verts, %d faces' % (len(me2.vertices), len(me2.polygons)))


def rr(x, y): return math.hypot(x - AXIS[0], y - AXIS[1])


# ------------------------------------------------------------------ colour: Griz's notes (the base mesh's faces, carried onto the sculpt)
def mouth(p):
    c = p.center; r = rr(c.x, c.y)
    if MOUTH != 'red':
        return ('#3a0c14', False) if r < 5.6 and -14 < c.z < 1.0 else None     # (the bowl's floor, dark and shaded: look 13's)
    inward = r > 0.01 and (p.normal.x * (AXIS[0] - c.x) + p.normal.y * (AXIS[1] - c.y)) / r > 0.25
    if (r < 5.6 and c.z < 1.0 and c.z > -14) or (r < 7.5 and -12.0 < c.z < 3.2 and inward):
        t = max(0.0, min(1.0, (c.z + 9.0) / 9.0)); lip, deep = BL.srgb2lin('#d02a38'), BL.srgb2lin('#5c0a16')
        return (tuple(deep[i] * (1 - t) + lip[i] * t for i in range(3)), True)   # red at the lip, darker down the throat; unshaded
    return None


def arm_azimuths(verts):
    """the three arms' azimuths (radians): the vertices above the rim and out past the teeth, clustered round the axis."""
    a = sorted(math.atan2(v.y - AXIS[1], v.x - AXIS[0]) for v in verts if v.z > 4 and rr(v.x, v.y) > 9.5)
    return clusters(a)


def clusters(a, gap=math.radians(35)):
    g, cur = [], [a[0]]
    for x in a[1:]:
        if x - cur[-1] > gap:
            g.append(cur); cur = [x]
        else:
            cur.append(x)
    g.append(cur)
    if len(g) > 1 and (g[0][0] + 2 * math.pi - g[-1][-1]) < gap:
        g[0] = g.pop() + [x + 2 * math.pi for x in g[0]]
    return [math.atan2(math.sin(sum(c) / len(c)), math.cos(sum(c) / len(c))) for c in g]


def eyes(me, col, flat):
    """three gold eye dots between the arms, on the barrel's outward face below the rim (Griz's second pick, 13, had them)."""
    az = sorted(arm_azimuths([v.co for v in me.vertices]))
    ec = BL.srgb2lin('#ffd860')
    for i in range(len(az)):
        m = (az[i] + az[(i + 1) % len(az)] + (2 * math.pi if i + 1 == len(az) else 0)) / 2
        best, bs = None, -1e9
        for p in me.polygons:
            c = p.center; a = math.atan2(c.y - AXIS[1], c.x - AXIS[0]); r = rr(c.x, c.y)
            if abs((a - m + math.pi) % (2 * math.pi) - math.pi) < math.radians(7) and 7 < r < 18 and -9 < c.z < 3:
                s = p.normal.x * math.cos(m) + p.normal.y * math.sin(m) + p.normal.z * 0.4 - abs(c.z + 3) * 0.05
                if s > bs:
                    best, bs = p.index, s
        if best is not None:
            col[best] = ec; flat[best] = True


COLOUR = dict(base='#8a6640', base2='#969aa6', split=2.6, fine=0.12, blotch=0.18, blotch_scale=0.16, seed=7,
              mouth=mouth, gems=['#f2a030', '#e8624a', '#f8d67a', '#5ae08a', '#c090ff', '#3cbcfc'], gem_clusters=40 if EYES else 36,
              gem_ok=lambda p: not (rr(p.center.x, p.center.y) < 6.5 and p.center.z < 3), extra=eyes if EYES else None)
col, flat = BL.paint(base.data, COLOUR)
tree = BL.carry(body, base.data, col, flat)
nt = BL.mark_proud(body, tree, lambda x, y, z: -1.0 < z < 8.0 and rr(x, y) < 9.5,
                   '#bff0ff' if TEETH == 'gem' else '#f2ead8', unshaded=(TEETH == 'gem'), shade=(0.9, 1.05) if TEETH == 'gem' else (0.85, 1.1))
print('[xorn] teeth (%s): %d points' % (TEETH, nt))
BL.toon_material(body, gem_glow=1.15 if EYES else 1.0)

# ------------------------------------------------------------------ the skeleton, found in the base mesh (its subdivided surface)
bev = base.evaluated_get(dg).to_mesh()
V = np.array([v.co[:] for v in bev.vertices]); base.evaluated_get(dg).to_mesh_clear()
VA = np.arctan2(V[:, 1] - AXIS[1], V[:, 0] - AXIS[0]); VR = np.hypot(V[:, 0] - AXIS[0], V[:, 1] - AXIS[1])
ZMIN, ZMAX = float(V[:, 2].min()), float(V[:, 2].max())


def adiff(a, b): return np.abs((a - b + np.pi) % (2 * np.pi) - np.pi)


def centroid(z0, a0, rmin=0.0, half=1.0, sector=math.radians(40)):
    s = (np.abs(V[:, 2] - z0) < half) & (adiff(VA, a0) < sector) & (VR > rmin)
    return Vector(V[s].mean(axis=0))


arms_az = arm_azimuths([Vector(v) for v in V])
legs_az = clusters(sorted(VA[V[:, 2] < -24].tolist()))
assert len(arms_az) == 3 and len(legs_az) == 3, (arms_az, legs_az)
# the front: between the pair of arms whose middle is nearest -Y; the third arm is the back
best = None
for i in range(3):
    a, b = arms_az[i], arms_az[(i + 1) % 3]
    mid = math.atan2(math.sin(a) + math.sin(b), math.cos(a) + math.cos(b))
    d = abs((mid + math.pi / 2 + math.pi) % (2 * math.pi) - math.pi)
    if best is None or d < best[0]:
        best = (d, mid, i)
FRONT_AZ = best[1]
FRONT = Vector((math.cos(FRONT_AZ), math.sin(FRONT_AZ), 0.0)); UP = Vector((0, 0, 1)); RIGHT = FRONT.cross(UP)
YAW = -math.degrees(FRONT_AZ) - 90.0      # turn the model so its front faces -Y, as render-sprites.py expects
YAW = (YAW + 180) % 360 - 180
side = lambda a: 'L' if math.sin(a - FRONT_AZ) > 0 else 'R'
ARMS = {}
for i, a in enumerate(arms_az):
    nm = 'B' if i not in (best[2], (best[2] + 1) % 3) else side(a)
    sec = (adiff(VA, a) < math.radians(40)) & (VR > 9.5)
    top = V[sec & (V[:, 2] > np.percentile(V[sec][:, 2], 98))]
    tip = Vector(top.mean(axis=0))
    p0, p1 = centroid(-2.0, a, 9.0), centroid(5.0, a, 9.0)
    p2 = centroid(min(11.0, (p1.z + tip.z) / 2), a, 9.0)
    ARMS[nm] = (a, [p0, p1, p2, tip])
LEGS = {}
for a in legs_az:
    d = abs((a - FRONT_AZ + math.pi) % (2 * math.pi) - math.pi)
    nm = 'F' if d < math.radians(40) else side(a)
    sec = (adiff(VA, a) < math.radians(40)) & (V[:, 2] < ZMIN + 2.0)
    toe = Vector(V[sec & (VR > np.percentile(VR[sec], 95))].mean(axis=0))
    LEGS[nm] = (a, [centroid(-12.0, a), centroid(-21.0, a), centroid(ZMIN + 3.0, a), toe])
C0 = Vector((AXIS[0], AXIS[1], ZMIN))
BONES = [('root', C0, C0 + Vector((0, 0, 5)), None, 14.0)]
BONES.append(('body', Vector((AXIS[0], AXIS[1], -13.0)), Vector((AXIS[0], AXIS[1], 3.0)), 'root', 14.5))
for nm, (a, p) in ARMS.items():
    BONES += [('arm_%s.1' % nm, p[0], p[1], 'body', 4.2), ('arm_%s.2' % nm, p[1], p[2], 'arm_%s.1' % nm, 3.6), ('arm_%s.3' % nm, p[2], p[3], 'arm_%s.2' % nm, 3.2)]
for nm, (a, p) in LEGS.items():
    BONES += [('leg_%s.1' % nm, p[0], p[1], 'root', 4.4), ('leg_%s.2' % nm, p[1], p[2], 'leg_%s.1' % nm, 3.8), ('leg_%s.3' % nm, p[2], p[3], 'leg_%s.2' % nm, 3.4)]
print('[xorn] front az %.1f deg (yaw %.1f); arms %s; legs %s' % (math.degrees(FRONT_AZ), YAW, {k: round(math.degrees(v[0])) for k, v in ARMS.items()}, {k: round(math.degrees(v[0])) for k, v in LEGS.items()}))
bpy.data.objects.remove(base, do_unlink=True)


# ------------------------------------------------------------------ the look test (no rig): the coloured model standing, S and E
def look_still():
    body.rotation_mode = 'XYZ'
    k = 1.2 * BL.UPS / max(body.dimensions.x, body.dimensions.y)
    body.scale = body.scale * k; bpy.context.view_layer.update()
    pts = [body.matrix_world @ Vector(c) for c in body.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    body.location -= Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z)); bpy.context.view_layer.update()
    pts = [body.matrix_world @ Vector(c) for c in body.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    cam, FW, FH, AX, AY = BL.sprite_camera(scene, lo, hi)
    r = scene.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = FW * BL.SS, FH * BL.SS, 100
    if MODE == 'close':
        mw = body.matrix_world @ Vector((AXIS[0], AXIS[1], 1.0))
        back = cam.matrix_world.to_3x3() @ Vector((0, 0, 1))
        cam.location = mw + back * 40; cam.data.ortho_scale = 1.3; r.resolution_x = r.resolution_y = 800
    r.film_transparent = True; r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
    BL.light(scene, cam, PRESET)
    od = os.path.join(SRC, 'look_out', TAG); os.makedirs(od, exist_ok=True)
    for f in ((0,) if MODE == 'close' else (0, 6)):
        body.rotation_euler.z = math.radians(YAW + 45 - 45 * f)
        r.filepath = os.path.join(od, 'f%d_00.png' % f); bpy.ops.render.render(write_still=True)
    import json
    json.dump({'figure': 'xorn', 'tag': TAG, 'ss': BL.SS, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'facings': [0, 6]}, open(os.path.join(od, 'meta.json'), 'w'), indent=1)
    print('[xorn] look %s done' % TAG)


if MODE in ('look', 'close'):
    look_still()
    sys.exit(0)

# ------------------------------------------------------------------ the armature: in the meshes' own frame (bones in their local units)
arm_data = bpy.data.armatures.new('Xorn_Rig')
arm = bpy.data.objects.new('Xorn_Rig', arm_data)
scene.collection.objects.link(arm); arm.matrix_world = M
bpy.context.view_layer.objects.active = arm; arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for name, h, t, par, rad in BONES:
    eb = arm_data.edit_bones.new(name); eb.head, eb.tail, eb.roll = h, t, 0.0
    if par:
        eb.parent = arm_data.edit_bones[par]
bpy.ops.object.mode_set(mode='OBJECT')
arm_data.display_type = 'STICK'
arm['yaw'] = YAW

# the stone to the bones: distance to each bone's segment over the limb's thickness; the nearest two, nearly rigid
P = np.array([v.co[:] for v in body.data.vertices])
DEF = [b for b in BONES if b[0] != 'root']
dn = np.empty((len(P), len(DEF)))
for j, (name, h, t, par, rad) in enumerate(DEF):
    h, t = np.array(h[:]), np.array(t[:]); s = t - h
    u = np.clip(((P - h) @ s) / (s @ s), 0, 1)
    dn[:, j] = np.linalg.norm(P - (h + u[:, None] * s), axis=1) / rad
order = np.argsort(dn, axis=1)[:, :2]
d1 = np.take_along_axis(dn, order, axis=1)
w = np.exp(-(d1 - d1[:, :1]) / 0.08); w /= w.sum(axis=1, keepdims=True)
for j, (name, *_rest) in enumerate(DEF):
    vg = body.vertex_groups.new(name=name)
    for slot in (0, 1):
        idx = np.where(order[:, slot] == j)[0]
        if not len(idx):
            continue
        q = np.round(w[idx, slot] * 20) / 20
        for val in np.unique(q):
            if val <= 0:
                continue
            vg.add(idx[q == val].tolist(), float(val), 'REPLACE')
body.parent = arm; body.matrix_parent_inverse = Matrix.Identity(4); body.matrix_basis = Matrix.Identity(4)
mod = body.modifiers.new('Armature', 'ARMATURE'); mod.object = arm; mod.use_vertex_groups = True
print('[xorn] rigged: %d bones' % len(BONES))

# ------------------------------------------------------------------ the rows
REST = {b.name: b.matrix_local.to_quaternion() for b in arm_data.bones}
REST3 = {b.name: b.matrix_local.to_3x3() for b in arm_data.bones}
H = ZMAX - ZMIN
RADIAL = {nm: Vector((math.cos(a), math.sin(a), 0.0)) for nm, (a, p) in ARMS.items()}
ARMVEC = {nm: (p[3] - p[0]).normalized() for nm, (a, p) in ARMS.items()}
LEGNAMES = list(LEGS)


def Q(axis, deg):
    ax = Vector(axis)
    return Quaternion(ax.normalized(), math.radians(deg)) if ax.length > 1e-6 and deg else Quaternion()


TILT = UP.cross(FRONT)          # rotating about this brings the top toward the front


def pose():
    return {b[0]: [Quaternion(), Vector()] for b in BONES}


def strike(nm, p):
    """arm nm's swing at the one in front (p: 0 rest, 1 the blow): the whole arm turned toward the front and down, the forearm and claws curling."""
    v0 = ARMVEC[nm]
    d = (FRONT * 1.0 - UP * 0.55 + RADIAL[nm] * 0.25).normalized() if nm != 'B' else (FRONT * 0.6 + UP * 0.55).normalized()
    ax = v0.cross(d); ang = math.degrees(v0.angle(d))
    if nm == 'B':
        ang = min(ang, 70.0)       # the back arm comes over the top, never through the barrel
    return {'arm_%s.1' % nm: Q(ax, ang * p), 'arm_%s.2' % nm: Q(ax, 22 * p), 'arm_%s.3' % nm: Q(ax, 30 * max(p, 0))}


def row_idle(i, n):
    t = i / n; P_ = pose(); s = math.sin(2 * math.pi * t)
    P_['root'][1] = UP * 0.35 * s
    P_['body'][0] = Q(TILT, 1.5 * math.sin(2 * math.pi * t + 0.5))
    for k, nm in enumerate(ARMS):
        ph = 2 * math.pi * t + k * 2.1
        P_['arm_%s.1' % nm][0] = Q(UP.cross(RADIAL[nm]), 4 * math.sin(ph))
        P_['arm_%s.3' % nm][0] = Q(UP.cross(RADIAL[nm]), 10 * math.sin(ph + 1.0))
    return P_


def row_walk(i, n):
    t = i / n; P_ = pose(); fwd = -TILT          # rotating a leg about -TILT swings its foot toward the front
    for j, nm in enumerate(LEGNAMES):
        s = (t - j / 3.0) % 1.0
        if s < 1 / 3:
            u = s * 3; a = -14 + 28 * u; lift = math.sin(math.pi * u)
        else:
            u = (s - 1 / 3) * 1.5; a = 14 - 28 * u; lift = 0.0
        P_['leg_%s.1' % nm][0] = Q(fwd, a + 10 * lift)
        P_['leg_%s.2' % nm][0] = Q(fwd, -28 * lift)
        P_['leg_%s.3' % nm][0] = Q(fwd, 18 * lift)
    P_['root'][1] = UP * 0.45 * math.sin(6 * math.pi * t)
    P_['body'][0] = Q(UP, 3 * math.sin(2 * math.pi * t)) @ Q(TILT, 4)
    for k, nm in enumerate(ARMS):
        P_['arm_%s.1' % nm][0] = Q(UP.cross(RADIAL[nm]), 5 * math.sin(2 * math.pi * t + k * 2.1))
    return P_


def row_claw(nm):
    PROG = [0.0, -0.35, 0.6, 1.0, 0.85, 0.3]
    def f(i, n):
        p = PROG[i]; P_ = pose()
        for b, q in strike(nm, p).items():
            P_[b][0] = q
        tw = 6 if nm == 'L' else -6 if nm == 'R' else 0
        P_['body'][0] = Q(UP, tw * p) @ Q(TILT, 8 * p)
        P_['root'][1] = UP * -0.5 * max(p, 0)
        for o in ARMS:
            if o != nm:
                P_['arm_%s.1' % o][0] = Q(UP.cross(RADIAL[o]), 6 * p)
        return P_
    return f


def row_bite(i, n):
    p = [0.0, 0.3, 0.85, 1.0, 0.6, 0.15][i]; P_ = pose()
    P_['body'][0] = Q(TILT, 38 * p)
    P_['root'][1] = UP * -1.5 * p + FRONT * 1.5 * p
    for nm in ARMS:
        P_['arm_%s.1' % nm][0] = Q(UP.cross(RADIAL[nm]), 14 * p)
    return P_


def row_sink(i, n):
    f = [0.0, 0.12, 0.32, 0.55, 0.8, 1.0][i]; P_ = pose()
    P_['root'][0] = Q(UP, 12 * f); P_['root'][1] = UP * -(H + 4) * f
    for nm in ARMS:
        P_['arm_%s.1' % nm][0] = Q(UP.cross(RADIAL[nm]), -8 * f)
    return P_


def row_rise(i, n):
    f = [1.0, 0.75, 0.45, 0.18, -0.03, 0.0][i]; P_ = pose()
    P_['root'][0] = Q(UP, 10 * f); P_['root'][1] = UP * -(H + 4) * f
    flare = [0, 0, 0.4, 1.0, 0.7, 0.2][i]
    for nm in ARMS:
        P_['arm_%s.1' % nm][0] = Q(UP.cross(RADIAL[nm]), 12 * flare)
    return P_


def row_flinch(i, n):
    p = [0.0, 1.0, 0.75, 0.35, 0.0][i]; P_ = pose()
    P_['body'][0] = Q(TILT, -12 * p); P_['root'][1] = UP * 0.6 * p
    for nm in ARMS:
        P_['arm_%s.1' % nm][0] = Q(UP.cross(RADIAL[nm]), 12 * p)
    return P_


def row_death(i, n):
    """Griz, 10-01d: "For the death pose can we have him submerge half way and his arms droop?" -- it settles half into the stone it came
    out of, the three arms falling outward and down, the barrel slumping forward; frame 3, a third of the way in and the arms half down,
    is its prone frame (deep16/js/sprites.js S.PRONE: getting up is the row played back from there)."""
    s = [0.0, 0.06, 0.15, 0.26, 0.36, 0.44, 0.49, 0.5][i]
    d = [0.0, 0.15, 0.35, 0.55, 0.75, 0.9, 1.0, 1.0][i]
    P_ = pose()
    P_['root'][1] = UP * (-H * s)
    P_['body'][0] = Q(TILT, 10 * d)
    for nm in ARMS:
        out = UP.cross(RADIAL[nm])          # turning about this takes the arm from straight up toward its own side
        P_['arm_%s.1' % nm][0] = Q(out, 105 * d)
        P_['arm_%s.2' % nm][0] = Q(out, 25 * d)
        P_['arm_%s.3' % nm][0] = Q(out, 35 * d)
    return P_


def row_prone(i, n):
    """knocked flat (10-02, Griz: "I had the instance replace the death with a new one. The old one might be a good prone if 3 is no good"):
    the first death (491368a), going over backwards onto its back, is now its fall -- the death it has, half into the floor, read as its
    Earth Glide, not as down. It lies on its back with its legs working at the last frame (deep16/js/sprites.js S.proneRow: getting up is
    the row played back from there). Lifted onto its back and drawn forward as it goes over, as the first death was, so it stays on its square."""
    th = [0, 10, 28, 52, 74, 86][i]; P_ = pose()
    sn = math.sin(math.radians(th))
    P_['root'][0] = Q(RIGHT, th)                    # the top goes over backwards
    P_['root'][1] = UP * (14.0 * sn) + FRONT * (27.0 * sn)
    kick = [0, 0.2, 0.5, 0.8, 1.0, 1.0][i]
    for k, nm in enumerate(LEGNAMES):
        P_['leg_%s.1' % nm][0] = Q(-TILT, 15 * kick + (8 if k % 2 else -8) * kick)    # (the legs working, out of step)
    for nm in ARMS:
        P_['arm_%s.1' % nm][0] = Q(UP.cross(RADIAL[nm]), 20 * min(1.0, i / 4))
    return P_


ROWS = [('IDLE', 8, True, row_idle), ('WALK', 8, True, row_walk), ('CLAW', 6, False, row_claw('L')), ('CLAW2', 6, False, row_claw('R')),
        ('CLAW3', 6, False, row_claw('B')), ('BITE', 6, False, row_bite), ('SINK', 6, False, row_sink), ('RISE', 6, False, row_rise),
        ('FLINCH', 5, False, row_flinch), ('DEATH', 8, False, row_death), ('PRONE', 6, False, row_prone)]
ad = arm.animation_data_create()
for pb in arm.pose.bones:
    pb.rotation_mode = 'QUATERNION'
for name, n, loop, fn in ROWS:
    act = bpy.data.actions.new(name); act.use_fake_user = True; ad.action = act
    for i in range(n + (1 if loop else 0)):
        P_ = fn(i % n, n)
        for bname, (q, loc) in P_.items():
            pb = arm.pose.bones[bname]
            pb.rotation_quaternion = REST[bname].inverted() @ q @ REST[bname]     # (an armature-frame turn about the bone's head)
            pb.location = REST3[bname].inverted() @ loc if loc.length else Vector()
            pb.keyframe_insert('rotation_quaternion', frame=i + 1, group=bname)
            pb.keyframe_insert('location', frame=i + 1, group=bname)
    act.use_frame_range = True
    act.frame_start, act.frame_end = 1, n + (1 if loop else 0)
    act.use_cyclic = loop
    for fc in getattr(act, 'fcurves', []):
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
ad.action = bpy.data.actions['IDLE']
if hasattr(ad, 'action_slot') and len(bpy.data.actions['IDLE'].slots):
    ad.action_slot = bpy.data.actions['IDLE'].slots[0]
os.makedirs(SRC, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SRC, 'xorn.blend'))
print('[xorn] built: %s (rows %s; yaw %.1f; prone frame 3 of DEATH)' % (os.path.join(SRC, 'xorn.blend'), ', '.join(r[0] for r in ROWS), YAW))

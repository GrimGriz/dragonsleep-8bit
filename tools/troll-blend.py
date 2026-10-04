"""The troll for DEEP16, from MZ4250's printable Troll Updated (Thingiverse thing:4134313, CC BY: deep16/CREDITS.md) -- pipeline 1b's fourth,
on the artist's own rig again (the grick's way: deep16/blender-monsters.md). 10-04.

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --disable-autoexec --python tools/troll-blend.py -- build [hide=green|grey]
    ... -- look <tag> [preset=13] [hide=...]        a look test: its idle, facings S and E, to deep16/_src/troll/look_out/<tag>/
    ... -- close <tag> [...]                         the same, an 800 px close look at the head
    ... -- poses <tag> [rows=IDLE,WALK] [facings=0,6]   matcap frames of the rows, to check the motion
    ... -- measure                                   how far each row reaches and how low it goes

Reads deep16/_src/troll/mz4250/files/ (gitignored: Griz downloads them, Thingiverse wants a login): Troll_Updated_posed.blend, the sculpt
on the artist's rig (65 bones and their weights: a spine, two arms with five-fingered hands, a neck and jaw, two legs with toes) in the
miniature's pose -- a wide lunge, the reaching arm out in front, the mouth open. `build` writes deep16/_src/troll/troll.blend for
tools/render-sprites.py.

The rows are bends on top of the artist's own pose, keyed in code, every bone on every frame (each bend in the pose's frame, carried by
the bones above it: a turn at the shoulder takes the hand with it). The pose faces -Y; +X turns the front DOWN (a lean forward, a blow coming
down), - raises it:
    IDLE 8 (loop)  WALK 8 (loop)  CLAW 6 (the reaching arm)  CLAW2 6 (the other)  BITE 6  FLINCH 5  DEATH 8 (it buckles and falls on its face)
    PRONE 6 (knocked over on its back; lies at its last frame, gets up by the row played backwards)
"""
import bpy, sys, os, math, importlib.util, json
import numpy as np
from mathutils import Vector, Quaternion, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'deep16', '_src', 'troll')
FILES = os.path.join(SRC, 'mz4250', 'files')
spec = importlib.util.spec_from_file_location('blender_look', os.path.join(ROOT, 'tools', 'blender_look.py'))
BL = importlib.util.module_from_spec(spec); spec.loader.exec_module(BL)

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['build']
MODE = ARGS[0]
TAG = ARGS[1] if MODE in ('look', 'close', 'poses') and len(ARGS) > 1 else 'troll'
OPT = dict(a.split('=', 1) for a in ARGS if '=' in a)
PRESET, HIDE = OPT.get('preset', '13'), OPT.get('hide', 'green')
FOOT_D = 50.49                 # the print base, 'Large Creature': 50 mm, two 5-ft squares -- the troll's footprint (Large)
SQ_H = 2.0                     # squares of footprint

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
with bpy.data.libraries.load(os.path.join(FILES, 'Troll_Updated_posed.blend')) as (src, dst):
    dst.objects = ['Armature', 'Body.001', 'Large Creature']
for o in dst.objects:
    scene.collection.objects.link(o)
arm, body, printbase = dst.objects
arm.name = arm.data.name = 'Troll_Rig'; body.name = 'Troll_Body'
for o in (arm, body):
    o.hide_set(False); o.hide_viewport = False; o.hide_render = False
bpy.context.view_layer.update()

# ------------------------------------------------------------------ the rig re-origined on its foot: armature space = world axes, (0, 0, 0)
# the middle of the print base (the grick's way: render-sprites.py turns a figure for each facing about the armature's origin)
O = Vector((printbase.matrix_world.translation.x, printbase.matrix_world.translation.y, 0.0))
A0, B0 = arm.matrix_world.copy(), body.matrix_world.copy()
bpy.context.view_layer.objects.active = arm; arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
X = Matrix.Translation(-O) @ A0
MS = {eb.name: X @ eb.matrix for eb in arm.data.edit_bones}
for eb in arm.data.edit_bones:
    eb.matrix = MS[eb.name]
bpy.ops.object.mode_set(mode='OBJECT')
arm.matrix_world = Matrix.Translation(O); bpy.context.view_layer.update()
body.parent_type = 'OBJECT'
body.matrix_parent_inverse = arm.matrix_world.inverted() @ B0 @ body.matrix_basis.inverted()
bpy.data.objects.remove(printbase, do_unlink=True)
# the deform: an Armature modifier ahead of the Subsurf (the file had it as an armature parent)
amod = body.modifiers.new('Armature', 'ARMATURE'); amod.object = arm
body.modifiers.move(len(body.modifiers) - 1, 0)
for m in body.modifiers:
    if m.type == 'SUBSURF':
        m.levels = 1; m.render_levels = 1
bpy.context.view_layer.update()

# ------------------------------------------------------------------ the bones
BN = arm.data.bones
SPINE = ['Bone', 'Bone.002', 'Bone.001', 'Bone.003']          # hip up to the chest
NECK = ['Bone.018', 'Bone.043']; HEAD = 'Bone.020'; JAW = 'Bone.019'
ARM_A = ['Bone.016', 'Bone.044', 'Bone.045', 'Bone.046']       # shoulder, upper arm, forearm, hand (+X side: the reaching arm)
ARM_B = ['Bone.017', 'Bone.022', 'Bone.023', 'Bone.024']       # the -X side
LEG_A = ['Bone.004', 'Bone.006', 'Bone.008', 'Bone.010', 'Bone.012', 'Bone.014']     # hip, thigh, calf, foot, toes
LEG_B = ['Bone.005', 'Bone.007', 'Bone.009', 'Bone.011', 'Bone.013', 'Bone.015']
FING_A = ['Bone.062', 'Bone.059', 'Bone.056', 'Bone.053', 'Bone.050']      # the first bone of each finger
FING_B = ['Bone.025', 'Bone.029', 'Bone.033', 'Bone.037', 'Bone.040']
ROOTS = ['Bone', 'Bone.004', 'Bone.005']                        # all three start at the hip


def chain(name):
    out = [name]
    while BN[out[-1]].children:
        out.append(BN[out[-1]].children[0].name)
    return out


TIPS = [chain(f)[-1] for f in FING_A + FING_B] + ['Bone.014', 'Bone.015']

REST = {b.name: b.matrix_local.copy() for b in BN}
for pb in arm.pose.bones:
    pb.rotation_mode = 'QUATERNION'
POSE0 = {pb.name: pb.matrix.copy() for pb in arm.pose.bones}
ORDER = []


def topo(b):
    ORDER.append(b.name)
    for c in b.children:
        topo(c)


for b in BN:
    if b.parent is None:
        topo(b)

PX = Vector((1, 0, 0)); PZ = Vector((0, 0, 1))


def Q(axis, deg):
    ax = Vector(axis)
    return Quaternion(ax.normalized(), math.radians(deg)) if ax.length > 1e-6 and deg else Quaternion()


# ------------------------------------------------------------------ a pose: its parameters -> a bend per bone -> each bone's basis
def bends(P):
    """P (degrees; the pose's frame, +X leans the front down). body: the whole skeleton about the hip (pitch; -90 over on its back);
    lean/twist: the spine (pitch about X, yaw about Z), spread over its bones; head/hyaw: neck and head; jaw: + opens; per side s in a, b:
    sw (the upper arm's swing about X; + down), out (about Z), el (the forearm), wr (the hand), th (the thigh: + takes the leg back), kn (the
    calf: + bends the knee, the foot back), ft (the foot), fing (the fingers: + curls them)."""
    d = {}
    def add(n, q):
        d[n] = q @ d.get(n, Quaternion())
    for r in ROOTS:
        add(r, Q(PX, P.get('body', 0)))
        add(r, Q(PZ, P.get('bodyyaw', 0)))
    for n in SPINE:
        add(n, Q(PX, P.get('lean', 0) / len(SPINE))); add(n, Q(PZ, P.get('twist', 0) / len(SPINE)))
    for n in NECK:
        add(n, Q(PX, P.get('head', 0) / 3)); add(n, Q(PZ, P.get('hyaw', 0) / 3))
    add(HEAD, Q(PX, P.get('head', 0) / 3)); add(HEAD, Q(PZ, P.get('hyaw', 0) / 3))
    add(JAW, Q(PX, P.get('jaw', 0)))
    for s, A, L, F in (('a', ARM_A, LEG_A, FING_A), ('b', ARM_B, LEG_B, FING_B)):
        add(A[0], Q(PX, P.get('shr' + s, 0)))
        add(A[1], Q(PX, P.get('sw' + s, 0))); add(A[1], Q(PZ, P.get('out' + s, 0)))
        add(A[2], Q(PX, P.get('el' + s, 0))); add(A[2], Q(PZ, P.get('elz' + s, 0)))
        add(A[3], Q(PX, P.get('wr' + s, 0)))
        for f in F:
            for j, n in enumerate(chain(f)):
                add(n, Q(PX, P.get('fing' + s, 0)))
        add(L[1], Q(PX, P.get('th' + s, 0))); add(L[1], Q(PZ, P.get('thz' + s, 0)))
        add(L[2], Q(PX, P.get('kn' + s, 0)))
        add(L[3], Q(PX, P.get('ft' + s, 0)))
    return d


def solve(d, lift=0.0):
    """each bone's basis for bends d: its posed rotation is (the bends of every bone above it and its own, in the pose's frame) x the
    artist's; its head where its parent now carries it; the roots (all three at the hip) lifted together."""
    G, M, out = {}, {}, {}
    for n in ORDER:
        b = BN[n]; p = b.parent.name if b.parent else None
        g = (G[p] if p else Quaternion()) @ d.get(n, Quaternion()); G[n] = g
        R = g.to_matrix() @ POSE0[n].to_3x3()
        if p:
            C = M[p] @ REST[p].inverted() @ REST[n]; head = C.translation
        else:
            C = REST[n]; head = POSE0[n].translation + Vector((0, 0, lift))
        M[n] = Matrix.Translation(head) @ R.to_4x4()
        out[n] = C.inverted() @ M[n]
    return out


def apply(P):
    for n, m in solve(bends(P), P.get('lift', 0.0)).items():
        loc, rot, sc = m.decompose()
        pb = arm.pose.bones[n]; pb.rotation_quaternion = rot; pb.location = loc


def mix(a, b, f):
    return {k: a.get(k, 0) * (1 - f) + b.get(k, 0) * f for k in set(a) | set(b)}


S = math.sin; TAU = 2 * math.pi


def posed_points(step=5):
    dg = bpy.context.evaluated_depsgraph_get(); oe = body.evaluated_get(dg); me = oe.to_mesh()
    a = np.zeros(len(me.vertices) * 3); me.vertices.foreach_get('co', a); oe.to_mesh_clear()
    M = np.array(oe.matrix_world); a = a.reshape(-1, 3)[::step]
    return a @ M[:3, :3].T + M[:3, 3]



def lowest(step=4):
    bpy.context.view_layer.update()
    return float(posed_points(step)[:, 2].min())


apply({}); FLOOR = lowest(1)     # its lowest point standing (the pose as the artist left it, the idle's first frame bar the bob): the ground
print('[troll] the ground (its lowest point in the pose) at z %.2f' % FLOOR)


def grounded(P, how):
    """seat a frame on the ground: 'plant' -- the lowest point lands on it (a step, a swing: the body rides on its feet); 'clamp' -- never
    below it (a bob, a fall: the frame keeps the lift it asked for)."""
    apply(P); lo = lowest()
    if how == 'plant' or lo < FLOOR:
        P = dict(P, lift=P.get('lift', 0.0) + FLOOR - lo); apply(P)
    return P

# ------------------------------------------------------------------ the rows
def row_idle(i, n):
    t = i / n
    return dict(lean=2.5 * S(TAU * t), head=-2 * S(TAU * t + 0.6), hyaw=3 * S(TAU * t + 1.0), jaw=float(OPT.get('idlejaw', -18)) + 2 * S(TAU * t + 0.5),
                swa=3 * S(TAU * t + 0.4), swb=-3 * S(TAU * t + 0.4), fingb=4 * S(TAU * t),
                lift=0.55 * (1 - math.cos(TAU * t))), 0       # (the bob rises from the first frame: the render seats it on that one)


def row_walk(i, n):
    """a long-legged lope: the thighs swing against each other, the knee bends as a leg comes through, the arms swing across, the body bobs
    twice a cycle and sways."""
    t = i / n; w = TAU * t
    A = float(OPT.get('stride', 24))
    ka = max(0.0, S(w + math.pi / 2)); kb = max(0.0, S(w + math.pi / 2 + math.pi))
    return dict(tha=A * S(w), thb=-A * S(w), kna=22 * ka + 4, knb=22 * kb + 4, fta=-10 * ka, ftb=-10 * kb,
                swa=-14 * S(w), swb=14 * S(w), twist=5 * S(w), lean=3, bodyyaw=0, hyaw=-3 * S(w), jaw=-16,
                lift=0.9 * abs(S(w))), 0


def row_claw(side):
    def f(i, n):
        """arm up and back, then down and across: A is the reaching arm. The body leans into it."""
        p = [0.0, -0.8, -1.0, 0.9, 0.45, 0.1][i]; k = 'a' if side == 'a' else 'b'
        sign = 1 if side == 'a' else -1
        up = max(0.0, -p); dn = max(0.0, p)
        P = {'lean': 14 * dn - 8 * up, 'twist': sign * (8 * up - 16 * dn) * -1, 'jaw': -6 + 22 * dn,
             'sw' + k: -62 * up + 40 * dn, 'el' + k: -30 * up + 18 * dn, 'out' + k: sign * (-16 * up + 22 * dn), 'fing' + k: -10 * up + 12 * dn,
             'tha': 8 * dn, 'thb': -6 * dn, 'lift': 0.4 * dn}
        return P, 0
    return f


def row_bite(i, n):
    p = [0.0, -0.5, -1.0, 1.0, 0.6, 0.15][i]; up = max(0.0, -p); dn = max(0.0, p)
    return dict(lean=-8 * up + 20 * dn, head=-12 * up + 12 * dn, jaw=-4 + 45 * up - 42 * dn + (-8) * (1 - dn) * 0, swa=-10 * dn, swb=-10 * dn,
                lift=-0.3 * dn), 0


def row_flinch(i, n):
    p = [0.0, 1.0, 0.7, 0.35, 0.0][i]
    return dict(lean=-18 * p, head=-12 * p, jaw=14 * p, swa=-26 * p, swb=-26 * p, twist=8 * p, tha=-6 * p, thb=-10 * p, lift=0.4 * p), 0


def row_prone(i, n):
    """knocked over on its back: the whole skeleton over about the hip, backward, the knees up, the arms flung wide; lies at its last frame
    (the grid falls through the row, lies at its last frame, and gets up by playing it backwards)."""
    f = [0.0, 0.25, 0.55, 0.85, 1.0, 1.0][i]; e = min(1.0, f * 1.15)
    return dict(body=-float(OPT.get('fall', 78)) * f, lift=-float(OPT.get('drop', 22)) * f, lean=-10 * f, head=-14 * f, jaw=-10 + 10 * f,
                swa=-40 * f, swb=-40 * f, outa=-40 * f, outb=40 * f, tha=-30 * f, thb=-22 * f, kna=40 * f, knb=32 * f), 0


def row_death(i, n):
    """buckles at the knees, then pitches forward onto its face, the arms out and the jaw slack (its death: prone is the other way, on its back)."""
    f = [0.0, 0.18, 0.4, 0.7, 0.92, 1.0, 1.0, 1.0][i]; k = [0.0, 0.5, 1.0, 1.0, 0.8, 0.6, 0.6, 0.6][i]
    return dict(body=float(OPT.get('dfall', 80)) * f, lift=-float(OPT.get('ddrop', 20)) * f, lean=8 * f, head=-30 * f, jaw=-8 + 12 * f,
                tha=-28 * k, thb=-20 * k, kna=44 * k, knb=36 * k, swa=-50 * f, swb=-50 * f, outa=30 * f, outb=-30 * f, ela=-20 * f, elb=-20 * f), 0


ROWS = [('IDLE', 8, True, row_idle, 'clamp'), ('WALK', 8, True, row_walk, 'plant'), ('CLAW', 6, False, row_claw('a'), 'plant'), ('CLAW2', 6, False, row_claw('b'), 'plant'),
        ('BITE', 6, False, row_bite, 'plant'), ('FLINCH', 5, False, row_flinch, 'clamp'), ('DEATH', 8, False, row_death, 'clamp'), ('PRONE', 6, False, row_prone, 'clamp')]
ad = arm.animation_data_create()
for name, n, loop, fn, how in ROWS:
    act = bpy.data.actions.new(name); act.use_fake_user = True; ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots):
        ad.action_slot = act.slots[0]
    for i in range(n + (1 if loop else 0)):
        P, t = fn(i % n, n); grounded(P, how)
        for pb in arm.pose.bones:
            pb.keyframe_insert('rotation_quaternion', frame=i + 1, group=pb.name)
            pb.keyframe_insert('location', frame=i + 1, group=pb.name)
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


use('IDLE'); scene.frame_set(1)
print('[troll] rows: %s' % ', '.join(r[0] for r in ROWS))


if MODE == 'measure':
    for name, n, loop, fn, how in ROWS:
        use(name); r = 0.0; zt = 0.0; zl = 1e9
        for i in range(n):
            scene.frame_set(i + 1); P = posed_points()
            r = max(r, float(np.hypot(P[:, 0], P[:, 1]).max())); zt = max(zt, float(P[:, 2].max())); zl = min(zl, float(P[:, 2].min()))
        print('[troll] reach %-6s %.2f squares out, %.2f high, lowest %+.2f units from the ground' % (name, r / (FOOT_D / SQ_H), (zt - FLOOR) / (FOOT_D / SQ_H), zl - FLOOR))
    sys.exit(0)

# ------------------------------------------------------------------ colour: painted onto the points, by the rig's own groups (at rest)
bpy.context.view_layer.update()
me = body.data; nv = len(me.vertices)
co = np.zeros(nv * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
nr = np.zeros(nv * 3); me.vertices.foreach_get('normal', nr); nr = nr.reshape(-1, 3)
TA = np.array(arm.matrix_world.inverted() @ body.matrix_world)
PA = co @ TA[:3, :3].T + TA[:3, 3]
gname = [g.name for g in body.vertex_groups]
W = {}
for v in me.vertices:
    for ge in v.groups:
        W.setdefault(gname[ge.group], {})[v.index] = ge.weight


def wsum(names):
    w = np.zeros(nv)
    for n in names:
        for i, x in W.get(n, {}).items():
            w[i] += x
    return w


HIDES = {    # (the hide, a second blotched in): the wanted list's "rubbery green hide"; a grey-green and a slate for the cave
    'green': ('#5f7d4c', '#44603a'),
    'grey': ('#6f7c68', '#4f5c4c'),
}
HB, H2 = HIDES[HIDE]
col, unsh = BL.paint_points(PA, dict(base=HB, base2=H2, split=1.4, fine=0.08, blotch=0.16, blotch_scale=0.10, seed=11))
lin = lambda h: np.array(BL.srgb2lin(h))
# the claws: each finger's and toe's last bone, bone-pale toward the tip
BONEC = lin('#e6dcc0')
for tname in TIPS:
    h = np.array(BN[tname].head_local[:]); t_ = np.array(BN[tname].tail_local[:]); s_ = t_ - h
    u = ((PA - h) @ s_) / (s_ @ s_)
    toe = tname in ('Bone.014', 'Bone.015')       # (a toe bone is the whole foot's end: only its tips are claws)
    hk = (wsum([tname]) > 0.5) & (u > (0.7 if toe else 0.0))
    k = np.clip((u - 0.7) / 0.3 if toe else (u + 0.2) / 0.8, 0, 1)[:, None]
    col[hk] = col[hk] * (1 - k[hk]) + BONEC[None, :] * k[hk]
# the jaw: the lower jaw's points pale at the tooth line, the mouth's inside dark red
jw = wsum([JAW])
col[jw > 0.6] = col[jw > 0.6] * 0.8 + lin('#5c1a22')[None, :] * 0.2
print('[troll] hide %s: %d jaw points, %d claw-tip bones' % (HIDE, int((jw > 0.6).sum()), len(TIPS)))
BL.write_points(body, np.maximum(col, 0), unsh)
BL.toon_material(body)

# the footprint: a disc the size of the print base (two squares), round the foot's middle, at the ground -- render-sprites.py sizes and
# seats it by this (size_by), not by an arm reaching out over it
k = 32; rr = FOOT_D / 2
fme = bpy.data.meshes.new('Troll_Foot'); fme.from_pydata([(rr * math.cos(TAU * i / k), rr * math.sin(TAU * i / k), FLOOR) for i in range(k)], [], [tuple(range(k))])
foot = bpy.data.objects.new('Troll_Foot', fme); scene.collection.objects.link(foot)
foot.parent = arm; foot.matrix_parent_inverse = Matrix.Identity(4); foot.hide_render = True


# ------------------------------------------------------------------ look tests and pose sheets
def stand_camera():
    k = BL.UPS * SQ_H / FOOT_D
    arm.scale = (k, k, k); arm.location = (0, 0, -FLOOR * k); bpy.context.view_layer.update()
    R = 1.3 * BL.UPS * SQ_H
    lo, hi = Vector((-R, -R, 0)), Vector((R, R, 66 * k))
    return BL.sprite_camera(scene, lo, hi)


if MODE in ('look', 'close', 'poses'):
    cam, FW, FH, AX, AY = stand_camera()
    r = scene.render
    od = os.path.join(SRC, 'look_out', TAG); os.makedirs(od, exist_ok=True)
    r.film_transparent = True; r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
    if MODE == 'poses':
        r.engine = 'BLENDER_WORKBENCH'; scene.display.shading.light = 'MATCAP'
        r.resolution_x, r.resolution_y, r.resolution_percentage = FW * 2, FH * 2, 100
        facings = [int(x) for x in OPT.get('facings', '0,6').split(',')]
        rows = OPT.get('rows', ','.join(r_[0] for r_ in ROWS)).split(',')
        for name, n, loop, fn, how in ROWS:
            if name not in rows:
                continue
            use(name)
            for f in facings:
                arm.rotation_euler.z = math.radians(45 - 45 * f)
                for i in range(n):
                    scene.frame_set(i + 1)
                    r.filepath = os.path.join(od, '%s_f%d_%02d.png' % (name, f, i)); bpy.ops.render.render(write_still=True)
        json.dump({'fw': FW * 2, 'fh': FH * 2, 'rows': [[r_[0], r_[1]] for r_ in ROWS if r_[0] in rows], 'facings': facings}, open(os.path.join(od, 'poses.json'), 'w'))
        print('[troll] poses %s done' % TAG)
        sys.exit(0)
    r.resolution_x, r.resolution_y, r.resolution_percentage = FW * BL.SS, FH * BL.SS, 100
    if MODE == 'close':
        arm.rotation_euler.z = math.radians(45); bpy.context.view_layer.update()
        kk = arm.scale[0]; hc = arm.matrix_world @ POSE0[HEAD].translation
        back = cam.matrix_world.to_3x3() @ Vector((0, 0, 1))
        cam.location = hc + back * 40; cam.data.ortho_scale = 22 * kk; r.resolution_x = r.resolution_y = 800
    BL.light(scene, cam, PRESET)
    shots = [('IDLE', 0, 'f0_00'), ('IDLE', 6, 'f6_00')] if MODE == 'look' else [('IDLE', 0, 'f0_00')]
    for row, f, fn in shots:
        use(row); scene.frame_set(1)
        arm.rotation_euler.z = math.radians(45 - 45 * f)
        r.filepath = os.path.join(od, fn + '.png'); bpy.ops.render.render(write_still=True)
    json.dump({'figure': 'troll', 'tag': TAG, 'ss': BL.SS, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'facings': [0, 6]}, open(os.path.join(od, 'meta.json'), 'w'), indent=1)
    print('[troll] look %s done' % TAG)
    sys.exit(0)

if MODE == 'build':
    use('IDLE'); scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SRC, 'troll.blend'))
    print('[troll] built: %s (rows %s)' % (os.path.join(SRC, 'troll.blend'), ', '.join(r_[0] for r_ in ROWS)))

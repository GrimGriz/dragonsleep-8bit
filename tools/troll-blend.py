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
TAG = ARGS[1] if MODE in ('look', 'close', 'poses', 'diag') and len(ARGS) > 1 else 'troll'
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

PX = Vector((1, 0, 0)); PZ = Vector((0, 0, 1)); PY = Vector((0, 1, 0))


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
        add(n, Q(PX, P.get('head', 0) / 3)); add(n, Q(PZ, P.get('hyaw', 0) / 3)); add(n, Q(PY, P.get('hroll', 0) / 3))
    add(HEAD, Q(PX, P.get('head', 0) / 3)); add(HEAD, Q(PZ, P.get('hyaw', 0) / 3)); add(HEAD, Q(PY, P.get('hroll', 0) / 3))
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


def accG(d, name):
    """the turn the bones above `name` (and it) have taken, in the pose's frame."""
    chainup = []
    b = BN[name]
    while b:
        chainup.append(b.name); b = b.parent
    G = Quaternion()
    for n in reversed(chainup):
        G = G @ d.get(n, Quaternion())
    return G


def aim(d, names, targets, f=1.0):
    """gravity and the floor (10-04, Griz: "use gravity for the prone and death positions ... make the arms droop down"): turn each bone of a
    chain to point at its target direction in the world (the minimal turn from where the artist's pose points it, through what its parents
    already took), `f` of the way (0 leaves it, 1 lays it there). The bends of the chain's own bones are replaced; its children follow."""
    first = BN[names[0]].parent
    G = accG(d, first.name) if first else Quaternion()
    for n, T in zip(names, targets):
        pd = (POSE0[n] @ Vector((0, BN[n].length, 0)) - POSE0[n].translation).normalized()
        dq = pd.rotation_difference(G.inverted() @ Vector(T).normalized())
        dq = Quaternion().slerp(dq, f)
        d[n] = dq; G = G @ dq


def solve(d, lift=0.0, shift=0.0):
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
            C = REST[n]; head = POSE0[n].translation + Vector((0, shift, lift))
        M[n] = Matrix.Translation(head) @ R.to_4x4()
        out[n] = C.inverted() @ M[n]
    return out


LIE = {   # where each limb chain points when it lies on the floor, by what the body is doing: ('back': over on its back, head toward +Y; 'face': on its face, head toward -Y)
    'back': dict(arm=[(0.55, 0.55, -0.12), (0.8, 0.3, -0.12), (0.85, 0.1, -0.1)], leg=[(0.22, -0.95, -0.12), (0.2, -0.97, -0.1), (0.1, -0.7, -0.5), (0.0, -0.4, -0.9), (0.0, -0.4, -0.9)]),
    'face': dict(arm=[(0.6, -0.65, -0.15), (0.85, -0.45, -0.12), (0.85, -0.45, -0.1)], leg=[(0.2, 0.95, -0.1), (0.15, 0.98, -0.1), (0.1, 0.5, -0.6), (0.0, 0.4, -0.9), (0.0, 0.4, -0.9)]),
}


def lie(d, kind, side, f):
    """lay both arms and both legs on the floor as `kind` says (aim(): each bone toward its target), `f` of the way; the hands' fingers follow their wrist."""
    spec = LIE[kind]
    for s, A, L in ((1, ARM_A, LEG_A), (-1, ARM_B, LEG_B)):
        mir = lambda v: (v[0] * s * side, v[1], v[2])
        aim(d, A[1:3], [mir(v) for v in spec['arm'][:2]], f)
        aim(d, L[1:4], [mir(v) for v in spec['leg'][:3]], f)


def apply(P):
    d = bends(P)
    if P.get('armsdown'):      # the arms hang by the legs: pulled back along the sides
        for s, A in ((1, ARM_A), (-1, ARM_B)):
            aim(d, A[1:3], [(s * 0.22, 0.30, -0.93), (s * 0.15, 0.10, -1.0)], P['armsdown'])
    if P.get('tuck'):          # the cat's loaf: the arms folded under the chest, the legs under the hips
        for s, A, L in ((1, ARM_A, LEG_A), (-1, ARM_B, LEG_B)):
            aim(d, A[1:3], [(s * 0.35, 0.1, -0.93), (s * -0.35, 0.75, -0.3)], P['tuck'])
            aim(d, L[1:4], [(s * 0.75, -0.55, -0.35), (s * -0.3, 0.9, -0.2), (s * -0.1, 0.4, -0.9)], P['tuck'])
    if P.get('lie'):
        lie(d, P['lie'], P['lieside'], P.get('liefall', 1.0))
    for n, m in solve(d, P.get('lift', 0.0), P.get('shift', 0.0)).items():
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
        P = dict(P, lift=P.get('lift', 0.0) + FLOOR - lo - P.get('sink', 0.0)); apply(P)
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
    """a swipe across the body (Griz, 10-04): the troll's LEFT arm (+X: A) rears up and out on its left, then rakes down and across to its right;
    the RIGHT arm (B) starts low and out on its right and claws up and across to its left. The body turns into it."""
    def f(i, n):
        k = side; sg = 1 if side == 'a' else -1
        # (a frame's arm pose: sw the upper arm (- raises, + lowers it back), out across (Z: + toward the +X side), el the forearm, twist the body)
        if side == 'a':
            F = [dict(sw=0, out=0, el=0, tw=0, ln=0), dict(sw=-40, out=46, el=float(OPT.get('wel', 40)), tw=10, ln=-4), dict(sw=-52, out=62, el=float(OPT.get('wel', 40)) + 14, tw=14, ln=-8),
                 dict(sw=-10, out=-55, el=10, tw=-20, ln=14), dict(sw=18, out=-66, el=16, tw=-26, ln=18), dict(sw=6, out=-24, el=4, tw=-8, ln=6)][i]
        else:
            F = [dict(sw=0, out=0, el=0, tw=0, ln=0), dict(sw=38, out=-34, el=18, tw=-12, ln=6), dict(sw=54, out=-46, el=24, tw=-16, ln=10),
                 dict(sw=-48, out=40, el=-24, tw=18, ln=-6), dict(sw=-74, out=58, el=-30, tw=24, ln=-8), dict(sw=-20, out=18, el=-8, tw=8, ln=-2)][i]
        P = {'lean': F['ln'], 'twist': F['tw'], 'jaw': -10 + 14 * (1 if i in (3, 4) else 0),
             'sw' + k: F['sw'], 'out' + k: F['out'], 'el' + k: F['el'], 'fing' + k: -8 if i in (1, 2) else 12 if i in (3, 4) else 0}
        return P, 0
    return f


def row_bite(i, n):
    """the lunge: the head and chest thrown forward and down to about where a man's head is (the knees bend, the hips go forward over the feet),
    the jaw wide, and it snaps shut; the arms pulled back and let hang down by their legs as it goes (Griz, 10-04)."""
    p = [0.0, -0.5, -0.9, 1.0, 0.8, 0.25][i]; up = max(0.0, -p); dn = max(0.0, p)
    jaw = [-10, 12, 34, -4, -14, -12][i]
    ad = [0.0, 0.35, 0.8, 1.0, 0.9, 0.3][i]
    return dict(lean=-6 * up + 34 * dn, head=-10 * up + 14 * dn, jaw=jaw, shift=-9.0 * dn + 2 * up, tha=14 * dn, thb=14 * dn, kna=26 * dn, knb=26 * dn,
                armsdown=ad), 0


def row_flinch(i, n):
    p = [0.0, 1.0, 0.7, 0.35, 0.0][i]
    return dict(lean=-18 * p, head=-12 * p, jaw=14 * p, swa=-26 * p, swb=-26 * p, twist=8 * p, tha=-6 * p, thb=-10 * p, lift=0.4 * p), 0


def row_prone(i, n):
    """knocked over on its back, by gravity (10-04, Griz: "use gravity for the prone and death positions"): the whole skeleton over about the hip,
    the head thrown back, the arms and legs let go and laid on the floor (aim: each bone toward the ground), the knees a little up; lies at its
    last frame, and gets up by the row played backwards."""
    f = [0.0, 0.25, 0.55, 0.85, 1.0, 1.0][i]; fl = [0.0, 0.0, 0.3, 0.75, 1.0, 1.0][i]
    return dict(body=-float(OPT.get('fall', 82)) * f, lift=-float(OPT.get('drop', 21)) * f, lean=-8 * f, head=-18 * f, jaw=-6 + 8 * f,
                swa=-50 * (1 - fl), swb=-50 * (1 - fl), outa=-40 * (1 - fl), outb=40 * (1 - fl), tha=-24 * (1 - fl), thb=-18 * (1 - fl), kna=36 * (1 - fl), knb=30 * (1 - fl),
                lie='back', lieside=1.0, liefall=fl), 0


def row_death(i, n):
    """crumples where it stands, inside its four squares, like a cat lying down (Griz, 10-04): the knees fold, the hips sink, the chest comes
    down onto the arms and legs tucked under it, and then it goes loose: the jaw slack, the head rolled and tilted at an off angle."""
    f = [0.0, 0.15, 0.38, 0.62, 0.82, 0.95, 1.0, 1.0][i]; g = [0.0, 0.0, 0.1, 0.45, 0.8, 1.0, 1.0, 1.0][i]    # f: the crumple, g: gone loose
    return dict(body=float(OPT.get('dbody', 55)) * f, lean=float(OPT.get('dlean', 20)) * f, head=-6 * f + 40 * g, hroll=-34 * g, hyaw=22 * g, jaw=-8 + 10 * g,
                tha=-60 * f, thb=-52 * f, kna=95 * f, knb=88 * f, tuck=0.0 + 1.0 * g, sink=float(OPT.get('dsink', 4)) * f, twist=-6 * g,
                swa=-30 * f * (1 - g), swb=-30 * f * (1 - g)), 0


ROWS = [('IDLE', 8, True, row_idle, 'clamp'), ('WALK', 8, True, row_walk, 'plant'), ('CLAW', 6, False, row_claw('a'), 'plant'), ('CLAW2', 6, False, row_claw('b'), 'plant'),
        ('BITE', 6, False, row_bite, 'plant'), ('FLINCH', 5, False, row_flinch, 'clamp'), ('DEATH', 8, False, row_death, 'plant'), ('PRONE', 6, False, row_prone, 'clamp')]
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


if MODE == 'dirs':      # where each limb bone points, on a row's last frame (to check aim() against its targets)
    use(OPT.get('row', 'DEATH')); scene.frame_set(int(OPT.get('frame', 8)))
    bpy.context.view_layer.update()
    for n_ in ARM_A[1:3] + LEG_A[1:4] + ARM_B[1:3]:
        pb_ = arm.pose.bones[n_]; h_ = pb_.matrix.translation; t_ = pb_.matrix @ Vector((0, BN[n_].length, 0))
        print('[troll] dir %-9s %s  head z %.1f' % (n_, (t_ - h_).normalized().to_tuple(2), h_.z))
    sys.exit(0)
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
    toe = tname in ('Bone.014', 'Bone.015')       # (a toe bone's group is the whole forefoot, its points lying well past the short bone's tail: only the farthest are the claws)
    g_ = wsum([tname]) > 0.5
    lo_ = float(np.percentile(u[g_], 84)) if toe else 0.0
    hk = g_ & (u > lo_)
    k = np.clip((u - lo_) / max(float(u[g_].max()) - lo_, 1e-6) * 2.5, 0, 1)[:, None] if toe else np.clip((u + 0.2) / 0.8, 0, 1)[:, None]
    col[hk] = col[hk] * (1 - k[hk]) + BONEC[None, :] * k[hk]
# the jaw: the lower jaw's points pale at the tooth line, the mouth's inside dark red
jw = wsum([JAW])
col[jw > 0.6] = col[jw > 0.6] * 0.8 + lin('#5c1a22')[None, :] * 0.2
print('[troll] hide %s: %d jaw points, %d claw-tip bones' % (HIDE, int((jw > 0.6).sum()), len(TIPS)))
# the head's own frame (rest space): origin at the skull bone's root, a along its face (the forward), b up, s to the side
def rh(n): return np.array(BN[n].head_local[:])
def rt(n): return np.array(BN[n].tail_local[:])
HC = rh('Bone.020'); HF = rt('Bone.021') - rh('Bone.021'); HF /= np.linalg.norm(HF)
HU = np.array([0, 0, 1.0]) - HF * HF[2]; HU /= np.linalg.norm(HU); HS = np.cross(HF, HU)
HA, HB, HSI = (PA - HC) @ HF, (PA - HC) @ HU, (PA - HC) @ HS
hg = wsum(['Bone.020', 'Bone.021', 'Bone.019', 'Bone.018']) > 0.4
hg |= np.array([gname[max(v.groups, key=lambda g_: g_.weight).group] == 'Head' if v.groups else False for v in me.vertices])
print('[troll] head frame F=%s U=%s; %d head points; a %s b %s s %s' % (HF.round(2), HU.round(2), int(hg.sum()), np.percentile(HA[hg], [2, 50, 98]).round(1), np.percentile(HB[hg], [2, 50, 98]).round(1), np.percentile(HSI[hg], [2, 50, 98]).round(1)))
# the eyes: the two deepest hollows of the face above the cheeks (a point well behind its neighbours' mean along the face, in the brow band)
fi = np.where(hg & (HA > 6.0) & (HB > -2.5) & (HB < 3.5) & (np.abs(HSI) < 6.5))[0]
fa = np.stack([HSI[fi], HB[fi]], axis=1)
dep = np.zeros(len(fi))
for j_ in range(len(fi)):
    nb = np.linalg.norm(fa - fa[j_], axis=1) < 1.6
    dep[j_] = HA[fi][nb].mean() - HA[fi][j_]
EYES = []
for sgn in (1, -1):
    sel = np.where((np.sign(HSI[fi]) == sgn) & (dep > 0.25))[0]
    if len(sel):
        w_ = dep[sel] ** 2; EYES.append((float((fa[sel, 0] * w_).sum() / w_.sum()), float((fa[sel, 1] * w_).sum() / w_.sum()), float(HA[fi][sel].mean())))
print('[troll] eyes (s, b, a): %s' % [tuple(round(x, 1) for x in e) for e in EYES])
HIPG = wsum(['Hips', 'Hips.001', 'Bone', 'Bone.004', 'Bone.005', 'Bone.002'])
HZ = float(rh('Bone')[2])
CLOTH = (HIPG > 0.45) & (PA[:, 2] < HZ - float(OPT.get('cz', 2.0))) & (PA[:, 2] > HZ - 17) & (np.abs(PA[:, 0] - rh('Bone')[0]) < 7.5)
print('[troll] hip z %.1f; %d cloth points' % (HZ, int(CLOTH.sum())))
# hat (the cap and its fringe, above the brow), the locks hanging at the sides, the loincloth, the eyes (the hollows of the brow band, gold and unshaded)
HAT = hg & (HB > float(OPT.get('hatb', 1.4))) & (np.abs(HSI) < 6.5)
LOCKS = hg & (np.abs(HSI) > 4.0) & (HB < -0.5) & (HA < 12)
EYEM = hg & (HA > float(OPT.get('ea', 8.0))) & (HB > float(OPT.get('eb0', -0.3))) & (HB < float(OPT.get('eb1', 1.2))) & (np.abs(HSI) > float(OPT.get('es0', 1.2))) & (np.abs(HSI) < float(OPT.get('es1', 3.6))) & ~HAT
print('[troll] hat %d, locks %d, cloth %d, eyes %d points' % (int(HAT.sum()), int(LOCKS.sum()), int(CLOTH.sum()), int(EYEM.sum())))
if not OPT.get('cdiag') and not OPT.get('hdiag') and MODE != 'diag':
    HAIRC, CLOTHC, EYEC = lin('#34261f'), lin('#7a5a38'), lin('#f2c230')
    col[HAT | LOCKS] = col[HAT | LOCKS] * 0.15 + HAIRC[None, :] * 0.85
    hem = CLOTH & (PA[:, 2] < HZ - 11)
    col[CLOTH] = CLOTHC[None, :]; col[hem] = (CLOTHC * 0.55)[None, :]
    col[EYEM] = EYEC; unsh[EYEM] = True
if OPT.get('cdiag'):
    col[CLOTH] = np.array((1, 0.1, 0.1)) ** 2.2
if OPT.get('hdiag'):     # the head's points by height (b) and by front (a): red b>0, yellow >-3, green >-6, blue below; a lighter shade where a>8 (the face)
    for i_ in np.where(hg)[0]:
        b_ = HB[i_]; c_ = (1, 0, 0) if b_ > 0 else (1, 1, 0) if b_ > -3 else (0, 1, 0) if b_ > -6 else (0, 0.3, 1)
        col[i_] = np.array(c_) ** 2.2 * (1.0 if HA[i_] > 8 else 0.45)
if MODE == 'diag':      # every point coloured by the group it weights most: which group is the hair, the cloth, the eyes (printed: group -> colour)
    import colorsys
    names = sorted({gname[max(v.groups, key=lambda g_: g_.weight).group] for v in me.vertices if v.groups})
    cmap = {n_: colorsys.hsv_to_rgb((i_ * 0.381966) % 1.0, 0.85, 0.9) for i_, n_ in enumerate(names)}
    for v in me.vertices:
        if v.groups:
            n_ = gname[max(v.groups, key=lambda g_: g_.weight).group]; col[v.index] = np.array(cmap[n_]) ** 2.2
    for n_ in names:
        c_ = cmap[n_]; print('[troll] diag %-12s #%02x%02x%02x  %d' % (n_, int(c_[0] * 255), int(c_[1] * 255), int(c_[2] * 255), sum(1 for v in me.vertices if v.groups and gname[max(v.groups, key=lambda g_: g_.weight).group] == n_)))
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


if MODE in ('look', 'close', 'poses', 'diag'):
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
        kk = arm.scale[0]; hc = arm.matrix_world @ ((POSE0['Bone'].translation + Vector((0, -4, -2)) if OPT.get('at') == 'hips' else POSE0[HEAD].translation + Vector((0, -6, 2))))
        back = cam.matrix_world.to_3x3() @ Vector((0, 0, 1))
        cam.location = hc + back * 40; cam.data.ortho_scale = float(OPT.get('zoom', 22)) * kk; r.resolution_x = r.resolution_y = 800
    BL.light(scene, cam, PRESET)
    shots = [('IDLE', 0, 'f0_00'), ('IDLE', 6, 'f6_00')] if MODE in ('look', 'diag') else [('IDLE', 0, 'f0_00')]
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

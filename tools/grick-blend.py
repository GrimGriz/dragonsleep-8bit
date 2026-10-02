"""The grick for DEEP16, from MZ4250's printable Grick Updated (Thingiverse thing:4738607, CC BY: deep16/CREDITS.md) -- pipeline 1b's third
(deep16/blender-monsters.md), and the first whose zip ships the artist's own rig. 10-02.

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --disable-autoexec --python tools/grick-blend.py -- build [hide=stone|green|slate] [beak=horn|dark]
    ... -- look <tag> [preset=13] [hide=...] [beak=...]     a look test: its idle and its still (the hiding lump), facings S and E, to deep16/_src/grick/look_out/<tag>/
    ... -- close <tag> [...]                                 the same, an 800 px close look at the beak
    ... -- poses <tag> [rows=IDLE,WALK] [facings=0,6]        matcap frames of the rows, to check the motion
    ... -- measure                                           how far each row reaches and how low it goes

Reads deep16/_src/grick/mz4250/files/ (gitignored: Griz downloads them, Thingiverse wants a login): Grick_Updated_posed.blend, the
sculpt (748k triangles) on the artist's rig (92 bones and their weights) in the miniature's pose -- the tail looped on the ground and up
behind, the body rising, the head forward with its beak and four hooked tentacles. (Grick_Updated_rigged.blend is the same sculpt on an
earlier rig of 107 bones, unposed; Grick_Updated.blend the base mesh, which hugs the sculpt too closely to find the beak by what stands
proud: the colour goes by the rig's own vertex groups instead.) `build` writes deep16/_src/grick/grick.blend for tools/render-sprites.py.

The rows are bends on top of the artist's own pose, keyed in code, every bone on every frame (each bend in the pose's frame, carried by
the bones above it: a turn at the neck's root takes the head and the tentacles with it):
    IDLE 8 (loop)  WALK 8 (loop: a wave rolls back through the coil, the head sways)  TENTACLES 6 (rears, the four splayed, then lunges
    and they close: the SRD's first blow)  BEAK 6 (holding with the tentacles, the beak gapes and snaps: the second, only after the
    first hits)  FLINCH 5  DEATH 8 (the neck falls forward to the ground, the tentacles go slack; frame 3 its prone frame)
    STILL 1 (Stone Camouflage: coiled low, the head down, the tentacles folded over the beak -- a lump of rock; the grid shows it till
    its first turn or a wound)  REVEAL 8 (it rises out of the lump, the tentacles fanning wide).
"""
import bpy, sys, os, math, importlib.util, json
import numpy as np
from mathutils import Vector, Quaternion, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'deep16', '_src', 'grick')
FILES = os.path.join(SRC, 'mz4250', 'files')
spec = importlib.util.spec_from_file_location('blender_look', os.path.join(ROOT, 'tools', 'blender_look.py'))
BL = importlib.util.module_from_spec(spec); spec.loader.exec_module(BL)

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['build']
MODE = ARGS[0]
TAG = ARGS[1] if MODE in ('look', 'close', 'poses') and len(ARGS) > 1 else 'grick'
OPT = dict(a.split('=', 1) for a in ARGS if '=' in a)
# the defaults are Griz's picks (10-02): the den's own stone -- "The SRD says stone camoflague, which means we probably go with brown given the
# existing maps" -- with the lift off ("i like 'green no-lift'": tools/deep16-figures.json), and the beak "pale"
PRESET, HIDE, BEAK = OPT.get('preset', '13'), OPT.get('hide', 'stone'), OPT.get('beak', 'horn')
FOOT_D = 25.25                 # the print base, 'Medium Creature': 25 mm, one 5-ft square -- the grick's own footprint

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
with bpy.data.libraries.load(os.path.join(FILES, 'Grick_Updated_posed.blend')) as (src, dst):
    dst.objects = ['Armature', 'ORGANIC BASE SPHERE', 'Medium Creature']
for o in dst.objects:
    scene.collection.objects.link(o)
arm, body, printbase = dst.objects
arm.name = arm.data.name = 'Grick_Rig'; body.name = 'Grick_Body'
bpy.context.view_layer.update()

# ------------------------------------------------------------------ the rig re-origined on its foot: armature space = world axes, (0, 0, 0)
# the middle of the print base. (render-sprites.py turns a figure for each facing about the armature's origin; the artist's sat 14 units
# off the foot, so the grick would have wandered round its square.) The pose is kept: a bone's pose is relative to its rest.
O = Vector((printbase.matrix_world.translation.x, printbase.matrix_world.translation.y, 0.0))
A0, B0 = arm.matrix_world.copy(), body.matrix_world.copy()
bpy.context.view_layer.objects.active = arm; arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
X = Matrix.Translation(-O) @ A0
MS = {eb.name: X @ eb.matrix for eb in arm.data.edit_bones}    # (each bone's whole matrix, head, direction and roll: EditBone.transform
for eb in arm.data.edit_bones:                                  # re-rolled them as it turned them, and the pose came out wild)
    eb.matrix = MS[eb.name]
bpy.ops.object.mode_set(mode='OBJECT')
arm.matrix_world = Matrix.Translation(O); bpy.context.view_layer.update()
body.matrix_parent_inverse = arm.matrix_world.inverted() @ B0 @ body.matrix_basis.inverted()
bpy.data.objects.remove(printbase, do_unlink=True)
bpy.context.view_layer.update()

# ------------------------------------------------------------------ the sculpt, 748k triangles, brought to ~225k (decimated at rest: the
# armature off while it is, so the weights come through with it)
amod = next(m for m in body.modifiers if m.type == 'ARMATURE'); amod.object = arm
amod.show_viewport = False
dec = body.modifiers.new('dec', 'DECIMATE'); dec.ratio = 0.3
dg = bpy.context.evaluated_depsgraph_get()
me2 = bpy.data.meshes.new_from_object(body.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
body.modifiers.remove(dec); old = body.data; body.data = me2; bpy.data.meshes.remove(old)
me2.name = 'Grick_Body'
amod.show_viewport = True
print('[grick] sculpt decimated: %d verts, %d faces; %d vertex groups' % (len(me2.vertices), len(me2.polygons), len(body.vertex_groups)))

# ------------------------------------------------------------------ the bones, by family
BN = arm.data.bones
TROOTS = ['Bone.052', 'Bone.053', 'Bone.054', 'Bone.055']    # the tentacles: its upper left, upper right, lower left, lower right
JAWS = ['Bone.048', 'Bone.049', 'Bone.050', 'Bone.051']      # the upper beak (048, 049) and the lower (050, 051)


def chain(name, skip=()):
    out = [name]
    while True:
        kids = [c.name for c in BN[out[-1]].children if c.name not in skip]
        if not kids:
            return out
        out.append(kids[0])


NECK = chain('Bone', TROOTS + JAWS)          # the hip up to the head (16)
TAIL = chain('Bone.001')                      # the hip back round the coil to the tip (32)
TENT = [chain(t) for t in TROOTS]             # four of ten
HEAD = NECK[-1]
print('[grick] neck %d, tail %d, tentacles %s, head %s' % (len(NECK), len(TAIL), [len(t) for t in TENT], HEAD))

REST = {b.name: b.matrix_local.copy() for b in BN}
for pb in arm.pose.bones:
    pb.rotation_mode = 'QUATERNION'
POSE0 = {pb.name: pb.matrix.copy() for pb in arm.pose.bones}        # the artist's pose, armature space (= world axes)
ORDER = []


def topo(b):
    ORDER.append(b.name)
    for c in b.children:
        topo(c)


for b in BN:
    if b.parent is None:
        topo(b)


def ph(n): return POSE0[n].translation.copy()
def pt(n): return (POSE0[n] @ Vector((0, BN[n].length, 0))).copy()
def pdir(n): return (pt(n) - ph(n)).normalized()


UP = Vector((0, 0, 1)); PITCH = Vector((1, 0, 0))     # (+ about +X: the front (-Y) goes down -- a nod, a lunge; - rears back)
H = pdir(HEAD)                                         # the head's forward, in the pose
UH = (pt('Bone.048') - ph('Bone.048')).normalized()    # the upper beak's hinge goes up from the head
JAX = H.cross(UH).normalized()                         # turning the upper beak about this lifts its tip
TAX = [pdir(t[0]).cross(H).normalized() for t in TENT]   # turning a tentacle about this closes it toward the beak's line


def Q(axis, deg):
    ax = Vector(axis)
    return Quaternion(ax.normalized(), math.radians(deg)) if ax.length > 1e-6 and deg else Quaternion()


# ------------------------------------------------------------------ a pose: its parameters -> a bend per bone -> each bone's basis
def bends(P, t=0.0):
    """P: pitch (degrees over the neck; + forward/down), low (more over the neck's lower half), yaw (about UP, the lower neck), tent
    (each tentacle's root: + closes toward the beak, - splays), curl (per bone after the root, the same way), droop (per tentacle bone,
    toward the ground), twave (the tentacles' ripple, degrees per bone, at phase t), jaw (the gape), tailwave (degrees per bone of a wave
    rolling back round the coil, at phase t), taildroop (per bone, the raised tip toward the ground), lift (both roots, up)."""
    d = {}
    def add(n, q):
        d[n] = q @ d.get(n, Quaternion())
    nN = len(NECK)
    for j, n in enumerate(NECK):
        w_low = max(0.0, 1.0 - j / (nN * 0.5))
        add(n, Q(PITCH, P.get('pitch', 0) / nN + P.get('low', 0) * w_low / (nN * 0.25)))
        if j < nN // 2:
            add(n, Q(UP, P.get('yaw', 0) / (nN // 2)))
    for k, ch in enumerate(TENT):
        ph_k = k * 1.7
        for j, n in enumerate(ch):
            ang = (P.get('tent', 0) if j == 0 else P.get('curl', 0)) + P.get('twave', 0) * math.sin(2 * math.pi * t + ph_k - 0.7 * j)
            add(n, Q(TAX[k], ang))
            if j and P.get('droop') and not (P.get('flat') and k >= 2):     # (laid flat, the lower pair already lie on the ground: flatten())
                v = pdir(n); add(n, Q(v.cross(Vector((0, 0, -1))), P['droop']))
    if P.get('jaw'):
        add('Bone.048', Q(JAX, P['jaw'] * 0.45)); add('Bone.050', Q(JAX, -P['jaw'] * 0.55))
    nT = len(TAIL)
    for j, n in enumerate(TAIL):
        if P.get('tailwave') and 3 <= j < nT - 3:
            add(n, Q(UP, P['tailwave'] * min(1.0, (j - 2) / 4.0) * math.sin(2 * math.pi * t - 0.45 * j)))
        if P.get('taildroop') and j >= nT - 11:
            v = pdir(n); add(n, Q(v.cross(Vector((0, 0, -1))), P['taildroop']))
    if P.get('slither'):
        slither(d, P, t)
    if P.get('flat'):
        flatten(d, P['flat'])
    return d


def flatten(d, f):
    """knocked flat (Griz, 10-02: "make sure if it can be prone it looks prone when it is"): the neck laid along the ground from the hip,
    bowed a little to one side, the head resting -- the coil's hump gone (the death row's first cut pitched the neck forward and the hump
    stayed: a slumped coil, not a creature down). f: 0 the standing coil, 1 flat; each neck bone's turn onto its piece of the path, slerped."""
    nN = len(NECK); G = Quaternion()
    for j, n in enumerate(NECK):
        T = Vector((0.35 * math.sin(math.pi * j / nN), -1.0, 0.0 if j < nN - 4 else -0.12)).normalized()
        dq = pdir(n).rotation_difference(G.inverted() @ T); G = G @ dq
        d[n] = Quaternion().slerp(dq, f)
    # the lower pair of tentacles reach down from the head; with the head down by the floor they went 7 units into it: swung up to lie
    # along the ground
    for ch in TENT[2:]:
        v = pdir(ch[0]); d[ch[0]] = Q(v.cross(Vector((0, 0, -1))), -40 * f) @ d.get(ch[0], Quaternion())


def slither(d, P, t):
    """the walk (Griz, 10-02: "their idle pose is like standing and I just thought they'd flatten out more snake-like when they were
    moving"): not bends on the standing coil but a path of its own -- the neck laid forward along the ground, the head lifted at its end,
    the tail trailing behind, down to the ground and its raised tip with it, and one sine wave through the whole body (lateral `slither`
    units, `lam` long) travelling from head to tail as t goes round. Each bone is turned onto its piece of the path in its chain's frame:
    with G the turn its chain has taken so far, d = v.rotation_difference(G^-1 T), and G = G d (the roper's turtle)."""
    a, k, w = P['slither'], 2 * math.pi / P.get('lam', 34.0), 2 * math.pi * t
    nN = len(NECK)
    for ch, back in ((NECK, False), (TAIL, True)):
        G = Quaternion(); f = 0.0
        for j, n in enumerate(ch):
            L = BN[n].length; fm = f + L / 2; fwd = -fm if back else fm      # (fwd: along the body toward the head, 0 at the hip)
            dx = a * k * math.cos(k * fwd + w) * (-1 if back else 1)
            if back:                                                         # the tail: down from the hip as the artist laid it, then flat
                z = pdir(n).z if j < 5 else 0.0
            else:                                                            # the neck: flat, the head lifted at its end
                z = 0.0 if j < nN - 6 else (0.32 if j < nN - 2 else 0.1)
            T = Vector((dx, 1.0 if back else -1.0, z)).normalized()
            dq = pdir(n).rotation_difference(G.inverted() @ T)
            d[n] = dq; G = G @ dq; f += L


def solve(d, lift=0.0, necklift=0.0):
    """each bone's basis for bends d: its posed rotation is (the bends of every bone above it and its own, in the pose's frame) x the
    artist's; its head where its parent now carries it."""
    G, M, out = {}, {}, {}
    for n in ORDER:
        b = BN[n]; p = b.parent.name if b.parent else None
        g = (G[p] if p else Quaternion()) @ d.get(n, Quaternion()); G[n] = g
        R = g.to_matrix() @ POSE0[n].to_3x3()
        if p:
            C = M[p] @ REST[p].inverted() @ REST[n]; head = C.translation
        else:
            C = REST[n]; head = POSE0[n].translation + Vector((0, 0, lift + (necklift if n == NECK[0] else 0.0)))   # (necklift: the neck's root alone, its tail's stays)
        M[n] = Matrix.Translation(head) @ R.to_4x4()
        out[n] = C.inverted() @ M[n]
    return out


def apply(P, t=0.0):
    for n, m in solve(bends(P, t), P.get('lift', 0.0), P.get('necklift', 0.0)).items():
        loc, rot, sc = m.decompose()
        pb = arm.pose.bones[n]; pb.rotation_quaternion = rot; pb.location = loc


def mix(a, b, f):
    return {k: a.get(k, 0) * (1 - f) + b.get(k, 0) * f for k in set(a) | set(b)}


# ------------------------------------------------------------------ the rows
def row_idle(i, n):
    t = i / n; s = math.sin(2 * math.pi * t)
    return dict(pitch=4 * s, yaw=3 * math.sin(2 * math.pi * t + 1.0), twave=5, jaw=4 + 3 * math.sin(2 * math.pi * t + 0.6),
                lift=0.15 * (1 - math.cos(2 * math.pi * t))), t      # (the bob rises from the first frame: the render seats it on that one)


def row_walk(i, n):
    """a step or two (battle.js moveAlong: a move of one or two squares): the coil kept, a wave through it, the head swaying -- the first
    walk, back on Griz's word: "can we do the old one for 1-2 squares and the new if they're going 3 squares or more" (10-02)."""
    t = i / n
    return dict(pitch=5 * math.sin(4 * math.pi * t), yaw=7 * math.sin(2 * math.pi * t), tent=-6, twave=6, tailwave=7, lift=0.35 * abs(math.sin(2 * math.pi * t))), t


def row_slither(i, n):
    """three squares or more: laid flat and slithering (slither() above; the tentacles swept back a little)."""
    t = i / n
    # (sl 9, lam 22: of three tried on 10-02 -- 6/34 stretched it four squares, the whole length of the model; 11/18 folded the thick body
    # into lumps -- the one that reads as a snake and keeps to about three; lifted 3.6 so its belly does not sink)
    return dict(slither=float(OPT.get('sl', 9)), lam=float(OPT.get('lam', 22)), tent=-12, twave=5, lift=float(OPT.get('wlift', 3.6))), t


STILL = dict(pitch=40, low=30, tent=-48, curl=-4, jaw=0, taildroop=9)      # (the tentacles swept back along the neck: closed over the beak, the hooks went into the floor)


def row_still(i, n):
    return dict(STILL), 0.0


def row_reveal(i, n):
    f = [0.0, 0.12, 0.38, 0.7, 0.95, 1.06, 1.02, 1.0][i]; fl = [0, 0, 0.25, 0.65, 1.0, 0.6, 0.2, 0][i]
    P = mix(STILL, dict(jaw=4), f)
    P['tent'] = P.get('tent', 0) - 30 * fl; P['curl'] = P.get('curl', 0) - 5 * fl; P['jaw'] = P['jaw'] + 22 * fl
    return P, 0.0


def row_tentacles(i, n):
    p = [0.0, -0.6, -1.0, 1.0, 0.6, 0.2][i]
    if p < 0:
        return dict(pitch=-28 * -p, tent=-26 * -p, curl=-6 * -p, jaw=14 * -p), 0.0
    return dict(low=34 * p, pitch=-6 * p, tent=30 * p, curl=11 * p, jaw=2), 0.0      # (it leans in from the coil, the head kept level: at the chest, not the floor)


def row_beak(i, n):
    p = [0.0, 0.4, 1.0, 0.9, 0.5, 0.15][i]; gape = [4, 18, 30, 0, 0, 3][i]
    return dict(low=24 * p, pitch=4 * p, tent=14, curl=6, jaw=gape), 0.0


def row_flinch(i, n):
    p = [0.0, 1.0, 0.7, 0.35, 0.0][i]
    return dict(pitch=-20 * p, yaw=8 * p, tent=-20 * p, jaw=12 * p, lift=0.4 * p), 0.0


def row_death(i, n):
    """down flat by frame 3 -- the neck laid along the ground, the tail's tip down, the tentacles splayed and still held up: knocked flat
    but alive, its prone frame (deep16/js/sprites.js S.PRONE; getting up is the row played back from there, flat to the coil) -- then
    slack: the tentacles drop and curl, the beak falls open (10-02: the first cut pitched the neck forward and kept the coil's hump)."""
    f = [0.0, 0.3, 0.65, 1.0, 1.0, 1.0, 1.0, 1.0][i]
    s = [0.0, 0.0, 0.0, 0.0, 0.35, 0.65, 0.9, 1.0][i]
    # (necklift: the neck is thicker at the hip than the hip is high -- laid flat its belly went 2.3 units under the ground the coil rests on)
    return dict(flat=f, necklift=float(OPT.get('nl', 2.6)) * f, tent=-10 * f - 6 * s, droop=4 * f + 7 * s, curl=8 * s, jaw=6 * f + 14 * s, taildroop=6 * f + 4 * s), 0.0


ROWS = [('IDLE', 8, True, row_idle), ('WALK', 8, True, row_walk), ('SLITHER', 8, True, row_slither), ('TENTACLES', 6, False, row_tentacles), ('BEAK', 6, False, row_beak),
        ('FLINCH', 5, False, row_flinch), ('DEATH', 8, False, row_death), ('STILL', 1, False, row_still), ('REVEAL', 8, False, row_reveal)]
ad = arm.animation_data_create()
for name, n, loop, fn in ROWS:
    act = bpy.data.actions.new(name); act.use_fake_user = True; ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots):
        ad.action_slot = act.slots[0]
    for i in range(n + (1 if loop else 0)):
        P, t = fn(i % n, n); apply(P, t)
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
print('[grick] rows: %s' % ', '.join(r[0] for r in ROWS))


def posed_points(step=5):
    dg = bpy.context.evaluated_depsgraph_get(); oe = body.evaluated_get(dg); me = oe.to_mesh()
    a = np.zeros(len(me.vertices) * 3); me.vertices.foreach_get('co', a); oe.to_mesh_clear()
    M = np.array(oe.matrix_world); a = a.reshape(-1, 3)[::step]
    return a @ M[:3, :3].T + M[:3, 3]


FLOOR = float(posed_points(1)[:, 2].min())     # its lowest point standing (the idle's first frame): the ground
print('[grick] the ground (its lowest point in the idle) at z %.2f' % FLOOR)
if MODE == 'measure':
    SQ = FOOT_D
    for name, n, loop, fn in ROWS:
        use(name); r = 0.0; zt = 0.0; zl = 1e9
        for i in range(n):
            scene.frame_set(i + 1); P = posed_points()
            r = max(r, float(np.hypot(P[:, 0], P[:, 1]).max())); zt = max(zt, float(P[:, 2].max())); zl = min(zl, float(P[:, 2].min()))
        print('[grick] reach %-9s %.2f squares out, %.2f high, lowest %+.2f units from the ground' % (name, r / SQ, (zt - FLOOR) / SQ, zl - FLOOR))
    sys.exit(0)

# ------------------------------------------------------------------ colour: painted onto the points, by the rig's own groups (at rest)
bpy.context.view_layer.update()
me = body.data; nv = len(me.vertices)
co = np.zeros(nv * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
nr = np.zeros(nv * 3); me.vertices.foreach_get('normal', nr); nr = nr.reshape(-1, 3)
TA = np.array(arm.matrix_world.inverted() @ body.matrix_world)       # mesh -> armature space (rest)
PA = co @ TA[:3, :3].T + TA[:3, 3]
NA = nr @ TA[:3, :3].T; NA /= np.maximum(np.linalg.norm(NA, axis=1, keepdims=True), 1e-9)
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


def rh(n): return np.array(BN[n].head_local[:])
def rt(n): return np.array(BN[n].tail_local[:])


HIDES = {    # (the hide, a second blotched in, the belly): 'green' the wanted list's "rubbery grey-green"; 'stone' the den's own stone (DEEP16's
             # stone ramp, the Fork's, as the roper: Stone Camouflage); 'slate' the grey
    'green': ('#66705a', '#4e5644', '#8c9478'),
    'stone': ('#7a6250', '#58443a', '#a08a6e'),
    'slate': ('#6c707a', '#50545e', '#8e929a'),
}
HB, H2, HBELLY = HIDES[HIDE]
col, unsh = BL.paint_points(PA, dict(base=HB, base2=H2, split=1.6, fine=0.08, blotch=0.14, blotch_scale=0.10, seed=7))
lin = lambda h: np.array(BL.srgb2lin(h))
# the belly: at rest the worm lies straight with its back up (+Z: the upper beak's side), so the belly is what faces down from its axis
body_w = wsum(NECK + TAIL)
z0 = rh('Bone')[2]; x0 = rh('Bone')[0]
rad = np.stack([PA[:, 0] - x0, PA[:, 2] - z0], axis=1); rl = np.maximum(np.linalg.norm(rad, axis=1), 1e-6)
down = -rad[:, 1] / rl
bt = np.clip((down - 0.25) / 0.5, 0, 1); bt = bt * bt * (3 - 2 * bt) * np.clip(body_w, 0, 1)
col = col * (1 - bt[:, None] * 0.85) + lin(HBELLY)[None, :] * bt[:, None] * 0.85
# the tentacles a shade paler than the hide; their hooks bone, from the start of each last bone to the tip
tw = wsum([n for ch in TENT for n in ch])
col = col * (1 - 0.25 * tw[:, None]) + lin(HBELLY)[None, :] * 0.25 * tw[:, None]
BONEC = lin('#e6dcc0')
for ch in TENT:
    h, t_ = rh(ch[-1]), rt(ch[-1]); s = t_ - h
    u = ((PA - h) @ s) / (s @ s)
    hk = (wsum([ch[-1]]) > 0.5) & (u > 0.05)
    k = np.clip((u - 0.05) / 0.35, 0, 1)[:, None]
    col[hk] = (col[hk] * (1 - k[hk]) + BONEC[None, :] * k[hk])
# the beak: the jaws' groups; pale horn (or dark), darker toward the hinge; its inner faces and the throat dark and shaded (the xorn's
# "unpainted mouth")
jw = wsum(JAWS)
hinge = rh('Bone.048'); hd = (rt(HEAD) - rh(HEAD)); hd /= np.linalg.norm(hd)
along = (PA - hinge) @ hd
tipd = np.percentile(along[jw > 0.5], 98)
kb = np.clip(along / max(tipd, 1e-6), 0, 1)[:, None]
BT, BB = (lin('#e2d2a4'), lin('#8a7450')) if BEAK == 'horn' else (lin('#5a5048'), lin('#2c2622'))
beak = jw > 0.55
col[beak] = (BB[None, :] * (1 - kb[beak]) + BT[None, :] * kb[beak])
up_h = rt('Bone.048') - rh('Bone.048'); up_h /= np.linalg.norm(up_h)      # (the upper beak's hinge bone points up out of the head)
side = (PA - hinge) @ up_h            # + above the mouth's line, - below
nup = NA @ up_h
inner = beak & (((side > 0) & (nup < -0.35)) | ((side < 0) & (nup > 0.35)))
MOUTH, DEEP = lin('#5c1a22'), lin('#22080c')
col[inner] = MOUTH
# the throat: the head's own points on the mouth's line, facing out of it
hw = wsum([HEAD, NECK[-2]])
offax = np.linalg.norm((PA - hinge) - along[:, None] * hd[None, :], axis=1)
throat = (hw > 0.3) & ~beak & (NA @ hd > 0.45) & (offax < 3.2)
col[throat] = DEEP
print('[grick] hide %s, beak %s: %d beak points (%d inner), %d throat, belly mean %.2f' % (HIDE, BEAK, int(beak.sum()), int(inner.sum()), int(throat.sum()), float(bt.mean())))
BL.write_points(body, np.maximum(col, 0), unsh)
BL.toon_material(body)

# the footprint: a disc the size of the print base, round the foot's middle, at the ground -- render-sprites.py sizes and seats it by
# this (size_by), not by the head and tentacles reaching out over the base as the miniature's do
k = 32; rr = FOOT_D / 2
fme = bpy.data.meshes.new('Grick_Foot'); fme.from_pydata([(rr * math.cos(2 * math.pi * i / k), rr * math.sin(2 * math.pi * i / k), FLOOR) for i in range(k)], [], [tuple(range(k))])
foot = bpy.data.objects.new('Grick_Foot', fme); scene.collection.objects.link(foot)
foot.parent = arm; foot.matrix_parent_inverse = Matrix.Identity(4); foot.hide_render = True


# ------------------------------------------------------------------ look tests and pose sheets
def stand_camera():
    k = BL.UPS / FOOT_D
    arm.scale = (k, k, k); arm.location = (0, 0, -FLOOR * k); bpy.context.view_layer.update()
    R = 1.3 * BL.UPS
    lo, hi = Vector((-R, -R, 0)), Vector((R, R, 36 * k))
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
        for name, n, loop, fn in ROWS:
            if name not in rows:
                continue
            use(name)
            for f in facings:
                arm.rotation_euler.z = math.radians(45 - 45 * f)
                for i in range(n):
                    scene.frame_set(i + 1)
                    r.filepath = os.path.join(od, '%s_f%d_%02d.png' % (name, f, i)); bpy.ops.render.render(write_still=True)
        json.dump({'fw': FW * 2, 'fh': FH * 2, 'rows': [[r_[0], r_[1]] for r_ in ROWS if r_[0] in rows], 'facings': facings}, open(os.path.join(od, 'poses.json'), 'w'))
        print('[grick] poses %s done' % TAG)
        sys.exit(0)
    r.resolution_x, r.resolution_y, r.resolution_percentage = FW * BL.SS, FH * BL.SS, 100
    if MODE == 'close':     # (turned to facing 0 first: the head is aimed at where it will be)
        arm.rotation_euler.z = math.radians(45); bpy.context.view_layer.update()
        kk = arm.scale[0]; hc = arm.matrix_world @ ph(HEAD)
        back = cam.matrix_world.to_3x3() @ Vector((0, 0, 1))
        cam.location = hc + back * 40; cam.data.ortho_scale = 22 * kk; r.resolution_x = r.resolution_y = 800
    BL.light(scene, cam, PRESET)
    shots = [('IDLE', 0, 'f0_00'), ('IDLE', 6, 'f6_00'), ('STILL', 0, 'still_f0')] if MODE == 'look' else [('IDLE', 0, 'f0_00')]
    for row, f, fn in shots:
        use(row); scene.frame_set(1)
        arm.rotation_euler.z = math.radians(45 - 45 * f)
        r.filepath = os.path.join(od, fn + '.png'); bpy.ops.render.render(write_still=True)
    json.dump({'figure': 'grick', 'tag': TAG, 'ss': BL.SS, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'facings': [0, 6]}, open(os.path.join(od, 'meta.json'), 'w'), indent=1)
    print('[grick] look %s done' % TAG)
    sys.exit(0)

if MODE == 'build':
    use('IDLE'); scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SRC, 'grick.blend'))
    print('[grick] built: %s (rows %s; prone frame 3 of DEATH)' % (os.path.join(SRC, 'grick.blend'), ', '.join(r_[0] for r_ in ROWS)))

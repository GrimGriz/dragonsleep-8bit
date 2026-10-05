"""The stone giant for DEEP16, from MZ4250's printable Stone Giant (female, sculpted) -- pipeline 1b's fifth, a biped on the artist's weights
but NOT on the artist's rig (deep16/blender-monsters.md). 10-04. STOPPED BEFORE THE POSING: this script loads, fits a skeleton, skins it, paints the
look and renders a look test and a skin test; the rows are not written (see "Where it stops").

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --disable-autoexec --python tools/stonegiant-blend.py -- look <tag> [preset=13]
    ... -- close <tag> [at=head|chest|hips|club] [zoom=26] [face=0]       an 800 px close look
    ... -- bend <tag> [view=front|side] [only=Calf.R,Head] [zoom= cz= cx= cy=]  the skin test: a few single bones turned, flat matcap views (rest and bent)
    ... -- skin [r=11] [thr=0.5]                                           per bone: its points, and how many lie far from its segment
    ... -- diag <tag> [view=front|side]                                    every point coloured by the group it weights most (printed: group -> colour)
    ... -- joints                                                          prints the fitted joints

Reads deep16/_src/stone giant/ (gitignored; Griz filed it): Stone_Giant_Female_Sculpted.blend, a 327k-point sculpt of a giantess in a striding
miniature's pose (the club raised in her right hand, the left fist clenched, the left leg back), a separate club ('Cylinder') and the 75.7 mm print
base ('Huge Creature': three squares, 25.2 mm to a square, the Large troll's own scale). The other two files in the folder: the base mesh of the same
figure (4k points, the same weights; look at it for the topology) and 'Stone_Giant_Updated' (a male sculpt: no rig, no weights at all).

WHY NOT THE ARTIST'S ARMATURE. The file's 'Body' armature (30 bones) is a rest rig in another frame and another pose: its arms hang, her arms are up, and
at 10.5x scale it stands 40 high to her 90. It is not parented to the mesh and no modifier uses it. What IS good is the mesh's 24 vertex groups: the
bones' names (Hips, Back, Upperback, Neck, Head, Shoulder/UperArm/LowerArm/Hand .L/.R, Leg/Calf/Foot/Toes .L/.R), smooth, summing to one over each limb. So
the skeleton is FOUND from them (the xorn's way): a joint is the mean of the points that weight two neighbouring groups both above 0.2
(Leg|Calf is the knee). The bones take the groups' names, so the Armature modifier skins with the artist's own weights unchanged.
  - 'Hips.001' (a duplicate pelvis group) is folded into 'Hips' by max; the two IK groups are ignored (no bone).
  - THE ARTIST'S WEIGHTS COVER ONLY 53k OF THE 327k POINTS (the sculpt's subdivision added the rest with none: unskinned, they tore into shards). The others take theirs
    along the mesh's edges, a ring at a time, then smoothed (nearest-by-distance was tried first: the kilt's fringe beside her left fist swung with the forearm).
    `-- skin` checks it; `-- bend` proves it.
  - the gear (kilt, leg wraps, vest, shoulder fur, bracers) is one fused surface with no groups: coloured by region masks, `gdiag=1` shows them. A first guess.
  - the Hand groups are all but empty (30 points on the right): the fist skins to the forearm, and the Hand bone is a handle for the club and later poses.
  - the club (a Subsurf cylinder) is parented to Hand.R, where it already lies, so a row that turns the arm turns the club.
Bone frame: each bone's Z axis (its roll) points to the figure's front (-Y), so a bend about the bone's own X is a pitch (a lean forward, a knee bending).

The frame: everything is baked into world coordinates, shifted so the print base's middle is (0, 0) and the lowest point of her feet is z 0, the
figure faces -Y, her left (Shoulder.L) is +X. The armature sits at the origin with no scale, so tools/render-sprites.py's turn about the armature
object is a turn about her foot. FLOOR is 0.

Where it stops. The recipe's step 8 (the rows) is the posing and is not here: no `stance`, no rows, no `build` (a rest `build` would only save the blend).
What the next window finds ready: the skeleton (`-- joints`), the skinning (`-- bend`), the colour (`-- look`, `-- close`), the footprint disc 'Giant_Foot'
for `size_by`, and the club on the hand.
"""
import bpy, sys, os, math, importlib.util, json
import numpy as np
from mathutils import Vector, Quaternion, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'deep16', '_src', 'stonegiant')
FILES = os.path.join(ROOT, 'deep16', '_src', 'stone giant')
spec = importlib.util.spec_from_file_location('blender_look', os.path.join(ROOT, 'tools', 'blender_look.py'))
BL = importlib.util.module_from_spec(spec); spec.loader.exec_module(BL)
spec = importlib.util.spec_from_file_location('blender_pose', os.path.join(ROOT, 'tools', 'blender_pose.py'))
BP = importlib.util.module_from_spec(spec); spec.loader.exec_module(BP)

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['joints']
MODE = ARGS[0]
TAG = ARGS[1] if MODE in ('look', 'close', 'bend', 'diag', 'poses') and len(ARGS) > 1 and '=' not in ARGS[1] else 'sg'
OPT = dict(a.split('=', 1) for a in ARGS if '=' in a)
PRESET = OPT.get('preset', '13')
FOOT_D = 75.74                 # the print base, 'Huge Creature': three squares
SQ_H = 3.0                     # squares of footprint
TAU = 2 * math.pi
log = lambda s: print('[stonegiant] ' + s)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
with bpy.data.libraries.load(os.path.join(FILES, 'Stone_Giant_Female_Sculpted.blend')) as (src, dst):
    dst.objects = ['Hand holding something LEFT HAND', 'Cylinder', 'Huge Creature']
for o in dst.objects:
    scene.collection.objects.link(o)
body, club, printbase = dst.objects
body.name = 'Giant_Body'; club.name = 'Giant_Club'
for o in (body, club):
    o.hide_set(False); o.hide_viewport = False; o.hide_render = False
bpy.context.view_layer.update()

# ------------------------------------------------------------------ baked into the frame: the print base's middle is (0, 0), her soles are z 0
O = Vector((printbase.matrix_world.translation.x, printbase.matrix_world.translation.y, 0.0))
bpy.data.objects.remove(printbase, do_unlink=True)
body.data.transform(body.matrix_world); body.matrix_world = Matrix.Identity(4)
club.data.transform(club.matrix_world); club.matrix_world = Matrix.Identity(4)
nv = len(body.data.vertices)
co = np.empty(nv * 3); body.data.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
SHIFT = Vector((-O.x, -O.y, -float(co[:, 2].min())))
for o in (body, club):
    o.data.transform(Matrix.Translation(SHIFT))
cof = np.empty(nv * 3); body.data.vertices.foreach_get('co', cof); PA = cof.reshape(-1, 3).copy()
FLOOR = 0.0
log('%d points, %.1f high; shift %s' % (nv, PA[:, 2].max(), tuple(round(x, 1) for x in SHIFT)))

# ------------------------------------------------------------------ the groups, as arrays
gname = [g.name for g in body.vertex_groups]
W = {g: np.zeros(nv) for g in gname}
for v in body.data.vertices:
    for ge in v.groups:
        W[gname[ge.group]][v.index] = ge.weight
BONE_GROUPS = ['Hips', 'Back', 'Upperback', 'Neck', 'Head'] + [n + s for s in ('.L', '.R') for n in ('Shoulder', 'UperArm', 'LowerArm', 'Hand', 'Leg', 'Calf', 'Foot', 'Toes')]
# the artist's weights live on only 55k of the sculpt's 327k points (the last indices: the base mesh's own; the rest were added by the sculpt's subdivision with
# no weight at all, so they stayed at rest and tore into shards when a bone turned). The rest take theirs ALONG THE SURFACE, not through the air: a first try took the
# four nearest weighted points by distance, and the fringe of the kilt hanging beside her left fist took the forearm's weights and swung with it. Here the weights spread
# over the mesh's own edges, a ring at a time (each point is the mean of its already-weighted neighbours), then six smoothings of the new points.
M = np.stack([np.maximum(W[g], W['Hips.001']) if g == 'Hips' else W[g] for g in BONE_GROUPS], axis=1)     # ('Hips.001' is a duplicate pelvis group: folded in by max)
tot = M.sum(1); src = np.where(tot > 0.5)[0]; dst_ = np.where(tot <= 0.5)[0]
M[src] /= tot[src, None]
ed = np.empty(len(body.data.edges) * 2, dtype=np.int64); body.data.edges.foreach_get('vertices', ed); ed = ed.reshape(-1, 2)
ea, eb_ = np.concatenate([ed[:, 0], ed[:, 1]]), np.concatenate([ed[:, 1], ed[:, 0]])      # both directions: a -> b
have = tot > 0.5; rings = 0
while not have.all():
    m_ = have[ea] & ~have[eb_]
    if not m_.any():
        break
    acc = np.zeros_like(M); cnt = np.zeros(nv)
    np.add.at(acc, eb_[m_], M[ea[m_]]); np.add.at(cnt, eb_[m_], 1.0)
    new_ = cnt > 0; M[new_] = acc[new_] / cnt[new_, None]; have |= new_; rings += 1
free = ~(tot > 0.5)
for _ in range(6):
    acc = M.copy(); cnt = np.ones(nv)
    np.add.at(acc, eb_, M[ea]); np.add.at(cnt, eb_, 1.0)
    sm = acc / cnt[:, None]; M[free] = sm[free]
if not have.all():
    log('WARN %d points reached no weight by the surface (a loose island)' % int((~have).sum()))
# keep each point's four strongest bones, renormalised; write them back as the body's vertex groups (weights bucketed in 1/32 so each group takes a few list calls)
top = np.argsort(-M, axis=1)[:, 4:]
np.put_along_axis(M, top, 0.0, axis=1)
M /= M.sum(1, keepdims=True)
for g in list(body.vertex_groups):
    body.vertex_groups.remove(g)
for k_, g in enumerate(BONE_GROUPS):
    vg = body.vertex_groups.new(name=g); q = np.rint(M[:, k_] * 32).astype(int)
    for bk in range(1, 33):
        ids = np.where(q == bk)[0]
        if len(ids):
            vg.add([int(x) for x in ids], bk / 32.0, 'REPLACE')
W = {g: M[:, k_] for k_, g in enumerate(BONE_GROUPS)}
log('weights: %d points weighted by the artist, %d spread along the surface in %d rings' % (len(src), len(dst_), rings))


def bound(a, b, thr=0.2):
    """the joint between two groups: the mean of the points that weight both above thr."""
    m = (W[a] > thr) & (W[b] > thr)
    if not m.any():
        raise RuntimeError('no joint between %s and %s' % (a, b))
    return PA[m].mean(0)


def far(group, frm, thr=0.5):
    """the point of a group farthest from `frm`."""
    m = np.where(W[group] > thr)[0]
    d = np.linalg.norm(PA[m] - frm, axis=1)
    return PA[m[int(d.argmax())]]


V = lambda a: Vector(tuple(float(x) for x in a))
J = {}
hipL, hipR = bound('Hips', 'Leg.L'), bound('Hips', 'Leg.R')
J['pelvis'] = (hipL + hipR) / 2
J['waist'] = bound('Hips', 'Back'); J['chest'] = bound('Back', 'Upperback'); J['neck'] = bound('Upperback', 'Neck'); J['skull'] = bound('Neck', 'Head')
hm = np.where(W['Head'] > 0.5)[0]; J['crown'] = np.array([PA[hm, 0].mean(), PA[hm, 1].mean(), PA[hm, 2].max()])
for s in 'LR':
    J['clav' + s] = bound('Upperback', 'Shoulder.' + s); J['shoulder' + s] = bound('Shoulder.' + s, 'UperArm.' + s)
    J['elbow' + s] = bound('UperArm.' + s, 'LowerArm.' + s)
    tip = far('LowerArm.' + s, J['elbow' + s]); J['handtip' + s] = tip
    J['wrist' + s] = J['elbow' + s] + (tip - J['elbow' + s]) * 0.78
    J['hip' + s] = hipL if s == 'L' else hipR
    J['knee' + s] = bound('Leg.' + s, 'Calf.' + s); J['ankle' + s] = bound('Calf.' + s, 'Foot.' + s); J['ball' + s] = bound('Foot.' + s, 'Toes.' + s)
    J['toetip' + s] = far('Toes.' + s, J['ankle' + s])
if MODE == 'joints' and 'row' not in OPT:     # (with row=: the rows' joints, below)
    for k, v in J.items():
        log('joint %-10s (%6.1f %6.1f %6.1f)' % (k, *v))
    for a, b in (('hipL', 'kneeL'), ('kneeL', 'ankleL'), ('hipR', 'kneeR'), ('kneeR', 'ankleR'), ('shoulderL', 'elbowL'), ('elbowL', 'wristL'), ('shoulderR', 'elbowR'), ('elbowR', 'wristR')):
        log('length %-8s %-8s %.1f' % (a, b, np.linalg.norm(J[a] - J[b])))
    sys.exit(0)

# ------------------------------------------------------------------ the skeleton, found: bones named for the groups they skin
arm_d = bpy.data.armatures.new('Giant_Rig'); arm = bpy.data.objects.new('Giant_Rig', arm_d); scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
FRONT = Vector((0, -1, 0))
BONES = [    # (name, parent, head joint, tail joint)
    ('Hips', None, 'pelvis', 'waist'), ('Back', 'Hips', 'waist', 'chest'), ('Upperback', 'Back', 'chest', 'neck'), ('Neck', 'Upperback', 'neck', 'skull'), ('Head', 'Neck', 'skull', 'crown'),
]
for s in 'LR':
    BONES += [('Shoulder.' + s, 'Upperback', 'clav' + s, 'shoulder' + s), ('UperArm.' + s, 'Shoulder.' + s, 'shoulder' + s, 'elbow' + s),
              ('LowerArm.' + s, 'UperArm.' + s, 'elbow' + s, 'wrist' + s), ('Hand.' + s, 'LowerArm.' + s, 'wrist' + s, 'handtip' + s),
              ('Leg.' + s, 'Hips', 'hip' + s, 'knee' + s), ('Calf.' + s, 'Leg.' + s, 'knee' + s, 'ankle' + s),
              ('Foot.' + s, 'Calf.' + s, 'ankle' + s, 'ball' + s), ('Toes.' + s, 'Foot.' + s, 'ball' + s, 'toetip' + s)]
for name, parent, h, t in BONES:
    eb = arm_d.edit_bones.new(name); eb.head = V(J[h]); eb.tail = V(J[t])
    if parent:
        eb.parent = arm_d.edit_bones[parent]
    eb.align_roll(FRONT)
bpy.ops.object.mode_set(mode='OBJECT')
body.parent = arm; body.parent_type = 'OBJECT'; body.matrix_parent_inverse = Matrix.Identity(4)
amod = body.modifiers.new('Armature', 'ARMATURE'); amod.object = arm
for g in [g for g in body.vertex_groups if g.name not in arm_d.bones]:
    body.vertex_groups.remove(g)
# the club rides the right hand (she holds it raised)
club.parent = arm; club.parent_type = 'BONE'; club.parent_bone = 'Hand.R'
club.matrix_parent_inverse = (arm.matrix_world @ arm_d.bones['Hand.R'].matrix_local).inverted()
for m in club.modifiers:
    if m.type == 'SUBSURF':
        m.levels = 1; m.render_levels = 1
bpy.context.view_layer.update()
log('skeleton: %d bones; body skinned on %d groups; club on Hand.R' % (len(arm_d.bones), len(body.vertex_groups)))

if MODE == 'skin':      # each bone's points (weight > 0.5) that lie far from its own segment: a strand of cloth or a blade the neighbours' weights dragged to the wrong bone
    for name, parent, h, t in BONES:
        m = np.where(W[name] > float(OPT.get('thr', 0.5)))[0]
        if not len(m):
            log('skin %-12s no points above 0.5' % name); continue
        h_, t_ = np.array(J[h]), np.array(J[t]); d_ = t_ - h_; L2 = float(d_ @ d_)
        u = np.clip(((PA[m] - h_) @ d_) / L2, 0, 1); dist = np.linalg.norm(PA[m] - (h_ + u[:, None] * d_), axis=1)
        far_ = m[dist > float(OPT.get('r', 11))]
        log('skin %-12s %6d points, radius max %.1f, %d beyond %s%s' % (name, len(m), dist.max(), len(far_), OPT.get('r', 11),
            (' e.g. ' + str(PA[far_].mean(0).round(1))) if len(far_) else ''))
    sys.exit(0)


# ------------------------------------------------------------------ colour: onto the points (at rest)
nr = np.zeros(nv * 3); body.data.vertices.foreach_get('normal', nr); NA = nr.reshape(-1, 3)
Wg = lambda names: sum((W[n] for n in names if n in W), np.zeros(nv))
SKIN = ('#8f949a', '#6c727b')           # carved grey stone: a cool light grey blotched with a slate (Griz's wanted list: "grey skin like carved stone")
col, unsh = BL.paint_points(PA, dict(base=SKIN[0], base2=SKIN[1], split=1.5, fine=0.07, blotch=0.14, blotch_scale=0.09, seed=21))
lin = lambda h: np.array(BL.srgb2lin(h))
if MODE == 'diag':      # every point coloured by the group it weights most
    import colorsys
    dom = np.array([max(range(len(gname)), key=lambda k: W[gname[k]][i]) if any(W[g][i] > 0 for g in gname) else 0 for i in range(nv)])
    cmap = {n_: colorsys.hsv_to_rgb((i_ * 0.381966) % 1.0, 0.85, 0.9) for i_, n_ in enumerate(sorted(arm_d.bones.keys()))}
    domn = [max((W[g][i], g) for g in arm_d.bones.keys())[1] for i in range(nv)]
    for i in range(nv):
        col[i] = np.array(cmap[domn[i]]) ** 2.2
    for n_, c_ in cmap.items():
        log('diag %-12s #%02x%02x%02x  %d' % (n_, int(c_[0] * 255), int(c_[1] * 255), int(c_[2] * 255), sum(1 for d in domn if d == n_)))
# ---- the gear, found by region in the rest pose (the one file has the kilt, the wraps, the vest and the fur fused into the skin: no groups, no islands, no colour).
# Tuned by `-- close`/`-- look` with gdiag=1 (every mask in its own colour: kilt red, wraps yellow, vest green, fur blue, bracers magenta). A first guess: Griz's marks
# on a sprite sheet can correct it the way the troll's hair was (tools/troll-marks.json).
def seg_dist(P_, h, t):
    d_ = np.array(t) - np.array(h); u = np.clip(((P_ - np.array(h)) @ d_) / float(d_ @ d_), 0, 1)
    return np.linalg.norm(P_ - (np.array(h) + u[:, None] * d_), axis=1), u


Z = PA[:, 2]
dleg = np.minimum(seg_dist(PA, J['hipL'], J['kneeL'])[0], seg_dist(PA, J['hipR'], J['kneeR'])[0])
PEL = (W['Hips'] + W['Leg.L'] + W['Leg.R']) > 0.5
KILT = PEL & (Z < float(OPT.get('kz', 51.5))) & (((Z > 40) & (Z < 51.5)) | ((Z > 20.5) & (dleg > float(OPT.get('kr', 7.2)))))
WRAP = np.zeros(nv, bool)
for s_ in 'LR':
    dd, u_ = seg_dist(PA, J['ankle' + s_], J['knee' + s_]); WRAP |= (W['Calf.' + s_] > 0.5) & (u_ > 0.03) & (u_ < float(OPT.get('wu', 0.6)))
VEST = ((W['Back'] + W['Upperback'] + W['Shoulder.L'] + W['Shoulder.R']) > 0.5) & (Z > float(OPT.get('vz0', 56.5))) & (Z < float(OPT.get('vz1', 68.5))) & (NA[:, 1] < 0.85)
FUR = ((W['Shoulder.L'] + W['Shoulder.R']) > 0.5) & (Z > float(OPT.get('fz', 66.0)))
BRACER = np.zeros(nv, bool)
for s_ in 'LR':
    dd, u_ = seg_dist(PA, J['elbow' + s_], J['wrist' + s_]); BRACER |= (W['LowerArm.' + s_] > 0.5) & (u_ > 0.5) & (u_ < 0.8)
for nm_, m_ in (('kilt', KILT), ('wraps', WRAP), ('vest', VEST), ('fur', FUR), ('bracers', BRACER)):
    log('gear %-8s %6d points' % (nm_, int(m_.sum())))
LEATHER, LEATHER2, FURC, WRAPC = lin('#7a5a3a'), lin('#5b4129'), lin('#6e6252'), lin('#a58f6a')
if OPT.get('gdiag'):
    for m_, c_ in ((KILT, (1, 0, 0)), (WRAP, (1, 1, 0)), (VEST, (0, 1, 0)), (FUR, (0, 0.3, 1)), (BRACER, (1, 0, 1))):
        col[m_] = np.array(c_) ** 2.2
else:
    col[KILT] = col[KILT] * 0.1 + LEATHER[None, :] * 0.9 * (0.85 + 0.3 * np.clip((Z[KILT] - 20) / 30, 0, 1))[:, None]
    col[WRAP] = col[WRAP] * 0.1 + WRAPC[None, :] * 0.9
    col[VEST] = col[VEST] * 0.1 + LEATHER2[None, :] * 0.9
    col[FUR] = col[FUR] * 0.1 + FURC[None, :] * 0.9
    col[BRACER] = col[BRACER] * 0.1 + LEATHER2[None, :] * 0.9
BL.write_points(body, np.maximum(col, 0), unsh)
BL.toon_material(body)
CLUBC = np.array(BL.srgb2lin('#6b5236'))
club_me = club.data
cc = np.zeros(len(club_me.vertices) * 3); club_me.vertices.foreach_get('co', cc); cc = cc.reshape(-1, 3)
ccol, cun = BL.paint_points(cc, dict(base='#6b5236', base2='#4a3826', split=1.2, fine=0.06, blotch=0.2, blotch_scale=0.2, seed=5))
BL.write_points(club, np.maximum(ccol, 0), cun)
BL.toon_material(club)

# the footprint: a disc the size of the print base (three squares), round the foot's middle, at the ground -- render-sprites.py sizes and seats it by this (size_by)
k = 32; rr = FOOT_D / 2
fme = bpy.data.meshes.new('Giant_Foot'); fme.from_pydata([(rr * math.cos(TAU * i / k), rr * math.sin(TAU * i / k), FLOOR) for i in range(k)], [], [tuple(range(k))])
foot = bpy.data.objects.new('Giant_Foot', fme); scene.collection.objects.link(foot)
foot.parent = arm; foot.matrix_parent_inverse = Matrix.Identity(4); foot.hide_render = True


# ------------------------------------------------------------------ the poser (tools/blender_pose.py: what a frame's numbers mean) and her stance
# (the bend test and the group diagnostic run on the bare skeleton: their own bone turns would fight the keyed rows)
if MODE in ('bend', 'diag'):
    arm.animation_data_clear()
else:
    BN = arm_d.bones
    R = BP.Rig(arm, body, dict(spine=['Back', 'Upperback'], neck=['Neck'], head='Head', jaw=None,
                               arm_a=['Shoulder.L', 'UperArm.L', 'LowerArm.L', 'Hand.L'], arm_b=['Shoulder.R', 'UperArm.R', 'LowerArm.R', 'Hand.R'],
                               leg_a=[None, 'Leg.L', 'Calf.L', 'Foot.L', 'Toes.L', 'Toes.L'], leg_b=[None, 'Leg.R', 'Calf.R', 'Foot.R', 'Toes.R', 'Toes.R'],
                               fing_a=[], fing_b=[], roots=['Hips']), log='[stonegiant]')
    chain, POSE0, REST, ANK0 = R.chain, R.POSE0, R.REST, R.ANK0
    apply, grounded, posed_points, lowest = R.apply, R.grounded, R.posed_points, R.lowest
    Q, PX, PY, PZ, S, TAU, lerp, mix = BP.Q, BP.PX, BP.PY, BP.PZ, BP.S, BP.TAU, BP.lerp, BP.mix
    FLOOR = R.ground()



if MODE not in ('bend', 'diag'):
    # ---------------------------------------------------------------- her stance: the frame every row starts and ends on
    # upright, a giant and not a hunched troll: the miniature's stride and lean taken out (the pelvis squared against the hips' yaw, the spine and head stood up),
    # the feet side by side under the hips, her left (+X) arm hanging, the club carried low at her right side (the right wrist by her hip, the fist turned so
    # the club trails back and down). Numbers are read off `-- poses <tag> rows=IDLE view=side|front`.
    ST = dict(lift=float(OPT.get('slift', 4.5)), shift=float(OPT.get('sshift', -2.0)), bodyyaw=-13.0, twist=5.0, lean=-float(OPT.get('slean', 12)), head=float(OPT.get('shead', -2)), hyaw=-3.0,
              shupa=0.0, shupb=-float(OPT.get('shdrop', 14)))
    FA, FB = (float(OPT.get('fx', 8.5)), float(OPT.get('fya', 1.0))), (-float(OPT.get('fx', 8.5)), float(OPT.get('fyb', -1.0)))     # the ankles standing (x, y)
    WA, WB = (3.0, -3.0, -19.0), (-3.0, -4.0, -18.5)             # the wrists hanging, from the shoulders (world axes)
    CLUB0 = (-0.45, 0.62, -0.64)                                  # the club carried low at her right: pointing back, out to her right and down, its head near the ground

    # ---- the club: it rides Hand.R rigidly, so the fist's aim IS the club's aim. Rows say which way the club points (world axes: +X her left, +Y behind her, +Z up) and
    # clubaim() finds the fist aim that gives it, through the same two numbers aim() uses (the turn her arm has already taken, A, and the minimal turn that follows)
    cp = np.array([list(v.co) for v in club.data.vertices]); wr0 = np.array(J['wristR'])
    ca = cp[np.argmin(np.linalg.norm(cp - wr0, axis=1))]; ch = cp[np.argmax(np.linalg.norm(cp - ca, axis=1))]
    C0 = Vector(tuple(float(x) for x in (ch - ca) / np.linalg.norm(ch - ca)))      # the club's own axis at rest: from its grip to its head
    CLUBLEN = float(np.linalg.norm(ch - ca))
    SPH = [Vector((math.cos(2.399963 * i) * math.sqrt(1 - z * z), math.sin(2.399963 * i) * math.sqrt(1 - z * z), z)) for i, z in ((i, 1 - 2 * (i + 0.5) / 3000) for i in range(3000))]
    log('the club: %.1f long, its axis at rest %s' % (CLUBLEN, tuple(round(x, 2) for x in C0)))

    def clubaim(P, c):
        """P with its right fist aimed so the club points along c (a world vector)."""
        P2 = {k_: v for k_, v in P.items() if k_ != 'hands'}
        d, _, _, _ = R.pose_d(P2); A = R.accG(d, 'LowerArm.R'); Ai = A.inverted(); pd = R.dir0('Hand.R').normalized(); c = Vector(c).normalized()
        f = lambda T: ((A @ pd.rotation_difference(Ai @ T)) @ C0 - c).length
        T = min(SPH, key=f); e = f(T)
        import random
        rnd = random.Random(1); step = 0.12
        for _ in range(300):
            T2 = (T + Vector((rnd.gauss(0, step), rnd.gauss(0, step), rnd.gauss(0, step)))).normalized(); e2 = f(T2)
            if e2 < e: T, e = T2, e2
            step = max(step * 0.985, 0.004)
        P2['hands'] = dict(P.get('hands') or {}); P2['hands']['b'] = tuple(round(x, 4) for x in T); P2['_cerr'] = round(e, 3)
        return P2

    def stance(club=None, **k):
        P = R.stance(ST, FA, FB, WA, WB, k)
        return clubaim(P, club if club is not None else CLUB0)

    def row_idle(i, n):
        """breath: the chest rises and the shoulders ease, the weight shifts a little, the head turns to look about; the club hangs."""
        t = i / n; w = TAU * t; b = 0.5 * (1 - math.cos(w))       # (b: 0 at the first frame, its lowest: the render seats it there)
        return stance(lift=ST['lift'] + 0.5 * b, lean=ST['lean'] + 1.5 * b, head=ST['head'] - 2 * b, hyaw=ST['hyaw'] + 5 * S(w), twist=ST['twist'] + 1.5 * S(w),
                      wa=lerp(WA, (3.5, -3.0, -18.7), b), wb=lerp(WB, (-3.5, -4.0, -18.2), b)), 0

    def row_walk(i, n):
        """a long unhurried stride (a giant's: the feet planted, each slides back under her on the ground and swings through lifted), the hips bob and sway, the
        pelvis turns with the forward leg and the shoulders against it; the left arm swings against the left leg, the right swings the club a little."""
        t = i / n; c = math.cos(TAU * t); s_ = S(TAU * t)
        SL = float(OPT.get('stride', 26))

        def foot(ph, base):
            ph %= 1.0
            if ph <= 0.5:                                # on the ground: from the front to the back
                y = -SL / 2 + SL * ph / 0.5; up = 0.0
                pitch = [-12, 0, 0, 6, 26][int(round(ph * 8))]
            else:                                        # swung through, lifted
                k = (ph - 0.5) / 0.5; y = SL / 2 - SL * k; up = 7.0 * S(math.pi * k)
                pitch = [26, 20, 0, -10][int(round(ph * 8)) - 4]
            return (base[0] * 0.9, base[1] * 0.3 + y, up, 4.0, pitch)
        bob = [-0.5, -1.7, 0.3, 1.1][i % 4]
        P = stance(lift=float(OPT.get('wlift', 2.6)) + bob, sway=1.2 * S(TAU * t + 1.0), lean=ST['lean'] + 8, head=ST['head'] + 3 - 1.5 * bob,
                   bodyyaw=ST['bodyyaw'] - 6 * c, twist=ST['twist'] + 10 * c, hyaw=ST['hyaw'] - 5 * c,
                   fa=foot(t, FA), fb=foot(t + 0.5, FB),
                   wa=(3.0, -3.0 + 9 * c, -19.0 + 2 * max(0, -c)), wb=(-3.0, -4.0 - 5 * c, -18.5 + 1.5 * max(0, c)),
                   club=(-0.45, 0.62 + 0.15 * c, -0.64 + 0.1 * s_))
        return P, 0

    def blow(F):
        """a row from a list of frames, each a dict: wb/wa wrists from the shoulders, club the club's aim, fa/fb the feet (x, y, up, yaw, pitch) as offsets from the stance's,
        and anything else a bend of the stance (lean, twist, bodyyaw, head, hyaw, lift, shift)."""
        def f(i, n):
            k = dict(F[i]); club = k.pop('club', None)
            for s_, base in (('fa', FA), ('fb', FB)):
                if s_ in k:
                    o = k[s_]; k[s_] = (base[0] + o[0], base[1] + o[1], o[2], o[3], o[4])
            return stance(club=club, **k), 0
        return f

    L0, T0, H0, Y0, Z0 = ST['lean'], ST['twist'], ST['head'], ST['bodyyaw'], ST['lift']
    # the overhead smash: the club drawn back and up over her right shoulder, held high, then brought down in front of her as she steps in and bends to it
    SMASH = [dict(),
             dict(lean=L0 - 8, head=H0 - 4, twist=T0 - 10, wb=(-5, 4, 12), wa=(5, -6, -12), club=(-0.3, 0.5, 0.8), lift=Z0 - 0.3),
             dict(lean=L0 - 16, head=H0 - 8, twist=T0 - 14, wb=(-3, 8, 19), wa=(6, -9, -8), club=(-0.1, 0.35, 0.93), lift=Z0 + 0.5, fa=(0, -3, 0, 0, 0)),
             dict(lean=L0 - 2, head=H0, twist=T0 - 2, wb=(-3, -2, 20), wa=(5, -8, -6), club=(-0.05, -0.2, 0.98), lift=Z0 - 1.5, fa=(0, -9, 0, 0, 0)),
             dict(lean=L0 + 30, head=H0 + 8, twist=T0 + 8, wb=(-2, -15, -8), wa=(4, -10, -14), club=(0.0, -0.62, -0.78), lift=Z0 - 9, shift=-3,
                  fa=(0, -13, 0, 0, 0), fb=(0, 4, 0, 0, 14), kpolea=(0.2, -1, 0.1)),
             dict(lean=L0 + 33, head=H0 + 10, twist=T0 + 10, wb=(-2, -16, -10), wa=(4, -10, -14), club=(0.0, -0.7, -0.7), lift=Z0 - 9.5, shift=-3.5,
                  fa=(0, -13, 0, 0, 0), fb=(0, 4, 0, 0, 14), kpolea=(0.2, -1, 0.1)),
             dict(lean=L0 + 18, head=H0 + 4, twist=T0 + 4, wb=(-3, -10, -14), wa=(3, -6, -16), club=(-0.25, -0.2, -0.95), lift=Z0 - 5, shift=-1.5,
                  fa=(0, -9, 0, 0, 0), fb=(0, 2, 0, 0, 6)),
             dict(lean=L0 + 6, wb=(-3, -6, -17), wa=(3, -4, -18), club=(-0.4, 0.2, -0.88), lift=Z0 - 2, shift=-0.8, fa=(0, -4, 0, 0, 0))]
    # the sweep: the club taken out to her right and back, swung flat across in front of her at the waist to her left, her body turning through it
    SWEEP = [dict(),
             dict(lean=L0 - 3, twist=T0 - 12, bodyyaw=Y0 - 6, wb=(-12, 7, -8), wa=(7, -9, -10), club=(-0.55, 0.82, 0.12), lift=Z0 - 1, hyaw=ST['hyaw'] + 4),
             dict(lean=L0 - 2, twist=T0 - 22, bodyyaw=Y0 - 10, wb=(-15, 12, -9), wa=(8, -10, -9), club=(-0.9, 0.42, 0.1), lift=Z0 - 2, hyaw=ST['hyaw'] + 10,
                  fa=(2, -2, 0, 0, 0), fb=(-2, 4, 0, 0, 0)),
             dict(lean=L0 + 4, twist=T0 - 8, bodyyaw=Y0 - 2, wb=(-13, -3, -10), wa=(6, -9, -9), club=(-0.8, -0.58, 0.1), lift=Z0 - 3, hyaw=ST['hyaw'] + 4,
                  fa=(0, -5, 0, 0, 0)),
             dict(lean=L0 + 10, twist=T0 + 8, bodyyaw=Y0 + 4, wb=(-7, -16, -11), wa=(4, -8, -10), club=(-0.15, -1.0, 0.05), lift=Z0 - 4, hyaw=ST['hyaw'] - 6,
                  fa=(0, -10, 0, 0, 0), fb=(0, 3, 0, 0, 6)),
             dict(lean=L0 + 10, twist=T0 + 24, bodyyaw=Y0 + 12, wb=(2, -14, -11), wa=(8, -4, -8), club=(0.9, -0.4, 0.05), lift=Z0 - 4, hyaw=ST['hyaw'] - 16,
                  fa=(0, -10, 0, 0, 0), fb=(0, 3, 0, 0, 6)),
             dict(lean=L0 + 8, twist=T0 + 30, bodyyaw=Y0 + 14, wb=(6, -9, -11), wa=(9, 0, -8), club=(0.95, 0.15, -0.1), lift=Z0 - 3.5, hyaw=ST['hyaw'] - 20,
                  fa=(0, -9, 0, 0, 0), fb=(0, 3, 0, 0, 4)),
             dict(lean=L0 + 3, twist=T0 + 14, bodyyaw=Y0 + 5, wb=(-2, -5, -15), wa=(5, -4, -16), club=(0.5, 0.45, -0.7), lift=Z0 - 1.5, hyaw=ST['hyaw'] - 8, fa=(0, -4, 0, 0, 0))]
    # the rock: scooped up in her left hand, cocked back over her shoulder, thrown overhand; the club stays low in her right
    ROCK = [dict(),
            dict(lean=L0 + 14, head=H0 + 6, wa=(4, -11, -17), lift=Z0 - 4, shift=-1.5, fa=(0, -2, 0, 0, 0)),
            dict(lean=L0 - 4, head=H0 - 3, twist=T0 + 14, wa=(7, 9, -4), lift=Z0 - 0.5),
            dict(lean=L0 - 14, head=H0 - 8, twist=T0 + 22, wa=(5, 8, 19), lift=Z0 + 0.3, fa=(0, 2, 0, 0, 0)),
            dict(lean=L0 + 8, head=H0 + 3, twist=T0 - 4, wa=(2, -16, 17), lift=Z0 - 2.5, fa=(0, -10, 0, 0, 0), fb=(0, 3, 0, 0, 8)),
            dict(lean=L0 + 22, head=H0 + 8, twist=T0 - 16, wa=(-5, -15, -8), lift=Z0 - 4, fa=(0, -10, 0, 0, 0), fb=(0, 3, 0, 0, 10)),
            dict(lean=L0 + 10, twist=T0 - 8, wa=(0, -10, -14), lift=Z0 - 2, fa=(0, -6, 0, 0, 0)),
            dict(lean=L0 + 3, twist=T0 - 2, wa=(2, -5, -18), lift=Z0 - 0.8, fa=(0, -2, 0, 0, 0))]

    def row_flinch(i, n):
        """struck: thrown back on her heels, the head snapped back, the arms flung out and the club swung with them, then she settles."""
        p = [0.0, 1.0, 0.75, 0.4, 0.1][i]
        return stance(lean=L0 - 16 * p, head=H0 - 14 * p, hyaw=ST['hyaw'] + 12 * p, twist=T0 + 8 * p, shift=3 * p, lift=Z0 - 1.2 * p,
                      wa=lerp(WA, (9, 3, -9), p), wb=lerp(WB, (-9, 3, -9), p), club=tuple(lerp(CLUB0, (-0.6, 0.55, -0.2), p))), 0

    ROWS = [('IDLE', 8, True, row_idle, 'ik'), ('WALK', 8, True, row_walk, 'ik'), ('GREATCLUB', 8, False, blow(SMASH), 'ik'), ('GREATCLUB2', 8, False, blow(SWEEP), 'ik'),
            ('ROCK', 8, False, blow(ROCK), 'ik'), ('FLINCH', 5, False, row_flinch, 'ik')]
    def bake(P):
        """a lying frame (gravity's `lie`) said again as limbs PLACED: each ankle, wrist, knee and elbow where the fall left it, so the poser page (which poses by placed limbs,
        not by `lie`) shows the same frame, with handles on every limb, and the page's parity with Blender holds."""
        d, lift, shift, sway = R.pose_d(P); _, M = R.solve(d, lift, shift, sway, mats=True)
        Pb = {k_: v for k_, v in P.items() if k_ not in ('lie', 'lieside', 'liefall')}; legs, arms = {}, {}
        for s_ in 'ab':
            Lg, Am = R.LEG[s_], R.ARM[s_]
            hip, knee = M[Lg[1]].translation, M[Lg[2]].translation; ank = M[Lg[2]] @ Vector((0, BN[Lg[2]].length, 0))
            F0 = R.FOOT[s_][0]; Rw = (M[F0].to_3x3() @ R.POSE0[F0].to_3x3().inverted()).to_quaternion(); best = None
            for yaw in range(-90, 91, 6):
                for pitch in range(-110, 111, 6):
                    e = R.foot_turn(s_, yaw, pitch).rotation_difference(Rw).angle
                    if best is None or e < best[0]:
                        best = (e, yaw, pitch)
            up = R.foot_raise(s_, R.foot_turn(s_, best[1], best[2]))
            legs[s_] = (round(ank.x, 3), round(ank.y, 3), round(ank.z - up, 3), best[1], best[2]); Pb['kpole' + s_] = tuple(round(x, 3) for x in (knee - hip))
            sh = M[Am[1]].translation; wr = M[Am[2]] @ Vector((0, BN[Am[2]].length, 0))
            arms[s_] = tuple(round(x, 3) for x in (wr - sh)); Pb['epole' + s_] = tuple(round(x, 3) for x in (M[Am[2]].translation - sh))
        Pb['legs'], Pb['arms'] = legs, arms
        return Pb

    GRP = {g.index: g.name for g in body.vertex_groups}
    DOM = np.array([GRP[max(v.groups, key=lambda g_: g_.weight).group] if v.groups else '' for v in body.data.vertices])
    BODYM = np.isin(DOM, ['Hips', 'Back', 'Upperback', 'Leg.L', 'Leg.R', 'Calf.L', 'Calf.R'])
    ARMM = {'a': np.isin(DOM, ['UperArm.L', 'LowerArm.L', 'Hand.L']), 'b': np.isin(DOM, ['UperArm.R', 'LowerArm.R', 'Hand.R'])}
    HEADM = np.isin(DOM, ['Neck', 'Head'])

    def settle(P):
        """a lying frame rests on her body (10-04, Griz: "see the hip elevation" -- planted on whatever was lowest, she lay on one hand with her hips and legs
        held up in the air): her trunk and legs set down on the floor, then an arm that went under it lifted back onto it, and a face that went under turned up."""
        P = dict(P)
        for _ in range(3):
            R.apply(P); pp = R.posed_points(1); dz = FLOOR + 0.4 - float(pp[BODYM, 2].min())
            if abs(dz) > 0.25:
                P['lift'] = P.get('lift', 0.0) + dz; P['legs'] = {s_: (l[0], l[1], l[2] + dz, l[3], l[4]) for s_, l in P['legs'].items()}
        R.apply(P); pp = R.posed_points(1)
        for s_ in 'ab':
            u_ = FLOOR + 0.4 - float(pp[ARMM[s_], 2].min())
            if u_ > 0:
                x_, y_, z_ = P['arms'][s_]; P['arms'] = dict(P['arms']); P['arms'][s_] = (x_, y_, z_ + u_)
        for _ in range(12):
            R.apply(P); pp = R.posed_points(1)
            if float(pp[HEADM, 2].min()) >= FLOOR - 0.3:
                break
            P['head'] = P.get('head', 0.0) - 4      # (+ turns the front down: a face down on the floor lifts by turning up)
        return P

    def lying(kind, body, fl, club, **k):
        """a frame of the fall, on bends and gravity alone (no feet to plant): the body over about the hip, the limbs laid on the floor by `lie` (kind 'back' or 'face', fl of the
        way), then said again as placed limbs (`bake`), the club aimed. Grounded by 'plant': whatever is lowest rests on the floor."""
        P = dict(body=body, lie=kind, lieside=1.0, liefall=fl, shupb=ST['shupb'])
        P.update(k)
        P = R.grounded(dict(P, _tag='lying'), 'plant'); P.pop('_tag')      # (seated on the floor FIRST: placed ankles are world positions, they would not follow a lift made after)
        return clubaim(settle(bake(P)), club)

    def row_prone(i, n):
        """knocked over on her back (gravity): thrown back on her heels, she goes over, the arms and legs let go on the floor, the club slid out beside her; she lies at her last
        frame and gets up by the row played backwards (so the middle frames are a fall, not a blur)."""
        if i == 0:
            return stance(), 0
        if i == 1:
            return stance(lean=L0 - 22, head=H0 - 16, shift=4, lift=Z0 - 1.5, wa=(8, 4, -8), wb=(-8, 4, -8), fa=(FA[0], FA[1] - 2, 0, 0, 0), fb=(FB[0], FB[1] + 3, 0, 0, 18),
                          club=(-0.7, 0.5, -0.3)), 0
        j = i - 2
        return lying('back', [-42, -70, -92, -94][j], [0.3, 0.7, 1.0, 1.0][j], (-0.95, 0.3, -0.05), lean=[-14, -10, -12, -14][j], head=[-12, -14, -16, -18][j], hyaw=[2, 4, 8, 10][j],
                     twist=0, bodyyaw=0), 0

    def row_death(i, n):
        """slain: staggered, her knees give and she drops onto them, tips forward with her hands out, and goes down on her face, the club flung from her hand."""
        if i == 0:
            return stance(), 0
        if i == 1:
            return stance(lean=L0 - 12, head=H0 - 12, shift=2.5, lift=Z0 - 1.5, wa=(9, 0, -9), wb=(-9, 2, -8), club=(-0.7, 0.45, -0.3)), 0
        if i == 2:
            return stance(lean=L0 + 4, head=H0 + 6, lift=Z0 - 11, shift=-1, wa=(5, -4, -17), wb=(-5, -3, -16), fa=(0, 6, 0, 0, 14), fb=(0, 6, 0, 0, 14), club=(-0.5, 0.5, -0.7),
                          kpolea=(0.1, -1, 0.2), kpoleb=(-0.1, -1, 0.2)), 0
        if i == 3:
            return stance(lean=L0 + 18, head=H0 + 10, lift=Z0 - 24, shift=-6, wa=(5, -9, -12), wb=(-5, -9, -12), fa=(0, 12, 3, 0, 62), fb=(0, 12, 3, 0, 62), club=(-0.6, 0.3, -0.7),
                          kpolea=(0.0, -1, -0.5), kpoleb=(0.0, -1, -0.5)), 0
        j = i - 4
        return lying('face', [30, 62, 88, 92][j], [0.0, 0.5, 1.0, 1.0][j], (-0.8, -0.5, -0.1), lean=[8, 4, 2, 0][j], head=[-6, -14, -24, -30][j], hroll=[0, -20, -50, -55][j],
                     twist=0, bodyyaw=0), 0

    def row_climb(i, n):
        """climbing a face in front of her, in place (the engine raises her up it; js/battle.js tween 'climb'): hand over hand, her left hand and right foot
        reaching while the other two pull and push, then the other way; leaning in, looking up; the club hangs down her back from her right fist.
        (10-04, Griz: "climbing poses - might use them as stand in for the edifice fight the other window is building")"""
        t = i / n

        def limb(ph):            # (height up its stroke 0..1, how far off the wall): pulling down past her for half the cycle, then reaching up off the wall for the next hold
            ph %= 1.0
            if ph < 0.5:
                return 1 - ph / 0.5, 0.0
            h = (ph - 0.5) / 0.5
            return h, math.sin(math.pi * h)
        (ha, oa), (hb, ob) = limb(t), limb(t + 0.5)
        (fa_, ofa), (fb_, ofb) = limb(t + 0.5), limb(t)      # (each foot with the opposite hand)
        return stance(lean=L0 + 24, head=H0 - 28, lift=Z0 + 3 + 0.6 * S(TAU * t * 2), shift=-3, twist=T0 + 6 * S(TAU * t),
                      wa=(8, -11 + 4 * oa, -8 + 30 * ha), wb=(-8, -11 + 4 * ob, -8 + 30 * hb),
                      fa=(FA[0], -9 + 4 * ofa, 2 + 22 * fa_, 0, -10 * fa_), fb=(FB[0], -9 + 4 * ofb, 2 + 22 * fb_, 0, -10 * fb_),
                      kpolea=(0.3, -1, 0.4), kpoleb=(-0.3, -1, 0.4), epolea=(0.8, 0.6, -0.4), epoleb=(-0.8, 0.6, -0.4), club=(-0.25, 0.55, -0.8)), 0

    ROWS += [('PRONE', 6, False, row_prone, 'ik'), ('HURT', 8, False, row_death, 'ik'), ('CLIMB', 8, True, row_climb, 'ik')]
    EDITS = os.path.join(ROOT, 'tools', 'stonegiant-poses.json')       # the frames Griz set on the poser page (tools/poser.html), taken in: they win over the script's
    if not OPT.get('noedits'):
        ROWS = R.with_edits(ROWS, OPT.get('edits', EDITS))
    ad = R.key_rows(ROWS); use = R.use
    use('IDLE'); bpy.context.scene.frame_set(1)
    log('rows: %s' % ', '.join(r_[0] for r_ in ROWS))

    if MODE == 'joints':    # each frame's joints above the floor, and what went under it (-- joints row=GREATCLUB)
        r_ = [r for r in ROWS if r[0] == OPT.get('row', 'IDLE')][0]
        R.joints(scene, r_[0], r_[1], extra=[('club', 'Hand.R^')]); sys.exit(0)
    if MODE == 'exec':      # a scratch script run in this namespace (-- exec file=<path>)
        exec(open(OPT['file']).read()); sys.exit(0)
    if MODE == 'poser':     # the poser page's data (tools/poser.html?fig=stonegiant): the bones, the mesh (thinned to 40k points for the page) with its weights and colour, every row's frames, the club riding her hand
        import ast, re
        FIG = json.load(open(os.path.join(ROOT, 'tools', 'deep16-figures.json'), encoding='utf-8'))['figures']['stonegiant']
        FPS_ = ast.literal_eval(re.search(r'^FPS = (\{.*?\})', open(os.path.join(ROOT, 'tools', 'pixelate.py'), encoding='utf-8').read(), re.M).group(1))
        R.export_poser(os.path.join(SRC, 'poser.json'), ROWS, col=col, engine={v: k for k, v in FIG['anims'].items()}, fps=FPS_, fig='stonegiant', extras=[(club, '#6b5236')])
        sys.exit(0)
    if MODE == 'build':
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SRC, 'stonegiant.blend'))
        log('built: %s (rows %s)' % (os.path.join(SRC, 'stonegiant.blend'), ', '.join(r_[0] for r_ in ROWS))); sys.exit(0)


# ------------------------------------------------------------------ look tests, the skin test
def stand_camera():
    k = BL.UPS * SQ_H / FOOT_D
    arm.scale = (k, k, k); arm.location = (0, 0, -FLOOR * k); bpy.context.view_layer.update()
    R_ = 1.3 * BL.UPS * SQ_H
    lo, hi = Vector((-R_, -R_, 0)), Vector((R_, R_, 96 * k))
    return BL.sprite_camera(scene, lo, hi)


def rotw(name, axis, deg):
    """turn one bone about its head by a rotation in WORLD axes (its ancestors unposed): the pose basis is R_rest^-1 Rw R_rest."""
    pb = arm.pose.bones[name]; pb.rotation_mode = 'QUATERNION'
    Rr = arm_d.bones[name].matrix_local.to_quaternion()
    pb.rotation_quaternion = Rr.inverted() @ Quaternion(Vector(axis).normalized(), math.radians(deg)) @ Rr @ pb.rotation_quaternion


if MODE in ('look', 'close', 'bend', 'diag', 'poses'):
    cam, FW, FH, AX, AY = stand_camera()
    r = scene.render
    od = os.path.join(SRC, 'look_out', TAG); os.makedirs(od, exist_ok=True)
    r.film_transparent = True; r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
    if MODE in ('bend', 'diag'):
        r.engine = 'BLENDER_WORKBENCH'; scene.display.shading.light = 'MATCAP' if MODE == 'bend' else 'FLAT'
        if MODE == 'diag':
            scene.display.shading.color_type = 'VERTEX'
        BP.flat_camera(scene, OPT.get('view', 'front'), float(OPT.get('zoom', 7.0)))
        r.resolution_x = r.resolution_y = int(OPT.get('px', 700))
        views = [OPT['view']] if OPT.get('view') else ['front', 'side']
        tests = [('rest', [])] if MODE == 'diag' else [('rest', []), ('bent', [('Calf.R', (1, 0, 0), 55), ('Calf.L', (1, 0, 0), 40), ('LowerArm.L', (1, 0, 0), -70), ('UperArm.L', (0, 0, 1), 35), ('Head', (0, 0, 1), 40), ('Back', (1, 0, 0), 25)])]
        for vw in views:
            fc = BP.flat_camera(scene, vw, float(OPT.get('zoom', 7.0)))
            if OPT.get('cz'):       # centre the view on a height (the figure's own units) and a lateral offset cx: a close look at one limb
                fc.location.z = float(OPT['cz']) * arm.scale[0]; fc.location.x += float(OPT.get('cx', 0)) * arm.scale[0] if vw == 'front' else 0
                if vw == 'side': fc.location.y = float(OPT.get('cy', 0)) * arm.scale[0]
            for nm, turns in tests:
                if OPT.get('only'):
                    turns = [t_ for t_ in turns if t_[0] in OPT['only'].split(',')]
                for pb in arm.pose.bones:
                    pb.rotation_quaternion = Quaternion()
                for b_, ax_, dg_ in turns:
                    rotw(b_, ax_, dg_)
                bpy.context.view_layer.update()
                r.filepath = os.path.join(od, '%s_%s_%s.png' % (MODE, vw, nm)); bpy.ops.render.render(write_still=True)
        log('%s %s done' % (MODE, TAG)); sys.exit(0)
    r.resolution_x, r.resolution_y, r.resolution_percentage = FW * BL.SS, FH * BL.SS, 100
    if MODE == 'poses':
        r.engine = 'BLENDER_WORKBENCH'; scene.display.shading.light = 'MATCAP'
        r.resolution_x, r.resolution_y, r.resolution_percentage = FW * 2, FH * 2, 100
        facings = [int(x) for x in OPT.get('facings', '0,6').split(',')]
        if OPT.get('view') in ('side', 'front'):     # a flat view (a true profile from her right, or from the front): to pose by, not the sprite's
            BP.flat_camera(scene, OPT['view'], float(OPT.get('zoom', 7.0)))
            r.resolution_x = r.resolution_y = int(OPT.get('px', 480)); facings = [1]
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
        log('poses %s done' % TAG); sys.exit(0)
    if MODE == 'close':
        arm.rotation_euler.z = math.radians(45 - 45 * int(OPT.get('face', 0))); bpy.context.view_layer.update()
        kk = arm.scale[0]; at = OPT.get('at', 'head')
        tgt = {'head': J['skull'] + Vector((0, 0, 3)) * 0, 'chest': J['chest'], 'hips': J['pelvis'], 'club': J['wristR']}[at]
        hc = arm.matrix_world @ V(tgt)
        back = cam.matrix_world.to_3x3() @ Vector((0, 0, 1))
        cam.location = hc + back * 40; cam.data.ortho_scale = float(OPT.get('zoom', 26)) * kk; r.resolution_x = r.resolution_y = 800
    BL.light(scene, cam, PRESET)
    shots = [(0, 'f0_00'), (6, 'f6_00')] if MODE == 'look' else [(int(OPT.get('face', 0)), 'f0_00')]
    for f, fn in shots:
        arm.rotation_euler.z = math.radians(45 - 45 * f)
        r.filepath = os.path.join(od, fn + '.png'); bpy.ops.render.render(write_still=True)
    json.dump({'figure': 'stonegiant', 'tag': TAG, 'ss': BL.SS, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'facings': [0, 6]}, open(os.path.join(od, 'meta.json'), 'w'), indent=1)
    log('look %s done' % TAG)
    sys.exit(0)

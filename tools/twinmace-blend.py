"""The mannequin's TWIN STRIKE with two maces (11-12): the second family of pose references for the art desk to skin, after the one-handed
slash (tools/mannequin-blend.py, 10-31). Griz, 11-12: "pyro is going to need twin-strike for his maces. I'm thinking twin-strikes will vary by
weapon type. Pyro with two maces would draw back raising both arms while reeling in the elbows to extend a straight swing that would bash both
the left and right shoulders of a stationary humanoid mannequin - whereas a scimitar twin-strike the wrists would turn out as the arms raised
and the strike would be more like an X in front of him." And on the figure: "look at the mannequin (joint articulation, wrist and ankles would
help as I recall it)".

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python tools/twinmace-blend.py -- build [hero=barley_p3] [ss=8]
    ... -- poser        the same, and deep16/_src/twinmace/poser.json for tools/poser.html?fig=twinmace (gitignored)
    ... -- hit          no renders: where each mace's head is at THE HIT against the target's shoulders, and each wrist's angle
    ... -- poser build=dwarf target=0     the DWARF-proportioned striker and no target (his 11-12: "remove the mannequin target and do a set
                        with the position mannequin with dwarf proportions"): deep16/_src/twinmace-dwarf/, tools/poser.html?fig=twinmace-dwarf;
                        sized to pyro_p0's idle unless hero= says otherwise

Then `python tools/twinmace-sheet.py` lays the reference strips (deep16/art-src/twinmace/).

What is new on the slash's mannequin (its bones, capsules and colours are tools/mannequin-blend.py's, imported):
  - BOTH hands are fists on a wrist: each hand runs on from the wrist along the forearm to the fist, its hand bone starts at the fist and points
    along the weapon, and each mace sits LOCK degrees off its forearm on every frame (the wrists lock; his word on the first pass).
  - The wrists and the ankles are MARKED: a yellow ball at each, so the joint reads on the page and the art desk sees the hand turn on the
    forearm and the foot on the shin. The ankles work in this row: the heels come up at the top of the draw (legs' `pitch`) and drop at the hit.
  - A mace in each fist: a dark haft and a round head, his LEFT mace's head gold and his RIGHT's magenta (the sides must read: the cutter mirrors).
  - THE TARGET: a pale standing figure in front of him, facing him -- "a stationary humanoid mannequin" -- a pad on each shoulder. It rides a
    bone of its own that the hips' moves leave alone (blender_pose's `still`), so it stands where it stands in Blender and on the poser page.
    It is in the modeling renders and the poser; the sprite cells (render/<row>/) are the striker alone.

Rows (blender_pose frames: the feet placed, each wrist placed from its shoulder, each hand aimed along a world direction, the elbows' poles):
    IDLE 1      the stance, both maces lowered, heads forward and down.
    TWINMACE 6  1 POSITION ONE (both maces up in front; the wrists set here and LOCKED for the whole row), 2 hands to the ears (the elbows fold,
                the shoulders raise the arms; the heads go back over the shoulders), 3 the shoulders further up as the torso starts forward and
                the knees lower it, 4 THE STRIKE (the release frame, index 3: the elbows extend and the shoulders come down, a head on each of
                the target's shoulders, the hips and legs already pulling the torso back), 5 on the way back, 6 nearly idle. 12 fps.
"""
import bpy, bmesh, sys, os, math, json, importlib.util
import numpy as np
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, 'deep16', '_src', 'twinmace')


def _load(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', file))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


MQ = _load('mannequin_blend', 'mannequin-blend.py')      # (builds nothing on import: its bones, pieces, camera and measures)
BP = MQ.BP
U, lin, FACINGS, PAD, K = MQ.U, MQ.lin, MQ.FACINGS, MQ.PAD, MQ.K
MODE, SS = MQ.MODE, MQ.SS
LOG = '[twinmace]'
DWARF = MQ.OPT.get('build', 'human') == 'dwarf'
TARGET = MQ.OPT.get('target', '1') != '0'
if DWARF:
    WORK += '-dwarf'
    if 'hero' not in MQ.OPT:
        MQ.HERO = 'pyro_p0'
# a dwarf on the same bones: the legs much shorter, the trunk a little shorter and a good deal wider and deeper, the limbs thick, the head big
LEGK, TRUNK, XK, YK, RK, HEADK, HK = (0.56, 0.90, 1.24, 1.18, 1.30, 1.14, 0.74) if DWARF else (1, 1, 1, 1, 1, 1, 1)


def zmap(z):
    """a height on the slash's figure, on this build: the boot as it is (to the ankle, 0.09), the leg by LEGK to the hip (0.95), the rest by TRUNK."""
    hip = 0.09 + (0.95 - 0.09) * LEGK
    return z if z <= 0.09 else 0.09 + (z - 0.09) * LEGK if z <= 0.95 else hip + (z - 0.95) * TRUNK


def pm(v):
    return (v[0] * XK, v[1] * (YK if v[2] > 0.09 else 1), zmap(v[2]))


def piece(kind, bone, colour, a):
    k = HEADK if colour in ('head', 'nose') else 1.0 if colour.startswith('foot') else RK
    if kind == 'egg':
        return (kind, bone, colour, (pm(a[0]), tuple(r * k for r in a[1])))
    return (kind, bone, colour, (pm(a[0]), pm(a[1]), a[2] * k))

COL = dict(MQ.COL, joint='#ffe14a', haft='#a8763e', headL='#ffd23c', headR='#ff2ed2', cap='#f4f0e0', dummy='#8fa89a', pad='#e6f2ea', dnose='#5f7a6c')
HAND = MQ.HAND
LOCK = 64                # (each mace's angle off its forearm, degrees, the same on every frame: his "wrists essentially lock at position 1")
HEADC = 0.47             # (the head's middle, along the hand bone from the fist)
HEADR = 0.078
MACE = [('pommel', 'grip', -0.075, -0.055, 0.030), ('grip', 'grip', -0.055, 0.06, 0.022), ('haft', 'haft', 0.06, 0.40, 0.022),
        ('head', 'HEAD', 0.40, 0.54, HEADR), ('cap', 'cap', 0.54, 0.57, 0.034)]
SHO = (0.19, 1.42, 0.065)          # the target's shoulder: half its width, its height, the bar's radius (the striker's own numbers)

# ------------------------------------------------------------------ the bones: the slash's, with both hands a fist on a wrist, and the target's
BONES = [(n, pm(h), pm(t), par) for n, h, t, par in MQ.BONES if not n.startswith('hand.')]
GRIPS = {}
for s, x in (('L', 1), ('R', -1)):
    e, w = Vector(pm((0.21 * x, 0.02, 1.14))), Vector(pm((0.22 * x, -0.04, 0.89))); g = w + (w - e).normalized() * HAND
    GRIPS[s] = (tuple(w), tuple(g))
    BONES.append(('hand.' + s, tuple(g), (g[0], g[1] - 0.08, g[2]), 'fore.' + s))
BONES.append(('dummy', (0, 0, 0), (0, 0, 0.30), None))

PIECES = [piece(*p) for p in MQ.PIECES if 'hand' not in p[2]]
for s, x in (('L', 1), ('R', -1)):
    w, g = GRIPS[s]
    PIECES += [('cap', 'fore.' + s, 'hand' + s, (w, g, 0.04 * RK)),                         # the back of the hand, on the forearm's line
               ('egg', 'hand.' + s, 'hand' + s, (g, (0.052 * RK,) * 3)),                    # the fist round the grip
               ('egg', 'fore.' + s, 'joint', (w, (0.050 * RK,) * 3)),                       # THE WRIST, marked
               ('egg', 'calf.' + s, 'joint', (pm((0.10 * x, 0.0, 0.09)), (0.058 * RK,) * 3))]   # THE ANKLE, marked


def target_pieces():
    """the stationary figure, at the origin and facing +Y (toward the striker): (kind, colour, args), in metres."""
    hw, hz, hr = SHO
    P = [('egg', 'dummy', ((0, 0, 0.97), (0.15, 0.10, 0.09))), ('cap', 'dummy', ((0, 0, 1.04), (0, 0, 1.22), 0.12)),
         ('egg', 'dummy', ((0, 0, 1.33), (0.17, 0.11, 0.14))), ('cap', 'dummy', ((hw - 0.03, 0, hz), (-hw + 0.03, 0, hz), hr)),
         ('cap', 'dummy', ((0, 0, 1.45), (0, 0, 1.54), 0.045)), ('egg', 'dummy', ((0, 0, 1.665), (0.12, 0.13, 0.145))),
         ('cap', 'dnose', ((0, 0.11, 1.645), (0, 0.17, 1.63), 0.034))]
    for x in (1, -1):
        P += [('cap', 'dummy', ((hw * x, 0, hz), (0.22 * x, 0.0, 1.14), 0.050)), ('cap', 'dummy', ((0.22 * x, 0, 1.14), (0.23 * x, 0.03, 0.88), 0.042)),
              ('cap', 'dummy', ((0.10 * x, 0, 0.95), (0.10 * x, 0.02, 0.51), 0.068)), ('cap', 'dummy', ((0.10 * x, 0.02, 0.51), (0.10 * x, 0, 0.09), 0.052)),
              ('cap', 'dummy', ((0.10 * x, -0.035, 0.036), (0.10 * x, 0.155, 0.036), 0.036)),
              ('egg', 'pad', ((hw * x, 0, hz + 0.01), (0.085, 0.085, 0.075)))]             # the shoulder's pad: where a head lands
    return P


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    ad = bpy.data.armatures.new('mannequin'); arm = bpy.data.objects.new('mannequin', ad); scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm; arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for name, h, t, p in BONES:
        eb = ad.edit_bones.new(name); eb.head = Vector(h) * U; eb.tail = Vector(t) * U; eb.roll = 0
        if p:
            eb.parent = ad.edit_bones[p]; eb.use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    ad.bones['dummy'].use_deform = False

    def sphere(bm, c, radii):
        res = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1.0)
        for v in res['verts']:
            v.co = Vector((c[0] + v.co.x * radii[0], c[1] + v.co.y * radii[1], c[2] + v.co.z * radii[2])) * U
        return res['verts']

    def capsule(bm, p0, p1, r):
        p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        res = bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=16, radius1=r * U, radius2=r * U, depth=d.length * U,
                                    matrix=Matrix.Translation((p0 + p1) / 2 * U) @ rot)
        return list(res['verts']) + sphere(bm, p0, (r, r, r)) + sphere(bm, p1, (r, r, r))

    def paint(verts, mats, colour):
        if colour not in mats:
            mats.append(colour)
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = mats.index(colour)

    def finish(bm, name, mats):
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
        for c in mats:
            m = bpy.data.materials.new(name + '_' + c); m.diffuse_color = lin(COL[c]) + (1,); me.materials.append(m)
        ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
        return ob, me

    # ---- the body: one rigid piece a bone
    bm = bmesh.new(); groups = {}; mats = []
    for kind, bone, colour, a in PIECES:
        vs = sphere(bm, *a) if kind == 'egg' else capsule(bm, *a)
        paint(vs, mats, colour); groups.setdefault(bone, []).extend(vs)
    bm.verts.ensure_lookup_table(); index = {v: i for i, v in enumerate(bm.verts)}
    gi = {b: [index[v] for v in vs] for b, vs in groups.items()}
    body, me = finish(bm, 'mannequin_body', mats)
    for bone, ids in gi.items():
        g = body.vertex_groups.new(name=bone); g.add(ids, 1.0, 'REPLACE')
    vcol = np.zeros((len(me.vertices), 3))
    for p in me.polygons:
        for vi in p.vertices:
            vcol[vi] = lin(COL[mats[p.material_index]])
    body.parent = arm; body.parent_type = 'OBJECT'
    mod = body.modifiers.new('arm', 'ARMATURE'); mod.object = arm

    # ---- a mace in each fist: its own object on the hand bone (its frame is the bone's, from the bone's tail)
    maces = {}
    for s in 'LR':
        bm = bmesh.new(); mm = []; L = ad.bones['hand.' + s].length
        for name, colour, y0, y1, r in MACE:
            colour = 'head' + s if colour == 'HEAD' else colour
            rot = Matrix.Rotation(math.radians(-90), 4, 'X')
            res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=16, radius1=r * U, radius2=r * U, depth=(y1 - y0) * U,
                                        matrix=Matrix.Translation((0, (y0 + y1) / 2 * U - L, 0)) @ rot)
            paint(res['verts'], mm, colour)
        ob, _ = finish(bm, 'mace' + s, mm)
        ob.parent = arm; ob.parent_type = 'BONE'; ob.parent_bone = 'hand.' + s; ob.matrix_parent_inverse = Matrix.Identity(4)
        maces[s] = ob

    # ---- the target, on its own still bone
    bm = bmesh.new(); dm = []
    for kind, colour, a in target_pieces():
        paint(sphere(bm, *a) if kind == 'egg' else capsule(bm, *a), dm, colour)
    dummy, _ = finish(bm, 'target', dm)
    dummy.parent = arm; dummy.parent_type = 'BONE'; dummy.parent_bone = 'dummy'
    bpy.context.view_layer.update(); dummy.matrix_world = Matrix.Identity(4)
    bpy.context.view_layer.update()

    R = BP.Rig(arm, body, dict(spine=['spine1', 'spine2'], neck=['neck'], head='head',
                               arm_a=['clav.L', 'arm.L', 'fore.L', 'hand.L'], arm_b=['clav.R', 'arm.R', 'fore.R', 'hand.R'],
                               leg_a=[None, 'thigh.L', 'calf.L', 'foot.L', 'toe.L', 'toe.L'],
                               leg_b=[None, 'thigh.R', 'calf.R', 'foot.R', 'toe.R', 'toe.R'], roots=['hips'], still=['dummy']), log=LOG)
    R.ground()
    return scene, arm, body, maces, dummy, R, vcol


# ------------------------------------------------------------------ the rows
def rows(R):
    """His words on the first pass (11-12), the motion's law: "wrists essentially lock at position 1 / hands to the ears is mostly elbow
    retraction while shoulders raise the arms / then shoulders further up as torso starts leaning forward as knees lower torso / then the strike
    is elbows extending and shoulders coming down while the hips and legs start pulling the torso back on the way to return to idle".
    So a frame is each arm's two angles -- `up` the upper arm and `fo` the forearm, degrees above the level, forward -- and the mace is never
    aimed: it sits LOCK degrees off its forearm in the arm's own plane (the way the elbow folds), on every frame of every row."""
    za, zb = R.ANK0['a'].z, R.ANK0['b'].z
    L1, L2 = R.BN['arm.L'].length / U, R.BN['fore.L'].length / U
    mir = lambda v: (-v[0], v[1], v[2])
    rad = math.radians

    def P(lift, shift=0.0, lean=0, head=0, up=-60, fo=20, out=0.03, heel=0, sh=0, fw=0):
        u = (0.0, -math.cos(rad(up)), math.sin(rad(up))); f = (0.0, -math.cos(rad(fo)), math.sin(rad(fo)))
        w = (out, (u[1] * L1 + f[1] * L2), (u[2] * L1 + f[2] * L2))               # the wrist from its shoulder, metres
        pole = (0.22, u[1], u[2]) if abs(fo - up) > 40 else (0.04, 0.3, -1.0)      # the elbow where the upper arm points, a little out; an arm near straight keeps its elbow under it (its fold stays fore-and-aft)
        return dict(lift=lift * U * HK, shift=shift * U * HK, lean=lean, head=head, shupa=sh, shupb=sh, shfwa=fw, shfwb=fw,
                    legs={'a': (0.13 * XK * U, -0.10 * U, za, 12, heel), 'b': (-0.13 * XK * U, 0.08 * U, zb, 20, heel)},
                    arms={'a': tuple(x * U for x in w), 'b': tuple(x * U for x in mir(w))}, epolea=pole, epoleb=mir(pole))

    TWIN = [
        P(-0.04, lean=3, up=-62, fo=18),                                               # 1 POSITION ONE: the maces up in front; the wrists as they will stay
        P(-0.04, shift=0.01, lean=0, head=-2, up=22, fo=128, sh=10, out=0.05),         # 2 hands to the ears: the elbows fold, the shoulders raise the arms
        P(-0.11, shift=-0.05, lean=11, head=3, up=27, fo=88, sh=14, fw=2, out=0.04, heel=8),   # 3 the same a few frames on toward the strike (his "3 a few frames further along on the path to frame four"): the knees down, the arms already coming over
        P(-0.125, shift=-0.035, lean=7, head=6, up=-14, fo=-10, sh=6, fw=6, out=0.02),  # 4 THE STRIKE: the elbows extend, the shoulders come down; the hips and legs already pulling the torso back (the torso "a wee bit lower", his word)
        P(-0.06, shift=-0.01, lean=4, head=2, up=-36, fo=-2, sh=2),                     # 5 on the way back
        P(-0.045, lean=3, up=-52, fo=14),                                              # 6 nearly idle
    ]
    IDLE = [P(-0.04, lean=3, up=-62, fo=18)]                                           # (the idle is position one: the strike leaves from it and comes back to it)

    def lock(P, tag):
        """each mace LOCK degrees off its forearm, turned the way its elbow folds (about the arm's own hinge: the upper arm x the forearm)."""
        d, lift, shift, sway = R.pose_d(P); M = R.solve(d, lift, shift, sway, mats=True)[1]; hands = {}
        for s_, arm_, fore in (('a', 'arm.L', 'fore.L'), ('b', 'arm.R', 'fore.R')):
            u = (M[fore].translation - M[arm_].translation).normalized()
            f = (M[fore] @ Vector((0, R.BN[fore].length, 0)) - M[fore].translation).normalized()
            n = u.cross(f)
            n = n.normalized() if n.length > 1e-4 else Vector((1 if s_ == 'a' else -1, 0, 0))
            hands[s_] = tuple(Matrix.Rotation(math.radians(LOCK), 3, n) @ f)
        return dict(P, hands=hands)
    mk = lambda name, F: (lambda i, n: (lock(dict(F[i]), '%s %d' % (name, i + 1)), 0))
    return [('idle', 1, False, mk('idle', IDLE), 'ik'), ('twinmace', 6, False, mk('twinmace', TWIN), 'ik')]


ROWS_META = {'idle': dict(fps=6), 'twinmace': dict(fps=12, release=3)}


def heads(arm):
    """each mace head's middle and each fist, in the rig's own metres (the armature unscaled and unturned)."""
    out = {}
    for s in 'LR':
        M = arm.pose.bones['hand.' + s].matrix
        out[s] = (np.array(M @ Vector((0, HEADC * U, 0))) / U, np.array(M @ Vector((0, 0, 0))) / U)
    return out


def main():
    scene, arm, body, maces, dummy, R, vcol = build()
    rowdefs = rows(R)
    R.key_rows(rowdefs)

    # ---- the target stood where the hit lands: its shoulder line under the two heads at THE HIT
    R.use('twinmace'); scene.frame_set(ROWS_META['twinmace']['release'] + 1); bpy.context.view_layer.update()
    H = heads(arm); hw, hz, hr = SHO
    ty = float((H['L'][0][1] + H['R'][0][1]) / 2)
    dummy.matrix_world = Matrix.Translation((0, ty * U, 0)); bpy.context.view_layer.update()
    top = hz + 0.01 + 0.075                       # the pad's top
    for s, x in (('L', 1), ('R', -1)):
        h = H[s][0]
        print('%s THE HIT %s: the head at x %.3f y %.3f z %.3f -- the shoulder %.3f across, its pad\'s top %.3f: off by %.3f across, %.3f up (the head\'s underside to the pad)'
              % (LOG, s, h[0], h[1], h[2], hw * x, top, h[0] - hw * x, h[2] - HEADR - top))
    print('%s the target stands %.3f m in front (toe to toe about %.2f)' % (LOG, -ty, -ty - 0.17 - 0.155))
    for name, n, loop, fn, how in rowdefs:
        R.use(name)
        for i in range(n):
            scene.frame_set(i + 1); bpy.context.view_layer.update()
            a = []
            for s in 'LR':
                fo, hd = arm.pose.bones['fore.' + s], arm.pose.bones['hand.' + s]
                a.append('%s %.0f' % (s, math.degrees((fo.tail - fo.head).angle(hd.tail - hd.head))))
            hz_ = ['%s %.3f' % (sd, (arm.pose.bones['foot.' + sd].head.z - R.ANK0['a' if sd == 'L' else 'b'].z) / U) for sd in 'LR']
            print('%s wrists %s %d: the mace off the forearm %s | each ankle risen (m) %s' % (LOG, name, i + 1, ', '.join(a), ', '.join(hz_)))
    if MODE == 'hit':
        return

    cam = MQ.make_camera(scene); MQ.look(scene)
    os.makedirs(os.path.join(WORK, 'render'), exist_ok=True)
    held = list(maces.values())

    def hide(objs, v):
        for o in objs:
            o.hide_render = v

    # ---- the size: the mannequin's idle from the front as many rows tall as the hero's idle S (the slash's measure)
    want, hfw, hfh, hax, hay = MQ.hero_height()
    R.use('idle'); scene.frame_set(1); s = 1.0 / U; got = None; hide(held + [dummy], True)
    for it in range(6):
        arm.scale = (s, s, s); MQ.set_facing(arm, 0)
        lo = MQ.screen(cam, MQ.soles(body, R))[:, 1].max()
        MQ.frame_cam(scene, cam, 64, 80, 32, 70 + 0.9 - lo)
        a = MQ.render_alpha(scene, os.path.join(WORK, 'render', '_measure.png'))
        ys = np.where(a.any(1))[0]; got = int(ys[-1] - ys[0])
        if got == want:
            break
        s *= (want + 0.5) / (got + 0.5)
    assert got == want, 'the mannequin never stood %d rows' % want
    print('%s scale %.4f: %d rows, as %s' % (LOG, s, got, MQ.HERO))
    hide(held, False); SCALE = s

    def cells(extra):
        """each row's cell over the five facings (the striker and his maces, and `extra`), the feet's row its anchor."""
        D, Mx = {}, {}
        for name, n, loop, fn, how in rowdefs:
            R.use(name); ext = []
            for fname, f in FACINGS:
                MQ.set_facing(arm, f); scene.frame_set(1)
                lo = MQ.screen(cam, MQ.soles(body, R))[:, 1].max(); D.setdefault(fname, {})[name] = float(lo)
                for i in range(n):
                    scene.frame_set(i + 1)
                    p = MQ.screen(cam, np.vstack([MQ.world_pts(body, 2)] + [MQ.world_pts(o) for o in held + extra]))
                    ext.append((p[:, 0].min(), p[:, 0].max(), (p[:, 1] - lo).min(), (p[:, 1] - lo).max()))
            e = np.array(ext)
            ax = int(math.ceil(max(-e[:, 0].min(), e[:, 1].max()) + PAD)); fw = 2 * ax
            ay = int(math.ceil(-e[:, 2].min() + PAD)); fh = ay + int(math.ceil(max(e[:, 3].max(), 0) + PAD)) + 1; fh += fh % 2
            Mx[name] = dict(ROWS_META[name], fw=fw, fh=fh, ax=ax, ay=ay, frames=n)
        return D, Mx

    meta = dict(hero=MQ.HERO, hero_rows=want, scale=SCALE, ss=SS, k=K, facings=[f for f, _ in FACINGS], rows={}, model={}, points={})
    for kind, extra in (('render', []), ('model', [dummy])) if TARGET else (('render', []),):       # the sprite's cells (the striker alone), then the modeling poses (the target in)
        hide([dummy], not extra)
        D, Mx = cells(extra); meta['rows' if kind == 'render' else 'model'] = Mx
        for name, n, loop, fn, how in rowdefs:
            R.use(name); M = Mx[name]
            print('%s %s %s: the cell %dx%d, the anchor %d,%d' % (LOG, kind, name, M['fw'], M['fh'], M['ax'], M['ay']))
            os.makedirs(os.path.join(WORK, kind, name), exist_ok=True)
            for fname, f in FACINGS:
                MQ.set_facing(arm, f)
                lo = D[fname][name]; oy = M['ay'] + 0.9 - lo
                MQ.frame_cam(scene, cam, M['fw'], M['fh'], M['ax'], oy)
                pts = []
                for i in range(n):
                    scene.frame_set(i + 1); bpy.context.view_layer.update()
                    sc = lambda w: [round(float(v), 2) for v in (MQ.screen(cam, np.array([w]))[0] + np.array([M['ax'], oy]))]
                    if kind == 'render':
                        q = {}
                        for sd in 'LR':
                            Mw = arm.matrix_world @ arm.pose.bones['hand.' + sd].matrix
                            q['fist' + sd] = sc(np.array(Mw @ Vector((0, 0, 0)))); q['head' + sd] = sc(np.array(Mw @ Vector((0, HEADC * U, 0))))
                        wb = MQ.world_pts(body, 1); q['crown'] = sc(wb[MQ.screen(cam, wb)[:, 1].argmin()])
                        sl = MQ.soles(body, R); left = sl @ np.array(arm.matrix_world.to_3x3().col[0]) > 0
                        if left.any() and (~left).any():
                            q['soleL'] = sc(sl[left].mean(0)); q['soleR'] = sc(sl[~left].mean(0))
                        pts.append(q)
                    scene.render.filepath = os.path.join(WORK, kind, name, '%s_%02d.png' % (fname, i))
                    bpy.ops.render.render(write_still=True)
                if kind == 'render':
                    meta['points'].setdefault(name, {})[fname] = pts
            print('%s %s %s rendered' % (LOG, kind, name))
    json.dump(meta, open(os.path.join(WORK, 'render', 'meta.json'), 'w'), indent=1)
    print('%s ok: %s' % (LOG, os.path.join(WORK, 'render', 'meta.json')))

    if MODE == 'poser':
        hide([dummy], not TARGET); arm.scale = (1, 1, 1); arm.rotation_euler = (0, 0, 0); bpy.context.view_layer.update()
        R.export_poser(os.path.join(WORK, 'poser.json'), rowdefs, col=vcol, fig=os.path.basename(WORK), fps={k: v['fps'] for k, v in ROWS_META.items()},
                       extras=[(maces['L'], COL['headL']), (maces['R'], COL['headR'])] + ([(dummy, COL['dummy'])] if TARGET else []))


if __name__ == '__main__':
    main()

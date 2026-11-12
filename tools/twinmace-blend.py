"""The mannequin's TWIN STRIKE with two maces (11-12): the second family of pose references for the art desk to skin, after the one-handed
slash (tools/mannequin-blend.py, 10-31). Griz, 11-12: "pyro is going to need twin-strike for his maces. I'm thinking twin-strikes will vary by
weapon type. Pyro with two maces would draw back raising both arms while reeling in the elbows to extend a straight swing that would bash both
the left and right shoulders of a stationary humanoid mannequin - whereas a scimitar twin-strike the wrists would turn out as the arms raised
and the strike would be more like an X in front of him." And on the figure: "look at the mannequin (joint articulation, wrist and ankles would
help as I recall it)".

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python tools/twinmace-blend.py -- build [hero=barley_p3] [ss=8]
    ... -- poser        the same, and deep16/_src/twinmace/poser.json for tools/poser.html?fig=twinmace (gitignored)
    ... -- hit          no renders: where each mace's head is at THE HIT against the target's shoulders, and each wrist's angle

Then `python tools/twinmace-sheet.py` lays the reference strips (deep16/art-src/twinmace/).

What is new on the slash's mannequin (its bones, capsules and colours are tools/mannequin-blend.py's, imported):
  - BOTH hands are fists on a wrist: each hand runs on from the wrist along the forearm to the fist, its hand bone starts at the fist and points
    along the weapon, and each weapon is held to WRIST degrees off its forearm (the slash's rule, now a side each).
  - The wrists and the ankles are MARKED: a yellow ball at each, so the joint reads on the page and the art desk sees the hand turn on the
    forearm and the foot on the shin. The ankles work in this row: the heels come up at the top of the draw (legs' `pitch`) and drop at the hit.
  - A mace in each fist: a dark haft and a round head, his LEFT mace's head gold and his RIGHT's magenta (the sides must read: the cutter mirrors).
  - THE TARGET: a pale standing figure in front of him, facing him -- "a stationary humanoid mannequin" -- a pad on each shoulder. It rides a
    bone of its own that the hips' moves leave alone (blender_pose's `still`), so it stands where it stands in Blender and on the poser page.
    It is in the modeling renders and the poser; the sprite cells (render/<row>/) are the striker alone.

Rows (blender_pose frames: the feet placed, each wrist placed from its shoulder, each hand aimed along a world direction, the elbows' poles):
    IDLE 1      the stance, both maces lowered, heads forward and down.
    TWINMACE 6  1 guard (both heads up in front), 2 the draw (both arms rising, the elbows reeled in close under the fists), 3 THE TOP (the
                fists by the ears, the elbows in and forward, the heads back over the shoulders, up on the balls of the feet), 4 THE HIT (the
                release frame, index 3: both arms thrown out straight, the heads down on the target's two shoulders, the heels down), 5 the
                rebound (the heads come up off the shoulders, the arms still out), 6 back to guard. 12 fps.
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

COL = dict(MQ.COL, joint='#ffe14a', haft='#a8763e', headL='#ffd23c', headR='#ff2ed2', cap='#f4f0e0', dummy='#8fa89a', pad='#e6f2ea', dnose='#5f7a6c')
HAND = MQ.HAND
WRIST = (25, 115)        # (a mace's angle off the forearm a one-hand grip reaches, degrees: nearer the arm's line at the hit than a blade)
HEADC = 0.47             # (the head's middle, along the hand bone from the fist)
HEADR = 0.078
MACE = [('pommel', 'grip', -0.075, -0.055, 0.030), ('grip', 'grip', -0.055, 0.06, 0.022), ('haft', 'haft', 0.06, 0.40, 0.022),
        ('head', 'HEAD', 0.40, 0.54, HEADR), ('cap', 'cap', 0.54, 0.57, 0.034)]
SHO = (0.19, 1.42, 0.065)          # the target's shoulder: half its width, its height, the bar's radius (the striker's own numbers)

# ------------------------------------------------------------------ the bones: the slash's, with both hands a fist on a wrist, and the target's
BONES = [b for b in MQ.BONES if not b[0].startswith('hand.')]
GRIPS = {}
for s, x in (('L', 1), ('R', -1)):
    e, w = Vector((0.21 * x, 0.02, 1.14)), Vector((0.22 * x, -0.04, 0.89)); g = w + (w - e).normalized() * HAND
    GRIPS[s] = (tuple(w), tuple(g))
    BONES.append(('hand.' + s, tuple(g), (g[0], g[1] - 0.08, g[2]), 'fore.' + s))
BONES.append(('dummy', (0, 0, 0), (0, 0, 0.30), None))

PIECES = [p for p in MQ.PIECES if 'hand' not in p[2]]
for s, x in (('L', 1), ('R', -1)):
    w, g = GRIPS[s]
    PIECES += [('cap', 'fore.' + s, 'hand' + s, (w, g, 0.04)),                              # the back of the hand, on the forearm's line
               ('egg', 'hand.' + s, 'hand' + s, (g, (0.052, 0.052, 0.052))),                # the fist round the grip
               ('egg', 'fore.' + s, 'joint', (w, (0.050, 0.050, 0.050))),                   # THE WRIST, marked
               ('egg', 'calf.' + s, 'joint', ((0.10 * x, 0.0, 0.09), (0.058, 0.058, 0.058)))]   # THE ANKLE, marked


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
    za, zb = R.ANK0['a'].z, R.ANK0['b'].z
    m = lambda v: tuple(x * U for x in v)       # (the numbers below in metres)
    mir = lambda v: (-v[0], v[1], v[2])

    def P(lift, shift=0.0, lean=0, head=0, w=(0, 0, -0.4), d=(0, -1, 0), pole=(0.6, 1, 0), heel=0, sh=0, fw=0, wR=None, dR=None):
        """one frame, both arms alike (w a wrist from its shoulder, d the mace's way, pole the elbow's -- the LEFT's, the right's mirrored)."""
        return dict(lift=lift * U, shift=shift * U, lean=lean, head=head, shupa=sh, shupb=sh, shfwa=fw, shfwb=fw,
                    legs={'a': (0.13 * U, -0.10 * U, za, 12, heel), 'b': (-0.13 * U, 0.08 * U, zb, 20, heel)},
                    arms={'a': m(w), 'b': m(wR or mir(w))}, hands={'a': d, 'b': dR or mir(d)}, epolea=pole, epoleb=mir(pole))

    IDLE = [P(-0.04, lean=2, w=(0.05, -0.16, -0.44), d=(0.10, -0.80, -0.59), pole=(0.6, 1, 0))]
    TWIN = [
        P(-0.05, lean=4, w=(0.05, -0.30, -0.20), d=(0.06, -0.34, 0.94), pole=(0.55, 0.45, -0.70)),                              # 1 guard
        P(-0.04, shift=0.02, lean=-3, head=-2, heel=8, sh=6, w=(0.07, -0.13, 0.03), d=(0.12, 0.22, 0.97), pole=(0.30, 0.25, -0.92)),  # 2 the draw: the elbows reeled in under the fists
        P(0.00, shift=0.04, lean=-11, head=-6, heel=28, sh=14, fw=-6, w=(0.09, -0.01, 0.20), d=(0.16, 0.66, 0.73), pole=(0.28, -0.92, -0.26)),  # 3 THE TOP: the fists by the ears, the elbows in and forward
        P(-0.12, shift=-0.10, lean=12, head=6, heel=0, sh=10, fw=10, w=(0.02, -0.42, 0.28), d=(0.01, -0.98, -0.19), pole=(0.80, 0.20, -0.55)),   # 4 THE HIT: both arms out straight
        P(-0.10, shift=-0.07, lean=9, head=4, heel=0, sh=6, fw=6, w=(0.03, -0.37, 0.27), d=(0.02, -0.97, 0.22), pole=(0.80, 0.25, -0.50)),            # 5 the rebound: the heads come up off the shoulders, the arms still out
        P(-0.07, shift=-0.03, lean=9, head=2, w=(0.04, -0.33, -0.15), d=(0.05, -0.50, 0.86), pole=(0.55, 0.45, -0.70)),                       # 6 recover
    ]

    def wrist(P, tag):
        """each mace held to what a wrist can do: WRIST degrees off its forearm at most and least, turned in the plane of the two."""
        Q = {k: v for k, v in P.items() if k != 'hands'}
        d, lift, shift, sway = R.pose_d(Q); M = R.solve(d, lift, shift, sway, mats=True)[1]; hands = {}
        for s, fore in (('a', 'fore.L'), ('b', 'fore.R')):
            f = (M[fore] @ Vector((0, R.BN[fore].length, 0)) - M[fore].translation).normalized(); b = Vector(P['hands'][s]).normalized()
            th = math.degrees(f.angle(b)); t = min(max(th, WRIST[0]), WRIST[1])
            if abs(t - th) > 0.5:
                q = (b - f * b.dot(f)).normalized(); b = f * math.cos(math.radians(t)) + q * math.sin(math.radians(t))
                print('%s %s %s: the aim asked the wrist %.0f degrees off the forearm; held to %.0f' % (LOG, tag, s, th, t))
            hands[s] = tuple(b)
        return dict(P, hands=hands)
    mk = lambda name, F: (lambda i, n: (wrist(dict(F[i]), '%s %d' % (name, i + 1)), 0))
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
    for kind, extra in (('render', []), ('model', [dummy])):       # the sprite's cells (the striker alone), then the modeling poses (the target in)
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
        hide([dummy], False); arm.scale = (1, 1, 1); arm.rotation_euler = (0, 0, 0); bpy.context.view_layer.update()
        R.export_poser(os.path.join(WORK, 'poser.json'), rowdefs, col=vcol, fig='twinmace', fps={k: v['fps'] for k, v in ROWS_META.items()},
                       extras=[(maces['L'], COL['headL']), (maces['R'], COL['headR']), (dummy, COL['dummy'])])


if __name__ == '__main__':
    main()

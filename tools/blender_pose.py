"""Posing a rigged figure in code: DEEP16 pipeline 1b's shared poser (10-04, lifted out of tools/troll-blend.py on Griz's word: "definitely
(shared module)"). For a figure on an artist's own rig (the grick's way, deep16/blender-monsters.md): load the rig, name its bones, and every row
is a list of frames, each frame a dict of a few numbers that this module turns into every bone's pose.

    spec = importlib.util.spec_from_file_location('blender_pose', os.path.join(ROOT, 'tools', 'blender_pose.py'))
    BP = importlib.util.module_from_spec(spec); spec.loader.exec_module(BP)
    R = BP.Rig(arm, body, dict(spine=[...], neck=[...], head=..., jaw=..., arm_a=[shoulder, upper, fore, hand], arm_b=[...],
                               leg_a=[hip, thigh, calf, ankle, foot, toe], leg_b=[...], fing_a=[first bone of each finger], fing_b=[...],
                               roots=[the root bones, all at the hip]), log='[troll]')
    R.ground()                                    # the artist's own pose's lowest point is the floor
    R.key_rows(ROWS)                              # (name, frames, loop, fn(i, n) -> (P, 0), how) -> one action per row

The sides: `a` is the figure's +X side (its left, facing -Y), `b` its -X side. The pose's frame: +X turns the front DOWN (a lean forward, a blow
coming down), - raises it.

A frame P, two ways (they mix):
  - bends on the artist's pose (the first posing's way): body/bodyyaw (all of it about the hip), lean/twist/tilt (the spine), head/hyaw/hroll,
    jaw (+ opens), and per side sw/out (the upper arm), el/elz, wr, shup/shfw (the collarbone: the shoulder up, forward), shr (the collarbone's
    roll), fing (+ curls), th/thz, kn, ft; armsdown/tuck/lie aim whole limbs (gravity: `aim` turns a chain to point along world directions).
  - the rig's names: arm = [collarbone, upper, fore, hand]; leg = [hip or None, thigh, calf, ankle, foot, toe] -- a skeleton with one foot bone
    and toes names [None, thigh, calf, foot, toes, toes] (the ankle bone is the one a planted foot turns, the next its forward, the last its tip).
  - limbs placed (the second posing's way): legs={'a': (x, y, z, yaw, pitch)} an ankle where it stands (a planted foot keeps the artist's flat
    sole, `yaw` its toes out, `pitch` its toes down), arms={'a': (dx, dy, dz)} a wrist from its shoulder joint in world axes (an arm rides the
    body), kpolea/epolea the way a knee or elbow points, hands={'a': (x, y, z)} a hand aimed along a world direction. `stance()` builds one
    from a figure's standing numbers. Every limb placed by `ik2`, the two-bone solve: both bones turned whole, so the sculpt's own knee or elbow
    keeps bending the way it was made to.
  - lift/shift/sway move the hip (z, y, x).

Grounding a frame (`how`): 'plant' its lowest point lands on the floor; 'clamp' never below it; 'ik' the pose puts its own feet down (a rolled
foot is lifted by what its claws would put under the floor), and anything else that goes under is printed with where.
Tools: `flat_camera` (a true profile or front view to pose by, a floor line at 86% down), `joints` (each frame's joints above the floor).
"""
import bpy, math
import numpy as np
from mathutils import Vector, Quaternion, Matrix

PX = Vector((1, 0, 0)); PY = Vector((0, 1, 0)); PZ = Vector((0, 0, 1))
S = math.sin; TAU = 2 * math.pi


def Q(axis, deg):
    ax = Vector(axis)
    return Quaternion(ax.normalized(), math.radians(deg)) if ax.length > 1e-6 and deg else Quaternion()


def lerp(a, b, f):
    return tuple(x + (y - x) * f for x, y in zip(a, b))


def mix(a, b, f):
    return {k: a.get(k, 0) * (1 - f) + b.get(k, 0) * f for k in set(a) | set(b)}


def frame3(a, n):
    a = a.normalized(); n = (n - a * n.dot(a)).normalized()
    return Matrix((a, n, a.cross(n))).transposed()


LIE = {   # where each limb chain points when it lies on the floor, by what the body is doing: ('back': over on its back, head toward +Y; 'face': on its face, head toward -Y)
    'back': dict(arm=[(0.55, 0.55, -0.12), (0.8, 0.3, -0.12), (0.85, 0.1, -0.1)], leg=[(0.22, -0.95, -0.12), (0.2, -0.97, -0.1), (0.1, -0.7, -0.5), (0.0, -0.4, -0.9), (0.0, -0.4, -0.9)]),
    'face': dict(arm=[(0.6, -0.65, -0.15), (0.85, -0.45, -0.12), (0.85, -0.45, -0.1)], leg=[(0.2, 0.95, -0.1), (0.15, 0.98, -0.1), (0.1, 0.5, -0.6), (0.0, 0.4, -0.9), (0.0, 0.4, -0.9)]),
}


class Rig:
    def __init__(self, arm, body, names, log='[pose]'):
        self.arm, self.body, self.log = arm, body, log
        self.BN = BN = arm.data.bones
        self.SPINE, self.NECK, self.HEAD, self.JAW = names['spine'], names['neck'], names['head'], names.get('jaw')
        self.ARM = {'a': names['arm_a'], 'b': names['arm_b']}
        self.LEG = {'a': names['leg_a'], 'b': names['leg_b']}
        self.FING = {'a': names.get('fing_a', []), 'b': names.get('fing_b', [])}
        self.ROOTS = names['roots']
        self.FOOT = {s: tuple(self.LEG[s][3:6]) for s in 'ab'}         # the ankle bone, the foot, the toe
        self.KPOLE = {'a': (0.3, -1, 0.15), 'b': (-0.3, -1, 0.15)}       # a knee bends forward and a little out
        self.EPOLE = {'a': (0.6, 1, 0), 'b': (-0.6, 1, 0)}              # an elbow points back and out
        self.REST = {b.name: b.matrix_local.copy() for b in BN}
        for pb in arm.pose.bones:
            pb.rotation_mode = 'QUATERNION'
        self.POSE0 = {pb.name: pb.matrix.copy() for pb in arm.pose.bones}
        self.ORDER = []

        def topo(b):
            self.ORDER.append(b.name)
            for c in b.children:
                topo(c)
        for b in BN:
            if b.parent is None:
                topo(b)
        self.ANK0 = {s: self.POSE0[self.FOOT[s][0]].translation.copy() for s in 'ab'}    # each ankle where the artist planted it: its foot on the ground
        self.FLOOR = None
        self.ad = None

    # ------------------------------------------------------------------ the bones
    def chain(self, name):
        out = [name]
        while self.BN[out[-1]].children:
            out.append(self.BN[out[-1]].children[0].name)
        return out

    def dir0(self, n):
        """a bone's direction (head to tail) in the artist's pose."""
        return self.POSE0[n] @ Vector((0, self.BN[n].length, 0)) - self.POSE0[n].translation

    def accG(self, d, name):
        """the turn the bones above `name` (and it) have taken, in the pose's frame."""
        chainup = []
        b = self.BN[name]
        while b:
            chainup.append(b.name); b = b.parent
        G = Quaternion()
        for n in reversed(chainup):
            G = G @ d.get(n, Quaternion())
        return G

    # ------------------------------------------------------------------ a pose: its parameters -> a bend per bone -> each bone's basis
    def bends(self, P):
        """the bends' half of P (see the module's head): a turn per bone, in the pose's frame."""
        d = {}

        def add(n, q):
            d[n] = q @ d.get(n, Quaternion())
        for r in self.ROOTS:
            add(r, Q(PX, P.get('body', 0)))
            add(r, Q(PZ, P.get('bodyyaw', 0)))
        sp = self.SPINE
        for n in sp:
            add(n, Q(PX, P.get('lean', 0) / len(sp))); add(n, Q(PZ, P.get('twist', 0) / len(sp))); add(n, Q(PY, P.get('tilt', 0) / len(sp)))
        k = len(self.NECK) + 1
        for n in self.NECK + [self.HEAD]:
            add(n, Q(PX, P.get('head', 0) / k)); add(n, Q(PZ, P.get('hyaw', 0) / k)); add(n, Q(PY, P.get('hroll', 0) / k))
        if self.JAW:
            add(self.JAW, Q(PX, P.get('jaw', 0)))
        for s in 'ab':
            A, L = self.ARM[s], self.LEG[s]; sg = 1 if s == 'a' else -1
            add(A[0], Q(PX, P.get('shr' + s, 0)))
            add(A[0], Q(PY, -sg * P.get('shup' + s, 0))); add(A[0], Q(PZ, -sg * P.get('shfw' + s, 0)))    # (the collarbone: + raises the shoulder, + brings it forward; 10-04, the poser's shoulder handle)
            add(A[1], Q(PX, P.get('sw' + s, 0))); add(A[1], Q(PZ, P.get('out' + s, 0)))
            add(A[2], Q(PX, P.get('el' + s, 0))); add(A[2], Q(PZ, P.get('elz' + s, 0)))
            add(A[3], Q(PX, P.get('wr' + s, 0)))
            for f in self.FING[s]:
                for n in self.chain(f):
                    add(n, Q(PX, P.get('fing' + s, 0)))
            add(L[1], Q(PX, P.get('th' + s, 0))); add(L[1], Q(PZ, P.get('thz' + s, 0)))
            add(L[2], Q(PX, P.get('kn' + s, 0)))
            add(L[3], Q(PX, P.get('ft' + s, 0)))
        return d

    def aim(self, d, names, targets, f=1.0):
        """gravity and the floor (10-04, Griz: "use gravity for the prone and death positions ... make the arms droop down"): turn each bone of a
        chain to point at its target direction in the world (the minimal turn from where the artist's pose points it, through what its parents
        already took), `f` of the way (0 leaves it, 1 lays it there). The bends of the chain's own bones are replaced; its children follow."""
        first = self.BN[names[0]].parent
        G = self.accG(d, first.name) if first else Quaternion()
        for n, T in zip(names, targets):
            pd = (self.POSE0[n] @ Vector((0, self.BN[n].length, 0)) - self.POSE0[n].translation).normalized()
            dq = pd.rotation_difference(G.inverted() @ Vector(T).normalized())
            dq = Quaternion().slerp(dq, f)
            d[n] = dq; G = G @ dq

    def lie(self, d, kind, side, f):
        """lay both arms and both legs on the floor as `kind` says (LIE: each bone toward its target), `f` of the way."""
        spec = LIE[kind]
        for sg, s in ((1, 'a'), (-1, 'b')):
            mir = lambda v: (v[0] * sg * side, v[1], v[2])
            self.aim(d, self.ARM[s][1:3], [mir(v) for v in spec['arm'][:2]], f)
            self.aim(d, self.LEG[s][1:4], [mir(v) for v in spec['leg'][:3]], f)

    def solve(self, d, lift=0.0, shift=0.0, sway=0.0, mats=False):
        """each bone's basis for bends d: its posed rotation is (the bends of every bone above it and its own, in the pose's frame) x the
        artist's; its head where its parent now carries it; the roots (all at the hip) moved together. mats: also each bone's posed matrix."""
        G, M, out = {}, {}, {}
        for n in self.ORDER:
            b = self.BN[n]; p = b.parent.name if b.parent else None
            g = (G[p] if p else Quaternion()) @ d.get(n, Quaternion()); G[n] = g
            R = g.to_matrix() @ self.POSE0[n].to_3x3()
            if p:
                C = M[p] @ self.REST[p].inverted() @ self.REST[n]; head = C.translation
            else:
                C = self.REST[n]; head = self.POSE0[n].translation + Vector((sway, shift, lift))
            M[n] = Matrix.Translation(head) @ R.to_4x4()
            out[n] = C.inverted() @ M[n]
        return (out, M) if mats else out

    # ------------------------------------------------------------------ limbs placed (the second posing, 10-04)
    def orient(self, d, name, Rw):
        """turn a bone so its whole turn from the artist's pose, in the pose's frame, is Rw (its own bend is what its parents leave)."""
        p = self.BN[name].parent
        d[name] = (self.accG(d, p.name) if p else Quaternion()).inverted() @ Rw

    def ik2(self, d, M, upper, lower, target, pole):
        """the two-bone solve: the upper bone's head stays where its parents carry it (M), the lower's tail goes to `target`, the joint between
        bends toward `pole`; each bone turned whole (its direction and its hinge both)."""
        root = M[upper].translation
        L1, L2 = self.BN[upper].length, self.BN[lower].length
        D = Vector(target) - root; Dn = D.normalized()
        dist = min(max(D.length, abs(L1 - L2) + 0.05), L1 + L2 - 0.05)
        x = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist); h = math.sqrt(max(L1 * L1 - x * x, 0.0))
        p = Vector(pole); p = (p - Dn * p.dot(Dn)).normalized()
        knee = root + Dn * x + p * h; tip = root + Dn * dist
        u0, l0 = self.dir0(upper), self.dir0(lower); n0 = u0.cross(l0)
        n1 = p.cross(Dn)                # (the cross of the two bones, for any bend toward p)
        self.orient(d, upper, (frame3(knee - root, n1) @ frame3(u0, n0).transposed()).to_quaternion())
        self.orient(d, lower, (frame3(tip - knee, n1) @ frame3(l0, n0).transposed()).to_quaternion())
        return knee

    def foot_turn(self, s, yaw, pitch):
        """a planted foot's turn: `yaw` its toes out (+) or in from the artist's, `pitch` its toes down (+: the heel up) or up."""
        sg = 1 if s == 'a' else -1
        fw = self.dir0(self.FOOT[s][1]); fw.z = 0; fw.normalize()
        qy = Q(PZ, yaw * sg); fw = qy @ fw
        return Q(PZ.cross(fw), pitch) @ qy

    def foot_raise(self, s, R):
        """how far an ankle must rise so a pitched foot rolls on its heel or its toes instead of going through the floor."""
        F, P0 = self.FOOT[s], self.POSE0
        a = P0[F[0]].translation
        pts = [P0[F[1]].translation - a, P0[F[2]].translation + self.dir0(F[2]) - a]
        return max(0.0, min(v.z for v in pts) - min((R @ v).z for v in pts))

    def stance(self, base, fa, fb, wa, wb, k):
        """a frame from a figure's standing numbers: base (its bends: lift, lean, ...), the feet fa/fb (x, y), the wrists wa/wb (from the
        shoulders); k what this frame changes (fa/fb a foot (x, y, up, yaw, pitch), wa/wb a wrist, anything else a bend)."""
        P = dict(base)
        fa, fb = k.pop('fa', tuple(fa) + (0.0, 0.0, 0.0)), k.pop('fb', tuple(fb) + (0.0, 0.0, 0.0))
        wa, wb = k.pop('wa', wa), k.pop('wb', wb)
        P.update(k)
        P['legs'] = {'a': (fa[0], fa[1], self.ANK0['a'].z + fa[2], fa[3], fa[4]), 'b': (fb[0], fb[1], self.ANK0['b'].z + fb[2], fb[3], fb[4])}
        P['arms'] = {'a': wa, 'b': wb}
        return P

    def apply(self, P):
        """pose the rig as frame P says."""
        d, lift, shift, sway = self.pose_d(P)
        for n, m in self.solve(d, lift, shift, sway).items():
            loc, rot, sc = m.decompose()
            pb = self.arm.pose.bones[n]; pb.rotation_quaternion = rot; pb.location = loc

    def pose_d(self, P):
        """frame P as a turn per bone (and where the hip goes): what `apply` poses."""
        d = self.bends(P); ARM, LEG = self.ARM, self.LEG
        if P.get('armsdown'):      # the arms hang by the legs: pulled back along the sides
            for sg, s in ((1, 'a'), (-1, 'b')):
                self.aim(d, ARM[s][1:3], [(sg * 0.22, 0.30, -0.93), (sg * 0.15, 0.10, -1.0)], P['armsdown'])
        if P.get('tuck'):          # the cat's loaf: the arms folded under the chest, the legs under the hips
            for sg, s in ((1, 'a'), (-1, 'b')):
                self.aim(d, ARM[s][1:3], [(sg * 0.35, 0.1, -0.93), (sg * -0.35, 0.75, -0.3)], P['tuck'])
                self.aim(d, LEG[s][1:4], [(sg * 0.75, -0.55, -0.35), (sg * -0.3, 0.9, -0.2), (sg * -0.1, 0.4, -0.9)], P['tuck'])
        if P.get('lie'):
            self.lie(d, P['lie'], P['lieside'], P.get('liefall', 1.0))
        lift, shift, sway = P.get('lift', 0.0), P.get('shift', 0.0), P.get('sway', 0.0)
        if P.get('legs') or P.get('arms') or P.get('hands'):     # limbs put where the pose wants them
            _, M = self.solve(d, lift, shift, sway, mats=True)
            for s, (x, y, z, yaw, pitch) in (P.get('legs') or {}).items():
                R = self.foot_turn(s, yaw, pitch); up = self.foot_raise(s, R)
                self.ik2(d, M, LEG[s][1], LEG[s][2], (x, y, z + up), P.get('kpole' + s, self.KPOLE[s]))
                self.orient(d, self.FOOT[s][0], R)
            for s, (x, y, z) in (P.get('arms') or {}).items():     # (the wrist from the shoulder joint, in the world's axes: an arm goes with the body)
                self.ik2(d, M, ARM[s][1], ARM[s][2], M[ARM[s][1]].translation + Vector((x, y, z)), P.get('epole' + s, self.EPOLE[s]))
            for s, v in (P.get('hands') or {}).items():          # a hand pointed along a world direction
                self.aim(d, [ARM[s][3]], [v])
        return d, lift, shift, sway

    # ------------------------------------------------------------------ the floor
    def posed_points(self, step=5):
        dg = bpy.context.evaluated_depsgraph_get(); oe = self.body.evaluated_get(dg); me = oe.to_mesh()
        a = np.zeros(len(me.vertices) * 3); me.vertices.foreach_get('co', a); oe.to_mesh_clear()
        M = np.array(oe.matrix_world); a = a.reshape(-1, 3)[::step]
        return a @ M[:3, :3].T + M[:3, 3]

    def lowest(self, step=4):
        bpy.context.view_layer.update()
        return float(self.posed_points(step)[:, 2].min())

    def ground(self):
        """the floor: the lowest point of the artist's own pose (a miniature stands on its base)."""
        self.apply({}); self.FLOOR = self.lowest(1)
        print('%s the ground (its lowest point in the pose) at z %.2f' % (self.log, self.FLOOR))
        return self.FLOOR

    def grounded(self, P, how):
        """seat a frame on the ground: 'plant' -- the lowest point lands on it (a step, a swing: the body rides on its feet); 'clamp' -- never
        below it (a bob, a fall: the frame keeps the lift it asked for); 'ik' -- the pose puts its own feet down."""
        FLOOR = self.FLOOR
        self.apply(P); lo = self.lowest()
        if how == 'ik':        # (only say if something else went through the floor, and where)
            if lo < FLOOR - 0.3 and P.get('legs'):     # a rolled foot's long toe claws reach past its bones: lift that ankle by what went under
                bpy.context.view_layer.update(); pp = self.posed_points(2); legs = dict(P['legs'])
                for s, (x, y, z, yaw, pitch) in P['legs'].items():
                    near = pp[(np.hypot(pp[:, 0] - x, pp[:, 1] - y) < 16) & (pp[:, 2] < z + 2)]
                    if len(near) and near[:, 2].min() < FLOOR - 0.3 and pitch:
                        legs[s] = (x, y, z + FLOOR - float(near[:, 2].min()), yaw, pitch)
                if legs != P['legs']:
                    P = dict(P, legs=legs); self.apply(P); lo = self.lowest()
            if lo < FLOOR - 0.6:
                bpy.context.view_layer.update(); pp = self.posed_points(2); k_ = int(pp[:, 2].argmin())
                print('%s WARN %s goes %.1f under the ground at x %.0f y %.0f' % (self.log, P.get('_tag', '?'), FLOOR - lo, pp[k_, 0], pp[k_, 1]))
            return P
        if how == 'plant' or lo < FLOOR:
            P = dict(P, lift=P.get('lift', 0.0) + FLOOR - lo - P.get('sink', 0.0)); self.apply(P)
        return P

    # ------------------------------------------------------------------ the rows as actions
    def key_rows(self, rows):
        """one action per row (name, frames, loop, fn(i, n) -> (P, _), how): every bone keyed on every frame, linear; a loop keys its first
        frame again at the end."""
        self.ad = ad = self.arm.animation_data_create()
        for name, n, loop, fn, how in rows:
            act = bpy.data.actions.new(name); act.use_fake_user = True; ad.action = act
            if hasattr(ad, 'action_slot') and len(act.slots):
                ad.action_slot = act.slots[0]
            for i in range(n + (1 if loop else 0)):
                P, t = fn(i % n, n); P['_tag'] = '%s %d' % (name, i % n); self.grounded(P, how)
                for pb in self.arm.pose.bones:
                    pb.keyframe_insert('rotation_quaternion', frame=i + 1, group=pb.name)
                    pb.keyframe_insert('location', frame=i + 1, group=pb.name)
            act.use_frame_range = True
            act.frame_start, act.frame_end = 1, n + (1 if loop else 0)
            act.use_cyclic = loop
            for fc in getattr(act, 'fcurves', []):
                for kp in fc.keyframe_points:
                    kp.interpolation = 'LINEAR'
        return ad

    def use(self, name):
        act = bpy.data.actions[name]; ad = self.ad; ad.action = act
        if hasattr(ad, 'action_slot') and len(act.slots):
            ad.action_slot = act.slots[0]
        return act

    # ------------------------------------------------------------------ the poser page (tools/poser.html: Griz drags the feet and hands, 10-04)
    def with_edits(self, rows, path):
        """the rows, with any frame the poser page has set (a JSON file {row: {frame: P}}) in place of the script's own: the page's frames win."""
        import json, os
        if not path or not os.path.exists(path):
            return rows
        E = json.load(open(path, encoding='utf-8'))
        out = []
        for name, n, loop, fn, how in rows:
            ed = {int(k): v for k, v in (E.get(name) or {}).items()}
            if ed:
                print('%s the poser\'s frames for %s: %s' % (self.log, name, sorted(ed)))
                fn = (lambda fn_, ed_: lambda i, n_: (dict(ed_[i]), 0) if i in ed_ else fn_(i, n_))(fn, ed)
            out.append((name, n, loop, fn, how))
        return out

    def export_poser(self, path, rows, col=None, engine=None, fps=None, fig='figure', extras=()):
        """everything the poser page needs, as one JSON file: the bones (the artist's rest and pose), what each bone is for, the mesh with its
        weights and colour (linear blend skinning: the page deforms it with the same numbers Blender does), and every row's frames as their
        numbers (P, after grounding). `check` carries two frames' bone matrices so the page can prove its own solve against this one.
        extras: [(object parented to a bone, '#rrggbb')] -- a held thing (the stone giant's club) rides its bone whole on the page."""
        import json, base64
        B64 = lambda a, dt: base64.b64encode(np.ascontiguousarray(a, dtype=dt).tobytes()).decode('ascii')
        rowm = lambda m: [float(m[i][j]) for i in range(4) for j in range(4)]
        idx = {n: i for i, n in enumerate(self.ORDER)}
        bones = [dict(n=n, p=idx[self.BN[n].parent.name] if self.BN[n].parent else -1, len=float(self.BN[n].length), rest=rowm(self.REST[n]),
                      pose0=rowm(self.POSE0[n]), deform=bool(self.BN[n].use_deform)) for n in self.ORDER]
        me = self.body.data; nv = len(me.vertices)
        co = np.zeros(nv * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
        TA = np.array(self.arm.matrix_world.inverted() @ self.body.matrix_world)
        pos = co @ TA[:3, :3].T + TA[:3, 3]
        tris = [t for p in me.polygons for t in ([(p.vertices[0], p.vertices[k], p.vertices[k + 1]) for k in range(1, len(p.vertices) - 1)])]
        gidx = {g.index: idx[g.name] for g in self.body.vertex_groups if g.name in idx and self.BN[g.name].use_deform}
        wofs, widx, wval = [0], [], []
        for v in me.vertices:
            for ge in v.groups:
                if ge.group in gidx and ge.weight > 0:
                    widx.append(gidx[ge.group]); wval.append(ge.weight)
            wofs.append(len(widx))
        if col is None:
            col = np.full((nv, 3), 0.5)
        col = np.asarray(col)[:, :3]
        for obj, hexc in extras:      # (a held thing: its points taken back to where they'd sit at rest, wholly on its bone)
            bpy.context.view_layer.update()
            b = obj.parent_bone; dg = bpy.context.evaluated_depsgraph_get(); oe = obj.evaluated_get(dg); m2 = oe.to_mesh()
            K = self.REST[b] @ self.arm.pose.bones[b].matrix.inverted() @ self.arm.matrix_world.inverted() @ oe.matrix_world
            p2 = np.array([list(K @ v.co) for v in m2.vertices]); base = len(pos)
            tris += [(base + p.vertices[0], base + p.vertices[k], base + p.vertices[k + 1]) for p in m2.polygons for k in range(1, len(p.vertices) - 1)]
            for _ in range(len(p2)):
                widx.append(idx[b]); wval.append(1.0); wofs.append(len(widx))
            lin = [((int(hexc[i:i + 2], 16) / 255) / 12.92 if int(hexc[i:i + 2], 16) / 255 <= 0.04045 else (((int(hexc[i:i + 2], 16) / 255) + 0.055) / 1.055) ** 2.4) for i in (1, 3, 5)]
            pos = np.vstack([pos, p2]); col = np.vstack([col, np.tile(lin, (len(p2), 1))])
            oe.to_mesh_clear(); nv = len(pos)
        c = np.clip(col[:, :3], 0, 1); srgb = np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)
        clean = lambda v: [clean(x) for x in v] if isinstance(v, (list, tuple, Vector)) else {k: clean(x) for k, x in v.items()} if isinstance(v, dict) else float(v) if isinstance(v, (int, float, np.floating)) and not isinstance(v, bool) else v
        R, checks = [], {}
        for name, n, loop, fn, how in rows:
            frames = []
            for i in range(n):
                P, _ = fn(i, n); P = self.grounded(dict(P, _tag='%s %d' % (name, i)), how)
                frames.append(clean({k: v for k, v in P.items() if k != '_tag'}))
                if (name, i) in ((rows[0][0], n // 2), (rows[-1][0], n - 1), (rows[min(2, len(rows) - 1)][0], 2)):
                    d, lift, shift, sway = self.pose_d(P)
                    checks['%s %d' % (name, i)] = {k: rowm(m) for k, m in self.solve(d, lift, shift, sway, mats=True)[1].items()}
            R.append(dict(name=name, engine=(engine or {}).get(name, name.lower()), n=n, loop=loop, how=how, fps=(fps or {}).get((engine or {}).get(name, name.lower()), 10), frames=frames))
        roles = dict(spine=self.SPINE, neck=self.NECK, head=self.HEAD, jaw=self.JAW, arm=self.ARM, leg=self.LEG, roots=self.ROOTS, foot=self.FOOT,
                     fing={s: [self.chain(f) for f in self.FING[s]] for s in 'ab'}, ank0={s: list(self.ANK0[s]) for s in 'ab'},
                     kpole=self.KPOLE, epole=self.EPOLE)
        out = dict(fig=fig, floor=self.FLOOR, bones=bones, roles=roles, rows=R, check=checks,
                   mesh=dict(n=nv, pos=B64(pos, '<f4'), tri=B64(np.array(tris).ravel(), '<u4'), col=B64(np.round(srgb * 255), 'u1'),
                             wofs=B64(wofs, '<u4'), widx=B64(widx, '<u2'), wval=B64(wval, '<f4')))
        json.dump(out, open(path, 'w', encoding='utf-8'))
        print('%s poser: %s (%d bones, %d points, %d triangles, %d rows)' % (self.log, path, len(bones), nv, len(tris), len(R)))

    # ------------------------------------------------------------------ tools to pose by
    def joints(self, scene, row, n, extra=()):
        """every frame of a row: its joints (bone heads; a name ending ^ is the bone's tail) as (x, y, z above the floor), and the mesh's lowest
        point and where -- a kneeling shin, a head through the floor, a hand short of its mark, read as numbers."""
        A, L = self.ARM, self.LEG
        J = [('hip', self.SPINE[0]), ('chest', self.SPINE[-1] + '^'), ('head', self.HEAD), ('kneeA', L['a'][2]), ('ankA', L['a'][3]),
             ('kneeB', L['b'][2]), ('ankB', L['b'][3]), ('shA', A['a'][1]), ('elbA', A['a'][2]), ('wrA', A['a'][3]), ('tipA', A['a'][3] + '^'),
             ('shB', A['b'][1]), ('elbB', A['b'][2]), ('wrB', A['b'][3]), ('tipB', A['b'][3] + '^')] + list(extra)
        self.use(row)
        for i in range(n):
            scene.frame_set(i + 1); bpy.context.view_layer.update()
            out = []
            for lab, b in J:
                pb = self.arm.pose.bones[b.rstrip('^')]; v = pb.tail if b.endswith('^') else pb.head
                out.append('%s(%.0f,%.0f,%.0f)' % (lab, v.x, v.y, v.z - self.FLOOR))
            pp = self.posed_points(3); k = int(pp[:, 2].argmin())
            print('%s joints %s %d low %.1f at (%.0f,%.0f) | %s' % (self.log, row, i, pp[k, 2] - self.FLOOR, pp[k, 0], pp[k, 1], ' '.join(out)))


def flat_camera(scene, view, zoom=6.4):
    """a flat orthographic view to pose by (not the sprite's): 'side' a true profile from the figure's right (-X; it faces screen right),
    'front' from in front. The floor (z 0 once the sprite camera has seated the figure) sits 86% of the way down the frame."""
    vc = bpy.data.cameras.new('flat'); vc.type = 'ORTHO'; vc.ortho_scale = zoom
    vo = bpy.data.objects.new('flat', vc); scene.collection.objects.link(vo); scene.camera = vo
    if view == 'side':
        vo.location = (-30, 0, zoom * 0.36); vo.rotation_euler = (math.radians(90), 0, math.radians(-90))
    else:
        vo.location = (0, -30, zoom * 0.36); vo.rotation_euler = (math.radians(90), 0, 0)
    return vo

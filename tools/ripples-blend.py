"""MR. RIPPLES, the Vessel (11-13): his IDLE row, first crack in Blender. Griz, relayed by the lanes desk: "Tell the Blender seat it gets first
crack at Mr. Ripples idle row, knowing that we'll have the art desk skin as needed (if it wants to include skinning instructions)"; and his 11-07:
"thinking of doing the Vessel in blender with some craziness going on, maybe as fancy as we can manage".

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python tools/ripples-blend.py -- build kit=sword+shield target=0 hero=gnollmatriarch_p1

The method is tools/lymen-blend.py's: tools/twinmace-blend.py's camera, size measure and render loop run as they are, with its bones
re-proportioned, its build() replaced and its rows replaced by an idle of eight. Writes deep16/_src/ripples/render/ (gitignored).

WHAT IS SOURCED (wiki/the-trickster.md, Mr. Ripples; wiki/dominion.md; wiki/gnoll-hills.md): a gnoll, the Skull-Gate's chief, the body swollen;
the hide black that gives back no light, with stars moving in it; he ripples mirrors; nothing silver in his face -- the taken eye an empty
socket, knit; the coin-glass at his heart closed over (so: not drawn); he makes with his thumbs.
WHAT IS THE SEAT'S (first pass, put to Griz): which socket (his LEFT, the page's inference), the size (his people's matriarch's rows, as a
stand-in), no kit and no weapon, the build (hunched, long arms, heavy hands, a hyena's head, ears and mane), the idle's motion.

THE MODEL IS A GUIDE'S: flat readable shapes in the violet ramp so the form shows -- the black of the hide, the stars in it and the mirror's
ripple are not materials here; they are laid over the silhouette after the palette snap (the sheet script), and the art desk paints over this.
"""
import bpy, bmesh, sys, os, math, importlib.util
import numpy as np
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('twinmace_blend', os.path.join(ROOT, 'tools', 'twinmace-blend.py'))
TW = importlib.util.module_from_spec(spec); spec.loader.exec_module(TW)
MQ, BP, U, lin = TW.MQ, TW.BP, TW.U, TW.lin
TW.WORK = os.path.join(ROOT, 'deep16', '_src', MQ.OPT.get('out', 'ripples')); TW.LOG = LOG = '[ripples]'
ARMK, XK = 1.24, 1.12          # the arms a quarter longer than a man's, the frame a little wider

COL = {'hide': '#432762', 'hided': '#2a1840', 'mane': '#170d22', 'pale': '#8a5cb4', 'tooth': '#eeeadc', 'eye': '#f8d67a', 'socket': '#0a0810', 'claw': '#bb96e0'}

# ---- the bones: the mannequin's, the frame widened, each arm's chain stretched from its shoulder
B = {}
for n, h, t, par in TW.BONES:
    h, t = Vector(h), Vector(t)
    if n.split('.')[0] in ('arm', 'fore', 'hand'):
        s = Vector((0.19 * (1 if n.endswith('L') else -1), 0, 1.42))
        h, t = s + (h - s) * ARMK, s + (t - s) * ARMK
    h.x *= XK; t.x *= XK
    B[n] = (h, t, par)


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    ad = bpy.data.armatures.new('mannequin'); arm = bpy.data.objects.new('mannequin', ad); scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm; arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for n, (h, t, p) in B.items():
        eb = ad.edit_bones.new(n); eb.head = h * U; eb.tail = t * U; eb.roll = 0
        if p:
            eb.parent = ad.edit_bones[p]; eb.use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    ad.bones['dummy'].use_deform = False
    bm = bmesh.new(); mats = []; W = []

    def sphere(c, radii, seg=16):
        res = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=10, radius=1.0)
        for v in res['verts']:
            v.co = Vector((c[0] + v.co.x * radii[0], c[1] + v.co.y * radii[1], c[2] + v.co.z * radii[2])) * U
        return res['verts']

    def capsule(p0, p1, r, r1=None):
        r1 = r if r1 is None else r1; p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        res = bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=16, radius1=r * U, radius2=r1 * U, depth=d.length * U,
                                    matrix=Matrix.Translation((p0 + p1) / 2 * U) @ rot)
        return list(res['verts']) + sphere(p0, (r, r, r)) + sphere(p1, (r1, r1, r1))

    def put(verts, bone, colour):
        if colour not in mats:
            mats.append(colour)
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = mats.index(colour)
        W.extend((v, bone) for v in verts)
    L = lambda a, b, t: tuple(a[k] + (b[k] - a[k]) * t for k in range(3))
    X = XK

    # the trunk: swollen through the chest and the shoulders' hump, a hollow waist; a short tail
    put(sphere((0, 0, 0.97), (0.17 * X, 0.125, 0.11)), 'hips', 'hide')
    put(capsule((0, 0, 1.03), (0, -0.01, 1.22), 0.125 * X, 0.16 * X), 'spine1', 'hide')
    put(sphere((0, -0.01, 1.35), (0.25 * X, 0.185, 0.20)), 'spine2', 'hide')
    put(capsule((0.18 * X, 0.03, 1.45), (-0.18 * X, 0.03, 1.45), 0.105), 'spine2', 'hide')
    put(sphere((0, -0.13, 1.30), (0.15 * X, 0.07, 0.13)), 'spine2', 'pale')                # the chest's paler front: where the glass is closed over
    put(capsule((0, 0.01, 1.45), (0, -0.05, 1.60), 0.095, 0.08), 'neck', 'hide')
    put(capsule((0, 0.10, 0.96), (0, 0.19, 0.72), 0.040, 0.018), 'hips', 'hided')
    # the mane: a crest of spines from the crown down the back
    for bone, p, r in (('head', (0, 0.05, 1.80), 0.050), ('head', (0, 0.11, 1.72), 0.055), ('neck', (0, 0.10, 1.58), 0.060), ('spine2', (0, 0.17, 1.47), 0.062),
                       ('spine2', (0, 0.19, 1.36), 0.058), ('spine1', (0, 0.15, 1.22), 0.050), ('spine1', (0, 0.13, 1.10), 0.040)):
        put(capsule(p, (p[0], p[1] + 0.085, p[2] + 0.075), r, r * 0.25), bone, 'mane')

    # the head: a hyena's -- a heavy skull, a long blunt muzzle, the jaw hanging a little, round ears; ONE eye, and a dark knit socket
    put(sphere((0, -0.03, 1.685), (0.118, 0.145, 0.115)), 'head', 'hide')
    put(capsule((0, -0.13, 1.665), (0, -0.315, 1.625), 0.075, 0.052), 'head', 'hide')
    put(sphere((0, -0.355, 1.635), (0.034, 0.030, 0.028)), 'head', 'mane')
    put(capsule((0, -0.10, 1.585), (0, -0.285, 1.555), 0.045, 0.032), 'head', 'hided')
    for x in (1, -1):
        put(capsule((0.095 * x, 0.04, 1.76), (0.150 * x, 0.065, 1.895), 0.046, 0.020), 'head', 'hided')
        for y in (-0.20, -0.25, -0.30):
            put(capsule((0.040 * x, y, 1.60), (0.040 * x, y, 1.572), 0.011, 0.004), 'head', 'tooth')
    put(sphere((-0.062, -0.150, 1.715), (0.022, 0.016, 0.018)), 'head', 'eye')                 # his right eye
    put(sphere((0.062, -0.150, 1.715), (0.030, 0.016, 0.026)), 'head', 'socket')               # his left: empty, knit
    put(capsule((0.035, -0.160, 1.735), (0.090, -0.150, 1.695), 0.007), 'head', 'mane')

    # the arms: long, heavy in the forearm; big hands, the THUMBS long (he makes with them)
    for s, x in (('L', 1), ('R', -1)):
        S, E, Wr, G = B['arm.' + s][0], B['fore.' + s][0], B['fore.' + s][1], B['hand.' + s][0]
        put(sphere(S, (0.105, 0.105, 0.10)), 'arm.' + s, 'hide')
        put(capsule(S, E, 0.082, 0.062), 'arm.' + s, 'hide')
        put(capsule(E, Wr, 0.070, 0.054), 'fore.' + s, 'hide')
        put(capsule(Wr, G, 0.050), 'fore.' + s, 'hided')
        put(sphere(G, (0.062, 0.062, 0.070)), 'hand.' + s, 'hided')
        d = (G - Wr).normalized()
        for k in (-1, 0, 1):          # three clawed fingers on down the hand's line
            p0 = G + d * 0.04 + Vector((0.035 * k, 0, 0)); put(capsule(p0, p0 + d * 0.10 + Vector((0.01 * k, -0.02, 0)), 0.020, 0.006), 'hand.' + s, 'claw')
        p0 = G + Vector((-0.05 * x, -0.03, 0.01)); put(capsule(p0, p0 + Vector((-0.05 * x, -0.09, -0.06)), 0.024, 0.008), 'hand.' + s, 'claw')     # the thumb, inward and forward

    # the legs: heavy thighs, lean shanks, long paws (the sole's capsule the mannequin's, on the floor)
    for s, x in (('L', 1), ('R', -1)):
        H, Kn, A = B['thigh.' + s][0], B['calf.' + s][0], B['calf.' + s][1]
        put(capsule(H, Kn, 0.105, 0.072), 'thigh.' + s, 'hide')
        put(capsule(Kn, A, 0.070, 0.046), 'calf.' + s, 'hide')
        put(capsule((A[0], 0.045, 0.040), (A[0], -0.185, 0.040), 0.040), 'foot.' + s, 'hided')
        for k in (-1, 1):
            put(capsule((A[0] + 0.022 * k, -0.19, 0.035), (A[0] + 0.03 * k, -0.245, 0.02), 0.014, 0.005), 'foot.' + s, 'claw')

    bm.verts.ensure_lookup_table(); index = {v: i for i, v in enumerate(bm.verts)}; wl = [(index[v], b) for v, b in W]
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new('mannequin_body'); bm.to_mesh(me); bm.free()
    for c in mats:
        m = bpy.data.materials.new('rp_' + c); m.diffuse_color = lin(COL[c]) + (1,); me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = True
    body = bpy.data.objects.new('mannequin_body', me); scene.collection.objects.link(body)
    for i, b in wl:
        (body.vertex_groups.get(b) or body.vertex_groups.new(name=b)).add([i], 1.0, 'REPLACE')
    vcol = np.zeros((len(me.vertices), 3))
    body.parent = arm; body.parent_type = 'OBJECT'
    body.modifiers.new('arm', 'ARMATURE').object = arm
    # ---- THE TENDRILS (11-13, Griz: "add two tendrils (where wings would come out on an angelic figure) that aren't there in frame 1 or frame 8,
    # but ... verb... out of his shoulder blades and lash nearby during idle"). The verb is the seat's: they UNSPOOL -- a bud on 2, paid out up
    # and over on 3, the lash on 4 and 5 (one over the shoulder to the front while the other cracks out to its side, then the two trade), drawn
    # back in a curl on 6, a stub on 7, gone on 8. Each frame's tendril is a tube of its own along a curve, riding the upper spine's bone and
    # there on that frame alone (its size keyed, the kit's way for a thing held on some frames); no bones, so the rig's rows are untouched.
    tend = {}
    sb = ad.bones['spine2']; pinv = (arm.matrix_world @ sb.matrix_local @ Matrix.Translation((0, sb.length, 0))).inverted()
    SHAPES = {'bud': [(0.03, 0.08, 0.05), (0.05, 0.12, 0.12)],
              'out': [(0.10, 0.14, 0.20), (0.28, 0.16, 0.42), (0.42, 0.05, 0.50), (0.48, -0.10, 0.42)],
              'front': [(0.18, 0.14, 0.30), (0.40, -0.10, 0.46), (0.46, -0.60, 0.30), (0.34, -1.10, 0.02), (0.20, -1.42, -0.20), (0.10, -1.55, -0.12)],          # (a FULL SQUARE since 11-13, his "do a full square lash": the tip a square and a half from his middle, the far side of the square in front)
              'side': [(0.20, 0.14, 0.22), (0.55, 0.06, 0.22), (0.90, -0.08, -0.02), (1.16, -0.16, -0.36), (1.28, -0.12, -0.58), (1.32, -0.04, -0.50)],
              'high': [(0.14, 0.18, 0.16), (0.36, 0.22, 0.30), (0.50, 0.12, 0.52), (0.40, 0.0, 0.66), (0.28, 0.04, 0.58)],
              'curl': [(0.07, 0.12, 0.10), (0.16, 0.17, 0.20), (0.18, 0.12, 0.31), (0.12, 0.09, 0.30)],
              'stub': [(0.03, 0.07, 0.04), (0.04, 0.10, 0.09)]}
    PLAN = {'L': {1: 'bud', 2: 'out', 3: 'front', 4: 'side', 5: 'curl', 6: 'stub'}, 'R': {1: 'bud', 2: 'out', 3: 'side', 4: 'front', 5: 'high', 6: 'stub'}}

    def tube(pts, r0, r1, seg=8, sub=6):
        P_ = [pts[0]] + pts + [pts[-1]]; path = []
        for k in range(1, len(P_) - 2):          # Catmull-Rom through the points
            for j in range(sub):
                t = j / sub; a, b, c, d = P_[k - 1], P_[k], P_[k + 1], P_[k + 2]
                path.append(0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t ** 3))
        path.append(pts[-1])
        tb = bmesh.new(); rings = []; n = len(path); up = Vector((0, 0, 1))
        for k, p in enumerate(path):
            tg = (path[min(k + 1, n - 1)] - path[max(k - 1, 0)]).normalized()
            a = tg.cross(up); a = a.normalized() if a.length > 1e-3 else Vector((1, 0, 0)); b = tg.cross(a)
            r = r0 + (r1 - r0) * (k / (n - 1)) ** 0.8
            rings.append([tb.verts.new((p + (a * math.cos(2 * math.pi * q / seg) + b * math.sin(2 * math.pi * q / seg)) * r) * U) for q in range(seg)])
        for a, b in zip(rings, rings[1:]):
            for q in range(seg):
                tb.faces.new((a[q], a[(q + 1) % seg], b[(q + 1) % seg], b[q]))
        tb.faces.new(rings[0][::-1]); tb.faces.new(rings[-1])
        bmesh.ops.recalc_face_normals(tb, faces=tb.faces[:])
        return tb
    tmat = bpy.data.materials.new('rp_tendril'); tmat.diffuse_color = lin(COL['claw']) + (1,)
    troot = bpy.data.objects.new('tendroot', None); scene.collection.objects.link(troot)          # (all of them hang from one empty on the bone: shrunk to nothing on every row but the idle -- R.use below)
    troot.parent = arm; troot.parent_type = 'BONE'; troot.parent_bone = 'spine2'; troot.matrix_parent_inverse = pinv
    for s, x in (('L', 1), ('R', -1)):
        root = Vector((0.11 * X * x, 0.15, 1.42))
        for fr, shape in PLAN[s].items():
            pts = [root - Vector((0, 0.05, 0))] + [root + Vector((px * x, py, pz)) for px, py, pz in SHAPES[shape]]
            tb = tube(pts, 0.054 if shape in ('front', 'side') else 0.048, 0.007); tme = bpy.data.meshes.new('tendril'); tb.to_mesh(tme); tb.free(); tme.materials.append(tmat)
            for p in tme.polygons:
                p.use_smooth = True
            ob = bpy.data.objects.new('tendril%s%d' % (s, fr), tme); scene.collection.objects.link(ob)
            ob.parent = troot
            for i in range(N):
                ob.scale = (1, 1, 1) if i == fr else (1e-4,) * 3; ob.keyframe_insert('scale', frame=i + 1)
            tend['t%s%d' % (s, fr)] = ob
    if MQ.OPT.get('tendrils', '1') == '0':
        for ob in tend.values():
            bpy.data.objects.remove(ob)
        tend = {}

    dme = bpy.data.meshes.new('target'); dme.from_pydata([(0, 0, 0), (0.01, 0, 0), (0, 0.01, 0)], [], [(0, 1, 2)])
    dummy = bpy.data.objects.new('target', dme); scene.collection.objects.link(dummy)
    dummy.parent = arm; dummy.parent_type = 'BONE'; dummy.parent_bone = 'dummy'
    bpy.context.view_layer.update()
    R = BP.Rig(arm, body, dict(spine=['spine1', 'spine2'], neck=['neck'], head='head',
                               arm_a=['clav.L', 'arm.L', 'fore.L', 'hand.L'], arm_b=['clav.R', 'arm.R', 'fore.R', 'hand.R'],
                               leg_a=[None, 'thigh.L', 'calf.L', 'foot.L', 'toe.L', 'toe.L'],
                               leg_b=[None, 'thigh.R', 'calf.R', 'foot.R', 'toe.R', 'toe.R'], roots=['hips'], still=['dummy']), log=LOG)
    R.ground()
    _use = R.use

    def use(name):
        _use(name); troot.scale = (1, 1, 1) if name == 'idle' else (1e-4,) * 3; bpy.context.view_layer.update()
    R.use = use
    return scene, arm, body, tend, dummy, R, vcol


N = 8


def rows(R):
    """THE IDLE, eight frames, a loop: hunched and still on planted feet, the breath slow in the swollen chest, the long arms hanging -- and what
    is not a gnoll's: the head turns a little too far and comes back a beat late, and once a loop a shudder runs up him (the ripple's passage:
    the sheet script lays the mirror band on those frames)."""
    za, zb = R.ANK0['a'].z, R.ANK0['b'].z
    L1, L2 = R.BN['arm.L'].length, R.BN['fore.L'].length

    def P(i):
        t = 2 * math.pi * i / N; br = math.sin(t); sh = (0, 0, 0, 0, 0.35, 1.0, 0.45, 0)[i]          # the breath; the shudder, frames 5-7
        hang = (L1 + L2) * (0.955 - 0.02 * sh)
        return dict(lift=(-0.115 + 0.012 * br + 0.02 * sh) * U, shift=-0.02 * U, lean=17 - 2.0 * br - 5 * sh, bodyyaw=0, twist=3 * math.sin(t + 1.0) + 4 * sh,
                    head=-12 + 3 * br - 9 * sh, hyaw=(0, 6, 14, 20, 20, 8, -6, -4)[i], shupa=4 * sh, shupb=7 * sh,
                    legs={'a': (0.155 * XK * U, -0.07 * U, za, 16, 0), 'b': (-0.155 * XK * U, 0.07 * U, zb, 24, 0)},
                    arms={'a': (0.10 * U, (-0.16 - 0.02 * br) * U, -hang), 'b': (-0.10 * U, (-0.13 + 0.02 * br) * U, -hang)},
                    epolea=(0.5, 0.6, -0.6), epoleb=(-0.5, 0.6, -0.6))
    S = 0.20          # THE WALK (11-13, his "we'll need a walk as well i think"): eight frames, a loop, in place -- a foot slides back under him over four frames and swings through lifted over four; the hips bob twice, the shoulders turn against the hips, the long arms swing against the legs; hunched lower and further forward than he stands. No tendrils.

    def foot(ph, sx, z0, yaw):
        ph %= 1.0
        if ph < 0.5:
            return (sx, (-S + 4 * S * ph) * U, z0, yaw, 0)
        u = (ph - 0.5) * 2; return (sx, (S - 2 * S * u) * U, z0 + 0.11 * U * math.sin(math.pi * u), yaw, 14 * math.sin(math.pi * u))

    def Wk(i):
        t = i / N; c = math.cos(2 * math.pi * t); hang = (L1 + L2) * 0.94
        return dict(lift=(-0.135 + 0.018 * math.cos(4 * math.pi * t)) * U, shift=-0.03 * U, lean=21, bodyyaw=-5 * c, twist=8 * c, head=-14, hyaw=0,
                    legs={'a': foot(t, 0.14 * XK * U, za, 10), 'b': foot(t + 0.5, -0.14 * XK * U, zb, 10)},
                    arms={'a': (0.10 * U, (-0.14 + 0.15 * c) * U, -hang), 'b': (-0.10 * U, (-0.14 - 0.15 * c) * U, -hang)},
                    epolea=(0.5, 0.6, -0.6), epoleb=(-0.5, 0.6, -0.6))
    import json
    os.makedirs(os.path.join(TW.WORK, 'render'), exist_ok=True)          # the positions, for the art desk's guide ({row: {frame: P}}, the poser's shape)
    json.dump({'idle': {str(i): P(i) for i in range(N)}, 'walk': {str(i): Wk(i) for i in range(N)}}, open(os.path.join(TW.WORK, 'render', 'ripples-poses.json'), 'w'), indent=1)
    return [('idle', N, True, lambda i, n: (P(i), 0), 'ik'), ('walk', N, True, lambda i, n: (Wk(i), 0), 'ik')]


def look(scene):
    _look(scene)
    sh = scene.display.shading; sh.show_cavity = True; sh.cavity_type = 'WORLD'; sh.cavity_ridge_factor = 0.0; sh.cavity_valley_factor = 0.6
    for st in bpy.data.linestyles:
        st.thickness = 0.45 * MQ.SS; st.color = lin('#0a0810')


_look, _frame = MQ.look, MQ.frame_cam


def frame_cam(scene, cam, fw, fh, ax, oy):
    if (fw, fh, ax) == (64, 80, 32):          # (the size measure's cell is a man's: a figure this tall wants one twice the size)
        fw, fh, ax, oy = 128, 160, 64, oy + 80
    _frame(scene, cam, fw, fh, ax, oy)


MQ.frame_cam = frame_cam
TW.build, TW.rows, MQ.look = build, rows, look
TW.SLASH['ty'] = -1.4
TW.ROWS_META['idle'] = dict(fps=6)
TW.ROW = 'walk'; TW.ROWS_META['walk'] = dict(fps=10, release=3)

if __name__ == '__main__':
    TW.main()

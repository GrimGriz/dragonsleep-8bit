"""The mannequin (10-31): a neutral figure posed in code, its renders a pose reference the art desk skins with a hero. Griz, 10-31: "What if we
did stick figure modeling in blender for the various attacks (1H slashing (longswordish), 1H piercing (rapierish), and gave the image gens a
stick-figure request with character art 'skin these figures with this character'". The pilot is one family, the 1H slash; Blender pins the
motion, the timing, the facings, the size and the feet, and the generator only skins it (deep16/art-src/mannequin/README.md: how to judge
what comes back).

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python tools/mannequin-blend.py -- build [hero=barley_p3] [ss=8]
    ... -- poser        the same, and deep16/_src/mannequin/poser.json for tools/poser.html?fig=mannequin (gitignored)

Then `python tools/mannequin-sheet.py` lays the renders on the cell grid and writes the reference strips.

The figure is built here, not loaded: an armature of 21 bones in a plain standing pose, and over it capsules, one rigid piece a bone (each
weighted wholly to its bone), so tools/blender_pose.py's Rig poses it as it poses an artist's rig. The colours say which side is which, since
the cutter mirrors the side rows (SE for SW, E for W, NE for NW) and handedness must read on the page -- in the poser page's own key (tools/
poser.js CA, CB): his LEFT arm orange and his left leg a darker orange, his RIGHT arm blue and his right leg a darker blue, the hands a lighter
shade of their side; the body grey, the head pale with a
nose (the face is the side the nose is on). The weapon is a bar in the right fist: a dark grip, a gold guard (a disc, so the hand's roll
never shows), a magenta blade, its last part pale so the bar's way reads.

The sword wrist (Griz's eye on the first renders, 10-31: "the way the swords look make it seem like something about the wrists is being
overlooked" -- the blade grew out of the wrist joint itself, aimed anywhere, 23 degrees off the forearm at the follow-through: a lance
welded on): the hand runs on from the wrist along the forearm's line (HAND, 7 cm, the back of the hand riding the forearm) to the fist, the
right hand bone starts there and points along the blade, the grip through the fist; and the blade is held to WRIST degrees off the forearm,
a one-hand grip's reach -- the wrist cocked toward the little finger brings the blade toward the arm's line, never onto it (`wrist` below
turns an aim that asks more, in the plane of the forearm and the aim, and says so). `-- wrists` prints each frame's angle. The figure faces -Y (render-sprites' way: facing f
turns it to 45 - 45 f degrees); +X is its left (blender_pose's side `a`), -X its right (`b`). It is built in metres and scaled by U into the
page's units (the poser's handles are sized for a figure ~60 high, the troll's); the render's scale is set by the hero's height, whatever U is.

Its size is the hero's: the mannequin's IDLE from the front stands as many rows as the hero's own idle S frame (barley_p3: 48, the feet's row
to the crown's), measured on the rendered pixels and scaled till it does. Its feet stay planted through every row, so they register: each
facing is framed so the lowest sole sits on the cell's anchor row, as the cutters stand a figure (the feet line).

Rows (blender_pose frames: the feet placed, the wrists placed from the shoulders, the hand aimed along a world direction):
    IDLE 1   the stance and the blade lowered, its tip on the floor ahead: the size measure
    SLASH 6  a one-handed forehand cut, high right to low left, the feet planted: 1 guard, 2 wind-up (the blade back over the right shoulder),
             3 the swing, 4 THE HIT (the release frame, index 3: js/battle.js strikes on it), 5 the follow-through low on the left, 6 back
             to guard. 12 fps, as barley_p3's attack.

Writes deep16/_src/mannequin/render/<row>/<facing>_<frame>.png at ss x the 1x cell (the five drawn facings: S, SE, E, NE, N) and meta.json:
each row's cell (fw, fh, ax, ay), and for every facing and frame the right fist, the guard, the blade's tip, the pommel, the soles and the
crown in 1x px from the cell's top left, and whether the body hides the fist -- the rig's own grip, for the engine's code-drawn weapon
(js/sprites.js S.gripAt's `grips`).
"""
import bpy, bmesh, sys, os, math, json, importlib.util
import numpy as np
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, 'deep16', '_src', 'mannequin')
spec = importlib.util.spec_from_file_location('blender_pose', os.path.join(ROOT, 'tools', 'blender_pose.py'))
BP = importlib.util.module_from_spec(spec); spec.loader.exec_module(BP)

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OPT = dict(a.split('=', 1) for a in ARGS if '=' in a)
MODE = next((a for a in ARGS if '=' not in a), 'build')
HERO = OPT.get('hero', 'barley_p3')
SS = int(OPT.get('ss', 8))
TW, UPS = 64, 1.6                     # tools/render-sprites.py's: a 5-ft square 64 px wide, 1.6 units a square
K = TW / (UPS * math.sqrt(2))         # px (at 1x) per unit across the screen
FACINGS = [('S', 0), ('SE', 7), ('E', 6), ('NE', 5), ('N', 4)]     # the five drawn (RULED 10-14); SW W NW are SE E NE mirrored
PAD = 3
LOG = '[mannequin]'


def lin(h):
    return tuple(((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)))


U = 30.0                              # units a metre
COL = {   # sRGB; the sides (Griz's ask: the left and right limbs coloured differently), as the poser keys them: left orange, right blue
    'body': '#a9a9a2', 'pelvis': '#7c7c76', 'head': '#ead2b4', 'nose': '#c08a62',
    'armL': '#f0642e', 'legL': '#b2401c', 'handL': '#ffa878', 'footL': '#7e2a10',
    'armR': '#3c82f0', 'legR': '#2050aa', 'handR': '#8cbcff', 'footR': '#14306e',
    'grip': '#4a2e14', 'guard': '#e8c040', 'blade': '#ff2ed2', 'tip': '#ffb0f2',
}

# ------------------------------------------------------------------ the bones: (name, head, tail, parent), in the plain standing pose
BONES = [
    ('hips', (0, 0, 0.95), (0, 0, 1.05), None),
    ('spine1', (0, 0, 1.05), (0, 0, 1.25), 'hips'),
    ('spine2', (0, 0, 1.25), (0, 0, 1.45), 'spine1'),
    ('neck', (0, 0, 1.45), (0, 0, 1.54), 'spine2'),
    ('head', (0, 0, 1.54), (0, 0, 1.78), 'neck'),
]
for s, x in (('L', 1), ('R', -1)):
    BONES += [
        ('clav.' + s, (0.03 * x, 0, 1.42), (0.19 * x, 0, 1.42), 'spine2'),
        ('arm.' + s, (0.19 * x, 0, 1.42), (0.21 * x, 0.02, 1.14), 'clav.' + s),          # (the elbow a little back and the wrist a little
        ('fore.' + s, (0.21 * x, 0.02, 1.14), (0.22 * x, -0.04, 0.89), 'arm.' + s),      # forward: the two-bone solve wants a bend to keep)
        ('thigh.' + s, (0.10 * x, 0, 0.95), (0.10 * x, -0.04, 0.51), 'hips'),
        ('calf.' + s, (0.10 * x, -0.04, 0.51), (0.10 * x, 0, 0.09), 'thigh.' + s),
        ('foot.' + s, (0.10 * x, 0, 0.09), (0.10 * x, -0.10, 0.03), 'calf.' + s),
        ('toe.' + s, (0.10 * x, -0.10, 0.03), (0.10 * x, -0.17, 0.03), 'foot.' + s),
    ]
HAND = 0.07                                                                   # (the wrist to the fist's middle)
_e, _w = Vector((-0.21, 0.02, 1.14)), Vector((-0.22, -0.04, 0.89)); GRIP = tuple(_w + (_w - _e).normalized() * HAND)
BONES += [('hand.L', (0.22, -0.04, 0.89), (0.22, -0.045, 0.81), 'fore.L'),    # the left hand hangs on down the forearm
          ('hand.R', GRIP, (GRIP[0], GRIP[1] - 0.08, GRIP[2]), 'fore.R')]     # the right hand bone from the fist, along the blade: aiming it aims
                                                                              # the sword about the fist (the forearm carries the fist)

# ------------------------------------------------------------------ the pieces: (kind, bone, colour, args) -- a capsule (p0, p1, r) or an egg (centre, radii)
PIECES = [
    ('egg', 'hips', 'pelvis', ((0, 0, 0.97), (0.15, 0.10, 0.09))),
    ('cap', 'spine1', 'body', ((0, 0, 1.04), (0, 0, 1.22), 0.12)),
    ('egg', 'spine2', 'body', ((0, 0.005, 1.33), (0.17, 0.11, 0.14))),
    ('cap', 'spine2', 'body', ((0.16, 0, 1.41), (-0.16, 0, 1.41), 0.065)),
    ('cap', 'neck', 'body', ((0, 0, 1.45), (0, 0, 1.54), 0.045)),
    ('egg', 'head', 'head', ((0, 0.0, 1.665), (0.12, 0.13, 0.145))),          # (a head about a sixth of the height: the art desk's heroes draw
    ('cap', 'head', 'nose', ((0, -0.11, 1.645), (0, -0.17, 1.63), 0.034)),     # big heads, and the fists sit where theirs will)
]
for s, x, side in (('L', 1, 'L'), ('R', -1, 'R')):
    PIECES += [
        ('cap', 'arm.' + s, 'arm' + side, ((0.19 * x, 0, 1.42), (0.21 * x, 0.02, 1.14), 0.052)),
        ('cap', 'fore.' + s, 'arm' + side, ((0.21 * x, 0.02, 1.14), (0.22 * x, -0.04, 0.89), 0.044)),
        ('cap', 'thigh.' + s, 'leg' + side, ((0.10 * x, 0, 0.95), (0.10 * x, -0.04, 0.51), 0.068)),
        ('cap', 'calf.' + s, 'leg' + side, ((0.10 * x, -0.04, 0.51), (0.10 * x, 0, 0.09), 0.052)),
        ('cap', 'foot.' + s, 'foot' + side, ((0.10 * x, 0.035, 0.036), (0.10 * x, -0.155, 0.036), 0.036)),   # (a boot: the sole on the floor, z 0)
    ]
PIECES += [('egg', 'hand.L', 'handL', ((0.22, -0.045, 0.83), (0.05, 0.05, 0.06))),
           ('cap', 'fore.R', 'handR', ((-0.22, -0.04, 0.89), GRIP, 0.04)),           # (the back of the hand, on the forearm's line)
           ('egg', 'hand.R', 'handR', (GRIP, (0.052, 0.052, 0.052)))]               # (the fist round the grip)

# the sword, in the right hand bone's own frame (y along the bone from its head, which is the wrist): the grip through the fist
SWORD = [('pommel', 'grip', -0.085, -0.06, 0.032), ('grip', 'grip', -0.06, 0.06, 0.024), ('guard', 'guard', 0.06, 0.08, 0.085),
         ('blade', 'blade', 0.08, 0.80, 0.032), ('tip', 'tip', 0.80, 0.95, 0.032)]     # (along the hand bone from the fist's middle; a bar about 2 px wide at 1x)
FIST = 0.0               # (the fist's middle, along the hand bone: where the grip sits, the point the engine's weapon is drawn from)
WRIST = (40, 110)        # (the blade's angle off the forearm a one-hand grip reaches, degrees)


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

    bm = bmesh.new(); groups = {}; mats = list(COL); vcol = []

    def mark(verts, bone, colour):
        mi = mats.index(colour)
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = mi
        groups.setdefault(bone, []).extend(verts)

    def sphere(c, radii):
        res = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1.0)
        for v in res['verts']:
            v.co = Vector((c[0] + v.co.x * radii[0], c[1] + v.co.y * radii[1], c[2] + v.co.z * radii[2])) * U
        return res['verts']

    def capsule(p0, p1, r):
        p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        res = bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=16, radius1=r * U, radius2=r * U, depth=d.length * U,
                                    matrix=Matrix.Translation((p0 + p1) / 2 * U) @ rot)
        return list(res['verts']) + sphere(p0, (r, r, r)) + sphere(p1, (r, r, r))

    for kind, bone, colour, a in PIECES:
        mark(sphere(*a) if kind == 'egg' else capsule(*a), bone, colour)
    bm.verts.ensure_lookup_table()
    me = bpy.data.meshes.new('mannequin_body'); bm.to_mesh(me)
    index = {v: i for i, v in enumerate(bm.verts)}
    bm.free()
    body = bpy.data.objects.new('mannequin_body', me); scene.collection.objects.link(body)
    for c in mats:
        m = bpy.data.materials.new(c); m.diffuse_color = lin(COL[c]) + (1,); me.materials.append(m)
    for bone, vs in groups.items():
        g = body.vertex_groups.new(name=bone); g.add([index[v] for v in vs], 1.0, 'REPLACE')
    vcol = np.zeros((len(me.vertices), 3))
    for p in me.polygons:
        for vi in p.vertices:
            vcol[vi] = lin(COL[mats[p.material_index]])
    body.parent = arm; body.parent_type = 'OBJECT'
    mod = body.modifiers.new('arm', 'ARMATURE'); mod.object = arm

    # the sword: its own object on the right hand bone (bone-parented: its frame is the bone's, from the bone's tail)
    bm = bmesh.new(); sm = []
    hb = ad.bones['hand.R']; L = hb.length
    for name, colour, y0, y1, r in SWORD:
        if colour not in sm:
            sm.append(colour)
        rot = Matrix.Rotation(math.radians(-90), 4, 'X')      # (the cone's axis Z laid along the bone's Y)
        res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=16, radius1=r * U, radius2=r * U, depth=(y1 - y0) * U,
                                    matrix=Matrix.Translation((0, (y0 + y1) / 2 * U - L, 0)) @ rot)
        for f in {f for v in res['verts'] for f in v.link_faces}:
            f.material_index = sm.index(colour)
    sme = bpy.data.meshes.new('sword'); bm.to_mesh(sme); bm.free()
    for c in sm:
        m = bpy.data.materials.new('sword_' + c); m.diffuse_color = lin(COL[c]) + (1,); sme.materials.append(m)
    sword = bpy.data.objects.new('sword', sme); scene.collection.objects.link(sword)
    sword.parent = arm; sword.parent_type = 'BONE'; sword.parent_bone = 'hand.R'; sword.matrix_parent_inverse = Matrix.Identity(4)
    bpy.context.view_layer.update()

    R = BP.Rig(arm, body, dict(spine=['spine1', 'spine2'], neck=['neck'], head='head',
                               arm_a=['clav.L', 'arm.L', 'fore.L', 'hand.L'], arm_b=['clav.R', 'arm.R', 'fore.R', 'hand.R'],
                               leg_a=[None, 'thigh.L', 'calf.L', 'foot.L', 'toe.L', 'toe.L'],
                               leg_b=[None, 'thigh.R', 'calf.R', 'foot.R', 'toe.R', 'toe.R'], roots=['hips']), log=LOG)
    R.ground()
    return scene, arm, body, sword, R, vcol


# ------------------------------------------------------------------ the rows
def rows(R):
    za, zb = R.ANK0['a'].z, R.ANK0['b'].z
    LEGS = {'a': (0.13 * U, -0.11 * U, za, 10, 0), 'b': (-0.13 * U, 0.11 * U, zb, 30, 0)}    # the stance: the left foot forward, the right back and turned out

    def P(lift, shift=0.0, bodyyaw=0, twist=0, lean=0, tilt=0, hyaw=0, head=0, wR=(0, 0, 0), dR=(0, -1, 0), wL=(0, 0, -0.46), poleR=None):
        m = lambda v: tuple(x * U for x in v)       # (the numbers below in metres)
        p = dict(lift=lift * U, shift=shift * U, bodyyaw=bodyyaw, twist=twist, lean=lean, tilt=tilt, hyaw=hyaw, head=head,
                 legs=dict(LEGS), arms={'a': m(wL), 'b': m(wR)}, hands={'b': dR})
        if poleR:
            p['epoleb'] = poleR
        return p

    IDLE = [P(-0.05, wR=(0.03, -0.20, -0.40), dR=(0.06, -0.62, -0.78), wL=(0.03, -0.06, -0.46))]
    SLASH = [
        P(-0.05, bodyyaw=-5, twist=-5, lean=4, hyaw=5, wR=(0.04, -0.30, -0.22), dR=(0.18, -0.45, 0.87), wL=(0.0, -0.20, -0.36)),    # 1 guard
        P(-0.06, shift=0.03, bodyyaw=-18, twist=-22, lean=-4, hyaw=20,                                                              # 2 wind-up
          wR=(-0.12, 0.06, 0.38), dR=(-0.45, 0.25, 0.86), wL=(0.06, -0.36, -0.08)),   # (the blade up behind the right shoulder: straight back
                                                                                    # it points at the camera from NE and NW, a stub)
        P(-0.07, bodyyaw=-2, twist=0, lean=8, hyaw=2, wR=(0.0, -0.24, 0.32), dR=(-0.35, -0.15, 0.92), wL=(0.08, -0.25, -0.22)),    # 3 swing (the blade
                                                                                                                                    # near upright: it reads in every view)
        P(-0.09, shift=-0.06, bodyyaw=14, twist=16, lean=14, hyaw=-14, head=6,                                                     # 4 THE HIT
          wR=(0.16, -0.46, -0.02), dR=(0.38, -0.86, -0.34), wL=(0.12, 0.02, -0.38)),
        P(-0.08, shift=-0.05, bodyyaw=22, twist=26, lean=16, hyaw=-22, head=8,                                                     # 5 follow-through
          wR=(0.34, -0.28, -0.36), dR=(0.62, -0.20, -0.76), wL=(0.10, 0.06, -0.38)),
        P(-0.06, shift=-0.01, bodyyaw=6, twist=6, lean=8, hyaw=-4, wR=(0.12, -0.34, -0.18), dR=(0.22, -0.50, 0.84), wL=(0.03, -0.14, -0.38)),  # 6 recover
    ]
    def wrist(P, tag):
        """the aim held to what a wrist can do: the blade WRIST degrees off the forearm at most and least, turned in the plane of the two."""
        Q = {k: v for k, v in P.items() if k != 'hands'}
        d, lift, shift, sway = R.pose_d(Q); M = R.solve(d, lift, shift, sway, mats=True)[1]['fore.R']
        f = (M @ Vector((0, R.BN['fore.R'].length, 0)) - M.translation).normalized(); b = Vector(P['hands']['b']).normalized()
        th = math.degrees(f.angle(b)); t = min(max(th, WRIST[0]), WRIST[1])
        if abs(t - th) > 0.5:
            q = (b - f * b.dot(f)).normalized(); b = f * math.cos(math.radians(t)) + q * math.sin(math.radians(t))
            print('%s %s: the aim asked the wrist %.0f degrees off the forearm; held to %.0f' % (LOG, tag, th, t))
        return dict(P, hands={'b': tuple(b)})
    mk = lambda name, F: (lambda i, n: (wrist(dict(F[i]), '%s %d' % (name, i + 1)), 0))
    return [('idle', 1, False, mk('idle', IDLE), 'ik'), ('slash', 6, False, mk('slash', SLASH), 'ik')]


ROWS_META = {'idle': dict(fps=6), 'slash': dict(fps=12, release=3)}


# ------------------------------------------------------------------ the camera: render-sprites' 2:1 dimetric, framed a facing at a time
def make_camera(scene):
    cd = bpy.data.cameras.new('iso'); cd.type = 'ORTHO'; cd.clip_end = 200
    cam = bpy.data.objects.new('iso', cd); scene.collection.objects.link(cam); scene.camera = cam
    cam.rotation_euler = (math.radians(60), 0, math.radians(45))
    bpy.context.view_layer.update()
    return cam


def axes(cam):
    R3 = cam.matrix_world.to_3x3()
    return np.array(R3.col[0]), np.array(R3.col[1]), np.array(R3.col[2])      # screen right, screen up, toward the viewer


def frame_cam(scene, cam, fw, fh, ax, oy):
    """the cell fw x fh at 1x, the rig's origin at (ax, oy) px from its top left."""
    cam.data.ortho_scale = max(fw, fh) / K
    rv, uv, bv = (Vector(a) for a in axes(cam))
    cam.location = bv * 40 + uv * ((oy - fh / 2) / K) - rv * ((ax - fw / 2) / K)
    r = scene.render; r.resolution_x, r.resolution_y, r.resolution_percentage = fw * SS, fh * SS, 100
    bpy.context.view_layer.update()


def look(scene):
    r = scene.render; r.engine = 'BLENDER_WORKBENCH'; r.film_transparent = True
    r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'Standard'
    sh = scene.display.shading; sh.light = 'STUDIO'; sh.studio_light = 'Default'; sh.color_type = 'MATERIAL'
    sh.show_cavity = False; sh.show_specular_highlight = False; sh.show_shadows = False
    scene.display.render_aa = '8'
    r.use_freestyle = True                        # (a dark line round each piece, inside the figure as well: the arm across the body reads)
    vl = bpy.context.view_layer; vl.use_freestyle = True
    fs = vl.freestyle_settings; fs.crease_angle = math.radians(120)
    ls = fs.linesets.new('lines'); ls.select_silhouette = True; ls.select_border = True; ls.select_crease = False
    ls.select_contour = True; ls.select_external_contour = False
    st = ls.linestyle; st.thickness = 0.8 * SS; st.thickness_position = 'CENTER'; st.color = lin('#0c1018')


def set_facing(arm, f):
    arm.rotation_euler = (0, 0, math.radians(45 - 45 * f)); bpy.context.view_layer.update()


def world_pts(obj, step=1):
    dg = bpy.context.evaluated_depsgraph_get(); oe = obj.evaluated_get(dg); me = oe.to_mesh()
    a = np.zeros(len(me.vertices) * 3); me.vertices.foreach_get('co', a); oe.to_mesh_clear()
    M = np.array(oe.matrix_world); a = a.reshape(-1, 3)[::step]
    return a @ M[:3, :3].T + M[:3, 3]


def soles(body, R):
    """the posed points of both boots' soles (on the floor: the rig's origin is on it, so a scale keeps it at z 0)."""
    w = world_pts(body)
    return w[w[:, 2] < R.FLOOR + 0.005 * U * body.parent.scale[0]]


def screen(cam, w):
    """world points -> (right, down) in 1x px from the rig's origin."""
    rv, uv, _ = axes(cam)
    return np.stack([w @ rv * K, -(w @ uv) * K], axis=1)


def depth(cam, w):
    return np.asarray(w) @ axes(cam)[2]        # (toward the viewer: more is nearer)


def hero_height():
    """the hero's idle S frame: rows from the crown to the feet (the cutters' measure: barley_p3 48)."""
    J = json.load(open(os.path.join(ROOT, 'deep16', 'art', HERO + '.json'), encoding='utf-8'))
    img = bpy.data.images.load(os.path.join(ROOT, 'deep16', 'art', HERO + '.png'))
    W, H = img.size; px = np.empty(W * H * 4, np.float32); img.pixels.foreach_get(px); px = px.reshape(H, W, 4)[::-1]
    a = J['anims']['idle']; fw = a.get('fw', J['fw']); fh = a.get('fh', J['fh']); y0 = a.get('y', 0)
    cell = px[y0:y0 + fh, 0:fw, 3] > 0
    ys = np.where(cell.any(1))[0]
    return int(ys[-1] - ys[0]), fw, fh, a.get('ax', J['ax']), a.get('ay', J['ay'])


def render_alpha(scene, path):
    scene.render.filepath = path; bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(path); W, H = img.size
    px = np.array(img.pixels[:]).reshape(H, W, 4)[::-1]; bpy.data.images.remove(img)
    return px[..., 3].reshape(H // SS, SS, W // SS, SS).mean(axis=(1, 3)) >= 0.5


def main():
    scene, arm, body, sword, R, vcol = build()
    rowdefs = rows(R)
    R.key_rows(rowdefs)
    if MODE == 'wrists':     # each frame's sword wrist: the blade's angle off the forearm (a fist on a grip holds it near 90; the rest pose's is 90)
        for name, n, loop, fn, how in rowdefs:
            R.use(name)
            for i in range(n):
                scene.frame_set(i + 1); bpy.context.view_layer.update()
                fo, hd = arm.pose.bones['fore.R'], arm.pose.bones['hand.R']
                a = math.degrees((fo.tail - fo.head).angle(hd.tail - hd.head))
                print('%s wrists %s %d: the blade %.0f deg off the forearm' % (LOG, name, i + 1, a))
        return
    cam = make_camera(scene); look(scene)
    os.makedirs(os.path.join(WORK, 'render'), exist_ok=True)

    # ---- the size: the mannequin's idle from the front as many rows tall as the hero's idle S
    want, hfw, hfh, hax, hay = hero_height()
    print('%s %s idle S: %d rows, crown to feet' % (LOG, HERO, want))
    R.use('idle'); scene.frame_set(1); s = 1.0 / U; got = None; sword.hide_render = True     # (the body alone, crown to soles)
    for it in range(6):
        arm.scale = (s, s, s); set_facing(arm, 0)
        lo = screen(cam, soles(body, R))[:, 1].max()
        frame_cam(scene, cam, 64, 80, 32, 70 + 0.9 - lo)
        a = render_alpha(scene, os.path.join(WORK, 'render', '_measure.png'))
        ys = np.where(a.any(1))[0]; got = int(ys[-1] - ys[0])
        print('%s scale %.4f: %d rows' % (LOG, s, got))
        if got == want:
            break
        s *= (want + 0.5) / (got + 0.5)
    assert got == want, 'the mannequin never stood %d rows' % want
    sword.hide_render = False
    SCALE = s

    # ---- each row's cell: as wide and tall as it reaches over the five facings, the feet's row its anchor
    D = {}
    for name, n, loop, fn, how in rowdefs:
        R.use(name); ext = []
        for fname, f in FACINGS:
            set_facing(arm, f); scene.frame_set(1)
            lo = screen(cam, soles(body, R))[:, 1].max()           # (the lowest sole, px below the origin: planted, the same every frame)
            D.setdefault(fname, {})[name] = float(lo)
            for i in range(n):
                scene.frame_set(i + 1)
                p = screen(cam, np.vstack([world_pts(body, 2), world_pts(sword)]))
                ext.append((p[:, 0].min(), p[:, 0].max(), (p[:, 1] - lo).min(), (p[:, 1] - lo).max()))
        e = np.array(ext)
        ax = int(math.ceil(max(-e[:, 0].min(), e[:, 1].max()) + PAD)); fw = 2 * ax
        ay = int(math.ceil(-e[:, 2].min() + PAD)); fh = ay + int(math.ceil(max(e[:, 3].max(), 0) + PAD)) + 1; fh += fh % 2
        if name == 'idle' and ax <= hax and ay <= hay and fh - ay <= hfh - hay:     # (the idle in the hero's own cell, to lay beside his)
            fw, fh, ax, ay = hfw, hfh, hax, hay
        ROWS_META[name].update(fw=fw, fh=fh, ax=ax, ay=ay, frames=n)
        print('%s %s: the cell %dx%d, the anchor %d,%d' % (LOG, name, fw, fh, ax, ay))

    # ---- render, and the points the cutter and the engine read
    meta = dict(hero=HERO, hero_rows=want, scale=SCALE, ss=SS, k=K, facings=[f for f, _ in FACINGS], rows={}, points={})
    hb = arm.pose.bones['hand.R']
    for name, n, loop, fn, how in rowdefs:
        R.use(name); M = ROWS_META[name]; meta['rows'][name] = dict(M)
        os.makedirs(os.path.join(WORK, 'render', name), exist_ok=True)
        for fname, f in FACINGS:
            set_facing(arm, f)
            lo = D[fname][name]; oy = M['ay'] + 0.9 - lo                 # (the lowest sole's bottom 0.9 px into the anchor row: that row is the feet's)
            frame_cam(scene, cam, M['fw'], M['fh'], M['ax'], oy)
            pts = []
            for i in range(n):
                scene.frame_set(i + 1); bpy.context.view_layer.update()
                Mw = arm.matrix_world @ hb.matrix
                along = lambda y: np.array(Mw @ Vector((0, y, 0)))
                fist, pommel, guard, tip = along(FIST * U), along(SWORD[0][2] * U), along(SWORD[2][2] * U), along(SWORD[-1][3] * U)
                chest = np.array(arm.matrix_world @ arm.pose.bones['spine2'].head)
                sl = soles(body, R); left = sl @ np.array(arm.matrix_world.to_3x3().col[0]) > 0     # (+X is its left)
                wb = world_pts(body, 1); crown = wb[screen(cam, wb)[:, 1].argmin()]                   # (the body's highest point on the screen)
                sc = lambda w: [round(float(v), 2) for v in (screen(cam, np.array([w]))[0] + np.array([M['ax'], oy]))]
                pts.append(dict(fist=sc(fist), pommel=sc(pommel), guard=sc(guard), tip=sc(tip), crown=sc(crown),
                                under=bool(depth(cam, [fist])[0] < depth(cam, [chest])[0] - 0.02 * U * SCALE),
                                soleL=sc(sl[left].mean(0)), soleR=sc(sl[~left].mean(0))))
                scene.render.filepath = os.path.join(WORK, 'render', name, '%s_%02d.png' % (fname, i))
                bpy.ops.render.render(write_still=True)
            meta['points'].setdefault(name, {})[fname] = pts
            print('%s %s %s rendered' % (LOG, name, fname))
    json.dump(meta, open(os.path.join(WORK, 'render', 'meta.json'), 'w'), indent=1)
    print('%s ok: %s' % (LOG, os.path.join(WORK, 'render', 'meta.json')))

    if MODE == 'poser':
        arm.scale = (1, 1, 1); set_facing(arm, 0); arm.rotation_euler = (0, 0, 0); bpy.context.view_layer.update()
        R.export_poser(os.path.join(WORK, 'poser.json'), rowdefs, col=vcol, fig='mannequin', fps={k: v['fps'] for k, v in ROWS_META.items()},
                       extras=[(sword, COL['blade'])])


if __name__ == '__main__':      # (run by Blender's --python; imported -- the Willem seat's tools/willem-blend.py, 10-31 -- it builds nothing on its own)
    main()

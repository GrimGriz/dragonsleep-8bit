"""Willem Glass on the mannequin (10-31). Griz: "Try to redo our current code-drawn willem with the new posing mannequin. Our code-drawn
figures are generally 'bulbous' in compared to the sprites, this might help". willem_p1 is the KayKit Mage (tools/deep16-figures.json):
a chibi whose hat is wider than he is and whose head is a third of him, beside heroes the art desk draws at a sixth. This builds him on the
mannequin's own bones and proportions (tools/mannequin-blend.py, read here and not changed) -- the robe, the hat, the wand dressed on in
pieces, each rigid to its bone as the mannequin's are -- poses his five rows with tools/blender_pose.py's Rig, and renders them as
tools/render-sprites.py does, so `python tools/pixelate.py p1 willemglass` makes the sheet (deep16/art/willemglass_p1).

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python tools/willem-blend.py -- build [hero=barley_p3]
    ... -- build only=idle,walk:0,7      some rows, some facings (render-sprites' D16_ONLY way): a look test, into render/willemglass-test/

His head is the art desk's town people's (10-31, Griz: "Would you say the NPC sprites are 25% head size increase? We'd want to match that
as we B"): measured as they are -- the crown to the neck's narrowest row over the height, on the pixelated idle S -- the town's thirty run 20-25%,
the median 22.4%; the mannequin's own head is 16%, a quarter bigger 18%, and HEADK 1.7 (the default) 22%. The hat sits on that head and is
tipped back 10 degrees (the face shows under the brim from the game's camera), its brim and height grown a third as much as the head (grown
with it, the brim came back to the KayKit's). headk=1 hattilt=0 is the mannequin's own proportion.

His colours are the first game's Willem (first/js/sprites.js: the pale blond hair, the fair skin, the navy cloth and its pale trim, the robe);
the hat and the wand are willem_p1's. His height is the hero's (barley_p3's idle S, crown to feet, the hat left off the measure), as the
mannequin's is. All eight facings are rendered (the wand is in his right hand: a mirror would move it), the rows as willem_p1's: IDLE 8,
WALK 8, ATTACK 8 (the wand's shot), SIT 2 (on the floor), CAST 8.
"""
import bpy, bmesh, sys, os, re, math, json
import numpy as np
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MQ = os.path.join(ROOT, 'tools', 'mannequin-blend.py')
_src = re.sub(r'\nmain\(\)\s*$', '\n', open(MQ, encoding='utf-8').read())     # (its own run left out; a guarded run never fires under this name)
MN = {'__file__': MQ, '__name__': 'mannequin'}
exec(compile(_src, MQ, 'exec'), MN)
BP, U, K, BONES, GRIP, lin = MN['BP'], MN['U'], MN['K'], MN['BONES'], MN['GRIP'], MN['lin']
screen, soles, world_pts, set_facing, frame_cam, make_camera = MN['screen'], MN['soles'], MN['world_pts'], MN['set_facing'], MN['frame_cam'], MN['make_camera']

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OPT = dict(a.split('=', 1) for a in ARGS if '=' in a)
HERO = OPT.get('hero', 'barley_p3')
SS = MN['SS'] = 4                      # (pipeline 1's supersample: pixelate.py boxes it down)
FIG = OPT.get('fig', 'willemglass')
ONLY = OPT.get('only')                 # "idle,walk:0,7" -- rows, and after a colon the facings, for a look test
OUT = os.path.join(ROOT, 'deep16', '_src', 'render', FIG + ('-test' if ONLY else ''))
LOG = '[willem]'
PAD = 3

COL = {   # sRGB: the first game's Willem (first/js/sprites.js willem), the hat's band and the wand's glass from willem_p1
    'robe': '#2a4a7a', 'hat': '#26426e', 'trim': '#d8d8f0', 'skin': '#f0c8a8', 'nose': '#e2b08c', 'hair': '#e8d8a0',
    'trousers': '#3a3644', 'boots': '#4a3222', 'wood': '#6a4a2a', 'wood2': '#8a6a42', 'glass': '#a8f0e0',
}

# ------------------------------------------------------------------ the pieces, on the mannequin's bones and at its sizes (metres, the rest pose)
# (kind, bone, colour, args): 'egg' (centre, radii) | 'cap' (p0, p1, r) | 'cone' (p0, p1, r0, r1), closed | 'band' the same, open at both ends
BODY = [
    ('egg', 'hips', 'robe', ((0, 0, 0.97), (0.17, 0.13, 0.11))),
    ('cap', 'spine1', 'robe', ((0, 0, 1.04), (0, 0, 1.22), 0.122)),
    ('egg', 'spine1', 'trim', ((0, 0, 1.06), (0.138, 0.112, 0.026))),          # (the sash)
    ('egg', 'spine2', 'robe', ((0, 0.005, 1.33), (0.16, 0.112, 0.14))),
    ('cap', 'spine2', 'robe', ((0.15, 0, 1.41), (-0.15, 0, 1.41), 0.06)),
    ('egg', 'spine2', 'trim', ((0, -0.012, 1.445), (0.085, 0.075, 0.03))),     # (the collar)
    ('cap', 'neck', 'skin', ((0, 0, 1.45), (0, 0, 1.54), 0.042)),
    ('egg', 'head', 'skin', ((0, 0, 1.665), (0.112, 0.122, 0.138))),
    ('egg', 'head', 'hair', ((0, 0.03, 1.655), (0.12, 0.112, 0.118))),        # (the hair: the back and the sides, under the brim)
    ('cap', 'head', 'nose', ((0, -0.108, 1.645), (0, -0.15, 1.632), 0.024)),
]
for s, x in (('L', 1), ('R', -1)):
    BODY += [
        ('cap', 'arm.' + s, 'robe', ((0.19 * x, 0, 1.42), (0.21 * x, 0.02, 1.14), 0.052)),
        ('cone', 'fore.' + s, 'robe', ((0.21 * x, 0.02, 1.14), (0.22 * x, -0.04, 0.90), 0.047, 0.07)),    # (the sleeve, wide at the wrist)
        ('cap', 'thigh.' + s, 'trousers', ((0.10 * x, 0, 0.95), (0.10 * x, -0.04, 0.51), 0.062)),
        ('cap', 'calf.' + s, 'trousers', ((0.10 * x, -0.04, 0.51), (0.10 * x, 0, 0.09), 0.048)),
        ('cap', 'foot.' + s, 'boots', ((0.10 * x, 0.035, 0.036), (0.10 * x, -0.155, 0.036), 0.036)),
        # the robe's skirt, a half on each thigh: they meet in the middle standing and swing with the legs walking
        ('cone', 'thigh.' + s, 'robe', ((0.075 * x, 0.0, 1.0), (0.115 * x, -0.03, 0.40), 0.13, 0.18)),
        ('band', 'thigh.' + s, 'trim', ((0.1143 * x, -0.0286, 0.4286), (0.115 * x, -0.03, 0.40), 0.178, 0.183)),   # (its hem: an open band, so a raised knee shows no plate)
    ]
BODY += [('egg', 'hand.L', 'skin', ((0.22, -0.045, 0.835), (0.045, 0.045, 0.055))),
         ('cap', 'fore.R', 'skin', ((-0.22, -0.04, 0.89), GRIP, 0.036)),
         ('egg', 'hand.R', 'skin', (GRIP, (0.046, 0.046, 0.046)))]
# the wand, down the right hand bone (along -Y from the fist in the rest pose)
G = Vector(GRIP)
WAND = [('cone', 'hand.R', 'wood', (tuple(G + Vector((0, 0.06, 0))), tuple(G + Vector((0, -0.05, 0))), 0.016, 0.015)),
        ('cone', 'hand.R', 'wood2', (tuple(G + Vector((0, -0.05, 0))), tuple(G + Vector((0, -0.25, 0))), 0.012, 0.008)),
        ('egg', 'hand.R', 'glass', (tuple(G + Vector((0, -0.265, 0))), (0.022, 0.03, 0.022)))]
# the hat: a wide brim, a pale band, a crown whose point leans back (-Y is his front)
HAT = [('egg', 'head', 'hat', ((0, 0.01, 1.772), (0.275, 0.275, 0.018))),           # (wider than the head by half again: the hat was willem_p1's mark)
       ('cone', 'head', 'trim', ((0, 0.01, 1.776), (0, 0.013, 1.835), 0.132, 0.122)),
       ('cone', 'head', 'hat', ((0, 0.013, 1.835), (0, 0.09, 2.17), 0.122, 0.008))]


# a bigger head (headk, about the top of the neck: the art desk's heroes draw heads nearer a quarter of the height than the mannequin's sixth)
# and the hat tipped back (hattilt degrees, the front brim up: from the game's camera the brim hides the face) -- a variant for his eye
HEADK, TILT = float(OPT.get('headk', 1.7)), float(OPT.get('hattilt', 10))
if HEADK != 1.0 or TILT:
    NECK, HATP = Vector((0, 0, 1.54)), Vector((0, 0.0, 1.70))
    RX = Matrix.Rotation(math.radians(-TILT), 3, 'X')            # (-Y his front: a turn about X by -t lifts the front)

    def _move(p, hat):
        v = NECK + (Vector(p) - NECK) * HEADK
        if hat:
            hp = NECK + (HATP - NECK) * HEADK; v = hp + RX @ (v - hp)
        return tuple(v)

    def _scale(pieces, hat=False):
        out = []
        for kind, bone, colour, a in pieces:
            if bone != 'head':
                out.append((kind, bone, colour, a)); continue
            if kind == 'egg':
                out.append((kind, bone, colour, (_move(a[0], hat), tuple(r * HEADK for r in a[1]))))
            else:
                out.append((kind, bone, colour, (_move(a[0], hat), _move(a[1], hat)) + tuple(r * HEADK for r in a[2:])))
        return out
    BODY = _scale(BODY)
    # the hat sits on the bigger head (its crown's base and band fit it, k) but its brim and its height grow a little only (HK): grown with the
    # head, the brim came back to the KayKit's, wider than the shoulders twice over (his "bulbous")
    HK = float(OPT.get('hatk', 1 + 0.3 * (HEADK - 1)))
    zb = 1.54 + (1.772 - 1.54) * HEADK
    HAT = [('egg', 'head', 'hat', ((0, 0.01, zb), (0.275 * HK, 0.275 * HK, 0.018 * HK))),
           ('cone', 'head', 'trim', ((0, 0.01, zb + 0.004), (0, 0.013, zb + 0.004 + 0.059 * HK), 0.132 * HEADK, 0.122 * HEADK)),
           ('cone', 'head', 'hat', ((0, 0.013, zb + 0.004 + 0.059 * HK), (0, 0.013 + 0.077 * HK, zb + 0.004 + 0.059 * HK + 0.335 * HK), 0.122 * HEADK, 0.008))]
    HATP0 = Vector((0, 0, zb - 0.07 * HEADK))                      # (the tilt about the head's middle, under the brim)
    HAT = [(kd, bn, cl, ((tuple(HATP0 + RX @ (Vector(a[0]) - HATP0)), a[1]) if kd == 'egg' else
                         (tuple(HATP0 + RX @ (Vector(a[0]) - HATP0)), tuple(HATP0 + RX @ (Vector(a[1]) - HATP0))) + tuple(a[2:]))) for kd, bn, cl, a in HAT]


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    ad = bpy.data.armatures.new('willem'); arm = bpy.data.objects.new('willem', ad); scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm; arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for name, h, t, p in BONES:
        eb = ad.edit_bones.new(name); eb.head = Vector(h) * U; eb.tail = Vector(t) * U; eb.roll = 0
        if p:
            eb.parent = ad.edit_bones[p]; eb.use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')

    def mesh(name, pieces):
        bm = bmesh.new(); groups = {}; mats = []

        def sphere(c, radii):
            res = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1.0)
            for v in res['verts']:
                v.co = Vector((c[0] + v.co.x * radii[0], c[1] + v.co.y * radii[1], c[2] + v.co.z * radii[2])) * U
            return res['verts']

        def cone(p0, p1, r0, r1, ends, caps=True):
            p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
            rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
            res = bmesh.ops.create_cone(bm, cap_ends=caps and not ends, cap_tris=False, segments=16, radius1=r0 * U, radius2=r1 * U, depth=d.length * U,
                                        matrix=Matrix.Translation((p0 + p1) / 2 * U) @ rot)
            return list(res['verts']) + (sphere(p0, (r0,) * 3) + sphere(p1, (r1,) * 3) if ends else [])

        for kind, bone, colour, a in pieces:
            vs = sphere(*a) if kind == 'egg' else cone(a[0], a[1], a[2], a[2], True) if kind == 'cap' else cone(*a, False, kind == 'cone')
            if colour not in mats:
                mats.append(colour)
            for f in {f for v in vs for f in v.link_faces}:
                f.material_index = mats.index(colour)
            groups.setdefault(bone, []).extend(vs)
        bm.verts.ensure_lookup_table()
        me = bpy.data.meshes.new(name); bm.to_mesh(me); index = {v: i for i, v in enumerate(bm.verts)}; bm.free()
        ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
        for c in mats:
            m = bpy.data.materials.new(name + '_' + c); m.diffuse_color = lin(COL[c]) + (1,); me.materials.append(m)
        for bone, vs in groups.items():
            g = ob.vertex_groups.new(name=bone); g.add([index[v] for v in vs], 1.0, 'REPLACE')
        ob.parent = arm; ob.parent_type = 'OBJECT'
        mod = ob.modifiers.new('arm', 'ARMATURE'); mod.object = arm
        return ob

    body = mesh('willem_body', BODY + WAND); hat = mesh('willem_hat', HAT)
    bpy.context.view_layer.update()
    R = BP.Rig(arm, body, dict(spine=['spine1', 'spine2'], neck=['neck'], head='head',
                               arm_a=['clav.L', 'arm.L', 'fore.L', 'hand.L'], arm_b=['clav.R', 'arm.R', 'fore.R', 'hand.R'],
                               leg_a=[None, 'thigh.L', 'calf.L', 'foot.L', 'toe.L', 'toe.L'],
                               leg_b=[None, 'thigh.R', 'calf.R', 'foot.R', 'toe.R', 'toe.R'], roots=['hips']), log=LOG)
    R.ground()
    return scene, arm, body, hat, R


# ------------------------------------------------------------------ the rows (metres; +X his left, -Y his front)
def rows(R):
    za, zb = R.ANK0['a'].z, R.ANK0['b'].z
    STAND = {'a': (0.11, -0.03, 0.0, 8, 0), 'b': (-0.11, 0.03, 0.0, 12, 0)}

    def P(lift=-0.03, shift=0.0, sway=0.0, bodyyaw=0, twist=0, lean=0, tilt=0, hyaw=0, head=0, legs=None,
          wR=(0.02, -0.12, -0.42), dR=(0.12, -0.75, -0.65), wL=(0.0, -0.04, -0.46), dL=None, kpole=None):
        m = lambda v: tuple(c * U for c in v)
        L = legs or STAND
        p = dict(lift=lift * U, shift=shift * U, sway=sway * U, bodyyaw=bodyyaw, twist=twist, lean=lean, tilt=tilt, hyaw=hyaw, head=head,
                 legs={s: (L[s][0] * U, L[s][1] * U, (za if s == 'a' else zb) + L[s][2] * U, L[s][3], L[s][4]) for s in 'ab'},
                 arms={'a': m(wL), 'b': m(wR)}, hands={'b': dR})
        if dL:
            p['hands']['a'] = dL
        if kpole:
            p['kpolea'], p['kpoleb'] = Vector(kpole[0]), Vector(kpole[1])
        return p

    TAU = 2 * math.pi
    IDLE = [P(lift=-0.03 + 0.007 * math.sin(TAU * i / 8), sway=0.006 * math.sin(TAU * i / 8), head=2 * math.sin(TAU * i / 8),
              wR=(0.02, -0.12, -0.42 + 0.01 * math.sin(TAU * i / 8)), wL=(0.0, -0.04, -0.46 + 0.008 * math.sin(TAU * i / 8))) for i in range(8)]

    def walk(i):
        ph = TAU * i / 8; c, s = math.cos(ph), math.sin(ph); st = 0.17
        la, lb = 0.08 * max(0.0, -s), 0.08 * max(0.0, s)          # (the swinging foot off the floor: the left swings forward while sin < 0)
        legs = {'a': (0.10, -st * c, la, 6, -12 * max(0.0, -s)), 'b': (-0.10, st * c, lb, 6, -12 * max(0.0, s))}
        return P(lift=-0.035 - 0.022 * abs(c), bodyyaw=4 * c, twist=-7 * c, lean=4, head=-2, legs=legs,
                 wL=(0.02, 0.13 * c, -0.44), wR=(0.0, -0.10 - 0.07 * c, -0.40), dR=(0.1, -0.8, -0.55))
    WALK = [walk(i) for i in range(8)]

    A_LEGS = {'a': (0.12, -0.10, 0.0, 10, 0), 'b': (-0.12, 0.10, 0.0, 28, 0)}
    ATTACK = [   # the wand's shot (1H_Ranged_Shoot's place): up, back by the ear, a flick at the foe, held, home
        P(legs=A_LEGS, bodyyaw=-6, twist=-6, wR=(0.04, -0.22, -0.20), dR=(0.05, -0.85, 0.5)),
        P(legs=A_LEGS, bodyyaw=-14, twist=-16, lean=-3, wR=(-0.06, -0.06, 0.10), dR=(0.0, -0.2, 0.98), wL=(0.06, -0.20, -0.30)),
        P(legs=A_LEGS, bodyyaw=-18, twist=-20, lean=-4, hyaw=10, wR=(-0.10, 0.02, 0.16), dR=(-0.1, 0.25, 0.96), wL=(0.08, -0.26, -0.24)),
        P(legs=A_LEGS, shift=-0.03, bodyyaw=6, twist=10, lean=8, hyaw=-6, wR=(0.04, -0.46, 0.06), dR=(0.05, -0.98, 0.15), wL=(0.06, -0.06, -0.40)),
        P(legs=A_LEGS, shift=-0.04, bodyyaw=10, twist=14, lean=10, hyaw=-8, wR=(0.05, -0.52, 0.0), dR=(0.04, -1.0, -0.05), wL=(0.06, 0.0, -0.42)),
        P(legs=A_LEGS, shift=-0.03, bodyyaw=8, twist=10, lean=8, hyaw=-6, wR=(0.05, -0.50, 0.0), dR=(0.04, -1.0, -0.02), wL=(0.05, -0.02, -0.42)),
        P(legs=A_LEGS, shift=-0.01, bodyyaw=2, twist=2, lean=4, wR=(0.04, -0.30, -0.22), dR=(0.08, -0.9, -0.4), wL=(0.02, -0.04, -0.44)),
        P(wR=(0.02, -0.14, -0.40), dR=(0.12, -0.78, -0.62)),
    ]
    C_LEGS = {'a': (0.12, -0.06, 0.0, 10, 0), 'b': (-0.12, 0.07, 0.0, 18, 0)}
    CAST = [     # both hands to the chest, up, and out at the foe (Spellcast_Shoot's place)
        P(legs=C_LEGS, wR=(0.08, -0.18, -0.30), dR=(0.2, -0.8, 0.5), wL=(-0.06, -0.18, -0.30)),
        P(legs=C_LEGS, lean=-2, wR=(0.13, -0.22, -0.16), dR=(0.2, -0.3, 0.93), wL=(-0.13, -0.22, -0.16), dL=(-0.3, -0.5, 0.8)),
        P(legs=C_LEGS, lift=-0.02, lean=-6, head=-6, wR=(0.10, -0.16, 0.10), dR=(0.1, -0.2, 0.97), wL=(-0.10, -0.16, 0.10), dL=(-0.1, -0.2, 0.97)),
        P(legs=C_LEGS, lift=-0.02, lean=-8, head=-8, wR=(0.06, -0.12, 0.28), dR=(0.0, 0.0, 1.0), wL=(-0.06, -0.12, 0.28), dL=(0.0, 0.0, 1.0)),
        P(legs=C_LEGS, shift=-0.04, lean=10, head=4, wR=(0.08, -0.50, 0.02), dR=(0.0, -0.95, 0.3), wL=(-0.08, -0.50, 0.02), dL=(0.0, -0.95, 0.3)),
        P(legs=C_LEGS, shift=-0.05, lean=12, head=4, wR=(0.10, -0.54, -0.02), dR=(0.05, -0.99, 0.1), wL=(-0.10, -0.54, -0.02), dL=(-0.05, -0.99, 0.1)),
        P(legs=C_LEGS, shift=-0.02, lean=6, wR=(0.06, -0.34, -0.20), dR=(0.1, -0.9, -0.3), wL=(-0.04, -0.28, -0.26)),
        P(wR=(0.02, -0.14, -0.40), dR=(0.12, -0.78, -0.62)),
    ]
    S_LEGS = {'a': (0.17, -0.44, 0.0, 30, 0), 'b': (-0.17, -0.44, 0.0, 30, 0)}
    UP = ((0.3, -0.6, 1.0), (-0.3, -0.6, 1.0))
    SIT = [      # on the floor, the knees up, the forearms on them, the wand loose in the right hand (Sit_Floor_Idle's place)
        P(lift=-0.845, lean=16, head=-4, legs=S_LEGS, kpole=UP, wR=(0.02, -0.34, -0.10), dR=(0.3, -0.9, -0.3), wL=(-0.02, -0.34, -0.10), dL=(-0.2, -0.9, -0.4)),
        P(lift=-0.84, lean=14, head=-2, legs=S_LEGS, kpole=UP, wR=(0.02, -0.34, -0.09), dR=(0.3, -0.9, -0.3), wL=(-0.02, -0.34, -0.09), dL=(-0.2, -0.9, -0.4)),
    ]
    mk = lambda F: (lambda i, n: (dict(F[i]), 0))
    return [('idle', 8, True, mk(IDLE), 'ik'), ('walk', 8, True, mk(WALK), 'ik'), ('attack', 8, False, mk(ATTACK), 'ik'),
            ('sit', 2, True, mk(SIT), 'ik'), ('cast', 8, False, mk(CAST), 'ik')]


def look(scene):
    """render-sprites' own: the workbench, the toon matcap over each piece's colour, cavity, no outline (pixelate.py draws the outline)."""
    r = scene.render; r.engine = 'BLENDER_WORKBENCH'; r.film_transparent = True
    r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'Standard'
    sh = scene.display.shading; sh.light = 'MATCAP'; sh.studio_light = 'toon_light.exr'; sh.color_type = 'MATERIAL'
    sh.show_cavity = True; sh.cavity_type = 'BOTH'; sh.cavity_ridge_factor = 1.2; sh.cavity_valley_factor = 1.0
    sh.show_specular_highlight = False; sh.show_shadows = False
    scene.display.render_aa = '8'


def render_alpha(scene, path):
    scene.render.filepath = path; bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(path); W, H = img.size
    px = np.array(img.pixels[:]).reshape(H, W, 4)[::-1]; bpy.data.images.remove(img)
    return px[..., 3].reshape(H // SS, SS, W // SS, SS).mean(axis=(1, 3)) >= 0.5


def hero_height():
    J = json.load(open(os.path.join(ROOT, 'deep16', 'art', HERO + '.json'), encoding='utf-8'))
    img = bpy.data.images.load(os.path.join(ROOT, 'deep16', 'art', HERO + '.png'))
    W, H = img.size; px = np.empty(W * H * 4, np.float32); img.pixels.foreach_get(px); px = px.reshape(H, W, 4)[::-1]
    a = J['anims']['idle']; fw = a.get('fw', J['fw']); fh = a.get('fh', J['fh']); y0 = a.get('y', 0)
    ys = np.where((px[y0:y0 + fh, 0:fw, 3] > 0).any(1))[0]
    return int(ys[-1] - ys[0])


def main():
    scene, arm, body, hat, R = build()
    rowdefs = rows(R)
    R.key_rows(rowdefs)
    cam = make_camera(scene); look(scene)
    os.makedirs(OUT, exist_ok=True)

    # the size: his idle from the front as many rows, crown to feet, as the hero's idle S -- the hat left off the measure
    want = hero_height(); print('%s %s idle S: %d rows' % (LOG, HERO, want))
    R.use('idle'); scene.frame_set(1); s = 1.0 / U; got = None; hat.hide_render = True
    for it in range(8):
        arm.scale = (s, s, s); set_facing(arm, 0)
        lo = screen(cam, soles(body, R))[:, 1].max()
        frame_cam(scene, cam, 64, 80, 32, 70 + 0.9 - lo)
        a = render_alpha(scene, os.path.join(OUT, '_measure.png'))
        ys = np.where(a.any(1))[0]; got = int(ys[-1] - ys[0]); print('%s scale %.4f: %d rows' % (LOG, s, got))
        if got == want:
            break
        s *= (want + 0.5) / (got + 0.5)
    hat.hide_render = 'nohat' in OPT; os.remove(os.path.join(OUT, '_measure.png'))     # (nohat=1: the head's own size, measured as the sprites' are)

    # one cell for every row and facing (render-sprites' way: the sheet's fw, fh, ax, ay), the feet's row its anchor -- the lowest sole of
    # the idle's first frame, a facing at a time, so every row's feet stand where the idle's do
    want_rows = [(nm, n) for nm, n, *_ in rowdefs]
    only_rows, only_f = None, list(range(8))
    if ONLY:
        r_, _, f_ = ONLY.partition(':'); only_rows = r_.split(','); only_f = [int(x) for x in f_.split(',')] if f_ else only_f
    lo_f = {}; ext = []
    for f in range(8):
        set_facing(arm, f); R.use('idle'); scene.frame_set(1)
        lo_f[f] = float(screen(cam, soles(body, R))[:, 1].max())
        for nm, n in want_rows:
            R.use(nm)
            for i in range(n):
                scene.frame_set(i + 1)
                p = screen(cam, np.vstack([world_pts(body, 2), world_pts(hat, 2)]))
                ext.append((p[:, 0].min(), p[:, 0].max(), (p[:, 1] - lo_f[f]).min(), (p[:, 1] - lo_f[f]).max()))
    e = np.array(ext)
    ax = int(math.ceil(max(-e[:, 0].min(), e[:, 1].max()) + PAD)); fw = 2 * ax
    ay = int(math.ceil(-e[:, 2].min() + PAD)); fh = ay + int(math.ceil(max(e[:, 3].max(), 0) + PAD)) + 1; fh += fh % 2
    print('%s the cell %dx%d, the anchor %d,%d' % (LOG, fw, fh, ax, ay))

    meta = {'figure': FIG, 'ss': SS, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'height_px': want, 'anims': {}, 'source': 'tools/willem-blend.py'}
    for nm, n in want_rows:
        if only_rows and nm not in only_rows:
            continue
        R.use(nm); meta['anims'][nm] = {'action': nm, 'frames': n}
        os.makedirs(os.path.join(OUT, nm), exist_ok=True)
        for f in only_f:
            set_facing(arm, f); frame_cam(scene, cam, fw, fh, ax, ay + 0.9 - lo_f[f])
            for i in range(n):
                scene.frame_set(i + 1)
                scene.render.filepath = os.path.join(OUT, nm, 'f%d_%02d.png' % (f, i)); bpy.ops.render.render(write_still=True)
        print('%s %s rendered' % (LOG, nm))
    json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)
    print('%s ok: %s' % (LOG, os.path.join(OUT, 'meta.json')))


main()

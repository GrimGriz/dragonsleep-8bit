"""LYMEN ON THE MANNEQUIN'S OWN BONES (11-13): an experiment with a verdict owed. Griz, 11-13, on the art desk's drawn SE attack: "so, fable 5.2
was just released, best of the best. Start a seat to have it try skinning the mannequin with Lymen in Blender and see if we end up better of than
'frivolous raster' or directly <the drawn strip>".

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python tools/lymen-blend.py -- build kit=sword+shield target=0
    ... -- build kit=sword+shield target=0 poses=<file.json> out=lymen-blend-griz     the same figure on a poser file's frames ({row: {frame: P}})
    ... lines=0.6      the dark line's width at 1x (0 for none)

Then `python tools/lymen-blend-sheet.py` snaps the renders to the 64 colours, lays `deep16/art/lymen_blend_p2` and the comparison stills.

What it is: tools/twinmace-blend.py's `sword+shield` kit -- its bones, its rows (rows_slash, the SWSH frames: his gist, the cut on frame 4), its
camera, its size measure and its render loop, all imported and run unchanged -- with ONE thing replaced: `build()`. In place of the grey
capsules it builds Lymen "Ly" Urtusk over the same 22 bones, every piece weighted to the bone the mannequin's piece was, so a frame's numbers
pose him exactly as they pose the mannequin: the pose is true by construction. No downloaded model; everything below is eggs, capsules and
lofted rings made here.

Him, from his own pages only (deep16/art/pt_lymen_full.png, the art desk's ART-MC-LYMEN-BASE-ATTACK-SE-CHECKPOINT-V2, deep16-art-in-hand.md
"LYMEN --"): a half-orc of twenty-four, green skin, small tusks, black hair swept up and back, pointed ears; a grey mail shirt to mid-thigh with
sleeves, a green band on each upper arm and a green collar with a small round clasp; leather straps over both shoulders to a leather belt, and
leather cuffs; dark trousers, strapped boots; a round wooden shield with an iron rim and boss on the left arm (the kit's, LYSHIELD_R); a
longsword with a gold crossguard in the right fist (the kit's length, BLADE).

Colours are flat and few, each chosen inside one ramp of deep16/palette.json so the Workbench's shading lands on that ramp's steps when
tools/pixelate.py snaps it: orc for the skin, silver for mail and steel, leather, moss for the trim, gold, stone for the trousers.
"""
import bpy, bmesh, sys, os, math, importlib.util
import numpy as np
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
assert 'kit=sword+shield' in ARGS, 'run it with kit=sword+shield (the rows are that kit\'s)'
spec = importlib.util.spec_from_file_location('twinmace_blend', os.path.join(ROOT, 'tools', 'twinmace-blend.py'))
TW = importlib.util.module_from_spec(spec); spec.loader.exec_module(TW)
MQ, BP, U, lin = TW.MQ, TW.BP, TW.U, TW.lin
OUT = MQ.OPT.get('out', 'lymen-blend')
TW.WORK = os.path.join(ROOT, 'deep16', '_src', OUT); TW.LOG = LOG = '[lymen-blend]'
LINES = float(MQ.OPT.get('lines', 0.45))
POSES = MQ.OPT.get('poses')

COL = {
    'skin': '#789a52', 'skind': '#56703e', 'hair': '#232833', 'tusk': '#eeeadc', 'eye': '#14171e',
    'mail': '#7c889c', 'maild': '#566176', 'trim': '#3e6440', 'gem': '#86a05e',
    'leather': '#6a4520', 'strap': '#8c6430', 'buckle': '#dca238',
    'pants': '#3b3a3a', 'boot': '#4a3a2c', 'bootstrap': '#94795f',
    'wood': '#7a4630', 'woodd': '#5c3a26', 'iron': '#8a96aa', 'boss': '#b8c3d4',
    'steel': '#c4cedc', 'gold': '#dca238', 'grip': '#3e2612',
}


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    ad = bpy.data.armatures.new('mannequin'); arm = bpy.data.objects.new('mannequin', ad); scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm; arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for name, h, t, p in TW.BONES:                                   # (the mannequin's bones, as they are)
        eb = ad.edit_bones.new(name); eb.head = Vector(h) * U; eb.tail = Vector(t) * U; eb.roll = 0
        if p:
            eb.parent = ad.edit_bones[p]; eb.use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    ad.bones['dummy'].use_deform = False

    def sphere(bm, c, radii, seg=16):
        res = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(6, seg * 5 // 8), radius=1.0)
        for v in res['verts']:
            v.co = Vector((c[0] + v.co.x * radii[0], c[1] + v.co.y * radii[1], c[2] + v.co.z * radii[2])) * U
        return res['verts']

    def capsule(bm, p0, p1, r, r1=None):
        r1 = r if r1 is None else r1
        p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        res = bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=16, radius1=r * U, radius2=r1 * U, depth=d.length * U,
                                    matrix=Matrix.Translation((p0 + p1) / 2 * U) @ rot)
        return list(res['verts']) + sphere(bm, p0, (r, r, r)) + sphere(bm, p1, (r1, r1, r1))

    def tube(bm, rings, seg=20):
        """lofted ellipses, bottom to top: rings [(z, rx, ry, cy)], capped."""
        R_ = [[bm.verts.new(Vector((rx * math.cos(2 * math.pi * k / seg), cy + ry * math.sin(2 * math.pi * k / seg), z)) * U) for k in range(seg)]
              for z, rx, ry, cy in rings]
        for a, b in zip(R_, R_[1:]):
            for k in range(seg):
                bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
        bm.faces.new(R_[0][::-1]); bm.faces.new(R_[-1])
        return [v for r in R_ for v in r]

    mats = []; W = []           # W: (vert, {bone: weight})

    def put(verts, bone, colour):
        if colour not in mats:
            mats.append(colour)
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = mats.index(colour)
        for v in verts:
            W.append((v, bone if isinstance(bone, dict) else {bone: 1.0}))

    L = lambda a, b, t: tuple(a[k] + (b[k] - a[k]) * t for k in range(3))
    bm = bmesh.new()

    # ---- the trunk: mail over the hips, the waist and the chest; the skirt of the shirt down to mid-thigh, its hem riding the thighs
    put(sphere(bm, (0, 0.005, 1.335), (0.222, 0.142, 0.155)), 'spine2', 'mail')
    put(capsule(bm, (0.175, 0, 1.415), (-0.175, 0, 1.415), 0.080), 'spine2', 'mail')
    put(tube(bm, [(1.03, 0.160, 0.122, 0), (1.14, 0.165, 0.124, 0), (1.26, 0.185, 0.128, 0)]), 'spine1', 'mail')
    skirt = tube(bm, [(0.70, 0.205, 0.150, -0.01), (0.80, 0.196, 0.142, -0.005), (0.92, 0.178, 0.130, 0), (1.04, 0.160, 0.122, 0)])
    if 'mail' not in mats:
        mats.append('mail')
    for v in skirt:
        z, x = v.co.z / U, v.co.x / U
        f = max(0.0, min(1.0, (0.98 - z) / 0.28)) * 0.62 * min(1.0, abs(x) / 0.07)
        W.append((v, {'hips': 1 - f, 'thigh.L' if x > 0 else 'thigh.R': f} if f > 0.01 else {'hips': 1.0}))
    for f in {f for v in skirt for f in v.link_faces}:
        f.material_index = mats.index('mail')
    hem = tube(bm, [(0.685, 0.207, 0.152, -0.01), (0.715, 0.207, 0.152, -0.01)])          # the hem, a shade darker: the shirt's edge reads
    mats.append('maild')
    for v in hem:
        x = v.co.x / U; f = 0.62 * min(1.0, abs(x) / 0.07)
        W.append((v, {'hips': 1 - f, 'thigh.L' if x > 0 else 'thigh.R': f} if f > 0.01 else {'hips': 1.0}))
    for f in {f for v in hem for f in v.link_faces}:
        f.material_index = mats.index('maild')
    put(tube(bm, [(1.005, 0.170, 0.132, 0), (1.060, 0.168, 0.130, 0)]), 'hips', 'leather')          # the belt
    put(sphere(bm, (0, -0.132, 1.032), (0.030, 0.014, 0.030)), 'hips', 'buckle')
    for x in (1, -1):           # the straps: over each shoulder, down the chest and the back to the belt, a ring on the chest
        for y in (-1, 1):
            put(capsule(bm, (0.105 * x, 0.0, 1.492), (0.100 * x, 0.118 * y + 0.005, 1.40), 0.024), 'spine2', 'leather')
            put(capsule(bm, (0.100 * x, 0.118 * y + 0.005, 1.40), (0.096 * x, 0.126 * y + 0.005, 1.27), 0.024), 'spine2', 'leather')
            put(capsule(bm, (0.096 * x, 0.120 * y, 1.25), (0.090 * x, 0.120 * y, 1.06), 0.024), 'spine1', 'leather')
        put(sphere(bm, (0.099 * x, -0.142, 1.33), (0.026, 0.012, 0.026)), 'spine2', 'buckle')

    # ---- the neck, the green collar and its clasp
    put(capsule(bm, (0, 0, 1.44), (0, -0.005, 1.56), 0.058), 'neck', 'skin')
    put(tube(bm, [(1.455, 0.098, 0.090, 0.0), (1.50, 0.082, 0.078, 0.0), (1.525, 0.074, 0.072, 0.0)]), 'spine2', 'trim')
    put(sphere(bm, (0, -0.118, 1.445), (0.024, 0.014, 0.024)), 'spine2', 'gem')

    # ---- the head: a heavy jaw, a nose, pointed ears, small tusks, the eyes under dark brows; the black hair swept up and back
    HS = 1.20                   # (the art desk draws its heroes' heads big: his is scaled about the neck's top)
    hp = lambda p: (p[0] * HS, p[1] * HS, 1.54 + (p[2] - 1.54) * HS)
    hr = lambda r: tuple(x * HS for x in r) if isinstance(r, tuple) else r * HS
    put(sphere(bm, hp((0, 0.0, 1.675)), hr((0.128, 0.138, 0.150))), 'head', 'skin')
    put(sphere(bm, hp((0, -0.030, 1.605)), hr((0.106, 0.112, 0.082))), 'head', 'skin')
    put(sphere(bm, hp((0, -0.138, 1.655)), hr((0.024, 0.030, 0.034))), 'head', 'skind')
    for x in (1, -1):
        put(capsule(bm, hp((0.118 * x, 0.01, 1.665)), hp((0.175 * x, 0.065, 1.735)), hr(0.026), hr(0.008)), 'head', 'skin')
        put(sphere(bm, hp((0.052 * x, -0.118, 1.690)), hr((0.022, 0.016, 0.014))), 'head', 'eye')
        put(capsule(bm, hp((0.022 * x, -0.128, 1.716)), hp((0.090 * x, -0.108, 1.722)), hr(0.013)), 'head', 'hair')
        put(capsule(bm, hp((0.046 * x, -0.118, 1.592)), hp((0.052 * x, -0.132, 1.632)), hr(0.014), hr(0.008)), 'head', 'tusk')
    put(sphere(bm, hp((0, -0.118, 1.602)), hr((0.040, 0.012, 0.007))), 'head', 'skind')                      # the mouth's line
    put(sphere(bm, hp((0, 0.035, 1.748)), hr((0.140, 0.150, 0.100))), 'head', 'hair')
    put(sphere(bm, hp((0, 0.088, 1.690)), hr((0.124, 0.098, 0.125))), 'head', 'hair')
    for p0, p1, r in (((0.02, -0.06, 1.80), (-0.03, -0.150, 1.835), 0.052), ((0.08, -0.03, 1.795), (0.095, -0.120, 1.825), 0.044),
                      ((-0.07, -0.02, 1.80), (-0.105, -0.085, 1.825), 0.044), ((0.0, 0.06, 1.81), (0.0, 0.150, 1.815), 0.055)):
        put(capsule(bm, hp(p0), hp(p1), hr(r), hr(r * 0.6)), 'head', 'hair')
    # ---- the arms: mail sleeves, a green band above the elbow, leather cuffs, green fists
    for s, x in (('L', 1), ('R', -1)):
        S, E, Wr = (0.19 * x, 0, 1.42), (0.21 * x, 0.02, 1.14), (0.22 * x, -0.04, 0.89)
        w, g = TW.GRIPS[s]
        put(sphere(bm, S, (0.096, 0.096, 0.092)), 'arm.' + s, 'mail')
        put(capsule(bm, S, E, 0.074, 0.064), 'arm.' + s, 'mail')
        put(capsule(bm, L(S, E, 0.62), L(S, E, 0.76), 0.074), 'arm.' + s, 'trim')
        put(capsule(bm, E, Wr, 0.064, 0.050), 'fore.' + s, 'mail')
        put(capsule(bm, L(E, Wr, 0.16), L(E, Wr, 0.26), 0.066), 'fore.' + s, 'leather')
        put(capsule(bm, L(E, Wr, 0.78), L(E, Wr, 0.97), 0.056), 'fore.' + s, 'leather')
        put(capsule(bm, w, g, 0.040), 'fore.' + s, 'skin')
        put(sphere(bm, g, (0.054, 0.054, 0.054)), 'hand.' + s, 'skin')

    # ---- the legs: dark trousers, boots strapped at the top and the ankle (the boot's own capsule is the mannequin's: the soles on the floor)
    for s, x in (('L', 1), ('R', -1)):
        H, Kn, A = (0.10 * x, 0, 0.95), (0.10 * x, -0.04, 0.51), (0.10 * x, 0, 0.09)
        put(capsule(bm, H, Kn, 0.092, 0.076), 'thigh.' + s, 'pants')
        put(capsule(bm, H, L(H, Kn, 0.50), 0.096, 0.090), 'thigh.' + s, 'mail')          # (mail over the thigh under the skirt: where a leg comes through the hem's loft it is still the shirt)
        put(capsule(bm, Kn, L(Kn, A, 0.42), 0.074, 0.068), 'calf.' + s, 'pants')
        put(capsule(bm, L(Kn, A, 0.40), A, 0.076, 0.062), 'calf.' + s, 'boot')
        put(capsule(bm, L(Kn, A, 0.40), L(Kn, A, 0.50), 0.080), 'calf.' + s, 'bootstrap')
        put(capsule(bm, L(Kn, A, 0.82), L(Kn, A, 0.90), 0.068), 'calf.' + s, 'bootstrap')
        put(capsule(bm, (0.10 * x, 0.040, 0.040), (0.10 * x, -0.155, 0.040), 0.040), 'foot.' + s, 'boot')

    # ---- the shield: the kit's disc where the kit carries it (the left HAND bone), a wooden face inside an iron rim, a boss
    g = Vector(TW.GRIPS['L'][1]); c = (g.x, g.y - 0.075, g.z + 0.15); Rs = TW.LYSHIELD_R
    put(sphere(bm, c, (Rs, 0.022, Rs), seg=24), 'hand.L', 'iron')
    put(sphere(bm, c, (Rs - 0.035, 0.034, Rs - 0.035), seg=24), 'hand.L', 'wood')
    for k in (-1, 1):           # two plank seams across the face, both sides
        put(capsule(bm, (c[0] - Rs * 0.86, c[1], c[2] + k * Rs * 0.34), (c[0] + Rs * 0.86, c[1], c[2] + k * Rs * 0.34), 0.032), 'hand.L', 'woodd')
    put(sphere(bm, (c[0], c[1] - 0.030, c[2]), (0.078, 0.036, 0.078)), 'hand.L', 'boss')

    bm.verts.ensure_lookup_table(); index = {v: i for i, v in enumerate(bm.verts)}
    wl = [(index[v], w) for v, w in W]
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new('mannequin_body'); bm.to_mesh(me); bm.free()
    for c_ in mats:
        m = bpy.data.materials.new('ly_' + c_); m.diffuse_color = lin(COL[c_]) + (1,); me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = True
    body = bpy.data.objects.new('mannequin_body', me); scene.collection.objects.link(body)
    for i, w in wl:
        for b, x in w.items():
            (body.vertex_groups.get(b) or body.vertex_groups.new(name=b)).add([i], x, 'REPLACE')
    vcol = np.zeros((len(me.vertices), 3))
    for p in me.polygons:
        for vi in p.vertices:
            vcol[vi] = lin(COL[mats[p.material_index]])
    body.parent = arm; body.parent_type = 'OBJECT'
    mod = body.modifiers.new('arm', 'ARMATURE'); mod.object = arm

    # ---- the longsword: its own object on the right hand bone, the kit's length; a gold pommel and crossguard, a steel blade to a point
    bm = bmesh.new(); sm = []; Lb = ad.bones['hand.R'].length; off = Vector((0, Lb, 0))

    def rod(colour, p0, p1, r, r1=None):
        if colour not in sm:
            sm.append(colour)
        p0, p1 = Vector(p0), Vector(p1)
        rot = Vector((0, 0, 1)).rotation_difference((p1 - p0).normalized()).to_matrix().to_4x4()
        vs = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=12, radius1=r * U, radius2=(r if r1 is None else r1) * U,
                                   depth=(p1 - p0).length * U, matrix=Matrix.Translation((p0 + p1) / 2 * U - off) @ rot)['verts']
        for f in {f for v in vs for f in v.link_faces}:
            f.material_index = sm.index(colour)
    rod('gold', (0, -0.100, 0), (0, -0.062, 0), 0.034)
    rod('grip', (0, -0.062, 0), (0, 0.062, 0), 0.023)
    for ax in ((1, 0, 0), (0, 0, 1)):          # the crossguard, a bar each way: the hand's roll is free on this rig, and a cross reads from any side
        rod('gold', (-0.115 * ax[0], 0.074, -0.115 * ax[2]), (0.115 * ax[0], 0.074, 0.115 * ax[2]), 0.021)
    rod('steel', (0, 0.085, 0), (0, 0.84, 0), 0.030, 0.024)
    rod('steel', (0, 0.84, 0), (0, TW.BLADE, 0), 0.024, 0.004)
    sme = bpy.data.meshes.new('sword'); bm.to_mesh(sme); bm.free()
    for c_ in sm:
        m = bpy.data.materials.new('sword_' + c_); m.diffuse_color = lin(COL[c_]) + (1,); sme.materials.append(m)
    sword = bpy.data.objects.new('maceR', sme); scene.collection.objects.link(sword)
    sword.parent = arm; sword.parent_type = 'BONE'; sword.parent_bone = 'hand.R'; sword.matrix_parent_inverse = Matrix.Identity(4)

    # ---- the target's bone keeps a speck (the kit's main() hides and places it; target=0 never renders it)
    bm = bmesh.new(); sphere(bm, (0, 0, 1.0), (0.01, 0.01, 0.01), seg=6)
    dme = bpy.data.meshes.new('target'); bm.to_mesh(dme); bm.free()
    dummy = bpy.data.objects.new('target', dme); scene.collection.objects.link(dummy)
    dummy.parent = arm; dummy.parent_type = 'BONE'; dummy.parent_bone = 'dummy'
    bpy.context.view_layer.update(); dummy.matrix_world = Matrix.Identity(4); bpy.context.view_layer.update()

    R = BP.Rig(arm, body, dict(spine=['spine1', 'spine2'], neck=['neck'], head='head',
                               arm_a=['clav.L', 'arm.L', 'fore.L', 'hand.L'], arm_b=['clav.R', 'arm.R', 'fore.R', 'hand.R'],
                               leg_a=[None, 'thigh.L', 'calf.L', 'foot.L', 'toe.L', 'toe.L'],
                               leg_b=[None, 'thigh.R', 'calf.R', 'foot.R', 'toe.R', 'toe.R'], roots=['hips'], still=['dummy']), log=LOG)
    R.ground()
    return scene, arm, body, {'R': sword}, dummy, R, vcol


def look(scene):
    """the mannequin's Workbench look (flat material colours under the studio light), the dark line thinner: at 1x it is a seam, not a bar."""
    _look(scene)
    sh =scene.display.shading; sh.show_cavity = True; sh.cavity_type = 'WORLD'; sh.cavity_ridge_factor = 0.0; sh.cavity_valley_factor = 0.6
    if LINES <= 0:
        scene.render.use_freestyle = False
        return
    for st in bpy.data.linestyles:
        st.thickness = LINES * MQ.SS; st.color = lin('#14171e')


_rows, _look = TW.rows, MQ.look


def rows(R):
    r = _rows(R)
    return R.with_edits(r, POSES) if POSES else r


TW.build, TW.rows, MQ.look = build, rows, look

if __name__ == '__main__':
    TW.main()

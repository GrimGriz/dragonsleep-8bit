"""DEEP16 pipeline 1b (10-01d): the toon look for a Blender monster made from a printable model -- the light, the cel material, the
colouring helpers, and a look-test still. Imported by a creature's build script (tools/xorn-blend.py is the first) and by
tools/render-sprites.py for a figure whose `look` is "toon:<preset>". Recipe: deep16/blender-monsters.md.

Where it came from: a Sonnet runner's fourteen look variants and the seat's teeth-and-mouth pass on 10-01d (deep16/_src/xorn/look_*.py,
gitignored), against the generated sprites already in the game (the clacker, the bulette). Griz's picks: "14 sculpt" (preset '12',
the pixel pass's lift off) best, "13-high-eyes" (preset '13') second; then "teeth either white or gemstone ... the mouth interior red.
Higher contrast on the gray stone in his body compared to the brown stone in his body."

What the look is: EEVEE, three suns aimed in the camera's frame (a warm key from the upper left, a dim cool fill, a cool rim from behind),
and a cel material -- diffuse -> Shader to RGB -> a CONSTANT colour ramp of four bands (cool in the shadow, warm in the light) times the
mesh's colour attribute `speckle`, out as emission. Where the attribute's alpha is 0 the colour skips the bands (gems, crystal teeth, the
mouth's red): it reads at sprite size even in shadow. Everything seeded: a re-run is identical.
"""
import bpy, os, math, random
from mathutils import Vector, noise

SS, TW, UPS = 4, 64, 1.6          # tools/render-sprites.py's supersample, 5-ft square in px, units per square
K = TW / (UPS * math.sqrt(2))


def srgb2lin(h):
    if isinstance(h, str):
        h = tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return tuple(((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in h)


# ------------------------------------------------------------------ the light
def cam_dir(cam, right, upv, toward):
    """world vector from the figure to a light that sits `right` / `upv` on screen and `toward` the viewer."""
    return (cam.matrix_world.to_3x3() @ Vector((right, upv, toward))).normalized()


def make_sun(scene, cam, name, right, upv, toward, strength, colour=(1, 1, 1), angle=math.radians(2)):
    d = bpy.data.lights.new(name, 'SUN'); d.energy = strength; d.color = colour; d.angle = angle
    o = bpy.data.objects.new(name, d); scene.collection.objects.link(o)
    v = cam_dir(cam, right, upv, toward)
    o.rotation_euler = (-v).to_track_quat('-Z', 'Y').to_euler()
    o.location = v * 30
    return o


def set_world(scene, colour, strength):
    w = bpy.data.worlds.new('w'); w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (*colour, 1); bg.inputs['Strength'].default_value = strength
    scene.world = w


# key (right, up, toward), the fill and rim are the same in both: the presets differ in the key's height
PRESETS = {
    '12': {'key': (-0.62, 0.62, 0.48)},          # the key from the upper left: lit left, shaded right (Griz's "14" is this with lift off)
    '13': {'key': (-0.30, 0.85, 0.45)},          # the key higher: more of the body dark, like the clacker (Griz's second)
}
BANDS = [(0.0, 0.09), (0.24, 0.26), (0.50, 0.50), (0.84, 1.0)]
TINTS = [(0.82, 0.85, 1.25), (0.94, 0.96, 1.06), (1.0, 1.0, 1.0), (1.05, 1.02, 0.94)]


def light(scene, cam, preset='12'):
    """the scene's engine and suns for a preset (call after the camera is placed: the suns are aimed in its frame)."""
    P = PRESETS[preset]
    bpy.context.view_layer.update()     # (the camera's matrix is stale till the scene updates: unaimed, the key lands behind the figure)
    scene.render.engine = 'BLENDER_EEVEE'
    scene.eevee.taa_render_samples = 32
    try:
        scene.eevee.use_shadows = True
    except Exception:
        pass
    scene.render.filter_size = 1.0
    scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0; scene.view_settings.gamma = 1
    set_world(scene, (0.5, 0.55, 0.8), 0.08)
    make_sun(scene, cam, 'key', *P['key'], 3.3, (1.0, 0.94, 0.84))
    make_sun(scene, cam, 'fill', 0.8, -0.2, 0.5, 0.4, (0.55, 0.65, 1.0), angle=math.radians(30))
    make_sun(scene, cam, 'rim', 0.7, 0.25, -0.75, 1.6, (0.6, 0.75, 1.0), angle=math.radians(8))


def toon_material(ob, gem_glow=1.0, bands=BANDS, tints=TINTS):
    """the cel material on every slot of `ob`: the bands x the `speckle` colour attribute; alpha 0 = unshaded (x gem_glow)."""
    mat = bpy.data.materials.new('toon')
    try:
        mat.use_nodes = True
    except Exception:
        pass
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    N, L = nt.nodes.new, nt.links.new
    out, emi, dif, s2r = N('ShaderNodeOutputMaterial'), N('ShaderNodeEmission'), N('ShaderNodeBsdfDiffuse'), N('ShaderNodeShaderToRGB')
    attr = N('ShaderNodeAttribute'); attr.attribute_name = 'speckle'
    ramp = N('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
    el = ramp.color_ramp.elements
    while len(el) > 1:
        el.remove(el[-1])
    for i, (pos, val) in enumerate(bands):
        e = el[0] if i == 0 else el.new(pos)
        e.position = pos; t = tints[i]
        e.color = (val * t[0], val * t[1], val * t[2], 1)
    dif.inputs['Color'].default_value = (1, 1, 1, 1)
    L(dif.outputs['BSDF'], s2r.inputs['Shader']); L(s2r.outputs['Color'], ramp.inputs['Fac'])
    mul = N('ShaderNodeVectorMath'); mul.operation = 'MULTIPLY'
    L(attr.outputs['Color'], mul.inputs[0]); L(ramp.outputs['Color'], mul.inputs[1])
    glow = N('ShaderNodeVectorMath'); glow.operation = 'SCALE'; glow.inputs['Scale'].default_value = gem_glow
    L(attr.outputs['Color'], glow.inputs[0])
    mx = N('ShaderNodeMix'); mx.data_type = 'RGBA'
    L(attr.outputs['Alpha'], mx.inputs[0]); L(glow.outputs['Vector'], mx.inputs[6]); L(mul.outputs['Vector'], mx.inputs[7])
    L(mx.outputs[2], emi.inputs['Color']); L(emi.outputs['Emission'], out.inputs['Surface'])
    ob.data.materials.clear(); ob.data.materials.append(mat)
    return mat


def holdout_floor(scene, size=200):
    """a floor at z 0 that renders as nothing and hides what is under it: a figure sinking into the ground goes into it."""
    me = bpy.data.meshes.new('floor'); h = size / 2
    me.from_pydata([(-h, -h, 0), (h, -h, 0), (h, h, 0), (-h, h, 0)], [], [(0, 1, 2, 3)])
    ob = bpy.data.objects.new('Holdout_Floor', me); scene.collection.objects.link(ob)
    mat = bpy.data.materials.new('holdout')
    try:
        mat.use_nodes = True
    except Exception:
        pass
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    ho, out = nt.nodes.new('ShaderNodeHoldout'), nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(ho.outputs['Holdout'], out.inputs['Surface'])
    me.materials.append(mat)
    return ob


# ------------------------------------------------------------------ colour
def adjacency(me):
    edge_faces = {}
    for p in me.polygons:
        for ek in p.edge_keys:
            edge_faces.setdefault(ek, []).append(p.index)
    adj = {p.index: set() for p in me.polygons}
    for fs in edge_faces.values():
        for a in fs:
            for b in fs:
                if a != b:
                    adj[a].add(b)
    return adj


def paint(me, C):
    """colour a (low-poly) mesh's faces into a CORNER `speckle` attribute. C: base, base2 (blotched in; split = how crisp), fine, blotch,
    blotch_scale, gems [hex], gem_clusters, gem_size, gem_ok(face) -> may hold a gem, mouth(face) -> (hex, unshaded) or None,
    extra(me, col, unshaded) -> the creature's own marks (eyes). Returns per-face colours (linear) and the unshaded flags."""
    rnd = random.Random(C.get('seed', 7)); noise.seed_set(C.get('seed', 7))
    n = len(me.polygons); col = [None] * n; flat = [False] * n
    base = srgb2lin(C['base']); b2 = srgb2lin(C['base2']) if C.get('base2') else None
    for p in me.polygons:
        c = p.center
        k = 1 + C.get('blotch', 0.16) * noise.noise(c * C.get('blotch_scale', 0.12) + Vector((11.0, 3.0, 7.0))) + C.get('fine', 0.10) * (rnd.random() * 2 - 1)
        bc = base
        if b2:
            t = max(0.0, min(1.0, 0.5 + C.get('split', 1.1) * noise.noise(c * (C.get('blotch_scale', 0.12) * 1.7) + Vector((-5.0, 9.0, 2.0)))))
            bc = tuple(base[i] * (1 - t) + b2[i] * t for i in range(3))
        col[p.index] = tuple(max(0.0, v * k) for v in bc)
    if C.get('mouth'):
        for p in me.polygons:
            m = C['mouth'](p)        # (hex or a linear rgb tuple, unshaded?)
            if m:
                mc = srgb2lin(m[0]) if isinstance(m[0], str) else m[0]
                col[p.index] = tuple(v * (0.85 + 0.3 * rnd.random()) for v in mc); flat[p.index] = m[1]
    if C.get('gems'):
        adj = adjacency(me)
        areas = sorted(p.area for p in me.polygons if len(p.vertices) == 4)
        small = areas[int(len(areas) * 0.65)]
        ok = C.get('gem_ok', lambda p: True)
        cand = [p.index for p in me.polygons if len(p.vertices) == 4 and small * 0.4 < p.area <= small and ok(p) and not flat[p.index]]
        rnd.shuffle(cand)
        gc = [srgb2lin(g) for g in C['gems']]
        for si in cand[:C.get('gem_clusters', 30)]:
            g = rnd.choice(gc); cl = [si]
            while len(cl) < rnd.randint(*C.get('gem_size', (1, 2))):
                nb = [q for f in cl for q in adj[f] if q not in cl and len(me.polygons[q].vertices) == 4 and me.polygons[q].area <= small * 1.5]
                if not nb:
                    break
                cl.append(rnd.choice(nb))
            for f in cl:
                col[f] = tuple(v * (0.9 + 0.2 * rnd.random()) for v in g); flat[f] = True
    if C.get('extra'):
        C['extra'](me, col, flat)
    return col, flat


def write_corner(me, col, flat):
    ca = me.color_attributes.new('speckle', 'FLOAT_COLOR', 'CORNER')
    for p in me.polygons:
        c = col[p.index]
        for li in p.loop_indices:
            ca.data[li].color = (c[0], c[1], c[2], 0.0 if flat[p.index] else 1.0)
    me.color_attributes.active_color = ca
    return ca


def paint_points(P, C):
    """colour a fine mesh's points directly, for a printable model that ships no base mesh (the roper, 10-01e). P: the points (numpy, n x 3).
    C: base, base2 (blotched in; split = how crisp), streak (a darker stone drawn down in streaks; streak_scale = the noise's (x, y, z)
    scale -- small z makes them run vertically, flowstone -- and streak_amt), fine, blotch, blotch_scale, seed.
    Returns (colours n x 3 linear, unshaded n bools) for the creature's own marks before write_points."""
    import numpy as np
    rnd = np.random.default_rng(C.get('seed', 7)); noise.seed_set(C.get('seed', 7))
    n = len(P); bs = C.get('blotch_scale', 0.12)
    base = np.array(srgb2lin(C['base'])); b2 = np.array(srgb2lin(C['base2'])) if C.get('base2') else None
    st = np.array(srgb2lin(C['streak'])) if C.get('streak') else None
    sx, sy, sz = C.get('streak_scale', (0.3, 0.3, 0.04))
    k = np.empty(n); t = np.zeros(n); s = np.zeros(n)
    for i in range(n):
        x, y, z = P[i]
        k[i] = noise.noise(Vector((x * bs + 11.0, y * bs + 3.0, z * bs + 7.0)))
        if b2 is not None:
            t[i] = noise.noise(Vector((x * bs * 1.7 - 5.0, y * bs * 1.7 + 9.0, z * bs * 1.7 + 2.0)))
        if st is not None:
            s[i] = noise.noise(Vector((x * sx + 31.0, y * sy - 17.0, z * sz + 5.0)))
    k = 1 + C.get('blotch', 0.16) * k + C.get('fine', 0.10) * (rnd.random(n) * 2 - 1)
    col = np.repeat(base[None, :], n, axis=0)
    if b2 is not None:
        tt = np.clip(0.5 + C.get('split', 1.1) * t, 0, 1)[:, None]
        col = col * (1 - tt) + b2[None, :] * tt
    if st is not None:
        ss = np.clip((s - 0.1) / 0.45, 0, 1); ss = (ss * ss * (3 - 2 * ss) * C.get('streak_amt', 0.5))[:, None]
        col = col * (1 - ss) + st[None, :] * ss
    return np.maximum(0.0, col * k[:, None]), np.zeros(n, dtype=bool)


def write_points(ob, col, unshaded):
    """paint_points' colours into the mesh's POINT `speckle` attribute (alpha 0 = unshaded, as toon_material reads it)."""
    import numpy as np
    me = ob.data
    for a in [a for a in me.color_attributes if a.name == 'speckle']:
        me.color_attributes.remove(a)
    att = me.color_attributes.new('speckle', 'FLOAT_COLOR', 'POINT')
    out = np.concatenate([col, np.where(unshaded, 0.0, 1.0)[:, None]], axis=1).astype(np.float32)
    att.data.foreach_set('color', out.ravel())
    me.color_attributes.active_color = att
    return att


def rock(name, r, seed=13, base='#7f7466', base2='#5c5348', squash=(1.12, 0.98, 0.84)):
    """a loose rock, r across its middle (the stone giant's caught rock, 10-08): an icosphere roughed by noise and squashed so it lies like a stone,
    flat-shaded so the facets read, painted a warm grey-brown (her skin is a cool grey: the two must part) with the toon material. Linked to the
    scene; the caller parents it."""
    import bmesh
    import numpy as np
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    noise.seed_set(seed)
    for v in bm.verts:
        n_ = noise.noise(v.co * 1.7 + Vector((3.1, 7.7, 1.3)))
        v.co = Vector((v.co.x * squash[0], v.co.y * squash[1], v.co.z * squash[2])) * r * (1 + 0.2 * n_)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = False
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    P = np.array([list(v.co) for v in me.vertices])
    col, un = paint_points(P, dict(base=base, base2=base2, split=1.3, fine=0.10, blotch=0.22, blotch_scale=0.9 / max(r, 0.1), seed=seed))
    write_points(ob, col, un); toon_material(ob)
    return ob


def carry(sc, base_me, col, flat):
    """the colours of a coarse mesh's faces onto every vertex of the fine one (the sculpt) that lies on it: nearest face (a BVH).
    Both meshes in the same local frame (MZ4250 ships his base mesh and the sculpt at the same place and scale)."""
    from mathutils.bvhtree import BVHTree
    tree = BVHTree.FromPolygons([v.co[:] for v in base_me.vertices], [tuple(p.vertices) for p in base_me.polygons])
    sm = sc.data; n = len(sm.vertices)
    co = [0.0] * (n * 3); sm.vertices.foreach_get('co', co)
    out = [0.0] * (n * 4)
    for i in range(n):
        f = tree.find_nearest(Vector((co[3 * i], co[3 * i + 1], co[3 * i + 2])))[2]
        c = col[f]; out[4 * i:4 * i + 4] = (c[0], c[1], c[2], 0.0 if flat[f] else 1.0)
    for a in [a for a in sm.color_attributes if a.name == 'speckle']:
        sm.color_attributes.remove(a)
    att = sm.color_attributes.new('speckle', 'FLOAT_COLOR', 'POINT')
    att.data.foreach_set('color', out)
    sm.color_attributes.active_color = att
    return tree


def mark_proud(sc, tree, region, colour, unshaded=False, seed_at=0.5, grow_to=0.12, shade=(0.85, 1.1)):
    """recolour the parts of the fine mesh that stand proud of the coarse one (teeth, claws) inside region(x, y, z) -> bool: the tips (proud
    by seed_at or more) seed it and it grows through the mesh while points stand proud by grow_to, so a tooth is coloured down to where it
    meets the gum. `tree`: the coarse mesh's BVH (carry's return). Returns how many points it marked."""
    sm = sc.data; n = len(sm.vertices)
    co = [0.0] * (n * 3); sm.vertices.foreach_get('co', co)
    proud = {}
    for i in range(n):
        x, y, z = co[3 * i], co[3 * i + 1], co[3 * i + 2]
        if not region(x, y, z):
            continue
        v = Vector((x, y, z)); loc, nor, idx, d = tree.find_nearest(v)
        proud[i] = (v - loc).dot(nor)
    ev = [0] * (len(sm.edges) * 2); sm.edges.foreach_get('vertices', ev)
    nb = {}
    for j in range(0, len(ev), 2):
        a, b = ev[j], ev[j + 1]
        if a in proud and b in proud:
            nb.setdefault(a, []).append(b); nb.setdefault(b, []).append(a)
    hit = set(i for i, p in proud.items() if p > seed_at)
    edge = list(hit)
    while edge:
        nxt = []
        for i in edge:
            for j in nb.get(i, ()):
                if j not in hit and proud[j] > grow_to:
                    hit.add(j); nxt.append(j)
        edge = nxt
    att = sm.color_attributes['speckle']
    cols = [0.0] * (n * 4); att.data.foreach_get('color', cols)
    tc = srgb2lin(colour); rnd = random.Random(11)
    for i in hit:
        k = shade[0] + (shade[1] - shade[0]) * rnd.random()
        cols[4 * i:4 * i + 4] = [tc[0] * k, tc[1] * k, tc[2] * k, 0.0 if unshaded else 1.0]
    att.data.foreach_set('color', cols)
    return len(hit)


# ------------------------------------------------------------------ the sprite camera (tools/render-sprites.py's, exactly) and a look-test still
def sprite_camera(scene, lo, hi):
    """the dimetric camera over a figure already standing centred on its foot at z 0: (cam, FW, FH, AX, AY) at 1x."""
    height_px = (hi.z - lo.z) * K * math.cos(math.radians(30))
    span_px = max(hi.x - lo.x, hi.y - lo.y) * K
    FW = max(96, int(span_px * 1.25) // 2 * 2 + 8)
    FH = max(96, int(span_px * 0.75 + height_px) // 2 * 2 + 16)
    AX, AY = FW // 2, FH - FH // 5
    cam_d = bpy.data.cameras.new('iso'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = max(FW, FH) / K
    cam = bpy.data.objects.new('iso', cam_d); scene.collection.objects.link(cam); scene.camera = cam
    cam.rotation_euler = (math.radians(60), 0, math.radians(45))
    back = Vector((math.sin(math.radians(60)) * math.sin(math.radians(45)), -math.sin(math.radians(60)) * math.cos(math.radians(45)), math.cos(math.radians(60))))
    up = Vector((-0.5 * math.sin(math.radians(45)), 0.5 * math.cos(math.radians(45)), math.sin(math.radians(60))))
    cam.location = back * 40 + up * ((AY - FH / 2) / K)
    cam_d.clip_end = 200
    return cam, FW, FH, AX, AY

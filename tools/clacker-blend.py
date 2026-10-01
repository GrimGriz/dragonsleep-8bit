"""The clacker -- the realm's hook horror, the landlord's picture (dev/visions/the-clackers.jpg) -- built from nothing in Blender.

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python tools/clacker-blend.py [-- previews]

Writes deep16/_src/clacker/clacker.blend (deep16/_src is gitignored: this script is what the repo keeps, and a re-run
rebuilds the model exactly -- no randomness anywhere). With `-- previews` it also renders, in Eevee,
dev/visions/clacker-model-front.png, -three-quarter.png, -side.png (IDLE frame 1) and -attack.png (ATTACK frame 17, the clack).

Fits tools/render-sprites.py (the DEEP16 sprite pipeline): ONE parent-less armature (Clacker_Rig, 23 bones); the meshes
Clacker_Body, Clacker_Bone (hooks, beak, toe claws) and Clacker_Eyes are parented to it with Armature modifiers; the model
faces -Y; 1 unit = 1 m, about 9 ft to the top of the hooks, hunched; three actions IDLE, WALK, ATTACK, each a 32-frame loop
on frames 1..33 (frame 33 == frame 1; Manual Frame Range + Cyclic), every bone keyed on every frame. The clack -- the two
hooks struck together, the creature's voice -- is ATTACK frame 17 (pose marker 'clack', and the rig's custom prop clack_frame).

How it is made: the body is a vertex skeleton under a Skin modifier (three pieces: the core -- pelvis, spine, neck, head,
legs, shoulders -- and each folded arm), baked through one level of subdivision and weighted to the bones by nearest
skeleton edge (distance over radius); a live Subdivision modifier sits after the Armature. The hooks, the beak and the claws
are tapered sweeps along Catmull-Rom paths (laterally flattened, a UV running base to tip). Materials are procedural
(Principled BSDF; the hide's cobbled plates are a Voronoi bump with per-plate tone); each material's viewport colour is set
too, since the sprite pipeline renders in Workbench. The animation is posed by a small forward-kinematics solver here:
the legs by two-bone IK to planted feet, the ATTACK's arms by two-bone IK to wrist targets with each hook aimed by frame.
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'deep16', '_src', 'clacker')
OUT_BLEND = os.path.join(OUT_DIR, 'clacker.blend')
VIS = os.path.join(ROOT, 'dev', 'visions')
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
V = Vector
FRAMES = 32           # each action loops over frames 1..33
CLACK_FRAME = 17

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def mir(v):
    return V((-v[0], v[1], v[2]))


def side_name(name, s):
    return name + '.' + s


def ss(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def srgb(h):
    """'#rrggbb' -> linear RGBA for shader nodes"""
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1.0]


def raw(h):
    """'#rrggbb' -> the raw 0..1 triple the sprite pipeline puts in a material's viewport colour"""
    return [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1.0]


# ======================================================================== the skeleton (left side; the right is its mirror)
# (name, head, tail, parent, connected)
BONES_MID = [
    ('root', (0, 0, 0), (0, -0.3, 0), None, False),
    ('hips', (0, 0.30, 1.12), (0, 0.16, 1.50), 'root', False),
    ('spine', (0, 0.16, 1.50), (0, -0.02, 1.82), 'hips', True),
    ('chest', (0, -0.02, 1.82), (0, -0.30, 2.12), 'spine', True),
    ('neck', (0, -0.30, 2.12), (0, -0.50, 2.16), 'chest', True),
    ('neck2', (0, -0.50, 2.16), (0, -0.66, 2.12), 'neck', True),
    ('head', (0, -0.66, 2.12), (0, -0.90, 1.90), 'neck2', True),
]
BONES_SIDE = [
    ('shoulder', (0.08, -0.12, 2.00), (0.42, -0.10, 1.98), 'chest', False),
    ('upperarm', (0.42, -0.10, 1.98), (0.62, 0.42, 1.42), 'shoulder', True),
    ('forearm', (0.62, 0.42, 1.42), (0.56, -0.36, 1.62), 'upperarm', True),
    ('hook', (0.56, -0.36, 1.62), (0.56, -0.22, 1.94), 'forearm', True),
    ('thigh', (0.26, 0.30, 1.06), (0.32, -0.04, 0.68), 'hips', False),
    ('shin', (0.32, -0.04, 0.68), (0.32, 0.30, 0.32), 'thigh', True),
    ('foot', (0.32, 0.30, 0.32), (0.32, 0.06, 0.075), 'shin', True),
    ('toe', (0.32, 0.06, 0.075), (0.32, -0.24, 0.04), 'foot', True),
]
MID_NAMES = {b[0] for b in BONES_MID}


def all_bones():
    out = list(BONES_MID)
    for s in ('L', 'R'):
        for name, h, t, par, con in BONES_SIDE:
            if s == 'R':
                h, t = mir(h), mir(t)
            out.append((side_name(name, s), tuple(h), tuple(t), par if par in MID_NAMES else side_name(par, s), con))
    return out


BONES = all_bones()

# ======================================================================== the body's skin skeleton: nodes (pos, radius), edges (a, b, bone)
CORE_NODES = {
    'P0': ((0, 0.30, 1.12), 0.34),     # pelvis
    'P1': ((0, 0.18, 1.50), 0.44),     # belly
    'P2': ((0, 0.0, 1.82), 0.50),      # chest
    'P3': ((0, -0.12, 2.02), 0.42),    # the hump between the shoulders
    'N0': ((0, -0.32, 2.13), 0.26),    # the neck arches forward, then hangs
    'N1': ((0, -0.50, 2.17), 0.21),
    'N2': ((0, -0.66, 2.12), 0.18),
    'H0': ((0, -0.78, 2.04), 0.16),    # the skull
    'H1': ((0, -0.88, 1.95), 0.11),    # the face, where the beak grows
}
CORE_SIDE = {
    'S': ((0.42, -0.10, 1.98), 0.26),  # the shoulder
    'HL': ((0.26, 0.30, 1.06), 0.25),  # hip joint
    'K': ((0.32, -0.04, 0.68), 0.165), # knee (forward)
    'Hk': ((0.32, 0.30, 0.32), 0.10),  # hock (back): digitigrade
    'B': ((0.32, 0.06, 0.075), 0.075), # ball of the foot
    'T1': ((0.32, -0.24, 0.04), 0.04),
    'T2': ((0.45, -0.15, 0.035), 0.035),
    'T3': ((0.19, -0.15, 0.035), 0.035),
}
CORE_EDGES = [('P0', 'P1', 'hips'), ('P1', 'P2', 'spine'), ('P2', 'P3', 'chest'), ('P3', 'N0', 'chest'),
              ('N0', 'N1', 'neck'), ('N1', 'N2', 'neck2'), ('N2', 'H0', 'head'), ('H0', 'H1', 'head')]
CORE_EDGES_SIDE = [('P3', 'S', 'shoulder'), ('P0', 'HL', 'hips'), ('HL', 'K', 'thigh'), ('K', 'Hk', 'shin'),
                   ('Hk', 'B', 'foot'), ('B', 'T1', 'toe'), ('B', 'T2', 'toe'), ('B', 'T3', 'toe')]
ARM_NODES = {  # the arm folds like a wing: shoulder -> elbow low at the back -> wrist at the front of the chest
    'A0': ((0.42, -0.10, 1.98), 0.21),
    'E': ((0.62, 0.42, 1.42), 0.17),
    'W': ((0.56, -0.36, 1.62), 0.15),
    'W2': ((0.56, -0.44, 1.68), 0.11),
}
ARM_EDGES = [('A0', 'E', 'upperarm'), ('E', 'W', 'forearm'), ('W', 'W2', 'hook')]

# the hook: rises from the wrist, up and back past the shoulder, over, the point coming forward and down (the painting's scythe)
HOOK_L = [(0.56, -0.38, 1.58), (0.57, -0.32, 1.76), (0.585, -0.19, 1.98), (0.60, -0.09, 2.25), (0.61, -0.06, 2.47),
          (0.60, -0.13, 2.64), (0.57, -0.29, 2.72), (0.52, -0.48, 2.68), (0.46, -0.64, 2.59), (0.42, -0.72, 2.51)]
# the beak: out of the face and hooked hard down, the point curling back under (vulture)
BEAK = [(0, -0.84, 1.97), (0, -0.92, 1.90), (0, -0.965, 1.80), (0, -0.975, 1.70), (0, -0.95, 1.61), (0, -0.90, 1.55),
        (0, -0.86, 1.535)]
CLAWS_L = [  # one claw on each toe
    [(0.32, -0.22, 0.045), (0.32, -0.30, 0.04), (0.32, -0.35, 0.018), (0.32, -0.365, 0.0)],
    [(0.44, -0.14, 0.04), (0.475, -0.19, 0.035), (0.50, -0.23, 0.015), (0.505, -0.245, 0.0)],
    [(0.20, -0.14, 0.04), (0.165, -0.19, 0.035), (0.14, -0.23, 0.015), (0.135, -0.245, 0.0)],
]


def skin_graph(nodes_mid, nodes_side, edges_mid, edges_side, sides=('L', 'R')):
    """-> names, positions, radii, edges (index pairs), edge bones"""
    names, pos, rad = [], [], []
    for k, (p, r) in nodes_mid.items():
        names.append(k); pos.append(p); rad.append(r)
    for s in sides:
        for k, (p, r) in nodes_side.items():
            names.append(k + '.' + s); pos.append(p if s == 'L' else tuple(mir(p))); rad.append(r)
    idx = {n: i for i, n in enumerate(names)}
    edges, ebones = [], []
    for a, b, bone in edges_mid:
        edges.append((idx[a], idx[b])); ebones.append(bone)
    for s in sides:
        for a, b, bone in edges_side:
            a2 = a if a in nodes_mid else a + '.' + s
            b2 = b if b in nodes_mid else b + '.' + s
            edges.append((idx[a2], idx[b2])); ebones.append(bone if bone in MID_NAMES else side_name(bone, s))
    return names, pos, rad, edges, ebones


def skin_bake(name, pos, rad, edges, subdiv=1):
    """vertex skeleton -> Skin modifier -> Subdivision -> a plain mesh's verts and faces"""
    me = bpy.data.meshes.new(name + '_skel')
    me.from_pydata([V(p) for p in pos], edges, [])
    ob = bpy.data.objects.new(name + '_skel', me)
    scene.collection.objects.link(ob)
    sk = ob.modifiers.new('skin', 'SKIN')
    sk.branch_smoothing = 0.5
    sk.use_smooth_shade = True
    for i, r in enumerate(rad):
        me.skin_vertices[0].data[i].radius = (r, r)
        me.skin_vertices[0].data[i].use_root = (i == 0)
    sub = ob.modifiers.new('sub', 'SUBSURF')
    sub.levels = sub.render_levels = subdiv
    dg = bpy.context.evaluated_depsgraph_get()
    baked = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    verts = np.empty(len(baked.vertices) * 3, dtype=np.float64)
    baked.vertices.foreach_get('co', verts)
    verts = verts.reshape(-1, 3)
    faces = [tuple(p.vertices) for p in baked.polygons]
    bpy.data.objects.remove(ob, do_unlink=True)
    bpy.data.meshes.remove(me)
    bpy.data.meshes.remove(baked)
    return verts, faces


def skin_weights(verts, pos, rad, edges, ebones, sigma=0.12):
    """each vertex to the bones of its nearest skeleton edges, by distance over the edge's radius; joints blend"""
    pos = np.array(pos, dtype=np.float64)
    rad = np.array(rad, dtype=np.float64)
    bones = sorted(set(ebones))
    score = {b: np.full(len(verts), np.inf) for b in bones}
    for (a, b), bn in zip(edges, ebones):
        A, B = pos[a], pos[b]
        AB = B - A
        t = np.clip(((verts - A) @ AB) / (AB @ AB), 0, 1)
        d = np.linalg.norm(verts - (A + t[:, None] * AB), axis=1)
        r = rad[a] + (rad[b] - rad[a]) * t
        score[bn] = np.minimum(score[bn], d / r)
    S = np.stack([score[b] for b in bones], axis=1)
    W = np.exp(-(S - S.min(axis=1, keepdims=True)) / sigma)
    W[W < 0.03] = 0
    W /= W.sum(axis=1, keepdims=True)
    return bones, W


# ======================================================================== sweeps (hooks, beak, claws)
def catmull(pts, n):
    P = [V(p) for p in pts]
    P = [P[0] + (P[0] - P[1])] + P + [P[-1] + (P[-1] - P[-2])]
    segs = len(pts) - 1
    out = []
    for i in range(n):
        u = i / (n - 1) * segs
        k = min(int(u), segs - 1)
        s = u - k
        p0, p1, p2, p3 = P[k], P[k + 1], P[k + 2], P[k + 3]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s + (-p0 + 3 * p1 - 3 * p2 + p3) * s * s * s))
    return out


def resample(pts, n):
    dense = catmull(pts, 600)
    acc = [0.0]
    for i in range(1, len(dense)):
        acc.append(acc[-1] + (dense[i] - dense[i - 1]).length)
    out, j = [], 0
    for k in range(n):
        target = acc[-1] * k / (n - 1)
        while j < len(dense) - 2 and acc[j + 1] < target:
            j += 1
        f = (target - acc[j]) / max(1e-9, acc[j + 1] - acc[j])
        out.append(dense[j].lerp(dense[j + 1], min(1.0, max(0.0, f))))
    return out


def sweep(path, rfun, n=40, ring=12, flat=0.65, hint=V((1, 0, 0))):
    """a closed tapered tube along path; cross-section an ellipse, `flat` x thinner along the hint axis; U runs base 0 -> tip 1"""
    pts = resample(path, n)
    verts, faces, uvs = [], [], []
    for i, p in enumerate(pts):
        if i == n - 1:
            verts.append(p.copy())
            break
        T = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        S = (hint - T * hint.dot(T)).normalized()
        N = T.cross(S)
        r = rfun(i / (n - 1))
        for j in range(ring):
            a = 2 * math.pi * j / ring
            verts.append(p + S * (r * flat * math.cos(a)) + N * (r * math.sin(a)))
    for i in range(n - 2):
        u0, u1 = i / (n - 1), (i + 1) / (n - 1)
        for j in range(ring):
            a, b = i * ring + j, i * ring + (j + 1) % ring
            c, d = (i + 1) * ring + (j + 1) % ring, (i + 1) * ring + j
            faces.append((a, b, c, d))
            uvs.append(((u0, j / ring), (u0, (j + 1) / ring), (u1, (j + 1) / ring), (u1, j / ring)))
    tip, last = len(verts) - 1, (n - 2) * ring
    u0 = (n - 2) / (n - 1)
    for j in range(ring):
        faces.append((last + j, last + (j + 1) % ring, tip))
        uvs.append(((u0, j / ring), (u0, (j + 1) / ring), (1.0, (j + 0.5) / ring)))
    faces.append(tuple(reversed(range(ring))))
    uvs.append(tuple((0.0, 0.5) for _ in range(ring)))
    return verts, faces, uvs, pts


def build_mesh(name, parts, materials):
    """parts: dicts {verts, faces, uvs|None, weights: bone name | (bones, W), mat}; -> a mesh object with vertex groups"""
    allv, allf, allmat, alluv = [], [], [], []
    groups = {}
    for part in parts:
        off = len(allv)
        allv += [tuple(v) for v in part['verts']]
        for k, f in enumerate(part['faces']):
            allf.append(tuple(i + off for i in f))
            allmat.append(part['mat'])
            alluv += list(part['uvs'][k]) if part.get('uvs') else [(0.0, 0.0)] * len(f)
        w = part['weights']
        if isinstance(w, str):
            groups.setdefault(w, []).append((list(range(off, off + len(part['verts']))), 1.0))
        else:
            bones, W = w
            for k, b in enumerate(bones):
                for i in np.nonzero(W[:, k])[0]:
                    groups.setdefault(b, []).append(([off + int(i)], float(W[i, k])))
    me = bpy.data.meshes.new(name)
    me.from_pydata(allv, [], allf)
    uvl = me.uv_layers.new(name='UVMap')
    uvl.data.foreach_set('uv', [c for uv in alluv for c in uv])
    me.polygons.foreach_set('material_index', allmat)
    for m in materials:
        me.materials.append(m)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    for b, entries in groups.items():
        vg = ob.vertex_groups.get(b) or ob.vertex_groups.new(name=b)
        for idxs, wt in entries:
            vg.add(idxs, wt, 'REPLACE')
    return ob


# ======================================================================== materials (procedural; viewport colours for the Workbench sprites)
def node(nt, kind, loc, **props):
    n = nt.nodes.new(kind)
    n.location = loc
    for k, v in props.items():
        setattr(n, k, v)
    return n


def ramp(nt, loc, stops):
    r = node(nt, 'ShaderNodeValToRGB', loc)
    els = r.color_ramp.elements
    els[0].position, els[0].color = stops[0][0], srgb(stops[0][1])
    els[1].position, els[1].color = stops[-1][0], srgb(stops[-1][1])
    for p, c in stops[1:-1]:
        els.new(p).color = srgb(c)
    return r


def math_node(nt, loc, op, a=None, b=None, c=None):
    n = node(nt, 'ShaderNodeMath', loc, operation=op)
    for i, v in enumerate((a, b, c)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[i].default_value = v
        else:
            nt.links.new(v, n.inputs[i])
    return n.outputs[0]


def scaled_generated(nt, dims, loc):
    tc = node(nt, 'ShaderNodeTexCoord', loc)
    vm = node(nt, 'ShaderNodeVectorMath', (loc[0] + 180, loc[1]), operation='MULTIPLY')
    nt.links.new(tc.outputs['Generated'], vm.inputs[0])
    vm.inputs[1].default_value = dims
    return tc, vm.outputs[0]


def new_material(name, viewport):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    m.diffuse_color = raw(viewport)
    out = node(nt, 'ShaderNodeOutputMaterial', (900, 0))
    bsdf = node(nt, 'ShaderNodeBsdfPrincipled', (600, 0))
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return m, nt, bsdf


def mat_hide(dims):
    """grey-green armour of small cobbled plates, dark in the seams; each plate its own tone; a Voronoi bump"""
    m, nt, bsdf = new_material('Clacker_Hide', '#3a4237')
    m.roughness = 0.7
    _, co = scaled_generated(nt, dims, (-1200, 0))
    cell = node(nt, 'ShaderNodeTexVoronoi', (-800, 200), feature='F1')
    edge = node(nt, 'ShaderNodeTexVoronoi', (-800, -100), feature='DISTANCE_TO_EDGE')
    for t in (cell, edge):
        t.inputs['Scale'].default_value = 21.0
        t.inputs['Randomness'].default_value = 0.8
    blot = node(nt, 'ShaderNodeTexNoise', (-800, -400))
    blot.inputs['Scale'].default_value = 2.5
    fine = node(nt, 'ShaderNodeTexNoise', (-800, -650))
    fine.inputs['Scale'].default_value = 110.0
    for t in (cell, edge, blot, fine):
        nt.links.new(co, t.inputs['Vector'])

    def smooth(lo, hi, loc):
        mr = node(nt, 'ShaderNodeMapRange', loc, interpolation_type='SMOOTHSTEP')
        nt.links.new(edge.outputs['Distance'], mr.inputs[0])
        mr.inputs[1].default_value, mr.inputs[2].default_value = lo, hi
        return mr.outputs[0]
    seam = smooth(0.0, 0.05, (-550, -100))          # 0 down in the seams between plates, 1 on a plate
    dome = smooth(0.0, 0.32, (-550, -300))          # each plate a low dome: catches the light like a cobble
    tone = math_node(nt, (-550, 200), 'MULTIPLY_ADD', cell.outputs['Color'], 0.45, 0.28)
    tone = math_node(nt, (-380, 200), 'MULTIPLY_ADD', blot.outputs['Fac'], 0.30, tone)
    shade = math_node(nt, (-380, 0), 'MULTIPLY_ADD', seam, 0.62, 0.38)
    fac = math_node(nt, (-200, 100), 'MULTIPLY', tone, shade)
    col = ramp(nt, (0, 200), [(0.0, '#10140e'), (0.3, '#2d332b'), (0.55, '#4d5549'), (0.8, '#717869'), (1.0, '#969c8c')])
    nt.links.new(fac, col.inputs['Fac'])
    nt.links.new(col.outputs['Color'], bsdf.inputs['Base Color'])
    h = math_node(nt, (-200, -200), 'MULTIPLY_ADD', dome, 0.6, math_node(nt, (-380, -450), 'MULTIPLY', cell.outputs['Color'], 0.2))
    h = math_node(nt, (-30, -250), 'MULTIPLY_ADD', fine.outputs['Fac'], 0.08, h)
    bump = node(nt, 'ShaderNodeBump', (300, -250))
    bump.inputs['Strength'].default_value = 0.9
    bump.inputs['Distance'].default_value = 0.025
    nt.links.new(h, bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Roughness'].default_value = 0.62
    bsdf.inputs['Specular IOR Level'].default_value = 0.35
    return m


def mat_bone(dims):
    """old bone: off-white, yellowed, darker at the root, growth ridges along its length"""
    m, nt, bsdf = new_material('Clacker_Bone', '#d8cfb2')
    uv = node(nt, 'ShaderNodeUVMap', (-1200, 300), uv_map='UVMap')
    sep = node(nt, 'ShaderNodeSeparateXYZ', (-1000, 300))
    nt.links.new(uv.outputs['UV'], sep.inputs[0])
    u = sep.outputs['X']
    _, co = scaled_generated(nt, dims, (-1200, -150))
    streak = node(nt, 'ShaderNodeTexNoise', (-800, -150))
    streak.inputs['Scale'].default_value = 30.0
    nt.links.new(co, streak.inputs['Vector'])
    ridge = math_node(nt, (-800, 350), 'MULTIPLY', u, 70.0)
    ridge = math_node(nt, (-650, 350), 'SINE', ridge)
    fac = math_node(nt, (-500, 150), 'MULTIPLY_ADD', streak.outputs['Fac'], 0.25, u)
    fac = math_node(nt, (-350, 150), 'ADD', fac, -0.12)
    col = ramp(nt, (-150, 200), [(0.0, '#5d5643'), (0.22, '#a39a7c'), (0.55, '#d9d0b1'), (0.85, '#e4dcc2'), (1.0, '#c9bd98')])
    nt.links.new(fac, col.inputs['Fac'])
    nt.links.new(col.outputs['Color'], bsdf.inputs['Base Color'])
    h = math_node(nt, (-350, -150), 'MULTIPLY_ADD', ridge, 0.15, streak.outputs['Fac'])
    bump = node(nt, 'ShaderNodeBump', (300, -250))
    bump.inputs['Strength'].default_value = 0.35
    bump.inputs['Distance'].default_value = 0.01
    nt.links.new(h, bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Roughness'].default_value = 0.38
    bsdf.inputs['Specular IOR Level'].default_value = 0.5
    return m


def mat_eye():
    m, nt, bsdf = new_material('Clacker_Eye', '#f0cc30')
    bsdf.inputs['Base Color'].default_value = srgb('#e8b820')
    bsdf.inputs['Emission Color'].default_value = srgb('#ffc928')
    bsdf.inputs['Emission Strength'].default_value = 2.5
    bsdf.inputs['Roughness'].default_value = 0.15
    return m


# ======================================================================== build: the armature
arm_data = bpy.data.armatures.new('Clacker_Rig')
arm = bpy.data.objects.new('Clacker_Rig', arm_data)
scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for name, h, t, par, con in BONES:
    eb = arm_data.edit_bones.new(name)
    eb.head, eb.tail, eb.roll = V(h), V(t), 0.0
    if par:
        eb.parent = arm_data.edit_bones[par]
        eb.use_connect = con
bpy.ops.object.mode_set(mode='OBJECT')
arm_data.display_type = 'STICK'
arm['clack_frame'] = CLACK_FRAME

# ======================================================================== build: the body
names, pos, rad, edges, ebones = skin_graph(CORE_NODES, CORE_SIDE, CORE_EDGES, CORE_EDGES_SIDE)
core_v, core_f = skin_bake('core', pos, rad, edges)
core_w = skin_weights(core_v, pos, rad, edges, ebones)
body_parts = [dict(verts=core_v, faces=core_f, weights=core_w, mat=0)]
for s in ('L', 'R'):
    an, ap, ar, ae, ab = skin_graph({}, ARM_NODES, [], ARM_EDGES, sides=(s,))
    av, af = skin_bake('arm.' + s, ap, ar, ae)
    body_parts.append(dict(verts=av, faces=af, weights=skin_weights(av, ap, ar, ae, ab), mat=0))
allv = np.concatenate([p['verts'] for p in body_parts])
body_dims = tuple(float(x) for x in (allv.max(axis=0) - allv.min(axis=0)))
M_HIDE, M_BONE, M_EYE = mat_hide(body_dims), mat_bone((1.0, 1.0, 1.0)), mat_eye()
body = build_mesh('Clacker_Body', body_parts, [M_HIDE])

# the bone: two hooks, the beak, the claws
bone_parts = []
HOOK_PATH = {}
for s in ('L', 'R'):
    path = HOOK_L if s == 'L' else [tuple(mir(p)) for p in HOOK_L]
    hv, hf, huv, hpts = sweep(path, lambda u: 0.004 + 0.10 * (1 - u) ** 0.8, n=56, ring=14, flat=0.62)
    HOOK_PATH[s] = hpts
    bone_parts.append(dict(verts=hv, faces=hf, uvs=huv, weights=side_name('hook', s), mat=0))
    for claw in CLAWS_L:
        cp = claw if s == 'L' else [tuple(mir(p)) for p in claw]
        cv, cf, cuv, _ = sweep(cp, lambda u: 0.003 + 0.026 * (1 - u) ** 0.8, n=10, ring=8, flat=0.7)
        bone_parts.append(dict(verts=cv, faces=cf, uvs=cuv, weights=side_name('toe', s), mat=0))
bv, bf, buv, _ = sweep(BEAK, lambda u: 0.004 + 0.086 * (1 - u) ** 0.85, n=36, ring=14, flat=0.66)
bone_parts.append(dict(verts=bv, faces=bf, uvs=buv, weights='head', mat=0))
bonemesh = build_mesh('Clacker_Bone', bone_parts, [M_BONE])

# the eyes: small, yellow, set into the side of the head just above the beak (found by casting at the baked skull)
core_bvh = BVHTree.FromPolygons([V(v) for v in core_v], core_f)
eye_parts = []
for s, sx in (('L', 1), ('R', -1)):
    hit = core_bvh.ray_cast(V((sx * 1.0, -0.875, 1.99)), V((-sx, 0, 0)))[0]
    c = hit - V((sx * 0.012, 0, 0))
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.026, matrix=Matrix.Translation(c))
    ev = [v.co.copy() for v in bm.verts]
    ef = [tuple(v.index for v in f.verts) for f in bm.faces]
    bm.free()
    eye_parts.append(dict(verts=ev, faces=ef, weights='head', mat=0))
eyes = build_mesh('Clacker_Eyes', eye_parts, [M_EYE])

for ob in (body, bonemesh, eyes):
    ob.parent = arm
    mod = ob.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm
    mod.use_vertex_groups = True
sub = body.modifiers.new('Subdivision', 'SUBSURF')
sub.levels, sub.render_levels = 1, 2

# ======================================================================== posing: a little FK solver with world-axis deltas, aims and IK
REST = {b.name: b.matrix_local.copy() for b in arm_data.bones}
PARENT = {b.name: (b.parent.name if b.parent else None) for b in arm_data.bones}
LEN = {b.name: b.length for b in arm_data.bones}
ORDER = [b[0] for b in BONES]


class Pose:
    def __init__(self):
        self.M, self.basis = {}, {}

    def m0(self, name):
        p = PARENT[name]
        return self.M[p] @ REST[p].inverted() @ REST[name] if p else REST[name].copy()

    def set_final(self, name, R3, head=None):
        M0 = self.m0(name)
        h = head if head is not None else M0.to_translation()
        M = Matrix.Translation(h) @ R3.to_4x4()
        self.M[name] = M
        self.basis[name] = M0.inverted() @ M

    def delta(self, name, dq=None, dloc=None):
        """rotate about the bone's head by dq, given in armature axes, from where its parent carried it; move by dloc"""
        M0 = self.m0(name)
        R = M0.to_3x3()
        if dq is not None:
            R = dq.to_matrix() @ R
        self.set_final(name, R, M0.to_translation() + (dloc if dloc is not None else V()))

    def aim(self, name, direction):
        M0 = self.m0(name)
        R0 = M0.to_3x3()
        dq = R0.col[1].normalized().rotation_difference(direction.normalized())
        self.set_final(name, dq.to_matrix() @ R0)

    def head(self, name):
        return self.m0(name).to_translation()

    def point(self, name, rest_point):
        """where a point carried rigidly by the bone (given in rest armature space) is now"""
        return self.M[name] @ REST[name].inverted() @ V(rest_point)


def eul(p=0.0, r=0.0, y=0.0, s=1):
    """degrees: p about +X (positive pitches forward/down for this -Y-facing creature), r about Y, y about Z; s=-1 mirrors"""
    return (Quaternion((0, 0, 1), math.radians(y * s)) @ Quaternion((0, 1, 0), math.radians(r * s))
            @ Quaternion((1, 0, 0), math.radians(p)))


def two_bone(S, T, L1, L2, pole):
    d = T - S
    dist = max(abs(L1 - L2) + 1e-3, min(d.length, (L1 + L2) * 0.999))
    u = d.normalized()
    a = math.acos(max(-1.0, min(1.0, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist))))
    pp = (pole - u * pole.dot(u)).normalized()
    return S + u * (L1 * math.cos(a)) + pp * (L1 * math.sin(a)), S + u * dist


def frame3(y, c):
    y = y.normalized()
    c = (c - y * c.dot(y)).normalized()
    return Matrix((y, c, y.cross(c))).transposed()


# rest data the solvers lean on
REST_BALL = {s: REST[side_name('toe', s)].to_translation() for s in 'LR'}
META0 = {s: (REST_BALL[s] - REST[side_name('foot', s)].to_translation()).normalized() for s in 'LR'}
TOE0 = {s: REST[side_name('toe', s)].to_3x3().col[1].normalized() for s in 'LR'}
WRIST0 = {s: REST[side_name('hook', s)].to_translation() for s in 'LR'}
HOOK_Y0, HOOK_C0, HOOK_F0, POLE0 = {}, {}, {}, {}
for s in 'LR':
    y0 = REST[side_name('hook', s)].to_3x3().col[1].normalized()
    tau = HOOK_PATH[s][-1] - WRIST0[s]
    HOOK_Y0[s], HOOK_C0[s] = y0, (tau - y0 * tau.dot(y0)).normalized()
    HOOK_F0[s] = frame3(y0, HOOK_C0[s])
    S0 = REST[side_name('upperarm', s)].to_translation()
    E0 = REST[side_name('forearm', s)].to_translation()
    u = (WRIST0[s] - S0).normalized()
    POLE0[s] = ((E0 - S0) - u * (E0 - S0).dot(u)).normalized()


LEAN = 7.0    # every action stands a little more stooped than the bind pose, the painting's forward lean; the neck takes some back


def body_pose(P, hips_loc=(0, 0, 0), hips=(0, 0, 0), spine=(0, 0, 0), chest=(0, 0, 0), neck=(0, 0, 0), neck2=(0, 0, 0), head=(0, 0, 0)):
    P.delta('root')
    hips = (hips[0] + LEAN, hips[1], hips[2])
    neck = (neck[0] - LEAN * 0.6, neck[1], neck[2])
    P.delta('hips', eul(*hips), V(hips_loc))
    for n, e in (('spine', spine), ('chest', chest), ('neck', neck), ('neck2', neck2), ('head', head)):
        P.delta(n, eul(*e))


def arm_fk(P, s, shoulder=(0, 0, 0), upper=(0, 0, 0), fore=(0, 0, 0), hook=(0, 0, 0)):
    k = 1 if s == 'L' else -1
    for n, e in (('shoulder', shoulder), ('upperarm', upper), ('forearm', fore), ('hook', hook)):
        P.delta(side_name(n, s), eul(*e, s=k))


def arm_ik(P, s, wrist, pole, hook_dir, hook_curl, shoulder=(0, 0, 0)):
    k = 1 if s == 'L' else -1
    P.delta(side_name('shoulder', s), eul(*shoulder, s=k))
    S = P.head(side_name('upperarm', s))
    elbow, w = two_bone(S, wrist, LEN[side_name('upperarm', s)], LEN[side_name('forearm', s)], pole)
    P.aim(side_name('upperarm', s), elbow - S)
    P.aim(side_name('forearm', s), w - elbow)
    Q = frame3(hook_dir, hook_curl) @ HOOK_F0[s].transposed()
    P.set_final(side_name('hook', s), Q @ REST[side_name('hook', s)].to_3x3())


def leg_ik(P, s, ball, meta_dir=None, toe_dir=None):
    k = 1 if s == 'L' else -1
    meta = (meta_dir if meta_dir is not None else META0[s]).normalized()
    H = P.head(side_name('thigh', s))
    hock_t = ball - meta * LEN[side_name('foot', s)]
    knee, hock = two_bone(H, hock_t, LEN[side_name('thigh', s)], LEN[side_name('shin', s)], V((0.15 * k, -1, 0)))
    P.aim(side_name('thigh', s), knee - H)
    P.aim(side_name('shin', s), hock - knee)
    P.aim(side_name('foot', s), ball - hock)
    P.aim(side_name('toe', s), toe_dir if toe_dir is not None else TOE0[s])


def rot_x(deg, v):
    return Quaternion((1, 0, 0), math.radians(deg)) @ v


# ------------------------------------------------------------------ IDLE: breath, the head bobbing, a slow flex of the hooks; feet planted
STANCE = {'L': REST_BALL['L'] + V((0, -0.12, 0)), 'R': REST_BALL['R'] + V((0, 0.08, 0))}   # the painting's stagger, near foot forward


def pose_idle(t):
    P = Pose()
    w = 2 * math.pi * t
    b = math.sin(w)
    body_pose(P, hips_loc=(0, 0, 0.010 * b), spine=(1.2 * b, 0, 0), chest=(-2.5 * b, 0, 0),
              neck=(2.0 * math.sin(w - 0.7), 0, 0), neck2=(3.0 * math.sin(w - 1.2), 0, 5.0 * math.sin(w)),
              head=(4.0 * math.sin(2 * w - 0.5), 0, 0))
    for s, ph in (('L', 0.0), ('R', 1.1)):
        arm_fk(P, s, shoulder=(0, -2.5 * b, 0), upper=(2.0 * math.sin(w + ph), 0, 0),
               fore=(3.0 * math.sin(w + ph + 0.4), 0, 0), hook=(7.0 * math.sin(w + ph - 0.3), 0, 0))
    for s in 'LR':
        leg_ik(P, s, STANCE[s])
    return P


# ------------------------------------------------------------------ WALK: a hunched stride, in place; the head bobs like a bird's
STRIDE, LIFT, DUTY = 0.62, 0.20, 0.6


def pose_walk(t):
    P = Pose()
    w = 2 * math.pi * t
    bob = -0.035 - 0.035 * math.cos(2 * (w - 2 * math.pi * 0.05))
    sway = 0.035 * math.sin(w - 2 * math.pi * 0.05)
    body_pose(P, hips_loc=(sway, 0, bob), hips=(4, 3 * math.sin(w), -6 * math.cos(w)), spine=(2, 0, 2 * math.cos(w)),
              chest=(3 + 1.5 * math.cos(2 * w), 0, 4 * math.cos(w)), neck=(4 * math.cos(2 * w + 0.5), 0, 0),
              neck2=(0, 0, -2 * math.cos(w)), head=(-5 * math.cos(2 * w + 1.2), 0, 0))
    for s, ph in (('L', 0.0), ('R', math.pi)):
        arm_fk(P, s, upper=(7 * math.cos(w + ph), 0, 0), fore=(-3 * math.cos(w + ph), 0, 0),
               hook=(6 * math.cos(w + ph + 0.8), 0, 0))
    for s, ph in (('L', 0.0), ('R', 0.5)):
        p = (t + ph) % 1.0
        x0, y0, z0 = REST_BALL[s]
        if p < DUTY:
            q = p / DUTY
            y, z = y0 - STRIDE / 2 + STRIDE * q, z0
            mt, tt = 18 * ss((q - 0.65) / 0.35), 0.0
        else:
            q = (p - DUTY) / (1 - DUTY)
            e = ss(q)
            y, z = y0 + STRIDE / 2 - STRIDE * e, z0 + LIFT * math.sin(math.pi * q) ** 0.9
            mt, tt = 18 * (1 - e) + 25 * math.sin(math.pi * q), 35 * math.sin(math.pi * q)
        leg_ik(P, s, V((x0, y, z)), rot_x(mt, META0[s]), rot_x(tt, TOE0[s]))
    return P


# ------------------------------------------------------------------ ATTACK: rear up, both hooks raised high; strike down and across; CLACK
CROSS_DZ = 0.055      # at the clack the left hook passes a little over the right: they meet, they don't pass through


def attack_keys():
    N = dict(hl=V((0, 0, 0)), hips=V((0, 0, 0)), spine=V((0, 0, 0)), chest=V((0, 0, 0)), neck=V((0, 0, 0)),
             neck2=V((0, 0, 0)), head=V((0, 0, 0)), sh=V((0, 0, 0)), wr=WRIST0['L'].copy(), pole=POLE0['L'].copy(),
             D=HOOK_Y0['L'].copy(), C=HOOK_C0['L'].copy(), cross=0.0)
    W = dict(N, hl=V((0, 0.10, 0.05)), hips=V((-5, 0, 0)), spine=V((-6, 0, 0)), chest=V((-10, 0, 0)), neck=V((-8, 0, 0)),
             neck2=V((-6, 0, 0)), head=V((-14, 0, 0)), sh=V((0, -12, 6)), wr=V((0.74, 0.14, 2.60)), pole=V((1, 0.4, -0.4)),
             D=V((0.42, 0.22, 0.88)), C=V((0, -1, 0.1)))
    W2 = dict(W, wr=V((0.76, 0.20, 2.68)), chest=V((-12, 0, 0)), head=V((-18, 0, 0)))
    C = dict(N, hl=V((0, -0.08, -0.04)), hips=V((2, 0, 0)), spine=V((3, 0, 0)), chest=V((2, 0, 0)), neck=V((-20, 0, 0)),
             neck2=V((-8, 0, 0)), head=V((-10, 0, 0)), sh=V((0, 4, -12)), wr=V((0.42, -0.86, 1.70)), pole=V((1, 0.5, -0.1)),
             D=V((-0.85, -0.45, 0.12)), C=V((0, 0.15, -1)), cross=1.0)
    R = dict(C, hl=V((0, -0.06, -0.03)), wr=V((0.48, -0.80, 1.74)), D=V((-0.70, -0.68, 0.15)), cross=0.6)
    return [(0.0, N), (0.3125, W), (0.375, W2), (0.5, C), (0.5625, R), (1.0, N)]


ATTACK_KEYS = attack_keys()


def pose_attack(t):
    for i in range(len(ATTACK_KEYS) - 1):
        t0, A = ATTACK_KEYS[i]
        t1, B = ATTACK_KEYS[i + 1]
        if t0 <= t <= t1:
            break
    e = ss((t - t0) / (t1 - t0))
    K = {k: A[k] * (1 - e) + B[k] * e for k in A}
    P = Pose()
    body_pose(P, hips_loc=K['hl'], hips=K['hips'], spine=K['spine'], chest=K['chest'], neck=K['neck'], neck2=K['neck2'], head=K['head'])
    for s, sgn in (('L', 1), ('R', -1)):
        f = (lambda v: v.copy()) if s == 'L' else mir
        wr = f(K['wr']) + V((0, 0, sgn * CROSS_DZ * K['cross']))
        arm_ik(P, s, wr, f(K['pole']), f(K['D']), f(K['C']), shoulder=tuple(K['sh']))
    for s in 'LR':
        leg_ik(P, s, STANCE[s])
    return P


# ======================================================================== bake the actions
ad = arm.animation_data_create()
pbones = arm.pose.bones
for pb in pbones:
    pb.rotation_mode = 'QUATERNION'


def bake(name, fn):
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    ad.action = act
    prev = {}
    for f in range(1, FRAMES + 2):
        P = fn(((f - 1) % FRAMES) / FRAMES)
        for bname in ORDER:
            basis = P.basis[bname]
            q = basis.to_quaternion()
            if bname in prev and prev[bname].dot(q) < 0:
                q.negate()
            prev[bname] = q
            pb = pbones[bname]
            pb.rotation_quaternion = q
            pb.location = basis.to_translation()
            pb.keyframe_insert('rotation_quaternion', frame=f, group=bname)
            pb.keyframe_insert('location', frame=f, group=bname)
    act.use_frame_range = True
    act.frame_start, act.frame_end = 1, FRAMES + 1
    act.use_cyclic = True
    return act


bake('IDLE', pose_idle)
bake('WALK', pose_walk)
atk = bake('ATTACK', pose_attack)
mk = atk.pose_markers.new('clack')
mk.frame = CLACK_FRAME


def use_action(name):
    act = bpy.data.actions[name]
    ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots):
        ad.action_slot = act.slots[0]


use_action('IDLE')
scene.frame_start, scene.frame_end = 1, FRAMES
scene.render.fps = 24
scene.frame_set(1)

# the clack, measured: closest approach of the two hooks' centre lines at the clack frame
Pc = pose_attack((CLACK_FRAME - 1) / FRAMES)
cl = {s: [Pc.point(side_name('hook', s), p) for p in HOOK_PATH[s]] for s in 'LR'}
gap = min((a - b).length for a in cl['L'] for b in cl['R'])
print('[clacker] clack frame %d: hook centre lines %.3f m apart (touching at about 0.07-0.10)' % (CLACK_FRAME, gap))


# ======================================================================== a look-dev rig (dim cave light), saved with the file; the sprite pipeline drops cameras and lights
def look_at(ob, target):
    ob.rotation_euler = (V(target) - ob.location).to_track_quat('-Z', 'Y').to_euler()


world = bpy.data.worlds.new('Clacker_Cave')
world.use_nodes = True
bg = world.node_tree.nodes.get('Background') or world.node_tree.nodes.new('ShaderNodeBackground')
bg.inputs['Color'].default_value = srgb('#1c241c')
bg.inputs['Strength'].default_value = 0.35
scene.world = world
TARGET = V((0, -0.25, 1.45))
for lname, loc, energy, size, col in (('Key', (3.0, -4.5, 5.5), 1100, 3.0, '#e6eedd'), ('Fill', (-5.0, -2.5, 2.0), 160, 4.0, '#8fa892'),
                                      ('Rim', (-1.5, 5.0, 4.0), 700, 2.5, '#c8d8c0')):
    ld = bpy.data.lights.new('Look_' + lname, 'AREA')
    ld.energy, ld.size, ld.color = energy, size, srgb(col)[:3]
    lo = bpy.data.objects.new('Look_' + lname, ld)
    lo.location = loc
    look_at(lo, TARGET)
    scene.collection.objects.link(lo)
gm, gnt, gb = new_material('Look_Ground', '#202620')
gb.inputs['Base Color'].default_value = srgb('#1e241d')
gb.inputs['Roughness'].default_value = 0.95
gme = bpy.data.meshes.new('Look_Ground')
gme.from_pydata([(-12, -12, 0), (12, -12, 0), (12, 12, 0), (-12, 12, 0)], [], [(0, 1, 2, 3)])
gme.materials.append(gm)
ground = bpy.data.objects.new('Look_Ground', gme)
scene.collection.objects.link(ground)
CAMS = {'front': (0, -7.4, 1.7), 'three-quarter': (5.3, -5.3, 2.3), 'side': (7.4, 0, 1.7), 'attack': (2.6, -7.0, 2.6)}
for cname, loc in CAMS.items():
    cd = bpy.data.cameras.new('Look_' + cname)
    cd.lens = 62
    co = bpy.data.objects.new('Look_' + cname, cd)
    co.location = loc
    look_at(co, TARGET)
    scene.collection.objects.link(co)
scene.camera = bpy.data.objects['Look_three-quarter']
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 48
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 900, 1100, 100
scene.view_settings.view_transform = 'AgX'

os.makedirs(OUT_DIR, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
nb = len(arm_data.bones)
print('[clacker] saved %s: %d bones; body %d verts, bone %d, eyes %d; actions %s' % (
    OUT_BLEND, nb, len(body.data.vertices), len(bonemesh.data.vertices), len(eyes.data.vertices),
    ', '.join('%s %d-%d' % (a.name, a.frame_range[0], a.frame_range[1]) for a in bpy.data.actions)))

# ======================================================================== previews
if 'previews' in ARGS:
    r = scene.render
    r.image_settings.file_format = 'PNG'
    shots = [('front', 'IDLE', 1), ('three-quarter', 'IDLE', 1), ('side', 'IDLE', 1), ('attack', 'ATTACK', CLACK_FRAME)]
    for shot, action, frame in shots:
        use_action(action)
        scene.frame_set(frame)
        scene.camera = bpy.data.objects['Look_' + shot]
        r.filepath = os.path.join(VIS, 'clacker-model-%s.png' % shot)
        bpy.ops.render.render(write_still=True)
        print('[clacker] preview', r.filepath)
    use_action('IDLE')
    scene.frame_set(1)

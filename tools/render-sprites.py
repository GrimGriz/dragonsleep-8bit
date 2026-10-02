"""DEEP16 pipeline 1: pre-render a rigged, animated CC0 model to sprite frames at the Diablo angle.

    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --disable-autoexec --python tools/render-sprites.py -- <figure> [frames]

One figure per Blender run (a fresh scene each time). Reads tools/deep16-figures.json; models from deep16/_src/.
Writes deep16/_src/render/<figure>/<anim>/f<facing>_<frame>.png at SS x the sprite's 1x size, and meta.json.
Then tools/pixelate.py turns the frames into a palette sheet.

The camera: orthographic, rotation X 60, Z 45 -> true 2:1 dimetric. World +X is +gx (screen SE), world -Y is +gy (SW).
Facing f (0..7 = S, SW, W, NW, N, NE, E, SE) turns the model to 45 - 45 f degrees (the models face -Y, which is SW).
"""
import bpy, bmesh, sys, os, json, math
from mathutils import Vector, Matrix, Euler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'deep16', '_src')
SS = 4                      # supersample: frames render at 4x and pixelate.py boxes them down
TW = 64                     # a 5-ft square is 64 px wide at 1x
UNITS_PER_SQUARE = 1.6      # KayKit units in a 5-ft square (a KayKit hero, ~2.5 units, then stands ~56 px: heroic, as the spec asks)

argv = sys.argv[sys.argv.index('--') + 1:]
FIG = argv[0]
NFRAMES = int(argv[1]) if len(argv) > 1 else 8
CFG = json.load(open(os.path.join(ROOT, 'tools', 'deep16-figures.json'), encoding='utf-8'))
F = CFG['figures'][FIG]
K = TW / (UNITS_PER_SQUARE * math.sqrt(2))     # px (at 1x) per Blender unit, horizontally on screen


def hexrgb(h):
    return [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]


# ------------------------------------------------------------------ load
path = os.path.join(SRC, F['file'])
if path.endswith('.blend'):
    bpy.ops.wm.open_mainfile(filepath=path, load_ui=False, use_scripts=False)
    for o in list(bpy.data.objects):
        if o.type in ('CAMERA', 'LIGHT'):
            bpy.data.objects.remove(o, do_unlink=True)
else:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
scene = bpy.context.scene
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE' and o.parent is None)
for o in bpy.data.objects:
    if o.type == 'MESH':
        o.hide_render = o.name not in F['show']

# ------------------------------------------------------------------ recolour atlas cells (keep each cell's gradient, change its hue)
def recolor(imgs, cells):
    import numpy as np
    for img in imgs:
        w, h = img.size
        px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
        cw, ch = w // 8, h // 4
        for (c, r), col in cells:
            y0 = h - (r + 1) * ch          # Blender's rows run bottom-up
            cell = px[y0:y0 + ch, c * cw:(c + 1) * cw, :3]
            lum = cell @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
            mid = float(lum[ch // 2, cw // 3]) or 1.0
            tgt = np.array(hexrgb(col), dtype=np.float32)
            px[y0:y0 + ch, c * cw:(c + 1) * cw, :3] = np.clip(tgt[None, None, :] * (lum / mid)[..., None], 0, 1)
        img.pixels[:] = px.ravel()
        img.update()


def all_images():
    return {n.image for m in bpy.data.materials if m.node_tree for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image}


if F.get('recolor'):
    recolor(all_images(), F['recolor'])


# ------------------------------------------------------------------ a grade for atlas-textured models (Quaternius): turn the hue, scale saturation
# and value over the whole texture, so greys and whites (eyes, teeth, spikes) stay as they are. grade: {hue: degrees, sat: x, val: x}
def grade(imgs, g):
    import numpy as np
    for img in imgs:
        w, h = img.size
        px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
        r, gg, b = px[..., 0], px[..., 1], px[..., 2]
        mx = np.max(px[..., :3], axis=-1); mn = np.min(px[..., :3], axis=-1); d = mx - mn
        hh = np.zeros_like(mx)
        m = d > 1e-6
        rc = np.where(m, (mx - r) / np.where(m, d, 1), 0); gc = np.where(m, (mx - gg) / np.where(m, d, 1), 0); bc = np.where(m, (mx - b) / np.where(m, d, 1), 0)
        hh = np.where(r == mx, bc - gc, np.where(gg == mx, 2 + rc - bc, 4 + gc - rc))
        hh = np.where(m, (hh / 6) % 1, 0)
        ss = np.where(mx > 1e-6, d / np.where(mx > 1e-6, mx, 1), 0)
        hh = (hh + g.get('hue', 0) / 360.0) % 1
        ss = np.clip(ss * g.get('sat', 1), 0, 1)
        vv = np.clip(mx * g.get('val', 1), 0, 1)
        i = np.floor(hh * 6).astype(np.int32) % 6; f = hh * 6 - np.floor(hh * 6)
        p = vv * (1 - ss); q = vv * (1 - ss * f); t = vv * (1 - ss * (1 - f))
        out = np.stack([np.choose(i, [vv, q, p, p, t, vv]), np.choose(i, [t, vv, vv, q, p, p]), np.choose(i, [p, p, t, vv, vv, q])], axis=-1)
        px[..., :3] = out
        img.pixels[:] = px.ravel()
        img.update()


def grade_rgb(rgb, g):
    import colorsys
    h, s, v = colorsys.rgb_to_hsv(*rgb[:3])
    return list(colorsys.hsv_to_rgb((h + g.get('hue', 0) / 360.0) % 1, min(1, s * g.get('sat', 1)), min(1, v * g.get('val', 1))))


if F.get('grade'):
    grade(all_images(), F['grade'])
    # models coloured by material, with no texture (the Quaternius animals): grade the materials' own colours too
    for m in bpy.data.materials:
        m.diffuse_color = grade_rgb(list(m.diffuse_color), F['grade']) + [m.diffuse_color[3]]
        if m.use_nodes and m.node_tree:
            for n in m.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED' and not n.inputs['Base Color'].is_linked:
                    c = n.inputs['Base Color'].default_value
                    n.inputs['Base Color'].default_value = grade_rgb(list(c), F['grade']) + [c[3]]

# ------------------------------------------------------------------ a tint for untextured models (the spider)
if F.get('tint'):
    for m in bpy.data.materials:
        rgb = hexrgb(F['tint'])
        m.diffuse_color = rgb + [1]
        if m.use_nodes and m.node_tree:
            for n in m.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    n.inputs['Base Color'].default_value = rgb + [1]

# ------------------------------------------------------------------ Barley's threshing flail: a long handle, a hinged swipple, where the axe was
if F.get('flail'):
    axe = bpy.data.objects[F['flail']]
    bb = [Vector(v) for v in axe.bound_box]
    lo = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
    hi = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    ext = hi - lo
    ax = max(range(3), key=lambda i: ext[i])
    side = (ax + 1) % 3
    grip_end = Vector((0, 0, 0)); grip_end[ax] = lo[ax]
    top = Vector((0, 0, 0)); top[ax] = lo[ax] + ext[ax] * 0.92
    bend = Vector((0, 0, 0)); bend[ax] = -ext[ax] * 0.38; bend[side] = ext[ax] * 0.2
    bm = bmesh.new()

    def cyl(p0, p1, r, mat_index):
        d = p1 - p0
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        m = Matrix.Translation((p0 + p1) / 2) @ rot
        res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=8, radius1=r, radius2=r, depth=d.length, matrix=m)
        for f in {f for v in res['verts'] for f in v.link_faces}:
            f.material_index = mat_index
    cyl(grip_end, top, 0.045, 0)                                   # the handle (the staff)
    cyl(top, top + bend, 0.065, 1)                                 # the swipple, swung out on its thong
    cyl(top - (top - grip_end) * 0.03, top + (top - grip_end) * 0.03, 0.06, 2)   # the leather cap and thong
    me = bpy.data.meshes.new('flail'); bm.to_mesh(me); bm.free()
    for name, col in (('flail_handle', '#8c6430'), ('flail_swipple', '#62401e'), ('flail_thong', '#3e2612')):
        mat = bpy.data.materials.new(name); mat.diffuse_color = hexrgb(col) + [1]
        me.materials.append(mat)
    fl = bpy.data.objects.new('Flail', me)
    scene.collection.objects.link(fl)
    fl.parent = axe.parent; fl.parent_type = axe.parent_type; fl.parent_bone = axe.parent_bone
    fl.matrix_parent_inverse = axe.matrix_parent_inverse.copy(); fl.matrix_basis = axe.matrix_basis.copy()
    axe.hide_render = True

# ------------------------------------------------------------------ actions
def use_action(name):
    act = bpy.data.actions[name]
    ad = arm.animation_data or arm.animation_data_create()
    for t in ad.nla_tracks:
        t.mute = True
    ad.action = act
    if hasattr(ad, 'action_slot') and getattr(act, 'slots', None) and len(act.slots):
        ad.action_slot = act.slots[0]
    return act


# ------------------------------------------------------------------ size and ground: scale non-KayKit models to their squares, feet on z = 0
use_action(F['anims']['idle'])
scene.frame_set(int(bpy.data.actions[F['anims']['idle']].frame_range[0]))
bpy.context.view_layer.update()


def world_bbox(names=None):
    pts = []
    dg = bpy.context.evaluated_depsgraph_get()
    for o in bpy.data.objects:
        if o.type == 'MESH' and not o.hide_render and (not names or o.name in names):
            oe = o.evaluated_get(dg)
            me = oe.to_mesh()
            pts += [oe.matrix_world @ v.co for v in me.vertices]
            oe.to_mesh_clear()
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


# `size_by`: the meshes whose span is the creature's size and whose middle is its foot (the roper's cone, 10-01e: not the tendrils
# coiled about it, which would shrink it to fit them and set it off its square)
if F.get('size_squares'):
    lo, hi = world_bbox(F.get('size_by'))
    s = F['size_squares'] * UNITS_PER_SQUARE / max(hi.x - lo.x, hi.y - lo.y)
    arm.scale = arm.scale * s
    bpy.context.view_layer.update()
lo, hi = world_bbox(F.get('size_by'))
cx, cy = (lo.x + hi.x) / 2, (lo.y + hi.y) / 2
if F.get('size_squares'):   # centre a big creature on its footprint; a humanoid keeps its own origin at its feet
    arm.location.x -= cx; arm.location.y -= cy
arm.location.z -= lo.z
bpy.context.view_layer.update()

# ------------------------------------------------------------------ props: loose meshes (a KayKit weapon .gltf) hung on a bone of the model, the way the Adventurers carry theirs
# props: [{file, bone, offset, rot, scale}] -- offset/rot default to what the Knight's 1H_Sword and Round_Shield sit at on handslot.r / handslot.l
PROP_DEFAULT = {'handslot.r': ([0, -0.079, 0], [90, 0, 180]), 'handslot.l': ([0, -0.095, 0.156], [-90, 0, 0])}
for P in F.get('props', []):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, P['file']))
    d_off, d_rot = PROP_DEFAULT.get(P['bone'], ([0, 0, 0], [0, 0, 0]))
    off = Vector(P.get('offset', d_off)); rot = [math.radians(a) for a in P.get('rot', d_rot)]; ps = P.get('scale', 1.0)
    for o in [o for o in bpy.data.objects if o not in before]:
        if o.type != 'MESH':
            continue
        o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = P['bone']
        o.matrix_parent_inverse = Matrix.Identity(4)
        o.matrix_basis = Matrix.Translation(off) @ Euler(rot, 'XYZ').to_matrix().to_4x4() @ Matrix.Scale(ps, 4)
        o.hide_render = False
        print('[render] prop %s on %s' % (o.name, P['bone']))
bpy.context.view_layer.update()

# ------------------------------------------------------------------ a rider: a second model mounted on a bone of the first (the drider: a drow's upper half on the spider)
R = F.get('rider')
if R:
    before = set(bpy.data.objects) | set()
    imgs_before = all_images()
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, R['file']))
    new = [o for o in bpy.data.objects if o not in before]
    rarm = next(o for o in new if o.type == 'ARMATURE' and o.parent is None)
    for o in new:
        if o.type == 'MESH':
            o.hide_render = o.name not in R['show']
    if R.get('recolor'):
        recolor(all_images() - imgs_before, R['recolor'])
    def rider_action(anim):    # R['anim'] is one action name, or {main-anim: action} with 'idle' the fallback
        ra = R['anim']
        name = ra if isinstance(ra, str) else ra.get(anim, ra.get('idle'))
        ract = bpy.data.actions[name]
        rad = rarm.animation_data or rarm.animation_data_create()
        rad.action = ract
        if hasattr(rad, 'action_slot') and getattr(ract, 'slots', None) and len(ract.slots):
            rad.action_slot = ract.slots[0]
    rider_action('idle')
    # mount: a point in the first armature's rest space (its units, before its scale), carried by the named bone
    scene.frame_set(int(bpy.data.actions[F['anims']['idle']].frame_range[0]))
    bpy.context.view_layer.update()
    mount_world = arm.matrix_world @ Vector(R['mount'])
    rarm.parent = arm; rarm.parent_type = 'BONE'; rarm.parent_bone = R['bone']
    rarm.matrix_parent_inverse = Matrix.Identity(4)
    bpy.context.view_layer.update()
    rs = R.get('scale', 1.0)
    rarm.matrix_world = Matrix.Translation(mount_world) @ Matrix.Rotation(math.radians(R.get('yaw', 0)), 4, 'Z') @ Matrix.Scale(rs, 4)
    bpy.context.view_layer.update()
    print('[render] rider %s mounted on %s at %s' % (R['file'], R['bone'], [round(v, 2) for v in mount_world]))
lo, hi = world_bbox()
height_px = (hi.z - lo.z) * K * math.cos(math.radians(30))
span_px = max(hi.x - lo.x, hi.y - lo.y) * K
print('[render] %s height %.2f units = %.0f px upright, span %.0f px' % (FIG, hi.z - lo.z, height_px, span_px))

# ------------------------------------------------------------------ frame, camera, look
FW = F.get('frame', [96, 96])[0]
FH = F.get('frame', [96, 96])[1]
if F.get('size_squares'):
    FW, FH = max(FW, int(span_px * 1.25) // 2 * 2 + 8), max(FH, int(span_px * 0.75 + height_px) // 2 * 2 + 16)
AX, AY = FW // 2, FH - (FH // 5 if F.get('size_squares') else 12)
cam_d = bpy.data.cameras.new('iso'); cam_d.type = 'ORTHO'
cam_d.ortho_scale = max(FW, FH) / K
cam = bpy.data.objects.new('iso', cam_d); scene.collection.objects.link(cam); scene.camera = cam
cam.rotation_euler = (math.radians(60), 0, math.radians(45))
back = Vector((math.sin(math.radians(60)) * math.sin(math.radians(45)), -math.sin(math.radians(60)) * math.cos(math.radians(45)), math.cos(math.radians(60))))
up = Vector((-0.5 * math.sin(math.radians(45)), 0.5 * math.cos(math.radians(45)), math.sin(math.radians(60))))
cam.location = back * 40 + up * ((AY - FH / 2) / K)
cam_d.clip_end = 200
if FW != FH:   # ortho_scale covers the larger side; the render's aspect does the rest
    pass

r = scene.render
r.engine = 'BLENDER_WORKBENCH'
# pipeline 1b (10-01d, deep16/blender-monsters.md): a figure whose `look` is "toon:<preset>" keeps its own cel material and is lit in
# EEVEE by tools/blender_look.py's suns; `floor`: a holdout floor at z 0 that hides what sinks into it (the xorn's Earth Glide)
TOON = (F.get('look') or '').startswith('toon')
if TOON or F.get('floor'):
    import importlib.util
    _sp = importlib.util.spec_from_file_location('blender_look', os.path.join(ROOT, 'tools', 'blender_look.py'))
    BLK = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(BLK)
    if F.get('floor'):
        BLK.holdout_floor(scene)
r.resolution_x, r.resolution_y, r.resolution_percentage = FW * SS, FH * SS, 100
r.film_transparent = True
r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'
sh = scene.display.shading
LOOK = os.environ.get('D16_LOOK', CFG.get('look', 'studio:Default'))   # studio:<name> | matcap:<name> | flat
kind, _, lname = LOOK.partition(':')
sh.light = {'studio': 'STUDIO', 'matcap': 'MATCAP', 'flat': 'FLAT'}[kind]
if kind == 'studio': sh.studio_light = lname
if kind == 'matcap': sh.studio_light = lname
sh.color_type = 'MATERIAL' if (F.get('tint') and not F.get('rider')) else 'TEXTURE'
sh.show_cavity = F.get('cavity', True); sh.cavity_type = 'BOTH'
sh.cavity_ridge_factor = 1.2; sh.cavity_valley_factor = 1.0
sh.show_specular_highlight = False
sh.show_shadows = False
scene.display.render_aa = '8'
if TOON:
    BLK.light(scene, cam, F['look'].split(':', 1)[1] if ':' in F['look'] else '12')

# ------------------------------------------------------------------ render every facing of every anim
out = os.path.join(SRC, os.environ.get('D16_OUT', 'render'), FIG)
ONLY = os.environ.get('D16_ONLY')    # e.g. "idle:0,7" for a quick look test
meta = {'figure': FIG, 'ss': SS, 'fw': FW, 'fh': FH, 'ax': AX, 'ay': AY, 'height_px': round(height_px), 'anims': {}}
base_yaw = math.radians(F.get('yaw', 0))
rot0 = arm.rotation_euler.copy() if arm.rotation_mode != 'QUATERNION' else None
arm.rotation_mode = 'XYZ'


def sample_t(f0, f1, n, once, i):
    return f0 + (f1 - f0) * i / ((n - 1) if once and n > 1 else n)


# `fit` (10-01e, the roper): each row gets its own frame, as tight as what it does over its frames and its eight facings, the foot kept in
# the middle across -- a lash that reaches two squares does not make the idle's frame (and the sheet's every row) that wide.
# tools/pixelate.py p1 carries the sizes into the sheet, and deep16/js/sprites.js reads a row's own fw/fh/ax/ay.
FIT, PAD = bool(F.get('fit')), 5


def fit_box(action, n, once):
    import numpy as np
    act = use_action(action); f0, f1 = act.frame_range
    R3 = cam.matrix_world.to_3x3()
    rv, uv = np.array((R3 @ Vector((1, 0, 0)))[:]), np.array((R3 @ Vector((0, 1, 0)))[:])
    x0 = y0 = 1e9; x1 = y1 = -1e9
    for facing in range(8):
        arm.rotation_euler.z = base_yaw + math.radians(45 - 45 * facing)
        for i in range(n):
            t = sample_t(f0, f1, n, once, i); scene.frame_set(int(t), subframe=t - int(t))
            dg = bpy.context.evaluated_depsgraph_get()
            for o in bpy.data.objects:
                if o.type != 'MESH' or o.hide_render or o.name not in F['show']:     # (not the holdout floor: it is 200 units across)
                    continue
                oe = o.evaluated_get(dg); me = oe.to_mesh()
                a = np.zeros(len(me.vertices) * 3); me.vertices.foreach_get('co', a); oe.to_mesh_clear()
                M = np.array(oe.matrix_world); w = a.reshape(-1, 3)[::3] @ M[:3, :3].T + M[:3, 3]
                w = w[w[:, 2] > -0.02] if F.get('floor') else w          # (what is under a holdout floor is not drawn)
                if not len(w):
                    continue
                sx, sy = w @ rv * K, w @ uv * K
                x0, x1, y0, y1 = min(x0, sx.min()), max(x1, sx.max()), min(y0, sy.min()), max(y1, sy.max())
    half = math.ceil(max(-x0, x1) + PAD)
    fw, fh = 2 * half, int(math.ceil(y1 - y0 + 2 * PAD)) // 2 * 2 + 2
    return fw, fh, half, int(math.ceil(y1 + PAD))


def frame_for(fw, fh, ax, ay):
    cam_d.ortho_scale = max(fw, fh) / K
    cam.location = back * 40 + up * ((ay - fh / 2) / K)
    r.resolution_x, r.resolution_y = fw * SS, fh * SS
    bpy.context.view_layer.update()


if FIT:
    idle_n = (F.get('frames') or {}).get('idle', NFRAMES)
    meta['fw'], meta['fh'], meta['ax'], meta['ay'] = fit_box(F['anims']['idle'], idle_n, False)
for anim, action in F['anims'].items():
    if ONLY and anim != ONLY.split(':')[0]:
        continue
    n = (F.get('frames') or {}).get(anim, NFRAMES)    # (a row's own count, and a row played once is sampled to its last frame: 10-01d)
    once = anim in (F.get('once') or [])
    meta['anims'][anim] = {'action': action, 'frames': n}
    if FIT:
        box = fit_box(action, n, once); frame_for(*box)
        meta['anims'][anim].update(dict(zip(('fw', 'fh', 'ax', 'ay'), box)))
        print('[render] %s %s: its frame %dx%d, foot %d,%d' % ((FIG, anim) + box))
    act = use_action(action)
    if R:
        rider_action(anim)
    f0, f1 = act.frame_range
    os.makedirs(os.path.join(out, anim), exist_ok=True)
    for facing in range(8):
        if ONLY and str(facing) not in ONLY.split(':')[1].split(','):
            continue
        arm.rotation_euler.z = base_yaw + math.radians(45 - 45 * facing)
        for i in range(n):
            t = sample_t(f0, f1, n, once, i)
            scene.frame_set(int(t), subframe=t - int(t))
            r.filepath = os.path.join(out, anim, 'f%d_%02d.png' % (facing, i))
            bpy.ops.render.render(write_still=True)
    print('[render] %s %s done' % (FIG, anim))
# a render of some rows only (D16_ONLY) keeps the other rows the folder already has: it wrote meta.json with its one row and the
# next pixelate pass dropped the rest of the sheet (twice on the xorn, 10-01d)
mp = os.path.join(out, 'meta.json')
if ONLY and os.path.exists(mp):
    old = json.load(open(mp))
    if (old.get('fw'), old.get('fh')) == (meta['fw'], meta['fh']):
        old['anims'].update(meta['anims']); meta['anims'] = old['anims']
json.dump(meta, open(mp, 'w'), indent=1)
print('[render] %s ok %dx%d anchor %d,%d' % (FIG, meta['fw'], meta['fh'], meta['ax'], meta['ay']))

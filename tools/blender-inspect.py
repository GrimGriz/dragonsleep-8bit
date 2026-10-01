"""What is in a downloaded model file: objects, their transforms, mesh sizes (and evaluated, with modifiers), modifiers, armatures, actions.
Step 3 of pipeline 1b (deep16/blender-monsters.md). Always with --disable-autoexec: a .blend can carry scripts.

    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --disable-autoexec <model.blend> --python tools/blender-inspect.py
    & "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python tools/blender-inspect.py -- <model.stl|.obj|.glb|.fbx>
"""
import bpy, sys, os

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if argv:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    p = argv[0]; ext = os.path.splitext(p)[1].lower()
    if ext == '.stl':
        bpy.ops.wm.stl_import(filepath=p)
    elif ext == '.obj':
        bpy.ops.wm.obj_import(filepath=p)
    elif ext in ('.glb', '.gltf'):
        bpy.ops.import_scene.gltf(filepath=p)
    elif ext == '.fbx':
        bpy.ops.import_scene.fbx(filepath=p)
dg = bpy.context.evaluated_depsgraph_get()
print('[inspect] units', bpy.context.scene.unit_settings.system)
for o in bpy.data.objects:
    print('[inspect] %r %s parent=%s loc=%s scale=%s dims=%s' % (o.name, o.type, o.parent.name if o.parent else None,
          tuple(round(v, 3) for v in o.location), tuple(round(v, 3) for v in o.scale), tuple(round(v, 2) for v in o.dimensions)))
    if o.type == 'MESH':
        ev = o.evaluated_get(dg).to_mesh()
        print('[inspect]     mesh: %d verts %d faces; evaluated %d verts %d faces; groups %d; colour attrs %s; materials %s' % (
            len(o.data.vertices), len(o.data.polygons), len(ev.vertices), len(ev.polygons), len(o.vertex_groups),
            [a.name for a in o.data.color_attributes], [m.name if m else None for m in o.data.materials]))
        o.evaluated_get(dg).to_mesh_clear()
        for m in o.modifiers:
            print('[inspect]     modifier %r %s' % (m.name, m.type))
    if o.type == 'ARMATURE':
        print('[inspect]     bones %d: %s' % (len(o.data.bones), [b.name for b in o.data.bones][:40]))
for a in bpy.data.actions:
    print('[inspect] action %r frames %s' % (a.name, tuple(a.frame_range)))

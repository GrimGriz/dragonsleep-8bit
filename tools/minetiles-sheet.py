"""DEEP16 pipeline 2 (generated art): the Guano Mine's top levels' tiles -- the art desk's ART-112 (four HEADs), cut into minetiles_p1 by the machinery
of tools/toptiles-sheet.py (read its head: the grounds, the faces, the props, the edges by a dual grid).

    python tools/minetiles-sheet.py          (`check` also writes dev/visions/minetiles_p1-check.png)

Sources (gitignored): deep16/_src/minetiles/ART-112/ (six pages and MANIFEST.json); its papers in _src/art-desk/received-2026-10-22-ART-112/. Asked in
deep16-art-wanted.md section 21's second block (THE GUANO MINE'S TOP LEVELS), on Griz's "giant brown blur, really" of the working gallery among the rest.

The camps outside the mouths stand on Silverton's earth, road and grass (toptiles_p1); the river's banks here are measured against Silverton's earth.
"""
import os, sys
import importlib.util
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('toptiles', os.path.join(ROOT, 'tools', 'toptiles-sheet.py'))
TT = importlib.util.module_from_spec(spec); spec.loader.exec_module(TT)
T = TT.T


def mine(check=False):
    M = TT.manifest('minetiles', 'ART-112')
    A = TT.Atlas(1152)
    tiles = {}
    def ground(name, mid, **kw):
        tiles[mid] = TT.cut_ground(M[mid], **kw)
        A.add(name, tiles[mid], T // 2, T)
    # HEAD 1: the cave's grounds, four a kind; the rails one a way (js/topview.js turns the bend and the end); the pit and the stair down
    for kind in ('cave_floor', 'guano', 'deep_guano', 'gravel', 'bones', 'old_webbing', 'fungus_bed', 'pit', 'stair_down', 'rock_top'):
        for i in range(4): ground(kind, '%s_%d' % (kind, i + 1))
        if kind in ('fungus_bed', 'rock_top'): A.newrow()
    for k in ('rails_ns', 'rails_ew', 'rails_bend_n_e', 'rails_end_s'): ground(k, k)
    for i in range(2): ground('river_frame', 'river_frame_%d' % (i + 1))
    A.newrow()
    # the edges: guano's crust against the cave floor, the deep guano against the crust; the camps' river against Silverton's earth
    dual = {}
    for key, fg, bg, pre in (('guano', 'guano', 'cave_floor', 'guano_'), ('deep', 'deep_guano', 'guano', 'deep_guano_')):
        names = [k for k in M if k.startswith(pre) and any(s in k for s in ('_edge_', '_outer_', '_inner_'))]
        for k in names: ground(key + '_edge', k)
        tab, q = TT.dual_table(tiles, names, ['%s_%d' % (fg, i + 1) for i in range(4)], ['%s_%d' % (bg, i + 1) for i in range(4)])
        TT.report_dual(key, tab, q)
        dual[key] = {'fg': fg, 'bg': bg, 'mask': {str(mk): A.tiles[key + '_edge'][names.index(t[0])][:4] for mk, t in tab.items()}}
        A.newrow()
    S = TT.manifest('toptiles', 'ART-111')
    for i in range(4): tiles['earth_%d' % i] = TT.cut_ground(S['earth_v%d' % (i + 1)])
    names = ['river_bank_n', 'river_bank_s', 'river_end_w', 'river_end_e']
    for k in names: ground('mriver_edge', k)
    tab, q = TT.dual_table(tiles, names, ['river_frame_1', 'river_frame_2'], ['earth_%d' % i for i in range(4)], tone=False)   # (the banks keep their stones)
    TT.report_dual('mriver', tab, q)
    dual['mriver'] = {'fg': 'river_frame', 'bg': 'earth', 'mask': {str(mk): A.tiles['mriver_edge'][names.index(t[0])][:4] for mk, t in tab.items()}}
    for k in ('bridge_w_end', 'bridge_middle', 'bridge_e_end'): ground(k, k)
    A.newrow()
    # HEAD 2: the rock's faces, a tile and a third tall (js/topview.js TV.CLIFF); the ladder laid down a slope and the slide's head as grounds
    for k in ('cliff_left', 'cliff_middle', 'cliff_right', 'shored_face', 'mine_door', 'outside_mouth', 'rune_wall', 'chimney', 'ladder_up'):
        A.add(k, TT.cut_ground(M[k], w=T, h=64, shave=1), T // 2, 64)
    A.newrow()
    ground('ladder_slope', 'ladder_slope'); ground('slide_head', 'slide_head')
    # HEAD 3: the camps' standing things (each with the earth it stands on baked under it: drawn whole on its square); the bunkhouse's face
    for k in ('stockade_ew', 'stockade_ns', 'stockade_corner', 'stockade_gate'): ground(k, k, shave=1)
    A.newrow()
    for k, wpx in (('milking_cradle', 46), ('smoke_rack', 46), ('guano_sledge', 44), ('weigh_beam', 46), ('the_board', 46)):
        img, _ = TT.cut_prop(M[k], width=wpx); A.add(k, img, img.shape[1] // 2, img.shape[0])
    for k in ('bunkhouse_wall', 'bunkhouse_door'): A.add(k, TT.cut_ground(M[k], w=T, h=48, shave=1), T // 2, T)
    A.newrow()
    # HEAD 4: the mine's props (the lit and unlit lanterns laid the same: the same width a pair)
    for k, wpx in (('lantern_post_lit', 30), ('lantern_post_unlit', 30), ('wall_lantern_lit', 22), ('wall_lantern_unlit', 22), ('crate', 36),
                   ('iron_banded_chest', 36), ('mine_cart', 44), ('guano_sacks', 40), ('pick_and_shovel', 30), ('shoring_post', 40), ('crew_bunk', 44),
                   ('water_barrel', 30)):
        img, _ = TT.cut_prop(M[k], width=wpx); A.add(k, img, img.shape[1] // 2, img.shape[0])
    A.write('minetiles_p1', 'deep16/_src/minetiles/ART-112/ (the art desk\'s ART-112, 10-22: the Guano Mine\'s top levels top-down, four HEADs), cut by tools/minetiles-sheet.py',
            {'dual': dual, 'door': 'roam:galleries_g2'}, check)


if __name__ == '__main__':
    mine('check' in sys.argv[1:])

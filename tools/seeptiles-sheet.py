"""DEEP16 pipeline 2 (generated art): the Glowseep's tiles -- the art desk's ART-113 (two HEADs), cut into seeptiles_p1 by the machinery of
tools/toptiles-sheet.py (read its head: the grounds, the props, the edges by a dual grid).

    python tools/seeptiles-sheet.py          (`check` also writes dev/visions/seeptiles_p1-check.png)

Sources (gitignored): deep16/_src/seeptiles/ART-113/ (four pages and MANIFEST.json); its papers in _src/art-desk/received-2026-10-22-ART-113/. Asked in
deep16-art-wanted.md section 21's third block (THE GLOWSEEP), on Griz's "i meant glowseep, not wet".

The still pool and the drain were drawn with their banks painted in (the art desk's notes): tiled, they would be a grid of little pools, so their fills
(`still_pool_fill`, `drain_fill`) are cut from the water in their inner corners' tiles instead, and the drawn frames are kept beside them.

The moss by night is its own tile, not a tint (js/topview.js takes it when js/mines.js lays the floor for the night). The fire's four frames and its embers
are props laid on one foot: each frame's stone ring at the same place, so the ring stands still and only the flame moves.
"""
import os, sys
import importlib.util
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('toptiles', os.path.join(ROOT, 'tools', 'toptiles-sheet.py'))
TT = importlib.util.module_from_spec(spec); spec.loader.exec_module(TT)
T = TT.T


def seep(check=False):
    M = TT.manifest('seeptiles', 'ART-113')
    A = TT.Atlas(1152)
    tiles = {}
    def ground(name, mid, **kw):
        tiles[mid] = TT.cut_ground(M[mid], **kw)
        A.add(name, tiles[mid], T // 2, T)
    # HEAD 1: the bog's grounds, four a kind (the waters two frames); the crossings
    for kind in ('mud', 'reeds', 'tussock', 'moss_day', 'moss_night'):
        for i in range(4): ground(kind, '%s_v%d' % (kind, i + 1))
        if kind == 'tussock': A.newrow()
    A.newrow()
    for kind in ('still_pool', 'drain'):
        for i in range(2): ground(kind, '%s_f%d' % (kind, i + 1))
    for k in ('stepping_stones', 'log_causeway_EW', 'log_causeway_NS', 'log_causeway_bend_NE'): ground(k, k)
    A.newrow()
    # the edges: the mud against the tussock grass; the still pool's and the drain's banks against the mud
    dual = {}
    for key, fg, bg, pre in (('mudgrass', 'mud', 'tussock', 'mud_grass_'), ('pool', 'still_pool', 'mud', 'pool_mud_'), ('drain', 'drain', 'mud', 'drain_mud_')):
        names = [k for k in M if k.startswith(pre) and any(s in k for s in ('_edge_', '_outer_', '_inner_'))]
        for k in names: ground(key + '_edge', k)
        fgf = [k for k in M if k.startswith(fg + '_v') or k.startswith(fg + '_f')]
        bgf = [k for k in M if k.startswith(bg + '_v') or k.startswith(bg + '_f')]
        tab, q = TT.dual_table(tiles, names, fgf, bgf, tone=key == 'mudgrass')   # (the pools' and the drain's banks keep their lips)
        TT.report_dual(key, tab, q)
        dual[key] = {'fg': fg, 'bg': bg, 'mask': {str(mk): A.tiles[key + '_edge'][names.index(t[0])][:4] for mk, t in tab.items()}}
        if key in ('pool', 'drain'):
            for img in TT.corner_fills(M, tab): A.add(fg + '_fill', img, T // 2, T)
        A.newrow()
    # HEAD 2: the camp's things
    img, _ = TT.cut_prop(M['tent_open'], width=92); A.add('tent_open', img, img.shape[1] // 2, img.shape[0])
    fire = [TT.cut_prop(M['campfire_f%d' % (i + 1)], scale=None, width=40) for i in range(4)] + [TT.cut_prop(M['campfire_embers'], width=40)]
    sc = fire[0][1]                                                  # (one scale for the five: the first frame's ring 40 px across)
    fire = [TT.cut_prop(M[k], scale=sc)[0] for k in ['campfire_f%d' % (i + 1) for i in range(4)] + ['campfire_embers']]
    hmax = max(f.shape[0] for f in fire)
    for i, f in enumerate(fire):                                     # (each on one foot: its bottom row and its middle across)
        A.add('campfire' if i < 4 else 'campfire_embers', f, f.shape[1] // 2, f.shape[0])
    for k, wpx in (('light_pole_lit', 26), ('moss_pole_hook', 26), ('offering_stump', 38), ('bedroll', 40), ('moss_basket', 30),
                   ('duckboards_straight_NS', 40), ('duckboards_corner_NE', 40)):
        img, _ = TT.cut_prop(M[k], width=wpx); A.add(k, img, img.shape[1] // 2, img.shape[0])
    A.write('seeptiles_p1', 'deep16/_src/seeptiles/ART-113/ (the art desk\'s ART-113, 10-22: the Glowseep top-down, two HEADs), cut by tools/seeptiles-sheet.py',
            {'dual': dual, 'door': 'roam:glowseep'}, check)


if __name__ == '__main__':
    seep('check' in sys.argv[1:])

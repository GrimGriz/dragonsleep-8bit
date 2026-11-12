"""DEEP16 pipeline 2 (generated art): the garrison's gate watch fighting -- a bare-headed dwarf in mail with a leaf-headed spear -> gatewatch_p2, all eight facings.

    python tools/gatewatch-fight-sheet.py            (writes deep16/art/gatewatch_p2.png/.json)
    python tools/gatewatch-fight-sheet.py check      (also the review sheet: every row of every facing at 3x)

Cut 11-12 by the Ingrith cutter on the lanes desk's relay of Griz's "Tried to get usable dwarf combat art out of the dept, its in Fresh". The art desk's
ART-141-GATE-WATCH-COMBAT, sorted out of Fresh to deep16/_src/gatewatch-combat/: the generic dwarf's gate watch (pt_dwarf `gatewatch`, the lantern set down and
the cloak shed), five views (SE, S, E, rear NE, N), a page an action -- Idle 4, Walk 8, Attack 8 (the spear set: thrusts on 3 and 5, overhead on 4, guard on 8),
Flinch 4, Fall 6 (the spear let go beside him), Prone 1 (Fall 6's pose). Its FRAME-MAP.json gives each frame a `window_xyxy` and an `engine_index`.

The cut is tools/vivian-sheet.py's, as Katarina's fight sheet (tools/katarina-sheet.py): `trim` (a neighbour's spear tip reaching into a window goes), the idle
page by its idle's median to TALL -- the art desk's 42 crown to boot against the old trooper's 44 -- every other page matched to its view's Idle 1, the Fall scaled as
the Attack and lying on its whole body from frame 4, the Prone matched to Fall 6 by width; a taller cell than the town figures' for the spear overhead. SW W NW the
mirrors of SE E NE (RULED 10-14). Rows: idle 4, walk 8, attack 8 (`release` 2: the first thrust lands on frame 3), flinch 4, hurt 6 (the Fall), prone 1.
Worn by the garrison's troopers (deep16/data/foes.js trooper, trooperxbow) in place of trooper_p0; the drill-sergeant keeps his own.
"""
import importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)
VS.FH, VS.AY = 80, 74          # (the spear overhead on Attack 4 stands well over the crown)

SRC = 'gatewatch-combat'
ROW = {'Idle': 'idle', 'Walk': 'walk', 'Attack': 'attack', 'Flinch': 'flinch', 'Fall': 'hurt', 'Prone': 'prone'}
N = {'idle': 4, 'walk': 8, 'attack': 8, 'flinch': 4, 'hurt': 6, 'prone': 1}


def frame_windows():
    fm = json.load(open(os.path.join(VS.pix.SRC, SRC, 'FRAME-MAP.json'), encoding='utf-8'))
    out = []
    for pg in fm['pages']:
        row = ROW[pg['action']]
        idx = [f['engine_index'] for f in pg['frames']]
        assert idx == list(range(N[row])), (pg['source'], idx)                     # (every number once, none skipped)
        for f in pg['frames']:
            out.append(('', pg['facing'], row, f['engine_index'], pg['source'], tuple(f['window_xyxy'])))
    return out


VS.LOOKS['gatewatch_p2'] = dict(
    src=SRC, windows=frame_windows() if os.path.isdir(os.path.join(VS.pix.SRC, SRC)) else [], trim=True, tall=42, avoid=['fire'], name='Gate watch',
    rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    match={'walk': ('idle', 0), 'attack': ('idle', 0), 'flinch': ('idle', 0, 3), 'prone': ('hurt', 5, 0, 'w')},
    scaleas={'hurt': 'attack'}, ground={('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)}, release={'attack': 2},
    hold=['attack: SE\'s first reach shallower than its second; in rear NE and E the forward hand and shaft overlap the far hand at full reach; N\'s overhead close to its thrust (the art desk\'s own notes)',
          'walk: some in-between poses alike, the lead change at 1 and 5 subtle in the profile and diagonal walks (the art desk\'s own note)',
          'N: Flinch and Fall begin with the spear steeper than its Idle (the art desk\'s own note)'],
    source='drawn by the art desk (ART-141-GATE-WATCH-COMBAT, 11-12: the generic dwarf\'s gate watch in five views), cut by tools/gatewatch-fight-sheet.py over '
           'tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    VS.cut('gatewatch_p2')

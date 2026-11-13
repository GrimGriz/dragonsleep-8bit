"""DEEP16 pipeline 2 (generated art): Solskaft's garrison trooper fighting with battleaxe and shield -> trooper_p2, all eight facings, with a `throw` row.

    python tools/trooper-fight-sheet.py            (writes deep16/art/trooper_p2.png/.json)
    python tools/trooper-fight-sheet.py check      (also the review sheet: every row of every facing at 3x)

Asked in art-wanted section 55, block 2 (11-12, the lanes desk, on his word: "go on the level and kit for pyros folk, with an art request first to fix this
portrait (that better not be a battle axe, let's hope not and request one) - and then the combat posings we'll need"); cut 11-13 by the garrison cutter on
the lanes desk's relay. The art desk's ART-142-TROOPER-COMBAT, sorted out of Fresh to deep16/_src/ART-142-TROOPER-COMBAT/ (the zip beside it): the generic
dwarf in the trooper's kit -- the steel cap, the coat of mail, the round shield on the left arm, the bearded battleaxe in the right, two throwing axes at the
belt -- five views (S, SE, E, rear NE, N), a page an action: Idle 4, Walk 8, Attack 8 (drawn over the mannequin's GUIDE-2026-11-12-battleaxe-and-shield,
its six beats on 1-6, the recovery on 7, the guard on 8; the blade lands on frame 4), Throw 6 (over GUIDE-2026-11-12-handaxe-throw: a throwing axe overhand,
released on frame 4, the hand empty on 5 and 6, the battleaxe hung from its wrist loop), Flinch 4, Fall 6, Prone 1 (Fall 6 lifted out). Its FRAME-MAP.json
gives each frame a `window_xyxy` and an `engine_index`, the gate watch's shape.

The cut is tools/gatewatch-fight-sheet.py's (tools/vivian-sheet.py, as Katarina's fight sheet): `trim`, the idle page by its idle's median to TALL -- the
art desk's 42 crown to boot, the gate watch's -- every other page matched to its view's Idle 1, the Fall scaled as the Attack and lying from frame 4, the
Prone matched to Fall 6 by width; a tall cell for the axe raised over the head. SW W NW the mirrors of SE E NE (RULED 10-14). Rows: idle 4, walk 8,
attack 8 (`release` 3: the house's frame 4), throw 6 (`release` 3), flinch 4, hurt 6 (the Fall), prone 1.
Worn by the Trooper and, till it has art of its own, the File Leader (deep16/data/foes.js trooper, fileleader; their Thrown Handaxe names `row: 'throw'`);
the crossbow Trooper takes this sheet's flinch, fall and prone (tools/trooperxbow-fight-sheet.py). The gate watch keeps gatewatch_p2.
"""
import importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)
VS.FH, VS.AY = 80, 74          # (the battleaxe raised over the cap on Attack 2-3 and the throwing axe drawn back on Throw 2-3)

SRC = 'ART-142-TROOPER-COMBAT'
ROW = {'Idle': 'idle', 'Walk': 'walk', 'Attack': 'attack', 'Throw': 'throw', 'Flinch': 'flinch', 'Fall': 'hurt', 'Prone': 'prone'}
N = {'idle': 4, 'walk': 8, 'attack': 8, 'throw': 6, 'flinch': 4, 'hurt': 6, 'prone': 1}


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


VS.LOOKS['trooper_p2'] = dict(
    src=SRC, windows=frame_windows() if os.path.isdir(os.path.join(VS.pix.SRC, SRC)) else [], trim=True, tall=42, avoid=['fire'], name='Trooper',
    rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('throw', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    match={'walk': ('idle', 0), 'attack': ('idle', 0), 'throw': ('idle', 0), 'flinch': ('idle', 0, 3), 'prone': ('hurt', 5, 0, 'w')},
    scaleas={'hurt': 'attack'}, ground={('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)}, release={'attack': 3, 'throw': 3},
    hold=["throw: some wrist loops pass behind the arm or belt, and the release hand overlaps the small axe in projection (the art desk's own note)",
          "attack: the mannequin's guard holds the axe higher than the low combat Idle -- the Idle to Attack and Attack to Idle joins (the art desk's own note); passing steps close in the rear walks"],
    source="drawn by the art desk (ART-142-TROOPER-COMBAT, 11-12: art-wanted section 55 block 2, the garrison trooper with battleaxe and shield in five views, "
           "the Attack and Throw over the mannequin's guides), cut by tools/trooper-fight-sheet.py over tools/vivian-sheet.py; SW W NW mirrored")

if __name__ == '__main__':
    VS.cut('trooper_p2')

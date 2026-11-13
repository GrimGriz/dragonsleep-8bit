"""DEEP16 pipeline 2 (generated art): Solskaft's road patrol -- the Dwarf Scout, in leather with a shortsword and a longbow -> roadpatrol_p2, all eight facings.

    python tools/roadpatrol-fight-sheet.py            (writes deep16/art/roadpatrol_p2.png/.json)
    python tools/roadpatrol-fight-sheet.py check      (also the review sheet: every row of every facing at 3x)

Asked in art-wanted section 56, block 2 (11-12, the lanes desk, on his word, "ask follow up, does also have melee weapon?"); cut 11-13 by the garrison cutter
on the lanes desk's relay of Griz's "scout is in fresh, says it 'superceded' checkpoint so might have some better than current". The art desk's
SOLSKAFT-ROAD-PATROL-COMBAT, sorted out of Fresh to deep16/_src/SOLSKAFT-ROAD-PATROL-COMBAT/ (the zip beside it): five views (S, SE, E, rear NE, N), a page an
action -- Idle 4, Walk 8, Attack 8 (the shortsword stab over the mannequin's GUIDE-2026-11-12-shortsword-stab, its six beats on 1-6, recovery and guard on 7
and 8, the thrust on frame 4), Shoot 6 (over GUIDE-2026-11-12-longbow-shot, the bow in the left hand, loosed on frame 4), Flinch 4, Fall 6, Prone 1 (Fall 6
lifted out). The "checkpoint" its notes supersede is the art desk's own earlier drafts of these pages (South's sword hand and bow shot, North's right-hand
continuity): the zip carries only the superseding pages, one a row.

The cut is tools/trooper-fight-sheet.py's (tools/vivian-sheet.py): `trim`, the idle page by its idle's median to 42 (the art desk's "set final scale from head
to boots"), every other page matched to its view's Idle 1, the Fall scaled as the Attack, the Prone to Fall 6 by width; the tall cell for the longbow's upper
tip. SW W NW the mirrors of SE E NE (RULED 10-14). Rows: idle 4, walk 8, attack 8 (`release` 3), shoot 6 (`release` 3), flinch 4, hurt 6 (the Fall), prone 1.
Worn by the Road Patrol (deep16/data/foes.js roadpatrol, in place of trooper_p0; its Shortsword plays `attack`, its Longbow names `row: 'shoot'`).
"""
import importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)
VS.FH, VS.AY = 80, 74          # (the longbow's upper tip over the cap)

SRC = 'SOLSKAFT-ROAD-PATROL-COMBAT'
ROW = {'Idle': 'idle', 'Walk': 'walk', 'Attack': 'attack', 'Shoot': 'shoot', 'Flinch': 'flinch', 'Fall': 'hurt', 'Prone': 'prone'}
N = {'idle': 4, 'walk': 8, 'attack': 8, 'shoot': 6, 'flinch': 4, 'hurt': 6, 'prone': 1}


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


VS.LOOKS['roadpatrol_p2'] = dict(
    src=SRC, windows=frame_windows() if os.path.isdir(os.path.join(VS.pix.SRC, SRC)) else [], trim=True, tall=42, avoid=['fire'], name='Road Patrol',
    rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('shoot', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    match={'walk': ('idle', 0), 'attack': ('idle', 0), 'shoot': ('idle', 0), 'flinch': ('idle', 0, 3), 'prone': ('hurt', 5, 0, 'w')},
    scaleas={'hurt': 'attack'}, ground={('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)}, release={'attack': 3, 'shoot': 3},
    hold=["attack: the North stab foreshortened and largely hidden on contact; cross-action bow and sword swap timing (the art desk's own notes)",
          "shoot: the longbow string and nocked arrow thin at native scale; the North bow's projected aim (the art desk's own notes)"],
    source="drawn by the art desk (SOLSKAFT-ROAD-PATROL-COMBAT, 11-12: art-wanted section 56 block 2, the road patrol in five views, the Attack and Shoot over "
           "the mannequin's guides), cut by tools/roadpatrol-fight-sheet.py over tools/vivian-sheet.py; SW W NW mirrored")

if __name__ == '__main__':
    VS.cut('roadpatrol_p2')

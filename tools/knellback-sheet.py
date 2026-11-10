"""DEEP16 pipeline 2 (generated art): the knellback, a squat cave beast with a bronze bell for a shell -> deep16/art/knellback_p1, all eight facings.

    python tools/knellback-sheet.py            (writes deep16/art/knellback_p1.png/.json)
    python tools/knellback-sheet.py check      (also deep16/art-src/knellback/knellback_p1-review.png: every row of every drawn view at 3x)

The art desk's ART-21, cut 11-10 by the cutter of 11-10 on the lanes desk's queue (Griz: "credit the knellback as a ChatGPT invention"; the creature, its
Ram and its Ring a ChatGPT invention, the art desk's draft KNELLBACK.md beside the pages). Sorted to deep16/_src/knellback/ART-21-1110/ (the zips beside it;
the 10-28 single sheet held in held-2026-10-28/):
  IDLE-AND-MOVEMENT  ART-21-KNELLBACK-IDLE-AND-MOVEMENT: a row page a view and action (SE NE S E N), Idle 6 and Move 8.
  COMBAT             ART-21-KNELLBACK-COMBAT: Attack 6 (the Ram: frame 4 the impact), Ring 8 (frame 4 the cue, the tremor's peak; its arcs detached,
                     kept with it), Flinch 4, Fall 6 (6 the held defeat), Prone 2 (tipped onto its side, then upright).
Each FRAME-MAP.csv gives every drawing's padded window on its row page (exclusive right and bottom edges; the labels and numbers outside them), no
ground point: "determine anchors from the feet and key the navy". Cut by tools/doran-sheet.py's cutter: the navy flooded in from each window's edges,
the body and every piece near it or big -- BIG lowered here so the Ring's arcs stay -- no lettering pass (none lies in a window). One scale a view on each
page set, by its standing frames (Idle 1-6; Attack 1, Ring 1, Flinch 1) to TALL; a standing frame stands on its lowest row by its top's middle (the
shell), a tipped one (Fall 4-6, Prone 1) by its whole body's middle. Facings (RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors.

Rows: idle 6; walk 8 (Move); attack 6 (the Ram, `release` 3); ring 8 (`release` 3, the save's cue: js/monsterrules.js MR.ring); flinch 4; hurt 6 (Fall,
held on 6); prone 3 (Fall 2-3 then Prone 1: it lies tipped on its side -- js/sprites.js S.proneRow); getup 2 (Prone 1-2, played as it rights itself).
"""
import csv, importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doransheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)
DS.BIG = 0.004                 # (a piece kept a 250th the body's size: the Ring's arcs, detached over the shell -- the art desk: "keep detached Ring arcs with their owning sprites")

_K = os.path.join(DS.pix.SRC, 'knellback', 'ART-21-1110')


def windows(folder):
    """{(action, i0, view): (file, box, None)} from the art desk's FRAME-MAP.csv: facing, action, frame, index, sheet, x0, y0, x1_exclusive, y1_exclusive"""
    out = {}
    for r in csv.DictReader(open(os.path.join(folder, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
        out[(r['action'].lower(), int(r['frame']) - 1, r['facing'])] = (r['sheet'], (int(r['x0']), int(r['y0']), int(r['x1_exclusive']), int(r['y1_exclusive'])), None)
    return out


SOURCES = {'move': dict(folder=os.path.join(_K, 'IDLE-AND-MOVEMENT'), windows=windows(os.path.join(_K, 'IDLE-AND-MOVEMENT')), letters=False),
           'combat': dict(folder=os.path.join(_K, 'COMBAT'), windows=windows(os.path.join(_K, 'COMBAT')), letters=False)}
GROUPS = {('move', 'all'): (['idle', 'move'], [('idle', i) for i in range(6)]),
          ('combat', 'all'): (['attack', 'ring', 'flinch', 'fall', 'prone'], [('attack', 0), ('ring', 0), ('flinch', 0)])}
GROUND = {('combat', 'fall', 3), ('combat', 'fall', 4), ('combat', 'fall', 5), ('combat', 'prone', 0)}
TALL = 38                      # (feet to the bell's loop: a squat Medium beast -- the rust monster, Medium, stands 39)
AVOID = ['red']                # (the amber eyes and the Ring's gold arcs keep the fire ramp; no red in it)
LOOKS = {
    'knellback_p1': dict(rows=[('idle', 5, [('move', 'idle', i) for i in range(6)]), ('walk', 8, [('move', 'move', i) for i in range(8)]),
                               ('attack', 10, [('combat', 'attack', i) for i in range(6)]), ('ring', 8, [('combat', 'ring', i) for i in range(8)]),
                               ('flinch', 12, [('combat', 'flinch', i) for i in range(4)]), ('hurt', 8, [('combat', 'fall', i) for i in range(6)]),
                               ('prone', 8, [('combat', 'fall', 1), ('combat', 'fall', 2), ('combat', 'prone', 0)]),
                               ('getup', 6, [('combat', 'prone', 0), ('combat', 'prone', 1)])],
                         release={'attack': 3, 'ring': 3},
                         hold=['SE Flinch 2 turns front-on during the tuck; SE Fall 4-6 and Prone 1: the far fourth leg cannot be traced (the art desk\'s own notes)',
                               'NE combat: the head stays hidden and the Ring\'s two arcs sit together on one side; N Fall 5-6 lose the beak, small warm marks left in the teal underside',
                               'E combat a shallow profile, some poses close to SE; the stride subtle where the far legs are behind the shell (the art desk\'s own notes)'],
                         source='drawn by the art desk (ART-21-KNELLBACK-IDLE-AND-MOVEMENT and -COMBAT, 11-10), cut by tools/knellback-sheet.py; SW W NW mirrored -- '
                                'the knellback, a ChatGPT invention (the art desk\'s ART-21 draft): deep16/data/foes.js knellback'),
}
KNELLBACK = dict(SOURCES=SOURCES, GROUPS=GROUPS, GROUND=GROUND, TALL=TALL, AVOID=AVOID, LOOKS=LOOKS, NAME='Knellback', SRCDIR='knellback')

if __name__ == '__main__':
    DS.cut(KNELLBACK, 'knellback_p1')

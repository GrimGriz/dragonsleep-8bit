"""DEEP16 pipeline 2 (generated art): Solskaft's garrison crossbowman with the heavy crossbow -> trooperxbow_p2, all eight facings.

    python tools/trooperxbow-fight-sheet.py            (writes deep16/art/trooperxbow_p2.png/.json)
    python tools/trooperxbow-fight-sheet.py check      (also the review sheet: every row of every facing at 3x)

Asked in art-wanted section 55, block 3 (11-12, the lanes desk, on his word: "we'll leave off on skylight specific, but go ahead and add the heavy crossbow to
the art ask"); cut 11-13 by the garrison cutter on the lanes desk's relay. The art desk's ART-142-CROSSBOW-COMBAT, sorted out of Fresh to
deep16/_src/ART-142-CROSSBOW-COMBAT/ (the zip beside it): the trooper on the wall -- the steel cap, the coat of mail, the round shield slung on his back, the
battleaxe at the belt, a heavy steel-bound crossbow -- five views (S, SE, E, rear NE, N), a page an action: Idle 4, Walk 8, Shoot 6 (over the mannequin's
GUIDE-2026-11-12-heavy-crossbow: up to the shoulder, sight, LOOSE on frame 4, lower), Span 6 (the nose down, a boot in the stirrup, the string drawn, a bolt laid).
Flinch, Fall and Prone (and a melee Attack) were not asked of this sheet: the ask's "the cutter takes them from the battleaxe sheet" -- ART-142-TROOPER-COMBAT's own pages
(tools/trooper-fight-sheet.py), scaled through that sheet's Idle 1 matched to this one's, so the shield is on his arm as he falls.

The cut is tools/trooper-fight-sheet.py's (tools/vivian-sheet.py): `trim`, the idle page by its idle's median to 42 -- the gate watch's and the axe trooper's --
the walk, shoot and span pages matched to their view's Idle 1; the battleaxe sheet's Idle (`tidle`) matched to this Idle 1, its Attack to that, its Fall scaled
as its Attack, its Prone to Fall 6 by width (`tidle` is not on the sheet; the Attack is, for the battleaxe he carries at the belt -- the ask gave him none of his own). SW W NW the mirrors of SE E NE (RULED 10-14). Rows: idle 4,
walk 8, shoot 6 (`release` 3), span 6, attack 8 (the axe sheet's, `release` 3), flinch 4, hurt 6, prone 1. `span` plays after each shot in the same turn
(js/battle.js, the span after the shot, 11-13 on his word: "It'd be during the turn and not a separate turn"): a look only, no cost -- SRD 5.1 Loading is one shot a turn.
Worn by the crossbow Trooper (deep16/data/foes.js trooperxbow; its Heavy Crossbow names `row: 'shoot'`).
"""
import importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)
VS.FH, VS.AY = 80, 74          # (the prod over the cap in N's Shoot, and the fall borrowed from the axe sheet's tall cell)

XB, AXE = 'ART-142-CROSSBOW-COMBAT', 'ART-142-TROOPER-COMBAT'
ROW = {XB: {'Idle': 'idle', 'Walk': 'walk', 'Shoot': 'shoot', 'Span': 'span'},
       AXE: {'Idle': 'tidle', 'Attack': 'attack', 'Flinch': 'flinch', 'Fall': 'hurt', 'Prone': 'prone'}}
N = {'idle': 4, 'walk': 8, 'shoot': 6, 'span': 6, 'tidle': 4, 'attack': 8, 'flinch': 4, 'hurt': 6, 'prone': 1}


def frame_windows():
    out = []
    for batch in (XB, AXE):
        fm = json.load(open(os.path.join(VS.pix.SRC, batch, 'FRAME-MAP.json'), encoding='utf-8'))
        for pg in fm['pages']:
            row = ROW[batch].get(pg['action'])
            if not row:
                continue                                                               # (the axe sheet's Walk and Throw are its own)
            idx = [f['engine_index'] for f in pg['frames']]
            assert idx == list(range(N[row])), (pg['source'], idx)                     # (every number once, none skipped)
            for f in pg['frames']:
                out.append((batch, pg['facing'], row, f['engine_index'], pg['source'], tuple(f['window_xyxy'])))
    return out


VS.LOOKS['trooperxbow_p2'] = dict(
    src='.', windows=frame_windows() if os.path.isdir(os.path.join(VS.pix.SRC, XB)) else [], trim=True, tall=42, avoid=['fire'], name='Trooper (crossbow)',
    rows=[('idle', 4, 4), ('walk', 9, 8), ('shoot', 10, 6), ('span', 8, 6), ('attack', 12, 8), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    match={'walk': ('idle', 0), 'shoot': ('idle', 0), 'span': ('idle', 0), 'tidle': ('idle', 0), 'attack': ('tidle', 0), 'flinch': ('tidle', 0, 3),
           'prone': ('hurt', 5, 0, 'w')},
    scaleas={'hurt': 'attack'}, ground={('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)}, release={'shoot': 3, 'attack': 3},
    hold=["shoot: North hides much of the bolt and string, its stock foreshortened with the prod over the cap; other views vary in how clearly the bolt and string state shows (the art desk's own notes)",
          "span: NE Span 5 one stock in the bolt-placement pose; stirrup and bolt overlaps hard to read at 42 px (the art desk's own notes)",
          "attack, flinch, hurt, prone: the battleaxe sheet's, the shield on his arm and the axe in hand, as the ask said"],
    source="drawn by the art desk (ART-142-CROSSBOW-COMBAT, 11-12: art-wanted section 55 block 3, the garrison crossbowman in five views, the Shoot over the "
           "mannequin's guide; flinch, fall and prone from ART-142-TROOPER-COMBAT), cut by tools/trooperxbow-fight-sheet.py over tools/vivian-sheet.py; SW W NW mirrored")

if __name__ == '__main__':
    VS.cut('trooperxbow_p2')

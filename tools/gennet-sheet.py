"""DEEP16 pipeline 2 (generated art): Gennet Waterby, the Halfway Inn's lady -> gennet_p1 (her town figure) and gennet_p2 (her fight figure), all eight facings.

    python tools/gennet-sheet.py [gennet_p1|gennet_p2]          (writes deep16/art/<name>.png/.json; both with no name)
    python tools/gennet-sheet.py [name] check                   (also deep16/art-src/gennet/<name>-review.png: every row of every drawn view at 3x)

Asked in art-wanted section 35 (11-04, the Inn seat); cut 11-05 by the Waterby cutter (waterby-cutter-1105) on the lanes desk's relay of Griz's "We got
art for the waterby inkeeps in Fresh". The art desk's two batches, sorted to deep16/_src/gennet/:
  INN-TOWN-1105    HALFWAY-INN-GENNET-TOWN: one page a view (HEAD 7 S, 8 SE, 9 E, 10 NE, 11 N), three bands -- Idle 4, Walk 1-4, Walk 5-8 -- the walk with
                   the lit brass lantern low in her right hand, the idle empty-handed; a dark ground shadow baked under the walking boots.
  INN-COMBAT-1105  HALFWAY-INN-GENNET-COMBAT: one page a view (HEAD 1 SE, 2 NE, 3 S, 4 E, 5 N), six bands -- Cast 6 (the open palm raised: her spells, the
                   crook of light, Hold Person; no effect drawn, the game draws them), Dagger 4 (the right hand), Flinch 4, Fall 4 (ending seated), Prone 1
                   (on her side), Sit 1 (hands in her lap); each frame's number printed under its feet.
Each drawing is read from the MANIFEST.json window (generous: the number inside it, under the feet -- tools/doran-sheet.py's figure(), `below`).

gennet_p1 (the inn's floor: gennet, gennetGrief, gennetYard, and the due's walk to the point, dueLady -- js/counter.js C.FIG): idle <- Idle 4; walk <-
Walk 8 (the lantern).
gennet_p2 (every fight she is in: deep16/data/foes.js gennet -- the path, the poison dinner's common room): idle <- the town Idle 4; walk <- the town Walk 8
(the lantern -- she carries the shore-lantern on the path; at the dinner it is the drawn walk still); cast <- Cast 6 (`release` 3: the palm out on frame
4); attack <- Dagger 4 (`release` 2: the extension on frame 3); flinch <- Flinch 4; hurt <- Fall 4 then Prone 1 (she dies lying, not seated); prone <-
Fall 2-4 then Prone 1 (js/sprites.js S.proneRow); sit <- Sit 1. Facings (RULED 10-14): S SE E NE N as drawn, SW W NW their mirrors (the lantern's
hand and the dagger's mirror too).

The cut is tools/doran-sheet.py's (loaded here): one scale a group -- the town's idle and walk each by their own median height, the fight page by its
standing frames (Cast 1 and 2, Flinch 4: the art desk's "calibrated by standing Cast1") -- to TALL (the inn's women, 47: folkwoman_p1, katarina_p1);
the baked shadow keyed out with the navy; snapped to the 64 with red and fire left out (her warm skin), the lantern's flame alone on the fire ramp
(the art desk's "Flame alone uses the fire ramp").
"""
import importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('doran_sheet', os.path.join(ROOT, 'tools', 'doran-sheet.py'))
DS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DS)

_G = os.path.join(DS.pix.SRC, 'gennet')
SOURCES = {
    'town': dict(folder=os.path.join(_G, 'INN-TOWN-1105'), windows=DS.manifest_windows(os.path.join(_G, 'INN-TOWN-1105')), shadow=True),
    'fight': dict(folder=os.path.join(_G, 'INN-COMBAT-1105'), windows=DS.manifest_windows(os.path.join(_G, 'INN-COMBAT-1105')), shadow=True, below=True),
}
GROUPS = {('town', 'idle'): (['idle'], [('idle', i) for i in range(4)]),
          ('town', 'walk'): (['walk'], [('walk', i) for i in range(8)]),
          ('fight', 'all'): (['cast', 'dagger', 'flinch', 'fall', 'prone', 'sit'], [('cast', 0), ('cast', 1), ('flinch', 3)])}
GROUND = {('fight', 'fall', 2), ('fight', 'fall', 3), ('fight', 'prone', 0), ('fight', 'sit', 0)}
_src = 'drawn by the art desk (HALFWAY-INN-GENNET-%s, 11-05: art-wanted section 35), cut by tools/gennet-sheet.py over tools/doran-sheet.py; SW W NW mirrored'
LOOKS = {
    'gennet_p1': dict(rows=[('idle', 4, [('town', 'idle', i) for i in range(4)]), ('walk', 10, [('town', 'walk', i) for i in range(8)])],
                      hold=['walk: skirt occlusion leaves some support phases ambiguous; the 8 to 1 seam wants native playback; NE and N corrected for the opposite heel '
                            'lead (the art desk\'s own notes)',
                            'her face at game size reads younger and softer than her portrait (the art desk\'s own note)'],
                      source=_src % 'TOWN' + '; the inn\'s floor (js/counter.js C.FIG gennet, gennetGrief, gennetYard, dueLady)'),
    'gennet_p2': dict(rows=[('idle', 4, [('town', 'idle', i) for i in range(4)]), ('walk', 10, [('town', 'walk', i) for i in range(8)]),
                            ('cast', 10, [('fight', 'cast', i) for i in range(6)]), ('attack', 10, [('fight', 'dagger', i) for i in range(4)]),
                            ('flinch', 12, [('fight', 'flinch', i) for i in range(4)]),
                            ('hurt', 8, [('fight', 'fall', i) for i in range(4)] + [('fight', 'prone', 0)]),
                            ('prone', 8, [('fight', 'fall', 1), ('fight', 'fall', 2), ('fight', 'fall', 3), ('fight', 'prone', 0)]),
                            ('sit', 2, [('fight', 'sit', 0)])],
                      release={'cast': 3, 'attack': 2},
                      hold=['walk: the town walk with the lantern in her hand, the poison dinner\'s fight too (no fight walk was drawn)',
                            'attack: the front Dagger 2 blade foreshortened behind her fist; front and SE Dagger 3 angle down, a short low jab (the art desk\'s own notes)',
                            'E Flinch 2 still turns toward the viewer; N recoils on a slight rear diagonal (the art desk\'s own notes)'],
                      source=(_src % 'COMBAT') + ' -- the idle and walk from HALFWAY-INN-GENNET-TOWN; every fight she is in (deep16/data/foes.js gennet)'),
}
GENNET = dict(SOURCES=SOURCES, GROUPS=GROUPS, GROUND=GROUND, TALL=47, AVOID=['red', 'fire'], FIRE_OK=True, LOOKS=LOOKS, NAME='Gennet Waterby', SRCDIR='gennet')

if __name__ == '__main__':
    for lk_ in [a for a in sys.argv[1:] if a in LOOKS] or list(LOOKS):
        DS.cut(GENNET, lk_)

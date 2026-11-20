"""DEEP16 pipeline 2 (generated art): the road's Silversands who fight beside the party -> halldor_p2 and brann_p2, all eight facings.

    python tools/silversands-fight-sheet.py [look ...]        (writes deep16/art/<look>.png/.json; no look: both)
    python tools/silversands-fight-sheet.py <look> check      (also the review sheet: every row of every facing at 3x, under deep16/art-src/<name>/)

Asked in art-wanted section 88 (11-19, the seat road-art-1119; held for the combat seat, then sent 11-20 by the combat-asks seat as ASK-2026-11-20-halldor-combat
and -brann-combat, over the mannequin's guides re-posed that morning); cut 11-20 by the cutter seat cutter-1120b on the lanes desk's message carrying his
"there's stuff in Fresh". The cut is tools/trooper-fight-sheet.py's (tools/vivian-sheet.py): `trim`, the idle page by its idle's median to the trooper's 42,
every other page matched to its view's Idle 1, the Fall scaled as the Attack, a tall cell for a weapon over the head; SW W NW the mirrors of SE E NE (RULED
10-14). Both blows land on frame 4, as asked and as the art desk marks them in all five views: `release` 3, the house's.

HALLDOR (the art desk's ART-144-COMBAT, sorted to deep16/_src/halldor/2026-11-20-ART-144-COMBAT/): warhammer in the right hand, the round shield on the left
forearm. Its FRAME-MAP.json gives each frame a `window_xyxy` and an `engine_index` (the trooper's shape). Rows: idle 4, walk 8, attack 8, push 6 (the
art desk's `shieldpush`, GUIDE-2026-11-20-shield-wall-push: the shove on frame 4, the hammer kept cocked -- named `push` on the lanes desk's word; no engine
code plays it yet, deep16/js/features.js THE PUSH is the Soldiering seat's), flinch 4, hurt 6 (the Fall), prone 1 (its own redraw, matched to Fall 6 by width).

BRANN (the art desk's ART-145-COMBAT, sorted to deep16/_src/brann/2026-11-20-ART-145-COMBAT/): one two-handed bearded battleaxe, no shield. Its FRAME-MAP.json
`combat_frames` give each drawing its cell (`source_crop`), its own box (`art_bounds`) and its ground line (`preview_source_anchor`): the Attack is the
JUMPING CHOP, both feet off the floor on frames 3 and 4, so each frame stands on its ground line (vivian-sheet's 8th window element), not on its lowest pixel.
Rows: idle 4, walk 8, attack 8, flinch 4, hurt 6 (the Fall), prone 1 -- the exact last Fall cel held (the art desk's `prone_runtime_hold`; its own Prone
page is a reference only), the dropped axe kept.
"""
import importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)
VS.FH, VS.AY = 80, 74          # (the trooper's cell: the hammer and the axe raised over the cap)

H_SRC, H_BATCH = 'halldor', '2026-11-20-ART-144-COMBAT/ART-144-COMBAT-HALLDOR-CUTTER-HANDOFF'
B_SRC, B_BATCH = 'brann', '2026-11-20-ART-145-COMBAT'
N = {'idle': 4, 'walk': 8, 'attack': 8, 'push': 6, 'flinch': 4, 'hurt': 6, 'prone': 1}
BRANN_PS = {}                  # (his pages' own scales, the art desk's `preview_scale`: each page brought to his view's idle by their ratio, not by match)


def halldor_windows():
    d = os.path.join(VS.pix.SRC, H_SRC, H_BATCH)
    if not os.path.isdir(d):
        return []
    fm = json.load(open(os.path.join(d, 'FRAME-MAP.json'), encoding='utf-8'))
    out = []
    for pg in fm['pages']:
        row = {'shieldpush': 'push'}.get(pg['engine_row'], pg['engine_row'])
        idx = [f['engine_index'] for f in pg['frames']]
        assert idx == list(range(N[row])), (pg['source'], idx)                     # (every number once, none skipped)
        for f in pg['frames']:
            out.append((H_BATCH, pg['facing'], row, f['engine_index'], pg['source'], tuple(f['window_xyxy'])))
    return out


def brann_windows():
    d = os.path.join(VS.pix.SRC, B_SRC, B_BATCH)
    if not os.path.isdir(d):
        return []
    fm = json.load(open(os.path.join(d, 'FRAME-MAP.json'), encoding='utf-8'))
    hold = fm['prone_runtime_hold']; assert (hold['action'], hold['runtime_index']) == ('hurt', 5), hold
    out, rows = [], {}
    for f in fm['combat_frames']:
        if f['action'] == 'prone':
            continue                                                               # (the Prone page: a reference -- the runtime prone is Fall 6 held)
        BRANN_PS[(B_BATCH, 'sources/' + f['page'])] = f['preview_scale']
        w = (B_BATCH, f['facing'], f['action'], f['runtime_index'], 'sources/' + f['page'], tuple(f['source_crop']), tuple(f['art_bounds']),
             f['preview_source_anchor'][1])
        out.append(w); rows.setdefault((f['facing'], f['action']), []).append(f['runtime_index'])
        if (f['action'], f['runtime_index']) == ('hurt', 5):
            out.append(w[:2] + ('prone', 0) + w[4:])
    for (v, r), ns in rows.items():
        assert sorted(ns) == list(range(N[r])), (v, r, sorted(ns))
    return out


COMMON = dict(trim=True, tall=42, avoid=['fire'],
              match={'walk': ('idle', 0), 'attack': ('idle', 0), 'push': ('idle', 0), 'flinch': ('idle', 0, 3), 'prone': ('hurt', 5, 0, 'w')},
              scaleas={'hurt': 'attack'}, ground={('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)})

VS.LOOKS['halldor_p2'] = dict(COMMON, src=H_SRC, windows=halldor_windows(), name='Halldor',
    rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('push', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    release={'attack': 3, 'push': 3},
    hold=['push: cut and in hand, played by nothing yet -- the shield wall\'s push (deep16/js/features.js THE PUSH) moves the square, the row waits for its hook',
          'attack: North 3 and 4 are close from behind, the hammer reaching over the right shoulder on 4 (the art desk\'s own note)',
          'walk: the SE and E leg exchange is subtle at game size (the art desk\'s own note)',
          'prone: its own redraw of Fall 6, small contour differences at the join (the art desk\'s own note)'],
    source='drawn by the art desk (ART-144-COMBAT, 11-20: art-wanted section 88, Captain Halldor with warhammer and shield in five views, the Attack and the Push '
           'over the mannequin\'s guides), cut by tools/silversands-fight-sheet.py over tools/vivian-sheet.py; SW W NW mirrored')

VS.LOOKS['brann_p2'] = dict(COMMON, src=B_SRC, windows=brann_windows(), name='Brann', pagescale=BRANN_PS,
    rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    release={'attack': 3},
    hold=['attack: N\'s blade projects high on 4 as the swing travels away; the SE contact hands overlap at game size (the art desk\'s own notes)',
          'walk: the rear NE lead boots are hard to tell apart at 1 and 5, a gait hold (the art desk\'s own note)',
          'prone: the last Fall cel held, the dropped axe beside him'],
    source='drawn by the art desk (ART-145-COMBAT, 11-20: art-wanted section 88, Brann with a battleaxe in both hands in five views, the Attack the jumping chop '
           'over the mannequin\'s guide), cut by tools/silversands-fight-sheet.py over tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    for lk in [a for a in sys.argv[1:] if a in ('halldor_p2', 'brann_p2')] or ['halldor_p2', 'brann_p2']:
        VS.cut(lk)

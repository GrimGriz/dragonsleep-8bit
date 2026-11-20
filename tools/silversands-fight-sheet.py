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


# THE SECOND THREE (11-20, the same seat, on the lanes desk's message; the combat-asks seat's ASK-2026-11-20-hedda-combat, -sect-blade-combat and -pike-trooper-combat):
# each FRAME-MAP.csv gives a drawing's own box (its crop, right and bottom exclusive) -- a window PAD wider round it, the box keeping the drawing's pieces -- and
# Hedda's and the blade's the ground line on the page as well. Every blow, shove and thrust lands on frame 4 in all five views, as each map marks it: `release` 3.
PAD = 14
N.update({'attack2': 8, 'pikerank': 6})


_PAGES = {}
BOOTS = 40   # (source px: a row of the drawing this wide is a boot or wider -- a pike's shaft and head are narrower)


def boots(path, win, box):
    """the ground line on the page where a map gives none: the drawing's lowest row at least BOOTS wide (the pike trooper's pike runs past his boots in S
    and N, and a frame standing on its lowest pixel stood on the pike's head)"""
    import numpy as np
    from PIL import Image
    if path not in _PAGES:
        _PAGES[path] = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    a = _PAGES[path][win[1]:win[3], win[0]:win[2]]
    m = VS.figure(a, False, (box[0] - win[0], box[1] - win[1], box[2] - win[0], box[3] - win[1]))
    wide = np.where(m.sum(1) >= BOOTS)[0]
    return win[1] + int(wide[-1]) + 1


def csv_windows(src, batch, row_col, ground_col=None, scale_col=None, rename=None, hold_prone=False, sub=''):
    """[(batch, view, row, index, file, window, box, ground)] from a delivery's FRAME-MAP.csv; `hold_prone`: the runtime prone is Fall 6's own cell
    (the pike trooper's notes: "For an exact hold, register `prone` to the final `hurt` crop"); `scale_col` fills `pagescale`"""
    import csv
    d = os.path.join(VS.pix.SRC, src, batch)
    if not os.path.isdir(d):
        return [], {}
    out, rows, ps = [], {}, {}
    for r in csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
        row = (rename or {}).get(r[row_col], r[row_col])
        if hold_prone and row == 'prone':
            continue
        fn = sub + r['source']
        if 'x0' in r:
            box = (int(r['x0']), int(r['y0']), int(r['x1_exclusive']), int(r['y1_exclusive']))
        else:
            x, y = int(r['x']), int(r['y']); box = (x, y, x + int(r['width']), y + int(r['height']))
        win = (max(0, box[0] - PAD), max(0, box[1] - PAD), box[2] + PAD, box[3] + PAD)
        g = int(float(r[ground_col])) if ground_col else boots(os.path.join(d, fn), win, box) if ground_col is False else None
        w = (batch, r['facing'], row, int(r['index']), fn, win, box, g)
        out.append(w); rows.setdefault((r['facing'], row), []).append(int(r['index']))
        if scale_col:
            ps[(batch, fn)] = float(r[scale_col])
        if hold_prone and (row, int(r['index'])) == ('hurt', 5):
            out.append(w[:2] + ('prone', 0) + w[4:]); rows.setdefault((r['facing'], 'prone'), []).append(0)
    for (v, rw), ns in rows.items():
        assert sorted(ns) == list(range(N[rw])), (src, v, rw, sorted(ns))   # (every number once, none skipped)
    assert set(v for v, _ in rows) == {'S', 'SE', 'E', 'NE', 'N'}, sorted(rows)
    return out, ps


BOXED = dict(COMMON, trim=False)   # (the box, not the trim, keeps each drawing's own pieces)
BOXED['match'] = dict(BOXED['match'], attack2=('idle', 0), pikerank=('idle', 0))

# HEDDA (the art desk's ART-146-COMBAT, sorted to deep16/_src/hedda/2026-11-20-ART-146-COMBAT/): warhammer in the right hand, the shield on the left forearm, as
# Halldor's; its Prone rows point at Fall 6's own crop. Its notes hold SE, E and rear NE Walk (the same stride at 1 and 5: ImageGen ran out before the redraws)
# and ask a gear check on rear NE Push (the chest overlap may read as the right arm driving the shield).
_hw, _ = csv_windows('hedda', '2026-11-20-ART-146-COMBAT', 'row', ground_col='source_foot_y_exclusive', rename={'shieldpush': 'push'}, sub='originals/')
VS.LOOKS['hedda_p2'] = dict(BOXED, src='hedda', windows=_hw, name='Hedda',
    rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('push', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    release={'attack': 3, 'push': 3},
    hold=['push: cut and in hand, the same row name as Halldor\'s so the one hook serves both (deep16/js/features.js THE PUSH, the Soldiering seat\'s)',
          'walk: SE, E and rear NE on the art desk\'s own hold -- the same stride at 1 and 5 (deep16-dream-polish.md)',
          'push, rear NE: the chest overlap may read as the right arm driving the shield (the art desk\'s own gear check)'],
    source='drawn by the art desk (ART-146-COMBAT, 11-20: art-wanted section 88, Hedda Greyseam with warhammer and shield in five views, the Attack and the Push '
           'over the mannequin\'s guides), cut by tools/silversands-fight-sheet.py over tools/vivian-sheet.py; SW W NW mirrored')

# THE SECT'S BLADE (the art desk's ART-148-COMBAT, sorted to deep16/_src/sectblade/2026-11-20-ART-148-COMBAT/): a drawn shortsword in each hand; `attack` the
# right-hand thrust, `attack2` the left; both blades share it. Its map gives each row's own scale (`preview_scale`), each frame's ground line, and Prone at Fall 6.
_bw, _bps = csv_windows('sectblade', '2026-11-20-ART-148-COMBAT', 'action', ground_col='source_ground_y', scale_col='preview_scale')
VS.LOOKS['sectblade_p2'] = dict(BOXED, src='sectblade', windows=_bw, name='Sect Blade', pagescale=_bps,
    rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('attack2', 12, 8), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    release={'attack': 3, 'attack2': 3},
    hold=['attack2: the left-hand thrust, in hand; a fight plays `attack` for every shortsword blow until the second blow asks for its own row',
          'attack, attack2: S and N are foreshortened; the left lead hides behind the torso in the side and rear windups (the art desk\'s own notes)',
          'walk: E\'s legs overlap tightly (the art desk\'s own note)'],
    source='drawn by the art desk (ART-148-COMBAT, 11-20: art-wanted section 89, the sect\'s blade with two shortswords in five views, the thrusts over the '
           'mannequin\'s guide and its mirror), cut by tools/silversands-fight-sheet.py over tools/vivian-sheet.py; SW W NW mirrored')

# THE PIKE TROOPER (the art desk's PIKE-TROOPER-CUTTER-HANDOFF, sorted to deep16/_src/trooperpike/2026-11-20-PIKE-TROOPER/): one ash pike, no shield, the thrust
# along the hip (GUIDE-2026-11-20b-pike-thrust) and the pike rank with the feet planted (GUIDE-2026-11-20-pike-rank). No ground line in its map, and in S and N
# the pike runs past his boots: each frame's ground found by boots(), his height measured crown to ground (`tallground`). Prone the last Fall cel held (its own Prone pages a reference). His portrait: pt_dwarf `pikeman` (tools/portrait-sheet.py).
_pw, _ = csv_windows('trooperpike', '2026-11-20-PIKE-TROOPER', 'action', ground_col=False, hold_prone=True)   # (ground_col False: found by boots())
VS.LOOKS['trooperpike_p2'] = dict(BOXED, src='trooperpike', windows=_pw, name='Pike Trooper', tallground=True, scaleas={},   # (his Fall pages drawn
    match=dict(BOXED['match'], hurt=('idle', 0)),   # bigger than his Attack's: Fall 1, upright, matched to Idle 1 crown to ground -- "as the Attack" stood E's 54 to 44)
    rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('pikerank', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    release={'attack': 3, 'pikerank': 3},
    hold=['pikerank: cut and in hand, played by nothing yet (deep16/js/features.js, the Soldiering seat\'s)',
          'walk: E and rear NE hard to tell the lead change at 1 and 5; N repeats its foot shapes (the art desk\'s own notes)',
          'prone: the last Fall cel held'],
    source='drawn by the art desk (PIKE-TROOPER-CUTTER-HANDOFF, 11-20: art-wanted section 93, the garrison\'s pike trooper in five views, the thrust and the '
           'rank over the mannequin\'s guides), cut by tools/silversands-fight-sheet.py over tools/vivian-sheet.py; SW W NW mirrored')

LOOKS_HERE = ('halldor_p2', 'brann_p2', 'hedda_p2', 'sectblade_p2', 'trooperpike_p2')

if __name__ == '__main__':
    for lk in [a for a in sys.argv[1:] if a in LOOKS_HERE] or list(LOOKS_HERE):
        VS.cut(lk)

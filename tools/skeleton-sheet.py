"""DEEP16 pipeline 2 (generated art): the skeleton's two drawn looks -> skeleton_helmed_p2 (the Helmed Swordsman) and skeleton_bare_p2 (the Bare-Skulled
Bowman), all eight facings; one SRD Skeleton (data/foes.js `skeleton`), its look picked at random each time one is called to a fight (js/battle.js Battle.lookOf).

    python tools/skeleton-sheet.py [skeleton_helmed_p2|skeleton_bare_p2]   (writes deep16/art/<name>.png/.json; both with no name)
    python tools/skeleton-sheet.py [name] check     (also the review sheet, deep16/art-src/skeleton-refresh/<name>-review.png)
    python tools/skeleton-sheet.py [name] frames    (each page's scale, the art desk's and the cut's; each frame's height at game size)

Griz to the lanes desk, 11-26: "there are 3 in Fresh, two for the Pocket DM stores and two skeletons (randomly assigned when skeletons call for combat - i had it
make two variants)". Drawn by the art desk as ART-170: SKELETON-REFRESH-CUTTER-HANDOFF (Idle 4, Walk 8, Shortsword 6, Shortbow 6, Flinch 4, Fall 6, Prone 1 in
S, SE, E, rear NE and N for each look; his six SE pages approved, the rest for the cutter's review) and SKELETON-REFRESH-DEATH-COLLAPSE-ADDON (Death Collapse 6,
the standing guard to a pile of bones and gear, in the same five views), claimed out of Fresh 11-26 to deep16/_src/skeleton-refresh/ (the zips beside their
folders, 2026-11-26-ART-170-HANDOFF and -DEATH-COLLAPSE). Cut 11-26 by the cutter seat cutter-1126-skel. SW W NW the mirrors (RULED 10-14).

THE CUT: tools/vivian-sheet.py's, each window from the art desk's FRAME-MAP.csv crop (`crop_bounds_exclusive`, or the add-on's crop_x0..y1), widened by PAD for
the matte and the crop handed in as the drawing's box (a printed frame number outside it is dropped). The navy matte stripped (BGTOL), snapped to the 64,
outlined -- each 1x pixel the colour most of its block holds (`down` 'mode', vivian-sheet to1x_mode), not the block's mean: by the mean the thin cream
bones blended into the dark between them and every rib went brown (checked 11-26 at 55 and at the art desk's 66: the same mud at both sizes). Each upright frame on its lowest row at the anchor; the lying ones (Fall and Death Collapse 4 to 6) centred by their whole body. Kept in skeleton_p1's
cell (96 x 96, anchor 48, 84: `fw`, vivian-sheet's), so the new looks stand where the old one stood.

SCALE: the idle page of each view to TALL; every other page by the art desk's own scale for it (its 1x preview height over its crop, `pagescale`) against the
view's idle page -- the art desk drew each page's figure at its own size and registered every page to the same standing height, so the ratio carries that. TALL
is the house's human, not the old KayKit figure's: the line soldier stands 54 to 55 (dominion_p2), Lymen 51 to 53; the art desk's 1x previews stood 66 and 64,
matching skeleton_p1's render (its feet 86 to 94 below an anchor of 84). The helmed look 55 (the half-cap), the bare-skulled 53 (the art desk's 66 : 64).

ROWS (data/foes.js `skeleton`'s two blows by name, js/battle.js): idle 4, walk 8, shortsword 6 (the blade home on frame 4, `release` 3), shortbow 6 (the string
let go on frame 4, `release` 3: the engine's own arrow leaves then, none drawn), flinch 4, hurt 6 (the Fall: js/sprites.js S.PRONE 5 lies at its frame 6 and
gets up through it backwards), deathcollapse 6 (played once at a defeat and held on the pile: js/ui.js). `attack` is the shortsword's row by name (the same
pixels; a blow with no row of its own plays it). The Prone pages are not cut: each is its Fall 6 drawing, pixel for pixel (an 18 px margin round it; checked
11-26), and a `prone` row would skip the fall and the get-up (js/sprites.js S.proneRow).
"""
import csv, importlib.util, json, os, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)
VS.FH, VS.AY = 96, 84            # (skeleton_p1's cell and anchor: deep16/art/skeleton_p1.json)

SRC = 'skeleton-refresh'
HANDOFF, ADDON = '2026-11-26-ART-170-HANDOFF', '2026-11-26-ART-170-DEATH-COLLAPSE'
VIEWS = ('S', 'SE', 'E', 'NE', 'N')
ROW = {'idle': 'idle', 'walk': 'walk', 'shortsword': 'shortsword', 'shortbow': 'shortbow', 'flinch': 'flinch', 'fall': 'hurt'}   # (`prone`: QA only, above)
PAD = 24          # (source px of matte round each crop: figure() reads the navy off a window's edges)
BGTOL = 20        # (the bones' dark umber outlines sit within 30 of the navy: at 20 they stay -- the mender's and the lady's tolerance)
LYING = {('hurt', 3), ('hurt', 4), ('hurt', 5), ('deathcollapse', 3), ('deathcollapse', 4), ('deathcollapse', 5)}
ROWS = [('idle', 5, 4), ('walk', 10, 8), ('shortsword', 10, 6), ('shortbow', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('deathcollapse', 10, 6)]
LOOK_OF = {'A': 'skeleton_helmed_p2', 'B': 'skeleton_bare_p2'}
TALL = {'skeleton_helmed_p2': 55, 'skeleton_bare_p2': 53}
NOTES = {}


def plan(variant):
    """(windows, pagescale): every cut frame of one look as vivian-sheet windows (batch, view, row, i, file, window, box), and the art desk's scale of each page"""
    out, ks = [], {}
    def page(batch):
        return lambda fn: (batch, fn)
    for r in csv.DictReader(open(os.path.join(VS.pix.SRC, SRC, HANDOFF, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
        if r['variant'] != variant or r['action'] not in ROW:
            continue
        box = tuple(int(v) for v in r['crop_bounds_exclusive'].split())
        out.append((HANDOFF, r['facing'], ROW[r['action']], int(r['index']), r['source'], box))
        ks.setdefault((HANDOFF, r['source']), []).append(int(r['preview_height']) / float(box[3] - box[1]))
    for r in csv.DictReader(open(os.path.join(VS.pix.SRC, SRC, ADDON, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
        if r['variant'] != variant:
            continue
        box = tuple(int(r[k]) for k in ('crop_x0', 'crop_y0', 'crop_x1_exclusive', 'crop_y1_exclusive'))
        out.append((ADDON, r['facing'], 'deathcollapse', int(r['index']), r['source'], box))
        ks.setdefault((ADDON, r['source']), []).append(int(r['preview_height']) / float(box[3] - box[1]))
    wins = []
    for batch, view, row, i, fn, (x0, y0, x1, y1) in out:
        from PIL import Image
        W_, H_ = Image.open(os.path.join(VS.pix.SRC, SRC, batch, fn)).size
        win = (max(0, x0 - PAD), max(0, y0 - PAD), min(W_, x1 + PAD), min(H_, y1 + PAD))
        wins.append((batch, view, row, i, fn, win, (x0, y0, x1, y1)))
    got = {}
    for w in wins:
        got.setdefault((w[1], w[2]), []).append(w[3])
    for (v, rw), ns in got.items():
        assert sorted(ns) == list(range(dict((r, n) for r, _, n in ROWS)[rw])), (variant, v, rw, sorted(ns))   # (every number once, none skipped)
    for rw, _, _ in ROWS:
        assert set(v for v, r in got if r == rw) == set(VIEWS), (variant, rw)
    return wins, {pg: float(np.median(k)) for pg, k in ks.items()}


def register(look):
    v = [k for k, lk in LOOK_OF.items() if lk == look][0]
    wins, ps = plan(v)
    NOTES[look] = ps
    helmed = v == 'A'
    VS.LOOKS[look] = dict(
        src=SRC, name='Skeleton', tall=TALL[look], bgtol=BGTOL, fw=96, down='mode', windows=wins, pagescale=ps, ground=LYING, rows=ROWS,
        match={r: ('idle', 0) for r, _, _ in ROWS if r != 'idle'},   # (no stagger rule: every page not an idle takes the art desk's scale, `pagescale`, first)
        release={'shortsword': 3, 'shortbow': 3},
        hold=['the art desk\'s ART-170, its six SE pages approved by Griz; the other 28 pages and the five Death Collapse pages reviewed by the cutter at game size',
              'shortsword: the blade home on frame 4 (`release` 3); S and N foreshortened, the thrust up or down the screen (the art desk\'s own note)',
              'shortbow: the string let go on frame 4 (`release` 3) -- the engine\'s arrow, none drawn; in S the hand opening carries it (the art desk\'s own note)',
              'hurt: the Fall; S.PRONE 5 lies at its frame 6 and gets up through it backwards (the Prone pages are its frame 6, pixel for pixel)',
              'deathcollapse: played once at a defeat and held on its frame 6, the pile; one already prone at its defeat holds the pile (js/ui.js)'] +
             (['the half-cap and the sword belong to the pile (the add-on\'s note)'] if helmed else
              ['the bow, the quiver and the sheathed sword belong to the pile (the add-on\'s note)']),
        source='drawn by the art desk (ART-170, 11-26: the SKELETON-REFRESH handoff and its Death Collapse add-on, the %s in five views), cut by '
               'tools/skeleton-sheet.py over tools/vivian-sheet.py; SW W NW mirrored; one of the two looks data/foes.js `skeleton` picks from (js/battle.js '
               'Battle.lookOf)' % ('Helmed Swordsman' if helmed else 'Bare-Skulled Bowman'))


def alias(look):
    """`attack`: the shortsword's row by name, the same pixels (a blow with no row of its own -- js/battle.js falls back to `attack`)"""
    p = os.path.join(ROOT, 'deep16', 'art', look + '.json')
    meta = json.load(open(p, encoding='utf-8'))
    a = dict(meta['anims']['shortsword'], same='shortsword')   # (`same`: another row's drawing under a second name -- js/show.js does not want it twice)
    an = {}
    for k, val in meta['anims'].items():
        an[k] = val
        if k == 'shortbow':
            an['attack'] = a
    meta['anims'] = an
    with open(p, 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)


if __name__ == '__main__':
    looks = [a for a in sys.argv[1:] if a in TALL] or list(TALL)
    for lk in looks:
        register(lk)
        if 'frames' in sys.argv:
            for pg, k in sorted(NOTES[lk].items()):
                print(lk, pg[0][-14:], os.path.basename(pg[1]), 'art desk k %.4f' % k)
            continue
        VS.cut(lk)
        alias(lk)

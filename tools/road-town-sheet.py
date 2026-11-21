"""DEEP16 pipeline 2 (generated art): the road to Deepholm's speakers who do not fight, walking -- a town figure each, in all eight facings.

    python tools/road-town-sheet.py [look ...]        (writes deep16/art/<look>.png/.json; no look: every one whose sources are sorted)
    python tools/road-town-sheet.py <look> check      (also the review sheet: every row of every drawn view at 3x, under deep16/art-src/<src>/)

Asked in art-wanted section 91 (11-19, the seat road-art-1119, on Griz's word: a town figure each for Ketil, Ulf, Thyra, Geir, Ragna, Gudrun and Dagny);
cut 11-20 by the cutter seat cutter-1120 on the lanes desk's start, his "a cutter can start on non-combatants". Each delivery is the art desk's
ART-1xx-<NAME>-...-TOWN-CUTTER-HANDOFF, sorted out of Fresh to deep16/_src/<name>/<batch>/ (the zip beside it): HEAD 01 S, 02 SE, 03 E, 04 the rear NE,
05 N -- PAGE 01 Idle 4, PAGE 02 Walk 8 -- under originals/. Its FRAME-MAP.csv gives each drawing its measured box on the original
(`source_bbox_xyxy_exclusive`, right and bottom exclusive): the box, widened by PAD, is the window, and the box itself keeps the drawing's own pieces
(a printed frame number outside the art falls away -- tools/vivian-sheet.py figure(), katarina_p2's way). The art desk's own reduction (its previews/) is
not used: the cut is ours, from the originals.

The cut is tools/vivian-sheet.py's, as Asdis's and Ingrith's: each idle page by its idle's median to TALL -- 38, a dwarf's, the trooper's beside whom the
art desk measured them (its "~40 px" counts the outline); the walk page matched to its view's idle (its notes: "a common scale per sheet", "preserve the
walk's small vertical variation"); SW W NW the mirrors of SE E NE (RULED 10-14; the notes: "a reflected runtime cell also reflects gear"); boxed down,
snapped to the 64 (fire left out, the trooper's way; red kept where a figure wears it -- Ulf's shield), outlined.
"""
import csv, importlib.util, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

PAD = 14


GAP, DOWN = 30, 6          # (source pixels: a braid or a heel may stand apart from the body; a printed number stands well below the feet -- tools/asdis-town-sheet.py)


def tight(d, fn, win):
    """a crop window drawn tight round the figure: the largest piece and the pieces near it (a printed number below, a speck beside, fall away) -- the drawing's
    own box in page terms, for a delivery whose map gives cells, not boxes (Thyra's ART-151)"""
    x0, y0, x1, y1 = win
    a = np.asarray(Image.open(os.path.join(d, fn)).convert('RGB').crop(win)).astype(np.float32)
    fl, n = ndimage.label(VS.figure(a))
    objs = ndimage.find_objects(fl)
    big = objs[int(np.argmax(ndimage.sum(fl > 0, fl, range(1, n + 1))))]
    ya, yb, xa, xb = big[0].start, big[0].stop, big[1].start, big[1].stop
    grew = True
    while grew:
        grew = False
        for o in objs:
            if o[0].start < yb + DOWN and o[0].stop > ya - GAP and o[1].start < xb + GAP and o[1].stop > xa - GAP:
                nb = (min(ya, o[0].start), max(yb, o[0].stop), min(xa, o[1].start), max(xb, o[1].stop))
                if nb != (ya, yb, xa, xb):
                    (ya, yb, xa, xb), grew = nb, True
    return (x0 + xa, y0 + ya, x0 + xb, y0 + yb)


def map_rows(d):
    """(file, view, row, frame number, box, is-a-window) from the delivery's frame map: Ulf's FRAME-MAP.csv (`source_bbox_xyxy_exclusive`, the drawing's box),
    Geir's FRAME-MAP.json (`pages` -> `frames` `source_box`, the drawing's box) or Thyra's (`pages` -> `frames` `window_xyxy`, a crop cell)"""
    if os.path.exists(os.path.join(d, 'FRAME-MAP.csv')):
        for r in csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8-sig')):
            if 'source_bbox_xyxy_exclusive' in r:
                yield r['file'], r['facing'], r['action'].lower(), int(r['frame']), tuple(int(v) for v in r['source_bbox_xyxy_exclusive'].split()), False
            elif 'source_file' in r and 'source_width' in r:                     # (Gudrun's ART-154, 11-21: source_x, source_y, source_width, source_height by `frame`,
                x, y, w, h = (int(r[k]) for k in ('source_x', 'source_y', 'source_width', 'source_height'))   # its "crop origins and crop sizes" -- the drawing's
                yield r['source_file'], r['facing'], r['action'].lower(), int(r['frame']), (x, y, x + w, y + h), False   # own box, as Dagny's)
            elif 'source_file' in r:                                             # (the sect's blade's ART-148: x0 y0 x1_exclusive y1_exclusive by `frame`, the
                yb = max(int(r['y1_exclusive']), int(float(r['source_row_baseline'])) + 4)   # drawing's own box, PAD its margin: read as a box -- tight() lost N Idle 2
                yield r['source_file'], r['facing'], r['action'].lower(), int(r['frame']), (int(r['x0']), int(r['y0']), int(r['x1_exclusive']), yb), False   # to its hood alone,
                # the dark cloak keying into ~45 pieces; its bottom at least the row's baseline, as S Walk 7's box stopped 20 px short of its boot; the numbers stand ~40 below)
            elif 'x1_exclusive' in r:                                            # (Hedda's ART-146: crop boxes, read as cells, by PLAYBACK frame -- its South Walk
                yield r['source'], r['facing'], r['action'].lower(), int(r['playback_frame']), tuple(int(r[k]) for k in ('x0', 'y0', 'x1_exclusive', 'y1_exclusive')), True   # plays printed 1 6 3 8 5 2 7 4)
            elif 'left' in r:                                                    # (Ragna's ART-153: "source crop bounds", left top right bottom -- read as cells)
                yield r['source'], r['facing'], r['action'].lower(), int(r['frame']), tuple(int(r[k]) for k in ('left', 'top', 'right', 'bottom')), True
            elif 'width' in r and 'target' not in r:                              # (Ketil's ART-149: x, y, width, height, its "isolated-window edges are approximate
                x, y, w, h = (int(r[k]) for k in ('x', 'y', 'width', 'height'))  # keying bounds" -- read as cells, the figure found in each by tight(); a dozen of
                m = 12                                                           # its windows touch the figure's edge, so each is widened by 12 first: the frames
                yield r['source'], r['facing'], r['action'].lower(), int(r['frame']), (x - m, y - m, x + w + m, y + h + m), True   # stand ~400 apart)
            elif r['target'] == os.path.basename(os.path.dirname(d)) + '_p1':     # (Dagny's: the ART-147/155 map shared with Torvald, `target` names the sheet;
                x, y, w, h = (int(r[k]) for k in ('source_x', 'source_y', 'source_width', 'source_height'))   # the drawing's box as x, y, width, height)
                yield r['source'], r['facing'], r['action'].lower(), int(r['frame']), (x, y, x + w, y + h), False
        return
    fm = json.load(open(os.path.join(d, 'FRAME-MAP.json'), encoding='utf-8'))
    if 'frames' in fm and 'pages' not in fm:                                     # (Brann's ART-145 town, 11-21: one list of frames, each its page under sources/,
        for f in fm['frames']:                                                   # a crop cell and `art_bounds`, the drawing's own box on the page; its S Idle,
            box = f.get('art_bounds') or f['crop']                               # the approved checkpoint, gives the cell alone: read as a cell, tight())
            yield 'sources/' + f['page'], f['facing'], f['action'].lower(), int(f['frame']), tuple(int(v) for v in box), 'art_bounds' not in f
        return
    for pg in fm['pages']:
        for f in pg['frames']:
            box = f.get('source_box') or f.get('window_xyxy')
            yield pg['source'], pg['facing'], pg['action'].lower(), int(f.get('frame') or f.get('number')), tuple(int(v) for v in box), 'source_box' not in f


def frame_windows(src, batch):
    """[(batch, view, row, frame index, file, window, box)] from the delivery's frame map"""
    d = os.path.join(VS.pix.SRC, src, batch)
    if not os.path.isdir(d):
        return []
    out, sizes = [], {}
    for fn, view, row, num, box, cell in map_rows(d):
        if fn not in sizes:
            sizes[fn] = Image.open(os.path.join(d, fn)).size
        W, H = sizes[fn]
        x0, y0, x1, y1 = tight(d, fn, box) if cell else box
        win = (max(0, x0 - PAD), max(0, y0 - PAD), min(W, x1 + PAD), min(H, y1 + PAD))
        out.append((batch, view, row, num - 1, fn, win, (x0, y0, x1, y1)))
    rows = {}
    for w in out:
        rows.setdefault((w[1], w[2]), []).append(w[3])
    for (view, row), ns in rows.items():                                    # (every number once, none skipped: Idle 4, Walk 8)
        assert sorted(ns) == list(range({'idle': 4, 'walk': 8}[row])), (src, view, row, sorted(ns))
    assert set(v for v, _ in rows) == set(VS.FACE), (src, sorted(rows))
    return out


def road(look, src, batch, name, art, hold, wear, avoid=('fire',), sec='91', their='his'):   # (`sec`, `their`: Brann's is art-wanted 88, Gudrun's figure hers -- 11-21)
    VS.LOOKS[look] = dict(
        src=src, windows=frame_windows(src, batch), tall=38, avoid=list(avoid), name=name,
        rows=[('idle', 4, 4), ('walk', 8, 8)], match={'walk': ('idle', 0)}, hold=hold,
        source='drawn by the art desk (%s, 11-19: art-wanted section %s, %s town figure in five views), cut by tools/road-town-sheet.py over '
               'tools/vivian-sheet.py; SW W NW mirrored; %s' % (art, sec, their, wear))


# Ulf Silversands, First Lamp (the art desk's ART-150; its notes: the garrison battleaxe at his right hip, the round red shield on his back toward the left
# shoulder, thumbs in the belt at idle). Not worn yet: the road's First Lamp is not on the grid (content/maps/highway_1.json has no Ulf).
road('ulf_p1', 'ulf', '2026-11-19-ART-150', 'Ulf', 'ART-150-ULF-SILVERSANDS-TOWN-CUTTER-HANDOFF',
     ['the mirrors (SW W NW) carry the axe to his left hip and the shield to the other shoulder, as every mirrored costume detail (the art desk\'s own note)',
      'the rear NE walk turns nearer a back view than its idle (the art desk\'s own note)'],
     'worn by no one yet: First Lamp is not on the grid')

# Thyra Silversands, Second Lamp (the art desk's ART-151; its notes: the compact steel warhammer at her right hip, the braid over her left shoulder, the shield
# strapped to her back; North Idle's shield "reads browner than North Walk" in its own diagnostic). Not worn yet: Second Lamp (content/maps/highway_2.json
# `thyra`, the first game's road) is not on the grid. Its map gives crop cells, not boxes: tight() finds her in each.
road('thyra_p1', 'thyra', '2026-11-19-ART-151', 'Thyra', 'ART-151-THYRA-SILVERSANDS-TOWN-CUTTER-HANDOFF',
     ['the mirrors (SW W NW) carry the hammer to her left hip and the braid to the other shoulder (the art desk\'s own note)',
      'North Idle\'s shield may read browner than North Walk\'s (the art desk\'s own note)'],
     'worn by no one yet: Second Lamp is not on the grid')

# Geir Silversands, Third Lamp (the art desk's ART-152; its notes: steel cap, pale pointed beard, red quilted sleeves under mail, the round red shield on his
# back, the short iron hammer at his right hip; he listens with a slight head tilt). Not worn yet: Third Lamp is not on the grid.
road('geir_p1', 'geir', '2026-11-19-ART-152', 'Geir', 'ART-152-GEIR-SILVERSANDS-TOWN-CUTTER-HANDOFF',
     ['the mirrors (SW W NW) carry the hammer to his left hip (the art desk\'s own note)',
      'E and rear NE are fresh redraws whose diagonal strides reach further than the trooper\'s (the art desk\'s own note)'],
     'worn by no one yet: Third Lamp is not on the grid')

# Dagny Scalebeam (the art desk's ART-155, delivered in one zip with Torvald's ART-147, which waits in Fresh for the combat art: her pages only copied out;
# its notes: the closed ledger in her left arm, Rekknar's brooch on her left shoulder; no weapon, in her clan's likeness, without furniture). Her pages hold
# Idle above Walk on one image a view (S its own two), so one scale a page. Not worn yet: the threshold (content/maps/threshold.json `dagny`) is not on the grid.
road('dagny_p1', 'dagny', '2026-11-19-ART-155', 'Dagny', 'ART-147-ART-155-TORVALD-DAGNY-TOWN-CUTTER-HANDOFF (her ART-155 pages)',
     ['the mirrors (SW W NW) carry the ledger to her right arm and the brooch to the other shoulder (the art desk\'s own note)',
      'Rekknar\'s brooch is a pixel or two at game size, as Asdis\'s'],
     'worn by no one yet: the threshold is not on the grid')

# Ragna Copperbottom, Solskaft's water captain (the art desk's ART-153, arrived in Fresh 11-20 while cutter-1120 worked: a non-combatant, his "a cutter can start on
# non-combatants"; its notes: unarmed, arms folded at idle, one braid forward on her right, a pocketed knee-length apron over work trousers). Not worn yet: her
# place in the first game's Solskaft (content/maps/solskaft.json `ragna`) has no stand in DEEP16's Solskaft (deep16/js/solskaft.js names no Ragna).
road('ragna_p1', 'ragna', '2026-11-19-ART-153', 'Ragna', 'ART-153-RAGNA-COPPERBOTTOM-TOWN-CUTTER-HANDOFF',
     ['the mirrors (SW W NW) carry her braid to her left (the art desk\'s own note)',
      'the rear NE walk turns nearer N than its idle (the art desk\'s own note)'],
     'worn by no one yet: DEEP16\'s Solskaft has no stand for her', avoid=('red', 'fire'))   # (no red on her: with the reds her copper hair and apron snapped red in E walk and N)

# Ketil Silversands, second at Solskaft's vault door (the art desk's ART-149, cut 11-20 by the cutter seat cutter-1120b; its notes: the garrison's battleaxe on
# his right, the pouch on his left, the round shield strapped to his back; its South Idle the approved redraw). The one of these the grid stands: SK.FOLK `ketil`
# beside Pyro at the vault doors (deep16/js/solskaft.js), on the garrison trooper's trooper_p1 till now. Its map (x, y, width, height) is read as cells.
road('ketil_p1', 'ketil', '2026-11-19-ART-149', 'Ketil', 'ART-149-KETIL-SILVERSANDS-TOWN-CUTTER-HANDOFF',
     ['the mirrors (SW W NW) carry the axe to his left and the pouch to his right (the art desk\'s own note)',
      'the rear NE walk turns nearer N than its idle (the art desk\'s own note)'],
     'worn at Solskaft\'s vault doors beside Pyro (SK.FOLK ketil)')


# THE ROAD'S FIGHTERS, THEIR TOWN FIGURES ONLY (11-20, cutter-1120, on the lanes desk's reading of Griz's "no images coming in after hedda til midnight my time so the
# cutter can close when it finishes what's in there": the hold on their town figures lifted; their fight sheets are not drawn and not cut here). None stands in
# DEEP16's code yet: the muster yard, the halls and the made road are not on the grid (Torvald's Pocket DM figure, torvald_p0, is his fight's and untouched).
# Halldor Silversands, the captain (the art desk's ART-144, art-wanted 88; its South Idle the approved redraw, the same bytes as ART-144-HALLDOR-SOUTH-IDLE-REDRAW's
# source; its notes: the round shield strapped to his back, the hammer looped at his right hip, his right hand resting on it at idle). Its map gives crop windows.
road('halldor_p1', 'halldor', '2026-11-19-ART-144/ART-144-HALLDOR-TOWN-CUTTER-HANDOFF', 'Halldor', 'ART-144-HALLDOR-TOWN-CUTTER-HANDOFF with its SOUTH-IDLE-REDRAW',
     ['the mirrors (SW W NW) carry the hammer to his left hip (the art desk\'s own note)'],
     'worn by no one yet: the muster yard and the halls are not on the grid')
# Hedda Greyseam (the art desk's ART-146, art-wanted 88; its notes: the round red shield centred on her back, the warhammer at her right hip; South Walk plays printed
# 1 6 3 8 5 2 7 4, read by its playback frame). Its rear NE Walk is on the art desk's own hold (the lead leg repeating at 1 and 5): cut as drawn, on the dream list.
road('hedda_p1', 'hedda', '2026-11-19-ART-146', 'Hedda', 'ART-146-HEDDA-GREYSEAM-TOWN-CUTTER-HANDOFF',
     ['the rear NE walk repeats its lead leg at 1 and 5: on the art desk\'s own hold, cut as drawn (deep16-dream-polish.md)',
      'the E walk\'s lead switch is hard to read where the legs overlap; the N idle shows a rear belt buckle (the art desk\'s own notes)',
      'the mirrors (SW W NW) carry the hammer to her left hip (the art desk\'s own note)'],
     'worn by no one yet: the muster yard and the halls are not on the grid')
# Torvald Greyseam, cleric of Dvalgarda (the art desk's ART-147, art-wanted 89; delivered with Dagny's ART-155, his pages copied out; its notes: the travelling cloak,
# backpack, bedroll and belted mace, Dvalgarda's dark iron disc a small chest token).
road('torvald_p1', 'torvald', '2026-11-19-ART-147', 'Torvald', 'ART-147-ART-155-TORVALD-DAGNY-TOWN-CUTTER-HANDOFF (his ART-147 pages)',
     ['Dvalgarda\'s sign on his chest is a pixel or two at game size',
      'the mirrors (SW W NW) carry the mace and the pack\'s asymmetry to the other side (the art desk\'s own note)'],
     'worn by no one yet: the made road is not on the grid; his fights wear torvald_p2 (ART-147-COMBAT, 11-21)')
# The sect's blade, both of the two at the rest after Torvald (the art desk's ART-148, art-wanted 89, cut 11-20 by cutter-1120b on the lanes desk's message, his
# "there's stuff in Fresh"; its notes: a sheathed shortsword at each hip, the far one lost behind the body in E, the brooch on the right shoulder, a cape and strap
# seen from behind). Worn by no one yet: the made road is not on the grid; its fight sheet (sectblade_p2) is asked, not drawn; their fights keep assassin_p1.
road('sectblade_p1', 'sectblade', '2026-11-20-ART-148', 'Sect blade', 'ART-148-SECT-BLADE-TOWN-CUTTER-HANDOFF',
     ['the mirrors (SW W NW) carry the brooch to the other shoulder (the art desk\'s own note)',
      'the rear NE walk overlaps its boots at 1 and 5 and jumps a little at 8 to 1 (the art desk\'s own note)'],
     'worn by no one yet: the made road is not on the grid; their fights keep assassin_p1')
# Brann Silversands, the young trooper (the art desk's ART-145 town, art-wanted 88's last block; cut 11-21 by the cutter seat cutter-1121 on Griz's "fresh isn't
# empty, more incoming as well"; its notes: the axe rests on its butt at his right side at idle and rides his right shoulder walking, no shield). Its FRAME-MAP.json
# lists frames with `art_bounds`, each drawing's own box. Worn by no one yet: the muster yard and the halls are not on the grid; he fights in brann_p2.
road('brann_p1', 'brann', '2026-11-21-ART-145-TOWN', 'Brann', 'ART-145-BRANN-SILVERSANDS-TOWN-CUTTER-HANDOFF',
     ['the E walk\'s lead switch is hard to verify under the boot overlap, and the rear NE walk\'s 1 and 5 read too alike: both on the art desk\'s own gait-review flag, cut as drawn',
      'the mirrors (SW W NW) carry the axe to his left shoulder (the art desk\'s own note: the runtime mirrors)'],
     'worn by no one yet: the muster yard and the halls are not on the grid; he fights in brann_p2', sec='88')
# Gudrun Tallowmark, the cook and provisioner of the Lamp Stores at Second Lamp (the art desk's ART-154, art-wanted 91; the same seat and word; its notes: the ochre
# kerchief, the plum blouse, the brown bib apron over a dark skirt, her hands on the apron at idle). Its FRAME-MAP.csv gives each drawing's own box as x, y, width,
# height. Worn by no one yet: Second Lamp's stores are not on the grid.
road('gudrun_p1', 'gudrun', '2026-11-21-ART-154', 'Gudrun', 'ART-154-GUDRUN-TALLOWMARK-TOWN-CUTTER-HANDOFF',
     ['the rear NE walk is on the art desk\'s own hold for gait review (frame 5 reverses the arms, the trailing boot repeats frame 1\'s lead), and SE\'s lead changes are subtle under the long hem: cut as drawn',
      'the plum blouse snaps brown in the game\'s 64, as on her portrait'],
     'worn by no one yet: Second Lamp\'s stores are not on the grid', their='her')


if __name__ == '__main__':
    import sys
    for lk in [a for a in sys.argv[1:] if a in VS.LOOKS] or [k for k in VS.LOOKS if VS.LOOKS[k].get('windows') and k.endswith('_p1') and VS.LOOKS[k].get('src') in ('ulf', 'thyra', 'geir', 'dagny', 'ragna', 'halldor', 'hedda', 'torvald', 'ketil', 'sectblade', 'brann', 'gudrun')]:
        VS.cut(lk)

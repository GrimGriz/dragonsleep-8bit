"""DEEP16 pipeline 2 (generated art): the Dominion's dragger fighting -> dragger_p2, all eight facings.

    python tools/dragger-sheet.py            (writes deep16/art/dragger_p2.png/.json)
    python tools/dragger-sheet.py check      (also the review sheet: every row of every facing at 3x, deep16/art-src/dragger/dragger_p2-review.png)
    python tools/dragger-sheet.py frames     (prints each frame's box, ground line and crown on its page: the cutter's own check)

    THEN python tools/pike-wall-sheet.py: this writes dragger_p2 whole, and the pike wall's `keepback` and `shove` (ART-166, 11-25) are added by that tool.

Asked in art-wanted section 95 (11-21, the pose seat pose-1121, on his "Dominion will have both as well"): the Dominion's dragger, the pikeman in gladiator
harness -- the pike thrust along the hip (GUIDE-2026-11-21-pike-thrust-human) and the Pike Rank with the feet planted (GUIDE-2026-11-21-pike-rank-human).
Drawn by the art desk as ART-159 (its page 4, the fight sheet), landed in Fresh 11-24, sorted to deep16/_src/dragger/2026-11-24-ART-159-COMBAT/ (the zip beside
it); cut 11-24 by the cutter seat cutter-1124. Its CUTTER-NOTES: five views drawn, SW W NW the mirrors of SE E NE (RULED 10-14); Idle 4, Walk 8, Attack 8,
Pike Rank 6, Flinch 4, Fall 6; the Attack and the Pike Rank release on frame 4 (`release` 3, the house's); Prone the held sixth Fall frame; impact effects the
engine's. Its FRAME-MAP.csv gives each frame a candidate box (`source_x/_y/_width/_height`) -- the notes call them diagnostic but for the approved SE Attack --
and no ground line or scale.

The cut, over tools/vivian-sheet.py (the fight sheets' way since tools/trooper-fight-sheet.py): each frame is the page's pieces that its candidate box
touches -- the drawing whole wherever the pike runs, checked to lie inside every box -- less the printed frame numbers (cream glyphs, two of which sit inside
N Attack 1's and 7's boxes). In S the pike drives at the viewer and its head hangs past his boots; in N its tip rises over his head: so each frame stands on
its BOOTS (the lowest run of a boot's colours, ground() -- the spearhead's steel is lighter and greyer), and a figure's height is measured
crown to boots with the crown the first row at least CROWN wide (vivian-sheet's `tallground` and `crownw`). The idle pages by their idle to TALL, the art
desk's ~53 standing (its approved SE Attack's own preview: 53 crown to sole; cut, that page's scale comes to 0.204 against the preview's 0.20), checked beside
guard_p2, the Line Guard, on one floor line in all five views; every other page scaled
to its view's idle page by frame 1's crown to boots, but the Walk (drawn leaning, short for its head) and the Flinch by that and the head's width together
(windows()'s PS). The Walk alone stands by its page's cells, not each frame's boots (CELLREG: the art desk kept his crown level and
the feet rise; on their own boots S's frames would bob ~5 px). The cell is guard_p2's, 96 high with the foot on 76 -- room for N's raised pike.
"""
import csv, importlib.util, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)
VS.FH, VS.AY = 96, 76          # (guard_p2's cell: the N pike raised over his head)

SRC, BATCH = 'dragger', '2026-11-24-ART-159-COMBAT'
N = {'idle': 4, 'walk': 8, 'attack': 8, 'pikerank': 6, 'flinch': 4, 'hurt': 6, 'prone': 1}
TALL = 52     # (crown row to the boots; the hair's narrow top adds one: he stands 53 to 55 at the crown beside guard_p2's 49 to 50 under its helmet, 11-24)
CROWN, BOOT, PAD = 30, 6, 4      # (source px: a boot seen from behind tapers to a heel 6 to 10 wide at its last rows)
CELLREG = {'walk'}               # (rows registered by their page's cells, not each frame's boots: windows())
HEAD = 45                        # (source px under the crown where the head's width is read: the hair)
HEADS = {}                       # ((view, row, i): (page, crown to boots, head width), source px -- windows())
TWORULERS = {'walk', 'flinch'}   # (pages scaled by height and head together, not height alone -- windows())
BGTOL = 20                       # (the matte: at the house's 30 his dark hair and shadowed neck keyed out with the navy in NE and N -- a band of floor through
                                 #  his head in the Attack and the Pike Rank; Tobin's and Hask's tolerance)


def page_mask(a):
    bg = np.median(np.concatenate([a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3), a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3)]), axis=0)
    near = np.linalg.norm(a - bg, axis=2) < BGTOL
    lab, n = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(near, lab, range(1, n + 1))
    return ~(np.isin(lab, list(edge)) | np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > VS.HOLE]))


def is_label(a, lab, i, o, s):
    """a printed frame number: a small piece of cream, never part of the figure (the figure's lightest -- the spearhead's steel -- is grey, not cream)"""
    if s > 600 or (o[0].stop - o[0].start) > 34 or (o[1].stop - o[1].start) > 30:
        return False
    px = a[o][lab[o] == i]
    return bool(px.mean(0).min() > 150 and (px[:, 0] - px[:, 2]).mean() > 12)


def ground(a, m):
    """the boots' line: the lowest row with a run of the figure at least BOOT wide in a boot's colours -- brown leather (saturation 0.36 or more) or the
    near-black sole (brightest channel under 75). In S the pike's head hangs past his boots: its steel is light and warm-grey (saturation about 0.32, the
    brightest channel 150 to 200), each row of it one run between the boots."""
    for r in range(m.shape[0] - 1, -1, -1):
        d = np.diff(np.concatenate([[0], m[r].astype(np.int8), [0]]))
        for s, e in zip(np.where(d == 1)[0], np.where(d == -1)[0]):
            if e - s < BOOT:
                continue
            c = a[r, s:e].mean(0); mx = c.max()
            if mx < 75 or (mx - c.min()) >= 0.36 * mx:
                return r
    raise ValueError('no boots')


def steel(c):
    """a run's mean colour is the spearhead's steel: light and warm-grey (saturation under 0.34, the brightest channel over 110) -- his hair, skin and
    leather are browner or darker"""
    mx = c.max()
    return mx > 110 and (mx - c.min()) < 0.34 * mx


def head(a, m):
    """(crown row, head width): the crown the first row with a run at least CROWN wide that is not steel (NE's Flinch raises the spearhead over his hair,
    wide enough to pass for a crown); the width the widest single run through that run's middle in the HEAD rows from a few above it -- the hair"""
    c = cx = None
    for r in range(m.shape[0]):
        d = np.diff(np.concatenate([[0], m[r].astype(np.int8), [0]]))
        for s, e in zip(np.where(d == 1)[0], np.where(d == -1)[0]):
            if e - s >= CROWN and not steel(a[r, s:e].mean(0)):
                c, cx = r, (s + e) // 2
                break
        if c is not None:
            break
    best = 0
    for r in range(max(0, c - 8), min(m.shape[0], c + HEAD)):
        d = np.diff(np.concatenate([[0], m[r].astype(np.int8), [0]]))
        for s, e in zip(np.where(d == 1)[0], np.where(d == -1)[0]):
            if s <= cx < e:
                best = max(best, e - s)
    return c, best


_PAGES = {}
PS = {}        # (each page's scale against its view's idle page: filled by windows())


def windows():
    d = os.path.join(VS.pix.SRC, SRC, BATCH)
    if not os.path.isdir(d):
        return []
    rows = list(csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8-sig')))
    out, seen = [], {}
    for r in rows:
        fn = r['source']
        if fn not in _PAGES:
            a = np.asarray(Image.open(os.path.join(d, fn)).convert('RGB')).astype(np.float32)
            m = page_mask(a)
            lab, n = ndimage.label(m, structure=np.ones((3, 3)))
            objs = ndimage.find_objects(lab); sz = ndimage.sum(m, lab, range(1, n + 1))
            drop = {i + 1 for i, (o, s) in enumerate(zip(objs, sz)) if is_label(a, lab, i + 1, o, s)}
            _PAGES[fn] = (a, lab, drop)
        a, lab, drop = _PAGES[fn]
        x, y = int(r['source_x']), int(r['source_y'])
        bx = (x, y, x + int(r['source_width']), y + int(r['source_height']))
        ids = set(np.unique(lab[bx[1]:bx[3], bx[0]:bx[2]])) - {0} - drop
        fm = np.isin(lab, list(ids))
        ys, xs = np.where(fm)
        tb = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)          # (the drawing's own box: every piece the candidate box touches)
        win = (max(0, tb[0] - PAD), max(0, tb[1] - PAD), min(a.shape[1], tb[2] + PAD), min(a.shape[0], tb[3] + PAD))
        g = tb[1] + ground(a[tb[1]:tb[3], tb[0]:tb[2]], fm[tb[1]:tb[3], tb[0]:tb[2]]) + 1  # (exclusive, as the other maps' sole lines)
        row, i = r['action'], int(r['runtime_index'])
        if row != 'prone':
            hc, hw = head(a[tb[1]:tb[3], tb[0]:tb[2]], fm[tb[1]:tb[3], tb[0]:tb[2]])
            HEADS[(r['facing'], row, i)] = (fn, g - tb[1] - hc, hw)                      # (crown to boots, head width; source px)
        if row == 'prone':
            src = seen[(r['facing'], 'hurt', 5)]
            assert src[4] == fn, (r, src)                                                 # (the held sixth Fall frame: its own page)
            out.append(src[:2] + ('prone', 0) + src[4:])
            continue
        w = (BATCH, r['facing'], row, i, fn, win, tb, g)
        seen[(r['facing'], row, i)] = w; out.append(w)
    # THE WALK BY ITS CELL: each walk page is a grid of 4 x 2 cells (1774 x 887), and the art desk kept his crown and the pike level across all eight while
    # the feet rise and fall (S 3-4 and 7-8 most: both boots 30 source px up). On its own boots each frame would bob the whole body ~5 px; so every walk
    # frame stands where its cell puts it -- frame 1's boots, plus one cell's height for the second band (frame 1's line plus 443.5 lands within 2 px of
    # frame 5's own boots in all five views).
    for i, w in enumerate(out):
        if w[2] in CELLREG:
            ph = _PAGES[w[4]][0].shape[0]
            f0 = seen[(w[1], w[2], 0)]
            band = lambda v: int(round(v[6][1] / (ph / 2.0) - 0.25))   # (the band a box's top sits in: 0 or 1)
            out[i] = w[:7] + (int(round(f0[7] + (band(w) - band(f0)) * ph / 2.0)),)
    got = {}
    for w in out:
        got.setdefault((w[1], w[2]), []).append(w[3])
    for (v, rw), ns in got.items():
        assert sorted(ns) == list(range(N[rw])), (v, rw, sorted(ns))                       # (every number once, none skipped)
    assert set(v for v, _ in got) == {'S', 'SE', 'E', 'NE', 'N'}, sorted(got)
    # THE PAGES' SCALES, each against its view's idle page (vivian-sheet's `pagescale`), by frame 1 against the idle's frame 1. Each page is its own
    # ImageGen call at its own size. By his crown to his boots where frame 1 is the idle's own ready stance -- the Attack and the Pike Rank (the art desk's
    # approved SE Attack registers at the idle's 53, and this ruler gives it) -- and the Fall (the pike before his face spoils a head read). The WALK is
    # drawn leaning into the march, short for its head (S's 74% of the idle's height on the same head): by height alone his head and shoulders grew 37%
    # when he walked south, by head alone he would duck 13 px -- so the walk by the geometric mean of the two; the Flinch too, where the two agree.
    for v in ('S', 'SE', 'E', 'NE', 'N'):
        ip = HEADS[(v, 'idle', 0)][0]
        PS[(BATCH, ip)] = 1.0
        ih, iw = HEADS[(v, 'idle', 0)][1:]
        for rw in N:
            if rw in ('idle', 'prone'):
                continue
            pg, h1, w1 = HEADS[(v, rw, 0)]
            k = ih / float(h1)
            if rw in TWORULERS:
                k = (k * iw / float(w1)) ** 0.5     # (frame 1's head: later frames cross the pike before his face -- NE's Flinch)
            PS[(BATCH, pg)] = k
    return out


VS.LOOKS['dragger_p2'] = dict(src=SRC, windows=windows(), name='Dragger', trim=False, tall=TALL, tallground=True, crownw=CROWN, avoid=['fire'], pagescale=PS,
    bgtol=BGTOL,
    match={'walk': ('idle', 0), 'attack': ('idle', 0), 'pikerank': ('idle', 0), 'flinch': ('idle', 0), 'hurt': ('idle', 0)},
    ground={('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)},
    rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('pikerank', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    release={'attack': 3, 'pikerank': 3},
    hold=['pikerank: played where his pike strikes through a set wall or over the rank in front (js/battle.js attack, F.pikeThrough), as trooperpike_p2\'s',
          'attack: the pike thrust along the hip, contact on frame 4; NE: the cuff and hand continuity across the thrust (the art desk\'s own note)',
          'pikerank: the planted contacts; NE the thrust grip and the rear boot, N frame 4 the rear boot at the planted anchor (the art desk\'s own notes)',
          'walk: stands by its cells, his crown level and the feet rising (S 3-4 and 7-8 most); drawn leaning, short for its head, scaled between the two rulers; the lead foot changes to be judged in playback (the art desk\'s own note)',
          'hurt: the opening Fall frames bring the pike upright off the idle\'s level and keep it in hand through the collapse (the art desk\'s own note)',
          'flinch: NE raises the pike steeply off the idle\'s angle (the art desk\'s own "check the pike angle at the return to Idle")',
          'prone: the last Fall cel held'],
    source='drawn by the art desk (ART-159, 11-24: art-wanted section 95, the Dominion\'s dragger with the pike in gladiator harness in five views, the thrust and '
           'the Pike Rank over the mannequin\'s human guides), cut by tools/dragger-sheet.py over tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    if 'frames' in sys.argv:
        for w in VS.LOOKS['dragger_p2']['windows']:
            print(w[1], w[2], w[3], 'box', w[6], 'ground', w[7], 'below the boots', w[6][3] - w[7], 'crown to boots, head', HEADS.get(w[1:4], ('', '-', '-'))[1:])
        for (b, pg), k in sorted(PS.items()):
            print('pagescale', pg, round(k, 4))
    else:
        VS.cut('dragger_p2')

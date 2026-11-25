"""DEEP16 pipeline 2 (generated art): the Dominion's mender fighting -> mender_p2, all eight facings; and the page reader the patrol's later cuts share.

    python tools/mender-sheet.py            (writes deep16/art/mender_p2.png/.json)
    python tools/mender-sheet.py check      (also the review sheet, deep16/art-src/mender/mender_p2-review.png)
    python tools/mender-sheet.py frames     (each frame's box, boots, crown to boots and head on its page, each page's scale, every loose piece joined)
    python tools/mender-sheet.py overlay    (each page with its frames tinted, at a third, to deep16/art-src/mender/overlay/: the cutter's own check)

Asked in art-wanted section 100 (11-24, the seat dominion-1124, on his "request dominion sergeant and cleric art"): the patrol's cleric, the Glass-Cleric of his page
The Fare Home, with the small mirror on a cord and a mace "She would rather not". Drawn by the art desk as ART-164 (its CUTTER-REVIEW package, landed in Fresh 11-25,
sorted to deep16/_src/mender/2026-11-25-ART-164-COMBAT/, the zip beside it); cut 11-25 by the cutter seat cutter-1125. Its CUTTER-NOTES: HEAD 1 S, 2 SE, 3 E, 4
rear NE, 5 N, SW W NW the mirrors (RULED 10-14); a page an action: Idle 4, Walk 8, Attack 6 (the mace home on frame 3), Cast 6 (the mirror held out on 4), Cast Up 6
(the mirror lifted overhead on 4), Flinch 4, Fall 6 (the mace let go: hurt), Prone 1; spell effects the engine's. katarina_p2's shape (the ask), with both casts
drawn apart where Katarina's are one.

WHAT IS HELD (its art-hold/: "No art-hold file is a selected production source"): the SE, E, NE and N Walks (frames 1 and 5 the same lead) and N Prone (propped
higher than Fall 6). Not cut: N Prone is N Fall 6 held, as the notes say ("Hold Fall 6 at the transition if a temporary fallback is needed"); the walk is S's own
drawn walk, and in SE, E, NE and N (and their mirrors) her own idle, played through twice, so she glides facing the way she goes till the redraws come
(WALK_IDLE). THE REDRAWS CAME 11-25 (art-wanted 105; ART-164's CUTTER-HANDOFF, its "November 25 art repairs"): the four Walks and N Prone sorted into the same
batch by the cutter seat cutter-1125b (the held pages and the old FRAME-MAP to its superseded/), cut as drawn; WALK_IDLE and HELD_PRONE empty.

THE READER (read_page; tools/dmsergeant-sheet.py borrows it): its FRAME-MAP.csv names each page's action, count and printed bands but gives no boxes, so each
page is read whole: tools/dominion-sheet.py drawings() -- the matte at BGTOL, the printed title and frame numbers dropped (cream glyphs), the pieces within 6 px
one drawing -- then the n biggest drawings are the frames, in reading order (bands by their middles, then left to right), and every other piece goes to the
nearest frame within JOIN source px (a sword's tip parted from its blade), but printed text -- ART-164 prints each frame's name beside its number, "1 READY",
too wide for dragger-sheet's glyph test -- a loose piece light and grey (TEXT). Each upright frame stands on its boots
(tools/dragger-sheet.py ground()); a lying one (LYING) on its lowest row, its middle by its whole body. Scale: the idle page by its idle to TALL (47 -- Katarina's,
the menders "made in the same halls", and the inn's women); every other page to its view's idle page by frame 1's crown to boots (tools/dominion-sheet.py
scales(), dragger-sheet head(): the crown the first run CROWN wide that is not steel); her drawn prones by their width to their Fall 6 (katarina_p2's way).
"""
import csv, importlib.util, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_old = sys.argv; sys.argv = sys.argv[:1]                       # (dragger-sheet and dominion-sheet read argv at import: they must not act on ours)
_sp = importlib.util.spec_from_file_location('dominion_sheet', os.path.join(ROOT, 'tools', 'dominion-sheet.py'))
DM = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(DM)
sys.argv = _old
DG, VS = DM.DG, DM.VS            # (VS.FH, VS.AY: guard_p2's 96 and 76, as dragger-sheet set them -- the patrol's sheets share the Line Guard's cell)
VIEWS = ('S', 'SE', 'E', 'NE', 'N')
LYING = {('hurt', 3), ('hurt', 4), ('hurt', 5), ('prone', 0)}
JOIN = 80        # (source px: a loose piece farther than this from every frame is left out, and named)
TEXT = 110       # (a loose piece this light at its darkest channel, and grey, is printed text)
RULE = (4, 400)  # (source px: a loose piece at most 4 thin and at least 400 long is a printed rule, never a frame's -- 11-25b, cutter-1125b)


def is_text(px, h):
    """a piece's pixels and height: printed words and numbers -- "1 READY", the page's title, a frame's number. Cream, wider than dragger-sheet is_label's
    glyph; ART-164's 125 to 160 at its darkest channel on the mean; ART-163's digits under a tighter matte keep their dark rim, 102 to 166 on the mean, 177 or
    more at the 75th percentile, up to 46 tall, a warm cream at most 49 from grey -- and never bluer than red, where a blade's steel is"""
    c = px.mean(0)
    return h <= 50 and c[0] >= c[2] and (px.max(1) - px.min(1)).mean() < 55 and (c.min() >= TEXT or np.percentile(px.min(1), 75) >= 160)


def untext(a, d, bx, notes):
    """(mask, box) of a drawing with the printed text inside it dropped: a number printed within 6 px of the boots is grouped into the frame's drawing
    (ART-163's walks and attacks); the drawing's biggest piece is never text"""
    lab, n = ndimage.label(d, structure=np.ones((3, 3)))
    if n < 2:
        return d, bx
    big = 1 + int(np.argmax(ndimage.sum(d, lab, range(1, n + 1))))
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        piece = lab[sl] == i
        if i != big and is_text(a[sl][piece], sl[0].stop - sl[0].start):
            d[sl] &= ~piece
            notes.append('text in a frame: %d px at %s' % (int(piece.sum()), (sl[1].start, sl[0].start, sl[1].stop, sl[0].stop)))
    ys, xs = np.where(d)
    return d, (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def read_page(path, n):
    """(page, {i: (mask, box)}, notes): the page's n frames in reading order, each with the loose pieces nearest it"""
    a, ds = DM.drawings(path)
    notes = []
    ds = [untext(a, d, bx, notes) for d, bx in ds]
    ds = sorted(ds, key=lambda t: -int(t[0].sum()))
    if len(ds) < n:
        raise SystemExit('%s: %d drawings, %d wanted' % (path, len(ds), n))
    main, rest = ds[:n], ds[n:]
    mids = sorted(main, key=lambda t: (t[1][1] + t[1][3]) / 2.0)
    bands, cur = [], [mids[0]]
    for t in mids[1:]:
        ref = cur[-1][1]
        if (t[1][1] + t[1][3]) / 2.0 - (ref[1] + ref[3]) / 2.0 > 0.5 * (ref[3] - ref[1]):
            bands.append(cur); cur = [t]
        else:
            cur.append(t)
    bands.append(cur)
    got = [list(t) for b in bands for t in sorted(b, key=lambda t: t[1][0])]
    notes.insert(0, 'smallest frame %d px, biggest loose piece %d px' % (min(int(d.sum()) for d, _ in main), max([int(d.sum()) for d, _ in rest] or [0])))
    for d, bx in rest:
        if min(bx[2] - bx[0], bx[3] - bx[1]) <= RULE[0] and max(bx[2] - bx[0], bx[3] - bx[1]) >= RULE[1]:
            notes.append('rule line: %d px at %s' % (int(d.sum()), bx))     # (a band's seam: ART-163's 11-25 walk redraws, two bands pasted, a hairline the page wide)
            continue
        if is_text(a[d], bx[3] - bx[1]):
            notes.append('text: %d px at %s' % (int(d.sum()), bx))
            continue
        gap =[max(0, b[0] - bx[2], bx[0] - b[2]) + max(0, b[1] - bx[3], bx[1] - b[3]) for _, b in got]
        j = int(np.argmin(gap))
        if gap[j] > JOIN:
            notes.append('left out: %d px at %s (%d px from frame %d)' % (int(d.sum()), bx, gap[j], j + 1))
            continue
        m0 = got[j][0] | d; ys, xs = np.where(m0)
        got[j] = [m0, (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)]
        notes.append('joined: %d px at %s to frame %d' % (int(d.sum()), bx, j + 1))
    return a, {i: tuple(g) for i, g in enumerate(got)}, notes


def windows(src, batch, plan, N, heads, held_prone=(), walk_idle=(), notes=None, overlay=None, crowns=False):
    """vivian-sheet windows (batch, view, row, i, file, window, drawing's box, ground line or None) for every frame of `plan` -- [(view, row, file)];
    `held_prone`: the views whose prone is their Fall 6 held; `walk_idle`: the views whose walk is their idle played twice. `heads` gets each frame's
    (page, crown to boots, head width), source px, for scales(). `crowns`: each window carries its crown's row too (vivian-sheet's 9th, the
    sergeant's -- dragger-sheet head(), the first run CROWN wide that is not steel), None where the frame lies"""
    d0 = os.path.join(VS.pix.SRC, src, batch)
    out, seen = [], {}
    for view, row, fn in plan:
        a, got, nt = read_page(os.path.join(d0, fn), N[row])
        if notes is not None:
            notes[fn] = nt
        if overlay is not None:
            overlay(fn, a, got)
        for i in range(N[row]):
            d, bx = got[i]
            x0, y0, x1, y1 = bx
            win = (max(0, x0 - DG.PAD), max(0, y0 - DG.PAD), min(a.shape[1], x1 + DG.PAD), min(a.shape[0], y1 + DG.PAD))
            sa, sm = a[y0:y1, x0:x1], d[y0:y1, x0:x1]
            g = None if (row, i) in LYING else y0 + DG.ground(sa, sm) + 1
            hc, hw = DG.head(sa, sm)
            heads[(view, row, i)] = ((batch, fn), (g if g is not None else y1) - y0 - hc, hw)
            w = (batch, view, row, i, fn, win, bx, g) + (((y0 + hc) if g is not None else None,) if crowns else ())
            seen[(view, row, i)] = w; out.append(w)
    for v in held_prone:
        out.append(seen[(v, 'hurt', 5)][:2] + ('prone', 0) + seen[(v, 'hurt', 5)][4:])
    for v in walk_idle:
        for i in range(N['walk']):
            out.append(seen[(v, 'idle', i % N['idle'])][:2] + ('walk', i) + seen[(v, 'idle', i % N['idle'])][4:])
    got = {}
    for w in out:
        got.setdefault((w[1], w[2]), []).append(w[3])
    for (v, rw), ns in got.items():
        assert sorted(ns) == list(range(N[rw])), (v, rw, sorted(ns))   # (every number once, none skipped)
    for rw in N:
        assert set(v for v, r in got if r == rw) == set(VIEWS), (rw, sorted(v for v, r in got if r == rw))
    return out


def overlay_to(folder):
    """an overlay writer for windows(): each page at a third, its frames tinted in turn and numbered by their order"""
    os.makedirs(folder, exist_ok=True)
    def put(fn, a, got):
        o = (a * 0.3).astype(np.uint8)
        for i, (d, bx) in got.items():
            o[d] = (a[d] * 0.4 + np.array(HUES[i % len(HUES)]) * 0.6).astype(np.uint8)
        im = Image.fromarray(o).resize((a.shape[1] // 3, a.shape[0] // 3), Image.BOX)
        im.save(os.path.join(folder, os.path.basename(fn)), optimize=True)
    return put


HUES = [(255, 90, 90), (90, 220, 90), (90, 140, 255), (240, 210, 60), (230, 90, 230), (60, 220, 220), (255, 150, 40), (180, 180, 255)]


# ---------------------------------------------------------------- the mender
SRC, BATCH = 'mender', '2026-11-25-ART-164-COMBAT'
N = {'idle': 4, 'walk': 8, 'attack': 6, 'cast': 6, 'castup': 6, 'flinch': 4, 'hurt': 6, 'prone': 1}
TALL = 47
BGTOL = int(os.environ.get('MENDER_BGTOL', '20'))
WALK_IDLE = ()          # (11-25b: SE, E, NE and N Walks redrawn -- art-wanted 105; till then her idle stood in, facing the way she went)
HELD_PRONE = ()         # (11-25b: N Prone redrawn from its Fall 6 crop; till then N Fall 6 stood in)
HEADS, NOTES = {}, {}


def plan():
    """[(view, row, file)] from the FRAME-MAP: every page not held"""
    rows = list(csv.DictReader(open(os.path.join(VS.pix.SRC, SRC, BATCH, 'FRAME-MAP.csv'), encoding='utf-8-sig')))
    pages = {}
    for r in rows:
        if r['status'] == 'art-hold':
            continue
        pages[(r['facing'], r['engine_row'], r['file'])] = 1
    return sorted(pages, key=lambda p: (VIEWS.index(p[0]), list(N).index(p[1])))


def register(overlay=False):
    global _W, PS
    DG.BGTOL = BGTOL
    ov = overlay_to(os.path.join(ROOT, 'deep16', 'art-src', SRC, 'overlay')) if overlay else None
    _W = windows(SRC, BATCH, plan(), N, HEADS, held_prone=HELD_PRONE, walk_idle=WALK_IDLE, notes=NOTES, overlay=ov) \
        if os.path.isdir(os.path.join(VS.pix.SRC, SRC, BATCH)) else []
    PS = DM.scales(HEADS, N, two=()) if _W else {}
    VS.LOOKS['mender_p2'] = dict(LOOK, windows=_W, pagescale=PS)


AVOID = ['fire', 'blue', '#14171e', '#20252f', '#313846']   # (the 64 have no plum: her robe snapped to the silver ramp's three darkest and the blue's, a navy
                                                            #  dress -- SE and NE Prone bluer than their Fall 6; without them it keeps the art desk's plum-brown,
                                                            #  violet in the folds, and the mace and mirror keep silver's lighter greys)
LOOK = dict(src=SRC, name='Mender', trim=False, tall=TALL, avoid=AVOID, bgtol=BGTOL,
    match=dict({r: ('idle', 0) for r in N if r not in ('idle', 'prone')}, prone=('hurt', 5, 0, 'w')),   # (every page's scale set by PS but her drawn prones,
    ground=LYING,                                                                                         #  by their width to their Fall 6)
    rows=[('idle', 4, 4), ('walk', 10, 8), ('attack', 10, 6), ('cast', 10, 6), ('castup', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    release={'attack': 2, 'cast': 3, 'castup': 3},
    hold=['walk: all five drawn -- SE, E, NE and N the art desk\'s 11-25 redraws (art-wanted 105), 1 and 5 opposite leads; check the cadence at the loop seam '
          '(its own note)',
          'prone: all five drawn, matched by width to their Fall 6 -- N redrawn 11-25 from its Fall 6 crop, the mace beside the right hand',
          'attack: the mace home on frame 3 (`release` 2, as katarina_p2\'s)',
          'cast: the mirror held out on its cord on frame 4; castup: the mirror lifted overhead on 4 -- no glow drawn, the engine\'s spells are the light',
          'the mirror\'s cord is fine at game size: check it reads (the art desk\'s own note)'],
    source='drawn by the art desk (ART-164, 11-25: art-wanted section 100, the Dominion\'s mender, her mace and her mirror on its cord, in five views), cut by '
           'tools/mender-sheet.py over tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    register(overlay='overlay' in sys.argv)
    if 'frames' in sys.argv:
        for w in _W:
            h = HEADS.get(w[1:4])
            print(w[1], w[2], w[3], 'box', w[6], 'boots', w[7], 'crown-to-boots', h[1] if h else '-', 'head', h[2] if h else '-')
        for pg, k in sorted(PS.items()):
            print('pagescale', pg[1], round(k, 4))
        for fn, nt in sorted(NOTES.items()):
            print(fn, '|', '; '.join(nt))
    elif 'overlay' not in sys.argv:
        VS.cut('mender_p2')

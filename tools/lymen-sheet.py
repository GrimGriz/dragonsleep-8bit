"""DEEP16 pipeline 2 (generated art): Lymen's fight sheet, drawn -> lymen_p2, all eight facings: what retires the LPC figure lymen_p0.

    python tools/lymen-sheet.py            (writes deep16/art/lymen_p2.png/.json)
    python tools/lymen-sheet.py check      (also deep16/art-src/lymen/lymen_p2-review.png, every row of S SE E NE N at 3x, and
                                            lymen_p2-walk-candidates.png, the SE E NE walk as first drawn over the retry strip)

11-13, the cutter of the 1113c seat, on the lanes desk's relay of Griz: "lymen pieces in Fresh, casting might make him turn yellow or something,
it'll be fun to see". Three of the art desk's deliveries, each sorted out of Fresh to deep16/_src/lymen/ (the zip beside its folder):
  ART-MC-LYMEN-BASE-ATTACK-06-FIVE-FACINGS      the six-frame attack over the mannequin's GUIDE-2026-11-13b-longsword-and-shield (in hand since
                                                0082646a as the review row lymen_check_p2; its cut is tools/lymen-check-sheet.py's cells(), kept)
  ART-MC-LYMEN-ATTACK-S-N-FRAME-04              art-wanted section 57: SOUTH and NORTH frame 4 redrawn, the blade seen at the cut; each a
                                                standalone drawing, bigger than its strip -- scaled to its notes' 45 px crown to sole (a bent
                                                knee on the 48 px standing scale) and set by its boots where the old frame 4 stood
  ART-MC-LYMEN-STANDARD-FIGHT-SOURCE-REVIEW     art-wanted section 58: Idle 6, Walk 8, Hurt 6, Sit 2, Cast 6 in S, SE, E, rear NE and N, a page a
                                                view with labelled rows (ROW-MAP.json: each row's band and the view's guard crown and sole); the N
                                                and NE Sit and Cast on their own pages, which supersede the five-row pages' (the gear on the right
                                                sides); SE, E and NE Walk "held" by the desk for the lead leg, a retry strip of each beside

The cut: a row's band read whole (tools/vivian-sheet.py's figure(): what is not the navy), the frame numbers under it dropped (small, white, low),
the drawings counted off left to right. One scale a page, the view's guard crown to sole -> 48 px (barley_p3's grown human; a retry strip matched to
its view's walk frame 1). Each frame stands on its own lowest row and is centred by its torso (lying, by its whole body), the house's rule.
THE CAST IS CUT AS IT CAME -- the glow turns his mail and skin yellow-gold on 3 and 4 and it is left so, on his word above; no colour is steered
(`avoid` is not used on any row).
THE WALK: S and N as drawn. SE, E and NE: WALK below names which of the two candidates is worn -- the cutter's eye on both at game size (the
candidates page); what the legs still do wrong is on deep16-dream-polish.md, not asked again (every cutter's rule, 10-30).
SW, W and NW the mirrors of SE, E and NE (RULED 10-14; the mirror puts the sword in the other hand, the house's convention).
Rows (lymen_p0's, in barley_p3's frame counts): idle 6, walk 8, attack 6 (`release` 3), hurt 6, sit 2, cast 6.
Worn by Lymen (js/save.js SV.LOOK.lymen.sheet). His own five rows and the standard extras (art-wanted section 59) have not come back.
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load(name, fn):
    sp = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', fn))
    m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m


VS = _load('vivian_sheet', 'vivian-sheet.py')
LC = _load('lymen_check', 'lymen-check-sheet.py')
VS.BG_TOL = LC.VS.BG_TOL = 10          # (his swept dark hair stands 14 to 24 from the navy and the house's 30 ate it, the back views' most; these pages' navy is flat, 90% within 2.4)

LOOK = 'lymen_p2'
STD = os.path.join(VS.pix.SRC, 'lymen', 'ART-MC-LYMEN-STANDARD-FIGHT-SOURCE-REVIEW')
F04 = os.path.join(VS.pix.SRC, 'lymen', 'ART-MC-LYMEN-ATTACK-S-N-FRAME-04')
TALL, FH, AY = 48, 84, 76            # (lymen_check_p2's cell: the blade high over the head on attack 3)
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}
MIRROR = {1: 7, 2: 6, 3: 5}
ROWS = [('idle', 6, 6), ('walk', 10, 8), ('attack', 10, 6), ('hurt', 10, 6), ('sit', 2, 2), ('cast', 8, 6)]   # (name, fps, frames)
GROUND = {('hurt', 3), ('hurt', 4), ('hurt', 5)}
WALK = {'SE': 'retry', 'E': 'retry', 'NE': 'retry'}          # which candidate each held view wears: 'main' (the five-row page) or 'retry' (its strip)
# the two redrawn frames (CUTTER-NOTES.md): crop x0 y0 x1 y1, crown y, sole y, the two soles' centres x
FRAME4 = {'S': ('LYMEN-ATTACK-S-FRAME-04.png', (260, 150, 965, 947), 183, 930, (488, 715)),
          'N': ('LYMEN-ATTACK-N-FRAME-04.png', (257, 260, 821, 942), 285, 924, (577, 758))}
F4_TALL = 45


def page(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float32)


def band_frames(pg, y0, y1, n, x0=0):
    """the n drawings of one labelled row, left to right: [(rgb crop, mask crop, bottom y on the page)]"""
    a = pg[y0:y1, x0:]
    m = VS.figure(a)
    # the frame numbers first, by what they are: small white marks standing in one line under the row (n of them, tops within 4 px) -- wiped
    # with a margin before the drawings are read, so a number that touches a sword lying on the ground (the hurt rows) goes all the same
    wl, wk = ndimage.label(a.min(axis=2) > 150)
    small = [sl for sl in ndimage.find_objects(wl) if sl[0].stop - sl[0].start < 0.14 * (y1 - y0) and sl[1].stop - sl[1].start < 0.03 * pg.shape[1]
             and sl[0].stop - sl[0].start > 6 and sl[0].start > 0.55 * (y1 - y0)]
    line = max((sorted([t for t in small if abs(t[0].start - sl[0].start) <= 4], key=lambda t: t[1].start) for sl in small), key=lambda g: (len(g) >= n, g[0][0].start if g else 0), default=[])
    if len(line) >= n:
        for sl in line:
            m[max(0, sl[0].start - 4):sl[0].stop + 4, max(0, sl[1].start - 4):sl[1].stop + 4] = False
    lab, k = ndimage.label(m, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(lab); sz = ndimage.sum(m, lab, range(1, k + 1))
    keep = []
    for i, sl in enumerate(objs):
        h = sl[0].stop - sl[0].start
        px = a[sl][lab[sl] == i + 1]
        if h < 0.14 * (y1 - y0) and (px.min(axis=1) > 150).any() and (sl[1].stop - sl[1].start) < 0.03 * pg.shape[1] and sl[0].start > 0.55 * (y1 - y0):
            continue                                   # (a frame number: small, white, under the feet)
        keep.append(i)
    # the drawings are told apart by the n-1 widest empty gaps along the row (a shield held clear of the body stays with its body: E's walk)
    cols = np.isin(lab, [i + 1 for i in keep]).any(0); xs_ = np.where(cols)[0]
    gaps = sorted([(xs_[j + 1] - xs_[j], xs_[j], xs_[j + 1]) for j in range(len(xs_) - 1) if xs_[j + 1] - xs_[j] > 1], reverse=True)[:n - 1]
    assert len(gaps) == n - 1, ('row at y %d: %d gaps found, %d wanted' % (y0, len(gaps), n - 1))
    cutsx = sorted((g[1] + g[2]) / 2.0 for g in gaps)
    out = []
    for j in range(n):
        mine = [i for i in keep if int(np.searchsorted(cutsx, (objs[i][1].start + objs[i][1].stop) / 2.0)) == j]
        mm = np.isin(lab, [i + 1 for i in mine]); ys, xs = np.where(mm)
        sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
        out.append((a[sl], mm[sl], y0 + ys.max()))
    return out


def cell(rgb, m, k, ground):
    o = VS.to1x(rgb, m, k)
    al = o[..., 3] > 0; ys = np.where(al.any(1))[0]
    if ground:
        cx = ndimage.center_of_mass(al)[1]
    else:
        top = al.copy(); top[ys[0] + int((ys[-1] - ys[0]) * 0.55):] = False
        cx = ndimage.center_of_mass(top)[1]
    return (o, cx, ys[-1])


def standard(walk=None):
    """{(facing, row, i): (cell, cx, foot)} for the five drawn views' idle, walk, hurt, sit and cast"""
    walk = walk or WALK
    rm = json.load(open(os.path.join(STD, 'ROW-MAP.json'), encoding='utf-8'))['views']
    pages, out, scales = {}, {}, {}
    for view, rows in rm.items():
        g = rows['idle']['guard_crown_sole_y']; kv = TALL / float(g[1] - g[0]); scales[view] = kv
        for row, d in rows.items():
            src = d['source']
            if src not in pages:
                pages[src] = page(os.path.join(STD, src))
            pg = pages[src]
            k = kv
            if 'standing_cast_crown_sole_y' in d:      # (the N and NE Sit/Cast pages: their own scale, by the standing cast)
                s = d['standing_cast_crown_sole_y']; k = TALL / float(s[1] - s[0])
            y0, y1 = d['row_y_including_labels']
            frames = band_frames(pg, y0, y1, d['count'], int(0.068 * pg.shape[1]))
            if row == 'walk' and walk.get(view) == 'retry':
                rp = page(os.path.join(STD, d['retry_source']))
                h0 = frames[0][1].shape[0] * kv                              # (the strip drawn bigger: its frame 1 as tall as the page's walk 1)
                frames = band_frames(rp, 0, rp.shape[0], d['count'])
                k = h0 / float(frames[0][1].shape[0]); scales[view + ' walk retry'] = k
            for i, (rgb, m, bot) in enumerate(frames):
                out[(FACE[view], row, i)] = cell(rgb, m, k, (row, i) in GROUND)
    return out, scales


def feet_mid(o, foot):
    al = o[..., 3] > 0; f = int(round(foot))
    xs = np.where(al[max(0, f - 3):f + 1].any(0))[0]
    return (xs.min() + xs.max()) / 2.0


def attack():
    """the attack in hand (tools/lymen-check-sheet.py's cells, unmirrored views kept), S and N frame 4 replaced by the redrawn frames"""
    cs, scale = LC.cells()
    out = {c: v for c, v in cs.items() if c[1] == 'attack' and c[0] in FACE.values()}
    for view, (fn, (x0, y0, x1, y1), crown, sole, soles) in FRAME4.items():
        f = FACE[view]; pg = page(os.path.join(F04, fn)); a = pg[y0:y1, x0:x1]
        k = F4_TALL / float(sole - crown); scale[view + ' frame 4'] = k
        o = VS.to1x(a, VS.figure(a, True), k)
        old, oax, ofoot = out[(f, 'attack', 3)]
        foot = (sole - y0) * k + 1
        ax = feet_mid(o, foot) - (feet_mid(old, ofoot) - oax)                # (the boots where the old frame 4's stood)
        out[(f, 'attack', 3)] = (o, ax, foot)
    return out, scale


def build(walk=None):
    cells, s1 = standard(walk)
    at, s2 = attack(); cells.update(at); s1.update(s2)
    for mf, src in MIRROR.items():
        for (f, row, i) in [c for c in list(cells) if c[0] == src]:
            o, cx, foot = cells[(f, row, i)]
            cells[(mf, row, i)] = (np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - cx, foot)
    anims, blocks, y = {}, [], 0
    for name, fps, n in ROWS:
        reach = max(max(cx, o.shape[1] - cx) for (f, r, i), (o, cx, foot) in cells.items() if r == name)
        fw = int(2 * np.ceil(reach + 2)); ax = fw // 2
        blk = np.zeros((8 * FH, n * fw, 4), np.uint8)
        for (f, r, i), (o, cx, foot) in cells.items():
            if r != name:
                continue
            assert i < n, (f, r, i)
            dx, dy = int(round(ax - cx)), int(round(AY - foot))
            h, w = o.shape[:2]; sy, sx = max(0, -dy), max(0, -dx)
            hh, ww = min(h - sy, FH - max(0, dy)), min(w - sx, fw - max(0, dx))
            sub = o[sy:sy + hh, sx:sx + ww]; dst = blk[f * FH + max(0, dy):f * FH + max(0, dy) + hh, i * fw + max(0, dx):i * fw + max(0, dx) + ww]
            put = sub[..., 3] > 0; dst[put] = sub[put]
        a = dict(y=y, fw=fw, fh=FH, ax=ax, ay=AY, frames=n, fps=fps)
        if name == 'attack':
            a['release'] = 3
        anims[name] = a; blocks.append(blk); y += 8 * FH
    W = max(b.shape[1] for b in blocks); sheet = np.zeros((y, W, 4), np.uint8); yy = 0
    for b in blocks:
        sheet[yy:yy + b.shape[0], :b.shape[1]] = b; yy += b.shape[0]
    return sheet, anims, s1


def strips(sheet, anims, rows=None):
    return [sheet[a['y'] + f * FH:a['y'] + (f + 1) * FH, :a['fw'] * a['frames']] for n_, a in anims.items() if rows is None or n_ in rows for f in (0, 7, 6, 5, 4)]


def contact(tiles, path, Z=3):
    W = max(t.shape[1] for t in tiles)
    rv = Image.new('RGBA', (W * Z, len(tiles) * FH * Z), (12, 20, 40, 255))
    for j, t in enumerate(tiles):
        rv.alpha_composite(Image.fromarray(np.ascontiguousarray(t), 'RGBA').resize((t.shape[1] * Z, FH * Z), Image.NEAREST), (0, j * FH * Z))
    os.makedirs(os.path.dirname(path), exist_ok=True); rv.save(path, optimize=True); print('  ' + path)


def cut():
    sheet, anims, scale = build()
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', LOOK + '.png'), optimize=True)
    i0 = anims['idle']
    meta = dict(image='art/%s.png' % LOOK, fw=i0['fw'], fh=FH, ax=i0['ax'], ay=AY, top=TALL, anims=anims, name='Lymen',
                hold=["walk, SE E and rear NE: the art desk held these for the lead leg; the candidate worn is tools/lymen-sheet.py WALK's (%s), what is left is on deep16-dream-polish.md" % ', '.join('%s %s' % kv for kv in sorted(WALK.items())),
                      "cast: cut as it came -- the glow turns his mail and skin yellow-gold on 3 and 4 (Griz, 11-13: \"casting might make him turn yellow or something, it'll be fun to see\")",
                      "hurt: the late frames turn toward the viewer in several facings (the art desk's own note); idle's breath is slight; the E cast turns toward the viewer on 3 to 6",
                      "attack: S and N frame 4 are the redrawn standalones (ART-MC-LYMEN-ATTACK-S-N-FRAME-04), set by their boots at 45 px crown to sole",
                      "his own rows (layonhands, divinesmite, greenagain, whatfallsfeeds, relentless) and flinch, prone, getup, defend, useitem, victory, interact, attack2 are not drawn yet (art-wanted section 59)"],
                source="drawn by the art desk (ART-MC-LYMEN-STANDARD-FIGHT-SOURCE-REVIEW and ART-MC-LYMEN-ATTACK-S-N-FRAME-04, 11-13: art-wanted sections 58 and 57; the attack ART-MC-LYMEN-BASE-ATTACK-06-FIVE-FACINGS "
                       "over GUIDE-2026-11-13b-longsword-and-shield), cut by tools/lymen-sheet.py; SW W NW mirrored; worn by Lymen (js/save.js SV.LOOK.lymen)")
    with open(os.path.join(ROOT, 'deep16', 'art', LOOK + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: %dx%d, rows %s; scale %s' % (LOOK, sheet.shape[1], sheet.shape[0], ', '.join('%s %d@%dpx' % (n_, a['frames'], a['fw']) for n_, a in anims.items()),
                                          ', '.join('%s %.4f' % kv for kv in sorted(scale.items()))))
    if 'check' in sys.argv:
        out = os.path.join(ROOT, 'deep16', 'art-src', 'lymen')
        contact(strips(sheet, anims), os.path.join(out, LOOK + '-review.png'))
        tiles = []
        for v in ('SE', 'E', 'NE'):
            for which in ('main', 'retry'):
                sh, an, _ = build(dict(WALK, **{v: which}))
                a = an['walk']; f = FACE[v]; tiles.append(sh[a['y'] + f * FH:a['y'] + (f + 1) * FH, :a['fw'] * 8])
        contact(tiles, os.path.join(out, LOOK + '-walk-candidates.png'), 4)


if __name__ == '__main__':
    cut()

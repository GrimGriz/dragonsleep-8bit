"""The art desk's facings packages onto a sheet a cutter already builds (10-22, the monster cutter seat's second run: the ettercap's art39
first, then this, shared by the sheets after it). A package draws a creature's missing views on numbered pages: HEAD 1 SE, HEAD 2 NE,
HEAD 3 S, HEAD 5 N (RULED 10-14: five drawn views, SW and NW the mirrors of SE and NE), each row's name at its left and its numbers under it.

    AD = <load tools/artdesk.py>
    got = AD.views(ROOT, 'giantboar', 'ART-41', PAGES, VIEWS, idle_h, fit, torso_x, (FW, FH, AX, AY))   # -> {view: {row: [FH x FW arrays]}}

PAGES: {L: dict(file, W, text=[boxes], rows=[(row, band, number strip, count)])}, boxes read off the page (the numbers, islands in the
navy; the row names at the left). VIEWS: {'SE': (L, ...), 'NE': (...), 'S': (...), 'N': (...)} -- each view's pages, its Idle's first
when it has one. idle_h: the sheet's own standing heights at game size {'side':, 'S':, 'N':}. fit(im, k) -> the game-size RGBA array (the
cutter's own: its tone, its outline); torso_x(a) -> the body's middle column.
Scale by height: a diagonal's Idle meets the mean of the side's and its front's (SE) or back's (NE); a later page by its first standing
frame (its Death 1 when it has one, else its first row's first frame) against its view's Idle 1, by the page's own px; a front or back page
by that standing frame against the front's or back's idle. Placed as the page drew them: each row's first frame with its torso on AX and its
lowest row on AY, the rest against their numbers and the row's ground. Refuses a frame cut off at the cell's edge.
"""
import os, subprocess, importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage


def src_dir(root):
    """the art lives in the main checkout's deep16/_src (not in git): a worktree reads it there"""
    d = os.path.join(root, 'deep16', '_src')
    if os.path.isdir(d):
        return d
    common = subprocess.run(['git', '-C', root, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    return os.path.join(os.path.dirname(os.path.abspath(os.path.join(root, common))), 'deep16', '_src')


def _sheetrows(root):
    spec = importlib.util.spec_from_file_location('sheetrows', os.path.join(root, 'tools', 'sheetrows.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod


def body_h(im):
    """a page frame's height: its biggest piece filled (a loose shred, a strand, a spark left out)"""
    m = np.asarray(im)[..., 3] > 0
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    m = lab == 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
    ys = np.where(m.any(axis=1))[0]
    return float(ys[-1] - ys[0] + 1)


def tall(a):
    ys = np.where(a[..., 3].any(axis=1))[0]
    return int(ys[-1] - ys[0] + 1)


def cut(root, sub, art, pages, chan=None, fix=None, cuts=None):
    """-> {L: {row: [(page image, its box, its number's x)]}}. A page may say: `dir` (its folder under _src/<sub>/, when not <art>: the
    ankheg's older ART-10 pages lie in _src/ankheg/ itself), `blank` {row: n} (its last n numbers stand over nothing on purpose -- the
    ankheg's Burrow 6, under the ground: the band stops short of them and the row ends in n empty frames, (None, None, None)), `own_strip`
    [rows] (no blanking box over that row's numbers: they sit among its drawing, so each digit is boxed in `text` instead)"""
    SR = _sheetrows(root)
    out = {}
    for L, s in pages.items():
        path = os.path.join(src_dir(root), sub, s.get('dir', art), s['file'])
        a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
        rows, blank, hand = [], s.get('blank', {}), {}      # (`xs` {row: [x]}: a row's numbers by hand, where a limb or a jet crosses its strip)
        for r, b, l, n in s['rows']:
            xs = s.get('xs', {}).get(r)
            if blank.get(r):
                xs = xs or SR.label_xs(a, b[0], b[2], l[0], l[1])
                b, n, xs = (b[0], b[1], int((xs[n - blank[r] - 1] + xs[n - blank[r]]) / 2), b[3]), n - blank[r], xs[:n - blank[r]]
            if xs:
                hand[tuple(l)] = xs
            rows.append((r, b, l, n))
        sp = dict(text=s['text'] + [(0, l0 - 3, s['W'], l1 + 4) for r, _, (l0, l1), _ in rows if r not in s.get('own_strip', ())],
                  rows=[(r, b, l, [str(i + 1) for i in range(n)]) for r, b, l, n in rows])
        if chan:
            sp['chan'] = chan
        if s.get('away'):                                   # (`away` {row: [boxes]}: a corner of that row's band left out -- another row's drawing reaches into it)
            sp['away'] = s['away']
        orig = SR.label_xs
        SR.label_xs = lambda a_, x0, x1, y0, y1: hand.get((y0, y1)) or orig(a_, x0, x1, y0, y1)
        try:
            got = SR.cut_sheet(path, sp, fix=(fix or {}).get(L), cuts=(cuts or {}).get(L), tag=L)
            lx = {r: SR.label_xs(a, b[0], b[2], l[0], l[1]) for r, b, l, _ in rows}
        finally:
            SR.label_xs = orig
        out[L] = {r: [(im, box, lx[r][i]) for i, (_, im, box) in enumerate(frs)] + [(None, None, None)] * blank.get(r, 0)
                  for r, frs in got.items()}
    return out


def scales(cuts, views, idle_h, fit, stand_of=None, measure=None, idle_joined=False):
    """stand_of: {L: (row, index)} a page's standing frame where its Death 1 (or first frame) is not one (the bulette's S page: Emerge 6)"""
    def k_for(ims, target):                          # page px a game px: the fitted frames' median height meets target
        lo, hi = 1.0, 20.0
        for _ in range(26):
            k = (lo + hi) / 2
            got = float(np.median([tall(fit(im, k)) for im in ims]))
            lo, hi = (k, hi) if got > target else (lo, k)
        return (lo + hi) / 2
    def stand(L):
        if L in (stand_of or {}):
            r, i = stand_of[L]
            return cuts[L][r][i][0]
        return (cuts[L]['hurt'] if 'hurt' in cuts[L] else next(iter(cuts[L].values())))[0][0]
    K = {}
    for v, ls in views.items():
        if 'idle' in cuts[ls[0]]:
            p1 = ls[0]
            target = idle_h[v] if v in ('S', 'N') else (idle_h['side'] + idle_h['S' if v == 'SE' else 'N']) / 2
            K[p1] = k_for([im for im, _, _ in cuts[p1]['idle'] + (cuts[p1].get('idle_b', []) if idle_joined else [])], target)   # (idle_joined: the Idle's second printed line counts too -- the gargoyle's N, 10-22)
            mh = measure or body_h                    # (measure: a page frame's height by the cutter's own rule -- the manticore's, its tail ball left out)
            ref = mh(cuts[p1]['idle'][0][0])
            for L in ls[1:]:
                K[L] = K[p1] * mh(stand(L)) / ref
        else:                                            # a front or back page with no idle: its standing frame against the view's idle
            for L in ls:
                K[L] = k_for([stand(L)], idle_h[v])
    return K


def _mean(a):
    al = a[..., 3] > 0
    return a[..., :3][al].astype(float).mean(0)


def toned(im, f):
    a = np.asarray(im).astype(float)
    a[..., :3] = np.clip(a[..., :3] * np.array(f), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def tones(cuts, view_pages, K, fit, ref, stand_of=None):
    """per channel, each page's standing frame (its Idle 1, else as `scales`) brought to the sheet's own frame for that view (ref: {'side':,
    'S':, 'N':} game-size arrays; SE and NE against the side), measured at game size, both snapped"""
    T = {}
    for v, ls in view_pages.items():
        r = _mean(ref['side'] if v in ('SE', 'NE', 'E') else ref[v])          # (E: a package that draws the side too, the ankheg's)
        for L in ls:
            if L in (stand_of or {}):
                im = cuts[L][stand_of[L][0]][stand_of[L][1]][0]
            else:
                im = (cuts[L]['idle'] if 'idle' in cuts[L] else cuts[L]['hurt'] if 'hurt' in cuts[L] else next(iter(cuts[L].values())))[0][0]
            f = r / _mean(fit(im, K[L]))
            f = f * r / _mean(fit(toned(im, f), K[L]))           # (once more: the snap moves what the tone moved)
            T[L] = tuple(float(round(x, 3)) for x in f)
    print('  tone: ' + ', '.join('%s x %s' % (L, T[L]) for L in T))
    return T


def page_shadow(rgb, fig, box, ground, pad=30):
    """the ground shadow a page drew under an airborne frame: the pixels off the figure and off the page's ground colour (the bulette's SE
    page draws a lighter grey-blue ellipse on the navy, its NE, S and N pages a faintly darker one) under the frame's columns, near the row's
    ground line -> (x0, y0, x1, y1) page px, or None"""
    navy = np.median(rgb.reshape(-1, 3)[::97], axis=0)
    x0, x1 = max(0, box[0] - pad), min(rgb.shape[1], box[2] + pad)
    y0, y1 = max(0, ground - pad), min(rgb.shape[0], ground + pad // 2)
    sub = rgb[y0:y1, x0:x1]
    m = ((np.abs(sub - navy).sum(-1) > 25) | (navy.sum() - sub.sum(-1) > 10)) & ~fig[y0:y1, x0:x1]
    m = ndimage.binary_opening(m, iterations=1)                  # (the ground's own speckle out)
    lab, n = ndimage.label(m)
    if not n:
        return None
    sz = ndimage.sum(m, lab, range(1, n + 1))
    i = int(np.argmax(sz))
    if sz[i] < 150:
        return None
    sl = ndimage.find_objects(lab)[i]
    return (x0 + sl[1].start, y0 + sl[0].start, x0 + sl[1].stop, y0 + sl[0].stop)


def stamp_shadow(fr, cx, cy, rx, ry, colour):
    """a hard, dithered ellipse (the palette has no half-alpha) under the figure: only where the frame is clear"""
    h, w = fr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    m = (((xx - cx) / max(rx, 1)) ** 2 + ((yy - cy) / max(ry, 1)) ** 2 <= 1) & (((xx + yy) & 1) == 0) & (fr[..., 3] == 0)
    fr[m, :3] = colour; fr[m, 3] = 255


def views(root, sub, art, pages, view_pages, idle_h, fit, torso_x, cell, chan=None, fix=None, tone_ref=None, cuts=None, stand_of=None,
          shadows=None, shadow_rgb=None, targets=None, joins=None, feet=None, measure=None, idle_joined=False):
    """tone_ref: the sheet's own frames to tone each page to (see `tones`), or None to cut the pages' colour as drawn; fix and cuts:
    sheetrows' own, a page at a time ({L: {row: [...]}}: a loose part's box and its frame, a line cleared where two frames touch); stand_of:
    see `scales`; shadows: {row: (frame indices)} -- each such frame's ground shadow measured off its page (`page_shadow`) and drawn under it
    in shadow_rgb, the way a cutter draws its own leap's (fit is taken to pad its cut by one px, as every cutter's does); targets: {L:
    (row, index, height)} -- that page scaled so that frame stands that tall, in place of the rule in `scales` (the otyugh's: a half-sunk
    idle must not set its walk's scale); joins: {row2: row} -- a row wrapped onto a second line of the page (the otyugh's Fall, 1-5 then
    6-9), placed against the first line's anchor and appended to it; feet: {row or (page, row): f(game-size frame) -> its foot row} -- that row's frames each
    stood with its foot on AY, in place of its box's foot against the row's ground (the winter wolf's breath: its frost hangs below the paws,
    and on a second line the first frame's frost would set the line's ground); measure: f(page frame) -> its height, in place of `body_h` in
    `scales` (the manticore's: its biggest piece with the tail opened away, so a spike ball raised over the wings does not set a page's scale)"""
    FW, FH, AX, AY = cell
    lines = cuts
    cuts = cut(root, sub, art, pages, chan, fix, lines)          # (the cut lines in, the cut frames out)
    K = scales(cuts, view_pages, idle_h, fit, stand_of, measure, idle_joined)
    for L, (r, i, hgt) in (targets or {}).items():
        lo, hi = 1.0, 20.0
        for _ in range(26):
            k = (lo + hi) / 2
            lo, hi = (k, hi) if tall(fit(cuts[L][r][i][0], k)) > hgt else (lo, k)
        K[L] = (lo + hi) / 2
    pg = {}
    if shadows:
        SR = _sheetrows(root)
        for L, s in pages.items():
            if any(r in shadows for r, _, _, _ in s['rows']):
                a = np.asarray(Image.open(os.path.join(src_dir(root), sub, art, s['file'])).convert('RGB')).astype(np.int32)
                pg[L] = (a, SR.figure_mask(a, chan=chan) if chan else SR.figure_mask(a))
    print('  %s K: ' % art + ', '.join('%s %.2f' % (L, K[L]) for L in pages) +
          '; the sheet stands %.0f side-on, %.0f from the front, %.0f from behind' % (idle_h['side'], idle_h['S'], idle_h['N']))
    T = tones(cuts, view_pages, K, fit, tone_ref, stand_of) if tone_ref else {}
    out, lost, anchor = {}, [], {}
    for v, ls in view_pages.items():
        out[v] = {}
        for L in ls:
            k = K[L]
            for an, frs in cuts[L].items():
                fits = [None if im is None else fit(toned(im, T[L]) if L in T else im, k) for im, _, _ in frs]
                rel = [None if box is None else ((box[0] - x) / k, box[3] / k) for _, box, x in frs]     # (each frame's left against its number, its foot on the row's ground)
                tx, rx0 = torso_x(fits[0]), rel[0][0]
                if an in (joins or {}) and (L, joins[an]) in anchor:       # a second line: the first line's anchor, its own ground
                    tx, rx0 = anchor[(L, joins[an])]
                anchor[(L, an)] = (tx, rx0)
                row = []
                for a, rr in zip(fits, rel):
                    if a is None:                                # a slot drawn empty on purpose (`blank`): an empty frame
                        row.append(np.zeros((FH, FW, 4), dtype=np.uint8)); continue
                    rx, rb = rr
                    ox = int(round(AX - tx + (rx - rx0)))
                    oy = int(round(AY + (rb - rel[0][1]))) - int(np.where(a[..., 3].any(axis=1))[0][-1])
                    ff = (feet or {}).get((L, an)) or (feet or {}).get(an)
                    if ff:
                        oy = AY - int(ff(a))
                    fr = np.zeros((FH, FW, 4), dtype=np.uint8)
                    h, w = a.shape[:2]
                    y0, x0, y1, x1 = max(0, oy), max(0, ox), min(FH, oy + h), min(FW, ox + w)
                    if y1 > y0 and x1 > x0:
                        fr[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
                    if (fr[..., 3] > 0).sum() < (a[..., 3] > 0).sum():
                        lost.append('%s %s %d (rows %d..%d cols %d..%d)' % (L, an, len(row) + 1, oy, oy + h - 1, ox, ox + w - 1))
                    i = len(row)
                    if L in pg and i in (shadows or {}).get(an, ()):
                        box = frs[i][1]
                        sb = page_shadow(pg[L][0], pg[L][1], box, frs[0][1][3])
                        if sb:                                   # page px -> this frame's px (fit's one px of pad)
                            gx = lambda px: ox + 1 + (px - box[0]) / k
                            gy = lambda py: oy + 1 + (py - box[1]) / k
                            stamp_shadow(fr, (gx(sb[0]) + gx(sb[2])) / 2, (gy(sb[1]) + gy(sb[3])) / 2,
                                         (sb[2] - sb[0]) / k / 2, max(1.5, (sb[3] - sb[1]) / k / 2), shadow_rgb)
                        else:
                            print('  %s %s %d: no shadow found on the page' % (L, an, i + 1))
                    row.append(fr)
                out[v][an] = row
        for an2, an in (joins or {}).items():
            if an2 in out[v]:
                out[v][an] = out[v].get(an, []) + out[v].pop(an2)
    if lost:
        raise SystemExit('%s cut off at the cell edge (%d x %d, anchor %d,%d): ' % (art, FW, FH, AX, AY) + '; '.join(lost))
    return out

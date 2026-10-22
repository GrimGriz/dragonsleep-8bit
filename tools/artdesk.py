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
    """-> {L: {row: [(page image, its box, its number's x)]}}"""
    SR = _sheetrows(root)
    out = {}
    for L, s in pages.items():
        path = os.path.join(src_dir(root), sub, art, s['file'])
        a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
        sp = dict(text=s['text'] + [(0, l0 - 3, s['W'], l1 + 4) for _, _, (l0, l1), _ in s['rows']],
                  rows=[(r, b, l, [str(i + 1) for i in range(n)]) for r, b, l, n in s['rows']])
        if chan:
            sp['chan'] = chan
        got = SR.cut_sheet(path, sp, fix=(fix or {}).get(L), cuts=(cuts or {}).get(L), tag=L)
        lx = {r: SR.label_xs(a, b[0], b[2], l[0], l[1]) for r, b, l, _ in s['rows']}
        out[L] = {r: [(im, box, lx[r][i]) for i, (_, im, box) in enumerate(frs)] for r, frs in got.items()}
    return out


def scales(cuts, views, idle_h, fit):
    def k_for(ims, target):                          # page px a game px: the fitted frames' median height meets target
        lo, hi = 1.0, 20.0
        for _ in range(26):
            k = (lo + hi) / 2
            got = float(np.median([tall(fit(im, k)) for im in ims]))
            lo, hi = (k, hi) if got > target else (lo, k)
        return (lo + hi) / 2
    stand = lambda L: (cuts[L]['hurt'] if 'hurt' in cuts[L] else next(iter(cuts[L].values())))[0][0]
    K = {}
    for v, ls in views.items():
        if 'idle' in cuts[ls[0]]:
            p1 = ls[0]
            target = idle_h[v] if v in ('S', 'N') else (idle_h['side'] + idle_h['S' if v == 'SE' else 'N']) / 2
            K[p1] = k_for([im for im, _, _ in cuts[p1]['idle']], target)
            ref = body_h(cuts[p1]['idle'][0][0])
            for L in ls[1:]:
                K[L] = K[p1] * body_h(stand(L)) / ref
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


def tones(cuts, view_pages, K, fit, ref):
    """per channel, each page's standing frame (its Idle 1, else as `scales`) brought to the sheet's own frame for that view (ref: {'side':,
    'S':, 'N':} game-size arrays; SE and NE against the side), measured at game size, both snapped"""
    T = {}
    for v, ls in view_pages.items():
        r = _mean(ref['side'] if v in ('SE', 'NE') else ref[v])
        for L in ls:
            im = (cuts[L]['idle'] if 'idle' in cuts[L] else cuts[L]['hurt'] if 'hurt' in cuts[L] else next(iter(cuts[L].values())))[0][0]
            f = r / _mean(fit(im, K[L]))
            f = f * r / _mean(fit(toned(im, f), K[L]))           # (once more: the snap moves what the tone moved)
            T[L] = tuple(float(round(x, 3)) for x in f)
    print('  tone: ' + ', '.join('%s x %s' % (L, T[L]) for L in T))
    return T


def views(root, sub, art, pages, view_pages, idle_h, fit, torso_x, cell, chan=None, fix=None, tone_ref=None, cuts=None):
    """tone_ref: the sheet's own frames to tone each page to (see `tones`), or None to cut the pages' colour as drawn; fix and cuts:
    sheetrows' own, a page at a time ({L: {row: [...]}}: a loose part's box and its frame, a line cleared where two frames touch)"""
    FW, FH, AX, AY = cell
    cuts = cut(root, sub, art, pages, chan, fix, cuts)          # (the cut lines in, the cut frames out)
    K = scales(cuts, view_pages, idle_h, fit)
    print('  %s K: ' % art + ', '.join('%s %.2f' % (L, K[L]) for L in pages) +
          '; the sheet stands %.0f side-on, %.0f from the front, %.0f from behind' % (idle_h['side'], idle_h['S'], idle_h['N']))
    T = tones(cuts, view_pages, K, fit, tone_ref) if tone_ref else {}
    out, lost = {}, []
    for v, ls in view_pages.items():
        out[v] = {}
        for L in ls:
            k = K[L]
            for an, frs in cuts[L].items():
                fits = [fit(toned(im, T[L]) if L in T else im, k) for im, _, _ in frs]
                rel = [((box[0] - x) / k, box[3] / k) for _, box, x in frs]     # (each frame's left against its number, its foot on the row's ground)
                tx = torso_x(fits[0])
                row = []
                for a, (rx, rb) in zip(fits, rel):
                    ox = int(round(AX - tx + (rx - rel[0][0])))
                    oy = int(round(AY + (rb - rel[0][1]))) - int(np.where(a[..., 3].any(axis=1))[0][-1])
                    fr = np.zeros((FH, FW, 4), dtype=np.uint8)
                    h, w = a.shape[:2]
                    y0, x0, y1, x1 = max(0, oy), max(0, ox), min(FH, oy + h), min(FW, ox + w)
                    if y1 > y0 and x1 > x0:
                        fr[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
                    if (fr[..., 3] > 0).sum() < (a[..., 3] > 0).sum():
                        lost.append('%s %s %d (rows %d..%d cols %d..%d)' % (L, an, len(row) + 1, oy, oy + h - 1, ox, ox + w - 1))
                    row.append(fr)
                out[v][an] = row
    if lost:
        raise SystemExit('%s cut off at the cell edge (%d x %d, anchor %d,%d): ' % (art, FW, FH, AX, AY) + '; '.join(lost))
    return out

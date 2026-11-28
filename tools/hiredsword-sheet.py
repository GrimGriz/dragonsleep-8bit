"""DEEP16 pipeline 2 (generated art): the Hired Sword and the Hired Blade, re-drawn on realistic proportions -> guard_p1 (the sheet both creatures wear).

    python tools/hiredsword-sheet.py                (writes deep16/art/guard_p1.png/.json)
    python tools/hiredsword-sheet.py check          (also deep16/art-src/guard/guard_p1-review.png: every row of every drawn view at 3x)

The art desk's RECOSTUME-1127 (11-27, deep16/_src/guard/RECOSTUME-1127/: CUTTER-NOTES.md, FRAME-MAP.csv, the 15 pages in SOURCES/): the Hired Sword's kit
-- steel armour, the angular shield on the left forearm, the straight sword in the right hand, the open-face helmet over the ART-122 face and beard -- on the
adult proportions of the Crewman's strip, five views (S, SE, E, rear NE, N) x Idle 4, Walk 8, Attack 6 (printed frames 1-4, 1-8 in two bands, 1-6 in two bands).
Replaces the 96x96 big-headed sheet (8-frame rows, anchor (48,84)); rows idle 6 fps x 4, walk 10 fps x 8, attack 12 fps x 6; the cutter's own 64-high cell, the soles on
row 61. SW W NW are the mirrors of SE E NE (the cutter's, RULED 10-14); S and N as drawn.

The cut is tools/vivian-sheet.py's (loaded here, as tools/katarina-sheet.py does): each drawing is read from the FRAME-MAP.csv window, boxed down, snapped to the
64, outlined, each frame on its lowest row by its torso's middle. What this tool adds:
  windows     the FRAME-MAP.csv's own padded windows (its left/top/right/bottom, right and bottom exclusive).
  bgtol 14    the matte is a tight navy (its edge pixels lie within 3-9 of the window's median) but the dark steel edges, hair and boot outlines lie within 30 of it:
              at the cutter's 30 a tenth of the figure went (the figure broke into 50 pieces); at 14 it holds in a few and nothing of the matte stays.
  tall 48     the standing figure as folkman_p1's SE idle (the notes: 50 px crown to sole): the cutter's tall is the drawing inside its outline, whose two rows make 50 rows of alpha (folkman_p1 SE idle measures 50; the json's top reads 48); one scale on each idle page, by its median height (the blade is below the
              crown in every idle: the sword hangs low).
  pagescale   the walk and attack pages have no idle frame. The cutter's `match` takes a frame's whole height, and an attack's raised blade is no body height (E attack 3:
              the tip 46 source px over the helmet); so each page's scale is worked out here (page_scales) from the HEAD, the notes' "neutral body height excluding the blade"
              as the check: the head is the brown run of face, beard and hair, crown (the helmet's top beside it, so a raised blade is passed over) to its lowest row, the
              median of the frames whose blade is below the crown; the body is the page's neutral standing height without the blade (walk: every frame; attack: frames 1
              and 6, the guard). A page's scale is the idle page's times the geometric mean of the head ratio and the body ratio -- the art desk drew the walk's heads up to
              9% smaller against the body than the idle's, so the head alone would grow the walking man 4 px past the idle's 50, the body alone would shrink the head a
              pixel; the mean keeps both within a pixel (the numbers print as `scales`).
  E attack    the E Attack page has the thin horizontal guide line along the sole datum (page rows 416-417 and 886-887, full width, with a one-row dark edge under it and
              a lighter one over it) and its title printed over frame 1's window (rows < 34, columns < 400). A cleaned copy of that page is written to
              deep16/art-src/guard/clean/ with the title box painted the matte, and the line's rows (the soft top edge only where it is bluish, never a boot's brown) and the
              dark row under it painted the matte: the boots stand on the row above the line, untouched. Every other page is cut from the delivery as it came.
  release 3   printed frame 4 (zero-based 3), the contact, as the notes say (the cutter's own RELEASE; js/battle.js reads it).
The windows hold no digits (they sit above the printed frame numbers) -- apart from that title, nothing else is printed in them.
"""
import csv, importlib.util, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

BATCH = 'RECOSTUME-1127'
DELIVERY = os.path.join(VS.pix.SRC, 'guard', BATCH)
CLEAN = os.path.join(ROOT, 'deep16', 'art-src', 'guard', 'clean')
TOL = 14                                              # (the cutter's bgtol: the matte lies within 9 of its median, the dark steel from 14 up)
TALL = 48                                              # (+ the outline's two rows = 50 rows of alpha, as folkman_p1's SE idle measures; the cutter's tall is the figure inside its outline)
MATTE = (14, 21, 41)


def clean_page(fn):
    """the delivery's page `fn`, or its cleaned copy (E Attack: the title and the guide line painted the matte) -- the path to cut from"""
    if 'P1-E-ATTACK' not in fn:
        return DELIVERY, fn
    os.makedirs(CLEAN, exist_ok=True)
    a = np.asarray(Image.open(os.path.join(DELIVERY, fn)).convert('RGB')).copy()
    d = np.linalg.norm(a.astype(np.float32) - np.array(MATTE, np.float32), axis=2) > 30
    lines = [y for y in range(a.shape[0]) if d[y].mean() > 0.5]            # (the guide line: rows most of the page wide)
    assert lines and all(y > 34 for y in lines), lines
    groups = np.split(lines, np.where(np.diff(lines) > 1)[0] + 1)
    for g in groups:
        y0, y1 = g[0], g[-1]
        bluish = a[y0 - 1, :, 2].astype(int) > a[y0 - 1, :, 0].astype(int) + 10      # (the line's soft top edge: bluish; a boot's sole is brown)
        a[y0 - 1, bluish] = MATTE
        a[y0:y1 + 2] = MATTE                                                # (the line and the dark row under it)
    a[0:34, 0:400] = MATTE                                                  # (the page's printed title, over frame 1's window)
    out = os.path.join(CLEAN, fn.split('/')[-1])
    Image.fromarray(a, 'RGB').save(out)
    return CLEAN, os.path.basename(out)


def read_map():
    rows = list(csv.DictReader(open(os.path.join(DELIVERY, 'FRAME-MAP.csv'), encoding='utf-8-sig')))
    out = []
    for r in rows:
        fn = r['source'].split('/')[-1]
        d, name = clean_page(r['source'])
        box = tuple(int(r[k]) for k in ('left_px', 'top_px', 'right_px', 'bottom_px'))
        src = os.path.join('SOURCES', fn) if d == DELIVERY else fn
        out.append((d, r['facing'], r['action'], int(r['frame_index']), src, box))
    return out


def head_and_body(a, m):
    """(head, body) of one drawing in source px, or None: head = the brown run of face/beard/hair (top 40% of the figure) from the crown beside it to its lowest row;
    body = the figure's height from that crown to the soles. None where the top of the drawing is a raised blade (the crown not the topmost row)"""
    ys, xs = np.where(m); top, bot = ys.min(), ys.max(); H = bot - top + 1
    R, G, B = a[..., 0], a[..., 1], a[..., 2]; mx = a.max(2); mn = a.min(2)
    skin = m & (R > G) & (G > B) & (R - B > 45) & ((mx - mn) / np.maximum(mx, 1) > 0.3) & (mx > 90)
    skin[top + int(H * 0.40):] = False
    lab, n = ndimage.label(skin, structure=np.ones((3, 3)))
    if n == 0:
        return None
    sz = ndimage.sum(skin, lab, range(1, n + 1)); k = int(np.argmax(sz)) + 1
    yy, xx = np.where(lab == k)
    crown = np.where(m[:, max(0, xx.min() - 8):xx.max() + 9].any(1))[0][0]
    return yy.max() - crown + 1, bot - crown + 1


def page_scales(windows):
    """{(dir, file): relative scale} for the cutter's `pagescale`: each idle page 1, each walk and attack page the idle page's times the geometric mean of the head ratio
    and the body ratio (docstring); printed as `scales`"""
    cache, per = {}, {}
    for (d, view, row, i, fn, box) in windows:
        if (d, fn) not in cache:
            cache[(d, fn)] = np.asarray(Image.open(os.path.join(d, fn)).convert('RGB')).astype(np.float32)
        x0, y0, x1, y1 = box
        a = cache[(d, fn)][y0:y1, x0:x1]
        m = VS.figure(a, False, None, TOL)
        hb = head_and_body(a, m)
        if hb is None:
            continue
        pp = per.setdefault((d, fn), {'view': view, 'row': row, 'head': [], 'body': []})
        faced = view in ('S', 'SE', 'E')                                    # (from behind, NE and N, the brown run is a few px of hair: those pages go by the body alone)
        if row != 'attack':
            pp['body'].append(hb[1])
            if faced:
                pp['head'].append(hb[0])
        else:                                                               # (the attack: the body from the guard frames 1 and 6; the head from 1, 4, 5, 6, where the
            if i in (0, 5):                                                 #  raised hand is not by the face)
                pp['body'].append(hb[1])
            if i in (0, 3, 4, 5) and faced:
                pp['head'].append(hb[0])
    PS, idle = {}, {}
    for pg, p in per.items():
        if p['row'] == 'idle':
            idle[p['view']] = (pg, float(np.median(p['head'])) if p['head'] else None, float(np.median(p['body'])))
            PS[pg] = 1.0
    for pg, p in per.items():
        if p['row'] != 'idle':
            ipg, ih, ib = idle[p['view']]
            br = ib / np.median(p['body'])
            PS[pg] = float(np.sqrt((ih / np.median(p['head'])) * br)) if p['head'] else float(br)
            print('scales %-3s %-6s head %s (idle %s) body %.1f (idle %.1f) -> x%.3f' % (p['view'], p['row'], '%.1f' % np.median(p['head']) if p['head'] else '-',
                  '%.1f' % ih if ih else '-', np.median(p['body']), ib, PS[pg]))
    return PS


WINDOWS = read_map()
VS.LOOKS['guard_p1'] = dict(
    src='guard', windows=WINDOWS, bgtol=TOL, tall=TALL, name='Hired Sword', release={'attack': 3}, rows=[('idle', 6, 4), ('walk', 10, 8), ('attack', 12, 6)],
    pagescale=page_scales(WINDOWS),
    hold=['attack: printed 4 (zero-based 3), the contact, is the release; check in engine playback that the blade comes down there in every view (the art desk\'s notes: one descending strike)',
          'walk: contacts 1 and 5 read less distinctly in E and rear NE (the foreshortening), and NE\'s shortened stride carries to NW (the art desk\'s own note)',
          'attack row 6 frames against the old 8: check playback before changing any gameplay timing (the art desk\'s own note)'],
    source='drawn by the art desk (RECOSTUME-1127, 11-27: the Hired Sword and Hired Blade on realistic proportions, all five views), cut by tools/hiredsword-sheet.py over '
           'tools/vivian-sheet.py; SW W NW mirrored; worn by the Hired Sword and the Hired Blade')

if __name__ == '__main__':
    VS.cut('guard_p1')

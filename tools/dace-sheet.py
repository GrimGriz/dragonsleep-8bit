"""DEEP16 pipeline 2 (generated art): Corwen Dace fighting as the party's guest, the cloak of displacement on -> dace_p2, his fight sheet in all eight facings.

    python tools/dace-sheet.py            (writes deep16/art/dace_p2.png/.json)
    python tools/dace-sheet.py check      (also dev/visions/dace/: every row of every facing at 2x)

Asked in art-wanted section 32 on Griz's word (10-29): "1 - Daces, figure - art request what's needed to replace the floor figure / standing plain is fine,
we'll pretend the cloak can tell and kicks on in combat situations (fight poses when he's guest)". He stands plain where he stands (dace_p1); in a fight
the cloak kicks on: this sheet, in place of the class floor's wizard he fought in (npcwizard_p0, deep16/js/save.js SV.LOOK.dace). The art desk's
ART-123-DACE-COMBAT (10-29 night, eight zips: five CHECKPOINT facing packs, their REFERENCES-HISTORY, a CONTINUATION and its REVIEW; Griz: "4 - it's on
NE dagger cast right now, probably safe to start cutting when you run out of other stuff"), sorted into deep16/_src/dace/ART-123-DACE-COMBAT/ by
_src/art-desk/art123-dace-combat-sort-2026-10-30.py, the 45 current pages by its MASTER-MANIFEST.json (in the received folder's CONTINUATION/). One action
and one view a page, one band: HEAD 1 S, 2 SE, 3 E, 4 NE (from behind), 5 N; PAGE 1 Idle 6, 2 Walk 8, 3 Dagger 6, 4 Cast 6, 5 Use Item 4, 6 Flinch 4,
7 Fall 6, 8 Prone 1, 9 Sit 2. The art desk's own word: "SOURCE COVERAGE COMPLETE / REPAIRS OPEN. NOT A CLEAN COMPLETE COMBAT REPLACEMENT" -- 35 pages
PROVISIONAL, 10 HELD (every Walk, the SE Dagger, the SE and E Use Item, the N Fall and Prone). Cut here as they stand, the held ones too, on his
"gimpy art is part of the process" (10-30, of Talmok's): what a fuller budget would redo is on deep16-dream-polish.md. The meta's `hold` names them.

Rows (the engine's names): idle <- Idle 6; walk <- Walk 8; attack <- Dagger 6 (his one blow, the stab on 4: `release` 3); cast <- Cast 6 (the palm out
on 3: `release` 2); useitem <- Use Item 4; flinch <- Flinch 4; hurt <- Fall 6; prone <- Fall 2-6 then Prone 1 (where he lies: js/sprites.js S.proneRow);
sit <- Sit 2. Facings (RULED 10-14): S, SE, E, NE, N as drawn, SW, W, NW their mirrors (the afterimage trails the other way there).

How a page is cut: its drawings found as tools/portrait-sheet.py finds them (the navy by the page's edges, the printed words and numbers dropped as small
light text -- the NE Dagger's printed numbers are wrong, its MASTER says: the six read left to right), each with its afterimage. Every measure is
the real body's, the afterimage left out (portrait-sheet's ghost_mask, as dacedisp_p1's): his height, his feet's middle (talmok-sheet's feet_mid,
the two boots), his head's width; the cut keeps both, the afterimage below his own feet cut off so he stands on his own. The scale: he stands TALL
px sole to crown as dacedisp_p1 does; a page by its standing frames' median real height (STAND), the Sit by his head's width against the idle's,
the Prone by its real length against the Fall's last frame at the Fall page's scale. A standing frame on its feet's middle, one on the ground (the
fall's last four, the prone, the sit) on its real body's own middle, every frame on its real body's lowest pixel. Then boxed down, snapped to the
64 (red and fire left out: his satchel's and his hair's oxblood flecked the reds on his face's cut, 10-29 night) and outlined.
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
PS = _load('portraitsheet', os.path.join(ROOT, 'tools', 'portrait-sheet.py'))
TS = _load('talmoksheet', os.path.join(ROOT, 'tools', 'talmok-sheet.py'))
SRC = pix.SRC
ART = os.path.join(ROOT, 'deep16', 'art')
NAME = 'dace_p2'

TALL = 50                         # sole to crown, as dacedisp_p1 stands (its `top`)
PAGE = os.path.join(SRC, 'dace', 'ART-123-DACE-COMBAT', 'ART-123-DACE-COMBAT_HEAD-%d_PAGE-%d.png')
MASTER = os.path.join(SRC, 'art-desk', 'received-2026-10-30-ART-123-DACE-COMBAT', 'ART-123-DACE-COMBAT-CONTINUATION', 'MASTER-MANIFEST.json')
HEADS = {1: 0, 2: 7, 3: 6, 4: 5, 5: 4}        # the art desk's HEAD -> the sheet's facing (S SW W NW N NE E SE)
MIRROR = {1: 7, 2: 6, 3: 5}
GHOST = {'hues': (205, 285), 'smin': 0.3}     # (the afterimage's blue and its bright blue-violet edge: dacedisp's)
# page: (the action, its frames, the frames he stands in -- the scale's -- or how it is scaled)
PAGES = {1: ('Idle', 6, 'all'), 2: ('Walk', 8, 'all'), 3: ('Dagger', 6, [0, 5]), 4: ('Cast', 6, [0, 5]), 5: ('Use Item', 4, [0, 3]),
         6: ('Flinch', 4, [0, 3]), 7: ('Fall', 6, [0]), 8: ('Prone', 1, 'prone'), 9: ('Sit', 2, 'sit')}
GROUND = {('Fall', 2), ('Fall', 3), ('Fall', 4), ('Fall', 5), ('Prone', 0), ('Sit', 0), ('Sit', 1)}
AVOID = ['red', 'fire']
ROWS = [('idle', 6, 'Idle'), ('walk', 10, 'Walk'), ('attack', 12, 'Dagger'), ('cast', 10, 'Cast'), ('useitem', 8, 'Use Item'), ('flinch', 12, 'Flinch'),
        ('hurt', 10, 'Fall'), ('prone', 10, None), ('sit', 2, 'Sit')]
RELEASE = {'attack': 3, 'cast': 2}


def pixel(small):
    return pix.pixelate(Image.fromarray(small, 'RGBA'), 1, do_lift=False, avoid=AVOID)


def page_frames(head, pg, n):
    """a page's drawings: [(rgba at source size, the real body's feet x, its middle x, its height, its width, its head's width)]"""
    a = np.asarray(Image.open(PAGE % (head, pg)).convert('RGB')).astype(np.int32)
    gm = PS.ghost_mask(a, GHOST)
    found = PS.drawings(a, [n], edge=True)
    if len(found) != n:                                               # (afterimages joined to the next frame's -- the S walk's: split at the real bodies, as dacedisp_p1's)
        found = PS.split_ghosts(a, found, [n], gm, upper=0.95)
    if len(found) != n:
        raise SystemExit('HEAD %d PAGE %d: %d drawings found, %d wanted' % (head, pg, len(found), n))
    out = []
    for piece, box in found:
        real = piece & ~gm
        lb, k = ndimage.label(real, structure=np.ones((3, 3)))          # (the real body: its biggest piece and those beside it -- a fleck of the glow's violet is not him)
        sz = ndimage.sum(real, lb, range(1, k + 1)); real = np.isin(lb, 1 + np.where(sz >= 0.02 * sz.max())[0])
        rys, rxs = np.where(real)
        rt, rb = rys.min(), rys.max() + 1
        piece = piece.copy(); piece[rb:] = False                      # (the afterimage below his own feet cut off: he stands on his own)
        ys, xs = np.where(piece)
        t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = np.zeros((b - t, r - l, 4), np.uint8)
        rgba[..., :3] = a[t:b, l:r]; rgba[..., 3] = piece[t:b, l:r] * 255
        out.append((rgba, TS.feet_mid(real, rt, rb, l), rxs.mean() - l, rb - rt, np.ptp(rxs) + 1, TS.head_w(real, rb - rt), rb - t))
    return out


def cut():
    master = {(p['head'], p['page']): p for p in json.load(open(MASTER, encoding='utf-8-sig'))['pages']}
    faces, report, hold = {}, [], {}
    for head, f in HEADS.items():
        faces[f] = {}
        idle_hw = None
        for pg in sorted(PAGES):
            act, n, how = PAGES[pg]
            if master[(head, pg)]['status'].startswith('HOLD'):
                hold.setdefault(act, []).append(f)
            fr = page_frames(head, pg, n)
            if how == 'all' or isinstance(how, list):
                idx = list(range(n)) if how == 'all' else how
                k = TALL / float(np.median([fr[i][3] for i in idx]))
            elif how == 'sit':
                k = idle_hw / float(np.median([q[5] for q in fr]))     # (his head's width at game size, the idle's)
            elif how == 'prone':
                k = fall_k * fall_last / float(fr[0][4])
            if act == 'Idle':
                idle_hw = float(np.median([q[5] for q in fr])) * k
            if act == 'Fall':
                fall_k, fall_last = k, fr[-1][4]
            row = []
            for i, (rgba, fx, mx, h, w, hw, foot) in enumerate(fr):
                sm = TS.shrink(rgba, k)
                x = (mx if (act, i) in GROUND else fx) * k + 1
                row.append((sm, x, sm.shape[0]))
            faces[f][act] = row
            report.append('H%d %-9s k %.4f%s' % (head, act, k, '  HOLD' if master[(head, pg)]['status'].startswith('HOLD') else ''))
    for f, g in MIRROR.items():
        faces[f] = {act: [(px[:, ::-1].copy(), px.shape[1] - x, h) for px, x, h in row] for act, row in faces[g].items()}
        for act in hold:
            if g in hold[act]:
                hold[act].append(f)
    for f in faces:
        faces[f] = {act: [(pixel(sm), x, h) for sm, x, h in row] for act, row in faces[f].items()}
    rows = {}
    for f in range(8):
        d = faces[f]
        for anim, fps, act in ROWS:
            rows.setdefault(anim, {})[f] = d[act] if act else d['Fall'][1:] + d['Prone']
    T = max(px.shape[0] for r in rows.values() for fs in r.values() for px, x, h in fs) + 2
    fh, ay = T + 3, T
    meta = {'image': 'art/%s.png' % NAME, 'anims': {}}
    blocks, y0, width = [], 0, 0
    for anim, fps, act in ROWS:
        allf = [q for fs in rows[anim].values() for q in fs]
        L = max(x for px, x, h in allf) + 2; R = max(px.shape[1] - x for px, x, h in allf) + 2
        half = int(np.ceil(max(L, R))); fw, ax = 2 * half, half
        nf = len(rows[anim][0])
        blk = np.zeros((8 * fh, nf * fw, 4), np.uint8)
        for f in range(8):
            for i, (px, x, h) in enumerate(rows[anim][f]):
                ox, oy = int(round(ax - x)), ay - px.shape[0] + 1
                cell = blk[f * fh:(f + 1) * fh, i * fw:(i + 1) * fw]
                on = px[..., 3] > 0
                cell[oy:oy + px.shape[0], ox:ox + px.shape[1]][on] = px[on]
        an = {'y': y0, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'frames': nf, 'fps': fps}
        if anim in RELEASE:
            an['release'] = RELEASE[anim]
        meta['anims'][anim] = an
        blocks.append(blk); y0 += 8 * fh; width = max(width, blk.shape[1])
    sheet = np.zeros((y0, width, 4), np.uint8); y = 0
    for blk in blocks:
        sheet[y:y + blk.shape[0], :blk.shape[1]] = blk; y += blk.shape[0]
    idle0 = meta['anims']['idle']
    meta.update(fw=idle0['fw'], fh=fh, ax=idle0['ax'], ay=ay, top=TALL)
    meta['hold'] = {a: sorted(set(v)) for a, v in hold.items()}     # (the art desk's HELD pages, cut as drawn: facing numbers, mirrors included)
    meta['source'] = ('drawn by the art desk (ART-123-DACE-COMBAT, his fight poses in five views in the cloak of displacement, 10-29 night -- its own word '
                      '"SOURCE COVERAGE COMPLETE / REPAIRS OPEN"), cut and snapped by tools/dace-sheet.py')
    os.makedirs(ART, exist_ok=True)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, NAME + '.png'), optimize=True)
    json.dump(meta, open(os.path.join(ART, NAME + '.json'), 'w'), indent=1)
    print('  %s: %dx%d, %s' % (NAME, sheet.shape[1], sheet.shape[0], ', '.join('%s %d (%dx%d)' % (a, meta['anims'][a]['frames'], meta['anims'][a]['fw'], fh) for a, _, _ in ROWS)))
    return sheet, meta, report


if __name__ == '__main__':
    sheet, meta, report = cut()
    if 'check' in sys.argv[1:]:
        print('\n'.join(report))
        d = os.path.join(ROOT, 'dev', 'visions', 'dace'); os.makedirs(d, exist_ok=True)
        for anim, an in meta['anims'].items():
            blk = sheet[an['y']:an['y'] + 8 * an['fh'], :an['frames'] * an['fw']]
            cv = np.zeros(blk.shape[:2] + (3,), np.uint8); cv[...] = (14, 22, 52)
            for f in range(8):
                cv[f * an['fh'] + an['ay'], :] = (90, 70, 50)
            al = blk[..., 3:4] / 255.0; cv = (blk[..., :3] * al + cv * (1 - al)).astype(np.uint8)
            Image.fromarray(cv).resize((cv.shape[1] * 2, cv.shape[0] * 2), Image.NEAREST).save(os.path.join(d, '%s.png' % anim))
        print('  dev/visions/dace/<row>.png')

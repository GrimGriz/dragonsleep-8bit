"""DEEP16 pipeline 0's last step: the art desk's new views of an LPC figure written into its sheet (ART-61 to ART-67, 10-15).

    python tools/lpc-diag-sheet.py trooper           # deep16/art/trooper_p0.png + .json: the pages' rows written in
    python tools/lpc-diag-sheet.py trooper check     # dev/visions/lpc-trooper/: each page's cut, every facing of every row, the strips,
                                                     # both colour passes side by side, and the proof that no other row moved

The seven LPC people (tools/lpc-compose.py -> tools/lpc-squash.py for the dwarves -> tools/pixelate.py p0) are drawn by the Liberated
Pixel Cup generator in four directions: front, left, back, right, and Hurt from the front only. pixelate.py lays them on the house's
eight facings by LPC_FOR_FACING, so SE and SW borrow the front, NE and NW the back, and every facing's Hurt is the one front fall.
Griz, 10-15: "make sure we have all 8 facings for those to be used in snoot fight animations", "exclude the main party facings - but
include the NPC", and "(a) Yeah - I think we'll need to build the first-sheets out the LPC stuff we have to give to the art team to make
the other poses". The art desk was given each figure's sheet at 3x (deep16/_src/outbox/ART-SNOOTNPCS-2026-10-15/) and asked for
HEAD 1 = SE (every row), HEAD 2 = NE (every row), HEAD 4 = E's Hurt, HEAD 5 = N's Hurt, drawn in the LPC style.

This is the pipeline's LAST step: pixelate.py p0 calls apply() after it writes the sheet, so a re-run of lpc-compose, lpc-squash or
pixelate keeps the new views; run alone, it writes them into the sheet as it stands (it reads only the rows it never writes, so a second
run changes nothing). What it does, a page at a time:
    cut      each page by its own row and number labels (tools/sheetrows.py); the spec below is read off the page by hand, once
    scale    the page's standing figure (`ref`) to the sheet's S idle figure by height, outline to outline: the art desk drew each page at
             its own size (ART-61: HEAD 1 about 3.4x, HEADs 4 and 5 about 4.8x), so one factor per page, never one for all
    colour   box-filtered down (alpha-premultiplied), then each pixel snapped to the sheet's OWN colours (the LPC figure's 23 for the
             trooper, nearest in Lab), and pixelate's 1-px outline ring round the silhouette, as the LPC rows have it. `check` draws the
             other way too, pixelate p0's (the house palette, 64 colours) -- COLOURS picks
    place    each frame's body on the cell's anchor: x by the torso (the median opaque column over the middle half of its height: a mace
             held out is thin), y by the feet -- idle, walk and attack on the ground (the LPC rows' foot line, ay + 1, outline and
             all); Hurt as the page stages it, frame 1 on the ground and each later frame as far above or below it as the page draws
             (a body lying toward the eye reaches lower)
    write    the view's row in every anim the page draws, and its mirror (SE -> SW, E -> W, NE -> NW: a flip about the anchor column);
             a page marked `flip` is mirrored first (ART-61's N Hurt: the weapon hand, below)
A Hurt drawn lying is longer than LPC's 64-px cell: the hurt block is re-laid in a bigger cell (HURT_CELL), every row about the same
anchor, so the rows it does not write keep every pixel where it was relative to the foot. Every row not written is checked equal to the
sheet before the step (`check` proves it; apply() refuses to write otherwise).
"""
import json, os, subprocess, sys
import importlib.util
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod


pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SR = _load('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))

SRC = os.path.join(ROOT, 'deep16', '_src')                  # the pages live in the main checkout (_src is not in git): a worktree reads them there
if not os.path.isdir(SRC):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

FACINGS = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']         # deep16/js/sprites.js S.FACINGS
MIRROR = {'SE': 'SW', 'E': 'W', 'NE': 'NW'}                    # RULED 10-14: five drawn views, the left three mirrored
COLOURS = 'own'                                               # 'own': the sheet's own colours; 'house': pixelate p0's (deep16/palette.json)
HURT_CELL = (128, 80)                                         # (fw, fh) of the hurt block once a page writes into it; the anchor's x at the
                                                              # middle, its y where LPC's is (61), the room below for a body lying nearer
NUM = lambda k: [str(i + 1) for i in range(k)]

# Each figure: its pages, each read off the page by hand -- the text boxes (a blob wholly inside one is lettering: the row names, and a
# strip the page's width under each row, where its numbers stand), and the rows (the sheet's anim, band x0 y0 x1 y1, its number strip
# y0 y1, the numbers). `view` is the facing the page draws; `ref` the page's standing frame its scale is read from. `owed` is what the art
# desk has not sent yet: those facings stay as pixelate.py lays them.
FIGS = {
    'trooper': dict(                                          # ART-61, 10-15: three pages of four, PARTIAL (deep16/_src/trooper/ART-61/)
        dir='trooper/ART-61',
        pages={
            'H1P1': dict(file='ART-61_HEAD-1_PAGE-1.png', view='SE', ref=('idle', '1'),          # SE: Idle 2, Walk 9, Attack 6, Hurt 6
                         text=[(0, 85, 145, 140), (0, 262, 145, 315), (0, 440, 145, 492), (0, 618, 145, 670),
                               (150, 167, 2067, 193), (150, 352, 2067, 377), (150, 540, 2067, 568), (150, 719, 2067, 746)],
                         rows=[('idle', (150, 10, 2067, 167), (167, 193), NUM(2)),
                               ('walk', (150, 193, 2067, 352), (352, 377), NUM(9)),
                               ('attack', (150, 378, 2067, 540), (540, 568), NUM(6)),
                               ('hurt', (150, 568, 2067, 719), (719, 746), NUM(6))]),
            'H4P1': dict(file='ART-61_HEAD-4_PAGE-1.png', view='E', ref=('hurt', '1'),           # E: Hurt 6
                         text=[(0, 445, 170, 515), (180, 516, 2172, 556)],
                         rows=[('hurt', (180, 280, 2172, 516), (516, 556), NUM(6))]),
            # (flip: drawn with the front's left hand, so from behind its mace is on screen-left where LPC's N rows carry it on
            # screen-right, the right hand -- mirrored, it falls with the mace in the hand it stood with; a back view is near enough
            # symmetric to take it. RULED 10-15, Griz: "2 yes" -- `flip` off would draw it as the art desk did)
            'H5P1': dict(file='ART-61_HEAD-5_PAGE-1.png', view='N', ref=('hurt', '1'), flip=True,  # N: Hurt 6
                         text=[(0, 385, 140, 450), (150, 524, 2137, 565)],
                         rows=[('hurt', (150, 285, 2137, 524), (524, 565), NUM(6))]),
        },
        owed={'H2P1': 'NE (NW mirrored): Idle 2, Walk 9, Attack 6, Hurt 6 -- open at the art desk'}),
}


# ------------------------------------------------------------------------------------------------------------------------- the sheet
def read_sheet(name, art=None):
    art = art or pix.ART
    meta = json.load(open(os.path.join(art, name + '.json'), encoding='utf-8'))
    sheet = np.asarray(Image.open(os.path.join(art, name + '.png')).convert('RGBA')).copy()
    return meta, sheet


def cells(meta, sheet):
    """{anim: [[frame, ...] for each of the 8 facings]} cut from the sheet by its frame map"""
    out = {}
    for an, a in meta['anims'].items():
        out[an] = [[sheet[a['y'] + f * a['fh']:a['y'] + (f + 1) * a['fh'], i * a['fw']:(i + 1) * a['fw']].copy() for i in range(a['frames'])]
                   for f in range(8)]
    return out


def dims(meta, an):
    a = meta['anims'][an]
    return a['fw'], a['fh'], a['ax'], a['ay']


def recell(fr, old, new):
    """a frame moved into a cell of another size, its anchor kept: old and new are (fw, fh, ax, ay)"""
    out = np.zeros((new[1], new[0], 4), np.uint8)
    dx, dy = new[2] - old[2], new[3] - old[3]
    h, w = fr.shape[:2]
    ys, xs = np.where(fr[..., 3] > 0)
    if len(ys) and (xs.min() + dx < 0 or xs.max() + dx >= new[0] or ys.min() + dy < 0 or ys.max() + dy >= new[1]):
        raise SystemExit('recell: a frame does not fit the new cell %s' % (new,))
    sy0, sx0 = max(0, -dy), max(0, -dx)
    ty0, tx0 = max(0, dy), max(0, dx)
    hh, ww = min(h - sy0, new[1] - ty0), min(w - sx0, new[0] - tx0)
    out[ty0:ty0 + hh, tx0:tx0 + ww] = fr[sy0:sy0 + hh, sx0:sx0 + ww]
    return out


def height(a):
    rows = np.where(a[..., 3].any(axis=1))[0]
    return int(rows[-1] - rows[0] + 1)


# ----------------------------------------------------------------------------------------------------------------------- the colour
def own_palette(sheet):
    """the sheet's own opaque colours: the LPC figure's, as pixelate p0 snapped them (its own outline and the ring share the darkest)"""
    u = np.unique(sheet[sheet[..., 3] > 0][:, :3], axis=0)
    return u.astype(np.float32), pix.to_lab(u.astype(np.float32) / 255.0)


def snap_to(rgb01, pal):
    prgb, plab = pal
    lab = pix.to_lab(rgb01)
    d = ((lab[..., None, :] - plab[None, None, :, :]) ** 2).sum(-1)
    return prgb[d.argmin(-1)].astype(np.uint8)


def lab_to_rgb(lab):
    """pixelate.to_lab's inverse (sRGB, D65), 0..1"""
    fy = (lab[..., 0] + 16) / 116
    f = np.stack([fy + lab[..., 1] / 500, fy, fy - lab[..., 2] / 200], -1)
    xyz = np.where(f > 0.206893, f ** 3, (f - 16 / 116) / 7.787) * np.array([0.95047, 1.0, 1.08883], dtype=np.float32)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]], dtype=np.float32)
    lin = np.clip(xyz @ np.linalg.inv(m).T, 0, None)
    return np.clip(np.where(lin > 0.0031308, 1.055 * lin ** (1 / 2.4) - 0.055, 12.92 * lin), 0, 1)


def lab_moments(px):
    """(mean, std) in Lab of an Nx3 uint8 colour list, its outline left out (L under 12: the drawn line and pixelate's ring)"""
    lab = pix.to_lab(px.astype(np.float32) / 255.0)
    lab = lab[lab[:, 0] >= 12]
    return lab.mean(0), lab.std(0)


def toned(im, src, ref):
    """a page's cut toned to the LPC rows' colour: in Lab, its lightness to the rows' mean and spread, its a and b moved by the difference
    of the means (the art desk drew the mail warmer and the box filter greys its checker to tan: ART-61, 10-15)"""
    a = np.asarray(im).astype(np.float32)
    lab = pix.to_lab(a[..., :3] / 255.0)
    (ms, ss), (mr, sr) = src, ref
    lab[..., 0] = (lab[..., 0] - ms[0]) * (sr[0] / ss[0]) + mr[0]
    lab[..., 1:] += (mr[1:] - ms[1:])
    a[..., :3] = lab_to_rgb(lab) * 255
    return Image.fromarray(np.clip(a.round(), 0, 255).astype(np.uint8), 'RGBA')


def fit(im, k, pal):
    """a page's cut (RGBA, hard alpha) at 1/k: box-filtered alpha-premultiplied, cut at half alpha, snapped to `pal` (None: pixelate p0's
    house palette), and the 1-px outline ring round the silhouette -- pixelate.py's pixelate() with the palette as a choice"""
    w, h = im.size
    small = im.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (small.width + 2, small.height + 2), (0, 0, 0, 0))
    pad.paste(small, (1, 1))
    if pal is None:
        return pix.pixelate(pad, 1, do_lift=False)
    a = np.asarray(pad, dtype=np.float32) / 255.0
    solid = a[..., 3] >= 0.5
    out = np.zeros(a.shape[:2] + (4,), np.uint8)
    out[solid, :3] = snap_to(a[..., :3], pal)[solid]
    out[solid, 3] = 255
    e = np.zeros_like(solid)
    e[1:, :] |= solid[:-1, :]; e[:-1, :] |= solid[1:, :]; e[:, 1:] |= solid[:, :-1]; e[:, :-1] |= solid[:, 1:]
    edge = e & ~solid
    out[edge, :3] = pix.OUTLINE
    out[edge, 3] = 255
    return out


# ------------------------------------------------------------------------------------------------------------------------ the place
def torso_x(a):
    """the middle of the body: the median opaque column over the middle half of its height (a mace held out is thin)"""
    rows = np.where(a[..., 3].any(axis=1))[0]
    top, bot = rows[0], rows[-1]
    band = a[top + (bot - top) * 25 // 100: top + (bot - top) * 75 // 100 + 1, :, 3] > 0
    ys, xs = np.where(band)
    return float(np.median(xs)) if len(xs) else a.shape[1] / 2


def place(a, cell, up=0, tag='', clipped=None):
    """the fitted frame into a cell (fw, fh, ax, ay): its torso on ax, its lowest row (the feet's outline) on ay + 1, or `up` px above"""
    fw, fh, ax, ay = cell
    a = a[:np.where(a[..., 3].any(axis=1))[0][-1] + 1]
    out = np.zeros((fh, fw, 4), np.uint8)
    ox, oy = int(round(ax - torso_x(a))), ay + 1 - (a.shape[0] - 1) - up
    h, w = a.shape[:2]
    rr, cc = np.where(a[..., 3].any(axis=1))[0], np.where(a[..., 3].any(axis=0))[0]
    if ox + cc[0] < 0 or ox + cc[-1] >= fw or oy + rr[0] < 0 or oy + rr[-1] >= fh:
        if clipped is not None:
            clipped.append((tag, int(ox + cc[0]), int(ox + cc[-1]), int(oy + rr[0]), int(oy + rr[-1])))
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(fh, oy + h), min(fw, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def mirror(fr, ax):
    """the left-hand view of a drawn right-hand one: a flip about the anchor column"""
    fw = fr.shape[1]
    f = fr[:, ::-1]
    s = 2 * ax - (fw - 1)                                     # where the flip puts the anchor, back onto ax
    out = np.zeros_like(fr)
    if s >= 0:
        out[:, s:] = f[:, :fw - s]
    else:
        out[:, :fw + s] = f[:, -s:]
    return out


# ------------------------------------------------------------------------------------------------------------------------ the pages
TONE_REF = {'SE': ('S', 'E'), 'E': ('E',), 'N': ('N',), 'NE': ('N', 'E')}   # the LPC views a page's colour is toned to: the views beside it


def view_moments(old, views):
    """the Lab moments of the sheet's own idle and walk in the named LPC views"""
    return lab_moments(np.concatenate([fr[fr[..., 3] > 0][:, :3] for v in views for an in ('idle', 'walk')
                                       for fr in old[an][FACINGS.index(v)]]))


def page_moments(cuts, pg):
    """the Lab moments of a page's standing figures: its idle and walk, or (a page of falls) its first two frames"""
    rows = [r for r in ('idle', 'walk') if r in cuts]
    ims = [im for r in rows for _, im, _ in cuts[r]] if rows else [im for _, im, _ in cuts[pg['ref'][0]][:2]]
    return lab_moments(np.concatenate([np.asarray(im)[np.asarray(im)[..., 3] > 0][:, :3] for im in ims]))


def cut_pages(fig, ref_h, cellof, pal, old, tone=True, overlays=None, report=None):
    """the figure's pages -> {view: {anim: [frame, ...]}}, every frame toned, fitted and placed in its anim's cell. ref_h: the sheet's S idle
    figure height without its outline ring; cellof(anim) -> (fw, fh, ax, ay); pal: the palette to snap to (None: the house's); old: the
    sheet's cells (the tone's reference)."""
    cfg = FIGS[fig]
    views, clipped = {}, []
    for L, pg in cfg['pages'].items():
        over = [] if overlays is not None else None
        cuts = SR.cut_sheet(os.path.join(SRC, cfg['dir'], pg['file']), pg, overlay=over, tag=L)
        if overlays is not None:
            overlays[L] = over[0]
        ran, rnm = pg['ref']
        rim = dict((nm, im) for nm, im, _ in cuts[ran])[rnm]
        k = height(np.asarray(rim)) / float(ref_h)            # page px a game px (the cut carries the page's own drawn outline: LPC's own)
        src, ref = page_moments(cuts, pg), view_moments(old, TONE_REF[pg['view']])
        if report is not None:
            report.append('%s (%s): %s %s stands %d px of page -> k %.3f; tone L %.1f/%.1f -> %.1f/%.1f, a %+.1f, b %+.1f (to %s)'
                          % (L, pg['view'], ran, rnm, height(np.asarray(rim)), k, src[0][0], src[1][0], ref[0][0], ref[1][0],
                             ref[0][1] - src[0][1], ref[0][2] - src[0][2], '+'.join(TONE_REF[pg['view']])))
        for an, frs in cuts.items():
            cell = cellof(an)
            floor = frs[0][2][3]                               # the row's ground on the page: frame 1's feet
            seq = []
            for nm, im, box in frs:
                a = fit(toned(im, src, ref) if tone else im, k, pal)
                up = int(round((floor - box[3]) / k)) if an == 'hurt' else 0
                fr = place(a, cell, up, '%s-%s%s' % (L, an, nm), clipped)
                seq.append(mirror(fr, cell[2]) if pg.get('flip') else fr)
            views.setdefault(pg['view'], {})[an] = seq
    return views, clipped


def written(fig):
    """(anim, facing index) pairs the figure's pages write"""
    out = set()
    for L, pg in FIGS[fig]['pages'].items():
        for an, *_ in pg['rows']:
            out.add((an, FACINGS.index(pg['view'])))
            if pg['view'] in MIRROR:
                out.add((an, FACINGS.index(MIRROR[pg['view']])))
    return out


def build(fig, meta, sheet, colours=None, overlays=None, report=None, tone=True):
    """-> (meta, sheet) with the pages' rows written in; the rows not written equal to the input's, about their anchors (asserted)"""
    meta = json.loads(json.dumps(meta))
    old = cells(meta, sheet)
    od = {an: dims(meta, an) for an in meta['anims']}
    # the scale's reference: the S idle's figure, frame 1, outline ring off
    ref_h = height(old['idle'][0][0]) - 2
    if report is not None:
        report.append('%s_p0 S idle 1 stands %d px with its outline ring, %d without' % (fig, ref_h + 2, ref_h))
    w = written(fig)
    new_dims = dict(od)
    if any(an == 'hurt' for an, _ in w):
        fw, fh = HURT_CELL
        new_dims['hurt'] = (fw, fh, fw // 2, od['hurt'][3])
    pal = own_palette(sheet) if (colours or COLOURS) == 'own' else None
    views, clipped = cut_pages(fig, ref_h, lambda an: new_dims[an], pal, old, tone, overlays, report)
    frames = {an: [[recell(fr, od[an], new_dims[an]) if new_dims[an] != od[an] else fr for fr in old[an][f]] for f in range(8)]
              for an in old}
    for view, rows in views.items():
        f = FACINGS.index(view)
        for an, seq in rows.items():
            n = len(frames[an][f])
            if len(seq) != n:
                raise SystemExit('%s %s %s: %d frames drawn, the sheet plays %d' % (fig, view, an, len(seq), n))
            frames[an][f] = seq
            if view in MIRROR:
                frames[an][FACINGS.index(MIRROR[view])] = [mirror(fr, new_dims[an][2]) for fr in seq]
    # lay the sheet: the anims in their own order, each a block of 8 rows (pixelate.write_sheet's layout)
    anims = sorted(meta['anims'], key=lambda an: meta['anims'][an]['y'])
    width = max(len(frames[an][0]) * new_dims[an][0] for an in anims)
    hgt = sum(8 * new_dims[an][1] for an in anims)
    out = np.zeros((hgt, width, 4), np.uint8)
    y0 = 0
    for an in anims:
        fw, fh, ax, ay = new_dims[an]
        meta['anims'][an].update({'y': y0, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay})
        for f in range(8):
            for i, fr in enumerate(frames[an][f]):
                out[y0 + f * fh:y0 + (f + 1) * fh, i * fw:(i + 1) * fw] = fr
        y0 += 8 * fh
    meta['diag'] = {'by': 'tools/lpc-diag-sheet.py', 'from': FIGS[fig]['dir'].split('/')[-1],
                    'drawn': ['%s %s' % (pg['view'], '/'.join(r[0] for r in pg['rows'])) for pg in FIGS[fig]['pages'].values()],
                    'owed': list(FIGS[fig]['owed'].values()),
                    'lpc_cells': {an: list(od[an]) for an in od if new_dims[an] != od[an]}}
    bad = unchanged_check(fig, meta, out, od, old)
    if bad:
        raise SystemExit('%s: rows that were not to move moved: %s' % (fig, bad))
    return meta, out, views, clipped


def unchanged_check(fig, meta, sheet, od, old):
    """every (anim, facing) the pages do not write: each frame equal to the old one about its anchor, the new cell's margin empty"""
    w, bad = written(fig), []
    now = cells(meta, sheet)
    for an in old:
        nd = dims(meta, an)
        for f in range(8):
            if (an, f) in w:
                continue
            for i, fr in enumerate(old[an][f]):
                back = recell(now[an][f][i], nd, od[an]) if nd != od[an] else now[an][f][i]
                if not np.array_equal(back, fr) or now[an][f][i][..., 3].sum() != fr[..., 3].sum():
                    bad.append('%s %s %d' % (an, FACINGS[f], i + 1))
    return bad


def apply(fig, art=None, quiet=False):
    """pixelate.py p0's last step (and this file's own run): the figure's pages written into deep16/art/<fig>_p0"""
    if fig not in FIGS:
        return False
    art = art or pix.ART
    name = fig + '_p0'
    meta, sheet = read_sheet(name, art)
    if 'diag' in meta:                                        # already written: start from the rows pixelate laid (a second run changes nothing)
        return apply_again(fig, art, meta, sheet, quiet)
    meta2, out, views, clipped = build(fig, meta, sheet)
    for t in clipped:
        print('  CLIPPED %s: x %d-%d y %d-%d' % t)
    Image.fromarray(out, 'RGBA').save(os.path.join(art, name + '.png'), optimize=True)
    json.dump(meta2, open(os.path.join(art, name + '.json'), 'w'), indent=1)
    if not quiet:
        print('  %s: %s written in (%dx%d)' % (name, ', '.join(sorted(views)), out.shape[1], out.shape[0]))
    return True


def apply_again(fig, art, meta, sheet, quiet):
    """the sheet already carries the pages: the diag step's input is what pixelate laid, so undo to it -- the written rows back to what
    LPC_FOR_FACING borrows, the hurt cell back to LPC's -- and write again"""
    base_meta, base = unwritten(fig, meta, sheet)
    meta2, out, views, clipped = build(fig, base_meta, base)
    same = np.array_equal(out, sheet) and meta2 == meta
    if not same:
        Image.fromarray(out, 'RGBA').save(os.path.join(art, fig + '_p0.png'), optimize=True)
        json.dump(meta2, open(os.path.join(art, fig + '_p0.json'), 'w'), indent=1)
    if not quiet:
        print('  %s_p0: %s' % (fig, 'already carries its pages, unchanged' if same else 'pages written in again'))
    return True


def unwritten(fig, meta, sheet):
    """the sheet as pixelate.py p0 laid it: each written row back to the LPC row LPC_FOR_FACING borrows, each cell back to LPC's size"""
    meta = json.loads(json.dumps(meta))
    lpc_cells = meta.pop('diag').get('lpc_cells', {})
    cur = cells(meta, sheet)
    lpc = {'down': 0, 'left': 2, 'up': 4, 'right': 6}           # the facing that holds each LPC row as drawn (S, W, N, E)
    w = written(fig)
    base = {}
    for an in meta['anims']:
        nd = dims(meta, an)
        od = tuple(lpc_cells.get(an, nd))
        rows = []
        for f in range(8):
            if (an, f) in w:
                src = 0 if an == 'hurt' else lpc[pix.LPC_FOR_FACING[f]]      # (LPC's hurt is one row, the front's)
                rows.append([recell(fr, nd, od) if od != nd else fr for fr in cur[an][src]])
            else:
                rows.append([recell(fr, nd, od) if od != nd else fr for fr in cur[an][f]])
        base[an] = (od, rows)
    anims = sorted(meta['anims'], key=lambda an: meta['anims'][an]['y'])
    width = max(len(base[an][1][0]) * base[an][0][0] for an in anims)
    out = np.zeros((sum(8 * base[an][0][1] for an in anims), width, 4), np.uint8)
    y0 = 0
    for an in anims:
        (fw, fh, ax, ay), rows = base[an]
        meta['anims'][an].update({'y': y0, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay})
        for f in range(8):
            for i, fr in enumerate(rows[f]):
                out[y0 + f * fh:y0 + (f + 1) * fh, i * fw:(i + 1) * fw] = fr
        y0 += 8 * fh
    return meta, out


# ------------------------------------------------------------------------------------------------------------------------ the check
def check(fig):
    """dev/visions/lpc-<fig>/: the cuts, every facing of every row (both colour passes), the strips, and the proof"""
    d = os.path.join(ROOT, 'dev', 'visions', 'lpc-' + fig)
    os.makedirs(d, exist_ok=True)
    meta, sheet = read_sheet(fig + '_p0')
    if 'diag' in meta:
        meta, sheet = unwritten(fig, meta, sheet)
    report, overlays = [], {}
    m_own, s_own, v_own, c_own = build(fig, meta, sheet, 'own', overlays, report)
    m_house, s_house, _, _ = build(fig, meta, sheet, 'house')
    m_raw, s_raw, _, _ = build(fig, meta, sheet, 'own', tone=False)
    for L, im in overlays.items():
        im.save(os.path.join(d, 'cut-%s.png' % L))
    for line in report:
        print('  ' + line)
    for t in c_own:
        print('  CLIPPED %s: x %d-%d y %d-%d' % t)
    for an in m_own['anims']:
        facings_png(m_own, s_own, an, os.path.join(d, 'facings-%s.png' % an))
    strips(((COLOURS, m_own, s_own), ('house', m_house, s_house), ('untoned', m_raw, s_raw)), d)
    print('  unchanged: every row the pages do not write equals the sheet before the step (%d rows written, %d kept)'
          % (len(written(fig)), 4 * 8 - len(written(fig))))
    print('  wrote', d)


def facings_png(meta, sheet, an, path, scale=2):
    fw, fh, ax, ay = dims(meta, an)
    cs = cells(meta, sheet)[an]
    n = len(cs[0])
    cv = Image.new('RGBA', (fw * n + 4 * (n + 1) + 24, fh * 8), (70, 74, 70, 255))
    dr = ImageDraw.Draw(cv)
    for f in range(8):
        dr.line([(0, f * fh + ay + 1), (cv.width, f * fh + ay + 1)], fill=(110, 114, 110, 255))
        dr.text((2, f * fh + 2), FACINGS[f], fill=(255, 255, 255, 255))
        for i, fr in enumerate(cs[f]):
            cv.alpha_composite(Image.fromarray(fr, 'RGBA'), (24 + 4 + i * (fw + 4), f * fh))
    cv.resize((cv.width * scale, cv.height * scale), Image.NEAREST).save(path)


def strips(passes, d):
    """the new SE between the old S and E, each row at game size and at 4x, for each colour pass (the sheet's is the first)"""
    for tag, mm, ss in passes:
        cs = cells(mm, ss)
        for scale in (1, 4):
            blocks = []
            for an in mm['anims']:
                fw, fh, ax, ay = dims(mm, an)
                for f in (0, 7, 6):                            # S, SE, E
                    row = cs[an][f]
                    # a window round the figure: the attack's 192 cell cut to its swing
                    blocks.append((an, FACINGS[f], row, (fw, fh, ax, ay)))
            img = strip_image(blocks, scale)
            img.save(os.path.join(d, 'strip-S-SE-E-%s-%dx.png' % (tag, scale)))


def strip_image(blocks, scale):
    win = {}
    for an, fc, row, (fw, fh, ax, ay) in blocks:
        cols = np.where(np.any([fr[..., 3].any(axis=0) for fr in row], axis=0))[0]
        rws = np.where(np.any([fr[..., 3].any(axis=1) for fr in row], axis=0))[0]
        w = win.setdefault(an, [fw, 0, fh, 0])
        w[0], w[1] = min(w[0], cols[0]), max(w[1], cols[-1] + 1)
        w[2], w[3] = min(w[2], rws[0]), max(w[3], rws[-1] + 1)
    lab = 34
    W = max(lab + len(row) * (win[an][1] - win[an][0] + 2) for an, _, row, _ in blocks)
    H = sum(win[an][3] - win[an][2] + 2 for an, _, _, _ in blocks)
    cv = Image.new('RGBA', (W, H), (70, 74, 70, 255))
    y = 0
    for an, fc, row, _ in blocks:
        x0, x1, y0, y1 = win[an]
        for i, fr in enumerate(row):
            cv.alpha_composite(Image.fromarray(np.ascontiguousarray(fr[y0:y1, x0:x1]), 'RGBA'), (lab + i * (x1 - x0 + 2), y + 1))
        y += y1 - y0 + 2
    big = cv.resize((W * scale, H * scale), Image.NEAREST)
    dr = ImageDraw.Draw(big)
    y = 0
    for an, fc, row, _ in blocks:
        x0, x1, y0, y1 = win[an]
        dr.text((2, y * scale + 2), '%s %s' % (an[:4], fc), fill=(255, 255, 255, 255))
        y += y1 - y0 + 2
    return big


if __name__ == '__main__':
    args = sys.argv[1:]
    figs = [a for a in args if a in FIGS] or list(FIGS)
    for fig in figs:
        if 'check' in args:
            check(fig)
        else:
            apply(fig)

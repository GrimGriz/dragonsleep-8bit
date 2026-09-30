"""DEEP16 pipeline 2 (generated art): Griz's generated owl sheets (two for each owl) -> two palette sprite sheets, the wizard's familiar (Find Familiar).

    python tools/owl-sheet.py            # deep16/art/snowyowl_p2.png/.json and deep16/art/owl_p2.png/.json
    python tools/owl-sheet.py preview    # dev/shots/owl-cuts.png: both owls, every anim, facings S, E and N side by side, 3x, on grey

Sources (Griz, 2026-09-29, generated; the familiar is a Tiny creature and the owl is the headline one -- it has Flyby: it swoops
in, harasses a foe for an ally's advantage, and flies back out). The snowy owl is the snowfield's ("SNOWY REGIONAL FORM"), the brown
one the plains' and forests':
  deep16/_src/snowyowl_grok_1.jpg and owl_grok_1.jpg   sheet ONE. A turnaround (not used: its labels are wrong on the brown sheet, and
      sheet two's is right) and rows facing right: Perch, Fly (the snowy's Perch is only the height that sets its scale), then
      Harass 6 (swooping, talons out), Flyby 6 (gliding), Hurt 6, Vanish 6 (bursts into a puff of snow-light; the brown one's sixth
      is empty, dropped: five frames, the last a few specks). The brown sheet draws a branch with leaves into every Perch and Fly
      frame: those two rows are NOT used.
  deep16/_src/snowyowl_grok_2.jpg and owl_grok_2.jpg   sheet TWO, the same creatures larger: a turnaround (Front, Right, Back, Left),
      Stand (brown 7, snowy 8: only the first five face right, the rest turn to face left, dropped), Hover (brown 7, snowy 8: the
      wings-up frames only, the folded ones dropped: brown 4, snowy 6), Fly Toward 6 (seen from the front, wings beating) and Fly
      Away 6 (seen from the back).
What each row became (both owls the same):
    idle    <- Stand (5, standing on AY); S the sheet-two Front still and N its Back still, each with a one-pixel breathe
    walk    <- Hover (hovering; the brown's four wings-up frames run 1-2-3-4-3-2, six with the Fly Toward's); S Fly Toward, N Fly Away
    fly     <- sheet one's Flyby (hovering); S Fly Toward, N Fly Away
    attack  <- sheet one's Harass (hovering)
    flinch  <- sheet one's Hurt (hovering): a blow that lands and doesn't drop it, played once
    hurt    <- sheet one's Vanish: the engine plays `hurt` once when a creature goes down, and a familiar drops to 0 with no body
               (SRD): it bursts into the puff and is gone. The sparkle is kept (a lower alpha cut for this row and Hurt's, soft-
               alpha clouds for its owl-less frames), it is the death.
Facings: the side rows take the six sideways facings (NE/E/SE as drawn, SW/W/NW mirrored, as the gnoll's and the hyena's do); the S
and N of idle, walk and fly are the stills / Fly Toward / Fly Away above, and of attack, flinch and hurt the side frames as drawn
(S) and mirrored (N): an owl that swoops is seen side-on from any camera.
Size: Tiny. Each sheet is scaled by its own standing height so a Stand owl (the snowy sheet one's Perch, for its rows) is 20 px of body,
22 with the outline; the stills are drawn larger than the Stand frames and get their own scale, so they stand the same. Every
row of a sheet is at the sheet's one scale. The brown sheet one has no standing owl (its Perch has the branch), so its scale is set by
body parity with the same owl's sheet two: the radius of the largest circle in the silhouette (the wings aside) of its Harass
frames comes out the Hover frames' (the same rule run on the snowy lands within 2% of its Perch-set scale, so it is a fair one).
Known oddity: the brown Fly Toward has two wings-folded frames (1 and 4) and its Fly Away two (1 and 2), drawn as they are.
Flying frames HOVER: a row's lowest body pixel is put on AY - 12 (the engine draws the shadow at the foot, AY, so the owl floats
over it), all the row's frames cut from one common window so the drawn swoop and bob survive; standing frames sit on AY. Each frame
is placed on its body's middle (the median opaque column over the torso's rows of its biggest piece), so the wings swing about it.
Each row's frames are found by column gaps inside its band (the row labels, frame numbers, dashed rules and the title are outside
the bands), pieces under a size dropped (a speck), the ground keyed by the commonest colour; the cut's navy fringe is repainted
from inside the figure before the box-down.
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
pix = importlib.util.module_from_spec(spec); spec.loader.exec_module(pix)

SRC = os.path.join(ROOT, 'deep16', '_src')
FW, FH, AX, AY = 64, 64, 32, 58
HOVER = 12                                             # a flier's lowest pixel this far above the foot line
STAND = 20                                             # px of body from foot to the top of the ear tufts, before the outline (22 with it)
THR = 45                                               # the figure: colour distance from the ground
GLOW = 190                                             # a light-puff pixel this bright (mean of R, G, B) is full coverage


def load(name):
    a = np.asarray(Image.open(os.path.join(SRC, name)).convert('RGB')).astype(np.int32)
    q = a // 4
    vals, cnt = np.unique(q.reshape(-1, 3), axis=0, return_counts=True)
    top = vals[np.argmax(cnt)]
    bg = np.median(a[(q == top).all(-1)], axis=0)      # the ground: the commonest colour
    return a, bg


S1, BG_S1 = load('snowyowl_grok_1.jpg')
S2, BG_S2 = load('snowyowl_grok_2.jpg')
B1, BG_B1 = load('owl_grok_1.jpg')
B2, BG_B2 = load('owl_grok_2.jpg')

# the bands: key -> ((x0, y0, x1, y1), figures in the band, figures kept (the first), keep the little pieces (sparkles)).
# The rows sit right of the labels and between the dashed rules, the titles above and the frame numbers below.
BANDS_S1 = {'perch': ((118, 186, 1168, 286), 8, 8, False),
            'harass': ((118, 383, 1168, 480), 6, 6, False), 'flyby': ((118, 481, 1168, 562), 6, 6, False),
            'hurt': ((118, 566, 1168, 660), 6, 6, True), 'vanish': ((118, 664, 1168, 756), 6, 6, True)}
BANDS_S2 = {'front': ((140, 8, 290, 170), 1, 1, False), 'back': ((620, 8, 760, 170), 1, 1, False),
            'stand': ((118, 210, 1168, 326), 8, 5, False), 'hover': ((118, 356, 1168, 464), 8, 6, False),
            'toward': ((128, 500, 1168, 597), 6, 6, False), 'away': ((118, 630, 1168, 737), 6, 6, False)}
BANDS_B1 = {'harass': ((118, 394, 1168, 466), 6, 6, False), 'flyby': ((118, 490, 1168, 555), 6, 6, False),
            'hurt': ((118, 579, 1168, 653), 6, 6, True), 'vanish': ((118, 676, 1168, 753), 5, 5, True)}
BANDS_B2 = {'front': ((90, 5, 260, 182), 1, 1, False), 'back': ((630, 5, 790, 182), 1, 1, False),
            'stand': ((118, 216, 1168, 330), 7, 5, False), 'hover': ((118, 352, 1168, 470), 7, 4, False),
            'toward': ((128, 494, 1168, 595), 6, 6, False), 'away': ((118, 622, 1168, 738), 6, 6, False)}
# the vanish row's owl-less clouds of snow-light (frame indices)
PUFFS_S1 = {'vanish': (3, 4, 5)}
PUFFS_B1 = {'vanish': (1, 2, 3, 4)}


def column_runs(m, n, gap=3):
    """the n groups of occupied columns, left to right: runs separated by less than `gap` merge, then the smallest gaps merge until n remain."""
    occ = np.where(m.any(axis=0))[0]
    runs = [[occ[0], occ[0]]]
    for x in occ[1:]:
        if x - runs[-1][1] <= gap:
            runs[-1][1] = x
        else:
            runs.append([x, x])
    while len(runs) > n:
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        i = int(np.argmin(gaps))
        runs[i][1] = runs[i + 1][1]; del runs[i + 1]
    assert len(runs) == n, ('found %d figures, wanted %d' % (len(runs), n), runs)
    return runs


def frames_in(sheet, bg, key, bands, puffs={}):
    """the kept figures of a band, left to right: dicts of the cut (RGBA over the row's common window), its body's middle column, its
    body's bottom row (window coordinates), and the silhouette's area. The figures in `puffs` are the vanish row's owl-less clouds of
    snow-light: light over the ground, so their coverage is taken from the light itself (soft alpha) and their colour unmixed from the
    navy, and the box-down leaves a bright cloud rather than a dark halo."""
    (x0, y0, x1, y1), n, keep, specks = bands[key]
    c = sheet[y0:y1, x0:x1]
    m0 = np.abs(c - bg).sum(-1) > THR
    lab0, k0 = ndimage.label(m0, structure=np.ones((3, 3)))
    if k0:
        sz = ndimage.sum(m0, lab0, range(1, k0 + 1))
        m0 = np.isin(lab0, 1 + np.where(sz >= 8)[0])                 # jpeg noise
    runs = column_runs(m0, n)[:keep]
    figs = []
    for r0, r1 in runs:
        sub = np.zeros_like(m0); sub[:, r0:r1 + 1] = m0[:, r0:r1 + 1]
        closed = ndimage.binary_closing(np.pad(sub, 6), iterations=2)[6:-6, 6:-6]     # a gap a pixel or two wide is no gap
        lab, k = ndimage.label(closed)
        objs = ndimage.find_objects(lab)
        areas = [int((lab[sl] == i + 1).sum()) for i, sl in enumerate(objs)]
        big = int(np.argmax(areas)) + 1
        kept = [i + 1 for i, a in enumerate(areas) if a >= (12 if specks else 150) or i + 1 == big]
        mm = ndimage.binary_fill_holes(np.isin(lab, kept) & sub)
        body = ndimage.binary_fill_holes((lab == big) & sub)
        figs.append({'mm': mm, 'body': body})
    ys = [np.where(f['mm'].any(axis=1))[0] for f in figs]
    ty, by = min(v[0] for v in ys), max(v[-1] for v in ys) + 1        # the row's own window, top to bottom
    for j, f in enumerate(figs):
        mm, body = f['mm'], f['body']
        cols = np.where(mm.any(axis=0))[0]
        cx0, cx1 = cols[0], cols[-1] + 1
        rows = np.where(body.any(axis=1))[0]
        top, bot = rows[0], rows[-1]
        band = body[top + (bot - top) * 30 // 100: top + (bot - top) * 75 // 100 + 1]
        xs = np.where(band)[1]
        f['xref'] = float(np.median(xs)) - cx0 if len(xs) else (cx1 - cx0) / 2     # the body's middle column, from the cut's left
        f['bot'] = int(bot + 1 - ty)                                                  # the body's bottom edge, from the window's top
        f['area'] = int(body.sum())
        f['dt'] = float(ndimage.distance_transform_edt(body).max())                  # the thickest section's half-width: the body's size, wings aside
        f['h'] = int(bot + 1 - top)
        # the navy fringe: the figure's edge pixels (2 px in) take the colour of the nearest pixel inside
        inner = ndimage.binary_erosion(mm, iterations=2)
        col = c.astype(np.float64).copy()
        alpha = mm * 255.0
        if j in puffs.get(key, ()):
            lum = c.mean(-1); lbg = float(bg.mean())
            t = np.where(mm, np.clip((lum - lbg) / (GLOW - lbg), 0, 1), 0)
            col = np.clip(bg + (c - bg) / np.maximum(t, 0.15)[..., None], 0, 255)
            alpha = t * 255
        elif inner.any():
            dist, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
            edge = mm & ~inner & (dist <= 3)
            col[edge] = c[iy[edge], ix[edge]]
        win = (slice(ty, by), slice(cx0, cx1))
        f['img'] = Image.fromarray(np.dstack([col[win].astype(np.uint8), alpha[win].astype(np.uint8)]), 'RGBA')
        f['bodyimg'] = Image.fromarray(np.dstack([col[win].astype(np.uint8), (body[win] * 255).astype(np.uint8)]), 'RGBA')
        del f['mm'], f['body']
    return figs


def box(img, scale, alpha_cut, xref):
    """premultiplied box down at one scale, a 1-px margin for the outline, snapped to the palette; the middle column follows."""
    w, h = img.size
    nw, nh = max(1, round(w / scale)), max(1, round(h / scale))
    small = img.convert('RGBa').resize((nw, nh), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (nw + 2, nh + 2), (0, 0, 0, 0))
    pad.paste(small, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False, alpha_cut=alpha_cut), 1 + xref * nw / w


def fit(fig, scale, alpha_cut=0.5):
    a, xr = box(fig['img'], scale, alpha_cut, fig['xref'])
    b, _ = box(fig['bodyimg'], scale, alpha_cut, 0)
    rows = np.where(b[..., 3].any(axis=1))[0]
    return {'a': a, 'xr': xr, 'low': int(rows[-1]) if len(rows) else int(np.where(a[..., 3].any(axis=1))[0][-1])}


CLIPPED = []


def place(f, low, target, tag=''):
    """the cut onto the frame: its body's middle on AX, the row's lowest body row (`low`, in the cut's own coordinates) on `target`."""
    a = f['a']
    out = np.zeros((FH, FW, 4), dtype=np.uint8)
    ox, oy = int(round(AX - f['xr'])), target - low
    h, w = a.shape[:2]
    rr = np.where(a[..., 3].any(axis=1))[0]; cc = np.where(a[..., 3].any(axis=0))[0]
    if ox + cc[0] < 0 or ox + cc[-1] >= FW or oy + rr[0] < 0 or oy + rr[-1] >= FH:
        CLIPPED.append((tag, ox + cc[0], ox + cc[-1], oy + rr[0], oy + rr[-1]))
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(FH, oy + h), min(FW, ox + w)
    out[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return out


def row_frames(figs, scale, target, tag, alpha_cut=0.5):
    """a row's frames, fitted and placed: one lowest row for the row, so the drawn swoop and bob survive."""
    fs = [fit(f, scale, alpha_cut) for f in figs]
    low = max(f['low'] for f in fs)
    return [place(f, low, target, '%s%d' % (tag, i)) for i, f in enumerate(fs)]


def still(fig, scale, tag):
    f = fit(fig, scale)
    return place(f, f['low'], AY, tag)


def breathe(fr):
    """the chest rises a pixel (the feet stay put)."""
    o = fr.copy()
    rows = np.where(fr[..., 3].any(axis=1))[0]
    mid = rows[0] + (rows[-1] - rows[0]) * 6 // 10
    o[rows[0] - 1:mid] = fr[rows[0]:mid + 1]
    return o


def mirror(seq):
    """west of the drawn east: a flip, then a pixel back so the body stays on the anchor column."""
    return [np.roll(fr[:, ::-1], 1, axis=1).copy() for fr in seq]


def pingpong(seq, n):
    """a short wing-beat run out and back (1 2 3 4 3 2), cut or padded by the run to n frames."""
    out = seq + seq[-2:0:-1]
    assert len(out) == n, (len(out), n)
    return out


def facings(right, s=None, n=None):
    """the 8 facings S, SW, W, NW, N, NE, E, SE of one anim from its side frames (drawn facing right)."""
    left = mirror(right)
    return [s if s is not None else right, left, left, left, n if n is not None else left, right, right, right]


def build(tag, s1, s2, sheets, puffs1, bg1, bg2, scale1_of):
    rows1 = {k: frames_in(s1, bg1, k, sheets[0], puffs1) for k in sheets[0]}
    rows2 = {k: frames_in(s2, bg2, k, sheets[1]) for k in sheets[1]}
    sc2 = np.mean([f['h'] for f in rows2['stand']]) / STAND                     # sheet two: by its Stand owl
    sst2 = np.mean([rows2['front'][0]['h'], rows2['back'][0]['h']]) / STAND       # the stills are drawn larger: their own scale, the same height
    par = body_parity(rows1, rows2, sc2)
    sc1 = scale1_of(rows1, rows2, par)
    print('  %s: sheet one scale %.3f (by body parity with its Hover it would be %.3f), sheet two scale %.3f (Stand %.1f px of source), stills %.3f' % (
        tag, sc1, par, sc2, sc2 * STAND, sst2))
    hov = AY - HOVER
    R1 = lambda k, cut=0.5: row_frames(rows1[k], sc1, hov, tag + '1-' + k, cut)
    R2 = lambda k, tgt=hov: row_frames(rows2[k], sc2, tgt, tag + '2-' + k)
    stand, hover, toward, away = R2('stand', AY), R2('hover'), R2('toward'), R2('away')
    fS, fN = still(rows2['front'][0], sst2, tag + '-front'), still(rows2['back'][0], sst2, tag + '-back')
    if len(hover) < len(toward):
        hover = pingpong(hover, len(toward))
    flyby = R1('flyby')
    frames = {
        'idle': facings(stand, [fS] * 3 + [breathe(fS)] * 2, [fN] * 3 + [breathe(fN)] * 2),
        'walk': facings(hover, toward, away),
        'attack': facings(R1('harass')),
        'fly': facings(flyby, toward, away),
        'flinch': facings(R1('hurt', 0.3)),
        'hurt': facings(R1('vanish', 0.3)),
    }
    # how big each is, in px of silhouette, for the eye to check against the preview
    fin = lambda rs: int(np.mean([(fr[..., 3] > 0).sum() for fr in rs]))
    print('  %s: silhouette px  stand %d  hover %d  toward %d  away %d  | harass %d  flyby %d' % (
        tag, fin(stand), fin(hover), fin(toward), fin(away), fin(frames['attack'][6]), fin(flyby)))
    return frames, rows1, rows2


def body_parity(rows1, rows2, sc2):
    """the sheet-one scale at which the body (the radius of the largest circle in the silhouette, the wings aside) of the Harass
    frames comes out the size of the Hover frames' at sheet two's scale."""
    return sc2 * np.mean([g['dt'] for g in rows1['harass']]) / np.mean([g['dt'] for g in rows2['hover']])


def snowy_scale1(rows1, rows2, par):
    """the snowy's sheet one by its Perch, which stands 20 px like sheet two's Stand (body parity lands within 2% of it)."""
    return np.mean([f['h'] for f in rows1['perch']]) / STAND


def brown_scale1(rows1, rows2, par):
    """the brown's sheet one has no standing owl (its Perch has the branch): by body parity with its Hover instead."""
    return par


FPS_OWL = {'snowyowl_p2': {'idle': 6, 'walk': 10, 'attack': 12, 'fly': 10, 'flinch': 12, 'hurt': 8},
           'owl_p2': {'idle': 6, 'walk': 10, 'attack': 12, 'fly': 10, 'flinch': 12, 'hurt': 8}}


def write(name, frames):
    pix.write_sheet(name, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    meta_p = os.path.join(ROOT, 'deep16', 'art', name + '.json')
    meta = json.load(open(meta_p))
    for k, v in FPS_OWL[name].items():
        meta['anims'][k]['fps'] = v
    meta['source'] = 'generated by Griz (2026-09-29, two sheets), cut and snapped by tools/owl-sheet.py'
    json.dump(meta, open(meta_p, 'w'), indent=1)


def preview(sheets):
    """each owl, every anim: the frames for facings S, E and N side by side, 3x, on a mid-grey ground; the foot line in red under
    the anchor row, the hover line (AY - 12) in blue."""
    from PIL import ImageDraw
    allf = [fr for fs in sheets.values() for a in fs.values() for f in (0, 6, 4) for fr in a[f]]
    cols = np.where(np.any([fr[..., 3].any(axis=0) for fr in allf], axis=0))[0]
    rws = np.where(np.any([fr[..., 3].any(axis=1) for fr in allf], axis=0))[0]
    cx0, cx1 = max(0, cols[0] - 2), min(FW, cols[-1] + 3)
    cy0, cy1 = max(0, rws[0] - 2), min(FH, AY + 4)
    cw, ch = cx1 - cx0, cy1 - cy0
    print('  preview window x %d-%d y %d-%d (content spans x %d-%d, y %d-%d)' % (cx0, cx1, cy0, cy1, cols[0], cols[-1], rws[0], rws[-1]))
    S, GAP, LAB = 3, 8, 74
    nmax = max(len(a[0]) for fs in sheets.values() for a in fs.values())
    nrows = sum(len(fs) for fs in sheets.values())
    W = LAB + 3 * nmax * cw * S + 2 * GAP * S + 2 * GAP
    H = nrows * (ch * S + GAP) + GAP
    img = np.zeros((H, W, 3), dtype=np.uint8); img[:] = (112, 112, 112)
    r = 0
    labels = []
    for owl, fs in sheets.items():
        for anim, a in fs.items():
            x = LAB
            y = GAP + r * (ch * S + GAP)
            labels.append((4, y + 4, '%s %s' % (owl.split('_')[0], anim)))
            for f in (0, 6, 4):
                for i, fr in enumerate(a[f]):
                    cell = fr[cy0:cy1, cx0:cx1]
                    big = np.repeat(np.repeat(cell, S, 0), S, 1)
                    xx = x + i * cw * S
                    sub = img[y:y + ch * S, xx:xx + cw * S]
                    al = big[..., 3:4] > 0
                    sub[:] = np.where(al, big[..., :3], sub)
                    img[y, xx:xx + cw * S] = (90, 90, 90)                                             # a cell's top edge
                    fy = y + (AY - cy0 + 1) * S
                    img[fy:fy + 2, xx:xx + cw * S] = (220, 60, 60)                                    # the foot line, under the anchor row
                    hy = y + (AY - HOVER - cy0 + 1) * S
                    img[hy:hy + 2, xx:xx + cw * S:3] = (90, 140, 255)                                 # the hover line, dotted
                    img[y:y + ch * S, xx] = (100, 100, 100)                                           # a cell's left edge
                x += nmax * cw * S + GAP * S
            r += 1
    im = Image.fromarray(img, 'RGB')
    d = ImageDraw.Draw(im)
    for lx, ly, t in labels:
        d.text((lx, ly), t, fill=(255, 255, 255))
    out = os.path.join(ROOT, 'dev', 'shots', 'owl-cuts.png')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    print('  wrote', out, im.size[0], 'x', im.size[1])


if __name__ == '__main__':
    snowy, _, _ = build('snowyowl', S1, S2, (BANDS_S1, BANDS_S2), PUFFS_S1, BG_S1, BG_S2, snowy_scale1)
    brown, _, _ = build('owl', B1, B2, (BANDS_B1, BANDS_B2), PUFFS_B1, BG_B1, BG_B2, brown_scale1)
    for t in CLIPPED:
        print('  CLIPPED', t)
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        preview({'snowyowl_p2': snowy, 'owl_p2': brown})
    else:
        write('snowyowl_p2', snowy)
        write('owl_p2', brown)

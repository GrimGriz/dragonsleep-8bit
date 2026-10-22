"""Slice Grok's two Keeper sheets (grok-sheet-1/2.webp) into frames and pack keeper_p2.
Run from this folder: python slice.py   (needs pillow, numpy, scipy)
Frames land in frames/, the packed sheet in ../../art/keeper_p2.png, a contact sheet in contact.png.
Boxes are bands read off the pictures; the cut inside a band is by brightness (the sheets have no alpha).
Since 10-22 the art desk's ART-33 (art33 below) draws the rows the fight plays from SE, NE, S and N: E and W stay the Grok side view.
Run it from the main checkout or a worktree of it: the ART-33 pages are read from the main checkout's deep16/_src/keeper/ART-33/."""
from PIL import Image
import numpy as np, json, os
from scipy import ndimage as ndi

# band = (y0, y1, x0, x1) per sheet per anim; the 4 turnaround figures sit in the header band
BANDS = {
 3: {'turn': (60, 355, 360, 1168), 'swirl': (380, 548, 180, 1168), 'wall': (555, 740, 180, 1168)},
 1: {'turn': (10, 222, 340, 1020), 'idle': (243, 368, 280, 1100), 'wall': (392, 498, 280, 1150),
     'dive': (528, 620, 270, 1150), 'wave': (648, 742, 270, 1160)},
 2: {'turn': (50, 240, 540, 1100), 'idle': (238, 360, 270, 820), 'wall': (372, 500, 270, 1060),
     'dive': (510, 612, 250, 1150), 'wave': (625, 750, 250, 1130)},
}
THR_LO, THR_HI = 38, 75
CUTS = {(1, 'wave'): [545]}   # frames that touch on the sheet: cut the columns here before labelling     # luminance ramp: below = background, above = solid

def alpha_of(a):
    lum = a.sum(2) / 3.0
    return np.clip((lum - THR_LO) / (THR_HI - THR_LO), 0, 1)

def cut(n):
    src = Image.open(f'grok-sheet-{n}.webp').convert('RGB')
    a = np.array(src)
    al = alpha_of(a.astype(float))
    res = {}
    for name, (y0, y1, x0, x1) in BANDS[n].items():
        band = al[y0:y1, x0:x1] > 0.5
        for cx in CUTS.get((n, name), []):
            band[:, max(cx - x0 - 1, 0):cx - x0 + 2] = False
        lab, k = ndi.label(ndi.binary_dilation(band, iterations=3))
        core = np.zeros_like(lab)
        keep = []
        for i, s in enumerate(ndi.find_objects(lab)):
            area = (band[s] & (lab[s] == i + 1)).sum()
            if area > 600 and s[0].stop - s[0].start > 40:
                keep.append(i + 1)
        # nearest-core assignment keeps bubbles/splash with their frame and drops the number captions below
        for j, i in enumerate(keep): core[lab == i] = j + 1
        dist, (iy, ix) = ndi.distance_transform_edt(core == 0, return_indices=True)
        near = core[iy, ix]
        frames = []
        for j in range(1, len(keep) + 1):
            ys, xs = np.where(core == j)
            top, bot = ys.min(), ys.max()
            yy = np.arange(band.shape[0])[:, None]
            reg = (near == j) & (dist <= 10) & (yy >= top - 4) & (yy <= bot + 3) & (al[y0:y1, x0:x1] > 0.05)
            cols = np.where(reg.any(0))[0]; rows = np.where(reg.any(1))[0]
            c0, c1, r0, r1 = cols.min(), cols.max() + 1, rows.min(), rows.max() + 1
            rgba = np.dstack([a[y0:y1, x0:x1], (al[y0:y1, x0:x1] * 255 * reg).astype(np.uint8)])[r0:r1, c0:c1]
            frames.append((c0 + x0, Image.fromarray(rgba, 'RGBA')))
        frames.sort(key=lambda t: t[0])
        res[name] = [f for _, f in frames]
    return res

# ---- ART-33 (10-22, the monster cutter seat's fourth run, on Griz's "close the desk but have the cutter run us out of usage for the week. See y'all
# tueday"): the art desk's facings package for the rows the fight plays -- HEAD 1 SE and HEAD 2 NE (Idle 2, Ice Wall Raise 6, Dive Attack 7 on page 1;
# Wave Cast 6, Hurt 2, Die 2 on page 2), HEAD 3 S and HEAD 5 N the same less the Idle. Sorted out of Fresh into deep16/_src/keeper/ART-33/ by
# _src/art-desk/sort-delivery.py (not in git: a worktree reads the main checkout's). Onto the rows K.POSE plays (js/keeper.js): stand <- Idle (SE and
# NE: S's, E's, W's and N's are the third sheet's stills as before), a_wall <- Ice Wall Raise, slam_b3a <- Dive Attack, b_wave <- Wave Cast, hurt_b
# <- Hurt, die_b <- Die; SW and NW the mirrors of SE and NE; E and W, and the rows no pose plays, as before. Cut by tools/artdesk.py (the row names
# and the numbers boxed by hand off the pages; a droplet goes with the nearest number); drawn this sheet's way, not palette-snapped (the Grok sheets'
# soft edge: premultiplied Lanczos). Each row's scale meets the E row it plays beside -- its standing frame (Idle 1, Ice 1, Dive 7, Wave 1) as tall
# as E's, Hurt and Die at their page's Wave scale; each page toned to E's by hue, saturation and value (page 1 by Ice 1 against a_wall 1, page 2 by Wave 1
# against b_wave 1). Placed as the page drew them: the row's first frame's body on the anchor, the rest by their numbers, each foot on the row's ground.
def R(*rows):
    return [(r, b, s, n) for r, b, s, n, _ in rows], {r: xs for r, _, _, _, xs in rows}

SPEC33 = {
  'H1P1': (dict(file='ART-33_HEAD-1_PAGE-1.png', W=1774, text=[(15, 110, 185, 155), (15, 430, 286, 485), (15, 638, 262, 676)]),
           R(('idle', (0, 0, 1774, 305), (278, 305), 2, [371, 624]), ('wall', (0, 306, 1774, 604), (578, 604), 6, [371, 603, 846, 1087, 1341, 1610]),
             ('dive', (0, 605, 1774, 861), (835, 861), 7, [138, 384, 690, 981, 1232, 1464, 1667]))),
  'H1P2': (dict(file='ART-33_HEAD-1_PAGE-2.png', W=1774, text=[(15, 135, 200, 215), (15, 425, 150, 500), (15, 685, 140, 762)]),
           R(('wave', (0, 0, 1774, 330), (299, 330), 6, [281, 519, 767, 1033, 1326, 1621]), ('hurt', (0, 331, 1774, 613), (583, 613), 2, [340, 674]),
             ('die', (0, 614, 1774, 871), (838, 871), 2, [326, 684]))),
  # (H2P1: Ice 6's tips reach up past the idle's numbers, to 298 -- the idle band leaves the page's right to the wall row, which starts higher there)
  'H2P1': (dict(file='ART-33_HEAD-2_PAGE-1.png', W=1774, text=[(15, 115, 185, 152), (15, 432, 288, 470), (15, 636, 265, 674)],
                away={'idle': [(1000, 0, 1774, 308)], 'wall': [(0, 285, 1000, 308)]}),
           R(('idle', (0, 0, 1774, 307), (279, 307), 2, [362, 613]), ('wall', (0, 285, 1774, 607), (578, 607), 6, [372, 601, 841, 1084, 1342, 1612]),
             ('dive', (0, 608, 1774, 867), (840, 867), 7, [142, 385, 690, 978, 1227, 1454, 1662]))),
  'H2P2': (dict(file='ART-33_HEAD-2_PAGE-2.png', W=1774, text=[(15, 150, 250, 186), (15, 435, 175, 472), (15, 693, 160, 728)]),
           R(('wave', (0, 0, 1774, 329), (303, 329), 6, [359, 592, 833, 1073, 1323, 1624]), ('hurt', (0, 330, 1774, 614), (585, 614), 2, [360, 641]),
             ('die', (0, 615, 1774, 856), (827, 856), 2, [359, 641]))),
  'H3P1': (dict(file='ART-33_HEAD-3_PAGE-1.png', W=2048, text=[(15, 185, 318, 222), (15, 445, 288, 482)]),          # (the wall's strip takes the dashed line under it)
           R(('wall', (0, 0, 2048, 431), (381, 431), 6, [423, 676, 952, 1223, 1527, 1837]), ('dive', (0, 432, 2048, 733), (705, 733), 7, [209, 520, 810, 1112, 1391, 1653, 1898]))),
  'H3P2': (dict(file='ART-33_HEAD-3_PAGE-2.png', W=1983, text=[(15, 98, 272, 133), (15, 360, 240, 396), (15, 580, 240, 618)]),          # (the wave's and the hurt's strips take the dashed lines)
           R(('wave', (0, 0, 1983, 345), (306, 345), 6, [409, 684, 968, 1250, 1529, 1814]), ('hurt', (0, 346, 1983, 572), (534, 572), 2, [832, 1167]),
             ('die', (0, 573, 1983, 792), (758, 792), 2, [806, 1171]))),
  'H5P1': (dict(file='ART-33_HEAD-5_PAGE-1.png', W=2056, text=[(15, 200, 285, 285), (15, 555, 250, 635)]),
           R(('wall', (0, 0, 2056, 401), (371, 401), 6, [402, 675, 947, 1222, 1522, 1843]), ('dive', (0, 402, 2056, 743), (714, 743), 7, [363, 581, 828, 1118, 1403, 1669, 1911]))),
  'H5P2': (dict(file='ART-33_HEAD-5_PAGE-2.png', W=2055, text=[(15, 155, 215, 195), (15, 395, 125, 438), (15, 602, 105, 642)]),
           R(('wave', (0, 0, 2055, 307), (279, 307), 6, [363, 655, 942, 1252, 1564, 1860]), ('hurt', (0, 308, 2055, 533), (505, 533), 2, [474, 856]),
             ('die', (0, 534, 2055, 745), (715, 745), 2, [449, 858]))),
}
PAGES33 = {L: dict(p, rows=rows, xs=xs) for L, (p, (rows, xs)) in SPEC33.items()}
FIX33 = {'H1P1': {'dive': [((540, 660, 625, 790), '2')]},       # (Dive 2's fingertips and the drops off its reach, loose between it and Dive 3's wave: Dive 2's)
         'H2P2': {'wave': [((1380, 40, 1530, 180), '5')]}}       # (the tip of Wave 5's spray, a few px nearer Wave 6's hair: Wave 5's)
VIEWS33 = {'SE': ('H1P1', 'H1P2'), 'NE': ('H2P1', 'H2P2'), 'S': ('H3P1', 'H3P2'), 'N': ('H5P1', 'H5P2')}
ROWS33 = {'stand': 'idle', 'a_wall': 'wall', 'slam_b3a': 'dive', 'b_wave': 'wave', 'hurt_b': 'hurt', 'die_b': 'die'}
FACE33 = {7: 'SE', 1: 'SE', 5: 'NE', 3: 'NE', 0: 'S', 4: 'N'}     # engine facing (S SW W NW N NE E SE) -> the view drawn (SW and NW mirrored)
STAND33 = {'idle': 0, 'wall': 0, 'dive': 6, 'wave': 0}            # a row's standing frame, met against the same frame of E's row


def _arr(im):
    return np.asarray(im.convert('RGBA'))

def tall33(a):
    ys = np.where((a[..., 3] >= 128).any(axis=1))[0]
    return int(ys[-1] - ys[0] + 1)

def fit33(im, k):
    """the page frame at 1/k, premultiplied (the cut's navy under its clear pixels must not fringe it), Lanczos as this sheet's stills"""
    a = _arr(im).astype(np.float32)
    size = (max(1, round(im.width / k)), max(1, round(im.height / k)))
    al = a[..., 3] / 255.0
    rs = lambda ch: np.asarray(Image.fromarray(ch.astype(np.float32), 'F').resize(size, Image.LANCZOS))
    A = np.clip(rs(a[..., 3]), 0, 255)
    rgb = np.dstack([rs(a[..., c] * al) for c in range(3)]) / np.maximum(A[..., None] / 255.0, 1e-3)
    out = np.dstack([np.clip(rgb, 0, 255), np.where(A < 8, 0, A)]).astype(np.uint8)
    out[out[..., 3] == 0, :3] = 0
    return out

def hsv33(a):
    return np.asarray(Image.fromarray(np.ascontiguousarray(a[..., :3])).convert('HSV')).astype(float)

def mean33(a):
    """(hue, saturation, value), alpha-weighted, the hue a circular mean on PIL's 0-255"""
    w = a[..., 3].astype(float) / 255.0; h = hsv33(a); t = h[..., 0] * 2 * np.pi / 256
    hue = np.arctan2((np.sin(t) * w).sum(), (np.cos(t) * w).sum()) * 256 / (2 * np.pi) % 256
    return np.array([hue, (h[..., 1] * w).sum() / max(w.sum(), 1e-6), (h[..., 2] * w).sum() / max(w.sum(), 1e-6)])

def toned33(im, f):
    """f = (hue shift, saturation x, value x): by hue, saturation and value, not per channel (per channel turned the page's white highlights pink)"""
    a = _arr(im); h = hsv33(a)
    h[..., 0] = (h[..., 0] + f[0]) % 256; h[..., 1] = np.clip(h[..., 1] * f[1], 0, 255); h[..., 2] = np.clip(h[..., 2] * f[2], 0, 255)
    rgb = np.asarray(Image.fromarray(h.astype(np.uint8), 'HSV').convert('RGB'))
    return Image.fromarray(np.dstack([rgb, a[..., 3]]), 'RGBA')

def core33(a):
    """x of the body's thick middle (the torso; the arms, the droplets and the splash are thin)"""
    d = ndi.distance_transform_edt(a[..., 3] >= 128)
    return float(np.where(d >= 0.7 * d.max())[1].mean())


def art33(eref, CW, CH, FEET):
    """eref: {page row: the E row's frame its scale and tone are met against (the sheet's own, before packing)} -> {sheet row: {view: [CW x CH
    RGBA arrays]}}"""
    import importlib.util
    root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
    sp = importlib.util.spec_from_file_location('artdesk', os.path.join(root, 'tools', 'artdesk.py'))
    AD = importlib.util.module_from_spec(sp); sp.loader.exec_module(AD)
    cuts = AD.cut(root, 'keeper', 'ART-33', PAGES33, fix=FIX33)
    def k_for(im, target):
        lo, hi = 1.0, 30.0
        for _ in range(28):
            k = (lo + hi) / 2
            lo, hi = (k, hi) if tall33(fit33(im, k)) > target else (lo, k)
        return (lo + hi) / 2
    AX, AY = CW // 2, CH - FEET
    out, lost, log = {}, [], []
    for v, ls in VIEWS33.items():
        for L in ls:
            c = cuts[L]
            K = {r: k_for(c[r][STAND33[r]][0], tall33(_arr(eref[r]))) for r in c if r in STAND33}
            for r in c:
                K.setdefault(r, K.get('wave'))
            tr = 'wall' if 'wall' in c else 'wave'                     # the page's tone, by its first row the E sheet has a standing frame for
            f = np.array([0.0, 1.0, 1.0])
            for _ in range(3):
                want, got = mean33(_arr(eref[tr])), mean33(fit33(toned33(c[tr][0][0], f), K[tr]))
                f = np.array([f[0] + ((want[0] - got[0] + 128) % 256 - 128), f[1] * want[1] / max(got[1], 1), f[2] * want[2] / max(got[2], 1)])
            log.append('%s K %s, tone %s' % (L, ' '.join('%s %.2f' % (r, K[r]) for r in c), ' '.join('%.2f' % x for x in f)))
            for r, frs in c.items():
                fits = [fit33(toned33(im, f), K[r]) for im, _, _ in frs]
                floor = max(b[3] for _, b, _ in frs)
                tx, rx0 = core33(fits[0]), (frs[0][1][0] - frs[0][2]) / K[r]
                row = []
                for a, (_, box, x) in zip(fits, frs):
                    ox = int(round(AX - tx + (box[0] - x) / K[r] - rx0))
                    al = np.where(a[..., 3].any(axis=1))[0]
                    oy = AY - int(round((floor - box[3]) / K[r])) - int(al[-1])
                    cell = np.zeros((CH, CW, 4), np.uint8)
                    h, w = a.shape[:2]
                    y0, x0, y1, x1 = max(0, oy), max(0, ox), min(CH, oy + h), min(CW, ox + w)
                    cell[y0:y1, x0:x1] = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
                    if (cell[..., 3] >= 128).sum() < (a[..., 3] >= 128).sum():
                        lost.append('%s %s %d (%d x %d at %d,%d)' % (L, r, len(row) + 1, w, h, ox, oy))
                    row.append(cell)
                sheet_row = [s for s, pr in ROWS33.items() if pr == r][0]
                out.setdefault(sheet_row, {})[v] = row
    print('  ART-33: ' + '; '.join(log))
    if lost:
        raise SystemExit('ART-33 cut off at the cell edge (%d x %d, anchor %d,%d): %s' % (CW, CH, AX, AY, '; '.join(lost)))
    return out


if __name__ == '__main__':
    import glob
    os.makedirs('frames', exist_ok=True)
    allf = {n: cut(n) for n in (1, 2, 3)}
    for n in (1, 2, 3):
        for nm, fr in allf[n].items():
            for c, im in enumerate(fr): im.save(f'frames/{"abc"[n-1]}_{nm}_{c+1}.png')
    # ---- keeper_p2: the sheet the engine reads (js/sprites.js: rows are anim x facing, 8 facings S SW W NW N NE E SE, the columns the frames).
    # Grok drew one side view (facing right), so the east-ish facings (S, NE, E, SE) are as drawn and the west-ish (SW, W, NW, N) mirrored.
    CW, CH, FEET = 200, 124, 4                    # (200 wide since 10-22, ART-33: the SE Wave 5's reach and Die 2's spray; 168 before, every frame centred)
    src = {f'{"ab"[n-1]}_{nm}': allf[n][nm] for n in (1, 2) for nm in ('idle', 'wall', 'dive', 'wave')}
    # composed rows: the Slam's dive from both sheets (a = the first sheet's, b = the second's), and the sinking
    rows = dict(src)
    rows['slam_ab'] = src['a_dive'][:3] + src['b_dive'][2:7]     # launch from the first sheet's dive, smash and return from the second's (Griz: neither is canon)
    rows['slam_ba'] = src['b_dive'][:2] + src['a_dive'][2:7]     # the other way about
    rows['slam_b3a'] = src['b_dive'][:2] + [src['a_dive'][2]] + src['b_dive'][3:7]   # the second sheet's dive with the first sheet's frame 3 (the arcing wave) for its third (Griz 10-03; the default)
    rows['hurt_b'] = src['b_dive'][:2]                           # a crouch from the hit
    rows['die_b'] = src['b_dive'][2:4]                           # it sinks: the splash, the burst, the pool closing over
    # the standing idle (Griz 10-03: "return to the standing idle"): sheet 3's four standing poses, scaled to the other rows' height, one per facing
    # (S front, E/SE the right-facing profile, W/SW the left-facing, N/NW/NE the back), two frames a pixel apart so it breathes
    def scaled(im, h=116):
        k = h / im.height; return im.resize((max(1, round(im.width * k)), h), Image.LANCZOS)
    P3 = [scaled(im) for im in allf[3]['turn']]       # as drawn: front, right-facing profile, left-facing profile, back (the sheet's own labels are shuffled)
    STAND = {0: 0, 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1}   # engine facing (S SW W NW N NE E SE) -> pose
    rows['stand'] = None
    A33 = art33({'idle': P3[STAND[6]], 'wall': src['a_wall'][0], 'dive': rows['slam_b3a'][6], 'wave': src['b_wave'][0]}, CW, CH, FEET)
    def paste33(nm, f, c, y0):                 # an ART-33 cell, SW and NW flipped about the anchor (x -> CW - x, the anchor where it was)
        a = A33[nm][FACE33[f]][c]
        if f in (1, 3):
            m = np.zeros_like(a); m[:, 1:] = a[:, ::-1][:, :-1]; a = m
        sheet.alpha_composite(Image.fromarray(a, 'RGBA'), (c * CW, y0 + f * CH))
    order = ['a_idle', 'a_wall', 'a_dive', 'a_wave', 'b_idle', 'b_wall', 'b_dive', 'b_wave', 'slam_ab', 'slam_ba', 'slam_b3a', 'hurt_b', 'die_b', 'stand']
    FACES = [False, True, True, True, True, False, False, False]   # mirrored? S SW W NW N NE E SE
    sheet = Image.new('RGBA', (CW * 8, CH * 8 * len(order)), (0, 0, 0, 0))
    meta = {}
    for r, nm in enumerate(order):
        y0 = r * CH * 8
        if nm == 'stand':
            meta[nm] = {'y': y0, 'frames': 2}
            for f in range(8):
                for c in range(2):
                    if FACE33.get(f) in A33['stand']:
                        paste33(nm, f, c, y0); continue
                    im = P3[STAND[f]]; w, h = im.size
                    sheet.paste(im, (c * CW + (CW - w) // 2, y0 + f * CH + CH - FEET - h - c), im)
            continue
        fr = rows[nm]; meta[nm] = {'y': y0, 'frames': len(fr)}
        for f, mir in enumerate(FACES):
            for c, im in enumerate(fr):
                if FACE33.get(f) in A33.get(nm, {}):
                    paste33(nm, f, c, y0); continue
                w, h = im.size
                if mir: im = im.transpose(Image.FLIP_LEFT_RIGHT)
                sheet.paste(im, (c * CW + (CW - w) // 2, y0 + f * CH + CH - FEET - h), im)
    sheet.save('../../art/keeper_p2.png')
    base = {'fw': CW, 'fh': CH, 'ax': CW // 2, 'ay': CH - FEET}
    an = {k: dict(base, y=v['y'], frames=v['frames'], fps=6 if k.endswith('idle') else 10) for k, v in meta.items()}
    def alias(name, row, fps=None): an[name] = dict(an[row], **({'fps': fps} if fps else {}))
    # the engine's own anim names, pointing at a row: D16.keeper.pose() re-points them from D16.keeper.CFG (js/keeper.js) -- these are the defaults
    alias('idle', 'stand', 3); alias('walk', 'stand', 3); alias('attack', 'slam_b3a'); alias('wave', 'b_wave'); alias('wall', 'a_wall')
    alias('hurt', 'hurt_b', 8); alias('die', 'die_b', 6); alias('cast', 'b_wave')
    json.dump({'image': 'art/keeper_p2.png', 'fw': CW, 'fh': CH, 'ax': base['ax'], 'ay': base['ay'], 'top': 118, 'anims': an}, open('../../art/keeper_p2.json', 'w'), indent=1)
    json.dump(meta, open('keeper_p2.meta.json', 'w'), indent=1)
    # ---- keeper_p3: what is drawn about the Keeper, not as it: the water swirl a held hero sits in, the ice-wall form (frames 1-3 the Keeper turning to ice, 4-6 the solid wall)
    C3W, C3H = 176, 184
    p3 = {'swirl': allf[3]['swirl'], 'wallform': allf[3]['wall'], 'wallsolid': allf[3]['wall'][3:], 'wallrise': allf[3]['wall'][:3]}
    sh3 = Image.new('RGBA', (C3W * 6, C3H * len(p3)), (0, 0, 0, 0)); an3 = {}
    for r, (nm, fr) in enumerate(p3.items()):
        for c, im in enumerate(fr):
            w, h = im.size; sh3.paste(im, (c * C3W + (C3W - w) // 2, r * C3H + C3H - 4 - h), im)
        an3[nm] = {'y': r * C3H, 'fw': C3W, 'fh': C3H, 'ax': C3W // 2, 'ay': C3H - 4, 'frames': len(fr), 'fps': 8}
    sh3.save('../../art/keeper_p3.png')
    json.dump({'image': 'art/keeper_p3.png', 'fw': C3W, 'fh': C3H, 'ax': C3W // 2, 'ay': C3H - 4, 'top': 168, 'anims': an3}, open('../../art/keeper_p3.json', 'w'), indent=1)
    cs = Image.new('RGBA', (CW * 8, CH * len(order)), (24, 30, 48, 255))   # the contact sheet: the facing S row of each anim
    for r, nm in enumerate(order): cs.alpha_composite(sheet.crop((0, meta[nm]['y'], CW * 8, meta[nm]['y'] + CH)), (0, r * CH))
    cs.convert('RGB').save('contact.png')
    print(json.dumps(meta))

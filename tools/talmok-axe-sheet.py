"""DEEP16 pipeline 2 (generated art): Talmok's GREATAXE -- four rows added to his fight sheet talmok_p2, and talmokroad_p2, the road's Talmok on them.

    python tools/talmok-axe-sheet.py          (adds the rows to deep16/art/talmok_p2.png/.json and writes deep16/art/talmokroad_p2.json)
    python tools/talmok-axe-sheet.py check    (also dev/visions/talmok/axe-<row>.png, every facing at 2x)
    (tools/talmok-sheet.py runs this at its end, so a rebuild of talmok_p2 keeps the axe rows)

Asked in art-wanted section 84 (11-19, the Blender seat for the lanes desk, on Griz's "note I think we have text that says talmok fights with an axe on
the road not his fists", then "confirm we need the attack, then have a blender seat do a human great-axe overhand chop attack row ..."); cut 11-19 by
the cutter seat (cutter-talmok-1119) on the lanes desk's relay of his "Talmok is in Fresh for the held cutter". The art desk's
ART-WANTED-84-TALMOK-GREATAXE, sorted out of Fresh to deep16/_src/talmok/2026-11-19-ART-WANTED-84-GREATAXE/ (the zip beside it): HEAD 1 S, 2 SE, 3 E,
4 the rear NE, 5 N; PAGE 1 Greataxe 6 (the chop on frame 4), 2 Axe Idle 4, 3 Axe Walk 8 (two bands of four), 4 Axe Flinch 4 -- one flat-navy page a
view and an action under selected/.

The cut keeps the art desk's own registration (its FRAME-MAP.json): each frame its source rectangle, boxed down by its page's `preview_scale` (the desk
brought every page to the Blender guide's 56-px stand, the axe raised above it), and placed as the desk placed it in its 96 x 96 preview cell -- the
anchor its (48, 90): the feet on one line, the x where the desk put it (so the heel moves and the head rises and falls through the swing as drawn).
Snapped and outlined as talmok_p2 is (tools/talmok-sheet.py: the 64, red, fire and violet left out); SW W NW the mirrors of SE E NE (RULED 10-14).

THE TWO SHEETS. The rows are added to talmok_p2 by the ask's names -- greataxe (release 3, the blow on frame 4), axeidle, axewalk, axeflinch -- where a
sheet with S.HELD's greataxe rows would find them (js/sprites.js; not wired: no S.HELD line for the greataxe yet). The road's Talmok is a foe with no
weapon in his hand (data/foes.js talmokroad, its attack `greataxe`) and the Pocket DM's named Talmok a class build whose look is a sheet (js/classes.js
NPC.NAMED talmok): neither reaches S.HELD. So talmokroad_p2 is the same image read another way -- its idle, walk and flinch the axe rows, its attack and
greataxe the chop, its hurt, sit and prone his own -- and the road wears it. The pit keeps talmok_p2 as it was: bare hands, the Pit Fists.
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
VS = _load('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
ART = os.path.join(ROOT, 'deep16', 'art')
NAME, ROAD = 'talmok_p2', 'talmokroad_p2'
SRC = os.path.join(pix.SRC, 'talmok', '2026-11-19-ART-WANTED-84-GREATAXE', 'ART-WANTED-84-TALMOK-GREATAXE')
AVOID = ['red', 'fire', 'violet']                   # (as talmok_p2: tools/talmok-sheet.py AVOID)
FACE = {'S': 0, 'SE': 7, 'E': 6, 'NE': 5, 'N': 4}   # (the sheet's facings: S SW W NW N NE E SE)
MIRROR = {1: 7, 2: 6, 3: 5}                         # SW, W, NW: SE, E, NE mirrored
ROWS = [('greataxe', 10), ('axeidle', 4), ('axewalk', 10), ('axeflinch', 12)]   # (each row's fps; the fists' 12 for the chop slowed to 10: a heavier blow)
RELEASE = {'greataxe': 3}                           # (frame 4, the chop: the blow lands -- the art desk's `release: 3`)


def frames():
    """{(row, facing): [(rgba 1x, anchor x, foot y)]} -- every drawn frame boxed down, snapped, outlined, on the desk's registration"""
    fm = json.load(open(os.path.join(SRC, 'FRAME-MAP.json'), encoding='utf-8'))
    ax0, ay0 = fm['preview_anchor_xy']
    out, pages = {}, {}
    for pg in fm['pages']:
        row, f, k = pg['row'], FACE[pg['facing']], pg['preview_scale']
        nums = [q['frame'] for q in pg['frames']]
        assert nums == list(range(1, len(nums) + 1)) and len(nums) == fm['rows'][row], (pg['source'], nums)   # (every number once, none skipped)
        if pg['source'] not in pages:
            pages[pg['source']] = np.asarray(Image.open(os.path.join(SRC, pg['source'])).convert('RGB')).astype(np.float32)
        a = pages[pg['source']]
        cells = []
        for q in pg['frames']:
            x, y, w, h = q['source_rect_xywh']
            P = 6
            win = a[max(0, y - P):y + h + P, max(0, x - P):x + w + P]
            m = VS.figure(win)
            ys, xs = np.where(m); sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
            o = VS.to1x(win[sl], m[sl], k, AVOID)                         # (1 px of outline round it)
            al = o[..., 3] > 0; yy = np.where(al.any(1))[0]
            ox, oy = q['preview_sprite_offset_xy']
            cells.append((o, int(ax0 - ox + 1), int(yy[-1])))                       # (the anchor x in the drawing's own pixels; its foot its lowest pixel)
        out[(row, f)] = cells
    for mf, src in MIRROR.items():
        for row, _ in ROWS:
            out[(row, mf)] = [(np.ascontiguousarray(o[:, ::-1]), o.shape[1] - x, foot) for o, x, foot in out[(row, src)]]
    return out


def add(check=False):
    fr = frames()
    base = np.asarray(Image.open(os.path.join(ART, NAME + '.png')).convert('RGBA')).copy()
    meta = json.load(open(os.path.join(ART, NAME + '.json')))
    for row, _ in ROWS:                                   # (a re-run: the old axe rows dropped first)
        meta['anims'].pop(row, None)
    y0 = max([a['y'] + 8 * a['fh'] for a in meta['anims'].values()])
    base = base[:y0]
    blocks = []
    for row, fps in ROWS:
        allf = [c for f in range(8) for c in fr[(row, f)]]
        up = max(foot + 1 for o, x, foot in allf); dn = max(o.shape[0] - foot - 1 for o, x, foot in allf)
        ay = up + 1; fh = ay + max(dn, 2) + 1
        half = int(np.ceil(max(max(x, o.shape[1] - x) for o, x, foot in allf))) + 2; fw, ax = 2 * half, half
        n = len(fr[(row, 0)])
        blk = np.zeros((8 * fh, n * fw, 4), np.uint8)
        for f in range(8):
            for i, (o, x, foot) in enumerate(fr[(row, f)]):
                dx, dy = int(round(ax - x)), ay - foot
                cell = blk[f * fh:(f + 1) * fh, i * fw:(i + 1) * fw]
                on = o[..., 3] > 0
                cell[dy:dy + o.shape[0], dx:dx + o.shape[1]][on] = o[on]
        an = {k_: int(v_) for k_, v_ in {'y': y0, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'frames': n, 'fps': fps}.items()}
        if row in RELEASE:
            an['release'] = RELEASE[row]
        meta['anims'][row] = an
        blocks.append(blk); y0 += 8 * fh
    W = max([base.shape[1]] + [b.shape[1] for b in blocks])
    sheet = np.zeros((y0, W, 4), np.uint8); sheet[:base.shape[0], :base.shape[1]] = base; y = base.shape[0]
    for b in blocks:
        sheet[y:y + b.shape[0], :b.shape[1]] = b; y += b.shape[0]
    meta['source'] = meta['source'].split(' -- the greataxe rows')[0] + (' -- the greataxe rows (greataxe, axeidle, axewalk, axeflinch) drawn by the art desk '
                                                                         '(ART-WANTED-84-TALMOK-GREATAXE, 11-19), added by tools/talmok-axe-sheet.py')
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, NAME + '.png'), optimize=True)
    json.dump(meta, open(os.path.join(ART, NAME + '.json'), 'w'), indent=1)
    # the road's Talmok: the same image, its standing, walking, struck and striking rows the axe's
    A = meta['anims']
    road = {k: v for k, v in meta.items() if k not in ('anims', 'old')}
    road['anims'] = {'idle': A['axeidle'], 'walk': A['axewalk'], 'attack': A['greataxe'], 'greataxe': A['greataxe'], 'flinch': A['axeflinch'],
                     'hurt': A['hurt'], 'sit': A['sit'], 'prone': A['prone']}
    i0 = A['axeidle']
    road.update(fw=i0['fw'], fh=i0['fh'], ax=i0['ax'], ay=i0['ay'], top=meta.get('top'), name='Talmok, off the sand (the greataxe)')
    road['source'] = ('talmok_p2 read another way (tools/talmok-axe-sheet.py): the art desk\'s greataxe rows (ART-WANTED-84, 11-19) for his idle, walk, '
                      'flinch and blow -- worn by the road\'s Talmok (data/foes.js talmokroad) and the Pocket DM\'s (js/classes.js NPC.NAMED talmok); '
                      'his fall, sit and prone talmok_p2\'s own')
    json.dump(road, open(os.path.join(ART, ROAD + '.json'), 'w'), indent=1)
    print('  %s: %dx%d, + %s; %s over the same image' % (NAME, sheet.shape[1], sheet.shape[0],
          ', '.join('%s %d (%dx%d)' % (r, A[r]['frames'], A[r]['fw'], A[r]['fh']) for r, _ in ROWS), ROAD))
    if check:
        d = os.path.join(ROOT, 'dev', 'visions', 'talmok'); os.makedirs(d, exist_ok=True)
        for r, _ in ROWS:
            an = A[r]; blk = sheet[an['y']:an['y'] + 8 * an['fh'], :an['frames'] * an['fw']]
            cv = np.zeros(blk.shape[:2] + (3,), np.uint8); cv[...] = (14, 22, 52)
            for f in range(8):
                cv[f * an['fh'] + an['ay'], :] = (90, 70, 50)
            al = blk[..., 3:4] / 255.0; cv = (blk[..., :3] * al + cv * (1 - al)).astype(np.uint8)
            Image.fromarray(cv).resize((cv.shape[1] * 2, cv.shape[0] * 2), Image.NEAREST).save(os.path.join(d, 'axe-%s.png' % r))
        print('  dev/visions/talmok/axe-<row>.png')


if __name__ == '__main__':
    add('check' in sys.argv[1:])

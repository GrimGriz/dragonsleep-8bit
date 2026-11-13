"""DEEP16 pipeline 2 (generated art): a REVIEW sheet -- Lymen's longsword-and-shield attack in all eight facings, the art desk's five drawn views -> lymen_check_p2.

    python tools/lymen-check-sheet.py            (writes deep16/art/lymen_check_p2.png/.json and deep16/art-src/lymen-check/ the 4x still beside lymen_p0)

11-13, the garrison cutter, on the lanes desk's relay: the art desk's ART-MC-LYMEN-BASE-ATTACK-06-FIVE-FACINGS, sorted out of Fresh to
deep16/_src/lymen/ART-MC-LYMEN-BASE-ATTACK-06-FIVE-FACINGS/ (the zip beside it): Lymen's six-frame attack drawn over the mannequin's
GUIDE-2026-11-13b-longsword-and-shield (Griz's re-posed slash, a930d4c6, the shield arm shoved on 2 and swept down the sword's diagonal on 3 and 4,
be4e7e1c; the pose JSON and the guide strips ride in its references/) in S, SE, E, rear NE and N. It supersedes the SE-only checkpoints (V2, cut here
earlier the same day, 68692584: its page now in deep16/_src/lymen/superseded/ by its folder). Its FRAME-MAP.json gives each view's guard crown and
sole lines, each frame's half-open crop and its reference boot.

The cut, by hand over tools/vivian-sheet.py's figure() and to1x(): each view scaled ONCE from its guard, crown to sole -> 48 px (barley_p3's grown
human; the notes' "scale each sheet once from its guard to 48 px crown to sole"), so every view stands 48; every frame placed by its reference boot
(x) on the view's sole line (y), so the knee bend and the blade's reach stay as drawn. SW, W and NW the mirrors of SE, E and NE (RULED 10-14; the
mirror flips the kit to the other hand, the house's convention). Rows: idle 1 (frame 1, the guard, held -- the sheet format wants an idle) and
attack 6 (`release` 3: "Descending cut and impact"). A CHECKPOINT ROW, NOT LYMEN'S SHEET: worn by nobody; lymen_p0 stays his. The name is kept so
the row gallery's doors (deep16/?rows=lymen_check_p2,lymen_p0&beside; the Blender seat's lymen_blend_p2 beside it) find it.
"""
import importlib.util, json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)

LOOK = 'lymen_check_p2'
SRC = os.path.join(VS.pix.SRC, 'lymen', 'ART-MC-LYMEN-BASE-ATTACK-06-FIVE-FACINGS')
TALL, FH, AY = 48, 84, 76            # (the blade high over the head on frame 3)
MIRROR = {1: 7, 2: 6, 3: 5}          # (SW from SE, W from E, NW from NE)


def cells():
    fm = json.load(open(os.path.join(SRC, 'FRAME-MAP.json'), encoding='utf-8'))
    out, scale = {}, {}
    for view, v in fm['facings'].items() if 'facings' in fm else fm.items():
        if not isinstance(v, dict) or 'frames' not in v:
            continue
        page = np.asarray(Image.open(os.path.join(SRC, v['file'])).convert('RGB')).astype(np.float32)
        k = TALL / float(v['sole_y_guard'] - v['crown_y_guard']); scale[view] = k
        f = v['engine_facing']
        for fr in v['frames']:
            x0, y0, x1, y1 = fr['crop_xyxy']; bx, by = fr['approx_reference_boot_xy']
            a = page[y0:y1, x0:x1]
            o = VS.to1x(a, VS.figure(a, True), k)
            ax, foot = (bx - x0) * k + 1, (v['sole_y_guard'] - y0) * k + 1
            out[(f, 'attack', fr['runtime_index'])] = (o, ax, foot)
            if fr['runtime_index'] == 0:
                out[(f, 'idle', 0)] = (o, ax, foot)
    for mf, src in MIRROR.items():
        for (f, row, i) in [c for c in list(out) if c[0] == src]:
            o, ax, foot = out[(f, row, i)]
            out[(mf, row, i)] = (np.ascontiguousarray(o[:, ::-1]), o.shape[1] - 1 - ax, foot)
    return out, scale


def cut():
    cs, scale = cells()
    anims, blocks, y = {}, [], 0
    for name, fps, n in (('idle', 1, 1), ('attack', 10, 6)):
        reach = max(max(ax, o.shape[1] - ax) for (f, r, i), (o, ax, foot) in cs.items() if r == name)
        fw = int(2 * np.ceil(reach + 2)); cx = fw // 2
        blk = np.zeros((8 * FH, n * fw, 4), np.uint8)
        for (f, r, i), (o, ax, foot) in cs.items():
            if r != name:
                continue
            dx, dy = int(round(cx - ax)), int(round(AY - foot))
            h, w = o.shape[:2]; sy, sx = max(0, -dy), max(0, -dx)
            hh, ww = min(h - sy, FH - max(0, dy)), min(w - sx, fw - max(0, dx))
            sub = o[sy:sy + hh, sx:sx + ww]; dst = blk[f * FH + max(0, dy):f * FH + max(0, dy) + hh, i * fw + max(0, dx):i * fw + max(0, dx) + ww]
            put = sub[..., 3] > 0; dst[put] = sub[put]
        a = dict(y=y, fw=fw, fh=FH, ax=cx, ay=AY, frames=n, fps=fps)
        if name == 'attack':
            a['release'] = 3
        anims[name] = a; blocks.append(blk); y += 8 * FH
    W = max(b.shape[1] for b in blocks); sheet = np.zeros((y, W, 4), np.uint8); yy = 0
    for b in blocks:
        sheet[yy:yy + b.shape[0], :b.shape[1]] = b; yy += b.shape[0]
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ROOT, 'deep16', 'art', LOOK + '.png'), optimize=True)
    meta = dict(image='art/%s.png' % LOOK, fw=anims['idle']['fw'], fh=FH, ax=anims['idle']['ax'], ay=AY, top=TALL, anims=anims, name='Lymen (attack checkpoint)',
                hold=["a review row: the art desk's six-frame attack in five drawn views, for Griz's eye before a whole sheet is drawn -- worn by nobody",
                      "S frame 4 looks nearly down the blade; N frame 5 hides most of the blade; rear NE's guard shows more shield rim than the mannequin; S and N stances squarer than the guide (the art desk's own notes)"],
                source="drawn by the art desk (ART-MC-LYMEN-BASE-ATTACK-06-FIVE-FACINGS, 11-13, over GUIDE-2026-11-13b-longsword-and-shield), cut by tools/lymen-check-sheet.py; SW W NW mirrored")
    with open(os.path.join(ROOT, 'deep16', 'art', LOOK + '.json'), 'w', encoding='utf-8', newline='\n') as f_:
        json.dump(meta, f_, indent=1)
    print('%s: %dx%d, idle %d@%dpx, attack %d@%dpx; scale %s' % (LOOK, W, y, 1, anims['idle']['fw'], 6, anims['attack']['fw'], ', '.join('%s %.4f' % kv for kv in sorted(scale.items()))))
    still(sheet, anims)


def still(sheet, anims):
    """the 4x still: for each facing S SE E NE N SW W NW, the checkpoint's attack row over lymen_p0's"""
    art = os.path.join(ROOT, 'deep16', 'art')
    j = json.load(open(os.path.join(art, 'lymen_p0.json'), encoding='utf-8')); p = j['anims']['attack']
    pfw, pfh = p.get('fw', j['fw']), p.get('fh', j['fh']); pim = np.asarray(Image.open(os.path.join(art, 'lymen_p0.png')).convert('RGBA'))
    a = anims['attack']; strips = []
    for f in (0, 7, 6, 5, 4, 1, 2, 3):
        strips.append(sheet[a['y'] + f * FH:a['y'] + (f + 1) * FH, :a['fw'] * 6])
        strips.append(pim[p['y'] + f * pfh:p['y'] + (f + 1) * pfh, :pfw * p['frames']])
    W = max(s.shape[1] for s in strips); H = sum(s.shape[0] for s in strips)
    out = Image.new('RGBA', (W, H), (12, 20, 40, 255)); y = 0
    for s in strips:
        out.alpha_composite(Image.fromarray(np.ascontiguousarray(s), 'RGBA'), (0, y)); y += s.shape[0]
    d = os.path.join(ROOT, 'deep16', 'art-src', 'lymen-check'); os.makedirs(d, exist_ok=True)
    out.resize((W * 4, H * 4), Image.NEAREST).save(os.path.join(d, 'lymen-attack-8-facings-over-lymen_p0-4x.png'), optimize=True)
    out.save(os.path.join(d, 'lymen-attack-8-facings-over-lymen_p0-1x.png'), optimize=True)


if __name__ == '__main__':
    cut()

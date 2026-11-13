"""DEEP16 pipeline 2 (generated art): a REVIEW sheet -- Lymen's longsword-and-shield attack, the art desk's SE checkpoint (V2) -> lymen_check_p2.

    python tools/lymen-check-sheet.py            (writes deep16/art/lymen_check_p2.png/.json and deep16/art-src/lymen-check/ the 4x still beside lymen_p0)

Cut 11-13 by the garrison cutter on the lanes desk's relay of Griz's "I made some adjustments and fed the art dept the json and we got back what's in
fresh". The art desk's ART-MC-LYMEN-BASE-ATTACK-SE-CHECKPOINT-V2, sorted out of Fresh to deep16/_src/lymen/ART-MC-LYMEN-BASE-ATTACK-SE-CHECKPOINT-V2/ (the
zip beside it): one page, SE only, the six beats of the mannequin's longsword-and-shield slash (deep16/_src/art-desk/sent/GUIDE-2026-11-13-longsword-and-shield)
as Griz re-posed it in the poser (his play-records/slashshield-poses.json, 11-13 00:12, a copy kept beside the page). Its notes give the frame windows
(x by frame, y 135-535), the cut on frame 4 (release 3) and one scale for the row from the opening guard: 48 px crown to sole, `barley_p3`'s grown human.

A CHECKPOINT, NOT LYMEN'S SHEET: one view cannot replace lymen_p0's eight facings, so this is a sheet of its own, worn by nobody -- the row gallery shows it
beside lymen_p0 (deep16/?rows=lymen_check_p2,lymen_p0&beside). Rows: idle 1 (frame 1, the guard, held -- the sheet format wants an idle), attack 6
(`release` 3). SE drawn; SW its mirror (RULED 10-14). The scale: frame 1's crown (the hair's top, the sword left out) to its soles is 252 source px -> 48,
so the whole row at 0.1905 (TALL is frame 1's full height with the sword over the head, 48 x 277 / 252).
"""
import importlib.util, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('vivian_sheet', os.path.join(ROOT, 'tools', 'vivian-sheet.py'))
VS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(VS)
VS.FH, VS.AY = 80, 74          # (the blade upright over the head on frame 3)

SRC = os.path.join('lymen', 'ART-MC-LYMEN-BASE-ATTACK-SE-CHECKPOINT-V2')
PAGE = 'ART-MC-LYMEN-BASE-ATTACK-06-SE-V2.png'
XS = [0, 335, 688, 1025, 1428, 1794, 2172]          # (the notes' half-open x crops; frame 6 to the page's width)
Y0, Y1 = 135, 535

win = [('', 'SE', 'attack', i, PAGE, (XS[i], Y0, XS[i + 1], Y1)) for i in range(6)] + [('', 'SE', 'idle', 0, PAGE, (XS[0], Y0, XS[1], Y1))]

VS.LOOKS['lymen_check_p2'] = dict(
    src=SRC, windows=win if os.path.isdir(os.path.join(VS.pix.SRC, SRC)) else [], trim=True, tall=48 * 277 / 252.0, avoid=['fire'], name='Lymen (SE checkpoint)',
    rows=[('idle', 1, 1), ('attack', 10, 6)], release={'attack': 3},
    hold=["a review sheet: the art desk's SE checkpoint (V2) of Lymen's base attack, one view, for Griz's go before the other four are drawn -- worn by nobody",
          "frame 5: the shield's outward travel partly hidden by SE foreshortening (the art desk's own note)"],
    source="drawn by the art desk (ART-MC-LYMEN-BASE-ATTACK-SE-CHECKPOINT-V2, 11-13: SE over Griz's re-posed longsword-and-shield slash), cut by "
           "tools/lymen-check-sheet.py over tools/vivian-sheet.py; SW mirrored")


def still():
    """the 4x still: the checkpoint's SE attack over lymen_p0's SE attack, every frame, on the game's navy"""
    import json
    art = os.path.join(ROOT, 'deep16', 'art')
    rows = []
    for name in ('lymen_check_p2', 'lymen_p0'):
        j = json.load(open(os.path.join(art, name + '.json'), encoding='utf-8')); a = j['anims']['attack']
        fw, fh = a.get('fw', j['fw']), a.get('fh', j['fh']); f = 7                      # (SE)
        im = Image.open(os.path.join(art, name + '.png')).convert('RGBA')
        rows.append(im.crop((0, a['y'] + f * fh, fw * a['frames'], a['y'] + (f + 1) * fh)))
    W, H = max(r.width for r in rows), sum(r.height for r in rows)
    out = Image.new('RGBA', (W, H), (12, 20, 40, 255)); y = 0
    for r in rows:
        out.alpha_composite(r, (0, y)); y += r.height
    d = os.path.join(ROOT, 'deep16', 'art-src', 'lymen-check'); os.makedirs(d, exist_ok=True)
    out.resize((W * 4, H * 4), Image.NEAREST).save(os.path.join(d, 'lymen-attack-SE-checkpoint-v2-over-lymen_p0-4x.png'), optimize=True)


if __name__ == '__main__':
    VS.cut('lymen_check_p2')
    still()

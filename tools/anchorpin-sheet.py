"""DEEP16 pipeline 2 (generated art): THE ANCHOR-PIN -- the glory-seekers' trophy, a still for the talk screen's picture slot at the end of their fight, and its
item icon. The art desk's ART-162-ANCHOR-PIN-CUTTER-HANDOFF (11-24; our art-wanted 98, asked by the world seat world-1124 on Griz's 11-23 "art dept request anchor
pin for portrait slot (glory seeker fight end)"), sorted out of Fresh to deep16/_src/anchorpin/ART-162/ by the cutter seat cutter-1124c.

    python tools/anchorpin-sheet.py          (writes deep16/art/pic_anchorpin.png/.json and icon_anchorpin.png/.json)

THE STILL (pic_anchorpin, 184 x 208, the picture slot's size -- js/counter.js): the art desk's approved 1x preview taken as it is (ART-162 CUTTER-NOTES: "Griz
approved the 736x832 dialogue still and its 184x208 preview ... The still retains the approved colours, guided by the Deep16 palette"). NOT snapped to the 64:
snapped, the stone turned brown and the brass went blotchy with rust-coloured patches (tried 11-24) -- the one picture in the game kept off the palette, his
to overrule. Checked against the 736 x 832 source boxed down (a mean difference under 2 a channel: the preview is the source's own reduction). The talk
screen's counter covers its native rows 182 to 207 (the json's `counter`).

THE ICON (icon_anchorpin, 32 x 32): the art desk's 32 x 32 export taken as it is ("Use the supplied 32x32 PNG directly"), checked: every colour one of the 64,
the alpha hard. No item list draws a picture yet (the menus' icons are drawn by code): cut and in hand, worn by nothing.
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('pixelate', os.path.join(ROOT, 'tools', 'pixelate.py')); PX = importlib.util.module_from_spec(spec); spec.loader.exec_module(PX)
SRC = os.path.join(PX.SRC, 'anchorpin', 'ART-162')
ART = os.path.join(ROOT, 'deep16', 'art')
STILL, ICON = (184, 208), (32, 32)


def palette():
    p = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps']
    return {tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for v in p.values() for h in v}


def write(name, img, meta):
    Image.fromarray(img, 'RGBA').save(os.path.join(ART, name + '.png'), optimize=True)
    meta = dict({'image': 'art/%s.png' % name, 'anims': {}, 'art': 'ART-162', 'source': 'deep16/_src/anchorpin/ART-162/ (the art desk\'s ART-162-ANCHOR-PIN-CUTTER-HANDOFF, 11-24), cut by tools/anchorpin-sheet.py'}, **meta)
    with open(os.path.join(ART, name + '.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(meta, f, indent=1)
    print('wrote deep16/art/%s.png (%d x %d)' % (name, img.shape[1], img.shape[0]))


def main():
    still = np.asarray(Image.open(os.path.join(SRC, 'previews', 'pic_anchorpin-1x.png')).convert('RGB'))
    assert still.shape[:2] == (STILL[1], STILL[0]), 'ART-162: the still is %s, not %d x %d' % (still.shape[:2], STILL[0], STILL[1])
    big = Image.open(os.path.join(SRC, 'source', 'pic_anchorpin.png')).convert('RGB')
    assert big.size == (STILL[0] * 4, STILL[1] * 4), 'ART-162: the source still is %s, not four times the slot' % (big.size,)
    d = np.abs(still.astype(int) - np.asarray(big.resize(STILL, Image.BOX)).astype(int)).mean()
    assert d < 2, 'ART-162: the 1x still is not the source boxed down (%.2f a channel)' % d
    rgba = np.zeros((STILL[1], STILL[0], 4), np.uint8); rgba[..., :3] = still; rgba[..., 3] = 255
    write('pic_anchorpin', rgba, {'fw': STILL[0], 'fh': STILL[1], 'ax': 0, 'ay': 0, 'top': 0, 'still': True, 'counter': [182, 208],
                                   'door': 'the glory-seekers\' fight end, the picture slot (js/trueword.js TW.pic)'})
    icon = np.asarray(Image.open(os.path.join(SRC, 'previews', 'icon_anchorpin-1x.png')).convert('RGBA'))
    assert icon.shape[:2] == (ICON[1], ICON[0]), 'ART-162: the icon is %s, not %d x %d' % (icon.shape[:2], ICON[0], ICON[1])
    assert set(np.unique(icon[..., 3]).tolist()) <= {0, 255}, 'ART-162: the icon\'s alpha is not hard'
    off = {tuple(c) for c in icon[icon[..., 3] > 0][:, :3].tolist()} - palette()
    assert not off, 'ART-162: the icon has %d colours off the palette' % len(off)
    write('icon_anchorpin', icon.copy(), {'fw': ICON[0], 'fh': ICON[1], 'ax': ICON[0] // 2, 'ay': ICON[1], 'top': 0, 'icon': True,
                                           'door': 'none yet: no item list draws a picture (the anchor-pin, content/items.json anchorpin)'})


if __name__ == '__main__':
    main()

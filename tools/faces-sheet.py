"""DEEP16: the big faces off the tops of Griz's generated sheets, cut into one-frame sheets for a cutscene's close-ups (10-08, GreyFang's end).

    python tools/faces-sheet.py            (writes deep16/art/face_greyfang.png/.json and face_harbinger.png/.json)
    python tools/faces-sheet.py check      (also dev/visions/faces.png, both at 3x)

Griz, 10-08, on the ending's face close-ups (the game sprites blown up, blocky): "I remember a lot of the art sheets starting with a big ole face in the
top left..". So: GreyFang's from his first sheet (deep16/_src/Fresh/Greyfang_ Grizzled Veteran Ranger Sprite Sheet-1.png, the box tools/greyfang-sheet.py
blanks), the Harbinger's from the made gnoll's second (deep16/_src/Mirror-Eyed Gnoll Action Sprite Sheet2.png). Each is cut out of its navy by the same mask
the rows are (tools/sheetrows.py figure_mask), brought down to HEIGHT px and snapped to the palette (tools/pixelate.py). The Harbinger's portrait still has
one amber eye -- the made gnoll has two mirrors (Griz, 10-08: "Can you make that front eye that's dark also mirror on this chap?") -- so its amber is painted
as a mirror's pale cyan and white before the cut. The sheet's `face` is half its height: js/trophy.js stands the portrait's middle on the screen's.
Both face right as drawn; js/trophy.js turns GreyFang's to look back at the Harbinger.
"""
import os, sys, json, subprocess
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SR = _load('sheetrows', os.path.join(ROOT, 'tools', 'sheetrows.py'))

SRC = os.path.join(ROOT, 'deep16', '_src')
if not os.path.exists(os.path.join(SRC, 'Mirror-Eyed Gnoll Action Sprite Sheet2.png')):
    _common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    SRC = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, _common))), 'deep16', '_src')

HEIGHT = 96          # px tall at game size (the screen is 270: a close-up at 2x stands most of its height)
FACES = {
    # name: (source sheet, the portrait's box on it, boxes whose amber is painted as a mirror)
    'face_greyfang': (os.path.join('Fresh', 'Greyfang_ Grizzled Veteran Ranger Sprite Sheet-1.png'), (0, 45, 298, 274), []),
    'face_harbinger': ('Mirror-Eyed Gnoll Action Sprite Sheet2.png', (0, 20, 300, 285), [(171, 125, 194, 141)]),
}


def mirror_eye(a, box):
    """the amber in `box` painted as a mirror pane: pale cyan, its brightest white (the made gnoll's second mirror)"""
    x0, y0, x1, y1 = box
    reg = a[y0:y1, x0:x1].astype(int)
    r, g, b = reg[..., 0], reg[..., 1], reg[..., 2]
    amber = (r > 150) & (g > 60) & (g < 190) & (b < 90) & (r - b > 90)
    hot = amber & (r + g > 380)
    reg[amber] = (186, 238, 252)
    reg[hot] = (250, 255, 255)
    a[y0:y1, x0:x1] = reg.astype(a.dtype)


def cut(name, check=False):
    fn, box, eyes = FACES[name]
    a = np.asarray(Image.open(os.path.join(SRC, fn)).convert('RGB')).copy()
    for e in eyes:
        mirror_eye(a, e)
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1]
    m = SR.figure_mask(sub.astype(np.int32))
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    if n:
        sz = ndimage.sum(m, lab, range(1, n + 1))
        m = lab == (1 + int(np.argmax(sz)))                       # the portrait: the biggest piece in the box (a stray from a row under it goes)
        m = ndimage.binary_fill_holes(m)
    ys, xs = np.where(m)
    rgba = np.zeros(sub.shape[:2] + (4,), np.uint8); rgba[..., :3] = sub; rgba[..., 3] = m * 255
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    im = Image.fromarray(rgba, 'RGBA')
    k = im.height / float(HEIGHT)
    small = im.resize((max(1, round(im.width / k)), HEIGHT), Image.BOX)
    fr = pix.pixelate(small, 1, do_lift=False)
    fw = int(np.ceil((fr.shape[1] + 4) / 8.0)) * 8; fh = fr.shape[0] + 4
    out = np.zeros((fh, fw, 4), np.uint8); ox = (fw - fr.shape[1]) // 2; out[2:2 + fr.shape[0], ox:ox + fr.shape[1]] = fr
    frames = {'idle': [[out] for _ in range(8)]}
    pix.write_sheet(name, frames, fw, fh, fw // 2, fh - 2, 2)
    mp = os.path.join(ROOT, 'deep16', 'art', name + '.json'); meta = json.load(open(mp))
    meta['face'] = int((fh - 4) / 2); meta['source'] = 'the big face off ' + fn + ' (Griz, 10-08), cut by tools/faces-sheet.py'
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %dx%d' % (name, fr.shape[1], fr.shape[0]))
    return out


if __name__ == '__main__':
    check = 'check' in sys.argv[1:]
    outs = [cut(nm, check) for nm in FACES]
    if check:
        W = sum(o.shape[1] for o in outs) + 10 * len(outs); H = max(o.shape[0] for o in outs)
        cv = np.zeros((H, W, 4), np.uint8); cv[..., :3] = (60, 120, 200); cv[..., 3] = 255; x = 5
        for o in outs:
            al = o[..., 3:4] / 255.0; sl = cv[:o.shape[0], x:x + o.shape[1]]; sl[..., :3] = (o[..., :3] * al + sl[..., :3] * (1 - al)).astype(np.uint8); x += o.shape[1] + 10
        d = os.path.join(ROOT, 'dev', 'visions'); os.makedirs(d, exist_ok=True)
        Image.fromarray(cv).resize((W * 3, H * 3), Image.NEAREST).save(os.path.join(d, 'faces.png'))

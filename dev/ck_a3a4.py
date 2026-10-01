import os, sys, importlib.util, numpy as np
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('ck', os.path.join(ROOT, 'tools', 'cloaker-sheet.py'))
ck = importlib.util.module_from_spec(spec); spec.loader.exec_module(ck)
s1 = np.asarray(Image.open(os.path.join(ck.SRC, 'cloaker_grok_1.png')).convert('RGB')).astype(np.int32)
out = Image.new('RGBA', (1000, 700), (60, 60, 90, 255))
d = ImageDraw.Draw(out)
for i, n in enumerate((3, 4)):
    img, eye = ck.cell(s1, n)
    if n == 3: img = img.transpose(Image.FLIP_LEFT_RIGHT)
    big = img.resize((img.size[0] * 2, img.size[1] * 2), Image.NEAREST)
    out.alpha_composite(big, (i * 500, 0))
    for x in range(0, img.size[0], 20):
        d.line((i * 500 + x * 2, 0, i * 500 + x * 2, 8), fill=(255, 255, 0, 255)); d.text((i * 500 + x * 2 + 1, 8), str(x), fill=(255, 255, 0, 255))
    for y in range(0, min(img.size[1], 340), 20):
        d.line((i * 500, y * 2, i * 500 + 8, y * 2), fill=(0, 255, 255, 255)); d.text((i * 500 + 10, y * 2), str(y), fill=(0, 255, 255, 255))
    print(n, img.size)
os.makedirs(os.path.join(ROOT, 'dev', 'shots'), exist_ok=True)
out.save(os.path.join(ROOT, 'dev', 'shots', 'a3a4.png'))

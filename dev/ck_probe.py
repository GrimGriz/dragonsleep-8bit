import os, sys, numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'deep16', '_src')
out = {}
for n in (1, 2):
    im = np.asarray(Image.open(os.path.join(SRC, 'cloaker_grok_%d.png' % n)).convert('RGB')).astype(int)
    v, c = np.unique(im[0:14, 0:14].reshape(-1, 3), axis=0, return_counts=True)
    print(n, im.shape, sorted(zip(c.tolist(), map(tuple, v.tolist())), reverse=True)[:4])
    v, c = np.unique(im[60:200, 300:580].reshape(-1, 3) // 8 * 8, axis=0, return_counts=True)
    print('  cell2 common', sorted(zip(c.tolist(), map(tuple, v.tolist())), reverse=True)[:5])

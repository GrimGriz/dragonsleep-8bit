"""THE GREYS (RULED 11-11, Griz: "yes to the gulch and greys", on the inn seat's lean to his 11-06 note on eyes-wagonwatch-1105, "the grays aren't gray"): the wagon's
team are "the greys" in every word, and the art desk drew the horse cream -- horsegrey_p1 (the team's, alone) and willemmounted_p1 (Willem on his) -- and the yard's other
horse a bay (horse_p1). In code, no art ask: the cream horse recolored a dapple grey on the shared palette, from the grey Amara's horse already is (amaramounted_p1:
110,106,102 and its blue-grey shades), and the team two greys (js/inn.js In.bedRiders, data/fights.js TEAM). horsegrey_p1 is the horse alone, so all of its coat; on Willem's
sheet only the coat -- each frame's patches of the coat's colours joined to its cream (the horse's lightest), never his face or hands, which share the tan but touch no cream.
Re-run safe: a sheet with no cream left is written as it is.   python tools/greys-recolor.py   (then python tools/deep16-build.py for the stamps)"""
import json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'deep16', 'art')
CREAM, TAN, SHADE = (216, 212, 196), (180, 154, 124), (148, 121, 95)
COAT = {CREAM: (184, 195, 212), TAN: (138, 150, 170), SHADE: (110, 106, 102)}   # (the palette's own greys: the light, the body, the shade)
DAPPLE = (138, 150, 170)   # (the dapples on the light: rings of the body's grey)


def dapple(x, y):
    """a dapple grey's rings: soft spots on a 7-px lattice, each a ring with a light middle"""
    cx, cy = (x + (y // 7) * 3) % 7 - 3, y % 7 - 3
    d = cx * cx + cy * cy
    return 4 <= d <= 6


def frame_size(name):
    s = open(os.path.join(ROOT, 'deep16', 'data', 'sprites.js'), encoding='utf-8').read()
    i = s.index('"%s"' % name)
    return int(re.search(r'"fw": (\d+)', s[i:]).group(1)), int(re.search(r'"fh": (\d+)', s[i:]).group(1))


def coat_mask(im, fw, fh, whole):
    """the pixels to recolor: all of the coat's colours (whole), or each frame's patches of them joined (4 ways) to a cream pixel"""
    W, H = im.size; px = im.load(); out = set()
    if whole:
        for y in range(H):
            for x in range(W):
                p = px[x, y]
                if p[3] and p[:3] in COAT: out.add((x, y))
        return out
    # (a patch is the horse's if it holds cream, or runs down to the hooves -- the bottom quarter of the frame: the front view's horse has no cream in it -- or is a dozen
    # pixels or more with its middle in the frame's lower half: the front gallop's face and chest, cut off from its legs by the outline; his face and hands, tan too,
    # are small patches high in the frame)
    for fy in range(0, H, fh):
        for fx in range(0, W, fw):
            seen = set()
            for y in range(fy, min(H, fy + fh)):
                for x in range(fx, min(W, fx + fw)):
                    if (x, y) in seen or px[x, y][3] == 0 or px[x, y][:3] not in COAT: continue
                    stack = [(x, y)]; seen.add((x, y)); patch = []; cream = False; low = 0
                    while stack:
                        a, b = stack.pop(); patch.append((a, b)); cream = cream or px[a, b][:3] == CREAM; low = max(low, b - fy)
                        for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            q = (a + d[0], b + d[1])
                            if q in seen or not (fx <= q[0] < min(W, fx + fw) and fy <= q[1] < min(H, fy + fh)): continue
                            v = px[q]
                            if v[3] and v[:3] in COAT: seen.add(q); stack.append(q)
                    mid = sum(q[1] - fy for q in patch) / float(len(patch))
                    if cream or low >= fh * 0.75 or (mid >= fh * 0.5 and len(patch) >= 12): out.update(patch)
    return out


def recolor(name, whole):
    path = os.path.join(ART, name + '.png'); im = Image.open(path).convert('RGBA'); px = im.load()
    fw, fh = frame_size(name); mask = coat_mask(im, fw, fh, whole)
    n = 0
    for (x, y) in mask:
        p = px[x, y]; c = COAT[p[:3]]
        if p[:3] == CREAM and dapple(x % fw, y % fh): c = DAPPLE
        px[x, y] = c + (p[3],); n += 1
    if n: im.save(path, optimize=True)
    print('%s: %d coat pixels to grey%s' % (name, n, '' if n else ' (no cream left: as it was)'))
    return n


if __name__ == '__main__':
    recolor('horsegrey_p1', True)
    recolor('willemmounted_p1', False)

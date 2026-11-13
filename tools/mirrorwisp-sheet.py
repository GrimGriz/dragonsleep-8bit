"""DEEP16 pipeline 3 (drawn in code): the mirror wisp -> deep16/art/mirrorwisp_p1.png + .json.

    python tools/mirrorwisp-sheet.py

The will-o'-wisp as Mr. Ripples makes things (2026-11-13, Griz: "also make a mirror version that consumes magic (eats spell slots) (wisp is engine-drawn not
sprite?)" -- it is, so its mirror is too). The wisp's own sheet (tools/wisp-sheet.py: a light field quantised to the palette's `bone` and `glow` ramps), every
frame of it, with its two ramps turned to the mirror's: the bone heart to bright `silver`, the blue glow to `violet` -- a silver light with a purple edge, the
house's mirror colours (the made gnoll's mane is the dark silver; the mirror's eyes are violet). Run it after wisp-sheet.py whenever that sheet changes. The
ripple over it in a fight is js/ripple.js's, by its block (data/foes.js mirrorwisp `ripple`).
"""
import os, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D16 = os.path.join(ROOT, 'deep16')
PAL = json.load(open(os.path.join(D16, 'palette.json'), encoding='utf-8'))['ramps']


def rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


MAP = {
    rgb(PAL['bone'][2]): rgb(PAL['bone'][2]),      # the very heart stays white: a mirror's glint
    rgb(PAL['bone'][1]): rgb(PAL['silver'][6]),
    rgb(PAL['bone'][0]): rgb(PAL['silver'][5]),
    rgb(PAL['glow'][2]): rgb(PAL['violet'][5]),
    rgb(PAL['glow'][1]): rgb(PAL['violet'][4]),
    rgb(PAL['glow'][0]): rgb(PAL['violet'][2]),
}


def main():
    src = Image.open(os.path.join(D16, 'art', 'wisp_p1.png')).convert('RGBA')
    px = src.load()
    w, h = src.size
    n = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and (r, g, b) in MAP:
                px[x, y] = MAP[(r, g, b)] + (a,)
                n += 1
    src.save(os.path.join(D16, 'art', 'mirrorwisp_p1.png'), optimize=True)
    meta = json.load(open(os.path.join(D16, 'art', 'wisp_p1.json'), encoding='utf-8'))
    meta['image'] = 'art/mirrorwisp_p1.png'
    meta['source'] = "drawn in code by tools/mirrorwisp-sheet.py: the wisp's sheet (tools/wisp-sheet.py) with its bone and glow ramps turned to silver and violet (11-13)"
    json.dump(meta, open(os.path.join(D16, 'art', 'mirrorwisp_p1.json'), 'w'), indent=1)
    print('wrote deep16/art/mirrorwisp_p1.png and .json', src.size, n, 'pixels turned')


if __name__ == '__main__':
    main()

"""DEEP16 pipeline 3 (drawn in code): the mirror wisp -> deep16/art/mirrorwisp_p1.png + .json, and its two other states,
mirrorwisp_emaciated_p1 and mirrorwisp_overcharged_p1.

    python tools/mirrorwisp-sheet.py

The will-o'-wisp as Mr. Ripples makes things (2026-11-13, Griz: "also make a mirror version that consumes magic (eats spell slots) (wisp is engine-drawn not
sprite?)" -- it is, so its mirror is too). The wisp's own sheet (tools/wisp-sheet.py: a light field quantised to the palette's `bone` and `glow` ramps), every
frame of it, with its two ramps turned to the mirror's: the bone heart to bright `silver`, the blue glow to `violet` -- a silver light with a purple edge, the
house's mirror colours (the made gnoll's mane is the dark silver; the mirror's eyes are violet). Run it after wisp-sheet.py whenever that sheet changes. The
ripple over it in a fight is js/ripple.js's, by its block (data/foes.js mirrorwisp `ripple`).

THE THREE STATES (2026-11-14, Griz: "0a - wisp is code drawn so we should be able to do the withered and charged variants"): the same frames on the same cell
and foot, named as the art desk's wolves are (<sheet>_emaciated_p1, <sheet>_overcharged_p1), so js/seep.js S.stateSheet finds them.
  WITHERED (emaciated)    three days with no magic eaten: the wide outer halo is gone, every band a step darker and thinner, and the white heart a dull
                          grey -- a small guttering light.
  CHARGED (overcharged)   fed: every band a step brighter and solid, the bright ring gone to the mirror's silver round the white heart, and a new outer
                          halo two pixels past the old one, dithered -- a bigger, harder light.
The wisp's sheet keeps its bands apart by colour AND alpha (the outer halo is glow[0] at 90, the inner at 170), so the states are told by both.
"""
import os, json
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D16 = os.path.join(ROOT, 'deep16')
PAL = json.load(open(os.path.join(D16, 'palette.json'), encoding='utf-8'))['ramps']


def rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


B2, B1, B0 = rgb(PAL['bone'][2]), rgb(PAL['bone'][1]), rgb(PAL['bone'][0])
G2, G1, G0 = rgb(PAL['glow'][2]), rgb(PAL['glow'][1]), rgb(PAL['glow'][0])
V = [rgb(c) for c in PAL['violet']]
SV = [rgb(c) for c in PAL['silver']]

# the wisp's pixel (its colour) -> the mirror wisp's: the alpha kept
MAP = {
    B2: B2,      # the very heart stays white: a mirror's glint
    B1: SV[6],
    B0: SV[5],
    G2: V[5],
    G1: V[4],
    G0: V[2],
}
# the two other states: (the wisp's colour, its alpha) -> (colour, alpha), None the pixel gone. A band not named here keeps the normal state's colour
WITHERED = {
    (B2, 255): (SV[5], 255),   # the heart: dull
    (G2, 255): (V[4], 255),
    (G1, 255): (V[3], 255),
    (G1, 200): (V[2], 170),
    (G0, 170): (V[1], 110),
    (G0, 90): None,            # the wide halo: gone
}
CHARGED = {
    (B2, 255): (B2, 255),
    (G2, 255): (SV[6], 255),   # the bright ring: the mirror's silver
    (G1, 255): (V[5], 255),
    (G1, 200): (V[5], 235),
    (G0, 170): (V[4], 210),
    (G0, 90): (V[3], 140),
}
STATES = (('mirrorwisp_p1', None, 'normal'), ('mirrorwisp_emaciated_p1', WITHERED, 'withered'), ('mirrorwisp_overcharged_p1', CHARGED, 'charged'))
SHADOW = (10, 8, 16)


def build(name, table, state):
    src = Image.open(os.path.join(D16, 'art', 'wisp_p1.png')).convert('RGBA')
    px = src.load()
    w, h = src.size
    n = 0
    body = Image.new('L', (w, h), 0)   # the light itself, the ground shadow left out: what the charged halo grows from
    bp = body.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if not a or (r, g, b) == SHADOW:
                continue
            bp[x, y] = 255
            key = ((r, g, b), a)
            if table is not None and key in table:
                to = table[key]
                px[x, y] = (0, 0, 0, 0) if to is None else to[0] + (to[1],)
                n += 1
            elif (r, g, b) in MAP:
                px[x, y] = MAP[(r, g, b)] + (a,)
                n += 1
    if state == 'charged':             # the new outer halo: two pixels past the figure, a checker dither, never across a frame's edge into the next
        meta0 = json.load(open(os.path.join(D16, 'art', 'wisp_p1.json'), encoding='utf-8'))
        fw, fh = meta0['fw'], meta0['fh']
        grown = body.filter(ImageFilter.MaxFilter(5)).load()
        for y in range(h):
            for x in range(w):
                if grown[x, y] and not bp[x, y] and (x + y) % 2 == 0 and px[x, y][3] == 0 and 1 < x % fw < fw - 2 and 1 < y % fh < fh - 2:
                    px[x, y] = V[2] + (120,)
                    n += 1
    src.save(os.path.join(D16, 'art', name + '.png'), optimize=True)
    meta = json.load(open(os.path.join(D16, 'art', 'wisp_p1.json'), encoding='utf-8'))
    meta['image'] = 'art/' + name + '.png'
    meta['source'] = "drawn in code by tools/mirrorwisp-sheet.py: the wisp's sheet (tools/wisp-sheet.py) with its bone and glow ramps turned to silver and violet (11-13)" + (
        '' if state == 'normal' else '; the ' + state.upper() + ' state (11-14): ' + ('the outer halo gone, each band darker, the heart grey' if state == 'withered' else 'each band brighter, a silver ring, a wider dithered halo'))
    json.dump(meta, open(os.path.join(D16, 'art', name + '.json'), 'w'), indent=1)
    print('wrote deep16/art/' + name + '.png and .json', src.size, n, 'pixels turned')


def main():
    for name, table, state in STATES:
        build(name, table, state)


if __name__ == '__main__':
    main()

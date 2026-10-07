"""DEEP16: his zodiac wheel (dev/visions/wheel.webp) as a prop lying flat on the floor that spins -- a sprite sheet.

    python tools/wheel-sheet.py          # 5 squares across (25 tiles) -> deep16/art/zodiacwheel_p1.png/.json
    python tools/wheel-sheet.py 3        # 3 across (9 tiles, his first aim) -> deep16/art/zodiacwheel3_p1.png/.json

Flat on DEEP16's 2:1 floor a circle N squares across is an ellipse 32*sqrt(2)*N px wide and half as tall (js/iso.js: a
square is 64 x 32), its 12 o'clock at the top of the screen. The rings, the dividers and the ticks are drawn at 1x as
pixel lines (where the radius or the angle crosses its value, one pixel wide), so they stay crisp at any turn of the
wheel; his art gives what a line can't -- the signs (their grey and drop shadow) and the streaks in the red -- sampled
through the turn. Every colour is deep16/palette.json's.

The highlight is the floor's, not the wheel's (Griz, 10-07: "highlight stationary, wheel spins change which is
highlighted"): his navy patch is lifted off Pisces and painted back as a window at the top that the signs pass under.

Rows, 12 frames to a line, frame f at 7.5 * f degrees clockwise:
  spin  48 frames, sharp. Frame 4k rests a sign under the window: `rest` in the json names which.
  blur  48 frames at the same angles, each smeared over 22.5 degrees, for the fast part of a spin (stepping sharp
        frames faster than half a cell a tick reads as the wheel going backwards).
The anchor (ax, ay) is the wheel's centre on the floor: lay it on iso.center of the middle square.
"""
import json, math, os, sys
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixelate as PX

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'dev', 'visions', 'wheel.webp')
ART = os.path.join(ROOT, 'deep16', 'art')

# his wheel in the source's pixels: the centre, the radii of each ring (measured off a profile, 10-07), the sign order
CX, CY = 350.0, 346.0
R_OUT = 316.0                     # the outer rim's edge
R_DISC = 142                      # the black hub
R_HUBLINE = 146                   # the thin red ring round the hub
R_SEG = (152, 251)                # the red cells
R_TICK = (216, 246)               # the black tick in each red cell
R_HAIR = 252                      # the black hairline between the cells and the double line
R_BAND = (264, 300)               # the black band the signs sit in
R_BANDLINE = 303                  # the red line outside the band
R_RIM = 311                       # the red rim, out to R_OUT
PATCH = (-22, 21, -299, -263)     # his navy patch behind Pisces: x0, x1, y0, y1 from the centre (lifted off the art)
WINDOW = (-30, 29, -299, -263)    # the highlight's window: his patch, widened to hold the widest sign (Virgo, Scorpio)
SIGNS = ['pisces', 'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius']  # clockwise from 12

STEP, FRAMES, COLS, BLUR_ARC, BLUR_N = 7.5, 48, 12, 22.5, 9
SIDE = 2                          # the board's edge, seen on the near side (px)
SS = 4                            # samples a pixel, each way, for what comes from his art

PAL = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps']
def C(ramp, i): h = PAL[ramp][i]; return np.array([int(h[k:k + 2], 16) for k in (1, 3, 5)], np.float32)
BLACK, OUTLINE = C('silver', 0), C('outline', 0)
RED, RED_DK, RED_SIDE = C('red', 3), C('red', 2), C('red', 1)
SIGN, SHADOW, NAVY = C('bone', 0), C('silver', 2), C('blue', 1)
SUBSET = np.stack([C('outline', 0)] + [C('silver', i) for i in range(7)] + [C('bone', i) for i in range(3)] + [C('red', i) for i in range(5)] + [C('blue', i) for i in range(4)])
SUBSET_LAB = PX.to_lab(SUBSET / 255.0)


def snap(rgb):
    d = ((PX.to_lab(rgb / 255.0)[..., None, :] - SUBSET_LAB[None, None]) ** 2).sum(-1)
    return SUBSET[d.argmin(-1)]


def layers():
    """his art -> three planes in the source's pixels: the signs' grey, their shadow, the red cells' red."""
    a = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    dx, dy = xx - CX, yy - CY
    rr = np.hypot(dx, dy)
    # the navy patch off Pisces: navy to the band's black, the sign's antialiased edge back to grey by its red
    x0, x1, y0, y1 = PATCH
    nv = (a[..., 2] > a[..., 0] + 12) & (dx >= x0 - 2) & (dx <= x1 + 2) & (dy >= y0 - 2) & (dy <= y1 + 2)
    t = np.clip((a[..., 0] - 25) / (200 - 25), 0, 1)
    a[nv] = (21 + t[..., None] * (205 - 21))[nv]
    mn, mx = a.min(-1), a.max(-1)
    band = (rr > R_BAND[0] - 2) & (rr < R_BAND[1] + 2) & (mx - mn < 40)
    sign = np.where(band, np.clip((mn - 110) / (170 - 110), 0, 1), 0)
    shadow = np.where(band, np.clip((mn - 35) / (60 - 35), 0, 1), 0) * (1 - np.clip((mn - 100) / 20, 0, 1))
    red = np.where((rr > R_SEG[0]) & (rr < R_SEG[1]) & (a[..., 0] > 100) & (a[..., 1] < 90), a[..., 0], 236)
    return sign, shadow, red


def edge(f, v, inside):
    """the pixels on the line where field f crosses v: f >= v here and < v at a 4-neighbour (one pixel wide, 8-connected)."""
    up = f >= v
    nb = np.zeros_like(up)
    for sh in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        g = np.roll(f, sh, (0, 1)) < v
        nb |= g
    return up & nb & inside


def wrap_edge(g, inside):
    """a zero crossing of an angle offset g in (-15, 15]: not the jump at the far side."""
    up = g >= 0
    nb = np.zeros_like(up)
    for sh in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        h = np.roll(g, sh, (0, 1))
        nb |= (h < 0) & (np.abs(h - g) < 10)
    return up & nb & inside


class Wheel:
    def __init__(self, n):
        self.n = n
        self.A = 32 * math.sqrt(2) * n / 2          # the ellipse's half width, px
        self.B = self.A / 2
        self.W = 2 * math.ceil(self.A) + 4
        self.H = 2 * math.ceil(self.B) + 4 + SIDE
        self.cx, self.cy = self.W // 2, math.ceil(self.B) + 2
        py, px = np.mgrid[0:self.H, 0:self.W].astype(np.float32)
        self.u = (px + 0.5 - self.cx) * R_OUT / self.A    # pixel centres on the wheel's plane, in the source's pixels
        self.v = (py + 0.5 - self.cy) * R_OUT / self.B
        self.r = np.hypot(self.u, self.v)
        self.phi = np.degrees(np.arctan2(self.u, -self.v)) % 360   # 0 at 12 o'clock, clockwise on the screen
        o = (np.arange(SS) + 0.5) / SS - 0.5
        self.su = (px[..., None, None] + 0.5 + o[None, None, None, :] - self.cx) * R_OUT / self.A
        self.sv = (py[..., None, None] + 0.5 + o[None, None, :, None] - self.cy) * R_OUT / self.B
        self.sign, self.shadow, self.red = layers()
        # the board: its face, its near edge, the outline round both
        self.face = self.r <= R_OUT
        rim = edge(-self.r, -R_OUT, self.face)                                  # the face's own last pixel
        self.rim = rim | (self.face & (self.r >= R_RIM))
        side = np.zeros_like(self.face)
        for t in range(1, SIDE + 1):
            side |= np.roll(self.face, t, 0)
        self.side = side & ~self.face
        body = self.face | self.side
        nb = np.zeros_like(body)
        for sh in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nb |= np.roll(body, sh, (0, 1))
        self.outline = nb & ~body
        x0, x1, y0, y1 = WINDOW
        self.window = (self.u >= x0) & (self.u <= x1) & (self.v >= y0) & (self.v <= y1)

    def sample(self, plane, theta):
        """plane (source pixels) averaged over each pixel's samples, the wheel turned theta degrees clockwise."""
        t = math.radians(-theta)
        x = CX + self.su * math.cos(t) - self.sv * math.sin(t)
        y = CY + self.su * math.sin(t) + self.sv * math.cos(t)
        return map_coordinates(plane, [y.ravel(), x.ravel()], order=1, mode='nearest').reshape(x.shape).mean((-1, -2))

    def render(self, theta):
        """one frame, the wheel turned theta degrees clockwise: RGB (palette colours) and the alpha."""
        r, psi = self.r, (self.phi - theta) % 360
        img = np.zeros((self.H, self.W, 3), np.float32)
        img[...] = BLACK
        seg = (r >= R_SEG[0]) & (r < R_SEG[1])
        redv = self.sample(self.red, theta)
        img[seg] = np.where((redv < 205)[..., None], RED_DK, RED)[seg]
        img[(r >= R_HAIR) & (r < R_BAND[0])] = RED                               # the double line, as one red
        img[edge(r, R_HAIR, r < R_BAND[0])] = BLACK                              # its black hairline inside
        img[edge(r, R_HUBLINE, r < R_SEG[0])] = RED                              # the ring round the hub
        g = (psi % 30) - 15                                                      # 0 on the dividers
        k = ((psi + 15) % 30) - 15                                               # 0 on the cells' middles
        img[wrap_edge(g, seg)] = BLACK                                           # the red cells' dividers
        # the ticks two pixels wide: within a pixel of the cell's middle, measured on the screen
        ph = np.radians(self.phi)
        tang = np.hypot(np.cos(ph) * self.A / R_OUT, np.sin(ph) * self.B / R_OUT)
        tick = (r >= R_TICK[0]) & (r < R_TICK[1]) & (np.abs(r * np.sin(np.radians(k))) * tang < 0.9)
        img[tick] = BLACK
        band = (r >= R_BAND[0]) & (r < R_BAND[1])
        img[band & self.window] = NAVY                                           # the highlight stays put
        sh, sg = self.sample(self.shadow, theta), self.sample(self.sign, theta)
        img[band & (sh > 0.45)] = SHADOW
        img[band & (sg > 0.27)] = SIGN
        img[wrap_edge(g, band | ((r >= R_HAIR) & (r < R_BAND[0])) | ((r >= R_BAND[1]) & (r < R_RIM)))] = RED   # the band's dividers
        img[edge(r, R_BANDLINE, (r >= R_BAND[1]) & (r < R_RIM))] = RED
        img[self.rim] = RED
        img[self.side] = RED_SIDE
        img[self.outline] = OUTLINE
        alpha = (self.face | self.side | self.outline)
        return img, alpha

    def frame(self, theta, blur=False):
        if not blur:
            img, al = self.render(theta)
        else:
            acc = None
            for i in range(BLUR_N):
                im, al = self.render(theta - BLUR_ARC / 2 + BLUR_ARC * i / (BLUR_N - 1))
                acc = im if acc is None else acc + im
            img = snap(acc / BLUR_N)
        out = np.zeros((self.H, self.W, 4), np.uint8)
        out[..., :3] = img.astype(np.uint8)
        out[..., 3] = np.where(al, 255, 0)
        return out


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    name = 'zodiacwheel_p1' if n == 5 else 'zodiacwheel%d_p1' % n
    w = Wheel(n)
    rows = FRAMES // COLS
    sheet = np.zeros((w.H * rows * 2, w.W * COLS, 4), np.uint8)
    for b, blur in enumerate((False, True)):
        for f in range(FRAMES):
            y, x = (b * rows + f // COLS) * w.H, (f % COLS) * w.W
            sheet[y:y + w.H, x:x + w.W] = w.frame(f * STEP, blur)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, name + '.png'), optimize=True)
    meta = {
        '_note': 'his zodiac wheel flat on the floor (tools/wheel-sheet.py): frame f is the wheel turned 7.5*f degrees clockwise; '
                 'frame 4k rests rest[k] under the highlight; blur is the same angles smeared, for a fast spin; (ax, ay) the centre on the floor',
        'image': 'art/' + name + '.png', 'squares': n, 'fw': w.W, 'fh': w.H, 'ax': w.cx, 'ay': w.cy, 'cols': COLS,
        'degPerFrame': STEP, 'framesPerSign': int(30 / STEP),
        'anims': {'spin': {'row': 0, 'frames': FRAMES}, 'blur': {'row': rows, 'frames': FRAMES}},
        'signs': SIGNS,
        'rest': [SIGNS[(-k) % 12] for k in range(12)],
    }
    json.dump(meta, open(os.path.join(ART, name + '.json'), 'w', encoding='utf-8'), indent=1)
    print(name, '%dx%d a frame, sheet %dx%d' % (w.W, w.H, sheet.shape[1], sheet.shape[0]))


if __name__ == '__main__':
    main()

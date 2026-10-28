"""DEEP16: Silverton's keepers standing on the town floor -- the art desk's south idles (HEAD 2 PAGE 1 of ART-78 to ART-86, 10-21) cut into grid sheets.
10-21, Griz, to the lanes desk: "Got south idles for several existing shopkeeps in Fresh".

    python tools/keeper-town-sheet.py            (every keeper: deep16/art/<name>_p1.png/.json)
    python tools/keeper-town-sheet.py winters    (one)
    python tools/keeper-town-sheet.py check      (also dev/visions/keepers-town.png: each keeper's four frames beside Barley and Aurdin's S idle, 4x)

Each page is one band of four full-body drawings facing south (relaxed, a breath, a blink, the return), printed numbers and a title round them. A
drawing is found as tools/portrait-sheet.py finds one (the navy keyed, the printed words dropped first, a drawing its biggest piece and those beside it);
each page is scaled by its drawings' median height, sole to crown, to TALL px -- the heroes' (STANDS in tools/sheetrows.py: about 50 with the outline)
-- then boxed down, snapped to deep16/palette.json and outlined (tools/pixelate.py); each frame stands on its feet's middle at the bottom row (`ay`).

The sheet: the idle row in the S facing only (`drawn: [0]`); every other facing falls back on `under`, the stand-in the keeper wore before (the
desk's word: "their other facings keep the stand-in until more art comes"), and js/counter.js C.dress keeps the keeper facing south. The four drawings
are laid as a held loop (SEQ: the relaxed and the breath three times, then the blink and the return) at FPS.

ART-121 (10-28, Griz to the art desk: "we're going to need SE, E, NE and N for all the vendor portraits we made the south-standings for"): where a keeper's
folder holds HEAD 2 PAGE 2 to 5 (SE, E, NE, N, Idle 4 each) beside the south page, all five pages are cut the same way, each by its own drawings' median
to TALL, SW, W and NW the mirrors of SE, E and NE (RULED 10-14), and the sheet is all eight facings in one cell with no `drawn` or `under`: js/counter.js
C.dress then lets the keeper turn to whoever speaks to them. A keeper with only some of the four stays south only till the rest come.
"""
import os, sys, json
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
PS = _load('portraitsheet', os.path.join(ROOT, 'tools', 'portrait-sheet.py'))
SRC = pix.SRC
ART = os.path.join(ROOT, 'deep16', 'art')

TALL = 50                         # sole to crown as drawn, the outline's rows in it after the cut (the heroes stand 47 to 54 -- tools/sheetrows.py STANDS; the art desk's "roughly 50 NATIVE pixels")
SEQ = [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 2, 3]   # (the drawn four: 1 relaxed, 2 a breath, 3 the blink, 4 the return -- the art desk's notes)
FPS = 4
UNDER = 'crewman_p1'              # the stand-in the keepers wore (js/town.js T.KIND: a keeper's look, else the crewman)
VIEWS = {2: 7, 3: 6, 4: 5, 5: 4}  # ART-121's pages -> the sheet's facings (S SW W NW N NE E SE): HEAD 2 PAGE 2 SE, 3 E, 4 NE, 5 N
MIRROR = {1: 7, 2: 6, 3: 5}       # SW, W, NW: SE, E, NE mirrored (RULED 10-14; an asymmetry flips there -- Winters' white temple)
# name: (pages' folder, ART id, the keeper's door in deep16/js/town.js)
KEEPERS = {
    'winters': ('winters/ART-78', 'ART-78', 'warp:winters'),
    'casper': ('casper/ART-79', 'ART-79', 'keeper:casper'),
    'androit': ('androit/ART-80', 'ART-80', 'keeper:androit'),
    'hessle': ('hessle/ART-81', 'ART-81', 'keeper:hessle'),
    'aldric': ('aldric/ART-82', 'ART-82', 'keeper:aldric'),
    'kessler': ('kessler/ART-83', 'ART-83', 'shop:kessler'),
    'calla': ('calla/ART-84', 'ART-84', 'shop:calla'),
    'barber': ('barber/ART-85', 'ART-85', 'keeper:barber'),
    'marin': ('marin/ART-86', 'ART-86', 'keeper:marin'),
    'kasten': ('kasten/ART-88', 'ART-88', 'shop:kasten'),             # (10-21, Griz: "Lucia and 88 should be in there now")
    'lucia': ('lucia/ART-110', 'ART-110', 'shop:lucia'),
    'cassia': ('cassia/ART-89', 'ART-89', 'inn:cassia'),             # (the last six of art-wanted section 20, 10-21 evening: "we have shopkeep NPCs in Fresh")
    'lisbet': ('lisbet/ART-92', 'ART-92', 'shop:lisbet'),
    'marko': ('marko/ART-94', 'ART-94', 'shop:marko'),
    'vilar': ('vilar/ART-97', 'ART-97', 'shop:vilar'),
    'percy': ('percy/ART-102', 'ART-102', 'warp:percy'),
    'ned': ('ned/ART-103', 'ART-103', 'warp:percy'),                 # (beside Percy behind his counter)
    # (10-21 night, Griz: "I got sylvia's - let's put it together as best we can and push it to live": her owl on her shoulder, below her crown. Her warm skin
    # snapped to the fire ramp and the lightest red, an orange face: left out of her snap, the face goes lighter; her magenta shawl stays the palette's red, as on her portrait)
    'sylvia': ('sylvia/ART-SYLVIA', 'ART-SPECIAL-SYLVIA', 'keeper:sylvia', {'avoid': ['fire', '#e8624a']}),
    'mela': ('mela/ART-90', 'ART-90', 'keeper:mela'),                # (10-21 night, Griz: "got 3 more south idles in Fresh too": beside their doors, and Merrick in his room)
    'mical': ('mical/ART-91', 'ART-91', 'keeper:mical'),
    'merrick': ('merrick/ART-93', 'ART-93', 'keeper:merrick'),
    # (10-22, the NPC cutter seat, Griz: "more NPC art is in" and "one cutter for all 3": Brennan and Venn Hale beside their doors; Korvin for the Hex seat to place,
    # his waistcoat dyed slate grey as on his portrait -- tools/portrait-sheet.py PEOPLE `recolour`, his "Go for recolor without reroll")
    'brennan': ('brennan/ART-87', 'ART-87', 'keeper:brennan'),
    'venhale': ('venhale/ART-96', 'ART-96', 'keeper:venhale', {'avoid': ['red', 'fire']}),   # (her nose and forearms' flush snapped to the reds, a dot of paint at this size: left out, they go to skin)
    'korvin': ('korvin/ART-95', 'ART-95', 'hex:korvinSlate', {'recolour': {'hue': 215, 'sat': 0.22}}),
    'davos': ('davos/ART-98', 'ART-98', 'leech:davos'),             # (10-22: Davos Kren behind the leech-house's counter)
    'marta': ('marta/ART-99', 'ART-99', 'npc:marta'),               # (10-22, "more NPC in fresh": Marta at her stalls, Madame Ondine Vess for a door to come; Tam Vere HELD, tools/portrait-sheet.py)
    'ondine': ('ondine/ART-101', 'ART-101', 'the School (no door yet)'),
    'tam': ('tam/ART-100', 'ART-100', 'keeper:tam', {'avoid': ['red', 'fire']}),   # (10-28: Tam Vere in her den, the art desk's re-roll -- a woman, as the realm and the first game
    # have her; her rust apron's reds read as blood stains at 50 px: left out, as Venn Hale's flush was)
    'aldwin': ('aldwin/ART-114', 'ART-114', 'chapel:aldwin'),
    # (10-28: the night crews' five -- Gull, Kael, Brennock, Vera on the shaft rows' street, Kess beside the flop-cellar's door: tools/portrait-sheet.py)
    'gull': ('gull/ART-104', 'ART-104', 'talk:gull'),
    'kael': ('kael/ART-105', 'ART-105', 'talk:kael'),
    'brennock': ('brennock/ART-106', 'ART-106', 'talk:brennock'),
    'vera': ('vera/ART-107', 'ART-107', 'talk:vera'),
    'kess': ('kess/ART-108', 'ART-108', 'keeper:kess'),       # (10-28, the second cutter seat: Aldwin of the mission chapel, not Androit the notary -- tools/portrait-sheet.py)
}


def page(name, path, ov):
    """one page's four drawings, each scaled by the page's median to TALL and snapped: [(pixels, the feet's middle x, height)]"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
    found = PS.drawings(a, [4])
    if len(found) != 4:
        raise SystemExit('%s: %d drawings found, 4 wanted' % (name, len(found)))
    raw = []
    for piece, box in found:
        ys, xs = np.where(piece)
        top, foot = ys.min(), ys.max() + 1
        low = piece[foot - max(3, (foot - top) // 12):foot]
        fx = np.where(low)[1].mean()                                  # (the feet's middle: the figure stands there)
        x0, x1 = xs.min(), xs.max() + 1
        rgba = np.zeros((foot - top, x1 - x0, 4), np.uint8)
        rgba[..., :3] = a[top:foot, x0:x1]; rgba[..., 3] = piece[top:foot, x0:x1] * 255
        if ov.get('recolour'):
            rgba[..., :3] = PS.recolour(rgba[..., :3], PS.hem_cut(rgba[..., :3], PS.cloth_mask(rgba[..., :3], piece[top:foot, x0:x1])), **ov['recolour'])  # (the trousers below the hem keep their brown)
        raw.append((rgba, fx - x0, foot - top))
    k = TALL / float(np.median([r[2] for r in raw]))
    small = []
    for rgba, fx, h in raw:
        im = Image.fromarray(rgba, 'RGBA').convert('RGBa')
        w2, h2 = max(1, round(rgba.shape[1] * k)), max(1, round(rgba.shape[0] * k))
        im = im.resize((w2, h2), Image.BOX).convert('RGBA')
        px = pix.pixelate(im, 1, do_lift=False, avoid=ov.get('avoid'))  # (the outline adds a pixel all round)
        small.append((px, fx * k + 1, px.shape[0]))
    return small


def cut(name):
    folder, art, door = KEEPERS[name][:3]; ov = KEEPERS[name][3] if len(KEEPERS[name]) > 3 else {}   # (ov: `avoid`, ramps the snap leaves out -- tools/pixelate.py snap; `recolour`, a cloth dyed -- tools/portrait-sheet.py)
    path = os.path.join(SRC, folder, '%s_HEAD-2_PAGE-1.png' % art)
    faces = {0: page(name, path, ov)}
    more = {f: os.path.join(SRC, folder, '%s_HEAD-2_PAGE-%d.png' % (art, p)) for p, f in VIEWS.items()}
    have = [f for f, q in more.items() if os.path.exists(q)]
    if len(have) == len(VIEWS):                                       # (ART-121 in hand: all eight)
        for f in have:
            faces[f] = page(name, more[f], ov)
        for f, g in MIRROR.items():
            faces[f] = [(px[:, ::-1].copy(), px.shape[1] - fx, h) for px, fx, h in faces[g]]
    elif have:
        print('  %s: %d of ART-121\'s four other facings in hand -- south only till the rest come' % (name, len(have)))
    allf = [x for fs in faces.values() for x in fs]
    L = max(f[1] for f in allf) + 2; R = max(f[0].shape[1] - f[1] for f in allf) + 2; T = max(f[2] for f in allf) + 2
    fw, fh, ax, ay = int(np.ceil(L + R)), int(np.ceil(T)) + 1, int(round(L)), int(np.ceil(T)) - 1
    rows = {}
    for f, small in faces.items():
        rows[f] = []
        for px, fx, h in small:
            cell = np.zeros((fh, fw, 4), np.uint8)
            ox, oy = int(round(ax - fx)), ay + 1 - px.shape[0]
            cell[oy:oy + px.shape[0], ox:ox + px.shape[1]] = px
            rows[f].append(cell)
    frames = rows[0]
    sheet = np.concatenate([np.concatenate([rows[f][i] for i in SEQ], axis=1) for f in sorted(rows)], axis=0)
    os.makedirs(ART, exist_ok=True)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, name + '_p1.png'), optimize=True)
    tops = [np.where(f[..., 3].any(axis=1))[0][0] for f in frames]
    idle = {'y': 0, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'frames': len(SEQ), 'fps': FPS}
    if len(rows) == 1:
        idle.update(drawn=[0], under=UNDER)
    meta = {'image': 'art/%s_p1.png' % name, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'top': int(ay - min(tops)),
            'anims': {'idle': idle},
            'source': 'deep16/_src/%s/%s_HEAD-2_PAGE-1.png (the art desk\'s south idle, 10-21)%s, cut by tools/keeper-town-sheet.py' % (folder, art,
                ' and PAGE-2 to PAGE-5 (SE, E, NE, N: ART-121, 10-28)' if len(rows) > 1 else ''), 'door': door}
    if ov.get('recolour'):
        meta['recolour'] = ov['recolour']                       # (the dye put on at the cut, for the record: Korvin's)
    json.dump(meta, open(os.path.join(ART, name + '_p1.json'), 'w'), indent=1)
    wide = max(int(np.ptp(np.where(f[..., 3].any(axis=0))[0])) + 1 for f in frames)
    if len(rows) == 1:
        print('  %s_p1: %dx%d a frame, stands %d above the foot (%d tall with the outline), %d wide; idle %d frames from 4 drawn, S only, under %s' % (name, fw, fh, meta['top'], meta['top'] + 1, wide, len(SEQ), UNDER))
    else:
        print('  %s_p1: %dx%d a frame, all eight facings (S SE E NE N drawn, SW W NW mirrored); idle %d frames from 4 drawn; tall S %d, SE %d, E %d, NE %d, N %d' % (name, fw, fh, len(SEQ),
              *[ay + 1 - np.where(rows[f][0][..., 3].any(axis=1))[0][0] for f in (0, 7, 6, 5, 4)]))
    return frames, meta


if __name__ == '__main__':
    args = [x for x in sys.argv[1:] if x != 'check']
    outs = [(nm,) + cut(nm) for nm in (args or list(KEEPERS))]
    if 'check' in sys.argv[1:]:
        refs = []
        for n in ('barley_p2', 'aurdin_p2'):
            m = json.load(open(os.path.join(ART, n + '.json'))); an = m['anims']['idle']
            im = np.asarray(Image.open(os.path.join(ART, n + '.png')).convert('RGBA'))
            refs.append((im[an['y']:an['y'] + an['fh'], 0:an['fw']], an['ay']))
        cells = refs + [(f[0], m['ay']) for nm, f, m in outs] + [(f[2], m['ay']) for nm, f, m in outs]
        base = max(c[1] for c in cells) + 4; W = sum(c[0].shape[1] for c in cells) + 4 * len(cells); low = max(c[0].shape[0] - c[1] for c in cells) + 4
        cv = np.zeros((base + low, W, 3), np.uint8); cv[...] = (14, 22, 52); cv[base, :] = (90, 70, 50); x = 2
        for c, ay in cells:
            y = base - ay; al = c[..., 3:4] / 255.0; sl = cv[y:y + c.shape[0], x:x + c.shape[1]]
            sl[...] = (c[..., :3] * al + sl * (1 - al)).astype(np.uint8); x += c.shape[1] + 4
        d = os.path.join(ROOT, 'dev', 'visions'); os.makedirs(d, exist_ok=True)
        Image.fromarray(cv).resize((W * 4, (base + low) * 4), Image.NEAREST).save(os.path.join(d, 'keepers-town.png'))
        print('  dev/visions/keepers-town.png')

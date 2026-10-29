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
    'kasten': ('kasten/ART-88', 'ART-88', 'shop:kasten', {'avoid': {2: ['red', 'fire'], 3: ['red', 'fire'], 4: ['red', 'fire', 'silver', 'violet'], 5: ['red', 'fire', 'silver', 'violet']}}),   # (10-21, Griz: "Lucia and 88 should be in there now")
    # (10-28, ART-121-088, the fourth cutter seat: his ruddy cheeks snapped to red blotches in SE and E, and his back's charcoal tunic (NE, N: a cool grey, where the
    # south's snaps warm) to the silver ramp's blues, a navy back on a black-sleeved man; left out there, the cheeks go to skin and the tunic to the south's dark stone)
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
    'mela': ('mela/ART-90', 'ART-90', 'keeper:mela', {'avoid': {p: ['red', 'fire'] for p in (2, 3, 4, 5)}, 'sat': {2: (0.5, 1.0, 0.74)}}),   # (10-21 night, Griz: "got 3 more south idles in Fresh too": beside their doors, and Merrick in his room)
    # (10-28, ART-121-090, the fourth cutter seat: her SE draws the skirt warmer than her south (saturation 0.53 against 0.39), and the snap took it for skin, a salmon skirt
    # with red shoes; its lower half toned to the south's saturation there (`sat`), and on all four new pages the reds left out -- a dark red in the skirt's folds, a pink cheek)
    'mical': ('mical/ART-91', 'ART-91', 'keeper:mical'),
    'merrick': ('merrick/ART-93', 'ART-93', 'keeper:merrick'),
    # (10-22, the NPC cutter seat, Griz: "more NPC art is in" and "one cutter for all 3": Brennan and Venn Hale beside their doors; Korvin for the Hex seat to place,
    # his waistcoat dyed slate grey as on his portrait -- tools/portrait-sheet.py PEOPLE `recolour`, his "Go for recolor without reroll")
    'brennan': ('brennan/ART-87', 'ART-87', 'keeper:brennan', {'avoid': {p: ['red', 'fire'] for p in (2, 3, 4, 5)}}),
    # (10-28, ART-121-087, the fourth cutter seat: on his four new pages the snap took his arm scars' pink and the apron's rust stains for the reds -- the lightest red
    # a blotch down the far arm in SE, blood-dark spots on the apron; his south has none of the red ramp: left out there, they go to his skin and leather)
    'venhale': ('venhale/ART-96', 'ART-96', 'keeper:venhale', {'avoid': ['red', 'fire']}),   # (her nose and forearms' flush snapped to the reds, a dot of paint at this size: left out, they go to skin)
    # (10-28, ART-121-095: the art desk drew his four new views in the slate already, so the brown cloth's dye is his south page's alone -- on the others it found only
    # the trousers' top and left a blue sliver at the hem; his E draws it a charcoal the snap took for brown, so there the grey cloth between collar and hem is dyed)
    'korvin': ('korvin/ART-95', 'ART-95', 'hex:korvinSlate', {'recolour': {'hue': 215, 'sat': 0.22}, 'dye': {1: 'brown', 3: (0.2, 0.62)}}),
    'davos': ('davos/ART-98', 'ART-98', 'leech:davos'),             # (10-22: Davos Kren behind the leech-house's counter)
    'marta': ('marta/ART-99', 'ART-99', 'npc:marta', {'avoid': {p: ['fire', '#e8624a'] for p in (2, 3, 4, 5)}}),   # (10-22, "more NPC in fresh": Marta at her stalls, Madame Ondine Vess for a door to come; Tam Vere HELD, tools/portrait-sheet.py)
    # (10-28, ART-121-099: on her four new pages the snap took her headscarf's ochre for the fire ramp and her cheek scar for the lightest red, a pink blotch at
    # 50 px; left out there, the scarf is her south's gold and the scar a red dot -- her south page snapped as it always was)
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
    # Falstaff of the factor house, pin 7a (10-29, the cutter seat of 10-29: the art desk's ART-123-FALSTAFF, his figure H2P1 S, P2 SE, P3 E and the eleventh page
    # P5 N, its "Falstaff Idle Backview" download). Its P4, sold as NE, is drawn from the front, a second SE: sorted to not-NE/, so he is south only till an NE
    # from behind comes -- then this line cuts all eight as it is. His door has no room (js/town.js T.ROOMS): his sheet for the shows, no square in town yet
    'falstaff': ('falstaff/ART-123-FALSTAFF', 'ART-123-FALSTAFF', 'keeper:falstaff'),
    # Papa Urtusk (10-29, the cutscene cutter seat: the art desk's ART-123-URTUSK, all five views drawn, H2P4 NE from behind). "Still the largest thing in any room"
    # (art-wanted section 26) and the art desk's own "do not equal-height-normalize him with ordinary adults": he stands `tall` 58, the height of the grid's bugbear
    # and of Talmok, where the town's grown men stand 50. In the Hex's front door, at the council's long table, and on the night's picture of it (js/hours.js)
    'papa': ('papa/ART-123-URTUSK', 'ART-123-URTUSK', 'npc:papa', {'views': 'ART-123-URTUSK, 10-29', 'tall': 58, 'gap': 6, 'reskin': {'hue': 78, 'sat': 0.36}, 'avoid': ['skin', 'red', 'gold']}),
    # Warda (10-29, the cutscene cutter seat: the art desk's ART-123-WARDA, all five views drawn): in the lounge at the Hex's third floor, behind the council's table
    'warda': ('warda/ART-123-WARDA', 'ART-123-WARDA', 'hex:warda', {'views': 'ART-123-WARDA, 10-29', 'avoid': ['gold', 'fire']}),   # (her olive face snapped to the gold ramp, yellow at 50 px: left out, it keeps to skin and stone)
    # Ottak Harrow (10-29, the cutscene cutter seat: the art desk's ART-123-HARROW, all five views drawn): at the council's long table (js/hours.js H16.TABLE)
    'harrow': ('harrow/ART-123-HARROW', 'ART-123-HARROW', 'council:harrow', {'views': 'ART-123-HARROW, 10-29', 'reskin': {'hue': 78, 'sat': 0.36, 'hues': (33, 60), 'vmax': 0.75, 'smin': 0.3}, 'avoid': ['red']}),
    # Skarn the Warrener (10-29, the Skarn cutter seat: the art desk's ART-123-SKARN, all five views drawn): at the Crawler Warrens' mouth camp, his spear planted
    # beside him. A big half-orc, a bought gladiator: `tall` 54, the top of the keepers' band and under Papa's 58; measured to his own crown and stood on his own feet
    # (`prop`: the shaft opened out 34 px wide -- it is about 20 on the pages, the boots 80); his skin to the orc ramp as on his portrait, the key's gold left gold
    'skarn': ('skarn/ART-123-SKARN', 'ART-123-SKARN', 'npc:skarn', {'views': 'ART-123-SKARN, 10-29', 'tall': 54, 'prop': 34, 'reskin': {'hue': 78, 'sat': 0.36, 'keep': PS.SKARN_GOLD}, 'avoid': ['skin', 'red']}),
    # Edric Pellam (10-29, the Edric and Dace cutter seat: the art desk's ART-123-EDRIC, all five views drawn, NE and N from behind): at the Warrens' mouth camp, the
    # tally-house, where the first game stands him (content/maps/warrens_a.json)
    'edric': ('edric/ART-123-EDRIC', 'ART-123-EDRIC', 'npc:edric', {'views': 'ART-123-EDRIC, 10-29', 'avoid': {p: ['red', 'fire'] + (['gold'] if p == 3 else []) for p in (1, 2, 3, 4, 5)}}),
    # (his ruddy nose and cheeks a red blob, his profile's face an orange patch at 50 px: left out, as on his portrait, they go to skin -- and on the profile (E) the
    # bald crown's highlight snapped gold, a yellow cap: left out there alone)
    # Corwen Dace (10-29, the same seat: the art desk's ART-123-DACE, all five views drawn, NE and N from behind): in the Galleries' mouth where the first game stands
    # him (content/maps/galleries_g1.json `dace`); in a fight, as the party's guest, he keeps the class floor's wizard (js/save.js SV.LOOK) -- these are an idle's only
    'dace': ('dace/ART-123-DACE', 'ART-123-DACE', 'npc:dace', {'views': 'ART-123-DACE, 10-29', 'avoid': ['red', 'fire']}),   # (his satchel's red-brown leather flecked the reds, blood spots at 50 px: left out, it keeps to leather)
    # Dace in the cloak of displacement (10-29, the same seat: the art desk's ART-123-DACE-DISPLACEMENT, a second look beside the plain one, all five views): the ghost's
    # glow joins the S and SE frames -- `ghost` splits them at the real bodies, and his height, his feet and his crown are the real body's, the afterimage beside him kept
    'dacedisp': ('dace/ART-123-DACE-DISPLACEMENT', 'ART-123-DACE-DISPLACEMENT', 'npc:dace (the cloak worn as the magic item)', {'views': 'ART-123-DACE-DISPLACEMENT, 10-29', 'avoid': ['red', 'fire'], 'ghost': {'hues': (205, 285), 'smin': 0.3}}),
}


def grey_cloth(rgb, fig, band):
    """a grey cloth worn over a pale shirt (Korvin's charcoal waistcoat on his E page): the figure's greys, neither near-black ink nor the pale shirt, between
    `band`'s fractions of its height -- the collar and the hem"""
    h, s, v = PS.hsv(rgb)
    m = fig & (s < 0.3) & (v > 0.1) & (v < 0.5)
    H = m.shape[0]; m[:int(H * band[0])] = False; m[int(H * band[1]):] = False
    return m


def sat_band(rgb, fig, band, k):
    """a page's cloth drawn more saturated than the south (Mela's SE skirt): the figure between `band`'s fractions of its height, its saturation times `k` --
    each channel drawn toward the brightest, so the hue and the value stay"""
    m = fig.copy(); H = m.shape[0]; m[:int(H * band[0])] = False; m[int(H * band[1]):] = False
    out = rgb.astype(float); mx = out.max(-1, keepdims=True)
    out = np.where(m[..., None], mx - (mx - out) * k, out)
    return np.clip(np.round(out), 0, 255).astype(rgb.dtype)


def page(name, path, ov, pg=1):
    """one page's four drawings, each scaled by the page's median to TALL and snapped: [(pixels, the feet's middle x, height)]; `pg` the page (1 the south),
    for a keeper whose dye is a page's own (`dye`: {page: 'brown' for the brown cloth's mask, or (top, hem) for the grey cloth's}; without it every page dyed)"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
    found = PS.drawings(a, [4], gap=ov.get('gap', 12))              # (a keeper's own `gap`: Papa Urtusk's frames stand 12 px apart on his S page)
    gm = PS.ghost_mask(a, ov['ghost']) if ov.get('ghost') else None
    if gm is not None:                                                # (a ghost's glow joining the frames: split at the real bodies -- Dace's cloak of displacement)
        found = PS.split_ghosts(a, found, [4], gm)
    if len(found) != 4:
        raise SystemExit('%s: %d drawings found, 4 wanted' % (name, len(found)))
    raw = []
    for piece, box in found:
        if gm is not None:                                            # (the real body's feet are the frame's foot: a ghost's below them cut off, so he stands on his own)
            rf = np.where((piece & ~gm).any(axis=1))[0].max() + 1; piece = piece.copy(); piece[rf:] = False
        ys, xs = np.where(piece)
        top, foot = ys.min(), ys.max() + 1
        meas = piece & ~gm if gm is not None else piece               # (his height and his feet's middle by the real body, the ghost left out of the measure)
        mtop = np.where(meas.any(axis=1))[0].min()
        low = meas[foot - max(3, (foot - mtop) // 12):foot]
        fx = np.where(low)[1].mean()                                  # (the feet's middle: the figure stands there)
        x0, x1 = xs.min(), xs.max() + 1
        tall = foot - mtop
        if ov.get('prop'):                                            # (a prop planted beside the figure, its tip over the head -- Skarn's spear, ART-123-SKARN: the shaft
            body = ndimage.binary_opening(piece[top:foot, x0:x1], structure=np.ones((1, ov['prop'])))   # opened out `prop` px wide, the body the biggest piece left;
            lb, nb = ndimage.label(body); body = lb == 1 + int(np.argmax(ndimage.sum(body, lb, range(1, nb + 1))))   # the crown over the head's own columns and the
            by = np.where(body.any(axis=1))[0]                        # feet's middle by the body alone, so the spear neither sets his height nor moves his stand)
            if by[-1] + 1 < tall - 2:
                raise SystemExit('%s: the prop stands below the feet' % name)
            hc = np.where(body[by[0]:by[0] + max(4, (by[-1] - by[0]) // 25)].any(axis=0))[0]
            ctop = np.where(piece[top:foot, x0 + hc.min():x0 + hc.max() + 1].any(axis=1))[0][0]
            fx = x0 + np.where(body[by[-1] + 1 - max(3, (by[-1] + 1 - ctop) // 12):by[-1] + 1])[1].mean()
            tall = foot - top - ctop
        rgba = np.zeros((foot - top, x1 - x0, 4), np.uint8)
        rgba[..., :3] = a[top:foot, x0:x1]; rgba[..., 3] = piece[top:foot, x0:x1] * 255
        dye = ov.get('dye', {}).get(pg, 'brown' if 'dye' not in ov else None)
        if ov.get('recolour') and isinstance(dye, tuple):
            rgba[..., :3] = PS.recolour(rgba[..., :3], grey_cloth(rgba[..., :3], piece[top:foot, x0:x1], dye), **ov['recolour'])
        elif ov.get('recolour') and dye:
            rgba[..., :3] = PS.recolour(rgba[..., :3], PS.hem_cut(rgba[..., :3], PS.cloth_mask(rgba[..., :3], piece[top:foot, x0:x1])), **ov['recolour'])  # (the trousers below the hem keep their brown)
        if ov.get('reskin'):                                          # (an orc's khaki skin turned green: Papa Urtusk's -- tools/portrait-sheet.py reskin)
            rgba[..., :3] = PS.reskin(rgba[..., :3], piece[top:foot, x0:x1], **ov['reskin'])
        if ov.get('sat', {}).get(pg):                                 # (a page's own: {page: (top, bottom, k)} -- Mela's SE skirt)
            t0, t1, k0 = ov['sat'][pg]; rgba[..., :3] = sat_band(rgba[..., :3], piece[top:foot, x0:x1], (t0, t1), k0)
        raw.append((rgba, fx - x0, tall, (hc.min(), hc.max() + 1) if ov.get('prop') else None, mtop - top))
    k = ov.get('tall', TALL) / float(np.median([r[2] for r in raw]))   # (a keeper's own `tall`: Papa Urtusk's 58)
    small = []
    for rgba, fx, h, hcol, gtop in raw:
        im = Image.fromarray(rgba, 'RGBA').convert('RGBa')
        w2, h2 = max(1, round(rgba.shape[1] * k)), max(1, round(rgba.shape[0] * k))
        im = im.resize((w2, h2), Image.BOX).convert('RGBA')
        av = ov.get('avoid'); av = av.get(pg) if isinstance(av, dict) else av   # (a keeper's `avoid` can be a page's own: {page: ramps})
        px = pix.pixelate(im, 1, do_lift=False, avoid=av)  # (the outline adds a pixel all round)
        hh = px.shape[0] - int(round(gtop * k))                       # (gtop: a ghost standing over his crown -- his height to his own)
        if hcol:                                                      # (with a prop: his height to his own crown's outline, over his head's columns)
            hh -= np.where(px[:, int(hcol[0] * k) + 1:int(np.ceil(hcol[1] * k)) + 1, 3].any(axis=1))[0][0]
        small.append((px, fx * k + 1, hh))
    return small


def cut(name):
    folder, art, door = KEEPERS[name][:3]; ov = KEEPERS[name][3] if len(KEEPERS[name]) > 3 else {}   # (ov: `avoid`, ramps the snap leaves out -- tools/pixelate.py snap; `recolour`, a cloth dyed -- tools/portrait-sheet.py)
    path = os.path.join(SRC, folder, '%s_HEAD-2_PAGE-1.png' % art)
    faces = {0: page(name, path, ov)}
    more = {f: os.path.join(SRC, folder, '%s_HEAD-2_PAGE-%d.png' % (art, p)) for p, f in VIEWS.items()}
    have = [f for f, q in more.items() if os.path.exists(q)]
    if len(have) == len(VIEWS):                                       # (ART-121 in hand: all eight)
        for p, f in VIEWS.items():
            faces[f] = page(name, more[f], ov, p)
        for f, g in MIRROR.items():
            faces[f] = [(px[:, ::-1].copy(), px.shape[1] - fx, h) for px, fx, h in faces[g]]
    elif have:
        print('  %s: %d of ART-121\'s four other facings in hand -- south only till the rest come' % (name, len(have)))
    allf = [x for fs in faces.values() for x in fs]
    L = max(f[1] for f in allf) + 2; R = max(f[0].shape[1] - f[1] for f in allf) + 2; T = max(f[0].shape[0] for f in allf) + 2   # (the drawing's own height: with a prop, its tip)
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
    if ov.get('prop') or ov.get('ghost'):
        tops = [ay + 1 - h for px, fx, h in faces[0]]                 # (his crown, not the spear's tip: the town's marks over his head, the bench's height bound)
    idle ={'y': 0, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'frames': len(SEQ), 'fps': FPS}
    if len(rows) == 1:
        idle.update(drawn=[0], under=UNDER)
    meta = {'image': 'art/%s_p1.png' % name, 'fw': fw, 'fh': fh, 'ax': ax, 'ay': ay, 'top': int(ay - min(tops)),
            'anims': {'idle': idle},
            'source': 'deep16/_src/%s/%s_HEAD-2_PAGE-1.png (the art desk\'s south idle, 10-21)%s, cut by tools/keeper-town-sheet.py' % (folder, art,
                ' and PAGE-2 to PAGE-5 (SE, E, NE, N: %s)' % ov.get('views', 'ART-121, 10-28') if len(rows) > 1 else ''), 'door': door}
    if ov.get('recolour'):
        meta['recolour'] = ov['recolour']                       # (the dye put on at the cut, for the record: Korvin's)
    json.dump(meta, open(os.path.join(ART, name + '_p1.json'), 'w'), indent=1)
    wide = max(int(np.ptp(np.where(f[..., 3].any(axis=0))[0])) + 1 for f in frames)
    if len(rows) == 1:
        print('  %s_p1: %dx%d a frame, stands %d above the foot (%d tall with the outline), %d wide; idle %d frames from 4 drawn, S only, under %s' % (name, fw, fh, meta['top'], meta['top'] + 1, wide, len(SEQ), UNDER))
    else:
        print('  %s_p1: %dx%d a frame, all eight facings (S SE E NE N drawn, SW W NW mirrored); idle %d frames from 4 drawn; tall S %d, SE %d, E %d, NE %d, N %d' % (name, fw, fh, len(SEQ),
              *[ay + 1 - np.where(rows[f][0][..., 3].any(axis=1))[0][0] if not (ov.get('prop') or ov.get('ghost')) else faces[f][0][2] for f in (0, 7, 6, 5, 4)]))
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

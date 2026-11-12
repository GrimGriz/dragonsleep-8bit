"""DEEP16: the Silverton vendors' talking portraits -- the art desk's waist-up dialogue sheets cut for the counter screen (deep16/js/counter.js).
10-21, Griz to the lanes desk: "There's a handful of vendor art in Fresh, start a seat to get Winters set up for giving the starter mission and doing
sales"; of these sheets, 10-20: "Those are for the new silverton buy/sell etc. interfaces".

    python tools/portrait-sheet.py               (every person: deep16/art/pt_<name>.png/.json)
    python tools/portrait-sheet.py winters       (one)
    python tools/portrait-sheet.py check         (also dev/visions/portraits.png, every frame on its anchor, at 2x)

Each person is six source pages, one action a page (the art desk's ART-78 onward, its "Format and scope"): 1 Idle6 (two bands of three), 2-5 the four
dialogue stills -- attentive, welcoming, skeptical, concerned -- one drawing each, 6 Work6 (two bands of three). The pages are read from
deep16/_src/<name>/ART-NN/ (sorted out of Fresh 10-21, deep16/_src/art-desk/vendors-sort-2026-10-21.py).

How a drawing is cut: a pixel is figure when any channel is MASK_D from the page's navy (its median); the drawings are the page's biggest pieces (the
printed titles, numbers and labels are small and fall away); a ledge under the hands -- the counter some pages draw -- is cut off at its top, so every
frame stands on the same line, and the screen draws the counter itself. The art desk's open checks (ART-78-CUTTER-NOTES.md): the stills are drawn bigger
than the idle and the work, so each page is scaled by its own bust -- the head's top to the hands' line, the page's median -- to BUST px; each frame is
placed by its head's middle (x) and the hands' line (y), so a bow of the head stays a bow. Then boxed down (alpha-premultiplied), snapped to
deep16/palette.json and outlined (tools/pixelate.py).

The sheet: one row an action (idle, attentive, welcoming, skeptical, concerned, work), frames left to right, every frame the same box; `ax`, `ay` the
anchor in the box (the head's middle, the hands' line). Not the grid's figure sheets (eight facings): js/counter.js draws these itself.
"""
import os, sys, json, glob
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix = _load('pix', os.path.join(ROOT, 'tools', 'pixelate.py'))
SRC = pix.SRC                     # (_src is not in git: a worktree reads the main checkout's)
ART = os.path.join(ROOT, 'deep16', 'art')

BUST = 150                        # px from the head's top to the hands' line at game size (the screen is 480 x 270)
MASK_D = 22                       # how far from the navy a channel must be to be figure
HOLE_D, HOLE_MIN = 4, 1000        # a hole the counter closed: the page's navy to within HOLE_D, HOLE_MIN source px of it in one piece (Percy's work frame 1)
ACTIONS = ['idle', 'attentive', 'welcoming', 'skeptical', 'concerned', 'work']   # (the default six; a layout may name its own: Sylvia's)
FPS = {'idle': 3, 'work': 4, 'stretch': 4, 'coin': 4, 'sale': 4, 'bluespeak': 4, 'bucket': 5, 'speaking': 6, 'command': 4}   # (the idle a slow breath and blink; the work a deliberate unwrap; Vivian's coin and her candle sale a work's pace; the Blue speaking through Nerisse, its light pulsing as the mouth moves)
# a person's pages: (page, its bands' counts top to bottom, each drawing's action in reading order) -- the art desk's six-page plan by default
LAYOUT = [(1, [3, 3], ['idle'] * 6), (2, [1], ['attentive']), (3, [1], ['welcoming']), (4, [1], ['skeptical']), (5, [1], ['concerned']), (6, [3, 3], ['work'] * 6)]
# the generic man's and woman's fourteen (ART-122): their own clothes' idle, then a costume a page, each a still where the named have their moods
COSTUMES = ['drinker', 'gambler', 'barkeep', 'hired', 'shaft', 'scraper', 'crewboss', 'drivespear', 'crawler', 'guard', 'clerk', 'agent', 'lightcrew']
GENERIC = [(1, [3, 3], ['idle'] * 6)] + [(p, [1], [c]) for p, c in enumerate(COSTUMES, 2)]
SKARN_GOLD = [(0, 34, 0.58), (0, 360, 0.75)]   # (Skarn's gate-key, lantern-token and copper left as drawn by his reskin: `reskin` keep -- here and in tools/keeper-town-sheet.py)
# name: (pages' folder, ART id, the keeper's door in deep16/js/town.js, overrides). The art desk's numbers: bare ART-78 to ART-81 are these shopkeepers --
# its four heroes' 8-bit makeovers are ART-77-8BIT-<HERO> since its numbering resolution of 10-21 (Griz authorized; the collision is struck)
PEOPLE = {
    # Sylvia Swann's own two pages (the visible-owl final, 10-16): page 1 her idle, four stills (welcoming, amused, concerned, startled) and her
    # divining (played as her work), page 2 the owl's stretch -- the owl and the divining's glow kept with her (ART-SYLVIA-CUTTER-NOTES-v2.md)
    'sylvia': ('sylvia/ART-SYLVIA', 'ART-SPECIAL-SYLVIA', 'keeper:sylvia', {'pat': '%s_HEAD-1_PAGE-%d-v2.png', 'layout': [
        (1, [6, 4, 6], ['idle'] * 6 + ['welcoming', 'amused', 'concerned', 'startled'] + ['work'] * 6), (2, [3], ['stretch'] * 3)]}),
    # (and his four scene rows, 11-04, the cutter of 11-04: the art desk's ART-78-SCENES-2026-10-30-I -- present (the ring slid across), nod, averted, drawer
    # (the copper and the key stowed) -- on his own sheet, the pages by their paths)
    'winters': ('winters/ART-78', 'ART-78', 'warp:winters', {'blank': {6: [(0, 0, 420, 29)]}, 'layout': LAYOUT + [
        ('winters/ART-78-SCENES-2026-10-30-I/ART-78-SCENES_HEAD-%d_PAGE-1.png' % 1, [3, 3], ['present'] * 6), ('winters/ART-78-SCENES-2026-10-30-I/ART-78-SCENES_HEAD-%d_PAGE-1.png' % 2, [3], ['nod'] * 3), ('winters/ART-78-SCENES-2026-10-30-I/ART-78-SCENES_HEAD-%d_PAGE-1.png' % 3, [1], ['averted']), ('winters/ART-78-SCENES-2026-10-30-I/ART-78-SCENES_HEAD-%d_PAGE-1.png' % 4, [3, 3], ['drawer'] * 6)]}),
    'casper': ('casper/ART-79', 'ART-79', 'keeper:casper', {}),
    'androit': ('androit/ART-80', 'ART-80', 'keeper:androit', {}),
    'hessle': ('hessle/ART-81', 'ART-81', 'keeper:hessle', {}),
    'aldric': ('aldric/ART-82', 'ART-82', 'keeper:aldric', {}),
    'kessler': ('kessler/ART-83', 'ART-83', 'shop:kessler', {}),
    'calla': ('calla/ART-84', 'ART-84', 'shop:calla', {}),
    'barber': ('barber/ART-85', 'ART-85', 'keeper:barber', {}),
    'marin': ('marin/ART-86', 'ART-86', 'keeper:marin', {}),          # (10-21, Griz: "is the marin voss lack the zip file I just put in Fresh?")
    'kasten': ('kasten/ART-88', 'ART-88', 'shop:kasten', {}),         # (and "Lucia and 88 should be in there now")
    'lucia': ('lucia/ART-110', 'ART-110', 'shop:lucia', {}),
    # the last six of art-wanted section 20 (10-21 evening, the keepers cutter seat; Griz to the lanes desk: "we have shopkeep NPCs in Fresh")
    'cassia': ('cassia/ART-89', 'ART-89', 'inn:cassia', {}),
    'lisbet': ('lisbet/ART-92', 'ART-92', 'shop:lisbet', {}),
    'marko': ('marko/ART-94', 'ART-94', 'shop:marko', {}),
    'vilar': ('vilar/ART-97', 'ART-97', 'shop:vilar', {}),
    'percy': ('percy/ART-102', 'ART-102', 'warp:percy', {}),
    'ned': ('ned/ART-103', 'ART-103', 'warp:percy', {}),               # (Percy's partner: behind the same counter; the counter screen shows Percy's face)
    # two of the non-shop folk (10-21 night; Griz to the lanes desk: "non shop folk also have art in Fresh"): portraits only, no town page asked
    'mela': ('mela/ART-90', 'ART-90', 'keeper:mela', {}),
    'mical': ('mical/ART-91', 'ART-91', 'keeper:mical', {}),
    'merrick': ('merrick/ART-93', 'ART-93', 'keeper:merrick', {}),  # (10-21 night, the same word: the message-lantern house's window)
    # three more, each with a south idle (10-22, the NPC cutter seat; Griz to the lanes desk: "more NPC art is in", then "one cutter for all 3"): Brennan the smith
    # and Venn Hale of the fighters' stables at their doors, Korvin of the Hex's betting slate (his place is the Hex seat's)
    # (`gap`, by page: how near a piece must be to join a drawing -- Brennan's broad shoulders stand 5 px apart on his idle and work pages, Venn Hale's rows 11 px,
    # and her taut strap touches the next frame's on her work page, so there only a piece that overlaps one joins it)
    'brennan': ('brennan/ART-87', 'ART-87', 'keeper:brennan', {'gap': {1: 3, 6: 3}}),
    'venhale': ('venhale/ART-96', 'ART-96', 'keeper:venhale', {'gap': {1: 3, 6: -1}}),   # (Venn Hale by the first game's id, content/npcs.json -- not Venn the barber)
    # Korvin's waistcoat dyed slate grey at the cut, his shirt, skin, hair and inked fingers left alone (RULED 10-22, Griz: "Go for recolor without reroll"; the
    # desk had found Percy his near-twin, the same brown waistcoat over a cream rolled-sleeve shirt): judged in a 4x lineup beside Percy and Merrick on the counter's
    # panel -- the palette's silver ramp, clear of Percy's brown and Merrick's, where a dark blue sank into the navy behind him
    'korvin': ('korvin/ART-95', 'ART-95', 'hex:korvinSlate', {'recolour': {'hue': 215, 'sat': 0.22}}),
    'davos': ('davos/ART-98', 'ART-98', 'leech:davos', {}),         # (10-22, the desk's relay of Griz's "4 should be in fresh": the leech-house's face)
    # (10-22, the desk's relay of Griz's "more NPC in fresh": Marta Venn's cook-stalls, and Madame Ondine Vess of the School, whose door neither game has yet.
    # HELD, not cut: Tam Vere, ART-100, sorted to _src/tam/ART-100 -- the art desk drew her a man (its prompts: "watchful man"), and the realm's Tam and the
    # first game's are a woman (wiki vice-row.md; content/npcs.json `tam`); his word on a re-roll first)
    'marta': ('marta/ART-99', 'ART-99', 'npc:marta', {'gap': {6: 3}, 'match': {6: 1}}),   # (her work's bottom band stands 11 px apart; that page is drawn
    # warmer than her idle, its skin snapping to the reds: its colours matched to the idle's)
    'ondine': ('ondine/ART-101', 'ART-101', 'the School (no door yet)', {'gap': {6: 3}, 'pxjoin': (6,)}),   # (her work: the hand gesturing off-panel reaches into the frame before's box)
    # Aldwin of the mission chapel, pin 30 -- not Aldwyn Androit the notary (ART-80): the art desk's ART-114 (10-28, the second cutter seat, on Griz's 10-22
    # "we need for Aldwin of the free rest"); his chapel's free floor is the services seat's scene (C.SCRIPTS chapel)
    'aldwin': ('aldwin/ART-114', 'ART-114', 'chapel:aldwin', {'bevel': (2, 3, 4, 5)}),   # (his stills' counter tops are bevelled)
    # Tam Vere of the dream-smoke den, pin 40, a woman (10-28, the second cutter seat): the art desk's re-roll of ART-100 (its revision female-2026-10-27); the man it
    # drew first is in _src/tam/superseded/, never cut
    'tam': ('tam/ART-100', 'ART-100', 'keeper:tam', {'bevel': (6,), 'avoid': ['red', 'fire']}),   # (her work's counter top bevelled, as Aldwin's stills; her rust apron
    # snapped in part to the reds, a stain: left out, it keeps to leather and skin)
    # the night crews' five on the shaft rows (10-28, the second cutter seat: the art desk's ART-104 to ART-108, "new identities" from their original briefs on
    # Griz's word): Gull of the day-labor corner, Kael of the timber yard, Brennock the renderer-knacker (not Brennan), Vera the rag-and-bone, Kess of the flop-cellars
    # (not Kessler)
    'gull': ('gull/ART-104', 'ART-104', 'talk:gull', {'gap': {6: 3}, 'pxjoin': (6,), 'bevel': (6,)}),   # (his work: the hand pointing off-panel in 6 reaches into 5's box, as Ondine's)
    'kael': ('kael/ART-105', 'ART-105', 'talk:kael', {'bevel': (6,)}),
    'brennock': ('brennock/ART-106', 'ART-106', 'talk:brennock', {'bevel': (6,)}),
    'vera': ('vera/ART-107', 'ART-107', 'talk:vera', {'bevel': (6,)}),
    'kess': ('kess/ART-108', 'ART-108', 'keeper:kess', {'bevel': (6,)}),
    # Falstaff, the factor's clerk of the factor house on Fountain Street, pin 7a (10-29, the cutter seat of 10-29, on Griz's "pinged the art dept for his north
    # facings, got some tiles in to cut"): the art desk's ART-123-FALSTAFF, its generated sources -- not the coded placeholder in _src/falstaff/rejected/
    'falstaff': ('falstaff/ART-123-FALSTAFF', 'ART-123-FALSTAFF', 'keeper:falstaff', {'bevel': (2, 3, 4, 5)}),   # (his stills' counter tops bevelled, as Aldwin's: a sliver of it stood under the hands)
    # Papa Urtusk of the Hex's front door (10-29, the cutscene cutter seat, on Griz's "Urtusk just landed in fresh, give the cutscene its own cutter"): the art desk's
    # ART-123-URTUSK, drawn from the realm's portrait sheet (art-wanted section 26 as re-cut at bd2b7be0) -- his face for the council's sittings and his word at the door
    'papa': ('papa/ART-123-URTUSK', 'ART-123-URTUSK', 'npc:papa', {'edge': True, 'gap': {6: 3}, 'reskin': {'hue': 78, 'sat': 0.36}, 'avoid': ['skin', 'red'], 'bevel': (4,)}),   # (his work's ledges stand 6 px apart)
    # Warda, Papa and Lucia's daughter, who keeps the Hex's third floor and its keys (10-29, the cutscene cutter seat: the art desk's ART-123-WARDA, as it landed in Fresh
    # behind Papa's) -- her face for the third floor's word and the council's night
    'warda': ('warda/ART-123-WARDA', 'ART-123-WARDA', 'hex:warda', {'edge': True, 'bevel': (2, 3, 4, 5)}),   # (her stills' counter tops bevelled, as Falstaff's)
    # Ottak Harrow, the council's farmer (10-29, the cutscene cutter seat, on Griz's "harrows in, might as well spin up another cutter for skarn"): the art desk's
    # ART-123-HARROW -- his face for the council's sittings (C1's "Post it twice.", C2's who's-who)
    'harrow': ('harrow/ART-123-HARROW', 'ART-123-HARROW', 'council:harrow', {'edge': True, 'reskin': {'hue': 78, 'sat': 0.36, 'hues': (33, 60), 'vmax': 0.75, 'smin': 0.3}, 'avoid': ['red']}),   # (his skin as Papa's, turned to the orc green -- its band narrower, his cream shirt sits just under it)
    # Skarn the Warrener, the Crawler Warrens' overseer at the mouth camp (10-29, the Skarn cutter seat, on Griz's "harrows in, might as well spin up another cutter for
    # skarn"): the art desk's ART-123-SKARN -- the half-orc with the iron collar still on, the gate-key on its cord and the lantern-token, his spear standing beside him
    # (`propfree`: the bust from his own head). His khaki-olive skin turned to the orc ramp as Papa's; the key's and the token's richer gold left gold (`keep`)
    'skarn': ('skarn/ART-123-SKARN', 'ART-123-SKARN', 'npc:skarn', {'edge': True, 'propfree': True, 'blank': {pg: [(550, 415, 572, 465), (1102, 415, 1124, 465), (550, 870, 572, 920), (1102, 870, 1124, 920)] for pg in (1, 6)}, 'reskin': {'hue': 78, 'sat': 0.36, 'keep': SKARN_GOLD}, 'avoid': ['skin', 'red', 'fire']}),   # (his work's warmer coat and his cheeks' shadows flecked orange: fire left out)
    # Edric Pellam, the Warrens' tally-man at the mouth camp's tally-house (10-29, the Edric and Dace cutter seat, on Griz's "New in Play Records and Dace will be in Fresh
    # soon"): the art desk's ART-123-EDRIC, drawn on his word to it, "make him uglier - farmhand that works carrion crawler milking station (advanced to bookkeep)" -- his
    # face for the camp's scenes (js/mines.js M.talk by C.PT); his work the tally book written in and blotted
    'edric': ('edric/ART-123-EDRIC', 'ART-123-EDRIC', 'npc:edric', {'edge': True, 'gap': {6: 3}, 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),   # (his work's lower band stands 11 px apart; his stills'
    # counter tops bevelled, as Falstaff's; his ruddy nose and cheeks snapped to the lightest red, a clown's nose and blotches at this size -- the art desk's own
    # warning, "rather than accidental ... bright red nose": left out, they go to his skin)
    # Corwen Dace, the Guano Galleries' modernizer (10-29, the same seat): the art desk's ART-123-DACE, his grandfather's old cloak plain on his shoulders -- his face for
    # the Galleries' scenes and the deep gallery's (js/mines.js M.talk by C.PT); his work the notebook opened and sketched in, talking all the while
    'dace': ('dace/ART-123-DACE', 'ART-123-DACE', 'npc:dace', {'edge': True, 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),   # (his hair's shadows, his face's lines and
    # the strap's and satchel's oxblood snapped to the reds, the stills twice the idle's -- Griz, 10-29 night, "lot of red-shifting going on in various frames": left out,
    # as his figure's; the cloak's look too, whose violet light sent his cheeks and knuckles to the lightest red)
    # Dace in the cloak of displacement (10-29, the same seat, on Griz's "Dace in Displacement Cloak sprites to follow"; his ask to the art desk, "I also need variants where
    # his cloak is a cloak of displacement (obviously magical)"): the art desk's ART-123-DACE-DISPLACEMENT, a second look beside the plain one -- the cloak violet with a
    # blue afterimage of him offset screen-right. Its glow joins the idle's and the work's frames: `ghost` splits them at the real bodies and measures him without it
    'dacedisp': ('dace/ART-123-DACE-DISPLACEMENT', 'ART-123-DACE-DISPLACEMENT', 'npc:dace (the cloak worn as the magic item)', {'edge': True, 'bevel': (2, 3, 4, 5), 'ghost': {'hues': (205, 285), 'smin': 0.3}, 'untext': {4: [(0, 0, 820, 50)]}, 'avoid': ['red', 'fire']}),   # (his skeptical's title, "... DISPLACEMENT SKEPTICAL", ends on his hair)
    # Talmok, the Hex's champion by the sand (10-29, the Edric and Dace cutter seat, on the lanes desk's "Take Talmok after Dace"; art-wanted section 26's last block, a
    # portrait only): the art desk's ART-123-TALMOK, drawn from his own figure (talmok_p1) -- his word in the Hex on his face (js/town.js T.fire, C.takes)
    'talmok': ('talmok/ART-123-TALMOK', 'ART-123-TALMOK', 'the Hex, by the sand (talmok)', {'edge': True, 'bevel': (2, 3, 4, 5), 'match': {6: 1}}),   # (his stills'
    # counter tops bevelled; his work drawn warmer than the rest, its tan skin flecked orange, then gold, at this size: its colours matched to the idle's, as Marta's)
    # Old Wynn Pollard at the Galleries' mouth (10-29, the Edric and Dace cutter seat, on the lanes desk's relay: "Cut him the way Edric and Dace were cut"): the art desk's
    # ART-123-WYNN -- half-blind (his left eye clouded; the near right one good), calls the drives with a rattle -- his face for the Galleries' scenes (js/mines.js M.talk by C.PT)
    'wynn': ('wynn/ART-123-WYNN', 'ART-123-WYNN', 'npc:wynn', {'edge': True, 'bevel': (2, 3, 4, 5)}),
    # Sabeth Pollard at the Galleries' mouth (10-29, the Edric and Dace cutter seat, by the lanes desk's standing rule, a cutter takes what's in Fresh): the art desk's
    # ART-123-SABETH -- the weigh-beam and the hiring, sleeves rolled -- her face for the cull's word (js/mines.js M.talk by C.PT); her work a weight set on a beam scale
    'sabeth': ('sabeth/ART-123-SABETH', 'ART-123-SABETH', 'npc:sabeth', {'edge': True, 'bevel': (2, 3, 4, 5), 'gap': {6: 3}}),   # (her work's beam scale stands at each cell's edge, 7 px from the next frame's counter)
    # Jory Slade, the Warrens' crew boss (10-30, the cutter of 10-29 night, on the lanes desk's relay of the next delivery): the art desk's ART-123-JORY, an ex-collar
    # who milked his way out on the deep rate, the old collar's scar on his neck -- his face for the camp's scenes and the pens'; his work a tally marked on a slate and counted twice
    'jory': ('jory/ART-123-JORY', 'ART-123-JORY', 'npc:jory', {'edge': True, 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),
    # Old Hob Rennick (10-30, the cutter of 10-29 night, on the lanes desk's relay): the art desk's ART-123-OLDHOB, a thin sly dosed veteran of the Warrens in his sixties,
    # his battered hat, the crew coat, the milker's elbow gloves and the thimble on a thong -- his face at the pens' WORK A SHIFT (js/mines.js M.HOB_SHEET) and at his kitchen
    'oldhob': ('oldhob/ART-123-OLDHOB', 'ART-123-OLDHOB', 'npc:oldhob', {'edge': True, 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),
    # Warrens Pete (10-30, the cutter of 10-29 night, on Griz's "have the cutter start pete"): the art desk's ART-123-PETE, re-drawn on his correction -- a crawler milker,
    # drunk, whose crew got lost where they should not have gone: puffy eyes, a bulbous reddened nose, a scraggly beard, the crew coat and the milker's gloves -- his word in
    # Silverton and the Hex on his face; his work a mug lifted, drunk from and set down
    'pete': ('pete/ART-123-PETE', 'ART-123-PETE', 'npc:pete', {'edge': True, 'bevel': (2, 3, 4, 5), 'gap': {6: 3}, 'match': {2: 1, 3: 1, 4: 1, 5: 1, 6: 1}}),   # (his reds kept: the drunk's red nose and eyes are his look; the moods and the work drawn redder, the whole face red-orange, matched to the idle's colours)
    # Linnet Pellam and Ottilie Skerrow (10-30, the Keeper cutter, on Griz's "if cutter isn't done, my take on the usage is he can start NPC in fresh"): the art
    # desk's ART-123-LINNET (Edric's niece at the Warrens' camp, her work three thimbles counted in her palm) and ART-123-OTTILIE (the Galleries' final word at the
    # mouth, in the guano scrapers' workwear on his correction; her work a ruling, the hand flat on the ledge -- it lifts twice, the art desk's own caveat)
    'linnet': ('linnet/ART-123-LINNET', 'ART-123-LINNET', 'npc:linnet', {'edge': True, 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire'], 'reskin': {'hue': 66, 'k': 1.0, 'hues': (50, 95), 'smin': 0.15, 'vmin': 0.1, 'vmax': 0.95}}),   # (her olive kerchief is drawn at hue 60 on the idle, attentive and work pages and 64-65 on the others: at 60 it snapped tan, at 64 green, so it flickered tan to green from idle to mood -- the band turned to 66 on every page, its saturation and value kept)
    'ottilie': ('ottilie/ART-123-OTTILIE', 'ART-123-OTTILIE', 'npc:ottilie', {'edge': True, 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),
    # Idony Fell, the notary's senior clerk (10-30, the Keeper cutter, the lanes desk's relay of Griz's "we did image gen ceiling with only 2 idony, but i think
    # south-facing for when she's not 'watchful'"): the art desk's ART-123-IDONY, her portrait whole -- her word by the notary's on her face
    'idony': ('idony/ART-123-IDONY', 'ART-123-IDONY', 'npc:idony', {'edge': True, 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),
    # Lymen "Ly" Urtusk, the party's paladin (10-30, the Keeper cutter, on Griz's "we need them lymen portraits fren, we're doing a cutscene"): the art desk's
    # ART-MC-LYMEN-PORTRAIT, art-wanted section 33, for the company scene at the Hex's door (js/hours.js H16.papaScene) -- the screen's hero in the counter's hero
    # box, bottom left (js/counter.js C.HERO_PT, Counter.drawHero), so cut at Aurdin's hero size (`bust`) and mirrored to look right (`flip`). One action a HEAD
    # (HEAD 1 to 6, PAGE 1), no ledge: he stands in the open, cut at the waist; his sixth an Earnest still in place of a work row
    # (11-05, cutter-1105: re-cut from the art desk's own LYMEN-HERO-DIALOGUE-PORTRAITS, its redraw of the same six at Winters' finish -- the same face, tusks and
    # mail, the pages without titles; the 10-30 pages stay in _src/lymen/ART-MC-LYMEN-PORTRAIT)
    'lymen': ('lymen/HERO-DIALOGUE-1104/sources', 'LYMEN', 'the company scene (js/hours.js H16.papaScene)', {'edge': True, 'pat': '%s-P%02d-*.png', 'flip': True, 'bust': 66,
              'layout': [(1, [3, 3], ['idle'] * 6), (2, [1], ['attentive']), (3, [1], ['welcoming']), (4, [1], ['skeptical']), (5, [1], ['concerned']), (6, [1], ['earnest'])]}),
    # the same six at the keepers' bust (BUST, Papa's), a trial (11-05, the lanes desk, Griz: "do a test of the new NPC scale cut such that more of their bust is included in the
    # hero box with current verse trial on the lymen/papa conversation"): the art desk's "full" cut, made here with today's cutter; the open screen drew it on `&herofull`, and since 11-06 by default (below)
    'lymen_full': ('lymen/HERO-DIALOGUE-1104/sources', 'LYMEN', 'the company scene, the open screen (js/counter.js C.heroFull; the rule since 11-06)', {'edge': True, 'pat': '%s-P%02d-*.png', 'flip': True,
              'layout': [(1, [3, 3], ['idle'] * 6), (2, [1], ['attentive']), (3, [1], ['welcoming']), (4, [1], ['skeptical']), (5, [1], ['concerned']), (6, [1], ['earnest'])]}),
    # Vivian the candle girl, her tray of candles on its strap (11-05, cutter-1105, on Griz's "the scene is the recruitment at the start of the game, art dept is making
    # the world poses now"): the art desk's loose page "Vivian Venn -- Candle Girl", six faces one page, sorted to _src/vivian/CANDLE-GIRL-1105/ (an ASCII-named copy
    # beside it). Not the hero box: she speaks from the keeper's panel as you buy a candle and ask her along (js/company.js CO.HIREPT), so a keeper's size and
    # looking screen left as drawn (no `flip`); a one-frame idle, the four moods, and her sixth, mid-word, as `talk`. The tray is hers: `noledge`, nothing cut off her foot
    # (and the same night the art desk's VIVIAN-CANDLE-GIRL-INTERACTION, its two pages in the same windows: her Idle 6 -- rest, inhale, crest, blink, reopen, return -- in
    # place of the page's one still, which stays as `neutral`; and BUY A CANDLE 6, `sale`, played once as you buy: ready, reach, the taper lifted, offered, let go, the
    # hand back on the tray -- js/company.js CO.SCENES.vivian)
    'viviancandle': ('vivian/CANDLE-GIRL-1105', 'VIVIAN', 'her recruitment on Vice row (js/company.js CO.HIREPT)', {'edge': True, 'noledge': True,
                     'layout': [('vivian/CANDLE-INTERACTION-1105/VIVIAN-CANDLE-IDLE.png', [3, 3], ['idle'] * 6),
                                ('vivian/CANDLE-INTERACTION-1105/VIVIAN-BUY-A-CANDLE.png', [3, 3], ['sale'] * 6),
                                ('vivian/CANDLE-GIRL-1105/VIVIAN-CANDLE-GIRL-1105.png', [3, 3], ['neutral', 'attentive', 'welcoming', 'skeptical', 'concerned', 'talk'])]}),
    # Aurdin in his two mantles and Barley in his coat (11-05, cutter-1105): the art desk's own AURDIN- and BARLEY-HERO-DIALOGUE-PORTRAITS, idle 6 and the four moods,
    # drawn looking screen right already (no `flip`), cut at the same hero size as Lymen's -- in place of the 10-22 and 10-30 stills off their identity pages
    # (tools/hero-portrait.py), under the same names, so C.HERO_PT's looks hold: the Red Mantle out of robes, the Ochre in them, Barley's coat
    'aurdin_ochre': ('aurdin/HERO-DIALOGUE-1104/AURDIN-OCHRE-DIALOGUE-PORTRAITS/sources', 'AURDIN', 'the hero box in Wizard\'s Robes (js/counter.js C.HERO_PT aurdin_p2)', {'edge': True, 'pat': '%s-P%02d.png', 'bust': 66, 'layout': LAYOUT[:5]}),
    'aurdin_red': ('aurdin/HERO-DIALOGUE-1104/AURDIN-RED-DIALOGUE-PORTRAITS/sources', 'AURDIN', 'the hero box out of robes (js/counter.js C.HERO_PT aurdin_p3)', {'edge': True, 'pat': '%s-P%02d.png', 'bust': 66, 'layout': LAYOUT[:5]}),
    'barley_coat': ('barley/HERO-DIALOGUE-1104/sources', 'BARLEY', 'the hero box in his coat (js/counter.js C.HERO_PT barley_p2)', {'edge': True, 'pat': '%s-P%02d.png', 'bust': 66, 'layout': LAYOUT[:5]}),
    # Vivian Venn, the party's rogue (11-05, cutter-1105, the character/beast cutter): the art desk's VIVIAN-VENN-DIALOGUE-PORTRAITS, art-wanted section 37 (the
    # Opus lanes desk's deep dive on his "Do a deep dive and put an informed portrait/identity art request in for Vivian in the outbox please") -- HEADs 2 to 7,
    # the generator's originals (VIVIAN-HEAD-02-IDLE.png ...): idle 6, the four moods, and THE COIN 6 (rolled over the knuckles, palmed, the hand opened empty) in
    # place of a work row. The screen's hero in the hero box, so Lymen's way: Aurdin's hero size (`bust`), mirrored to look right (`flip`), cut at the waist. Her
    # auburn hair is her look: no `avoid` red
    'vivian': ('vivian/PORTRAITS-1104/originals', 'VIVIAN', 'the open screen\'s hero, any counter she leads (js/counter.js C.HERO_PT vivian_p0)', {'edge': True, 'pat': '%s-HEAD-%02d-*.png', 'flip': True, 'bust': 66,
               'layout': [(2, [3, 3], ['idle'] * 6), (3, [1], ['attentive']), (4, [1], ['welcoming']), (5, [1], ['skeptical']), (6, [1], ['concerned']), (7, [3, 3], ['coin'] * 6)]}),
    # THE HEROES AT THE KEEPERS' BUST, the rule since 11-06 (faces-1106, the lanes desk's seat; Griz on the small faces: "why so tiny?", "I thought I had the art dept make the same
    # size as urtusk", "I thought I approved them and they'd be worked in"): every hero's open-screen face from the same pages as the hero box's, at BUST (Papa's 150 px), no
    # `bust` -- Lymen's trial of 11-05 (`lymen_full`) the way. The art desk's own `cuts/pt_*_full` are this cutter's run at d04591e (Lymen's byte for byte), so they are cut
    # here, not copied: a later change to the cutter rebuilds them with the rest. js/counter.js C.heroFull draws `pt_<name>_full` wherever an open screen draws the hero
    'aurdin_ochre_full': ('aurdin/HERO-DIALOGUE-1104/AURDIN-OCHRE-DIALOGUE-PORTRAITS/sources', 'AURDIN', 'the open screen in Wizard\'s Robes (js/counter.js C.heroFull)', {'edge': True, 'pat': '%s-P%02d.png', 'layout': LAYOUT[:5]}),
    'aurdin_red_full': ('aurdin/HERO-DIALOGUE-1104/AURDIN-RED-DIALOGUE-PORTRAITS/sources', 'AURDIN', 'the open screen out of robes (js/counter.js C.heroFull)', {'edge': True, 'pat': '%s-P%02d.png', 'layout': LAYOUT[:5]}),
    'barley_coat_full': ('barley/HERO-DIALOGUE-1104/sources', 'BARLEY', 'the open screen in his coat (js/counter.js C.heroFull)', {'edge': True, 'pat': '%s-P%02d.png', 'layout': LAYOUT[:5]}),
    'vivian_full': ('vivian/PORTRAITS-1104/originals', 'VIVIAN', 'the open screen, any counter she leads (js/counter.js C.heroFull)', {'edge': True, 'pat': '%s-HEAD-%02d-*.png', 'flip': True,
               'layout': [(2, [3, 3], ['idle'] * 6), (3, [1], ['attentive']), (4, [1], ['welcoming']), (5, [1], ['skeptical']), (6, [1], ['concerned']), (7, [3, 3], ['coin'] * 6)]}),
    # Amara of the wagon and Elsbeth at the tub (11-04, the cutter of 11-04): the art desk's HALFWAY-INN-AMARA-PORTRAITS and -ELSBETH-TUB-PORTRAITS, art-wanted
    # section 35 -- the six pages as ever under the art desk's own names (AMARA-HEAD-01-IDLE.png, KP01-Idle.png): Amara's work counts coins into her palm,
    # Elsbeth's is at the kitchen tub, its rim her ledge (the tub kept in her portrait, the art desk's own word)
    'amara': ('amara/INN-PORTRAITS-1104', 'AMARA', 'the Pit road (js/wagon.js: the wagon\'s own picture there now)', {'edge': True, 'pat': '%s-HEAD-%02d-*.png', 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),
    # (and her bucket, 11-07, the desk of 11-07: art-wanted section 38's HEAD 7, the art desk's ELSBETH_HEAD-7_BUCKET.png -- she rises with the pail, tips it over the
    # drugged lead on the drag and shouts; played once, js/secondact.js A.drag; Griz, 11-07: "pop her up like conversation, wake up! you're supposed to stop it")
    'elsbethtub': ('elsbeth/INN-TUB-PORTRAITS-1104', 'K', 'npc:elsbeth (the Halfway Inn, js/inn.js M.talk)', {'edge': True, 'pat': '%sP%02d-*.png', 'avoid': ['red', 'fire'],
                   'layout': LAYOUT + [('elsbeth/ART-38-BUCKET-1107/ELSBETH_HEAD-7_BUCKET.png', [3, 3], ['bucket'] * 6)]}),
    # Katarina at the Halfway Inn (11-05, cutter-1105, on the lanes desk's relay of Griz's "cutter has Katarina it doesn't know about yet"): the art desk's
    # HALFWAY-INN-KATARINA-PORTRAITS, art-wanted section 35 -- H01-Idle.png to H06-Work.png, writing in her book at a table by the common room's fire, the table's near
    # edge her ledge (cut off, as a counter's); her work the book written in, blotted and closed over her fingers, played once
    # Doran Waterby, the Halfway Inn's owner (11-05, cutter-1105, on the lanes desk's relay of Griz's "Waterby's inbound in Fresh"): the art desk's
    # HALFWAY-INN-DORAN-PORTRAITS, art-wanted section 35 -- H01-idle.png to H06-work.png, behind his bar, his right hand on a pewter mug and his left on an
    # earthenware jug, the bar's top his ledge; his work the mug filled from the jug and nudged across to the guest, played once
    'doran': ('doran/INN-PORTRAITS-1105', 'H', 'npc:doranIn, doranYard (the Halfway Inn, js/inn.js M.talk; js/counter.js C.SHEETOF)', {'edge': True, 'pat': '%s%02d-*.png', 'avoid': ['red', 'fire']}),
    # Gennet Waterby, the inn lady (11-05, cutter-1105, the same relay): the art desk's HALFWAY-INN-GENNET-PORTRAITS -- GENNET_HEAD-1_IDLE.png to HEAD-6_WORK.png, at the
    # bar in her linen kerchief and charcoal wool, the cloth in her right hand; her work the lantern taken off its hook, opened, trimmed, lit, shut and hung again,
    # played once (the hook and the lantern kept with her: islands inside her frame's box)
    'gennet': ('gennet/INN-PORTRAITS-1105', 'GENNET', 'npc:gennet, gennetGrief, gennetYard (the Halfway Inn, js/inn.js M.talk; js/counter.js C.SHEETOF)', {'edge': True, 'pat': '%s_HEAD-%d_*.png', 'bevel': (2, 3, 4, 5, 'gennet/ART-38-LOOK-1107/GENNET_HEAD-7_THE-LOOK.png'), 'avoid': ['red', 'fire'],
               'layout': LAYOUT + [('gennet/ART-38-LOOK-1107/GENNET_HEAD-7_THE-LOOK.png', [1], ['look'])]}),   # (and her silencing look, 11-07: art-wanted section 38, held a beat after Elsbeth's shout on the drag)   # (her stills' bar top bevelled: a sliver of it stood under them)
    # Doran with the woodaxe at the yard's chopping block (11-12, cutter-art139, on the lanes desk's relay of Griz's "Fresh refilled"; asked as art-wanted section 52 on his
    # "doran's default 'click on him' should be axe portrait with a line"): the art desk's ART-139 DORAN pages, sorted to deep16/_src/ART-139/source/ -- Idle 6, Attentive,
    # Axe Low, Concerned, Work 6 (the axe set down on the block and both hands leant on the haft, played once, held). The chopping block KEPT in every frame (`noledge`,
    # the art desk's ART-139 notes: "Keep the chopping block with the portrait"; the ledge's find took it on the work page only), each frame on the block's foot;
    # js/counter.js C.SHEETOF.doranYard takes pt_doranaxe by name. `axelow` is a mood of his own (no scene names it yet: the screen's idle where it is not asked)
    'doranaxe': ('ART-139/source', 'ART-139-DORAN', 'npc:doranYard (the Halfway Inn woodpile, js/inn.js In.doranYard; js/counter.js C.SHEETOF.doranYard)', {'edge': True, 'noledge': True, 'avoid': ['red', 'fire'], 'layout': [
        ('ART-139/source/ART-139-DORAN-HEAD-1-IDLE.png', [3, 3], ['idle'] * 6), ('ART-139/source/ART-139-DORAN-HEAD-2-ATTENTIVE.png', [1], ['attentive']),
        ('ART-139/source/ART-139-DORAN-HEAD-3-AXE-LOW.png', [1], ['axelow']), ('ART-139/source/ART-139-DORAN-HEAD-4-CONCERNED.png', [1], ['concerned']),
        ('ART-139/source/ART-139-DORAN-HEAD-5-WORK.png', [3, 3], ['work'] * 6)]}),
    # the kept child, Nell, as she is, and the same child under the glamour (11-12, cutter-art139, the same relay; art-wanted section 52, his "art request for girl and goblin"):
    # the art desk's ART-139 NELL heads 1-3 and GLAMOUR heads 1-2 -- waist-up with no counter, so `noledge` and `cutline` (each frame on the torso's clean cut, as General
    # Grim's), looking screen right (she speaks from the left of the screen in the yard's talk). The two cut alike so the glamour's break swaps one for the other in place;
    # each page by its width at the idle's scale (`onescale`: the AFRAID hunches, and by its own bust it came out a head bigger), the AFRAID page's warmer colours matched to the idle's
    'keptchild': ('ART-139/source', 'ART-139-NELL', 'the kept child as she is (js/inn.js In.barnYard, the yard talk once the glamour is seen through; no id wears it yet)', {'edge': True, 'noledge': True, 'cutline': True, 'onescale': True, 'match': {'ART-139/source/ART-139-NELL-HEAD-2-AFRAID.png': 'ART-139/source/ART-139-NELL-HEAD-1-IDLE.png'}, 'avoid': ['red', 'fire'], 'layout': [
        ('ART-139/source/ART-139-NELL-HEAD-1-IDLE.png', [3, 3], ['idle'] * 6), ('ART-139/source/ART-139-NELL-HEAD-2-AFRAID.png', [1], ['afraid']),
        ('ART-139/source/ART-139-NELL-HEAD-3-LOOKING-UP.png', [1], ['lookingup'])]}),
    'glamourgoblin': ('ART-139/source', 'ART-139-GLAMOUR', 'the kept child under the glamour (js/inn.js In.barnS, S.who of the child; no id wears it yet)', {'edge': True, 'noledge': True, 'cutline': True, 'onescale': True, 'match': {'ART-139/source/ART-139-GLAMOUR-HEAD-2-AFRAID.png': 'ART-139/source/ART-139-GLAMOUR-HEAD-1-IDLE.png'}, 'avoid': ['red', 'fire'], 'layout': [
        ('ART-139/source/ART-139-GLAMOUR-HEAD-1-IDLE.png', [3, 3], ['idle'] * 6), ('ART-139/source/ART-139-GLAMOUR-HEAD-2-AFRAID.png', [1], ['afraid'])]}),
    'katarina': ('katarina/INN-PORTRAITS-1105', 'H', 'npc:katarina (the Halfway Inn, js/inn.js)', {'edge': True, 'pat': '%s%02d-*.png', 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),   # (her stills' table edge bevelled, as Falstaff's: a sliver of it stood under them)
    # Willem Glass, the illusionist (11-05, the Waterby cutter, on the lanes desk's relay of Griz's "Saw the mention I'd failed to DL them to Fresh and Willem portraits are there
    # now"): the art desk's HALFWAY-INN-WILLEM-PORTRAITS, art-wanted section 35 -- WILLEM_HEAD-1_PAGE-1.png to HEAD-6, at a table in his navy coat, a coin walking his knuckles;
    # his work the coin closed in his hand, the palm shown empty and the coin found at his ear, played once
    'willem': ('willem/INN-PORTRAITS-1105/selected', 'WILLEM', 'Willem at the wagon and on the road (js/wagon.js, js/chase.js)', {'edge': True, 'pat': '%s_HEAD-%d_PAGE-1.png', 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),
    # Elsbeth the candle girl (11-04, the cutter of 11-04): the art desk's ART-123-ELSBETH-PORTRAITS-PARTIAL, five pages (H1P1-Idle.png to H1P5-Concerned.png) -- her
    # Work held by the art desk (the working hand switches), so no work row: her face on Silverton's street; at the inn she speaks on pt_elsbethtub
    'elsbethCandles': ('elsbeth/ART-123-ELSBETH-PORTRAITS-PARTIAL', 'H1', 'npc:elsbethCandles', {'edge': True, 'pat': '%sP%d-*.png', 'layout': LAYOUT[:5], 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),
    # the Hex boy, Papa's runner (11-04, the cutter of 11-04): the art desk's ART-126-HEXBOY-BATCH-F, art-wanted section 30 -- idle and the four moods, no work
    # page asked; his town figure stays folkchild_p1
    'hexboy': ('hexboy/ART-126-HEXBOY-BATCH-F', 'ART-126_HEXBOY', 'Papa\'s runner (art-wanted section 30)', {'edge': True, 'layout': LAYOUT[:5], 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),
    # Nerisse, the Blue's Tongue, in her human shape at the Halfway Inn's hearth table (11-07, the desk of 11-07, on Griz's "got some more for human form Nerisse in
    # Fresh"): the art desk's ART-125-NERISSE-BATCH-G, art-wanted section 29 -- H1P1-Idle.png to H1P5-Concerned.png her own face, a cup by her hand; H1P6 `blue`, the
    # same pose as ATTENTIVE with the eyes gone blue-white and the stone lit, the Blue looking out; H1P7 `bluespeak`, six, the light pulsing as the Blue speaks
    # through her (the lamia lane's two voices, its §6a.6: the talk's face by the line's `voice` -- not wired; the lane HELD on his "Wait for the inn"). The
    # stills and the Blue drawn at about 1.5x the idle's scale snapped their sand robe to the gold, a flash at every face: matched to the idle's colours (Pete's way), the Blue to the Blue Speaking (the same light under the skin; matched to the idle or the Attentive it stayed gold)
    'nerisse': ('nerisse/ART-125-G-PORTRAITS', 'H1', 'the lamia at the Halfway Inn (the lamia lane; no talk wired yet)', {'edge': True, 'pat': '%sP%d-*.png', 'bevel': (2, 3, 4, 5, 6), 'avoid': ['red', 'fire'], 'match': {2: 1, 3: 1, 4: 1, 5: 1, 6: 7},
                 'layout': LAYOUT[:5] + [(6, [1], ['blue']), (7, [3, 3], ['bluespeak'] * 6)]}),
    # Signy the rope-maker of the Shaft Rows, pin 26 (11-07, the desk of 11-07, on Griz's "we got a request for 'signy' in fresh"): the art desk's
    # ART-123-SIGNY-PORTRAITS (its batch B), art-wanted section 26 -- ART-123-SIGNY_H1P1.png to H1P6, the dwarf woman with the grey braid and the leather apron
    # at a plain wooden ledge; her work two cords twisted into a rope and let go, played once (its own notes: Work 6 holds the finished rope, so no loop)
    'signy': ('signy/ART-123-SIGNY-PORTRAITS', 'ART-123-SIGNY', 'npc:signy (Silverton\'s street, pin 26)', {'edge': True, 'pat': '%s_H1P%d.png', 'bevel': (2, 3, 4, 5), 'avoid': ['red', 'fire']}),
    # the generic man and the generic woman (10-28 evening, the fourth cutter seat: the art desk's ART-122, on Griz's "as a specific person with each function as a
    # costume/look they have"): one person each, the townsfolk's man and woman (folkman_p1, folkwoman_p1), their own clothes' idle and a still for each costume in
    # place of the named's moods -- js/counter.js C.GENERIC gives each unnamed id its person and costume. A spear, a pole or a scraper held up beside the head
    # (`propfree`): the bust from the head's own top, over the torso's middle, the prop kept in the cut. Their warm skin snapped to the lightest red, and left out
    # of that to the fire ramp -- red arms, an orange blush -- so both are left out (Marta's way); the flushed costumes (the drinkers, the man's drive spear) snapped
    # their flush to the next red, slashes across the face and neck at 3x: there the reds go too, save the woman's maroon shawl (`avoid` by action, '*' the rest)
    'genman': ('genman/ART-122', 'ART-122-MAN', 'the unnamed (js/counter.js C.GENERIC)', {'propfree': True, 'layout': GENERIC,
               'avoid': {'*': ['fire', '#e8624a'], 'drinker': ['fire', 'red'], 'drivespear': ['fire', 'red']}}),
    'genwoman': ('genwoman/ART-122', 'ART-122-WOMAN', 'the unnamed (js/counter.js C.GENERIC)', {'propfree': True, 'layout': GENERIC,
                 'avoid': {'*': ['fire', '#e8624a'], 'drinker': ['fire', '#e8624a', '#b83428']}}),
    # the generic dwarf of Solskaft (11-12, the Ingrith cutter on the lanes desk's relay; art-wanted section 54, his "include a 'generic dwarf' like we did for
    # generic NPC, various costumes"): the art desk's ART-141-DWARF, one face, sorted to deep16/_src/dwarf/PORTRAITS/sources/ -- his own clothes' idle (6, the red
    # quilted tunic, thumbs in the belt, the blink on 4) and a still for each job's costume, the genman's way (`propfree`: the gate watch's spear and the smelter
    # hand's broom stand over the head). Fire and the lightest red left out as theirs (the art desk's "avoid fire oranges in ash or skin"), save the two lamps'
    # glow (the gate watch's, the lamp warden's). Worn by Solskaft's unnamed in the job they stand at (deep16/js/solskaft.js SK.DWARF)
    'dwarf': ('dwarf/PORTRAITS/sources', 'ART-141-DWARF', 'Solskaft\'s unnamed (js/solskaft.js SK.DWARF)', {'propfree': True, 'pat': 'ART-141-DWARF_HEAD-%02d_PAGE-%d_%s.png',
              'layout': [('dwarf/PORTRAITS/sources/ART-141-DWARF_HEAD-01_PAGE-1_IDLE.png', [3, 3], ['idle'] * 6)]
              + [('dwarf/PORTRAITS/sources/ART-141-DWARF_HEAD-%02d_PAGE-1_%s.png' % (h, pg), [1], [act]) for h, pg, act in [
                  (2, 'TROOPER', 'trooper'), (3, 'DRILL-SERGEANT', 'sergeant'), (4, 'GATE-WATCH', 'gatewatch'), (5, 'QUARTERMASTER', 'quartermaster'),
                  (6, 'SMITH', 'smith'), (7, 'SMELTER-HAND', 'smelter'), (8, 'YARD-HAND', 'yardhand'), (9, 'SHAFT-WATCH', 'shaftwatch'),
                  (10, 'SHROOM-FARMER', 'shroom'), (11, 'LAMP-WARDEN', 'lampwarden'), (12, 'MASON', 'mason')]],
              'avoid': {'*': ['fire', '#e8624a'], 'gatewatch': ['#e8624a'], 'lampwarden': ['#e8624a']}}),
    # GENERAL GRIMLOCK GRIM (11-10, the cutter of 11-10, on the lanes desk's queue -- Griz: "they can churn through fresh one at a time as they complete at your discretion
    # as to next cut"; the General of the road redraft from his Beholda stream table, his 10-28 "was decided re: General Grimlock Grim beholda scripting for road redraft"):
    # the art desk's GENERAL-GRIM-PORTRAITS-A1, -A2 and -A3-MONOLOGUE, sorted to deep16/_src/generalgrim/PORTRAITS-*-1110/ -- a close dialogue bust with no counter, so
    # `noledge` and `cutline`: each frame stands on the torso's clean cut (one below its lowest row as wide as half its widest), and what hangs below it -- Command 5's
    # hand -- is kept, in a cell made deep enough. Idle 6 (the blink across its two bands), the eight stills of A1 and A2's Skeptical as moods, SPEAKING 6 and COMMAND 6
    # (the hand reaching wide on 3-4, low on 5: one scale for the row, by the head and torso), and the monologue's three cue stills (A3: THE CROSSING, THE ACCUSATION,
    # THE ORDER -- his clawed fingertips, the revised sources). No scene speaks on him yet (the story build's): js/counter.js C.VENDORS.generalgrim, the portraits' show his door
    'generalgrim': ('generalgrim', 'H1', 'General Grimlock Grim (the road redraft, no scene yet: js/counter.js C.VENDORS.generalgrim)', {'edge': True, 'noledge': True, 'cutline': True,
                    'layout': [('generalgrim/PORTRAITS-A1-1110/sources/H1P1-Idle.png', [3, 3], ['idle'] * 6)]
                    + [('generalgrim/PORTRAITS-A%d-1110/sources/H1P%d-%s.png' % (a, n, f), [1], [act]) for a, n, f, act in [
                        (1, 2, 'Attentive', 'attentive'), (1, 3, 'Welcoming', 'welcoming'), (2, 12, 'Skeptical', 'skeptical'), (1, 4, 'Concerned', 'concerned'),
                        (1, 5, 'Stern', 'stern'), (1, 6, 'Amused', 'amused'), (1, 7, 'Angry', 'angry'), (1, 8, 'Surprised', 'surprised'), (1, 9, 'Weary', 'weary')]]
                    + [('generalgrim/PORTRAITS-A2-1110/sources/H1P10-Speaking.png', [3, 3], ['speaking'] * 6), ('generalgrim/PORTRAITS-A2-1110/sources/H1P11-Command.png', [3, 3], ['command'] * 6)]
                    + [('generalgrim/PORTRAITS-A3-MONOLOGUE-1110/sources/H1P%d-%s.png' % (n, f), [1], [act]) for n, f, act in [
                        (13, 'The-Crossing', 'crossing'), (14, 'The-Accusation', 'accusation'), (15, 'The-Order', 'order')]]}),
    # PYRONIMUS "PYRO" SILVERSANDS, King of Solskaft (11-12, cutter-pyro, on the lanes desk's relay of Griz's "pyro first pieces (and a griffon) are in fresh";
    # art-wanted section 54, his description, "Pyro is old school"): the art desk's ART-141-PYRO portraits, sorted to deep16/_src/ART-141-PYRO/PORTRAITS/sources/ --
    # Idle 6 (hands on the two mace heads, the blink on 4-5) and five moods: attentive, welcoming (the right hand lifted open), grave, stern (a hand closed on a
    # haft), grieved (eyes lowered). Waist-up with no counter, so `noledge` and `cutline` (General Grim's way); looks screen left. No scene speaks on him yet:
    # js/counter.js is the inn seat's, its C.SHEETOF / C.VENDORS line for `pyro` relayed by the desk
    'pyro': ('ART-141-PYRO/PORTRAITS/sources', 'ART-141-PYRO', 'npc:pyro (Solskaft\'s vault doors, js/solskaft.js SK.PEOPLE pyro; js/counter.js not wired)', {'edge': True, 'noledge': True, 'cutline': True, 'avoid': ['red', 'fire'], 'layout': [
        ('ART-141-PYRO/PORTRAITS/sources/ART-141-PYRO_HEAD-01_PAGE-1_IDLE.png', [3, 3], ['idle'] * 6)]
        + [('ART-141-PYRO/PORTRAITS/sources/ART-141-PYRO_HEAD-%02d_PAGE-1_%s.png' % (h, act.upper()), [1], [act]) for h, act in [
            (2, 'attentive'), (3, 'welcoming'), (4, 'grave'), (5, 'stern'), (6, 'grieved')]]}),
    # INGRITH SCALEBEAM, cleric of Solskaft and captain of its ledger (11-12, cutter-ingrith, on the lanes desk's relay of Griz's word that her pages were in Fresh;
    # art-wanted section 54, "Ingrith just as her role in the story shows on her, I'm less picky."): the art desk's ART-141-INGRITH portraits, sorted to
    # deep16/_src/ingrith/PORTRAITS/source/ -- Idle 6 (the closed ledger held to her chest, the blink on 4-5) and five moods: attentive, welcoming, skeptical (the
    # ledger half open), grave (a hand closed over the token at her throat), weary. Waist-up with no counter, so `noledge` and `cutline` (Pyro's way); looks screen
    # left. The reds kept, unlike Pyro's: left out, her auburn hair and burgundy sleeves snapped brown (the welcoming still's ledger flecks red, the lesser cost). No scene speaks on her yet: the story's scenes with her are the story build lane's
    'ingrith': ('ingrith/PORTRAITS/source', 'ART-141-INGRITH', 'npc:ingrith (Solskaft, Ingrith\'s ledger-room; js/counter.js not wired)', {'edge': True, 'noledge': True, 'cutline': True, 'avoid': ['fire'], 'layout': [
        ('ingrith/PORTRAITS/source/ART-141-INGRITH_HEAD-01_PAGE-1_IDLE.png', [3, 3], ['idle'] * 6)]
        + [('ingrith/PORTRAITS/source/ART-141-INGRITH_HEAD-%02d_PAGE-1_%s.png' % (h, act.upper()), [1], [act]) for h, act in [
            (2, 'attentive'), (3, 'welcoming'), (4, 'skeptical'), (5, 'grave'), (6, 'weary')]]}),
}


def page_path(folder, art, n, pat='%s_HEAD-1_PAGE-%d.png'):
    fs = glob.glob(os.path.join(SRC, folder, pat % (art, n)))
    if not fs:
        raise SystemExit('no page %d in %s' % (n, os.path.join(SRC, folder)))
    return fs[0]


def drawings(a, bands, mask_d=MASK_D, gap=12, pxjoin=False, edge=False):
    """the page's drawings, `bands` of them a band, each (mask of it over the page, its box), read in order: top band first, left to right. A pixel is figure
    when a channel is mask_d from the navy, or half that and touching one that is (a dark coat's shadows against the navy: Winters'); a drawing
    is its biggest piece and the pieces within `gap` px of it (a sleeve the mask parted from the body: Casper's) -- by their boxes, or with `pxjoin` by their
    own pixels (a hand reaching into the next frame's box: Madame Ondine Vess's work); a printed word or number is small and short"""
    navy = np.median(a.reshape(-1, 3)[::97], axis=0)
    if edge:                                                    # (a page the figure fills -- Papa Urtusk's idle and work, near half the page: the median is figure and
        navy = np.median(np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)]), axis=0)   # navy, so the navy by the page's edges)
    d = np.abs(a - navy).max(-1)
    strong = ndimage.binary_opening(d > mask_d, structure=np.ones((3, 3)))
    weak = ndimage.binary_opening(d > mask_d / 2.0, structure=np.ones((3, 3)))
    # the printed words and numbers out first, so the weak mask cannot join a title to a head (Winters' ACQUISITION, Casper's big "4"):
    # small, light pieces of the strong mask
    ls, ns = ndimage.label(strong, structure=np.ones((3, 3)))
    if ns:
        ssz = ndimage.sum(strong, ls, range(1, ns + 1)); lum = ndimage.median(a.mean(-1), ls, range(1, ns + 1))
        txt = np.isin(ls, 1 + np.where((ssz < 2500) & (np.asarray(lum) > 90))[0])
        txt = ndimage.binary_dilation(txt, iterations=4)
        strong &= ~txt; weak &= ~txt
    lw, nw = ndimage.label(weak, structure=np.ones((3, 3)))
    hit = np.unique(lw[strong]); hit = hit[hit > 0]
    m = np.isin(lw, hit) & weak
    want = sum(bands)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(lab)
    sz = ndimage.sum(m, lab, range(1, n + 1))
    groups = []                                                 # [ [labels], box ]
    near = lambda b, c, g: b[0] <= c[2] + g and c[0] <= b[2] + g and b[1] <= c[3] + g and c[1] <= b[3] + g
    for i in np.argsort(-sz):
        sl = objs[i]; b = (sl[1].start, sl[0].start, sl[1].stop, sl[0].stop)
        if sz[i] < 800 or b[3] - b[1] < 40:
            continue                                            # (a letter, a number, a speck)
        g = [q for q in groups if near(q[1], b, gap)]
        if pxjoin and g:                                        # (only a group whose own pixels come within gap px of this piece's)
            wx0, wy0, wx1, wy1 = max(0, b[0] - gap - 1), max(0, b[1] - gap - 1), b[2] + gap + 1, b[3] + gap + 1
            win = lab[wy0:wy1, wx0:wx1]; me = ndimage.binary_dilation(win == i + 1, iterations=max(1, gap))
            g = [q for q in g if np.isin(win[me], q[0]).any()]
        if g:
            q = g[0]; q[0].append(i + 1); q[1] = (min(q[1][0], b[0]), min(q[1][1], b[1]), max(q[1][2], b[2]), max(q[1][3], b[3]))
        elif len(groups) < want:
            groups.append([[i + 1], b])
    out = []
    for labs, b in groups:
        piece = ndimage.binary_fill_holes(np.isin(lab, labs))
        out.append((piece, b))
    out.sort(key=lambda p: (p[1][1] + p[1][3]) / 2.0)
    rows, k = [], 0
    for n in bands:
        rows += sorted(out[k:k + n], key=lambda p: p[1][0]); k += n
    return rows


def ghost_mask(a, g):
    """a displacement's ghost (Corwen Dace's cloak, ART-123-DACE-DISPLACEMENT: a blue afterimage offset screen-right, its edges a bright blue-violet): the page's
    pixels of hue g['hues'] at saturation over g['smin'] -- the real cloak is a darker violet past them, the skin, hair and leather warm"""
    h, s, v = hsv(a)
    return (h >= g['hues'][0]) & (h <= g['hues'][1]) & (s >= g.get('smin', 0.3))


def split_ghosts(a, found, bands, gm, upper=1.0, gap=8):
    """drawings whose glow joined them (the ghost fills the gutter between frames): each piece split at the gaps between its real bodies -- the figure less the
    ghost (gm), counted by columns over its top `upper` share (a counter under the hands runs on cell to cell) -- each cut just before the next body begins, so a
    ghost, which trails screen-right, stays with the body it belongs to"""
    out = []
    for piece, box in found:
        x0, y0, x1, y1 = box
        real = piece[y0:y0 + int((y1 - y0) * upper), x0:x1] & ~gm[y0:y0 + int((y1 - y0) * upper), x0:x1]
        body = np.where(real.sum(0) > 3)[0]
        runs = []
        for c in body:
            if runs and c - runs[-1][1] <= gap:
                runs[-1][1] = c
            else:
                runs.append([c, c])
        runs = [r for r in runs if r[1] - r[0] > 40]                # (a body is wide; a stray thread of the counter or a fleck is not)
        cuts = [x0] + [x0 + r[0] - 2 for r in runs[1:]] + [x1]
        for c0, c1 in zip(cuts[:-1], cuts[1:]):
            sub = piece.copy(); sub[:, :c0] = False; sub[:, c1:] = False
            ys, xs = np.where(sub)
            out.append((sub, (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)))
    out.sort(key=lambda p: (p[1][1] + p[1][3]) / 2.0)
    rows, k = [], 0
    for n in bands:
        rows += sorted(out[k:k + n], key=lambda p: p[1][0]); k += n
    return rows


def hsv(rgb):
    """hue (degrees), saturation and value (0-1) of an RGB array (0-255)"""
    a = rgb.astype(float) / 255.0; mx = a.max(-1); d = mx - a.min(-1)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.zeros_like(mx); m = d > 1e-6
    rr = m & (mx == r); gg = m & (mx == g) & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6; h[gg] = ((b - r)[gg] / d[gg]) + 2; h[bb] = ((r - g)[bb] / d[bb]) + 4
    return h * 60, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx


def cloth_mask(rgb, fig, hues=(8, 48), smin=0.2, vmax=0.45):
    """the dark brown cloth worn over a pale shirt (a waistcoat) in one drawing's crop, `fig` its figure: the brown of `hues` darker than vmax, its body the big
    pieces left by a 9 px opening (the shirt's fold lines and a face's shadows are thin and fall away), its smaller parts within 30 px of that body (its back over
    a shoulder, a side panel under an arm), its edges 4 px round, and the near-black of its seams inside it (not the ink on the fingers: a blue). A prop of a
    redder, deeper leather in front of it is left out, by its colour smoothed over the dither (Korvin's pouch, his work 4-6)"""
    h, s, v = hsv(rgb)
    cand = fig & (h >= hues[0]) & (h <= hues[1]) & (s >= smin) & (v <= vmax)
    body = ndimage.binary_opening(cand, structure=np.ones((9, 9)))
    lab, n = ndimage.label(body)
    if not n:
        return np.zeros_like(fig)
    sz = ndimage.sum(body, lab, range(1, n + 1))
    main = np.isin(lab, 1 + np.where(sz >= 0.25 * sz.max())[0])
    small = ndimage.binary_opening(cand, structure=np.ones((5, 5)))
    ls, ns = ndimage.label(small)
    if ns:
        ssz = ndimage.sum(small, ls, range(1, ns + 1))
        hit = np.unique(ls[ndimage.binary_dilation(main, iterations=30) & small]); hit = [k for k in hit if k > 0 and ssz[k - 1] >= 300]
        main |= np.isin(ls, hit)
    inside = ndimage.binary_fill_holes(ndimage.binary_closing(main, structure=np.ones((15, 15))))
    seam = fig & (v < 0.24) & ~((h > 180) & (h < 260) & (s > 0.2))
    out = (ndimage.binary_dilation(main, iterations=4) & cand) | (inside & seam)
    bl = np.stack([ndimage.uniform_filter(rgb[..., c].astype(float), 9) for c in range(3)], -1)
    bh, bs, bv = hsv(bl)
    prop = fig & (bh <= 20) & (bs >= 0.5) & (bv <= 0.45)
    lp, npp = ndimage.label(prop)
    if npp:
        psz = ndimage.sum(prop, lp, range(1, npp + 1))
        out &= ~ndimage.binary_fill_holes(ndimage.binary_dilation(np.isin(lp, 1 + np.where(psz >= 800)[0]), iterations=4))
    return out


def hem_cut(rgb, mask, band=(0.5, 0.7)):
    """a whole figure's cloth mask stopped at the waistcoat's hem, where trousers of the same brown go on below it (Korvin's town figure): the hem is the darkest
    row in `band` of the figure's height down each column of the mask, fitted as a V from the sides to the middle by a median fit (the buttons' gap and a stray
    dark fold fall away), and nothing below it is dyed"""
    H = mask.shape[0]; v = ndimage.uniform_filter(hsv(rgb)[2], (5, 9))
    y0, y1 = int(H * band[0]), int(H * band[1])
    cols = np.where(mask[y0:y1].sum(0) > 10)[0]
    if len(cols) < 3:
        return mask
    seam = np.array([y0 + int(np.argmin(np.where(mask[y0:y1, c], v[y0:y1, c], 9))) for c in cols], float)
    xc = (cols.min() + cols.max()) / 2.0; d = np.abs(cols - xc)
    best = None
    for b in np.linspace(-0.6, 0.6, 61):
        a0 = np.median(seam - b * d); err = np.median(np.abs(seam - a0 - b * d))
        if best is None or err < best[0]:
            best = (err, a0, b)
    _, a0, b = best
    out = mask.copy(); line = np.round(a0 + b * np.abs(np.arange(mask.shape[1]) - xc)).astype(int)
    for x in range(mask.shape[1]):
        out[max(0, line[x]):, x] = False
    return out


def recolour(rgb, mask, hue, sat):
    """the pixels under `mask` turned to `hue` at saturation `sat`, each keeping its own value (its light and shade): a cloth dyed another colour before the
    pixelating, so the palette's snap finds that colour's ramp"""
    h, s, v = hsv(rgb)
    out = rgb.astype(float).copy()
    vv = v[mask]; ss = np.full(vv.shape, float(sat))
    hh = (hue / 60.0) % 6; i = int(np.floor(hh)); f = hh - i
    p, q, t = vv * (1 - ss), vv * (1 - ss * f), vv * (1 - ss * (1 - f))
    out[mask] = np.stack([(vv, t, p), (q, vv, p), (p, vv, t), (p, q, vv), (t, p, vv), (vv, p, q)][i], -1) * 255
    return np.clip(np.round(out), 0, 255).astype(np.uint8)


def reskin(rgb, fig, hue=80, k=1.0, sat=None, hues=(28, 52), smin=0.18, vmin=0.15, vmax=0.82, keep=()):
    """an orc's skin drawn khaki (Papa Urtusk's, ART-123-URTUSK: "green-grey" in the ask, painted at a hue of 35 to 40 that snaps to the stone ramp, an old
    human's face): the figure's pixels of `hues` (the wool's browns sit below, the white hair and the bone tusks are pale or brighter than vmax) turned to `hue`
    at k times their own saturation (or at `sat`, one for all: the idle's paler skin snapped half to stone at k), each keeping its value -- so the snap finds the palette's orc ramp, as the art desk's notes ask ("preserve orc skin as orc ramp").
    `keep`: [(hue from, hue to, saturation over)] left as drawn -- a gold richer than the skin (Skarn's gate-key and lantern-token, ART-123-SKARN: hue 28 to 35
    at 0.55 to 0.8, the boots' and the spear's copper 28 to 34 at 0.6 to 0.7; his skin 33 to 45, at 0.45 to 0.57 on the south and the portraits, 0.6 to 0.68 on the SE)"""
    h, s, v = hsv(rgb)
    m = fig & (h >= hues[0]) & (h <= hues[1]) & (s >= smin) & (v >= vmin) & (v <= vmax)
    for h0, h1, s0 in keep:
        m &= ~((h >= h0) & (h < h1) & (s > s0))
    out = rgb.astype(float).copy()
    vv = v[m]; ss = np.full(vv.shape, float(sat)) if sat is not None else np.clip(s[m] * k, 0, 1)
    hh = (hue / 60.0) % 6; i = int(np.floor(hh)); f = hh - i
    pp, q, t = vv * (1 - ss), vv * (1 - ss * f), vv * (1 - ss * (1 - f))
    out[m] = np.stack([(vv, t, pp), (q, vv, pp), (pp, vv, t), (pp, q, vv), (t, pp, vv), (vv, pp, q)][i], -1) * 255
    return np.clip(np.round(out), 0, 255).astype(np.uint8)


def ledge_top(piece, box):
    """the top row of a counter drawn under the hands -- a run of rows at the piece's foot whose ends stand within 3 px of its widest foot row,
    wider than the figure above it -- or the piece's foot if there is none (a coat's hem is as wide as the coat)"""
    x0, y0, x1, y1 = box
    rows = []
    for y in range(y1 - 1, y0 - 1, -1):
        xs = np.where(piece[y, x0:x1])[0]
        rows.append((y, xs.min() + x0, xs.max() + x0) if len(xs) else (y, None, None))
    foot = [r for r in rows[:6] if r[1] is not None]
    if not foot:
        return y1
    _, l0, r0 = max(foot, key=lambda r: r[2] - r[1])
    k = 0
    while k < len(rows) and k < 6 and (rows[k][1] is None or abs(rows[k][1] - l0) > 3 or abs(rows[k][2] - r0) > 3):
        k += 1                                                  # (the foot's soft last rows)
    run = 0
    while k + run < len(rows) and rows[k + run][1] is not None and abs(rows[k + run][1] - l0) <= 3 and abs(rows[k + run][2] - r0) <= 3:
        run += 1
    if run < 4 or k + run > (y1 - y0) * 0.15:
        return y1
    above = [r - l for y, l, r in rows[k + run:k + run + 30] if l is not None]
    if not above or (r0 - l0) < max(above) + 6:
        return y1
    return rows[k + run - 1][0]


def cut_line(m, frac=0.5):
    """the bust's clean cut: one below the lowest row as wide as `frac` of its widest (a hand hanging below the torso is narrow, and stays below it)"""
    w = m.sum(axis=1); ys = np.where(w >= frac * w.max())[0]
    return int(ys.max()) + 1


def cut_person(name):
    folder, art, door, ov = PEOPLE[name]
    raw, order = {}, []                                          # action -> [(rgba crop at source size, anchor x, anchor y, bust, ledge)]
    pages = []
    for pg, bands, acts in ov.get('layout', LAYOUT):
        # (a page named by its own path under _src: a supplement from another delivery -- Winters' scenes, ART-78-SCENES-2026-10-30-I, 11-04)
        src_pg = os.path.join(SRC, pg) if isinstance(pg, str) else page_path(folder, art, pg, ov.get('pat', '%s_HEAD-1_PAGE-%d.png'))
        a = np.asarray(Image.open(src_pg).convert('RGB')).astype(np.int32)
        for bx0, by0, bx1, by1 in ov.get('blank', {}).get(pg, []):
            a[by0:by1, bx0:bx1] = np.median(a.reshape(-1, 3)[::97], axis=0) if not ov.get('edge') else np.median(np.concatenate([a[:6].reshape(-1, 3), a[:, :6].reshape(-1, 3)]), axis=0)   # (a printed title touching a head: Winters' ACQUISITION; with `edge`, the navy by the page's edges -- Skarn's counters run cell to cell)
        for bx0, by0, bx1, by1 in ov.get('untext', {}).get(pg, []):   # (a printed title's white letters on a strand of hair, where a box would cut the hair: Dace's skeptical, ART-123-DACE-DISPLACEMENT)
            box = a[by0:by1, bx0:bx1]; box[box.min(-1) > 170] = np.median(np.concatenate([a[:6].reshape(-1, 3), a[:, :6].reshape(-1, 3)]), axis=0)
        dr = drawings(a, bands, ov.get('mask_d', MASK_D), ov.get('gap', {}).get(pg, 12), pg in ov.get('pxjoin', ()), ov.get('edge', False))
        if ov.get('ghost'):                                      # (a ghost's glow joining the frames: split at the real bodies -- Dace's cloak of displacement)
            dr = split_ghosts(a, dr, bands, ghost_mask(a, ov['ghost']), upper=0.95)   # (0.95: the satchel hangs low on the next frame's left, the counter is under that)
        found = [(piece, box, box[3] if ov.get('noledge') else ledge_top(piece, box)) for piece, box in dr]   # (`noledge`: what is at the foot is hers -- Vivian's candle tray)
        if len(found) != len(acts):
            raise SystemExit('%s page %d: %d drawings found, %d wanted' % (name, pg, len(found), len(acts)))
        pages.append((pg, a, found, acts))
    def wide_foot(piece, box):                               # (the drawing's foot as wide as anything near it: a counter's front, not a hem)
        x0, y0, x1, y1 = box
        wid = [np.count_nonzero(piece[y, x0:x1]) for y in range(y1 - int((y1 - y0) * 0.25), y1)]
        return max(wid[-6:]) >= 0.97 * max(wid)
    def top_of(piece): return np.where(piece.any(axis=1))[0][0]
    # the counter where a hand or a cloth broke its edge (Marin's work, Kasten's skeptical still, 10-21): a frame in a band whose neighbours' counter was found takes
    # their line (the counter stands at one height across a band); a lone still of a keeper whose Idle stands at a counter takes the depth of the counters found
    # on the other pages, as a share of the drawing's height
    idle_at_counter = any(f < b[3] for pg, a, found, acts in pages for p, b, f in found if acts[0] == 'idle')
    shares = [(b[3] - f) / float(b[3] - top_of(p)) for pg, a, found, acts in pages for p, b, f in found if f < b[3]]
    for pg, a, found, acts in pages:
        for i, (piece, box, foot) in enumerate(found):
            if foot < box[3]:
                continue
            mid = (box[1] + box[3]) / 2.0
            band = [f for p, b, f in found if f < b[3] and b[1] < mid < b[3]]
            if band:
                line = int(np.median(band))
                if top_of(piece) + 0.6 * (box[3] - top_of(piece)) < line < box[3]:
                    found[i] = (piece, box, line)
            elif idle_at_counter and shares and wide_foot(piece, box):
                found[i] = (piece, box, box[3] - int(round(np.median(shares) * (box[3] - top_of(piece)))))
    # a whole band of a page whose counter went unfound, where the page's other band found it (Davos's work, 10-22: his rolled sleeves stand wider than the
    # ledge just above it on the top band, so no row stood out as the counter's): the page's own counter depth, its drawings drawn at one scale, where the
    # drawing's foot is a ledge that deep -- every row of it standing within 3 px of the same two ends
    def ledge_deep(piece, box, dep):
        x0, y0, x1, y1 = box; ends = []
        for y in range(y1 - dep, y1 - 2):
            xs = np.where(piece[y, x0:x1])[0]
            if not len(xs):
                return False
            ends.append((xs.min(), xs.max()))
        l, r = np.median([e[0] for e in ends]), np.median([e[1] for e in ends])
        return len(ends) >= 4 and all(abs(e[0] - l) <= 3 and abs(e[1] - r) <= 3 for e in ends)
    # a counter whose top is bevelled (Aldwin's four stills, 10-28: the board's top face narrows for ten source rows before the figure's sleeves, so the run
    # of rows as wide as its front starts below it, and two rows of it stood under his hands at game size): the line climbs the bevel to the step where the
    # piece narrows to the figure -- `bevel`: the pages it climbs on
    def bevel_top(piece, box, foot, reach=24, step=16):
        x0, y0, x1, y1 = box
        def ends(y):
            xs = np.where(piece[y, x0:x1])[0]
            return (xs.min(), xs.max()) if len(xs) else None
        for y in range(foot - 1, max(y0 + 1, foot - reach), -1):
            e, u = ends(y), ends(y - 1)
            if e is None or u is None:
                return foot
            if (u[0] - e[0]) + (e[1] - u[1]) > step:
                return y
        return foot
    for pg, a, found, acts in pages:
        if pg in ov.get('bevel', ()):
            found[:] = [(p, b, bevel_top(p, b, f) if f < b[3] else f) for p, b, f in found]
    for pg, a, found, acts in pages:
        deps = [b[3] - f for p, b, f in found if f < b[3]]
        if not deps:
            continue
        dep = int(np.median(deps))
        for i, (piece, box, foot) in enumerate(found):
            if foot == box[3] and ledge_deep(piece, box, dep - 2):
                found[i] = (piece, box, box[3] - dep)
    # a page drawn warmer than the rest (Marta's work, 10-22: its skin snapped to the reds, a burnt face over the stew): its figures' colours matched to
    # another page's, channel by channel (the mean and spread of the figures' pixels), before the cut -- `match`: {page: the page it takes its colours from}
    for pg, a, found, acts in pages:
        ref = ov.get('match', {}).get(pg)
        if ref is None:
            continue
        rp = [q for q in pages if q[0] == ref][0]
        src = np.concatenate([a[pc & (np.arange(a.shape[0])[:, None] < f)] for pc, b, f in found])
        dst = np.concatenate([rp[1][pc & (np.arange(rp[1].shape[0])[:, None] < f)] for pc, b, f in rp[2]])
        k = dst.std(0) / np.maximum(src.std(0), 1e-6)
        a[...] = np.clip(np.round((a - src.mean(0)) * k + dst.mean(0)), 0, 255).astype(a.dtype)
    for pg, a, found, acts in pages:
        gm = ghost_mask(a, ov['ghost']) if ov.get('ghost') else None
        for (piece, box, foot), act in zip(found, acts):
            x0, y0, x1, y1 = box
            keep = piece.copy(); keep[foot:, :] = False
            if foot < y1:                                        # (the counter's top edge left in slivers over the cut: anything there under 5 px tall goes)
                band = keep[foot - 8:foot]; keep[foot - 8:foot] = band & ndimage.binary_opening(keep, structure=np.ones((5, 1)))[foot - 8:foot]
                # a hole the counter closed opens again with the counter gone (Percy's work, 10-21: the navy between his arm, the jar and his waistcoat, filled
                # as a hole while the counter's top shut it in): a wide piece of the page's own navy inside the figure
                dn = np.abs(a - np.median(a.reshape(-1, 3)[::97], axis=0)).max(-1)
                lb, nb = ndimage.label(keep & (dn <= HOLE_D), structure=np.ones((3, 3)))
                if nb:
                    sz = ndimage.sum(np.ones_like(lb), lb, range(1, nb + 1))
                    big = 1 + np.where(sz >= HOLE_MIN)[0]
                    if len(big): keep &= ~np.isin(lb, big)
            ys, xs = np.where(keep)
            top = ys.min()
            meas = keep & ~gm if gm is not None else keep           # (the real body's measure, its ghost left out: the bust, the head, the anchor -- the cut keeps both)
            mtop = np.where(meas.any(axis=1))[0].min()
            aline = cut_line(meas) if ov.get('cutline') else foot   # (`cutline`: the torso's clean cut, not the drawing's foot -- a hand below it kept: General Grim's Command 5)
            bust = aline - mtop
            head = meas[mtop:mtop + int(bust * 0.22)]
            if ov.get('propfree'):                               # (the head's own top: the figure over the torso's middle, a raised prop beside it left out of the measure)
                lo = np.where(meas[(top + foot) // 2:foot])[1]
                mid, half = np.median(lo), 0.16 * (lo.max() - lo.min())
                win = meas.copy(); win[:, :max(0, int(mid - half))] = False; win[:, int(mid + half):] = False
                htop = np.where(win.any(axis=1))[0].min()
                bust = foot - htop
                head = win[htop:htop + int(bust * 0.22)]
            hx = np.where(head)[1].mean()
            cx0, cx1 = xs.min(), xs.max() + 1
            rgba = np.zeros((foot - top, cx1 - cx0, 4), np.uint8)
            rgba[..., :3] = a[top:foot, cx0:cx1]
            rgba[..., 3] = keep[top:foot, cx0:cx1] * 255
            if ov.get('recolour'):                               # (a cloth dyed at the cut: Korvin's waistcoat off Percy's brown)
                rgba[..., :3] = recolour(rgba[..., :3], cloth_mask(rgba[..., :3], keep[top:foot, cx0:cx1]), **ov['recolour'])
            if ov.get('reskin'):                                 # (an orc's khaki skin turned green at the cut: Papa Urtusk's)
                rgba[..., :3] = reskin(rgba[..., :3], keep[top:foot, cx0:cx1], **ov['reskin'])
            if act not in raw:
                raw[act] = []; order.append(act)
            raw[act].append((rgba, hx - cx0, aline - top, bust, foot < y1))
    # each page by its own bust (the stills are drawn bigger): the page's median to BUST
    small = {}
    for act, fr in raw.items():
        k = ov.get('bust', BUST) / float(np.median([f[3] for f in fr]))
        if ov.get('onescale'):   # (`onescale`: a page by the idle's scale times the idle's width over its own -- a still that hunches keeps the idle's size, not blown up to its bust; its page may be drawn at another size: the kept child's AFRAID, twice the idle's on the page, 11-12)
            k = ov.get('bust', BUST) / float(np.median([f[3] for f in raw['idle']])) * float(np.median([f[0].shape[1] for f in raw['idle']])) / float(np.median([f[0].shape[1] for f in fr]))   # (`bust`: a person's own -- a hero's bust in the counter's hero box, js/counter.js HB, Aurdin's size: Lymen's, 10-30)
        out = []
        for rgba, ax, ay, bust, ledge in fr:
            im = Image.fromarray(rgba, 'RGBA').convert('RGBa')
            w, h = max(1, round(rgba.shape[1] * k)), max(1, round(rgba.shape[0] * k))
            im = im.resize((w, h), Image.BOX).convert('RGBA')
            av = ov.get('avoid'); av = av.get(act, av.get('*')) if isinstance(av, dict) else av   # (an action's own, or every action's)
            px = pix.pixelate(im, 1, do_lift=False, avoid=av)   # (`avoid`: ramps or colours the snap leaves out -- tools/pixelate.py)
            axk = ax * k
            if ov.get('flip'):                                   # (`flip`: mirrored after the cut, the anchor with it -- the art desk drew him looking screen left, and he sits bottom left looking right: Lymen's, 10-30, Griz "will need to be mirrored to be bottom left screen")
                px = np.ascontiguousarray(px[:, ::-1]); axk = px.shape[1] - axk
            out.append((px, axk, ay * k, ledge))
        small[act] = out
    # one box for every frame, round the anchor
    L = max(f[1] for fr in small.values() for f in fr) + 2; R = max(f[0].shape[1] - f[1] for fr in small.values() for f in fr) + 2
    T = max(f[2] for fr in small.values() for f in fr) + 2; B = 2
    if ov.get('cutline'): B = max(2, max(f[0].shape[0] - f[2] for fr in small.values() for f in fr) + 2)   # (room under the cut for what hangs below it)
    fw, fh, axx, ayy = int(np.ceil(L + R)), int(np.ceil(T + B)), int(round(L)), int(round(T))
    rows = len(order); cols = max(len(small[a]) for a in order)
    sheet = np.zeros((rows * fh, cols * fw, 4), np.uint8)
    meta = {'image': 'art/pt_%s.png' % name, 'fw': fw, 'fh': fh, 'ax': axx, 'ay': ayy, 'top': ayy, 'portrait': True, 'anims': {}, 'art': art, 'door': door,
            'source': 'deep16/_src/%s (the art desk\'s %s, sorted out of Fresh 10-21), cut by tools/portrait-sheet.py' % (folder, art)}
    if ov.get('recolour'):
        meta['recolour'] = ov['recolour']                       # (the dye put on at the cut, for the record: Korvin's)
    if ov.get('flip'):
        meta['flip'] = True                                     # (mirrored at the cut, for the record: Lymen's)
    for r, act in enumerate(order):
        for i, (px, ax, ay, ledge) in enumerate(small[act]):
            ox, oy = int(round(axx - ax)), int(round(ayy - ay))
            h, w = px.shape[:2]
            ys0, xs0 = max(0, oy), max(0, ox)
            sub = px[ys0 - oy:min(h, fh - oy), xs0 - ox:min(w, fw - ox)]
            dst = sheet[r * fh + ys0:r * fh + ys0 + sub.shape[0], i * fw + xs0:i * fw + xs0 + sub.shape[1]]
            on = sub[..., 3] > 0
            dst[on] = sub[on]
        meta['anims'][act] = {'y': r * fh, 'fw': fw, 'fh': fh, 'ax': axx, 'ay': ayy, 'frames': len(small[act]), 'fps': FPS.get(act, 1), 'ledge': [bool(f[3]) for f in small[act]]}
    os.makedirs(ART, exist_ok=True)
    Image.fromarray(sheet, 'RGBA').save(os.path.join(ART, 'pt_%s.png' % name), optimize=True)
    json.dump(meta, open(os.path.join(ART, 'pt_%s.json' % name), 'w'), indent=1)
    print('  pt_%s: %dx%d a frame, %s' % (name, fw, fh, ', '.join('%s %d%s' % (a, len(small[a]), ' (ledge cut %d)' % sum(f[3] for f in small[a]) if any(f[3] for f in small[a]) else '') for a in order)))
    return sheet, meta


if __name__ == '__main__':
    args = [x for x in sys.argv[1:] if x != 'check']
    names = args or list(PEOPLE)
    outs = [cut_person(nm) for nm in names]
    if 'check' in sys.argv[1:]:
        W = max(s.shape[1] for s, m in outs); H = sum(s.shape[0] + 6 for s, m in outs)
        cv = np.zeros((H, W, 3), np.uint8); cv[...] = (40, 46, 70); y = 0
        for s, m in outs:
            for r in range(len(m['anims'])):                       # the hands' line drawn under each row: every frame should sit on it
                cv[y + r * m['fh'] + m['ay'], :s.shape[1]] = (120, 80, 50)
            al = s[..., 3:4] / 255.0; sl = cv[y:y + s.shape[0], :s.shape[1]]; sl[...] = (s[..., :3] * al + sl * (1 - al)).astype(np.uint8)
            y += s.shape[0] + 6
        d = os.path.join(ROOT, 'dev', 'visions'); os.makedirs(d, exist_ok=True)
        Image.fromarray(cv).resize((W * 2, H * 2), Image.NEAREST).save(os.path.join(d, 'portraits.png'))
        print('  dev/visions/portraits.png')

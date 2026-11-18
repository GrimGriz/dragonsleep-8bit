"""DEEP16: the generic man and woman head to foot in their portraits' costumes -> folkman_<costume>_p1, folkwoman_<costume>_p1 (art-wanted 65,
11-15, the NPC cutter seat on the lanes desk's brief; Griz: "are we missing art for the worldmap figures for these guys?" from the Glowseep's floor).

    python tools/folk-costume-sheet.py              # every costume in PIECES
    python tools/folk-costume-sheet.py lightcrew    # one

Sources (the art desk's, in the main checkout's deep16/_src/folkcostumes/<piece>/ -- a worktree reads them there; sorted out of Fresh by
_src/art-desk/art<n>-*-sort-*.py). Each piece's frame map names every frame's window on its page, its person (the sheet), its view and its
row (idle 4 or walk 8): FRAME-MAP.json (the light crew's: `sheets`, each frame's `cell_source_xywh`) or FRAME-MAP.csv (the shaft hand's:
a row a frame, `target`, `facing`, `action`, `frame_index`, `source_page`, `crop_x/y/w/h`). The pages are native pixel art on folkman_p1's
own cell (72 x 64, anchor 36,60), every colour one of the 64 -- the light crew drawn at 3x, the shaft hand at 1x -- so no rescale and no
snap: each window is read one pixel in k (refused unless it is an exact k x), the piece's navy keyed out, every colour checked against
deep16/palette.json. Placed as drawn (the art desk registered each view against the town figures). `stand`: each view moved so its Idle 1's
lowest row is on AY, its walk with it -- the light crew's (its E, NE and N pages draw the soles a pixel above the S and SE; the old townsfolk
stand on 60 in every view); not the shaft hand's (its notes: a forward boot in SE and NE projects a row below the ground, on purpose).
Facings: the five views as drawn, SW, W and NW the mirrors of SE, E and NE (RULED 10-14). Rows idle and walk at folkman_p1's fps.
No drawn looping effect in these (the light crew's moss on the gloves is a still colour; the shaft hand's candle is unlit; RULED 11-15,
drawn smoke and breath to the engine).

The REDRAWS (`lime`, 11-15 night; the redraw cutter seat on Griz's "they just switched to limegreen background - do an opus cutter for the
latest in fresh to see if its okay"): the 11-15 batch was drawn by code and is being redrawn with the image generator, a whole illustrated
figure a pose on a flat #00FF00 ground, about 12x the game's size. Their FRAME-MAP.csv gives each frame's crop (`crop_left/top`, right and
bottom exclusive), its size at 1x (`resize_w/h`) and its place in the cell (`native_x/y`), the art desk's own registration on the town
figures' 48/51 px. Cut by the art desk's own recipe (its CUTTER-NOTES.md: the key G > 65 and G > 1.27 max(R, B) + 9, the largest
8-connected piece, Lanczos down, alpha at 123, the nearest of the 64 in Lab), with two of the house's: the green DESPILLED on the figure
before the reduction (green no higher than the larger of red and blue -- the key leaves a one-pixel halo at the source's edge, which
otherwise lands ~100 pixels a sheet on the orc and moss ramps), and red and fire only where the colour is crimson (hue 330 to 360,
saturation over 0.25: the woman's shawl) -- else the warm browns of hair, mug, boots and flushed cheeks snap to red, as the art desk's own
1x shows (the 10-29 cutters' "avoid red and fire", kept off the one cloth that is red); and a pale cloth (saturation under 0.55: the man's
work shirt, the woman's apron and sleeves) kept off skin and gold as well -- else the shirt snaps to the skin ramp whole and he reads
shirtless (the cutscene cutter's 10-29 "a cream cloth at the skin's hue ... kept out by the band"). Faces and hands run 0.6 and up.

The ILLUSTRATED REDRAWS ON THE NAVY WITH NO NATIVE CUT (`illus`, 11-16; the redraw cutter seat, on the lanes desk's relay of Griz's "hired hand is in
Fresh but I'm not sure it's complete - art dept hit ceiling, but it might have been on a redraw attempt and we can wishlist what's broken and use
what's there if it included all the pieces"): the hired hand's FRAME-MAP.json gives each frame's crop (`source_xywh`), its size at 1x
(`reduce_wh`) and its place in the cell (`paste_xy`); its CUTTER-NOTES.md the key -- the navy the channel-wise median of the crop's outermost three
columns each side (the approved checkpoint page: its left 35, and its enclosed holes under 62 source pixels filled), the largest 4-connected piece
whose largest channel stands more than 10 off it, Pillow BOX down, alpha at 124. Reproduced against the art desk's own 1x previews: the outline
exact in all 120 frames. The colours by the house's two rules, the lime path's (`house_colours`), not the art desk's nearest-in-RGB.
"""
import os, sys, json, csv
import importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix, AD = _load('pixelate'), _load('artdesk')

FW, FH, AX, AY = 72, 64, 36, 60
FPS = {'idle': 5, 'walk': 12}            # (folkman_p1's and folkwoman_p1's own)
ROWS = ['idle', 'walk']
COUNT = {'idle': 4, 'walk': 8}
ORDER = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']   # (a sheet's eight facing rows; SW, W, NW the mirrors)
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
# costume -> its piece: its folder under _src/folkcostumes/, the art desk's name for the source line, its navy, and whether each view is stood
PIECES = {
    'lightcrew': dict(folder='2026-11-15-ART-WANTED-65-LIGHTCREW', name='ART-WANTED-65 GLOWSEEP-LIGHTCREW, 11-15: five views, Idle 4 and Walk 8, native 3x on folkman_p1\'s cell',
                      navy=(7, 22, 46), stand=True),
    # (the shaft hand's and the scraper's first, code-drawn pages -- 2026-11-15-ART-WANTED-71-SHAFT-HAND, native 1x, navy (16, 22, 52); -72-GUANO-SCRAPER,
    # native 4x, navy (17, 24, 45) -- replaced by their redraws: image-generated on the navy, each with the art desk's own native cut on the 64, taken
    # as drawn but for the red and fire on their faces, `unred`; the scraper woman's red neckcloth below her face kept)
    'shaft': dict(folder='2026-11-15-ART-WANTED-71-SHAFT-HAND-REDRAW', pages='CUT-SHEETS', name='ART-WANTED-71 SHAFT-HAND ILLUSTRATED REDRAW, 11-15: five views, Idle 4 and Walk 8, image-generated, its native cut 3x on folkman_p1\'s cell',
                  navy=(7, 22, 46), stand=False, unred=0),
    'scraper': dict(folder='2026-11-15-ART-WANTED-72-GUANO-SCRAPER-REDRAW', name='ART-WANTED-72 GUANO-SCRAPER REDRAW, 11-15: five views, Idle 4 and Walk 8, image-generated, its native cut 1x on folkman_p1\'s cell',
                    navy=None, stand=False, unred={'folkman_scraper_p1': 0, 'folkwoman_scraper_p1': 12}),
    # (the drinker's first, code-drawn pages -- folder 2026-11-15-ART-WANTED-73-DRINKER, native 4x, navy (17, 24, 45) -- replaced by the redraw)
    'drinker': dict(folder='2026-11-15-ART-WANTED-73-DRINKER-REDRAW', name='ART-WANTED-73 DRINKER ILLUSTRATED REDRAW, 11-15: five views, Idle 4 and Walk 8, image-generated on lime green',
                    lime=True, stand=False),
    # (the gambler's and the barkeep's first, code-drawn pages -- 2026-11-15-ART-WANTED-74-GAMBLER and -75-BARKEEP, native 4x, navy (17, 24, 45) --
    # replaced by their redraws, 11-16: image-generated on the navy, each with the art desk's own native cut on the 64 (02-native-rows, 1x), taken as
    # drawn but for the red and fire on their faces, `unred` -- the gambler man's crimson waistcoat and the woman's dress trim and choker kept below
    # the face (12 rows); the barkeep man's to his open collar (17 rows: the source draws skin at the throat, the 1x red), the red-striped rag on his
    # shoulder kept below; the barkeep woman wears no red cloth (her rag is slate-blue), so everywhere, as the shaft hand)
    'gambler': dict(folder='2026-11-16-ART-WANTED-74-GAMBLER-REDRAW', name='ART-WANTED-74 GAMBLER ILLUSTRATED REDRAW, 11-16: five views, Idle 4 and Walk 8, image-generated, its native cut 1x on folkman_p1\'s cell',
                    navy=None, stand=False, unred={'folkman_gambler_p1': 12, 'folkwoman_gambler_p1': 12}),
    'barkeep': dict(folder='2026-11-16-ART-WANTED-75-BARKEEP-REDRAW', name='ART-WANTED-75 BARKEEP ILLUSTRATED REDRAW, 11-16: five views, Idle 4 and Walk 8, image-generated, its native cut 1x on folkman_p1\'s cell',
                    navy=None, stand=False, unred={'folkman_barkeep_p1': 17, 'folkwoman_barkeep_p1': 0}),
    # (the hired hand's first, code-drawn pages -- 2026-11-15-ART-WANTED-76-HIRED-HAND, native 4x, navy (17, 24, 45) -- replaced by its redraw, 11-16:
    # image-generated on the navy with no native cut, `illus`; three walks the art desk held for a repeated lead (the man's E and NE, the woman's NE)
    # cut as drawn on his "use what's there", on the dream list)
    'hired': dict(folder='2026-11-16-ART-WANTED-76-HIRED-HAND-REDRAW', name='ART-WANTED-76 HIRED-HAND ILLUSTRATED REDRAW, 11-16: five views, Idle 4 and Walk 8, image-generated on the navy',
                  illus={'HIRED-HAND-WOMAN-SOUTH-IDLE-IMAGEGEN.png': (35, 62)}, stand=False),
    # (the guard's first, code-drawn pages -- 2026-11-15-ART-WANTED-77-GUARD, native 3x, navy (16, 18, 40) -- replaced by its redraw, 11-18: image-generated
    # on the navy with the art desk's own native cut on the 64 (CUTS-1X, a 72 x 64 strip a row), taken as drawn but for the red and fire on the faces
    # and hands, `unred` everywhere -- neither wears red cloth (a padded jack, an iron cap; her tunic indigo); five walks the art desk held for a
    # repeated lead (both SE and rear NE, the man's E), cut as drawn, its "use what's there")
    'guard': dict(folder='2026-11-18-ART-WANTED-77-GUARD-REDRAW', name='ART-WANTED-77 GUARD ILLUSTRATED REDRAW, 11-18: five views, Idle 4 and Walk 8, image-generated, its native cut 1x on folkman_p1\'s cell',
                  navy=None, stand=False, unred=0),
    # the guard's fight figures (the art desk's own, sent with the redraw, 11-18; nobody asked for them in art-wanted 65): the man worn by the Line Guard
    # (foes.js guard, off the KayKit guard_p1), the woman cut and held for his word on where she fights; the crew boss's cell and rows, the Spear's
    # blow on its frame 4 (`release` 3); `unred` everywhere as the town pair
    'guardfight': dict(folder='2026-11-18-ART-WANTED-77-GUARD-COMBAT', name='ART-WANTED-77 GUARD COMBAT ILLUSTRATED, 11-18: five views, Ready Idle 4, Walk 8, Spear 6, Flinch 4, Fall 6, Prone 1, image-generated, its native cut 1x on its 96 x 96 cell',
                       navy=None, stand=False, unred=0, cell=(96, 96, 48, 76), targets={'man': 'guard_p2', 'woman': 'guardwoman_p1'},
                       rows=[('idle', 'idle', 4, 4, None), ('walk', 'walk', 8, 9, None), ('spear', 'attack', 6, 12, 3), ('flinch', 'flinch', 4, 12, None),
                             ('fall', 'hurt', 6, 8, None), ('prone', 'prone', 1, 1, None)]),
    # (the crew boss's first, code-drawn pages -- 2026-11-15-ART-WANTED-78-CREW-BOSS-WORLD and -MALE-FIGHT, native 4x, navy (17, 24, 45) -- replaced by its
    # redraw, 11-18: image-generated on the navy, the world pair and his fight figure in one delivery with one map, each with the art desk's own native cut
    # on the 64, taken as drawn but for the red and fire on faces and hands, `unred` everywhere (a brown bib, cream sleeves, the lamp dark metal: no red
    # cloth); `shared`: the map's frames for the other piece's figures passed over)
    'crewboss': dict(folder='2026-11-18-ART-WANTED-78-CREW-BOSS-REDRAW', name='ART-WANTED-78 CREW-BOSS ILLUSTRATED REDRAW, 11-18: five views, Idle 4 and Walk 8, image-generated, its native cut 1x on folkman_p1\'s cell',
                     navy=None, stand=False, unred=0, shared=True),
    # (the clerk's first, code-drawn pages -- 2026-11-15-ART-WANTED-79-CLERK, native 4x, navy (17, 24, 45) -- replaced by its redraw, 11-18: image-generated
    # on the navy with the art desk's own native cut on the 64 (NATIVE/, a strip a row), taken as drawn but for the red and fire on faces and hands,
    # `unred` everywhere -- no red cloth (a brown waistcoat, ivory sleeves, slate below; the warm streak at the head is the pen behind the ear, not red);
    # five walks the art desk held (both SE and rear NE, the man's E), cut as drawn)
    'clerk': dict(folder='2026-11-18-ART-WANTED-79-CLERK-REDRAW', name='ART-WANTED-79 CLERK ILLUSTRATED REDRAW, 11-18: five views, Idle 4 and Walk 8, image-generated, its native cut 1x on folkman_p1\'s cell',
                  navy=None, stand=False, unred=0),
    # the drive spear (art-wanted 65's piece 5, the art desk's 80, 11-18; the first to come: the Galleries' bat-drive hands, a short spear upright in the
    # right hand, one shoulder guard): its native cut taken as drawn, `unred` everywhere (no red cloth); the drive crew (C.GENERIC drivecrew) moves into
    # the man as it lands; four walks the art desk held for LOOK (both SE and rear NE), cut as drawn
    'drivespear': dict(folder='2026-11-18-ART-WANTED-80-DRIVE-SPEAR', name='ART-WANTED-80 DRIVE SPEAR ILLUSTRATED, 11-18: five views, Idle 4 and Walk 8, image-generated, its native cut 1x on folkman_p1\'s cell',
                       navy=None, stand=False, unred=0),
    # the factor's agent (art-wanted 65's piece 5, the art desk's 81, 11-18 night; the cutter seat cutter-1118b): the man asked (Silverton's towns7, the factor's
    # man, a dark well-cut coat, gloved, a sealed letter in his right hand), the woman sent beside him on the art desk's checkpoint (her South Idle approved
    # there) -- worn by no one yet. Its own cut atlas taken as drawn (CUTS/, our grid). `unred` on the face only: the man's waistcoat under the coat is an
    # oxblood red, 15 rows below his crown and down, and her letter's wax seal is red at the hand (30 and down); the snap's red cheeks and ears above them
    # (his 13 rows, hers 14) moved off red
    'agent': dict(folder='2026-11-18-ART-WANTED-81-FACTOR-AGENT', name='ART-WANTED-81 FACTOR-AGENT ILLUSTRATED, 11-18: five views, Idle 4 and Walk 8, image-generated, its native cut 1x on folkman_p1\'s cell',
                  navy=None, stand=False, unred={'folkman_agent_p1': 13, 'folkwoman_agent_p1': 14}),
    # the crawler hand (art-wanted 65's piece 6, the last, the art desk's 82, 11-18 night; the cutter seat cutter-1118b): the Crawler Warrens' pen workers, the
    # man and the woman, gloves to the elbow and a milking thimble at the throat -- no id wears it yet (C.GENERIC). Its own native atlas taken as drawn
    # (NATIVE-ATLASES/, our grid); `unred` everywhere (no red cloth: a cream shirt or blouse, a brown apron or bodice; the reds stray single pixels)
    'crawlerhand': dict(folder='2026-11-18-ART-WANTED-82-CRAWLER-HAND', name='ART-WANTED-82 CRAWLER-HAND ILLUSTRATED, 11-18: five views, Idle 4 and Walk 8, image-generated, its native cut 1x on folkman_p1\'s cell',
                        navy=None, stand=False, unred=0),
    # the crew boss man's fight sheet (the art desk's 78, on his "pasted to the art desk re Crew Boss"): foes.js crewboss wears it, off Hask's
    # hask_p1; its own 96 x 96 cell, the trooper's fight rows (trooper_p2's fps), the Mace's blow landing on its frame 4 (`release` 3)
    'crewbossfight': dict(folder='2026-11-18-ART-WANTED-78-CREW-BOSS-REDRAW', name='ART-WANTED-78 CREW-BOSS ILLUSTRATED REDRAW, 11-18: his fight figure, five views, Ready Idle 4, Walk 8, Mace 6, Flinch 4, Fall 6, Prone 1, image-generated, its native cut 1x on its 96 x 96 cell',
                          navy=None, stand=False, unred=0, shared=True, cell=(96, 96, 48, 76), targets={'crewboss_p1': 'crewboss_p1'},
                          rows=[('idle', 'idle', 4, 4, None), ('walk', 'walk', 8, 9, None), ('attack', 'attack', 6, 12, 3), ('flinch', 'flinch', 4, 12, None),
                                ('hurt', 'hurt', 6, 8, None), ('prone', 'prone', 1, 1, None)]),
}


def palette():
    p = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))
    return {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for r in p['ramps'].values() for c in r}


def mirror(fr):
    """the west of a drawn east: a flip, then a pixel back so the anchor column stays put (the frame is even wide) -- tools/townsfolk-sheet.py's"""
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def frames_of(d):
    """the piece's frame map, whichever shape the art desk sent -> [(sheet, view, row, index, page, (x, y, w, h))]"""
    if os.path.exists(os.path.join(d, 'FRAME-MAP.json')):
        fm = json.load(open(os.path.join(d, 'FRAME-MAP.json'), encoding='utf-8'))
        if isinstance(fm, list):                # (the guard's redraw and its fight figures, 11-18: a list, a frame an entry, each naming its cell in the art
            # desk's own native strip -- the town pair's `native_file` at `native_xywh`, the fight pair's `native_png` at `native_crop_xywh`, by `person`)
            g = lambda e, *ks: next(e[k] for k in ks if e.get(k) not in (None, ''))
            if 'figure' in fm[0] and 'native_file' not in fm[0]:   # (the clerk's redraw, 11-18: no strip named; its native cut of a row is
                # NATIVE/<figure>-<view>-<row>.png, a transparent strip from frame 1)
                return [(e['runtime_target'], e['facing'], e['action'], int(e['frame']) - 1, 'NATIVE/%s-%s-%s.png' % (e['figure'], e['facing'], e['action']),
                         ((int(e['frame']) - 1) * e['cell'][0], 0, e['cell'][0], e['cell'][1])) for e in fm]
            return [(g(e, 'runtime_target', 'person'), e['facing'], g(e, 'action', 'row'), int(e['index']), g(e, 'native_file', 'native_png'),
                     tuple(int(v) for v in g(e, 'native_xywh', 'native_crop_xywh'))) for e in fm]
        if 'sheets' in fm and 'destination_atlas_xywh' in fm['sheets'][0]['frames'][0]:   # (the factor's agent, 11-18: `sheets` by runtime_target, each
            # frame's cell in the art desk's own cut atlas CUTS/<target>.png, our town atlas grid -- S SW W NW N NE E SE, idle rows then walk 8 below)
            return [(s['runtime_target'], s['facing'], s['action'], int(f['frame']) - 1, 'CUTS/%s.png' % s['runtime_target'], tuple(int(v) for v in f['destination_atlas_xywh']))
                    for s in fm['sheets'] for f in s['frames']]
        if 'sheets' in fm and 'native_atlas' in fm['sheets'][0]:   # (the crawler hand, 11-18: `sheets` by `person`, each frame's cell in the art desk's own
            # native atlas NATIVE-ATLASES/<its native_atlas>, the same grid as the agent's)
            return [('folk%s_crawlerhand_p1' % s['person'], s['facing'], s['action'], int(f['frame']) - 1, 'NATIVE-ATLASES/' + s['native_atlas'],
                     tuple(int(v) for v in f['atlas_cell_xywh'])) for s in fm['sheets'] for f in s['frames']]
        if 'sheets' in fm and 'source_png' in fm['sheets'][0]:   # (the gambler's and barkeep's redraws, 11-16: `sheets` map each row to its
            # illustrated source; the art desk's own native cut of that row is 02-native-rows/<the source's name>-1X.png, a transparent strip of cells)
            return [(s['target'], s['facing'], s['action'], f['frame_index'], '02-native-rows/' + os.path.basename(s['source_png'])[:-4] + '-1X.png',
                     (f['frame_index'] * 72, 0, 72, 64)) for s in fm['sheets'] for f in s['frames']]
        if 'sheets' in fm:                      # (the light crew's: `sheets`, each frame's `index` and `cell_source_xywh`)
            return [(s['runtime_target'], s['facing'], s['action'], f['index'], s['file'], tuple(f['cell_source_xywh'])) for s in fm['sheets'] for f in s['frames']]
        if 'registered_row' in fm['pages'][0]:  # (the scraper's redraw: each row a transparent strip of cells, the art desk's own native cut)
            return [(p['runtime_target'], p['facing'], p['action'], f['frame'] - 1, p['registered_row'], ((f['frame'] - 1) * 72, 0, 72, 64)) for p in fm['pages'] for f in p['frames']]
        return [(p['target'], p['facing'], p['row'], f['frame'] - 1, p['png'], tuple(f['source_rect_xywh'])) for p in fm['pages'] for f in p['frames']]   # (the scraper's: `pages`)
    out = []
    for r in csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8')):   # (a row a frame; its columns named four ways so far)
        if r.get('native_offset_xy'):   # (the crew boss's redraw, 11-18: one map for its three figures; the art desk's native cut of a row is
            # <its folder>/NATIVE-PREVIEWS/<view>-<its row>-1X.png, a transparent strip of cells -- its folder the illustrated source's (WORLD-MAN,
            # WORLD-WOMAN, FIGHT-MAN), its row the art desk's name (the Mace, the Fall; Prone its own one-cell strip, the Fall's last pose)
            w, h = int(r['cell_width']), int(r['cell_height'])
            row = {'attack': 'mace', 'hurt': 'fall'}.get(r['action'], r['action'])
            out.append((r['target'], r['facing'], r['action'], int(r['frame_index']), '%s/NATIVE-PREVIEWS/%s-%s-1X.png' % (r['source_png'].split('/')[0], r['facing'], row),
                        (int(r['frame_index']) * w, 0, w, h)))
            continue
        if r.get('native_png'):         # (the drive spear, 11-18: each frame's own cell in the art desk's native strip, named)
            out.append((r['runtime_target'], r['facing'], r['action'], int(r['frame_index']), r['native_png'],
                        (int(r['native_x']), int(r['native_y']), int(r['cell_width']), int(r['cell_height']))))
            continue
        g = lambda *ks: next(r[k] for k in ks if r.get(k) not in (None, ''))
        idx = int(g('frame_index', 'index')) if any(r.get(k) not in (None, '') for k in ('frame_index', 'index')) else int(g('frame_1based', 'frame', 'frame_number')) - 1
        out.append((g('target', 'runtime_target', 'runtime'), r['facing'], g('action', 'row', 'runtime_row'), idx, g('source_page', 'source_png', 'png', 'cut_sheet'),
                    (int(g('crop_x', 'x')), int(g('crop_y', 'y')), int(g('crop_w', 'crop_width', 'width')), int(g('crop_h', 'crop_height', 'height')))))
    return out


REDS = None


def unred(fr, rows):
    """a native cut's red and fire moved to the nearest of the other colours in Lab, in place: everywhere (`rows` 0), or only in the top
    `rows` rows of the figure, crown down (the face: a red neckcloth below it kept) -- the art desk's snap gives a nose or a cheek the
    lightest red or orange, a clown's nose at game size (the 10-29 cutters' "avoid red and fire", on a page already on the 64)"""
    global REDS
    if REDS is None:
        REDS = {tuple(int(v) for v in c) for c, r in zip(pix.PAL_RGB, pix.PAL_RAMP) if r in ('red', 'fire')}
    op = fr[..., 3] > 0
    if not op.any():
        return
    top = int(np.where(op.any(1))[0][0])
    band = np.zeros(op.shape, bool)
    band[top:top + rows if rows else None] = True
    hit = op & band & np.array([[tuple(c) in REDS for c in row] for row in fr[..., :3]])
    if hit.any():
        fr[hit, :3] = pix.snap(fr[hit, :3][None].astype(np.float32) / 255, ['red', 'fire'])[0]


LIME_REDBAND = (330, 360, 0.25)        # (red and fire only on a crimson: hue from, to, and the least saturation)
LIME_CLOTH = 0.55                      # (under this saturation a pale cloth, kept off skin and gold too)


def house_colours(rgb):
    """reduced colours (0-1) -> the 64 by the house's two rules: red and fire only on a crimson; a pale cloth kept off skin and gold too"""
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    hue = np.where(mx == rgb[..., 0], ((rgb[..., 1] - rgb[..., 2]) / d) % 6,
                   np.where(mx == rgb[..., 1], (rgb[..., 2] - rgb[..., 0]) / d + 2, (rgb[..., 0] - rgb[..., 1]) / d + 4)) * 60
    lo, hi, smin = LIME_REDBAND
    sat = (mx - mn) / np.maximum(mx, 1e-6)
    crim = (hue >= lo) & (hue < hi) & (sat > smin)
    return np.where(crim[..., None], pix.snap(rgb),
                    np.where((sat < LIME_CLOTH)[..., None], pix.snap(rgb, ['red', 'fire', 'skin', 'gold']), pix.snap(rgb, ['red', 'fire'])))


def lime_frame(a, rw, rh):
    """one illustrated pose on the lime ground -> RGBA at rw x rh, every colour one of the 64 (the module's head: the art desk's recipe,
    despilled, red kept to the crimson)"""
    c = a.astype(np.int32)
    keyed = (c[..., 1] > 65) & (c[..., 1] > 1.27 * np.maximum(c[..., 0], c[..., 2]) + 9)
    lab, n = ndimage.label(~keyed, structure=np.ones((3, 3)))
    if not n:
        raise SystemExit('no figure in the window')
    m = lab == 1 + int(np.argmax(ndimage.sum(~keyed, lab, range(1, n + 1))))
    cap = np.maximum(c[..., 0], c[..., 2])
    c[..., 1] = np.where(m & (c[..., 1] > cap), cap, c[..., 1])             # (the despill)
    rgba = np.dstack([c.astype(np.uint8), (m * 255).astype(np.uint8)])
    r = np.asarray(Image.fromarray(rgba, 'RGBA').resize((rw, rh), Image.LANCZOS)).astype(np.float32)
    rgb, solid = r[..., :3] / 255, r[..., 3] >= 123
    sn = house_colours(rgb)
    out = np.zeros((rh, rw, 4), np.uint8)
    out[solid, :3] = sn[solid]; out[solid, 3] = 255
    return out


def lime_frames(d, fw, fh):
    """a redraw's frames -> [(sheet, view, row, index, RGBA cell)], placed where the art desk's map says"""
    pages, out = {}, []
    for r in csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8')):
        p = r['source']
        if p not in pages:
            pages[p] = np.asarray(Image.open(os.path.join(d, p)).convert('RGB'))
        x0, y0, x1, y1 = (int(r[k]) for k in ('crop_left', 'crop_top', 'crop_right_exclusive', 'crop_bottom_exclusive'))
        rw, rh, nx, ny = (int(r[k]) for k in ('resize_w', 'resize_h', 'native_x', 'native_y'))
        if nx < 0 or ny < 0 or nx + rw > fw or ny + rh > fh:
            raise SystemExit('%s %s %s: placed outside the cell' % (r['target'], r['facing'], r['frame']))
        cell = np.zeros((fh, fw, 4), np.uint8)
        cell[ny:ny + rh, nx:nx + rw] = lime_frame(pages[p][y0:y1, x0:x1], rw, rh)
        out.append((r['target'], r['facing'], r['action'], int(r['frame']) - 1, cell))
    return out


def illus_frames(d, fw, fh, special):
    """an illustrated redraw on the navy with no native cut -> [(sheet, view, row, index, RGBA cell)]: the art desk's crop, key, reduction and
    place (the module's head), the house's colours; `special` {page: (edge columns from the left, holes under this filled)}"""
    pages, out = {}, []
    for e in json.load(open(os.path.join(d, 'FRAME-MAP.json'), encoding='utf-8')):
        p = e['source_png']
        if p not in pages:
            pages[p] = np.asarray(Image.open(os.path.join(d, p)).convert('RGB')).astype(np.int32)
        x, y, w, h = e['source_xywh']
        c = pages[p][y:y + h, x:x + w]
        left, holes = special.get(os.path.basename(p), (None, 0))
        edge = c[:, :left] if left else np.concatenate([c[:, :3], c[:, -3:]], 1)
        navy = np.median(edge.reshape(-1, 3), axis=0)
        fg = np.abs(c - navy).max(-1) > 10
        lab, n = ndimage.label(fg)
        if not n:
            raise SystemExit('%s: no figure in the window' % p)
        keep = lab == 1 + int(np.argmax(ndimage.sum(fg, lab, range(1, n + 1))))
        if holes:
            hl, hn = ndimage.label(ndimage.binary_fill_holes(keep) & ~keep)
            for k, sz in enumerate(ndimage.sum(hl > 0, hl, range(1, hn + 1)), 1):
                if sz < holes:
                    keep |= hl == k
        rw, rh = e['reduce_wh']
        px, py = e['paste_xy'][:2]
        if px < 0 or py < 0 or px + rw > fw or py + rh > fh:
            raise SystemExit('%s %s %s %d: placed outside the cell' % (e['runtime_target'], e['facing'], e['runtime_row'], e['frame_1based']))
        r = np.asarray(Image.fromarray(np.dstack([c.astype(np.uint8), (keep * 255).astype(np.uint8)]), 'RGBA').resize((rw, rh), Image.BOX)).astype(np.float32)
        solid = r[..., 3] >= 124
        sn = house_colours(r[..., :3] / 255)
        cell = np.zeros((fh, fw, 4), np.uint8)
        cell[py:py + rh, px:px + rw][solid, :3] = sn[solid]
        cell[py:py + rh, px:px + rw][solid, 3] = 255
        out.append((e['runtime_target'], e['facing'], e['runtime_row'], int(e['frame_1based']) - 1, cell))
    return out


def cut(costume):
    """-> {sheet name: {row: [8 facings of [RGBA frames]]}}. A fight piece says its own `cell` (fw, fh, ax, ay), its `targets` {the art
    desk's target: the sheet} and its `rows` [(the art desk's row, the sheet's row, frames, fps, release)]; a costume takes folkman_p1's"""
    P = PIECES[costume]
    fw, fh, ax, ay = P.get('cell', (FW, FH, AX, AY))
    names = P.get('targets') or {'folkman_%s_p1' % costume: 'folkman_%s_p1' % costume, 'folkwoman_%s_p1' % costume: 'folkwoman_%s_p1' % costume}
    rowmap = {r[0]: (r[1], r[2]) for r in P['rows']} if P.get('rows') else {an: (an, n) for an, n in COUNT.items()}
    d = os.path.join(AD.src_dir(ROOT), 'folkcostumes', P['folder'])
    pal, got, pages = palette(), {}, {}
    if P.get('lime') or P.get('illus'):
        for name, v, an, idx, fr in (illus_frames(d, fw, fh, P['illus']) if P.get('illus') else lime_frames(d, fw, fh)):
            if name not in names or an not in rowmap:
                raise SystemExit('a frame for %s %s, not %s' % (name, an, costume))
            off = {tuple(c) for c in fr[fr[..., 3] > 0][:, :3]} - pal
            if off:
                raise SystemExit('%s %s %s %d: %d colours off the 64' % (name, v, an, idx + 1, len(off)))
            got.setdefault(names[name], {}).setdefault(v, {}).setdefault(rowmap[an][0], {})[idx] = fr
    for name, v, an, idx, page, (x, y, w, h) in ([] if P.get('lime') or P.get('illus') else frames_of(d)):
        if name not in names and P.get('shared'):
            continue
        if name not in names:
            raise SystemExit('%s: a frame for %s, not %s' % (page, name, costume))
        if an not in rowmap:
            raise SystemExit('%s: a row %s the piece does not name' % (page, an))
        name, an = names[name], rowmap[an][0]
        if page not in pages:     # (with its alpha: the scraper redraw's rows are transparent; an opaque page's alpha is 255 throughout)
            pages[page] = np.asarray(Image.open(os.path.join(d, P.get('pages', ''), page)).convert('RGBA'))
        a, k = pages[page], w // fw
        if (w, h) != (fw * k, fh * k):
            raise SystemExit('%s %s %d: a window of %dx%d, not %d x the cell' % (page, an, idx + 1, w, h, k))
        win = a[y:y + h, x:x + w]
        sm = win[k // 2::k, k // 2::k]
        if (np.repeat(np.repeat(sm, k, 0), k, 1) != win).any():
            raise SystemExit('%s %s %d: not an exact %dx page' % (page, an, idx + 1, k))
        fg = sm[..., 3] > 0
        if P.get('navy'):
            fg &= (sm[..., :3] != P['navy']).any(-1)
        sm = sm[..., :3]
        off = {tuple(c) for c in sm[fg]} - pal
        if off:
            raise SystemExit('%s %s %d: %d colours off the 64 (%s)' % (page, an, idx + 1, len(off), sorted(off)[:4]))
        fr = np.zeros((fh, fw, 4), np.uint8)
        fr[fg, :3] = sm[fg]; fr[fg, 3] = 255
        u = P.get('unred')
        u = u.get(name) if isinstance(u, dict) else u
        if u is not None:
            unred(fr, u)
        got.setdefault(name, {}).setdefault(v, {}).setdefault(an, {})[idx] = fr
    counts = {sr: n for sr, n in rowmap.values()}
    out = {}
    for name, views in got.items():
        if set(views) != {'S', 'SE', 'E', 'NE', 'N'}:
            raise SystemExit('%s: views %s, not the five' % (name, sorted(views)))
        for v in views:
            for an, n in counts.items():
                if sorted(views[v].get(an, {})) != list(range(n)):
                    raise SystemExit('%s %s %s: frames %s, not %d' % (name, v, an, sorted(views[v].get(an, {})), n))
                views[v][an] = [views[v][an][i] for i in range(n)]
        if P['stand']:
            for v, rows in views.items():               # each view stood on its Idle 1's lowest row
                foot = int(np.where(rows['idle'][0][..., 3].any(axis=1))[0][-1])
                dy = ay - foot
                if dy:
                    for an in rows:
                        for i, fr in enumerate(rows[an]):
                            if dy > 0 and fr[fh - dy:, :, 3].any():
                                raise SystemExit('%s %s %s %d: cut off by the stand' % (name, v, an, i + 1))
                            rows[an][i] = np.roll(fr, dy, axis=0)
                    print('  %s %s: stood %+d px (its Idle 1 on row %d)' % (name, v, dy, ay))
        out[name] = {an: [[mirror(fr) for fr in views[MIRROR[f]][an]] if f in MIRROR else views[f][an] for f in ORDER] for an in counts}
    return out


if __name__ == '__main__':
    for costume in (sys.argv[1:] or list(PIECES)):
        P = PIECES[costume]
        fw, fh, ax, ay = P.get('cell', (FW, FH, AX, AY))
        fps = {r[1]: r[3] for r in P['rows']} if P.get('rows') else FPS
        rel = {r[1]: r[4] for r in P.get('rows', []) if r[4] is not None}
        for name, frames in sorted(cut(costume).items()):
            pix.write_sheet(name, frames, fw, fh, ax, ay, pix.top_of(frames['idle'][0] + frames['idle'][6], ay))   # (S and E, as tools/townsfolk-sheet.py's)
            mp = os.path.join(ROOT, 'deep16', 'art', name + '.json')
            meta = json.load(open(mp))
            for an, f in fps.items():
                meta['anims'][an]['fps'] = f
            for an, r in rel.items():
                meta['anims'][an]['release'] = r
            meta['source'] = 'drawn by the art desk (%s), cut by tools/folk-costume-sheet.py (11-15)' % P['name']
            json.dump(meta, open(mp, 'w'), indent=1)

"""DEEP16 pipeline 2 (generated art): the Dominion's patrol lady fighting -> dmlady_p2, all eight facings, and her three patrons' trims ->
dmladyfiend_p2, dmladymirror_p2, dmladyfae_p2.

    python tools/dmlady-sheet.py            (writes deep16/art/dmlady_p2 and the three patron sheets)
    python tools/dmlady-sheet.py check      (also the review sheet, deep16/art-src/dmlady/dmlady_p2-review.png)
    python tools/dmlady-sheet.py frames     (each frame's box, boots, crown to boots, each page's scale, every loose piece)

Asked in art-wanted section 101 (11-25, on his "Have the ask for the single wagon lady do a trim (white?) that the cutter can color as patron appropriate
(rather than special effect) on the cut sprites (like we did with gnolls)"): the Dominion's patrol lady, the CHAINMAIL warlock of every Dominion wagon --
black coat, rapier in her right hand, a small mirror at her left hip that she presents to cast. Drawn by the art desk as ART-165 (its CUTTER-HANDOFF,
landed in Fresh 11-25, sorted to deep16/_src/patrollady/2026-11-25-ART-165-PATROL-LADY/, the zip beside it); cut 11-25 by the cutter seat cutter-1125b.
Its CUTTER-NOTES: HEAD 1 S, 2 SE, 3 E, 4 rear NE, 5 N, SW W NW the mirrors (RULED 10-14); Idle 4, Walk 8, Cast 6 (the mirror presented, printed 4: index
3), Attack 8 (the rapier, index 3), Flinch 4, Fall 6 (hurt), Prone 1; "about 50 px from crown to sole"; her trim -- piping, cuffs, sash -- drawn WHITE
("#FFFFFF is the cloth key"), its fold a separate slate shade, for the cutter to recolour by patron.

HELD BY THE ART DESK AND CUT AS DRAWN: her SE, E and rear NE Walks (the lead change between 1 and 5 ambiguous after redraws), on his ruling of 11-25,
"yes - cut what we have, dreamlist what needs revised" -- their gaits on deep16-dream-polish.md.

THE CUT: tools/mender-sheet.py's reader and windows (each page read whole, its printed labels dropped, each upright frame on its boots, each lying one on
its lowest row; the idle page by its idle to TALL, every other page by frame 1's crown to boots to its view's idle; her drawn prones by width to their
Fall 6) over tools/vivian-sheet.py.

THE TRIMS (his "4 - Let the cutter propose the colors as well, it has the palette"): at 1x her shaded trim and her steel snap to the same silvers, so
the trim is found on the SOURCE pages (trim_mask(): the exact #FFFFFF key, grown at most REACH page px through light, neutral-or-slate pixels -- never
warm, her face's highlights), painted MARK -- her cuffs apart, CUFF_MARK (the compact white pieces at her wrists, CUFF) -- cut again by the same
windows and page scales, and read back where each mark landed. RULED 11-25, Griz, on the first trims (the whole trim in the patron's colour) set beside
the sergeant: "the patron flavor is too much. It kinda feels like just the cuffs should patron - something small, with more dominion unity overall". So
each patron's sheet is dmlady_p2 with her sash, collar and piping in the sergeant's crimson (DOMINION) and only her cuffs, by their own lightness, in a
ramp of the 64 (TRIM): the Fiend (Savine's) red, the Mirror (the Old One's) the glass's cyan, the Fae King (Tronupholen's, the Trickster,
"Purple-skinned", TarlynsPit/wiki/dominion.md) violet. dmlady_p2 keeps the white. Known: where her rapier's highlights are drawn in the key's exact
white -- lying beside her at the end of her E and SE falls, and its tip raised on her NE attack's first frame -- the blade takes the crimson; and a cuff
that runs into her piping reads crimson in a few frames (the dream list).
"""
import csv, importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_old = sys.argv; sys.argv = sys.argv[:1]
_sp = importlib.util.spec_from_file_location('mender_sheet', os.path.join(ROOT, 'tools', 'mender-sheet.py'))
MS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(MS)
sys.argv = _old
DM, DG, VS, VIEWS = MS.DM, MS.DG, MS.VS, MS.VIEWS

_is_text = MS.is_text


def caption(px, h):
    """ART-165 prints a grey caption under every frame ("5", "FOLLOW-THROUGH"), a cool mid-grey -- (124, 126, 137) on the mean, bluer than red, which
    mender-sheet's cream test passes by, so the reader joined them to the frames and stood frames on them: at most 60 tall, grey within 15 between its
    channels on the mean (the captions read 8 to 14), 95 to 165 at its darkest. Her steel reads 18 to 22 between its channels: at 22 the first try took
    her rapier, lying where it fell on the SE Fall and Prone, for words and dropped it"""
    px = px[px.min(1) >= 60]                                    # (its glyphs' core: the mask at BGTOL 12 carries a navy rim, bluer and darker)
    if h > 60 or len(px) < 20:
        return False
    c = px.mean(0)
    return (px.max(1) - px.min(1)).mean() < 15 and 95 <= px.min(1).mean() <= 165 and c.max() - c.min() < 22


MS.is_text = lambda px, h: _is_text(px, h) or caption(px, h)     # (read_page and untext look it up at call time)
SRC, BATCH = 'patrollady', '2026-11-25-ART-165-PATROL-LADY'
N = {'idle': 4, 'walk': 8, 'cast': 6, 'attack': 8, 'flinch': 4, 'hurt': 6, 'prone': 1}
TALL = 49        # (crown row to boots: "about 50 px from crown to sole" -- the mender's 47 stands 48)
BGTOL = int(os.environ.get('DMLADY_BGTOL', '12'))    # (her black coat sits near the navy matte, as the sergeant's plate: his 12)
AVOID = ['fire', 'blue', '#14171e', '#20252f', '#313846']   # (the mender's: her black coat kept off silver's navy darks)
HEADS, NOTES = {}, {}
TRIM = {'dmladyfiend_p2': ('Patrol Lady (the Fiend)', 'red', ['#e8624a', '#b83428', '#801c1c']),
        'dmladymirror_p2': ('Patrol Lady (the Mirror)', 'glow', ['#a8e8ff', '#3cbcfc', '#1a5c80']),
        'dmladyfae_p2': ('Patrol Lady (the Fae King)', 'violet', ['#bb96e0', '#8a5cb4', '#62398a'])}
MARK = (0, 255, 0)   # (her trim painted on the source copies: it snaps to the 64's greens, which nothing of hers wears)
CUFF_MARK = (0, 255, 255)   # (her cuffs painted apart: they snap to the glow ramp's cyans, which nothing of hers wears either)
DOMINION = ['#801c1c', '#4c1010', '#240808']   # (her sash, collar and piping: the sergeant's crimson, dmsergeant_p2's sash -- Griz, 11-25: "the patron
                                               #  flavor is too much. It kinda feels like just the cuffs should patron - something small, with more
                                               #  dominion unity overall")
CUFF = (60, 0.5, 1.8)       # (source: a cuff is a white piece of at least this many px, filling at least this much of its box, at most this long for its
                            #  width -- two compact bands at her wrists; the sash runs diagonal (fill ~0.37), the piping long and thin)
LIGHT = 120          # (source: the slate shade joined to the white key -- at least this light at its darkest channel, within 70 between its channels)
REACH = 30           # (source px: how far that shade reaches from the white -- across the sash at ~6 page px a game px; at 48 it ran along her rapier where the blade crosses the sash)
LIT, MID, SHADE = 200, 130, 80   # (1x, a trim pixel's mean channel: the patron's lit, mid and shade)


def plan():
    """[(view, row, file)] from the FRAME-MAP: every page, the art desk's held walks too (his "cut what we have")"""
    rows = list(csv.DictReader(open(os.path.join(VS.pix.SRC, SRC, BATCH, 'FRAME-MAP.csv'), encoding='utf-8-sig')))
    pages = {}
    for r in rows:
        pages[(r['facing'], r['engine_row'], r['source'])] = 1
    return sorted(pages, key=lambda p: (VIEWS.index(p[0]), list(N).index(p[1])))


def register(overlay=False):
    global _W, PS
    DG.BGTOL = BGTOL
    ov = MS.overlay_to(os.path.join(ROOT, 'deep16', 'art-src', 'dmlady', 'overlay')) if overlay else None
    _W = MS.windows(SRC, BATCH, plan(), N, HEADS, notes=NOTES, overlay=ov) if os.path.isdir(os.path.join(VS.pix.SRC, SRC, BATCH)) else []
    PS = DM.scales(HEADS, N, two=()) if _W else {}
    VS.LOOKS['dmlady_p2'] = dict(LOOK, windows=_W, pagescale=PS)


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def trim_mask():
    """her trim at 1x, as a mask over deep16/art/dmlady_p2: found on the SOURCE pages, where it is the white cloth key and the slate shade joined to it
    through no dark outline (her rapier and mirror are outlined apart), painted MARK, cut again by the same windows into a scratch copy of the batch, and
    read back where the mark landed. At 1x her steel and her shaded trim snap to the same silvers, so no colour rule there can part them (the first
    try's rapier took the patron's colour where it hung over her coat, and the hem piping stayed grey)"""
    import shutil, tempfile
    art = os.path.join(ROOT, 'deep16', 'art')
    keep = {x: open(os.path.join(art, 'dmlady_p2' + x), 'rb').read() for x in ('.png', '.json')}
    tmp = tempfile.mkdtemp(prefix='dmlady-mark-')
    d0, d1 = os.path.join(VS.pix.SRC, SRC, BATCH), os.path.join(tmp, SRC, BATCH)
    for view, row, fn in plan():
        a = np.asarray(Image.open(os.path.join(d0, fn)).convert('RGBA')).copy()
        rgb = a[..., :3].astype(int); mn, mx = rgb.min(-1), rgb.max(-1)
        white = mn == 255                                          # (the key exactly, #FFFFFF: at 225 the steel's own highlights seeded it, and her
                                                                   #  fallen rapier on the SE Fall took the patron's colour its whole length)
        light = (mn >= LIGHT) & (mx - mn <= 70) & (rgb[..., 2] >= rgb[..., 0] - 12)   # (neutral or slate, never warm: her face's pale highlights join her
                                                                                     #  white collar, and the first mask took a patch of her cheek)
        lab, n = ndimage.label(white, structure=np.ones((3, 3)))
        cuffw = np.zeros_like(white)
        for i, sl in enumerate(ndimage.find_objects(lab), 1):
            pc = lab[sl] == i; h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            if pc.sum() >= CUFF[0] and pc.sum() >= CUFF[1] * h * w and max(h, w) <= CUFF[2] * min(h, w):
                cuffw[sl] |= pc
        done = np.zeros_like(white)
        for seed, col in ((cuffw, CUFF_MARK), (white & ~cuffw, MARK)):   # (the cuffs grown first, then the rest of her trim)
            trim, edge = seed.copy(), seed.copy()
            for _ in range(REACH):                                # (the shade grown from the white through light pixels, at most REACH page px: where
                edge = ndimage.binary_dilation(edge, np.ones((3, 3), bool)) & light & ~trim & ~done   #  her fallen rapier lies against a cuff, only its
                trim |= edge                                      #  touching end goes)
            a[trim & ~done, :3] = col; done |= trim
        os.makedirs(os.path.dirname(os.path.join(d1, fn)), exist_ok=True)
        Image.fromarray(a, 'RGBA').save(os.path.join(d1, fn))
    shutil.copy(os.path.join(d0, 'FRAME-MAP.csv'), d1)
    old = VS.pix.SRC
    HEADS.clear(); NOTES.clear(); register(); ps0 = dict(PS)      # (the plain pages' scales: a crown reads by colour -- white trim counts as steel,
    try:                                                          #  green does not -- so the marked pages keep the plain ones' scale, frame for frame)
        VS.pix.SRC = tmp; HEADS.clear(); NOTES.clear(); register(); VS.LOOKS['dmlady_p2']['pagescale'] = ps0; VS.cut('dmlady_p2')
        mk = np.asarray(Image.open(os.path.join(art, 'dmlady_p2.png')).convert('RGBA')).copy()
    finally:
        VS.pix.SRC = old; HEADS.clear(); NOTES.clear()
        for x, b in keep.items():
            open(os.path.join(art, 'dmlady_p2' + x), 'wb').write(b)
        shutil.rmtree(tmp, ignore_errors=True)
    im = np.asarray(Image.open(os.path.join(art, 'dmlady_p2.png')).convert('RGBA'))
    assert mk.shape == im.shape and ((mk[..., 3] > 0) == (im[..., 3] > 0)).all(), 'the marked cut is not registered with the plain one'
    g = mk[..., :3].astype(int); on = mk[..., 3] > 0
    rest = on & (g[..., 1] - np.maximum(g[..., 0], g[..., 2]) >= 8)   # (where the mark landed: the 64's greens, the orc and moss ramps and #2a7a70 --
                                                                      #  not "differs", since the snap shifts her coat's darks too)
    cuff = on & (g[..., 2] - g[..., 0] >= 60) & (g[..., 1] - g[..., 0] >= 50)   # (the cuffs' mark: the glow cyans; her silvers are 30 bluer than red at most)
    return cuff, rest & ~cuff


def trims():
    """the three patron sheets from deep16/art/dmlady_p2: her trim (trim_mask()) moved to each patron's ramp by its own lightness -- lit, mid, shade;
    a trim pixel darker than SHADE (its edge blended into her coat) left as it is"""
    art = os.path.join(ROOT, 'deep16', 'art')
    cuff, rest = trim_mask()
    im = np.asarray(Image.open(os.path.join(art, 'dmlady_p2.png')).convert('RGBA')).copy()
    meta = json.load(open(os.path.join(art, 'dmlady_p2.json')))
    L = im[..., :3].astype(int).mean(-1)
    lv = lambda m: [m & (L >= LIT), m & (L >= MID) & (L < LIT), m & (L >= SHADE) & (L < MID)]
    for name, (label, ramp, cols) in TRIM.items():
        o = im.copy()
        for k, c in zip(lv(rest), DOMINION):
            o[k, :3] = hexrgb(c)
        for k, c in zip(lv(cuff), cols):
            o[k, :3] = hexrgb(c)
        Image.fromarray(o, 'RGBA').save(os.path.join(art, name + '.png'), optimize=True)
        m2 = dict(meta, name=label, source=meta.get('source', '') + ' -- her trim (the white key and its slate shade, found on the source pages) in the '
                  'Dominion\'s crimson %s, her cuffs in the %s ramp %s for %s, by tools/dmlady-sheet.py trims()' % (', '.join(DOMINION), ramp, ', '.join(cols),
                  label.split('(')[1].rstrip(')')))
        json.dump(m2, open(os.path.join(art, name + '.json'), 'w'), indent=1)
    print('  trims: %d px crimson, %d px cuffs, into %s' % (int(sum(k.sum() for k in lv(rest))), int(sum(k.sum() for k in lv(cuff))), ', '.join(TRIM)))


LOOK = dict(src=SRC, name='Patrol Lady', trim=False, tall=TALL, avoid=AVOID, bgtol=BGTOL,
    match=dict({r: ('idle', 0) for r in N if r not in ('idle', 'prone')}, prone=('hurt', 5, 0, 'w')),   # (every page by PS, her drawn prones by width to Fall 6)
    ground=MS.LYING,
    rows=[('idle', 4, 4), ('walk', 10, 8), ('cast', 10, 6), ('attack', 12, 8), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
    release={'cast': 3, 'attack': 3},
    hold=['walk: SE, E and rear NE (and their mirrors) as drawn, held by the art desk (the lead change between 1 and 5 ambiguous after redraws), cut on his '
          '"yes - cut what we have, dreamlist what needs revised"; their gaits on deep16-dream-polish.md',
          'cast: the mirror lifted from her left hip and presented by her left hand on frame 4 (`release` 3) -- every spell of hers plays it; no flash drawn',
          'attack: the rapier in her right hand, home on frame 4 (`release` 3)',
          'prone: as drawn, matched by width to her Fall 6',
          'her trim white here; tools/dmlady-sheet.py trims() writes her three patrons\' sheets from this one'],
    source='drawn by the art desk (ART-165, 11-25: art-wanted section 101, the Dominion\'s patrol lady, rapier and mirror, her trim in white, five views), '
           'cut by tools/dmlady-sheet.py over tools/mender-sheet.py\'s reader and tools/vivian-sheet.py; SW W NW mirrored')

if __name__ == '__main__':
    register(overlay='overlay' in sys.argv)
    if 'frames' in sys.argv:
        for w in _W:
            h = HEADS.get(w[1:4])
            print(w[1], w[2], w[3], 'box', w[6], 'boots', w[7], 'crown-to-boots', h[1] if h else '-', 'head', h[2] if h else '-')
        for pg, k in sorted(PS.items()):
            print('pagescale', pg[1], round(k, 4))
        for fn, nt in sorted(NOTES.items()):
            print(fn, '|', '; '.join(nt)[:300])
    elif 'overlay' not in sys.argv:
        VS.cut('dmlady_p2')
        trims()

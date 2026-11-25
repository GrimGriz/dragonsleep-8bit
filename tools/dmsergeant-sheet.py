"""DEEP16 pipeline 2 (generated art): the Dominion's sergeant fighting, one man in his two kits -> dmsergeant_p2 (the greatsword) and dmsergeantshield_p2 (the
longsword and shield), all eight facings.

    python tools/dmsergeant-sheet.py [dmsergeant_p2|dmsergeantshield_p2]          (writes deep16/art/<name>.png/.json; both with no name)
    python tools/dmsergeant-sheet.py [name] check     (also the review sheet, deep16/art-src/dmsergeant/<name>-review.png)
    python tools/dmsergeant-sheet.py [name] frames    (each frame's box, boots, crown to boots and head, each page's scale, every loose piece)
    python tools/dmsergeant-sheet.py [name] overlay   (each page with its frames tinted, at a third, to deep16/art-src/dmsergeant/overlay/)

Asked in art-wanted section 99 (11-24, the seat dominion-1124, on his "I don't want to art request a sergeant variant - we could add combat rows to the sergeant we're
already requesting"): ONE sergeant, one face, the two kits his page The Fare Home gives the two sergeants "who despise each other" -- the greatsword (the Blade,
data/foes.js sergeantblade) and the longsword and shield (the Ledger, sergeantledger). Drawn by the art desk as ART-163: its PAGE 3 (GREATSWORD-CUTTER-HANDOFF) and
PAGE 4 (LONGSWORD-SHIELD-CUTTER-HANDOFF), landed in Fresh 11-25, sorted to deep16/_src/dmsergeant/2026-11-25-ART-163-GREATSWORD/ and -LONGSWORD-SHIELD/, each zip
beside its folder; cut 11-25 by the cutter seat cutter-1125. Its CUTTER-NOTES: HEAD 1 S, 2 SE, 3 E, 4 rear NE, 5 N, SW W NW the mirrors (RULED 10-14); a page an
action: Idle 4, Walk 8, Attack 8 (contact on frame 4: `release` 3, the house's), the shield kit's Shield Wall Push 6 (`push`, the shove on 4 -- deep16/js/features.js
THE PUSH plays a sheet's `push`), Flinch 4, Fall 6 (hurt), Prone 1 ("a literal crop of its own Fall 6 endpoint": Fall 6 held here, the same pixels); "about 53 pixels
sole to crown", beside the installed guard atlas -- the line soldier's TALL. The handaxe stowed at his right hip in the greatsword kit (the Blade throws it, though
data/foes.js gives him no thrown blow yet).

WHAT IS HELD (each zip's art-hold/: "The three held sheets need a fresh eight-phase gait before cutting"; the shield kit's four): the walks of SE, E and rear NE in
the greatsword kit, and SE, E, NE and N in the shield kit (frames 1 and 5 the same lead). Not cut: the walk is each kit's drawn walk where it was cleared (the
greatsword's S and N, the shield's S) and elsewhere his own idle in that view played twice, as the mender's (tools/mender-sheet.py WALK_IDLE) -- he glides facing the
way he goes till the redraws come. THE REDRAWS CAME 11-25 (art-wanted 104; each kit's CUTTER-HANDOFF again, its "November 25 Walk redraws"): SE and E in both kits
and N with the shield, drawn anew; the rear NE in both "included as drawn" on Griz's approval (its gait redraw deferred to the dream list, the NW mirror with
it). Sorted into the same batches by the cutter seat cutter-1125b (the held pages and the old FRAME-MAPs to their superseded/); walk_idle empty in both kits.

The cut is tools/mender-sheet.py's reader (read_page, windows) over tools/vivian-sheet.py: each page read whole, the printed numbers dropped (those printed
within 6 px of his boots too), every loose piece to the nearest frame (a blade's tip); each upright frame on its boots, each lying one on its lowest row; the
idle page by its idle to TALL, crown to boots with the crown the first run CROWN wide that is not steel (dragger-sheet head(); a greatsword held up before his
helmet is not his crown) handed to vivian-sheet as each window's 9th; every other page by frame 1's crown to boots to its view's idle. Checked at game size:
his helmet's top 53 to 54 above his foot in S, SE, E and NE beside the line soldier's 52 to 53 (the art desk's "about 53"), and N the same once the hilt raised
over his head is set aside.
"""
import importlib.util, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_old = sys.argv; sys.argv = sys.argv[:1]
_sp = importlib.util.spec_from_file_location('mender_sheet', os.path.join(ROOT, 'tools', 'mender-sheet.py'))
MS = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(MS)
sys.argv = _old
DM, DG, VS, VIEWS = MS.DM, MS.DG, MS.VS, MS.VIEWS

SRC = 'dmsergeant'
TALL = 52        # (crown row to boots, as the line soldier dominion_p2 -- the helmet's dome adds a pixel: the art desk's "about 53 pixels sole to crown")
BGTOL = int(os.environ.get('DMSERGEANT_BGTOL', '12'))   # (his black plate sits near the navy, as the line soldier's: dominion-sheet's 12)
AVOID = ['fire', 'blue', '#14171e', '#20252f', '#313846', '#170d22', '#2a1840']   # (his black plate, his 09-27 "as if it was black armor": its darkest shades sit
                 #  between the stone browns and silver's navy greys, more toward the greys on some pages -- the shield kit's SE and E Attack drawn plum-violet -- and
                 #  the snap kept the split, his plate flickering navy from row to row. Without them every page snaps to the outline black and the stone browns, the
                 #  trim crimson)
CROWN = 50       # (source px: his crown the first run this wide that is not steel -- at dragger-sheet's 30 the greatsword's blade, held up before him in his idle
                 #  and his flinch with its dark rim, read as his crown: a "head" 38 wide where his helmet is 90 to 110)
KITS = {
    'dmsergeant_p2': dict(batch='2026-11-25-ART-163-GREATSWORD', name='Sergeant (the Blade)',
                          N={'idle': 4, 'walk': 8, 'attack': 8, 'flinch': 4, 'hurt': 6, 'prone': 1},
                          walk_idle=(),           # (11-25b: SE and E redrawn, rear NE cut as drawn on his approval -- art-wanted 104)
                          rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
                          release={'attack': 3},
                          hold=['walk: all five drawn -- SE and E the art desk\'s 11-25 redraws (art-wanted 104); rear NE as first drawn, frames 1 and 5 an unclear '
                                'lead change, cut on his approval with its gait redraw on the dream list (the NW mirror with it)',
                                'attack: the greatsword two-handed over the greataxe guide, contact on frame 4',
                                'the handaxe stowed at his right hip throughout (the art desk\'s own note): data/foes.js sergeantblade throws none yet',
                                'prone: the last Fall cel held (the art desk\'s Prone is a literal crop of it)'],
                          source='drawn by the art desk (ART-163 PAGE 3, 11-25: art-wanted section 99, the Dominion\'s sergeant with the greatsword in five views), '
                                 'cut by tools/dmsergeant-sheet.py over tools/vivian-sheet.py; SW W NW mirrored'),
    'dmsergeantshield_p2': dict(batch='2026-11-25-ART-163-LONGSWORD-SHIELD', name='Sergeant (the Ledger)',
                                N={'idle': 4, 'walk': 8, 'attack': 8, 'push': 6, 'flinch': 4, 'hurt': 6, 'prone': 1},
                                walk_idle=(),     # (11-25b: SE, E and N redrawn, rear NE cut as drawn on his approval -- art-wanted 104)
                                rows=[('idle', 4, 4), ('walk', 9, 8), ('attack', 12, 8), ('push', 10, 6), ('flinch', 12, 4), ('hurt', 8, 6), ('prone', 1, 1)],
                                release={'attack': 3, 'push': 3},
                                hold=['walk: all five drawn -- SE, E and N the art desk\'s 11-25 redraws (art-wanted 104; N reverses the trailing boot at 5); rear NE as '
                                      'first drawn, frames 1 and 5 an unclear lead change, cut on his approval with its gait redraw on the dream list (the NW mirror with it)',
                                      'attack: the longsword over the longsword-and-shield guide, contact on frame 4',
                                      'push: the shield wall\'s shove, home on frame 4 -- deep16/js/features.js THE PUSH plays a sheet\'s `push`, as the line soldier\'s',
                                      'prone: the last Fall cel held (the art desk\'s Prone is a literal crop of it)'],
                                source='drawn by the art desk (ART-163 PAGE 4, 11-25: art-wanted section 99, the Dominion\'s sergeant with the longsword and shield '
                                       'and the shield wall\'s Push, in five views), cut by tools/dmsergeant-sheet.py over tools/vivian-sheet.py; SW W NW mirrored'),
}
HEADS, NOTES = {}, {}


def plan(batch, N):
    """[(view, row, file)] from the kit's FRAME-MAP: every page in sources/, its prone left for Fall 6 held"""
    import csv
    rows = list(csv.DictReader(open(os.path.join(VS.pix.SRC, SRC, batch, 'FRAME-MAP.csv'), encoding='utf-8-sig')))
    out = [(r['facing'], r['row'], r['source_png']) for r in rows if r['art_status'] != 'ART HOLD' and r['row'] != 'prone']
    return sorted(out, key=lambda p: (VIEWS.index(p[0]), list(N).index(p[1])))


def register(look, overlay=False):
    K = KITS[look]
    DG.BGTOL, DG.CROWN = BGTOL, CROWN
    heads = HEADS.setdefault(look, {}); notes = NOTES.setdefault(look, {})
    ov = MS.overlay_to(os.path.join(ROOT, 'deep16', 'art-src', SRC, 'overlay')) if overlay else None
    ok = os.path.isdir(os.path.join(VS.pix.SRC, SRC, K['batch']))
    W = MS.windows(SRC, K['batch'], plan(K['batch'], K['N']), K['N'], heads, held_prone=VIEWS, walk_idle=K['walk_idle'], notes=notes, overlay=ov, crowns=True) if ok else []
    PS = DM.scales(heads, K['N'], two=()) if W else {}
    VS.LOOKS[look] = dict(src=SRC, windows=W, pagescale=PS, name=K['name'], trim=False, tall=TALL, tallground=True, avoid=AVOID, bgtol=BGTOL,
                          match={r: ('idle', 0) for r in K['N'] if r not in ('idle', 'prone')}, ground=MS.LYING, rows=K['rows'], release=K['release'],
                          hold=K['hold'], source=K['source'])
    return W, PS


if __name__ == '__main__':
    for lk in [x for x in sys.argv[1:] if x in KITS] or list(KITS):
        W, PS = register(lk, overlay='overlay' in sys.argv)
        if 'frames' in sys.argv:
            for w in W:
                h = HEADS[lk].get(w[1:4])
                print(lk, w[1], w[2], w[3], 'box', w[6], 'boots', w[7], 'crown-to-boots', h[1] if h else '-', 'head', h[2] if h else '-')
            for pg, k in sorted(PS.items()):
                print(lk, 'pagescale', pg[1], round(k, 4))
            for fn, nt in sorted(NOTES[lk].items()):
                print(lk, fn, '|', '; '.join(nt))
        elif 'overlay' not in sys.argv:
            VS.cut(lk)

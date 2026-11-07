"""DEEP16 pipeline 2 (generated art): the glamour's goblin -- the child the wagon gives up and the barn holds, as the party sees her while the
illusion holds: a goblin the child's size, in the child's own clothes, empty-handed (11-07, the desk of 11-07, on Griz's "also got some illusion
goblins"; the inn lane's RULED 11-05, his "goblin in the barn if they fail to reveal the illusion").

    python tools/goblinchild-sheet.py            # deep16/art/goblinchild_p1 (.png + .json)

Sources (the art desk's HALFWAY-INN-UNARMED-GOBLINS-SELECTED-SOURCES, 11-06, in the main checkout's deep16/_src/goblin/INN-UNARMED-1106/ --
a worktree reads them there): five pages, one a view -- HEAD 1 SE, 2 NE, 3 S, 4 E, 5 N -- each an upper band Idle 4 and a lower band Walk 8,
printed numbers under each band and the action names at the left (the NE page prints none). Facings: the five views as drawn, SW, W and NW
the mirrors. Its notes: SOURCE COVERAGE COMPLETE, every Walk an ART HOLD (the leg exchange not established) -- cut as drawn, as the townsfolk's
runs were (tools/townsfolk-sheet.py), and on deep16-dream-polish.md.
The boxes by the desk's probe (each band its white numbers under it, the labels boxed as text); the mask by channel (`chan` 16, as the
townsfolk's: the olive smock and brown trousers on the navy). Cut, scaled and placed by tools/artdesk.py in the townsfolk's cell (72 x 64,
anchor 36, 60) at the child's 35 (folkchild_p1: the art desk's "Child stature 35 native px"), so the glamour and the child it covers stand
the same. Two passes: the second tones every page per channel to its own view's first-pass idle, the others to the E's.
"""
import os, json
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix, AD = _load('pixelate'), _load('artdesk')
TF = _load('townsfolk-sheet')                    # (its fit, torso_x and mirror: the child's own)

NAME = 'goblinchild_p1'
FW, FH, AX, AY = 72, 64, 36, 60
CHAN = 16
TALL = 35
DIR = 'INN-UNARMED-1106'

def R(*rows):
    """a page's rows: (row, band, label strip, n, xs) -> artdesk's rows and the numbers by hand"""
    return [(r, b, s, n) for r, b, s, n, _ in rows], {r: xs for r, _, _, _, xs in rows}

LABELS = [(30, 272, 117, 314), (30, 602, 135, 642)]   # (Idle and Walk printed at the left of every page but the NE's)
SPEC = {
  'G1': (dict(file='INN-GOBLIN_HEAD-1_SE.png', W=1536, text=LABELS),
         R(('idle', (0, 0, 1536, 427), (391, 427), 4, [252, 440, 632, 823]), ('walk', (0, 428, 1536, 767), (731, 767), 8, [243, 414, 583, 747, 918, 1088, 1256, 1428]))),
  'G2': (dict(file='INN-GOBLIN_HEAD-2_NE.png', W=1536, text=[]),
         R(('idle', (0, 0, 1536, 427), (390, 427), 4, [252, 441, 632, 824]), ('walk', (0, 428, 1536, 767), (729, 767), 8, [244, 415, 583, 747, 918, 1088, 1255, 1428]))),
  'G3': (dict(file='INN-GOBLIN_HEAD-3_S.png', W=1536, text=LABELS),
         R(('idle', (0, 0, 1536, 427), (391, 427), 4, [252, 441, 634, 824]), ('walk', (0, 428, 1536, 767), (730, 767), 8, [249, 417, 587, 751, 920, 1092, 1257, 1430]))),
  'G4': (dict(file='INN-GOBLIN_HEAD-4_E.png', W=1536, text=LABELS),
         R(('idle', (0, 0, 1536, 427), (389, 427), 4, [252, 441, 632, 824]), ('walk', (0, 428, 1536, 767), (730, 767), 8, [242, 414, 584, 748, 918, 1089, 1256, 1429]))),
  'G5': (dict(file='INN-GOBLIN_HEAD-5_N.png', W=1536, text=LABELS),
         R(('idle', (0, 0, 1536, 427), (390, 427), 4, [252, 441, 632, 824]), ('walk', (0, 428, 1536, 767), (730, 767), 8, [243, 414, 584, 748, 918, 1089, 1256, 1428]))),
}
PAGES = {L: dict(p, rows=rows, xs=xs, dir=DIR) for L, (p, (rows, xs)) in SPEC.items()}
VIEWS = {'SE': ('G1',), 'NE': ('G2',), 'S': ('G3',), 'E': ('G4',), 'N': ('G5',)}
ROWS = ['idle', 'walk']
FPS = {'idle': 5, 'walk': 12}                   # (the child's own: folkchild_p1)


AVOID = ['gold', 'fire']                        # (her green skin snapped to the gold ramp's light on six of the eight facings, a yellow goblin: left out, it
                                                # takes the orc's green -- her smock and boots are the leather and stone ramps, untouched)


def fit(img, k):
    """townsfolk-sheet.py's fit with the snap told to avoid the gold"""
    w, h = img.size
    img = img.convert('RGBa').resize((max(1, round(w / k)), max(1, round(h / k))), Image.BOX).convert('RGBA')
    pad = Image.new('RGBA', (img.width + 2, img.height + 2), (0, 0, 0, 0))
    pad.paste(img, (1, 1))
    return pix.pixelate(pad, 1, do_lift=False, avoid=AVOID)


def build():
    stand = {'side': TALL, 'S': TALL, 'N': TALL}
    cell = (FW, FH, AX, AY)
    first = AD.views(ROOT, 'goblin', DIR, PAGES, VIEWS, stand, fit, TF.torso_x, cell, chan=CHAN)
    ref = {'side': first['E']['idle'][0], 'S': first['S']['idle'][0], 'N': first['N']['idle'][0]}
    d = AD.views(ROOT, 'goblin', DIR, PAGES, VIEWS, stand, fit, TF.torso_x, cell, chan=CHAN, tone_ref=ref)
    frames = {}
    for an in ROWS:
        frames[an] = [d['S'][an], TF.mirror(d['SE'][an]), TF.mirror(d['E'][an]), TF.mirror(d['NE'][an]), d['N'][an], d['NE'][an], d['E'][an], d['SE'][an]]
        if len({len(fs) for fs in frames[an]}) > 1:
            raise SystemExit('%s: frame counts differ by facing %s' % (an, [len(fs) for fs in frames[an]]))
    return frames


if __name__ == '__main__':
    frames = build()
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    mp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(mp))
    for an, fps in FPS.items():
        meta['anims'][an]['fps'] = fps
    meta['source'] = 'drawn by the art desk (HALFWAY-INN-UNARMED-GOBLINS-SELECTED-SOURCES, 11-06: five views of Idle 4 and Walk 8, every Walk its ART HOLD), cut by tools/goblinchild-sheet.py through tools/artdesk.py (11-07)'
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in ROWS)))

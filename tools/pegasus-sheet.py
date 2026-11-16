"""DEEP16: the pegasus (art-wanted 64's celestial, the art desk's §69) -> pegasus_p1 (11-15, the NPC cutter seat, on Griz's "since people is
done have it work the creature list backward", the desk's relay; RE-CUT 11-16 from the art desk's illustrated redraw by the redraw cutter seat,
cutter-redraw-1116, its brief's "Before you close, list Fresh again; if more has come, take it the same way (creatures one landing each)").

    python tools/pegasus-sheet.py

Source (the art desk's, in the main checkout's deep16/_src/pegasus/2026-11-16-ART-WANTED-69-PEGASUS-ILLUSTRATED-REDRAW/ -- a worktree reads
it there; sorted by _src/art-desk/art69-pegasus-redraw-sort-2026-11-16.py): 45 image-generated pages (SELECTED/, the originals), and the art desk's
own native cut of each, NATIVE/PEGASUS-<view>-<ACTION>-<n>.png, transparent 144 x 152 cells (the old cell, anchor 72,114) left to right then top
to bottom, every colour one of the 64, binary alpha. Taken as drawn: no rescale, no snap, refused if a colour is off the 64. FRAME-MAP.csv names
each frame's row (`runtime_row`) and the lift drawn into it (`lift_px`).

The registration is the art desk's: each frame centred and its lowest pixel on row 113, the soles on the anchor line as the griffon's, the
wyvern's and the winter wolf's stand (the 11-15 pegasus stood its body's middle on the anchor, the soles 4 to 16 px below it, by view). Its
notes call the frame-to-frame registration diagnostic; measured on the torso band (the 18 rows 24 to 42 px above the soles), the idle, the walk
and the flinch hold within 2 px of their frame 1 but for the flinch's own recoil, and kept as drawn.

Rows: Idle `idle` 8 -- the art desk drew 16 on his ask; on seeing its own 8-against-16 film he ruled, relayed by the lanes desk 11-16,
*"only use the standard number of frames for the pegasus idle"*: every other of the 16 (1, 3 .. 15, the art desk's own 8-phase sample, the film's
left side; its frame 16 is frame 1 again) at the old 6 fps -- Walk `walk` 8, Hooves `attack` 8
(the forehooves land on frame 5: `release` 4), Fall `hurt` 8, Fly `fly` 8, Flinch `flinch` 6, Prone `prone` 2 (frame 1 Fall 8's own pose,
frame 2 the lying pose -- the grid lies on the row's last frame; no recovery is drawn, so no `getup`), Rear Back `rearback` 8 (HELD: no SRD
action of the pegasus's is a rear, and where it plays is his word), Take Flight `takeflight` 8 (new: js/battle.js flyTo plays it on a rise from
the ground; his word, 11-16: *"go ahead and get that ready even if we don't use it on the Pocket DM version, a pegasus encounter in game is
likely to be scripted and we can use it then"*). FLY AND TAKE FLIGHT are drawn lifted (`lift_px`: Fly 17 throughout, Take Flight 0 0 0 4 8 12 15 17); the grid lifts a flier itself,
so each frame is stood on the ground line by its own lift, the old fly band's way, and Take Flight's lift goes to the sheet as `rise` (the
share of the climb at each frame) for flyTo to lift it by. The art desk stood every Fly frame by its lowest pixel, and in SE and E the
downstroke's wingtip is that pixel, so the body rode up 14 to 19 px on frames 4 to 6: `refly` lays each Fly frame's body (its warm pixels: the
wings, mane and tail are the cool greys) back on frame 1's where it is 8 px or more off (SE 4 and 6, E 4 to 6), the wing hanging below the
line there; the smaller bobs (about 6 px: S 6, SE 5) are left as drawn. Facings: the five views as drawn, SW, W and NW the mirrors of SE, E and NE (RULED 10-14).
"""
import os, sys, json, csv
import importlib.util
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'tools', name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod
pix, AD = _load('pixelate'), _load('artdesk')

FW, FH, AX, AY = 144, 152, 72, 114
NAME = 'pegasus_p1'
DIR = ('pegasus', '2026-11-16-ART-WANTED-69-PEGASUS-ILLUSTRATED-REDRAW')
ORDER = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
# the art desk's runtime_row -> the sheet's row (the art desk's own names, but its Hooves the grid's `attack`)
ROWS = {'idle': 'idle', 'walk': 'walk', 'hooves': 'attack', 'hurt': 'hurt', 'fly': 'fly', 'flinch': 'flinch', 'prone': 'prone',
        'rearback': 'rearback', 'takeflight': 'takeflight'}
DRAWN = {'idle': 16, 'walk': 8, 'attack': 8, 'hurt': 8, 'fly': 8, 'flinch': 6, 'prone': 2, 'rearback': 8, 'takeflight': 8}
PICK = {'idle': list(range(0, 16, 2))}   # (his "standard number of frames for the pegasus idle": every other of the 16, the art desk's 8-phase sample)
COUNT = {row: len(PICK.get(row, range(n))) for row, n in DRAWN.items()}
FPS = {'idle': 6, 'walk': 10, 'attack': 10, 'hurt': 8, 'fly': 10, 'flinch': 12, 'prone': 1, 'rearback': 10, 'takeflight': 10}
RELEASE = {'attack': 4}
HELD = {'rearback': 'no SRD 5.1 action of the pegasus is a rear (its one blow is the Hooves, on `attack`): drawn by the art desk on his ask, where it plays is his word (11-16)'}
STOOD = ('fly', 'takeflight')        # (drawn lifted: each frame stood by its own lift_px)


def palette():
    p = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))
    return {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for r in p['ramps'].values() for c in r}


def mirror(fr):
    return np.roll(fr[:, ::-1], 1, axis=1).copy()


def cut():
    """-> ({row: [8 facings of [RGBA frames]]}, {row: [lift_px a frame]} of the S view)"""
    d = os.path.join(AD.src_dir(ROOT), *DIR)
    pal, views, atlases, lifts = palette(), {}, {}, {}
    rows = list(csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8')))
    count = {}
    for r in rows:
        count[(r['facing'], r['action'])] = count.get((r['facing'], r['action']), 0) + 1
    for r in rows:
        v, act, row = r['facing'], r['action'], ROWS.get(r['runtime_row'])
        if row is None:
            raise SystemExit('%s %s: a row %s the tool does not name' % (v, act, r['runtime_row']))
        if (int(r['cell_w']), int(r['cell_h']), int(r['anchor_x']), int(r['anchor_y'])) != (FW, FH, AX, AY):
            raise SystemExit('%s %s %s: not the 144 x 152 cell on 72,114' % (v, act, r['frame']))
        page = 'PEGASUS-%s-%s-%d.png' % (v, act.upper().replace('_', ''), count[(v, act)])
        if page not in atlases:
            atlases[page] = np.asarray(Image.open(os.path.join(d, 'NATIVE', page)).convert('RGBA'))
        a, i = atlases[page], int(r['index'])
        cols = a.shape[1] // FW
        fr = a[(i // cols) * FH:(i // cols + 1) * FH, (i % cols) * FW:(i % cols + 1) * FW].copy()
        if fr.shape[:2] != (FH, FW):
            raise SystemExit('%s frame %d: outside the atlas' % (page, i + 1))
        op = fr[..., 3] > 0
        if set(np.unique(fr[..., 3]).tolist()) - {0, 255}:
            raise SystemExit('%s frame %d: alpha not binary' % (page, i + 1))
        off = {tuple(c) for c in fr[op][:, :3].tolist()} - pal
        if off:
            raise SystemExit('%s frame %d: %d colours off the 64' % (page, i + 1, len(off)))
        lift = int(r['lift_px'] or 0)
        if row in STOOD and lift:
            if fr[FH - lift:, :, 3].any():
                raise SystemExit('%s frame %d: cut off by standing it' % (page, i + 1))
            fr = np.roll(fr, lift, axis=0)
        elif lift:
            raise SystemExit('%s frame %d: a lift on a ground row' % (page, i + 1))
        fr[fr[..., 3] == 0] = 0
        views.setdefault(v, {}).setdefault(row, {})[i] = fr
        if v == 'S':
            lifts.setdefault(row, {})[i] = lift
    if set(views) != {'S', 'SE', 'E', 'NE', 'N'}:
        raise SystemExit('views %s' % sorted(views))
    out = {}
    for v, rs in views.items():
        out[v] = {}
        for row, n in DRAWN.items():
            if sorted(rs.get(row, {})) != list(range(n)):
                raise SystemExit('%s %s: frames %s, not %d' % (v, row, sorted(rs.get(row, {})), n))
            out[v][row] = [rs[row][i] for i in PICK.get(row, range(n))]
            low = max(int(np.where(f[..., 3].any(1))[0][-1]) for f in out[v][row])
            if low != AY - 1:
                raise SystemExit('%s %s: its lowest pixel on row %d, not %d' % (v, row, low, AY - 1))
        out[v]['fly'] = refly(v, out[v]['fly'])
    return finish(out, lifts)


REFLY = 8      # (a fly frame whose body sits this many px or more off frame 1's is moved back onto it)


def warm(fr):
    """the horse's body: its warm pixels (red over blue) -- the wings, mane and tail are drawn in the cool greys"""
    c = fr.astype(int)
    return (c[..., 3] > 0) & (c[..., 0] > c[..., 2] + 6)


def refly(v, frames):
    """the fly row stood by each frame's lowest pixel (the art desk's) rides the body up 16 px and more on the downstroke in SE and E, where the
    wingtip is the lowest pixel: each frame's body (warm) laid on frame 1's by the best overlap, and a frame moved back down when it is off by
    REFLY or more (the small bobs left as drawn; measured 11-16: SE frames 4 and 6, E 4 to 6)"""
    w0, out = warm(frames[0]), [frames[0]]
    for i, fr in enumerate(frames[1:], 2):
        w, bs, bi = warm(fr), 0, -1
        for dy in range(-24, 25):
            b = np.roll(w, dy, 0); u = (b | w0).sum(); iou = (b & w0).sum() / u if u else 0
            if iou > bi:
                bi, bs = iou, dy
        if abs(bs) >= REFLY:
            if (bs > 0 and fr[FH - bs:, :, 3].any()) or (bs < 0 and fr[:-bs, :, 3].any()):
                raise SystemExit('%s fly %d: cut off by moving it %+d px' % (v, i, bs))
            fr = np.roll(fr, bs, axis=0)
            print('  %s fly %d: its body laid back on frame 1\'s, %+d px' % (v, i, bs))
        out.append(fr)
    return out


def finish(out, lifts):
    frames = {row: [[mirror(fr) for fr in out[MIRROR[f]][row]] if f in MIRROR else out[f][row] for f in ORDER] for row in COUNT}
    return frames, {row: [lifts[row][i] for i in range(COUNT[row])] for row in STOOD}


if __name__ == '__main__':
    frames, lifts = cut()
    pix.write_sheet(NAME, frames, FW, FH, AX, AY, pix.top_of(frames['idle'][0] + frames['idle'][6], AY))
    mp = os.path.join(ROOT, 'deep16', 'art', NAME + '.json')
    meta = json.load(open(mp))
    missing = [an for an in frames if an not in meta['anims']]
    if missing:
        raise SystemExit('rows not written (not in tools/pixelate.py ANIM_ORDER): %s' % missing)
    for an, f in FPS.items():
        meta['anims'][an]['fps'] = f
    for an, r in RELEASE.items():
        meta['anims'][an]['release'] = r
    for an, why in HELD.items():
        meta['anims'][an]['held'] = why
    top = max(lifts['takeflight'])
    meta['anims']['takeflight']['rise'] = [round(l / top, 3) for l in lifts['takeflight']]
    meta['source'] = 'drawn by the art desk (ART-WANTED-69 PEGASUS ILLUSTRATED REDRAW, 11-16: five views, nine rows, image-generated, its native cut on a 144 x 152 cell), cut by tools/pegasus-sheet.py (11-15, re-cut 11-16)'
    json.dump(meta, open(mp, 'w'), indent=1)
    print('  %s: %s' % (NAME, ', '.join('%s %d' % (an, len(frames[an][0])) for an in frames)))

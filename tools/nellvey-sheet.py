"""DEEP16 pipeline 2 (generated art): Nell Vey, the Stand-In -- the art desk's own villain for the road -- her fight figure nellvey_p2, in all eight facings.

    python tools/nellvey-sheet.py            (writes deep16/art/nellvey_p2.png/.json)
    python tools/nellvey-sheet.py check      (also the review sheet: every row of every drawn view at 3x, deep16/art-src/nell-vey/)

The art desk's NELL-VEY-CUTTER-HANDOFF (its own villain, sent unasked 11-19; Griz 11-20 to the lanes desk: "yes, straight to pocket DM villain"), sorted out of Fresh
to deep16/_src/nell-vey/2026-11-19-NELL-VEY/: her identity sheet, six portrait pages (tools/portrait-sheet.py nellvey -> pt_nellvey) and HOLD THE POSE 6 in S, SE,
E, the rear NE and N (source/combat/). Its other rows -- town Idle, Walk and Sight Sitter, and the fight's Ready, Walk, Hammer, Stand-In, Flinch, Fall and Prone --
"remain separate work" (its notes): not drawn yet.

What is cut (cutter-1120, 11-20): the six Hold the Pose frames a view as the row `holdpose` (the hammer gripped, the right thumb along the haft, sighted on 4,
held on 6 -- its notes), and the row's frame 1 alone as her `idle` (the hammer in her right hand, the shield on her left forearm: the nearest thing drawn to a
stand), so the grid can field her; every row she lacks plays her idle (js/sprites.js), as Amara's missing blow does. The feat the row is drawn for is PROPOSED,
not ruled (the leveling lane, 11-19): nothing plays `holdpose` yet. The SE page's "Ready comparison" (one pose before its frame 1) is not cut.

The map's rects are "source wells, not trim boxes" (its notes): a tight box is found round her in each (tools/road-town-sheet.py tight()). The cut is
tools/vivian-sheet.py's: each page by its idle (frame 1) to 48 -- the art desk's "48 px standing target", a grown human's -- SW W NW the mirrors of SE E NE
(RULED 10-14; the notes: the runtime mirrors carry the hammer and shield to the other hands); boxed down, snapped to the 64 (fire left out; the reds kept for her
ochre thumb), outlined.
"""
import importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_sp = importlib.util.spec_from_file_location('road_town_sheet', os.path.join(ROOT, 'tools', 'road-town-sheet.py'))
RT = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(RT)
VS = RT.VS

SRC, BATCH = 'nell-vey', '2026-11-19-NELL-VEY'


def frame_windows():
    d = os.path.join(VS.pix.SRC, SRC, BATCH)
    if not os.path.isdir(d):
        return []
    fm = json.load(open(os.path.join(d, 'FRAME-MAP.json'), encoding='utf-8'))
    out = []
    for pg in fm['combat']['pages']:
        fs = [f for f in pg['frames'] if isinstance(f['frame'], int)]           # (the SE page's "Ready comparison" left out)
        assert [f['frame'] for f in fs] == list(range(1, 7)), (pg['source'], [f['frame'] for f in fs])
        for f in fs:
            x, y, w, h = f['source_rect_xywh']
            box = RT.tight(d, pg['source'], (x, y, x + w, y + h))
            win = (max(0, box[0] - RT.PAD), max(0, box[1] - RT.PAD), box[2] + RT.PAD, box[3] + RT.PAD)
            win = (win[0], win[1], min(win[2], x + w), min(win[3], y + h))
            out.append((BATCH, pg['facing'], 'holdpose', f['frame'] - 1, pg['source'], win, box))
            if f['frame'] == 1:
                out.append((BATCH, pg['facing'], 'idle', 0, pg['source'], win, box))
    assert sorted(set(w[1] for w in out)) == sorted(VS.FACE), sorted(set(w[1] for w in out))
    return out


VS.LOOKS['nellvey_p2'] = dict(
    src=SRC, windows=frame_windows(), tall=48, avoid=['fire'], name='Nell Vey', rows=[('idle', 1, 1), ('holdpose', 8, 6)],
    hold=['drawn so far: Hold the Pose 6 alone; her idle is its frame 1, and every other row (walk, the hammer blow, Stand-In, flinch, fall, prone) plays it',
          'the mirrors (SW W NW) carry the hammer to her left hand and the shield to her right forearm (the art desk\'s own note)',
          'the red thumb against the hammer in the rear views (the art desk\'s own note: check at 1x)'],
    source='drawn by the art desk (NELL-VEY-CUTTER-HANDOFF, 11-19: its own villain, Hold the Pose in five views), cut by tools/nellvey-sheet.py over '
           'tools/vivian-sheet.py; SW W NW mirrored; worn by the Pocket DM\'s villain (js/classes.js NPC.NAMED.nellvey)')

if __name__ == '__main__':
    VS.cut('nellvey_p2')

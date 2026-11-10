"""The Waterbys' 11-06 rows by their pixels (11-06, the cutter of the art desk's 11-06 pages; the benches fetch no images, so the meets are read here off the PNGs):
Doran's armed idle (doran_p2 idle, the five-view axe idle page) is a loop -- not one held frame -- that meets his chop: every idle frame on the attack's ground row,
its crown within a few rows of Attack 1's and Attack 4's in every facing; Gennet's fight walk (gennet_p2 walk, HALFWAY-INN-GENNET-FIGHT-WALK) keeps her head level
through the loop, at her idle's height, her feet on the ground line, and carries no lantern (no fire-ramp pixel) while her town walk (gennet_p1) keeps its own.
And (11-10, the cutter of his axe walk, on Griz's "move doran to Fresh and then start up it's cutter") Doran's fight walk (doran_p2 walk, the art desk's axe walk page)
carries the axe: every frame reaches out on the axe's side as far as his armed idle does (the bucket walk fell 6 to 13 px short), his head level at the chop's
height, his soles on the ground line; his town walk (doran_p1) keeps the bucket.
Quick gate (dev/check.py QUICK_SCRIPTS).   python dev/waterby-probe.py"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'deep16', 'art')
PAL = json.load(open(os.path.join(ROOT, 'deep16', 'palette.json'), encoding='utf-8'))['ramps']
FIRE = {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for c in PAL['fire']}
fails = []


def ok(what, v):
    print(('ok   ' if v else 'FAIL ') + what)
    if not v:
        fails.append(what)


def sheet(n):
    return json.load(open(os.path.join(ART, n + '.json'), encoding='utf-8')), np.asarray(Image.open(os.path.join(ART, n + '.png')).convert('RGBA'))


def cell(js, px, row, f, k):
    a = js['anims'][row]
    c = px[a['y'] + f * a['fh']:a['y'] + (f + 1) * a['fh'], k * a['fw']:(k + 1) * a['fw']]
    al = c[..., 3] > 0
    ys = np.where(al.any(1))[0]
    return c, (int(ys[0]), int(ys[-1])) if len(ys) else (None, None)


def main():
    dj, dp = sheet('doran_p2')
    idl, att = dj['anims']['idle'], dj['anims']['attack']
    ok('doran_p2 idle: %d frames at %s fps (the armed idle, a loop -- not one held frame), source names the 11-06 idle page: %s'
       % (idl['frames'], idl['fps'], 'axe idle' in dj['source']), idl['frames'] == 4 and 'axe idle' in dj['source'])
    held, off, worst = [], [], 0
    for f in range(8):
        cs = [cell(dj, dp, 'idle', f, k) for k in range(idl['frames'])]
        if len({c[0].tobytes() for c in cs}) < 2:
            held.append(f)
        a0, a3 = cell(dj, dp, 'attack', f, 0)[1], cell(dj, dp, 'attack', f, 3)[1]
        for c in cs:
            crown, foot = c[1]
            if crown is None or abs(foot - a0[1]) > 1 or abs(foot - a3[1]) > 1:
                off.append('facing %d foot %s vs the chop\'s %s/%s' % (f, foot, a0[1], a3[1]))
            else:
                worst = max(worst, abs(crown - a0[0]), abs(crown - a3[0]))
    ok('doran_p2 idle breathes in every facing (frames not all one picture)%s' % (': held in ' + str(held) if held else ''), not held)
    ok('the chop meets the idle: every idle frame on Attack 1\'s and 4\'s ground row, the crowns within %d rows (the E and N guards drawn lower than Attack 1)%s'
       % (worst, ': ' + '; '.join(off[:4]) if off else ''), not off and worst <= 5)

    # his axe walk (11-10): the axe in his hands while he walks -- the haft and head reach out from his anchor on the axe's side (the side his armed idle reaches
    # furthest) as far as the idle's within 6 px, every frame of every facing; the head level (crowns one row a facing) at the chop's height; the soles on the line
    dw, tj = dj['anims']['walk'], json.load(open(os.path.join(ART, 'doran_p1.json'), encoding='utf-8'))
    ok('doran_p2 walk: %d frames, source names the axe walk page (11-10): %s; doran_p1 (the inn\'s floor) keeps the town walk with the bucket: %s'
       % (dw['frames'], 'axe walk page (11-10)' in dj['source'], 'DORAN-TOWN' in tj['source'] and 'axe walk' not in tj['source']),
       dw['frames'] == 8 and 'axe walk page (11-10)' in dj['source'] and 'DORAN-TOWN' in tj['source'] and 'axe walk' not in tj['source'])

    def span(row, f, k):
        a = dj['anims'][row]
        c, _ = cell(dj, dp, row, f, k)
        xs = np.where((c[..., 3] > 0).any(0))[0]
        return int(xs[0]) - a['ax'], int(xs[-1]) - a['ax']
    short, lvl, feet = [], [], []
    for f in range(8):
        il = min(span('idle', f, k)[0] for k in range(idl['frames'])); ir = max(span('idle', f, k)[1] for k in range(idl['frames']))
        side = 1 if ir >= -il else 0                         # (the axe's side: where the armed idle reaches furthest from his anchor)
        need = (ir if side else -il) - 6
        got = [abs(span('walk', f, k)[side]) for k in range(dw['frames'])]
        if min(got) < need:
            short.append('facing %d reaches %d of %d' % (f, min(got), need))
        cr = [cell(dj, dp, 'walk', f, k)[1] for k in range(dw['frames'])]
        a0 = cell(dj, dp, 'attack', f, 0)[1][0]
        lvl.append((f, max(c[0] for c in cr) - min(c[0] for c in cr), int(np.median([c[0] for c in cr])) - a0))
        feet.append((min(c[1] for c in cr), max(c[1] for c in cr)))
    ok('the axe in his hands while he walks: every walk frame reaches within 6 px of his armed idle on the axe\'s side%s' % (': ' + '; '.join(short) if short else ''), not short)
    ok('his head level through the walk (crowns spread %s rows a facing) at the chop\'s height (off Attack 1 %s)' % ([l[1] for l in lvl], [l[2] for l in lvl]),
       all(l[1] <= 1 and abs(l[2]) <= 2 for l in lvl))
    ok('his soles on the ground line (ay %d): lowest rows %s' % (dw['ay'], feet), all(dw['ay'] - 3 <= lo and hi <= dw['ay'] + 1 for lo, hi in feet))

    gj, gp = sheet('gennet_p2')
    tj, tp = sheet('gennet_p1')
    wk = gj['anims']['walk']
    ok('gennet_p2 walk: %d frames, source names HALFWAY-INN-GENNET-FIGHT-WALK: %s' % (wk['frames'], 'FIGHT-WALK' in gj['source']), wk['frames'] == 8 and 'FIGHT-WALK' in gj['source'])
    lvl, feet, ay = [], [], wk['ay']
    for f in range(8):
        cr = [cell(gj, gp, 'walk', f, k)[1] for k in range(8)]
        ic = [cell(gj, gp, 'idle', f, k)[1][0] for k in range(gj['anims']['idle']['frames'])]
        spread = max(c[0] for c in cr) - min(c[0] for c in cr)
        lvl.append((f, spread, int(np.median([c[0] for c in cr])) - int(np.median(ic))))
        feet.append((f, min(c[1] for c in cr), max(c[1] for c in cr)))
    ok('her head level through the walk (crowns spread %s rows a facing) at her idle\'s height (off it %s)' % ([l[1] for l in lvl], [l[2] for l in lvl]),
       all(l[1] <= 1 and abs(l[2]) <= 2 for l in lvl))
    ok('her feet on the ground line (ay %d): lowest rows %s' % (ay, [(f[1], f[2]) for f in feet]), all(ay - 4 <= f[2] <= ay + 2 for f in feet))

    def fire(js, px, row):
        a = js['anims'][row]
        b = px[a['y']:a['y'] + 8 * a['fh'], :a['fw'] * a['frames']]
        return sum(1 for c in b[b[..., 3] > 0][:, :3] if tuple(int(v) for v in c) in FIRE)
    fw, tw = fire(gj, gp, 'walk'), fire(tj, tp, 'walk')
    ok('the fight walk empty-handed (%d fire-ramp pixels), the town walk with its lantern (%d)' % (fw, tw), fw == 0 and tw > 0)
    print('RED' if fails else 'GREEN')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())

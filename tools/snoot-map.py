"""THE SNOOT'S MAP, FED FROM THE WORLD (11-14, the Snoot seat of the realm; his 10-20 "let's get the world map sorted then build the snoot map off of it",
and 11-14 "Yes, feed it"): the Snoot's hexes cut from the second game's world map (deep16/data/world.js, itself baked from his realm hex map by
tools/world-build.py) and written to snoot-mode/js/map.js as SN.WORLDMAP. The world's 5-mile hexes are named as the Snoot names its own (odd rows half a
hex right), so a box of them with an even first row is the Snoot's grid as it stands. Run after a world bake, then python tools/snoot-build.py:

    python tools/snoot-map.py

What is read off the world: each hex's ground, the roads as the hexes they run through, the places (the Pit, the inn, the lake, Web Gulch, the moot
ground) and THE SCATTER (how many farms stand in each hex, and what else). What is the seat's own, his to move (the realm's hex map does not place them):
the Skull-Gate's and the Wall-Laugh's seats, from wiki/gnoll-hills.md's words for their ground, and where each unit stands on Day 14 (START below, each a
step or two from a place the world gives)."""
import io, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)

# the box, in the world's own offset columns and rows: from the Castegut mountain's foot (the Wall-Laugh) to the Verge, the Castegut road to south of the Pit
C0, C1, R0, R1 = 4, 29, 10, 23   # (R0 even: the world's odd rows stay the Snoot's odd rows)
# the two seats the hex map does not place (wiki/gnoll-hills.md: the Skull-Gate "the eastern seat, toward the Pit road above Web Gulch"; the Wall-Laugh
# "the westmost seat, at the Castegut mountain's foot where the pocket meets the Castegut road"): the seat's reading of those words on the world's hills
SKULL, WALL = (20, 11), (6, 12)
# the Gray Keeping's home-place (RULED 11-15, his "1 yes" on the seat's lean: "the hills hex two east of Rhollor's Ruins, with the moot ground staying where it
# is as a place of its own"; his word to the clock seat: "their home-place, which is south and closer in the hills near rhollor's ruins"): two east of the Ruins' hex
HOME_EAST = 2
# THE CLANS (RULED 11-15, his answers 3-6 to the Snoot seat): what the world's map changes of js/data.js SN.FORCES, by a unit's id. "some of the gnolls in the groups
# will have better stats (female) without different graphics", "one for every 6 males" (a part of six over half makes one more: 15 males 3, 10 males 2, 7 males 1);
# "other than the death-watch"; the Skull-Gate in three groups, the fourth band folded into the other two and its glory-seekers the group that followed the Harbinger
# (his "5 - I like it"); "Harbinger should have some gnolls with him also ... never females" -- six, the seat's number.
FORCES = {
    'sg1': {'figs': 27, 'comp': {'gloryseeker': 5, 'gnoll': 10, 'gnollfemale': 3, 'hyena': 9}},
    'sg2': {'figs': 27, 'comp': {'gloryseeker': 4, 'gnoll': 11, 'gnollfemale': 3, 'hyena': 9}},
    'sg3': {'name': 'the glory-seekers who followed the Harbinger'},
    'gk1': {'comp': {'gloryseekergray': 3, 'gnollgray': 7, 'gnollgrayfemale': 2, 'hyena': 6}},
    'gk2': {'comp': {'gloryseekergray': 3, 'gnollgray': 7, 'gnollgrayfemale': 2, 'hyena': 6}},
    'wl1': {'comp': {'gnoll': 10, 'gnollfemale': 2, 'hyena': 6}},
    'wl2': {'comp': {'gnoll': 7, 'gnollfemale': 1, 'hyena': 4}},
    'harb': {'figs': 12, 'comp': {'hyena': 6, 'gnoll': 6}, 'sheets': ['mirrorgnoll_p1', 'mirrorhyena_p1', 'gnoll_p2'], 'gathers': True,
             'note': "Mr. Ripples' made gnoll, mirror eyes in both sockets, his six mirror hyenas, and the gnolls who have gone over to him: males only, and more as the bands break near him."},
}
DROP = ['sg4']
GROUND = {'plains': '.', 'verge': 'v', 'farms': 'f', 'hills': 'h', 'foothills': 'h', 'woods': 't', 'bog': 'b', 'gulch': 'g', 'lake': 'w', 'sea': 'w',
          'black': 'x', 'gray': 'x', 'coastal': 'x', 'town': '.', 'rift': 'x'}
ROADS = [('pitroad', 'the Pit road'), ('castegut', 'the west road (the Castegut road)'), ('pirate', 'the pirate road'), ('newland', 'the south road (to Newland)'), ('mile', 'the mile (to Silverton)')]


def col(q, r): return q + (r - (r & 1)) // 2
def cube(c, r): x = c - (r - (r & 1)) // 2; return (x, -x - r, r)
def dist(a, b): p, q = cube(*a), cube(*b); return max(abs(p[0] - q[0]), abs(p[1] - q[1]), abs(p[2] - q[2]))
def nbrs(h):
    d = [[(1, 0), (0, -1), (-1, -1), (-1, 0), (-1, 1), (0, 1)], [(1, 0), (1, -1), (0, -1), (-1, 0), (0, 1), (1, 1)]][h[1] & 1]
    return [(h[0] + a, h[1] + b) for a, b in d]


def main():
    src = os.path.join(ROOT, 'deep16', 'data', 'world.js')
    t = io.open(src, encoding='utf-8').read(); W = json.loads(t[t.index('WORLD = ') + 8:t.rindex(';')])
    G = {(col(h[0], h[1]), h[1]): h for h in W['hexes']}
    site = {s['id']: (col(s['hex'][0], s['hex'][1]), s['hex'][1]) for s in W['sites']}
    inbox = lambda h: C0 <= h[0] <= C1 and R0 <= h[1] <= R1
    loc = lambda h: [h[0] - C0, h[1] - R0]
    pit, inn, lake, gulch, moot = site['pit'], site['inn'], site['halfwaylake'], site['webgulch'], site['moot']
    ruins = [s for s in W['sites'] if 'Rhollor' in s['name']][0]; ruins = (col(ruins['hex'][0], ruins['hex'][1]), ruins['hex'][1]); HOME = (ruins[0] + HOME_EAST, ruins[1])
    assert G[HOME][2] in ('hills', 'foothills'), ('the home-place is not in the hills', HOME, G[HOME][2])
    rows = []
    for r in range(R0, R1 + 1):
        row = ''
        for c in range(C0, C1 + 1):
            h = G.get((c, r)); ch = GROUND.get(h[2], '.') if h else 'x'
            if h and h[2] != 'lake' and h[5] == 'lake' and h[6] >= 0.3: ch = ch  # (a corner of lake: the ground stands)
            row += ch
        rows.append(row)
    def put(h, ch): r = h[1] - R0; rows[r] = rows[r][:h[0] - C0] + ch + rows[r][h[0] - C0 + 1:]
    for h, ch in ((pit, 'P'), (inn, 'i'), (lake, 'w'), (gulch, 'g'), (moot, 'm'), (SKULL, 's'), (WALL, 'l'), (HOME, 'k')):
        assert inbox(h), (h, ch); put(h, ch)
    ter = lambda h: rows[h[1] - R0][h[0] - C0]
    road_hex = set(); roads = []
    for pid, name in ROADS:
        P = [p for p in W['paths'] if p['id'] == pid]
        if not P: continue
        run = []
        for q, r in P[0]['hexes']:
            h = (col(q, r), r)
            if inbox(h) and not (run and dist(run[-1], h) != 1):
                if not run or run[-1] != h: run.append(h)
            else:
                if len(run) > 1: roads.append((name, run))
                run = [h] if inbox(h) else []
        if len(run) > 1: roads.append((name, run))
    for name, run in roads:
        for a, b in zip(run, run[1:]): assert dist(a, b) == 1, (name, a, b)
        road_hex.update(run)
    walk = lambda h: inbox(h) and (h in road_hex or ter(h) not in 'wx')
    pitroad = [run for name, run in roads if name == 'the Pit road'][0]
    if pitroad[0] != pit: pitroad = pitroad[::-1]
    assert pitroad[0] == pit, pitroad[:3]
    west = [run for name, run in roads if name.startswith('the west road')]
    wend = min((h for run in west for h in run), key=lambda h: h[0])   # (where the Castegut road leaves the box, west)
    south = [run for name, run in roads if name.startswith('the south road')]
    send = max((h for run in south for h in run), key=lambda h: (h[1], -abs(h[0] - pit[0]))) if south else (pit[0], R1)
    # Day 14, where each stands (the world's own columns and rows): each by a place the world gives, as the old map had them by its own
    step = lambda h, dc, dr: (h[0] + dc, h[1] + dr)
    START = {
        'party': inn, 'greyfang': pit, 'patrol': pit, 'bat1': send, 'bat2': send, 'bat3': send,
        'bb1': (C1, pit[1] - 4), 'bb2': (C1, pit[1] - 3), 'bb3': (C1, pit[1] - 2),                   # (off the Verge, the east edge above the pirate road)
        'sg1': step(SKULL, 0, 1), 'sg2': step(SKULL, 1, 2), 'sg3': step(step(moot, 4, 1), 1, 0),   # (sg3: beside the Harbinger's pack, his "5 - I like it")
        'gkw': moot, 'gk1': step(moot, 1, 1), 'gk2': step(moot, -1, -1), 'wl1': WALL, 'wl2': step(WALL, 1, 1), 'harb': step(moot, 4, 1),
    }
    for k, h in START.items(): assert walk(h), ('a unit stands where no one walks', k, h, ter(h))
    roadpt = pitroad[3]; beside = [h for h in nbrs(roadpt) if walk(h) and h not in road_hex and dist(h, pit) >= 3]
    assert beside, roadpt
    # THE SCATTER: what stands in each of the Snoot's hexes
    sc = W.get('scatter') or {'kinds': [], 'feats': []}; farms = {}; other = {}
    for f in sc['feats']:
        h = (col(f[3], f[4]), f[4]); k = sc['kinds'][f[0]]
        if not inbox(h): continue
        key = '%d,%d' % tuple(loc(h))
        if k in ('farm', 'hamlet'): farms[key] = farms.get(key, 0) + 1
        else: other.setdefault(key, {}); other[key][k] = other[key].get(k, 0) + 1
    places = [
        {'at': loc(pit), 'name': "Tarlyn's Pit"}, {'at': loc(inn), 'name': 'the Halfway Inn', 'dx': -0.3}, {'at': loc(lake), 'name': 'Halfway Lake', 'dx': 0.35, 'dy': -0.95},
        {'at': loc(gulch), 'name': 'Web Gulch', 'dx': 0.35, 'dy': -0.95}, {'at': loc(moot), 'name': 'the moot ground'}, {'at': loc(SKULL), 'name': 'the Skull-Gate', 'dx': -0.3},
        {'at': loc(WALL), 'name': 'the Wall-Laugh'}, {'at': loc(HOME), 'name': "the Gray Keeping's home"}, {'at': [C1 - C0 - 2, inn[1] - R0], 'name': 'the Verge'}]
    M = {'name': 'world', 'from': W.get('from'), 'box': [C0, R0, C1, R1], 'W': C1 - C0 + 1, 'H': R1 - R0 + 1, 'rows': rows,
         'roads': [{'name': n, 'hexes': [loc(h) for h in run]} for n, run in roads], 'places': places,
         'pit': loc(pit), 'moot': loc(moot), 'inn': loc(inn), 'west': loc(wend), 'south': loc(send), 'seats': {'skull': loc(SKULL), 'wall': loc(WALL), 'gray': loc(HOME)}, 'forces': FORCES, 'drop': DROP,
         'roadpt': loc(roadpt), 'beside': loc(beside[0]), 'start': {k: loc(h) for k, h in START.items()}, 'farms': farms, 'other': other}
    text = ("/* THE SNOOT'S MAP, FED FROM THE WORLD -- generated by tools/snoot-map.py from deep16/data/world.js (" + str(W.get('from')) + "): the world's 5-mile hexes,\n"
            "   columns " + str(C0) + " to " + str(C1) + " and rows " + str(R0) + " to " + str(R1) + ", as the Snoot's grid; the roads, the places, where each unit stands on Day 14, and THE SCATTER's farms.\n"
            "   Paint in the hex map tool, EXPORT, bake the world, run the tool again -- never edit this. The page takes it as its map (SN.useMap) unless the door\n"
            "   says ?probe or ?oldmap: the 15 x 10 map in js/data.js stays the probes' fixture and the tutorial's. */\n"
            "'use strict';\n(function () {\n  var SN = window.SN = window.SN || {};\n  SN.WORLDMAP = " + json.dumps(M, separators=(',', ':')) + ";\n"
            "  if (SN.useMap && !/[?&](probe|oldmap)\\b/.test(location.search)) SN.useMap(SN.WORLDMAP);\n})();\n")
    out = os.path.join(ROOT, 'snoot-mode', 'js', 'map.js')
    if not os.path.exists(out) or io.open(out, encoding='utf-8').read() != text:
        with io.open(out, 'w', encoding='utf-8', newline='\n') as f: f.write(text)
    print('snoot-mode/js/map.js: %d x %d hexes, %d roads, %d farms in %d hexes, from %s' % (M['W'], M['H'], len(M['roads']), sum(farms.values()), len(farms), W.get('from')))
    for r, row in enumerate(rows): print('%2d %s%s' % (r, ' ' if r & 1 else '', ' '.join(row)))
    print({k: v for k, v in M.items() if k in ('pit', 'moot', 'inn', 'west', 'south', 'seats', 'roadpt', 'beside', 'start')})
    for rd in M['roads']: print(rd['name'], rd['hexes'][0], '...', rd['hexes'][-1], len(rd['hexes']))
    return 0


if __name__ == '__main__':
    sys.exit(main())

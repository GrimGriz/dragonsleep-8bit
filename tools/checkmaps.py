"""Reachability check for every map: flood-fill from each arrival point over walkable tiles
and report warps, doors, exits, NPCs, chests and triggers that can't be reached.

Walkability comes from js/art.js's tile table (pass: 1). NPCs block; chests block.
Run:  python tools/checkmaps.py
"""
import json, os, re, glob
from collections import deque

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
art = open(os.path.join(ROOT, 'js', 'art.js'), encoding='utf-8').read()
table = art[art.index('var TILES = DS.TILES = {'):]
PASS = {m.group(1): m.group(2) == '1' for m in re.finditer(r'(\w+): \{ pass: (\d)', table)}
TALK = {m.group(1) for m in re.finditer(r'(\w+): \{ pass: \d[^}]*talk: 1', table)}   # counters, bars, stalls: talk across them

maps = {}
for f in glob.glob(os.path.join(ROOT, 'content', 'maps', '*.json')):
    m = json.load(open(f, encoding='utf-8'))
    maps[m['id']] = m


def tile(m, x, y):
    rows = m['rows']
    if y < 0 or y >= len(rows) or x < 0 or x >= len(rows[y]):
        return None
    L = m['legend'][rows[y][x]]
    return L if isinstance(L, str) else L['tile']


def walk(m, x, y):
    # walkable as drawn, or once some flag opens it (a gate left open, the water stair pumped dry): reachable in SOME state
    if PASS.get(tile(m, x, y), False):
        return True
    return any(ft['x'] == x and ft['y'] == y and PASS.get(ft['tile'], False) for ft in m.get('flagTiles', []))


def arrivals(mid):
    pts = []
    for om in maps.values():
        for w in om.get('warps', []):
            if w['to'] == mid:
                pts.append((w['tx'], w['ty'], 'warp from %s' % om['id']))
                for d, a in (w.get('alt') or {}).items():
                    pts.append((a['tx'], a['ty'], 'warp from %s (entering %s)' % (om['id'], d)))
        for t in om.get('triggers', []):
            if t.get('to') == mid:
                pts.append((t['tx'], t['ty'], 'door from %s' % om['id']))
        for e in (om.get('exits') or {}).values():
            if e['to'] == mid:
                pts.append((e['tx'], e['ty'], 'exit from %s' % om['id']))
    return pts


# ground that gives no hint a warp is there
PLAIN = {'caveFloor', 'cobble', 'dirt', 'grass', 'grassT', 'plains', 'darkfloor', 'floorWood', 'floorStone', 'gravel', 'gulch', 'guano', 'dwarfFloor', 'sand', 'rug'}

problems = 0
for mid, m in sorted(maps.items()):
    W, H = len(m['rows'][0]), len(m['rows'])
    blocked = {(n['x'], n['y']) for n in m.get('npcs', []) if n.get('solid', True) and not n.get('cond')}
    blocked |= {(c['x'], c['y']) for c in m.get('chests', [])}
    starts = arrivals(mid)
    if mid == 'silverton':
        starts.append((30, 36, 'game start'))
    bad_start = [s for s in starts if not walk(m, s[0], s[1])]
    for s in bad_start:
        print('%s: arrival %s,%s (%s) lands on %s' % (mid, s[0], s[1], s[2], tile(m, s[0], s[1])))
        problems += 1
    seen = set()
    q = deque((s[0], s[1]) for s in starts if walk(m, s[0], s[1]))
    for p in q:
        seen.add(p)
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if (nx, ny) in seen or (nx, ny) in blocked:
                continue
            if walk(m, nx, ny):
                seen.add((nx, ny)); q.append((nx, ny))

    def adj(x, y):
        return any((x + dx, y + dy) in seen for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))

    def across(x, y):  # reachable by talking across a counter
        return any(tile(m, x + dx, y + dy) in TALK and (x + 2 * dx, y + 2 * dy) in seen for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))

    def check(kind, x, y, label, need_on=False):
        global problems
        ok = (x, y) in seen if need_on else ((x, y) in seen or adj(x, y) or (kind == 'npc' and across(x, y)))
        if not ok:
            print('%s: %s %s at %s,%s unreachable (tile %s)' % (mid, kind, label, x, y, tile(m, x, y)))
            problems += 1

    for w in m.get('warps', []):
        check('warp', w['x'], w['y'], '-> ' + w['to'], need_on=True)
    for t in m.get('triggers', []):
        r = t.get('rect') or [t['x'], t['y'], 1, 1]
        cells = [(r[0] + i, r[1] + j) for i in range(r[2]) for j in range(r[3])]
        on = t.get('on', 'step')
        if t['id'].startswith('wall'):
            continue
        if on == 'step':
            if not any(c in seen for c in cells):
                print('%s: step-trigger %s unreachable' % (mid, t['id'])); problems += 1
        else:
            if not any((c in seen) or adj(*c) for c in cells):
                print('%s: use-trigger %s unreachable' % (mid, t['id'])); problems += 1
    for n in m.get('npcs', []):
        check('npc', n['x'], n['y'], n['id'])
    for c in m.get('chests', []):
        check('chest', c['x'], c['y'], c.get('item', 'silver'))
    for s in m.get('signs', []):
        check('sign', s['x'], s['y'], s['text'][:30])
        if PASS.get(tile(m, s['x'], s['y']), False) and tile(m, s['x'], s['y']) not in ('stairsUp',):
            print('%s: sign at %s,%s sits on a walkable tile' % (mid, s['x'], s['y'])); problems += 1
    edges = {'west': [(0, y) for y in range(H)], 'east': [(W - 1, y) for y in range(H)], 'north': [(x, 0) for x in range(W)], 'south': [(x, H - 1) for x in range(W)]}
    exits = m.get('exits') or {}
    for edge, e in exits.items():
        if not any(p in edges[edge] and p in seen for p in edges[edge]):
            print('%s: exit %s unreachable' % (mid, edge)); problems += 1
    # dead edges: walkable ground on a map edge that goes nowhere looks like a way out (playtest 09-24, the wet)
    warp_at = {(w['x'], w['y']) for w in m.get('warps', [])}
    trig_at = set()
    for t in m.get('triggers', []):
        r = t.get('rect') or [t['x'], t['y'], 1, 1]
        trig_at |= {(r[0] + i, r[1] + j) for i in range(r[2]) for j in range(r[3])}
    if not m.get('exit'):
        for edge, cells in edges.items():
            if edge in exits:
                continue
            dead = [p for p in cells if p in seen and p not in warp_at and p not in trig_at]
            if dead:
                print('%s: %d walkable tile(s) on the %s edge lead nowhere, e.g. %s,%s' % (mid, len(dead), edge, dead[0][0], dead[0][1])); problems += 1
    # hidden warps: a way out drawn as plain ground reads as a dead end
    for w in m.get('warps', []):
        t = tile(m, w['x'], w['y'])
        on_edge = w['x'] in (0, W - 1) or w['y'] in (0, H - 1)
        if t in PLAIN and not on_edge and not w.get('hidden'):
            print('%s: warp at %s,%s (-> %s) is drawn as plain %s' % (mid, w['x'], w['y'], w['to'], t)); problems += 1
    print('%-14s reachable %4d tiles from %d arrival(s)' % (mid, len(seen), len(starts)))
print('problems:', problems)

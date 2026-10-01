"""DRAGONSLEEP map builder.

Lays out every map in code (buildings, roads, caves) and writes content/maps/<id>.json:
tile rows + legend + object placements (npcs, doors, warps, chests, signs, triggers, zones).
Geometry follows the register's maps (corridor v3, city v6, environs v3, the module sheets),
simplified for 16px tiles. Dialogue lives in content/npcs.json, keyed by npc id.

Run:  python tools/mapgen.py
"""
import json, os, random, math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'content', 'maps')

LEGENDS = {
    'world': {
        '.': 'grass', ',': 'plains', 't': 'forest', 'n': 'hills', 'g': 'gnollhills', '^': 'mountain', 'x': 'range', '*': 'peak',
        '~': 'sea', 'w': 'water', '%': 'bog', '=': 'road', 'b': 'bridge', 'v': 'bridgeV', 'f': 'farm', 'y': 'wheat',
        'u': 'gulch', 'e': 'web', 'z': 'webtree', 's': 'sand', 'c': 'cliff', 'o': 'snowfield', 'p': 'dirtpath', 'r': 'reeds',
        '1': 'silverton', '2': 'cave', '3': 'camp', '4': 'inn', '5': 'tower', '6': 'signpost', '7': 'hamlet', '8': 'cave',
    },
    'town': {
        '.': 'cobble', ',': 'dirt', '"': 'grassT', 'f': 'flowers', 't': 'tree', 'r': 'roofR', 'b': 'roofB', 's': 'roofS',
        'w': 'wall', 'o': 'wallWin', 'd': 'doorShut', 'D': 'door', '#': 'stonewall', 'e': 'edifice', 'a': 'edificeArch', 'p': 'pillar',
        'v': 'vault', '@': 'fountain', '~': 'channel', '!': 'falls', '|': 'fence', 'k': 'stockade', 'l': 'lamp', 'q': 'well',
        'm': 'stall', 'c': 'crate', 'h': 'headframe', 'n': 'tent', ':': 'sandArena', 'x': 'hexwall', 'z': 'hexwallRed',
        '-': 'bridge', '1': 'bridgeV', ' ': 'void', '^': 'mountain', 'W': 'water', 'u': 'reeds', 'y': 'wheat', 'F': 'farm',
        'i': 'flatstone', 'K': 'dock', 'S': 'sand', 'X': 'range', '=': 'road', 'Y': 'deep', 'N': 'noticeboard', 'P': 'signpost',
    },
    'inside': {
        ':': 'floorWood', ';': 'floorStone', '_': 'rug', 'c': 'counter', 'b': 'bar', 't': 'table', 'u': 'stairsUp', 'd': 'stairsDown',
        'z': 'bed', 'q': 'shelf', 'h': 'hearth', 'i': 'boxes', 'w': 'wall', 'o': 'wallWin', 'p': 'pillar', '#': 'stonewall',
        's': 'sandArena', 'x': 'hexwall', '%': 'curtain', ' ': 'void', 'k': 'crate', 'D': 'door', '.': 'darkfloor', 'l': 'lamp',
    },
    'cave': {
        '.': 'caveFloor', '#': 'caveWall', '+': 'timber', '|': 'rails', '-': 'railsH', '~': 'pool', 'w': 'deep', 'o': 'ooze',
        'g': 'guano', 'G': 'guanoDeep', 'x': 'webFloor', '_': 'dwarfFloor', 'h': 'dwarfWall', 'r': 'runeWall', 's': 'sealDoor',
        'n': 'drownStair', '>': 'holeDown', 'L': 'ladder', 'l': 'lantern', 'y': 'cradle', '=': 'gate', 'b': 'bones', '^': 'stalag',
        'f': 'fungus', ':': 'gravel', 'm': 'minecart', 'k': 'crateCave', '*': 'glowmoss', '0': 'chimney', 'u': 'stairsUp',
        'd': 'stairsDown', ' ': 'void', ',': 'dirt', '"': 'grass', 't': 'tree', 'R': 'roofB', 'S': 'roofS', 'W': 'wall',
        'O': 'wallWin', 'D': 'door', 'e': 'webtree', 'U': 'gulch', 'X': 'web', 'c': 'crate', 'q': 'well', 'T': 'tent', 'H': 'headframe',
        'F': 'fence', 'P': 'road', 'B': 'bridgeV', 'C': 'cliff', 'A': 'water', 'M': 'mountain', 'V': 'range', 'I': 'lamp', 'Q': 'cocoon',
    },
}


class Grid:
    def __init__(self, w, h, fill):
        self.w, self.h = w, h
        self.g = [[fill] * w for _ in range(h)]
        self.obj = {'npcs': [], 'warps': [], 'chests': [], 'signs': [], 'triggers': [], 'zones': []}

    def ok(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h

    def put(self, x, y, ch):
        if self.ok(x, y):
            self.g[y][x] = ch

    def get(self, x, y):
        return self.g[y][x] if self.ok(x, y) else None

    def rect(self, x, y, w, h, ch):
        for j in range(y, y + h):
            for i in range(x, x + w):
                self.put(i, j, ch)

    def frame(self, x, y, w, h, ch):
        for i in range(x, x + w):
            self.put(i, y, ch); self.put(i, y + h - 1, ch)
        for j in range(y, y + h):
            self.put(x, j, ch); self.put(x + w - 1, j, ch)

    def hline(self, x0, x1, y, ch):
        for i in range(min(x0, x1), max(x0, x1) + 1):
            self.put(i, y, ch)

    def vline(self, x, y0, y1, ch):
        for j in range(min(y0, y1), max(y0, y1) + 1):
            self.put(x, j, ch)

    def path(self, pts, ch, width=1, only=None):
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            x, y = x0, y0
            while True:
                for dx in range(width):
                    for dy in range(width):
                        if only is None or self.get(x + dx, y + dy) in only:
                            self.put(x + dx, y + dy, ch)
                if (x, y) == (x1, y1):
                    break
                # step along the longer axis first, keeps 4-connected paths
                if abs(x1 - x) >= abs(y1 - y) and x != x1:
                    x += 1 if x1 > x else -1
                elif y != y1:
                    y += 1 if y1 > y else -1

    def blob(self, cx, cy, rx, ry, ch, rng=None, rough=0.0, only=None):
        for j in range(int(cy - ry - 2), int(cy + ry + 3)):
            for i in range(int(cx - rx - 2), int(cx + rx + 3)):
                dx, dy = (i + .5 - cx) / rx, (j + .5 - cy) / ry
                d = dx * dx + dy * dy
                n = (rng.random() - .5) * rough if rng else 0
                if d + n <= 1 and (only is None or self.get(i, j) in only):
                    self.put(i, j, ch)

    def building(self, x, y, w, h, roof='r', door=None, windows=True, doorch='D'):
        """roof rows y..y+h-2, wall row y+h-1. door = x offset of the door (or list)."""
        self.rect(x, y, w, h - 1, roof)
        for i in range(w):
            self.put(x + i, y + h - 1, 'o' if windows and i % 2 == 1 else 'w')
        doors = door if isinstance(door, list) else ([door] if door is not None else [])
        out = []
        for d in doors:
            self.put(x + d, y + h - 1, doorch)
            out.append((x + d, y + h - 1))
        return out

    # objects
    def npc(self, id, x, y, look=None, **kw):
        o = {'id': id, 'x': x, 'y': y}
        if look: o['look'] = look
        o.update(kw)
        self.obj['npcs'].append(o)

    def warp(self, x, y, to, tx, ty, dir=None, **kw):
        o = {'x': x, 'y': y, 'to': to, 'tx': tx, 'ty': ty}
        if dir: o['dir'] = dir
        o.update(kw)
        self.obj['warps'].append(o)

    def door(self, x, y, script, arg=None, **kw):
        o = {'id': '%s:%s' % (script, arg), 'x': x, 'y': y, 'on': 'step', 'script': script, 'arg': arg, 'back': 'down'}
        o.update(kw)
        self.obj['triggers'].append(o)

    def flagtile(self, x, y, tile, cond):
        """swap a tile at map load once cond holds (a gate left open, a cocoon cut down)"""
        self.obj.setdefault('flagTiles', []).append({'x': x, 'y': y, 'tile': tile, 'cond': cond})

    def trig(self, id, x, y, script, arg=None, on='step', w=1, h=1, **kw):
        o = {'id': id, 'rect': [x, y, w, h], 'on': on, 'script': script}
        if arg is not None: o['arg'] = arg
        o.update(kw)
        self.obj['triggers'].append(o)

    def chest(self, x, y, item=None, n=1, silver=0, **kw):
        o = {'x': x, 'y': y}
        if item: o['item'] = item; o['n'] = n
        if silver: o['silver'] = silver
        o.update(kw)
        self.obj['chests'].append(o)

    def sign(self, x, y, text, src, **kw):
        o = {'x': x, 'y': y, 'text': text, 'src': src}
        o.update(kw)
        self.obj['signs'].append(o)

    def zone(self, zone, x, y, w, h, tiles=None, cond=None):
        o = {'zone': zone, 'rect': [x, y, w, h]}
        if tiles: o['tiles'] = tiles
        if cond: o['cond'] = cond
        self.obj['zones'].append(o)

    def rows(self):
        return [''.join(r) for r in self.g]


MAPS = {}


def save(id, grid, tileset, name, **meta):
    rows = grid.rows()
    legend = dict(LEGENDS[tileset])
    legend.update(meta.pop('legend', {}))
    for r in rows:
        for ch in r:
            if ch not in legend:
                raise SystemExit('map %s: char %r not in legend' % (id, ch))
    d = {'id': id, 'name': name, 'tileset': tileset, 'rows': rows, 'legend': legend}
    d.update(meta)
    for k, v in grid.obj.items():
        if v:
            d[k] = v
    MAPS[id] = d


# ============================================================ THE CORRIDOR (overworld)
def build_world():
    W, H = 64, 58
    rng = random.Random(9230)
    g = Grid(W, H, '.')
    # plains texture
    for _ in range(90):
        g.blob(rng.randint(0, W), rng.randint(14, H), rng.uniform(1, 3), rng.uniform(1, 2), ',', rng, .6)
    # the chain across the north, ragged south edge; peaks near the top
    for x in range(W):
        edge = 9 + int(1.6 * math.sin(x / 3.1) + rng.random() * 1.4)
        for y in range(0, edge):
            g.put(x, y, 'x' if y < edge - 2 else '^')
        if rng.random() < .5:
            g.put(x, rng.randint(0, 3), '*')
    # the black mountains on the west edge, sea to the NE and down the east coast
    for y in range(H):
        for x in range(0, 3 + (1 if y % 5 == 2 else 0)):
            g.put(x, y, 'x')
    g.blob(62, 3, 11, 10, '~', rng, .3)
    for y in range(10, H):
        g.put(W - 1, y, '~'); g.put(W - 2, y, '~')
        if rng.random() < .6: g.put(W - 3, y, '~')
        g.put(W - 3 if g.get(W - 3, y) != '~' else W - 4, y, 'c')
    # snowfield along the Doors road's upper slope
    # Silverton sits against the Edifice's mountain
    SX, SY = 37, 11
    g.rect(SX - 2, SY - 2, 5, 2, '^')
    # the river: from the town east to the sea along y=12
    g.path([(SX + 1, 12), (53, 12), (56, 11)], 'w')
    # farm belt on the south bank (five owner-families), feed track along the bank
    for i, x0 in enumerate([40, 45, 49, 53]):
        g.rect(x0, 15, 3 + (i % 2), 5, 'f' if i % 2 == 0 else 'y')
    g.path([(SX + 1, 13), (58, 13)], 'p')
    # the Warrens mouth camp on the north bank, bridge across
    g.put(46, 11, '3'); g.put(46, 12, 'v'); g.put(45, 10, '^'); g.put(47, 10, '^')
    # the fork one mile west; the Tower north of the road by the fork
    FX, FY = 31, 14
    g.path([(SX - 1, SY), (SX - 1, 12), (34, 13), (FX, 13), (FX, FY)], '=')
    g.put(30, 12, '5')
    # the Castegut road west, along the south edge of the Glowseep
    g.path([(FX, FY), (FX - 1, 16), (5, 16)], '=')
    g.put(4, 16, '6')
    # the Glowseep: bog nuzzled up under the Galleries, north of the road
    g.blob(18, 13.2, 10.5, 2.6, '%', rng, .5, only=['.', ','])
    g.blob(12, 17.5, 5, 1.4, '%', rng, .5, only=['.', ','])
    # the Guano Galleries: the mouth in the mountain skirt west of town
    g.put(23, 10, '2'); g.put(22, 10, '^'); g.put(24, 10, '^')
    g.path([(23, 11), (23, 15), (23, 16)], 'p')
    # the Doors road up the mountain from Silverton (north edge = expansion wall)
    g.path([(SX, SY - 1), (SX, 8), (38, 7), (38, 5), (36, 4), (36, 2), (37, 1), (37, 0)], 'p')
    for y in range(0, 7):
        for x in range(34, 41):
            if g.get(x, y) in ('^', 'x', '*') and rng.random() < .35 and g.get(x, y) != 'p':
                g.put(x, y, 'o')
    g.put(SX, SY, '1')
    # Gnoll Hills: the big pocket to the south-west ("a warning to whoever reads the map")
    g.blob(15, 36, 12, 13, 'g', rng, .35, only=['.', ','])
    # the road south from the fork: the gulch, then the inn, then on toward the Pit
    g.path([(FX, 15), (32, 18), (32, 22), (32, 31), (33, 34), (33, 44), (33, 52), (34, H - 1)], '=')
    # Web Gulch straddles the road south of the fork
    g.blob(32, 26, 5.5, 4.6, 'u', rng, .35)
    for (x, y) in [(28, 24), (29, 28), (35, 23), (36, 27), (30, 22), (34, 29), (28, 26), (36, 25)]:
        g.put(x, y, 'z')
    for _ in range(12):
        x, y = rng.randint(28, 36), rng.randint(22, 30)
        if g.get(x, y) == 'u': g.put(x, y, 'e')
    g.path([(32, 22), (32, 31)], '=')
    g.put(31, 26, '8')  # the silk-cutters' descent into the ravine proper
    g.put(30, 26, 'u'); g.put(30, 27, 'u'); g.put(31, 27, 'u')
    # Halfway Inn: the lake EAST of the road, the inn between road and water
    g.blob(38.5, 38, 4.2, 3.6, 'w', rng, .25)
    g.put(34, 37, '4')
    for (x, y) in [(35, 35), (35, 41), (42, 36), (43, 39)]:
        if g.get(x, y) != 'w': g.put(x, y, 'r')
    # forests and groves
    for (cx, cy, rx, ry) in [(41, 24, 3.5, 3), (44, 27, 2.5, 2), (27, 19, 2, 1.5), (8, 22, 2.5, 2), (47, 45, 3, 2.4), (25, 52, 3, 2),
                             (50, 21, 2, 1.4), (38, 50, 2.5, 2), (56, 32, 2, 3)]:
        g.blob(cx, cy, rx, ry, 't', rng, .5, only=['.', ','])
    # the Verge: open plains to the south-east
    g.blob(52, 44, 8, 11, ',', rng, .6, only=['.', 't'])
    for _ in range(8):
        g.put(rng.randint(46, 58), rng.randint(34, 54), 'n')
    # hills texture
    for (cx, cy) in [(26, 42), (42, 31), (49, 30), (28, 48)]:
        g.blob(cx, cy, 1.8, 1.2, 'n', rng, .5, only=['.', ','])
    # keep the road clean
    g.path([(FX, 15), (32, 18), (32, 22), (32, 31), (33, 34), (33, 44), (33, 52), (34, H - 1)], '=', only=['g', 't', 'n', 'w', 'u', 'e', 'z', ',', '.', '%', 'r'])
    # ---- objects
    # the town icon lets you in by the gate you walked up to: down the Doors road = the north gate, etc.
    g.warp(SX, SY, 'silverton', 1, 8, 'right', mapName=True,
           alt={'down': {'tx': 6, 'ty': 1, 'dir': 'down'}, 'up': {'tx': 29, 'ty': 43, 'dir': 'up'}, 'left': {'tx': 58, 'ty': 7, 'dir': 'left'}})
    g.warp(46, 11, 'warrens_a', 20, 17, 'up')
    g.warp(23, 10, 'galleries_g1', 17, 22, 'up')
    g.warp(31, 26, 'gulch', 3, 5, 'right')
    g.warp(34, 37, 'halfway', 1, 10, 'right')
    g.trig('snoot', 31, 47, 'snoot', w=5, h=1, cond='!flag:snootDone')
    g.sign(30, 12, 'THE TOWER. The sign says "Wizard School." Everyone calls it the Tower. The door does not open for you.', 'wiki/silverton.md; wiki/vice-row.md (the Wizard School = the Tower)', cond='!flag:towerFled')
    g.trig('towerDoor', 30, 12, 'expansion', 'tower', on='use', cond='flag:towerFled')   # after Amara rides in: the expansion wall
    g.sign(4, 16, 'The Castegut road runs on west, weak and thin, north of the Gnoll Hills. Not this road. Not this time.', 'wiki/the-road.md (the Castegut road); edge text invented.json#west-edge')
    g.trig('wallNorth', 0, 0, 'expansion', 'north', w=W, h=1)
    g.trig('wallSouth', 0, H - 1, 'expansion', 'south', w=W, h=1)
    # encounter zones (first match wins)
    g.zone('doors', 33, 0, 9, 10)
    g.zone('glowseep', 0, 0, W, H, tiles=['bog'])
    g.zone('gulch', 0, 0, W, H, tiles=['gulch', 'web'])
    g.zone('gnollhills', 0, 0, W, H, tiles=['gnollhills'])
    g.zone('snoot', 20, 31, 30, 27, cond='!flag:snootDone')
    g.zone('verge', 43, 30, 21, 28)
    g.zone('south', 0, 31, W, 27)
    g.zone('north', 0, 0, W, 31)
    save('world', g, 'world', 'The Corridor', music='corridor', bg='plains', outside=True,
         tileZones={'road': None}, roadSafe=True, void='#000')


# ============================================================ SILVERTON
def build_silverton():
    W, H = 60, 46
    g = Grid(W, H, '.')
    # the chain behind, the falls, the Edifice and its fountains
    g.rect(0, 0, W, 2, '^')
    g.rect(0, 2, 11, 5, '^'); g.rect(49, 2, 11, 2, '^')
    g.rect(11, 2, 38, 4, 'e')
    for x in (13, 17, 21, 25, 34, 38, 42, 46):
        g.put(x, 4, 'a'); g.put(x, 5, 'a')
    g.rect(29, 0, 2, 4, '!')
    g.put(29, 5, 'v'); g.put(30, 5, 'v'); g.put(29, 4, 'e'); g.put(30, 4, 'e')
    g.rect(49, 4, 11, 2, '~')  # the outlet river leaves the Edifice's east end
    for x in (13, 17, 21, 25, 34, 38, 42, 46):
        g.put(x, 6, '@')
    g.rect(3, 6, 8, 1, '.')
    # the north gate: a cut up through the mountain's skirt to the Doors road
    g.rect(6, 0, 2, 6, ',')
    g.put(5, 5, 'P')
    # stockade (landward), gates west (the road), east (feed track), south (gate track)
    g.vline(2, 9, 44, 'k'); g.vline(57, 9, 44, 'k'); g.hline(2, 57, 44, 'k')
    g.vline(2, 6, 6, 'k'); g.rect(0, 7, 3, 2, ',')
    g.rect(57, 7, 3, 2, ',')
    g.put(29, 44, ','); g.put(30, 44, ',')
    g.rect(0, 9, 2, 36, '^'); g.rect(58, 9, 2, 36, '"')
    # Fountain Street rows 7-8 already cobble. Block one: the paper layer, doors onto row 12
    doors = {}
    doors['winters'] = g.building(4, 9, 6, 3, 's', 3)
    doors['casper'] = g.building(11, 9, 5, 3, 'r', 2)
    doors['androit'] = g.building(17, 9, 5, 3, 'b', 2)
    doors['weigh'] = g.building(23, 9, 5, 3, 's', 2)
    doors['kessler'] = g.building(32, 9, 5, 3, 'r', 2)
    doors['calla'] = g.building(38, 9, 5, 3, 'b', 2)
    doors['factor'] = g.building(44, 9, 5, 3, 's', 2)
    doors['lantern'] = g.building(50, 9, 6, 3, 'r', 3)
    g.put(24, 11, 'N')                                        # the Weigh-House board, on its front wall
    for x in (15, 23, 36, 44):                               # lamps along the Edifice side of Fountain Street
        g.put(x, 6, 'l')
    # block two: doors onto row 16
    doors['cassia'] = g.building(3, 13, 7, 3, 'r', 3)
    doors['mela'] = g.building(11, 13, 4, 3, 'b', 1)
    doors['marin'] = g.building(16, 13, 4, 3, 'r', 2)
    doors['lisbet'] = g.building(21, 13, 4, 3, 'b', 1)
    doors['brennan'] = g.building(33, 13, 5, 3, 'b', 2)
    doors['marko'] = g.building(39, 13, 5, 3, 'r', 2)
    doors['kasten'] = g.building(45, 13, 4, 3, 'b', 1)
    doors['venn'] = g.building(50, 13, 5, 3, 's', 2)
    # ---- the Gate Plaza & Arena Quarter: the Hex, hexagonal, fronting the gates
    cx, cy = 29.5, 26.5
    hexcells = set()
    for y in range(18, 36):
        for x in range(19, 41):
            dx, dy = abs(x + .5 - cx), abs(y + .5 - cy)
            if dy <= 8.2 and dx <= 9.5 - max(0, dy - 4.2) * 1.05:
                hexcells.add((x, y))
    for (x, y) in hexcells:
        dx, dy = abs(x + .5 - cx), abs(y + .5 - cy)
        if (x, y + 1) not in hexcells or (x, y + 2) not in hexcells:
            ch = 'z' if (x, y + 1) in hexcells else 'x'   # the facade: a red band over the timber
        elif dy <= 3.4 and dx <= 4.8 - max(0, dy - 1.6) * 1.1:
            ch = ':'                                        # the roof is a ring: the sand open to the sky
        else:
            ch = 'b'
        g.put(x, y, ch)
    # south double doors (the front), north doors (the back)
    for x in (29, 30):
        g.put(x, 34, 'D')
    # Mama's Pharmakaiea in the NNE wall (out the north door, take a right)
    g.building(36, 17, 4, 3, 'r', 1)
    # betting stalls, stables, show-armorer, leech-house, cook-stalls, the arena family's house
    g.put(22, 36, 'm'); g.put(23, 36, 'm')
    doors['venhale'] = g.building(43, 21, 6, 3, 'b', 2)
    doors['vilar'] = g.building(43, 26, 5, 3, 'r', 2)
    g.put(35, 36, 'm'); g.put(36, 36, 'm'); g.put(37, 36, 'm')
    g.building(43, 30, 5, 3, 'r', 2, doorch='d')
    # ---- vice row, south of the Hex
    g.hline(19, 42, 38, '.')
    g.building(19, 39, 4, 3, 's', 1, doorch='d')           # the row's cut (the landlord's)
    g.put(24, 40, 'm')                                       # Sylvia's booth
    doors['percy'] = g.building(26, 39, 4, 3, 'b', 1)
    g.put(31, 40, 'm'); g.put(32, 40, 'm')                   # the Vizardry mask-booth
    doors['tam'] = g.building(34, 39, 4, 3, 'r', 1)
    g.building(39, 39, 4, 3, 's', 2, doorch='d')             # card cellars
    # ---- the Shaft Rows (south-west): shacks, headframes, dirt
    g.rect(3, 17, 15, 27, ',')
    for (x, y) in [(4, 18), (9, 19), (14, 18), (5, 24), (11, 25), (4, 31), (15, 32), (8, 37), (13, 41), (4, 42)]:
        g.put(x, y, 'h')
    for (x, y, w) in [(6, 21, 3), (3, 27, 3), (8, 28, 3), (12, 29, 3), (5, 34, 3), (11, 35, 3), (15, 38, 3), (4, 39, 3)]:
        g.building(x, y, w, 2, 'b', None, windows=False)
    doors['aldwin'] = g.building(7, 40, 5, 3, 's', 2)        # the mission chapel
    doors['davos'] = g.building(13, 26, 5, 3, 's', 2)        # the leech-house, the arena's own surgery
    doors['kess'] = g.building(15, 23, 2, 2, 'b', 1)         # cellar door in an old shaft mouth
    g.put(14, 23, 'h')
    g.rect(10, 31, 3, 2, 'c'); g.put(13, 31, '|'); g.put(9, 31, '|')   # the timber yard
    g.put(3, 24, 'c'); g.put(17, 34, 'q')
    # ---- Riverside (east): warehouses, grass to the stockade
    g.rect(42, 34, 15, 10, '"')
    g.building(49, 30, 6, 3, 's', 2, doorch='d')
    g.building(51, 34, 5, 3, 's', 2, doorch='d')
    doors['mical'] = g.building(44, 38, 6, 3, 's', 3)
    for (x, y) in [(43, 42), (55, 41), (56, 38), (42, 35)]:
        g.put(x, y, 't')
    g.put(44, 41, 'f'); g.put(45, 42, 'f'); g.put(53, 42, 'f')
    # lamps round the plaza
    for (x, y) in [(19, 18), (40, 18), (19, 36), (40, 36), (26, 17), (44, 25)]:
        if g.get(x, y) == '.': g.put(x, y, 'l')
    # ---- objects: shop and keeper doors
    D = lambda k: doors[k][0]
    # icon = the hanging sign drawn over the door (js/world.js DS.doorSign)
    g.door(*D('winters'), 'warp', 'winters', to='winters', tx=4, ty=6, icon='ring')
    g.door(*D('casper'), 'keeper', 'casper'); g.door(*D('androit'), 'keeper', 'androit'); g.door(*D('weigh'), 'keeper', 'hessle', icon='scales')
    g.door(*D('kessler'), 'shop', 'kessler', icon='coin'); g.door(*D('calla'), 'shop', 'calla', icon='potion'); g.door(*D('factor'), 'keeper', 'falstaff')
    g.door(*D('lantern'), 'keeper', 'merrick'); g.door(*D('cassia'), 'inn', 'cassia', icon='bed'); g.door(*D('mela'), 'keeper', 'mela')
    g.door(*D('marin'), 'keeper', 'marin'); g.door(*D('lisbet'), 'shop', 'lisbet', icon='star'); g.door(*D('brennan'), 'keeper', 'brennan')
    g.door(*D('marko'), 'shop', 'marko', icon='pack'); g.door(*D('kasten'), 'shop', 'kasten', icon='candle'); g.door(*D('venn'), 'keeper', 'barber')
    g.door(*D('venhale'), 'keeper', 'venhale'); g.door(*D('vilar'), 'shop', 'vilar', icon='sword'); g.door(*D('davos'), 'leech', 'davos', icon='stitch')
    g.door(*D('percy'), 'warp', 'percy', to='percy', tx=4, ty=6, icon='jar'); g.door(*D('tam'), 'keeper', 'tam'); g.door(*D('aldwin'), 'chapel', 'aldwin', icon='sun')
    g.door(*D('kess'), 'keeper', 'kess'); g.door(*D('mical'), 'keeper', 'mical')
    g.door(37, 19, 'shop', 'lucia', icon='mortar')
    g.trig('board', 24, 11, 'board', on='use')
    g.warp(29, 34, 'hex', 10, 18, 'up'); g.warp(30, 34, 'hex', 11, 18, 'up')
    # people in the streets
    g.npc('marta', 36, 37, 'marta', dir='up')
    g.npc('gull', 9, 22, 'rogue', wander=1)
    g.npc('kael', 11, 33, 'worker', dir='up')
    g.npc('brennock', 5, 26, 'oldhand', dir='down')
    g.npc('vera', 6, 31, 'girl', wander=1)
    g.npc('oldhob', 17, 24, 'oldhand', dir='left', cond='!flag:hobMet')
    g.npc('papa', 28, 35, 'papa', dir='down', solid=True, face=False)
    g.npc('vivian', 25, 41, 'vivian', dir='down', hire='vivian', idle=True, lantern=True)
    g.npc('aurdinChapel', 11, 43, 'aurdin', dir='up', hire='aurdin')
    g.npc('pete', 20, 34, 'worker2', dir='down')
    g.npc('guard1', 3, 8, 'guard', dir='right')
    g.npc('towns1', 20, 8, 'merchant', wander=3)
    g.npc('towns2', 40, 7, 'girl', wander=3)
    g.npc('towns3', 27, 16, 'worker', wander=3)
    g.npc('towns4', 47, 19, 'boy', wander=2)
    g.npc('towns5', 8, 30, 'worker2', wander=2)
    g.npc('towns6', 46, 33, 'clerk', wander=2)
    g.npc('towns7', 36, 12, 'noble', wander=2)
    g.npc('towns8', 14, 36, 'girl', wander=2)
    g.npc('idony', 18, 12, 'clerk', dir='down')
    g.npc('signy', 9, 36, 'signy', dir='down', cond='flag:lakeDone & !flag:heirDone')
    g.npc('elsbethCandles', 30, 42, 'elsbeth', dir='down', idle=True, lantern=True, cond='flag:postgame')   # after the lake: the new candle girl
    g.sign(5, 5, 'NORTH GATE. The Doors road, up the mountain. The locals call it the Coldridge route.', 'wiki/the-road.md (the Doors road); rumors r-coldridge (wiki/fountain-street.md HD-1)')
    g.sign(29, 5, 'The vault door. The highway to Deepholm. Nobody bothers the dwarves. Not since the Water Burning.', 'wiki/silverton.md (the one law: nobody bothers the dwarves)', cond='!flag:frontDoor')
    g.sign(30, 5, 'The vault door. The highway to Deepholm. Nobody bothers the dwarves. Not since the Water Burning.', 'wiki/silverton.md (the one law: nobody bothers the dwarves)', cond='!flag:frontDoor')
    g.trig('vaultDoor', 29, 5, 'warp', on='use', w=2, cond='flag:frontDoor', to='solskaft', tx=27, ty=46)   # for them only (spec §4.5)
    g.sign(24, 40, "Sylvia Swann's booth: an owl painted on the board. The short reading, five silver. She isn't in.", 'wiki/silverton.md; the-lab/pit-maps/shops-silverton.json pin 37')
    g.sign(31, 40, 'The Vizardry mask-booth. Crude vizards with a hedge-glamour, a gold the hour. The real house is somewhere else.', 'wiki/vice-row.md; the-lab/pit-maps/shops-silverton.json pin 39')
    g.sign(40, 41, 'The card cellars. Low table buy-in five silver. The stairs go down; you do not.', 'the-lab/pit-maps/shops-silverton.json pin 41')
    g.sign(45, 32, 'The arena family\'s house. The door is shut.', 'wiki/silverton.md (pin 24, the arena family\'s house); reserved')
    g.sign(20, 41, "The row's cut. The landlord's door.", 'wiki/silverton.md (vice row; Vondercamp reserved)')
    g.sign(22, 36, "Betting stalls. Book made openly on fights, quietly on everything else.", 'the-lab/pit-maps/shops-silverton.json pin 18')
    g.sign(50, 32, 'Warehouses. No quay: the river is too small and fast to carry anything.', 'wiki/silverton.md; wiki/fountain-street.md (Mical)')
    save('silverton', g, 'town', 'Silverton', music='town', bg='town', outside=True,
         exits={'west': {'to': 'world', 'tx': 36, 'ty': 11, 'dir': 'left'}, 'east': {'to': 'world', 'tx': 38, 'ty': 13, 'dir': 'right'},
                'south': {'to': 'world', 'tx': 37, 'ty': 12, 'dir': 'down'}, 'north': {'to': 'world', 'tx': 37, 'ty': 10, 'dir': 'up'}})


# ============================================================ THE HEX (ground floor + the gambling floor)
def build_hex():
    W, H = 22, 21
    g = Grid(W, H, ' ')
    cx, cy = 11, 10
    for y in range(H):
        for x in range(W):
            dx, dy = abs(x + .5 - cx), abs(y + .5 - cy)
            if dy <= 10 and dx <= 11 - max(0, dy - 5) * 1.1:
                g.put(x, y, 'x')
            if dy <= 9 and dx <= 10 - max(0, dy - 5) * 1.1:
                g.put(x, y, ':')
    # the sand at the centre, two tiers down to it
    for y in range(H):
        for x in range(W):
            dx, dy = abs(x + .5 - cx), abs(y + .5 - cy)
            if dy <= 3.2 and dx <= 4.5 - max(0, dy - 1.5) * 1.1:
                g.put(x, y, 's')
    # four bars: SSE and SSW long, E and W short (moved north off their doors)
    g.hline(4, 8, 16, 'b'); g.hline(13, 17, 16, 'b')
    g.vline(2, 7, 9, 'b'); g.vline(19, 7, 9, 'b')
    # the Wall of Boxes behind the SSE bar
    g.hline(13, 17, 17, 'i')
    # spiral stairs either side of the north point; round tables in the notches
    g.put(9, 2, 'u'); g.put(12, 2, 'u')
    g.put(6, 3, 't'); g.put(15, 3, 't')
    g.put(5, 12, 't'); g.put(16, 12, 't'); g.put(4, 5, 'k'); g.put(17, 5, 'k')
    # front double doors (south), back doors (north)
    g.put(10, 19, 'D'); g.put(11, 19, 'D')
    g.put(10, 0, 'x'); g.put(11, 0, 'x')
    g.warp(10, 19, 'silverton', 29, 35, 'down'); g.warp(11, 19, 'silverton', 30, 35, 'down')
    g.warp(9, 2, 'hex2', 8, 2, 'down'); g.warp(12, 2, 'hex2', 11, 2, 'down')
    g.npc('korvinSlate', 11, 14, 'noble', dir='up')
    g.npc('barleyBench', 14, 15, 'barley', dir='down', hire='barley')
    g.npc('lymenHex', 16, 11, 'lymen', dir='left', hire='lymen')
    g.npc('talmok', 11, 6, 'orc', dir='down')
    g.npc('bartenderS', 6, 17, 'merchant', dir='up')
    g.npc('bartenderE', 20, 8, 'worker', dir='left')
    g.npc('warrenspete', 4, 14, 'worker2', dir='right')
    g.npc('hexpatron1', 8, 8, 'worker', wander=1)
    g.npc('hexpatron2', 15, 7, 'girl', wander=1)
    g.npc('warda', 10, 3, 'warda', dir='down')
    g.sign(15, 17, "The Wall of Boxes. Twenty-seven iron boxes, nine by three. Wins in, nothing out till thirty; then a man walks to the lantern free.", 'wiki/the-hex.md (the Wall of Boxes)')
    save('hex', g, 'inside', 'The Hex', music='hex', bg='arena', save=True, legend={'x': 'hexwall'})

    W2, H2 = 20, 16
    g2 = Grid(W2, H2, ' ')
    for y in range(H2):
        for x in range(W2):
            dx, dy = abs(x + .5 - 10), abs(y + .5 - 8)
            if dy <= 8 and dx <= 10 - max(0, dy - 4) * 1.2:
                g2.put(x, y, 'x')
            if dy <= 7 and dx <= 9 - max(0, dy - 4) * 1.2:
                g2.put(x, y, '_')
    for y in range(H2):
        for x in range(W2):
            dx, dy = abs(x + .5 - 10), abs(y + .5 - 8.5)
            if dy <= 3 and dx <= 4 - max(0, dy - 1.5):
                g2.put(x, y, ' ')
    for (x, y) in [(4, 5), (15, 5), (4, 11), (15, 11), (7, 13), (12, 13)]:
        g2.put(x, y, 't')
    g2.put(8, 1, 'd'); g2.put(11, 1, 'd')
    g2.warp(8, 1, 'hex', 9, 3, 'down'); g2.warp(11, 1, 'hex', 12, 3, 'down')
    g2.npc('gambler1', 5, 6, 'noble', dir='right')
    g2.npc('gambler2', 14, 12, 'noble', dir='left')
    g2.npc('vairseat', 15, 6, 'noble', dir='left')
    g2.sign(10, 11, 'The rail. Below, the sand. The roof is a ring: on a new-moon night you see the stars.', 'wiki/the-hex.md (the building as built)')
    save('hex2', g2, 'inside', 'The Hex — the gambling floor', music='hex', bg='arena', legend={'x': 'hexwall', '_': 'rug'})


def build_percy():
    # Percy's Particulars: jars in ranks behind the counter, a hand too good for the street on every label
    g = Grid(10, 8, 'w')
    g.rect(1, 1, 8, 6, ':')
    g.hline(1, 8, 1, 'q'); g.hline(1, 8, 0, 'q')
    g.hline(1, 8, 3, 'c'); g.put(8, 3, ':')
    g.put(1, 5, 'k'); g.put(8, 5, 'i'); g.put(8, 6, 'k')
    g.put(4, 7, 'D')
    g.npc('percy', 3, 2, 'percy', dir='down')
    g.npc('ned', 6, 2, 'ned', dir='down')
    g.sign(1, 5, "The shelf card, in Percy's good hand: guano-and-sulfur, the paper, 1 sp. Sulfur 5 cp. Saltpeter 1 sp. Glow-moss, the pinch, 5 cp. Jar-fly, live, 1 sp. Gulch silk, the skein, 5 sp. Pressed black cake 2 sp. Darkmantle hide, cured, 2 gp. Crawler ichor: ask.",
           'the-lab/pit-maps/shops-silverton.json pin 38 (Percy\'s shelf, CANON 09-09)')
    g.warp(4, 7, 'silverton', 27, 42, 'down')
    save('percy', g, 'inside', "Percy's Particulars", music='town', bg='town')


def build_winters():
    g = Grid(10, 8, 'w')
    g.rect(1, 1, 8, 6, ':')
    g.hline(1, 8, 0, 'q'); g.put(1, 1, 'q'); g.put(8, 1, 'q')
    g.hline(2, 7, 3, 'c')
    g.put(4, 7, 'D'); g.put(1, 5, 'k'); g.put(8, 5, 'k'); g.put(5, 5, '_'); g.put(4, 5, '_')
    g.npc('winters', 4, 2, 'winters', dir='down')
    g.warp(4, 7, 'silverton', 7, 12, 'down')
    save('winters', g, 'inside', 'Acquisitions & Estates', music='town', bg='town')


# ============================================================ THE CRAWLER WARRENS
def build_warrens():
    # ---- Sheet A: the mouth camp (surface). North up: the chain, six mouths, the camp, the river, the south bank
    W, H = 40, 27
    g = Grid(W, H, ',')
    g.rect(0, 0, W, 4, 'V')
    g.rect(0, 4, W, 1, 'M')
    mouths = {}
    for i, x in enumerate([3, 9, 15, 21, 27, 33]):
        n = i + 1
        g.put(x, 4, '.' if n in (1, 6) else '=')
        g.put(x, 3, '.')
        mouths[n] = x
    # camp buildings: tally-house, dose-shed, Skarn's office, sledge yard, kitchen, bunkhouse
    g.rect(4, 6, 4, 1, 'R'); g.hline(4, 7, 7, 'W'); g.put(6, 7, 'D')
    g.rect(10, 6, 3, 1, 'S'); g.hline(10, 12, 7, 'W')
    g.rect(13, 6, 3, 1, 'R'); g.hline(13, 15, 7, 'W'); g.put(14, 7, 'D')
    for (x, y) in [(18, 7), (20, 8), (23, 7), (25, 8)]:
        g.put(x, y, 'c')
    g.rect(28, 6, 3, 1, 'R'); g.hline(28, 30, 7, 'W'); g.put(29, 7, 'D'); g.put(31, 7, 'q')
    g.rect(33, 6, 6, 1, 'S'); g.hline(33, 38, 7, 'O'); g.put(35, 7, 'D')
    g.path([(20, 9), (20, 13)], ',')
    # the river runs east; the bridge
    g.rect(0, 13, W, 3, 'A')
    g.put(20, 13, 'B'); g.put(20, 14, 'B'); g.put(20, 15, 'B')
    # south bank: the feed track west, the warehouse road east, sheds, the Pellam barns, the old line
    g.rect(0, 16, W, 11, '"')
    g.hline(0, W - 1, 17, 'P')
    for x in (12, 15, 23):
        g.put(x, 19, 'W')
    g.rect(3, 21, 6, 1, 'R'); g.hline(3, 8, 22, 'W'); g.put(5, 22, 'D')
    g.rect(10, 21, 5, 1, 'R'); g.hline(10, 14, 22, 'W')
    g.frame(2, 20, 14, 6, 'F'); g.put(9, 20, '"')
    for y in range(19, 27):
        for x in range(26, 40):
            g.put(x, y, 'y' if (y % 2) else 'f')
    # objects (mouth 3 first: the pinned-quest marker routes by the first way it finds, and this is the daytime way)
    g.put(mouths[3], 4, 'd'); g.put(mouths[1], 3, 'd'); g.put(mouths[6], 3, 'd')   # the open mouths read as ways down
    g.warp(mouths[3], 4, 'warrens_b', 13, 26, 'up')
    g.warp(mouths[1], 3, 'warrens_c', 2, 16, 'up')
    g.warp(mouths[6], 3, 'warrens_c', 45, 16, 'up')
    for n in (2, 4, 5):
        g.trig('pen%d' % n, mouths[n], 4, 'pen', n, on='use')
    g.npc('skarn', 15, 8, 'skarn', dir='down')
    g.npc('edric', 7, 8, 'clerk', dir='down')
    g.npc('jory', 11, 5, 'worker', dir='down')
    g.npc('hobCamp', 30, 8, 'oldhand', dir='down')
    g.npc('linnet', 20, 18, 'girl', dir='up', cond='!flag:fiveDone')
    g.npc('dunmoreLine', 20, 12, 'guard', dir='down', cond='flag:stockDead & !flag:lineBroken')
    g.sign(7, 7, "THE BOARD. One silver the sealed thimble above the wet; three below. Six draws to a shift. Antitoxin draught, one silver. Not taken: anyone with a lamp in Mouth One or Mouth Six after dark. — SKARN", 'WarrensModule/handouts/handout-galleries-hands-wanted.md (the bill)')
    g.door(6, 7, 'shop', 'tally', back='down')
    g.door(29, 7, 'keeper', 'kitchen', back='down')
    g.door(35, 7, 'keeper', 'bunkhouse', back='down')
    g.door(14, 7, 'keeper', 'skarnoffice', back='down')
    g.door(5, 22, 'keeper', 'pellambarn', back='down')
    save('warrens_a', g, 'cave', 'The Crawler Warrens — the mouth camp', music='field', bg='plains', outside=True,
         exits={'west': {'to': 'world', 'tx': 45, 'ty': 13, 'dir': 'left'}, 'east': {'to': 'world', 'tx': 47, 'ty': 13, 'dir': 'right'},
                'south': {'to': 'world', 'tx': 46, 'ty': 13, 'dir': 'down'}})

    # ---- Sheet B: the stalls and the lit galleries. Mouths come in from the south edge.
    W, H = 36, 28
    g = Grid(W, H, '#')
    pens = [7, 13, 21, 27]
    for x in pens:
        g.vline(x, 20, 27, '.'); g.put(x + 1, 24, 'y'); g.put(x - 1, 24, 'l')
    g.hline(7, 27, 20, '.')                                  # the pens' corridor
    g.put(17, 19, '='); g.put(18, 19, '=')                  # Skarn's gate
    g.vline(17, 3, 18, '.'); g.vline(18, 3, 18, '|')        # the main drift with a sledge-run
    g.hline(5, 30, 15, '.'); g.hline(3, 5, 16, '.')         # lower gallery; west stub
    g.hline(2, 33, 10, '.'); g.hline(1, 2, 9, '.')          # middle gallery
    g.hline(18, 32, 5, '.')                                  # upper gallery (east only)
    for (x, y) in [(29, 14), (33, 9), (32, 4)]:
        g.put(x, y, 'l')
    for (x, y) in [(30, 15), (33, 10), (32, 5)]:
        g.put(x + 1 if g.get(x + 1, y) == '#' else x, y, ':')
    g.hline(12, 17, 3, '.'); g.put(12, 2, '.'); g.put(12, 1, 'd')   # the daytime way down (NW)
    for y in (8, 12, 16):
        g.put(16, y, 'l')
    g.put(1, 8, 'b'); g.put(4, 17, 'b')
    g.warp(13, 27, 'warrens_a', 15, 5, 'down')
    for x in (7, 21, 27):
        g.put(x, 27, '#')
    g.trig('skarngate', 17, 19, 'skarnGate', on='use', w=2, h=1, cond='!flag:skarnGateOpen')
    g.flagtile(17, 19, 'gateOpen', 'flag:skarnGateOpen'); g.flagtile(18, 19, 'gateOpen', 'flag:skarnGateOpen')
    g.put(17, 27, '#')
    g.warp(12, 1, 'warrens_d', 2, 12, 'right')
    g.npc('jorypens', 10, 20, 'worker', dir='down')
    g.npc('crew1', 30, 15, 'worker2', dir='right')
    g.npc('crew2', 33, 11, 'worker', dir='up')
    g.npc('hobB', 3, 16, 'oldhand', dir='right', cond='flag:hobMet & !flag:fiveDone')
    g.chest(1, 9, 'simples', 2)
    save('warrens_b', g, 'cave', 'The Warrens — the stalls and the lit galleries', music='dungeon', bg='cave', save=False, dark=False)

    # ---- Sheet C: the abandoned workings. One long unlit lateral from mouth 1 (west) to mouth 6 (east)
    W, H = 48, 19
    g = Grid(W, H, '#')
    lat = [(2, 17), (2, 12), (5, 10), (12, 9), (23, 10), (24, 11), (25, 10), (36, 9), (43, 10), (45, 12), (45, 17)]
    g.path(lat, '.', width=2)
    for (x, y) in [(8, 9), (16, 9), (30, 9), (40, 9)]:
        g.put(x, y - 1, '+'); g.put(x + 1, y - 1, '+')
    # six dead-end stubs: doss, cache, robbed, cache, doss, cache
    stubs = [(8, 9, 0, -1, 5, 'doss'), (13, 10, 0, 1, 5, 'cache'), (18, 9, 0, -1, 6, 'robbed'), (30, 9, 0, -1, 5, 'cache'), (35, 10, 0, 1, 5, 'doss'), (41, 9, 0, -1, 5, 'cache')]
    for (x, y, dx, dy, n, kind) in stubs:
        for k in range(n):
            g.put(x + dx * k, y + dy * k, '.')
        ex, ey = x + dx * (n - 1), y + dy * (n - 1)
        if kind == 'doss': g.put(ex, ey, 'b')
        if kind == 'robbed': g.put(ex, ey, ':')
    g.chest(13, 14, 'rope', 1); g.chest(30, 5, 'potion', 1); g.chest(41, 5, 'oil', 3)
    g.put(22, 8, 'k'); g.put(27, 12, 'k')                   # two boarded winzes
    g.path([(24, 11), (24, 3), (24, 1)], '.', width=1)       # the drop north to the pools
    g.put(24, 1, 'd')
    for x in (2, 3, 45, 46):                                  # the way up to the mouths: stairs, and no false edge below them
        g.put(x, 17, 'u'); g.put(x, 18, '#')
    g.warp(2, 17, 'warrens_a', 3, 5, 'down'); g.warp(3, 17, 'warrens_a', 3, 5, 'down')
    g.warp(45, 17, 'warrens_a', 33, 5, 'down'); g.warp(46, 17, 'warrens_a', 33, 5, 'down')
    g.warp(24, 1, 'warrens_d', 41, 26, 'up')
    g.npc('hobC', 17, 10, 'oldhand', dir='down', cond='flag:hobMet & !flag:fiveDone & flag:skarnOk')
    g.zone('warrens_c', 0, 0, W, H)
    save('warrens_c', g, 'cave', 'The Warrens — the abandoned workings', music='dungeon', bg='cave', save=False, dark=True)

    # ---- Sheet D: the wet. The stream falls into the deepest pool (NW); four settling pools run ESE.
    W, H = 44, 30
    rng = random.Random(1917)
    g = Grid(W, H, '#')
    g.blob(20, 11, 19, 9, '.', rng, .25)
    g.blob(8, 13, 7, 5, '.', rng, .2)
    g.path([(1, 12), (6, 12)], '.', width=2)                 # the daytime way in from the west
    g.path([(41, 27), (41, 22), (36, 17), (33, 15)], '.', width=2)   # the night crews' lateral in from the SE
    g.vline(8, 0, 3, '~')                                      # the stream from the crook
    g.blob(8, 5.5, 4, 2.6, 'w', rng, .1)                      # THE DEEPEST POOL (the landlord's)
    for (cx, cy, rx, ry) in [(15, 9, 2.6, 1.7), (22, 12, 3.6, 2.4), (29, 11, 2.6, 1.8), (35, 9, 2.4, 1.7)]:
        g.blob(cx, cy, rx, ry, '~', rng, .1)
    # the channels between the pools, planked over by the deep-rate crews
    g.path([(10, 7), (13, 8)], 'B'); g.path([(18, 10), (19, 11)], 'B'); g.path([(26, 12), (27, 11)], 'B'); g.path([(32, 10), (33, 9)], 'B')
    g.path([(37, 9), (43, 8)], '~')                           # the seep, out the east edge
    g.put(13, 5, 'k')                                         # the bucket station
    for (x, y) in [(15, 6), (24, 16), (35, 6)]:
        g.put(x, y, 'y')                                       # deep-rate stations
    for (x, y) in [(12, 16), (19, 17), (27, 7), (31, 15)]:
        g.put(x, y, 'o')
    # the shaft south off the night way, west into dressed stone: W4, the landing, the mark, the stair
    g.path([(34, 16), (34, 22)], '.', width=1)
    g.path([(34, 22), (24, 22)], '_', width=1)
    g.rect(20, 20, 4, 4, '_')
    g.hline(19, 25, 19, 'h'); g.vline(24, 19, 21, 'h'); g.hline(24, 33, 21, 'h'); g.hline(24, 33, 23, 'h')
    g.put(22, 19, 'r')                                        # THE MARK on the landing wall
    g.rect(12, 20, 8, 4, 'n')                                 # the flooded stair and chamber
    g.hline(11, 20, 24, 'h'); g.hline(11, 20, 19, 'h'); g.vline(11, 19, 24, 'h'); g.hline(19, 24, 24, 'h')
    g.put(8, 21, 's'); g.vline(9, 20, 23, 'h'); g.put(10, 21, 'n'); g.put(10, 22, 'n')
    # a second shaft, just started, with a cache of tools
    g.path([(36, 17), (38, 21)], '.'); g.chest(38, 21, 'greaterpotion', 1)
    # both ways out are stairs up (playtest 09-24: the west way out was bare floor, and a false edge sat beside it)
    g.put(0, 10, '#')
    for (x, y) in [(1, 12), (1, 13), (41, 27), (42, 27)]:
        g.put(x, y, 'u')
    g.warp(1, 12, 'warrens_b', 12, 2, 'down'); g.warp(1, 13, 'warrens_b', 12, 2, 'down')
    g.warp(41, 27, 'warrens_c', 24, 2, 'down'); g.warp(42, 27, 'warrens_c', 24, 2, 'down')
    g.trig('bucket', 13, 5, 'bucket', on='use')
    g.trig('landlord', 4, 2, 'landlord', on='use', w=9, h=7)
    g.trig('landlordStep', 7, 8, 'landlordNear', on='step', w=4, h=1, cond='!flag:otyughDead & !flag:otyughFed')  # (09-30g: onto the grid; fed or dead, only stone)
    for n, (x, y) in enumerate([(15, 6), (35, 6), (24, 16)]):
        g.trig('deepCradle%d' % n, x, y, 'deepCradle', n, on='use')  # (09-30g: the deep rate, js/events.js S.deepCradle -- this order is DEEP_CRADLES')
    # the Settling (RULED 09-30, Griz: "reset the trigger tiles for the oozes if they haven't been killed"; 09-30c: "where lymen and barley
    # are (north and south shores of jelly pool) should be jelly trigger spots, both go dead when jelly dies ... Where Aurdin is grey ooze
    # pool trigger spot ... and dies when the ooze does. Anything exit row and south stays 8bit"): the jelly's on both shores of its pool
    # and the pool ooze's at its puddle take the party onto the wet's grid (deep16/js/wet.js writes their flags); the southern ooze is the
    # 8-bit's own fight, a second ooze. Each comes back till its creature is dead
    g.trig('jelly', 21, 14, 'jelly', on='step', w=4, h=1, cond='!flag:jellyDead')
    g.trig('jellyNorth', 22, 9, 'jelly', on='step', cond='!flag:jellyDead')
    g.put(29, 13, 'o')                                        # the pool ooze's puddle, on the east arm's south shore
    g.trig('poolOoze', 29, 13, 'poolOoze', on='step', cond='!flag:poolOozeDead')
    g.trig('ooze', 12, 16, 'oozeFight', on='step', cond='!flag:oozeDead')
    g.trig('mark', 22, 19, 'mark', on='use')
    g.trig('stair', 19, 20, 'stair', on='use', w=1, h=4, cond='!flag:stairHook | flag:keeperWater')
    g.put(19, 20, 'n'); g.put(19, 21, 'n'); g.put(19, 22, 'n'); g.put(19, 23, 'n')
    # the dwarven expansion (spec §5.3): the night crews pumped the stair dry and cut the warranted door at its foot
    dry = 'flag:stairHook & !flag:keeperWater'
    for y in range(20, 24):
        for x in range(12, 20):
            g.flagtile(x, y, 'puddle' if (x, y) == (12, 23) else 'dryStair', dry)
    for (x, y) in [(11, 21), (11, 22), (10, 21), (10, 22), (9, 21)]:
        g.flagtile(x, y, 'dryStair', dry)
    g.flagtile(12, 23, 'stain', dry + ' & flag:keeperDone')   # re-cut F2: a keeper beaten in the base game left no puddle, only a stain
    g.flagtile(8, 21, 'sealCut', dry)
    g.flagtile(8, 21, 'ironBars', 'flag:frontDoor & !flag:keeperWater')   # the garrison's iron: a lock instead of a promise
    g.warp(8, 21, 'burial', 2, 5, 'right', cond='flag:stairHook & !flag:frontDoor & !flag:keeperWater', sfx='stairs')
    g.trig('dryStair', 19, 20, 'dryStair', on='step', w=1, h=4, cond='flag:stairHook & !flag:drySeen')
    g.trig('holdStair', 19, 20, 'holdStair', on='step', w=1, h=4, cond='flag:waterAsked & !flag:keeperWater & flag:drySeen')
    g.zone('warrens_d', 0, 0, W, 19)
    save('warrens_d', g, 'cave', 'The Warrens — the wet', music='dungeon', bg='wet', save=False, dark=True,
         legend={'n': 'drownStair'})


# ============================================================ THE GUANO GALLERIES
def build_galleries():
    # ---- G1: the mouth and the weigh-shed (outdoors)
    W, H = 36, 24
    g = Grid(W, H, '"')
    g.rect(0, 0, W, 5, 'V'); g.rect(0, 5, W, 1, 'M')
    g.rect(15, 4, 5, 2, '.'); g.put(17, 3, 'd')             # the mouth
    for x in range(13, 23):
        if g.get(x, 6) == '"': g.put(x, 6, 'g')
    g.rect(1, 7, 5, 1, 'R'); g.hline(1, 5, 8, 'O'); g.put(3, 8, 'D')          # the house
    g.rect(8, 7, 4, 1, 'S'); g.hline(8, 11, 8, 'W'); g.put(10, 8, 'D')        # the weigh-shed
    g.put(13, 8, 'H')                                                        # the beam
    g.rect(22, 7, 6, 1, 'S'); g.hline(22, 27, 8, 'W')                         # the sack-store
    g.rect(1, 11, 5, 1, 'R'); g.hline(1, 5, 12, 'W')                          # the bunkhouse
    g.rect(24, 11, 6, 2, ':')                                                # the sieving floor
    g.rect(31, 7, 4, 1, 'R'); g.hline(31, 34, 8, 'W')                         # rendering shed
    for y in (11, 13, 15):
        g.hline(31, 34, y, 'F')                                               # smoke-racks
    for (x, y) in [(8, 12), (10, 13), (12, 12)]:
        g.put(x, y, 'c')                                                      # sledges
    g.path([(17, 6), (17, 23)], ',')
    for y in range(8, 22, 3):
        g.put(16, y, 'I')
    g.rect(0, 20, W, 4, '"'); g.hline(0, W - 1, 21, 'P'); g.path([(17, 6), (17, 21)], ',')
    # the mouth takes nobody carrying an always-lit thing: Ottilie stops them on it (events.js S.roostDoor; RULED 09-28)
    g.warp(17, 3, 'galleries_g2', 17, 26, 'up', cond='!lit:always')
    g.obj['triggers'].append({'id': 'roostDoor', 'x': 17, 'y': 3, 'on': 'step', 'script': 'roostDoor', 'cond': 'lit:always', 'back': 'down'})
    g.npc('sabeth', 13, 9, 'innlady', dir='down')
    g.npc('ottilie', 15, 5, 'oldhand', dir='down')
    g.npc('wynn', 4, 9, 'oldhand', dir='down')
    g.npc('dace', 25, 10, 'clerk', wander=1)
    g.door(3, 8, 'keeper', 'pollardhouse', back='down'); g.door(10, 8, 'keeper', 'weighshed', back='down')
    save('galleries_g1', g, 'cave', 'The guano mine — the mouth', music='field', bg='plains', outside=True,
         exits={'south': {'to': 'world', 'tx': 23, 'ty': 11, 'dir': 'down'}, 'west': {'to': 'world', 'tx': 23, 'ty': 11, 'dir': 'down'},
                'east': {'to': 'world', 'tx': 23, 'ty': 11, 'dir': 'down'}})

    # ---- G2: the working gallery: one huge oval cavern under the roost
    W, H = 36, 28
    rng = random.Random(202)
    g = Grid(W, H, '#')
    g.blob(18, 13, 15.5, 10, 'g', rng, .2)
    g.rect(16, 22, 3, 6, '.')
    for (x0, x1, y) in [(5, 11, 4), (13, 22, 3), (28, 30, 8), (4, 5, 9)]:
        g.hline(x0, x1, y, 'G')
    for (x, y) in [(8, 5), (10, 5), (15, 4), (20, 4), (29, 9), (29, 12), (5, 10)]:
        g.put(x, y, 'L')
    g.rect(12, 7, 7, 2, ':')                                   # the rope-war ground
    g.path([(24, 7), (26, 7), (26, 5), (28, 5), (28, 3)], 'G'); g.put(28, 3, '>')   # the guano-slide head
    g.path([(31, 16), (35, 17)], '.', width=2)                # the way down to the dens
    for (x, y) in [(14, 20), (21, 20), (31, 15)]:
        g.put(x, y, 'l')
    g.warp(17, 27, 'galleries_g1', 17, 4, 'down'); g.warp(16, 27, 'galleries_g1', 17, 4, 'down'); g.warp(18, 27, 'galleries_g1', 17, 4, 'down')
    for y in (16, 17, 18):
        if g.get(35, y) == '.': g.warp(35, y, 'galleries_g3', 1, 9, 'right')
    g.warp(28, 3, 'galleries_g4', 3, 3, 'down', sfx='stairs', slide=True)
    g.npc('scrapeboss', 9, 7, 'worker', dir='down')
    g.npc('scraper1', 18, 5, 'worker2', wander=1)
    g.npc('scraper2', 27, 10, 'worker', wander=1)
    g.npc('ropewar', 15, 9, 'worker2', dir='up')
    save('galleries_g2', g, 'cave', 'The guano mine — the working gallery', music='dungeon', bg='guano', save=False, roost=True)

    # ---- G3: the dens: one long way running west to east and DOWN, five dens, the drive ground, the mark
    W, H = 54, 20
    rng = random.Random(303)
    g = Grid(W, H, '#')
    g.path([(0, 9), (20, 10), (27, 11), (34, 11), (44, 10), (50, 9)], '.', width=2)
    g.rect(26, 9, 12, 5, '.')                                  # the drive ground
    g.blob(40, 11, 3, 2.5, '.', rng, .2)                       # the killing ground
    dens = [(6, 4, 'n'), (12, 15, 's'), (16, 3, 'n'), (28, 16, 's'), (33, 4, 'n')]
    for (x, y, side) in dens:
        g.path([(x, 9 if side == 'n' else 11), (x, y)], '.')
        g.blob(x, y, 2.6, 1.8, 'g', rng, .15)
    g.path([(24, 10), (25, 6), (26, 3)], '.')                  # the dead-end side gallery (set-piece row 1)
    g.blob(26, 3, 2, 1.4, 'g', rng, .1)
    g.path([(38, 13), (44, 16), (50, 17)], ':')                # the low gallery (bad air)
    for (x, y) in [(10, 8), (22, 12), (36, 8)]:
        g.put(x, y, '0')                                       # chimneys
    for (x, y) in [(30, 13), (19, 11)]:
        g.put(x, y, '>')                                       # pits (drop you back to G2's slide foot? no: blocked)
    for x in range(2, 40, 7):
        if g.get(x, 8) == '#': g.put(x, 8, 'l')
    g.put(48, 8, 'r')                                          # the mark on the wall, the last lamp
    g.put(47, 8, 'l')
    g.put(51, 9, 'L')                                          # the shaft head: the ladder's last pitch
    g.warp(0, 9, 'galleries_g2', 34, 17, 'left'); g.warp(0, 10, 'galleries_g2', 34, 17, 'left')
    g.warp(51, 9, 'galleries_g4', 9, 2, 'down', sfx='stairs')
    for (x, y) in [(30, 13), (19, 11)]:
        g.trig('pit%d' % x, x, y, 'pit', on='step')
    g.trig('rescue', 25, 5, 'rescue', on='step', once=True, cond='flag:cullHired')
    g.trig('badair', 44, 15, 'badAir', on='step', w=7, h=3)
    g.chest(50, 17, 'ringofprotection', 1)
    g.npc('dacedown', 46, 10, 'clerk', dir='left', cond='flag:cullHired & !flag:cloakerDone')
    g.npc('drivecrew', 30, 10, 'worker2', dir='down', cond='flag:cullHired')
    g.zone('g3', 0, 0, 44, H)
    save('galleries_g3', g, 'cave', 'The guano mine — the dens', music='dungeon', bg='guano', save=False, roost=True, dark=True)

    # ---- G4: the deep gallery: bare rock, no roost; the cloaker hangs on the last pitch
    W, H = 36, 26
    rng = random.Random(404)
    g = Grid(W, H, '#')
    g.blob(18, 14, 15, 9.5, '.', rng, .25)
    g.path([(9, 1), (9, 5)], '.')
    g.put(9, 1, 'L')
    g.blob(5, 5, 3, 2.4, 'G', rng, .2); g.path([(3, 2), (4, 4)], 'G'); g.put(3, 2, 'L')
    g.put(7, 6, 'G'); g.put(7, 5, 'G')                          # the slide's spill opens into the big room
    for (x, y) in [(13, 8), (20, 11), (11, 16), (25, 17), (17, 20)]:
        g.put(x, y, 'b')
    g.path([(32, 17), (35, 20)], '.'); g.path([(12, 23), (11, 25)], '.')
    g.put(35, 20, '#'); g.put(35, 19, '#'); g.put(11, 25, '#')   # passages off, not this adventure: signed dead ends, no open edge
    g.warp(9, 1, 'galleries_g3', 50, 9, 'left', sfx='stairs')
    g.warp(3, 2, 'galleries_g2', 27, 5, 'down', sfx='stairs')
    # it drops on you once you're out in the big room, whichever way you came down (ladder or slide)
    g.trig('cloaker', 5, 8, 'cloaker', on='step', w=28, h=16, cond='!flag:cloakerDone')
    g.sign(35, 19, 'A passage runs off into the dark, east. Not this adventure.', 'GalleriesModule/guano-galleries-DM.md §2 G4 (beyond: not mapped)')
    g.sign(11, 25, 'A passage runs off south. Not this adventure.', 'GalleriesModule/guano-galleries-DM.md §2 G4 (beyond: not mapped)')
    g.chest(25, 17, 'maul1', 1)
    save('galleries_g4', g, 'cave', 'The guano mine — the deep gallery', music='dungeon', bg='deep', save=False, dark=True)


# ============================================================ WEB GULCH (the ravine proper)
def build_gulch():
    W, H = 40, 30
    rng = random.Random(5050)
    g = Grid(W, H, 'C')
    g.blob(20, 15, 17, 12, 'U', rng, .3)
    g.path([(2, 5), (8, 7), (14, 10), (20, 14), (24, 19), (30, 23), (37, 25)], 'U', width=2)
    for _ in range(40):
        x, y = rng.randint(4, 36), rng.randint(4, 26)
        if g.get(x, y) == 'U': g.put(x, y, 'X' if rng.random() < .7 else 'e')
    g.path([(2, 5), (8, 7), (14, 10), (20, 14), (24, 19), (30, 23), (37, 25)], 'U', width=1)
    # the silk-cutters' camp (noon work) and the drummer boy
    g.rect(6, 8, 4, 2, ','); g.put(6, 8, 'T'); g.put(9, 9, 'c')
    # the ettercap's end of the gulch, strung rim to rim
    g.blob(30, 9, 5, 3.5, 'X', rng, .3)
    g.blob(30, 9, 2.5, 1.6, 'U', rng, .1)
    g.path([(24, 12), (28, 10)], 'U')
    g.put(3, 5, 'U'); g.put(2, 5, 'U')
    # both ends open onto the world: walk off the west end (up the descent) or the east end (out onto the road south)
    for (x, y) in [(0, 5), (0, 6), (1, 5), (1, 6), (38, 25), (38, 26), (39, 25), (39, 26)]:
        g.put(x, y, 'U')
    g.npc('silkcutter', 8, 9, 'worker', dir='right')
    g.npc('drummer', 7, 10, 'boy', dir='up', idle=True)
    # the snared traveler: a silk-wrapped shape strung between two stunted trees, just off the way down
    g.put(17, 17, 'e'); g.put(19, 17, 'e'); g.put(18, 17, 'Q')
    g.trig('snared', 18, 17, 'snared', on='use', once=True)
    g.flagtile(18, 17, 'gulch', 'flag:trig:snared')   # was 'trig:snared', which DS.cond read as a number: the cut cocoon grew back
    # it sits braiding at the back of the clearing, facing the way in, till the fangs are taken (js/world.js PROPS.ettercap; Griz's
    # idle sheet, 09-30: "please add an 8-bit version in the pre-encounter map"); the trigger rings it, and E on it starts it too
    g.npc('ettercap8', 30, 7, prop='ettercap', dir='left', idle=True, anchor='center', cond='!flag:ettercapDone & !has:ettercapfangs')
    g.trig('ettercap', 29, 8, 'ettercap', on='step', w=3, h=3, cond='!flag:ettercapDone')
    g.chest(33, 8, 'potion', 1); g.chest(19, 24, 'kit', 2)
    g.zone('gulch', 0, 0, W, H)
    save('gulch', g, 'cave', 'Web Gulch', music='dungeon', bg='gulch', save=False, outside=True,
         exits={'west': {'to': 'world', 'tx': 30, 'ty': 26, 'dir': 'left'}, 'east': {'to': 'world', 'tx': 32, 'ty': 31, 'dir': 'down'}})


# ============================================================ THE HALFWAY INN and HALFWAY LAKE
def build_halfway():
    # Drawn compass-true: the road on the west (left), the lake to the east; the path runs to the point.
    W, H = 38, 26
    rng = random.Random(8270)
    g = Grid(W, H, '"')
    g.vline(0, 0, H - 1, '='); g.vline(1, 0, H - 1, '=')
    for y in range(H):
        if rng.random() < .5 and not 7 <= y <= 13: g.put(2, y, 't')
    # the yard: well, hitching rail, stable/cart-shed by the road
    g.rect(3, 3, 11, 20, ',')
    g.put(5, 5, 'q'); g.hline(8, 10, 5, '|')
    g.building(4, 16, 5, 3, 's', 2)                            # stable & cart-shed (slate)
    g.put(9, 18, 'c')
    # the inn: a long low stone house between the road and the water; road door west end, lake door east end
    inn_doors = g.building(12, 8, 10, 4, 'b', [1, 8])
    g.put(11, 10, 'c'); g.put(11, 11, 'c')                     # the woodpile at the west end
    # grass slope, the footpath to the point, the lake with reeds, the deep off the point
    g.rect(23, 0, 15, H, '"')
    g.blob(33, 13, 7, 11, 'W', rng, .25)
    g.rect(35, 0, 3, H, 'W')
    for (x, y) in [(26, 3), (27, 22), (25, 6), (26, 20)]:
        g.put(x, y, 'u')
    g.path([(20, 12), (20, 14), (25, 14), (26, 13)], ',')
    g.rect(26, 12, 2, 3, 'S'); g.put(27, 13, 'i')             # the point, the flat stone
    g.put(26, 11, 'l')                                         # the lantern post
    g.put(27, 15, 'K')                                         # the rowboat's place
    g.blob(31, 13, 2.6, 2.4, 'Y', rng, 0)                      # the deep: it goes, forty paces out
    g.warp(inn_doors[0][0], inn_doors[0][1], 'halfway_in', 1, 5, 'right')
    g.warp(inn_doors[1][0], inn_doors[1][1], 'halfway_in', 16, 5, 'left')
    g.npc('doranYard', 9, 11, 'worker', dir='down', cond='!flag:doranAway')
    g.npc('orrin', 25, 13, 'kid', dir='right', cond='!flag:dueSeen')
    g.npc('pell', 22, 16, 'kid', wander=1, cond='!flag:dueSeen')
    g.npc('adoptedKid', 24, 18, 'girl', wander=1, cond='flag:kidAtInn & !flag:dueSeen')   # the one she kept, out back by the water
    g.trig('point', 28, 11, 'point', on='use', w=3, h=5)
    g.trig('pointStep', 27, 13, 'pointStep', on='step')
    g.trig('rowboat', 27, 15, 'rowboat', on='step')
    g.sign(26, 11, 'A lantern post by the flat stone. Nobody swims here. Nobody draws from the lake. The well is for that.', 'wiki/halfway-inn-and-lake.md; module-halfway-inn.md §2 (the point)')
    save('halfway', g, 'town', 'The Halfway Inn', music='lake', bg='lake', outside=True,
         exits={'west': {'to': 'world', 'tx': 33, 'ty': 37, 'dir': 'left'}, 'north': {'to': 'world', 'tx': 33, 'ty': 36, 'dir': 'up'},
                'south': {'to': 'world', 'tx': 33, 'ty': 38, 'dir': 'down'}})

    # the inn inside: common room (west), stair hall, pantry/family room, kitchen (east) with the lake door
    W, H = 18, 10
    g = Grid(W, H, 'w')
    g.rect(1, 1, 16, 8, ':')
    g.put(0, 5, 'D'); g.put(17, 5, 'D')
    g.put(3, 1, 'h'); g.hline(2, 5, 4, 't'); g.put(2, 7, 't'); g.put(1, 8, 'k'); g.put(6, 8, 'k')
    g.vline(7, 1, 8, 'c'); g.put(7, 6, ':'); g.put(7, 5, ':')
    g.put(9, 1, 'u')
    g.vline(10, 1, 8, 'w'); g.put(10, 3, ':'); g.put(10, 6, ':')
    g.put(11, 1, 'q'); g.put(12, 1, 'q'); g.put(11, 7, 'z'); g.put(12, 8, 'z')
    g.vline(13, 1, 8, 'w'); g.put(13, 4, ':'); g.put(13, 7, ':')
    g.put(16, 1, 'h'); g.hline(14, 15, 3, 't'); g.put(16, 8, 'k')
    g.warp(0, 5, 'halfway', 13, 12, 'down'); g.warp(17, 5, 'halfway', 20, 12, 'down')
    g.npc('gennet', 5, 6, 'innlady', dir='down', cond='!flag:lakeDone')
    g.npc('gennetGrief', 3, 5, 'innlady', dir='down', cond='flag:lakeDone')
    g.npc('doranIn', 8, 3, 'worker', dir='left', cond='!flag:doranAway')
    g.npc('elsbeth', 15, 5, 'elsbeth', dir='up', cond='!flag:postgame')
    g.npc('katarina', 2, 6, 'kat', dir='right', cond='!flag:katGone')
    g.trig('drawer', 9, 1, 'drawer', on='step')   # the stairs tile is walkable, so a walk-into 'use' never fired (playtest 09-25)
    save('halfway_in', g, 'inside', 'The Halfway Inn — inside', music='inn', bg='town', legend={'.': 'floorWood'})


# ============================================================ THE DWARVEN EXPANSION (handoff-2026-09-26 spec)
SPEC_REF = 'handoff-2026-09-26-dragonsleep-dwarven-expansion-spec.md'
# Behind the fountains: the Burial the drained stair leads to, SOLSKAFT (the Silvered Sunshaft) and its works.
DEEP = {
    'N': 'niche', 'J': 'nicheGear', '!': 'nicheOpen', 'K': 'nicheStone', '$': 'nicheGearStone', 'Z': 'bier', 'Y': 'tombLamp',
    'z': 'dryStair', 'j': 'sealCut', 'i': 'ironBars', 'p': 'puddle', 'v': 'steps', '1': 'sunshaft', '2': 'race', '3': 'wheel',
    '4': 'vaultIn', '5': 'throne', '6': 'oathStone', '7': 'nameWall', '8': 'anvil', '9': 'forge', 'a': 'furnace', 'E': 'cupel',
    '%': 'scales', '&': 'lockCase', '/': 'rack', '(': 'vat', ')': 'smokeRack', '[': 'boarded', ']': 'ledgerDesk', '{': 'tariff',
    '}': 'shaftTop', ';': 'cot', '<': 'brick', '@': 'dcounter', '?': 'dtable', "'": 'portcullisUp', '`': 'footbridge', 'J2': 'nicheGear',
    'Q': 'emptyCut',
}
DEEP.pop('J2')

# the Burial's families: seven wedges fanning out from the empty centre; each reaches up the tiers as far as its dead go.
# tiers: 0 = the top (the newest dead, the children's rows) ... 3 = the base ring (the patrons). (reach = lowest tier index it has)
WEDGES = [
    {'reach': 0, 'ended': True, 'fam': 'geirmund'},   # the night crew's sack came off these bones (T1, pried)
    {'reach': 2, 'ended': True, 'fam': 'audun', 'gear': 3},   # the door-warden's line, ended at the Third Lamp: the Door-Shield
    {'reach': 0, 'fam': 'orri'},
    {'reach': 0, 'fam': 'hallveig'},
    {'reach': 1, 'fam': 'kolbein'},
    {'reach': 1, 'ended': True, 'fam': 'asmund', 'gear': 3},  # the heir's wedge (sidequest 9): a family that isn't dead yet
    {'reach': 0, 'fam': 'brandr'},    # Brann's: the last niche two seasons old, and he is the living member
]


def build_deep():
    # ---------------------------------------------------------------- THE BURIAL (re-cut 09-27, handoff-2026-09-26-dragonsleep-spine-recut §5)
    # Both ways in land in a HALLWAY first (sealed doors off it, the Triad's chapel), and the hallway opens on the chamber.
    # Two staircases go straight down through the tiers, one on the Warrens side and one on the Solskaft side, to the
    # king's chamber at the bottom centre. The tiers are wide enough for two family wedges on each side of each stair:
    # eight wedge-places, seven families, one waiting (Griz 09-26d/e: "wide enough for two of those on each side").
    W, H = 44, 34
    g = Grid(W, H, 'h')
    g.rect(2, 5, 40, 2, '_')                                     # the hallway
    g.rect(18, 1, 8, 3, '_'); g.put(21, 4, '_'); g.put(22, 4, '_')   # the chapel, off the hallway's north side
    g.put(19, 1, '8'); g.put(21, 1, '6'); g.put(23, 1, 'Q')      # the Triad: the Forge-Father's anvil, Rekknar's ledger-stone, the Dormant's empty cut
    g.put(25, 1, 'Y'); g.put(21, 2, 'x')                         # a lamp, and the kneeling-stone
    for x in (6, 10, 32, 37):
        g.put(x, 4, 's')                                         # sealed rooms, warranted; nothing behind them this round
    STAIRS = (12, 31)
    TIERS = [8, 12, 16, 20]                                      # the niche row of each tier; the walk is the two rows under it
    niches = {}
    for ti, ny in enumerate(TIERS):
        g.rect(2, ny + 1, 40, 2, '_')
    # the wedges: (x0, x1, family index into WEDGES); family 7 is the place that waits
    WEDGE_AT = [(2, 5, 0), (7, 10, 1), (14, 16, 2), (18, 20, 3), (23, 25, 4), (27, 29, 5), (33, 36, 6), (38, 41, 7)]
    for (x0, x1, wi) in WEDGE_AT:
        if wi >= len(WEDGES):
            continue
        wd = WEDGES[wi]
        for ti, ny in enumerate(TIERS):
            if ti < wd['reach']:
                continue                                          # the family's rows stop below this tier: blank stone
            for x in range(x0, x1 + 1):
                ch = 'K' if ti == 3 else 'N'
                if wd.get('gear') == ti and not any(v[0] == wi and v[2] == 'gear' for v in niches.values()):
                    ch, kind = '$', 'gear'
                elif wd['fam'] == 'geirmund' and ti == 0:
                    ch, kind = '!', 'pried'
                else:
                    kind = 'patron' if ti == 3 else 'row'
                g.put(x, ny, ch)
                niches['%d,%d' % (x, ny)] = [wi, ti, kind]
    for ti, ny in enumerate(TIERS):
        g.trig('niches%d' % ti, 2, ny, 'niche', on='use', w=40)   # every niche is a container; the script reads which
    # the two staircases, straight down from the hallway to the bottom landing
    for sx in STAIRS:
        for y in range(7, 24):
            g.put(sx, y, 'v')
            niches.pop('%d,%d' % (sx, y), None)
    g.rect(12, 24, 20, 2, '_')                                   # the landing at the stairs' feet
    # the king's chamber: doorless, one lamp, nobody on the bier
    g.rect(16, 26, 12, 6, '_')
    g.put(21, 29, 'Z'); g.put(22, 29, 'Z'); g.put(25, 27, 'Y')
    # the drained stair's cut door (the hallway's Warrens end) and the dwarves' own stair (its Solskaft end)
    g.put(1, 5, 'z')
    g.put(42, 5, 'r')
    g.warp(1, 5, 'warrens_d', 9, 21, 'right', cond='!flag:frontDoor')
    g.flagtile(1, 5, 'ironBars', 'flag:frontDoor')
    g.warp(42, 5, 'solskaft', 25, 3, 'right', cond='flag:frontDoor')
    g.flagtile(42, 5, 'stairsUp', 'flag:frontDoor')
    g.trig('dwarfStair', 42, 5, 'dwarfStair', on='use', cond='!flag:frontDoor')
    # the night crew at the Geirmund wedge (the Warrens-side outer wedge, top tier); the catch is the scene's start:
    # it springs in the hallway at the head of the Warrens stair, so nobody walks past it
    crew = '!flag:crewDealt & !flag:crewCut | flag:crewBack & !flag:crewDealt'
    g.npc('hask', 4, 9, 'hask', dir='up', cond=crew, face=False)
    g.npc('wheelwright', 2, 10, 'wheelwright', dir='up', cond=crew, face=False)
    g.npc('crewA', 3, 10, 'crewman', dir='up', cond=crew, face=False)
    g.npc('crewB', 5, 10, 'crewman', dir='left', cond=crew, face=False)
    g.trig('crew', 10, 5, 'crew', on='step', w=2, h=2, cond=crew)
    g.trig('bier', 21, 29, 'bier', on='use', w=2)
    g.sign(25, 27, 'One lamp, kept. Somebody fills it.', 'handoff-2026-09-26 §5.2 (lit by one lamp that the garrison keeps)')
    g.sign(21, 2, 'A kneeling-stone, two hollows worn in it. Nobody comes down here to pray who has not come to bury.', 'handoff-2026-09-26-dragonsleep-spine-recut.md §5 (the Burial\'s chapel: an altar, a lamp, a kneeling-stone; Griz 09-26d: to all three of the Triad)')
    g.sign(19, 1, 'The Forge-Father\'s niche. The anvil here is small, a grave-anvil; nothing was ever struck on it.', 'wiki/pantheon.md (the Dwarven Triad); spine-recut §5 (the chapel to all three)')
    g.sign(21, 1, 'Rekknar\'s ledger-stone. The last line on it is a name, and the line under it is ruled and empty.', 'wiki/pantheon.md (Rekknar the Reckoner); spine-recut §5')
    g.sign(23, 1, 'A plain cut in the rock with nothing in it. The Dormant\'s. Down here it looks like an open niche.', 'wiki/pantheon.md (Dvalgarda, the vigil); spine-recut §5 (the sect is never named here)')
    for x in (6, 10, 32, 37):
        g.sign(x, 4, 'A sealed door, warranted. The runes are whole. The ledger knows what is behind it; you do not.', 'spine-recut §5 (the hallway: sealed doors off it; nothing behind them this round)')
    for x in range(38, 42):
        for ny in TIERS:
            g.sign(x, ny, 'A wedge cut and dressed, and nobody in it. The eighth place. It waits.', 'spine-recut §5 (eight wedge-places, seven families, one waiting: CANON 09-26e)')
    save('burial', g, 'cave', 'The Burial', music='burial', bg='dwarf', save=False, dark=True, legend=dict(DEEP, x='kneelStone'), niches=niches,
         lights=[{'x': 25, 'y': 27, 'r': 60}, {'x': 25, 'y': 1, 'r': 44}])   # one lamp, kept; the chapel's

    # ---------------------------------------------------------------- SOLSKAFT: the front, the yard, the Sunshaft, its galleries (re-cut 09-27)
    # Widened ten columns west for the closed street and the clan hall's court, and six east for the grow.
    W, H = 50, 48
    g = Grid(W, H, 'h')
    # the vault hall, Pyro's post: two portcullises raised into the old ore-chute
    g.rect(21, 40, 14, 7, '_')
    g.put(27, 47, '4'); g.put(28, 47, '4')
    g.hline(22, 33, 42, "'"); g.hline(22, 33, 45, "'")
    g.warp(27, 47, 'silverton', 29, 6, 'down'); g.warp(28, 47, 'silverton', 30, 6, 'down')
    # the tollhouse (west): the trade-counter, the scales under a cloth, the tariff board, the ledger-room
    g.rect(11, 38, 9, 9, '_'); g.put(20, 44, '_')
    g.hline(12, 18, 43, '@'); g.put(14, 43, '%')
    g.put(17, 37, '{'); g.put(13, 40, ']')
    # the falls-works (east): the race comes down off the Sunshaft and turns the old stamp-mill wheel
    g.rect(36, 38, 9, 9, '_'); g.put(35, 44, '_')
    g.vline(33, 2, 28, '2')
    g.hline(33, 40, 29, '~'); g.vline(40, 29, 37, '~')
    g.put(40, 38, '3')
    g.blob(40.5, 41.5, 3.2, 1.6, '~')
    g.vline(40, 43, 47, '~')
    g.put(45, 42, '<')
    # the caravan yard, the muster yard now: the season drills here; the cots at its east end
    g.rect(20, 30, 16, 8, '_')
    for x in range(26, 30):
        g.put(x, 38, '_'); g.put(x, 39, '_')
    for (x, y) in [(34, 31), (35, 31), (34, 33), (35, 33)]:
        g.put(x, y, ';')
    # the Sunshaft: the old main shaft driven up to the mountain's face; noon comes down it
    g.rect(24, 2, 9, 27, '_')
    g.rect(26, 2, 5, 27, '1')
    for x in range(25, 31):
        g.put(x, 29, '_')
    g.hline(23, 32, 0, '}'); g.hline(23, 32, 1, '}')
    # ---- the west galleries
    # the noon court: the shaft's west bay, where the silvered walls throw the noon light north through the clan hall's doors
    g.rect(2, 27, 22, 2, '_')
    g.hline(11, 19, 29, '7')                                     # the hero-wall, on the court's south face
    # the clan hall of the Silversands, turned on its axis (Griz 09-26c: "The sunbeam would land on the swearing stone,
    # directly south of the throne dias and throne, straight through the doors"): the throne on its dais at the north end,
    # the oath-stone directly south of it, the doors south of that on the court
    g.rect(12, 18, 11, 8, '_')
    g.rect(15, 18, 5, 2, 'O')                                    # the dais
    g.put(17, 18, '5')                                           # the throne
    g.put(17, 22, '6')                                           # the oath-stone, in the beam's landing
    for x in (16, 17, 18):
        g.put(x, 26, '_')                                        # the doors, open on the court
    g.put(12, 19, 'I'); g.put(22, 19, 'I')                        # the hall's lamps
    # the shrine of the Triad, west of the clan hall, on the court
    g.rect(3, 19, 7, 7, '_'); g.put(5, 26, '_'); g.put(6, 26, '_')
    g.put(4, 18, '8'); g.put(6, 18, '6'); g.put(8, 18, 'Q')
    # THE RESIDENTIAL QUARTER, closed (CANON 09-26d/e: a west gallery off the Sunshaft above the clan hall): a street of family
    # houses shuttered since the clans went back deep, and one lit door, the Scalebeam house, where Asdis would not go down
    g.rect(2, 13, 22, 2, '_')
    FRONT_N = {4: 'L', 8: 'H', 12: 'H', 16: 'H', 20: 'H'}         # north side: Scalebeam (lit), Greyseam, Orri, Hallveig, Kolbein
    FRONT_S = {5: 'H', 9: 'H', 13: 'H', 17: 'H', 21: 'H'}         # south side: Copperbottom, Asmund, Brandr, Geirmund, Audun
    for x in range(2, 23):
        g.put(x, 12, FRONT_N.get(x, 'W' if x % 2 else 'h'))
        g.put(x, 15, FRONT_S.get(x, 'W' if x % 2 == 0 else 'h'))
    # the Scalebeam house: the room behind the one lit door
    g.rect(2, 8, 6, 4, ':')
    g.put(2, 8, 'A'); g.put(6, 8, 'c'); g.put(3, 11, ';')         # a hearth, a table, a cot
    g.put(4, 12, 'L')
    # the dark barracks (north-west) and the shroom farm through them, in the dark past the last bunk
    g.rect(12, 3, 11, 7, '_'); g.put(23, 6, '_')
    for (x, y) in [(13, 4), (15, 4), (17, 4), (19, 4), (13, 7), (15, 7), (17, 7), (19, 7), (21, 4)]:
        g.put(x, y, ';')
    g.rect(2, 2, 9, 5, ','); g.put(11, 5, ',')
    for (x, y) in [(3, 3), (5, 3), (7, 3), (9, 3), (3, 5), (5, 5), (7, 5), (9, 5)]:
        g.put(x, y, 'M')
    # ---- the east galleries, over footbridges across the race
    # the kitchens: smokehouse, brewhouse; and the stair down to the works beyond them
    g.rect(34, 21, 11, 7, '_'); g.put(33, 24, '`'); g.put(33, 25, '`')
    for x in (37, 38, 39):
        g.put(x, 21, ')')
    g.put(42, 21, '('); g.put(43, 21, '('); g.put(43, 23, '(')
    g.put(44, 26, 'k'); g.put(43, 27, 'k')
    g.rect(45, 24, 3, 2, '_'); g.put(48, 24, 'd')
    g.warp(48, 24, 'solskaft_deep', 3, 11, 'right')
    # the lit barracks
    g.rect(34, 12, 10, 6, '_'); g.put(33, 14, '`'); g.put(33, 15, '`')
    for (x, y) in [(36, 12), (38, 12), (40, 12), (42, 12), (36, 17), (38, 17)]:
        g.put(x, y, ';')
    # THE GROW: the top terrace under the Sunshaft's light (CANON 09-26d: "apple orchard and whatever else makes sense for
    # east Washington state climate"): apples, cherries and pears, hops for the brewhouse, a mint bed, dry-land wheat
    g.rect(34, 2, 14, 8, 'S'); g.put(33, 6, '`')
    for (x, y, ch) in [(35, 3, 't'), (37, 3, 't'), (39, 3, 't'), (35, 5, 't'), (37, 5, 't'), (39, 5, 't'),
                       (42, 3, 'b'), (44, 3, 'b'), (42, 5, 'e'), (44, 5, 'e'), (46, 3, 'f'), (46, 5, 'f'),
                       (35, 8, 'm'), (36, 8, 'm')]:
        g.put(x, y, ch)
    for x in range(40, 48):
        g.put(x, 8, 'y')                                         # dry-land wheat along the terrace's long edge
    # the wheelwright's lift, top and bottom of the shaft (sidequest 10)
    g.flagtile(32, 26, 'lift', 'flag:wwLift'); g.flagtile(32, 4, 'lift', 'flag:wwLift')
    g.warp(32, 26, 'solskaft', 31, 4, 'left', cond='flag:wwLift', sfx='door', hidden=True)
    g.warp(32, 4, 'solskaft', 31, 26, 'left', cond='flag:wwLift', sfx='door', hidden=True)
    # the dwarves' own stair, down to the Burial, at the head of the shaft
    g.put(24, 3, 'd')
    g.warp(24, 3, 'burial', 41, 5, 'left')
    # the garrison
    g.npc('pyro', 26, 46, 'pyro', dir='up', cond='!flag:pyroLeads | flag:captainHome')
    g.npc('ketil', 29, 46, 'ketil', dir='up')
    g.npc('ingrith', 13, 39, 'ingrith', dir='down', cond='flag:clericMet & !flag:ingrithEscort')
    g.npc('quartermaster', 16, 42, 'dclerk', dir='down')
    g.npc('ragna', 39, 44, 'ragna', dir='up')
    g.npc('brann', 31, 33, 'brann', dir='left', cond='!flag:escortsOut')
    g.npc('hedda', 32, 36, 'hedda', dir='left', cond='!flag:escortsOut')
    g.npc('halldor', 24, 34, 'halldor', dir='right', cond='flag:halldorUp & !flag:petition | flag:nestHome')
    g.npc('halldorBunk', 41, 16, 'halldor', dir='left', cond='flag:captainHome & !flag:halldorUp')
    for i, (x, y) in enumerate([(21, 33), (23, 33), (21, 35), (23, 35)]):
        g.npc('drill%d' % (i + 1), x, y, 'dtrooper' if i % 2 else 'dtrooper2', dir='right', idle=True)
    g.npc('drillmaster', 26, 34, 'dtrooper', dir='left', cond='!flag:reliefSeen | flag:nestCrushed')
    g.npc('cook', 40, 24, 'dcook', dir='down', wander=1)
    g.npc('sleeper', 40, 15, 'dtrooper2', dir='down')
    g.npc('shaftwatch', 31, 8, 'dtrooper', dir='left')
    g.npc('yardhand', 29, 31, 'dtrooper2', wander=2)
    g.npc('asdis', 4, 9, 'asdis', dir='down')
    g.npc('gardener', 41, 6, 'dtrooper2', dir='left', wander=1)
    g.npc('shroomer', 6, 4, 'dtrooper', dir='down')
    # what the walls say
    g.trig('pyroMeet', 22, 40, 'pyroMeet', on='step', w=13, h=2, cond='flag:frontDoor & !flag:pyroMet')
    g.trig('cot', 34, 31, 'cot', on='use', w=2, h=3)
    # a bed is a bed (re-cut F4): every bunk in both barracks is a rest point, like the yard cots; and Asdis's cot
    for (x, y) in [(15, 4), (17, 4), (19, 4), (21, 4), (13, 7), (15, 7), (17, 7), (19, 7), (36, 12), (38, 12), (40, 12), (42, 12), (36, 17), (38, 17)]:
        g.trig('bunk%d_%d' % (x, y), x, y, 'cot', on='use')
    g.trig('asdisCot', 3, 11, 'asdisRest', on='use')
    g.trig('ketilStop', 27, 46, 'ketilStop', on='step', w=2, cond='blasphemy>=1')   # "empty your packs" (spec §5.4)
    g.sign(14, 43, 'The assay-scales, under a cloth. Nobody has lifted it in seventy years; the dust on it is even.', 'handoff-2026-09-26 §4.3 A (the tollhouse)')
    g.sign(17, 37, 'THE TARIFF. Ingots by the stamp, lead by the pig, litharge by the jar. Charcoal, timber, salt, tallow, rope and bone-ash down. The prices are in a coin with a king\'s face nobody uses now.', 'handoff-2026-09-26 §4.3 (trade goods: up and down; INFERENCE, PROPOSED)')
    g.sign(45, 42, 'Brick, and a red mark cut across it. The old cut a shaft crew broke into, sixty years ago. The water went bad through here, and then the town burned.', 'wiki/deepholm-and-the-edifice.md (the Water Burning: an old dwarven cut feeding a cistern); spec §4.3 A')
    g.sign(40, 38, 'The stamp-mill wheel. The ore it broke is long gone; it turns because the covenant says the town\'s fountains must run, and the wheel is what meters them.', 'handoff-2026-09-26 §4.3 A (the falls-works)')
    g.sign(17, 18, 'The high seat of the Silversands, on its dais. Empty. He stands at the door.', 'handoff-2026-09-26 §4.3 B (the clan hall); spine-recut §5 (the throne on a dais at the hall\'s north end)')
    g.sign(17, 22, 'The oath-stone of the Silversands, directly below the empty seat. Every one of them put a hand here once; the band of gold is worn bright at hand height. At noon the light lands here.', 'handoff-2026-09-26 §4.3 B; spine-recut §5 (the beam lands on the oath-stone; "At noon the light lands here." seat\'s draft)')
    for x in range(11, 20):
        g.sign(x, 29, 'The hero-wall: the highway\'s dead, names cut in rows. Where a row stops short, a family stopped.', 'handoff-2026-09-26 §4.3 B (the hero-wall; a family\'s row ending is what "wiped out" looks like on stone)')
    g.sign(4, 18, 'The Forge-Father\'s niche: an anvil, worn to a saddle in the middle.', 'wiki/pantheon.md (the Dwarven Triad: Motsognir, the Forge-Father); spec §4.3 B')
    g.sign(6, 18, 'Rekknar\'s ledger-stone. Every line on it balances.', 'wiki/pantheon.md (Rekknar the Reckoner); spec §4.3 B')
    g.sign(8, 18, 'A plain cut in the rock with nothing in it. The Dormant\'s.', 'wiki/pantheon.md (Dvalgarda, the vigil); spec §4.3 B (the sect is never named here)')
    g.sign(37, 21, 'The smokehouse: meat, and nothing else. The rest of the table comes from the grow and the dark.', 'handoff-2026-09-26 §4.3 B (the kitchens); spine-recut §5 (Solskaft feeds itself; the food-from-below line cut)')
    g.sign(42, 21, 'The brewhouse. Dwarves. The hops come down from the terrace in baskets.', 'handoff-2026-09-26 §4.3 B; spine-recut §5 (hops for the brewhouse, PROPOSED by the east-Washington rule)')
    g.sign(13, 4, 'Six tiers of bunks up here, and a season\'s troops fill two of them. Dust on the rest.', 'handoff-2026-09-26 §4.3 B (the barracks tiers, most of them dark)')
    FAMS = {(8, 12): 'GREYSEAM', (12, 12): 'ORRI', (16, 12): 'HALLVEIG', (20, 12): 'KOLBEIN', (5, 15): 'COPPERBOTTOM', (9, 15): 'ASMUND',
            (13, 15): 'BRANDR', (17, 15): 'GEIRMUND', (21, 15): 'AUDUN'}
    for (x, y), nm in FAMS.items():
        if nm == 'COPPERBOTTOM':
            t = 'COPPERBOTTOM, cut in the lintel. Barred, like the rest, but somebody has chalked on the bar: AT THE FORGE.'
        elif nm in ('GEIRMUND', 'AUDUN'):
            t = nm + ', cut in the lintel. Barred. The line that lived here ended on the road; the ledger has the house.'
        else:
            t = nm + ', cut in the lintel. Barred from outside since the clans went back deep. The dust on the step is even.'
        g.sign(x, y, t, 'spine-recut §5 (the residential quarter, the familial residences, CLOSED: CANON 09-26d; the family names are the Burial\'s lines and the garrison\'s clans; the smiths\' hedge, seat\'s call)')
    g.sign(3, 12, 'SCALEBEAM, cut in the lintel, and the one door on the street with a light behind it.', 'spine-recut §5 (one lit door: the Scalebeam house, CANON 09-26e)')
    g.sign(35, 3, 'Apple trees, in soil carried up in baskets a season at a time. The fruit is small and very sweet.', 'spine-recut §5 (the grow is an apple orchard: RULED 09-26d)')
    g.sign(42, 3, 'Cherries, trained flat to the rock where the light is longest.', 'spine-recut §5 (cherries and pears, PROPOSED by his climate rule)')
    g.sign(46, 3, 'Pear trees, the oldest things growing in Solskaft.', 'spine-recut §5 (PROPOSED by his climate rule)')
    g.sign(35, 8, 'A mint bed. It gets into everything, the gardener says, which is the point.', 'spine-recut §5 (a mint bed, PROPOSED)')
    g.sign(40, 8, 'Dry-land wheat, thin and gold, along the terrace\'s long edge. It barely needs watering, which is why it is here.', 'spine-recut §5 (dry-land wheat, PROPOSED by the east-Washington rule)')
    g.sign(3, 3, 'The shroom farm: beds of spent ore-dust and dung in the dark, the caps pale in a hooded lamp. This is what Solskaft actually eats.', 'wiki/solskaft.md (the shroom farms, CANON 09-26c); spine-recut §5 (the shrooms are the staple)')
    save('solskaft', g, 'cave', 'Solskaft', music='solskaft', bg='dwarf', save=True,
         legend=dict(DEEP, **{'O': 'dais', 'H': 'houseShut', 'W': 'houseWin', 'L': 'houseLit', 'S': 'soil', 't': 'appleTree', 'b': 'cherryTree', 'e': 'hops', 'f': 'pearTree',
                     'm': 'mint', 'y': 'wheatBed', 'M': 'shroomBed', 'A': 'hearth', 'c': 'table', 'I': 'tombLamp', ':': 'floorStone', ',': 'dwarfFloor'}),
         beam={'x0': 16, 'x1': 18, 'y0': 22, 'y1': 28, 'land': [17, 22]})   # noon, through the doors, onto the oath-stone

    # ---------------------------------------------------------------- SOLSKAFT, the works: sorting floor, smelters, assay, mint, treasury, the highway's mouth
    W, H = 40, 24
    g = Grid(W, H, 'h')
    g.rect(2, 9, 36, 5, '_')
    g.rect(2, 2, 10, 6, '_'); g.rect(13, 2, 13, 6, '_'); g.rect(27, 2, 11, 6, '_')
    for (x, y) in [(6, 8), (7, 8), (19, 8), (20, 8), (32, 8)]:
        g.put(x, y, '_')
    g.put(2, 11, 'u')
    g.warp(2, 11, 'solskaft', 47, 24, 'left')
    # the ore-sorting floor, an armory now: the Copperbottom smith
    g.put(3, 2, '9'); g.put(5, 4, '8'); g.put(8, 5, '?'); g.put(9, 5, '?')
    for x in (7, 8, 9, 10):
        g.put(x, 1, '/')
    # the smelters, cold: three furnaces, the cupel-hearth, the slag-tip
    for x in (15, 18, 21):
        g.put(x, 2, 'a')
    g.put(23, 4, 'E')
    g.blob(15.5, 5.8, 1.8, 1.1, ':')
    # the assay house: the reason Fountain Street had to learn to weigh
    g.put(29, 2, 'a'); g.put(31, 4, '?'); g.put(35, 3, '&')
    # south: the mint (sealed), the treasury (open, empty), the trade hall (boarded)
    g.put(6, 14, 's')
    g.rect(12, 15, 9, 5, '_'); g.put(16, 14, '_')
    g.put(26, 14, '[')
    # the highway's mouth: the gate, and the ledger-lamp rack
    for y in (10, 11, 12):
        g.put(38, y, '=')
        g.put(39, y, '_')
        g.flagtile(38, y, 'gateOpen', 'flag:roadOpen')
    g.put(37, 9, 'l'); g.put(37, 13, 'l')
    g.trig('highwayGate', 38, 10, 'highwayGate', on='use', h=3, cond='!flag:roadOpen')
    g.trig('muster', 35, 10, 'muster', on='step', w=3, h=3, cond='flag:wordBelow & !flag:mustered')   # beat 6: the season musters at the gate
    g.npc('smith', 6, 5, 'dsmith', dir='down')
    g.npc('gatewatch', 36, 11, 'dtrooper', dir='left')
    g.npc('smelterhand', 19, 4, 'dtrooper2', dir='down')
    g.trig('treasury', 12, 15, 'treasury', on='step', w=9, h=5, once=True)
    g.sign(35, 3, 'A locked case: the standard weights of the assay, dwarven-true, each in its cut. The key is not here.', 'handoff-2026-09-26 §4.3 C (the assay house; sidequest 1)')
    g.sign(23, 4, 'The cupel-hearth: a shallow bowl of bone-ash. This is where silver is parted from lead. The ash came from the knacker\'s yard across the river, once.', 'handoff-2026-09-26 §4.3 (bone-ash for the cupels; Brennock\'s yard — INFERENCE, PROPOSED)')
    g.sign(18, 2, 'The smelters. Cold a long time. The slag-tip beside them has grown a skin of moss.', 'handoff-2026-09-26 §4.3 C')
    g.sign(31, 4, 'The touch-needles, laid out in their order. When the assay here closed, Fountain Street had to learn to weigh.', 'handoff-2026-09-26 §4.3 C (the assay is the reason Fountain Street exists — INFERENCE, the seat\'s)')
    g.sign(6, 14, 'The mint. A warranted door, and the runes are whole. The king sealed it.', 'handoff-2026-09-26 §4.3 C (the mint, sealed by Pyro)')
    g.sign(26, 14, 'The trade hall. NO SURFACE FOLK PAST THIS DOOR, cut in the lintel. The boards are nailed from this side.', 'handoff-2026-09-26 §4.3 C (the trade hall, sealed; boarded from the dwarves\' side)')
    g.sign(37, 9, 'The ledger-lamp rack. Three hooks, three lamps: one for each station down the road.', 'handoff-2026-09-26 §4.3 C (the highway\'s mouth)')
    save('solskaft_deep', g, 'cave', 'Solskaft — the works', music='solskaft', bg='dwarf', save=True, legend=DEEP,
         exits={'east': {'to': 'highway_1', 'tx': 1, 'ty': 10, 'dir': 'right'}})


# ---------------------------------------------------------------- THE HIGHWAY: four days, four legs, three lamps and the door (spec §6; re-cut 09-27 §4)
HW = {'.': 'caveFloor', '#': 'caveWall', '_': 'dwarfFloor', 'S': 'sealWhole', 'X': 'sealBroken', 'V': 'vein', 'L': 'lampTower', 'l': 'lampTowerDark',
      'C': 'chasm', '~': 'pool', ';': 'cot', 'T': 'tent', 'b': 'bones', ',': 'rubble', 'B': 'bodyCaptain', 'h': 'dwarfWall', 'k': 'crateCave',
      'f': 'fungus', '^': 'stalag', '*': 'glowmoss', 'o': 'ooze', 'N': 'noticeboard', 'm': 'madeRoad', 'w': 'deep', 'Q': 'cocoon', 'u': 'stairsUp'}
RECUT = 'handoff-2026-09-26-dragonsleep-spine-recut.md'


def road(g, x0, x1, y=10):
    g.rect(x0, y - 1, x1 - x0 + 1, 4, '.')
    g.rect(x0, y, x1 - x0 + 1, 2, '_')


def station(g, x0, y0, w, h, lamp, lit, seals):
    g.frame(x0, y0, w, h, 'h')
    g.rect(x0 + 1, y0 + 1, w - 2, h - 2, '_')
    g.put(lamp[0], lamp[1], 'L' if lit else 'l')
    return g


def build_highway():
    import random as _r
    # ---- leg one: Solskaft's mouth to First Lamp (the intrusions: hobgoblins, bugbears, an ogre, breaking through sealed caves)
    W, H = 72, 22
    rng = _r.Random(6101)
    g = Grid(W, H, '#')
    road(g, 0, 71)
    seals = []
    for x in (10, 22, 40, 52):
        g.put(x, 8, 'S'); seals.append({'x': x, 'y': 8})
    for x in (16, 34, 46, 57):
        g.put(x, 13, 'S'); seals.append({'x': x, 'y': 13})
    # the cut seal, and the goblins' camp in the cavern behind it
    g.blob(29, 4, 8, 3.2, '.', rng, .3)
    g.put(28, 8, 'X'); g.put(28, 7, '.'); seals.append({'x': 28, 'y': 8, 'cut': True})
    g.put(27, 8, 'V')
    for (x, y) in [(24, 3), (33, 3)]:
        g.put(x, y, 'T')
    for (x, y) in [(26, 5), (31, 2), (35, 5), (22, 5)]:
        g.put(x, y, 'b')
    for (x, y) in [(28, 6), (29, 7), (27, 6)]:
        g.put(x, y, ',')
    # a big open cavern off the south side: too wide to seal; the dark in it is where things come from (the grick pack)
    g.blob(43, 17, 8, 3.5, '.', rng, .35)
    for x in range(39, 48):
        g.put(x, 13, '.')
    for (x, y) in [(40, 18), (47, 16), (44, 19)]:
        g.put(x, y, '^')
    g.put(42, 16, 'f'); g.put(46, 18, 'f')
    # First Lamp: held; the garrison's forward post
    station(g, 61, 3, 11, 16, (66, 5), True, seals)
    for y in range(9, 13):
        g.put(61, y, '_')
        g.put(71, y, '_')
    g.rect(68, 14, 2, 2, '~')
    for (x, y) in [(62, 15), (62, 16), (64, 15), (64, 16)]:
        g.put(x, y, ';')
    g.put(71, 6, 'S'); seals.append({'x': 71, 'y': 6})
    g.npc('ulf', 65, 7, 'ketil', dir='down', name='Ulf Silversands')
    g.npc('lamp1a', 63, 6, 'dtrooper', dir='right', idle=True)
    g.npc('lamp1b', 69, 8, 'dtrooper2', dir='left')
    g.npc('lamp1c', 67, 14, 'dtrooper', dir='up')
    g.trig('lampArrive1', 61, 9, 'lampArrive', 1, on='step', h=4, cond='!flag:lamp1')
    g.trig('tower1', 66, 5, 'lampTower', 1, on='use')
    g.trig('cutSeal', 27, 5, 'cutSeal', on='step', w=4, h=3, cond='!flag:sealCleared')
    g.trig('grickDen', 40, 15, 'grickDen', on='step', w=7, h=4, cond='!flag:grickDone')
    g.trig('vein', 27, 8, 'vein', on='use')
    # the relief column passes the escort going down (beat 4: "he sends reinforcements back down")
    g.trig('relief', 36, 9, 'relief', on='step', h=4, cond='flag:captainFound & !flag:reliefSeen')
    g.zone('hw1', 0, 0, 60, H)
    save('highway_1', g, 'cave', 'The road to First Lamp', music='highway', bg='highway', save=False, dark=True, legend=HW,
         highway=1, seals=seals, lights=[{'x': 66, 'y': 5, 'r': 84}],
         exits={'west': {'to': 'solskaft_deep', 'tx': 37, 'ty': 11, 'dir': 'left'}, 'east': {'to': 'highway_2', 'tx': 1, 'ty': 11, 'dir': 'right'}})

    # ---- leg two: First Lamp to Second Lamp (deep fauna; the causeway across the great cavern; the roper at the fork)
    W, H = 76, 24
    rng = _r.Random(6202)
    g = Grid(W, H, '#')
    road(g, 0, 21, 11)
    road(g, 55, 75, 11)
    seals = []
    for x in (6, 14):
        g.put(x, 9, 'S'); seals.append({'x': x, 'y': 9})
    g.put(10, 14, 'S'); seals.append({'x': 10, 'y': 14})
    # the great cavern: open, unsealable; the causeway runs straight across it (north), a rim-path winds round (south)
    g.blob(38, 11.5, 17.5, 10, 'C', rng, .15)
    g.rect(22, 6, 33, 3, 'C')
    g.rect(22, 7, 33, 2, '_')
    for x in (22, 23):
        for y in range(7, 13):
            g.put(x, y, '.')
    for x in (53, 54):
        for y in range(7, 13):
            g.put(x, y, '.')
    g.path([(22, 13), (24, 17), (30, 19), (38, 20), (46, 19), (51, 17), (54, 13)], '.', width=2)
    road(g, 0, 21, 11); road(g, 55, 75, 11)                 # the chasm doesn't get the road
    for y in range(10, 14):
        g.put(20, y, '.'); g.put(21, y, '.'); g.put(55, y, '.')
    for (x, y) in [(28, 20), (41, 21), (48, 19)]:
        g.put(x, y, '~')
    for (x, y) in [(33, 18), (44, 18)]:
        g.put(x, y, '*')
    g.put(38, 5, '^')                                        # the stalactite over the causeway
    # the bulette's tunnel: a new breach, dug last month (no seal was ever there to cut)
    g.blob(61, 18, 4, 2.5, '.', rng, .3); g.put(61, 14, '.'); g.put(61, 15, '.'); g.put(61, 14, 'X'); seals.append({'x': 61, 'y': 14, 'cut': True})
    g.put(59, 19, ','); g.put(63, 17, ',')
    # the north cut: a side passage off the road, up to where Halldor's unit is pinned (beat 3: off the highway)
    for y in range(3, 10):
        g.put(58, y, '.')
    g.put(57, 4, '.'); g.put(59, 5, ','); g.put(58, 2, '.')
    g.put(58, 2, 'u')
    g.warp(58, 2, 'pinned', 9, 12, 'up', sfx='stairs')
    # Second Lamp: a manned outpost that was never abandoned (RULED 09-26d); its cistern runs; a drainage cut below
    station(g, 64, 3, 12, 11, (69, 5), True, seals)
    for y in range(10, 14):
        g.put(64, y, '_')
        g.put(75, y, '_')
    g.rect(64, 13, 12, 1, 'h')
    for y in range(10, 13):
        g.put(64, y, '_')
    g.rect(65, 10, 10, 3, '_')
    g.put(73, 4, '~'); g.put(74, 4, '~')
    for (x, y) in [(66, 4), (66, 6), (67, 4)]:
        g.put(x, y, ';')
    g.put(70, 13, '_')
    g.blob(70, 17, 4, 2.5, '_', rng, .1)
    g.put(68, 18, 'o'); g.put(72, 16, 'o')
    g.npc('thyra', 71, 6, 'thyra', dir='down', name='Thyra Silversands')
    g.npc('lamp2a', 67, 8, 'dtrooper2', dir='right')
    g.npc('lamp2b', 73, 7, 'dtrooper', dir='left', idle=True)
    g.npc('lamp2c', 68, 11, 'dtrooper2', dir='down')
    g.trig('lampArrive2', 64, 10, 'lampArrive', 2, on='step', h=3, cond='!flag:lamp2')
    g.trig('tower2', 69, 5, 'lampTower', 2, on='use')
    g.trig('roper', 36, 7, 'roper', on='step', w=5, h=2, cond='!flag:roperDead')
    g.trig('bulette', 59, 10, 'bulette', on='step', w=4, h=3, cond='!flag:buletteDead')
    g.trig('drain', 67, 15, 'drainCut', on='step', w=7, h=4, cond='!flag:puddingDead')
    # Pyro on the road (beat 3: three lines across the leg, while he walks it with you)
    g.trig('pyroRoad1', 9, 10, 'pyroRoad', 1, on='step', h=4, cond='flag:pyroLeads & !flag:captainFound & !flag:pyroRoad1')
    g.trig('pyroRoad2', 22, 7, 'pyroRoad', 2, on='step', w=2, h=6, cond='flag:pyroLeads & !flag:captainFound & !flag:pyroRoad2')
    g.trig('pyroRoad3', 56, 10, 'pyroRoad', 3, on='step', h=4, cond='flag:pyroLeads & !flag:captainFound & !flag:pyroRoad3')
    g.sign(59, 8, 'A side cut, north off the road. Fresh boot-marks going up it, dwarven, and none coming back.', RECUT + ' §2 beat 3 (off the highway: a side cavern)')
    g.zone('hw2', 0, 0, 64, H)
    save('highway_2', g, 'cave', 'The road to Second Lamp', music='highway', bg='cavern', save=False, dark=True, legend=HW,
         highway=2, seals=seals, lights=[{'x': 69, 'y': 5, 'r': 84}],
         exits={'west': {'to': 'highway_1', 'tx': 70, 'ty': 10, 'dir': 'left'}, 'east': {'to': 'highway_3', 'tx': 1, 'ty': 11, 'dir': 'right'}})

    # ---- the pinned cavern (beat 3): one screen, dark, a defensible dead-end. Halldor's unit holds the neck; the nest is past it
    W, H = 20, 15
    rng = _r.Random(6505)
    g = Grid(W, H, '#')
    g.blob(9.5, 9.5, 7.5, 3.2, '.', rng, .25)
    g.rect(9, 12, 2, 2, '.'); g.put(9, 13, 'u'); g.put(10, 13, 'u')
    g.rect(9, 3, 2, 4, '.')                                  # the neck
    g.blob(9.5, 2, 4, 1.6, '.', rng, .2)                     # the dark past it, where the brood came from
    g.put(8, 7, 'k'); g.put(11, 7, 'k')                      # a shield-wall of crates and packs across the neck's mouth
    for (x, y) in [(4, 9), (15, 10), (6, 11), (13, 8)]:
        g.put(x, y, ',')
    for (x, y) in [(5, 8), (14, 11)]:
        g.put(x, y, 'b')
    g.warp(9, 13, 'highway_2', 58, 3, 'down', sfx='stairs'); g.warp(10, 13, 'highway_2', 58, 3, 'down', sfx='stairs')
    g.npc('halldorPin', 9, 6, 'halldor', dir='down', cond='!flag:captainFound')
    g.npc('pinA', 10, 6, 'dtrooper', dir='down', cond='!flag:captainFound')
    g.npc('pinB', 9, 5, 'dtrooper2', dir='down', cond='!flag:captainFound')
    g.npc('pinC', 10, 5, 'dtrooper', dir='down', cond='!flag:captainFound')     # down: the two carried out after
    g.npc('pinD', 9, 4, 'dtrooper2', dir='down', cond='!flag:captainFound')
    g.trig('pinned', 7, 8, 'pinned', on='step', w=6, h=3, cond='!flag:captainFound')
    g.trig('neck', 9, 3, 'neck', on='step', w=2, cond='flag:captainFound & !flag:petition')
    g.put(9, 0, '#'); g.put(10, 0, '#'); g.put(9, 1, 'u'); g.put(10, 1, 'u')
    g.warp(9, 1, 'nest', 11, 14, 'up', cond='flag:petition')
    g.warp(10, 1, 'nest', 12, 14, 'up', cond='flag:petition')
    g.sign(8, 7, 'Crates and packs, stacked for a wall. The rock behind them is scratched from the inside, as if something had come through it.', RECUT + ' §2 beat 3 (they phase through rock, so a seal fails and a charge finds nothing)')
    save('pinned', g, 'cave', 'The north cut', music='highway', bg='cavern', save=False, dark=True, legend=HW,
         lights=[{'x': 9, 'y': 6, 'r': 40, 'cond': '!flag:captainFound'}])

    # ---- the nest (beat 5): the phase spiders' brood-gallery, deeper past the neck. Cocoons in the walls, and her
    W, H = 24, 16
    rng = _r.Random(6606)
    g = Grid(W, H, '#')
    g.blob(11.5, 9, 10, 4.5, '.', rng, .3)
    g.blob(11.5, 3.5, 6, 2.4, '.', rng, .2)                  # the brood chamber
    g.rect(11, 12, 2, 4, '.'); g.put(11, 15, 'u'); g.put(12, 15, 'u')
    for (x, y) in [(3, 7), (4, 10), (19, 8), (20, 11), (7, 4), (16, 3), (6, 12), (17, 12), (9, 2), (14, 2)]:
        if g.get(x, y) == '.':
            g.put(x, y, 'Q')
    for (x, y) in [(5, 9), (18, 10), (12, 6)]:
        g.put(x, y, 'b')
    g.warp(11, 15, 'pinned', 9, 2, 'down', sfx='stairs'); g.warp(12, 15, 'pinned', 10, 2, 'down', sfx='stairs')
    g.trig('brood', 8, 2, 'brood', on='step', w=8, h=4, cond='!flag:nestCrushed')
    g.trig('cocoons', 0, 0, 'cocoon', on='use', w=W, h=H)
    g.zone('nest', 0, 5, W, 11, cond='!flag:nestCrushed')
    save('nest', g, 'cave', 'The nest', music='highway', bg='cavern', save=False, dark=True, legend=HW)

    # ---- leg three: Second Lamp to Third Lamp (duergar and their stone giant, a xorn in the seam, cloakers; Third Lamp)
    # Third Lamp has three states: held (before the word from below), taken (the raid), and lit again
    W, H = 76, 24
    rng = _r.Random(6303)
    g = Grid(W, H, '#')
    road(g, 0, 75, 11)
    seals = []
    for x in (8, 19, 37, 48):
        g.put(x, 9, 'S'); seals.append({'x': x, 'y': 9})
    for x in (13, 26, 42, 53):
        g.put(x, 14, 'S'); seals.append({'x': x, 'y': 14})
    g.blob(31, 5, 4, 2.4, '.', rng, .3)                      # where the xorn has been eating the seam
    g.put(31, 9, ','); g.put(31, 8, ','); g.put(30, 8, ','); g.put(32, 7, ',')
    g.blob(44, 18, 5, 2.6, '.', rng, .3); g.put(44, 14, '.'); g.put(44, 15, '.')   # the duergar's cut, south, and their giant
    g.put(42, 19, 'T'); g.put(47, 18, 'k')
    # Third Lamp
    station(g, 60, 3, 16, 17, (68, 5), True, seals)
    for y in range(10, 14):
        g.put(60, y, '_')
        g.put(75, y, '_')
    for (x, y) in [(63, 8), (64, 8), (72, 14), (73, 14), (66, 15)]:
        g.flagtile(x, y, 'crateCave', 'flag:wordBelow')
    for (x, y) in [(71, 17), (73, 17), (71, 16)]:
        g.put(x, y, ';')
    g.flagtile(69, 17, 'bodyCaptain', 'flag:wordBelow')
    g.rect(73, 5, 2, 2, '~')
    g.flagtile(68, 5, 'lampTowerDark', 'flag:wordBelow & !flag:raidWon')
    g.npc('geir', 67, 7, 'dtrooper', dir='down', name='Geir Silversands', cond='!flag:wordBelow')
    g.npc('lamp3a', 64, 12, 'dtrooper2', dir='right', cond='!flag:wordBelow')
    g.npc('lamp3b', 72, 9, 'dtrooper', dir='left', cond='!flag:wordBelow')
    g.npc('brannLamp', 66, 7, 'brann', dir='down', cond='flag:raidWon & !flag:noEscort')
    g.npc('heddaLamp', 70, 7, 'hedda', dir='down', cond='flag:raidWon & !flag:noEscort')
    g.trig('lampArrive3', 60, 10, 'lampArrive', 3, on='step', h=4, cond='!flag:lamp3 & !flag:wordBelow')
    g.trig('raid', 57, 10, 'raid', on='step', h=4, cond='flag:wordBelow & !flag:raidWon')
    g.trig('tower3', 68, 5, 'lampTower', 3, on='use', cond='!flag:wordBelow | flag:raidWon')
    g.trig('xorn', 29, 10, 'xorn', on='step', w=3, h=4, cond='!flag:xornDone')
    g.trig('giant', 42, 16, 'giant', on='step', w=5, h=3, cond='!flag:giantDone')
    g.trig('captain', 69, 17, 'captain', on='use', cond='flag:wordBelow')
    g.trig('leavings', 66, 15, 'leavings', on='use', cond='flag:raidWon')
    g.trig('deepholmRoad', 74, 10, 'deepholmRoad', on='step', h=4, cond='!flag:wordBelow')
    g.zone('hw3', 0, 0, 56, H)
    save('highway_3', g, 'cave', 'The road to Third Lamp', music='highway', bg='highway', save=False, dark=True, legend=HW,
         highway=3, seals=seals, lights=[{'x': 68, 'y': 5, 'r': 84, 'cond': '!flag:wordBelow | flag:raidWon'}],
         exits={'west': {'to': 'highway_2', 'tx': 74, 'ty': 11, 'dir': 'left'}, 'east': {'to': 'highway_4', 'tx': 1, 'ty': 11, 'dir': 'right'}})

    # ---- leg four (RULED 09-26c, his word: "a 4 day journey"): Third Lamp to Deepholm's door. The drow's fallback line,
    # the deep-water crossing, and halfway the carved road gives way to made road; an earth elemental in the made road's cut
    W, H = 80, 24
    rng = _r.Random(6404)
    g = Grid(W, H, '#')
    road(g, 0, 79, 11)
    seals = []
    for x in (9, 24):
        g.put(x, 9, 'S'); seals.append({'x': x, 'y': 9})
    g.put(18, 14, 'S'); seals.append({'x': 18, 'y': 14})
    # the drow fell back here after Third Lamp: a line of their crates across the road
    for y in (9, 14):
        g.put(15, y, 'k')
    g.put(16, 8, 'b'); g.put(14, 15, ',')
    # the deep water: the road goes across it on a causeway of dressed blocks; the rest is black and cold
    g.blob(36, 11.5, 7, 6, 'w', rng, .15)
    g.rect(29, 10, 15, 4, '.'); g.rect(29, 11, 15, 2, '_')
    for x in range(30, 43):
        g.put(x, 10, 'w'); g.put(x, 13, 'w')
    # the troll hole, a cavern off the south side
    g.blob(52, 18, 5, 2.8, '.', rng, .3); g.put(52, 14, '.'); g.put(52, 15, '.')
    g.put(50, 19, 'b'); g.put(54, 18, 'b'); g.put(53, 20, ',')
    # halfway: the made road begins (the first dressed stone the door's sign spoke of)
    for x in range(46, 80):
        for y in (11, 12):
            g.put(x, y, 'm')
    g.rect(62, 8, 5, 8, '.'); g.rect(62, 11, 5, 2, 'm')          # the made road's cut, where the rock moves
    g.put(61, 9, ','); g.put(67, 14, ',')
    g.trig('fallback', 13, 10, 'fallback', on='step', h=4, cond='!flag:fallbackDone')
    g.trig('naga', 33, 11, 'naga', on='step', h=2, cond='!flag:nagaDone')
    g.trig('trolls', 50, 16, 'trolls', on='step', w=5, h=3, cond='!flag:trollsDone')
    g.trig('elemental', 63, 10, 'elemental', on='step', h=4, cond='!flag:elementalDone')
    g.sign(46, 9, 'Here the carved road ends and a made road begins: dressed stone, laid, not cut. The first since Solskaft.', RECUT + ' §4 (the first dressed stone moves to this leg\'s midpoint)')
    g.zone('hw4', 0, 0, 80, H)
    save('highway_4', g, 'cave', "The road to Deepholm's door", music='highway', bg='highway', save=False, dark=True,
         legend=dict(HW, m='madeRoad'), highway=4, seals=seals,
         exits={'west': {'to': 'highway_3', 'tx': 74, 'ty': 11, 'dir': 'left'}, 'east': {'to': 'threshold', 'tx': 1, 'ty': 8, 'dir': 'right'}})

    # ---- Deepholm's door: the small spot where the highway ends (spec §6.4), where the fourth day ends now. One screen
    W, H = 18, 15
    g = Grid(W, H, '#')
    g.rect(1, 4, 16, 9, 'm')                               # the made road's end
    g.rect(0, 7, 3, 3, 'm')
    for y in range(4, 13):
        g.put(17, y, 'h')
    g.put(17, 7, 'D'); g.put(17, 8, 'D'); g.put(17, 9, 'd')  # the door, three tall; light under it
    g.hline(12, 16, 3, 'h')
    g.put(14, 4, 'G'); g.put(15, 4, 'G')                   # the toll-grille; Dagny behind it
    g.put(10, 3, 'Y')                                      # the tariff board, prices in a live coin
    g.put(12, 11, '%')                                     # the weigh-station
    g.put(5, 12, 'n'); g.put(6, 12, 'n')                   # a bench
    g.npc('dagny', 14, 3, 'dagny', dir='down')
    g.trig('deepDoor', 17, 7, 'deepDoor', on='use', h=3)
    g.trig('tariff', 10, 3, 'tariff', on='use')
    g.sign(12, 11, 'The weigh-station. The weights are honest. Nobody here would know how to make them otherwise.', SPEC_REF + ' §6.4 (a weigh-station)')
    g.sign(5, 12, "A stone bench, worn in the middle by four days' worth of the tired.", SPEC_REF + ' §6.4 (a bench); ' + RECUT + ' §4 (four days)')
    save('threshold', g, 'cave', "Deepholm's Door", music='highway', bg='highway', save=True, dark=True, legend=dict(HW, **{'m': 'madeRoad', 'D': 'deepDoor', 'd': 'deepDoorSill', 'G': 'grille', 'Y': 'tariffLive', '%': 'scales', 'n': 'bench'}),
         lights=[{'x': 16, 'y': 8, 'r': 90, 'col': 'rgba(255,200,120,0.22)'}, {'x': 14, 'y': 4, 'r': 40}],
         exits={'west': {'to': 'highway_4', 'tx': 78, 'ty': 11, 'dir': 'left'}})


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for f in (build_world, build_silverton, build_hex, build_winters, build_percy, build_warrens, build_galleries, build_gulch, build_halfway, build_deep, build_highway):
        f()
    for id, d in MAPS.items():
        with open(os.path.join(OUT, id + '.json'), 'w', encoding='utf-8') as fh:
            json.dump(d, fh, ensure_ascii=False, indent=0)
        print('%-14s %3dx%-3d npcs=%d warps=%d trig=%d' % (id, len(d['rows'][0]), len(d['rows']), len(d.get('npcs', [])), len(d.get('warps', [])), len(d.get('triggers', []))))

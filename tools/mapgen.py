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
    g.sign(30, 12, 'THE TOWER. The sign says "Wizard School." Everyone calls it the Tower. The door does not open for you.', 'wiki/silverton.md; wiki/vice-row.md (the Wizard School = the Tower)')
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
    save('world', g, 'world', 'The Corridor', music='field', bg='plains', outside=True,
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
    g.door(*D('percy'), 'keeper', 'percy'); g.door(*D('tam'), 'keeper', 'tam'); g.door(*D('aldwin'), 'chapel', 'aldwin', icon='sun')
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
    g.sign(5, 5, 'NORTH GATE. The Doors road, up the mountain. The locals call it the Coldridge route.', 'wiki/the-road.md (the Doors road); rumors r-coldridge (wiki/fountain-street.md HD-1)')
    g.sign(29, 5, 'The vault door. The highway to Deepholm. Nobody bothers the dwarves. Not since the Water Burning.', 'wiki/silverton.md (the one law: nobody bothers the dwarves)')
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
    g.trig('landlordStep', 7, 8, 'landlordNear', on='step', w=4, h=1)
    g.trig('jelly', 22, 14, 'jelly', on='step', w=3, h=1, once=True)
    g.trig('ooze', 12, 16, 'oozeFight', on='step', once=True)
    g.trig('mark', 22, 19, 'mark', on='use')
    g.trig('stair', 19, 20, 'stair', on='use', w=1, h=4)
    g.put(19, 20, 'n'); g.put(19, 21, 'n'); g.put(19, 22, 'n'); g.put(19, 23, 'n')
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
    g.warp(17, 3, 'galleries_g2', 17, 26, 'up')
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
    g.flagtile(18, 17, 'gulch', 'trig:snared')
    g.trig('ettercap', 29, 9, 'ettercap', on='step', w=3, h=2, cond='!flag:ettercapDone')
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
    g.npc('doranYard', 9, 11, 'worker', dir='down')
    g.npc('orrin', 25, 13, 'kid', dir='right', cond='!flag:dueSeen')
    g.npc('pell', 22, 16, 'kid', wander=1, cond='!flag:dueSeen')
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
    g.npc('doranIn', 8, 3, 'worker', dir='left')
    g.npc('elsbeth', 15, 5, 'elsbeth', dir='up')
    g.npc('katarina', 2, 6, 'priest', dir='right')
    g.sign(9, 1, 'The stair up. The room over the kitchen has a bedside drawer. In it, a finished manuscript, left like a Gideons bible.', 'wiki/halfway-inn-and-lake.md (Katarina finished Book One here)')
    save('halfway_in', g, 'inside', 'The Halfway Inn — inside', music='inn', bg='town', legend={'.': 'floorWood'})


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for f in (build_world, build_silverton, build_hex, build_winters, build_warrens, build_galleries, build_gulch, build_halfway):
        f()
    for id, d in MAPS.items():
        with open(os.path.join(OUT, id + '.json'), 'w', encoding='utf-8') as fh:
            json.dump(d, fh, ensure_ascii=False, indent=0)
        print('%-14s %3dx%-3d npcs=%d warps=%d trig=%d' % (id, len(d['rows'][0]), len(d['rows']), len(d.get('npcs', [])), len(d.get('warps', [])), len(d.get('triggers', []))))

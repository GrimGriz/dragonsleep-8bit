"""The main heroes' drawn 8-bit figures -> first/js/heroes8.js (ART-77, 2026-11-11; Aurdin from ART-72 the same day).

Griz, 2026-11-11, to the desk: "thaw out the 8-bit freeze long enough to replace the main hero 8-bit graphics"; then, on the report that
Aurdin's and Barley's earlier 8-bit pages stayed in storage: "should probably have it slap barley and aurdin in there as well".

  Lymen, Vivian -- the art desk's ART-77-8BIT deliveries: a native 1x RGBA contact a head (battle 16x24 facing left; map 16x16, DOWN UP
      RIGHT, LEFT mirrored) and a FRAME-MAP.csv; every enlarged crop checked against its native cell over the sheet's navy.
  Aurdin -- the art desk's ART-72 (the Ochre Mantle) native atlases (`native/aurdin-ochre-battle.png` + .json: 32x32 cells, anchor 16,30,
      facing left; `aurdin-ochre-map.png` + .json: S W E N, four frames, 16x16), as exported: his battle rows are cut 24 wide (cell columns
      4-27, rows 6-29) so an outstretched arm stays whole -- `ox` 4 tells the battle where the 16-wide figure stands in them. He has no
      weapon row (ART-72 drew no staff): his FIGHT is CastForward's push, his MAGIC CastOverhead. The map's W is his own, not a mirror.
  Barley -- NOT CUT: his ART-75/76 8-bit pages are high-resolution illustrations with no native atlas; a reduction to 22 px lost his face
      and the flail (the cutter's try, 11-11), so the typed figure stays (deep16-dream-polish.md).

The pixels go out as typed rows with a palette a hero -- the first game's people are typed rows already (first/js/sprites.js) -- so the
figures load with the page, no image fetch.

  python tools/heroes8-sheet.py              writes first/js/heroes8.js (then: python tools/first-lock.py fix "...")
  python tools/heroes8-sheet.py --check      writes nothing; exit 1 if the file is not what the sources make

The sources sit under deep16/_src/ (gitignored); a worktree without them reads the main checkout's.
"""
import csv, json, os, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'first', 'js', 'heroes8.js')
CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
ART77 = {
    'lymen': {'battle': ('HEAD-1-BATTLE.png', 'HEAD-1-BATTLE-NATIVE.png'), 'map': ('HEAD-2-MAP.png', 'HEAD-2-MAP-NATIVE.png')},
    'vivian': {'battle': ('ART-77-8BIT-VIVIAN-HEAD-1.png', 'ART-77-8BIT-VIVIAN-HEAD-1-NATIVE.png'),
               'map': ('ART-77-8BIT-VIVIAN-HEAD-2.png', 'ART-77-8BIT-VIVIAN-HEAD-2-NATIVE.png')},
}
# Aurdin's picks off ART-72's rows (1-based frames): the pose the first game draws <- (row, frames)
AURDIN = {'stand': ('Idle', [1, 3]), 'act': ('CastForward', [2, 3]), 'cast': ('CastOverhead', [2, 3]), 'hurt': ('Flinch', [1]),
          'win': ('Victory', [1, 3]), 'ko': ('Down', [1])}
AURDIN_MAP = {'down': 'S', 'up': 'N', 'right': 'E', 'left': 'W'} # (stand = frame 1, walk = frames 2 and 4: his cycle is step, pass, step, pass)


def src_root():
    here = os.path.join(ROOT, 'deep16', '_src')
    if os.path.isdir(os.path.join(here, 'lymen', 'ART-77-8BIT')):
        return here
    common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--path-format=absolute', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
    return os.path.join(os.path.dirname(common), 'deep16', '_src')


def col(r, *names):
    for n in names:
        if n in r:
            return r[n]
    raise KeyError(names)


def opaque(cell, who):
    if any(p[3] not in (0, 255) for p in cell.getdata()):
        raise SystemExit('%s: a part-transparent pixel' % who)
    return cell


def art77(hero):
    """-> {battle: {pose: [16x24]}, ox: 0, ko: (24x16, 0), map: {dir: (stand, [walk1, walk2])}}"""
    d = os.path.join(src_root(), hero, 'ART-77-8BIT')
    got = {'battle': {}, 'map': {}}
    sheets = {}
    for r in csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8')):
        src = col(r, 'source', 'head')
        head = 'battle' if ('HEAD-1' in src) else 'map'
        big, nat = ART77[hero][head]
        if head not in sheets:
            sheets[head] = (Image.open(os.path.join(d, big)).convert('RGBA'), Image.open(os.path.join(d, nat)).convert('RGBA'))
        B, N = sheets[head]
        nx, ny, nw, nh = (int(col(r, 'native_' + a, 'native_' + b)) for a, b in (('x', 'x'), ('y', 'y'), ('w', 'width'), ('h', 'height')))
        sx, sy, sw, sh = (int(col(r, 'source_' + a, 'source_' + b)) for a, b in (('x', 'x'), ('y', 'y'), ('w', 'width'), ('h', 'height')))
        cell = N.crop((nx, ny, nx + nw, ny + nh))
        big_cell = B.crop((sx, sy, sx + sw, sy + sh)).resize((nw, nh), Image.NEAREST)
        comp = Image.new('RGBA', (nw, nh), big_cell.getpixel((0, 0)))
        comp.alpha_composite(cell)
        if list(comp.getdata()) != list(big_cell.getdata()):
            raise SystemExit('%s %s %s: the native cell is not the enlarged crop' % (hero, col(r, 'action', 'row'), r['frame']))
        got[head].setdefault(col(r, 'action', 'row'), {})[int(r['frame'])] = opaque(cell, hero)
    b, m = got['battle'], got['map']
    out = {'battle': {}, 'ox': 0, 'map': {}}
    for pose, row in (('stand', 'Stand'), ('act', 'Act'), ('cast', 'Cast'), ('hurt', 'Hurt'), ('win', 'Win')):
        out['battle'][pose] = [b[row][k] for k in sorted(b[row])]
    ko = Image.new('RGBA', (24, 16), (0, 0, 0, 0)); ko.paste(b['KO'][1].crop((0, 8, 16, 24)), (4, 0)) # (the cell's rows 8-23 at (4, 0): drawn at (x - 4, y + 8), the cell's own place)
    out['ko'] = (ko, 0)
    for dname in ('DOWN', 'UP', 'RIGHT'):
        out['map'][dname.lower()] = (m['Stand ' + dname][1], [m['Walk ' + dname][k] for k in sorted(m['Walk ' + dname])])
    return out


def aurdin():
    d = os.path.join(src_root(), 'art-desk', 'received-2026-10-18-ART-72', 'native')
    out = {'battle': {}, 'ox': 4, 'map': {}}
    meta = json.load(open(os.path.join(d, 'aurdin-ochre-battle.json'), encoding='utf-8'))
    rows = {r['row']: r for r in meta['records']}
    N = Image.open(os.path.join(d, 'aurdin-ochre-battle.png')).convert('RGBA')

    def cell(row, k):
        r = rows[row]
        if (r['fw'], r['fh'], r['ax'], r['ay']) != (32, 32, 16, 30) or k > r['frames']:
            raise SystemExit('aurdin: ART-72 battle row %s is not the 32x32 cell anchored 16,30 this cut reads' % row)
        return opaque(N.crop((r['x'] + 32 * (k - 1), r['y'], r['x'] + 32 * k, r['y'] + 32)), 'aurdin')
    for pose, (row, ks) in AURDIN.items():
        cs = [cell(row, k) for k in ks]
        if pose == 'ko':
            out['ko'] = (cs[0].crop((0, 14, 32, 30)), 4) # (rows 14-29, the feet's row 29 on the standing ground line; drawn at (x - 4 - 4, y + 8))
        else:
            for c in cs:
                bb = c.getbbox()
                if bb[0] < 4 or bb[2] > 28 or bb[1] < 6:
                    raise SystemExit('aurdin: %s runs out of the 24 x 24 window: %s' % (row, bb))
            out['battle'][pose] = [c.crop((4, 6, 28, 30)) for c in cs]
    meta = json.load(open(os.path.join(d, 'aurdin-ochre-map.json'), encoding='utf-8'))
    rows = {r['row']: r for r in meta['records']}
    M = Image.open(os.path.join(d, 'aurdin-ochre-map.png')).convert('RGBA')
    for dname, row in AURDIN_MAP.items():
        r = rows[row]
        f = [opaque(M.crop((r['x'] + 16 * k, r['y'], r['x'] + 16 * k + 16, r['y'] + 16)), 'aurdin') for k in range(4)]
        out['map'][dname] = (f[0], [f[1], f[3]])
    return out


def build():
    lines = []
    for hero, got in (('lymen', art77('lymen')), ('vivian', art77('vivian')), ('aurdin', aurdin())):
        imgs = [c for fs in got['battle'].values() for c in fs] + [got['ko'][0]] + [c for st, w in got['map'].values() for c in [st] + w]
        cols = []
        for c in imgs:
            for p in c.getdata():
                if p[3] and '#%02x%02x%02x' % p[:3] not in cols:
                    cols.append('#%02x%02x%02x' % p[:3])
        if len(cols) > len(CHARS):
            raise SystemExit(hero + ': too many colours')
        key = {h: CHARS[i] for i, h in enumerate(cols)}

        def rows(cell):
            w, h = cell.size
            return '[' + ', '.join("'" + ''.join(key['#%02x%02x%02x' % cell.getpixel((x, y))[:3]] if cell.getpixel((x, y))[3] else '.' for x in range(w)) + "'"
                                   for y in range(h)) + ']'

        def many(fs):
            return '[' + ', '.join(rows(c) for c in fs) + ']'
        lines.append('  ART.%s = {' % hero)
        lines.append('    pal: {' + ', '.join("%s: '%s'" % (key[h], h) for h in cols) + '},')
        lines.append('    ox: %d, // (where the 16-wide figure stands in its battle rows)' % got['ox'])
        lines.append('    battle: {')
        for pose in ('stand', 'act', 'cast', 'hurt', 'win'):
            lines.append('      %s: %s,' % (pose, many(got['battle'][pose])))
        lines.append('    },')
        lines.append('    ko: { ox: %d, rows: %s },' % (got['ko'][1], rows(got['ko'][0])))
        lines.append('    map: {')
        for dname in ('down', 'up', 'right', 'left'):
            if dname in got['map']:
                st, w = got['map'][dname]
                lines.append('      %s: { stand: %s, walk: %s },' % (dname, rows(st), many(w)))
        lines.append('    }')
        lines.append('  };')
    return HEAD + '\n'.join(lines) + '\n' + TAIL


HEAD = r"""/* DRAGONSLEEP -- the main heroes drawn: Lymen's and Vivian's 8-bit figures from the art desk's ART-77-8BIT, and Aurdin's from its ART-72
   (2026-11-11), in place of the typed templates of first/js/sprites.js for those three (Barley stays typed: his pages had no native cut).
   Griz, 2026-11-11: "thaw out the 8-bit freeze long enough to replace the main hero 8-bit graphics"; then "should probably have it slap
   barley and aurdin in there as well". GENERATED by tools/heroes8-sheet.py from the native cells -- do not edit the rows by hand.
   DS.fighter keeps its shape ({stand, act, cast, hurt, ko, win}: 16 x 24 canvases, ko 24 x 16 drawn at (x - 4, y + 8)) and adds `anim`,
   each pose's frames as cut -- possibly wider than 16, with `.ox` the columns left of where the 16-wide figure stands -- which
   first/js/battle.js plays; ko carries an `.ox` the same way. DS.walker keeps {down, up, left, right} as [walk 1, walk 2] and adds each
   `.stand` (the map draws it when the hero is still); LEFT is RIGHT mirrored unless a hero has his own. Any other look goes to the typed
   templates as before. */
'use strict';
(function () {
  var DS = window.DS;
  var ART = {};
"""
TAIL = r"""  function canvas(rows, pal, flip, x0, w) {
    var n = rows[0].length; x0 = x0 || 0; w = w || n - x0;
    var c = document.createElement('canvas'); c.width = w; c.height = rows.length;
    var x = c.getContext('2d');
    for (var y = 0; y < rows.length; y++) for (var i = x0; i < x0 + w; i++) {
      var ch = rows[y][i]; if (ch === '.') continue;
      x.fillStyle = pal[ch]; x.fillRect(flip ? x0 + w - 1 - i : i - x0, y, 1, 1);
    }
    return c;
  }
  var typedFighter = DS.fighter, typedWalker = DS.walker, cache = {};
  DS.fighter = function (look, weapon) {
    var a = look && look.drawn && ART[look.drawn];
    if (!a) return typedFighter(look, weapon);
    if (cache['b:' + look.drawn]) return cache['b:' + look.drawn];
    var out = { anim: {} };
    ['stand', 'act', 'cast', 'hurt', 'win'].forEach(function (pose) {
      out.anim[pose] = a.battle[pose].map(function (r) { var c = canvas(r, a.pal); c.ox = a.ox; return c; });
      out[pose] = canvas(a.battle[pose][0], a.pal, false, a.ox, 16); // (the 16-wide figure, for the menus and the pick)
    });
    out.ko = canvas(a.ko.rows, a.pal); out.ko.ox = a.ko.ox;
    return (cache['b:' + look.drawn] = out);
  };
  DS.walker = function (look) {
    var a = look && look.drawn && ART[look.drawn];
    if (!a) return typedWalker(look);
    if (cache['w:' + look.drawn]) return cache['w:' + look.drawn];
    function dir(d, flip) { var o = d.walk.map(function (r) { return canvas(r, a.pal, flip); }); o.stand = canvas(d.stand, a.pal, flip); return o; }
    var out = { down: dir(a.map.down), up: dir(a.map.up), right: dir(a.map.right), left: a.map.left ? dir(a.map.left) : dir(a.map.right, true) };
    return (cache['w:' + look.drawn] = out);
  };
  DS.walkerStill = function (fr, d) { return fr[d].stand || fr[d][0]; }; // a figure standing still: its stand, or the typed figure's first step
  Object.keys(ART).forEach(function (k) { if (DS.LOOKS[k]) DS.LOOKS[k].drawn = k; });
})();
"""

if __name__ == '__main__':
    js = build()
    if '--check' in sys.argv:
        ok = os.path.exists(OUT) and open(OUT, encoding='utf-8').read().replace('\r\n', '\n') == js
        print('ok: first/js/heroes8.js is the sources' if ok else 'FAIL: first/js/heroes8.js is not what the sources make')
        sys.exit(0 if ok else 1)
    open(OUT, 'w', encoding='utf-8', newline='\n').write(js)
    print('wrote', os.path.relpath(OUT, ROOT), len(js), 'bytes')

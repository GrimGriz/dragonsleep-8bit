"""The main heroes' drawn 8-bit figures (ART-77, 2026-11-11) -> first/js/heroes8.js.

Griz, 2026-11-11, to the desk: "thaw out the 8-bit freeze long enough to replace the main hero 8-bit graphics". The art desk's ART-77-8BIT
deliveries (Lymen, Vivian) give a native 1x RGBA contact sheet a head (battle 16x24, facing left; map 16x16, DOWN UP RIGHT) and a FRAME-MAP.csv;
this reads the native cells as given (no scaling, no recolour), checks every enlarged crop against its native cell over the sheet's navy, and
writes the pixels as typed rows with a palette a hero -- the first game's people are hand-typed rows already (first/js/sprites.js), so the
figures load with the page, no image fetch.

  python tools/heroes8-sheet.py              writes first/js/heroes8.js (then: python tools/first-lock.py fix "...")
  python tools/heroes8-sheet.py --check      writes nothing; exit 1 if the file is not what the sources make

The sources sit under deep16/_src/<hero>/ART-77-8BIT/ (gitignored); a worktree without them reads the main checkout's.
"""
import csv, os, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'first', 'js', 'heroes8.js')
CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
HEROES = {
    'lymen': {'battle': ('HEAD-1-BATTLE.png', 'HEAD-1-BATTLE-NATIVE.png'), 'map': ('HEAD-2-MAP.png', 'HEAD-2-MAP-NATIVE.png')},
    'vivian': {'battle': ('ART-77-8BIT-VIVIAN-HEAD-1.png', 'ART-77-8BIT-VIVIAN-HEAD-1-NATIVE.png'),
               'map': ('ART-77-8BIT-VIVIAN-HEAD-2.png', 'ART-77-8BIT-VIVIAN-HEAD-2-NATIVE.png')},
}


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


def cells(hero):
    d = os.path.join(src_root(), hero, 'ART-77-8BIT')
    out = {'battle': {}, 'map': {}}
    sheets = {}
    for r in csv.DictReader(open(os.path.join(d, 'FRAME-MAP.csv'), encoding='utf-8')):
        src = col(r, 'source', 'head')
        head = 'battle' if ('HEAD-1' in src) else 'map'
        big, nat = HEROES[hero][head]
        if head not in sheets:
            sheets[head] = (Image.open(os.path.join(d, big)).convert('RGBA'), Image.open(os.path.join(d, nat)).convert('RGBA'))
        B, N = sheets[head]
        nx, ny, nw, nh = (int(col(r, k + '_' + a, k + '_' + b)) for k, a, b in
                          (('native', 'x', 'x'), ('native', 'y', 'y'), ('native', 'w', 'width'), ('native', 'h', 'height')))
        sx, sy, sw, sh = (int(col(r, k + '_' + a, k + '_' + b)) for k, a, b in
                          (('source', 'x', 'x'), ('source', 'y', 'y'), ('source', 'w', 'width'), ('source', 'h', 'height')))
        cell = N.crop((nx, ny, nx + nw, ny + nh))
        big_cell = B.crop((sx, sy, sx + sw, sy + sh)).resize((nw, nh), Image.NEAREST)
        comp = Image.new('RGBA', (nw, nh), big_cell.getpixel((0, 0)))
        comp.alpha_composite(cell)
        if list(comp.getdata()) != list(big_cell.getdata()):
            raise SystemExit('%s %s %s: the native cell is not the enlarged crop' % (hero, col(r, 'action', 'row'), r['frame']))
        if any(p[3] not in (0, 255) for p in cell.getdata()):
            raise SystemExit('%s: a part-transparent pixel' % hero)
        row = col(r, 'action', 'row')
        out[head].setdefault(row, {})[int(r['frame'])] = cell
    return out


def build():
    lines = []
    for hero in HEROES:
        c = cells(hero)
        cols = []
        for head in c.values():
            for frames in head.values():
                for cell in frames.values():
                    for p in cell.getdata():
                        if p[3] and '#%02x%02x%02x' % p[:3] not in cols:
                            cols.append('#%02x%02x%02x' % p[:3])
        if len(cols) > len(CHARS):
            raise SystemExit(hero + ': too many colours')
        key = {h: CHARS[i] for i, h in enumerate(cols)}

        def rows(cell):
            w, h = cell.size
            return '[' + ', '.join("'" + ''.join(key['#%02x%02x%02x' % cell.getpixel((x, y))[:3]] if cell.getpixel((x, y))[3] else '.' for x in range(w)) + "'"
                                   for y in range(h)) + ']'

        def pair(frames):
            return '[' + ', '.join(rows(frames[k]) for k in sorted(frames)) + ']'
        b, m = c['battle'], c['map']
        lines.append('  ART.%s = {' % hero)
        lines.append('    pal: {' + ', '.join("%s: '%s'" % (key[h], h) for h in cols) + '},')
        lines.append('    battle: {')
        for pose, row in (('stand', 'Stand'), ('act', 'Act'), ('cast', 'Cast'), ('hurt', 'Hurt'), ('ko', 'KO'), ('win', 'Win')):
            lines.append('      %s: %s,' % (pose, pair(b[row])))
        lines.append('    },')
        lines.append('    map: {')
        for d in ('DOWN', 'UP', 'RIGHT'):
            lines.append('      %s: { stand: %s, walk: %s },' % (d.lower(), rows(m['Stand ' + d][1]), pair(m['Walk ' + d])))
        lines.append('    }')
        lines.append('  };')
    return HEAD + '\n'.join(lines) + '\n' + TAIL


HEAD = r"""/* DRAGONSLEEP -- the main heroes drawn: Lymen's and Vivian's 8-bit figures from the art desk's ART-77-8BIT (2026-11-11), in place of the
   typed templates of js/sprites.js for those two. Griz, 2026-11-11: "thaw out the 8-bit freeze long enough to replace the main hero 8-bit
   graphics". GENERATED by tools/heroes8-sheet.py from the native cells (deep16/_src/<hero>/ART-77-8BIT/) -- do not edit the rows by hand.
   DS.fighter keeps its shape ({stand, act, cast, hurt, ko, win} canvases; ko 24 x 16 as the typed one, the drawn 16 x 24 cell's bottom
   placed so the battle's (x - 4, y + 8) puts it where the cell stands) and adds `anim` (the two-frame rows, which first/js/battle.js plays);
   DS.walker keeps {down, up, left, right} as [walk 1, walk 2] and adds each `.stand` (the map draws it when the hero is still); LEFT is
   RIGHT mirrored, as the art desk drew it. Any other look goes to the typed templates as before. */
'use strict';
(function () {
  var DS = window.DS;
  var ART = {};
"""
TAIL = r"""  function canvas(rows, pal, flip, w, h, ox, oy) {
    var c = document.createElement('canvas'); c.width = w || rows[0].length; c.height = h || rows.length;
    var x = c.getContext('2d'), n = rows[0].length;
    for (var y = 0; y < rows.length; y++) for (var i = 0; i < n; i++) {
      var ch = rows[y][i]; if (ch === '.') continue;
      x.fillStyle = pal[ch]; x.fillRect((ox || 0) + (flip ? n - 1 - i : i), (oy || 0) + y, 1, 1);
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
      out.anim[pose] = a.battle[pose].map(function (r) { return canvas(r, a.pal); });
      out[pose] = out.anim[pose][0];
    });
    var ko = a.battle.ko[0];
    out.ko = canvas(ko.slice(8), a.pal, false, 24, 16, 4, 0); // (the cell's rows 8-23 at (4, 0): drawn at (x - 4, y + 8), the cell's own place)
    return (cache['b:' + look.drawn] = out);
  };
  DS.walker = function (look) {
    var a = look && look.drawn && ART[look.drawn];
    if (!a) return typedWalker(look);
    if (cache['w:' + look.drawn]) return cache['w:' + look.drawn];
    function dir(d, flip) { var o = d.walk.map(function (r) { return canvas(r, a.pal, flip); }); o.stand = canvas(d.stand, a.pal, flip); return o; }
    var out = { down: dir(a.map.down), up: dir(a.map.up), right: dir(a.map.right), left: dir(a.map.right, true) };
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

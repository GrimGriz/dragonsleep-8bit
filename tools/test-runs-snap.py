"""test-runs.html's SNAP, written from the game's own files (2026-11-26, the Pocket DM lane §2.11: "The SNAP in test-runs.html ... was not updated").

The page reads its lists live from the game's files when it is served (classes, races, the named, the bestiary, the spells, the features, the fights);
the SNAP is what it shows opened from disk or offline. This reads the same files with the page's own patterns and writes the SNAP line again.

    python tools/test-runs-snap.py          # what the SNAP holds against what the files hold, a line a list
    python tools/test-runs-snap.py write    # the SNAP written from the files, dated today
"""
import io, json, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, 'test-runs.html')


def read(rel):
    return io.open(os.path.join(ROOT, rel), encoding='utf-8').read().replace('\r\n', '\n')


def blk(t, name):  # the page's blk(): a `name = { ... \n  };` block
    m = re.search(name + r'\s*=\s*\{([\s\S]*?)\n  \};', t)
    return m.group(1) if m else ''


def classes(t):  # deep16/js/classes.js: NPC.CLASSES, NPC.MAXLVL, NPC.RACES, NPC.NAMED (the page's pClasses)
    cls = re.findall(r'^ {4}(\w+): \{ prio:', blk(t, r'NPC\.CLASSES'), re.M)
    mx = {}
    mm = re.search(r'NPC\.MAXLVL\s*=\s*\{([^}]*)\}', t)
    if mm:
        for k, v in re.findall(r'(\w+):\s*(\d+)', mm.group(1)): mx[k] = int(v)
    races = re.findall(r"^ {4}(\w+): \{ name: '([^']+)'", blk(t, r'NPC\.RACES'), re.M)
    named = []
    for nid, rest in re.findall(r'^ {4}(\w+): \{(.*)$', blk(t, r'NPC\.NAMED'), re.M):
        g = lambda p: (re.search(p, rest) or [None, None])[1]
        c, ml = g(r"\bcls: '(\w+)'"), g(r'\bmaxLvl: (\d+)')
        named.append([nid, g(r"\bname: '([^']*)'") or nid[:1].upper() + nid[1:], c, int(g(r'\blvl: (\d+)') or 0), g(r"\brace: '(\w+)'") or 'human', int(ml) if ml else mx.get(c, 9)])
    return [[c, mx.get(c, 9)] for c in cls], [list(r) for r in races], named


def foes(t, rules):  # deep16/data/foes.js FOES, its block then the ones set after it; js/rules.js R.FAMILIARS as fam_<id> (the page's pFoes, pFamiliars)
    i = t.find('FOES = {')
    t = t[i:] if i >= 0 else ''
    e = t.find('\n};')
    body, tail = (t[:e], t[e:]) if e > 0 else (t, '')
    out, seen = [], set()

    def one(fid, line):
        n = re.search(r"""\bname: (?:'([^']*)'|"([^"]*)")""", line)
        c = re.search(r"\bcr: '([^']*)'", line)
        nm = (n.group(1) if n.group(1) is not None else n.group(2)) if n else fid
        out.append([fid, nm, c.group(1) if c else '', 1 if re.search(r'\bnamed: true\b', line) else 0]); seen.add(fid)
    for fid, own, nxt in re.findall(r'^ {2}(\w+): \{([^\n]*)\n([^\n]*)', body, re.M):
        own = re.sub(r'//.*$', '', own)
        one(fid, own if re.search(r'\bname: ', own) else nxt)
    for fid in re.findall(r'^ {2}(\w+): \{', body, re.M):
        if fid not in seen: one(fid, '')
    for fid, a, b in re.findall(r'^window\.D16\.FOES\.(\w+) = ([^\n]*)\n([^\n]*)', tail, re.M):
        if fid not in seen: one(fid, a + ' ' + b)
    for fid, nm in re.findall(r"^ {4}(\w+): \{ name: '([^']*)'", blk(rules, r'R\.FAMILIARS'), re.M):
        out.append(['fam_' + fid, 'Familiar: ' + nm, '0', 0])
    return out


def spells(js, meta_text):  # deep16/data/spells.js shapes, content/spells.json names and levels (the page's pSpells)
    meta = json.loads(meta_text)
    out = []
    for sid, shape in re.findall(r"^ {2}(\w+): \{[^\n]*?\bshape: '(\w+)'", js, re.M):
        if shape in ('none', 'reaction'): continue
        s = meta.get(sid)
        if not isinstance(s, dict): continue
        out.append([sid, s.get('name') or sid, s.get('level') or 0])
    out.sort(key=lambda a: (a[2], a[1]))
    return out


def features(t):  # deep16/data/features.js (the page's pFeatures)
    return [[f, n, c, int(l), s or ''] for f, n, c, l, _, s in re.findall(r'^ {2}(\w+): \{ name: "([^"]*)", cls: "(\w+)", lvl: (\d+), sub: (null|"([^"]*)")', t, re.M)]


def order(t):  # deep16/js/gallery.js CLASS_ORDER
    m = re.search(r'CLASS_ORDER\s*=\s*\[([^\]]*)\]', t)
    return re.findall(r"'(\w+)'", m.group(1)) if m else []


def fights(t):  # deep16/data/fights.js D.FIGHTS: what ?fight=<id> opens (the page's pFights, 11-26)
    out = []
    for fid, line in re.findall(r"^ {4}\{ id: '([\w-]+)'([^\n]*)", t, re.M):
        n = re.search(r"""\bname: (?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")""", line)
        lv = re.search(r'\blevel: (\d+)', line)
        nm = re.sub(r"""\\(['"])""", r'\1', n.group(1) if n.group(1) is not None else n.group(2)) if n else fid
        out.append([fid, nm, int(lv.group(1)) if lv else 0])
    return out


def snap():
    c, r, n = classes(read('deep16/js/classes.js'))
    day = datetime.datetime.now(datetime.timezone.utc).date().isoformat()  # (UTC, as the house dates things)
    return {'date': day, 'classes': c, 'races': r, 'named': n,
            'monsters': foes(read('deep16/data/foes.js'), read('js/rules.js')),
            'spells': spells(read('deep16/data/spells.js'), read('content/spells.json')),
            'features': features(read('deep16/data/features.js')),
            'order': order(read('deep16/js/gallery.js')),
            'fights': fights(read('deep16/data/fights.js'))}


def main(argv):
    page = io.open(PAGE, encoding='utf-8', newline='').read()
    m = re.search(r'^var SNAP=(\{.*\});[ \t]*\r?$', page, re.M)
    if not m: print('RED: no SNAP line in test-runs.html'); return 1
    old, new = json.loads(m.group(1)), snap()
    for k in new:
        if k == 'date': continue
        print('%-9s snapshot %4s   files %4s' % (k, len(old.get(k) or []), len(new[k])))
    print('the snapshot of', old.get('date'))
    empty = [k for k in ('classes', 'races', 'named', 'monsters', 'spells', 'features', 'order', 'fights') if not new.get(k)]
    if empty: print('RED: nothing read for', ', '.join(empty), '-- a file\'s format has moved; the SNAP left as it is'); return 1
    if argv[:1] == ['write']:
        line = 'var SNAP=' + json.dumps(new, ensure_ascii=False, separators=(',', ':')) + ';'
        page = page[:m.start()] + line + page[m.end(1) + 1:]
        io.open(PAGE, 'w', encoding='utf-8', newline='').write(page)
        print('ok: the SNAP written, dated', new['date'])
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

"""The flags registry's check (10-06, the 8-bit battle lane §2.8; review C15, rec 9 -- Griz, 10-06, on the shape: "3 dunno what that means - trusting
your lean"). DS.cond reads a flag it has never heard of as a false one, silently: a door whose cond names a misspelt flag never opens, and nothing
says so. content/flags.json names every flag the game sets or reads, one line each with where; tools/compile.py refuses a build that reads or sets
one it does not name (the way it refuses a spell record without its src), and warns on a name nothing uses any more.

What is scanned: every cond in content (maps, npcs, quests: `cond`, `if`, `show`, `done`) and every flag content sets (`set`, `flag`, `unset`); in
js/*.js and deep16/js/*.js, `flags.X` and `flags8.X` read or set, `flags['X'] =`, `delete ...flags.X`, the object-literal setters (`set(f, {...})`,
`set({...})`, `Object.assign(g.flags, {...})`), a situation's `flags: {...}` and `unset: [...]`, and the cond strings (`DS.cond('...')`, `cond: '...'`).
A flag set under a name made at run time ('lamp' + n, legFour's done flag, the wet's FLAG8, the eggs) is named in the registry by hand -- the scan
cannot see it set, but every place that READS it must still find it there. A name with a colon is a family (heard:<rumour>, trig:<trigger id>, ...)
and is checked by its prefix.

  python tools/flags.py            the check alone: unknown flags (errors) and unused registry lines (warnings)
  python tools/flags.py --init     write content/flags.json from what the tree uses now (once; then edit it by hand, a line a flag)
"""
import glob, json, os, re, sys

COND_KEYS = {'lead', 'hired', 'in', 'has', 'lit', 'lvl', 'renown', 'party', 'silver', 'kills'}
READ_KEYS = ('cond', 'if', 'show', 'done')
WRITE_KEYS = ('set', 'flag', 'unset')
CONTENT = ['npcs.json', 'quests.json', 'rumors.json', 'encounters.json', 'shops.json']
ASSIGN = r'(=(?!=)|\+\+|\+=|-=|--)'


def cond_flags(expr):
    out = []
    for alt in str(expr).split('|'):
        for raw in alt.split('&'):
            t = raw.strip().lstrip('!')
            if not t:
                continue
            m = re.match(r'^(\w+)(>=|<=|=|>|<|:)(.*)$', t)
            if not m:
                out.append(t)
            elif m.group(1) == 'flag':
                out.append(m.group(3).strip())
            elif m.group(1) not in COND_KEYS:
                out.append(m.group(1))
    return [f for f in out if re.match(r'^[\w:,.-]+$', f)]


def keys_of(obj_src):
    return re.findall(r"(?:^|,)\s*['\"]?([\w:-]+)['\"]?\s*:", obj_src)


def scan(root):
    reads, writes = {}, {}
    def add(d, name, where):
        d.setdefault(name, set()).add(where)
    def walk(o, where):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in READ_KEYS and isinstance(v, str):
                    for f in cond_flags(v):
                        add(reads, f, where)
                elif k in WRITE_KEYS and isinstance(v, (str, list)) and not (k == 'flag' and isinstance(v, str) and ' ' in v):
                    for f in ([v] if isinstance(v, str) else v):
                        if isinstance(f, str) and re.match(r'^[\w:-]+$', f):
                            add(writes, f, where)
                else:
                    walk(v, where)
        elif isinstance(o, list):
            for x in o:
                walk(x, where)
    for name in CONTENT:
        p = os.path.join(root, 'content', name)
        if os.path.exists(p):
            walk(json.load(open(p, encoding='utf-8')), 'content/' + name)
    for p in sorted(glob.glob(os.path.join(root, 'content', 'maps', '*.json'))):
        walk(json.load(open(p, encoding='utf-8')), 'maps/' + os.path.basename(p))
    for p in sorted(glob.glob(os.path.join(root, 'js', '*.js')) + glob.glob(os.path.join(root, 'deep16', 'js', '*.js'))):
        rel = os.path.relpath(p, root).replace('\\', '/')
        s = open(p, encoding='utf-8').read()
        for m in re.finditer(r'flags8?\.(\w+)\s*' + ASSIGN, s):
            add(writes, m.group(1), rel)
        for m in re.finditer(r"flags8?\[['\"]([\w:-]+)['\"]\]\s*" + ASSIGN, s):
            add(writes, m.group(1), rel)
        for m in re.finditer(r'delete\s+[\w.]*flags8?\.(\w+)', s):
            add(writes, m.group(1), rel)
        for m in re.finditer(r'flags8?\.(\w+)\b(?!\s*' + ASSIGN + ')', s):
            if not s[m.end():m.end() + 1] == '(':  # (flags.hasOwnProperty(...) and the like are not flags)
                add(reads, m.group(1), rel)
        for m in re.finditer(r"flags8?\[['\"]([\w:-]+)['\"]\](?!\s*" + ASSIGN + ')', s):
            add(reads, m.group(1), rel)
        for m in re.finditer(r'(?:\bset\(\s*(?:f\s*,\s*)?|Object\.assign\(\s*[\w.]*flags\s*,\s*|\bflags:\s*)\{([^{}]*)\}', s):
            for k in keys_of(m.group(1)):
                add(writes, k, rel)
        for m in re.finditer(r'\bunset:\s*\[([^\]]*)\]', s):
            for k in re.findall(r"['\"]([\w:-]+)['\"]", m.group(1)):
                add(writes, k, rel)
        for m in re.finditer(r"(?:DS\.cond\(\s*|\bcond:\s*)'([^']*)'", s):
            for f in cond_flags(m.group(1)):
                add(reads, f, rel + ' (cond)')
    return reads, writes


def family(name):
    return name.split(':')[0] + ':' if ':' in name else None


def load_registry(root):
    p = os.path.join(root, 'content', 'flags.json')
    if not os.path.exists(p):
        return None
    return json.load(open(p, encoding='utf-8'))


def check(root):
    """(errors, warnings) for compile.py: a flag read or set that the registry does not name is an error; a registry line nothing uses, a warning"""
    reg = load_registry(root)
    if reg is None:
        return ['content/flags.json is missing (python tools/flags.py --init writes it)'], []
    names, fams = set(reg.get('flags', {})), set(reg.get('families', {}))
    reads, writes = scan(root)
    errors, warnings = [], []
    for kind, d in (('read', reads), ('set', writes)):
        for f in sorted(d):
            if f in names or (family(f) and family(f) in fams):
                continue
            errors.append('flag %s (%s in %s) is not in content/flags.json -- a typo, or a new flag to name there' % (f, kind, ', '.join(sorted(d[f])[:3])))
    used = set(reads) | set(writes)
    for f in sorted(names - used):
        if str(reg['flags'][f]).startswith('set at run time'):
            continue  # (a name made at run time: the scan cannot see it, the story walk watches it)
        warnings.append('flags.json names %s, which nothing reads or sets any more' % f)
    # (a family is not warned on: most are keyed at run time, 'heard:' + id, where the scan cannot see them)
    return errors, warnings


RUNTIME_FAMILIES = { # (keyed at run time -- 'heard:' + id -- so the scan sees only the literal ones; named here once for --init)
    'heard:': 'a rumour heard (content/rumors.json ids; js/events.js EV.dialog, the rumour table)',
    'said:': 'a talk branch said once (said:<npc>:<branch>; js/events.js EV.dialog)',
    'trig:': 'a trigger that fires once, fired (trig:<trigger id>; js/world.js Field.arrive / use)',
    'chest:': 'a chest opened (chest:<map>:<x>,<y>; js/events.js)',
    'hex:': 'a Hex card or fight done (hex:<id>; js/events.js)',
    'rumorIdx:': 'how far down an NPC\'s rumours the party has heard (rumorIdx:<npc>; js/events.js)',
    'cocoon:': 'a cocoon in the nest cut down (cocoon:<x>,<y>; js/deep.js S.cocoon)',
}
RUNTIME_FLAGS = { # (set through a name in a variable -- var k = 'pyroIdx'; g.flags[k] -- found by the story walk's watch, dev/bench8.py story1006)
    'pyroIdx': 'set at run time: how far through the king\'s idle lines (js/deep.js S.pyro)',
    'ingrithIdx': 'set at run time: how far through Ingrith\'s idle lines (js/deep.js S.ingrith)',
    'dagnyIdx': 'set at run time: how far through Dagny\'s lines (js/deep.js S.dagny)',
}


def init(root):
    reads, writes = scan(root)
    fams, names = dict(RUNTIME_FAMILIES), dict(RUNTIME_FLAGS)
    for f in sorted((set(reads) | set(writes)) - set(RUNTIME_FLAGS)):
        fam = family(f)
        if fam:
            fams.setdefault(fam, 'e.g. ' + f)
            continue
        w, r = sorted(writes.get(f, [])), sorted(reads.get(f, []))
        names[f] = ('set: ' + ', '.join(w[:3]) if w else 'set at run time (a name the scan cannot see)') + ('; read: ' + ', '.join(r[:3]) if r else '')
    lines = ['{', '  "_note": "The flags registry (10-06, the 8-bit battle lane \\u00a72.8): every flag the game sets or reads, one line each. tools/compile.py refuses a flag not named here (tools/flags.py). A new flag: add its line. A family (a name with a colon) is checked by its prefix.",',
             '  "families": {']
    fl = sorted(fams.items())
    for i, (k, v) in enumerate(fl):
        lines.append('    %s: %s%s' % (json.dumps(k), json.dumps(v), ',' if i < len(fl) - 1 else ''))
    lines += ['  },', '  "flags": {']
    nl = sorted(names.items(), key=lambda kv: kv[0].lower())
    for i, (k, v) in enumerate(nl):
        lines.append('    %s: %s%s' % (json.dumps(k), json.dumps(v, ensure_ascii=False), ',' if i < len(nl) - 1 else ''))
    lines += ['  }', '}', '']
    p = os.path.join(root, 'content', 'flags.json')
    open(p, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
    print('wrote %s: %d flags, %d families' % (p, len(names), len(fams)))


if __name__ == '__main__':
    ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if '--init' in sys.argv:
        init(ROOT)
    e, w = check(ROOT)
    for x in w:
        print('warn:', x)
    for x in e:
        print('ERROR:', x)
    print('%d errors, %d warnings' % (len(e), len(w)))
    sys.exit(1 if e else 0)

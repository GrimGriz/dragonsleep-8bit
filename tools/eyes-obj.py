"""THE EYES ROWS' ONE-LINE OBJECTIVE (11-15, the card-text seat, started by the lanes desk). His words, 2026-11-15 night: "review the situations
page/syvia's deck. Particularly the text. Where you can, draft a version where what they want eyes on is a quest objective. ..."; then, of the
readers' list, "so in your pane, that big #2 list is text that makes the sylvia card approach more accessible?"; then "that'll help so much, start
a seat for the card text".

Every live row in js/eyes.js carries `obj`: one line, about twenty words at most, player-facing, no file names -- what to do and where, then what
to judge -- and Sylvia's card (js/tour.js) and situations.html lead with it, the seat's `look` folded under "the builders' note".

THE MAP is ..\\the-lab\\eyes-to-quests-2026-11-15\\obj-lines.json (outside the repo, beside the six readers' drafts it was written from): { rows:
{ <id>: { obj, from } } }. This script writes the map's line into each row BY ID -- a row's obj inserted on its own line after the row's first, or
replaced where it is -- and never by matching text. Re-run it after a rebase: a new row with no line in the map is LISTED (exit 3) for its seat to
write one (in the map, or in the row itself: `harvest` takes rows' own obj lines back into the map).

  python tools/eyes-obj.py dump <out.json>     every live row as JSON (id, pri, group, title, pt, url, look, obj) for a writer
  python tools/eyes-obj.py apply [--map M]     the map's lines into js/eyes.js; lists rows with no line
  python tools/eyes-obj.py harvest [--map M]   rows' own obj lines that the map lacks, into the map
  python tools/eyes-obj.py check               every row has an obj within the cap (dev/eyes-probe.py runs the same check)
"""
import os, re, sys, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
EYES = os.path.join(ROOT, 'js', 'eyes.js')
CAP_WORDS, CAP_CHARS = 24, 170 # (his brief: "about 20 words at most"; the cap leaves "about" its room and no more)
FILEISH = re.compile(r'\b[\w-]+\.(?:js|py|html|json|png|md|txt)\b|[?&][a-z0-9]+=|\b(?:mode=|bench\d|DS\.|D16\.)')

def default_map():
    # the lab sits beside the main checkout: the git common dir's parent's parent, from any worktree
    try:
        common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--path-format=absolute', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
        base = os.path.dirname(os.path.dirname(common)) if common else os.path.dirname(ROOT)
    except Exception:
        base = os.path.dirname(ROOT)
    return os.path.join(base, 'the-lab', 'eyes-to-quests-2026-11-15', 'obj-lines.json')

def jstr(src, i):
    """the JS string literal opening at src[i] ('...' or "..."): (its value, the index after it)"""
    q = src[i]; j = i + 1; out = []
    while True:
        c = src[j]
        if c == '\\':
            n = src[j + 1]
            out.append({'n': '\n', 't': '\t', 'r': '\r'}.get(n, n)); j += 2; continue
        if c == q: return ''.join(out), j + 1
        if c == '\n': raise ValueError('newline inside a string at %d' % j)
        out.append(c); j += 1

def jsq(s):
    """a value as a single-quoted JS string, the file's own way (apostrophes escaped)"""
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ') + "'"

def skip_ws(src, i):
    while True:
        while i < len(src) and src[i] in ' \t\r\n': i += 1
        if src.startswith('//', i): i = src.index('\n', i)
        elif src.startswith('/*', i): i = src.index('*/', i) + 2
        else: return i

def value_end(src, i):
    """skip one JS value from src[i]: a string, a number, a name, an array or an object. returns (value or None, end)"""
    c = src[i]
    if c in '\'"': return jstr(src, i)
    if c in '[{':
        close = {'[': ']', '{': '}'}[c]; j = i + 1; depth = 1
        while depth:
            j = skip_ws(src, j); c2 = src[j]
            if c2 in '\'"': _, j = jstr(src, j); continue
            if c2 in '[{': depth += 1
            elif c2 in ']}': depth -= 1
            j += 1
        return None, j
    m = re.compile(r'[-\w.$]+').match(src, i)
    if not m: raise ValueError('no value at %d: %r' % (i, src[i:i + 30]))
    v = m.group(0)
    try: v = float(v) if '.' in v else int(v)
    except ValueError: pass
    return v, m.end()

def rows(src):
    """every live row: { id, at (the head's start), open (index after its '{'), close (index of its '}'), f: {field: value}, span: {field: (start, end)} }"""
    out = []
    for m in re.finditer(r"^ {4}'([a-z0-9-]+)': \{", src, re.M):
        r = {'id': m.group(1), 'at': m.start(), 'open': m.end(), 'f': {}, 'span': {}}
        i = m.end()
        while True:
            i = skip_ws(src, i)
            if src[i] == '}': r['close'] = i; break
            km = re.compile(r'([A-Za-z_$][\w$]*)\s*:\s*').match(src, i)
            if not km: raise ValueError('row %s: no field at %r' % (r['id'], src[i:i + 40]))
            k = km.group(1); vs = km.end()
            v, i = value_end(src, vs)
            r['f'][k] = v; r['span'][k] = (km.start(), i)
            i = skip_ws(src, i)
            if src[i] == ',': i += 1
        out.append(r)
    return out

def words(s): return len(s.split())

def problems(rs):
    """the check: every row an obj, within the cap, nothing of a file in it"""
    bad = []
    for r in rs:
        o = r['f'].get('obj')
        if not isinstance(o, str) or not o.strip(): bad.append('%s: no obj' % r['id']); continue
        if words(o) > CAP_WORDS or len(o) > CAP_CHARS: bad.append('%s: obj is %d words, %d chars (cap %d, %d)' % (r['id'], words(o), len(o), CAP_WORDS, CAP_CHARS))
        if FILEISH.search(o): bad.append('%s: obj names a file or a switch (%s)' % (r['id'], FILEISH.search(o).group(0)))
    return bad

def load_map(p):
    if not os.path.exists(p): return {'rows': {}}
    return json.load(open(p, encoding='utf-8'))

def save_map(p, M):
    M['rows'] = dict(sorted(M['rows'].items()))
    with open(p, 'w', encoding='utf-8', newline='\n') as fh: json.dump(M, fh, ensure_ascii=False, indent=1); fh.write('\n')

def apply(src, lines):
    """the map's lines into the rows, last row first so the indices hold"""
    rs = rows(src); changed = 0
    for r in reversed(rs):
        o = lines.get(r['id'])
        if not o: continue
        if 'obj' in r['span']:
            a, b = r['span']['obj']
            new = 'obj: ' + jsq(o)
            if src[a:b] != new: src = src[:a] + new + src[b:]; changed += 1
        else:
            nl = src.find('\n', r['open'], r['close'])
            if nl < 0 or src[:nl].rstrip()[-1:] != ',': # (a row all on one line, or a line that does not end a field: obj goes first)
                src = src[:r['open']] + ' obj: ' + jsq(o) + ',' + src[r['open']:]
            else:
                src = src[:nl] + '\n      obj: ' + jsq(o) + ',' + src[nl:]
            changed += 1
    return src, changed

def main(a):
    cmd = a[0] if a else 'check'
    mp = a[a.index('--map') + 1] if '--map' in a else default_map()
    src = open(EYES, encoding='utf-8').read()
    rs = rows(src)
    if cmd == 'dump':
        out = [dict(id=r['id'], **{k: r['f'].get(k) for k in ('pri', 'group', 'title', 'pt', 'url', 'look', 'obj')}) for r in rs]
        json.dump(out, open(a[1], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('dumped %d rows to %s' % (len(out), a[1])); return 0
    if cmd == 'apply':
        M = load_map(mp); lines = {k: v['obj'] for k, v in M['rows'].items() if v.get('obj')}
        src2, changed = apply(src, lines)
        if src2 != src:
            with open(EYES, 'w', encoding='utf-8', newline='') as fh: fh.write(src2)
        rs2 = rows(src2)
        assert [r['id'] for r in rs2] == [r['id'] for r in rs], 'the rows moved'
        for r in rs2: assert r['f'].get('obj', lines.get(r['id'])) == lines.get(r['id'], r['f'].get('obj')), r['id']
        none = [r['id'] for r in rs2 if not r['f'].get('obj')]
        gone = sorted(set(lines) - set(r['id'] for r in rs2))
        print('apply: %d rows, %d written or changed, %d with no line in the map%s; %d map lines for rows cut since (kept for the record)' % (len(rs2), changed, len(none), (': ' + ' '.join(none)) if none else '', len(gone)))
        bad = problems(rs2)
        for b in bad: print('  ' + b)
        return 3 if none or bad else 0
    if cmd == 'harvest':
        M = load_map(mp); n = 0
        for r in rs:
            o = r['f'].get('obj')
            if o and M['rows'].get(r['id'], {}).get('obj') != o: M['rows'][r['id']] = {'obj': o, 'from': 'harvested from js/eyes.js'}; n += 1
        save_map(mp, M); print('harvest: %d lines into %s' % (n, mp)); return 0
    if cmd == 'check':
        bad = problems(rs)
        for b in bad: print('FAIL ' + b)
        print('EYESOBJ %d rows, %s' % (len(rs), 'all ok' if not bad else '%d FAILED' % len(bad)))
        return 1 if bad else 0
    print(__doc__); return 2

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

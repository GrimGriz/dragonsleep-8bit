"""The fold ledger over invented.json (RULED 2026-10-09, Griz: "1 go" -- the fold instrument; THE TWO CANONS 09-26b).
Every entry carries a `fold` word, written by the seat that invents it:
  place person creature thing lore event   -> owed to the wiki (the fold lane): place/person/creature/thing/lore as PROPOSED
                                              lines on the page they belong to; event as a line under that page's `## Horizon`
                                              (the game's playing-out is fated in the game and the DEFAULT horizon for the table --
                                              RULED 10-09)
  rule look game                           -> never folded (the engine's readings of the SRD, the art, the game's own machinery)
A folded entry carries `folded`: "<date> <wiki page>". Patch a line, never re-dump the file (invented_add.py's law).
Usage:
  python tools/fold.py owed              # what the wiki is owed, grouped by fold word
  python tools/fold.py untagged          # entries with no fold word (a seat forgot)
  python tools/fold.py set <patch.json>  # {"<id>": {"fold": "...", "folded": "..."}} -- sets fields on existing lines
"""
import io, json, re, sys

P = 'invented.json'
REALM = ('place', 'person', 'creature', 'thing', 'lore', 'event')
WORDS = REALM + ('rule', 'look', 'game')
LINE = re.compile(r'^(\s*)(\{\s*"id":.*\})(,?)\s*$')


def read():
    src = io.open(P, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in src else '\n'
    return src.split(nl), nl


def entries(lines):
    out = []
    for i, ln in enumerate(lines):
        m = LINE.match(ln)
        if m:
            out.append((i, m, json.loads(m.group(2))))
    return out


def owed():
    lines, _ = read()
    by = {}
    for _, _, rec in entries(lines):
        f = rec.get('fold')
        if f in REALM and not rec.get('folded'):
            by.setdefault(f, []).append(rec)
    n = 0
    for f in REALM:
        if f in by:
            print('## %s (%d)' % (f, len(by[f])))
            for rec in by[f]:
                print('- %s: %s' % (rec['id'], rec['what'][:110].replace('\n', ' ')))
            n += len(by[f])
    print('owed: %d' % n)


def untagged():
    lines, _ = read()
    bad = [rec['id'] for _, _, rec in entries(lines) if rec.get('fold') not in WORDS]
    print('untagged: %d' % len(bad))
    for b in bad:
        print('- ' + b)


def set_fields(patch_path):
    patch = json.load(io.open(patch_path, encoding='utf-8'))
    lines, nl = read()
    done = 0
    for i, m, rec in entries(lines):
        p = patch.get(rec['id'])
        if not p:
            continue
        for k, v in p.items():
            if k == 'fold' and v not in WORDS:
                raise SystemExit('not a fold word: %s on %s' % (v, rec['id']))
            rec[k] = v
        lines[i] = m.group(1) + json.dumps(rec, ensure_ascii=False) + m.group(3)
        done += 1
    missing = [k for k in patch if k not in {rec['id'] for _, _, rec in entries(lines)}]
    if missing:
        raise SystemExit('no such id: ' + ', '.join(missing))
    io.open(P, 'w', encoding='utf-8', newline='').write(nl.join(lines))
    json.load(io.open(P, encoding='utf-8'))  # still JSON
    print('invented.json: %d lines set' % done)


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a or a[0] == 'owed':
        owed()
    elif a[0] == 'untagged':
        untagged()
    elif a[0] == 'set':
        set_fields(a[1])
    else:
        raise SystemExit(__doc__)

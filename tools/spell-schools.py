"""Every spell's school in the data (10-31, the leveling lane §8 item 11 -- wanted by Schoolbound and the wizard's school traditions; the leveling seat on the desk's
relay of Griz's "It should be able to do another couple things. Have it continue."). The SRD 5.1's own text names each spell's school -- srd/spells/level-N.md,
the line under its heading ("*1st-level evocation*", "*Evocation cantrip*") -- and the heading names the game's record ("(in the game: `burninghands`)"), else
the record is matched by its name. Our own spells take a school only by his word (OURS below); the rest of ours stay without one till he rules.

  python tools/spell-schools.py          write `"school": "<school>"` into each record of content/spells.json (one line each: after its "level"), then run
                                         tools/compile.py
  python tools/spell-schools.py check    nothing written: exit 1 when a record's school is missing or is not the SRD's (the gate's mode=schools1031 reads the
                                         compiled data the same way)

A record of ours with no school is listed, not refused."""
import glob, io, json, re, sys

SCHOOLS = ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation']
# ours, by his word: Searing Scourge and Deathhand's are evocations (10-14, Griz: "works with sculpt"); the five more by the seat's leans, each its model's school
# (10-31, Griz: "you make good leans on what school is what"): Called to Account as Compelled Duel, Gnawing Word as Hex, Glass Whisper a psychic word heard,
# Rootdrag as Thorn Whip, Mirror's Gaze as Hunter's Mark
OURS = {'searingscourge': 'evocation', 'deathhandsscourge': 'evocation', 'calledtoaccount': 'enchantment', 'gnawingword': 'enchantment', 'glasswhisper': 'enchantment',
        'rootdrag': 'transmutation', 'mirrorsgaze': 'divination'}
# the SRD's own that srd/spells/ lacks an entry for (10-31: Hunter's Mark is on the ranger's 1st-level list, srd/10-spell-lists.md -- a divination)
SRD_MISSED = {'huntersmark': 'divination'}
P = 'content/spells.json'


def srd():
    by_id, by_name = {}, {}
    for f in sorted(glob.glob('srd/spells/level-*.md')):
        txt = io.open(f, encoding='utf-8').read()
        for m in re.finditer(r'^## (.+?)\s*$\s*^\*([^*]+)\*\s*$', txt, re.M):
            head, line = m.group(1), m.group(2).lower()
            sc = [s for s in SCHOOLS if s in line]
            if len(sc) != 1:
                continue
            name = re.sub(r'\s*\(in the game:.*\)$', '', head).strip()
            by_name[name.lower()] = sc[0]
            for gid in re.findall(r'`([^`]+)`', head):
                by_id[gid] = sc[0]
    return by_id, by_name


def want():
    by_id, by_name = srd()
    recs = json.load(io.open(P, encoding='utf-8'))
    out, none = {}, []
    for k, r in recs.items():
        if k.startswith('_'):
            continue
        s = OURS.get(k) or by_id.get(k) or by_name.get(str(r.get('name', '')).lower()) or SRD_MISSED.get(k)
        if s:
            out[k] = s
        else:
            none.append(k)
    return recs, out, none


def main(argv):
    recs, out, none = want()
    if argv[1:2] == ['check']:
        bad = [k for k, s in out.items() if recs[k].get('school') != s]
        stray = [k for k in none if recs[k].get('school')]
        print('schools: %d of %d records the SRD\'s or his; without one (ours, not ruled): %s' % (len(out) - len(bad), len(out), ', '.join(sorted(none)) or 'none'))
        if bad or stray:
            print('RED: wrong or missing: ' + ', '.join(sorted(bad + stray)))
            return 1
        print('ok')
        return 0
    src = io.open(P, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in src else '\n'
    lines, n = src.split(nl), 0
    for i, ln in enumerate(lines):
        m = re.match(r'^  "([a-zA-Z]+)": \{', ln)
        if not m or m.group(1) not in out:
            continue
        ln = re.sub(r'"school": "[a-z]+", ', '', ln)
        ln2, k = re.subn(r'("level": \d+, )', r'\1"school": "%s", ' % out[m.group(1)], ln, count=1)
        assert k == 1, m.group(1)
        if ln2 != lines[i]:
            n += 1
        lines[i] = ln2
    io.open(P, 'w', encoding='utf-8', newline='').write(nl.join(lines))
    print('content/spells.json: %d records given a school (%d in all); without one (ours, not ruled): %s' % (n, len(out), ', '.join(sorted(none))))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))

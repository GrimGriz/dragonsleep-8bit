"""The SRD's class spell lists as data: deep16/data/spell-lists.js (window.D16.SPELL_LISTS).

11-14, Griz: "Made characters can be imports where they choose their spells, by level when they're done setting the level" -- a made
character's pick pages offer what its class may know or prepare by the SRD 5.1, not only the class's own built list (js/classes.js
NPC.registerList reads this; a spell that is not built on the grid is left out there, not here).

Source: srd/10-spell-lists.md (the class lists, pages 105-113: names run together, a level a "Nth Level" marker) and srd/spells/level-N.md
(every spell's heading, with "(in the game: `id`)" where the game has it). A list is read greedily by the longest spell name at each
place, so "Mass Cure Wounds" is never "Cure Wounds".

  python tools/spell-lists.py          write the file
  python tools/spell-lists.py check    exit 1 if the file on disk is not what the sources give
"""
import io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'deep16', 'data', 'spell-lists.js')
CLASSES = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard']
ORD = {'1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6, '7th': 7, '8th': 8, '9th': 9}


def norm(s):
    return re.sub(r'[^a-z0-9/ ]', '', s.lower().replace('’', "'").replace("'", '')).strip()


def names():
    """every SRD spell: normalised name -> (level, id in the game or None)"""
    out = {}
    for lv in range(10):
        text = io.open(os.path.join(ROOT, 'srd', 'spells', 'level-%d.md' % lv), encoding='utf-8').read()
        for m in re.finditer(r'^## (.+?)(?: \(in the game: `([^`]+)`\))?\s*$', text, re.M):
            out[norm(m.group(1))] = (lv, m.group(2))
    return out


def lists(known):
    text = io.open(os.path.join(ROOT, 'srd', '10-spell-lists.md'), encoding='utf-8').read()
    byLen = sorted(known, key=len, reverse=True)
    out, missed = {}, []
    for cls in CLASSES:
        m = re.search(r'^## %s Spells\s*$(.*?)(?=^## \w+ Spells\s*$|^## Wish|\Z)' % cls.capitalize(), text, re.M | re.S)
        body = ' '.join(l for l in m.group(1).splitlines() if l.strip() and not l.startswith('#'))
        parts = re.split(r'\b(1st|2nd|3rd|4th|5th|6th|7th|8th|9th) Level\b', body)
        segs = [(0, parts[0])] if parts[0].strip() else []
        for i in range(1, len(parts), 2):
            segs.append((ORD[parts[i]], parts[i + 1]))
        per = {}
        for lv, seg in segs:
            s, ids = norm(seg), []
            s = re.sub(r' +', ' ', s)
            while s:
                hit = next((n for n in byLen if s == n or s.startswith(n + ' ')), None)
                if not hit:
                    word, _, s = s.partition(' ')
                    missed.append('%s %d: %s' % (cls, lv, word))
                    continue
                s = s[len(hit):].lstrip()
                klv, gid = known[hit]
                if klv != lv:
                    missed.append('%s %d: %s is level %d in srd/spells' % (cls, lv, hit, klv))
                if gid:
                    ids.append(gid)
            if ids:
                per[lv] = ids
        out[cls] = per
    return out, missed


def render(data):
    head = ("/* The SRD 5.1's class spell lists, the spells the game has (written by tools/spell-lists.py from srd/10-spell-lists.md and\n"
            "   srd/spells/level-N.md -- never by hand). 11-14, Griz: \"Made characters can be imports where they choose their spells, by level\n"
            "   when they're done setting the level\": a made character's pick pages read these (js/classes.js NPC.registerList). */\n")
    rows = []
    for cls in CLASSES:
        lv = ', '.join('%d: %s' % (k, json.dumps(v)) for k, v in sorted(data[cls].items()))
        rows.append('  %s: { %s }' % (cls, lv))
    return head + 'window.D16 = window.D16 || {};\nwindow.D16.SPELL_LISTS = {\n' + ',\n'.join(rows) + '\n};\n'


def main(argv):
    data, missed = lists(names())
    for m in missed:
        print('spell-lists: not read -- ' + m)
    text = render(data)
    if argv[:1] == ['check']:
        have = io.open(OUT, encoding='utf-8', newline='').read().replace('\r\n', '\n') if os.path.exists(OUT) else ''
        if have != text or missed:
            print('spell-lists: deep16/data/spell-lists.js is not what the SRD files give: run python tools/spell-lists.py')
            return 1
        print('spell-lists: ok, ' + ', '.join('%s %d' % (c, sum(len(v) for v in data[c].values())) for c in CLASSES))
        return 0
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(text)
    print('spell-lists: ' + ', '.join('%s %d' % (c, sum(len(v) for v in data[c].values())) for c in CLASSES))
    return 1 if missed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

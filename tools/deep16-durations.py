"""DEEP16: every SRD 5.1 spell's duration in rounds, for the grid (09-28h, Griz: "spell durations are theoretically important").

    python tools/deep16-durations.py

Reads the SRD cache the spell register was built from (dev/srd-spells/srd-spells-detail.json, gitignored; dev/srd-spells/fetch_all.py
fills it from the SRD API) and writes deep16/data/durations.js: D.DURATION[key] = { r: rounds, c: concentration }, the key the
spell's name lowered with its hyphens and spaces gone (mageArmor -> magearmor), so js/magic.js finds it from the grid's own id.
A round is six seconds: 1 minute = 10, 10 minutes = 100, an hour = 600. Instantaneous, Until dispelled and Special are left out.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'dev', 'srd-spells', 'srd-spells-detail.json')
OUT = os.path.join(ROOT, 'deep16', 'data', 'durations.js')
UNIT = {'round': 1, 'minute': 10, 'hour': 600, 'day': 14400}


def rounds(s):
    m = re.search(r'(\d+)\s+(round|minute|hour|day)s?', s or '', re.I)
    return int(m.group(1)) * UNIT[m.group(2).lower()] if m else None


def main():
    d = json.load(open(SRC, encoding='utf-8'))
    out = {}
    for idx, sp in d.items():
        r = rounds(sp.get('duration'))
        if r is None:
            continue
        out[re.sub(r'[^a-z0-9]', '', idx.lower())] = {'r': r, 'c': 1 if sp.get('concentration') else 0}
    body = ',\n'.join('  %s: { r: %d, c: %d }' % (k, v['r'], v['c']) for k, v in sorted(out.items()))
    js = ("/* DEEP16 -- every SRD 5.1 spell's duration in rounds (made by tools/deep16-durations.py from the SRD cache; 09-28h, Griz: \"spell\n"
          "   durations are theoretically important\"). r: rounds (1 minute = 10), c: 1 if it wants concentration. js/magic.js ends a spell\n"
          "   when its time is up. */\n'use strict';\n(window.D16 = window.D16 || {}).DURATION = {\n" + body + '\n};\n')
    open(OUT, 'w', encoding='utf-8', newline='\n').write(js)
    print('durations: %d spells -> %s' % (len(out), os.path.relpath(OUT, ROOT)))


if __name__ == '__main__':
    main()

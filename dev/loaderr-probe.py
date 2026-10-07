"""The 8-bit bench reports a script that failed to load even when the page still writes its result (10-07, the todo §6, the house: "dev/bench8.py hides a script
that failed to load when the page still writes its result" -- found 10-06 by the 8-bit battle seat, a js/embed.js that would not parse and every bench ran on).
dev/bench8.js's test loaderr1007 inserts a script that throws as it loads, then writes its result; bench8.run must hand the throw back (r['loaderr']).
Run from PowerShell. Prints ok or FAIL, exits 0 or 1 (the full gate runs it: dev/check.py ALL_SCRIPTS).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bench8

r = bench8.run({'test': 'loaderr1007'})
got = [e for e in r.get('loaderr', []) if 'loaderr1007' in e]
ok = 'error' not in r and bool(got) and any(c.startswith('ok') for c in r.get('checks', []))
# (no message printed: the throw's own words carry "Error:", which dev/check.py reads as RED)
print(('ok   ' if ok else 'FAIL ') + 'a script that throws on load is handed back though the page wrote its result (%d load error(s) read%s)' % (len(got), '' if 'error' not in r else '; the page wrote nothing'))
sys.exit(0 if ok else 1)

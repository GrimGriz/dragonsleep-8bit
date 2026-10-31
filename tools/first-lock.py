"""THE FIRST GAME's lock (10-31, Griz: "See if you can pull off the freeze/separation, first game is good enough and sitting standby for polish
pass when 16bit is finished"). The 8-bit runs from first/ (first/README.md): its page index.html at the root, its scripts first/js, its data
first/data/data.js compiled from its own content copy first/content. first/MANIFEST.json holds every one of those files' hash (CRLF read as
LF, so a Windows and a Linux checkout agree); a file changed, added or gone without a fix line is RED in the quick gate.

  python tools/first-lock.py check           ok, or a FAIL a file (the quick gate runs it: dev/check.py)
  python tools/first-lock.py fix "<why>"     a first-game fix kept: compile --first (first/data/data.js and the root page's stamps), then the
                                             manifest rewritten and one dated line in first/FIXES.md -- the why in his words where he gave them
"""
import datetime, hashlib, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIRST = os.path.join(ROOT, 'first')
MANIFEST = os.path.join(FIRST, 'MANIFEST.json')
FIXES = os.path.join(FIRST, 'FIXES.md')
OPEN = {'first/MANIFEST.json', 'first/FIXES.md', 'first/README.md'} # (the lock's own records and the folder's door: not the game)


def tracked():
    out = {'index.html': os.path.join(ROOT, 'index.html')}
    for d, _, fs in os.walk(FIRST):
        for f in fs:
            p = os.path.join(d, f)
            rel = os.path.relpath(p, ROOT).replace('\\', '/')
            if rel not in OPEN:
                out[rel] = p
    return out


def hashes():
    return {rel: hashlib.sha1(open(p, 'rb').read().replace(b'\r\n', b'\n')).hexdigest()[:16] for rel, p in sorted(tracked().items())}


def diff(old, new):
    return ([('changed', f) for f in sorted(old) if f in new and old[f] != new[f]] + [('new', f) for f in sorted(new) if f not in old]
            + [('gone', f) for f in sorted(old) if f not in new])


def write(files):
    rec = {'_readme': 'THE FIRST GAME, frozen 2026-10-31: every file the 8-bit page runs from, its hash with CRLF read as LF. tools/first-lock.py checks it '
                      '(the quick gate) and rewrites it on a fix; first/README.md says how a first-game fix is made.', 'files': files}
    with open(MANIFEST, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(json.dumps(rec, indent=1, sort_keys=True) + '\n')


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'check'
    if cmd == 'check':
        if not os.path.exists(MANIFEST):
            print('FAIL first/MANIFEST.json is missing (python tools/first-lock.py init writes it once)'); return 1
        old = json.load(open(MANIFEST, encoding='utf-8'))['files']
        d = diff(old, hashes())
        for kind, f in d:
            print('FAIL %s %s since the lock -- the first game is frozen: a first-game fix is `python tools/first-lock.py fix "<why>"` (first/README.md); '
                  'a second-game change belongs in js/, data/ or content/, not here' % (f, kind))
        if not d:
            print('ok   the first game is as locked: %d files (first/MANIFEST.json)' % len(old))
        return 1 if d else 0
    if cmd == 'init':
        if os.path.exists(MANIFEST):
            print('FAIL first/MANIFEST.json is there already: a change is `fix "<why>"`'); return 1
        files = hashes(); write(files)
        print('ok   locked %d files' % len(files)); return 0
    if cmd == 'fix':
        why = ' '.join(sys.argv[2:]).strip()
        if not why:
            print('FAIL fix wants a why: python tools/first-lock.py fix "<what was fixed, his words where he gave them>"'); return 1
        r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'compile.py'), '--first'], capture_output=True, text=True)
        print(r.stdout.strip().splitlines()[-1] if r.stdout.strip() else '')
        if r.returncode != 0 or 'ok:' not in r.stdout:
            print(r.stdout + r.stderr); print('FAIL compile.py --first refused: nothing locked'); return 1
        old = json.load(open(MANIFEST, encoding='utf-8'))['files']
        new = hashes(); d = diff(old, new)
        if not d:
            print('ok   nothing changed under the lock: no fix line written'); return 0
        write(new)
        line = '- %s · %s · %s\n' % (datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ'),
                                     ', '.join('%s (%s)' % (f, kind) for kind, f in d), why)
        with open(FIXES, 'a', encoding='utf-8', newline='\n') as fh:
            fh.write(line)
        print('ok   locked again: ' + line.strip()); return 0
    print(__doc__); return 1


if __name__ == '__main__':
    sys.exit(main())

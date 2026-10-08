"""The pages' own text, before any browser: a merge's leftovers and a script loaded twice (10-08).

898b215 left a lone '=======' line in deep16/index.html and js/ui.js listed twice; the page drew the marker as text and ran ui.js twice,
and every gate stayed GREEN through eight pushes (found by the GreyFang window, fixed in e223c5b). This reads both pages and every
script they load (js/ and deep16/js/): a conflict marker line (<<<<<<<, =======, >>>>>>>) is a FAIL, and in a page a script named twice
(its ?v= stamp aside) or one that is not on disk. Run alone: python dev/pages-probe.py -- it prints ok or FAIL lines and exits 1 on a FAIL.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ['index.html', 'deep16/index.html']
MARK = re.compile(r'^(<{7}|={7}|>{7})(\s|$)')


def main():
    bad = []
    for page in PAGES:
        path = os.path.join(ROOT, page)
        text = open(path, encoding='utf-8').read()
        for n, line in enumerate(text.splitlines(), 1):
            if MARK.match(line):
                bad.append('%s:%d a merge marker line: %r' % (page, n, line[:40]))
        srcs = [s.split('?')[0] for s in re.findall(r'<script src="([^"]+)"', text)]
        seen = set()
        for s in srcs:
            if s in seen:
                bad.append('%s: %s loaded twice' % (page, s))
            seen.add(s)
            if not re.match(r'^(https?:)?//', s) and not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(path), s))):
                bad.append('%s: %s is not on disk' % (page, s))
        print('ok   %s: %d scripts, no marker line, none twice' % (page, len(srcs)) if not any(b.startswith(page) for b in bad) else 'FAIL %s' % page)
    for d in ['js', 'deep16/js']:
        for fn in sorted(os.listdir(os.path.join(ROOT, d))):
            if not fn.endswith('.js'):
                continue
            for n, line in enumerate(open(os.path.join(ROOT, d, fn), encoding='utf-8', errors='replace').read().splitlines(), 1):
                if MARK.match(line):
                    bad.append('%s/%s:%d a merge marker line' % (d, fn, n))
    for b in bad:
        print('FAIL ' + b)
    if not bad:
        print('ok   no merge marker in js/ or deep16/js/')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()

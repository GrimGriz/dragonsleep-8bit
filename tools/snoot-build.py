"""The Snoot mode's stamps (10-14, the Snoot mode seat): every script snoot-mode/index.html loads from its own js/ gets ?v=<its bytes' hash>,
so a browser that has the page cached fetches a script again the day it changes -- the house's rule for DEEP16 (tools/deep16-build.py) on
the mode's own files. CRLF reads as LF, so a checkout on another machine stamps the same. Writes a page only when a stamp moved.
The scripts it reads from DEEP16 (../deep16/data/sprites.js) are not stamped here: they are DEEP16's, and move with DEEP16's build.
Since 10-15 it stamps the tutorial too (snoot-tutorial.html at the root, a page for Griz's understanding: it loads snoot-mode/js/*.js).
dev/snoot-probe.py fails while a stamp is stale.   python tools/snoot-build.py"""
import os, re, sys, hashlib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, 'snoot-mode', 'index.html')
PAGES = [(PAGE, 'js/', os.path.join(ROOT, 'snoot-mode')), (os.path.join(ROOT, 'snoot-tutorial.html'), 'snoot-mode/js/', ROOT)]

def stamp(path):
    return hashlib.sha1(open(path, 'rb').read().replace(b'\r\n', b'\n')).hexdigest()[:10]

def stamped(html, prefix='js/', base=None):
    base = base or os.path.join(ROOT, 'snoot-mode')
    def one(m):
        src = m.group(2); p = os.path.join(base, src.replace('/', os.sep))
        return m.group(1) + src + '?v=' + stamp(p) + m.group(3) if os.path.exists(p) else m.group(0)
    return re.sub(r'(<script src=")(' + re.escape(prefix) + r'[\w.-]+\.js)(?:\?v=[0-9a-f]+)?(")', one, html)

def main():
    for page, prefix, base in PAGES:
        if not os.path.exists(page): continue
        html = open(page, encoding='utf-8', newline='').read()
        out = stamped(html, prefix, base)
        name = os.path.relpath(page, ROOT).replace(os.sep, '/')
        if out != html:
            open(page, 'w', encoding='utf-8', newline='').write(out); print('ok: ' + name + ' stamped')
        else: print('ok: ' + name + "'s stamps were current")
    return 0

if __name__ == '__main__':
    sys.exit(main())

"""The Snoot mode's stamps (10-14, the Snoot mode seat): every script snoot-mode/index.html loads from its own js/ gets ?v=<its bytes' hash>,
so a browser that has the page cached fetches a script again the day it changes -- the house's rule for DEEP16 (tools/deep16-build.py) on
the mode's own files. CRLF reads as LF, so a checkout on another machine stamps the same. Writes index.html only when a stamp moved.
The scripts it reads from DEEP16 (../deep16/data/sprites.js) are not stamped here: they are DEEP16's, and move with DEEP16's build.
dev/snoot-probe.py fails while a stamp is stale.   python tools/snoot-build.py"""
import os, re, sys, hashlib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, 'snoot-mode', 'index.html')

def stamp(path):
    return hashlib.sha1(open(path, 'rb').read().replace(b'\r\n', b'\n')).hexdigest()[:10]

def stamped(html):
    def one(m):
        src = m.group(2); p = os.path.join(ROOT, 'snoot-mode', src.replace('/', os.sep))
        return m.group(1) + src + '?v=' + stamp(p) + m.group(3) if os.path.exists(p) else m.group(0)
    return re.sub(r'(<script src=")(js/[\w.-]+\.js)(?:\?v=[0-9a-f]+)?(")', one, html)

def main():
    html = open(PAGE, encoding='utf-8', newline='').read()
    out = stamped(html)
    if out != html:
        open(PAGE, 'w', encoding='utf-8', newline='').write(out); print('ok: snoot-mode/index.html stamped')
    else: print('ok: the stamps were current')
    return 0

if __name__ == '__main__':
    sys.exit(main())

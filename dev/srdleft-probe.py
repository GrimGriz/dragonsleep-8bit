"""The SRD pass leftovers (10-02, the cloud seat): builds dev/srdleft-probe.html from DEEP16's own script list (bench16.build_page's way) with
dev/srdleft-probe.js in place of bench16.js, runs it in headless Edge, prints the checks.  python dev/srdleft-probe.py"""
import os, re, sys, json, subprocess, tempfile, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bench16


def main():
    built = bench16.build_page() # (a page of its own each run: bench16.py, 10-01b)
    page = open(built, encoding='utf-8').read().replace('<script src="bench16.js"></script>', '<script src="srdleft-probe.js"></script>')
    os.remove(built)
    out = os.path.join(HERE, 'srdleft-probe.html')
    open(out, 'w', encoding='utf-8').write(page)
    prof = os.path.join(tempfile.gettempdir(), 'srdleft-probe-edge-%d' % os.getpid())
    url = 'file:///' + out.replace('\\', '/') + '?' + urllib.parse.urlencode(dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a))
    p = subprocess.run([bench16.EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files'] + bench16.EXTRA + ['--user-data-dir=' + prof, '--dump-dom', url], capture_output=True, timeout=300)
    dom = p.stdout.decode('utf-8', 'replace')
    import html as H
    m = re.search(r'SRDLEFT (\{.*?\})\s*</pre>', dom, re.S)
    if not m:
        print('no result', re.findall(r'LOADERR ([^<]*)', dom)[:5] or dom[-400:])
        return
    r = json.loads(H.unescape(m.group(1)))
    for c in r['checks']:
        print(('ok   ' if c[1] else 'FAIL ') + c[0])
    print('errors:', r['errors'])
    print('%d/%d' % (sum(1 for c in r['checks'] if c[1]), len(r['checks'])))


if __name__ == '__main__':
    main()


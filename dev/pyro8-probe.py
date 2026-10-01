"""Pyro's measure in the 8-bit battle (09-30b): dev/bench8.py's page with dev/pyro8-probe.js in place of bench8.js.
  python dev/pyro8-probe.py"""
import os, re, sys, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bench8


def main():
    bench8.build_page()
    page = open(os.path.join(HERE, 'bench8.html'), encoding='utf-8').read().replace('<script src="bench8.js"></script>', '<script src="pyro8-probe.js"></script>')
    out = os.path.join(HERE, 'pyro8-probe.html')
    open(out, 'w', encoding='utf-8').write(page)
    prof = os.path.join(tempfile.gettempdir(), 'pyro8-probe-edge-%d' % os.getpid())
    url = 'file:///' + out.replace('\\', '/')
    p = subprocess.run([bench8.EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--dump-dom', url], capture_output=True, timeout=300)
    dom = p.stdout.decode('utf-8', 'replace')
    import html as H
    m = re.search(r'PYRO8 (\{.*?\})\s*</pre>', dom, re.S)
    if not m:
        print('no result', re.findall(r'LOADERR ([^<]*)', dom)[:5] or dom[-600:])
        return
    r = json.loads(H.unescape(m.group(1)))
    for c in r['checks']:
        print(('ok   ' if c[1] else 'FAIL ') + c[0])
    print('errors:', r['errors'])
    print('%d/%d' % (sum(1 for c in r['checks'] if c[1]), len(r['checks'])))


if __name__ == '__main__':
    main()

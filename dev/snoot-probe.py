"""The Snoot mode's probe (10-14, the Snoot mode seat): opens snoot-mode/index.html?probe in headless Edge (a fresh profile) and reads
what the page's own checks printed into #probe -- CHAINMAIL's numbers against the pages they came from, his around and witness rules
(10-13, RULED 10-14), the Dominion's day, eight whole battles played by both hands with every invariant held, and the page itself
(the notes box opens by itself at the end of a battle). A page that does not load, or a script that throws, prints nothing: that
reads "no result" (RED).  python dev/snoot-probe.py"""
import os, re, sys, subprocess, tempfile, shutil, html as H
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import bench16

def main():
    page = os.path.join(ROOT, 'snoot-mode', 'index.html')
    if not os.path.exists(page):
        print('FAIL snoot-mode/index.html is not there'); print('no result'); return 1
    prof = os.path.join(tempfile.gettempdir(), 'snoot-probe-edge-%d' % os.getpid())
    url = 'file:///' + page.replace('\\', '/') + '?probe' + ('&dump' if 'dump' in sys.argv else '') + '&n=' + str(os.getpid())
    p = subprocess.run([bench16.EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files'] + bench16.EXTRA +
                       ['--user-data-dir=' + prof, '--virtual-time-budget=20000', '--dump-dom', url], capture_output=True, timeout=180)
    shutil.rmtree(prof, ignore_errors=True)
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'<pre id="probe"[^>]*>([\s\S]*?)</pre>', dom)
    txt = H.unescape(m.group(1)) if m else ''
    if not txt.strip():
        print('no result (the page printed nothing into #probe)'); return 1
    print(txt)
    # the tutorial (snoot-tutorial.html, a page for his understanding, 10-15): its staged scenes are found on the engine as it stands and every step draws
    tut = os.path.join(ROOT, 'snoot-tutorial.html'); tutok = True
    if os.path.exists(tut):
        prof2 = prof + '-tut'
        q = subprocess.run([bench16.EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files'] + bench16.EXTRA +
                           ['--user-data-dir=' + prof2, '--virtual-time-budget=8000', '--dump-dom', 'file:///' + tut.replace('\\', '/') + '?probe'], capture_output=True, timeout=180)
        shutil.rmtree(prof2, ignore_errors=True)
        mt = re.search(r'<pre id="probe">([\s\S]*?)</pre>', q.stdout.decode('utf-8', 'replace')); line = H.unescape(mt.group(1)) if mt else 'no result'
        tutok = bool(mt) and 'NONE' not in line and 'FAIL' not in line
        print(('ok   ' if tutok else 'FAIL ') + 'the tutorial: ' + line)
    # the stamps (tools/snoot-build.py): a script whose ?v= is not its bytes' hash stays cached in a browser that has the old one
    import importlib.util
    spec = importlib.util.spec_from_file_location('snootbuild', os.path.join(ROOT, 'tools', 'snoot-build.py')); sb = importlib.util.module_from_spec(spec); spec.loader.exec_module(sb)
    stale = [os.path.basename(pg) for pg, pre, base in sb.PAGES if os.path.exists(pg) and sb.stamped(open(pg, encoding='utf-8', newline='').read(), pre, base) != open(pg, encoding='utf-8', newline='').read()]
    fresh = not stale
    print(('ok   ' if fresh else 'FAIL ') + "the pages' script stamps are current (the mode, the tutorial)" + ('' if fresh else ': ' + ', '.join(stale) + ' (run python tools/snoot-build.py)'))
    return 1 if re.search(r'^FAIL', txt, re.M) or 'SNOOTPROBE' not in txt or 'SNOOTPAGE' not in txt or not fresh or not tutok else 0

if __name__ == '__main__':
    sys.exit(main())

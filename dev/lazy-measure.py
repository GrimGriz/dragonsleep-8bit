"""The bytes DEEP16 fetches to reach a screen (10-03, the lazy sheets job; lazy-sheets-notes.md has the numbers it gave).
Serves the repo over HTTP on a free port, counting every byte it sends, and drives the game in a headless Chromium through
Playwright (pip install playwright; the browser is DEEP16_BROWSER, or Playwright's own; DEEP16_BROWSER_ARGS its extra flags).

  python dev/lazy-measure.py          the first screens (?ladder, ?pocket, the bare page), the first turn of a level-3 ladder
                                      fight, the first turn of a Pocket DM fight with a dragonborn in the party
  python dev/lazy-measure.py json     the same as JSON

Each case is a fresh browser context (nothing cached). "At" is what had been sent when the screen was reached; "settled" is
two seconds later (what the background fetches added after it).
"""
import functools, http.server, json, os, sys, threading, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BROWSER = os.environ.get('DEEP16_BROWSER') or None
EXTRA = os.environ.get('DEEP16_BROWSER_ARGS', '').split()

TALLY = {'all': 0, 'sheets': 0, 'n': 0, 'files': []}
LOCK = threading.Lock()


class Counting(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def copyfile(self, source, outputfile):
        n = 0
        while True:
            buf = source.read(65536)
            if not buf:
                break
            outputfile.write(buf)
            n += len(buf)
        path = self.path.split('?')[0]
        with LOCK:
            TALLY['all'] += n
            TALLY['n'] += 1
            if path.startswith('/deep16/art/') and path.endswith('.png') and '/visions/' not in path:
                TALLY['sheets'] += n
                TALLY['files'].append(path.rsplit('/', 1)[-1])


def snap():
    with LOCK:
        return {'all': TALLY['all'], 'sheets': TALLY['sheets'], 'requests': TALLY['n'], 'sheetFiles': len(TALLY['files']), 'names': sorted(TALLY['files'])}


def reset():
    with LOCK:
        TALLY.update({'all': 0, 'sheets': 0, 'n': 0, 'files': []})


BRAVE = '~fighter.3.dragonborn.16-14-16-10-12-8.greatsword_chainmail___handaxe__.Brokk'

# each case: the page, then the steps run in it, then the test that says the screen is reached
SCENES = 'D16.scenes.length > 0'
TURN = '(function () { var B = D16.battle; if (B && B.req && B.req.entry) B.answer(); return !!(B && B.round >= 1 && B.active && B.units && !(D16.spr.held && D16.spr.held(B, true))); })()'
CASES = [
    ('title: ?ladder (the ladder list)', 'deep16/?ladder', [], SCENES),
    ('title: ?pocket (the Pocket DM over the oath-stone)', 'deep16/?pocket', [], SCENES),
    ('title: the bare page (the proof of concept fight, its entry card)', 'deep16/', [], SCENES + ' && !!D16.battle && D16.battle.req && D16.battle.req.entry && !(D16.spr.held && D16.spr.held(D16.battle, true))'),
    ('first turn: a level-3 ladder fight (the rung\'s set piece, through the camp)', 'deep16/?ladder', [
        (SCENES, 'D16.top().fight(3)'),
        ('D16.top() instanceof D16.Camp && !(D16.spr.held && D16.spr.held(D16.top(), true))', 'D16.top().fight()'),
    ], TURN),
    ('first turn: a Pocket DM fight, four at 3 and Brokk the dragonborn fighter 3 (party, map, CR screens)', 'deep16/?pocket', [
        (SCENES, "(function () { var P = D16.top(); P.st.roster.push({ code: '" + BRAVE + "', name: 'Brokk', cls: 'fighter', lvl: 3 }); "
                 "P.st.party = [{ w: 'barley', lvl: 3, loot: [] }, { w: 'aurdin', lvl: 3, loot: [] }, { w: 'vivian', lvl: 3, loot: [] }, { w: 'lymen', lvl: 3, loot: [] }, { custom: 0 }]; "
                 "P.cache = {}; P.go('party'); })()"),
        ('D16.top().t > 30', "(function () { var P = D16.top(); P.go('map'); P.mapSel = 'breach'; P.go('cr'); P.foes = ['goblin', 'goblin', 'wolf']; P.fightMap = 'breach'; P.launch(); })()"),
    ], TURN),
]


def run_case(br, port, name, path, steps, done):
    from playwright.sync_api import TimeoutError as PWTimeout
    ctx = br.new_context(viewport={'width': 960, 'height': 540})
    page = ctx.new_page()
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)[:200]))
    reset()
    t0 = time.time()
    page.goto('http://127.0.0.1:%d/%s' % (port, path))
    try:
        for test, act in steps:
            page.wait_for_function(test, timeout=60000, polling=50)
            page.evaluate(act)
        page.wait_for_function(done, timeout=60000, polling=50)
        at = snap()
        at['seconds'] = round(time.time() - t0, 2)
    except PWTimeout:
        at = snap()
        at['timeout'] = True
    extra = page.evaluate("(function () { var B = D16.battle; return B ? { fight: B.fight && B.fight.id, sheets: (B.units || []).map(function (u) { return u.sheet; }) } : null; })()")
    time.sleep(2)
    later = snap()
    ctx.close()
    return {'case': name, 'at': at, 'settled': {'all': later['all'], 'sheets': later['sheets'], 'sheetFiles': later['sheetFiles']}, 'battle': extra, 'errors': errs}


def main(argv):
    from playwright.sync_api import sync_playwright
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Counting, directory=ROOT))
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    out = []
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path=BROWSER, args=EXTRA + ['--autoplay-policy=no-user-gesture-required'])
        for c in CASES:
            out.append(run_case(br, port, *c))
        br.close()
    srv.shutdown()
    if 'json' in argv:
        print(json.dumps(out, indent=1))
        return 0
    mb = lambda b: '%.2f MB' % (b / 1e6)
    for r in out:
        a, s = r['at'], r['settled']
        print(r['case'] + ('  TIMEOUT' if a.get('timeout') else ''))
        print('   at it:   %s in all, %s of it sheets (%d sheet images), %s s' % (mb(a['all']), mb(a['sheets']), a['sheetFiles'], a.get('seconds', '?')))
        print('   settled: %s in all, %s of it sheets (%d sheet images)' % (mb(s['all']), mb(s['sheets']), s['sheetFiles']))
        if r['battle']:
            print('   the fight: %s; its units\' sheets: %s' % (r['battle']['fight'], ', '.join(sorted(set(x for x in r['battle']['sheets'] if x)))))
        if r['errors']:
            print('   page errors: ' + ' | '.join(r['errors']))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

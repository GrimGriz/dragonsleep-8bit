"""THE LOADING CHECK, probed (11-18; RULED, Griz: "2 - lean", on his "D.hours.canWait is not a function" -- a page half loaded while Pages swapped in a ship,
and his "didn't finish loading makes sense"; the second game's house lane, its 11-18 entries). deep16/index.html's inline check (window.D16LOAD) says
"the game did not finish loading -- reload" in place of a broken game when a script did not load, broke as it loaded, or the page is older than the
game it fetched. This opens the real page, served over http, in the benches' headless browser:
  GREEN -- the doors (the front, the Pocket DM, the gallery, the shows, the cards, THE WORLD) load with D16LOAD.state 'ok' and no card;
  RED, three ways it must catch -- js/hours.js withheld, js/hours.js broken as it loads, and the page served with an old stamp while the game is new.
Run from PowerShell: python dev/loadcheck-probe.py -- prints ok or FAIL lines, exits 1 on a FAIL (the quick gate runs it: dev/check.py QUICK_SCRIPTS).
"""
import asyncio, os, re, sys, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
_spec = importlib.util.spec_from_file_location('eyesharvest', os.path.join(HERE, 'eyes-harvest.py')); EH = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(EH)

WORDS = 'the game did not finish loading -- reload'
DOORS = ['deep16/', 'deep16/?pocket', 'deep16/?gallery', 'deep16/?skyshow', 'deep16/?wetshow&beat=cradle', 'deep16/?show=grick', 'deep16/?cards', 'deep16/?world']
STATE = "() => { var L = window.D16LOAD, d = document.getElementById('loadcheck'); return { state: L ? L.state : 'none', bad: L ? L.bad : [], card: d ? d.innerText : '' }; }"
bad = []
def ok(c, what):
    print(('ok   ' if c else 'FAIL ') + what, flush=True)
    if not c: bad.append(what)

async def look(br, base, url, route=None):
    pg = await br.new_page(viewport={'width': 960, 'height': 540})
    try:
        if route: await route(pg)
        await pg.goto(base + url, wait_until='load', timeout=60000)
        r = {'state': 'none'}
        for _ in range(40):
            r = await pg.evaluate(STATE)
            if r['state'] != 'loading': break
            await pg.wait_for_timeout(250)
        if r['state'] == 'ok': await pg.wait_for_timeout(600); r = await pg.evaluate(STATE) # (and nothing turns it after)
        return r
    except Exception as e:
        return {'state': 'err', 'bad': [str(e)[:200]], 'card': ''}
    finally: await pg.close()

async def main():
    from playwright.async_api import async_playwright
    httpd, base = EH.serve()
    try:
        async with async_playwright() as p:
            br = await EH.launch(p)
            for u in DOORS:
                r = await look(br, base, u)
                ok(r['state'] == 'ok' and not r['card'], 'GREEN %-28s %s%s' % (u, r['state'], '' if not r['bad'] else ': ' + '; '.join(r['bad'])[:200]))
            async def withhold(pg): await pg.route(re.compile(r'/deep16/js/hours\.js'), lambda rt: asyncio.ensure_future(rt.abort()))
            async def broken(pg): await pg.route(re.compile(r'/deep16/js/hours\.js'), lambda rt: asyncio.ensure_future(rt.fulfill(status=200, content_type='application/javascript', body='(function () { var H = ;')))
            page = open(os.path.join(ROOT, 'deep16', 'index.html'), encoding='utf-8').read()
            old = re.sub(r'(js/hours\.js\?v=)[0-9a-f]+', r'\g<1>0123456789', page)
            async def stale(pg):
                n = [0]
                def serve_old(rt):
                    n[0] += 1 # (the first ask is the page the browser kept; the check's own fetch gets the game as it is now)
                    asyncio.ensure_future(rt.fulfill(status=200, content_type='text/html', body=old) if n[0] == 1 else rt.continue_())
                await pg.route(re.compile(r'/deep16/(\?[^/]*)?$'), serve_old)
            for what, rt, url, needs in (('js/hours.js withheld', withhold, 'deep16/?pocket', 'js/hours.js did not load'),
                                         ('js/hours.js broken as it loads', broken, 'deep16/?skyshow', 'js/hours.js broke as it loaded'),
                                         ('the page older than the game', stale, 'deep16/?gallery', 'this page is older than the game')):
                r = await look(br, base, url, rt)
                ok(r['state'] == 'bad' and WORDS in r['card'] and any(needs in b for b in r['bad']), 'RED   %-32s %s: %s' % (what, r['state'], ('; '.join(b.split(':')[0] for b in r['bad']) or r['card'])[:200])) # (the throw's own words left out: they carry "Error", which dev/check.py reads as RED -- as dev/loaderr-probe.py)
            await br.close()
    finally: httpd.shutdown()

asyncio.run(main())
print('LOADCHECK %s (%d failed)' % ('GREEN' if not bad else 'RED', len(bad)))
sys.exit(1 if bad else 0)

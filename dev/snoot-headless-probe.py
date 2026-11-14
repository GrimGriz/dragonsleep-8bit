"""The Snoot's fights on the grid, unseen (11-14, the Snoot seat; Griz: "Yes, replace it", "go with your morale build"): the page served over http and
played by its own ?watch hand in Playwright's Chromium -- the day's fights asked of DEEP16 in a hidden frame (snoot-mode/js/headless.js HL.day), what
comes back written onto the board (HL.apply), the show's scenes worked out from its beats. Checks: the grid answered every fight (no stand-in on the tables, no crash), no unit left with men below
nought or a dead hero standing, nothing threw, and the page never showed SOMETHING BROKE. Prints each fight's bodies and time.
  python dev/snoot-headless-probe.py [days=6] [seed=3]"""
import os, sys, json, threading, functools, http.server, socketserver, time
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

HOOK = """
(() => {
  window.__hl = []; window.__err = [];
  window.addEventListener('error', e => __err.push(String(e.message)));
  const a0 = SN.Headless.ask;
  SN.Headless.ask = function (a, b, o, done) {
    const t = performance.now(), n = [].concat(a).concat(b).reduce((s, u) => s + (u.figs || 0) + SN.heroesOf(u).length, 0);
    a0(a, b, o, function (res, m) { __hl.push({ ms: Math.round(performance.now() - t), bodies: n, units: [].concat(a).concat(b).map(u => u.id).join('+'), result: res ? res.result : null, rounds: res ? res.rounds : null, err: res ? res.error : (m && m.msg) }); done(res, m); });
  };
  // (the show is not waited for, but its timeline is built and every quarter-second of its scene worked out, so a beat the show cannot read throws here)
  SN.Show.play = function (st, f, t, at, done) { try { const sh = SN.Show.build(st, f, t, at); for (let x = 0; x <= sh.total + 0.25; x += 0.25) SN.Show.scene(sh, x); window.__shows = (window.__shows || 0) + 1; } catch (e) { __err.push('the show: ' + e.message); } done(); };
  SN.Deep.fight = function (st, d, done) { done(SN.standIn(st, d)); }; // (the four's own fight is theirs to play: here its stand-in, as the gate's probe has it)
})()
"""
READ = """
(() => {
  const st = SN.UI.state(); if (!st) return null;
  const bad = [];
  st.units.forEach(u => { if ((u.figs || 0) < 0) bad.push(u.id + ' figs ' + u.figs); if (u.groups && u.groups.some(g => g.n < 0)) bad.push(u.id + ' group below nought'); if (SN.alive(u) && !u.party && (u.figs || 0) <= 0 && !SN.heroesOf(u).length) bad.push(u.id + ' alive with nobody'); });
  const card = document.getElementById('card');
  return { day: st.day, over: !!st.over, hl: window.__hl, err: window.__err, bad: bad, broke: !!(card && /SOMETHING BROKE/.test(card.innerText || '')),
    grid: st.log.filter(l => /On the grid, unseen/.test(l.text || l.t || JSON.stringify(l))).length,
    tables: st.log.filter(l => /roll \\d+ di(e|ce), kill on/.test(l.text || l.t || JSON.stringify(l))).length,
    seated: st.log.filter(l => /^Seated:/.test(l.text || l.t || '')).length,
    morale: st.log.filter(l => /Morale, round/.test(l.text || l.t || JSON.stringify(l))).map(l => l.text || l.t || '').slice(-6),
    units: st.units.filter(u => SN.alive(u)).length };
})()
"""


def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
    h = functools.partial(Q, directory=ROOT)
    class S(socketserver.ThreadingTCPServer):
        daemon_threads = True
        def handle_error(self, *a, **k): pass  # (the browser closing mid-file at the end)
    srv = S(('127.0.0.1', 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def main():
    args = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a)
    days = int(args.get('days', 6)); seed = int(args.get('seed', 3)); limit = int(args.get('secs', 240))
    try:
        from playwright.sync_api import sync_playwright
    except Exception as e:
        print('no result (playwright is not installed: %s)' % e); return 1
    srv = serve(); port = srv.server_address[1]; ok = True; last = None
    with sync_playwright() as pw:
        exe = os.environ.get('DEEP16_BROWSER') or None; xargs = (os.environ.get('DEEP16_BROWSER_ARGS') or '').split()  # (the gate's own browser on a runner; Playwright's on the desk)
        br = pw.chromium.launch(headless=True, executable_path=exe, args=xargs) if exe else pw.chromium.launch(headless=True)
        pg = br.new_page(viewport={'width': 1280, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        pg.goto('http://127.0.0.1:%d/snoot-mode/?watch&seed=%d' % (port, seed))
        pg.wait_for_function('window.SN && SN.UI && SN.UI.state && SN.UI.state() && SN.Headless && SN.Show', timeout=30000)
        pg.evaluate(HOOK)
        day0 = pg.evaluate('SN.UI.state().day'); t0 = time.time()
        while time.time() - t0 < limit:
            last = pg.evaluate(READ)
            if last and (last['over'] or last['day'] >= day0 + days or last['broke']): break
            time.sleep(0.5)
        br.close()
    srv.shutdown()
    if not last:
        print('no result'); return 1
    for f in last['hl']: print('  fight  %-28s %3d bodies  %2s rounds  %5d ms  %s%s' % (f['units'], f['bodies'], f['rounds'], f['ms'], f['result'], (' ' + str(f['err'])) if f['err'] else ''))
    for l in last['morale']: print('  ' + l)

    def check(c, what):
        nonlocal ok
        print(('ok   ' if c else 'FAIL ') + what); ok = ok and c
    check(len(last['hl']) > 0, 'the day asked the grid for its fights (%d in %d days, seed %d)' % (len(last['hl']), last['day'] - day0, seed))
    check(all(f['result'] in ('won', 'lost', 'both') for f in last['hl']), 'every fight came back fought')
    check(last['grid'] == len(last['hl']), 'each was written back onto the board (%d of %d)' % (last['grid'], len(last['hl'])))
    check(last['seated'] > 0, 'the seating reached the grid (%d fights with a formation, a flank or the walls in them)' % last['seated'])
    check(last['tables'] == 0, 'the tables fought nothing (%d rolls)' % last['tables'])
    check(not last['bad'], 'no unit below nought or alive with nobody' + (': ' + '; '.join(last['bad'][:4]) if last['bad'] else ''))
    check(not last['broke'] and not errs and not last['err'], 'nothing threw' + (': ' + '; '.join((errs + last['err'])[:3]) if errs or last['err'] else ''))
    check(last['day'] >= day0 + days or last['over'], 'the days went by (day %d from %d)' % (last['day'], day0))
    print('SNOOTHEADLESS ' + ('ok' if ok else 'FAIL'))
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())

r"""THE EYES ROWS' STEPS, HARVESTED (11-16 night, the eyes-steps seat, started by the lanes desk on Griz: "weekly's pretty big you're still under 98%.
Think we can do this live ... and then start the biggie of making the old 400 (as applicable) work with it with the rest of the room between us and the
ceiling?"; the walk itself is deep16/js/eyeswalk.js). A row's `steps` -- [['<floor key>', x, y, '<what to look at>'], ...] -- are placed by hand, from
what this harvest reads off each row's own door, opened in the real page (deep16/index.html with its main.js, the door's own words) in the benches' headless
browser:

  python dev/eyes-harvest.py harvest [--pri 1] [--ids a,b] [--all] [--out F]
      every candidate row's door opened; per row: the scene on top, the floor's key (D.roam.def.key), its size, the walk mode, the party token's square,
      and every named thing on the floor with its square -- the people (units with npc, def.people), the triggers (def.src8.triggers: doors, signs, talks,
      their labels), the marks (def.marks, any [x,y] by its path), the signs' doors, a room's keeper. Rows whose door is no floor (a gallery, the rows, a
      portrait, the Pocket DM, the Snoot, a fight, a show of a creature) are skipped and counted unless --all. Default out: the-lab\\eyes-steps-1116\\harvest.json
  python dev/eyes-harvest.py rooms [--out F]
      Silverton's rooms: every door on the street (a keeper's, a shop's, the inn's, the chapel's...) laid as js/town.js T.room lays it -- the keeper's square,
      the spot across the counter, the way in; and who stands beside (Ned at Percy's). The step's key inside is 'room'.
  python dev/eyes-harvest.py check [--ids a,b] [--pri N]
      every row WITH steps: its door opened, each step on the door's floor in bounds and standable or beside a standable square reached from where the party
      stands (a walk over G.canPass from the token); a 'room' step inside its room's bounds; a step on another floor checked on that floor (?roam=<key>).
      exit 1 on any step that fails.
  python dev/eyes-harvest.py apply [--map M]
      the map's steps into js/eyes.js by row id (inserted on their own line after the row's url, or replaced where a row has them); the map is
      the-lab\eyes-steps-1116\steps.json: { "<id>": { "steps": [[key, x, y, words], ...] } or { "na": "<why no steps>" } }
  python dev/eyes-harvest.py walk --ids a,b
      the walk bench's method on the real door: the door opened with &tourrow=<id>, the party set on each step in its order (into a room through the door
      nearest the step before; onto another floor by ?roam=<key>), the arrow's paint run, and Sylvia's walk store read: every step seen, the XP's line.
Benches from PowerShell (headless Chromium answers nothing from the Bash sandbox).
"""
import asyncio, json, os, re, sys, threading, http.server, functools, socket
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, 'tools'))
import importlib.util
_spec = importlib.util.spec_from_file_location('eyesobj', os.path.join(ROOT, 'tools', 'eyes-obj.py')); EO = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(EO)

def lab():
    import subprocess
    try:
        common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--path-format=absolute', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
        base = os.path.dirname(os.path.dirname(common)) if common else os.path.dirname(ROOT)
    except Exception:
        base = os.path.dirname(ROOT)
    d = os.path.join(base, 'the-lab', 'eyes-steps-1116'); os.makedirs(d, exist_ok=True); return d

# doors with no floor to walk: a gallery, a sheet's rows, a portrait, the Pocket DM, the Snoot, a fight on the grid, a creature's show, the cards
NOFLOOR = re.compile(r'^(?:snoot-mode/|tools/|index\.html|situations\.html)|[?&](?:rows=|portraits\b|gallery\b|fxgallery\b|mpgallery\b|pocket\b|npc=|fight=|show=(?!secondact)|cards\b|headless|runes\b|parade\b|rulesshow\b|seepshow\b|madeshow\b|itemshow\b|mpshow\b|keeperfight\b|ladder\b|climb\b|slainfail\b|roostfail\b|dacefail\b|victoryshow\b|fallenshow\b|barleyshow\b|skyshow\b|ripplesshow\b|broke\b|keepers\b|cradle\b|gameshow\b|replay=)')
def floor_door(url): return bool(url) and url.startswith('deep16/') and not NOFLOOR.search(url[len('deep16/'):] if url.startswith('deep16/') else url)

def browser_path():
    try:
        import bench16; return bench16.browser()
    except Exception: return None

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError): pass # (a page closed mid-load: nothing to say)
    def end_headers(self): self.send_header('Cache-Control', 'no-store'); super().end_headers()
def serve():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(Quiet, directory=ROOT))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, 'http://127.0.0.1:%d/' % port

READY = r"""() => { var D = window.D16; if (!D || !D.top) return 'none'; var B = D.battle, top = D.top(), R0 = B && B.roam;
  if (B && R0 && D.roam && D.roam.def && top === B && R0.mode === 'walk' && !B.menu) return 'walk';
  return 'wait'; }"""

HARVEST = r"""() => {
  var D = window.D16, out = {};
  function kind(s) { return s ? (s.kind || (s.constructor && s.constructor.name) || '?') : null; }
  var top = D.top && D.top(), B = D.battle, R0 = B && B.roam, def = D.roam && D.roam.def;
  out.top = kind(top); out.scenes = (D.scenes || []).map(kind); out.onTop = !!B && top === B;
  if (!B || !R0 || !def) return out;
  out.key = def.key; out.name = def.name || null; out.room = def.room || null;
  var W = def.w || (def.rows && def.rows[0] && def.rows[0].length) || 0, H = def.h || (def.rows && def.rows.length) || 0; out.w = W; out.h = H;
  out.mode = R0.mode; out.menu = !!B.menu; var t = R0.token; out.token = t && t.x != null ? [t.x, t.y] : null;
  var mem = R0.members || []; out.members = mem.filter(function (u) { return u && u.x != null; }).map(function (u) { return [u.name, u.x, u.y]; });
  var named = [];
  function sq(v) { return Array.isArray(v) && v.length >= 2 && typeof v[0] === 'number' && typeof v[1] === 'number' && v[0] >= 0 && v[1] >= 0 && v[0] < W + 2 && v[1] < H + 2; }
  function scan(v, path, d) {
    if (d > 5 || v == null) return;
    if (sq(v) && (v.length === 2 || typeof v[2] !== 'number' || v.length === 4)) { named.push({ src: path, x: v[0], y: v[1] }); return; }
    if (Array.isArray(v)) { if (v.length > 60) return; v.forEach(function (x, i) { scan(x, path + '[' + i + ']', d + 1); }); return; }
    if (typeof v === 'object') Object.keys(v).forEach(function (k) { if (typeof v[k] !== 'function') scan(v[k], path + '.' + k, d + 1); });
  }
  (B.units || []).forEach(function (u) { if (!u || u.x == null || mem.indexOf(u) >= 0 || u === t) return; named.push({ src: 'unit', id: u.npc || u.id, name: u.name || null, kind: u.kind, side: u.side, dead: !!(u.dead || u.hp <= 0), x: u.x, y: u.y }); });
  (def.people || []).forEach(function (p) { if (p && p.at) named.push({ src: 'people', id: p.id, look: p.look || null, x: p.at[0], y: p.at[1] }); });
  ((def.src8 && def.src8.triggers) || []).forEach(function (tr) { if (!tr || !tr.rect) return; var d0 = tr.door || {}; named.push({ src: 'trigger', id: tr.id, name: tr.label || d0.name || d0.what || tr.npc || tr.script || null, town: tr.town || null, on: tr.on, x: tr.rect[0], y: tr.rect[1], w: tr.rect[2], h: tr.rect[3] }); });
  scan(def.src8 && def.src8.chests, 'chests', 0); scan(def.marks, 'marks', 0); scan(def.gate, 'gate', 0); scan(def.entry, 'entry', 0); scan(def.stairUp, 'stairUp', 0); scan(def.board, 'board', 0); scan(def.across, 'across', 0); scan(def.beside, 'beside', 0);
  if (def.doors && def.doors.length < 40) scan(def.doors, 'doors', 0);
  if (def.warps && def.warps.length < 40) (def.warps || []).forEach(function (w, i) { if (w && w.rect) named.push({ src: 'warp', id: w.id || w.to || i, name: w.to || w.name || null, x: w.rect[0], y: w.rect[1] }); else scan(w, 'warps[' + i + ']', 1); });
  if (def.keeper && def.keeper.at) named.push({ src: 'keeper', id: def.keeper.id, name: def.keeper.name, x: def.keeper.at[0], y: def.keeper.at[1] });
  ['signDoor', 'signs', 'faceDoors'].forEach(function (k) { var o = def[k]; if (o && typeof o === 'object' && !Array.isArray(o)) Object.keys(o).forEach(function (xy) { var m = /^(\d+),(\d+)$/.exec(xy); if (m) named.push({ src: k, id: String(o[xy]), x: +m[1], y: +m[2] }); }); });
  (B.exits || []).forEach(function (e, i) { scan(e, 'exits[' + i + ']', 1); });
  if (D.solskaft && /^solskaft/.test(def.key)) { var SK = D.solskaft; [].concat(SK.DOORS || [], SK.CDOORS || [], SK.BDOORS || [], SK.LDOORS || []).forEach(function (z) { (z.at || []).forEach(function (q) { named.push({ src: 'SK.door(8-bit row; y=SK.Y?)', id: z.id, name: z.title, x: q[0], y: q[1], yGrid: SK.Y ? SK.Y(q[1]) : null }); }); }); }
  out.named = named;
  return out;
}"""

# a walk over G.canPass from the token: may a step be had (its square, or one beside it, standable and reached)
CHECK = r"""(steps) => {
  var D = window.D16, B = D && D.battle, R0 = B && B.roam, def = D && D.roam && D.roam.def, G = D && D.grid; if (!B || !def || !R0) return { err: 'no floor (top ' + (D && D.top && D.top() && (D.top().kind || D.top().constructor.name)) + ')' };
  var W = def.w || def.rows[0].length, H = def.h || def.rows.length, mem = (R0.members || []).filter(function (u) { return u && u.x != null; }), u = mem[0], t = R0.token;
  var sx = t && t.x != null ? t.x : u.x, sy = t && t.x != null ? t.y : u.y, seen = {}, q = [[sx, sy]]; seen[sx + ',' + sy] = 1;
  var ux = u.x, uy = u.y;
  while (q.length) { var c = q.shift(); for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) { var nx = c[0] + dx, ny = c[1] + dy, k = nx + ',' + ny; if ((!dx && !dy) || seen[k] || nx < 0 || ny < 0 || nx >= W || ny >= H) continue; var ok = false; try { ok = G.canPass(u, nx, ny); } catch (e) { ok = false; } if (ok) { seen[k] = 1; q.push([nx, ny]); } } }
  var reach = Object.keys(seen).length;
  return { key: def.key, w: W, h: H, start: [sx, sy], reach: reach, steps: steps.map(function (s) {
    if (s[0] !== def.key) return { s: s, here: false };
    var inb = s[1] >= 0 && s[2] >= 0 && s[1] < W && s[2] < H, near = [], stand = 0;
    for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) { var x = s[1] + dx, y = s[2] + dy; if (seen[x + ',' + y]) near.push([x, y]); if (x >= 0 && y >= 0 && x < W && y < H) { try { if (G.canStand(u, x, y) || (x === u.x && y === u.y)) stand++; } catch (e) { } } }
    return { s: s, here: true, inBounds: inb, reached: near.length > 0, near: near.length, stand: stand };
  }) };
}"""

ROOMS = r"""() => {
  var D = window.D16, T = D.town, def = D.roam && D.roam.def, out = [];
  ((def.src8 && def.src8.triggers) || []).forEach(function (tr) { if (tr.town !== 'door') return;
    try { var r = T.room(tr.id, tr.door); out.push({ door: tr.id, at: tr.rect.slice(0, 2), name: r.name, keeper: r.keeper && { id: r.keeper.id, name: r.keeper.name, at: r.keeper.at }, across: r.across, entry: r.entry && r.entry[0], w: r.rows[0].length, h: r.rows.length, beside: (D.counter && D.counter.BESIDE && D.counter.BESIDE[r.keeper && r.keeper.id]) || [] }); }
    catch (e) { out.push({ door: tr.id, err: String(e).slice(0, 160) }); } });
  return out;
}"""

async def open_door(br, base, url, wait_ms=9000, retry=True):
    pg = await br.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    try:
        await pg.goto(base + url, wait_until='load', timeout=60000)
        state = 'none'; t = 0
        while t < wait_ms:
            await pg.wait_for_timeout(300); t += 300
            try: state = await pg.evaluate(READY)
            except Exception as e: state = 'err'
            if state == 'walk': await pg.wait_for_timeout(400); break
        if state == 'none' and retry:
            await pg.close(); return await open_door(br, base, url, wait_ms, False)
        return pg, state, errs
    except Exception as e:
        errs.append('goto: %s' % str(e)[:200]); return pg, 'err', errs

async def launch(p):
    exe = browser_path(); kw = {'headless': True}
    if exe and os.path.exists(exe) and 'msedge' not in exe.lower(): kw['executable_path'] = exe
    return await p.chromium.launch(**kw)

async def run_many(jobs, fn, conc=3):
    from playwright.async_api import async_playwright
    httpd, base = serve(); res = {}
    try:
        async with async_playwright() as p:
            br = await launch(p); sem = asyncio.Semaphore(conc)
            async def one(j):
                async with sem:
                    try: res[j['id']] = await fn(br, base, j)
                    except Exception as e: res[j['id']] = {'err': str(e)[:300]}
                    print('  %-48s %s' % (j['id'], short(res[j['id']])), flush=True)
            await asyncio.gather(*[one(j) for j in jobs])
            await br.close()
    finally: httpd.shutdown()
    return res

def short(r):
    if not isinstance(r, dict): return str(r)[:80]
    if 'err' in r: return 'ERR ' + r['err'][:80]
    if 'steps' in r and isinstance(r['steps'], list) and r['steps'] and isinstance(r['steps'][0], dict): return '%s %s' % (r.get('key'), ' '.join(('ok' if (not s['here'] or (s['inBounds'] and s['reached'])) else 'FAIL') for s in r['steps']))
    if 'walk' in r: return 'walk %s' % r['walk']
    return '%s %s %s token %s, %d named' % (r.get('state'), r.get('top'), r.get('key'), r.get('token'), len(r.get('named') or []))

def load_rows():
    src = open(EO.EYES, encoding='utf-8').read(); rs = EO.rows(src)
    return [dict(id=r['id'], **{k: r['f'].get(k) for k in ('pri', 'group', 'title', 'url', 'obj', 'look')}, steps=steps_of(src, r) if 'steps' in r['span'] else None) for r in rs]

def steps_of(src, r):
    a, b = r['span']['steps']; txt = src[a:b]; txt = txt[txt.index('['):]
    # the JS array of arrays of (string, int, int, string) as JSON: single quotes to double, the escapes kept
    out = []; i = 0
    for m in re.finditer(r"\[\s*'((?:[^'\\]|\\.)*)'\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\s*\]", txt):
        out.append([m.group(1), int(m.group(2)), int(m.group(3)), m.group(4).replace("\\'", "'")])
    return out

def pick(rows, a):
    ids = set(a[a.index('--ids') + 1].split(',')) if '--ids' in a else None
    pri = int(a[a.index('--pri') + 1]) if '--pri' in a else None
    out = []
    for r in rows:
        if ids is not None and r['id'] not in ids: continue
        if pri is not None and r['pri'] != pri: continue
        out.append(r)
    return out

async def do_harvest(br, base, j):
    pg, state, errs = await open_door(br, base, j['url'])
    try: h = await pg.evaluate(HARVEST)
    except Exception as e: h = {'err': str(e)[:200]}
    await pg.close(); h['state'] = state; h['errs'] = errs[:3]; h['url'] = j['url']; return h

async def do_check(br, base, j):
    pg, state, errs = await open_door(br, base, j['url'], 15000)
    if state != 'walk':
        await pg.close(); pg, state, errs = await open_door(br, base, j['url'], 15000)
    try: r = await pg.evaluate(CHECK, j['steps'])
    except Exception as e: r = {'err': str(e)[:200]}
    await pg.close()
    if 'err' in r and str(r['err']).startswith('no floor') and state != 'walk':
        r = {'key': None, 'steps': [{'s': s0, 'here': False} for s0 in j['steps']], 'doorNote': r['err']}
    if 'err' in r: return r
    # steps on another floor: on that floor's own door; 'room' against the rooms' bounds. A step on the door's floor that is not standable there is tried
    # once more on its floor opened at its own square: a building's inside is laid only with the party in it (the Halfway Inn's house is shut from the yard)
    for s in r['steps']:
        if s['here'] and s.get('inBounds') and not (s.get('reached') or s.get('stand')): s['here'] = False; s['again'] = True
        if s['here']: continue
        k = s['s'][0]
        if k == 'room': s['note'] = 'room (checked against the rooms list)'; s['here'] = False; continue
        pg2, st2, e2 = await open_door(br, base, 'deep16/?roam=%s&at=%d,%d&lvl=3' % (k, s['s'][1], s['s'][2]))
        try: r2 = await pg2.evaluate(CHECK, [s['s']])
        except Exception as e: r2 = {'err': str(e)[:200]}
        await pg2.close()
        if 'err' in r2 or not r2['steps'][0]['here']: s.update(here=True, inBounds=False, reached=False, note='its floor would not open as ' + k + ': ' + str(r2.get('err') or r2.get('key')))
        else: s.update(r2['steps'][0]); s['note'] = ('laid again at the square' if s.get('again') else 'on its own floor') + ' (from ?roam=%s&at=, start %s)' % (k, r2['start'])
    r['state'] = state; return r

WALK = r"""(a) => {
  var D = window.D16, T = window.DS.TOUR, id = a.id, steps = a.steps, log = [];
  var cv = document.createElement('canvas'); cv.width = D.W; cv.height = D.H; var cx = cv.getContext('2d');
  function B() { return D.battle; }
  function drive(g) { for (var i = 0; i < 4000; i++) { var r = g.next(); if (r.done) return true; var b = B(); if (b && b.menu) { b.menu = null; } } return false; }
  // the party set where a player could stand: the square reached from where it stands (a walk over G.canPass) nearest the step, standable -- not on the
  // step itself (a keeper behind a counter is two squares from where the word is had: a step on the keeper's own square never ticks from the front)
  function spot(x, y) {
    var b = B(), R0 = b.roam, G = D.grid, def = D.roam.def, W = def.w || def.rows[0].length, Hh = def.h || def.rows.length, u = (R0.members || []).filter(function (m) { return m.x != null; })[0], t = R0.token && R0.token.x != null ? R0.token : u;
    var seen = {}, q = [[t.x, t.y]], best = null, bd = 99; seen[t.x + ',' + t.y] = 1;
    while (q.length) { var c = q.shift(), d = Math.max(Math.abs(c[0] - x), Math.abs(c[1] - y)), st = false; try { st = G.canStand(u, c[0], c[1]) || (c[0] === t.x && c[1] === t.y); } catch (e) { }
      if (st && d < bd) { bd = d; best = c; }
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) { var nx = c[0] + dx, ny = c[1] + dy, k = nx + ',' + ny; if (seen[k] || nx < 0 || ny < 0 || nx >= W || ny >= Hh) continue; var ok = false; try { ok = G.canPass(u, nx, ny); } catch (e) { } if (ok) { seen[k] = 1; q.push([nx, ny]); } } }
    return bd <= 1 ? { at: best, d: bd } : { at: [x, y], d: bd, unreached: true };
  }
  function put(x, y) { var b = B(), R0 = b.roam, sp = spot(x, y); if (sp.unreached) log.push('  (no square reached beside ' + x + ',' + y + ': nearest ' + sp.d + ' off; set on it)'); else if (sp.at[0] !== x || sp.at[1] !== y) log.push('  (stood at ' + sp.at.join(',') + ')');
    (R0.members || []).forEach(function (u) { if (u.x != null) { u.x = sp.at[0]; u.y = sp.at[1]; } }); if (R0.token) { R0.token.x = sp.at[0]; R0.token.y = sp.at[1]; } R0.mode = 'walk'; b.menu = null; D.counter.paintPin(cx, b); unreached += sp.unreached ? 1 : 0; }
  var unreached = 0;
  if (!T.bar || !T.bar.row || !T.bar.row() || T.bar.row().id !== id) { T.unmount && T.unmount(); T.mountRow(id); }
  T.bar.up = false;
  var prev = null;
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i], def = (D.roam && D.roam.def && D.battle && D.battle.roam) ? D.roam.def : {}; // (a door on THE WORLD or a show's list: the first step's floor opened)
    if (s[0] !== def.key) {
      if (s[0] === 'room' && D.town && def.town) {
        var tr = ((def.src8 && def.src8.triggers) || []).filter(function (t0) { return t0.town === 'door'; }).sort(function (p, q) { var px = prev || [0, 0]; return Math.max(Math.abs(p.rect[0] - px[1]), Math.abs(p.rect[1] - px[2])) - Math.max(Math.abs(q.rect[0] - px[1]), Math.abs(q.rect[1] - px[2])); })[0];
        if (tr) { var dn = drive(D.town.goIn(B(), tr)); log.push('in at ' + tr.id + (dn ? '' : ' (its scene did not end)')); }
      } else if (D.roam.make) {
        var nb = D.roam.make('?roam=' + s[0] + '&at=' + s[1] + ',' + s[2] + '&lvl=3'); D.scenes.push(nb); if (nb.bakes && nb.bakes()) { } nb.enter(); D.battle = nb; for (var k = 0; k < 8 && nb.co; k++) nb.co.next(); log.push('onto ' + D.roam.def.key);
      }
    }
    if (!D.roam.def || D.roam.def.key !== s[0]) { log.push('step ' + (i + 1) + ': not on ' + s[0] + ' (on ' + D.roam.def.key + ')'); break; }
    put(s[1], s[2]); var w = T.walk(id); log.push('step ' + (i + 1) + ' ' + s[0] + ' ' + s[1] + ',' + s[2] + ': seen ' + JSON.stringify(w.done)); prev = s;
  }
  var w2 = T.walk(id); return { done: w2.done, of: steps.length, xp: !!w2.xp, walked: !!(T.bar && T.bar.walked), unreached: unreached, log: log };
}"""

async def do_walk(br, base, j):
    url = j['url'] + ('' if 'tourrow=' in j['url'] else '&tourrow=' + j['id'])
    pg, state, errs = await open_door(br, base, url, 15000)
    if errs and state != 'walk': # (a page that loaded with an error under the load of several at once: once more)
        await pg.close(); pg, state, errs = await open_door(br, base, url, 15000)
    try: r = await pg.evaluate(WALK, {'id': j['id'], 'steps': j['steps']})
    except Exception as e: r = {'err': str(e)[:300]}
    await pg.close(); r['state'] = state; r['errs'] = errs[:3]
    if 'done' in r: r['walk'] = '%d of %d seen, xp %s%s' % (len(r['done']), r['of'], r['xp'], (', %d set on a square no walk reached' % r['unreached']) if r.get('unreached') else '')
    return r

async def do_rooms(br, base, j):
    pg, state, errs = await open_door(br, base, 'deep16/?roam=silverton&lvl=3')
    r = await pg.evaluate(ROOMS); await pg.close(); return {'rooms': r, 'state': state}

CR, LF = chr(13), chr(10)
def apply_map(M):
    src = open(EO.EYES, encoding='utf-8', newline='').read(); rs = EO.rows(src); n = 0; missing = []
    want = {k: v['steps'] for k, v in M.items() if isinstance(v, dict) and v.get('steps')}
    ids = set(r['id'] for r in rs); missing = sorted(set(want) - ids)
    for r in reversed(rs):
        st = want.get(r['id'])
        if not st: continue
        txt = 'steps: [' + ', '.join('[%s, %d, %d, %s]' % (EO.jsq(s[0]), s[1], s[2], EO.jsq(s[3])) for s in st) + ']'
        if 'steps' in r['span']:
            a, b = r['span']['steps']
            if src[a:b] != txt: src = src[:a] + txt + src[b:]; n += 1
            continue
        a, b = r['span']['url']; nl = src.index(LF, b)
        if src[b:nl].strip() not in (',', ''): # (a row whose url ends it on the same line: the steps go after the url, on that line)
            src = src[:b] + ', ' + txt + src[b:]; n += 1; continue
        eol = CR + LF if src[nl - 1] == CR else LF
        src = src[:nl + 1] + '      ' + txt + ',' + eol + src[nl + 1:]; n += 1
    open(EO.EYES, 'w', encoding='utf-8', newline='').write(src)
    rs2 = EO.rows(src); assert [r['id'] for r in rs2] == [r['id'] for r in rs], 'the rows moved'
    return n, missing

def main(a):
    cmd = a[0] if a else 'help'
    if cmd == 'apply':
        mp = a[a.index('--map') + 1] if '--map' in a else os.path.join(lab(), 'steps.json')
        M = json.load(open(mp, encoding='utf-8')); n, missing = apply_map(M)
        print('apply: %d rows written or changed; %d judged no steps; %s' % (n, sum(1 for v in M.values() if isinstance(v, dict) and v.get('na')), ('NOT IN THE FILE: ' + ' '.join(missing)) if missing else 'every id in the file'))
        return 1 if missing else 0
    rows = load_rows()
    if cmd == 'harvest':
        sel = pick(rows, a); jobs = [r for r in sel if '--all' in a or floor_door(r['url'])]
        skipped = [r['id'] for r in sel if r not in jobs]
        print('harvest: %d rows opened, %d skipped (no floor at their door)' % (len(jobs), len(skipped)))
        res = asyncio.run(run_many(jobs, do_harvest))
        out = a[a.index('--out') + 1] if '--out' in a else os.path.join(lab(), 'harvest.json')
        old = json.load(open(out, encoding='utf-8')) if os.path.exists(out) else {}
        old.update(res); json.dump(old, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('written %s (%d rows in it)' % (out, len(old))); return 0
    if cmd == 'rooms':
        res = asyncio.run(run_many([{'id': 'rooms'}], do_rooms))
        out = a[a.index('--out') + 1] if '--out' in a else os.path.join(lab(), 'rooms.json')
        json.dump(res['rooms'].get('rooms', res['rooms']), open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); print('written %s' % out); return 0
    if cmd in ('check', 'walk'):
        sel = [r for r in pick(rows, a) if r['steps']]
        print('%s: %d rows with steps' % (cmd, len(sel)))
        res = asyncio.run(run_many(sel, do_check if cmd == 'check' else do_walk))
        bad = 0
        rooms = {}
        rp = os.path.join(lab(), 'rooms.json')
        if os.path.exists(rp): rooms = json.load(open(rp, encoding='utf-8'))
        for rid, r in sorted(res.items()):
            if cmd == 'check':
                if 'err' in r: print('FAIL %s: %s' % (rid, r['err'])); bad += 1; continue
                for s in r['steps']:
                    if s.get('note', '').startswith('room'):
                        ok = any(0 <= s['s'][1] < rm.get('w', 0) and 0 <= s['s'][2] < rm.get('h', 0) for rm in rooms) if rooms else True
                        if not ok: print('FAIL %s: %s outside every room' % (rid, s['s'])); bad += 1
                    elif s['here'] and not (s['inBounds'] and (s['reached'] or s.get('stand'))): print('FAIL %s: %s %s' % (rid, s['s'], s.get('note', '') or ('in bounds %s, reached %s, standable %s' % (s['inBounds'], s['reached'], s.get('stand'))))); bad += 1
                    elif s['here'] and not s['reached']: print('warn %s: %s standable, not reached from where the door stands the party (behind a door?)' % (rid, s['s']))
            else:
                if 'err' in r or len(r.get('done', [])) < r.get('of', 1) or not r.get('xp'): print('FAIL %s: %s' % (rid, json.dumps(r)[:400])); bad += 1
        print('EYESSTEPS %s %d rows, %s' % (cmd, len(res), 'all ok' if not bad else '%d FAILED' % bad))
        return 1 if bad else 0
    print(__doc__); return 2

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

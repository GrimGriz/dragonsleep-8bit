"""Silverton city map v6 -> the grid's town (the Silverton roam seat, 2026-10-20). Griz, to the lanes desk: "yes v6" (true scale from the
city map, `TarlynsPit/map/silverton-city-map-v6.html`, drawn by its own code at 1 px = 1 ft -- its scale bar is drawn at half and reads 2 ft
a pixel: ignore the bar).

v6 draws itself with a seeded random (its every house, shack, stall and alley the same each time), so nothing is traced: this runs v6's own
script in the bench's headless Chromium with a recorder patched into each drawing call, and writes what it drew -- in feet, v6's own pixels --
to deep16/data/silverton-v6.js (`D16.TOWN_V6`). deep16/js/town.js lays the grid's squares from that at the door.

  python tools/silverton_v6.py            write deep16/data/silverton-v6.js
  python tools/silverton_v6.py check      print the counts only (nothing written)
"""
import json, os, re, subprocess, sys, tempfile, html as H

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'dev'))
import bench16

def find_v6():
    d = ROOT
    for _ in range(8): # (the realm sits beside the game's folder; a worktree is a few folders further in)
        p = os.path.join(d, 'TarlynsPit', 'map', 'silverton-city-map-v6.html')
        if os.path.exists(p): return p
        d = os.path.dirname(d)
    sys.exit('silverton-city-map-v6.html not found above ' + ROOT)

# each drawing call v6 makes, recorded as it is made: (the text in v6, what goes in its place); every one must match exactly once
PATCHES = [
    ('function bldg(x,y,w,h,roof,rot){', 'function bldg(x,y,w,h,roof,rot){__R.bldg.push([x,y,w,h,rot||0]);'),
    ('ctx.rotate(SHAFT_ANGLE+(rnd()-0.5)*0.07);', 'const __a=SHAFT_ANGLE+(rnd()-0.5)*0.07;__R.shack.push([cx,cy,w,h,__a]);ctx.rotate(__a);'),
    ('function street(pts,w){', 'function street(pts,w){__R.street.push([pts,w]);'),
    ('function plaza(x,y,w,h){', 'function plaza(x,y,w,h){__R.plaza.push([x,y,w,h]);'),
    ("function road(pts,width,dash,col='rgba(110,38,22,0.92)'){", "function road(pts,width,dash,col='rgba(110,38,22,0.92)'){__R.road.push([pts,width]);"),
    ('function gatepost(x,y){', 'function gatepost(x,y){__R.gate.push([x,y]);'),
    ('function headframe(x,y,s){', 'function headframe(x,y,s){__R.headframe.push([x,y,s]);'),
    ('ctx.rotate((rnd()-0.5)*0.5);', 'const __s=(rnd()-0.5)*0.5;__R.stall.push([x,y,w,h,__s]);ctx.rotate(__s);'),
    ('const cx=AX, cy=1400, r=178;', 'const cx=AX, cy=1400, r=178;__R.hexagon=[cx,cy,r];'),
    ('const tx=148,ty=402;', 'const tx=148,ty=402;__R.tower=[tx,ty];'),
    ("function label(x,y,txt,cls='site',anchor){", "function label(x,y,txt,cls='site',anchor){__R.label.push([x,y,txt,cls]);"),
    ('function column(cx,rows){', 'function column(cx,rows){__R.key.push(rows);'),
    ('const ALLEY=[];', 'const ALLEY=[];__R.alley=ALLEY;__R.shaftAxes={umin:umin,umax:umax,vmin:vmin,vmax:vmax,ROWH:ROWH,LANE:LANE};'),
]
RX = [ # (consts inside v6's closures, kept as they stand)
    (r'(const pts=\[\[1990,470\][^;]*;)', r'\1__R.stockade=pts;'),
    (r'(const rp=\[\[1960,352\][^;]*;)', r'\1__R.river=rp;'),
]
DUMP = r"""<script>
(function(){
  var o = { W: W, H: H, MH: MH, EDW: EDW, EDTOP: EDTOP, EDBOT: EDBOT, AX: AX, FS_Y: FS_Y, FOUNT: FOUNT, PINS: PINS, SHAFT_POLY: SHAFT_POLY, SHAFT_ANGLE: SHAFT_ANGLE };
  Object.keys(__R).forEach(function (k) { o[k] = __R[k]; });
  var r1 = function (v) { return typeof v === 'number' ? Math.round(v * 10) / 10 : Array.isArray(v) ? v.map(r1) : v && typeof v === 'object' ? Object.keys(v).reduce(function (a, k) { a[k] = r1(v[k]); return a; }, {}) : v; };
  var pre = document.createElement('pre'); pre.textContent = 'TOWNV6 ' + JSON.stringify(r1(o)); document.body.appendChild(pre);
})();
</script>"""

def extract():
    src = open(find_v6(), encoding='utf-8').read()
    src = re.sub(r'base64,[A-Za-z0-9+/=]+', 'base64,', src) # (its fonts: nothing here draws text that matters)
    scripts = re.findall(r'<script>(.*?)</script>', src, re.S)
    main = [s for s in scripts if 'const W=2520' in s]
    if len(main) != 1: sys.exit('v6: its drawing script not found (%d)' % len(main))
    js = main[0]
    for a, b in PATCHES:
        n = js.count(a)
        if n != 1: sys.exit('v6 changed: %r matches %d times' % (a, n))
        js = js.replace(a, b)
    for a, b in RX:
        js, n = re.subn(a, b, js)
        if n != 1: sys.exit('v6 changed: %r matches %d times' % (a, n))
    body = src[src.index('<body'):src.index('<script>')] # (its stage: the canvas and the overlay it draws on)
    page = ('<!doctype html><html><head><meta charset="utf-8"></head>' + body.split('>', 1)[1] +
            "<script>window.__R={bldg:[],shack:[],street:[],plaza:[],road:[],gate:[],headframe:[],stall:[],label:[],key:[]};" +
            "window.onerror=function(m,s,l){var p=document.createElement('pre');p.textContent='LOADERR '+m+' @ '+l;document.body.appendChild(p);};</script>\n" +
            '<script>' + js + '</script>\n' + DUMP + '</body></html>')
    tmp = tempfile.mkdtemp(prefix='townv6-')
    f = os.path.join(tmp, 'v6.html'); open(f, 'w', encoding='utf-8').write(page)
    cmd = [bench16.EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files'] + bench16.EXTRA + ['--user-data-dir=' + os.path.join(tmp, 'prof'), '--dump-dom', 'file:///' + f.replace('\\', '/')]
    p = subprocess.run(cmd, capture_output=True, timeout=300)
    import shutil; shutil.rmtree(tmp, ignore_errors=True)
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'TOWNV6 (\{.*?\})</pre>', dom, re.S)
    if not m: sys.exit('v6 ran with no result: %s' % (re.findall(r'LOADERR ([^<]*)', dom)[:3] or dom[-400:]))
    return json.loads(H.unescape(m.group(1)))

def main(argv):
    o = extract()
    counts = {k: len(v) for k, v in o.items() if isinstance(v, list)}
    print('v6:', ', '.join('%s %d' % kv for kv in sorted(counts.items())))
    if argv[:1] == ['check']: return 0
    out = os.path.join(ROOT, 'deep16', 'data', 'silverton-v6.js')
    head = ('// Silverton city map v6, as its own code draws it (tools/silverton_v6.py -- run it again if v6 changes; never edit by hand): every house (bldg: x, y, w, h,\n'
            '// its turn), the Shaft Rows\' shacks (shack: the centre, w, h, the turn), streets and roads (the points, the width), plazas, gates, headframes, stalls,\n'
            '// the Hexagon, the stockade, the river, the pins and the key -- in feet, v6\'s own pixels (1 px = 1 ft; y runs south). deep16/js/town.js lays the squares.\n')
    open(out, 'w', encoding='utf-8', newline='\r\n').write(head + 'window.D16.TOWN_V6 = ' + json.dumps(o, separators=(',', ':'), ensure_ascii=False) + ';\n')
    print('wrote', os.path.relpath(out, ROOT), os.path.getsize(out), 'bytes')
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

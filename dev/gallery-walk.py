"""Walks the spell gallery (deep16/js/gallery.js D.fxGallery) once per spell, headless, and prints each spell's cards as JSON.
  python dev/gallery-walk.py [raw=1] [only=a,b]   (raw=1: the foes as they were before 10-02's normies -- diff the two runs)"""
import json, os, re, subprocess, sys, tempfile, importlib.util, html as H
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('b', os.path.join(HERE, 'bench16.py')); b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
args = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a)
probe = r"""<script>
var D=window.D16;D.sfx=function(){};D.music=function(){};D.clip=function(u,d){if(d)d();};
var q=location.search,out={spells:{},errors:[]};
window.onerror=function(m){out.errors.push(String(m));};
try{
var B=D.fxGallery('?fxgallery'+(/[?&]only=([^&]*)/.test(q)?'&only='+RegExp.$1:'')+(/[?&]raw=1/.test(q)?'&raw':''));D.battle=B;D.seed=5;B.enter();
var S=B.gallery,v,n=0,g=0;
while(B.co&&n<S.ids.length&&g++<4000000){
 var r=B.co.next(v);v=undefined;if(r.done)break;var y=r.value;
 if(typeof y==='number'||!y)continue;if(y.fx||y.entry||y.scene)continue;
 if(y.prompt){v=y.prompt.opts[0].value;continue;}
 if(y.gallery){var id=S.ids[S.i];var L=(B.logEntries||[]).map(function(e){return e.text}).filter(function(l){return !/^R\d+ (\d+ \/ \d+ |left\/right)/.test(l)});
  out.spells[id]=L.slice(-10).map(function(l){return l.slice(0,170)});B.logEntries.length=0;n++;v=1;}
}
out.done=n;out.total=S.ids.length;
}catch(e){out.errors.push(String(e&&e.stack||e).slice(0,600));}
var p=document.createElement('pre');p.textContent='GW '+JSON.stringify(out);document.body.appendChild(p);
</script>"""
page = b.build_page()
html = open(page, encoding='utf-8').read().replace('<script src="bench16.js"></script>', probe)
out = os.path.join(HERE, 'gw-%d.html' % os.getpid()); open(out, 'w', encoding='utf-8').write(html); os.remove(page)
url = 'file:///' + out.replace(chr(92), '/') + '?' + '&'.join('%s=%s' % kv for kv in args.items())
prof = tempfile.mkdtemp()
try:
    p = subprocess.run([b.EDGE, '--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--dump-dom', url], capture_output=True, timeout=900)
finally:
    os.remove(out)
m = re.search(r'GW (\{.*\})</pre>', p.stdout.decode('utf8', 'replace'), re.S)
print(m and H.unescape(m.group(1)) or 'NO RESULT')

"""A dev-only catcher (09-28; the pane's screenshot times out when it isn't drawing): run it in the background, then in the page
   fetch('http://127.0.0.1:8977/save?name=x', {method: 'POST', body: canvas.toDataURL('image/png')}) and Read dev/shots/x.png.
   : the page POSTs a canvas data URL to http://localhost:8977/save?name=x, it lands as shots/x.png."""
import base64, os, re
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots')  # dev/shots/ (gitignored with dev/)
os.makedirs(OUT, exist_ok=True)
class H(BaseHTTPRequestHandler):
    def do_POST(self):
        q = parse_qs(urlparse(self.path).query)
        name = re.sub(r'[^\w\-]', '_', (q.get('name') or ['shot'])[0])
        body = self.rfile.read(int(self.headers.get('Content-Length', 0))).decode('ascii', 'ignore')
        data = body.split(',', 1)[1] if ',' in body else body
        open(os.path.join(OUT, name + '.png'), 'wb').write(base64.b64decode(data))
        self.send_response(200); self.send_header('Access-Control-Allow-Origin', '*'); self.end_headers(); self.wfile.write(b'ok')
    def do_OPTIONS(self):
        self.send_response(204); self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', '*'); self.end_headers()
    def log_message(self, *a): pass
HTTPServer(('127.0.0.1', 8977), H).serve_forever()

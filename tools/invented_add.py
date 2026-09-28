"""Add one-line entries to invented.json, and append a dated note to existing ones, without re-dumping the file (its law: one
line each; patch a line, never re-dump). Usage: python tools/invented_add.py <patch.json>, where the patch is
  {"add": [{"id": ..., "what": ..., "why": ...}, ...], "append": {"<id>": {"what": " ...", "why": " ..."}}}
An id already present is refused (append to it instead)."""
import io, json, re, sys

P = 'invented.json'


def main(patch_path):
    patch = json.load(io.open(patch_path, encoding='utf-8'))
    src = io.open(P, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in src else '\n'
    lines = src.split(nl)
    ids = {}
    last = None
    for i, ln in enumerate(lines):
        m = re.match(r'^(\s*)(\{\s*"id":.*\})(,?)\s*$', ln)
        if m:
            rec = json.loads(m.group(2))
            ids[rec['id']] = i
            last = i
    for k, add in (patch.get('append') or {}).items():
        i = ids[k]
        m = re.match(r'^(\s*)(\{.*\})(,?)\s*$', lines[i])
        rec = json.loads(m.group(2))
        for f, v in add.items():
            rec[f] = rec.get(f, '') + v
        lines[i] = m.group(1) + json.dumps(rec, ensure_ascii=False) + m.group(3)
    new = []
    for rec in patch.get('add') or []:
        if rec['id'] in ids:
            raise SystemExit('already there: ' + rec['id'])
        new.append('    ' + json.dumps(rec, ensure_ascii=False))
    if new:
        if not lines[last].rstrip().endswith(','):
            lines[last] = lines[last].rstrip() + ','
        body = (',' + nl).join(new)
        lines.insert(last + 1, body)
    io.open(P, 'w', encoding='utf-8', newline='').write(nl.join(lines))
    json.load(io.open(P, encoding='utf-8'))  # still JSON
    print('invented.json: +%d entries, %d appended' % (len(new), len(patch.get('append') or {})))


if __name__ == '__main__':
    main(sys.argv[1])

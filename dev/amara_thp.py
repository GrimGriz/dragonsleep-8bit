import json, re
d = json.load(open('deep16-play-record-2026-09-29-1348.json', encoding='utf-8'))
f = d['fights'][6]
lg = f['log']; lg = lg if isinstance(lg, list) else str(lg).split('\n')
for i, l in enumerate(lg):
    l = l if isinstance(l, str) else json.dumps(l)
    if re.search(r'Amara', l): print(i, l[:190])

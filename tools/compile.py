"""DRAGONSLEEP data compile.

content/*.json + content/maps/*.json  ->  data/data.js (window.DS_DATA, loads from file://)
                                       ->  data/game-data.json (the same, for reading)

Checks as it goes:
  * every record cites its source ('src'), per spec section 6
  * register paths named in 'src' exist (warns; set DS_REGISTER to the TarlynsPit folder)
  * monster CR -> XP by the SRD table
  * maps: warps point at real maps, npcs have dialogue, shop/keeper ids exist, script names exist
  * every text key the scripts use exists

Run:  python tools/mapgen.py && python tools/compile.py
"""
import json, os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(ROOT, 'content')
REGISTER = os.environ.get('DS_REGISTER') or os.path.join(os.path.dirname(ROOT), 'TarlynsPit')
LAB = os.path.join(os.path.dirname(REGISTER), 'the-lab')
CR_XP = {'0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900}

errors, warnings = [], []


def load(name):
    with open(os.path.join(C, name), encoding='utf-8') as f:
        return json.load(f)


def strip(d):
    return {k: v for k, v in d.items() if not k.startswith('_')}


def need_src(kind, key, rec):
    if not rec.get('src'):
        errors.append('%s %s: no src' % (kind, key))


PATH_RE = re.compile(r'((?:[\w.\-]+/)*[\w.\-]+\.(?:md|json|png|pdf|jpg|py))')


def check_paths(src):
    if not os.path.isdir(REGISTER):
        return
    for s in (src if isinstance(src, list) else [src]):
        for p in PATH_RE.findall(str(s)):
            if p.startswith('content/') or p.startswith('invented.json') or 'handoff-2026-09-23' in p:
                continue
            cands = [os.path.join(REGISTER, p), os.path.join(LAB, p), os.path.join(os.path.dirname(REGISTER), p),
                     os.path.join(REGISTER, 'wiki', p), os.path.join(REGISTER, 'WarrensModule', p), os.path.join(REGISTER, 'GalleriesModule', p),
                     os.path.join(os.path.dirname(REGISTER), 'the-lab', 'pit-maps', os.path.basename(p))]
            if not any(os.path.exists(c) for c in cands):
                warnings.append('src path not found: %s' % p)


def main():
    config = load('config.json')
    heroes = strip(load('heroes.json'))
    items = strip(load('items.json'))
    spells = strip(load('spells.json'))
    monsters = strip(load('monsters.json'))
    encounters = strip(load('encounters.json'))
    shops = strip(load('shops.json'))
    npcs = strip(load('npcs.json'))
    text = strip(load('text.json'))
    rumors = load('rumors.json')
    quests = load('quests.json')

    for kind, table in (('hero', heroes), ('item', items), ('spell', spells), ('monster', monsters), ('encounter', encounters),
                        ('shop', shops), ('npc', npcs), ('text', text)):
        for k, rec in table.items():
            rec['id'] = k
            need_src(kind, k, rec)
            check_paths(rec.get('src', ''))
    for r in rumors:
        need_src('rumor', r['id'], r); check_paths(r['src'])
    for q in quests:
        need_src('quest', q['id'], q)
    need_src('config', 'config', config)

    for k, m in monsters.items():
        m['xp'] = CR_XP[m['cr']]
        for a in m.get('multi', []):
            if a not in m['attacks']:
                errors.append('monster %s: multi names unknown attack %s' % (k, a))
        for grp in m.get('choose', []):
            for a in grp:
                if a not in m['attacks']:
                    errors.append('monster %s: choose names unknown attack %s' % (k, a))
        for d in m.get('drops', []):
            if d['item'] not in items:
                errors.append('monster %s drops unknown item %s' % (k, d['item']))
    for z, e in encounters.items():
        for g in e['groups']:
            for row in g['e']:
                if row[0] not in monsters:
                    errors.append('encounter %s: unknown monster %s' % (z, row[0]))
    for k, h in heroes.items():
        for slot, it in h['equip'].items():
            if it and it not in items:
                errors.append('hero %s: unknown item %s' % (k, it))
        for s in h.get('spells', []):
            if s not in spells:
                errors.append('hero %s: unknown spell %s' % (k, s))
        for lv, lu in h.get('levels', {}).items():
            for s in lu.get('learn', []):
                if s not in spells:
                    errors.append('hero %s: level %s learns unknown spell %s' % (k, lv, s))
    for k, s in shops.items():
        for it in s.get('items', []):
            if it not in items:
                errors.append('shop %s: unknown item %s' % (k, it))
    for s in config['startItems']:
        if s[0] not in items:
            errors.append('config: unknown start item %s' % s[0])

    # scripts and text keys used by the engine
    js = ''
    for f in glob.glob(os.path.join(ROOT, 'js', '*.js')):
        with open(f, encoding='utf-8') as fh:
            js += fh.read()
    scripts = set(re.findall(r"\bS\.(\w+)\s*=\s*function", js)) | set(re.findall(r"\bS\['([\w:]+)'\]\s*=", js))
    for key in set(re.findall(r"\bL\('([\w.]+)'", js)):
        if key not in text and not key.endswith('.'):
            errors.append('text key used by scripts but missing: %s' % key)
    for key in set(re.findall(r"'((?:renown|w|g|g1|g3|g4|hex|inn|lake|due|road|gulch)\.[\w.]+)'", js)):
        if key not in text and not key.startswith('hex.intro'):
            warnings.append('possible text key not in text.json: %s' % key)
    for c in ('brawl', 'freeman', 'card', 'talmok', 'festival'):
        if 'hex.intro.' + c not in text:
            errors.append('missing text hex.intro.%s' % c)
    for k, n in npcs.items():
        if n.get('script') and n['script'] not in scripts:
            errors.append('npc %s: unknown script %s' % (k, n['script']))
        for r in n.get('rumors', []):
            if r not in {x['id'] for x in rumors}:
                errors.append('npc %s: unknown rumor %s' % (k, r))
        for br in n.get('talk', []):
            for r in ([br['rumor']] if isinstance(br.get('rumor'), str) else br.get('rumor', [])):
                if r not in {x['id'] for x in rumors}:
                    errors.append('npc %s: unknown rumor %s' % (k, r))

    # maps
    maps = {}
    for f in sorted(glob.glob(os.path.join(C, 'maps', '*.json'))):
        with open(f, encoding='utf-8') as fh:
            m = json.load(fh)
        maps[m['id']] = m
    for mid, m in maps.items():
        for w in m.get('warps', []):
            if w['to'] not in maps:
                errors.append('map %s: warp to unknown map %s' % (mid, w['to']))
            else:
                t = maps[w['to']]
                if not (0 <= w['tx'] < len(t['rows'][0]) and 0 <= w['ty'] < len(t['rows'])):
                    errors.append('map %s: warp target off-map %s' % (mid, w))
        for e in (m.get('exits') or {}).values():
            if e['to'] not in maps:
                errors.append('map %s: exit to unknown map %s' % (mid, e['to']))
        for n in m.get('npcs', []):
            if n['id'] not in npcs:
                errors.append('map %s: npc %s has no dialogue in npcs.json' % (mid, n['id']))
        for t in m.get('triggers', []):
            sc = t['script']
            if sc not in scripts and sc != 'warp':
                errors.append('map %s: trigger %s uses unknown script %s' % (mid, t['id'], sc))
            if sc == 'keeper' and t.get('arg') not in npcs:
                errors.append('map %s: keeper door %s has no npc entry' % (mid, t.get('arg')))
            if sc in ('shop', 'inn') and t.get('arg') not in shops:
                errors.append('map %s: shop door %s has no shop entry' % (mid, t.get('arg')))
            if sc == 'warp' and t.get('to') not in maps:
                errors.append('map %s: warp door to unknown map %s' % (mid, t.get('to')))
        for s in m.get('signs', []):
            check_paths(s.get('src', ''))
            if not s.get('src'):
                errors.append('map %s: sign at %s,%s has no src' % (mid, s['x'], s['y']))
        for c in m.get('chests', []):
            if c.get('item') and c['item'] not in items:
                errors.append('map %s: chest item %s unknown' % (mid, c['item']))
        for z in m.get('zones', []):
            if z['zone'] and z['zone'] not in encounters:
                errors.append('map %s: zone %s unknown' % (mid, z['zone']))
    st = config['start']
    if st['map'] not in maps:
        errors.append('config start map unknown')

    data = {
        'config': strip(config), 'heroes': heroes, 'items': items, 'spells': spells, 'monsters': monsters, 'encounters': encounters,
        'shops': shops, 'npcs': npcs, 'text': text, 'rumors': rumors, 'rumorMap': {r['id']: r for r in rumors}, 'quests': quests,
        'maps': maps, 'credits': config['credits'],
    }
    for w in sorted(set(warnings)):
        print('warn:', w)
    if errors:
        for e in errors:
            print('ERROR:', e)
        sys.exit(1)
    os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
    blob = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(ROOT, 'data', 'data.js'), 'w', encoding='utf-8') as f:
        f.write('/* DRAGONSLEEP compiled data - generated by tools/compile.py from content/. Do not edit. */\nwindow.DS_DATA=' + blob + ';\n')
    with open(os.path.join(ROOT, 'data', 'game-data.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    # stamp a content hash onto every script tag so browsers (and Pages) never run stale code
    import hashlib
    hsh = hashlib.sha1()
    for f in sorted(glob.glob(os.path.join(ROOT, 'js', '*.js'))) + [os.path.join(ROOT, 'data', 'data.js')]:
        with open(f, 'rb') as fh:
            hsh.update(fh.read())
    ver = hsh.hexdigest()[:10]
    idx = os.path.join(ROOT, 'index.html')
    with open(idx, encoding='utf-8') as fh:
        html = fh.read()
    html2 = re.sub(r'(<script src="(?:js|data)/[\w.-]+\.js)(?:\?v=\w+)?(")', lambda m: m.group(1) + '?v=' + ver + m.group(2), html)
    if html2 != html:
        with open(idx, 'w', encoding='utf-8', newline=chr(10)) as fh:
            fh.write(html2)
    print('ok: %d maps, %d npcs, %d monsters, %d items, %d spells, %d text records, %d rumors -> data/data.js (%d KB)' % (
        len(maps), len(npcs), len(monsters), len(items), len(spells), len(text), len(rumors), len(blob) // 1024))


if __name__ == '__main__':
    main()

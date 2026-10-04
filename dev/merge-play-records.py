"""dev/: fold the tester ladder's saved play records into one file, each fight once.

Every R on the tester ladder writes the whole kept record (js/record.js REC.save), so two saves share their fights. This reads each
deep16-play-record*.json in play-records/ (the combined file too, so a re-run folds new saves into it), keeps one copy of each fight
(a fight is its `fight` id and its `started` stamp, as js/record.js writes them), the fuller copy when two differ (one with its full log,
then the later `ended`, then the more steps), sorts them by `started`, and writes play-records/deep16-play-records-combined.json.
The files it folded move to play-records/merged/ (nothing is deleted); --keep leaves them where they are; --dry-run only counts.

    python dev/merge-play-records.py [--keep] [--dry-run]
"""
import glob, json, os, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
DIR = os.path.join(ROOT, 'play-records')
OUT = os.path.join(DIR, 'deep16-play-records-combined.json')
WHAT = 'DEEP16 play record: ?ladder&party=ours, the player running our four (js/record.js)'


def fuller(a, b):
    """the better copy of one fight"""
    ka = ('log' in a, a.get('ended') or '', len(a.get('steps') or []))
    kb = ('log' in b, b.get('ended') or '', len(b.get('steps') or []))
    return a if ka >= kb else b


def main(argv):
    keep, dry = '--keep' in argv, '--dry-run' in argv
    files = sorted(glob.glob(os.path.join(DIR, 'deep16-play-record*.json')))
    if not files:
        print('no play records in', DIR); return 1
    seen, total, sources = {}, 0, []
    for f in files:
        d = json.load(open(f, encoding='utf-8'))
        fights = d.get('fights') or []
        sources.append({'file': os.path.basename(f), 'saved': d.get('saved'), 'fights': len(fights)})
        for x in fights:
            total += 1
            k = (x.get('fight'), x.get('started'))
            seen[k] = fuller(seen[k], x) if k in seen else x
    merged = sorted(seen.values(), key=lambda x: (x.get('started') or '', x.get('fight') or ''))
    print('%d files, %d fights in them, %d once each (%d repeats dropped)' % (len(files), total, len(merged), total - len(merged)))
    if dry: return 0
    # (the new file is written before anything moves)
    body = {'what': WHAT, 'saved': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z'),
            'merged': {'from': sources, 'fights': len(merged), 'repeats dropped': total - len(merged)}, 'fights': merged}
    tmp = OUT + '.tmp'
    json.dump(body, open(tmp, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    os.replace(tmp, OUT)
    print('wrote', os.path.relpath(OUT, ROOT))
    if not keep:
        dest = os.path.join(DIR, 'merged'); os.makedirs(dest, exist_ok=True)
        for f in files:
            if os.path.abspath(f) == os.path.abspath(OUT): continue
            to = os.path.join(dest, os.path.basename(f))
            if os.path.exists(to): print('already in merged/, left:', os.path.basename(f)); continue
            os.replace(f, to)
        print('the folded files are in play-records/merged/')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

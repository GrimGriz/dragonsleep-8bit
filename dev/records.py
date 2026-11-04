"""dev/: his play records read for a desk -- the fights new since a stamp, once each, as text a reader can take a slice of.

The play records lane 5 (11-03 night): the 11-03 records desk's scratch parse made a repo tool, so any seat runs it. His files land in
play-records/ (gitignored, his; names carry his LOCAL clock, the JSON's `saved`/`at` is UTC). Every save re-writes what the browser kept,
so one fight is in several files: a fight is its `started` stamp, and the fuller copy wins (merge-play-records.py's rule: the one with its
full log, then the later `ended`, then the more steps).

    python dev/records.py list
        every file by kind: its saved stamp (UTC), its fights, the newest fight's start -- to pick SINCE
    python dev/records.py new SINCE [--slices N] [--out DIR]
        SINCE: a UTC stamp (2026-11-03, 2026-11-03T13:12Z, 2026-11-03T13:12:46.123Z) -- every fight started at or after it; or a file in
        play-records/ -- every fight in no file saved up to that one's `saved` (the desk's "dedupe against every older record").
        Writes to DIR (default: the system temp's records-<since>/): slice-<i>-of-<N>.txt, N slices balanced by size in time order (a
        reader a slice), each fight with its head (door, name, level, result, rounds, ended, its steps by kind, the files it is in), its
        Pocket DM card matched by `started` (q, foes, CR, difficulty, rung, his NOTES on it), his second-game NOTES written during it (a
        NOTES stamp names the fight in front by its `started`, since 11-03 night), PARTY / PARTY END / OPENING and the
        transcript (the log when there is none); and notes.txt -- his NOTES (hero_situations_feedback-*) saved since, the new lines of
        each save only (every save re-sends the whole box; one that shares no start with the last is his own clear, written whole).

Reading the transcripts (the memory feedback-read-his-play-record): lines printed ABOVE a turn's `== R<n> <who>` header belong to that
turn; a step `REFUSED: ...` is a click the game turned away, `(the AI's turn)` a watched fight's turn of ours (js/record.js, 11-03 night).
"""
import datetime, glob, json, os, re, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)


def records_dir():
    """play-records/ beside this checkout -- or, run from a worktree (which has none: it is gitignored), the main checkout's"""
    if os.environ.get('RECORDS_DIR'): return os.environ['RECORDS_DIR']  # (another folder: a test's, or a copy)
    d = os.path.join(ROOT, 'play-records')
    if os.path.isdir(d): return d
    try:
        import subprocess
        common = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--git-common-dir'], capture_output=True, text=True).stdout.strip()
        if common:
            m = os.path.join(os.path.dirname(os.path.abspath(os.path.join(ROOT, common))), 'play-records')
            if os.path.isdir(m): return m
    except Exception:
        pass
    return d


DIR = records_dir()


def load(p):
    try:
        with open(p, encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print('  (unreadable: %s -- %s)' % (os.path.basename(p), e)); return None


def kind(name):
    for k in ('deep16-play-record', 'pocket-dm-fights', 'pocket-dm-campaign', 'pocket-dm-table', 'pocket-party', 'pocket-module',
              'hero_situations_feedback', 'situations-ear-file', 'realm-hexmap', 'review-realm-hexmap'):
        if name.startswith(k): return k
    if name.startswith('pocket-dm-'): return 'pocket-dm'
    return 'other'


def files():
    out = []
    for p in glob.glob(os.path.join(DIR, '*.json')) + glob.glob(os.path.join(DIR, 'merged', '*.json')):
        out.append(p)
    return sorted(out)


def fights_of(p, d):
    """(record, card) pairs a file carries: a play record's fights, the Pocket DM's kept fights with their cards, one Pocket DM fight"""
    k = kind(os.path.basename(p))
    if not isinstance(d, dict): return []
    if k == 'deep16-play-record':
        return [(x, None) for x in d.get('fights') or [] if isinstance(x, dict) and x.get('started')]
    if k == 'pocket-dm-fights':
        return [(x.get('record'), x.get('fight')) for x in d.get('fights') or [] if isinstance(x, dict)]
    if k == 'pocket-dm' and ('record' in d or 'fight' in d):
        return [(d.get('record'), d.get('fight'))]
    return []


def fuller(a, b):
    ka = ('log' in a, a.get('ended') or '', len(a.get('steps') or []))
    kb = ('log' in b, b.get('ended') or '', len(b.get('steps') or []))
    return a if ka >= kb else b


def stamp(s):
    """a UTC stamp as js/record.js writes `started` (toISOString), so the strings compare"""
    s = s.strip().rstrip('Z')
    for f in ('%Y-%m-%dT%H:%M:%S.%f', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M', '%Y-%m-%dT%H%M', '%Y-%m-%d'):
        try:
            t = datetime.datetime.strptime(s, f)
            return t.strftime('%Y-%m-%dT%H:%M:%S.') + '%03dZ' % (t.microsecond // 1000)
        except ValueError:
            pass
    raise SystemExit('SINCE: not a stamp or a file in play-records/: ' + s)


def saved_of(p, d):
    if isinstance(d, dict):
        for k in ('saved', 'at'):
            if isinstance(d.get(k), str): return d[k]
    return datetime.datetime.fromtimestamp(os.path.getmtime(p), datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')


def cmd_list():
    rows = []
    for p in files():
        d = load(p); fs = fights_of(p, d)
        st = [r.get('started') for r, c in fs if r and r.get('started')] + [c.get('started') for r, c in fs if c and c.get('started') and not r]
        mark = ('  %s fresh since %s' % (d.get('fresh'), (d.get('since') or 'none')[:16])) if isinstance(d, dict) and 'fresh' in d else ''  # (a save's own mark, since 11-03 night: REC.marks)
        rows.append((saved_of(p, d), kind(os.path.basename(p)), os.path.relpath(p, DIR), len(fs), max(st) if st else '', mark))
    for r in sorted(rows):
        print('%s  %-26s %-52s %4s fights  newest %s%s' % (r[0][:16] + 'Z', r[1], r[2], r[3] if r[3] else '-', r[4][:19] if r[4] else '-', r[5]))


def head(r, c, where):
    st = r.get('steps') or []
    n_ai = sum(1 for s in st if s.get('ai')); n_rf = sum(1 for s in st if s.get('refused') is not None)
    return ('FIGHT %s  door=%s  name=%s  L%s  result=%s  rounds=%s  ended=%s  steps %d (answers %d, refused %d, AI turns %d)  (in %s)'
            % (r.get('started'), r.get('fight'), r.get('name'), r.get('level'), r.get('result'), r.get('rounds'), r.get('ended'),
               len(st), len(st) - n_ai - n_rf, n_rf, n_ai, ', '.join(sorted(where))))


STAMP = re.compile(r'^-- day .* --$')
IN_FIGHT = re.compile(r'\(started (\d{4}-\d\d-\d\dT[\d:.]+Z)\) --$')


def notes_by_fight():
    """his second-game NOTES written during a fight (since 11-03 night a stamp names the fight in front by its `started`, deep16/js/house.js H.stamp): started -> the notes under it"""
    out = {}
    for p in glob.glob(os.path.join(DIR, 'hero_situations_feedback-*.json')):
        d = load(p)
        if not isinstance(d, dict) or not isinstance(d.get('notes'), str): continue
        cur, block = None, []
        for ln in d['notes'].replace('\r\n', '\n').split('\n') + ['-- day end --']:
            if STAMP.match(ln):
                if cur and block and '\n'.join(block).strip():
                    t = '\n'.join(block).strip()
                    if t not in out.setdefault(cur[0], []): out[cur[0]].append(t)
                m = IN_FIGHT.search(ln); cur = (m.group(1),) if m else None; block = []
            elif cur:
                block.append(ln)
    return out


FIGHT_NOTES = None


def text_of(r, c, where):
    global FIGHT_NOTES
    if FIGHT_NOTES is None: FIGHT_NOTES = notes_by_fight()
    L = ['#' * 100, head(r, c, where)]
    if c:
        L.append('POCKET CARD: q=%s | foes=%s | CR %s, %s | rung %s | result %s | HIS NOTES: %s'
                 % (c.get('q'), c.get('foes'), c.get('cr'), c.get('diff'), c.get('rung'), c.get('result'), json.dumps(c.get('notes') or '', ensure_ascii=False)))
    for t in FIGHT_NOTES.get(r.get('started'), []):
        L.append('HIS NOTES IN THIS FIGHT (the second game\'s NOTES): ' + json.dumps(t, ensure_ascii=False))
    L.append('PARTY: ' + json.dumps(r.get('party'), ensure_ascii=False))
    L.append('PARTY END: ' + json.dumps(r.get('partyEnd'), ensure_ascii=False))
    if r.get('opening'): L.append('OPENING: ' + json.dumps(r.get('opening'), ensure_ascii=False))
    if r.get('errors'): L.append('RECORD ERRORS: ' + json.dumps(r.get('errors'), ensure_ascii=False))
    tr = r.get('transcript') or []
    if tr:
        L.append("--- TRANSCRIPT (lines above a turn's == header belong to THAT turn)")
        L.extend(str(t) for t in tr)
    else:
        L.append('--- (no transcript -- the log:)')
        L.extend(str(t) for t in r.get('log') or [])
    return '\n'.join(L) + '\n'


def notes_since(since):
    fs = []
    for p in glob.glob(os.path.join(DIR, 'hero_situations_feedback-*.json')):
        d = load(p)
        if isinstance(d, dict) and isinstance(d.get('notes'), str): fs.append((d.get('at') or saved_of(p, d), os.path.basename(p), d['notes']))
    fs.sort()
    out, prev = [], ''
    for at, name, txt in fs:
        new = txt[len(prev):] if prev and txt.startswith(prev) else txt
        cleared = bool(prev) and not txt.startswith(prev)
        if at >= since and new.strip():
            out.append('#' * 100 + '\nNOTES %s  (%s)%s\n%s\n' % (at, name, '  -- his own clear: the box whole' if cleared else '  -- the new lines', new.strip('\n')))
        prev = txt
    return out


def cmd_new(args):
    if not args: raise SystemExit(__doc__)
    sv, nsl, out = args[0], 1, None
    if '--slices' in args: nsl = max(1, int(args[args.index('--slices') + 1]))
    if '--out' in args: out = args[args.index('--out') + 1]
    all_f = [(p, load(p)) for p in files() if kind(os.path.basename(p)) in ('deep16-play-record', 'pocket-dm-fights', 'pocket-dm')]
    best, where, cards = {}, {}, {}
    for p, d in all_f:
        for r, c in fights_of(p, d):
            if c and c.get('started'): cards[c['started']] = c
            if not r or not r.get('started'): continue
            k = r['started']; where.setdefault(k, set()).add(os.path.relpath(p, DIR))
            best[k] = fuller(best[k], r) if k in best else r
    sp = os.path.join(DIR, sv) if not os.path.isabs(sv) else sv
    if os.path.isfile(sp):  # a file: every fight in no file saved up to its own save
        cut = saved_of(sp, load(sp)); since = cut
        old = set()
        for p, d in all_f:
            if saved_of(p, d) <= cut:
                old.update(r['started'] for r, c in fights_of(p, d) if r and r.get('started'))
        new = sorted(k for k in best if k not in old)
        tag = os.path.splitext(os.path.basename(sp))[0]
    else:
        since = stamp(sv); new = sorted(k for k in best if k >= since); tag = since[:16].replace(':', '')
    out = out or os.path.join(tempfile.gettempdir(), 'records-' + tag)
    os.makedirs(out, exist_ok=True)
    texts = [text_of(best[k], cards.get(k), where[k]) for k in new]
    total = sum(len(t) for t in texts); nsl = min(nsl, max(1, len(texts)))
    # (the slices in time order with the largest as small as it can be: the least cap that N slices can hold, found by halving, then filled to it --
    # the running-share cut left 44/36/15/65 KB on his 11-03 night's 18 fights)
    sizes = [len(t) for t in texts]

    def fill(cap):
        out, cur, s = [], [], 0
        for t, n in zip(texts, sizes):
            if cur and s + n > cap: out.append(cur); cur, s = [], 0
            cur.append(t); s += n
        if cur: out.append(cur)
        return out
    lo, hi = max(sizes) if sizes else 0, total
    while lo < hi:
        mid = (lo + hi) // 2
        if len(fill(mid)) <= nsl: hi = mid
        else: lo = mid + 1
    slices = fill(lo) if texts else [[]]
    for i, s in enumerate(slices):
        p = os.path.join(out, 'slice-%d-of-%d.txt' % (i + 1, len(slices)))
        with open(p, 'w', encoding='utf-8') as f: f.write(''.join(s))
        print('%s  %d fights  %d KB' % (p, len(s), sum(len(t) for t in s) // 1000))
    nt = notes_since(since)
    p = os.path.join(out, 'notes.txt')
    with open(p, 'w', encoding='utf-8') as f: f.write('\n'.join(nt))
    print('%s  %d saves with new lines' % (p, len(nt)))
    print('records: %d fights new since %s (of %d across %d files); cards for %d' % (len(new), since, len(best), len(all_f), sum(1 for k in new if k in cards)))
    return 0


def main(argv):
    if not argv or argv[0] not in ('list', 'new'): print(__doc__); return 1
    if not os.path.isdir(DIR): print('no play-records/ at', DIR); return 1
    return cmd_list() or 0 if argv[0] == 'list' else cmd_new(argv[1:])


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

"""The scene simulator's REVIEW shelf (deep16/scenes-review.js, one row a line): read it, cut a row, fold his notes into it.

RULED 2026-11-25 (Griz, to the lanes desk, on the scenes seat's three: "15-17, sure"): a seat that writes a new dialog scene adds it to the shelf; a row is cut once he
has noted it in the simulator or said "seen", as an eyes row is -- the fold a rule with no judgement in it, whatever the note says.

    python tools/scenes-review.py list
        the shelf's rows: id and title
    python tools/scenes-review.py check
        every row one line, an id that starts r- and is on no other row, a title, a stage (the probe, dev/scenes-probe.py, plays each)
    python tools/scenes-review.py fold FILE [FILE ...]
        his NOTES saves from the simulator (play-records/hero_situations_feedback-*.json, `from: 'the scene simulator'`): every shelf row he wrote a note on is
        cut, and the PATCHLOG `seen` line for each is printed with his note verbatim (the hash left for the landing to fill); his notes on scenes not on the shelf
        are listed for their lanes. A file of the M menu's or the Pocket DM's is passed over.
    python tools/scenes-review.py cut ID [ID ...]
        his "seen" said in chat: those rows cut, a `seen` line printed for each (his words go in by hand)
Then the desk commits deep16/scenes-review.js with the fold (and the NOTES file copied to receipts/ as an ear file's fold does)."""
import datetime, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE = os.path.join(ROOT, 'deep16', 'scenes-review.js')
ROW = re.compile(r"^\s*\{ id: '([a-z0-9-]+)', title: '((?:[^'\\]|\\.)*)'")
LANE = 'eyes on the screen'


def read():
    with open(FILE, encoding='utf-8', newline='') as f:
        return f.read()


def rows(text=None):
    """[(line index, id, title)] -- a row is a line that opens { id: '...', title: '...'"""
    out = []
    for i, ln in enumerate((text if text is not None else read()).split('\n')):
        m = ROW.match(ln)
        if m: out.append((i, m.group(1), m.group(2).replace("\\'", "'")))
    return out


def problems(text=None):
    text = text if text is not None else read()
    bad, seen = [], {}
    if 'window.SCENES_REVIEW = [' not in text: bad.append('no window.SCENES_REVIEW = [ ... ]')
    lines = text.split('\n')
    for i, rid, title in rows(text):
        ln = lines[i]
        if not rid.startswith('r-'): bad.append('%s: an id on the shelf starts r-' % rid)
        if rid in seen: bad.append('%s: on two rows' % rid)
        seen[rid] = 1
        if not title.strip(): bad.append('%s: no title' % rid)
        if 'stage: {' not in ln: bad.append('%s: no stage on its line (a row is one line)' % rid)
        if not ln.rstrip().endswith(('},', '}')): bad.append('%s: the row runs past its line (a row is one line)' % rid)
    # a line inside the list that is no row: a row split over lines
    body = text.split('window.SCENES_REVIEW = [', 1)[-1].split('\n];', 1)[0]
    for ln in body.split('\n')[1:]:
        if ln.strip() and not ROW.match(ln) and not ln.strip().startswith('//'): bad.append('a line in the list that is not a row: %s' % ln.strip()[:80])
    return bad


def cut(ids):
    text = read(); lines = text.split('\n'); have = {rid: (i, t) for i, rid, t in rows(text)}
    gone = [(rid, have[rid][1]) for rid in ids if rid in have]
    drop = set(have[rid][0] for rid, _ in gone)
    with open(FILE, 'w', encoding='utf-8', newline='') as f:
        f.write('\n'.join(ln for i, ln in enumerate(lines) if i not in drop))
    return gone, [rid for rid in ids if rid not in have]


def seen_line(title, words, src):
    day = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')
    return '- %s · `<hash>` · %s · seen: %s -- on the scene simulator\'s REVIEW shelf (%s) · *"%s"*' % (day, LANE, title, src, words)


def fold(paths):
    shelf = {rid: t for _, rid, t in rows()}
    notes, other = {}, []
    for p in paths:
        try:
            d = json.load(open(p, encoding='utf-8'))
        except Exception as e:
            print('passed over %s: %s' % (p, e)); continue
        if not isinstance(d, dict) or d.get('kind') != 'hero-situations-feedback' or d.get('from') != 'the scene simulator':
            print('passed over %s: not a NOTES save of the scene simulator' % os.path.basename(p)); continue
        for s in d.get('scenes') or []:
            if not isinstance(s, dict) or not str(s.get('note') or '').strip(): continue
            say = ' / '.join(l.strip() for l in str(s['note']).strip().splitlines() if l.strip())
            if s.get('scene') in shelf: notes.setdefault(s['scene'], []).append((say, os.path.basename(p)))
            else: other.append('%s line %s (%s): %s' % (s.get('scene'), s.get('line'), s.get('who') or '-', say))
    gone, _ = cut(list(notes))
    for rid, title in gone:
        print(seen_line(title, ' | '.join(n for n, _ in notes[rid]), notes[rid][0][1]))
    print('cut %d row%s from the shelf: %s' % (len(gone), '' if len(gone) == 1 else 's', ', '.join(r for r, _ in gone) or 'none'))
    if other: print('noted, not on the shelf (for their lanes):\n  ' + '\n  '.join(other))


def main(a):
    if not a or a[0] not in ('list', 'check', 'fold', 'cut'): raise SystemExit(__doc__)
    if a[0] == 'list':
        for _, rid, t in rows(): print('%-14s %s' % (rid, t))
    elif a[0] == 'check':
        bad = problems()
        print(('ok   the REVIEW shelf: %d rows, one a line' % len(rows())) if not bad else 'FAIL the REVIEW shelf: ' + '; '.join(bad))
        sys.exit(1 if bad else 0)
    elif a[0] == 'fold':
        fold(a[1:])
    else:
        gone, missing = cut(a[1:])
        for rid, title in gone: print(seen_line(title, '<his word>', 'his word in chat'))
        if missing: print('not on the shelf: ' + ', '.join(missing))


if __name__ == '__main__':
    main(sys.argv[1:])

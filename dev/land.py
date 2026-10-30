"""The runway: one seat at a time lands on main (10-30, Griz: "i see other seats saying things landed during their gate. Is there a way they
stop when ready and you air-traffic controller them rather than them gating when things are landing?", then "Build the lock").

With four seats live on 10-29 night main took fifteen commits in three hours: a seat's push was refused when another landed during its
two-minute gate, so it rebased and gated again, and its PATCHLOG line's hash went stale on every rebase. The runway is a file in the git
folder every worktree shares (`.git/landing/`): one seat holds it; the rest wait in line by ticket, oldest first. Holding it, a seat
rebases once, writes its records against hashes that will not move again, gates once, and pushes.

  python dev/land.py take [--who NAME] [--wait MIN]   wait in line (8 min at most a call), take the runway, fetch, rebase onto origin/main,
                                                     and print your commits' final hashes -- write the PATCHLOG line against them now
  python dev/land.py push [--all] [--dry-run]         holding it: the quick gate (--all: the full one), push HEAD:main, give the runway back
  python dev/land.py go [same flags]                  take, then push: a landing with no hash to write
  python dev/land.py release                          give the runway back without pushing (your ticket too)
  python dev/land.py status                           who holds it and for how long, who waits
  python dev/land.py break                            the desk's: clear the runway left by a seat that died, and the dead tickets

Run it from your worktree's root, from PowerShell (the gate's benches answer nothing from the Bash sandbox). Exit 0 landed or done;
1 refused, or the gate RED (the runway given back -- fix, then take again); 2 the rebase stopped on a conflict (you still hold the runway:
resolve, `git rebase --continue`, then take again); 3 still in line after --wait (your ticket keeps your place 5 minutes: take again);
4 main moved under the runway, someone pushed without it (you still hold it: take again, and re-point your PATCHLOG hash).
A runway untouched for 20 minutes is free to the next in line: the push itself is still safe, as git refuses a push that is not a
fast-forward.
"""
import json, os, subprocess, sys, time

STALE_RUNWAY = 20 * 60   # (the full gate runs ~5 min, a records commit a few more)
STALE_TICKET = 5 * 60    # (a waiter refreshes its ticket every poll; a seat whose take ran out has this long to take again)
POLL = 5


def git(*args, check=True):
    p = subprocess.run(['git'] + list(args), capture_output=True)
    out = p.stdout.decode('utf-8', 'replace').strip()
    if check and p.returncode:
        sys.exit('land: git %s failed: %s' % (' '.join(args), (p.stderr.decode('utf-8', 'replace').strip() or out)[:400]))
    return out if check else (p.returncode, out)


def here():
    top = git('rev-parse', '--show-toplevel')
    common = git('rev-parse', '--path-format=absolute', '--git-common-dir')
    d = os.path.join(common, 'landing')
    os.makedirs(os.path.join(d, 'tickets'), exist_ok=True)
    return top, d


def key(top):
    return ''.join(c if c.isalnum() else '-' for c in os.path.normcase(os.path.abspath(top)))[-80:]


def read(path):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def write(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f)


def age(t):
    s = int(time.time() - t)
    return '%dm%02ds' % (s // 60, s % 60)


def runway_path(d):
    return os.path.join(d, 'runway.json')


def holder(d):
    return read(runway_path(d))


def mine(r, top):
    return bool(r) and os.path.normcase(r.get('worktree', '')) == os.path.normcase(top)


def tickets(d):
    out, now = [], time.time()
    tdir = os.path.join(d, 'tickets')
    for name in os.listdir(tdir):
        t = read(os.path.join(tdir, name))
        if t is None:
            continue
        t['file'] = os.path.join(tdir, name)
        t['dead'] = now - t.get('seen', 0) > STALE_TICKET
        out.append(t)
    return sorted(out, key=lambda t: t.get('since', 0))


def ticket(d, top, who, branch):
    path = os.path.join(d, 'tickets', key(top) + '.json')
    t = read(path)
    if not t or time.time() - t.get('seen', 0) > STALE_TICKET:   # (a ticket left dead rejoins at the back of the line)
        t = {'who': who, 'branch': branch, 'worktree': top, 'since': time.time()}
    t['seen'] = time.time()
    write(path, t)
    return path


def drop_ticket(d, top):
    try:
        os.remove(os.path.join(d, 'tickets', key(top) + '.json'))
    except OSError:
        pass


def try_take(d, top, who, branch):
    """The runway if it is free (or stale) and this worktree's ticket is the oldest live one; else None."""
    r = holder(d)
    if r and not mine(r, top):
        if time.time() - r.get('taken', 0) <= STALE_RUNWAY:
            return None
        if holder(d) == r:   # (still the same stale runway: free it)
            print('land: the runway held by %s since %s ago is stale -- freed' % (r.get('who'), age(r.get('taken', 0))))
            try:
                os.remove(runway_path(d))
            except OSError:
                pass
    if mine(r, top):
        r['taken'] = time.time()
        write(runway_path(d), r)
        return r
    live = [t for t in tickets(d) if not t['dead']]
    if live and os.path.normcase(live[0].get('worktree', '')) != os.path.normcase(top):
        return None
    r = {'who': who, 'branch': branch, 'worktree': top, 'taken': time.time(), 'pid': os.getpid()}
    try:
        fd = os.open(runway_path(d), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        return None
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        json.dump(r, f)
    drop_ticket(d, top)
    return r


def release(d, top):
    r = holder(d)
    if mine(r, top):
        os.remove(runway_path(d))
    drop_ticket(d, top)


def clean_or_die():
    if git('status', '--porcelain', '--untracked-files=no'):
        sys.exit('land: the worktree has uncommitted changes -- commit them by name (or stash) first')


def rebasing(top):
    gd = git('rev-parse', '--path-format=absolute', '--git-dir')
    return os.path.isdir(os.path.join(gd, 'rebase-merge')) or os.path.isdir(os.path.join(gd, 'rebase-apply'))


def opt(argv, name, default=None):
    if name in argv:
        i = argv.index(name)
        return argv[i + 1] if i + 1 < len(argv) else default
    return default


def take(argv, top, d):
    if rebasing(top):
        sys.exit('land: a rebase is stopped here -- resolve it, `git rebase --continue`, then take again')
    clean_or_die()
    branch = git('rev-parse', '--abbrev-ref', 'HEAD')
    who = opt(argv, '--who', branch)
    wait = float(opt(argv, '--wait', '8')) * 60
    t0, said, told = time.time(), None, 0
    while True:
        r = try_take(d, top, who, branch)
        if r:
            break
        ticket(d, top, who, branch)
        h = holder(d)
        line = [t['who'] for t in tickets(d) if not t['dead']]
        now = (h and h.get('who'), tuple(line))
        if now != said or time.time() - told > 60:   # (say it when the line changes, else once a minute)
            print('land: waiting -- the runway is %s; in line: %s' % (('%s\'s (%s)' % (h.get('who'), age(h.get('taken', 0)))) if h else 'free', ', '.join(line)), flush=True)
            said, told = now, time.time()
        if time.time() - t0 > wait:
            print('land: still in line after %g min -- run take again within 5 min to keep your place' % round(wait / 60, 1))
            sys.exit(3)
        time.sleep(POLL)
    print('land: the runway is yours (%s)' % who, flush=True)
    git('fetch', '-q', 'origin')
    base = git('rev-parse', 'origin/main')
    code, out = git('rebase', '-q', 'origin/main', check=False)
    if code:
        if rebasing(top):
            print(out)
            print('land: the rebase stopped on a conflict in: ' + ', '.join(git('diff', '--name-only', '--diff-filter=U').split()))
            print('land: you hold the runway -- resolve, `git rebase --continue`, then take again')
            sys.exit(2)
        release(d, top)
        sys.exit('land: the rebase failed: ' + out[:400])
    r = holder(d)
    r['base'] = base
    write(runway_path(d), r)
    print('land: rebased onto origin/main %s; your commits, final unless main moves:' % base[:8])
    print(git('log', '--format=  %h  %H  %s', 'origin/main..HEAD') or '  (none)')
    return r


def push(argv, top, d):
    r = holder(d)
    if not mine(r, top):
        sys.exit('land: you do not hold the runway -- take first (it is %s)' % ('%s\'s' % r.get('who') if r else 'free'))
    if rebasing(top):
        sys.exit('land: a rebase is stopped here -- resolve it, `git rebase --continue`, then take again')
    clean_or_die()
    git('fetch', '-q', 'origin')
    om = git('rev-parse', 'origin/main')
    if om != r.get('base') or git('merge-base', 'origin/main', 'HEAD') != om:
        print('land: main moved under the runway (someone pushed without it): origin/main is %s' % om[:8])
        sys.exit(4)
    r['taken'] = time.time()
    write(runway_path(d), r)
    gate = ['all'] if '--all' in argv else []
    print('land: the gate -- python dev/check.py %s' % ' '.join(gate), flush=True)
    g = subprocess.run([sys.executable, os.path.join(top, 'dev', 'check.py')] + gate, cwd=top)
    if g.returncode:
        release(d, top)
        print('land: the gate is RED -- the runway given back; fix it, then take again')
        sys.exit(1)
    git('fetch', '-q', 'origin')
    if git('rev-parse', 'origin/main') != om:
        print('land: main moved during the gate (someone pushed without the runway)')
        sys.exit(4)
    landing = git('log', '--format=  %h  %s', 'origin/main..HEAD')
    if '--dry-run' in argv:
        code, out = git('push', '--dry-run', '-q', 'origin', 'HEAD:main', check=False)
        release(d, top)
        print('land: DRY RUN, nothing pushed (push --dry-run exit %d) -- would land:\n%s' % (code, landing or '  (nothing)'))
        return
    code, out = git('push', '-q', 'origin', 'HEAD:main', check=False)
    if code:
        print('land: the push was refused: ' + out[:400])
        sys.exit(4)
    release(d, top)
    print('land: LANDED on main %s:\n%s' % (git('rev-parse', '--short=8', 'HEAD'), landing or '  (nothing new)'))


def status(d):
    r = holder(d)
    if r:
        print('runway: %s (%s), held %s%s' % (r.get('who'), r.get('worktree'), age(r.get('taken', 0)), ' -- STALE, free to the next' if time.time() - r.get('taken', 0) > STALE_RUNWAY else ''))
    else:
        print('runway: free')
    ts = tickets(d)
    for n, t in enumerate(ts, 1):
        print('  %d. %s (%s), in line %s%s' % (n, t.get('who'), t.get('branch'), age(t.get('since', 0)), ' -- dead, skipped' if t['dead'] else ''))
    if not ts:
        print('  no one in line')


def brk(d):
    r = holder(d)
    if r:
        os.remove(runway_path(d))
        print('land: runway cleared (it was %s\'s, held %s)' % (r.get('who'), age(r.get('taken', 0))))
    for t in tickets(d):
        if t['dead']:
            os.remove(t['file'])
            print('land: dead ticket cleared: %s' % t.get('who'))


def main(argv):
    try:
        sys.stdout.reconfigure(errors='replace')   # (commit subjects carry the house's dashes and middots; PowerShell's codepage may not)
    except AttributeError:
        pass
    if not argv or argv[0] not in ('take', 'push', 'go', 'release', 'status', 'break'):
        print(__doc__)
        sys.exit(1)
    top, d = here()
    cmd = argv[0]
    if cmd == 'take':
        take(argv, top, d)
    elif cmd == 'push':
        push(argv, top, d)
    elif cmd == 'go':
        take(argv, top, d)
        push(argv, top, d)
    elif cmd == 'release':
        release(d, top)
        print('land: the runway and your ticket given back')
    elif cmd == 'status':
        status(d)
    else:
        brk(d)


if __name__ == '__main__':
    main(sys.argv[1:])

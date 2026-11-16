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
  python dev/land.py gate [--who NAME] [--wait MIN]   THE GATE LOCK: wait in the gate's own line (40 min at most a call), then run the FULL gate
                                                     (python dev/check.py all) here, alone on the machine, and give the gate back
  python dev/land.py status                           who holds it and for how long, who waits (the runway, then the gate)
  python dev/land.py break                            the desk's: clear the runway left by a seat that died, a dead gate, and the dead tickets

THE GATE LOCK (11-15, Griz: "build the gate lock"). The full gate is the one that keeps RED off main (seats on the quick gate alone left
"a lot of red and a lot of emails", his words), but it is a few dozen headless browsers: on 11-14 seven seats each ran their own at once and
every one took half an hour where it takes a few minutes alone, and nothing landed for 43 minutes. So the full gate takes turns as landings
do, on a lock of its own beside the runway (`.git/landing/gate/`): `gate` waits its turn, runs `check.py all` in this worktree as it
stands (committed or not: it rebases nothing and does not touch the runway, so landings go on while a seat gates), and frees the gate when
the check ends, GREEN or RED. A seat's order is: bench what you changed, `gate`, then `take`, the PATCHLOG line, `push` (the quick gate).
A records-only landing (its commits touch only .md files) skips `gate` (11-16, Griz: "Yes, write it in"; CLAUDE.md's runway paragraph).
Never run `check.py all` bare while other seats are live. The holder refreshes the lock every few seconds while its check runs, so a gate
whose holder died is free to the next in line after three quiet minutes. Exit 0 GREEN, 1 RED, 3 still in line after --wait.

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
STALE_GATE = 3 * 60      # (the gate's holder refreshes it every POLL while its check runs: three quiet minutes is a holder that died)


def git(*args, check=True):
    p = subprocess.run(['git'] + list(args), capture_output=True)
    out = p.stdout.decode('utf-8', 'replace').strip()
    if check and p.returncode:
        sys.exit('land: git %s failed: %s' % (' '.join(args), (p.stderr.decode('utf-8', 'replace').strip() or out)[:400]))
    if p.returncode:  # (a failed call says why: git puts a refused push's reason on stderr -- 11-05, the Waterby cutter's push refused twice "with an empty reason")
        out = (out + '\n' + p.stderr.decode('utf-8', 'replace').strip()).strip()
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


def gate_dir(d):
    g = os.path.join(d, 'gate')   # (the gate's own lock and line, beside the runway's: tickets(), ticket() and drop_ticket() serve both)
    os.makedirs(os.path.join(g, 'tickets'), exist_ok=True)
    return g


def gate_path(g):
    return os.path.join(g, 'gate.json')


def try_gate(g, top, who, branch):
    """The gate if it is free (or its holder died) and this worktree's ticket is the oldest live one; else None."""
    r = read(gate_path(g))
    if r and (mine(r, top) or time.time() - r.get('taken', 0) > STALE_GATE):
        if not mine(r, top):
            print('land: the gate held by %s went quiet %s ago -- freed' % (r.get('who'), age(r.get('taken', 0))), flush=True)
        if read(gate_path(g)) == r:   # (still the same dead lock, or this worktree's own from a run that was cut off)
            try:
                os.remove(gate_path(g))
            except OSError:
                pass
    elif r:
        return None
    live = [t for t in tickets(g) if not t['dead']]
    if live and os.path.normcase(live[0].get('worktree', '')) != os.path.normcase(top):
        return None
    r = {'who': who, 'branch': branch, 'worktree': top, 'taken': time.time(), 'since': time.time(), 'pid': os.getpid()}
    try:
        fd = os.open(gate_path(g), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        return None
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        json.dump(r, f)
    drop_ticket(g, top)
    return r


def gate(argv, top, d):
    g = gate_dir(d)
    branch = git('rev-parse', '--abbrev-ref', 'HEAD')
    who = opt(argv, '--who', branch)
    wait = float(opt(argv, '--wait', '40')) * 60
    t0, said, told = time.time(), None, 0
    while True:
        r = try_gate(g, top, who, branch)
        if r:
            break
        ticket(g, top, who, branch)
        h = read(gate_path(g))
        line = [t['who'] for t in tickets(g) if not t['dead']]
        now = (h and h.get('who'), tuple(line))
        if now != said or time.time() - told > 60:   # (say it when the line changes, else once a minute)
            print('land: waiting for the gate -- it is %s; in line: %s' % (('%s\'s (%s)' % (h.get('who'), age(h.get('since', h.get('taken', 0))))) if h else 'free', ', '.join(line)), flush=True)
            said, told = now, time.time()
        if time.time() - t0 > wait:
            print('land: still in the gate\'s line after %g min -- run gate again within 5 min to keep your place' % round(wait / 60, 1))
            sys.exit(3)
        time.sleep(POLL)
    head = git('rev-parse', '--short=8', 'HEAD')
    dirty = bool(git('status', '--porcelain', '--untracked-files=no'))
    print('land: the gate is yours (%s) -- python dev/check.py all, on %s%s' % (who, head, ' with uncommitted changes' if dirty else ''), flush=True)
    p, code = None, 1
    try:
        nap = os.environ.get('LAND_GATE_TEST_SLEEP')   # (the lock's own proof: a sleep in the check's place, so two waiters can be timed without two gates)
        p = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(%g)' % float(nap)] if nap else [sys.executable, os.path.join(top, 'dev', 'check.py'), 'all'], cwd=top)
        while p.poll() is None:
            r['taken'] = time.time()   # (the heartbeat: a holder that dies stops it, and the gate frees itself)
            write(gate_path(g), r)
            try:
                p.wait(POLL)
            except subprocess.TimeoutExpired:
                pass
        code = p.returncode
    finally:
        if p is not None and p.poll() is None:   # (cut off: the check goes with it, so the next in line gates alone)
            p.kill()
        if mine(read(gate_path(g)), top):
            try:
                os.remove(gate_path(g))
            except OSError:
                pass
        drop_ticket(g, top)
    print('land: the full gate is %s on %s after %s -- the gate given back%s' % ('RED' if code else 'GREEN', head, age(r['since']), '' if code else '; now take, write the PATCHLOG line, push'))
    sys.exit(1 if code else 0)


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
    ci_line()


def ci_line():
    """The full gate's last word from GitHub Actions, printed at every landing (2026-11-13, Griz: "1 push prints it"): seats
    land on the QUICK gate, the full one runs only in CI and at a desk's close, and a RED there stood ten hours unseen (a
    portrait check, from bc4b57ff). The newest FINISHED run on main is for an earlier push than this one; it never blocks."""
    try:
        p = subprocess.run(['gh', 'run', 'list', '--branch', 'main', '--workflow', 'gate.yml', '--limit', '8',
                            '--json', 'status,conclusion,headSha,createdAt'], capture_output=True, timeout=25)
        runs = [r for r in json.loads(p.stdout.decode('utf-8', 'replace') or '[]') if r.get('status') == 'completed']
    except Exception:
        runs = None
    if not runs:
        print('land: CI (the full gate on GitHub): could not be read -- `gh run list --limit 3` by hand')
        return
    r = runs[0]
    if r.get('conclusion') == 'success':
        print('land: CI (the full gate on GitHub) was GREEN at %s (%s)' % (r['headSha'][:8], r['createdAt']))
    else:
        print('land: CI (the full gate on GitHub) is RED -- %s at %s (%s). The quick gate you passed does not run every check:'
              % (r.get('conclusion'), r['headSha'][:8], r['createdAt']))
        print('land:   read it (`gh run view --log-failed`), and if it is yours fix it now; if not, tell the desk in your report.')


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
    g = gate_dir(d)
    r = read(gate_path(g))
    if r:
        print('gate: %s (%s), gating %s%s' % (r.get('who'), r.get('worktree'), age(r.get('since', r.get('taken', 0))), ' -- QUIET %s, free to the next' % age(r.get('taken', 0)) if time.time() - r.get('taken', 0) > STALE_GATE else ''))
    else:
        print('gate: free')
    ts = tickets(g)
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
    g = gate_dir(d)
    r = read(gate_path(g))
    if r and time.time() - r.get('taken', 0) > STALE_GATE:   # (a live gate is never broken: its check is still running)
        os.remove(gate_path(g))
        print('land: dead gate cleared (it was %s\'s, quiet %s)' % (r.get('who'), age(r.get('taken', 0))))
    for t in tickets(g):
        if t['dead']:
            os.remove(t['file'])
            print('land: dead gate ticket cleared: %s' % t.get('who'))


def main(argv):
    try:
        sys.stdout.reconfigure(errors='replace')   # (commit subjects carry the house's dashes and middots; PowerShell's codepage may not)
    except AttributeError:
        pass
    if not argv or argv[0] not in ('take', 'push', 'go', 'release', 'status', 'break', 'gate'):
        print(__doc__)
        sys.exit(1)
    top, d = here()
    cmd = argv[0]
    if cmd == 'gate':
        gate(argv, top, d)
    elif cmd == 'take':
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

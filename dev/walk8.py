"""Here-to-there (10-03; Griz: "random encounters stay the 8-bit" and "we need to run some here-to-there 8bit benches to see what sort of
resources the parties are getting to the boss battles with"). Walks a leg of the 8-bit game from one boss (or Silverton's gate) to the next
boss's door through the game's own random encounters, n times, and tallies what it arrives with: the party on the player's hand (10-03, Griz:
"a player's hand on the bench now, potions under half and area spells at groups"; the tent "pitched once below half"; round three's lean:
a group is two, and a kit on the downed after a fight), or with hand=0 on
the game's own AI alone (the guest turn: the floor). The page
side is dev/bench8.js's `walk` mode (read its comment); a leg's story state is the game's own DS.situation (js/situations.js). Findings,
not fixes: this file changes no rate, table, sheet or rule. From PowerShell (headless Edge answers nothing from the Bash sandbox); in a
Linux container set DEEP16_BROWSER=/opt/pw-browsers/chromium DEEP16_BROWSER_ARGS=--no-sandbox, as for bench8.py.

  python dev/walk8.py leg=roper n=20            one leg, twenty walks: the summary and the fights
  python dev/walk8.py leg=roper n=20 lvl=7      the same leg a level up (the leg's own level otherwise)
  python dev/walk8.py leg=roper seed=5          another run of dice (seed=1 by default; each walk is seed*1000 + its index)
  python dev/walk8.py leg=roper n=1 log         the first walk's fights, line by line (what the battle said)
  python dev/walk8.py leg=legfour n=100 tent=0  the player's hand without the tent; group=3: an area spell only at three foes (2 by default); hand=0: the floor
  python dev/walk8.py leg=legfoursally n=100    leg four in sallies (round three): each door from Third Lamp, home to its bed after, on to the next
  python dev/walk8.py legs                      the legs, their starts, doors and levels
  python dev/walk8.py leg=all n=20 table        every leg; writes here-to-there.md at the repo root (jobs=4 at a time)
  python dev/walk8.py leg=gulch n=1 check       the gate's line (dev/check.py all): one walk, FAIL on an error or a walk that found no path
"""
import json, os, re, subprocess, sys, tempfile, time, urllib.parse, zlib, html as H
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import bench8

S6 = 'Silverton (Fountain Street), rested'
# The legs, in story order. sit: what DS.situation lays (js/situations.js: lvl, base 'lake', spine n = the expansion's beats 1..n done, flags,
# unset); every leg stands on DS.roundSix (level 4, every base-game quest done, its kit: 3 potions, a greater potion, 3 kits, 4 simples,
# 2 draughts, 2 bat-wing pies, 3 oil, 2 torches, a tent, 1,500 silver, the +2 weapons, the Ring of Binding on the lead) with the leg's own
# boss undone. from: [map, x, y]; to: the door (a trigger's tiles, or a step beside a `use` trigger; `arrive`: on the map). lvl: the
# DEEP16 ladder's (deep16/data/fights.js) where the boss has a rung (Griz, 10-03: "yes, and rerun those legs"), else the situation's, else a guess.
# mid: the walk starts where no map was just loaded (a boss's door, a lamp's bed). Since 10-03 the countdown carries across map loads (js/world.js,
# RULED: "a map load is not a rest"), so every leg's countdown starts part-run (bench8.js) and `mid` only names the start.
LEGS = [
    # ---------------------------------------------------------------- the base game: every leg from Silverton, rested at the inn
    ('doors', dict(group='base', title='Silverton to the Doors (the wall at the top of the north road)', lvl=4, guess='lvl: no fight there; round six\'s 4',
                   sit={}, frm=['silverton', 29, 8], to={'map': 'world', 'rect': [33, 0, 9, 1]}, start=S6)),
    ('snoot', dict(group='base', title='Silverton to the Snoot (the glory-seekers on the road south)', lvl=3, ladder=3,
                   sit={'unset': ['snootDone', 'snootWord']}, frm=['silverton', 29, 8], to={'map': 'world', 'trig': 'snoot'}, start=S6)),
    ('gulch', dict(group='base', title='Silverton to Web Gulch (the braiding ettercap)', lvl=3, ladder=3, sitname='gulch',
                   sit={'unset': ['ettercapDone', 'trig:snared']}, frm=['silverton', 29, 8], to={'map': 'gulch', 'trig': 'ettercap'}, start=S6)),
    ('wet', dict(group='base', title='Silverton to the Wet: the otyugh (the landlord\'s step)', lvl=4, ladder=4, sitname='wet',
                 sit={'unset': ['otyughFed', 'landlordSpoke']}, frm=['silverton', 29, 8], to={'map': 'warrens_d', 'trig': 'landlordStep'}, start=S6)),
    ('jelly', dict(group='base', title='Silverton to the Wet: the ochre jelly', lvl=4, sitname='wet', guess='lvl: the Wet\'s situation',
                   sit={}, frm=['silverton', 29, 8], to={'map': 'warrens_d', 'trig': 'jelly'}, start=S6)),
    ('ooze', dict(group='base', title='Silverton to the Wet: the gray ooze in the pool', lvl=4, sitname='wet', guess='lvl: the Wet\'s situation',
                  sit={}, frm=['silverton', 29, 8], to={'map': 'warrens_d', 'trig': 'poolOoze'}, start=S6)),
    ('crawler', dict(group='base', title='Silverton to the Wet: the crawler at the deep cradle', lvl=4, sitname='wet', guess='lvl: the Wet\'s situation',
                     sit={}, frm=['silverton', 29, 8], to={'map': 'warrens_d', 'trig': 'deepCradle0'}, start=S6)),
    ('keeper', dict(group='base', title='Silverton to the flooded stair (the Keeper)', lvl=3, ladder=3,
                    sit={}, frm=['silverton', 29, 8], to={'map': 'warrens_d', 'trig': 'stair'}, start=S6)),
    ('cloaker', dict(group='base', title='Silverton to the cloaker (the guano mine, down the slide)', lvl=6, ladder=6, sitname='cloaker', guess='lvl: the ladder\'s (Griz, 10-03: \"yes, and rerun those legs\"; the situation had 4)',
                     sit={'unset': ['cloakerDone']}, frm=['silverton', 29, 8], to={'map': 'galleries_g4', 'trig': 'cloaker'}, start=S6)),
    ('wagon', dict(group='base', title='Silverton to the Halfway Inn (the wagon night; the road catches after it)', lvl=4, ladder=4, sitname='wagon',
                   sit={}, frm=['silverton', 29, 8], to={'map': 'halfway_in', 'arrive': 1}, start=S6,
                   note='the story long-rests at the inn before the wagon rolls in (events.js EV.longRest, Griz 09-25), and the road catches follow the yard fight in a chase that rolls no encounters: both are fought full or on the yard\'s leftovers, not on this walk')),
    ('chuul', dict(group='base', title='Silverton to the lake (the point: the chuul)', lvl=4, ladder=4, sitname='chuul',
                   sit={'flags': {'reachedInn': 1, 'wagonNight': 1, 'wagonOutcome': 'quiet', 'katGone': 1, 'katRode': 1, 'dishes': 1, 'elsbethTold': 1}},
                   frm=['silverton', 29, 8], to={'map': 'halfway', 'trig': 'pointStep'}, start=S6,
                   note='by the story the chuul comes after a night at the inn holding the ring (a long rest): this is the walk to the water, or the rowboat\'s poke by day')),
    # ---------------------------------------------------------------- the Deep: one leg a boss, in the spine's order (DS.situation's beats)
    ('hask', dict(group='deep', title='Silverton to the night crew at the niches (Hask, the Burial)', lvl=4, ladder=4, sitname='crew', guess='lvl: the ladder\'s (Griz, 10-03: \"yes, and rerun those legs\"; the situation had 5)',
                  sit={'base': 'lake', 'spine': 2}, frm=['silverton', 29, 8], to={'map': 'burial', 'trig': 'crew'}, start=S6)),
    ('cutseal', dict(group='deep', title='Solskaft to the cut seal (leg one, with Pyro)', lvl=5, ladder=5, sitname='leg1',
                     sit={'base': 'lake', 'spine': 6}, frm=['solskaft', 28, 20], to={'map': 'highway_1', 'trig': 'cutSeal'}, start='Solskaft, after a night (the cots)')),
    ('gricks', dict(group='deep', mid=1, title='The cut seal to the grick den', lvl=5, ladder=5,
                    sit={'base': 'lake', 'spine': 6, 'flags': {'sealCleared': 1, 'lumpTaken': 1}}, frm=['highway_1', 28, 7], to={'map': 'highway_1', 'trig': 'grickDen'}, start='the cut seal')),
    ('roper', dict(group='deep', mid=1, title='The grick den to the roper (past First Lamp)', lvl=6, ladder=6, guess='lvl: the ladder\'s (Griz, 10-03: \"yes, and rerun those legs\"; the situation had 5, leg one\'s)',
                   sit={'base': 'lake', 'spine': 6, 'flags': {'sealCleared': 1, 'lumpTaken': 1, 'grickDone': 1}}, frm=['highway_1', 42, 16], to={'map': 'highway_2', 'trig': 'roper'}, start='the grick den')),
    ('bulette', dict(group='deep', mid=1, title='The roper to the bulette', lvl=5, ladder=5,
                     sit={'base': 'lake', 'spine': 6, 'flags': {'sealCleared': 1, 'lumpTaken': 1, 'grickDone': 1, 'lamp1': 1, 'roperSeen': 1, 'roperDead': 1}},
                     frm=['highway_2', 38, 8], to={'map': 'highway_2', 'trig': 'bulette'}, start='the roper\'s fork')),
    ('drain', dict(group='deep', mid=1, title='The bulette to the drain cut (past Second Lamp)', lvl=6, ladder=6, guess='lvl: the ladder\'s',
                   sit={'base': 'lake', 'spine': 6, 'flags': {'sealCleared': 1, 'lumpTaken': 1, 'grickDone': 1, 'lamp1': 1, 'roperSeen': 1, 'roperDead': 1, 'buletteDead': 1}},
                   frm=['highway_2', 60, 11], to={'map': 'highway_2', 'trig': 'drain'}, start='the breach (the bulette)')),
    ('pinned', dict(group='deep', mid=1, title='The drain cut to the north cut (the phase spiders, Halldor pinned)', lvl=6, ladder=6, sitname='northcut',
                    sit={'base': 'lake', 'spine': 7, 'flags': {'puddingDead': 1}}, frm=['highway_2', 69, 16], to={'map': 'pinned', 'trig': 'pinned'}, start='the drain cut')),
    ('stair', dict(group='deep', title='Solskaft to the dry stair (the crew boss holding it)', lvl=6, ladder=2, guess='lvl: the story\'s, not the ladder\'s 2 (the lean of 10-03: \"the story\'s; the walker measures arrival, and 2 is the bestiary\'s rung\"): the stair comes after beat 10, where Ragna asks for the water',
                   sit={'base': 'lake', 'spine': 10, 'flags': {'waterAsked': 1}}, frm=['solskaft', 28, 20], to={'map': 'warrens_d', 'trig': 'holdStair'}, start='Solskaft, after a night (the cots)')),
    ('brood', dict(group='deep', title='Second Lamp to the nest (the Broodmother, Halldor and four troopers)', lvl=7, ladder=7, sitname='nest',
                   sit={'base': 'lake', 'spine': 12}, frm=['highway_2', 68, 11], to={'map': 'nest', 'trig': 'brood'}, start='Second Lamp (the road menu\'s fast travel), after a night there')),
    ('xorns', dict(group='deep', title='Second Lamp to the seam (the xorns, leg three, Brann and Hedda)', lvl=8, ladder=8, guess='lvl: the raid\'s situation',
                   sit={'base': 'lake', 'spine': 15, 'unset': ['xornDone', 'giantDone']}, frm=['highway_2', 68, 11], to={'map': 'highway_3', 'trig': 'xorn'},
                   start='Second Lamp (fast travel; Third Lamp is the drow\'s), after a night there')),
    ('giant', dict(group='deep', mid=1, title='The seam to the giant\'s camp', lvl=8, ladder=8,
                   sit={'base': 'lake', 'spine': 15, 'unset': ['giantDone']}, frm=['highway_3', 30, 11], to={'map': 'highway_3', 'trig': 'giant'}, start='the seam (the xorns)')),
    ('raid', dict(group='deep', mid=1, title='The giant\'s camp to Third Lamp (the raid)', lvl=8, ladder=8, sitname='raid',
                  sit={'base': 'lake', 'spine': 15}, frm=['highway_3', 44, 17], to={'map': 'highway_3', 'trig': 'raid'}, start='the giant\'s camp')),
    ('fallback', dict(group='deep', mid=1, title='Third Lamp to the drow\'s fallback line (leg four)', lvl=7, ladder=7, sitname='leg4', guess='lvl: the ladder\'s (Griz, 10-03: \"yes, and rerun those legs\"; the situation had 8)',
                      sit={'base': 'lake', 'spine': 16}, frm=['highway_3', 66, 11], to={'map': 'highway_4', 'trig': 'fallback'}, start='Third Lamp, lit, after a night there')),
    ('naga', dict(group='deep', mid=1, title='The fallback line to the black water (the naga)', lvl=7, ladder=7, guess='lvl: the ladder\'s (Griz, 10-03: \"yes, and rerun those legs\"; the situation had 8)',
                  sit={'base': 'lake', 'spine': 16, 'flags': {'fallbackDone': 1}}, frm=['highway_4', 14, 11], to={'map': 'highway_4', 'trig': 'naga'}, start='the fallback line')),
    ('trolls', dict(group='deep', mid=1, title='The black water to the troll hole', lvl=8, ladder=8,
                    sit={'base': 'lake', 'spine': 16, 'flags': {'fallbackDone': 1, 'nagaDone': 1}}, frm=['highway_4', 34, 11], to={'map': 'highway_4', 'trig': 'trolls'}, start='the causeway (the naga)')),
    ('elemental', dict(group='deep', mid=1, title='The troll hole to the cut\'s walls (the earth elemental)', lvl=8, ladder=8,
                       sit={'base': 'lake', 'spine': 16, 'flags': {'fallbackDone': 1, 'nagaDone': 1, 'trollsDone': 1}}, frm=['highway_4', 52, 17], to={'map': 'highway_4', 'trig': 'elemental'}, start='the troll hole')),
    ('torvald', dict(group='deep', mid=1, title='The cut\'s walls to Deepholm\'s door (Torvald; the sect\'s blades come at the next rest there)', lvl=9, sitname='torvald', guess='lvl: the situation\'s 9 (off the ladder: a story fight)',
                     sit={'base': 'lake', 'spine': 17, 'flags': {'fallbackDone': 1, 'nagaDone': 1, 'trollsDone': 1, 'elementalDone': 1}}, frm=['highway_4', 64, 11], to={'map': 'threshold', 'arrive': 1}, start='the made road\'s cut (the elemental)',
                     note='the assassins come when the party first rests at the door after Torvald (deep.js EV.rest): the same state as Torvald\'s door, less whatever Torvald cost')),
]
LEGD = dict(LEGS)
# the way home in a sally (round three; the lean of 10-03 on leg four: "sallies; the lamps are the beds you built. Have the walker model the sally, door to
# lamp to next door, before anything is added or lightened"): from a boss's door, the boss counted done, back to Third Lamp's tower and the road menu's
# REST HERE (restEnd: EV.longRest on arrival, the state tallied first). Chains only: not in the table of single legs
L4 = {'base': 'lake', 'spine': 16}
HOME = [('fallback-home', 'The fallback line home to Third Lamp', {'fallbackDone': 1}, ['highway_4', 13, 11]),
        ('naga-home', 'The black water home to Third Lamp', {'fallbackDone': 1, 'nagaDone': 1}, ['highway_4', 33, 11]),
        ('trolls-home', 'The troll hole home to Third Lamp', {'fallbackDone': 1, 'nagaDone': 1, 'trollsDone': 1}, ['highway_4', 50, 16]),
        ('elemental-home', 'The cut\'s walls home to Third Lamp', {'fallbackDone': 1, 'nagaDone': 1, 'trollsDone': 1, 'elementalDone': 1}, ['highway_4', 63, 10])]
for _n, _t, _f, _at in HOME:
    LEGD[_n] = dict(group='deep', title=_t, lvl=7, sit=dict(L4, flags=_f), frm=_at, to={'map': 'highway_3', 'trig': 'tower3'}, start='the boss\'s door', restEnd='Third Lamp')
# the chains: legs walked one after another with nothing reset between them (no boss fought: the grid fights those), so each door shows what
# the road alone has taken since the last bed -- the floor under what the party really brings, the boss before it not counted
CHAINS = [('legone', ['cutseal', 'gricks', 'roper', 'bulette', 'drain'], 'Solskaft to the drain cut: leg one and two, the seal to the drain'),
          ('legthree', ['xorns', 'giant', 'raid'], 'Second Lamp to the raid: leg three'),
          ('legfour', ['fallback', 'naga', 'trolls', 'elemental', 'torvald'], 'Third Lamp to Deepholm\'s door: leg four'),
          ('legfoursally', ['fallback', 'fallback-home', 'naga', 'naga-home', 'trolls', 'trolls-home', 'elemental', 'elemental-home', 'torvald'],
           'leg four in sallies: Third Lamp to each door and home to its bed, then on to the next')]
CHAIND = dict((c, (legs, t)) for c, legs, t in CHAINS)
NO_WALK = [('the road catches', 'after the wagon yard: a chase that rolls no encounters (world.js Field.arrive: `!this.chase`), so the party meets the riders with the yard\'s leftovers'),
           ('the assassins', 'at Deepholm\'s door, the first rest after Torvald: no walk between (see the torvald leg)')]
ITEM_COLS = [('potion', 'potion'), ('greaterpotion', 'greater'), ('kit', 'kit'), ('torch', 'torch')]


def leg_spec(name, lvl=None):
    L = LEGD[name]
    sit = dict(L['sit']); sit['lvl'] = int(lvl) if lvl else L['lvl']
    return {'name': name, 'sit': sit, 'from': L['frm'], 'to': L['to'], 'mid': bool(L.get('mid')), 'restEnd': L.get('restEnd')}


def leg_json(name, lvl=None):
    if name in CHAIND: # (a chain walks at its first leg's level; the XP it earns on the way levels it as the game would)
        legs = CHAIND[name][0]
        return json.dumps([leg_spec(x, lvl or LEGD[legs[0]]['lvl']) for x in legs])
    return json.dumps(leg_spec(name, lvl))


def page():
    return bench8.build_page()


def run_leg(pg, name, n, seed=1, lvl=None, timeout=1800, log=False, hand=True, extra=None):
    prof = os.path.join(tempfile.gettempdir(), 'ds8-walk-%d-%s-%s-%d' % (os.getpid(), name, seed, hand))
    dice = seed * 100000 + zlib.crc32(name.encode()) % 100000 # (each leg its own dice: walk i of a leg rolls from dice * 1000 + i -- the same seed, the same walks)
    q = {'test': 'walk', 'leg': leg_json(name, lvl), 'n': n, 'seed': dice, 'hand': 1 if hand else 0} # (the same dice with the hand and without: the roads are the same walks)
    if log:
        q['log'] = 1
    q.update(extra or {}) # (group=N: the hand's group, 3 by default; tent=0: the hand without the tent)
    url = 'file:///' + pg.replace('\\', '/') + '?' + urllib.parse.urlencode(q)
    cmd = [bench8.EDGE, '--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files'] + bench8.EXTRA + ['--user-data-dir=' + prof, '--dump-dom', url]
    t0 = time.time()
    p = subprocess.run(cmd, capture_output=True, timeout=timeout)
    dom = p.stdout.decode('utf-8', 'replace')
    m = re.search(r'BENCH8 (\{.*\})', dom, re.S)
    if not m:
        errs = re.findall(r'LOADERR ([^<]*)', dom)
        return {'leg': name, 'error': 'no result', 'load': errs[:5] or dom[-400:]}
    r = json.loads(H.unescape(m.group(1)))
    r['leg'] = name; r['hand'] = bool(hand); r['secs'] = round(time.time() - t0, 1); r['lvl'] = int(lvl) if lvl else LEGD[CHAIND[name][0][0] if name in CHAIND else name]['lvl']
    return r


def split_chain(r):
    """A chain's result as one result a leg: the walks that wiped before a door count as wiped there."""
    legs = CHAIND[r['leg']][0]; out = []
    for i, nm in enumerate(legs):
        runs = []
        for x in r.get('runs', []):
            if 'legs' not in x:
                runs.append(x); continue
            runs.append(x['legs'][i] if i < len(x['legs']) else dict(x['legs'][-1], wiped=True))
        out.append({'leg': nm, 'chain': r['leg'], 'hand': r.get('hand'), 'lvl': r['lvl'], 'secs': r.get('secs'), 'err': r.get('err'), 'path': (r.get('paths') or [None] * len(legs))[i], 'runs': runs})
    return out


# ------------------------------------------------------------------------------------------------ reading the runs
def mean(xs):
    xs = list(xs)
    return sum(xs) / len(xs) if xs else 0.0


def party_of(snap):
    return [h for h in snap['heroes'] if not h['guest']]


def hp_share(snap, guests=False):
    hs = [h for h in snap['heroes'] if guests or not h['guest']]
    tot = sum(h['max'] for h in hs)
    return sum(0 if h['ko'] else h['hp'] for h in hs) / tot if tot else 0.0


def slots_left(snap):
    """{hero: 'l1 a/b l2 c/d'} for each caster (slotsMax > 0)."""
    out = {}
    for h in snap['heroes']:
        if any(h['slotsMax']):
            out[h['name']] = (h['slots'], h['slotsMax'])
    return out


def summarize(r):
    runs = [x for x in r.get('runs', []) if 'door' in x and not x.get('err')]
    errs = [x.get('err') for x in r.get('runs', []) if x.get('err')]
    S = {'leg': r['leg'], 'hand': r.get('hand'), 'lvl': r.get('lvl'), 'n': len(r.get('runs', [])), 'ok': len(runs), 'errs': errs, 'path': r.get('path'), 'err': r.get('err')}
    if not runs:
        return S
    S['zones'] = runs[0]['zones']
    S['steps'] = mean(x['steps'] for x in runs)
    wiped = [x for x in runs if x.get('wiped')]
    S['wiped'] = len(wiped) / len(runs)
    S['fights'] = mean(len([f for f in x['fights'] if not f['fled']]) for x in runs)
    S['fled'] = mean(len([f for f in x['fights'] if f['fled']]) for x in runs)
    S['rounds'] = mean(sum(f['rounds'] for f in x['fights']) for x in runs)
    sh = [0.0 if x.get('wiped') else hp_share(x['door']) for x in runs]
    S['hp'] = mean(sh); S['hp_worst'] = min(sh)
    S['guest_hp'] = mean(hp_share(x['door'], True) for x in runs if any(h['guest'] for h in x['door']['heroes']))
    S['ko'] = mean(1 if any(h['ko'] for h in party_of(x['door'])) else 0 for x in runs)
    S['kos'] = mean(sum(1 for h in party_of(x['door']) if h['ko']) for x in runs)
    # per hero: mean HP share, KO share
    names = [h['name'] for h in runs[0]['door']['heroes']]
    S['heroes'] = {}
    S['lvl_door'] = mean(mean(h['lvl'] for h in party_of(x['door'])) for x in runs)
    for nm in names:
        hs = [[h for h in x['door']['heroes'] if h['name'] == nm] for x in runs]
        hs = [h[0] for h in hs if h]
        S['heroes'][nm] = {'hp': mean(0 if h['ko'] else h['hp'] / h['max'] for h in hs), 'ko': mean(1 if h['ko'] else 0 for h in hs), 'guest': hs[0]['guest'], 'cls': hs[0]['cls'], 'lvl': mean(h['lvl'] for h in hs)}
    # slots: mean left by level per caster, against the max
    S['slots'] = {}
    for nm in names:
        hs = [[h for h in x['door']['heroes'] if h['name'] == nm] for x in runs]
        hs = [h[0] for h in hs if h and any(h[0]['slotsMax'])]
        if not hs:
            continue
        K = max(len(h['slotsMax']) for h in hs) # (a hero who levelled on the way has more: the mean of each, left and most)
        S['slots'][nm] = ([round(mean(h['slots'][k] if k < len(h['slots']) else 0 for h in hs), 1) for k in range(K)],
                          [round(mean(h['slotsMax'][k] if k < len(h['slotsMax']) else 0 for h in hs), 1) for k in range(K)])
    # the start's slots (a rest at a lamp can't add; a spent slot is a slot gone)
    S['slots_spent'] = mean(sum(sum(h['slotsMax']) - sum(h['slots']) for h in x['door']['heroes']) for x in runs)
    # features: what the door has left against the start
    feats = {}
    for x in runs:
        st = {h['name']: h['feats'] for h in x['start']['heroes']}
        for h in x['door']['heroes']:
            for k, v in h['feats'].items():
                v0 = st.get(h['name'], {}).get(k)
                if isinstance(v, (int, float)) and isinstance(v0, (int, float)) and v0 > 0:
                    feats.setdefault(h['name'] + ' ' + k, []).append((v, v0))
    S['feats'] = {k: (round(mean(a for a, _ in v), 1), v[0][1]) for k, v in feats.items()}
    for col, _ in ITEM_COLS:
        S[col] = mean(x['door']['items'].get(col, 0) for x in runs)
        S[col + '0'] = runs[0]['start']['items'].get(col, 0)
    S['tent'] = mean(1 if x.get('tent') is not None else 0 for x in runs)
    S['tent0'] = mean(1 if x['door']['items'].get('tent', 0) > 0 else 0 for x in runs) # (still in the pack at the door: a chain's tent pitched by then is 1 less this)
    S['potions_drunk'] = mean(x.get('fieldPotions', 0) + sum(1 for f in x['fights'] for ln in f['said'] if re.search(r'uses (Potion of Healing|Greater Potion)', ln)) for x in runs)
    S['torches_lit'] = mean(x['torches'] for x in runs)
    S['unlit'] = mean(x['unlit'] for x in runs)
    S['silver'] = mean(x['door']['silver'] - x['start']['silver'] for x in runs)
    S['rested'] = {}
    for x in runs:
        for nm in x['rests']:
            S['rested'][nm] = S['rested'].get(nm, 0) + 1 / len(runs)
    # what drained them: HP lost by the group met, and the spells and features spent
    groups, casts = {}, {}
    for x in runs:
        for f in x['fights']:
            if f['fled']:
                continue
            k = ', '.join(sorted(set('%s x%d' % (m, f['foes'].count(m)) for m in f['foes'])))
            g = groups.setdefault(k, {'n': 0, 'lost': 0, 'rounds': 0, 'kos': 0})
            g['n'] += 1; g['lost'] += f['lost']; g['rounds'] += f['rounds']; g['kos'] += len(f['ko'])
            for line in f['said']:
                m = re.search(r'casts ([A-Z][A-Za-z\' ]+?)(?:[.!:(]| on |$)', line)
                lab = ('casts ' + m.group(1).strip()) if m else re.sub(r'^.*?(speaks a word|Cure Wounds|spiritual weapon|shield of force|COUNTERSPELL|hellfire|PRESERVE LIFE|TURN UNDEAD|second wind|surges|Lay on Hands|uses Potion of Healing|uses Greater Potion).*$', r'\1', line)
                who = line.split(' ')[0]
                casts[who + ': ' + lab] = casts.get(who + ': ' + lab, 0) + 1
    S['groups'] = sorted(((k, v['n'] / len(runs), v['lost'] / max(1, v['n']), v['rounds'] / max(1, v['n']), v['kos'] / max(1, v['n'])) for k, v in groups.items()), key=lambda t: -t[1] * t[2])
    S['casts'] = sorted(((k, v / len(runs)) for k, v in casts.items()), key=lambda t: -t[1])
    S['secs'] = r.get('secs')
    return S


def reading(S):
    if not S.get('ok'):
        return 'no reading'
    if S['wiped'] > 0 or S['hp'] < 0.6 or S['ko'] >= 0.3:
        return 'thin'
    if S['hp'] >= 0.9 and S['ko'] < 0.1:
        return 'fat'
    return 'fair'


def fmt_slots(S):
    out = []
    for nm, (left, mx) in S['slots'].items():
        out.append(nm + ' ' + ' '.join('%g/%g' % (a, b) for a, b in zip(left, mx) if b))
    return '; '.join(out) or '--'


def print_summary(S):
    L = LEGD[S['leg']]
    print('== %s: %s (level %s, n=%d, %s%s)' % (S['leg'], L['title'], S['lvl'], S['n'], 'the player\'s hand' if S.get('hand') else 'the guest turn alone (the floor)', ', %s s' % S['secs'] if S.get('secs') else ''))
    if S.get('err'):
        print('FAIL ' + S['err']); return
    for e in S['errs']:
        print('FAIL a walk: ' + str(e)[:400])
    if not S['ok']:
        return
    p = S['path']
    print('  path: %d steps over %s; the zones walked: %s' % (p['steps'], ' > '.join(p['maps']), ', '.join('%s %d' % kv for kv in S['zones'].items()) or 'none (no encounters)'))
    print('  fights %.1f (fled %.1f), rounds %.1f; wiped %d%%' % (S['fights'], S['fled'], S['rounds'], round(100 * S['wiped'])))
    print('  at the door: party HP %d%% (worst %d%%), a hero down in %d%% of runs (%.2f down a run)%s' % (round(100 * S['hp']), round(100 * S['hp_worst']), round(100 * S['ko']), S['kos'],
          ('; with the guests %d%%' % round(100 * S['guest_hp'])) if S['guest_hp'] else ''))
    if abs(S['lvl_door'] - S['lvl']) > 0.01:
        print('  the party\'s level at the door: %.2f (from %s: the road\'s XP)' % (S['lvl_door'], S['lvl']))
    print('  heroes: ' + ', '.join('%s%s %d%%%s' % (nm, ' (guest)' if v['guest'] else '', round(100 * v['hp']), (' KO %d%%' % round(100 * v['ko'])) if v['ko'] else '') for nm, v in S['heroes'].items()))
    print('  slots left: ' + fmt_slots(S) + ' (%.1f spent a run)' % S['slots_spent'])
    used = {k: v for k, v in S['feats'].items() if v[0] < v[1]}
    print('  features spent: ' + (', '.join('%s %g/%g' % (k, a, b) for k, (a, b) in used.items()) or 'none'))
    print('  items: ' + ', '.join('%s %g/%d' % (lab, S[c], S[c + '0']) for c, lab in ITEM_COLS) + '; torches lit %.1f, dark maps with no light %.1f; silver +%d' % (S['torches_lit'], S['unlit'], round(S['silver'])))
    if S.get('hand'):
        print('  the hand: potions drunk %.2f a walk, the tent pitched in %d%% of walks' % (S['potions_drunk'], round(100 * S['tent'])))
    if S['rested']:
        print('  rested: ' + ', '.join('%s %d%%' % (k, round(100 * v)) for k, v in S['rested'].items()))
    print('  reading: ' + reading(S))
    print('  what drained them (group: met a run, HP lost a fight, rounds, KOs a fight):')
    for k, n, lost, rnd, kos in S['groups'][:8]:
        print('    %-46s %.2f  %5.1f  %.1f  %.2f' % (k, n, lost, rnd, kos))
    if S['casts']:
        print('  spent in the fights (a run): ' + ', '.join('%s %.2f' % kv for kv in S['casts'][:10]))


# ------------------------------------------------------------------------------------------------ the table
def pct(x):
    return '%d%%' % round(100 * x)


BEGIN, END = '<!-- walk8: from here to the matching end line, dev/walk8.py writes; the rest of the file is the seat\'s -->', '<!-- walk8: end -->'


def drained(S, k=3):
    g = '; '.join('%s (%.2f a walk, %.0f HP a fight%s)' % (name, nn, lost, (', %.1f down' % kos) if kos >= 0.05 else '') for name, nn, lost, _, kos in S['groups'][:k])
    spent = [('%s %.2f' % kv) for kv in S['casts'][:4]]
    return g, ', '.join(spent)


def write_table(sums, chained, n, seed, floor=None, floorch=None):
    """The generated half of here-to-there.md: the table a leg, the chains, the five thinnest, each leg's line."""
    lines = []
    A = lines.append
    A(BEGIN)
    A('')
    A('`python dev/walk8.py leg=all n=%d table` wrote this block (seed %d: the same seed walks the same walks). `python dev/walk8.py leg=<name> n=20` runs one leg again; '
      '`python dev/walk8.py legs` lists them.' % (n, seed))
    A('')
    floor, floorch = floor or {}, floorch or {}
    def fl(S, ch=None): # the same leg on the guest turn alone, the same dice: its HP (and wipes)
        F = (floorch if ch else floor).get((ch or S['leg'], S['leg']))
        return F if F and F.get('ok') else None
    A('## The table: each leg from a full start, the player\'s hand')
    A('')
    A('| leg | lvl | steps | zones (steps) | fights | rounds | HP | worst | KO | wiped | floor HP | slots left | potions left | drunk | tent | torches lit | rested | reading |')
    A('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    for S in sums:
        if not S.get('ok'):
            A('| %s | %s | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | FAILED: %s |' % (S['leg'], S['lvl'], (S.get('err') or '; '.join(map(str, S['errs'])))[:120]))
            continue
        z = ', '.join('%s %d' % kv for kv in S['zones'].items()) or 'none'
        rest = ', '.join('%s %s' % (k, pct(v)) for k, v in S['rested'].items()) or '--'
        F = fl(S)
        A('| **%s** | %s | %d | %s | %.1f | %.1f | %s | %s | %s | %s | %s | %s | %.1f+%.1f | %.2f | %s | %.1f | %s | %s |' % (
            S['leg'], S['lvl'], S['path']['steps'], z, S['fights'], S['rounds'], pct(S['hp']), pct(S['hp_worst']), pct(S['ko']), pct(S['wiped']),
            (pct(F['hp']) + (' (wiped %s)' % pct(F['wiped']) if F['wiped'] else '')) if F else '--',
            fmt_slots(S), S['potion'], S['greaterpotion'], S['potions_drunk'], pct(S['tent']) if S['tent'] else '--', S['torches_lit'], rest, reading(S)))
    A('')
    for nm, why in NO_WALK:
        A('- **%s**: %s.' % (nm, why))
    A('')
    if chained:
        A('## The chains: the road since the last bed')
        A('')
        A('The same legs walked one after another, nothing reset between the doors and no boss fought (the grid fights those): each row is what the road alone has '
          'taken since the party last slept, the floor under what it really brings (the boss before it costs more on top). A walk that wiped earlier counts as wiped at every door after.')
        A('')
        A('| chain | door | steps | fights | HP | worst | KO | wiped by then | floor HP | floor wiped | slots left | potions left | tent by then | rested on the way | reading |')
        A('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
        for S in chained:
            if not S.get('ok'):
                A('| %s | %s | FAILED | | | | | | | | | | | | |' % (S.get('chain'), S['leg'])); continue
            rest = ', '.join('%s %s' % (k, pct(v)) for k, v in S['rested'].items()) or '--'
            F = fl(S, S['chain'])
            A('| %s | **%s** | %d | %.1f | %s | %s | %s | %s | %s | %s | %s | %.1f+%.1f | %s | %s | %s |' % (S['chain'], S['leg'], S['path']['steps'], S['fights'], pct(S['hp']), pct(S['hp_worst']), pct(S['ko']), pct(S['wiped']),
              pct(F['hp']) if F else '--', pct(F['wiped']) if F else '--', fmt_slots(S), S['potion'], S['greaterpotion'], pct(1 - S['tent0']) if S.get('tent0') is not None and S['tent0'] < 1 else '--', rest, reading(S)))
        A('')
    A('## Each leg')
    A('')
    for S in sums:
        L = LEGD[S['leg']]
        A('**%s** -- %s. Level %s%s; from %s.%s' % (S['leg'], L['title'], S['lvl'], (' (' + L['guess'] + ')') if L.get('guess') else '', L['start'], (' ' + L['note'][0].upper() + L['note'][1:] + '.') if L.get('note') else ''))
        if not S.get('ok'):
            A(''); continue
        hs = ', '.join('%s%s %s%s' % (nm, ' (guest)' if v['guest'] else '', pct(v['hp']), (' down ' + pct(v['ko'])) if v['ko'] else '') for nm, v in S['heroes'].items())
        used = {kk: v for kk, v in S['feats'].items() if v[0] < v[1]}
        g, spent = drained(S, 4)
        A('Path %d steps, %s. At the door: %s. Features spent: %s. Spells spent: %s. Silver +%d a walk%s.' % (S['path']['steps'], ' > '.join(S['path']['maps']), hs,
          ', '.join('%s %g of %g left' % (kk, a, b) for kk, (a, b) in used.items()) or 'none', spent or 'none', round(S['silver']),
          ('; level %.2f at the door' % S['lvl_door']) if abs(S['lvl_door'] - S['lvl']) > 0.01 else ''))
        if g:
            A('The road\'s fights: ' + g + '.')
        A('')
    ok = [S for S in sums if S.get('ok')]
    thin = sorted(ok, key=lambda S: (S['hp'] - S['wiped'], -S['ko']))[:5]
    A('## The five that arrive thinnest (from a full start), and what drained them')
    A('')
    for k, S in enumerate(thin):
        g, spent = drained(S)
        hs = ', '.join('%s %s%s' % (nm, pct(v['hp']), (' (down ' + pct(v['ko']) + ')') if v['ko'] else '') for nm, v in S['heroes'].items())
        used = {kk: v for kk, v in S['feats'].items() if v[0] < v[1]}
        A('%d. **%s** (%s): HP %s, worst %s, a hero down in %s, wiped %s. At the door: %s. Drained by: %s. Spent in the fights: %s%s.' % (
            k + 1, S['leg'], LEGD[S['leg']]['title'], pct(S['hp']), pct(S['hp_worst']), pct(S['ko']), pct(S['wiped']), hs, g or 'nothing', spent or 'no spell',
            ('; features: ' + ', '.join('%s %g of %g left' % (kk, a, b) for kk, (a, b) in used.items())) if used else ''))
    A('')
    A(END)
    return lines


def write_md(path, block):
    """Put the generated block into here-to-there.md between its markers, the seat\'s words around it kept; a new file gets a bare heading."""
    if os.path.exists(path):
        old = open(path, encoding='utf-8').read().split('\n')
        if BEGIN in old and END in old:
            i, j = old.index(BEGIN), old.index(END)
            return old[:i] + block + old[j + 1:]
    return ['# Here to there: what the party brings to each boss', ''] + block


def main(argv):
    kw = dict(a.split('=', 1) for a in argv if '=' in a)
    flags = [a for a in argv if '=' not in a]
    if 'legs' in flags:
        for name, L in LEGS:
            print('%-10s lvl %-2s %-22s -> %-40s %s' % (name, L['lvl'], '%s %d,%d' % tuple(L['frm']), json.dumps(L['to']), L['title']))
        for name, legs, t in CHAINS:
            print('%-10s chain: %s (%s)' % (name, ' > '.join(legs), t))
        return 0
    name = kw.get('leg', 'gulch'); n = int(kw.get('n', 20)); seed = int(kw.get('seed', 1)); lvl = kw.get('lvl')
    names = [x for x, _ in LEGS] + [c for c, _, _ in CHAINS] if name == 'all' else name.split(',')
    bad = [x for x in names if x not in LEGD and x not in CHAIND]
    if bad:
        print('FAIL no leg named %s (python dev/walk8.py legs)' % ', '.join(bad)); return 1
    pg = page()
    jobs = int(kw.get('jobs', 4))
    # hand=1 (the default since 10-03): the player's hand; hand=0: the guest turn alone, the floor. The table walks both, the same dice
    hands = [True, False] if 'table' in flags else [kw.get('hand', '1') != '0']
    with ThreadPoolExecutor(jobs) as ex:
        extra = dict((k, kw[k]) for k in ('group', 'tent') if k in kw)
        res = list(ex.map(lambda xh: run_leg(pg, xh[0], n, seed, lvl, log='log' in flags, hand=xh[1], extra=extra), [(x, hd) for hd in hands for x in names]))
    sums, chained, floor, floorch, red = [], [], {}, {}, False
    for r in res:
        quiet = 'table' in flags and not r.get('hand', True) # (the floor's walks feed the table's floor columns; the hand's are printed)
        if 'error' in r:
            print('FAIL %s: %s %s' % (r['leg'], r['error'], r.get('load'))); red = True
            if r['leg'] in LEGD:
                sums.append({'leg': r['leg'], 'lvl': r.get('lvl') or LEGD[r['leg']]['lvl'], 'n': 0, 'ok': 0, 'errs': [], 'err': r['error']})
            continue
        for part in (split_chain(r) if r['leg'] in CHAIND else [r]):
            S = summarize(part)
            if quiet:
                (floorch if r['leg'] in CHAIND else floor)[(r['leg'], S['leg'])] = S
                if S.get('err') or S['errs'] or not S['ok']:
                    print('FAIL the floor\'s %s: %s' % (S['leg'], S.get('err') or S['errs'][:1])); red = True
                continue
            if r['leg'] in CHAIND:
                S['chain'] = r['leg']; chained.append(S)
                if S['leg'] == CHAIND[r['leg']][0][0]:
                    print('######## the chain %s: %s (nothing reset between the doors; no boss fought)' % (r['leg'], CHAIND[r['leg']][1]))
            else:
                sums.append(S)
            print_summary(S)
            if 'log' in flags:
                for x in part['runs'][:1]:
                    for f in x.get('fights', []):
                        print('  -- the first walk, step %d (%s): %s' % (f['step'], f['zone'], ', '.join(f['foes'] or ['fled'])))
                        for ln in f.get('log') or []:
                            print('       ' + ln)
            if S.get('err') or S['errs'] or not S['ok']:
                red = True
            if 'check' in flags and S.get('ok') and not S['fights'] and not S['fled']:
                print('FAIL %s: the walk met no fight, so the battle half of the bench went unrun' % S['leg']); red = True
    if 'json' in kw:
        json.dump(res, open(kw['json'], 'w'), indent=0)
    if 'table' in flags:
        out = os.path.join(ROOT, 'here-to-there.md')
        lines = write_md(out, write_table(sums, chained, n, seed, floor, floorch))
        open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines).rstrip('\n') + '\n')
        print('wrote ' + out)
    return 1 if red else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

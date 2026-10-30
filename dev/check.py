"""One command, green or red (10-01b: the gate question, Griz: "the gate bit is about how we're just constantly changing the live version
of the game and that's a bad way to do things?" -- the seat's call: no deploy gate while he is the only player, but no push on red;
since 2026-10-14 Pages deploys from the `live` branch and main is the workshop -- CLAUDE.md).
The after-every-edit benches in one run; exit 0 green, 1 red. From PowerShell (headless Edge answers nothing from the Bash sandbox).

  python dev/check.py          quick: the every-spell check, three fights, sixteen modes (about 20 s)
  python dev/check.py all      every mode in bench16.js, the 8-bit battle benches, the wet and Pyro probes
"""
import os, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import bench16

SPELLS_BY_DESIGN = {'calllightning', 'plantgrowth', 'conjurewoodlandbeings'}  # no sky, no plants, nothing to answer
QUICK_FIGHTS = [
    {'foes': 'x', 'fight': 'brood', 'lvl': '5', 'n': '2', 'seed': '1'},
    {'foes': 'cleric:9,wizard:9', 'lvl': '9', 'n': '4', 'seed': '1'},
    {'foes': 'goblin,goblin,goblin', 'vs': 'wizard,wizard,wizard', 'lvl': '5', 'n': '4', 'seed': '1'},
    {'foes': 'harbinger', 'lvl': '7', 'n': '3', 'seed': '1'},   # (the Harbinger alone against the four at 7th, 10-08: his Pounce, Drink Light, Foretell, Kneel run without an error)
    {'foes': 'harbinger', 'vs': 'greyfang:11,fighter:7,cleric:7,wizard:7', 'lvl': '7', 'n': '2', 'seed': '3'},   # (GreyFang and the Grey Road against him, 10-08: Turn It Aside, Give Ground, Sweep the Ring run without an error)
    {'foes': 'gnoll,gnoll,gnoll,gnoll', 'vs': 'greyfang:11,fighter:7', 'lvl': '7', 'n': '2', 'seed': '5'},   # (his Covering Volley round the fighter)
    {'foes': 'x', 'fight': 'greyfang', 'lvl': '7', 'n': '2', 'seed': '2'},   # (GreyFang's pit, 10-08: the hunt, his fall, and the ending -- js/trophy.js -- run without an error)
    {'foes': 'harbinger', 'vs': 'greyfang:11,lymen:7', 'lvl': '7', 'n': '2', 'seed': '1', 'callN': 'read'},   # (the party read, 10-08 evening: his toying -- js/traits.js toy)
    {'foes': 'harbinger', 'vs': 'aurdin:9,vivian:9,barley:9,lymen:9', 'lvl': '9', 'n': '2', 'seed': '1', 'callN': 'read'},   # (his mirror double, the pack's laugh and the fear scale -- js/traits.js mirrorDouble, packLaugh; rules.js RU.FEAR)
    {'foes': 'gnollmatriarcheldest,gnollmatriarchguard,gnollmatriarchguard,gnollmatriarchguard,gnollmatriarch,gnollmatriarch,gnollmatriarch', 'lvl': '8', 'n': '2', 'seed': '1'},   # (the Snoot's death-watch on the grid, 10-16: the Eldest's legendary actions -- js/traits.js `cast`, `call` -- and her Legendary Resistance run without an error)
]
QUICK_MODES = ['pelt1030', 'breath1030', 'account1030', 'rootdrag1030', 'gnaw1030', 'follow1030', 'drill1030', 'threshing1030', 'house1030', 'stabdebut1029', 'house1029o', 'story1029n', 'house1029n', 'levelcls1029', 'victory1029','board1029', 'rules1029', 'story1029b', 'galleries1029', 'notes1029d', 'gridclicks1029', 'notes1029c', 'notes1029', 'isoroams1029', 'cut1029', 'cutscene1029', 'generic1028', 'housefix1028c', 'deepgallery1028', 'gulch1028', 'roost1028', 'gridlight1028', 'hours1028', 'maps1028', 'housefix1028b','housefix1028', 'turn1028', 'notes1028', 'opening1028', 'housenotes1028', 'spark1028', 'hexart1028', 'glowseep1028', 'keys1028', 'pocketkeys1027', 'wet1022','house1022', 'hex1022', 'toplevels1021', 'mines1022', 'rulings0930', 'doorfloor1006', 'features', 'mpmon1006', 'mpgallery1007', 'gstutorial1007', 'gswaves1007', 'gssupplies1007', 'charms', 'walls', 'familiar', 'globe1001c', 'ring1001c', 'sleep1001c', 'tendrils1002', 'ready1002', 'ready1002b', 'ready1005', 'skyshow', 'dispel1002', 'joke1002', 'pocket1002', 'pocketdm1009', 'pocket1021', 'sheetpdf1026', 'fixes1003', 'lazy1003', 'rules1003', 'drawfloor1003', 'rungs1004', 'edifice1004', 'fixes1005', 'under1005', 'oil1005', 'torch1005', 'skylights1005', 'spiders1005', 'rules1006', 'looks1007', 'menus1007', 'goblinhide1007', 'rockcatch1008', 'thrown1008', 'rules1008', 'rules1013', 'rules1015', 'rules1021', 'rules1021b', 'rules1021c', 'rules1022', 'spray1022', 'monsters1028', 'touch1027', 'fly1028', 'leave1013', 'leave1015', 'shaken1015', 'release1015', 'fix1013', 'fix1014', 'flight1008', 'gallery1008', 'flyrings1008', 'scourge1014', 'roam1013', 'roam1014', 'campfire1014', 'levelpick1014', 'options1015', 'qcam1015', 'putaway1015', 'ring2spells1015', 'twf1015', 'feats1015', 'grapple1015', 'grappler1015', 'conc1017', 'aurdin1018', 'barley1020', 'barleyshow', 'barleychain1020', 'ratswarm1020', 'town1020']
ALL_MODES = ['pelt1030', 'breath1030', 'account1030', 'rootdrag1030', 'gnaw1030', 'follow1030', 'drill1030', 'threshing1030', 'house1030', 'stabdebut1029', 'house1029o', 'story1029n', 'house1029n', 'levelcls1029', 'victory1029','board1029', 'rules1029', 'story1029b', 'galleries1029', 'notes1029d', 'gridclicks1029', 'notes1029c', 'roads1029', 'notes1029', 'isoroams1029', 'cut1029', 'cutscene1029', 'generic1028', 'housefix1028c', 'deepgallery1028', 'gulch1028', 'roost1028', 'gridlight1028', 'hours1028', 'maps1028', 'housefix1028b','housefix1028', 'turn1028', 'notes1028', 'opening1028', 'housenotes1028', 'spark1028', 'hexart1028', 'glowseep1028', 'keys1028', 'pocketkeys1027', 'wet1022','house1022', 'hex1022', 'near1022', 'world1022', 'services1022', 'toplevels1021', 'mines1022', 'simple1021', 'winters1021', 'ned1021', 'house1021', 'town1020', 'ratswarm1020', 'barleychain1020', 'barleyshow', 'barley1020', 'aurdin1018', 'module1017', 'market1017', 'conc1017', 'mpmon1006', 'mpgallery1007', 'gstutorial1007', 'gswaves1007', 'gssupplies1007', 'doorfloor1006', 'items', 'lantern', 'ledgerlamp', 'druid12', 'rulings0930', 'featurewalk', 'ring0930', 'campcast', 'druidlast', 'charms',
             'walls', 'zones', 'subs', 'auras', 'familiar', 'features', 'matrix', 'globe1001c', 'ring1001c', 'sleep1001c', 'show', 'tendrils1002', 'ready1002', 'ready1002b', 'ready1005', 'skyshow', 'dispel1002', 'joke1002', 'pocket1002', 'pocketdm1009', 'pocket1021', 'sheetpdf1026', 'fixes1003', 'lazy1003', 'rules1003', 'drawfloor1003', 'rungs1004', 'edifice1004', 'fixes1005', 'under1005', 'oil1005', 'torch1005', 'skylights1005', 'spiders1005', 'rules1006', 'looks1007', 'menus1007', 'goblinhide1007', 'rockcatch1008', 'thrown1008', 'rules1008', 'rules1013', 'rules1015', 'rules1021', 'rules1021b', 'rules1021c', 'rules1022', 'spray1022', 'monsters1028', 'touch1027', 'fly1028', 'leave1013', 'leave1015', 'shaken1015', 'release1015', 'fix1013', 'fix1014', 'flight1008', 'gallery1008', 'flyrings1008', 'scourge1014', 'roam1013', 'roam1014', 'campfire1014', 'levelpick1014', 'options1015', 'qcam1015', 'putaway1015', 'ring2spells1015', 'twf1015', 'feats1015', 'grapple1015', 'grappler1015']
QUICK_SCRIPTS = [['dev/eyes-probe.py'], ['dev/pages-probe.py'], ['dev/snoot-probe.py'], ['tools/flags.py']] # (pages-probe, 10-08: a merge's leftover marker line or a script loaded twice in a page -- 898b215's rode eight GREEN pushes) (snoot-probe, 10-14: the Snoot mode -- the books' numbers, his rules, eight whole battles, the notes box at the end, the stamps)
# (10-06: the eyes list draws on situations.html -- his ear; 3d4f63f shipped js/eyes.js unparseable for a commit and the page drew no eyes rows; ~5 s, so before every push)
# (tools/flags.py, the flags registry: every flag read or set named in content/flags.json -- compile.py refuses the same; in the quick gate since 10-21, Griz: "yes to all 3" -- 6993e1c's `cond: 'mageArmor'` in deep16/js passed the quick gate and stopped the 8-bit's compile for two hours; about a second)
ALL_SCRIPTS = [['dev/bench8.py', 'lymen'], ['dev/bench8.py', 'ingrith'], ['dev/bench8.py', 'sheets1001c'], ['dev/bench8.py', 'srd1002'], ['dev/bench8.py', 'familiar'], ['dev/bench8.py', 'ledgerlamp8'], ['dev/bench8.py', 'ledgerlamp8seam'], ['dev/bench8.py', 'fixes1003'], ['dev/bench8.py', 'reactions1003'], ['dev/bench8.py', 'wet3'],
               ['dev/wet-probe.py'], ['dev/wet8-probe.py'], ['dev/pyro-probe.py'], ['dev/pyro8-probe.py'], ['dev/srdleft-probe.py'],
               ['dev/bench8.py', 'floor1003'], # (the floor under the player: a story fight is the 8-bit battle at once -- till 10-20 a grid crash or no ready fell back to it -- a bad save loads, a warp's throw fades back -- the review, 10-03)
               ['dev/bench8.py', 'xp1005'], ['dev/bench8.py', 'ending1020'], ['dev/bench8.py', 'door1020'], # (THE FIRST GAME's ending, 10-20 -- in place of skylights8, the call from the surface: the raid to the credits THE ROAD IS HELD by the 8-bit battle, no frame, a save from the Skylights' weeks onto that road; and the ship's door, ?at=ending)
               # (the guests stand in the XP split and bank nothing, RULED 10-05: a fight's pool and the landlord's fed XP, a guest down or never fielded not counted, a solo fight one hero's)
               ['dev/bench8.py', 'migrate'], # (the only old-save test: an older save walked on through DS.startFrom -- the review, 10-03)
               ['dev/bench8.py', 'menus1003'], # (a menu's title wraps inside its box: the reaction ask for every spell the 8-bit knows, 10-03)
               ['dev/loaderr-probe.py'], # (bench8.py hands back a script that failed to load though the page wrote its result -- the todo §6, 10-07)
               ['dev/bench8.py', 'menu1006'], # (the one menu, js/menu.js: every entry opens and draws, the panel's pick asked once, STATUS's two old bugs, ITEMS and GEAR hold the pack, the bonds -- 10-06)
               ['dev/bench8.py', 'menu8fight1007'], ['dev/bench8.py', 'fixes1008'], # (the 8-bit's in-fight menu acts as the grid's: ITEMS, MAGIC and SKILLS the fight's own lists, lit by cost, a pick the turn's command -- 10-07)
               ['dev/bench8.py', 'wear1007'], # (the wearables' finds, 10-07: the Poison Periapt ends a poison carried to it -- R.ward, a rest reads it; the 8-bit's line for a blow of a type a worn thing bars says "immune", not "for 0")
               ['dev/bench8.py', 'battle1006'], # (the 8-bit battle lane, 10-06: the dice off the particles, the small SRD misses, the guest turn, the prone cue, the floor's last holes)
               ['dev/bench8.py', 'levelpick1014'], # (the level-up pick, 10-14: the asks the level-up leaves, the page over the field, the pool, a swap that a load keeps, the archetype and Expertise on it)
               ['dev/bench8.py', 'scourge1014'], # (Searing Scourge in the 8-bit, 10-14: the sheets copied, the three it takes, Deathhand's two dice by slot)
               ['dev/bench8.py', 'fixes1014'], # (the bug-fix seat's 8-bit checks, 10-14: the halls hand off to the Keeper's Water while Halldor mends; the arrow's way walked, Skarn's gate shut or open; the arrow down the spine)
               ['dev/bench8.py', 'fixes1020'], # (the first game's 8-bit fixes, 10-20 -- in place of snootcall1015, THE SNOOT from the road, out with the Skylights: Dace at the pit, under the cloaker and at the mine's mouth, the drummer at his drum, the shops and the starter gear, END HOLD on a dead mark, the dock and the chuul's corpse)
               ['dev/bench8.py', 'conc1017'], # (END <the spell held>, free, in the 8-bit: SKILL's row, the turn goes on -- 10-17)
               ['dev/bench8.py', 'stabdebut1029'], # (Stab Debut in the 8-bit, 10-29: Vivian's Cutthroat stabs once more, the dice alone, at a foe that hasn't had a turn -- in place of Opening Cut)
               ['dev/bench8.py', 'twf1015'], # (two-weapon fighting in the 8-bit, 10-15: FIGHT's off-hand swing without the modifier, and Pyro's own swings as they were)
               ['dev/bench8.py', 'offhand1015'], # (the OFFHAND, 10-15, the menus lane §2.5: EQUIP's place, its list, the light there in the field and the fight, a shield the action)
               ['dev/bench8.py', 'noeggs1021'], # (the eggs off the first game's load screen, 10-21, his "pull the eggs off the 8 bit loads": no row carries them, CONTINUE FROM and SAVE WHERE? draw one line a save; eggs1015 before it)
               ['dev/bench8.py', 'wetfloor1020'], # (the Wet on its own 8-bit floor again, 10-20 -- in place of roam8, the Wet on the grid: no frame in warrens_d, a save there loads on the floor, the Settling's triggers play the 8-bit battle)
               ['dev/bench8.py', 'payout1014'], # (a won fight's payout lifted into js/rules.js, 10-14, the party-token map lane: the same XP, coin, drops, parts, tally and lines -- one copy the grid's roam pays by too)
               ['dev/bench8.py', 'fixes1013'], # (the bug-fix seat's 8-bit checks, 10-13: a paladin's level-up names what opens; the Elixir of Health in the field; walking into a person talks)
               ['dev/bench8.py', 'lamp1013'], # (the one Ledger-Lamp, 10-13: a save holding two -- the Skylights' doubled pack -- loads with one, the lit one kept)
               ['dev/bench8.py', 'escorts1013'], # (the escorts and the save, 10-13: Brann and Hedda through a save and a load, the Raid lets them go, a save past it mended, a fallen guest's sit-out said once)
               ['dev/bench8.py', 'story1006'], # (the story walk, 10-06: the spine beat by beat, the journal's door there, in reach from Silverton and played to move the story; every flag read named in content/flags.json)
               ['dev/bench8.py', 'countdown1003'], # (the encounter countdown carried across map loads, RULED 10-03: a load, a warp and the chalk keep it; a new field rolls; a carried count fires)
               ['dev/keeper-probe.py'], # (10-03, the stream's fixes: the Keeper's own probe, its fixes' checks in it -- the retreat, the break-free, the swirl's end, the prone rules, the opener, the log, the card)
               ['dev/walk8.py', 'leg=gulch', 'n=1', 'check']] # (here-to-there, 10-03: one walk of the shortest leg sure to meet a fight -- 35 steps in the gulch's zone against a countdown of at most 26 -- so the walker can't rot)


def spells():
    r = bench16.run({'mode': 'spells'})
    if 'error' in r:
        return ['spells: LOAD FAILED ' + str(r)[:300]]
    bad = [e for e in r.get('errors', []) if e.split(':')[0].strip() not in SPELLS_BY_DESIGN]
    return ['spells: ' + e[:300] for e in bad]


def fight(p):
    r = bench16.run(p)
    name = p['foes'] + (' fight=' + p['fight'] if p.get('fight') else '') + (' vs=' + p['vs'] if p.get('vs') else '')
    if 'error' in r:
        return [name + ': LOAD FAILED ' + str(r)[:300]]
    return [name + ': ' + e.replace('\n', ' ')[:300] for e in r.get('errors') or []]


MODE_FOES = {'items': 'fighter:5', 'show': 'grick,xorn,roper,troll,stonegiant,stonegiantm,gnollmatriarchlama'}  # (a mode that fights its foes wants real ones; the rest set up their own. show: the Blender monsters on the test ground, every row twice -- 10-02; the Gray Keeping's matriarch on her ART-68 sheet, the band's Lama for her prayers, 10-16)


def mode(m):
    r = bench16.run({'foes': MODE_FOES.get(m, 'x'), 'mode': m, 'lvl': '5', 'n': '1', 'seed': '1'}, timeout=900)
    if 'error' in r:
        return [m + ': LOAD FAILED ' + str(r)[:300]]
    out = [m + ': ' + c[:300] for c in r.get('checks', []) if c.startswith('FAIL')]
    out += [m + ': ' + str(e).replace('\n', ' ')[:300] for e in r.get('errors') or []]
    return out


def script(cmd):
    p = subprocess.run([sys.executable] + cmd, cwd=ROOT, capture_output=True, timeout=900)
    txt = p.stdout.decode('utf-8', 'replace') + p.stderr.decode('utf-8', 'replace')
    bad = [l for l in txt.splitlines() if re.search(r'\bFAIL|Traceback|LOADERR|Error:|no result', l)] # (no result: a probe whose browser never answered printed it and exited 0, and read ok -- five probes in every cloud seat's gate till 10-03, the review seat's find)
    if p.returncode and not bad:
        bad = ['exit ' + str(p.returncode) + ': ' + txt.strip().splitlines()[-1][:200] if txt.strip() else 'exit ' + str(p.returncode)]
    return [' '.join(cmd) + ': ' + l[:300] for l in bad]


def main(argv):
    full = 'all' in argv
    jobs = [('spells', spells, None)] + [('fight', fight, p) for p in QUICK_FIGHTS] + [('mode ' + m, mode, m) for m in (ALL_MODES if full else QUICK_MODES)]
    t0 = time.time()
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda j: (j[0], j[1](j[2]) if j[2] is not None else j[1]()), jobs))
    scripts = QUICK_SCRIPTS + (ALL_SCRIPTS if full else []) # (the quick gate runs the eyes probe too, 10-06)
    with ThreadPoolExecutor(4) as ex: # (four at a time since 10-06: the 8-bit bench and the probes each write a page of their own now, not one by a fixed name)
        res += list(ex.map(lambda c: (' '.join(c), script(c)), scripts))
    jobs += scripts
    red = [line for _, lines in res for line in lines]
    for name, lines in res:
        print(('RED   ' if lines else 'ok    ') + name)
    for line in red:
        print('  ' + line)
    print('%s  (%d checks, %.0f s)' % ('RED' if red else 'GREEN', len(jobs), time.time() - t0))
    sys.exit(1 if red else 0)


if __name__ == '__main__':
    main(sys.argv[1:])

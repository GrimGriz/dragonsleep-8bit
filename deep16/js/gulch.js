/* DEEP16 -- WEB GULCH ON THE GRID (10-28, the gulch seat, started by the lanes desk; ..\handoff-2026-10-03-the-road-and-its-rewards.md, its 10-28 section). The first
   of the road's legs as grid maps (HELD 10-21, "still later, we have to finish replacing the 8 bit first"). Griz, 10-28: "I think we're ready to build the gulch roam. The
   8bit one wasn't bad, but we want this one to slow down time progression greatly (compared to road) and run basically N-S ish like it looks like on the map (8 bit was
   kinda east to west)"; on the seat's five leans, "Gulch's leans look good" (RULED 10-28, all five):
     1 IN AND OUT: the Pit road's gulch hexes on the Silverton area are the floor -- the road walked into them from either end takes the party down onto it ("if you make it
       through the gulch, you get to the inn", wiki/web-gulch.md); out by the far mouth onto the road beyond; any other rim square asks "Return to the world map?" onto the
       bank top that side; going round on the bank tops stays the march.
     2 THE RATE: 300 squares an hour on the floor (the Glowseep's 150, Silverton's 500), a fight fifteen minutes as everywhere, the spider table at its own rate.
     3 THE FIRST GAME'S BEATS: the silk-cutters' camp and the drummer boy at the north mouth, the snared lad off the road midway (the grid's `snared`), the braiding
       ettercap up a side gully near the south end (the grid's `ettercap` on its webbed map; Hessle's board pays the fangs), the two chests, the gulch's spider table on
       fields cut from the floor.
     4 THE NOON: 11 to 14 the cutters out at the webs and the boy drumming, the fights half as often ("the spiders sulk"); by night twice as often, as the Glowseep's.
     5 A BED: none here -- the party sleeps on THE WORLD, or goes back up a mouth to camp. (REVERSED 11-16, Griz: "yes on the leans" -- the cutters' fire a camp with
       its watch kept and the morning saved there: THE CUTTERS' FIRE A CAMP below, built 11-20)
   The floor is the seat's own (Gu.ROWS, 40 x 112, north up), laid along his paint's line: the Pit road down the bed from the fork's end, bending a little east as it
   goes south as his road does (the cut's paint is the 10-20 seed, `seeded.gulch1020`: mile hexes within 0.75 mi of the road, 350 ft under its banks). It rides the
   top levels' floors (js/mines.js M.FLOORS, `own` with its map; M.tick's clock by its rate, M.light by its phases) and THE WORLD's step (js/world.js W.onStep). */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, M = D.mines, T = D.town, W = D.world, Gu = D.gulch = {};
  if (!M || !T || !W) return;
  var L = function (k, o) { return D.counter.L(k, o); };
  Gu.KEY = 'webgulch'; // (the floor's key and THE WORLD's site: D.MAPS.gulch is the strung end's fight map, js/data/maps.js)
  // the clock (his lean 2) and the hours' fights (lean 4)
  Gu.RATE = {
    squaresPerHour: 300, // (walked on the floor: an hour of THE WORLD's clock -- straight down the road, about 112 squares, is 22 minutes. Spent only with &view=top since 10-29 night: on the diamonds the walk spends nothing, RULED, js/mines.js M.tick)
    fightHours: 0.25,    // (each fight: fifteen minutes, as js/world.js W.FIGHT_HOURS)
    noonRate: 2,         // (11 to 14 the spiders sulk: the table's count between fights doubled)
    nightRate: 0.5       // (by night the count halved: twice as often)
  };
  Gu.NOON = [11, 14];

  // ---------------------------------------------------------------- the floor (the seat's draft, his paint later): 40 x 112, north up
  Gu.ROWS = [
    '################.,,..###################', '##############...,,....#################', '############......,,.....###############', '###########"......,,......##############',
    '##########."......,,........############', '########""."......,,..........##########', '#######."""....."",,............########', '#####...........".,,.............#######',
    '######...k..k..k"",,.............#######', '######.........."",,....".........######', ':::::::::...o...".,,...."........#######', ':::::::::.........,,...".........#######',
    '#####.....c...c...,,..."".........######', '#####""...........,,...."".....""#######', '#####""............,,..b......""""######', '######".....x......,,.........""."######',
    '######"......x.....,,.........".""######', '#####......".".....,,.........."..######', '#####x....x".".....,,............#######', '######.....""".....,,............#######',
    '#######..x."""x....,,........xx..#######', '######....."".....",,............#######', '#######x....x.x...",,"....x.....########', '#######...x.x.....",,"..........########',
    '#######..x..x.x...",,.....".....########', '#######.x..x....x..,,..xx.""...x########', '########..x.x......,,...."x"...#########', '########.x.xx...x..,,......""..#########',
    '#########x.xxx..x..,,......"...#########', '########xxxx....x..,,....x....##########', '########".x........,,.....x..x##########', '##########.....x...,,.........##########',
    '##########....x."..,,..t......##########', '#########...."""...,,........###########', '###########.."""...,,........###########', '###########.."""...,,""...tx############',
    '##########.........,,"""....############', '##########x...x....,,"""...#############', '############.......,,".".x.#############', '###########........,,""....#############',
    '############.......,,......#############', '###########.......,,......##############', '###########....x..,,.......#############', '###########x.t....,,......##############',
    '###########"......,,......##############', '###########"......,,.......#############', '###########.......,,......##############', '###########....."",,.......#############',
    '###########x...."",,...t..##############', '###########.....".,,......##############', '###########x...."",,.....".x############', '############......,,...x""x.############',
    '###########.......,,..."".".x###########', '###########........,,.xxx"..x###########', '###########........,,.tQt.b..###########', '###########........,,.x.x..x.###########',
    '##########.........,,.....x..###########', '###########..".....,,......x############', '##########.""."....,,.......############', '##########.."".....,,........:::::::::::',
    '#########..""".x...,,........:::::::::::', '##########.........,,".......###########', '##########........",,..t.....t##########', '##########......x.",,"..x.....##########',
    '#########......t..",,......xx.##########', '#########....bx....,,.....x"".##########', '#########..x.......,,...x""""..#########', '########..x..xx.x..,,....".""...########',
    '#########x..........,,...."x....########', '#########"..........,,...x.....#########', '#########"....x..x..,,......xx..########', '##########..x.......,,.....x...#########',
    '#########.....t"x...,,...x....x.########', '##########.xx..""...,,.......x..########', '###########..""."...,,.......b...#######', '##########...""".x..,,""..x..x..########',
    '###########x........,,"".t...xx..#######', '################.....,,".....x...#######', '################.....,,"...x....########', '################.....,,......x""########',
    '################.....,,..x..".."########', '#####.x.x.######x.x..,,.....""xx########', '####.x.xxxx#####x.x..,,...x."..#########', '###x.xxxx.xx####.....,,.....x"x#########',
    '##.xbxx.x.xx.###.....,,..x.....#########', '##.xx....x.x.###.....,,........#########', '##x.......x.x....""..,,.......x#########', '##xx........bx.."x""..,,......##########',
    '##..x.x.x...####."x"..,,.......#########', '##xxxbxx.x.x.###"""...,,.......#########', '###.xxx..bxx####""....,,"""....#########', '####x..x..x#####......,,"."...##########',
    '#####xx.x.#######.....,,""....##########', '################...x..,,""....##########', '#################.....,,"..x...#########', '#################..x..,,......##########',
    '##################....,,....x.##########', '#################.....,,...xx..#########', '##################....,,......##########', '#################.....,,......##########',
    '##################....,,......##########', '##################.".",,.......#########', '#################."."",,.......#########', '#################."..",,.......#########',
    '#################x."".,,...""..#########', '#################x."..,,.."""..#########', '##################....,,..".".##########', '##################....,,..""".##########',
    '##################....,,...".###########', '###################...,,.....###########', '###################...,,....############', '#####################.,,..##############'
  ];
  // the first game's names for the squares (js/mines.js M.LAY lays each, js/topview.js draws it: gravel the bed, the old webbing, the rock banks, pine for the stunted trees)
  Gu.LEGEND = { '#': 'cliff', '.': 'gravel', ',': 'road', '"': 'grass', x: 'webFloor', t: 'tree', k: 'tent', c: 'crate', o: 'firepit', b: 'bones', Q: 'cocoon', ':': 'dirt' };
  M.LAY.cocoon = ['k']; // (the snared lad, silk-wrapped between two stunted trees: a thing standing there -- js/topview.js draws it as a bundle)
  Gu.FIRE = [12, 10];        // the silk-cutters' fire, inside the north mouth
  Gu.SNARE = [23, 54];       // the snared lad (the first game's S.snared)
  Gu.ZONE = [0, 15, 40, 97]; // the spiders' ground: all but the camp at the north mouth ("The boy drums so nothing surprises anyone")
  Gu.CHESTS = [{ x: 9, y: 83, item: 'potion', n: 1 }, { x: 28, y: 74, item: 'kit', n: 2 }]; // (the first game's two: a potion by the ettercap, two kits off the bed)
  // the cutter and the boy where the hour puts them: at the camp, out at the near webs at noon, by the fire at night
  Gu.PEOPLE = [{ id: 'silkcutter', look: 'worker', day: [11, 9], noon: [13, 27], night: [11, 11], dir: { day: 'right', noon: 'left', night: 'right' } },
    { id: 'drummer', look: 'boy', day: [11, 12], noon: [14, 28], night: [13, 10], dir: { day: 'left', noon: 'left', night: 'left' } }, // (by night beside the fire to its east: on the diamonds 13,11 stood straight in front of it, the flames on his head -- 10-29)
    // THE CUTTERS' CAMP, FOUR KEEPERS AND THREE TENTS (RULED 11-16, Griz: "yes on the leans - what's there now NPC wise, one guy and a drummer boy? We'd want to shuffle things
    // around if need be and total 3 tents with two more NPCs to sell secured workers camp"; ..\handoff-2026-10-21-the-warrens-and-galleries-on-the-tiles.md, its 11-16 section;
    // built 11-20 by the gulch seat): the third tent at (15,8) in Gu.ROWS; the camp's guard (the folk `guard` costume) out on the camp's south edge by night, the gully's way
    // in, and out at the webs with the cutters at noon; the crew boss (his own figure, crewboss_p1, data/foes.js crewboss) by the fire by night, with the cutters at noon
    { id: 'gulchguard', look: 'guard', day: [16, 11], noon: [15, 26], night: [12, 14], dir: { day: 'down', noon: 'down', night: 'down' } },
    { id: 'gulchboss', look: 'worker', day: [9, 11], noon: [12, 25], night: [10, 10], dir: { day: 'right', noon: 'down', night: 'right' } }];
  Gu.KINDS = { drummer: 'commonerchild', ettercap8: 'ettercap', gulchboss: 'crewboss' }; // (the boy a child's figure; the ettercap its own, braiding till it is woken -- js/ui.js; the crew boss the SRD's thug in his own figure)
  // their costumes (js/counter.js C.GENERIC, the unnamed in the job's clothes: the figure folk<man>_<costume>_p1, the portrait pt_genman's row): the silk-cutter in `hired`
  // (THE SILK-CUTTER's own costume waits on the dream list -- deep16-dream-polish.md, the art desk at its ceiling), the guard in `guard`; the crew boss his own figure by his
  // kind (data/foes.js crewboss: crewboss_p1 by Gu.KINDS -- not a keeper's C.FIG, the drawn-round keepers' list), the generic man's `crewboss` row his portrait (C.VENDORS)
  (function () {
    var C = D.counter; if (!C || !C.GENERIC) return;
    C.GENERIC.silkcutter = ['man', 'hired']; C.GENERIC.gulchguard = ['man', 'guard'];
    if (C.VENDORS) { C.VENDORS.silkcutter = C.VENDORS.silkcutter || { sheet: 'pt_genman', look: 'hired', wait: '' }; C.VENDORS.gulchguard = { sheet: 'pt_genman', look: 'guard', wait: '' }; C.VENDORS.gulchboss = { sheet: 'pt_genman', look: 'crewboss', wait: '' }; }
  })();
  Gu.phase = function (h) { return M.night(h) ? 'night' : h >= Gu.NOON[0] && h < Gu.NOON[1] ? 'noon' : 'day'; };
  Gu.LINES = { // (the seat's: invented.json web-gulch-floor)
    noon: 'Noon in the gulch: the silk-cutters go out to the webs, and the boy starts drumming. The spiders sulk in the heat.',
    after: 'The cutters come in off the webs with their skeins, and the drumming stops. Out in the silk, the spiders stir.',
    morning: 'Morning comes down the gulch. The cutters stir round their fire.',
    night: 'Night in the gulch. The cutters bank their fire; out in the silk, things wake.',
    mouthN: 'The Pit road, up out of the cut: north to the fork.', mouthS: 'The Pit road, up out of the cut: south toward the Halfway Inn.',
    hello: 'The Pit road runs down its bed: north up out of it to the fork, south to the Halfway Inn. The banks are a way up where they open.'
  };
  Gu.line = function (h) { var p = Gu.phase(h); return p === 'day' ? (h < Gu.NOON[0] ? Gu.LINES.morning : Gu.LINES.after) : Gu.LINES[p]; };
  // the two new keepers' words by the hour (the seat's drafts, 11-20: invented.json web-gulch-camp-keepers); a word with either is M.talk's, their portrait the generic man's
  Gu.KEEPER_LINES = {
    gulchguard: { day: ['"The road\'s yours and the camp\'s the cutters\'. Keep to the one and you\'re welcome at the other."'],
      noon: ['"I go out with them at noon. The spiders sulk in the heat, but sulking isn\'t sleeping."'],
      night: ['"Sit by the fire if you\'re stopping. Anything comes up the gully, the boy hears it before I do."'] },
    gulchboss: { day: ['"Skeins go up to Silverton every third day. Fangs off the far end, Hessle\'s board pays for, if you\'ve the stomach for it."'],
      noon: ['"Cut it clean and roll it tight. Dirty silk sells for rope."'],
      night: ['"Sleeping at our fire? Then you stand a watch like the rest of us. Anything comes up out of the silk, I\'m in it with you."'] }
  };
  // THE CAMP'S NEWS (11-24, world-1124 -- his NOTES of 11-23, day 13 20:00, Web Gulch 11,10: "post ettercap dialog, vs snoot and fleeing farmer activity"; the lean RULED on his
  // "leans otherwise approved", the desk's list E9): the two keepers' words by the hour, as before, and after them the newest of what the camp has heard -- the Snoot's bands out on
  // THE WORLD (js/snootroad.js SR.bands), the word of the burned farms come up the road (SR.rumorDay at the gulch), the glory-seekers broken on the Pit road (snootDone), the
  // ettercap dead at the strung end (Gu.alive) -- the first of those that holds, one line. With the ettercap dead the crew boss's day line no longer sends you to its fangs.
  // The words the seat's drafts (invented.json web-gulch-camp-news-1124)
  Gu.KEEPER_NEWS = {
    gulchguard: { snoot: '"Gnolls out on the road south. You can hear them laughing of a night. They don\'t come down the cut -- not with the silk in it."',
      farms: '"Farm folk on the road at all hours this week, north with what they could carry. They don\'t stop to talk, and I don\'t make them."',
      snootDone: '"They say you broke the laughing ones on the Pit road. The road\'s quieter for the saying of it."',
      ettercap: '"Nothing braiding at the strung end now. The cutters sing going past it."' },
    gulchboss: { snoot: '"The laughing ones are out south. I send the skeins up the hill with four now, not two."',
      farms: '"Burnt farms down the Pit road, they tell me. Nobody\'s buying silk to mend a roof that isn\'t there."',
      snootDone: '"Heard you put the gnolls off the road. Good. Skeins don\'t sell in a ditch."',
      ettercap: '"Quiet at the far end since you went down it. The silk\'s going slack where nothing braids it."' },
    bossDayDone: '"Skeins go up to Silverton every third day. The far end\'s yours to walk now; we\'ll cut it come spring."'
  };
  Gu.news = function (B) { // (the camp's newest word: 'snoot', 'farms', 'snootDone', 'ettercap', or null)
    var f = (D.counter && D.counter.state(B) || {}).flags || (B.roam && B.roam.flags) || {}, SR = D.snootroad, Wd = D.world, out = null;
    try {
      if (SR && SR.on && Wd.house && Wd.house()) {
        if (SR.bands && SR.bands().length) return 'snoot';
        var rd = SR.rumorDay && SR.rumorDay(Gu.KEY); if (rd != null && Wd.day && Wd.day() >= rd) return 'farms';
      }
    } catch (e) { } // (THE WORLD not about -- a test door: the camp has heard nothing of it)
    if (f.snootDone) out = 'snootDone'; else if (!Gu.alive(f)) out = 'ettercap';
    return out;
  };
  Object.keys(Gu.KEEPER_LINES).forEach(function (id) {
    M.SCENES[id] = function* (sc, B) {
      var Ls = Gu.KEEPER_LINES[id], ph = Gu.phase(M.hourNow(D.roam.q, B)), f = (D.counter && D.counter.state(B) || {}).flags || {}, nw = Gu.news(B);
      var ls = [].concat(id === 'gulchboss' && ph === 'day' && !Gu.alive(f) ? [Gu.KEEPER_NEWS.bossDayDone] : Ls[ph] || Ls.day);
      if (nw && Gu.KEEPER_NEWS[id][nw]) ls.push(Gu.KEEPER_NEWS[id][nw]);
      yield sc.say(ls);
    };
  });
  // the first game's shape of a map for the hour (js/mines.js M.floor reads it as it reads theirs): the people where the hour puts them, the fights by the hour, the dark by night
  Gu.map = function (hour, flags) {
    flags = flags || {}; var ph = Gu.phase(hour), rows = Gu.ROWS.slice();
    if (flags['trig:snared']) rows[Gu.SNARE[1]] = rows[Gu.SNARE[1]].slice(0, Gu.SNARE[0]) + 'x' + rows[Gu.SNARE[1]].slice(Gu.SNARE[0] + 1); // (cut down: the silk left between the trees)
    var npcs = Gu.PEOPLE.map(function (p) { return { id: p.id, x: p[ph][0], y: p[ph][1], look: p.look, dir: p.dir[ph] }; });
    var ec = Gu.LAIR.seat; // (in its lair it braids at the back: 11-20)
    if (Gu.alive(flags)) npcs.push({ id: 'ettercap8', x: ec[0], y: ec[1], look: 'ettercap', dir: 'right' });
    var trig = [{ id: 'gulchfire', rect: [Gu.FIRE[0], Gu.FIRE[1], 1, 1], on: 'use', script: 'gulchFire' }]; // (the cutters' fire a camp: Gu.fire, 11-20)
    if (!flags['trig:snared']) trig.push({ id: 'snared', rect: [Gu.SNARE[0], Gu.SNARE[1], 1, 1], on: 'use', script: 'gulchSnared', once: true });
    if (!flags['trig:snared']) trig.push({ id: 'snaredstep', rect: Gu.LAD.rect.slice(), on: 'step', script: 'gulchSnared' }); // (the try of 11-20: a step into his hollow is reaching him)
    if (Gu.alive(flags)) trig.push({ id: 'ettercap', rect: Gu.LAIR.rect.slice(), on: 'step', script: 'gulchEttercap' }); // (its lair's neck)
    return { id: 'gulch', name: 'Web Gulch', rows: rows, legend: Gu.LEGEND, music: 'dungeon', exits: { north: 1, south: 1, east: 1, west: 1 }, dark: ph === 'night',
      lights: [{ id: 'gulchfire', kind: 'map', x: Gu.FIRE[0], y: Gu.FIRE[1], bright: 10, dim: 10, color: 'fire', flame: true, seep: true }],
      npcs: npcs, triggers: trig, zones: [{ zone: ph === 'day' ? 'gulch' : 'gulch_' + ph, rect: Gu.ZONE.slice() }], chests: Gu.CHESTS.map(function (c) { return Object.assign({}, c); }) };
  };
  Gu.alive = function (flags) { return !flags.ettercapDone && !flags['trig:ettercap']; }; // (the first game's '!flag:ettercapDone & !has:ettercapfangs': beaten here, or its fangs paid at Hessle's)
  // the gulch's fights by the hour (content/encounters.json gulch: wolf spiders to a giant spider): at noon half as often, by night twice
  (function () {
    var E = (DS.DATA && DS.DATA.encounters) || {}, Z = E.gulch; if (!Z) return;
    E.gulch_noon = Object.assign({}, Z, { rate: Z.rate.map(function (r) { return Math.round(r * Gu.RATE.noonRate); }) });
    E.gulch_night = Object.assign({}, Z, { rate: Z.rate.map(function (r) { return Math.max(4, Math.round(r * Gu.RATE.nightRate)); }) });
  })();
  // on the grid's diamonds as the Wet is drawn since 10-29 (iso: js/mines.js ON THE DIAMONDS -- the iso-roams seat, Griz: "NEW:  Conversion of topdown roam of cloaker fight level
  // and(?) new gulch as iso-roams like the Wet", "those 1-7 look good"): the same squares, clock and beats; &view=top draws it north up again
  M.FLOORS[Gu.KEY] = { src: 'gulch', own: true, map: Gu.map, door: Gu.KEY, place: 'Web Gulch', sub: 'the road down the cut', save: false, out: 'world', clock: true, edges: true, iso: true,
    rate: Gu.RATE, phase: Gu.phase, phaseLine: Gu.line, // (save: false, as the first game's gulch -- no bed here, his lean 5)
    gates: { north: [17, 1, [0, 1]], south: [22, 110, [0, -1]], west: [1, 10, [1, 0]], east: [38, 59, [-1, 0]] } }; // (the road's two mouths; the silk-cutters' descent west, a way up the east bank)
  var floor0 = M.floor;
  M.floor = function (key, q) {
    var def = floor0.apply(this, arguments); if (key !== Gu.KEY) return def;
    def.people.forEach(function (p) { if (Gu.KINDS[p.id]) p.kind = Gu.KINDS[p.id]; });
    // (in by a side gate with no square of its own: at the foot of that gate's way down, not its top at the map's edge -- Gu.FOOT, 11-24; a door's &at= or a square given wins)
    var ft = Gu.FOOT[def.gate], gq0 = ft && M.FLOORS[Gu.KEY].gates[def.gate];
    if (ft && gq0 && def.entry && def.entry[0] && def.entry[0][0] === gq0[0] && def.entry[0][1] === gq0[1] && !/[?&]at=/.test(String(q || ''))) { def.entry = [[ft[0], ft[1]]]; def.face = ft[2].slice(); }
    // (a player's words, the hour added by js/roam.js R.script as on every floor's line: 11-16, the words-and-boxes seat -- not "on the grid's diamonds, north up the screen's right (40 x 112 squares)")
    def.hello = ['{y}WEB GULCH{/}, the road down the cut.', Gu.LINES.hello,
      '{g}Click to walk, or the arrows. E: a word, a door. O: the formation. L: the floor map.{/}'];
    return def;
  };
  var ground0 = M.groundOf;
  M.groundOf = function (def) { return def && def.key === Gu.KEY ? 'gulch' : ground0.apply(this, arguments); }; // (a field's rim the banks' rock, open to the sky: js/mines.js M.cut, M.fieldDef)
  // a field cut from the gulch carries the floor's webs in it (the grid's web hazard, js/battle.js: DEX or restrained, fire burns them) at a giant spider's DC
  var fieldDef0 = M.fieldDef;
  M.fieldDef = function (def) {
    var F = fieldDef0.apply(this, arguments); if (!def || def.key !== Gu.KEY) return F;
    var md = D.MAPS['mine-field'], c = md && md.cut, n8 = def.names8, webs = [];
    if (c && n8) for (var y = 0; y < def.h; y++) for (var x = 0; x < def.w; x++) {
      if (n8.legend[n8.rows[y].charAt(x)] !== 'webFloor') continue;
      var p = c.to(x, y); if (p[0] >= 0 && p[1] >= 0 && p[0] < md.rows[0].length && p[1] < md.rows.length && md.rows[p[1]].charAt(p[0]) === '.') webs.push(p);
    }
    if (webs.length) { F.webs = webs; F.webDC = 12; } // (SRD 5.1 Giant Spider, Web: DC 12 Strength to burst it)
    return F;
  };

  // ---------------------------------------------------------------- the beats: the snared lad and the braiding ettercap, the grid's own fights pulled in from the floor
  // (the first game's words first, on the encounter's card; FIGHT, or back away)
  // (Gu.set, the beats' fights pulled onto a field, CUT 11-20 on Griz's "4 - good cut, these are better (on roam encounters)": the lad and the lair are fought in place)
  // the snared lad (S.snared): two wolf spiders and a giant spider coming for a shape in the silk; cut down, a few coins pressed on you
  // THE LAD LIKE THE WET (a TRY, 11-20, the gulch seat -- Griz to the lanes desk: "camp first - next priority is to try the encounters like the Wet with fog of war, including
  // reworking the gulch floor around the trapped lad, such that a wet-like encounter that matches the current grid fight is triggered"): the bank behind him opened into a
  // strung hollow (Gu.ROWS 50-57), a step into it is reaching him (Gu.LAD.rect), and FIGHT is fought where the party stands, as the Wet's are (js/roam.js R.encounter, set
  // at his square; js/mines.js M.inPlace) -- the grid fight's three (two wolf spiders, a giant spider) seated round him on the bank's side at the grid fight's spread, the
  // gully's own silk about him the hazard at the grid fight's DC 11. Won, as before: his flag, his trigger gone, the twelve silver. The field fight
  // was kept behind &ladgrid till he had walked this one; CUT 11-20, his "4 - good cut, these are better (on roam encounters)"
  Gu.TRY = { fog: !/[?&]nofog\b/.test(String(window.location && window.location.search)) }; // (&ladgrid, &lairgrid and &gulchfield CUT 11-20, his "4 - good cut, these are better (on roam encounters)"; &nofog kept)
  Gu.LAD = {
    rect: [23, 51, 5, 7], // (his column and the hollow behind him: a step in is reaching him -- never the road, x 19-20, nor its shoulder, x 21-22, where a walk down the gully may step: the inn's walkthrough benches, walk1113 and walkbarn1113, crossed it on 11-20)
    foes: [['wolfspider', 27, 50], ['giantspider', 26, 52], ['wolfspider', 28, 56]], // (the grid fight's three, 6 to 9 squares off the party as its squares are there: data/fights.js snared)
    webDC: 11, // (the grid fight's: data/maps.js gulch, the strung end's silk)
    minGap: 4, // (no spider seated nearer the party than this, in squares: the hollow's 4 to 6 against the grid fight's 6 to 8 -- the hollow is narrower)
    webBox: [18, 47, 13, 14] // (the silk counted as the fight's hazard: the floor's own webFloor squares in this box)
  };
  Gu.ladWebs = function (B) {
    var out = [], bx = Gu.LAD.webBox, rows = Gu.ROWS; // (the floor's own letters: the laid def's rows are the grid's)
    for (var y = bx[1]; y < bx[1] + bx[3]; y++) for (var x = bx[0]; x < bx[0] + bx[2]; x++) { var r = rows[y]; if (r && r.charAt(x) === 'x') out.push([x, y]); }
    return out;
  };
  // a set fight's foes seated on their own squares after the spill (the encounter first set them round its spot): all lifted off the floor, then each seated -- one could
  // stand on another's square (a giant spider's two by two) and be left beside the party, the desk's merged runs of 11-20 -- its fallback a ring search nearest its square,
  // never nearer the party than minGap. Returns where the fight opens (read before initiative: a wolf spider that wins it is at the party by the first hero's turn)
  Gu.seatOn = function (B2, spec, minGap) {
    var G = D.grid, t = B2.roam.token, used = [], mine = [], fs = B2.units.filter(function (u) { return u.side === 'foe' && !u.dead && u.hp > 0 && !u.roamAside && /^roam/.test(String(u.id)); });
    var home = {}; fs.forEach(function (u) { home[u.id] = [u.x, u.y]; u.x = -99; u.y = -99; });
    var ours = B2.units.filter(function (w) { return w.side === 'party' && !w.look && G.standing(w) && w.x >= 0; }), gapOf = function (x, y) { return Math.min.apply(null, ours.map(function (o) { return Math.max(Math.abs(o.x - x), Math.abs(o.y - y)); }).concat([99])); };
    var seat = function (u, to) {
      if (G.canStand(u, to[0], to[1]) && gapOf(to[0], to[1]) >= minGap) return to;
      for (var r = 1; r <= 6; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; var x = to[0] + dx, y = to[1] + dy; if (G.canStand(u, x, y) && gapOf(x, y) >= minGap) return [x, y]; }
      return null;
    };
    spec.forEach(function (f) { var u = fs.filter(function (w) { return w.kind === f[0] && used.indexOf(w) < 0; })[0]; if (!u) return; used.push(u); var sq = seat(u, [f[1], f[2]]) || home[u.id]; u.x = sq[0]; u.y = sq[1]; u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y); mine.push(u); });
    fs.forEach(function (u) { if (used.indexOf(u) < 0 && u.x < 0) { u.x = home[u.id][0]; u.y = home[u.id][1]; } }); // (any not in the list back where it was)
    G.setup(G.map, B2.units);
    var gs = mine.map(function (u) { return gapOf(u.x, u.y); });
    return { foes: mine.map(function (u) { return u.kind + '@' + u.x + ',' + u.y; }), kinds: mine.map(function (u) { return u.kind; }).sort(), gap: Math.min.apply(null, gs), far: Math.max.apply(null, gs) };
  };
  // the same seats taken as the encounter places them, before they are drawn (11-20, his walk: "looks like the spiders spawned closed and then moved to official positions
  // (teleport) as party token expanded"): each on its square where it may stand, clear of the others' footing and at least minGap from the token -- else the ring search's
  // nearest such square; the spill's Gu.seatOn after keeps every seat that is still clear, so nothing moves on screen unless the party spilled onto it
  Gu.placeOn = function (B, placed, spec, minGap) {
    var G = D.grid, t = B.roam.token, taken = {}, used = [];
    B.units.forEach(function (w) { if (placed.indexOf(w) < 0) G.foot(w).forEach(function (q) { taken[q[0] + ',' + q[1]] = 1; }); });
    var free = function (u, x, y) { var n = u.size || 1; for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) if (taken[(x + i) + ',' + (y + j)]) return false; return G.canStand(u, x, y, { ghost: true }) && Math.max(Math.abs(x - t.x), Math.abs(y - t.y)) >= minGap; };
    spec.forEach(function (f) {
      var u = placed.filter(function (w) { return w.kind === f[0] && used.indexOf(w) < 0; })[0]; if (!u) return; used.push(u);
      var sq = free(u, f[1], f[2]) ? [f[1], f[2]] : null;
      for (var r = 1; r <= 6 && !sq; r++) for (var dy = -r; dy <= r && !sq; dy++) for (var dx = -r; dx <= r && !sq; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && free(u, f[1] + dx, f[2] + dy)) sq = [f[1] + dx, f[2] + dy];
      if (!sq) return;
      u.x = sq[0]; u.y = sq[1]; u.facing = D.spr.facingFor(t.x - u.x, t.y - u.y);
      var n = u.size || 1; for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) taken[(sq[0] + i) + ',' + (sq[1] + j)] = 1;
    });
  };
  Gu.snaredInPlace = function* (B, step) {
    var R = D.roam, R0 = B.roam, t = R0.token, G = D.grid, F0 = D.fight && D.fight('snared');
    D.sfx('encounter'); t.anim = 'idle'; t.animT = B.t;
    var a = yield { prompt: { who: t, title: 'WEB GULCH', lines: R.wrap([].concat(L('gulch.snared'))), opts: [{ label: 'FIGHT', value: 0 }, { label: 'LEAVE IT', value: 1 }] } };
    if (a !== 0) { if (step) M.stepBack(B); return; }
    var w0 = B.webs;
    B.webs = (w0 || []).concat([{ by: 'the gully\'s silk', sq: Gu.ladWebs(B), dc: Gu.LAD.webDC, ground: true }]);
    var set = { list: Gu.LAD.foes.map(function (f) { return f[0]; }), at: Gu.SNARE.slice(), how: 'out of the silk behind him', flag: 'trig:snared', trig: ['snared', 'snaredstep'], // (both spent at the win: the party gathers inside the hollow after, and its step must not ask again)
      line: (F0 && F0.intro) || 'A shape wrapped tight in silk hangs in the strands. It moves. Something else moves toward it.',
      place: function (B2, placed) { Gu.placeOn(B2, placed, Gu.LAD.foes, Gu.LAD.minGap); set.placed = placed.map(function (u) { return u.kind + "@" + u.x + "," + u.y; }); }, // (seated before they are drawn: Gu.placeOn)
      onSpill: function (B2) { set.opening = Gu.seatOn(B2, Gu.LAD.foes, Gu.LAD.minGap); } }; // (the three on their squares behind him, as the grid fight seats its own)
    Gu.ladLast = set;
    try { yield* M.inPlace(B, 'snared', set); }
    finally { B.webs = w0 || []; } // (the hollow's silk the fight's alone: on the walk the floor's webbing is a look, as it was)
    if (R0.flags['trig:snared']) { // (won: the first game's thanks, as the field's way gives it)
      D.counter.state(B).silver(12); D.sfx('coin'); M.relay(B); B.card(R.wrap([].concat(L('gulch.snaredFree'), [L('g.foundSilver', { n: 12 })])), 300); yield 30;
      yield* Gu.ladRuns(B);
    }
  };
  // THE LAD RUNS (11-20, Griz, walking the gulch: "no reason not to have a traveler run off screen when the cocoon comes down"): cut down, he gets up off the silk at his
  // square and goes -- to the road and down it at a run, south toward the inn, Gu.LAD.runSteps squares, off the screen at the floor's zoom -- and then off the floor. Nobody
  // vanishes where he stands: he walks out. A townsman's figure (the commoner's), no one's target, in no area
  Gu.LAD.runTo = [20, 68]; Gu.LAD.runSteps = 16;
  Gu.ladRuns = function* (B) {
    var G = D.grid, kind = D.FOES.commoner ? 'commoner' : 'bandit', u = B.makeFoe({ id: 'snaredlad', kind: kind, at: Gu.SNARE.slice(), side: 'party', ally: true }), ran = { from: Gu.SNARE.slice(), steps: 0, at: null, gone: false };
    u.name = 'The traveler'; u.look = true; u.npc = 'snaredlad'; u.bystander = true; u.noArea = true; u.attacks = {}; u.hp = u.maxhp = 4; u.anim = 'idle'; u.animT = B.t;
    B.units.push(u); G.setup(G.map, B.units);
    var path = (D.Battle.route(u, Gu.LAD.runTo) || []).slice(0, Gu.LAD.runSteps);
    for (var i = 0; i < path.length; i++) {
      var q = path[i]; u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: 6, mode: null }; u.facing = D.spr.facingFor(q[0] - u.x, q[1] - u.y); u.anim = 'walk'; u.x = q[0]; u.y = q[1]; ran.steps++;
      yield 6; // (a square every six frames: at a run)
    }
    ran.at = [u.x, u.y]; B.units = B.units.filter(function (w) { return w !== u; }); G.setup(G.map, B.units); ran.gone = true; // (off the screen: off the floor)
    Gu.ladRan = ran;
  };
  Gu.snared = function* (B, step) {
    yield* Gu.snaredInPlace(B, step);
  };
  // THE BRAIDING ETTERCAP IN ITS LAIR ON THE GULLY (a TRY, 11-20, the gulch seat -- Griz: "2 - meanwhile, given gully roam present - play around with the shaping of the ettercap's
  // lair and party placement (entrance) - and match the roam to your new shape rather than dictated by first grid fight"): the strung end shaped as a lair -- a round
  // chamber off the west bank (x 2-12, rows 81-92) reached by one neck two squares wide (x 13-15, rows 86-87; row 88 closed), the silk strung across the neck. The party
  // comes in by the neck: a step into it and the ettercap stops braiding (FIGHT or BACK AWAY), the fight on the gully's own squares (js/mines.js M.inPlace) -- the party
  // bunched in the neck, the ettercap braiding at the chamber's back wall, the giant spider up in the silk to the north, a wolf spider each side of the way in to flank them
  // as they come; the chamber's silk at the ettercap's DC 11. The ettercap on the floor sits at the back now, where it fights from. Kept from the first grid fight: its
  // four (the story's half again), its DC 11, its words and its spoils (the fangs, the Braided Cord); dropped: its map -- the 38 strung squares, the ledge and the slab.
  // The field's story fight was kept behind &lairgrid; CUT 11-20, his "4 - good cut, these are better (on roam encounters)"
  Gu.LAIR = {
    rect: [13, 86, 3, 2],  // (the neck: a step in is the ettercap seeing you)
    seat: [4, 86],         // (where it braids, at the chamber's back)
    foes: [['ettercap', 4, 86], ['giantspider', 5, 82], ['wolfspider', 9, 84], ['wolfspider', 7, 90]],
    webDC: 11,             // (SRD 5.1 Ettercap, Web: DC 11 Strength -- the first grid fight's, his 09-30 "11")
    webBox: [2, 81, 14, 12], // (the chamber and its neck: their silk the fight's hazard)
    minGap: 4
  };
  // its spoils (the first game's): the fangs for Hessle's board, its braid the Braided Cord (Ned's wand, 11-16 -- js/counter.js C.nedWand), said on a card
  // (ONE BRAID, 11-24 -- his NOTES day 8 12:25, Silverton 45,32: "braided cord didn't go to Ned?" -- his save had one in the pack after Ned took one: the fight in place pays its foes'
  // spoils first, and the first game's ettercap drops its cord every time (content/monsters.json ettercap drops, js/rules.js R.spoils through js/roam.js R.spoils); the braid given
  // here only when the pack has none)
  Gu.ettercapSpoils = function* (B) { var st2 = D.counter.state(B); D.counter.give(st2, 'ettercapfangs', 1); if (!D.counter.count(st2, 'cord')) D.counter.give(st2, 'cord', 1); st2.flags.cordTaken = 1; D.sfx('chest'); B.card(D.roam.wrap([].concat(L('gulch.fangs'))), 360); yield 30; };
  Gu.lairInPlace = function* (B, step) {
    var R = D.roam, R0 = B.roam, t = R0.token, f = R0.flags, F0 = D.fight && D.fight('ettercap'); if (!Gu.alive(f)) return;
    D.sfx('encounter'); t.anim = 'idle'; t.animT = B.t;
    var a = yield { prompt: { who: t, title: 'THE STRUNG END', lines: R.wrap([].concat(L('gulch.ettercap'))), opts: [{ label: 'FIGHT', value: 0 }, { label: 'BACK AWAY', value: 1 }] } };
    if (a !== 0) { if (step) M.stepBack(B); return; }
    B.units = B.units.filter(function (u) { return u.npc !== 'ettercap8'; }); D.grid.setup(D.grid.map, B.units); // (the braiding figure off the floor: the fight's own ettercap comes in its place)
    var w0 = B.webs, bx = Gu.LAIR.webBox, sq = [];
    for (var y = bx[1]; y < bx[1] + bx[3]; y++) for (var x = bx[0]; x < bx[0] + bx[2]; x++) if (Gu.ROWS[y] && Gu.ROWS[y].charAt(x) === 'x') sq.push([x, y]);
    B.webs = (w0 || []).concat([{ by: 'the gully\'s silk, the ettercap\'s', sq: sq, dc: Gu.LAIR.webDC, ground: true }]);
    var set = { list: Gu.LAIR.foes.map(function (e) { return e[0]; }), at: Gu.LAIR.seat.slice(), how: 'from its strand at the back', flag: 'trig:ettercap', trig: ['ettercap'],
      line: (F0 && F0.intro) || 'On a thick strand at the far end something sits braiding a cord. It stops when it sees you.',
      place: function (B2, placed) { Gu.placeOn(B2, placed, Gu.LAIR.foes, Gu.LAIR.minGap); set.placed = placed.map(function (u) { return u.kind + "@" + u.x + "," + u.y; }); }, // (seated before they are drawn: Gu.placeOn)
      onSpill: function (B2) { set.opening = Gu.seatOn(B2, Gu.LAIR.foes, Gu.LAIR.minGap); } };
    set.silk = { by: 'the gully\'s silk, the ettercap\'s', sq: sq, dc: Gu.LAIR.webDC }; Gu.lairLast = set; // (its silk kept on the set: a bench reads it after a fight the class AI played)
    try { yield* M.inPlace(B, 'ettercap', set); }
    finally { B.webs = w0 || []; }
    M.relay(B, null, true); // (the floor's people stood again: the ettercap gone if it is dead, back braiding if the party got away)
    if (R0.flags['trig:ettercap']) yield* Gu.ettercapSpoils(B);
  };
  // the braiding ettercap (S.ettercap): it stops braiding when it sees you; won, its fangs for Hessle's board
  Gu.ettercap = function* (B, step) {
    var f = B.roam.flags; if (!Gu.alive(f)) return;
    yield* Gu.lairInPlace(B, step);
  };
  // ---------------------------------------------------------------- THE CUTTERS' FIRE A CAMP (RULED 11-16, Griz: "yes on the leans" -- a long rest at the cutters' fire, the
  // 10-28 lean 5 reversed, the morning saved there -- then "What's the cost of rigging it special to still make the players do a watch and adding a male crewboss to fights
  // that night?", and "DM hand-wavey text on the victory card about the drummer boy running to the crew boss with a healers kit if he falls, playing on screen behind victory
  // card"; built 11-20 by the gulch seat). E at the fire: the crew boss's word, LONG REST, SHORT REST: AN HOUR, the wait, LEAVE (js/hours.js H16.restOffers -- the long rest
  // greyed inside the 24 hours, H.longOpen). LONG REST is the party's night with the watch kept: who stands which of three watches (THE WORLD's own screen, js/house.js
  // H.Watches, on the floor's four), each watch a roll on the gulch's table for its hour -- by night gulch_night -- and a fight come to the fire on the grid, the crew boss lent
  // to the party (the fight's `allies`, js/battle.js); if he falls the drummer boy runs to him with a healer's kit behind the VICTORY panel, its DM line on it, and he is up
  // by the morning (the later watches without him). Then the eight hours on the clock and the morning, saved there. The floor's watch runner (Gu.night) is the floor's own:
  // THE WORLD's (H.runNight) is bound to its own scene and fights.
  Gu.CAMP = {
    restHours: 8,
    watchP: { night: 1 / 3, day: 1 / 6 } // (a watch's chance of a fight: by night twice the day's, as the table's own count is -- the seat's numbers, standing for his overrule)
  };
  Gu.LINES.camp = {
    fire: 'The crew boss shifts over on his log. "Our fire\'s yours. Our watch is yours too."',
    short: 'An hour by the cutters\' fire. The guard keeps the gully; the boy keeps his drum quiet.',
    down: 'The cutters turn in. The party takes the watches turn and turn about with the camp\'s guard, the crew boss up with whoever has the fire.',
    quiet: 'The watch passes quiet: the fire, the gully, the silk ticking in the cold.',
    sleep: 'The boy sleeps with his drum for a pillow.',
    morning: 'Morning comes down the gulch. The cutters stir round their fire, and the crew boss is already up.',
    bossUp: 'Morning comes down the gulch. The cutters stir round their fire. The crew boss is up by the morning, bandaged, sour about it, and back on his log.', // (in the morning's place when he fell in the night)
    boy: 'The drummer boy is already running, a healer\'s kit banging at his hip. He drops beside the crew boss, gets the bandage on, and gets him breathing.' // (the DM's hand-wave: invented.json web-gulch-camp-night)
  };
  Gu.WATCH = ['FIRST', 'SECOND', 'THIRD'];
  Gu.firePic = function () { var P = M.FIREPIC, m0 = P.moss; P.moss = []; try { return M.firePic.apply(this, arguments); } finally { P.moss = m0; } }; // (the seep's fire with no moss on the gravel)
  Gu.fire = function* (B) {
    var H6 = D.hours, R = D.roam, id = null;
    yield* M.talk(B, 'gulchboss', function (sc) { return (function* () { var again = false; while (true) { var o = H6.restOffers({ hours: Gu.CAMP.restHours }), a = yield sc.ask([again ? H6.REST.again : Gu.LINES.camp.fire].concat(o.why ? [o.why] : []), o.opts); id = o.idOf(a); if (id === 'wait') { yield sc.say(H6.placeTill(B, Gu.CAMP.restHours)); again = true; continue; } if (id === 'short') yield sc.say([Gu.LINES.camp.short].concat(M.shortRestHere(B))); return id === 'long'; } })(); }, 'The cutters\' fire', Gu.firePic);
    if (id === 'long') yield* Gu.night(B);
  };
  Gu.hero = function (u) { return u && u.side === 'party' && !!u.src && !u.ally && !u.guest && !u.familiar; };
  Gu.watchRoll = function (k, nt) { return D.rand() < (nt ? Gu.CAMP.watchP.night : Gu.CAMP.watchP.day); }; // (a bench pins it)
  // who stands which watch: THE WORLD's screen over the floor's four (js/house.js Watches: click a watch, up/down a hero, E begin, X back); the default split as THE WORLD's
  Gu.watchAsk = function* (B, party) {
    var H = D.house, asg = H.watchDefault(party); if (!H.Watches) return asg;
    var w = Object.create(H.Watches.prototype); w.kind = 'housewatches'; w.opaque = false; w.party = party; w.asg = asg; w.i = 0; w.t = 0; w.res = null;
    w.go = function (what) { if (D.top() === this) D.pop(); D.sfx(what === 'begin' ? 'confirm' : 'cancel'); this.res = what; };
    D.push(w); while (!w.res) yield 1;
    return w.res === 'begin' ? w.asg : null;
  };
  // a watch's fight: the field cut round the fire, on the grid, the crew boss beside the party unless he is down already tonight
  Gu.watchSet = function (B, k, list, names, lit, night, off) {
    var st = { boss: null, fb: null, fell: false }, bare = (off || []).map(function (o) { return o.u.name; });
    st.set = { list: list, grid: true, gap: 'rule', title: 'THE ' + Gu.WATCH[k - 1] + ' WATCH', recName: 'Web Gulch: the ' + Gu.WATCH[k - 1].toLowerCase() + ' watch, at the cutters\' fire', // (the play record's name: his 11-20 record had it only as the floor's, "the road down the cut")
      line: '{r}Out of ' + lit + '{/}: ' + (names.length ? names.join(' and ') + ' on the watch, the rest up from their blankets.' : 'the rest up from their blankets.') + (bare.length ? ' ' + bare.join(' and ') + ' with no time to buckle on armour.' : ''), // (THE WORLD's "the rest wake with their armor off", 11-20)
      enter: function (b) { st.fb = b; st.boss = b.units.filter(function (u) { return u.ally && u.kind === 'crewboss'; })[0] || null; if (st.boss && Gu.showBossHp) st.boss.hp = Gu.showBossHp; }, // (the show's crew boss comes to the fire hurt: Gu.showBossHp, the beat below)
      dress: function (F) {
        F.intro = 'In the ' + Gu.WATCH[k - 1].toLowerCase() + ' watch, out of ' + lit + ', at the cutters\' fire.'; F.won = 'THE WATCH HOLDS.';
        if (!night.bossDown) { var at = Gu.besideEntry(); if (at) F.allies = [{ id: 'gulchboss', kind: 'crewboss', at: at, name: 'The crew boss' }]; }
        F.onEnd = function (b, o, paid) {
          var bs = st.boss; if (o !== 'won' || !bs || !(bs.hp <= 0 || bs.dead)) return paid;
          st.fell = true; Gu.boyRuns(b, bs);
          var p = paid.length ? paid.slice() : ['{y}Victory!{/}']; p.push('{g}' + Gu.LINES.camp.boy + '{/}'); return p;
        };
      } };
    return st;
  };
  // THE WATCH FOUGHT AT THE FIRE (11-24, world-1124 -- his NOTES of 11-23, in the fight "Web Gulch: the first watch, at the cutters' fire" at 13,9: "can we use the actual camp/roam
  // map for this fight? - dialog 'the boy needs his sleep'?"; the lean RULED on his "leans otherwise approved", the desk's list E8: "the gulch's watch fight in place at the
  // cutters' fire, the drawn fire"): a watch's fight is the floor's own (js/mines.js M.inPlace, as the lad's and the lair's), where the party lies down by the fire -- the tents,
  // the fire from the art desk's campfire (M.sheetFire), the cutters asleep round it -- the spiders coming up out of the gully on the road south of the camp. Kept from the field
  // (Gu.watchSet, its words and its record's name): the sleepers' armour off (Gu.sleepersOff, the caller's), the crew boss lent -- his figure by the fire stood down for the fight
  // and a fighting one in his place, the SRD's thug (data/foes.js crewboss) -- and if he falls the drummer boy running to him with a healer's kit behind the VICTORY panel, its
  // DM line on it (Gu.boyToBoss). No drum: the boy is asleep, and the crew boss won't have him woken -- "The boy needs his sleep." (his words, the boss's line on the watch's
  // card; the drum is THE DRUMMER'S AURA's, for the gully's own fights). Fallen, the crew boss lies by the fire with the boy beside him till the morning (Gu.night stands his own
  // figure back up), and the later watches go without him (night.bossDown)
  Gu.LINES.camp.sleepBoy = 'The crew boss is up with his club. "Leave the boy. The boy needs his sleep."';
  Gu.watchFight = function* (B, k, list, names, lit, night, off) {
    var R = D.roam, R0 = B.roam, t = R0.token, G = D.grid, st = Gu.watchSet(B, k, list, names, lit, night, off);
    var npc = night.bossDown ? null : B.units.filter(function (u) { return u.npc === 'gulchboss' && u.look; })[0] || null, boss = null;
    if (npc) {
      boss = B.makeFoe({ id: 'gulchbosswatch' + k, kind: 'crewboss', at: [npc.x, npc.y], side: 'party', ally: true }); boss.name = 'The crew boss'; boss.npc = 'gulchbosslent'; boss.facing = npc.facing; boss.anim = 'idle'; boss.animT = B.t;
      if (npc.sheet) boss.sheet = npc.sheet; if (Gu.showBossHp) boss.hp = Gu.showBossHp; // (the show's crew boss comes to the fire hurt: the ISO beat's pin)
      B.units = B.units.filter(function (w) { return w !== npc; }); B.units.push(boss); G.setup(G.map, B.units); B.cache = null;
    }
    st.boss = boss; st.npc = npc;
    var at = Gu.roadAt(Math.min(Gu.ZONE[3] - 1, t.y + 9)) || [t.x, t.y + 9]; // (up out of the gully: the road some 45 ft south of where the party lies)
    var line = 'THE ' + Gu.WATCH[k - 1] + ' WATCH: ' + window.DS.stripCodes(st.set.line) + (boss ? ' ' + Gu.LINES.camp.sleepBoy : '');
    var set = { list: list, at: at, how: 'up out of the gully', line: line }, out = { st: st, res: null, line: line, foes: null };
    var sp0 = R.spoils, rs0 = D.rec && D.rec.start, nd0 = B.noDrum;
    R.spoils = function (B2, fell) { var r = sp0.apply(this, arguments); if (boss && (boss.hp <= 0 || boss.dead) && !st.fell) { st.fell = true; Gu.boyToBoss(B2, boss); r = r.concat(['{g}' + Gu.LINES.camp.boy + '{/}']); } return r; }; // (his "playing on screen behind victory card": the run starts as the panel's lines are made)
    if (rs0) D.rec.start = function (B2, o) { if (o && B2 === B) o.name = st.set.recName; return rs0.apply(this, arguments); }; // (the play record's name, as the field's had it)
    B.noDrum = true;
    try { yield* M.inPlace(B, 'watch', set); }
    finally { R.spoils = sp0; if (rs0) D.rec.start = rs0; B.noDrum = nd0; }
    out.res = R0.lastOutcome; out.foes = (R0.last && R0.last.kinds) || null; out.lent = !!boss;
    if (boss && (boss.hp <= 0 || boss.dead)) { st.fell = true; boss.look = true; boss.bystander = true; boss.noArea = true; night.bossLying = boss; night.bossNpc = npc; } // (he lies by the fire till the morning)
    else if (boss) { B.units = B.units.filter(function (w) { return w !== boss; }); if (npc) B.units.push(npc); }
    G.setup(G.map, B.units); B.cache = null;
    return out;
  };
  // the drummer boy, woken, to the fallen crew boss's side behind the VICTORY panel: the floor's own boy, a square a beat (js/battle.js frame's B.ambient), kneeling there
  Gu.boyToBoss = function (B, boss) {
    var G = D.grid, u = Gu.drummer(B); if (!u) return null;
    var near = D.Battle.nearSq(u, [boss.x, boss.y]) || [boss.x, boss.y], path = D.Battle.route(u, near) || [], f = 0, amb0 = B.ambient;
    u.kit = true; u.run = { path: path, to: near, from: [u.x, u.y], done: false };
    B.ambient = function (bb) {
      if (amb0) amb0(bb);
      if (u.run.done || ++f % 8) return;
      var q = u.run.path.shift();
      if (!q) { u.run.done = true; u.anim = D.spr.anim(u.sheet, 'kneel') ? 'kneel' : 'idle'; u.facing = D.spr.facingFor(boss.x - u.x, boss.y - u.y); u.animT = bb.t; bb.ambient = amb0 || null; return; }
      u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: 8, mode: null }; u.facing = D.spr.facingFor(q[0] - u.x, q[1] - u.y); u.anim = 'walk'; u.x = q[0]; u.y = q[1]; G.setup(G.map, bb.units);
    };
    return u;
  };
  // a square beside the party's lineup on the field just cut (D.MAPS['mine-field']): the crew boss stands in it
  Gu.besideEntry = function () {
    var md = D.MAPS['mine-field']; if (!md) return null;
    var open = function (x, y) { var r = md.rows[y]; return !!r && x >= 0 && x < r.length && '.,gr'.indexOf(r.charAt(x)) >= 0; }, used = {};
    (md.entry || []).forEach(function (q) { used[q[0] + ',' + q[1]] = 1; });
    for (var i = 0; i < (md.entry || []).length; i++) for (var d = 1; d <= 3; d++) {
      var q = md.entry[i], c = [[q[0], q[1] + d], [q[0], q[1] - d], [q[0] + d, q[1]], [q[0] - d, q[1]]];
      for (var j = 0; j < c.length; j++) if (open(c[j][0], c[j][1]) && !used[c[j][0] + ',' + c[j][1]]) return c[j];
    }
    return null;
  };
  // the drummer boy behind the VICTORY panel (his "playing on screen behind victory card"): in at the field's edge nearest the camp, a square a beat to beside the crew boss,
  // kneeling there; no one's target, in no area (the gulch's people, below)
  Gu.boyRuns = function (b, boss) {
    var G = D.grid, kind = D.FOES.commonerchild ? 'commonerchild' : 'commoner', u = b.makeFoe({ id: 'drummer', kind: kind, at: [boss.x, boss.y], side: 'party', ally: true });
    u.name = 'The drummer boy'; u.look = true; u.bystander = true; u.noArea = true; u.attacks = {}; u.hp = u.maxhp = 4; u.npc = 'drummer'; u.kit = true;
    if (D.SHEETS && D.SHEETS.folkchild_p1) u.sheet = 'folkchild_p1';
    var w = G.map && G.map.def ? G.map.def.rows[0].length : 16, h = G.map && G.map.def ? G.map.def.rows.length : 16, best = null;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { if (x && y && x < w - 1 && y < h - 1) continue; if (!G.canStand(u, x, y)) continue; var dd = Math.hypot(x - boss.x, y - boss.y); if (dd >= 5 && (!best || dd < best[2])) best = [x, y, dd]; } // (the nearest rim square at least five off)
    if (!best) best = [boss.x, Math.max(0, boss.y - 5), 0];
    u.x = best[0]; u.y = best[1]; b.units.push(u);
    var near = D.Battle.nearSq(u, [boss.x, boss.y]) || [boss.x, boss.y], path = D.Battle.route(u, near) || [], f = 0;
    u.run = { path: path, to: near, done: false };
    var amb0 = b.ambient;
    b.ambient = function (bb) {
      if (amb0) amb0(bb);
      if (u.run.done || ++f % 8) return; // (a square a beat: js/battle.js STEP_FRAMES)
      var q = u.run.path.shift();
      if (!q) { u.run.done = true; u.anim = D.spr.anim(u.sheet, 'kneel') ? 'kneel' : 'idle'; u.facing = D.spr.facingFor(boss.x - u.x, boss.y - u.y); u.animT = bb.t; return; }
      u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: 8, mode: null }; u.facing = D.spr.facingFor(q[0] - u.x, q[1] - u.y); u.anim = 'walk'; u.x = q[0]; u.y = q[1];
    };
    return u;
  };
  // THE SLEEPERS' ARMOUR (RULED 11-20, Griz: "leans 1-3 approved, match THE WORLD"): a watch's fight wakes those not on that watch with their medium and heavy armour off, as
  // THE WORLD's night does (js/house.js H.sleepersOff, H.SLEEP_IN: light armour and robes slept in, the shield taken up on the way); put back on after the fight
  Gu.sleepersOff = function (B, sleepers) {
    var H = D.house, IT = (window.DS.DATA || {}).items || {}, inn = (H && H.SLEEP_IN) || ['light', 'robe'], off = [];
    sleepers.forEach(function (u) {
      var h = u.src, id = h && h.equip && h.equip.armor, ar = id && IT[id]; if (!ar || (ar.armor && inn.indexOf(ar.armor.type) >= 0)) return;
      off.push({ u: u, armor: id }); h.equip.armor = null;
    });
    if (off.length) D.roam.regear(B); // (their AC as the floor reads it: js/roam.js R.regear -- the field's fight takes them so)
    return off;
  };
  Gu.sleepersOn = function (B, off) { if (!off || !off.length) return; off.forEach(function (o) { if (o.u.src && o.u.src.equip) o.u.src.equip.armor = o.armor; }); D.roam.regear(B); };
  // the night: the watches, then the eight hours and the morning
  Gu.night = function* (B) {
    var R = D.roam, R0 = B.roam, party = R0.members.filter(function (u) { return Gu.hero(u) && u.hp > 0; });
    var asg = yield* Gu.watchAsk(B, party); if (!asg) return;
    var h0 = M.hourNow(R.q, B), wh = Gu.CAMP.restHours / Gu.WATCH.length, night = { bossDown: false, fights: [] };
    R0.campNight = night; // (what the night brought, for a bench and the morning)
    B.card(R.wrap([Gu.LINES.camp.down]), 220); yield 30;
    for (var k = 1; k <= Gu.WATCH.length; k++) {
      var hk = (h0 + (k - 0.5) * wh) % 24, nt = M.night(hk), ph = Gu.phase(hk), zone = ph === 'day' ? 'gulch' : 'gulch_' + ph;
      var p = Gu.watchRoll(k, nt) ? R.pick(zone, R0.flags) : null;
      if (!p || !p.list.length) { // (a quiet watch said on its own card: 11-20, his walk, "was a watch supposed to happen?" -- three quiet watches had passed with nothing on the screen)
        var on0 = party.filter(function (u) { return asg[u.key || u.id] === k; }).map(function (u) { return u.name; });
        B.card(R.wrap(['{y}THE ' + Gu.WATCH[k - 1] + ' WATCH{/}: ' + (on0.length ? on0.join(' and ') + ' at the fire. ' : '') + Gu.LINES.camp.quiet]), 200); yield 40;
        night.quiet = (night.quiet || 0) + 1; continue;
      }
      var names = party.filter(function (u) { return asg[u.key || u.id] === k; }).map(function (u) { return u.name; }); // (keyed as H.watchDefault keys them)
      var lit = nt ? 'the dark' : M.night((hk + 1) % 24) || M.night((hk + 23) % 24) ? 'the half-light' : 'the daylight';
      var off = Gu.sleepersOff(B, party.filter(function (u) { return asg[u.key || u.id] !== k; }));
      var lent = !night.bossDown, wf = null;
      night.bare = (night.bare || []).concat([off.map(function (o) { return o.u.name + ' ' + o.armor + ' ' + (o.u.armored ? 'on' : 'off') + ' ' + o.u.baseAC; })]); // (for a bench: each fight's sleepers in order, who fought it without their armour, and their AC so)
      try { wf = yield* Gu.watchFight(B, k, p.list, names, lit, night, off); } // (on the floor at the fire since 11-24: Gu.watchFight -- till then M.fieldFight's field)
      finally { Gu.sleepersOn(B, off); }
      var st = wf.st;
      night.fights.push({ k: k, zone: zone, list: p.list.slice(), lent: lent && !!st.boss, bossFell: st.fell, res: wf.res, inPlace: true, foes: wf.foes, line: wf.line });
      if (st.fell) night.bossDown = true;
      if (wf.res !== 'won' && wf.res !== 'escaped') return; // (lost: the floor's own end, as any floor fight's)
    }
    if (night.bossLying) { var G0 = D.grid; B.units = B.units.filter(function (w) { return w !== night.bossLying; }); if (night.bossNpc) B.units.push(night.bossNpc); G0.setup(G0.map, B.units); B.cache = null; } // (the crew boss off the ground by the morning: his own figure back by the fire -- Gu.watchFight)
    R0.clockFights = R0.fights; // (the watches' fights are inside the night's eight hours, not on top of them: M.tick)
    B.card(R.wrap([Gu.LINES.camp.sleep]), 200); yield 30;
    var house = !!(R.house() && D.house && D.house.playing), h1 = (h0 + Gu.CAMP.restHours) % 24, wk = M.wakeAt(h1), ln = null;
    if (!house) R0.hour = h1;
    var line = wk.title === 'MORNING' ? (night.bossDown ? Gu.LINES.camp.bossUp : Gu.LINES.camp.morning) : Gu.line(h1) + (night.bossDown ? ' The crew boss is up, bandaged, and sour about it.' : '');
    var s0 = R.def.save; R.def.save = true; // (the morning saved at the fire -- RULED 11-16, his "yes on the leans"; the rest of the floor keeps its own rule: no SAVE out in the gully)
    try { yield* D.house.sleepOnFloor(B, { line: line, title: wk.title, music: 'inn', hours: Gu.CAMP.restHours, before: function () { ln = M.lightNow(B); } }); }
    finally { R.def.save = s0; }
    night.done = true;
    if (ln) { D.sfx('popup'); B.card(R.wrap([ln]), 300); yield 20; }
  };
  // the camp's night, shown (deep16/?isoshow&beat=gulchcamp&lvl=3 -- the eyes row's door): a level 3 party beside the cutters' fire at 22:00; E at the fire, LONG REST, the
  // watches; the second watch brings a fight (the roll pinned), and the crew boss comes to it on 4 hit points, so a spider's bite or two drops him and the boy runs
  if (M.ISO_BEATS) M.ISO_BEATS.push({ id: 'gulchcamp', label: 'THE CUTTERS\' FIRE A CAMP, by night', note: 'Beside the cutters\' fire at 22:00: three tents, the four keepers. E at the fire: LONG REST, the watches; the second watch\'s fight comes, the crew boss in it with you.', key: 'webgulch', at: [12, 11], hour: 22,
    pin: function () { Gu.watchRoll = function (k) { return k === 2; }; Gu.showBossHp = 4; } });
  // the lad like the Wet, shown (deep16/?isoshow&beat=gulchlad&lvl=3): a level 3 party on the road four squares north of his hollow by day, the fog of war on -- the gully
  // black past what they have seen; a step east into the hollow is reaching him, FIGHT on the gully's own squares
  if (M.ISO_BEATS) M.ISO_BEATS.push({ id: 'gulchlad', label: 'THE SNARED LAD, fought where you stand (the try)', note: 'On the road above the lad\'s hollow by day, the fog of war on. Walk south and step east into the hollow: FIGHT, and the three come out of the silk behind him on the gully itself.', key: 'webgulch', at: [20, 50], hour: 10,
    pin: function () { Gu.TRY.fog = true; } });
  // the ettercap's lair, shown (?isoshow&beat=gulchlair&lvl=3): on the gully's bed east of the strung end's neck by day; west into the neck and it stops braiding
  if (M.ISO_BEATS) M.ISO_BEATS.push({ id: 'gulchlair', label: 'THE ETTERCAP\'S LAIR, fought where you stand (the try)', note: 'On the bed by day, the strung end\'s neck just west. Step into the neck: the ettercap stops braiding at the back of its lair -- FIGHT, in the neck, the spiders coming at you out of the silk.', key: 'webgulch', at: [18, 86], hour: 10,
    pin: function () { Gu.TRY.fog = true; } });
  // a random fight on the gully, shown (?isoshow&beat=gulchrandom&lvl=3): by night midway down, the next few steps bringing one (the count pinned short) -- walking in out of the dark
  if (M.ISO_BEATS) M.ISO_BEATS.push({ id: 'gulchrandom', label: 'A RANDOM FIGHT ON THE GULLY, by night (the try)', note: 'Midway down the gully by night, the fog on. Walk south a few steps: spiders come out of the dark and walk in, and the fight is where you meet them -- no field.', key: 'webgulch', at: [20, 40], hour: 22,
    pin: function () { Gu.TRY.fog = true; Gu.encSoon = 3; } });
  // the drummer's aura, shown (?isoshow&beat=gulchdrum&lvl=3 -- the eyes row's door, 11-24): just south of the camp by night, the boy by the fire six squares north, the next fight
  // a few steps off (the count pinned short); spiders come, the boy drums, and the four walked back into his ring sends them running
  if (M.ISO_BEATS) M.ISO_BEATS.push({ id: 'gulchdrum', label: 'THE DRUMMER BOY\'S DRUM, by night at the camp (11-24)', note: 'Just south of the cutters\' camp by night, the boy by the fire. Walk south a few steps: spiders come, and the boy starts drumming -- a warm ring round him on the floor. Walk all four back inside it: the spiders run, and the fight is over.', key: 'webgulch', at: [14, 16], hour: 22,
    pin: function () { Gu.TRY.fog = true; Gu.encSoon = 3; } });
  // the fog kept, shown (?isoshow&beat=gulchfog&lvl=3): at the north mouth by day in a game -- walk a way down, out by the north mouth onto the road, and back in: what was seen stays
  if (M.ISO_BEATS) M.ISO_BEATS.push({ id: 'gulchfog', label: 'THE FOG REMEMBERED, out and back in (the try)', note: 'At the north mouth by day. Walk down past the camp, go back up out of the north mouth, then step back in: the gully you walked is still uncovered; only the new is black.', key: 'webgulch', at: [17, 3], hour: 10,
    pin: function () { Gu.TRY.fog = true; } });
  // the dawn and the dusk, shown (?isoshow&beat=gulchdawn / gulchdusk &lvl=3): the gully at 06:00 under the dawn's lighter tint, and at 18:30 under the dusk's (D.dusk below)
  if (M.ISO_BEATS) M.ISO_BEATS.push({ id: 'gulchdawn', label: 'THE GULLY AT DAWN, the light tint (a look)', note: 'Midway down the gully at 06:00, the dark just gone: the floor under a light dusky wash, lighter than the dusk\'s. A look only: what the party sees is the day\'s.', key: 'webgulch', at: [20, 40], hour: 6,
    pin: function () { Gu.TRY.fog = true; } });
  if (M.ISO_BEATS) M.ISO_BEATS.push({ id: 'gulchdusk', label: 'THE GULLY AT DUSK, the tint (a look)', note: 'Midway down the gully at 18:30, before the dark at 20:00: the floor under the dusk\'s wash. A look only: what the party sees is the day\'s.', key: 'webgulch', at: [20, 40], hour: 18.5,
    pin: function () { Gu.TRY.fog = true; } });
  var trigger0 = M.trigger;
  M.trigger = function* (B, trig, at) {
    if (trig.script === 'gulchFire'){ yield* Gu.fire(B); return; }
    if (trig.script === 'gulchSnared') { yield* Gu.snared(B, trig.on === 'step'); return; }
    if (trig.script === 'gulchEttercap') { yield* Gu.ettercap(B, true); return; }
    yield* trigger0.apply(this, arguments);
  };
  var fire0 = T.fire;
  T.fire = function* (B, trig) { // (a word with the ettercap is the ettercap: E on it, or a click)
    var def = D.roam.def;
    if (def && def.key === Gu.KEY && trig.town === 'talk' && trig.npc === 'ettercap8') { yield* Gu.ettercap(B, false); return; }
    yield* fire0.apply(this, arguments);
  };

  // ---------------------------------------------------------------- IN: the Pit road's gulch hexes on the Silverton area (his lean 1)
  W.DOORS[Gu.KEY] = { roam: Gu.KEY, gates: { north: [-0.14, -1], south: [0.14, 1], west: [-1, 0], east: [1, 0] } }; // (the road's way through the cut: his paint's line)
  W.APPROACH[Gu.KEY] = { mi: 4, z: Infinity }; // (down to the area's closest zoom, as every door's since 11-03: js/world.js W.closeZ)
  Gu.hc = function (m, q, r) { return [m.w * (q + r / 2), m.w * Math.sqrt(3) / 2 * r]; }; // (a hex's middle in miles on that map -- W.hc reads the map in use)
  Gu.site = function (m) { return ((m || W.M()).sites || []).filter(function (s) { return s.id === Gu.KEY; })[0] || null; };
  // the road's hexes through the cut, in the road's order from the Pit to the fork: the Pit road's hexes on this map that are the gulch's (W.zoneOf) near its site
  Gu.span = function (m) {
    m = m || W.M(); if (m.gulchSpan !== undefined) return m.gulchSpan;
    var site = Gu.site(m), P = (m.paths || []).filter(function (p) { return p.id === 'pitroad'; })[0], out = null;
    if (site && P && P.hexes) {
      var hx = P.hexes, idx = [];
      hx.forEach(function (h, i) { var e = m.hex[h[0] + ',' + h[1]], c = Gu.hc(m, h[0], h[1]); if (e && W.zoneOf(e) === 'gulch' && Math.hypot(c[0] - site.x, c[1] - site.y) < 4.5) idx.push(i); });
      if (idx.length) { var lo = Math.min.apply(null, idx), hi = Math.max.apply(null, idx); out = { hexes: hx.slice(lo, hi + 1), south: hx[lo - 1] || hx[lo], north: hx[hi + 1] || hx[hi], set: {} }; out.hexes.forEach(function (h) { out.set[h[0] + ',' + h[1]] = 1; }); }
    }
    return (m.gulchSpan = out);
  };
  // which way in, by the step: down the road from the fork's end, up it from the inn's, or off a bank top
  Gu.gateFrom = function (from, to) {
    var a = W.hc(from[0], from[1]), b = W.hc(to[0], to[1]), v = [a[0] - b[0], a[1] - b[1]], G = W.DOORS[Gu.KEY].gates, best = 'north', bd = -1e9;
    Object.keys(G).forEach(function (k) { var d = G[k][0] * v[0] + G[k][1] * v[1]; if (d > bd) { bd = d; best = k; } });
    return best;
  };
  Gu.enter = function (gate, sq) {
    var site = Gu.site(); if (!site || !D.roam) return false;
    if (W.house()) { D.house.toTown(Gu.KEY, gate, sq || null); return true; }
    W.inDoor = { site: site, gate: gate }; D.push(D.roam.make('?roam=' + Gu.KEY + '&gate=' + gate, sq ? { opts: { at8: sq.slice() } } : undefined)); return true;
  };
  // IN AND OUT BY WHERE (RULED 11-20, Griz: "3 - leave dependent on where you leave. In the example fight the exit fight and exit gulch squares were the same, but if I'm on the
  // north side 'end hex' is different than if I'm on the south or the side trails"; coming in, the seat's lean he took: on the road at the row matching the hex it came from).
  // In: down the road from the hex beyond either end, by that mouth as ever; from any other hex -- one of the cut's own, or off a bank beside it -- onto the road at the row of
  // the cut's hex stepped into (its place along the span: the span's first hex the south end, its last the north). Out (Gu.ptOut): by the north mouth onto the hex beyond the
  // north end, by the south mouth onto the hex beyond the south end, by a side trail or the rim onto the bank hex beside the cut's hex at that row -- the next hex over, not two
  Gu.rowOf = function (sp, key, h) { var i = -1; sp.hexes.forEach(function (q, j) { if (q[0] + ',' + q[1] === key) i = j; }); if (i < 0 || sp.hexes.length < 2) return null; return Math.max(2, Math.min(h - 3, Math.round((1 - i / (sp.hexes.length - 1)) * (h - 1)))); };
  Gu.roadAt = function (y) { var r = Gu.ROWS[y] || '', x = r.indexOf(','); return x < 0 ? null : [x, y]; };
  // BY A GATE, AT ITS OWN WAY DOWN (11-24, world-1124 -- his NOTES of 11-22, day 6 08:40, in by the east gate and set at 19,56 on the road: "that dump onto the roam map at the road
  // instead of here, 28, 59; 28, 60", then "and check the rest of the hex entry drop off points"; the gulch lane's 2026-11-22 section: "Put every arrival by a gate at that gate's
  // own way down"): a step in off the east bank is the east gate, and the party stands where the east trail's dirt ends on the gravel, 28,59, facing down into the cut; off the
  // west bank the west gate, at the foot of the silk-cutters' descent beside their fire, 9,10. The two mouths as ever (the gate's own square on the road, rows 1 and 110), and
  // a step into the cut along the road from a hex of the road's own that is not its end (north or south, not off a bank) on the road at that hex's row, as ruled 11-20. Every way
  // in by a gate takes it: the area's step (W.onStep below: Gu.entrySq null, the gate's square) and THE WORLD's door (js/world.js offerDoor, the gate by the side) alike -- the
  // floor's gate square moved to its foot as the floor is laid (M.floor above, Gu.FOOT)
  Gu.FOOT = { east: [28, 59, [-1, 0]], west: [9, 10, [1, 0]] };
  Gu.entrySq = function (sp, from, at, gate) { // (null: by a mouth or a side gate -- the gate's own way in)
    var fk = from[0] + ',' + from[1], ends = [sp.north, sp.south].filter(Boolean).map(function (q) { return q[0] + ',' + q[1]; });
    if (ends.indexOf(fk) >= 0 || Gu.FOOT[gate]) return null;
    var y = Gu.rowOf(sp, at[0] + ',' + at[1], Gu.ROWS.length); return y == null ? null : Gu.roadAt(y);
  };
  var step0 = W.onStep;
  W.onStep = function (scene, st) { // (THE WORLD's step and the top-down view's: true stops the walk)
    var m = W.M(), S = W.state(), sp = m && m.near ? Gu.span(m) : null; // (on the area only: THE WORLD alone keeps the site's door, offered where a walk ends)
    if (sp && S.from && sp.set[S.at[0] + ',' + S.at[1]]) { var gIn = Gu.gateFrom(S.from, S.at); Gu.enter(gIn, Gu.entrySq(sp, S.from, S.at, gIn)); return true; }
    return step0.apply(this, arguments);
  };

  // ---------------------------------------------------------------- OUT: the road's two mouths onto the road beyond the cut; any other rim square asks, onto the bank top
  Gu.mouthOf = function (def, sq) { return sq[1] <= 1 ? 'north' : sq[1] >= def.h - 2 ? 'south' : null; }; // (the road's two mouths: their gates stand a square in, rows 1 and h-2)
  Gu.ptOut = function (def, sq, m) {
    m = m || W.M(); var sp = Gu.span(m), site = Gu.site(m); if (!site) return null;
    if (!sp) return [site.x, site.y];
    var mo = Gu.mouthOf(def, sq);
    if (mo === 'north') return Gu.hc(m, sp.north[0], sp.north[1]);
    if (mo === 'south') return Gu.hc(m, sp.south[0], sp.south[1]);
    // a side trail or the rim: the cut's own hex at this row (the span's index by the row: the south end first), and the next hex over that side
    var i = Math.max(0, Math.min(sp.hexes.length - 1, Math.round((1 - sq[1] / (def.h - 1)) * (sp.hexes.length - 1)))), c = Gu.hc(m, sp.hexes[i][0], sp.hexes[i][1]), side = M.sideOf(def, sq);
    return [c[0] + (side === 'west' ? -m.w : side === 'east' ? m.w : 0), c[1]]; // (one hex across that side: m.w, the map's hex across -- 2.2 had been two of the area's)
  };
  Gu.place = function (pt, line) {
    while (D.scenes.length && D.top() !== W.scene) D.pop();
    if (!W.scene) return;
    var S = W.state(); if (pt) { S.pos = pt.slice(); if (W.place(pt)) W.scene.onMap(); }
    var cl = W.hc(S.at[0], S.at[1]); W.scene.cam.cx = cl[0]; W.scene.cam.cy = cl[1]; if (W.closeIn) W.closeIn(); // (a place left: the closest zoom, 11-03)
    W.inDoor = null; if (W.house()) D.house.cur.at = { town: null }; W.save(); try { D.music('corridor'); } catch (e) { }
    W.scene.say(line + ' ' + W.timeOfDay().charAt(0).toUpperCase() + W.timeOfDay().slice(1) + '.');
  };
  Gu.out = function* (B, sq) {
    var R = D.roam, def = R.def, H = D.house, t = B.roam.token, sd = M.sideOf(def, sq), mouth = sq[1] === 0 || sq[1] === def.h - 1;
    D.sfx('popup'); t.anim = 'idle'; t.animT = B.t;
    if (mouth) { B.card(R.wrap(['{y}' + (sq[1] === 0 ? Gu.LINES.mouthN : Gu.LINES.mouthS) + '{/}', '{g}The world map takes the party on.{/}']), 90); yield 40; }
    else { var a = yield { prompt: { who: t, title: def.name.toUpperCase(), lines: R.wrap([M.LINES.edge]), opts: [{ label: 'RETURN', value: 0 }, { label: 'STAY', value: 1 }] } }; if (a !== 0) { M.stepBack(B); return; } }
    var R0 = B.roam, hr = M.hourNow(R.q, B), line = mouth ? 'Up out of Web Gulch by the ' + sd + ' mouth, on the Pit road.' : 'Up out of Web Gulch onto the ' + sd + ' bank.';
    if (W.active && W.inDoor && W.scene && D.scenes.indexOf(W.scene) >= 0) { if (R.house() && H && H.playing) H.fromFloor(B); M.carryClock(R0, hr); Gu.place(Gu.ptOut(def, sq), line); return; }
    var wm = W.index && W.index() && W.map('world'), site = wm && Gu.site(wm); // (the test door: THE WORLD opened at the site, the floor's clock carried onto it)
    if (!site || !W.make) { B.card(R.wrap(['{g}No world map on this page.{/}']), 160); M.stepBack(B); return; }
    var ws = W.make('?world&at=' + site.hex[0] + ',' + site.hex[1]), en = ws.enter;
    ws.enter = function () { en.apply(this, arguments); M.carryClock(R0, hr); W.inDoor = { site: Gu.site() || site, gate: sd }; Gu.place(Gu.ptOut(def, sq), line); };
    M.off(B); D.push(ws);
  };
  // THE GULCH'S CHILDREN ARE NOBODY'S TARGET, AND NO AREA CATCHES THEM (RULED 11-13, Griz, on the inn seat's question after his fight of 03:09Z, where Amara ran up the cut at
  // the lit children: "1 - have it auto-sculpt them out of areas, making them viable targets isn't worth the effort and scripting"): everyone the gulch's floor stands as
  // its own people (js/town.js T.people: the boy at the drum, the silk-cutter) is a `bystander` -- no foe's target, no turn (js/ai.js heroesAll) -- and `noArea`: left out of
  // every area by the one test every area asks (js/grid.js G.inArea), as an evoker's Sculpt Spells leaves an ally out. Always, not only in a catch on the road
  // (js/chase.js Ch.onlookers set the first half for those fights, 11-13). The child in tow is NOT this: an area can still kill her (ruled 11-12)
  if (D.town && D.town.people) { var peopleGu0 = D.town.people; D.town.people = function (B) {
    var r = peopleGu0.apply(this, arguments), def = D.roam && D.roam.def;
    if (def && def.key === Gu.KEY && B && B.units) B.units.forEach(function (u) { if (u.side === 'party' && u.look && typeof u.npc === 'string' && /^town\d+$/.test(String(u.id))) { u.bystander = true; u.noArea = true; } });
    return r;
  }; }
  // ---------------------------------------------------------------- THE FOG OF WAR (a TRY, 11-20, the gulch seat: his 11-16 "as well as the 'fog of war' exploring of those
  // type roams", and 11-20 "try the encounters like the Wet with fog of war"). No roam had one: the Wet and every floor draw all their squares from the start (a dark floor
  // dims what the four don't see, js/light.js L.pass, but shows its shape). Here: a square never seen is black, and what stands on it is not drawn; a square seen once and
  // out of sight now is washed grey; seen is what the party's token has a line to -- by day however far (the banks and the trees in the way: true sight, ruled 11-20), by night
  // what the party sees by its light and darkvision (L.partyMap). Kept for the floor's visit (B.roam.fogSeen): out of the gully and back in, it is dark again. On the
  // floors in Fog.ON (Web Gulch alone, the try); &nofog on a door turns it off (Gu.TRY.fog)
  var Fog = D.fog = { ON: {}, UNSEEN: '#05050b', WASH: 'rgba(8,8,18,.45)' }; // (no day's reach: true sight by day, RULED 11-20 -- the seat's 7 squares gone)
  Fog.ON[Gu.KEY] = true;
  Fog.on = function (B) { var def = D.roam && D.roam.def; return !!(B && B.roam && def && Fog.ON[def.key] && (def.key !== Gu.KEY || Gu.TRY.fog) && B.map && D.battle === B); };
  Fog.see = function (B) {
    var R0 = B.roam, t = R0.token, m = B.map, G = D.grid; if (!t || !m) return null;
    // whose eyes: the token's on the walk; in a fight every one of the party standing on the floor (11-20, his walk in the lair: "party vision on token member only re fog of
    // war/ettercap fight (viv didn't unfog until barley came in)")
    var eyes = [t]; if (R0.mode === 'fight') B.units.forEach(function (u) { if (u.side === 'party' && !u.look && !u.familiar && G.standing(u) && u.x >= 0 && u.y >= 0 && u.x < m.w && u.y < m.h && !(u.x === t.x && u.y === t.y)) eyes.push(u); });
    var k = eyes.map(function (e) { return e.x + ',' + e.y; }).join(';') + '|' + (B.dark ? 1 : 0) + '|' + m.w + 'x' + m.h;
    if (R0.fogNow && R0.fogNow.k === k) return R0.fogNow;
    if (!R0.fogSeen || R0.fogSeen.length !== m.w * m.h) R0.fogSeen = Fog.recall(m.w * m.h);
    var now = new Uint8Array(m.w * m.h), pm = B.dark && D.light ? D.light.partyMap(B) : null;
    // by night every square the party sees, however far -- each LIT square any of them has a line to (a torch's or a Light's whole ring, the cutters' fire seen from down the
    // gully) and each in a darkvision's reach (Lymen's 60 ft): the light pass's own map, L.partyMap -- 11-20, his "is the fog thing completely undoing the lighting settings"
    // and "Did the 'showing explored' and darkened fog overwrite the level level the player is shown": the fog had capped it at the day's 7 squares, the black edge nearer
    // than Lymen sees and a torch's dim ring (8) painted over.
    // BY DAY, TRUE SIGHT (RULED 11-20, Griz: "go with true sight by day, all explores won't be in daylight"): every open square any of the eyes has a line to, however far --
    // the fog by day is what the banks and the trees hide (the lair behind its neck, the hollows, the side pockets); the exploring is the night's and the dusk's. (Fog.DAY's
    // 7 squares, the seat's first number, gone)
    if (pm) for (var ip = 0; ip < pm.v.length; ip++) { if (pm.v[ip] > 0 && m.sq[ip] && m.sq[ip].open) now[ip] = 1; }
    eyes.forEach(function (e) {
      if (!pm) for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
        var i = y * m.w + x, s = m.sq[i]; if (!s || !s.open || now[i]) continue;
        if (G.losPoint(e.x, e.y, x, y)) now[i] = 1;
      }
      now[e.y * m.w + e.x] = 1;
    });
    // (the rock and the things standing at the edge of what is seen: seen with it, so the banks are drawn where the floor is)
    var edge = []; for (var j = 0; j < now.length; j++) if (now[j] === 1) { var ex = j % m.w, ey = (j - ex) / m.w; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var nx = ex + dx, ny = ey + dy; if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue; var ni = ny * m.w + nx; if (!now[ni] && !(m.sq[ni] || {}).open) edge.push(ni); } }
    edge.forEach(function (ni) { now[ni] = 2; });
    var grew = false; for (var q = 0; q < now.length; q++) if (now[q] && !R0.fogSeen[q]) { R0.fogSeen[q] = 1; grew = true; }
    if (grew) Fog.keep(R0.fogSeen);
    return (R0.fogNow = { k: k, now: now });
  };
  // SEEN STAYS SEEN (11-20, Griz, asked whether the fog was the Wet's to have too: "4 - unless this is bad, it's only the party's first time through they get the fog, correct?"
  // -- as first built it came back on every visit): what the party has seen of a floor is kept in the save (H.cur.fog[<floor>], four squares a hex digit) in the house, and
  // for the page's life on a test door (Fog.MEM); read back as the floor is walked again. A NEW GAME's party starts with the gully dark
  Fog.MEM = {};
  Fog.store = function () { var H = D.house, key = D.roam && D.roam.def && D.roam.def.key; if (!key) return null; if (H && H.playing && H.cur && D.roam.house && D.roam.house()) { H.cur.fog = H.cur.fog || {}; return { o: H.cur.fog, k: key }; } return { o: Fog.MEM, k: key }; };
  Fog.keep = function (seen) {
    var st = Fog.store(); if (!st) return; var s = '';
    for (var i = 0; i < seen.length; i += 4) s += ((seen[i] ? 8 : 0) | (seen[i + 1] ? 4 : 0) | (seen[i + 2] ? 2 : 0) | (seen[i + 3] ? 1 : 0)).toString(16);
    st.o[st.k] = s.length + ':' + s; // (its length first: a floor repainted to a new size starts dark again, not misread)
  };
  Fog.recall = function (n) {
    var out = new Uint8Array(n), st = Fog.store(), v = st && st.o[st.k]; if (typeof v !== 'string') return out;
    var c = v.indexOf(':'), s = v.slice(c + 1); if (+v.slice(0, c) !== Math.ceil(n / 4)) return out;
    for (var i = 0; i < s.length; i++) { var d = parseInt(s.charAt(i), 16); for (var b = 0; b < 4; b++) if (d & (8 >> b) && i * 4 + b < n) out[i * 4 + b] = 1; }
    return out;
  };
  Fog.hides = function (B, u) { // (a figure on a square never seen is not drawn: the party's own never hidden)
    if (!Fog.on(B) || !u || u.side === 'party' && !u.npc && !u.look) return false;
    var m = B.map, R0 = B.roam; Fog.see(B); var seen = R0.fogSeen; if (!seen) return false;
    var x = Math.round(u.x), y = Math.round(u.y); if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
    return !seen[y * m.w + x];
  };
  Fog.pass = function (ctx, B, W, H) {
    if (!Fog.on(B)) return;
    var m = B.map, iso = D.iso, f = Fog.see(B), seen = B.roam.fogSeen; if (!f || !seen) return;
    ctx.save();
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var i = y * m.w + x, s = m.sq[i];
      if (f.now[i] || (seen[i] && B.dark)) continue; // (in sight now; or seen before, by night -- the light pass dims what is out of sight already: the wash is the day's)
      var c = iso.center(x, y, s.gz || 0), p = iso.toScreen(c.x, c.y); if (p.x < -40 || p.x > W + 40 || p.y < -60 || p.y > H + 60) continue;
      ctx.fillStyle = seen[i] ? Fog.WASH : Fog.UNSEEN;
      iso.rhombus(ctx, x, y, s.gz || 0, 0); ctx.fill();
      if (!seen[i] && !s.open) { ctx.fillRect(Math.round(p.x - iso.TW / 2), Math.round(p.y - 40), iso.TW, 40); } // (a bank's rock never seen: its face too, not its top alone)
    }
    ctx.restore();
  };
  // ---------------------------------------------------------------- THE GULLY'S RANDOM FIGHTS IN PLACE (11-20, Griz: "3 - we're gonna get it working in the gulch and learn before
  // doing the road instead" -- the 11-05 "keep the field" reversed for the gulch, a try): a random encounter on the gully is the Wet's own (js/roam.js R.encounter: a group seen
  // at the edge of sight, 30 to 60 ft off, walking in, the fight where they meet), not a field cut. The two things the field kept (the iso roam combat lane, item 6): the
  // camp's people and the lad kept out of it -- the floor's folk are never dealt into the order (R.fight: `look`), nobody's target and in no area (THE GULCH'S CHILDREN, below);
  // the lad is a square, no one -- and the gully's silk the fight's hazard: every webFloor square within Gu.RANDOM.webReach of the party at a giant spider's DC 12, as the field
  // cut carried it (M.fieldDef above), laid as the fight opens and lifted as it ends (the walk on the floor keeps its webbing a look). The field's way
  // was kept; CUT 11-20, his "4 - good cut, these are better (on roam encounters)". The camp's watches keep their field (the crew boss lent, the grid)
  Gu.RANDOM = { webReach: 12, webDC: 12 };
  Gu.webSq = function (cx, cy, r) { var out = []; for (var y = Math.max(0, cy - r); y <= Math.min(Gu.ROWS.length - 1, cy + r); y++) for (var x = Math.max(0, cx - r); x <= cx + r; x++) if (Gu.ROWS[y].charAt(x) === 'x') out.push([x, y]); return out; };
  var resetGu0 = D.roam.resetEnc; // (a show's count pinned short: the next fight a few steps off -- Gu.encSoon, once)
  if (resetGu0) D.roam.resetEnc = function (R0) { var def = D.roam.def; if (Gu.encSoon && def && def.key === Gu.KEY) { var n = Gu.encSoon; Gu.encSoon = 0; return n; } return resetGu0.apply(this, arguments); };
  var encGu0 = D.roam.encounter;
  D.roam.encounter = function* (B, why, set) {
    var def = D.roam.def;
    if (!set && def && def.key === Gu.KEY) { yield* Gu.drumPlacing(B, M.inPlace(B, why, set)); return; } // (set down outside the drum's reach where the boy hears it: Gu.drumPlacing)
    yield* encGu0.apply(this, arguments);
  };
  var fightGu0 = D.roam.fight;
  D.roam.fight = function* (B, foes, lurk) {
    var def = D.roam.def, t = B.roam && B.roam.token;
    if (!def || def.key !== Gu.KEY || !t || (B.webs || []).some(function (w) { return /gully/.test(w.by); })) { return yield* fightGu0.apply(this, arguments); } // (the lad's fight lays its own: Gu.snaredInPlace)
    var w0 = B.webs; B.webs = (w0 || []).concat([{ by: 'the gully\'s silk', sq: Gu.webSq(t.x, t.y, Gu.RANDOM.webReach), dc: Gu.RANDOM.webDC, ground: true }]);
    var dr = B.noDrum ? null : Gu.drumNear(B), fm0 = B.floorMarks, ht0 = B.heroTurn; // (the camp's own watches: the boy asleep, no drum -- Gu.watchFight)
    if (dr) {
      B.drum = dr; Gu.drumB = B; dr.foes = foes; Gu.drumLast = dr;
      B.floorMarks = function (c) { if (fm0) fm0.apply(this, arguments); Gu.drawDrum(c, B); };
      B.heroTurn = function* (u) { yield* ht0.call(this, u); if (Gu.drumAllIn(B)) yield* Gu.drumFlee(B); }; // (the last of them in: the flight at once, before the next turn)
      if (D.house && D.house.trail && D.roam.house && D.roam.house()) D.house.trail('fight', 'Web Gulch: the drummer boy drums (at ' + dr.at[0] + ',' + dr.at[1] + ', ' + dr.ft + ' ft)');
      D.sfx('popup'); B.card(D.roam.wrap(['{y}' + Gu.LINES.drum.on + '{/}']), 300);
    }
    try { return yield* fightGu0.apply(this, arguments); }
    finally { B.webs = w0 || []; if (dr) { B.drum = null; Gu.drumB = null; B.floorMarks = fm0; B.heroTurn = ht0; } }
  };
  // ---------------------------------------------------------------- THE DRUMMER'S AURA (11-24, world-1124 -- his design of 11-22, verbatim, to the lanes desk on his note "discuss
  // fights drawn into camp range": "something like if there's a fight triggered the drummer boy goes to work and during the fight the drum radiates an aura the spiders won't enter
  // and if the players all move into that aura the monsters flee down the gulch and the fight ends"; the gulch lane's 2026-11-22 section). The open details are the seat's leans,
  // built so, his to overrule:
  //   THE REACH: 30 ft round the boy (Gu.DRUM.ft), wherever the hour has him -- by the fire by night, by the tents by day, out at the near webs with the cutters at noon -- drawn on
  //     the floor as a warm wash that beats with the drum (Gu.drawDrum);
  //   DAY AND NIGHT ALIKE: any fight on the gully called within his hearing -- the party within Gu.DRUM.earFt (90 ft) of him as it begins -- sets him drumming, at any hour; not
  //     the camp's own watches (the boy asleep with his drum for a pillow: Gu.watchFight) nor the lad's or the ettercap's (fought far down the gully, out of his hearing);
  //   WON'T ENTER: no foe of the fight is set down inside the reach (Gu.drumPlacing), and none steps into it or deeper into it (js/grid.js G.canStand and G.canPass, below);
  //     one already inside as the drum starts may only go out; what it does from outside -- a bite at the edge, a web thrown in -- is its own;
  //   "ALL": every one of the party standing -- the fallen are carried; a familiar, a summoning, one lent by the camp don't count;
  //   THE FLIGHT: once all of them stand inside it, at the end of that turn or the start of the next foe's, the fight's foes break off and run south down the gully, off the
  //     screen (Gu.drumFlee), and the fight ends as a getaway does: the party gathers, the fled pay no XP and leave nothing (js/roam.js R.fallen), what fell before pays as ever.
  // The words the seat's drafts (invented.json web-gulch-drum-1124)
  Gu.DRUM = { ft: 30, earFt: 90, runRows: 16, runSteps: 14 };
  Gu.LINES.drum = { on: 'The drummer boy is up and at it: the drum carries the length of the cut, and nothing from the silk will come inside the sound of it.',
    flee: 'The drum does not stop. The spiders break off and run, away down the gulch.' };
  Gu.drummer = function (B) { return ((B && B.units) || []).filter(function (u) { return u.npc === 'drummer' && u.look && !u.dead && u.x >= 0; })[0] || null; };
  Gu.drumNear = function (B) { // (the boy, if the party is in his hearing: the drum's ring, else null)
    var u = Gu.drummer(B), t = B && B.roam && B.roam.token; if (!u || !t) return null;
    return Math.max(Math.abs(u.x - t.x), Math.abs(u.y - t.y)) * 5 <= Gu.DRUM.earFt ? { at: [u.x, u.y], ft: Gu.DRUM.ft, boy: u, t0: B.t } : null;
  };
  Gu.drumFt = function (dr, u, x, y) { var n = (u && u.size) || 1, best = 1e9; for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) best = Math.min(best, Math.max(Math.abs(x + i - dr.at[0]), Math.abs(y + j - dr.at[1])) * 5); return best; };
  Gu.drumBars = function (u, x, y) { // (true: a foe of the fight may not set foot here -- into the reach, or deeper in it)
    var B = Gu.drumB, dr = B && B.drum; if (!dr || dr.fled || !u || u.side !== 'foe' || u.look || u.bystander || D.battle !== B) return false;
    if (x === u.x && y === u.y) return false; // (where it stands it may stay: it is going out)
    var to = Gu.drumFt(dr, u, x, y); if (to > dr.ft) return false;
    var on = typeof u.x === 'number' && u.x >= 0 ? Gu.drumFt(dr, u, u.x, u.y) : 1e9;
    return to <= on;
  };
  var standGu0 = D.grid.canStand, passGu0 = D.grid.canPass;
  D.grid.canStand = function (u, x, y, o) { if (Gu.drumB && Gu.drumBars(u, x, y)) return false; return standGu0.apply(this, arguments); };
  D.grid.canPass = function (u, x, y, o) { if (Gu.drumB && Gu.drumBars(u, x, y)) return false; return passGu0.apply(this, arguments); };
  // the group's squares chosen with the drum already in mind (js/roam.js R.encounter's first step, before anything is drawn): none inside the reach
  Gu.drumPlacing = function* (B, g) {
    var dr = Gu.drumNear(B), r, v;
    if (dr) { dr.placing = true; B.drum = dr; Gu.drumB = B; }
    try { r = g.next(); } finally { if (dr && B.drum === dr) { B.drum = null; Gu.drumB = null; } }
    while (!r.done) { v = yield r.value; r = g.next(v); }
    return r.value;
  };
  Gu.drumWho = function (B) { return ((B.roam && B.roam.members) || []).filter(function (u) { return !u.dead && u.hp > 0 && !u.left && !u.familiar && !u.summon && !u.ally && u.x >= 0; }); };
  Gu.drumAllIn = function (B) {
    var dr = B && B.drum; if (!dr || dr.fled || dr.placing) return false;
    var who = Gu.drumWho(B); if (!who.length) return false;
    var live = (dr.foes || []).filter(function (u) { return !u.dead && u.hp > 0 && !u.left && !u.fled; }); if (!live.length) return false;
    return who.every(function (u) { return Gu.drumFt(dr, u, u.x, u.y) <= dr.ft; });
  };
  Gu.drumFlee = function* (B) {
    var dr = B.drum, G = D.grid, R = D.roam; dr.fleeing = true; // (the bars kept while they run: away from the drum, never through it -- lifted once they are gone)
    var run = (dr.foes || []).filter(function (u) { return !u.dead && u.hp > 0 && !u.left && !u.fled; }).map(function (u) {
      var up = u.y < dr.at[1], ty = up ? Math.max(1, u.y - Gu.DRUM.runRows) : Math.min(Gu.ROWS.length - 3, Math.max(u.y, dr.at[1]) + Gu.DRUM.runRows), to = Gu.roadAt(ty) || [u.x, ty]; // (away from him: down the gully from south of the drum, up and out by the north mouth from north of it)
      delete u.conds.hidden; return { u: u, from: [u.x, u.y], path: (D.Battle.route(u, to) || []).slice(0, Gu.DRUM.runSteps) };
    });
    D.sfx('cancel'); B.card(R.wrap(['{y}' + Gu.LINES.drum.flee + '{/}']), 260);
    for (var s = 0; s < Gu.DRUM.runSteps; s++) {
      var moved = 0;
      run.forEach(function (r) { var q = r.path.shift(), u = r.u; if (!q) return; u.tween = { fx: u.x, fy: u.y, fz: G.gzAt(u, u.x, u.y), t: 0, dur: 5, mode: null }; u.facing = D.spr.facingFor(q[0] - u.x, q[1] - u.y); if (u.anim !== 'walk') { u.anim = 'walk'; u.animT = B.t; } u.x = q[0]; u.y = q[1]; moved++; });
      G.setup(G.map, B.units); if (!moved) break; yield 5; // (a square every five frames: at a run)
    }
    dr.fled = true; run.forEach(function (r) { r.u.fled = true; r.u.left = true; r.u.dead = true; }); // (off the floor: R.fight's foes standing are none, the fight over; R.fallen pays nothing for one that left)
    B.units = B.units.filter(function (w) { return !run.some(function (r) { return r.u === w; }); }); G.setup(G.map, B.units); B.cache = null;
    dr.ran = run.map(function (r) { return r.u.kind + ' ' + r.from[0] + ',' + r.from[1] + '>' + r.u.x + ',' + r.u.y; });
    if (D.house && D.house.trail && R.house && R.house()) D.house.trail('fight', 'Web Gulch: the drum held -- the party inside it, the spiders ran down the gully (' + run.length + ')');
    yield 20;
  };
  if (D.ai && D.ai.turn) { var aiTurnGu0 = D.ai.turn; D.ai.turn = function* (B, u) { if (B && B.drum && u && u.side === 'foe' && Gu.drumAllIn(B)) { yield* Gu.drumFlee(B); return; } yield* aiTurnGu0.apply(this, arguments); }; } // (a foe's turn with the party all inside: the flight, not the turn)
  // the reach on the floor, under the figures (js/ui.js drawBattle's B.floorMarks): a warm wash on every square of it the party could stand on, brighter on the drum's beat
  Gu.drawDrum = function (c, B) {
    var dr = B.drum; if (!dr || dr.fled || dr.placing || !B.map) return;
    var iso = D.iso, n = dr.ft / 5, beat = ((B.t - (dr.t0 || 0)) % 30) / 30, a = 0.10 + 0.10 * Math.max(0, 1 - beat * 3);
    for (var y = dr.at[1] - n; y <= dr.at[1] + n; y++) for (var x = dr.at[0] - n; x <= dr.at[0] + n; x++) {
      var s = B.map.at(x, y); if (!s || !s.walk) continue;
      var edge = Math.max(Math.abs(x - dr.at[0]), Math.abs(y - dr.at[1])) === n;
      iso.rhombus(c, x, y, B.map.gz(x, y), 1); c.globalAlpha = edge ? a + 0.12 : a; c.fillStyle = 'rgb(240,190,90)'; c.fill(); c.globalAlpha = 1;
    }
  };
  // ---------------------------------------------------------------- THE DUSK (RULED 11-20, Griz: "1 lean" -- the seat's lean, "a dusk tint as a look only, not the dark's rules"): the
  // gully is dark by night alone (20:00 to 05:00, M.night); at dusk (17:00 to 20:00, W.todAt) it drew as full day. Now a dusk tint lies over the floor as drawn -- a look:
  // no light pass, no change to who sees whom, to the fog or to any roll. On the floors in Dusk.ON (Web Gulch, the ruling's)
  // THE DAWN (RULED 11-20, Griz: "gulch / 1 - yes", on the seat's lean): dawn too, 05:00 to 07:00 (W.todAt's 'dawn'; the dark ends at 05:00), the same tint lighter, a look only
  var Dusk = D.dusk = { ON: {}, TINT: 'rgba(36,18,46,0.30)', DAWN: 'rgba(36,18,46,0.16)' };
  Dusk.ON[Gu.KEY] = true;
  Dusk.band = function (B) { var def = D.roam && D.roam.def; if (!B || !B.roam || !def || !Dusk.ON[def.key] || B.dark || D.battle !== B) return null; var W8 = D.world, tod = W8 && W8.todAt ? W8.todAt(M.hourNow(D.roam.q, B)) : null; return tod === 'dusk' || tod === 'dawn' ? tod : null; };
  Dusk.on = function (B) { return !!Dusk.band(B); };
  Dusk.pass = function (ctx, B, W, H) { var bd = Dusk.band(B); if (!bd) return false; ctx.save(); ctx.fillStyle = bd === 'dawn' ? Dusk.DAWN : Dusk.TINT; ctx.fillRect(0, 0, W, H); ctx.restore(); return true; };
  var edgeOut0 = M.edgeOut;
  M.edgeOut = function* (B, sq) { if (D.roam.def && D.roam.def.key === Gu.KEY) { yield* Gu.out(B, sq); return; } yield* edgeOut0.apply(this, arguments); };
})();

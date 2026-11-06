/* DEEP16 -- THE SECOND ACT (11-04, the Inn build seat 2; the Halfway Inn lane's item 13: the Inn seat's §10 beat sheet, every beat RULED 11-04 -- his "take all the leans, will
   object later as needed" and "the second act is the Inn lane's §10, every beat ruled, the code list reconciled against inn.js in its first item, the art asked. Build it after
   items 1 and 2 as the sheet says. / Object as you read, and the page bends"). The wagon night has two acts on one clock: act one the yard (js/inn.js In.wagonNight, played on
   the floor); act two what the module calls the Warm-Up and the due, as a scene the party can enter -- while the yard is busy Gennet's half hour runs (the kitchen barred, the
   lantern lit, the singing, the lake flat, the bow-wave), and at its end the lantern leaves its post and walks to the point with the child she took at the greeting. The party
   chooses: the chase or the lantern. Three ends -- the due paid, the due stopped on the path, the god met at the stone -- and in every one the inn stands (CANON 08-27e).
   BUILT ON THE FLOOR inn.js HAS (§10.6.1): the lake door, the path, the point with its stone and post, the deep. The signs as cards on the map with their silent reads (a yard
   fight eats three); the fork card with its buttons by the yard's case (AFTER THEM hands to the chase, js/chase.js, with duePaid set); Gennet as a foe (the SRD Cult Fanatic
   reflavored, data/foes.js gennet, a cleric 4 by js/classes.js NPC.NAMED, `yields` at half and sits; her Spiritual Weapon the crook of lantern-light that guards the child --
   D.scripts.gennet casts it at whoever is nearest her); Doran a foe on a blow at a boy (the SRD Commoner with a woodaxe, yields at half -- with the boys in since 11-05, unasked);
   the child a BYSTANDER the AI never targets, that never acts and lends no flank (the `bystander` flag, js/ai.js heroes, js/grid.js G.flank -- built once here, the lamia lane's
   Wystan wants it next); TAKE THE CHILD; the rise on the iso camera (Battle.camTo) with its three cases and the chuul fight at the shore, ring or not (11-05: the ring's rounds
   the edge, not the gate), and after a paid due with the ring warm (A.ringWarm); the rowboat (A.sound) (the `chuul` fight's frog and the Ring of Binding's rounds laid on the
   floor's fight); Elsbeth's three states, the wand in the kitchen only (js/inn.js M.SCENES.elsbeth); the flags a line each (the registry under content/); the record on the trail; the show
   door deep16/?show=secondact&beat=<id>&case=<case> with the dice pinned; invented.json lines. The seat's calls where the sheet did not fit the floor are in the lane's section.
   Bench: dev/bench16.js mode=secondact1104; the probe dev/inn-probe.py. */
'use strict';
(function () {
  var D = window.D16, DS = window.DS, M = D.mines, W = D.world, In = D.inn, G = D.grid, A = D.secondact = {};
  if (!M || !W || !In) return;
  var L = function (k, o) { return D.counter.L(k, o); };
  var R = function () { return D.roam; };
  A.STONE = [44, 18]; A.POST = [42, 15]; A.PATH = { head: [38, 18], half: [40, 18], foot: [43, 18] }; A.DEEP = [46, 17]; // (the deep: off the point, 11-05 -- it had been 44,16, a rock of the point; the lake knee-shallow elsewhere, js/inn.js) // (the floor's squares: js/inn.js In.ROWS -- the flat stone 'i' at 44,18-19, the post 'l', the path from the lake door east, the deep 'Y' from 46)
  A.SHORE = 5; // (squares from the stone: "a party at the shore" -- the point's end; the path's head by the lake door, seven off, is not)
  // ---------------------------------------------------------------- §10.1 the clock: six signs, each a card with its read beside it (the §4 shape: the house reads in silence)
  A.SIGNS = [
    { at: 5, sign: 'Elsbeth is sent up, and the kitchen door is barred from inside.', dc: 10, read: 'A bar drops across the kitchen door.' },
    { at: 10, sign: 'Down at the water a light comes on at the post: the shore-lantern, lit.', dc: null, read: null },
    { at: 15, sign: 'From the family room, low, singing.', dc: 13, read: 'Singing, low. Two boys\' voices under a woman\'s.' },
    { at: 20, sign: 'The night-lines\' floats have stopped bobbing.', dc: 13, read: 'The lake has gone flat as a plate.' },
    { at: 25, sign: 'Out past the point the water is not still.', dc: 15, read: 'Something out past the point is moving toward it, and the water moves ahead of it.' },
    { at: 30, sign: 'The lantern has left its post.', dc: null, read: null }
  ];
  A.LINES = { // (the seat's drafts, the sheet's where it had them: invented.json halfway-second-act)
    fought: '{g}While the yard was busy, the house\'s half hour ran on.{/}',
    fork: 'The lantern has left its post. Down the path toward the water: a woman with the lantern, and the one she took inside.',
    forkNorth: 'North up the road: two shapes going hard in the dark.',
    forkGoblin: '{g}(To the eye the one she leads is a goblin still.){/}',
    gennetPath: '{y}Gennet Waterby:{/} "You\'ve had your supper and your beds. This is the house\'s business. Stand out of the light."',
    elsbethLantern: '{y}Elsbeth:{/} "You\'ll want this. I\'m not going nearer."',
    stand: 'You stand out of the light. The lantern goes on down the path to the water.',
    take: 'She is between you and the child. The fight begins on your step.',
    yielded: '{y}Gennet Waterby{/} sits down on the path, the lantern beside her, and says it to nobody: "It gave back. It always gave back."',
    doran: '{y}Doran Waterby{/} comes down out of the lake door with the woodaxe: "Not the boys."',
    doranYield: '{y}Doran{/} lowers the axe and goes to her.',
    doranSit: '{y}Doran{/} does not rage. He sits down.',
    childTaken: '{y}{name}{/} takes the child\'s hand, and she goes with it. The due has no offering.',
    childLeft: 'The child stands where the inn lady left her, on the path, in the lantern\'s light.',
    stone: 'At the flat stone the offering is set down. The lake goes glass-flat. The water heaves -- the take -- and the lantern comes back up the path alone.',
    stoneGoblin: 'At the flat stone the goblin is set down. The lake goes glass-flat. The water heaves -- the take -- and the lantern comes back up the path alone.',
    rise: 'The water off the point heaves. It comes halfway up: the size of a wagon, the colour of wet stone, plated, legged, two long soft arms that move as if they were thinking. It waits.',
    riseNone: 'Nothing stands on the stone. It goes down.',
    riseRing: 'It turns toward the ring before it turns toward anything else.',
    riseNoRing: 'Cheated of the stone, it does not go down. It comes up onto the point at whatever stands there -- and you are not ready for it.', // (RULED 11-05, his "Yes, the leans": it fights, ring or not -- the Winters seat; it had gone down)
    elsbethThat: '{y}Elsbeth:{/} "That\'s what it is. That\'s all it is."',
    mornStopped: 'Morning. The child sleeps by the fire under somebody\'s coat. The inn lady keeps her back to the room.', // (the due's own night since 11-05: Doran drove the wagon's children three nights ago)
    mornDead: 'Morning. The lantern is on its hook by the lake door, and nobody lights it. Doran Waterby at the counter: "You\'ll want the road."',
    mornDoranDead: 'Morning. The inn is the inn lady\'s and the boys\'. The lantern is on its hook by the lake door, and it will be lit again at the month\'s end.',
    mornLake: 'Morning. Up at the inn a lamp came on in the kitchen before dawn. The Waterbys keep the inn; the lantern stays on its hook by the lake door, and nobody lights it. Doran walks down to the water with a bucket, draws from the lake in front of everyone, and drinks.',
    gaveBack: '{y}Gennet Waterby:{/} "It gave back."',
    noRoom: '{g}No room from her. Doran sells the rooms now.{/}',
    doranRoad: '{y}Doran Waterby:{/} "You\'ll want the road."',
    wandPush: '{y}{name}:{/} "Gennet Waterby is a fraud, and you know it."',
    wandOut: 'Her hand goes into the apron and comes out with a length of blackened bone-white wood, a hand and a half long, and she says one word.',
    wandFlee: '{y}{name}{/} turns and walks out of the kitchen, and cannot come nearer her for a minute.',
    wandHold: '{y}{name}{/} holds. The word slides off.',
    wandCone: 'The rest of you press, and she says the other word: the kitchen is a wall of fear, and you are back by the fire before you know it.',
    wandDone: 'Nobody is hurt. Behind you she is at the tub again, the wood gone back into the apron, and she will not speak to you again tonight.', // (11-05, his "says the kitchen is empty and doors won't open and the kitchen doesn't empty and has no doors. Easiest to change the text")
    elsbethSilentWand: 'She keeps her back to you and works. Nothing you say turns her round tonight.',
    // (the Winters seat, 11-05: the chuul on the due's own night and the rowboat -- invented.json halfway-lake-due-night-1105)
    ringWarmBack: 'Back up the path to the lake door, and in to bed.',
    mornLakeAway: 'Morning. Up at the inn a lamp came on in the kitchen before dawn. Doran is gone, and the wagon with him. The lantern stays on its hook by the lake door, and nobody lights it.',
    // (the due three nights on, 11-05: invented.json halfway-due-moved-1105)
    dueNight: 'Past midnight at the Halfway Inn. The house is dark, and the lake door shut.',
    dueWoke: 'Something wakes you: low singing, somewhere in the house. Two boys\' voices under a woman\'s.',
    mornDue: 'Morning. The inn lady hums at the stove. Out on the point the lantern hangs cold on its post.',
    mornDueKept: 'Morning. The inn lady hums at the stove. Out back, nobody is skipping stones.',
    // (the poison dinner, 11-05: invented.json halfway-poison-dinner-1105)
    poisonSupper: 'Supper at the long table: lake fish, a stew, the inn lady\'s bread. Doran pours, and the bowls go round.',
    poisonTaste: '{c}(medicine){/} {name} tastes it before the second spoonful: a bitterness under the fish. {name} puts the spoon down.',
    poisonWatch: '{c}(insight){/} {name} sees the inn lady fill every bowl but her own, and says so.',
    poisonNothing: 'Supper ends. Nobody feels a thing they would put a name to. The house goes to bed.',
    poisonDrop: '{names} go down at the table, face to the boards, breathing slow.',
    poisonRise: 'The rest of you are up, and the inn lady\'s chair goes back.',
    poisonNoConfess: 'Nobody in the house says anything after. Out back the lantern post stands unlit.',
    confess1: '{y}Doran Waterby{/} sets the woodaxe down on the table. "There\'s a thing in the lake. It was there before the inn. Every month it\'s fed, and every month the lake gives back -- the fish, the old coin, her."',
    confess2: 'He does not look at the inn lady. "Tonight was the night. You were tonight."',
    confessBucket: 'He takes the bucket from the hearth and throws it over whoever still sleeps.',
    confess3: '"It comes up anyway. It always comes up. If you mean to stop it, come out back. I\'ll show you the stone."',
    confessLead: 'Doran stops at the path\'s head with the shore-lantern. The inn lady stays by the fire.',
    poisonAll: 'The table tilts away. The last thing: the inn lady\'s hand taking the spoon out of yours.',
    dragStone: 'Cold. Wet stone under your cheek, and the lake\'s breath. The lantern is at the path\'s head, and two shapes stand by it.',
    dragWake: '{names} come awake on the stone.',
    dragTaken: 'It takes {name} off the stone, and the water closes. The cold of it wakes the rest of you.',
    mornPoison: 'Morning. Doran Waterby at the counter, the bucket by his boots. The inn lady keeps to the kitchen.',
    // (the nearest offering, 11-05: invented.json halfway-nearest-offering-1105)
    withChild: 'The child\'s hand is in yours. Behind you on the path the inn lady sits by her lantern, and has not moved.',
    inside: 'In through the lake door with the child. From the doorway: the inn lady is still on the path, the lantern beside her. The water off the point heaves.',
    gennetFirst: 'It does not turn toward you. It turns toward the one on the path: the nearest offering.',
    letTaken: 'It comes up out of the shallows onto the path to where she sits. The lantern goes into the water, and then the water is only water.',
    fightTaken: 'It has her. It goes down into the deep and takes the inn lady with it; the lantern floats a moment, and goes out.',
    mornTakenLet: 'Morning. The lantern is gone from its hook by the lake door. Doran Waterby at the counter, his eyes on the lake door: "You\'ll want the road."',
    mornTakenTried: 'Morning. The lantern is gone from its hook by the lake door. Doran Waterby at the counter: "You tried for her. I saw." He will let you a room. Nobody cooks at the Waterbys\' now.',
    opts: { after: 'AFTER THEM', lantern: 'THE LANTERN', let: 'LET IT BE', stand: 'STAND ASIDE', take: 'TAKE THE CHILD', strike: 'STRIKE', leave: 'LEAVE HER', press: 'PRESS ON', back: 'BACK OFF', fraud: 'CALL GENNET A FRAUD',
      down: 'GO DOWN TO THE POINT', bed: 'BACK TO BED', leaveIt: 'LEAVE IT', sound: 'PUSH OUT AND SOUND THE DEEP',
      inside: 'TAKE HER INSIDE', water: 'STAY AT THE WATER', goBack: 'GO BACK FOR HER', letLake: 'LET THE LAKE HAVE HER' }
  };
  A.trail = function (s) { if (D.house && D.house.trail) D.house.trail('act', 'THE SECOND ACT: ' + s); };

  // ---------------------------------------------------------------- the signs: from f.warmup up to `upTo`, each a card with its read if the house caught it (the party's best passive Perception)
  A.signs = function* (B, upTo, batch) {
    var f = B.roam.flags, st = D.counter.state(B), from = f.warmup || 0;
    if (batch && upTo > from) yield* In.card(B, [A.LINES.fought], 300);
    for (var i = from; i < Math.min(upTo, A.SIGNS.length); i++) {
      var s = A.SIGNS[i], got = s.dc == null || In.read(st, 'Perception', s.dc);
      yield* In.card(B, ['{g}+' + s.at + ' minutes:{/} ' + s.sign].concat(got && s.read ? ['{c}(perception) ' + s.read + '{/}'] : []), batch ? 240 : 360);
      f.warmup = i + 1;
    }
    if (f.warmup >= A.SIGNS.length) f.lanternWalks = 1;
  };
  // ---------------------------------------------------------------- the cast on the path: Gennet (a foe, inert till the fight) with the shore-lantern, and the child, a bystander. THE BOYS STAY
  // IN (11-05, Griz on the second act, the lanes desk's relay: "I don't think she'd bring the boys out"): Orrin and Pell are not on the path on the due's night -- they had stood there
  // as bystanders and lent the party flanking; Gennet carries the lantern herself, and Doran's way into the fight (a blow at a boy, A.fight) has no boy to answer now
  A.cast = function (B, f, at) {
    var Y = {}, kid = f.glamourBroken || f.glamourSeen;
    Y.gennet = In.unit(B, { id: 'gennetPath', kind: 'gennet', at: [at[0], at[1]], name: In.named(f), face: [1, 0], foe: true, lantern: true });
    Y.gennet.script = 'gennet'; Y.gennet.flees = false; Y.gennet.yields = true;
    Y.kid = In.unit(B, { id: 'dueChild', kind: kid ? 'commonerchild' : 'goblin', at: [at[0] + 1, at[1]], name: kid ? 'A child' : 'A goblin', face: [1, 0] });
    Y.kid.bystander = true;
    Y.gennet.guards = Y.kid.id;
    return Y;
  };
  A.clear = function (B, Y) { ['gennet', 'orrin', 'pell', 'kid', 'doran', 'elsbeth', 'chuul', 'frog'].forEach(function (k) { if (Y[k] && B.units.indexOf(Y[k]) >= 0) In.gone(B, Y[k]); Y[k] = null; }); };
  A.walkAll = function* (B, Y, to) { // (the two of them down the path to a square, the lantern with them)
    yield* In.walk(B, Y.gennet, [to[0], to[1]], [1, 0]);
    yield* In.walk(B, Y.kid, [to[0] + 1, to[1]], [1, 0]);
  };
  A.elsbethState = function (f) { return f.wandOut ? 'wand' : f.elsbethTier >= 3 ? 'earned' : 'neutral'; };
  A.hasRing = function (B) { var w = null; (B.roam.members || []).forEach(function (u) { if (!w && u.hp > 0 && u.src && DS.R.wears(u.src, 'ringofbinding')) w = u; }); return w; };

  // ---------------------------------------------------------------- THE DUE'S OWN NIGHT (RULED 11-05, Griz: "hate to do it, but let's move the offering to 3 nights after wagon night ..."; then
  // "go with those leans"): the night of WAGON DAY + 3 at the inn (js/inn.js In.night, In.DUE), by what the Waterbys keep for the stone (In.offering). An offering kept -- the goblin
  // in the barn, or the one they kept -- and the house goes to bed; past midnight Gennet's half hour runs (the six signs), and the singing wakes the party if its best passive Perception
  // makes DC 13 (the seat's call): the signs from there with their reads, then the fork, THE LANTERN or LET IT BE. Asleep through it, the walk as the night's cutscene, the due paid,
  // and the Ring of Binding warm if it is worn (A.ringWarm). No offering -- the wagon stopped before it reached them, or the child freed from the barn -- is the poison dinner
  // (A.poisonNight). The morning by the end (A.morning), the ring cold if the lake has eaten
  A.DUE_WAKE = 13; A.DUE_HOUR = 1; // (the singing's read; the house's half hour past midnight)
  A.wiped = function (B) { return !(B.roam.members || []).some(function (u) { return u.hp > 0 && !u.dead; }); };
  A.dueNight = function* (B, d) {
    var R0 = B.roam, f = R0.flags, c = In.dueCycle(d), off = In.offering(f, c), st = D.counter.state(B);
    f.dueCycle = c; ['duePaid', 'dueTonight', 'secondActDone', 'lanternWalks', 'pathStand'].forEach(function (k) { delete f[k]; }); f.warmup = 0;
    delete f.doranAway; // (Doran back from Newland by the due: the seat's call)
    A.trail('the due night, day ' + d + ': the offering ' + off);
    if (off === 'none') { yield* A.poisonNight(B, d); return; }
    f.dueTonight = 1; f.kidTaken = 1; if (off === 'kept') { f.glamourBroken = 1; f.glamourSeen = 1; }
    In.stage(B, [24, 17], 'inn'); In.passTo(B, A.DUE_HOUR);
    yield* In.card(B, [A.LINES.dueNight], 360);
    if (In.read(st, 'Perception', A.DUE_WAKE)) {
      f.warmup = 2; // (the singing, +15: what came before it slept through)
      yield* In.card(B, [A.LINES.dueWoke], 300);
      yield* A.signs(B, 6, false);
      if ((yield* A.dueFork(B)) === 'lost' || A.wiped(B)) return;
    } else {
      yield* In.dueWalk(B, f.glamourBroken || f.glamourSeen ? 'kid' : 'goblin'); f.duePaid = 1;
      if ((yield* A.ringWarm(B, {})) === 'lost' || A.wiped(B)) return;
    }
    yield* A.dueMorning(B, off);
  };
  // ---------------------------------------------------------------- THE POISON DINNER (RULED 11-05, Griz: "a poison dinner (likely fight) if they interrupt the wagon before it gets there and happen
  // to be there on sacrifice night"; "something like a sleep vs con save thing where if they don't all fail the con save, the ones that do fail it trigger the suspicion of the others, if
  // they do the first one to make a con save and they wake up having been drug out to the sacrifice rock"; "if they all fail have the successes they make during the x minutes we suppose
  // it would take to drag the whole party out there count as a bonus to the save when they're all out there (sleep to fight outside vs fight inside)"; "Fight inside to submission and
  // doran confesses about the lake monster and leads them out back"; "go with those leans"). No offering on the due's night and the party at supper: a mundane sleeping draught in the
  // stew, a CON save each at DC 13. The tells, each hero's own silent read: Medicine 13 tastes it (that one does not eat), Insight 15 sees the inn lady fill every bowl but her own (the
  // rest save with advantage). Some asleep, or a tell: the fight in the common room to submission (the first yield ends it), Doran's confession, his bucket over the sleepers, and he
  // leads them out back to the stone -- the rise, the fight at the shore; Gennet stays by the fire. All asleep: the drag, ten minutes, a save every two (+1 a success), then on the
  // stone each saves with its bonus as the water heaves and again each round; everyone who makes it wakes, each with its own bonus till it does (RULED 11-05, his "Everyone who makes it"; POISON.firstOnly false); three rounds with
  // nobody awake and it takes one. No supper, no tell and nobody asleep: the lake goes unfed. The seat's drafts: invented.json halfway-poison-dinner-1105
  A.POISON = { dc: 13, taste: 13, watch: 15, dragMin: 10, dragEvery: 2, perSuccess: 1, cut: 3, firstOnly: false };
  A.poisonSave = function (u, bonus, adv) { var h = u.src || u, r = In.d20(), r2 = adv ? In.d20() : null, roll = adv ? Math.max(r, r2) : r, b = DS.R.saveBonus(h, 'con') + (bonus || 0), ok = roll + b >= A.POISON.dc; In.trail((h.name || u.name) + ' CON save ' + (adv ? '[' + r + ',' + r2 + ']>' : '') + roll + ' + ' + b + ' vs DC ' + A.POISON.dc + ' (the draught)' + (ok ? ', made' : ', failed')); return ok; };
  A.passive = function (u, skill, ab) { return 10 + DS.R.skill(u.src || u, skill, ab); };
  A.poisonNight = function* (B, d) {
    var Rm = R(), R0 = B.roam, f = R0.flags, c = In.dueCycle(d), P = A.POISON, stay = R0.stay;
    if (!stay || stay.kind !== 'dinner') { f.dueUnfed = c; A.trail('the due night with no offering, no supper: the lake unfed'); yield* In.sleep(B); return; }
    f.poisonNight = c;
    var party = R0.members.filter(function (u) { return u.src && !u.src.guest && u.hp > 0 && !u.dead; });
    var taster = party.filter(function (u) { return A.passive(u, 'Medicine', 'wis') >= P.taste; })[0] || null, watcher = party.filter(function (u) { return A.passive(u, 'Insight', 'wis') >= P.watch; })[0] || null;
    In.stage(B, [24, 17], 'inn');
    yield* In.card(B, [A.LINES.poisonSupper], 360);
    if (taster) yield* In.card(B, [A.LINES.poisonTaste.split('{name}').join(taster.name)], 360);
    if (watcher) yield* In.card(B, [A.LINES.poisonWatch.split('{name}').join(watcher.name)], 360);
    var eaters = party.filter(function (u) { return u !== taster; }), asleep = eaters.filter(function (u) { return !A.poisonSave(u, 0, !!watcher); }), awake = party.filter(function (u) { return asleep.indexOf(u) < 0; });
    A.trail('the poison dinner: ' + (asleep.map(function (u) { return u.name; }).join(', ') || 'nobody') + ' asleep' + (taster ? ', ' + taster.name + ' tasted it' : '') + (watcher ? ', ' + watcher.name + ' saw' : ''));
    if (!asleep.length && !taster && !watcher) { f.dueUnfed = c; yield* In.card(B, [A.LINES.poisonNothing], 360); yield* In.sleep(B); return; }
    if (!awake.length) { yield* A.drag(B, party); return; }
    yield* A.supperFight(B, asleep, awake);
  };
  // the four at their places at the long table as the supper's fight opens (js/inn.js In.TABLE.seats, In.sit's order: the lead and the second on the north side, the third and the fourth
  // on the south), each facing the table; a guest stands where the spill put them
  A.seatFight = function (B) {
    var R0 = B.roam, Gd = D.grid, four = [R0.token].concat(R0.rest || []).filter(function (u) { return u && u.src && !u.src.guest && B.units.indexOf(u) >= 0; }).slice(0, 4);
    four.forEach(function (u, i) { var q = In.TABLE.seats[i]; if (!q) return; u.x = q[0]; u.y = q[1]; u.tween = null; u.facing = D.spr.facingFor(0, q[1] < In.TABLE.y ? 1 : -1); u.animT = B.t; });
    Gd.setup(Gd.map, B.units); B.cache = null;
  };
  // some asleep: the sleepers drop at the table, the awake rise -- the fight in the common room to submission; Doran confesses and leads them out back
  A.supperFight = function* (B, asleep, awake) {
    var Rm = R(), R0 = B.roam, f = R0.flags, Y = {};
    yield* In.card(B, [A.LINES.poisonDrop.split('{names}').join(asleep.map(function (u) { return u.name; }).join(' and ')), A.LINES.poisonRise], 420);
    B.units.filter(function (u) { return u.npc === 'gennet' || u.npc === 'doranIn'; }).forEach(function (u) { In.gone(B, u); }); // (the two at the table, as foes now)
    // AT THE TABLE (11-06, Griz on the fight: "the fight should break out from a dinner thing, with them in dinner positions"): the Waterbys up from their own places at the long table
    // -- the inn lady on its north side, Doran at its west end (js/inn.js In.TABLE, the meal's seats) -- and the party at theirs once the fight spills them (A.seatFight): the sleepers
    // slumped where they sat, the awake up beside their places. It had opened with the party stood below the table and the pair at 24,16 and 26,16
    Y.gennet = In.unit(B, { id: 'gennetSup', kind: 'gennet', at: In.TABLE.gennet.slice(), name: In.named(f), face: [0, 1], foe: true }); Y.gennet.yields = true; Y.gennet.flees = false;
    Y.doran = In.unit(B, { id: 'doranSup', kind: 'doran', at: In.TABLE.doran.slice(), name: 'Doran Waterby', face: [1, 0], foe: true }); Y.doran.yields = true; Y.doran.flees = false;
    asleep.forEach(function (u) { u.conds.asleep = { by: 'draught' }; u.conds.prone = true; });
    f.poisonFight = 1; R0.fights++; R0.lastOutcome = null;
    try { D.music('boss'); } catch (e) { }
    yield* Rm.engage(B, { foes: [Y.gennet, Y.doran], why: 'supper', zone: null, onSpill: function (B2) { A.seatFight(B2); } }, false, 'supper');
    var o = R0.lastOutcome;
    if (/^(lost|lose|dead|ko)$/.test(String(o)) || A.wiped(B)) return;
    var doranUp = A.standing(B, Y.doran);
    if (!A.standing(B, Y.gennet)) f.gennetDead = 1; if (!doranUp) f.doranDead = 1;
    A.clear(B, Y); In.lay(B, 'inn', true);
    if (!doranUp) { yield* In.card(B, [A.LINES.poisonNoConfess], 420); f.dueUnfed = In.dueCycle(In.day(D.roam.q)); yield* A.dueMorning(B, 'none'); return; }
    f.doranConfessed = 1; A.trail('Doran confesses: the thing in the lake');
    yield* In.card(B, [A.LINES.confess1], 480);
    yield* In.card(B, [A.LINES.confess2], 420);
    R0.members.forEach(function (u) { if (u.conds && u.conds.asleep) { delete u.conds.asleep; delete u.conds.prone; } }); // (his bucket: everyone up)
    yield* In.card(B, [A.LINES.confessBucket, A.LINES.confess3], 420);
    In.passTo(B, A.DUE_HOUR);
    yield* Rm.walkTo(B, A.PATH.head); yield* In.card(B, [A.LINES.confessLead], 360);
    yield* Rm.walkTo(B, [A.STONE[0] - 2, A.STONE[1]]);
    yield* A.rise(B, {}); // (cheated, at the shore: it fights, ring or not -- Gennet by the fire, no offering on the path)
    if (A.wiped(B)) return;
    yield* A.dueMorning(B, 'none');
  };
  // all asleep: the drag -- ten minutes of it, a save every two, each success +1 to the save at the stone; on the stone the rise, and the saves again each round
  A.drag = function* (B, party) {
    var R0 = B.roam, f = R0.flags, P = A.POISON, n = Math.round(P.dragMin / P.dragEvery), bonus = {};
    yield* In.card(B, [A.LINES.poisonAll], 420);
    party.forEach(function (u) { var s = 0; for (var i = 0; i < n; i++) if (A.poisonSave(u, 0, false)) s++; bonus[u.id] = s * P.perSuccess; });
    A.trail('the drag: ' + party.map(function (u) { return u.name + ' +' + bonus[u.id]; }).join(', '));
    f.poisonDrag = 1; In.passTo(B, A.DUE_HOUR);
    var t = R0.token; t.x = A.STONE[0]; t.y = A.STONE[1]; t.tween = null; R0.path = null; In.lay(B, null, true);
    yield* In.card(B, [A.LINES.dragStone], 420);
    var Y = {}; yield* A.surface(B, Y);
    party.forEach(function (u) { u.conds.asleep = { by: 'draught' }; u.conds.prone = true; });
    var wake = function (Bf, why) { // (each sleeper's save with its bonus; who makes it wakes -- or only the first, P.firstOnly)
      var woke = [];
      party.forEach(function (u) { if (!u.conds || !u.conds.asleep || u.dead || u.hp <= 0) return; if ((!P.firstOnly || !woke.length) && A.poisonSave(u, bonus[u.id], false)) { delete u.conds.asleep; woke.push(u); } });
      if (woke.length && Bf && Bf.card) Bf.card(D.roam.wrap([A.LINES.dragWake.split('{names}').join(woke.map(function (u) { return u.name; }).join(' and ')) + (why ? ' ' + why : '')]), 360);
      return woke;
    };
    var first = wake(null, ''); // (as the water heaves: the first saves, the drag's bonus on them)
    if (first.length) yield* In.card(B, [A.LINES.dragWake.split('{names}').join(first.map(function (u) { return u.name; }).join(' and '))], 360);
    var turn0 = D.ai.turn, lastR = 0, quiet = 0, chuul = Y.chuul;
    D.ai.turn = function* (Bf, u) {
      if (u === chuul && Bf.round !== lastR) {
        lastR = Bf.round; var up = party.some(function (w) { return w.hp > 0 && !w.dead && !(w.conds && w.conds.asleep); });
        if (!up) { var w2 = wake(Bf, ''); up = w2.length > 0; }
        if (!up) { quiet++; if (quiet >= P.cut) { // (three rounds, nobody up: it takes one, and the cold wakes the rest)
          var near = party.filter(function (w) { return w.hp > 0 && !w.dead; }).sort(function (a, b) { return G.dist(chuul, a) - G.dist(chuul, b); })[0];
          if (near) { near.hp = 0; near.dead = true; near.fled = true; near.deadT = Bf.t; f.poisonTaken = near.name; Bf.card(D.roam.wrap([A.LINES.dragTaken.split('{name}').join(near.name)]), 480); D.sfx('splash'); }
          party.forEach(function (w) { if (w.conds && w.conds.asleep) delete w.conds.asleep; });
        } }
      }
      yield* turn0.apply(this, arguments);
    };
    var o;
    try { o = yield* A.meet(B, Y, A.hasRing(B)); } finally { D.ai.turn = turn0; }
    if (o === 'lost' || A.wiped(B)) return;
    A.clear(B, Y); yield* A.ends(B);
    yield* A.dueMorning(B, 'none');
  };
  A.dueMorning = function* (B, off) {
    var f = B.roam.flags, st = D.counter.state(B);
    var morning = A.morning(f) || (f.poisonFight || f.poisonDrag ? A.LINES.mornPoison : off === 'kept' ? A.LINES.mornDueKept : A.LINES.mornDue);
    if (f.poisonTaken && !f.poisonTakenSaid) { f.poisonTakenSaid = 1; morning = 'Morning. ' + f.poisonTaken + ' is not with you. ' + morning.replace(/^Morning\.\s*/, ''); } // (the drag's three rounds with nobody up: one taken)
    if ((f.duePaid || f.gennetTaken) && !f.lakeDone && In.has(st, 'ringofbinding')) morning = morning + ' ' + L('wagon.ringCold');
    In.stage(B, [24, 17], 'inn');
    yield* In.sleep(B, morning);
  };
  // the fork (beat 1, on the due's own night now): the lantern has left its post -- THE LANTERN (the path) or LET IT BE (the walk, the due paid, the ring warm)
  A.dueFork = function* (B) {
    var f = B.roam.flags, goblin = !(f.glamourBroken || f.glamourSeen);
    yield* B.camTo({ gx: A.PATH.half[0], gy: A.PATH.half[1], gz: 0 }, D.iso.zoom, 30);
    var a = yield* In.ask(B, 'THE LANTERN WALKS', [A.LINES.fork].concat(goblin ? [A.LINES.forkGoblin] : []), [A.LINES.opts.lantern, A.LINES.opts.let]);
    A.trail('the fork: ' + (a === 0 ? 'the lantern' : 'let it be'));
    if (a === 1) { yield* In.dueWalk(B, goblin ? 'goblin' : 'kid'); f.duePaid = 1; return yield* A.ringWarm(B, {}); }
    yield* A.path(B);
    return 'path';
  };
  // ---------------------------------------------------------------- BEAT 2: the path -- round the inn's end to the footpath; ahead in the lantern's light the four of them; her line; the choice
  A.path = function* (B) {
    var Rm = R(), R0 = B.roam, f = R0.flags, st = D.counter.state(B);
    f.pathStand = 1;
    var Y = A.cast(B, f, A.PATH.half);
    if (A.elsbethState(f) === 'earned') { Y.elsbeth = In.unit(B, { id: 'elsbethPath', kind: 'commonerwoman', at: [In.DOORS.lake[0] + 1, In.DOORS.lake[1] + 1], name: 'Elsbeth', face: [1, 0], lantern: true }); Y.elsbeth.bystander = true; f.elsbethLantern = 1; }
    yield* Rm.walkTo(B, A.PATH.head);
    yield* B.camTo({ gx: A.PATH.half[0], gy: A.PATH.half[1], gz: 0 }, D.iso.zoom, 24);
    if (Y.elsbeth) yield* In.card(B, [A.LINES.elsbethLantern], 300);
    Y.gennet.facing = D.spr.facingFor(-1, 0);
    yield* In.card(B, [A.LINES.gennetPath], 420);
    var a = yield* In.ask(B, 'ON THE PATH', [A.LINES.gennetPath], [A.LINES.opts.stand, A.LINES.opts.take, A.LINES.opts.strike]);
    A.trail('on the path: ' + ['stand aside', 'take the child', 'strike'][a]);
    if (a === 0) { yield* In.card(B, [A.LINES.stand], 300); yield* A.due(B, Y, true); return; }
    yield* In.card(B, [a === 1 ? A.LINES.take : '{r}Steel.{/}'], 240);
    var o = yield* A.fight(B, Y);
    if (o === 'lost') return;
    if (o === 'won') { f.gennetDead = 1; A.trail('Gennet killed on the path'); yield* A.saved(B, Y, true); return; }
    if (o === 'yielded') {
      f.gennetYield = 1; yield* In.card(B, [A.LINES.yielded], 420);
      if (Y.doran && B.units.indexOf(Y.doran) >= 0) { if (Y.doran.hp > 0) yield* In.card(B, [A.LINES.doranYield], 300); }
      var b = yield* In.ask(B, 'THE CHILD', [A.LINES.childLeft], [A.LINES.opts.take, A.LINES.opts.leave]);
      if (b === 0) { yield* A.saved(B, Y, false); return; }
      yield* A.due(B, Y, false); return; // (left on the path: the lantern goes on down with her -- Gennet stands up and takes her)
    }
    // the party got out (escaped): the lantern goes on
    yield* A.due(B, Y, true);
  };
  // ---------------------------------------------------------------- BEAT 3: Gennet on the path (one fight at a time, deep16/signature-fights.md): the roam's own fight on the floor's squares
  A.fight = function* (B, Y) {
    var Rm = R(), R0 = B.roam, f = R0.flags, F = B.fight, keep = {};
    ['runWhenHurt', 'fledEnds', 'loosen', 'exit', 'noFlee'].forEach(function (k) { keep[k] = F[k]; });
    F.runWhenHurt = null; F.fledEnds = false; F.loosen = null; F.exit = []; F.noFlee = true;
    Y.gennet.flees = false; delete Y.gennet.roamAside;
    // a blow at a boy brings Doran (the hurt hook, for this fight): the SRD Commoner with a woodaxe, from the lake door, at the fight's edge
    var hurt0 = B.hurt, self = B;
    B.hurt = function (u, n, type, src) { var r = hurt0.apply(this, arguments); if (u && u.boy && n > 0 && !Y.doran && !f.doranFights) { Y.doran = A.doranIn(self, Y); } return r; };
    R0.fights++; R0.lastOutcome = null;
    try { D.music('boss'); } catch (e) { }
    yield* Rm.engage(B, { foes: [Y.gennet], why: 'path', zone: null }, false, 'path');
    var o = R0.lastOutcome;
    B.hurt = hurt0;
    Object.keys(keep).forEach(function (k) { if (keep[k] === undefined) delete F[k]; else F[k] = keep[k]; });
    if (Y.doran && B.units.indexOf(Y.doran) >= 0 && Y.doran.hp <= Y.doran.maxhp / 2 && Y.doran.hp > 0) f.doranYield = 1;
    if (Y.doran && (Y.doran.hp <= 0 || Y.doran.dead)) f.doranDead = 1;
    return /^(lost|lose|dead|ko)$/.test(String(o)) ? 'lost' : o === 'won' ? 'won' : o === 'yielded' ? 'yielded' : 'escaped';
  };
  A.doranIn = function (B, Y) {
    var f = B.roam.flags, d = In.unit(B, { id: 'doranPath', kind: 'doran', at: [In.DOORS.lake[0] + 1, In.DOORS.lake[1]], name: 'Doran Waterby', face: [1, 0], foe: true });
    d.flees = false; d.yields = true; f.doranFights = 1;
    d.initRoll = 1; if (B.order && B.order.indexOf(d) < 0) B.order.push(d); // (of this fight, at the back of the order: js/roam.js R.fight walks B.order by index)
    B.card(D.roam.wrap([A.LINES.doran]), 360);
    return d;
  };
  // the crook of light guards the child: Gennet's own turn -- her Spiritual Weapon at whoever of them is nearest the child (its swing from beside the target), Shield of Faith on herself first; the cleric's tactics for the rest
  (D.scripts = D.scripts || {}).gennet = function* (B, u) {
    var kid = B.units.filter(function (w) { return w.id === u.guards; })[0], hs = D.ai && D.ai.heroes ? D.ai.heroes(B, u) : [], T = u.turn;
    var list = function () { return (D.magic && D.magic.list ? D.magic.list(B, u) : []).filter(function (x) { return x.ok; }); };
    if (!u.sof && T.action && list().some(function (x) { return x.id === 'shieldoffaith'; })) { u.sof = true; yield* B.exec(u, { do: 'cast', id: 'shieldoffaith', slot: 1, target: u }); }
    if (kid && hs.length && (T.bonus || T.action)) {
      var near = hs.slice().sort(function (a, b) { return G.dist(kid, a) - G.dist(kid, b); })[0];
      var sw = list().filter(function (x) { return x.id === 'spiritualweapon'; })[0];
      if (near && sw && G.dist(kid, near) <= 15) { yield* B.exec(u, { do: 'cast', id: 'spiritualweapon', slot: sw.slot || 2, target: near }); }
    }
    if (D.tactics && (T.action || T.move)) yield* D.tactics.turn(B, u);
  };
  // TAKE THE CHILD: she goes with whoever took her hand (into the party's token for the night); the due has no offering
  A.saved = function* (B, Y, afterKill) {
    var R0 = B.roam, f = R0.flags, t = R0.token;
    f.offeringSaved = 1; f.dueStopped = 1;
    if (Y.kid) In.gone(B, Y.kid); Y.kid = null;
    yield* In.card(B, [A.LINES.childTaken.split('{name}').join(t.name)], 360);
    A.trail('the child taken' + (afterKill ? ' over Gennet\'s body' : ' after the yield'));
    if (!afterKill && A.standing(B, Y.gennet)) { yield* A.offerGennet(B, Y); return; } // (the inn lady alive on the path: the nearest offering, below)
    yield* A.rise(B, Y);
  };
  A.standing = function (B, u) { return !!u && B.units.indexOf(u) >= 0 && u.hp > 0 && !u.dead; };
  // ---------------------------------------------------------------- THE NEAREST OFFERING (RULED 11-05, Griz: "yes the lean - if the party goes back and she doesn't make it, he'll still rent them
  // rooms (dinners are over)", on the seat's lean to his "I meant the chuul might find Gennet the nearest offering if the party has ushered the child back inside"): cheated of the
  // stone, the thing in the lake goes for the nearest offering, and while Gennet lives that is Gennet, sitting yielded on the path with her lantern. The child in the party's keeping:
  // TAKE HER INSIDE -- up to the lake door, and the water heaves behind them: GO BACK FOR HER or LET THE LAKE HAVE HER (it comes up onto the path and takes her: `gennetTaken`, `gennetLet`
  // -- "You'll want the road", no rooms); or STAY AT THE WATER. Either way back at the shore it is the fight, Gennet its first target while she stands (js/ai.js `wantsOffering`), the
  // ring's rounds still binding it to the ring; downed, she is taken and it goes down with her (`gennetTaken`: Doran still lets the rooms, and nobody cooks)
  A.offerGennet = function* (B, Y) {
    var Rm = R(), R0 = B.roam, f = R0.flags;
    if (Y.gennet && D.spr.anim(Y.gennet.sheet, 'sit')) { Y.gennet.anim = 'sit'; Y.gennet.animT = B.t; } // (she sits yielded on the path: her own sheet's Sit, gennet_p2 -- 11-05, the Waterby cutter)
    var a = yield* In.ask(B, 'THE CHILD', [A.LINES.withChild], [A.LINES.opts.inside, A.LINES.opts.water]);
    A.trail('the child: ' + (a === 0 ? 'taken in through the lake door' : 'kept at the water'));
    if (a === 0) {
      yield* Rm.walkTo(B, [In.DOORS.lake[0] + 1, In.DOORS.lake[1]]);
      yield* A.surface(B, Y);
      var b = yield* In.ask(B, 'THE WATER HEAVES', [A.LINES.inside], [A.LINES.opts.goBack, A.LINES.opts.letLake]);
      A.trail(b === 1 ? 'the lake let have her' : 'back for her');
      if (b === 1) {
        yield* A.takesHer(B, Y);
        f.gennetTaken = 1; f.gennetLet = 1;
        A.clear(B, Y); yield* A.ends(B); return;
      }
      f.gennetWent = 1;
    } else yield* A.surface(B, Y);
    yield* Rm.walkTo(B, [A.STONE[0] - 2, A.STONE[1]]);
    var ring = A.hasRing(B);
    yield* In.card(B, [A.LINES.gennetFirst].concat(ring ? [A.LINES.riseRing] : [A.LINES.riseNoRing]), 480);
    if ((yield* A.meet(B, Y, ring)) === 'lost') return;
    A.clear(B, Y);
    yield* A.ends(B);
  };
  // LET THE LAKE HAVE HER: on the map's camera it comes up out of the shallows onto the path to where she sits; the lantern goes into the water
  A.takesHer = function* (B, Y) {
    var g = Y.gennet, c = Y.chuul; if (!g || !c) return;
    yield* B.camTo({ gx: g.x, gy: g.y, gz: 0 }, D.iso.zoom, 30);
    yield* In.walk(B, c, [g.x + 1, g.y - 1], [-1, 0]);
    yield* In.card(B, [A.LINES.letTaken], 480); D.sfx('splash');
    if (D.fx) D.fx.sparkle(g, 'blue', 30); In.gone(B, g); Y.gennet = null; yield 30;
    yield* In.walk(B, c, A.DEEP.slice(), [1, 0]); In.gone(B, c); Y.chuul = null; yield 20;
  };
  // the water off the point heaves: it comes halfway up and waits (the rise's first beat, on the map's camera)
  A.surface = function* (B, Y) {
    var f = B.roam.flags;
    yield* B.camTo({ gx: A.STONE[0], gy: A.STONE[1], gz: 0 }, D.iso.zoom, 30);
    yield* In.card(B, [A.LINES.rise], 480);
    Y.chuul = In.unit(B, { id: 'lakeChuul', kind: 'chuul', at: A.DEEP.slice(), name: 'The thing in the lake', face: [-1, 0], foe: true }); Y.chuul.flees = false;
    if (D.fx) D.fx.sparkle(Y.chuul, 'blue', 30); D.sfx('splash'); yield 40;
    f.chuulSeen = 1;
  };
  // ---------------------------------------------------------------- BEAT 4: the stone -- the due with its offering, or the lake rising at the hour anyway
  A.due = function* (B, Y, offering) {
    var R0 = B.roam, f = R0.flags;
    if (Y.gennet && B.units.indexOf(Y.gennet) >= 0) { Y.gennet.anim = 'idle'; delete Y.gennet.roamAside; }
    yield* A.walkAll(B, Y, [A.STONE[0] - 1, A.STONE[1]]);
    yield* B.camTo({ gx: A.STONE[0], gy: A.STONE[1], gz: 0 }, D.iso.zoom, 24);
    yield* In.card(B, [f.glamourBroken || f.glamourSeen ? A.LINES.stone : A.LINES.stoneGoblin], 480); D.sfx('splash');
    if (Y.kid) { if (D.fx) D.fx.sparkle(Y.kid, 'blue', 24); In.gone(B, Y.kid); Y.kid = null; }
    f.duePaid = 1; f.dueSeen = 1; A.trail('the due paid at the stone');
    yield 40;
    yield* A.walkAll(B, Y, [In.DOORS.lake[0] + 1, In.DOORS.lake[1]]);
    A.clear(B, Y);
    if ((yield* A.ringWarm(B, Y, true)) === 'lost') return; // (the ring warm after the take: GO DOWN TO THE POINT -- the party stood out of the light on the path)
    yield* A.ends(B);
  };
  A.rise = function* (B, Y) {
    var R0 = B.roam, f = R0.flags, t = R0.token;
    yield* A.surface(B, Y);
    var near = Math.max(Math.abs(t.x - A.STONE[0]), Math.abs(t.y - A.STONE[1])) <= A.SHORE, ring = near ? A.hasRing(B) : null;
    if (!near) { yield* In.card(B, [A.LINES.riseNone].concat(Y.elsbeth ? [A.LINES.elsbethThat] : []), 420); A.trail('the lake rose: nobody at the shore'); In.gone(B, Y.chuul); Y.chuul = null; A.clear(B, Y); yield* A.ends(B); return; }
    // at the shore it fights, ring or not (RULED 11-05, his "Yes, the leans", on the seat's lean to his note "I don't think the chuul would back down because the party isn't
    // ready"): no ring, the warning (the first game's own, lake.risesNoRing's "and you are not ready for it") and the fight as the SRD has the chuul and its frog -- the ring's
    // rounds are the party's edge, not the gate; getting clear of the water ends it (the floor's way out, A.lakeFight's noFlee off)
    if (!ring) { yield* In.card(B, [A.LINES.riseNoRing], 480); A.trail('the lake rose: no ring, it came up onto the point'); }
    else yield* In.card(B, [A.LINES.riseRing], 360);
    if ((yield* A.meet(B, Y, ring)) === 'lost') return;
    A.clear(B, Y);
    yield* A.ends(B);
  };
  // the chuul met (the rise at the shore, the ring warm after the due, the rowboat): the fight, and what it leaves -- won, the deep is only water and the corpse's gift; 'lost' the
  // party down (the floor's own end); 'escaped' clear of the water
  A.meet = function* (B, Y, ring) {
    var f = B.roam.flags, st = D.counter.state(B);
    var o = yield* A.lakeFight(B, Y, ring);
    if (o === 'lost') return o;
    if (f.gennetTaken && Y.chuul && Y.chuul.fled) { A.trail('the inn lady taken: it went down with her'); return 'taken'; } // (it has its offering: down with her, the frog's fight its own end)
    if (o === 'won') { f.lakeDone = 1; A.trail('the thing in the lake killed' + (ring ? '' : ', no ring')); yield* In.card(B, [].concat(L('lake.after')), 480); if (!f.lakeGiftGot) { var id = In.giftId(st); D.counter.give(st, id, 1); f.lakeGiftGot = 1; D.sfx('chest'); yield* In.card(B, [L('lake.corpseGift'), L('g.got', { item: DS.DATA.items[id].name })], 420); } }
    else { A.trail('the party got clear of the lake'); }
    return o;
  };
  // ---------------------------------------------------------------- THE TAKE's pieces (11-06; the ruling at A.lakeFight below)
  // the deep: every square of its body on the grid's deep water (the 'Y' off the point -- js/inn.js; the lake knee-shallow elsewhere)
  A.inDeep = function (u, x, y) { return G.foot(u, x == null ? u.x : x, y == null ? u.y : y).every(function (q) { var s = G.map.at(q[0], q[1]); return !!(s && s.deep); }); };
  // struck at on the way, or hurt: the offering refused -- it lets her fall from the claw beside it (js/battle.js clawDrop), and from now it is the chuul of the SRD, fighting the party
  A.turned = function (B, Y, by) {
    var c = Y.chuul, g = Y.gennet; if (!c || !c.take || c.take.off) return;
    c.take.off = true; c.script = null; c.wantsOffering = false;
    var held = !!(g && g.inClaws && g.inClaws.by === c.id);
    if (g && g.conds.restrained && g.conds.restrained.by === c.id) B.release(c, g);
    if (g && g.inClaws && g.inClaws.by === c.id) { B.clawDrop(g); c.holding = (c.holding || []).filter(function (w) { return w !== g; }); } // (out of the claws whatever holds her now -- a Web over the two of them takes her restrained for its own, 11-06 evening)
    if (g && D.spr.anim(g.sheet, 'sit')) { g.anim = 'sit'; g.animT = B.t; } // (she sits where she fell, yielded still)
    A.trail('the thing in the lake struck at on the way' + (held ? ', Gennet in its claws: it dropped her' : '') + ' -- it fights');
    B.card(['{r}The thing in the lake{/} ' + (held ? 'lets {y}' + g.name + '{/} fall from its claw' : 'turns from the offering') + (by && by.name && by !== g ? ' and turns on {y}' + (by.side === 'foe' ? D.Battle.nm(by, true) : by.name) + '{/}.' : ' and turns on you.')], 320);
  };
  // in the deep with her, never struck at: the offering taken -- the card and the splash, and the two go down together, faded out where they went (js/ui.js unitObj: `fled` with its hit
  // points, never drawn lying), she still in its claws
  A.taken = function (B, Y) {
    return function* (Bt, c) {
      var f = B.roam.flags, g = Y.gennet;
      f.gennetTaken = 1; c.take.off = true; c.script = null;
      if (g) { g.goneDown = true; g.dead = true; g.fled = true; g.deadT = Bt.t; delete g.conds.restrained; }
      c.holding = []; c.goneDown = true; c.dead = true; c.fled = true; c.deadT = Bt.t;
      A.trail('the offering taken: it went down into the deep with Gennet, never struck at');
      if (D.fx) D.fx.sparkle(c, 'blue', 30); D.sfx('splash');
      Bt.card(D.roam.wrap([A.LINES.fightTaken]), 480); yield 50;
    };
  };
  // its turn while it takes her (D.scripts.lakeTake): up to her, the grab, the walk into the deep -- one square at a time, so a blow on the way stops it where it is
  function* takeStep(B, u, path) {
    for (var i = 0; i < path.length; i++) {
      if (!u.take || u.take.off || u.dead || u.hp <= 0) return;
      var nx = path[i][0], ny = path[i][1], cost = G.stepCost(u, u.x, u.y, nx, ny);
      if (!(u.turn.move >= cost)) return;
      yield* B.moveAlong(u, [[nx, ny]], { spend: true });
    }
  }
  A.grab = function* (B, c, g, pin) {
    g.conds.restrained = { dc: pin.grapple.dc, by: c.id, grapple: true, only: true };
    c.holding = (c.holding || []).concat([g]);
    D.sfx('poison'); if (D.fx && D.fx.ring) D.fx.ring(g, 'bone', 26);
    B.card(['{r}The thing in the lake{/} has {y}' + g.name + '{/}: {o}IN ITS CLAWS{/}  {g}(it makes for the deep with her: strike at it, or the lake has its offering){/}'], 300);
    yield* B.clawIn(c, g);
  };
  (D.scripts = D.scripts || {}).lakeTake = function* (B, u) {
    var tk = u.take, g = tk && tk.g, T = u.turn, AIx = D.ai;
    var gone = function () { return !g || B.units.indexOf(g) < 0 || g.dead || g.hp <= 0; };
    if (!tk || tk.off || gone()) { u.script = null; if (tk) tk.off = true; yield* AIx.brute(B, u); return; }
    // the Ring of Binding's round: it must turn on the wearer (data/fights.js chuul.ring) -- this turn the brute's, at the wearer, her in its claws all the while; the take goes on after it
    if (B.taunt && B.taunt.rounds.indexOf(B.round) >= 0 && G.standing(B.taunt.u)) { yield* AIx.brute(B, u); return; }
    if (!tk.said) { tk.said = true; B.card(['{r}' + u.name + '{/} turns toward {y}' + g.name + '{/}: the nearest offering.']); yield 20; }
    if (A.holdShow) B.units.forEach(function (w) { if (w.side === 'party') w.reaction = 0; }); // (the show's held hands: no opportunity attack as it passes)
    var pin = u.attacks.pincer, held = function () { return !!(g.inClaws && g.inClaws.by === u.id); };
    if (!held()) {
      var rch = G.reachOf(u, pin.reach);
      if (G.dist(u, g) > rch && T.move > 0) { var rm = G.reach(u, T.move), e = AIx.approach(u, g, rm, rch), pth = e && G.path(rm, e.x, e.y); if (pth && pth.length) yield* takeStep(B, u, pth); }
      if (tk.off || u.dead || u.hp <= 0) return;
      if (G.dist(u, g) <= rch && T.action) {
        T.action = 0;
        var grab = Object.assign({}, pin, { noDamage: true }); // (no harm: the grab is the take -- the ruling at A.lakeFight)
        for (var n = 0; n < 2 && !held() && !tk.off && !gone(); n++) { // (its Multiattack's two pincers, both at her till one holds)
          var hit = false, dS = D.d; if (A.holdShow) D.d = function (k) { return k === 20 ? 18 : dS.apply(this, arguments); }; // (the show's grab: the d20 pinned)
          try { yield* B.attack(u, g, grab, { onHit: function () { hit = true; } }); } finally { D.d = dS; }
          if (hit && !tk.off && !gone()) yield* A.grab(B, u, g, pin);
          if (u.dead || u.hp <= 0) return;
        }
      }
    }
    if (!held() || tk.off) return;
    // the carry: back into the deep by the way that costs least, as far as the half speed goes this turn
    if (!A.inDeep(u)) {
      var far = G.reach(u, 400), goal = null, gc = Infinity;
      Object.keys(far).forEach(function (k) { var q = far[k]; if (q.stand && q.cost < gc && A.inDeep(u, q.x, q.y)) { gc = q.cost; goal = q; } });
      var route = goal && G.path(far, goal.x, goal.y);
      if (route && route.length) yield* takeStep(B, u, route);
    }
    if (!tk.off && held() && !u.dead && u.hp > 0 && A.inDeep(u)) yield* tk.done(B, u);
  };
  // the chuul fight on the floor's point end, the `chuul` fight's frog with it and the Ring of Binding's rounds laid on the floor's fight (js/battle.js enter's rule, for this fight);
  // with no ring worn, the chuul and its frog as the SRD has them (`ring` null)
  A.lakeFight = function* (B, Y, ring) {
    var Rm = R(), R0 = B.roam, F = B.fight, keep = {}, Fd = D.fight && D.fight('chuul');
    ['runWhenHurt', 'fledEnds', 'loosen', 'exit', 'noFlee'].forEach(function (k) { keep[k] = F[k]; });
    F.runWhenHurt = null; F.fledEnds = false; F.loosen = null; F.exit = []; F.noFlee = false;
    var at = Y.chuul ? [Y.chuul.x, Y.chuul.y] : A.DEEP;
    Y.frog = In.unit(B, { id: 'lakeFrog', kind: 'giantfrog', at: [at[0] - 1, at[1] + 2], name: 'Giant Frog', face: [-1, 0], foe: true }); Y.frog.flees = false;
    var rounds = (Fd && Fd.ring && Fd.ring.rounds) || [1, 4, 7, 10], con0 = ring && ring.saves ? ring.saves.con : null;
    if (ring) { if (ring.saves) { ring.saves = Object.assign({}, ring.saves); ring.saves.con += (Fd && Fd.ring && Fd.ring.con) || 3; } ring.ring = true; B.taunt = { u: ring, rounds: rounds }; }
    // the nearest offering (A.offerGennet): Gennet, yielded on the path, off the foes' side for this fight -- no turns, no yield to end it, a bystander to every AI (js/ai.js heroes).
    // THE TAKE (RULED 11-06, Griz to the lanes desk: "if it's been hurt, it'd fight" and "basically the only way it accepts Gennet as offering is if it gets up, grabs her and returns to the water
    // without being attacked"; read by the desk: an attack at it on the way -- hit or miss, an opportunity attack too -- turns it to the fight, and hurt before it rises it fights from the
    // first): its own turn, D.scripts.lakeTake above -- up to her, the pincer's grab (no harm in it: she is taken by the grab, not by a blow that drops her -- the offering goes down living, as
    // the child goes at the stone, and a blow to 0 would end the grip by the SRD short of the deep), the lunge and she is in its claws (js/battle.js clawIn), then the walk back into the deep
    // with her at half speed, square by square, the party's opportunity attacks as it goes. In the deep unattacked: taken (`gennetTaken`), the card and the splash, and it goes down with her
    // -- off the screen, never drawn dying (`fled` set only then). Struck at on the way (A.turned): it lets her fall from the claw and fights the party. A party Fireball that kills her is the
    // first ending's (`gennetDead`), as before
    var gn = A.standing(B, Y.gennet) ? Y.gennet : null, gKeep = gn ? { side: gn.side, bystander: gn.bystander, yields: gn.yields, script: gn.script, roamAside: gn.roamAside } : null, hurt0 = B.hurt, self = B, c = Y.chuul;
    var ownAtk = B.hasOwnProperty('attack'), atk0 = B.attack, ownExec = B.hasOwnProperty('exec'), exec0 = B.exec, RUx = D.rules, save0 = RUx.save;
    if (gn) {
      gn.side = 'offering'; gn.bystander = true; gn.offering = true; gn.yields = false; gn.script = null; gn.roamAside = true; // (roamAside: no turn of hers in the floor's fight -- js/roam.js R.fight's initiative; she sits)
      if (c && c.hp >= c.maxhp) { c.script = 'lakeTake'; c.take = { g: gn, done: A.taken(B, Y) }; c.wantsOffering = false; } // (whole when it rises: the take; hurt already, it fights from the first)
      else if (c) A.trail('the thing in the lake rose hurt: no take, it fights');
      var on = function () { return !!(c && c.take && !c.take.off); };
      // THE SHOW's take (A.BEATS 'take', A.holdShow): the four's hands held while it takes her -- each turn passed, no opportunity attack (lakeTake), its grab's d20 pinned -- and its frog
      // asleep; once it has gone down (or been struck at) the hands are the player's again
      if (A.holdShow && c && c.take) {
        Y.frog.conds.asleep = { by: 'show' };
        var heroT0 = B.hasOwnProperty('heroTurn') ? B.heroTurn : null;
        B.heroTurn = function* (u) { if (on()) { u.reaction = 0; self.card(['{c}THE SHOW{/}: ' + u.name + ' holds -- the hands held while it takes her.'], 160); yield 40; return; } return yield* D.Battle.prototype.heroTurn.apply(this, arguments); };
        c.take.unhold = function () { if (heroT0) B.heroTurn = heroT0; else delete B.heroTurn; };
      }
      B.hurt = function (u, n) {
        if (u === c && n > 0 && on()) A.turned(self, Y, self.active !== c ? self.active : null); // (a blow that lands from anything -- a spell's save, a fire, a flask)
        var r = hurt0.apply(this, arguments);
        if (u === gn && u.hp <= 0 && !R0.flags.gennetTaken && !R0.flags.gennetDead) { R0.flags.gennetDead = 1; A.trail('Gennet killed in the lake fight (not by it)'); } // (the party's own -- a Fireball catches her: killed, the first ending's; it fights on)
        return r;
      };
      B.attack = function* (att, tgt) { if (tgt === c && att !== c && on()) A.turned(self, Y, att); return yield* atk0.apply(this, arguments); }; // (hit or miss: struck at -- an opportunity attack as it walks too)
      // A SPELL THAT ONLY LAYS A CONDITION ON IT counts as striking at it too (RULED 11-06 evening, Griz to the lanes desk on the seat's call 3: "2 - count them"; read by the desk: anything cast
      // at it, or catching it in an area, that it must save against or that lays a condition on it, damage or not -- Web, Hypnotic Pattern and their kind): a save it makes while it takes her
      // (D.rules.save, whoever's turn it is -- a web it walks into is the party's spell catching it), and a cast by another after which it carries a condition it did not have (Sleep, no save)
      B.exec = function* (u, cmd) {
        var cast = !!(cmd && cmd.do === 'cast' && u !== c && on());
        if (cast && (cmd.target === c || (cmd.targets || []).indexOf(c) >= 0)) A.turned(self, Y, u); // (a spell aimed at it)
        var had = cast && c ? Object.keys(c.conds || {}) : null, r = yield* exec0.apply(this, arguments);
        if (had && on() && Object.keys(c.conds || {}).some(function (k) { return had.indexOf(k) < 0; })) A.turned(self, Y, u); // (a condition the cast laid on it)
        return r;
      };
      RUx.save = function (w) { if (w === c && on()) A.turned(self, Y, self.active && self.active !== c ? self.active : null); return save0.apply(this, arguments); }; // (a save it must make: the spell is on it)
    }
    R0.fights++; R0.lastOutcome = null;
    try { D.music('boss'); } catch (e) { }
    yield* Rm.engage(B, { foes: [Y.chuul, Y.frog], why: 'lake', zone: null }, false, 'lake');
    var o = R0.lastOutcome;
    B.hurt = hurt0; if (!ownAtk) delete B.attack; else B.attack = atk0; if (!ownExec) delete B.exec; else B.exec = exec0; if (RUx.save !== save0) RUx.save = save0;
    if (c) { if (c.take && c.take.unhold) c.take.unhold(); delete c.take; if (c.script === 'lakeTake') c.script = null; }
    if (gn && !R0.flags.gennetTaken && !R0.flags.gennetDead) { Object.assign(gn, gKeep); delete gn.offering; delete gn.inClaws; delete gn.goneDown; if (gn.conds.restrained && c && gn.conds.restrained.by === c.id) delete gn.conds.restrained; } // (she lives: back on the path as she sat)
    else if (gn) { In.gone(B, gn); Y.gennet = null; }
    B.taunt = null; if (ring) { if (ring.saves && con0 != null) ring.saves.con = con0; delete ring.ring; }
    Object.keys(keep).forEach(function (k) { if (keep[k] === undefined) delete F[k]; else F[k] = keep[k]; });
    return /^(lost|lose|dead|ko)$/.test(String(o)) ? 'lost' : o === 'won' ? 'won' : 'escaped';
  };
  // ---------------------------------------------------------------- THE CHUUL ON THE DUE'S OWN NIGHT (11-05, the Winters seat; the lane's §3, RULED 11-04: "with the ring on, the ring warm,
  // and it may go down to the point THAT NIGHT ... watch a child go to the water for your shot at the god"; beat 4, "the ring warm then cold by morning"): the due paid tonight -- the
  // quiet, the gold, LET IT BE (js/inn.js In.wagonNight), STAND ASIDE or a child left on the path (A.due) -- and the Ring of Binding worn: the first game's due.after, then GO DOWN
  // TO THE POINT or BACK TO BED; down, the party at the flat stone, the water heaves (lake.rises), it turns toward the ring (Sense Magic, lake.senseMagic), and the fight. BACK TO BED,
  // the ring cold by morning. With no ring nothing calls it back up tonight: it has eaten. Returns null (no ring, or nothing to warm it), 'bed', or the fight's end
  A.ringWarm = function* (B, Y, onPath) {
    var R0 = B.roam, f = R0.flags; Y = Y || {};
    if (f.lakeDone || !f.duePaid || f.ringWarmNight === (f.dueCycle || 0) + 1) return null;
    var ring = A.hasRing(B); if (!ring) return null;
    f.ringWarmNight = (f.dueCycle || 0) + 1; // (once a due night)
    var a = yield* In.ask(B, 'THE RING IS WARM', [].concat(L('due.after')), [A.LINES.opts.down, A.LINES.opts.bed]);
    A.trail('the ring warm after the due: ' + (a === 0 ? 'down to the point' : 'back to bed') + (onPath ? ' (from the path)' : ''));
    if (a !== 0) return 'bed';
    yield* R().walkTo(B, [A.STONE[0] - 2, A.STONE[1]]); // (by the flat stone, as the rise's beat stands them: the frog comes up on the square past it)
    yield* B.camTo({ gx: A.STONE[0], gy: A.STONE[1], gz: 0 }, D.iso.zoom, 30);
    yield* In.card(B, [L('lake.rises')], 420);
    Y.chuul = In.unit(B, { id: 'lakeChuul', kind: 'chuul', at: A.DEEP.slice(), name: 'The thing in the lake', face: [-1, 0], foe: true }); Y.chuul.flees = false;
    if (D.fx) D.fx.sparkle(Y.chuul, 'blue', 30); D.sfx('splash'); yield 40;
    f.chuulSeen = 1;
    yield* In.card(B, [L('lake.senseMagic')], 360);
    var o = yield* A.meet(B, Y, A.hasRing(B) || ring);
    if (o === 'lost') return o;
    A.clear(B, Y);
    if (!onPath) { yield* R().walkTo(B, [In.DOORS.lake[0] + 1, In.DOORS.lake[1]]); yield* In.card(B, [A.LINES.ringWarmBack], 240); }
    return o;
  };
  // the rowboat by day (the first game's S.rowboat; the lane's §3, RULED 11-04: "The rowboat by day stays the other way to the chuul"): LEAVE IT, or PUSH OUT AND SOUND THE DEEP --
  // the line goes down and down, and something comes up with it; the fight, ring or not (the ring's rounds if it is worn), off the boat's end of the point
  A.BOAT = [45, 22];
  A.sound = function* (B) {
    var R0 = B.roam, f = R0.flags, Y = {};
    if (f.lakeDone) { B.card(D.roam.wrap([L('lake.quiet')]), 320); yield 20; return; }
    var a = yield* In.ask(B, 'THE ROWBOAT', [L('lake.boatAsk')], [A.LINES.opts.leaveIt, A.LINES.opts.sound]);
    A.trail('the rowboat: ' + (a === 1 ? 'pushed out and sounded the deep' : 'left'));
    if (a !== 1) return;
    yield* B.camTo({ gx: A.BOAT[0], gy: A.BOAT[1], gz: 0 }, D.iso.zoom, 24);
    yield* In.card(B, [L('lake.woken')], 420);
    var ring = A.hasRing(B);
    Y.chuul = In.unit(B, { id: 'lakeChuul', kind: 'chuul', at: [A.BOAT[0] + 2, A.BOAT[1] - 1], name: 'The thing in the lake', face: [-1, 0], foe: true }); Y.chuul.flees = false;
    if (D.fx) D.fx.sparkle(Y.chuul, 'blue', 30); D.sfx('splash'); yield 40;
    f.chuulSeen = 1;
    yield* In.card(B, [L(ring ? 'lake.rises' : 'lake.risesNoRing')].concat(ring ? [L('lake.senseMagic')] : []), 420);
    if ((yield* A.meet(B, Y, ring)) === 'lost') return;
    A.clear(B, Y);
  };
  // ---------------------------------------------------------------- BEAT 5: the ends -- the flags set, the morning reads them (In.actMorning); back to bed
  A.ends = function* (B) {
    var Rm = R(), R0 = B.roam, f = R0.flags;
    f.secondActDone = 1;
    yield* Rm.walkTo(B, [In.DOORS.lake[0] + 1, In.DOORS.lake[1]]);
    yield* In.card(B, [In.WN.back], 240);
    In.stage(B, [24, 17], 'inn');
  };
  A.morning = function (f) { // (the morning's line by the end: the due paid is the wagon's own mornings, js/inn.js)
    if (f.gennetTaken) return f.gennetLet ? A.LINES.mornTakenLet : A.LINES.mornTakenTried; // (the lake took the inn lady, 11-05: let, or tried for -- his "he'll still rent them rooms (dinners are over)")
    if (f.lakeDone) return f.doranAway ? A.LINES.mornLakeAway : A.LINES.mornLake; // (the yard stopped, Doran drove the children to Newland that night: not at the water in the morning -- 11-05)
    if (f.doranDead) return A.LINES.mornDoranDead;
    if (f.gennetDead) return A.LINES.mornDead;
    if (f.dueStopped) return A.LINES.mornStopped;
    return null;
  };
  // a quiet night's or the gold's morning when the thing in the lake died that night: the lake's morning first, then what the wagon's own morning says past its first word and the inn lady's hum
  A.lakeMorning = function (wagonMorning) { return A.LINES.mornLake + ' ' + String(wagonMorning || '').replace(/^Morning\.\s*/, '').replace(/\s*The inn lady hums at the stove\.\s*/, ' ').trim(); };

  // ---------------------------------------------------------------- §10.4 the wand, in the kitchen only (js/inn.js M.SCENES.elsbeth's push): Gennet named a fraud to her face -- the hand in the
  // apron, the flee word (Command, WIS 15) on the one who spoke, the cone (Fear, WIS 15) if the rest press; nobody hurt, the kitchen empty, she is done for the night
  A.wand = function* (sc, B, st, f) {
    var R0 = B.roam, lead = R0.token, name = lead.name;
    var sv = function (h) { var r = In.d20(), b = DS.R.saveBonus(h, 'wis'), ok = r + b >= 15; In.trail((h.name || h.id) + ' WIS save ' + r + (b >= 0 ? ' + ' : ' - ') + Math.abs(b) + ' vs DC 15 (the wand)' + (ok ? ', held' : ', failed')); return ok; };
    f.elsbethPushed = 1; f.wandOut = 1;
    yield sc.say([A.LINES.wandPush.split('{name}').join(name), A.LINES.wandOut]);
    var held = sv(lead.src || lead), walk = !held;
    yield sc.say([(held ? A.LINES.wandHold : A.LINES.wandFlee).split('{name}').join(name)]);
    var rest = R0.members.filter(function (u) { return u !== lead && u.hp > 0; });
    if (rest.length) {
      var p = yield sc.ask('The rest of you.', [A.LINES.opts.press, A.LINES.opts.back]);
      if (p === 0) { rest.forEach(function (u) { sv(u.src || u); }); walk = true; yield sc.say([A.LINES.wandCone]); }
    }
    In.wandWalk = walk;
    A.trail('the wand out in the kitchen' + (walk ? ': out of it' : ', the word held'));
  };

  // ---------------------------------------------------------------- the show: deep16/?show=secondact&beat=<id>&case=<case> -- a NEW GAME's four staged on the floor at the beat, the dice pinned
  A.BEATS = [
    { id: 'signs', beat: 'fork', label: 'BEAT 1: THE DUE\'S NIGHT (day 15) -- the singing wakes you, the signs, the fork (11-05)', note: 'Three nights after the wagon (RULED 11-05), past midnight, the house asleep. Low singing wakes the party (its best passive Perception, DC 13); then the signs from there with their reads (the dice pinned: the lake flat seen, the bow-wave caught), and the fork card: THE LANTERN or LET IT BE.', flags: {}, dice: [19, 19, 19] },
    { id: 'path', beat: 'path', label: 'BEAT 2: the path -- Gennet and the child in the lantern\'s light', note: 'The four at the path\'s head by the lake door; ahead at its half-way Gennet with the shore-lantern and the child (the boys stay in, 11-05). "Stand out of the light." STAND ASIDE (the due at the stone: the take), TAKE THE CHILD or STRIKE (the fight on the path).', flags: { wagonOutcome: 'inn' } },
    { id: 'pathearned', beat: 'path', label: 'BEAT 2 with Elsbeth EARNED: her lantern behind you', note: 'The same path with Elsbeth\'s third tier reached at the tub: she comes behind with the kitchen lantern -- "You\'ll want this. I\'m not going nearer."', flags: { wagonOutcome: 'inn', elsbethTier: 3, elsbethTold: 1, dishes: 1 } },
    { id: 'fight', beat: 'path', label: 'BEAT 3: Gennet on the path -- the crook of light, the yield at half', note: 'STRIKE on the path: Gennet opens with Shield of Faith, the crook of light stands over the child and strikes whoever comes near her, Hold Person, the cold through your boots, the daggers when she must. At half she yields and sits: TAKE THE CHILD or LEAVE HER. (The boys stay in, so the child is the only bystander, and she lends no one a flank.)', flags: { wagonOutcome: 'inn' }, strike: true },
    { id: 'risering', beat: 'rise', label: 'BEAT 4: the rise with the ring warm -- the thing in the lake', note: 'The child taken, the lead wearing the Ring of Binding: the water off the point heaves, it comes halfway up and waits -- it turns toward the ring, and the fight on the point with its frog; the ring\'s rounds. Won: the deep is only water, the corpse\'s gift.', flags: { wagonOutcome: 'inn', offeringSaved: 1, dueStopped: 1, gennetYield: 1 }, ring: true },
    { id: 'risenoring', beat: 'rise', label: 'BEAT 4: the rise at the shore without the ring -- it fights (11-05)', note: 'The child taken, the party at the flat stone, no ring worn: the water off the point heaves, it comes halfway up -- "Cheated of the stone, it does not go down. It comes up onto the point at whatever stands there -- and you are not ready for it." -- and the fight with its frog, the chuul as the SRD has it, no ring\'s rounds. Get clear of the water and it ends.', flags: { wagonOutcome: 'inn', offeringSaved: 1, dueStopped: 1, gennetYield: 1 } },
    { id: 'offerinside', beat: 'offer', label: 'THE NEAREST OFFERING: the child taken inside, the inn lady left on the path (11-05)', note: 'Gennet yielded and sitting on the path with her lantern, the child\'s hand in yours. TAKE HER INSIDE: up to the lake door -- the water off the point heaves behind you. GO BACK FOR HER: down to the stone, and it turns toward the one on the path, not you; shield her (stand between, kill it first) or it takes her and goes down with her -- then Doran lets you rooms and nobody cooks. LET THE LAKE HAVE HER: it comes up onto the path and takes her, the lantern into the water -- "You\'ll want the road."', flags: { wagonOutcome: 'inn', gennetYield: 1 } },
    { id: 'offerwater', beat: 'offer', label: 'THE NEAREST OFFERING: STAY AT THE WATER, the inn lady its first target (11-05)', note: 'The same, STAY AT THE WATER: the party by the flat stone, the water heaves, and it goes for Gennet first -- "It does not turn toward you. It turns toward the one on the path: the nearest offering." The ring\'s rounds still turn it on the wearer (this beat: no ring).', flags: { wagonOutcome: 'inn', gennetYield: 1 }, water: true },
    { id: 'take', beat: 'offer', hold: true, label: 'THE TAKE: STAY AT THE WATER, the four\'s hands held -- it comes up, takes her in its claws and goes down (11-06)', note: 'Gennet yielded on the path, the child taken. Answer STAY AT THE WATER: the party by the flat stone, the water heaves, and it comes for her. THE SHOW holds the four\'s hands while it takes her (its frog left asleep): it comes up over the rocks, its pincer closes on her (the d20 pinned) -- the lunge, out to her and back to its own square, and she is in its claws, lifted at its side -- then back into the deep with her at half speed, and it goes down: "It has her." The two fade out where they went; nothing is drawn dying. The other way is the beat before, STAY AT THE WATER with your hands: strike at it on the way (an opportunity attack counts) and it lets her fall from the claw and fights you.', flags: { wagonOutcome: 'inn', gennetYield: 1 } },
    { id: 'poison', beat: 'poison', label: 'THE POISON DINNER: one asleep at the table, the fight inside, Doran\'s confession (11-05)', note: 'Day 15 at six, the wagon stopped on the road three days ago, so the Waterbys kept no child: supper is the draught. The tells are each hero\'s own (Medicine 13 tastes it, Insight 15 sees the inn lady not eat). The dice pinned: the first to eat fails the CON save (DC 13) and goes down at the table, the rest make it -- the fight in the common room to submission (the first yield ends it), then Doran: "There\'s a thing in the lake ..." -- his bucket over the sleepers, and he leads you out back to the stone: the rise, the fight at the shore.', flags: { wagonOutcome: 'road', dueOff: 'none' }, dice: [2, 19, 19, 19] },
    { id: 'poisonall', beat: 'poison', label: 'THE POISON DINNER: all asleep -- the drag, and awake on the stone (11-05)', note: 'The same supper, every save failed: the table tilts away. The drag, ten minutes, a save every two (the dice pinned: the first makes three of five, +3). On the stone as the water heaves, each saves again with its bonus: the first wakes, the rest sleep on -- shake them awake (HELP) while it comes up out of the deep; three rounds with nobody up and it takes one.', flags: { wagonOutcome: 'road', dueOff: 'none' }, dice: [2, 2, 2, 2, 19, 19, 19, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 12, 2, 2, 2] },
    { id: 'risenone', beat: 'rise', label: 'BEAT 4: the rise with nobody at the shore', note: 'The child taken and the party back at the path\'s head: the water heaves, nothing stands on the stone, it goes down. The god seen: Elsbeth\'s third tier is yours for nothing after.', flags: { wagonOutcome: 'inn', offeringSaved: 1, dueStopped: 1, gennetYield: 1 }, far: true },
    { id: 'ringwarm', beat: 'fork', label: 'THE RING WARM after the due: LET IT BE, then down to the point (11-05)', note: 'The yard won, the lead wearing the Ring of Binding (Winters gives it at the lead\'s 3rd). The fork: LET IT BE -- the lantern walks, only the inn lady comes back. Then "The ring on your hand is warm. Go down to the point." -- GO DOWN TO THE POINT: at the flat stone the water heaves, it turns toward the ring, and the fight on the point with its frog; the ring\'s rounds. BACK TO BED: the ring cold by morning.', flags: { wagonOutcome: 'inn' }, dice: [19, 19, 19], ring: true },
    { id: 'standring', beat: 'path', label: 'STAND ASIDE with the ring on: the take, then the ring warm (11-05)', note: 'The path, the lead wearing the Ring of Binding. STAND ASIDE: the offering set on the flat stone, the take, the lantern back up the path alone -- then the ring warm: GO DOWN TO THE POINT, the fight; BACK TO BED, the morning.', flags: { wagonOutcome: 'inn' }, ring: true },
    { id: 'rowboat', beat: 'boat', label: 'THE ROWBOAT BY DAY: sound the deep (11-05)', note: 'Two in the afternoon on the point by the rowboat, no wagon tonight. LEAVE IT, or PUSH OUT AND SOUND THE DEEP -- "the worst decision available here": the line goes down and down, and something comes up with it. The fight off the boat\'s end of the point, ring or not (here, the lead wears it: the ring\'s rounds).', flags: {}, ring: true },
    { id: 'wand', beat: 'wand', label: 'ELSBETH\'S WAND in the kitchen', note: 'Day 12 at six, inside by the tub. E on Elsbeth: HELP WITH THE DISHES, then CALL GENNET A FRAUD -- the hand goes in the apron: the word, a WIS save at 15 (the dice pinned to fail), and you walk out of the kitchen; PRESS ON and the other word empties it. She is done for the night.', flags: {}, dice: [2, 2, 2, 2] }
  ];
  A.play = function (bt) {
    var H = D.house, rec = H.fresh(); rec.at = { town: null }; rec.silver = Math.max(rec.silver || 0, 60);
    rec.flags = Object.assign({ reachedInn: 1, mealHad: 1, gennetNamed: 1, wagonCycle: 0, dueCycle: 0, dueTonight: 1, kidTaken: 1, glamourBroken: 1, glamourSeen: 1, kidAtInn: 1, katGone: 1, wagonStopped: 'c0', wagonOutcome: 'inn', dueOffC: 0, dueOff: 'kept', secondAct: { beat: bt.beat, id: bt.id, strike: !!bt.strike, far: !!bt.far, fled: !!bt.fled, hold: !!bt.hold } }, bt.flags || {});
    if (bt.beat === 'wand') { delete rec.flags.wagonIn; delete rec.flags.dueTonight; delete rec.flags.doranAway; rec.flags.secondAct = null; } // (doranAway too, 11-05: six on day 12 is before the wagon, and with Doran gone and no ring Elsbeth only sends the party to Winters -- js/inn.js M.SCENES.elsbeth; his "all i'm getting from elsbeth is 'go see winters'")
    if (bt.beat === 'poison') { ['dueTonight', 'kidTaken', 'kidAtInn', 'glamourBroken', 'glamourSeen'].forEach(function (k) { delete rec.flags[k]; }); }
    if (bt.beat === 'boat') { ['wagonIn', 'dueTonight', 'kidTaken', 'kidAtInn', 'doranAway', 'wagonStopped'].forEach(function (k) { delete rec.flags[k]; }); } // (a day with no wagon: the rowboat's own)
    if (bt.ring) { var lead = rec.party[0]; if (lead && lead.equip) { lead.equip.ring = 'ringofbinding'; H.add(rec.inv, 'ringofbinding', 0); } }
    H.begin(rec, 0); var S = W.state && W.state(); if (S) S.t = bt.beat === 'wand' ? (In.WAGON.first - 1) * 24 + 18 : (In.dueDay(0) - 1) * 24 + (bt.beat === 'boat' ? 14 - 24 : bt.beat === 'poison' ? 18 : 23); // (the due's own night: day 15 since 11-05, three on from the first WAGON DAY -- js/inn.js In.DUE; the wand at six on day 12; the rowboat the afternoon before the due)
    In.pinned = bt.dice ? bt.dice.slice() : null;
    var at = bt.beat === 'wand' ? [32, 21] : bt.beat === 'poison' ? [24, 17] : bt.beat === 'boat' ? [A.BOAT[0], A.BOAT[1] - 1] : bt.beat === 'offer' ? A.PATH.head.slice() : bt.beat === 'rise' && bt.far ? A.PATH.head : bt.beat === 'rise' ? [A.STONE[0] - 2, A.STONE[1]] : bt.beat === 'path' ? [In.DOORS.lake[0] + 1, In.DOORS.lake[1]] : [In.WAGONAT[0] + 6, In.WAGONAT[1]];
    var nb = D.roam.make('?roam=' + In.KEY + (bt.beat === 'wand' || bt.beat === 'poison' ? '&inside' : ''), { save: H.living(H.cur), opts: { at8: at.slice() }, house: true });
    D.push(nb);
  };
  A.show = function (q) { return new D.roam.WetShow(q, { kind: 'actshow', beats: A.BEATS, play: A.play, title: '{y}THE SECOND ACT, 11-04{/} -- the signs, the fork, the path, the fight, the rise, the wand (a show)' }); };
  // the floor's script runs the staged beat first (a show's, or a bench's): f.secondAct { beat, strike, far, fled } -- cleared as it runs
  A.resume = function* (B) {
    var R0 = B.roam, f = R0.flags, s = f.secondAct; if (!s || !s.beat) return;
    f.secondAct = null; f.warmup = f.warmup || 0;
    if (s.beat === 'fork') { f.dueTonight = 1; f.warmup = 2; yield* In.card(B, [A.LINES.dueWoke], 300); yield* A.signs(B, 6, false); if ((yield* A.dueFork(B)) === 'lost') return; } // (the due's own night, woken by the singing: the signs, the fork -- A.dueNight)
    else if (s.beat === 'path') { if (s.strike) A.strikeNext = true; yield* A.path(B); }
    else if (s.beat === 'rise') { var Y = {}; yield* A.rise(B, Y); }
    else if (s.beat === 'boat') { yield* A.sound(B); return; } // (the rowboat by day: the floor goes on after)
    else if (s.beat === 'poison') { R0.stay = { t0: In.clock(B), hours: In.REST.dinnerHours, kind: 'dinner', long: true }; yield* A.poisonNight(B, In.day(D.roam.q)); return; } // (the poison dinner: a room with supper on the due's night, no offering)
    else if (s.beat === 'offer') { var Yo = A.cast(B, f, A.PATH.half); Yo.gennet.hp = Math.floor(Yo.gennet.maxhp / 2); Yo.gennet.anim = 'idle'; In.gone(B, Yo.kid); Yo.kid = null; f.offeringSaved = 1; f.dueStopped = 1; A.holdShow = !!s.hold; try { yield* A.offerGennet(B, Yo); } finally { A.holdShow = false; } } // (Gennet yielded on the path, the child taken: the nearest offering; the show's `hold`: the take with the four's hands held, A.lakeFight)
    var mornA = A.morning(f);
    if (f.secondActDone) { var mornL = mornA || A.LINES.mornDueKept; if (f.duePaid && !f.lakeDone && In.has(D.counter.state(B), 'ringofbinding')) mornL = mornL + ' ' + L('wagon.ringCold'); delete f.wagonIn; In.stage(B, [24, 17], 'inn'); yield* In.sleep(B, mornL); if (f.wagonGift) yield* M.talk(B, 'elsbeth', function (sc) { return In.gift(sc, B); }); }
  };
  var script0 = D.roam.script;
  D.roam.script = function* (B) {
    var def = D.roam.def; if (def && def.key === In.KEY && B.roam && B.roam.flags && B.roam.flags.secondAct) yield* A.resume(B);
    yield* script0.apply(this, arguments);
  };
})();
